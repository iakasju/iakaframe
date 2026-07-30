// Garde du verbe `jalon` : `iakaframe jalon --help` doit rendre une aide propre et sortir 0,
// JAMAIS lever ERR_PARSE_ARGS_UNKNOWN_OPTION avec une stack nue (nit backlog L75). Le jalon est
// un verbe de la methode cite par les 9 personas : il ne doit pas casser sur son propre --help.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runJalon } from '../src/commands/jalon.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');

function run(args, opts = {}) {
  return execFileSync('node', [CLI, ...args], { cwd: REPO, encoding: 'utf8', ...opts });
}

test('jalon --help : sortie usage, exit 0, aucune stack', () => {
  // execFileSync leve si exitCode != 0 : le simple appel est deja une assertion d'exit 0.
  const out = run(['jalon', '--help']);
  assert.ok(out.includes('Usage : iakaframe jalon'), 'doit rendre une ligne Usage');
  assert.ok(/--validated/.test(out), 'doit lister les options du verbe');
  assert.ok(!/ERR_PARSE_ARGS_UNKNOWN_OPTION/.test(out), 'aucune erreur de parse');
  assert.ok(!/\bat \w/.test(out), 'aucune trace de stack (lignes "at ...")');
});

test('runJalon(["--help"]) : ne throw pas (regression directe du nit L75)', () => {
  assert.doesNotThrow(() => runJalon(['--help']));
});
