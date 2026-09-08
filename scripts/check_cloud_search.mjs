import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { ENTITY_DICTIONARY, ENTITY_TYPE_COLORS, recognizeEntities } from '../src/entityDictionary.js';
import { searchEntities, chooseCloudEntities } from '../src/entityBrowsing.js';

// Test production state/render functions with DOM doubles, not browser visual QA.
const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const records = JSON.parse(readFileSync(new URL('../public/data/records.json', import.meta.url), 'utf8'));
class Element {
  constructor() { this.children = []; this.attributes = {}; this.dataset = {}; this.classes = new Set(); this.classList = { add: name => this.classes.add(name) }; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  append(...nodes) { for (const node of nodes) { if (node.parent) node.parent.children = node.parent.children.filter(child => child !== node); node.parent = this; this.children.push(node); } }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener() {}
  querySelector(selector) { for (const child of this.children) { if (child.attributes?.class?.split(' ').includes(selector.slice(1))) return child; const found = child.querySelector?.(selector); if (found) return found; } return null; }
  getBBox() { return { x: Number(this.attributes.x) - 50, y: Number(this.attributes.y) - 12, width: 100, height: 16 }; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { width: 640 }; }
}
const elements = Object.fromEntries(['entityTypes', 'wordCloud', 'cloudCount', 'cloudScramble', 'entitySearch', 'searchResults', 'searchStatus', 'totalRecords', 'totalEntities', 'totalDarts', 'totalPats'].map(key => [key, new Element()]));
const layouts = [];
const context = vm.createContext({
  ENTITY_DICTIONARY, ENTITY_TYPE_COLORS, recognizeEntities, searchEntities, chooseCloudEntities,
  PAGE_SIZE: 18, elements, console,
  document: { fonts: { load: async () => {} }, createElement: () => new Element(), createElementNS: () => new Element(), createTextNode: text => ({ text }) },
  window: { matchMedia: () => { throw Error('Search must stay at the cloud instead of scrolling to the mobile sidebar'); } },
  renderSelection() {},
  layoutEntityCloud(entities, options) {
    layouts.push(entities);
    options.onEnd({ words: entities.map(entity => ({ ...entity, text: entity.name, size: 16, x: 0, y: 0, rotate: 0 })), width: 640, height: entities.length * 24 });
    return { stop() {} };
  },
});
const stateStart = source.indexOf('const state = {');
const stateEnd = source.indexOf('\n};', stateStart) + 3;
const names = ['formatNumber', 'escapeHtml', 'analyzeRecords', 'populateEntityTypes', 'syncEntityTypeSelection', 'updateSummary', 'cloudEntities', 'matchingEntities', 'selectSearchEntity', 'selectEntity', 'renderCloud'];
const functions = names.map(name => {
  const match = new RegExp(`(?:async )?function ${name}\\(`).exec(source);
  assert.ok(match, name);
  const start = match.index;
  const rest = source.slice(start + match[0].length);
  const next = /\n(?:async )?function /.exec(rest);
  assert.ok(next, name);
  return source.slice(start, start + match[0].length + next.index);
}).join('\n');
vm.runInContext(`let activeCloudLayout; ${source.slice(stateStart, stateEnd)}\n${functions}\nglobalThis.testState = state;`, context);
context.analyzeRecords(records);
context.populateEntityTypes();
context.updateSummary();
assert.match(elements.entityTypes.innerHTML, /data-entity-type="Misc\."/);
assert.equal(elements.totalEntities.textContent, '278');
await context.renderCloud();
assert.equal(elements.cloudCount.textContent, '(N=278)');
assert.equal(layouts.at(-1).length, 278);
assert.equal(context.testState.selectedEntityId, null);

elements.entitySearch.value = 'Canvas';
context.testState.selectedYear = 1991;
context.testState.entityType = 'Building';
context.selectSearchEntity('canvas');
assert.equal(context.testState.selectedYear, null);
assert.equal(context.testState.entityType, 'all');
assert.equal(context.testState.selectedEntityId, 'canvas');
assert.equal(context.testState.cloudSpotlightId, 'canvas');
assert.equal(elements.entitySearch.value, 'Canvas', 'Selecting a search result keeps its name in the search box');
await context.renderCloud();
const spotlight = elements.wordCloud.querySelector('.is-selected');
assert.match(spotlight.attributes['aria-label'], /^Canvas:/);
assert.ok(elements.wordCloud.querySelector('.entity-highlight').classes.has('is-arriving'));
assert.equal(spotlight.attributes['aria-pressed'], 'true');
assert.equal(layouts.at(-1).length, 278);
assert.equal(layouts.at(-1).filter(entity => entity.id === 'canvas').length, 1);
assert.equal(elements.wordCloud.children.length, 1, 'Only one integrated SVG cloud, no separate spotlight row');
assert.equal(elements.cloudCount.textContent, '(N=278)');
await context.renderCloud();
assert.ok(!elements.wordCloud.querySelector('.entity-highlight').classes.has('is-arriving'), 'Resize/filter redraw must not repeat animation');
context.testState.entityType = 'Misc.';
await context.renderCloud();
assert.equal(elements.cloudCount.textContent, '(N=20)');
assert.equal(layouts.at(-1).length, 20);

elements.entitySearch.value = 'Duke Dog';
context.selectSearchEntity('duke-dog');
context.testState.entityType = 'Mascot';
await context.renderCloud();
assert.equal(elements.cloudCount.textContent, '(N=1)');
assert.equal(elements.wordCloud.children.length, 1);
assert.match(elements.wordCloud.querySelector('.is-selected').attributes['aria-label'], /^Duke Dog:/);
assert.equal(elements.wordCloud.attributes['aria-busy'], 'false');

// Direct cloud selection leaves search mode without changing the active filters.
context.testState.selectedYear = 2014;
context.selectEntity('duke-dog', { scrollSidebar: false });
assert.equal(elements.entitySearch.value, 'Duke Dog', 'Reselecting the same entity preserves its search');
elements.searchResults.hidden = false;
elements.searchResults.append(new Element());
elements.searchStatus.textContent = 'Old search results';
context.selectEntity('not-an-entity', { scrollSidebar: false });
assert.equal(elements.entitySearch.value, 'Duke Dog', 'Invalid selections do not discard the search');
context.testState.entityType = 'all';
context.selectEntity('canvas', { scrollSidebar: false });
assert.equal(elements.entitySearch.value, '');
assert.equal(elements.searchResults.hidden, true);
assert.equal(elements.searchResults.children.length, 0);
assert.equal(elements.searchStatus.textContent, '');
assert.equal(context.testState.selectedEntityId, 'canvas');
assert.equal(context.testState.cloudSpotlightId, null);
assert.equal(context.testState.spotlightAnimationPending, false);
assert.equal(context.testState.selectedYear, 2014, 'Cloud selection preserves the year filter');
assert.equal(context.testState.entityType, 'all', 'Cloud selection preserves the type filter');
elements.entitySearch.value = 'duke';
context.selectSearchEntity('duke-dog');
assert.equal(elements.entitySearch.value, 'Duke Dog', 'A subsequent search keeps its new canonical name');
const many = Array.from({ length: 1500 }, (_, i) => ({ id: String(i), name: String(i), count: 1 }));
assert.equal(chooseCloudEntities(many, [], null).length, 1500, 'No implicit cloud entity cap');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.entity-highlight\.is-arriving \{ animation: none; \}/);
console.log('Cloud search checks passed: Misc. pill, N=278, integrated search result, animation, filter reset, single-entity state, and clearing search on a different cloud selection.');
