// Parite des generateurs de contrat CLI<->GUI (specs/instructions/parite-generateurs-contrat.md).
//
// Le CLI est la REFERENCE : ce test verrouille que `generateAgent(id)` == le golden FIGE
// `test/fixtures/agents-golden/<id>.md` (produit par scripts/gen-agents-golden.mjs). Le meme
// golden est vendore byte-a-byte dans iakaFrameGUI ; ses deux tests le comparent au rendu GUI.
// => Effet cliquet BILATERAL : toute derive de format casse ce test ICI et le test GUI la-bas,
//    tant que le golden n'est pas consciemment re-genere + re-vendore.
//
// Garde `sha256` : le hash declare dans l'en-tete du golden == sha256 du contenu utile. Une copie
// alteree a la main (ici ou cote GUI) echoue => la byte-identite cross-repo reste prouvable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generateAgent, loadDefaultBinding } from '../src/lib/generate-agents.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // vraie bibliotheque du depot iakaframe
const GOLDEN_DIR = path.join(HERE, 'fixtures', 'agents-golden');
const IDS = ['aragorn', 'feanor', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin'];

// Un golden = en-tete de provenance `<!-- ... -->` PUIS le contrat (`---\n...`). Le contenu utile
// commence au 1er `---\n` (le header n'en contient jamais). L'en-tete declare `sha256 : <hex>`.
function loadGolden(id) {
  const raw = fs.readFileSync(path.join(GOLDEN_DIR, `${id}.md`), 'utf8');
  const i = raw.indexOf('---\n');
  assert.ok(i > 0, `${id}: delimiteur de frontmatter introuvable`);
  const useful = raw.slice(i);
  const m = raw.slice(0, i).match(/^sha256\s*:\s*([0-9a-f]{64})\s*$/m);
  assert.ok(m, `${id}: en-tete sha256 introuvable`);
  return { useful, declaredSha: m[1] };
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

test('parite CLI : generateAgent(id) == golden fige (byte-a-byte) pour les 9 personas', () => {
  const binding = loadDefaultBinding(REPO);
  for (const id of IDS) {
    const { useful } = loadGolden(id);
    const rendered = generateAgent(id, { root: REPO, binding });
    assert.equal(rendered, useful, `${id}: rendu CLI != golden`);
  }
});

test('garde sha256 : le hash declare == sha256 du contenu utile (anti-alteration cross-repo)', () => {
  for (const id of IDS) {
    const { useful, declaredSha } = loadGolden(id);
    assert.equal(sha256(useful), declaredSha, `${id}: sha256 golden altere`);
  }
});

test('golden : 9 personas presentes dans le repertoire fige', () => {
  const files = fs.readdirSync(GOLDEN_DIR).filter((f) => f.endsWith('.md')).sort();
  assert.deepEqual(files, IDS.map((id) => `${id}.md`).sort());
});
