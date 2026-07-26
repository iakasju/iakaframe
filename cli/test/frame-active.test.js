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
  readPortfolioDefaultFrame, resolveFrameForInit, frameVersionOf, frameCoherence,
  parseJsonFile, readActiveFramePointer, writeActiveFramePointer,
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

// --- Lot 2 (galerie-models-actionnable.md, D-1/D-4) : source unique CLI<->GUI du pointeur ---

test('parseJsonFile : objet JSON ; absent / illisible / non-objet -> {} (jamais de jet)', () => {
  const f = path.join(tmp(), 'iakaframe.json');
  fs.writeFileSync(f, JSON.stringify({ frame: 'trio', runner: 'claude-code' }));
  assert.deepEqual(parseJsonFile(f), { frame: 'trio', runner: 'claude-code' });
  assert.deepEqual(parseJsonFile('/nexiste/pas.json'), {});
  const bad = path.join(tmp(), 'iakaframe.json'); fs.writeFileSync(bad, '{ not json');
  assert.deepEqual(parseJsonFile(bad), {});
  const arr = path.join(tmp(), 'iakaframe.json'); fs.writeFileSync(arr, '[1,2]');
  assert.deepEqual(parseJsonFile(arr), {});
});

test('activeFrameId : iakaframe.json `frame` PRIORITAIRE, repli .iakaframe `frame=`, sinon default (A6)', () => {
  // (1) iakaframe.json prioritaire — meme si .iakaframe porte une autre valeur
  const p1 = tmp();
  fs.writeFileSync(path.join(p1, 'iakaframe.json'), JSON.stringify({ frame: 'kanban', runner: 'claude-code' }));
  fs.writeFileSync(path.join(p1, '.iakaframe'), 'frame=trio\n');
  assert.equal(activeFrameId(p1), 'kanban');
  // (2) repli .iakaframe quand iakaframe.json sans cle frame
  const p2 = tmp();
  fs.writeFileSync(path.join(p2, 'iakaframe.json'), JSON.stringify({ runner: 'claude-code' }));
  fs.writeFileSync(path.join(p2, '.iakaframe'), 'frame=trio\n');
  assert.equal(activeFrameId(p2), 'trio');
  // (3) aucun des deux -> default cable
  assert.equal(activeFrameId(tmp()), HARDWIRED_DEFAULT_FRAME);
  assert.equal(readActiveFramePointer(tmp()), ''); // brut : '' (pas de repli DUR ici)
});

test('writeActiveFramePointer : ecriture NON destructive de `frame`, retrait sur vide, refus si illisible (A9)', () => {
  const proj = tmp();
  const file = path.join(proj, 'iakaframe.json');
  // pose sur un fichier existant : preserve runner/node/note
  fs.writeFileSync(file, JSON.stringify({ runner: 'claude-code', node: 'claude', note: 'x' }, null, 2));
  const r = writeActiveFramePointer(proj, 'trio');
  assert.equal(r.ok, true);
  const cfg = parseJsonFile(file);
  assert.equal(cfg.frame, 'trio');
  assert.equal(cfg.runner, 'claude-code'); // preserve
  assert.equal(cfg.node, 'claude');
  assert.equal(cfg.note, 'x');
  // relecture par activeFrameId (round-trip)
  assert.equal(activeFrameId(proj), 'trio');
  // valeur vide -> retrait de la cle (repli default), autres cles intactes
  writeActiveFramePointer(proj, '');
  const cfg2 = parseJsonFile(file);
  assert.equal('frame' in cfg2, false);
  assert.equal(cfg2.runner, 'claude-code');
  assert.equal(activeFrameId(proj), HARDWIRED_DEFAULT_FRAME);
  // fichier illisible -> refus (jamais d'ecrasement)
  fs.writeFileSync(file, '{ not json');
  const bad = writeActiveFramePointer(proj, 'trio');
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, 'unreadable');
  assert.equal(fs.readFileSync(file, 'utf8'), '{ not json'); // intact
  // fichier absent -> cree avec la seule cle frame
  const p2 = tmp();
  writeActiveFramePointer(p2, 'trio');
  assert.equal(parseJsonFile(path.join(p2, 'iakaframe.json')).frame, 'trio');
});

test('frameCoherence : lit le pointeur iakaframe.json en priorite (source unique)', () => {
  const root = synthRoot();
  const proj = tmp();
  fs.writeFileSync(path.join(proj, 'iakaframe.json'), JSON.stringify({ frame: 'trio' }));
  const claude = path.join(proj, '.claude');
  fs.mkdirSync(claude, { recursive: true });
  fs.writeFileSync(path.join(claude, 'iakaframe-kit.json'),
    JSON.stringify({ methodId: 'iakaframe', teamId: 'trio', node: 'claude' }));
  const okc = frameCoherence(proj, root);
  assert.equal(okc.ok, true);
  assert.equal(okc.status, 'coherent');
  assert.equal(okc.frame, 'trio');
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

test('frameCoherence : coherent / divergent / statuts neutres (A-coherence)', () => {
  const root = synthRoot(); // frame trio -> methodId iakaframe / teamId trio
  const proj = tmp();
  // Pas de pointeur -> neutre
  assert.equal(frameCoherence(proj, root).status, 'no-pointer');
  // Pointeur present, pas de kit deploye -> neutre
  fs.writeFileSync(path.join(proj, '.iakaframe'), 'frame=trio\n');
  assert.equal(frameCoherence(proj, root).status, 'no-kit');
  // kit deploye COHERENT (method iakaframe / team trio)
  const claude = path.join(proj, '.claude');
  fs.mkdirSync(claude, { recursive: true });
  fs.writeFileSync(path.join(claude, 'iakaframe-kit.json'),
    JSON.stringify({ methodId: 'iakaframe', teamId: 'trio', node: 'claude' }));
  const okc = frameCoherence(proj, root);
  assert.equal(okc.ok, true);
  assert.equal(okc.status, 'coherent');
  // kit deploye DIVERGENT (team iakaframe-8 alors que la frame trio veut trio)
  fs.writeFileSync(path.join(claude, 'iakaframe-kit.json'),
    JSON.stringify({ methodId: 'iakaframe', teamId: 'iakaframe-8', node: 'claude' }));
  const div = frameCoherence(proj, root);
  assert.equal(div.ok, false);
  assert.equal(div.status, 'divergent');
  assert.match(div.reason, /diverge/);
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

test('init : seme AUSSI le pointeur canon iakaframe.json cle `frame` (D-4, source unique)', () => {
  const proj = path.join(tmp(), 'proj');
  const r = spawnSync('node', [CLI, 'init', '--path', proj, '--node', 'claude'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const cfg = parseJsonFile(path.join(proj, 'iakaframe.json'));
  assert.equal(cfg.frame, 'iakaframe');
  // et le lecteur canon rend bien cette frame (bout en bout)
  assert.equal(activeFrameId(proj), 'iakaframe');
});

test('config : sur iakaframe.json ILLISIBLE, N EFFACE PAS `frame` (R1 corrige, A8)', () => {
  const proj = tmp();
  const file = path.join(proj, 'iakaframe.json');
  // JSON valide portant `frame` : config le PRESERVE (cas nominal)
  fs.writeFileSync(file, JSON.stringify({ frame: 'kanban' }, null, 2) + '\n');
  const okc = spawnSync('node', [CLI, 'config', '--path', proj, '--node', 'claude'], { encoding: 'utf8' });
  assert.equal(okc.status, 0, okc.stderr);
  assert.equal(parseJsonFile(file).frame, 'kanban', 'frame preserve apres config nominal');
  // JSON ILLISIBLE : config S ABSTIENT (exit 1) et laisse le fichier intact (frame non efface)
  fs.writeFileSync(file, '{ not json');
  const bad = spawnSync('node', [CLI, 'config', '--path', proj, '--node', 'claude', '--json'], { encoding: 'utf8' });
  assert.equal(bad.status, 1, 'config s abstient sur illisible');
  assert.equal(fs.readFileSync(file, 'utf8'), '{ not json', 'fichier intact (pas de reecriture a vide)');
  const out = JSON.parse(bad.stdout);
  assert.equal(out.ok, false);
});

test('frame use <id> : ecrit le pointeur iakaframe.json (non destructif) ; refuse un id inconnu (D-5, A9)', () => {
  const root = synthRoot();
  const proj = tmp();
  fs.writeFileSync(path.join(proj, 'iakaframe.json'), JSON.stringify({ runner: 'claude-code', node: 'claude' }, null, 2));
  // pose 'trio' (existe dans le reservoir synthetique) — preserve runner/node
  const r = spawnSync('node', [CLI, 'frame', 'use', 'trio', '--path', proj, '--root', root, '--json'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.ok, true);
  assert.equal(out.frame, 'trio');
  const cfg = parseJsonFile(path.join(proj, 'iakaframe.json'));
  assert.equal(cfg.frame, 'trio');
  assert.equal(cfg.runner, 'claude-code'); // preserve
  assert.equal(cfg.node, 'claude');
  assert.equal(activeFrameId(proj), 'trio'); // lu par le canon (l'ordre a Odin)
  // id inconnu -> refus, pas d'ecriture d'un dangling
  const bad = spawnSync('node', [CLI, 'frame', 'use', 'fantome', '--path', proj, '--root', root, '--json'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).ok, false);
  assert.equal(parseJsonFile(path.join(proj, 'iakaframe.json')).frame, 'trio', 'pointeur inchange apres refus');
  // valeur vide -> retrait de la cle (repli default)
  const empty = spawnSync('node', [CLI, 'frame', 'use', '', '--path', proj, '--root', root, '--json'], { encoding: 'utf8' });
  assert.equal(empty.status, 0, empty.stderr);
  assert.equal('frame' in parseJsonFile(path.join(proj, 'iakaframe.json')), false);
  assert.equal(activeFrameId(proj), HARDWIRED_DEFAULT_FRAME);
});
