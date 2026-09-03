// Gardes du Lot 0/B (specs/instructions/cli-mode-guide-selections.md) : lib/verbes.js comme
// SOURCE UNIQUE de l'inventaire des verbes, dont derivent `iakaframe --help`, `commands --json`
// et les entrees Claude Code `iaka-*.md` generees (Lot B). Deux CONTROLES POSITIFS (G5a, G5c),
// requis par l'instruction pour ne pas etre un temoin vide (§ Preuve) : G1 seul (« rien ne
// change en non-TTY ») serait vert sur un CLI ou rien n'est branche.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { VERBES, ALIAS_VERBES, resumeOf } from '../src/lib/verbes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(HERE, '..', 'src', 'index.js');
const INDEX_SRC = fs.readFileSync(CLI, 'utf8');
const COMMANDS_DIR = path.join(REPO, 'kits', 'iakaframe-claude', '.claude', 'commands');

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: 'utf8' });
}

// --- G5a : registre <-> index.js, DANS LES DEUX SENS ------------------------------------------

function caseVerbesDeIndex() {
  const ids = [...INDEX_SRC.matchAll(/case\s+'([\w-]+)':/g)].map(m => m[1]);
  // 'help'/'version' sont traites AVANT le switch (options globales), jamais des `case`.
  const canon = new Set(ids.map(id => ALIAS_VERBES[id] || id));
  return canon;
}

test("G5a : chaque `case` de index.js a une entree dans lib/verbes.js (index -> registre)", () => {
  const casesIndex = caseVerbesDeIndex();
  const idsRegistre = new Set(VERBES.map(v => v.id));
  const manquants = [...casesIndex].filter(id => !idsRegistre.has(id));
  assert.deepEqual(manquants, [], `verbe(s) present(s) dans index.js, absent(s) du registre : ${manquants.join(', ')}`);
});

test('G5a : chaque entree de lib/verbes.js correspond a un `case` de index.js (registre -> index, verbe mort)', () => {
  const casesIndex = caseVerbesDeIndex();
  const morts = VERBES.map(v => v.id).filter(id => !casesIndex.has(id));
  assert.deepEqual(morts, [], `verbe(s) fantome(s) au registre, absent(s) du dispatch : ${morts.join(', ')}`);
});

test('G5a : 39 verbes distincts au dispatch (40 `case`, `use` alias de `switch`) — 38 mesures par l\'instruction + `commands` neuf (Lot 0)', () => {
  const casesIndex = caseVerbesDeIndex();
  assert.equal(casesIndex.size, 39, "le compte de verbes DISTINCTS (apres fusion de l'alias use->switch) : 38 preexistants + `commands` (Lot 0)");
});

// --- G5b : `--help` est DERIVE du registre, jamais une constante litterale ---------------------

test("G5b : `iakaframe --help` cite chaque id du registre", () => {
  const help = run(['--help']).stdout;
  const absents = VERBES.map(v => v.id).filter(id => !help.includes(id));
  assert.deepEqual(absents, [], `id(s) du registre absent(s) de --help : ${absents.join(', ')}`);
});

test('G5b : HELP est CONSTRUIT depuis VERBES (pas une constante contenant la liste litterale des ids)', () => {
  // Verrou STATIQUE : la constante HELP doit referencer le registre (VERBES / commandesSection),
  // jamais re-enumerer les ids en dur dans le template lui-meme. Rougit si `HELP` redevient un
  // template litteral contenant, par exemple, `onboard` ET `portfolio` ET `commands` en clair
  // au lieu d'un appel a une fonction derivee du registre.
  const helpBlock = INDEX_SRC.slice(INDEX_SRC.indexOf('const HELP ='), INDEX_SRC.indexOf('async function main'));
  assert.match(helpBlock, /commandesSection\(\)/, 'HELP doit appeler une fonction derivee du registre (commandesSection)');
  // Empreinte precise de l'ANCIENNE constante de prose (une ligne fixe par verbe, recopiee a la
  // main) : si quelqu'un revient a du texte fige, cette ligne exacte reapparait. Un simple mot
  // isole (« onboard », « portfolio »…) ne suffit pas comme empreinte : ces mots reapparaissent
  // legitimement ailleurs (ex. la note --root cite « portfolio » comme exemple de commande).
  assert.doesNotMatch(helpBlock, /^\s{2}onboard\s{2,}Met en place la methode/m,
    'HELP ne doit plus contenir la ligne litterale recopiee a la main (signature de l\'ancienne constante de prose)');
});

test('G5b : `iakaframe commands --json` et `--help` sortent le MEME jeu d\'ids et de resumes (une seule source)', () => {
  const json = JSON.parse(run(['commands', '--json']).stdout);
  assert.equal(json.ok, true);
  assert.equal(json.count, VERBES.length);
  const help = run(['--help']).stdout;
  for (const v of json.verbes) {
    assert.ok(help.includes(v.id), `--help doit citer ${v.id} (deja rendu par commands --json)`);
    // Le PREMIER segment du resume (avant toute ponctuation lourde) doit se retrouver tel quel
    // dans --help : les deux surfaces affichent le meme texte, jamais deux reformulations.
    const debut = v.resume.split(/\s*[:(]/)[0].trim();
    assert.ok(help.includes(debut), `--help doit reprendre le debut du resume de ${v.id} : "${debut}"`);
  }
});

// --- G5c : chaque `iaka-*.md` du kit correspond a une entree du registre, OU est declare hors
//           couverture avec un motif — et sa description DERIVE du `resume` (verbes generes). ---

test('G5c : chaque verbe `guideClaudeCode.generer:false` porte un motif explicite (jamais une exclusion silencieuse)', () => {
  const sansMotif = VERBES.filter(v => v.guideClaudeCode && v.guideClaudeCode.generer === false && !v.guideClaudeCode.motif);
  assert.deepEqual(sansMotif.map(v => v.id), [], `verbe(s) exclu(s) SANS motif : ${sansMotif.map(v => v.id).join(', ')}`);
});

test('G5c : tout verbe `generer:true` a bien une entree `iaka-<id>.md` dans le kit', () => {
  const attendus = VERBES.filter(v => v.guideClaudeCode && v.guideClaudeCode.generer === true);
  const manquants = attendus.filter(v => !fs.existsSync(path.join(COMMANDS_DIR, `iaka-${v.id}.md`)));
  assert.deepEqual(manquants.map(v => v.id), [], `iaka-<id>.md manquant(s) pour : ${manquants.map(v => v.id).join(', ')}`);
});

test("G5c : les entrees generees sont A JOUR avec le registre (aucune derive kit <-> lib/verbes.js)", () => {
  // Meme verrou que le generateur lui-meme (--check), rejoue ici pour que CE gate-ci (et pas
  // seulement une execution manuelle du script) proteste si quelqu'un edite un fichier genere
  // a la main sans passer par cli/scripts/gen-iaka-commands.mjs, ou change `resume` sans
  // regenerer.
  const r = spawnSync(process.execPath, [path.join(REPO, 'cli', 'scripts', 'gen-iaka-commands.mjs'), '--check'],
    { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, `derive kit <-> registre : ${r.stdout}${r.stderr}`);
});

test('G5c : chaque `iaka-<id>.md` genere porte la description DERIVEE du `resume` du registre (frontmatter)', () => {
  const attendus = VERBES.filter(v => v.guideClaudeCode && v.guideClaudeCode.generer === true);
  for (const v of attendus) {
    const raw = fs.readFileSync(path.join(COMMANDS_DIR, `iaka-${v.id}.md`), 'utf8');
    const m = raw.match(/^description:\s*(.*)$/m);
    assert.ok(m, `frontmatter description manquant : iaka-${v.id}.md`);
    const attendu = resumeOf(v).replace(/\s+/g, ' ').trim();
    assert.equal(m[1].trim(), attendu, `description non derivee du resume pour ${v.id}`);
  }
});

// Entrees `iaka-<x>.md` HAND-AUTHORED anterieures a ce lot dont `<x>` n'est PAS un verbe CLI :
// des invocateurs de SKILL (cadre/deploie/etat/qualite -> iakaframe-cadrage/-deploiement/
// -etat-des-lieux/-qualite), l'agregateur `help`, et l'aiguilleur `guide` (Lot B, ce lot meme —
// A6/A7, delegue au CLI mais n'EST pas un verbe du registre). Hors perimetre de G5c par nature.
const NON_VERBES_CONNUS = new Set(['help', 'cadre', 'deploie', 'etat', 'qualite', 'guide']);

test('G5c : aucun `iaka-*.md` du kit ne correspond a un id absent du registre (orphelin de generation)', () => {
  const ids = new Set(VERBES.map(v => v.id));
  const fichiers = fs.readdirSync(COMMANDS_DIR).filter(f => /^iaka-[\w-]+\.md$/.test(f));
  const orphelins = fichiers
    .map(f => f.replace(/^iaka-/, '').replace(/\.md$/, ''))
    .filter(id => !ids.has(id) && !NON_VERBES_CONNUS.has(id));
  assert.deepEqual(orphelins, [], `iaka-*.md orphelin(s), sans entree registre ni motif connu : ${orphelins.join(', ')}`);
});

// --- A3 (echo obligatoire) : controle POSITIF INDEPENDANT de contenu() -------------------------
// Constat du gate qualite : le texte `-> iakaframe <verbe> $ARGUMENTS` est deja protege
// TRANSITIVEMENT par --check (G5c ci-dessus), mais `contenu()` porte cet echo EN DUR dans
// gen-iaka-commands.mjs — si quelqu'un l'y retirait, la regeneration produirait des fichiers
// « a jour » SANS echo et aucun test ne rougirait. Les deux tests suivants NE PASSENT PAS par
// `contenu()` (aucun import du generateur) : ils relisent les fichiers SUR LE DISQUE et cherchent
// le motif d'echo tel quel. A3 est obligatoire ET non desactivable : ce controle porte cette
// exigence sans version affaiblie.

test('A3 : chaque `iaka-<id>.md` GENERE echoe `-> iakaframe <id> $ARGUMENTS` (lu sur le disque, independant de contenu())', () => {
  const generes = VERBES.filter(v => v.guideClaudeCode && v.guideClaudeCode.generer === true);
  const sansEcho = [];
  for (const v of generes) {
    const dest = path.join(COMMANDS_DIR, `iaka-${v.id}.md`);
    const raw = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : '';
    if (!raw.includes(`→ iakaframe ${v.id} $ARGUMENTS`)) sansEcho.push(`iaka-${v.id}.md`);
  }
  assert.deepEqual(sansEcho, [], `fichier(s) SANS echo obligatoire A3 (« -> iakaframe <id> $ARGUMENTS » absent) : ${sansEcho.join(', ')}`);
});

test("A3 : `iaka-guide.md` (l'aiguilleur lui-meme) echoe la commande generique `-> iakaframe <verbe> ...` avant execution", () => {
  const dest = path.join(COMMANDS_DIR, 'iaka-guide.md');
  assert.ok(fs.existsSync(dest), 'kits/iakaframe-claude/.claude/commands/iaka-guide.md doit exister');
  const raw = fs.readFileSync(dest, 'utf8');
  assert.ok(raw.includes('→ iakaframe <verbe>'), "iaka-guide.md doit echoer « -> iakaframe <verbe> ... » avant toute execution (A3)");
});

// --- G6 : non-regression du declencheur d'apprentissage (garde anti-collision M9) --------------

test("G6 : /iaka reste l'alias intact de /learning (aucun fichier `iaka.md` neuf, contenu inchange)", () => {
  const iakaCmd = path.join(COMMANDS_DIR, 'iaka.md');
  assert.ok(fs.existsSync(iakaCmd), 'kits/iakaframe-claude/.claude/commands/iaka.md doit toujours exister');
  const txt = fs.readFileSync(iakaCmd, 'utf8');
  for (const verb of ['iakaframe review list', 'iakaframe review apply', 'iakaframe review reject']) {
    assert.match(txt, new RegExp(verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `iaka.md doit toujours citer ${verb}`);
  }
  // git ne rapporte AUCUNE modification sur ce fichier precis dans cette session de travail.
  const st = spawnSync('git', ['status', '--porcelain', '--', 'kits/iakaframe-claude/.claude/commands/iaka.md'],
    { cwd: REPO, encoding: 'utf8' });
  assert.equal(st.stdout.trim(), '', 'iaka.md ne doit porter AUCUNE modification non commitee dans ce lot');
});

test('G6 : aucun verbe du registre ne se nomme `iaka` (jamais de collision sur le declencheur reserve)', () => {
  assert.ok(!VERBES.some(v => v.id === 'iaka'), 'un verbe `iaka` collisionnerait avec le declencheur reserve a la revue d\'apprentissage');
});

// --- GC : garde ANTI-DERIVE — un motif SANS condition de chute compte comme NON DECLARE ---------
// Constat du gate qualite (second volet du lot fix/lotB-conditions-de-chute-et-temoin-A3) : un
// `motif` sans clause « si X, reconsidere » est un jugement de categorie FIGE — exactement le
// patron d'exclusion de confort. Sans cette garde, les 18 motifs d'aujourd'hui sont corriges mais
// un dix-neuvieme naitrait MUET demain. La garde doit NOMMER le verbe fautif, jamais un compte nu.

const MOTIF_PORTE_CHUTE = motif => typeof motif === 'string' && /chute/i.test(motif);

function verbesSansChute(verbes) {
  return verbes
    .filter(v => v.guideClaudeCode && v.guideClaudeCode.generer === false && !MOTIF_PORTE_CHUTE(v.guideClaudeCode.motif))
    .map(v => v.id);
}

test('GC : chaque exclusion `generer:false` du registre porte une condition de chute explicite ("chute si ...") — sinon le motif compte comme NON DECLARE, et le verbe fautif est NOMME', () => {
  const sansChute = verbesSansChute(VERBES);
  assert.deepEqual(sansChute, [], `verbe(s) EXCLU(S) SANS condition de chute (motif fige, exclusion de confort) : ${sansChute.join(', ')}`);
});

// Controles POSITIF et NEGATIF (temoins non vides) : une garde qui refuserait tout serait verte
// elle aussi sur le seul test ci-dessus si elle etait mal cablee (ex. filtre qui ne filtre rien) —
// ces deux temoins synthetiques, independants du contenu reel du registre, prouvent que la garde
// distingue effectivement une exclusion bien formee d'une exclusion muette, et NOMME cette derniere.

test('GC (temoin positif) : une exclusion correctement declaree (motif + "chute si ...") ne remonte JAMAIS comme fautive', () => {
  const bienDeclaree = { id: 'sonde-bien-declaree', guideClaudeCode: { generer: false, motif: 'motif de demonstration — chute si la condition citee ici cesse d\'etre vraie' } };
  assert.deepEqual(verbesSansChute([bienDeclaree]), [], 'une exclusion bien formee ne doit jamais etre signalee par la garde GC');
});

test('GC (temoin negatif) : une exclusion SANS condition de chute (motif fige ou motif vide) est detectee ET le verbe fautif est NOMME', () => {
  const motifFige = { id: 'sonde-motif-fige', guideClaudeCode: { generer: false, motif: 'motif de demonstration sans clause de reconsideration' } };
  const motifVide = { id: 'sonde-motif-vide', guideClaudeCode: { generer: false, motif: '' } };
  assert.deepEqual(verbesSansChute([motifFige]), ['sonde-motif-fige'], 'un motif fige (sans "chute") doit etre nomme');
  assert.deepEqual(verbesSansChute([motifVide]), ['sonde-motif-vide'], 'un motif vide doit etre nomme');
});
