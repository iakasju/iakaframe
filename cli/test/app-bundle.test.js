// Gardes de lib/app-bundle.js (lot C.1) — resolution du manifeste, verification de signature
// (CA-14), couverture de plateforme (CA-15), et pose reelle d'un bundle `.app.tar.gz` (CA-10 :
// jouable sans interface). Tout ce fichier est OFFLINE : les sources reseau sont INJECTEES
// (jamais le `resoudre`/`getBytes` reels), et le tar.gz de test est fabrique avec le VRAI binaire
// `tar` du systeme — la meme commande que `poserBundleDarwin` invoque en production.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { generateKeyPairSync, createHash, sign as cryptoSign, randomBytes } from 'node:crypto';
import {
  APPS, cleManifestePlateforme, resoudreCleManifeste, familleDePose, nomFichierCible,
  resoudreManifesteApp, telechargerEtVerifier, poserBundleDarwin, poserBundleLinux,
  decouvrirInstallationWindows, poserBundleWindows,
} from '../src/lib/app-bundle.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-app-bundle-')); }

// --- fabrique une paire minisign + une entree de manifeste signee, offline (meme recette que
// cli/test/minisign.test.js) --------------------------------------------------------------------
function fabriquerPaire() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const keyId = randomBytes(8);
  const der = publicKey.export({ format: 'der', type: 'spki' });
  const brute = der.subarray(der.length - 32);
  const bloc = Buffer.concat([Buffer.from('Ed'), keyId, brute]);
  const pubkeyB64 = Buffer.from(`untrusted comment: fixture\n${bloc.toString('base64')}\n`, 'utf8').toString('base64');
  return { privateKey, keyId, pubkeyB64 };
}

function signer({ octets, privateKey, keyId, fichier }) {
  const message = createHash('blake2b512').update(octets).digest();
  const sig = cryptoSign(null, message, privateKey);
  const sigBloc = Buffer.concat([Buffer.from('ED'), keyId, sig]);
  const trustedComment = `timestamp:0\tfile:${fichier}`;
  const globale = cryptoSign(null, Buffer.concat([sig, Buffer.from(trustedComment, 'utf8')]), privateKey);
  const texte = [
    'untrusted comment: signature from minisign secret key',
    sigBloc.toString('base64'),
    `trusted comment: ${trustedComment}`,
    globale.toString('base64'),
  ].join('\n');
  return Buffer.from(texte, 'utf8').toString('base64');
}

/** Construit un `.app.tar.gz` REEL avec le binaire `tar` du systeme (celui que poserBundleDarwin invoque). */
function fabriquerBundleAppTarGz({ appName = 'FixtureApp', contenu = 'contenu fixture' } = {}) {
  const staging = tmp();
  const appDir = path.join(staging, `${appName}.app`);
  fs.mkdirSync(path.join(appDir, 'Contents', 'MacOS'), { recursive: true });
  fs.writeFileSync(path.join(appDir, 'Contents', 'MacOS', 'marker.txt'), contenu);
  const tarPath = path.join(staging, 'bundle.tar.gz');
  const res = spawnSync('tar', ['-czf', tarPath, '-C', staging, `${appName}.app`], { encoding: 'utf8' });
  assert.equal(res.status, 0, `précondition de test : tar doit réussir (${res.stderr})`);
  return fs.readFileSync(tarPath);
}

// --- CA-15 : couverture de plateforme -------------------------------------------------------------

// MODIFIE PAR LE LOT ETAPES-3-4-WINDOWS-LINUX/W-L (2026-09-05) : § 2.1 mandate que
// `cleManifestePlateforme` cesse de rendre une clé UNIQUE et rende un COUPLE ORDONNE
// `{ installeur, generique }` (M6) — ce fichier est explicitement au perimetre "ecrits" du lot
// (§ 6 de l'instruction). Ces deux tests, qui exercent DIRECTEMENT le contrat de cette fonction,
// sont donc mis a jour pour le nouveau contrat ; aucun AUTRE test de ce fichier (CA-14,
// resoudreManifesteApp, poserBundleDarwin, plus bas) n'est touché — c'est LA le perimetre protege
// par CA-W14/R-W8.
test('CA-15 : darwin/arm64 et darwin/x64 sont COUVERTS (les seuls prouvables sur ce poste, § 10) — couple {installeur:null, generique}', () => {
  assert.deepEqual(cleManifestePlateforme({ platform: 'darwin', arch: 'arm64' }), { installeur: null, generique: 'darwin-aarch64' });
  assert.deepEqual(cleManifestePlateforme({ platform: 'darwin', arch: 'x64' }), { installeur: null, generique: 'darwin-x86_64' });
});

test('CA-W1 : linux/x64 est COUVERT depuis le lot W-L — couple {installeur:"linux-x86_64-appimage", generique:"linux-x86_64"}', () => {
  assert.deepEqual(cleManifestePlateforme({ platform: 'linux', arch: 'x64' }), { installeur: 'linux-x86_64-appimage', generique: 'linux-x86_64' });
});

// MODIFIE PAR LE LOT ETAPES-3-4-WINDOWS-LINUX/W-W (2026-09-05) : win32/x64 est desormais COUVERT
// (§ 2.1, AR-W1(a)) — ce test, qui exerce DIRECTEMENT le contrat de `cleManifestePlateforme`,
// est mis a jour pour retirer win32/x64 de la liste des cas NON couverts (deplace vers CA-W8
// ci-dessous) et le remplacer par win32/arm64 (jamais couvert, le manifeste ne porte que du
// x86_64 hors macOS, M5) — la meme discipline que le lot W-L avait deja appliquee a CA-15.
test('CA-W15 : win32/arm64, linux/arm64 et darwin/ia32 restent NON couverts -> null (le refus CA-15 survit, il rétrécit)', () => {
  assert.equal(cleManifestePlateforme({ platform: 'win32', arch: 'arm64' }), null, 'le manifeste réel ne porte que du windows x86_64 (M5) — win32/x64, lui, est COUVERT depuis le lot W-W (CA-W8)');
  assert.equal(cleManifestePlateforme({ platform: 'linux', arch: 'arm64' }), null, 'le manifeste réel ne porte que du linux x86_64 (M5)');
  assert.equal(cleManifestePlateforme({ platform: 'darwin', arch: 'ia32' }), null, 'darwin sur une archi NI arm64 NI x64 (ex. 32 bits) : non couvert non plus');
});

test('CA-W8 : win32/x64 est COUVERT depuis le lot W-W — couple {installeur:"windows-x86_64-nsis", generique:"windows-x86_64"}, le `.msi` n\'est JAMAIS lu', () => {
  assert.deepEqual(cleManifestePlateforme({ platform: 'win32', arch: 'x64' }), { installeur: 'windows-x86_64-nsis', generique: 'windows-x86_64' });
});

// --- resolution de manifeste (ordre M10, via lib/endpoints.js reutilise) -------------------------

test('resoudreManifesteApp : reprend le PREMIER endpoint exploitable, dans l\'ordre déclaré (M10)', async () => {
  const app = APPS.IakaCockpit;
  const appels = [];
  const resoudreEndpoints = async (endpoints) => {
    appels.push(endpoints);
    return {
      retenu: { hote: 'nas-fixture', manifeste: { version: '9.9.9', platforms: {} } },
      manifeste: { version: '9.9.9', platforms: {} },
      essais: [{ hote: 'nas-fixture', ok: true, motif: 'ok' }],
      complet: true,
      mesureLe: new Date().toISOString(),
    };
  };
  const res = await resoudreManifesteApp(app, { resoudreEndpoints });
  assert.equal(res.manifeste.version, '9.9.9');
  assert.equal(appels.length, 1);
  assert.deepEqual(appels[0], app.endpoints, 'les DEUX endpoints déclarés (NAS puis GitHub, M10) doivent être transmis TELS QUELS, dans l\'ordre');
});

// --- CA-14 : signature ------------------------------------------------------------------------

test('CA-14 : bundle avec signature VALIDE -> accepté, octets rendus', async () => {
  const octets = Buffer.from('bundle fixture, telechargerEtVerifier');
  const { privateKey, keyId, pubkeyB64 } = fabriquerPaire();
  const signature = signer({ octets, privateKey, keyId, fichier: 'IakaCockpit_aarch64.app.tar.gz' });
  const app = { nom: 'FixtureApp', pubkey: pubkeyB64 };
  const manifeste = { version: '1.2.3', platforms: { 'darwin-aarch64': { url: 'https://example.invalid/x.tar.gz', signature } } };
  const telecharger = async () => ({ ok: true, status: 200, octets });
  const res = await telechargerEtVerifier({ app, manifeste, cle: 'darwin-aarch64', telecharger });
  assert.equal(res.ok, true);
  assert.equal(res.version, '1.2.3');
  assert.deepEqual(res.octets, octets);
});

test('CA-14 : bundle avec signature INVALIDE (octets altérés après signature) -> REFUS, jamais posé', async () => {
  const octets = Buffer.from('bundle fixture, telechargerEtVerifier');
  const { privateKey, keyId, pubkeyB64 } = fabriquerPaire();
  const signature = signer({ octets, privateKey, keyId, fichier: 'x.tar.gz' });
  const app = { nom: 'FixtureApp', pubkey: pubkeyB64 };
  const manifeste = { version: '1.2.3', platforms: { 'darwin-aarch64': { url: 'https://example.invalid/x.tar.gz', signature } } };
  // CONTREFACTUEL : le serveur sert un octet DIFFÉRENT de celui qui a été signé.
  const telecharger = async () => ({ ok: true, status: 200, octets: Buffer.from('bundle ALTÉRÉ, pas celui qui a été signé') });
  const res = await telechargerEtVerifier({ app, manifeste, cle: 'darwin-aarch64', telecharger });
  assert.equal(res.ok, false, 'CONTREFACTUEL : un octet servi différent de celui signé DOIT être refusé');
  assert.match(res.raison, /CA-14.*SIGNATURE INVALIDE/);
});

test('CA-14 : entrée de manifeste SANS champ signature -> REFUS explicite, jamais un succès silencieux', async () => {
  const octets = Buffer.from('bundle sans signature');
  const app = { nom: 'FixtureApp', pubkey: fabriquerPaire().pubkeyB64 };
  const manifeste = { version: '1.0.0', platforms: { 'darwin-aarch64': { url: 'https://example.invalid/x.tar.gz' } } };
  const telecharger = async () => ({ ok: true, status: 200, octets });
  const res = await telechargerEtVerifier({ app, manifeste, cle: 'darwin-aarch64', telecharger });
  assert.equal(res.ok, false);
  assert.match(res.raison, /CA-14.*aucune signature annoncee/);
});

test('plateforme absente du manifeste -> REFUS explicite, jamais un repli silencieux', async () => {
  const app = { nom: 'FixtureApp', pubkey: fabriquerPaire().pubkeyB64 };
  const manifeste = { version: '1.0.0', platforms: { 'windows-x86_64-msi': { url: 'https://example.invalid/x.msi', signature: 'x' } } };
  const res = await telechargerEtVerifier({ app, manifeste, cle: 'darwin-aarch64', telecharger: async () => ({ ok: true, octets: Buffer.from('x') }) });
  assert.equal(res.ok, false);
  assert.match(res.raison, /absente du manifeste/);
});

test('échec de téléchargement (statut non-ok) -> REFUS explicite', async () => {
  const app = { nom: 'FixtureApp', pubkey: fabriquerPaire().pubkeyB64 };
  const manifeste = { version: '1.0.0', platforms: { 'darwin-aarch64': { url: 'https://example.invalid/x.tar.gz', signature: 'x' } } };
  const res = await telechargerEtVerifier({ app, manifeste, cle: 'darwin-aarch64', telecharger: async () => ({ ok: false, status: 404, octets: null }) });
  assert.equal(res.ok, false);
  assert.match(res.raison, /ECHEC telechargement/);
});

// --- pose reelle, avec le VRAI `tar` -------------------------------------------------------------

test('poserBundleDarwin : pose neuve (rien avant) — extrait le VRAI tar.gz et copie le .app à la cible', () => {
  const octets = fabriquerBundleAppTarGz({ appName: 'FixtureApp', contenu: 'version A' });
  const racine = tmp();
  const cible = path.join(racine, 'FixtureApp.app');
  const res = poserBundleDarwin({ octets, cible });
  assert.equal(res.ok, true);
  assert.equal(fs.readFileSync(path.join(cible, 'Contents', 'MacOS', 'marker.txt'), 'utf8'), 'version A');
});

test('poserBundleDarwin : REMPLACE un .app déjà présent à la cible (la sauvegarde est la responsabilité de l\'appelant, AR-5)', () => {
  const racine = tmp();
  const cible = path.join(racine, 'FixtureApp.app');
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'ancien.txt'), 'ancienne version, doit disparaître');

  const octets = fabriquerBundleAppTarGz({ appName: 'FixtureApp', contenu: 'version B' });
  const res = poserBundleDarwin({ octets, cible });
  assert.equal(res.ok, true);
  assert.equal(fs.existsSync(path.join(cible, 'ancien.txt')), false, 'le contenu précédent doit avoir été remplacé (la sauvegarde en amont, AR-5, est ce qui permet de le restaurer)');
  assert.equal(fs.readFileSync(path.join(cible, 'Contents', 'MacOS', 'marker.txt'), 'utf8'), 'version B');
});

test('poserBundleDarwin : archive avec ZÉRO entrée .app -> ÉCHEC explicite, rien n\'est posé', () => {
  const staging = tmp();
  fs.writeFileSync(path.join(staging, 'pas-une-app.txt'), 'contenu quelconque');
  const tarPath = path.join(staging, 'bundle.tar.gz');
  const res0 = spawnSync('tar', ['-czf', tarPath, '-C', staging, 'pas-une-app.txt'], { encoding: 'utf8' });
  assert.equal(res0.status, 0);
  const octets = fs.readFileSync(tarPath);

  const racine = tmp();
  const cible = path.join(racine, 'FixtureApp.app');
  const res = poserBundleDarwin({ octets, cible });
  assert.equal(res.ok, false, 'CONTREFACTUEL : une archive sans .app doit être refusée, jamais posée telle quelle');
  assert.match(res.raison, /0 entree/);
  assert.equal(fs.existsSync(cible), false);
});

test('poserBundleDarwin : archive CORROMPUE (pas un vrai gzip) -> ÉCHEC explicite (tar rend un code non nul)', () => {
  const racine = tmp();
  const cible = path.join(racine, 'FixtureApp.app');
  const res = poserBundleDarwin({ octets: Buffer.from('ceci n\'est pas une archive tar.gz'), cible });
  assert.equal(res.ok, false);
  assert.match(res.raison, /tar.*echoue/);
  assert.equal(fs.existsSync(cible), false);
});

// ==================================================================================================
// Lot ETAPES-3-4-WINDOWS-LINUX / W-L (Linux) — ajouts 2026-09-05, RIEN CI-DESSUS N'EST TOUCHE
// (hors les deux tests CA-15 modifiés plus haut pour le nouveau contrat de cleManifestePlateforme).
// ==================================================================================================

// --- CA-W2 : selection installeur -> generique, clé d'installeur D'ABORD, generique EN REPLI ------

test('CA-W2 : resoudreCleManifeste lit la clé INSTALLEUR d\'abord quand les deux existent (URL distinctes)', () => {
  const cle = { installeur: 'linux-x86_64-appimage', generique: 'linux-x86_64' };
  const manifeste = {
    version: '1.0.0',
    platforms: {
      'linux-x86_64-appimage': { url: 'https://example.invalid/appimage-url', signature: 'sig-a' },
      'linux-x86_64': { url: 'https://example.invalid/generique-url', signature: 'sig-b' },
    },
  };
  assert.equal(resoudreCleManifeste(manifeste, cle), 'linux-x86_64-appimage');
});

test('CA-W2, CONTREFACTUEL (repli manquant) : sans clé installeur, un manifeste ne portant QUE la générique est quand même résolu', () => {
  const cle = { installeur: 'linux-x86_64-appimage', generique: 'linux-x86_64' };
  const manifeste = {
    version: '1.0.0',
    platforms: { 'linux-x86_64': { url: 'https://example.invalid/generique-seule', signature: 'sig-b' } },
  };
  assert.equal(resoudreCleManifeste(manifeste, cle), 'linux-x86_64', 'le repli sur la clé générique doit fonctionner quand la clé installeur est absente');
});

// --- CA-W6 : NON-repli sur `-deb`/`-rpm` (le critère le plus facile à rendre vide, § 8) -----------

test('CA-W6 : un manifeste portant SEULEMENT `-deb`/`-rpm` (signés, valides) -> AUCUNE résolution, jamais un repli', () => {
  const cle = { installeur: 'linux-x86_64-appimage', generique: 'linux-x86_64' };
  const manifeste = {
    version: '1.0.0',
    platforms: {
      // Entrées VALIDES et SIGNEES, exactement le piège du critère : si la fonction se repliait
      // sur l'une d'elles, ce test ne rougirait PAS pour la bonne raison.
      'linux-x86_64-deb': { url: 'https://example.invalid/x.deb', signature: 'sig-deb-valide' },
      'linux-x86_64-rpm': { url: 'https://example.invalid/x.rpm', signature: 'sig-rpm-valide' },
    },
  };
  assert.equal(resoudreCleManifeste(manifeste, cle), null, 'CONTREFACTUEL : ajouter un repli sur `-deb`/`-rpm` ferait rougir ce test');
});

test('CA-W2/CA-W6 : entrée sans `url` (signature seule) ne compte pas comme exploitable', () => {
  const cle = { installeur: 'linux-x86_64-appimage', generique: 'linux-x86_64' };
  const manifeste = { version: '1.0.0', platforms: { 'linux-x86_64-appimage': { signature: 'sig-sans-url' } } };
  assert.equal(resoudreCleManifeste(manifeste, cle), null);
});

// --- familleDePose / nomFichierCible : dérivation pure, source unique (M3) -------------------------

test('familleDePose : darwin/linux dérivés de la clé générique, source unique (pas de .app en dur, M3)', () => {
  assert.equal(familleDePose({ installeur: null, generique: 'darwin-aarch64' }), 'darwin');
  assert.equal(familleDePose({ installeur: null, generique: 'darwin-x86_64' }), 'darwin');
  assert.equal(familleDePose({ installeur: 'linux-x86_64-appimage', generique: 'linux-x86_64' }), 'linux');
  assert.equal(familleDePose(null), null);
});

test('nomFichierCible : `.app` pour darwin (inchangé), `.AppImage` pour linux (le `.app` en dur disparaît, M3)', () => {
  assert.equal(nomFichierCible('IakaCockpit', 'darwin'), 'IakaCockpit.app');
  assert.equal(nomFichierCible('IakaCockpit', 'linux'), 'IakaCockpit.AppImage');
});

// --- CA-W3/CA-W4 : poserBundleLinux, pose reelle sur disque (bit d'execution) ----------------------

test('CA-W3 : poserBundleLinux écrit l\'octet EXACT et pose le bit d\'exécution (0o755)', () => {
  const octets = Buffer.from('contenu AppImage fixture, octet pour octet');
  const racine = tmp();
  const cible = path.join(racine, 'FixtureApp.AppImage');
  const res = poserBundleLinux({ octets, cible });
  assert.equal(res.ok, true);
  assert.deepEqual(fs.readFileSync(cible), octets, 'CA-W3 : octet pour octet, identique à ce qui a été vérifié');
  const mode = fs.statSync(cible).mode;
  assert.notEqual(mode & 0o111, 0, 'CA-W3 : le bit d\'exécution doit être posé');
});

test('CA-W3, CONTREFACTUEL : sans chmod, le bit d\'exécution serait absent (garde la valeur du test précédent honnête)', () => {
  const octets = Buffer.from('contenu');
  const racine = tmp();
  const cible = path.join(racine, 'SansChmod.AppImage');
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, octets); // même écriture que poserBundleLinux, SANS le chmod
  const mode = fs.statSync(cible).mode;
  assert.equal(mode & 0o111, 0, 'précondition du contrefactuel : une simple writeFileSync ne pose PAS le bit d\'exécution sur ce système');
});

test('CA-W5 : poserBundleLinux REMPLACE un fichier déjà présent à la cible (la sauvegarde reste la responsabilité de l\'appelant, AR-5)', () => {
  const racine = tmp();
  const cible = path.join(racine, 'FixtureApp.AppImage');
  fs.mkdirSync(racine, { recursive: true });
  fs.writeFileSync(cible, Buffer.from('ancienne version'));
  const octets = Buffer.from('nouvelle version, octet neuf');
  const res = poserBundleLinux({ octets, cible });
  assert.equal(res.ok, true);
  assert.deepEqual(fs.readFileSync(cible), octets);
});

// ==================================================================================================
// Lot ETAPES-3-4-WINDOWS-LINUX / W-W (Windows) — ajouts 2026-09-05, RIEN CI-DESSUS N'EST TOUCHE
// (hors les deux tests CA-15/CA-W15 mis à jour plus haut pour le contrat étendu à win32/x64).
// ==================================================================================================

// --- decouvrirInstallationWindows : double `execReg` REJOUANT LE FORMAT REEL de `reg query` -------
// (mesure fournie par Aragorn a l'etape 0, tabulation `InstallLocation    REG_SZ    "<chemin>"`,
// guillemets LITTERAUX inclus — le NSIS de Tauri les ecrit via `"$INSTDIR"`).

test('decouvrirInstallationWindows : AUCUNE clé de registre -> {existe:false, installLocation:null}, ZÉRO appel de plus que nécessaire', () => {
  let appels = 0;
  const execReg = (cmd, args) => {
    appels++;
    assert.equal(cmd, 'reg');
    assert.deepEqual(args.slice(0, 2), ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\IakaCockpit']);
    return { status: 1, stdout: '' }; // reg.exe : cle introuvable
  };
  const res = decouvrirInstallationWindows({ productName: 'IakaCockpit', execReg });
  assert.deepEqual(res, { existe: false, installLocation: null });
  assert.equal(appels, 1, 'CONTREFACTUEL : si la clé est absente, la valeur InstallLocation ne doit MÊME PAS être interrogée');
});

test('decouvrirInstallationWindows : clé PRÉSENTE + InstallLocation LISIBLE, guillemets littéraux retirés, dossier EXISTANT -> installLocation résolu', () => {
  const racine = tmp();
  const dossier = path.join(racine, 'IakaCockpit');
  fs.mkdirSync(dossier, { recursive: true });
  const execReg = (cmd, args) => {
    if (args.includes('/v')) {
      return { status: 0, stdout: `\r\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\IakaCockpit\r\n    InstallLocation    REG_SZ    "${dossier}"\r\n\r\n` };
    }
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\...\\IakaCockpit\r\n' };
  };
  const res = decouvrirInstallationWindows({ productName: 'IakaCockpit', execReg });
  assert.deepEqual(res, { existe: true, installLocation: dossier }, 'les guillemets littéraux de la valeur registre doivent être retirés');
});

test('decouvrirInstallationWindows : clé PRÉSENTE mais requête InstallLocation en ÉCHEC (reg.exe rend un code non nul) -> installLocation NULL (indéterminable)', () => {
  const execReg = (cmd, args) => {
    if (args.includes('/v')) return { status: 1, stdout: '' };
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\...\\IakaCockpit\r\n' };
  };
  const res = decouvrirInstallationWindows({ productName: 'IakaCockpit', execReg });
  assert.deepEqual(res, { existe: true, installLocation: null });
});

test('decouvrirInstallationWindows : clé PRÉSENTE, InstallLocation LISIBLE mais pointant sur un dossier DISPARU -> installLocation NULL (§2.3 cas 3, jamais supposé existant)', () => {
  const chemin = path.join(tmp(), 'DossierQuiNexistePas');
  const execReg = (cmd, args) => {
    if (args.includes('/v')) return { status: 0, stdout: `    InstallLocation    REG_SZ    "${chemin}"\r\n` };
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\...\\IakaCockpit\r\n' };
  };
  const res = decouvrirInstallationWindows({ productName: 'IakaCockpit', execReg });
  assert.deepEqual(res, { existe: true, installLocation: null }, 'CONTREFACTUEL : un chemin lu dans le registre mais absent du disque ne doit JAMAIS être rendu comme exploitable');
});

test('decouvrirInstallationWindows : clé PRÉSENTE, InstallLocation VIDE (chaîne vide entre guillemets) -> installLocation NULL', () => {
  const execReg = (cmd, args) => {
    if (args.includes('/v')) return { status: 0, stdout: `    InstallLocation    REG_SZ    ""\r\n` };
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\...\\IakaCockpit\r\n' };
  };
  const res = decouvrirInstallationWindows({ productName: 'IakaCockpit', execReg });
  assert.deepEqual(res, { existe: true, installLocation: null });
});

// --- poserBundleWindows : exécution silencieuse, `exec` injecté, code de sortie = le verdict -----

test('poserBundleWindows : code de sortie 0 -> ok:true, l\'installeur reçoit EXACTEMENT `/S` (jamais `/R`, AR-W1(a))', () => {
  const octets = Buffer.from('faux setup.exe, contenu fixture');
  let appels = 0;
  let cheminRecu = null;
  const exec = (cmd, args) => {
    appels++;
    cheminRecu = cmd;
    assert.deepEqual(args, ['/S'], 'AR-W1(a) : silencieux SANS relance — jamais `/R`');
    assert.ok(fs.existsSync(cmd), 'précondition : l\'octet doit avoir été écrit AVANT l\'exécution');
    assert.deepEqual(fs.readFileSync(cmd), octets, 'CA-14 en amont : l\'octet exécuté doit être EXACTEMENT celui déjà vérifié');
    return { status: 0 };
  };
  const res = poserBundleWindows({ octets, nomFichier: 'IakaCockpit-setup.exe', exec });
  assert.equal(res.ok, true);
  assert.equal(appels, 1);
  assert.equal(fs.existsSync(cheminRecu), false, 'le fichier temporaire doit être SUPPRIMÉ après exécution, succès compris');
});

test('poserBundleWindows, CONTREFACTUEL : code de sortie 2 (abandon NSIS par défaut) -> ok:false, raison NOMME l\'abandon', () => {
  const octets = Buffer.from('fixture');
  const exec = () => ({ status: 2 });
  const res = poserBundleWindows({ octets, nomFichier: 'IakaCockpit-setup.exe', exec });
  assert.equal(res.ok, false);
  assert.match(res.raison, /ABANDONNE.*code de sortie 2/i);
});

test('poserBundleWindows : code de sortie NON NUL autre que 2 -> ok:false, le code EXACT figure dans la raison', () => {
  const octets = Buffer.from('fixture');
  const exec = () => ({ status: 1603 }); // code générique d'échec Windows Installer, ici juste "autre que 0/2"
  const res = poserBundleWindows({ octets, nomFichier: 'IakaCockpit-setup.exe', exec });
  assert.equal(res.ok, false);
  assert.match(res.raison, /code 1603/);
});

test('poserBundleWindows : le fichier temporaire est SUPPRIMÉ même en cas d\'ÉCHEC (jamais laissé traîner)', () => {
  const octets = Buffer.from('fixture');
  let cheminRecu = null;
  const exec = (cmd) => { cheminRecu = cmd; return { status: 1 }; };
  const res = poserBundleWindows({ octets, nomFichier: 'IakaCockpit-setup.exe', exec });
  assert.equal(res.ok, false);
  assert.equal(fs.existsSync(cheminRecu), false);
});
