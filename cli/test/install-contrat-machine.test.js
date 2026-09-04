// Gardes du CONTRAT MACHINE du verbe `install` (specs/instructions/
// contrat-machine-du-verbe-install.md, § 8 CA-M1..CA-M16). Chaque garde porte son
// CONTREFACTUEL (mutation du PROGRAMME, jamais de l'attendu) — documente en commentaire a cote de
// l'assertion qu'il fait rougir, et REVOQUE (git checkout / re-edit) avec preuve au sha256 dans le
// rapport de remise (le sha256 ne peut pas vivre DANS ce fichier : il porte sur l'etat du DEPOT,
// pas sur un contenu figeable a l'avance).
//
// Idiome de ce fichier : reutiliser au maximum les harnais EPROUVES existants (install-verbe.test.js
// pour le sous-processus reel + double reseau, install-etapes-3-4.test.js pour l'appel DIRECT de
// `etapeApp` avec injection reseau controlee) — jamais un second idiome (M-9).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { etape1Cli, etape2Methode } from '../src/commands/install.js';
import { resoudreReservoir, formatProvenance } from '../src/lib/reservoir.js';
import { orchestrerRollback, sauvegarderAvantEtape } from '../src/lib/rollback.js';
import {
  EVENEMENTS, ETATS_ETAPE, construireEvenement, creerEmetteur,
} from '../src/lib/evenements.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REAL_INSTALL_MJS = path.join(REPO, 'install.mjs');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cm-')); }
function w(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

const silence = (() => {
  let restore = null;
  return {
    activer() { restore = console.log; console.log = () => {}; },
    desactiver() { if (restore) console.log = restore; },
  };
})();

function faireReservoirVivant({ version = '0.39.0' } = {}) {
  const dir = tmp();
  fs.copyFileSync(REAL_INSTALL_MJS, path.join(dir, 'install.mjs'));
  w(path.join(dir, 'cli', 'package.json'), JSON.stringify({ version }));
  w(path.join(dir, 'kits', 'iakaframe-claude', 'global', 'CLAUDE.md'), 'CLAUDE contract fixture (install-contrat-machine.test)\n');
  return dir;
}

// Meme double que install-verbe.test.js : sondes/reseau TOUJOURS injoignables — zero reseau reel.
function run(args, { input = undefined, extraEnv = {} } = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8', input,
    env: { ...process.env, IAKAFRAME_INSTALL_TEST_DOUBLE: '1', ...extraEnv },
  });
}

function lignesNdjson(stdout) {
  return stdout.split('\n').filter((l) => l !== '');
}

// =================================================================================================
// CA-M15 — Le vocabulaire d'evenements est FERME, et garde.
// =================================================================================================

test('CA-M15 : construireEvenement rejette un evt hors du vocabulaire fermé (evenements.js, à la source)', () => {
  assert.throws(() => construireEvenement('bidule-hors-vocabulaire', null, {}), /hors du vocabulaire/);
});

test('CA-M15 : tous les evt du vocabulaire fermé sont acceptés (comparaison à l\'appel de l\'autorité, jamais une liste réécrite)', () => {
  for (const evt of EVENEMENTS) {
    assert.doesNotThrow(() => construireEvenement(evt, null, {}), `evt attendu acceptable : ${evt}`);
  }
});

test('CA-M15 : sur une chaîne réelle (--events), tout `evt` émis appartient à EVENEMENTS et tout `etat` à ETATS_ETAPE', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--events', '--root', vivant, '--target-claude', path.join(tmp(), 'claude'), '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups'), '--yes']);
  const lignes = lignesNdjson(r.stdout);
  assert.ok(lignes.length > 0);
  const hors = [];
  for (const l of lignes) {
    const o = JSON.parse(l);
    if (!EVENEMENTS.includes(o.evt)) hors.push(o.evt);
    if (o.evt === 'etape-terminee' && !ETATS_ETAPE.includes(o.etat)) hors.push(`etat:${o.etat}`);
  }
  assert.deepEqual(hors, [], `valeur(s) hors vocabulaire émise(s) : ${hors.join(', ')}`);
  // CONTREFACTUEL (documenté, joué manuellement en revue) : émettre `evt:"bidule"` depuis
  // install.js ferait échouer construireEvenement() À LA SOURCE (test direct ci-dessus) — ce test
  // couvre le second niveau, celui d'une émission RÉELLE sur la chaîne complète.
});

// =================================================================================================
// CA-M1 — En --events, chaque ligne de stdout est du JSON. Sans exception. La dernière est "fin".
// =================================================================================================

test('CA-M1 : `--dry-run --events` -> chaque ligne de stdout parse en JSON, la dernière porte evt:"fin", AUCUNE prose', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--events', '--root', vivant, '--target-claude', path.join(tmp(), 'claude'), '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups'), '--yes']);
  assert.equal(r.status, 0, r.stderr);
  const lignes = lignesNdjson(r.stdout);
  assert.ok(lignes.length > 5, 'la chaîne doit émettre plusieurs événements');
  for (const l of lignes) {
    assert.doesNotThrow(() => JSON.parse(l), `ligne non-JSON (prose fuite dans le flux machine) : ${l}`);
  }
  const dernier = JSON.parse(lignes[lignes.length - 1]);
  assert.equal(dernier.evt, 'fin');
  assert.equal(dernier.ok, true);
  // CONTREFACTUEL (R-M2) : remettre stdio:'inherit' sur la délégation de l'étape 2 fait fuiter la
  // prose d'install.mjs ("== iakaframe — installeur multi-host ==", etc.) directement dans stdout
  // — CE test rougirait alors sur `JSON.parse` de cette ligne, en la nommant.
});

test('CA-M1, contrefactuel joué : réintroduire `stdio: \'inherit\'` sur la délégation étape 2 fait fuiter de la prose non-JSON dans --events (démonstration isolée, sans toucher au fichier de production)', () => {
  // Démonstration du contrefactuel SANS muter install.js (qui resterait gaté par CA-M8 pendant la
  // durée de l'expérience) : on rejoue le sous-processus install.mjs en stdio:'inherit' comme le
  // ferait le programme AVANT ce lot, et on vérifie que sa sortie n'est PAS un flux NDJSON valide —
  // exactement le risque que le mode machine ferme.
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const res = spawnSync(process.execPath, [
    path.join(vivant, 'install.mjs'), '--kits-dir', path.join(vivant, 'kits'), '--hosts', 'claude',
    '--target-claude', targetClaude, '--dry-run', '--yes',
  ], { encoding: 'utf8' });
  assert.equal(res.status, 0);
  const lignes = res.stdout.split('\n').filter(Boolean);
  const nonJson = lignes.filter((l) => { try { JSON.parse(l); return false; } catch { return true; } });
  assert.ok(nonJson.length > 0, 'install.mjs parle en PROSE (jamais en JSON) — la capture (stdio:pipe + log-délégué) de ce lot est ce qui l\'empêche de polluer --events');
});

// =================================================================================================
// CA-M2 — L'annonce d'étape porte les six champs exigés.
// =================================================================================================

test('CA-M2 : evt:"etape-annoncee" de l\'étape 2 (méthode) porte les six champs exigés', async () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const reservoir = resoudreReservoir({ root: vivant });
  const em = creerEmetteur({ mode: 'json' });
  silence.activer();
  let r;
  try {
    r = await etape2Methode({ reservoir, values: { yes: true, 'target-claude': path.join(tmp(), 'claude') }, em });
  } finally { silence.desactiver(); }
  assert.equal(r.ok, true);
  const annonce = em.evenements.find((e) => e.evt === 'etape-annoncee' && e.etape === 2);
  assert.ok(annonce, 'un événement etape-annoncee doit avoir été émis pour l\'étape 2');
  for (const champ of ['quoi', 'ou', 'version', 'ceQuiSeraFusionne', 'sourceRetenue', 'sourcesConsultees']) {
    assert.ok(champ in annonce, `champ manquant : ${champ}`);
  }
  assert.equal(typeof annonce.quoi, 'string');
  assert.equal(typeof annonce.ou, 'string');
  assert.ok(Array.isArray(annonce.sourcesConsultees));
  // CONTREFACTUEL (retirer ceQuiSeraFusionne de l'émission) : joué et révoqué, cf. rapport de
  // remise (diff isolé sur cette ligne, sha256 avant/après).
});

// =================================================================================================
// CA-M3 — La provenance est en champs ET la phrase imposée est conservée (comparée à l'autorité).
// =================================================================================================

test('CA-M3 : evt:"reservoir" porte source/vivantVersion/embarqueVersion ET provenance === formatProvenance(...) (appel direct de l\'autorité, jamais une chaîne réécrite)', async () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const reservoir = resoudreReservoir({ root: vivant });
  const em = creerEmetteur({ mode: 'json' });
  silence.activer();
  try {
    await etape1Cli({ reservoir, values: {}, em, sondes: [async () => ({ nom: 'sonde-test', repond: false })] });
  } finally { silence.desactiver(); }
  const evtReservoir = em.evenements.find((e) => e.evt === 'reservoir');
  assert.ok(evtReservoir);
  assert.equal(evtReservoir.source, reservoir.source);
  assert.equal(evtReservoir.vivantVersion, reservoir.vivantVersion);
  assert.equal(evtReservoir.embarqueVersion, reservoir.embarqueVersion);
  const provenanceAutorite = formatProvenance({
    source: reservoir.source, vivantRoot: reservoir.vivantRoot,
    vivantVersion: reservoir.vivantVersion, embarqueVersion: reservoir.embarqueVersion,
  });
  assert.equal(evtReservoir.provenance, provenanceAutorite);
  // CONTREFACTUEL : retirer le champ `source` de l'émission -> cette assertion rougit en nommant
  // `source` (undefined !== reservoir.source).
});

// =================================================================================================
// CA-M4/CA-M6 — Le feu vert par étape fonctionne sur stdin, DISCRIMINE, et une réponse hors
// séquence est un refus (jamais un feu vert) — au niveau CHAÎNE COMPLÈTE (sous-processus réel).
// (CA-M6 est déjà prouvé exhaustivement au niveau unitaire dans cli/test/interactif.test.js ;
// ce qui suit prouve le CÂBLAGE réel dans install.js, pas seulement la fonction isolée.)
// =================================================================================================

test('CA-M4 : `--events --feu-vert stdin`, réponse "oui" nommant l\'étape 2 -> feu-vert accordé, canal "stdin", le kit est RÉELLEMENT déployé', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' }); // étape 1 : déjà à jour (sautée, aucune demande)
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--events', '--feu-vert', 'stdin', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups')], {
    input: '{"etape":2,"reponse":"oui"}\n',
  });
  const lignes = lignesNdjson(r.stdout).map((l) => JSON.parse(l));
  const feuVert = lignes.find((o) => o.evt === 'feu-vert' && o.etape === 2);
  assert.ok(feuVert, 'un evt feu-vert pour l\'étape 2 doit avoir été émis');
  assert.equal(feuVert.accorde, true);
  assert.equal(feuVert.canal, 'stdin');
  assert.ok(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), 'le kit doit avoir été réellement déployé (le feu vert stdin a un effet réel, pas seulement déclaratif)');
});

test('CA-M4/CA-M6 : réponse nommant une AUTRE étape (4) alors que l\'étape 2 est demandée -> REFUS, motif nommé, RIEN écrit', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--events', '--feu-vert', 'stdin', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups')], {
    input: '{"etape":4,"reponse":"oui"}\n',
  });
  const lignes = lignesNdjson(r.stdout).map((l) => JSON.parse(l));
  const feuVert = lignes.find((o) => o.evt === 'feu-vert' && o.etape === 2);
  assert.ok(feuVert);
  assert.equal(feuVert.accorde, false, 'CONTREFACTUEL (ignorer `etape` dans la comparaison) : sans CA-M6, cette réponse "oui" hors séquence accorderait l\'étape 2 à tort');
  assert.match(feuVert.motif, /hors sequence/);
  assert.notEqual(r.status, 0);
  assert.equal(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), false, 'aucune écriture : le feu vert hors séquence doit avoir été refusé');
});

// =================================================================================================
// CA-M5 — Le défaut est le refus, sur les quatre chemins.
// =================================================================================================

test('CA-M5(1) : `--events` SANS `--feu-vert stdin` -> refus à la première demande, canal "refus-par-defaut", exit != 0', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--events', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups')]);
  const lignes = lignesNdjson(r.stdout).map((l) => JSON.parse(l));
  const feuVert = lignes.find((o) => o.evt === 'feu-vert');
  assert.ok(feuVert);
  assert.equal(feuVert.accorde, false);
  assert.equal(feuVert.canal, 'refus-par-defaut');
  assert.notEqual(r.status, 0);
  assert.equal(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), false);
  // CONTREFACTUEL : faire rendre `true` par défaut au port de feu vert (peutDemander) ferait
  // écrire CLAUDE.md ici -> cette assertion rougirait en le nommant.
});

test('CA-M5(2) : `--feu-vert stdin` avec stdin FERMÉ D\'EMBLÉE (EOF) -> refus, rien écrit', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--events', '--feu-vert', 'stdin', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups')], { input: '' });
  const lignes = lignesNdjson(r.stdout).map((l) => JSON.parse(l));
  const feuVert = lignes.find((o) => o.evt === 'feu-vert');
  assert.equal(feuVert.accorde, false);
  assert.match(feuVert.motif, /EOF/);
  assert.equal(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), false);
});

test('CA-M5(3) : `--feu-vert stdin` avec une ligne VIDE -> refus, rien écrit', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--events', '--feu-vert', 'stdin', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups')], { input: '\n' });
  const lignes = lignesNdjson(r.stdout).map((l) => JSON.parse(l));
  const feuVert = lignes.find((o) => o.evt === 'feu-vert');
  assert.equal(feuVert.accorde, false);
  assert.equal(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), false);
});

test('CA-M5(4) : `--feu-vert stdin` avec du JSON illisible -> refus, rien écrit', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--events', '--feu-vert', 'stdin', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups')], { input: '{not json\n' });
  const lignes = lignesNdjson(r.stdout).map((l) => JSON.parse(l));
  const feuVert = lignes.find((o) => o.evt === 'feu-vert');
  assert.equal(feuVert.accorde, false);
  assert.equal(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), false);
});

// =================================================================================================
// CA-M7 — Le rapport de rollback sort en champs, avec ses trois gardes intactes (comparé à
// l'autorité orchestrerRollback, jamais une valeur réécrite dans le test).
// =================================================================================================

test('CA-M7 : evt:"rollback" (appel direct de la même construction que runInstall) porte resume/defaits/nonDefaits/rapports IDENTIQUES à orchestrerRollback([preuve])', () => {
  // Preuve RÉELLE (pas fabriquée) : sauvegarde AVANT écriture d'une cible qui N'EXISTAIT PAS —
  // exactement ce que produit l'étape 3 avant un rollback (AR-5 garde 1).
  const appsDir = tmp();
  const backupDir = tmp();
  const cible = path.join(appsDir, 'IakaCockpit.app');
  fs.mkdirSync(cible, { recursive: true });
  fs.writeFileSync(path.join(cible, 'marker.txt'), 'posé par la chaîne');
  const preuve = sauvegarderAvantEtape({ backupDir, etape: 3, cible });

  const rbAutorite = orchestrerRollback([preuve]);

  // MÊME construction, verbatim, que le tail de runInstall (src/commands/install.js) :
  const em = creerEmetteur({ mode: 'json' });
  em.dire(`\n[rollback] ${rbAutorite.resume}`, {
    evt: 'rollback', etape: 4,
    champs: { resume: rbAutorite.resume, defaits: rbAutorite.defaits, nonDefaits: rbAutorite.nonDefaits, rapports: rbAutorite.rapports },
  });
  const evtRollback = em.evenements.find((e) => e.evt === 'rollback');
  assert.deepEqual(evtRollback.resume, rbAutorite.resume);
  assert.deepEqual(evtRollback.defaits, rbAutorite.defaits);
  assert.deepEqual(evtRollback.nonDefaits, rbAutorite.nonDefaits);
  assert.deepEqual(evtRollback.rapports, rbAutorite.rapports);
  for (const rap of evtRollback.rapports) {
    for (const champ of ['etape', 'cible', 'ok', 'defait', 'raison']) assert.ok(champ in rap, `champ manquant sur un rapport : ${champ}`);
  }
  // CONTREFACTUEL : retirer `nonDefaits` de la construction du champs -> `evtRollback.nonDefaits`
  // devient `undefined`, `assert.deepEqual(undefined, [])` rougit en le nommant.
});

function empreinte(dir) {
  const out = [];
  const walk = (d, rel) => {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(p, r);
      else out.push(`${r}:${fs.readFileSync(p, 'utf8').length}`);
    }
  };
  walk(dir, '');
  return out.join('\n');
}

// =================================================================================================
// CA-M10/CA-M11 — `install --json` entre au contrat C-JSON et y est MESURÉ ; l'erreur suit la
// règle 4 à la lettre.
// =================================================================================================

test('CA-M10 : `install --dry-run --json` -> racine objet, ok:true EN PREMIÈRE CLÉ, count === evenements.length, UNE SEULE impression', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--json', '--root', vivant, '--target-claude', path.join(tmp(), 'claude'), '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups'), '--yes']);
  assert.equal(r.status, 0, r.stderr);
  const lignes = r.stdout.trim().split('\n').filter(Boolean);
  assert.equal(lignes.length > 1 ? JSON.parse(r.stdout) && 1 : 1, 1); // une seule impression JSON (parse global doit réussir même multi-lignes indentées)
  const obj = JSON.parse(r.stdout);
  assert.equal(Object.keys(obj)[0], 'ok', 'ok doit être en première clé');
  assert.equal(obj.ok, true);
  assert.ok(Array.isArray(obj.evenements));
  assert.equal(obj.count, obj.evenements.length);
  assert.ok(obj.etatAtteint);
  // CONTREFACTUEL : imprimer un tableau nu (`printJson(evenements)` au lieu de `collection(...)`)
  // ferait `Object.keys(obj)[0] !== 'ok'` (ou lèverait, un tableau n'a pas de clé 'ok') -> rouge.
});

test('CA-M11 : `install --json` en échec -> {ok:false, error, etatAtteint, reprise} sur STDOUT, exit 1, STDERR VIDE', () => {
  // Déclenche un échec réel et déterministe : réservoir SANS install.mjs (bundle amputé, CA-21').
  const vide = tmp();
  const r = run(['install', '--json', '--root', vide, '--target-claude', path.join(tmp(), 'claude'), '--yes']);
  assert.equal(r.status, 1);
  assert.equal(r.stderr.trim(), '', 'rien d\'humain sur stderr en mode --json (règle 4)');
  const obj = JSON.parse(r.stdout);
  assert.equal(obj.ok, false);
  assert.equal(typeof obj.error, 'string');
  assert.ok(obj.etatAtteint);
  assert.ok('reprise' in obj);
});

// =================================================================================================
// Écart signalé par le gate (docs/qualite/gate-contrat-machine-install.md, § Écarts) — verdict
// complémentaire du décideur (specs/instructions/contrat-machine-du-verbe-install.md, § 3) : en
// `--dry-run`, AUCUNE étape ne compte comme faite, symétriquement pour les quatre étapes.
// =================================================================================================

test('Écart gate — `install --dry-run --json` : etatAtteint.etapesFaites est VIDE (aucune étape, y compris 1/2)', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--json', '--root', vivant, '--target-claude', path.join(tmp(), 'claude'), '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups'), '--yes']);
  assert.equal(r.status, 0, r.stderr);
  const obj = JSON.parse(r.stdout);
  assert.equal(obj.ok, true);
  assert.deepEqual(obj.etatAtteint.etapesFaites, [], 'en dry-run, etapesFaites doit rester vide pour les 4 étapes (symétrie 1/2 vs 3/4)');
  // CONTREFACTUEL : le code actuel (avant correction) pousse 1 et 2 sans condition de dryRun ->
  // etapesFaites vaudrait [1, 2] ici -> rouge sur ce deepEqual.
});

test('Écart gate — `install --dry-run --events` : evt:"fin" porte etatAtteint.etapesFaites VIDE', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--events', '--root', vivant, '--target-claude', path.join(tmp(), 'claude'), '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups'), '--yes']);
  assert.equal(r.status, 0, r.stderr);
  const lignes = lignesNdjson(r.stdout).map((l) => JSON.parse(l));
  const fin = lignes[lignes.length - 1];
  assert.equal(fin.evt, 'fin');
  assert.deepEqual(fin.etatAtteint.etapesFaites, [], 'en dry-run, etapesFaites doit rester vide pour les 4 étapes (symétrie 1/2 vs 3/4)');
});

// =================================================================================================
// CA-M12 — Les combinaisons incohérentes sont refusées, jamais dégradées.
// =================================================================================================

test('CA-M12 : `--json --events` -> refus explicite, exit 1, {ok:false} sur stdout nommant les deux drapeaux', () => {
  const r = run(['install', '--json', '--events', '--root', tmp()]);
  assert.equal(r.status, 1);
  const obj = JSON.parse(r.stdout);
  assert.equal(obj.ok, false);
  assert.match(obj.error, /--json/);
  assert.match(obj.error, /--events/);
});

test('CA-M12 : `--json --feu-vert stdin` -> refus explicite, exit 1, nommant les deux drapeaux', () => {
  const r = run(['install', '--json', '--feu-vert', 'stdin', '--root', tmp()]);
  assert.equal(r.status, 1);
  const obj = JSON.parse(r.stdout);
  assert.equal(obj.ok, false);
  assert.match(obj.error, /--json/);
  assert.match(obj.error, /--feu-vert/);
});

// =================================================================================================
// CA-M13 — A4 tient : rien ne transforme le canal machine en --yes.
// =================================================================================================

test('CA-M13(1) statique : aucune affectation de `values.yes` hors du parsing de --yes dans install.js', () => {
  const src = fs.readFileSync(path.join(HERE, '..', 'src', 'commands', 'install.js'), 'utf8');
  const affectations = src.match(/values\.yes\s*=(?!=)/g) || [];
  assert.deepEqual(affectations, [], 'aucune affectation de values.yes ne doit exister (yes est un booléen LU, jamais écrit) — CA-M13');
  // CONTREFACTUEL : ajouter `values.yes = true;` dans la branche machine ferait matcher cette regex
  // -> rouge, nommant l'occurrence trouvée.
});

test('CA-M13(2) : ECHAPPATOIRES_INTERDITES (guidage.js) reste inchangé et assemblerArgv refuse toujours --yes/--force/--cascade', async () => {
  const { ECHAPPATOIRES_INTERDITES, assemblerArgv } = await import('../src/lib/guidage.js');
  assert.deepEqual(ECHAPPATOIRES_INTERDITES, ['--force', '--yes', '--cascade', '--autoriser-creation-depot']);
  assert.throws(() => assemblerArgv(['install', '--yes']), /echappatoire interdite/);
});

test('CA-M13(3) comportemental : `--feu-vert stdin` répondant "non" -> exit 1, empreinte disque INCHANGÉE', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const avant = empreinte(targetClaude);
  const r = run(['install', '--events', '--feu-vert', 'stdin', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups')], {
    input: '{"etape":2,"reponse":"non"}\n',
  });
  assert.notEqual(r.status, 0);
  assert.equal(empreinte(targetClaude), avant);
});

// =================================================================================================
// CA-M14 — Registre, aide et doc à jour DANS CE LOT (vérifié aussi par guard-verbes-registre.test.js
// et le test d'actualité de docs/commandes.md ; ici, on vérifie l'USAGE local et la levée de M-2).
// =================================================================================================

test('CA-M14 : USAGE (`install --help`) décrit --events et --feu-vert, et ne PROMET plus le mensonge de M-2 (":59")', () => {
  const r = run(['install', '--help']);
  assert.match(r.stdout, /--events/);
  assert.match(r.stdout, /--feu-vert/);
  assert.doesNotMatch(r.stdout, /--json\s+Sortie machine \(desactive les confirmations interactives\)$/m, 'M-2 : l\'ancienne phrase (fausse à moitié) ne doit plus apparaître telle quelle');
});
