import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLog, selectFold, foldRange } from '../.claude/lib/fold-log.mjs';

const SAMPLE = `# Log

## [2026-06-30] save | newest
body c

## [2026-06-20] ingest | middle
body b

## [2026-06-10] lint | oldest
body a
`;

test('parseLog: preamble + entries in file order (newest-first)', () => {
  const { preamble, entries } = parseLog(SAMPLE);
  assert.match(preamble, /# Log/);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.map((e) => e.date), ['2026-06-30', '2026-06-20', '2026-06-10']);
  assert.match(entries[0].raw, /newest/);
});

test('selectFold: keep newest N, fold the older tail', () => {
  const { entries } = parseLog(SAMPLE);
  const { kept, fold } = selectFold(entries, 2);
  assert.deepEqual(kept.map((e) => e.date), ['2026-06-30', '2026-06-20']);
  assert.deepEqual(fold.map((e) => e.date), ['2026-06-10']);
});

test('selectFold: nothing to fold when entries <= keep', () => {
  const { entries } = parseLog(SAMPLE);
  assert.deepEqual(selectFold(entries, 5).fold, []);
});

test('foldRange: from oldest to newest of the folded set', () => {
  assert.deepEqual(
    foldRange([{ date: '2026-06-10' }, { date: '2026-06-01' }, { date: '2026-06-05' }]),
    { from: '2026-06-01', to: '2026-06-10' },
  );
});
