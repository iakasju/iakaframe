// Garde anti-re-divergence « version : source unique de verite »
// (instruction dette-version-source-unique.md, criteres § 6 G1/G3 et § 8.1/8.6/8.7).
//
// Contrat : cli/package.json (champ version, semver nu) est l'AUTORITE. Tous les autres lecteurs
// (bandeau `-v` d'index.js, frameworkVersion() qui stampe le kit deploye, etat des lieux) DERIVENT
// de cette valeur. La garde echoue des qu'un lecteur se desaligne de l'autorite -> la dette de
// divergence (v0.1.0 / v0.6.1 / v0.19.0) ne peut plus se reformer silencieusement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packageVersion, displayVersion } from '../src/lib/version.js';
import { frameworkVersion } from '../src/lib/kit.js';
import { doSnapshot } from '../src/commands/snapshot.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');            // vraie racine du depot iakaframe
const PKG = path.join(HERE, '..', 'package.json');   // l'autorite

// Lit le champ Version de l'etat des lieux (representation derivee, prefixee `v`).
function etatVersion(root) {
  const md = fs.readFileSync(path.join(root, 'specs', 'etat-des-lieux.md'), 'utf8');
  const m = md.match(/^\|\s*Version\s*\|\s*(.+?)\s*\|/m);
  return m ? m[1].trim() : null;
}

// --- G1 : un seul chiffre, plusieurs lecteurs, egalite asserted -------------------------------------

test('G1 : package.json est l\'autorite et pilote le bandeau `-v` (semver nu, plus jamais 0.1.0)', () => {
  const nu = JSON.parse(fs.readFileSync(PKG, 'utf8')).version;
  assert.match(nu, /^\d+\.\d+\.\d+$/, 'version d\'autorite = semver nu');
  assert.equal(packageVersion(), nu, 'lib/version.packageVersion() lit bien l\'autorite');

  const r = spawnSync('node', [CLI, '-v'], { cwd: os.tmpdir(), encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), nu, '`-v` derive de l\'autorite (resolution independante du cwd)');
  assert.notEqual(r.stdout.trim(), '0.1.0', 'la copie codee en dur 0.1.0 a bien disparu');
});

test('G1 : le bandeau HELP derive de l\'autorite (aucun litteral de version fige dans index.js)', () => {
  const src = fs.readFileSync(CLI, 'utf8');
  // Le HELP interpole ${VERSION} ; il ne doit exister aucune constante VERSION codee en dur.
  assert.doesNotMatch(src, /const\s+VERSION\s*=\s*['"]\d/, 'VERSION ne doit plus etre un litteral');
  assert.match(src, /const\s+VERSION\s*=\s*packageVersion\(\)/, 'VERSION doit etre lue depuis l\'autorite');
});

test('G1 : frameworkVersion() (stamp du kit deploye) est aligne sur l\'autorite', () => {
  // frameworkVersion lit la representation DERIVEE (etat des lieux) : elle doit egaler l\'autorite.
  // Si l\'etat des lieux n\'a pas ete regenere apres un bump, ce test MORD (cf. critere 7 ci-dessous).
  assert.equal(frameworkVersion(REPO), displayVersion(), 'frameworkVersion === v + autorite');
  assert.equal(etatVersion(REPO), displayVersion(), 'champ Version de l\'etat des lieux === v + autorite');
});

// --- Critere 7 : preuve que la garde MORD sur une divergence reintroduite --------------------------

test('la garde mord : bumper package.json sans regenerer l\'etat des lieux fait echouer l\'alignement', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-vsu-mord-'));
  try {
    // Autorite a 9.9.9, mais etat des lieux fige a une AUTRE valeur (divergence volontaire).
    fs.mkdirSync(path.join(tmp, 'cli'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'cli', 'package.json'),
      JSON.stringify({ name: '@naonedge/iakaframe', version: '9.9.9' }), 'utf8');
    fs.mkdirSync(path.join(tmp, 'specs'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'specs', 'etat-des-lieux.md'),
      '# Etat\n\n| Version | v0.6.1 |\n', 'utf8');

    const authority = 'v' + JSON.parse(fs.readFileSync(path.join(tmp, 'cli', 'package.json'), 'utf8')).version;
    // frameworkVersion lit l\'etat des lieux (derive, perime) -> DOIT differer de l\'autorite.
    assert.equal(frameworkVersion(tmp), 'v0.6.1');
    assert.notEqual(frameworkVersion(tmp), authority,
      'divergence detectee : la garde d\'alignement echouerait bien ici');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// --- G3 : snapshot sans --version lit l'autorite, jamais un `git describe` en retrait -------------

test('G3 : snapshot sans --version derive de l\'autorite (jamais d\'un vieux tag) -> regression tuee', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-vsu-snap-'));
  try {
    // Projet iakaframe factice : autorite a 9.9.9, mais un vieux tag git a v0.0.1.
    fs.mkdirSync(path.join(tmp, 'cli'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'cli', 'package.json'),
      JSON.stringify({ name: '@naonedge/iakaframe', version: '9.9.9' }), 'utf8');
    const git = (args) => spawnSync('git', args, { cwd: tmp, encoding: 'utf8' });
    git(['init', '-q']);
    git(['config', 'user.email', 'test@iaka']);
    git(['config', 'user.name', 'test']);
    git(['add', '-A']);
    git(['commit', '-qm', 'init']);
    git(['tag', 'v0.0.1']);   // le vieux tag qui, avant le fix, ecrasait la version (regression)

    const noop = () => ({ triggered: false });
    const r = doSnapshot({ projectPath: tmp, reason: 'version', cadenceRun: noop, projectCadenceRun: noop });

    assert.equal(r.version, 'v9.9.9', 'snapshot doit rendre l\'autorite (v9.9.9), pas le tag v0.0.1');
    assert.notEqual(r.version, 'v0.0.1', 'le fallback git describe ne doit plus faire regresser la version');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// --- Non-regression : pour un projet TIERS (pas l'autorite iakaframe), git describe reste la source -

test('non-regression : sans cli/package.json @naonedge/iakaframe, snapshot retombe sur git describe', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-vsu-tiers-'));
  try {
    const git = (args) => spawnSync('git', args, { cwd: tmp, encoding: 'utf8' });
    git(['init', '-q']);
    git(['config', 'user.email', 'test@iaka']);
    git(['config', 'user.name', 'test']);
    fs.writeFileSync(path.join(tmp, 'README.md'), '# projet tiers\n', 'utf8');
    git(['add', '-A']);
    git(['commit', '-qm', 'init']);
    git(['tag', 'v3.1.4']);

    const noop = () => ({ triggered: false });
    const r = doSnapshot({ projectPath: tmp, reason: 'version', cadenceRun: noop, projectCadenceRun: noop });
    assert.equal(r.version, 'v3.1.4', 'projet tiers : comportement git describe inchange');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
