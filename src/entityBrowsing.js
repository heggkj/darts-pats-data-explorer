import { normalizeForMatch } from "./entityDictionary.js";

export function searchEntities(entities, query) {
  const term = normalizeForMatch(query);
  if (!term) return [];
  const tokens = term.split(" ");
  return entities.map((entity) => {
    const names = [entity.name, ...(entity.aliases || [])].map(normalizeForMatch);
    const score = names.some((name) => name === term) ? 3
      : names.some((name) => name.startsWith(term)) ? 2
      : names.some((name) => tokens.every((token) => name.includes(token))) ? 1 : 0;
    return { entity, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.entity.count - a.entity.count || a.entity.name.localeCompare(b.entity.name))
    .map(({ entity }) => entity);
}

export function chooseCloudEntities(entities, order, selectedId) {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...entities].sort((a, b) => {
    if (a.id === selectedId) return -1;
    if (b.id === selectedId) return 1;
    return (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)
      || b.count - a.count || a.name.localeCompare(b.name);
  });
}

// The searched entity is displayed once in the cloud's first row. Repack all
// remaining entities, rather than leaving a hole at its old coordinates.
export function partitionCloudEntities(entities, spotlightId) {
  const spotlight = entities.find(entity => entity.id === spotlightId) || null;
  return { spotlight, packed: entities.filter(entity => entity.id !== spotlight?.id) };
}

export function scrambleOrder(entities, previousIds, random = Math.random) {
  const previous = new Set(previousIds);
  const shuffled = [...entities];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return [...shuffled.filter((e) => !previous.has(e.id)), ...shuffled.filter((e) => previous.has(e.id))].map((e) => e.id);
}
