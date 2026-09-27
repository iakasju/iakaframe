// Tests bout-en-bout du hook `UserPromptSubmit` identity-remind.mjs (Lot P2, specs/instructions/
// prise-de-parole-odin-aragorn.md § P-5, CA-P3 a CA-P5).
//
// Le hook devient CONTEXTUEL : la voix (Aragorn/Odin) depend du LIEU de lancement de la session
// (`CLAUDE_PROJECT_DIR` ou, a defaut, `payload.cwd`), resolu par `keyOf` (chantier-state.mjs) puis
// tranche par `voiceOf` (guard-core.mjs, Lot P1). Repli TOUJOURS le texte historique (GENERIC).
//
// AUCUN test ici n'ecrit dans le vrai `~/.claude` : HOME/USERPROFILE et IAKAFRAME_ROOT sont
// rediriges vers un tmpdir dedie (sandbox) ; le hook est lance bout-en-bout via `spawnSync`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks');
const REMIND = path.join(HOOKS_DIR, 'identity-remind.mjs');

// Texte historique (P-M1), reproduit ICI verbatim pour verifier l'egalite OCTET POUR OCTET
// (CA-P5) sans dependre d'une relecture du fichier source.
const TEXTE_HISTORIQUE =
  "[Garde d'identite iakaframe] Regle de la methode : tout agent qui prend la parole " +
  "s'identifie ET annonce ce qu'il fait. La POSITION de la pastille porte le sens. " +
  "Ouverture = pastille AVANT le bloc, en TOUTE PREMIERE ligne -> <pastille> [ROYAUME][Agent] " +
  "(ex: pastille jaune puis [PORTEFEUILLE][Odin]) suivi d'une courte annonce ; " +
  "cloture = pastille APRES le bloc en derniere ligne -> [ROYAUME][Agent] <pastille>. " +
  "Double badge par intervention. Une delegation = chaine de badges.\n";

// ---------------------------------------------------------------------------
// Sandbox : HOME/USERPROFILE + IAKAFRAME_ROOT rediriges vers un tmpdir. JAMAIS le vrai ~/.claude.
// ---------------------------------------------------------------------------

function tmpDir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function makeSandbox() {
  const home = tmpDir('iaka-idremind-home-');
  const root = tmpDir('iaka-idremind-root-');
  const env = { ...process.env, HOME: home, USERPROFILE: home, IAKAFRAME_ROOT: root };
  delete env.CLAUDE_PROJECT_DIR;
  return { home, root, env };
}

function makeRepo(root, name) {
  const dir = path.join(root, name);
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  return dir;
}

function runHook(payload, env) {
  const input = payload === undefined ? '' : JSON.stringify(payload);
  return spawnSync(process.execPath, [REMIND], { input, env, encoding: 'utf8' });
}

// ===========================================================================
// CA-P3 — Lieu `repo`/`dir` -> voix Aragorn, royaume MAJUSCULE, jamais [PORTEFEUILLE][Odin].
// ===========================================================================

test('CA-P3 : CLAUDE_PROJECT_DIR = depot -> [REPOA][Aragorn], "premiere personne", jamais [PORTEFEUILLE][Odin]', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const res = runHook({ prompt: 'fais le point' }, { ...env, CLAUDE_PROJECT_DIR: repoA });
  assert.equal(res.status, 0);
  assert.match(res.stdout, /\[REPOA\]\[Aragorn\]/);
  assert.match(res.stdout, /premiere personne/);
  assert.ok(!res.stdout.includes('[PORTEFEUILLE][Odin]'));
});

test('CA-P3 : lance dans un sous-dossier du depot -> meme resultat', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sub = path.join(repoA, 'sub', 'dir');
  fs.mkdirSync(sub, { recursive: true });
  const res = runHook({ prompt: 'fais le point' }, { ...env, CLAUDE_PROJECT_DIR: sub });
  assert.equal(res.status, 0);
  assert.match(res.stdout, /\[REPOA\]\[Aragorn\]/);
  assert.match(res.stdout, /premiere personne/);
  assert.ok(!res.stdout.includes('[PORTEFEUILLE][Odin]'));
});

test('CA-P3 : worktree (.git fichier "gitdir: .../repoA/.git/worktrees/w1") -> [REPOA][Aragorn]', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const wt = path.join(root, 'repoA-wt');
  fs.mkdirSync(wt, { recursive: true });
  const gitdir = path.join(repoA, '.git', 'worktrees', 'w1').replace(/\\/g, '/');
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${gitdir}\n`, 'utf8');
  const res = runHook({ prompt: 'fais le point' }, { ...env, CLAUDE_PROJECT_DIR: wt });
  assert.equal(res.status, 0);
  assert.match(res.stdout, /\[REPOA\]\[Aragorn\]/);
});

// ===========================================================================
// CA-P4 — Sollicitation directe d'Odin dans un depot (P-3) ; portefeuille/hors (voix Odin).
// ===========================================================================

test('CA-P4 : prompt "odin, ..." dans un depot -> [PORTEFEUILLE][Odin], "Aragorn reprend"', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const res = runHook({ prompt: 'odin, où en sont mes projets ?' }, { ...env, CLAUDE_PROJECT_DIR: repoA });
  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('[PORTEFEUILLE][Odin]'));
  assert.match(res.stdout, /Aragorn reprend/);
});

test('CA-P4 : prompt "odin-direct repoA" dans un depot -> texte REPO (pas une sollicitation)', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const res = runHook({ prompt: 'odin-direct repoA' }, { ...env, CLAUDE_PROJECT_DIR: repoA });
  assert.equal(res.status, 0);
  assert.match(res.stdout, /\[REPOA\]\[Aragorn\]/);
  assert.ok(!res.stdout.includes('[PORTEFEUILLE][Odin]'));
});

test('CA-P4 : CLAUDE_PROJECT_DIR = racine (portefeuille) -> texte actuel + "Dans un depot, c\'est Aragorn qui parle"', () => {
  const { env, root } = makeSandbox();
  const res = runHook({ prompt: 'salut' }, { ...env, CLAUDE_PROJECT_DIR: root });
  assert.equal(res.status, 0);
  assert.ok(res.stdout.startsWith(TEXTE_HISTORIQUE));
  assert.match(res.stdout, /Dans un depot, c'est Aragorn qui parle/);
});

test('CA-P4 : dossier hors racine sans .git -> meme texte PORTEFEUILLE (identique octet pour octet)', () => {
  const { env, root } = makeSandbox();
  const hors = tmpDir('iaka-idremind-hors-');
  const resPortefeuille = runHook({ prompt: 'salut' }, { ...env, CLAUDE_PROJECT_DIR: root });
  const resHors = runHook({ prompt: 'salut' }, { ...env, CLAUDE_PROJECT_DIR: hors });
  assert.equal(resHors.status, 0);
  assert.equal(resHors.stdout, resPortefeuille.stdout);
});

// ===========================================================================
// CA-P5 — GENERIC : agent_type hors {odin,aragorn}, panne d'entree, dependance absente.
// ===========================================================================

test('CA-P5 : agent_type "gimli" dans un depot -> texte GENERIC identique octet pour octet au texte historique', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const res = runHook({ prompt: 'fais le point', agent_type: 'gimli' }, { ...env, CLAUDE_PROJECT_DIR: repoA });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, TEXTE_HISTORIQUE);
});

test('CA-P5 : stdin vide, sans CLAUDE_PROJECT_DIR -> exit 0, texte GENERIC', () => {
  const { env } = makeSandbox();
  const res = spawnSync(process.execPath, [REMIND], { input: '', env, encoding: 'utf8' });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, TEXTE_HISTORIQUE);
});

test('CA-P5 : JSON invalide, sans CLAUDE_PROJECT_DIR -> exit 0, texte GENERIC', () => {
  const { env } = makeSandbox();
  const res = spawnSync(process.execPath, [REMIND], { input: 'pas du json', env, encoding: 'utf8' });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, TEXTE_HISTORIQUE);
});

test('CA-P5 : chantier-state.mjs (et guard-core.mjs) absents — copie du hook SEUL dans un dossier tmp -> exit 0, texte GENERIC', () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA'); // present malgre tout : ne doit PAS influer (import KO d'abord)
  const isolDir = tmpDir('iaka-idremind-isole-');
  const isolatedHook = path.join(isolDir, 'identity-remind.mjs');
  fs.copyFileSync(REMIND, isolatedHook);
  const res = spawnSync(
    process.execPath,
    [isolatedHook],
    { input: JSON.stringify({ prompt: 'fais le point' }), env: { ...env, CLAUDE_PROJECT_DIR: repoA }, encoding: 'utf8' },
  );
  assert.equal(res.status, 0);
  assert.equal(res.stdout, TEXTE_HISTORIQUE);
});

test('CA-P5 : aucun fichier n\'est cree sous <tmp>/home/.claude/', () => {
  const { env, home } = makeSandbox();
  runHook({ prompt: 'salut' }, env);
  runHook(undefined, env);
  assert.ok(!fs.existsSync(path.join(home, '.claude')));
});
