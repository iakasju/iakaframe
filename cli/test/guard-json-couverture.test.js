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
