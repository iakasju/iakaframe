// LA PREUVE, et la seule qui vaille (CA-B5, BUNDLE-INSTALL-MJS-ABSENT). Toutes les autres gardes
// de ce lot (CA-B1..CA-B4, CA-B6..CA-B9) raisonnent sur du CODE ou sur la LISTE de ce qui part.
// R-A nomme le mode d'échec le plus probable : le geste s'arrête au bundle, personne n'y délègue,
// et le lot PARAÎT fait alors que l'utilisateur nominal reste dans l'impasse. La seule preuve
// admise mesure sur un paquet RÉELLEMENT empaqueté (`npm pack`), EXTRAIT, et l'étape 2 appelée
// DEPUIS la copie extraite — jamais une lecture de code, jamais l'arbre de dev.
//
// R-C, IMPÉRATIF DE SÉCURITÉ : ce test n'appelle JAMAIS la chaîne complète (`iakaframe install`
// / `runInstall`). Le double réseau (cli/test/fixtures/) NE SE CHARGE PAS depuis un paquet
// installé (`cli/test/` n'est jamais publié, cf. lib/network-double.js) : un `--yes` naïf sur la
// chaîne complète pourrait déclencher un VRAI `npm install -g` contre le réseau réel. On appelle
// donc `etape2Methode` DIRECTEMENT — même code de production que `runInstall`, importé depuis la
// copie EXTRAITE, exception déjà pratiquée dans install-verbe.test.js (§ tête de fichier).
//
// COPIE ISOLÉE avant `npm pack` (renfort CA-B7/R-D) : `npm pack` déclenche le prepack, qui
// SUPPRIME puis REGÉNÈRE `_bundled/`. `node --test` exécute les fichiers de test en parallèle ;
// un autre test qui empaquette réellement au même instant (cli/test/bundle-tarball.test.js,
// CA-B6) sur la MÊME `cli/_bundled/` produit un ENOENT/tarball corrompu (mesuré). Empaqueter une
// copie NEUVE du dépôt publiable (jamais `cli/` directement) rend ce test déterministe et sans
// concurrence, sans jamais toucher à l'arbre de travail réel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-install-paquet-publie-')); }

function npmDisponible() {
  const r = spawnSync('npm', ['--version'], { encoding: 'utf8' });
  return !r.error && r.status === 0;
}

function tarDisponible() {
  const r = spawnSync('tar', ['--version'], { encoding: 'utf8' });
  return !r.error && r.status === 0;
}

function compterFichiers(dir, filtre) {
  try {
    return fs.readdirSync(dir).filter(filtre).length;
  } catch {
    return -1; // repertoire absent : distinct de 0, jamais confondu avec « vide »
  }
}

// Copie ISOLEE et fidele du depot publiable — meme geste que cli/test/bundle-tarball.test.js
// (dedoublonne a dessein : ce fichier est spawn dans un PROCESSUS separe par `node --test`, un
// helper partage via import ne supprimerait pas la duplication de code, seulement son emplacement).
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

test('CA-B5 : depuis un paquet empaqueté/extrait, sur un poste SANS réservoir vivant, l\'étape 2 pose le kit — compté contre le kit source, jamais un nombre écrit en dur', async (t) => {
  if (!npmDisponible()) return t.skip('npm indisponible sur ce poste — jamais un vert (CA-B5)');
  if (!tarDisponible()) return t.skip('tar indisponible sur ce poste — jamais un vert (CA-B5)');

  // 1. Empaqueter REELLEMENT, sur une copie isolee (jamais `cli/` directement, cf. en-tete).
  const cliIsole = copierDepotPourPack();
  const packDest = tmp();
  const pack = spawnSync('npm', ['pack', '--pack-destination', packDest, '--json'], {
    cwd: cliIsole, encoding: 'utf8',
  });
  assert.equal(pack.status, 0, `npm pack a échoué (code ${pack.status}) :\n${pack.stderr}`);
  const lignes = pack.stdout.split('\n');
  const debutJson = lignes.findIndex((l) => l.trim() === '[');
  assert.ok(debutJson !== -1, `sortie \`npm pack --json\` sans JSON reconnaissable :\n${pack.stdout}`);
  const info = JSON.parse(lignes.slice(debutJson).join('\n'));
  const tgz = path.join(packDest, info[0].filename);

  // 2. EXTRAIRE (jamais installer globalement : préfixe temporaire, jamais --global).
  const extractDir = tmp();
  const untar = spawnSync('tar', ['-xzf', tgz, '-C', extractDir], { encoding: 'utf8' });
  assert.equal(untar.status, 0, `extraction du tarball impossible : ${untar.stderr}`);
  // realpath : sur macOS, `os.tmpdir()` (/var/...) diverge du chemin CANONIQUE que
  // `fileURLToPath(import.meta.url)` resout a l'execution (/private/var/...) — meme repertoire,
  // deux representations. Comparer les chemins RESOLUS, jamais leurs graphies.
  const extractedRoot = fs.realpathSync(path.join(extractDir, 'package'));
  assert.ok(fs.existsSync(path.join(extractedRoot, '_bundled', 'install.mjs')), 'le paquet extrait doit porter _bundled/install.mjs');

  // 3. Importer le code de PRODUCTION depuis la copie EXTRAITE — jamais l'arbre de dev.
  const { etape2Methode } = await import(pathToFileURL(path.join(extractedRoot, 'src', 'commands', 'install.js')).href);
  const { resoudreReservoir } = await import(pathToFileURL(path.join(extractedRoot, 'src', 'lib', 'reservoir.js')).href);

  // 4. Poste SANS réservoir vivant (précondition CA-B5) : `--root` pointe un répertoire vide.
  const vide = tmp();
  const reservoir = resoudreReservoir({ root: vide });
  assert.equal(reservoir.source, 'embarque', 'sans vivant, l\'embarqué du paquet extrait doit porter la charge');
  assert.equal(reservoir.installMjsPath, path.join(extractedRoot, '_bundled', 'install.mjs'));

  // 5. Étape 2 appelée DIRECTEMENT (R-C), sur une cible temporaire.
  const targetClaude = path.join(tmp(), 'claude');
  const r = await etape2Methode({ reservoir, values: { yes: true, 'target-claude': targetClaude } });
  assert.equal(r.ok, true, 'l\'étape 2, depuis le paquet extrait, doit RÉUSSIR à poser le kit');

  // 6. Ce qui est POSÉ, COMPTÉ CONTRE LE KIT SOURCE du paquet extrait lui-même (R-E : jamais un
  // nombre écrit en dur — une preuve se compare au fichier, pas à une autre sortie).
  const kitGlobal = path.join(extractedRoot, '_bundled', 'kits', 'iakaframe-claude', 'global');
  const kitClaudeDir = path.join(extractedRoot, '_bundled', 'kits', 'iakaframe-claude', '.claude');

  assert.ok(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), 'CA-B5(a) : CLAUDE.md doit être posé');
  const claudeMd = fs.readFileSync(path.join(targetClaude, 'CLAUDE.md'), 'utf8');
  assert.match(claudeMd, /<!-- iakaframe:start -->/, 'CA-B5(a) : le bloc iakaframe doit être présent');

  assert.ok(fs.existsSync(path.join(targetClaude, 'settings.json')), 'CA-B5(b) : settings.json doit être posé');

  const hooksSource = compterFichiers(path.join(kitGlobal, 'hooks'), (f) => f.endsWith('.mjs'));
  const hooksPoses = compterFichiers(path.join(targetClaude, 'hooks'), (f) => f.endsWith('.mjs'));
  assert.ok(hooksSource > 0, 'précondition : le kit source doit porter au moins un hook (sinon le critère ne compte rien)');
  assert.equal(hooksPoses, hooksSource, `CA-B5(c) : hooks/*.mjs posés (${hooksPoses}) doit ÉGALER le kit source (${hooksSource})`);

  const commandsSource = compterFichiers(path.join(kitClaudeDir, 'commands'), (f) => f.endsWith('.md'));
  const commandsPoses = compterFichiers(path.join(targetClaude, 'commands'), (f) => f.endsWith('.md'));
  assert.ok(commandsSource > 0, 'précondition : le kit source doit porter au moins une commande (sinon le critère ne compte rien)');
  assert.equal(commandsPoses, commandsSource, `CA-B5(d) : commands/*.md posées (${commandsPoses}) doit ÉGALER le kit source (${commandsSource})`);
});
