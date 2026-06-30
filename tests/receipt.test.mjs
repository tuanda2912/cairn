import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatReceipt } from '../.claude/lib/receipt.mjs';

test('formats a full receipt deterministically', () => {
  const out = formatReceipt({
    op: 'rebuild',
    scope: 'wiki (monolith)',
    counts: { pages: 43, sources: 12, commits: 0 },
    elapsedMs: 91500,
    notes: ['lint HEALTHY', 'no secrets found'],
  });
  assert.equal(out, [
    '📋 cairn receipt — rebuild',
    '   scope:    wiki (monolith)',
    '   pages:    43',
    '   sources:  12',
    '   commits:  0',
    '   elapsed:  91.5s',
    '   note:     lint HEALTHY',
    '   note:     no secrets found',
  ].join('\n'));
});

test('omits absent fields gracefully', () => {
  assert.equal(formatReceipt({ op: 'query' }), '📋 cairn receipt — query');
  assert.equal(formatReceipt({ op: 'query', counts: { hits: 3 } }), '📋 cairn receipt — query\n   hits:     3');
});

test('skips elapsed when not a number', () => {
  const out = formatReceipt({ op: 'sync', elapsedMs: NaN });
  assert.ok(!out.includes('elapsed'));
});
