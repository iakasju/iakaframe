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
// L42 — la vitrine (README de la racine) devient un lecteur GARDE de l'autorite : G5 ci-dessous.
import {
  debutZone,
  ecartsDeVitrine,
  ecrireZones,
  lireZones,
  nomArtefact,
  rendreVitrine,
  versionAnnoncee,
} from '../scripts/lib/vitrine.js';
import { contexteDuDepot } from '../scripts/vitrine.js';

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

// --- G5 (L42) : la VITRINE est un lecteur de l'autorite, plus une prose recopiee ------------------
//
// LE DEFAUT FERME. Le README de la RACINE — la seule page que voie un inconnu arrivant sur GitHub —
// annoncait « v0.20.4 » (le dernier tag publie, du 2026-08-04) alors que l'autorite portait deja
// 0.39.0. Dix-neuf mineures d'ecart, et CETTE SUITE ETAIT VERTE : 795 tests passaient sur une
// vitrine qui envoyait le visiteur telecharger une version de trois semaines. G1..G4 gardaient les
// lecteurs INTERNES de l'autorite (`-v`, kit, etat des lieux) ; personne ne gardait le lecteur
// EXTERNE, celui qui compte pour quelqu'un qui installe depuis rien.
//
// Depuis L42, la section Installation est GENEREE entre marqueurs : elle ne s'edite plus a la main.

test('G5 : le README de la RACINE annonce exactement `v` + l\'autorite', () => {
  const nu = JSON.parse(fs.readFileSync(PKG, 'utf8')).version;
  const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');
  assert.equal(versionAnnoncee(readme), nu,
    `README.md de la racine annonce autre chose que cli/package.json (${nu}) — sortie : node cli/scripts/vitrine.js --write`);
  assert.equal('v' + versionAnnoncee(readme), displayVersion(), 'README === v + autorite');
});

test('G5 : la section Installation du README est EXACTEMENT ce que le generateur produit', () => {
  const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');
  const attendues = rendreVitrine(contexteDuDepot(path.join(REPO, 'cli')));
  const ecarts = ecartsDeVitrine(lireZones(readme, Object.keys(attendues)), attendues);
  const detail = ecarts
    .map((e) => `  zone « ${e.zone} », ligne ${e.ligne}\n    lu      : ${e.lu}\n    attendu : ${e.attendu}`)
    .join('\n');
  assert.equal(detail, '',
    'README.md a DERIVE : la section Installation ne s\'edite plus a la main.\nsortie : node cli/scripts/vitrine.js --write\n' + detail);
});

test('G5 : le README annonce l\'artefact `.tgz` que le CI produit, avec son nom EXACT', () => {
  // Le second mensonge de la vitrine : la chaine de publication fabrique
  // `naonedge-iakaframe-<v>.tgz` et le README n'en disait RIEN — il envoyait chercher l'archive
  // source. Le chemin le plus court etait produit, puis tu.
  const nu = JSON.parse(fs.readFileSync(PKG, 'utf8')).version;
  const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');
  const attendu = nomArtefact(nu);
  assert.equal(attendu, `naonedge-iakaframe-${nu}.tgz`);
  assert.ok(readme.includes(attendu), `README.md doit annoncer l'asset ${attendu}`);
  assert.ok(readme.includes(`npm install -g ${attendu}`), 'et la commande d\'installation qui va avec');
});

test('G5 CONTREFACTUEL : un README fige a une version anterieure fait ROUGIR, zone et ligne nommees', () => {
  // Sur une FIXTURE en memoire, JAMAIS sur le vrai README.
  const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');
  const perime = ecrireZones(readme, rendreVitrine({ version: '0.20.4', depot: 'iakasju/iakaframe' }));
  assert.notEqual(perime, readme, 'la fixture doit bien differer du README courant');
  assert.equal(versionAnnoncee(perime), '0.20.4');

  const attendues = rendreVitrine(contexteDuDepot(path.join(REPO, 'cli')));
  const ecarts = ecartsDeVitrine(lireZones(perime, Object.keys(attendues)), attendues);
  assert.ok(ecarts.length > 0, 'un README desaligne DOIT produire au moins un ecart');
  assert.equal(ecarts[0].zone, 'installation', 'l\'ecart NOMME sa zone');
  assert.ok(ecarts[0].ligne > 0, 'l\'ecart NOMME sa ligne');
  assert.match(ecarts[0].lu, /v0\.20\.4/);
});

test('G5 CONTREFACTUEL : retirer les marqueurs est un REFUS, pas une zone vide', () => {
  // Le faux vert le plus facile a produire : supprimer les marqueurs et laisser la prose libre.
  const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');
  const sansMarqueurs = readme.replaceAll(debutZone('installation'), '');
  assert.throws(() => lireZones(sansMarqueurs, ['installation']), /introuvable/);
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

// --- G4 : projet TIERS non tague -> son propre package.json, au lieu du tiret ---------------------
// Constate sur iakaFrameGUI : sans tag git, l'etat des lieux inscrivait « Version : - » alors que
// package.json portait 0.1.4. Le repli ne s'applique qu'APRES git describe : voir la non-regression
// juste en dessous, ou le tag continue de gagner.

test('G4 : projet tiers sans tag derive de son package.json (plus de « Version : - » muet)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-vsu-tiers-pkg-'));
  try {
    const git = (args) => spawnSync('git', args, { cwd: tmp, encoding: 'utf8' });
    git(['init', '-q']);
    git(['config', 'user.email', 'test@iaka']);
    git(['config', 'user.name', 'test']);
    fs.writeFileSync(path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'iakaframegui', version: '0.1.4' }), 'utf8');
    git(['add', '-A']);
    git(['commit', '-qm', 'init']);
    // AUCUN tag : c'est exactement le cas iakaFrameGUI.

    const noop = () => ({ triggered: false });
    const r = doSnapshot({ projectPath: tmp, reason: 'pause', cadenceRun: noop, projectCadenceRun: noop });

    assert.equal(r.version, 'v0.1.4', 'projet tiers non tague : version derivee de son package.json');
    assert.notEqual(r.version, '-', 'le tiret muet a disparu');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('G4 non-regression : un tag PRIME toujours sur le package.json du projet tiers', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-vsu-tiers-both-'));
  try {
    const git = (args) => spawnSync('git', args, { cwd: tmp, encoding: 'utf8' });
    git(['init', '-q']);
    git(['config', 'user.email', 'test@iaka']);
    git(['config', 'user.name', 'test']);
    fs.writeFileSync(path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'projet-tiers', version: '2.0.0' }), 'utf8');
    git(['add', '-A']);
    git(['commit', '-qm', 'init']);
    git(['tag', 'v3.1.4']);

    const noop = () => ({ triggered: false });
    const r = doSnapshot({ projectPath: tmp, reason: 'version', cadenceRun: noop, projectCadenceRun: noop });

    assert.equal(r.version, 'v3.1.4', 'le tag reste l\'autorite quand il existe : aucun projet ne change de comportement');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('G4 : sans tag NI package.json exploitable, le tiret demeure (pas d\'invention)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-vsu-tiers-rien-'));
  try {
    const git = (args) => spawnSync('git', args, { cwd: tmp, encoding: 'utf8' });
    git(['init', '-q']);
    git(['config', 'user.email', 'test@iaka']);
    git(['config', 'user.name', 'test']);
    fs.writeFileSync(path.join(tmp, 'README.md'), '# projet Rust, pas de manifeste npm\n', 'utf8');
    // package.json sans champ version : ne doit pas etre pris pour une version.
    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'sans-version' }), 'utf8');
    git(['add', '-A']);
    git(['commit', '-qm', 'init']);

    const noop = () => ({ triggered: false });
    const r = doSnapshot({ projectPath: tmp, reason: 'pause', cadenceRun: noop, projectCadenceRun: noop });

    assert.equal(r.version, '-', 'rien d\'exploitable -> tiret honnete, jamais une version inventee');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
