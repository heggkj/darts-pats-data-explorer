import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the real state/refresh functions without starting the browser or
// fetching the live sheet. Rendering boundaries are replaced with test doubles.
const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const functions = ['selectEntityType', 'renderSelection', 'renderYearSelection'].map(name => {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  const end = source.indexOf('\nfunction ', start + 1);
  assert.ok(end > start);
  return source.slice(start, end);
}).join('\n');

for (const initialYear of [2003, 2014, null]) {
  for (const type of ['Group', 'Mascot', 'Building', 'all']) {
    const state = { entityType: 'Person', selectedYear: initialYear, cloudOrder: ['old'], visibleCount: 120, selectedEntityId: 'duke-dog' };
    const calls = [];
    const attributes = {};
    const classes = {};
    const elements = {
      selectedYear: { textContent: '' }, yearSlider: { value: '2014' },
      allYears: {
        classList: { toggle: (key, value) => { classes[key] = value; } },
        setAttribute: (key, value) => { attributes[key] = value; },
      },
    };
    const recordCall = name => () => {
      assert.equal(state.selectedYear, null, `${name} must use all years`);
      calls.push(name);
    };
    const context = vm.createContext({ state, elements, PAGE_SIZE: 30,
      syncEntityTypeSelection: recordCall('type'), renderCloud: recordCall('cloud'),
      renderYearChart: recordCall('chart'), renderRecords: recordCall('records'),
    });
    vm.runInContext(functions, context);
    context.selectEntityType(type);
    assert.equal(state.entityType, type);
    assert.equal(state.selectedYear, null);
    assert.equal(state.cloudOrder.length, 0);
    assert.equal(state.visibleCount, 30);
    assert.equal(state.selectedEntityId, 'duke-dog');
    assert.equal(elements.selectedYear.textContent, 'All years');
    assert.equal(classes['is-active'], true);
    assert.equal(attributes['aria-pressed'], 'true');
    assert.deepEqual(calls, ['type', 'chart', 'records', 'cloud']);
  }
}
console.log('Entity-type changes reset to All years and refresh all dependent views.');
