// Test de NON-REGRESSION du garde de PERIMETRE Claude (Lot 0). Comme pour l'identite : on execute
// la baseline pre-refactor (self-contained) ET la version refactoree (qui delegue le verdict a
// guard-core.verdictPerimeter) sur les MEMES payloads PreToolUse, et on exige des codes de sortie
// IDENTIQUES. Mode force a "deny" pour un verdict deterministe (tout blocage sort en exit 2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REFACTORED = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks', 'perimeter-guard.mjs');
const BASELINE = path.resolve(here, '..', 'baselines', 'guard', 'perimeter-guard.baseline.mjs');

const PROJECT = path.resolve(os.tmpdir(), 'iakaframe-perimeter-fixture-project');
const HARNESS = path.join(os.homedir(), '.claude', 'settings.json');

function run(hookPath, payload, { withProjectDir = true } = {}) {
  const env = { ...process.env, IAKAFRAME_PERIMETER_MODE: 'deny' };
  if (withProjectDir) env.CLAUDE_PROJECT_DIR = PROJECT;
  else delete env.CLAUDE_PROJECT_DIR;
  const res = spawnSync(process.execPath, [hookPath], { input: JSON.stringify(payload), encoding: 'utf8', env });
  return res.status;
}

const pre = (tool, tool_input) => ({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input, cwd: PROJECT });

// (nom, payload, options, code attendu)
const CASES = [
  ['Edit dans le projet -> allow', pre('Edit', { file_path: path.join(PROJECT, 'src/a.js') }), {}, 0],
  ['Edit hors projet -> deny', pre('Edit', { file_path: '/etc/hosts' }), {}, 2],
  ['Write settings harnais -> deny', pre('Write', { file_path: HARNESS }), {}, 2],
  ['Bash chemin absolu hors projet -> deny', pre('Bash', { command: 'cat ' + path.join(os.homedir(), 'secret.txt') }), {}, 2],
  ['Bash sans chemin absolu -> allow', pre('Bash', { command: 'ls -la' }), {}, 0],
  ['sans CLAUDE_PROJECT_DIR -> skip/allow', pre('Edit', { file_path: '/etc/hosts' }), { withProjectDir: false }, 0],
];

for (const [name, payload, opts, expected] of CASES) {
  test(`non-regression perimeter-guard : ${name} (exit ${expected})`, () => {
    const oldCode = run(BASELINE, payload, opts);
    const newCode = run(REFACTORED, payload, opts);
    assert.equal(newCode, oldCode, `${name} : refactor (${newCode}) != baseline (${oldCode})`);
    assert.equal(newCode, expected, `${name} : exit ${newCode}, attendu ${expected}`);
  });
}
