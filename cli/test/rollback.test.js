// Gardes de lib/rollback.js — les TROIS gardes d'AR-5(c) (specs/instructions/
// chaine-complete-install-amorcage-dmg-msi.md, § 4.0/§ 9, CA-11/CA-12/CA-13), en ISOLATION (fs
// pur, zero reseau, zero dependance a lib/app-bundle.js). Chaque garde est eprouvee par un
// CONTREFACTUEL qui la fait ROUGIR (« un contrefactuel doit pouvoir echouer »).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sauvegarderAvantEtape, restaurerEtape, orchestrerRollback } from '../src/lib/rollback.js';

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
