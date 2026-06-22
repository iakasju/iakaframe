import { test } from 'node:test';
import assert from 'node:assert/strict';
import { table, wrap } from '../src/lib/table.js';

test('tableau UTF-8 minimal', () => {
  const expected = [
    '╔═══╦═══╗',
    '║ A ║ B ║',
    '╠═══╬═══╣',
    '║ 1 ║ 2 ║',
    '╚═══╩═══╝',
  ].join('\n');
  assert.equal(table(['A', 'B'], [['1', '2']]), expected);
});

test('repli ASCII', () => {
  assert.ok(table(['A'], [['x']], { ascii: true }).includes('+---+'));
  assert.ok(!table(['A'], [['x']], { ascii: true }).includes('═'));
});

test('cellule multi-lignes alignee', () => {
  const out = table(null, [['a\nbb', 'c']]);
  const lines = out.split('\n');
  // bordures haut/bas + 2 lignes de contenu
  assert.equal(lines.length, 4);
  assert.ok(lines.every(l => l.length === lines[0].length));
});

test('wrap coupe par mots', () => {
  assert.deepEqual(wrap('aa bb cc', 5), ['aa bb', 'cc']);
  assert.deepEqual(wrap('hello', 3), ['hel', 'lo']);
});
