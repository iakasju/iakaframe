// Garde AR-J(a) (BUNDLE-INSTALL-MJS-ABSENT, CA-B6) : `required: true` du prepack garantit que la
// SOURCE existe dans le depot au moment du prepack — JAMAIS que la copie part reellement dans le
// tarball publie. Trois chemins pourraient re-amputer le paquet sans que cette garde-la ne bouge
// (modification de `files`, apparition d'un `.npmignore`, changement de traitement des
// dot-repertoires par npm — N9/§0.4 de l'instruction du lot) : « une preuve se compare au
// fichier, pas a une autre sortie ». Ce test empaquette REELLEMENT (`npm pack`), sur une COPIE
// ISOLEE fidele du depot publiable, et verifie ce qui part effectivement dans le tarball.
//
// POURQUOI UNE COPIE ISOLEE, ET PAS `cli/` DIRECTEMENT (mesure sur ce poste) : `npm pack` declenche
// le prepack, qui SUPPRIME puis REGENERE `_bundled/` (`bundle.js:42-43`, `fs.rmSync` + rebuild).
// `node --test` execute les FICHIERS de test en parallele : un second test qui empaquette REELLEMENT
// (cli/test/install-paquet-publie.test.js, CA-B5) le ferait DANS LA MEME `cli/_bundled/` en meme
// temps, avec un ENOENT/tarball-corrompu au premier passage complet de la suite. Copier `cli/` +
// ses cinq voisins requis (library/methods/teams/bindings/kits) + install.mjs dans un repertoire
// NEUF, propre a ce test, rend le prepack DETERMINISTE et sans concurrence — sans jamais toucher a
// l'arbre de travail reel (neutralisation CA-B7/R-D, renforcee au-dela du minimum exige).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI_DIR = path.join(REPO, 'cli');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-bundle-tarball-')); }

function npmDisponible() {
  const r = spawnSync('npm', ['--version'], { encoding: 'utf8' });
  return !r.error && r.status === 0;
}

function tarDisponible() {
  const r = spawnSync('tar', ['--version'], { encoding: 'utf8' });
  return !r.error && r.status === 0;
}

// Copie ISOLEE et fidele du depot publiable (cli/ + les cinq voisins requis par ASSETS +
// install.mjs) : `bundle.js` resout `repoRoot` d'un niveau au-dessus de sa propre position
// (`import.meta.url`), donc le copier sous <racine neuve>/cli/scripts/ suffit a faire
// fonctionner le prepack SUR LA COPIE, sans jamais lire ni ecrire dans le depot reel.
function copierDepotPourPack() {
  const root = tmp();
  for (const d of ['library', 'methods', 'teams', 'bindings', 'kits', 'design-naonedge']) {
    const src = path.join(REPO, d);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(root, d), { recursive: true });
  }
  fs.copyFileSync(path.join(REPO, 'install.mjs'), path.join(root, 'install.mjs'));
  fs.cpSync(path.join(REPO, 'cli', 'scripts'), path.join(root, 'cli', 'scripts'), { recursive: true });
  fs.cpSync(path.join(REPO, 'cli', 'src'), path.join(root, 'cli', 'src'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'cli', 'package.json'), path.join(root, 'cli', 'package.json'));
  const readme = path.join(REPO, 'cli', 'README.md');
  if (fs.existsSync(readme)) fs.copyFileSync(readme, path.join(root, 'cli', 'README.md'));
  return path.join(root, 'cli');
}

test('CA-B6 (AR-J(a)) : un `npm pack` RÉEL embarque _bundled/install.mjs ET _bundled/kits/** dans le tarball publié', (t) => {
  // SKIP explicite avec son code si l'environnement ne peut pas empaqueter — jamais un vert
  // (convention du corpus, cf. vitrine:en-ligne et registre:repli-latest).
  if (!npmDisponible()) return t.skip('npm indisponible sur ce poste — jamais un vert (AR-J(a))');
  if (!tarDisponible()) return t.skip('tar indisponible sur ce poste — jamais un vert (AR-J(a))');

  const cliIsole = copierDepotPourPack();
  const dest = tmp();
  const pack = spawnSync('npm', ['pack', '--pack-destination', dest, '--json'], {
    cwd: cliIsole, encoding: 'utf8',
  });
  assert.equal(pack.status, 0, `npm pack a échoué (code ${pack.status}) :\n${pack.stderr}`);

  // `npm pack` relaie tel quel le stdout du prepack (les lignes `+ _bundled/...` de bundle.js)
  // AVANT sa propre sortie JSON : on isole la portion JSON en repérant la ligne `[` qui l'ouvre,
  // plutôt que de parser tout `pack.stdout` (qui n'est alors pas du JSON valide).
  const lignes = pack.stdout.split('\n');
  const debutJson = lignes.findIndex((l) => l.trim() === '[');
  assert.ok(debutJson !== -1, `sortie \`npm pack --json\` sans JSON reconnaissable :\n${pack.stdout}`);
  let info;
  try { info = JSON.parse(lignes.slice(debutJson).join('\n')); } catch (e) {
    assert.fail(`sortie \`npm pack --json\` illisible (${e.message}) :\n${pack.stdout}`);
  }
  assert.equal(info.length, 1, 'un seul tarball attendu');
  const tgz = path.join(dest, info[0].filename);
  assert.ok(fs.existsSync(tgz), `tarball introuvable : ${tgz}`);

  const listing = spawnSync('tar', ['-tzf', tgz], { encoding: 'utf8' });
  assert.equal(listing.status, 0, `lecture du tarball impossible : ${listing.stderr}`);
  const entries = listing.stdout.split('\n').filter(Boolean);

  assert.ok(
    entries.includes('package/_bundled/install.mjs'),
    'package/_bundled/install.mjs DOIT figurer dans le tarball publié (contenu réel, pas la liste des assets)',
  );
  assert.ok(
    entries.some((e) => e.startsWith('package/_bundled/kits/')),
    'package/_bundled/kits/** DOIT figurer dans le tarball publié (voisin requis par install.mjs, N8)',
  );
});

// Contrefactuel (CA-B6) : entrée retirée d'ASSETS -> la garde rougit en NOMMANT le fichier
// manquant. Exerce le VRAI cli/scripts/bundle.js (copié, jamais réimplémenté), sur un dépôt
// ISOLÉ (jamais le dépôt réel de ce worktree) : `cliDir`/`repoRoot` se résolvent depuis la
// position du fichier (`import.meta.url`) — copier bundle.js sous <tmp>/cli/scripts/ SANS créer
// <tmp>/install.mjs à la racine reproduit exactement « source requise manquante », sans jamais
// toucher à l'arbre de travail réel.
test('CA-B6, contrefactuel : install.mjs absent de la racine -> le prepack REFUSE en le nommant', () => {
  const root = tmp();
  for (const d of ['library', 'methods', 'teams', 'bindings', 'kits']) {
    fs.mkdirSync(path.join(root, d), { recursive: true });
  }
  fs.mkdirSync(path.join(root, 'cli', 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(CLI_DIR, 'scripts', 'bundle.js'), path.join(root, 'cli', 'scripts', 'bundle.js'));
  // PAS de <root>/install.mjs : précondition du contrefactuel — la seule source requise absente.
  const r = spawnSync(process.execPath, [path.join(root, 'cli', 'scripts', 'bundle.js')], { encoding: 'utf8' });
  assert.notEqual(r.status, 0, 'le prepack doit REFUSER, jamais publier un bundle mutilé');
  assert.match(
    r.stderr,
    /bundle REFUSE : asset\(s\) requis manquant\(s\) : install\.mjs/,
    'le fichier manquant doit être NOMMÉ, jamais un échec muet',
  );
});
