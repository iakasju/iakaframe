#!/usr/bin/env node
// Banc de preuve CI — mesures WINDOWS des etapes 3/4 (CA-W19, specs/instructions/
// etapes-3-4-windows-linux.md § 5 Etape 3, § 0.4 « mesure la plus importante du lot », § 8).
//
// Appele UNIQUEMENT par .github/workflows/banc-etapes-3-4.yml sur `windows-latest`,
// `workflow_dispatch`, JAMAIS declenche par un agent (AR-W7). Banc de MESURE, pas une suite
// `node --test` : verdict imprime dans $GITHUB_STEP_SUMMARY, code de sortie 1 si une mesure
// diverge de ce que le code SUPPOSE (app-bundle.js:`decouvrirInstallationWindows`,
// rollback.js:`restaurerEtape`) — R-W9 (« le nom de la sous-cle n'est pas etabli ») est
// PRECISEMENT ce que ce banc mesure enfin pour de vrai.
//
// API DU MODULE APPELEE DIRECTEMENT (etapeApp, restaurerEtape) avec les PORTS REELS. Les seuls
// wrappers ci-dessous NE REIMPLEMENTENT RIEN : ils appellent le VRAI `spawnSync` et se contentent
// d'en garder une copie du resultat pour l'affichage (code de sortie, duree) — meme idiome que
// M-10 (`execReg`/`execSetupWindows` sont des points d'injection DEJA prevus par le code de
// production, jamais un second chemin).
//
// HONNETETE UAC (a lire avant les mesures ci-dessous) : le compte d'execution des runners
// `windows-latest` de GitHub Actions est membre du groupe Administrateurs. Un NSIS `currentUser`
// (AR-W1(a)) ne demande donc PAS d'elevation ici — mais un installeur qui EN AURAIT demande une
// n'aurait PAS non plus fait apparaitre d'invite UAC (pas de session interactive), et aurait
// simplement reussi silencieusement puisque le compte a deja les droits. CE BANC NE PEUT DONC PAS
// PROUVER l'ABSENCE d'UAC pour un utilisateur non-administrateur — seul un signal STRUCTUREL
// (l'installation atterrit sous %LOCALAPPDATA%, jamais Program Files) est mesurable ici ; la
// preuve complete reste un gate humain sur un compte Windows standard (§8).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { etapeApp } from '../src/commands/install.js';
import { restaurerEtape } from '../src/lib/rollback.js';
import { decouvrirInstallationWindows } from '../src/lib/app-bundle.js';
import { creerEmetteur } from '../src/lib/evenements.js';
import { ligne, ecrireResume, sha256Dossier, racineBacASable } from './lib/banc-support.mjs';

if (os.platform() !== 'win32' || os.arch() !== 'x64') {
  console.error(`banc-etapes-3-4-windows.mjs : ce banc ne mesure QUE win32/x64 — plateforme reelle detectee : ${os.platform()}/${os.arch()}. Refus de continuer sur une plateforme qu'il ne sait pas interpreter.`);
  process.exit(1);
}

const base = racineBacASable();
const appsDir = fs.mkdtempSync(path.join(base, 'banc-win-apps-'));
const backupDir = fs.mkdtempSync(path.join(base, 'banc-win-backups-'));
const BASE_UNINSTALL = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall';
const rollbackDemande = process.env.BANC_ROLLBACK !== 'false';
const L = [];

// --- Instrumentation des ports REELS (le VRAI spawnSync est appele, jamais remplace) -----------
const mesuresSetup = [];
function execSetupWindowsInstrumente(cmd, args) {
  const debut = Date.now();
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  mesuresSetup.push({ cmd, args, status: res.status, dureeMs: Date.now() - debut });
  return res;
}
const mesuresDesinstalleur = [];
function execDesinstalleurInstrumente(cmd, args) {
  const debut = Date.now();
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  mesuresDesinstalleur.push({ cmd, args, status: res.status, dureeMs: Date.now() - debut });
  return res;
}
// AJOUT reprise AR-W5(a), précision uninstall synchrone (2026-09-06, post PREMIERE MESURE REELLE de ce banc, run 33997947501) :
// `restaurerEtape` relit desormais le registre APRES le retour du desinstalleur (§ specs/
// instructions/etapes-3-4-windows-linux.md, CA-W11 reprise) — ce double n'est PAS un second
// chemin, c'est le MEME `reg.exe` reel que `regQueryBrut` ci-dessous, juste instrumente pour
// mesurer combien de relectures ont ete necessaires (idem M-10 : le VRAI spawnSync est appele).
const mesuresRelectureRegistre = [];
function execRegInstrumente(cmd, args) {
  const debut = Date.now();
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  mesuresRelectureRegistre.push({ cmd, args, status: res.status, dureeMs: Date.now() - debut });
  return res;
}

async function poserReel({ appKey, numero }) {
  const evenements = [];
  const em = creerEmetteur({ mode: 'events', ecrire: (s) => evenements.push(JSON.parse(s)) });
  const r = await etapeApp({
    numero, appKey, values: { yes: true }, appsDir, backupDir, em,
    execSetupWindows: execSetupWindowsInstrumente,
  });
  return { r, evenements };
}

function regQueryBrut(cle, args = []) {
  return spawnSync('reg', ['query', cle, ...args], { encoding: 'utf8' });
}

/** Cherche, dans une liste EXHAUSTIVE des sous-cles (`reg query <base> /s`), le nom EXACT de la
 * sous-cle dont le chemin contient `nomApp` (insensible a la casse) — jamais suppose egal a
 * `nomApp`, MESURE : c'est precisement R-W9. */
function trouverSousCleExacte(nomApp) {
  const res = regQueryBrut(BASE_UNINSTALL, ['/s']);
  const lignes = (res.stdout || '').split(/\r?\n/);
  const trouvees = lignes
    .map((l) => l.trim())
    .filter((l) => l.startsWith('HKEY_CURRENT_USER') && l.toLowerCase().includes(nomApp.toLowerCase()));
  return { brut: res, sousCles: trouvees };
}

function valeurBrute(cle, nomValeur) {
  const res = regQueryBrut(cle, ['/v', nomValeur]);
  if (res.status !== 0) return { existe: false, ligneBrute: null };
  const m = (res.stdout || '').match(new RegExp(`${nomValeur}\\s+REG_SZ\\s+(.*)`, 'i'));
  return { existe: true, ligneBrute: m ? m[0].trim() : null, valeur: m ? m[1].trim() : null };
}

// =================================================================================================
// SCENARIO A — IakaCockpit, RIEN N'EXISTAIT AVANT (§ 2.3 point 2 « rien avant »)
// =================================================================================================

const avantA = trouverSousCleExacte('IakaCockpit');
L.push(ligne('Baseline : aucune cle IakaCockpit pre-existante avant ce banc', '0 sous-cle trouvee', `${avantA.sousCles.length} trouvee(s) : ${avantA.sousCles.join(' ; ') || '(aucune)'}`, avantA.sousCles.length === 0 ? 'PASS' : 'NON-MESURE'));

const { r: rA } = await poserReel({ appKey: 'IakaCockpit', numero: 3 });
const setupA = mesuresSetup[mesuresSetup.length - 1];
L.push(ligne(
  'IakaCockpit (scenario A) : pose reelle via setup.exe /S (reseau ordonne + minisign + NSIS silencieux)',
  'ok:true, existaitAvant:false, windowsUninstall.chemin connu, code de sortie setup.exe = 0',
  `ok:${rA.ok}, existaitAvant:${rA.preuve && rA.preuve.existaitAvant}, uninstall=${rA.preuve && rA.preuve.windowsUninstall && rA.preuve.windowsUninstall.chemin}, codeSetup=${setupA && setupA.status} (${setupA ? setupA.dureeMs : '?'} ms)`,
  rA.ok && rA.preuve && rA.preuve.existaitAvant === false && rA.preuve.windowsUninstall && rA.preuve.windowsUninstall.chemin ? 'PASS' : 'FAIL',
));

let installLocationA = null;
let cheminUninstallA = null;
let shaV1 = null;
if (rA.ok) {
  const apresA = trouverSousCleExacte('IakaCockpit');
  const sousCleExacte = apresA.sousCles[0] || null;
  const assumee = `HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\IakaCockpit`;
  L.push(ligne(
    'R-W9 : nom EXACT de la sous-cle creee par le NSIS (mesure, jamais devinee)',
    `1 sous-cle, egale a ce que le code suppose ("${assumee}")`,
    `${apresA.sousCles.length} trouvee(s) : ${apresA.sousCles.join(' ; ') || '(aucune)'}`,
    apresA.sousCles.length === 1 && sousCleExacte === assumee ? 'PASS' : 'FAIL',
  ));

  if (sousCleExacte) {
    const installLoc = valeurBrute(sousCleExacte, 'InstallLocation');
    const uninstallStr = valeurBrute(sousCleExacte, 'UninstallString');
    L.push(ligne('InstallLocation BRUT (avec ses guillemets litteraux, jamais nettoye a cette etape)', 'valeur REG_SZ lisible', installLoc.ligneBrute || '(absente/illisible)', installLoc.existe && installLoc.ligneBrute ? 'PASS' : 'FAIL'));
    L.push(ligne('UninstallString BRUT', 'valeur REG_SZ lisible', uninstallStr.ligneBrute || '(absente/illisible)', uninstallStr.existe && uninstallStr.ligneBrute ? 'PASS' : 'FAIL'));

    const decouverte = decouvrirInstallationWindows({ productName: 'IakaCockpit' });
    installLocationA = decouverte.installLocation;
    const localAppData = process.env.LOCALAPPDATA || null;
    const attendu = localAppData ? path.join(localAppData, 'IakaCockpit') : null;
    L.push(ligne(
      'Chemin reel sous %LOCALAPPDATA% (comparaison au module `decouvrirInstallationWindows`, guillemets retires)',
      attendu || '(LOCALAPPDATA absent de l\'environnement)',
      installLocationA || '(non decouvert)',
      attendu && installLocationA && path.normalize(installLocationA).toLowerCase() === path.normalize(attendu).toLowerCase() ? 'PASS' : 'FAIL',
    ));

    if (installLocationA) {
      cheminUninstallA = path.join(installLocationA, 'uninstall.exe');
      L.push(ligne(
        'uninstall.exe present, et son chemin concorde avec preuve.windowsUninstall.chemin',
        `${cheminUninstallA} existe, == ${rA.preuve.windowsUninstall.chemin}`,
        `existe=${fs.existsSync(cheminUninstallA)}, preuve=${rA.preuve.windowsUninstall.chemin}`,
        fs.existsSync(cheminUninstallA) && path.normalize(rA.preuve.windowsUninstall.chemin).toLowerCase() === path.normalize(cheminUninstallA).toLowerCase() ? 'PASS' : 'FAIL',
      ));
      try { shaV1 = sha256Dossier(installLocationA); } catch { shaV1 = null; }
    }
  }

  // Rollback REEL — scenario A, « rien n'existait avant » (uninstall.exe /S _?=<InstallLocation>,
  // AR-W5(a), précision uninstall synchrone) -----------------------------------------------------------------------------------
  if (!rollbackDemande) {
    L.push(ligne('Rollback REEL (scenario A)', 'entree `rollback=true` requise', 'DESACTIVE par l\'entree `rollback=false` du declenchement — non joue, non simule', 'NON-MESURE'));
  } else {
    const avantRelecturesA = mesuresRelectureRegistre.length;
    const rbA = restaurerEtape(rA.preuve, { execDesinstalleur: execDesinstalleurInstrumente, execReg: execRegInstrumente });
    const appelUninstallA = mesuresDesinstalleur[mesuresDesinstalleur.length - 1];
    const relecturesA = mesuresRelectureRegistre.length - avantRelecturesA;
    const apresRollbackA = trouverSousCleExacte('IakaCockpit');
    L.push(ligne(
      'Rollback REEL (scenario A, uninstall.exe /S _?=<InstallLocation> via `restaurerEtape` module reel, AR-W5(a), précision uninstall synchrone)',
      'ok:true, defait:true, code de sortie uninstall.exe = 0, cle DISPARUE ET confirmee par relecture du module',
      `ok:${rbA.ok}, defait:${rbA.defait}, codeUninstall=${appelUninstallA && appelUninstallA.status}, relecturesRegistre=${relecturesA}, sousClesRestantes=${apresRollbackA.sousCles.length}, raison="${rbA.raison}"`,
      rbA.ok && rbA.defait && apresRollbackA.sousCles.length === 0 ? 'PASS' : 'FAIL',
    ));
  }
} else {
  L.push(ligne('Scenario A : mesures suivantes', 'pose reelle doit reussir d\'abord', 'pose en echec — R-W9, InstallLocation, rollback non mesures', 'FAIL'));
}

// =================================================================================================
// SCENARIO B — IakaCockpit, UNE VERSION EXISTAIT DEJA (§ 2.3 point 2 « existait »). DEPEND du
// rollback du scenario A (qui remet le registre a « rien installe ») : DESACTIVE si
// `rollback=false`, plutot que de fausser la mesure « pose neuve » du prealable.
// =================================================================================================

if (!rollbackDemande) {
  L.push(ligne('Scenario B (existait avant) + rollback de dossier', 'entree `rollback=true` requise', 'DESACTIVE par l\'entree `rollback=false` (depend du rollback du scenario A pour repartir d\'un registre vide) — non joue, non simule', 'NON-MESURE'));
} else {
  let shaAvantRemplacement = null;
  let installLocationB = null;
  const { r: rB1 } = await poserReel({ appKey: 'IakaCockpit', numero: 3 }); // pose neuve (A a tout desinstalle)
  if (rB1.ok) {
    const dec = decouvrirInstallationWindows({ productName: 'IakaCockpit' });
    installLocationB = dec.installLocation;
    if (installLocationB) { try { shaAvantRemplacement = sha256Dossier(installLocationB); } catch { shaAvantRemplacement = null; } }
  }
  L.push(ligne(
    'Scenario B, prealable : pose neuve (apres desinstallation du scenario A)',
    'ok:true, dossier installe, sha256 mesurable',
    `ok:${rB1.ok}, installLocation=${installLocationB}, sha=${shaAvantRemplacement ? shaAvantRemplacement.slice(0, 12) : 'non mesure'}…`,
    rB1.ok && installLocationB && shaAvantRemplacement ? 'PASS' : 'FAIL',
  ));
  if (shaV1 && shaAvantRemplacement) {
    L.push(ligne(
      'Determinisme : deux poses REELLES independantes de la meme version (scenario A puis B) rendent le meme contenu',
      `sha256 identiques (${shaV1.slice(0, 12)}…)`,
      `A=${shaV1.slice(0, 12)}…, B=${shaAvantRemplacement.slice(0, 12)}…`,
      shaV1 === shaAvantRemplacement ? 'PASS' : 'FAIL',
    ));
  }

  if (rB1.ok && installLocationB && shaAvantRemplacement) {
    const { r: rB2 } = await poserReel({ appKey: 'IakaCockpit', numero: 3 }); // pose de REMPLACEMENT
    let shaBackupDossier = null;
    if (rB2.ok && rB2.preuve && rB2.preuve.backupPath) {
      try { shaBackupDossier = sha256Dossier(rB2.preuve.backupPath); } catch { shaBackupDossier = null; }
    }
    L.push(ligne(
      'IakaCockpit (scenario B) : pose de REMPLACEMENT sur une version DEJA installee (AR-5 garde 1, dossier decouvert par le registre)',
      `ok:true, existaitAvant:true, backup sha256 == ${shaAvantRemplacement.slice(0, 12)}…`,
      `ok:${rB2.ok}, existaitAvant:${rB2.preuve && rB2.preuve.existaitAvant}, backup sha256=${shaBackupDossier ? shaBackupDossier.slice(0, 12) : 'absent'}…`,
      rB2.ok && rB2.preuve && rB2.preuve.existaitAvant === true && shaBackupDossier === shaAvantRemplacement ? 'PASS' : 'FAIL',
    ));

    if (rB2.ok) {
      const rbB = restaurerEtape(rB2.preuve, { execDesinstalleur: execDesinstalleurInstrumente });
      let shaApresRollbackB = null;
      try { shaApresRollbackB = sha256Dossier(installLocationB); } catch { shaApresRollbackB = null; }
      L.push(ligne(
        'Rollback REEL (scenario B, restauration du DOSSIER via `restaurerEtape` module reel) — sha256 du dossier restaure',
        `ok:true, defait:true, sha256 restaure == ${shaAvantRemplacement.slice(0, 12)}… (residu de registre ENONCE, jamais retabli)`,
        `ok:${rbB.ok}, defait:${rbB.defait}, sha256=${shaApresRollbackB ? shaApresRollbackB.slice(0, 12) : 'dossier absent'}…, residuEnonce=${/RESIDU NON RETABLI/.test(rbB.raison)}`,
        rbB.ok && rbB.defait && shaApresRollbackB === shaAvantRemplacement && /RESIDU NON RETABLI/.test(rbB.raison) ? 'PASS' : 'FAIL',
      ));

      // Nettoyage best-effort du runner (le residu de registre reste ENONCE, pas retabli — la
      // desinstallation ci-dessous est une HYGIENE de fin de job, jamais une pretention d'avoir
      // « tout restaure ») : `restaurerEtape` du scenario B ne restaure QUE le dossier, jamais le
      // registre — sans ce geste, la cle de desinstallation resterait pointer vers un dossier dont
      // le contenu a change entre-temps.
      if (installLocationB) {
        const cheminUninstallB = path.join(installLocationB, 'uninstall.exe');
        if (fs.existsSync(cheminUninstallB)) spawnSync(cheminUninstallB, ['/S'], { encoding: 'utf8' });
      }
    }
  }
}

// =================================================================================================
// iakaFrameGUI — pose neuve + rollback (couverture des DEUX apps, profondeur asymetrique assumee :
// le cycle complet A/B est demontre une fois sur IakaCockpit ; le mecanisme est le MEME code pour
// les deux apps, cf. app-bundle.js — dupliquer les 2 scenarios ici doublerait le temps de banc sans
// mesurer un chemin de code different).
// =================================================================================================

const { r: rGui } = await poserReel({ appKey: 'iakaFrameGUI', numero: 4 });
if (rGui.ok) {
  const trouve = trouverSousCleExacte('iakaFrameGUI');
  L.push(ligne(
    'iakaFrameGUI : pose reelle + sous-cle de registre trouvee',
    'ok:true, 1 sous-cle trouvee',
    `ok:${rGui.ok}, sousCles=${trouve.sousCles.length} (${trouve.sousCles.join(' ; ') || 'aucune'})`,
    rGui.ok && trouve.sousCles.length === 1 ? 'PASS' : 'FAIL',
  ));
  if (!rollbackDemande) {
    L.push(ligne('iakaFrameGUI : rollback REEL', 'entree `rollback=true` requise', 'DESACTIVE par l\'entree `rollback=false` — non joue, non simule (runner laisse tel quel)', 'NON-MESURE'));
  } else {
    const avantRelecturesGui = mesuresRelectureRegistre.length;
    const rbGui = restaurerEtape(rGui.preuve, { execDesinstalleur: execDesinstalleurInstrumente, execReg: execRegInstrumente });
    const relecturesGui = mesuresRelectureRegistre.length - avantRelecturesGui;
    const apresGui = trouverSousCleExacte('iakaFrameGUI');
    L.push(ligne(
      'iakaFrameGUI : rollback REEL (uninstall.exe /S _?=<InstallLocation>, AR-W5(a), précision uninstall synchrone)',
      'ok:true, defait:true, cle DISPARUE ET confirmee par relecture du module',
      `ok:${rbGui.ok}, defait:${rbGui.defait}, relecturesRegistre=${relecturesGui}, sousClesRestantes=${apresGui.sousCles.length}`,
      rbGui.ok && rbGui.defait && apresGui.sousCles.length === 0 ? 'PASS' : 'FAIL',
    ));
  }
} else {
  L.push(ligne('iakaFrameGUI : pose reelle', 'ok:true', `ok:${rGui.ok}`, 'FAIL'));
}

// --- CA-W9 mesure pour de vrai : --apps-dir n'a JAMAIS ete ecrit par aucune des poses Windows ---
const contenuAppsDir = fs.readdirSync(appsDir);
L.push(ligne('CA-W9 : `--apps-dir` sans effet — rien n\'y a jamais ete ecrit', '0 entree', `${contenuAppsDir.length} entree(s) : ${contenuAppsDir.join(', ') || '(vide)'}`, contenuAppsDir.length === 0 ? 'PASS' : 'FAIL'));

// --- Honnetete UAC (cf. cartouche en tete de fichier) -------------------------------------------
const whoami = spawnSync('whoami', ['/groups'], { encoding: 'utf8' });
const estAdmin = whoami.status === 0 && /S-1-5-32-544/.test(whoami.stdout || '');
L.push(ligne(
  'Absence d\'UAC pour un utilisateur NON-ADMINISTRATEUR',
  'gate humain — non prouvable sur ce runner',
  `compte d'execution du runner membre du groupe Administrateurs : ${estAdmin} — un signal STRUCTUREL (installation sous %LOCALAPPDATA%, jamais Program Files) est mesure ci-dessus, mais ne prouve pas l'absence d'invite UAC sur un compte standard`,
  'NON-MESURE',
));

ecrireResume('Banc de preuve — Windows (etapes 3/4)', L);
