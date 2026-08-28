// Lecture redondante : le FAILOVER des endpoints d'auto-update (lot 0, 0.b — CA-11).
//
// CE QUE LE MORCEAU RESOUT. Le fan-out (0.a) rend l'ECRITURE redondante ; il ne dit rien de la
// LECTURE. Cote lecture, une app interroge une LISTE ORDONNEE d'endpoints et prend le premier qui
// repond. Tant que cette liste n'est verifiee que par lecture de configuration, la redondance est
// DECLAREE, pas mesuree — exactement le piege R7 : trois URL alignees font croire a trois canaux
// alors qu'un seul est resolvable. Le 2026-08-28, le Cockpit avait son premier endpoint vivant et
// ses DEUX replis rendaient 404 et 000 : la liste avait l'air redondante et ne l'etait pas.
//
// D'OU LES DEUX GESTES ICI, ET LEUR SEPARATION :
//   - `resoudre()`  applique le CONTRAT de l'updater — essayer dans l'ordre, s'arreter au premier
//     qui rend un manifeste EXPLOITABLE — et rend la trace de chaque essai.
//   - `sonderTous()` mesure TOUTE la liste, pour dire combien de canaux repondent reellement.
//
// UN 200 NE SUFFIT PAS. Une forge dont le depot est prive rend volontiers 200 + une page de
// connexion en HTML : l'octet arrive, la mise a jour non. On n'accepte donc un endpoint que s'il
// rend un manifeste au CONTRAT (`version` + `platforms`), jamais sur le seul code HTTP.
//
// GARDE D'HONNETETE (§ 9) : tout etat rendu porte la DATE de sa mesure. Ce module ne lit aucun
// cache et ne devine rien — il ouvre la connexion, ou il dit qu'il n'a pas pu.
import fs from 'node:fs';
import { getJson } from './http.js';

/** Delai par endpoint. Court : un canal de secours qui met 30 s ne secourt personne. */
export const DELAI_DEFAUT_S = 8;

/**
 * Endpoints declares par une app Tauri (`plugins.updater.endpoints`), dans l'ORDRE.
 * L'ordre est la substance meme du failover : on ne le trie pas, on ne le dedoublonne pas.
 */
export function lireEndpoints(confPath) {
  const conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));
  const eps = conf?.plugins?.updater?.endpoints;
  if (!Array.isArray(eps)) return [];
  return eps.filter((u) => typeof u === 'string' && u.length > 0);
}

/** Hote d'une URL, ou l'URL brute si elle est illisible (on ne jette pas pour un affichage). */
export function hoteDe(url) {
  try { return new URL(url).host; } catch { return String(url); }
}

/**
 * Un manifeste d'updater EXPLOITABLE : une version et au moins une plateforme portant une URL.
 * C'est ce contrat — pas le code HTTP — qui separe « le canal repond » de « le canal sert ».
 */
export function manifesteValide(body) {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.version !== 'string' || !body.version) return false;
  const plats = body.platforms;
  if (!plats || typeof plats !== 'object') return false;
  const vals = Object.values(plats);
  return vals.length > 0 && vals.every((p) => p && typeof p.url === 'string' && p.url.length > 0);
}

/**
 * Classe ce qu'un endpoint a rendu. Les motifs ne se confondent jamais : une machine eteinte
 * (`injoignable`) et un depot prive (`absent` / `refus`) appellent des remedes opposes, et c'est
 * precisement la confusion des deux qui a fait declarer « le manifeste sera trouve » sans mesure.
 */
export function classer(status, body) {
  if (status === 0) return 'injoignable';
  if (status === 404) return 'absent';
  if (status === 401 || status === 403) return 'refus';
  if (status >= 400) return `erreur-http-${status}`;
  return manifesteValide(body) ? 'ok' : 'manifeste-illisible';
}

/** Mesure UN endpoint. Aucune exception ne remonte : un echec est un etat, pas un incident. */
export async function sonder(url, { timeoutMs = DELAI_DEFAUT_S * 1000 } = {}) {
  const t0 = Date.now();
  const r = await getJson(url, timeoutMs);
  const motif = classer(r.status, r.body);
  return {
    url,
    hote: hoteDe(url),
    status: r.status,
    ok: motif === 'ok',
    motif,
    ms: Date.now() - t0,
    manifeste: motif === 'ok' ? r.body : null,
  };
}

/**
 * LE CONTRAT DE FAILOVER (CA-11) : essayer dans l'ordre, retenir le PREMIER qui sert, et dire
 * lesquels ont ete essayes avant lui. Sans cette trace, un failover reussi est indiscernable
 * d'un premier endpoint qui marche — et on ne saurait toujours pas si la redondance existe.
 */
export async function resoudre(endpoints, { timeoutMs = DELAI_DEFAUT_S * 1000, tout = false } = {}) {
  const essais = [];
  let retenu = null;
  for (const url of endpoints) {
    const e = await sonder(url, { timeoutMs });
    essais.push(e);
    if (e.ok && !retenu) {
      retenu = e;
      if (!tout) break; // le contrat de l'updater : le premier qui repond gagne.
    }
  }
  return {
    retenu,
    manifeste: retenu ? retenu.manifeste : null,
    essais,
    // Toute la liste a-t-elle ete mesuree ? Sans ce drapeau, une recherche arretee au premier
    // succes se lirait comme « un seul canal sert » — un verdict de redondance rendu sur des
    // endpoints jamais interroges serait exactement le defaut qu'on repare.
    complet: essais.length === endpoints.length,
    mesureLe: new Date().toISOString(),
  };
}

/** Mesure TOUTE la liste (etat complet du canal de lecture), sans s'arreter au premier succes. */
export async function sonderTous(endpoints, opts = {}) {
  return resoudre(endpoints, { ...opts, tout: true });
}

/**
 * Verdict de REDONDANCE : combien de canaux servent reellement. Deux, c'est le minimum pour que
 * « le premier est mort » ait une suite ; un seul, c'est une liste qui reessaie la panne.
 */
export function verdictRedondance(essais) {
  const servent = essais.filter((e) => e.ok).map((e) => e.hote);
  const distincts = [...new Set(servent)];
  return {
    servent: distincts,
    nb: distincts.length,
    redondant: distincts.length >= 2,
    muets: essais.filter((e) => !e.ok).map((e) => ({ hote: e.hote, motif: e.motif })),
  };
}

const MARQUE = { ok: '[OK]', injoignable: '[--]', absent: '[404]', refus: '[401]' };

/** Rendu humain. Il NOMME chaque cible, son motif, et porte la date de la mesure (§ 9). */
export function formater(res, titre = '') {
  const v = verdictRedondance(res.essais);
  const l = [];
  if (titre) l.push(`\n=== iakaframe endpoints : ${titre} ===`);
  l.push(`mesure EN DIRECT le ${res.mesureLe}`);
  for (const e of res.essais) {
    l.push(`  ${(MARQUE[e.motif] || '[!!]').padEnd(5)} ${e.hote.padEnd(28)} ${e.motif} (${e.status || 'pas de reponse'}, ${e.ms} ms)`);
  }
  l.push(res.retenu
    ? `\nRETENU : ${res.retenu.hote} — manifeste v${res.retenu.manifeste.version}`
    : `\nRETENU : AUCUN — aucun endpoint ne sert de manifeste exploitable.`);
  if (res.complet === false) {
    // On ne rend PAS de verdict de redondance sur une liste qu'on n'a pas fini de mesurer.
    l.push(`REDONDANCE : non mesuree — la recherche s est arretee au premier canal qui sert.`);
  } else {
    l.push(v.redondant
      ? `REDONDANCE : ${v.nb} canaux servent (${v.servent.join(', ')}) — le premier peut mourir.`
      : `REDONDANCE : ${v.nb} canal sert${v.nb ? ` (${v.servent.join(', ')})` : ''} — CA-11 NON tenu : rien sur quoi basculer.`);
  }
  return l;
}
