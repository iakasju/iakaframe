// G4 — garde de mutation sur `peutDemander()` (Lot A, noyau, specs/instructions/
// cli-mode-guide-selections.md § Preuve/G4). Six cas ne faisant basculer QU'UNE condition, plus le
// cas nominal : la garde doit avoir un MODE D'ECHEC IDENTIFIABLE — si on lui retire une condition
// (mutation sur le PROGRAMME), UN ET UN SEUL cas doit rougir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { peutDemander, lireLigneFeuVert } from '../src/lib/interactif.js';

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

// --- Port de feu vert (AR-M1(a), contrat-machine-du-verbe-install.md § 5 etape 3, CA-M4/CA-M5/
//     CA-M6) : le SEUL second lecteur de stdin legitime (G3b). Defaut = REFUS, sur cinq chemins
//     distincts, chacun motive — jamais un feu vert suppose.

function stdinDe(...lignes) {
  return Readable.from(lignes.map((l) => `${l}\n`));
}

test('lireLigneFeuVert : forme objet {"etape":n,"reponse":"oui"} sur la BONNE etape -> accorde', async () => {
  const r = await lireLigneFeuVert({ etape: 2, input: stdinDe('{"etape":2,"reponse":"oui"}') });
  assert.equal(r.accorde, true);
});

test('lireLigneFeuVert : forme nue "oui" (suppose repondre a l\'etape demandee) -> accorde', async () => {
  const r = await lireLigneFeuVert({ etape: 1, input: stdinDe('oui') });
  assert.equal(r.accorde, true);
});

test('lireLigneFeuVert : reponse "non" explicite -> refus, motif nomme', async () => {
  const r = await lireLigneFeuVert({ etape: 1, input: stdinDe('non') });
  assert.equal(r.accorde, false);
  assert.match(r.motif, /refuse/);
});

test('CA-M5(1) : EOF sans aucune ligne -> refus par defaut, motif "EOF"', async () => {
  const r = await lireLigneFeuVert({ etape: 1, input: Readable.from([]) });
  assert.equal(r.accorde, false);
  assert.match(r.motif, /EOF/);
});

test('CA-M5(2) : ligne vide -> refus', async () => {
  const r = await lireLigneFeuVert({ etape: 1, input: stdinDe('') });
  assert.equal(r.accorde, false);
  assert.match(r.motif, /vide/);
});

test('CA-M5(3) : JSON illisible / reponse non reconnue -> refus', async () => {
  const r = await lireLigneFeuVert({ etape: 1, input: stdinDe('n\'importe quoi') });
  assert.equal(r.accorde, false);
  assert.match(r.motif, /non reconnue/);
});

test('CA-M6 : reponse hors sequence (etape recue != etape attendue) -> REFUS, jamais un feu vert', () => {
  return lireLigneFeuVert({ etape: 2, input: stdinDe('{"etape":4,"reponse":"oui"}') }).then((r) => {
    assert.equal(r.accorde, false, 'une reponse oui sur une AUTRE etape ne doit jamais accorder CETTE etape');
    assert.match(r.motif, /hors sequence/);
  });
});

// Contrefactuel de CA-M6 (documente ici, contrefactuel programme dans install-contrat-machine.test.js
// pour la chaine complete) : si la comparaison `etapeRepondue !== etape` etait retiree de
// lib/interactif.js, ce test rougirait en obtenant `accorde:true` sur une etape non demandee.
