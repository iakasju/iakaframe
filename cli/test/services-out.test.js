// Reconciliation de la forme de `services.json` (instruction reconciliation-services-json.md, § 7).
//  (V1) VERROU DE LA REFERENCE CLI : `iakaframe services --out <tmp>` ecrit sur disque l'enveloppe
//       C-JSON exacte { ok, generated, count, services } — ok en 1re cle, count === services.length,
//       ordre des cles [ok, generated, count, services].
//
// NOTE (retrait-scripts-powershell.md, F4-a) : un second volet (V2) figeait ici le bloc `$payload`
// du source `iakaframe-services.ps1` contre un retour au legacy `{ generated, services }`. Ce script
// ayant ete retire du depot, la garde n'a plus de cible : on ne garde pas un fichier contre une
// regression s'il n'existe plus. V1 reste le verrou de reference, et ne depend d'aucun `.ps1`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');           // racine du depot

// --- (V1) Forme fichier du CLI verrouillee ---------------------------------------------------------

test('V1 : `services --out <f>` ecrit l\'enveloppe C-JSON { ok, generated, count, services }', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-services-out-'));
  const out = path.join(tmp, 'services.json');
  try {
    const r = spawnSync('node', [CLI, 'services', '--out', out, '--hosts', '127.0.0.1', '--timeout', '1'],
      { cwd: REPO, encoding: 'utf8' });
    assert.equal(r.status, 0, `exit 0 attendu, stderr=${r.stderr}`);
    assert.ok(fs.existsSync(out), 'le fichier --out doit etre ecrit');

    let obj;
    const raw = fs.readFileSync(out, 'utf8');
    assert.doesNotThrow(() => { obj = JSON.parse(raw); }, `fichier non JSON : ${raw.slice(0, 120)}`);

    assert.equal(typeof obj, 'object');
    assert.ok(obj !== null && !Array.isArray(obj), 'racine = objet, jamais un tableau nu');
    assert.equal(obj.ok, true, 'ok:true attendu');

    const keys = Object.keys(obj);
    assert.equal(keys[0], 'ok', 'ok doit etre la 1re cle');
    assert.deepEqual(keys, ['ok', 'generated', 'count', 'services'], 'ordre des cles impose');

    assert.equal(typeof obj.generated, 'string', 'generated = string');
    assert.ok(Array.isArray(obj.services), 'services = array');
    assert.equal(obj.count, obj.services.length, 'count = longueur exacte de services');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
