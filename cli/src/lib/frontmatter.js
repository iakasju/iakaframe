// Mini-parseur de frontmatter MAISON, zero dependance runtime (Node n'embarque aucun parseur
// YAML natif ; ajouter js-yaml/yaml/gray-matter violerait la contrainte zero-dep du CLI, cf.
// instruction cli-bibliotheque-verbes.md §4.3 / §10). On couvre le SOUS-ENSEMBLE reellement
// present dans la bibliotheque (constate sur les fichiers reels), pas YAML complet :
//   1) delimiteurs `---` ... `---` en tete ; corps rendu tel quel ;
//   2) scalaires `cle: valeur` (quotes " ou ', emoji, booleens, entiers) ;
//   3) listes flow `cle: [a, b, c]` pouvant s'etendre sur plusieurs lignes ;
//   4) sequences de blocs `- { k: v, ... }` (maps inline) ou `- "scalaire"`.
// Tolerant : ignore ce qu'il ne sait pas lire sans planter (les champs requis sont valides en
// aval par `add`). La couverture reelle est verrouillee par test/frontmatter.test.js.

// Coupe `str` sur `sep` au NIVEAU SUPERIEUR uniquement (respecte quotes " ' et paires []{}).
function splitTopLevel(str, sep = ',') {
  const out = [];
  let buf = '';
  let depth = 0;
  let quote = null;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (quote) {
      buf += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === '[' || c === '{') { depth++; buf += c; continue; }
    if (c === ']' || c === '}') { depth--; buf += c; continue; }
    if (c === sep && depth === 0) { out.push(buf); buf = ''; continue; }
    buf += c;
  }
  if (buf.trim() !== '' || out.length) out.push(buf);
  return out;
}

// Coerce un scalaire brut (chaine) en valeur JS : quotes strippees -> string ; true/false/null ;
// entier -> Number ; sinon string trimmee (emoji, ids, phrases non quotees conservees telles).
function parseScalar(raw) {
  const s = String(raw).trim();
  if (s === '') return '';
  if ((s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
      (s.startsWith("'") && s.endsWith("'") && s.length >= 2)) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}

// Parse une liste flow `[a, b, "c, d"]` (contenu SANS les crochets externes) -> tableau de scalaires.
function parseFlowList(inner) {
  const body = inner.trim();
  if (body === '') return [];
  return splitTopLevel(body).map(parseScalar);
}

// Parse une map inline `{ k: v, k2: [a,b], k3: "x" }` (contenu AVEC accolades) -> objet.
function parseInlineMap(text) {
  const t = text.trim().replace(/^\{/, '').replace(/\}$/, '');
  const obj = {};
  for (const pair of splitTopLevel(t)) {
    const seg = pair.trim();
    if (!seg) continue;
    const idx = seg.indexOf(':');
    if (idx < 0) continue;
    const k = seg.slice(0, idx).trim();
    const v = seg.slice(idx + 1).trim();
    obj[k] = parseValue(v);
  }
  return obj;
}

// Parse une valeur inline (apres `cle:`), deja mono-ligne (crochets/accolades equilibres).
function parseValue(v) {
  const s = v.trim();
  if (s.startsWith('[') && s.endsWith(']')) return parseFlowList(s.slice(1, -1));
  if (s.startsWith('{') && s.endsWith('}')) return parseInlineMap(s);
  return parseScalar(s);
}

const KEY_RE = /^(\s*)([A-Za-z0-9_.-]+):\s?(.*)$/;

// Extrait le bloc frontmatter en tete. Retourne { raw, body } ou null si absent.
function splitDocument(text) {
  const norm = String(text).replace(/^﻿/, '');
  const lines = norm.split(/\r?\n/);
  if (lines[0] !== '---') return { raw: null, body: norm };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---' || lines[i] === '...') { end = i; break; }
  }
  if (end < 0) return { raw: null, body: norm };
  return {
    raw: lines.slice(1, end).join('\n'),
    body: lines.slice(end + 1).join('\n').replace(/^\n+/, ''),
  };
}

const indentOf = (l) => (l.match(/^(\s*)/)[1] || '').length;

// Parse le corps du frontmatter (sans les `---`) en objet. Gere scalaires, listes flow
// (mono/multi-ligne), et sequences de blocs (maps inline ou scalaires).
function parseFrontmatterBody(raw) {
  const data = {};
  if (!raw) return data;
  const lines = raw.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
    const m = line.match(KEY_RE);
    if (!m) { i++; continue; }              // ligne hors sous-ensemble : ignoree (tolerance)
    const baseIndent = m[1].length;
    const key = m[2];
    let rest = m[3];

    if (rest.trim() === '') {
      // Valeur en bloc : sequence `- ...` indentee, sinon rien.
      let j = i + 1;
      const seq = [];
      let sawSeq = false;
      while (j < lines.length) {
        const l = lines[j];
        if (l.trim() === '') { j++; continue; }
        if (indentOf(l) <= baseIndent) break;
        const sm = l.match(/^\s*-\s?(.*)$/);
        if (!sm) break;
        sawSeq = true;
        let itemText = sm[1];
        // map inline pouvant s'etaler sur plusieurs lignes (accolades non equilibrees)
        if (itemText.trim().startsWith('{')) {
          while (balance(itemText) > 0 && j + 1 < lines.length) { j++; itemText += ' ' + lines[j].trim(); }
          seq.push(parseInlineMap(itemText));
        } else if (itemText.trim().startsWith('[')) {
          while (balance(itemText) > 0 && j + 1 < lines.length) { j++; itemText += ' ' + lines[j].trim(); }
          seq.push(parseFlowList(itemText.trim().replace(/^\[/, '').replace(/\]$/, '')));
        } else {
          seq.push(parseScalar(itemText));
        }
        j++;
      }
      if (sawSeq) { data[key] = seq; i = j; continue; }
      data[key] = '';                       // cle sans valeur ni sequence
      i++;
      continue;
    }

    // Valeur inline. Liste flow potentiellement multi-ligne.
    if (rest.trim().startsWith('[') && balance(rest) > 0) {
      let acc = rest;
      let j = i;
      while (balance(acc) > 0 && j + 1 < lines.length) { j++; acc += ' ' + lines[j].trim(); }
      data[key] = parseValue(acc.trim());
      i = j + 1;
      continue;
    }
    if (rest.trim().startsWith('{') && balance(rest) > 0) {
      let acc = rest;
      let j = i;
      while (balance(acc) > 0 && j + 1 < lines.length) { j++; acc += ' ' + lines[j].trim(); }
      data[key] = parseValue(acc.trim());
      i = j + 1;
      continue;
    }
    data[key] = parseValue(rest);
    i++;
  }
  return data;
}

// Solde des paires ouvrantes/fermantes [] {} (hors quotes) : > 0 = non equilibre.
function balance(str) {
  let depth = 0, quote = null;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
  }
  return depth;
}

// API publique : parseFrontmatter(text) -> { data, body }.
export function parseFrontmatter(text) {
  const { raw, body } = splitDocument(text);
  return { data: parseFrontmatterBody(raw), body };
}

// Rendu lisible d'une valeur de frontmatter (pour `show`).
export function renderValue(v) {
  if (Array.isArray(v)) {
    if (v.length && typeof v[0] === 'object' && v[0] !== null) {
      return v.map(o => '  - ' + renderInline(o)).join('\n');
    }
    return '[' + v.map(x => renderInline(x)).join(', ') + ']';
  }
  if (v && typeof v === 'object') return renderInline(v);
  return String(v);
}

function renderInline(v) {
  if (Array.isArray(v)) return '[' + v.map(renderInline).join(', ') + ']';
  if (v && typeof v === 'object') {
    return '{ ' + Object.entries(v).map(([k, val]) => `${k}: ${renderInline(val)}`).join(', ') + ' }';
  }
  return String(v);
}

export const _internal = { splitTopLevel, parseScalar, parseFlowList, parseInlineMap, balance };
