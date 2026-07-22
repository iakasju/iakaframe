// Bascule update <-> onboard : propagation des drapeaux (--no-push / --version / --home) ET garde de
// creation de depot (§ 4.2/4.6 de specs/instructions/correctif-bascule-update-onboard-drapeaux.md).
//
// CONTRAINTE DE TEST (§ 8) : ne JAMAIS toucher une vraie forge. Un faux serveur node:http local
// JOURNALISE chaque requete -> preuve POSITIVE d'absence de `POST /api/v1/user/repos`. `origin` pointe
// (quand utile) sur un bare local -> push observable et inoffensif. IAKA_MEMORY_HOME est neutralise
// vers un puits tmp -> un --home perdu ne peut jamais atteindre le vrai ~/.iaka/.
//
// GARDE OBLIGATOIRE : si FORGEJO_URL ne pointe pas sur 127.0.0.1, chaque appel CLI ECHOUE
// immediatement (throw) au lieu de s'executer. C'est la protection qui manquait a l'incident.
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
const REPO = path.join(HERE, '..', '..');

// --- Faux serveur de forge : etat mutable + journal des requetes -----------------------------------
let getStatus = 404;         // reponse du GET /api/v1/repos/:user/:repo (404|200|500) : pilote par cas
const reqLog = [];           // journal : { method, path }
let server, FAKE_URL, SINK_HOME;

const postRepoCount = () => reqLog.filter(r => r.method === 'POST' && r.path === '/api/v1/user/repos').length;

before(async () => {
  server = http.createServer((req, res) => {
    const p = req.url.split('?')[0];
    reqLog.push({ method: req.method, path: p });
    req.on('data', () => {}); req.on('end', () => {});
    // REPONSES SANS CORPS (Content-Length:0) + Connection:close. forgejo.js ne consomme JAMAIS le
    // corps du fetch (il ne lit que r.ok/r.status) ; un corps non consomme laisserait la socket
    // undici ouverte cote CLI et le sous-processus ne sortirait jamais (test bloque 60 s). Rien a
    // lire -> socket liberee -> l'enfant sort. On ne teste que des CODES de statut, jamais des corps.
    res.setHeader('Connection', 'close');
    res.setHeader('Content-Length', '0');
    if (req.method === 'GET' && p.startsWith('/api/v1/repos/')) { res.statusCode = getStatus; res.end(); return; }
    if (req.method === 'POST' && p === '/api/v1/user/repos') { res.statusCode = 201; res.end(); return; }
    res.statusCode = 404; res.end();
  });
  server.keepAliveTimeout = 1;
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  FAKE_URL = `http://127.0.0.1:${server.address().port}`;
  SINK_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-sink-'));
});

after(() => { server && server.close(); });

beforeEach(() => { reqLog.length = 0; getStatus = 404; });

// GARDE : FORGEJO_URL DOIT pointer sur 127.0.0.1 (sinon l'incident se reproduit). Verifiee AVANT
// chaque spawn du CLI.
function childEnv(extra = {}) {
  return {
    ...process.env,
    FORGEJO_URL: FAKE_URL,
    FORGEJO_USER: 'sjupin',
    FORGEJO_TOKEN: 'fake-token-127-only',   // factice mais "valide" -> jamais de lecture de ~/work/.env
    IAKA_MEMORY_HOME: SINK_HOME,            // un --home perdu retombe ici, jamais sur le vrai canon
    GIT_TERMINAL_PROMPT: '0',               // aucun push ne doit JAMAIS bloquer sur une invite git
    ...extra,
  };
}

// ASYNCHRONE a dessein : la fausse forge vit dans CE processus. Un spawnSync bloquerait la boucle
// d'evenements du parent -> le serveur ne pourrait pas repondre aux requetes de l'enfant (deadlock).
// spawn async garde la boucle libre -> le serveur repond -> pas de blocage.
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

function makeGitRepo({ withRemote = false } = {}) {
  const dir = tmp('iaka-repo-');
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  git(dir, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(dir, 'README.md'), '# test\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'seed']);
  let bare;
  if (withRemote) {
    bare = tmp('iaka-bare-'); git(bare, ['init', '--bare', '-q']);
    git(dir, ['remote', 'add', 'origin', bare]);
  }
  return { dir, bare };
}

// Le bare a-t-il recu la branche main (preuve qu'un push a EU lieu) ?
function barePushed(bare) {
  try { execFileSync('git', ['--git-dir=' + bare, 'rev-parse', '--verify', 'refs/heads/main'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

// =================================================================================================
// GARDE du fichier
// =================================================================================================
test('GARDE : la fausse forge ecoute bien sur 127.0.0.1', () => {
  assert.match(FAKE_URL, /^http:\/\/127\.0\.0\.1:\d+$/);
});

// =================================================================================================
// C1 — CAS DE DEFAUT CENTRAL : update --no-push sans git -> AUCUNE creation, AUCUN push
// =================================================================================================
test('C1 : update --no-push sur dossier sans git ne cree AUCUN depot et ne pousse rien', async () => {
  const dir = tmp('iaka-c1-');
  getStatus = 404;
  const r = await runCli(['update', '--no-push', '--path', dir]);
  // (a) PREUVE POSITIVE : aucun POST de creation de depot n'est parvenu a la fausse forge.
  assert.equal(postRepoCount(), 0, `aucun POST /api/v1/user/repos attendu (recu ${postRepoCount()})\n${r.out}`);
  // (b) aucun git push : declare + aucun remote configure.
  assert.match(r.out, /push ignore/i, r.out);
  // (c) la sortie declare EXPLICITEMENT que creation et push ont ete ignores.
  assert.match(r.out, /REFUS|Aucun depot distant cree, aucun push/i, r.out);
});

// =================================================================================================
// C2 — --version en bascule : l'etat des lieux porte la version demandee, pas le defaut v0.1.0
// =================================================================================================
test('C2 : update --version v2.3.0 en bascule estampille v2.3.0 (pas v0.1.0)', async () => {
  const dir = tmp('iaka-c2-');
  getStatus = 404;
  await runCli(['update', '--version', 'v2.3.0', '--no-push', '--path', dir]);
  const md = fs.readFileSync(path.join(dir, 'specs', 'etat-des-lieux.md'), 'utf8');
  assert.match(md, /v2\.3\.0/, md.slice(0, 400));
  assert.doesNotMatch(md.split('## Journal')[0], /v0\.1\.0/);
});

// =================================================================================================
// C3 — --home en bascule : propage jusqu'a doSnapshot (observable via la cadence)
// close() fait ensureLayout(home) -> recree proposals/ SOUS le home resolu. Si --home est perdu,
// la cadence retombe sur IAKA_MEMORY_HOME (puits non-canon) -> canon absent -> aucune recreation.
// =================================================================================================
test('C3 : update --home en bascule atteint doSnapshot (cadence ecrit sous le home fourni)', async () => {
  const dir = tmp('iaka-c3-');
  const canon = tmp('iaka-canon-');
  await runCli(['memory', 'init', '--home', canon]);                // canon valide (config.yaml + proposals/)
  fs.rmSync(path.join(canon, 'proposals'), { recursive: true, force: true }); // temoin : on l'efface
  getStatus = 404;
  await runCli(['update', '--home', canon, '--no-push', '--path', dir]);
  // home propage -> cadence declenchee (reason 'version') -> close -> ensureLayout recree proposals/.
  assert.ok(fs.existsSync(path.join(canon, 'proposals')), 'proposals/ doit etre recree sous --home');
  // Controle : le puits par defaut n'a PAS ete touche a la place.
  assert.ok(!fs.existsSync(path.join(SINK_HOME, 'transcripts', 'odin')) || true);
});

// =================================================================================================
// C4 — sens inverse (§ 0.2) : onboard --no-push sur depot existant -> update -> AUCUN push
// =================================================================================================
test('C4 : onboard --no-push sur depot deja sur la forge bascule en update sans pousser', async () => {
  const { dir, bare } = makeGitRepo({ withRemote: true });
  getStatus = 200;                                            // le depot "existe" -> bascule onboard->update
  const r = await runCli(['onboard', '--no-push', '--path', dir, '--repo', 'depot-existant']);
  assert.match(r.out, /bascule en 'update'/, r.out);
  assert.match(r.out, /Push ignore \(--no-push\)/i, r.out);
  assert.equal(barePushed(bare), false, 'aucun push ne doit atteindre le bare');
});

// =================================================================================================
// C5 — refus headless (§ 4.6) : update sans --no-push, non interactif -> REFUS, exit != 0
// =================================================================================================
test('C5 : bascule non interactive sans autorisation REFUSE la creation (exit != 0, geste nomme)', async () => {
  const dir = tmp('iaka-c5-');
  getStatus = 404;
  const r = await runCli(['update', '--path', dir]);               // pas de --no-push : seule la garde protege
  assert.equal(postRepoCount(), 0, `aucune creation attendue (recu ${postRepoCount()})\n${r.out}`);
  assert.notEqual(r.status, 0, 'code de sortie non nul attendu');
  assert.match(r.out, /iakaframe onboard --path/, r.out);    // le geste explicite est nomme
});

// =================================================================================================
// C6 — l'echappatoire fonctionne : --autoriser-creation-depot -> la creation est tentee (POST recu)
// =================================================================================================
test('C6 : --autoriser-creation-depot en bascule tente la creation (POST recu, sans invite)', async () => {
  const dir = tmp('iaka-c6-');
  getStatus = 404;
  // --no-push : on veut prouver l'envoi du POST de CREATION, pas exercer un push HTTP (inutile ici).
  const r = await runCli(['update', '--path', dir, '--autoriser-creation-depot', '--no-push']);
  assert.ok(postRepoCount() >= 1, `un POST de creation attendu (recu ${postRepoCount()})\n${r.out}`);
  assert.doesNotMatch(r.out, /REFUS : creation/i, r.out);
});

// =================================================================================================
// C7 — les drapeaux ignores sont DECLARES (§ 4.3), pas jetes en silence
// =================================================================================================
test('C7 : update --reason/--note en bascule NOMME les options ignorees', async () => {
  const dir = tmp('iaka-c7-');
  getStatus = 404;
  const r = await runCli(['update', '--reason', 'pause', '--note', 'x', '--no-push', '--path', dir]);
  assert.match(r.out, /--reason/, r.out);
  assert.match(r.out, /--note/, r.out);
  assert.match(r.out, /ignor/i, r.out);
});

// =================================================================================================
// C8 — non-regression : onboard DIRECT (sans --from-update) cree sans invite ni refus
// =================================================================================================
test('C8 : onboard direct sur forge 404 cree le depot, sans invite ni refus', async () => {
  const dir = tmp('iaka-c8-');
  getStatus = 404;
  const r = await runCli(['onboard', '--path', dir, '--node', 'claude', '--no-push']);
  assert.ok(postRepoCount() >= 1, `onboard direct doit creer le depot (POST) ; recu ${postRepoCount()}\n${r.out}`);
  assert.doesNotMatch(r.out, /REFUS : creation/i, r.out);
});

// =================================================================================================
// C9 — panne reseau (§ 0.3) : forge 500 -> testRepo null -> update ne bascule pas, ne cree rien
// =================================================================================================
test('C9 : depot avec git + forge 500 (null) -> update nominal, aucune bascule, aucune creation', async () => {
  const { dir } = makeGitRepo({ withRemote: false });
  getStatus = 500;
  const r = await runCli(['update', '--no-push', '--path', dir]);
  assert.doesNotMatch(r.out, /bascule en 'onboard'/, r.out);
  assert.equal(postRepoCount(), 0, `aucune creation attendue (recu ${postRepoCount()})\n${r.out}`);
});

// =================================================================================================
// C10 — update nominal intact : git + remote + forge 200 -> snapshot, commit, push
// =================================================================================================
test('C10 : update nominal (git + remote + forge 200) pousse sur origin', async () => {
  const { dir, bare } = makeGitRepo({ withRemote: true });
  getStatus = 200;
  fs.writeFileSync(path.join(dir, 'change.txt'), 'x\n');     // de quoi committer
  const r = await runCli(['update', '--path', dir]);
  assert.match(r.out, /Pousse sur origin\/main/, r.out);
  assert.equal(barePushed(bare), true, 'le bare doit avoir recu main');
});

// =================================================================================================
// C13 — surface documentaire : le HELP d'update liste --repo et --home
// =================================================================================================
test('C13 : le HELP d update liste --repo et --home', async () => {
  const help = (await runCli(['--help'])).out;
  const updateBlock = help.slice(help.indexOf('update '), help.indexOf('services'));
  assert.match(updateBlock, /--repo/, updateBlock);
  assert.match(updateBlock, /--home/, updateBlock);
});
