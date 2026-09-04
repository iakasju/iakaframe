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
  APPS, cleManifestePlateforme, resoudreManifesteApp, telechargerEtVerifier, poserBundleDarwin,
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

test('CA-15 : darwin/arm64 et darwin/x64 sont COUVERTS (les seuls prouvables sur ce poste, § 10)', () => {
  assert.equal(cleManifestePlateforme({ platform: 'darwin', arch: 'arm64' }), 'darwin-aarch64');
  assert.equal(cleManifestePlateforme({ platform: 'darwin', arch: 'x64' }), 'darwin-x86_64');
});

test('CA-15 : win32 et linux ne sont PAS couverts par ce lot -> null, jamais une clé inventée', () => {
  assert.equal(cleManifestePlateforme({ platform: 'win32', arch: 'x64' }), null);
  assert.equal(cleManifestePlateforme({ platform: 'linux', arch: 'x64' }), null);
  assert.equal(cleManifestePlateforme({ platform: 'darwin', arch: 'ia32' }), null, 'darwin sur une archi NI arm64 NI x64 (ex. 32 bits) : non couvert non plus');
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
