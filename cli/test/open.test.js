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
