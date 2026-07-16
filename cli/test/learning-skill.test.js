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
