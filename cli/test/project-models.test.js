// Garde de la SURCHARGE DU MODELE PAR PROJET (specs/instructions/surcharge-modele-par-projet.md).
//
// Couvre, dans l'ordre des criteres de l'instruction :
//   - effectiveModel (pure, CA-1) et sa substitution a la couture de generateAgent (CA-3/CA-4) ;
//   - readModelOverrides / writeModelOverride / clearModelOverride (CA-5/CA-6/CA-7/CA-8) ;
//   - les sous-verbes `models set` / `models unset` (CA-9 a CA-15) ;
//   - la politique Fable (CA-16) ;
//   - la reprise inter-processus (CA-18) et le signalement de divergence (CA-20/CA-25) ;
//   - le detecteur de fuite vitrine-methode (CA-24, verifie ICI par construction).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  generateAgent, generateAll, loadDefaultBinding, modelForPersona, effectiveModel,
} from '../src/lib/generate-agents.js';
import {
  readModelOverrides, writeModelOverride, clearModelOverride,
  validateModelValue, divergentOverrides, projectionIsIgnored,
} from '../src/lib/project-models.js';
import { parseJsonFile, writeActiveFramePointer } from '../src/lib/frame-active.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(HERE, '..', 'src', 'index.js');

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-override-'));
}

function run(args, opts = {}) {
  return execFileSync('node', [CLI, ...args], { cwd: REPO, encoding: 'utf8', ...opts });
}

function runJson(args, opts = {}) {
  return JSON.parse(run(args, opts));
}

// --- CA-1 : effectiveModel, les trois cas -------------------------------------------------------
test('CA-1 effectiveModel : surcharge presente -> la surcharge ; absente -> le binding ; les deux absentes -> \'\'', () => {
  const binding = loadDefaultBinding(REPO);
  assert.equal(effectiveModel({ overrides: { gandalf: 'fable' }, binding, personaId: 'gandalf' }), 'fable',
    'surcharge presente : elle gagne');
  assert.equal(effectiveModel({ overrides: {}, binding, personaId: 'gandalf' }), modelForPersona(binding, 'gandalf'),
    'surcharge absente : repli sur modelForPersona (le binding)');
  assert.equal(effectiveModel({ overrides: {}, binding: null, personaId: 'inconnu' }), '',
    'les deux absentes : chaine vide');
  // surcharge = chaine vide/blanche -> traitee comme ABSENTE (ce n'est pas une valeur, D6)
  assert.equal(effectiveModel({ overrides: { gandalf: '   ' }, binding, personaId: 'gandalf' }),
    modelForPersona(binding, 'gandalf'), 'surcharge blanche -> repli sur le binding');
});

// --- CA-2 : modelForPersona (lot 1) inchangee ----------------------------------------------------
test('CA-2 modelForPersona : comportement du lot 1 intact (mesure directe)', () => {
  const binding = loadDefaultBinding(REPO);
  assert.equal(modelForPersona(binding, 'gandalf'), 'opus');
  assert.equal(modelForPersona(binding, 'gimli'), 'sonnet');
  assert.equal(modelForPersona(null, 'gandalf'), '');
});

// --- CA-3 : la couture de generateAgent tient en UNE LIGNE (verrou structurel) -------------------
test('CA-3 generateAgent : la resolution du modele passe par UN SEUL appel a effectiveModel, jamais deux', () => {
  const src = fs.readFileSync(path.join(HERE, '..', 'src', 'lib', 'generate-agents.js'), 'utf8');
  const fn = src.slice(src.indexOf('export function generateAgent'), src.indexOf('// Charge le binding defaut'));
  // Code CODE seul (retire les lignes de commentaire `//`) : la ligne de RESOLUTION doit etre
  // l'UNIQUE occurrence executable de `effectiveModel(`, preuve que la couture D7 du lot 1 a tenu
  // et que le lot 2 y a substitue UNE ligne, pas rouvert la fonction.
  const codeOnly = fn.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  const calls = codeOnly.match(/effectiveModel\(/g) || [];
  assert.equal(calls.length, 1, 'un SEUL point de resolution EXECUTABLE du modele dans generateAgent');
  assert.ok(!/modelForPersona\(binding, id\)/.test(codeOnly.replace(/effectiveModel\([^)]*\)/g, '')),
    'modelForPersona ne doit plus etre appelee EN DIRECT (code) dans generateAgent (elle est le 2e terme, via effectiveModel)');
});

// --- CA-4 : binding non-Claude + surcharge -> AUCUNE ligne model (le filtre reste en aval) -------
test('CA-4 generateAgent : surcharge sur binding OLLAMA => aucune ligne model (filtre de runner en aval)', () => {
  const contract = generateAgent('gimli', {
    root: REPO,
    binding: { data: { assignments: [{ personaId: 'gimli', runner: 'ollama-distant', model: 'qwen2.5-coder:14b' }] } },
    overrides: { gimli: 'fable' },
  });
  assert.ok(!/^model: /m.test(contract), 'aucune ligne model : le runner cible n\'est pas claude-code');
});

// --- CA-5 : readModelOverrides, defensif --------------------------------------------------------
test('CA-5 readModelOverrides : absent / illisible / non-objet / cle absente -> {} (jamais de jet)', () => {
  assert.deepEqual(readModelOverrides(path.join(os.tmpdir(), 'nexiste-pas-iaka')), {});
  assert.deepEqual(readModelOverrides(null), {});

  const p1 = tmpProject();
  fs.writeFileSync(path.join(p1, 'iakaframe.json'), '{ not json');
  assert.deepEqual(readModelOverrides(p1), {});

  const p2 = tmpProject();
  fs.writeFileSync(path.join(p2, 'iakaframe.json'), JSON.stringify({ modelOverrides: 'pas-un-objet' }));
  assert.deepEqual(readModelOverrides(p2), {});

  const p3 = tmpProject();
  fs.writeFileSync(path.join(p3, 'iakaframe.json'), JSON.stringify({ frame: 'iakaframe' }));
  assert.deepEqual(readModelOverrides(p3), {});
});

// --- CA-6 : writeActiveFramePointer inchangee apres l'extraction de patchProjectConf -------------
test('CA-6 writeActiveFramePointer : comportement EXACT apres delegation a patchProjectConf', () => {
  const proj = tmpProject();
  const file = path.join(proj, 'iakaframe.json');
  fs.writeFileSync(file, JSON.stringify({ runner: 'claude-code', note: 'x' }, null, 2));
  const r = writeActiveFramePointer(proj, 'iakaframe');
  assert.equal(r.ok, true);
  const cfg = parseJsonFile(file);
  assert.equal(cfg.frame, 'iakaframe');
  assert.equal(cfg.runner, 'claude-code');
  assert.equal(cfg.note, 'x');
  // illisible -> refus, fichier intact
  fs.writeFileSync(file, '{ not json');
  const bad = writeActiveFramePointer(proj, 'iakaframe');
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, 'unreadable');
  assert.equal(fs.readFileSync(file, 'utf8'), '{ not json');
});

// --- CA-7 : ecrire une surcharge sur un JSON illisible est REFUSE, fichier intact a l'octet -------
test('CA-7 writeModelOverride : JSON illisible -> refus, fichier INCHANGE a l\'octet', () => {
  const proj = tmpProject();
  const file = path.join(proj, 'iakaframe.json');
  fs.writeFileSync(file, '{ not json');
  const before = fs.readFileSync(file, 'utf8');
  const res = writeModelOverride(proj, 'gandalf', 'opus');
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'unreadable');
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

// --- CA-8 : non-ecrasement croise (models set <-> frame use <-> unset) ---------------------------
test('CA-8 non-ecrasement : models set + frame use + relecture -> les DEUX cles coexistent ; unset ne laisse pas de {} residuel', () => {
  const proj = tmpProject();
  writeModelOverride(proj, 'gandalf', 'opus');
  run(['frame', 'use', 'iakaframe', '--path', proj, '--json']);
  const cfg = parseJsonFile(path.join(proj, 'iakaframe.json'));
  assert.equal(cfg.frame, 'iakaframe');
  assert.deepEqual(cfg.modelOverrides, { gandalf: 'opus' });

  clearModelOverride(proj, 'gandalf');
  const cfg2 = parseJsonFile(path.join(proj, 'iakaframe.json'));
  assert.equal(cfg2.frame, 'iakaframe', 'frame toujours la');
  assert.equal('modelOverrides' in cfg2, false, 'la cle est RETIREE, pas laissee en {}');
});

// --- CA-9 : `models set` ecrit la decision ET projette le contrat, model en position 5 -----------
test('CA-9 CLI : models set gandalf fable -> modelOverrides ecrit + contrat de projet model:fable en position 5', () => {
  const proj = tmpProject();
  const out = runJson(['models', 'set', 'gandalf', 'fable', '--path', proj, '--json']);
  assert.equal(out.ok, true);
  assert.equal(out.model, 'fable');
  assert.equal(out.warning, null, 'fable est une valeur CONNUE : aucun avertissement');

  const cfg = parseJsonFile(path.join(proj, 'iakaframe.json'));
  assert.equal(cfg.modelOverrides.gandalf, 'fable');

  const dest = path.join(proj, '.claude', 'agents', 'gandalf.md');
  assert.ok(fs.existsSync(dest));
  const lines = fs.readFileSync(dest, 'utf8').split('\n');
  assert.equal(lines[0], '---');
  assert.match(lines[3], /^tools: /);
  assert.equal(lines[4], 'model: fable');
  assert.match(lines[5], /^skills: \[/);
});

// --- CA-10 : `models unset` retire l'entree ET le fichier ; idempotent ---------------------------
test('CA-10 CLI : models unset retire l\'entree ET supprime le fichier ; relance = idempotent', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gandalf', 'opus', '--path', proj, '--json']);
  const dest = path.join(proj, '.claude', 'agents', 'gandalf.md');
  assert.ok(fs.existsSync(dest));

  const out = runJson(['models', 'unset', 'gandalf', '--path', proj, '--json']);
  assert.equal(out.ok, true);
  assert.ok(!fs.existsSync(dest), 'le contrat de projet a disparu');
  assert.equal(readModelOverrides(proj).gandalf, undefined);

  // idempotent
  const again = runJson(['models', 'unset', 'gandalf', '--path', proj, '--json']);
  assert.equal(again.ok, true);
  assert.equal(again.removedFile, null);
});

// --- CA-11 : `--all` retire SES fichiers, jamais un contrat de projet preexistant non issu d'une
//     surcharge -------------------------------------------------------------------------------
test('CA-11 CLI : models unset --all retire tout ce qu\'il a pose, et RIEN d\'autre', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gandalf', 'opus', '--path', proj, '--json']);
  run(['models', 'set', 'gimli', 'haiku', '--path', proj, '--json']);
  // contrat de projet preexistant, PAS issu d'une surcharge (pose a la main).
  const dir = path.join(proj, '.claude', 'agents');
  fs.writeFileSync(path.join(dir, 'legolas.md'), '---\nname: legolas\n---\n# a la main\n');

  const out = runJson(['models', 'unset', '--all', '--path', proj, '--json']);
  assert.equal(out.ok, true);
  assert.deepEqual(new Set(out.cleared), new Set(['gandalf', 'gimli']));
  assert.ok(!fs.existsSync(path.join(dir, 'gandalf.md')));
  assert.ok(!fs.existsSync(path.join(dir, 'gimli.md')));
  assert.ok(fs.existsSync(path.join(dir, 'legolas.md')), 'le contrat NON issu d\'une surcharge doit survivre');
  assert.equal('modelOverrides' in parseJsonFile(path.join(proj, 'iakaframe.json')), false);
});

// --- CA-12 : persona absente de la team active -> refus, RIEN ecrit ------------------------------
test('CA-12 CLI : models set sur une persona hors team -> exit != 0, iakaframe.json inchange a l\'octet', () => {
  const proj = tmpProject();
  const file = path.join(proj, 'iakaframe.json');
  fs.writeFileSync(file, JSON.stringify({ frame: 'iakaframe' }, null, 2) + '\n');
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(() => run(['models', 'set', 'nemesis-inconnue', 'opus', '--path', proj, '--json']));
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(proj, '.claude', 'agents', 'nemesis-inconnue.md')));
});

// --- CA-13 : valeurs de FORME invalides -> refus, rien ecrit --------------------------------------
test('CA-13 validateModelValue : formes invalides -> bloquant', () => {
  for (const bad of ['', '   ', 'opus sonnet', 'a: b', '#opus', '"opus', "'opus", '[opus', '{opus']) {
    const v = validateModelValue(bad);
    assert.ok(v.blocking, `attendu bloquant pour ${JSON.stringify(bad)}`);
  }
});

test('CA-13 CLI : models set avec une valeur de forme invalide -> refus, rien ecrit', () => {
  const proj = tmpProject();
  assert.throws(() => run(['models', 'set', 'gandalf', 'opus sonnet', '--path', proj, '--json']));
  assert.deepEqual(readModelOverrides(proj), {});
});

// --- CA-14 : valeur inhabituelle mais bien formee -> ECRITE avec avertissement ; fable = aucun ----
test('CA-14 validateModelValue : hors ensemble connu -> ecrite + avertissement ; fable = aucun avertissement', () => {
  const sonnnet = validateModelValue('sonnnet');
  assert.equal(sonnnet.ok, 'sonnnet');
  assert.match(sonnnet.warning, /inhabituelle/);

  for (const known of ['sonnet', 'opus', 'haiku', 'fable', 'inherit', 'claude-opus-5']) {
    const v = validateModelValue(known);
    assert.equal(v.warning, null, `${known} ne doit emettre AUCUN avertissement`);
  }
});

test('CA-14 CLI : models set gimli sonnnet -> exit 0, ecrit quand meme, avertissement rendu', () => {
  const proj = tmpProject();
  const out = runJson(['models', 'set', 'gimli', 'sonnnet', '--path', proj, '--json']);
  assert.equal(out.ok, true);
  assert.match(out.warning, /inhabituelle/);
  assert.equal(readModelOverrides(proj).gimli, 'sonnnet');
});

// --- CA-15 : `models --json` rend model + modelSource distincts ----------------------------------
test('CA-15 CLI : models --json rend model ET modelSource (frame|projet), distincts', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gimli', 'haiku', '--path', proj, '--json']);
  const out = runJson(['models', '--path', proj, '--json', '--timeout', '1'], { env: { ...process.env, IAKAFRAME_HOSTS: 'localhost' } });
  const all = out.roles.flatMap(r => r.personas);
  const gimli = all.find(p => p.id === 'gimli');
  const autre = all.find(p => p.id !== 'gimli' && p.model);
  assert.equal(gimli.model, 'haiku');
  assert.equal(gimli.modelSource, 'projet');
  assert.ok(autre, 'au moins une autre persona porte un modele de frame');
  assert.equal(autre.modelSource, 'frame');
});

// --- CA-16 : politique Fable — aucun binding n'en porte, mais la commande l'atteint --------------
test('CA-16 politique : aucun binding ne porte fable (grep), et models set l\'atteint (CA-9 le prouve)', () => {
  const bindingsDir = path.join(REPO, 'bindings');
  for (const f of fs.readdirSync(bindingsDir)) {
    if (!f.endsWith('.md')) continue;
    const src = fs.readFileSync(path.join(bindingsDir, f), 'utf8');
    assert.ok(!/fable/i.test(src), `${f} ne doit porter aucune trace de 'fable'`);
  }
});

// --- CA-18 : la reprise — relue depuis le DISQUE, dans un SECOND processus -----------------------
test('CA-18 reprise : models set puis relecture EN SOUS-PROCESSUS distinct -> model: haiku', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gimli', 'haiku', '--path', proj, '--json']);
  // Second processus, ne partage AUCUNE memoire avec le premier : la preuve porte sur le DISQUE.
  const contract = execFileSync('node', ['-e', `
    const fs = require('fs');
    process.stdout.write(fs.readFileSync(${JSON.stringify(path.join(proj, '.claude', 'agents', 'gimli.md'))}, 'utf8'));
  `], { encoding: 'utf8' });
  assert.match(contract, /^model: haiku$/m);
});

// --- CA-20/CA-25 : signalement de divergence, JAMAIS d'ecriture -----------------------------------
test('CA-20 divergentOverrides : decision presente, projection ABSENTE -> signalee, RIEN ecrit', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gandalf', 'opus', '--path', proj, '--json']);
  const dest = path.join(proj, '.claude', 'agents', 'gandalf.md');
  fs.unlinkSync(dest); // supprime a la main, simule un .claude/ purge / clone frais

  const div = divergentOverrides(proj, { root: REPO });
  assert.equal(div.length, 1);
  assert.equal(div[0].personaId, 'gandalf');
  assert.equal(div[0].decided, 'opus');
  assert.match(div[0].repair, /iakaframe models set gandalf opus --path/);
  assert.ok(!fs.existsSync(dest), 'divergentOverrides n\'ecrit RIEN, jamais');

  // La meme info est portee par `models --json` (D9 : source unique pour iakastart).
  const out = runJson(['models', '--path', proj, '--json', '--timeout', '1'], { env: { ...process.env, IAKAFRAME_HOSTS: 'localhost' } });
  assert.equal(out.overrideDivergences.length, 1);
  assert.equal(out.overrideDivergences[0].personaId, 'gandalf');
  assert.ok(!fs.existsSync(dest), 'la lecture --json n\'ecrit rien non plus');
});

test('CA-25 (clone frais simule) : iakaframe.json seul copie -> divergence signalee, .claude/agents/ toujours absent apres', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gandalf', 'opus', '--path', proj, '--json']);

  // Simule un CLONE FRAIS : seul iakaframe.json survit (A-3, la projection ne se versionne pas).
  const clone = tmpProject();
  fs.copyFileSync(path.join(proj, 'iakaframe.json'), path.join(clone, 'iakaframe.json'));
  assert.ok(!fs.existsSync(path.join(clone, '.claude')), 'clone frais : aucune projection');

  const div = divergentOverrides(clone, { root: REPO });
  assert.equal(div.length, 1);
  assert.equal(div[0].personaId, 'gandalf');
  assert.ok(!fs.existsSync(path.join(clone, '.claude')), '.claude/agents/ TOUJOURS absent apres le signalement');
});

// --- projectionIsIgnored (4bis) : constat seul, jamais d'ecriture --------------------------------
test('projectionIsIgnored : detecte une entree .gitignore couvrant .claude/agents, sans jamais ecrire', () => {
  const proj = tmpProject();
  assert.equal(projectionIsIgnored(proj), false, 'pas de .gitignore -> non ignore');
  fs.writeFileSync(path.join(proj, '.gitignore'), 'node_modules/\n/.claude/agents/\n');
  assert.equal(projectionIsIgnored(proj), true);
  assert.ok(!fs.existsSync(path.join(proj, '.claude')), 'jamais de creation de dossier au passage');
});

test('CLI models set : signale (non bloquant) quand la projection n\'est PAS ignoree du projet cible', () => {
  const proj = tmpProject();
  const out = runJson(['models', 'set', 'gandalf', 'opus', '--path', proj, '--json']);
  assert.equal(out.ok, true, 'jamais bloquant');
  assert.equal(out.gitignore.ignored, false);
});

// --- CA-21 : docs/commandes.md + les trois aides s'accordent (memes noms, memes options) ---------
test('CA-21 : models --help / models set --help / models unset --help sortent proprement et se citent', () => {
  const mainHelp = run(['models', '--help']);
  assert.match(mainHelp, /models set/);
  assert.match(mainHelp, /models unset/);

  const setHelp = run(['models', 'set', '--help']);
  assert.match(setHelp, /<personaId>/);
  assert.match(setHelp, /--path/);

  const unsetHelp = run(['models', 'unset', '--help']);
  assert.match(unsetHelp, /--all/);
  assert.match(unsetHelp, /--path/);

  const topHelp = run(['--help']);
  assert.match(topHelp, /models set/);
  assert.match(topHelp, /models unset/);
});

test('CA-21 : docs/commandes.md documente les deux sous-verbes', () => {
  const doc = fs.readFileSync(path.join(REPO, 'docs', 'commandes.md'), 'utf8');
  assert.match(doc, /models set <persona>/);
  assert.match(doc, /models unset <persona>/);
  assert.match(doc, /modelOverrides/);
});

// --- CA-24 (detecteur de fuite, PROUVE ICI) : une surcharge de projet n'affecte JAMAIS le rendu
//     GLOBAL (generateAll / agents generate), qui n'accepte pas d'overrides -----------------------
test('CA-24 : une surcharge de projet n\'atteint JAMAIS generateAll (portee globale) — structure, pas juste golden', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gandalf', 'fable', '--path', proj, '--json']);
  // generateAll (rendu GLOBAL, celui de la vitrine) n'accepte pas de parametre `overrides` :
  // AUCUN chemin ne peut le lui faire lire, quoi qu'on ecrive dans un projet.
  const binding = loadDefaultBinding(REPO);
  const g1 = generateAgent('gandalf', { root: REPO, binding });
  const all = generateAll({ root: REPO });
  assert.equal(all.get('gandalf'), g1, 'rendu global inchange : aucune fuite possible (pas de canal overrides)');
  assert.match(all.get('gandalf'), /^model: opus$/m, 'le defaut de la frame tient, pas la surcharge de projet');
});
