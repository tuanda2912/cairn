import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodyOf, wordCount, tagSet, jaccard, findThin, findOverlaps } from '../.claude/lib/density.mjs';

test('bodyOf: strips the frontmatter block', () => {
  assert.equal(bodyOf('---\ntype: x\n---\nhello world').trim(), 'hello world');
  assert.equal(bodyOf('no frontmatter here').trim(), 'no frontmatter here');
});

test('wordCount: ignores frontmatter, code fences, and markdown punctuation', () => {
  const text = '---\ntitle: t\n---\n# Heading\n\nthree real words.\n\n```\nignored code block words words\n```';
  assert.equal(wordCount(text), 4); // Heading + three + real + words
});

test('tagSet: parses inline and block tag styles into a lowercased set', () => {
  assert.deepEqual([...tagSet('[Auth, Login, IPC]')].sort(), ['auth', 'ipc', 'login']);
  assert.deepEqual([...tagSet('- auth - login')].sort(), ['auth', 'login']);
});

test('jaccard: overlap ratio, empty ⇒ 0', () => {
  assert.equal(jaccard(new Set(['a', 'b']), new Set(['a', 'b'])), 1);
  assert.equal(jaccard(new Set(['a', 'b']), new Set([])), 0);
  assert.equal(jaccard(new Set(['a', 'b', 'c', 'd']), new Set(['a', 'b'])), 0.5);
});

test('findThin: flags pages below the word floor, thinnest first', () => {
  const r = findThin([{ file: 'a', words: 200 }, { file: 'b', words: 10 }, { file: 'c', words: 50 }], 80);
  assert.deepEqual(r.map((p) => p.file), ['b', 'c']);
});

test('findOverlaps: pairs with high tag overlap and enough shared tags', () => {
  const pages = [
    { file: 'rag.md', tags: new Set(['rag', 'engine', 'vault', 'privacy']) },
    { file: 'rag2.md', tags: new Set(['rag', 'engine', 'vault', 'embeddings']) }, // shares 3, jaccard 3/5=0.6
    { file: 'ui.md', tags: new Set(['ui', 'electron']) },
  ];
  const r = findOverlaps(pages, 0.6, 3);
  assert.equal(r.length, 1);
  assert.equal(r[0].a, 'rag.md');
  assert.equal(r[0].b, 'rag2.md');
  assert.ok(r[0].score >= 0.6);
});

test('findOverlaps: high ratio but too few shared tags is not flagged', () => {
  const pages = [
    { file: 'a.md', tags: new Set(['x', 'y']) },
    { file: 'b.md', tags: new Set(['x', 'y']) }, // jaccard 1.0 but only 2 shared < minShared 3
  ];
  assert.deepEqual(findOverlaps(pages, 0.6, 3), []);
});
