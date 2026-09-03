// Garde CA-08 (§ 5.5 / § 4.0 obligation AR-1/AR-4, chaine-complete-install-amorcage-dmg-msi.md) —
// AVEC SON CONTREFACTUEL, exige nommement par l'instruction : « garde desarmee, l'auto-
// deploiement DOIT se produire et le test DOIT rougir nommement ». Les deux sens sont donc
// prouves ICI, avec une VRAIE arborescence disque (fixture kits/), jamais une supposition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifierAutoDeploiement, kitHoteDeploye } from '../src/lib/autodeploi.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_INSTALLER = path.join(HERE, '..', '..', 'install.mjs'); // le VRAI install.mjs (M4)

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-ar1-')); }
function w(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

// Fixture kits/ minimale (meme forme que cli/test/install-multihost.test.js:makeKits) : juste de
// quoi prouver qu'install.mjs POSE reellement quelque chose de verifiable.
function faireKits() {
  const kits = path.join(tmp(), 'kits');
  w(path.join(kits, 'iakaframe-claude', 'global', 'CLAUDE.md'), 'CLAUDE contract source (fixture AR-1)\n');
  return kits;
}

test('kitHoteDeploye : faux sur un dossier sans CLAUDE.md, ou un CLAUDE.md sans le bloc iakaframe', () => {
  const dir = tmp();
  assert.equal(kitHoteDeploye(dir), false, 'aucun CLAUDE.md : absent');
  w(path.join(dir, 'CLAUDE.md'), 'juste du texte, aucun bloc iakaframe\n');
  assert.equal(kitHoteDeploye(dir), false, 'CLAUDE.md sans bloc : toujours absent');
});

test('CA-08 (garde ACTIVE, cas nominal de la chaîne) : desarme:true => AR-1 NE se déclenche PAS, le kit reste absent', () => {
  const kits = faireKits();
  const targetClaude = tmp();
  assert.equal(kitHoteDeploye(targetClaude), false, 'precondition : kit absent avant l\'appel');

  const rapport = verifierAutoDeploiement({
    installMjsPath: REPO_INSTALLER, kitsDir: kits, targetClaude, desarme: true,
  });

  assert.equal(rapport.declenche, false, 'CA-08 : la garde ACTIVE doit EMPECHER le declenchement d\'AR-1');
  assert.match(rapport.raison, /désarmé pour la durée de la chaîne/, 'la raison doit nommer le corollaire AR-1/AR-4');
  assert.equal(kitHoteDeploye(targetClaude), false, 'le kit ne doit TOUJOURS PAS etre pose : desarme = aucun effet de bord');
  assert.equal(fs.existsSync(path.join(targetClaude, 'CLAUDE.md')), false, 'aucun fichier ecrit sous la garde active');
});

// --- LE CONTREFACTUEL, exige nommement par l'instruction (§ 4.0) -------------------------------
test('CA-08 CONTREFACTUEL : garde DÉSARMÉE (desarme:false) => AR-1 SE DÉCLENCHE RÉELLEMENT et pose le kit', () => {
  const kits = faireKits();
  const targetClaude = tmp();
  assert.equal(kitHoteDeploye(targetClaude), false, 'precondition : kit absent avant l\'appel');

  const rapport = verifierAutoDeploiement({
    installMjsPath: REPO_INSTALLER, kitsDir: kits, targetClaude, desarme: false,
  });

  assert.equal(rapport.declenche, true, 'CONTREFACTUEL : garde desarmee => AR-1 DOIT se produire (sinon la garde ne prouve rien)');
  assert.equal(rapport.status, 0, `install.mjs (le vrai) doit reussir : ${rapport.stderr}`);
  assert.match(rapport.raison, /SANS confirmation/, 'la raison doit dire que le declenchement s\'est fait sans demander');
  assert.equal(kitHoteDeploye(targetClaude), true, 'CONTREFACTUEL : le kit DOIT maintenant etre reellement pose sur le disque');
  const cm = fs.readFileSync(path.join(targetClaude, 'CLAUDE.md'), 'utf8');
  assert.match(cm, /CLAUDE contract source \(fixture AR-1\)/, 'le contenu pose doit venir de la fixture (delegation reelle a install.mjs, pas simulee)');
});

test('CA-08 : kit déjà déployé => AR-1 sans objet, quelle que soit la garde (ni écriture, ni sous-processus)', () => {
  const kits = faireKits();
  const targetClaude = tmp();
  w(path.join(targetClaude, 'CLAUDE.md'), '<!-- iakaframe:start -->\ndeja la\n<!-- iakaframe:end -->\n');
  const rapport = verifierAutoDeploiement({
    installMjsPath: REPO_INSTALLER, kitsDir: kits, targetClaude, desarme: false,
  });
  assert.equal(rapport.declenche, false);
  assert.match(rapport.raison, /déjà déployé/);
});
