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

// --- Validation de FORME (D6, volet 1 — INCHANGE par l'Amendement A) --------------------------
// Rend { blocking: <raison> } si la valeur ne peut STRUCTURELLEMENT pas etre une valeur de modele
// (D6) : vide/blanche (c'est le geste `unset`, pas une valeur), tout espace (interne, de tete/fin,
// retour a la ligne), ou un caractere de tete qui casserait le frontmatter rendu (`#`, `"`, `'`,
// `[`, `{`). Cette garde ne connait AUCUN nom de modele : elle ne peut donc pas se perimer, et
// `--force` NE LA LEVE JAMAIS (D11, alternative (c) ecartee) — il n'y a rien a forcer, seulement
// un fichier a corrompre.

// ⏳ CONDITION DE CHUTE (L44, clause 3) — ce que cette grammaire a de faux, et quand.
// MESUREE le 2026-09-02 sur code.claude.com/docs/en/sub-agents (§ « Choose a model ») et
// code.claude.com/docs/en/model-config. Elle DEVIENT FAUSSE des que le runner accepte, dans le
// champ `model:` d'un sous-agent, une valeur qu'elle refuse — typiquement un ALIAS NEUF.
// SE RE-MESURE : rouvrir ces deux pages et comparer leur liste d'alias a ce Set. Le fichier ne
// se re-mesure PAS tout seul : cette date est celle de la mesure, pas de la derniere lecture.
// SYMPTOME de peremption : `models set <persona> <alias>` REFUSE alors que le runner l'accepte.
// REMEDE IMMEDIAT (utilisateur, zero release) : --force. REMEDE DURABLE : ajouter l'alias ici
// AVEC la date de sa mesure.
// DELIBEREMENT ABSENTS (refuses, atteignables par --force) : `best`, `default`, `opusplan` —
// documentes pour `--model`, PAS pour un sous-agent ; et `default`/`opusplan` ont une semantique
// etrangere a un contrat (effacer une surcharge = `models unset` ; basculer selon le mode plan).
//
// Grammaire D6bis (F6, 2026-09-02) :
//   valeur := ( alias | id-complet ) suffixe?
//   alias      := sonnet | opus | haiku | fable | inherit
//   id-complet := claude-<[A-Za-z0-9._-]+>
//   suffixe    := "[1m]"
const KNOWN_ALIASES = new Set(['sonnet', 'opus', 'haiku', 'fable', 'inherit']);
// Ids complets MESURES (F6, meme date) : ceux-la n'emettent PAS l'avertissement D13, les autres
// claude-<id> (bien formes mais NON mesures) si. Le catalogue des ids bouge plus vite que celui
// des alias et n'est pas verifiable hors ligne (D13) — cet ensemble n'est donc PAS une allowlist
// bloquante (aucun claude-<id> bien forme n'est jamais refuse), seulement le seuil du silence.
const KNOWN_FULL_IDS = new Set(['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5', 'claude-fable-5-1', 'claude-haiku-4-5']);
const SUFFIX = '[1m]';
const ID_COMPLET_RE = /^claude-[A-Za-z0-9._-]+$/;

function stripSuffix(v) {
  return v.endsWith(SUFFIX) ? v.slice(0, -SUFFIX.length) : v;
}

// Rend { blocking: <raison> } (strate 1, forme — inchangee), { unknown: <v> } (strate 2,
// vocabulaire — REFUS depuis l'Amendement A, levable par `--force`, D6bis/D11), ou
// { ok: <v>, warning: <message|null> } (strates 1/3 de la grammaire — ECRITE ; `warning` porte le
// residu D13 : silence pour un alias ou un id complet MESURE, avertissement pour un id complet
// bien forme mais non mesure — jamais pour un refus). Trois retours distincts, pas un booleen
// surcharge.
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
  const base = stripSuffix(v);
  if (KNOWN_ALIASES.has(base)) {
    return { ok: v, warning: null };
  }
  if (ID_COMPLET_RE.test(base)) {
    return {
      ok: v,
      warning: KNOWN_FULL_IDS.has(base) ? null
        : `id complet non verifiable hors ligne : ${v} — ecrite ; verifier qu'elle est acceptee par le runner.`,
    };
  }
  return { unknown: v };
}

// Vocabulaire ACCEPTE (D15), pour le message de refus et la sortie --json — SOURCE UNIQUE, jamais
// recopie a la main dans un message.
export const ACCEPTED_VOCABULARY = ['sonnet', 'opus', 'haiku', 'fable', 'inherit', 'claude-<id>', '<valeur>[1m]'];

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

// --- Signalement de valeur hors grammaire (D14, Amendement A) : rETROCOMPATIBILITE en LECTURE --
// FRERE EXACT de `divergentOverrides` (D8) : meme forme, meme doctrine LECTURE SEULE — jamais
// d'ecriture, jamais de refus, jamais de repli silencieux sur le defaut de frame (ce serait le
// PIRE des trois options : la projection sur le disque PORTE la valeur et c'est ELLE que le
// runner charge, F1 — l'ignorer ferait MENTIR `models`). Un `iakaframe.json` deja ecrit peut
// porter une valeur devenue hors grammaire (recette du lot 2, ou edition a la main d'un autre
// poste) : ce cas est le cas qui MORD EN PREMIER, pas une bizarrerie. Rend, pour chaque surcharge
// dont la valeur est REFUSEE par `validateModelValue` (strate 2 ou 1, jamais pour une valeur
// valide) : { personaId, model, repair } — la commande a rejouer nomme les DEUX gestes qui
// reparent (reecrire avec la valeur juste, ou retirer la surcharge).
export function unknownOverrides(projectDir) {
  if (!projectDir) return [];
  const proj = path.resolve(projectDir);
  const overrides = readModelOverrides(proj);
  const out = [];
  for (const personaId of Object.keys(overrides)) {
    const model = overrides[personaId];
    const v = validateModelValue(model);
    if (v.ok !== undefined) continue; // valide (silencieuse ou avertie) -> rien a signaler ici
    out.push({
      personaId,
      model,
      repair: `iakaframe models set ${personaId} <valeur-juste> --path ${proj}  ou  `
        + `iakaframe models unset ${personaId} --path ${proj}`,
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
