// R3 — POINT D'ACCROCHE de la publication de la MEMOIRE HUMAINE sur le rituel de documentation.
//
// LE POINT RETENU : `doSnapshot()` (cli/src/commands/snapshot.js), APRES l'ecriture de
// specs/etat-des-lieux.md + .html, a cote de `runCadence` et `runProjectCadence`.
//
// Pourquoi celui-la, et pas un autre :
//   - c'est le SEUL passage oblige des trois moments de doc de la methode. `snapshot --reason
//     version|pause|reprise` y passe, et `iakaframe update` (le checkpoint) appelle `doSnapshot`
//     lui aussi : UNE greffe couvre les quatre entrees, sans plomberie nouvelle ;
//   - `doSnapshot` recoit DEJA `projectPath` ET `reason` — exactement les deux seules entrees dont
//     la publication a besoin (la racine a publier, et le moment). Aucun parametre a faire
//     descendre, aucune signature a changer ;
//   - le motif d'accroche EXISTE DEJA et a fait ses preuves deux fois (cadence globale, canon
//     projet), avec ses garanties : non-bloquant, pilote par config, aucune creation par effet de
//     bord. On se branche sur un rituel etabli au lieu d'en inventer un.
//
// Ecarte : un hook de runner (couple a Claude Code, invisible aux autres runners) ; un demon /
// cron (decision « pas de demon au MVP », deja tranchee pour la cadence) ; un verbe CLI dedie
// (ce serait un geste manuel de plus, pas un CABLAGE au rituel).
//
// TROIS GARANTIES, calquees sur `runCadence` :
//   1. NE LEVE JAMAIS. Instance injoignable, identifiants absents, skill non deployee, projet
//      illisible -> incident JOURNALISE, etat des lieux REUSSI. La memoire humaine est un
//      confort ; le rituel de doc, lui, ne doit jamais casser.
//   2. OPT-IN STRICT, AUCUNE CREATION PAR EFFET DE BORD. Sans `memoireHumaine.publier: true` dans
//      <projet>/iakaframe.json, on ne publie RIEN. Un `snapshot` dans un projet quelconque ne doit
//      jamais faire apparaitre un espace AppFlowy — meme parite que `canonExists`/`projectCanonExists`.
//   3. MOTIFS PILOTES PAR LE PROJET (`memoireHumaine.publier_sur`, defaut
//      ['version','pause','reprise']). Vider la liste desactive le cablage sans toucher au code.
//      `reprise` EST dedans, contrairement a la cadence d'apprentissage : on reprend un projet en
//      LISANT sa memoire, elle doit donc etre a jour a ce moment-la — et une passe sur un projet
//      inchange coute 0 ecriture (A8), le rattachement est donc quasi gratuit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseJsonFile, PROJECT_CONF } from './frame-active.js';

const DEFAULT_PUBLISH_ON = ['version', 'pause', 'reprise'];
// Plafond de temps : une publication qui traine ne doit pas retenir le rituel indefiniment.
// Mesure du 2026-07-29 : 25 s pour le plus gros porteur en 1re passe, 0,5 s en passe incrementale.
const DEFAULT_TIMEOUT_MS = 180000;

// Chemin du script de publication. Env d'abord (tests et installations exotiques), sinon la skill
// deployee au runtime. Retour '' si introuvable -> on saute proprement.
export function appflowyDocScript(env = process.env) {
  const explicite = env.IAKAFRAME_APPFLOWY_DOC;
  if (explicite) return fs.existsSync(explicite) ? explicite : '';
  const deploye = path.join(os.homedir(), '.claude', 'skills', 'iakaframe-appflowy-doc', 'appflowy-doc.mjs');
  return fs.existsSync(deploye) ? deploye : '';
}

// PUR — lit l'opt-in du projet. Absent / illisible / non conforme -> { publier: false }.
export function readMemoireHumaineConf(projectPath) {
  const json = parseJsonFile(path.join(path.resolve(projectPath), PROJECT_CONF));
  const conf = (json && typeof json.memoireHumaine === 'object' && json.memoireHumaine) || {};
  const publierSur = Array.isArray(conf.publier_sur) ? conf.publier_sur : DEFAULT_PUBLISH_ON;
  return {
    publier: conf.publier === true,
    espace: typeof conf.espace === 'string' && conf.espace.trim() ? conf.espace.trim() : '',
    workspace: typeof conf.workspace === 'string' && conf.workspace.trim() ? conf.workspace.trim() : '',
    publierSur,
    timeoutMs: Number.isFinite(conf.timeout_ms) ? conf.timeout_ms : DEFAULT_TIMEOUT_MS,
  };
}

// runMemoireHumaine({ projectPath, reason, env, runFn }) -> rapport journalisable. NE LEVE JAMAIS.
// `runFn` est le POINT D'INJECTION (defaut = spawnSync reel) : les tests ne touchent AUCUN reseau.
export function runMemoireHumaine({ projectPath, reason, env = process.env, runFn } = {}) {
  try {
    if (!projectPath) return { triggered: false, skipped: 'projet-absent', reason };
    const conf = readMemoireHumaineConf(projectPath);
    if (!conf.publier) return { triggered: false, skipped: 'non-opte', reason };
    if (!conf.publierSur.includes(reason)) {
      return { triggered: false, skipped: 'motif-hors-cadence', reason, publierSur: conf.publierSur };
    }
    const script = appflowyDocScript(env);
    if (!script) return { triggered: false, skipped: 'skill-absente', reason };

    const projet = conf.espace || path.basename(path.resolve(projectPath));
    const argv = [script, '--project', projet, '--root', path.resolve(projectPath)];
    if (conf.workspace) argv.push('--workspace', conf.workspace);

    const exec = runFn || ((a, o) => spawnSync(process.execPath, a, o));
    const r = exec(argv, { encoding: 'utf8', timeout: conf.timeoutMs, env });
    if (r && r.error) return { triggered: true, ok: false, reason, projet, error: r.error.message };
    if (!r || r.status !== 0) {
      // Le message d'echec de la skill est deja net (« instance injoignable », « config
      // manquante »…) : on le releve tel quel, sans le reinterpreter.
      const sortie = String((r && (r.stderr || r.stdout)) || '').trim().split('\n').pop() || 'echec';
      return { triggered: true, ok: false, reason, projet, error: sortie };
    }
    const derniere = String(r.stdout || '').trim().split('\n').pop() || '';
    return { triggered: true, ok: true, reason, projet, resume: derniere.replace(/^appflowy-doc:\s*/, '') };
  } catch (e) {
    // Filet ultime : meme un imprevu total sort en rapport, jamais en exception.
    return { triggered: false, skipped: 'garde', reason, error: e && e.message };
  }
}

// Une ligne humaine pour les logs du rituel. Jamais d'exception.
export function formatMemoireHumaine(res) {
  if (!res) return 'Memoire humaine : (non evaluee)';
  if (res.triggered && res.ok) return `Memoire humaine : publiee (${res.projet}) -> ${res.resume}`;
  if (res.triggered && !res.ok) {
    return `Memoire humaine : publication en echec (non bloquant, l'etat des lieux reste OK) : ${res.error}`;
  }
  switch (res.skipped) {
    case 'non-opte':
      return 'Memoire humaine : non activee pour ce projet -> ignoree (iakaframe.json memoireHumaine.publier).';
    case 'motif-hors-cadence':
      return `Memoire humaine : non declenchee (${res.reason} hors publier_sur=[${(res.publierSur || []).join(', ')}]).`;
    case 'skill-absente':
      return 'Memoire humaine : skill de publication non deployee -> ignoree (non bloquant).';
    case 'projet-absent':
      return 'Memoire humaine : aucun projet cible -> ignoree.';
    case 'garde':
      return `Memoire humaine : incident ravale (non bloquant) : ${res.error}`;
    default:
      return 'Memoire humaine : non declenchee.';
  }
}
