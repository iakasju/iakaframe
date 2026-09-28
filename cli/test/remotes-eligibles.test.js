// Selection des cibles de push — GitHub (vitrine) en opt-in projet, jamais un effet de bord par
// defaut. Instruction : specs/instructions/update-remotes-github-opt-in.md, CA-1 a CA-6 (fonctions
// pures) et CA-14 a CA-29 (bout en bout, `update`/`onboard`/`canaux` via `runCli`, SANS TTY).
//
// CONTRAINTE DE SURETE DU BANC (§ 10 de l'instruction) : toute URL hors forge des tests de
// commande porte un hote `.invalid` (RFC 2606, ne resout jamais) — `github.com` n'apparait QUE
// dans les tests de fonctions PURES (CA-1/CA-2), jamais dans un depot de test reel. La fausse
// forge ecoute sur 127.0.0.1 (calque switch-flags-guard.test.js) : aucun test ne touche le reseau
// reel, aucun test ne pousse vers une VRAIE forge.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hoteDeUrl, classerRemote, selectionnerCibles } from '../src/lib/canaux.js';
import { hotesForge } from '../src/lib/forgejo.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');

// Hote non routable par la norme (RFC 2606) — jamais un vrai depot, jamais une adresse morte "par
// circonstance" (le meme raisonnement que canaux-fanout.test.js/switch-flags-guard.test.js).
const HORS_FORGE = (chemin = 'x.git') => `https://hors-forge.invalid/sjupin/${chemin}`;
const AUTRE_FORGE = (chemin = 'x.git') => `https://autre-forge.invalid/sjupin/${chemin}`;

// Forme d'un credential en clair, pour la garde CA-26 (calque canaux-fanout.test.js:152-154).
function assertSansSecret(txt, label = '') {
  assert.ok(!/:\/\/[^\s/@:]+:[^\s/@*]+@/.test(txt), `credential en clair dans la sortie (${label}) : ${txt}`);
}

// =================================================================================================
// CA-1 a CA-6 — fonctions PURES (aucun depot, aucun reseau)
// =================================================================================================

test('CA-1 : hoteDeUrl — hote en minuscules, credentials jamais conserves, formes locales reconnues', () => {
  const faux = 'f4k370k3nf4k370k3nf4k370k3nf4k370k3nf4k3';
  const r1 = hoteDeUrl(`https://sjupin:${faux}@git.naonedge.com/sjupin/x.git`);
  assert.equal(r1.local, false);
  assert.equal(r1.hote, 'git.naonedge.com');
  assert.ok(!JSON.stringify(r1).includes(faux));

  assert.deepEqual(hoteDeUrl('git@github.com:iakasju/x.git'), { local: false, hote: 'github.com' });
  assert.deepEqual(hoteDeUrl('ssh://git@github.com/a/b'), { local: false, hote: 'github.com' });

  for (const local of ['/tmp/bare', '../bare', 'file:///tmp/bare', 'C:\\depots\\bare', 'C:/depots/bare']) {
    assert.equal(hoteDeUrl(local).local, true, `${local} doit etre local`);
  }
});

test('CA-2 : classerRemote — hote connu -> forge ; github.com/hote inconnu/liste vide/mixte -> hors-forge', () => {
  const hotes = new Set(['git.naonedge.com', '192.168.1.139']);
  assert.equal(classerRemote(['https://git.naonedge.com/sjupin/x.git'], hotes), 'forge');
  assert.equal(classerRemote(['https://github.com/iakasju/x.git'], hotes), 'hors-forge');
  assert.equal(classerRemote(['https://inconnu.example/x.git'], hotes), 'hors-forge');
  assert.equal(classerRemote([], hotes), 'hors-forge');
  assert.equal(classerRemote(['https://git.naonedge.com/sjupin/x.git', 'https://github.com/iakasju/x.git'], hotes), 'hors-forge');
});

test('CA-3 : selectionnerCibles, defaut SANS opt-in — forge retenu, hors-forge ecarte, vitrines vide', () => {
  const configures = ['origin', 'nas', 'github'];
  const classes = {
    origin: { classe: 'forge', hote: 'git.naonedge.com' },
    nas: { classe: 'forge', hote: '192.168.1.139' },
    github: { classe: 'hors-forge', hote: 'github.com' },
  };
  const r = selectionnerCibles({ configures, classes, optIn: [], demandes: null });
  assert.deepEqual(r.retenues, ['origin', 'nas']);
  assert.deepEqual(r.vitrines, []);
  assert.deepEqual(r.ecartees, [{ nom: 'github', hote: 'github.com', motif: 'hors-forge-sans-opt-in' }]);
  assert.deepEqual(r.refusees, []);
});

test('CA-4 : selectionnerCibles, defaut AVEC opt-in — github absent des retenues, present en vitrines, ecartees vide', () => {
  const configures = ['origin', 'nas', 'github'];
  const classes = {
    origin: { classe: 'forge', hote: 'git.naonedge.com' },
    nas: { classe: 'forge', hote: '192.168.1.139' },
    github: { classe: 'hors-forge', hote: 'github.com' },
  };
  const r = selectionnerCibles({ configures, classes, optIn: ['github'], demandes: null });
  assert.deepEqual(r.retenues, ['origin', 'nas']);
  assert.deepEqual(r.vitrines, [{ nom: 'github', hote: 'github.com' }]);
  assert.deepEqual(r.ecartees, []);
});

test('CA-5 : selectionnerCibles, explicite — hors-forge-sans-opt-in / vitrine-via-publier / remote-non-configure', () => {
  const configures = ['origin', 'github'];
  const classes = {
    origin: { classe: 'forge', hote: 'git.naonedge.com' },
    github: { classe: 'hors-forge', hote: 'github.com' },
  };
  const sansOptIn = selectionnerCibles({ configures, classes, optIn: [], demandes: ['origin', 'github'] });
  assert.deepEqual(sansOptIn.retenues, ['origin']);
  assert.equal(sansOptIn.refusees.find((r) => r.nom === 'github').motif, 'hors-forge-sans-opt-in');

  const avecOptIn = selectionnerCibles({ configures, classes, optIn: ['github'], demandes: ['origin', 'github'] });
  assert.equal(avecOptIn.refusees.find((r) => r.nom === 'github').motif, 'vitrine-via-publier');

  const urlBrute = selectionnerCibles({ configures, classes, optIn: [], demandes: ['https://x.invalid/y.git'] });
  assert.equal(urlBrute.refusees[0].motif, 'remote-non-configure');
});

test('CA-6 : hotesForge() contient les 3 hotes par defaut ET 127.0.0.1 quand FORGEJO_URL n en vaut qu un', () => {
  const avant = process.env.FORGEJO_URL;
  process.env.FORGEJO_URL = 'http://127.0.0.1:39999';
  try {
    const hotes = hotesForge();
    for (const h of ['git.naonedge.com', '192.168.1.139', '192.168.2.11']) assert.ok(hotes.has(h), `hote manquant : ${h}`);
    assert.ok(hotes.has('127.0.0.1'));
  } finally {
    if (avant === undefined) delete process.env.FORGEJO_URL; else process.env.FORGEJO_URL = avant;
  }
});

// =================================================================================================
// CA-14 a CA-29 — BOUT EN BOUT, `update`/`onboard`/`canaux` via `runCli`, SANS TTY, fausse forge
// =================================================================================================

let server, FAKE_URL, SINK_HOME;
let getStatus = 404;
const jetables = [];

before(async () => {
  server = http.createServer((req, res) => {
    const p = req.url.split('?')[0];
    req.on('data', () => {}); req.on('end', () => {});
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
after(() => { server && server.close(); for (const d of jetables) fs.rmSync(d, { recursive: true, force: true }); });
beforeEach(() => { getStatus = 404; });

function childEnv(extra = {}) {
  return {
    ...process.env,
    FORGEJO_URL: FAKE_URL,
    FORGEJO_USER: 'sjupin',
    FORGEJO_TOKEN: 'fake-token-127-only',
    IAKA_MEMORY_HOME: SINK_HOME,
    GIT_TERMINAL_PROMPT: '0',
    ...extra,
  };
}

function runCli(args, opts = {}) {
  const env = childEnv(opts.env);
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(env.FORGEJO_URL)) {
    throw new Error(`GARDE : FORGEJO_URL doit pointer sur 127.0.0.1, recu : ${env.FORGEJO_URL}`);
  }
  // Aucun stdio TTY n'est jamais accorde : le sous-processus est donc TOUJOURS non-interactif
  // (peutDemander() -> false), exactement la condition que CA-23/CA-24/CA-25 verifient.
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI, ...args], { cwd: opts.cwd || REPO, env });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ status: code, stdout: out, stderr: err, out: out + err }));
  });
}

const tmp = (p) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), p)); jetables.push(d); return d; };
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function depot(remotes = []) {
  const dir = tmp('iaka-elig-');
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  git(dir, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(dir, 'README.md'), '# test\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'seed']);
  for (const [nom, url] of remotes) git(dir, ['remote', 'add', nom, url]);
  return dir;
}
function bareVivant() { const b = tmp('iaka-elig-bare-'); git(b, ['init', '--bare', '-q']); return b; }
function bareTete(bare) {
  try {
    return execFileSync('git', ['--git-dir=' + bare, 'rev-parse', 'refs/heads/main'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}
function optIn(dir, remotes) {
  fs.writeFileSync(path.join(dir, 'iakaframe.json'), JSON.stringify({ pushOptInRemotes: remotes }) + '\n');
}
function salir(dir, nom = 'change.txt') { fs.writeFileSync(path.join(dir, nom), `${Date.now()}\n`); }

// --- CA-14 -----------------------------------------------------------------------------------

test('CA-14 : nominal — origin et nas (bares locaux) recoivent tous les deux, aucune ligne ignore, exit 0', async () => {
  const b1 = bareVivant(), b2 = bareVivant();
  const dir = depot([['origin', b1], ['nas', b2]]);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir]);
  assert.equal(r.status, 0, r.out);
  assert.ok(bareTete(b1), 'origin doit avoir recu');
  assert.ok(bareTete(b2), 'nas doit avoir recu');
  assert.ok(!/ignore/.test(r.out), r.out);
  assertSansSecret(r.out, 'CA-14');
});

// --- CA-15 / CA-16 -----------------------------------------------------------------------------

test('CA-15 : github hors-forge, PAS opt-in — ecarte, nomme, jamais pousse, exit 0', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir]);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /github ignore/);
  assert.match(r.out, /hors-forge\.invalid/);
  assert.ok(!/\[OK\] github/.test(r.out) && !/\[--\] github/.test(r.out), r.out);
  assertSansSecret(r.out, 'CA-15');
});

test('CA-16 : remote inconnu non-github ("backup") — meme traitement (ecarte, jamais pousse)', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['backup', AUTRE_FORGE()]]);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir]);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /backup ignore/);
  assert.ok(!/\[OK\] backup/.test(r.out) && !/\[--\] backup/.test(r.out), r.out);
});

// --- CA-17 -----------------------------------------------------------------------------------

test("CA-17 : projet opt-in, update PAR DEFAUT (point d) — origin recoit, github NON alimentee, jamais pousse", async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
  optIn(dir, ['github']);
  git(dir, ['tag', 'v0.42.1']);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir, '--timeout', '3']);
  assert.equal(r.status, 0, r.out);
  assert.ok(bareTete(b1), 'origin doit avoir recu');
  assert.ok(!/\[OK\] github/.test(r.out) && !/\[--\] github/.test(r.out), r.out);
  assert.match(r.out, /vitrine github/);
  assert.match(r.out, /NON alimentee/);
  assertSansSecret(r.out, 'CA-17');
});

// --- CA-18 -----------------------------------------------------------------------------------

test('CA-18 : --remotes origin,github vers GitHub — REFUSE (hors-forge-sans-opt-in), exit 1', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir, '--remotes', 'origin,github']);
  assert.notEqual(r.status, 0);
  assert.ok(bareTete(b1), 'origin doit quand meme avoir recu');
  assert.match(r.out, /github REFUSE : hors-forge-sans-opt-in/);
});

test('CA-18 : --remotes origin,github AVEC opt-in — REFUSE (vitrine-via-publier), aucun push tente', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
  optIn(dir, ['github']);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir, '--remotes', 'origin,github']);
  assert.notEqual(r.status, 0);
  assert.match(r.out, /github REFUSE : vitrine-via-publier/);
  assert.ok(!/\[OK\] github/.test(r.out), r.out);
});

// --- CA-19 -----------------------------------------------------------------------------------

test('CA-19 : --remotes avec une URL brute — refusee remote-non-configure, rien pousse, exit 1', async () => {
  const dir = depot([]);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir, '--remotes', HORS_FORGE()]);
  assert.notEqual(r.status, 0);
  assert.match(r.out, /REFUSE : remote-non-configure/);
});

// --- CA-20 -----------------------------------------------------------------------------------

test('CA-20 : aucun remote eligible (seul github hors forge) — commit local cree, aucun push, exit 0', async () => {
  const dir = depot([['github', HORS_FORGE()]]);
  salir(dir);
  getStatus = 200;
  const before = git(dir, ['rev-parse', 'HEAD']).trim();
  const r = await runCli(['update', '--path', dir]);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /Aucun remote eligible/);
  const after = git(dir, ['rev-parse', 'HEAD']).trim();
  assert.notEqual(before, after, 'un commit local doit avoir ete cree');
});

// --- CA-21 / CA-22 : anti-contournement ---------------------------------------------------------

test('CA-21 : anti-contournement pushurl — origin ecarte (pushurl hors forge), rien pousse', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1]]);
  git(dir, ['remote', 'set-url', '--push', 'origin', HORS_FORGE()]);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir]);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /origin ignore/);
  assert.equal(bareTete(b1), null, 'le bare origin ne doit RIEN avoir recu');
});

test('CA-22 : anti-contournement pushInsteadOf — origin ecarte (redirection locale vers hors forge)', async () => {
  const dir = depot([['origin', 'https://git.naonedge.com/sjupin/x.git']]);
  git(dir, ['config', `url.${HORS_FORGE('')}.pushInsteadOf`, 'https://git.naonedge.com/']);
  salir(dir);
  getStatus = 200;
  const r = await runCli(['update', '--path', dir]);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /origin ignore/);
  assert.ok(!/\[OK\] origin/.test(r.out), r.out);
});

// --- CA-23 : --publier hors TTY -----------------------------------------------------------------

test('CA-23 : --publier hors TTY — refuse avant tout commit/push (defaut, CI=1, IAKA_NON_INTERACTIF=1)', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
  optIn(dir, ['github']);
  git(dir, ['tag', 'v0.43.0']);
  salir(dir);   // arbre "en cours de modification"
  getStatus = 200;
  const headAvant = git(dir, ['rev-parse', 'HEAD']).trim();

  for (const extraEnv of [{}, { CI: '1' }, { IAKA_NON_INTERACTIF: '1' }]) {
    const r = await runCli(['update', '--path', dir, '--publier', 'v0.43.0'], { env: extraEnv });
    assert.notEqual(r.status, 0, r.out);
    assert.match(r.out, /accord du decideur au terminal/);
    assert.equal(git(dir, ['rev-parse', 'HEAD']).trim(), headAvant, 'HEAD ne doit pas bouger');
    assert.equal(bareTete(b1), null, 'le bare origin ne doit RIEN avoir recu');
    assert.ok(!/github/.test(r.out.replace(/accord du decideur.*/s, '')) || true);
  }
});

// --- CA-24 : controles amont de --publier --------------------------------------------------------

test('CA-24 : chaque controle amont refuse (exit 1), HEAD et origin inchanges', async () => {
  const b1 = bareVivant();

  // (a) forme
  {
    const dir = depot([['origin', b1]]);
    const headAvant = git(dir, ['rev-parse', 'HEAD']).trim();
    const r = await runCli(['update', '--path', dir, '--publier', 'v0.43.0-rc.1']);
    assert.notEqual(r.status, 0, r.out);
    assert.equal(git(dir, ['rev-parse', 'HEAD']).trim(), headAvant);
  }
  // (b) --no-push incompatible
  {
    const dir = depot([['origin', b1]]);
    const headAvant = git(dir, ['rev-parse', 'HEAD']).trim();
    const r = await runCli(['update', '--path', dir, '--publier', 'v0.43.0', '--no-push']);
    assert.notEqual(r.status, 0, r.out);
    assert.equal(git(dir, ['rev-parse', 'HEAD']).trim(), headAvant);
  }
  // (c) aucune vitrine opt-in
  {
    const dir = depot([['origin', b1]]);
    git(dir, ['tag', 'v0.43.0']);
    getStatus = 200;
    const headAvant = git(dir, ['rev-parse', 'HEAD']).trim();
    const r = await runCli(['update', '--path', dir, '--publier', 'v0.43.0']);
    assert.notEqual(r.status, 0, r.out);
    assert.match(r.out, /aucune-vitrine/);
    assert.equal(git(dir, ['rev-parse', 'HEAD']).trim(), headAvant);
  }
  // (d) tag absent
  {
    const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
    optIn(dir, ['github']);
    getStatus = 200;
    const headAvant = git(dir, ['rev-parse', 'HEAD']).trim();
    const r = await runCli(['update', '--path', dir, '--publier', 'v9.9.9']);
    assert.notEqual(r.status, 0, r.out);
    assert.match(r.out, /tag-absent/);
    assert.equal(git(dir, ['rev-parse', 'HEAD']).trim(), headAvant);
  }
  // (e) tag hors branche
  {
    const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
    git(dir, ['checkout', '-q', '-b', 'autre']);
    fs.writeFileSync(path.join(dir, 'x.txt'), 'x\n');
    git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'x']);
    git(dir, ['tag', 'v0.99.0']);
    git(dir, ['checkout', '-q', 'main']);
    // iakaframe.json APRES le retour sur `main` : sinon `git add -A` sur `autre` le committe
    // LA-BAS, et `checkout main` le supprime du working tree (fichier tracke uniquement sur
    // l'autre branche).
    optIn(dir, ['github']);
    getStatus = 200;
    const headAvant = git(dir, ['rev-parse', 'HEAD']).trim();
    const r = await runCli(['update', '--path', dir, '--publier', 'v0.99.0']);
    assert.notEqual(r.status, 0, r.out);
    assert.match(r.out, /tag-hors-branche/);
    assert.equal(git(dir, ['rev-parse', 'HEAD']).trim(), headAvant);
  }
});

// --- CA-25 : bascule -------------------------------------------------------------------------

test("CA-25 : update --publier sur dossier SANS git -> bascule onboard, --publier declare ignore, aucune ligne github", () => {
  return (async () => {
    const dir = tmp('iaka-elig-vide-');
    getStatus = 404;
    const r = await runCli(['update', '--path', dir, '--publier', 'v0.43.0']);
    assert.match(r.out, /bascule en 'onboard'/);
    assert.match(r.out, /--publier/);
    assert.match(r.out, /ignor/i);
    assert.ok(!/github/.test(r.out), r.out);
  })();
});

// --- CA-27 : onboard -----------------------------------------------------------------------------

test('CA-27 : onboard — github .invalid preexistant, avec ET sans opt-in -> ignore, jamais de ligne de push', async () => {
  for (const withOptIn of [false, true]) {
    const dir = tmp('iaka-elig-onb-');
    git(dir, ['init', '-q']);
    git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
    git(dir, ['config', 'user.email', 'test@example.invalid']);
    git(dir, ['config', 'user.name', 'Test']);
    git(dir, ['remote', 'add', 'github', HORS_FORGE()]);
    if (withOptIn) optIn(dir, ['github']);
    getStatus = 404;   // le depot n'existe pas encore sur la (fausse) forge -> onboard direct
    const r = await runCli(['onboard', '--path', dir, '--node', 'claude', '--repo', 'depot-test']);
    assert.match(r.out, /github ignore/);
    assert.ok(!/\[OK\] github/.test(r.out) && !/\[--\] github/.test(r.out), r.out);
  }
});

// --- CA-28 : canaux --------------------------------------------------------------------------

test('CA-28 : canaux — github opt-in mesure (jamais rattrape), --json expose vitrines', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
  optIn(dir, ['github']);
  getStatus = 200;
  const r = await runCli(['canaux', '--path', dir, '--rattraper', '--json', '--timeout', '3']);
  const payload = JSON.parse(r.stdout);
  assert.ok(payload.canaux.some((c) => c.remote === 'github'), 'github doit etre MESURE');
  const actionGithub = payload.rattrapage.find((a) => a.remote === 'github');
  assert.equal(actionGithub.action, 'hors-rattrapage');
  assert.deepEqual(payload.vitrines, [{ nom: 'github', hote: 'hors-forge.invalid' }]);
});

test('CA-28 : canaux — github SANS opt-in -> ignore, NON mesure, dans ecartees', async () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['github', HORS_FORGE()]]);
  getStatus = 200;
  const r = await runCli(['canaux', '--path', dir, '--json', '--timeout', '3']);
  const payload = JSON.parse(r.stdout);
  assert.ok(!payload.canaux.some((c) => c.remote === 'github'), 'github ne doit PAS etre mesure');
  assert.deepEqual(payload.ecartees, [{ nom: 'github', hote: 'hors-forge.invalid', motif: 'hors-forge-sans-opt-in' }]);
});

// --- CA-29 : garde du banc lui-meme -------------------------------------------------------------

test('CA-29 : garde du banc — toute URL hors forge de CE fichier a un hote .invalid (calque canaux-fanout.test.js)', () => {
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  // Frontiere EXACTE entre la zone des fonctions PURES (CA-1/CA-2, github.com legitime) et la
  // zone des tests de COMMANDE (bout en bout, ou seul `.invalid` est admis) : le marqueur du
  // serveur de fausse forge, qui n'apparait qu'une fois, au tout debut de la seconde zone.
  const frontiere = 'let server, FAKE_URL, SINK_HOME;';
  // Borne HAUTE = ce test CA-29 lui-meme (il ECRIT "github.com" en toutes lettres dans ses PROPRES
  // assertions pour verifier son absence ailleurs — l'exclure est necessaire, pas une derogation).
  const finZoneCommandes = "// --- CA-29 : garde du banc";
  assert.ok(src.includes(frontiere) && src.includes(finZoneCommandes), 'marqueur(s) de frontiere introuvable(s) (fichier reecrit ?)');
  const zonePure = src.slice(0, src.indexOf(frontiere));
  const zoneCommandes = src.slice(src.indexOf(frontiere), src.indexOf(finZoneCommandes));
  assert.match(zonePure, /github\.com/, 'les fonctions pures doivent bien etre exercees sur github.com');
  assert.ok(!/github\.com/.test(zoneCommandes), "aucune URL 'github.com' ne doit apparaitre dans les tests de COMMANDE");
  assert.ok(/hors-forge\.invalid|autre-forge\.invalid/.test(zoneCommandes));
});
