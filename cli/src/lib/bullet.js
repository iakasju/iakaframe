// Primitive commune « puce datée » idempotente (source-unique, ZERO dependance). Factorisee depuis
// lib/memory.js (canon review-gate) pour etre partagee avec lib/observation.js (store silencieux
// non-gate). Une entree = `- YYYY-MM-DD — <contenu>`. L'appariement idempotent porte sur le
// <contenu> : le prefixe date est ignore. Les deux stores restent PHYSIQUEMENT distincts ; seule
// cette mecanique bas niveau est mutualisee (aucun couplage aux reservoirs/consentement).

// Date du jour au format YYYY-MM-DD (injection de `now` pour les tests).
export function today(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

// Vrai si la ligne est une puce (`- ...`).
export function isEntryLine(line) { return /^\s*-\s/.test(line); }

// Extrait le <contenu> d'une ligne de puce (strippe `- ` puis un prefixe date `YYYY-MM-DD — `).
export function entryContent(line) {
  const body = line.replace(/^\s*-\s?/, '');
  const m = body.match(/^\d{4}-\d{2}-\d{2}\s+—\s+([\s\S]*)$/);
  return (m ? m[1] : body).trim();
}

// Formate une puce datee pour un contenu donne.
export function formatBullet(content, now = new Date()) {
  return `- ${today(now)} — ${String(content).trim()}`;
}

// Ajoute une puce datee si le <contenu> n'existe pas deja (IDEMPOTENT). Retourne { lines, changed }.
export function appendBullet(lines, content, now = new Date()) {
  const text = String(content).trim();
  if (lines.some((l) => isEntryLine(l) && entryContent(l) === text)) return { lines, changed: false };
  return { lines: [...lines, formatBullet(text, now)], changed: true };
}

// Mesure agnostique du plafond : en CARACTERES (approx tokens ≈ chars/4).
export function measure(content) { return content.length; }

// Serialise des lignes avec un UNIQUE saut de ligne final.
export function serializeLines(lines) { return lines.join('\n').replace(/\n+$/, '') + '\n'; }
