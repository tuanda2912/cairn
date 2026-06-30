import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const LIB = new URL('../.claude/lib/manifest.mjs', import.meta.url).pathname;
const run = (...args) => execFileSync('node', [LIB, ...args], { encoding: 'utf8' });

test('hash → check → record → pages → sources → prune round-trip', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cairn-mf-'));
  try {
    const mf = join(dir, 'm.json');
    const src = join(dir, 'src.md');
    writeFileSync(src, '# hello\n');

    const hash = run('hash', src).trim();
    assert.match(hash, /^[a-f0-9]{64}$/);

    assert.equal(run('check', mf, src, hash).trim(), 'new');
    run('record', mf, src, hash, 'wiki/a.md', 'wiki/b.md');
    assert.equal(run('check', mf, src, hash).trim(), 'unchanged');
    assert.equal(run('check', mf, src, 'deadbeef').trim(), 'changed');

    assert.deepEqual(run('pages', mf, src).trim().split('\n').sort(), ['wiki/a.md', 'wiki/b.md']);
    assert.equal(run('sources', mf, 'wiki/a.md').trim(), src);

    run('prune', mf, src);
    assert.equal(run('check', mf, src, hash).trim(), 'new');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
