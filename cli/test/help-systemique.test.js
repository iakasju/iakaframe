// Garde SYSTEMIQUE de `<verbe> --help` : les verbes qui plantaient sur leur propre --help
// (ERR_PARSE_ARGS_UNKNOWN_OPTION + stack nue) doivent desormais rendre une aide propre et sortir 0.
// Meme exigence que jalon-help.test.js, generalisee au lot corrige (fix/help-systemique) : lecture
// pilotee par index.js -> couvre aussi les verbes async (onboard/update/repo). L'appel via
// execFileSync leve si exitCode != 0 : le simple appel est deja une assertion d'exit 0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');

// Verbes qui plantaient sur --help avant ce lot (confirme par test reel "plantait avant").
// `canaux` (lot 0) rejoint la liste : tout verbe neuf doit naitre avec une aide propre, sinon la
// garde ne serait qu'une photographie d'un lot passe.
const VERBS = ['snapshot', 'update', 'onboard', 'repo', 'switch', 'list', 'show', 'add', 'assemble', 'banner', 'canaux'];

function run(args) {
  return execFileSync('node', [CLI, ...args], { cwd: REPO, encoding: 'utf8' });
}

for (const verb of VERBS) {
  test(`${verb} --help : aide propre, exit 0, aucune stack`, () => {
    // execFileSync leve si exit != 0 -> l'appel EST l'assertion d'exit 0.
    const out = run([verb, '--help']);
    assert.ok(out.trim().length > 0, 'la sortie ne doit pas etre vide');
    // Ligne d'usage presente + le verbe cite (switch mene son usage sous l'alias `use`).
    assert.ok(/Usage : iakaframe/.test(out), `doit rendre une ligne Usage pour ${verb}`);
    assert.ok(out.includes(verb), `l'aide doit mentionner le verbe ${verb}`);
    assert.ok(!/ERR_PARSE_ARGS_UNKNOWN_OPTION/.test(out), 'aucune erreur de parse');
    assert.ok(!/^\s+at \w/m.test(out), 'aucune trace de stack (lignes "at ...")');
  });
}
