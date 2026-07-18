// Scission A3.4 (scinder-learning-deux-skills.md) : la skill `iakaframe-retrait` + son alias
// `/retrait` sont des PILOTES des verbes de retrait de la CLI (detach/attach/remove/memory remove)
// — jamais un backend propre. Ces tests verrouillent :
//   - frontmatter conforme aux skills iaka* (id/name/description) + declencheurs de retrait ;
//   - le corps cite bien les verbes CLI de retrait + RESTRICT / corbeille / cascade explicite ;
//   - AUCUNE reimplementation de RESTRICT/corbeille/cascade (posture pilote, source unique) ;
//   - l'alias /retrait existe et route vers ces verbes ;
//   - la frontiere de perimetre : renvoi vers iakaframe-learning pour `reject` (proposition en attente).
// Aucun acces disque hors bibliotheque/kit : on lit uniquement des fichiers du depot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../src/lib/frontmatter.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const skillPath = path.join(repoRoot, 'library', 'skills', 'iakaframe-retrait', 'SKILL.md');
const retraitCmd = path.join(repoRoot, 'kits', 'iakaframe-claude', '.claude', 'commands', 'retrait.md');

test('la skill iakaframe-retrait existe avec un frontmatter conforme aux skills iaka*', () => {
  assert.ok(fs.existsSync(skillPath), 'library/skills/iakaframe-retrait/SKILL.md doit exister');
  const { data } = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
  assert.equal(data.id, 'iakaframe-retrait');
  assert.equal(data.name, 'iakaframe-retrait');
  assert.ok(typeof data.description === 'string' && data.description.length > 40,
    'description non vide (declencheur par description)');
});

test('la description declenche sur les triggers de retrait (detach/attach/remove/memory remove + /retrait)', () => {
  const { data } = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
  assert.match(data.description, /\/retrait/);
  assert.match(data.description, /detach/);
  assert.match(data.description, /attach/);
  assert.match(data.description, /remove/);
  assert.match(data.description, /memory remove/);
  assert.match(data.description, /d[ée]tacher un skill/i);
  assert.match(data.description, /retirer une entr[ée]e m[ée]moire/i);
});

test('le corps de la skill pilote les verbes de retrait (detach/attach/remove/memory remove)', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  assert.match(body, /iakaframe detach <skillId> --persona <personaId>/);
  assert.match(body, /iakaframe attach <skillId> --persona <personaId>/);
  assert.match(body, /iakaframe remove <team\|method\|binding\|skill> <id>/);
  assert.match(body, /iakaframe memory remove/);
});

test('le corps explicite RESTRICT, la corbeille non destructive, la cascade explicite et Option 1', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  assert.match(body, /RESTRICT/);
  assert.match(body, /r[ée]f[ée]rent/i);          // liste des referents restituee
  assert.match(body, /\.trash-/);                  // corbeille horodatee
  assert.match(body, /--cascade --yes/);           // cascade = geste humain explicite
  assert.match(body, /Option 1/);                  // frontmatter = source unique, titre = vue
});

test('la skill se declare PILOTE (source unique cote CLI) sans reimplementer RESTRICT/corbeille/cascade', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  assert.match(body, /pilote/i);
  assert.match(body, /source unique/i);
  assert.match(body, /r[ée]implément\w*/i);
});

test('la skill porte le badge [Retrait]', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  assert.match(body, /\[ROYAUME\]\[Retrait\]/);
});

test('frontiere de perimetre : la skill retrait renvoie vers iakaframe-learning pour reject (proposition en attente)', () => {
  const body = fs.readFileSync(skillPath, 'utf8');
  assert.match(body, /iakaframe-learning/);
  assert.match(body, /en attente/i);
});

test('l\'alias /retrait existe et route vers les verbes de retrait', () => {
  assert.ok(fs.existsSync(retraitCmd), 'kits/iakaframe-claude/.claude/commands/retrait.md doit exister');
  const txt = fs.readFileSync(retraitCmd, 'utf8');
  assert.match(txt, /iakaframe detach <skillId> --persona <id>/);
  assert.match(txt, /iakaframe attach <skillId> --persona <id>/);
  assert.match(txt, /iakaframe remove <team\|method\|binding\|skill> <id>/);
  assert.match(txt, /RESTRICT/);
  assert.match(txt, /--cascade --yes/);
});

test('l\'alias /retrait NE parle PAS de review (perimetre revue = /learning)', () => {
  const txt = fs.readFileSync(retraitCmd, 'utf8');
  assert.doesNotMatch(txt, /iakaframe review list/, 'review list releve de /learning');
  assert.doesNotMatch(txt, /iakaframe review apply/, 'review apply releve de /learning');
});
