// Couche bibliotheque : COLLECTIONS, scan, resolveId, checkRefs (I1), checkSchema, assemble
// (compat casting ⊇ roles). Isole sur test/fixtures/library/ (mini-pool), + un controle sur la
// vraie bibliotheque du depot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COLLECTIONS, COLLECTION_TYPES, collectionOf, scan, resolveId, readEntry,
  checkRefs, checkSchema, assemble, libraryRoot,
} from '../src/lib/library.js';

const CLAUDE_EMITS = ['.claude/agents/*', '.claude/skills/*', '.claude/hooks/*', 'CLAUDE.md'];

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures', 'library');
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)

test('COLLECTIONS : 13 types (dont frames, AR-1), skills en mode dossier', () => {
  assert.equal(COLLECTIONS.length, 13);
  assert.equal(COLLECTION_TYPES.length, 13);
  assert.equal(collectionOf('skills').kind, 'skill');
  assert.equal(collectionOf('personas').kind, 'flat');
  assert.equal(collectionOf('frames').kind, 'flat');   // AR-1 : frames = collection plate
  assert.equal(collectionOf('bidon'), null);
});

test('scan : compte correct sur le mini-pool + exclusions', () => {
  assert.equal(scan('personas', FIX).length, 2);
  assert.equal(scan('roles', FIX).length, 2);
  assert.equal(scan('skills', FIX).length, 1);            // s_cadrage (dossier + SKILL.md)
  assert.equal(scan('teams', FIX).length, 5);             // t_full, t_amputee, t_nocoord, t_badcoord, t_unknown
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
  assert.equal(r.descriptor.id, 'm_test-claude');           // convention coeur <methodId>-<node>
  assert.deepEqual(r.descriptor.emits, CLAUDE_EMITS);       // emits = globs par noeud (semantique coeur)
});

test('assemble : role sans persona dedie MAIS coordinateur present -> couvert (ok)', () => {
  // Regle decideur 2026-07-16 : le rôle `dev` (sans persona dedie) est absorbe par le
  // coordinateur p_cadreur -> plus d'orphelin bloquant, ok:true, info exposee.
  const r = assemble('m_test', 't_amputee', null, FIX);
  assert.equal(r.ok, true);
  assert.deepEqual(r.orphans, []);
  assert.deepEqual(r.coveredByCoordinator, ['dev']);
  assert.equal(r.coordinator, 'p_cadreur');
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /p_cadreur/);
  assert.match(r.warnings[0], /dev/);
});

test('assemble : garde-fou -> role non couvert SANS coordinateur reste orphelin (ok:false)', () => {
  const r = assemble('m_test', 't_nocoord', null, FIX);
  assert.equal(r.ok, false);
  assert.deepEqual(r.orphans, ['dev']);
  assert.deepEqual(r.coveredByCoordinator, []);
});

test('assemble : garde-fou -> coordinateur introuvable dans les personas reste bloquant', () => {
  const r = assemble('m_test', 't_badcoord', null, FIX);
  assert.equal(r.ok, false);
  assert.deepEqual(r.orphans, ['dev']);
  assert.deepEqual(r.coveredByCoordinator, []);
});

test('assemble : unknownPersonas (persona inexistant) reste bloquant', () => {
  const r = assemble('m_test', 't_unknown', null, FIX);
  assert.equal(r.ok, false);
  assert.deepEqual(r.unknownPersonas, ['p_fantome']);
  assert.deepEqual(r.orphans, []);            // cadrage+dev couverts par personas dedies
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
test('vraie bibliotheque : list personas = library PARTAGEE (12), assemble iakaframe/iakaframe-8 = 9/9', () => {
  // La library est PARTAGEE entre toutes les frames du reservoir : elle grossit legitimement.
  // 9 (roster iakaframe) + 3 (carter/gregan/meads, frame scrum rangee dans la library) = 12.
  // `scan` compte la REALITE du reservoir, pas une frame. Le frame-scoping vit dans la team.
  assert.equal(scan('personas', REPO).length, 12);
  // L'assemblage reste FRAME-SCOPE : la team iakaframe-8 = 9 personas couvrant 9 roles, inchange.
  const r = assemble('iakaframe', 'iakaframe-8', null, REPO);
  assert.equal(r.ok, true);
  assert.deepEqual(r.orphans, []);
  assert.equal(r.methodRoleKeys.length, 9); // + frame (9e role, en queue)
});

// --- Cas reel declencheur (2026-07-16) : team a 7 personas, helm retire ------------------
// La vraie methode iakaframe requiert le role `deploiement` (persona helm). Une team ou helm
// est retire mais qui garde un coordinateur (aragorn) doit desormais donner ok:true : aragorn
// absorbe `deploiement`. On monte une racine temporaire qui reutilise la VRAIE bibliotheque du
// depot (symlinks library/ + methods/) avec une team-fixture 7 personas (sans helm).
test('vraie bibliotheque : team 7 personas (helm retire) + coordinator aragorn -> ok (aragorn absorbe deploiement)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-helm-'));
  try {
    fs.symlinkSync(path.join(REPO, 'library'), path.join(tmp, 'library'));
    fs.symlinkSync(path.join(REPO, 'methods'), path.join(tmp, 'methods'));
    fs.mkdirSync(path.join(tmp, 'teams'));
    fs.writeFileSync(path.join(tmp, 'teams', 'iakaframe-7-no-helm.md'),
      '---\n' +
      'id: iakaframe-7-no-helm\n' +
      'name: Compagnie sans Helm\n' +
      'personas: [odin, aragorn, gandalf, gimli, legolas, loki, nathalie]\n' +
      'coordinator: aragorn\n' +
      '---\n# team 7 personas (helm retire) : deploiement pris par le coordinateur\n');

    const r = assemble('iakaframe', 'iakaframe-7-no-helm', null, tmp);
    assert.equal(r.ok, true);
    assert.deepEqual(r.orphans, []);
    // Cette fixture n'a NI helm NI feanor : deploiement ET frame (9e role) sont donc absorbes par
    // le coordinateur aragorn. La garde teste le meme mecanisme (role sans persona dediee -> ok:true).
    assert.deepEqual(r.coveredByCoordinator, ['deploiement', 'frame']);
    assert.equal(r.coordinator, 'aragorn');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// --- Reservoir de frames (AR-1) : type `frames` de 1re classe ----------------------------
test('frames : le descripteur default iakaframe est resolu (A3)', () => {
  const d = readEntry('frames', 'iakaframe', REPO);
  assert.ok(d, 'frames/iakaframe.md doit exister');
  assert.equal(d.data.methodId, 'iakaframe');
  assert.equal(d.data.teamId, 'iakaframe-8');
  assert.equal(d.data.default, true);
  assert.ok(d.data.version, 'le descripteur porte une version (AR-3)');
  // scan de la collection frames : le default present, le sous-dossier releases/ IGNORE (flat).
  const ids = scan('frames', REPO).map(e => e.id);
  assert.ok(ids.includes('iakaframe'));
  assert.ok(!ids.includes('releases'), 'sous-dossier releases/ hors scan flat');
});

test('checkRefs/checkSchema : frame (methodId∈methods, teamId∈teams)', () => {
  const ok = readEntry('frames', 'iakaframe', REPO);
  assert.equal(checkRefs('frame', ok.data, REPO).ok, true);
  assert.equal(checkSchema('frame', ok.data).ok, true);

  const broken = { id: 'x', methodId: 'iakaframe', teamId: 't_fantome' };
  const r = checkRefs('frame', broken, REPO);
  assert.equal(r.ok, false);
  assert.ok(r.missing.some(m => m.field === 'teamId' && m.id === 't_fantome'));

  const incomplete = checkSchema('frame', { id: 'x' });
  assert.equal(incomplete.ok, false);
  assert.deepEqual(incomplete.missing, ['methodId', 'teamId']);
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
