// Starter set d'Odin (CTO) — couverture des gestes CLI ajoutes :
//  - `observe` (Lot C) : ecriture SILENCIEUSE (sans prompt), idempotente, dans un store DISTINCT
//    du canon review-gate (~/.iaka/memory/) et HORS de tout reservoir proposals/.
//  - `portfolio` (Lot B) : scan agrege LECTURE SEULE, AUCUN effet de bord sur la fixture.
//  - primitive puce-datee factorisee : `memory` reste NON regresse (partage lib/bullet.js).
// Aucun test ne touche le vrai ~/.iaka/ ni ~/.claude/ : tout passe par des tmpdir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resolveObservationHome, observe, observeList, projectPath, portfolioPath,
} from '../src/lib/observation.js';
import { scanPortfolio } from '../src/commands/portfolio.js';
import { defaultMemoryHome } from '../src/lib/memory.js';
import { memoryAdd, memoryList, statePath } from '../src/lib/memory.js';
import { appendBullet, entryContent } from '../src/lib/bullet.js';

const mktmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-obs-'));
const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

// --- FE2 / observe : ecriture silencieuse, idempotente, store distinct -----------------------------

test('observe --project ecrit une puce datee SANS prompt (idempotent au re-run)', () => {
  const home = mktmp();
  try {
    const r1 = observe(home, { project: 'alpha' }, 'alpha vise le self-hosted');
    assert.equal(r1.changed, true, 'premier ajout ecrit');
    const file = projectPath(home, 'alpha');
    assert.ok(fs.existsSync(file), 'fichier projet cree');
    const body = fs.readFileSync(file, 'utf8');
    assert.match(body, /^- \d{4}-\d{2}-\d{2} — alpha vise le self-hosted$/m, 'puce datee presente');

    const r2 = observe(home, { project: 'alpha' }, 'alpha vise le self-hosted');
    assert.equal(r2.changed, false, 're-run identique = no-op idempotent');
    const entries = observeList(home, { project: 'alpha' })[0].entries;
    assert.deepEqual(entries, ['alpha vise le self-hosted'], 'une seule entree malgre le re-run');
  } finally { rm(home); }
});

test('observe --portfolio alimente l agregat _portefeuille.md', () => {
  const home = mktmp();
  try {
    observe(home, { portfolio: true }, 'stack de reference : node zero-dep');
    assert.ok(fs.existsSync(portfolioPath(home)), 'agregat cree');
    const entries = observeList(home, { portfolio: true })[0].entries;
    assert.deepEqual(entries, ['stack de reference : node zero-dep']);
  } finally { rm(home); }
});

test('observe est HORS du canon review-gate : aucun proposals/, jamais ~/.iaka/memory ni ~/.claude', () => {
  const home = mktmp();
  try {
    observe(home, { project: 'beta' }, 'note beta');
    // Aucun reservoir de consentement dans le store d'observation.
    assert.equal(fs.existsSync(path.join(home, 'proposals')), false, 'pas de proposals/');
    // Le store resolu (par defaut) n'est jamais le canon review-gate ni sous ~/.claude.
    assert.throws(() => resolveObservationHome(defaultMemoryHome()), /distincte du canon/,
      'refuse ~/.iaka/memory/ comme store d observation');
    assert.throws(() => resolveObservationHome(path.join(os.homedir(), '.claude', 'x')), /\.claude/,
      'refuse un chemin sous ~/.claude/');
  } finally { rm(home); }
});

test('resolveObservationHome par defaut vise <root>/.iaka/observation (jamais le canon)', () => {
  const fakeRoot = mktmp();
  try {
    const home = resolveObservationHome(undefined, fakeRoot);
    assert.equal(home, path.join(fakeRoot, '.iaka', 'observation'));
    assert.notEqual(home, path.resolve(defaultMemoryHome()), 'distinct du canon ~/.iaka/memory');
  } finally { rm(fakeRoot); }
});

// --- T1 / portfolio : scan agrege lecture seule, sans effet de bord --------------------------------

// Empreinte recursive (chemin+mtime+taille) d'un arbre, pour prouver l'absence d'effet de bord.
function fingerprint(dir) {
  const acc = [];
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) { acc.push(`D ${p}`); walk(p); }
      else { const s = fs.statSync(p); acc.push(`F ${p} ${s.size} ${s.mtimeMs}`); }
    }
  };
  walk(dir);
  return acc.join('\n');
}

function buildFixture() {
  const root = mktmp();
  // proj-a : PROJET.md + etat des lieux renseigne.
  fs.mkdirSync(path.join(root, 'proj-a', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'proj-a', 'specs', 'PROJET.md'),
    '# Titre\n\nProjet A — service de demo.\n');
  fs.writeFileSync(path.join(root, 'proj-a', 'specs', 'etat-des-lieux.md'),
    '# Etat\n\n## Etat courant\n\n| Champ | Valeur |\n|---|---|\n| Version | v0.2.0 |\n| Arbre | propre |\n| Dernier commit | abc123 init |\n');
  // proj-b : marqueur .iakaframe + instructions (1 jalon ouvert, 1 valide).
  fs.mkdirSync(path.join(root, 'proj-b', 'specs', 'instructions'), { recursive: true });
  fs.writeFileSync(path.join(root, 'proj-b', '.iakaframe'), '');
  fs.writeFileSync(path.join(root, 'proj-b', 'specs', 'PROJET.md'), '# B\n\nProjet B — pipeline data.\n');
  fs.writeFileSync(path.join(root, 'proj-b', 'specs', 'instructions', 'feat-x.md'), 'sans jalon\n');
  fs.writeFileSync(path.join(root, 'proj-b', 'specs', 'instructions', 'feat-y.md'), 'JALON VALIDE\n');
  // bruit : dossier non-projet (ignore), dossier cache (ignore).
  fs.mkdirSync(path.join(root, 'not-a-project'), { recursive: true });
  fs.mkdirSync(path.join(root, '.hidden'), { recursive: true });
  return root;
}

test('portfolio scanne N projets avec def/version/arbre + jalons best-effort', () => {
  const root = buildFixture();
  try {
    const projects = scanPortfolio(root);
    assert.equal(projects.length, 2, 'exactement 2 projets (le dossier non-projet est ignore)');
    const a = projects.find((p) => p.project === 'proj-a');
    const b = projects.find((p) => p.project === 'proj-b');
    assert.equal(a.def, 'Projet A — service de demo.', 'ligne de def (1re ligne significative)');
    assert.equal(a.version, 'v0.2.0');
    assert.equal(a.arbre, 'propre');
    assert.equal(a.openMilestones, null, 'proj-a sans dossier instructions -> null');
    assert.equal(b.openMilestones, 1, 'proj-b : 1 instruction sans JALON VALIDE');
  } finally { rm(root); }
});

test('portfolio est LECTURE SEULE : aucune modification de la fixture (empreinte inchangee)', () => {
  const root = buildFixture();
  try {
    const before = fingerprint(root);
    scanPortfolio(root);
    scanPortfolio(root);
    const after = fingerprint(root);
    assert.equal(after, before, 'aucun fichier cree/modifie par le scan');
  } finally { rm(root); }
});

test('portfolio defensif : racine inexistante -> [] (pas d exception)', () => {
  assert.deepEqual(scanPortfolio(path.join(os.tmpdir(), 'iaka-nope-' + Date.now())), []);
});

// --- Primitive factorisee : memory NON regresse ---------------------------------------------------

test('primitive partagee : appendBullet idempotent et memory add non regresse', () => {
  // Primitive pure.
  const r1 = appendBullet(['# head'], 'x');
  assert.equal(r1.changed, true);
  const r2 = appendBullet(r1.lines, 'x');
  assert.equal(r2.changed, false, 'appariement idempotent sur le contenu');
  assert.equal(entryContent(r1.lines[r1.lines.length - 1]), 'x');

  // memory (canon gate) continue de fonctionner via la primitive partagee.
  const home = mktmp();
  try {
    const rep = memoryAdd(home, 'registre', 'le CLI reste zero-dep');
    assert.equal(rep.ok, true);
    assert.equal(rep.changed, true);
    assert.deepEqual(memoryList(home, 'registre'), ['le CLI reste zero-dep']);
    const rep2 = memoryAdd(home, 'registre', 'le CLI reste zero-dep');
    assert.equal(rep2.changed, false, 'memory add reste idempotent');
    assert.ok(fs.existsSync(statePath(home, 'registre')));
  } finally { rm(home); }
});
