// LE SECOND DEMI-TOUR : un manifeste servi ne prouve pas qu'une mise a jour s'installe.
//
// LE DEFAUT MESURE, ET POURQUOI IL A ECHAPPE A TOUT. Le 2026-08-28, les deux apps du portefeuille
// servaient un manifeste VALIDE sur DEUX canaux : `iakaframe endpoints` disait « redondance : 2
// canaux servent », et c'etait vrai. Les CINQ URL d'artefacts que ces manifestes annoncaient
// rendaient pourtant 404 ou rien du tout. L'app VOYAIT la mise a jour et ne pouvait la TELECHARGER
// nulle part. Aucune garde ne pouvait le dire : toutes s'arretaient au manifeste.
//
// CE QUE CE BANC EXIGE. Qu'une URL annoncee soit MESUREE, pas supposee — et que les motifs ne se
// confondent pas : « absent » (404 : la release n'a pas cet artefact), « injoignable » (machine
// eteinte), « vide » (200 sans octet : le piege du 200 qui ne sert rien). Les remedes sont
// opposes ; les confondre, c'est repartir sur la mauvaise piste.
//
// ARENE, pas simulation (meme regle que `endpoints-failover.test.js`) : de VRAIS serveurs HTTP sur
// la boucle locale, de VRAIS ports fermes. Aucune fonction reseau n'est remplacee par un bouchon.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { sonderArtefact, sonderArtefacts, verdictArtefacts, formaterArtefacts } from '../src/lib/endpoints.js';

const serveurs = [];
const RAPIDE = { timeoutMs: 3000 };

/** Vrai serveur HTTP. `repondre(req)` -> [code, corps]. Il honore HEAD comme GET (content-length). */
function serveur(repondre) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const [code, corps] = repondre(req);
      const buf = Buffer.from(corps ?? '');
      res.writeHead(code, { 'Content-Length': String(buf.length) });
      res.end(req.method === 'HEAD' ? undefined : buf);
    });
    s.listen(0, '127.0.0.1', () => { serveurs.push(s); resolve(`http://127.0.0.1:${s.address().port}`); });
  });
}

/** Port REELLEMENT ferme : reserve pour se l'attribuer, puis rendu. */
function morte() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(`http://127.0.0.1:${p}/app.tar.gz`));
    });
  });
}

after(() => { for (const s of serveurs) s.close(); });

test('un artefact PRESENT est mesure : code, octets, et le verdict ok', async () => {
  const base = await serveur(() => [200, 'x'.repeat(1234)]);
  const m = await sonderArtefact(`${base}/app.tar.gz`, RAPIDE);
  assert.equal(m.status, 200);
  assert.equal(m.octets, 1234, 'la TAILLE est mesuree : un artefact vide n est pas un artefact');
  assert.equal(m.ok, true);
  assert.equal(m.motif, 'ok');
});

test('un artefact ABSENT rend 404 — le cas exact des cinq URL du 2026-08-28', async () => {
  const base = await serveur(() => [404, 'Not Found']);
  const m = await sonderArtefact(`${base}/app.tar.gz`, RAPIDE);
  assert.equal(m.ok, false);
  assert.equal(m.motif, 'absent', 'un 404 se nomme « absent », jamais « injoignable »');
});

test('un hote MORT rend injoignable — motif distinct de l absence, remede distinct', async () => {
  const m = await sonderArtefact(await morte(), RAPIDE);
  assert.equal(m.status, 0);
  assert.equal(m.motif, 'injoignable');
});

test('200 SANS octet ne compte pas : servir zero octet n est pas servir', async () => {
  const base = await serveur(() => [200, '']);
  const m = await sonderArtefact(`${base}/app.tar.gz`, RAPIDE);
  assert.equal(m.status, 200);
  assert.equal(m.ok, false, 'un 200 vide serait un faux positif — le pire des etats');
  assert.equal(m.motif, 'vide');
});

test('le manifeste est mesure PLATEFORME PAR PLATEFORME, dans l ordre qu il declare', async () => {
  const bon = await serveur(() => [200, 'x'.repeat(10)]);
  const absent = await serveur(() => [404, 'nope']);
  const manifeste = {
    version: '0.32.1',
    platforms: {
      'darwin-aarch64': { signature: 's', url: `${bon}/mac.tar.gz` },
      'windows-x86_64': { signature: 's', url: `${absent}/setup.exe` },
    },
  };
  const mesures = await sonderArtefacts(manifeste, RAPIDE);
  assert.deepEqual(mesures.map((m) => m.plateforme), ['darwin-aarch64', 'windows-x86_64']);
  assert.deepEqual(mesures.map((m) => m.motif), ['ok', 'absent']);

  const v = verdictArtefacts(mesures);
  assert.equal(v.total, 2);
  assert.equal(v.telechargeables, 1);
  assert.equal(v.complet, false, 'UNE seule entree muette suffit a rompre la promesse du manifeste');
  assert.deepEqual(v.muets, [{ plateforme: 'windows-x86_64', motif: 'absent' }]);
});

test('l etat du 2026-08-28 : manifeste servi, ZERO artefact telechargeable', async () => {
  const m1 = await morte(), m2 = await morte();
  const manifeste = {
    version: '0.1.7',
    platforms: {
      'linux-x86_64': { signature: 's', url: m1 },
      'darwin-aarch64': { signature: 's', url: m2 },
    },
  };
  const v = verdictArtefacts(await sonderArtefacts(manifeste, RAPIDE));
  assert.equal(v.telechargeables, 0);
  assert.equal(v.complet, false);
  // C'est CETTE phrase qui manquait : « on voit la mise a jour, on ne la telecharge nulle part ».
  const texte = formaterArtefacts(await sonderArtefacts(manifeste, RAPIDE)).join('\n');
  assert.match(texte, /TELECHARGEABLE : 0\/2/);
});

test('une plateforme DECLAREE SANS url est un defaut nomme, pas un silence', async () => {
  const mesures = await sonderArtefacts({ platforms: { 'linux-x86_64': { signature: 's' } } }, RAPIDE);
  assert.equal(mesures[0].motif, 'sans-url');
  assert.equal(mesures[0].ok, false);
});

test('un manifeste SANS plateforme ne rend pas un verdict complaisant', async () => {
  const v = verdictArtefacts(await sonderArtefacts({ platforms: {} }, RAPIDE));
  assert.equal(v.total, 0);
  assert.equal(v.complet, false, '0/0 n est pas « tout va bien » : rien n a ete annonce ni mesure');
});
