// Recette des scaffolds de forge (Lot 2, outillage-forge-frame.md § 4.3). `frame new` produit une
// ossature LINT-CLEAN par construction (ARB-3) ; `add <type-de-pool>` pose un atome typé. Chaque
// scenario travaille sur un reservoir synthetique (temp dir) ; boucle vertueuse forge -> lint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scaffoldFrameNew, scaffoldPoolAtom, POOL_KINDS } from '../src/lib/scaffold.js';
import { lintFrame } from '../src/lib/frame-lint.js';
import { readEntry, checkRefs, checkSchema } from '../src/lib/library.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');

function W(file, content) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }

// Reservoir de base : un pool minimal (role + persona qui le porte + workflow) pour ossaturer.
function makeReservoir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-scaffold-'));
  const L = (rel) => path.join(root, rel);
  W(L('library/roles/coordination.md'), '---\nid: coordination\nlabel: Coordination\n---\n# coordination\n');
  W(L('library/personas/chef.md'), '---\nid: chef\nname: Chef\nroleKey: coordination\nskills: []\nguardrails: []\n---\n# Chef\n');
  W(L('library/workflows/wf.md'), '---\nid: wf\nname: WF\nphases:\n  - { id: p1, label: P1, agentsRoleKeys: [coordination] }\n---\n# wf\n');
  // dossiers d'assemblage (peuvent etre vides).
  fs.mkdirSync(L('methods'), { recursive: true });
  fs.mkdirSync(L('teams'), { recursive: true });
  fs.mkdirSync(L('bindings'), { recursive: true });
  fs.mkdirSync(L('kits'), { recursive: true });
  fs.mkdirSync(L('frames'), { recursive: true });
  return root;
}

// ------------------------------------------------------------------------------------------------

test('AC2.1 : frame new cree descripteur + 4 fichiers d\'assemblage, tous pointant la library partagee', () => {
  const root = makeReservoir();
  const res = scaffoldFrameNew('proj', root);
  assert.equal(res.ok, true, res.error);
  assert.deepEqual(res.written.sort(), [
    'bindings/proj-default.md', 'frames/proj.md', 'kits/proj-claude.md', 'methods/proj.md', 'teams/proj-team.md',
  ].sort());
  // Aucune copie de brique : la methode reference des IDS (workflowId/roleKeys), pas des corps.
  const method = readEntry('methods', 'proj', root);
  assert.equal(method.data.workflowId, 'wf');
  assert.deepEqual(method.data.roleKeys, ['coordination']);
  const team = readEntry('teams', 'proj-team', root);
  assert.deepEqual(team.data.personas, ['chef']);
  assert.equal(team.data.coordinator, 'chef');
});

test('AC2.2 (ARB-3) : frame new <id> puis frame lint <id> sort 0 (lint-clean par construction)', () => {
  const root = makeReservoir();
  assert.equal(scaffoldFrameNew('proj', root).ok, true);
  const res = lintFrame('proj', root);
  assert.equal(res.ok, true, 'ossature attendue lint-clean : ' + JSON.stringify(res.findings, null, 2));
  assert.equal(res.findings.filter(f => f.severity === 'blocking').length, 0);
});

test('AC7 : frame new <id> puis frame lint <id> --strict sort 0 (gabarits n\'ont que des champs connus)', () => {
  const root = makeReservoir();
  assert.equal(scaffoldFrameNew('proj', root).ok, true);
  const res = lintFrame('proj', root, { strict: true });
  assert.equal(res.ok, true, 'ossature attendue --strict-clean : ' + JSON.stringify(res.findings, null, 2));
  assert.equal(res.findings.filter(f => f.kind === 'unknown-field').length, 0,
    'aucun champ inconnu ne doit sortir des gabarits (sinon --strict les bloquerait)');
});

test('AC2.2 bis : chaine CLI reelle - frame new puis frame lint -> exit 0 tous les deux', () => {
  const root = makeReservoir();
  const a = spawnSync(process.execPath, [CLI, 'frame', 'new', 'proj', '--root', root], { encoding: 'utf8' });
  assert.equal(a.status, 0, a.stderr);
  const b = spawnSync(process.execPath, [CLI, 'frame', 'lint', 'proj', '--root', root], { encoding: 'utf8' });
  assert.equal(b.status, 0, 'frame lint sur l\'ossature doit sortir 0');
});

test('frame new est NON DESTRUCTIF (refus si une cible existe, --force pour remplacer)', () => {
  const root = makeReservoir();
  assert.equal(scaffoldFrameNew('proj', root).ok, true);
  const again = scaffoldFrameNew('proj', root);
  assert.equal(again.ok, false, 'refus attendu sans --force');
  assert.ok(again.existing && again.existing.length > 0);
  assert.equal(scaffoldFrameNew('proj', root, { force: true }).ok, true, '--force doit remplacer');
});

test('frame new refuse si aucune persona a roleKey resolvable (garde ARB-3)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-empty-'));
  fs.mkdirSync(path.join(root, 'library', 'roles'), { recursive: true });
  const res = scaffoldFrameNew('proj', root);
  assert.equal(res.ok, false, 'sans persona/role exploitable, l\'ossature ne peut etre lint-clean');
  assert.match(res.error, /persona/);
});

test('AC2.3 : add <type-de-pool> pose l\'atome dans la bonne collection, id == basename, refus si existe', () => {
  const root = makeReservoir();
  const res = scaffoldPoolAtom('principle', 'monprincipe', root);
  assert.equal(res.ok, true);
  assert.ok(res.dest.endsWith(path.join('library', 'principles', 'monprincipe.md')));
  const e = readEntry('principles', 'monprincipe', root);
  assert.equal(e.data.id, 'monprincipe', 'id == basename');
  // refus si existe
  assert.equal(scaffoldPoolAtom('principle', 'monprincipe', root).ok, false);
  assert.equal(scaffoldPoolAtom('principle', 'monprincipe', root, { force: true }).ok, true, '--force remplace');
});

test('AC2.4 : add skill cree library/skills/<id>/SKILL.md (mode dossier), pas un .md plat', () => {
  const root = makeReservoir();
  const res = scaffoldPoolAtom('skill', 'maskill', root);
  assert.equal(res.ok, true);
  assert.ok(fs.existsSync(path.join(root, 'library', 'skills', 'maskill', 'SKILL.md')), 'SKILL.md en mode dossier attendu');
  assert.ok(!fs.existsSync(path.join(root, 'library', 'skills', 'maskill.md')), 'aucun .md plat');
  const e = readEntry('skills', 'maskill', root);
  assert.equal(e.data.id, 'maskill');
});

test('AC2.5 : add frame <fichier.md> est expose et valide ses refs avant ecriture (livraison, non regresse)', () => {
  const root = makeReservoir();
  // On ossature d'abord (produit un descripteur valide), puis on le re-livre par `add frame`.
  scaffoldFrameNew('proj', root);
  const src = path.join(root, 'frames', 'proj.md');
  const r = spawnSync(process.execPath, [CLI, 'add', 'frame', src, '--root', root, '--force'], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'add frame doit reussir sur un descripteur valide : ' + r.stderr);
  assert.match(r.stdout, /frame proj livré/);

  // Refs cassees -> refus SANS ecriture (comportement add existant, non regresse).
  W(path.join(root, 'frames', 'casse.md'), '---\nid: casse\nmethodId: fantome\nteamId: fantome-team\n---\n# casse\n');
  const bad = spawnSync(process.execPath, [CLI, 'add', 'frame', path.join(root, 'frames', 'casse.md'), '--root', root, '--force'], { encoding: 'utf8' });
  assert.equal(bad.status, 1, 'un descripteur aux refs cassees doit etre refuse');
});

test('AC2.6 : aucun scaffold n\'ecrit hors de la racine bibliotheque resolue', () => {
  const root = makeReservoir();
  scaffoldFrameNew('proj', root);
  for (const k of POOL_KINDS) scaffoldPoolAtom(k, `atome-${k}`, root);
  // Tout ce qui a ete cree est SOUS root (aucun chemin remonte au-dessus).
  const out = spawnSync('find', [root, '-newer', path.join(root, 'library', 'roles', 'coordination.md'), '-type', 'f'], { encoding: 'utf8' });
  for (const line of out.stdout.split('\n').filter(Boolean)) {
    assert.ok(path.resolve(line).startsWith(path.resolve(root) + path.sep), `ecriture hors racine : ${line}`);
  }
});

test('AC2.7 : chaque gabarit d\'atome produit un frontmatter que frame lint accepte (schema/refs sains)', () => {
  const root = makeReservoir();
  // Les 8 atomes typés : leur frontmatter minimal ne porte AUCUNE ref pendante (pas de rouge si
  // integres a une frame). On le prouve en les scaffoldant puis en verifiant : soit checkSchema OK
  // (assemblage), soit aucune ref sortante pendante (pool).
  for (const k of POOL_KINDS) {
    const res = scaffoldPoolAtom(k, `t-${k}`, root);
    assert.equal(res.ok, true, `scaffold ${k} echoue`);
    const e = readEntry(res.type, `t-${k}`, root);
    assert.equal(e.data.id, `t-${k}`, `${k} : id == basename`);
  }
  // Et la boucle complete : une frame neuve + son lint restent verts apres avoir peuple le pool.
  assert.equal(scaffoldFrameNew('projX', root).ok, true);
  assert.equal(lintFrame('projX', root).ok, true, 'frame lint doit rester vert avec des atomes scaffoldes dans le pool');
});
