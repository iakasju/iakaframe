// Garde anti-derive « C-JSON » (instruction cli-api-surface-harmonisation.md, criteres § 7).
// Deux volets :
//  (1) VERROU STATIQUE : aucune commande n'imprime un JSON en direct — toute sortie machine passe
//      par lib/output.js (interdit `console.log(JSON.stringify(` / `console.error(JSON.stringify(`
//      hors output.js). C'est le point unique qui empeche la re-divergence des formes de sortie.
//  (2) CONTRAT DE SORTIE : on balaie le parc de commandes a `--json` et on exige, sur un cas nominal,
//      une ENVELOPPE OBJET avec ok:true (jamais de tableau/scalaire nu), un `count` egal a la
//      longueur sur les collections, et sur les cas d'erreur { ok:false, error } sur STDOUT, exit 1,
//      RIEN sur stderr.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureLayout } from '../src/lib/memory.js';
import { close } from '../src/lib/close.js';
import { listProposals } from '../src/lib/review.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');           // vraie bibliotheque du depot
const CMD_DIR = path.join(HERE, '..', 'src', 'commands');

function cli(args, extraEnv = {}) {
  const r = spawnSync('node', [CLI, ...args], { cwd: REPO, encoding: 'utf8', env: { ...process.env, ...extraEnv } });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

// --- (1) VERROU STATIQUE ---------------------------------------------------------------------------

test('anti-derive : aucun console.log/error(JSON.stringify( hors lib/output.js dans commands/', () => {
  const forbidden = /console\.(log|error)\(\s*JSON\.stringify/;
  const offenders = [];
  for (const f of fs.readdirSync(CMD_DIR)) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(CMD_DIR, f), 'utf8');
    if (forbidden.test(src)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `sorties JSON en direct (doivent passer par lib/output.js) : ${offenders.join(', ')}`);
});

test('lib/output.js existe et exporte emit/ok/collection/fail', async () => {
  const mod = await import('../src/lib/output.js');
  for (const name of ['emit', 'ok', 'collection', 'fail', 'printJson']) {
    assert.equal(typeof mod[name], 'function', `export manquant : ${name}`);
  }
});

// --- (2) CONTRAT DE SORTIE : balayage nominal ------------------------------------------------------

const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-home-'));
const OBS = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-obs-'));
const EMPTY = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-empty-'));
const PROJ = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-proj-'));

// Depot git minimal + UNE cible locale : de quoi exercer `canaux --json` sans reseau (le verbe
// est le chemin RESEAU du CLI ; sa conformite C-JSON, elle, se verifie hors reseau).
const GITD = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-git-'));
const BARE = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-bare-'));
{
  const g = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
  g(BARE, ['init', '--bare', '-q']);
  g(GITD, ['init', '-q']); g(GITD, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  g(GITD, ['config', 'user.email', 't@e.invalid']); g(GITD, ['config', 'user.name', 'T']);
  fs.writeFileSync(path.join(GITD, 'a.txt'), 'a');
  g(GITD, ['add', '-A']); g(GITD, ['commit', '-q', '-m', 'seed']);
  g(GITD, ['remote', 'add', 'origin', BARE]); g(GITD, ['push', '-q', 'origin', 'main']);
}

// Dedies au verbe `install` (contrat-machine-du-verbe-install.md, AR-M2(a)) : reservoir vivant =
// le DEPOT REEL lui-meme (--root REPO), reseau TOUJOURS injoignable (double, meme garde que
// install-verbe.test.js) -> chemin DETERMINISTE "deja a jour" (etape 1 sautee, aucune confirmation
// requise), etapes 3/4 en dry-run decrivent sans exiger de reseau exploitable.
const INSTALL_CLAUDE = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-install-claude-'));
const INSTALL_APPS = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-install-apps-'));
const INSTALL_BACKUPS = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-install-backups-'));
const INSTALL_ENV = { IAKAFRAME_INSTALL_TEST_DOUBLE: '1' };

// Canon jetable dedie a `review show` (lecteur J1, C-JSON-COUVERTURE-COMPLETE) : une proposition
// deposee par le pipeline REEL (`close`), jamais une frontmatter ecrite a la main — meme patron que
// cli/test/review.test.js:tmpCanonWithProposals. Le sous-verbe ne peut pas se mesurer sans au moins
// UNE proposition en attente ; on la fabrique une fois, ici, pour tout le fichier.
const REVIEW_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-review-'));
ensureLayout(REVIEW_HOME);
fs.mkdirSync(path.join(REVIEW_HOME, 'transcripts'), { recursive: true });
fs.writeFileSync(
  path.join(REVIEW_HOME, 'transcripts', 'seed.md'),
  '@correction(registre) c-json :: la garde de sortie machine se mesure en execution\n'
  + '@correction(registre) c-json :: la garde de sortie machine se mesure en execution\n',
);
close(REVIEW_HOME, { now: new Date('2026-09-08T00:00:00Z') });
const REVIEW_PROPOSAL_ID = listProposals(REVIEW_HOME)[0]?.id;

// =================================================================================================
// J2 (C-JSON-COUVERTURE-COMPLETE, § 5 etape 6) : les 9 ECRIVAINS/interactifs restants, mesures en
// BAC A SABLE par les drapeaux de redirection DEJA EXISTANTS (AR-J2(b)) — zero ligne de production,
// zero --dry-run invente. Trois familles de bacs a sable, montees UNE fois pour tout le fichier.
// =================================================================================================

// --- bibliotheque jetable (fabrique une mini-bibliotheque tmp, JAMAIS la vraie library/ du depot —
// meme patron que cli/test/remove.test.js:mkLib) : dediee a `add`/`remove`/`attach`/`detach`. -----
function ecrireLib(root, fichiers) {
  for (const [rel, contenu] of fichiers) {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, contenu);
  }
}

// `add` : racine VIERGE — le scaffold pool (`add skill <id>`) cree lui-meme library/skills/<id>/.
const ADD_LIB = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-add-'));

// `remove` : UN skill orphelin (non reference) — RESTRICT ne bloque donc pas le retrait direct.
const REMOVE_LIB = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-remove-'));
ecrireLib(REMOVE_LIB, [
  ['library/skills/orphan-skill-j2/SKILL.md', '---\nid: orphan-skill-j2\nname: orphelin\n---\n# skill orphelin j2\n'],
]);

// `attach`/`detach` : DEUX personas (l'un sans le skill, l'autre l'ayant deja) + le skill materialise
// — attach et detach s'exercent chacun sur SA propre persona, sans dependre de l'ordre des tests.
const ATTACH_LIB = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-attach-'));
ecrireLib(ATTACH_LIB, [
  ['library/personas/p-sans-skill.md', '---\nid: p-sans-skill\nname: SansSkill\nroleKey: dev\nskills: []\n---\n# p-sans-skill\n'],
  ['library/personas/p-avec-skill.md', '---\nid: p-avec-skill\nname: AvecSkill\nroleKey: dev\nskills: [demo-skill-j2]\n---\n# p-avec-skill\n'],
  ['library/skills/demo-skill-j2/SKILL.md', '---\nid: demo-skill-j2\nname: demo\n---\n# skill demo j2\n'],
]);

// --- projet jetable (--path/--project) : dedie a `skills`, `models` (bare + set + unset), `switch`.
// La BIBLIOTHEQUE reste la VRAIE du depot (REPO, lue seule — meme patron deja en place pour
// `agents status --project PROJ`/`config --path PROJ` plus haut) : seule la CIBLE d'ecriture change.
const SKILLS_PROJ = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-skills-'));
const MODELS_PROJ = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-models-'));
// Pre-seed une surcharge SUR UNE AUTRE persona (legolas), pour que `models unset` (NOMINAL,
// ci-dessous) ait reellement quelque chose a retirer SANS toucher a la surcharge posee par
// `models set` (gimli) : les deux invocations mesurees restent independantes l'une de l'autre.
{
  const r = spawnSync('node', [CLI, 'models', 'set', 'legolas', 'sonnet', '--path', MODELS_PROJ, '--json'], { cwd: REPO, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`bootstrap models set (legolas) a echoue : ${r.stdout}${r.stderr}`);
}
const SWITCH_PROJ = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-switch-'));

// --- canon jetable (--home/--source) : dedie a `consolidate`. Source VIDE : `fiches:0` est un etat
// nominal legitime (le rapport reste ok:true), et evite toute dependance au contenu REEL du
// portefeuille (§ 0.5 : non mesure, jamais suppose).
const CONSOLIDATE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-consolidate-home-'));
const CONSOLIDATE_SRC = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-consolidate-src-'));

// --- chapeau jetable (--root) : dedie a `range`. `--list`/`--branches` sont LECTURE SEULE (aucun
// restic lance, cf. range.js) ; le cas ECRIVAIN (`--dry-run`) est REPOUSSE en ERRORS ci-dessous avec
// `--password-command false` — echec DETERMINISTE et INSTANTANE (aucune ecriture, aucune attente
// reseau), au lieu de dependre de la joignabilite REELLE du LAN iakabox (fragile hors LAN comme SUR
// le LAN — precision d'execution, AR-J2(b)).
const RANGE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cjson-range-'));
fs.mkdirSync(path.join(RANGE_ROOT, 'demo-projet-j2', '.git'), { recursive: true });

// (nom, args, cle de collection attendue | null pour une ressource/rapport a plat, env supplementaire)
const NOMINAL = [
  ['list', ['list', '--json'], 'collections'],
  ['list <type>', ['list', 'personas', '--json'], 'items'],
  ['portfolio', ['portfolio', '--json', '--root', EMPTY], 'projects'],
  ['assemble', ['assemble', 'iakaframe', 'iakaframe-8', '--json'], null],
  ['agents list', ['agents', 'list', '--json'], 'personas'],
  ['agents status', ['agents', 'status', '--json', '--project', PROJ], 'personas'],
  ['config', ['config', '--json', '--path', PROJ], null],
  ['show', ['show', 'gandalf', '--json'], null],
  ['memory init', ['memory', 'init', '--json', '--home', HOME], 'created'],
  ['memory path', ['memory', 'path', '--json', '--home', HOME], null],
  ['memory config', ['memory', 'config', '--json', '--home', HOME], null],
  ['memory list', ['memory', 'list', 'profil', '--json', '--home', HOME], 'entries'],
  ['open', ['open', '--json', '--home', HOME], null],
  ['recall', ['recall', 'requete-absente', '--json', '--home', HOME], 'results'],
  ['observe list', ['observe', 'list', '--json', '--home', OBS], 'files'],
  ['review list', ['review', 'list', '--json', '--home', HOME], 'proposals'],
  ['close', ['close', '--json', '--home', HOME], null],
  ['services', ['services', '--json', '--hosts', '127.0.0.1', '--timeout', '1'], 'services'],
  ['canaux', ['canaux', '--json', '--path', GITD, '--timeout', '5'], 'canaux'],
  [
    'install',
    ['install', '--dry-run', '--json', '--yes', '--root', REPO, '--target-claude', INSTALL_CLAUDE, '--apps-dir', INSTALL_APPS, '--backup-dir', INSTALL_BACKUPS],
    'evenements',
    INSTALL_ENV,
  ],
  // --- J1 (C-JSON-COUVERTURE-COMPLETE) : les 9 lecteurs purs, grain SOUS-VERBE (AR-J1(b)) ---------
  ['commands', ['commands', '--json'], 'verbes'],
  // endpoints : hote injoignable en 127.0.0.1:1 + --timeout court (AR-J2(b) precision d'execution,
  // meme patron que `services --hosts 127.0.0.1` ci-dessus) — la SONDE echoue, le RAPPORT reste ok:true.
  ['endpoints', ['endpoints', '--json', '--url', 'http://127.0.0.1:1/x', '--timeout', '1'], 'essais'],
  // frame verify : correction J3 (une ligne, cf. rapport de remise) — le rapport { ok, checked,
  // count, findings } portait `findings` (pluriel, array) SANS son frere `count` (regle 3 du
  // contrat, violation constatee a l'etape 0 du lot precedent). `count` ajoute dans frame.js ;
  // `findings` devient donc un collKey verifie comme les autres collections.
  ['frame verify', ['frame', 'verify', '--json'], 'findings'],
  ['frame lint --all', ['frame', 'lint', '--all', '--json'], 'findings'],
  ['review show', ['review', 'show', REVIEW_PROPOSAL_ID, '--json', '--home', REVIEW_HOME], null],
  ['produit path', ['produit', 'path', '--json', '--project', PROJ], null],
  ['produit config', ['produit', 'config', '--json', '--project', PROJ], null],
  ['produit list', ['produit', 'list', '--json', '--project', PROJ], 'entries'],
  // --- J2 (C-JSON-COUVERTURE-COMPLETE) : les 9 ecrivains/interactifs restants, grain SOUS-VERBE
  // (AR-J1(b)), bac a sable par les drapeaux EXISTANTS (AR-J2(b)) — cliquet 9 -> 0. ------------
  ['skills', ['skills', '--json', '--project', SKILLS_PROJ], 'skills'],
  // models (bare, sans set/unset) : json:true fait sortir AVANT le process interactif (models.js:1104)
  // — deja mesure a l'etape 0 comme non-interactif sous --json ; rapport a PLAT (count = roles.length,
  // pas targets.length — precision d'execution sur la mesure du cadrage, cf. rapport de remise).
  ['models', ['models', '--json', '--hosts', '127.0.0.1', '--timeout', '1', '--path', MODELS_PROJ], null],
  ['models set', ['models', 'set', 'gimli', 'sonnet', '--path', MODELS_PROJ, '--json'], null],
  // cible legolas (pre-seede en preambule), PAS gimli : les deux invocations mesurees restent
  // independantes l'une de l'autre (cf. commentaire de bootstrap de MODELS_PROJ ci-dessus).
  ['models unset', ['models', 'unset', 'legolas', '--path', MODELS_PROJ, '--json'], null],
  ['add', ['add', 'skill', 'demo-skill-add-j2', '--root', ADD_LIB, '--json'], null],
  ['remove', ['remove', 'skill', 'orphan-skill-j2', '--root', REMOVE_LIB, '--json'], null],
  ['attach', ['attach', 'demo-skill-j2', '--persona', 'p-sans-skill', '--root', ATTACH_LIB, '--json'], null],
  ['detach', ['detach', 'demo-skill-j2', '--persona', 'p-avec-skill', '--root', ATTACH_LIB, '--json'], null],
  ['switch', ['switch', 'iakaframe', 'iakaframe-8', '--path', SWITCH_PROJ, '--json'], null],
  ['consolidate', ['consolidate', '--home', CONSOLIDATE_HOME, '--source', CONSOLIDATE_SRC, '--json'], null],
  ['range --list', ['range', '--list', '--root', RANGE_ROOT, '--json'], 'projets'],
];

for (const [name, args, collKey, extraEnv] of NOMINAL) {
  test(`C-JSON nominal : ${name} -> objet { ok:true } (jamais un tableau/scalaire nu)`, () => {
    const { stdout } = cli(args, extraEnv || {});
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(stdout); }, `stdout non JSON : ${stdout.slice(0, 120)}`);
    assert.equal(typeof obj, 'object');
    assert.ok(obj !== null && !Array.isArray(obj), 'racine = objet, jamais un tableau nu');
    assert.equal(obj.ok, true, 'ok:true attendu en succes');
    if (collKey) {
      assert.ok(Array.isArray(obj[collKey]), `collection attendue sous la cle « ${collKey} »`);
      assert.equal(obj.count, obj[collKey].length, 'count = longueur exacte de la collection');
    }
  });
}

// --- (2ter) J2 : EMPREINTE DISQUE des 9 ecrivains — l'effet reel, pas seulement la charge JSON.
// S'execute APRES la boucle NOMINAL ci-dessus (node:test joue les tests d'un MEME fichier dans leur
// ORDRE DE DEFINITION, jamais en parallele au sein d'un fichier) : les invocations ont deja eu lieu,
// on en verifie ici la TRACE sur disque, et QUE dans le bac a sable (jamais REPO). ------------------

test('C-JSON empreinte (J2) : skills a ecrit sous SKILLS_PROJ/.claude/skills/ (jamais ailleurs)', () => {
  const dir = path.join(SKILLS_PROJ, '.claude', 'skills');
  assert.ok(fs.existsSync(dir), 'aucun skill deploye sous le bac a sable');
  assert.ok(fs.readdirSync(dir).length > 0, 'le dossier skills est vide');
});

test('C-JSON empreinte (J2) : models set a pose la surcharge ET projete le contrat sous MODELS_PROJ', () => {
  const overrides = JSON.parse(fs.readFileSync(path.join(MODELS_PROJ, 'iakaframe.json'), 'utf8'));
  assert.equal(overrides.modelOverrides?.gimli, 'sonnet', 'surcharge gimli:sonnet absente de iakaframe.json');
});

test('C-JSON empreinte (J2) : models unset a retire SEULEMENT la surcharge/le contrat legolas (gimli intact)', () => {
  assert.ok(!fs.existsSync(path.join(MODELS_PROJ, '.claude', 'agents', 'legolas.md')), 'le contrat de projet de legolas aurait du etre retire par unset');
  const overrides = JSON.parse(fs.readFileSync(path.join(MODELS_PROJ, 'iakaframe.json'), 'utf8'));
  assert.equal(overrides.modelOverrides?.legolas, undefined, 'la surcharge legolas aurait du etre retiree');
  assert.equal(overrides.modelOverrides?.gimli, 'sonnet', 'unset a du toucher la surcharge gimli, posee par le test precedent');
});

test('C-JSON empreinte (J2) : add a materialise le skill scaffolde sous ADD_LIB (jamais dans la vraie library/)', () => {
  assert.ok(fs.existsSync(path.join(ADD_LIB, 'library', 'skills', 'demo-skill-add-j2', 'SKILL.md')), 'skill scaffolde introuvable sous le bac a sable');
  assert.ok(!fs.existsSync(path.join(REPO, 'library', 'skills', 'demo-skill-add-j2')), 'FUITE : le scaffold a ecrit dans la VRAIE bibliotheque du depot');
});

test('C-JSON empreinte (J2) : remove a deplace le skill orphelin en corbeille (non destructif)', () => {
  assert.ok(!fs.existsSync(path.join(REMOVE_LIB, 'library', 'skills', 'orphan-skill-j2')), 'le skill retire est encore a son emplacement d\'origine');
  const trashDirs = fs.readdirSync(REMOVE_LIB).filter((n) => n.startsWith('.trash-'));
  assert.ok(trashDirs.length > 0, 'aucune corbeille creee par remove');
});

test('C-JSON empreinte (J2) : attach a mute skills:[] du SEUL persona cible (ATTACH_LIB)', () => {
  const src = fs.readFileSync(path.join(ATTACH_LIB, 'library', 'personas', 'p-sans-skill.md'), 'utf8');
  assert.match(src, /skills: \[demo-skill-j2\]/, 'attach n\'a pas ecrit demo-skill-j2 dans skills:[] de p-sans-skill');
});

test('C-JSON empreinte (J2) : detach a retire le skill du SEUL persona cible (ATTACH_LIB)', () => {
  const src = fs.readFileSync(path.join(ATTACH_LIB, 'library', 'personas', 'p-avec-skill.md'), 'utf8');
  assert.match(src, /skills: \[\]/, 'detach n\'a pas retire demo-skill-j2 de skills:[] de p-avec-skill');
});

test('C-JSON empreinte (J2) : switch a deploye le contrat + le marqueur sous SWITCH_PROJ', () => {
  assert.ok(fs.existsSync(path.join(SWITCH_PROJ, '.claude', 'agents', 'gimli.md')), 'contrat gimli non deploye par switch');
  assert.ok(fs.existsSync(path.join(SWITCH_PROJ, '.claude', 'iakaframe-kit.json')), 'marqueur iakaframe-kit.json absent');
});

test('C-JSON empreinte (J2) : consolidate a produit l\'apercu sous CONSOLIDATE_HOME (canon reel jamais mute par ce lot)', () => {
  assert.ok(fs.existsSync(path.join(CONSOLIDATE_HOME, 'consolidation', 'DIFF.md')), 'DIFF.md absent du staging de consolidation');
  assert.ok(fs.existsSync(path.join(CONSOLIDATE_HOME, 'consolidation', 'RAPPORT.md')), 'RAPPORT.md absent du staging de consolidation');
});

// --- (2bis) CONTRAT DE SORTIE : discipline d'erreur machine (regle 4) -----------------------------

const ERRORS = [
  ['list <type inconnu>', ['list', 'zzz', '--json']],
  ['show <inexistant>', ['show', 'zzznope', '--json']],
  ['assemble <inconnus>', ['assemble', 'nope', 'nope', '--json']],
  ['memory list sans cible', ['memory', 'list', '--json', '--home', HOME]],
  ['canaux hors depot git', ['canaux', '--json', '--path', EMPTY]],
  ['install <combinaison incoherente>', ['install', '--json', '--events', '--root', EMPTY], INSTALL_ENV],
  // vendor-check --strict, frere GUI ABSENT (aucun --gui : resolution par IAKAFRAME_GUI_ROOT, cf.
  // vendor.js:resolveGuiRoot) : l'ABSTENTION (regle 6, AR-J3) est PROMUE en erreur sous --strict
  // (vendor-check.js:268-277) -> { ok:false, error: reason, status:'skipped' }, exit 1, stderr vide.
  // C'est la SEULE forme de vendor-check qui porte reellement `error` (le cas DRIFT ne le porte
  // pas — cf. rapport de remise § etape 0) ; c'est donc la seule eligible a la garde ERRORS
  // generique (qui exige `typeof obj.error === 'string'`).
  [
    'vendor-check --strict <gui absent>',
    ['vendor-check', '--strict', '--json'],
    { IAKAFRAME_GUI_ROOT: path.join(EMPTY, 'gui-definitivement-absent') },
  ],
  // range --dry-run : `--password-command false` fait echouer restic AVANT tout acces reseau reel
  // (Fatal: Resolving password failed), en ~200ms, sans dependre de la joignabilite du LAN iakabox
  // dans un sens ou l'autre (cf. commentaire de RANGE_ROOT ci-dessus). Rien n'est ecrit : le --dry-run
  // deja porte par `range` (AR-J2(b), precision d'execution) ne fait jamais la difference ici, restic
  // echoue avant de l'interpreter.
  [
    'range --dry-run <mot de passe injoignable>',
    ['range', 'demo-projet-j2', '--dry-run', '--root', RANGE_ROOT, '--password-command', 'false', '--json'],
  ],
];

for (const [name, args, extraEnv] of ERRORS) {
  test(`C-JSON erreur : ${name} -> { ok:false, error } sur stdout, exit 1, rien sur stderr`, () => {
    const { stdout, stderr, status } = cli(args, extraEnv || {});
    assert.equal(status, 1, 'exitCode 1 attendu');
    assert.equal(stderr.trim(), '', 'aucun texte humain sur stderr en mode --json');
    const obj = JSON.parse(stdout);
    assert.equal(obj.ok, false);
    assert.equal(typeof obj.error, 'string');
    assert.ok(obj.error.length > 0);
  });
}

test('C-JSON empreinte (J2) : range --dry-run (mot de passe injoignable) n\'a rien ecrit sous RANGE_ROOT', () => {
  assert.deepEqual(fs.readdirSync(RANGE_ROOT), ['demo-projet-j2'], 'range a laisse une trace inattendue dans le chapeau jetable');
});

test.after(() => {
  for (const d of [
    HOME, OBS, EMPTY, PROJ, GITD, BARE, INSTALL_CLAUDE, INSTALL_APPS, INSTALL_BACKUPS, REVIEW_HOME,
    ADD_LIB, REMOVE_LIB, ATTACH_LIB, SKILLS_PROJ, MODELS_PROJ, SWITCH_PROJ,
    CONSOLIDATE_HOME, CONSOLIDATE_SRC, RANGE_ROOT,
  ]) fs.rmSync(d, { recursive: true, force: true });
});
