// Tests du hook `UserPromptSubmit` chantier-remind.mjs (Lot 3, specs/instructions/
// declaration-chantier-session.md § D-1..D-3/D-10, Detection (b) ; 2e amendement — lecture L-5 de
// prise-de-parole-odin-aragorn.md : le secours "sous-agent aragorn" est retire du CONTRAT, ce
// hook ne le propose donc jamais).
//
// Remplace l'ancien fichier heritE `guard-chantier.test.js` (non suivi, importait `pickBinding`
// supprime, couvrait aussi `chantier-bind.mjs`/Lot 3bis — EXCLU par le 2e amendement). Ce fichier
// ne couvre QUE chantier-remind.mjs : l'adaptateur d'etat (chantier-state.mjs) est verrouille par
// `guard-chantier-state.test.js` (Lot 2) et le coeur pur par `guard-core.test.js` (Lot 1/1bis).
//
// AUCUN test ici n'ecrit dans le vrai `~/.claude` : chaque test redirige HOME/USERPROFILE et
// IAKAFRAME_ROOT vers un tmpdir dedie (sandbox), et le hook est lance bout-en-bout via `spawnSync`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks');
const REMIND = path.join(HOOKS_DIR, 'chantier-remind.mjs');

// ---------------------------------------------------------------------------
// Sandbox : HOME/USERPROFILE + IAKAFRAME_ROOT rediriges vers un tmpdir. JAMAIS le vrai ~/.claude.
// ---------------------------------------------------------------------------

let seq = 0;
function nextSid() {
  seq += 1;
  return `test${process.pid}${Date.now()}${seq}`.replace(/[^A-Za-z0-9-]/g, '');
}

function tmpDir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function makeSandbox() {
  const home = tmpDir('iaka-remind-home-');
  const root = tmpDir('iaka-remind-root-');
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
  return spawnSync(process.execPath, [REMIND], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}

function prompt(sid, root, text, extra) {
  return { hook_event_name: 'UserPromptSubmit', session_id: sid, cwd: root, prompt: text, ...extra };
}

// ===========================================================================
// CA-23 (exit toujours 0, jamais de recopie du prompt, ligne "Chantier actif :" systematique)
// ===========================================================================

test('CA-23 : stdin vide / JSON invalide -> exit 0, aucune sortie', () => {
  const { env } = makeSandbox();
  const r1 = spawnSync(process.execPath, [REMIND], { input: '', env, encoding: 'utf8' });
  assert.equal(r1.status, 0);
  assert.equal(r1.stdout, '');
  const r2 = spawnSync(process.execPath, [REMIND], { input: 'pas du json', env, encoding: 'utf8' });
  assert.equal(r2.status, 0);
  assert.equal(r2.stdout, '');
});

test('CA-23 : stdout contient toujours "Chantier actif :" ; le texte du prompt n\'est JAMAIS recopie', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const nonce = 'NE-DOIT-JAMAIS-APPARAITRE-' + Date.now();
  const res = runHook(prompt(sid, root, nonce), env);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Chantier actif :/);
  assert.ok(!res.stdout.includes(nonce));
});

test('CA-23 : la ligne "Chantier actif" porte le role de session ("role odin" au portefeuille)', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'salut'), env);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Chantier actif : @portefeuille \(.*\) — segment 1, depuis .*, role odin/);
});

test('CA-23 : session d\'equipe (agent_type != odin, sans agent_id) -> role "team:<agent_type>"', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  const repoA = path.join(root, 'repoA');
  const res = runHook(prompt(sid, repoA, 'salut', { agent_type: 'aragorn' }), { ...env, CLAUDE_PROJECT_DIR: repoA });
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Chantier actif : repoA \(.*\) — segment 1, depuis .*, role team:aragorn/);
});

test('CA-23 : registre neuf -> mention UNIQUEMENT quand prompt_id est present (pas au tout 1er prompt)', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const r0 = runHook(prompt(sid, root, 'salut'), env);
  assert.ok(!r0.stdout.includes('Registre neuf'));

  const sid2 = nextSid();
  const r1 = runHook(prompt(sid2, root, 'salut', { prompt_id: 'p1' }), env);
  assert.ok(r1.stdout.includes('Registre neuf'));
  const r2 = runHook(prompt(sid2, root, 'encore', { prompt_id: 'p2' }), env);
  assert.ok(!r2.stdout.includes('Registre neuf'));
});

// ===========================================================================
// CA-24 (panne interne : fail-open visible, jamais silencieuse, jamais bloquante)
// ===========================================================================

test('CA-24 : panne interne (registre illisible : EISDIR) -> exit 0, systemMessage FAIL-OPEN, jamais bloquant', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  // Force une exception NON-ENOENT dans `loadState` : un DOSSIER a l'emplacement du registre.
  fs.mkdirSync(registryFile(env, sid), { recursive: true });
  const res = runHook(prompt(sid, root, 'salut'), env);
  assert.equal(res.status, 0);
  const parsed = JSON.parse(res.stdout);
  assert.match(parsed.systemMessage, /^\[chantier-guard\] FAIL-OPEN : chantier-remind — /);
});

// ===========================================================================
// CA-25 (interrupteur Q5)
// ===========================================================================

test('CA-25 : IAKAFRAME_CHANTIER_MODE=off -> aucune sortie, aucun registre cree', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'chantier repoA'), { ...env, IAKAFRAME_CHANTIER_MODE: 'off' });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
  assert.equal(readRegistry(env, sid).length, 0);
});

// ===========================================================================
// D-3 — Directives ligne seule, EN SESSION "odin" (portefeuille) : ecriture au registre.
// ===========================================================================

test('D-3 : `chantier <nom>` (session odin) -> ecrit `declare` (by:"user"), team_source, aragorn@<nom>', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'chantier repoA'), { ...env, CLAUDE_PROJECT_DIR: root });
  assert.equal(res.status, 0);
  const events = readRegistry(env, sid);
  const decl = events.find((e) => e.type === 'declare');
  assert.ok(decl, 'evenement declare attendu');
  assert.equal(decl.key.name, 'repoA');
  assert.equal(decl.by, 'user');
  assert.equal(decl.aragorn, 'aragorn@repoA');
  assert.equal(decl.team_source, root);
  assert.match(res.stdout, /Chantier actif : repoA/);
});

test('D-3 : `chantier <nom>` sur un dossier INEXISTANT sous la racine -> accepte (kind:"dir")', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'chantier neuf'), env);
  assert.equal(res.status, 0);
  const decl = readRegistry(env, sid).find((e) => e.type === 'declare');
  assert.equal(decl.key.kind, 'dir');
  assert.equal(decl.key.name, 'neuf');
});

test('D-3 : `odin-direct <repo>` existant -> declare(by:"odin-direct") PUIS grant(by:"user")', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'odin-direct repoA'), env);
  assert.equal(res.status, 0);
  const events = readRegistry(env, sid).filter((e) => e.type !== 'launch');
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'declare');
  assert.equal(events[0].by, 'odin-direct');
  assert.equal(events[1].type, 'grant');
  assert.equal(events[1].by, 'user');
  assert.equal(events[1].key.name, 'repoA');
});

test('D-3 : `odin-direct <nom>` sur un dossier INEXISTANT -> refuse, aucun grant/declare ecrit', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'odin-direct jamais-cree'), env);
  assert.equal(res.status, 0);
  const events = readRegistry(env, sid).filter((e) => e.type !== 'launch');
  assert.equal(events.length, 0);
  assert.match(res.stdout, /odin-direct 'jamais-cree' refuse/);
});

test('D-3 : une mention EN PHRASE ("on pourrait faire odin-direct naonedge") n\'accorde rien', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'naonedge');
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'on pourrait faire odin-direct naonedge'), env);
  assert.equal(res.status, 0);
  const events = readRegistry(env, sid).filter((e) => e.type !== 'launch');
  assert.ok(!events.some((e) => e.type === 'grant' || e.type === 'declare'));
});

test('D-3 : nom ambigu -> stdout signale le conflit, aucun NOUVEAU declare', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'naonedge');
  const otherRoot = tmpDir('iaka-remind-other-');
  const clone = makeRepo(otherRoot, 'naonedge');
  const sid = nextSid();
  fs.mkdirSync(path.dirname(registryFile(env, sid)), { recursive: true });
  const seedLine = JSON.stringify({
    v: 1, at: new Date().toISOString(), type: 'launch', project_dir: clone,
    key: { kind: 'repo', root: clone, name: 'naonedge' }, main_role: 'odin', main_agent_type: null,
  }) + '\n';
  fs.writeFileSync(registryFile(env, sid), seedLine, 'utf8');
  const before = readRegistry(env, sid).length;
  const res = runHook(prompt(sid, root, 'chantier naonedge'), env);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /ambigu/);
  assert.equal(readRegistry(env, sid).length, before);
});

// ===========================================================================
// Detection (b) etape 3 — mentions de depots connus -> `named` (role indifferent).
// ===========================================================================

test('mention simple d\'un depot connu -> `named`, le chantier de session RESTE @portefeuille', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'bosse sur repoA'), env);
  assert.equal(res.status, 0);
  const events = readRegistry(env, sid);
  const named = events.find((e) => e.type === 'named');
  assert.ok(named, 'evenement named attendu');
  assert.ok(named.keys.some((k) => k.name === 'repoA'));
  assert.equal(events.find((e) => e.type === 'declare'), undefined);
  assert.match(res.stdout, /Chantier actif : @portefeuille/);
});

test('phrases reservees ("update iakaframe") ne nomment pas "iakaframe"', () => {
  const { env, root } = makeSandbox();
  const sid = nextSid();
  const res = runHook(prompt(sid, root, 'update iakaframe'), env);
  assert.equal(res.status, 0);
  assert.equal(readRegistry(env, sid).find((e) => e.type === 'named'), undefined);
});

test('rappel "depot mentionne different de l\'actif" (session odin) : propose une session Aragorn, JAMAIS un secours sous-agent', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  // Chantier de session = repoA (lancement) ; mention de repoB dans le prompt.
  const r0 = runHook(prompt(sid, repoA, 'salut', {}), { ...env, CLAUDE_PROJECT_DIR: repoA });
  assert.equal(r0.status, 0);
  const res = runHook(prompt(sid, repoA, 'et si on regardait repoB ?'), { ...env, CLAUDE_PROJECT_DIR: repoA });
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Depot mentionne \(repoB\) different de l'actif/);
  assert.match(res.stdout, /propose au decideur de lancer une session Aragorn dans ce depot/);
  assert.doesNotMatch(res.stdout.toLowerCase(), /deleguer a aragorn/);
  assert.doesNotMatch(res.stdout.toLowerCase(), /designer le depot/);
});

// ===========================================================================
// Session d'EQUIPE (`agent_type` != odin, sans `agent_id`, D-5 : le chantier EST le lancement).
// ===========================================================================

test('session d\'equipe : directive `chantier <repo>` -> AUCUNE ecriture, rappel "chantier fixe au lancement"', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  const envTeam = { ...env, CLAUDE_PROJECT_DIR: repoA };
  const before = runHook(prompt(sid, repoA, 'init', { agent_type: 'aragorn' }), envTeam);
  assert.equal(before.status, 0);
  const beforeCount = readRegistry(env, sid).length;
  const res = runHook(prompt(sid, repoA, 'chantier repoB', { agent_type: 'aragorn' }), envTeam);
  assert.equal(res.status, 0);
  assert.equal(readRegistry(env, sid).find((e) => e.type === 'declare'), undefined);
  assert.equal(readRegistry(env, sid).length, beforeCount); // aucun evenement ajoute par la directive
  assert.match(res.stdout, /Session aragorn : chantier fixe au lancement \(repoA\)/);
  assert.match(res.stdout, /demande a Odin de lancer une session dans ce depot/);
});

test('session d\'equipe : `odin-direct <repo>` -> AUCUN grant ecrit', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  const envTeam = { ...env, CLAUDE_PROJECT_DIR: repoA };
  const res = runHook(prompt(sid, repoA, 'odin-direct repoB', { agent_type: 'aragorn' }), envTeam);
  assert.equal(res.status, 0);
  assert.equal(readRegistry(env, sid).find((e) => e.type === 'grant'), undefined);
  assert.match(res.stdout, /chantier fixe au lancement/);
});

test('session d\'equipe : mention d\'un autre depot -> `named` ECRIT quand meme (role indifferent), rappel adapte', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  const envTeam = { ...env, CLAUDE_PROJECT_DIR: repoA };
  const res = runHook(prompt(sid, repoA, 'et repoB alors ?', { agent_type: 'aragorn' }), envTeam);
  assert.equal(res.status, 0);
  const named = readRegistry(env, sid).find((e) => e.type === 'named');
  assert.ok(named, 'evenement named attendu meme en session d\'equipe');
  assert.match(res.stdout, /Depot mentionne \(repoB\) different de l'actif : chantier fixe au lancement \(repoA\)/);
  assert.match(res.stdout, /demande a Odin de lancer une session dans ce depot/);
  assert.doesNotMatch(res.stdout.toLowerCase(), /deleguer a aragorn/);
});

// ===========================================================================
// 2e amendement (L-5) — garde de non-regression textuelle : jamais le secours "sous-agent aragorn".
// ===========================================================================

test('L-5 : le SOURCE du hook ne contient jamais la phrase de secours retiree ("deleguer a aragorn" / "designer le depot")', () => {
  const src = fs.readFileSync(REMIND, 'utf8').toLowerCase();
  assert.doesNotMatch(src, /deleguer a aragorn/);
  assert.doesNotMatch(src, /designer le depot/);
});
