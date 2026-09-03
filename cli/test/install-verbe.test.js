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

function run(args, { input = '' } = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', input });
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
  const avant = { vivant: empreinte(vivant), claude: empreinte(targetClaude) };
  const r = run(['install', '--dry-run', '--root', vivant, '--target-claude', targetClaude, '--yes']);
  assert.equal(r.status, 0, r.stderr);
  const apres = { vivant: empreinte(vivant), claude: empreinte(targetClaude) };
  assert.equal(apres.vivant, avant.vivant, 'le réservoir vivant ne doit subir AUCUNE écriture en dry-run');
  assert.equal(apres.claude, avant.claude, 'la cible --target-claude ne doit subir AUCUNE écriture en dry-run');
  assert.match(r.stdout, /\[1\/4\] CLI/);
  assert.match(r.stdout, /\[2\/4\] méthode/);
  assert.match(r.stdout, /\[3\/4\] IakaCockpit/);
  assert.match(r.stdout, /\[4\/4\] iakaFrameGUI/);
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
  // apparaître, c'est l'EXÉCUTION de l'étape 3 (son message "non disponible") ni le récapitulatif
  // final — la preuve que la chaîne s'est bien ARRÊTÉE à l'étape 2, pas déroulée jusqu'au bout.
  assert.doesNotMatch(r.stdout, /IakaCockpit — non disponible/, 'l\'étape 3 ne doit jamais s\'EXÉCUTER après un refus à l\'étape 2');
  assert.doesNotMatch(r.stdout, /Terminé : étapes 1-2 jouées/, 'aucun récapitulatif de complétion après un refus');
});

test('CA-04 : `--yes` saute TOUTES les validations — exécution complète, réellement écrite (aucune confirmation demandée)', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--root', vivant, '--target-claude', targetClaude, '--yes']);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /REFUS/);
  assert.ok(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), '--yes doit avoir réellement déployé le kit (étape 2)');
  const cm = fs.readFileSync(path.join(targetClaude, 'CLAUDE.md'), 'utf8');
  assert.match(cm, /CLAUDE contract fixture \(install-verbe\.test\)/);
  assert.match(r.stdout, /\[3\/4\] IakaCockpit — non disponible dans cette version/);
  assert.match(r.stdout, /\[4\/4\] iakaFrameGUI — non disponible dans cette version/);
});

test('étapes 3 et 4 sont TOUJOURS déclarées non disponibles, jamais simulées comme un succès', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const r = run(['install', '--root', vivant, '--target-claude', targetClaude, '--yes']);
  assert.match(r.stdout, /IakaCockpit — non disponible dans cette version \(lot C\.1, à venir\)\. Étape refusée explicitement, jamais simulée\./);
  assert.match(r.stdout, /iakaFrameGUI — non disponible dans cette version \(lot C\.1, à venir\)\. Étape refusée explicitement, jamais simulée\./);
});

// EXCEPTION documentee en tete de fichier : appel DIRECT (pas de sous-processus). Un `--root`
// vide fait tomber l'ETAPE 1 dans le repli reseau REEL d'AR-H (aucun vivant => sondes reelles,
// cf. install.js) — un sous-processus n'a AUCUN moyen de le maitriser. Cette assertion ne porte
// que sur `etape2Methode`, la MEME fonction exportee que celle appelee par `runInstall` : le
// code sous test est identique, seul le point d'entree change.
test('étape 2 : aucun réservoir vivant avec install.mjs -> refus EXPLICITE (jamais un repli silencieux sur l\'embarqué)', async () => {
  const vide = tmp();
  const reservoir = resoudreReservoir({ root: vide });
  assert.equal(reservoir.installMjsPath, null, 'precondition : pas de reservoir vivant');
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
  assert.match(sortie, /REFUS : aucun réservoir vivant avec install\.mjs/);
  assert.match(sortie, /L'embarqué \(_bundled\/\) ne porte PAS d'install\.mjs/);
});
