import { normalizeForMatch } from './entityDictionary.js';
import { recognizeTopics, topicCounts, TOPICS } from './topics.js';

export function filterArchive(records, { query = '', year = 'all', kind = 'all', recognition = 'all', topic = 'all' } = {}) {
  const terms = normalizeForMatch(query).split(' ').filter(Boolean);
  return records.filter(record => {
    if (!['DART', 'PAT'].includes(record.kind)) return false;
    if (year !== 'all' && record.year !== Number(year)) return false;
    if (kind !== 'all' && record.kind !== kind) return false;
    if (recognition === 'unmatched' && record.entities?.length) return false;
    if (recognition === 'matched' && !record.entities?.length) return false;
    if (topic !== 'all' && !record.topics?.some(t => t.id === topic)) return false;
    const text = record.searchText ?? normalizeForMatch([record.text, record.target, record.sender].filter(Boolean).join(' '));
    return terms.every(term => text.includes(term));
  }).sort((a, b) => b.id - a.id);
}

export function archiveCoverage(records) {
  const eligible = records.filter(r => ['DART', 'PAT'].includes(r.kind));
  const matched = eligible.filter(r => r.entities?.length).length;
  return { total: eligible.length, matched, unmatched: eligible.length - matched };
}

export function initArchiveExplorer({ recordCard, escapeHtml, onShowEntities }) {
  const panel = document.querySelector('#archive-panel');
  const form = document.querySelector('#archive-filters');
  const list = document.querySelector('#archive-records');
  const status = document.querySelector('#archive-results-status');
  const coverage = document.querySelector('#archive-coverage');
  const more = document.querySelector('#archive-more');
  const controls = Object.fromEntries(['query', 'year', 'kind', 'recognition'].map(key => [key, document.querySelector(`#archive-${key}`)]));
  const views = [...document.querySelectorAll('[data-explorer-view]')];
  const topicPanel = document.querySelector('#topics-panel');
  const topicButtons = document.querySelector('#topic-buttons');
  const topicStatus = document.querySelector('#topic-status');
  let view = 'archive';
  let selectedTopic = 'all';
  let records = [];
  let visible = 30;
  let loaded = false;
  const number = n => n.toLocaleString('en-US');

  function render() {
    if (!loaded) return;
    const filters = Object.fromEntries(Object.entries(controls).map(([key, el]) => [key, el.value]));
    const result = filterArchive(records, {...filters, topic:view === 'topics' ? selectedTopic : 'all'});
    const shown = result.slice(0, visible);
    const darts = result.filter(r => r.kind === 'DART').length;
    status.textContent = result.length
      ? `${number(result.length)} matching entries · ${number(darts)} Darts · ${number(result.length - darts)} Pats · showing ${number(shown.length)}`
      : 'No entries match these filters. Try a different search or reset the filters.';
    list.innerHTML = shown.map(record => {
      const terms = record.topics.filter(t=>selectedTopic==='all'||t.id===selectedTopic).flatMap(t=>t.matchedTerms);
      const evidence = view === 'topics' ? `<p class="topic-evidence">${terms.length ? `Topic keywords: ${escapeHtml([...new Set(terms)].join(', '))}` : 'No topic keyword matched this entry.'}</p>` : '';
      return `<div>${recordCard(record)}${evidence}</div>`;
    }).join('');
    more.hidden = visible >= result.length;
    more.textContent = `Show more (${number(Math.max(0, result.length - visible))} remaining)`;
    if (view === 'topics') {
      const base = filterArchive(records, filters);
      const counts = topicCounts(base);
      const matched = base.filter(r=>r.topics.length).length;
      topicStatus.textContent = `${number(matched)} of ${number(base.length)} entries in the current search/year/type/recognition filters match at least one topic. Topics overlap; their counts must not be added together.`;
      topicButtons.innerHTML = `<button type="button" data-topic="all" aria-pressed="${selectedTopic==='all'}">All entries (no topic filter)</button>` + counts.map(t=>`<button type="button" data-topic="${t.id}" aria-pressed="${selectedTopic===t.id}"><strong>${escapeHtml(t.name)}</strong><span>${number(t.count)} entries · ${number(t.darts)} Darts · ${number(t.pats)} Pats</span><span class="topic-bar" aria-hidden="true"><i style="width:${t.count ? t.darts/t.count*100 : 0}%"></i><b style="width:${t.count ? t.pats/t.count*100 : 0}%"></b></span></button>`).join('');
    }
  }

  function selectView(nextView) {
    view = nextView;
    for (const button of views) {
      const selected = button.dataset.explorerView === view;
      button.setAttribute('aria-pressed', String(selected));
    }
    panel.hidden = view === 'entities';
    document.querySelector('#entities-panel').hidden = view !== 'entities';
    topicPanel.hidden = view !== 'topics';
    document.querySelector('#archive-title').textContent = view === 'topics' ? 'Explore topics' : 'All entries';
    if (view === 'entities') onShowEntities();
    else render();
  }
  for (const button of views) button.addEventListener('click', () => selectView(button.dataset.explorerView));
  topicButtons.addEventListener('click', event => {
    const button = event.target.closest('[data-topic]');
    if (!button || !(button.dataset.topic === 'all' || TOPICS.some(t=>t.id===button.dataset.topic))) return;
    selectedTopic = button.dataset.topic;
    visible = 30;
    render();
    // The selector is regenerated with updated counts; restore keyboard focus.
    topicButtons.querySelector(`[data-topic="${selectedTopic}"]`)?.focus({preventScroll:true});
  });
  document.querySelector('#topic-rules').innerHTML = TOPICS.map(t=>`<dt>${escapeHtml(t.name)}</dt><dd>${escapeHtml(t.terms.join(', '))}</dd>`).join('');
  form.addEventListener('submit', event => { event.preventDefault(); visible = 30; render(); });
  controls.query.addEventListener('input', () => { visible = 30; render(); });
  for (const key of ['year', 'kind', 'recognition']) controls[key].addEventListener('change', () => { visible = 30; render(); });
  document.querySelector('#archive-reset').addEventListener('click', () => {
    controls.query.value = '';
    for (const key of ['year', 'kind', 'recognition']) controls[key].value = 'all';
    selectedTopic = 'all';
    visible = 30;
    render();
  });
  more.addEventListener('click', () => { visible += 30; render(); });

  return {
    showEntities() { selectView('entities'); },
    setRecords(next) {
      records = next.map(r => ({...r, topics:recognizeTopics(r), searchText: normalizeForMatch([r.text, r.target, r.sender].filter(Boolean).join(' '))}));
      loaded = true;
      visible = 30;
      const year = controls.year.value;
      const years = [...new Set(records.map(r => r.year))].sort((a, b) => b - a);
      controls.year.innerHTML = '<option value="all">All years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
      controls.year.value = years.includes(Number(year)) ? year : 'all';
      const counts = archiveCoverage(records);
      coverage.textContent = `All ${number(counts.total)} Dart and Pat entries are available here. ${number(counts.matched)} contain a recognized entity; ${number(counts.unmatched)} do not.`;
      panel.removeAttribute('aria-busy');
      render();
    },
    showError() {
      if (loaded) return;
      panel.removeAttribute('aria-busy');
      status.textContent = 'The archive could not be loaded. Use Refresh data below to try again.';
      coverage.textContent = '';
    },
  };
}
