import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveRoot } from '../src/lib/root.js';

test('resolveRoot : --root prioritaire', () => {
  assert.equal(resolveRoot('/tmp/x'), path.resolve('/tmp/x'));
});

test('resolveRoot : IAKAFRAME_ROOT sinon', () => {
  const old = process.env.IAKAFRAME_ROOT;
  process.env.IAKAFRAME_ROOT = '/srv/work';
  try { assert.equal(resolveRoot(), path.resolve('/srv/work')); }
  finally { if (old === undefined) delete process.env.IAKAFRAME_ROOT; else process.env.IAKAFRAME_ROOT = old; }
});

test('resolveRoot : defaut OS', () => {
  const old = process.env.IAKAFRAME_ROOT;
  delete process.env.IAKAFRAME_ROOT;
  try {
    const r = resolveRoot();
    if (process.platform === 'win32') assert.equal(r, 'C:\\work');
    else assert.ok(r.endsWith(path.join('work')));
  } finally { if (old !== undefined) process.env.IAKAFRAME_ROOT = old; }
});
