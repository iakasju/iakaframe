// Tests de l'ADAPTATEUR D'ETAT de la couche CHANTIER (Lot 2 UNIQUEMENT,
// specs/instructions/declaration-chantier-session.md § D-1/D-4/D-8/D-9/D-10 — 2e amendement).
// Couvre chantier-state.mjs : registre JSONL (D-1), resolution chemin -> `key` (D-4), depots
// connus (D-4 §3), exclusions (D-8), hors-limite absolu (D-9), panne interne (D-10). Le coeur pur
// (guard-core.mjs : `foldChantier`, `mainRoleOf`, `verdictChantier`, `verdictDispatch`,
// `classifyShell`...) est verrouille par guard-core.test.js (Lots 1/1bis) ; il n'est importe ici
// que pour construire des fixtures d'etat replie.
//
// Ce fichier NE couvre PAS chantier-remind.mjs (Lot 3, UserPromptSubmit) ni aucune liaison de
// chantier par sous-agent (ex-D-13, EXCLUE par le 2e amendement — jamais de `chantier-bind.mjs`,
// jamais de `pickBinding`). Ces parties restent dans cli/test/guard-chantier.test.js (fichier de
// travail du Lot 3, non commite en l'etat par ce lot).
//
// AUCUN test ici n'ecrit dans le vrai `~/.claude` : chaque test redirige HOME/USERPROFILE et
// IAKAFRAME_ROOT vers un tmpdir dedie (sandbox).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  appendEvent, countFailOpens, ensureLaunch, failOpen, hardDeny, isExcluded, keyOf, knownRepos,
  loadState, normalize, registryPath, resolveRepoArg, sessionShellHint,
} from '../../kits/iakaframe-claude/global/hooks/chantier-state.mjs';
import { foldChantier } from '../../kits/iakaframe-claude/global/hooks/guard-core.mjs';

// ---------------------------------------------------------------------------
// Sandbox : HOME/USERPROFILE + IAKAFRAME_ROOT rediriges vers un tmpdir. JAMAIS le vrai ~/.claude.
// ---------------------------------------------------------------------------

// Capturee AVANT tout `withEnv` (qui redirige HOME/USERPROFILE, dont depend `os.homedir()` sous
// win32) : le VRAI home de la machine, utilise UNIQUEMENT comme ancetre EXISTANT garanti hors de
// `os.tmpdir()`, pour construire un chemin de fixture qui n'est PAS nichE sous le tmpdir de l'OS
// (contrairement a `root`/`home` de sandbox, cf. `tmpDir`) — jamais pour y ecrire quoi que ce soit.
const REAL_HOME = os.homedir();

let seq = 0;
function nextSid() {
  seq += 1;
  return `test${process.pid}${Date.now()}${seq}`.replace(/[^A-Za-z0-9-]/g, '');
}

function tmpDir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function makeSandbox() {
  const home = tmpDir('iaka-chantier-home-');
  const root = tmpDir('iaka-chantier-root-');
  return { home, root };
}

function makeRepo(root, name) {
  const dir = path.join(root, name);
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  return dir;
}

function registryFile(home, sid) {
  return path.join(home, '.claude', 'iakaframe-sessions', `${sid}.jsonl`);
}

function readRegistry(home, sid) {
  const p = registryFile(home, sid);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
}

// Override PROCESS-LOCAL (import direct, pas de spawnSync) : sauvegarde et restaure
// HOME/USERPROFILE/IAKAFRAME_ROOT autour de `fn`.
function withEnv(overrides, fn) {
  const keys = Object.keys(overrides);
  const saved = {};
  for (const k of keys) saved[k] = process.env[k];
  for (const k of keys) {
    if (overrides[k] === undefined) delete process.env[k];
    else process.env[k] = overrides[k];
  }
  try {
    return fn();
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

// ===========================================================================
// D-1 — Registre JSONL append-only
// ===========================================================================

test('registryPath : sid valide -> chemin sous <home>/.claude/iakaframe-sessions ; sid invalide -> null', () => {
  const { home } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home }, () => {
    const p = registryPath('abc-123');
    assert.equal(p, path.join(home, '.claude', 'iakaframe-sessions', 'abc-123.jsonl'));
    assert.equal(registryPath('has spaces'), null);
    assert.equal(registryPath('../evil'), null);
    assert.equal(registryPath(''), null);
    assert.equal(registryPath(null), null);
  });
});

test('loadState : registre absent -> null ; lignes corrompues tolerees (D-1)', () => {
  const { home } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home }, () => {
    assert.equal(loadState('nope'), null);
    const sid = nextSid();
    const p = registryPath(sid);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, 'not json\n{"type":"launch","key":{"kind":"portefeuille","root":"/w","name":"@portefeuille"}}\n\n', 'utf8');
    const st = loadState(sid);
    assert.equal(st.active.key.name, '@portefeuille');
  });
});

test('appendEvent + ensureLaunch : init paresseuse, cree le launch au 1er appel seulement', () => {
  const { home, root } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root }, () => {
    const sid = nextSid();
    const r1 = ensureLaunch({ session_id: sid, cwd: root });
    assert.equal(r1.created, true);
    assert.equal(r1.state.active.key.kind, 'portefeuille');
    const r2 = ensureLaunch({ session_id: sid, cwd: root });
    assert.equal(r2.created, false);
    assert.equal(readRegistry(home, sid).length, 1);
  });
});

test('ensureLaunch : session_id invalide -> null (couche chantier ignoree, D-1)', () => {
  const { home, root } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root }, () => {
    assert.equal(ensureLaunch({ session_id: 'a b', cwd: root }), null);
    assert.equal(ensureLaunch({ cwd: root }), null);
  });
});

// --- D-1/Q-F : main_role / main_agent_type poses par ensureLaunch (ecart corrige du Lot 2) ------

test('ensureLaunch : agent_type absent -> main_role:"odin", main_agent_type:null', () => {
  const { home, root } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root }, () => {
    const sid = nextSid();
    const r = ensureLaunch({ session_id: sid, cwd: root });
    assert.equal(r.state.launch.main_role, 'odin');
    assert.equal(r.state.launch.main_agent_type, null);
    const launchEv = readRegistry(home, sid).find((e) => e.type === 'launch');
    assert.equal(launchEv.main_role, 'odin');
    assert.equal(launchEv.main_agent_type, null);
  });
});

test('ensureLaunch : agent_type:"odin" (n\'importe quelle casse) -> main_role:"odin"', () => {
  const { home, root } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root }, () => {
    const sid = nextSid();
    const r = ensureLaunch({ session_id: sid, cwd: root, agent_type: 'Odin' });
    assert.equal(r.state.launch.main_role, 'odin');
    assert.equal(r.state.launch.main_agent_type, 'Odin');
  });
});

test('ensureLaunch : agent_type:"aragorn" -> main_role:"team", main_agent_type:"aragorn" (Q-F)', () => {
  const { home, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  withEnv({ HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root }, () => {
    const sid = nextSid();
    const r = ensureLaunch({ session_id: sid, cwd: repoA, agent_type: 'aragorn' });
    assert.equal(r.state.launch.main_role, 'team');
    assert.equal(r.state.launch.main_agent_type, 'aragorn');
    assert.equal(r.state.launch.key.kind, 'repo');
  });
});

test('ensureLaunch : payload avec agent_id (cas theorique, D-1) -> main_role:"odin", main_agent_type:null, quel que soit agent_type', () => {
  const { home, root } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root }, () => {
    const sid = nextSid();
    const r = ensureLaunch({ session_id: sid, cwd: root, agent_id: 'sub-1', agent_type: 'gimli' });
    assert.equal(r.state.launch.main_role, 'odin');
    assert.equal(r.state.launch.main_agent_type, null);
  });
});

// ===========================================================================
// D-4 — Resolution chemin -> `key`
// ===========================================================================

test('normalize (M-12) : idempotent sur un dossier existant ; ne jette jamais', () => {
  const { root } = makeSandbox();
  const dir = makeRepo(root, 'repoA');
  const n1 = normalize(dir);
  const n2 = normalize(n1);
  assert.equal(n1, n2);
  // Chemin totalement inexistant : ne jette pas, renvoie une forme resolue.
  assert.doesNotThrow(() => normalize(path.join(root, 'ne-existe-pas', 'x.txt')));
});

test('normalize (M-12, win32) : casse differente de la racine -> meme forme canonique', { skip: process.platform !== 'win32' }, () => {
  const { root } = makeSandbox();
  const dir = makeRepo(root, 'RepoCasse');
  const upper = normalize(dir.toUpperCase());
  const asis = normalize(dir);
  assert.equal(upper, asis);
});

test('keyOf : depot (racine .git), fichier niche dans le depot, hors racine', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    const repoA = makeRepo(root, 'repoA');
    const k1 = keyOf(repoA);
    assert.equal(k1.kind, 'repo');
    assert.equal(k1.name, 'repoA');
    assert.equal(normalize(k1.root), normalize(repoA));

    const nested = path.join(repoA, 'src', 'x.js');
    fs.mkdirSync(path.dirname(nested), { recursive: true });
    fs.writeFileSync(nested, '// x', 'utf8');
    const k2 = keyOf(nested);
    assert.equal(k2.kind, 'repo');
    assert.equal(normalize(k2.root), normalize(repoA));

    const outside = path.join(os.tmpdir(), 'clairement-hors-racine-' + Date.now());
    fs.mkdirSync(outside, { recursive: true });
    const k3 = keyOf(outside);
    assert.equal(k3.kind, 'hors');
    assert.equal(k3.name, '@hors');
  });
});

test('keyOf : racine elle-meme et dossier `.xxx` de 1er niveau -> portefeuille ; dossier normal de 1er niveau -> dir', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    assert.equal(keyOf(root).kind, 'portefeuille');

    const hidden = path.join(root, '.claude');
    fs.mkdirSync(hidden, { recursive: true });
    assert.equal(keyOf(hidden).kind, 'portefeuille');
    assert.equal(keyOf(path.join(hidden, 'settings.json')).kind, 'portefeuille');

    const projDir = path.join(root, 'neuf');
    fs.mkdirSync(projDir, { recursive: true }); // pas de .git : simple dossier de 1er niveau
    const kd = keyOf(projDir);
    assert.equal(kd.kind, 'dir');
    assert.equal(kd.name, 'neuf');
  });
});

test('keyOf : fichier EXISTANT directement dans la racine -> portefeuille', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    const notes = path.join(root, 'notes.md');
    fs.writeFileSync(notes, 'x', 'utf8');
    assert.equal(keyOf(notes).kind, 'portefeuille');
  });
});

test('keyOf : worktree (`.git` fichier `gitdir: .../worktrees/<n>`) attribuee au depot PRINCIPAL', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    const repoA = makeRepo(root, 'repoA');
    const wtDir = path.join(repoA, '.claude', 'worktrees', 'w1');
    fs.mkdirSync(wtDir, { recursive: true });
    const gitdirTarget = path.join(repoA, '.git', 'worktrees', 'w1');
    fs.mkdirSync(gitdirTarget, { recursive: true });
    fs.writeFileSync(path.join(wtDir, '.git'), `gitdir: ${gitdirTarget}\n`, 'utf8');
    const target = path.join(wtDir, 'foo.js');
    fs.writeFileSync(target, '// foo', 'utf8');

    const k = keyOf(target);
    assert.equal(k.kind, 'repo');
    assert.equal(k.name, 'repoA');
    assert.equal(normalize(k.root), normalize(repoA));
  });
});

// ===========================================================================
// D-4 §3 — Depots connus, resolution nom/chemin -> `key`
// ===========================================================================

test('knownRepos : scanne les depots de 1er niveau + les cles deja presentes dans un etat replie', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    makeRepo(root, 'repoA');
    const names = knownRepos();
    assert.ok(names.includes('repoA'));

    const state = foldChantier([JSON.stringify({
      type: 'launch', at: new Date().toISOString(),
      key: { kind: 'repo', root: '/ailleurs/repoZ', name: 'repoZ' },
      main_role: 'odin',
    })]);
    assert.ok(knownRepos(state).includes('repoZ'));
  });
});

test('knownRepos : etat replie SANS bindings/dispatches (Lot 1bis) -> ne jette pas, ignore ce qui n\'existe plus', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    // `foldChantier` (Lot 1bis) ignore desormais les types `dispatch`/`bind` d'un registre HERITE.
    const state = foldChantier([
      JSON.stringify({ type: 'launch', at: new Date().toISOString(), key: { kind: 'repo', root: '/w/repoZ', name: 'repoZ' }, main_role: 'odin' }),
      JSON.stringify({ type: 'dispatch', at: new Date().toISOString(), key: { kind: 'repo', root: '/w/repoY', name: 'repoY' } }),
      JSON.stringify({ type: 'bind', at: new Date().toISOString(), key: { kind: 'repo', root: '/w/repoX', name: 'repoX' } }),
    ]);
    assert.equal(state.bindings, undefined);
    assert.equal(state.dispatches, undefined);
    const names = knownRepos(state);
    assert.ok(names.includes('repoZ'));
    assert.ok(!names.includes('repoY'), 'un ancien `dispatch` ignore ne doit pas rendre un depot "connu"');
    assert.ok(!names.includes('repoX'), 'un ancien `bind` ignore ne doit pas rendre un depot "connu"');
  });
});

test('resolveRepoArg : "@portefeuille", chemin absolu, nom connu, creation de projet (dir), inexistant + requireExisting', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    assert.equal(resolveRepoArg('@portefeuille').key.kind, 'portefeuille');

    const repoA = makeRepo(root, 'repoA');
    assert.equal(resolveRepoArg(repoA).key.kind, 'repo');
    assert.equal(resolveRepoArg(repoA, { requireExisting: true }).key.kind, 'repo');

    assert.equal(resolveRepoArg('repoA').key.name, 'repoA');

    // Creation de projet : nom INCONNU sous la racine -> accepte (kind:"dir"), jamais pour odin-direct.
    const created = resolveRepoArg('neuf');
    assert.equal(created.key.kind, 'dir');
    assert.equal(created.key.name, 'neuf');
    assert.deepEqual(resolveRepoArg('neuf', { requireExisting: true }), { unknown: true });

    // Chemin absolu inexistant + requireExisting -> unknown (odin-direct exige un dossier existant).
    const nope = path.join(root, 'jamais-cree');
    assert.deepEqual(resolveRepoArg(nope, { requireExisting: true }), { unknown: true });
  });
});

test('resolveRepoArg : nom ambigu (deux depots de meme nom, racines differentes) -> ambiguous ; chemin absolu -> resout (M-10)', () => {
  const { root } = makeSandbox();
  withEnv({ IAKAFRAME_ROOT: root }, () => {
    const scanned = makeRepo(root, 'naonedge'); // candidat #1 : sous la racine

    const otherRoot = tmpDir('iaka-chantier-other-');
    const clone = makeRepo(otherRoot, 'naonedge'); // candidat #2 : connu via le depot de lancement d'ailleurs
    const state = foldChantier([JSON.stringify({
      type: 'launch', at: new Date().toISOString(),
      key: { kind: 'repo', root: clone, name: 'naonedge' },
      main_role: 'odin',
    })]);

    assert.deepEqual(resolveRepoArg('naonedge', { state }), { ambiguous: true });
    // Le chemin ABSOLU, lui, leve l'ambiguite (D-3 : "refus + rappel demandant le chemin absolu").
    assert.equal(normalize(resolveRepoArg(scanned, { state }).key.root), normalize(scanned));
    assert.equal(normalize(resolveRepoArg(clone, { state }).key.root), normalize(clone));
  });
});

// ===========================================================================
// D-8 — Exclusions
// ===========================================================================

test('isExcluded : scratchpad_dir et os.tmpdir() exclus, meme sans chantier ; payload sans scratchpad_dir ne jette pas', () => {
  const { home, root } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root }, () => {
    const scratch = tmpDir('iaka-chantier-scratch-');
    const target = path.join(scratch, 'notes.md');
    assert.equal(isExcluded(target, { scratchpad_dir: scratch }), true);
    assert.equal(isExcluded(path.join(os.tmpdir(), 'un-fichier.tmp'), {}), true);
    // Chemin de PROJET ORDINAIRE : NON exclu. Delibrement HORS de `root` (fixture sous
    // os.tmpdir(), cf. `tmpDir`) : un vrai depot ne vit jamais sous le dossier temporaire de
    // l'OS, contrairement a `root`/`home` ici (artefact de sandbox de test, D-8 "os.tmpdir()").
    const ordinary = path.join(REAL_HOME, 'repoA', 'x.js');
    assert.doesNotThrow(() => isExcluded(ordinary, undefined));
    assert.equal(isExcluded(ordinary, {}), false);
  });
});

test('isExcluded : alias devnull (/dev/null, NUL, $null) toujours exclus', () => {
  assert.equal(isExcluded('/dev/null', {}), true);
  assert.equal(isExcluded('NUL', {}), true);
  assert.equal(isExcluded('$null', {}), true);
});

test('isExcluded : ~/.claude/** exclu SAUF les chemins hors-limite D-9 (jamais silencieusement exclus)', () => {
  const { home } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home }, () => {
    const harmless = path.join(home, '.claude', 'un-fichier-quelconque.txt');
    assert.equal(isExcluded(harmless, {}), true);
    const settings = path.join(home, '.claude', 'settings.json');
    assert.equal(isExcluded(settings, {}), false); // hors-limite D-9 : jamais "exclu" (silencieux)
  });
});

// ===========================================================================
// D-9 — Hors-limite absolu
// ===========================================================================

test('hardDeny : couvre settings.json, hooks/**, le fichier ALLOW_EXTRA et le registre', () => {
  const { home } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home }, () => {
    assert.deepEqual(hardDeny(path.join(home, '.claude', 'settings.json')), { denied: true, code: 'DENY_HARNESS' });
    assert.deepEqual(hardDeny(path.join(home, '.claude', 'hooks', 'perimeter-guard.mjs')), { denied: true, code: 'DENY_HARNESS' });
    assert.deepEqual(hardDeny(path.join(home, '.claude', 'iakaframe-perimeter-allow.txt')), { denied: true, code: 'DENY_HARNESS' });
    const sid = nextSid();
    assert.deepEqual(hardDeny(path.join(home, '.claude', 'iakaframe-sessions', `${sid}.jsonl`)), { denied: true, code: 'DENY_REGISTRY' });
    assert.equal(hardDeny(path.join(home, 'ailleurs.txt')).denied, false);
  });
});

test('hardDeny : double comparaison (Q-C) — un chemin dont la forme NORMALISEE tombe dans le harnais est refuse', { skip: process.platform === 'win32' }, (t) => {
  const { home, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const hooksDir = path.join(home, '.claude', 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  const real = path.join(hooksDir, 'perimeter-guard.mjs');
  fs.writeFileSync(real, '// x', 'utf8');
  const alias = path.join(repoA, 'alias-vers-le-harnais.mjs');
  try {
    fs.symlinkSync(real, alias);
  } catch (e) {
    t.skip(`lien symbolique indisponible (${e.code}) : cas non exercable sur cette machine`);
    return;
  }
  withEnv({ HOME: home, USERPROFILE: home }, () => {
    // La forme BRUTE de `alias` n'est PAS sous hooks/ ; sa forme NORMALISEE (realpath) l'est.
    assert.equal(hardDeny(alias).denied, true);
  });
});

test('hardDeny (note) : lien symbolique POSIX indisponible sous win32 (EPERM) -> non exerce ici, documente', { skip: process.platform !== 'win32' }, () => {
  const { home } = makeSandbox();
  const hooksDir = path.join(home, '.claude', 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  try {
    fs.symlinkSync(path.join(hooksDir, 'x.mjs'), path.join(hooksDir, 'y.mjs'));
    fs.unlinkSync(path.join(hooksDir, 'y.mjs'));
  } catch {
    // Attendu sous win32 hors "Developer Mode" : EPERM. Rien a affirmer de plus.
  }
  assert.ok(true);
});

// ===========================================================================
// D-10 — Panne interne / sessionShellHint (D-12)
// ===========================================================================

test('failOpen : ecrit un evenement fail_open (visible via countFailOpens), message tronque a 300 c.', () => {
  const { home } = makeSandbox();
  withEnv({ HOME: home, USERPROFILE: home }, () => {
    const sid = nextSid();
    ensureLaunch({ session_id: sid, cwd: home });
    const { systemMessage } = failOpen(sid, 'chantier-remind', new Error('x'.repeat(1000)));
    assert.match(systemMessage, /^\[chantier-guard\] FAIL-OPEN : chantier-remind — /);
    assert.ok(systemMessage.length < 400);
    assert.equal(countFailOpens(sid), 1);
    failOpen(sid, 'perimeter-guard', new Error('encore'));
    assert.equal(countFailOpens(sid), 2);
  });
});

test('sessionShellHint : role "odin" -> propose de demander a Odin de lancer une session Aragorn (jamais de commande shell)', () => {
  const hint = sessionShellHint('C:\\work\\repoA', 'odin');
  assert.match(hint, /^demande a Odin de lancer une session Aragorn dans C:\\work\\repoA$/);
  assert.ok(!hint.includes('claude'), 'le role odin ne propose jamais de lancer claude lui-meme');
});

test('sessionShellHint : role "team" (ou absent) -> commande shell directe AVEC --agent aragorn, adaptee a l\'OS', { skip: process.platform !== 'win32' }, () => {
  assert.match(sessionShellHint('C:\\work\\repoA', 'team'), /^Set-Location C:\\work\\repoA ; claude --agent aragorn$/);
  assert.match(sessionShellHint('C:\\work\\repoA'), /^Set-Location C:\\work\\repoA ; claude --agent aragorn$/);
});

test('sessionShellHint : role "team" (ou absent) -> commande shell directe AVEC --agent aragorn, adaptee a l\'OS (POSIX)', { skip: process.platform === 'win32' }, () => {
  assert.match(sessionShellHint('/work/repoA', 'team'), /^cd \/work\/repoA && claude --agent aragorn$/);
  assert.match(sessionShellHint('/work/repoA'), /^cd \/work\/repoA && claude --agent aragorn$/);
});
