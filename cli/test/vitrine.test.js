// Publication vers la vitrine (GitHub, opt-in projet) — cli/src/lib/vitrine.js.
// Instruction : specs/instructions/update-remotes-github-opt-in.md § 5, CA-7 a CA-13.
//
// ARENE : les vitrines de test sont des bare LOCAUX (git y pousse sans une once de reseau) —
// meme discipline que canaux-fanout.test.js. `publierVitrine`/`executerPublication` ne
// CLASSENT rien elles-memes : un bare local passe directement en argument `remote`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  SEMVER_RELEASE, parseSemver, plusHautSemver, classerPublication, tagCandidat,
  lireVitrine, publierVitrine, executerPublication, formaterVitrineDefaut, questionPublication,
} from '../src/lib/vitrine.js';
import { normalizeVersion } from '../src/commands/snapshot.js';

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const jetables = [];

function bareVivant() {
  const b = tmp('iaka-vit-bare-'); git(b, ['init', '--bare', '-q']); jetables.push(b); return b;
}

function depot({ tags = [], followTags = false } = {}) {
  const dir = tmp('iaka-vit-depot-');
  jetables.push(dir);
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  git(dir, ['config', 'user.name', 'Test']);
  if (followTags) git(dir, ['config', 'push.followTags', 'true']);
  fs.writeFileSync(path.join(dir, 'README.md'), '# test\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'seed']);
  for (const t of tags) git(dir, ['tag', '-a', t, '-m', t]);
  return dir;
}

function tagsDuBare(bare) {
  const out = execFileSync('git', ['ls-remote', '--tags', '--refs', bare], { encoding: 'utf8' });
  return [...out.matchAll(/refs\/tags\/(\S+)/g)].map((m) => m[1]);
}

function branchesDuBare(bare) {
  const out = execFileSync('git', ['ls-remote', '--refs', bare], { encoding: 'utf8' });
  return [...out.matchAll(/refs\/(?:heads|tags)\/\S+/g)].map((m) => m[0]);
}

// --- CA-7 : classerPublication --------------------------------------------------------------

test('CA-7 : classerPublication classe majeure/mineure/patch/deja-publie/inferieure/premiere', () => {
  const vitrine = ['v0.40.0', 'v0.41.0', 'v0.41.3', 'v0.42.0', 'v0.43.0-rc.1'];
  const cas = [
    ['v1.0.0', 'majeure'],
    ['v0.43.0', 'mineure'],
    ['v0.43.2', 'mineure'],
    ['v0.42.1', 'patch'],
    ['v0.42.0', 'deja-publie'],
    ['v0.41.5', 'inferieure'],
  ];
  for (const [tag, classeAttendue] of cas) {
    const r = classerPublication(tag, vitrine);
    assert.equal(r.classe, classeAttendue, `${tag} -> ${r.classe} (attendu ${classeAttendue})`);
    assert.equal(r.reference, 'v0.42.0', `reference pour ${tag} : ${r.reference}`);
  }
  const premiere = classerPublication('v0.1.0', []);
  assert.equal(premiere.classe, 'premiere');
  assert.equal(premiere.reference, '');
});

test('CA-7 : parseSemver/plusHautSemver ignorent les pre-versions et metadonnees', () => {
  assert.equal(parseSemver('v0.43.0-rc.1'), null);
  assert.equal(parseSemver('v0.43.0+b1'), null);
  assert.deepEqual(parseSemver('v0.42.1'), { M: 0, m: 42, p: 1 });
  assert.equal(plusHautSemver(['v0.40.0', 'v0.43.0-rc.1', 'v0.42.0']), 'v0.42.0');
  assert.equal(plusHautSemver([]), '');
});

// --- CA-8 : forme stricte de --publier --------------------------------------------------------

test('CA-8 : forme de --publier — vX.Y.Z ou X.Y.Z acceptes, pre-version/metadonnee/forme courte refuses', () => {
  const valide = (raw) => {
    const n = normalizeVersion(raw);
    return n.ok && SEMVER_RELEASE.test(n.value) ? n.value : null;
  };
  assert.equal(valide('v0.43.0'), 'v0.43.0');
  assert.equal(valide('0.43.0'), 'v0.43.0');
  assert.equal(valide('v0.43.0-rc.1'), null);
  assert.equal(valide('v0.43.0+b1'), null);
  assert.equal(valide('v0.43'), null);
  assert.equal(valide('derniere'), null);
});

// --- CA-9 : tagCandidat ------------------------------------------------------------------------

test('CA-9 : tagCandidat = le plus haut tag STRICT atteignable depuis HEAD', () => {
  const dir = tmp('iaka-vit-cand-');
  jetables.push(dir);
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  git(dir, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(dir, 'a.txt'), 'a\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'c1']);
  git(dir, ['tag', 'v0.42.0']);
  fs.writeFileSync(path.join(dir, 'b.txt'), 'b\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'c2']);
  git(dir, ['tag', 'v0.42.1']);
  git(dir, ['tag', 'v0.43.0-rc.1']);
  // v0.50.0 sur une AUTRE branche, jamais mergee dans main.
  git(dir, ['checkout', '-q', '-b', 'autre']);
  fs.writeFileSync(path.join(dir, 'c.txt'), 'c\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'c3']);
  git(dir, ['tag', 'v0.50.0']);
  git(dir, ['checkout', '-q', 'main']);

  assert.equal(tagCandidat(dir), 'v0.42.1');
});

test('CA-9 : tagCandidat rend "" sur un depot sans tag', () => {
  const dir = depot();
  assert.equal(tagCandidat(dir), '');
});

// --- CA-10 : un seul tag part, jamais un autre (followTags neutralise) -------------------------

test('CA-10 : publierVitrine ne pousse QUE le tag nomme, meme avec push.followTags=true', () => {
  const bare = bareVivant();
  const dir = depot({ tags: ['v0.42.0', 'v0.42.1', 'v0.43.0'], followTags: true });
  const r = publierVitrine(dir, bare, 'main', 'v0.43.0', { timeoutMs: 15000 });
  assert.equal(r.ok, true, JSON.stringify(r));
  const refs = branchesDuBare(bare);
  assert.deepEqual(refs.sort(), ['refs/heads/main', 'refs/tags/v0.43.0'].sort());
});

test('CA-10 (contrefactuel) : le MEME push SANS --no-follow-tags emporte aussi les autres tags annotes', () => {
  const bare = bareVivant();
  const dir = depot({ tags: ['v0.42.0', 'v0.42.1', 'v0.43.0'], followTags: true });
  // Reproduction VOLONTAIRE, sans passer par publierVitrine (qui, elle, porte toujours l'option) :
  // preuve que --no-follow-tags est bien PORTEUR, pas cosmetique.
  execFileSync('git', ['push', '--atomic', bare, 'refs/heads/main:refs/heads/main', 'refs/tags/v0.43.0:refs/tags/v0.43.0'], { cwd: dir });
  const tags = tagsDuBare(bare);
  assert.ok(tags.includes('v0.42.0') && tags.includes('v0.42.1'), `follow-tags aurait du entrainer les patchs accumules : ${tags.join(',')}`);
});

// --- CA-11 : atomicite --------------------------------------------------------------------------

test('CA-11 : main divergente sur le bare -> publierVitrine echoue et le tag ne part PAS (atomique)', () => {
  const bare = bareVivant();
  // Fait diverger le bare : un AUTRE clone y pousse un commit different sur main.
  const autre = tmp('iaka-vit-autre-');
  jetables.push(autre);
  git(autre, ['clone', '-q', bare, '.']);
  git(autre, ['config', 'user.email', 'test@example.invalid']);
  git(autre, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(autre, 'divergent.txt'), 'x\n');
  git(autre, ['add', '-A']); git(autre, ['commit', '-q', '-m', 'divergent']);
  git(autre, ['push', '-q', 'origin', 'HEAD:main']);

  const dir = depot({ tags: ['v0.43.0'] });
  const r = publierVitrine(dir, bare, 'main', 'v0.43.0', { timeoutMs: 15000 });
  assert.equal(r.ok, false);
  const tags = tagsDuBare(bare);
  assert.ok(!tags.includes('v0.43.0'), `le tag ne doit PAS etre parti : ${tags.join(',')}`);
});

// --- CA-12 : executerPublication (dependances injectees) ---------------------------------------

function compteur(fn) {
  const appels = [];
  const wrapped = async (...args) => { appels.push(args); return fn(...args); };
  wrapped.appels = appels;
  return wrapped;
}

test('CA-12(i) : mineure + demander->true -> pousser appele une fois, verdict publie, exitCode 0', async () => {
  const lire = compteur(async () => ({ ok: true, tags: ['v0.42.0'], head: 'refs/heads/main' }));
  const demander = compteur(async () => true);
  const pousser = compteur(async () => ({ ok: true }));
  const r = await executerPublication({
    tag: 'v0.43.0', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire, demander, pousser,
  });
  assert.equal(pousser.appels.length, 1);
  assert.deepEqual(pousser.appels[0], ['github', 'main', 'v0.43.0']);
  assert.equal(r.resultats[0].verdict, 'publie');
  assert.equal(r.exitCode, 0);
});

test('CA-12(ii) : demander->false -> pousser jamais appele, verdict annule, exitCode 0', async () => {
  const lire = async () => ({ ok: true, tags: ['v0.42.0'], head: 'refs/heads/main' });
  const demander = compteur(async () => false);
  const pousser = compteur(async () => ({ ok: true }));
  const r = await executerPublication({
    tag: 'v0.43.0', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire, demander, pousser,
  });
  assert.equal(pousser.appels.length, 0);
  assert.equal(r.resultats[0].verdict, 'annule');
  assert.equal(r.exitCode, 0);
});

test('CA-12(iii) : deja-publie et inferieure -> ni demander ni pousser, refus, exitCode 1', async () => {
  const lire = async () => ({ ok: true, tags: ['v0.42.0'], head: 'refs/heads/main' });
  const demander = compteur(async () => true);
  const pousser = compteur(async () => ({ ok: true }));
  const r = await executerPublication({
    tag: 'v0.42.0', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire, demander, pousser,
  });
  assert.equal(demander.appels.length, 0);
  assert.equal(pousser.appels.length, 0);
  assert.equal(r.resultats[0].verdict, 'refus');
  assert.equal(r.resultats[0].motif, 'deja-publie');
  assert.equal(r.exitCode, 1);
});

test('CA-12(iv) : lire en echec -> refus vitrine-injoignable, exitCode 1', async () => {
  const lire = async () => ({ ok: false });
  const demander = compteur(async () => true);
  const pousser = compteur(async () => ({ ok: true }));
  const r = await executerPublication({
    tag: 'v0.43.0', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire, demander, pousser,
  });
  assert.equal(demander.appels.length, 0);
  assert.equal(r.resultats[0].verdict, 'refus');
  assert.equal(r.resultats[0].motif, 'vitrine-injoignable');
  assert.equal(r.exitCode, 1);
});

test('CA-12(v) : branche non defaut -> branche-non-vitrine ; head vide -> branche-vitrine-inconnue', async () => {
  const lireMain = async () => ({ ok: true, tags: [], head: 'refs/heads/main' });
  const r1 = await executerPublication({
    tag: 'v0.43.0', branche: 'feat/x', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire: lireMain, demander: async () => true, pousser: async () => ({ ok: true }),
  });
  assert.equal(r1.resultats[0].motif, 'branche-non-vitrine');

  const lireVide = async () => ({ ok: true, tags: [], head: '' });
  const r2 = await executerPublication({
    tag: 'v0.43.0', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire: lireVide, demander: async () => true, pousser: async () => ({ ok: true }),
  });
  assert.equal(r2.resultats[0].motif, 'branche-vitrine-inconnue');
});

test('CA-12(vi) : forgeServie:false -> refus forge-non-servie, lire/demander/pousser JAMAIS appeles', async () => {
  const lire = compteur(async () => ({ ok: true, tags: [], head: 'refs/heads/main' }));
  const demander = compteur(async () => true);
  const pousser = compteur(async () => ({ ok: true }));
  const r = await executerPublication({
    tag: 'v0.43.0', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: false, lire, demander, pousser,
  });
  assert.equal(lire.appels.length, 0);
  assert.equal(demander.appels.length, 0);
  assert.equal(pousser.appels.length, 0);
  assert.equal(r.resultats[0].motif, 'forge-non-servie');
  assert.equal(r.exitCode, 1);
});

test('CA-12(vii) : la question posee contient CORRECTIF pour un patch, "declenche le build" pour une mineure', async () => {
  let questionVue = '';
  const demanderCapte = async (q) => { questionVue = q; return false; };

  const lirePatch = async () => ({ ok: true, tags: ['v0.42.0'], head: 'refs/heads/main' });
  await executerPublication({
    tag: 'v0.42.1', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire: lirePatch, demander: demanderCapte, pousser: async () => ({ ok: true }),
  });
  assert.match(questionVue, /CORRECTIF/);

  const lireMineure = async () => ({ ok: true, tags: ['v0.42.0'], head: 'refs/heads/main' });
  await executerPublication({
    tag: 'v0.43.0', branche: 'main', vitrines: [{ nom: 'github', hote: 'github.com' }],
    forgeServie: true, lire: lireMineure, demander: demanderCapte, pousser: async () => ({ ok: true }),
  });
  assert.match(questionVue, /declenche le build/);
});

test('questionPublication : forme exacte des deux textes imposes (§ 5.3)', () => {
  const qPatch = questionPublication({ tag: 'v0.42.1', classe: 'patch', reference: 'v0.42.0', nom: 'github', hote: 'github.com' });
  assert.match(qPatch, /^v0\.42\.1 est un CORRECTIF \(vitrine a v0\.42\.0\)/);
  const qMineure = questionPublication({ tag: 'v0.43.0', classe: 'mineure', reference: 'v0.42.0', nom: 'github', hote: 'github.com' });
  assert.match(qMineure, /^Publier v0\.43\.0 \(mineure, vitrine a v0\.42\.0\) sur github \(hote github\.com\)/);
});

// --- CA-13 : formaterVitrineDefaut ---------------------------------------------------------------

test('CA-13 : formaterVitrineDefaut — chaque variante nomme la vitrine et "NON alimentee"', () => {
  const base = { nom: 'github', hote: 'github.com' };

  const patch = formaterVitrineDefaut({ ...base, candidat: 'v0.42.1', classement: { classe: 'patch', reference: 'v0.42.0' }, lectureOk: true });
  assert.match(patch, /vitrine github/);
  assert.match(patch, /NON alimentee/);
  assert.match(patch, /correctif/);
  assert.ok(!patch.includes('--publier'), patch);

  const mineure = formaterVitrineDefaut({ ...base, candidat: 'v0.44.0', classement: { classe: 'mineure', reference: 'v0.42.0' }, lectureOk: true });
  assert.match(mineure, /iakaframe update --publier v0\.44\.0/);

  const injoignable = formaterVitrineDefaut({ ...base, candidat: 'v0.42.1', classement: null, lectureOk: false });
  assert.match(injoignable, /classement impossible/);

  const aucunTag = formaterVitrineDefaut({ ...base, candidat: '', classement: null, lectureOk: true });
  assert.match(aucunTag, /aucun tag de release/);

  const dejaPublie = formaterVitrineDefaut({ ...base, candidat: 'v0.42.0', classement: { classe: 'deja-publie', reference: 'v0.42.0' }, lectureOk: true });
  assert.match(dejaPublie, /deja couvert par la vitrine/);
});

test.after(() => { for (const d of jetables) fs.rmSync(d, { recursive: true, force: true }); });
