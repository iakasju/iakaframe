// Parite de l'hote de forge : les TROIS declarations doivent designer le MEME hote.
//
// Defaut repare : `cli/package.json` (publishConfig), `cli/.npmrc` et `cli/src/lib/forgejo.js`
// (DEF_URL) portaient chacun l'adresse de la forge, en DUPLICATION non gardee. Toute l'infra
// du portefeuille a migre vers le NAS ; ces trois-la sont restes sur l'ancienne iakabox, qui
// ne repond plus du tout. Consequence mesuree le 2026-08-25 : `npm publish` et
// `npm install -g @naonedge/iakaframe` ne pouvaient pas aboutir, et le defaut de `forgejo.js`
// ne mordait QUE hors variable d'environnement — donc dans les contextes non interactifs,
// la ou l'echec est le plus difficile a voir.
//
// Ce test ne fige PAS une adresse (elle peut legitimement changer) : il exige qu'elles soient
// les MEMES. C'est la divergence qui est le defaut, pas la valeur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const hostOf = (url) => new URL(url).host;

function fromPackageJson() {
  const pkg = JSON.parse(fs.readFileSync(path.join(CLI, 'package.json'), 'utf8'));
  const url = pkg.publishConfig?.['@naonedge:registry'];
  assert.ok(url, 'publishConfig doit declarer le registre @naonedge');
  return hostOf(url);
}
function fromNpmrc() {
  const txt = fs.readFileSync(path.join(CLI, '.npmrc'), 'utf8');
  // Ligne EFFECTIVE seulement : un commentaire peut citer l'ancienne adresse pour l'expliquer.
  const line = txt.split('\n').find((l) => l.trim().startsWith('@naonedge:registry='));
  assert.ok(line, '.npmrc doit declarer @naonedge:registry');
  return hostOf(line.split('=').slice(1).join('=').trim());
}
// Depuis le lot 0 (« trois canaux synchrones »), forgejo.js porte une LISTE ordonnee et non
// plus une adresse unique. La parite s'exerce donc sur le canal PRIMAIRE — celui vers lequel
// on publie et celui qu'on interroge d'abord ; les suivants sont des SECOURS, qui ont le droit
// (et le devoir) d'etre d'autres hotes.
function canauxForgejoLib() {
  const src = fs.readFileSync(path.join(CLI, 'src', 'lib', 'forgejo.js'), 'utf8');
  const m = src.match(/^const DEF_URLS = \[([^\]]+)\];/m);
  assert.ok(m, 'forgejo.js doit declarer DEF_URLS (liste ordonnee de canaux)');
  const urls = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  assert.ok(urls.length >= 1, 'DEF_URLS ne doit pas etre vide');
  return urls;
}
function fromForgejoLib() {
  return hostOf(canauxForgejoLib()[0]);
}

test('publishConfig, .npmrc et le canal PRIMAIRE designent le meme hote de forge', () => {
  const a = fromPackageJson(), b = fromNpmrc(), c = fromForgejoLib();
  assert.equal(a, b, `publishConfig (${a}) et .npmrc (${b}) divergent`);
  assert.equal(a, c, `publishConfig (${a}) et le canal primaire de forgejo.js (${c}) divergent`);
});

test('les canaux de secours sont DISTINCTS du primaire (une liste de doublons ne bascule rien)', () => {
  const hosts = canauxForgejoLib().map(hostOf);
  assert.equal(new Set(hosts).size, hosts.length, `canaux en doublon : ${hosts.join(', ')}`);
});

// --- Registres npm : la LISTE ordonnee du lot 0 (0.d / AR-7) --------------------------------

test('le registre npm PRIMAIRE est le meme hote que publishConfig et .npmrc', async () => {
  const { registrePrimaire, registresNpm } = await import('../src/lib/registres.js');
  assert.equal(hostOf(registrePrimaire()), fromPackageJson());
  const hosts = registresNpm().map(hostOf);
  assert.equal(new Set(hosts).size, hosts.length, `registres npm en doublon : ${hosts.join(', ')}`);
});

test('🛑 le TROISIEME registre npm n est PAS invente : le manque est nomme, pas comble', async () => {
  const m = await import('../src/lib/registres.js');
  // Deux registres reels, et une constante qui DIT que le troisieme reste a designer. Le jour
  // ou il est tranche, ce test tombe — c'est le but : il garde un ARBITRAGE ouvert, pas une
  // valeur. Trois registres declares pour deux reels seraient le faux sentiment de securite R7.
  assert.equal(m.registresNpm().length, 2, 'un 3e registre est apparu : l arbitrage AR-7 a-t-il ete tranche ?');
  assert.match(m.TROISIEME_REGISTRE_A_DESIGNER, /non tranche|a designer|arbitrage/i);
});

test('l hote declare n est plus l ancienne iakabox hors service', () => {
  // Constat du 2026-08-25 : 192.168.2.11 ne repond plus (sonde HTTP sans reponse).
  // Le garder comme defaut, c'est promettre une publication qui ne peut pas aboutir.
  assert.notEqual(fromPackageJson(), '192.168.2.11:3001');
});
