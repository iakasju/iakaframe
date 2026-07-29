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
// Mécanismes API vérifiés en réel (spike lot 0, 2026-07-27, AppFlowy Cloud 0.15.21) :
//   - imbrication de pages sous une page : OK (S1) ; `/folder?depth=` tronque → depth ≥ 6 (J1)
//   - ordre des frères : POST .../page-view/{vid}/move {new_parent_view_id, prev_view_id} (S2/J2)
//     — l'ordre de création est NON déterministe : le `move` est obligatoire, pas optionnel.
//   - verrou déclaratif : PATCH .../page-view/{vid} {name (obligatoire), is_locked} (S4/J3)
//   - corbeille : POST .../move-to-trash ; purge définitive : DELETE .../trash/{vid} (S7)

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

// ───────────────────────── Modèle iakadoc (constantes normatives) ─────────────────────────

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

// Prédicat : ce chemin relatif est-il un doc structurant à publier ?
export function isStructuralDoc(relPath) {
  const p = String(relPath).split(path.sep).join('/')
  if (isTemplateFile(p)) return false // B1 — avant toute autre règle
  if (p === 'CLAUDE.md') return true
  if (p === 'specs/PROJET.md') return true
  if (p === 'specs/etat-des-lieux.md') return true
  if (p.startsWith('specs/instructions/') && p.endsWith('.md')) return true
  if (p.startsWith('docs/qualite/') && p.endsWith('.md')) return true
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
  return 9
}

// Filtre + ordonne une liste de chemins relatifs (pur, sans I/O).
export function selectStructuralDocs(relPaths) {
  return relPaths
    .filter(isStructuralDoc)
    .map((p) => p.split(path.sep).join('/'))
    .sort((a, b) => docRank(a) - docRank(b) || a.localeCompare(b))
}

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
const RE_FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)/
const RE_HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/
const RE_DIVIDER = /^ {0,3}(-{3,}|\*{3,}|_{3,})[ \t]*$/
const RE_QUOTE = /^ {0,3}>[ \t]?(.*)$/
const RE_TABLE = /^ {0,3}\|/
const RE_LIST = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/
const RE_TODO = /^\[([ xX])\][ \t]+(.*)$/

function isBlockStart(line) {
  return RE_FENCE.test(line) || RE_HEADING.test(line) || RE_DIVIDER.test(line)
    || RE_QUOTE.test(line) || RE_TABLE.test(line) || RE_LIST.test(line)
}

const indentWidth = (s) => s.replace(/\t/g, '    ').length

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
            flush(); push(`image non publiée : ${url}`, attrs)
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
        const end = src.indexOf(mark, i + 2)
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
    const fence = RE_FENCE.exec(line)
    if (fence) {
      flush(); closeList()
      const marker = fence[1][0]           // ` ou ~
      const closeRe = new RegExp('^ {0,3}' + (marker === '~' ? '~' : '\\`') + '{3,}[ \\t]*$')
      const lang = (fence[2] || '').split(/[:\s]/)[0]
      const body = []
      i++
      while (i < lines.length && !closeRe.test(lines[i])) { body.push(lines[i]); i++ }
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
      flush()
      const ind = indentWidth(li[1])
      while (listStack.length && listStack[listStack.length - 1] >= ind) listStack.pop()
      listStack.push(ind)
      const depth = listStack.length - 1

      const parts = [li[3]]
      i++
      // Continuation : ligne plus indentée que le marqueur, OU continuation paresseuse
      // (ligne nue qui n'ouvre aucun bloc). Dans les deux cas : PAS un nouveau paragraphe.
      while (i < lines.length && lines[i].trim() && !RE_LIST.test(lines[i])
             && (indentWidth(lines[i].match(/^[ \t]*/)[0]) > ind || !isBlockStart(lines[i]))) {
        parts.push(lines[i].trim()); i++
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

// Mapping fichier → blocs. Le front-matter YAML est masqué du corps (il a déjà servi au
// titre de page) ; le corps passe par le mapper Markdown.
export function fileToBlocks(content) {
  const { body } = stripFrontMatter(String(content ?? ''))
  return markdownToBlocks(body)
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
export function dedupeTitles(entries) {
  const count = new Map()
  for (const e of entries) count.set(e.title, (count.get(e.title) || 0) + 1)
  const seen = new Map()
  return entries.map((e) => {
    if ((count.get(e.title) || 0) < 2) return { ...e }
    const base = String(e.rel).split('/').pop().replace(/\.md$/i, '')
    seen.set(e.title, (seen.get(e.title) || 0) + 1)
    return { ...e, title: clampTitle(`${e.title} (${base})`) }
  })
}

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
export function buildPlan({ project, docs = [] }) {
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

  // 50 / 60 — corpus élargi : collecte activée au lot 4 (§ 5.2). Sections non créées ici.
  missing.push({ name: SEC.RECETTE, reason: 'collecte des recettes activée au lot 4' })
  missing.push({ name: SEC.GUIDE, reason: 'collecte de docs/**.md activée au lot 4' })

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
      recette: 'non collectée (lot 4)',
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

// Blocs d'une page d'index (§ 5.6 : ordre canonique, régénéré à chaque passe).
export function indexBlocks(section, generatedAtIso) {
  return [
    mirrorWarning(SOURCE_REPO, generatedAtIso),
    heading(1, `${section.name} — index`),
    para(`${section.children.length} page(s), dans l'ordre canonique :`),
    ...section.children.map((c) => bullet(c.name)),
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
    heading(2, 'Compteurs'),
    bullet(`Instructions : ${plan.counters.instructions}`),
    bullet(`Versions qualité : ${plan.counters.qualite}`),
    bullet(`Recette (RQV) : ${plan.counters.recette}`),
    para(`Pages 00–60 : générées depuis le dépôt, à ne pas modifier ici. ` +
      `${SEC.NOTES} est la zone d'écriture humaine.`),
  ]
}

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
  return selectStructuralDocs(out)
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
async function rewritePage(client, parentNode, parentId, name, blocks) {
  const existing = childrenOf(parentNode).filter((c) => c.name === name)
  for (const e of existing) await client.moveToTrash(e.view_id)
  const vid = await client.createPage(parentId, name)
  if (blocks.length) await client.appendBlocks(vid, blocks)
  return { vid, replaced: existing.length > 0 }
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
  for (const s of skipped) log(`  - ${s} : ignoré (lecture impossible)`)
  log(`appflowy-doc: projet "${project}" — ${docs.length} doc(s) structurant(s) retenu(s)`)

  const client = makeClient({ base, email, password })
  await client.auth()
  await client.provision()
  await client.resolveWorkspace(selector)
  log(`appflowy-doc: workspace « ${client.workspaceName} » (${String(client.wid).slice(0, 8)}) — sélecteur « ${selector} » (${from})`)

  const generatedAt = now().toISOString()
  const plan = buildPlan({ project, docs })

  let tree = await client.folder()
  const space = await ensureSpace(client, tree, project)
  log(`appflowy-doc: espace "${project}" ${space.created ? 'créé' : 'réutilisé'} (${space.id.slice(0, 8)})`)

  // On relit l'arbre : les enfants existants conditionnent l'idempotence par nom.
  tree = await client.folder()
  let spaceNode = findNodeById(tree, space.id) || { view_id: space.id, children: [] }

  const contentOf = (rel) => (docs.find((d) => d.rel === rel) || {}).content ?? ''
  const stats = { created: 0, updated: 0, containers: 0, locked: 0, moves: 0 }
  // Ordre canonique voulu, niveau espace : les sections du plan, dans l'ordre du plan.
  const topDesired = []
  // [{ parentId, desired: [view_id...] }] — ordre voulu à l'intérieur des conteneurs.
  const innerDesired = []
  // Pages générées à verrouiller (J3) : [{ id, name }]. `90 · Notes` n'y entre jamais.
  const toLock = []

  for (const section of plan.sections) {
    if (section.kind === 'human') {
      const notes = await ensureNotes(client, spaceNode, space.id, generatedAt)
      log(`  · ${section.name} : ${notes.created ? 'créée' : 'préservée (jamais réécrite)'}`)
      topDesired.push(notes.id)
      continue
    }

    if (section.kind === 'overview') {
      const ov = await rewritePage(client, spaceNode, space.id, section.name, overviewBlocks(plan, generatedAt))
      ov.replaced ? stats.updated++ : stats.created++
      log(`  · ${section.name} : ${ov.replaced ? 'régénérée' : 'créée'}`)
      topDesired.push(ov.vid)
      toLock.push({ id: ov.vid, name: section.name })
      continue
    }

    if (section.kind === 'page') {
      const blocks = mirrorBlocks(section.source, contentOf(section.source), generatedAt)
      const p = await rewritePage(client, spaceNode, space.id, section.name, blocks)
      p.replaced ? stats.updated++ : stats.created++
      log(`  · ${section.name} ← ${section.source} : ${p.replaced ? 'régénérée' : 'créée'}`)
      topDesired.push(p.vid)
      toLock.push({ id: p.vid, name: section.name })
      continue
    }

    // Conteneur : créé une fois, jamais corbeillé ; ses enfants sont régénérés.
    const cont = await ensureContainer(client, spaceNode, space.id, section.name)
    if (cont.created) stats.containers++
    log(`  · ${section.name} : conteneur ${cont.created ? 'créé' : 'réutilisé'}`)
    topDesired.push(cont.id)
    toLock.push({ id: cont.id, name: section.name })

    const contNode = findNodeById(tree, cont.id) || { view_id: cont.id, children: [] }
    const inner = []

    if (section.index) {
      const idx = await rewritePage(client, contNode, cont.id, section.index.name, indexBlocks(section, generatedAt))
      idx.replaced ? stats.updated++ : stats.created++
      inner.push(idx.vid)
      toLock.push({ id: idx.vid, name: section.index.name })
      log(`    - ${section.index.name} : ${idx.replaced ? 'régénéré' : 'créé'}`)
    }
    for (const child of section.children) {
      const blocks = mirrorBlocks(child.source, contentOf(child.source), generatedAt)
      const p = await rewritePage(client, contNode, cont.id, child.name, blocks)
      p.replaced ? stats.updated++ : stats.created++
      inner.push(p.vid)
      toLock.push({ id: p.vid, name: child.name })
      log(`    - ${child.name} ← ${child.source} : ${p.replaced ? 'régénérée' : 'créée'}`)
    }
    innerDesired.push({ parentId: cont.id, desired: inner })
  }

  // J3 — verrou déclaratif sur les pages générées 00–60 (jamais sur 90 · Notes).
  for (const p of toLock) {
    await client.setLocked(p.id, p.name, true)
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

  log(
    `appflowy-doc: terminé — ${stats.created} page(s) créée(s), ${stats.updated} régénérée(s), ` +
    `${stats.containers} conteneur(s) créé(s), ${stats.locked} verrou(s), ${stats.moves} déplacement(s), ` +
    `${skipped.length} ignoré(s) — ${client.calls?.total ?? 0} appel(s) HTTP`,
  )
  return {
    project, spaceId: space.id, workspaceId: client.wid,
    ...stats, skipped: skipped.length, plan,
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
