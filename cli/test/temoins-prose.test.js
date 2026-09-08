// CA-J8 (specs/instructions/c-json-couverture-complete.md § 5 étape 1 / § 8) — la prose HUMAINE
// des verbes touchés par le lot C-JSON-COUVERTURE-COMPLETE (J0 : `config` ; J1 : les 9 lecteurs
// purs) ne bouge pas d'un octet. Les témoins (cli/test/fixtures/temoins-prose/*.txt) ont été
// enregistrés à l'ÉTAPE 1 du lot, AVANT toute modification de production — un témoin enregistré
// après coup n'aurait rien prouvé (même discipline que CA-M8, cli/test/install-prose-non-regression.test.js).
//
// NORMALISATION (liste ÉCRITE, volontairement COURTE) : les seuls jetons remplacés sont ceux dont
// la valeur est un ARTEFACT D'EXÉCUTION (chemin de sandbox jetable, horodatage ISO, latence en ms),
// jamais un mot du message humain lui-même.
//   - <TS>          horodatage ISO de `endpoints` (mesure « EN DIRECT »)
//   - <MS>           latence en ms de la sonde `endpoints`
//   - <REPO>         racine du dépôt (chemin absolu, dépend de la machine)
//   - <PROJ>         dossier projet jetable (`produit path`/`config`/`list`)
//   - <GUI_ABSENT>   chemin jetable inexistant passé à IAKAFRAME_GUI_ROOT (`vendor-check`)
//
// CAVEAT ASSUMÉ (à nommer, pas à cacher) : `frame verify` et `frame lint --all` lisent le contenu
// RÉEL du dépôt (miroir frames/releases/, bibliothèque de frames). Si ce contenu évolue pour une
// raison sans rapport avec ce lot (un frame ajouté, un token G6 de plus), CE témoin devra être
// régénéré dans LE COMMIT qui fait bouger ce contenu — ce n'est pas une régression du lot C-JSON,
// c'est la garde qui fait exactement ce qu'elle promet : signaler qu'un octet a changé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');
const FIX = path.join(HERE, 'fixtures', 'temoins-prose');

function tmp(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

function run(args, extraEnv = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: 'utf8', env: { ...process.env, ...extraEnv } });
  return r.stdout;
}
function runErr(args, extraEnv = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: 'utf8', env: { ...process.env, ...extraEnv } });
  return r.stderr;
}
function normaliser(s, jetons) {
  let out = s;
  for (const [val, jeton] of jetons) out = out.split(val).join(jeton);
  return out;
}
function comparer(nom, obtenu) {
  const temoin = fs.readFileSync(path.join(FIX, `${nom}.txt`), 'utf8');
  assert.equal(obtenu, temoin, `prose humaine de « ${nom} » divergente du témoin enregistré à l'étape 1 (CA-J8)`);
  // CONTREFACTUEL (joué et révoqué, cf. rapport de remise) : changer un mot du message humain d'un
  // de ces verbes fait diverger `obtenu` du témoin -> rouge, nommant le verbe (${nom}) et affichant
  // le diff complet (Node imprime les deux chaînes).
}

test('CA-J8 : commands (prose) inchangée', () => {
  comparer('commands', run(['commands']));
});

test('CA-J8 : endpoints (prose) inchangée, hors horodatage/latence', () => {
  const out = run(['endpoints', '--url', 'http://127.0.0.1:1/x', '--timeout', '1']);
  const normalise = out
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '<TS>')
    .replace(/\d+ ms\)/g, '<MS> ms)');
  comparer('endpoints', normalise);
});

test('CA-J8 : frame verify (prose) inchangée, hors racine du dépôt', () => {
  const normalise = normaliser(run(['frame', 'verify']), [[REPO, '<REPO>']]);
  comparer('frame-verify', normalise);
});

test('CA-J8 : frame lint --all (prose) inchangée', () => {
  comparer('frame-lint', run(['frame', 'lint', '--all']));
});

test('CA-J8 : review show sans id (prose d\'erreur, stderr) inchangée', () => {
  const HOME = tmp('iaka-prose-home-');
  comparer('review-show', runErr(['review', 'show', '--home', HOME]));
});

test('CA-J8 : produit path/config/list (prose) inchangée, hors chemin du projet jetable', () => {
  const PROJ = tmp('iaka-prose-proj-');
  run(['produit', 'init', '--project', PROJ]);
  comparer('produit-path', normaliser(run(['produit', 'path', '--project', PROJ]), [[PROJ, '<PROJ>']]));
  comparer('produit-config', normaliser(run(['produit', 'config', '--project', PROJ]), [[PROJ, '<PROJ>']]));
  comparer('produit-list', normaliser(run(['produit', 'list', '--project', PROJ]), [[PROJ, '<PROJ>']]));
});

test('CA-J8 : vendor-check en abstention (prose) inchangée, hors chemin jetable absent', () => {
  const absent = path.join(os.tmpdir(), 'iakaframe-gui-absent-temoin-test-' + Date.now());
  const normalise = normaliser(run(['vendor-check'], { IAKAFRAME_GUI_ROOT: absent }), [[absent, '<GUI_ABSENT>']]);
  comparer('vendor-check', normalise);
});
