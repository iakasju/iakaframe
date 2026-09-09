// CA-M16 (contrat-machine-du-verbe-install.md § 4 point 6 / § 8) — le TROU C-JSON des verbes hors
// `install` (M-10 : 40 verbes au registre, 57 occurrences de `--json`, 19 couverts par
// guard-json-output.test.js:NOMINAL avant ce lot) est DECLARE, MOTIVE, et CLIQUETE — jamais tu.
// Ce test NE FERME PAS ce trou (successeur nomme `C-JSON-COUVERTURE-COMPLETE`, § 4 « Exclu ») : il
// verifie que le registre `cli/test/fixtures/couverture-json.json` reste FIDELE a `verbes.js`
// (aucun verbe --json oublie, aucun motif manquant) et que le CLIQUET (`horsCouvertureCount`) est
// un geste EXPLICITE, jamais une derive silencieuse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { VERBES } from '../src/lib/verbes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(HERE, 'fixtures', 'couverture-json.json');
const FIXTURE_OPTIONS_PATH = path.join(HERE, 'fixtures', 'couverture-options.json');
const CMD_DIR = path.join(HERE, '..', 'src', 'commands');
const DOCS_PATH = path.join(HERE, '..', '..', 'docs', 'commandes.md');
const CLI = path.join(HERE, '..', 'src', 'index.js');

function chargerFixture() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

// AUTORITE (M-10) : un verbe "declare --json" si son PROPRE `options` le porte, OU si au moins un
// de ses `sousVerbes` le porte — jamais une liste reecrite ici, toujours DERIVEE de verbes.js.
function declareJson(v) {
  if (Array.isArray(v.options) && v.options.includes('--json')) return true;
  if (Array.isArray(v.sousVerbes)) return v.sousVerbes.some((sv) => Array.isArray(sv.options) && sv.options.includes('--json'));
  return false;
}

test('CA-M16 : la liste des verbes du registre correspond EXACTEMENT aux verbes déclarant --json dans verbes.js (aucun oubli, aucun fantôme)', () => {
  const fixture = chargerFixture();
  const idsAutorite = VERBES.filter(declareJson).map((v) => v.id).sort();
  const idsFixture = fixture.verbes.map((v) => v.id).sort();
  assert.deepEqual(idsFixture, idsAutorite, 'le registre de couverture doit porter EXACTEMENT les verbes qui déclarent --json (ni de plus, ni de moins)');
  // CONTREFACTUEL (joué et révoqué, cf. rapport de remise) : retirer une entrée du tableau
  // `verbes` de la fixture SANS retirer le verbe correspondant de verbes.js -> `idsFixture` et
  // `idsAutorite` divergent -> rouge, nommant l'id manquant (assert.deepEqual affiche le diff).
});

test('CA-M16 : `install` est couvert à la fois par c-json ET evenements (les deux rendus du même émetteur)', () => {
  const fixture = chargerFixture();
  const entree = fixture.verbes.find((v) => v.id === 'install');
  assert.ok(entree, 'install doit avoir une entrée dans le registre de couverture');
  assert.ok(entree.couverture.includes('c-json'), 'install doit être couvert par c-json (--json bufferisé)');
  assert.ok(entree.couverture.includes('evenements'), 'install doit être couvert par evenements (--events NDJSON)');
});

test('CA-M16 : chaque entrée "hors-couverture" porte un motif NON VIDE (jamais une exclusion silencieuse)', () => {
  const fixture = chargerFixture();
  const sansMotif = fixture.verbes.filter((v) => v.couverture.includes('hors-couverture') && !(typeof v.motif === 'string' && v.motif.trim().length > 0));
  assert.deepEqual(sansMotif.map((v) => v.id), [], `verbe(s) hors-couverture SANS motif : ${sansMotif.map((v) => v.id).join(', ')}`);
  // CONTREFACTUEL : ajouter au registre un verbe hors-couverture SANS motif (`motif: ''` ou champ
  // absent) -> `sansMotif` le contient -> rouge, NOMMANT l'id fautif.
});

test('CA-M16 : le CLIQUET (`horsCouvertureCount`) reflète le compte RÉEL — toute variation doit être un geste explicite dans le commit qui la fait', () => {
  const fixture = chargerFixture();
  const reel = fixture.verbes.filter((v) => v.couverture.includes('hors-couverture')).length;
  assert.equal(fixture.horsCouvertureCount, reel, 'le champ horsCouvertureCount doit être tenu à jour DANS LE MÊME COMMIT que toute entrée hors-couverture ajoutée/retirée — sinon la dérive est silencieuse');
  // CONTREFACTUEL (§ contrefactuel CA-M16 de l'instruction, joué en deux temps et révoqué) :
  //   1. ajouter au registre un verbe SANS motif           -> le test précédent rougit, le nommant.
  //   2. retirer un verbe présent dans verbes.js du registre -> LE PREMIER test de ce fichier
  //      rougit (idsFixture !== idsAutorite), nommant l'id manquant.
  //   Deux rouges DISTINCTS, chacun nommant son entrée — exactement ce que R-M8 exige de fermer.
});

// =================================================================================================
// G-J2 (C-JSON-COUVERTURE-COMPLETE, § 5 étape 3 / CA-J3) — GARDE DE DÉRIVATION : pour TOUT verbe,
// « --json déclaré au registre » ⟺ « `commands/<verbe>.js` le PARSE » ⟺ « docs/commandes.md le
// DOCUMENTE ». C'est cette garde qui a attrapé `config` par LECTURE (§ 0.3 du cadrage) ; elle
// attrapera le prochain écart, dans N'IMPORTE quel sens.
// =================================================================================================

// Un sous-verbe partage parfois le fichier de commande de son jumeau (ex. `detach` vit dans
// attach.js, cf. cli/src/lib/verbes.js commentaire ligne 88 / § 0.3 du cadrage) — DÉRIVÉ ici en un
// point unique, jamais dupliqué à la main dans chaque test.
const FICHIER_PAR_ID = { detach: 'attach.js' };
function fichierDeCommande(id) { return FICHIER_PAR_ID[id] || `${id}.js`; }

// « Parse » = le fichier de commande porte `json: { type: 'boolean'` (forme exacte imposée par la
// règle 5 du contrat, output.js:9 : `--json` est PARTOUT un booléen).
function parseJsonBooleanDansFichier(id, cmdDir) {
  const p = path.join(cmdDir, fichierDeCommande(id));
  if (!fs.existsSync(p)) return false;
  return /json:\s*\{\s*type:\s*'boolean'/.test(fs.readFileSync(p, 'utf8'));
}

// « Documenté » = au moins une ligne de tableau de docs/commandes.md dont le PREMIER token entre
// backticks est EXACTEMENT `id` (éventuellement suivi d'arguments/sous-verbe, ex. `frame verify`,
// `show <id>`) mentionne `--json` sur CETTE MÊME ligne. Recherche la SOUS-CHAÎNE, jamais une forme
// exacte de phrase (R-J5 : une reformulation de prose ne doit pas casser cette garde).
function docMentionneJson(id, docText) {
  const idEchappe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^\\|\\s*`' + idEchappe + '(?:[\\s`]|$)');
  return docText.split('\n').some((ligne) => re.test(ligne) && ligne.includes('--json'));
}

// Fonction PURE, testée directement (real + synthétique) — le cœur de la garde G-J2.
function verbesEnDerive(verbes, { cmdDir, docText }) {
  const out = [];
  for (const v of verbes) {
    const declare = declareJson(v);
    const parse = parseJsonBooleanDansFichier(v.id, cmdDir);
    const doc = docMentionneJson(v.id, docText);
    if (declare !== parse || declare !== doc) out.push({ id: v.id, declare, parse, doc });
  }
  return out;
}

test('G-J2 : derivation registre <-> parse <-> doc tient pour TOUS les verbes REELS du registre', () => {
  const docText = fs.readFileSync(DOCS_PATH, 'utf8');
  const derives = verbesEnDerive(VERBES, { cmdDir: CMD_DIR, docText });
  assert.deepEqual(derives, [], `verbe(s) en dérive registre/parse/doc : ${derives.map((d) => `${d.id}(déclaré=${d.declare},parsé=${d.parse},documenté=${d.doc})`).join(', ')}`);
});

test('G-J2 (témoin négatif 1) : `--json` ajouté au registre d\'un verbe qui NE LE PARSE PAS (banner) est détecté, nommant `banner`', () => {
  const docText = fs.readFileSync(DOCS_PATH, 'utf8');
  const sonde = { id: 'banner', options: ['--json'], sousVerbes: [] };
  const derives = verbesEnDerive([sonde], { cmdDir: CMD_DIR, docText });
  assert.deepEqual(derives.map((d) => d.id), ['banner'], 'un `--json` déclaré sans parseArgs réel (banner.js ne le porte pas) doit être nommé par la garde');
});

test('G-J2 (témoin négatif 2) : `--json` retiré de la ligne doc d\'un verbe REELLEMENT declare+parse (list) est détecté, nommant `list`', () => {
  const docReel = fs.readFileSync(DOCS_PATH, 'utf8');
  // Copie EN MEMOIRE, jamais ecrite sur disque : on ampute la ligne `list [type]` de son `--json`.
  const docAmputee = docReel.split('\n').map((ligne) =>
    /^\|\s*`list \[type\]/.test(ligne) ? ligne.replace('--json ', '').replace('--json', '') : ligne,
  ).join('\n');
  const sonde = { id: 'list', options: ['--json'], sousVerbes: [] };
  const derives = verbesEnDerive([sonde], { cmdDir: CMD_DIR, docText: docAmputee });
  assert.deepEqual(derives.map((d) => d.id), ['list'], 'un `--json` retiré de la doc (list.js le parse pourtant) doit être nommé par la garde');
});

test('G-J2 (témoin positif) : un verbe cohérent sur les trois sources (list, réel) ne remonte JAMAIS comme fautif', () => {
  const docText = fs.readFileSync(DOCS_PATH, 'utf8');
  const sonde = VERBES.find((v) => v.id === 'list');
  assert.deepEqual(verbesEnDerive([sonde], { cmdDir: CMD_DIR, docText }), [], 'list est declare+parse+documente : la garde ne doit rien signaler');
});

// =================================================================================================
// G-J2, EXTENSION AU GRAIN OPTION (C-JSON-COUVERTURE-COMPLETE, J3, § 5 point 3 de la mission) —
// la garde de dérivation ci-dessus était SPÉCIALISÉE `--json`. `attach`/`detach` viennent de montrer
// (gate-c-json-j2.md, écart signalé par 🏹 Legolas) qu'un AUTRE drapeau peut subir EXACTEMENT le
// même écart (parsé + documenté, mais absent du registre) sans qu'aucune garde ne le voie. Cette
// extension généralise le MÊME calcul (déclaré ⟺ parsé ⟺ documenté) à AU MOINS `--json`, `--root`,
// `--path`, `--project` — les fonctions dédiées `--json` ci-dessus restent INCHANGÉES (elles
// gardent leurs propres témoins) ; celles-ci les complètent pour les 3 autres drapeaux.
// =================================================================================================

// Type ATTENDU du parseArgs pour chaque option de grain (`--json` est TOUJOURS booléen, règle 5 du
// contrat ; `--root`/`--path`/`--project` sont TOUJOURS des chemins, donc des chaînes).
const TYPE_PAR_OPTION = { '--json': 'boolean', '--root': 'string', '--path': 'string', '--project': 'string' };
const CLE_PAR_OPTION = { '--json': 'json', '--root': 'root', '--path': 'path', '--project': 'project' };

// « --option » matche `'--option'` (booléen nu) OU `'--option <arg>'` (avec placeholder) — jamais
// une sous-chaîne fortuite (ex. `--project` ne doit pas matcher un hypothétique `--projection`).
function optionDeclaree(o, option) { return o === option || o.startsWith(`${option} `); }

function declareOption(v, option) {
  if (Array.isArray(v.options) && v.options.some((o) => optionDeclaree(o, option))) return true;
  if (Array.isArray(v.sousVerbes)) return v.sousVerbes.some((sv) => Array.isArray(sv.options) && sv.options.some((o) => optionDeclaree(o, option)));
  return false;
}

// ANGLE MORT (a), CA-R8, hérité de `gate-c-json-j3.md:260-264` et REDIT ici, jamais maquillé : la
// dérivation est TEXTUELLE (`fs.readFileSync` + regex), pas un parsing AST. Une ligne `parseArgs`
// NEUTRALISÉE par `//` compte encore comme « parsée » ; une ligne de tableau `docs/commandes.md`
// située dans un bloc de code (```) compterait encore comme « documentée ». Cette garde ne PEUT
// PAS distinguer du code mort de du code vivant : elle lit des octets, pas un arbre syntaxique.
// Successeur nommé pour lever cet angle mort : `GARDES-DERIVATION-PAR-AST`.
function parseOptionDansFichier(id, cmdDir, option) {
  // Exception NOMMÉE (AR-R3, CA-R6) : `root` n'a pas de fichier de commande — la preuve de
  // « parsé » est la présence LITTÉRALE de l'option dans `cli/src/index.js`, jamais une liste
  // blanche muette qui renverrait `true` sans preuve.
  const exception = EXCEPTIONS_PARSE_INLINE[id];
  if (exception && exception.option === option) {
    return fs.readFileSync(INDEX_PATH, 'utf8').includes(`'${option}'`);
  }
  const p = path.join(cmdDir, fichierDeCommande(id));
  if (!fs.existsSync(p)) return false;
  const cle = CLE_PAR_OPTION[option];
  const type = TYPE_PAR_OPTION[option];
  const re = new RegExp(`${cle}:\\s*\\{\\s*type:\\s*'${type}'`);
  return re.test(fs.readFileSync(p, 'utf8'));
}

// ANGLE MORT (b), CA-R8, redit ici (côté « option » de la dérivation ; le côté `--json` porte le
// même défaut depuis J0-J3, non ré-explicité à chaque fonction) : `ligne.includes(option)` est un
// `includes` NU sur SOUS-CHAÎNE — `--project` matcherait une ligne qui ne mentionne QUE
// `--projects` (un drapeau hypothétique différent). Le côté « déclaré » de cette garde est propre
// (`optionDeclaree` plus haut exige l'égalité stricte ou un espace suivant) ; le côté « doc » ne
// l'est pas. Aucune formulation de ce fichier ni du rapport de remise ne doit laisser croire à une
// garde sémantique : c'est un `includes` textuel, jamais un parseur de tableau Markdown.
function docMentionneOption(id, docText, option) {
  const idEchappe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^\\|\\s*`' + idEchappe + '(?:[\\s`]|$)');
  return docText.split('\n').some((ligne) => re.test(ligne) && ligne.includes(option));
}

// Fonction PURE, générique — le cœur de l'extension au grain option.
function verbesEnDeriveOption(verbes, { cmdDir, docText, option }) {
  const out = [];
  for (const v of verbes) {
    const declare = declareOption(v, option);
    const parse = parseOptionDansFichier(v.id, cmdDir, option);
    const doc = docMentionneOption(v.id, docText, option);
    if (declare !== parse || declare !== doc) out.push({ id: v.id, option, declare, parse, doc });
  }
  return out;
}

// AR-R3 (REGISTRE-OPTIONS-ROOT-PATH-PROJET, § 5 étape 7) — le verbe `root` implémente `--root` EN
// LIGNE dans `index.js` (`rest.indexOf('--root')`, `index.js:165-169`) : PAS de `parseArgs`
// classique, PAS de `commands/root.js`. L'heuristique générique de « parse » (lire un fichier de
// commande) est donc structurellement aveugle à ce verbe. Plutôt qu'une LISTE BLANCHE MUETTE qui
// l'exclurait silencieusement du balayage, l'exception est NOMMÉE et prouvée par une PREUVE
// POSITIVE : la présence littérale de `'--root'` dans `cli/src/index.js` (le SEUL fichier qui
// l'implémente). Si cette ligne disparaît un jour (déplacement de `root` vers `commands/root.js`,
// refonte de l'inline), la preuve devient fausse et la garde rougit, NOMMANT `root` (CA-R6).
// Jamais un déplacement de `root` en commands/root.js pour le confort de ce test (§ 4 « Exclu »).
const INDEX_PATH = path.join(HERE, '..', 'src', 'index.js');
const EXCEPTIONS_PARSE_INLINE = {
  root: { option: '--root', motif: "implementation en ligne, index.js:165-169 (rest.indexOf('--root'), pas de commands/root.js)" },
};

// Balayage STRICT (zéro dérive exigé), verbe par verbe, sur les QUATRE options du contrat de
// dérivation (`--json`, `--root`, `--path`, `--project` — AR-R3(a) de REGISTRE-OPTIONS-ROOT-PATH-
// PROJET). La boucle ne portait QUE `--json` (J0-J3) : `config`/`go`/`brief`/`recap`/`assemble`
// parsaient `--root` sans le déclarer ni le documenter, `switch` le déclarait sans le documenter,
// `go`/`brief`/`recap` parsaient un alias `--project` non déclaré/documenté, `observe` le
// documentait sans le déclarer, `repo` déclarait+parsait `--path` sans documenter le verbe — les 8
// écarts fermés par ce lot (commits déclarant `--root`/`--project` + ligne `repo` neuve). La garde
// est désormais verte du premier coup sur les 4 options, PARCE QUE ces 8 écarts sont fermés — pas
// parce que le mécanisme aurait été affaibli.
for (const option of ['--json', '--root', '--path', '--project']) {
  test(`G-J2 (grain option) : derivation registre <-> parse <-> doc tient pour ${option} sur TOUS les verbes REELS`, () => {
    const docText = fs.readFileSync(DOCS_PATH, 'utf8');
    const derives = verbesEnDeriveOption(VERBES, { cmdDir: CMD_DIR, docText, option });
    assert.deepEqual(derives, [], `verbe(s) en dérive ${option} : ${derives.map((d) => `${d.id}(déclaré=${d.declare},parsé=${d.parse},documenté=${d.doc})`).join(', ')}`);
  });
}

test('G-J2 (grain option, témoin négatif 1) : `--root` retiré du registre d\'un verbe REELLEMENT parse+documente (add) est détecté, nommant `add`', () => {
  const docText = fs.readFileSync(DOCS_PATH, 'utf8');
  const sonde = { id: 'add', options: [], sousVerbes: [] };
  const derives = verbesEnDeriveOption([sonde], { cmdDir: CMD_DIR, docText, option: '--root' });
  assert.deepEqual(derives.map((d) => d.id), ['add'], 'un `--root` retiré du registre (add.js le parse et docs/commandes.md le documente) doit être nommé par la garde');
});

test('G-J2 (grain option, témoin négatif 2) : `--project` ajouté au registre d\'un verbe qui NE LE PARSE PAS (banner) est détecté, nommant `banner`', () => {
  const docText = fs.readFileSync(DOCS_PATH, 'utf8');
  const sonde = { id: 'banner', options: ['--project <dir>'], sousVerbes: [] };
  const derives = verbesEnDeriveOption([sonde], { cmdDir: CMD_DIR, docText, option: '--project' });
  assert.deepEqual(derives.map((d) => d.id), ['banner'], 'un `--project` déclaré sans parseArgs réel (banner.js ne le porte pas) doit être nommé par la garde');
});

// CA-R5 (§ 5 étape 8) — contrefactuels COMPLETS : un par option, DANS LES DEUX SENS, sur sondes
// synthétiques. Les deux tests ci-dessus (`add`/--root retiré, `banner`/--project ajouté) couvrent
// déjà une direction chacun ; les 6 tests table-driven qui suivent couvrent les 6 combinaisons
// restantes (4 options × 2 sens − les 2 déjà écrits ci-dessus). `onboard` (parse+doc `--path`) et
// `agents` (parse+doc `--project`) sont les verbes RÉELS retenus pour la direction « retrait » —
// `banner` (ne parse aucune des 4 options) reste le sonde-témoin pour la direction « ajout ».
const CONTREFACTUELS_DEUX_SENS = [
  { option: '--json', sens: 'retire', verbeReel: 'list', motif: "list.js le parse et docs/commandes.md le documente" },
  { option: '--json', sens: 'ajoute', motif: "banner.js ne le porte pas" },
  { option: '--root', sens: 'ajoute', motif: "banner.js ne le porte pas" },
  { option: '--path', sens: 'retire', verbeReel: 'onboard', motif: "onboard.js le parse et docs/commandes.md le documente" },
  { option: '--path', sens: 'ajoute', motif: "banner.js ne le porte pas" },
  { option: '--project', sens: 'retire', verbeReel: 'agents', motif: "agents.js le parse et docs/commandes.md le documente" },
];

for (const { option, sens, verbeReel, motif } of CONTREFACTUELS_DEUX_SENS) {
  if (sens === 'retire') {
    test(`G-J2 (grain option, CA-R5) : ${option} retiré du registre d'un verbe REELLEMENT parse+documente (${verbeReel}) est détecté, nommant \`${verbeReel}\``, () => {
      const docText = fs.readFileSync(DOCS_PATH, 'utf8');
      const sonde = { id: verbeReel, options: [], sousVerbes: [] };
      const derives = verbesEnDeriveOption([sonde], { cmdDir: CMD_DIR, docText, option });
      assert.deepEqual(derives.map((d) => d.id), [verbeReel], `un ${option} retiré du registre (${motif}) doit être nommé par la garde`);
    });
  } else {
    test(`G-J2 (grain option, CA-R5) : ${option} ajouté au registre d'un verbe qui NE LE PARSE PAS (banner) est détecté, nommant \`banner\``, () => {
      const docText = fs.readFileSync(DOCS_PATH, 'utf8');
      const sonde = { id: 'banner', options: [`${option} <x>`], sousVerbes: [] };
      const derives = verbesEnDeriveOption([sonde], { cmdDir: CMD_DIR, docText, option });
      assert.deepEqual(derives.map((d) => d.id), ['banner'], `un ${option} déclaré sans parseArgs réel (${motif}) doit être nommé par la garde`);
    });
  }
}

// =================================================================================================
// CA-R7 (AR-R4(a), § 5 étape 9) — le balayage de dérivation ci-dessus porte 4 options ; tout ce
// qu'il NE couvre PAS (`--node`, `--force`, `--ascii`, `--portfolio`, `--binding`…) n'est pas tu :
// `cli/test/fixtures/couverture-options.json` le NOMME, le MOTIVE et le CHIFFRE — même patron que
// `couverture-json.json` (`horsCouvertureCount`, CA-M16 en tête de ce fichier).
// =================================================================================================

function chargerFixtureOptions() {
  return JSON.parse(fs.readFileSync(FIXTURE_OPTIONS_PATH, 'utf8'));
}

// Fonctions PURES, réutilisées par le test réel ET par les contrefactuels sur COPIE altérée en
// mémoire (jamais le fichier sur disque) — même discipline que `verbesEnDeriveOption` plus haut.
function entreesSansMotif(fixtureOptions) {
  return fixtureOptions.horsBalayage.filter((e) => !(typeof e.motif === 'string' && e.motif.trim().length > 0));
}
function entreesSansSuccesseur(fixtureOptions) {
  return fixtureOptions.horsBalayage.filter((e) => !(typeof e.successeur === 'string' && e.successeur.trim().length > 0));
}
function cliquetHorsBalayageJuste(fixtureOptions) {
  return fixtureOptions.horsBalayageCount === fixtureOptions.horsBalayage.length;
}

test('CA-R7 : `optionsBalayees` du registre correspond EXACTEMENT aux options réellement balayées par la boucle bloquante', () => {
  const fixture = chargerFixtureOptions();
  const declarees = fixture.optionsBalayees.map((o) => o.option).sort();
  assert.deepEqual(declarees, ['--json', '--path', '--project', '--root'], 'le registre doit nommer exactement les options que la boucle bloquante balaye — ni plus, ni moins');
  // CONTREFACTUEL (joué et révoqué, cf. rapport de remise) : retirer une option de la boucle
  // bloquante SANS retirer son entrée `optionsBalayees` (ou l'inverse) -> ce test rougit.
});

test('CA-R7 : chaque entrée hors-balayage porte un motif NON VIDE et un successeur NOMMÉ (jamais une exclusion silencieuse)', () => {
  const fixture = chargerFixtureOptions();
  const sansMotif = entreesSansMotif(fixture);
  assert.deepEqual(sansMotif.map((e) => `${e.verbe} ${e.option}`), [], `entrée(s) hors-balayage SANS motif : ${sansMotif.map((e) => `${e.verbe} ${e.option}`).join(', ')}`);
  const sansSuccesseur = entreesSansSuccesseur(fixture);
  assert.deepEqual(sansSuccesseur.map((e) => `${e.verbe} ${e.option}`), [], `entrée(s) hors-balayage SANS successeur : ${sansSuccesseur.map((e) => `${e.verbe} ${e.option}`).join(', ')}`);
  // CONTREFACTUEL : ajouter au registre une entrée hors-balayage avec `motif: ''` (ou champ absent)
  // -> `sansMotif` la contient -> rouge, NOMMANT l'entrée fautive (verbe + option). Rejoué ci-dessous
  // sur une copie EN MÉMOIRE, jamais sur le fichier réel.
});

test('CA-R7 : au moins les 4 écarts adjacents mesurés au cadrage figurent dans horsBalayage', () => {
  const fixture = chargerFixtureOptions();
  const cles = fixture.horsBalayage.map((e) => `${e.verbe} ${e.option}`);
  for (const attendu of ['assemble --node', 'assemble --force', 'assemble --ascii', 'observe --portfolio', 'commands --ascii', 'models --binding']) {
    assert.ok(cles.includes(attendu), `écart adjacent attendu absent de horsBalayage : ${attendu}`);
  }
});

test('CA-R7 : le CLIQUET (`horsBalayageCount`) reflète le compte RÉEL — toute variation doit être un geste explicite dans le commit qui la fait', () => {
  const fixture = chargerFixtureOptions();
  assert.ok(cliquetHorsBalayageJuste(fixture), 'horsBalayageCount doit être tenu à jour DANS LE MÊME COMMIT que toute entrée hors-balayage ajoutée/retirée — sinon la dérive est silencieuse');
  // CONTREFACTUEL (joué en deux temps et révoqué, même patron que CA-M16) :
  //   1. ajouter au registre une entrée hors-balayage SANS motif -> le test précédent rougit, la nommant.
  //   2. retirer une entrée SANS ajuster horsBalayageCount -> CE test rougit (compte désaccordé du réel).
  //   Deux rouges DISTINCTS, chacun nommant sa cause. Rejoué ci-dessous sur une copie EN MÉMOIRE.
});

test('CA-R7 (contrefactuel joué EN MÉMOIRE, jamais sur disque) : une entrée hors-balayage sans motif ou sans successeur est détectée par les fonctions RÉELLES du test', () => {
  const alteree = { horsBalayage: [{ verbe: 'sonde', option: '--sonde', motif: '', successeur: 'X' }, { verbe: 'sonde2', option: '--sonde2', motif: 'x', successeur: '' }] };
  assert.deepEqual(entreesSansMotif(alteree).map((e) => `${e.verbe} ${e.option}`), ['sonde --sonde'], 'la fonction réelle doit nommer l\'entrée sans motif');
  assert.deepEqual(entreesSansSuccesseur(alteree).map((e) => `${e.verbe} ${e.option}`), ['sonde2 --sonde2'], 'la fonction réelle doit nommer l\'entrée sans successeur');
});

test('CA-R7 (contrefactuel joué EN MÉMOIRE) : un compte désaccordé du réel est détecté par la fonction RÉELLE du test', () => {
  const alteree = { horsBalayage: [{ verbe: 'sonde', option: '--sonde', motif: 'x', successeur: 'X' }], horsBalayageCount: 0 };
  assert.equal(cliquetHorsBalayageJuste(alteree), false, 'un compte à 0 pour 1 entrée réelle doit être rejeté par la fonction réelle');
});

test('G-J2 (grain option, témoin positif) : `attach`/`detach` (--root, désormais déclarés) ne remontent JAMAIS comme fautifs sur --root/--json', () => {
  const docText = fs.readFileSync(DOCS_PATH, 'utf8');
  for (const option of ['--root', '--json']) {
    const sondes = VERBES.filter((v) => v.id === 'attach' || v.id === 'detach');
    assert.deepEqual(verbesEnDeriveOption(sondes, { cmdDir: CMD_DIR, docText, option }), [], `attach/detach declares+parses+documentes sur ${option} : la garde ne doit rien signaler`);
  }
});

// =================================================================================================
// Règle 6 (AR-J3, § 2(a)) — ABSTENTION LÉGALE : `ok:false` + exit 0 n'est légal QUE si la charge
// porte un `status` non vide (« je n'ai rien pu mesurer », jamais « j'ai mesuré et c'est mauvais »).
// Écrite dans l'en-tête de cli/src/lib/output.js — le CODE du module reste inchangé (§ 4 Inclus 4) :
// cette garde vit donc ENTIEREMENT ici, sur une fonction pure ET sur l'invocation REELLE de
// `vendor-check` (seul verbe du dépôt à emprunter ce chemin, § 0.3 point 4).
// =================================================================================================

function respecteRegle6(payload, exitCode) {
  if (exitCode !== 0) return true; // la règle 6 ne concerne que l'abstention (exit 0), jamais l'échec
  if (payload && payload.ok === false) {
    return typeof payload.status === 'string' && payload.status.trim().length > 0;
  }
  return true;
}

test('CA-J4 : vendor-check en abstention (frère GUI absent, sans --strict) respecte la règle 6', () => {
  const absent = path.join(os.tmpdir(), 'iakaframe-gui-absent-regle6-' + Date.now());
  const r = spawnSync(process.execPath, [CLI, 'vendor-check', '--json'], {
    encoding: 'utf8', env: { ...process.env, IAKAFRAME_GUI_ROOT: absent },
  });
  assert.equal(r.status, 0, 'une abstention ne doit jamais bloquer un clone isolé (AR-J3)');
  const payload = JSON.parse(r.stdout);
  assert.equal(payload.ok, false, 'rien n\'a été vérifié : ok reste false');
  assert.equal(respecteRegle6(payload, r.status), true, 'la charge d\'abstention DOIT porter un `status` non vide');
  assert.equal(typeof payload.status, 'string');
  assert.ok(payload.status.trim().length > 0);
});

test('CA-J4 (témoin négatif) : une charge `{ok:false}` SANS `status` sortant en exit 0 est détectée', () => {
  assert.equal(respecteRegle6({ ok: false, error: 'x' }, 0), false, 'une abstention sans status doit être refusée par la garde');
  assert.equal(respecteRegle6({ ok: false, status: '' }, 0), false, 'un status VIDE ne vaut pas mieux qu\'un status absent');
});

test('CA-J4 (témoin positif) : `ok:true` et tout `ok:false` en exit 1 sont HORS du champ de la règle 6', () => {
  assert.equal(respecteRegle6({ ok: true }, 0), true);
  assert.equal(respecteRegle6({ ok: false, error: 'x' }, 1), true, 'un vrai échec (exit 1) n\'a jamais besoin de `status`');
});

// =================================================================================================
// G-J1 (C-JSON-COUVERTURE-COMPLETE, § 5 étape 8 / CA-J13) — GARDE DE COMPLÉTUDE : pour TOUTE
// invocation ATTENDUE (verbe, ou sous-verbe s'il en déclare, portant `--json` dans verbes.js), il
// existe au moins une entrée `NOMINAL` OU `ERRORS` dans guard-json-output.test.js qui l'exerce.
// Grain (AR-J1(b), déjà appliqué au § 5 étape 5/6) : SOUS-VERBE quand le verbe a des sous-verbes
// (ex. `models set`/`models unset`), VERBE sinon (ex. `list`, `show`).
//
// DÉRIVÉE PAR LECTURE DU TEXTE de guard-json-output.test.js — JAMAIS par IMPORT de ce fichier :
// un `import` d'un `.test.js` réexécute AUSSI son bac à sable (mkdtempSync, spawnSync de bootstrap)
// ET ses `test()` (constaté à l'écriture de cette garde : `node --test
// test/guard-json-couverture.test.js` seul faisait alors remonter 74 tests au lieu de 11, les 63
// tests de guard-json-output.test.js réexécutés en silence comme effet de bord). Même patron que
// G-J2 ci-dessus pour docs/commandes.md et commands/<verbe>.js : la SOUS-CHAÎNE, jamais l'exécution.
// =================================================================================================

const OUTPUT_TEST_PATH = path.join(HERE, 'guard-json-output.test.js');

// Isole le texte d'un tableau `const <NOM> = [ ... ];` par comptage de crochets équilibrés (jamais
// une regex multiligne fragile sur la fin du tableau — R-J5 : la garde mesure la FORME, pas la prose).
function extraireTableau(source, nomVariable) {
  const marqueur = `const ${nomVariable} = [`;
  const debut = source.indexOf(marqueur);
  if (debut === -1) throw new Error(`tableau ${nomVariable} introuvable dans guard-json-output.test.js`);
  let i = debut + marqueur.length - 1; // positionne sur le '[' d'ouverture
  let profondeur = 0;
  for (; i < source.length; i++) {
    if (source[i] === '[') profondeur++;
    else if (source[i] === ']') { profondeur--; if (profondeur === 0) { i++; break; } }
  }
  return source.slice(debut, i);
}

// Pour chaque entrée `['<nom-affiche>', ['<verbe>'[, '<second>', ...]], ...]`, extrait (verbe,
// second|null). `second` n'est retenu QUE s'il ne commence pas par `-` (sinon c'est une OPTION,
// jamais un sous-verbe/positional — même heuristique que le CLI réel : le premier token non-option
// après le verbe).
function verbesEtSecondsDuTableau(texteTableau) {
  const re = /,\s*\[\s*'([a-zA-Z][\w-]*)'(?:\s*,\s*'([^']*)')?/g;
  const out = [];
  let m;
  while ((m = re.exec(texteTableau))) {
    const verbe = m[1];
    const second = m[2] !== undefined && !m[2].startsWith('-') ? m[2] : null;
    out.push({ verbe, second });
  }
  return out;
}

function invocationsCouvertesReelles() {
  const source = fs.readFileSync(OUTPUT_TEST_PATH, 'utf8');
  const entrees = [
    ...verbesEtSecondsDuTableau(extraireTableau(source, 'NOMINAL')),
    ...verbesEtSecondsDuTableau(extraireTableau(source, 'ERRORS')),
  ];
  const couvertes = new Set();
  for (const { verbe, second } of entrees) {
    couvertes.add(verbe);
    if (second) couvertes.add(`${verbe} ${second}`);
  }
  return couvertes;
}

// Dérive, à partir de VERBES, les invocations ATTENDUES (AR-J1(b)).
function invocationsAttendues(verbes) {
  const attendues = [];
  for (const v of verbes) {
    if (Array.isArray(v.sousVerbes) && v.sousVerbes.length > 0) {
      for (const sv of v.sousVerbes) {
        if (Array.isArray(sv.options) && sv.options.includes('--json')) {
          attendues.push({ id: `${v.id} ${sv.id}`, verbId: v.id });
        }
      }
    } else if (Array.isArray(v.options) && v.options.includes('--json')) {
      attendues.push({ id: v.id, verbId: v.id });
    }
  }
  return attendues;
}

test('CA-J13 : toute invocation attendue (verbe/sous-verbe déclarant --json) a au moins une entrée NOMINAL ou ERRORS', () => {
  const couvertes = invocationsCouvertesReelles();
  const attendues = invocationsAttendues(VERBES);
  // Un verbe dont la forme BARE est couverte (ex. `skills`, `models`) satisfait AUSSI la sous-attente
  // de son sous-verbe implicite/par-defaut — la garde ne sur-exige jamais une invocation SEPAREE
  // qui n'existe pas dans le CLI reel (ex. `skills deploy` n'est jamais invoque tel quel : `skills`
  // bare EST le sous-verbe `deploy`).
  const manquantes = attendues.filter((a) => !couvertes.has(a.id) && !couvertes.has(a.verbId));
  assert.deepEqual(manquantes.map((m) => m.id), [], `invocation(s) attendue(s) SANS NOMINAL ni ERRORS : ${manquantes.map((m) => m.id).join(', ')}`);
});

test('CA-J13 (contrefactuel) : un verbe fictif portant --json SANS entrée NOMINAL/ERRORS est détecté, nommant son id', () => {
  const couvertes = invocationsCouvertesReelles();
  const sonde = [...VERBES, { id: 'verbe-fictif-cjson-j3', options: ['--json'], sousVerbes: [] }];
  const attendues = invocationsAttendues(sonde);
  const manquantes = attendues.filter((a) => !couvertes.has(a.id) && !couvertes.has(a.verbId));
  assert.deepEqual(manquantes.map((m) => m.id), ['verbe-fictif-cjson-j3'], 'le verbe fictif doit être nommé par la garde');
});

test('CA-J13 (témoin positif) : `list` (verbe reel, grain verbe) et `models set`/`models unset` (grain sous-verbe) ne remontent JAMAIS comme manquants', () => {
  const couvertes = invocationsCouvertesReelles();
  assert.ok(couvertes.has('list'), '`list` doit etre couvert (invocation bare)');
  assert.ok(couvertes.has('models set'), '`models set` doit etre couvert');
  assert.ok(couvertes.has('models unset'), '`models unset` doit etre couvert');
});
