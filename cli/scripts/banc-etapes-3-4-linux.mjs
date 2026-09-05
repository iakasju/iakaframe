#!/usr/bin/env node
// Banc de preuve CI — mesures LINUX des etapes 3/4 (CA-W19, specs/instructions/
// etapes-3-4-windows-linux.md § 5 Etape 3, § 8 tableau « gate humain par OS »).
//
// Appele UNIQUEMENT par .github/workflows/banc-etapes-3-4.yml sur `ubuntu-latest`,
// `workflow_dispatch`, JAMAIS declenche par un agent (AR-W7). Ce n'est PAS une suite
// `node --test` : c'est un banc de MESURE, dont le verdict alimente $GITHUB_STEP_SUMMARY et le
// code de sortie du job — un ecart avec ce que le code SUPPOSE (app-bundle.js, rollback.js) doit
// rougir NOMMEMENT, jamais un vert muet (consigne explicite de l'ordre de mission).
//
// L'API DU MODULE EST APPELEE DIRECTEMENT — RIEN N'EST REIMPLEMENTE ICI. `etapeApp`
// (src/commands/install.js, la MEME fonction que `runInstall`) et `restaurerEtape`
// (src/lib/rollback.js) sont invoques avec les PORTS REELS (aucune fonction reseau ni
// sous-processus injectee) : c'est le meme idiome que cli/test/install-etapes-3-4.test.js, sans
// les doubles de test. Bac a sable strict : `appsDir`/`backupDir` sous $RUNNER_TEMP UNIQUEMENT —
// jamais le dossier hote par defaut du CLI en production — verifie par `racineBacASable()`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { etapeApp } from '../src/commands/install.js';
import { restaurerEtape } from '../src/lib/rollback.js';
import { creerEmetteur } from '../src/lib/evenements.js';
import { ligne, ecrireResume, sha256Fichier, racineBacASable } from './lib/banc-support.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

if (os.platform() !== 'linux' || os.arch() !== 'x64') {
  console.error(`banc-etapes-3-4-linux.mjs : ce banc ne mesure QUE linux/x64 — plateforme reelle detectee : ${os.platform()}/${os.arch()}. Refus de continuer sur une plateforme qu'il ne sait pas interpreter.`);
  process.exit(1);
}

const base = racineBacASable();
const appsDir = fs.mkdtempSync(path.join(base, 'banc-linux-apps-'));
const backupDir = fs.mkdtempSync(path.join(base, 'banc-linux-backups-'));
const scratch = fs.mkdtempSync(path.join(base, 'banc-linux-scratch-'));
const rollbackDemande = process.env.BANC_ROLLBACK !== 'false';

const L = [];

async function poserReel({ appKey, numero }) {
  const evenements = [];
  const em = creerEmetteur({ mode: 'events', ecrire: (s) => evenements.push(JSON.parse(s)) });
  const r = await etapeApp({ numero, appKey, values: { yes: true }, appsDir, backupDir, em });
  return { r, evenements };
}

// --- 1) Pose reelle, NEUVE, des deux apps (reseau reel, minisign reel, ecriture reelle) --------
const cibleCockpit = path.join(appsDir, 'IakaCockpit.AppImage');
const cibleGui = path.join(appsDir, 'iakaFrameGUI.AppImage');

const { r: r3 } = await poserReel({ appKey: 'IakaCockpit', numero: 3 });
L.push(ligne(
  'IakaCockpit : pose NEUVE reelle (reseau ordonne M10 + minisign CA-14 + ecriture)',
  'ok:true, existaitAvant:false, fichier ecrit avec bit executable',
  `ok:${r3.ok}, existaitAvant:${r3.preuve && r3.preuve.existaitAvant}, existe:${fs.existsSync(cibleCockpit)}`,
  r3.ok && r3.preuve && r3.preuve.existaitAvant === false && fs.existsSync(cibleCockpit) ? 'PASS' : 'FAIL',
));
if (r3.ok) {
  const mode = fs.statSync(cibleCockpit).mode;
  L.push(ligne('IakaCockpit : bit d\'execution pose (chmod 0o755)', 'mode & 0o111 != 0', `mode=${(mode & 0o777).toString(8)}`, (mode & 0o111) !== 0 ? 'PASS' : 'FAIL'));
}

const { r: r4 } = await poserReel({ appKey: 'iakaFrameGUI', numero: 4 });
L.push(ligne(
  'iakaFrameGUI : pose NEUVE reelle (reseau ordonne M10 + minisign CA-14 + ecriture)',
  'ok:true, existaitAvant:false, fichier ecrit avec bit executable',
  `ok:${r4.ok}, existaitAvant:${r4.preuve && r4.preuve.existaitAvant}, existe:${fs.existsSync(cibleGui)}`,
  r4.ok && r4.preuve && r4.preuve.existaitAvant === false && fs.existsSync(cibleGui) ? 'PASS' : 'FAIL',
));

// --- 2) E-7 — FUSE 2 present ou non, et le contournement --appimage-extract (sans FUSE) --------
const ldconfig = spawnSync('ldconfig', ['-p'], { encoding: 'utf8' });
const fuse2Present = ldconfig.status === 0 && /libfuse\.so\.2\b/.test(ldconfig.stdout || '');
L.push(ligne('E-7 : FUSE 2 (libfuse.so.2) present sur ce runner', 'mesure, sans supposer', fuse2Present ? 'PRESENT' : 'ABSENT', 'NON-MESURE'));

let extraction = { status: null, stderr: '' };
if (r3.ok) {
  const dirExtraction = fs.mkdtempSync(path.join(scratch, 'extract-'));
  extraction = spawnSync(cibleCockpit, ['--appimage-extract'], { cwd: dirExtraction, encoding: 'utf8' });
  const squashfsRoot = path.join(dirExtraction, 'squashfs-root');
  const appRunPresent = fs.existsSync(path.join(squashfsRoot, 'AppRun'));
  L.push(ligne(
    'IakaCockpit.AppImage : `--appimage-extract` (contournement E-7, ne requiert PAS FUSE)',
    'code de sortie 0, squashfs-root/AppRun present',
    `code=${extraction.status}, AppRun=${appRunPresent}${fuse2Present ? '' : ' (FUSE 2 absent sur ce runner : c\'est PRECISEMENT le cas que ce contournement couvre)'}`,
    extraction.status === 0 && appRunPresent ? 'PASS' : 'FAIL',
  ));
}
L.push(ligne(
  'Lancement GUI complet de l\'AppImage (avec ou sans FUSE 2)',
  'gate humain — non prouvable ici',
  'NON TENTE : ce runner est headless (aucun serveur d\'affichage) — lancer reellement la GUI risquerait un blocage sans rapport avec FUSE. Le §8 de l\'instruction declare deja ce point comme gate humain ; ce banc ne le simule pas.',
  'NON-MESURE',
));

// --- 3) Rollback REEL, au sha256 : une AppImage PREEXISTANTE est RESTAUREE, jamais effacee -----
if (!rollbackDemande) {
  L.push(ligne('IakaCockpit : rollback REEL au sha256', 'entree `rollback=true` requise', 'DESACTIVE par l\'entree `rollback=false` du declenchement — non joue, non simule', 'NON-MESURE'));
} else if (r3.ok) {
  const contenuPreexistant = Buffer.from(`BANC-PREEXISTANT-${crypto.randomBytes(16).toString('hex')}`);
  fs.writeFileSync(cibleCockpit, contenuPreexistant);
  const shaAvant = sha256Fichier(cibleCockpit);

  const { r: r3b } = await poserReel({ appKey: 'IakaCockpit', numero: 3 });
  const shaApresPose = r3b.ok ? sha256Fichier(cibleCockpit) : null;
  const shaBackup = r3b.ok && r3b.preuve && r3b.preuve.backupPath ? sha256Fichier(r3b.preuve.backupPath) : null;
  L.push(ligne(
    'IakaCockpit : pose de REMPLACEMENT reelle sur une AppImage PREEXISTANTE (AR-5 garde 1)',
    `ok:true, existaitAvant:true, backup sha256=${shaAvant.slice(0, 12)}…`,
    `ok:${r3b.ok}, existaitAvant:${r3b.preuve && r3b.preuve.existaitAvant}, backup sha256=${shaBackup ? shaBackup.slice(0, 12) : 'absent'}…`,
    r3b.ok && r3b.preuve && r3b.preuve.existaitAvant === true && shaBackup === shaAvant ? 'PASS' : 'FAIL',
  ));
  L.push(ligne(
    'IakaCockpit : le contenu ecrit par la pose de remplacement diverge bien du preexistant',
    `sha256 different de ${shaAvant.slice(0, 12)}…`,
    shaApresPose ? `${shaApresPose.slice(0, 12)}…` : 'non mesure (pose en echec)',
    shaApresPose && shaApresPose !== shaAvant ? 'PASS' : 'FAIL',
  ));

  if (r3b.ok) {
    const rb = restaurerEtape(r3b.preuve);
    const shaApresRollback = fs.existsSync(cibleCockpit) ? sha256Fichier(cibleCockpit) : null;
    L.push(ligne(
      'IakaCockpit : rollback REEL (restaurerEtape, module reel) — restaure au sha256, jamais efface',
      `ok:true, defait:true, sha256 restaure == ${shaAvant.slice(0, 12)}… (le preexistant, PAS le neuf)`,
      `ok:${rb.ok}, defait:${rb.defait}, sha256=${shaApresRollback ? shaApresRollback.slice(0, 12) : 'fichier absent'}…, raison="${rb.raison}"`,
      rb.ok && rb.defait && shaApresRollback === shaAvant ? 'PASS' : 'FAIL',
    ));
  } else {
    L.push(ligne('IakaCockpit : rollback REEL — non tente', 'pose de remplacement doit reussir d\'abord', 'pose de remplacement en echec, rollback non tente', 'FAIL'));
  }
} else {
  L.push(ligne('IakaCockpit : rollback REEL au sha256', 'pose neuve doit reussir d\'abord', 'pose neuve en echec, rollback non tente', 'FAIL'));
}

// --- 4) Non-repli deb/rpm (CA-W6) — mesure sur le manifeste REEL, pas une fixture -----------------
// Rappel honnete : les manifestes reels servis par les deux apps PORTENT une entree AppImage
// exploitable (M5) — ce banc ne peut donc PAS declencher CA-W6 sur reseau reel sans fabriquer un
// manifeste, ce qui reviendrait a une fixture (deja couverte par cli/test/app-bundle.test.js). Ce
// critere reste couvert par les tests unitaires/chaines ; ce banc ne le duplique pas a l'identique.
L.push(ligne('CA-W6 (non-repli -deb/-rpm)', 'deja couvert par cli/test/app-bundle.test.js + install-etapes-3-4.test.js', 'hors perimetre de ce banc (ne peut pas se mesurer sur le manifeste REEL, qui porte une entree AppImage valide)', 'NON-MESURE'));

ecrireResume('Banc de preuve — Linux (etapes 3/4)', L);
