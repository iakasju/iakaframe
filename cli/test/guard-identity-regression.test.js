// Test de NON-REGRESSION du referentiel Claude (Lot 0). Prouve que le refactor de
// identity-guard.mjs (extraction de la logique vers guard-core) ne change RIEN au comportement :
// on execute l'ANCIENNE version (baseline figee = la version pre-refactor, self-contained, capturee
// depuis git main dans cli/baselines/guard/identity-guard.baseline.mjs) ET la version REFACTOREE sur les
// MEMES transcripts, et on exige des codes de sortie IDENTIQUES.
//
// Rappel semantique : exit 0 = allow (badges OK ou rien a juger), exit 2 = refus (badge manquant).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REFACTORED = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks', 'identity-guard.mjs');
// Baseline stockee HORS de test/ : le runner node --test execute tout .mjs sous test/, or ce hook
// lit stdin -> l'executer comme test le ferait pendre. On la garde donc sous cli/baselines/.
const BASELINE = path.resolve(here, '..', 'baselines', 'guard', 'identity-guard.baseline.mjs');
const FIX = (name) => path.resolve(here, 'fixtures', 'guard', name);

// Lance un hook d'identite Claude en lui passant un payload {transcript_path} sur stdin.
function runHook(hookPath, transcriptFixture) {
  const payload = JSON.stringify({ transcript_path: FIX(transcriptFixture) });
  const res = spawnSync(process.execPath, [hookPath], { input: payload, encoding: 'utf8' });
  return res.status;
}

// (fixture transcript, code de sortie attendu)
const CASES = [
  ['claude-conforme.jsonl', 0],
  ['claude-missing-close.jsonl', 2],
  ['claude-missing-open.jsonl', 2],
  ['claude-malformed.jsonl', 0],
];

for (const [fixture, expected] of CASES) {
  test(`non-regression identity-guard : ${fixture} -> baseline == refactor (exit ${expected})`, () => {
    const oldCode = runHook(BASELINE, fixture);
    const newCode = runHook(REFACTORED, fixture);
    assert.equal(newCode, oldCode, `${fixture} : refactor (${newCode}) != baseline (${oldCode})`);
    assert.equal(newCode, expected, `${fixture} : exit ${newCode}, attendu ${expected}`);
  });
}

test('non-regression identity-guard : stdin vide -> exit 0 (fail-open, baseline == refactor)', () => {
  const oldRes = spawnSync(process.execPath, [BASELINE], { input: '', encoding: 'utf8' });
  const newRes = spawnSync(process.execPath, [REFACTORED], { input: '', encoding: 'utf8' });
  assert.equal(newRes.status, oldRes.status);
  assert.equal(newRes.status, 0);
});
