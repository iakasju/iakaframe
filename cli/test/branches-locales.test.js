// Gardes du signalement « branches sans copie distante » — instruction
// specs/instructions/signalement-branches-sans-copie-distante.md.
//
// 🛑 ZERO RESEAU, ZERO RESTIC, ZERO ECRITURE HORS TMPDIR. Le remote « distant » de ces gardes est
// un DEPOT NU LOCAL : il prouve la presence d'une copie sans ouvrir une socket. Aucune garde
// n'appelle `ls-remote`, `fetch`, `push` vers un serveur, ni `restic`.
//
// 🛑 POURQUOI TOUTE GARDE CLI PASSE PAR `--branches`. Le 2026-08-15 (preambule de range.test.js),
// un sabotage a fait qu'un test lancant le vrai binaire a REELLEMENT ecrit un instantane dans le
// depot de PRODUCTION. `--branches` est la parade STRUCTURELLE de ce lot : ce chemin ne peut PAS
// atteindre restic. Le seul lancement qui va jusqu'a restic ici (`CA-11`) reste protege par le
// harnais de depot JETABLE et INEXISTANT du lot 1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { run } from '../src/lib/git.js';
import {
  CONSEIL, LIBELLE, LIBELLES_FIXES, LIMITES, PLAFOND_AFFICHAGE,
  ageEnJours, analyserDepot, balayer, classer, defaultIgnoreFile,
  estEcartee, ligneRappel, lireMotifsIgnores, motifCorrespond, ordonner, rendreBloc,
} from '../src/lib/branches-locales.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, '..', 'src', 'index.js');
const RACINE = path.resolve(HERE, '..', '..');

const rm = (d) => fs.rmSync(d, { recursive: true, force: true });
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

// Un fichier de motifs VIDE, propre a chaque garde : aucune garde ne depend du contenu reel du
// point de debrayage du depot (sauf `CA-10`, qui l'inspecte exprès).
function motifsVides(dir) {
  const f = path.join(dir, 'motifs-vides.txt');
  fs.writeFileSync(f, '# aucun motif\n');
  return f;
}

// 🛑 UN TERRAIN D'ESSAI = un CHAPEAU (les projets) + un dossier DISTANTS (les depots nus), tenus
// SEPARES. Constat fait en voyant la garde `CA-8` rougir : un depot NU pose dans le chapeau n'a
// pas de sous-repertoire `.git`, il est donc compte « non-git » et fausse les compteurs. La
// limite est reelle (elle est DECLAREE dans `LIMITES`) ; le harnais, lui, ne doit pas la
// declencher par accident.
function terrain(prefix) {
  const base = tmp(prefix);
  const chapeau = path.join(base, 'chapeau');
  const distants = path.join(base, 'distants');
  fs.mkdirSync(chapeau);
  fs.mkdirSync(distants);
  return { base, chapeau, distants };
}

function commit(depot, msg) {
  fs.appendFileSync(path.join(depot, 'fichier.txt'), `${msg}\n`);
  run(depot, ['add', 'fichier.txt']);
  run(depot, ['commit', '-q', '-m', msg]);
}

function initDepot(depot) {
  fs.mkdirSync(depot, { recursive: true });
  run(depot, ['init', '-q', '-b', 'main']);
  run(depot, ['config', 'user.email', 'garde@test.local']);
  run(depot, ['config', 'user.name', 'garde']);
  run(depot, ['config', 'commit.gpgsign', 'false']);
  commit(depot, 'depart');
  return depot;
}

// Le « distant » : un depot NU local. Rien ne sort de la machine.
function distantNu(chemin) {
  fs.mkdirSync(chemin, { recursive: true });
  run(chemin, ['init', '--bare', '-q', '-b', 'main']);
  return chemin;
}

// Depot du chapeau avec un distant nu branche (hors chapeau), `main` pousse AVEC `-u`.
function depotAvecDistant(t, nom = 'projet') {
  const depot = initDepot(path.join(t.chapeau, nom));
  const nu = distantNu(path.join(t.distants, `${nom}.git`));
  run(depot, ['remote', 'add', 'origin', nu]);
  run(depot, ['push', '-q', '-u', 'origin', 'main']);
  return { depot, nu };
}

const perimetreAll = (root) => ({ portee: 'all', projet: null, chemin: root });
const perimetreProjet = (root, nom) => ({ portee: 'projet', projet: nom, chemin: path.join(root, nom) });

// --- CA-1 : le cas de l'incident est detecte -----------------------------------------------------

test('CA-1 : une branche locale sans AUCUNE ref distante est signalee, avec le nombre EXACT de commits', () => {
  const t = terrain('iaka-branches-ca1-');
  try {
    const { depot } = depotAvecDistant(t);
    run(depot, ['checkout', '-q', '-b', 'feat/x']);
    commit(depot, 'un'); commit(depot, 'deux'); commit(depot, 'trois');

    const r = analyserDepot(depot, { projet: 'projet' });
    assert.equal(r.signalees.length, 1, 'la branche locale-seule est signalee');
    const e = r.signalees[0];
    assert.equal(e.branche, 'feat/x');
    assert.equal(e.etat, 'absente', 'elle n\'existe NULLE PART ailleurs');
    assert.equal(e.commitsLocaux, 3, 'le nombre de commits est exact, pas approche');
    assert.deepEqual(e.refsDistantes, []);
    assert.equal(typeof e.ageJours, 'number');
  } finally { rm(t.base); }
});

test('CA-1 TEMOIN NEGATIF : la MEME branche poussee DISPARAIT du signalement', () => {
  const t = terrain('iaka-branches-ca1n-');
  try {
    const { depot } = depotAvecDistant(t);
    run(depot, ['checkout', '-q', '-b', 'feat/x']);
    commit(depot, 'un');
    assert.equal(analyserDepot(depot, { projet: 'p' }).signalees.length, 1, 'signalee avant le push');

    run(depot, ['push', '-q', '-u', 'origin', 'feat/x']);
    assert.deepEqual(analyserDepot(depot, { projet: 'p' }).signalees, [],
      'apres le push elle est muette : la garde MESURE, elle ne crie pas en permanence');
  } finally { rm(t.base); }
});

// --- CA-2 : le faux positif mesure en `V5` NE se produit PAS -------------------------------------

test('🛑 CA-2 : une branche poussee SANS `-u` (donc sans upstream configure) n\'est PAS signalee', () => {
  const t = terrain('iaka-branches-ca2-');
  try {
    const { depot } = depotAvecDistant(t);
    run(depot, ['checkout', '-q', '-b', 'pousse-sans-u']);
    commit(depot, 'un');
    // Pousse SANS `-u` : la ref distante existe, la CONFIGURATION d'upstream n'existe pas.
    run(depot, ['push', '-q', 'origin', 'pousse-sans-u']);

    // Preuve du montage : c'est exactement l'etat des 6 branches mesurees en `V5`.
    const upstream = run(depot, ['for-each-ref', '--format=%(upstream)', 'refs/heads/pousse-sans-u']).out;
    assert.equal(upstream, '', 'montage valide : AUCUN upstream configure (F2/F3)');
    const refDistante = run(depot, ['for-each-ref', '--format=%(refname)', 'refs/remotes/origin/pousse-sans-u']).out;
    assert.match(refDistante, /refs\/remotes\/origin\/pousse-sans-u/, 'montage valide : la ref distante EXISTE');

    assert.deepEqual(analyserDepot(depot, { projet: 'p' }).signalees, [],
      'le predicat mesure une COPIE, pas une CONFIGURATION : 0 faux positif ici');
  } finally { rm(t.base); }
});

// --- CA-3 : `en-avance` est distingue de `absente` -----------------------------------------------

test('CA-3 : une branche partiellement repliquee est `en-avance`, N exact, remote NOMME', () => {
  const t = terrain('iaka-branches-ca3-');
  try {
    const { depot } = depotAvecDistant(t);
    run(depot, ['checkout', '-q', '-b', 'feat/y']);
    commit(depot, 'un');
    run(depot, ['push', '-q', 'origin', 'feat/y']);
    commit(depot, 'deux'); commit(depot, 'trois');

    const [e] = analyserDepot(depot, { projet: 'p' }).signalees;
    assert.equal(e.branche, 'feat/y');
    assert.equal(e.etat, 'en-avance');
    assert.equal(e.commitsLocaux, 2, 'seuls les 2 commits non repliques sont comptes');
    assert.deepEqual(e.refsDistantes, ['origin'], 'le remote porteur est NOMME');
  } finally { rm(t.base); }
});

test('CA-3 TEMOIN NEGATIF : une branche strictement EN RETARD n\'est pas signalee (tout est replique)', () => {
  const t = terrain('iaka-branches-ca3n-');
  try {
    const { depot } = depotAvecDistant(t);
    commit(depot, 'deux'); commit(depot, 'trois');
    run(depot, ['push', '-q', 'origin', 'main']);
    const vieux = run(depot, ['rev-parse', 'HEAD~2']).out;
    run(depot, ['branch', 'retard', vieux]);   // aucune ref distante HOMONYME, mais 0 commit unique

    const noms = analyserDepot(depot, { projet: 'p' }).signalees.map((e) => e.branche);
    assert.ok(!noms.includes('retard'),
      'le predicat porte sur les COMMITS, pas sur le nom : rien d\'unique ici, donc rien a dire');
  } finally { rm(t.base); }
});

// --- CA-4 : le perimetre du balayage suit celui de l'instantane ----------------------------------

// Chapeau factice : 3 depots ayant chacun UNE branche locale-seule, plus un repertoire qui n'est
// pas un depot git (temoin de `CA-8`).
function chapeauTrois(prefix) {
  const t = terrain(prefix);
  for (const nom of ['alpha', 'beta', 'gamma']) {
    const { depot } = depotAvecDistant(t, nom);
    run(depot, ['checkout', '-q', '-b', `wip/${nom}`]);
    commit(depot, 'local seulement');
  }
  fs.mkdirSync(path.join(t.chapeau, 'pas-un-depot'));
  fs.writeFileSync(path.join(t.chapeau, 'pas-un-depot', 'note.md'), 'ni git ni projet\n');
  return t;
}

test('CA-4 : `all` balaie les 3 depots du chapeau ; le ciblage n\'en balaie qu\'UN', () => {
  const t = chapeauTrois('iaka-branches-ca4-');
  try {
    const ignoreFile = motifsVides(t.base);

    const tout = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile });
    assert.equal(tout.branchesSansCopieDistanteCount, 3, 'les 3 branches locales-seules sont vues');
    assert.equal(tout.scanBranches.depotsScannes, 3);
    assert.deepEqual(tout.branchesSansCopieDistante.map((e) => e.projet).sort(), ['alpha', 'beta', 'gamma']);

    const cible = balayer(perimetreProjet(t.chapeau, 'alpha'), { root: t.chapeau, ignoreFile });
    assert.equal(cible.branchesSansCopieDistanteCount, 1, 'un seul depot balaye');
    assert.equal(cible.branchesSansCopieDistante[0].projet, 'alpha');
    assert.equal(cible.scanBranches.depotsScannes, 1);
  } finally { rm(t.base); }
});

test('CA-4 TEMOIN NEGATIF : le silence sur les AUTRES depots est DECLARE, jamais suppose', () => {
  const t = chapeauTrois('iaka-branches-ca4n-');
  try {
    const bloc = rendreBloc(balayer(perimetreProjet(t.chapeau, 'alpha'),
      { root: t.chapeau, ignoreFile: motifsVides(t.base) })).join('\n');
    assert.match(bloc, /RIEN n'est dit des autres depots/,
      'un silence non declare passerait pour un « tout va bien »');
  } finally { rm(t.base); }
});

// --- CA-5 : il parle meme quand il n'a rien a signaler -------------------------------------------

test('🛑 CA-5 : tout pousse => il parle QUAND MEME, avec ses compteurs', () => {
  const t = terrain('iaka-branches-ca5-');
  try {
    const { depot } = depotAvecDistant(t, 'alpha');
    run(depot, ['checkout', '-q', '-b', 'feat/z']);
    commit(depot, 'un');
    run(depot, ['push', '-q', '-u', 'origin', 'feat/z']);

    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    assert.equal(r.branchesSansCopieDistanteCount, 0);
    const bloc = rendreBloc(r);
    assert.ok(bloc.length >= 1, 'AU MOINS une ligne : sinon « rien a signaler » = « garde cassee »');
    assert.match(bloc[0], new RegExp(`${LIBELLE} : aucune`));
    // 🪤 ASSERTION AMENDEE PAR LE LOT 3, ET C'EST DECLARE — pas glisse. Elle disait
    // `/depots scannes/` ; l'accord de « depot(s) » (`W12`, `CB-5`) rend ce littéral invariable
    // IMPOSSIBLE sur ce chapeau d'UN depot. Elle n'est pas affaiblie mais RESSERREE : elle rejette
    // desormais « 1 depot scannes ». Le reste de la garde `CA-5` est intact.
    assert.match(bloc[0], /1 depot scanne(?!s)/, 'le compteur est dit ET accorde (CB-5)');
    assert.match(bloc[0], /branches examinees/, 'les compteurs sont dits, pas juste « aucune »');
    assert.match(ligneRappel(r), /aucune/);
  } finally { rm(t.base); }
});

test('🛑 CA-5 TEMOIN NEGATIF : rendreBloc ne rend JAMAIS zero ligne, quel que soit le rapport', () => {
  const vide = {
    portee: 'all', projet: null, branchesSansCopieDistante: [], branchesSansCopieDistanteCount: 0,
    scanBranches: {
      depotsScannes: 0, depotsNonGit: 0, depotsNonGitNoms: [], depotsIgnores: 0,
      depotsIgnoresNoms: [], branchesExaminees: 0, branchesEcartees: 0,
      motifsIgnores: '/x', dureeMs: 0, limites: LIMITES,
    },
  };
  assert.ok(rendreBloc(vide).length >= 1, 'meme un chapeau vide produit une ligne');
});

// --- CA-6 : jamais bloquant ----------------------------------------------------------------------

function envJetable(base) {
  const env = { ...process.env };
  delete env.RESTIC_REPOSITORY;
  delete env.RESTIC_PASSWORD_COMMAND;
  env.IAKA_RANGE_REPOSITORY = path.join(base, 'depot-jetable-inexistant');
  env.IAKA_RANGE_PASSWORD_COMMAND = 'printf mot-de-passe-de-test';
  return env;
}

test('CA-6 : `range --branches` avec 3 branches signalees sort en 0 (jamais bloquant)', () => {
  const t = chapeauTrois('iaka-branches-ca6-');
  try {
    const r = spawnSync(process.execPath, [CLI, 'range', '--branches', '--root', t.chapeau, '--json'],
      { encoding: 'utf8', env: envJetable(t.base) });
    assert.equal(r.status, 0, 'un signalement ne fait JAMAIS echouer le verbe');
    const o = JSON.parse(r.stdout);
    assert.equal(o.ok, true);
    assert.equal(o.branchesSansCopieDistanteCount, 3);
    assert.equal(o.branchesSansCopieDistante.length, 3, 'count = longueur exacte (regle 3 C-JSON)');
    assert.equal(r.stderr.trim(), '', 'rien d\'humain sur stderr en mode --json');

    const h = spawnSync(process.execPath, [CLI, 'range', '--branches', '--root', t.chapeau],
      { encoding: 'utf8', env: envJetable(t.base) });
    assert.equal(h.status, 0);
    assert.match(h.stdout, new RegExp(LIBELLE));
  } finally { rm(t.base); }
});

test('CA-6 : `--branches` ne lance PAS restic (aucun depot restic touche, meme inexistant)', () => {
  const t = chapeauTrois('iaka-branches-ca6b-');
  try {
    const env = envJetable(t.base);
    const r = spawnSync(process.execPath, [CLI, 'range', '--branches', '--root', t.chapeau, '--json'],
      { encoding: 'utf8', env });
    const o = JSON.parse(r.stdout);
    assert.equal(o.ok, true, 'aucune tentative restic : le depot jetable est INEXISTANT');
    assert.equal(o.resume, undefined, 'aucun resume restic dans la charge d\'un balayage seul');
    assert.ok(!fs.existsSync(env.IAKA_RANGE_REPOSITORY), 'aucun depot restic cree');
  } finally { rm(t.base); }
});

// --- CA-7 : le libelle ne mente pas -------------------------------------------------------------

test('🛑 CA-7 : le signalement dit « sans copie distante », JAMAIS « non sauvegarde »', () => {
  const t = chapeauTrois('iaka-branches-ca7-');
  try {
    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    const bloc = rendreBloc(r).join('\n');

    // 1. Le bon libelle est la, a l'ecran comme dans les cles machine.
    assert.match(bloc, new RegExp(LIBELLE));
    assert.ok(Object.keys(r).includes('branchesSansCopieDistante'));
    assert.ok(Object.keys(r).includes('branchesSansCopieDistanteCount'));

    // 2. Aucun LIBELLE du signalement ne parle de sauvegarde : l'instantane CONTIENT les `.git`,
    //    donc « non sauvegarde » serait FAUX des que `range` a tourne.
    for (const l of LIBELLES_FIXES) {
      assert.ok(!/sauvegard/i.test(l), `libelle qui mentirait sur ce qui est mesure : « ${l} »`);
    }
    assert.ok(!/non.{0,3}sauvegard/i.test(bloc), 'aucune formulation « non sauvegarde » a l\'ecran');
    assert.ok(!/sauvegard/i.test(ligneRappel(r)), 'la ligne de rappel non plus');
    for (const cle of Object.keys(r).concat(Object.keys(r.scanBranches))) {
      assert.ok(!/sauvegard/i.test(cle), `cle JSON qui mentirait : ${cle}`);
    }
  } finally { rm(t.base); }
});

// --- CA-8 : les angles morts sont RENDUS -------------------------------------------------------

test('🛑 CA-8 : les limites sont une SORTIE (`limites` non vide + bloc « ne voit pas » a l\'ecran)', () => {
  const t = chapeauTrois('iaka-branches-ca8-');
  try {
    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    assert.ok(Array.isArray(r.scanBranches.limites) && r.scanBranches.limites.length > 0,
      'scanBranches.limites non vide');
    assert.match(rendreBloc(r).join('\n'), /ce balayage ne voit pas :/);
    assert.ok(r.scanBranches.limites.some((l) => /fetch/.test(l)),
      'la fraicheur du dernier fetch est declaree');
  } finally { rm(t.base); }
});

test('🛑 CA-8 TEMOIN NEGATIF : un repertoire NON-GIT fait monter depotsNonGit et est NOMME', () => {
  const t = chapeauTrois('iaka-branches-ca8n-');   // pose `pas-un-depot`
  try {
    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    assert.equal(r.scanBranches.depotsNonGit, 1, 'compte : rien n\'est avale en silence');
    assert.deepEqual(r.scanBranches.depotsNonGitNoms, ['pas-un-depot'], 'et NOMME');
    assert.match(rendreBloc(r).join('\n'), /non suivis par git : pas-un-depot/);
  } finally { rm(t.base); }
});

// --- CA-10 : le debrayage existe et se voit ----------------------------------------------------

test('CA-10 : le point de debrayage `DE` existe, versionne, commente, et SANS motif actif', () => {
  const f = defaultIgnoreFile();
  assert.ok(fs.existsSync(f), `fichier de motifs present : ${f}`);
  const { motifs } = lireMotifsIgnores(f);
  assert.deepEqual(motifs, [], 'aucun motif actif : c\'est une PROVISION, pas un besoin mesure');
  const brut = fs.readFileSync(f, 'utf8');
  assert.match(brut, /DE/, 'il nomme la decision qu\'il materialise');
  assert.match(brut, /ECARTER N'EST JAMAIS TAIRE/, 'il dit que l\'exclusion reste visible');
});

test('🛑 CA-10 TEMOIN NEGATIF : un motif actif retire de la LISTE et fait monter branchesEcartees', () => {
  const t = chapeauTrois('iaka-branches-ca10-');
  try {
    const f = path.join(t.base, 'motifs.txt');
    fs.writeFileSync(f, '# essai\nwip/alpha\n');

    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: f });
    assert.equal(r.branchesSansCopieDistanteCount, 2, 'la branche ecartee quitte la liste');
    assert.ok(!r.branchesSansCopieDistante.some((e) => e.branche === 'wip/alpha'));
    assert.equal(r.scanBranches.branchesEcartees, 1, 'une exclusion INVISIBLE est interdite');
    const bloc = rendreBloc(r).join('\n');
    assert.match(bloc, /ecartees par motif : 1/);
    assert.match(bloc, new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      'le chemin du fichier de motifs est affiche : on peut aller voir');
  } finally { rm(t.base); }
});

test('motifCorrespond : glob de nom de branche, correspondance ENTIERE', () => {
  assert.ok(motifCorrespond('archive/*', 'archive/vieux'));
  assert.ok(!motifCorrespond('archive', 'archive/vieux'), 'pas de prefixe implicite');
  assert.ok(motifCorrespond('wip/essai-*', 'wip/essai-3'));
  assert.ok(!motifCorrespond('wip/essai-*', 'feat/essai-3'));
  assert.ok(estEcartee('archive/x', ['archive/*']));
  assert.ok(!estEcartee('feat/x', ['archive/*']));
});

// --- CA-11 : le signalement survit a l'echec de restic ------------------------------------------

test('🛑 CA-11 : en `--json`, la charge d\'ECHEC porte QUAND MEME le signalement', () => {
  const t = chapeauTrois('iaka-branches-ca11-');
  try {
    // Depot restic JETABLE et INEXISTANT (harnais du lot 1) : restic echoue, rien n'est ecrit.
    const r = spawnSync(process.execPath, [CLI, 'range', 'alpha', '--root', t.chapeau, '--json'],
      { encoding: 'utf8', env: envJetable(t.base) });
    assert.equal(r.status, 1, 'restic echoue sur un depot absent');
    const o = JSON.parse(r.stdout);
    assert.equal(o.ok, false);
    assert.ok(Array.isArray(o.branchesSansCopieDistante),
      'c\'est exactement le moment ou l\'information compte : elle ne doit pas etre perdue');
    assert.equal(o.branchesSansCopieDistanteCount, 1);
    assert.ok(o.scanBranches && Array.isArray(o.scanBranches.limites));
    assert.ok(!String(o.repository || '').startsWith('sftp:'), 'jamais le depot de production');
  } finally { rm(t.base); }
});

// --- CA-13 : zero reseau, zero ecriture --------------------------------------------------------

test('🛑 CA-13 : le module n\'appelle NI ls-remote, NI fetch, NI push, NI restic', () => {
  const src = fs.readFileSync(path.join(HERE, '..', 'src', 'lib', 'branches-locales.js'), 'utf8');
  // On ne regarde que les ARGV git construits (les commentaires citent ces mots pour expliquer
  // pourquoi ils sont ecartes — c'est le code qui compte).
  const argv = src.match(/run\([^)]*\[[^\]]*\]/gs) || [];
  const plat = argv.join(' ');
  for (const interdit of ['ls-remote', 'fetch', 'push', 'restic', 'commit', 'branch', 'config']) {
    assert.ok(!plat.includes(`'${interdit}'`), `aucune commande git ${interdit} dans le balayage`);
  }
});

test('🛑 CA-13 : un depot balaye n\'est PAS modifie (constat avant/apres, pas une promesse)', () => {
  const t = terrain('iaka-branches-ca13-');
  try {
    const { depot } = depotAvecDistant(t, 'alpha');
    run(depot, ['checkout', '-q', '-b', 'wip/rien']);
    commit(depot, 'un');

    const empreinte = (d) => {
      const acc = [];
      const parcourir = (rel) => {
        for (const e of fs.readdirSync(path.join(d, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          const r = path.join(rel, e.name);
          if (e.isDirectory()) parcourir(r);
          else acc.push(`${r}:${fs.statSync(path.join(d, r)).size}`);
        }
      };
      parcourir('.');
      return acc.join('\n');
    };

    const avant = empreinte(depot);
    balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    assert.equal(empreinte(depot), avant, 'aucun fichier cree, modifie ni supprime dans le depot balaye');
    assert.equal(run(depot, ['status', '--porcelain']).out, '', 'arbre de travail intact');
  } finally { rm(t.base); }
});

// --- CA-14 : l'aide et l'inventaire disent la meme chose que le code ---------------------------

test('CA-14 : l\'aide documente `--branches` et le signalement', () => {
  const r = spawnSync(process.execPath, [CLI, '--help'], { encoding: 'utf8' });
  assert.match(r.stdout, /--branches/, 'le bloc `range` de l\'aide generale documente l\'option');
  assert.match(r.stdout, /sans copie distante/, 'et dit ce que l\'option signale');
  const u = spawnSync(process.execPath, [CLI, 'range'], { encoding: 'utf8' });
  assert.match(u.stderr + u.stdout, /--branches/, 'l\'USAGE du verbe aussi');
});

test('CA-14 : `docs/commandes.md` porte la ligne `range` (absente avant ce lot, V9)', () => {
  const doc = fs.readFileSync(path.join(RACINE, 'docs', 'commandes.md'), 'utf8');
  assert.match(doc, /\|\s*`range[ <`]/, 'une ligne de tableau pour le verbe `range`');
  assert.match(doc, /sans copie distante/, 'et elle mentionne le signalement');
});

// --- plafond d'affichage : on borne l'AFFICHAGE, jamais le compteur ---------------------------

function faux(n) {
  const liste = Array.from({ length: n }, (_, i) => ({
    projet: `p${i}`, branche: `wip/b${i}`, commitsLocaux: n - i, etat: 'absente',
    refsDistantes: [], dernierCommit: '2026-08-01T10:00:00+02:00', ageJours: i,
  }));
  return {
    portee: 'all', projet: null, branchesSansCopieDistante: liste, branchesSansCopieDistanteCount: n,
    scanBranches: {
      depotsScannes: n, depotsNonGit: 0, depotsNonGitNoms: [], depotsIgnores: 0, depotsIgnoresNoms: [],
      branchesExaminees: n, branchesEcartees: 0, motifsIgnores: '/x', dureeMs: 1, limites: LIMITES,
    },
  };
}

// 🛑 GARDE NEE D'UN SABOTAGE QUI N'A PAS ROUGI. La falsification « faire du plafond d'affichage
// un plafond de COMPTAGE » (`branchesSansCopieDistanteCount: Math.min(n, 10)`) est passee INAPERCUE :
// la garde ci-dessous fabriquait son rapport a la main, sans traverser `balayer`, et les gardes CLI
// n'avaient que 3 branches. Un compteur faux au-dela de 10 branches serait donc passe en prod.
// Cette garde compte VRAIMENT, sur un depot reel de 12 branches locales-seules.
test('🛑 plafond : le COMPTEUR de `balayer` reste exact au-dela du plafond (12 > 10)', () => {
  const t = terrain('iaka-branches-plafond-');
  try {
    const { depot } = depotAvecDistant(t, 'alpha');
    for (let i = 0; i < 12; i += 1) {
      run(depot, ['checkout', '-q', '-b', `wip/b${i}`, 'main']);
      commit(depot, `local ${i}`);
    }
    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    assert.equal(r.branchesSansCopieDistanteCount, 12, 'le compteur compte 12, pas 10');
    assert.equal(r.branchesSansCopieDistante.length, 12, 'la LISTE machine est complete (--json ne tronque pas)');
    const bloc = rendreBloc(r);
    assert.equal(bloc.filter((l) => /wip\/b\d+/.test(l)).length, PLAFOND_AFFICHAGE,
      'seul l\'AFFICHAGE est borne a 10');
    assert.match(bloc[0], new RegExp(`${LIBELLE} : 12 sur`));
  } finally { rm(t.base); }
});

test('🛑 plafond : 10 lignes de detail au plus, mais le COMPTEUR reste exact', () => {
  const bloc = rendreBloc(faux(12));
  const details = bloc.filter((l) => /wip\/b\d+/.test(l));
  assert.equal(details.length, PLAFOND_AFFICHAGE, 'affichage borne a 10 lignes');
  assert.match(bloc.join('\n'), /et 2 autres \(voir --json\)/, 'le reste est annonce, pas escamote');
  assert.match(bloc[0], new RegExp(`${LIBELLE} : 12 sur`), 'le compteur reste EXACT : 12, pas 10');
  assert.match(bloc.join('\n'), new RegExp(CONSEIL.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')),
    'il dit quoi faire');
});

// --- predicat : unites pures --------------------------------------------------------------------

test('classer : N=0 => silencieux PAR CONSTRUCTION ; N>0 => absente ou en-avance', () => {
  assert.equal(classer(0, []), null, 'aucun commit unique => rien n\'est dit');
  assert.equal(classer(0, ['origin']), null);
  assert.equal(classer(3, []), 'absente');
  assert.equal(classer(3, ['origin']), 'en-avance');
  assert.equal(classer(3, ['github']), 'en-avance', 'un miroir compte comme copie distante (V6)');
  assert.equal(classer(null, []), null, 'un chiffre non lu n\'est jamais invente');
});

test('ageEnJours : affiche pour trier, JAMAIS utilise comme filtre', () => {
  const t = Date.parse('2026-08-17T12:00:00+02:00');
  assert.equal(ageEnJours('2026-08-17T12:00:00+02:00', t), 0);
  assert.equal(ageEnJours('2026-08-05T12:00:00+02:00', t), 12);
  assert.equal(ageEnJours('pas une date', t), null);
  // le filtre n'existe pas : une branche vieille de 0 jour est signalee comme les autres
  assert.equal(classer(1, []), 'absente');
});

// =================================================================================================
// LOT 3 — temoins manquants du signalement des branches
// specs/instructions/temoins-manquants-signalement-branches.md (gardes `CB-1` a `CB-8`).
//
// 🛑 CE QUE CE BLOC REPARE. Le lot 2 tenait trois promesses que RIEN ne gardait, et Legolas l'a
// mesure au gate : (`L-1`) l'ordre de rendu etait promis en commentaire, l'inverser laissait la
// suite VERTE (26 pass, 0 fail) ; (`L-2`) le chemin EXCEPTION de `DD-7` n'avait aucun temoin ;
// (`L-3`) un predicat qui rend `null` produisait du SILENCE, et le temoin negatif de `CA-2` decrivait
// ce mecanisme A L'ENVERS. Les gardes ci-dessous sont ces trois temoins, plus l'accord de « depot(s) »
// et l'honnetete du releve d'execution.
// =================================================================================================

// --- CB-1 / CB-2 : le predicat non calculable est COMPTE, NOMME, et la sortie ne mente plus -------

// La couture `compter` de `DG`, cablee sur un predicat qui NE SAIT PAS repondre. Elle atteint la
// classe de panne de `L-3` SANS casser la source — parce qu'une classe de panne qu'on ne peut
// atteindre que par sabotage est une classe de panne sans temoin.
const compterMuet = () => null;

// 🛑 LE SABOTAGE `S1` REJOUE, ET RENDU PERMANENT. Legolas l'avait joue a la main : `CA-2` restait
// VERT. Le voici cable en dur, avec le VRAI predicat sabote (`--not <B>@{upstream}` au lieu de
// `--not --remotes`). Mecanisme (fait verifie `F4`) : prive d'upstream configure, `<B>@{upstream}`
// n'est pas une revision resoluble — git rend `fatal: no upstream configured for branch`, code 128
// — donc `git.js:run` rend `ok:false` et le predicat rend `null`. AVANT `DG`, la branche devenait
// MUETTE et la sortie annoncait « aucune » : un mensonge. C'est la reserve `L-3`.
function compterS1(cwd, branche) {
  const r = run(cwd, ['rev-list', '--count', `refs/heads/${branche}`, '--not', `${branche}@{upstream}`]);
  if (!r.ok) return null;
  const n = Number.parseInt(r.out, 10);
  return Number.isFinite(n) ? n : null;
}

// Le terrain de `V5` : UN depot dont une branche est poussee SANS `-u`. Le vrai predicat SAIT
// repondre dessus (il mesure une COPIE, pas une CONFIGURATION) ; le predicat sabote par `S1`, non.
function chapeauPousseSansU(prefix) {
  const t = terrain(prefix);
  const { depot } = depotAvecDistant(t, 'alpha');
  run(depot, ['checkout', '-q', '-b', 'pousse-sans-u']);
  commit(depot, 'un');
  run(depot, ['push', '-q', 'origin', 'pousse-sans-u']);   // SANS `-u` : aucun upstream configure
  return t;
}

test('🛑 CB-1 : une branche au predicat NON CALCULABLE est COMPTEE et NOMMEE (fin du silence)', () => {
  const t = chapeauTrois('iaka-branches-cb1-');
  try {
    const r = balayer(perimetreAll(t.chapeau),
      { root: t.chapeau, ignoreFile: motifsVides(t.base), compter: compterMuet });

    // 3 depots x 2 branches (`main` + `wip/<nom>`) : AUCUNE mesurable, donc AUCUNE avalee.
    assert.equal(r.scanBranches.branchesIndeterminees, 6, 'le nombre est EXACT, pas approche');
    assert.equal(r.branchesSansCopieDistanteCount, 0, 'rien de mesurable, donc rien de signale');
    assert.deepEqual(r.scanBranches.branchesIndetermineesNoms.slice().sort(),
      ['alpha:main', 'alpha:wip/alpha', 'beta:main', 'beta:wip/beta', 'gamma:main', 'gamma:wip/gamma'],
      'chaque branche est NOMMEE `projet:branche`');
    // Le `:` est INTERDIT dans un nom de ref git (`git-check-ref-format` regle 4, fait `F5`) :
    // le separateur est donc NON AMBIGU, ce que le `/` n'aurait pas ete.
    for (const nom of r.scanBranches.branchesIndetermineesNoms) {
      assert.equal(nom.split(':').length, 2, `separateur non ambigu : ${nom}`);
    }
    assert.match(rendreBloc(r).join('\n'), /indeterminees : alpha:main/,
      'la sortie humaine les NOMME : « aucune » qualifiee sans dire LAQUELLE laisse sans prise');
  } finally { rm(t.base); }
});

test('🛑 CB-1 : la branche indeterminee entre AUSSI dans branchesExaminees (aucun compteur perdu)', () => {
  const t = chapeauTrois('iaka-branches-cb1b-');
  try {
    const opts = { root: t.chapeau, ignoreFile: motifsVides(t.base) };
    const normal = balayer(perimetreAll(t.chapeau), opts);
    const muet = balayer(perimetreAll(t.chapeau), { ...opts, compter: compterMuet });
    assert.equal(muet.scanBranches.branchesExaminees, normal.scanBranches.branchesExaminees,
      'le meme nombre de branches est EXAMINE : seul le resultat de la mesure change');
    assert.equal(muet.scanBranches.depotsScannes, 3, 'les depots restent lisibles : ce n\'est pas eux');
  } finally { rm(t.base); }
});

test('🛑 CB-1 TEMOIN NEGATIF : en fonctionnement NORMAL (couture non utilisee), le compteur vaut 0', () => {
  const t = chapeauPousseSansU('iaka-branches-cb1n-');
  try {
    // 🛑 C'EST LA GARDE QUE LE SABOTAGE `S1` FAIT ROUGIR. Sur ce terrain (celui de `V5`), le vrai
    // predicat SAIT repondre ; `S1` le rend non calculable, ce compteur monte et cette garde tombe.
    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    assert.equal(r.scanBranches.branchesIndeterminees, 0,
      'le predicat mesure une COPIE : il sait repondre meme sans upstream configure');
    assert.deepEqual(r.scanBranches.branchesIndetermineesNoms, []);
  } finally { rm(t.base); }
});

test('🛑 CB-1 TEMOIN NEGATIF : `range` n\'expose AUCUN moyen de fixer `compter` (RB-1)', () => {
  const dir = path.join(HERE, '..', 'src', 'commands');
  const coupables = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    if (/compter/.test(fs.readFileSync(path.join(dir, f), 'utf8'))) coupables.push(f);
  }
  assert.deepEqual(coupables, [],
    'une couture de test qui devient un chemin de production est une porte ouverte : aucun drapeau, aucune variable d\'environnement');
});

test('🛑 CB-2 : la sortie ne dit PLUS « aucune » quand elle n\'a RIEN PU MESURER', () => {
  const t = chapeauTrois('iaka-branches-cb2-');
  try {
    const r = balayer(perimetreAll(t.chapeau),
      { root: t.chapeau, ignoreFile: motifsVides(t.base), compter: compterMuet });
    assert.equal(r.branchesSansCopieDistanteCount, 0, 'zero signalement...');
    assert.ok(r.scanBranches.branchesIndeterminees > 0, '...mais des indeterminees');

    const bloc = rendreBloc(r);
    // `aucune (` est la forme NON QUALIFIEE d'avant ce lot — celle qui mentait.
    assert.doesNotMatch(bloc[0], /aucune \(/, 'plus aucune affirmation « aucune » NON QUALIFIEE');
    assert.match(bloc[0], /INDETERMIN/, 'elle dit « je n\'ai pas pu mesurer »');

    // La ligne de rappel de `DD-3` suit la MEME regle : deux emplacements, une seule honnetete.
    const rap = ligneRappel(r);
    assert.doesNotMatch(rap, /aucune \(/, 'le rappel non plus ne pretend pas « aucune »');
    assert.match(rap, /INDETERMIN/);
  } finally { rm(t.base); }
});

test('🛑 CB-2 : le sabotage `S1` REJOUE est attrape par la garde qui le DECRIT (reserve L-3 refermee)', () => {
  const t = chapeauPousseSansU('iaka-branches-cb2s1-');
  try {
    const r = balayer(perimetreAll(t.chapeau),
      { root: t.chapeau, ignoreFile: motifsVides(t.base), compter: compterS1 });

    assert.ok(r.scanBranches.branchesIndeterminees >= 1, '`S1` rend le predicat non calculable...');
    assert.match(r.scanBranches.branchesIndetermineesNoms.join(','), /alpha:pousse-sans-u/,
      '...et c\'est bien LA branche de `V5` qui devient indeterminee');

    const bloc = rendreBloc(r);
    assert.doesNotMatch(bloc[0], /aucune \(/,
      'AVANT ce lot, cette situation exacte rendait « aucune » : un MENSONGE. C\'est `L-3`.');
    assert.match(bloc[0], /INDETERMIN/, '`S1` rougit desormais sur la garde qui le decrit');
    assert.match(bloc.join('\n'), /indeterminees : alpha:pousse-sans-u/);
  } finally { rm(t.base); }
});

test('🛑 CB-2 TEMOIN NEGATIF : tout mesurable => « aucune » NON qualifiee et AUCUN « INDETERMIN »', () => {
  const t = chapeauPousseSansU('iaka-branches-cb2n-');
  try {
    // Seconde garde que `S1` fait rougir : ici la sortie DOIT dire « aucune » tout court, parce
    // qu'on a REELLEMENT mesure. Confondre les deux etats est precisement ce qu'on interdit.
    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });
    const bloc = rendreBloc(r);
    assert.match(bloc[0], /aucune \(/, '« aucune » NON qualifiee : la mesure a bien eu lieu');
    assert.doesNotMatch(bloc.join('\n'), /INDETERMIN/, 'rien d\'indetermine a annoncer');
    assert.doesNotMatch(ligneRappel(r), /INDETERMIN/);
  } finally { rm(t.base); }
});

test('🛑 CB-2 : classer reste INCHANGEE — un chiffre non lu n\'est toujours pas invente', () => {
  // `DG` repare le COMPTE RENDU, pas le CLASSEMENT. Le contrat de `classer` etait juste : on ne
  // casse pas une garde correcte pour reparer ailleurs (ecarte nommement par `DG`).
  assert.equal(classer(null, []), null);
  assert.equal(classer(null, ['origin']), null, 'aucun troisieme etat `indetermine` dans classer');
});

// --- CB-3 : l'ordre de rendu est GARDE, pas promis (reserve `L-1`) --------------------------------

test('CB-3 (a) unitaire : `ordonner` place TOUS les `absente` avant TOUT `en-avance`', () => {
  // Le rang DOMINE le nombre de commits. Un `absente` a 1 commit passe devant un `en-avance` a 99 :
  // c'est le sens meme de la promesse « le plafond d'AFFICHAGE ne cache jamais le cas le plus grave ».
  const liste = [
    { projet: 'p', branche: 'av/1', commitsLocaux: 99, etat: 'en-avance', refsDistantes: ['origin'] },
    { projet: 'p', branche: 'abs/1', commitsLocaux: 1, etat: 'absente', refsDistantes: [] },
    { projet: 'p', branche: 'av/2', commitsLocaux: 50, etat: 'en-avance', refsDistantes: ['origin'] },
    { projet: 'p', branche: 'abs/2', commitsLocaux: 1, etat: 'absente', refsDistantes: [] },
  ];
  const etats = ordonner(liste).map((e) => e.etat);
  assert.deepEqual(etats, ['absente', 'absente', 'en-avance', 'en-avance']);
  assert.ok(etats.lastIndexOf('absente') < etats.indexOf('en-avance'),
    'AUCUN `en-avance` ne precede un `absente`, quel que soit le nombre de commits');
  // Determinisme complet : a etat et nombre de commits egaux, projet puis branche departagent.
  const egaux = [
    { projet: 'b', branche: 'z', commitsLocaux: 1, etat: 'absente' },
    { projet: 'a', branche: 'y', commitsLocaux: 1, etat: 'absente' },
  ];
  assert.deepEqual(ordonner(egaux).map((e) => e.projet), ['a', 'b'], 'ordre STABLE, pas au hasard');
});

// 🛑 UN RAPPORT FABRIQUE A LA MAIN NE SUFFIT PAS, ET C'EST MESURE. La garde du plafond du lot 2
// fabriquait son rapport (`faux(12)`) : le sabotage « plafond de comptage » est passe INAPERCU
// (voir le commentaire de `branches-locales.test.js:479`). Legolas a inverse le rang de `ordonner`
// et la suite est restee VERTE : 26 pass, 0 fail. Ce terrain-ci TRAVERSE `balayer` sur un depot
// REEL, avec des nombres de commits CHOISIS pour que l'inversion EJECTE les `absente` hors des dix
// lignes affichees. Sans cela, le temoin ne mordrait pas (`RB-3`).
//
// 12 branches signalees : 10 `en-avance` a 5 commits + 2 `absente` a 1 commit. Ordre correct =>
// les 2 `absente` occupent les 2 premieres des 10 lignes. Rang inverse => les 10 `en-avance`
// remplissent exactement le plafond et les 2 `absente` DISPARAISSENT de l'affichage.
function chapeauOrdre(prefix) {
  const t = terrain(prefix);
  const { depot } = depotAvecDistant(t, 'alpha');

  // 10 `en-avance` : meme pointe, 5 commits au-dessus de `main`...
  run(depot, ['checkout', '-q', '-b', 'av/0', 'main']);
  for (let i = 0; i < 5; i += 1) commit(depot, `avance ${i}`);
  for (let i = 1; i < 10; i += 1) run(depot, ['branch', `av/${i}`, 'av/0']);
  // ...et une ref distante posee A LA POSITION DE `main` : la copie existe, elle est en retard de 5.
  const refspecs = Array.from({ length: 10 }, (_, i) => `main:refs/heads/av/${i}`);
  run(depot, ['push', '-q', 'origin', ...refspecs]);

  // 2 `absente` : 1 seul commit, AUCUNE ref distante.
  for (let i = 0; i < 2; i += 1) {
    run(depot, ['checkout', '-q', '-b', `abs/${i}`, 'main']);
    commit(depot, `absente ${i}`);
  }
  return t;
}

test('🛑 CB-3 (b) de bout en bout : via `balayer` sur un depot REEL de 12 branches, les `absente` restent AFFICHES', () => {
  const t = chapeauOrdre('iaka-branches-cb3-');
  try {
    const r = balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile: motifsVides(t.base) });

    // Montage valide : sans cela le temoin ne prouverait rien.
    assert.equal(r.branchesSansCopieDistanteCount, 12, 'montage : 12 branches signalees');
    const parEtat = (e) => r.branchesSansCopieDistante.filter((x) => x.etat === e);
    assert.equal(parEtat('en-avance').length, 10, 'montage : 10 `en-avance`');
    assert.equal(parEtat('absente').length, 2, 'montage : 2 `absente`');
    assert.equal(parEtat('en-avance')[0].commitsLocaux, 5, 'montage : les `en-avance` ont PLUS de commits');
    assert.equal(parEtat('absente')[0].commitsLocaux, 1, 'montage : les `absente` en ont MOINS');
    assert.ok(parEtat('en-avance')[0].commitsLocaux > parEtat('absente')[0].commitsLocaux,
      'montage : sans cet ecart, l\'inversion du rang ne changerait rien et le temoin serait un decor');

    // LA garde : le plafond d'affichage ne cache PAS le cas le plus grave.
    const bloc = rendreBloc(r);
    const details = bloc.filter((l) => /\s(abs|av)\/\d+\s/.test(l));
    assert.equal(details.length, PLAFOND_AFFICHAGE, 'affichage borne a 10 lignes');
    assert.equal(details.filter((l) => /abs\/\d+/.test(l)).length, 2,
      'les 2 `absente` — la classe EXACTE de l\'incident — figurent dans les 10 lignes affichees');
    assert.match(details[0], /abs\/\d+/, 'et elles viennent EN TETE');
    assert.match(details[1], /abs\/\d+/);
    assert.match(bloc.join('\n'), /et 2 autres \(voir --json\)/, 'le reste est annonce, pas escamote');
  } finally { rm(t.base); }
});

// --- CB-4 : le chemin EXCEPTION de `DD-7` a son temoin (reserve `L-2`) ----------------------------

// 🪤 POURQUOI `--exclude-file <inexistant>`, ET RIEN D'AUTRE. `CA-11` du lot 2 croyait garder
// `DD-7` ; elle n'en gardait qu'UN des deux chemins. Mecanisme etabli par Legolas : restic etant
// installe au poste, `lancerSauvegarde` NE LEVE PAS, elle rend `code 10` — la garde emprunte donc
// `if (r.code !== 0)` (`commands/range.js:145`) et le `catch` (`:129`) n'a AUCUN temoin. Sur une
// machine SANS restic, la regression passerait MUETTE : precisement le contexte ou l'information
// compte.
//   Lu dans le code (`W9`) : `lancerSauvegarde` LEVE sur un fichier d'exclusion absent, et AVANT
// tout appel a restic (`lib/range.js:141-147` ; le `spawnSync` n'est qu'en `:152`). Ce levier atteint
// donc le chemin exception SUR TOUTE MACHINE, avec ou sans restic, et SANS JAMAIS risquer une
// ecriture.
//   ⛔ Neutraliser le `PATH` n'est PAS viable (`W11`) : `git` y disparaitrait aussi, tout deviendrait
// indetermine et le rapport n'aurait plus rien a porter.
test('🛑 CB-4 : le chemin EXCEPTION porte QUAND MEME le signalement (--exclude-file inexistant)', () => {
  const t = chapeauTrois('iaka-branches-cb4-');
  try {
    const env = envJetable(t.base);
    const absent = path.join(t.base, 'exclusions-qui-n-existent-pas.txt');
    assert.ok(!fs.existsSync(absent), 'montage : le fichier d\'exclusion est bien ABSENT');

    const r = spawnSync(process.execPath,
      [CLI, 'range', 'alpha', '--root', t.chapeau, '--exclude-file', absent, '--json'],
      { encoding: 'utf8', env });

    assert.equal(r.status, 1, 'sortie 1');
    const o = JSON.parse(r.stdout);
    assert.equal(o.ok, false);

    // 🛑 ASSERTION DISCRIMINANTE (`RB-4`) : elle prouve que c'est bien le chemin EXCEPTION qui a ete
    // emprunte, et non `if (r.code !== 0)`. Sans elle, la garde pourrait passer POUR LA MAUVAISE
    // RAISON — c'est-a-dire etre un decor. Le message doit matcher un des deux `throw` de
    // `lib/range.js`, et surtout PAS le message du chemin « restic a repondu ».
    assert.match(o.error, /fichier d'exclusion introuvable|restic est introuvable dans le PATH/,
      'le message vient d\'un `throw` de lib/range.js : c\'est le chemin EXCEPTION');
    assert.doesNotMatch(o.error, /restic a echoue \(code/,
      'si ce message apparaissait, la garde aurait emprunte `if (r.code !== 0)` et ne prouverait RIEN');

    // Le signalement voyage dans la charge d'ECHEC (`DD-7`), chemin exception compris.
    assert.ok(Array.isArray(o.branchesSansCopieDistante), 'la liste est la');
    assert.equal(o.branchesSansCopieDistanteCount, 1, 'son frere compteur aussi (regle 3 C-JSON)');
    assert.equal(o.branchesSansCopieDistante.length, o.branchesSansCopieDistanteCount);
    assert.ok(o.scanBranches && Array.isArray(o.scanBranches.limites), 'et scanBranches entier');
    assert.equal(o.scanBranches.branchesIndeterminees, 0,
      'le champ neuf de `DG` voyage lui aussi, sans avoir coute une ligne a range.js');

    // Zero ecriture : le `throw` precede tout `spawnSync` (`W9`).
    assert.ok(!fs.existsSync(env.IAKA_RANGE_REPOSITORY), 'AUCUN depot restic cree');
    assert.ok(!String(o.repository || '').startsWith('sftp:'), 'jamais le depot de production');
    assert.equal(r.stderr.trim(), '', 'rien d\'humain sur stderr en mode --json');
  } finally { rm(t.base); }
});

// --- CB-5 : la grammaire ne boite plus (`W12`) ----------------------------------------------------

test('CB-5 : l\'en-tete ACCORDE « depot(s) » — « sur 1 depot » au singulier, « depots » au-dela', () => {
  const t = chapeauTrois('iaka-branches-cb5-');
  try {
    const ignoreFile = motifsVides(t.base);

    // Perimetre CIBLE : UN seul depot balaye. C'est le cas ou l'en-tete ecrivait « 2 sur 1 depots ».
    const un = rendreBloc(balayer(perimetreProjet(t.chapeau, 'alpha'), { root: t.chapeau, ignoreFile }));
    assert.match(un[0], /sur 1 depot(?!s)/, 'singulier : « sur 1 depot »');

    // Perimetre `all` : 3 depots.
    const trois = rendreBloc(balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile }));
    assert.match(trois[0], /sur 3 depots/, 'pluriel des 2 depots et au-dela');

    // « depots scannes » suit la MEME regle, participe compris (constat fait en corrigeant).
    const rien = balayer(perimetreProjet(t.chapeau, 'pas-un-depot'), { root: t.chapeau, ignoreFile });
    assert.match(rendreBloc(rien)[0], /0 depots scannes/, 'zero prend le pluriel en francais');
    assert.match(ligneRappel(rien), /0 depots scannes/, 'la ligne de rappel accorde aussi');
  } finally { rm(t.base); }
});

test('🛑 CB-5 TEMOIN NEGATIF : une recherche de « 1 depots » dans la sortie rendue rend ZERO', () => {
  const t = chapeauTrois('iaka-branches-cb5n-');
  try {
    const ignoreFile = motifsVides(t.base);
    // Toutes les sorties du signalement, tous les cardinaux atteignables sur ce terrain.
    const rendus = [
      ...rendreBloc(balayer(perimetreProjet(t.chapeau, 'alpha'), { root: t.chapeau, ignoreFile })),
      ...rendreBloc(balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile })),
      ligneRappel(balayer(perimetreProjet(t.chapeau, 'alpha'), { root: t.chapeau, ignoreFile })),
      ligneRappel(balayer(perimetreAll(t.chapeau), { root: t.chapeau, ignoreFile })),
    ].join('\n');
    assert.doesNotMatch(rendus, /1 depots/, 'jamais « 1 depots »');
    assert.doesNotMatch(rendus, /1 depot scannes/, 'ni « 1 depot scannes » : le participe accorde aussi');
  } finally { rm(t.base); }
});

// --- CB-7 : le releve d'execution existe et il est HONNETE (`DI`, reserve `L-4`) -------------------

// 🛑 POURQUOI UNE GARDE SUR DU MARKDOWN. `L-4` : la tracabilite instruction <-> critere ne vivait que
// dans le message de remise, donc VOLATILE. La partie durable existait (les sorties rouges sont dans
// les corps de commits) mais DISPERSEE, et personne ne la retrouvait depuis l'instruction. Un tableau
// de 15 lignes coche a la chaine ne vaudrait rien non plus (`RB-7`) : cette garde interdit la case
// cochee SANS preuve nommee, et autorise explicitement le verdict `non tenu` — un critere non tenu et
// DIT vaut mieux qu'une case cochee par politesse.
const VERDICTS = ['vert', 'vert (dégradé)', 'non tenu', 'sans objet'];
const INSTRUCTIONS = path.join(RACINE, 'specs', 'instructions');

// Rend { cases: Map<id, boolean coche>, releve: Map<id, {verdict, preuve}> } pour un fichier.
function lireDossier(fichier, prefixe, attendus) {
  const txt = fs.readFileSync(path.join(INSTRUCTIONS, fichier), 'utf8');
  const cases = new Map();
  for (const m of txt.matchAll(/^- \[( |x)\] \*\*`(\w+-\d+)`/gm)) {
    if (m[2].startsWith(`${prefixe}-`)) cases.set(m[2], m[1] === 'x');
  }
  // Le releve est la DERNIERE section du fichier (`DI`) : on ne lit que ce qui suit son titre.
  const i = txt.lastIndexOf('## Relev');
  assert.ok(i > 0, `${fichier} : le releve d'execution est en DERNIERE section (DI)`);
  const releve = new Map();
  for (const m of txt.slice(i).matchAll(/^\|\s*`(\w+-\d+)`\s*\|([^|]*)\|([^|]*)\|/gm)) {
    releve.set(m[1], { verdict: m[2].trim(), preuve: m[3].trim() });
  }
  assert.deepEqual([...cases.keys()], attendus, `${fichier} : les ${attendus.length} criteres sont la`);
  assert.deepEqual([...releve.keys()], attendus, `${fichier} : une ligne de releve PAR critere`);
  return { cases, releve };
}

function verifierHonnetete(fichier, prefixe, attendus) {
  const { cases, releve } = lireDossier(fichier, prefixe, attendus);
  for (const id of attendus) {
    const { verdict, preuve } = releve.get(id);
    assert.ok(VERDICTS.includes(verdict),
      `${id} : verdict « ${verdict} » hors des quatre autorises (${VERDICTS.join(' / ')}) — « OK » n'en est pas un`);
    assert.ok(preuve.length > 0, `${id} : une ligne de releve SANS preuve nommee ne vaut rien (DI-2)`);
    assert.doesNotMatch(preuve, /^rapide$/i, `${id} : « rapide » n'est pas un chiffre (CA-9)`);
    // Une case cochee EXIGE un verdict tenu ; une case non cochee EXIGE un `non tenu` assume.
    if (cases.get(id)) {
      assert.notEqual(verdict, 'non tenu', `${id} : case cochee alors que le verdict est « non tenu »`);
    } else {
      assert.equal(verdict, 'non tenu',
        `${id} : case NON cochee — le seul verdict honnete est « non tenu » assume, pas un blanc`);
    }
  }
}

test('🛑 CB-7 : le releve d\'execution du LOT 2 existe, 15 lignes, verdicts et preuves nommees', () => {
  verifierHonnetete('signalement-branches-sans-copie-distante.md', 'CA',
    Array.from({ length: 15 }, (_, i) => `CA-${i + 1}`));
});

test('🛑 CB-7 : le releve d\'execution de CE LOT existe, 8 lignes, memes regles', () => {
  // `DI-1` : appendu, jamais substitue. La garde ne verifie pas le corps de l'instruction — l'ecart
  // entre le cadrage et l'execution EST une information, on ne le maquille pas.
  verifierHonnetete('temoins-manquants-signalement-branches.md', 'CB',
    Array.from({ length: 8 }, (_, i) => `CB-${i + 1}`));
});
