// T6 - « Cadence » : branche l'appel de `close` (T4) sur le RITUEL D'ETAT DES LIEUX existant
// (instruction boucle-apprentissage-incrementale.md § 6, décision Q-2). La capture n'est PAS ad hoc :
// elle est déclenchée automatiquement par le cycle d'état des lieux sur `-Reason pause|version`, et
// JAMAIS sur `reprise` (la reprise charge le canon, elle ne capture pas). Ce n'est PAS un démon /
// scheduler / setInterval / cron (décision « pas de démon au MVP ») : c'est un simple BRANCHEMENT sur
// le rituel que la méthode impose déjà.
//
// GARANTIE NON-BLOQUANTE (dégradation gracieuse) : la cadence ne doit JAMAIS casser le rituel. Si le
// canon est absent, si `close` échoue ou si la config est illisible, l'état des lieux réussit quand
// même — l'incident est journalisé, jamais propagé. Toute erreur de `close` est ravalée dans le
// rapport (ok:false) et jamais relancée.
//
// PILOTAGE PAR CONFIG (§ 6, T1) : la liste des motifs déclencheurs est lue depuis `config.yaml` du
// canon (`cadence.close_on`, défaut ['pause','version']). Éditer cette liste (ou la vider) désactive
// la cadence sans toucher au code. Zéro dépendance runtime (Node core uniquement).
import fs from 'node:fs';
import { resolveMemoryHome, loadConfig, ensureLayout, configPath } from './memory.js';
import { close, transcriptsDir } from './close.js';
import { projectCanonHome, projectCanonExists } from './projectCanon.js';
import { closeProjectCanon, closeProjectSession, readMarker } from './projectSession.js';

// Motifs déclencheurs par défaut si la config est absente/illisible (miroir de defaultConfig()).
const DEFAULT_CLOSE_ON = ['pause', 'version'];

// Le canon « existe » (assez pour justifier un `close`) s'il porte déjà une config OU des transcripts.
// On NE crée PAS le canon comme effet de bord d'un simple snapshot : un décideur qui n'a jamais posé
// de canon ne doit pas voir ~/.iaka/memory/ apparaître à chaque pause. Absence -> on saute, gracieux.
function canonExists(home) {
  return fs.existsSync(configPath(home)) || fs.existsSync(transcriptsDir(home));
}

// runCadence({ reason, home, closeFn }) : décide et (si applicable) déclenche `close`. NE LÈVE JAMAIS.
//   - reason  : motif du rituel d'état des lieux ('pause'|'version'|'reprise'|'manual'|...).
//   - home    : chemin du canon (optionnel ; sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/). Les tests
//               passent TOUJOURS un home tmpdir (jamais le vrai ~/.iaka/).
//   - closeFn : POINT D'INJECTION (défaut = `close` réel de T4). Une fonction (home, opts) -> report.
// Retour (rapport journalisable) :
//   { triggered:false, skipped:'not-in-close-on'|'canon-absent'|'home-error', ... }
//   { triggered:true, ok:true, report }  |  { triggered:true, ok:false, error }  (non bloquant)
export function runCadence({ reason, home, closeFn = close } = {}) {
  // 1) Résolution du canon (peut refuser un chemin sous ~/.claude/, T1) — non bloquant.
  let resolvedHome;
  try { resolvedHome = resolveMemoryHome(home); }
  catch (e) { return { triggered: false, skipped: 'home-error', error: e.message, reason }; }

  // 2) Politique de cadence, PILOTÉE PAR config.yaml (close_on). Config illisible -> défauts.
  let closeOn = DEFAULT_CLOSE_ON;
  try {
    const cfg = loadConfig(resolvedHome);
    if (cfg && cfg.cadence && Array.isArray(cfg.cadence.close_on)) closeOn = cfg.cadence.close_on;
  } catch { /* config illisible : on retombe sur les défauts, sans casser le rituel */ }

  // 3) `reprise` (et tout motif hors close_on) NE déclenche PAS `close`.
  if (!closeOn.includes(reason)) {
    return { triggered: false, skipped: 'not-in-close-on', reason, closeOn };
  }

  // 4) Canon absent -> on saute (pas de création par effet de bord), gracieux.
  if (!canonExists(resolvedHome)) {
    return { triggered: false, skipped: 'canon-absent', reason, home: resolvedHome };
  }

  // 5) Déclenchement de la capture — NON BLOQUANT : toute erreur est ravalée dans le rapport.
  try {
    ensureLayout(resolvedHome); // idempotent : garantit proposals/ sans écraser l'existant
    const report = closeFn(resolvedHome, {});
    return { triggered: true, ok: true, reason, home: resolvedHome, report };
  } catch (e) {
    return { triggered: true, ok: false, reason, home: resolvedHome, error: e.message };
  }
}

// --- CADENCE DU CANON PROJET (lot A, § 6.1/§ 6.3) --------------------------------------------------
//
// `close_on` EST STRICTEMENT INCHANGE : ['pause','version'], et `reprise` N'Y ENTRE JAMAIS. Le
// rattrapage n'est PAS un elargissement de la cadence, c'est un GESTE DISTINCT (§ 3.4) :
//   - reason ∈ close_on          -> cloture normale du canon projet, puis marqueur `pending: false` ;
//   - reason === 'reprise'       -> RATTRAPAGE, et SEULEMENT s'il existe une dette (marqueur pendant).
//                                   Sans dette : STRICTEMENT RIEN — ni ecriture, ni proposition.
//                                   Un `reprise` sans dette reste EXACTEMENT ce qu'il est aujourd'hui.
//   - tout autre motif           -> rien.
//
// MEME GARANTIE NON-BLOQUANTE que la cadence globale : cette fonction NE LEVE JAMAIS. Canon projet
// absent, specs/ non inscriptible, depot en lecture seule, marqueur corrompu -> incident JOURNALISE,
// rituel REUSSI (§ 6.3-11/12/13).
export function runProjectCadence({ projectPath, reason, home, closeFn = closeProjectCanon } = {}) {
  if (!projectPath) return { triggered: false, skipped: 'projet-absent', reason };

  // 1) Canon global : il porte le marqueur (AR-2), les transcripts et le reservoir. Non bloquant.
  let memoryHome;
  try { memoryHome = resolveMemoryHome(home); }
  catch (e) { return { triggered: false, skipped: 'home-error', error: e.message, reason }; }

  // 2) Canon PROJET absent -> on saute, SANS le creer par effet de bord. Un projet qui n'a jamais
  //    pose de canon ne doit pas voir specs/canon/ apparaitre a chaque pause (parite `canonExists`).
  let canonHome;
  try {
    canonHome = projectCanonHome(projectPath);
    if (!projectCanonExists(canonHome)) {
      return { triggered: false, skipped: 'canon-projet-absent', reason, canonHome };
    }
  } catch (e) {
    return { triggered: false, skipped: 'canon-projet-illisible', error: e.message, reason };
  }

  // 3) Politique de cadence : la MEME liste que la cadence globale, lue depuis config.yaml.
  let closeOn = DEFAULT_CLOSE_ON;
  try {
    const cfg = loadConfig(memoryHome);
    if (cfg && cfg.cadence && Array.isArray(cfg.cadence.close_on)) closeOn = cfg.cadence.close_on;
  } catch { /* config illisible : defauts, sans casser le rituel */ }

  // 4) Cloture normale.
  if (closeOn.includes(reason)) {
    return runProjectClose({ memoryHome, projectPath, reason, closeFn, mode: 'cloture' });
  }

  // 5) RATTRAPAGE — le geste distinct. Ne s'execute QUE sur `reprise` ET QUE s'il y a une dette.
  if (reason === 'reprise') {
    const marker = readMarker(memoryHome, projectPath); // corrompu/absent -> null -> pas de dette
    if (!marker || marker.pending !== true) {
      return { triggered: false, skipped: 'aucune-dette', reason, canonHome };
    }
    return runProjectClose({
      memoryHome, projectPath, reason, closeFn, mode: 'rattrapage', openedAt: marker.openedAt,
    });
  }

  return { triggered: false, skipped: 'not-in-close-on', reason, closeOn };
}

// Execution commune cloture/rattrapage. Toute erreur est RAVALEE dans le rapport, jamais propagee.
function runProjectClose({ memoryHome, projectPath, reason, closeFn, mode, openedAt }) {
  try {
    ensureLayout(memoryHome); // idempotent : garantit proposals/ cote canon GLOBAL (jamais dans le projet)
    const report = closeFn(memoryHome, projectPath, {});
    // Le marqueur est desarme APRES une cloture reussie : une cloture qui echoue laisse la dette
    // en place, pour etre retentee a la reprise suivante. On ne perd jamais une dette en silence.
    const marker = closeProjectSession(memoryHome, projectPath, reason);
    return { triggered: true, ok: true, mode, reason, openedAt, memoryHome, report, marker: marker.marker };
  } catch (e) {
    return { triggered: true, ok: false, mode, reason, openedAt, memoryHome, error: e.message };
  }
}

// formatProjectCadence(res) : une ligne humaine pour les logs du rituel. Jamais d'exception.
export function formatProjectCadence(res) {
  if (!res) return 'Canon projet : (non évalué)';
  if (res.triggered && res.ok) {
    const n = res.report && Array.isArray(res.report.emitted) ? res.report.emitted.length : 0;
    if (res.mode === 'rattrapage') {
      // Journalisation EXIGEE par le § 6.3-7 : le rattrapage doit se voir, sinon on ne saura jamais
      // qu'une cloture avait ete manquee.
      return `Canon projet : rattrapage : clôture différée exécutée (session ouverte le ${res.openedAt || '?'})`
        + ` -> ${n} proposition(s) dans proposals/`;
    }
    return `Canon projet : clôture (${res.reason}) -> ${n} proposition(s) dans proposals/`;
  }
  if (res.triggered && !res.ok) {
    return `Canon projet : clôture en échec (non bloquant, l'état des lieux reste OK) : ${res.error}`;
  }
  switch (res.skipped) {
    case 'canon-projet-absent':
      return 'Canon projet : absent -> ignoré (aucune création par effet de bord).';
    case 'aucune-dette':
      return 'Canon projet : reprise sans clôture en attente -> aucun rattrapage.';
    case 'not-in-close-on':
      return `Canon projet : non déclenché (${res.reason} hors cadence.close_on=[${(res.closeOn || []).join(', ')}]).`;
    case 'home-error':
      return `Canon projet : canon non résolu -> ignoré (non bloquant) : ${res.error}`;
    case 'canon-projet-illisible':
      return `Canon projet : illisible -> ignoré (non bloquant) : ${res.error}`;
    case 'projet-absent':
      return 'Canon projet : aucun projet ciblé -> ignoré.';
    default:
      return 'Canon projet : non déclenché.';
  }
}

// formatCadence(res) : une ligne humaine pour les logs du rituel (snapshot/update). Jamais d'exception.
export function formatCadence(res) {
  if (!res) return 'Cadence : (non évaluée)';
  if (res.triggered && res.ok) {
    const n = res.report && Array.isArray(res.report.emitted) ? res.report.emitted.length : 0;
    return `Cadence : close déclenché (${res.reason}) -> ${n} proposition(s) dans proposals/`;
  }
  if (res.triggered && !res.ok) {
    return `Cadence : close a échoué (non bloquant, l'état des lieux reste OK) : ${res.error}`;
  }
  switch (res.skipped) {
    case 'not-in-close-on':
      return `Cadence : close non déclenché (${res.reason} hors cadence.close_on=[${(res.closeOn || []).join(', ')}]).`;
    case 'canon-absent':
      return 'Cadence : canon absent -> close ignoré (aucune création par effet de bord).';
    case 'home-error':
      return `Cadence : canon non résolu -> close ignoré (non bloquant) : ${res.error}`;
    default:
      return 'Cadence : close non déclenché.';
  }
}
