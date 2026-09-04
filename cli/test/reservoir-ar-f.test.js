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

// Embarque INJECTE (N7/CA-B7) : jamais l'ambiant `cli/_bundled/` (gitignore, absent en clone
// frais, present si `npm run bundle` a tourne) — un test dont le verdict depend de cette ambiance
// n'est pas une garde. `withInstaller: false` = bundle AMPUTE (garde requise du prepack absente
// de ce fixture, cas exerce par CA-B9/CA-21').
function faireEmbarque({ withInstaller = true, version } = {}) {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, '_bundled'), { recursive: true });
  if (version !== undefined) fs.writeFileSync(path.join(dir, '_bundled', 'VERSION'), `v${version}\n`);
  if (withInstaller) {
    fs.mkdirSync(path.join(dir, '_bundled', 'kits'), { recursive: true });
    fs.writeFileSync(path.join(dir, '_bundled', 'install.mjs'), '// installeur embarque factice\n');
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

// RETOURNE (BUNDLE-INSTALL-MJS-ABSENT, AR-I(a), N7/E-4) : avant ce lot, l'embarque gagnant
// n'avait JAMAIS d'install.mjs (le _bundled n'en portait pas). Depuis, un embarque PORTEUR
// devient la charge de l'etape 2 — c'est exactement le cas signale par le gate du lot C.1 (vivant
// plus ancien -> refus faux + reprise inoperante). Embarque INJECTE (deterministe, N7).
test('AR-F(a)+AR-I(a) : vivant STRICTEMENT plus ancien, embarqué PORTEUR -> embarqué l\'emporte ET délègue à SON install.mjs', () => {
  const embarque = faireEmbarque({ withInstaller: true });
  const vivant = faireVivant({ version: '0.0.1' });
  const r = resoudreReservoir({ root: vivant, embarqueDir: embarque });
  assert.equal(r.source, 'embarque');
  assert.equal(r.installMjsPath, path.join(embarque, '_bundled', 'install.mjs'), 'AR-I(a) : le réservoir DÉSIGNÉ (embarqué) porte AUSSI la charge de l\'étape 2');
  assert.equal(r.installMjsCandidatVivant, path.join(vivant, 'install.mjs'));
  assert.equal(r.installMjsCandidatEmbarque, path.join(embarque, '_bundled', 'install.mjs'));
  assert.match(r.provenance, /^réservoir : embarqué \(v.*\) — vivant v0\.0\.1, plus ancien$/);
});

// Contrefactuel du cas ci-dessus : le vivant est plus ancien, MAIS le bundle est AMPUTÉ
// (`_bundled/` présent, sans install.mjs — le mode d'échec exact que R-A nomme). Aucun chemin
// fabriqué qui n'existe pas : `installMjsPath` reste `null`, à charge pour CA-21' de le dire.
test('AR-I(a), contrefactuel : vivant plus ancien, embarqué AMPUTÉ (sans install.mjs) -> installMjsPath reste null', () => {
  const embarque = faireEmbarque({ withInstaller: false });
  const vivant = faireVivant({ version: '0.0.1' });
  const r = resoudreReservoir({ root: vivant, embarqueDir: embarque });
  assert.equal(r.source, 'embarque');
  assert.equal(r.installMjsPath, null, 'bundle ampute : aucun chemin fabrique qui n\'existe pas');
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
// RETOURNE (N7/E-4) : embarque INJECTE, jamais l'ambiant. Ici l'embarque est AMPUTÉ (sans
// install.mjs) : ni vivant ni embarqué ne portent la charge -> `installMjsPath` reste `null`
// (précondition déterministe de CA-21', couverte côté install.js).
test('aucun réservoir vivant ET embarqué AMPUTÉ -> embarqué par défaut, installMjsPath null, dit explicitement', () => {
  const vide = tmp();
  const embarque = faireEmbarque({ withInstaller: false });
  const r = resoudreReservoir({ root: vide, embarqueDir: embarque });
  assert.equal(r.source, 'embarque');
  assert.equal(r.vivantRoot, null);
  assert.equal(r.vivantPresent, false);
  assert.equal(r.installMjsPath, null);
  assert.equal(r.installMjsCandidatVivant, path.join(vide, 'install.mjs'));
  assert.equal(r.installMjsCandidatEmbarque, path.join(embarque, '_bundled', 'install.mjs'));
  assert.match(r.provenance, /^réservoir : embarqué \(v.*\) — aucun réservoir vivant trouvé \(install\.mjs absent sous .*\)$/);
});

// AR-I(a) : vivant ABSENT, embarqué PORTEUR -> l'embarqué devient la charge (le cas NOMINAL de
// l'utilisateur installé par la voie publique, une fois le lot livré).
test('AR-I(a) : aucun réservoir vivant, embarqué PORTEUR -> embarqué devient la charge de l\'étape 2', () => {
  const vide = tmp();
  const embarque = faireEmbarque({ withInstaller: true });
  const r = resoudreReservoir({ root: vide, embarqueDir: embarque });
  assert.equal(r.source, 'embarque');
  assert.equal(r.installMjsPath, path.join(embarque, '_bundled', 'install.mjs'));
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
