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
//
// TIMEOUT PORTE A 180000ms (2026-09-05, lot ETAPES-3-4-WINDOWS-LINUX/W-L, mesure 0.2 de
// specs/instructions/etapes-3-4-windows-linux.md, R-W1) : l'ancien defaut (30000ms, herite du lot
// C.1 ou seul le `.app.tar.gz` — ~14 Mo — etait telecharge) COUPAIT la mesure REELLE de
// l'AppImage : `IakaCockpit_0.32.2_amd64.AppImage` (92 379 640 octets, asset reel de la release
// GitHub v0.32.2) telecharge en 51,9s sur ce poste (curl, 2026-09-05) et
// `iakaFrameGUI_0.1.8_amd64.AppImage` (83 753 464 octets) en 44,8s — TOUS DEUX au-dela des 30s.
// Le `.exe` NSIS (~12,7 Mo) et le `.app.tar.gz` (~14,8 Mo) restent tres en-deca (~5s) : ce timeout
// ne change RIEN pour macOS, il corrige un defaut qui n'affectait QUE l'unique appelant de
// `getBytes` (lib/app-bundle.js:`telechargerEtVerifier`) une fois Linux couvert.
export async function getBytes(url, timeoutMs = 180000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) return { ok: false, status: res.status, octets: null, expire: false };
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, status: res.status, octets: buf, expire: false };
  } catch (e) {
    // R-W1 : DISTINGUER l'avortement par timeout (AbortError) d'un autre echec reseau (DNS,
    // connexion refusee...) — le premier dit "le delai est trop court pour cet octet", le second
    // dit "le reseau ne repond pas" : deux reprises differentes pour l'humain qui lit `detail`.
    return { ok: false, status: 0, octets: null, expire: e && e.name === 'AbortError' };
  } finally {
    clearTimeout(t);
  }
}
