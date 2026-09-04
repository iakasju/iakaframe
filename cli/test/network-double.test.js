// Garde du TROISIEME correctif qualite (2026-09-04) : « IAKAFRAME_INSTALL_TEST_DOUBLE part dans
// le tarball publie, sans garde de contexte ». Deux proprietes a prouver, chacune avec son
// contrefactuel :
//   1. Le double N'EST JAMAIS publie (mesure par npm pack --dry-run, pas par raisonnement).
//   2. L'activation exige DEUX signaux independants — l'un sans l'autre est REFUSE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { doitActiverDouble, resoudreDoubleReseau } from '../src/lib/network-double.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI_DIR = path.join(HERE, '..');

// --- 1. Preuve MESUREE (pas raisonnee) : cli/test/ n'est PAS dans le tarball publie -------------

test('npm pack --dry-run : le double reseau (cli/test/fixtures/) n\'apparaît JAMAIS dans le paquet publié', () => {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: CLI_DIR, encoding: 'utf8' });
  // `npm pack` execute le lifecycle `prepack` (cli/scripts/bundle.js), qui ecrit SA PROPRE
  // prose sur stdout AVANT le JSON de npm — le JSON commence a la premiere ligne EXACTEMENT
  // egale a `[`. Isoler ce bloc, plutot que JSON.parse(out) brut (qui echoue sur la prose).
  const lignes = out.split('\n');
  const debutJson = lignes.findIndex((l) => l.trim() === '[');
  assert.ok(debutJson >= 0, `sortie npm pack --json sans bloc JSON reconnaissable :\n${out}`);
  const [info] = JSON.parse(lignes.slice(debutJson).join('\n'));
  const fichiers = info.files.map((f) => f.path);
  const suspects = fichiers.filter((f) => f.startsWith('test/') || f.includes('install-network-double'));
  assert.deepEqual(suspects, [], `fichier(s) de test/double publié(s) — le tarball ne doit JAMAIS les porter : ${suspects.join(', ')}`);
  // Temoin positif : install.js (la porte, cote decision) EST bien publie — sinon le verbe lui-meme
  // serait absent, ce qui rendrait ce test aveugle par construction.
  assert.ok(fichiers.includes('src/commands/install.js'), 'témoin positif : src/commands/install.js doit être publié (sinon ce test ne vérifie rien)');
  assert.ok(fichiers.includes('src/lib/network-double.js'), 'témoin positif : lib/network-double.js (la DÉCISION, sans implémentation de double) est publié — c\'est voulu, il ne contient aucune porte');
});

// --- 2. Decision pure, DETERMINISTE, zero I/O — les DEUX signaux sont requis --------------------

test('doitActiverDouble : les DEUX signaux sont requis — variable seule REFUSÉE', () => {
  assert.equal(doitActiverDouble({ IAKAFRAME_INSTALL_TEST_DOUBLE: '1' }), false,
    'CONTREFACTUEL : la variable seule (sans NODE_TEST_CONTEXT) ne doit JAMAIS activer le double — c\'est exactement le scénario "variable oubliée dans un profil shell" nommé par le gate');
});

test('doitActiverDouble : les DEUX signaux sont requis — NODE_TEST_CONTEXT seul REFUSÉ', () => {
  assert.equal(doitActiverDouble({ NODE_TEST_CONTEXT: 'child-v8' }), false,
    'sans intention explicite (variable absente), le double ne s\'active jamais — même sous le vrai test runner');
});

test('doitActiverDouble : les DEUX signaux réunis -> ACTIVÉ (seul cas positif)', () => {
  assert.equal(doitActiverDouble({ IAKAFRAME_INSTALL_TEST_DOUBLE: '1', NODE_TEST_CONTEXT: 'child-v8' }), true);
});

test('doitActiverDouble : aucun signal -> REFUSÉ (défaut sûr, chemin de production normal)', () => {
  assert.equal(doitActiverDouble({}), false);
});

// --- Contrefactuel end-to-end : resoudreDoubleReseau() applique la même règle -------------------

test('CONTREFACTUEL : resoudreDoubleReseau avec la variable SEULE (pas NODE_TEST_CONTEXT) -> actif:false, sondes réelles (undefined = défaut de etape1Cli)', async () => {
  const r = await resoudreDoubleReseau({ IAKAFRAME_INSTALL_TEST_DOUBLE: '1' });
  assert.equal(r.actif, false);
  assert.equal(r.sondes, undefined);
  assert.equal(r.execNpmInstall, undefined);
});

test('resoudreDoubleReseau avec les DEUX signaux -> actif:true, double réellement chargé (sondes toujours injoignables, jamais un vrai réseau)', async () => {
  const r = await resoudreDoubleReseau({ IAKAFRAME_INSTALL_TEST_DOUBLE: '1', NODE_TEST_CONTEXT: 'child-v8' });
  assert.equal(r.actif, true);
  assert.ok(Array.isArray(r.sondes) && r.sondes.length === 1);
  const sonde = await r.sondes[0]();
  assert.equal(sonde.repond, false);
  assert.match(sonde.nom, /DOUBLE-TEST/);
  assert.throws(() => r.execNpmInstall(), /ne doit jamais être atteint/);
});
