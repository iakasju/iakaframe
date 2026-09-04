// Correction du defaut releve par le PREMIER gate qualite (2026-09-04) : « cli/test/
// install-verbe.test.js — dependance reseau non maitrisee ». Un reservoir vivant a EGALITE (le
// cas NOMINAL, M3) faisait tomber `etape1Cli` dans `sourcesOrdonneesCli({})` SANS sondes
// injectees — donc un vrai `fetch()` vers api.github.com et le NAS.
//
// PREMIERE CORRECTION, REJETEE PAR LE SECOND GATE. Ce fichier ecartait initialement le reseau des
// que `reservoir.vivantPresent` etait vrai — y compris un vivant STRICTEMENT PLUS ANCIEN que la
// version courante. C'etait un defaut de PRODUCTION deguise en fix de test : ni AR-F ni AR-H ne
// parlent du reseau (grep a zero occurrence) ; ce qui gouverne l'etape 1 est le principe HERITE
// et NON ROUVERT d'AR-2(c) du cadrage PARENT (bundle-complet-install-4-composants.md § 4.0) —
// « le plus recent gagne, par comparaison de version ». Un vivant plus ancien n'a RIEN etabli sur
// ce qui existe ailleurs ; annoncer « deja a jour » sans consulter le reseau etait une
// AFFIRMATION SANS VERIFICATION. Le second gate l'a reproduit : vivant v0.1.0 face a une courante
// v0.39.0, la version precedente de ce fichier se taisait au lieu de comparer.
//
// LA PREUVE QUE L'ANCIENNE PROPRIETE ETAIT FAUSSE (« desarme-le toi-meme, cite la sortie
// rouge ») : rejouer les DEUX anciennes assertions (« vivant present => compteur d'appels a 0 »)
// contre le code corrige (install.js apres reversion du court-circuit) les fait ROUGIR :
//
//   ✖ CONTREFACTUEL : réservoir vivant PRÉSENT (égalité, cas nominal M3) -> ...
//     AssertionError [ERR_ASSERTION]: PAR CONSTRUCTION : aucune sonde réseau ne doit être
//     invoquée quand un réservoir vivant est présent
//     1 !== 0
//   ✖ CONTREFACTUEL : réservoir vivant PRÉSENT mais PLUS ANCIEN -> ...
//     AssertionError [ERR_ASSERTION]: un vivant plus ancien a DEJA répondu localement : pas de
//     repli réseau
//     1 !== 0
//
// (mesuré le 2026-09-04, `node --test cli/test/etape1-reseau-ecarte.test.js` sur la version du
// fichier reprise par le commit precedent — 2 fail / 1 pass, exactement les deux tests dont
// l'assomption n'etait plus vraie). Ce fichier REMPLACE ces deux assertions par la PROPRIETE
// CORRECTE : le reseau EST consulte des que le local n'offre PAS de mise a jour stricte — y
// compris a egalite, y compris vivant plus ancien — et cette consultation reste SANS AUCUN
// RESEAU REEL uniquement PARCE QUE les sondes sont INJECTEES ici, jamais parce que le code de
// production a cesse de les appeler (c'est ce que prouve le compteur d'appels : il vaut
// desormais 1, pas 0, dans les DEUX cas — et ce fichier verifie aussi que cet appel unique
// suffit a reprendre une mise a jour distante quand elle existe, via un execNpmInstall injecte,
// jamais un vrai npm).
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

// Sonde INJECTEE, toujours injoignable — « dead by construction », meme idiome que
// cli/test/canaux-fanout.test.js (jamais une cible morte « par circonstance »). Compte ses
// appels : c'est la mesure qui distingue « consulte » de « ignore », sans jamais toucher au
// reseau reel.
function sondeInjoignable(nom, compteur) {
  return async () => { compteur.appels++; return { nom, repond: false }; };
}

// Sonde INJECTEE qui REPOND avec une version plus recente — simule "une vraie publication existe
// ailleurs". Injectee explicitement (jamais le defaut), donc zero reseau reel meme quand elle
// "trouve" une mise a jour.
function sondeAvecMiseAJour(nom, compteur, version) {
  return async () => { compteur.appels++; return { nom, repond: true, exploitable: true, version }; };
}

const silence = (() => { let restore = null; return {
  activer() { const orig = console.log; restore = orig; console.log = () => {}; },
  desactiver() { if (restore) console.log = restore; },
}; })();

test('AR-2(c) : réservoir vivant PRÉSENT À ÉGALITÉ (cas nominal M3) -> le réseau EST consulté (sonde INJECTÉE, jamais réelle), "déjà à jour" seulement APRÈS vérification', async () => {
  const courante = packageVersion();
  const vivant = faireVivant({ version: courante }); // egalite exacte : le cas nominal
  const reservoir = resoudreReservoir({ root: vivant });
  assert.equal(reservoir.source, 'vivant');
  assert.equal(reservoir.vivantPresent, true);

  const compteur = { appels: 0 };
  const sondes = [sondeInjoignable('sonde injectée (toujours injoignable)', compteur)];

  silence.activer();
  let r;
  try {
    r = await etape1Cli({ reservoir, values: { 'dry-run': true, yes: true }, sondes });
  } finally { silence.desactiver(); }

  assert.equal(compteur.appels, 1, 'la comparaison AR-2(c) doit continuer vers le réseau : le local (égalité) n\'a fourni AUCUNE mise à jour stricte');
  assert.equal(r.ok, true);
  assert.equal(r.misAJour, false, 'la sonde injectée est injoignable : "déjà à jour" reste correct, mais APRÈS vérification, pas par silence');
});

test('AR-2(c) : réservoir vivant PRÉSENT mais STRICTEMENT PLUS ANCIEN -> le réseau EST consulté (c\'est exactement le cas reproduit par le second gate, v0.1.0 face à v0.39.0)', async () => {
  const vivant = faireVivant({ version: '0.1.0' }); // reproduit tel quel le cas du gate
  const reservoir = resoudreReservoir({ root: vivant });
  assert.equal(reservoir.source, 'embarque');
  assert.equal(reservoir.vivantPresent, true, 'le vivant EXISTE (juste plus ancien) — ce n\'est PAS le cas "aucun vivant"');

  const compteur = { appels: 0 };
  const sondes = [sondeInjoignable('sonde injectée (toujours injoignable)', compteur)];

  silence.activer();
  let r;
  try {
    r = await etape1Cli({ reservoir, values: { 'dry-run': true, yes: true }, sondes });
  } finally { silence.desactiver(); }

  assert.equal(compteur.appels, 1, 'un vivant plus ancien n\'a RIEN établi sur ce qui existe ailleurs : le réseau doit être consulté');
  assert.equal(r.ok, true);
});

test('AR-2(c) : réservoir vivant PRÉSENT mais PLUS ANCIEN, et le réseau (injecté) annonce une version plus récente -> elle est reprise via execNpmInstall INJECTÉ, jamais un vrai npm', async () => {
  const vivant = faireVivant({ version: '0.1.0' });
  const reservoir = resoudreReservoir({ root: vivant });

  const compteur = { appels: 0 };
  const sondes = [sondeAvecMiseAJour('tarball GitHub (simulé)', compteur, '99.0.0')];
  const execCalls = [];
  const execNpmInstall = (cmd, args) => { execCalls.push({ cmd, args }); return { status: 0 }; };

  silence.activer();
  let r;
  try {
    r = await etape1Cli({ reservoir, values: { yes: true }, sondes, execNpmInstall });
  } finally { silence.desactiver(); }

  assert.equal(compteur.appels, 1);
  assert.equal(r.ok, true);
  assert.equal(r.misAJour, true, 'AR-2(c) : le plus récent gagne, même trouvé par le réseau plutôt que localement');
  assert.equal(execCalls.length, 1, 'la mise à jour doit passer par execNpmInstall INJECTÉ — jamais un vrai spawnSync(npm) pendant les tests');
  assert.equal(execCalls[0].cmd, 'npm');
});

// --- TÉMOIN POSITIF (déjà présent avant ce correctif, conservé tel quel) -----------------------
test('témoin positif : AUCUN réservoir vivant -> le réseau AR-H EST consulté (sondes injectées, zéro réseau réel), et une cible plus récente est reprise via execNpmInstall INJECTÉ (jamais un vrai npm)', async () => {
  const vide = tmp(); // pas d'install.mjs : aucun reservoir vivant
  const reservoir = resoudreReservoir({ root: vide });
  assert.equal(reservoir.vivantPresent, false);

  const compteur = { appels: 0 };
  const sondes = [sondeAvecMiseAJour('tarball GitHub (simulé)', compteur, '999.0.0')];
  const execCalls = [];
  const execNpmInstall = (cmd, args) => { execCalls.push({ cmd, args }); return { status: 0 }; };

  silence.activer();
  let r;
  try {
    r = await etape1Cli({ reservoir, values: { yes: true }, sondes, execNpmInstall });
  } finally { silence.desactiver(); }

  assert.equal(compteur.appels, 1, 'témoin positif : sans vivant, la sonde DOIT être consultée');
  assert.equal(r.ok, true);
  assert.equal(r.misAJour, true);
  assert.equal(execCalls.length, 1, 'la "mise à jour" doit passer par execNpmInstall INJECTÉ — jamais un vrai spawnSync(npm) pendant les tests');
  assert.equal(execCalls[0].cmd, 'npm');
});
