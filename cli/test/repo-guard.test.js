// Verbe `iakaframe repo` : garde --create (surete cb2a9b9) + frontiere d'agnosticisme (--provider).
//
// CONTRAINTE DE TEST (non negociable) : ne JAMAIS toucher une vraie forge. Un faux serveur node:http
// local JOURNALISE chaque requete -> preuve POSITIVE d'absence de `POST /api/v1/user/repos`. `origin`
// est branche sur l'URL de CETTE fausse forge (127.0.0.1) -> observable et inoffensif.
//
// GARDE OBLIGATOIRE : si FORGEJO_URL ne pointe pas sur 127.0.0.1, chaque appel CLI ECHOUE
// immediatement (throw) au lieu de s'executer. C'est la protection qui manquait a l'incident du
// 2026-07-21 (4 depots parasites crees).
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const INDEX_SRC = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');

// --- Faux serveur de forge : etat mutable + journal des requetes -----------------------------------
let getStatus = 404;         // reponse du GET /api/v1/repos/:user/:repo (404|200|500), pilote par cas
let postStatus = 201;        // reponse du POST /api/v1/user/repos (201 cree | 409 exists)
const reqLog = [];           // journal : { method, path }
let server, FAKE_URL;

const postRepoCount = () => reqLog.filter(r => r.method === 'POST' && r.path === '/api/v1/user/repos').length;

before(async () => {
  server = http.createServer((req, res) => {
    const p = req.url.split('?')[0];
    reqLog.push({ method: req.method, path: p });
    req.on('data', () => {}); req.on('end', () => {});
    // REPONSES SANS CORPS (Content-Length:0) + Connection:close : forgejo.js ne lit que r.ok/r.status ;
    // un corps non consomme laisserait la socket undici ouverte cote CLI -> l'enfant ne sortirait pas.
    res.setHeader('Connection', 'close');
    res.setHeader('Content-Length', '0');
    if (req.method === 'GET' && p.startsWith('/api/v1/repos/')) { res.statusCode = getStatus; res.end(); return; }
    if (req.method === 'POST' && p === '/api/v1/user/repos') { res.statusCode = postStatus; res.end(); return; }
    res.statusCode = 404; res.end();
  });
  server.keepAliveTimeout = 1;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  FAKE_URL = `http://127.0.0.1:${server.address().port}`;
});

after(() => { server && server.close(); });

beforeEach(() => { reqLog.length = 0; getStatus = 404; postStatus = 201; });

// GARDE : FORGEJO_URL DOIT pointer sur 127.0.0.1. Verifiee AVANT chaque spawn du CLI.
function childEnv(extra = {}) {
  return {
    ...process.env,
    FORGEJO_URL: FAKE_URL,
    FORGEJO_USER: 'sjupin',
    FORGEJO_TOKEN: 'fake-token-127-only',   // factice mais "valide" -> jamais de lecture de ~/work/.env
    GIT_TERMINAL_PROMPT: '0',               // aucun git ne doit JAMAIS bloquer sur une invite
    ...extra,
  };
}

// ASYNCHRONE a dessein : la fausse forge vit dans CE processus. Un spawnSync bloquerait la boucle
// d'evenements du parent -> deadlock. spawn async garde la boucle libre -> le serveur repond.
function runCli(args, opts = {}) {
  const env = childEnv(opts.env);
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(env.FORGEJO_URL)) {
    throw new Error(`GARDE : FORGEJO_URL doit pointer sur 127.0.0.1, recu : ${env.FORGEJO_URL}`);
  }
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI, ...args], { cwd: opts.cwd || REPO, env });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ status: code, stdout: out, stderr: err, out: out + err }));
  });
}

// --- Fabriques de repertoires ----------------------------------------------------------------------
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

function makeGitRepo() {
  const dir = tmp('iaka-repo-');
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  git(dir, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(dir, 'README.md'), '# test\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'seed']);
  return dir;
}

// L'origine configuree (chaine vide si aucune).
function originUrl(dir) {
  try { return execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: dir, encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

// =================================================================================================
// GARDE du fichier
// =================================================================================================
test('GARDE : la fausse forge ecoute bien sur 127.0.0.1', () => {
  assert.match(FAKE_URL, /^http:\/\/127\.0\.0\.1:\d+$/);
});

// =================================================================================================
// F1 — CAS DE DEFAUT CENTRAL : repo <name> SANS --create, forge 404 -> AUCUN POST, exit != 0
//      Ce test DOIT echouer si la garde --create est retiree.
// =================================================================================================
test('F1 : repo <name> sans --create sur forge 404 ne cree AUCUN depot et refuse (exit != 0, nomme --create)', async () => {
  const dir = makeGitRepo();
  getStatus = 404;
  const r = await runCli(['repo', 'projet-absent', '--path', dir]);
  // (a) PREUVE POSITIVE : aucun POST de creation n'est parvenu a la fausse forge.
  assert.equal(postRepoCount(), 0, `aucun POST /api/v1/user/repos attendu (recu ${postRepoCount()})\n${r.out}`);
  // (b) code de sortie non nul.
  assert.notEqual(r.status, 0, `exit != 0 attendu\n${r.out}`);
  // (c) la sortie nomme le geste explicite --create.
  assert.match(r.out, /--create/, r.out);
  // (d) aucun remote n'a ete configure (le depot n'existe pas, on n'invente rien).
  assert.equal(originUrl(dir), '', 'aucun remote origin attendu');
});

// =================================================================================================
// F5 — --path n'est pas un depot git -> REFUS vers onboard, aucun POST
// =================================================================================================
test('F5 : repo sur un dossier sans .git refuse vers onboard, sans aucun POST', async () => {
  const dir = tmp('iaka-nogit-');
  getStatus = 404;
  const r = await runCli(['repo', 'x', '--path', dir]);
  assert.equal(postRepoCount(), 0, `aucun POST attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /iakaframe onboard/, r.out);
});

// =================================================================================================
// F6 — etat inconnu : forge 500 (testRepo null), sans --create -> REFUS, aucun POST, aucun remote
// =================================================================================================
test('F6 : repo sans --create sur forge 500 (etat inconnu) refuse, aucun POST, aucun remote', async () => {
  const dir = makeGitRepo();
  getStatus = 500;
  const r = await runCli(['repo', 'projet-inconnu', '--path', dir]);
  assert.equal(postRepoCount(), 0, `aucun POST attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /inconnu/i, r.out);
  assert.equal(originUrl(dir), '', 'aucun remote origin attendu');
});

// =================================================================================================
// F2 — branchement non-destructif : forge 200, depot git present -> origin configure, AUCUN POST
// =================================================================================================
test('F2 : repo <name> sur forge 200 configure origin sans aucun POST (exit 0)', async () => {
  const dir = makeGitRepo();
  getStatus = 200;
  const r = await runCli(['repo', 'depot-existant', '--path', dir]);
  assert.equal(r.status, 0, `exit 0 attendu\n${r.out}`);
  assert.equal(postRepoCount(), 0, `aucun POST attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.match(originUrl(dir), /127\.0\.0\.1:\d+\/sjupin\/depot-existant\.git$/, originUrl(dir));
});

// =================================================================================================
// F3 — creation explicite : forge 404 + --create -> un POST recu, remote configure, exit 0, pas de refus
// =================================================================================================
test('F3 : repo <name> --create sur forge 404 cree (POST recu), configure origin, sans refus', async () => {
  const dir = makeGitRepo();
  getStatus = 404; postStatus = 201;
  const r = await runCli(['repo', 'depot-neuf', '--path', dir, '--create']);
  assert.equal(r.status, 0, `exit 0 attendu\n${r.out}`);
  assert.ok(postRepoCount() >= 1, `un POST de creation attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.doesNotMatch(r.out, /REFUS/i, r.out);
  assert.match(originUrl(dir), /\/sjupin\/depot-neuf\.git$/, originUrl(dir));
});

// =================================================================================================
// F4 — creation idempotente : --create + POST 409 (-> 'exists') -> rapporte "existe deja", remote OK
// =================================================================================================
test('F4 : repo --create quand la creation repond 409 rapporte existe deja et configure le remote', async () => {
  const dir = makeGitRepo();
  getStatus = 404; postStatus = 409;
  const r = await runCli(['repo', 'depot-409', '--path', dir, '--create']);
  assert.equal(r.status, 0, `exit 0 attendu\n${r.out}`);
  assert.ok(postRepoCount() >= 1, `un POST attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.match(r.out, /existe deja|409/i, r.out);
  assert.match(originUrl(dir), /\/sjupin\/depot-409\.git$/, originUrl(dir));
});

// =================================================================================================
// F7 — --create explicite passe en HEADLESS (non interactif) : cree sans invite ni refus. Pendant de F1.
// =================================================================================================
test('F7 : repo <name> --create non interactif cree (POST recu), sans invite ni refus', async () => {
  const dir = makeGitRepo();
  getStatus = 404; postStatus = 201;
  const r = await runCli(['repo', 'depot-headless', '--path', dir, '--create']);
  assert.ok(postRepoCount() >= 1, `POST attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.doesNotMatch(r.out, /REFUS/i, r.out);
  assert.doesNotMatch(r.out, /\[o\/N\]/i, r.out); // aucune invite interactive
});

// =================================================================================================
// F8 — provider par defaut : sans --provider, l'adaptateur forgejo est appele (GET observe)
// =================================================================================================
test('F8 : repo <name> sans --provider se comporte comme --provider forgejo (adaptateur appele)', async () => {
  const dir = makeGitRepo();
  getStatus = 200;
  await runCli(['repo', 'depot-defaut', '--path', dir]);
  // L'adaptateur forgejo a bien teste l'existence : un GET /api/v1/repos/sjupin/depot-defaut est passe.
  const gets = reqLog.filter(x => x.method === 'GET' && x.path === '/api/v1/repos/sjupin/depot-defaut');
  assert.ok(gets.length >= 1, `le GET forgejo est attendu (defaut) ; journal : ${JSON.stringify(reqLog)}`);
});

// =================================================================================================
// F9 — point d'extension non hacke : --provider gitlab (non enregistre) -> erreur nette, aucun POST
// =================================================================================================
test('F9 : repo --provider gitlab (inconnu) refuse proprement, sans crash, sans aucun POST', async () => {
  const dir = makeGitRepo();
  getStatus = 404;
  const r = await runCli(['repo', 'x', '--path', dir, '--provider', 'gitlab']);
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /fournisseur inconnu/i, r.out);
  assert.match(r.out, /gitlab/, r.out);
  assert.match(r.out, /forgejo/, r.out);            // les disponibles sont nommes
  assert.equal(postRepoCount(), 0, `aucun POST attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.doesNotMatch(r.out, /throw|TypeError|undefined is not/i, r.out); // pas un crash non gere
});

// =================================================================================================
// F10 — pas de case 'forgejo' au dispatch : le verbe est AGNOSTIQUE (verif de revue sur la source)
// =================================================================================================
test("F10 : le dispatch index.js ne contient AUCUN case 'forgejo' et route bien case 'repo'", () => {
  const src = fs.readFileSync(INDEX_SRC, 'utf8');
  assert.doesNotMatch(src, /case\s+'forgejo'/, "aucun case 'forgejo' ne doit exister au dispatch");
  assert.match(src, /case\s+'repo'/, "le verbe agnostique 'repo' doit etre route");
});

// =================================================================================================
// F11 — surface documentaire : le HELP liste repo, --provider (defaut forgejo) et --create
// =================================================================================================
test('F11 : le HELP liste le verbe repo, --provider (defaut forgejo) et --create', async () => {
  const help = (await runCli(['--help'])).out;
  const block = help.slice(help.indexOf('repo '), help.indexOf('services'));
  assert.match(block, /--provider/, block);
  assert.match(block, /forgejo/, block);
  assert.match(block, /--create/, block);
});
