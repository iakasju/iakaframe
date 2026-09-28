#!/usr/bin/env node
// perimeter-guard.mjs — Garde iakaframe du canal des GESTES DIRECTS (Edit/Write/Bash/NotebookEdit/
// PowerShell). Cable sur PreToolUse, matcher "Edit|Write|Bash|NotebookEdit|PowerShell".
//
// Pourquoi : delegation-guard.mjs ne garde QUE l'outil Task/Agent (delegation). Les gestes mutateurs
// DIRECTS (Edit/Write/Bash/NotebookEdit/PowerShell) ne sont gardes par aucun autre hook -> faille de
// perimetre (un Edit/commit hors du perimetre courant passe non controle). Ce garde detecte le(s)
// chemin(s)/cle(s) touche(s), journalise, et selon le mode signale (WARN, exit 0) ou bloque (DENY,
// exit 2) un geste qui SORT du perimetre autorise.
//
// PRINCIPE : garde de CHEMINS/CLES, jamais de personas (la persona iakaframe est absente du payload).
// FAIL-OPEN partout : tout bug interne => exit 0. Journal : ~/.claude/iakaframe-perimeter.log
//
// ARCHITECTURE (Lot 0, parite multirunner) : ce fichier est l'ADAPTATEUR CLAUDE de la garde de
// perimetre. La LOGIQUE DE DECISION pure (classement d'un chemin absolu contre le perimetre,
// verdicts CHANTIER) vit dans ./guard-core.mjs (verdictPerimeter/isPerimeterBlocking/verdictChantier/
// classifyShell), partagee avec les autres runners. Ici on ne garde que le specifique-Claude :
// ancrage, resolution des chemins (cwd/tilde), reperes du foyer ~/.claude, journal, exit code.
//
// ---------------------------------------------------------------------------------------------
// COUCHE CHANTIER (Lot 4, specs/instructions/declaration-chantier-session.md § D-5, D-7, D-9, D-11,
// D-12, D-14). Quand elle est ACTIVE (session_id exploitable ET IAKAFRAME_CHANTIER_MODE != "off"),
// elle REMPLACE l'ancrage historique $CLAUDE_PROJECT_DIR (D-11 : "un remplacement de l'ancrage, pas
// un 2e garde" — UN SEUL verdict par geste, dans CE MEME fichier, un seul journal). Sinon (pas de
// session_id exploitable, ou interrupteur "off") : le CHEMIN HISTORIQUE ci-dessous s'applique,
// STRICTEMENT INCHANGE (comportement anterieur au Lot 4, M-9 : les tests de non-regression sans
// session_id gardent leur comportement actuel).
//
// DIVERGENCE CODEX ASSUMEE (D-11) : cette couche n'existe QUE cote Claude — codex-perimeter-guard.mjs
// n'en porte aucune trace (hors scope du Lot 4, cf. instruction § Perimetre "Exclu" : "cablage des
// adaptateurs Codex"). Symetrique de la divergence deja assumee et testee dans
// cli/test/guard-codex-complet.test.js (absence totale d'ancrage projet -> skip/allow des deux
// hosts, sans que Codex partage la couche chantier). Le coeur pur (verdictChantier, classifyShell,
// foldChantier...) reste partage octet pour octet entre les deux kits (guard-core-parity.test.js) ;
// seul CET ADAPTATEUR l'exploite pour l'instant.
//
// 2e amendement (specs/instructions/prise-de-parole-odin-aragorn.md, lecture L-5) : les messages de
// refus ci-dessous ne proposent JAMAIS le secours "designer le depot... puis deleguer a aragorn"
// (retire du contrat, Q-P1 = A) — seule reste la proposition d'une session Aragorn. Aucun autre
// changement de verdict n'est du a cet amendement.
// ---------------------------------------------------------------------------------------------

import { appendFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { verdictPerimeter, isPerimeterBlocking, classifyShell, verdictChantier, keySig } from "./guard-core.mjs";
import {
  ensureLaunch, hardDeny, isExcluded, keyOf, resolveRepoArg, sessionShellHint, failOpen,
} from "./chantier-state.mjs";

const LOG = join(homedir(), ".claude", "iakaframe-perimeter.log");
const CLAUDE_DIR = join(homedir(), ".claude");
const HARNESS_SETTINGS = join(CLAUDE_DIR, "settings.json");

const allow = () => process.exit(0);
const ts = () => new Date().toISOString();
const write = (rec) => {
  try { appendFileSync(LOG, JSON.stringify(rec) + "\n", "utf8"); } catch { /* fail-open */ }
};

// Resout le mode EFFECTIF pour un outil donne, a partir de la valeur brute de la variable.
// Renvoie "deny" ou "warn". (Chemin HISTORIQUE uniquement — la couche chantier ne s'appuie plus
// sur IAKAFRAME_PERIMETER_MODE, D-11.)
const effectiveMode = (modeEnv, tool) => {
  const v = String(modeEnv || "").trim().toLowerCase();
  if (v === "deny") return "deny";
  if (v === "warn") return "warn";
  // default | "" | inconnu => panachage par outil
  return tool === "Bash" ? "warn" : "deny";
};

// Adaptateur Claude : classe un chemin absolu contre le perimetre, en injectant les reperes du
// foyer ~/.claude et l'implementation de path. Delegue le verdict pur a guard-core. (HISTORIQUE)
// Racines EXTRA autorisees par l'humain (~/.claude/iakaframe-perimeter-allow.txt, une par ligne,
// `#` = commentaire). Fichier absent -> aucune. Le DENY harnais reste prioritaire.
const ALLOW_FILE = join(CLAUDE_DIR, "iakaframe-perimeter-allow.txt");
const extraRoots = (() => {
  try {
    return readFileSync(ALLOW_FILE, "utf8").split(/\r?\n/)
      .map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => resolve(l));
  } catch { return []; }
})();

const classifyPath = (absPath, projectDir) => {
  const verdict = verdictPerimeter(absPath, projectDir, {
    portfolioDir: CLAUDE_DIR,
    harnessSettings: HARNESS_SETTINGS,
    relativeFn: relative,
    isAbsoluteFn: isAbsolute,
  });
  if (verdict !== "HORS") return verdict;
  const under = (base) => {
    const rel = relative(base, absPath);
    return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
  };
  return extraRoots.some(under) ? "ALLOW_EXTRA" : verdict;
};

const isBlocking = (verdict) => isPerimeterBlocking(verdict);

// =================================================================================================
// COUCHE CHANTIER — helpers (Lot 4)
// =================================================================================================

const chantierModeRaw = () => String(process.env.IAKAFRAME_CHANTIER_MODE || "").trim().toLowerCase();

const shortSid = (sid) => String(sid || "").slice(0, 8);

// roleLabel(launch) -> "odin" | "team:<agent_type>" (affichage, modele au § "Messages" de
// l'instruction — jamais utilise pour une comparaison, seulement pour le texte).
function roleLabel(launch) {
  if (!launch || launch.main_role !== "team") return "odin";
  return `team:${launch.main_agent_type || "?"}`;
}

function activeLabel(state) {
  return state && state.active ? state.active.key.name : "aucun";
}

// D-12 : chaque ligne de journal de la couche chantier porte agent_id, agent_type et
// chantier:{name, root, segment, by, main_role}.
function chantierMeta(p, state) {
  const active = state && state.active;
  const launch = state && state.launch;
  return {
    agent_id: (p && p.agent_id) ?? null,
    agent_type: (p && p.agent_type) ?? null,
    chantier: {
      name: active ? active.key.name : null,
      root: active ? active.key.root : null,
      segment: active ? active.segment : null,
      by: active ? active.by : null,
      main_role: launch ? launch.main_role : null,
    },
  };
}

// toAbsWide(pth, cwd) : resolution ELARGIE (tilde compris, D-7 "formes ... ~/...") utilisee
// UNIQUEMENT par la couche chantier. Le chemin historique garde SA propre resolution (toAbs plus
// bas), STRICTEMENT inchangee.
function toAbsWide(pth, cwd) {
  const s = String(pth);
  if (s.startsWith("~")) return resolve(join(homedir(), s.slice(1)));
  return isAbsolute(s) ? resolve(s) : resolve(cwd, s);
}

// Cible affichee dans un message de refus "famille chantier" (NO_CHANTIER/CHANTIER_MISMATCH/
// ODIN_DIRECT/TEAM_NEEDS_REPO) : le(s) chemin(s) EN CAUSE plutot que payload.cwd seul quand
// plusieurs cles sont touchees (parite avec l'ancien style "offenders" du chemin historique).
function targetOf(keys, state) {
  if (!keys || keys.length === 0) return { name: "@hors", root: null, kind: null };
  const activeSig = state && state.active ? keySig(state.active.key) : null;
  const offenders = activeSig != null ? keys.filter((k) => keySig(k) !== activeSig) : keys;
  const pick = offenders.length ? offenders : keys;
  const first = pick[0];
  return {
    name: pick.length > 1 ? `${first.name} (+${pick.length - 1})` : first.name,
    root: first.root,
    kind: first.kind,
  };
}

// Message "famille chantier" (modele au § "Messages" de l'instruction, AMENDE par la lecture L-5 :
// l'option 2 "designer le depot... puis deleguer a aragorn" est RETIREE — seule reste la
// proposition d'une session Aragorn, Q-P1 = A).
function chantierDenyMessage(code, { tool, keys, state, sid }) {
  const t = targetOf(keys, state);
  const role = state && state.launch ? state.launch.main_role : "odin";
  const lines = [
    `[chantier-guard] REFUSE (${code}) : ${tool} vise ${t.name}${t.root ? ` (${t.root})` : ""}.`,
    `  Chantier actif : ${activeLabel(state)} (role ${roleLabel(state && state.launch)}) — session ${shortSid(sid)}.`,
  ];
  if (code === "TEAM_NEEDS_REPO") {
    lines.push(
      "  Pour continuer : une session d'equipe (agent_type != odin) doit etre lancee DANS un",
      "    depot, jamais au portefeuille (D-5 regle 4).",
    );
  } else {
    const root = t.root;
    const hint = root ? sessionShellHint(root, role, t.kind) : null;
    lines.push(`  Pour continuer : ${hint || "declare un chantier (session Aragorn dans le bon depot)"}.`);
  }
  lines.push(
    "  L'exception `odin-direct <nom>` ne peut etre tapee QUE par le decideur. La lecture reste libre.",
  );
  return lines.join("\n") + "\n";
}

// Message D-9 (hors-limite absolu) : familles DENY_HARNESS / DENY_REGISTRY / DENY_SELF_INVOKE.
// Distinctes du modele "chantier" ci-dessus : le geste est refuse QUEL QUE SOIT le chantier (D-9
// "avant tout autre verdict"), proposer une session Aragorn n'aiderait pas.
function hardDenyMessage(code, { tool, target }) {
  if (code === "DENY_HARNESS") {
    return `[chantier-guard] REFUSE (DENY_HARNESS) : ${tool} touche le harnais reserve a l'humain.\n` +
      `  Cible : ${target}\n` +
      "  Deploiement/installation (~/.claude/hooks, settings.json, installeur) : geste HUMAIN (D-9).\n";
  }
  if (code === "DENY_REGISTRY") {
    return `[chantier-guard] REFUSE (DENY_REGISTRY) : ${tool} touche le registre de chantier.\n` +
      `  Cible : ${target}\n` +
      "  Seuls les hooks ecrivent le registre (D-2) ; jamais un agent, meme avec un grant (D-9).\n";
  }
  return `[chantier-guard] REFUSE (DENY_SELF_INVOKE) : ${tool} relance une session claude.\n` +
    `  Commande : ${target}\n` +
    "  Une session ne se relance jamais depuis un agent (D-9) ; seul `iakaframe launch` (portefeuille) le fait.\n";
}

// Extrait le <repo> d'un LITTERAL "iakaframe launch <repo>" (D-9/D-14 : seul le littéral compte,
// jamais la forme par chemin du CLI — cf. guard-core.mjs). classifyShell (prive, guard-core.mjs)
// place deja ce token dans `paths` sans le distinguer d'un chemin ordinaire ; ce petit decoupage
// ADAPTATEUR (duplique volontairement, guard-core.mjs reste inchange dans ce lot, parite octet
// preservee) permet de savoir QUAND resoudre un element de `paths` comme un NOM de depot (D-4,
// depots connus) plutot que comme un chemin de fichier (D-7).
const RE_LAUNCH_LITERAL = /(^|[\s;&|])iakaframe\s+launch\s+(\S+)/i;
function launchRepoToken(command) {
  const m = RE_LAUNCH_LITERAL.exec(String(command || ""));
  if (!m) return null;
  return m[2].replace(/^["']|["']$/g, "");
}

function emitFailOpen(sid, err) {
  try {
    const { systemMessage } = failOpen(sid, "perimeter-guard", err);
    process.stdout.write(JSON.stringify({ systemMessage }) + "\n");
  } catch {
    /* meme la panne de la panne reste fail-open (D-10) */
  }
}

// runChantierLayer(...) -> true si la couche a JUGE le geste (elle a deja appele process.exit),
// false si elle NE S'APPLIQUE PAS (interrupteur "off", ou session_id absent/invalide, D-1) : dans
// ce cas l'appelant poursuit sur le chemin HISTORIQUE, inchange (M-9).
function runChantierLayer(p, tool, ti, payloadCwd) {
  if (chantierModeRaw() === "off") return false;

  let lazy;
  try {
    lazy = ensureLaunch(p);
  } catch (err) {
    emitFailOpen(p && p.session_id, err);
    process.exit(0);
  }
  if (!lazy) return false; // session_id absent/hors forme (D-1) -> couche IGNOREE (M-9)

  try {
    const sid = p.session_id;
    const state = lazy.state;
    const launch = state.launch;
    const sessionRole = launch ? launch.main_role : "odin";
    const launchKey = launch ? launch.key : null;
    const actor = p.agent_id ? "SUB" : "MAIN";
    const toAbs = (pth) => toAbsWide(pth, payloadCwd);

    const journalBase = (verdict, keys, extra) => ({
      at: ts(), event: "GESTE", session: sid, tool,
      path: (keys || []).map((k) => k.root || k.name),
      project_dir: null, verdict, mode: "chantier", mode_env: "chantier",
      ...chantierMeta(p, state),
      ...(extra || {}),
    });

    const finishAllow = (code, keys) => {
      write(journalBase(code || "ALLOW", keys));
      allow();
    };
    const finishDenyChantier = (code, keys) => {
      write(journalBase(code, keys));
      process.stderr.write(chantierDenyMessage(code, { tool, keys, state, sid }));
      process.exit(2);
    };
    const finishDenyHard = (code, target) => {
      write(journalBase(code, []));
      process.stderr.write(hardDenyMessage(code, { tool, target }));
      process.exit(2);
    };

    // ---- Cas Edit / Write / NotebookEdit ----
    if (tool === "Edit" || tool === "Write" || tool === "NotebookEdit") {
      const rawPath = ti.file_path || ti.notebook_path || null;
      if (!rawPath) {
        write(journalBase("SKIP", [], { reason: "no_path" }));
        allow();
      }
      const abs = toAbs(rawPath);
      const hd = hardDeny(abs);
      if (hd.denied) finishDenyHard(hd.code, abs);
      // fileTarget:true (chantier-state.mjs, affine au Lot 4) : Edit/Write/NotebookEdit visent
      // TOUJOURS un fichier — un chemin inexistant a un seul segment sous la racine n'est donc
      // jamais suppose etre un dossier de projet ici (contrairement a un `--path`/`--project` de
      // commande portefeuille, D-3/D-7). `state` (3e amendement, A3-2, Lot 1ter) : sans lui,
      // `keyOf` ignore les ancres hors de la session (une ecriture dans son PROPRE dossier hors
      // serait refusee a tort).
      const keys = isExcluded(abs, p) ? [] : [keyOf(abs, { fileTarget: true, state })];
      const verdict = verdictChantier({ gesture: "EDIT", actor, sessionRole, launch: launchKey, state, keys });
      if (verdict.decision === "ALLOW") finishAllow(verdict.code, keys);
      finishDenyChantier(verdict.code, keys);
      return true;
    }

    // ---- Cas Bash / PowerShell ----
    if (tool === "Bash" || tool === "PowerShell") {
      const command = String(ti.command || "");
      const dialect = tool === "PowerShell" ? "powershell" : "bash";
      const cls = classifyShell(command, dialect);

      // D-9, niveau COMMANDE (avant tout autre verdict, meme pour un SHELL_READ).
      if (cls.installerInvoke) finishDenyHard("DENY_HARNESS", command.slice(0, 200));
      if (cls.selfInvoke) finishDenyHard("DENY_SELF_INVOKE", command.slice(0, 200));
      if (cls.registryRef && cls.kind === "MUTATE") finishDenyHard("DENY_REGISTRY", command.slice(0, 200));

      const gesture = cls.kind === "READ" ? "SHELL_READ" : "SHELL_MUTATE";
      const keys = [];
      if (gesture === "SHELL_MUTATE") {
        const repoTok = launchRepoToken(command);
        const useException = cls.portfolioVerb && cls.segments === 1 && cls.paths.length > 0;
        const targets = useException ? cls.paths : [payloadCwd, ...cls.paths];

        // D-9, niveau CHEMIN (avant construction des cles / exclusions D-8).
        for (const t of targets) {
          if (repoTok && t === repoTok) continue; // resolu par NOM (D-4), jamais un chemin du foyer
          const abs = toAbs(t);
          const hd = hardDeny(abs);
          if (hd.denied) finishDenyHard(hd.code, abs);
        }

        for (const t of targets) {
          if (repoTok && t === repoTok) {
            const res = resolveRepoArg(t, { requireExisting: false, state });
            keys.push(res.key || { kind: "hors", root: null, name: "@hors" });
            continue;
          }
          const abs = toAbs(t);
          if (isExcluded(abs, p)) continue;
          keys.push(keyOf(abs, { state })); // 3e amendement (A3-2) : ancres hors de la session
        }
      }

      const verdict = verdictChantier({
        gesture, actor, sessionRole, launch: launchKey, state, keys,
        portfolioVerb: cls.portfolioVerb, segments: cls.segments,
      });
      if (verdict.decision === "ALLOW") finishAllow(verdict.code, keys);
      finishDenyChantier(verdict.code, keys);
      return true;
    }

    return false; // outil non concerne par la couche (matcher large)
  } catch (err) {
    emitFailOpen(p && p.session_id, err);
    process.exit(0);
  }
}

// =================================================================================================
// MAIN
// =================================================================================================

try {
  const raw = readAll();
  if (!raw.trim()) allow();
  const p = JSON.parse(raw);
  const event = p.hook_event_name || "";
  if (event !== "PreToolUse") allow();

  const session = p.session_id || null;
  const tool = p.tool_name || "";
  const ti = p.tool_input || {};
  const payloadCwd = p.cwd || process.cwd();

  // ---- COUCHE CHANTIER (Lot 4, D-11) : tentee EN PREMIER — elle remplace l'ancrage historique
  // quand elle est active. Ne depend PAS de $CLAUDE_PROJECT_DIR (elle utilise payload.cwd et
  // IAKAFRAME_ROOT, D-4). Si elle ne s'applique pas (session_id absent/invalide, ou interrupteur
  // "off"), le chemin HISTORIQUE ci-dessous reste STRICTEMENT inchange (M-9).
  if (tool === "Edit" || tool === "Write" || tool === "NotebookEdit" || tool === "Bash" || tool === "PowerShell") {
    const engaged = runChantierLayer(p, tool, ti, payloadCwd);
    if (engaged) allow(); // deja exit() dans tous les cas geres ; defense en profondeur (jamais atteint)
  }

  // =================================================================================================
  // CHEMIN HISTORIQUE (pre-Lot 4). INCHANGE : ancrage $CLAUDE_PROJECT_DIR (stable), PAS le cwd du
  // payload (qui derive). Variable absente -> SKIP (fail-open, exit 0).
  // =================================================================================================

  const modeEnvRaw = process.env.IAKAFRAME_PERIMETER_MODE;
  const modeEnv = (modeEnvRaw == null || modeEnvRaw === "") ? "default" : modeEnvRaw;

  const projectDirRaw = process.env.CLAUDE_PROJECT_DIR;
  if (!projectDirRaw || !projectDirRaw.trim()) {
    write({
      at: ts(), event: "SKIP", session, tool: tool || null, path: null,
      project_dir: null, verdict: "SKIP", reason: "no_project_dir",
      mode: effectiveMode(modeEnv, tool), mode_env: modeEnv,
    });
    allow();
  }
  const projectDir = resolve(projectDirRaw);

  // Resout un chemin (absolu garde tel quel ; relatif resolu contre le cwd du payload).
  const toAbs = (pth) => isAbsolute(pth) ? resolve(pth) : resolve(payloadCwd, pth);

  // ---- Cas Edit / Write / NotebookEdit : chemin explicite FIABLE ----
  if (tool === "Edit" || tool === "Write" || tool === "NotebookEdit") {
    const rawPath = ti.file_path || ti.notebook_path || null;
    const mode = effectiveMode(modeEnv, tool);
    if (!rawPath) {
      // Pas de chemin -> on ne devine pas (fail-open).
      write({
        at: ts(), event: "GESTE", session, tool, path: null,
        project_dir: projectDir, verdict: "SKIP", reason: "no_path",
        mode, mode_env: modeEnv,
      });
      allow();
    }
    const abs = toAbs(rawPath);
    const verdict = classifyPath(abs, projectDir);
    write({
      at: ts(), event: "GESTE", session, tool, path: abs,
      project_dir: projectDir, verdict, mode, mode_env: modeEnv,
    });
    if (isBlocking(verdict)) {
      const why = verdict === "DENY_HARNESS"
        ? "auto-modification du harnais (~/.claude/settings.json) reservee a l'humain"
        : "chemin HORS perimetre projet";
      const msg =
        "[perimeter-guard] Geste " + tool + " " + (mode === "deny" ? "REFUSE" : "HORS PERIMETRE") +
        " : " + why + ".\n  Cible    : " + abs +
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

  // ---- Cas Bash : heuristique sur la chaine shell (MVP honnete) ----
  if (tool === "Bash") {
    const command = String(ti.command || "");
    const mode = effectiveMode(modeEnv, tool);
    const cmdShort = command.length > 500 ? command.slice(0, 500) + "…" : command;

    const absPaths = extractAbsPaths(command);
    if (absPaths.length === 0) {
      // Aucun chemin absolu identifiable -> on ne devine pas. BASH_UNRESOLVED, toujours exit 0.
      write({
        at: ts(), event: "GESTE", session, tool, path: null, command: cmdShort,
        project_dir: projectDir, verdict: "BASH_UNRESOLVED", mode, mode_env: modeEnv,
      });
      allow();
    }

    // Classer chaque chemin absolu ; un HORS ou DENY_HARNESS suffit a declencher.
    let worst = "ALLOW_PROJECT"; // pire verdict rencontre (priorite DENY_HARNESS > HORS > autres)
    const classified = [];
    for (const ap of absPaths) {
      const v = classifyPath(ap, projectDir);
      classified.push({ path: ap, verdict: v });
      if (v === "DENY_HARNESS") worst = "DENY_HARNESS";
      else if (v === "HORS" && worst !== "DENY_HARNESS") worst = "HORS";
    }

    write({
      at: ts(), event: "GESTE", session, tool, path: classified, command: cmdShort,
      project_dir: projectDir, verdict: worst, mode, mode_env: modeEnv,
    });

    if (isBlocking(worst)) {
      const offenders = classified.filter((c) => isBlocking(c.verdict)).map((c) => c.path);
      const why = worst === "DENY_HARNESS"
        ? "auto-modification du harnais (~/.claude/settings.json) reservee a l'humain"
        : "chemin(s) absolu(s) HORS perimetre projet";
      const msg =
        "[perimeter-guard] Commande Bash " + (mode === "deny" ? "REFUSEE" : "HORS PERIMETRE") +
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

  // Outil non concerne (matcher large) -> laisser passer.
  allow();
} catch {
  allow(); // fail-open : un bug du garde ne fige jamais une session
}

function readAll() {
  try { return readFileSync(0, "utf8"); }
  catch { return ""; }
}

// Extrait les chemins absolus "interessants" d'une chaine shell.
// MVP honnete : on capte les chemins absolus du foyer ($HOME/..., p.ex. /Users/<user>/...) et ~/.claude/...
// On NE pretend PAS parser le shell ; au moindre doute on n'attrape rien (-> BASH_UNRESOLVED).
function extractAbsPaths(command) {
  const out = new Set();
  // 1) chemins absolus POSIX explicites sous /Users/<user>/...
  //    (on borne au foyer pour eviter le bruit ; suffit a la faille demontree).
  const home = homedir();
  const homeEsc = home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reHome = new RegExp(homeEsc + "(?:/[^\\s'\"`;|&><]*)?", "g");
  let m;
  while ((m = reHome.exec(command)) !== null) {
    if (m[0]) out.add(resolve(m[0]));
  }
  // 2) ~/.claude/... (tilde) -> resolu vers le foyer reel.
  const reTilde = /~\/\.claude(?:\/[^\s'"`;|&><]*)?/g;
  while ((m = reTilde.exec(command)) !== null) {
    const tail = m[0].slice(1); // enleve le ~
    out.add(resolve(join(home, tail)));
  }
  return [...out];
}
