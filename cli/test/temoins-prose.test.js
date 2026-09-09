// CA-J8 (specs/instructions/c-json-couverture-complete.md § 5 étape 1 / § 8) — la prose HUMAINE
// des verbes touchés par le lot C-JSON-COUVERTURE-COMPLETE (J0 : `config` ; J1 : les 9 lecteurs
// purs ; J2 : les 9 écrivains/interactifs) ne bouge pas d'un octet. Les témoins
// (cli/test/fixtures/temoins-prose/*.txt) ont été enregistrés à l'ÉTAPE 1 du lot, AVANT toute
// modification de production — un témoin enregistré après coup n'aurait rien prouvé (même
// discipline que CA-M8, cli/test/install-prose-non-regression.test.js). Pour J2, aucune ligne de
// `cli/src/commands/*.js` n'est modifiée par ce lot (§ 2 : lot de gardes) : le témoin protège contre
// une régression FUTURE, pas contre celle de ce commit.
//
// NORMALISATION (liste ÉCRITE, volontairement COURTE) : les seuls jetons remplacés sont ceux dont
// la valeur est un ARTEFACT D'EXÉCUTION (chemin de sandbox jetable, horodatage ISO, latence en ms),
// jamais un mot du message humain lui-même.
//   - <TS>          horodatage ISO de `endpoints` (mesure « EN DIRECT »)
//   - <MS>           latence en ms de la sonde `endpoints`
//   - <REPO>         racine du dépôt (chemin absolu, dépend de la machine)
//   - <PROJ>         dossier projet jetable (`produit path`/`config`/`list`, `skills`, `models set`,
//                    `switch`)
//   - <LIB>          bibliothèque jetable (`add`, `remove`)
//   - <TRASH>        dossier de corbeille horodaté `.trash-<ts>` (`remove`)
//   - <SRC> / <HOME> source/canon jetables (`consolidate`)
//   - <ROOT>         chapeau jetable (`range --list`)
//   - <GUI_ABSENT>   chemin jetable inexistant passé à IAKAFRAME_GUI_ROOT (`vendor-check`)
//
// CAVEAT ASSUMÉ (à nommer, pas à cacher) : `frame verify` et `frame lint --all` lisent le contenu
// RÉEL du dépôt (miroir frames/releases/, bibliothèque de frames). Si ce contenu évolue pour une
// raison sans rapport avec ce lot (un frame ajouté, un token G6 de plus), CE témoin devra être
// régénéré dans LE COMMIT qui fait bouger ce contenu — ce n'est pas une régression du lot C-JSON,
// c'est la garde qui fait exactement ce qu'elle promet : signaler qu'un octet a changé. MÊME CAVEAT
// pour `skills` et `switch` (J2) : la liste des skills/personas déployés reflète le contenu RÉEL de
// `library/` — un skill ajouté au dépôt fait bouger ces deux témoins, sans rapport avec ce lot.
//
// PÉRIMÈTRE ASSUMÉ (J2) : `models` (bare, sans sous-verbe) N'A PAS de témoin ici — sa prose humaine
// affiche un âge de suggestions calculé PAR RAPPORT À AUJOURD'HUI (non déterministe d'un jour sur
// l'autre) et son chemin interactif est explicitement réservé à J3 (AR-J4, § 4 « Exclu » de ce
// lot). `models set`/`unset`, eux, sont déterministes et témoignés.
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

// =================================================================================================
// J2 (C-JSON-COUVERTURE-COMPLETE, § 5 étape 6) — témoins des 9 écrivains/interactifs. Mêmes bacs à
// sable (drapeaux de redirection existants, AR-J2(b)) que cli/test/guard-json-output.test.js, mais
// des SANDBOXES INDÉPENDANTES (jamais partagées entre les deux fichiers) : un témoin de prose n'a
// pas à connaître l'état d'un autre test.
// =================================================================================================

function ecrireLib(root, fichiers) {
  for (const [rel, contenu] of fichiers) {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, contenu);
  }
}

test('CA-J8 : skills (prose) inchangée, hors chemin du projet jetable', () => {
  const PROJ = tmp('iaka-prose-skills-');
  comparer('skills', normaliser(run(['skills', '--project', PROJ]), [[PROJ, '<PROJ>']]));
});

test('CA-J8 : models set (prose) inchangée, hors chemin du projet jetable', () => {
  const PROJ = tmp('iaka-prose-models-');
  comparer('models-set', normaliser(run(['models', 'set', 'gimli', 'sonnet', '--path', PROJ]), [[PROJ, '<PROJ>']]));
});

test('CA-J8 : add (prose) inchangée, hors chemin de la bibliothèque jetable', () => {
  const LIB = tmp('iaka-prose-add-');
  comparer('add', normaliser(run(['add', 'skill', 'demo-skill-add-temoin', '--root', LIB]), [[LIB, '<LIB>']]));
});

test('CA-J8 : remove (prose) inchangée, hors chemin de bibliothèque et horodatage de corbeille', () => {
  const LIB = tmp('iaka-prose-remove-');
  ecrireLib(LIB, [['library/skills/orphan-skill-temoin/SKILL.md', '---\nid: orphan-skill-temoin\nname: orphelin\n---\n# skill orphelin temoin\n']]);
  const out = normaliser(run(['remove', 'skill', 'orphan-skill-temoin', '--root', LIB]), [[LIB, '<LIB>']])
    .replace(/\.trash-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/g, '<TRASH>');
  comparer('remove', out);
});

test('CA-J8 : attach/detach (prose) inchangée, hors chemin de bibliothèque jetable', () => {
  const LIB = tmp('iaka-prose-attach-');
  ecrireLib(LIB, [
    ['library/personas/p-temoin.md', '---\nid: p-temoin\nname: Temoin\nroleKey: dev\nskills: []\n---\n# p-temoin\n'],
    ['library/skills/demo-skill-temoin/SKILL.md', '---\nid: demo-skill-temoin\nname: demo\n---\n# skill demo temoin\n'],
  ]);
  comparer('attach', normaliser(run(['attach', 'demo-skill-temoin', '--persona', 'p-temoin', '--root', LIB]), [[LIB, '<LIB>']]));
  comparer('detach', normaliser(run(['detach', 'demo-skill-temoin', '--persona', 'p-temoin', '--root', LIB]), [[LIB, '<LIB>']]));
});

test('CA-J8 : switch (prose) inchangée, hors chemin du projet jetable', () => {
  const PROJ = tmp('iaka-prose-switch-');
  comparer('switch', normaliser(run(['switch', 'iakaframe', 'iakaframe-8', '--path', PROJ]), [[PROJ, '<PROJ>']]));
});

test('CA-J8 : consolidate (prose) inchangée, hors chemins source/canon jetables', () => {
  const SRC = tmp('iaka-prose-consolidate-src-');
  const HOME = tmp('iaka-prose-consolidate-home-');
  comparer('consolidate', normaliser(run(['consolidate', '--home', HOME, '--source', SRC]), [[SRC, '<SRC>'], [HOME, '<HOME>']]));
});

test('CA-J8 : range --list (prose) inchangée, hors chemin du chapeau jetable', () => {
  const ROOT = tmp('iaka-prose-range-');
  fs.mkdirSync(path.join(ROOT, 'demo-projet-temoin', '.git'), { recursive: true });
  comparer('range-list', normaliser(run(['range', '--list', '--root', ROOT]), [[ROOT, '<ROOT>']]));
});

// =================================================================================================
// J3 (C-JSON-COUVERTURE-COMPLETE, § 5 étape 1 / CA-J8) — témoins des 4 CIBLES GUIDÉES non encore
// témoignées par J0-J2 (show, list, models unset, frame use — les 6 autres cibles guidées, add/
// remove/attach/detach/switch/models-set, ont déjà leur témoin ci-dessus). Enregistrés AVANT toute
// ligne de production du refus explicite --json/--guide (AR-J4(c), § 5 étape 7) : ce sont eux qui
// PROUVENT, après coup, que le refus ajouté ne touche NI la prose humaine NI `--guide` seul (sans
// --json) de ces 4 cibles. Invocations SANS ARGUMENT (comme guidage-non-interactif.test.js:CIBLES) :
// déterministes, sans effet de bord, rejouables à volonté.
//
// `--guide` SEUL (non-TTY, sans --json) reproduit ICI le MÊME témoin, octet pour octet : la preuve
// que le mode guide (paliers 0-2) reste intact pour ces 4 cibles quand --json est absent. Pour les
// 6 cibles déjà témoignées ci-dessus (des ÉCRIVAINS, rejouer `--guide` les mute une seconde fois),
// cette même invariance est déjà établie par G1 (cli/test/guidage-non-interactif.test.js, comparaison
// dynamique avecGuide/sansGuide sur les 10 cibles, variante "non-TTY baseline") — ne pas la
// dupliquer ici en fixture évite un second bac à sable écrivain pour une preuve déjà tenue.
// =================================================================================================

test('CA-J8 : show (prose d\'erreur, stderr) inchangée', () => {
  comparer('show', runErr(['show']));
});

test('CA-J8 : show --guide (non-TTY, sans --json) — identique au témoin sans --guide', () => {
  comparer('show', runErr(['show', '--guide']));
});

test('CA-J8 : list (prose) inchangée', () => {
  comparer('list', run(['list']));
});

test('CA-J8 : list --guide (non-TTY, sans --json) — identique au témoin sans --guide', () => {
  comparer('list', run(['list', '--guide']));
});

test('CA-J8 : models unset (prose d\'erreur, stderr) inchangée', () => {
  comparer('models-unset', runErr(['models', 'unset']));
});

test('CA-J8 : models unset --guide (non-TTY, sans --json) — identique au témoin sans --guide', () => {
  comparer('models-unset', runErr(['models', 'unset', '--guide']));
});

test('CA-J8 : frame use (prose d\'erreur, stderr) inchangée', () => {
  comparer('frame-use', runErr(['frame', 'use']));
});

test('CA-J8 : frame use --guide (non-TTY, sans --json) — identique au témoin sans --guide', () => {
  comparer('frame-use', runErr(['frame', 'use', '--guide']));
});
