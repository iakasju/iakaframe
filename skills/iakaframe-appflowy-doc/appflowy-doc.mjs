#!/usr/bin/env node
// iakaframe-appflowy-doc — publie/rafraîchit la mémoire humaine d'un projet dans
// AppFlowy auto-hébergé (un ESPACE par projet, une vue d'ensemble + une sous-page par
// doc structurant). Idempotent, non destructif, défensif. ZÉRO dépendance (fetch natif).
//
// Usage :
//   node appflowy-doc.mjs --project <nom> --root <chemin-projet>
//
// Config 100 % env (aucun secret en dur, jamais commité) :
//   APPFLOWY_URL    (ex. http://192.168.2.14:3008)
//   APPFLOWY_EMAIL  (compte AppFlowy)
//   APPFLOWY_PASSWORD
//
// Modèle de données (tranché avec Stéphane, cf. specs/instructions/appflowy-doc-skill.md) :
//   espace = nom du projet ; sous-page = chemin relatif du fichier ; idempotence par nom.
//
// Mécanismes API vérifiés en réel (spike 2026-07-01, instance 0.15.x) :
//   - Créer un espace : POST /api/workspace/{wid}/space {name, space_permission, space_icon...}
//   - Mise à jour idempotente du contenu : pas de remplacement in-place exposé (DELETE=405) ;
//     repli retenu = POST .../page-view/{vid}/move-to-trash puis recréer la page (les pages
//     en corbeille disparaissent de /folder, donc la recherche par nom reste propre).

import fs from 'node:fs'
import path from 'node:path'

// ───────────────────────── Fonctions pures (testables) ─────────────────────────

// Prédicat : ce chemin relatif est-il un doc structurant à publier ?
export function isStructuralDoc(relPath) {
  const p = relPath.split(path.sep).join('/')
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

// Bloc paragraphe AppFlowy (vide => delta vide accepté par l'API).
export function para(text) {
  return text && text.length
    ? { type: 'paragraph', data: { delta: [{ insert: text }] } }
    : { type: 'paragraph', data: { delta: [] } }
}

// Mapping fichier -> blocs (un paragraphe par ligne ; fidélité texte MVP).
// Les lignes vides finales sont élaguées pour éviter une traîne de paragraphes vides.
export function fileToBlocks(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines.map(para)
}

// Blocs de la vue d'ensemble (synthèse + inventaire des sous-pages).
export function overviewBlocks(project, docNames, generatedAtIso) {
  return [
    para(`Projet : ${project}`),
    para(`Mémoire humaine AppFlowy générée le ${generatedAtIso}`),
    para(''),
    para(`Documents structurants publiés (${docNames.length}) :`),
    ...docNames.map((n) => para('• ' + n)),
    para(''),
    para('Chaque document a sa propre sous-page (même nom que le chemin relatif).'),
  ]
}

// Découpe une liste de blocs en lots (limite de taille de requête défensive).
export function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Parse minimaliste des arguments CLI.
export function parseArgs(argv) {
  const get = (name) => {
    const i = argv.indexOf('--' + name)
    return i !== -1 && argv[i + 1] ? argv[i + 1] : undefined
  }
  return { project: get('project'), root: get('root') }
}

// ───────────────────────── I/O fichiers ─────────────────────────

// Résout les chemins relatifs des docs structurants réellement présents sous root.
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
      if (e.endsWith('.md') && exists(rel)) out.push(rel)
    }
  }
  return selectStructuralDocs(out)
}

// ───────────────────────── Client HTTP AppFlowy ─────────────────────────

class AppFlowyError extends Error {}

class AppFlowyClient {
  constructor({ base, email, password }) {
    this.base = base.replace(/\/+$/, '')
    this.email = email
    this.password = password
    this.token = null
    this.wid = null
  }

  async _req(method, p, body, _retried = false) {
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

  async resolveWorkspace() {
    const j = await this._req('GET', '/api/workspace')
    const ws = (j.data || [])[0]
    if (!ws) throw new AppFlowyError('aucun workspace accessible pour ce compte')
    this.wid = ws.workspace_id
    return this.wid
  }

  async folder(depth = 4) {
    const j = await this._req('GET', `/api/workspace/${this.wid}/folder?depth=${depth}`)
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

  async moveToTrash(viewId) {
    await this._req('POST', `/api/workspace/${this.wid}/page-view/${viewId}/move-to-trash`)
  }
}

// Garantit l'espace projet (réutilise par nom, sinon crée).
async function ensureSpace(client, root, project) {
  const found = (root.children || []).find((c) => c.is_space && c.name === project)
  if (found) return { id: found.view_id, created: false }
  const id = await client.createSpace(project)
  return { id, created: true }
}

// Recrée une page enfant par nom (trash de l'existante puis création fraîche = idempotent).
async function rewritePage(client, spaceNode, name, blocks) {
  const existing = (spaceNode?.children || []).filter((c) => c.name === name)
  for (const e of existing) await client.moveToTrash(e.view_id)
  const vid = await client.createPage(spaceNode.id, name)
  if (blocks.length) await client.appendBlocks(vid, blocks)
  return { vid, replaced: existing.length > 0 }
}

// ───────────────────────── Orchestration ─────────────────────────

export async function run(argv, env) {
  const { project, root } = parseArgs(argv)
  if (!project || !root) {
    throw new AppFlowyError('usage : node appflowy-doc.mjs --project <nom> --root <chemin-projet>')
  }
  const base = env.APPFLOWY_URL
  const email = env.APPFLOWY_EMAIL
  const password = env.APPFLOWY_PASSWORD
  if (!base || !email || !password) {
    throw new AppFlowyError('config manquante : APPFLOWY_URL, APPFLOWY_EMAIL et APPFLOWY_PASSWORD requis (env)')
  }
  if (!fs.existsSync(root)) {
    throw new AppFlowyError(`chemin projet introuvable : ${root}`)
  }

  const docs = resolveDocPaths(root)
  console.log(`appflowy-doc: projet "${project}" — ${docs.length} doc(s) structurant(s) trouvé(s)`)

  const client = new AppFlowyClient({ base, email, password })
  await client.auth()
  await client.provision()
  await client.resolveWorkspace()

  const tree = await client.folder(4)
  const space = await ensureSpace(client, tree, project)
  console.log(`appflowy-doc: espace "${project}" ${space.created ? 'créé' : 'réutilisé'} (${space.id.slice(0, 8)})`)

  // On relit l'arbre sous l'espace pour connaître les sous-pages existantes (idempotence par nom).
  const treeAfter = await client.folder(4)
  const spaceNode = { id: space.id, children: ((treeAfter.children || []).find((c) => c.view_id === space.id) || {}).children || [] }

  const generatedAt = new Date().toISOString()

  // Vue d'ensemble.
  const ov = await rewritePage(client, spaceNode, 'Vue d’ensemble', overviewBlocks(project, docs, generatedAt))
  console.log(`appflowy-doc: vue d'ensemble ${ov.replaced ? 'mise à jour' : 'créée'}`)

  // Une sous-page par doc.
  let created = 0, updated = 0, skipped = 0
  for (const rel of docs) {
    let content
    try { content = fs.readFileSync(path.join(root, rel), 'utf8') } catch { console.log(`  - ${rel} : ignoré (lecture impossible)`); skipped++; continue }
    const res = await rewritePage(client, spaceNode, rel, fileToBlocks(content))
    if (res.replaced) { updated++; console.log(`  - ${rel} : à jour`) }
    else { created++; console.log(`  - ${rel} : créé`) }
  }
  console.log(`appflowy-doc: terminé — ${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s)`)
  return { project, spaceId: space.id, created, updated, skipped }
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
