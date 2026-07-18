// Test de PARITE (strategie ALIGN, P2 §5) : le miroir cli/src/lib/vocab.js doit etre IDENTIQUE
// aux donnees canoniques de @iakaframe/core (packages/core/src/vocab.json, depot iakaFrameGUI).
// But : empecher la re-divergence CLI<->core constatee par l'audit.
//
// Le core vit dans un DEPOT VOISIN (iakaFrameGUI). En CI isolee (CLI seul), le fichier peut etre
// absent -> le test est alors SKIPPE (documente), jamais rouge. Override possible via la variable
// d'env IAKAFRAME_CORE_VOCAB (chemin absolu vers vocab.json).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as mirror from '../src/lib/vocab.js';

const here = path.dirname(fileURLToPath(import.meta.url)); // cli/test
const CANDIDATES = [
  process.env.IAKAFRAME_CORE_VOCAB,
  // depots voisins sous le meme dossier chapeau (~/work) :
  path.resolve(here, '..', '..', '..', 'iakaFrameGUI', 'packages', 'core', 'src', 'vocab.json'),
  path.resolve(here, '..', '..', '..', 'iakaframegui', 'packages', 'core', 'src', 'vocab.json'),
].filter(Boolean);

function findVocab() {
  for (const p of CANDIDATES) { try { if (fs.existsSync(p)) return p; } catch { /* ignore */ } }
  return null;
}

const vocabPath = findVocab();
const skip = vocabPath ? false : 'core vocab.json introuvable (depot iakaFrameGUI absent - CI isolee)';

test('parite miroir CLI <-> core vocab.json (enums + alias)', { skip }, () => {
  const core = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

  assert.deepEqual(mirror.HOST_KINDS, core.hostKinds, 'HOST_KINDS');
  assert.deepEqual(mirror.RUNNER_KINDS, core.runnerKinds, 'RUNNER_KINDS');
  assert.deepEqual(mirror.NODE_KINDS, core.nodeKinds, 'NODE_KINDS');
  assert.deepEqual(mirror.KIT_FORMATS, core.kitFormats, 'KIT_FORMATS');
  assert.deepEqual(mirror.TOOL_KINDS, core.toolKinds, 'TOOL_KINDS');
  assert.deepEqual(mirror.RUNNER_ALIASES, core.runnerAliases, 'RUNNER_ALIASES');
  assert.deepEqual(mirror.DEPRECATED_RUNNER_ALIASES, core.deprecatedRunnerAliases, 'DEPRECATED_RUNNER_ALIASES');
  assert.deepEqual(mirror.LEGACY_RUNNER_LAUNCHERS, core.legacyRunnerLaunchers, 'LEGACY_RUNNER_LAUNCHERS');
  assert.deepEqual(mirror.NODE_ALIASES, core.nodeAliases, 'NODE_ALIASES');
  assert.deepEqual(mirror.CONTRACT_FILE_BY_FORMAT, core.contractFileByFormat, 'CONTRACT_FILE_BY_FORMAT');
  assert.deepEqual(mirror.FORMAT_BY_NODE, core.formatByNode, 'FORMAT_BY_NODE');
  assert.deepEqual(mirror.KIT_NAME_BY_NODE, core.kitNameByNode, 'KIT_NAME_BY_NODE');
});

// Tests d'unite du miroir (independants du core, TOUJOURS actifs) : garantissent le comportement
// des normaliseurs meme en CI isolee.
test('normalizeRunner : renommages § 6.1 (claude-code/ps/iakaide -> claude) ; aider = launcher legacy', () => {
  // Renommage § 6.1 : claude-code -> claude ; ps/iakaide (deprecies) -> claude ; ollama-* splits.
  assert.deepEqual(mirror.normalizeRunner('ps'), { kind: 'claude', deprecated: true, legacyLauncher: null, raw: 'ps' });
  assert.deepEqual(mirror.normalizeRunner('iakaide'), { kind: 'claude', deprecated: true, legacyLauncher: null, raw: 'iakaide' });
  assert.deepEqual(mirror.normalizeRunner('claude-code'), { kind: 'claude', deprecated: false, legacyLauncher: null, raw: 'claude-code' });
  assert.deepEqual(mirror.normalizeRunner('ollama-localhost'), { kind: 'ollama-local', deprecated: false, legacyLauncher: null, raw: 'ollama-localhost' });
  assert.deepEqual(mirror.normalizeRunner('ollama-lan'), { kind: 'ollama-distant', deprecated: false, legacyLauncher: null, raw: 'ollama-lan' });
  assert.deepEqual(mirror.normalizeRunner('chatgpt'), { kind: 'chatgpt', deprecated: false, legacyLauncher: null, raw: 'chatgpt' });
  assert.deepEqual(mirror.normalizeRunner('aider'), { kind: null, deprecated: false, legacyLauncher: 'aider', raw: 'aider' });
  // codex : conserve en alias legacy (host dans le modele persona ; retro-compat launcher CLI).
  assert.deepEqual(mirror.normalizeRunner('codex'), { kind: 'codex', deprecated: false, legacyLauncher: null, raw: 'codex' });
  assert.equal(mirror.normalizeRunner('xxx').kind, null);
});

test('HOST_KINDS / RUNNER_KINDS / TOOL_KINDS : split host<->runner + notion tools (§ 5.2/6.1)', () => {
  assert.deepEqual(mirror.HOST_KINDS, ['claude', 'codex', 'openwebui']);
  assert.deepEqual(mirror.RUNNER_KINDS, ['claude', 'chatgpt', 'ollama-local', 'ollama-distant', 'litellm']);
  // litellm = runner de plein droit, JAMAIS un host ; chatgpt (pas openai) = runner OpenAI-compatible.
  assert.ok(mirror.RUNNER_KINDS.includes('litellm') && !mirror.HOST_KINDS.includes('litellm'));
  assert.ok(mirror.RUNNER_KINDS.includes('chatgpt') && !mirror.RUNNER_KINDS.includes('openai'));
  // anythingllm : hors modele, absent de toute enum.
  for (const e of [mirror.HOST_KINDS, mirror.RUNNER_KINDS, mirror.NODE_KINDS]) {
    assert.ok(!e.includes('anythingllm'), 'anythingllm doit etre absent des enums');
  }
  // notion de tools presente (registre MVP, ids libres).
  assert.ok(Array.isArray(mirror.TOOL_KINDS));
});

test('normalizeNode : ollama -> ollama-localhost (deprecie) ; lan explicite', () => {
  assert.deepEqual(mirror.normalizeNode('ollama'), { node: 'ollama-localhost', deprecated: true, raw: 'ollama' });
  assert.deepEqual(mirror.normalizeNode('ollama-lan'), { node: 'ollama-lan', deprecated: false, raw: 'ollama-lan' });
  assert.deepEqual(mirror.normalizeNode('claude'), { node: 'claude', deprecated: false, raw: 'claude' });
  assert.equal(mirror.normalizeNode('foo').node, null);
});

test('contractFileForNode / kitNameForNode : format et nœud distincts', () => {
  assert.equal(mirror.contractFileForNode('claude'), 'CLAUDE.md');
  assert.equal(mirror.contractFileForNode('codex'), 'AGENTS.md');
  assert.equal(mirror.contractFileForNode('ollama-localhost'), 'AGENTS.md');
  assert.equal(mirror.contractFileForNode('ollama-lan'), 'AGENTS.md');
  assert.equal(mirror.kitFormatForNode('claude'), 'claude-md');
  assert.equal(mirror.kitNameForNode('claude'), 'kit-claude');
  assert.equal(mirror.kitNameForNode('ollama-lan'), 'kit-ollama');
});
