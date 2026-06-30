import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostOf, isPublicHost, classify, PUBLIC_HOSTS } from '../.claude/lib/guard-remote.mjs';

test('hostOf: parses https and scp-like remote URLs', () => {
  assert.equal(hostOf('https://github.com/me/repo.git'), 'github.com');
  assert.equal(hostOf('https://user@gitlab.com:443/me/repo.git'), 'gitlab.com');
  assert.equal(hostOf('git@github.com:me/repo.git'), 'github.com');
  assert.equal(hostOf('ssh://git@git.home.lan:22/me/repo.git'), 'git.home.lan');
  assert.equal(hostOf('/local/path/repo.git'), null); // no host
});

test('isPublicHost: exact host and subdomains of known public hosts', () => {
  assert.ok(isPublicHost('github.com'));
  assert.ok(isPublicHost('codeberg.org'));
  assert.ok(isPublicHost('raw.githubusercontent.com') === false); // not in list; only *.github.com etc.
  assert.ok(isPublicHost('gist.github.com')); // subdomain of github.com
  assert.ok(!isPublicHost('git.home.lan')); // self-hosted
  assert.ok(!isPublicHost(null));
});

test('classify: public remote BLOCKS by default (fail-closed)', () => {
  const r = classify(['git@github.com:me/repo.git']);
  assert.equal(r.blocked, true);
  assert.deepEqual(r.offending, ['git@github.com:me/repo.git']);
  assert.deepEqual(r.selfHosted, []);
});

test('classify: opt-out downgrades a public remote to allowed (not blocked)', () => {
  const r = classify(['git@github.com:me/repo.git'], true);
  assert.equal(r.blocked, false);
  assert.equal(r.optedOut, true);
  assert.deepEqual(r.offending, ['git@github.com:me/repo.git']); // still reported, just not blocking
});

test('classify: self-hosted remote is allowed-but-flagged, never blocked', () => {
  const r = classify(['ssh://git@git.home.lan/me/repo.git']);
  assert.equal(r.blocked, false);
  assert.deepEqual(r.selfHosted, ['ssh://git@git.home.lan/me/repo.git']);
  assert.deepEqual(r.offending, []);
});

test('classify: mixed remotes block on the public one unless opted out', () => {
  const urls = ['ssh://git@git.home.lan/me/repo.git', 'https://github.com/me/repo.git'];
  assert.equal(classify(urls).blocked, true);
  assert.equal(classify(urls, true).blocked, false);
});

test('classify: no remotes → nothing to block', () => {
  assert.equal(classify([]).blocked, false);
});

test('PUBLIC_HOSTS covers the major third-party hosts', () => {
  for (const h of ['github.com', 'gitlab.com', 'bitbucket.org']) assert.ok(PUBLIC_HOSTS.includes(h));
});
