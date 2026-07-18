#!/usr/bin/env node
// codex-perimeter-guard.mjs — ADAPTATEUR CODEX de la garde de PERIMETRE iakaframe (Lot A1).
//
// PARITE : ce hook applique EXACTEMENT le meme verdict de perimetre que Claude, parce qu'il appelle
// le MEME coeur ./guard-core.mjs (verrouille byte-pour-byte par cli/test/guard-core-parity.test.js).
// Symetrique de l'adaptateur Claude perimeter-guard.mjs : il ne garde que le SPECIFIQUE-Codex
// (parsing du payload, ancrage du projet, reperes du foyer ~/.codex, journal, exit code) ; la
// LOGIQUE DE DECISION pure (classer un chemin absolu contre le perimetre) vit dans guard-core.
//
// EVENEMENT : Codex `PreToolUse` — qui, comme le PreToolUse de Claude, peut BLOQUER un appel
// d'outil (ecriture fichier, commande shell, appel MCP) via exit 2. C'est ce qui rend le garde de
// perimetre FORT sur Codex (refus d'un geste qui SORT du projet courant).
//
// PAYLOAD CODEX (a CONFIRMER sur une vraie session — critere §11 de l'instruction) : la forme
// EXACTE des hooks Codex n'est pas figee upstream. Cet adaptateur est donc TOLERANT : il accepte
// plusieurs noms de champs plausibles pour l'outil (tool_name/tool/name), son entree
// (tool_input/input/arguments), le chemin (file_path/path/...) et la commande (command/cmd/script).
//
// ANCRAGE du projet : env CODEX_PROJECT_DIR en priorite (stable) ; a defaut, un champ du payload
// (project_dir / workspace_root / cwd). Aucun ancrage exploitable -> SKIP (fail-open, exit 0).
// FAIL-OPEN partout : tout bug interne / payload illisible => exit 0. Journal : ~/.codex/iakaframe-perimeter.log

import { appendFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { verdictPerimeter, isPerimeterBlocking } from "./guard-core.mjs";

const LOG = join(homedir(), ".codex", "iakaframe-perimeter.log");
const CODEX_DIR = join(homedir(), ".codex");
// Config du harnais Codex reservee a l'humain (equivalent de ~/.claude/settings.json).
const HARNESS_CONFIG = join(CODEX_DIR, "config.toml");

const allow = () => process.exit(0);
const ts = () => new Date().toISOString();
const write = (rec) => {
  try { appendFileSync(LOG, JSON.stringify(rec) + "\n", "utf8"); } catch { /* fail-open */ }
};

// Mode EFFECTIF pour un outil donne (memes semantiques que l'adaptateur Claude) : "deny" ou "warn".
const effectiveMode = (modeEnv, isCommand) => {
  const v = String(modeEnv || "").trim().toLowerCase();
  if (v === "deny") return "deny";
  if (v === "warn") return "warn";
  // default | "" | inconnu => panachage : commande shell -> warn, ecriture fichier -> deny.
  return isCommand ? "warn" : "deny";
};

// Adaptateur Codex : classe un chemin absolu contre le perimetre, en injectant les reperes du
// foyer ~/.codex et l'implementation de path. Delegue le verdict pur a guard-core.
const classifyPath = (absPath, projectDir) => verdictPerimeter(absPath, projectDir, {
  portfolioDir: CODEX_DIR,
  harnessSettings: HARNESS_CONFIG,
  relativeFn: relative,
  isAbsoluteFn: isAbsolute,
});

const isBlocking = (verdict) => isPerimeterBlocking(verdict);

// --- extraction tolerante des champs du payload Codex -----------------------

const firstString = (...vals) => {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v;
  return null;
};

// Nom de l'outil (tolerant : tool_name / tool / name / toolName).
const toolNameOf = (p) => String(firstString(p.tool_name, p.toolName, p.tool, p.name) || "");

// Entree de l'outil (tolerant : tool_input / toolInput / input / arguments / parameters).
const toolInputOf = (p) => {
  for (const k of ["tool_input", "toolInput", "input", "arguments", "parameters", "args"]) {
    if (p[k] && typeof p[k] === "object") return p[k];
  }
  return {};
};

// Chemin cible d'une ecriture (tolerant aux noms de champs).
const pathOf = (ti) => firstString(
  ti.file_path, ti.filePath, ti.path, ti.notebook_path, ti.notebookPath, ti.target, ti.dest,
);

// Commande shell (string, ou tableau de tokens -> jointe).
const commandOf = (ti) => {
  const c = ti.command ?? ti.cmd ?? ti.script ?? ti.commandLine ?? null;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.filter((x) => typeof x === "string").join(" ");
  return "";
};

// Est-ce un outil "ecriture fichier" (chemin explicite fiable) ?
const looksLikeWrite = (tool, ti) => {
  if (pathOf(ti)) {
    const t = tool.toLowerCase();
    // Un outil qui porte un chemin ET n'est pas une commande shell -> ecriture.
    if (!commandOf(ti)) return true;
    return /write|edit|patch|apply|create|file|notebook|fs/.test(t);
  }
  return false;
};

// Ancrage du projet : env stable en priorite, sinon champ du payload (honnete, documente).
const projectDirFrom = (p) => {
  const env = process.env.CODEX_PROJECT_DIR;
  if (env && env.trim()) return resolve(env);
  const fromPayload = firstString(p.project_dir, p.projectDir, p.workspace_root, p.workspaceRoot, p.cwd);
  return fromPayload ? resolve(fromPayload) : null;
};

try {
  const raw = readAll();
  if (!raw.trim()) allow();
  const p = JSON.parse(raw);
  const event = firstString(p.hook_event_name, p.hookEventName, p.event) || "";
  // On ne garde que PreToolUse (evenement bloquant). Autre evenement -> laisser passer.
  if (event && event !== "PreToolUse") allow();

  const session = firstString(p.session_id, p.sessionId) || null;
  const tool = toolNameOf(p);
  const ti = toolInputOf(p);
  const payloadCwd = firstString(p.cwd) || process.cwd();
  const modeEnvRaw = process.env.IAKAFRAME_PERIMETER_MODE;
  const modeEnv = (modeEnvRaw == null || modeEnvRaw === "") ? "default" : modeEnvRaw;

  const projectDir = projectDirFrom(p);
  if (!projectDir) {
    // Aucun ancrage -> SKIP (fail-open), symetrique du "no_project_dir" de Claude.
    write({
      at: ts(), event: "SKIP", session, tool: tool || null, path: null,
      project_dir: null, verdict: "SKIP", reason: "no_project_dir",
      mode: effectiveMode(modeEnv, true), mode_env: modeEnv,
    });
    allow();
  }

  const toAbs = (pth) => isAbsolute(pth) ? resolve(pth) : resolve(payloadCwd, pth);

  // ---- Cas ecriture fichier : chemin explicite FIABLE ----
  if (looksLikeWrite(tool, ti)) {
    const rawPath = pathOf(ti);
    const mode = effectiveMode(modeEnv, false);
    const abs = toAbs(rawPath);
    const verdict = classifyPath(abs, projectDir);
    write({
      at: ts(), event: "GESTE", session, tool: tool || "write", path: abs,
      project_dir: projectDir, verdict, mode, mode_env: modeEnv,
    });
    if (isBlocking(verdict)) {
      const why = verdict === "DENY_HARNESS"
        ? "auto-modification du harnais (~/.codex/config.toml) reservee a l'humain"
        : "chemin HORS perimetre projet";
      const msg =
        "[codex-perimeter-guard] Ecriture " + (tool || "fichier") + " " +
        (mode === "deny" ? "REFUSEE" : "HORS PERIMETRE") + " : " + why + ".\n  Cible    : " + abs +
        "\n  Perimetre: " + projectDir +
        "\n  Verdict  : " + verdict + " (mode=" + mode + ").\n" +
        (mode === "deny"
          ? "  Passe par la delegation (Aragorn/royaume) plutot qu'un geste direct hors perimetre,\n  ou exporte IAKAFRAME_PERIMETER_MODE=warn pour desamorcer.\n"
          : "  (WARN : geste laisse passer mais journalise.)\n");
      process.stderr.write(msg);
      if (mode === "deny") process.exit(2);
    }
    allow();
  }

  // ---- Cas commande shell : heuristique sur la chaine (MVP honnete, calque Claude) ----
  const command = commandOf(ti);
  if (command) {
    const mode = effectiveMode(modeEnv, true);
    const cmdShort = command.length > 500 ? command.slice(0, 500) + "…" : command;

    const absPaths = extractAbsPaths(command);
    if (absPaths.length === 0) {
      write({
        at: ts(), event: "GESTE", session, tool: tool || "shell", path: null, command: cmdShort,
        project_dir: projectDir, verdict: "SHELL_UNRESOLVED", mode, mode_env: modeEnv,
      });
      allow();
    }

    let worst = "ALLOW_PROJECT";
    const classified = [];
    for (const ap of absPaths) {
      const v = classifyPath(ap, projectDir);
      classified.push({ path: ap, verdict: v });
      if (v === "DENY_HARNESS") worst = "DENY_HARNESS";
      else if (v === "HORS" && worst !== "DENY_HARNESS") worst = "HORS";
    }

    write({
      at: ts(), event: "GESTE", session, tool: tool || "shell", path: classified, command: cmdShort,
      project_dir: projectDir, verdict: worst, mode, mode_env: modeEnv,
    });

    if (isBlocking(worst)) {
      const offenders = classified.filter((c) => isBlocking(c.verdict)).map((c) => c.path);
      const why = worst === "DENY_HARNESS"
        ? "auto-modification du harnais (~/.codex/config.toml) reservee a l'humain"
        : "chemin(s) absolu(s) HORS perimetre projet";
      const msg =
        "[codex-perimeter-guard] Commande shell " + (mode === "deny" ? "REFUSEE" : "HORS PERIMETRE") +
        " : " + why + ".\n  Chemin(s): " + offenders.join(", ") +
        "\n  Perimetre: " + projectDir +
        "\n  Verdict  : " + worst + " (mode=" + mode + ").\n" +
        (mode === "deny"
          ? "  Passe par la delegation plutot qu'un geste direct hors perimetre,\n  ou exporte IAKAFRAME_PERIMETER_MODE=warn pour desamorcer.\n"
          : "  (WARN : commande laissee passer mais journalisee. Heuristique non exhaustive.)\n");
      process.stderr.write(msg);
      if (mode === "deny") process.exit(2);
    }
    allow();
  }

  // Outil non concerne (ni ecriture, ni commande identifiable) -> laisser passer.
  allow();
} catch {
  allow(); // fail-open : un bug du garde ne fige jamais une session
}

function readAll() {
  try { return readFileSync(0, "utf8"); }
  catch { return ""; }
}

// Extrait les chemins absolus "interessants" d'une chaine shell (calque Claude, MVP honnete).
// On capte les chemins absolus du foyer (/Users/<user>/...) et ~/.codex/... ; au moindre doute,
// on n'attrape rien (-> SHELL_UNRESOLVED). On NE pretend PAS parser le shell.
function extractAbsPaths(command) {
  const out = new Set();
  const home = homedir();
  const homeEsc = home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reHome = new RegExp(homeEsc + "(?:/[^\\s'\"`;|&><]*)?", "g");
  let m;
  while ((m = reHome.exec(command)) !== null) {
    if (m[0]) out.add(resolve(m[0]));
  }
  const reTilde = /~\/\.codex(?:\/[^\s'"`;|&><]*)?/g;
  while ((m = reTilde.exec(command)) !== null) {
    const tail = m[0].slice(1); // enleve le ~
    out.add(resolve(join(home, tail)));
  }
  return [...out];
}
