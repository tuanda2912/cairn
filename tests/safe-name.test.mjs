import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeName } from '../.claude/lib/safe-name.mjs';

test('strips path traversal and separators', () => {
  assert.equal(safeName('../../etc/passwd'), 'etc-passwd');
  assert.equal(safeName('a/b\\c'), 'a-b-c');
  assert.equal(safeName('..'), '');
});

test('kebab-cases, lowercases, trims', () => {
  assert.equal(safeName('Chose SSE over WebSockets / simpler ops'), 'chose-sse-over-websockets-simpler-ops');
  assert.equal(safeName('  --Hello--  '), 'hello');
});

test('drops .md and accents', () => {
  assert.equal(safeName('Café Decision.md'), 'cafe-decision');
});

test('empties cleanly when nothing usable remains', () => {
  assert.equal(safeName('///...'), '');
  assert.equal(safeName(''), '');
  assert.equal(safeName(null), '');
});

test('bounds length', () => {
  assert.ok(safeName('x'.repeat(200)).length <= 80);
});
