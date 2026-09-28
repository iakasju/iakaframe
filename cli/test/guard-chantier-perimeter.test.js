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
// ECART DECLARE (CA-17, dernier cas) : l'instruction libelle "Bash npm test (cwd repoB) -> exit 2
// NO_CHANTIER" pour une session lancee dans un dossier @hors. Par la regle D-5 deja verrouillee
// (guard-core.mjs, Lot 1bis, "regle 6 ... @hors compris") un `active` de `kind:"hors"` N'EST PAS
// `null` (le premier `launch` ouvre TOUJOURS le segment 1, y compris hors racine/depot) : une cle
// touchee (`repoB`, un vrai depot) differente de `@hors` releve donc de la regle 6
// (CHANTIER_MISMATCH), jamais de la regle 5 (NO_CHANTIER, qui exige `state.active` LITTERALEMENT
// absent). Le coeur pur n'est pas modifie par ce lot : ce test verrouille le comportement REEL et
// deja verifie (CA-5 regle 6, guard-core.test.js) plutot que le libelle imprecis de l'instruction.
// Aucun autre verdict n'est affecte ; declare a Legolas/Gandalf, pas tranche silencieusement.
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
// CA-17 : lecture libre (session lancee HORS racine/depot, kind "hors") ; MUTATE -> DENY.
// ===========================================================================

test('CA-17 : lecture libre malgre un chantier "@hors" : git -C/cd&&git status/PowerShell Get-Content/forme CLI par chemin -> exit 0', () => {
  const { env, root } = makeSandbox();
  const repoB = makeRepo(root, 'repoB');
  const horsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-perim-hors-'));
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

test('CA-17 (ecart declare) : "npm test" (MUTATE, cwd=repoB) sous un chantier "@hors" -> exit 2 CHANTIER_MISMATCH (regle 6, "@hors compris" — pas NO_CHANTIER, cf. en-tete du fichier)', () => {
  const { env, root } = makeSandbox();
  const repoB = makeRepo(root, 'repoB');
  const horsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-perim-hors2-'));
  const sid = nextSid();
  runHook(pre(sid, horsDir, 'Bash', { command: 'echo init' }), env); // launch @hors (segment 1)
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

test('CA-26 : "iakaframe onboard --path C:\\Windows\\x" (@hors) -> exit 2', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  runHook(pre(sid, root, 'Bash', { command: 'echo init' }), env);
  const horsCible = process.platform === 'win32' ? 'C:\\Windows\\x' : '/etc/x';
  const res = runHook(pre(sid, root, 'Bash', { command: `iakaframe onboard --path ${horsCible}` }), env);
  assert.equal(res.status, 2);
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
