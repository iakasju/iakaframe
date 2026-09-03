// Correction du defaut releve par le gate qualite (GATE LEGOLAS FAIL, 2026-09-04) :
// « cli/test/install-verbe.test.js — dependance reseau non maitrisee ». Mesure du gate,
// reproduite : un reservoir vivant a EGALITE (le cas NOMINAL, M3) faisait tomber `etape1Cli`
// dans `sourcesOrdonneesCli({})` SANS sondes injectees — donc un vrai `fetch()` vers
// api.github.com et le NAS. Les tests ne passaient que « par circonstance » (les deux hors
// service ce jour-la) : le jour ou l'un des deux repond avec une version strictement
// superieure, `--yes` aurait execute un `npm install -g` REEL depuis `npm test`.
//
// CORRECTION, A LA SOURCE (install.js, etape1Cli) : le reseau (AR-H) n'est desormais consulte
// QUE quand AUCUN reservoir vivant n'a ete trouve DU TOUT — conforme a AR-F (« le reservoir du
// poste prime sur le bundle ») et a l'en-tete d'install.js, qui le disait deja sans que le code
// le fasse. CE FICHIER PROUVE LE CONTREFACTUEL EXIGE PAR LE GATE : « un test qui ne peut pas
// partir sur le reseau doit rester vert MEME SI on simule une release distante plus recente » —
// les sondes injectees ci-dessous, si elles etaient APPELEES, rendraient une version plus
// recente ET feraient echouer le test (compteur d'appels) : la seule facon de rester vert est
// que le code NE LES APPELLE JAMAIS quand un vivant est present. Aucune sonde reelle n'est
// jamais executee dans ce fichier — deterministe, jouable hors ligne.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { etape1Cli } from '../src/commands/install.js';
import { resoudreReservoir } from '../src/lib/reservoir.js';
import { packageVersion } from '../src/lib/version.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-etape1-reseau-')); }
function w(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

function faireVivant({ version } = {}) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'install.mjs'), '// installeur factice (ne sera jamais execute par ce fichier)\n');
  if (version !== undefined) {
    w(path.join(dir, 'cli', 'package.json'), JSON.stringify({ version }));
  }
  return dir;
}

// Sonde-piege : si jamais APPELEE, elle annonce une version tres superieure (simule "une vraie
// publication a eu lieu entre-temps") ET compte ses appels — le test peut donc affirmer, de
// façon mesurable, qu'elle n'a jamais tourné.
function sondePiege(nom, compteur) {
  return async () => { compteur.appels++; return { nom, repond: true, exploitable: true, version: '999.0.0' }; };
}

const silence = (() => { let restore = null; return {
  activer() { const orig = console.log; restore = orig; console.log = () => {}; },
  desactiver() { if (restore) console.log = restore; },
}; })();

test('CONTREFACTUEL : réservoir vivant PRÉSENT (égalité, cas nominal M3) -> le réseau AR-H n\'est JAMAIS consulté, même si la sonde annoncerait une version plus récente', async () => {
  const courante = packageVersion();
  const vivant = faireVivant({ version: courante }); // egalite exacte : le cas qui declenchait le bug
  const reservoir = resoudreReservoir({ root: vivant });
  assert.equal(reservoir.source, 'vivant');
  assert.equal(reservoir.vivantPresent, true);

  const compteur = { appels: 0 };
  const sondes = [sondePiege('sonde-piège (ne doit JAMAIS répondre)', compteur)];

  silence.activer();
  let r;
  try {
    r = await etape1Cli({ reservoir, values: { 'dry-run': true, yes: true }, sondes });
  } finally { silence.desactiver(); }

  assert.equal(compteur.appels, 0, 'PAR CONSTRUCTION : aucune sonde réseau ne doit être invoquée quand un réservoir vivant est présent');
  assert.equal(r.ok, true);
});

test('CONTREFACTUEL : réservoir vivant PRÉSENT mais PLUS ANCIEN -> toujours aucun appel réseau (le vivant a déjà répondu, même perdant)', async () => {
  const vivant = faireVivant({ version: '0.0.1' }); // strictement plus ancien : embarque gagne
  const reservoir = resoudreReservoir({ root: vivant });
  assert.equal(reservoir.source, 'embarque');
  assert.equal(reservoir.vivantPresent, true, 'le vivant EXISTE (juste plus ancien) — ce n\'est PAS le cas "aucun vivant"');

  const compteur = { appels: 0 };
  const sondes = [sondePiege('sonde-piège (ne doit JAMAIS répondre)', compteur)];

  silence.activer();
  try { await etape1Cli({ reservoir, values: { 'dry-run': true, yes: true }, sondes }); }
  finally { silence.desactiver(); }

  assert.equal(compteur.appels, 0, 'un vivant plus ancien a DEJA répondu localement : pas de repli réseau');
});

// --- TÉMOIN POSITIF : la garde n'est pas un silence permanent, elle distingue vraiment --------
test('témoin positif : AUCUN réservoir vivant -> le réseau AR-H EST consulté (sondes injectées, zéro réseau réel), et une cible plus récente est reprise via execNpmInstall INJECTÉ (jamais un vrai npm)', async () => {
  const vide = tmp(); // pas d'install.mjs : aucun reservoir vivant
  const reservoir = resoudreReservoir({ root: vide });
  assert.equal(reservoir.vivantPresent, false);

  const compteur = { appels: 0 };
  const sondes = [sondePiege('tarball GitHub (simulé)', compteur)];
  const execCalls = [];
  const execNpmInstall = (cmd, args) => { execCalls.push({ cmd, args }); return { status: 0 }; };

  silence.activer();
  let r;
  try {
    r = await etape1Cli({ reservoir, values: { yes: true }, sondes, execNpmInstall });
  } finally { silence.desactiver(); }

  assert.equal(compteur.appels, 1, 'témoin positif : sans vivant, la sonde DOIT être consultée (sinon la garde serait aveugle, pas sélective)');
  assert.equal(r.ok, true);
  assert.equal(r.misAJour, true);
  assert.equal(execCalls.length, 1, 'la "mise à jour" doit passer par execNpmInstall INJECTÉ — jamais un vrai spawnSync(npm) pendant les tests');
  assert.equal(execCalls[0].cmd, 'npm');
});
