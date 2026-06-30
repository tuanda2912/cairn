import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isFramework, planUpgrade, collectFramework } from '../.claude/lib/upgrade-kit.mjs';

test('isFramework: framework files travel, project/local config does not', () => {
  assert.ok(isFramework('.claude/commands/cairn-save.md'));
  assert.ok(isFramework('.claude/lib/guard-remote.mjs'));
  assert.ok(isFramework('.claude/skills/lodestar/SKILL.md'));
  assert.ok(isFramework('.claude/agents/feature-mapper.md'));
  assert.ok(isFramework('CLAUDE.md'));
  assert.ok(isFramework('.claude/cairn.version'));
  // never synced — these are the project's own
  assert.ok(!isFramework('.claude/wiki.config.sh'));
  assert.ok(!isFramework('.claude/wiki.config.local.sh'));
  assert.ok(!isFramework('.claude/skills/lodestar/lodestar.config.json'));
  assert.ok(!isFramework('wiki/index.md'));
  assert.ok(!isFramework('wiki.context.md'));
  assert.ok(!isFramework('eval/corpus.json'));
});

test('planUpgrade: classifies added / changed / removed / unchanged', () => {
  const src = new Map([['a', 'h1'], ['b', 'h2new'], ['c', 'h3']]);
  const dst = new Map([['b', 'h2old'], ['c', 'h3'], ['d', 'h4']]);
  const p = planUpgrade(src, dst);
  assert.deepEqual(p.added, ['a']);
  assert.deepEqual(p.changed, ['b']);
  assert.deepEqual(p.removed, ['d']); // gone from source — reported, never auto-deleted
  assert.deepEqual(p.unchanged, ['c']);
});

test('planUpgrade: identical kits => no drift', () => {
  const m = new Map([['x', 'h'], ['y', 'h2']]);
  const p = planUpgrade(m, new Map(m));
  assert.equal(p.added.length + p.changed.length + p.removed.length, 0);
  assert.deepEqual(p.unchanged, ['x', 'y']);
});

test('collectFramework: reads this very repo and finds known framework files, excludes config', () => {
  const map = collectFramework(new URL('../', import.meta.url).pathname);
  assert.ok(map.has('.claude/lib/upgrade-kit.mjs'));
  assert.ok(map.has('CLAUDE.md'));
  assert.ok(!map.has('.claude/wiki.config.sh')); // excluded
  for (const h of map.values()) assert.match(h, /^[0-9a-f]{64}$/); // sha256 hex
});
