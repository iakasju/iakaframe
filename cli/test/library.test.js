// Couche bibliotheque : COLLECTIONS, scan, resolveId, checkRefs (I1), checkSchema, assemble
// (compat casting ⊇ roles). Isole sur test/fixtures/library/ (mini-pool), + un controle sur la
// vraie bibliotheque du depot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COLLECTIONS, COLLECTION_TYPES, collectionOf, scan, resolveId, readEntry,
  checkRefs, checkSchema, assemble, libraryRoot,
} from '../src/lib/library.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures', 'library');
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)

test('COLLECTIONS : 12 types, dont skills en mode dossier', () => {
  assert.equal(COLLECTIONS.length, 12);
  assert.equal(COLLECTION_TYPES.length, 12);
  assert.equal(collectionOf('skills').kind, 'skill');
  assert.equal(collectionOf('personas').kind, 'flat');
  assert.equal(collectionOf('bidon'), null);
});

test('scan : compte correct sur le mini-pool + exclusions', () => {
  assert.equal(scan('personas', FIX).length, 2);
  assert.equal(scan('roles', FIX).length, 2);
  assert.equal(scan('skills', FIX).length, 1);            // s_cadrage (dossier + SKILL.md)
  assert.equal(scan('teams', FIX).length, 2);             // t_full + t_amputee
  assert.deepEqual(scan('personas', FIX).map(e => e.id), ['p_cadreur', 'p_dev']);
});

test('scan : collection absente -> [] (structure partielle, pas une erreur)', () => {
  assert.deepEqual(scan('kits', FIX), []);
});

test('resolveId : trouve par scan multi-collections', () => {
  assert.deepEqual(resolveId('p_dev', FIX).map(e => e.type), ['personas']);
  assert.deepEqual(resolveId('inexistant', FIX), []);
});

test('readEntry : frontmatter + corps', () => {
  const e = readEntry('teams', 't_full', FIX);
  assert.equal(e.data.coordinator, 'p_cadreur');
  assert.ok(e.body.includes('team complète'));
});

test('checkRefs : team OK vs reference cassee', () => {
  const okTeam = readEntry('teams', 't_full', FIX);
  assert.equal(checkRefs('team', okTeam.data, FIX).ok, true);

  const broken = { id: 'x', personas: ['p_cadreur', 'p_fantome'], coordinator: 'p_cadreur' };
  const r = checkRefs('team', broken, FIX);
  assert.equal(r.ok, false);
  assert.ok(r.missing.some(m => m.id === 'p_fantome' && m.collection === 'personas'));
});

test('checkRefs : binding teamId casse + runner invalide', () => {
  const bad = { id: 'b', methodId: 'm_test', teamId: 't_fantome',
    assignments: [{ personaId: 'p_dev', runner: 'gpt' }] };
  const r = checkRefs('binding', bad, FIX);
  assert.equal(r.ok, false);
  assert.ok(r.missing.some(m => m.field === 'teamId' && m.id === 't_fantome'));
  assert.ok(r.badRunners.some(b => b.runner === 'gpt'));
});

test('checkRefs/checkSchema : binding converge E1 (alias `bindings` + node/origin)', () => {
  // Forme E1 : pas de methodId, affectations sous `bindings` (alias de `assignments`), + node/origin.
  const e1 = {
    id: 'b_e1', teamId: 't_full', node: 'claude', origin: 'forge-default',
    bindings: [{ personaId: 'p_dev', runner: 'claude-code', model: '' }],
  };
  assert.equal(checkSchema('binding', e1).ok, true, 'schema E1 valide (id+teamId+bindings)');
  assert.equal(checkRefs('binding', e1, FIX).ok, true, 'refs E1 valides (bindings lu comme assignments)');

  // Forme pool (assignments) reste valide -> retro-compat non cassee.
  const pool = { id: 'b_pool', methodId: 'm_test', teamId: 't_full',
    assignments: [{ personaId: 'p_dev', runner: 'claude-code', model: '' }] };
  assert.equal(checkSchema('binding', pool).ok, true);

  // Ni assignments ni bindings -> schema incomplet.
  const empty = checkSchema('binding', { id: 'b', teamId: 't_full' });
  assert.equal(empty.ok, false);
  assert.ok(empty.missing.includes('assignments|bindings'));
});

test('checkSchema : champs requis par kind', () => {
  assert.equal(checkSchema('team', { id: 't', personas: ['a'], coordinator: 'a' }).ok, true);
  const miss = checkSchema('team', { id: 't' });
  assert.equal(miss.ok, false);
  assert.deepEqual(miss.missing, ['personas', 'coordinator']);
});

test('assemble : compatible (casting couvre les roles de la methode)', () => {
  const r = assemble('m_test', 't_full', 'b_test', FIX);
  assert.equal(r.ok, true);
  assert.deepEqual(r.orphans, []);
  assert.equal(r.binding.id, 'b_test');
  assert.equal(r.descriptor.methodId, 'm_test');
  assert.equal(r.descriptor.emits.length, 2);
});

test('assemble : team amputee -> echec avec role orphelin', () => {
  const r = assemble('m_test', 't_amputee', null, FIX);
  assert.equal(r.ok, false);
  assert.deepEqual(r.orphans, ['dev']);
});

test('assemble : binding incoherent -> echec', () => {
  const r = assemble('m_test', 't_amputee', 'b_test', FIX); // b_test.teamId = t_full != t_amputee
  assert.equal(r.ok, false);
  assert.ok(r.error && r.error.includes('incoherent'));
});

test('assemble : auto-selection du binding par defaut (m_test+t_full)', () => {
  const r = assemble('m_test', 't_full', null, FIX);
  assert.equal(r.binding.id, 'b_test'); // seul binding compatible
});

// --- Controle sur la VRAIE bibliotheque du depot ---
test('vraie bibliotheque : list personas = 8, assemble iakaframe/iakaframe-8 = 8/8', () => {
  assert.equal(scan('personas', REPO).length, 8);
  const r = assemble('iakaframe', 'iakaframe-8', null, REPO);
  assert.equal(r.ok, true);
  assert.deepEqual(r.orphans, []);
  assert.equal(r.methodRoleKeys.length, 8);
});

test('libraryRoot : --root prioritaire', () => {
  assert.equal(libraryRoot('/tmp/x'), path.resolve('/tmp/x'));
});

test('libraryRoot : IAKAFRAME_HOME distinct de IAKAFRAME_ROOT', () => {
  const oldHome = process.env.IAKAFRAME_HOME;
  process.env.IAKAFRAME_HOME = '/srv/lib';
  try { assert.equal(libraryRoot(), path.resolve('/srv/lib')); }
  finally { if (oldHome === undefined) delete process.env.IAKAFRAME_HOME; else process.env.IAKAFRAME_HOME = oldHome; }
});
