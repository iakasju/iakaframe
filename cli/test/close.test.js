// T4 - `close` : revue de cloture -> RESERVOIR de propositions typees (instruction
// boucle-apprentissage-incrementale.md § 5.3, § 7, § 8, Q-2). Couvre : correction repetee >= N ->
// proposition `memory` ; procedure recurrente >= N -> proposition `skill` ; occurrence unique (< N)
// -> AUCUNE proposition ; l'INVARIANT CENTRAL « close n'applique rien » (PROFIL/REGISTRE, skills,
// hooks, config INCHANGES) ; format --json ; artefacts prets ; point d'extension LLM (analyze
// injectable) ; anti-doublon au re-run ; --session. Deterministe SANS LLM : l'analyseur par regles
// est pur. Aucun test n'ecrit dans le vrai ~/.iaka/ : tout passe par un tmpdir (--home).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureLayout, statePath, loadConfig, writeConfig, defaultConfig } from '../src/lib/memory.js';
import {
  close, rulesAnalyzer, normalizeKey, slugify, looksLikeCorrection,
  proposalsDir, readEntries, selectTranscripts, transcriptsDir,
} from '../src/lib/close.js';
import { runClose } from '../src/commands/close.js';

// Canon temporaire avec des transcripts de fixture.
function tmpCanon(files = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-close-'));
  ensureLayout(home);
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(transcriptsDir(home), name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  return home;
}
const rm = (home) => fs.rmSync(home, { recursive: true, force: true });
const FIXED_NOW = new Date('2026-07-16T18:42:27Z');

// Liste les dossiers de proposition (tries).
function proposalDirs(home) {
  const d = proposalsDir(home);
  return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => fs.statSync(path.join(d, n)).isDirectory()).sort() : [];
}

function capture(fn) {
  const out = [], err = [];
  const ol = console.log, oe = console.error, code = process.exitCode;
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => err.push(a.join(' '));
  try { fn(); } finally { console.log = ol; console.error = oe; }
  const exitCode = process.exitCode;
  process.exitCode = code;
  return { out: out.join('\n'), err: err.join('\n'), exitCode };
}

// --- Acceptation § 5.3 : 1 correction repetee + 1 procedure repetee -> 1 memory + 1 skill ----------
test('close : correction répétée ≥ N -> proposition memory ; procédure récurrente -> proposition skill', () => {
  const home = tmpCanon({
    '2026-07-16--claude--iakaframe.md':
      '@correction registre-forgejo :: remote par défaut = Forgejo LAN, pas GitHub\n' +
      '@correction registre-forgejo :: remote par défaut = Forgejo LAN, pas GitHub\n' +
      '@procedure deploy-staging :: build image puis mise en stage rc\n' +
      '@procedure deploy-staging :: build image puis mise en stage rc\n',
  });
  try {
    const r = close(home, { now: FIXED_NOW });
    assert.equal(r.ok, true);
    assert.equal(r.emitted.length, 2);
    const byType = Object.fromEntries(r.emitted.map((p) => [p.type, p]));
    assert.ok(byType.memory, 'une proposition memory');
    assert.ok(byType.skill, 'une proposition skill');
    assert.equal(byType.memory.target, 'registre');
    assert.equal(byType.memory.occurrences, 2);
    assert.equal(byType.skill.occurrences, 2);

    // Le reservoir contient bien 2 dossiers <horodatage>--<type>--<slug>.
    const dirs = proposalDirs(home);
    assert.equal(dirs.length, 2);
    assert.ok(dirs.some((d) => /--memory--/.test(d)));
    assert.ok(dirs.some((d) => /--skill--/.test(d)));

    // Chaque proposition porte proposal.md (quoi/ou/pourquoi + statut en-attente) + un artefact.
    const memDir = path.join(proposalsDir(home), dirs.find((d) => /--memory--/.test(d)));
    const pm = fs.readFileSync(path.join(memDir, 'proposal.md'), 'utf8');
    assert.match(pm, /status: en-attente/);
    assert.match(pm, /## Pourquoi/);
    assert.match(pm, /Forgejo LAN/);
    const art = JSON.parse(fs.readFileSync(path.join(memDir, 'artifact', 'memory.json'), 'utf8'));
    assert.equal(art.op, 'add');
    assert.equal(art.target, 'registre');

    const skillDir = path.join(proposalsDir(home), dirs.find((d) => /--skill--/.test(d)));
    const skillMd = fs.readFileSync(path.join(skillDir, 'artifact', 'SKILL.md'), 'utf8');
    assert.match(skillMd, /^---/);
    assert.match(skillMd, /id: iakaframe-/);
  } finally { rm(home); }
});

// --- Occurrence unique (< N) -> AUCUNE proposition ------------------------------------------------
test('close : occurrence unique (< N) ne produit AUCUNE proposition', () => {
  const home = tmpCanon({
    '2026-07-16--claude--x.md':
      '@correction seule :: mentionnée une seule fois\n' +
      '@procedure aussi-seule :: vue une seule fois\n',
  });
  try {
    const r = close(home, { now: FIXED_NOW });
    assert.equal(r.emitted.length, 0);
    assert.equal(proposalDirs(home).length, 0);
  } finally { rm(home); }
});

// --- INVARIANT CENTRAL : close n'applique RIEN ----------------------------------------------------
test('close : invariant « rien ne s\'applique » (PROFIL/REGISTRE/config inchangés, aucun skill créé)', () => {
  const home = tmpCanon({
    '2026-07-16--claude--x.md':
      '@correction(profil) style-concis :: Stéphane préfère des réponses concises\n' +
      '@correction(profil) style-concis :: Stéphane préfère des réponses concises\n' +
      '@procedure faire-truc :: étape a puis b\n@procedure faire-truc :: étape a puis b\n',
  });
  const profilBefore = fs.readFileSync(statePath(home, 'profil'), 'utf8');
  const registreBefore = fs.readFileSync(statePath(home, 'registre'), 'utf8');
  const configBefore = fs.readFileSync(path.join(home, 'config.yaml'), 'utf8');
  try {
    const r = close(home, { now: FIXED_NOW });
    assert.equal(r.emitted.length, 2);
    // Etats plafonnes, config : STRICTEMENT inchanges (aucune ecriture hors proposals/).
    assert.equal(fs.readFileSync(statePath(home, 'profil'), 'utf8'), profilBefore);
    assert.equal(fs.readFileSync(statePath(home, 'registre'), 'utf8'), registreBefore);
    assert.equal(fs.readFileSync(path.join(home, 'config.yaml'), 'utf8'), configBefore);
    // La proposition profil vise bien PROFIL (trait du decideur) mais ne l'ecrit pas.
    const mem = r.emitted.find((p) => p.type === 'memory');
    assert.equal(mem.target, 'profil');
    // Aucun skill materialise ailleurs que dans le reservoir : proposals/ est le SEUL endroit ecrit.
    const touched = fs.readdirSync(home).sort();
    assert.deepEqual(touched, ['PROFIL.md', 'REGISTRE.md', 'config.yaml', 'proposals', 'transcripts']);
  } finally { rm(home); }
});

// --- Format --json (couche commande) --------------------------------------------------------------
test('commande close : --json rend un rapport structuré', () => {
  const home = tmpCanon({
    '2026-07-16--claude--x.md':
      '@correction c1 :: toujours committer en conventional commits\n' +
      '@correction c1 :: toujours committer en conventional commits\n',
  });
  try {
    const { out, exitCode } = capture(() => runClose(['--json', '--home', home]));
    const report = JSON.parse(out);
    assert.equal(report.ok, true);
    assert.equal(report.emitted.length, 1);
    assert.equal(report.emitted[0].type, 'memory');
    assert.equal(report.analyzed.files, 1);
    assert.notEqual(exitCode, 1);
  } finally { rm(home); }
});

// --- Seuil N paramétrable via config.yaml ---------------------------------------------------------
test('close : le seuil N est lu depuis config.yaml (N=3 -> une paire ne suffit plus)', () => {
  const home = tmpCanon({
    '2026-07-16--claude--x.md':
      '@correction c :: fait répété deux fois\n@correction c :: fait répété deux fois\n',
  });
  const cfg = { ...defaultConfig(), repeat_threshold: 3 };
  writeConfig(home, cfg);
  try {
    assert.equal(loadConfig(home).repeat_threshold, 3);
    const r = close(home, { now: FIXED_NOW });
    assert.equal(r.emitted.length, 0); // 2 < 3
  } finally { rm(home); }
});

// --- Point d'extension LLM : analyze injectable (même signature que les règles) --------------------
test('close : l\'analyseur est injectable (point d\'extension LLM isolé)', () => {
  const home = tmpCanon({ '2026-07-16--claude--x.md': 'prose libre sans signal\n' });
  try {
    // Un analyseur factice « façon LLM » qui renvoie une correction repétée.
    const fakeAnalyze = () => ({
      corrections: new Map([['x', {
        key: 'x', target: 'registre', label: 'leçon dérivée par un modèle',
        evidence: [{ rel: 'a', line: 1, text: 'a' }, { rel: 'a', line: 2, text: 'b' }],
      }]]),
      procedures: new Map(),
    });
    const r = close(home, { now: FIXED_NOW, analyze: fakeAnalyze });
    assert.equal(r.emitted.length, 1);
    assert.equal(r.emitted[0].type, 'memory');
  } finally { rm(home); }
});

// --- Anti-doublon : re-run ne re-propose pas une proposition déjà en attente -----------------------
test('close : re-run n\'écrit pas de doublon (proposition déjà en-attente ignorée)', () => {
  const home = tmpCanon({
    '2026-07-16--claude--x.md':
      '@correction dup :: même correction\n@correction dup :: même correction\n',
  });
  try {
    const r1 = close(home, { now: FIXED_NOW });
    assert.equal(r1.emitted.length, 1);
    const r2 = close(home, { now: new Date('2026-07-16T19:00:00Z') });
    assert.equal(r2.emitted.length, 0);
    assert.equal(r2.skipped.length, 1);
    assert.equal(proposalDirs(home).length, 1); // toujours un seul dossier
  } finally { rm(home); }
});

// --- --session limite le rejeu à un transcript ----------------------------------------------------
test('close : --session limite le rejeu à un seul transcript', () => {
  const home = tmpCanon({
    'a.md': '@correction a :: dans A\n@correction a :: dans A\n',
    'b.md': '@correction b :: dans B\n@correction b :: dans B\n',
  });
  try {
    const r = close(home, { now: FIXED_NOW, session: 'a.md' });
    assert.equal(r.analyzed.files, 1);
    assert.equal(r.emitted.length, 1);
    assert.match(r.emitted[0].dir, /--memory--a$/);
  } finally { rm(home); }
});

// --- Heuristique de redressement (prose FR), déterministe -----------------------------------------
test('close : détecteur heuristique de redressement (répété) -> proposition memory', () => {
  const home = tmpCanon({
    '2026-07-16--claude--x.md':
      'Stephane: non, le remote par defaut est Forgejo\n' +
      'Stephane: non, le remote par defaut est Forgejo\n',
  });
  try {
    const r = close(home, { now: FIXED_NOW });
    assert.equal(r.emitted.length, 1);
    assert.equal(r.emitted[0].type, 'memory');
  } finally { rm(home); }
});

// --- Sous-dossier odin/ (miroir #odin) est bien miné ---------------------------------------------
test('close : mine aussi transcripts/odin/ (source #odin)', () => {
  const home = tmpCanon({
    'odin/2026-07-16--odin--arb.md':
      '@correction odin-rule :: arbitrage: MVP d\'abord\n@correction odin-rule :: arbitrage: MVP d\'abord\n',
  });
  try {
    const r = close(home, { now: FIXED_NOW });
    assert.equal(r.emitted.length, 1);
    assert.equal(r.emitted[0].type, 'memory');
  } finally { rm(home); }
});

// --- Helpers purs (déterminisme des règles) -------------------------------------------------------
test('rulesAnalyzer : compte les occurrences par clé normalisée', () => {
  const entries = [
    { rel: 'x', line: 1, text: '@correction Ma-Clé :: A' },
    { rel: 'x', line: 2, text: '@correction  ma  cle  :: A bis' },
  ];
  const { corrections } = rulesAnalyzer(entries);
  assert.equal(corrections.size, 1); // « Ma-Clé » et « ma  cle » -> même clé normalisée
  assert.equal([...corrections.values()][0].evidence.length, 2);
});

test('normalizeKey / slugify : normalisation déterministe', () => {
  assert.equal(normalizeKey('Forgejo  LAN, pas GitHub!'), 'forgejo lan pas github');
  assert.equal(slugify('Déploiement en STAGING (rc)'), 'deploiement-en-staging-rc');
  assert.equal(slugify(''), 'entree');
});

test('looksLikeCorrection : reconnaît des tournures de redressement FR', () => {
  assert.equal(looksLikeCorrection('non, pas comme ça'), true);
  assert.equal(looksLikeCorrection('je t\'ai déjà dit d\'utiliser Forgejo'), true);
  assert.equal(looksLikeCorrection('voici le résultat attendu'), false);
});

// --- readEntries / selectTranscripts (lecture du substrat neutre) ---------------------------------
test('selectTranscripts : tout l\'arbre par défaut, un seul fichier si --session', () => {
  const home = tmpCanon({ 'a.md': 'x\n', 'sub/b.md': 'y\n' });
  try {
    assert.equal(selectTranscripts(home).length, 2);
    assert.equal(selectTranscripts(home, 'a.md').length, 1);
    assert.equal(selectTranscripts(home, 'introuvable.md').length, 0);
  } finally { rm(home); }
});
