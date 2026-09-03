// Palier 0 du Lot A (mode guide du terminal, specs/instructions/cli-mode-guide-selections.md
// § A1) : « aucun prompt ; chaque `fail()` sur vocabulaire ferme liste les valeurs DERIVEES ».
// Sert de FILET au reste du lot : ces refus restent les MEMES sans --guide, guide ou pas — la
// richesse du message n'est PAS conditionnee par le drapeau (elle beneficie a tous les publics :
// humain, script, agent). Comparaison a l'appel de l'AUTORITE fait dans le test lui-meme (jamais
// une liste ecrite en dur ici), sur le modele de G2 (§ Preuve).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scan } from '../src/lib/library.js';
import { ACCEPTED_VOCABULARY } from '../src/lib/project-models.js';
import { personasForTarget } from '../src/lib/generate-agents.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const ROOT = path.join(HERE, '..', '..');

function run(args) {
  try {
    return { out: execFileSync('node', [CLI, ...args], { cwd: ROOT, encoding: 'utf8' }), status: 0 };
  } catch (e) {
    return { out: (e.stdout || '') + (e.stderr || ''), status: e.status };
  }
}

test('models set : persona hors team liste les personas DERIVES de personasForTarget', () => {
  const attendus = personasForTarget({ root: ROOT, project: ROOT });
  const { out, status } = run(['models', 'set', 'zzz-persona-absente', 'sonnet', '--path', ROOT]);
  assert.equal(status, 1);
  for (const id of attendus) assert.match(out, new RegExp(id), `persona attendue absente du refus : ${id}`);
});

test('models set : modele hors vocabulaire liste ACCEPTED_VOCABULARY (jamais une prose figee)', () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-refus-'));
  const { out, status } = run(['models', 'set', 'gandalf', 'zzz-modele-inconnu', '--path', proj]);
  assert.equal(status, 1);
  for (const v of ACCEPTED_VOCABULARY) assert.ok(out.includes(v), `valeur attendue absente du refus : ${v}`);
  fs.rmSync(proj, { recursive: true, force: true });
});

test('remove : id absent liste les ids DERIVES de scan(type)', () => {
  const attendus = scan('teams', ROOT).map((e) => e.id);
  const { out, status } = run(['remove', 'team', 'zzz-team-absente']);
  assert.equal(status, 1);
  for (const id of attendus.slice(0, 5)) assert.match(out, new RegExp(`\\b${id}\\b`), `id attendu absent du refus : ${id}`);
});

test('attach : persona absente liste les ids DERIVES de scan(personas)', () => {
  const attendus = scan('personas', ROOT).map((e) => e.id);
  const { out, status } = run(['attach', 'iakaframe-cadrage', '--persona', 'zzz-persona-absente']);
  assert.equal(status, 1);
  for (const id of attendus.slice(0, 5)) assert.match(out, new RegExp(`\\b${id}\\b`), `id attendu absent du refus : ${id}`);
});

test('attach : skill absent liste les ids DERIVES de scan(skills)', () => {
  const attendus = scan('skills', ROOT).map((e) => e.id);
  const { out, status } = run(['attach', 'zzz-skill-absent', '--persona', 'gandalf']);
  assert.equal(status, 1);
  for (const id of attendus.slice(0, 5)) assert.match(out, new RegExp(`\\b${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`), `id attendu absent du refus : ${id}`);
});

test('frame use : frameId inconnu liste les ids DERIVES de scan(frames)', () => {
  const attendus = scan('frames', ROOT).map((e) => e.id);
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-refus-frame-'));
  const { out, status } = run(['frame', 'use', 'zzz-frame-absente', '--path', proj]);
  assert.equal(status, 1);
  for (const id of attendus) assert.match(out, new RegExp(id), `frame attendue absente du refus : ${id}`);
  fs.rmSync(proj, { recursive: true, force: true });
});

test('switch : methodId inconnu liste les ids DERIVES de scan(methods) (avant assemble())', () => {
  const attendus = scan('methods', ROOT).map((e) => e.id);
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-refus-switch-'));
  const { out, status } = run(['switch', 'zzz-methode-absente', 'iakaframe-8', '--path', proj, '--root', ROOT]);
  assert.equal(status, 1);
  for (const id of attendus.slice(0, 5)) assert.match(out, new RegExp(id), `methode attendue absente du refus : ${id}`);
  fs.rmSync(proj, { recursive: true, force: true });
});

test('switch : teamId inconnu liste les ids DERIVES de scan(teams) (avant assemble())', () => {
  const attendus = scan('teams', ROOT).map((e) => e.id);
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-refus-switch2-'));
  const { out, status } = run(['switch', 'iakaframe', 'zzz-team-absente', '--path', proj, '--root', ROOT]);
  assert.equal(status, 1);
  for (const id of attendus.slice(0, 5)) assert.match(out, new RegExp(id), `team attendue absente du refus : ${id}`);
  fs.rmSync(proj, { recursive: true, force: true });
});

test('show --type : id absent liste les ids DERIVES de scan(type)', () => {
  const attendus = scan('personas', ROOT).map((e) => e.id);
  const { out, status } = run(['show', 'zzz-persona-absente', '--type', 'personas']);
  assert.equal(status, 1);
  for (const id of attendus.slice(0, 5)) assert.match(out, new RegExp(`\\b${id}\\b`), `id attendu absent du refus : ${id}`);
});

// --- Temoin de MUTATION (rule 1 § Chantier) : si l'authorite se vide, le refus le DIT (pas de
// liste mensongere), ce qui prouve que le message est bien DERIVE et non une prose figee. -------
test('remove : bibliotheque vide -> le refus dit « aucun » plutot que de mentir', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-refus-vide-'));
  fs.mkdirSync(path.join(empty, 'library', 'personas'), { recursive: true });
  fs.mkdirSync(path.join(empty, 'methods'), { recursive: true });
  fs.mkdirSync(path.join(empty, 'teams'), { recursive: true });
  const { out, status } = run(['remove', 'team', 'zzz', '--root', empty]);
  assert.equal(status, 1);
  assert.match(out, /aucun team dans la bibliotheque/);
  fs.rmSync(empty, { recursive: true, force: true });
});
