// Tests bout-en-bout de la COUCHE CHANTIER de perimeter-guard.mjs (Lot 4, specs/instructions/
// declaration-chantier-session.md § D-5, D-7, D-9, D-11, D-12, D-14 — 2e amendement, lecture L-5).
//
// Perimetre de CE fichier (Lot 4 UNIQUEMENT) : les GESTES DIRECTS gardes par perimeter-guard.mjs
// (Edit/Write/NotebookEdit/Bash/PowerShell). Les criteres d'acceptation portant sur la DELEGATION
// (`Agent`/`Task`, delegation-guard.mjs) et sur `plan-courante.mjs` (Lot 5) ne sont PAS couverts
// ici — perimetre ferme (declare a Legolas). Le coeur pur (`verdictChantier`, `classifyShell`,
// `foldChantier`...) est deja verrouille par guard-core.test.js (Lots 1/1bis) ; l'adaptateur d'etat
// (`chantier-state.mjs`) par guard-chantier-state.test.js (Lot 2) ; le prompt (`chantier-remind.mjs`)
// par guard-chantier-remind.test.js (Lot 3). Ce fichier ne couvre QUE l'adaptateur perimeter-guard.mjs.
//
// 3e amendement (declaration-chantier-session.md § 2, Lot 1ter) : CA-17 est REECRIT — un dossier
// hors racine/depot est desormais un chantier ANCRE sur son propre chemin (A3-1), plus "aucun
// chantier". Le dernier cas de CA-17 ("npm test", cwd=repoB, sous un chantier "@hors:<nom>") attend
// donc `CHANTIER_MISMATCH` (une cle touchee differente de l'ancre effective, regle 6, D-5) — ce
// n'est PLUS un ecart au libelle de l'instruction (l'ancien "ECART DECLARE" est leve).
//
// ECART DECLARE (CA-19, sous-cas POSIX) : le lien symbolique `~/.claude/hooks/x.mjs -> <repoA>/kit/
// x.mjs` n'est testable de facon fiable que sous POSIX (`fs.symlinkSync` sur Windows exige des
// privileges eleves absents en CI/dev standard) ; non reproduit ici (deja couvert conceptuellement
// par `hardDeny()`, verrouille par guard-chantier-state.test.js, Lot 2).
//
// AUCUN test ici n'ecrit dans le vrai `~/.claude` : chaque test redirige HOME/USERPROFILE et
// IAKAFRAME_ROOT vers un tmpdir dedie (sandbox), et le hook est lance bout-en-bout via `spawnSync`.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks');
const PERIM = path.join(HOOKS_DIR, 'perimeter-guard.mjs');

// ---------------------------------------------------------------------------
// Sandbox : HOME/USERPROFILE + IAKAFRAME_ROOT rediriges vers un tmpdir dedie. JAMAIS le vrai
// ~/.claude (ni le vrai IAKAFRAME_ROOT / C:\work).
//
// `root` (IAKAFRAME_ROOT, ou vivent les depots fixtures) est DELIBEREMENT construit HORS de
// `os.tmpdir()` (a la difference de `home`) : D-8 exclut tout sous-arbre de `os.tmpdir()` — un
// `root` niche SOUS `os.tmpdir()` ferait exclure CHAQUE chemin de depot fixture (`keys` toujours
// vide -> ALLOW systematique, faux negatif de test). Meme constat deja documente par
// guard-chantier-state.test.js (Lot 2, `REAL_HOME`, "un vrai depot ne vit jamais sous le dossier
// temporaire de l'OS"). Repertoire de base auto-nettoye en fin de fichier (`after`).
// ---------------------------------------------------------------------------

const REAL_HOME = os.homedir();
const FIXTURE_BASE = path.join(REAL_HOME, '.iaka-perim-test-fixtures');
after(() => {
  try { fs.rmSync(FIXTURE_BASE, { recursive: true, force: true }); } catch { /* best-effort */ }
});

let seq = 0;
function nextSid() {
  seq += 1;
  return `test${process.pid}${Date.now()}${seq}`.replace(/[^A-Za-z0-9-]/g, '');
}

function tmpDir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

// nonTmpDir(prefix) : dossier UNIQUE hors de `os.tmpdir()` (cf. commentaire ci-dessus), sous
// `FIXTURE_BASE` (nettoye globalement par `after`).
function nonTmpDir(prefix) {
  fs.mkdirSync(FIXTURE_BASE, { recursive: true });
  return fs.realpathSync.native(fs.mkdtempSync(path.join(FIXTURE_BASE, prefix)));
}

function makeSandbox() {
  const home = tmpDir('iaka-perim-home-');
  const root = nonTmpDir('iaka-perim-root-');
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    IAKAFRAME_ROOT: root,
    IAKAFRAME_CHANTIER_MODE: 'deny',
  };
  delete env.CLAUDE_PROJECT_DIR;
  return { home, root, env };
}

function makeRepo(root, name) {
  const dir = path.join(root, name);
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  return dir;
}

function registryFile(env, sid) {
  return path.join(env.HOME, '.claude', 'iakaframe-sessions', `${sid}.jsonl`);
}

function readRegistry(env, sid) {
  const p = registryFile(env, sid);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
}

function runHook(payload, env) {
  return spawnSync(process.execPath, [PERIM], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}

// CA-41 (chantier-remind.mjs, canal PROMPT) : reutilise dans CE fichier (perimetre "bout-en-bout"
// des dossiers hors, 3e amendement) plutot que guard-chantier-remind.test.js — cf. § "Fichiers
// concernes" de l'instruction (CA-37 a CA-39 et CA-41 ici ; CA-40 seul dans l'autre fichier).
const REMIND = path.join(HOOKS_DIR, 'chantier-remind.mjs');
function runRemind(payload, env) {
  return spawnSync(process.execPath, [REMIND], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}

const pre = (sid, cwd, tool, tool_input, extra) => ({
  hook_event_name: 'PreToolUse', session_id: sid, cwd, tool_name: tool, tool_input, ...extra,
});

// ===========================================================================
// M-9 — non-regression : sans session_id, la couche chantier est IGNOREE.
// ===========================================================================

test('M-9 : sans session_id, la couche chantier est ignoree (aucun registre cree)', () => {
  const { env, root } = makeSandbox();
  const res = runHook({ hook_event_name: 'PreToolUse', cwd: root, tool_name: 'Edit', tool_input: { file_path: path.join(root, 'x.js') } }, env);
  assert.equal(res.status, 0);
  assert.ok(!fs.existsSync(path.join(env.HOME, '.claude', 'iakaframe-sessions')));
});

// ===========================================================================
// CA-25 — interrupteur (Q5) : IAKAFRAME_CHANTIER_MODE=off -> couche IGNOREE (aucun registre).
// ===========================================================================

test('CA-25 : IAKAFRAME_CHANTIER_MODE=off -> couche chantier ignoree, aucun registre cree', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(pre(sid, root, 'Edit', { file_path: path.join(root, 'x.js') }), { ...env, IAKAFRAME_CHANTIER_MODE: 'off' });
  assert.equal(res.status, 0);
  assert.ok(!fs.existsSync(registryFile(env, sid)));
});

// ===========================================================================
// CA-10 : 1er hook cree le registre (launch @portefeuille, main_role odin) ; Write au portefeuille -> ALLOW.
// ===========================================================================

test('CA-10 : le 1er hook (PreToolUse) cree le registre avec launch @portefeuille, main_role odin ; Write -> exit 0', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(pre(sid, root, 'Write', { file_path: path.join(root, 'notes.md') }), env);
  assert.equal(res.status, 0);
  const events = readRegistry(env, sid);
  const launch = events.find((e) => e.type === 'launch');
  assert.ok(launch, 'evenement launch attendu');
  assert.equal(launch.key.kind, 'portefeuille');
  assert.equal(launch.main_role, 'odin');
});

// ===========================================================================
// CA-11 : Edit hors chantier (repoA) par le thread principal -> exit 2 CHANTIER_MISMATCH,
// stderr contient le code, "session Aragorn" et le nom du depot vise ; PAS le secours retire (L-5).
// ===========================================================================

test('CA-11 : Edit sur repoA (chantier=@portefeuille) par le thread principal -> exit 2 CHANTIER_MISMATCH', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, root, 'Write', { file_path: path.join(root, 'notes.md') }), env); // 1er hook : cree le registre
  const res = runHook(pre(sid, root, 'Edit', { file_path: path.join(repoA, 'x.js') }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/);
  assert.match(res.stderr, /session Aragorn/);
  assert.match(res.stderr, /repoA/);
  assert.doesNotMatch(res.stderr.toLowerCase(), /designer le depot/);
  assert.doesNotMatch(res.stderr.toLowerCase(), /deleguer a aragorn/);
});

// ===========================================================================
// CA-13 : odin-direct (grant deja au registre, ecrit par chantier-remind) -> Edit ALLOW.
// ===========================================================================

test('CA-13 : avec un grant sur repoA (deja au registre) -> Edit repoA par le thread principal -> exit 0', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, root, 'Write', { file_path: path.join(root, 'notes.md') }), env); // launch @portefeuille
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'grant', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'user' }) + '\n',
    'utf8',
  );
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'declare', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'odin-direct' }) + '\n',
    'utf8',
  );
  const res = runHook(pre(sid, root, 'Edit', { file_path: path.join(repoA, 'x.js') }), env);
  assert.equal(res.status, 0);
});

// ===========================================================================
// CA-12 (partiel, perimeter-guard uniquement) : ODIN_DIRECT / attribution par agent_id.
// ===========================================================================

test('CA-12 : declare(repoA) au registre -> Edit repoA par le thread principal (MAIN, role odin) -> exit 2 ODIN_DIRECT', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, root, 'Write', { file_path: path.join(root, 'notes.md') }), env); // launch @portefeuille
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'declare', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'user' }) + '\n',
    'utf8',
  );
  const res = runHook(pre(sid, root, 'Edit', { file_path: path.join(repoA, 'x.js') }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /ODIN_DIRECT/);
});

test('CA-12 : meme etat (declare repoA), Edit repoA PAR UN SOUS-AGENT (agent_id, agent_type aragorn) -> exit 0', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, root, 'Write', { file_path: path.join(root, 'notes.md') }), env);
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'declare', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'user' }) + '\n',
    'utf8',
  );
  const res = runHook(pre(sid, root, 'Edit', { file_path: path.join(repoA, 'x.js') }, { agent_id: 's1', agent_type: 'aragorn' }), env);
  assert.equal(res.status, 0);
});

test('CA-12 : meme etat (declare repoA), Edit repoB PAR LE MEME SOUS-AGENT -> exit 2 CHANTIER_MISMATCH', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const repoB = makeRepo(root, 'repoB');
  const sid = nextSid();
  runHook(pre(sid, root, 'Write', { file_path: path.join(root, 'notes.md') }), env);
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'declare', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'user' }) + '\n',
    'utf8',
  );
  const res = runHook(pre(sid, root, 'Edit', { file_path: path.join(repoB, 'y.js') }, { agent_id: 's1', agent_type: 'aragorn' }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/);
});

// ===========================================================================
// CA-14 (partiel, perimeter-guard uniquement) : session d'EQUIPE.
// ===========================================================================

test('CA-14 : session d\'equipe (agent_type aragorn, sans agent_id) lancee dans repoA : Edit repoA -> exit 0 ; Edit repoB -> exit 2', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const repoB = makeRepo(root, 'repoB');
  const sid = nextSid();
  const okA = runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoA, 'x.js') }, { agent_type: 'aragorn' }), env);
  assert.equal(okA.status, 0);
  const events = readRegistry(env, sid);
  const launch = events.find((e) => e.type === 'launch');
  assert.equal(launch.main_role, 'team');
  assert.equal(launch.key.name, 'repoA');

  const okSub = runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoA, 'y.js') }, { agent_id: 's2', agent_type: 'gimli' }), env);
  assert.equal(okSub.status, 0, 'sous-agent gimli dans le depot de lancement -> ALLOW');

  const koB = runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoB, 'z.js') }), env);
  assert.equal(koB.status, 2);
  assert.match(koB.stderr, /CHANTIER_MISMATCH/);
});

// ===========================================================================
// CA-15 : session d'equipe lancee AU PORTEFEUILLE -> TEAM_NEEDS_REPO.
// ===========================================================================

test('CA-15 : session d\'equipe lancee au portefeuille : Write notes.md -> exit 2 TEAM_NEEDS_REPO', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(pre(sid, root, 'Write', { file_path: path.join(root, 'notes.md') }, { agent_type: 'aragorn' }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /TEAM_NEEDS_REPO/);
});

test('CA-15 : session d\'equipe lancee au portefeuille : Bash "iakaframe launch repoA ..." -> exit 2 (TEAM_NEEDS_REPO, portfolioVerb reserve au role odin)', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  const res = runHook(pre(sid, root, 'Bash', { command: 'iakaframe launch repoA --mission-file m.md' }, { agent_type: 'aragorn' }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /TEAM_NEEDS_REPO/);
});

// ===========================================================================
// CA-16 : session lancee dans repoA SANS --agent (role odin, "chez soi").
// ===========================================================================

test('CA-16 : session lancee dans repoA (role odin, chez soi) : Edit repoA -> exit 0 ; Edit repoB -> exit 2', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const repoB = makeRepo(root, 'repoB');
  const sid = nextSid();
  const okA = runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoA, 'x.js') }), env);
  assert.equal(okA.status, 0);
  const koB = runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoB, 'y.js') }), env);
  assert.equal(koB.status, 2);
});

test('CA-16 : Bash "git commit -am x" avec cwd=repoB -> exit 2 ; meme commande cwd=repoA -> exit 0', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const repoB = makeRepo(root, 'repoB');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env); // launch dans repoA
  const koB = runHook(pre(sid, repoB, 'Bash', { command: 'git commit -am x' }), env);
  assert.equal(koB.status, 2);
  const okA = runHook(pre(sid, repoA, 'Bash', { command: 'git commit -am x' }), env);
  assert.equal(okA.status, 0);
});

// ===========================================================================
// CA-17 (reecrit au 3e amendement, A3-1) : session lancee dans un dossier HORS racine/depot ->
// chantier ANCRE sur ce dossier (jamais "aucun chantier"). Lecture libre malgre le chantier ;
// MUTATE hors de l'ancre -> DENY. Dossier hors cree HORS de `os.tmpdir()` (nonTmpDir, M-20) : un
// chemin sous le tmpdir de l'OS serait exclu par D-8 AVANT meme d'atteindre `keyOf`/`verdictChantier`
// et masquerait la faille M-18 (cf. commentaire `nonTmpDir` plus haut).
// ===========================================================================

test('CA-17 : lecture libre malgre un chantier "@hors:<nom>" : git -C/cd&&git status/PowerShell Get-Content/forme CLI par chemin -> exit 0', () => {
  const { env, root } = makeSandbox();
  const repoB = makeRepo(root, 'repoB');
  const horsDir = nonTmpDir('iaka-perim-hors-');
  const sid = nextSid();

  const r1 = runHook(pre(sid, horsDir, 'Bash', { command: `git -C ${repoB} log` }), env);
  assert.equal(r1.status, 0, 'git -C <repoB> log (READ) -> ALLOW malgre le chantier @hors');

  const r2 = runHook(pre(sid, horsDir, 'Bash', { command: `cd ${repoB} && git status` }), env);
  assert.equal(r2.status, 0);

  const r3 = runHook(pre(sid, horsDir, 'PowerShell', { command: `Get-Content ${path.join(repoB, 'x')}` }), env);
  assert.equal(r3.status, 0);

  const cliIndex = path.join(root, 'iakaframe', 'cli', 'src', 'index.js');
  const r4 = runHook(pre(sid, horsDir, 'Bash', { command: `node ${cliIndex} banner X` }), env);
  assert.equal(r4.status, 0);
});

test('CA-17 : "npm test" (MUTATE, cwd=repoB) sous un chantier "@hors:<nom>" -> exit 2 CHANTIER_MISMATCH (plus NO_CHANTIER : un lancement hors ouvre un chantier ancre, A3-1)', () => {
  const { env, root } = makeSandbox();
  const repoB = makeRepo(root, 'repoB');
  const horsDir = nonTmpDir('iaka-perim-hors2-');
  const sid = nextSid();
  runHook(pre(sid, horsDir, 'Bash', { command: 'echo init' }), env); // launch @hors:<nom>, ancre sur horsDir
  const res = runHook(pre(sid, repoB, 'Bash', { command: 'npm test' }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/);
});

// ===========================================================================
// CA-18 : exclusions D-8 (scratchpad_dir, os.tmpdir()) -> ALLOW meme sous un chantier different.
// ===========================================================================

test('CA-18 : Write dans payload.scratchpad_dir -> exit 0, aucune cle attribuee (meme si le chantier est ailleurs)', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-perim-scratch-'));
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env); // launch repoA (role odin, chez soi)
  const res = runHook(pre(sid, repoA, 'Write', { file_path: path.join(scratch, 'out.txt') }, { scratchpad_dir: scratch }), env);
  assert.equal(res.status, 0);
});

test('CA-18 : Write dans os.tmpdir() -> exit 0, meme sans scratchpad_dir dans le payload (pas d\'erreur)', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env);
  const res = runHook(pre(sid, repoA, 'Write', { file_path: path.join(os.tmpdir(), 'iaka-perim-out.txt') }), env);
  assert.equal(res.status, 0);
});

// ===========================================================================
// CA-19 : hors-limite absolu (D-9), avant tout autre verdict — grant/sous-agent/equipe compris.
// ===========================================================================

test('CA-19 : Write sur ~/.claude/iakaframe-sessions/<sid>.jsonl -> exit 2 DENY_REGISTRY, meme avec un grant, depuis un sous-agent, en session d\'equipe', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoA, 'x.js') }, { agent_type: 'aragorn' }), env); // launch team
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'grant', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'user' }) + '\n',
    'utf8',
  );
  const target = registryFile(env, sid);
  const res = runHook(pre(sid, repoA, 'Write', { file_path: target }, { agent_id: 's9', agent_type: 'gimli' }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /DENY_REGISTRY/);
});

test('CA-19 : Edit sur ~/.claude/hooks/perimeter-guard.mjs -> exit 2 DENY_HARNESS', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env);
  const target = path.join(env.HOME, '.claude', 'hooks', 'perimeter-guard.mjs');
  const res = runHook(pre(sid, repoA, 'Edit', { file_path: target }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /DENY_HARNESS/);
});

test('CA-19 : Bash "node install.mjs --overwrite --yes" et "iakaframe install" -> exit 2 DENY_HARNESS', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env);
  const r1 = runHook(pre(sid, repoA, 'Bash', { command: 'node install.mjs --overwrite --yes' }), env);
  assert.equal(r1.status, 2);
  assert.match(r1.stderr, /DENY_HARNESS/);
  const r2 = runHook(pre(sid, repoA, 'Bash', { command: 'iakaframe install' }), env);
  assert.equal(r2.status, 2);
  assert.match(r2.stderr, /DENY_HARNESS/);
});

test('CA-19 : Bash "claude -p ..." / "claude --agent aragorn ..." / PowerShell Start-Process claude / "iakaframe go ..." -> exit 2 DENY_SELF_INVOKE', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env);

  const r1 = runHook(pre(sid, repoA, 'Bash', { command: 'claude -p "x"' }), env);
  assert.equal(r1.status, 2);
  assert.match(r1.stderr, /DENY_SELF_INVOKE/);

  const r2 = runHook(pre(sid, repoA, 'Bash', { command: 'claude --agent aragorn "odin-direct x"' }), env);
  assert.equal(r2.status, 2);
  assert.match(r2.stderr, /DENY_SELF_INVOKE/);

  const r3 = runHook(pre(sid, repoA, 'PowerShell', { command: 'Start-Process claude -ArgumentList x' }), env);
  assert.equal(r3.status, 2);
  assert.match(r3.stderr, /DENY_SELF_INVOKE/);

  const r4 = runHook(pre(sid, repoA, 'Bash', { command: 'iakaframe go repoA --do x' }), env);
  assert.equal(r4.status, 2);
  assert.match(r4.stderr, /DENY_SELF_INVOKE/);
});

test('CA-19 : Bash "cat ~/.claude/iakaframe-sessions/<sid>.jsonl" (READ) -> exit 0 (registryRef classee READ, "passe")', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env);
  const res = runHook(pre(sid, repoA, 'Bash', { command: `cat ~/.claude/iakaframe-sessions/${sid}.jsonl` }), env);
  assert.equal(res.status, 0);
});

// ===========================================================================
// CA-20 (comportemental, perimeter-guard uniquement) : jamais de grant/declare/named ecrit ici.
// ===========================================================================

test('CA-20 : perimeter-guard n\'ecrit jamais declare/grant/named au registre (seulement launch et fail_open)', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const repoB = makeRepo(root, 'repoB');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoA, 'x.js') }), env);
  runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoB, 'y.js') }), env); // refuse, mais ne doit rien ecrire de plus
  const types = readRegistry(env, sid).map((e) => e.type);
  for (const t of types) assert.ok(t === 'launch' || t === 'fail_open', `type inattendu au registre : ${t}`);
});

test('CA-20 : source — perimeter-guard.mjs n\'importe pas les ecrivains de declare/grant/named (aucun appendEvent direct)', () => {
  const src = fs.readFileSync(PERIM, 'utf8');
  assert.doesNotMatch(src, /appendEvent/);
});

// ===========================================================================
// CA-21 : worktree Gimli — attribution au depot PRINCIPAL.
// ===========================================================================

test('CA-21 : Edit sous <repoA>/.claude/worktrees/w1/ (fichier .git worktree) -> attribue a repoA (chantier repoA)', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const wt = path.join(repoA, '.claude', 'worktrees', 'w1');
  fs.mkdirSync(wt, { recursive: true });
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${path.join(repoA, '.git', 'worktrees', 'w1').replace(/\\/g, '/')}\n`, 'utf8');
  const sid = nextSid();
  runHook(pre(sid, repoA, 'Bash', { command: 'echo init' }), env); // launch repoA
  const res = runHook(pre(sid, repoA, 'Edit', { file_path: path.join(wt, 'x.js') }), env);
  assert.equal(res.status, 0, 'la worktree est attribuee au depot principal (repoA), qui est le chantier actif');
});

// ===========================================================================
// CA-26 : commandes portefeuille (D-14).
// ===========================================================================

test('CA-26 : session odin au portefeuille, thread principal : "iakaframe onboard --path <racine>/neuf" -> exit 0, journal PORTFOLIO_VERB', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  runHook(pre(sid, root, 'Bash', { command: 'echo init' }), env); // launch @portefeuille
  const cible = path.join(root, 'neuf');
  const res = runHook(pre(sid, root, 'Bash', { command: `iakaframe onboard --path ${cible}` }), env);
  assert.equal(res.status, 0);
  const last = readRegistry(env, sid).slice(-1); // pas d'ecriture supplementaire : on relit le journal fichier a part
  const journal = fs.readFileSync(path.join(env.HOME, '.claude', 'iakaframe-perimeter.log'), 'utf8')
    .trim().split(/\r?\n/).map((l) => JSON.parse(l));
  const rec = journal.find((r) => r.session === sid && r.verdict === 'PORTFOLIO_VERB');
  assert.ok(rec, 'journal PORTFOLIO_VERB attendu');
});

test('CA-26 : "iakaframe launch repoA --mission-file <tmp>/m.md" (repo par NOM) -> exit 0, journal PORTFOLIO_VERB', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  runHook(pre(sid, root, 'Bash', { command: 'echo init' }), env);
  const tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-perim-mission-')), 'm.md');
  fs.writeFileSync(tmpFile, 'mission', 'utf8');
  const res = runHook(pre(sid, root, 'Bash', { command: `iakaframe launch repoA --mission-file ${tmpFile}` }), env);
  assert.equal(res.status, 0);
});

test('CA-26 : la MEME commande suivie de "&& git commit -am x" (2 segments) -> exit 2 (portfolioVerb exige 1 seul segment)', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  runHook(pre(sid, root, 'Bash', { command: 'echo init' }), env);
  const cible = path.join(root, 'neuf');
  const res = runHook(pre(sid, root, 'Bash', { command: `iakaframe onboard --path ${cible} && git commit -am x` }), env);
  assert.equal(res.status, 2);
});

test('CA-26 : depuis un SOUS-AGENT (agent_id) -> exit 2 (portfolioVerb exige actor MAIN)', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  runHook(pre(sid, root, 'Bash', { command: 'echo init' }), env);
  const cible = path.join(root, 'neuf');
  const res = runHook(pre(sid, root, 'Bash', { command: `iakaframe onboard --path ${cible}` }, { agent_id: 's1', agent_type: 'gimli' }), env);
  assert.equal(res.status, 2);
});

test('CA-26 : "iakaframe onboard --path C:\\Windows\\x" (cle hors ancree sur C:\\Windows, A3-2 b) -> exit 2 CHANTIER_MISMATCH', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  runHook(pre(sid, root, 'Bash', { command: 'echo init' }), env); // launch @portefeuille
  const horsCible = process.platform === 'win32' ? 'C:\\Windows\\x' : '/etc/x';
  const res = runHook(pre(sid, root, 'Bash', { command: `iakaframe onboard --path ${horsCible}` }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/);
});

// ===========================================================================
// 3e amendement (declaration-chantier-session.md § 2, Lot 1ter) — CA-37 a CA-39, CA-41.
// Fixtures HORS de `os.tmpdir()` (nonTmpDir, M-20) : sinon D-8 les exclurait AVANT `keyOf`,
// masquant la faille M-18 (horsA -> horsB ALLOW) que ce lot ferme.
// ===========================================================================

test('CA-37 (faille M-18 fermee) : session odin lancee dans horsA — gestes DANS l\'ancre -> ALLOW', () => {
  const { env, root } = makeSandbox();
  const horsA = nonTmpDir('iaka-perim-horsA-');
  const sid = nextSid();

  const r1 = runHook(pre(sid, horsA, 'Write', { file_path: path.join(horsA, 'f.txt') }), env);
  assert.equal(r1.status, 0);

  const deep = path.join(horsA, 'sub', 'deep');
  fs.mkdirSync(deep, { recursive: true });
  const r2 = runHook(pre(sid, horsA, 'Edit', { file_path: path.join(deep, 'g.txt') }), env);
  assert.equal(r2.status, 0);

  const r3 = runHook(pre(sid, path.join(horsA, 'sub'), 'Bash', { command: 'npm test' }), env);
  assert.equal(r3.status, 0);
});

test('CA-37 (faille M-18 fermee) : session odin lancee dans horsA — gestes VERS horsB (ou ailleurs) -> DENY CHANTIER_MISMATCH', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const horsA = nonTmpDir('iaka-perim-horsA-');
  const horsB = nonTmpDir('iaka-perim-horsB-');
  const sid = nextSid();
  runHook(pre(sid, horsA, 'Bash', { command: 'echo init' }), env); // launch, ancre horsA

  const wWrite = runHook(pre(sid, horsA, 'Write', { file_path: path.join(horsB, 'f.txt') }), env);
  assert.equal(wWrite.status, 2);
  assert.match(wWrite.stderr, /CHANTIER_MISMATCH/);
  assert.match(wWrite.stderr, /horsB/);
  assert.match(wWrite.stderr, /claude/);
  assert.doesNotMatch(wWrite.stderr, /--agent aragorn/);

  const wEdit = runHook(pre(sid, horsA, 'Edit', { file_path: path.join(horsB, 'f.txt') }), env);
  assert.equal(wEdit.status, 2);
  assert.match(wEdit.stderr, /CHANTIER_MISMATCH/);

  const bashRedir = runHook(pre(sid, horsA, 'Bash', { command: `echo x > ${path.join(horsB, 'f.txt')}` }), env);
  assert.equal(bashRedir.status, 2);
  assert.match(bashRedir.stderr, /CHANTIER_MISMATCH/);

  const psSetContent = runHook(pre(sid, horsA, 'PowerShell', { command: `Set-Content ${path.join(horsB, 'f.txt')} x` }), env);
  assert.equal(psSetContent.status, 2);
  assert.match(psSetContent.stderr, /CHANTIER_MISMATCH/);

  const npmHorsB = runHook(pre(sid, horsB, 'Bash', { command: 'npm test' }), env);
  assert.equal(npmHorsB.status, 2);
  assert.match(npmHorsB.stderr, /CHANTIER_MISMATCH/);

  const notes = runHook(pre(sid, horsA, 'Write', { file_path: path.join(root, 'notes.md') }), env);
  assert.equal(notes.status, 2);
  assert.match(notes.stderr, /CHANTIER_MISMATCH/);

  const versRepoA = runHook(pre(sid, horsA, 'Write', { file_path: path.join(repoA, 'x.js') }), env);
  assert.equal(versRepoA.status, 2);
  assert.match(versRepoA.stderr, /CHANTIER_MISMATCH/);
});

test('CA-37 (faille M-18 fermee) : sous-agent — horsA ALLOW, horsB DENY (meme ancre que le thread principal)', () => {
  const { env, root } = makeSandbox();
  const horsA = nonTmpDir('iaka-perim-horsA-');
  const horsB = nonTmpDir('iaka-perim-horsB-');
  const sid = nextSid();
  runHook(pre(sid, horsA, 'Bash', { command: 'echo init' }), env);

  const subOk = runHook(pre(sid, horsA, 'Write', { file_path: path.join(horsA, 'f2.txt') }, { agent_id: 's1', agent_type: 'gimli' }), env);
  assert.equal(subOk.status, 0);

  const subKo = runHook(pre(sid, horsA, 'Write', { file_path: path.join(horsB, 'f.txt') }, { agent_id: 's1', agent_type: 'gimli' }), env);
  assert.equal(subKo.status, 2);
  assert.match(subKo.stderr, /CHANTIER_MISMATCH/);
});

test('CA-37 : registre HERITE (launch hors NON ANCRE, forme pre-Lot-1ter) -> repli ferme NO_CHANTIER ; lecture libre ; exclusions D-8 inchangees', () => {
  const { env, root } = makeSandbox();
  const horsA = nonTmpDir('iaka-perim-horsA-herite-');
  const sid = nextSid();
  const regPath = registryFile(env, sid);
  fs.mkdirSync(path.dirname(regPath), { recursive: true });
  fs.writeFileSync(
    regPath,
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'launch', key: { kind: 'hors', root: null, name: '@hors' }, main_role: 'odin', main_agent_type: null }) + '\n',
    'utf8',
  );

  const wr = runHook(pre(sid, horsA, 'Write', { file_path: path.join(horsA, 'f.txt') }), env);
  assert.equal(wr.status, 2);
  assert.match(wr.stderr, /NO_CHANTIER/);

  const rd = runHook(pre(sid, horsA, 'Bash', { command: 'git status' }), env);
  assert.equal(rd.status, 0);

  const tmp = runHook(pre(sid, horsA, 'Write', { file_path: path.join(os.tmpdir(), 'iaka-perim-herite-out.txt') }), env);
  assert.equal(tmp.status, 0);
});

// ===========================================================================
// CA-38 (sous reserve Q-H1, tranche "non" — recommandation retenue) : ancre TROP LARGE.
// ===========================================================================

test('CA-38 : session lancee dans le HOME du bac a sable (hors tmp, M-20) -> ancre refusee, NO_CHANTIER', () => {
  const { root } = makeSandbox();
  const home = nonTmpDir('iaka-perim-home-anchor-');
  const env = {
    ...process.env, HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root, IAKAFRAME_CHANTIER_MODE: 'deny',
  };
  delete env.CLAUDE_PROJECT_DIR;
  const sid = nextSid();
  runHook(pre(sid, home, 'Bash', { command: 'echo init' }), env);
  const launch = readRegistry(env, sid).find((e) => e.type === 'launch');
  assert.equal(launch.key.kind, 'hors');
  assert.equal(launch.key.root, null);

  const res = runHook(pre(sid, home, 'Write', { file_path: path.join(home, 'x.txt') }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /NO_CHANTIER/);
});

// ===========================================================================
// CA-39 : session d'EQUIPE lancee dans un dossier hors -> TEAM_NEEDS_REPO (inchange, A3-1).
// ===========================================================================

test('CA-39 : session d\'equipe (agent_type aragorn, sans agent_id) lancee dans un dossier hors -> exit 2 TEAM_NEEDS_REPO', () => {
  const { env } = makeSandbox();
  const horsA = nonTmpDir('iaka-perim-horsA-team-');
  const sid = nextSid();
  const res = runHook(pre(sid, horsA, 'Write', { file_path: path.join(horsA, 'f.txt') }, { agent_type: 'aragorn' }), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /TEAM_NEEDS_REPO/);
});

// ===========================================================================
// CA-41 : chantier-remind (stdout) + journal de perimetre, session lancee dans un dossier hors.
// ===========================================================================

test('CA-41 : chantier-remind stdout "Chantier actif : @hors:<nom> (<root>)" ; journal de perimetre chantier.root non nul', () => {
  const { env } = makeSandbox();
  const horsA = nonTmpDir('iaka-perim-horsA-remind-');
  const sid = nextSid();
  runHook(pre(sid, horsA, 'Bash', { command: 'echo init' }), env); // 1er hook : cree le registre, ancre horsA

  const res = runRemind({ hook_event_name: 'UserPromptSubmit', session_id: sid, cwd: horsA, prompt: 'bonjour' }, env);
  assert.equal(res.status, 0);
  const nom = path.basename(horsA);
  assert.match(res.stdout, new RegExp(`Chantier actif : @hors:${nom} \\(`));

  const journal = fs.readFileSync(path.join(env.HOME, '.claude', 'iakaframe-perimeter.log'), 'utf8')
    .trim().split(/\r?\n/).map((l) => JSON.parse(l));
  const rec = journal.find((r) => r.session === sid);
  assert.ok(rec, 'ligne de journal attendue pour cette session');
  assert.ok(rec.chantier && rec.chantier.root, 'chantier.root doit etre non nul');
});

// ===========================================================================
// D-10 — panne interne : fail-open VISIBLE (jamais silencieuse) au sein de la couche chantier.
// ===========================================================================

test('D-10 : panne interne (registre illisible : EISDIR) -> exit 0, systemMessage FAIL-OPEN', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  fs.mkdirSync(registryFile(env, sid), { recursive: true }); // un DOSSIER a l'emplacement du registre
  const res = runHook(pre(sid, repoA, 'Edit', { file_path: path.join(repoA, 'x.js') }), env);
  assert.equal(res.status, 0);
  const parsed = JSON.parse(res.stdout);
  assert.match(parsed.systemMessage, /^\[chantier-guard\] FAIL-OPEN : perimeter-guard — /);
});
