// Test de PARITE runner-agnostique (Lot 0 + Lot 1, calque sur vocab-parity.test.js / strategie
// ALIGN). Deux garanties :
//   1) SOURCE : le guard-core.mjs du kit Codex est OCTET POUR OCTET identique a celui du kit Claude
//      (la regle des badges vit a UN seul endroit ; pas de re-divergence entre runners) ;
//   2) VERDICT : pour un MEME tour de parole, l'adaptateur Claude et l'adaptateur Codex rendent le
//      MEME code de sortie (le verdict est identique quel que soit le runner) — c'est la parite
//      d'enforcement visee par l'instruction.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_CORE = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks', 'guard-core.mjs');
const CODEX_CORE = path.resolve(here, '..', '..', 'kits', 'iakaframe-codex', 'global', 'hooks', 'guard-core.mjs');
const CLAUDE_ADAPTER = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks', 'identity-guard.mjs');
const CODEX_ADAPTER = path.resolve(here, '..', '..', 'kits', 'iakaframe-codex', 'global', 'hooks', 'codex-identity-guard.mjs');
const FIX = (name) => path.resolve(here, 'fixtures', 'guard', name);

// --- 1) parite SOURCE du coeur (ALIGN) --------------------------------------

test('parite ALIGN : guard-core.mjs kit-codex == kit-claude (byte-identique)', () => {
  const claude = fs.readFileSync(CLAUDE_CORE);
  const codex = fs.readFileSync(CODEX_CORE);
  assert.ok(claude.equals(codex),
    'guard-core.mjs a diverge entre kit-claude et kit-codex — re-synchroniser (copie unique).');
});

// --- 2) parite du VERDICT entre adaptateurs runner --------------------------

function runClaude(transcriptFixture) {
  const payload = JSON.stringify({ transcript_path: FIX(transcriptFixture) });
  return spawnSync(process.execPath, [CLAUDE_ADAPTER], { input: payload, encoding: 'utf8' }).status;
}
function runCodex(payloadFixture) {
  const payload = fs.readFileSync(FIX(payloadFixture), 'utf8');
  return spawnSync(process.execPath, [CODEX_ADAPTER], { input: payload, encoding: 'utf8' }).status;
}

// Paires (cas logique identique) : transcript Claude <-> payload Codex, code attendu.
const PAIRS = [
  ['conforme', 'claude-conforme.jsonl', 'codex-conforme.json', 0],
  ['missing-close', 'claude-missing-close.jsonl', 'codex-missing-close.json', 2],
  ['missing-open', 'claude-missing-open.jsonl', 'codex-missing-open.json', 2],
  ['malformed', 'claude-malformed.jsonl', 'codex-malformed.json', 0],
];

for (const [name, claudeFix, codexFix, expected] of PAIRS) {
  test(`parite verdict core<->runner : ${name} -> Claude == Codex (exit ${expected})`, () => {
    const claudeCode = runClaude(claudeFix);
    const codexCode = runCodex(codexFix);
    assert.equal(codexCode, claudeCode,
      `${name} : verdict Codex (${codexCode}) != verdict Claude (${claudeCode})`);
    assert.equal(claudeCode, expected, `${name} : exit ${claudeCode}, attendu ${expected}`);
  });
}

// --- 3) cas de refus e2e cote Codex (critere §8.2 du pilote) ----------------

test('refus e2e Codex : reponse sans badge de cloture -> exit 2 + stderr nommant le badge', () => {
  const payload = fs.readFileSync(FIX('codex-missing-close.json'), 'utf8');
  const res = spawnSync(process.execPath, [CODEX_ADAPTER], { input: payload, encoding: 'utf8' });
  assert.equal(res.status, 2, 'un refus doit sortir en exit 2');
  assert.match(res.stderr, /identite iakaframe \(Codex\)/);
  assert.match(res.stderr, /cloture/);
});

test('fail-open e2e Codex : stdin vide -> exit 0', () => {
  const res = spawnSync(process.execPath, [CODEX_ADAPTER], { input: '', encoding: 'utf8' });
  assert.equal(res.status, 0);
});
