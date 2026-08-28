// CA-11 par MESURE : « une app dont le premier endpoint est mort voit quand meme la mise a jour,
// en essayant les suivants ».
//
// ARENE, pas simulation. Les serveurs sont de VRAIS serveurs HTTP sur la boucle locale et les
// cibles mortes sont de VRAIS ports fermes (reserves puis liberes juste avant : la connexion est
// refusee pour de bon). Aucune fonction reseau n'est remplacee par un bouchon — on ne prouve pas
// une bascule en se racontant qu'elle a lieu, on ouvre les connexions.
//
// POURQUOI CE BANC EXISTE. Le lot 0 avait aligne trois URL dans deux `tauri.conf.json` et declare
// la redondance acquise. Mesure du gate : le Cockpit avait son premier endpoint vivant et ses deux
// replis rendaient 404 et 000 — la liste ETAIT redondante sur le papier et ne l'etait pas en fait.
// Une redondance ne se lit pas dans une configuration : elle se mesure.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  lireEndpoints, resoudre, sonderTous, verdictRedondance, formater, classer, manifesteValide,
} from '../src/lib/endpoints.js';

const MANIFESTE = {
  version: '0.1.7',
  platforms: { 'darwin-aarch64': { signature: 'sig', url: 'http://exemple.invalid/app.tar.gz' } },
};

const serveurs = [];
const jetables = [];

/** Vrai serveur HTTP local. `repondre(req)` -> [code, corps, contentType]. */
function serveurVivant(repondre) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const [code, corps, ct] = repondre(req);
      res.writeHead(code, { 'Content-Type': ct || 'application/json' });
      res.end(corps);
    });
    s.listen(0, '127.0.0.1', () => {
      serveurs.push(s);
      resolve(`http://127.0.0.1:${s.address().port}/updater/latest.json`);
    });
  });
}

/** Port REELLEMENT ferme : on le reserve pour se l'attribuer, puis on le rend. */
function urlMorte() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(`http://127.0.0.1:${p}/updater/latest.json`));
    });
  });
}

const vivant = () => serveurVivant(() => [200, JSON.stringify(MANIFESTE)]);
const RAPIDE = { timeoutMs: 3000 };

after(() => {
  for (const s of serveurs) s.close();
  for (const d of jetables) fs.rmSync(d, { recursive: true, force: true });
});

// --- Le contrat, mesure ------------------------------------------------------------------------

test('CA-11 : premier endpoint MORT, le suivant repond — la mise a jour est vue quand meme', async () => {
  const mort = await urlMorte();
  const bon = await vivant();
  const r = await resoudre([mort, bon], RAPIDE);

  assert.equal(r.essais.length, 2, 'le second endpoint doit avoir ete essaye');
  assert.equal(r.essais[0].ok, false);
  assert.equal(r.essais[0].motif, 'injoignable', `motif du mort : ${r.essais[0].motif}`);
  assert.equal(r.retenu.url, bon, 'le second endpoint doit etre RETENU');
  assert.equal(r.manifeste.version, '0.1.7', 'le manifeste doit etre lu de bout en bout');
});

test('CA-11 : DEUX endpoints morts, le troisieme repond', async () => {
  const m1 = await urlMorte(), m2 = await urlMorte(), bon = await vivant();
  const r = await resoudre([m1, m2, bon], RAPIDE);
  assert.deepEqual(r.essais.map((e) => e.motif), ['injoignable', 'injoignable', 'ok']);
  assert.equal(r.retenu.url, bon);
});

test('le premier qui SERT gagne : on n essaie pas les suivants inutilement', async () => {
  const bon = await vivant(), autre = await vivant();
  const r = await resoudre([bon, autre], RAPIDE);
  assert.equal(r.essais.length, 1, 'un endpoint vivant en tete arrete la recherche');
  assert.equal(r.retenu.url, bon);
});

test('une recherche arretee au premier succes NE REND PAS de verdict de redondance', async () => {
  // Le piege inverse de R7 : declarer « un seul canal sert » alors qu'on n'a pas interroge les
  // suivants serait, tout autant, un verdict rendu sans mesure.
  const bon = await vivant(), autre = await vivant(), encore = await vivant();
  const r = await resoudre([bon, autre, encore], RAPIDE);
  assert.equal(r.complet, false, 'la liste n a pas ete mesuree en entier');
  const txt = formater(r).join('\n');
  assert.match(txt, /REDONDANCE : non mesuree/);
  assert.ok(!/CA-11 NON tenu/.test(txt), 'aucun verdict de redondance sur une mesure partielle');

  const complet = await sonderTous([bon, autre, encore], RAPIDE);
  assert.equal(complet.complet, true);
  assert.match(formater(complet).join('\n'), /REDONDANCE : 3 canaux servent/);
});

// --- Ce qu'un 200 ne prouve pas ----------------------------------------------------------------

test('un 404 (depot prive ou chemin absent) n arrete pas la bascule : le suivant est essaye', async () => {
  const quatreCentQuatre = await serveurVivant(() => [404, 'Not Found', 'text/plain']);
  const bon = await vivant();
  const r = await resoudre([quatreCentQuatre, bon], RAPIDE);
  assert.equal(r.essais[0].motif, 'absent', '404 doit se distinguer d une machine eteinte');
  assert.equal(r.retenu.url, bon);
});

test('un 200 qui rend une page de connexion N EST PAS un manifeste — la bascule continue', async () => {
  // Le piege exact du canal GitHub quand le depot est prive : l'octet arrive, la mise a jour non.
  const html = await serveurVivant(() => [200, '<html><body>Sign in</body></html>', 'text/html']);
  const bon = await vivant();
  const r = await resoudre([html, bon], RAPIDE);
  assert.equal(r.essais[0].status, 200, 'le serveur a bien repondu 200');
  assert.equal(r.essais[0].ok, false, 'un 200 sans manifeste ne doit JAMAIS compter comme un succes');
  assert.equal(r.essais[0].motif, 'manifeste-illisible');
  assert.equal(r.retenu.url, bon);
});

test('un manifeste ampute (plateforme sans url) est refuse comme illisible', () => {
  assert.equal(manifesteValide({ version: '1.0.0', platforms: { a: {} } }), false);
  assert.equal(manifesteValide({ version: '1.0.0', platforms: {} }), false);
  assert.equal(manifesteValide({ platforms: { a: { url: 'x' } } }), false);
  assert.equal(manifesteValide(MANIFESTE), true);
});

test('les motifs ne se confondent pas : eteint, absent, refuse, illisible', () => {
  assert.equal(classer(0, null), 'injoignable');
  assert.equal(classer(404, null), 'absent');
  assert.equal(classer(403, null), 'refus');
  assert.equal(classer(500, null), 'erreur-http-500');
  assert.equal(classer(200, null), 'manifeste-illisible');
  assert.equal(classer(200, MANIFESTE), 'ok');
});

// --- R7 : ne jamais pretendre une redondance qu'on n'a pas -------------------------------------

test('TOUS morts : rien n est retenu, et la sortie ne pretend RIEN', async () => {
  const m1 = await urlMorte(), m2 = await urlMorte();
  const r = await resoudre([m1, m2], RAPIDE);
  assert.equal(r.retenu, null);
  assert.equal(r.manifeste, null);
  const txt = formater(r).join('\n');
  assert.match(txt, /RETENU : AUCUN/);
  assert.match(txt, /CA-11 NON tenu/);
});

test('UN SEUL canal qui sert n est PAS une redondance, et la sortie le dit', async () => {
  const mort = await urlMorte(), bon = await vivant();
  const r = await sonderTous([mort, bon], RAPIDE);
  const v = verdictRedondance(r.essais);
  assert.equal(v.nb, 1);
  assert.equal(v.redondant, false);
  assert.match(formater(r).join('\n'), /CA-11 NON tenu/);
});

test('DEUX canaux qui servent : la redondance est mesuree, pas declaree', async () => {
  const a = await vivant(), b = await vivant();
  const r = await sonderTous([a, b], RAPIDE);
  const v = verdictRedondance(r.essais);
  assert.equal(v.nb, 2, 'deux hotes distincts doivent servir');
  assert.equal(v.redondant, true);
  const txt = formater(r).join('\n');
  assert.match(txt, /REDONDANCE : 2 canaux servent/);
  assert.match(txt, /mesure EN DIRECT le \d{4}-\d{2}-\d{2}T/, 'la date de la mesure est obligatoire (§ 9)');
});

// --- Lecture de la configuration d'une app -----------------------------------------------------

test('les endpoints sont lus dans l ORDRE declare par tauri.conf.json', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-eps-'));
  jetables.push(d);
  const f = path.join(d, 'tauri.conf.json');
  fs.writeFileSync(f, JSON.stringify({
    plugins: { updater: { endpoints: ['http://a.invalid/l.json', 'http://b.invalid/l.json'] } },
  }));
  assert.deepEqual(lireEndpoints(f), ['http://a.invalid/l.json', 'http://b.invalid/l.json']);

  const g = path.join(d, 'sans.json');
  fs.writeFileSync(g, JSON.stringify({ plugins: {} }));
  assert.deepEqual(lireEndpoints(g), []);
});
