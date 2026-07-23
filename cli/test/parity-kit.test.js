// Test de PARITE core<->CLI (GAP c). La sortie de `assemble --write` du CLI doit etre IDENTIQUE,
// byte-a-byte, a la forme canonique produite par @iakaframe/core (serializeKitMd) pour un kit
// claude. L'ancre est le golden `fixtures/kit.iakaframe-claude.golden.md`, lui-meme calque sur
// packages/core/__tests__/fixtures/kit.iakaframe-claude.md (depot iakaFrameGUI). Ce test empeche
// la re-divergence du format (quoting des listes, emits en globs, id <methodId>-<node>).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble, serializeKit, emitsForNode } from '../src/lib/library.js';
import { parseFrontmatter } from '../src/lib/frontmatter.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // vraie bibliotheque du depot iakaframe
const GOLDEN = path.join(HERE, 'fixtures', 'kit.iakaframe-claude.golden.md');
const KIT_CANON = path.join(REPO, 'kits', 'iakaframe-claude.md');

// Retire l'en-tete de documentation du golden (tout ce qui precede la 1re ligne `---`).
function expectedFromGolden() {
  const raw = fs.readFileSync(GOLDEN, 'utf8');
  const i = raw.indexOf('---\n');
  assert.ok(i >= 0, 'golden : delimiteur de frontmatter introuvable');
  return raw.slice(i);
}

test('parite core<->CLI : assemble iakaframe/iakaframe-8 == golden (byte-a-byte)', () => {
  const res = assemble('iakaframe', 'iakaframe-8', null, REPO, { node: 'claude' });
  assert.equal(res.ok, true, res.error || 'assemblage attendu OK');
  // Le corps est THREADE depuis le canon (miroir de kitMd.test.ts:37-41 du coeur, qui injecte le
  // corps parse de la fixture) : serializeKit ne genere plus un stub, il fait traverser le corps
  // authored de kits/iakaframe-claude.md. Le golden = ce corps ; l'egalite byte reste verrouillee.
  const body = parseFrontmatter(fs.readFileSync(KIT_CANON, 'utf8')).body;
  const out = serializeKit(res.descriptor, body);
  assert.equal(out, expectedFromGolden());
});

test('emitsForNode : globs claude (parite coeur) + repli contrat sur autre noeud', () => {
  assert.deepEqual(emitsForNode('claude'),
    ['.claude/agents/*', '.claude/skills/*', '.claude/hooks/*', 'CLAUDE.md']);
  assert.deepEqual(emitsForNode('codex'), ['AGENTS.md']);
});
