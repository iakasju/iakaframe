// T3 - `open` : chargement du canon a l'ouverture, scope-agnostique (instruction
// boucle-apprentissage-incrementale.md § 5.1, Q-6). Couvre : `open` emet PROFIL+REGISTRE ; canon
// vide/absent -> sortie gracieuse (jamais de crash) ; --json structure ; resolution --home /
// IAKA_MEMORY_HOME ; anti-fragmentation (meme canon quel que soit le scope) ; rappel du reservoir ;
// et le BINDING Claude Code (existence + invoque bien `open`, sans dependre d'un vrai runtime Claude).
// Les tests N'ECRIVENT JAMAIS dans le vrai ~/.iaka/ : tout passe par un tmpdir via --home /
// IAKA_MEMORY_HOME. Le coeur agnostique ne doit contenir AUCUN symbole runner (verifie ci-dessous).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadCanon, renderCanon } from '../src/lib/open.js';
import { ensureLayout, memoryAdd } from '../src/lib/memory.js';
import { runOpen } from '../src/commands/open.js';
import { projectCanonHome, ensureProjectCanon, produitAdd } from '../src/lib/projectCanon.js';
import { sessionPath } from '../src/lib/projectSession.js';
import { runProjectCadence, formatProjectCadence } from '../src/lib/cadence.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const HOOK = path.join(HERE, '..', 'bindings', 'claude-code', 'session-start.mjs');

// Prepare un canon temporaire avec entrees optionnelles { profil?, registre? }.
function tmpCanon(entries = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-open-'));
  ensureLayout(home);
  for (const c of entries.profil || []) memoryAdd(home, 'profil', c);
  for (const c of entries.registre || []) memoryAdd(home, 'registre', c);
  return home;
}
const rm = (home) => fs.rmSync(home, { recursive: true, force: true });

// Capture console.log/console.error d'un appel synchrone (couche commande), sans polluer le runner.
function capture(fn) {
  const out = [], err = [];
  const ol = console.log, oe = console.error, ow = process.stdout.write.bind(process.stdout), code = process.exitCode;
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => err.push(a.join(' '));
  process.stdout.write = (s) => { out.push(String(s).replace(/\n$/, '')); return true; };
  try { fn(); } finally { console.log = ol; console.error = oe; process.stdout.write = ow; }
  const exitCode = process.exitCode;
  process.exitCode = code;
  return { out: out.join('\n'), err: err.join('\n'), exitCode };
}

// --- lib open : emet PROFIL + REGISTRE (invariant 1 : deux etats charges) -------------------------
test('open : charge PROFIL + REGISTRE du canon unique', () => {
  const home = tmpCanon({ profil: ['aime le MVP d\'abord'], registre: ['remote = Forgejo LAN'] });
  try {
    const canon = loadCanon(home);
    assert.equal(canon.ok, true);
    assert.equal(canon.empty, false);
    assert.match(canon.profil.content, /aime le MVP/);
    assert.match(canon.registre.content, /Forgejo LAN/);
    assert.equal(canon.profil.cap, 2000);
    assert.equal(canon.registre.cap, 3200);
    const text = renderCanon(canon);
    assert.match(text, /PROFIL/);
    assert.match(text, /REGISTRE/);
    assert.match(text, /aime le MVP/);
    assert.match(text, /remote = Forgejo LAN/);
  } finally { rm(home); }
});

// --- Canon vide (layout present mais aucune entree) -> gracieux -----------------------------------
test('open : canon vide (que les en-tetes) -> empty true, rendu « (vide) », pas de crash', () => {
  const home = tmpCanon();
  try {
    const canon = loadCanon(home);
    assert.equal(canon.ok, true);
    assert.equal(canon.empty, true);
    assert.equal(canon.profil.empty, true);
    assert.equal(canon.registre.empty, true);
    const text = renderCanon(canon);
    assert.match(text, /\(vide\)/);
    assert.match(text, /Canon vide/);
  } finally { rm(home); }
});

// --- Canon ABSENT (aucun fichier) -> gracieux (lecture seule, ne cree rien) ------------------------
test('open : canon absent -> gracieux, ne cree rien (lecture seule)', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-open-absent-'));
  try {
    const canon = loadCanon(home);
    assert.equal(canon.ok, true);
    assert.equal(canon.empty, true);
    assert.equal(canon.profil.chars, 0);
    assert.equal(canon.registre.chars, 0);
    // Lecture seule : `open` ne DOIT pas materialiser le canon.
    assert.equal(fs.existsSync(path.join(home, 'PROFIL.md')), false);
    assert.equal(fs.existsSync(path.join(home, 'REGISTRE.md')), false);
  } finally { rm(home); }
});

// --- Rappel du reservoir : propositions en-attente listees ----------------------------------------
test('open : rappelle les propositions en-attente du reservoir', () => {
  const home = tmpCanon({ profil: ['x'] });
  const propDir = path.join(home, 'proposals', '2026-07-16--memory--exemple');
  fs.mkdirSync(propDir, { recursive: true });
  fs.writeFileSync(path.join(propDir, 'proposal.md'),
    '---\ntype: memory\ntarget: registre\nslug: exemple\nstatus: en-attente\n---\npourquoi\n', 'utf8');
  try {
    const canon = loadCanon(home);
    assert.equal(canon.pending.length, 1);
    assert.equal(canon.pending[0].type, 'memory');
    assert.match(renderCanon(canon), /1 proposition\(s\) en attente/);
  } finally { rm(home); }
});

test('open : pending vide si proposals/ absent (best-effort, jamais bloquant)', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-open-nopr-'));
  try {
    const canon = loadCanon(home);
    assert.deepEqual(canon.pending, []);
  } finally { rm(home); }
});

// --- Anti-fragmentation : meme canon quel que soit le scope (critere 7) ---------------------------
test('open : meme canon injecte quel que soit le cwd (anti-fragmentation)', () => {
  const home = tmpCanon({ profil: ['fait structurant'], registre: ['convention apprise'] });
  const cwd0 = process.cwd();
  try {
    const dirA = fs.mkdtempSync(path.join(os.tmpdir(), 'scopeA-'));
    const dirB = fs.mkdtempSync(path.join(os.tmpdir(), 'scopeB-'));
    process.chdir(dirA);
    const a = renderCanon(loadCanon(home));
    process.chdir(dirB);
    const b = renderCanon(loadCanon(home));
    assert.equal(a, b); // diff NUL du profil/registre injecte entre deux scopes
    rm(dirA); rm(dirB);
  } finally { process.chdir(cwd0); rm(home); }
});

// --- Couche commande : --json structure { profil, registre, pending } -----------------------------
test('commande open : --json rend { ok, profil, registre, pending }', () => {
  const home = tmpCanon({ registre: ['ripgrep = moteur recall MVP'] });
  try {
    const { out, exitCode } = capture(() => runOpen(['--json', '--home', home]));
    const canon = JSON.parse(out);
    assert.equal(canon.ok, true);
    assert.equal(canon.home, home);
    assert.ok('profil' in canon && 'registre' in canon && 'pending' in canon);
    assert.match(canon.registre.content, /ripgrep = moteur recall MVP/);
    assert.notEqual(exitCode, 1);
  } finally { rm(home); }
});

// --- Couche commande : sortie texte lisible -------------------------------------------------------
test('commande open : sortie humaine emet le contenu du canon', () => {
  const home = tmpCanon({ profil: ['prefere le self-hosted'] });
  try {
    const { out } = capture(() => runOpen(['--home', home]));
    assert.match(out, /CANON PORTEFEUILLE/);
    assert.match(out, /prefere le self-hosted/);
  } finally { rm(home); }
});

// --- Resolution du chemin : IAKA_MEMORY_HOME (sans --home) -----------------------------------------
test('commande open : override par IAKA_MEMORY_HOME (sans --home)', () => {
  const home = tmpCanon({ profil: ['fait via env'] });
  const old = process.env.IAKA_MEMORY_HOME;
  process.env.IAKA_MEMORY_HOME = home;
  try {
    const { out } = capture(() => runOpen(['--json']));
    const canon = JSON.parse(out);
    assert.equal(canon.home, home);
    assert.match(canon.profil.content, /fait via env/);
  } finally {
    if (old === undefined) delete process.env.IAKA_MEMORY_HOME; else process.env.IAKA_MEMORY_HOME = old;
    rm(home);
  }
});

// --- Canon interdit sous ~/.claude/ (frontiere agnostique, herite de T1) ---------------------------
test('commande open : refuse un canon sous ~/.claude/ (exit 1)', () => {
  const forbidden = path.join(os.homedir(), '.claude', 'memory');
  const { exitCode, err } = capture(() => runOpen(['--home', forbidden]));
  assert.equal(exitCode, 1);
  assert.match(err, /\.claude/);
});

// --- Coeur AGNOSTIQUE : aucun symbole runner dans lib/open.js ni commands/open.js ------------------
test('open : le coeur agnostique ne mentionne AUCUN runner (Claude Code isole dans le binding)', () => {
  for (const f of ['../src/lib/open.js', '../src/commands/open.js']) {
    const src = fs.readFileSync(path.join(HERE, f), 'utf8');
    // On tolere le mot dans les COMMENTAIRES explicatifs, mais aucune reference de CODE a un runner.
    const codeOnly = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(codeOnly, /claude|codex|ollama|SessionStart/i, `symbole runner dans ${f}`);
  }
});

// --- Binding Claude Code : existe + invoque `open` (contrat leger, sans runtime Claude) ------------
test('binding : le hook session-start existe et est un script Node', () => {
  assert.equal(fs.existsSync(HOOK), true);
  const src = fs.readFileSync(HOOK, 'utf8');
  assert.match(src, /iakaframe|open/); // invoque bien le geste `open`
  assert.match(src, /SessionStart/);   // vise le hook SessionStart de Claude Code
});

test('binding : invoque `open` et emet additionalContext (contrat SessionStart)', () => {
  const home = tmpCanon({ profil: ['fait injecte via le binding'] });
  try {
    const res = spawnSync(process.execPath, [HOOK], {
      encoding: 'utf8',
      env: { ...process.env, IAKAFRAME_BIN: `${process.execPath} ${CLI}`, IAKA_MEMORY_HOME: home },
    });
    assert.equal(res.status, 0);
    const parsed = JSON.parse(res.stdout);
    assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.match(parsed.hookSpecificOutput.additionalContext, /fait injecte via le binding/);
  } finally { rm(home); }
});

test('binding : CLI absente -> non bloquant (exit 0, aucune sortie)', () => {
  const res = spawnSync(process.execPath, [HOOK], {
    encoding: 'utf8',
    env: { ...process.env, IAKAFRAME_BIN: 'iakaframe_absent_zzz' },
  });
  assert.equal(res.status, 0);       // ne bloque jamais l'ouverture de session
  assert.equal(res.stdout.trim(), ''); // pas de contexte -> greffon silencieux
});

// ===================================================================================================
// ARMEMENT DU MARQUEUR SUR LE CHEMIN REEL (instruction armement-marqueur-session-binding.md)
//
// LE DEFAUT FERME PAR CE LOT : `open --project` arme le marqueur de dette de cloture, mais le SEUL
// appelant automatique d'`open` (ce binding) ne passait JAMAIS `--project`. Le rattrapage etait donc
// correct mais INERTE. C-3 est le critere central : il verifie le chemin CABLE bout-en-bout, sans
// jamais appeler `open --project` a la main.
//
// DOCTRINE (AR-1 option B) : le binding fournit le CONTEXTE (ce que le runner declare de lui-meme),
// le coeur porte le JUGEMENT (« ce repertoire est-il un projet a canon ? » = projectCanonExists).
// C-8 verrouille l'absence d'heuristique dans le binding ; C-9 (plus haut) verrouille l'agnosticisme
// du coeur. Aucun test n'ecrit dans le vrai ~/.iaka/ : IAKA_MEMORY_HOME sur tmpdir.
// ===================================================================================================

// Projet FIXTURE : un vrai repertoire portant specs/canon/PRODUIT.md (le depot iakaframe lui-meme
// n'en a pas — cf. M-7 de l'instruction).
function tmpProject(entries = ['le canon projet apprend le PRODUIT']) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-projet-'));
  const home = projectCanonHome(dir);
  ensureProjectCanon(home);
  for (const c of entries) produitAdd(home, c);
  return dir;
}

// Invoque le HOOK comme le ferait le runner. `env` est construit EXPLICITEMENT (jamais herite tel
// quel) : une session Claude Code reelle peut deja poser CLAUDE_PROJECT_DIR dans l'environnement du
// test, ce qui fausserait les cas ou cette variable doit etre ABSENTE (C-4).
function runHook({ memoryHome, projectDir, input, stdio, bin } = {}) {
  const env = { ...process.env, IAKAFRAME_BIN: bin || `${process.execPath} ${CLI}` };
  delete env.CLAUDE_PROJECT_DIR;
  if (memoryHome) env.IAKA_MEMORY_HOME = memoryHome; else delete env.IAKA_MEMORY_HOME;
  if (projectDir !== undefined) env.CLAUDE_PROJECT_DIR = projectDir;
  const opts = { encoding: 'utf8', env, timeout: 20000 };
  if (stdio) opts.stdio = stdio; else opts.input = input === undefined ? '' : input;
  return spawnSync(process.execPath, [HOOK], opts);
}

const ctxOf = (res) => {
  if (!res.stdout || !res.stdout.trim()) return '';
  return JSON.parse(res.stdout).hookSpecificOutput.additionalContext;
};

// --- C-1 : CLAUDE_PROJECT_DIR -> canon PORTEFEUILLE *ET* canon PROJET ------------------------------
test('C-1 binding : CLAUDE_PROJECT_DIR -> additionalContext porte le portefeuille ET le PRODUIT', () => {
  const home = tmpCanon({ profil: ['fait de portefeuille'] });
  const projet = tmpProject(['le produit est une CLI multi-OS']);
  try {
    const res = runHook({ memoryHome: home, projectDir: projet });
    assert.equal(res.status, 0);
    const ctx = ctxOf(res);
    assert.match(ctx, /fait de portefeuille/);          // le canon portefeuille n'est JAMAIS perdu
    assert.match(ctx, /le produit est une CLI multi-OS/); // le canon projet S'AJOUTE
  } finally { rm(home); rm(projet); }
});

// --- C-2 : le marqueur est arme SUR LE CHEMIN BINDING (plus seulement a la main) -------------------
test('C-2 binding : le marqueur de session est arme (pending true) par le chemin cable', () => {
  const home = tmpCanon({ profil: ['x'] });
  const projet = tmpProject();
  try {
    const res = runHook({ memoryHome: home, projectDir: projet });
    assert.equal(res.status, 0);
    const marker = sessionPath(home, projet);
    assert.equal(fs.existsSync(marker), true, 'marqueur arme -> 1 fichier(s) attendu');
    assert.equal(JSON.parse(fs.readFileSync(marker, 'utf8')).pending, true);
  } finally { rm(home); rm(projet); }
});

// --- C-3 : LE CRITERE CENTRAL, BOUT-EN-BOUT -------------------------------------------------------
// Enchaine (1) le HOOK puis (2) une reprise. AUCUN `open --project` manuel n'intervient : c'est
// exactement la chaine qui etait rompue. Ce test ECHOUE sur 48828a1 et PASSE apres le correctif.
test('C-3 binding : hook puis reprise -> RATTRAPAGE declenche (bout-en-bout, sans open --project manuel)', () => {
  const home = tmpCanon({ profil: ['x'] });
  const projet = tmpProject();
  try {
    const res = runHook({ memoryHome: home, projectDir: projet });
    assert.equal(res.status, 0);

    const cadence = runProjectCadence({ projectPath: projet, reason: 'reprise', home });
    assert.equal(cadence.triggered, true, 'le rattrapage doit se declencher apres le hook');
    assert.equal(cadence.ok, true);
    assert.equal(cadence.mode, 'rattrapage');
    assert.match(formatProjectCadence(cadence), /rattrapage : clôture différée exécutée/);
  } finally { rm(home); rm(projet); }
});

// --- C-4 : la 2e source (payload stdin) fonctionne SEULE -------------------------------------------
test('C-4 binding : sans CLAUDE_PROJECT_DIR, le payload stdin {cwd} suffit (canon + marqueur)', () => {
  const home = tmpCanon({ profil: ['fait de portefeuille'] });
  const projet = tmpProject(['produit vu par le payload']);
  try {
    const payload = JSON.stringify({
      session_id: 'abc', transcript_path: '/tmp/t.jsonl',
      cwd: projet, hook_event_name: 'SessionStart', source: 'startup',
    });
    const res = runHook({ memoryHome: home, input: payload }); // CLAUDE_PROJECT_DIR absent
    assert.equal(res.status, 0);
    const ctx = ctxOf(res);
    assert.match(ctx, /fait de portefeuille/);
    assert.match(ctx, /produit vu par le payload/);
    assert.equal(fs.existsSync(sessionPath(home, projet)), true);
  } finally { rm(home); rm(projet); }
});

// --- C-5 : cwd HORS projet -> on ne seme RIEN ------------------------------------------------------
// Tient C-11 du lot A sur le chemin cable : sans cette garde, une session ouverte n'importe ou
// creerait un specs/canon/ par effet de bord — on en semerait partout.
test('C-5 binding : cwd hors projet -> portefeuille injecte, AUCUN canon projet ni marqueur cree', () => {
  const home = tmpCanon({ profil: ['fait de portefeuille'] });
  const nu = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-hors-projet-'));
  try {
    const res = runHook({ memoryHome: home, projectDir: nu });
    assert.equal(res.status, 0);
    assert.match(ctxOf(res), /fait de portefeuille/); // degradation vers `open` NU, pas vers le silence
    assert.equal(fs.existsSync(path.join(nu, 'specs')), false, 'aucun specs/canon/ seme hors projet');
    assert.equal(fs.existsSync(sessionPath(home, nu)), false, 'aucun marqueur hors projet');
    assert.deepEqual(fs.readdirSync(nu), [], 'le repertoire hors projet reste intact');
  } finally { rm(home); rm(nu); }
});

// --- C-6 : reprise SANS dette -> strictement rien (comportement du lot A, INCHANGE) ----------------
test('C-6 : reprise sans marqueur pendant -> skipped « aucune-dette » (inchange)', () => {
  const home = tmpCanon({ profil: ['x'] });
  const projet = tmpProject();
  try {
    const cadence = runProjectCadence({ projectPath: projet, reason: 'reprise', home });
    assert.equal(cadence.triggered, false);
    assert.equal(cadence.skipped, 'aucune-dette');
  } finally { rm(home); rm(projet); }
});

// --- C-7 : NON-BLOCAGE quoi qu'il arrive ----------------------------------------------------------
// Sept scenarios de defaillance. Dans (a)-(f) le canon PORTEFEUILLE reste injecte : on ne perd
// JAMAIS le canon global a cause du canon projet (degradation vers `open` NU, pas vers le silence).
test('C-7 binding : exit 0 et jamais de pendaison, sur les 7 modes de defaillance', () => {
  const home = tmpCanon({ profil: ['fait de portefeuille'] });
  const projet = tmpProject();
  const inexistant = path.join(os.tmpdir(), 'iaka-nexiste-pas-' + Date.now());
  try {
    const cas = [
      ['a stdin ferme (aucune entree)', { memoryHome: home, input: '' }, true],
      ['b stdio ignore', { memoryHome: home, stdio: ['ignore', 'pipe', 'pipe'] }, true],
      ['c stdin non-JSON', { memoryHome: home, input: 'pas du tout du json {{{' }, true],
      ['d payload JSON sans cwd', { memoryHome: home, input: '{"session_id":"a"}' }, true],
      ['e CLAUDE_PROJECT_DIR vide', { memoryHome: home, projectDir: '' }, true],
      ['f CLAUDE_PROJECT_DIR inexistant', { memoryHome: home, projectDir: inexistant }, true],
      ['g CLI absente', { memoryHome: home, bin: 'iakaframe_absent_zzz' }, false],
    ];
    for (const [label, opts, contexteAttendu] of cas) {
      const res = runHook(opts);
      assert.equal(res.status, 0, `${label} : doit sortir en 0`);
      assert.equal(res.signal, null, `${label} : ne doit jamais pendre (aucun timeout)`);
      if (contexteAttendu) {
        assert.match(ctxOf(res), /fait de portefeuille/, `${label} : le canon portefeuille reste injecte`);
      } else {
        assert.equal(res.stdout.trim(), '', `${label} : greffon silencieux`);
      }
    }
    // (f) ne doit rien creer sur un chemin inexistant.
    assert.equal(fs.existsSync(inexistant), false);
  } finally { rm(home); rm(projet); }
});

// --- C-8 : GARDE DE DOCTRINE (test de source) -----------------------------------------------------
// « Mince » cesse d'etre declaratif et devient VERIFIABLE. Le binding relaie le contexte declare par
// le runner ; il n'a le droit d'implementer AUCUNE heuristique de projet. Le seul juge du « est-ce un
// projet ? » reste le coeur (projectCanonExists).
test('C-8 binding : aucune heuristique de projet dans le binding (ni remontee, ni sonde)', () => {
  const src = fs.readFileSync(HOOK, 'utf8');
  assert.doesNotMatch(src, /\.\.[/\\]/, 'aucune remontee d\'arborescence');
  assert.doesNotMatch(src, /readdirSync|existsSync|statSync/, 'aucune sonde de systeme de fichiers');
  assert.doesNotMatch(src, /dirname|\bparse\s*\(\s*__|resolve\s*\([^)]*['"]\.\./, 'aucun parcours de chemins parents');
  assert.doesNotMatch(src, /\.git\b/, 'aucune detection de depot');
  assert.doesNotMatch(src, /specs/i, 'aucune connaissance du layout du canon projet');
  // La doctrine arbitree (AR-1 option B) est GRAVEE dans l'en-tete, pour que le prochain lecteur ne
  // re-pose pas la question.
  assert.match(src, /CONTEXTE/);
  assert.match(src, /JUGEMENT/);
});
