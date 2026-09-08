// Garde anti-derive « C-JSON » (instruction cli-api-surface-harmonisation.md, criteres § 7).
// Deux volets :
//  (1) VERROU STATIQUE : aucune commande n'imprime un JSON en direct — toute sortie machine passe
//      par lib/output.js (interdit `console.log(JSON.stringify(` / `console.error(JSON.stringify(`
//      hors output.js). C'est le point unique qui empeche la re-divergence des formes de sortie.
//  (2) CONTRAT DE SORTIE : on balaie le parc de commandes a `--json` et on exige, sur un cas nominal,
//      une ENVELOPPE OBJET avec ok:true (jamais de tableau/scalaire nu), un `count` egal a la
//      longueur sur les collections, et sur les cas d'erreur { ok:false, error } sur STDOUT, exit 1,
//      RIEN sur stderr.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureLayout } from '../src/lib/memory.js';
import { close } from '../src/lib/close.js';
import { listProposals } from '../src/lib/review.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');           // vraie bibliotheque du depot
const CMD_DIR = path.join(HERE, '..', 'src', 'commands');

function cli(args, extraEnv = {}) {
  const r = spawnSync('node', [CLI, ...args], { cwd: REPO, encoding: 'utf8', env: { ...process.env, ...extraEnv } });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

// --- (1) VERROU STATIQUE ---------------------------------------------------------------------------

test('anti-derive : aucun console.log/error(JSON.stringify( hors lib/output.js dans commands/', () => {
  const forbidden = /console\.(log|error)\(\s*JSON\.stringify/;
  const offenders = [];
  for (const f of fs.readdirSync(CMD_DIR)) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(CMD_DIR, f), 'utf8');
    if (forbidden.test(src)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `sorties JSON en direct (doivent passer par lib/output.js) : ${offenders.join(', ')}`);
});

test('lib/output.js existe et exporte emit/ok/collection/fail', async () => {
  const mod = await import('../src/lib/output.js');
  for (const name of ['emit', 'ok', 'collection', 'fail', 'printJson']) {
    assert.equal(typeof mod[name], 'function', `export manquant : ${name}`);
  }
});

// --- (2) CONTRAT DE SORTIE : balayage nominal ------------------------------------------------------

const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-home-'));
const OBS = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-obs-'));
const EMPTY = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-empty-'));
const PROJ = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-proj-'));

// Depot git minimal + UNE cible locale : de quoi exercer `canaux --json` sans reseau (le verbe
// est le chemin RESEAU du CLI ; sa conformite C-JSON, elle, se verifie hors reseau).
const GITD = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-git-'));
const BARE = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-bare-'));
{
  const g = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
  g(BARE, ['init', '--bare', '-q']);
  g(GITD, ['init', '-q']); g(GITD, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  g(GITD, ['config', 'user.email', 't@e.invalid']); g(GITD, ['config', 'user.name', 'T']);
  fs.writeFileSync(path.join(GITD, 'a.txt'), 'a');
  g(GITD, ['add', '-A']); g(GITD, ['commit', '-q', '-m', 'seed']);
  g(GITD, ['remote', 'add', 'origin', BARE]); g(GITD, ['push', '-q', 'origin', 'main']);
}

// Dedies au verbe `install` (contrat-machine-du-verbe-install.md, AR-M2(a)) : reservoir vivant =
// le DEPOT REEL lui-meme (--root REPO), reseau TOUJOURS injoignable (double, meme garde que
// install-verbe.test.js) -> chemin DETERMINISTE "deja a jour" (etape 1 sautee, aucune confirmation
// requise), etapes 3/4 en dry-run decrivent sans exiger de reseau exploitable.
const INSTALL_CLAUDE = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-install-claude-'));
const INSTALL_APPS = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-install-apps-'));
const INSTALL_BACKUPS = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-install-backups-'));
const INSTALL_ENV = { IAKAFRAME_INSTALL_TEST_DOUBLE: '1' };

// Canon jetable dedie a `review show` (lecteur J1, C-JSON-COUVERTURE-COMPLETE) : une proposition
// deposee par le pipeline REEL (`close`), jamais une frontmatter ecrite a la main — meme patron que
// cli/test/review.test.js:tmpCanonWithProposals. Le sous-verbe ne peut pas se mesurer sans au moins
// UNE proposition en attente ; on la fabrique une fois, ici, pour tout le fichier.
const REVIEW_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-review-'));
ensureLayout(REVIEW_HOME);
fs.mkdirSync(path.join(REVIEW_HOME, 'transcripts'), { recursive: true });
fs.writeFileSync(
  path.join(REVIEW_HOME, 'transcripts', 'seed.md'),
  '@correction(registre) c-json :: la garde de sortie machine se mesure en execution\n'
  + '@correction(registre) c-json :: la garde de sortie machine se mesure en execution\n',
);
close(REVIEW_HOME, { now: new Date('2026-09-08T00:00:00Z') });
const REVIEW_PROPOSAL_ID = listProposals(REVIEW_HOME)[0]?.id;

// (nom, args, cle de collection attendue | null pour une ressource/rapport a plat, env supplementaire)
const NOMINAL = [
  ['list', ['list', '--json'], 'collections'],
  ['list <type>', ['list', 'personas', '--json'], 'items'],
  ['portfolio', ['portfolio', '--json', '--root', EMPTY], 'projects'],
  ['assemble', ['assemble', 'iakaframe', 'iakaframe-8', '--json'], null],
  ['agents list', ['agents', 'list', '--json'], 'personas'],
  ['agents status', ['agents', 'status', '--json', '--project', PROJ], 'personas'],
  ['config', ['config', '--json', '--path', PROJ], null],
  ['show', ['show', 'gandalf', '--json'], null],
  ['memory init', ['memory', 'init', '--json', '--home', HOME], 'created'],
  ['memory path', ['memory', 'path', '--json', '--home', HOME], null],
  ['memory config', ['memory', 'config', '--json', '--home', HOME], null],
  ['memory list', ['memory', 'list', 'profil', '--json', '--home', HOME], 'entries'],
  ['open', ['open', '--json', '--home', HOME], null],
  ['recall', ['recall', 'requete-absente', '--json', '--home', HOME], 'results'],
  ['observe list', ['observe', 'list', '--json', '--home', OBS], 'files'],
  ['review list', ['review', 'list', '--json', '--home', HOME], 'proposals'],
  ['close', ['close', '--json', '--home', HOME], null],
  ['services', ['services', '--json', '--hosts', '127.0.0.1', '--timeout', '1'], 'services'],
  ['canaux', ['canaux', '--json', '--path', GITD, '--timeout', '5'], 'canaux'],
  [
    'install',
    ['install', '--dry-run', '--json', '--yes', '--root', REPO, '--target-claude', INSTALL_CLAUDE, '--apps-dir', INSTALL_APPS, '--backup-dir', INSTALL_BACKUPS],
    'evenements',
    INSTALL_ENV,
  ],
  // --- J1 (C-JSON-COUVERTURE-COMPLETE) : les 9 lecteurs purs, grain SOUS-VERBE (AR-J1(b)) ---------
  ['commands', ['commands', '--json'], 'verbes'],
  // endpoints : hote injoignable en 127.0.0.1:1 + --timeout court (AR-J2(b) precision d'execution,
  // meme patron que `services --hosts 127.0.0.1` ci-dessus) — la SONDE echoue, le RAPPORT reste ok:true.
  ['endpoints', ['endpoints', '--json', '--url', 'http://127.0.0.1:1/x', '--timeout', '1'], 'essais'],
  // frame verify : rapport a plat { ok, checked, findings } — PAS de cle `count` frere de `findings`
  // (constate a l'etape 0, hors perimetre de ce lot, cf. rapport de remise) : collKey volontairement null.
  ['frame verify', ['frame', 'verify', '--json'], null],
  ['frame lint --all', ['frame', 'lint', '--all', '--json'], 'findings'],
  ['review show', ['review', 'show', REVIEW_PROPOSAL_ID, '--json', '--home', REVIEW_HOME], null],
  ['produit path', ['produit', 'path', '--json', '--project', PROJ], null],
  ['produit config', ['produit', 'config', '--json', '--project', PROJ], null],
  ['produit list', ['produit', 'list', '--json', '--project', PROJ], 'entries'],
];

for (const [name, args, collKey, extraEnv] of NOMINAL) {
  test(`C-JSON nominal : ${name} -> objet { ok:true } (jamais un tableau/scalaire nu)`, () => {
    const { stdout } = cli(args, extraEnv || {});
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(stdout); }, `stdout non JSON : ${stdout.slice(0, 120)}`);
    assert.equal(typeof obj, 'object');
    assert.ok(obj !== null && !Array.isArray(obj), 'racine = objet, jamais un tableau nu');
    assert.equal(obj.ok, true, 'ok:true attendu en succes');
    if (collKey) {
      assert.ok(Array.isArray(obj[collKey]), `collection attendue sous la cle « ${collKey} »`);
      assert.equal(obj.count, obj[collKey].length, 'count = longueur exacte de la collection');
    }
  });
}

// --- (2bis) CONTRAT DE SORTIE : discipline d'erreur machine (regle 4) -----------------------------

const ERRORS = [
  ['list <type inconnu>', ['list', 'zzz', '--json']],
  ['show <inexistant>', ['show', 'zzznope', '--json']],
  ['assemble <inconnus>', ['assemble', 'nope', 'nope', '--json']],
  ['memory list sans cible', ['memory', 'list', '--json', '--home', HOME]],
  ['canaux hors depot git', ['canaux', '--json', '--path', EMPTY]],
  ['install <combinaison incoherente>', ['install', '--json', '--events', '--root', EMPTY], INSTALL_ENV],
  // vendor-check --strict, frere GUI ABSENT (aucun --gui : resolution par IAKAFRAME_GUI_ROOT, cf.
  // vendor.js:resolveGuiRoot) : l'ABSTENTION (regle 6, AR-J3) est PROMUE en erreur sous --strict
  // (vendor-check.js:268-277) -> { ok:false, error: reason, status:'skipped' }, exit 1, stderr vide.
  // C'est la SEULE forme de vendor-check qui porte reellement `error` (le cas DRIFT ne le porte
  // pas — cf. rapport de remise § etape 0) ; c'est donc la seule eligible a la garde ERRORS
  // generique (qui exige `typeof obj.error === 'string'`).
  [
    'vendor-check --strict <gui absent>',
    ['vendor-check', '--strict', '--json'],
    { IAKAFRAME_GUI_ROOT: path.join(EMPTY, 'gui-definitivement-absent') },
  ],
];

for (const [name, args, extraEnv] of ERRORS) {
  test(`C-JSON erreur : ${name} -> { ok:false, error } sur stdout, exit 1, rien sur stderr`, () => {
    const { stdout, stderr, status } = cli(args, extraEnv || {});
    assert.equal(status, 1, 'exitCode 1 attendu');
    assert.equal(stderr.trim(), '', 'aucun texte humain sur stderr en mode --json');
    const obj = JSON.parse(stdout);
    assert.equal(obj.ok, false);
    assert.equal(typeof obj.error, 'string');
    assert.ok(obj.error.length > 0);
  });
}

test.after(() => {
  for (const d of [HOME, OBS, EMPTY, PROJ, GITD, BARE, INSTALL_CLAUDE, INSTALL_APPS, INSTALL_BACKUPS, REVIEW_HOME]) fs.rmSync(d, { recursive: true, force: true });
});
