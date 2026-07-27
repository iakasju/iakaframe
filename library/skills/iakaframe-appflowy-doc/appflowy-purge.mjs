#!/usr/bin/env node
// iakaframe-appflowy-doc — PURGE explicite d'objets AppFlowy (D4/D5, ajustement J4).
//
// ⚠️ OUTIL DESTRUCTIF, VOLONTAIREMENT DÉSARMÉ PAR DÉFAUT.
//    Sans `--execute` ET sans `--confirm <workspace_id>` exact, ce script ne supprime RIEN :
//    il se contente de LISTER ce qui serait supprimé (mode --dry-run, comportement par défaut).
//    Il n'est jamais appelé par le chemin de publication (`appflowy-doc.mjs`).
//
// Une purge = DEUX appels (S7) : `move-to-trash` PUIS `DELETE /trash/{view_id}`.
// S'arrêter à la corbeille n'est pas une purge : le contenu resterait accessible.
//
// Usage :
//   # inventaire seul (lecture seule, aucune écriture) :
//   node appflowy-purge.mjs --workspace "<nom|id>" --space IakaCockpit --space IakaPcl \
//        --page "iakaframe — preuve de concept API" --trash --dry-run
//
//   # exécution réelle (les DEUX drapeaux sont exigés) :
//   node appflowy-purge.mjs --workspace "<nom|id>" ... --execute --confirm <workspace_id>
//
// Le `--confirm` attend le workspace_id RÉSOLU : impossible de purger le mauvais workspace
// par copier-coller d'une commande d'un autre contexte.

import fs from 'node:fs'
import {
  AppFlowyClient, AppFlowyError, SEC, childrenOf,
  resolveCredentials, resolveWorkspaceSelector, appflowyEnvPath,
} from './appflowy-doc.mjs'

// ───────────────────────── Fonctions pures (testables) ─────────────────────────

// Parse les arguments, y compris les drapeaux répétables (--space, --page).
export function parsePurgeArgs(argv) {
  const list = Array.isArray(argv) ? argv : []
  const many = (name) => {
    const out = []
    for (let i = 0; i < list.length; i++) {
      if (list[i] === '--' + name && list[i + 1] && !String(list[i + 1]).startsWith('--')) {
        out.push(list[i + 1])
      }
    }
    return out
  }
  const one = (name) => many(name)[0]
  return {
    workspace: one('workspace'),
    spaces: many('space'),
    pages: many('page'),
    includeTrash: list.includes('--trash'),
    execute: list.includes('--execute'),
    confirm: one('confirm'),
    dryRun: !list.includes('--execute'), // le dry-run est le comportement PAR DÉFAUT
  }
}

// Aplatit l'arbre en [{ node, path, protected }] — `protected` = sous `90 · Notes`.
export function flattenTree(root) {
  const out = []
  const walk = (node, prefix, insideNotes) => {
    for (const c of childrenOf(node)) {
      const p = prefix ? `${prefix} / ${c.name}` : c.name
      const prot = insideNotes || c.name === SEC.NOTES
      out.push({ node: c, path: p, protected: prot })
      walk(c, p, prot)
    }
  }
  walk(root, '', false)
  return out
}

export function countDescendants(node) {
  let n = 0
  for (const c of childrenOf(node)) n += 1 + countDescendants(c)
  return n
}

// PUR — construit le plan de purge. Ne supprime rien, ne fait aucune I/O.
// Garde dure : rien de ce qui vit sous `90 · Notes` n'est jamais ciblé (§ 5.4).
export function planPurge({ tree, trash = [], spaces = [], pages = [], includeTrash = false }) {
  const flat = flattenTree(tree)
  const targets = []
  const notFound = []
  const refused = []
  const seen = new Set()

  const push = (t) => {
    if (seen.has(t.view_id)) return
    seen.add(t.view_id)
    targets.push(t)
  }

  for (const name of spaces) {
    const hits = flat.filter((f) => f.node.is_space && f.node.name === name)
    if (!hits.length) { notFound.push({ kind: 'space', name }); continue }
    for (const h of hits) {
      if (h.protected) { refused.push({ kind: 'space', name, reason: `sous ${SEC.NOTES}` }); continue }
      push({
        kind: 'space', view_id: h.node.view_id, name: h.node.name, path: h.path,
        descendants: countDescendants(h.node),
      })
    }
  }

  for (const name of pages) {
    if (name === SEC.NOTES) {
      refused.push({ kind: 'page', name, reason: `${SEC.NOTES} est inviolable (§ 5.4)` })
      continue
    }
    const hits = flat.filter((f) => !f.node.is_space && f.node.name === name)
    if (!hits.length) { notFound.push({ kind: 'page', name }); continue }
    for (const h of hits) {
      if (h.protected) { refused.push({ kind: 'page', name, reason: `sous ${SEC.NOTES}` }); continue }
      push({
        kind: 'page', view_id: h.node.view_id, name: h.node.name, path: h.path,
        descendants: countDescendants(h.node),
      })
    }
  }

  if (includeTrash) {
    for (const v of trash) {
      const nom = v.name || '(sans nom)'
      push({
        kind: 'trash', view_id: v.view_id, name: nom,
        path: '(corbeille) ' + nom, descendants: 0,
      })
    }
  }

  return { targets, notFound, refused }
}

// PUR — le geste destructif est-il armé ? Deux verrous indépendants.
export function purgeArmed({ execute, confirm }, workspaceId) {
  if (!execute) {
    return { armed: false, reason: 'mode dry-run (par défaut) — ajoute --execute pour armer' }
  }
  if (!confirm) {
    return { armed: false, reason: `--execute sans --confirm : relance avec --confirm ${workspaceId}` }
  }
  if (String(confirm) !== String(workspaceId)) {
    return { armed: false, reason: `--confirm « ${confirm} » ≠ workspace résolu (${workspaceId})` }
  }
  return { armed: true, reason: 'armé' }
}

// Rendu texte du plan (pur) — c'est ce que le décideur lit avant de trancher.
export function renderPlan(plan, { workspaceName, workspaceId }) {
  const lines = []
  lines.push(`workspace ciblé : « ${workspaceName} » (${workspaceId})`)
  lines.push(`objets à supprimer définitivement : ${plan.targets.length}`)
  const byKind = { space: 0, page: 0, trash: 0 }
  for (const t of plan.targets) byKind[t.kind] = (byKind[t.kind] || 0) + 1
  lines.push(`  espaces : ${byKind.space} · pages : ${byKind.page} · débris de corbeille : ${byKind.trash}`)
  for (const t of plan.targets) {
    const d = t.descendants ? ` — ${t.descendants} descendant(s) emportés` : ''
    lines.push(`  [${t.kind}] ${t.path}${d}  (${String(t.view_id).slice(0, 8)})`)
  }
  for (const n of plan.notFound) lines.push(`  [absent] ${n.kind} « ${n.name} » : introuvable, rien à faire`)
  for (const r of plan.refused) lines.push(`  [REFUSÉ] ${r.kind} « ${r.name} » : ${r.reason}`)
  return lines.join('\n')
}

// ───────────────────────── Orchestration ─────────────────────────

export async function runPurge(argv, env, deps = {}) {
  const fsApi = deps.fs || fs
  const log = deps.log || console.log
  const makeClient = deps.makeClient || ((c) => new AppFlowyClient(c))
  const args = parsePurgeArgs(argv)

  if (!args.workspace) {
    throw new AppFlowyError(
      'purge : --workspace <nom|id> est OBLIGATOIRE (aucun workspace par défaut pour un geste destructif)',
    )
  }
  if (!args.spaces.length && !args.pages.length && !args.includeTrash) {
    throw new AppFlowyError('purge : rien à faire — précise au moins un --space, --page ou --trash')
  }
  const { base, email, password } = resolveCredentials(env, fsApi)
  if (!base || !email || !password) {
    throw new AppFlowyError(
      `config manquante : définis APPFLOWY_URL/EMAIL/PASSWORD (env), ou renseigne ${appflowyEnvPath(env)}`,
    )
  }
  const { selector } = resolveWorkspaceSelector(env, fsApi, args.workspace)

  const client = makeClient({ base, email, password })
  await client.auth()
  await client.provision()
  await client.resolveWorkspace(selector)

  const tree = await client.folder()
  const trash = args.includeTrash ? await client.listTrash() : []
  const plan = planPurge({
    tree, trash, spaces: args.spaces, pages: args.pages, includeTrash: args.includeTrash,
  })

  log(renderPlan(plan, { workspaceName: client.workspaceName, workspaceId: client.wid }))

  const arm = purgeArmed(args, client.wid)
  if (!arm.armed) {
    log(`\nappflowy-purge: AUCUNE SUPPRESSION EFFECTUÉE — ${arm.reason}`)
    return { executed: false, reason: arm.reason, plan, workspaceId: client.wid }
  }

  log(`\nappflowy-purge: ARMÉ — suppression définitive de ${plan.targets.length} objet(s)`)
  let deleted = 0
  const errors = []
  for (const t of plan.targets) {
    try {
      if (t.kind !== 'trash') await client.moveToTrash(t.view_id) // 1/2 — corbeille
      await client.deleteFromTrash(t.view_id) // 2/2 — définitif (sinon ce n'est pas une purge)
      deleted++
      log(`  supprimé [${t.kind}] ${t.path}`)
    } catch (e) {
      errors.push({ target: t.path, message: e.message })
      log(`  ÉCHEC [${t.kind}] ${t.path} : ${e.message}`)
    }
  }
  log(`appflowy-purge: terminé — ${deleted}/${plan.targets.length} supprimé(s), ${errors.length} échec(s)`)
  return { executed: true, deleted, errors, plan, workspaceId: client.wid }
}

// ───────────────────────── Entrée CLI ─────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  runPurge(process.argv.slice(2), process.env)
    .then((r) => process.exit(r.errors && r.errors.length ? 1 : 0))
    .catch((e) => {
      console.error('appflowy-purge:', e.message)
      process.exit(1)
    })
}
