// resolveSkills : resolution TRANSITIVE + detection de cycles + determinisme
// (deploiement-skills-runtime.md § 5.1, C1-C7). Le canon reel verrouille C1-C5 ; cycle (C6) et
// skill inexistante (C7) sont eprouves sur une mini-bibliotheque en dossier temporaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSkills } from '../src/lib/resolve-skills.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)

// --- 1. Canon reel : resolutions normatives (C1-C4) ---------------------------------------------

test('C1 resolveSkills(gimli) : chaine fabrication transitive complete (7, aucune troncature)', () => {
  assert.deepEqual(resolveSkills('gimli', { root: REPO }), [
    'iakaframe-fabrication', 'iakaframe-gestion-de-source', 'iakaframe-git', 'iakaframe-forgejo',
    'iakaframe-conteneurisation', 'iakaframe-docker', 'iakaframe-jalon',
  ]);
});

test('C2 resolveSkills(gandalf) : cadrage -> jalon puis lecture-maquettes (3)', () => {
  assert.deepEqual(resolveSkills('gandalf', { root: REPO }), [
    'iakaframe-cadrage', 'iakaframe-jalon', 'iakaframe-lecture-maquettes',
  ]);
});

test('C3 resolveSkills(feanor) : frame -> jalon (2)', () => {
  assert.deepEqual(resolveSkills('feanor', { root: REPO }), ['iakaframe-frame', 'iakaframe-jalon']);
});

test('C4 resolveSkills(nathalie/odin/aragorn) : non-regression des ex-tables codees', () => {
  assert.deepEqual(resolveSkills('nathalie', { root: REPO }), [
    'iakaframe-nathalie', 'iakaframe-memoire-humaine', 'iakaframe-appflowy-doc',
  ]);
  assert.deepEqual(resolveSkills('odin', { root: REPO }), ['iakaframe-odin', 'iakastart']);
  assert.deepEqual(resolveSkills('aragorn', { root: REPO }), ['iakaframe-aragorn', 'iakaframe-jalon']);
});

test('C4bis legolas/helm/loki : une skill seule (1)', () => {
  assert.deepEqual(resolveSkills('legolas', { root: REPO }), ['iakaframe-qualite']);
  assert.deepEqual(resolveSkills('helm', { root: REPO }), ['iakaframe-deploiement']);
  assert.deepEqual(resolveSkills('loki', { root: REPO }), ['iakaframe-naonedge']);
});

test('C5 determinisme : deux resolutions successives identiques', () => {
  assert.deepEqual(resolveSkills('gimli', { root: REPO }), resolveSkills('gimli', { root: REPO }));
});

test('C5bis dedoublonnage : odin declare [odin, iakastart] ET odin->iakastart => 1 seul iakastart, 1re position', () => {
  const r = resolveSkills('odin', { root: REPO });
  assert.equal(r.filter((s) => s === 'iakastart').length, 1, 'iakastart une seule fois');
  assert.equal(r.indexOf('iakastart'), 1, 'iakastart en 2e position (apres odin)');
});

// --- 2. Mini-bibliotheque temporaire : cycle (C6) + skill inexistante (C7) -----------------------

function miniLib() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-resolve-'));
  // double marqueur library/+methods/ (isLibraryRootDir) pour que resolveSkills accepte ce root.
  fs.mkdirSync(path.join(root, 'methods'), { recursive: true });
  fs.mkdirSync(path.join(root, 'library', 'personas'), { recursive: true });
  fs.mkdirSync(path.join(root, 'library', 'skills'), { recursive: true });
  return root;
}
function writePersona(root, id, skills) {
  fs.writeFileSync(path.join(root, 'library', 'personas', `${id}.md`),
    `---\nname: ${id}\nskills: [${skills.join(', ')}]\n---\n# ${id}\n`);
}
function writeSkill(root, id, subskills) {
  const dir = path.join(root, 'library', 'skills', id);
  fs.mkdirSync(dir, { recursive: true });
  const sub = subskills && subskills.length ? `subskills: [${subskills.join(', ')}]\n` : '';
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${id}\n${sub}---\n# ${id}\n`);
}

test('C6 cycle a->b->a : erreur explicite nommant le cycle (jamais boucle infinie)', () => {
  const root = miniLib();
  writePersona(root, 'p', ['a']);
  writeSkill(root, 'a', ['b']);
  writeSkill(root, 'b', ['a']);
  assert.throws(() => resolveSkills('p', { root }), /cycle de skills detecte : a -> b -> a/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('C6bis auto-cycle a->a : erreur explicite', () => {
  const root = miniLib();
  writePersona(root, 'p', ['a']);
  writeSkill(root, 'a', ['a']);
  assert.throws(() => resolveSkills('p', { root }), /cycle de skills detecte : a -> a/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('C7 skill referencee mais inexistante : erreur explicite (jamais skip silencieux)', () => {
  const root = miniLib();
  writePersona(root, 'p', ['a']);
  writeSkill(root, 'a', ['fantome']); // 'fantome' n'existe pas
  assert.throws(() => resolveSkills('p', { root }), /skill referencee introuvable : fantome/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('diamant (non-cycle) : skill atteinte par 2 chemins => 1 occurrence, pas d erreur', () => {
  const root = miniLib();
  writePersona(root, 'p', ['a', 'b']);
  writeSkill(root, 'a', ['shared']);
  writeSkill(root, 'b', ['shared']);
  writeSkill(root, 'shared', []);
  assert.deepEqual(resolveSkills('p', { root }), ['a', 'shared', 'b']);
  fs.rmSync(root, { recursive: true, force: true });
});

test('persona introuvable : erreur', () => {
  assert.throws(() => resolveSkills('inexistant', { root: REPO }), /persona introuvable/);
});
