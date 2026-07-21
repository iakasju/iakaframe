// Recette du LOT A - canon PROJET (connaissance incrementale du produit).
// Reference : specs/instructions/canon-projet-connaissance-produit.md § 6.3 (criteres 1 a 16).
// Chaque test cite SON critere. Aucun test ne touche le vrai ~/.iaka/ ni un vrai projet : tout se
// joue dans des tmpdir jetables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  projectCanonHome, ensureProjectCanon, projectCanonExists, produitPath,
  produitAdd, produitReplace, produitRemove, produitList,
  loadProjectConfig, produitCap, defaultProjectConfig, loadProjectCanon, renderProjectCanon,
} from '../src/lib/projectCanon.js';
import {
  sessionPath, readMarker, openProjectSession, closeProjectSession, hasPendingSession,
  projectAnalyzer, closeProjectCanon,
} from '../src/lib/projectSession.js';
import { runProjectCadence, formatProjectCadence } from '../src/lib/cadence.js';
import { defaultConfig } from '../src/lib/memory.js';
import { classify, listProposals, applyProposal, autoApply, STATUS } from '../src/lib/review.js';
import { loadCanon, renderCanon } from '../src/lib/open.js';
import { doSnapshot } from '../src/commands/snapshot.js';

function tmp(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

// Projet jetable. `withCanon` : pose specs/canon/PRODUIT.md (opt-in explicite, comme en vrai).
function makeProject({ withCanon = true, withProjetMd = false } = {}) {
  const root = tmp('iaka-proj-');
  fs.mkdirSync(path.join(root, 'specs'), { recursive: true });
  if (withProjetMd) fs.writeFileSync(path.join(root, 'specs', 'PROJET.md'), '# PROJET\n', 'utf8');
  const home = projectCanonHome(root);
  if (withCanon) ensureProjectCanon(home);
  return { root, home };
}

// Canon GLOBAL jetable (marqueur + transcripts + reservoir). JAMAIS le vrai ~/.iaka/.
function makeMemoryHome(transcript) {
  const home = tmp('iaka-mem-');
  fs.mkdirSync(path.join(home, 'transcripts'), { recursive: true });
  if (transcript) fs.writeFileSync(path.join(home, 'transcripts', 's1.md'), transcript, 'utf8');
  return home;
}

// --- Critere 1 : resolution du chemin, aucun chemin en dur, independante de PROJET.md -------------
test('C-1 : projectCanonHome resout <projet>/specs/canon/ ; aucun chemin en dur', () => {
  const a = tmp('iaka-a-');
  const b = tmp('iaka-b-');
  assert.equal(projectCanonHome(a), path.join(a, 'specs', 'canon'));
  assert.equal(projectCanonHome(b), path.join(b, 'specs', 'canon'));
  assert.notEqual(projectCanonHome(a), projectCanonHome(b)); // derive du projet, pas d'un constant
  assert.throws(() => projectCanonHome(''), /projectPath requis/);
});

test('C-1 : fonctionne sur un projet SANS specs/PROJET.md (cas mesure d\'iakaframe, § 3.2)', () => {
  const { root, home } = makeProject({ withCanon: false, withProjetMd: false });
  assert.equal(fs.existsSync(path.join(root, 'specs', 'PROJET.md')), false);
  ensureProjectCanon(home);
  const r = produitAdd(home, 'le front tient en React 18');
  assert.equal(r.ok, true);
  assert.deepEqual(produitList(home), ['le front tient en React 18']);
});

// --- Critere 2 : layout MINIMAL, idempotent, n'ecrase jamais --------------------------------------
test('C-2 : ensureProjectCanon cree PRODUIT.md ET RIEN D\'AUTRE (ni transcripts/, ni proposals/, ni PROFIL/REGISTRE)', () => {
  const { home } = makeProject({ withCanon: false });
  ensureProjectCanon(home);
  assert.equal(fs.existsSync(produitPath(home)), true);
  assert.deepEqual(fs.readdirSync(home).sort(), ['PRODUIT.md']);
  for (const forbidden of ['transcripts', 'proposals', 'PROFIL.md', 'REGISTRE.md', 'config.yaml']) {
    assert.equal(fs.existsSync(path.join(home, forbidden)), false, `${forbidden} ne doit PAS etre cree`);
  }
});

test('C-2 : ensureProjectCanon est idempotent et N\'ECRASE JAMAIS un fichier existant', () => {
  const { home } = makeProject({ withCanon: false });
  ensureProjectCanon(home);
  produitAdd(home, 'entree precieuse a ne pas perdre');
  const before = fs.readFileSync(produitPath(home), 'utf8');
  const created = ensureProjectCanon(home);
  assert.deepEqual(created, []); // rien de neuf
  assert.equal(fs.readFileSync(produitPath(home), 'utf8'), before);
  assert.deepEqual(produitList(home), ['entree precieuse a ne pas perdre']);
});

// --- Critere 3 : idempotence, appariement sur le CONTENU (date ignoree) ---------------------------
test('C-3 : add/remove idempotents et keyes sur le CONTENU (prefixe date ignore a l\'appariement)', () => {
  const { home } = makeProject();
  const r1 = produitAdd(home, 'le cache Redis est mutualise');
  const r2 = produitAdd(home, 'le cache Redis est mutualise');
  assert.equal(r1.changed, true);
  assert.equal(r2.changed, false, 'un ajout repete est un no-op');
  assert.equal(produitList(home).length, 1);

  // Entree datee d'hier : l'appariement doit la retrouver malgre la date differente.
  const raw = fs.readFileSync(produitPath(home), 'utf8').replace(/- \d{4}-\d{2}-\d{2} —/, '- 1999-01-01 —');
  fs.writeFileSync(produitPath(home), raw, 'utf8');
  const r3 = produitAdd(home, 'le cache Redis est mutualise');
  assert.equal(r3.changed, false, 'apparie sur le contenu, pas sur la date');

  const r4 = produitRemove(home, 'le cache Redis est mutualise');
  assert.equal(r4.changed, true);
  const r5 = produitRemove(home, 'le cache Redis est mutualise');
  assert.equal(r5.changed, false, 'remove idempotent : no-op si absente');
  assert.deepEqual(produitList(home), []);
});

// --- Critere 4 : LA PROMESSE DU LOT — revision EN PLACE, pas une main courante --------------------
test('C-4 : produitReplace REVISE EN PLACE — la formulation anterieure N\'EST PLUS dans le fichier', () => {
  const { home } = makeProject();
  produitAdd(home, 'le front est en React 19');
  assert.match(fs.readFileSync(produitPath(home), 'utf8'), /React 19/);

  const r = produitReplace(home, 'le front est en React 19',
    'le front est en React 18, pas 19 : le passage a ete tente puis annule');
  assert.equal(r.ok, true);
  assert.equal(r.changed, true);

  const text = fs.readFileSync(produitPath(home), 'utf8');
  // LA difference testable d'avec une main courante : l'ancienne formulation a DISPARU.
  assert.equal(/le front est en React 19$/m.test(text), false,
    'une main courante aurait garde les deux formulations : le canon REVISE');
  assert.match(text, /React 18, pas 19/);
  assert.equal(produitList(home).length, 1, 'une revision ne fabrique pas une seconde entree');
});

test('C-4 : produitReplace RE-DATE la ligne revisee', () => {
  const { home } = makeProject();
  produitAdd(home, 'ancien constat', { now: new Date('2020-01-02T10:00:00Z') });
  assert.match(fs.readFileSync(produitPath(home), 'utf8'), /- 2020-01-02 — ancien constat/);
  produitReplace(home, 'ancien constat', 'constat revise', { now: new Date('2026-07-21T10:00:00Z') });
  const text = fs.readFileSync(produitPath(home), 'utf8');
  assert.match(text, /- 2026-07-21 — constat revise/);
  assert.equal(/2020-01-02/.test(text), false, 'la date de la revision remplace celle de l\'origine');
});

test('C-4 : un replace sur une entree ABSENTE echoue — jamais transforme en add silencieux', () => {
  const { home } = makeProject();
  const r = produitReplace(home, 'jamais ecrit', 'nouveau');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'not-found');
  assert.deepEqual(produitList(home), [], 'rien n\'a ete ajoute par effet de bord');
});

// --- Critere 5 : plafond DUR, et JAMAIS undefined (le piege evalCap de memory.js:145) -------------
test('C-5 : plafond DUR — une croissance au-dela du plafond est REFUSEE (cap-exceeded)', () => {
  const { home } = makeProject();
  const cfg = { caps: { produit: 400 }, consolidation_threshold: 0.8 };
  let refused = null;
  for (let i = 0; i < 200 && !refused; i++) {
    const r = produitAdd(home, `constat numero ${i} sur le produit, avec assez de texte pour peser`, { config: cfg });
    if (!r.ok) refused = r;
  }
  assert.ok(refused, 'le plafond doit finir par refuser');
  assert.equal(refused.reason, 'cap-exceeded');
  assert.equal(refused.changed, false);
  assert.equal(refused.consolidationNeeded, true);
  assert.equal(refused.cap, 400);
  assert.ok(fs.readFileSync(produitPath(home), 'utf8').length <= 400 + 200,
    'le fichier n\'a pas ete ecrit au-dela du refus');
});

test('C-5 : le plafond n\'est JAMAIS undefined — config absente, vide, corrompue ou aberrante', () => {
  const { home } = makeProject();
  // Config absente -> defaut.
  assert.equal(produitCap(loadProjectConfig(home)), defaultProjectConfig().caps.produit);
  // Config presente mais SANS caps.produit -> defaut (et non undefined : c'est le piege de memory.js).
  fs.writeFileSync(path.join(home, 'config.yaml'), 'consolidation_threshold: 0.5\n', 'utf8');
  const cfg = loadProjectConfig(home);
  assert.equal(Number.isFinite(produitCap(cfg)), true);
  assert.equal(produitCap(cfg), defaultProjectConfig().caps.produit);
  // Valeurs aberrantes -> defaut, jamais undefined/NaN/0.
  for (const bad of [undefined, null, 0, -10, NaN, 'abc', {}]) {
    const c = produitCap({ caps: { produit: bad } });
    assert.equal(Number.isFinite(c) && c > 0, true, `cap aberrant (${String(bad)}) doit retomber sur le defaut`);
  }
  // Config illisible -> defauts, sans lever.
  fs.writeFileSync(path.join(home, 'config.yaml'), '   pas du yaml', 'utf8');
  assert.equal(Number.isFinite(produitCap(loadProjectConfig(home))), true);
});

test('C-5 : le plafond LU DEPUIS LA CONFIG est bien celui applique', () => {
  const { home } = makeProject();
  fs.writeFileSync(path.join(home, 'config.yaml'), 'caps:\n  produit: 250\n', 'utf8');
  assert.equal(produitCap(loadProjectConfig(home)), 250);
  let refused = null;
  for (let i = 0; i < 200 && !refused; i++) {
    const r = produitAdd(home, `entree ${i} suffisamment longue pour remplir le plafond configure`);
    if (!r.ok) refused = r;
  }
  assert.equal(refused.cap, 250, 'le plafond applique est celui de la config, pas le defaut');
});

// --- Criteres 6/7/8/9 : cadence, rattrapage, et l'invariant close_on ------------------------------
const TRANSCRIPT = [
  '# session',
  '@produit stack-front :: le front est en React 18, pas 19 (react-grid-layout incompatible)',
  '@produit-revise le cache est local :: le cache est mutualise entre les deux services',
].join('\n');

test('C-9 : cadence.close_on reste ["pause","version"] et N\'ACCUEILLE JAMAIS "reprise"', () => {
  const closeOn = defaultConfig().cadence.close_on;
  assert.deepEqual(closeOn, ['pause', 'version']);
  assert.equal(closeOn.includes('reprise'), false,
    '« capturer a la reprise » (absurde) ne doit jamais entrer dans close_on ; le rattrapage est un geste DISTINCT');
});

test('C-6 : pause|version -> la cloture traite le canon projet ; le marqueur passe a pending:false', () => {
  for (const reason of ['pause', 'version']) {
    const { root } = makeProject();
    const mem = makeMemoryHome(TRANSCRIPT);
    openProjectSession(mem, root); // une session est ouverte
    assert.equal(hasPendingSession(mem, root), true);

    const res = runProjectCadence({ projectPath: root, reason, home: mem });
    assert.equal(res.triggered, true, `${reason} doit declencher`);
    assert.equal(res.ok, true);
    assert.equal(res.mode, 'cloture');
    assert.ok(res.report.emitted.length > 0, 'des propositions produit sont deposees');

    const m = readMarker(mem, root);
    assert.equal(m.pending, false, 'la dette est soldee');
    assert.ok(m.lastCloseAt, 'lastCloseAt est renseigne');
    assert.equal(m.lastCloseReason, reason);
  }
});

test('C-7 : reprise AVEC marqueur pendant -> RATTRAPAGE execute, journalise, pending remis a false', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  openProjectSession(mem, root, { now: new Date('2026-07-20T18:00:00Z') });
  // La session se ferme SANS rituel : le marqueur reste pendant.
  assert.equal(hasPendingSession(mem, root), true);

  const res = runProjectCadence({ projectPath: root, reason: 'reprise', home: mem });
  assert.equal(res.triggered, true, 'le rattrapage s\'execute a la reprise');
  assert.equal(res.ok, true);
  assert.equal(res.mode, 'rattrapage');
  assert.equal(res.openedAt, '2026-07-20T18:00:00.000Z');
  assert.match(formatProjectCadence(res),
    /rattrapage : clôture différée exécutée \(session ouverte le 2026-07-20T18:00:00\.000Z\)/);
  assert.equal(readMarker(mem, root).pending, false, 'la dette est soldee apres rattrapage');
});

test('C-8 : reprise SANS marqueur pendant -> AUCUN effet : pas d\'ecriture du canon, pas de proposition', () => {
  const { root, home } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  const canonBefore = fs.readFileSync(produitPath(home), 'utf8');

  const res = runProjectCadence({ projectPath: root, reason: 'reprise', home: mem });

  assert.equal(res.triggered, false);
  assert.equal(res.skipped, 'aucune-dette');
  assert.equal(fs.readFileSync(produitPath(home), 'utf8'), canonBefore, 'le canon est INTACT');
  assert.deepEqual(listProposals(mem), [], 'AUCUNE proposition n\'est deposee');
  assert.equal(fs.existsSync(path.join(mem, 'proposals')), false, 'meme pas de reservoir cree');
});

test('C-8 : reprise apres une cloture normale (pending:false) -> toujours aucun rattrapage', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  openProjectSession(mem, root);
  runProjectCadence({ projectPath: root, reason: 'pause', home: mem }); // solde la dette
  const res = runProjectCadence({ projectPath: root, reason: 'reprise', home: mem });
  assert.equal(res.triggered, false);
  assert.equal(res.skipped, 'aucune-dette', 'une dette deja soldee ne se rejoue pas');
});

test('C-14 : N sessions enchainees sans rituel -> UN SEUL rattrapage couvrant toute la periode', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  // Trois sessions ouvertes d'affilee, aucune close.
  openProjectSession(mem, root, { now: new Date('2026-07-18T09:00:00Z') });
  openProjectSession(mem, root, { now: new Date('2026-07-19T09:00:00Z') });
  openProjectSession(mem, root, { now: new Date('2026-07-20T09:00:00Z') });

  // Le marqueur ne s'empile pas : un seul fichier, openedAt ECRASE, pending toujours true.
  assert.equal(fs.readdirSync(path.join(mem, 'sessions')).length, 1, 'UN SEUL marqueur, UNE SEULE dette');
  const m = readMarker(mem, root);
  assert.equal(m.openedAt, '2026-07-20T09:00:00.000Z', 'openedAt est ecrase, pas empile');
  assert.equal(m.pending, true);

  const res = runProjectCadence({ projectPath: root, reason: 'reprise', home: mem });
  assert.equal(res.mode, 'rattrapage');
  const emitted = res.report.emitted.length;
  assert.ok(emitted > 0);

  // Un second rattrapage ne redouble pas les propositions (dedup par pendingExists).
  openProjectSession(mem, root);
  const res2 = runProjectCadence({ projectPath: root, reason: 'reprise', home: mem });
  assert.equal(res2.report.emitted.length, 0, 'aucune proposition redondante sur le meme corpus');
  assert.equal(res2.report.skipped.length, emitted, 'elles sont sautees comme deja-en-attente');
});

// --- Critere 10 : superposition — le canon global reste TOUJOURS rendu ----------------------------
test('C-10 : en presence d\'un canon projet, le canon GLOBAL est TOUJOURS rendu (superposition, pas silo)', () => {
  const { root, home } = makeProject();
  const mem = makeMemoryHome();
  fs.writeFileSync(path.join(mem, 'PROFIL.md'), '# PROFIL\n\n- 2026-01-01 — Stephane tranche vite\n', 'utf8');
  fs.writeFileSync(path.join(mem, 'REGISTRE.md'), '# REGISTRE\n\n- 2026-01-01 — MVP d\'abord\n', 'utf8');
  produitAdd(home, 'le front est en React 18');

  const canon = loadCanon(mem, { projectPath: root });
  const text = renderCanon(canon);

  assert.match(text, /Stephane tranche vite/, 'le PROFIL global reste charge');
  assert.match(text, /MVP d'abord/, 'le REGISTRE global reste charge');
  assert.match(text, /le front est en React 18/, 'le canon projet S\'AJOUTE');
  assert.ok(text.indexOf('Stephane tranche vite') < text.indexOf('React 18'),
    'le canon projet vient APRES le global, jamais a sa place');
});

test('C-10 : sans --project, le rendu est INCHANGE (aucune regression du geste existant)', () => {
  const mem = makeMemoryHome();
  fs.writeFileSync(path.join(mem, 'PROFIL.md'), '# PROFIL\n\n- 2026-01-01 — un trait\n', 'utf8');
  const canon = loadCanon(mem);
  assert.equal(canon.projet, null);
  assert.equal(/PRODUIT/.test(renderCanon(canon)), false);
});

// --- Criteres 11/12/13 : degradation gracieuse ----------------------------------------------------
test('C-11 : projet SANS canon -> cloture SAUTEE gracieusement, sans creer le canon par effet de bord', () => {
  const { root, home } = makeProject({ withCanon: false });
  const mem = makeMemoryHome(TRANSCRIPT);
  openProjectSession(mem, root);

  const res = runProjectCadence({ projectPath: root, reason: 'pause', home: mem });
  assert.equal(res.triggered, false);
  assert.equal(res.skipped, 'canon-projet-absent');
  assert.equal(fs.existsSync(home), false, 'specs/canon/ ne doit PAS apparaitre a chaque pause');
  assert.equal(projectCanonExists(home), false);
});

test('C-12 : specs/ non inscriptible -> incident JOURNALISE, rituel REUSSI, aucune exception', () => {
  const { root, home } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  openProjectSession(mem, root);
  // closeFn qui explose : simule un depot en lecture seule / une E/S impossible.
  const res = runProjectCadence({
    projectPath: root, reason: 'pause', home: mem,
    closeFn: () => { throw new Error('EROFS: read-only file system'); },
  });
  assert.equal(res.triggered, true);
  assert.equal(res.ok, false, 'l\'echec est RAVALE dans le rapport');
  assert.match(res.error, /EROFS/);
  assert.match(formatProjectCadence(res), /non bloquant/);
  // La dette n'est PAS soldee : elle sera retentee. On ne perd jamais une dette en silence.
  assert.equal(hasPendingSession(mem, root), true);
  assert.ok(home);
});

test('C-12 : un canon global irresolvable (~/.claude/) ne casse pas le rituel', () => {
  const { root } = makeProject();
  const res = runProjectCadence({
    projectPath: root, reason: 'pause', home: path.join(os.homedir(), '.claude', 'memory'),
  });
  assert.equal(res.triggered, false);
  assert.equal(res.skipped, 'home-error');
  assert.match(formatProjectCadence(res), /non bloquant/);
});

test('C-13 : marqueur ILLISIBLE ou CORROMPU -> traite comme ABSENT, aucun crash', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  fs.mkdirSync(path.join(mem, 'sessions'), { recursive: true });
  for (const junk of ['{ pas du json', '', 'null', '[]', '"chaine"']) {
    fs.writeFileSync(sessionPath(mem, root), junk, 'utf8');
    assert.doesNotThrow(() => readMarker(mem, root));
    assert.equal(hasPendingSession(mem, root), false, `marqueur corrompu (${junk}) = pas de dette`);
    const res = runProjectCadence({ projectPath: root, reason: 'reprise', home: mem });
    assert.equal(res.skipped, 'aucune-dette');
  }
});

// --- Critere 15 : plafonds INDEPENDANTS -----------------------------------------------------------
test('C-15 : le canon projet est plafonne INDEPENDAMMENT du global ; saturer l\'un n\'affecte pas l\'autre', () => {
  const { home } = makeProject();
  const cfgGlobal = defaultConfig();
  const cfgProjet = loadProjectConfig(home);
  assert.notEqual(produitCap(cfgProjet), cfgGlobal.caps.profil);
  // Saturer le canon projet ne change aucun plafond global.
  const small = { caps: { produit: 300 }, consolidation_threshold: 0.8 };
  let refused = null;
  for (let i = 0; i < 200 && !refused; i++) {
    const r = produitAdd(home, `remplissage ${i} du canon produit pour atteindre le plafond`, { config: small });
    if (!r.ok) refused = r;
  }
  assert.equal(refused.reason, 'cap-exceeded');
  assert.deepEqual(defaultConfig().caps, cfgGlobal.caps, 'les plafonds globaux sont intacts');
});

// --- Critere 16 : AUCUNE ecriture hors <projet>/specs/canon/ --------------------------------------
test('C-16 : PROJET.md et etat-des-lieux.md sont INCHANGES par le canon projet', () => {
  const { root, home } = makeProject({ withProjetMd: true });
  const mem = makeMemoryHome(TRANSCRIPT);
  const projetMd = path.join(root, 'specs', 'PROJET.md');
  const etat = path.join(root, 'specs', 'etat-des-lieux.md');
  fs.writeFileSync(etat, '# Etat des lieux\n', 'utf8');
  const projetBefore = fs.readFileSync(projetMd, 'utf8');
  const etatBefore = fs.readFileSync(etat, 'utf8');

  openProjectSession(mem, root);
  runProjectCadence({ projectPath: root, reason: 'pause', home: mem });
  produitAdd(home, 'un constat de terrain');
  produitReplace(home, 'un constat de terrain', 'un constat revise');
  produitRemove(home, 'un constat revise');

  assert.equal(fs.readFileSync(projetMd, 'utf8'), projetBefore, 'le canon ne reecrit JAMAIS PROJET.md');
  assert.equal(fs.readFileSync(etat, 'utf8'), etatBefore, 'ni etat-des-lieux.md');
});

test('C-16 : la cloture n\'ecrit RIEN dans le projet — le canon reste intact tant que la revue n\'a pas eu lieu', () => {
  const { root, home } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  const before = fs.readFileSync(produitPath(home), 'utf8');
  openProjectSession(mem, root);
  const res = runProjectCadence({ projectPath: root, reason: 'pause', home: mem });
  assert.ok(res.report.emitted.length > 0, 'des propositions sont deposees...');
  assert.equal(fs.readFileSync(produitPath(home), 'utf8'), before,
    '...mais le canon VERSIONNE n\'a pas bouge : rien n\'atteint le depot sans le decideur');
  // Les propositions vivent dans le reservoir GLOBAL, jamais dans le projet.
  assert.equal(fs.existsSync(path.join(home, 'proposals')), false);
  assert.deepEqual(fs.readdirSync(home).sort(), ['PRODUIT.md']);
});

test('C-16 : le marqueur est LOCAL et NON VERSIONNE — rien de machine n\'entre dans le depot', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome();
  openProjectSession(mem, root);
  assert.match(sessionPath(mem, root), new RegExp(`^${mem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    'le marqueur vit sous le canon global local');
  assert.equal(fs.existsSync(path.join(root, 'specs', 'canon', '.session.json')), false);
  assert.equal(fs.readdirSync(projectCanonHome(root)).includes('.session.json'), false);
});

// --- Marqueur : cle de projet ---------------------------------------------------------------------
test('marqueur : la cle est HACHEE sur le chemin absolu, jamais le nom nu (deux « iakaHub » coexistent)', () => {
  const mem = makeMemoryHome();
  const a = path.join(tmp('iaka-x-'), 'projects', 'iakaHub');
  const b = path.join(tmp('iaka-y-'), 'work', 'iakaHub');
  fs.mkdirSync(a, { recursive: true });
  fs.mkdirSync(b, { recursive: true });
  assert.notEqual(sessionPath(mem, a), sessionPath(mem, b),
    'deux projets homonymes sur deux chemins ne doivent PAS partager un marqueur');
  openProjectSession(mem, a);
  assert.equal(hasPendingSession(mem, a), true);
  assert.equal(hasPendingSession(mem, b), false, 'la dette de l\'un n\'est pas celle de l\'autre');
});

test('marqueur : closeProjectSession preserve openedAt et renseigne lastCloseAt/Reason', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome();
  openProjectSession(mem, root, { now: new Date('2026-07-20T08:00:00Z') });
  closeProjectSession(mem, root, 'pause', { now: new Date('2026-07-20T19:00:00Z') });
  const m = readMarker(mem, root);
  assert.equal(m.openedAt, '2026-07-20T08:00:00.000Z');
  assert.equal(m.lastCloseAt, '2026-07-20T19:00:00.000Z');
  assert.equal(m.lastCloseReason, 'pause');
  assert.equal(m.pending, false);
  assert.equal(m.projectPath, path.resolve(root));
});

// --- Analyseur : DETERMINISTE, zero heuristique de langage ----------------------------------------
test('analyseur : ZERO heuristique de langage — « non code », « non planifie », « plutot » n\'emettent RIEN', () => {
  // Non-regression du defaut CONSTATE le 17/07 (CORRECTION_CUES trop laxiste : /\bnon[\s,]/ matche
  // « non code »). Ces tournures ne doivent produire AUCUNE proposition produit.
  const entries = [
    'ce module est non code pour l\'instant', 'non planifie sur ce sprint',
    'ce n\'est pas ce que je voulais', 'plutot en React', 'corrige ca',
    'non, pas comme ca', 'je te l\'ai deja dit', 'toujours pas bon',
  ].map((text, i) => ({ rel: 's.md', line: i + 1, text }));

  const { adds, revisions } = projectAnalyzer(entries);
  assert.equal(adds.size, 0, 'aucun ajout infere du francais');
  assert.equal(revisions.size, 0, 'aucune revision inferee du francais');
});

test('analyseur : seuls les signaux EXPLICITES sont captes (@produit / @produit-revise)', () => {
  const entries = [
    { rel: 's.md', line: 1, text: '@produit stack :: le front est en React 18' },
    { rel: 's.md', line: 2, text: '@produit-revise le cache est local :: le cache est mutualise' },
    { rel: 's.md', line: 3, text: 'du texte libre sans signal, meme tres affirmatif' },
  ];
  const { adds, revisions } = projectAnalyzer(entries);
  assert.equal(adds.size, 1);
  assert.equal(revisions.size, 1);
  assert.equal([...adds.values()][0].label, 'le front est en React 18');
  const rev = [...revisions.values()][0];
  assert.equal(rev.oldContent, 'le cache est local');
  assert.equal(rev.label, 'le cache est mutualise');
});

test('analyseur : @produit-revise n\'est PAS capte comme un simple @produit (ordre des motifs)', () => {
  const entries = [{ rel: 's.md', line: 1, text: '@produit-revise ancien :: nouveau' }];
  const { adds, revisions } = projectAnalyzer(entries);
  assert.equal(adds.size, 0, 'une revision ne doit pas degenerer en ajout : ce serait perdre la promesse du lot');
  assert.equal(revisions.size, 1);
});

// --- Garde de consentement (AR-4) : PLUS STRICTE que celle du canon global ------------------------
test('AR-4 : la cible `produit` est TOUJOURS en file — write_approval:auto ne la rend PAS automatique', () => {
  for (const write_approval of ['auto', 'queue']) {
    const c = classify('memory', 'produit', { write_approval });
    assert.equal(c.auto, false, `produit ne doit JAMAIS etre auto (write_approval=${write_approval})`);
    assert.equal(c.reason, 'produit-toujours-en-file');
  }
  // Contraste : le REGISTRE global, lui, reste auto-applicable — la difference est materielle
  // (fichier local vs fichier versionne et POUSSE).
  assert.equal(classify('memory', 'registre', { write_approval: 'auto' }).auto, true);
});

test('AR-4 : autoApply ne materialise JAMAIS une proposition produit (le canon versionne reste intact)', () => {
  const { root, home } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  closeProjectCanon(mem, root);
  const before = fs.readFileSync(produitPath(home), 'utf8');

  const res = autoApply(mem, { config: { write_approval: 'auto' } });
  assert.deepEqual(res.applied, [], 'aucune proposition produit auto-appliquee');
  assert.ok(res.kept.length > 0);
  for (const k of res.kept) assert.equal(k.reason, 'produit-toujours-en-file');
  assert.equal(fs.readFileSync(produitPath(home), 'utf8'), before,
    'une entree auto-ecrite ici serait PUBLIEE : elle ne doit pas exister');
});

// --- Boucle complete : transcript -> proposition -> revue humaine -> revision EN PLACE ------------
test('bout en bout : le geste humain de revue applique la REVISION EN PLACE dans le bon depot', () => {
  const { root, home } = makeProject();
  produitAdd(home, 'le cache est local');
  const mem = makeMemoryHome('@produit-revise le cache est local :: le cache est mutualise entre les deux services');

  const rep = closeProjectCanon(mem, root);
  assert.equal(rep.emitted.length, 1);
  assert.equal(rep.emitted[0].op, 'replace');
  assert.equal(rep.emitted[0].target, 'produit');

  const [p] = listProposals(mem, { status: STATUS.PENDING });
  assert.equal(p.target, 'produit');

  const applied = applyProposal(mem, p.id);
  assert.equal(applied.ok, true);
  assert.equal(applied.materialize.kind, 'produit');
  assert.equal(applied.materialize.projectPath, path.resolve(root));

  const text = fs.readFileSync(produitPath(home), 'utf8');
  assert.match(text, /le cache est mutualise entre les deux services/);
  assert.equal(/le cache est local$/m.test(text), false, 'REVISION EN PLACE : l\'ancienne formulation a disparu');
  assert.equal(produitList(home).length, 1);
});

test('bout en bout : une proposition produit sans projectPath REFUSE d\'ecrire (jamais de depot devine)', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome('@produit stack :: le front est en React 18');
  closeProjectCanon(mem, root);
  const [p] = listProposals(mem, { status: STATUS.PENDING });
  // On ampute l'artefact de son projectPath.
  const jsonPath = path.join(p.dir, 'artifact', 'memory.json');
  const spec = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  delete spec.projectPath;
  fs.writeFileSync(jsonPath, JSON.stringify(spec), 'utf8');

  const r = applyProposal(mem, p.id);
  assert.equal(r.ok, false);
  assert.equal(r.materialize.reason, 'artefact-produit-sans-projet');
  assert.equal(listProposals(mem)[0].status, STATUS.PENDING, 'la proposition reste en attente : rien n\'est perdu');
});

// --- Greffe sur le rituel d'etat des lieux --------------------------------------------------------
test('greffe : doSnapshot rend un rapport projectCadence et le rituel reussit malgre un echec de cadence', () => {
  const { root } = makeProject();
  const mem = makeMemoryHome(TRANSCRIPT);
  openProjectSession(mem, root);

  const r = doSnapshot({ projectPath: root, reason: 'pause', home: mem });
  assert.ok(r.projectCadence, 'le rapport porte la cadence du canon projet');
  assert.equal(r.projectCadence.triggered, true);
  assert.equal(fs.existsSync(path.join(root, 'specs', 'etat-des-lieux.md')), true);

  // Une cadence projet qui explose ne casse PAS le rituel (double filet, cadence.js:8).
  const r2 = doSnapshot({
    projectPath: root, reason: 'pause', home: mem,
    projectCadenceRun: () => { throw new Error('boom'); },
  });
  assert.equal(r2.projectCadence.skipped, 'guarded');
  assert.equal(fs.existsSync(path.join(root, 'specs', 'etat-des-lieux.md')), true, 'l\'etat des lieux est ecrit');
});

test('greffe : sur un projet SANS canon, le rituel est inchange et ne cree aucun specs/canon/', () => {
  const { root, home } = makeProject({ withCanon: false });
  const mem = makeMemoryHome(TRANSCRIPT);
  const r = doSnapshot({ projectPath: root, reason: 'pause', home: mem });
  assert.equal(r.projectCadence.skipped, 'canon-projet-absent');
  assert.equal(fs.existsSync(home), false);
});

// --- Rendu ----------------------------------------------------------------------------------------
test('rendu : renderProjectCanon est vide si le canon n\'existe pas (aucun bruit)', () => {
  const { root } = makeProject({ withCanon: false });
  assert.equal(renderProjectCanon(loadProjectCanon(root)), '');
  assert.equal(renderProjectCanon(null), '');
});

test('rendu : loadProjectCanon est en LECTURE SEULE — ne cree jamais le canon', () => {
  const { root, home } = makeProject({ withCanon: false });
  const c = loadProjectCanon(root);
  assert.equal(c.exists, false);
  assert.equal(c.empty, true);
  assert.equal(Number.isFinite(c.cap), true);
  assert.equal(fs.existsSync(home), false, 'un chargement ne cree rien');
});
