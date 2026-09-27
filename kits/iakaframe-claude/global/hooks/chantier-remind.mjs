#!/usr/bin/env node
// chantier-remind.mjs — Garde/emetteur iakaframe de la couche CHANTIER, canal PROMPT.
// Cable sur UserPromptSubmit (specs/instructions/declaration-chantier-session.md, Detection (b)).
//
// Role : (1) init paresseuse du registre de session (D-1) ; (2) reconnait les DEUX directives
// ligne-seule du decideur (`chantier <repo>` / `odin-direct <repo>`, D-3) et ecrit `declare`/
// `grant` en consequence — SEULE voie du dispositif a le faire (D-2, CA-20) — MAIS uniquement en
// session de role "odin" (`launch.main_role`) : en session "team", AUCUNE ecriture, un rappel
// explique que le chantier est fixe au lancement (D-1 table, detection (b) etape 2) ; (3) detecte
// les MENTIONS de depots connus dans le prompt (hors lignes-directives et phrases reservees) et
// les enregistre comme `named`, quel que soit le role de session ; (4) rappelle TOUJOURS le
// chantier actif de la session, et un eventuel rappel court (aucun chantier / mention hors
// chantier / directive refusee ou ignoree / panne recente / registre neuf, D-10).
//
// NE BLOQUE JAMAIS (exit 0 inconditionnel) ; ne recopie JAMAIS le texte du prompt dans le
// contexte emis. FAIL-OPEN visible (Q6) : toute exception -> systemMessage FAIL-OPEN.
//
// 2e amendement (prise-de-parole-odin-aragorn.md, lecture L-5) : le secours "sous-agent aragorn"
// est retire du CONTRAT (Odin cede sa place, il ne delegue pas). Les messages de ce hook ne
// proposent donc QUE la session Aragorn (jamais "designe le depot... puis delegue a aragorn") ;
// le mecanisme `chantier <repo>` reste un mecanisme du GARDE (attribution, D-3), inchange.
//
// Adaptateur mince : la logique de decision pure (parsing des directives, detection des
// mentions) vit dans guard-core.mjs ; l'I/O (registre, resolution de chemin -> `key`, depots
// connus) vit dans chantier-state.mjs.

import { readFileSync } from "node:fs";
import {
  appendEvent, countFailOpens, ensureLaunch, failOpen, knownRepos, loadState, resolveRepoArg,
  sessionShellHint,
} from "./chantier-state.mjs";
import { detectRepoMentions, keySig, parsePromptDirectives } from "./guard-core.mjs";

const done = () => process.exit(0);

function readAll() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function print(text) {
  if (text) process.stdout.write(text.endsWith("\n") ? text : text + "\n");
}

function printFailOpen(systemMessage) {
  process.stdout.write(JSON.stringify({ systemMessage }) + "\n");
}

// `aragorn@<nom>` : convention D-1 ("aragorn" : "aragorn@<nom>") — un depot/dossier a un
// Aragorn nomme d'apres lui ; portefeuille/hors n'en ont pas. Ecrit au registre (donnee, D-1
// table) ; n'est PLUS affiche dans la ligne "Chantier actif" (le gabarit de detection (b) porte
// le role de session, pas un nom d'Aragorn).
function aragornNameFor(key) {
  if (!key) return null;
  return key.kind === "repo" || key.kind === "dir" ? `aragorn@${key.name}` : null;
}

// roleLabel(launch) -> "odin" | "team:<agent_type>" (gabarit litteral de detection (b), etape 4).
function roleLabel(launch) {
  if (!launch || launch.main_role !== "team") return "odin";
  return `team:${launch.main_agent_type || "?"}`;
}

// Une ligne EST une directive (`chantier <x>` / `odin-direct <x>`, D-3) si, prise ISOLEMENT,
// `parsePromptDirectives` y reconnait quelque chose. Reutilise la regle CANONIQUE de guard-core
// plutot que de dupliquer ses regex ici (D-3 : "regex dans guard-core"). Sert AUSSI a detecter
// une directive en session "team" (pour le rappel "ignoree"), independamment de son ecriture.
function isDirectiveLine(line) {
  const t = line.trim();
  if (!t) return false;
  const r = parsePromptDirectives(t);
  return r.declare != null || r.grant != null;
}

function stripDirectiveLines(prompt) {
  return String(prompt == null ? "" : prompt)
    .split("\n")
    .filter((l) => !isDirectiveLine(l))
    .join("\n");
}

function fmtActive(state) {
  if (!state || !state.active) return "Chantier actif : aucun";
  const { key, segment, since } = state.active;
  const root = key.root || "-";
  return `Chantier actif : ${key.name} (${root}) — segment ${segment}, depuis ${since}, ` +
    `role ${roleLabel(state.launch)}`;
}

function main() {
  const modeRaw = String(process.env.IAKAFRAME_CHANTIER_MODE || "").trim().toLowerCase();
  if (modeRaw === "off") done(); // Q5 : couche chantier desactivee -> comportement historique.

  const raw = readAll();
  if (!raw.trim()) done();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    done();
    return;
  }
  if (payload.hook_event_name && payload.hook_event_name !== "UserPromptSubmit") done();

  const sid = payload.session_id || null;

  try {
    const lazy = ensureLaunch(payload);
    if (!lazy) done(); // session_id absent/invalide -> couche chantier ignoree (D-1)

    const launch = lazy.state && lazy.state.launch ? lazy.state.launch : null;
    const sessionRole = launch ? launch.main_role : "odin";
    const mainAgentType = launch ? launch.main_agent_type : null;

    const reminders = [];
    const prompt = payload.prompt || "";

    // (2) Directives ligne seule (D-3). En session "odin" : ecrit declare/grant (le GRANT ecrit
    // AUSSI son propre `declare`, by:"odin-direct"). En session "team" : AUCUNE ecriture — le
    // chantier est fixe au lancement pour toute la session (mere D-5) — et un rappel explicite
    // (2e amendement, L-5 : jamais de secours "delegue a aragorn").
    const { declare, grant } = parsePromptDirectives(prompt);
    let state = lazy.state;

    if (declare != null || grant != null) {
      if (sessionRole === "team") {
        const activeName = launch && launch.key ? launch.key.name : "?";
        reminders.push(
          `Session ${mainAgentType || "?"} : chantier fixe au lancement (${activeName}). ` +
          "Pour un autre depot, demande a Odin de lancer une session dans ce depot.",
        );
      } else if (grant != null) {
        const res = resolveRepoArg(grant, { requireExisting: true, state });
        if (res.key) {
          appendEvent(sid, {
            type: "declare", key: res.key, by: "odin-direct",
            aragorn: aragornNameFor(res.key),
            team_source: process.env.CLAUDE_PROJECT_DIR || null,
            prompt_id: payload.prompt_id ?? undefined,
          });
          appendEvent(sid, { type: "grant", key: res.key, by: "user", prompt_id: payload.prompt_id ?? undefined });
        } else {
          reminders.push(
            res.ambiguous
              ? `odin-direct '${grant}' refuse : nom ambigu, redonne le chemin absolu du depot.`
              : `odin-direct '${grant}' refuse : depot introuvable (chemin absolu requis).`,
          );
        }
      } else {
        const res = resolveRepoArg(declare, { requireExisting: false, state });
        if (res.key) {
          appendEvent(sid, {
            type: "declare", key: res.key, by: "user",
            aragorn: aragornNameFor(res.key),
            team_source: process.env.CLAUDE_PROJECT_DIR || null,
            prompt_id: payload.prompt_id ?? undefined,
          });
        } else {
          reminders.push(
            res.ambiguous
              ? `chantier '${declare}' refuse : nom ambigu, redonne le chemin absolu du depot.`
              : `chantier '${declare}' refuse : depot inconnu (chemin absolu requis).`,
          );
        }
      }
    }

    // (3) Mentions de depots connus (hors lignes-directives, hors phrases reservees — geree
    // par `detectRepoMentions` lui-meme). Ecrit `named` quel que soit le role de session (D-1
    // table : `named` n'est pas restreint aux sessions "odin").
    const stripped = stripDirectiveLines(prompt);
    const mentionNames = detectRepoMentions(stripped, knownRepos(state));
    const namedKeys = [];
    for (const name of mentionNames) {
      const res = resolveRepoArg(name, { requireExisting: false, state });
      if (res.key) namedKeys.push(res.key);
    }
    if (namedKeys.length > 0) {
      appendEvent(sid, { type: "named", keys: namedKeys, prompt_id: payload.prompt_id ?? undefined });
    }

    // Etat final (apres tout append de ce tour).
    state = loadState(sid);

    // Rappel : mention hors chantier actif — phrasage selon le role de session (2e amendement,
    // L-5 : en session "odin", on ne propose QUE la session Aragorn, jamais un secours sous-agent).
    if (namedKeys.length > 0) {
      const activeSig = state && state.active ? keySig(state.active.key) : null;
      const off = namedKeys.filter((k) => keySig(k) !== activeSig);
      if (off.length > 0) {
        const names = [...new Set(off.map((k) => k.name))].join(", ");
        if (sessionRole === "team") {
          const activeName = launch && launch.key ? launch.key.name : "?";
          reminders.push(
            `Depot mentionne (${names}) different de l'actif : chantier fixe au lancement ` +
            `(${activeName}) ; demande a Odin de lancer une session dans ce depot.`,
          );
        } else {
          const hint = off[0].root ? sessionShellHint(off[0].root, sessionRole) : null;
          reminders.push(
            `Depot mentionne (${names}) different de l'actif : propose au decideur de lancer ` +
            "une session Aragorn dans ce depot, ou la designation `chantier <nom>`." +
            (hint ? ` (${hint})` : ""),
          );
        }
      }
    }

    // Rappel : registre neuf (D-10) — cree alors que la conversation n'en est pas au 1er prompt.
    if (lazy.created && payload.prompt_id) {
      reminders.push(
        "Registre neuf pour cette session : chantier = lancement ; les designations et " +
        "odin-direct anterieurs ne valent plus.",
      );
    }

    // Rappel : panne(s) fail-open depuis l'ouverture (D-10).
    const failOpens = countFailOpens(sid);
    if (failOpens > 0) {
      reminders.push(`${failOpens} panne(s) fail-open depuis l'ouverture (cf. registre de session).`);
    }

    const lines = [fmtActive(state)];
    for (const r of reminders.slice(0, 6)) lines.push(r);

    print(lines.join("\n"));
    done();
  } catch (err) {
    // Fail-open visible (Q6) : jamais silencieux, jamais bloquant.
    try {
      const { systemMessage } = failOpen(sid, "chantier-remind", err);
      printFailOpen(systemMessage);
    } catch {
      /* meme la panne de la panne reste fail-open : on sort simplement */
    }
    done();
  }
}

main();
