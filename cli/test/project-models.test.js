// Garde de la SURCHARGE DU MODELE PAR PROJET (specs/instructions/surcharge-modele-par-projet.md),
// AMENDEE le 2026-09-02 (§ Amendement A : la garde de vocabulaire devient BLOQUANTE, --force,
// retrocompatibilite en lecture D14).
//
// Couvre, dans l'ordre des criteres de l'instruction :
//   - effectiveModel (pure, CA-1) et sa substitution a la couture de generateAgent (CA-3/CA-4) ;
//   - readModelOverrides / writeModelOverride / clearModelOverride (CA-5/CA-6/CA-7/CA-8) ;
//   - les sous-verbes `models set` / `models unset` (CA-9 a CA-15) ;
//   - la politique Fable (CA-16) ;
//   - la reprise inter-processus (CA-18) et le signalement de divergence (CA-20/CA-25) ;
//   - le detecteur de fuite vitrine-methode (CA-24, verifie ICI par construction) ;
//   - Amendement A : la grammaire D6bis bloquante + --force (CA-26/CA-27/CA-28/CA-29/CA-30/CA-31),
//     la retrocompatibilite en LECTURE D14 (CA-32), les deux phrases de A.4 (CA-33), l'accord des
//     aides (CA-34).
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
  validateModelValue, divergentOverrides, unknownOverrides, projectionIsIgnored,
} from '../src/lib/project-models.js';
import { parseJsonFile, writeActiveFramePointer } from '../src/lib/frame-active.js';
import { parseFrontmatter, needsScalarQuote } from '../src/lib/frontmatter.js';

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

// --- CA-14 est RENOMME CA-26 (2026-09-02, Amendement A, decision decideur « echouer ») ----------
// Redaction D'ORIGINE, CONSERVEE COMME TRACE (RA-3 : ne jamais modifier un test pour accommoder le
// code — ICI, le test mesurait FIDELEMENT D6, que le decideur a renverse ; le REECRIRE EST le lot,
// pas un contournement) :
//   test('CA-14 validateModelValue : hors ensemble connu -> ecrite + avertissement ; fable = aucun
//   avertissement', () => { ... assert.equal(sonnnet.ok, 'sonnnet'); assert.match(sonnnet.warning,
//   /inhabituelle/); ... });
//   test('CA-14 CLI : models set gimli sonnnet -> exit 0, ecrit quand meme, avertissement
//   rendu', () => { ... assert.equal(out.ok, true); assert.match(out.warning, /inhabituelle/); ... });
// Elle est REMPLACEE par CA-26, pas supprimee (le compte de tests reste STRICTEMENT croissant,
// CA-35).

// --- CA-26 (ex-CA-14, reecrit) : hors grammaire -> REFUS, rien ecrit ------------------------------
test('CA-26 validateModelValue : hors grammaire D6bis -> { unknown }, jamais { ok }', () => {
  const sonnnet = validateModelValue('sonnnet');
  assert.equal(sonnnet.unknown, 'sonnnet');
  assert.equal(sonnnet.ok, undefined);
  assert.equal(sonnnet.blocking, undefined);
});

test('CA-26 CLI : models set gimli sonnnet -> exit != 0, ok:false, rien ecrit', () => {
  const proj = tmpProject();
  const file = path.join(proj, 'iakaframe.json');
  fs.writeFileSync(file, JSON.stringify({ frame: 'iakaframe' }, null, 2) + '\n');
  const before = fs.readFileSync(file, 'utf8');

  let out, threw = false;
  try {
    run(['models', 'set', 'gimli', 'sonnnet', '--path', proj, '--json']);
  } catch (e) {
    threw = true;
    out = JSON.parse(e.stdout);
  }
  assert.ok(threw, 'exit != 0');
  assert.equal(out.ok, false);
  assert.match(out.error, /sonnnet/);
  assert.match(out.error, /sonnet, opus, haiku, fable, inherit/);
  assert.match(out.error, /--force/);
  assert.equal(out.personaId, 'gimli');
  assert.equal(out.model, 'sonnnet');
  assert.ok(Array.isArray(out.accepted) && out.accepted.includes('sonnet'));

  assert.equal(fs.readFileSync(file, 'utf8'), before, 'iakaframe.json inchange a l\'octet');
  assert.ok(!fs.existsSync(path.join(proj, '.claude', 'agents', 'gimli.md')), 'contrat de projet NON cree');
});

// --- CA-27 (la porte de sortie) : --force ecrit quand meme, en le disant --------------------------
test('CA-27 CLI : models set gimli sonnnet --force -> exit 0, warning + forced:true, ecrit et projete', () => {
  const proj = tmpProject();
  const out = runJson(['models', 'set', 'gimli', 'sonnnet', '--force', '--path', proj, '--json']);
  assert.equal(out.ok, true);
  assert.equal(out.forced, true);
  assert.match(out.warning, /--force/);
  assert.match(out.warning, /sonnnet/);
  assert.equal(readModelOverrides(proj).gimli, 'sonnnet');
  const dest = path.join(proj, '.claude', 'agents', 'gimli.md');
  assert.ok(fs.existsSync(dest));
  assert.match(fs.readFileSync(dest, 'utf8'), /^model: sonnnet$/m);
});

// --- CA-28 (le faux refus evite — le critere qui justifie la reecriture de la grammaire) ----------
test('CA-28 validateModelValue : opus[1m]/sonnet[1m]/... et claude-opus-5[1m] -> AUCUN refus, AUCUN avertissement', () => {
  // Sous la liste du lot 2 (KNOWN_MODEL_VALUES + v.startsWith('claude-')), 'opus[1m]' aurait ete
  // classee INHABITUELLE (avertissement) — et sous « echouer » applique a CETTE liste, REFUSEE.
  // C'est le regression-test de A.1 : la grammaire D6bis doit accepter le suffixe partout.
  for (const v of ['sonnet', 'opus', 'haiku', 'fable', 'inherit', 'claude-opus-5',
                    'sonnet[1m]', 'opus[1m]', 'haiku[1m]', 'fable[1m]', 'inherit[1m]', 'claude-opus-5[1m]']) {
    const r = validateModelValue(v);
    assert.equal(r.unknown, undefined, `${v} ne doit jamais etre refusee`);
    assert.equal(r.blocking, undefined, `${v} ne doit jamais etre bloquante`);
    assert.equal(r.ok, v, `${v} doit etre ecrite telle quelle`);
    assert.equal(r.warning, null, `${v} n'emet AUCUN avertissement`);
  }
});

test('CA-28 CLI : models set gimli opus[1m] sans --force -> exit 0, aucun avertissement', () => {
  const proj = tmpProject();
  const out = runJson(['models', 'set', 'gimli', 'opus[1m]', '--path', proj, '--json']);
  assert.equal(out.ok, true);
  assert.equal(out.warning, null);
  assert.equal(out.forced, false);
  assert.equal(readModelOverrides(proj).gimli, 'opus[1m]');
});

// --- CA-29 (aller-retour du suffixe) : non quote, relu a l'identique ------------------------------
test('CA-29 : model: opus[1m] traverse le rendu SANS se deformer (non quote, relu identique)', () => {
  const proj = tmpProject();
  run(['models', 'set', 'gimli', 'opus[1m]', '--path', proj, '--json']);
  const dest = path.join(proj, '.claude', 'agents', 'gimli.md');
  const content = fs.readFileSync(dest, 'utf8');
  assert.match(content, /^model: opus\[1m\]$/m, 'non quote (pas de guillemets, pas de crochet ouvrant en tete)');
  assert.equal(needsScalarQuote('opus[1m]'), false, 'o en tete : aucune regle de quoting ne s\'applique');

  const { data } = parseFrontmatter(content);
  assert.equal(data.model, 'opus[1m]', 'relu EXACTEMENT : ni opus, ni re-quote, ni tableau');
});

// --- CA-30 (la garde ne fuit PAS dans le rendu) : le binding Ollama est INTACT --------------------
test('CA-30 : validateModelValue a UN SEUL appelant (models.js), la voie binding n\'est PAS gardee', () => {
  // Mesure les APPELS (invocations `validateModelValue(...)`), pas les mentions en commentaire —
  // le grep brut de la recette (§ A.9) est une lecture humaine, cette assertion en est la version
  // MECANIQUE : elle exclut la ligne de DEFINITION (`function validateModelValue(`) et ne compte
  // que les sites d'APPEL reels.
  const cliSrc = path.join(HERE, '..', 'src');
  const grep = execFileSync('grep', ['-rn', 'validateModelValue(', cliSrc], { encoding: 'utf8' });
  const callSites = grep.split('\n').filter(Boolean)
    .filter(l => !/function validateModelValue\(/.test(l));
  const files = new Set(callSites.map(l => l.split(':')[0]));
  assert.deepEqual([...files], [path.join(cliSrc, 'commands', 'models.js')], 'UN SEUL appelant : models.js');
});

test('CA-30 : surcharge sur binding OLLAMA -> comportement EXACT du lot 1 (CA-6 du lot 1 sans modification)', () => {
  // Reprend, verbatim, la mesure du lot 1 (affectation-modele-par-acteur.md, CA-6) : le binding
  // Ollama continue de projeter SES modeles verbatim, sans qu'aucune ligne de la grammaire D6bis
  // n'intervienne (elle vit au point d'entree `models set`, jamais dans le rendu, A.4/RA-2).
  const contract = generateAgent('gimli', {
    root: REPO,
    binding: { data: { assignments: [{ personaId: 'gimli', runner: 'ollama-distant', model: 'qwen2.5-coder:14b' }] } },
  });
  assert.ok(!/^model: /m.test(contract), 'runner non-claude-code : aucune ligne model, inchange');
});

// --- CA-31 (avertissement residuel, D13) : id complet NON MESURE -> avertissement DISTINCT --------
test('CA-31 CLI : models set gandalf claude-inexistant-9 sans --force -> exit 0, ecrit, avertissement id-complet', () => {
  const proj = tmpProject();
  const out = runJson(['models', 'set', 'gandalf', 'claude-inexistant-9', '--path', proj, '--json']);
  assert.equal(out.ok, true);
  assert.equal(out.forced, false, 'jamais force : la grammaire ACCEPTE deja un id complet bien forme');
  assert.match(out.warning, /id complet non verifiable hors ligne/);
  assert.match(out.warning, /claude-inexistant-9/);
  assert.ok(!/--force/.test(out.warning), 'avertissement DISTINCT de celui de --force (D13)');

  const out2 = runJson(['models', 'set', 'gandalf', 'claude-opus-5', '--path', proj, '--json']);
  assert.equal(out2.warning, null, 'claude-opus-5 (id complet MESURE, F6) n\'emet aucun avertissement');
});

// --- CA-32 (retrocompat en LECTURE, D14 — le cas qui mord en premier) -----------------------------
test('CA-32 : iakaframe.json portant une valeur hors grammaire (pose a la main) -> signalee, jamais ignoree ni bloquante', () => {
  const proj = tmpProject();
  const file = path.join(proj, 'iakaframe.json');
  fs.writeFileSync(file, JSON.stringify({ frame: 'iakaframe', modelOverrides: { gandalf: 'pas-un-modele' } }, null, 2) + '\n');
  const before = fs.readFileSync(file, 'utf8');

  // unknownOverrides (lecture pure) : signale, n'ecrit rien.
  const unk = unknownOverrides(proj);
  assert.equal(unk.length, 1);
  assert.equal(unk[0].personaId, 'gandalf');
  assert.equal(unk[0].model, 'pas-un-modele');
  assert.match(unk[0].repair, /models set gandalf/);
  assert.match(unk[0].repair, /models unset gandalf/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(proj, '.claude', 'agents')), 'aucune ecriture');

  // `models --json` : sort en 0, NI ignore NI remplace par le defaut de frame.
  const out = runJson(['models', '--path', proj, '--json', '--timeout', '1'], { env: { ...process.env, IAKAFRAME_HOSTS: 'localhost' } });
  assert.equal(out.ok, true);
  assert.equal(out.unknownOverrides.length, 1);
  assert.equal(out.unknownOverrides[0].personaId, 'gandalf');
  assert.match(out.unknownOverrides[0].repair, /models set gandalf|models unset gandalf/);
  const gandalfRow = out.roles.flatMap(r => r.personas).find(p => p.id === 'gandalf');
  assert.equal(gandalfRow.model, 'pas-un-modele', 'la valeur brute continue d\'etre rendue, pas remplacee');
  assert.equal(gandalfRow.modelSource, 'projet');
  assert.equal(fs.readFileSync(file, 'utf8'), before, 'la LECTURE n\'ecrit rien');
  assert.ok(!fs.existsSync(path.join(proj, '.claude', 'agents')), '.claude/agents/ toujours absent');
});

// --- CA-33 (les deux phrases de A.4) ---------------------------------------------------------------
test('CA-33 : generate-agents.js:104-105 borne D5 a la voie binding (Amendement A cite)', () => {
  const src = fs.readFileSync(path.join(HERE, '..', 'src', 'lib', 'generate-agents.js'), 'utf8');
  assert.match(src, /Amendement A/, 'le commentaire cite l\'Amendement A');
  assert.match(src, /voie binding/i);
});

test('CA-33 : affectation-modele-par-acteur.md porte une note DATEE sous D5, additions seules', () => {
  const src = fs.readFileSync(path.join(REPO, 'specs', 'instructions', 'affectation-modele-par-acteur.md'), 'utf8');
  assert.match(src, /2026-09-02.*models set.*refuse/s);
  // Ancre sur le commit du cadrage de l'Amendement A (754c747, cite par l'instruction elle-meme,
  // PAS un decalage relatif type HEAD~N qui se desalignerait au fil des commits de ce chantier).
  const stat = execFileSync('git', ['diff', '--stat', '754c747', '--', 'specs/instructions/affectation-modele-par-acteur.md'],
    { cwd: REPO, encoding: 'utf8' });
  // Aucune suppression : que des '+' dans la ligne recapitulative (ex. « 1 file changed, 4 insertions(+) »),
  // jamais de '-' de suppressions.
  if (stat.trim()) assert.ok(!/\d+ deletions?\(-\)/.test(stat), `aucune suppression attendue : ${stat}`);
});

// --- CA-34 (aides et doc d'accord) : --force et la grammaire, memes termes ------------------------
test('CA-34 : SET_HELP / models --help / docs/commandes.md documentent --force et la grammaire, dans les memes termes', () => {
  const setHelp = run(['models', 'set', '--help']);
  assert.match(setHelp, /--force/);
  assert.match(setHelp, /sonnet, opus, haiku, fable, inherit/);
  assert.match(setHelp, /\[1m\]/);

  const topHelp = run(['models', '--help']);
  assert.match(topHelp, /--force/);

  const doc = fs.readFileSync(path.join(REPO, 'docs', 'commandes.md'), 'utf8');
  assert.match(doc, /--force/);
  assert.match(doc, /sonnet.*opus.*haiku.*fable.*inherit/);
  assert.match(doc, /\[1m\]/);
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
