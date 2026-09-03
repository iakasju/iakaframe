// G4 — garde de mutation sur `peutDemander()` (Lot A, noyau, specs/instructions/
// cli-mode-guide-selections.md § Preuve/G4). Six cas ne faisant basculer QU'UNE condition, plus le
// cas nominal : la garde doit avoir un MODE D'ECHEC IDENTIFIABLE — si on lui retire une condition
// (mutation sur le PROGRAMME), UN ET UN SEUL cas doit rougir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { peutDemander } from '../src/lib/interactif.js';

// Base nominale : les six conditions tiennent -> true.
const NOMINAL = {
  json: false,
  guide: true,
  env: {},
  stdin: { isTTY: true },
  stdout: { isTTY: true },
};

test('peutDemander : cas nominal (les 6 conditions tiennent) -> true', () => {
  assert.equal(peutDemander(NOMINAL), true);
});

test('peutDemander : stdin non-TTY -> false', () => {
  assert.equal(peutDemander({ ...NOMINAL, stdin: { isTTY: false } }), false);
});

test('peutDemander : stdout non-TTY -> false', () => {
  assert.equal(peutDemander({ ...NOMINAL, stdout: { isTTY: false } }), false);
});

test('peutDemander : CI present et non-neutre -> false', () => {
  assert.equal(peutDemander({ ...NOMINAL, env: { CI: '1' } }), false);
});

test('peutDemander : IAKA_NON_INTERACTIF present et non-neutre -> false', () => {
  assert.equal(peutDemander({ ...NOMINAL, env: { IAKA_NON_INTERACTIF: '1' } }), false);
});

test('peutDemander : json === true -> false', () => {
  assert.equal(peutDemander({ ...NOMINAL, json: true }), false);
});

test('peutDemander : guide !== true -> false', () => {
  assert.equal(peutDemander({ ...NOMINAL, guide: false }), false);
});

// --- Neutralite de CI/IAKA_NON_INTERACTIF : une variable presente mais FAUSSE ne bloque pas -----
// (certains runners exportent litteralement CI=false — M3/inconnue #4 de l'instruction).

test('peutDemander : CI="false" est NEUTRE (ne bloque pas) -> true', () => {
  assert.equal(peutDemander({ ...NOMINAL, env: { CI: 'false' } }), true);
});

test('peutDemander : CI="0" est NEUTRE (ne bloque pas) -> true', () => {
  assert.equal(peutDemander({ ...NOMINAL, env: { CI: '0' } }), true);
});

test('peutDemander : IAKA_NON_INTERACTIF="" est NEUTRE (ne bloque pas) -> true', () => {
  assert.equal(peutDemander({ ...NOMINAL, env: { IAKA_NON_INTERACTIF: '' } }), true);
});
