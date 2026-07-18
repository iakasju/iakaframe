#!/usr/bin/env node
// codex-identity-guard.mjs — ADAPTATEUR CODEX de la garde d'identite iakaframe (Lot 1, pilote).
//
// PARITE : ce hook applique EXACTEMENT le meme verdict d'identite que Claude, parce qu'il appelle
// le MEME coeur ./guard-core.mjs (verrouille byte-pour-byte par cli/test/guard-core-parity.test.js).
// Cable sur les hooks Codex `Stop` et `SubagentStop` (cf. hooks.example.toml de ce kit). Verifie
// que le TOUR courant OUVRE et CLOT par un badge (position de la pastille = sens). Badge manquant
// -> exit 2 (refus, message stderr). FAIL-OPEN : tout bug interne / payload illisible => exit 0.
//
// PAYLOAD CODEX (a CONFIRMER sur une vraie session — critere 8.1.1 de l'instruction) :
//   Les hooks Codex (v0.114+, experimental, non-Windows) recoivent un JSON sur stdin. La forme
//   EXACTE du transcript n'est pas figee upstream ; cet adaptateur est donc TOLERANT et accepte
//   plusieurs formes plausibles (voir extractTurn ci-dessous). AVANT de figer le pilote, capturer
//   un payload Stop/SubagentStop REEL et ajuster extractTurn si besoin. Les fixtures
//   cli/test/fixtures/guard/codex-*.json refletent la forme PRESUMEE (documentee, a valider).
//
// Le coeur du verdict (regex des badges, startOk/stopOk) N'EST PAS ici : il vit dans guard-core,
// partage avec Claude. Ici on ne fait QUE : lire le payload Codex -> reconstruire le `turn`
// canonique (messages-texte assistant, anti-chrono, turn[0] = dernier) -> deleguer le verdict.

import { readFileSync } from "node:fs";
import { verdictIdentity } from "./guard-core.mjs";

const allow = () => process.exit(0);
const block = (msg) => { process.stderr.write(msg + "\n"); process.exit(2); };

// Extrait le texte d'un contenu de message, tolerant aux formes :
//   - string simple ("...")
//   - tableau de blocs Claude-style [{type:"text", text:"..."}] / OpenAI-style [{type:"text", text}]
//   - tableau de blocs {type:"output_text"|"text", text|content}
function textOf(content) {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const parts = content
      .filter((c) => c && (c.type === "text" || c.type === "output_text" || typeof c.text === "string"))
      .map((c) => (typeof c.text === "string" ? c.text : (typeof c.content === "string" ? c.content : "")))
      .filter(Boolean);
    return parts.join("\n");
  }
  if (typeof content === "object" && typeof content.text === "string") return content.text;
  return "";
}

// Un message est-il "assistant" ? (tolerant aux schemas : role/type/sender)
function isAssistant(m) {
  const r = String(m.role || m.type || m.sender || "").toLowerCase();
  return r === "assistant" || r === "agent" || r === "model";
}
// Un message est-il un VRAI prompt user (frontiere de tour) ? Un simple retour d'outil ne l'est pas.
function isUserBoundary(m) {
  const r = String(m.role || m.type || m.sender || "").toLowerCase();
  if (r !== "user" && r !== "human") return false;
  // tool_result pur -> fait partie du tour, pas une frontiere.
  const c = m.content;
  const isToolResultOnly = Array.isArray(c) && c.length > 0
    && c.every((p) => p && (p.type === "tool_result" || p.type === "tool_call_output"));
  return !isToolResultOnly;
}

// Reconstruit `turn` (anti-chrono) depuis une liste de messages en ordre chronologique.
function turnFromMessages(messages) {
  const turn = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || typeof m !== "object") continue;
    if (isUserBoundary(m)) break;
    if (isAssistant(m)) {
      const t = textOf(m.content ?? m.message?.content ?? m.text).trim();
      if (t) turn.push(t);
    }
  }
  return turn;
}

// Obtient la liste de messages (ordre chrono) depuis le payload Codex, selon plusieurs formes
// plausibles. Retourne null si rien d'exploitable (=> l'adaptateur SKIP -> allow).
function messagesFromPayload(p) {
  // Forme A : transcript inline (tableau de messages).
  for (const key of ["transcript", "messages", "conversation", "turn"]) {
    if (Array.isArray(p[key])) return p[key];
  }
  // Forme B : transcript_path -> fichier JSONL (une ligne = un message/objet), a la Claude.
  const tp = p.transcript_path || p.transcriptPath || null;
  if (tp) {
    let lines;
    try { lines = readFileSync(tp, "utf8").split(/\r?\n/); }
    catch { return null; }
    const out = [];
    for (const line of lines) {
      const s = line.trim();
      if (!s) continue;
      try {
        const obj = JSON.parse(s);
        // Claude-style : { type:"assistant", message:{content:[...]} } -> normalise en {role,content}.
        if (obj.type && obj.message) out.push({ role: obj.type, content: obj.message.content });
        else out.push(obj);
      } catch { /* ligne illisible -> ignoree (fail-open partiel) */ }
    }
    return out;
  }
  return null;
}

try {
  const raw = readFileSync(0, "utf8");
  if (!raw.trim()) allow();
  const payload = JSON.parse(raw);
  // Anti-boucle : si Codex expose un drapeau d'auto-declenchement, on ne re-juge pas.
  if (payload.stop_hook_active) allow();

  const messages = messagesFromPayload(payload);
  if (!Array.isArray(messages)) allow(); // rien d'exploitable -> fail-open

  const turn = turnFromMessages(messages);
  const res = verdictIdentity(turn);
  if (res.skip || (res.startOk && res.stopOk)) allow();

  const miss = [];
  if (!res.startOk) miss.push("ouverture (pastille AVANT le bloc en PREMIERE ligne, ex: 🟡 [ROYAUME][Agent])");
  if (!res.stopOk) miss.push("cloture (pastille APRES le bloc en derniere ligne, ex: [ROYAUME][Agent] 🟡)");
  block(
    "Garde d'identite iakaframe (Codex) : badge manquant -> " + miss.join(" + ") +
    ". Convention : ouverture = pastille AVANT, cloture = pastille APRES."
  );
} catch {
  allow(); // fail-open : un bug du garde ne fige jamais une session
}
