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

test('AR-W5, cas "rien n\'existait avant" (§2.3 point 3) : ouvrirPreuveWindowsSansExistant + completerPreuveWindowsApresPose -> le rollback lance `uninstall.exe /S _?=<InstallLocation>`, RELIT le registre, JAMAIS un rmSync du dossier avant confirmation', () => {
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
  // AR-W20 (reprise post-mesure-réelle du 2026-09-06) : la clé de désinstallation est CONFIRMÉE
  // disparue par le port `execReg` — un `reg query` réel rend un code NON NUL quand la clé n'existe
  // plus (même format que `decouvrirInstallationWindows`, app-bundle.js).
  const execReg = () => ({ status: 1 });

  const rapport = restaurerEtape(preuve, { execDesinstalleur, execReg });
  assert.equal(rapport.ok, true);
  assert.equal(appelsDesinstalleur, 1);
  assert.deepEqual(argsRecus, ['/S', `_?=${cible}`], 'désinstallation SILENCIEUSE et SYNCHRONE (`_?=`, doc NSIS Chapter3.html), E-5 + garde 3 nouvelle');
  assert.equal(fs.existsSync(cible), false);
  assert.match(rapport.raison, /desinstalle via/);
  assert.match(rapport.raison, /cle de desinstallation confirmee disparue/);
  assert.match(rapport.raison, /RESIDU NON RETABLI/, 'garde 3 : le résidu est énoncé aussi sur ce chemin');
  assert.doesNotMatch(rapport.raison, /retire :/, 'CONTREFACTUEL implicite : ce chemin ne doit JAMAIS emprunter la formule générique "retire :" (rmSync direct)');
});

test('AR-W5, CONTREFACTUEL : `uninstall.exe /S _?=...` rend un code NON NUL -> ÉCHEC NOMMÉ, jamais un succès supposé, garde 3 énonce (registre jamais interrogé)', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  const cheminUninstall = path.join(cible, 'uninstall.exe');
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall });

  const execDesinstalleur = () => ({ status: 1 });
  let appelsReg = 0;
  const execReg = () => { appelsReg++; return { status: 1 }; };
  const rapport = restaurerEtape(preuve, { execDesinstalleur, execReg });
  assert.equal(rapport.ok, false);
  assert.equal(rapport.defait, false);
  assert.match(rapport.raison, /ECHEC de la desinstallation/);
  assert.match(rapport.raison, /code 1/);
  assert.equal(appelsReg, 0, 'un code de sortie non nul n\'a pas besoin d\'être confirmé par le registre : refus immédiat');
});

test('AR-W5, chaîné via orchestrerRollback : execDesinstalleur ET execReg se propagent à CHAQUE preuve Windows, comptage exact', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall: path.join(cible, 'uninstall.exe') });

  let appels = 0;
  let appelsReg = 0;
  const execDesinstalleur = () => { appels++; return { status: 0 }; };
  const execReg = () => { appelsReg++; return { status: 1 }; }; // clé disparue dès la première relecture
  const rb = orchestrerRollback([preuve], { execDesinstalleur, execReg });
  assert.equal(appels, 1);
  assert.equal(appelsReg, 1);
  assert.equal(rb.nonDefaits.length, 0);
  assert.deepEqual(rb.defaits, [3]);
});

// ==================================================================================================
// AR-W20 — reprise post-PREMIÈRE MESURE RÉELLE du banc CI Windows (2026-09-06, run `33997947501`,
// job `banc (windows-latest)`) : les DEUX lignes de mesure « Rollback REEL » sont tombées 🔴 FAIL —
// `restaurerEtape` rendait `ok:true, defait:true` alors que `sousClesRestantes=1` (la sous-clé de
// désinstallation était TOUJOURS PRÉSENTE juste après le retour de `uninstall.exe /S`, code 0).
// Cause confirmée par la documentation NSIS officielle (nsis.sourceforge.io/Docs/Chapter3.html,
// § « Command Line Parameters ») : SANS `_?=`, « the uninstaller [...] copies itself to the
// temporary directory and runs from there » et REND LA MAIN IMMÉDIATEMENT — le code de sortie 0
// mesuré n'atteste alors que le LANCEMENT de la copie temporaire, jamais la fin réelle de la
// désinstallation. `_?=<InstallLocation>` « stops the uninstaller from copying itself to the
// temporary directory and running from there » — exécution EN PLACE, et `spawnSync` (déjà
// utilisé par ce module) attend alors la fin RÉELLE du processus.
// ==================================================================================================

test('AR-W20 (reprise post-mesure-réelle du 2026-09-06, run CI 33997947501) : `uninstall.exe /S` rend code 0 IMMÉDIATEMENT (rejoue le DÉFAUT MESURÉ, doc NSIS Chapter3.html) mais le registre montre ENCORE la clé -> `restaurerEtape` REFUSE, ne déclare JAMAIS `defait:true`', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  const cheminUninstall = path.join(cible, 'uninstall.exe');
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall });

  // Double `execDesinstalleur` REJOUANT LE DÉFAUT MESURÉ : rend 0 immédiatement SANS avoir
  // réellement défait quoi que ce soit (asynchrone, comme un NSIS lancé sans `_?=`).
  const execDesinstalleur = () => ({ status: 0 });
  // Double `execReg` REJOUANT LA MESURE RÉELLE DU RUN CI 33997947501 : `sousClesRestantes=1`,
  // la sous-clé de désinstallation est TOUJOURS présente juste après le retour du désinstalleur.
  const execReg = () => ({ status: 0 }); // `reg query` réussit = la clé EXISTE encore
  const attendre = () => {}; // bornée, jamais une attente réelle dans un test

  const rapport = restaurerEtape(preuve, { execDesinstalleur, execReg, attendre });
  assert.equal(rapport.ok, false, 'DÉFAUT RÉEL DU RUN CI : un code 0 ne doit JAMAIS suffire à déclarer defait:true');
  assert.equal(rapport.defait, false);
  assert.match(rapport.raison, /desinstalleur lance, code 0, mais la cle de desinstallation est toujours presente/, 'raison CONÇUE verbatim (ordre de mission Aragorn)');
  assert.match(rapport.raison, /desinstallation NON confirmee/);
  assert.match(rapport.raison, /reprise manuelle/);
  assert.doesNotMatch(rapport.raison, /^desinstalle via/, 'jamais un "désinstallé" affirmatif tant que la clé est encore présente');
});

test('AR-W20, l\'appel au désinstalleur porte `_?=<InstallLocation>` (doc NSIS Chapter3.html : exécution EN PLACE et synchrone, jamais la copie vers %TEMP%)', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  const cheminUninstall = path.join(cible, 'uninstall.exe');
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall });

  let argsRecus = null;
  const execDesinstalleur = (cmd, args) => { argsRecus = args; return { status: 0 }; };
  const execReg = () => ({ status: 1 }); // clé disparue : confirmation immédiate
  restaurerEtape(preuve, { execDesinstalleur, execReg });
  assert.deepEqual(argsRecus, ['/S', `_?=${cible}`], '`_?=` DOIT porter l\'InstallLocation EXACT, dernier paramètre de la ligne de commande (doc NSIS)');
});

test('AR-W20, résidu du désinstalleur EN PLACE (`_?=` empêche l\'auto-suppression par copie vers %TEMP%, doc NSIS Chapter4.html § "Uninstall Section") : le rollback NOMME le résidu si le nettoyage best-effort échoue, sans jamais faire échouer le verdict de désinstallation déjà CONFIRMÉE', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const cible = path.join(racine, 'IakaCockpit');
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'uninstall.exe'), 'residu (jamais efface par lui-meme avec _?=, cf. doc NSIS)');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible, cheminUninstall: path.join(cible, 'uninstall.exe') });

  // simule le résidu DOCUMENTÉ : le désinstalleur a réellement désinstallé (clé disparue), mais
  // n'a PAS pu se supprimer lui-même (exécution en place, `_?=`) — le dossier reste sur le disque.
  const execDesinstalleur = () => ({ status: 0 });
  const execReg = () => ({ status: 1 }); // clé CONFIRMÉE disparue : la désinstallation réelle a eu lieu

  // CONTREFACTUEL : le nettoyage best-effort du résidu est rendu IMPOSSIBLE (dossier parent en
  // lecture seule) — pour prouver que l'échec du nettoyage est ÉNONCÉ, jamais masqué, et jamais
  // bloquant pour le verdict "désinstallation confirmée".
  fs.chmodSync(racine, 0o555);
  try {
    const rapport = restaurerEtape(preuve, { execDesinstalleur, execReg });
    assert.equal(rapport.ok, true, 'la désinstallation elle-même EST confirmée (clé disparue) : un résidu de nettoyage ne doit pas faire échouer ce verdict');
    assert.equal(rapport.defait, true);
    assert.match(rapport.raison, /RESIDU NON NETTOYE/, 'garde 3 : le résidu de nettoyage doit être NOMMÉ, jamais tu');
    assert.match(rapport.raison, /desinstalle via/);
  } finally {
    fs.chmodSync(racine, 0o755); // rétablit les droits pour que le bac à sable (tmp()) soit nettoyable
  }
});

// ==================================================================================================
// Reprise post-gate FAIL (2026-09-06) — cible Windows encore `null` au moment du rollback : la
// garde 3 doit ÉNONCER un résidu nommé, jamais laisser fuir une TypeError de `fs.rmSync(null, …)`.
// Cf. docs/qualite/gate-etapes-3-4-windows.md § Reprise demandée à Gimli, point 1.
// ==================================================================================================

test('AR-W5, cas (a) "pose échouée AVANT complétion de la preuve" (§2.3) : `restaurerEtape` sur une preuve ouverte par `ouvrirPreuveWindowsSansExistant` et JAMAIS complétée -> énoncé nommé, JAMAIS une TypeError, JAMAIS le mot "null"', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  // la pose a échoué AVANT que `completerPreuveWindowsApresPose` ne soit appelée (aucun uninstall.exe
  // connu, aucune cible connue) — exactement `install.js:663`, rollback immédiat de l'étape.
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  assert.equal(preuveOuverte.cible, null);
  assert.equal(preuveOuverte.windowsUninstall, null);

  const rapport = restaurerEtape(preuveOuverte);
  assert.equal(rapport.ok, false, 'un résidu non identifiable ne peut jamais être rendu comme un succès');
  assert.equal(rapport.defait, false);
  assert.doesNotMatch(rapport.raison, /TypeError/, 'GARDE 3 conçue : jamais une fuite d\'exception Node brute');
  assert.doesNotMatch(rapport.raison, /\bnull\b/i, 'GARDE 3 conçue : jamais le mot "null" dans la raison rendue');
  assert.match(rapport.raison, /residu Windows non identifiable/i, 'la garde 3 doit ÉNONCER nommément le résidu (AR-W5, §2.3 point 3)');
});

test('AR-W5, cas (b) "pose réussie mais InstallLocation introuvable après coup" (§2.3) : `restaurerEtape` sur une preuve complétée avec `cible:null` -> énoncé nommé, JAMAIS une TypeError, JAMAIS le mot "null"', () => {
  const racine = tmp();
  const backupDir = path.join(racine, 'backups');
  const preuveOuverte = ouvrirPreuveWindowsSansExistant({ backupDir, etape: 3 });
  // simule install.js:679-685 : la pose a RÉUSSI (setup.exe /S -> code 0) mais la relecture du
  // registre APRÈS coup ne rend aucun InstallLocation exploitable -> `cible` ET `cheminUninstall`
  // restent `null`, `windowsUninstall` devient un OBJET dont `.chemin` est `null` (jamais `null`
  // lui-même) — précisément le cas nommé par le commentaire d'`install.js:679-680`.
  const preuve = completerPreuveWindowsApresPose(preuveOuverte, { cible: null, cheminUninstall: null });
  assert.equal(preuve.cible, null);
  assert.deepEqual(preuve.windowsUninstall, { chemin: null });

  const rapport = restaurerEtape(preuve);
  assert.equal(rapport.ok, false);
  assert.equal(rapport.defait, false);
  assert.doesNotMatch(rapport.raison, /TypeError/, 'GARDE 3 conçue : jamais une fuite d\'exception Node brute');
  assert.doesNotMatch(rapport.raison, /\bnull\b/i, 'GARDE 3 conçue : jamais le mot "null" dans la raison rendue');
  assert.match(rapport.raison, /residu Windows non identifiable/i, 'la garde 3 doit ÉNONCER nommément le résidu (AR-W5, §2.3 point 3)');

  // même énoncé dans le rapport d'orchestrerRollback (le canal réellement consommé par
  // l'événement structuré `rollback`, install.js:826-830) — pas seulement l'appel direct.
  const rb = orchestrerRollback([preuve]);
  assert.equal(rb.rapports.length, 1);
  assert.equal(rb.rapports[0].ok, false);
  assert.doesNotMatch(rb.rapports[0].raison, /TypeError/);
  assert.doesNotMatch(rb.rapports[0].raison, /\bnull\b/i);
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
