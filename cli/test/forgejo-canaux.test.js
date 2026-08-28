// Canaux ordonnes de la lib Forgejo (lot 0 « trois canaux synchrones », 0.a).
//
// CE QUE CES TESTS GARDENT, et pourquoi. Le fait A3 de l'instruction dit la cause racine :
// `lib/forgejo.js` portait UNE adresse, donc toute la chaine etait mono-cible par construction.
// En passant a une LISTE, le risque immediat n'est plus l'absence de bascule mais la
// REGRESSION : casser la forme mono-valeur qui marche aujourd'hui dans <chapeau>/.env.
// D'ou l'ordre des tests ci-dessous : d'abord la retro-compatibilite, ensuite la bascule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Arene : un chapeau VIDE, pour que fromEnvFile() ne lise jamais le vrai <chapeau>/.env du
// poste (sans quoi ces tests dependraient des secrets d'une machine).
const ARENE = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-canaux-'));
process.env.IAKAFRAME_ROOT = ARENE;

const { splitCanaux, cfg, cfgList, token, tokenFor } = await import('../src/lib/forgejo.js');

function avecEnv(vars, fn) {
  const sauve = {};
  for (const [k, v] of Object.entries(vars)) {
    sauve[k] = process.env[k];
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  try { return fn(); } finally {
    for (const [k, v] of Object.entries(sauve)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  }
}

const NEUF = { FORGEJO_URL: undefined, FORGEJO_USER: undefined, FORGEJO_TOKEN: undefined };

// --- Retro-compatibilite : la forme mono-valeur ne bouge pas -------------------------------

test('mono-valeur : un FORGEJO_URL unique rend UN canal, et cfg() est inchange', () => {
  avecEnv({ ...NEUF, FORGEJO_URL: 'http://forge.test:3001', FORGEJO_TOKEN: 'tok' }, () => {
    const l = cfgList();
    assert.equal(l.length, 1);
    assert.equal(l[0].url, 'http://forge.test:3001');
    assert.deepEqual(cfg(), { url: 'http://forge.test:3001', user: 'sjupin' });
  });
});

test('mono-valeur : token() rend la meme chaine qu avant (premier canal)', () => {
  avecEnv({ ...NEUF, FORGEJO_TOKEN: 'abc123' }, () => {
    assert.equal(token(), 'abc123');
    assert.equal(tokenFor(0), 'abc123');
  });
});

test('mono-valeur : un token unique s applique a TOUS les canaux (pas de canal sans credential)', () => {
  avecEnv({ ...NEUF, FORGEJO_URL: 'http://a:1,http://b:2,http://c:3', FORGEJO_TOKEN: 'unique' }, () => {
    const l = cfgList();
    assert.equal(l.length, 3);
    assert.deepEqual(l.map(c => c.token), ['unique', 'unique', 'unique']);
  });
});

test('placeholder de template toujours traite comme absent (garde historique)', () => {
  avecEnv({ ...NEUF, FORGEJO_TOKEN: 'LE_NOUVEAU_TOKEN_ICI' }, () => {
    assert.equal(token(), '');
  });
});

test('cfg() rend le canal PRIMAIRE quand plusieurs sont declares (aucun appelant a reecrire)', () => {
  avecEnv({ ...NEUF, FORGEJO_URL: 'http://primaire:1,http://secours:2' }, () => {
    assert.equal(cfg().url, 'http://primaire:1');
  });
});

// --- La bascule : plusieurs canaux ----------------------------------------------------------

test('splitCanaux : CSV, espaces tolerees, vides ecartes ; non-chaine -> liste vide', () => {
  assert.deepEqual(splitCanaux('a, b ,,c'), ['a', 'b', 'c']);
  assert.deepEqual(splitCanaux(''), []);
  assert.deepEqual(splitCanaux(undefined), []);
  assert.deepEqual(splitCanaux(null), []);
});

test('multi-valeurs : l ORDRE declare est l ordre rendu (le premier est le primaire)', () => {
  avecEnv({ ...NEUF, FORGEJO_URL: 'http://un:1,http://deux:2,http://trois:3' }, () => {
    assert.deepEqual(cfgList().map(c => c.url), ['http://un:1', 'http://deux:2', 'http://trois:3']);
    assert.deepEqual(cfgList().map(c => c.index), [0, 1, 2]);
  });
});

test('multi-valeurs : un token PAR canal, aligne positionnellement', () => {
  avecEnv({ ...NEUF, FORGEJO_URL: 'http://un:1,http://deux:2', FORGEJO_TOKEN: 't1,t2' }, () => {
    assert.deepEqual(cfgList().map(c => c.token), ['t1', 't2']);
    assert.equal(tokenFor(1), 't2');
  });
});

test('multi-valeurs : un utilisateur unique vaut pour tous les canaux', () => {
  avecEnv({ ...NEUF, FORGEJO_URL: 'http://un:1,http://deux:2', FORGEJO_USER: 'alice' }, () => {
    assert.deepEqual(cfgList().map(c => c.user), ['alice', 'alice']);
  });
});

test('option --url explicite : prioritaire sur l environnement, et acceptant la forme CSV', () => {
  avecEnv({ ...NEUF, FORGEJO_URL: 'http://env:1' }, () => {
    assert.deepEqual(cfgList({ url: 'http://opt:1,http://opt:2' }).map(c => c.url),
      ['http://opt:1', 'http://opt:2']);
  });
});

test('sans aucune source : les canaux par DEFAUT sont au moins deux, sans doublon', () => {
  avecEnv(NEUF, () => {
    const urls = cfgList().map(c => c.url);
    assert.ok(urls.length >= 2, `un seul canal par defaut = aucune bascule possible (${urls.join(', ')})`);
    assert.equal(new Set(urls).size, urls.length, 'canaux par defaut en doublon');
  });
});

// Lu depuis <chapeau>/.env : meme cascade, appliquee a une liste.
test('cascade fichier : FORGEJO_URL multi-valeurs lu dans <chapeau>/.env', () => {
  fs.writeFileSync(path.join(ARENE, '.env'), 'FORGEJO_URL=http://f1:1,http://f2:2\nFORGEJO_TOKEN=tf1,tf2\n');
  try {
    avecEnv(NEUF, () => {
      const l = cfgList();
      assert.deepEqual(l.map(c => c.url), ['http://f1:1', 'http://f2:2']);
      assert.deepEqual(l.map(c => c.token), ['tf1', 'tf2']);
    });
  } finally { fs.rmSync(path.join(ARENE, '.env'), { force: true }); }
});

test.after(() => { fs.rmSync(ARENE, { recursive: true, force: true }); });
