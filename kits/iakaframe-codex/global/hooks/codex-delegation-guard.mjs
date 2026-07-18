#!/usr/bin/env node
// codex-delegation-guard.mjs — ADAPTATEUR CODEX de la garde de DELEGATION iakaframe (Lot A1).
//
// PARITE : ce hook applique EXACTEMENT le meme verdict de delegation que Claude, parce qu'il appelle
// le MEME coeur ./guard-core.mjs (verrouille byte-pour-byte par cli/test/guard-core-parity.test.js).
// Symetrique de l'adaptateur Claude delegation-guard.mjs : il ne garde que le SPECIFIQUE-Codex
// (parsing du payload, extraction de l'agent cible, journal, exit code) ; la LOGIQUE DE DECISION
// pure (appartenance d'un agent au roster iakaframe / aux sous-agents natifs) vit dans guard-core.
//
// EVENEMENTS :
//   - PreToolUse  : verifie que l'agent cible d'une delegation appartient au roster connu. Hors
//                   roster -> REFUS (exit 2 ; le PreToolUse de Codex bloque l'appel d'outil).
//                   Journalise l'ALLER verbatim (agent + prompt). Rend l'aller auditable.
//   - PostToolUse : journalise le RETOUR verbatim. Rend "restitution verbatim" verifiable au lieu
//                   de reposer sur la seule bonne foi de l'orchestrateur.
//
// MVP honnete (calque du pilote identite) : ce garde rend les gestes de delegation AUDITABLES et
// refuse un agent hors roster. Il NE PORTE PAS (encore) l'emission MACHINE L5 (broker/DocDB) de
// l'adaptateur Claude : c'est de l'infra runner-agnostique differee pour le pilote Codex (MVP
// d'abord). Le VERDICT, lui, est byte-identique (guard-core partage).
//
// PAYLOAD CODEX (a CONFIRMER sur une vraie session — critere §11) : forme non figee upstream. Cet
// adaptateur est TOLERANT (plusieurs noms de champs plausibles pour l'outil, l'entree, l'agent
// cible et la reponse). FAIL-OPEN : tout bug interne / payload illisible => exit 0.
// Journal : ~/.codex/iakaframe-delegations.log

import { appendFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { verdictDelegation, ROSTER, BUILTINS, AGENT_UNSET } from "./guard-core.mjs";

const LOG = join(homedir(), ".codex", "iakaframe-delegations.log");

const allow = () => process.exit(0);
const ts = () => new Date().toISOString();
const write = (rec) => {
  try { appendFileSync(LOG, JSON.stringify(rec) + "\n", "utf8"); } catch { /* fail-open */ }
};

const firstString = (...vals) => {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v;
  return null;
};

// Entree de l'outil (tolerant : tool_input / toolInput / input / arguments / parameters).
const toolInputOf = (p) => {
  for (const k of ["tool_input", "toolInput", "input", "arguments", "parameters", "args"]) {
    if (p[k] && typeof p[k] === "object") return p[k];
  }
  return {};
};

// Agent cible d'une delegation (tolerant : subagent_type / agent / persona / target...).
const agentOf = (ti) => firstString(
  ti.subagent_type, ti.subagentType, ti.agent, ti.agent_type, ti.agentType,
  ti.persona, ti.target_agent, ti.targetAgent, ti.name,
);

// Texte d'une reponse d'outil (verbatim ; tolerant string / tableau de blocs / objet).
function extractText(resp) {
  if (resp == null) return null;
  if (typeof resp === "string") return resp;
  try {
    if (Array.isArray(resp)) {
      const t = resp
        .filter((c) => c && (c.type === "text" || c.type === "output_text") && (c.text || c.content))
        .map((c) => (typeof c.text === "string" ? c.text : c.content));
      return t.length ? t.join("\n") : JSON.stringify(resp);
    }
    return typeof resp === "object" ? JSON.stringify(resp) : String(resp);
  } catch { return String(resp); }
}

try {
  const raw = readAll();
  if (!raw.trim()) allow();
  let p;
  try { p = JSON.parse(raw); } catch { allow(); }
  const event = firstString(p.hook_event_name, p.hookEventName, p.event) || "";
  const session = firstString(p.session_id, p.sessionId) || null;
  const ti = toolInputOf(p);

  if (event === "PreToolUse") {
    const agent = agentOf(ti) || AGENT_UNSET;
    write({
      at: ts(), event: "ALLER", session,
      agent,
      description: firstString(ti.description) || null,
      prompt: ti.prompt ?? null, // verbatim, jamais reformule
    });
    const { refused } = verdictDelegation(agent);
    if (refused) {
      write({ at: ts(), event: "REFUS", session, agent, raison: "hors_roster" });
      process.stderr.write(
        "[codex-delegation-guard] Delegation REFUSEE : agent cible hors roster iakaframe : '" + agent +
        "'. Roster autorise : " + ROSTER.join(", ") + " (+ sous-agents natifs : " +
        BUILTINS.join(", ") + "). Corrige l'agent cible, ou ajoute-le au roster du garde.\n"
      );
      process.exit(2);
    }
    allow();
  }

  if (event === "PostToolUse") {
    const agent = agentOf(ti) || null;
    const response = extractText(p.tool_response ?? p.toolResponse ?? p.output ?? p.result); // verbatim
    write({
      at: ts(), event: "RETOUR", session,
      agent,
      response,
    });
    allow();
  }

  // Evenement non concerne -> laisser passer.
  allow();
} catch {
  allow(); // fail-open : un bug du garde ne fige jamais une session
}

function readAll() {
  try { return readFileSync(0, "utf8"); }
  catch { return ""; }
}
