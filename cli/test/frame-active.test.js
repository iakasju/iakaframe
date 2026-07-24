// Reservoir de frames (reservoir-de-frames.md) : pointeur de frame active (projet + portefeuille),
// repli TOUJOURS defini (A5/A11), lecture par fullteam/assignedPersonas (A7/A8), stamp init (A4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HARDWIRED_DEFAULT_FRAME, parseKeyValueFile, activeFrameId, activeTeamId,
  readPortfolioDefaultFrame, resolveFrameForInit, frameVersionOf,
} from '../src/lib/frame-active.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(HERE, '..', 'src', 'index.js');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-frame-')); }

// Racine synthetique : reutilise la VRAIE library/methods du depot (symlinks), + teams/ et frames/
// propres pour eprouver une frame a team REDUITE sans toucher au canon.
function synthRoot() {
  const root = tmp();
  fs.symlinkSync(path.join(REPO, 'library'), path.join(root, 'library'));
  fs.symlinkSync(path.join(REPO, 'methods'), path.join(root, 'methods'));
  fs.mkdirSync(path.join(root, 'teams'));
  fs.mkdirSync(path.join(root, 'frames'));
  // team reduite : 3 personas (dont odin, hors dispatch).
  fs.writeFileSync(path.join(root, 'teams', 'trio.md'),
    '---\nid: trio\nname: Trio\npersonas: [odin, aragorn, gimli]\ncoordinator: aragorn\n---\n# trio\n');
  fs.writeFileSync(path.join(root, 'frames', 'trio.md'),
    '---\nid: trio\nname: Frame trio\nversion: v9.9.9\nmethodId: iakaframe\nteamId: trio\n---\n# frame trio\n');
  // default present aussi (copie du descripteur canon).
  fs.copyFileSync(path.join(REPO, 'frames', 'iakaframe.md'), path.join(root, 'frames', 'iakaframe.md'));
  return root;
}

test('parseKeyValueFile : cle=valeur, 1re occurrence gagne, # ignore', () => {
  const f = path.join(tmp(), '.iakaframe');
  fs.writeFileSync(f, '# titre\nframe=iakaframe\nframeVersion=v1\nframe=autre\n\n');
  const kv = parseKeyValueFile(f);
  assert.equal(kv.frame, 'iakaframe');
  assert.equal(kv.frameVersion, 'v1');
  assert.deepEqual(parseKeyValueFile('/nexiste/pas'), {});
});

test('activeFrameId : lit frame= ; absent -> default cable (A11)', () => {
  const proj = tmp();
  fs.writeFileSync(path.join(proj, '.iakaframe'), 'iakaframe=v0\nframe=trio\nnode=claude\n');
  assert.equal(activeFrameId(proj), 'trio');
  // pointeur sans frame= / hors projet -> repli default
  assert.equal(activeFrameId(tmp()), HARDWIRED_DEFAULT_FRAME);
  assert.equal(activeFrameId(undefined), HARDWIRED_DEFAULT_FRAME);
});

test('activeTeamId : frame active -> teamId du descripteur ; repli default', () => {
  const root = synthRoot();
  const proj = tmp();
  fs.writeFileSync(path.join(proj, '.iakaframe'), 'frame=trio\n');
  assert.equal(activeTeamId(proj, root), 'trio');
  // frame inconnue -> repli sur la team du default (iakaframe-8)
  const proj2 = tmp();
  fs.writeFileSync(path.join(proj2, '.iakaframe'), 'frame=inexistante\n');
  assert.equal(activeTeamId(proj2, root), 'iakaframe-8');
});

test('readPortfolioDefaultFrame : herite du marqueur chapeau (parent du projet) ; absent -> null (A5)', () => {
  const hat = tmp();
  const proj = path.join(hat, 'monprojet');
  fs.mkdirSync(proj);
  assert.equal(readPortfolioDefaultFrame(proj), null); // repli cable a l'appelant
  fs.writeFileSync(path.join(hat, '.iakaframe-portefeuille'), 'defaultFrame=trio\ndefaultFrameVersion=v9.9.9\n');
  const pf = readPortfolioDefaultFrame(proj);
  assert.equal(pf.frame, 'trio');
  assert.equal(pf.frameVersion, 'v9.9.9');
});

test('resolveFrameForInit : repli cable iakaframe sans marqueur, herite avec marqueur (A5)', () => {
  const root = synthRoot();
  const hat = tmp();
  const proj = path.join(hat, 'p');
  fs.mkdirSync(proj);
  // sans marqueur portefeuille -> repli cable, version = descripteur default (v0.20.0)
  const repli = resolveFrameForInit(proj, root, 'vTOOL');
  assert.equal(repli.frame, HARDWIRED_DEFAULT_FRAME);
  assert.equal(repli.frameVersion, frameVersionOf(HARDWIRED_DEFAULT_FRAME, root, 'vTOOL'));
  // avec marqueur -> herite, version = descripteur de la frame heritee
  fs.writeFileSync(path.join(hat, '.iakaframe-portefeuille'), 'defaultFrame=trio\n');
  const herite = resolveFrameForInit(proj, root, 'vTOOL');
  assert.equal(herite.frame, 'trio');
  assert.equal(herite.frameVersion, 'v9.9.9'); // AR-3 : version DU DESCRIPTEUR trio
});

test('init : le marqueur .iakaframe porte frame= ET frameVersion= en plus des cles existantes (A4)', () => {
  const proj = path.join(tmp(), 'proj');
  const r = spawnSync('node', [CLI, 'init', '--path', proj, '--node', 'claude'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const kv = parseKeyValueFile(path.join(proj, '.iakaframe'));
  // cles existantes preservees (additif, non destructif)
  assert.ok(kv.iakaframe, 'iakaframe= conserve');
  assert.equal(kv.node, 'claude');
  assert.ok(kv.contract && kv.installed, 'contract=/installed= conserves');
  // cles neuves
  assert.equal(kv.frame, 'iakaframe');           // repli cable (pas de marqueur portefeuille)
  assert.ok(kv.frameVersion, 'frameVersion= present');
});
