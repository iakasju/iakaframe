// R-1 — CABLAGE des tests de la skill iakaframe-appflowy-doc dans la chaine.
//
// Le fichier library/skills/iakaframe-appflowy-doc/test.mjs porte les garanties du modele
// iakadoc (B1 gabarits, B2 workspace explicite, J1 depth>=6, J3 is_locked, garde 90 · Notes,
// mapper Markdown). Il n'etait joue par AUCUNE chaine : `npm test` tourne `node --test` depuis
// cli/, la CI cli-ci.yml aussi, et il n'existe pas de package.json a la racine. Une regression
// de ces garanties passait donc au vert.
//
// Voie retenue : PONT. On importe les cas exportes par test.mjs et on les enregistre un par un
// dans node:test. Zero reecriture des 72 cas, granularite conservee (1 cas = 1 test node),
// une seule source de verite, `node test.mjs` reste utilisable en direct.
//
// La skill vit hors de cli/ : la CI doit donc aussi se declencher sur library/** (cf.
// .forgejo/workflows/cli-ci.yml, paths).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cases } from '../../library/skills/iakaframe-appflowy-doc/test.mjs';

// Garde de cablage : si l'export disparait ou se vide, ce test rougit AVANT que le silence
// ne s'installe. Le seuil est un plancher, pas un compte fige (on peut ajouter des cas).
test('appflowy-doc : les cas de la skill sont bien cables dans la chaine', () => {
  assert.ok(Array.isArray(cases), 'test.mjs doit exporter un tableau `cases`');
  // Plancher releve a 205 au lot 5 bis (+4 : les 3 cas A1 a trois dimensions et la garde de
  // fidelite du double sur is_locked). Un plancher qui ne monte pas avec le corpus finit par
  // ne plus mordre.
  assert.ok(cases.length >= 205, `cas cables : ${cases.length} (plancher 205)`);
  for (const [name, fn] of cases) {
    assert.equal(typeof name, 'string');
    assert.equal(typeof fn, 'function');
  }
});

for (const [name, fn] of cases) {
  test(`[appflowy-doc] ${name}`, fn);
}
