// Gardes G3/G6 du Lot A (mode guide du terminal, specs/instructions/cli-mode-guide-selections.md
// § Preuve). Deux verrous STATIQUES sur « pas de seconde source de verite » (valeurs) :
//   - G3a : lib/guidage.js ne contient AUCUN litteral de valeur metier (aucun tableau de personas,
//     modeles, collections, `kind`) — verifie par ABSENCE D'IMPORT des modules d'autorite (M7) :
//     un moteur qui ne peut pas LIRE l'autorite ne peut pas la recopier.
//   - G3b : `readline`/`process.stdin` ne sont importes/lus, pour le mode guide, QUE dans
//     lib/interactif.js et lib/guidage.js — a l'exception des DEUX prompts PRE-EXISTANTS (M2,
//     « prior art a reemployer ») de models.js (process roleKey) et onboard.js (askYesNo), grandfathered
//     PAR NOM et non par blanket-exemption : toute AUTRE commande qui en importerait recreerait M3.
// G6 (non-collision /iaka) est deja verrouille par test/learning-skill.test.js — non duplique ici.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CMD_DIR = path.join(HERE, '..', 'src', 'commands');
const LIB_DIR = path.join(HERE, '..', 'src', 'lib');
const GUIDAGE = path.join(LIB_DIR, 'guidage.js');

// --- G3a : guidage.js ne peut pas recopier une autorite qu'il n'importe pas ---------------------

const MODULES_AUTORITE = [
  'library.js', 'project-models.js', 'generate-agents.js', 'vocab.js', 'scaffold.js', 'remove.js',
];

test("G3a : lib/guidage.js n'importe AUCUN module d'autorite (M7) — ne peut donc pas recopier une valeur", () => {
  const src = fs.readFileSync(GUIDAGE, 'utf8');
  const offenders = MODULES_AUTORITE.filter((m) => src.includes(m));
  assert.deepEqual(offenders, [], `import(s) d'autorite dans guidage.js (seconde source possible) : ${offenders.join(', ')}`);
});

test('G3a : lib/guidage.js ne contient aucune VALEUR metier connue en dur (hors commentaires/prose)', () => {
  // Le CODE (hors lignes de commentaire `//`) est la seule surface qui compte : la prose des
  // commentaires NOMME legitimement les concepts (« personas », M7) sans les recopier en donnee.
  const code = fs.readFileSync(GUIDAGE, 'utf8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  // Alias de modele REELS (ACCEPTED_VOCABULARY, lib/project-models.js) : leur presence litterale
  // dans du CODE serait la preuve d'une recopie (le moteur ne les CONNAIT structurellement pas).
  const temoins = ['sonnet', 'haiku', 'opus', 'inherit'];
  for (const t of temoins) {
    assert.ok(!code.toLowerCase().includes(t), `valeur metier trouvee en dur dans le CODE de guidage.js : "${t}"`);
  }
});

// --- G3b : readline/process.stdin, verrouilles sur la liste EXACTE des lecteurs legitimes -------

const LECTEURS_AUTORISES = new Set([
  'guidage.js',      // moteur de selection (ce lot)
  'interactif.js',   // regle de non-interactivite (ce lot)
  'models.js',       // process interactif PRE-EXISTANT (M2, prior art) — roleKey/cible/action
  'onboard.js',      // askYesNo PRE-EXISTANT (M2, prior art) — confirmation --from-update
]);

function fichiersImportantReadline(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      return /from ['"]node:readline/.test(src) || /process\.stdin/.test(src);
    });
}

test("G3b : readline/process.stdin, QUE dans la liste EXACTE des lecteurs legitimes (mutation-eprouvable)", () => {
  const trouves = new Set([...fichiersImportantReadline(CMD_DIR), ...fichiersImportantReadline(LIB_DIR)]);
  const inattendus = [...trouves].filter((f) => !LECTEURS_AUTORISES.has(f));
  assert.deepEqual(inattendus, [], `lecteur(s) de readline/stdin NON attendu(s) — recreation d'un prompt (M3) ? ${inattendus.join(', ')}`);
});

test('G3b : controle POSITIF — la garde N\'EST PAS un temoin vide (les lecteurs attendus sont bien detectes)', () => {
  const trouves = new Set([...fichiersImportantReadline(CMD_DIR), ...fichiersImportantReadline(LIB_DIR)]);
  for (const attendu of LECTEURS_AUTORISES) {
    assert.ok(trouves.has(attendu), `lecteur legitime NON detecte (garde possiblement inoperante) : ${attendu}`);
  }
});
