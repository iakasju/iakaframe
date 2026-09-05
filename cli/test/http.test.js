// Gardes de lib/http.js — ajoutees par le lot ETAPES-3-4-WINDOWS-LINUX/W-L (2026-09-05, R-W1) :
// le timeout de `getBytes` a ete porte de 30000ms a 180000ms (mesure 0.2 : l'AppImage reelle,
// ~90 Mo, depasse 30s sur ce poste) et distingue desormais un AVORTEMENT par timeout (`expire:
// true`) d'un autre echec reseau (`expire: false`) — ce fichier est NEUF, aucun test existant
// n'est deplace ici.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { getBytes } from '../src/lib/http.js';

function serveur({ delaiMs = 0, octets = Buffer.from('ok') } = {}) {
  const srv = http.createServer((req, res) => {
    setTimeout(() => { res.writeHead(200); res.end(octets); }, delaiMs);
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}

test('getBytes : réponse RAPIDE sous le timeout -> ok:true, octets exacts, expire:false', async () => {
  const octets = Buffer.from('contenu rapide, octet pour octet');
  const srv = await serveur({ delaiMs: 0, octets });
  const { port } = srv.address();
  try {
    const rep = await getBytes(`http://127.0.0.1:${port}/`, 5000);
    assert.equal(rep.ok, true);
    assert.deepEqual(rep.octets, octets);
    assert.equal(rep.expire, false);
  } finally { srv.close(); }
});

test('R-W1 : timeout COURT sur une réponse LENTE -> ok:false, status:0, expire:true (AVORTEMENT, pas un refus)', async () => {
  const srv = await serveur({ delaiMs: 300, octets: Buffer.from('trop tard') });
  const { port } = srv.address();
  try {
    const rep = await getBytes(`http://127.0.0.1:${port}/`, 50);
    assert.equal(rep.ok, false);
    assert.equal(rep.status, 0);
    assert.equal(rep.octets, null);
    assert.equal(rep.expire, true, 'CONTREFACTUEL : sans le test `e.name === "AbortError"`, expire resterait false ici aussi (indiscernable d\'un réseau mort)');
  } finally { srv.close(); }
});

test('R-W1, CONTREFACTUEL symétrique : connexion REFUSÉE (port fermé) -> ok:false, status:0, expire:false (PAS un timeout)', async () => {
  // Port 1 : privilégié, personne n'écoute -> ECONNREFUSED quasi immédiat, jamais un AbortError.
  const rep = await getBytes('http://127.0.0.1:1/', 2000);
  assert.equal(rep.ok, false);
  assert.equal(rep.status, 0);
  assert.equal(rep.expire, false, 'un refus de connexion réseau ne doit PAS être confondu avec un dépassement de délai');
});

test('getBytes : le nouveau défaut (180000ms) n\'est plus 30000ms — mesure 0.2 (R-W1)', async () => {
  const srv = await serveur({ delaiMs: 40, octets: Buffer.from('sous 30s mais visait a documenter le defaut') });
  const { port } = srv.address();
  try {
    // Appel SANS timeoutMs explicite : exerce le DÉFAUT réel de la fonction.
    const rep = await getBytes(`http://127.0.0.1:${port}/`);
    assert.equal(rep.ok, true, 'précondition : une réponse en 40ms doit réussir sous le défaut, quel qu\'il soit');
  } finally { srv.close(); }
});
