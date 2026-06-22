import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEtat, lastStep, backlog } from '../src/lib/etat.js';

// Racine du depot iakaframe (a 2 niveaux au-dessus de cli/test/).
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('readEtat parse la table "Etat courant"', () => {
  const e = readEtat(REPO);
  assert.ok(e, 'etat des lieux trouve');
  assert.ok(e['Version'], 'champ Version present');
  assert.ok(e['Branche'], 'champ Branche present');
});

test('lastStep renvoie une chaine non vide', () => {
  const s = lastStep(REPO);
  assert.equal(typeof s, 'string');
  assert.ok(s.length > 0);
});

test('readEtat defensif sur dossier sans etat', () => {
  assert.equal(readEtat(path.join(REPO, 'cli')), null);
  assert.equal(lastStep(path.join(REPO, 'cli')), '(etat des lieux introuvable)');
});

test('backlog defensif quand CLAUDE.md absent', () => {
  const b = backlog(REPO);
  assert.ok(Array.isArray(b) && b.length >= 1);
  assert.match(b[0], /introuvable|vide/);
});
