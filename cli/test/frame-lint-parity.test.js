// AC1.11 - PARITE VERROUILLEE frame lint (CLI) <-> checkFrameRefs (@iakaframe/core, GUI). R1 du
// cadrage : deux moteurs qui doivent dire la MEME chose ; sans ce test ils divergent en silence
// (la classe de dette que vendor-check a revelee). Ce test n'est PAS optionnel.
//
// STRATEGIE (calque vendor-check/parite-generateurs) : le vrai `checkFrameRefs` du frere GUI est
// charge VIVANT - transpile a la volee par l'esbuild du GUI vers un .mjs temporaire, puis
// dynamic-importe. Aucune mutation du depot GUI. Gracieux : frere absent / esbuild absent => skip.
//
// PARITE = COUVERTURE + SEVERITE COMMUNE (reserve #1) : (a) toute ref manquante vue par le coeur
// (guiMissing) a un finding BLOQUANT correspondant cote CLI - couverture ; (b) le cas ARB-2
// (workflow catalogue-connu / pool-absent) est NON BLOQUANT des DEUX cotes - severite commune, pas
// un simple superset. Les regles CLI-only (id!=fichier, casting, unicite) sont un surplus admis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lintFrame, WORKFLOW_CATALOG_IDS, POOL_TYPES } from '../src/lib/frame-lint.js';
import { scan, readEntry, toArray, bindingRows } from '../src/lib/library.js';
import { resolveGuiRoot } from '../src/lib/vendor.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');

// --- Chargement VIVANT du coeur GUI (transpile a la volee, aucune mutation du frere). ------------
function loadCore() {
  const gui = resolveGuiRoot(REPO, { ...process.env, IAKAFRAME_GUI_ROOT: process.env.IAKAFRAME_GUI_ROOT || '' });
  if (!gui) return { skip: 'frere iakaFrameGUI absent' };
  const esbuild = path.join(gui, 'node_modules', '.bin', 'esbuild');
  if (!fs.existsSync(esbuild)) return { skip: 'esbuild du GUI absent (npm i cote GUI)' };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-parity-'));
  // Entree temporaire qui re-exporte le coeur par CHEMIN ABSOLU (aucun fichier ecrit cote GUI).
  const entry = path.join(tmp, 'entry.ts');
  const frameTs = path.join(gui, 'packages', 'core', 'src', 'frame.ts').replace(/\\/g, '/');
  const wfTs = path.join(gui, 'packages', 'core', 'src', 'workflow.ts').replace(/\\/g, '/');
  fs.writeFileSync(entry,
    `export { checkFrameRefs } from ${JSON.stringify(frameTs)};\n` +
    `export { WORKFLOW_CATALOG } from ${JSON.stringify(wfTs)};\n`);
  const out = path.join(tmp, 'core.mjs');
  const r = spawnSync(esbuild, [entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`], { encoding: 'utf8' });
  if (r.status !== 0) return { skip: 'esbuild a echoue : ' + (r.stderr || '').slice(0, 200) };
  return { out };
}

// --- Construit les intrants GUI de checkFrameRefs DEPUIS la fixture (une seule source pilote les
//     deux moteurs). Le pool de la fixture == l'ensemble frame-scope (atomes reachable seulement) :
//     GUI valide « tout le pool », CLI valide « le reachable » => memes atomes, comparaison licite.
function guiInputs(root) {
  const poolIds = {};
  for (const t of POOL_TYPES) poolIds[t] = scan(t, root).map(e => e.id);
  const wfRoleKeys = (d) => {
    const out = [];
    for (const ph of toArray(d.phases)) if (ph && typeof ph === 'object') for (const k of toArray(ph.agentsRoleKeys)) if (!out.includes(k)) out.push(k);
    return out;
  };
  const methods = scan('methods', root).map(e => { const d = readEntry('methods', e.id, root).data; return { id: e.id, principleIds: toArray(d.principleIds), ritualIds: toArray(d.ritualIds), guardrailIds: toArray(d.guardrailIds), roleKeys: toArray(d.roleKeys), scaffoldIds: toArray(d.scaffoldIds), workflowId: d.workflowId }; });
  const teams = scan('teams', root).map(e => { const d = readEntry('teams', e.id, root).data; return { id: e.id, personas: toArray(d.personas), coordinator: d.coordinator, guardrails: toArray(d.guardrails) }; });
  const bindings = scan('bindings', root).map(e => { const d = readEntry('bindings', e.id, root).data; return { id: e.id, methodId: d.methodId, teamId: d.teamId, personaIds: bindingRows(d).map(r => r && r.personaId).filter(Boolean) }; });
  const personaList = scan('personas', root).map(e => { const d = readEntry('personas', e.id, root).data; return { id: e.id, roleKey: d.roleKey, skills: toArray(d.skills), guardrails: toArray(d.guardrails) }; });
  const workflowRefs = scan('workflows', root).map(e => { const d = readEntry('workflows', e.id, root).data; return { id: e.id, roleKeys: wfRoleKeys(d), soleActor: d.soleActor != null && d.soleActor !== '' ? d.soleActor : null }; });
  const skillRefs = scan('skills', root).map(e => { const d = readEntry('skills', e.id, root).data; return { id: e.id, subskills: toArray(d.subskills) }; });
  return [poolIds, methods, teams, bindings, personaList, workflowRefs, skillRefs];
}

function W(file, content) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }

// Reservoir minimal ou pool == ensemble frame-scope (aligne GUI « tout le pool » et CLI « reachable »).
function makeReservoir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-parity-fx-'));
  const L = (rel) => path.join(root, rel);
  W(L('library/roles/dev.md'), '---\nid: dev\nlabel: Dev\n---\n# dev\n');
  W(L('library/roles/qa.md'), '---\nid: qa\nlabel: QA\n---\n# qa\n');
  W(L('library/personas/alice.md'), '---\nid: alice\nname: Alice\nroleKey: dev\nskills: [s1]\nguardrails: [g1]\n---\n# Alice\n');
  W(L('library/personas/bob.md'), '---\nid: bob\nname: Bob\nroleKey: qa\nskills: []\nguardrails: []\n---\n# Bob\n');
  W(L('library/skills/s1/SKILL.md'), '---\nid: s1\nname: s1\nsubskills: [s2]\n---\n# s1\n');
  W(L('library/skills/s2/SKILL.md'), '---\nid: s2\nname: s2\nsubskills: []\n---\n# s2\n');
  W(L('library/guardrails/g1.md'), '---\nid: g1\nlabel: G1\n---\n# g1\n');
  W(L('library/principles/p1.md'), '---\nid: p1\nlabel: P1\n---\n# p1\n');
  W(L('library/rituals/r1.md'), '---\nid: r1\nlabel: R1\n---\n# r1\n');
  W(L('library/scaffolds/sc1.md'), '---\nid: sc1\n---\n# sc1\n');
  W(L('library/workflows/wf.md'), '---\nid: wf\nname: WF\nphases:\n  - { id: p1, label: P1, agentsRoleKeys: [dev, qa] }\n---\n# wf\n');
  W(L('methods/m1.md'), '---\nid: m1\nname: M1\nworkflowId: wf\nprincipleIds: [p1]\nritualIds: [r1]\nguardrailIds: [g1]\nroleKeys: [dev, qa]\nscaffoldIds: [sc1]\n---\n# m1\n');
  W(L('teams/t1.md'), '---\nid: t1\nname: T1\npersonas: [alice, bob]\ncoordinator: bob\nguardrails: [g1]\n---\n# t1\n');
  W(L('bindings/b1.md'), '---\nid: b1\nmethodId: m1\nteamId: t1\nassignments:\n  - { personaId: alice, runner: claude }\n  - { personaId: bob, runner: claude }\n---\n# b1\n');
  W(L('frames/f1.md'), '---\nid: f1\nname: F1\nmethodId: m1\nteamId: t1\ndefault: true\n---\n# f1\n');
  return root;
}

const key = (f) => `${f.source}::${f.id}`;

const core = loadCore();

test('AC1.11 : les cles du catalogue de workflows CLI == celles du coeur GUI (verrou anti-derive)', async (t) => {
  if (core.skip) return t.skip(core.skip);
  const { WORKFLOW_CATALOG } = await import(pathToFileURL(core.out).href);
  assert.deepEqual([...WORKFLOW_CATALOG_IDS].sort(), Object.keys(WORKFLOW_CATALOG).sort(),
    'WORKFLOW_CATALOG_IDS (CLI) a diverge du WORKFLOW_CATALOG du coeur GUI - re-synchroniser');
});

test('AC1.11 : COUVERTURE - toute ref manquante du coeur GUI a un finding BLOQUANT cote CLI', async (t) => {
  if (core.skip) return t.skip(core.skip);
  const { checkFrameRefs } = await import(pathToFileURL(core.out).href);
  const root = makeReservoir();
  // Injecte une palette de cassures couvrant le noyau + T1/T5/T3 (memes fichiers pour les 2 moteurs).
  W(path.join(root, 'library/personas/alice.md'), '---\nid: alice\nname: Alice\nroleKey: roleFantome\nskills: [s1, skFantome]\nguardrails: [gFantome]\n---\n# Alice\n');
  W(path.join(root, 'library/workflows/wf.md'), '---\nid: wf\nname: WF\nsoleActor: personaFantome\nphases:\n  - { id: p1, label: P1, agentsRoleKeys: [dev, roleFantome2] }\n---\n# wf\n');
  W(path.join(root, 'library/skills/s1/SKILL.md'), '---\nid: s1\nname: s1\nsubskills: [s1, subFantome]\n---\n# s1\n');
  W(path.join(root, 'methods/m1.md'), '---\nid: m1\nname: M1\nworkflowId: wf\nprincipleIds: [p1, prinFantome]\nroleKeys: [dev, qa, roleFantome3]\nguardrailIds: [g1]\n---\n# m1\n');
  W(path.join(root, 'teams/t1.md'), '---\nid: t1\nname: T1\npersonas: [alice, bob]\ncoordinator: bob\nguardrails: [g1, guardTeamFantome]\n---\n# t1\n');

  const guiMissing = checkFrameRefs(...guiInputs(root)).missing;
  assert.ok(guiMissing.length >= 6, 'la fixture doit produire plusieurs manques cote coeur : ' + JSON.stringify(guiMissing));

  const cliBlocking = lintFrame('f1', root).findings.filter(f => f.severity === 'blocking');
  const cliKeys = new Set(cliBlocking.map(key));

  // COUVERTURE : chaque manque GUI (source::id) est couvert par un bloquant CLI de meme source+id.
  for (const gm of guiMissing) {
    assert.ok(cliKeys.has(key(gm)),
      `finding du coeur GUI non couvert par le CLI : ${gm.source} ${gm.field} -> ${gm.id}\nCLI bloquants : ${[...cliKeys].join(', ')}`);
  }
});

test('AC1.11 : SEVERITE COMMUNE ARB-2 - workflow catalogue-connu / pool-absent NON BLOQUANT des deux cotes', async (t) => {
  if (core.skip) return t.skip(core.skip);
  const { checkFrameRefs, WORKFLOW_CATALOG } = await import(pathToFileURL(core.out).href);
  const catalogId = Object.keys(WORKFLOW_CATALOG)[0];
  const root = makeReservoir();
  // La methode pointe le workflow du CATALOGUE, absent du pool (on retire wf du pool).
  fs.rmSync(path.join(root, 'library/workflows/wf.md'));
  W(path.join(root, 'methods/m1.md'), `---\nid: m1\nname: M1\nworkflowId: ${catalogId}\nprincipleIds: [p1]\nroleKeys: [dev, qa]\nguardrailIds: [g1]\n---\n# m1\n`);

  // Coeur GUI : aucun manque sur workflowId (workflowById defini) => non bloquant.
  const guiMissing = checkFrameRefs(...guiInputs(root)).missing;
  assert.ok(!guiMissing.some(m => m.field === 'workflowId'),
    'le coeur GUI ne doit PAS signaler un workflowId connu du catalogue : ' + JSON.stringify(guiMissing));

  // CLI : avertissement workflow-catalog, JAMAIS un bloquant => severite commune (non bloquant).
  const res = lintFrame('f1', root);
  const wfFindings = res.findings.filter(f => f.kind === 'workflow-catalog');
  assert.equal(wfFindings.length, 1, 'le CLI doit emettre exactement un avertissement workflow-catalog');
  assert.equal(wfFindings[0].severity, 'warning');
  assert.ok(!res.findings.some(f => f.field === 'workflowId' && f.severity === 'blocking'),
    'ARB-2 : un workflowId catalogue-connu ne doit JAMAIS bloquer cote CLI');
});

test('AC1.11 : parite du VERT - fixture saine -> ok des deux cotes (aucun faux positif partage)', async (t) => {
  if (core.skip) return t.skip(core.skip);
  const { checkFrameRefs } = await import(pathToFileURL(core.out).href);
  const root = makeReservoir();
  assert.equal(checkFrameRefs(...guiInputs(root)).ok, true, 'coeur GUI : fixture saine attendue verte');
  assert.equal(lintFrame('f1', root).ok, true, 'CLI : fixture saine attendue verte');
});
