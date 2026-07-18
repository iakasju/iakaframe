// Tests Lot C1 (§5bis) — installeur MULTI-HOST fan-out (racine du depot : ../../install.mjs).
// Fixture : 2 hosts factices presents (claude, codex) + 1 absent (openwebui). Prouve : fan-out
// (2 kits poses, 1 ignore), backup PAR HOST, --dry-run n'ecrit rien, idempotence (re-run = noop),
// refus des non-hosts (ollama/anythingllm), mode legacy claude-only (--target), et --link
// (symlink par element cote claude, repli COPIE cote codex, fichiers-merge JAMAIS lies).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INSTALLER = path.join(HERE, '..', '..', 'install.mjs');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-c1-')); }
function w(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function countFiles(dir) {
  let n = 0;
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f); else n++;
  } };
  if (exists(dir)) walk(dir);
  return n;
}
function run(args) {
  const r = spawnSync('node', [INSTALLER, ...args, '--yes'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `installeur exit != 0 : ${r.stderr}`);
  return r.stdout + r.stderr;
}

// Cree une racine de kits fixture {iakaframe-claude, iakaframe-codex, iakaframe-openwebui}.
function makeKits() {
  const kits = path.join(tmp(), 'kits');
  // claude
  const c = path.join(kits, 'iakaframe-claude');
  w(path.join(c, 'global', 'CLAUDE.md'), 'CLAUDE contract source\n');
  w(path.join(c, 'global', 'settings.example.json'), JSON.stringify({ '//': 'x', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node ~/.claude/hooks/identity-guard.mjs' }] }] } }));
  w(path.join(c, 'global', 'hooks', 'identity-guard.mjs'), 'console.log("id")\n');
  w(path.join(c, '.claude', 'commands', 'iaka.md'), '# cmd\n');
  // codex
  const x = path.join(kits, 'iakaframe-codex');
  w(path.join(x, 'AGENTS.md'), 'AGENTS contract source\n');
  w(path.join(x, 'global', 'hooks', 'hooks.example.json'), JSON.stringify({ hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: 'node ~/.codex/hooks/codex-perimeter-guard.mjs' }] }] } }));
  w(path.join(x, 'global', 'hooks', 'codex-perimeter-guard.mjs'), 'console.log("cx")\n');
  // openwebui (import bundle : functions + models ; test_ exclu)
  const o = path.join(kits, 'iakaframe-openwebui');
  w(path.join(o, 'functions', 'iakaframe_identity_filter.py'), 'class Filter: pass\n');
  w(path.join(o, 'functions', 'test_identity_filter.py'), 'def t(): pass\n');
  w(path.join(o, 'models', 'odin.json'), '{"id":"odin"}\n');
  return kits;
}

test('C1 — install.mjs valide (node --check)', () => {
  const r = spawnSync('node', ['--check', INSTALLER], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('C1 — fan-out : 2 hosts presents poses, 1 absent ignore', () => {
  const kits = makeKits();
  const tclaude = tmp(); const tcodex = tmp(); // presents (dirs existants)
  const out = run(['--kits-dir', kits, '--hosts', 'claude,codex,openwebui',
    '--target-claude', tclaude, '--target-codex', tcodex]);
  // openwebui : pas de --target-openwebui, pas de dir par defaut -> ABSENT ignore
  assert.match(out, /host: openwebui — ABSENT/);
  assert.match(out, /Hosts traites : claude, codex/);
  // claude pose : CLAUDE.md (bloc), settings.json, hook, command
  assert.ok(exists(path.join(tclaude, 'CLAUDE.md')));
  assert.ok(exists(path.join(tclaude, 'settings.json')));
  assert.ok(exists(path.join(tclaude, 'hooks', 'identity-guard.mjs')));
  assert.ok(exists(path.join(tclaude, 'commands', 'iaka.md')));
  // codex pose : AGENTS.md, hooks.json, hook
  assert.ok(exists(path.join(tcodex, 'AGENTS.md')));
  assert.ok(exists(path.join(tcodex, 'hooks.json')));
  assert.ok(exists(path.join(tcodex, 'hooks', 'codex-perimeter-guard.mjs')));
  // le contrat est bien un MERGE par bloc iakaframe (jamais un simple dump)
  const cm = fs.readFileSync(path.join(tclaude, 'CLAUDE.md'), 'utf8');
  assert.match(cm, /<!-- iakaframe:start -->[\s\S]*CLAUDE contract source[\s\S]*<!-- iakaframe:end -->/);
});

test('C1 — --dry-run n ecrit RIEN et ne cree aucun backup', () => {
  const kits = makeKits();
  const tclaude = tmp(); const tcodex = tmp();
  const before = countFiles(tclaude) + countFiles(tcodex);
  const out = run(['--kits-dir', kits, '--hosts', 'claude,codex',
    '--target-claude', tclaude, '--target-codex', tcodex, '--dry-run']);
  const after = countFiles(tclaude) + countFiles(tcodex);
  assert.equal(after, before, 'dry-run ne doit rien ecrire');
  assert.equal(after, 0);
  assert.match(out, /Aucun fichier ecrit, aucun backup/);
  // aucun repertoire de backup cree
  assert.equal(fs.readdirSync(tclaude).length, 0);
});

test('C1 — backup PAR HOST sur collision --overwrite (contenu utilisateur preserve)', () => {
  const kits = makeKits();
  const tclaude = tmp(); const tcodex = tmp();
  run(['--kits-dir', kits, '--hosts', 'claude,codex', '--target-claude', tclaude, '--target-codex', tcodex]);
  // l'utilisateur modifie ses fichiers -> collision au 2e passage
  w(path.join(tclaude, 'commands', 'iaka.md'), 'USER claude cmd\n');
  w(path.join(tcodex, 'hooks', 'codex-perimeter-guard.mjs'), 'USER codex hook\n');
  run(['--kits-dir', kits, '--hosts', 'claude,codex', '--target-claude', tclaude, '--target-codex', tcodex, '--overwrite']);
  const bkClaude = fs.readdirSync(tclaude).find((n) => n.startsWith('.iakaframe-backup-'));
  const bkCodex = fs.readdirSync(tcodex).find((n) => n.startsWith('.iakaframe-backup-'));
  assert.ok(bkClaude, 'backup host claude attendu');
  assert.ok(bkCodex, 'backup host codex attendu (racine PROPRE a l host)');
  // contenu utilisateur bien sauvegarde
  assert.equal(fs.readFileSync(path.join(tclaude, bkClaude, 'commands', 'iaka.md'), 'utf8'), 'USER claude cmd\n');
  assert.equal(fs.readFileSync(path.join(tcodex, bkCodex, 'hooks', 'codex-perimeter-guard.mjs'), 'utf8'), 'USER codex hook\n');
});

test('C1 — idempotence : 2e passe = noop (aucun backup, aucune ecriture)', () => {
  const kits = makeKits();
  const tclaude = tmp(); const tcodex = tmp();
  run(['--kits-dir', kits, '--hosts', 'claude,codex', '--target-claude', tclaude, '--target-codex', tcodex]);
  const snap = countFiles(tclaude) + countFiles(tcodex);
  const out = run(['--kits-dir', kits, '--hosts', 'claude,codex', '--target-claude', tclaude, '--target-codex', tcodex]);
  assert.match(out, /a jour \(rien a changer\)/);
  assert.match(out, /garder l existant/);
  assert.doesNotMatch(out, /Backup/); // aucun backup a la 2e passe
  assert.equal(countFiles(tclaude) + countFiles(tcodex), snap, 'aucune ecriture supplementaire');
});

test('C1 — non-hosts ollama/anythingllm : refus documente, aucun mapping', () => {
  const kits = makeKits();
  const out = run(['--kits-dir', kits, '--hosts', 'ollama,anythingllm']);
  assert.match(out, /\[refus\] 'ollama' n'est PAS un host/);
  assert.match(out, /\[refus\] 'anythingllm' n'est PAS un host/);
  assert.match(out, /Hosts traites : \(aucun\)/);
});

test('C1 — mode legacy claude-only (--target) : non-regression, un seul host', () => {
  const kits = makeKits();
  const legacy = tmp();
  const out = run(['--kits-dir', kits, '--target', legacy]);
  assert.match(out, /Hosts traites : claude/);
  assert.doesNotMatch(out, /host: codex/);
  assert.ok(exists(path.join(legacy, 'CLAUDE.md')));
  assert.ok(exists(path.join(legacy, 'hooks', 'identity-guard.mjs')));
});

test('C1 — --link : symlink par element (claude) + repli COPIE (codex) + merge jamais lie', () => {
  const kits = makeKits();
  const lclaude = tmp(); const lcodex = tmp();
  run(['--kits-dir', kits, '--hosts', 'claude,codex', '--target-claude', lclaude, '--target-codex', lcodex, '--link']);
  // claude : link-safe -> element symlinke
  assert.ok(fs.lstatSync(path.join(lclaude, 'hooks', 'identity-guard.mjs')).isSymbolicLink(), 'hook claude doit etre un lien');
  // codex : non link-safe -> repli COPIE (fichier reel, pas un lien)
  assert.ok(!fs.lstatSync(path.join(lcodex, 'hooks', 'codex-perimeter-guard.mjs')).isSymbolicLink(), 'hook codex doit etre une copie (repli)');
  // fichiers-merge JAMAIS lies, meme sous --link
  assert.ok(!fs.lstatSync(path.join(lclaude, 'CLAUDE.md')).isSymbolicLink(), 'CLAUDE.md jamais lie');
  assert.ok(!fs.lstatSync(path.join(lclaude, 'settings.json')).isSymbolicLink(), 'settings.json jamais lie');
});

test('C1 — OpenWebUI : bundle d import (functions+models), test_ exclu, jamais copie config', () => {
  const kits = makeKits();
  const owui = tmp();
  const out = run(['--kits-dir', kits, '--hosts', 'openwebui', '--target-openwebui', owui]);
  assert.ok(exists(path.join(owui, 'functions', 'iakaframe_identity_filter.py')), 'Function stagee');
  assert.ok(exists(path.join(owui, 'models', 'odin.json')), 'Model stage');
  assert.ok(!exists(path.join(owui, 'functions', 'test_identity_filter.py')), 'fichier test_ exclu du bundle');
  assert.match(out, /importer via OWUI admin\/API/);
});
