// Recette de `frame lint` (Lot 1, outillage-forge-frame.md § 3.5). Chaque scenario travaille sur
// une FIXTURE de reservoir synthetique (temp dir) qui reproduit un frame minimal (AC1.13) - le
// rangement du corpus reel est hors perimetre. Le lint ne mute JAMAIS le disque (AC1.12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lintFrame, lintAllFrames } from '../src/lib/frame-lint.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');

// --- Construction d'une FIXTURE de reservoir minimal, valide (lint-clean par construction). ------
function W(file, content) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }

function makeReservoir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-lint-'));
  const L = (rel) => path.join(root, rel);
  // Pool
  W(L('library/roles/dev.md'), '---\nid: dev\nlabel: Developpeur\n---\n# dev\n');
  W(L('library/roles/qa.md'), '---\nid: qa\nlabel: Qualite\n---\n# qa\n');
  W(L('library/personas/alice.md'), '---\nid: alice\nname: Alice\nroleKey: dev\nskills: [s1]\nguardrails: [g1]\n---\n# Alice\n');
  W(L('library/personas/bob.md'), '---\nid: bob\nname: Bob\nroleKey: qa\nskills: []\nguardrails: []\n---\n# Bob\n');
  W(L('library/skills/s1/SKILL.md'), '---\nid: s1\nname: s1\nsubskills: [s2]\n---\n# s1\n');
  W(L('library/skills/s2/SKILL.md'), '---\nid: s2\nname: s2\nsubskills: []\n---\n# s2\n');
  W(L('library/guardrails/g1.md'), '---\nid: g1\nlabel: G1\n---\n# g1\n');
  W(L('library/principles/p1.md'), '---\nid: p1\nlabel: P1\n---\n# p1\n');
  W(L('library/rituals/r1.md'), '---\nid: r1\nlabel: R1\n---\n# r1\n');
  W(L('library/scaffolds/sc1.md'), '---\nid: sc1\n---\n# sc1\n');
  W(L('library/workflows/wf.md'),
    '---\nid: wf\nname: WF\nphases:\n  - { id: p1, label: P1, agentsRoleKeys: [dev, qa] }\n---\n# wf\n');
  // Assemblage
  W(L('methods/m1.md'),
    '---\nid: m1\nname: M1\nworkflowId: wf\nprincipleIds: [p1]\nritualIds: [r1]\nguardrailIds: [g1]\nroleKeys: [dev, qa]\nscaffoldIds: [sc1]\n---\n# m1\n');
  W(L('teams/t1.md'),
    '---\nid: t1\nname: T1\npersonas: [alice, bob]\ncoordinator: bob\nguardrails: [g1]\n---\n# t1\n');
  W(L('bindings/b1.md'),
    '---\nid: b1\nmethodId: m1\nteamId: t1\nassignments:\n  - { personaId: alice, runner: claude }\n  - { personaId: bob, runner: claude }\n---\n# b1\n');
  W(L('frames/f1.md'),
    '---\nid: f1\nname: F1\nversion: v0.1.0\nmethodId: m1\nteamId: t1\ndefault: true\n---\n# f1\n');
  return root;
}

const kinds = (findings, kind) => findings.filter(f => f.kind === kind);
const blocking = (findings) => findings.filter(f => f.severity === 'blocking');

// ------------------------------------------------------------------------------------------------

test('AC1.1/AC1.13 : reservoir minimal valide -> ok, 0 finding bloquant (verdict « 0 id pendant »)', () => {
  const root = makeReservoir();
  const res = lintFrame('f1', root);
  assert.equal(res.ok, true, JSON.stringify(res.findings, null, 2));
  assert.equal(blocking(res.findings).length, 0);
});

test('AC1.12 : le lint n\'ecrit RIEN (arbre inchange apres un run)', () => {
  const root = makeReservoir();
  const snap = () => spawnSync('find', [root, '-type', 'f', '-exec', 'shasum', '{}', '+'], { encoding: 'utf8' }).stdout;
  const before = snap();
  lintFrame('f1', root);
  lintAllFrames(root);
  assert.equal(snap(), before, 'le lint doit etre STRICTEMENT en lecture seule');
});

test('AC1.2 : methodId/teamId du descripteur absent -> bloquant, champ + id nommes', () => {
  const root = makeReservoir();
  W(path.join(root, 'frames/f1.md'), '---\nid: f1\nname: F1\nmethodId: fantome\nteamId: t1\n---\n# f1\n');
  const res = lintFrame('f1', root);
  assert.equal(res.ok, false);
  const f = res.findings.find(x => x.source === 'frame:f1' && x.field === 'methodId');
  assert.ok(f, 'le methodId pendant doit etre signale');
  assert.equal(f.id, 'fantome');
  assert.equal(f.severity, 'blocking');
});

test('AC1.3 : principleIds de la methode pointant un id absent -> bloquant (checkRefs, non regresse)', () => {
  const root = makeReservoir();
  W(path.join(root, 'methods/m1.md'),
    '---\nid: m1\nname: M1\nworkflowId: wf\nprincipleIds: [p1, pFantome]\nroleKeys: [dev, qa]\n---\n# m1\n');
  const res = lintFrame('f1', root);
  assert.equal(res.ok, false);
  const f = res.findings.find(x => x.source === 'method:m1' && x.id === 'pFantome');
  assert.ok(f && f.severity === 'blocking' && f.field === 'principleIds');
});

test('AC1.4 : persona dont roleKey/skills/guardrails ne resout pas -> bloquant (trou T1 comble)', () => {
  const root = makeReservoir();
  W(path.join(root, 'library/personas/alice.md'),
    '---\nid: alice\nname: Alice\nroleKey: roleFantome\nskills: [skFantome]\nguardrails: [gFantome]\n---\n# Alice\n');
  const res = lintFrame('f1', root);
  assert.equal(res.ok, false);
  for (const [field, id] of [['roleKey', 'roleFantome'], ['skills', 'skFantome'], ['guardrails', 'gFantome']]) {
    const f = res.findings.find(x => x.source === 'persona:alice' && x.field === field && x.id === id);
    assert.ok(f && f.severity === 'blocking', `persona.${field} pendant non bloque`);
  }
});

test('AC1.5 : workflow agentsRoleKeys pendant (T5) ; skill subskills pendant + self-ref (T3) -> bloquant', () => {
  const root = makeReservoir();
  W(path.join(root, 'library/workflows/wf.md'),
    '---\nid: wf\nname: WF\nphases:\n  - { id: p1, label: P1, agentsRoleKeys: [dev, roleFantome] }\n---\n# wf\n');
  W(path.join(root, 'library/skills/s1/SKILL.md'), '---\nid: s1\nname: s1\nsubskills: [s1, skFantome]\n---\n# s1\n');
  const res = lintFrame('f1', root);
  assert.equal(res.ok, false);
  assert.ok(res.findings.find(x => x.source === 'workflow:wf' && x.field === 'agentsRoleKeys' && x.id === 'roleFantome' && x.severity === 'blocking'), 'T5 non bloque');
  assert.ok(kinds(res.findings, 'self-ref').find(x => x.source === 'skill:s1'), 'self-ref non signalee');
  assert.ok(res.findings.find(x => x.source === 'skill:s1' && x.field === 'subskills' && x.id === 'skFantome' && x.severity === 'blocking'), 'T3 subskill pendant non bloque');
});

test('AC1.6 : role requis non couvert + coordinateur retire -> orphelin bloquant ; couvert par coordinateur -> avertissement', () => {
  // Cas 1 : bob (roleKey qa) retire du casting ET pas de coordinateur => qa orphelin bloquant.
  const root = makeReservoir();
  W(path.join(root, 'teams/t1.md'), '---\nid: t1\nname: T1\npersonas: [alice]\nguardrails: [g1]\n---\n# t1\n');
  const res = lintFrame('f1', root);
  assert.equal(res.ok, false);
  assert.ok(kinds(res.findings, 'casting-orphan').find(x => x.id === 'qa' && x.severity === 'blocking'), 'orphelin qa attendu');

  // Cas 2 : bob retire du casting mais DESIGNE coordinateur => qa couvert par le coordinateur (avertissement).
  const root2 = makeReservoir();
  W(path.join(root2, 'teams/t1.md'), '---\nid: t1\nname: T1\npersonas: [alice]\ncoordinator: bob\nguardrails: [g1]\n---\n# t1\n');
  const res2 = lintFrame('f1', root2);
  assert.equal(res2.ok, true, JSON.stringify(res2.findings, null, 2));
  assert.ok(kinds(res2.findings, 'coordinator-covered').find(x => x.id === 'qa' && x.severity === 'warning'), 'couverture coordinateur attendue');
});

test('AC1.7 : id interne != nom de fichier, dans n\'importe quel document -> bloquant', () => {
  const root = makeReservoir();
  W(path.join(root, 'library/personas/alice.md'),
    '---\nid: PAS_ALICE\nname: Alice\nroleKey: dev\nskills: [s1]\nguardrails: [g1]\n---\n# Alice\n');
  const res = lintFrame('f1', root);
  assert.equal(res.ok, false);
  const f = kinds(res.findings, 'id-filename').find(x => x.source === 'persona:alice');
  assert.ok(f && f.severity === 'blocking', 'id != nom de fichier non bloque');
});

test('AC1.8 : id present dans deux collections de pool -> signale (avertissement, non bloquant)', () => {
  const root = makeReservoir();
  // `p1` existe deja en principles ; on l'ajoute aussi en guardrails ET on le reference (guardrailIds).
  W(path.join(root, 'library/guardrails/p1.md'), '---\nid: p1\nlabel: P1 guard\n---\n# p1\n');
  W(path.join(root, 'methods/m1.md'),
    '---\nid: m1\nname: M1\nworkflowId: wf\nprincipleIds: [p1]\nguardrailIds: [p1]\nroleKeys: [dev, qa]\n---\n# m1\n');
  const res = lintFrame('f1', root);
  const f = kinds(res.findings, 'id-collision').find(x => x.id === 'p1');
  assert.ok(f, 'la collision inter-collections doit etre signalee');
  assert.equal(f.severity, 'warning', 'signale, non bloquant (le reservoir reel partage des ids par design)');
  assert.equal(res.ok, true, 'une collision seule ne bloque pas');
});

test('AC1.9 : --all agrege, exit 1 si une frame bloque, ignore frames/releases/', () => {
  const root = makeReservoir();
  // 2e frame cassee + un descripteur PARASITE dans releases/ qui DOIT etre ignore.
  W(path.join(root, 'frames/f2.md'), '---\nid: f2\nname: F2\nmethodId: fantome\nteamId: t1\n---\n# f2\n');
  W(path.join(root, 'frames/releases/StefFrame/f-ignore.md'), '---\nid: f-ignore\nmethodId: fantome\nteamId: fantome\n---\n# ignore\n');
  const res = lintAllFrames(root);
  assert.equal(res.checked, 2, 'seuls f1 + f2 sont scannes (releases/ ignore)');
  assert.equal(res.ok, false, 'f2 cassee => --all echoue');
  assert.ok(res.findings.some(f => f.frame === 'f2' && f.id === 'fantome'));
  assert.ok(!res.findings.some(f => f.frame === 'f-ignore'), 'releases/ ne doit jamais etre lint');
});

test('AC1.10 : --json respecte C-JSON (ok en tete, findings pluriel) et exit 1 sur bloquant', () => {
  const root = makeReservoir();
  W(path.join(root, 'frames/f1.md'), '---\nid: f1\nname: F1\nmethodId: fantome\nteamId: t1\n---\n# f1\n');
  const r = spawnSync(process.execPath, [CLI, 'frame', 'lint', 'f1', '--json', '--root', root], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'un bloquant => exit 1');
  const payload = JSON.parse(r.stdout);
  assert.equal(Object.keys(payload)[0], 'ok', 'C-JSON : ok en premiere cle');
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.findings), 'findings au pluriel');
});

test('AC1.10 : frame lint --help ne plante pas (ne pas rejouer le bug jalon --help)', () => {
  const r = spawnSync(process.execPath, [CLI, 'frame', 'lint', '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'le --help ne doit jamais sortir en erreur');
  assert.match(r.stdout, /frame lint/);
  assert.equal(r.stderr, '', 'aucune trace d\'erreur sur --help');
});

test('AC1.10 bis : frame lint iakaframe (default reel) -> exit 0 (parcours CLI complet)', () => {
  // Le default en prod (AC1.1 sur le canon reel du depot) via la chaine CLI + exit code.
  const r = spawnSync(process.execPath, [CLI, 'frame', 'lint', 'iakaframe', '--json'], {
    encoding: 'utf8', cwd: path.join(HERE, '..', '..'),
  });
  assert.equal(r.status, 0, 'le frame default doit sortir 0');
  assert.equal(JSON.parse(r.stdout).ok, true);
});
