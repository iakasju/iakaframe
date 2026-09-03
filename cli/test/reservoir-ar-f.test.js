// Gardes AR-F (specs/instructions/chaine-complete-install-amorcage-dmg-msi.md § 4.0/4.6, CA-05/
// CA-06) : « le plus recent gagne ; a egalite, le vivant » — et l'egalite est le cas NOMINAL
// (fixture : vivant == embarque, comme sur le poste du decideur), pas un cas de bord traite en
// `else`. Chaque cas est construit avec une vraie arborescence sur disque (fixtures temporaires),
// jamais suppose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resoudreReservoir, embarqueInfo, compareVersions, vivantHasInstaller, vivantVersion,
} from '../src/lib/reservoir.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-reservoir-')); }

// Arbre vivant minimal : install.mjs a la racine (marqueur, cf. M4) + cli/package.json optionnel.
function faireVivant({ version } = {}) {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'install.mjs'), '// installeur factice\n');
  if (version !== undefined) {
    fs.mkdirSync(path.join(dir, 'cli'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'cli', 'package.json'), JSON.stringify({ version }), 'utf8');
  }
  return dir;
}

test('compareVersions : ordre numerique simple, segments manquants = 0', () => {
  assert.equal(compareVersions('0.39.0', '0.39.0'), 0);
  assert.equal(compareVersions('0.40.0', '0.39.0'), 1);
  assert.equal(compareVersions('0.39.0', '0.40.0'), -1);
  assert.equal(compareVersions('0.39', '0.39.0'), 0);
  assert.equal(compareVersions('1', '0.99.99'), 1);
});

test('vivantHasInstaller : vrai seulement si install.mjs existe a la racine', () => {
  const dir = faireVivant({ version: '0.39.0' });
  assert.equal(vivantHasInstaller(dir), true);
  assert.equal(vivantHasInstaller(tmp()), false); // dossier vide : pas de marqueur
});

test('vivantVersion : lit cli/package.json quand present, null sinon (jamais une exception)', () => {
  assert.equal(vivantVersion(faireVivant({ version: '0.33.0' })), '0.33.0');
  assert.equal(vivantVersion(faireVivant()), null); // install.mjs seul, pas de cli/
  assert.equal(vivantVersion(tmp()), null); // dossier totalement vide
});

// --- CA-05 : le CAS NOMINAL (M3) — vivant et embarque a la MEME version -----------------------
// C'est le cas du poste du decideur : le CLI tourne DEPUIS l'arbre vivant, donc les deux versions
// sont egales PAR CONSTRUCTION. Le vivant doit gagner, et la raison ecrite doit dire « egalite ».
test('CA-05 (cas nominal, AR-F conséquence 1) : à version ÉGALE, le vivant l\'emporte, la provenance dit "égalité"', () => {
  const { version: ev } = embarqueInfo();
  const vivant = faireVivant({ version: ev });
  const r = resoudreReservoir({ root: vivant });
  assert.equal(r.source, 'vivant', 'a egalite, le VIVANT doit gagner (jamais un `else` muet)');
  assert.equal(r.vivantRoot, vivant);
  assert.match(r.provenance, /^réservoir : vivant .* \(v.*\) — embarqué v.*, égalité, le vivant l'emporte$/);
});

test('AR-F(a) : vivant STRICTEMENT plus récent -> vivant l\'emporte, provenance dit "plus récent"', () => {
  const { version: ev } = embarqueInfo();
  const [maj, min, pat] = ev.split('.').map(Number);
  const plusRecent = `${maj}.${min}.${(pat || 0) + 1}`;
  const vivant = faireVivant({ version: plusRecent });
  const r = resoudreReservoir({ root: vivant });
  assert.equal(r.source, 'vivant');
  assert.match(r.provenance, /plus récent, le vivant l'emporte$/);
});

test('AR-F(a) : vivant STRICTEMENT plus ancien -> embarqué l\'emporte, provenance dit "plus ancien"', () => {
  const vivant = faireVivant({ version: '0.0.1' });
  const r = resoudreReservoir({ root: vivant });
  assert.equal(r.source, 'embarque');
  assert.equal(r.installMjsPath, null, 'embarque gagnant : aucun install.mjs (le _bundled n\'en porte pas) — pas de faux chemin');
  assert.match(r.provenance, /^réservoir : embarqué \(v.*\) — vivant v0\.0\.1, plus ancien$/);
});

// --- CA-06 : version INDETERMINEE (AR-F conséquence 2) -----------------------------------------
test('CA-06 : vivant SANS version (install.mjs sans cli/) -> le vivant l\'emporte QUAND MEME, jamais un repli silencieux', () => {
  const vivant = faireVivant(); // install.mjs seul, pas de cli/package.json
  const r = resoudreReservoir({ root: vivant });
  assert.equal(r.source, 'vivant', 'version indeterminee : le vivant doit gagner quand meme (AR-F consequence 2)');
  assert.equal(r.vivantVersion, null);
  assert.match(r.provenance, /^réservoir : vivant .* \(version indéterminée\) — embarqué v.*, le vivant l'emporte$/);
});

// --- Aucun réservoir vivant du tout -------------------------------------------------------------
test('aucun réservoir vivant trouvé (install.mjs absent) -> embarqué par défaut, dit explicitement', () => {
  const vide = tmp();
  const r = resoudreReservoir({ root: vide });
  assert.equal(r.source, 'embarque');
  assert.equal(r.vivantRoot, null);
  assert.equal(r.vivantPresent, false);
  assert.equal(r.installMjsPath, null);
  assert.match(r.provenance, /^réservoir : embarqué \(v.*\) — aucun réservoir vivant trouvé \(install\.mjs absent sous .*\)$/);
});

// --- Format imposé littéralement (§ 4.0, les 3 exemples cités) ----------------------------------
test('le format de provenance respecte EXACTEMENT les 3 gabarits cités par § 4.0 (quoi ET pourquoi)', () => {
  const { version: ev } = embarqueInfo();
  const rEgal = resoudreReservoir({ root: faireVivant({ version: ev }) });
  assert.match(rEgal.provenance, /^réservoir : vivant .+ \(v[\d.]+\) — embarqué v[\d.]+, égalité, le vivant l'emporte$/);

  const rIndet = resoudreReservoir({ root: faireVivant() });
  assert.match(rIndet.provenance, /^réservoir : vivant .+ \(version indéterminée\) — embarqué v[\d.]+, le vivant l'emporte$/);

  const rPlusAncien = resoudreReservoir({ root: faireVivant({ version: '0.0.1' }) });
  assert.match(rPlusAncien.provenance, /^réservoir : embarqué \(v[\d.]+\) — vivant v0\.0\.1, plus ancien$/);
});
