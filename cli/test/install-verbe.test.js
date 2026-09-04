// Gardes du verbe `install` (lot A, chaine-complete-install-amorcage-dmg-msi.md) — CA-03, CA-04,
// CA-07, CA-19, AR-G. Fixture VIVANTE complete (install.mjs REEL copie + kits/iakaframe-claude
// minimal + cli/package.json controle) : chaque assertion porte sur une EXECUTION reelle du CLI
// en sous-processus, jamais sur une lecture de code — A UNE EXCEPTION PRES (le dernier test de
// ce fichier), et elle est motivee sur place : un reservoir SANS vivant fait tomber l'etape 1
// dans le repli reseau REEL d'AR-H (cf. install.js), qu'un sous-processus ne peut pas maitriser.
// Cette exception appelle directement `etape2Methode` (memes fonctions exportees, meme code
// production) — remede exige par le gate qualite (defaut : « GATE LEGOLAS FAIL — dependance
// reseau non maitrisee », voir cli/test/etape1-reseau-ecarte.test.js pour le contrefactuel).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bannierEtapes, ETAPES, etape2Methode } from '../src/commands/install.js';
import { resoudreReservoir } from '../src/lib/reservoir.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REAL_INSTALL_MJS = path.join(REPO, 'install.mjs');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-install-verbe-')); }
function w(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

// Copie ISOLEE du CLI (src/ + package.json, JAMAIS _bundled/) : point de test pour un embarqué
// GARANTI AMPUTÉ, indépendant de l'état AMBIANT de cli/_bundled/ sur ce poste (CA-B7 : le verdict
// de la suite ne doit JAMAIS dépendre de sa présence). `embarqueDir()` (reservoir.js) se résout
// relativement à SA PROPRE localisation (deux niveaux au-dessus de lib/) : copier src/ SANS
// _bundled/ vers un répertoire NEUF garantit donc un embarqué sans install.mjs, quel que soit
// l'état du vrai cli/_bundled/. Le double réseau (fixtures/install-network-double.mjs) est copié
// à son emplacement relatif attendu pour que le sous-processus n'atteigne JAMAIS le réseau réel.
function cliSansBundled() {
  const dir = tmp();
  fs.cpSync(path.join(REPO, 'cli', 'src'), path.join(dir, 'src'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'cli', 'package.json'), path.join(dir, 'package.json'));
  w(
    path.join(dir, 'test', 'fixtures', 'install-network-double.mjs'),
    fs.readFileSync(path.join(REPO, 'cli', 'test', 'fixtures', 'install-network-double.mjs'), 'utf8'),
  );
  return path.join(dir, 'src', 'index.js');
}

function faireReservoirVivant({ version = '0.39.0' } = {}) {
  const dir = tmp();
  fs.copyFileSync(REAL_INSTALL_MJS, path.join(dir, 'install.mjs'));
  w(path.join(dir, 'cli', 'package.json'), JSON.stringify({ version }));
  w(path.join(dir, 'kits', 'iakaframe-claude', 'global', 'CLAUDE.md'), 'CLAUDE contract fixture (install-verbe.test)\n');
  return dir;
}

// Empreinte recursive du systeme de fichiers : chemins relatifs tries + contenu. Deux appels
// EGAUX = AUCUNE ecriture, en toute rigueur (pas seulement "meme nombre de fichiers").
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

// IAKAFRAME_INSTALL_TEST_DOUBLE=1 : le SEUL point d'injection reseau atteignable par un
// sous-processus (cf. install.js, en tete de `runInstall`) — sans lui, l'etape 1 de ces tests
// (fixture toujours EGALE a `courante`, donc jamais de mise a jour locale, cf. AR-2(c)) ferait un
// VRAI appel reseau. Ce fichier ne modifie AUCUNE logique de production : il ne fait qu'injecter
// un double toujours injoignable, exactement comme le prescrit le second gate qualite.
function run(args, { input = '' } = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8', input,
    env: { ...process.env, IAKAFRAME_INSTALL_TEST_DOUBLE: '1' },
  });
}

test('CA-19 : bannierEtapes() annonce TOUJOURS "4 étapes / 3 téléchargements" (AR-A), les 4 étapes nommées', () => {
  const b = bannierEtapes();
  assert.match(b, /4 étapes \/ 3 téléchargements/);
  assert.equal(ETAPES.length, 4);
  assert.deepEqual(ETAPES.map(e => e.nom), ['CLI', 'méthode', 'IakaCockpit', 'iakaFrameGUI']);
  assert.equal(ETAPES.filter(e => e.telecharge).length, 3, 'exactement 3 étapes marquées "téléchargement" (le 4e compte, AR-A)');
  for (const e of ETAPES) assert.match(b, new RegExp(`\\[${e.n}/4\\] ${e.nom}`));
});

test('`install --help` n\'annonce jamais "trois installations" (CA-19, conséquence AR-A)', () => {
  const r = run(['install', '--help']);
  assert.doesNotMatch(r.stdout, /trois installations/i);
});

test('AR-G : le message de l\'étape 1 dit "mise à jour", JAMAIS "installe" (ce verbe joue le SEUL sens possible ici)', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--root', vivant, '--target-claude', path.join(tmp(), 'claude')]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /mise à jour \(poste déjà équipé, AR-G\)/);
  assert.doesNotMatch(r.stdout, /\[1\/4\][^\n]*install[eé]/i, 'étape 1 ne doit jamais se présenter comme une INSTALLATION (AR-G : elle ne peut être qu\'une mise à jour ici)');
});

test('CA-05/CA-06 : la provenance du réservoir est affichée à l\'étape 1', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--root', vivant, '--target-claude', path.join(tmp(), 'claude')]);
  assert.match(r.stdout, /réservoir : vivant .* — embarqué v[\d.]+, égalité, le vivant l'emporte/);
});

test('CA-03 : `install --dry-run` décrit les 4 étapes et N\'ÉCRIT RIEN — prouvé par empreinte disque avant/après', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const appsDir = path.join(tmp(), 'apps');
  const backupDir = path.join(tmp(), 'backups');
  const avant = { vivant: empreinte(vivant), claude: empreinte(targetClaude), apps: empreinte(appsDir), backups: empreinte(backupDir) };
  const r = run(['install', '--dry-run', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', appsDir, '--backup-dir', backupDir, '--yes']);
  assert.equal(r.status, 0, r.stderr);
  const apres = { vivant: empreinte(vivant), claude: empreinte(targetClaude), apps: empreinte(appsDir), backups: empreinte(backupDir) };
  assert.equal(apres.vivant, avant.vivant, 'le réservoir vivant ne doit subir AUCUNE écriture en dry-run');
  assert.equal(apres.claude, avant.claude, 'la cible --target-claude ne doit subir AUCUNE écriture en dry-run');
  assert.equal(apres.apps, avant.apps, '--apps-dir (étapes 3/4) ne doit subir AUCUNE écriture en dry-run');
  assert.equal(apres.backups, avant.backups, '--backup-dir (rollback AR-5) ne doit subir AUCUNE écriture en dry-run');
  assert.match(r.stdout, /\[1\/4\] CLI/);
  assert.match(r.stdout, /\[2\/4\] méthode/);
  assert.match(r.stdout, /\[3\/4\] IakaCockpit/);
  assert.match(r.stdout, /\[4\/4\] iakaFrameGUI/);
  // Lot C.1 : meme en dry-run, les etapes 3/4 CONSULTENT le reseau pour decrire exactement (meme
  // doctrine que l'etape 1) — le double (toujours injoignable) le leur interdit ici, et elles le
  // DISENT plutot que d'ecrire un succes simule (§ CA-15/CA-21 : jamais un succes silencieux).
  assert.match(r.stdout, /\[dry-run\] aucune source n'a servi de manifeste exploitable pour IakaCockpit/);
  assert.match(r.stdout, /\[dry-run\] aucune source n'a servi de manifeste exploitable pour iakaFrameGUI/);
});

test('CA-04 : chaque étape annonce quoi/où/version/fusion, ET refuse SANS confirmation en non-interactif (défaut sûr)', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--root', vivant, '--target-claude', targetClaude], { input: '' });
  assert.match(r.stdout, /quoi : kit\(s\) hôte/);
  assert.match(r.stdout, /où : /);
  assert.match(r.stdout, /quelle version : /);
  assert.match(r.stdout, /ce qui sera fusionné : /);
  assert.match(r.stdout, /REFUS : déploiement de la méthode non confirmé/);
  assert.equal(fs.existsSync(targetClaude), false, 'aucune écriture sans confirmation ni --yes');
});

test('CA-07 : une étape refusée ARRÊTE la chaîne (exit != 0) et ÉNONCE la commande de reprise', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--root', vivant, '--target-claude', targetClaude]);
  assert.notEqual(r.status, 0, 'CA-07 : le processus doit sortir en erreur quand la chaîne s\'arrête');
  assert.match(r.stdout, /Reprise : iakaframe install --yes/);
  // La BANNIERE d'ouverture annonce toujours les 4 étapes (CA-19) ; ce qui ne doit JAMAIS
  // apparaître, c'est l'EXÉCUTION de l'étape 3 (son en-tête « [3/4] ») ni le récapitulatif final —
  // la preuve que la chaîne s'est bien ARRÊTÉE à l'étape 2, pas déroulée jusqu'au bout.
  assert.doesNotMatch(r.stdout, /\n\[3\/4\]/, 'l\'étape 3 ne doit jamais s\'EXÉCUTER après un refus à l\'étape 2');
  assert.doesNotMatch(r.stdout, /Terminé : /, 'aucun récapitulatif de complétion après un refus');
});

test('lot C.1 : `--yes` saute TOUTES les validations des étapes 1-2 (réellement écrites, AUCUNE confirmation demandée) ; la chaîne s\'arrête ENSUITE, loyalement, à l\'étape 3 faute de réseau (double toujours injoignable) — jamais un succès simulé, jamais une écriture hors --apps-dir', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const appsDir = path.join(tmp(), 'apps');
  const backupDir = path.join(tmp(), 'backups');
  const r = run(['install', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', appsDir, '--backup-dir', backupDir, '--yes']);
  assert.notEqual(r.status, 0, 'CA-07 : la chaîne doit sortir en erreur, l\'étape 3 ayant été refusée faute de réseau');
  assert.doesNotMatch(r.stdout, /non confirmé/, '--yes ne doit JAMAIS avoir laissé une confirmation en attente aux étapes 1-2');
  assert.ok(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), '--yes doit avoir réellement déployé le kit (étape 2, avant l\'arrêt à l\'étape 3)');
  const cm = fs.readFileSync(path.join(targetClaude, 'CLAUDE.md'), 'utf8');
  assert.match(cm, /CLAUDE contract fixture \(install-verbe\.test\)/);
  assert.match(r.stdout, /\[3\/4\] IakaCockpit/);
  assert.match(r.stdout, /REFUS : aucune source n'a servi de manifeste exploitable pour IakaCockpit/);
  assert.doesNotMatch(r.stdout, /\n\[4\/4\]/, 'l\'étape 4 ne doit jamais s\'EXÉCUTER après un refus à l\'étape 3');
  assert.equal(fs.existsSync(appsDir), false, 'aucune écriture dans --apps-dir : rien n\'a jamais été résolu, donc rien à sauvegarder ni à poser');
});

// CA-21' (rectification datée de CA-21, BUNDLE-INSTALL-MJS-ABSENT, 2026-09-04) — verifie que la
// propriete tient dans la CHAINE COMPLETE (subprocess reel, `iakaframe install`), pas seulement
// sur l'etape 2 ISOLEE (le test `etape2Methode` direct, plus bas dans ce fichier). DECLENCHEUR
// NEUF (§ 4 de l'instruction du lot) : la charge n'est plus introuvable sur le SEUL critere
// « aucun reservoir vivant » — elle voyage desormais avec le paquet (AR-I(a)). Le seul cas qui
// REFUSE encore est un BUNDLE AMPUTE (l'embarque ne porte PAS install.mjs, ex. clone frais sans
// `npm run bundle`) ET aucun vivant. Cette precondition est rendue DETERMINISTE — jamais
// dependante de l'AMBIANT `cli/_bundled/` de ce poste (N7/CA-B7) — via `cliSansBundled()` : une
// copie ISOLEE du CLI dont l'embarque n'a structurellement pas de `_bundled/`.
test('CA-21\' : ni vivant ni embarqué porteur (bundle AMPUTÉ) -> la CHAÎNE ENTIÈRE refuse à l\'étape 2, EN NOMMANT LES DEUX CHEMINS, jamais un saut vers 3/4', () => {
  const cliEntry = cliSansBundled();
  const vide = tmp(); // pas d'install.mjs : precondition (aucun vivant)
  const targetClaude = path.join(tmp(), 'claude');
  const appsDir = path.join(tmp(), 'apps');
  const r = spawnSync(process.execPath, [
    cliEntry, 'install', '--root', vide, '--target-claude', targetClaude, '--apps-dir', appsDir, '--yes',
  ], { encoding: 'utf8', env: { ...process.env, IAKAFRAME_INSTALL_TEST_DOUBLE: '1' } });
  assert.notEqual(r.status, 0, 'CA-21\' : la chaîne doit sortir en erreur, jamais un succès silencieux');
  assert.match(r.stdout, /REFUS : la charge de la méthode \(install\.mjs\) est introuvable\./, 'CA-21\' : la cause EXACTE doit être nommée');
  assert.match(r.stdout, /cherchée : .*install\.mjs {3}\(réservoir vivant\)/, 'CA-21\' : le chemin vivant cherché doit être nommé');
  assert.match(r.stdout, /_bundled[\\/]install\.mjs \(réservoir embarqué\)/, 'CA-21\' : le chemin embarqué cherché doit être nommé');
  assert.doesNotMatch(r.stdout, /ne porte PAS d'install\.mjs/, 'CA-21\' : plus aucune affirmation sur ce que `_bundled/` NE porte pas (E-3)');
  assert.doesNotMatch(r.stdout, /\n\[3\/4\]/, 'CA-21\' : les étapes 3/4 ne doivent JAMAIS être atteintes quand la chaîne est amputée dès l\'étape 2');
  assert.equal(fs.existsSync(targetClaude), false, 'aucune écriture : ni CLAUDE.md (étape 2 refusée), ni --apps-dir (jamais atteint)');
  assert.equal(fs.existsSync(appsDir), false);
});

// EXCEPTION documentee en tete de fichier : appel DIRECT (pas de sous-processus). Cette assertion
// ne porte que sur `etape2Methode`, la MEME fonction exportee que celle appelee par `runInstall` :
// le code sous test est identique, seul le point d'entree change. RETOURNE (N7) : embarqué
// INJECTE et VIDE (deterministe), jamais l'ambiant `cli/_bundled/`.
test('CA-21\' : étape 2, embarqué injecté AMPUTÉ et aucun vivant -> refus EXPLICITE nommant les deux chemins (jamais un repli silencieux)', async () => {
  const vide = tmp();
  const embarqueVide = tmp(); // `_bundled/` absent : embarque AMPUTE, deterministe
  const reservoir = resoudreReservoir({ root: vide, embarqueDir: embarqueVide });
  assert.equal(reservoir.installMjsPath, null, 'precondition : ni vivant ni embarque porteur');
  const lignes = [];
  const originalLog = console.log;
  console.log = (...args) => lignes.push(args.join(' '));
  let r;
  try {
    r = await etape2Methode({ reservoir, values: { yes: true } });
  } finally {
    console.log = originalLog;
  }
  const sortie = lignes.join('\n');
  assert.equal(r.ok, false);
  assert.match(sortie, /REFUS : la charge de la méthode \(install\.mjs\) est introuvable\./);
  assert.match(sortie, new RegExp(`cherchée : ${path.join(vide, 'install.mjs').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(sortie, new RegExp(path.join(embarqueVide, '_bundled', 'install.mjs').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(sortie, /ne porte PAS d'install\.mjs/, 'E-3 : plus aucune affirmation sur ce que `_bundled/` NE porte pas');
});

// CA-B4 (AR-I(a)) — reproduit EXACTEMENT le cas signalé par le gate du lot C.1
// (docs/qualite/gate-lot-C1-moteur-chaine.md) : un réservoir VIVANT existe mais est PLUS ANCIEN
// que l'embarqué. Avant ce lot, l'étape 2 REFUSAIT en affirmant « aucun réservoir vivant avec
// install.mjs » (FAUX : un vivant existe) et proposait une reprise INOPÉRANTE (`--root` d'un
// clone qui, justement, existe déjà). Ce lot ferme l'écart par construction (AR-I(a)) : l'étape 2
// DÉLÈGUE à l'EMBARQUÉ, porteur désigné, et NOMME SON chemin — jamais celui du vivant qu'elle
// vient d'écarter. Contrefactuel R-B inclus : `vivantRoot === null` côté embarqué gagnant ne doit
// JAMAIS lever de TypeError (`path.join(null, 'kits')`).
test('CA-B4 : vivant PLUS ANCIEN + embarqué PORTEUR -> l\'étape 2 délègue à l\'EMBARQUÉ, nomme SON chemin, et ne plante pas (contrefactuel R-B)', async () => {
  const vivant = faireReservoirVivant({ version: '0.0.1' }); // plus ancien que l'embarque injecte
  const embarque = tmp();
  fs.mkdirSync(path.join(embarque, '_bundled', 'kits', 'iakaframe-claude', 'global'), { recursive: true });
  fs.copyFileSync(REAL_INSTALL_MJS, path.join(embarque, '_bundled', 'install.mjs'));
  w(path.join(embarque, '_bundled', 'kits', 'iakaframe-claude', 'global', 'CLAUDE.md'), 'CLAUDE contract fixture (embarqué porteur, CA-B4)\n');

  const reservoir = resoudreReservoir({ root: vivant, embarqueDir: embarque });
  assert.equal(reservoir.source, 'embarque', 'AR-I(a) : un vivant plus ancien cède la place à l\'embarqué');
  assert.equal(reservoir.installMjsPath, path.join(embarque, '_bundled', 'install.mjs'));

  const targetClaude = path.join(tmp(), 'claude');
  const lignes = [];
  const originalLog = console.log;
  console.log = (...args) => lignes.push(args.join(' '));
  let r;
  try {
    r = await etape2Methode({ reservoir, values: { yes: true, 'target-claude': targetClaude } });
  } finally {
    console.log = originalLog;
  }
  const sortie = lignes.join('\n');
  assert.equal(r.ok, true, sortie);
  assert.match(
    sortie,
    new RegExp(`depuis ${path.join(embarque, '_bundled', 'kits').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    'CA-B4 : le message doit nommer le chemin du réservoir PORTEUR (embarqué), pas le vivant écarté',
  );
  assert.doesNotMatch(sortie, new RegExp(path.join(vivant, 'kits').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'le chemin du vivant écarté ne doit PAS apparaître');
  assert.ok(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), 'le kit doit avoir été posé DEPUIS l\'embarqué');
  const cm = fs.readFileSync(path.join(targetClaude, 'CLAUDE.md'), 'utf8');
  assert.match(cm, /CLAUDE contract fixture \(embarqué porteur, CA-B4\)/);
});
