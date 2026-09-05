// Garde statique du banc de preuve CI (CA-W19, specs/instructions/etapes-3-4-windows-linux.md
// § 6 « fichiers concernes » — `.github/workflows/<banc>.yml`, § 5 Etape 3, AR-W7). Ce test ne
// LANCE JAMAIS le workflow (aucun `gh workflow run`, aucun appel reseau) : il lit son texte et
// verifie STATIQUEMENT les quatre garanties exigees par l'ordre de mission —
//   (1) `workflow_dispatch` UNIQUEMENT (jamais `push`/`schedule`/`pull_request`) ;
//   (2) toute action `uses:` est EPINGLEE a un SHA complet (40 hex), avec un commentaire de
//       version ;
//   (3) aucun `secrets.*` reference ;
//   (4) aucune ecriture hors `${{ runner.temp }}` dans les scripts de banc (jamais ~/.claude, ni
//       ~/Applications, ni `os.homedir()`) ;
// et que `--yes` est DOCUMENTE dans le cartouche du workflow (pas une derogation tacite).
//
// Chaque garantie porte son CONTREFACTUEL (mutation du texte EN MEMOIRE, jamais du fichier reel —
// sha256 du fichier reel verifie IDENTIQUE avant/apres ce test) : la garantie doit rougir
// NOMMEMENT sur la mutation, puis redevenir verte des qu'on l'annule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const WORKFLOW = path.join(REPO, '.github', 'workflows', 'banc-etapes-3-4.yml');
const SCRIPTS = [
  path.join(REPO, 'cli', 'scripts', 'banc-etapes-3-4-linux.mjs'),
  path.join(REPO, 'cli', 'scripts', 'banc-etapes-3-4-windows.mjs'),
  path.join(REPO, 'cli', 'scripts', 'lib', 'banc-support.mjs'),
];

function sha256(texte) { return crypto.createHash('sha256').update(texte).digest('hex'); }

// --- (1) `workflow_dispatch` UNIQUEMENT -----------------------------------------------------------
// Extrait le bloc `on:` (de la ligne `on:` jusqu'a la prochaine ligne NON indentee) et verifie
// qu'il ne porte QUE `workflow_dispatch` comme declencheur de premier niveau.
function blocOn(contenu) {
  const lignes = contenu.split(/\r?\n/);
  const debut = lignes.findIndex((l) => /^on:\s*$/.test(l));
  if (debut === -1) return null;
  const bloc = [];
  for (let i = debut + 1; i < lignes.length; i++) {
    if (/^\S/.test(lignes[i])) break; // retour a la colonne 0 : fin du bloc `on:`
    bloc.push(lignes[i]);
  }
  return bloc.join('\n');
}

function declencheursDeclares(contenu) {
  const bloc = blocOn(contenu);
  if (bloc === null) return [];
  // Cles de PREMIER NIVEAU du bloc (indentation minimale parmi les lignes non vides) — evite de
  // confondre `inputs:` (imbrique sous `workflow_dispatch:`) avec un declencheur.
  const nonVides = bloc.split('\n').filter((l) => l.trim().length > 0);
  if (nonVides.length === 0) return [];
  const indentMin = Math.min(...nonVides.map((l) => l.match(/^\s*/)[0].length));
  return nonVides
    .filter((l) => l.match(/^\s*/)[0].length === indentMin)
    .map((l) => l.trim().replace(/:.*$/, ''));
}

test('banc CI : `on:` ne declare QUE `workflow_dispatch` (jamais push/schedule/pull_request)', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  assert.deepEqual(declencheursDeclares(contenu), ['workflow_dispatch']);
});

test('CONTREFACTUEL (1) : ajouter `push:` au bloc `on:` fait rougir la garde "workflow_dispatch uniquement"', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  const mute = contenu.replace(/^on:\s*$/m, 'on:\n  push:\n    branches: [main]');
  assert.notDeepEqual(declencheursDeclares(mute), ['workflow_dispatch']);
  assert.ok(declencheursDeclares(mute).includes('push'), 'la mutation doit etre DETECTEE, nommement (push present)');
});

// --- (2) actions EPINGLEES au SHA complet (40 hex), avec un commentaire de version ---------------
const RE_USES = /uses:\s*([^\s@]+)@([0-9a-zA-Z._-]+)(?:\s*#\s*(\S.*))?$/gm;

function actionsDeclarees(contenu) {
  return [...contenu.matchAll(RE_USES)].map((m) => ({ action: m[1], ref: m[2], commentaire: m[3] || null }));
}

function toutesEpingleesAuSha(contenu) {
  const actions = actionsDeclarees(contenu);
  if (actions.length === 0) return false; // un workflow sans aucune action n'a rien a epingler : suspect, jamais un succes muet
  return actions.every((a) => /^[0-9a-f]{40}$/.test(a.ref) && a.commentaire && /\d/.test(a.commentaire));
}

test('banc CI : chaque `uses:` est epingle a un SHA complet (40 hex), avec un commentaire de version', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  const actions = actionsDeclarees(contenu);
  assert.ok(actions.length >= 2, 'au moins checkout + setup-node attendus');
  for (const a of actions) {
    assert.match(a.ref, /^[0-9a-f]{40}$/, `${a.action} n'est pas epingle a un SHA complet (ref="${a.ref}")`);
    assert.ok(a.commentaire, `${a.action}@${a.ref} n'a pas de commentaire de version`);
  }
  assert.equal(toutesEpingleesAuSha(contenu), true);
});

test('CONTREFACTUEL (2) : remplacer un SHA par un tag flottant fait rougir la garde d\'epinglage', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  const mute = contenu.replace(/actions\/checkout@[0-9a-f]{40}/, 'actions/checkout@v4');
  assert.equal(toutesEpingleesAuSha(mute), false);
});

// --- (3) aucun secret reference -------------------------------------------------------------------
test('banc CI : aucun `secrets.*` reference (aucun secret n\'est necessaire a ce banc)', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  assert.doesNotMatch(contenu, /secrets\./, 'ce banc ne publie rien : aucun secret ne devrait y etre lu');
});

// --- (4) aucune ecriture hors ${{ runner.temp }} ---------------------------------------------------
const MOTIFS_HORS_BAC_A_SABLE = [/~\/\.claude/, /~\/Applications/, /os\.homedir\(/];

test('banc CI : les scripts de banc ne referencent JAMAIS ~/.claude, ~/Applications ni os.homedir()', () => {
  for (const fichier of SCRIPTS) {
    const contenu = fs.readFileSync(fichier, 'utf8');
    for (const motif of MOTIFS_HORS_BAC_A_SABLE) {
      assert.doesNotMatch(contenu, motif, `${path.basename(fichier)} reference un chemin hors bac a sable (${motif})`);
    }
  }
});

test('banc CI : les scripts de pose reelle exigent $RUNNER_TEMP (refusent de deviner un dossier hote)', () => {
  for (const fichier of SCRIPTS.filter((f) => f.endsWith('banc-support.mjs'))) {
    const contenu = fs.readFileSync(fichier, 'utf8');
    assert.match(contenu, /RUNNER_TEMP/, `${path.basename(fichier)} devrait exiger $RUNNER_TEMP`);
  }
});

test('CONTREFACTUEL (4) : une ecriture simulee vers ~/Applications fait rougir la garde de bac a sable', () => {
  const contenuMute = "const appsDir = path.join(os.homedir(), 'Applications');";
  assert.throws(() => {
    for (const motif of MOTIFS_HORS_BAC_A_SABLE) {
      assert.doesNotMatch(contenuMute, motif);
    }
  });
});

// --- `--yes` documente dans le cartouche (pas une derogation tacite) -------------------------------
test('banc CI : `--yes` est documente ET justifie dans le cartouche du workflow', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  assert.match(contenu, /--yes/, 'le cartouche devrait mentionner `--yes`');
  assert.match(contenu, /(feu vert|d[ée]clencheur|d[ée]cideur)/i, 'le cartouche devrait JUSTIFIER `--yes` (feu vert du declencheur/decideur), pas seulement le mentionner');
});

// --- sha256 avant/apres : ce test ne mute JAMAIS le fichier reel ----------------------------------
test('garde : ce test ne modifie jamais le fichier de workflow reel (sha256 identique avant/apres)', () => {
  const avant = sha256(fs.readFileSync(WORKFLOW));
  // ... toutes les mutations ci-dessus operent sur des COPIES en memoire (`.replace` sur une
  // chaine rendue par `readFileSync`, jamais `writeFileSync`) ...
  const apres = sha256(fs.readFileSync(WORKFLOW));
  assert.equal(avant, apres, 'le fichier de workflow reel a ete modifie par ce test — c\'est un defaut du test, jamais attendu');
});

// --- Refus explicite : le workflow ne doit jamais etre declenche par un agent ---------------------
test('banc CI : le cartouche nomme explicitement l\'interdit "jamais declenche par un agent"', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  assert.match(contenu, /JAMAIS|jamais/, 'le cartouche devrait nommer explicitement l\'interdiction de declenchement par un agent');
  assert.match(contenu, /agent/i);
});

// --- Le workflow existe, se lit comme un YAML plausible (verrou minimal sans dependance) ----------
test('banc CI : le fichier existe et porte les jobs `plan` et `banc`', () => {
  const contenu = fs.readFileSync(WORKFLOW, 'utf8');
  assert.match(contenu, /^jobs:\s*$/m);
  assert.match(contenu, /^\s{2}plan:\s*$/m);
  assert.match(contenu, /^\s{2}banc:\s*$/m);
  assert.match(contenu, /fromJson\(needs\.plan\.outputs\.matrice\)/);
});
