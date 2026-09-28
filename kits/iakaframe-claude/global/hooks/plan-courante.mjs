// plan-courante.mjs — Émetteur de PLAN VIVANT sur la main courante (L18, tranche 1).
//
// Généralise le hook L5 (delegation-guard) : ici on instrumente le PLAN de l'agent.
// Câblé sur PostToolUse, matcher "TodoWrite" (et "Task"/"Agent" — M-6, Lot 5). À chaque écriture
// de todos, on ÉMET un snapshot COMPLET (non tronqué) du plan vers la base de documents / le
// broker (IAKALOG_* / DOCDB_*, même schéma que L4/L5). Le cockpit lit la main courante et affiche
// la checklist (dernier snapshot = plan courant).
//
// JAMAIS bloquant (ce n'est pas un garde) : fail-open, borné, exit 0 toujours.
// Transport : IAKALOG_TRANSPORT = "broker" (défaut) | "docdb". Scopé par session/cwd.
//
// Lot 5 (specs/instructions/declaration-chantier-session.md § D-12, M-6) :
//   - accepte `tool_name:"Agent"` EN PLUS de `"Task"` (renommage v2.1.63, le matcher "Task" reste
//     honore dans settings.json — le payload observe porte desormais "Agent") ;
//   - attribution : `conv_id` = nom du chantier ACTIF de la session (repli : `basename(cwd)`,
//     comportement HISTORIQUE si aucun chantier actif n'est connu) ; `meta.repo`, `meta.repo_root`,
//     `meta.segment`, `meta.aragorn`, `meta.main_role`, `meta.agent_id?` ; `royaume` suit la MEME
//     regle que `delegation-guard.mjs` (nom du depot/dossier en MAJUSCULE, `PORTEFEUILLE`, sinon
//     l'env `IAKALOG_ROYAUME` INCHANGE). Lecture SEULE du registre (`loadState`) : cet emetteur
//     n'ecrit JAMAIS au registre de chantier (D-2). Couche ignoree (M-9, comportement HISTORIQUE
//     intact) si `IAKAFRAME_CHANTIER_MODE=off`, `session_id` absent/hors forme, ou registre absent.
import { homedir } from "node:os";
import { join, basename } from "node:path";
import { readFileSync } from "node:fs";
import net from "node:net";
import { loadState } from "./chantier-state.mjs";

const EMIT_TIMEOUT_MS = 1500;
const ts = () => new Date().toISOString();
const done = () => process.exit(0); // émetteur : on ne refuse jamais.

function readAll() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Lot 5 — COUCHE CHANTIER (lecture seule, D-12) : DOIT etre defini AVANT `await main()` (le
// premier `await` au niveau module suspend l'evaluation du reste du fichier ; une `const` fleche
// referencee par une fonction hoisee mais appelee DURANT ce premier `await` resterait en zone
// morte temporelle — ReferenceError constate a l'implementation, cf. note de realisation Lot 5).
const chantierModeRaw = () => String(process.env.IAKAFRAME_CHANTIER_MODE || "").trim().toLowerCase();

await main();

async function main() {
  try {
    const raw = readAll();
    if (!raw.trim()) done();
    let p;
    try {
      p = JSON.parse(raw);
    } catch {
      done();
      return;
    }
    const tool = p.tool_name || p.toolName || "";
    if (tool !== "TodoWrite" && tool !== "Task" && tool !== "Agent") {
      done();
      return;
    }
    const ti = p.tool_input || {};
    const items = normalizeItems(tool, ti);
    if (items.length === 0) {
      done();
      return;
    }
    await withTimeout(emitPlan(p, items), EMIT_TIMEOUT_MS);
  } catch {
    /* fail-open */
  }
  done();
}

// Normalise le payload en items {content, status} (TodoWrite = liste ; Task/Agent = 1 item, M-6).
function normalizeItems(tool, ti) {
  if (tool === "TodoWrite" && Array.isArray(ti.todos)) {
    return ti.todos
      .map((t) => ({
        content: String(t.content ?? t.activeForm ?? "").trim(),
        status: String(t.status ?? "pending"),
      }))
      .filter((t) => t.content.length > 0);
  }
  if (tool === "Task" || tool === "Agent") {
    const c = String(ti.description ?? ti.subagent_type ?? "").trim();
    return c ? [{ content: c, status: "in_progress" }] : [];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Lot 5 — COUCHE CHANTIER (lecture seule) : attribution (D-12). `chantierModeRaw` est definie
// plus haut (avant `await main()`, cf. commentaire a cet endroit).
// ---------------------------------------------------------------------------

// loadChantier(sid) -> etat replie ou null (interrupteur "off", sid invalide, registre absent :
// M-9). Read-only (D-2) : jamais d'ecriture au registre depuis cet emetteur.
function loadChantier(sid) {
  if (chantierModeRaw() === "off") return null;
  try { return loadState(sid); } catch { return null; }
}

// royaumeFor(state, fallback) -> MEME regle que delegation-guard.mjs (D-12).
function royaumeFor(state, fallback) {
  const active = state && state.active ? state.active.key : null;
  if (active && (active.kind === "repo" || active.kind === "dir")) {
    return String(active.name == null ? "" : active.name).toUpperCase();
  }
  if (active && active.kind === "portefeuille") return "PORTEFEUILLE";
  return fallback;
}

function summarize(items) {
  const done_ = items.filter((i) => i.status === "completed").length;
  const run = items.filter((i) => i.status === "in_progress").length;
  return `Plan (${items.length}) : ${done_} fait(s), ${run} en cours`;
}

async function emitPlan(p, items) {
  const session = p.session_id || null;
  const cwd = p.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const state = loadChantier(session);
  const active = state && state.active ? state.active : null;
  const launch = state && state.launch ? state.launch : null;
  // D-12 : conv_id = nom du chantier ACTIF (repli HISTORIQUE : basename(cwd), M-9/M-6).
  const conv = active ? active.key.name : (basename(cwd || "") || session || "default");
  const agent = process.env.IAKALOG_AGENT || "coordinateur";
  const royaume = royaumeFor(state, process.env.IAKALOG_ROYAUME || "unknown");
  const at = ts();
  const meta = { canal: "geste", event: "plan", tool: p.tool_name, items, cwd };
  if (active) {
    meta.repo = active.key.name;
    meta.repo_root = active.key.root;
    meta.segment = active.segment;
    meta.aragorn = active.aragorn || null;
    meta.main_role = launch ? launch.main_role : null;
    if (p.agent_id) meta.agent_id = p.agent_id;
  }
  const _id = `plan-${session || conv}-${at}`;
  const doc = {
    _id,
    role: "system",
    content: summarize(items),
    ts: at,
    tokens: 0,
    meta,
    royaume,
    agent,
    conv_id: conv,
  };
  const transport = (process.env.IAKALOG_TRANSPORT || "broker").toLowerCase();
  if (transport === "docdb") return emitDocDb(doc);
  return emitBroker(doc, royaume, agent, conv);
}

// base de documents : POST {DOCDB_URL}/{db} Basic auth (calque bridge/index.js). 409 = succès.
async function emitDocDb(doc) {
  if (!process.env.DOCDB_URL) return;
  const base = String(process.env.DOCDB_URL).replace(/\/$/, "");
  const db = process.env.DOCDB_DB || "conversations";
  const user = process.env.DOCDB_USER || "";
  const pass = process.env.DOCDB_PASSWORD || "";
  const auth =
    process.env.DOCDB_AUTH ||
    "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  try {
    await fetch(`${base}/${db}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: auth },
      body: JSON.stringify(doc),
    });
  } catch {
    /* fail-open */
  }
}

// broker : publie sur le topic IAKALOG_PREFIX/<royaume>/<agent>/<conv> (calque iakalog.mjs). _id dans le payload.
function emitBroker(doc, royaume, agent, conv) {
  if (!(process.env.IAKALOG_USER && process.env.IAKALOG_PASS)) return Promise.resolve();
  const url = process.env.IAKALOG_BROKER_URL || "";
  const m = url.match(/^\w+:\/\/([^:/]+):?(\d+)?/);
  if (!m) return Promise.resolve();
  const host = m[1];
  const port = Number(m[2] || 1883);
  const prefix = process.env.IAKALOG_PREFIX || "logs";
  const topic = `${prefix}/${royaume}/${agent}/${conv}`;
  // Best-effort : on tente une connexion TCP courte ; si indisponible, fail-open.
  return new Promise((resolve) => {
    const sock = net.connect({ host, port }, () => {
      // Publication broker minimale non implémentée ici (le bridge broker reste la voie interne) :
      // en l'absence de lib broker, on s'appuie sur le transport base de documents en recette.
      sock.end();
      resolve();
    });
    sock.on("error", () => resolve());
    sock.setTimeout(400, () => {
      sock.destroy();
      resolve();
    });
  });
}

function withTimeout(promise, ms) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((r) => setTimeout(r, ms)),
  ]);
}
