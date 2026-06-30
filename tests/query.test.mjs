import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, buildIndex, rank } from '../.claude/lib/query-wiki.mjs';

test('tokenize: lowercases, drops stopwords + short, keeps repeats (for TF)', () => {
  assert.deepEqual(tokenize('The Auth auth LOGIN'), ['auth', 'auth', 'login']);
  assert.deepEqual(tokenize('a an of to is be it'), []);
});

test('rank: only matching docs, sorted by score desc', () => {
  const idx = buildIndex([
    { id: 'auth', text: 'authentication login session token' },
    { id: 'billing', text: 'billing invoice charge' },
  ]);
  const r = rank('login session', idx);
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'auth');
});

test('rank: higher term frequency ranks first', () => {
  const idx = buildIndex([
    { id: 'a', text: 'login login login form' },
    { id: 'b', text: 'login once then logout' },
  ]);
  assert.equal(rank('login', idx)[0].id, 'a');
});

test('rank: no matches → empty', () => {
  const idx = buildIndex([{ id: 'a', text: 'billing invoice' }]);
  assert.deepEqual(rank('authentication', idx), []);
});

test('rank: rarer term (higher idf) pulls its doc to the top', () => {
  const idx = buildIndex([
    { id: 'common', text: 'shared shared shared rare' },
    { id: 'also', text: 'shared shared' },
    { id: 'third', text: 'shared other' },
  ]);
  assert.equal(rank('rare shared', idx)[0].id, 'common');
});
