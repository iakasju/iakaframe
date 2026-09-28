// Tests bout-en-bout de la COUCHE CHANTIER de delegation-guard.mjs (Lot 5, specs/instructions/
// declaration-chantier-session.md § D-6, D-12 — portions "delegation" des CA-12/13/14/27 ; le
// controle de roster PRE-EXISTANT (`verdictDelegation`) n'est pas reteste ici (deja couvert par
// `guard-codex-complet.test.js`, parite Claude<->Codex).
//
// Perimetre de CE fichier (Lot 5, volet DELEGATION uniquement) : le verdict de la delegation
// (`verdictDispatch`, apres le roster) et l'attribution D-12 (journal + document emis). Le coeur
// pur (`verdictDispatch`, `parseChantierLines`...) est deja verrouille par guard-core.test.js
// (Lot 1bis, CA-6) ; l'adaptateur d'etat (`chantier-state.mjs`) par guard-chantier-state.test.js
// (Lot 2/1ter). Ce fichier ne couvre QUE l'adaptateur delegation-guard.mjs.
//
// CA-19 n'a PAS de portion "delegation" identifiable dans l'instruction (il ne porte que sur des
// gestes Edit/Bash geres par perimeter-guard, deja couverts par guard-chantier-perimeter.test.js) :
// aucun test n'est ajoute ici a ce titre (ecart de lecture assume, signale au gate).
//
// AUCUN test ici n'ecrit dans le vrai `~/.claude` : chaque test redirige HOME/USERPROFILE et
// IAKAFRAME_ROOT vers un tmpdir dedie (sandbox), et les hooks sont lances bout-en-bout via
// `spawnSync`. Le transport DOCDB (CA-27) pointe vers un serveur HTTP local ephemere, jamais vers
// un service reel.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks');
const DELEG = path.join(HOOKS_DIR, 'delegation-guard.mjs');
const PERIM = path.join(HOOKS_DIR, 'perimeter-guard.mjs');
const REMIND = path.join(HOOKS_DIR, 'chantier-remind.mjs');

// ---------------------------------------------------------------------------
// Sandbox : HOME/USERPROFILE + IAKAFRAME_ROOT rediriges vers un tmpdir dedie (meme convention que
// guard-chantier-perimeter.test.js). JAMAIS le vrai ~/.claude.
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
  const home = tmpDir('iaka-deleg-home-');
  const root = tmpDir('iaka-deleg-root-');
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    IAKAFRAME_ROOT: root,
    IAKAFRAME_CHANTIER_MODE: 'deny',
  };
  delete env.CLAUDE_PROJECT_DIR;
  // Jamais d'emission reelle par defaut (D6, borne iakaframe) : chaque test qui veut verifier
  // l'emission (CA-27) fournit explicitement ses propres IAKALOG_*/DOCDB_*.
  delete env.IAKALOG_USER; delete env.IAKALOG_PASS; delete env.IAKALOG_BROKER_URL;
  delete env.DOCDB_URL; delete env.DOCDB_USER; delete env.DOCDB_PASSWORD; delete env.DOCDB_AUTH;
  delete env.IAKALOG_TRANSPORT; delete env.IAKALOG_ROYAUME; delete env.IAKALOG_AGENT;
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

function runPerim(payload, env) {
  return spawnSync(process.execPath, [PERIM], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}
function runRemind(payload, env) {
  return spawnSync(process.execPath, [REMIND], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}
function runDeleg(payload, env) {
  return spawnSync(process.execPath, [DELEG], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}

// runDelegAsync : variante NON BLOQUANTE de runDeleg, reservee aux tests d'EMISSION (CA-27).
// `spawnSync` bloque la boucle d'evenements du processus de TEST tant que l'enfant tourne ; or
// l'enfant (delegation-guard.mjs, transport docdb) `await fetch(...)` un serveur HTTP local qui
// vit DANS ce meme processus de test — avec `spawnSync`, ce serveur ne peut traiter la requete
// qu'APRES le retour de `spawnSync`, soit APRES que l'enfant a lui-meme abandonne (timeout
// d'emission, 1500 ms) : selon l'ordre d'arrivee des paquets, la requete peut ne jamais etre
// consommee (constate empiriquement). `spawn` laisse la boucle d'evenements tourner pendant que
// l'enfant attend une reponse, sans ce risque de blocage mutuel.
function runDelegAsync(payload, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [DELEG], { env });
    let stderr = '';
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('close', (code) => resolve({ status: code, stderr }));
    child.stdin.end(JSON.stringify(payload));
  });
}

const pre = (sid, cwd, tool, tool_input, extra) => ({
  hook_event_name: 'PreToolUse', session_id: sid, cwd, tool_name: tool, tool_input, ...extra,
});
const prompt = (sid, cwd, text, extra) => ({
  hook_event_name: 'UserPromptSubmit', session_id: sid, cwd, prompt: text, ...extra,
});
const deleg = (sid, subagent_type, promptText, extra) => ({
  hook_event_name: 'PreToolUse', session_id: sid, tool_name: 'Agent',
  tool_input: { subagent_type, description: 'test', prompt: promptText ?? null }, ...extra,
});
const delegPost = (sid, subagent_type, response, extra) => ({
  hook_event_name: 'PostToolUse', session_id: sid, tool_name: 'Agent',
  tool_input: { subagent_type }, tool_response: response, ...extra,
});

// Bootstrap du registre : le 1er hook a voir la session cree `launch` (D-1). `delegation-guard`
// n'ecrit JAMAIS le registre (D-2) : on utilise `perimeter-guard.mjs`/`chantier-remind.mjs`, comme
// dans guard-chantier-perimeter.test.js.
function bootstrapOdinPortefeuille(env, sid, root) {
  return runPerim(pre(sid, root, 'Bash', { command: 'echo init' }), env);
}
function bootstrapTeamRepo(env, sid, repoDir) {
  return runPerim(pre(sid, repoDir, 'Bash', { command: 'echo init' }, { agent_type: 'aragorn' }), env);
}

// ---------------------------------------------------------------------------
// Serveur DOCDB de test (CA-27) : capture les documents POSTes, jamais un service reel.
// ---------------------------------------------------------------------------

function startCaptureServer() {
  const docs = [];
  return new Promise((resolveReady) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        try { docs.push(JSON.parse(body)); } catch { docs.push({ __raw: body }); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolveReady({ server, docs, url: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

// assertNoSecoursText(stderr) : 2e amendement (L-5/P-6, Q-P1 = A) — aucun message de refus de
// delegation-guard.mjs ne doit plus proposer le secours retire du contrat ("delegue a `aragorn`
// avec la ligne Chantier: ...", "designer le depot... puis deleguer a aragorn"). Applique a
// CHAQUE test qui verifie un stderr de refus (gate Legolas du Lot 5, point 2).
function assertNoSecoursText(stderr) {
  const s = stderr.toLowerCase();
  assert.doesNotMatch(s, /delegue a `?aragorn/, 'secours retire (L-5) : "delegue a aragorn..." ne doit plus apparaitre');
  assert.doesNotMatch(s, /deleguer a aragorn/, 'secours retire (L-5) : "deleguer a aragorn" ne doit plus apparaitre');
  assert.doesNotMatch(s, /designer le depot/, 'secours retire (L-5) : "designer le depot..." ne doit plus apparaitre');
}

// ===========================================================================
// M-9 — non-regression : sans session_id exploitable, la couche chantier est IGNOREE (roster seul).
// ===========================================================================

test('M-9 : sans session_id, la couche chantier est ignoree — le roster seul decide', () => {
  const { env } = makeSandbox();
  const ok = runDeleg(deleg(undefined, 'gimli', null), env);
  assert.equal(ok.status, 0);
  const ko = runDeleg(deleg(undefined, 'hacker', null), env);
  assert.equal(ko.status, 2);
  assert.match(ko.stderr, /roster iakaframe/);
  assertNoSecoursText(ko.stderr);
});

// ===========================================================================
// CA-25 — interrupteur (Q5) : IAKAFRAME_CHANTIER_MODE=off -> couche chantier ignoree.
// ===========================================================================

test('CA-25 : IAKAFRAME_CHANTIER_MODE=off -> aucun verdict de chantier applique a la delegation', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const repoB = makeRepo(root, 'repoB');
  const sid = nextSid();
  bootstrapTeamRepo(env, sid, repoA);
  const off = { ...env, IAKAFRAME_CHANTIER_MODE: 'off' };
  // Meme sans aucune ligne `Chantier:`, une cible du roster passe (couche ignoree) ; repoB n'existe
  // meme pas comme notion pour delegation-guard sous ce mode.
  const res = runDeleg(deleg(sid, 'gimli', null), off);
  assert.equal(res.status, 0);
  void repoB;
});

// ===========================================================================
// D-6 regle 1 — cibles LECTURE SEULE toujours ALLOW, meme sans aucun chantier connu.
// ===========================================================================

test('D-6 regle 1 : Explore/Plan/claude-code-guide -> ALLOW sans condition, meme registre absent', () => {
  const { env } = makeSandbox();
  const sid = nextSid(); // aucun bootstrap : pas de registre du tout
  for (const target of ['Explore', 'Plan', 'claude-code-guide']) {
    const res = runDeleg(deleg(sid, target, null), env);
    assert.equal(res.status, 0, `${target} -> ALLOW attendu`);
  }
  assert.deepEqual(readRegistry(env, sid), [], 'delegation-guard ne cree jamais le registre (D-2)');
});

// ===========================================================================
// NO_CHANTIER — registre HERITE (launch hors NON ANCRE) : DENY, meme portee que perimeter-guard.
// ===========================================================================

test('NO_CHANTIER : registre HERITE (launch hors non ancre) -> DENY quelle que soit la cible (hors lecture-seule)', () => {
  const { env } = makeSandbox();
  const sid = nextSid();
  const regPath = registryFile(env, sid);
  fs.mkdirSync(path.dirname(regPath), { recursive: true });
  fs.writeFileSync(
    regPath,
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'launch', key: { kind: 'hors', root: null, name: '@hors' }, main_role: 'odin', main_agent_type: null }) + '\n',
    'utf8',
  );
  const koGimli = runDeleg(deleg(sid, 'gimli', null), env);
  assert.equal(koGimli.status, 2);
  assert.match(koGimli.stderr, /NO_CHANTIER/);
  assertNoSecoursText(koGimli.stderr);
  const koAragorn = runDeleg(deleg(sid, 'aragorn', 'Durée estimée : ~10 min\nChantier: repoA\n…'), env);
  assert.equal(koAragorn.status, 2);
  assert.match(koAragorn.stderr, /NO_CHANTIER/);
  assertNoSecoursText(koAragorn.stderr);
  const okExplore = runDeleg(deleg(sid, 'Explore', null), env);
  assert.equal(okExplore.status, 0, 'lecture seule reste ALLOW meme sans chantier (regle 1 avant regle 3)');
});

// ===========================================================================
// CA-12 (portion delegation) — regime Odin, chantier declare (repoA) sans grant.
// ===========================================================================

test('CA-12 : dispatch aragorn avec "Chantier: repoA" (= actif) -> exit 0, registre INCHANGE', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env); // declare(repoA) — session odin
  const before = readRegistry(env, sid);

  const ok = runDeleg(deleg(sid, 'aragorn', 'Durée estimée : ~10 min\nChantier: repoA\n…'), env);
  assert.equal(ok.status, 0);
  assert.deepEqual(readRegistry(env, sid), before, 'D-2 : verdictDispatch n\'ecrit jamais au registre');
});

test('CA-12 : dispatch aragorn avec "Chantier: repoB" (!= actif repoA) -> exit 2 CHANTIER_MISMATCH', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const res = runDeleg(deleg(sid, 'aragorn', 'Durée estimée : ~10 min\nChantier: repoB\n…'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/);
  assertNoSecoursText(res.stderr);
});

test('CA-12 : dispatch gimli SANS ligne, par le thread principal, en regime Odin -> exit 2 ODIN_DISPATCH, SANS le secours retire (L-5/P-6)', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const res = runDeleg(deleg(sid, 'gimli', null), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /ODIN_DISPATCH/);
  assert.match(res.stderr, /session Aragorn/, 'seule la proposition de session Aragorn reste (L-5)');
  assertNoSecoursText(res.stderr);
});

test('contournement : dispatch aragorn SANS aucune ligne "Chantier:" en regime Odin -> exit 2 DISPATCH_UNNAMED', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const res = runDeleg(deleg(sid, 'aragorn', 'Durée estimée : ~10 min\nsans directive ici'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /DISPATCH_UNNAMED/);
  assertNoSecoursText(res.stderr);
});

test('contournement : une ligne "chantier repoB" (syntaxe PROMPT DECIDEUR, pas "Chantier:") dans l\'ordre de mission n\'est PAS reconnue -> DISPATCH_UNNAMED (pas d\'ALLOW furtif)', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const res = runDeleg(deleg(sid, 'aragorn', 'Durée estimée : ~10 min\nchantier repoB\n…'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /DISPATCH_UNNAMED/, 'la ligne "chantier X" (sans deux-points) n\'est jamais une ligne "Chantier: X" valide');
  assertNoSecoursText(res.stderr);
});

test('contournement : cible gimli avec une ligne "Chantier: repoA" VALIDE (identique a l\'actif) en regime Odin -> toujours ODIN_DISPATCH (la ligne ne sauve pas une cible != aragorn)', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const res = runDeleg(deleg(sid, 'gimli', 'Durée estimée : ~10 min\nChantier: repoA\n…'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /ODIN_DISPATCH/);
  assertNoSecoursText(res.stderr);
});

test('contournement : deux lignes "Chantier:" DIVERGENTES -> exit 2 DISPATCH_AMBIGUOUS, quel que soit le regime', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const res = runDeleg(deleg(sid, 'aragorn', 'Durée estimée : ~10 min\nChantier: repoA\nChantier: repoB\n…'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /DISPATCH_AMBIGUOUS/);
  assertNoSecoursText(res.stderr);
});

test('dépôt INCONNU dans "Chantier: <repo>" (nom sous la racine, jamais cree) -> exit 2 CHANTIER_MISMATCH, en regime Odin', () => {
  // Constat de Legolas (gate Lot 5) : `resolveRepoArg` en mode `requireExisting:false` fabrique
  // une cle `{kind:"dir", root:<racine>/<nom>}` pour un nom INCONNU sous la racine (comportement
  // D-3 : "chantier <nom> sur un dossier INEXISTANT sous la racine est accepte, cas de creation de
  // projet") — ce n'est PAS un `key:null` (contrairement a un nom AMBIGU entre deux racines
  // connues, seul cas qui rend `key:null` dans `resolveDispatchRequest`). La cle "dir" fabriquee
  // ne correspond JAMAIS a l'actif (repoA) -> CHANTIER_MISMATCH, pas DISPATCH_UNNAMED.
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const res = runDeleg(deleg(sid, 'aragorn', 'Durée estimée : ~10 min\nChantier: repoInconnu\n…'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/);
  assertNoSecoursText(res.stderr);
});

test('dépôt INCONNU dans "Chantier: <repo>" -> exit 2 CHANTIER_MISMATCH, en regime Equipe (session lancee dans repoA)', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapTeamRepo(env, sid, repoA);

  const res = runDeleg(deleg(sid, 'gimli', 'Chantier: repoInconnu'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/);
  assertNoSecoursText(res.stderr);
});

// ===========================================================================
// CA-13 (portion delegation) — grant sur repoA (deja au registre) : toute cible du roster passe.
// ===========================================================================

test('CA-13 : avec un grant sur repoA -> dispatch gimli par le thread principal -> exit 0', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'declare', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'odin-direct' }) + '\n',
    'utf8',
  );
  fs.appendFileSync(
    registryFile(env, sid),
    JSON.stringify({ v: 1, at: new Date().toISOString(), type: 'grant', key: { kind: 'repo', root: repoA, name: 'repoA' }, by: 'user' }) + '\n',
    'utf8',
  );
  const res = runDeleg(deleg(sid, 'gimli', null), env);
  assert.equal(res.status, 0);
});

// ===========================================================================
// CA-14 (portion delegation) — session d'EQUIPE (lancee dans un depot).
// ===========================================================================

test('CA-14 : session d\'equipe lancee dans repoA : dispatch gimli SANS ligne -> exit 0', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapTeamRepo(env, sid, repoA);
  const res = runDeleg(deleg(sid, 'gimli', null), env);
  assert.equal(res.status, 0);
});

test('CA-14 (contournement) : session d\'equipe lancee dans repoA : dispatch gimli avec "Chantier: repoB" (!= lancement) -> exit 2 CHANTIER_MISMATCH', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  bootstrapTeamRepo(env, sid, repoA);
  const res = runDeleg(deleg(sid, 'gimli', 'Chantier: repoB'), env);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /CHANTIER_MISMATCH/, 'une ligne Chantier: qui pointe ailleurs que le depot de lancement reste un mismatch, meme en regime Equipe');
  assertNoSecoursText(res.stderr);
});

// ===========================================================================
// CA-20 (portion delegation) — aucune ecriture au registre depuis delegation-guard.mjs (D-2).
// ===========================================================================

test('CA-20 : source — delegation-guard.mjs n\'importe aucun ecrivain du registre (ensureLaunch/appendEvent)', () => {
  const src = fs.readFileSync(DELEG, 'utf8');
  assert.doesNotMatch(src, /\bensureLaunch\s*\(/);
  assert.doesNotMatch(src, /\bappendEvent\s*\(/);
});

test('CA-20 : comportemental — apres une salve de dispatchs (ALLOW et DENY), le registre est identique a l\'etat pose par le bootstrap', () => {
  const { env, root } = makeSandbox();
  makeRepo(root, 'repoA');
  makeRepo(root, 'repoB');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);
  const before = readRegistry(env, sid);

  runDeleg(deleg(sid, 'aragorn', 'Chantier: repoA'), env);
  runDeleg(deleg(sid, 'aragorn', 'Chantier: repoB'), env); // DENY
  runDeleg(deleg(sid, 'gimli', null), env); // DENY
  runDeleg(delegPost(sid, 'gimli', 'reponse'), env);

  assert.deepEqual(readRegistry(env, sid), before);
});

// ===========================================================================
// CA-27 (portion delegation) — attribution D-12 : journal + document emis (transport docdb local).
// ===========================================================================

test('CA-27 : document emis (docdb) porte meta.repo/repo_root/segment/main_role, et royaume = REPOA (session d\'equipe)', async () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapTeamRepo(env, sid, repoA); // session d'equipe, lancee dans repoA

  const { server, docs, url } = await startCaptureServer();
  try {
    const emitEnv = {
      ...env,
      IAKALOG_TRANSPORT: 'docdb',
      DOCDB_URL: url,
      DOCDB_USER: 'u', DOCDB_PASSWORD: 'p',
    };
    const res = await runDelegAsync(delegPost(sid, 'gimli', 'travail livre', { agent_type: 'aragorn' }), emitEnv);
    assert.equal(res.status, 0);
    assert.equal(docs.length, 1, 'un seul document emis (agent du roster)');
    const [doc] = docs;
    assert.equal(doc.royaume, 'REPOA');
    assert.equal(doc.meta.repo, 'repoA');
    assert.equal(doc.meta.repo_root, repoA);
    assert.equal(doc.meta.segment, 1);
    assert.equal(doc.meta.main_role, 'team');
    // `aragorn` (D-1) n'est ecrit que par un evenement `declare` (chantier-remind.mjs) ; un simple
    // `launch` d'equipe (jamais de `declare` en session team) le laisse `null` — champ PRESENT,
    // valeur null (D-12 exige la presence du champ, pas une valeur non nulle dans tous les cas).
    assert.equal(doc.meta.aragorn, null);
  } finally {
    server.close();
  }
});

test('CA-27 : `meta.aragorn` est renseigne ("aragorn@<nom>") quand le chantier a ete DECLARE (session Odin, chantier-remind)', async () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env); // declare(repoA) -> aragorn:"aragorn@repoA"

  const { server, docs, url } = await startCaptureServer();
  try {
    const emitEnv = {
      ...env,
      IAKALOG_TRANSPORT: 'docdb',
      DOCDB_URL: url,
      DOCDB_USER: 'u', DOCDB_PASSWORD: 'p',
    };
    const res = await runDelegAsync(delegPost(sid, 'gimli', 'travail livre'), emitEnv);
    assert.equal(res.status, 0);
    assert.equal(docs.length, 1);
    const [doc] = docs;
    assert.equal(doc.royaume, 'REPOA');
    assert.equal(doc.meta.repo, 'repoA');
    assert.equal(doc.meta.segment, 2);
    assert.equal(doc.meta.aragorn, 'aragorn@repoA');
    assert.equal(doc.meta.main_role, 'odin');
  } finally {
    server.close();
  }
});

test('CA-27 (perimetre) : chaque ligne du journal de perimetre porte agent_id, agent_type et chantier.main_role', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapTeamRepo(env, sid, repoA);
  runPerim(pre(sid, repoA, 'Edit', { file_path: path.join(repoA, 'x.js') }, { agent_id: 's1', agent_type: 'gimli' }), env);

  const logPath = path.join(env.HOME, '.claude', 'iakaframe-perimeter.log');
  const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
  const geste = lines.find((l) => l.event === 'GESTE' && l.agent_id === 's1');
  assert.ok(geste, 'ligne GESTE attendue pour le sous-agent');
  assert.equal(geste.agent_type, 'gimli');
  assert.equal(geste.chantier.main_role, 'team');
});
