// Le paquet publie embarque le reservoir (cli/_bundled). Un bundle AMPUTE est le defaut
// repare ici : `teams` et `bindings` manquaient a la liste des assets, donc l'install npm
// livrait les personas sans les equipes qui les assemblent — sans que rien ne le signale.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = fs.readFileSync(path.join(REPO, 'cli', 'scripts', 'bundle.js'), 'utf8');

test('les trois types d assemblage sont embarques, et requis', () => {
  // `list`/`add`/`remove` traitent teams | methods | bindings : les trois doivent partir
  // dans le tarball, sinon la bibliotheque publiee est incoherente avec le CLI publie.
  for (const a of ['library', 'methods', 'teams', 'bindings', 'kits']) {
    assert.match(
      script,
      new RegExp(`name:\\s*'${a}',\\s*required:\\s*true`),
      `${a} doit etre un asset REQUIS du bundle`,
    );
  }
});

test('le bundle refuse de se produire ampute (garde explicite)', () => {
  assert.match(script, /bundle REFUSE : asset\(s\) requis manquant/);
  assert.match(script, /process\.exit\(1\)/);
});

test('coherence roster : un persona cite et absent fait echouer le bundle', () => {
  assert.match(script, /persona\(s\) cite\(s\) au roster et absent\(s\) du bundle/);
});

test('si le bundle est genere sur ce poste, il est coherent', () => {
  const bundled = path.join(REPO, 'cli', '_bundled');
  if (!fs.existsSync(bundled)) return; // _bundled est gitignore : absent en clone frais
  const personas = new Set(
    fs.readdirSync(path.join(bundled, 'library', 'personas'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -3)),
  );
  const teamsDir = path.join(bundled, 'teams');
  assert.ok(fs.existsSync(teamsDir), 'teams doit etre embarque');
  for (const f of fs.readdirSync(teamsDir).filter((x) => x.endsWith('.md'))) {
    const m = fs.readFileSync(path.join(teamsDir, f), 'utf8').match(/^personas:\s*\[(.*?)\]/m);
    if (!m) continue;
    for (const id of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
      assert.ok(personas.has(id), `${f} cite « ${id} », absent des personas bundles`);
    }
  }
});
