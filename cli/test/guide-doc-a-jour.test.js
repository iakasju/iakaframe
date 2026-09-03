// CA-14 (Lot A, mode guide du terminal, specs/instructions/cli-mode-guide-selections.md) :
// docs/commandes.md porte --guide pour les 10 cibles, la regle de non-interactivite +
// IAKA_NON_INTERACTIF, et iakaframe --help/USAGE le mentionnent. Idiome deja en place
// (cli/test/branches-locales.test.js:461).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(HERE, '..', 'src', 'index.js');
const DOC = fs.readFileSync(path.join(REPO, 'docs', 'commandes.md'), 'utf8');

function cli(args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: REPO, encoding: 'utf8' });
}

test("CA-14 : docs/commandes.md documente --guide pour chacune des 10 cibles guidees", () => {
  // Motifs EXACTS de debut de ligne de table (§ B) — pas une sous-chaine libre : `list` seul, par
  // exemple, apparait AUSSI dans la liste des motifs d'exclusion du Lot B (faux positif possible).
  const lignes = [
    ['models set', '| `models set <persona> <modèle>` |'],
    ['models unset', '| `models unset <persona>'],
    ['show', '| `show <id>` |'],
    ['list', '| `list [type]` |'],
    ['add', '| `add <kind> <fic>` |'],
    ['remove', '| `remove <kind> <id>` |'],
    ['attach', '| `attach <skill>` |'],
    ['detach', '| `detach <skill>` |'],
    ['frame use', '| `frame use <frameId>` |'],
    ['switch', '| `switch` \\| `use <m> <t>` |'],
  ];
  for (const [nom, motif] of lignes) {
    const idx = DOC.indexOf(motif);
    assert.ok(idx >= 0, `ligne de table absente de docs/commandes.md : ${nom} (motif : ${motif})`);
    const finLigne = DOC.indexOf('\n', idx);
    const ligne = DOC.slice(idx, finLigne < 0 ? undefined : finLigne);
    assert.match(ligne, /--guide/, `--guide absent de la ligne « ${nom} »`);
  }
});

test('CA-14 : docs/commandes.md documente la regle de non-interactivite + IAKA_NON_INTERACTIF', () => {
  assert.match(DOC, /IAKA_NON_INTERACTIF/);
  assert.match(DOC, /peutDemander/);
  assert.match(DOC, /lib\/interactif\.js/);
});

test('CA-14 : docs/commandes.md documente le verbe `commands` et la recette manuelle du palier 2', () => {
  assert.match(DOC, /`commands`|iakaframe commands --json/);
  assert.match(DOC, /mode-guide-palier-2-manuelle\.md/);
});

test('CA-14 : le fichier de recette manuelle CA-13 existe', () => {
  assert.ok(fs.existsSync(path.join(REPO, 'specs', 'recettes', 'mode-guide-palier-2-manuelle.md')));
});

test("CA-14 : iakaframe --help mentionne --guide (derive du registre, G5b)", () => {
  // 9 des 10 cibles ont leur PROPRE ligne dans l'aide globale (`enteteAide`/verbe racine) ; `frame
  // use` est un sous-verbe de `frame` NON detaille au sommaire (design PRE-EXISTANT — seuls les
  // sous-verbes `enteteAide:true` ont leur ligne, cf. index.js `sousVerbeBlocs`) : son `--guide`
  // reste documente par `frame use --help` (verifie ci-dessous) et docs/commandes.md.
  const help = cli(['--help']).stdout;
  const occurrences = (help.match(/--guide/g) || []).length;
  assert.equal(occurrences, 9, `attendu 9 occurrences de --guide dans --help (10 cibles - frame use, non detaillee au sommaire), obtenu ${occurrences}`);
});

test("CA-14 : chaque cible affiche --guide dans son propre --help", () => {
  const cas = [
    ['models', 'set', '--help'],
    ['models', 'unset', '--help'],
    ['show', '--help'],
    ['list', '--help'],
    ['add', '--help'],
    ['remove', '--help'],
    ['attach', '--help'],
    ['detach', '--help'],
    ['frame', 'use', '--help'],
    ['switch', '--help'],
  ];
  for (const argv of cas) {
    const r = cli(argv);
    assert.equal(r.status, 0, `${argv.join(' ')} : exit 0 attendu\n${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /--guide/, `${argv.join(' ')} --help doit mentionner --guide`);
  }
});
