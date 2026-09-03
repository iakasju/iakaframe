// lib/guidage.js — moteur de selection, palier 1 (Lot A, specs/instructions/
// cli-mode-guide-selections.md § LOT A). `choisirDansListe` est la couture TESTABLE (ask injecte),
// sur le modele deja eprouve de `pickAndAct` (models.js:519-521) — c'est elle qui sert de CONTROLE
// POSITIF (G2) au reste du lot : sans elle, « aucun prompt en non-TTY » (G1) serait un temoin vide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  choisirDansListe, assemblerArgv, ligneEquivalente, peutModeBrut, ECHAPPATOIRES_INTERDITES,
} from '../src/lib/guidage.js';

const ITEMS = [{ id: 'sonnet', label: 'sonnet' }, { id: 'opus', label: 'opus' }, { id: 'haiku', label: 'haiku' }];

function silencieux() { return () => {}; }

test('choisirDansListe : selection d\'un item par numero', async () => {
  const answers = ['2'];
  const res = await choisirDansListe({ ask: async () => answers.shift(), items: ITEMS, titre: 'Modele :', log: silencieux() });
  assert.deepEqual(res, { type: 'item', item: { id: 'opus', label: 'opus' } });
});

test('choisirDansListe : reponse vide -> annule (rien choisi)', async () => {
  const res = await choisirDansListe({ ask: async () => '', items: ITEMS, titre: 'Modele :', log: silencieux() });
  assert.equal(res.type, 'annule');
});

test('choisirDansListe : numero hors bornes -> annule', async () => {
  const res = await choisirDansListe({ ask: async () => '99', items: ITEMS, titre: 'Modele :', log: silencieux() });
  assert.equal(res.type, 'annule');
});

test('choisirDansListe : valeur non numerique -> annule (jamais une exception)', async () => {
  const res = await choisirDansListe({ ask: async () => 'zzz', items: ITEMS, titre: 'Modele :', log: silencieux() });
  assert.equal(res.type, 'annule');
});

test('choisirDansListe : entree LIBRE proposee et choisie (A4.1 — regle 1)', async () => {
  const answers = ['4', 'claude-opus-5[1m]'];   // items.length+1 = l'entree libre
  const res = await choisirDansListe({
    ask: async () => answers.shift(), items: ITEMS, titre: 'Modele :', permettreLibre: true, log: silencieux(),
  });
  assert.deepEqual(res, { type: 'libre', valeur: 'claude-opus-5[1m]' });
});

test('choisirDansListe : liste VIDE sans entree libre -> vide (R7, jamais un repli en dur)', async () => {
  const res = await choisirDansListe({ ask: async () => '1', items: [], titre: 'Persona :', log: silencieux() });
  assert.equal(res.type, 'vide');
});

test('choisirDansListe : liste VIDE MEME AVEC entree libre permise -> vide QUAND MEME (CA-10, § Preuve)', async () => {
  // Un menu reduit a la seule ligne « saisir » ne serait pas un repli, ce serait une ceremonie
  // sans objet — CA-10 : « le dit et rend la main, SANS repli en dur ». `ask` n'est JAMAIS appele.
  let appele = false;
  const res = await choisirDansListe({
    ask: async () => { appele = true; return '1'; }, items: [], titre: 'Persona :', permettreLibre: true, libelleLibre: 'saisir', log: silencieux(),
  });
  assert.deepEqual(res, { type: 'vide' });
  assert.equal(appele, false, 'ask() ne doit JAMAIS etre appele quand la liste est vide (CA-10)');
});

test('choisirDansListe : les libelles rendus SONT ceux passes par l\'appelant (aucune valeur en dur ici, G3a)', async () => {
  const lignes = [];
  await choisirDansListe({ ask: async () => '', items: ITEMS, titre: 'X', log: (l) => lignes.push(l) });
  for (const it of ITEMS) assert.ok(lignes.some((l) => l.includes(it.label)), `libelle absent du rendu : ${it.label}`);
});

// --- A3 : ligne equivalente ----------------------------------------------------------------------

test('ligneEquivalente : forme imposee « → iakaframe ... »', () => {
  const l = ligneEquivalente(['models', 'set', 'gandalf', 'opus[1m]', '--path', '/repo']);
  assert.equal(l, '  → iakaframe models set gandalf opus[1m] --path /repo');
});

test('ligneEquivalente : echappe les arguments porteurs d\'espace', () => {
  const l = ligneEquivalente(['banner', 'un titre avec espaces']);
  assert.equal(l, '  → iakaframe banner "un titre avec espaces"');
});

// --- A4.3 : interdiction NON NEGOCIABLE, mutation-eprouvable --------------------------------------

test('assemblerArgv : argv normal -> rendu tel quel', () => {
  assert.deepEqual(assemblerArgv(['set', 'gandalf', 'opus']), ['set', 'gandalf', 'opus']);
});

for (const tok of ECHAPPATOIRES_INTERDITES) {
  test(`assemblerArgv : refuse ${tok} (A4.3, NON NEGOCIABLE)`, () => {
    assert.throws(() => assemblerArgv(['set', 'gandalf', 'opus', tok]), /echappatoire interdite/);
  });
}

// --- peutModeBrut : capacite, jamais un TIRAGE (deterministe sur des objets factices) ------------

test('peutModeBrut : TTY + setRawMode des deux cotes -> true', () => {
  assert.equal(peutModeBrut({ isTTY: true, setRawMode: () => {} }, { isTTY: true }), true);
});

test('peutModeBrut : pas de TTY -> false', () => {
  assert.equal(peutModeBrut({ isTTY: false }, { isTTY: true }), false);
});

test('peutModeBrut : setRawMode absent (terminal exotique) -> false (repli automatique, A1)', () => {
  assert.equal(peutModeBrut({ isTTY: true }, { isTTY: true }), false);
});

test('peutModeBrut : stdout non-TTY -> false', () => {
  assert.equal(peutModeBrut({ isTTY: true, setRawMode: () => {} }, { isTTY: false }), false);
});
