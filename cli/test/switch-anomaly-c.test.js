// Anomalie C corrigee (R8 D6/C16/C17) : `switch`/`use` deploie le CONTRAT GENERE (frontmatter
// Claude Code valide + skills: resolues), JAMAIS la persona brute ; et il produit le MEME ensemble
// contrat+skills que `agents generate`/`resolveSkills` (parite des deux chemins). Tout en tmpdir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSwitch } from '../src/commands/switch.js';
import { generateAgent, loadDefaultBinding } from '../src/lib/generate-agents.js';
import { resolveSkills } from '../src/lib/resolve-skills.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');

test('C16/C17 switch : contrat genere byte-identique a agents generate + skills resolues (jamais la persona brute)', () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-switch-'));
  runSwitch(['iakaframe', 'iakaframe-8', '--path', proj, '--root', REPO, '--json']);

  const binding = loadDefaultBinding(REPO);
  const deployed = fs.readFileSync(path.join(proj, '.claude', 'agents', 'gimli.md'), 'utf8');
  // C16 : byte-identique au contrat genere (jamais la persona brute qui porte roleKey/royaume/...).
  assert.equal(deployed, generateAgent('gimli', { root: REPO, binding }), 'switch != contrat genere');
  assert.match(deployed, /^name: gimli$/m);
  assert.match(deployed, /^skills: \[iakaframe-fabrication,/m);
  // aucun champ persona-only ne fuit au runtime
  for (const forbidden of [/^roleKey:/m, /^royaume:/m, /^pastille:/m, /^vignette:/m]) {
    assert.doesNotMatch(deployed, forbidden, 'un champ persona-only a fuite au runtime');
  }

  // C17 : les skills resolues de gimli (7, jalon inclus) sont toutes deployees par switch.
  for (const s of resolveSkills('gimli', { root: REPO })) {
    assert.ok(fs.existsSync(path.join(proj, '.claude', 'skills', s, 'SKILL.md')), `skill ${s} non deployee par switch`);
  }
  fs.rmSync(proj, { recursive: true, force: true });
});
