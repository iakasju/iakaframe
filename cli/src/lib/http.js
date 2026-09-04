// fetch avec timeout (AbortController) - portable, sans dependance.
export async function getJson(url, timeoutMs = 3000, headers = undefined) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (!res.ok) return { ok: false, status: res.status };
    let body = null;
    try { body = await res.json(); } catch { /* pas de JSON */ }
    return { ok: true, status: res.status, body };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(t);
  }
}

// Envoi JSON (POST/DELETE) avec timeout - meme contrat de retour que getJson.
// Ajoute pour `iakaframe models` : les gestes de mise a disposition (pull Ollama, declaration
// d'un modele a la passerelle) sont des ecritures, pas des lectures. Le corps de reponse peut
// etre du NDJSON de progression (Ollama /api/pull) : on ne le parse alors pas, `ok` suffit.
export async function sendJson(url, { method = 'POST', body = null, headers = {}, timeoutMs = 30000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === null ? undefined : JSON.stringify(body),
    });
    let parsed = null;
    const text = await res.text().catch(() => '');
    try { parsed = text ? JSON.parse(text) : null; } catch { /* NDJSON de progression */ }
    if (!res.ok) return { ok: false, status: res.status, body: parsed, text };
    return { ok: true, status: res.status, body: parsed, text };
  } catch {
    return { ok: false, status: 0, body: null, text: '' };
  } finally {
    clearTimeout(t);
  }
}

// Telechargement ANONYME d'octets bruts (aucun jeton, aucun en-tete d'autorisation) — ajoute pour
// le verbe `install`, etapes 3/4 (lot C.1) : un bundle d'app signe se telecharge, se verifie
// (minisign, cf. lib/minisign.js) puis se pose — jamais l'inverse. Meme contrat de retour que
// `getJson`/`sendJson` (`ok`/`status`), avec `octets` (Buffer) a la place de `body`.
export async function getBytes(url, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) return { ok: false, status: res.status, octets: null };
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, status: res.status, octets: buf };
  } catch {
    return { ok: false, status: 0, octets: null };
  } finally {
    clearTimeout(t);
  }
}
