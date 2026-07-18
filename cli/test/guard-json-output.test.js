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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');           // vraie bibliotheque du depot
const CMD_DIR = path.join(HERE, '..', 'src', 'commands');

function cli(args) {
  const r = spawnSync('node', [CLI, ...args], { cwd: REPO, encoding: 'utf8' });
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

// (nom, args, cle de collection attendue | null pour une ressource/rapport a plat)
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
];

for (const [name, args, collKey] of NOMINAL) {
  test(`C-JSON nominal : ${name} -> objet { ok:true } (jamais un tableau/scalaire nu)`, () => {
    const { stdout } = cli(args);
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
];

for (const [name, args] of ERRORS) {
  test(`C-JSON erreur : ${name} -> { ok:false, error } sur stdout, exit 1, rien sur stderr`, () => {
    const { stdout, stderr, status } = cli(args);
    assert.equal(status, 1, 'exitCode 1 attendu');
    assert.equal(stderr.trim(), '', 'aucun texte humain sur stderr en mode --json');
    const obj = JSON.parse(stdout);
    assert.equal(obj.ok, false);
    assert.equal(typeof obj.error, 'string');
    assert.ok(obj.error.length > 0);
  });
}

test.after(() => {
  for (const d of [HOME, OBS, EMPTY, PROJ]) fs.rmSync(d, { recursive: true, force: true });
});
