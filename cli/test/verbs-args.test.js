// Dispatch + options des verbes bibliotheque : mapping des 6 cases (dont alias use->switch),
// aide, et sorties --json (list/show/assemble) executees sur la vraie bibliotheque du depot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runList } from '../src/commands/list.js';
import { runShow } from '../src/commands/show.js';
import { runAdd } from '../src/commands/add.js';
import { runAssemble } from '../src/commands/assemble.js';
import { runSwitch } from '../src/commands/switch.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');

function run(args, opts = {}) {
  return execFileSync('node', [CLI, ...args], { cwd: REPO, encoding: 'utf8', ...opts });
}

test('les 5 run<Verbe> sont exportes et callables', () => {
  for (const fn of [runList, runShow, runAdd, runAssemble, runSwitch]) {
    assert.equal(typeof fn, 'function');
  }
});

test('index.js mappe les 6 verbes (dont alias use -> runSwitch)', () => {
  const src = fs.readFileSync(CLI, 'utf8');
  for (const c of ["case 'list':", "case 'show':", "case 'add':",
    "case 'assemble':", "case 'switch':", "case 'use':"]) {
    assert.ok(src.includes(c), `dispatch manquant : ${c}`);
  }
  assert.ok(src.includes('runSwitch(rest)'), 'use/switch doit router vers runSwitch');
});

test('--help liste les 6 nouveaux verbes', () => {
  const help = run(['--help']);
  for (const v of ['list', 'show', 'add', 'assemble', 'switch|use']) {
    assert.ok(help.includes(v), `aide manquante : ${v}`);
  }
});

test('list --json : enveloppe C-JSON { ok, count, collections } (12 collections, plus de tableau nu)', () => {
  const data = JSON.parse(run(['list', '--json']));
  assert.equal(data.ok, true);
  assert.ok(!Array.isArray(data), 'racine = objet, jamais un tableau nu');
  assert.equal(data.count, 12);
  assert.equal(data.collections.length, 12);
  assert.equal(data.count, data.collections.length);
  const personas = data.collections.find(d => d.collection === 'personas');
  assert.equal(personas.count, 8);
});

test('list <type> --json : enveloppe { ok, type, count, items } (plus de tableau nu)', () => {
  const data = JSON.parse(run(['list', 'personas', '--json']));
  assert.equal(data.ok, true);
  assert.ok(!Array.isArray(data));
  assert.equal(data.type, 'personas');
  assert.equal(data.count, 8);
  assert.equal(data.items.length, 8);
  assert.equal(data.items[0].id, 'aragorn');
});

test('list <type inconnu> : exitCode 1', () => {
  assert.throws(() => run(['list', 'bidon']), (e) => e.status === 1);
});

test('show --json : objet { ok, collection, id, data, body } (champs a plat)', () => {
  const o = JSON.parse(run(['show', 'gandalf', '--json']));
  assert.equal(o.ok, true);
  assert.equal(o.collection, 'personas');
  assert.equal(o.data.roleKey, 'architecture'); // CH-A : vocabulaire aligne sur ROLE_OF / coeur GUI
  assert.deepEqual(o.data.skills, ['iakaframe-cadrage']);
  assert.ok(o.body.length > 0);
});

test('show <inconnu> : exitCode 1', () => {
  assert.throws(() => run(['show', 'zzznope']), (e) => e.status === 1);
});

test('assemble --json : enveloppe { ok, descriptor } (8/8 rôles, rupture § 8)', () => {
  const o = JSON.parse(run(['assemble', 'iakaframe', 'iakaframe-8', '--json']));
  assert.equal(o.ok, true);
  const d = o.descriptor;                                 // descripteur sous enveloppe, plus de nu
  assert.equal(d.id, 'iakaframe-claude');                 // convention coeur <methodId>-<node>
  assert.equal(d.methodId, 'iakaframe');
  assert.equal(d.teamId, 'iakaframe-8');
  assert.equal(d.node, 'claude');
  // emits = globs par noeud (semantique coeur), plus les chemins concrets par persona.
  assert.deepEqual(d.emits, ['.claude/agents/*', '.claude/skills/*', '.claude/hooks/*', 'CLAUDE.md']);
});

test('commandes existantes : non-regression du dispatch (banner, root)', () => {
  assert.ok(run(['banner', 'X']).length > 0);
  assert.ok(run(['root']).trim().length > 0);
});
