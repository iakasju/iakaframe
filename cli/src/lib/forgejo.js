// Acces Forgejo - API v1, auth HTTP+token. Token jamais en dur (FORGEJO_TOKEN).
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from './root.js';

// Defaut de DERNIER recours seulement : l'adresse vit dans <chapeau>/.env, lu par
// fromEnvFile ci-dessous. La forge a deja demenage une fois (iakabox 192.168.2.11 -> NAS,
// 2026-08-19) et l'ancienne box ne repond plus du tout (sonde du 2026-08-25) — d'ou
// l'importance que ce defaut ne soit qu'un filet, jamais la source. Tant qu'il pointait la
// box morte, il ne mordait QUE hors variable d'environnement : donc precisement dans les
// contextes non interactifs (script, hook, cron, CI, agent), la ou l'echec est le plus
// difficile a voir.
const DEF_URL = 'http://192.168.1.139:3001';
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

// Token : env shell s'il est valide, sinon source unique <chapeau>/.env (FORGEJO_TOKEN=...).
export function token() {
  const envv = process.env.FORGEJO_TOKEN;
  if (!isBadToken(envv)) return envv;
  const fileTok = fromEnvFile('FORGEJO_TOKEN');
  if (!isBadToken(fileTok)) return fileTok;
  return '';
}
// URL : env shell, sinon <chapeau>/.env, sinon defaut. SYMETRIQUE de token() —
// c'est l'asymetrie inverse (token replie sur fichier, URL non) qui faisait viser
// l'ancienne box a tout contexte non interactif.
export function cfg(opts = {}) {
  return {
    url: opts.url || process.env.FORGEJO_URL || fromEnvFile('FORGEJO_URL') || DEF_URL,
    user: opts.user || process.env.FORGEJO_USER || fromEnvFile('FORGEJO_USER') || DEF_USER,
  };
}

// true (existe) | false (404) | null (inconnu : pas de token / reseau)
export async function testRepo(repo, opts = {}) {
  const t = token(); if (!t) return null;
  const { url, user } = cfg(opts);
  try {
    const r = await fetch(`${url}/api/v1/repos/${user}/${repo}`, { headers: { Authorization: `token ${t}` } });
    if (r.ok) return true;
    if (r.status === 404) return false;
    return null;
  } catch { return null; }
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
