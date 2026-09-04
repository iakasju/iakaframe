// CA-M8/CA-M9 (contrat-machine-du-verbe-install.md § 8) — LE CRITÈRE CENTRAL du lot : la prose
// HUMAINE de `install` ne bouge pas d'un octet apres l'introduction du contrat machine, et
// `--dry-run` continue de ne RIEN écrire, avec les drapeaux neufs. Le témoin
// (cli/test/fixtures/install-prose-dry-run.txt) a été enregistré à l'ÉTAPE 1 du lot, AVANT toute
// modification de production — un témoin enregistré après la refonte n'aurait rien prouvé (R-M1).
//
// SEULE normalisation appliquée (liste ÉCRITE, volontairement COURTE — R-M6, cliquet de
// normalisation) : les chemins temporaires (réservoir vivant, cible --target-claude, --apps-dir,
// --backup-dir), remplacés par des jetons stables `<VIVANT>`/`<CLAUDE>`/`<APPS>`/`<BACKUPS>`.
// AUCUN horodatage n'apparaît dans la sortie de ce verbe (vérifié : le témoin ne contient aucune
// date ISO) — la liste ci-dessous reste donc plus courte que celle anticipée par l'instruction.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REAL_INSTALL_MJS = path.join(REPO, 'install.mjs');
const TEMOIN = path.join(HERE, 'fixtures', 'install-prose-dry-run.txt');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-prose-')); }
function w(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

function faireReservoirVivant({ version = '0.39.0' } = {}) {
  const dir = tmp();
  fs.copyFileSync(REAL_INSTALL_MJS, path.join(dir, 'install.mjs'));
  w(path.join(dir, 'cli', 'package.json'), JSON.stringify({ version }));
  w(path.join(dir, 'kits', 'iakaframe-claude', 'global', 'CLAUDE.md'), 'CLAUDE contract fixture (install-verbe.test)\n');
  return dir;
}

// MÊME couture que install-verbe.test.js : double reseau TOUJOURS injoignable (deterministe).
function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, IAKAFRAME_INSTALL_TEST_DOUBLE: '1' },
  });
}

// Liste ÉCRITE des motifs de normalisation (R-M6 : le cliquet). N'ajouter une entrée ICI que dans
// le commit qui le justifie explicitement.
function normaliser(stdout, jetons) {
  let out = stdout;
  for (const [valeur, jeton] of jetons) out = out.split(valeur).join(jeton);
  return out;
}

test('CA-M8 — LA PROSE HUMAINE NE BOUGE PAS D\'UN OCTET : `install --dry-run` (sans drapeau neuf) === témoin figé à l\'étape 1', () => {
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const targetClaude = path.join(tmp(), 'claude');
  const appsDir = path.join(tmp(), 'apps');
  const backupDir = path.join(tmp(), 'backups');
  const r = run(['install', '--dry-run', '--root', vivant, '--target-claude', targetClaude, '--apps-dir', appsDir, '--backup-dir', backupDir, '--yes']);
  assert.equal(r.status, 0, r.stderr);
  const normalise = normaliser(r.stdout, [
    [vivant, '<VIVANT>'], [targetClaude, '<CLAUDE>'], [appsDir, '<APPS>'], [backupDir, '<BACKUPS>'],
  ]);
  const temoin = fs.readFileSync(TEMOIN, 'utf8');
  assert.equal(normalise, temoin, 'la prose humaine a divergé du témoin enregistré AVANT ce lot (CA-M8) — toute divergence hors jetons normalisés est une régression du verbe gaté PASS');
  // CONTREFACTUEL (joué et révoqué, cf. rapport de remise) : changer UN mot d'un message humain
  // (ex. "déjà à jour" -> "à jour") fait diverger `normalise` du témoin -> `assert.equal` rougit
  // en affichant les DEUX chaînes complètes (Node imprime un diff), nommant la ligne concernée.
});

test('CA-M8, non-régression croisée : `install --dry-run` en mode HUMAIN ne contient aucune ligne NDJSON valide (aucune fuite du mode machine vers le mode humain)', () => {
  // Rejoue le même scénario et vérifie l'ABSENCE de toute ligne qui parserait comme un événement
  // du vocabulaire machine — distinct d'une simple ligne commençant par "[" (prose légitime, ex.
  // "[1/4] CLI"), d'où le test `JSON.parse` + vérification du champ `evt`, jamais une regex naïve
  // sur le premier caractère.
  const vivant = faireReservoirVivant({ version: '0.39.0' });
  const r = run(['install', '--dry-run', '--root', vivant, '--target-claude', path.join(tmp(), 'claude'), '--apps-dir', path.join(tmp(), 'apps'), '--backup-dir', path.join(tmp(), 'backups'), '--yes']);
  const fuites = [];
  for (const ligne of r.stdout.split('\n')) {
    if (ligne.trim() === '') continue;
    try {
      const o = JSON.parse(ligne);
      if (o && typeof o === 'object' && typeof o.evt === 'string') fuites.push(ligne);
    } catch { /* prose humaine normale, pas du JSON — attendu */ }
  }
  assert.deepEqual(fuites, [], `ligne(s) machine fuyant dans le flux humain : ${fuites.join(' | ')}`);
});

// =================================================================================================
// CA-M9 — `--dry-run` n'écrit toujours rien, avec les TROIS invocations neuves (empreinte disque
// avant/après, jamais une lecture de code — même idiome que install-verbe.test.js:CA-03).
// =================================================================================================

function empreinte(dir) {
  const out = [];
  const walk = (d, rel) => {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(p, r);
      else out.push(`${r}:${fs.readFileSync(p, 'utf8').length}`);
    }
  };
  walk(dir, '');
  return out.join('\n');
}

for (const [nom, flags] of [['--dry-run', []], ['--dry-run --events', ['--events']], ['--dry-run --json', ['--json']]]) {
  test(`CA-M9 : "${nom}" n'écrit RIEN — empreinte disque avant/après identique (les TROIS invocations exigées par l'instruction)`, () => {
    const vivant = faireReservoirVivant({ version: '0.39.0' });
    const targetClaude = path.join(tmp(), 'claude');
    const appsDir = path.join(tmp(), 'apps');
    const backupDir = path.join(tmp(), 'backups');
    const avant = { vivant: empreinte(vivant), claude: empreinte(targetClaude), apps: empreinte(appsDir), backups: empreinte(backupDir) };
    const r = run(['install', '--dry-run', ...flags, '--root', vivant, '--target-claude', targetClaude, '--apps-dir', appsDir, '--backup-dir', backupDir, '--yes']);
    const apres = { vivant: empreinte(vivant), claude: empreinte(targetClaude), apps: empreinte(appsDir), backups: empreinte(backupDir) };
    assert.equal(apres.vivant, avant.vivant, `${nom} : le réservoir vivant ne doit subir AUCUNE écriture`);
    assert.equal(apres.claude, avant.claude, `${nom} : --target-claude ne doit subir AUCUNE écriture`);
    assert.equal(apres.apps, avant.apps, `${nom} : --apps-dir ne doit subir AUCUNE écriture`);
    assert.equal(apres.backups, avant.backups, `${nom} : --backup-dir ne doit subir AUCUNE écriture`);
    assert.equal(r.status, 0, r.stderr);
    // CONTREFACTUEL (faire écrire un fichier d'état par --events) : ferait diverger apres.claude
    // (ou une autre zone) de avant.claude -> rouge, nommant la zone touchée.
  });
}
