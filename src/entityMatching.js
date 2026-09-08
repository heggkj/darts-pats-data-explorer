export function normalizeMatchText(value = '', preserveCase = false) {
  const text = preserveCase ? String(value) : String(value).toLowerCase();
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function createEntityRecognizer(dictionary, reviewedOccurrences = []) {
  const matchers = dictionary.map(e => ({...e, keys: [...new Set(e.aliases.map(a => normalizeMatchText(a, e.caseSensitive)))]}));
  const byId = new Map(dictionary.map(e => [e.id, e]));
  const overrides = new Map(reviewedOccurrences.map(r => [r.id, r]));
  return record => {
    const fields = [record.text, record.target, record.sender].filter(Boolean);
    const found = new Set();
    for (const field of fields) {
      const lower = ` ${normalizeMatchText(field)} `;
      const upper = ` ${normalizeMatchText(field, true)} `;
      const spans = [];
      for (const entity of matchers) {
        const text = entity.caseSensitive ? upper : lower;
        for (const alias of entity.keys) {
          let start = text.indexOf(` ${alias} `);
          while (start !== -1) {
            spans.push({id: entity.id, start, end: start + alias.length + 1});
            start = text.indexOf(` ${alias} `, start + 1);
          }
        }
      }
      // Resolve only competing spans, not every other mention in the record.
      for (const span of spans) if (!spans.some(other => other.id !== span.id && other.start <= span.start && other.end >= span.end && (other.start < span.start || other.end > span.end))) found.add(span.id);
    }
    const reviewed = overrides.get(Number(record.id));
    // Never reuse an occurrence decision on a changed/replaced Sheet row.
    if (reviewed && normalizeMatchText(record.text) === reviewed.text) {
      for (const id of reviewed.entityIds) if (byId.has(id)) found.add(id);
    }
    return [...found].map(id => {
      const {name, type} = byId.get(id);
      return {id, name, type};
    });
  };
}
