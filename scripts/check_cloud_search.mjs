import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { ENTITY_DICTIONARY, ENTITY_TYPE_COLORS, recognizeEntities } from '../src/entityDictionary.js';
import { searchEntities, chooseCloudEntities, partitionCloudEntities } from '../src/entityBrowsing.js';

// Test production state/render functions with DOM doubles, not browser visual QA.
const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const records = JSON.parse(readFileSync(new URL('../public/data/records.json', import.meta.url), 'utf8'));
class Element {
  constructor() { this.children = []; this.attributes = {}; this.dataset = {}; this.classes = new Set(); this.classList = { add: name => this.classes.add(name) }; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { width: 640 }; }
}
const elements = Object.fromEntries(['entityTypes', 'wordCloud', 'cloudCount', 'cloudScramble', 'entitySearch', 'searchResults', 'searchStatus', 'totalRecords', 'totalEntities', 'totalDarts', 'totalPats'].map(key => [key, new Element()]));
const layouts = [];
const context = vm.createContext({
  ENTITY_DICTIONARY, ENTITY_TYPE_COLORS, recognizeEntities, searchEntities, chooseCloudEntities, partitionCloudEntities,
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
const names = ['formatNumber', 'escapeHtml', 'analyzeRecords', 'populateEntityTypes', 'syncEntityTypeSelection', 'updateSummary', 'cloudEntities', 'matchingEntities', 'selectSearchEntity', 'selectEntity', 'createCloudSpotlight', 'renderCloud'];
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
assert.equal(elements.totalEntities.textContent, '184');
await context.renderCloud();
assert.equal(elements.cloudCount.textContent, '(N=184)');
assert.equal(layouts.at(-1).length, 184);
assert.equal(context.testState.selectedEntityId, null);

elements.entitySearch.value = 'Canvas';
context.testState.selectedYear = 1991;
context.testState.entityType = 'Building';
context.selectSearchEntity('canvas');
assert.equal(context.testState.selectedYear, null);
assert.equal(context.testState.entityType, 'all');
assert.equal(context.testState.selectedEntityId, 'canvas');
assert.equal(context.testState.cloudSpotlightId, 'canvas');
await context.renderCloud();
const spotlight = elements.wordCloud.children[0].children[0];
assert.equal(spotlight.textContent, 'Canvas');
assert.ok(spotlight.classes.has('is-arriving'));
assert.equal(spotlight.attributes['aria-pressed'], 'true');
assert.equal(layouts.at(-1).length, 183);
assert.ok(layouts.at(-1).every(entity => entity.id !== 'canvas'));
assert.equal(new Set(['canvas', ...layouts.at(-1).map(entity => entity.id)]).size, 184);
assert.equal(elements.cloudCount.textContent, '(N=184)');
await context.renderCloud();
assert.ok(!elements.wordCloud.children[0].children[0].classes.has('is-arriving'), 'Resize/filter redraw must not repeat animation');
context.testState.entityType = 'Misc.';
await context.renderCloud();
assert.equal(elements.cloudCount.textContent, '(N=12)');
assert.equal(layouts.at(-1).length, 11);

elements.entitySearch.value = 'Duke Dog';
context.selectSearchEntity('duke-dog');
context.testState.entityType = 'Mascot';
await context.renderCloud();
assert.equal(elements.cloudCount.textContent, '(N=1)');
assert.equal(elements.wordCloud.children.length, 1);
assert.equal(elements.wordCloud.children[0].children[0].textContent, 'Duke Dog');
assert.equal(elements.wordCloud.attributes['aria-busy'], 'false');
assert.equal(partitionCloudEntities([], 'missing').packed.length, 0);
const many = Array.from({ length: 1500 }, (_, i) => ({ id: String(i), name: String(i), count: 1 }));
assert.equal(chooseCloudEntities(many, [], null).length, 1500, 'No implicit cloud entity cap');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.cloud-spotlight\.is-arriving \{ animation: none; \}/);
console.log('Cloud search checks passed: Misc. pill, N=184, no truncation, top-row search result, repacking, animation, filter reset and single-entity state.');
