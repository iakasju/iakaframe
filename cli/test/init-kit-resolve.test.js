// Non-regression : la resolution du dossier de kit dans `iakaframe init` (fix-resolution-kit-init).
// Prouve : (1) init --node claude reussit (exit 0) et depose CLAUDE.md + .iakaframe + specs/ + les
// 10 commandes iaka-*.md ; (2) --node codex et --node openwebui resolvent aussi (kits/iakaframe-*) ;
// (3) le resolveur kitDirForNode retombe sur le fallback legacy <root>/kit-<famille> ; (4) message
// d'erreur explicite pointant kits/iakaframe-<famille> quand aucun candidat n'existe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kitDirForNode } from '../src/lib/kit.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-init-')); }
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

const IAKA_COMMANDS = [
  'iaka-cadre', 'iaka-update', 'iaka-etat', 'iaka-qualite', 'iaka-deploie',
  'iaka-list', 'iaka-brief', 'iaka-services', 'iaka-recap', 'iaka-help',
];

test('init --node claude : reussit et depose contrat + marqueur + specs + 10 commandes iaka', () => {
  const proj = path.join(tmp(), 'proj');
  const r = spawnSync('node', [CLI, 'init', '--path', proj, '--node', 'claude'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `init exit != 0 : ${r.stderr}`);
  assert.doesNotMatch(r.stderr + r.stdout, /Kit introuvable/);
  // contrat + marqueur + structure
  assert.ok(exists(path.join(proj, 'CLAUDE.md')), 'CLAUDE.md attendu');
  assert.ok(exists(path.join(proj, '.iakaframe')), '.iakaframe attendu');
  assert.ok(exists(path.join(proj, 'specs')), 'specs/ attendu');
  // les 10 commandes iaka-*.md
  for (const cmd of IAKA_COMMANDS) {
    assert.ok(exists(path.join(proj, '.claude', 'commands', `${cmd}.md`)), `${cmd}.md attendu`);
  }
});

test('init --node codex : resout kits/iakaframe-codex et depose AGENTS.md (non-regression)', () => {
  const proj = path.join(tmp(), 'proj');
  const r = spawnSync('node', [CLI, 'init', '--path', proj, '--node', 'codex'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `init codex exit != 0 : ${r.stderr}`);
  assert.doesNotMatch(r.stderr + r.stdout, /Kit introuvable/);
  assert.ok(exists(path.join(proj, 'AGENTS.md')), 'AGENTS.md attendu (contrat codex)');
});

test('init --node openwebui : resout kits/iakaframe-openwebui (non-regression, exit 0)', () => {
  const proj = path.join(tmp(), 'proj');
  const r = spawnSync('node', [CLI, 'init', '--path', proj, '--node', 'openwebui'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `init openwebui exit != 0 : ${r.stderr}`);
  assert.doesNotMatch(r.stderr + r.stdout, /Kit introuvable/);
});

test('kitDirForNode : candidat primaire kits/iakaframe-<famille> quand present', () => {
  const root = tmp();
  const primary = path.join(root, 'kits', 'iakaframe-claude');
  fs.mkdirSync(primary, { recursive: true });
  assert.equal(kitDirForNode(root, 'claude'), primary);
});

test('kitDirForNode : fallback legacy <root>/kit-<famille> si kits/ absent', () => {
  const root = tmp();
  const legacy = path.join(root, 'kit-claude');
  fs.mkdirSync(legacy, { recursive: true });
  assert.equal(kitDirForNode(root, 'claude'), legacy);
});

test('kitDirForNode : aucun candidat -> retourne le primaire (chemin attendu pour l erreur)', () => {
  const root = tmp();
  assert.equal(kitDirForNode(root, 'claude'), path.join(root, 'kits', 'iakaframe-claude'));
});
