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
function fromForgejoLib() {
  const src = fs.readFileSync(path.join(CLI, 'src', 'lib', 'forgejo.js'), 'utf8');
  const m = src.match(/^const DEF_URL = '([^']+)';/m);
  assert.ok(m, 'forgejo.js doit declarer DEF_URL');
  return hostOf(m[1]);
}

test('publishConfig, .npmrc et DEF_URL designent le meme hote de forge', () => {
  const a = fromPackageJson(), b = fromNpmrc(), c = fromForgejoLib();
  assert.equal(a, b, `publishConfig (${a}) et .npmrc (${b}) divergent`);
  assert.equal(a, c, `publishConfig (${a}) et forgejo.js DEF_URL (${c}) divergent`);
});

test('l hote declare n est plus l ancienne iakabox hors service', () => {
  // Constat du 2026-08-25 : 192.168.2.11 ne repond plus (sonde HTTP sans reponse).
  // Le garder comme defaut, c'est promettre une publication qui ne peut pas aboutir.
  assert.notEqual(fromPackageJson(), '192.168.2.11:3001');
});
