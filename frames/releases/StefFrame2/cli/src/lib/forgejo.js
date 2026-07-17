// Acces a un serveur git self-hosted (API type Forgejo/Gitea) - auth HTTP+token. Token jamais en dur (FORGEJO_TOKEN).
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from './root.js';

const DEF_URL = ""; // env-only : FORGEJO_URL (aucun defaut LAN)
const DEF_USER = ""; // env-only : FORGEJO_USER

// Un placeholder de template est traite comme absent.
const isBadToken = v => !v || /LE_NOUVEAU_TOKEN_ICI|COLLE_/i.test(v);

// Token : env shell s'il est valide, sinon source unique <chapeau>/.env (FORGEJO_TOKEN=...).
export function token() {
  const envv = process.env.FORGEJO_TOKEN;
  if (!isBadToken(envv)) return envv;
  try {
    const txt = fs.readFileSync(path.join(resolveRoot(), '.env'), 'utf8');
    const m = txt.match(/^\s*FORGEJO_TOKEN\s*=\s*(.+?)\s*$/m);
    if (m && !isBadToken(m[1])) return m[1].replace(/^["']|["']$/g, '');
  } catch {}
  return '';
}
export function cfg(opts = {}) {
  return {
    url: opts.url || process.env.FORGEJO_URL || DEF_URL,
    user: opts.user || process.env.FORGEJO_USER || DEF_USER,
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

// URL remote avec token integre (pattern self-hosted), token jamais affiche.
export function remoteUrl(repo, opts = {}) {
  const t = token();
  const { url, user } = cfg(opts);
  const base = url.replace(/^https?:\/\//, '');
  return `http://${user}:${t}@${base}/${user}/${repo}.git`;
}
