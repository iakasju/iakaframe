// Recette de la garde de VENDORAGE cross-repo (specs/instructions/garde-vendor-check-cross-repo.md).
//
// Le depot GUI REEL n'est JAMAIS mute par ces tests : chaque scenario travaille sur un MIROIR
// SYNTHETIQUE construit dans un dossier temporaire depuis le canon courant, puis altere. C'est la
// seule facon d'eprouver le vert (le vendorage reel est massivement en derive, § 12.2) sans salir
// l'arbre du frere.
//
// LIMITE ASSUMEE (§ 8) : un drift injecte simultanement et de facon coherente dans les DEUX depots
// reste indetectable — plus aucun referentiel externe ne permet de le juger. Ces tests verrouillent
// le cas realiste : le drift n'est injecte que d'UN cote (les fixtures GUI).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkVendor, resolveGuiRoot, stripHeader, IDS } from '../src/lib/vendor.js';
import { generateAgent, loadDefaultBinding, renderAgentContract, verbatimBody } from '../src/lib/generate-agents.js';
import { parseFrontmatter } from '../src/lib/frontmatter.js';
import { sha256 } from '../src/lib/vendor.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');           // depot iakaframe (vraie bibliotheque)
const CLI = path.join(REPO, 'cli', 'src', 'index.js');
const FIXTURES_REL = path.join('packages', 'core', '__tests__', 'fixtures');

// Re-wrappe les listes flow du frontmatter sur UNE ligne : meme valeur semantique, bytes
// differents. Sert a prouver qu'un simple re-wrapping ne declenche PAS la garde (A17).
function rewrapFlowLists(text) {
  const lines = text.split('\n');
  const end = lines.indexOf('---', 1);
  const head = lines.slice(0, end + 1).join('\n').replace(/,\n {2}/g, ', ');
  return head + '\n' + lines.slice(end + 1).join('\n');
}

// Construit un miroir SYNTHETIQUE et CONFORME du vendorage, depuis le canon courant.
function makeCleanMirror() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iakaframe-vendor-'));
  const fx = path.join(root, FIXTURES_REL);
  fs.mkdirSync(path.join(fx, 'personas'), { recursive: true });
  fs.mkdirSync(path.join(fx, 'agents-golden'), { recursive: true });
  fs.mkdirSync(path.join(fx, 'binding'), { recursive: true });

  for (const id of IDS) {
    fs.copyFileSync(path.join(REPO, 'library', 'personas', `${id}.md`), path.join(fx, 'personas', `${id}.md`));
    fs.copyFileSync(path.join(REPO, 'cli', 'test', 'fixtures', 'agents-golden', `${id}.md`),
      path.join(fx, 'agents-golden', `${id}.md`));
  }
  fs.copyFileSync(path.join(REPO, 'bindings', 'iakaframe-claude-default.md'),
    path.join(fx, 'binding', 'iakaframe-claude-default.md'));

  const methodRaw = fs.readFileSync(path.join(REPO, 'methods', 'iakaframe.md'), 'utf8');
  fs.writeFileSync(path.join(fx, 'method.iakaframe.md'), methodRaw);
  // La derivee « wrapped » : MEME frontmatter, wrapping different -> doit rester VERTE.
  fs.writeFileSync(path.join(fx, 'method.iakaframe-wrapped.md'), rewrapFlowLists(methodRaw));
  fs.copyFileSync(path.join(REPO, 'teams', 'iakaframe-8.md'), path.join(fx, 'team.iakaframe-8.md'));
  // Kit : reference = golden CLI DEPOUILLE de son en-tete (A21).
  const kitGolden = fs.readFileSync(path.join(REPO, 'cli', 'test', 'fixtures', 'kit.iakaframe-claude.golden.md'), 'utf8');
  fs.writeFileSync(path.join(fx, 'kit.iakaframe-claude.md'), stripHeader(kitGolden));

  return { root, fx };
}

const fixturePath = (m, rel) => path.join(m.fx, rel);
const run = (m, extra = {}) => checkVendor({ root: REPO, guiRoot: m.root, ...extra });

test('A2 : miroir conforme -> ok, checked == 17 et derived == 4 (attendu EXACT)', () => {
  const m = makeCleanMirror();
  const res = run(m);
  assert.equal(res.ok, true, 'miroir synthetique conforme attendu vert : ' + JSON.stringify(res.files, null, 2));
  assert.equal(res.status, 'clean');
  assert.equal(res.checked, 17);
  assert.equal(res.derived, 4);
  assert.equal(res.drift, 0);
});

test('A17 : re-wrapping seul d\'une derivee -> VERT (le corps et la mise en page ne sont pas juges)', () => {
  const m = makeCleanMirror();
  // La fixture wrapped est deja re-wrappee par makeCleanMirror ; on force en plus un corps different.
  const p = fixturePath(m, 'method.iakaframe-wrapped.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + '\n\nCorps volontairement divergent.\n');
  const res = run(m);
  assert.equal(res.ok, true, 'un ecart de corps ne doit pas rendre rouge une derivee');
  const note = res.derivedFixtures.find((d) => d.fixture === 'method.iakaframe-wrapped.md');
  assert.equal(note.status, 'derived');
  assert.equal(note.bodyDiffers, true, 'A18 : l\'ecart de corps doit etre DECLARE, jamais silencieux');
  assert.equal(note.frontmatterOk, true);
});

test('A3 : 1 octet altere sur une persona vendoree -> rouge, fichier nomme', () => {
  const m = makeCleanMirror();
  const p = fixturePath(m, path.join('personas', 'gimli.md'));
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + ' ');
  const res = run(m);
  assert.equal(res.ok, false);
  assert.equal(res.drift, 1);
  assert.ok(res.files.some((f) => f.fixture.endsWith('gimli.md') && f.family === 'personas'));
});

test('A4 : 1 octet altere sur le binding vendore -> rouge', () => {
  const m = makeCleanMirror();
  const p = fixturePath(m, path.join('binding', 'iakaframe-claude-default.md'));
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + ' ');
  const res = run(m);
  assert.equal(res.ok, false);
  assert.ok(res.files.some((f) => f.family === 'binding'));
});

test('A5-a : drift MUTUELLEMENT COHERENT (binding + golden + sha256 recalcules ensemble) -> ROUGE', () => {
  const m = makeCleanMirror();
  // 1. on retire l'outil Task a odin dans le binding vendore ;
  const bindingPath = fixturePath(m, path.join('binding', 'iakaframe-claude-default.md'));
  const drifted = fs.readFileSync(bindingPath, 'utf8')
    .replace('tools: [Read, Grep, Glob, Bash, Task] }', 'tools: [Read, Grep, Glob, Bash] }');
  assert.notEqual(drifted, fs.readFileSync(bindingPath, 'utf8'), 'le drift doit reellement modifier le binding');
  fs.writeFileSync(bindingPath, drifted);

  // 2. on REGENERE le golden d'odin avec ce binding drifte ;
  const personaRaw = fs.readFileSync(fixturePath(m, path.join('personas', 'odin.md')), 'utf8');
  const { data } = parseFrontmatter(personaRaw);
  const contract = renderAgentContract({
    id: 'odin', description: data.description,
    tools: ['Read', 'Grep', 'Glob', 'Bash'], guardrails: data.guardrails,
    body: verbatimBody(personaRaw),
  });
  // 3. ... et on RECALCULE son sha256 pour que la copie reste coherente avec elle-meme.
  const header = '<!-- iakaframe:agent-contract-golden — NE PAS EDITER A LA MAIN\n'
    + 'Reference : iakaframe/cli src/lib/generate-agents.js renderAgentContract (referent gate)\n'
    + 'Intrants  : library/personas/odin.md + bindings/iakaframe-claude-default.md\n'
    + 'Regenerer : node cli/scripts/gen-agents-golden.mjs  (puis re-vendorer les 8 fichiers cote GUI)\n'
    + `sha256    : ${sha256(contract)}\n-->\n`;
  fs.writeFileSync(fixturePath(m, path.join('agents-golden', 'odin.md')), header + contract);

  // Le trio est INTERNEMENT COHERENT : c'est exactement ce qui laisse la GUI verte (475/475).
  const res = run(m);
  assert.equal(res.ok, false, 'le drift coherent DOIT etre detecte');
  assert.ok(res.files.some((f) => f.family === 'binding'), 'binding drifte non signale');
  const golden = res.files.find((f) => f.fixture.endsWith(path.join('agents-golden', 'odin.md')));
  assert.ok(golden, 'golden drifte non signale');
  // Le niveau 2 est ce qui defait le drift coherent : il ancre sur le canon vivant.
  assert.ok(golden.reasons.some((r) => r.reason === 'niveau2-contrat-vivant-different'),
    'le niveau 2 (contrat regenere depuis le canon) doit signaler le golden');
});

test('A12 : sha256 du golden vendore == sha256 du contrat regenere depuis les sources vivantes', () => {
  const m = makeCleanMirror();
  const binding = loadDefaultBinding(REPO);
  for (const id of IDS) {
    const useful = stripHeader(fs.readFileSync(fixturePath(m, path.join('agents-golden', `${id}.md`)), 'utf8'));
    assert.equal(sha256(useful), sha256(generateAgent(id, { root: REPO, binding })),
      `${id} : golden vendore != contrat vivant`);
  }
});

test('A6 : fixture surnumeraire -> rouge', () => {
  const m = makeCleanMirror();
  fs.writeFileSync(fixturePath(m, path.join('personas', 'sauron.md')), '---\nname: sauron\n---\n');
  const res = run(m);
  assert.equal(res.ok, false);
  assert.ok(res.files.some((f) => f.reasons.some((r) => r.reason === 'fixture-surnumeraire')));
});

test('A7 : fixture supprimee -> rouge (jamais un compte allege qui validerait un dossier ampute)', () => {
  const m = makeCleanMirror();
  fs.rmSync(fixturePath(m, path.join('personas', 'loki.md')));
  const res = run(m);
  assert.equal(res.ok, false);
  assert.equal(res.checked, 16, 'la fixture manquante ne doit pas etre comptee comme verifiee');
  assert.ok(res.files.some((f) => f.reasons.some((r) => r.reason === 'fixture-manquante')));
});

test('A19 : ok:true implique checked == 17 ET derived == 4 (un minimum ne prouverait pas la couverture)', () => {
  const m = makeCleanMirror();
  fs.rmSync(fixturePath(m, 'team.iakaframe-8.md'));
  const res = run(m);
  assert.equal(res.ok, false, 'derived == 3 doit interdire ok:true');
  assert.equal(res.derived, 3);
});

test('A20 : derivee - frontmatter altere => rouge ; corps altere seul => vert', () => {
  // corps seul
  const a = makeCleanMirror();
  const pa = fixturePath(a, 'team.iakaframe-8.md');
  fs.writeFileSync(pa, fs.readFileSync(pa, 'utf8') + '\nParagraphe ajoute au corps.\n');
  assert.equal(run(a).ok, true, 'le corps d\'une derivee est exempte');

  // frontmatter
  const b = makeCleanMirror();
  const pb = fixturePath(b, 'team.iakaframe-8.md');
  fs.writeFileSync(pb, fs.readFileSync(pb, 'utf8').replace('coordinator: aragorn', 'coordinator: gimli'));
  const res = run(b);
  assert.equal(res.ok, false, 'une derive de frontmatter d\'une derivee est un drift');
  const f = res.files.find((x) => x.fixture === 'team.iakaframe-8.md');
  assert.ok(f.reasons.some((r) => r.reason === 'frontmatter-different'));
});

test('A21 : la reference du kit est le golden CLI DEPOUILLE, jamais kits/iakaframe-claude.md', () => {
  const m = makeCleanMirror();
  const kitCanon = path.join(REPO, 'kits', 'iakaframe-claude.md');
  assert.ok(fs.existsSync(kitCanon), 'kits/iakaframe-claude.md attendu present');
  // Le miroir conforme (golden depouille) est vert ...
  assert.equal(run(m).ok, true);
  // ... et pointer la fixture sur kits/ la rend ROUGE : les deux ne sont PAS en relation d'egalite.
  fs.copyFileSync(kitCanon, fixturePath(m, 'kit.iakaframe-claude.md'));
  const res = run(m);
  assert.equal(res.ok, false, 'kits/iakaframe-claude.md ne doit JAMAIS etre la reference du kit');
  assert.ok(res.files.some((f) => f.family === 'kit'));
});

test('A8/A10 : frere absent -> ok:false + status skipped + exit 0 ; IAKAFRAME_GUI_ROOT prioritaire', () => {
  const absent = path.join(os.tmpdir(), 'iakaframe-gui-absent-' + Date.now());
  const r = spawnSync(process.execPath, [CLI, 'vendor-check', '--json', '--root', REPO], {
    encoding: 'utf8', env: { ...process.env, IAKAFRAME_GUI_ROOT: absent },
  });
  // Le repo frere REEL existe a cote : si l'override n'etait pas prioritaire, on ne serait pas skip.
  const out = JSON.parse(r.stdout);
  assert.equal(out.ok, false, 'ok ne vaut JAMAIS true sans verification reelle');
  assert.equal(out.status, 'skipped');
  assert.equal(r.status, 0, 'un clone isole ne doit jamais etre bloque');
  assert.ok(out.candidates[0] === absent, 'IAKAFRAME_GUI_ROOT doit primer');
});

test('A10 : IAKAFRAME_GUI_ROOT honore en priorite sur une copie controlee', () => {
  const m = makeCleanMirror();
  const r = spawnSync(process.execPath, [CLI, 'vendor-check', '--json', '--root', REPO], {
    encoding: 'utf8', env: { ...process.env, IAKAFRAME_GUI_ROOT: m.root },
  });
  const out = JSON.parse(r.stdout);
  assert.equal(out.ok, true, 'la copie controlee conforme doit etre verte');
  assert.equal(out.guiRoot, m.root);
  assert.equal(r.status, 0);
});

test('A9 : frere absent + --strict -> exit 1', () => {
  const absent = path.join(os.tmpdir(), 'iakaframe-gui-absent-' + Date.now());
  const r = spawnSync(process.execPath, [CLI, 'vendor-check', '--json', '--strict', '--root', REPO], {
    encoding: 'utf8', env: { ...process.env, IAKAFRAME_GUI_ROOT: absent },
  });
  const out = JSON.parse(r.stdout);
  assert.equal(out.ok, false);
  assert.equal(r.status, 1, '--strict doit bloquer quand on SAIT que les deux depots sont la');
});

test('A1 : derive -> exit 1 et C-JSON valide (ok en premiere cle)', () => {
  const m = makeCleanMirror();
  const p = fixturePath(m, path.join('personas', 'helm.md'));
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + ' ');
  const r = spawnSync(process.execPath, [CLI, 'vendor-check', '--json', '--root', REPO], {
    encoding: 'utf8', env: { ...process.env, IAKAFRAME_GUI_ROOT: m.root },
  });
  assert.equal(r.status, 1);
  assert.equal(Object.keys(JSON.parse(r.stdout))[0], 'ok', 'C-JSON : `ok` en premiere cle');
});

// A14 — AMENDE (specs/instructions/remede-vendor-check-derive-de-l-etat.md § 3.4).
//
// La version d'origine EXIGEAIT la chaine `iakaframe assemble iakaframe iakaframe-8 --write`, geste
// qui vise `kits/<id>.md` — un fichier qu'aucune ligne de fixtureTable() ne lit, et que A21 designe
// explicitement comme HORS-REFERENCE. Le test verrouillait donc le defaut. La doctrine « DEUX
// gestes » cede la place a « UN GESTE PAR DERIVE CONSTATEE » : le dispositif compte quatre natures
// de gestes (copie, regeneration de derivee, regeneration de golden PUIS copie, suppression).
//
// CE QUI EST CONSERVE, et qui etait le fond de l'invariant : jamais de `cp` sur une derivee
// SERIALISEE, et `gen-fixtures.mjs` nomme QUAND une telle derivee est en cause.
test('A14 (amende) : un geste par derive constatee ; jamais de `cp` sur une derivee serialisee', () => {
  const m = makeCleanMirror();
  // Deux derives de natures DIFFERENTES en une passe : une copie (persona) et une derivee
  // serialisee (frontmatter de team) — c'est le seul cas ou l'invariant est reellement mis a
  // l'epreuve, puisqu'il faut que les deux gestes coexistent sans se contaminer.
  const p = fixturePath(m, path.join('personas', 'helm.md'));
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + ' ');
  const t = fixturePath(m, 'team.iakaframe-8.md');
  fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace('coordinator: aragorn', 'coordinator: gimli'));

  const r = spawnSync(process.execPath, [CLI, 'vendor-check', '--root', REPO], {
    encoding: 'utf8', env: { ...process.env, IAKAFRAME_GUI_ROOT: m.root },
  });
  const out = r.stdout;

  // CONSERVE : la derivee serialisee est en cause -> sa commande de regeneration est nommee.
  assert.match(out, /node packages\/core\/scripts\/gen-fixtures\.mjs/, 'commande de regeneration absente');
  // CONSERVE : et elle n'est JAMAIS copiee.
  const copyLines = out.split('\n').filter((l) => /^\s+cp /.test(l));
  assert.ok(copyLines.length > 0, 'la derive de persona doit produire une ligne de copie');
  for (const l of copyLines) {
    assert.ok(!l.includes('team.iakaframe-8.md'),
      'une derivee serialisee ne doit JAMAIS etre prescrite en copie : ' + l);
  }
  // RETIRE : le geste qui visait un fichier jamais lu par la garde (§ 2.2).
  assert.ok(!out.includes('iakaframe assemble'),
    '`iakaframe assemble` vise kits/<id>.md, que la garde ne lit jamais (A21) : geste retire');
  // AJOUTE : le remede ne parle que des derives constatees.
  assert.match(out, /cp library\/personas\/helm\.md/, 'la persona derivee doit etre nommee');
  assert.ok(!out.includes('binding/iakaframe-claude-default.md'),
    'aucune derive du binding : il ne doit apparaitre dans aucun geste');
  assert.ok(!/agents-golden/.test(out), 'aucune derive de golden : aucune ligne golden attendue');
});

test('A5-a (garde de non-mutation) : le depot GUI reel n\'est jamais mute par la suite', () => {
  const real = resolveGuiRoot(REPO, { ...process.env, IAKAFRAME_GUI_ROOT: '' });
  if (!real) return; // clone isole : rien a verifier
  const before = spawnSync('git', ['-C', real, 'status', '--porcelain'], { encoding: 'utf8' });
  if (before.status !== 0) return; // pas un depot git : hors sujet
  makeCleanMirror();
  checkVendor({ root: REPO, guiRoot: real });
  const after = spawnSync('git', ['-C', real, 'status', '--porcelain'], { encoding: 'utf8' });
  assert.equal(after.stdout, before.stdout, 'la garde doit etre STRICTEMENT en lecture seule');
});
