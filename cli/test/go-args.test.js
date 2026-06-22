import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiderArgs } from '../src/commands/go.js';

test('aider interactif : juste --no-auto-commits', () => {
  assert.deepEqual(aiderArgs(), ['--no-auto-commits']);
  assert.deepEqual(aiderArgs({}), ['--no-auto-commits']);
});

test('aider avec modele', () => {
  assert.deepEqual(aiderArgs({ model: 'ollama/llama3' }),
    ['--no-auto-commits', '--model', 'ollama/llama3']);
});

test('aider one-shot avec tache', () => {
  assert.deepEqual(aiderArgs({ task: 'applique specs/instructions/x.md' }),
    ['--no-auto-commits', '--yes', '--message', 'applique specs/instructions/x.md']);
});

test('aider one-shot sanitise les caracteres shell dangereux', () => {
  const args = aiderArgs({ task: 'fais $(rm -rf /) ; "x" & `y`' });
  const msg = args[args.indexOf('--message') + 1];
  assert.doesNotMatch(msg, /["`$;|&<>]/);
  assert.ok(args.includes('--no-auto-commits') && args.includes('--yes'));
});

test('aider : modele + tache combines', () => {
  assert.deepEqual(aiderArgs({ task: 'go', model: 'ollama/qwen' }),
    ['--no-auto-commits', '--model', 'ollama/qwen', '--yes', '--message', 'go']);
});
