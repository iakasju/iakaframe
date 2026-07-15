// GAP a — convergence de la racine bibliotheque CLI<->GUI. Hors-arbre (cwd hors bibliotheque) et
// IAKAFRAME_HOME absent, `libraryRoot()` doit resoudre la MEME racine que la GUI viserait :
// src-tauri/src/paths.rs `resolve_iakaframe_home` -> `<chapeau>/iakaframe`, valide par le double
// marqueur library/+methods/, chapeau = IAKAFRAME_ROOT (calque de `resolve_hat_root`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { libraryRoot } from '../src/lib/library.js';

test('libraryRoot : sonde <chapeau>/iakaframe hors-arbre (parite GUI paths.rs)', () => {
  const hat = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-hat-'));
  const neutral = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-cwd-')); // cwd sans marqueurs en amont
  const home = path.join(hat, 'iakaframe');
  fs.mkdirSync(path.join(home, 'library'), { recursive: true });
  fs.mkdirSync(path.join(home, 'methods'), { recursive: true });
  const oldHome = process.env.IAKAFRAME_HOME;
  const oldRoot = process.env.IAKAFRAME_ROOT;
  const oldCwd = process.cwd();
  try {
    delete process.env.IAKAFRAME_HOME;      // pas de racine bibliotheque explicite
    process.env.IAKAFRAME_ROOT = hat;       // <chapeau> = hat ; la GUI viserait <hat>/iakaframe
    process.chdir(neutral);                 // hors-arbre : findUp(cwd) echoue -> sonde chapeau
    assert.equal(libraryRoot(), home);      // meme racine que resolve_iakaframe_home (GUI)
  } finally {
    process.chdir(oldCwd);
    if (oldHome === undefined) delete process.env.IAKAFRAME_HOME; else process.env.IAKAFRAME_HOME = oldHome;
    if (oldRoot === undefined) delete process.env.IAKAFRAME_ROOT; else process.env.IAKAFRAME_ROOT = oldRoot;
    fs.rmSync(hat, { recursive: true, force: true });
    fs.rmSync(neutral, { recursive: true, force: true });
  }
});
