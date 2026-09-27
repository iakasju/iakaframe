// runnerSkills (specs/instructions/skills-propres-au-runner.md, Q1-Q6 validees 27/09/2026) :
// skills PROPRES A UN RUNNER (Claude Code, hors reservoir library/skills/), portees par la
// persona sous un champ SEPARE, facultatif. Ce test verrouille : (1) le resolveur les ignore par
// construction, (2) generateAgent est le SEUL point d'injection (runner claude, dedoublonne,
// ordre), (3) les 3 regles `frame lint` (Q5 = B : AVERTISSEMENTS, jamais bloquant), (4) la garde
// du coeur neutre sur le canon reel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSkills } from '../src/lib/resolve-skills.js';
import { generateAgent } from '../src/lib/generate-agents.js';
import { lintFrame } from '../src/lib/frame-lint.js';
import { scan, readEntry, toArray } from '../src/lib/library.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)

const RUNNER_SKILL_NAMES = [
  'anthropic-skills:docs', 'design:design-critique', 'design:design-system',
  'design:accessibility-review', 'design:ux-copy', 'artifact-design', 'artifact-diagramming',
  'dataviz',
];

function W(file, content) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }

// --- 1. Fixture de reservoir minimal (calque resolve-skills.test.js / frame-lint.test.js) --------
function miniLib() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-skills-'));
  fs.mkdirSync(path.join(root, 'methods'), { recursive: true }); // marqueur isLibraryRootDir
  fs.mkdirSync(path.join(root, 'library', 'personas'), { recursive: true });
  fs.mkdirSync(path.join(root, 'library', 'skills'), { recursive: true });
  return root;
}
function writeSkill(root, id) {
  const dir = path.join(root, 'library', 'skills', id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nid: ${id}\nname: ${id}\n---\n# ${id}\n`);
}

// --- 2. Le resolveur IGNORE runnerSkills par construction ----------------------------------------

test('resolveSkills ignore runnerSkills : ne l ajoute pas, ne suit pas ses noms (meme inexistants)', () => {
  const root = miniLib();
  writeSkill(root, 's1');
  W(path.join(root, 'library', 'personas', 'p.md'),
    '---\nid: p\nname: p\nskills: [s1]\nrunnerSkills: { claude: [nom-hors-reservoir-inexistant] }\n---\n# p\n');
  assert.deepEqual(resolveSkills('p', { root }), ['s1']);
  fs.rmSync(root, { recursive: true, force: true });
});

test('resolveSkills : persona sans runnerSkills (champ absent) -> comportement inchange', () => {
  const root = miniLib();
  writeSkill(root, 's1');
  W(path.join(root, 'library', 'personas', 'p.md'), '---\nid: p\nname: p\nskills: [s1]\n---\n# p\n');
  assert.deepEqual(resolveSkills('p', { root }), ['s1']);
  fs.rmSync(root, { recursive: true, force: true });
});

// --- 3. generateAgent : SEUL point d'injection ---------------------------------------------------

function fixtureForGenerate() {
  const root = miniLib();
  writeSkill(root, 's1');
  fs.mkdirSync(path.join(root, 'bindings'), { recursive: true });
  W(path.join(root, 'library', 'personas', 'p.md'),
    '---\nid: p\nname: p\nskills: [s1]\nrunnerSkills: { claude: [r1, r2] }\n---\n# p\n');
  W(path.join(root, 'library', 'personas', 'q.md'),
    '---\nid: q\nname: q\nskills: [s1]\nrunnerSkills: { claude: [s1, r1] }\n---\n# q\n');
  W(path.join(root, 'library', 'personas', 'sansrunner.md'),
    '---\nid: sansrunner\nname: sansrunner\nskills: [s1]\n---\n# sansrunner\n');
  return root;
}
function binding(root, runner) {
  return {
    id: 'b',
    data: { id: 'b', assignments: [{ personaId: 'p', runner, tools: [] }, { personaId: 'q', runner, tools: [] }, { personaId: 'sansrunner', runner, tools: [] }] },
  };
}

test('generateAgent : runner claude-code (normalise en claude) -> skills resolues PUIS runnerSkills.claude, dans l ordre', () => {
  const root = fixtureForGenerate();
  const contract = generateAgent('p', { root, binding: binding(root, 'claude-code') });
  const m = contract.match(/^skills: \[(.*)\]$/m);
  assert.ok(m, 'ligne skills attendue');
  assert.deepEqual(m[1].split(', '), ['s1', 'r1', 'r2']);
  fs.rmSync(root, { recursive: true, force: true });
});

test('generateAgent : runner claude (canonique direct) -> meme injection', () => {
  const root = fixtureForGenerate();
  const contract = generateAgent('p', { root, binding: binding(root, 'claude') });
  const m = contract.match(/^skills: \[(.*)\]$/m);
  assert.deepEqual(m[1].split(', '), ['s1', 'r1', 'r2']);
  fs.rmSync(root, { recursive: true, force: true });
});

test('generateAgent : doublon runnerSkills/resolues -> dedoublonne, PREMIERE occurrence conservee', () => {
  const root = fixtureForGenerate();
  const contract = generateAgent('q', { root, binding: binding(root, 'claude-code') });
  const m = contract.match(/^skills: \[(.*)\]$/m);
  assert.deepEqual(m[1].split(', '), ['s1', 'r1'], 's1 une seule fois, en 1re position');
  fs.rmSync(root, { recursive: true, force: true });
});

test('generateAgent : runner NON claude -> AUCUNE skill runner ajoutee', () => {
  const root = fixtureForGenerate();
  const contract = generateAgent('p', { root, binding: binding(root, 'ollama-distant') });
  const m = contract.match(/^skills: \[(.*)\]$/m);
  assert.deepEqual(m[1].split(', '), ['s1']);
  fs.rmSync(root, { recursive: true, force: true });
});

test('generateAgent : binding ABSENT -> AUCUNE skill runner ajoutee (abstention, comme model)', () => {
  const root = fixtureForGenerate();
  const contract = generateAgent('p', { root });
  const m = contract.match(/^skills: \[(.*)\]$/m);
  assert.deepEqual(m[1].split(', '), ['s1']);
  fs.rmSync(root, { recursive: true, force: true });
});

test('generateAgent : persona SANS runnerSkills -> contrat inchange (pas de champ en trop)', () => {
  const root = fixtureForGenerate();
  const contract = generateAgent('sansrunner', { root, binding: binding(root, 'claude-code') });
  const m = contract.match(/^skills: \[(.*)\]$/m);
  assert.deepEqual(m[1].split(', '), ['s1']);
  fs.rmSync(root, { recursive: true, force: true });
});

// --- 4. frame lint : 3 regles runnerSkills, en AVERTISSEMENT (Q5 = B, 27/09) ---------------------

function makeReservoirRunnerSkills() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-lint-runner-'));
  const L = (rel) => path.join(root, rel);
  W(L('library/roles/dev.md'), '---\nid: dev\nlabel: Developpeur\n---\n# dev\n');
  W(L('library/personas/alice.md'),
    '---\nid: alice\nname: Alice\nroleKey: dev\nskills: [s1]\nguardrails: []\nrunnerSkills: { chatgpt: [hors-reservoir], moteur-fantome: [x], claude: [] }\n---\n# Alice\n');
  W(L('library/skills/s1/SKILL.md'), '---\nid: s1\nname: s1\nsubskills: []\n---\n# s1\n');
  W(L('library/guardrails/g1.md'), '---\nid: g1\nlabel: G1\n---\n# g1\n');
  W(L('library/principles/p1.md'), '---\nid: p1\nlabel: P1\n---\n# p1\n');
  W(L('library/rituals/r1.md'), '---\nid: r1\nlabel: R1\n---\n# r1\n');
  W(L('library/scaffolds/sc1.md'), '---\nid: sc1\n---\n# sc1\n');
  W(L('library/workflows/wf.md'), '---\nid: wf\nname: WF\nphases:\n  - { id: p1, label: P1, agentsRoleKeys: [dev] }\n---\n# wf\n');
  W(L('methods/m1.md'),
    '---\nid: m1\nname: M1\nworkflowId: wf\nprincipleIds: [p1]\nritualIds: [r1]\nguardrailIds: [g1]\nroleKeys: [dev]\nscaffoldIds: [sc1]\n---\n# m1\n');
  W(L('teams/t1.md'), '---\nid: t1\nname: T1\npersonas: [alice]\ncoordinator: alice\nguardrails: [g1]\n---\n# t1\n');
  W(L('bindings/b1.md'), '---\nid: b1\nmethodId: m1\nteamId: t1\nassignments:\n  - { personaId: alice, runner: claude }\n---\n# b1\n');
  W(L('frames/f1.md'), '---\nid: f1\nname: F1\nversion: v0.1.0\nmethodId: m1\nteamId: t1\ndefault: true\n---\n# f1\n');
  return root;
}

test('frame lint runnerSkills : cle runner inconnue -> AVERTISSEMENT (unknown-runner), jamais bloquant', () => {
  const root = makeReservoirRunnerSkills();
  const res = lintFrame('f1', root);
  const f = res.findings.find(x => x.source === 'persona:alice' && x.kind === 'unknown-runner');
  assert.ok(f, 'unknown-runner attendu pour moteur-fantome');
  assert.equal(f.severity, 'warning');
  assert.equal(f.id, 'moteur-fantome');
  fs.rmSync(root, { recursive: true, force: true });
});

test('frame lint runnerSkills : valeur mal typee (liste vide) -> AVERTISSEMENT (bad-type)', () => {
  const root = makeReservoirRunnerSkills();
  const res = lintFrame('f1', root);
  const f = res.findings.find(x => x.source === 'persona:alice' && x.kind === 'bad-type' && x.field === 'runnerSkills');
  assert.ok(f, 'bad-type attendu pour la cle claude (liste vide)');
  assert.equal(f.severity, 'warning');
  fs.rmSync(root, { recursive: true, force: true });
});

test('frame lint runnerSkills : nom present dans library/skills/ -> AVERTISSEMENT (belongs-to-skills)', () => {
  const root = makeReservoirRunnerSkills();
  W(path.join(root, 'library', 'personas', 'alice.md'),
    '---\nid: alice\nname: Alice\nroleKey: dev\nskills: [s1]\nguardrails: []\nrunnerSkills: { claude: [s1] }\n---\n# Alice\n');
  const res = lintFrame('f1', root);
  const f = res.findings.find(x => x.source === 'persona:alice' && x.kind === 'belongs-to-skills');
  assert.ok(f, 's1 est dans le reservoir : doit etre signale hors de runnerSkills');
  assert.equal(f.severity, 'warning');
  assert.equal(f.id, 's1');
  fs.rmSync(root, { recursive: true, force: true });
});

test('frame lint runnerSkills : reservoir sans runnerSkills -> aucun finding runnerSkills, aucun bloquant en plus', () => {
  const root = makeReservoirRunnerSkills();
  W(path.join(root, 'library', 'personas', 'alice.md'),
    '---\nid: alice\nname: Alice\nroleKey: dev\nskills: [s1]\nguardrails: []\n---\n# Alice\n');
  const res = lintFrame('f1', root);
  assert.equal(res.findings.filter(f => ['unknown-runner', 'bad-type', 'belongs-to-skills'].includes(f.kind)).length, 0);
  fs.rmSync(root, { recursive: true, force: true });
});

// --- 5. Garde du coeur neutre (canon REEL) --------------------------------------------------------

test('garde coeur neutre : chaque entree skills: d une persona du canon a son library/skills/<id>/SKILL.md', () => {
  const reservoirSkills = new Set(scan('skills', REPO).map(e => e.id));
  for (const e of scan('personas', REPO)) {
    if (e.id === '_TEMPLATE') continue;
    const p = readEntry('personas', e.id, REPO);
    for (const s of toArray(p.data.skills)) {
      assert.ok(reservoirSkills.has(s), `persona ${e.id} : skills: cite ${s}, absent de library/skills/`);
    }
  }
});

test('garde coeur neutre : aucun dossier de library/skills/ ne porte un nom a deux-points ni un nom du runner', () => {
  const ids = scan('skills', REPO).map(e => e.id);
  for (const id of ids) {
    assert.ok(!id.includes(':'), `${id} porte un nom a deux-points (skill du runner mal rangee ?)`);
    assert.ok(!RUNNER_SKILL_NAMES.includes(id), `${id} est un des 8 noms du runner : ne doit jamais entrer dans le reservoir`);
  }
});
