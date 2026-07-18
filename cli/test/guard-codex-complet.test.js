// Tests du Lot A1 — Codex COMPLET (perimetre + delegation). Deux garanties, calquees sur
// guard-core-parity.test.js :
//   1) PARITE core<->runner : pour un MEME cas logique, l'adaptateur Claude et l'adaptateur Codex
//      rendent le MEME code de sortie (le verdict est identique quel que soit le host) ;
//   2) REFUS e2e cote Codex : un geste hors perimetre / une delegation hors roster sortent en
//      exit 2 avec un message stderr ; un payload illisible sort en exit 0 (fail-open prouve).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const K = (kit, name) => path.resolve(here, '..', '..', 'kits', kit, 'global', 'hooks', name);
const CLAUDE_PERIM = K('iakaframe-claude', 'perimeter-guard.mjs');
const CODEX_PERIM = K('iakaframe-codex', 'codex-perimeter-guard.mjs');
const CLAUDE_DELEG = K('iakaframe-claude', 'delegation-guard.mjs');
const CODEX_DELEG = K('iakaframe-codex', 'codex-delegation-guard.mjs');
const FIX = (name) => path.resolve(here, 'fixtures', 'guard', name);

const PROJECT = path.resolve(os.tmpdir(), 'iakaframe-codex-a1-project');
const HOME = os.homedir();
const CLAUDE_HARNESS = path.join(HOME, '.claude', 'settings.json');
const CODEX_HARNESS = path.join(HOME, '.codex', 'config.toml');

function runPerim(hookPath, payload, { host, withProjectDir = true } = {}) {
  const env = { ...process.env, IAKAFRAME_PERIMETER_MODE: 'deny' };
  const key = host === 'codex' ? 'CODEX_PROJECT_DIR' : 'CLAUDE_PROJECT_DIR';
  if (withProjectDir) env[key] = PROJECT; else delete env[key];
  const res = spawnSync(process.execPath, [hookPath], { input: JSON.stringify(payload), encoding: 'utf8', env });
  return res;
}

const pre = (tool, tool_input) => ({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input, cwd: PROJECT });

// --- 1) PERIMETRE — parite core<->runner (payload portable Claude<->Codex) ---

const PERIM_PORTABLE = [
  ['ecriture dans le projet -> allow', pre('Write', { file_path: path.join(PROJECT, 'src/a.js') }), 0],
  ['ecriture hors projet -> deny', pre('Write', { file_path: '/etc/hosts' }), 2],
  ['commande chemin absolu hors projet -> deny', pre('Bash', { command: 'cat ' + path.join(HOME, 'secret.txt') }), 2],
  ['commande sans chemin absolu -> allow', pre('Bash', { command: 'ls -la' }), 0],
];

for (const [name, payload, expected] of PERIM_PORTABLE) {
  test(`parite perimetre core<->runner : ${name} (exit ${expected})`, () => {
    const claude = runPerim(CLAUDE_PERIM, payload, { host: 'claude' }).status;
    const codex = runPerim(CODEX_PERIM, payload, { host: 'codex' }).status;
    assert.equal(codex, claude, `${name} : Codex (${codex}) != Claude (${claude})`);
    assert.equal(claude, expected, `${name} : exit ${claude}, attendu ${expected}`);
  });
}

// Harnais reserve humain : fichier host-specifique, MEME verdict DENY_HARNESS -> exit 2 des deux.
test('parite perimetre : ecriture du harnais reserve humain -> deny des deux hosts', () => {
  const claude = runPerim(CLAUDE_PERIM, pre('Write', { file_path: CLAUDE_HARNESS }), { host: 'claude' }).status;
  const codex = runPerim(CODEX_PERIM, pre('Write', { file_path: CODEX_HARNESS }), { host: 'codex' }).status;
  assert.equal(claude, 2, 'Claude : ~/.claude/settings.json -> DENY_HARNESS (exit 2)');
  assert.equal(codex, 2, 'Codex : ~/.codex/config.toml -> DENY_HARNESS (exit 2)');
});

// Fail-open sur absence TOTALE d'ancrage projet (Claude : pas de $CLAUDE_PROJECT_DIR ; Codex : ni
// $CODEX_PROJECT_DIR, ni cwd/workspace dans le payload) -> SKIP/allow des deux hosts.
// NB : divergence assumee et documentee (entete de l'adaptateur) — Codex, faute d'env projet stable
// upstream, retombe sur le cwd/workspace du payload s'il est present ; sans AUCUN ancrage il skip.
test('parite perimetre : sans AUCUN ancrage projet -> skip/allow des deux hosts', () => {
  const noCwd = { hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: '/etc/hosts' } };
  const claude = runPerim(CLAUDE_PERIM, noCwd, { host: 'claude', withProjectDir: false }).status;
  const codex = runPerim(CODEX_PERIM, noCwd, { host: 'codex', withProjectDir: false }).status;
  assert.equal(claude, 0);
  assert.equal(codex, 0);
});

// --- 2) DELEGATION — parite core<->runner (fixtures Codex, payload lu tel quel par les 2 hosts) ---

function runDeleg(hookPath, fixtureName) {
  const payload = fs.readFileSync(FIX(fixtureName), 'utf8');
  return spawnSync(process.execPath, [hookPath], { input: payload, encoding: 'utf8' });
}

const DELEG_PAIRS = [
  ['agent du roster -> allow', 'codex-deleg-roster.json', 0],
  ['agent hors roster -> refuse', 'codex-deleg-horsroster.json', 2],
  ['audit PostToolUse -> allow', 'codex-deleg-audit.json', 0],
  ['payload sans agent -> fail-open', 'codex-deleg-malformed.json', 0],
];

for (const [name, fixture, expected] of DELEG_PAIRS) {
  test(`parite delegation core<->runner : ${name} (exit ${expected})`, () => {
    const claude = runDeleg(CLAUDE_DELEG, fixture).status;
    const codex = runDeleg(CODEX_DELEG, fixture).status;
    assert.equal(codex, claude, `${name} : Codex (${codex}) != Claude (${claude})`);
    assert.equal(claude, expected, `${name} : exit ${claude}, attendu ${expected}`);
  });
}

// --- 3) REFUS e2e cote Codex + fail-open -------------------------------------

test('refus e2e Codex perimetre : ecriture hors projet -> exit 2 + stderr nommant le chemin', () => {
  const res = runPerim(CODEX_PERIM, pre('Write', { file_path: '/etc/hosts' }), { host: 'codex' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /codex-perimeter-guard/);
  assert.match(res.stderr, /etc\/hosts/);
});

test('refus e2e Codex delegation : agent hors roster -> exit 2 + stderr nommant le roster', () => {
  const res = runDeleg(CODEX_DELEG, 'codex-deleg-horsroster.json');
  assert.equal(res.status, 2);
  assert.match(res.stderr, /codex-delegation-guard/);
  assert.match(res.stderr, /roster iakaframe/);
});

test('fail-open e2e Codex : stdin vide -> exit 0 (perimetre + delegation)', () => {
  const perim = spawnSync(process.execPath, [CODEX_PERIM], { input: '', encoding: 'utf8' });
  const deleg = spawnSync(process.execPath, [CODEX_DELEG], { input: '', encoding: 'utf8' });
  assert.equal(perim.status, 0);
  assert.equal(deleg.status, 0);
});
