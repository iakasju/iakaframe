// T6 - « Cadence » : la capture `close` est branchee sur le RITUEL D'ETAT DES LIEUX
// (instruction boucle-apprentissage-incrementale.md § 6, décision Q-2). Couvre :
//   - reason=pause    -> close INVOQUE (des propositions apparaissent si le transcript en contient) ;
//   - reason=version  -> close INVOQUE ;
//   - reason=reprise  -> close NON invoque (la reprise charge, elle ne capture pas) ;
//   - echec de close  -> l'etat des lieux REUSSIT quand meme (garantie non-bloquante) ;
//   - pilotage par config.yaml (cadence.close_on) : vider la liste desactive la cadence ;
//   - canon absent    -> ignore gracieusement (aucune creation par effet de bord).
// Aucun test n'ecrit dans le vrai ~/.iaka/ : le canon passe TOUJOURS par un tmpdir (--home / home).
// Le projet (etat des lieux) passe aussi par un tmpdir : jamais d'ecriture hors sandbox.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureLayout, loadConfig, writeConfig, defaultConfig } from '../src/lib/memory.js';
import { transcriptsDir, proposalsDir } from '../src/lib/close.js';
import { runCadence, formatCadence } from '../src/lib/cadence.js';
import { doSnapshot } from '../src/commands/snapshot.js';

const FIXED_NOW = new Date('2026-07-16T18:42:27Z');

// Canon tmpdir avec des transcripts de fixture (jamais le vrai ~/.iaka/).
function tmpCanon(files = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cadence-canon-'));
  ensureLayout(home);
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(transcriptsDir(home), name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  return home;
}

// Projet tmpdir pour l'etat des lieux (doSnapshot ecrit specs/ dedans).
function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cadence-proj-'));
}

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

// Compte les dossiers de proposition deposes dans le reservoir.
function proposalCount(home) {
  const d = proposalsDir(home);
  return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => fs.statSync(path.join(d, n)).isDirectory()).length : 0;
}

// Un transcript qui contient une correction repetee (>= N=2) -> une proposition memory attendue.
const REPEATED = {
  '2026-07-16--claude--x.md':
    '@correction registre-forgejo :: remote par défaut = Forgejo LAN, pas GitHub\n' +
    '@correction registre-forgejo :: remote par défaut = Forgejo LAN, pas GitHub\n',
};

// --- runCadence : coeur decisionnel (unite) --------------------------------------------------------

test('runCadence : reason=pause -> close INVOQUE (proposition déposée)', () => {
  const home = tmpCanon(REPEATED);
  try {
    const res = runCadence({ reason: 'pause', home });
    assert.equal(res.triggered, true);
    assert.equal(res.ok, true);
    assert.equal(res.report.emitted.length, 1);
    assert.equal(res.report.emitted[0].type, 'memory');
    assert.equal(proposalCount(home), 1);
  } finally { rm(home); }
});

test('runCadence : reason=version -> close INVOQUE', () => {
  const home = tmpCanon(REPEATED);
  try {
    const res = runCadence({ reason: 'version', home });
    assert.equal(res.triggered, true);
    assert.equal(res.ok, true);
    assert.equal(proposalCount(home), 1);
  } finally { rm(home); }
});

test('runCadence : reason=reprise -> close NON invoqué (aucune proposition)', () => {
  const home = tmpCanon(REPEATED);
  try {
    const res = runCadence({ reason: 'reprise', home });
    assert.equal(res.triggered, false);
    assert.equal(res.skipped, 'not-in-close-on');
    assert.equal(proposalCount(home), 0); // la reprise CHARGE, elle ne CAPTURE pas
  } finally { rm(home); }
});

test('runCadence : reason=manual -> close NON invoqué (hors close_on)', () => {
  const home = tmpCanon(REPEATED);
  try {
    const res = runCadence({ reason: 'manual', home });
    assert.equal(res.triggered, false);
    assert.equal(proposalCount(home), 0);
  } finally { rm(home); }
});

// --- Pilotage par config.yaml (cadence.close_on) --------------------------------------------------

test('runCadence : cadence.close_on pilote les motifs (liste vidée -> cadence désactivée)', () => {
  const home = tmpCanon(REPEATED);
  try {
    const cfg = { ...defaultConfig(), cadence: { close_on: [] } };
    writeConfig(home, cfg);
    assert.deepEqual(loadConfig(home).cadence.close_on, []);
    const res = runCadence({ reason: 'pause', home });
    assert.equal(res.triggered, false, 'close_on vide -> aucun motif ne déclenche');
    assert.equal(proposalCount(home), 0);
  } finally { rm(home); }
});

test('runCadence : cadence.close_on personnalisé (pause seul -> version ne déclenche plus)', () => {
  const home = tmpCanon(REPEATED);
  try {
    writeConfig(home, { ...defaultConfig(), cadence: { close_on: ['pause'] } });
    assert.equal(runCadence({ reason: 'version', home }).triggered, false);
    assert.equal(proposalCount(home), 0);
    assert.equal(runCadence({ reason: 'pause', home }).triggered, true);
    assert.equal(proposalCount(home), 1);
  } finally { rm(home); }
});

// --- Garantie NON-BLOQUANTE : un echec de close ne casse rien -------------------------------------

test('runCadence : un échec de close est NON bloquant (aucune exception, ok:false)', () => {
  const home = tmpCanon(REPEATED);
  try {
    const boom = () => { throw new Error('close en panne (simulé)'); };
    let res;
    assert.doesNotThrow(() => { res = runCadence({ reason: 'pause', home, closeFn: boom }); });
    assert.equal(res.triggered, true);
    assert.equal(res.ok, false);
    assert.match(res.error, /panne/);
  } finally { rm(home); }
});

test('runCadence : canon absent -> ignoré gracieusement (aucune création par effet de bord)', () => {
  // Home qui n'existe pas encore : ni config.yaml ni transcripts/ -> canon-absent.
  const home = path.join(os.tmpdir(), 'iaka-cadence-absent-' + Date.now());
  try {
    const res = runCadence({ reason: 'pause', home });
    assert.equal(res.triggered, false);
    assert.equal(res.skipped, 'canon-absent');
    assert.equal(fs.existsSync(home), false, 'le canon N\'est PAS créé par effet de bord');
  } finally { rm(home); }
});

test('runCadence : chemin sous ~/.claude/ refusé -> non bloquant (home-error)', () => {
  const home = path.join(os.homedir(), '.claude', 'memory');
  const res = runCadence({ reason: 'pause', home });
  assert.equal(res.triggered, false);
  assert.equal(res.skipped, 'home-error');
});

// --- Integration : la cadence est branchee dans doSnapshot (rituel d'etat des lieux) --------------

test('doSnapshot : --reason pause invoque close ; --reason reprise non', () => {
  const proj = tmpProject();
  const home = tmpCanon(REPEATED);
  try {
    // reprise : ne capture pas.
    const r1 = doSnapshot({ projectPath: proj, reason: 'reprise', home, cadenceRun: (o) => runCadence({ ...o }) });
    assert.equal(r1.cadence.triggered, false);
    assert.equal(proposalCount(home), 0);
    // l'etat des lieux est bien produit meme sans capture.
    assert.ok(fs.existsSync(path.join(proj, 'specs', 'etat-des-lieux.md')));

    // pause : capture.
    const r2 = doSnapshot({ projectPath: proj, reason: 'pause', home });
    assert.equal(r2.cadence.triggered, true);
    assert.equal(r2.cadence.ok, true);
    assert.equal(proposalCount(home), 1);
  } finally { rm(proj); rm(home); }
});

test('doSnapshot : un échec de la cadence ne casse PAS le rituel (état des lieux écrit quand même)', () => {
  const proj = tmpProject();
  try {
    // cadenceRun qui explose : le double filet de doSnapshot doit l'absorber.
    const r = doSnapshot({
      projectPath: proj, reason: 'version',
      cadenceRun: () => { throw new Error('cadence cassée (simulé)'); },
    });
    // Le rituel a REUSSI : etat des lieux MD + HTML presents.
    assert.ok(fs.existsSync(path.join(proj, 'specs', 'etat-des-lieux.md')));
    assert.ok(fs.existsSync(path.join(proj, 'specs', 'etat-des-lieux.html')));
    assert.equal(r.cadence.triggered, false);
    assert.equal(r.cadence.skipped, 'guarded');
  } finally { rm(proj); }
});

test('doSnapshot : cadence non-bloquante quand close échoue en profondeur (transcripts corrompu)', () => {
  const proj = tmpProject();
  const home = tmpCanon();
  try {
    // Remplace transcripts/ (dossier) par un FICHIER : close lèvera ENOTDIR au parcours.
    rm(transcriptsDir(home));
    fs.writeFileSync(transcriptsDir(home), 'pas un dossier\n', 'utf8');
    const r = doSnapshot({ projectPath: proj, reason: 'pause', home });
    // Le rituel reussit ; la cadence signale l'echec sans le propager.
    assert.ok(fs.existsSync(path.join(proj, 'specs', 'etat-des-lieux.md')));
    assert.equal(r.cadence.triggered, true);
    assert.equal(r.cadence.ok, false);
  } finally { rm(proj); rm(home); }
});

// --- formatCadence : rendu humain robuste (jamais d'exception) ------------------------------------

test('formatCadence : messages lisibles pour chaque issue', () => {
  assert.match(formatCadence({ triggered: true, ok: true, reason: 'pause', report: { emitted: [1, 2] } }), /close déclenché \(pause\).*2 proposition/);
  assert.match(formatCadence({ triggered: true, ok: false, reason: 'pause', error: 'x' }), /non bloquant/);
  assert.match(formatCadence({ triggered: false, skipped: 'not-in-close-on', reason: 'reprise', closeOn: ['pause', 'version'] }), /hors cadence.close_on/);
  assert.match(formatCadence({ triggered: false, skipped: 'canon-absent' }), /canon absent/);
  assert.match(formatCadence(null), /non évaluée/);
});
