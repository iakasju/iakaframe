#!/usr/bin/env node
// delegation-guard.mjs — Garde iakaframe du canal GESTES (la faille diagnostiquee).
// Cable sur PreToolUse + PostToolUse, matcher "Task" (outil de delegation a un sous-agent).
//
// Pourquoi : les gardes d'identite (identity-guard.mjs) ne lisent que le canal ADRESSE
// (blocs texte) aux frontieres de parole (Stop/SubagentStop). La delegation, elle, est un
// GESTE (tool_use) dont le payload echappe totalement a ces gardes. Ce script pose un garde
// sur le bon canal :
//   - PreToolUse  : journalise l'ALLER verbatim (agent cible + prompt envoye) et verifie que
//                   l'agent cible appartient au roster connu. Rend l'aller auditable.
//   - PostToolUse : journalise le RETOUR verbatim. Rend "restitution verbatim" verifiable
//                   au lieu de reposer sur la seule bonne foi de l'orchestrateur. EMET aussi
//                   (L5) un document MACHINE de delegation sur le canal geste vers la base de logs /
//                   le broker configures par les variables d'environnement IAKALOG_* / DOCDB_*.
//
// MVP honnete : ce garde rend les gestes AUDITABLES (il ne pretend pas policer
// semantiquement les frontieres de role, ce qui n'est pas fiable). FAIL-OPEN : ne bloque
// jamais un travail reel pour un bug interne. Journal : ~/.claude/iakaframe-delegations.log
//
// L5 — Tracage MACHINE des delegations (canal geste -> base de logs / broker via IAKALOG_* / DOCDB_*) :
//   A PostToolUse, si subagent_type est un agent du ROSTER iakaframe, on EMET un document
//   { role:"system", content:"Delegation X -> Y : ...", meta:{canal:"geste", event:"delegation",
//   from, to, verdict?} } vers la base de logs / le broker (IAKALOG_* / DOCDB_*). Best-effort, NON BLOQUANT, fail-open total.
//   Transport selectionnable par IAKALOG_TRANSPORT : "broker" (defaut) | "docdb"
//   (fallback recette offline, POST {DOCDB_URL}/{db} Basic auth, calque sur bridge/index.js).
//   _id deterministe (idempotence ; 409 = succes). Sous-agents natifs -> AUCUNE emission.
//   Borne iakaframe : identite de log (IAKALOG_* / DOCDB_*) absente -> aucune emission, exit 0.
//
// Lot 5 (specs/instructions/declaration-chantier-session.md § D-6, D-12) — COUCHE CHANTIER :
//   Apres le controle de roster CI-DESSUS (inchange), et SEULEMENT s'il n'a pas refuse, on
//   applique `verdictDispatch` (guard-core.mjs, pur) : DENY (exit 2) si la delegation sort du
//   chantier de la session (D-6). AUCUNE ecriture au registre (D-2 : seul `chantier-remind.mjs`
//   ecrit `declare`/`grant`) — ce garde ne fait que LIRE l'etat replie (`loadState`, read-only).
//   Attribution (D-12) : chaque ligne de journal (ALLER/RETOUR) et chaque document EMIS portent
//   `chantier: {repo, repo_root, segment, aragorn, main_role, agent_id?}` quand un chantier actif
//   existe ; le `royaume` du document emis suit la meme regle que `plan-courante.mjs` (nom du
//   depot en MAJUSCULE, `PORTEFEUILLE`, sinon l'env IAKALOG_ROYAUME inchange).
//   Couche IGNOREE (comportement HISTORIQUE, M-9) si `IAKAFRAME_CHANTIER_MODE=off`, ou si
//   `session_id` est absent/hors forme, ou si aucun registre n'existe encore pour cette session
//   (ENOENT) : dans tous ces cas `loadChantier` rend `null` et ce garde ne fait QUE le controle de
//   roster preexistant, sans verdict de chantier.

import { appendFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import net from "node:net";
import { verdictDelegation, verdictDispatch, parseChantierLines, ROSTER, BUILTINS, AGENT_UNSET } from "./guard-core.mjs";
import { loadState, resolveRepoArg, sessionShellHint } from "./chantier-state.mjs";

const LOG = join(homedir(), ".claude", "iakaframe-delegations.log");

// Plafond d'attente de l'emission. Le garde est un hook VIVANT (chaque Task, y compris
// la session en cours) : on ne PEND JAMAIS. Au-dela, on abandonne et on laisse passer.
// Declare ICI (avant `await main()`) : sinon TDZ -> ReferenceError avalee = 0 emission.
const EMIT_TIMEOUT_MS = 1500;

const allow = () => process.exit(0);

const ts = () => new Date().toISOString();
const write = (rec) => {
  try { appendFileSync(LOG, JSON.stringify(rec) + "\n", "utf8"); } catch { /* fail-open */ }
};

// ---------------------------------------------------------------------------
// Lot 5 — COUCHE CHANTIER (lecture seule) : verdict de la delegation (D-6) + attribution (D-12).
// ---------------------------------------------------------------------------

const chantierModeRaw = () => String(process.env.IAKAFRAME_CHANTIER_MODE || "").trim().toLowerCase();

// loadChantier(sid) -> etat replie ou null (interrupteur "off", sid invalide, registre absent :
// M-9, meme convention que perimeter-guard.mjs/chantier-remind.mjs). Read-only (D-2) : ce garde
// n'appelle JAMAIS `ensureLaunch`/`appendEvent` — aucune ecriture au registre.
function loadChantier(sid) {
  if (chantierModeRaw() === "off") return null;
  try { return loadState(sid); } catch { return null; }
}

// resolveDispatchRequest(promptText, state) -> { key, ambiguous } (D-3/D-4, adaptateur de D-6).
// Plusieurs lignes `Chantier:` DIVERGENTES (parseChantierLines) -> ambiguous:true (regle 2, D-6).
// Une ligne UNIQUE dont le NOM est AMBIGU (deux depots connus de meme nom sous des racines
// differentes, `resolveRepoArg` -> `{ambiguous:true}`, M-10) est traitee comme une absence de
// ligne (key:null) : regime Odin -> `DISPATCH_UNNAMED` (jamais un ALLOW silencieux sur un token
// qui ne designe rien de verifiable). ATTENTION, distinct d'un nom INCONNU (aucun candidat) : la
// meme regle D-3 qui accepte `chantier <nom-inexistant>` (creation de projet) s'applique ici —
// `resolveRepoArg` fabrique alors une cle `{kind:"dir", root:<racine>/<nom>}` REELLE, jamais
// `key:null` (constat corrige au gate Legolas du Lot 5 : la version precedente de ce commentaire
// disait a tort que "depot inconnu" donnait aussi `key:null`). Cette cle "dir" fabriquee ne
// correspond jamais a un chantier deja actif -> `CHANTIER_MISMATCH` (regle 5, D-6), teste dans
// guard-chantier-delegation.test.js (les deux regimes).
function resolveDispatchRequest(promptText, state) {
  const { repo, ambiguous } = parseChantierLines(promptText || "");
  if (ambiguous) return { key: null, ambiguous: true };
  if (!repo) return { key: null, ambiguous: false };
  let res = null;
  try { res = resolveRepoArg(repo, { requireExisting: false, state }); } catch { res = null; }
  return { key: res && res.key ? res.key : null, ambiguous: false };
}

// chantierAttribution(p, state) -> { repo, repo_root, segment, aragorn, main_role, agent_id? } |
// null (D-12). `null` quand aucun chantier actif n'est connu (couche ignoree, ou segment jamais
// ouvert — cas degenere d'un registre illisible).
function chantierAttribution(p, state) {
  const active = state && state.active ? state.active : null;
  if (!active) return null;
  const launch = state.launch || null;
  const meta = {
    repo: active.key.name,
    repo_root: active.key.root,
    segment: active.segment,
    aragorn: active.aragorn || null,
    main_role: launch ? launch.main_role : null,
  };
  if (p && p.agent_id) meta.agent_id = p.agent_id;
  return meta;
}

// royaumeFor(state, fallback) -> D-12 : nom du depot/dossier en MAJUSCULE si kind repo|dir,
// PORTEFEUILLE si @portefeuille, sinon `fallback` (l'env IAKALOG_ROYAUME, INCHANGE).
function royaumeFor(state, fallback) {
  const active = state && state.active ? state.active.key : null;
  if (active && (active.kind === "repo" || active.kind === "dir")) {
    return String(active.name == null ? "" : active.name).toUpperCase();
  }
  if (active && active.kind === "portefeuille") return "PORTEFEUILLE";
  return fallback;
}

const shortSid = (sid) => String(sid || "").slice(0, 8);

function roleLabel(launch) {
  if (!launch || launch.main_role !== "team") return "odin";
  return `team:${launch.main_agent_type || "?"}`;
}

function activeLabel(state) {
  return state && state.active ? state.active.key.name : "aucun";
}

// dispatchDenyMessage(code, ...) : adaptation du modele "Messages" de l'instruction (§ "Messages")
// a une DELEGATION (pas un chemin) — la delegation vise un AGENT, pas un fichier/repertoire, le
// modele litteral ("<Outil> vise <nom> (<root>)") ne s'y applique donc pas mot pour mot. 2e
// amendement (L-5) : jamais le secours "designer le depot... puis deleguer a aragorn" — seule la
// proposition d'une session Aragorn reste (Q-P1 = A).
function dispatchDenyMessage(code, { agent, state, session }) {
  const launch = state && state.launch;
  const lines = [
    `[chantier-guard] REFUSE (${code}) : delegation vers '${agent}' refusee.`,
    `  Chantier actif : ${activeLabel(state)} (role ${roleLabel(launch)}) — session ${shortSid(session)}.`,
  ];
  if (code === "DISPATCH_AMBIGUOUS") {
    lines.push("  Pour continuer : plusieurs lignes `Chantier: <repo>` divergentes dans l'ordre de mission ; n'en garder qu'une.");
  } else if (code === "NO_CHANTIER") {
    lines.push("  Pour continuer : aucun chantier actif pour cette session (session Aragorn dans le bon depot, ou `chantier <repo>`).");
  } else if (code === "ODIN_DISPATCH") {
    // 2e amendement (L-5/P-6, Q-P1 = A) : le garde (D-6 regle 4) reste inchange, mais le
    // CONTRAT ne propose plus le secours "delegue a aragorn avec la ligne Chantier: <nom>" —
    // seule reste la proposition d'une session Aragorn (meme forme que perimeter-guard.mjs,
    // ODIN_DIRECT : `sessionShellHint` sur le chantier actif, role "odin").
    const active = state && state.active ? state.active.key : null;
    const hint = active && active.root ? sessionShellHint(active.root, "odin", active.kind) : null;
    lines.push(`  Pour continuer : ${hint || "demande a Odin de lancer une session Aragorn dans le bon depot"}.`);
  } else if (code === "DISPATCH_UNNAMED") {
    lines.push("  Pour continuer : ajoute la ligne `Chantier: <repo>` (2e ligne de l'ordre de mission).");
  } else if (code === "CHANTIER_MISMATCH") {
    const active = state && state.active ? state.active.key : null;
    const hint = active && active.root ? sessionShellHint(active.root, roleLabel(launch), active.kind) : null;
    lines.push(`  Pour continuer : ${hint || "declare le bon chantier (session Aragorn dans le depot vise)"}.`);
  }
  lines.push("  L'exception `odin-direct <nom>` ne peut etre tapee QUE par le decideur. La lecture reste libre.");
  return lines.join("\n") + "\n";
}

await main();

async function main() {
  try {
  const raw = readAll();
  if (!raw.trim()) allow();
  let p;
  try { p = JSON.parse(raw); } catch { allow(); return; }
  const event = p.hook_event_name || "";
  const session = p.session_id || null;

  if (event === "PreToolUse") {
    const ti = p.tool_input || {};
    const agent = ti.subagent_type || ti.subagentType || AGENT_UNSET;
    const state = loadChantier(session);
    const chantierMeta = chantierAttribution(p, state);
    const royaume = royaumeFor(state, process.env.IAKALOG_ROYAUME || "unknown");
    write({
      at: ts(), event: "ALLER", session,
      agent,
      description: ti.description || null,
      prompt: ti.prompt ?? null, // verbatim, jamais reformule
      ...(chantierMeta ? { chantier: chantierMeta } : {}),
    });
    const { refused } = verdictDelegation(agent);
    if (refused) {
      // Hors roster connu -> REFUS (exit 2). L'ALLER est deja journalise ci-dessus.
      write({ at: ts(), event: "REFUS", session, agent, raison: "hors_roster" });
      // L5 : on EMET aussi la tentative refusee (signal methode), best-effort non bloquant,
      // AVANT le refus (l'emission ne doit jamais empecher le refus de partir).
      // Emission AWAITED + bornee + fail-open AVANT le refus (sinon process.exit la tue).
      await emitDelegation({
        session,
        agent,
        description: ti.description || null,
        response: null,
        atAller: ts(),
        refused: true,
        chantierMeta,
        royaumeOverride: royaume,
      });
      process.stderr.write(
        "[delegation-guard] Delegation REFUSEE : agent cible hors roster iakaframe : '" + agent +
        "'. Roster autorise : " + ROSTER.join(", ") + " (+ sous-agents natifs : " +
        BUILTINS.join(", ") + "). Corrige subagent_type, ou ajoute l'agent au roster du garde.\n"
      );
      process.exit(2);
    }

    // Lot 5 (D-6) — verdict CHANTIER de la delegation, APRES le controle de roster ci-dessus.
    // `state` absent (couche ignoree, M-9) -> comportement HISTORIQUE (aucun verdict de chantier).
    if (state) {
      const launch = state.launch;
      const sessionRole = launch ? launch.main_role : "odin";
      const actor = p.agent_id ? "SUB" : "MAIN";
      const requested = resolveDispatchRequest(ti.prompt, state);
      const verdict = verdictDispatch({
        actor, sessionRole, target: agent, requested, state, launch: launch ? launch.key : null,
      });
      if (verdict.decision === "DENY") {
        write({
          at: ts(), event: "DISPATCH_REFUS", session, agent, code: verdict.code,
          ...(chantierMeta ? { chantier: chantierMeta } : {}),
        });
        process.stderr.write(dispatchDenyMessage(verdict.code, { agent, state, session }));
        process.exit(2);
      }
    }
    allow();
  }

  if (event === "PostToolUse") {
    const ti = p.tool_input || {};
    const agent = (ti.subagent_type || ti.subagentType) || null;
    const response = extractText(p.tool_response); // verbatim
    const state = loadChantier(session);
    const chantierMeta = chantierAttribution(p, state);
    const royaume = royaumeFor(state, process.env.IAKALOG_ROYAUME || "unknown");
    write({
      at: ts(), event: "RETOUR", session,
      agent,
      response,
      ...(chantierMeta ? { chantier: chantierMeta } : {}),
    });
    // L5 : RETOUR = moment d'emission de reference (delegation complete : cible + resultat).
    // Best-effort non bloquant ; n'emet QUE pour le roster iakaframe (anti-bruit D5).
    // AWAITED + bornee : on flushe l'emission AVANT process.exit, sinon 0 doc en base.
    await emitDelegation({
      session,
      agent,
      description: ti.description || null,
      response,
      atAller: ts(),
      refused: false,
      chantierMeta,
      royaumeOverride: royaume,
    });
    allow();
  }

  allow();
  } catch {
    allow(); // fail-open
  }
}

function readAll() {
  try { return readFileSync(0, "utf8"); }
  catch { return ""; }
}

function extractText(resp) {
  if (resp == null) return null;
  if (typeof resp === "string") return resp;
  // tool_response peut etre un tableau de blocs {type:"text", text:"..."} ou un objet.
  try {
    if (Array.isArray(resp)) {
      const t = resp.filter((c) => c && c.type === "text" && c.text).map((c) => c.text);
      return t.length ? t.join("\n") : JSON.stringify(resp);
    }
    return typeof resp === "object" ? JSON.stringify(resp) : String(resp);
  } catch { return String(resp); }
}

// ---------------------------------------------------------------------------
// L5 — Emission MACHINE de la delegation (canal geste). Tout est fail-open : la
// moindre anomalie est avalee, on ne casse JAMAIS la session ni le garde.
// ---------------------------------------------------------------------------

// Extraction best-effort du verdict (D4 / A4). Renseigne UNIQUEMENT si un marqueur
// explicite PASS/FAIL existe dans la reponse ; absent sinon (pas de parsing intelligent).
function deriveVerdict(response) {
  if (!response || typeof response !== "string") return undefined;
  // Marqueurs explicites : "gate ... PASS", "PASS", "FAIL", "verdict: pass", "KO/OK gate".
  if (/\bgate[^\n]{0,40}\bFAIL\b/i.test(response) || /\bverdict\s*[:=]\s*fail\b/i.test(response)) return "FAIL";
  if (/\bgate[^\n]{0,40}\bPASS\b/i.test(response) || /\bverdict\s*[:=]\s*pass\b/i.test(response)) return "PASS";
  if (/\bFAIL\b/.test(response)) return "FAIL";
  if (/\bPASS\b/.test(response)) return "PASS";
  return undefined;
}

// _id deterministe (idempotence). 409 lors d'un POST = succes silencieux.
function makeDocId(session, to, atAller, refused) {
  const safe = (s) => String(s == null ? "x" : s).replace(/[^a-zA-Z0-9_-]/g, "-");
  const kind = refused ? "refused" : "deleg";
  return `${kind}-${safe(session)}-${safe(atAller)}-${safe(to)}`;
}

// Course fail-open : resout (timeout) au bout de ms quoi qu'il arrive ; jamais de reject.
function withTimeout(promise, ms) {
  return Promise.race([
    Promise.resolve(promise).catch(() => "error"),
    new Promise((resolve) => setTimeout(() => resolve("timeout"), ms)),
  ]).catch(() => "error");
}

// AWAITED + bornee + fail-open. main() doit AWAIT cet appel AVANT process.exit, sinon
// l'emission ne part jamais (le defaut bloquant corrige en L5 : 0 doc en base).
// Lot 5 (D-12) : `chantierMeta` ({repo, repo_root, segment, aragorn, main_role, agent_id?}, ou
// null) et `royaumeOverride` (deja calcule par l'appelant via `royaumeFor`) portent l'attribution
// du document emis au chantier de la session, quand un chantier actif est connu.
async function emitDelegation({ session, agent, description, response, atAller, refused, chantierMeta, royaumeOverride }) {
  try {
    const to = agent == null ? null : String(agent);
    // D5 anti-bruit : on n'emet QUE pour le roster iakaframe. Les sous-agents natifs
    // (Explore/Plan/general-purpose...) et un agent absent -> AUCUNE emission.
    if (!to || !ROSTER.includes(to.toLowerCase())) {
      // Exception : une tentative refusee (hors roster) PEUT etre emise si demande.
      // refused=true vient d'un agent hors roster ; on l'emet quand meme (signal methode).
      if (!refused) return;
    }

    const from = process.env.IAKALOG_AGENT || "unknown";
    const royaume = royaumeOverride || process.env.IAKALOG_ROYAUME || "unknown";

    // D6 — Borne iakaframe : sans identite de log (IAKALOG_* / DOCDB_*) configuree, AUCUNE emission.
    const transport = (process.env.IAKALOG_TRANSPORT || "broker").toLowerCase();
    const hasBrokerId = !!(process.env.IAKALOG_USER && process.env.IAKALOG_PASS);
    const hasDocId = !!(process.env.DOCDB_URL &&
      (process.env.DOCDB_USER || process.env.DOCDB_PASSWORD || process.env.DOCDB_AUTH));
    if (transport === "docdb" ? !hasDocId : !hasBrokerId) return;

    const verdict = deriveVerdict(response);
    const conv = session || process.env.IAKALOG_CONV || "default";
    const eventName = refused ? "delegation_refused" : "delegation";
    const arrow = refused ? "(REFUSE) " : "";
    const desc = description ? " : " + description : "";
    const content = `Delegation ${arrow}${from} -> ${to || "(inconnu)"}${desc}`;
    const meta = { canal: "geste", event: eventName, from, to: to || null };
    if (verdict) meta.verdict = verdict;
    if (refused) meta.refused = true;
    // D-12 : attribution au chantier de la session, quand un chantier actif est connu.
    if (chantierMeta) {
      meta.repo = chantierMeta.repo;
      meta.repo_root = chantierMeta.repo_root;
      meta.segment = chantierMeta.segment;
      meta.aragorn = chantierMeta.aragorn;
      meta.main_role = chantierMeta.main_role;
      if (chantierMeta.agent_id !== undefined) meta.agent_id = chantierMeta.agent_id;
    }
    const _id = makeDocId(session, to, atAller, refused);

    const doc = { _id, role: "system", content, ts: atAller, tokens: 0, meta, royaume, agent: from, conv_id: conv };

    // AWAITED mais BORNEE : on flushe l'emission, sans jamais depasser EMIT_TIMEOUT_MS.
    if (transport === "docdb") {
      await withTimeout(emitDocDB(doc), EMIT_TIMEOUT_MS);
    } else {
      await withTimeout(emitBroker({ royaume, agent: from, conv, doc }), EMIT_TIMEOUT_MS);
    }
  } catch { /* fail-open : une emission ne doit jamais casser le garde */ }
}

// Transport base de documents : POST {DOCDB_URL}/{db} Basic auth (calque sur bridge/index.js).
// AWAITED : on attend la reponse (flush) ; AbortController borne la requete ; 409 = succes
// (idempotence). Toute erreur est avalee -> fail-open total, jamais de throw propage.
async function emitDocDB(doc) {
  const ctrl = new AbortController();
  const t = setTimeout(() => { try { ctrl.abort(); } catch { /* noop */ } }, EMIT_TIMEOUT_MS);
  try {
    const base = String(process.env.DOCDB_URL).replace(/\/$/, "");
    const db = process.env.DOCDB_DB || "conversations";
    const user = process.env.DOCDB_USER || "";
    const pass = process.env.DOCDB_PASSWORD || "";
    const auth = process.env.DOCDB_AUTH ||
      ("Basic " + Buffer.from(`${user}:${pass}`).toString("base64"));
    // fetch dispo en Node 18+. On AWAIT pour garantir le flush avant process.exit.
    const res = await fetch(`${base}/${db}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(doc),
      signal: ctrl.signal,
    });
    // 409 Conflict = le doc (meme _id) existe deja -> succes silencieux (idempotence).
    if (res && res.status === 409) return "exists";
    if (res && !res.ok) return "http-" + res.status;
    return "ok";
  } catch {
    return "error"; // fail-open : timeout/abort/reseau -> on abandonne sans bloquer
  } finally {
    clearTimeout(t);
  }
}

// Transport broker : publie sur le topic IAKALOG_PREFIX/<royaume>/<agent>/<conv> (calque sur iakalog.mjs).
// _id voyage dans le payload ; le bridge l'honore s'il est present. AWAITED + timeout court :
// resout quand le PUBLISH est ecrit OU au timeout, jamais de reject (fail-open).
function emitBroker({ royaume, agent, conv, doc }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done) { done = true; resolve(r); } };
    try {
      const url = process.env.IAKALOG_BROKER_URL || "";
      const u = url.match(/^\w+:\/\/([^:/]+)(?::(\d+))?/);
      if (!u) return finish("bad-url");
      const host = u[1], port = parseInt(u[2] || "1883", 10);
      const USER = process.env.IAKALOG_USER, PASS = process.env.IAKALOG_PASS;
      const prefix = process.env.IAKALOG_PREFIX || "logs";
      const topic = `${prefix}/${royaume}/${agent}/${conv}`;
      const payload = JSON.stringify(doc);

      const remLen = (n) => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 0x80; o.push(d); } while (n > 0); return Buffer.from(o); };
      const mstr = (s) => { const b = Buffer.from(s, "utf8"); return Buffer.concat([Buffer.from([b.length >> 8, b.length & 0xff]), b]); };
      const connectPkt = () => {
        const rest = Buffer.concat([mstr(String.fromCharCode(0x4d,0x51,0x54,0x54)), Buffer.from([4, 0xC2, 0, 30]), mstr("delegguard-" + process.pid), mstr(USER), mstr(PASS)]);
        return Buffer.concat([Buffer.from([0x10]), remLen(rest.length), rest]);
      };
      const publishPkt = () => {
        const body = Buffer.concat([mstr(topic), Buffer.from(payload, "utf8")]);
        return Buffer.concat([Buffer.from([0x30]), remLen(body.length), body]);
      };

      const sock = net.connect({ host, port });
      const timer = setTimeout(() => { try { sock.destroy(); } catch { /* noop */ } finish("timeout"); }, EMIT_TIMEOUT_MS);
      sock.on("error", () => { clearTimeout(timer); try { sock.destroy(); } catch { /* noop */ } finish("error"); });
      let connacked = false;
      sock.on("connect", () => { try { sock.write(connectPkt()); } catch { /* noop */ } });
      sock.on("data", (d) => {
        if (connacked || d[0] !== 0x20) return;
        connacked = true;
        if (d[3] !== 0) { clearTimeout(timer); try { sock.destroy(); } catch { /* noop */ } return finish("refused"); }
        try { sock.write(publishPkt(), () => { clearTimeout(timer); try { sock.end(); } catch { /* noop */ } finish("ok"); }); }
        catch { clearTimeout(timer); try { sock.destroy(); } catch { /* noop */ } finish("error"); }
      });
    } catch { finish("error"); }
  });
}
