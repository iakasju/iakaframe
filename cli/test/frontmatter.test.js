// Parseur frontmatter maison : couvre les 4 formes reellement presentes dans la bibliotheque
// (scalaire quote/emoji, liste flow multi-ligne, sequence de maps inline) + tolerance + corps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, renderValue, _internal } from '../src/lib/frontmatter.js';

test('scalaires : quote, emoji, booleen, entier, non quote', () => {
  const { data } = parseFrontmatter([
    '---',
    'id: gandalf',
    'model: "opus"',
    'pastille: "🔵"',
    'nonDestructive: true',
    'roleIndex: 3',
    'label: Architecte-cadreur',
    '---',
    'corps',
  ].join('\n'));
  assert.equal(data.id, 'gandalf');
  assert.equal(data.model, 'opus');
  assert.equal(data.pastille, '🔵');
  assert.equal(data.nonDestructive, true);
  assert.equal(data.roleIndex, 3);
  assert.equal(data.label, 'Architecte-cadreur');
});

test('liste flow mono-ligne et items a espaces', () => {
  const { data } = parseFrontmatter([
    '---',
    'skills: [iakaframe-cadrage]',
    'triggers: [init iakaframe, update iakaframe]',
    '---',
  ].join('\n'));
  assert.deepEqual(data.skills, ['iakaframe-cadrage']);
  assert.deepEqual(data.triggers, ['init iakaframe', 'update iakaframe']);
});

test('liste flow MULTI-ligne (cas methods/iakaframe.md principleIds)', () => {
  const { data } = parseFrontmatter([
    '---',
    'principleIds: [qualite, gestion-backlog, documentation,',
    '  commits-versionnement, isolation-docker,',
    '  mvp-first]',
    '---',
  ].join('\n'));
  assert.deepEqual(data.principleIds, [
    'qualite', 'gestion-backlog', 'documentation',
    'commits-versionnement', 'isolation-docker', 'mvp-first',
  ]);
});

test('sequence de maps inline (cas bindings/* assignments)', () => {
  const { data } = parseFrontmatter([
    '---',
    'assignments:',
    '  - { personaId: odin,    runner: claude-code, model: "opus" }',
    '  - { personaId: gimli,   runner: claude-code, model: "sonnet" }',
    '---',
  ].join('\n'));
  assert.equal(data.assignments.length, 2);
  assert.deepEqual(data.assignments[0], { personaId: 'odin', runner: 'claude-code', model: 'opus' });
  assert.equal(data.assignments[1].model, 'sonnet');
});

test('map inline avec liste flow imbriquee (cas workflows phases)', () => {
  const { data } = parseFrontmatter([
    '---',
    'phases:',
    '  - { id: p2, label: Réalisation, agentsRoleKeys: [dev, qualite], input: instruction }',
    '---',
  ].join('\n'));
  assert.deepEqual(data.phases[0].agentsRoleKeys, ['dev', 'qualite']);
  assert.equal(data.phases[0].label, 'Réalisation');
});

test('sequence de scalaires quotes (cas rituals actions)', () => {
  const { data } = parseFrontmatter([
    '---',
    'actions:',
    '  - "Auto-détecter init vs update"',
    '  - "Répertoire vide : créer le dépôt"',
    '---',
  ].join('\n'));
  assert.deepEqual(data.actions, ['Auto-détecter init vs update', 'Répertoire vide : créer le dépôt']);
});

test('tolerance : ligne hors sous-ensemble ignoree sans crash', () => {
  const { data } = parseFrontmatter('---\nid: x\n   >bizarre indent\n---\n');
  assert.equal(data.id, 'x');
});

test('corps preserve tel quel ; absence de frontmatter', () => {
  const { data, body } = parseFrontmatter('---\nid: x\n---\n# Titre\n\nligne');
  assert.equal(body, '# Titre\n\nligne');
  const noFm = parseFrontmatter('# pas de frontmatter');
  assert.deepEqual(noFm.data, {});
  assert.equal(noFm.body, '# pas de frontmatter');
});

test('splitTopLevel respecte quotes et crochets ; balance', () => {
  assert.deepEqual(_internal.splitTopLevel('a, [b, c], "d, e"'), ['a', ' [b, c]', ' "d, e"']);
  assert.equal(_internal.balance('[a, b'), 1);
  assert.equal(_internal.balance('[a, b]'), 0);
});

test('renderValue : liste, map, sequence de maps', () => {
  assert.equal(renderValue(['a', 'b']), '[a, b]');
  assert.equal(renderValue({ k: 'v' }), '{ k: v }');
  assert.ok(renderValue([{ id: 'p1' }]).includes('- { id: p1 }'));
});
