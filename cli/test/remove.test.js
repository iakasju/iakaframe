// Symetrie +/- (instruction symetrie-ajout-suppression.md, S7). Couvre le socle « retrait sur »
// (findReferrers/RESTRICT, corbeille restaurable, mutation chirurgicale de skills:[]) et les verbes
// remove/attach/detach de bout en bout. Isole sur une bibliotheque tmp (jamais le vrai ~/.iaka ni
// la vraie library/ du depot).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  findReferrers, rewriteSkillsLine, makeTrash, moveToTrash, restoreFromTrash,
  readPersonaSkills,
} from '../src/lib/remove.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');

// --- Fabrique une mini-bibliotheque temporaire (double marqueur library/+methods/) -----------
function mkLib() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-remove-'));
  const w = (rel, content) => {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  };
  // Persona avec un champ non-skills a PRESERVER (pastille quotee) + skill attache.
  w('library/personas/gandalf.md',
    '---\nid: gandalf\nname: Gandalf\nroleKey: cadrage\npastille: "🔵"\nskills: [iakaframe-cadrage]\nguardrails: [identity]\n---\n# Gandalf\ncorps inchangé\n');
  w('library/personas/p_dev.md', '---\nid: p_dev\nname: Dev\nroleKey: dev\n---\n# Dev\n');
  w('library/skills/iakaframe-cadrage/SKILL.md', '---\nid: iakaframe-cadrage\nname: cadrage\n---\n# skill cadrage\n');
  w('library/skills/orphan-skill/SKILL.md', '---\nid: orphan-skill\nname: orphelin\n---\n# skill orphelin\n');
  w('methods/m_test.md', '---\nid: m_test\nname: M\nworkflowId: w\nroleKeys: [cadrage]\n---\n# m\n');
  w('teams/t_full.md', '---\nid: t_full\nname: T\npersonas: [gandalf, p_dev]\ncoordinator: gandalf\n---\n# t\n');
  w('teams/t_orphan.md', '---\nid: t_orphan\nname: TO\npersonas: [p_dev]\ncoordinator: p_dev\n---\n# to\n');
  w('bindings/b_test.md', '---\nid: b_test\nmethodId: m_test\nteamId: t_full\nassignments:\n  - { personaId: p_dev, runner: claude-code }\n---\n# b\n');
  return root;
}

function cli(args) {
  try { return { code: 0, out: execFileSync('node', [CLI, ...args], { encoding: 'utf8' }) }; }
  catch (e) { return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }; }
}
const rm = (root) => fs.rmSync(root, { recursive: true, force: true });
const trashDirs = (root) => fs.readdirSync(root).filter((n) => n.startsWith('.trash-'));

// ===== Socle S1 (unitaire) ==================================================================

test('findReferrers : skill reference par un persona (RESTRICT)', () => {
  const root = mkLib();
  try {
    const refs = findReferrers('skills', 'iakaframe-cadrage', root);
    assert.deepEqual(refs, [{ type: 'personas', id: 'gandalf', field: 'skills' }]);
    assert.deepEqual(findReferrers('skills', 'orphan-skill', root), []);
  } finally { rm(root); }
});

test('findReferrers : team reference par un binding (teamId)', () => {
  const root = mkLib();
  try {
    assert.deepEqual(findReferrers('teams', 't_full', root),
      [{ type: 'bindings', id: 'b_test', field: 'teamId' }]);
    assert.deepEqual(findReferrers('teams', 't_orphan', root), []);
  } finally { rm(root); }
});

test('findReferrers : method reference par un binding (methodId)', () => {
  const root = mkLib();
  try {
    assert.deepEqual(findReferrers('methods', 'm_test', root),
      [{ type: 'bindings', id: 'b_test', field: 'methodId' }]);
  } finally { rm(root); }
});

test('rewriteSkillsLine : mute le SEUL skills:[] (Q-1), preserve le reste (pastille quotee)', () => {
  const src = '---\nid: g\npastille: "🔵"\nskills: [a, b]\nguardrails: [identity]\n---\n# corps\ntexte\n';
  const out = rewriteSkillsLine(src, ['a']);
  assert.match(out, /skills: \[a\]/);
  assert.match(out, /pastille: "🔵"/);        // champ voisin intact (pas de re-serialisation globale)
  assert.match(out, /guardrails: \[identity\]/);
  assert.match(out, /# corps\ntexte/);         // corps intact
  assert.ok(!out.includes('skills: [a, b]'));
});

test('rewriteSkillsLine : liste vide + ajout dans un persona sans ligne skills', () => {
  assert.match(rewriteSkillsLine('---\nid: g\nskills: [a]\n---\n# c\n', []), /skills: \[\]/);
  const added = rewriteSkillsLine('---\nid: g\nroleKey: dev\n---\n# c\n', ['x']);
  assert.match(added, /skills: \[x\]/);
  assert.match(added, /roleKey: dev/);
});

test('corbeille : moveToTrash preserve le chemin relatif et restaure (restaurable)', () => {
  const root = mkLib();
  try {
    const target = path.join(root, 'teams', 't_orphan.md');
    const trash = makeTrash(root);
    const item = moveToTrash(root, target, trash);
    assert.equal(item.rel, path.join('teams', 't_orphan.md'));
    assert.ok(!fs.existsSync(target));                    // retire de la vue
    assert.ok(fs.existsSync(item.to));                    // present en corbeille
    restoreFromTrash(root, trash, item.rel);
    assert.ok(fs.existsSync(target));                     // restaure a l'identique
  } finally { rm(root); }
});

// ===== S2 : attach / detach skill<->persona =================================================

test('detach puis attach : mute skills:[] et est reversible', () => {
  const root = mkLib();
  try {
    const gandalf = path.join(root, 'library', 'personas', 'gandalf.md');

    let r = cli(['detach', 'iakaframe-cadrage', '--persona', 'gandalf', '--root', root, '--json']);
    assert.equal(r.code, 0);
    assert.equal(JSON.parse(r.out).changed, true);
    assert.deepEqual(readPersonaSkills(gandalf), []);
    assert.match(fs.readFileSync(gandalf, 'utf8'), /pastille: "🔵"/);   // reste preserve

    r = cli(['attach', 'iakaframe-cadrage', '--persona', 'gandalf', '--root', root, '--json']);
    assert.equal(r.code, 0);
    assert.deepEqual(readPersonaSkills(gandalf), ['iakaframe-cadrage']);   // restaure
  } finally { rm(root); }
});

test('detach idempotent (no-op) + attach refuse un skill inexistant sans --force (I1)', () => {
  const root = mkLib();
  try {
    const r1 = cli(['detach', 'zzz', '--persona', 'p_dev', '--root', root, '--json']);
    assert.equal(JSON.parse(r1.out).changed, false);

    const r2 = cli(['attach', 'skill-fantome', '--persona', 'p_dev', '--root', root, '--json']);
    assert.equal(r2.code, 1);
    assert.match(JSON.parse(r2.out).error, /introuvable/);
  } finally { rm(root); }
});

// ===== S3 : remove team|method|binding ======================================================

test('remove team : RESTRICT si reference par un binding, cascade explicite l\'archive', () => {
  const root = mkLib();
  try {
    // RESTRICT par defaut : refus + liste des referents, rien retire.
    let r = cli(['remove', 'team', 't_full', '--root', root, '--json']);
    assert.equal(r.code, 1);
    let j = JSON.parse(r.out);
    assert.equal(j.reason, 'restrict');
    assert.ok(j.referrers.some((x) => x.type === 'bindings' && x.id === 'b_test'));
    assert.ok(fs.existsSync(path.join(root, 'teams', 't_full.md')));   // intact

    // Cascade sans --yes : confirmation requise, rien retire.
    r = cli(['remove', 'team', 't_full', '--cascade', '--root', root, '--json']);
    assert.equal(r.code, 1);
    assert.equal(JSON.parse(r.out).reason, 'confirm-required');
    assert.ok(fs.existsSync(path.join(root, 'teams', 't_full.md')));

    // Cascade confirmee : team + binding referent archives en corbeille.
    r = cli(['remove', 'team', 't_full', '--cascade', '--yes', '--root', root, '--json']);
    assert.equal(r.code, 0);
    j = JSON.parse(r.out);
    assert.ok(!fs.existsSync(path.join(root, 'teams', 't_full.md')));
    assert.ok(!fs.existsSync(path.join(root, 'bindings', 'b_test.md')));
    assert.ok(fs.existsSync(path.join(j.trash, 'teams', 't_full.md')));
    assert.ok(fs.existsSync(path.join(j.trash, 'bindings', 'b_test.md')));
  } finally { rm(root); }
});

test('remove binding orphelin : archive direct en corbeille (restaurable) + trace', () => {
  const root = mkLib();
  try {
    const r = cli(['remove', 'binding', 'b_test', '--root', root, '--json']);
    assert.equal(r.code, 0);
    const j = JSON.parse(r.out);
    assert.ok(!fs.existsSync(path.join(root, 'bindings', 'b_test.md')));
    assert.ok(fs.existsSync(path.join(j.trash, 'bindings', 'b_test.md')));
    assert.ok(fs.existsSync(path.join(j.trash, 'manifest.json')));   // trace
    assert.equal(trashDirs(root).length, 1);
  } finally { rm(root); }
});

test('remove <inexistant> : refus propre', () => {
  const root = mkLib();
  try {
    const r = cli(['remove', 'team', 'nope', '--root', root, '--json']);
    assert.equal(r.code, 1);
    assert.match(JSON.parse(r.out).error, /introuvable/);
  } finally { rm(root); }
});

// ===== S4 : de-materialisation d'un skill ===================================================

test('remove skill : RESTRICT si un persona le reference (oriente vers detach)', () => {
  const root = mkLib();
  try {
    const r = cli(['remove', 'skill', 'iakaframe-cadrage', '--root', root, '--json']);
    assert.equal(r.code, 1);
    const j = JSON.parse(r.out);
    assert.equal(j.reason, 'restrict');
    assert.ok(j.referrers.some((x) => x.type === 'personas' && x.id === 'gandalf'));
    assert.ok(fs.existsSync(path.join(root, 'library', 'skills', 'iakaframe-cadrage', 'SKILL.md')));
  } finally { rm(root); }
});

test('remove skill : apres detach, de-materialisation OK et restaurable', () => {
  const root = mkLib();
  try {
    cli(['detach', 'iakaframe-cadrage', '--persona', 'gandalf', '--root', root]);
    const r = cli(['remove', 'skill', 'iakaframe-cadrage', '--root', root, '--json']);
    assert.equal(r.code, 0);
    const j = JSON.parse(r.out);
    assert.ok(!fs.existsSync(path.join(root, 'library', 'skills', 'iakaframe-cadrage')));
    assert.ok(fs.existsSync(path.join(j.trash, 'library', 'skills', 'iakaframe-cadrage', 'SKILL.md')));
  } finally { rm(root); }
});

test('remove skill --cascade --yes : detache de tous les personas puis de-materialise', () => {
  const root = mkLib();
  try {
    const r = cli(['remove', 'skill', 'iakaframe-cadrage', '--cascade', '--yes', '--root', root, '--json']);
    assert.equal(r.code, 0);
    const j = JSON.parse(r.out);
    assert.deepEqual(j.detached, ['gandalf']);
    assert.deepEqual(readPersonaSkills(path.join(root, 'library', 'personas', 'gandalf.md')), []);
    assert.ok(!fs.existsSync(path.join(root, 'library', 'skills', 'iakaframe-cadrage')));
  } finally { rm(root); }
});

// ===== S5 : symetrie memoire exposee (reutilise T1, zero backend neuf) =======================

test('memory remove : expose au meme niveau que add (reutilise memoryRemove, non-regression)', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-mem-'));
  try {
    cli(['memory', 'add', 'profil', 'préfère les tests node --test', '--home', home]);
    let list = cli(['memory', 'list', 'profil', '--home', home]);
    assert.match(list.out, /préfère les tests node --test/);

    const r = cli(['memory', 'remove', 'profil', 'préfère les tests node --test', '--home', home]);
    assert.equal(r.code, 0);
    list = cli(['memory', 'list', 'profil', '--home', home]);
    assert.ok(!list.out.includes('préfère les tests node --test'));

    // Verrou anti-reimplementation : la commande memory REUTILISE memoryRemove (aucun backend neuf).
    const src = fs.readFileSync(path.join(HERE, '..', 'src', 'commands', 'memory.js'), 'utf8');
    assert.ok(src.includes('memoryRemove'), 'memory remove doit reutiliser memoryRemove (T1)');
  } finally { rm(home); }
});

// ===== Non-regression du dispatch ============================================================

test('index.js : dispatch remove/attach/detach mappe + present dans HELP', () => {
  const src = fs.readFileSync(CLI, 'utf8');
  for (const c of ["case 'remove':", "case 'attach':", "case 'detach':"]) {
    assert.ok(src.includes(c), `dispatch manquant : ${c}`);
  }
  const help = cli(['--help']).out;
  for (const v of ['remove <kind>', 'attach <skill>', 'detach <skill>']) {
    assert.ok(help.includes(v), `aide manquante : ${v}`);
  }
});
