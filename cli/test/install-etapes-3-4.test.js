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
import { creerEmetteur, EVENEMENTS, ETATS_ETAPE } from '../src/lib/evenements.js';

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

// MODIFIE PAR LE LOT ETAPES-3-4-WINDOWS-LINUX/W-W (2026-09-05) : `win32/x64` est desormais COUVERT
// (§ 2.1, AR-W1(a)) — ce test, qui exerce DIRECTEMENT le refus CA-15, est mis a jour pour utiliser
// `win32/arm64` (toujours NON couvert, M5) a la place. Le chainage reel de win32/x64 est couvert
// plus bas par les tests W-W dedies.
test('CA-15 : plateforme NON couverte -> refus explicite, ZÉRO appel réseau (le résolveur n\'est jamais invoqué)', async () => {
  let appels = 0;
  const resoudreEndpointsApp = async () => { appels++; return { retenu: null, essais: [] }; };
  silence.activer();
  let r;
  try {
    r = await etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true },
      appsDir: tmp(), backupDir: tmp(),
      resoudreEndpointsApp, plateforme: { platform: 'win32', arch: 'arm64' },
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

// ==================================================================================================
// Lot ETAPES-3-4-WINDOWS-LINUX / W-L (Linux) — ajouts 2026-09-05. Chaînage RÉEL via `etapeApp`,
// `plateforme` INJECTÉE à `{platform:'linux',arch:'x64'}` (le point d'injection PUR de M10,
// jamais un drapeau CLI) — RIEN CI-DESSUS N'EST TOUCHÉ.
// ==================================================================================================

/** Empreinte récursive du système de fichiers : chemins relatifs triés + contenu (CA-W7). */
function empreinte(dir) {
  const out = [];
  const walk = (d, rel) => {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(p, r);
      else out.push(`${r}:${fs.readFileSync(p).toString('base64')}`);
    }
  };
  walk(dir, '');
  return out.join('\n');
}

/** Un COUPLE app+manifeste+bundle valides pour LINUX (clé installeur `linux-x86_64-appimage`). */
function scenarioLinuxValide({ appKey, contenu = 'contenu AppImage neuf' }) {
  const app = { ...APPS[appKey], pubkey: null };
  const { privateKey, keyId, pubkeyB64 } = fabriquerPaire();
  app.pubkey = pubkeyB64;
  const octets = Buffer.from(contenu);
  const signature = signer({ octets, privateKey, keyId, fichier: `${app.nom}.AppImage` });
  const manifeste = {
    version: '9.9.9',
    platforms: { 'linux-x86_64-appimage': { url: `https://example.invalid/${app.nom}.AppImage`, signature } },
  };
  const resoudreEndpointsApp = async () => ({
    retenu: { hote: 'nas-fixture' }, manifeste, essais: [{ hote: 'nas-fixture', ok: true, motif: 'ok' }], complet: true, mesureLe: new Date().toISOString(),
  });
  const telechargerApp = async () => ({ ok: true, status: 200, octets });
  return { app, resoudreEndpointsApp, telechargerApp, octets };
}

test('CA-W16 : Linux, CA-14 tenu — signature invalide sur l\'AppImage -> etapeApp refuse, RIEN écrit dans --apps-dir', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp } = scenarioLinuxValide({ appKey: 'IakaCockpit' });
  // CONTREFACTUEL : le serveur sert un octet DIFFÉRENT de celui qui a été signé.
  const telechargerApp = async () => ({ ok: true, status: 200, octets: Buffer.from('AppImage ALTÉRÉE, pas celle qui a été signée') });

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'linux', arch: 'x64' },
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  assert.equal(fs.existsSync(path.join(appsDir, 'IakaCockpit.AppImage')), false, 'CA-W16 : CA-14 tenu sur Linux comme sur macOS — signature invalide -> rien écrit');
});

test('CA-W3/CA-W4 : Linux, chemin positif — pose neuve d\'IakaCockpit.AppImage, écrite avec le bit d\'exécution', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp, octets } = scenarioLinuxValide({ appKey: 'IakaCockpit' });

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'linux', arch: 'x64' },
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, true);
  assert.ok(r.preuve);
  assert.equal(r.preuve.existaitAvant, false);
  const cible = path.join(appsDir, 'IakaCockpit.AppImage');
  assert.deepEqual(fs.readFileSync(cible), octets, 'CA-W3 : octet pour octet');
  assert.notEqual(fs.statSync(cible).mode & 0o111, 0, 'CA-W3 : bit d\'exécution posé par la chaîne réelle');
});

test('CA-W5, chaîné réel : une AppImage DÉJÀ PRÉSENTE (fichier, pas dossier) est RESTAURÉE, jamais effacée', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const cible = path.join(appsDir, 'IakaCockpit.AppImage');
  fs.mkdirSync(appsDir, { recursive: true });
  fs.writeFileSync(cible, Buffer.from('AppImage PRÉ-EXISTANTE'));

  const s = scenarioLinuxValide({ appKey: 'IakaCockpit', contenu: 'posé par CETTE chaîne' });
  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', s.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: s.resoudreEndpointsApp, telechargerApp: s.telechargerApp,
      plateforme: { platform: 'linux', arch: 'x64' },
    }));
  } finally { silence.desactiver(); }
  assert.equal(r.ok, true);
  assert.equal(r.preuve.existaitAvant, true, 'AR-5 garde 1, sur un FICHIER Linux (pas un dossier) : la préexistence est bien mesurée');
  assert.deepEqual(fs.readFileSync(cible), Buffer.from('posé par CETTE chaîne'), 'précondition : la chaîne a bien remplacé le contenu');

  const rb = orchestrerRollback([r.preuve]);
  assert.equal(rb.nonDefaits.length, 0);
  assert.deepEqual(fs.readFileSync(cible), Buffer.from('AppImage PRÉ-EXISTANTE'), 'AR-5 garde 2, sur un FICHIER : le contenu PRÉ-EXISTANT doit être de retour, jamais effacé');
});

test('CA-W6, chaîné réel : manifeste Linux SANS AppImage exploitable (seulement -deb/-rpm signés) -> REFUS, RIEN écrit', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const app = { ...APPS.IakaCockpit, pubkey: fabriquerPaire().pubkeyB64 };
  const manifeste = {
    version: '9.9.9',
    platforms: {
      'linux-x86_64-deb': { url: 'https://example.invalid/x.deb', signature: 'sig-deb-valide' },
      'linux-x86_64-rpm': { url: 'https://example.invalid/x.rpm', signature: 'sig-rpm-valide' },
    },
  };
  const resoudreEndpointsApp = async () => ({
    retenu: { hote: 'nas-fixture' }, manifeste, essais: [{ hote: 'nas-fixture', ok: true, motif: 'ok' }], complet: true, mesureLe: new Date().toISOString(),
  });
  let appelsTelechargement = 0;
  const telechargerApp = async () => { appelsTelechargement++; return { ok: true, status: 200, octets: Buffer.from('jamais utilisé') }; };

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'linux', arch: 'x64' },
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  assert.equal(appelsTelechargement, 0, 'CA-W6 : ne doit MÊME PAS tenter de télécharger le .deb/.rpm');
  assert.equal(fs.existsSync(path.join(appsDir, 'IakaCockpit.AppImage')), false);
  assert.match(r.reprise || '', /publie AppImage/, 'la reprise doit nommer la forme manquante');
});

test('CA-W7 : Linux, `--dry-run` — empreinte disque IDENTIQUE avant/après, la chaîne décrit sans écrire', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const s = scenarioLinuxValide({ appKey: 'IakaCockpit' });

  const avant = empreinte(appsDir);
  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', s.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true, 'dry-run': true }, appsDir, backupDir,
      resoudreEndpointsApp: s.resoudreEndpointsApp, telechargerApp: s.telechargerApp,
      plateforme: { platform: 'linux', arch: 'x64' },
    }));
  } finally { silence.desactiver(); }
  const apres = empreinte(appsDir);

  assert.equal(r.ok, true);
  assert.equal(r.dryRun, true);
  assert.equal(apres, avant, 'CA-W7 : --dry-run ne doit RIEN écrire — prouvé par empreinte disque, pas par lecture de code');
  assert.equal(fs.existsSync(path.join(appsDir, 'IakaCockpit.AppImage')), false);
});

test('AR-W8/CA-W17 : sur la plateforme Linux simulée (--events, mode "json"), tout evt/etat émis reste dans le vocabulaire FERMÉ — aucun état nouveau', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const s = scenarioLinuxValide({ appKey: 'IakaCockpit' });
  const em = creerEmetteur({ mode: 'json' });

  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', s.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: s.resoudreEndpointsApp, telechargerApp: s.telechargerApp,
      plateforme: { platform: 'linux', arch: 'x64' }, em,
    }));
  } catch (e) { throw e; }

  assert.equal(r.ok, true);
  assert.ok(em.evenements.length > 0, 'la chaîne Linux doit émettre des événements comme la chaîne macOS');
  const hors = [];
  for (const o of em.evenements) {
    if (!EVENEMENTS.includes(o.evt)) hors.push(o.evt);
    if (o.evt === 'etape-terminee' && !ETATS_ETAPE.includes(o.etat)) hors.push(`etat:${o.etat}`);
  }
  assert.deepEqual(hors, [], `valeur(s) hors vocabulaire émise(s) sur le chemin Linux : ${hors.join(', ')}`);
  // CA-W17 : la motivation ("plateforme non couverte", "AppImage introuvable"...) passe par
  // `detail` (texte libre), jamais par un evt/etat neuf — vérifié ici par l'appartenance stricte
  // au vocabulaire gelé, et par un `git diff --stat cli/src/lib/evenements.js` vide (revue humaine).
});

// ==================================================================================================
// Lot ETAPES-3-4-WINDOWS-LINUX / W-W (Windows) — ajouts 2026-09-05. Chaînage RÉEL via `etapeApp`,
// `plateforme` INJECTÉE à `{platform:'win32',arch:'x64'}`, `execReg`/`execSetupWindows` INJECTÉS
// (M-10, ports dédiés à ce lot) — RIEN CI-DESSUS N'EST TOUCHÉ.
// ==================================================================================================

/** Un COUPLE app+manifeste+bundle valides pour WINDOWS (clé installeur `windows-x86_64-nsis`). */
function scenarioWindowsValide({ appKey, contenu = 'contenu setup.exe neuf' }) {
  const app = { ...APPS[appKey], pubkey: null };
  const { privateKey, keyId, pubkeyB64 } = fabriquerPaire();
  app.pubkey = pubkeyB64;
  const octets = Buffer.from(contenu);
  const signature = signer({ octets, privateKey, keyId, fichier: `${app.nom}-setup.exe` });
  const manifeste = {
    version: '9.9.9',
    platforms: { 'windows-x86_64-nsis': { url: `https://example.invalid/${app.nom}-setup.exe`, signature } },
  };
  const resoudreEndpointsApp = async () => ({
    retenu: { hote: 'nas-fixture' }, manifeste, essais: [{ hote: 'nas-fixture', ok: true, motif: 'ok' }], complet: true, mesureLe: new Date().toISOString(),
  });
  const telechargerApp = async () => ({ ok: true, status: 200, octets });
  return { app, resoudreEndpointsApp, telechargerApp, octets };
}

/**
 * Double `execReg` STATEFUL : rejoue "rien d'installé" TANT QUE l'installeur n'a pas encore été
 * exécuté (`poseFaite.valeur === false`), puis "clé présente, InstallLocation résolue vers
 * `installLocation`" UNE FOIS la pose faite — exactement le fait mesuré du § 2.3 point 3 : on ne
 * découvre l'emplacement REEL qu'APRÈS coup, en relisant le registre.
 */
function fabriquerExecRegAvantApres({ installLocation, poseFaite }) {
  return (cmd, args) => {
    if (!poseFaite.valeur) return { status: 1, stdout: '' }; // avant la pose : rien d'installé
    if (args.includes('/v')) return { status: 0, stdout: `    InstallLocation    REG_SZ    "${installLocation}"\r\n` };
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\IakaCockpit\r\n' };
  };
}

test('CA-W8/CA-W9, chaîné réel : Windows, pose neuve — `setup.exe /S` exécuté (jamais `/R`), --apps-dir JAMAIS écrit, InstallLocation découvert APRÈS la pose', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp } = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const installLocation = path.join(tmp(), 'IakaCockpitInstalle');
  fs.mkdirSync(installLocation, { recursive: true });
  const poseFaite = { valeur: false };
  const execReg = fabriquerExecRegAvantApres({ installLocation, poseFaite });
  let appelsSetup = 0;
  let argsSetup = null;
  const execSetupWindows = (cmd, args) => { appelsSetup++; argsSetup = args; poseFaite.valeur = true; return { status: 0 }; };

  const avant = empreinte(appsDir);
  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
      execReg, execSetupWindows,
    }));
  } finally { silence.desactiver(); }
  const apres = empreinte(appsDir);

  assert.equal(r.ok, true);
  assert.equal(appelsSetup, 1);
  assert.deepEqual(argsSetup, ['/S'], 'AR-W1(a) : silencieux SANS relance');
  assert.ok(r.preuve);
  assert.equal(r.preuve.existaitAvant, false);
  assert.equal(r.preuve.windowsUninstall.chemin, path.join(installLocation, 'uninstall.exe'), '§2.3 point 3 : l\'uninstall.exe QUE LA POSE VIENT DE CRÉER, découvert après coup');
  assert.equal(apres, avant, 'CA-W9 : --apps-dir n\'est JAMAIS écrit sur Windows, quel que soit le résultat');
});

test('CA-W16 : Windows, CA-14 tenu — signature invalide sur le setup.exe -> etapeApp refuse, AUCUN installeur lancé, rien écrit', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp } = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  // CONTREFACTUEL : le serveur sert un octet DIFFÉRENT de celui qui a été signé.
  const telechargerApp = async () => ({ ok: true, status: 200, octets: Buffer.from('setup.exe ALTÉRÉ, pas celui qui a été signé') });
  const execReg = () => ({ status: 1, stdout: '' }); // rien d'installé avant
  let appelsSetup = 0;
  const execSetupWindows = () => { appelsSetup++; return { status: 0 }; };

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
      execReg, execSetupWindows,
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  assert.equal(appelsSetup, 0, 'CA-W16/CA-14 : une signature invalide doit REFUSER avant même de lancer l\'installeur');
});

test('CA-W10 : registre simulé — clé PRÉSENTE mais InstallLocation INEXPLOITABLE -> REFUS D\'ÉCRIRE, AUCUN installeur lancé (compteur=0), rien écrit', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp } = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const execReg = (cmd, args) => {
    if (args.includes('/v')) return { status: 1, stdout: '' }; // InstallLocation illisible
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\...\\IakaCockpit\r\n' }; // la clé EXISTE
  };
  let appelsSetup = 0;
  const execSetupWindows = () => { appelsSetup++; return { status: 0 }; };

  const avant = empreinte(appsDir);
  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
      execReg, execSetupWindows,
    }));
  } finally { silence.desactiver(); }
  const apres = empreinte(appsDir);

  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  assert.equal(appelsSetup, 0, 'CA-W10 : aucun sous-processus d\'installation ne doit être lancé quand la sauvegarde est impossible');
  assert.equal(apres, avant);
  assert.match(r.reprise || '', /désinstaller/);
});

test('CA-W10, CONTREFACTUEL implicite : le MÊME registre (clé présente, InstallLocation exploitable) laisse l\'installeur se lancer — la garde ne rougit QUE sur l\'indétermination', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp } = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const installLocation = path.join(tmp(), 'IakaCockpitDejaLa');
  fs.mkdirSync(installLocation, { recursive: true });
  fs.writeFileSync(path.join(installLocation, 'app.exe'), 'ancienne version');
  const execReg = (cmd, args) => {
    if (args.includes('/v')) return { status: 0, stdout: `    InstallLocation    REG_SZ    "${installLocation}"\r\n` };
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\...\\IakaCockpit\r\n' };
  };
  let appelsSetup = 0;
  const execSetupWindows = () => { appelsSetup++; return { status: 0 }; };

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
      execReg, execSetupWindows,
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, true);
  assert.equal(appelsSetup, 1);
  assert.equal(r.preuve.existaitAvant, true);
  assert.equal(r.preuve.plateforme, 'windows');
  assert.equal(fs.readFileSync(path.join(installLocation, 'app.exe'), 'utf8'), 'ancienne version', 'précondition : la sauvegarde a bien été prise AVANT le (faux) lancement de l\'installeur');
});

test('CA-W12 : code de sortie NON NUL de l\'installeur -> étape ÉCHOUÉE, le code figure dans `detail`, rien de nouveau sur le disque', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp } = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const execReg = () => ({ status: 1, stdout: '' }); // rien d'installé avant
  const execSetupWindows = () => ({ status: 1603 });
  const em = creerEmetteur({ mode: 'json' });

  const r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
    numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
    resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
    execReg, execSetupWindows, em,
  }));

  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  const term = em.evenements.find((e) => e.evt === 'etape-terminee');
  assert.equal(term.etat, 'echouee');
  assert.match(term.detail, /code 1603/);
});

test('CA-W13 : Windows, `--dry-run` — AUCUN sous-processus lancé (compteur=0), rien écrit, empreinte identique', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp } = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const execReg = () => ({ status: 1, stdout: '' });
  let appelsSetup = 0;
  const execSetupWindows = () => { appelsSetup++; return { status: 0 }; };

  const avant = empreinte(appsDir);
  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true, 'dry-run': true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
      execReg, execSetupWindows,
    }));
  } finally { silence.desactiver(); }
  const apres = empreinte(appsDir);

  assert.equal(r.ok, true);
  assert.equal(r.dryRun, true);
  assert.equal(appelsSetup, 0, 'CA-W13 : aucun sous-processus ne doit être lancé en dry-run');
  assert.equal(apres, avant);
});

test('CA-W8, chaîné réel : manifeste Windows SANS `.exe` NSIS exploitable (seulement `.msi` signé) -> REFUS, JAMAIS de repli sur le MSI, RIEN téléchargé', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const app = { ...APPS.IakaCockpit, pubkey: fabriquerPaire().pubkeyB64 };
  const manifeste = {
    version: '9.9.9',
    platforms: { 'windows-x86_64-msi': { url: 'https://example.invalid/x.msi', signature: 'sig-msi-valide' } },
  };
  const resoudreEndpointsApp = async () => ({
    retenu: { hote: 'nas-fixture' }, manifeste, essais: [{ hote: 'nas-fixture', ok: true, motif: 'ok' }], complet: true, mesureLe: new Date().toISOString(),
  });
  let appelsTelechargement = 0;
  const telechargerApp = async () => { appelsTelechargement++; return { ok: true, status: 200, octets: Buffer.from('jamais utilisé') }; };

  silence.activer();
  let r;
  try {
    r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
    }));
  } finally { silence.desactiver(); }

  assert.equal(r.ok, false);
  assert.equal(r.preuve, null);
  assert.equal(appelsTelechargement, 0, 'CA-W8 : le `.msi` ne doit JAMAIS être téléchargé en repli');
  assert.match(r.reprise || '', /publie/);
});

// --- AR-5 : rollback CHAÎNÉ réel Windows (étape 3 pose, étape 4 échoue, uninstall.exe /S lancé) ---

test('AR-5, chaîné réel Windows : étape 3 pose (rien avant) puis étape 4 échoue -> orchestrerRollback lance `uninstall.exe /S`, JAMAIS un rmSync du dossier', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const s3 = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const installLocation = path.join(tmp(), 'IakaCockpitInstalle3');
  fs.mkdirSync(installLocation, { recursive: true });
  const poseFaite = { valeur: false };
  const execReg = fabriquerExecRegAvantApres({ installLocation, poseFaite });
  const execSetupWindows = () => { poseFaite.valeur = true; return { status: 0 }; };

  silence.activer();
  let r3;
  try {
    r3 = await avecAppPatchee('IakaCockpit', s3.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: s3.resoudreEndpointsApp, telechargerApp: s3.telechargerApp,
      plateforme: { platform: 'win32', arch: 'x64' }, execReg, execSetupWindows,
    }));
  } finally { silence.desactiver(); }
  assert.equal(r3.ok, true);
  const cheminUninstall = path.join(installLocation, 'uninstall.exe');
  assert.equal(r3.preuve.windowsUninstall.chemin, cheminUninstall);

  // étape 4 échoue (réseau injoignable), même câblage que le précédent chaîné Linux
  const resoudreEndpointsApp4 = async () => ({ retenu: null, manifeste: null, essais: [{ hote: 'x', ok: false, motif: 'injoignable' }], complet: true, mesureLe: new Date().toISOString() });
  silence.activer();
  let r4;
  try {
    r4 = await etapeApp({
      numero: 4, appKey: 'iakaFrameGUI', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: resoudreEndpointsApp4, plateforme: { platform: 'win32', arch: 'x64' },
    });
  } finally { silence.desactiver(); }
  assert.equal(r4.ok, false);

  let appelsDesinstalleur = 0;
  const execDesinstalleur = (cmd, args) => {
    appelsDesinstalleur++;
    assert.equal(cmd, cheminUninstall);
    assert.deepEqual(args, ['/S']);
    return { status: 0 };
  };
  const rb = orchestrerRollback([r3.preuve], { execDesinstalleur });
  assert.equal(appelsDesinstalleur, 1, 'AR-5 : le rollback Windows doit lancer `uninstall.exe /S`, jamais un rmSync direct du dossier');
  assert.equal(rb.nonDefaits.length, 0);
  assert.match(rb.rapports[0].raison, /desinstalle via/);
  assert.match(rb.rapports[0].raison, /RESIDU NON RETABLI/, 'AR-W5 garde 3 : le résidu de registre/raccourcis doit être ÉNONCÉ dans le rapport de rollback');
});

// ==================================================================================================
// Reprise post-gate FAIL (2026-09-06) — cas (b) chaîné réel : la pose Windows RÉUSSIT (setup.exe /S
// -> code 0) mais la relecture du registre APRÈS coup ne rend AUCUN InstallLocation exploitable
// (§2.3 point 3, commentaire nommé install.js:679-680). `orchestrerRollback` doit rendre un énoncé
// nommé — JAMAIS une TypeError fuitée jusque dans l'événement structuré `rollback` (install.js:
// 826-830, `--events`/`--json`). Cf. docs/qualite/gate-etapes-3-4-windows.md § Reprise Gimli, pt 2.b.
// ==================================================================================================

/** Comme `fabriquerExecRegAvantApres`, mais le registre reste ILLISIBLE (InstallLocation) MÊME
 * APRÈS la pose — la clé de désinstallation existe (l'installeur a bien tourné), sa valeur
 * `InstallLocation` ne l'est jamais (§2.3 cas 3, "présent mais illisible/vide/disparu"). */
function fabriquerExecRegInstallLocationIntrouvableApresPose({ poseFaite }) {
  return (cmd, args) => {
    if (!poseFaite.valeur) return { status: 1, stdout: '' }; // avant la pose : rien d'installé
    if (args.includes('/v')) return { status: 1, stdout: '' }; // APRÈS la pose : InstallLocation illisible
    return { status: 0, stdout: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\IakaCockpit\r\n' };
  };
}

test('AR-W5, cas (b) chaîné réel Windows : pose RÉUSSIT mais InstallLocation reste introuvable après coup -> orchestrerRollback rend un énoncé nommé, JAMAIS une TypeError, dans l\'événement structuré `rollback` (--events)', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const s3 = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const poseFaite = { valeur: false };
  const execReg = fabriquerExecRegInstallLocationIntrouvableApresPose({ poseFaite });
  const execSetupWindows = () => { poseFaite.valeur = true; return { status: 0 }; };

  silence.activer();
  let r3;
  try {
    r3 = await avecAppPatchee('IakaCockpit', s3.app, () => etapeApp({
      numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: s3.resoudreEndpointsApp, telechargerApp: s3.telechargerApp,
      plateforme: { platform: 'win32', arch: 'x64' }, execReg, execSetupWindows,
    }));
  } finally { silence.desactiver(); }
  // la pose a RÉUSSI (code 0), mais l'emplacement n'a jamais pu être déterminé — précisément le
  // cas nommé et promis par le commentaire d'install.js:679-680.
  assert.equal(r3.ok, true);
  assert.equal(r3.preuve.cible, null);
  assert.deepEqual(r3.preuve.windowsUninstall, { chemin: null });

  // étape 4 échoue (réseau injoignable), déclenche le rollback de l'étape 3 — même câblage que
  // le tail de `runInstall` (src/commands/install.js:823-834).
  const resoudreEndpointsApp4 = async () => ({ retenu: null, manifeste: null, essais: [{ hote: 'x', ok: false, motif: 'injoignable' }], complet: true, mesureLe: new Date().toISOString() });
  silence.activer();
  let r4;
  try {
    r4 = await etapeApp({
      numero: 4, appKey: 'iakaFrameGUI', values: { yes: true }, appsDir, backupDir,
      resoudreEndpointsApp: resoudreEndpointsApp4, plateforme: { platform: 'win32', arch: 'x64' },
    });
  } finally { silence.desactiver(); }
  assert.equal(r4.ok, false);

  const rb = orchestrerRollback([r3.preuve]);
  assert.equal(rb.rapports.length, 1);
  assert.equal(rb.rapports[0].ok, false, 'un résidu non identifiable ne peut jamais être rendu comme un rollback réussi');
  assert.doesNotMatch(rb.rapports[0].raison, /TypeError/, 'GARDE 3 conçue : jamais une fuite d\'exception Node brute');
  assert.doesNotMatch(rb.rapports[0].raison, /\bnull\b/i, 'GARDE 3 conçue : jamais le mot "null" dans la raison rendue');
  assert.match(rb.rapports[0].raison, /residu Windows non identifiable/i);

  // MÊME construction, verbatim, que le tail de runInstall (install.js:826-833) — mode `events` :
  // chaque ligne NDJSON doit PARSER et ne contenir ni "TypeError" ni le mot "null".
  const lignes = [];
  const em = creerEmetteur({ mode: 'events', ecrire: (s) => lignes.push(s) });
  em.dire(`\n[rollback] ${rb.resume}`, {
    evt: 'rollback', etape: 4,
    champs: { resume: rb.resume, defaits: rb.defaits, nonDefaits: rb.nonDefaits, rapports: rb.rapports },
  });
  assert.equal(lignes.length, 1);
  const ligne = lignes[0];
  assert.doesNotMatch(ligne, /TypeError/, 'le contrat machine ne doit jamais porter de fuite d\'exception brute');
  let parsed;
  assert.doesNotThrow(() => { parsed = JSON.parse(ligne); }, 'la ligne NDJSON doit être PARSABLE (CA-M1)');
  assert.equal(parsed.evt, 'rollback');
  assert.equal(parsed.rapports[0].ok, false);
  assert.doesNotMatch(parsed.rapports[0].raison, /TypeError/);
  assert.doesNotMatch(parsed.rapports[0].raison, /\bnull\b/i);
  assert.match(parsed.rapports[0].raison, /residu Windows non identifiable/i);
});

test('AR-W8/CA-W17 : sur la plateforme Windows simulée (--events, mode "json"), tout evt/etat émis reste dans le vocabulaire FERMÉ — aucun état nouveau', async () => {
  const appsDir = tmp();
  const backupDir = tmp();
  const { app, resoudreEndpointsApp, telechargerApp } = scenarioWindowsValide({ appKey: 'IakaCockpit' });
  const installLocation = path.join(tmp(), 'IakaCockpitInstalle4');
  fs.mkdirSync(installLocation, { recursive: true });
  const poseFaite = { valeur: false };
  const execReg = fabriquerExecRegAvantApres({ installLocation, poseFaite });
  const execSetupWindows = () => { poseFaite.valeur = true; return { status: 0 }; };
  const em = creerEmetteur({ mode: 'json' });

  const r = await avecAppPatchee('IakaCockpit', app, () => etapeApp({
    numero: 3, appKey: 'IakaCockpit', values: { yes: true }, appsDir, backupDir,
    resoudreEndpointsApp, telechargerApp, plateforme: { platform: 'win32', arch: 'x64' },
    execReg, execSetupWindows, em,
  }));

  assert.equal(r.ok, true);
  assert.ok(em.evenements.length > 0, 'la chaîne Windows doit émettre des événements comme les chaînes macOS/Linux');
  const hors = [];
  for (const o of em.evenements) {
    if (!EVENEMENTS.includes(o.evt)) hors.push(o.evt);
    if (o.evt === 'etape-terminee' && !ETATS_ETAPE.includes(o.etat)) hors.push(`etat:${o.etat}`);
  }
  assert.deepEqual(hors, [], `valeur(s) hors vocabulaire émise(s) sur le chemin Windows : ${hors.join(', ')}`);
});
