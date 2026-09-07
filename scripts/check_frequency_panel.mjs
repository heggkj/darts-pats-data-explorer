import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entryBalance } from '../src/entryBalance.js';

// Source regression guard: empty meters remain invisible without collapsing
// their space. Browser geometry is not exercised by this check.
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const rule = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(match, `Missing rule: ${selector}`);
  return match[1];
};
assert.match(rule('.balance-meter[hidden]'), /display:\s*block/);
assert.match(rule('.balance-scale[hidden]'), /display:\s*flex/);
for (const selector of ['.balance-meter[hidden]', '.balance-scale[hidden]']) {
  assert.match(rule(selector), /visibility:\s*hidden/);
  assert.doesNotMatch(rule(selector), /display:\s*none/);
}
assert.match(rule('.balance-caption'), /min-block-size:\s*calc\(3em \+ 0\.2rem\)/);
assert.match(rule('.year-chart'), /height:\s*11\.5rem/);
assert.equal(entryBalance(0, 0).label, 'No entries in this period');
assert.equal(entryBalance(0, 0).patShare, null);
for (const [darts, pats] of [[1, 0], [0, 1], [5, 5], [7, 3]]) {
  assert.equal(entryBalance(darts, pats).total, darts + pats);
}
console.log('Frequency-panel empty/populated state regression checks passed.');
