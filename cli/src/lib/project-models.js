// Surcharge du modele d'IA PAR PROJET (specs/instructions/surcharge-modele-par-projet.md).
//
// La DECISION est persistee dans <projet>/iakaframe.json, cle `modelOverrides` (objet indexe par
// `personaId`, D2) — jamais `models` (collision avec l'etage SUGGESTION, models/suggestions.json,
// D3 du canon). La PROJECTION (le fichier de contrat de projet qui la fait gagner par precedence,
// F1) vit AILLEURS (`<projet>/.claude/agents/<id>.md`, ecrite par `models set`, cli/src/commands/
// models.js) — ce module ne la touche jamais : il ne connait que la DECISION.
//
// Toute ecriture passe par `patchProjectConf` (frame-active.js, D3) : garde UNIQUE « refuse plutot
// qu'ecrase », partagee avec `writeActiveFramePointer`. Une cle `modelOverrides` videe de sa
// derniere entree est RETIREE (jamais laissee en `{}` residuel) : un objet vide et une cle absente
// doivent se lire pareil, autant n'en ecrire qu'une (D3).
import fs from 'node:fs';
import path from 'node:path';
import { parseJsonFile, patchProjectConf, PROJECT_CONF } from './frame-active.js';
import { loadDefaultBinding, modelForPersona } from './generate-agents.js';
import { libraryRoot } from './library.js';

// Lecture DEFENSIVE de `modelOverrides` : absent / illisible / non-objet / cle absente -> `{}`
// (jamais de jet, calque de `parseJsonFile`). Ne CREE rien.
export function readModelOverrides(projectDir) {
  if (!projectDir) return {};
  const proj = path.resolve(projectDir);
  const json = parseJsonFile(path.join(proj, PROJECT_CONF));
  const mo = json.modelOverrides;
  return (mo && typeof mo === 'object' && !Array.isArray(mo)) ? mo : {};
}

// Pose UNE surcharge (`models set`). Delegue a `patchProjectConf` (garde unique, cf. en-tete).
// Rend { ok, path, cfg } ou { ok:false, reason:'unreadable', path } (JSON illisible, RIEN ecrit).
export function writeModelOverride(projectDir, personaId, model) {
  return patchProjectConf(projectDir, (cfg) => {
    if (!cfg.modelOverrides || typeof cfg.modelOverrides !== 'object' || Array.isArray(cfg.modelOverrides)) {
      cfg.modelOverrides = {};
    }
    cfg.modelOverrides[personaId] = model;
  });
}

// Retire une surcharge (`models unset <personaId>`), ou TOUTES (`personaId === null`, --all).
// Idempotent : une entree deja absente, ou une cle deja absente, n'est PAS une erreur. La cle
// `modelOverrides` est RETIREE (pas laissee en `{}`) des qu'elle devient vide (D3).
export function clearModelOverride(projectDir, personaId) {
  return patchProjectConf(projectDir, (cfg) => {
    if (!cfg.modelOverrides || typeof cfg.modelOverrides !== 'object' || Array.isArray(cfg.modelOverrides)) return;
    if (personaId == null) {
      delete cfg.modelOverrides;
      return;
    }
    delete cfg.modelOverrides[personaId];
    if (Object.keys(cfg.modelOverrides).length === 0) delete cfg.modelOverrides;
  });
}

// --- Validation de FORME (D6) : bloquante uniquement -----------------------------------------
// Ensemble CONNU au moment de l'ECRITURE (F5) : ne sert JAMAIS a bloquer, seulement a decider si
// un AVERTISSEMENT (non bloquant) accompagne l'ecriture. `fable` y figure : elle est une valeur
// techniquement valide, son exclusion des bindings est une POLITIQUE (D10), pas une contrainte
// de forme — elle ne doit donc JAMAIS declencher cet avertissement.
const KNOWN_MODEL_VALUES = new Set(['sonnet', 'opus', 'haiku', 'fable', 'inherit']);

// Rend { blocking: <raison> } si la valeur ne peut STRUCTURELLEMENT pas etre une valeur de modele
// (D6) : vide/blanche (c'est le geste `unset`, pas une valeur), tout espace (interne, de tete/fin,
// retour a la ligne), ou un caractere de tete qui casserait le frontmatter rendu (`#`, `"`, `'`,
// `[`, `{`). Cette garde ne connait AUCUN nom de modele : elle ne peut donc pas se perimer.
// Sinon, rend { ok: <valeur>, warning: <message|null> } — la valeur est TOUJOURS ecrite ; seul
// l'avertissement (hors ensemble connu) est informatif, jamais bloquant.
export function validateModelValue(raw) {
  const v = raw == null ? '' : String(raw);
  if (v.trim() === '') {
    return { blocking: `valeur vide ou blanche — c'est le geste 'models unset', pas une valeur de modele.` };
  }
  if (/\s/.test(v)) {
    return { blocking: `espace invalide dans la valeur : "${v}" (espace interne, de tete/fin, ou retour a la ligne).` };
  }
  if (/^[#"'[{]/.test(v)) {
    return { blocking: `caractere de tete invalide (casserait le frontmatter rendu) : "${v}"` };
  }
  const known = KNOWN_MODEL_VALUES.has(v) || v.startsWith('claude-');
  return {
    ok: v,
    warning: known ? null : `valeur inhabituelle : ${v} — ecrite ; verifier qu'elle est acceptee par le runner.`,
  };
}

// --- Signalement de divergence (D8/CA-20/CA-25) : decision SANS projection ---------------------
// Cas NOMINAL de tout clone frais / machine reconstruite sous A-3 « ignorer » (la projection ne se
// versionne pas) : `iakaframe.json` porte la DECISION, `<projet>/.claude/agents/<id>.md` est
// absent (jamais lu, jamais ecrit ici). Rend, pour chaque surcharge SANS fichier projete :
// { personaId, decided, effective, expectedPath, repair } — actionnable SANS reflexion (D8) :
// quelle persona, quel modele DECIDE, quel modele EFFECTIF (celui reellement charge en l'absence
// de projection : le defaut de la frame, via le binding), et la commande qui repare. LECTURE
// SEULE — n'ecrit jamais rien (D8, meme doctrine que `vendor-check` / `agents generate --check`).
export function divergentOverrides(projectDir, { root } = {}) {
  if (!projectDir) return [];
  const proj = path.resolve(projectDir);
  const overrides = readModelOverrides(proj);
  const ids = Object.keys(overrides);
  if (!ids.length) return [];
  const lib = root || libraryRoot();
  const binding = loadDefaultBinding(lib);
  const out = [];
  for (const personaId of ids) {
    const file = path.join(proj, '.claude', 'agents', `${personaId}.md`);
    if (fs.existsSync(file)) continue;
    out.push({
      personaId,
      decided: overrides[personaId],
      effective: modelForPersona(binding, personaId) || null,
      expectedPath: file,
      repair: `iakaframe models set ${personaId} ${overrides[personaId]} --path ${proj}`,
    });
  }
  return out;
}

// --- Garde de forme du projet cible (4bis, A-3) : la projection est-elle ignoree ? -------------
// CONSTAT SEUL : jamais d'ecriture du `.gitignore` d'un projet qui n'est pas le sien (4bis). Ne
// tente pas d'emuler le moteur de patterns git : reconnait les formes usuelles qui couvrent
// `.claude/agents/` (chemin exact, ou un englobant `.claude/`), suffisant pour un SIGNALEMENT —
// un faux negatif n'est qu'un avertissement de plus, jamais une ecriture erronee.
export function projectionIsIgnored(projectDir) {
  const file = path.join(path.resolve(projectDir), '.gitignore');
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return false; }
  return raw.split(/\r?\n/).some((line) => {
    const s = line.trim();
    if (!s || s.startsWith('#')) return false;
    const norm = s.replace(/^\//, '').replace(/\/$/, '');
    return norm === '.claude/agents' || norm === '.claude' || s.includes('.claude/agents');
  });
}
