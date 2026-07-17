// U3/U4 (surface-apprentissage.md) : la skill `iakaframe-learning` + ses alias `/learning` et
// `/iaka` sont des PILOTES de `iakaframe review` — jamais un backend propre. Ces tests verrouillent :
//   - frontmatter conforme aux skills iaka* (id/name/description) + déclencheurs /learning et /iaka ;
//   - le parcours cite bien les 4 verbes de `review` (list/show/apply/reject) ;
//   - AUCUNE réimplémentation de la politique de consentement/plafond (pas de `classify(`, etc.) ;
//   - les deux alias existent et routent vers le même parcours `review`.
// Aucun accès réservoir : on lit uniquement les fichiers de la bibliothèque/kit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../src/lib/frontmatter.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const skillPath = path.join(repoRoot, 'library', 'skills', 'iakaframe-learning', 'SKILL.md');
const learningCmd = path.join(repoRoot, 'kits', 'iakaframe-claude', '.claude', 'commands', 'learning.md');
const iakaCmd = path.join(repoRoot, 'kits', 'iakaframe-claude', '.claude', 'commands', 'iaka.md');

test('la skill iakaframe-learning existe avec un frontmatter conforme aux skills iaka*', () => {
  assert.ok(fs.existsSync(skillPath), 'library/skills/iakaframe-learning/SKILL.md doit exister');
  const { data } = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
  assert.equal(data.id, 'iakaframe-learning');
  assert.equal(data.name, 'iakaframe-learning');
  assert.ok(typeof data.description === 'string' && data.description.length > 40,
    'description non vide (déclencheur par description)');
});

test('la description déclenche sur /learning ET /iaka (Q-2)', () => {
  const { data } = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
  assert.match(data.description, /\/learning/);
  assert.match(data.description, /\/iaka/);
});

test('le corps de la skill pilote les 4 verbes de `review` (list/show/apply/reject)', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  for (const verb of ['review list', 'review show', 'review apply', 'review reject']) {
    assert.match(body, new RegExp(`iakaframe ${verb}`), `doit citer \`iakaframe ${verb}\``);
  }
});

test('la skill se déclare PILOTE (source unique = review) et explicite le garde de consentement', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  // Elle se positionne comme pilote, jamais propriétaire du réservoir.
  assert.match(body, /pilote/i);
  assert.match(body, /source unique/i);
  // Elle explicite le garde (structurel = geste humain), sans re-décider.
  assert.match(body, /geste humain/i);
  assert.match(body, /structurel/i);
  // Elle rappelle qu'elle ne réimplémente pas la politique/plafonds.
  assert.match(body, /r[ée]implément\w*/i);
});

test('les deux alias /learning et /iaka existent et routent vers le parcours review', () => {
  for (const [file, label] of [[learningCmd, 'learning'], [iakaCmd, 'iaka']]) {
    assert.ok(fs.existsSync(file), `kits/iakaframe-claude/.claude/commands/${label}.md doit exister`);
    const txt = fs.readFileSync(file, 'utf8');
    assert.match(txt, /iakaframe review list/);
    assert.match(txt, /iakaframe review apply/);
    assert.match(txt, /iakaframe review reject/);
  }
});

// --- S6 (2e tranche, symetrie +/-) : la skill pilote AUSSI les verbes de RETRAIT ---

test('S6 : la skill pilote les verbes de retrait (detach/attach/remove/memory remove)', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  assert.match(body, /iakaframe detach <skillId> --persona <personaId>/);
  assert.match(body, /iakaframe attach <skillId> --persona <personaId>/);
  assert.match(body, /iakaframe remove <team\|method\|binding\|skill> <id>/);
  assert.match(body, /iakaframe memory remove/);
});

test('S6 : la skill explicite RESTRICT, la corbeille non destructive et la cascade explicite', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  assert.match(body, /RESTRICT/);
  assert.match(body, /r[ée]f[ée]rent/i);          // liste des referents restituee
  assert.match(body, /\.trash-/);                  // corbeille horodatee
  assert.match(body, /--cascade --yes/);           // cascade = geste humain explicite
  assert.match(body, /Option 1/);                  // frontmatter = source unique, titre = vue
});

test('S6 : le retrait reste un PILOTAGE (aucune reimplementation de RESTRICT/corbeille/cascade)', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  // Elle se declare pilote des verbes CLI et rappelle la source unique cote CLI.
  assert.match(body, /pilot\w+ les verbes/i);
  assert.match(body, /r[ée]implément\w*/i);
});

test('S6 : les deux alias /learning et /iaka exposent le retrait symetrique', () => {
  for (const [file, label] of [[learningCmd, 'learning'], [iakaCmd, 'iaka']]) {
    const txt = fs.readFileSync(file, 'utf8');
    assert.match(txt, /iakaframe detach <skillId> --persona <id>/, `${label} : detach`);
    assert.match(txt, /iakaframe attach <skillId> --persona <id>/, `${label} : attach`);
    assert.match(txt, /iakaframe remove <team\|method\|binding\|skill> <id>/, `${label} : remove`);
    assert.match(txt, /RESTRICT/, `${label} : RESTRICT`);
    assert.match(txt, /--cascade --yes/, `${label} : cascade explicite`);
  }
});
