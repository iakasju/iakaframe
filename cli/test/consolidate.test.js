// T8 - « Consolidation initiale » : couverture de la fonte des fiches memoire du portefeuille en
// un APERCU capé de PROFIL.md / REGISTRE.md (instruction boucle-apprentissage-incrementale.md § 9,
// critere d'acceptation 10). Couvre : ingestion de fiches typées -> routage type->cible
// (user/feedback->profil, project/reference->registre) ; respect du PLAFOND DUR (matiere abondante
// -> selection sous plafond + ecartées rapportées, JAMAIS de depassement) ; le CANON REEL n'est PAS
// muté (proposition seulement : seul consolidation/*.proposed.md est ecrit) ; extraction du type
// (metadata.type + repli node_type) ; source introuvable geree proprement. Aucun test ne lit/ecrit
// dans le vrai ~/.iaka/ ni dans la vraie memoire ~/.claude/ : tout passe par des tmpdir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureLayout, statePath, defaultConfig } from '../src/lib/memory.js';
import {
  consolidate, loadFiches, readFiche, routeTarget, fichePriority, rulesCurator, defaultSourceDir,
} from '../src/lib/consolidate.js';

const FIXED_NOW = new Date('2026-07-16T10:00:00Z');
const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

// Fabrique une fiche au format reel : frontmatter avec metadata.type imbriqué.
function ficheDoc({ name, description, type, nodeType }) {
  const meta = ['metadata:'];
  if (nodeType) meta.push(`  node_type: ${nodeType}`);
  if (type) meta.push(`  type: ${type}`);
  return `---
name: ${name}
description: "${description}"
${meta.join('\n')}
---

Corps de la fiche ${name}. Non repris dans le canon (curation = essence, pas copie).
`;
}

// Cree une source tmp de fiches + un canon (home) tmp de STAGING.
function tmpSource(fiches) {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-conso-src-'));
  for (const f of fiches) fs.writeFileSync(path.join(src, `${f.name}.md`), ficheDoc(f), 'utf8');
  return src;
}
function tmpHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-conso-home-'));
  ensureLayout(home);
  return home;
}

// --- Extraction du type (metadata.type + repli node_type) -----------------------------------------
test('readFiche extrait le type de metadata.type et retombe sur node_type', () => {
  const src = tmpSource([
    { name: 'a-user', description: 'trait decideur', type: 'feedback', nodeType: 'memory' },
    { name: 'b-only-node', description: 'classe portée par node_type', nodeType: 'feedback' },
  ]);
  const a = readFiche(path.join(src, 'a-user.md'));
  const b = readFiche(path.join(src, 'b-only-node.md'));
  assert.equal(a.type, 'feedback');           // metadata.type prime
  assert.equal(a.description, 'trait decideur');
  assert.equal(b.type, 'feedback');           // repli sur node_type quand type absent
  rm(src);
});

// --- Routage type -> cible ------------------------------------------------------------------------
test('routeTarget : user/feedback -> profil ; project/reference -> registre ; inconnu -> registre', () => {
  assert.equal(routeTarget('user'), 'profil');
  assert.equal(routeTarget('feedback'), 'profil');
  assert.equal(routeTarget('project'), 'registre');
  assert.equal(routeTarget('reference'), 'registre');
  assert.equal(routeTarget('inconnu'), 'registre');
});

test('rulesCurator ventile les fiches vers le bon bucket via l\'essence (description)', () => {
  const fiches = [
    { name: 'stephane-x', description: 'prefere le dialogue libre', type: 'feedback', mtime: 2 },
    { name: 'infra-y', description: 'token Forgejo long-lived', type: 'project', mtime: 1 },
    { name: 'ref-z', description: 'tauri dragDropEnabled false', type: 'reference', mtime: 3 },
  ];
  const { profil, registre } = rulesCurator(fiches);
  assert.deepEqual(profil.map((e) => e.source), ['stephane-x']);
  assert.deepEqual(registre.map((e) => e.source).sort(), ['infra-y', 'ref-z']);
  assert.equal(profil[0].text, 'prefere le dialogue libre'); // essence = description, pas le corps
});

// --- Ingestion complete -> apercus ecrits, routage constaté ---------------------------------------
test('consolidate ecrit les apercus capés et route chaque fiche selon son type', () => {
  const src = tmpSource([
    { name: 'stephane-style', description: 'dialogue libre en cadrage', type: 'feedback', nodeType: 'memory' },
    { name: 'forgejo-token', description: 'token Forgejo source unique .env', type: 'project', nodeType: 'memory' },
    { name: 'tauri-dnd', description: 'dragDropEnabled false requis', type: 'reference', nodeType: 'memory' },
  ]);
  const home = tmpHome();
  const report = consolidate({ home, source: src, now: FIXED_NOW });

  const profil = fs.readFileSync(report.profil.proposedPath, 'utf8');
  const registre = fs.readFileSync(report.registre.proposedPath, 'utf8');
  assert.match(profil, /dialogue libre en cadrage/);
  assert.doesNotMatch(profil, /token Forgejo/);           // projet -> registre, pas profil
  assert.match(registre, /token Forgejo source unique/);
  assert.match(registre, /dragDropEnabled false/);
  assert.doesNotMatch(registre, /dialogue libre/);        // feedback -> profil, pas registre

  // Les apercus vivent dans le dossier de staging, pas a la racine du canon.
  assert.ok(report.profil.proposedPath.includes(`${path.sep}consolidation${path.sep}`));
  assert.ok(fs.existsSync(path.join(report.stagingDir, 'DIFF.md')));
  assert.ok(fs.existsSync(path.join(report.stagingDir, 'RAPPORT.md')));
  rm(src); rm(home);
});

// --- INVARIANT CENTRAL : le canon reel n'est PAS muté ---------------------------------------------
test('consolidate ne mute JAMAIS le canon reel (PROFIL.md / REGISTRE.md inchangés)', () => {
  const src = tmpSource([
    { name: 'stephane-a', description: 'un trait du decideur', type: 'feedback', nodeType: 'memory' },
    { name: 'proj-b', description: 'un fait projet', type: 'project', nodeType: 'memory' },
  ]);
  const home = tmpHome();
  const profilBefore = fs.readFileSync(statePath(home, 'profil'), 'utf8');
  const registreBefore = fs.readFileSync(statePath(home, 'registre'), 'utf8');

  const report = consolidate({ home, source: src, now: FIXED_NOW });

  // Le canon reel est intact : seule la matiere de staging a été ecrite.
  assert.equal(fs.readFileSync(statePath(home, 'profil'), 'utf8'), profilBefore);
  assert.equal(fs.readFileSync(statePath(home, 'registre'), 'utf8'), registreBefore);
  // Mais les apercus contiennent bien la matiere consolidée.
  assert.match(fs.readFileSync(report.profil.proposedPath, 'utf8'), /un trait du decideur/);
  assert.match(fs.readFileSync(report.registre.proposedPath, 'utf8'), /un fait projet/);
  rm(src); rm(home);
});

// --- PLAFOND DUR : matiere abondante -> selection, ecartées rapportées, aucun depassement ----------
test('consolidate respecte le plafond DUR : matiere abondante -> écarte proprement, aucun depassement', () => {
  // 60 fiches feedback (-> profil) avec des descriptions longues : depasse largement 2000 chars.
  const many = [];
  for (let i = 0; i < 60; i++) {
    many.push({
      name: `fb-${String(i).padStart(2, '0')}`,
      description: `regle de travail durable numero ${i} tres detaillee pour saturer le plafond du profil du decideur`,
      type: 'feedback', nodeType: 'memory',
    });
  }
  const src = tmpSource(many);
  const home = tmpHome();
  const cfg = defaultConfig();
  const report = consolidate({ home, source: src, config: cfg, now: FIXED_NOW });

  const proposed = fs.readFileSync(report.profil.proposedPath, 'utf8');
  assert.ok(proposed.length <= cfg.caps.profil, `apercu ${proposed.length} <= cap ${cfg.caps.profil}`);
  assert.equal(report.profil.overCap, false);
  assert.ok(report.profil.dropped.length > 0, 'des fiches ont été écartées sous plafond');
  // Rien n'est perdu : retenues + écartées = total ingéré vers profil.
  assert.equal(report.profil.kept.length + report.profil.dropped.length, 60);
  rm(src); rm(home);
});

// --- Priorite de selection sous plafond -----------------------------------------------------------
test('fichePriority : une fiche au prefixe de profil CONFIGURE prime pour PROFIL ; reference prime pour REGISTRE', () => {
  // Le prefixe est desormais config-driven (plus de prenom en dur) : on le passe explicitement.
  assert.ok(fichePriority({ name: 'decideur-x', type: 'feedback' }, 'profil', 'decideur')
    > fichePriority({ name: 'autre', type: 'feedback' }, 'profil', 'decideur'));
  // Sans prefixe configure, le palier prioritaire est INACTIF (neutre par defaut).
  assert.equal(fichePriority({ name: 'decideur-x', type: 'feedback' }, 'profil', ''), 1);
  assert.ok(fichePriority({ name: 'r', type: 'reference' }, 'registre')
    > fichePriority({ name: 'p', type: 'project' }, 'registre'));
});

test('sous plafond, une fiche au prefixe de profil configure est retenue avant un feedback generique', () => {
  // Descriptions calibrées pour qu'une seule des deux tienne sous un plafond profil reduit.
  // Prefixe de profil CONFIGURE (config-driven, plus de prenom en dur).
  const longDesc = 'x'.repeat(1700);
  const src = tmpSource([
    { name: 'zzz-generique', description: longDesc, type: 'feedback', nodeType: 'memory' },
    { name: 'decideur-clef', description: longDesc, type: 'feedback', nodeType: 'memory' },
  ]);
  const home = tmpHome();
  const cfg = { ...defaultConfig(), profilePrefix: 'decideur', caps: { profil: 2000, registre: 3200 } };
  const report = consolidate({ home, source: src, config: cfg, now: FIXED_NOW });
  assert.deepEqual(report.profil.kept.map((e) => e.source), ['decideur-clef']);
  assert.deepEqual(report.profil.dropped.map((e) => e.source), ['zzz-generique']);
  rm(src); rm(home);
});

// --- Source introuvable / vide --------------------------------------------------------------------
test('loadFiches : source introuvable -> missing, aucune levée', () => {
  const res = loadFiches(path.join(os.tmpdir(), 'iaka-nexiste-pas-xyz'));
  assert.equal(res.missing, true);
  assert.deepEqual(res.fiches, []);
});

test('consolidate sur source vide -> apercus = header seul, canon reel intact', () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-conso-empty-'));
  const home = tmpHome();
  const report = consolidate({ home, source: src, now: FIXED_NOW });
  assert.equal(report.fiches, 0);
  assert.equal(report.profil.kept.length, 0);
  assert.ok(report.profil.chars <= report.profil.cap);
  rm(src); rm(home);
});

// --- MEMORY.md et fiches sans description sont ignorés ---------------------------------------------
test('loadFiches ignore MEMORY.md (index) et les fiches sans description', () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-conso-ignore-'));
  fs.writeFileSync(path.join(src, 'MEMORY.md'), '# index\n- ligne\n', 'utf8');
  fs.writeFileSync(path.join(src, 'sans-desc.md'), '---\nname: sans-desc\nmetadata:\n  type: feedback\n---\ncorps\n', 'utf8');
  fs.writeFileSync(path.join(src, 'ok.md'), ficheDoc({ name: 'ok', description: 'valide', type: 'feedback', nodeType: 'memory' }), 'utf8');
  const { fiches, skipped } = loadFiches(src);
  assert.deepEqual(fiches.map((f) => f.name), ['ok']);
  assert.ok(skipped.some((s) => s.file === 'sans-desc.md' && s.reason === 'sans-description'));
  assert.ok(!fiches.some((f) => f.name === 'MEMORY'));
  rm(src);
});

// --- defaultSourceDir pointe sous ~/.claude/ (memoire runner), jamais sous le canon ---------------
test('defaultSourceDir cible la memoire portefeuille du runner (~/.claude/projects/...)', () => {
  const d = defaultSourceDir();
  assert.ok(d.includes(path.join('.claude', 'projects')), d);
  assert.ok(d.endsWith('memory'));
});
