// Garde de parite des skills (R8, deploiement-skills-runtime.md § 5.7, C19/C20).
// Le manifeste REGENERE a la volee doit egaler le golden FIGE : toute derive non regeneree
// (un subskills:/layer: de skill OU un skills: de persona modifie) casse ce test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest, serializeManifest, iakaframeSkillIds } from '../scripts/gen-skills-golden.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const GOLDEN = path.join(HERE, 'fixtures', 'skills-golden', 'manifest.json');

test('C20 manifeste regenere == golden fige (byte-a-byte)', () => {
  const golden = fs.readFileSync(GOLDEN, 'utf8');
  const live = serializeManifest(buildManifest(REPO));
  assert.equal(live, golden,
    'derive skills non regeneree : lancer `node cli/scripts/gen-skills-golden.mjs`');
});

test('C20bis modifier un subskills sans regenerer => rouge (le golden fige connait la resolution)', () => {
  // On lit le golden fige et on prouve qu'il encode la resolution transitive de gimli (7).
  const m = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  assert.deepEqual(m.resolution.gimli, [
    'iakaframe-fabrication', 'iakaframe-gestion-de-source', 'iakaframe-git', 'iakaframe-forgejo',
    'iakaframe-conteneurisation', 'iakaframe-docker', 'iakaframe-jalon',
  ]);
  // ... et l'inventaire fige le layer capacity de jalon (D3/C19).
  const jalon = m.skills.find((s) => s.id === 'iakaframe-jalon');
  assert.equal(jalon.layer, 'capacity', 'jalon doit porter layer: capacity dans le golden');
});

test('C19 jalon declare layer: capacity (source vivante)', () => {
  const raw = fs.readFileSync(path.join(REPO, 'library', 'skills', 'iakaframe-jalon', 'SKILL.md'), 'utf8');
  assert.match(raw, /^layer: capacity$/m);
});

test('compteurs : domaine iakaframe = 26 skills, roster = 9 personas', () => {
  const m = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  assert.equal(m.counts.skills, 26);
  assert.equal(m.counts.personas, 9);
  assert.equal(iakaframeSkillIds(REPO).length, 26, 'compte canon iakaframe skills == 26');
});
