// Gardes de lib/rollback.js — les TROIS gardes d'AR-5(c) (specs/instructions/
// chaine-complete-install-amorcage-dmg-msi.md, § 4.0/§ 9, CA-11/CA-12/CA-13), en ISOLATION (fs
// pur, zero reseau, zero dependance a lib/app-bundle.js). Chaque garde est eprouvee par un
// CONTREFACTUEL qui la fait ROUGIR (« un contrefactuel doit pouvoir echouer »).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  sauvegarderAvantEtape, restaurerEtape, orchestrerRollback,
  ouvrirPreuveWindowsSansExistant, completerPreuveWindowsApresPose,
} from '../src/lib/rollback.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-rollback-')); }

test('CA-11, garde 1 (positif) : sauvegarde prise AVANT écriture, préservée intacte sur disque', () => {
  const racine = tmp();
  const cible = path.join(racine, 'App.app');
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'marker.txt'), 'contenu ORIGINAL');
  const backupDir = path.join(racine, 'backups');

  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible });
  assert.equal(preuve.existaitAvant, true);
  assert.ok(preuve.backupPath);
  assert.equal(fs.readFileSync(path.join(preuve.backupPath, 'marker.txt'), 'utf8'), 'contenu ORIGINAL');

  // simule l'ecriture de la nouvelle version (ce que ferait poserBundleDarwin)
  fs.writeFileSync(path.join(cible, 'marker.txt'), 'contenu NEUF');
  assert.equal(fs.readFileSync(path.join(preuve.backupPath, 'marker.txt'), 'utf8'), 'contenu ORIGINAL', 'la sauvegarde ne doit PAS être affectée par l\'écriture suivante');
});

test('CA-11, garde 1 (contrefactuel) : sauvegarde MANQUANTE -> le rollback REFUSE de dérouler, ne supprime RIEN', () => {
  const racine = tmp();
  const cible = path.join(racine, 'App.app');
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'marker.txt'), 'contenu ORIGINAL');
  const backupDir = path.join(racine, 'backups');
  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible });

  fs.writeFileSync(path.join(cible, 'marker.txt'), 'contenu NEUF'); // simule l'ecriture reelle

  // CONTREFACTUEL : on efface la sauvegarde annoncée par la preuve, comme si le disque l'avait
  // perdue entre-temps.
  fs.rmSync(preuve.backupPath, { recursive: true, force: true });

  const rapport = restaurerEtape(preuve);
  assert.equal(rapport.ok, false, 'CONTREFACTUEL : sauvegarde absente -> le rollback DOIT refuser, jamais supprimer à l\'aveugle');
  assert.match(rapport.raison, /REFUS.*sauvegarde attendue absente/);
  assert.equal(fs.readFileSync(path.join(cible, 'marker.txt'), 'utf8'), 'contenu NEUF', 'RIEN ne doit avoir été touché : ni supprimé, ni restauré à l\'aveugle');
});

test('CA-11, garde 1 (contrefactuel) : preuve.json introuvable -> le rollback REFUSE de dérouler', () => {
  const racine = tmp();
  const cible = path.join(racine, 'App.app');
  fs.mkdirSync(cible, { recursive: true });
  const backupDir = path.join(racine, 'backups');
  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible });

  // CONTREFACTUEL : le dossier de preuve entier disparaît (ex. purge externe du répertoire de
  // sauvegarde) — le rollback ne doit JAMAIS se fier à l'objet JS en mémoire seul.
  fs.rmSync(preuve.dossierPreuve, { recursive: true, force: true });

  const rapport = restaurerEtape(preuve);
  assert.equal(rapport.ok, false, 'CONTREFACTUEL : fichier de preuve disparu -> refus, jamais un rollback à l\'aveugle');
  assert.match(rapport.raison, /REFUS.*fichier de preuve introuvable/);
});

test('CA-11, garde 1 : aucune preuve fournie (null) -> refus explicite', () => {
  const rapport = restaurerEtape(null);
  assert.equal(rapport.ok, false);
  assert.match(rapport.raison, /REFUS.*aucune preuve/);
});

test('CA-12, garde 2 : une app DÉJÀ PRÉSENTE avant la chaîne est RESTAURÉE, jamais effacée', () => {
  const racine = tmp();
  const cible = path.join(racine, 'App.app');
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'marker.txt'), 'version PRÉ-EXISTANTE, posée par un tiers');
  const backupDir = path.join(racine, 'backups');

  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible });
  assert.equal(preuve.existaitAvant, true);

  fs.rmSync(cible, { recursive: true, force: true });
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'marker.txt'), 'version NEUVE, posée par la chaîne');

  const rapport = restaurerEtape(preuve);
  assert.equal(rapport.ok, true);
  assert.equal(rapport.defait, true);
  assert.match(rapport.raison, /restaure.*deja present.*jamais efface/);
  assert.equal(fs.readFileSync(path.join(cible, 'marker.txt'), 'utf8'), 'version PRÉ-EXISTANTE, posée par un tiers', 'garde 2 : le contenu PRÉ-EXISTANT doit être de retour, à l\'identique');
});

test('CA-12, garde 2 : RIEN n\'existait avant -> le rollback RETIRE ce que LA CHAÎNE a posé (jamais ce qu\'un tiers aurait posé, puisqu\'il n\'y avait personne)', () => {
  const racine = tmp();
  const cible = path.join(racine, 'App.app');
  const backupDir = path.join(racine, 'backups');

  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible }); // cible n'existe PAS encore
  assert.equal(preuve.existaitAvant, false);
  assert.equal(preuve.backupPath, null);

  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'marker.txt'), 'posé par la chaîne, rien avant');

  const rapport = restaurerEtape(preuve);
  assert.equal(rapport.ok, true);
  assert.equal(rapport.defait, true);
  assert.match(rapport.raison, /retire.*rien n'existait avant/);
  assert.equal(fs.existsSync(cible), false, 'garde 2 : ce que la chaîne a posé (et RIEN d\'autre n\'existait) doit disparaître');
});

test('CA-13, garde 3 : rollback COMPLET (toutes les étapes défaites) -> résumé ÉNUMÉRÉ, jamais un "tout restauré" muet', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cibleA = path.join(racine, 'IakaCockpit.app');
  const cibleB = path.join(racine, 'iakaFrameGUI.app');
  fs.mkdirSync(cibleA, { recursive: true }); // preexistant, pour varier des deux tests precedents
  const preuveA = sauvegarderAvantEtape({ backupDir, etape: 3, cible: cibleA });
  const preuveB = sauvegarderAvantEtape({ backupDir, etape: 4, cible: cibleB }); // rien n'existait

  fs.writeFileSync(path.join(cibleA, 'm.txt'), 'neuf'); // simule la pose reelle de l'etape 3
  fs.mkdirSync(cibleB, { recursive: true });
  fs.writeFileSync(path.join(cibleB, 'm.txt'), 'neuf'); // simule la pose reelle de l'etape 4

  const rb = orchestrerRollback([preuveA, preuveB]);
  assert.equal(rb.nonDefaits.length, 0);
  assert.deepEqual(rb.defaits, [4, 3], 'ordre INVERSE de l\'exécution : la dernière écrite est la première défaite');
  assert.doesNotMatch(rb.resume, /tout restauré/i, 'garde 3 : jamais la formule "tout restauré" — toujours une énumération');
  assert.match(rb.resume, /\[4, 3\]/);
});

test('CA-13, garde 3 (contrefactuel) : rollback PARTIEL -> le résumé ÉNONCE ce qui a été défait ET ce qui ne l\'a PAS été, jamais un succès global', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cibleA = path.join(racine, 'IakaCockpit.app');
  const cibleB = path.join(racine, 'iakaFrameGUI.app');
  fs.mkdirSync(cibleA, { recursive: true });
  const preuveA = sauvegarderAvantEtape({ backupDir, etape: 3, cible: cibleA }); // sauvegarde INTACTE
  const preuveB = sauvegarderAvantEtape({ backupDir, etape: 4, cible: cibleB }); // rien n'existait

  fs.writeFileSync(path.join(cibleA, 'm.txt'), 'neuf');
  fs.mkdirSync(cibleB, { recursive: true });
  fs.writeFileSync(path.join(cibleB, 'm.txt'), 'neuf');

  // CONTREFACTUEL : l'étape 4 perd sa preuve (simule un rollback qui échoue lui-même, AR-5 §3) —
  // l'étape 3, elle, reste parfaitement défaisable.
  fs.rmSync(preuveB.backupPath ? preuveB.backupPath : preuveB.dossierPreuve, { recursive: true, force: true });
  fs.rmSync(preuveB.dossierPreuve, { recursive: true, force: true });

  const rb = orchestrerRollback([preuveA, preuveB]);
  assert.equal(rb.defaits.length, 1, 'CONTREFACTUEL : une seule étape doit avoir pu être défaite');
  assert.equal(rb.nonDefaits.length, 1);
  assert.match(rb.resume, /PARTIEL/);
  assert.match(rb.resume, /jamais un "restaure" global/);
});

test('orchestrerRollback([]) : rien à défaire -> résumé explicite, pas un "tout restauré" vide de sens', () => {
  const rb = orchestrerRollback([null, undefined]);
  assert.equal(rb.rapports.length, 0);
  assert.match(rb.resume, /rien a defaire/);
});

// ==================================================================================================
// Lot ETAPES-3-4-WINDOWS-LINUX / W-W (Windows) — ajouts 2026-09-05. RIEN CI-DESSUS N'EST TOUCHE.
// ==================================================================================================

test('AR-W5, cas "une version existait" (§2.3 point 2) : sauvegarderAvantEtape({plateforme:"windows"}) restaure le DOSSIER, garde 3 énonce le RÉSIDU de registre/raccourcis', () => {
  const racine = tmp();
  const installLocation = path.join(racine, 'IakaCockpit');
  fs.mkdirSync(installLocation, { recursive: true });
  fs.writeFileSync(path.join(installLocation, 'app.exe'), 'ANCIENNE VERSION');
  const backupDir = path.join(racine, 'backups');

  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible: installLocation, plateforme: 'windows' });
  assert.equal(preuve.existaitAvant, true);
  assert.equal(preuve.plateforme, 'windows');

  // simule ce que ferait poserBundleWindows (l'installeur NSIS réécrit les fichiers en place)
  fs.writeFileSync(path.join(installLocation, 'app.exe'), 'NOUVELLE VERSION');

  const rapport = restaurerEtape(preuve);
  assert.equal(rapport.ok, true);
  assert.equal(fs.readFileSync(path.join(installLocation, 'app.exe'), 'utf8'), 'ANCIENNE VERSION', 'garde 2 : le dossier pré-existant doit être de retour');
  assert.match(rapport.raison, /restaure.*deja present.*jamais efface/, 'la formule EXISTANTE (macOS/Linux) doit rester intacte, juste suivie du résidu');
  assert.match(rapport.raison, /RESIDU NON RETABLI/, 'garde 3, second usage (AR-W5) : le résidu de registre/raccourcis doit être NOMMÉ');
  assert.doesNotMatch(rapport.raison, /^restaure.*jamais efface\)$/, 'précondition : le texte doit bien continuer après la parenthèse (le suffixe est concaténé, pas remplacé)');
});

test('AR-W5, cas "rien n\'existait avant" (§2.3 point 3) : ouvrirPreuveWindowsSansExistant + completerPreuveWindowsApresPose -> le rollback lance `uninstall.exe /S`, JAMAIS un rmSync du dossier', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit'); // simule le dossier que le NSIS a choisi lui-même

  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  assert.equal(preuveOuverte.existaitAvant, false);
  assert.equal(preuveOuverte.cible, null, 'AVANT la pose, la cible Windows "rien avant" est INCONNUE (E-4)');

  // simule la pose réelle (poserBundleWindows a exécuté le setup.exe) + la relecture du registre
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'app.exe'), 'posé par CETTE chaîne');
  const cheminUninstall = path.join(cible, 'uninstall.exe');
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall });
  assert.equal(preuve.cible, cible);
  assert.equal(preuve.windowsUninstall.chemin, cheminUninstall);

  let appelsDesinstalleur = 0;
  let argsRecus = null;
  const execDesinstalleur = (cmd, args) => {
    appelsDesinstalleur++;
    argsRecus = args;
    assert.equal(cmd, cheminUninstall);
    // le désinstalleur réel supprimerait les fichiers — on le simule pour prouver que c'est LUI
    // qui agit, jamais un `rmSync` direct du moteur de rollback.
    fs.rmSync(cible, { recursive: true, force: true });
    return { status: 0 };
  };

  const rapport = restaurerEtape(preuve, { execDesinstalleur });
  assert.equal(rapport.ok, true);
  assert.equal(appelsDesinstalleur, 1);
  assert.deepEqual(argsRecus, ['/S'], 'désinstallation SILENCIEUSE, E-5');
  assert.equal(fs.existsSync(cible), false);
  assert.match(rapport.raison, /desinstalle via/);
  assert.match(rapport.raison, /RESIDU NON RETABLI/, 'garde 3 : le résidu est énoncé aussi sur ce chemin');
  assert.doesNotMatch(rapport.raison, /retire :/, 'CONTREFACTUEL implicite : ce chemin ne doit JAMAIS emprunter la formule générique "retire :" (rmSync direct)');
});

test('AR-W5, CONTREFACTUEL : `uninstall.exe /S` rend un code NON NUL -> ÉCHEC NOMMÉ, jamais un succès supposé, garde 3 énonce', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  const cheminUninstall = path.join(cible, 'uninstall.exe');
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall });

  const execDesinstalleur = () => ({ status: 1 });
  const rapport = restaurerEtape(preuve, { execDesinstalleur });
  assert.equal(rapport.ok, false);
  assert.equal(rapport.defait, false);
  assert.match(rapport.raison, /ECHEC de la desinstallation/);
  assert.match(rapport.raison, /code 1/);
});

test('AR-W5, chaîné via orchestrerRollback : execDesinstalleur se propage à CHAQUE preuve Windows, comptage exact', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall: path.join(cible, 'uninstall.exe') });

  let appels = 0;
  const execDesinstalleur = () => { appels++; return { status: 0 }; };
  const rb = orchestrerRollback([preuve], { execDesinstalleur });
  assert.equal(appels, 1);
  assert.equal(rb.nonDefaits.length, 0);
  assert.deepEqual(rb.defaits, [3]);
});

test('sauvegarderAvantEtape SANS `plateforme` (macOS/Linux, appel PRÉ-EXISTANT) : le champ `plateforme` vaut `null`, AUCUN suffixe de résidu — comportement byte-identique à avant ce lot', () => {
  const racine = tmp();
  const cible = path.join(racine, 'App.app');
  fs.mkdirSync(cible, { recursive: true });
  const backupDir = path.join(racine, 'backups');
  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible });
  assert.equal(preuve.plateforme, null);
  const rapport = restaurerEtape(preuve);
  assert.doesNotMatch(rapport.raison, /RESIDU/, 'aucune preuve macOS/Linux ne doit jamais porter la mention du résidu Windows');
});
