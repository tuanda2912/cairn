import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score, gateDecision, avg } from '../.claude/lib/eval-lodestar.mjs';

test('score: perfect prediction → recall/precision/f1 = 1', () => {
  const r = score(['a', 'b'], ['a', 'b']);
  assert.equal(r.recall, 1);
  assert.equal(r.precision, 1);
  assert.equal(r.f1, 1);
});

test('score: partial recall + a false positive', () => {
  const r = score(['a', 'b'], ['a', 'x']); // tp=1, fp=1, fn=1
  assert.deepEqual([r.tp, r.fp, r.fn], [1, 1, 1]);
  assert.equal(r.recall, 0.5);
  assert.equal(r.precision, 0.5);
});

test('score: empty prediction → zero recall', () => {
  assert.equal(score(['a', 'b'], []).recall, 0);
});

test('score: empty expected → recall 1 (nothing to find)', () => {
  assert.equal(score([], ['a']).recall, 1);
});

test('score: dedupes predictions', () => {
  const r = score(['a', 'b'], ['a', 'a', 'a']);
  assert.equal(r.tp, 1);
  assert.equal(r.recall, 0.5);
});

test('gateDecision: PASS above absolute and delta', () => {
  assert.equal(gateDecision(0.8, 0.5, { minAbsolute: 0.5, minDeltaPP: 20 }).pass, true);
});

test('gateDecision: FAIL when delta too small', () => {
  assert.equal(gateDecision(0.55, 0.5, { minAbsolute: 0.5, minDeltaPP: 20 }).pass, false);
});

test('gateDecision: FAIL when below absolute even with big delta', () => {
  assert.equal(gateDecision(0.4, 0.0, { minAbsolute: 0.5, minDeltaPP: 0 }).pass, false);
});

test('avg: mean, and empty → 1 (vacuous full recall)', () => {
  assert.equal(avg([0, 1]), 0.5);
  assert.equal(avg([]), 1);
});
