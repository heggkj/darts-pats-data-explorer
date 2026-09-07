import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the actual transition functions with rendering test doubles; no browser
// or live-sheet access is required for this state regression check.
const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const functions = ['toggleAllYears', 'selectYear', 'selectEntityType', 'renderSelection', 'renderYearSelection'].map(name => {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, `Missing function boundary: ${name}`);
  return source.slice(start, end);
}).join('\n');
assert.match(source, /elements\.allYears\.addEventListener\("click", toggleAllYears\)/);

for (const year of [1991, 2003, 2014, 2026]) {
  const state = { selectedYear: null, selectedEntityId: 'duke-dog', entityType: 'Mascot', cloudOrder: ['old'], visibleCount: 120 };
  const attributes = {};
  const classes = {};
  const calls = [];
  const elements = {
    yearSlider: { value: String(year) }, selectedYear: { textContent: 'All years' },
    allYears: {
      setAttribute: (name, value) => { attributes[name] = value; },
      classList: { toggle: (name, value) => { classes[name] = value; } },
    },
  };
  const context = vm.createContext({ state, elements, PAGE_SIZE: 30,
    syncEntityTypeSelection: () => {},
    renderCloud: () => calls.push(['cloud', state.selectedYear]),
    renderYearChart: () => calls.push(['chart', state.selectedYear]),
    renderRecords: () => calls.push(['records', state.selectedYear]),
  });
  vm.runInContext(functions, context);
  const check = expectedYear => {
    assert.equal(state.selectedYear, expectedYear);
    assert.equal(elements.selectedYear.textContent, expectedYear === null ? 'All years' : String(expectedYear));
    assert.equal(attributes['aria-pressed'], String(expectedYear === null));
    assert.equal(classes['is-active'], expectedYear === null);
    assert.equal(state.visibleCount, 30);
    assert.equal(state.cloudOrder.length, 0);
    assert.equal(state.selectedEntityId, 'duke-dog');
    assert.deepEqual(calls.splice(0), [['chart', expectedYear], ['records', expectedYear], ['cloud', expectedYear]]);
  };
  // Active -> slider year -> all years -> the same slider year.
  context.toggleAllYears(); check(year);
  context.toggleAllYears(); check(null);
  assert.equal(elements.yearSlider.value, String(year));
  context.toggleAllYears(); check(year);
  // A chart/slider selection becomes the year restored after toggling.
  context.selectYear(2007); check(2007);
  context.toggleAllYears(); check(null);
  context.toggleAllYears(); check(2007);
  // Type changes still activate All years while preserving the slider position.
  context.selectEntityType('all'); check(null);
  context.toggleAllYears(); check(2007);
}
console.log('All-years toggle, slider restoration, view refreshes, and type-reset checks passed.');
