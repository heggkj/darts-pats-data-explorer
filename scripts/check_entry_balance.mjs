import assert from 'node:assert/strict';
import { entryBalance } from '../src/entryBalance.js';

assert.deepEqual(entryBalance(0, 0), {
  total: 0, patShare: null, label: 'No entries in this period', detail: '',
});
assert.equal(entryBalance(10, 10).label, 'Even split');
for (const [majority, minority, prefix] of [
  [51, 49, null], [55, 45, null],
  [56, 44, ''], [59, 41, ''],
  [60, 40, 'Fairly strong '], [74, 26, 'Fairly strong '],
  [75, 25, 'Strong '], [80, 20, 'Strong '], [100, 0, 'Strong '],
]) {
  for (const direction of ['Dart', 'Pat']) {
    const [darts, pats] = direction === 'Dart' ? [majority, minority] : [minority, majority];
    const result = entryBalance(darts, pats);
    assert.equal(result.label, prefix === null ? 'Nearly even' : `${prefix}${direction} lean`);
    assert.equal(result.total, darts + pats);
    assert.equal(result.patShare, pats / (darts + pats));
  }
}
// User's Duke Dog example, including the mirrored Dart-heavy case.
assert.equal(entryBalance(18, 33).label, 'Fairly strong Pat lean');
assert.equal(entryBalance(18, 33).detail, '35% Darts · 65% Pats');
assert.equal(entryBalance(33, 18).label, 'Fairly strong Dart lean');
// Display rounding must not move the underlying classification boundary.
assert.equal(entryBalance(401, 599).label, 'Pat lean');
assert.equal(entryBalance(251, 749).label, 'Fairly strong Pat lean');
console.log('Entry-balance labels, boundaries, symmetry, and Duke Dog regression checks passed.');
