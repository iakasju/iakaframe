#!/usr/bin/env node
// iakaframe-appflowy-doc — publie/rafraîchit la mémoire humaine d'un projet dans
// AppFlowy auto-hébergé, selon le modèle `iakadoc` (arborescence 00–90).
// Idempotent, non destructif, défensif. ZÉRO dépendance (fetch natif).
//
// Usage :
//   node appflowy-doc.mjs --project <nom> --root <chemin-projet> [--workspace <nom|id>]
//
// Identifiants résolus en cascade (aucun secret en dur, jamais commité) :
//   1. env d'abord : APPFLOWY_URL / APPFLOWY_EMAIL / APPFLOWY_PASSWORD
//   2. repli fichier dotenv local pour toute variable manquante :
//      $IAKAFRAME_APPFLOWY_ENV, sinon ~/.config/iakaframe/appflowy.env
//
// Workspace cible (correction B2 — plus JAMAIS `data[0]`) :
//   env APPFLOWY_WORKSPACE (nom OU workspace_id) → fichier dotenv → défaut « projects »
//   → sinon ÉCHEC PROPRE citant les workspaces disponibles. Aucun repli silencieux.
//
// Modèle `iakadoc` (instruction iakadocs/specs/instructions/template-iakadoc-appflowy.md § 5.1) :
//   espace = projet ; 00 Vue d'ensemble · 10 Le projet (11/12) · 20 Où on en est ·
//   30 Décisions & cadrage (+ index) · 40 Qualité (+ index) · 50 Recette · 60 Guide ·
//   90 Notes (HUMAINE, create-if-missing, jamais écrasée).
//
// Rafraîchissement INCRÉMENTAL (lot 3, critère A8) : empreinte sha256 prise CÔTÉ SOURCE,
//   état hors dépôt ($IAKAFRAME_CACHE_DIR, sinon ~/.cache/iakaframe/appflowy/<wid>/<projet>.json).
//   Une page inchangée ne coûte AUCUNE écriture. Cache perdu -> tout est réécrit.
// Balayage des ORPHELINS (lot 3, B3/A10) : une page de section générée sans source part à la
//   corbeille. `90 · Notes` et ses descendants sont exclus sans condition.
//
// Mécanismes API vérifiés en réel (spike lot 0, 2026-07-27, AppFlowy Cloud 0.15.21) :
//   - imbrication de pages sous une page : OK (S1) ; `/folder?depth=` tronque → depth ≥ 6 (J1)
//   - ordre des frères : POST .../page-view/{vid}/move {new_parent_view_id, prev_view_id} (S2/J2)
//     — l'ordre de création est NON déterministe : le `move` est obligatoire, pas optionnel.
//   - verrou déclaratif : PATCH .../page-view/{vid} {name (obligatoire), is_locked} (S4/J3)
//   - corbeille : POST .../move-to-trash ; purge définitive : DELETE .../trash/{vid} (S7)

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'

// ───────────────────────── Modèle iakadoc (constantes normatives) ─────────────────────────
//
// ⚠️ SURFACE DE RENDU ÉPINGLÉE. Les régions bornées par `RENDER-SURFACE:BEGIN` /
// `RENDER-SURFACE:END` sont celles dont toute modification change CE QUI EST PUBLIÉ dans les
// pages. Une garde de la suite unitaire (« A8 garde : RENDER_VERSION est épinglée… ») en
// hache le texte source et refuse qu'il bouge sans que `RENDER_VERSION` bouge aussi — sans
// quoi les projets déjà publiés resteraient figés sur un rendu périmé, EN SILENCE.
// Les bornes couvrent aussi les helpers NON exportés (`stripCommentsInLine`, `skipCodeSpan`,
// `RE_*`…) : c'est précisément par là qu'une régression passerait inaperçue.

// RENDER-SURFACE:BEGIN modele
// Séparateur normatif : espace + U+00B7 + espace.
export const SEP = ' · '

export const SEC = {
  OVERVIEW: '00' + SEP + "Vue d'ensemble",
  PROJET: '10' + SEP + 'Le projet',
  CADRE: '11' + SEP + 'Cadre de travail',
  VISION: '12' + SEP + 'Vision & décisions',
  ETAT: '20' + SEP + 'Où on en est',
  CADRAGE: '30' + SEP + 'Décisions & cadrage',
  QUALITE: '40' + SEP + 'Qualité',
  RECETTE: '50' + SEP + 'Recette (RQV)',
  GUIDE: '60' + SEP + 'Guide utilisateur',
  NOTES: '90' + SEP + 'Notes',
}

// Nom de la page d'index d'un conteneur (critère A6 : « 30 · (index) »).
export const indexName = (key) => key + SEP + '(index)'

// Libellé de source pour les pages générées qui n'ont pas de fichier source unique.
export const SOURCE_REPO = 'le dépôt du projet'
// RENDER-SURFACE:END modele

// Workspace cible par défaut (D5). Le workspace est désigné par son NOM : un UUID
// d'instance n'a pas sa place en dur dans un outil générique.
export const DEFAULT_WORKSPACE = 'projects'

// ───────────────────────── Fonctions pures (testables) ─────────────────────────

// Correction B1 (normative, sans exception) : tout fichier dont le NOM DE BASE commence
// par « _ » est un gabarit / fichier technique et n'est JAMAIS publié.
export function isTemplateFile(relPath) {
  const base = String(relPath).split(path.sep).join('/').split('/').pop() || ''
  return base.startsWith('_')
}

// Un doc de `docs/` qui n'est PAS un rapport qualité alimente `60 · Guide utilisateur`
// (contrat élargi du lot 4, § 5.2). Le seul discriminant est le sous-dossier `qualite/`.
export function isGuideDoc(relPath) {
  const p = String(relPath).split(path.sep).join('/')
  return p.startsWith('docs/') && !p.startsWith('docs/qualite/') && p.endsWith('.md')
}

// Prédicat : ce chemin relatif est-il un doc structurant à publier ?
export function isStructuralDoc(relPath) {
  const p = String(relPath).split(path.sep).join('/')
  if (isTemplateFile(p)) return false // B1 — avant toute autre règle
  if (p === 'CLAUDE.md') return true
  if (p === 'specs/PROJET.md') return true
  if (p === 'specs/etat-des-lieux.md') return true
  if (p.startsWith('specs/instructions/') && p.endsWith('.md')) return true
  if (p.startsWith('docs/qualite/') && p.endsWith('.md')) return true
  if (isGuideDoc(p)) return true // lot 4 — section 60
  return false
}

// Rang d'affichage stable pour ordonner les docs de façon déterministe.
function docRank(relPath) {
  const p = relPath.split(path.sep).join('/')
  if (p === 'CLAUDE.md') return 0
  if (p === 'specs/PROJET.md') return 1
  if (p === 'specs/etat-des-lieux.md') return 2
  if (p.startsWith('specs/instructions/')) return 3
  if (p.startsWith('docs/qualite/')) return 4
  if (isGuideDoc(p)) return 5
  return 9
}

// Filtre + ordonne une liste de chemins relatifs (pur, sans I/O).
export function selectStructuralDocs(relPaths) {
  return relPaths
    .filter(isStructuralDoc)
    .map((p) => p.split(path.sep).join('/'))
    .sort((a, b) => docRank(a) - docRank(b) || a.localeCompare(b))
}

// RENDER-SURFACE:BEGIN mapper
// ── Blocs AppFlowy (types vérifiés persistés au spike S3) ──

// Un « delta » est la charge de texte riche d'un bloc : [{ insert, attributes? }, …].
// Les constructeurs acceptent indifféremment une chaîne nue OU un delta déjà construit,
// pour que le mapper Markdown puisse leur passer du texte formaté.
export function toDelta(x) {
  if (Array.isArray(x)) return x
  const s = x == null ? '' : String(x)
  return s.length ? [{ insert: s }] : []
}

// Bloc paragraphe (vide => delta vide accepté par l'API).
export function para(text) {
  return { type: 'paragraph', data: { delta: toDelta(text) } }
}

// J7 — le rendu des niveaux > 3 n'est pas vérifiable par l'API : on clampe à 3.
export function clampHeadingLevel(level) {
  const n = Number(level)
  if (!Number.isFinite(n) || n < 1) return 1
  return n > 3 ? 3 : Math.floor(n)
}

export function heading(level, text) {
  return {
    type: 'heading',
    data: { level: clampHeadingLevel(level), delta: toDelta(text ?? '') },
  }
}

export function bullet(text) {
  return { type: 'bulleted_list', data: { delta: toDelta(text ?? '') } }
}

export function numbered(text) {
  return { type: 'numbered_list', data: { delta: toDelta(text ?? '') } }
}

// S3 — `todo_list` persiste `{ checked }`.
export function todo(text, checked = false) {
  return { type: 'todo_list', data: { checked: !!checked, delta: toDelta(text ?? '') } }
}

export function quote(text) {
  return { type: 'quote', data: { delta: toDelta(text ?? '') } }
}

// S3 — `code` persiste `{ language }` ; sans langage, `data` reste vide.
export function code(text, language) {
  const lang = String(language ?? '').trim().toLowerCase()
  const data = lang ? { language: lang, delta: toDelta(String(text ?? '')) }
    : { delta: toDelta(String(text ?? '')) }
  return { type: 'code', data }
}

export function divider() {
  return { type: 'divider', data: {} }
}

// § 5.3 — avertissement de miroir, PREMIER bloc de toute page générée 00–60.
export function mirrorWarning(sourceLabel, generatedAtIso) {
  return para(
    `Page générée depuis ${sourceLabel} le ${generatedAtIso}. ` +
    `Toute modification faite ici sera perdue au prochain rafraîchissement. ` +
    `Pour écrire, utiliser « ${SEC.NOTES} ».`,
  )
}

// ═══════════════════ Mapper Markdown → blocs (lot 2, critère A7) ═══════════════════
//
// Mapper MAISON, ZÉRO dépendance : la skill doit tourner telle quelle partout où Node ≥ 18
// est présent. Il ne vise PAS CommonMark intégral, mais le sous-ensemble réellement écrit
// dans les CLAUDE.md et specs/ du portefeuille (relevé sur 425 fichiers) :
//   titres ATX · puces (imbriquées) · numérotées · cases à cocher · citations · code fencé
//   avec langage · séparateurs · tableaux · gras/italique/code/liens en ligne.
//
// PERTES ASSUMÉES, déclarées ici et dans le SKILL.md (§ Pertes) :
//   - tableaux            -> bloc préformaté aligné (jamais des paragraphes bruts)
//   - liens relatifs      -> texte, cible entre parenthèses (pas de href : non résolvable)
//   - images relatives    -> mention « image non publiée : <chemin> », jamais un silence
//   - imbrication de liste-> aplatie ; la profondeur est rendue par un retrait insécable
//   - numérotation propre -> AppFlowy renumérote (une liste démarrant à 3 repart à 1)
//   - biffé `~~x~~`       -> laissé littéral (attribut non vérifié au spike S3)
//   - HTML brut           -> laissé en texte
//   - front-matter YAML   -> masqué du corps (déjà exploité pour le titre de page)

const NBSP = ' '

// Marques de bloc reconnues en tête de ligne — sert aussi à décider si une ligne peut être
// la continuation « paresseuse » d'un item de liste (CommonMark) ou non.
const RE_FENCE = /^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)/
// Même clôture, retrait libre : un bloc fencé écrit DANS un item de liste est indenté au
// niveau du contenu de l'item. Sans cette variante, son corps repartait en texte d'item,
// donc reformaté en ligne — la même perte silencieuse que R-2b.
const RE_FENCE_ANY = /^([ \t]*)(`{3,}|~{3,})[ \t]*([^\s`]*)/
const RE_HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/
const RE_DIVIDER = /^ {0,3}(-{3,}|\*{3,}|_{3,})[ \t]*$/
const RE_QUOTE = /^ {0,3}>[ \t]?(.*)$/
const RE_TABLE = /^ {0,3}\|/
const RE_LIST = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/
const RE_TODO = /^\[([ xX])\][ \t]+(.*)$/
// Bloc de code INDENTÉ (CommonMark) : 4 espaces ou 1 tabulation en tête.
const RE_INDENTED_CODE = /^(?: {4}|\t)/

function isBlockStart(line) {
  return RE_FENCE.test(line) || RE_HEADING.test(line) || RE_DIVIDER.test(line)
    || RE_QUOTE.test(line) || RE_TABLE.test(line) || RE_LIST.test(line)
}

const indentWidth = (s) => s.replace(/\t/g, '    ').length

/**
 * Un marqueur de liste peut-il INTERROMPRE un paragraphe (CommonMark) ?
 * - liste ordonnée : seulement si elle commence par 1 ;
 * - item vide : jamais.
 * Sans cette règle, « … occupe deja\n   3000) : configurer … » voyait `3000)` pris pour un
 * marqueur, donc CONSOMMÉ et jeté : perte de contenu SILENCIEUSE (R-2a). Idem pour
 * « le nombre de fenêtres est\n14. le nombre de portes est 6. ».
 */
export function listInterruptsParagraph(marker, content) {
  if (!String(content ?? '').trim()) return false
  const m = /^(\d{1,9})[.)]$/.exec(String(marker ?? ''))
  return m ? Number(m[1]) === 1 : true
}

/**
 * La règle CommonMark seule est TROP LARGE pour du rendu : elle fond aussi les vraies listes
 * qui reprennent après une interruption de bloc (tableau, fence, note) — « 2. … 3. … » repart
 * rarement à 1. Mesuré au gate du lot 3 : 32 blocs de liste fondus sur 10 documents réels.
 *
 * Discriminant retenu : un marqueur ordonné ≠ 1 est un VRAI marqueur s'il appartient à une
 * SUITE à son propre retrait — c.-à-d. s'il a un voisin ordonné au MÊME retrait, plus petit
 * avant (`2.` puis `3.`) ou plus grand après (`5.` puis `6.`). Le balayage saute les lignes
 * plus indentées (continuations, sous-listes) et s'arrête net sur la première ligne moins
 * indentée ou non-liste : il ne peut pas divaguer hors du niveau de liste courant.
 *
 * Une ligne repliée de prose (« … Cela fait 20, pas\n18. L'arithmétique … ») n'a, elle, aucun
 * voisin ordonné à son retrait : elle reste dans le paragraphe (R-2a préservé).
 */
export function belongsToOrderedRun(lines, idx) {
  const li = RE_LIST.exec(String(lines[idx] ?? ''))
  if (!li) return false
  const m = /^(\d{1,9})[.)]$/.exec(li[2])
  if (!m) return false
  const ind = indentWidth(li[1])
  const n = Number(m[1])
  // Numéro du plus proche item ordonné au MÊME retrait dans la direction `step`, ou null.
  const neighbour = (step) => {
    for (let j = idx + step; j >= 0 && j < lines.length; j += step) {
      if (!lines[j].trim()) continue          // une ligne vide ne ferme pas une liste
      const w = indentWidth(lines[j].match(/^[ \t]*/)[0])
      if (w > ind) continue                   // continuation / sous-liste : on traverse
      if (w !== ind) return null              // on est sorti du niveau : plus de suite
      const nli = RE_LIST.exec(lines[j])
      if (!nli) return null                   // de la prose au même retrait : plus de suite
      const nm = /^(\d{1,9})[.)]$/.exec(nli[2])
      return nm ? Number(nm[1]) : null
    }
    return null
  }
  const before = neighbour(-1)
  if (before !== null && before < n) return true
  const after = neighbour(1)
  return after !== null && after > n
}

// ── Formatage en ligne ──

const sameAttrs = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

// Une URL est publiable telle quelle (href) si elle est absolue. Un lien relatif entre docs
// n'a aucun sens côté AppFlowy : perte assumée, on garde le texte.
export function isAbsoluteUrl(url) {
  return /^(https?:|mailto:|ftp:|tel:)/i.test(String(url ?? '').trim())
}

// Trouve la fin d'un groupe délimité, en respectant l'équilibrage des parenthèses.
function closingParen(src, start) {
  let depth = 0
  for (let i = start; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue }
    if (src[i] === '(') depth++
    else if (src[i] === ')') { if (depth === 0) return i; depth-- }
  }
  return -1
}

// `_` et `__` ne délimitent PAS à l'intérieur d'un mot : sinon tout snake_case du corpus
// (noms de variables, de fichiers) partirait en italique. Le `_` lui-même compte comme
// caractère de mot, sans quoi `APPFLOWY__WORKSPACE__` ferait passer WORKSPACE en italique
// (le second `_` de la paire ouvrante se croirait libre) — cas trouvé par mutation.
const wordish = (c) => c !== undefined && /[\p{L}\p{N}_]/u.test(c)

/**
 * Fin (exclue) du span de code ouvert en `i`, ou -1 si `i` n'ouvre pas de span.
 * R-B : le code en ligne lie PLUS FORT que l'emphase (CommonMark). Sans ce saut, l'astérisque
 * de `` `capabilities/*` `` fermait l'italique ouvert avant lui et le span perdait son `*` —
 * un littéral silencieusement altéré, invisible aux sondes « mots » et « littéral bloc ».
 */
const skipCodeSpan = (src, i) => {
  let n = 0
  while (src[i + n] === '`') n++
  if (!n) return -1
  const end = src.indexOf('`'.repeat(n), i + n)
  return end === -1 ? -1 : end + n
}

// Cherche le délimiteur d'emphase fermant, en sautant les spans de code et les échappements.
const findDelimiter = (src, from, mark) => {
  for (let j = from; j < src.length; j++) {
    if (src[j] === '\\') { j++; continue }
    const skip = skipCodeSpan(src, j)
    if (skip !== -1) { j = skip - 1; continue }
    if (src.startsWith(mark, j)) return j
  }
  return -1
}

/**
 * Markdown en ligne → delta AppFlowy [{ insert, attributes? }, …].
 * Attributs émis : bold, italic, code, href — les 4 vérifiés persistés au spike S3.
 */
export function parseInline(text) {
  const out = []
  const push = (insert, attrs) => {
    if (!insert) return
    const a = attrs && Object.keys(attrs).length ? attrs : null
    const last = out[out.length - 1]
    if (last && sameAttrs(last.attributes, a)) { last.insert += insert; return }
    out.push(a ? { insert, attributes: { ...a } } : { insert })
  }

  const walk = (src, attrs) => {
    let buf = ''
    const flush = () => { push(buf, attrs); buf = '' }
    let i = 0
    while (i < src.length) {
      const c = src[i]

      // Échappement : \* \_ \` \[ … → le caractère littéral.
      if (c === '\\' && i + 1 < src.length && /[\\`*_[\]()~#+\-.!>|]/.test(src[i + 1])) {
        buf += src[i + 1]; i += 2; continue
      }

      // Code en ligne — priorité absolue : rien ne se formate à l'intérieur.
      if (c === '`') {
        let n = 0
        while (src[i + n] === '`') n++
        const fence = '`'.repeat(n)
        const end = src.indexOf(fence, i + n)
        if (end !== -1) {
          let inner = src.slice(i + n, end)
          if (inner.length > 1 && inner.startsWith(' ') && inner.endsWith(' ')) inner = inner.slice(1, -1)
          flush(); push(inner, { ...attrs, code: true })
          i = end + n; continue
        }
      }

      // Image : jamais téléversée (§ 4.2) — mention explicite, jamais un silence.
      if (c === '!' && src[i + 1] === '[') {
        const close = src.indexOf(']', i + 2)
        if (close !== -1 && src[close + 1] === '(') {
          const end = closingParen(src, close + 2)
          if (end !== -1) {
            const url = src.slice(close + 2, end).trim().split(/\s+/)[0]
            // Le texte alternatif est du CONTENU : il est conservé, jamais escamoté.
            const alt = src.slice(i + 2, close).trim()
            flush()
            push(alt ? `image non publiée : ${alt} (${url})` : `image non publiée : ${url}`, attrs)
            i = end + 1; continue
          }
        }
      }

      // Lien.
      if (c === '[') {
        const close = src.indexOf(']', i + 1)
        if (close !== -1 && src[close + 1] === '(') {
          const end = closingParen(src, close + 2)
          if (end !== -1) {
            const label = src.slice(i + 1, close)
            const url = src.slice(close + 2, end).trim().split(/\s+/)[0]
            flush()
            if (isAbsoluteUrl(url)) {
              walk(label, { ...attrs, href: url })
            } else {
              // Perte assumée : le lien relatif reste du texte, la cible n'est pas perdue.
              walk(label, attrs)
              if (url && url !== label) push(` (${url})`, attrs)
            }
            i = end + 1; continue
          }
        }
      }

      // Gras ** … ** et __ … __ (jamais à l'intérieur d'un mot pour `__`).
      let consumed = false
      for (const mark of ['**', '__']) {
        if (!src.startsWith(mark, i) || attrs?.bold) continue
        if (mark === '__' && wordish(src[i - 1])) break
        const end = findDelimiter(src, i + 2, mark)
        if (end > i + 2 && !(mark === '__' && wordish(src[end + 2]))) {
          flush(); walk(src.slice(i + 2, end), { ...attrs, bold: true })
          i = end + 2; consumed = true
        }
        break
      }
      if (consumed) continue

      // Italique * … * et _ … _ (idem : `snake_case` ne part pas en italique).
      for (const mark of ['*', '_']) {
        if (src[i] !== mark || src.startsWith(mark + mark, i) || attrs?.italic) continue
        if (mark === '_' && wordish(src[i - 1])) break
        if (/\s/.test(src[i + 1] ?? ' ')) break
        let end = -1
        for (let j = i + 1; j < src.length; j++) {
          if (src[j] === '\\') { j++; continue }
          const skip = skipCodeSpan(src, j)     // R-B : le code en ligne lie plus fort
          if (skip !== -1) { j = skip - 1; continue }
          if (src[j] !== mark || /\s/.test(src[j - 1])) continue
          if (mark === '_' && wordish(src[j + 1])) continue
          end = j; break
        }
        if (end > i + 1) {
          flush(); walk(src.slice(i + 1, end), { ...attrs, italic: true })
          i = end + 1; consumed = true
        }
        break
      }
      if (consumed) continue

      buf += c; i++
    }
    flush()
  }

  walk(String(text ?? ''), null)
  return out
}

// ── Tableaux → bloc préformaté aligné (perte assumée, jamais des paragraphes) ──

// Découpe une ligne de tableau en cellules, en respectant `\|` et le code en ligne.
export function splitTableRow(line) {
  const s = String(line).trim().replace(/^\|/, '').replace(/\|$/, '')
  const cells = []
  let cur = ''
  let tick = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue }
    if (c === '`') tick = !tick
    if (c === '|' && !tick) { cells.push(cur.trim()); cur = ''; continue }
    cur += c
  }
  cells.push(cur.trim())
  return cells
}

const isAlignRow = (cells) => cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c))

/**
 * Rend un tableau Markdown en texte préformaté aligné (colonnes à largeur fixe).
 * A7 : ZÉRO ligne de tableau ne doit finir en paragraphe brut.
 */
export function renderTable(lines) {
  const rows = lines.map(splitTableRow)
  const width = Math.max(...rows.map((r) => r.length))
  const grid = rows.map((r) => { const c = r.slice(); while (c.length < width) c.push(''); return c })
  const align = grid.map(isAlignRow)
  const w = []
  for (let c = 0; c < width; c++) {
    w[c] = Math.max(3, ...grid.map((r, i) => (align[i] ? 0 : [...r[c]].length)))
  }
  return grid.map((r, i) => (align[i]
    ? '| ' + r.map((_, c) => '-'.repeat(w[c])).join(' | ') + ' |'
    : '| ' + r.map((cell, c) => cell + ' '.repeat(w[c] - [...cell].length)).join(' | ') + ' |'
  )).join('\n')
}

// ── Commentaires HTML : MASQUÉS, jamais publiés (arbitrage du décideur, lot 4) ──
//
// Un `<!-- … -->` est du bruit d'édition (note de rédaction, gabarit, ligne commentée) dans
// un miroir destiné À LA LECTURE. Il est retiré du corps, comme le front-matter.
//
// DEUX RÉGIONS SONT ÉPARGNÉES, sans quoi le masquage détruirait du contenu :
//   - le LITTÉRAL de bloc (fence, bloc indenté) : un `<!-- -->` montré en exemple dans un
//     bloc de code EST le contenu — l'invariant « littéral bloc » le prouverait autrement ;
//   - le LITTÉRAL EN LIGNE (`` `<!-- x -->` ``) : idem, l'invariant « littéral en ligne ».
// Un commentaire à cheval sur plusieurs lignes est masqué en entier ; la ligne qui n'en
// contenait que lui devient vide, donc un simple séparateur de paragraphe.

// Retire les commentaires d'UNE ligne, en sautant les spans de code. `open` = on était déjà
// à l'intérieur d'un commentaire ouvert plus haut. Retourne le texte restant + l'état.
function stripCommentsInLine(line, open) {
  let out = ''
  let i = 0
  let inside = !!open
  while (i < line.length) {
    if (inside) {
      const end = line.indexOf('-->', i)
      if (end === -1) return { text: out, open: true }
      i = end + 3
      inside = false
      continue
    }
    const skip = skipCodeSpan(line, i)   // littéral en ligne : recopié tel quel
    if (skip !== -1) { out += line.slice(i, skip); i = skip; continue }
    if (line.startsWith('<!--', i)) { inside = true; i += 4; continue }
    out += line[i]; i++
  }
  return { text: out, open: inside }
}

// PUR : masque les commentaires HTML hors régions littérales.
export function stripHtmlComments(md) {
  const lines = String(md ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const out = []
  let fence = null
  let open = false
  let blankBefore = true
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (fence) {                          // corps de bloc fencé : verbatim
      out.push(raw)
      if (fence.test(raw)) fence = null
      continue
    }
    if (!open) {
      const f = RE_FENCE_ANY.exec(raw)
      if (f) {
        fence = new RegExp('^[ \\t]*' + (f[2][0] === '~' ? '~' : '\\`') + '{3,}[ \\t]*$')
        out.push(raw); blankBefore = false; continue
      }
      if (blankBefore && raw.trim() && RE_INDENTED_CODE.test(raw)) {
        while (i < lines.length && (RE_INDENTED_CODE.test(lines[i]) || !lines[i].trim())) {
          out.push(lines[i]); i++
        }
        i--; blankBefore = false; continue
      }
    }
    const r = stripCommentsInLine(raw, open)
    open = r.open
    out.push(r.text)
    blankBefore = !r.text.trim()
  }
  return out.join('\n')
}

/**
 * Corps publiable d'un document : front-matter retiré (il sert au titre) ET commentaires HTML
 * masqués. POINT UNIQUE — le mapper ET les quatre sondes en dérivent, sinon les sondes
 * compteraient un contenu que le rendu ne porte plus et rougiraient sur une perte DÉCLARÉE.
 * Conséquence assumée, du même ordre que `stripFrontMatter` : les sondes ne peuvent pas
 * contredire le masquage lui-même — c'est la suite unitaire qui l'épingle.
 */
export function docBody(content) {
  return stripHtmlComments(stripFrontMatter(content).body)
}

// ── Mapper de blocs ──

/**
 * Markdown → blocs AppFlowy. Fonction PURE (J7 : le serveur ne validant aucun type de bloc,
 * la garantie ne peut venir que d'ici, sous test unitaire).
 */
export function markdownToBlocks(md) {
  const lines = String(md ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const blocks = []
  let buf = []          // paragraphe en cours d'agglomération
  let listStack = []    // retraits des niveaux de liste ouverts (pour la profondeur)

  const flush = () => {
    if (!buf.length) return
    // Agglomération : un simple retour à la ligne ne coupe PAS le paragraphe (A7).
    blocks.push(para(parseInline(buf.join(' '))))
    buf = []
  }
  const closeList = () => { listStack = [] }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // 1. Code fencé — avant tout le reste : son contenu n'est jamais interprété.
    //    Sous une liste ouverte, le retrait du fence est libre (il suit celui de l'item).
    const fence = RE_FENCE.exec(line) || (listStack.length ? RE_FENCE_ANY.exec(line) : null)
    if (fence) {
      flush(); closeList()
      const pad = fence[1]
      const marker = fence[2][0]           // ` ou ~
      const closeRe = new RegExp('^[ \\t]{0,' + Math.max(3, indentWidth(pad)) + '}'
        + (marker === '~' ? '~' : '\\`') + '{3,}[ \\t]*$')
      const lang = (fence[3] || '').split(/[:\s]/)[0]
      const dedent = new RegExp('^' + pad.replace(/[\t]/g, '\\t'))
      const body = []
      i++
      while (i < lines.length && !closeRe.test(lines[i])) { body.push(lines[i].replace(dedent, '')); i++ }
      i++ // consomme la clôture (absente en fin de fichier : sans conséquence)
      blocks.push(code(body.join('\n'), lang))
      continue
    }

    // 2. Tableau — bloc préformaté aligné (jamais des paragraphes).
    if (RE_TABLE.test(line)) {
      flush(); closeList()
      const rows = []
      while (i < lines.length && RE_TABLE.test(lines[i])) { rows.push(lines[i]); i++ }
      blocks.push(code(renderTable(rows)))
      continue
    }

    // 3. Ligne vide : elle seule sépare deux paragraphes.
    if (!line.trim()) { flush(); closeList(); i++; continue }

    // 3 bis. Bloc de code INDENTÉ (4 espaces / 1 tabulation), CommonMark. Il ne démarre
    // jamais au milieu d'un paragraphe ni sous une liste ouverte (ce serait une
    // continuation d'item). Sans ce cas, le contenu partait en paragraphe AVEC formatage
    // inline : « __tests__ » devenait « tests » en gras, les `_` disparaissaient (R-2b).
    if (!buf.length && !listStack.length && RE_INDENTED_CODE.test(line)) {
      const body = []
      while (i < lines.length && (RE_INDENTED_CODE.test(lines[i]) || !lines[i].trim())) {
        body.push(lines[i].replace(RE_INDENTED_CODE, '')); i++
      }
      while (body.length && !body[body.length - 1].trim()) body.pop()
      blocks.push(code(body.join('\n')))
      continue
    }

    // 4. Titre ATX (`####`+ clampé au niveau 3 — J7).
    const h = RE_HEADING.exec(line)
    if (h) {
      flush(); closeList()
      blocks.push(heading(h[1].length, parseInline(h[2])))
      i++; continue
    }

    // 5. Séparateur.
    if (RE_DIVIDER.test(line)) {
      flush(); closeList()
      blocks.push(divider())
      i++; continue
    }

    // 6. Citation — le contenu cité est mappé récursivement : un paragraphe cité devient
    //    `quote`, une liste citée reste une liste (sinon elle finirait en pavé illisible).
    if (RE_QUOTE.test(line)) {
      flush(); closeList()
      const inner = []
      while (i < lines.length && RE_QUOTE.test(lines[i])) { inner.push(RE_QUOTE.exec(lines[i])[1]); i++ }
      for (const b of markdownToBlocks(inner.join('\n'))) {
        blocks.push(b.type === 'paragraph' ? quote(b.data.delta) : b)
      }
      continue
    }

    // 7. Item de liste (à puce / numérotée / à cocher), avec continuations.
    const li = RE_LIST.exec(line)
    if (li) {
      // Un paragraphe est ouvert : seule une liste qui PEUT l'interrompre le coupe — ou qui
      // appartient à une SUITE ordonnée à son retrait (une vraie liste qui reprend après un
      // tableau / une note ne repart pas à 1). Sinon la ligne lui appartient encore, et son
      // marqueur n'est pas avalé (R-2a).
      if (buf.length && !listInterruptsParagraph(li[2], li[3]) && !belongsToOrderedRun(lines, i)) {
        buf.push(line.trim()); i++; continue
      }
      flush()
      const ind = indentWidth(li[1])
      while (listStack.length && listStack[listStack.length - 1] >= ind) listStack.pop()
      listStack.push(ind)
      const depth = listStack.length - 1

      const parts = [li[3]]
      i++
      // Continuation : ligne plus indentée que le marqueur, OU continuation paresseuse
      // (ligne nue qui n'ouvre aucun bloc). Dans les deux cas : PAS un nouveau paragraphe.
      while (i < lines.length && lines[i].trim()) {
        const next = lines[i]
        const nInd = indentWidth(next.match(/^[ \t]*/)[0])
        const nli = RE_LIST.exec(next)
        if (nli) {
          // Au même niveau (ou plus à gauche) : nouvel item de la liste DÉJÀ ouverte —
          // il n'interrompt aucun paragraphe, sa numérotation est donc libre.
          if (nInd <= ind) break
          // Plus indenté : ce serait une SOUS-liste, qui n'ouvre que si elle peut
          // interrompre le paragraphe de l'item, ou si elle appartient à une suite ordonnée
          // à son retrait. Sinon : continuation paresseuse.
          if (listInterruptsParagraph(nli[2], nli[3]) || belongsToOrderedRun(lines, i)) break
        } else if (RE_FENCE_ANY.test(next)) break // le littéral ne se fond jamais dans l'item
        else if (nInd <= ind && isBlockStart(next)) break
        parts.push(next.trim()); i++
      }
      const raw = parts.join(' ')
      // La profondeur est rendue par un retrait insécable : l'API `append-block` est plate.
      const prefix = NBSP.repeat(depth * 2)
      const delta = parseInline(raw.replace(RE_TODO, '$2'))
      if (prefix) delta.unshift({ insert: prefix })

      const tick = RE_TODO.exec(raw)
      if (tick) blocks.push(todo(delta, tick[1].toLowerCase() === 'x'))
      else if (/^\d/.test(li[2])) blocks.push(numbered(delta))
      else blocks.push(bullet(delta))
      continue
    }

    // 8. Tout le reste (prose, HTML brut) : agglomération de paragraphe.
    buf.push(line.trim())
    i++
  }
  flush()
  return blocks
}

// RENDER-SURFACE:END mapper

// ═════════ Sonde de conservation du contenu (R-2) — le filet anti-perte silencieuse ═════════
//
// Une perte de contenu ne DOIT jamais passer inaperçue. Les deux défauts trouvés au gate du
// lot 2 (marqueur numéroté avalé, bloc de code indenté reformaté) partageaient la même
// signature : du texte disparaissait du rendu sans qu'aucun test ne rougisse. La sonde
// compare un MULTI-ENSEMBLE de mots source au rendu ; tout déficit est une perte.

// Un « mot » = une suite de lettres / chiffres / underscore. La ponctuation de syntaxe
// (`#`, `-`, `|`, `>`, `*`) n'en produit aucun : elle peut disparaître sans alerte.
// Les `_` de BORDURE sont rognés des deux côtés de la comparaison : ce sont des marques
// d'emphase (`_à confirmer_`), consommées par construction. Les `_` INTERNES, eux, sont
// du contenu (`snake_case`, `IAKAGRAPH_ROOT`) et restent comparés.
export function contentWords(text) {
  return (String(text ?? '').match(/[\p{L}\p{N}_]+/gu) || [])
    .map((w) => w.replace(/^_+|_+$/g, ''))
    .filter(Boolean)
}

// Référence : le source privé des SEULES marques dont la disparition est déclarée —
// front-matter (§ pertes), marqueur de liste (AppFlowy renumérote), case à cocher
// (portée par `checked`). Tout le reste doit survivre au rendu.
//
// Point CRUCIAL, et la raison pour laquelle une simple regex ne suffit pas : un marqueur
// ordonné n'est retiré que s'il est CONFORME à la suite en cours (1, puis 2, puis 3…).
// Un « 3000) » surgissant en tête d'une ligne repliée n'est PAS un marqueur : il reste
// dans la référence, et sa disparition du rendu devient une perte détectée (R-2a).
// Ce compteur est indépendant du mapper : il ne partage aucune ligne de code avec lui.
export function sourceReference(md) {
  const lines = docBody(md).split('\n')
  const out = []
  const last = new Map() // retrait -> dernier numéro de suite accepté
  let fence = null
  let listOpen = false   // un item de liste vient d'être vu (sans ligne vide depuis)
  // R-A : la mémoire des suites était GLOBALE au document et jamais purgée. Une sous-liste
  // « 1. 2. » vue plus haut au retrait 3 rendait « conforme » n'importe quel « 3000) » surgi
  // au retrait 3 des centaines de lignes plus bas — le filet avait une maille dépendante de
  // l'historique. Toute ligne au retrait `w` FERME les suites plus profondes que `w` : on ne
  // revient jamais dans un niveau de liste qu'on a quitté.
  const closeDeeperThan = (w) => { for (const k of last.keys()) if (k > w) last.delete(k) }
  for (const raw of lines) {
    if (fence) { // dans un bloc fencé, rien n'est marqueur
      out.push(raw)
      if (fence.test(raw)) fence = null
      continue
    }
    const f = RE_FENCE_ANY.exec(raw)
    if (f) {
      fence = new RegExp('^[ \\t]*' + (f[2][0] === '~' ? '~' : '\\`') + '{3,}[ \\t]*$')
      out.push(raw); continue
    }
    if (!raw.trim()) { listOpen = false; out.push(raw); continue }
    // Retrait EFFECTIF : le chevron de citation compte comme du retrait (une liste citée vit
    // au niveau `> `). Une ligne vide DANS une citation (`>` seul) ne ferme rien.
    const q = /^([ \t]*)((?:>[ \t]?)*)/.exec(raw)
    const m = /^([ \t]*)((?:>[ \t]?)*)([-*+]|\d{1,9}[.)])[ \t]+(\[[ xX]\][ \t]+)?/.exec(raw)
    if (!m) {
      if (raw.slice(q[0].length).trim()) closeDeeperThan(indentWidth(q[1] + q[2]))
      out.push(raw); continue
    }
    const indent = indentWidth(m[1] + m[2])
    closeDeeperThan(indent)
    const num = /^(\d{1,9})[.)]$/.exec(m[3])
    let conforme = true
    if (num) {
      // Un marqueur ordonné n'est un marqueur que s'il OUVRE une suite (1), la POURSUIT
      // (progression, sauts admis), ou démarre une suite HORS d'un contexte de liste.
      // « 3000) » en tête d'une ligne repliée d'un item n'est aucun des trois : il reste
      // dans la référence, et son escamotage devient une perte DÉTECTÉE (R-2a).
      const n = Number(num[1])
      conforme = n <= 1 // 0 et 1 ouvrent une suite (CommonMark admet « 0. »)
        || (last.has(indent) && n > last.get(indent))
        || (!last.has(indent) && !listOpen)
      if (conforme) last.set(indent, n)
    }
    listOpen = true
    out.push(conforme ? m[1] + m[2] + raw.slice(m[0].length) : raw)
  }
  return out.join('\n')
}

// ── Second invariant : le LITTÉRAL reste littéral ──
//
// Régions littérales du source, au sens CommonMark : corps de bloc fencé, et suite de
// lignes indentées d'au moins 4 espaces précédée d'une ligne vide. Extraites SANS le
// mapper : c'est ce qui rend l'invariant capable de le contredire (R-2b — les blocs
// indentés partaient en paragraphe, `__tests__` devenait « tests » en gras).
export function literalRegions(md) {
  const lines = docBody(md).split('\n')
  const out = []
  let i = 0
  let blankBefore = true
  while (i < lines.length) {
    const f = RE_FENCE_ANY.exec(lines[i])
    if (f) {
      const closeRe = new RegExp('^[ \\t]*' + (f[2][0] === '~' ? '~' : '\\`') + '{3,}[ \\t]*$')
      const dedent = new RegExp('^' + f[1].replace(/[\t]/g, '\\t'))
      const body = []
      i++
      while (i < lines.length && !closeRe.test(lines[i])) { body.push(lines[i].replace(dedent, '')); i++ }
      i++
      out.push(body.join('\n')); blankBefore = false; continue
    }
    if (blankBefore && lines[i].trim() && RE_INDENTED_CODE.test(lines[i])) {
      const body = []
      while (i < lines.length && (RE_INDENTED_CODE.test(lines[i]) || !lines[i].trim())) {
        body.push(lines[i].replace(RE_INDENTED_CODE, '')); i++
      }
      while (body.length && !body[body.length - 1].trim()) body.pop()
      out.push(body.join('\n')); blankBefore = false; continue
    }
    blankBefore = !lines[i].trim()
    i++
  }
  return out.filter((t) => t.trim())
}

// SONDE (2/3) : toute région littérale du source se retrouve VERBATIM dans un bloc `code`.
// Retourne les régions introuvables — vide = aucun littéral reformaté.
// `blocks` injectable : c'est ce qui permet de soumettre à la sonde un rendu FAUTIF et de
// vérifier qu'elle rougit (mutation-test de la sonde elle-même, cf. R-E).
export function literalLoss(md, blocks) {
  const rendus = (blocks ?? markdownToBlocks(docBody(md)))
    .filter((b) => b.type === 'code')
    .map((b) => (b.data.delta || []).map((d) => d.insert).join(''))
  return literalRegions(md).filter((r) => !rendus.some((t) => t.includes(r)))
}

// ── Invariant 2 bis : le littéral EN LIGNE aussi (R-B) ──
//
// `literalRegions` ne connaît que les fences et les blocs indentés. Le code EN LIGNE avait
// donc la même signature que R-2b, hors de portée : un mutant sur la priorité du code en
// ligne coupait « `library/__tests__/fixtures/` » en trois avec « tests » en GRAS, sondes
// vertes. On extrait les spans du source, sans le mapper, et on exige qu'ils survivent
// verbatim — soit en segment `code`, soit dans un bloc `code` (cas d'une cellule de tableau,
// rendue en bloc préformaté).
export function inlineCodeRegions(md) {
  const lines = docBody(md).split('\n')
  const prose = []
  let i = 0
  let blankBefore = true
  while (i < lines.length) {
    const f = RE_FENCE_ANY.exec(lines[i])
    if (f) {
      const closeRe = new RegExp('^[ \\t]*' + (f[2][0] === '~' ? '~' : '\\`') + '{3,}[ \\t]*$')
      i++
      while (i < lines.length && !closeRe.test(lines[i])) i++
      i++; blankBefore = false; continue
    }
    if (blankBefore && lines[i].trim() && RE_INDENTED_CODE.test(lines[i])) {
      while (i < lines.length && (RE_INDENTED_CODE.test(lines[i]) || !lines[i].trim())) i++
      blankBefore = false; continue
    }
    blankBefore = !lines[i].trim()
    prose.push(lines[i]); i++
  }
  // Un span peut chevaucher un retour à la ligne (`\`chemin/\ntrès/long\``) : le mapper
  // agglomère avant de formater, la sonde doit agglomérer pareil. Sinon le backtick FERMANT
  // d'un span à cheval passait pour un OUVRANT et la sonde fabriquait des spans fantômes
  // (« . Grille CSS ») — 90 faux positifs mesurés sur le corpus.
  const groups = ['']
  for (const raw of prose) {
    // Le chevron de citation est retiré comme le fait le mapper avant de récurser : sans ça
    // un span à cheval sur deux lignes citées embarquait « > » et devenait introuvable.
    const l = raw.replace(/^ {0,3}(?:>[ \t]?)+/, '')
    // Un item de liste, un titre ou une ligne de tableau OUVRE une unité : le mapper les
    // agglomère séparément. Sans cette coupure, un backtick esseulé (les documents qui
    // PARLENT de backticks) appariait à travers deux items et fabriquait des spans fantômes.
    if (!l.trim() || isBlockStart(l)) groups.push('')
    if (!l.trim()) continue
    groups[groups.length - 1] = (groups[groups.length - 1] ?? '') + (groups[groups.length - 1] ? ' ' : '') + l.trim()
  }
  const out = []
  for (const line of groups) {
    let j = 0
    while (j < line.length) {
      if (line[j] === '\\') { j += 2; continue }
      if (line[j] !== '`') { j++; continue }
      let n = 0
      while (line[j + n] === '`') n++
      const end = line.indexOf('`'.repeat(n), j + n)
      if (end === -1) { j += n; continue }   // backtick isolé : pas un span, pas une promesse
      let inner = line.slice(j + n, end)
      if (inner.length > 1 && inner.startsWith(' ') && inner.endsWith(' ')) inner = inner.slice(1, -1)
      if (inner.trim()) out.push(inner)
      j = end + n
    }
  }
  return out
}

// SONDE (2 bis) : tout span de code en ligne du source survit verbatim en littéral.
export function inlineCodeLoss(md, blocks) {
  const rendered = blocks ?? markdownToBlocks(docBody(md))
  const segs = []
  const pave = []
  const walk = (b) => {
    const d = (b && b.data) || {}
    if (b && b.type === 'code') pave.push((d.delta || []).map((s) => s.insert).join(''))
    else for (const s of d.delta || []) if (s.attributes && s.attributes.code) segs.push(String(s.insert))
    for (const c of (b && b.children) || []) walk(c)
  }
  for (const b of rendered || []) walk(b)
  // `renderTable` déséchappe les `\|` d'une cellule : la variante déséchappée est admise.
  const variants = (r) => (r.includes('\\|') ? [r, r.replace(/\\\|/g, '|')] : [r])
  return inlineCodeRegions(md).filter((r) => !variants(r).some((v) =>
    segs.some((s) => s.includes(v)) || pave.some((t) => t.includes(v))))
}

// ── Troisième invariant : la STRUCTURE tient ──
//
// LEÇON DU GATE DU LOT 3. Les deux premiers invariants comptent des MOTS et des LITTÉRAUX :
// aucun ne regarde le TYPE des blocs. Le correctif R-2a a donc pu fondre 32 blocs de liste
// dans des paragraphes sur 10 documents réels — aucun mot perdu, `contentLoss` VERTE, A7
// comptage n°2 (« ≥1 bloc de liste par item de liste du source ») violé en silence.
// Cet invariant compte les STRUCTURES du source, sans le mapper, et exige que le rendu en
// porte AU MOINS autant. C'est une BORNE BASSE : un surplus n'est jamais une faute.
//
// PORTÉE DÉCLARÉE (ne pas sous-déclarer) : cet invariant vérifie le segment RECONNAISSANCE →
// ÉMISSION, et RIEN EN AMONT. Toute la couche de reconnaissance est PARTAGÉE avec le mapper :
// RE_FENCE, RE_TABLE, RE_INDENTED_CODE, RE_HEADING, RE_DIVIDER, RE_LIST,
// listInterruptsParagraph, belongsToOrderedRun, stripFrontMatter, indentWidth — et pour les
// listes c'est la MÊME expression mot pour mot (cf. `markdownToBlocks`). Il ne peut donc
// contredire AUCUNE règle de reconnaissance : mesuré, il reste VERT sur 426/426 documents
// quand on altère RE_LIST, RE_HEADING, RE_DIVIDER ou belongsToOrderedRun, là où un oracle
// indépendant rougit en masse. Ce qu'il contredit — items fondus, titre avalé, séparateur
// perdu, tableau ou bloc de code reformaté en prose — l'est À RECONNAISSANCE CONSTANTE.
// Le filet contre une régression de la reconnaissance elle-même reste la SUITE UNITAIRE,
// qui épingle des valeurs littérales.
const STRUCT_OF = { heading: 'heading', divider: 'divider', code: 'code', numbered_list: 'list', bulleted_list: 'list', todo_list: 'list' }

// Retire le chevron de citation. **Le retrait, lui, est MESURÉ** : sans ce retrait, une liste
// CITÉE (`> - item`) n'est pas reconnue par `RE_LIST` et la borne basse devient aveugle là où
// elle devrait compter — sur les 451 docs du portefeuille (dont **45** contiennent au moins une
// liste citée), la référence perd alors **186 items de liste et 6 titres**.
//
// La largeur du chevron est **convertie** en retrait (`> ` ↦ deux espaces) plutôt qu'écrasée.
// ⚠️ C'est une **prudence, pas un effet mesuré** : les deux variantes donnent des comptes
// **rigoureusement identiques** sur le corpus (6 437 titres / 2 151 séparateurs / 16 230 listes
// / 1 576 préformatés) et **aucune** ne produit de faux positif. On garde la conversion parce
// qu'elle est la seule à distinguer **deux profondeurs de citation** (`> -` vs `> > -`) — cas
// absent du corpus mesuré, mais pas du Markdown. Aucun bénéfice n'est revendiqué au-delà.
const unquote = (line) => String(line).replace(/^([ \t]*)((?:>[ \t]?)*)/,
  (_, sp, q) => sp + ' '.repeat(indentWidth(q)))

export function structureReference(md) {
  const raw = docBody(md).split('\n')
  const lines = raw.map(unquote)
  const ref = { heading: 0, divider: 0, list: 0, code: 0 }
  let i = 0
  let blankBefore = true
  while (i < raw.length) {
    // Ordre de reconnaissance MIROIR de celui du mapper (fence → tableau → vide → code
    // indenté → titre → séparateur → liste), sans quoi les deux comptages divergeraient.
    // Fence au retrait STRICT (0-3 espaces) : un fence plus indenté est déjà du littéral au
    // sens CommonMark, il tombe dans la branche « code indenté ». Compter les deux ferait
    // sortir la borne basse de sa promesse (ne jamais rougir à tort).
    const f = RE_FENCE.exec(raw[i])
    if (f) {
      const closeRe = new RegExp('^[ \\t]*' + (f[2][0] === '~' ? '~' : '\\`') + '{3,}[ \\t]*$')
      i++
      while (i < raw.length && !closeRe.test(raw[i])) i++
      i++
      ref.code++; blankBefore = false; continue
    }
    // Tableau : compté seulement s'il OUVRE un bloc (précédé d'une ligne vide). Une ligne
    // repliée d'item qui commence par `|` (« `skill` | `hook` |\n  | `config` ») n'est pas un
    // tableau : l'ambiguïté sort du périmètre de la borne basse plutôt que de la faire mentir.
    if (blankBefore && RE_TABLE.test(raw[i])) {
      while (i < raw.length && RE_TABLE.test(raw[i])) i++
      ref.code++; blankBefore = false; continue
    }
    if (!raw[i].trim()) { blankBefore = true; i++; continue }
    if (blankBefore && RE_INDENTED_CODE.test(raw[i])) {
      while (i < raw.length && (RE_INDENTED_CODE.test(raw[i]) || !raw[i].trim())) i++
      ref.code++; blankBefore = false; continue
    }
    blankBefore = false
    const line = lines[i]
    if (RE_HEADING.test(line)) { ref.heading++; i++; continue }
    if (RE_DIVIDER.test(line)) { ref.divider++; i++; continue }
    const li = RE_LIST.exec(line)
    // Un marqueur ordonné ≠ 1 hors suite est une AMBIGUÏTÉ du source (ligne repliée de prose,
    // cf. R-2a) : hors périmètre de l'invariant, il n'est pas compté.
    if (li && (listInterruptsParagraph(li[2], li[3]) || belongsToOrderedRun(lines, i))) ref.list++
    i++
  }
  return ref
}

// SONDE (3/3) : le rendu porte au moins autant de structures que le source en annonce.
// Retourne les écarts — vide = aucune structure fondue.
export function structureLoss(md, blocks) {
  const attendu = structureReference(md)
  const rendu = { heading: 0, divider: 0, list: 0, code: 0 }
  for (const b of blocks ?? markdownToBlocks(docBody(md))) {
    const k = STRUCT_OF[b.type]
    if (k) rendu[k]++
  }
  return Object.keys(attendu)
    .filter((k) => rendu[k] < attendu[k])
    .map((k) => ({ type: k, attendu: attendu[k], rendu: rendu[k] }))
}

// Multi-ensemble des mots de `before` absents de `after` (occurrences comprises).
export function wordDeficit(before, after) {
  const stock = new Map()
  for (const w of after) stock.set(w, (stock.get(w) || 0) + 1)
  const lost = []
  for (const w of before) {
    const n = stock.get(w) || 0
    if (n > 0) stock.set(w, n - 1)
    else lost.push(w)
  }
  return lost
}

// Tout le texte réellement porté par des blocs : inserts, `href` (une cible est du contenu)
// et langage de bloc de code. Surtout PAS `JSON.stringify` : son échappement `\n` collerait
// le « n » au mot suivant et la sonde inventerait des pertes.
export function renderedText(blocks) {
  const out = []
  const walk = (b) => {
    const d = (b && b.data) || {}
    if (d.language) out.push(String(d.language))
    for (const seg of d.delta || []) {
      out.push(String(seg.insert ?? ''))
      if (seg.attributes && seg.attributes.href) out.push(String(seg.attributes.href))
    }
    for (const c of (b && b.children) || []) walk(c)
  }
  for (const b of blocks || []) walk(b)
  return out.join('\n')
}

// SONDE : mots du source absents du rendu. Vide = conservation intégrale.
export function contentLoss(md, blocks) {
  const rendered = blocks ?? markdownToBlocks(docBody(md))
  return wordDeficit(contentWords(sourceReference(md)), contentWords(renderedText(rendered)))
}

// RENDER-SURFACE:BEGIN pages
// Mapping fichier → blocs. Le front-matter YAML (déjà servi au titre de page) et les
// commentaires HTML sont masqués du corps ; le reste passe par le mapper Markdown.
export function fileToBlocks(content) {
  return markdownToBlocks(docBody(String(content ?? '')))
}

// Blocs d'une page miroir : avertissement + contenu.
export function mirrorBlocks(relPath, content, generatedAtIso) {
  return [mirrorWarning(relPath, generatedAtIso), ...fileToBlocks(content)]
}

// ── Titres lisibles (§ 5.1 : plus jamais le chemin brut) ──

// Retire un éventuel front-matter YAML en tête (masqué du corps, exploité pour le titre).
export function stripFrontMatter(content) {
  const text = String(content ?? '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) return { body: text, front: '' }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { body: text, front: '' }
  const nl = text.indexOf('\n', end + 1)
  return { front: text.slice(4, end), body: nl === -1 ? '' : text.slice(nl + 1) }
}

// Nettoyage léger des marques inline dans un titre de page.
function cleanInline(s) {
  return String(s)
    .replace(/[`*_]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Clamp défensif : un nom de page AppFlowy démesuré est illisible.
export function clampTitle(title, max = 120) {
  const t = String(title ?? '').trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + '…'
}

// Titre lisible d'un document : 1er `#` du fichier ; à défaut le nom de fichier sans
// extension, tirets et underscores remplacés par des espaces.
export function readableTitle(relPath, content) {
  const { front, body } = stripFrontMatter(content ?? '')
  const fmTitle = /^\s*title\s*:\s*(.+)$/m.exec(front)
  if (fmTitle) {
    const t = cleanInline(fmTitle[1].replace(/^["']|["']$/g, ''))
    if (t) return clampTitle(t)
  }
  const m = /^#\s+(.+?)\s*#*\s*$/m.exec(body)
  if (m) {
    const t = cleanInline(m[1])
    if (t) return clampTitle(t)
  }
  const base = String(relPath).split(path.sep).join('/').split('/').pop() || String(relPath)
  const noExt = base.replace(/\.md$/i, '')
  return clampTitle(cleanInline(noExt.replace(/[-_]+/g, ' ')))
}

// Deux documents peuvent porter le même `#` : l'idempotence se faisant par NOM de page,
// on désambiguïse de façon déterministe avec le nom de fichier.
//
// Lot 4 — la collecte de `docs/**` est RÉCURSIVE : deux fichiers homonymes dans deux
// sous-dossiers (`docs/api/index.md`, `docs/cli/index.md`) partagent aussi leur nom de BASE.
// Le nom de base ne suffit donc plus : on retombe alors sur le chemin relatif, qui est
// unique par construction. Sans cela, deux pages porteraient le même nom et la réécriture
// de l'une corbeillerait l'autre à chaque passe — l'idempotence tombait.
export function dedupeTitles(entries) {
  const count = new Map()
  for (const e of entries) count.set(e.title, (count.get(e.title) || 0) + 1)
  const baseOf = (rel) => String(rel).split('/').pop().replace(/\.md$/i, '')
  // Compte des candidats « titre (base) » : s'il y en a plusieurs, le nom de base ment.
  const candCount = new Map()
  for (const e of entries) {
    if ((count.get(e.title) || 0) < 2) continue
    const c = `${e.title} (${baseOf(e.rel)})`
    candCount.set(c, (candCount.get(c) || 0) + 1)
  }
  return entries.map((e) => {
    if ((count.get(e.title) || 0) < 2) return { ...e }
    const cand = `${e.title} (${baseOf(e.rel)})`
    const suffix = (candCount.get(cand) || 0) > 1
      ? String(e.rel).replace(/\.md$/i, '')
      : baseOf(e.rel)
    return { ...e, title: clampTitle(`${e.title} (${suffix})`) }
  })
}

// RENDER-SURFACE:END pages

// ── Ordres canoniques (§ 5.6, critère A6) ──

// Extrait un triplet de version d'un nom de fichier `vX.Y.Z.md`.
export function parseVersion(relPath) {
  const base = String(relPath).split('/').pop() || ''
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(base)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

// Version décroissante (section 40), les non-versionnés en fin, par nom.
export function compareVersionDesc(a, b) {
  const va = parseVersion(a.rel), vb = parseVersion(b.rel)
  if (va && vb) {
    for (let i = 0; i < 3; i++) if (va[i] !== vb[i]) return vb[i] - va[i]
    return String(a.rel).localeCompare(String(b.rel))
  }
  if (va) return -1
  if (vb) return 1
  return String(a.rel).localeCompare(String(b.rel))
}

// Date de modification décroissante puis nom (sections 30 et 60).
export function compareRecentDesc(a, b) {
  const ma = Number(a.mtimeMs || 0), mb = Number(b.mtimeMs || 0)
  if (ma !== mb) return mb - ma
  return String(a.rel).localeCompare(String(b.rel))
}

// ── Plan de l'arborescence (pur) ──

// Construit le plan des sections présentes + la liste des sections absentes (A12).
// `docs` : [{ rel, title, mtimeMs }] déjà filtré (B1 appliqué en amont).
export function buildPlan({ project, docs = [], recettes = [] }) {
  const byRel = (rel) => docs.find((d) => d.rel === rel)
  const under = (prefix) => docs.filter((d) => d.rel.startsWith(prefix))

  const sections = []
  const missing = []

  // 00 — vue d'ensemble : toujours présente.
  sections.push({ key: '00', name: SEC.OVERVIEW, kind: 'overview', locked: true })

  // 10 — conteneur, enfants 11 et 12 selon présence des sources.
  const claude = byRel('CLAUDE.md')
  const projet = byRel('specs/PROJET.md')
  const children10 = []
  if (claude) children10.push({ name: SEC.CADRE, source: claude.rel, locked: true })
  if (projet) children10.push({ name: SEC.VISION, source: projet.rel, locked: true })
  if (children10.length) {
    sections.push({ key: '10', name: SEC.PROJET, kind: 'container', locked: true, children: children10 })
  } else {
    missing.push({ name: SEC.PROJET, reason: 'ni CLAUDE.md ni specs/PROJET.md' })
  }

  // 20 — page miroir simple.
  const etat = byRel('specs/etat-des-lieux.md')
  if (etat) sections.push({ key: '20', name: SEC.ETAT, kind: 'page', source: etat.rel, locked: true })
  else missing.push({ name: SEC.ETAT, reason: 'specs/etat-des-lieux.md absent' })

  // 30 — conteneur + index, une page par instruction, ordre = mtime décroissant puis nom.
  const instructions = dedupeTitles(under('specs/instructions/').slice().sort(compareRecentDesc))
  if (instructions.length) {
    sections.push({
      key: '30', name: SEC.CADRAGE, kind: 'container', locked: true,
      index: { name: indexName('30'), title: SEC.CADRAGE },
      children: instructions.map((d) => ({ name: d.title, source: d.rel, locked: true })),
    })
  } else {
    missing.push({ name: SEC.CADRAGE, reason: 'aucune instruction dans specs/instructions/' })
  }

  // 40 — conteneur + index, une page par version, ordre = version décroissante.
  const qualite = dedupeTitles(under('docs/qualite/').slice().sort(compareVersionDesc))
  if (qualite.length) {
    sections.push({
      key: '40', name: SEC.QUALITE, kind: 'container', locked: true,
      index: { name: indexName('40'), title: SEC.QUALITE },
      children: qualite.map((d) => ({ name: d.title, source: d.rel, locked: true })),
    })
  } else {
    missing.push({ name: SEC.QUALITE, reason: 'aucun rapport dans docs/qualite/' })
  }

  // 50 — recette : TOUJOURS présente (A12). Sans recette, elle affiche « aucune recette » —
  // rendre ce vide visible EST le livrable, pas un défaut.
  const recette = recetteStatus(recettes)
  sections.push({ key: '50', name: SEC.RECETTE, kind: 'recette', locked: true, status: recette })

  // 60 — conteneur + index, une page par doc de `docs/` hors `qualite/`, ordre = mtime
  // décroissant puis nom (§ 5.6). ABSENTE si vide, avec sa raison en `00` (critère A12).
  const guide = dedupeTitles(docs.filter((d) => isGuideDoc(d.rel)).slice().sort(compareRecentDesc))
  if (guide.length) {
    sections.push({
      key: '60', name: SEC.GUIDE, kind: 'container', locked: true,
      index: { name: indexName('60'), title: SEC.GUIDE },
      children: guide.map((d) => ({ name: d.title, source: d.rel, locked: true })),
    })
  } else {
    missing.push({ name: SEC.GUIDE, reason: 'aucun document dans docs/ hors qualite/' })
  }

  // 90 — zone humaine : create-if-missing, jamais réécrite, jamais verrouillée (J3).
  sections.push({ key: '90', name: SEC.NOTES, kind: 'human', locked: false })

  return {
    project,
    sections,
    missing,
    version: latestVersion(qualite),
    counters: {
      instructions: instructions.length,
      qualite: qualite.length,
      recette: recette.count ? `${recette.count} (statut seul)` : 'aucune recette',
      guide: guide.length,
    },
  }
}

// Version du projet déduite des rapports qualité (la plus haute), sinon null.
export function latestVersion(qualiteDocs) {
  const sorted = (qualiteDocs || []).slice().sort(compareVersionDesc)
  for (const d of sorted) {
    const v = parseVersion(d.rel)
    if (v) return `v${v[0]}.${v[1]}.${v[2]}`
  }
  return null
}

// RENDER-SURFACE:BEGIN sections
// Blocs d'une page d'index (§ 5.6 : ordre canonique, régénéré à chaque passe).
export function indexBlocks(section, generatedAtIso) {
  return [
    mirrorWarning(SOURCE_REPO, generatedAtIso),
    heading(1, `${section.name} — index`),
    para(`${section.children.length} page(s), dans l'ordre canonique :`),
    ...section.children.map((c) => bullet(c.name)),
  ]
}

// ── `50 · Recette (RQV)` — le STATUT seul (§ 5.2), JAMAIS le HTML ──
//
// Une recette guidée est un document HTML autonome (CSS + JS inline, ~27 ko) destiné à être
// OUVERT dans un navigateur et coché à la main. Le republier en blocs AppFlowy ne produirait
// ni une recette utilisable ni un texte lisible : seul son STATUT entre dans le miroir.
// Conséquence de conception, et pas seulement de politesse : le fichier n'est **jamais lu**.
// Seules sa présence, son nom et sa date de modification circulent.

// Version portée par un nom de recette. Le gabarit canon nomme les recettes remplies
// `recette-vX.Y.0.html` (`specs/instructions/recette-guidee-rqv.md`), l'instruction du
// portail écrit `*.recette.html` : on cherche donc un triplet N'IMPORTE OÙ dans le nom de
// base, ce qui couvre les deux conventions sans en privilégier une.
export function parseRecetteVersion(relPath) {
  const base = String(relPath ?? '').split('/').pop() || ''
  const m = /v?(\d+)\.(\d+)\.(\d+)/.exec(base)
  return m ? `v${Number(m[1])}.${Number(m[2])}.${Number(m[3])}` : null
}

// Recette la plus récente d'abord : version décroissante, puis mtime décroissant, puis nom.
export function compareRecetteDesc(a, b) {
  const va = parseRecetteVersion(a.rel), vb = parseRecetteVersion(b.rel)
  if (va && vb && va !== vb) {
    const na = va.slice(1).split('.').map(Number), nb = vb.slice(1).split('.').map(Number)
    for (let i = 0; i < 3; i++) if (na[i] !== nb[i]) return nb[i] - na[i]
  }
  if (va && !vb) return -1
  if (vb && !va) return 1
  const ma = Number(a.mtimeMs || 0), mb = Number(b.mtimeMs || 0)
  if (ma !== mb) return mb - ma
  return String(a.rel).localeCompare(String(b.rel))
}

// Date lisible (jour) d'un mtime. `0` / absent -> « date inconnue » plutôt qu'une époque
// fausse : un miroir n'invente pas un fait qu'il n'a pas.
export function shortDate(mtimeMs) {
  const n = Number(mtimeMs)
  if (!Number.isFinite(n) || n <= 0) return 'date inconnue'
  return new Date(n).toISOString().slice(0, 10)
}

// PUR — statut des recettes. `recettes` : [{ rel, mtimeMs }] (B1 déjà appliqué en amont).
export function recetteStatus(recettes = []) {
  const list = (recettes || []).slice().sort(compareRecetteDesc)
  return {
    count: list.length,
    entries: list.map((r) => ({
      rel: r.rel,
      name: String(r.rel).split('/').pop(),
      version: parseRecetteVersion(r.rel),
      date: shortDate(r.mtimeMs),
    })),
  }
}

// Blocs de `50` — A12 : SANS recette, la section existe et le DIT explicitement. Ce vide
// affiché est un fait du portefeuille, pas un défaut à masquer.
export function recetteBlocks(status, generatedAtIso) {
  const s = status || { count: 0, entries: [] }
  if (!s.count) {
    return [
      mirrorWarning(SOURCE_REPO, generatedAtIso),
      heading(1, SEC.RECETTE),
      para('aucune recette — ce projet n’a pas de recette guidée (RQV) dans specs/recettes/.'),
      para('Le statut seul est publié ici ; le document de recette n’est jamais reproduit dans '
        + 'AppFlowy — il s’ouvre depuis le dépôt, dans un navigateur.'),
    ]
  }
  return [
    mirrorWarning(SOURCE_REPO, generatedAtIso),
    heading(1, SEC.RECETTE),
    para(`${s.count} recette(s) guidée(s) dans specs/recettes/ — STATUT seul, le document `
      + `lui-même n’est jamais publié ici : il s’ouvre depuis le dépôt, dans un navigateur.`),
    ...s.entries.map((e) => bullet(
      `${e.name} — version ${e.version || 'non déduite du nom'} — modifiée le ${e.date}`,
    )),
  ]
}

// Blocs de la vue d'ensemble enrichie (livrable 3 du lot 1).
export function overviewBlocks(plan, generatedAtIso) {
  const missing = plan.missing || []
  return [
    mirrorWarning(SOURCE_REPO, generatedAtIso),
    heading(1, plan.project),
    para(`Version : ${plan.version || 'non établie'}`),
    para(`Publié le : ${generatedAtIso}`),
    heading(2, 'Sections présentes'),
    ...plan.sections.map((s) => bullet(s.name)),
    heading(2, 'Sections absentes'),
    ...(missing.length ? missing.map((m) => bullet(`${m.name} — ${m.reason}`)) : [para('aucune')]),
    // Arbitrage lot 4 : ce que la skill n'a pas écrit n'est jamais retiré — il est DIT ici.
    heading(2, 'Pages non gérées'),
    ...((plan.unmanaged || []).length
      ? (plan.unmanaged || []).map((u) => bullet(
        `${u.name} — sous « ${u.where} » — laissée en place : la publication ne l'a pas créée`))
      : [para('aucune')]),
    heading(2, 'Compteurs'),
    bullet(`Instructions : ${plan.counters.instructions}`),
    bullet(`Versions qualité : ${plan.counters.qualite}`),
    bullet(`Recette (RQV) : ${plan.counters.recette}`),
    bullet(`Guide utilisateur : ${plan.counters.guide ?? 0}`),
    para(`Pages 00–60 : générées depuis le dépôt, à ne pas modifier ici. ` +
      `${SEC.NOTES} est la zone d'écriture humaine.`),
  ]
}

// RENDER-SURFACE:END sections

// Découpe une liste de blocs en lots (limite de taille de requête défensive).
export function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ── Ordre des frères (J2) : plan de `move` minimal, pur et testable ──

// `currentIds` : ordre actuel des enfants (tel que relu dans /folder).
// `desiredIds` : ordre canonique voulu. Retourne la liste minimale de déplacements
// [{ view_id, prev_view_id }] (prev_view_id null = placer en tête).
export function planMoves(currentIds, desiredIds) {
  const wanted = new Set(desiredIds)
  const order = currentIds.filter((id) => wanted.has(id))
  const moves = []
  for (let i = 0; i < desiredIds.length; i++) {
    const id = desiredIds[i]
    const pos = order.indexOf(id)
    if (pos === -1) continue // page inconnue de l'arbre relu : rien à déplacer
    const wantPrev = i === 0 ? null : desiredIds[i - 1]
    const havePrev = pos === 0 ? null : order[pos - 1]
    if (havePrev === wantPrev) continue
    moves.push({ view_id: id, prev_view_id: wantPrev })
    order.splice(pos, 1)
    const target = wantPrev === null ? 0 : order.indexOf(wantPrev) + 1
    order.splice(target, 0, id)
  }
  return moves
}

// ═══════════ Incrémentalité par empreinte (§ 5.5, critère A8) — fonctions pures ═══════════
//
// L'empreinte est prise CÔTÉ SOURCE (le Markdown du dépôt) : le contenu d'une page AppFlowy
// revient en `encoded_collab`, le hacher côté serveur coûterait un décodage (établi au spike).
// Elle intègre `RENDER_VERSION` : changer le mapper ou le modèle invalide tout le cache, sans
// quoi une page resterait figée sur un rendu périmé.

// ⚠️ À INCRÉMENTER à toute évolution du rendu (mapper, avertissement, index, vue d'ensemble).
export const RENDER_VERSION = 'lot4'

// Separateur NUL ECHAPPE, jamais un octet nul BRUT dans la source. Deux raisons, pas une :
//   1. semantique — deux parties concatenees ne peuvent pas imiter un autre decoupage ;
//   2. lisibilite — un octet nul brut rend le fichier « binaire » pour grep : `grep` sans
//      `-a` ne rend RIEN, et tout balayage de revue devient AVEUGLE sur ce fichier — celui
//      qui porte pourtant le contrat de rendu. Meme regle que `renderSurfaceDigest()`.
const NUL = '\u0000'

export function fingerprint(...parts) {
  const h = createHash('sha256')
  h.update(RENDER_VERSION)
  for (const p of parts) { h.update(NUL); h.update(String(p ?? '')) }
  return h.digest('hex')
}

// Clé d'identité stable d'une page dans l'espace : son chemin de NOMS depuis l'espace.
export function pageKey(...names) {
  return names.filter(Boolean).join(' ⟩ ')
}

// Un nom de projet ne doit jamais s'échapper en chemin de fichier.
export function safeFileName(name) {
  return (String(name ?? '').replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^\.+/, '_').slice(0, 120)) || 'projet'
}

// État HORS DÉPÔT (§ 5.5) : ~/.cache/iakaframe/appflowy/<workspace_id>/<projet>.json
export function cachePath(env, workspaceId, project) {
  const base = env.IAKAFRAME_CACHE_DIR || path.join(os.homedir(), '.cache', 'iakaframe', 'appflowy')
  return path.join(base, safeFileName(workspaceId), safeFileName(project) + '.json')
}

// Lecture DÉFENSIVE : absent, illisible, corrompu ou d'un autre rendu -> vide. La passe
// suivante réécrit alors tout : dégradation propre, jamais de corruption (§ 5.5).
export function readCache(file, fsApi = fs) {
  try {
    const j = JSON.parse(fsApi.readFileSync(file, 'utf8'))
    if (!j || j.render !== RENDER_VERSION || typeof j.pages !== 'object' || !j.pages) return { pages: {} }
    return { spaceId: j.spaceId, pages: j.pages }
  } catch { return { pages: {} } }
}

// Écriture défensive : un cache non écrit dégrade la passe suivante, il ne la casse pas.
export function writeCache(file, data, fsApi = fs) {
  try {
    fsApi.mkdirSync(path.dirname(file), { recursive: true })
    fsApi.writeFileSync(file, JSON.stringify({ render: RENDER_VERSION, ...data }, null, 1))
    return true
  } catch { return false }
}

// ── Balayage des orphelins (correction B3, critère A10) ──
//
// ARBITRAGE DU DÉCIDEUR, lot 4 — LE BALAYAGE NE RETIRE QUE CE QUE LA SKILL A CRÉÉ.
//
// Avant : toute page non attendue partait à la corbeille. Une page humaine posée dans `30`
// ou à la racine de l'espace — qui n'avait jamais transité par la skill — était donc
// détruite (scénario L9 du gate : `corbeille = ["Page humaine dans 30", "Page humaine à la
// racine"]`). Le décideur a tranché contre : on garde le miroir propre SANS JAMAIS détruire
// ce qu'on n'a pas écrit.
//
// Le discriminant est la TRAÇABILITÉ : le cache d'empreintes mémorise le `view_id` de chaque
// page que la skill a créée. Une page non attendue dont le `view_id` est connu est une
// ORPHELINE (sa source a disparu ou a été renommée) : elle part à la corbeille. Une page non
// attendue et INCONNUE est laissée en place, et SIGNALÉE dans `00 · Vue d'ensemble`.
//
// DÉGRADATION DÉCLARÉE : cache perdu => plus aucun `view_id` connu => plus rien n'est balayé,
// et les vraies orphelines sont signalées comme « non gérées » au lieu d'être retirées. C'est
// le sens SÛR de la dégradation : on préfère un miroir qui garde une page morte à un miroir
// qui détruit une page humaine.
//
// `90 · Notes` (et tout son sous-arbre, jamais visité) reste EXCLU sans condition — c'est la
// zone humaine, elle n'est le sujet d'aucun ciblage, connue ou non (§ 5.4).

// PUR : range les enfants NON ATTENDUS d'un parent en deux tas — ce que la skill a écrit
// (orphelines) et ce qu'elle n'a jamais écrit (non gérées).
export function classifyUnexpected(parentNode, expectedNames, knownIds) {
  const attendus = new Set(expectedNames)
  const connus = knownIds instanceof Set ? knownIds : new Set(knownIds || [])
  const orphans = []
  const unmanaged = []
  for (const c of childrenOf(parentNode)) {
    if (c.name === SEC.NOTES) continue      // § 5.4 — inviolable, sans condition
    if (attendus.has(c.name)) continue
    const item = { view_id: c.view_id, name: c.name }
    if (connus.has(c.view_id)) orphans.push(item)
    else unmanaged.push(item)
  }
  return { orphans, unmanaged }
}

// Ce qui part à la corbeille : les orphelines SEULEMENT.
export function planOrphans(parentNode, expectedNames, knownIds) {
  return classifyUnexpected(parentNode, expectedNames, knownIds).orphans
}

// Ce qui est laissé en place et signalé.
export function planUnmanaged(parentNode, expectedNames, knownIds) {
  return classifyUnexpected(parentNode, expectedNames, knownIds).unmanaged
}

// PUR — noms attendus par emplacement : le niveau de l'espace, puis chaque conteneur.
// Dérivé du seul plan : c'est ce qui permet de connaître les pages non gérées AVANT de
// composer `00 · Vue d'ensemble`, qui doit les lister.
export function expectedNames(plan) {
  const top = []
  const containers = []
  for (const s of (plan && plan.sections) || []) {
    top.push(s.name)
    if (s.kind !== 'container') continue
    const names = []
    if (s.index) names.push(s.index.name)
    for (const c of s.children || []) names.push(c.name)
    containers.push({ name: s.name, names })
  }
  return { top, containers }
}

// PUR — `view_id` que la skill sait avoir écrits, lus dans l'état d'empreintes.
export function knownViewIds(cache) {
  const pages = (cache && cache.pages) || {}
  return new Set(Object.values(pages).map((p) => p && p.viewId).filter(Boolean))
}

// ── Sélection du workspace (correction B2) ──

// Parse défensif d'un texte dotenv (PUR, sans I/O) -> { KEY: VALUE }.
export function parseDotenv(text) {
  const out = {}
  if (!text) return out
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    if (!key) continue
    let value = line.slice(eq + 1).trim()
    if (value.length >= 2) {
      const q = value[0]
      if ((q === '"' || q === "'") && value[value.length - 1] === q) {
        value = value.slice(1, -1)
      }
    }
    out[key] = value
  }
  return out
}

// Chemin du fichier d'identifiants (override env, sinon ~/.config/iakaframe/appflowy.env).
export function appflowyEnvPath(env) {
  if (env.IAKAFRAME_APPFLOWY_ENV) return env.IAKAFRAME_APPFLOWY_ENV
  return path.join(os.homedir(), '.config', 'iakaframe', 'appflowy.env')
}

// Nom lisible d'un workspace tel que renvoyé par l'API (défensif sur le champ).
export function workspaceLabel(ws) {
  return ws?.workspace_name ?? ws?.name ?? ''
}

// PUR — choisit le workspace par identifiant EXPLICITE. Jamais `data[0]`.
// `selector` : un workspace_id OU un nom exact. Aucune correspondance -> exception
// citant les workspaces disponibles (noms + ids, ce ne sont pas des secrets).
export function pickWorkspace(workspaces, selector) {
  const list = Array.isArray(workspaces) ? workspaces : []
  const want = String(selector ?? '').trim()
  if (!want) {
    throw new AppFlowyError('workspace cible non défini : renseigne APPFLOWY_WORKSPACE (nom ou id)')
  }
  const byId = list.find((w) => String(w.workspace_id) === want)
  if (byId) return byId
  const byName = list.filter((w) => workspaceLabel(w) === want)
  if (byName.length === 1) return byName[0]
  if (byName.length > 1) {
    throw new AppFlowyError(
      `workspace ambigu : ${byName.length} workspaces nommés « ${want} ». ` +
      `Désigne-le par son workspace_id : ${byName.map((w) => w.workspace_id).join(', ')}`,
    )
  }
  const dispo = list.length
    ? list.map((w) => `« ${workspaceLabel(w)} » (${w.workspace_id})`).join(', ')
    : 'aucun'
  throw new AppFlowyError(
    `workspace introuvable : « ${want} ». Workspaces accessibles : ${dispo}. ` +
    `Corrige APPFLOWY_WORKSPACE — aucun repli automatique n'est appliqué.`,
  )
}

// ───────────────────────── I/O fichiers ─────────────────────────

// Résout les chemins relatifs des docs structurants réellement présents sous root.
// B1 : les fichiers dont le nom de base commence par `_` sont écartés ici ET dans le prédicat.
export function resolveDocPaths(root, fsApi = fs) {
  const out = []
  const exists = (rel) => {
    try { return fsApi.statSync(path.join(root, rel)).isFile() } catch { return false }
  }
  for (const fixed of ['CLAUDE.md', 'specs/PROJET.md', 'specs/etat-des-lieux.md']) {
    if (exists(fixed)) out.push(fixed)
  }
  for (const dir of ['specs/instructions', 'docs/qualite']) {
    let entries = []
    try { entries = fsApi.readdirSync(path.join(root, dir)) } catch { entries = [] }
    for (const e of entries) {
      const rel = dir + '/' + e
      if (isTemplateFile(e)) continue // B1 — sans exception
      if (e.endsWith('.md') && exists(rel)) out.push(rel)
    }
  }
  // Lot 4 — `60 · Guide utilisateur` : `docs/**.md` HORS `qualite/`, en PROFONDEUR (le
  // contrat dit `**`, pas `*` : `docs/guides/prise-en-main.md` compte). Le sous-arbre
  // `qualite/` est sauté ici, il est déjà collecté à plat ci-dessus pour la section 40.
  for (const rel of walkGuideDocs(root, fsApi)) out.push(rel)
  return selectStructuralDocs(out)
}

// Parcours récurent de `docs/`, borné et défensif : jamais `qualite/`, jamais un dossier
// caché ou de dépendances, profondeur plafonnée (un `docs/` pathologique ne doit pas faire
// diverger une passe de publication).
export function walkGuideDocs(root, fsApi = fs, maxDepth = 6) {
  const out = []
  const IGNORE = new Set(['qualite', 'node_modules', 'target', 'dist', 'build', 'vendor'])
  const isDir = (rel) => {
    try {
      const st = fsApi.statSync(path.join(root, rel))
      return typeof st.isDirectory === 'function' ? st.isDirectory() : false
    } catch { return false }
  }
  const walk = (rel, depth) => {
    if (depth > maxDepth) return
    let entries = []
    try { entries = fsApi.readdirSync(path.join(root, rel)) } catch { return }
    for (const name of entries.map(String)) {
      if (name.startsWith('.')) continue
      const child = rel + '/' + name
      if (isDir(child)) {
        if (!IGNORE.has(name)) walk(child, depth + 1)
        continue
      }
      if (!name.endsWith('.md') || isTemplateFile(name)) continue // B1 — sans exception
      out.push(child)
    }
  }
  walk('docs', 0)
  return out.sort()
}

/**
 * Recettes guidées présentes sous `specs/recettes/` — pour la section `50`, STATUT SEUL.
 *
 * ⚠️ Le contenu n'est **JAMAIS** lu : cette fonction n'appelle pas `readFileSync`. C'est la
 * garantie structurelle de « jamais le HTML » — non pas une intention, mais une absence
 * d'appel, qu'un test peut constater en refusant toute lecture au faux `fsApi`.
 *
 * Le nom canon des recettes remplies est `recette-vX.Y.0.html` (gabarit RQV) ; l'instruction
 * du portail écrit `*.recette.html`. On retient donc **tout `.html`** du dossier, hors
 * gabarits `_*` (B1, qui écarte précisément `_TEMPLATE.recette.html`).
 */
export function resolveRecettes(root, fsApi = fs) {
  const dir = 'specs/recettes'
  let entries = []
  try { entries = fsApi.readdirSync(path.join(root, dir)) } catch { return [] }
  const out = []
  for (const name of entries.map(String)) {
    if (!name.toLowerCase().endsWith('.html')) continue
    if (isTemplateFile(name)) continue // B1 — sans exception
    const rel = dir + '/' + name
    let mtimeMs = 0
    try {
      const st = fsApi.statSync(path.join(root, rel))
      if (typeof st.isFile === 'function' && !st.isFile()) continue
      mtimeMs = st.mtimeMs || 0
    } catch { continue }
    out.push({ rel, mtimeMs })
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel))
}

// Charge les documents (contenu + titre lisible + mtime). Fichier illisible -> ignoré.
export function loadDocs(root, relPaths, fsApi = fs) {
  const docs = []
  const skipped = []
  for (const rel of relPaths) {
    let content, mtimeMs = 0
    try {
      content = fsApi.readFileSync(path.join(root, rel), 'utf8')
      try { mtimeMs = fsApi.statSync(path.join(root, rel)).mtimeMs || 0 } catch { mtimeMs = 0 }
    } catch {
      skipped.push(rel)
      continue
    }
    docs.push({ rel, content, mtimeMs, title: readableTitle(rel, content) })
  }
  return { docs, skipped }
}

// Lecture défensive du fichier d'identifiants (I/O isolée du parseur pur).
function readEnvFile(filePath, fsApi = fs) {
  try {
    return parseDotenv(fsApi.readFileSync(filePath, 'utf8'))
  } catch {
    return {}
  }
}

// Résout les identifiants en cascade : env d'abord, puis fichier pour les manquants.
export function resolveCredentials(env, fsApi = fs) {
  const KEYS = ['APPFLOWY_URL', 'APPFLOWY_EMAIL', 'APPFLOWY_PASSWORD']
  const creds = {}
  for (const k of KEYS) creds[k] = env[k]
  if (KEYS.some((k) => !creds[k])) {
    const fromFile = readEnvFile(appflowyEnvPath(env), fsApi)
    for (const k of KEYS) if (!creds[k] && fromFile[k]) creds[k] = fromFile[k]
  }
  return {
    base: creds.APPFLOWY_URL,
    email: creds.APPFLOWY_EMAIL,
    password: creds.APPFLOWY_PASSWORD,
  }
}

// Sélecteur de workspace en cascade : argument CLI → env → fichier → défaut « projects ».
export function resolveWorkspaceSelector(env, fsApi = fs, cliValue) {
  if (cliValue) return { selector: cliValue, from: '--workspace' }
  if (env.APPFLOWY_WORKSPACE) return { selector: env.APPFLOWY_WORKSPACE, from: 'env APPFLOWY_WORKSPACE' }
  const fromFile = readEnvFile(appflowyEnvPath(env), fsApi)
  if (fromFile.APPFLOWY_WORKSPACE) {
    return { selector: fromFile.APPFLOWY_WORKSPACE, from: appflowyEnvPath(env) }
  }
  return { selector: DEFAULT_WORKSPACE, from: 'défaut' }
}

// Parse minimaliste des arguments CLI.
export function parseArgs(argv) {
  const list = Array.isArray(argv) ? argv : []
  const get = (name) => {
    const i = list.indexOf('--' + name)
    return i !== -1 && list[i + 1] && !String(list[i + 1]).startsWith('--') ? list[i + 1] : undefined
  }
  return { project: get('project'), root: get('root'), workspace: get('workspace') }
}

// ───────────────────────── Client HTTP AppFlowy ─────────────────────────

export class AppFlowyError extends Error {}

export class AppFlowyClient {
  constructor({ base, email, password }) {
    this.base = String(base).replace(/\/+$/, '')
    this.email = email
    this.password = password
    this.token = null
    this.wid = null
    this.workspaceName = null
    this.calls = { total: 0, writes: 0 }
  }

  async _req(method, p, body, _retried = false) {
    this.calls.total++
    if (method !== 'GET') this.calls.writes++
    let r
    try {
      r = await fetch(this.base + p, {
        method,
        headers: {
          ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}),
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (e) {
      throw new AppFlowyError(`instance injoignable (${this.base}) : ${e.cause?.code || e.message}`)
    }
    // Token expiré -> ré-auth une fois puis on rejoue.
    if (r.status === 401 && !_retried && this.token) {
      await this.auth()
      return this._req(method, p, body, true)
    }
    const text = await r.text()
    let j
    try { j = text ? JSON.parse(text) : {} } catch { j = { _raw: text } }
    if (r.status < 200 || r.status >= 300) {
      throw new AppFlowyError(`${method} ${p} -> HTTP ${r.status} ${(j.message || j._raw || '').slice(0, 160)}`)
    }
    return j
  }

  async auth() {
    let r
    try {
      r = await fetch(this.base + '/gotrue/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.email, password: this.password }),
      })
    } catch (e) {
      throw new AppFlowyError(`instance injoignable (${this.base}) : ${e.cause?.code || e.message}`)
    }
    const j = await r.json().catch(() => ({}))
    if (!r.ok || !j.access_token) {
      throw new AppFlowyError(`authentification refusée (HTTP ${r.status} ${j.msg || j.error_code || ''})`)
    }
    this.token = j.access_token
    return this.token
  }

  // Provision idempotente de l'af_user (crée le compte applicatif si absent).
  async provision() {
    await this._req('GET', '/api/user/verify/' + this.token)
  }

  async listWorkspaces() {
    const j = await this._req('GET', '/api/workspace')
    return j.data || []
  }

  // B2 — sélection EXPLICITE. Aucun repli sur data[0].
  async resolveWorkspace(selector) {
    const ws = pickWorkspace(await this.listWorkspaces(), selector)
    this.wid = ws.workspace_id
    this.workspaceName = workspaceLabel(ws)
    return this.wid
  }

  // J1 — depth ≥ 6 : `/folder` tronque strictement, depth=4 amputerait le modèle 00–90.
  async folder(depth = 6) {
    const d = Math.max(6, Number(depth) || 0)
    const j = await this._req('GET', `/api/workspace/${this.wid}/folder?depth=${d}`)
    return j.data
  }

  async createSpace(name) {
    const j = await this._req('POST', `/api/workspace/${this.wid}/space`, {
      name,
      space_permission: 0,
      space_icon: 'interface_essential/folder',
      space_icon_color: '0xFF9327FF',
    })
    return j.data.view_id
  }

  async createPage(parentViewId, name) {
    const j = await this._req('POST', `/api/workspace/${this.wid}/page-view`, {
      parent_view_id: parentViewId,
      layout: 0,
      name,
    })
    return j.data.view_id
  }

  async appendBlocks(viewId, blocks) {
    for (const group of chunk(blocks, 80)) {
      await this._req('POST', `/api/workspace/${this.wid}/page-view/${viewId}/append-block`, { blocks: group })
    }
  }

  // J3 — `name` est OBLIGATOIRE dans ce PATCH (400 sinon).
  async patchPage(viewId, name, patch = {}) {
    await this._req('PATCH', `/api/workspace/${this.wid}/page-view/${viewId}`, { name, ...patch })
  }

  async setLocked(viewId, name, locked = true) {
    await this.patchPage(viewId, name, { is_locked: !!locked })
  }

  // J2 — ordre des frères : prev_view_id null = en tête.
  async movePage(viewId, newParentViewId, prevViewId = null) {
    await this._req('POST', `/api/workspace/${this.wid}/page-view/${viewId}/move`, {
      new_parent_view_id: newParentViewId,
      prev_view_id: prevViewId,
    })
  }

  async moveToTrash(viewId) {
    await this._req('POST', `/api/workspace/${this.wid}/page-view/${viewId}/move-to-trash`)
  }

  // S7 — la charge utile est `data.views`, pas `data`.
  async listTrash() {
    const j = await this._req('GET', `/api/workspace/${this.wid}/trash`)
    return j.data?.views || j.data || []
  }

  // DESTRUCTIF — suppression définitive. Jamais appelé par le chemin de publication.
  async deleteFromTrash(viewId) {
    await this._req('DELETE', `/api/workspace/${this.wid}/trash/${viewId}`)
  }
}

// ───────────────────────── Helpers d'arbre ─────────────────────────

export function childrenOf(node) {
  return (node && node.children) || []
}

export function findByName(node, name) {
  return childrenOf(node).find((c) => c.name === name) || null
}

export function findSpace(root, project) {
  return childrenOf(root).find((c) => c.is_space && c.name === project) || null
}

export function findNodeById(root, viewId) {
  if (!root) return null
  if (root.view_id === viewId) return root
  for (const c of childrenOf(root)) {
    const hit = findNodeById(c, viewId)
    if (hit) return hit
  }
  return null
}

// ───────────────────────── Orchestration ─────────────────────────

// Garantit l'espace projet (réutilise par nom, sinon crée).
async function ensureSpace(client, root, project) {
  const found = findSpace(root, project)
  if (found) return { id: found.view_id, created: false }
  const id = await client.createSpace(project)
  return { id, created: true }
}

// Garantit une page conteneur : créée UNE FOIS, jamais mise à la corbeille (§ 5.6).
async function ensureContainer(client, parentNode, parentId, name) {
  const found = findByName(parentNode, name)
  if (found) return { id: found.view_id, created: false }
  const id = await client.createPage(parentId, name)
  return { id, created: true }
}

// Recrée une page générée par nom (corbeille de l'existante puis création fraîche).
// `replaced` est un COMPTE, pas un booléen (R-C) : une réécriture alimente la corbeille, et
// ce débris doit apparaître au compte rendu.
async function rewritePage(client, parentNode, parentId, name, blocks) {
  const existing = childrenOf(parentNode).filter((c) => c.name === name)
  for (const e of existing) await client.moveToTrash(e.view_id)
  const vid = await client.createPage(parentId, name)
  if (blocks.length) await client.appendBlocks(vid, blocks)
  return { vid, replaced: existing.length }
}

/**
 * A8 — une page générée, synchronisée par EMPREINTE.
 * Empreinte inchangée + page toujours en place, seule sous son nom, déjà verrouillée
 * => ZÉRO appel d'écriture. C'est ce qui fait tomber la 2ᵉ passe à 0 écriture et tarit
 * la source des débris de corbeille (une réécriture = un débris).
 */
async function syncPage(ctx, parentNode, parentId, key, name, blocks, hash) {
  const memo = ctx.cache.pages[key]
  const existing = childrenOf(parentNode).filter((c) => c.name === name)
  if (existing.length === 1 && memo && memo.hash === hash
      && memo.viewId === existing[0].view_id && memo.locked === true) {
    ctx.next[key] = { viewId: memo.viewId, hash, locked: true }
    ctx.stats.unchanged++
    return { vid: memo.viewId, state: 'inchangé' }
  }
  const r = await rewritePage(ctx.client, parentNode, parentId, name, blocks)
  ctx.next[key] = { viewId: r.vid, hash, locked: false }
  // R-C : les anciennes versions partent bien à la corbeille — on les COMPTE au lieu de les
  // taire. Un « 0 retirée(s) » en alimentant la corbeille est un compte rendu FAUX.
  ctx.stats.replaced += r.replaced
  r.replaced ? ctx.stats.updated++ : ctx.stats.created++
  return { vid: r.vid, state: r.replaced ? 'à jour' : 'créé' }
}

// § 5.4 — `90 · Notes` : créée si absente, JAMAIS réécrite, JAMAIS verrouillée.
async function ensureNotes(client, spaceNode, spaceId, generatedAtIso) {
  const found = findByName(spaceNode, SEC.NOTES)
  if (found) return { id: found.view_id, created: false }
  const vid = await client.createPage(spaceId, SEC.NOTES)
  await client.appendBlocks(vid, [
    para(`Zone d'écriture humaine. Cette page et ses sous-pages ne sont JAMAIS modifiées ` +
      `ni supprimées par la publication automatique (créée le ${generatedAtIso}).`),
  ])
  return { id: vid, created: true }
}

export async function run(argv, env, deps = {}) {
  const fsApi = deps.fs || fs
  const log = deps.log || console.log
  const now = deps.now || (() => new Date())
  const makeClient = deps.makeClient || ((c) => new AppFlowyClient(c))

  const { project, root, workspace } = parseArgs(argv)
  if (!project || !root) {
    throw new AppFlowyError(
      'usage : node appflowy-doc.mjs --project <nom> --root <chemin-projet> [--workspace <nom|id>]',
    )
  }
  const { base, email, password } = resolveCredentials(env, fsApi)
  if (!base || !email || !password) {
    throw new AppFlowyError(
      `config manquante : définis APPFLOWY_URL/EMAIL/PASSWORD (env), ` +
      `ou renseigne ${appflowyEnvPath(env)}`,
    )
  }
  if (!fsApi.existsSync(root)) {
    throw new AppFlowyError(`chemin projet introuvable : ${root}`)
  }
  const { selector, from } = resolveWorkspaceSelector(env, fsApi, workspace)

  const relPaths = resolveDocPaths(root, fsApi)
  const { docs, skipped } = loadDocs(root, relPaths, fsApi)
  // Section 50 : STATUT seul. Les recettes ne passent PAS par `loadDocs` — leur contenu
  // n'est jamais chargé, donc jamais publiable, même par accident.
  const recettes = resolveRecettes(root, fsApi)
  for (const s of skipped) log(`  - ${s} : ignoré (lecture impossible)`)
  log(`appflowy-doc: projet "${project}" — ${docs.length} doc(s) structurant(s) retenu(s)`
    + `, ${recettes.length} recette(s) en statut`)

  const client = makeClient({ base, email, password })
  await client.auth()
  await client.provision()
  await client.resolveWorkspace(selector)
  log(`appflowy-doc: workspace « ${client.workspaceName} » (${String(client.wid).slice(0, 8)}) — sélecteur « ${selector} » (${from})`)

  const generatedAt = now().toISOString()
  const plan = buildPlan({ project, docs, recettes })

  let tree = await client.folder()
  const space = await ensureSpace(client, tree, project)
  log(`appflowy-doc: espace "${project}" ${space.created ? 'créé' : 'réutilisé'} (${space.id.slice(0, 8)})`)

  // On relit l'arbre : les enfants existants conditionnent l'idempotence par nom.
  tree = await client.folder()
  let spaceNode = findNodeById(tree, space.id) || { view_id: space.id, children: [] }

  const contentOf = (rel) => (docs.find((d) => d.rel === rel) || {}).content ?? ''
  const stats = {
    created: 0, updated: 0, unchanged: 0, containers: 0, locked: 0, moves: 0, removed: 0,
    replaced: 0, unmanaged: 0,
  }
  // A8 — état d'empreintes, HORS DÉPÔT. Cache perdu => tout est réécrit (dégradation propre).
  const cacheFile = cachePath(env, client.wid, project)
  const cache = readCache(cacheFile, fsApi)
  const ctx = { client, cache, next: {}, stats }

  // Arbitrage lot 4 — le balayage ne retire que ce que la skill a créé. On relève les pages
  // NON GÉRÉES **avant** la boucle : `00 · Vue d'ensemble` doit pouvoir les lister, et elle
  // est la première section traitée.
  const known = knownViewIds(cache)
  const attendus = expectedNames(plan)
  plan.unmanaged = []
  for (const u of planUnmanaged(spaceNode, attendus.top, known)) {
    plan.unmanaged.push({ name: u.name, where: project })
  }
  for (const c of attendus.containers) {
    const node = findByName(spaceNode, c.name)
    if (!node) continue
    for (const u of planUnmanaged(node, c.names, known)) {
      plan.unmanaged.push({ name: u.name, where: c.name })
    }
  }
  stats.unmanaged = plan.unmanaged.length
  for (const u of plan.unmanaged) {
    log(`  - ${u.name} (sous ${u.where}) : page non gérée — LAISSÉE EN PLACE (non créée par la publication)`)
  }
  // Ordre canonique voulu, niveau espace : les sections du plan, dans l'ordre du plan.
  const topDesired = []
  const topNames = []
  // [{ parentId, desired: [view_id...] }] — ordre voulu à l'intérieur des conteneurs.
  const innerDesired = []
  // A10 — [{ node, names }] : ce qu'on balaiera, une fois toutes les sections traitées.
  const sweeps = []
  // Pages générées à verrouiller (J3) : [{ key, id, name }]. `90 · Notes` n'y entre jamais.
  const toLock = []
  const lockIfNeeded = (key, id, name) => {
    if (ctx.next[key] && ctx.next[key].locked === true) return // déjà verrouillée : 0 appel
    toLock.push({ key, id, name })
  }

  for (const section of plan.sections) {
    if (section.kind === 'human') {
      const notes = await ensureNotes(client, spaceNode, space.id, generatedAt)
      log(`  · ${section.name} : ${notes.created ? 'créée' : 'préservée (jamais réécrite)'}`)
      topDesired.push(notes.id); topNames.push(section.name)
      continue
    }
    topNames.push(section.name)

    if (section.kind === 'overview') {
      const key = pageKey(section.name)
      const hash = fingerprint('overview', JSON.stringify({
        p: plan.project, v: plan.version, c: plan.counters,
        s: plan.sections.map((x) => x.name), m: plan.missing,
        // Les pages non gérées sont AFFICHÉES : leur apparition/disparition doit rafraîchir
        // la vue d'ensemble, sinon elle mentirait jusqu'au prochain changement de source.
        u: plan.unmanaged,
      }))
      const ov = await syncPage(ctx, spaceNode, space.id, key, section.name,
        overviewBlocks(plan, generatedAt), hash)
      log(`  · ${section.name} : ${ov.state}`)
      topDesired.push(ov.vid)
      lockIfNeeded(key, ov.vid, section.name)
      continue
    }

    // 50 — statut des recettes. L'empreinte ne porte QUE des métadonnées (nom, version,
    // date) : le contenu du HTML n'entre ni dans la page, ni dans le hachage.
    if (section.kind === 'recette') {
      const key = pageKey(section.name)
      const hash = fingerprint('recette', JSON.stringify(section.status))
      const p = await syncPage(ctx, spaceNode, space.id, key, section.name,
        recetteBlocks(section.status, generatedAt), hash)
      log(`  · ${section.name} : ${p.state} — ${section.status.count
        ? `${section.status.count} recette(s), statut seul` : 'aucune recette'}`)
      topDesired.push(p.vid)
      lockIfNeeded(key, p.vid, section.name)
      continue
    }

    if (section.kind === 'page') {
      const key = pageKey(section.name)
      const hash = fingerprint('mirror', section.name, section.source, contentOf(section.source))
      const p = await syncPage(ctx, spaceNode, space.id, key, section.name,
        mirrorBlocks(section.source, contentOf(section.source), generatedAt), hash)
      log(`  · ${section.name} ← ${section.source} : ${p.state}`)
      topDesired.push(p.vid)
      lockIfNeeded(key, p.vid, section.name)
      continue
    }

    // Conteneur : créé une fois, jamais corbeillé ; ses enfants sont synchronisés.
    const cont = await ensureContainer(client, spaceNode, space.id, section.name)
    if (cont.created) stats.containers++
    log(`  · ${section.name} : conteneur ${cont.created ? 'créé' : 'réutilisé'}`)
    topDesired.push(cont.id)
    const contKey = pageKey(section.name)
    ctx.next[contKey] = { viewId: cont.id, hash: 'conteneur', locked: cache.pages[contKey]?.locked === true }
    lockIfNeeded(contKey, cont.id, section.name)

    const contNode = findNodeById(tree, cont.id) || { view_id: cont.id, children: [] }
    const inner = []
    const innerNames = []

    if (section.index) {
      const key = pageKey(section.name, section.index.name)
      const hash = fingerprint('index', section.name, ...section.children.map((c) => c.name))
      const idx = await syncPage(ctx, contNode, cont.id, key, section.index.name,
        indexBlocks(section, generatedAt), hash)
      inner.push(idx.vid); innerNames.push(section.index.name)
      lockIfNeeded(key, idx.vid, section.index.name)
      log(`    - ${section.index.name} : ${idx.state}`)
    }
    for (const child of section.children) {
      const key = pageKey(section.name, child.name)
      const hash = fingerprint('mirror', child.name, child.source, contentOf(child.source))
      const p = await syncPage(ctx, contNode, cont.id, key, child.name,
        mirrorBlocks(child.source, contentOf(child.source), generatedAt), hash)
      inner.push(p.vid); innerNames.push(child.name)
      lockIfNeeded(key, p.vid, child.name)
      log(`    - ${child.name} ← ${child.source} : ${p.state}`)
    }
    innerDesired.push({ parentId: cont.id, desired: inner })
    sweeps.push({ node: contNode, names: innerNames, label: section.name })
  }

  // A10/B3 — balayage des orphelins : une page renommée ou supprimée à la source ne
  // survit plus. `90 · Notes` et ses descendants ne sont JAMAIS visités (§ 5.4).
  // Lot 4 — le balayage ne cible QUE les `view_id` que la skill sait avoir écrits : une page
  // qu'elle ne reconnaît pas a déjà été signalée « non gérée » et reste en place.
  sweeps.push({ node: spaceNode, names: topNames, label: project })
  for (const sweep of sweeps) {
    for (const orphan of planOrphans(sweep.node, sweep.names, known)) {
      await client.moveToTrash(orphan.view_id)
      stats.removed++
      log(`    - ${orphan.name} (sous ${sweep.label}) : retiré (orpheline, plus de source)`)
    }
  }

  // J3 — verrou déclaratif sur les pages générées 00–60 (jamais sur 90 · Notes).
  for (const p of toLock) {
    await client.setLocked(p.id, p.name, true)
    if (ctx.next[p.key]) ctx.next[p.key].locked = true
    stats.locked++
  }

  // J2 — l'ordre de création est NON déterministe : on impose l'ordre canonique.
  const after = await client.folder()
  spaceNode = findNodeById(after, space.id) || { view_id: space.id, children: [] }
  const topMoves = planMoves(childrenOf(spaceNode).map((c) => c.view_id), topDesired)
  for (const m of topMoves) {
    await client.movePage(m.view_id, space.id, m.prev_view_id)
    stats.moves++
  }
  for (const grp of innerDesired) {
    const node = findNodeById(after, grp.parentId)
    const moves = planMoves(childrenOf(node).map((c) => c.view_id), grp.desired)
    for (const m of moves) {
      await client.movePage(m.view_id, grp.parentId, m.prev_view_id)
      stats.moves++
    }
  }

  // A8 — l'état d'empreintes n'est écrit qu'ICI, une fois la passe réellement aboutie :
  // une passe interrompue laisse le cache d'avant, donc une reprise qui réécrit.
  const cacheWritten = writeCache(cacheFile, { project, workspaceId: client.wid, spaceId: space.id, pages: ctx.next }, fsApi)
  if (!cacheWritten) log(`  - cache d'empreintes non écrit (${cacheFile}) : la prochaine passe réécrira tout`)

  const writes = client.calls?.writes
  log(
    `appflowy-doc: terminé — ${stats.created} créée(s), ${stats.updated} à jour, ` +
    `${stats.unchanged} inchangée(s), ` +
    // R-C — un seul chiffre pour la corbeille, DÉCOMPOSÉ : orphelines + anciennes versions.
    `${stats.removed + stats.replaced} en corbeille (${stats.removed} orpheline(s), ` +
    `${stats.replaced} ancienne(s) version(s)), ` +
    `${stats.containers} conteneur(s) créé(s), ${stats.locked} verrou(s), ${stats.moves} déplacement(s), ` +
    // Lot 4 — ce que la skill n'a PAS touché se compte aussi : un silence serait un mensonge
    // par omission, exactement comme le « 0 retirée(s) » qui remplissait la corbeille (R-C).
    `${stats.unmanaged} non gérée(s) laissée(s) en place, ` +
    `${skipped.length} ignoré(s) — ${client.calls?.total ?? 0} appel(s) HTTP` +
    (writes === undefined ? '' : ` dont ${writes} écriture(s)`),
  )
  return {
    project, spaceId: space.id, workspaceId: client.wid,
    ...stats, skipped: skipped.length, plan, cacheFile,
    writes: writes ?? null, calls: client.calls?.total ?? null,
  }
}

// ───────────────────────── Entrée CLI ─────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  run(process.argv.slice(2), process.env)
    .then(() => process.exit(0))
    .catch((e) => {
      // Échec propre : message net, code non nul, jamais de stacktrace.
      console.error('appflowy-doc:', e.message)
      process.exit(1)
    })
}
