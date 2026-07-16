// T5 - « Garde de consentement » : REVUE du reservoir de propositions (instruction
// boucle-apprentissage-incrementale.md § 8, Q-4). Couvre : lister/appliquer/rejeter ; politique
// par defaut (REGISTRE auto vs PROFIL en file) ; garde-fou STRUCTUREL (skill) TOUJOURS en file
// meme en write_approval:auto ; application `memory` respecte le plafond DUR de T1 ; une proposition
// appliquee ne peut pas l'etre deux fois. Aucun test n'ecrit dans le vrai ~/.iaka/ ni la vraie
// bibliotheque : tout passe par des tmpdir (--home / --library).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureLayout, writeConfig, defaultConfig, statePath, memoryList } from '../src/lib/memory.js';
import { close, proposalsDir } from '../src/lib/close.js';
import {
  listProposals, resolveProposal, applyProposal, rejectProposal, autoApply,
  classify, STATUS, STRUCTURAL_TYPES,
} from '../src/lib/review.js';
import { runReview } from '../src/commands/review.js';

const FIXED_NOW = new Date('2026-07-16T18:42:27Z');

// Canon temporaire avec des transcripts de fixture, puis `close` pour peupler le reservoir.
function tmpCanonWithProposals(files, cfg) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-review-'));
  ensureLayout(home);
  if (cfg) writeConfig(home, cfg);
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(home, 'transcripts', name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  close(home, { now: FIXED_NOW });
  return home;
}
const rm = (home) => fs.rmSync(home, { recursive: true, force: true });

function tmpLibrary() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-lib-'));
  // Double marqueur library/+methods/ (reconnu par lib/library.js), mais on passe --library de toute facon.
  fs.mkdirSync(path.join(root, 'library', 'skills'), { recursive: true });
  fs.mkdirSync(path.join(root, 'methods'), { recursive: true });
  return root;
}

function statusOf(home, id) {
  const txt = fs.readFileSync(path.join(proposalsDir(home), id, 'proposal.md'), 'utf8');
  return (txt.match(/^status:\s*(\S+)/m) || [])[1];
}

function capture(fn) {
  const out = [], err = [];
  const ol = console.log, oe = console.error, code = process.exitCode;
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => err.push(a.join(' '));
  try { fn(); } finally { console.log = ol; console.error = oe; }
  const exitCode = process.exitCode;
  process.exitCode = code;
  return { out: out.join('\n'), err: err.join('\n'), exitCode };
}

// Fixture : 1 correction registre + 1 correction profil + 1 procedure (skill), toutes repetees >= N.
const MIXED = {
  '2026-07-16--claude--x.md':
    '@correction(registre) forgejo :: remote par défaut = Forgejo LAN\n' +
    '@correction(registre) forgejo :: remote par défaut = Forgejo LAN\n' +
    '@correction(profil) concis :: Stéphane préfère des réponses concises\n' +
    '@correction(profil) concis :: Stéphane préfère des réponses concises\n' +
    '@procedure deploy :: build image puis mise en stage rc\n' +
    '@procedure deploy :: build image puis mise en stage rc\n',
};

// --- classify() : le garde-fou de politique (Q-4), fonction pure ----------------------------------
test('classify : REGISTRE auto si write_approval=auto, PROFIL toujours en file', () => {
  const auto = { ...defaultConfig(), write_approval: 'auto' };
  const queue = { ...defaultConfig(), write_approval: 'queue' };
  assert.equal(classify('memory', 'registre', auto).auto, true);
  assert.equal(classify('memory', 'registre', queue).auto, false); // queue met AUSSI le registre en file
  assert.equal(classify('memory', 'profil', auto).auto, false);    // profil : toujours en file
  assert.equal(classify('memory', 'profil', queue).auto, false);
});

test('classify : STRUCTUREL (skill/hook/config) TOUJOURS en file, meme en write_approval=auto', () => {
  const auto = { ...defaultConfig(), write_approval: 'auto' };
  for (const t of STRUCTURAL_TYPES) {
    assert.equal(classify(t, 'library/skills', auto).auto, false, `${t} ne doit JAMAIS etre auto`);
    assert.equal(classify(t, 'library/skills', auto).reason, 'structurel-toujours-gate');
  }
});

// --- Lister le reservoir --------------------------------------------------------------------------
test('listProposals : liste les propositions deposees par close (statut en-attente)', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const items = listProposals(home);
    assert.equal(items.length, 3); // registre(memory) + profil(memory) + skill
    assert.ok(items.every((p) => p.status === STATUS.PENDING));
    const types = items.map((p) => p.type).sort();
    assert.deepEqual(types, ['memory', 'memory', 'skill']);
  } finally { rm(home); }
});

// --- Appliquer une proposition REGISTRE : ecrit via la couche memory de T1 ------------------------
test('applyProposal : une proposition memory/registre ecrit dans REGISTRE.md (couche T1)', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const mem = listProposals(home).find((p) => p.type === 'memory' && p.target === 'registre');
    const r = applyProposal(home, mem.id, { now: FIXED_NOW });
    assert.equal(r.ok, true);
    assert.equal(r.status, STATUS.APPLIED);
    assert.equal(statusOf(home, mem.id), 'applique');
    // L'entree est bien dans REGISTRE.md (materialisee, pas seulement proposee).
    assert.ok(memoryList(home, 'registre').some((e) => /Forgejo LAN/.test(e)));
  } finally { rm(home); }
});

// --- Rejeter : statut rejete, rien materialise ----------------------------------------------------
test('rejectProposal : passe rejete sans rien materialiser', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const mem = listProposals(home).find((p) => p.type === 'memory' && p.target === 'registre');
    const registreBefore = fs.readFileSync(statePath(home, 'registre'), 'utf8');
    const r = rejectProposal(home, mem.id);
    assert.equal(r.ok, true);
    assert.equal(statusOf(home, mem.id), 'rejete');
    // REGISTRE.md STRICTEMENT inchange (rien materialise).
    assert.equal(fs.readFileSync(statePath(home, 'registre'), 'utf8'), registreBefore);
  } finally { rm(home); }
});

// --- Une proposition traitee ne peut pas l'etre deux fois -----------------------------------------
test('applyProposal : une proposition appliquee ne peut pas etre re-appliquee ni rejetee', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const mem = listProposals(home).find((p) => p.type === 'memory' && p.target === 'registre');
    assert.equal(applyProposal(home, mem.id, { now: FIXED_NOW }).ok, true);
    const again = applyProposal(home, mem.id, { now: FIXED_NOW });
    assert.equal(again.ok, false);
    assert.equal(again.reason, 'deja-traitee');
    const rej = rejectProposal(home, mem.id);
    assert.equal(rej.ok, false);
    assert.equal(rej.reason, 'deja-traitee');
    assert.equal(statusOf(home, mem.id), 'applique'); // toujours applique, pas ecrase
  } finally { rm(home); }
});

// --- Passe automatique : REGISTRE auto, PROFIL en file (Q-4) --------------------------------------
test('autoApply : REGISTRE auto-applique, PROFIL laisse en file (write_approval=auto)', () => {
  const home = tmpCanonWithProposals(MIXED, { ...defaultConfig(), write_approval: 'auto' });
  try {
    const r = autoApply(home, { now: FIXED_NOW });
    // 1 seul auto-applique : le registre. Profil + skill restent en file.
    assert.equal(r.applied.length, 1);
    assert.equal(r.applied[0].target, 'registre');
    const profil = listProposals(home).find((p) => p.target === 'profil');
    const skill = listProposals(home).find((p) => p.type === 'skill');
    assert.equal(profil.status, STATUS.PENDING);
    assert.equal(skill.status, STATUS.PENDING);
    // Le PROFIL.md n'a PAS ete ecrit (reste en file).
    assert.equal(memoryList(home, 'profil').length, 0);
  } finally { rm(home); }
});

// --- GARDE-FOU CENTRAL : structurel (skill) TOUJOURS en file, meme write_approval=auto ------------
test('autoApply : une proposition skill reste en-attente meme en write_approval=auto (jamais auto)', () => {
  const home = tmpCanonWithProposals(MIXED, { ...defaultConfig(), write_approval: 'auto' });
  const lib = tmpLibrary();
  try {
    autoApply(home, { now: FIXED_NOW, libraryRoot: lib });
    const skill = listProposals(home).find((p) => p.type === 'skill');
    assert.equal(skill.status, STATUS.PENDING, 'skill jamais auto-applique');
    // Aucun SKILL.md materialise dans la bibliotheque par la passe auto.
    assert.equal(fs.readdirSync(path.join(lib, 'library', 'skills')).length, 0);
  } finally { rm(home); rm(lib); }
});

// --- write_approval=queue : met AUSSI le REGISTRE en file ------------------------------------------
test('autoApply : write_approval=queue met AUSSI le REGISTRE en file (rien auto)', () => {
  const home = tmpCanonWithProposals(MIXED, { ...defaultConfig(), write_approval: 'queue' });
  try {
    const r = autoApply(home, { now: FIXED_NOW });
    assert.equal(r.applied.length, 0); // rien d'auto en mode queue
    assert.ok(listProposals(home).every((p) => p.status === STATUS.PENDING));
  } finally { rm(home); }
});

// --- Appliquer un skill (geste humain explicite) materialise le SKILL.md en bibliotheque ----------
test('applyProposal : appliquer un skill materialise SKILL.md dans library/skills/<id>/', () => {
  const home = tmpCanonWithProposals(MIXED);
  const lib = tmpLibrary();
  try {
    const skill = listProposals(home).find((p) => p.type === 'skill');
    const r = applyProposal(home, skill.id, { now: FIXED_NOW, libraryRoot: lib });
    assert.equal(r.ok, true);
    assert.equal(r.materialize.kind, 'skill');
    assert.ok(fs.existsSync(r.materialize.dest));
    assert.match(fs.readFileSync(r.materialize.dest, 'utf8'), /^---/);
    assert.equal(statusOf(home, skill.id), 'applique');
    // Deux fois -> refus (existe deja) : non ecrasement.
    const skill2 = listProposals(home).find((p) => p.type === 'skill'); // meme id, deja applique
    assert.equal(applyProposal(home, skill2.id, { libraryRoot: lib }).reason, 'deja-traitee');
  } finally { rm(home); rm(lib); }
});

// --- Application `memory` respecte le plafond DUR de T1 -------------------------------------------
test('applyProposal : une proposition memory qui depasse le plafond DUR est REFUSEE (reste en file)', () => {
  // Canon avec un plafond registre minuscule : l'entree ne peut pas rentrer.
  const home = tmpCanonWithProposals(MIXED, { ...defaultConfig(), caps: { profil: 2000, registre: 40 } });
  try {
    const mem = listProposals(home).find((p) => p.type === 'memory' && p.target === 'registre');
    const registreBefore = fs.readFileSync(statePath(home, 'registre'), 'utf8');
    const r = applyProposal(home, mem.id, { now: FIXED_NOW });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'materialisation-echouee');
    assert.equal(r.materialize.reason, 'cap-exceeded');
    // Statut inchange (en-attente) + REGISTRE.md inchange : echec non destructif.
    assert.equal(statusOf(home, mem.id), 'en-attente');
    assert.equal(fs.readFileSync(statePath(home, 'registre'), 'utf8'), registreBefore);
  } finally { rm(home); }
});

// --- Resolution par prefixe / erreurs -------------------------------------------------------------
test('resolveProposal : prefixe non ambigu OK, introuvable/absent -> erreur', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const one = listProposals(home)[0];
    assert.equal(resolveProposal(home, one.id).ok, true);
    assert.equal(resolveProposal(home, one.id.slice(0, 8)).ok, false); // prefixe horodatage : ambigu (3 props)
    assert.equal(resolveProposal(home, 'nexiste-pas').ok, false);
    assert.equal(resolveProposal(home, 'nexiste-pas').reason, 'introuvable');
    assert.equal(resolveProposal(home).reason, 'id-manquant');
  } finally { rm(home); }
});

// --- Couche COMMANDE : list / apply / reject via runReview (--json) --------------------------------
test('commande review : list --json puis apply --json (registre)', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const list = capture(() => runReview(['list', '--json', '--home', home]));
    const parsed = JSON.parse(list.out);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.count, 3);
    const mem = parsed.proposals.find((p) => p.type === 'memory' && p.target === 'registre');
    assert.equal(mem.policy, 'auto'); // defaut write_approval=auto

    const ap = capture(() => runReview(['apply', mem.id, '--json', '--home', home]));
    const apr = JSON.parse(ap.out);
    assert.equal(apr.ok, true);
    assert.equal(apr.status, 'applique');
    assert.notEqual(ap.exitCode, 1);
  } finally { rm(home); }
});

test('commande review : apply sur id introuvable -> exit 1', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const r = capture(() => runReview(['apply', 'zzz-introuvable', '--home', home]));
    assert.equal(r.exitCode, 1);
    assert.match(r.err, /introuvable/i);
  } finally { rm(home); }
});

// --- Non-regression : review n'a pas touche au canon quand on ne fait que lister -------------------
test('commande review : list seule ne materialise rien (canon inchange)', () => {
  const home = tmpCanonWithProposals(MIXED);
  try {
    const before = fs.readdirSync(home).sort();
    capture(() => runReview(['list', '--home', home]));
    assert.deepEqual(fs.readdirSync(home).sort(), before);
    assert.equal(memoryList(home, 'registre').length, 0);
    assert.equal(memoryList(home, 'profil').length, 0);
  } finally { rm(home); }
});
