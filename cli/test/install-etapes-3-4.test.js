// Gardes du CHAÎNAGE réel des étapes 3/4 (lot C.1) : appel DIRECT de `etapeApp` (exportée par
// src/commands/install.js), le MÊME code que celui invoqué par `runInstall` — même exception
// documentée que cli/test/etape1-reseau-ecarte.test.js pour l'étape 1 : le chemin « positif »
// (réseau qui répond, signature valide, écriture réelle, rollback qui restaure) ne peut être
// prouvé qu'en INJECTANT les fonctions réseau, un sous-processus n'ayant aucun moyen de les
// maîtriser depuis l'extérieur. `cli/test/install-verbe.test.js` couvre le sous-processus réel
// (double toujours injoignable, chaîne qui s'arrête loyalement) ; ce fichier couvre CA-10 (chaîne
// jouable sans interface, ici sans même passer par le binaire), CA-11/CA-12/CA-13 (rollback réel,
// pas seulement en isolation dans cli/test/rollback.test.js) et CA-15 (couverture de plateforme).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { generateKeyPairSync, createHash, sign as cryptoSign, randomBytes } from 'node:crypto';
import { etapeApp } from '../src/commands/install.js';
import { APPS } from '../src/lib/app-bundle.js';
import { orchestrerRollback } from '../src/lib/rollback.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-install-etapes34-')); }

const silence = (() => {
  let restore = null;
  return {
    activer() { restore = console.log; console.log = () => {}; },
    desactiver() { if (restore) console.log = restore; },
  };
})();

// --- fabrique manifeste + bundle signés, offline (même recette que app-bundle.test.js) -----------
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

function fabriquerBundle({ appName, contenu }) {
  const staging = tmp();
  const appDir = path.join(staging, `${appName}.app`);
  fs.mkdirSync(path.join(appDir, 'Contents', 'MacOS'), { recursive: true });
  fs.writeFileSync(path.join(appDir, 'Contents', 'MacOS', 'marker.txt'), contenu);
  const tarPath = path.join(staging, 'bundle.tar.gz');
  const res = spawnSync('tar', ['-czf', tarPath, '-C', staging, `${appName}.app`], { encoding: 'utf8' });
  assert.equal(res.status, 0, `précondition : tar doit réussir (${res.stderr})`);
  return fs.readFileSync(tarPath);
}

/** Un COUPLE app+manifeste+bundle valides et cohérents, prêts à être injectés dans `etapeApp`. */
function scenarioAppValide({ appKey, contenu = 'contenu neuf' }) {
  const app = { ...APPS[appKey], pubkey: null }; // pubkey remplacée par une clé de TEST ci-dessous
  const { privateKey, keyId, pubkeyB64 } = fabriquerPaire();
  app.pubkey = pubkeyB64;
  const octets = fabriquerBundle({ appName: app.nom, contenu });
  const signature = signer({ octets, privateKey, keyId, fichier: `${app.nom}.app.tar.gz` });
  const manifeste = { version: '9.9.9', platforms: { 'darwin-aarch64': { url: `https://example.invalid/${app.nom}.tar.gz`, signature } } };
  const resoudreEndpointsApp = async () => ({
    retenu: { hote: 'nas-fixture' }, manifeste, essais: [{ hote: 'nas-fixture', ok: true, motif: 'ok' }], complet: true, mesureLe: new Date().toISOString(),
  });
  const telechargerApp = async () => ({ ok: true, status: 200, octets });
  return { app, resoudreEndpointsApp, telechargerApp };
}

// Patch temporaire de APPS[appKey] pour injecter une clé publique de TEST (etapeApp lit APPS
// directement par `appKey`, jamais l'objet `app` construit ci-dessus) — restauré après coup.
function avecAppPatchee(appKey, app, fn) {
  const original = APPS[appKey];
  APPS[appKey] = app;
  try { return fn(); } finally { APPS[appKey] = original; }
}

test('CA-15 : plateforme NON couverte -> refus explicite, ZÉRO appel réseau (le résolveur n\'est jamais invoqué)', async () => {
  let appels = 0;
  const resoudreEndpointsApp = async () => { appels++; return { retenu: null, essais: [] }; };
  silence.activer();
  let r;
  try {
    r = await etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true },
      appsDir: tmp(), backupDir: tmp(),
      resoudreEndpointsApp, plateforme: { platform: 'win32', arch: 'x64' },
    });
  } finally { silence.desactiver(); }
  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  assert.equal(appels, 0, 'CA-15 : une plateforme non couverte ne doit MÊME PAS consulter le réseau');
});

test('chemin positif : pose neuve d\'IakaCockpit (rien avant) -> écrit réellement, preuve.existaitAvant=false', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp } = scenarioAppValide({ appKey: 'IakaCockpit', contenu: 'v9.9.9' });

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp,
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, true);
  assert.ok(r.preuve);
  assert.equal(r.preuve.existaitAvant, false);
  const cible = path.join(appsDir, 'IakaCockpit.app');
  assert.equal(fs.readFileSync(path.join(cible, 'Contents', 'MacOS', 'marker.txt'), 'utf8'), 'v9.9.9');
});

test('CA-14, chemin négatif wiré : signature invalide -> etapeApp refuse, RIEN n\'est écrit dans --apps-dir', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp } = scenarioAppValide({ appKey: 'IakaCockpit' });
  // CONTREFACTUEL : le téléchargement sert un octet DIFFÉRENT de celui signé.
  const telechargerApp = async () => ({ ok: true, status: 200, octets: Buffer.from('bundle non signé, substitué') });

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp,
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  assert.equal(fs.existsSync(path.join(appsDir, 'IakaCockpit.app')), false, 'CA-14 : une signature invalide ne doit RIEN écrire');
});

// --- AR-5 : rollback CHAÎNÉ réel (étape 3 écrit, étape 4 échoue, étape 3 est défaite) -------------

test('AR-5 : étape 3 écrit (rien avant) puis étape 4 échoue -> le rollback RETIRE ce que l\'étape 3 a posé (garde 2 : rien n\'existait, donc rien à restaurer, juste à retirer)', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const s3 = scenarioAppValide({ appKey: 'IakaCockpit', contenu: 'posé par la chaîne' });

  silence.activer();
  let r3;
  try {
    r3 = await avecAppPatchee('IakaCockpit', s3.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: s3.resoudreEndpointsApp, telechargerApp: s3.telechargerApp,
    }));
  } finally { silence.desactiver(); }
  assert.equal(r3.ok, true);
  const cible3 = path.join(appsDir, 'IakaCockpit.app');
  assert.ok(fs.existsSync(cible3), 'précondition : l\'étape 3 a bien écrit');

  // étape 4 échoue (réseau injoignable, comme le double le fait en subprocess)
  const resoudreEndpointsApp4 = async () => ({ retenu: null, manifeste: null, essais: [{ hote: 'x', ok: false, motif: 'injoignable' }], complet: true, mesureLe: new Date().toISOString() });
  silence.activer();
  let r4;
  try {
    r4 = await etapeApp({
      numero: 4, appKey: 'iakaFrameGUI', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: resoudreEndpointsApp4,
    });
  } finally { silence.desactiver(); }
  assert.equal(r4.ok, false);

  // MÊME câblage que runInstall (§ tail de src/commands/install.js) : rollback des preuves des
  // étapes qui ONT écrit avant l'échec.
  const rb = orchestrerRollback([r3.preuve]);
  assert.equal(rb.nonDefaits.length, 0);
  assert.equal(fs.existsSync(cible3), false, 'AR-5 garde 2 : rien n\'existait avant la chaîne -> le rollback doit RETIRER ce qu\'elle a posé');
});

test('AR-5 : une app DÉJÀ PRÉSENTE avant la chaîne est RESTAURÉE (jamais effacée) quand une étape suivante échoue', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const cible3 = path.join(appsDir, 'IakaCockpit.app');
  fs.mkdirSync(path.join(cible3, 'Contents', 'MacOS'), { recursive: true });
  fs.writeFileSync(path.join(cible3, 'Contents', 'MacOS', 'marker.txt'), 'version PRÉ-EXISTANTE, posée avant ce lancement');

  const s3 = scenarioAppValide({ appKey: 'IakaCockpit', contenu: 'posé par CETTE chaîne' });
  silence.activer();
  let r3;
  try {
    r3 = await avecAppPatchee('IakaCockpit', s3.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: s3.resoudreEndpointsApp, telechargerApp: s3.telechargerApp,
    }));
  } finally { silence.desactiver(); }
  assert.equal(r3.ok, true);
  assert.equal(r3.preuve.existaitAvant, true);
  assert.equal(fs.readFileSync(path.join(cible3, 'Contents', 'MacOS', 'marker.txt'), 'utf8'), 'posé par CETTE chaîne', 'précondition : l\'étape 3 a bien REMPLACÉ le contenu');

  const rb = orchestrerRollback([r3.preuve]);
  assert.equal(rb.nonDefaits.length, 0);
  assert.equal(fs.readFileSync(path.join(cible3, 'Contents', 'MacOS', 'marker.txt'), 'utf8'), 'version PRÉ-EXISTANTE, posée avant ce lancement', 'AR-5 garde 2 : le contenu PRÉ-EXISTANT doit être de retour, jamais effacé');
});

test('AR-5, contrefactuel bout-en-bout : la sauvegarde de l\'étape 3 disparaît du disque avant le rollback -> REFUS explicite, rien n\'est supprimé à l\'aveugle', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const cible3 = path.join(appsDir, 'IakaCockpit.app');
  fs.mkdirSync(path.join(cible3, 'Contents', 'MacOS'), { recursive: true });
  fs.writeFileSync(path.join(cible3, 'Contents', 'MacOS', 'marker.txt'), 'PRÉ-EXISTANT');

  const s3 = scenarioAppValide({ appKey: 'IakaCockpit', contenu: 'neuf' });
  silence.activer();
  let r3;
  try {
    r3 = await avecAppPatchee('IakaCockpit', s3.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: s3.resoudreEndpointsApp, telechargerApp: s3.telechargerApp,
    }));
  } finally { silence.desactiver(); }
  assert.equal(r3.ok, true);

  // CONTREFACTUEL : la sauvegarde prise par l'étape 3 disparaît du disque (ex. purge externe).
  fs.rmSync(r3.preuve.backupPath, { recursive: true, force: true });

  const rb = orchestrerRollback([r3.preuve]);
  assert.equal(rb.defaits.length, 0, 'CONTREFACTUEL : sauvegarde disparue -> AUCUNE étape ne doit être déclarée défaite');
  assert.equal(rb.nonDefaits.length, 1);
  assert.match(rb.resume, /PARTIEL/);
  assert.equal(fs.readFileSync(path.join(cible3, 'Contents', 'MacOS', 'marker.txt'), 'utf8'), 'neuf', 'RIEN ne doit avoir été touché : ni supprimé, ni restauré à l\'aveugle sur une preuve dont la sauvegarde a disparu');
});
