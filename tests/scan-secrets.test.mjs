import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scan } from '../.claude/lib/scan-secrets.mjs';

test('catches a PEM private key block', () => {
  const r = scan('intro\n-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n');
  assert.equal(r.length, 1);
  assert.equal(r[0].rule, 'pem-private-key');
  assert.equal(r[0].line, 2);
});

test('catches an AWS access key id', () => {
  const r = scan('aws_key = AKIAIOSFODNN7EXAMPLE');
  assert.equal(r[0].rule, 'aws-access-key');
});

test('catches a hardcoded secret assignment with a real-looking value', () => {
  const r = scan('api_key: a8f3kd92ldk39fjslapq7261');
  assert.ok(r.some((f) => f.rule === 'generic-secret'));
});

test('ignores obvious placeholders', () => {
  assert.deepEqual(scan('api_key: your-api-key-here'), []);
  assert.deepEqual(scan('token = <REDACTED>'), []);
  assert.deepEqual(scan('password: xxxxxxxxxxxxxxxx'), []);
});

test('respects the allow marker', () => {
  const line = 'token = a8f3kd92ldk39fjslapq7261 <!-- cairn:allow-secret documented example -->';
  assert.deepEqual(scan(line), []);
});

test('clean prose produces no findings', () => {
  assert.deepEqual(scan('# Title\n\nThis page documents the egress chokepoint and its threat model.'), []);
});

test('catches a GitHub token', () => {
  const r = scan('GH_TOKEN=ghp_' + 'a'.repeat(36));
  assert.equal(r[0].rule, 'github-token');
});
