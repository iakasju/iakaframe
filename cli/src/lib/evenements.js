// Contrat machine « C-EVT » du verbe `install` (specs/instructions/
// contrat-machine-du-verbe-install.md, § 2/§ 4/§ 5 etape 2). Vocabulaire d'evenements FERME,
// fabrique d'emetteur, et impression NDJSON compacte — le SEUL point de sortie machine de
// `install`, distinct de la convention C-JSON (lib/output.js), qu'il REUTILISE pour le rendu
// bufferise `--json` (etape 6) plutot que d'en refaire une seconde forme.
//
// UN SEUL EMETTEUR, DEUX FACONS DE LE VIDER (§ 2 point 2) : en mode `events`, chaque evenement est
// imprime IMMEDIATEMENT en NDJSON sur stdout ; en mode `json`, les evenements sont ACCUMULES pour
// une impression UNIQUE a la fin (via lib/output.js, cf. install.js). En mode `humain` (defaut),
// AUCUN evenement n'est imprime : seule la prose (inchangee) sort.
//
// Zero dependance runtime (CA-1 herite). NDJSON compact (specification 1.0.0, § 0.5 de
// l'instruction) : `JSON.stringify(o)` SANS indentation, `+ '\n'`, jamais `printJson` (2-indente,
// reserve a C-JSON) — c'est pourquoi ce module vit dans `lib/`, jamais dans `commands/`, ou le
// verrou statique de `guard-json-output.test.js:30-39` rougirait a raison.
'use strict';

// --- Vocabulaire FERME (CA-M15) -------------------------------------------------------------
// Toute valeur `evt` emise doit appartenir a cet ensemble — compare A L'APPEL DE L'AUTORITE,
// jamais a une liste reecrite dans un test (idiome refus-loquaces.test.js:30-35).
export const EVENEMENTS = Object.freeze([
  'debut',
  'reservoir',
  'etape-annoncee',
  'demande-feu-vert',
  'feu-vert',
  'etape-terminee',
  'log-delegue',
  'garde-ar1',
  'rollback',
  'fin',
]);

// Vocabulaire ferme des `etat` possibles pour `etape-terminee` (§ 5 etape 2, table).
export const ETATS_ETAPE = Object.freeze(['faite', 'refusee', 'echouee', 'sautee', 'dry-run']);

// Vocabulaire ferme des `canal` possibles pour `feu-vert`.
export const CANAUX_FEU_VERT = Object.freeze(['yes', 'tty', 'stdin', 'refus-par-defaut']);

// --- NDJSON compact --------------------------------------------------------------------------
// Une ligne = un objet JSON compact + '\n' (specification NDJSON 1.0.0). Jamais indente : un
// evenement multi-lignes casserait tout parseur ligne-a-ligne (CA-M1).
export function ligneNdjson(obj) {
  return `${JSON.stringify(obj)}\n`;
}

// Construit un evenement complet : enveloppe commune (`evt`, `ts`, `etape`) + champs specifiques.
// Leve si `evt` est hors du vocabulaire ferme — c'est la garde de CA-M15, active a la SOURCE
// (jamais seulement verifiee a la sortie).
export function construireEvenement(evt, etape, champs = {}) {
  if (!EVENEMENTS.includes(evt)) {
    throw new Error(`evenements.js : evt hors du vocabulaire ferme : "${evt}"`);
  }
  return { evt, ts: new Date().toISOString(), etape: etape == null ? null : etape, ...champs };
}

// --- Fabrique d'emetteur (§ 2 point 2, § 4.1) ------------------------------------------------
// `mode` : 'humain' (defaut, comportement de production INCHANGE) | 'events' (NDJSON immediat sur
// stdout) | 'json' (accumulation, impression unique en fin de chaine par install.js via
// lib/output.js). `ecrire` est un point d'INJECTION de test (defaut : `process.stdout.write`),
// meme idiome que le reste du depot (M-9 : la couture de test, jamais un second chemin de
// production).
export function creerEmetteur({ mode = 'humain', ecrire = (s) => process.stdout.write(s) } = {}) {
  if (!['humain', 'events', 'json'].includes(mode)) {
    throw new Error(`evenements.js : mode d'emetteur inconnu : "${mode}"`);
  }
  const evenements = [];

  // Emet un evenement machine (jamais en mode humain). Rend l'evenement construit (utile aux
  // appelants qui ont besoin de le reutiliser, ex. demande-feu-vert -> feu-vert correlés).
  function emettre(evt, etape, champs) {
    const o = construireEvenement(evt, etape, champs);
    if (mode === 'events') ecrire(ligneNdjson(o));
    if (mode === 'json') evenements.push(o);
    return o;
  }

  // Le point de routage central (§ 2 point 2) : CHAQUE `console.log` de install.js devient un
  // appel `dire(prose, spec)`.
  //   - prose !== null : mode humain -> console.log(prose) INCHANGE ; mode machine -> AUCUNE
  //     prose imprimee (c'est la garantie de CA-M1 : rien d'humain ne pollue le flux machine).
  //   - prose === null : aucune ligne humaine n'existait a cet endroit (ex. un succes muet de
  //     l'etape 2, ou l'evenement `fin` qui n'a pas d'equivalent textuel) — mode humain ne fait
  //     RIEN (aucune prose nouvelle n'est introduite, CA-M8), mode machine emet quand meme.
  //   - spec : null (aucun evenement a cet endroit) ou { evt, etape, champs }.
  function dire(prose, spec) {
    if (mode === 'humain') {
      if (prose != null) console.log(prose);
      return undefined;
    }
    if (spec) return emettre(spec.evt, spec.etape, spec.champs || {});
    return undefined;
  }

  return { mode, dire, emettre, evenements };
}
