// Garde CA-01 (lot 0, solde) — specs/instructions/chaine-complete-install-amorcage-dmg-msi.md
// § 6.1, point 1 : `publishConfig` du CLI conforme au verdict AR-H(a) ("le tarball des forges
// est la voie publique, le registre NAS reste la voie LAN") et le README ne confond pas les deux.
//
// M8 (mesure du 2026-09-03) constate `publishConfig` deja MONO-VALEUR (un seul registre, le NAS) :
// AR-H(a) ne demande PAS un multi-registre npm (ca, c'etait l'ancienne hypothese AR-7, fermee sans
// objet) — il demande que ce registre unique soit bien tenu pour la voie LAN, jamais presente comme
// la voie publique. Ce test PIN cet etat mesure ; il rougirait si quelqu'un le fait deriver (ex.
// republier `publishConfig` comme adresse publique, ou faire disparaitre l'avertissement LAN du
// README).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const PKG = JSON.parse(fs.readFileSync(path.join(REPO, 'cli', 'package.json'), 'utf8'));
const README = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');

test('CA-01 : publishConfig ne porte qu\'UN registre npm (le NAS, voie LAN) — jamais annonce comme voie publique', () => {
  const reg = PKG.publishConfig && PKG.publishConfig['@naonedge:registry'];
  assert.ok(reg, 'publishConfig.@naonedge:registry doit exister');
  assert.equal(Object.keys(PKG.publishConfig).length, 1, 'publishConfig ne doit porter qu\'UNE cle (mono-registre, AR-H(a))');
  assert.match(reg, /^http:\/\/192\.168\.1\.139:3001\//, 'le registre declare doit etre le NAS (voie LAN), pas un registre public');
});

test('CA-01 : le README annonce le tarball des forges comme voie PUBLIQUE recommandee (AR-H(a))', () => {
  assert.match(README, /voie recommandée/i, 'le README doit designer une voie recommandee');
  assert.match(README, /npm install -g naonedge-iakaframe-[\d.]+\.tgz/, 'la voie recommandee doit etre le tarball de la release (pas un `npm install -g @naonedge/iakaframe`)');
});

test('CA-01 : le README ne confond jamais le registre NAS avec une voie accessible depuis Internet', () => {
  assert.match(README, /n'est \*\*pas accessible depuis[\s\S]{0,10}Internet\*\*/i, 'le README doit dire explicitement que le registre @naonedge est hors-Internet (voie LAN uniquement)');
  assert.match(README, /Réservé au réseau interne/i, 'le paragraphe registre doit se presenter comme reserve au LAN, jamais comme une alternative publique equivalente');
});
