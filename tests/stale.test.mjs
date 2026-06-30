import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySources } from '../.claude/lib/stale-pages.mjs';

const SOURCES = {
  'docs/a.md': { hash: 'h_a', pages: ['p1.md', 'p2.md'] },
  'docs/b.md': { hash: 'h_b', pages: ['p2.md', 'p3.md'] },
  'code/c.swift': { hash: 'h_c', pages: ['p4.md'] },
};

test('all fresh → no stale pages', () => {
  const r = classifySources(SOURCES, (s) => ({ 'docs/a.md': 'h_a', 'docs/b.md': 'h_b', 'code/c.swift': 'h_c' }[s]));
  assert.deepEqual(r.stalePages, []);
  assert.ok(r.bySource.every((x) => x.status === 'fresh'));
});

test('a changed source marks exactly its pages stale (union, deduped)', () => {
  // b.md changed; its pages p2,p3 are stale. p1 (only from a) and p4 (from c) stay fresh.
  const r = classifySources(SOURCES, (s) => (s === 'docs/b.md' ? 'h_b_NEW' : { 'docs/a.md': 'h_a', 'code/c.swift': 'h_c' }[s]));
  assert.deepEqual(r.stalePages, ['p2.md', 'p3.md']);
});

test('overlapping pages dedupe across two changed sources', () => {
  // a and b both changed; p2 is shared → appears once.
  const r = classifySources(SOURCES, (s) => (s === 'code/c.swift' ? 'h_c' : 'CHANGED'));
  assert.deepEqual(r.stalePages, ['p1.md', 'p2.md', 'p3.md']);
});

test('a deleted source (hashOf → null) marks its pages stale as "missing"', () => {
  const r = classifySources(SOURCES, (s) => (s === 'code/c.swift' ? null : { 'docs/a.md': 'h_a', 'docs/b.md': 'h_b' }[s]));
  assert.deepEqual(r.stalePages, ['p4.md']);
  assert.equal(r.bySource.find((x) => x.source === 'code/c.swift').status, 'missing');
});

test('empty/absent manifest sources → fresh', () => {
  assert.deepEqual(classifySources({}, () => 'x').stalePages, []);
  assert.deepEqual(classifySources(undefined, () => 'x').stalePages, []);
});
