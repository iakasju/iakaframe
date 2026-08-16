// Gardes du generateur d'etat des lieux
// (instruction specs/instructions/correctif-generateur-etat-des-lieux.md, § 9).
//
// Quatre familles, une par decision EXECUTABLE du lot :
//   D1 — le nom du projet derive du depot PRINCIPAL (git-common-dir), pas du dossier courant.
//   D2 — --version : forme validee strictement, prefixe `v` normalise, `git describe` verbatim.
//   D3 — le compte de fichiers derive de l'index git (suivis + non ignores), parcours en repli.
//   D7 — provenance : quel CLI s'execute, sur quelle racine.
//
// D6 (avertissement narratif vide) n'a PAS de garde ici : sa decision et ses criteres d'acceptation
// se contredisent (cf. compte rendu de lot). Rien n'est arbitre a la place du cadrage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { doSnapshot, runSnapshot } from '../src/commands/snapshot.js';
import { runUpdate } from '../src/commands/update.js';

// La forge doit rester INJOIGNABLE : testRepo rend alors null, et `update` ne bascule pas en
// onboard. Aucun appel reseau reel ne part vers la box depuis cette suite.
process.env.FORGEJO_URL = 'http://127.0.0.1:1';

const noop = () => ({ triggered: false });
const SNAP = { cadenceRun: noop, projectCadenceRun: noop };

function git(cwd, args) { return spawnSync('git', args, { cwd, encoding: 'utf8' }); }

// Depot tmp nomme, dans un dossier parent neutre (le NOM du dossier de depot est ce qu'on teste).
function mkRepo(name, files = { 'a.txt': 'a\n' }) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-snapgen-'));
  const dir = path.join(base, name);
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q']);
  git(dir, ['config', 'user.email', 'test@iaka']);
  git(dir, ['config', 'user.name', 'test']);
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body, 'utf8');
  }
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-qm', 'init']);
  return { base, dir, clean: () => fs.rmSync(base, { recursive: true, force: true }) };
}

// Depot « tiede » : un premier snapshot a deja depose specs/*, et il est COMMITE.
// Sans ca, chaque mesure de compte bougerait a cause des trois artefacts que snapshot ecrit
// lui-meme — un bruit de fixture qui n'a rien a voir avec la regle qu'on teste.
function warm(dir) {
  doSnapshot({ projectPath: dir, reason: 'manual', ...SNAP });
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-qm', 'snapshot']);
}

function md(root) { return fs.readFileSync(path.join(root, 'specs', 'etat-des-lieux.md'), 'utf8'); }
function html(root) { return fs.readFileSync(path.join(root, 'specs', 'etat-des-lieux.html'), 'utf8'); }
function journal(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'specs', '.iakaframe-journal.json'), 'utf8'));
}

// Capture des deux flux console (les verbes ecrivent leur diagnostic dessus).
async function capture(fn) {
  const lines = [];
  const log = console.log, err = console.error;
  console.log = (...a) => lines.push(a.join(' '));
  console.error = (...a) => lines.push(a.join(' '));
  try { await fn(); } finally { console.log = log; console.error = err; }
  return lines.join('\n');
}

// =================================================================================================
// D1 — le nom du projet vient du depot PRINCIPAL
// =================================================================================================

test('CA-1 : depuis un arbre lie, le titre porte le nom du depot principal (MD, <title>, <h1>)', () => {
  const r = mkRepo('projet-alpha');
  try {
    const wt = path.join(r.base, 'un-dossier-au-nom-different');
    git(r.dir, ['worktree', 'add', '-q', wt, '-b', 'lot']);

    doSnapshot({ projectPath: wt, reason: 'manual', ...SNAP });

    assert.match(md(wt), /^# Etat des lieux - projet-alpha$/m, md(wt).slice(0, 200));
    assert.doesNotMatch(md(wt), /un-dossier-au-nom-different/);
    assert.match(html(wt), /<title>Etat des lieux - projet-alpha<\/title>/);
    assert.match(html(wt), /<h1>Etat des lieux - <span class="accent">projet-alpha<\/span><\/h1>/);
  } finally { r.clean(); }
});

test('CA-2 : depuis la racine du meme depot, le titre est IDENTIQUE', () => {
  const r = mkRepo('projet-alpha');
  try {
    const wt = path.join(r.base, 'autre-nom');
    git(r.dir, ['worktree', 'add', '-q', wt, '-b', 'lot']);

    doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP });
    doSnapshot({ projectPath: wt, reason: 'manual', ...SNAP });

    const titre = (s) => s.match(/^# Etat des lieux - (.+)$/m)[1];
    assert.equal(titre(md(r.dir)), 'projet-alpha');
    assert.equal(titre(md(wt)), titre(md(r.dir)), 'racine et arbre lie doivent titrer pareil');
  } finally { r.clean(); }
});

test('CA-3 : hors git, le titre reste le basename du dossier (non-regression mot pour mot)', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-snapgen-nogit-'));
  const dir = path.join(base, 'dossier-nu');
  fs.mkdirSync(dir, { recursive: true });
  try {
    fs.writeFileSync(path.join(dir, 'x.txt'), 'x\n', 'utf8');
    doSnapshot({ projectPath: dir, reason: 'manual', ...SNAP });
    assert.match(md(dir), /^# Etat des lieux - dossier-nu$/m);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('CA-4 : les ecritures restent dans l\'arbre lie, jamais dans le depot principal', () => {
  const r = mkRepo('projet-alpha');
  try {
    const wt = path.join(r.base, 'autre-nom');
    git(r.dir, ['worktree', 'add', '-q', wt, '-b', 'lot']);

    doSnapshot({ projectPath: wt, reason: 'manual', ...SNAP });

    assert.equal(fs.existsSync(path.join(wt, 'specs', 'etat-des-lieux.md')), true);
    assert.equal(fs.existsSync(path.join(r.dir, 'specs', 'etat-des-lieux.md')), false,
      'le depot principal ne doit RIEN recevoir : le nom derive de lui, pas les ecritures');
    assert.equal(fs.existsSync(path.join(r.dir, 'specs', '.iakaframe-journal.json')), false);
  } finally { r.clean(); }
});

// =================================================================================================
// D2 — version : normalisation du seul prefixe `v`, refus strict de la forme
// =================================================================================================

test('CA-5 : --version 0.39.0 inscrit v0.39.0 partout (journal, MD, HTML) et v0.39.0 est idempotent', () => {
  for (const brut of ['0.39.0', 'v0.39.0']) {
    const r = mkRepo('projet-version');
    try {
      const res = doSnapshot({ projectPath: r.dir, reason: 'version', version: brut, ...SNAP });
      assert.equal(res.version, 'v0.39.0', `entree ${brut}`);
      assert.match(md(r.dir), /^\| Version \| v0\.39\.0 \|$/m);
      assert.match(html(r.dir), /<div class="k">Version<\/div><div>v0\.39\.0<\/div>/);
      const j = journal(r.dir);
      assert.equal(j[j.length - 1].version, 'v0.39.0');
    } finally { r.clean(); }
  }
});

test('CA-6 : doSnapshot LEVE sur une version mal formee, et n\'ecrit RIEN', () => {
  for (const mauvais of ['0.39', 'derniere', 'v0.39.O']) {
    const r = mkRepo('projet-version');
    try {
      assert.throws(
        () => doSnapshot({ projectPath: r.dir, reason: 'version', version: mauvais, ...SNAP }),
        (e) => e instanceof Error && e.message.includes(mauvais),
        `« ${mauvais} » doit etre refuse, avec la valeur fautive nommee`,
      );
      assert.equal(fs.existsSync(path.join(r.dir, 'specs')), false,
        'le refus arrive AVANT toute ecriture (pas meme le dossier specs/)');
    } finally { r.clean(); }
  }
});

test('CA-6 : runSnapshot refuse une version mal formee (message + exitCode 1, rien ecrit)', async () => {
  const r = mkRepo('projet-version');
  const prev = process.exitCode;
  try {
    const out = await capture(() => runSnapshot(['--path', r.dir, '--reason', 'version', '--version', '0.39']));
    assert.match(out, /0\.39/, out);
    assert.equal(process.exitCode, 1, 'exitCode = 1, comme le refus de --reason');
    assert.equal(fs.existsSync(path.join(r.dir, 'specs')), false);
  } finally { process.exitCode = prev; r.clean(); }
});

test('CA-6 : update refuse une version mal formee AVANT tout git add / commit', async () => {
  const r = mkRepo('projet-version');
  const prev = process.exitCode;
  try {
    fs.writeFileSync(path.join(r.dir, 'travail.txt'), 'en cours\n', 'utf8');
    const avant = git(r.dir, ['rev-list', '--count', 'HEAD']).stdout.trim();

    const out = await capture(() => runUpdate(['--path', r.dir, '--no-push', '--version', 'derniere']));

    assert.match(out, /derniere/, out);
    assert.equal(process.exitCode, 1);
    assert.equal(git(r.dir, ['rev-list', '--count', 'HEAD']).stdout.trim(), avant, 'aucun commit cree');
    assert.match(git(r.dir, ['status', '--porcelain']).stdout, /^\?\? travail\.txt$/m,
      'le fichier doit rester NON indexe : pas de git add avant le refus');
  } finally { process.exitCode = prev; r.clean(); }
});

test('CA-7 : la sortie de `git describe` reste VERBATIM (un tag n\'est pas un litteral de version)', () => {
  const r = mkRepo('projet-tiers');
  try {
    git(r.dir, ['tag', '2026.08']);
    const res = doSnapshot({ projectPath: r.dir, reason: 'version', ...SNAP });
    assert.equal(res.version, '2026.08', 'aucun `v` colle sur le tag d\'un projet tiers');
    assert.match(md(r.dir), /^\| Version \| 2026\.08 \|$/m);
  } finally { r.clean(); }
});

// =================================================================================================
// D3 — le compte de fichiers derive de l'index git
// =================================================================================================

test('CA-8 : meme compte depuis la racine et depuis un arbre lie place en zone IGNOREE', () => {
  const r = mkRepo('projet-compte', { 'a.txt': 'a\n', 'b.txt': 'b\n', '.gitignore': '/.claude/\n' });
  try {
    warm(r.dir);
    const seul = doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount;

    const wt = path.join(r.dir, '.claude', 'worktrees', 'lot');
    fs.mkdirSync(path.dirname(wt), { recursive: true });
    git(r.dir, ['worktree', 'add', '-q', wt, '-b', 'lot']);

    const racine = doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount;
    const lie = doSnapshot({ projectPath: wt, reason: 'manual', ...SNAP }).fileCount;

    assert.equal(racine, lie, 'le compte ne doit plus dependre de l\'arbre de mesure');
    assert.ok(racine - seul <= 1, `l'arbre lie ne doit peser qu'au plus 1 entree (delta ${racine - seul})`);
  } finally { r.clean(); }
});

test('CA-9 : arbre lie en zone NON ignoree -> au plus 1 entree comptee (R2)', () => {
  const r = mkRepo('projet-compte', { 'a.txt': 'a\n', 'b.txt': 'b\n' });
  try {
    warm(r.dir);
    const seul = doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount;
    const wt = path.join(r.dir, 'sub', 'lot');
    fs.mkdirSync(path.dirname(wt), { recursive: true });
    git(r.dir, ['worktree', 'add', '-q', wt, '-b', 'lot']);

    const apres = doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount;
    assert.ok(apres - seul <= 1,
      `git ne descend pas dans un depot imbrique : au plus 1 entree (delta ${apres - seul})`);
  } finally { r.clean(); }
});

test('CA-10 : non suivi + non ignore = compte ; ignore = pas compte ; node_modules ignore = pas compte', () => {
  const r = mkRepo('projet-compte', { 'a.txt': 'a\n', '.gitignore': 'secret.txt\nnode_modules/\n' });
  try {
    warm(r.dir);
    const ref = doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount;

    fs.writeFileSync(path.join(r.dir, 'neuf.txt'), 'lot en cours\n', 'utf8');
    assert.equal(doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount, ref + 1,
      'un fichier du lot en cours (non suivi, non ignore) DOIT etre compte');

    fs.writeFileSync(path.join(r.dir, 'secret.txt'), 'x\n', 'utf8');
    fs.mkdirSync(path.join(r.dir, 'node_modules', 'pkg'), { recursive: true });
    for (let i = 0; i < 5; i++) fs.writeFileSync(path.join(r.dir, 'node_modules', 'pkg', `f${i}.js`), '//\n', 'utf8');

    assert.equal(doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount, ref + 1,
      'les fichiers ignores (dont node_modules) ne comptent pas');
  } finally { r.clean(); }
});

test('CA-11 : hors git, le compte reste celui du parcours actuel (inchange)', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-snapgen-nogit-'));
  const dir = path.join(base, 'dossier-nu');
  fs.mkdirSync(path.join(dir, 'sous'), { recursive: true });
  try {
    fs.writeFileSync(path.join(dir, 'a.txt'), 'a\n', 'utf8');
    fs.writeFileSync(path.join(dir, 'sous', 'b.txt'), 'b\n', 'utf8');
    // Le parcours compte tout sauf .git / node_modules : ici 2 fichiers + les 3 ecrits par snapshot.
    const res = doSnapshot({ projectPath: dir, reason: 'manual', ...SNAP });
    assert.equal(res.fileCount, 2, 'parcours brut du dossier, comme aujourd\'hui');
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('CA-12 : le libelle MD/HTML annonce la REGLE reellement appliquee', () => {
  const r = mkRepo('projet-libelle');
  try {
    doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP });
    assert.match(md(r.dir), /^\| Fichiers \(suivis \+ non ignores\) \| \d+ \|$/m, md(r.dir));
    assert.match(html(r.dir), /\(suivis \+ non ignores\)/);
  } finally { r.clean(); }

  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-snapgen-nogit-'));
  const dir = path.join(base, 'dossier-nu');
  fs.mkdirSync(dir, { recursive: true });
  try {
    fs.writeFileSync(path.join(dir, 'a.txt'), 'a\n', 'utf8');
    doSnapshot({ projectPath: dir, reason: 'manual', ...SNAP });
    assert.match(md(dir), /^\| Fichiers \(hors \.git\/node_modules\) \| \d+ \|$/m, md(dir));
    assert.match(html(dir), /\(hors \.git \/ node_modules\)/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('CA-17 : un target/ et un dist/ ignores ne sont PAS comptes (le cas iakaFrameGUI)', () => {
  const r = mkRepo('projet-rust', { 'src/main.rs': 'fn main(){}\n', '.gitignore': 'target/\ndist/\n' });
  try {
    warm(r.dir);
    const ref = doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount;

    fs.mkdirSync(path.join(r.dir, 'target', 'debug', 'deps'), { recursive: true });
    for (let i = 0; i < 40; i++) {
      fs.writeFileSync(path.join(r.dir, 'target', 'debug', 'deps', `dep-${i}.rlib`), 'x', 'utf8');
    }
    fs.mkdirSync(path.join(r.dir, 'dist'), { recursive: true });
    for (let i = 0; i < 10; i++) fs.writeFileSync(path.join(r.dir, 'dist', `bundle-${i}.js`), 'x', 'utf8');

    const apres = doSnapshot({ projectPath: r.dir, reason: 'manual', ...SNAP }).fileCount;
    assert.equal(apres, ref,
      'la regle n\'est plus une liste de deux noms en dur : elle suit le .gitignore du projet mesure');
  } finally { r.clean(); }
});

// =================================================================================================
// D7 — provenance : quel CLI, sur quelle racine
// =================================================================================================

test('CA-18d : snapshot et update annoncent cli=<...> et root=<...>, et les deux chemins different', async () => {
  const r = mkRepo('projet-provenance');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-snapgen-home-'));
  try {
    const outSnap = await capture(() => runSnapshot(['--path', r.dir, '--home', home]));
    const mSnap = outSnap.match(/cli=(\S+)\s+root=(\S+)/);
    assert.ok(mSnap, `snapshot doit annoncer sa provenance\n${outSnap}`);
    assert.equal(path.resolve(mSnap[2]), path.resolve(r.dir));
    assert.notEqual(path.resolve(mSnap[1]), path.resolve(mSnap[2]),
      'le CLI execute et la racine visee doivent etre visiblement distincts');

    fs.writeFileSync(path.join(r.dir, 'change.txt'), 'x\n', 'utf8');
    const outUp = await capture(() => runUpdate(['--path', r.dir, '--no-push', '--home', home]));
    const mUp = outUp.match(/cli=(\S+)\s+root=(\S+)/);
    assert.ok(mUp, `update doit annoncer sa provenance\n${outUp}`);
    assert.equal(path.resolve(mUp[2]), path.resolve(r.dir));
    assert.equal(mUp[1], mSnap[1], 'meme CLI, meme valeur annoncee');
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
    r.clean();
  }
});
