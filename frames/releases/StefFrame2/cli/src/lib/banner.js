// Moteur FIGfont minimal, JS pur, ZERO dependance runtime.
// Rend un texte en titre ASCII a partir d'une police .flf embarquee (src/lib/figfont/).
// Supporte : pleine largeur, kerning (fitting), smushing controle (regles 1-6).
// Police par defaut : ANSI Shadow (configurable via iakaframe.json -> bannerFont).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'figfont');
export const DEFAULT_FONT = 'ANSI Shadow';
export const FALLBACK_FONT = 'Standard'; // ASCII pur : repli si police inconnue / terminal non-UTF8

const cache = new Map();

// Hierarchie pour la regle de smushing 3 (classe : la plus haute l'emporte).
const HIERARCHY = { '|': 1, '/': 2, '\\': 2, '[': 3, ']': 3, '{': 4, '}': 4, '(': 5, ')': 5, '<': 6, '>': 6 };
const RULE2_SET = '|/\\[]{}()<>';

function fontFile(name) {
  const base = String(name).trim().toLowerCase().replace(/\s+/g, '_');
  for (const cand of [base, String(name).trim()]) {
    const p = path.join(FONT_DIR, `${cand}.flf`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseFont(name) {
  if (cache.has(name)) return cache.get(name);
  const file = fontFile(name);
  if (!file) throw new Error(`police introuvable : ${name}`);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  const header = lines[0].split(/\s+/);
  const hardBlank = header[0].slice(-1);
  const height = +header[1];
  const oldLayout = +header[4];
  const commentLines = +header[5];
  const fullLayout = header[7] !== undefined ? +header[7] : null;

  // Mode de mise en page.
  let mode = 'full'; // full | kern | smush
  let rules = 0;
  if (fullLayout !== null) {
    if (fullLayout & 128) { mode = 'smush'; rules = fullLayout & 63; }
    else if (fullLayout & 64) mode = 'kern';
    else mode = 'full';
  } else if (oldLayout < 0) mode = 'full';
  else if (oldLayout === 0) mode = 'kern';
  else { mode = 'smush'; rules = oldLayout & 63; }

  // Lecture des glyphes ASCII 32..126.
  const chars = {};
  let idx = 1 + commentLines;
  for (let code = 32; code <= 126; code++) {
    const glyph = [];
    for (let r = 0; r < height; r++) {
      let line = lines[idx++];
      if (line === undefined) { line = ''; }
      // Retrait des endmarks (1 par ligne, 2 sur la derniere) : le dernier caractere est la marque.
      const mark = line.charAt(line.length - 1);
      if (mark) { let e = line.length; while (e > 0 && line[e - 1] === mark) e--; line = line.slice(0, e); }
      glyph.push(line);
    }
    // Normalise la largeur du glyphe (lignes a la meme longueur).
    const w = Math.max(...glyph.map(l => l.length));
    chars[code] = glyph.map(l => l + ' '.repeat(w - l.length));
  }

  const font = { height, hardBlank, mode, rules, chars };
  cache.set(name, font);
  return font;
}

function smushChar(lc, rc, font) {
  if (lc === ' ') return rc;
  if (rc === ' ') return lc;
  const hb = font.hardBlank;
  if (lc === hb || rc === hb) {
    if (lc === hb && rc === hb && (font.rules & 32)) return hb; // regle 6
    return null;
  }
  if (font.mode !== 'smush') return null; // kerning : pas de fusion de deux non-espaces
  if (font.rules === 0) return rc; // smushing universel : le caractere de droite l'emporte
  if ((font.rules & 1) && lc === rc) return lc;                 // 1 : caractere egal
  if (font.rules & 2) {                                          // 2 : underscore
    if (lc === '_' && RULE2_SET.includes(rc)) return rc;
    if (rc === '_' && RULE2_SET.includes(lc)) return lc;
  }
  if (font.rules & 4) {                                          // 3 : hierarchie
    const a = HIERARCHY[lc], b = HIERARCHY[rc];
    if (a && b && a !== b) return a > b ? lc : rc;
  }
  if (font.rules & 8) {                                          // 4 : paire opposee
    const s = lc + rc;
    if (s === '[]' || s === '][' || s === '{}' || s === '}{' || s === '()' || s === ')(') return '|';
  }
  if (font.rules & 16) {                                         // 5 : grand X
    if (lc + rc === '/\\') return '|';
    if (lc + rc === '\\/') return 'Y';
    if (lc + rc === '><') return 'X';
  }
  return null;
}

function trailingSpaces(s) { let n = 0; for (let i = s.length - 1; i >= 0 && s[i] === ' '; i--) n++; return n; }
function leadingSpaces(s) { let n = 0; for (let i = 0; i < s.length && s[i] === ' '; i++) n++; return n; }

function overlapAmount(cur, glyph, font) {
  if (font.mode === 'full') return 0;
  let overlap = Infinity;
  for (let i = 0; i < font.height; i++) {
    const left = cur[i], right = glyph[i];
    let amt = trailingSpaces(left) + leadingSpaces(right);
    if (font.mode === 'smush') {
      const lc = left[left.length - 1 - trailingSpaces(left)];
      const rc = right[leadingSpaces(right)];
      if (lc !== undefined && rc !== undefined && smushChar(lc, rc, font) !== null) amt += 1;
    }
    overlap = Math.min(overlap, amt);
  }
  const cap = Math.min(cur[0].length, glyph[0].length);
  return Math.max(0, Math.min(overlap, cap));
}

function append(cur, glyph, font) {
  if (!cur) return glyph.slice();
  const overlap = overlapAmount(cur, glyph, font);
  const out = [];
  for (let i = 0; i < font.height; i++) {
    const left = cur[i], right = glyph[i];
    const leftPart = left.slice(0, left.length - overlap);
    let mid = '';
    for (let k = 0; k < overlap; k++) {
      const ch = smushChar(left[left.length - overlap + k], right[k], font);
      mid += ch === null ? right[k] : ch; // null ne devrait pas survenir (overlap valide)
    }
    out.push(leftPart + mid + right.slice(overlap));
  }
  return out;
}

// Rend `text` dans la police `name`. Lance une erreur si la police est introuvable.
export function renderText(text, name = DEFAULT_FONT) {
  const font = parseFont(name);
  let cur = null;
  for (const c of String(text)) {
    const code = c.codePointAt(0);
    const glyph = font.chars[code] || font.chars[32];
    cur = append(cur, glyph, font);
  }
  if (!cur) cur = Array(font.height).fill('');
  // figlet left-justifie : retire l'espace de tete commun a toutes les lignes.
  const minLead = Math.min(...cur.map(leadingSpaces));
  if (minLead > 0) cur = cur.map(l => l.slice(minLead));
  const hb = font.hardBlank;
  return cur.map(l => l.split(hb).join(' ')).join('\n');
}

// Rend avec repli sur Standard (ASCII) si la police demandee echoue, puis texte brut en dernier recours.
export function renderBanner(text, name = DEFAULT_FONT) {
  try { return renderText(text, name); }
  catch {
    try { if (name !== FALLBACK_FONT) return renderText(text, FALLBACK_FONT); } catch { /* ignore */ }
    return String(text);
  }
}

// Affiche le banner (avec garde-fou : ne bloque jamais l'appelant).
export function printBanner(text, name = DEFAULT_FONT) {
  try { console.log(renderBanner(text, name)); } catch { console.log(String(text)); }
}
