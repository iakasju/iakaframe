// T1 - Fondations du canon (instruction boucle-apprentissage-incrementale.md § 4.1-4.4).
// Couvre : resolution du chemin (defaut + override IAKA_MEMORY_HOME, refus sous ~/.claude/),
// creation du layout, config.yaml (load/write + round-trip), et l'outil memory add/replace/remove
// avec plafond DUR + declenchement de consolidation a ~80 %. Aucun test n'ecrit dans le vrai
// ~/.iaka/ : tout passe par un repertoire temporaire (IAKA_MEMORY_HOME / --home).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resolveMemoryHome, defaultMemoryHome, isUnderClaudeHome,
  ensureLayout, loadConfig, writeConfig, defaultConfig, configPath, statePath,
  memoryAdd, memoryReplace, memoryRemove, memoryList,
  parseYaml, serializeYaml, measure,
} from '../src/lib/memory.js';

function tmpHome() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-canon-')); }

// --- Resolution du chemin (§ 4.1, Q-1) ------------------------------------------------------------
test('chemin : defaut = ~/.iaka/memory/ (niveau home)', () => {
  const old = process.env.IAKA_MEMORY_HOME;
  delete process.env.IAKA_MEMORY_HOME;
  try {
    assert.equal(resolveMemoryHome(), path.join(os.homedir(), '.iaka', 'memory'));
    assert.equal(defaultMemoryHome(), path.join(os.homedir(), '.iaka', 'memory'));
  } finally { if (old === undefined) delete process.env.IAKA_MEMORY_HOME; else process.env.IAKA_MEMORY_HOME = old; }
});

test('chemin : override par IAKA_MEMORY_HOME', () => {
  const old = process.env.IAKA_MEMORY_HOME;
  const dir = tmpHome();
  process.env.IAKA_MEMORY_HOME = dir;
  try { assert.equal(resolveMemoryHome(), path.resolve(dir)); }
  finally { if (old === undefined) delete process.env.IAKA_MEMORY_HOME; else process.env.IAKA_MEMORY_HOME = old; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('chemin : param --home prime sur l\'env', () => {
  const old = process.env.IAKA_MEMORY_HOME;
  process.env.IAKA_MEMORY_HOME = '/env/canon';
  const dir = tmpHome();
  try { assert.equal(resolveMemoryHome(dir), path.resolve(dir)); }
  finally { if (old === undefined) delete process.env.IAKA_MEMORY_HOME; else process.env.IAKA_MEMORY_HOME = old; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('chemin : REFUS sous ~/.claude/ (substrat neutre, jamais couple a un runner)', () => {
  const under = path.join(os.homedir(), '.claude', 'memory');
  assert.equal(isUnderClaudeHome(under), true);
  assert.equal(isUnderClaudeHome(path.join(os.homedir(), '.iaka', 'memory')), false);
  assert.throws(() => resolveMemoryHome(under), /~\/\.claude/);
});

// --- Layout (§ 4.2) -------------------------------------------------------------------------------
test('layout : cree la disposition attendue (non destructif)', () => {
  const home = tmpHome();
  try {
    const created = ensureLayout(home);
    assert.ok(created.length > 0);
    for (const rel of ['PROFIL.md', 'REGISTRE.md', 'transcripts', 'transcripts/odin', 'proposals', 'config.yaml']) {
      assert.ok(fs.existsSync(path.join(home, rel)), `manque : ${rel}`);
    }
    // Ne DOIT pas creer les stubs post-MVP (T9) : provider.json / index/.
    assert.equal(fs.existsSync(path.join(home, 'provider.json')), false);
    assert.equal(fs.existsSync(path.join(home, 'index')), false);
    // Idempotent : un second appel ne recree rien.
    assert.deepEqual(ensureLayout(home), []);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

// --- config.yaml (§ 4.3-4.4, Q-3/Q-4/Q-5) ---------------------------------------------------------
test('config : defauts graves (plafonds maison, seuil 80 %, N=2, write_approval auto)', () => {
  const home = tmpHome();
  try {
    ensureLayout(home);
    const cfg = loadConfig(home);
    assert.equal(cfg.caps.profil, 2000);
    assert.equal(cfg.caps.registre, 3200);
    assert.equal(cfg.consolidation_threshold, 0.8);
    assert.equal(cfg.repeat_threshold, 2);
    assert.equal(cfg.write_approval, 'auto');
    assert.deepEqual(cfg.cadence.close_on, ['pause', 'version']);
    assert.equal(cfg.provider.kind, 'none');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('config : round-trip serialize/parse (YAML maison, nesting + listes flow)', () => {
  const cfg = defaultConfig();
  cfg.caps.profil = 1500;
  cfg.write_approval = 'queue';
  const round = parseYaml(serializeYaml(cfg));
  assert.equal(round.caps.profil, 1500);
  assert.equal(round.caps.registre, 3200);
  assert.equal(round.consolidation_threshold, 0.8);
  assert.equal(round.write_approval, 'queue');
  assert.deepEqual(round.cadence.close_on, ['pause', 'version']);
  assert.equal(round.provider.kind, 'none');
});

test('config : ecriture puis relecture depuis le disque, valeurs parametrables', () => {
  const home = tmpHome();
  try {
    const cfg = defaultConfig();
    cfg.caps.registre = 4096;
    cfg.repeat_threshold = 3;
    writeConfig(home, cfg);
    assert.ok(fs.existsSync(configPath(home)));
    const reloaded = loadConfig(home);
    assert.equal(reloaded.caps.registre, 4096);
    assert.equal(reloaded.repeat_threshold, 3);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

// --- Outil memory : add / replace / remove (§ 4.4) ------------------------------------------------
test('memory add : ajoute une entree datee, idempotent sur le contenu', () => {
  const home = tmpHome();
  try {
    const r1 = memoryAdd(home, 'registre', 'utiliser node --test, zero dep');
    assert.equal(r1.ok, true);
    assert.equal(r1.changed, true);
    assert.deepEqual(memoryList(home, 'registre'), ['utiliser node --test, zero dep']);
    // Ecrit une puce datee dans le fichier.
    assert.match(fs.readFileSync(statePath(home, 'registre'), 'utf8'), /^- \d{4}-\d{2}-\d{2} — utiliser node --test/m);
    // Idempotent : re-ajout du meme contenu -> no-op.
    const r2 = memoryAdd(home, 'registre', 'utiliser node --test, zero dep');
    assert.equal(r2.changed, false);
    assert.equal(memoryList(home, 'registre').length, 1);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('memory replace : remplace une entree existante ; erreur si absente', () => {
  const home = tmpHome();
  try {
    memoryAdd(home, 'profil', 'prefere le francais');
    const r = memoryReplace(home, 'profil', 'prefere le francais', 'prefere le francais pour la doc');
    assert.equal(r.ok, true);
    assert.deepEqual(memoryList(home, 'profil'), ['prefere le francais pour la doc']);
    const miss = memoryReplace(home, 'profil', 'inexistant', 'x');
    assert.equal(miss.ok, false);
    assert.equal(miss.reason, 'not-found');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('memory remove : retire une entree, idempotent si absente', () => {
  const home = tmpHome();
  try {
    memoryAdd(home, 'registre', 'ligne A');
    memoryAdd(home, 'registre', 'ligne B');
    const r = memoryRemove(home, 'registre', 'ligne A');
    assert.equal(r.ok, true);
    assert.equal(r.changed, true);
    assert.deepEqual(memoryList(home, 'registre'), ['ligne B']);
    // Idempotent : retrait d'une entree absente = no-op OK.
    const r2 = memoryRemove(home, 'registre', 'ligne A');
    assert.equal(r2.ok, true);
    assert.equal(r2.changed, false);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('memory : cible invalide rejetee', () => {
  const home = tmpHome();
  try { assert.throws(() => memoryAdd(home, 'autre', 'x'), /Cible invalide/); }
  finally { fs.rmSync(home, { recursive: true, force: true }); }
});

// --- Plafond DUR + consolidation a ~80 % (§ 4.3) --------------------------------------------------
test('plafond : flag de consolidation des ~80 % de capacite', () => {
  const home = tmpHome();
  try {
    // Plafond de test au-dessus de l'overhead d'en-tete, mais assez bas pour franchir 80 % vite.
    writeConfig(home, { ...defaultConfig(), caps: { profil: 2000, registre: 800 } });
    const soft = Math.floor(800 * 0.8); // 640
    // Sous 80 % : pas de flag.
    let r = memoryAdd(home, 'registre', 'x'.repeat(20));
    assert.equal(r.ok, true);
    assert.equal(r.consolidationNeeded, false);
    assert.ok(r.length < soft, `length=${r.length}`);
    // Franchit 80 % : flag leve, mais applique (sous le plafond dur).
    r = memoryAdd(home, 'registre', 'y'.repeat(500));
    assert.equal(r.ok, true);
    assert.equal(r.consolidationNeeded, true);
    assert.ok(r.length >= soft && r.length <= 800, `length=${r.length}`);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('plafond DUR : une croissance au-dela du plafond est REFUSEE -> consolidation requise', () => {
  const home = tmpHome();
  try {
    writeConfig(home, { ...defaultConfig(), caps: { profil: 2000, registre: 800 } });
    memoryAdd(home, 'registre', 'z'.repeat(300));
    const before = fs.readFileSync(statePath(home, 'registre'), 'utf8');
    const r = memoryAdd(home, 'registre', 'w'.repeat(500)); // ferait exploser le plafond
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'cap-exceeded');
    assert.equal(r.consolidationNeeded, true);
    assert.ok(r.length > r.cap);
    // Rien n'a ete ecrit : le fichier est inchange (le refus protege le plafond).
    assert.equal(fs.readFileSync(statePath(home, 'registre'), 'utf8'), before);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('plafond respecte : wc -c du fichier <= plafond (invariant 1)', () => {
  const home = tmpHome();
  try {
    ensureLayout(home);
    const cfg = loadConfig(home);
    memoryAdd(home, 'profil', 'Stephane, decideur iakaframe, prefere le francais et le MVP');
    const profil = fs.readFileSync(statePath(home, 'profil'), 'utf8');
    assert.ok(measure(profil) <= cfg.caps.profil);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
