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
import { scan } from '../src/lib/library.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');

// La library est PARTAGEE entre toutes les frames du reservoir : le compte de personas GROSSIT
// legitimement a chaque frame rangee. Les tests de `list` ne figent donc AUCUN total (qui deriverait
// a chaque frame) : ils asserent la COHERENCE avec le scan reel + une BORNE de sous-ensemble stable,
// le roster iakaframe (les 9 personas casties dans teams/iakaframe-8.md). Mord toujours : desync
// list<->scan, ou disparition d'une persona du roster -> rouge.
const ROSTER_IAKAFRAME = ['aragorn', 'feanor', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin'];

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

test('list --json : enveloppe C-JSON { ok, count, collections } (13 collections, personas = scan reel)', () => {
  const data = JSON.parse(run(['list', '--json']));
  assert.equal(data.ok, true);
  assert.ok(!Array.isArray(data), 'racine = objet, jamais un tableau nu');
  assert.equal(data.count, 13);
  assert.equal(data.collections.length, 13);
  assert.equal(data.count, data.collections.length);
  const personas = data.collections.find(d => d.collection === 'personas');
  // `list` reflete la REALITE du reservoir PARTAGE (grossit par frame rangee) : on n'assert PAS un
  // total fige, mais la COHERENCE avec le scan reel (count == ids.length == scan) + la borne roster.
  const scanned = scan('personas', REPO);
  assert.equal(personas.count, scanned.length, 'list count == scan reel');
  assert.equal(personas.ids.length, scanned.length, 'list ids == scan reel');
  for (const id of ROSTER_IAKAFRAME) assert.ok(personas.ids.includes(id), `roster iakaframe manquant : ${id}`);
});

test('list <type> --json : enveloppe { ok, type, count, items } (plus de tableau nu)', () => {
  const data = JSON.parse(run(['list', 'personas', '--json']));
  assert.equal(data.ok, true);
  assert.ok(!Array.isArray(data));
  assert.equal(data.type, 'personas');
  // `list <type>` compte le reservoir PARTAGE (grossit par frame rangee), pas une frame : coherence
  // count == items == scan reel (meme ensemble, meme tri) + tete de liste + presence du roster.
  const scanned = scan('personas', REPO);
  assert.equal(data.count, scanned.length, 'count == scan reel');
  assert.equal(data.items.length, scanned.length, 'items == scan reel');
  assert.deepEqual(data.items.map(i => i.id), scanned.map(e => e.id)); // meme ensemble, meme tri (I2)
  assert.equal(data.items[0].id, 'aragorn');
  for (const id of ROSTER_IAKAFRAME) assert.ok(data.items.some(i => i.id === id), `roster iakaframe manquant : ${id}`);
});

test('list <type inconnu> : exitCode 1', () => {
  assert.throws(() => run(['list', 'bidon']), (e) => e.status === 1);
});

test('show --json : objet { ok, collection, id, data, body } (champs a plat)', () => {
  const o = JSON.parse(run(['show', 'gandalf', '--json']));
  assert.equal(o.ok, true);
  assert.equal(o.collection, 'personas');
  assert.equal(o.data.roleKey, 'cadrage');
  assert.deepEqual(o.data.skills, ['iakaframe-cadrage', 'iakaframe-lecture-maquettes']);
  assert.ok(o.body.length > 0);
});

test('show <inconnu> : exitCode 1', () => {
  assert.throws(() => run(['show', 'zzznope']), (e) => e.status === 1);
});

test('assemble --json : enveloppe { ok, descriptor } (9/9 rôles, rupture § 8)', () => {
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
