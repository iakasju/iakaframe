// CA-M16 (contrat-machine-du-verbe-install.md § 4 point 6 / § 8) — le TROU C-JSON des verbes hors
// `install` (M-10 : 40 verbes au registre, 57 occurrences de `--json`, 19 couverts par
// guard-json-output.test.js:NOMINAL avant ce lot) est DECLARE, MOTIVE, et CLIQUETE — jamais tu.
// Ce test NE FERME PAS ce trou (successeur nomme `C-JSON-COUVERTURE-COMPLETE`, § 4 « Exclu ») : il
// verifie que le registre `cli/test/fixtures/couverture-json.json` reste FIDELE a `verbes.js`
// (aucun verbe --json oublie, aucun motif manquant) et que le CLIQUET (`horsCouvertureCount`) est
// un geste EXPLICITE, jamais une derive silencieuse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERBES } from '../src/lib/verbes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(HERE, 'fixtures', 'couverture-json.json');

function chargerFixture() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

// AUTORITE (M-10) : un verbe "declare --json" si son PROPRE `options` le porte, OU si au moins un
// de ses `sousVerbes` le porte — jamais une liste reecrite ici, toujours DERIVEE de verbes.js.
function declareJson(v) {
  if (Array.isArray(v.options) && v.options.includes('--json')) return true;
  if (Array.isArray(v.sousVerbes)) return v.sousVerbes.some((sv) => Array.isArray(sv.options) && sv.options.includes('--json'));
  return false;
}

test('CA-M16 : la liste des verbes du registre correspond EXACTEMENT aux verbes déclarant --json dans verbes.js (aucun oubli, aucun fantôme)', () => {
  const fixture = chargerFixture();
  const idsAutorite = VERBES.filter(declareJson).map((v) => v.id).sort();
  const idsFixture = fixture.verbes.map((v) => v.id).sort();
  assert.deepEqual(idsFixture, idsAutorite, 'le registre de couverture doit porter EXACTEMENT les verbes qui déclarent --json (ni de plus, ni de moins)');
  // CONTREFACTUEL (joué et révoqué, cf. rapport de remise) : retirer une entrée du tableau
  // `verbes` de la fixture SANS retirer le verbe correspondant de verbes.js -> `idsFixture` et
  // `idsAutorite` divergent -> rouge, nommant l'id manquant (assert.deepEqual affiche le diff).
});

test('CA-M16 : `install` est couvert à la fois par c-json ET evenements (les deux rendus du même émetteur)', () => {
  const fixture = chargerFixture();
  const entree = fixture.verbes.find((v) => v.id === 'install');
  assert.ok(entree, 'install doit avoir une entrée dans le registre de couverture');
  assert.ok(entree.couverture.includes('c-json'), 'install doit être couvert par c-json (--json bufferisé)');
  assert.ok(entree.couverture.includes('evenements'), 'install doit être couvert par evenements (--events NDJSON)');
});

test('CA-M16 : chaque entrée "hors-couverture" porte un motif NON VIDE (jamais une exclusion silencieuse)', () => {
  const fixture = chargerFixture();
  const sansMotif = fixture.verbes.filter((v) => v.couverture.includes('hors-couverture') && !(typeof v.motif === 'string' && v.motif.trim().length > 0));
  assert.deepEqual(sansMotif.map((v) => v.id), [], `verbe(s) hors-couverture SANS motif : ${sansMotif.map((v) => v.id).join(', ')}`);
  // CONTREFACTUEL : ajouter au registre un verbe hors-couverture SANS motif (`motif: ''` ou champ
  // absent) -> `sansMotif` le contient -> rouge, NOMMANT l'id fautif.
});

test('CA-M16 : le CLIQUET (`horsCouvertureCount`) reflète le compte RÉEL — toute variation doit être un geste explicite dans le commit qui la fait', () => {
  const fixture = chargerFixture();
  const reel = fixture.verbes.filter((v) => v.couverture.includes('hors-couverture')).length;
  assert.equal(fixture.horsCouvertureCount, reel, 'le champ horsCouvertureCount doit être tenu à jour DANS LE MÊME COMMIT que toute entrée hors-couverture ajoutée/retirée — sinon la dérive est silencieuse');
  // CONTREFACTUEL (§ contrefactuel CA-M16 de l'instruction, joué en deux temps et révoqué) :
  //   1. ajouter au registre un verbe SANS motif           -> le test précédent rougit, le nommant.
  //   2. retirer un verbe présent dans verbes.js du registre -> LE PREMIER test de ce fichier
  //      rougit (idsFixture !== idsAutorite), nommant l'id manquant.
  //   Deux rouges DISTINCTS, chacun nommant son entrée — exactement ce que R-M8 exige de fermer.
});
