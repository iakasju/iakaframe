// Acces Forgejo - API v1, auth HTTP+token. Token jamais en dur (FORGEJO_TOKEN).
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from './root.js';

// CANAUX ORDONNES, et non plus UNE adresse (lot 0 « trois canaux synchrones », 0.a).
//
// POURQUOI CE N'EST PLUS UNE CONSTANTE UNIQUE. Tant que la lib portait `DEF_URL`, toute la
// chaine etait mono-cible par construction : une forge injoignable = un CLI aveugle, sans
// qu'aucune sortie ne le dise (fait A3 de l'instruction). La liste rend la BASCULE possible
// et, surtout, rend DICIBLE quel canal a repondu (calque d'AR-2 : une source silencieuse est
// une source qui derive).
//
// Ces valeurs restent un filet de DERNIER recours : l'adresse vit dans <chapeau>/.env
// (`FORGEJO_URL`), lu par fromEnvFile ci-dessous. Ordre = le plus disponible en tete.
// La forge a deja demenage une fois (iakabox 192.168.2.11 -> NAS, 2026-08-19) ; l'ancienne
// box ne repond plus (sonde du 2026-08-25) — elle reste en SECOURS, jamais en tete.
const DEF_URLS = ['http://192.168.1.139:3001', 'http://192.168.2.11:3001'];
const DEF_USER = 'sjupin';

// Un placeholder de template est traite comme absent.
const isBadToken = v => !v || /LE_NOUVEAU_TOKEN_ICI|COLLE_/i.test(v);

// Lit une cle de la source unique <chapeau>/.env. '' si absente ou illisible.
function fromEnvFile(key) {
  try {
    const txt = fs.readFileSync(path.join(resolveRoot(), '.env'), 'utf8');
    const m = txt.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`, 'm'));
    if (m) return m[1].replace(/^["']|["']$/g, '');
  } catch {}
  return '';
}

// Decoupe une valeur MULTI-CANAUX. Convention CSV, deja celle de `IAKAFRAME_HOSTS`
// (commands/services.js) — on n'invente pas une seconde grammaire de liste.
// RETRO-COMPATIBILITE STRICTE : une valeur mono-valeur rend une liste d'un element, donc un
// `FORGEJO_URL` unique dans <chapeau>/.env continue de se comporter a l'identique.
export function splitCanaux(raw) {
  if (typeof raw !== 'string') return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// Prend la i-eme valeur d'une liste ; a defaut, la DERNIERE. Consequence voulue : une valeur
// unique (un seul token, un seul utilisateur) s'applique a TOUS les canaux.
function pick(list, i) {
  if (!list.length) return '';
  return i < list.length ? list[i] : list[list.length - 1];
}

// Resout la liste ordonnee des valeurs d'une cle : option explicite, sinon env shell, sinon
// <chapeau>/.env, sinon defaut. Meme cascade qu'avant, appliquee a une LISTE.
function resoudre(optVal, envKey, defauts) {
  const fromOpt = splitCanaux(optVal);
  if (fromOpt.length) return fromOpt;
  const fromEnv = splitCanaux(process.env[envKey]);
  if (fromEnv.length) return fromEnv;
  const fromFile = splitCanaux(fromEnvFile(envKey));
  if (fromFile.length) return fromFile;
  return defauts.slice();
}

// Token : env shell s'il est valide, sinon source unique <chapeau>/.env (FORGEJO_TOKEN=...).
// Rend le token du canal PRIMAIRE — signature et semantique inchangees.
export function token() { return tokenFor(0); }

// Token du i-eme canal. `FORGEJO_TOKEN` accepte lui aussi la forme CSV (un token par canal,
// aligne sur l'ordre des URL) ; un token unique vaut pour tous les canaux (cf. pick()).
export function tokenFor(i = 0) {
  const envList = splitCanaux(process.env.FORGEJO_TOKEN);
  const v = pick(envList, i);
  if (!isBadToken(v)) return v;
  const fileList = splitCanaux(fromEnvFile('FORGEJO_TOKEN'));
  const f = pick(fileList, i);
  if (!isBadToken(f)) return f;
  return '';
}

// Liste ORDONNEE des canaux : [{ index, url, user, token }]. C'est la forme complete ;
// `cfg()` n'en rend que le premier.
export function cfgList(opts = {}) {
  const urls = resoudre(opts.url, 'FORGEJO_URL', DEF_URLS);
  const users = resoudre(opts.user, 'FORGEJO_USER', [DEF_USER]);
  return urls.map((url, i) => ({ index: i, url, user: pick(users, i), token: tokenFor(i) }));
}

// URL : env shell, sinon <chapeau>/.env, sinon defaut. SYMETRIQUE de token() —
// c'est l'asymetrie inverse (token replie sur fichier, URL non) qui faisait viser
// l'ancienne box a tout contexte non interactif.
// Rend le canal PRIMAIRE : forme historique { url, user }, intacte pour tous les appelants.
export function cfg(opts = {}) {
  const [primaire] = cfgList(opts);
  return { url: primaire.url, user: primaire.user };
}

// Interroge UN canal. true (existe) | false (404) | null (inconnu : pas de token / reseau).
async function testRepoCanal(repo, canal) {
  if (!canal.token) return null;
  try {
    const r = await fetch(`${canal.url}/api/v1/repos/${canal.user}/${repo}`,
      { headers: { Authorization: `token ${canal.token}` } });
    if (r.ok) return true;
    if (r.status === 404) return false;
    return null;
  } catch { return null; }
}

// Etat du depot AVEC le canal qui a repondu : { state, canal, essayes:[{url, state}] }.
// Bascule de LECTURE : on essaie les canaux dans l'ordre et on retient la PREMIERE reponse
// franche (true/false) ; un canal muet (null) n'arrete pas la recherche, il est enregistre.
// `canal` est null quand aucun n'a repondu — on ne devine jamais un etat.
export async function testRepoDetail(repo, opts = {}) {
  const canaux = cfgList(opts);
  const essayes = [];
  for (const c of canaux) {
    const state = await testRepoCanal(repo, c);
    essayes.push({ url: c.url, state });
    if (state !== null) return { state, canal: c, essayes };
  }
  return { state: null, canal: null, essayes };
}

// true (existe) | false (404) | null (inconnu : pas de token / reseau)
// Signature historique conservee : avec UN canal, comportement strictement identique.
export async function testRepo(repo, opts = {}) {
  return (await testRepoDetail(repo, opts)).state;
}

// 'created' | 'exists' (409) ; throw sinon
export async function createRepo(repo, description, isPrivate, opts = {}) {
  const t = token(); if (!t) throw new Error('FORGEJO_TOKEN absent (Forgejo > Parametres > Applications).');
  const { url } = cfg(opts);
  let desc = description || '';
  if (/[^\x00-\x7F]/.test(desc)) desc = desc.replace(/[^\x00-\x7F]/g, ' ').trim(); // ASCII only (API 422 sinon)
  const res = await fetch(`${url}/api/v1/user/repos`, {
    method: 'POST',
    headers: { Authorization: `token ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: repo, private: isPrivate !== false, auto_init: false, description: desc }),
  });
  if (res.ok) return 'created';
  if (res.status === 409) return 'exists';
  throw new Error(`Forgejo API ${res.status}`);
}

// URL remote avec token integre (pattern iakabox), token jamais affiche.
export function remoteUrl(repo, opts = {}) {
  const t = token();
  const { url, user } = cfg(opts);
  const base = url.replace(/^https?:\/\//, '');
  return `http://${user}:${t}@${base}/${user}/${repo}.git`;
}
