import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { ENTITY_DICTIONARY, recognizeEntities } from '../src/entityDictionary.js';
import { entryBalance } from '../src/entryBalance.js';

// Exercise real startup/data functions with saved archive data and rendering
// doubles. This is a logic test, not browser layout verification.
const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const records = JSON.parse(readFileSync(new URL('../public/data/records.json', import.meta.url), 'utf8'));
const stateStart = source.indexOf('const state = {');
const stateEnd = source.indexOf('\n};', stateStart) + 3;
assert.ok(stateStart >= 0 && stateEnd > stateStart);
const names = ['analyzeRecords', 'selectedEntity', 'cloudEntities', 'availableYears', 'matchingRecords', 'renderRecords', 'renderYearChart', 'renderEntryBalance', 'formatNumber'];
const functions = names.map(name => {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, `Missing function boundary: ${name}`);
  return source.slice(start, end);
}).join('\n');
const elements = Object.fromEntries(['frequencyEntity', 'frequencyTotal', 'legendDarts', 'legendPats', 'balanceLabel', 'balanceShare', 'balanceMeter', 'balanceScale', 'matchCount', 'status', 'loadMore'].map(name => [name, { textContent: '', hidden: false }]));
elements.yearChart = { cleared: false, replaceChildren() { this.cleared = true; } };
elements.recordList = { cleared: false, replaceChildren() { this.cleared = true; } };
const context = vm.createContext({ ENTITY_DICTIONARY, recognizeEntities, entryBalance, PAGE_SIZE: 18, elements });
vm.runInContext(`${source.slice(stateStart, stateEnd)}\n${functions}\nglobalThis.testState = state;`, context);
const state = context.testState;
assert.equal(state.selectedEntityId, null);
assert.equal(state.selectedYear, null);
assert.equal(state.entityType, 'all');
context.analyzeRecords(records);
assert.equal(state.selectedEntityId, null, 'Loading must not preselect the most frequent entity');
const allIds = [...context.cloudEntities()].map(e => e.id).sort();
assert.deepEqual(allIds, [...state.entityStats.keys()].sort(), 'The initial cloud must include every matched dictionary entity');
context.renderYearChart();
context.renderRecords();
assert.equal(elements.frequencyEntity.textContent, 'Select an entity');
assert.equal(elements.frequencyTotal.textContent, '—');
assert.equal(elements.matchCount.textContent, '—');
assert.equal(elements.legendDarts.textContent, 'Darts (—)');
assert.equal(elements.legendPats.textContent, 'Pats (—)');
assert.equal(elements.balanceLabel.textContent, 'Select an entity to see its balance.');
assert.equal(elements.balanceMeter.hidden, true);
assert.equal(elements.balanceScale.hidden, true);
assert.ok(elements.yearChart.cleared && elements.recordList.cleared && elements.loadMore.hidden);
assert.match(elements.status.textContent, /Select an entity/);

const firstId = [...state.entityStats.keys()][0];
state.selectedEntityId = firstId;
assert.deepEqual([...context.cloudEntities()].map(e => e.id).sort(), allIds, 'Selecting an entity must not limit the entity space');
const count = state.entityStats.get(firstId).count;
assert.equal(context.matchingRecords().length, count);
context.analyzeRecords(records);
assert.equal(state.selectedEntityId, firstId, 'Refresh preserves explicit selections');
state.selectedEntityId = 'no-longer-present';
context.analyzeRecords(records);
assert.equal(state.selectedEntityId, null, 'A missing entity returns to no selection, not an arbitrary default');
console.log(`Unselected startup and refresh checks passed: ${state.records.length} entries, ${allIds.length} entities, all years/types visible.`);
