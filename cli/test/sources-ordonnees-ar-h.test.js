// Garde AR-H (chaine-complete-install-amorcage-dmg-msi.md § 4.0) — sources RESEAU ordonnees de
// l'etape 1 (repli quand AUCUN reservoir vivant local n'est trouve). Sondes INJECTEES : ce test
// ne depend JAMAIS du reseau reel (deterministe, jouable hors ligne).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourcesOrdonneesCli } from '../src/commands/install.js';

function injoignable(nom) { return async () => ({ nom, repond: false }); }
function repond(nom, version) { return async () => ({ nom, repond: true, exploitable: true, version }); }
function repondInexploitable(nom) { return async () => ({ nom, repond: true, exploitable: false }); }

test('AR-H : la PREMIERE source exploitable gagne, et est NOMMEE', async () => {
  const { retenue, essais } = await sourcesOrdonneesCli({
    sondes: [repond('tarball GitHub', '0.40.0'), repond('registre npm NAS', '0.41.0')],
  });
  assert.equal(retenue.nom, 'tarball GitHub');
  assert.equal(retenue.version, '0.40.0');
  assert.equal(essais.length, 1, 'la source suivante n\'est PAS sondee une fois la premiere exploitable trouvee');
});

test('AR-H : une source INJOIGNABLE est nommee, jamais silencieuse — le repli suivant est essaye', async () => {
  const { retenue, essais } = await sourcesOrdonneesCli({
    sondes: [injoignable('tarball GitHub'), repond('registre npm NAS (voie LAN)', '0.39.0')],
  });
  assert.equal(retenue.nom, 'registre npm NAS (voie LAN)');
  assert.equal(essais.length, 2);
  assert.equal(essais[0].nom, 'tarball GitHub');
  assert.equal(essais[0].repond, false);
});

test('AR-H : une source qui repond mais rend un manifeste INEXPLOITABLE ne gagne pas (200 ne suffit pas)', async () => {
  const { retenue, essais } = await sourcesOrdonneesCli({
    sondes: [repondInexploitable('tarball GitHub'), repond('registre npm NAS', '0.39.0')],
  });
  assert.equal(retenue.nom, 'registre npm NAS');
  assert.equal(essais[0].exploitable, false);
});

test('AR-H : AUCUNE source exploitable -> retenue null, toutes NOMMEES dans le rapport', async () => {
  const { retenue, essais } = await sourcesOrdonneesCli({
    sondes: [injoignable('tarball GitHub'), injoignable('registre npm NAS')],
  });
  assert.equal(retenue, null);
  assert.deepEqual(essais.map(e => e.nom), ['tarball GitHub', 'registre npm NAS']);
});
