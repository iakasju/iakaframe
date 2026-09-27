// guard-core.mjs — Coeur d'enforcement iakaframe RUNNER-AGNOSTIQUE (Lot 0, socle de parite).
//
// POURQUOI : chaque garde Claude melangeait (a) le PARSING de son payload (forme du transcript,
// noms de champs) et (b) la LOGIQUE DE DECISION (regex des badges, appartenance d'un chemin a un
// perimetre, appartenance d'un agent au roster). La logique (b) est INTRINSEQUEMENT
// runner-agnostique : c'est le levier de la parite d'enforcement hors Claude (cf.
// specs/instructions/parite-enforcement-multirunner.md, section 5.2).
//
// Ce module ne contient QUE la logique (b) : des VERDICTS PURS.
//   - AUCUN I/O (pas de readFileSync, pas de stdin, pas de process.exit, pas de journal) ;
//   - AUCUNE forme de payload d'un runner particulier ;
//   - des fonctions pures, deterministes, testables par fixtures.
// Chaque runner fournit un ADAPTATEUR mince qui : parse SON payload -> reconstruit l'entree
// canonique -> appelle un verdict d'ici -> traduit le verdict dans SA semantique (exit code,
// exception middleware, annotation de reponse...).
//
// STRATEGIE ALIGN (calquee sur cli/src/lib/vocab.js <-> core vocab.json) : ce fichier est
// DUPLIQUE a l'identique dans chaque kit runner (kit-claude, kit-codex...) pour rester
// self-contained au deploiement. Un test de parite (cli/test/guard-core-parity.test.js) verrouille
// que toutes les copies sont OCTET POUR OCTET identiques -> pas de re-divergence de la regle.
//
// NE PAS ajouter d'I/O ni de dependance ici : la purete est la garantie de portabilite.

// ---------------------------------------------------------------------------
// Verdict IDENTITE (badges d'ouverture / cloture). La POSITION de la pastille porte le sens :
//   ouverture = pastille AVANT le bloc  ->  🟡 [ROYAUME][Agent]
//   cloture   = pastille APRES le bloc  ->  [ROYAUME][Agent] 🟡
// ---------------------------------------------------------------------------

export const PASTILLES = [0x1f7e1, 0x1f535, 0x1f534, 0x1f7e2, 0x1f7e3, 0x1f7e0]
  .map((cp) => String.fromCodePoint(cp));
const pastAlt = PASTILLES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const bracket = "\\[[^\\]]+\\]\\s*`?\\s*\\[[^\\]]+\\]"; // [ROYAUME][Agent]
export const reOpen = new RegExp("^(?:" + pastAlt + ")\\s*`?\\s*" + bracket);
export const reClose = new RegExp(bracket + "\\s*`?\\s*(?:" + pastAlt + ")(?:\\s|$)");

export const linesOf = (txt) =>
  txt.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() !== "");

// Verdict IDENTITE pur. Entree canonique = `turn` : les messages-texte de l'assistant du TOUR
// courant, du plus RECENT au plus ANCIEN (turn[0] = dernier message du tour). L'adaptateur runner
// est responsable de reconstruire ce tableau depuis son transcript.
// Renvoie :
//   { skip: true }                      -> tour vide -> rien a juger (l'adaptateur => allow)
//   { skip: false, startOk, stopOk }    -> verdict sur le tour courant
export function verdictIdentity(turn) {
  if (!Array.isArray(turn) || turn.length === 0) return { skip: true };

  // Ouverture : acceptee si N'IMPORTE QUEL message-texte du tour ouvre par un badge.
  const opensWith = (txt) => {
    const ne = linesOf(txt);
    return ne.length > 0 && reOpen.test(ne[0].trim());
  };
  let startOk = turn.some(opensWith);

  // Cloture : portee par le DERNIER message-texte du tour (turn[0]).
  const nonEmpty = linesOf(turn[0]);
  let stopOk;
  if (nonEmpty.length === 1) {
    const single = reOpen.test(nonEmpty[0].trim()) || reClose.test(nonEmpty[0].trim());
    stopOk = single;
    // Tour reduit a un unique one-liner : on tolere ouverture OU cloture pour les deux.
    if (turn.length === 1) startOk = single;
  } else {
    stopOk = false;
    const idxs = [nonEmpty.length - 1];
    if (nonEmpty.length >= 3) idxs.push(nonEmpty.length - 2);
    for (const idx of idxs) {
      if (idx === 0) continue;
      if (reClose.test(nonEmpty[idx].trim())) { stopOk = true; break; }
    }
  }

  return { skip: false, startOk, stopOk };
}

// ---------------------------------------------------------------------------
// Verdict PERIMETRE (chemins hors projet). Pur : recoit des chemins DEJA resolus (absolus) et
// les reperes du perimetre ; ne touche pas au disque, ne lit pas d'env. L'adaptateur runner
// resout les chemins (cwd, tilde) et fournit portfolioDir/harnessSettings propres a son foyer.
// ---------------------------------------------------------------------------

// Appartenance : `target` est SOUS `base` si le chemin relatif ne sort pas (pas de "..",
// pas un chemin absolu). base===target -> dans la base (la racine elle-meme).
// `relativeFn` = implementation de path.relative (injectee par l'adaptateur : Node `node:path`).
export function isUnder(base, target, relativeFn, isAbsoluteFn) {
  if (!base || !target) return false;
  const rel = relativeFn(base, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsoluteFn(rel));
}

// Classe un chemin absolu resolu contre perimetre + reperes du foyer runner.
// Renvoie : ALLOW_PROJECT | ALLOW_PORTFOLIO | DENY_HARNESS | HORS
//   - projectDir       : racine du projet courant (perimetre autorise) ;
//   - portfolioDir     : racine du portefeuille runner (ex. ~/.claude) -> ALLOW_PORTFOLIO ;
//   - harnessSettings  : fichier de config du harnais reserve a l'humain -> DENY_HARNESS (prime).
export function verdictPerimeter(absPath, projectDir, opts) {
  const { portfolioDir, harnessSettings, relativeFn, isAbsoluteFn } = opts || {};
  // DENY harnais prime sur tout.
  if (harnessSettings && absPath === harnessSettings) return "DENY_HARNESS";
  if (projectDir && isUnder(projectDir, absPath, relativeFn, isAbsoluteFn)) return "ALLOW_PROJECT";
  // ALLOW portefeuille (hors settings deja capte ci-dessus).
  if (portfolioDir && isUnder(portfolioDir, absPath, relativeFn, isAbsoluteFn)) return "ALLOW_PORTFOLIO";
  return "HORS";
}

export const isPerimeterBlocking = (verdict) => verdict === "HORS" || verdict === "DENY_HARNESS";

// ---------------------------------------------------------------------------
// Verdict DELEGATION (roster). Pur : appartenance d'un agent cible au roster iakaframe (ou aux
// sous-agents natifs toleres). L'adaptateur runner extrait `agent` de son payload et applique la
// semantique (refus = exit 2 chez Claude/Codex, journal verbatim, etc.).
// ---------------------------------------------------------------------------

// ⚠️ `feanor` MANQUE ICI, et ce n'est pas un oubli de la scission du squad prod : il manquait
// DEJA. L'ajouter changerait le comportement de delegation de Fëanor (`Task(agent: feanor)` est
// refuse aujourd'hui), ce que personne n'a demande — un changement non arbitre passe sous couvert
// d'un autre lot. Constate, NON corrige. Ticket : `ROSTER-FEANOR`.
export const ROSTER = Object.freeze([
  "odin", "aragorn", "gandalf", "gimli", "legolas", "charon", "helm", "loki", "nathalie",
]);
// Sous-agents natifs toleres hors roster iakaframe (Claude Code, valeurs par defaut).
export const BUILTINS = Object.freeze([
  "Explore", "Plan", "general-purpose", "claude", "claude-code-guide", "statusline-setup",
]);
export const AGENT_UNSET = "(non precise)";

// Verdict DELEGATION pur. Renvoie { known, refused } :
//   - known   : l'agent est du roster iakaframe OU un sous-agent natif tolere ;
//   - refused : agent inconnu ET explicitement precise -> a refuser (exit 2 chez les CLIs).
// Un agent absent (AGENT_UNSET) n'est jamais refuse (rien a juger).
export function verdictDelegation(agent, opts) {
  const roster = (opts && opts.roster) || ROSTER;
  const builtins = (opts && opts.builtins) || BUILTINS;
  const rosterSet = new Set(roster.map((a) => String(a).toLowerCase()));
  const builtinSet = new Set(builtins);
  const a = agent == null ? AGENT_UNSET : String(agent);
  const known = rosterSet.has(a.toLowerCase()) || builtinSet.has(a);
  const refused = !known && a !== AGENT_UNSET;
  return { known, refused };
}

// ---------------------------------------------------------------------------
// Verdict CHANTIER (specs/instructions/declaration-chantier-session.md). Pur : AUCUNE E/S, AUCUNE
// resolution de chemin (D-4, `keyOf`, `realpath`... vivent dans l'adaptateur `chantier-state.mjs`,
// Lot 2). Ce module recoit des `key` DEJA resolues : `{ kind: "repo"|"dir"|"portefeuille"|"hors",
// root, name }`. La comparaison d'appartenance a une MEME cle passe TOUJOURS par `keySig` (jamais
// le nom seul, cf. Risques § « nom ambigu » de l'instruction : deux clones portant le meme nom).
// ---------------------------------------------------------------------------

// Signature stable d'une `key` (kind+root ; le nom seul n'identifie jamais une cle, M-10).
export function keySig(key) {
  if (!key) return "";
  return `${key.kind}|${key.root || ""}`;
}

// Sous-agents natifs lecture-seule TOLERES sans condition en dispatch (D-6). Distinct de BUILTINS
// (roster) : `statusline-setup` en est explicitement absent (il ECRIT settings.json).
export const READONLY_BUILTINS = Object.freeze(["Explore", "Plan", "claude-code-guide"]);

// Commandes portefeuille (D-14, Q-B) : liste FERMEE, cf. `classifyShell` pour la reconnaissance
// (avec arguments variables : `--path`/`--project`) et `verdictChantier` regle 3 pour l'ALLOW.
export const PORTFOLIO_VERBS = Object.freeze([
  "iakaframe onboard",
  "iakaframe init",
  "iakaframe agents fullteam",
  "iakaframe agents --action fullteam",
]);

// Phrases reservees (D-3, detection (b)) : retirees du texte AVANT `detectRepoMentions`, pour que
// l'usage courant de la methode ("update iakaframe", "iakastart"...) ne nomme jamais un depot.
// Le motif generique `iakaframe <mot>` couvre en plus tout verbe CLI ("iakaframe onboard/install/
// show/..."), cf. D-13 remind.
export const RESERVED_PHRASES = Object.freeze(["init iakaframe", "update iakaframe", "iakastart"]);
const RE_IAKAFRAME_VERB = /\biakaframe\s+\S+/gi;

// ---------------------------------------------------------------------------
// D-1 — Registre : fold PUR d'un historique JSONL (lignes BRUTES, deja lues par l'adaptateur).
// ---------------------------------------------------------------------------

function parseChantierLine(line) {
  const s = String(line == null ? "" : line).trim();
  if (!s) return null;
  try {
    const ev = JSON.parse(s);
    if (!ev || typeof ev !== "object" || !ev.type) return null;
    return ev;
  } catch {
    return null; // ligne illisible : ignoree (D-1)
  }
}

// foldChantier(lines) -> etat replie, pur et deterministe :
//   { active, segments, bindings, dispatches, grants, named }
//   - active     : { key, segment, since, by, aragorn } | null (segment courant, sans `until`)
//   - segments   : segments CLOS (avec `until`) dans l'ordre, puis le segment courant en dernier
//   - bindings   : Map agent_id -> { key, since, toolUseId, agentType }
//   - dispatches : file des `dispatch` NON consommes, dans l'ordre d'arrivee (FIFO)
//   - grants     : Set de signatures de `key` accordees (`odin-direct`)
//   - named      : Set de signatures de `key` nommees par le decideur (mentions/declarations)
export function foldChantier(lines) {
  const arr = Array.isArray(lines) ? lines : String(lines == null ? "" : lines).split("\n");
  let active = null;
  let launched = false;
  const segments = [];
  const bindings = new Map();
  const dispatches = [];
  const grants = new Set();
  const named = new Set();

  const openSegment = (key, at, by, aragorn) => {
    if (active) segments.push({ ...active, until: at });
    active = { key, segment: active ? active.segment + 1 : 1, since: at, by: by || null, aragorn: aragorn || null };
  };

  for (const raw of arr) {
    const ev = parseChantierLine(raw);
    if (!ev) continue;
    switch (ev.type) {
      case "launch": {
        if (launched) break; // premier launch gagnant
        launched = true;
        openSegment(ev.key, ev.at, "launch", ev.aragorn);
        break;
      }
      case "declare": {
        if (!ev.key) break;
        if (active && keySig(active.key) === keySig(ev.key)) break; // deja actif : sans effet
        openSegment(ev.key, ev.at, ev.by || "user", ev.aragorn);
        break;
      }
      case "grant": {
        if (ev.key) grants.add(keySig(ev.key));
        break;
      }
      case "named": {
        for (const k of ev.keys || []) named.add(keySig(k));
        break;
      }
      case "dispatch": {
        dispatches.push({
          toolUseId: ev.tool_use_id ?? null,
          target: ev.target ?? null,
          key: ev.key ?? null,
          fromAgentId: ev.from_agent_id ?? null,
          aragorn: ev.aragorn ?? null,
        });
        break;
      }
      case "bind": {
        if (!ev.agent_id) break;
        if (bindings.has(ev.agent_id)) break; // premier bind gagnant
        const idx = dispatches.findIndex((d) => d.toolUseId != null && d.toolUseId === ev.tool_use_id);
        if (idx !== -1) dispatches.splice(idx, 1); // dispatch consomme
        bindings.set(ev.agent_id, {
          key: ev.key ?? null, since: ev.at, toolUseId: ev.tool_use_id ?? null, agentType: ev.agent_type ?? null,
        });
        break;
      }
      default:
        break; // `fail_open` et types inconnus : sans effet sur l'etat chantier
    }
  }
  if (active) segments.push({ ...active }); // segment courant, sans `until`

  return { active, segments, bindings, dispatches, grants, named };
}

// pickBinding(dispatches, agentType) -> resultat de la liaison D-13 §2-4 (SANS effet de bord ;
// l'ecriture de l'evenement `bind` est a la charge de l'adaptateur `chantier-bind.mjs`, Lot 3bis) :
//   { status: "single", key, toolUseId }  un seul candidat, ou plusieurs de MEME cle -> le plus
//                                          ancien (FIFO, `dispatches` deja dans l'ordre d'arrivee)
//   { status: "ambiguous" }               plusieurs candidats de cles DIFFERENTES -> bind{key:null}
//   { status: "none" }                    aucun candidat -> pas de bind (chantier de session)
export function pickBinding(dispatches, agentType) {
  const at = String(agentType == null ? "" : agentType).toLowerCase();
  const candidates = (dispatches || []).filter((d) => String(d.target == null ? "" : d.target).toLowerCase() === at);
  if (candidates.length === 0) return { status: "none" };
  const sigs = new Set(candidates.map((d) => keySig(d.key)));
  if (sigs.size === 1) {
    const chosen = candidates[0];
    return { status: "single", key: chosen.key, toolUseId: chosen.toolUseId };
  }
  return { status: "ambiguous" };
}

// ---------------------------------------------------------------------------
// D-3 — Directives de prompt (ligne SEULE, syntaxe fermee, sensible a la casse).
// ---------------------------------------------------------------------------

const RE_CHANTIER_LINE = /^chantier\s+(\S+)$/;
const RE_ODIN_DIRECT_LINE = /^odin-direct\s+(\S+)$/;
const RE_CHANTIER_COLON_LINE = /^Chantier:\s*(\S+)$/;

// `portefeuille` est un mot-cle reserve (D-3) : resolu directement en `@portefeuille`, sans
// resolution de chemin (l'adaptateur D-4 fera le reste pour un nom de depot ordinaire).
const resolveDirectiveToken = (tok) => (tok === "portefeuille" ? "@portefeuille" : tok);

// parsePromptDirectives(prompt) -> { declare, grant } : le DERNIER token trouve par directive,
// ou null si absente. Une mention EN PHRASE ("on pourrait faire odin-direct naonedge") ou une
// casse divergente ("Odin-Direct naonedge") n'accorde/ne declare RIEN (D-3).
export function parsePromptDirectives(prompt) {
  const lines = String(prompt == null ? "" : prompt).split("\n").map((l) => l.trim());
  let declare = null;
  let grant = null;
  for (const line of lines) {
    const mc = RE_CHANTIER_LINE.exec(line);
    if (mc) declare = resolveDirectiveToken(mc[1]);
    const mo = RE_ODIN_DIRECT_LINE.exec(line);
    if (mo) grant = resolveDirectiveToken(mo[1]);
  }
  return { declare, grant };
}

// parseChantierLines(text) -> { repo, ambiguous } : la ligne `Chantier: <repo>` (2e ligne d'un
// ordre de mission, D-3) ; plusieurs lignes DIVERGENTES -> ambiguous:true, repo:null.
export function parseChantierLines(text) {
  const lines = String(text == null ? "" : text).split("\n").map((l) => l.trim());
  const found = [];
  for (const line of lines) {
    const m = RE_CHANTIER_COLON_LINE.exec(line);
    if (m) found.push(m[1]);
  }
  const uniq = [...new Set(found)];
  if (uniq.length === 0) return { repo: null, ambiguous: false };
  if (uniq.length === 1) return { repo: uniq[0], ambiguous: false };
  return { repo: null, ambiguous: true };
}

// detectRepoMentions(text, knownRepos) -> noms de depots connus mentionnes en mot ENTIER
// (`(?<![\w.-])nom(?![\w.-])`, donc "naonedge-clients" != "naonedge"), les plus longs d'abord,
// APRES retrait des phrases reservees (RESERVED_PHRASES + motif `iakaframe <verbe>`).
export function detectRepoMentions(text, knownRepos) {
  let s = String(text == null ? "" : text);
  for (const phrase of RESERVED_PHRASES) {
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(esc, "gi"), " ");
  }
  s = s.replace(RE_IAKAFRAME_VERB, " ");
  const repos = [...new Set(knownRepos || [])].sort((a, b) => b.length - a.length);
  const found = [];
  for (const repo of repos) {
    const esc = String(repo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![\\w.-])${esc}(?![\\w.-])`);
    if (re.test(s)) found.push(repo);
  }
  return found;
}

// ---------------------------------------------------------------------------
// D-7 — Classification SHELL. Pure : ne resout, ne lit AUCUN chemin (l'adaptateur resout `paths`
// contre `payload.cwd`). Decoupe la commande en segments (`&&`, `||`, `;`, `|`, retours ligne),
// classe MUTATE/READ (Q3 : fail-closed sur tout ce qui n'est pas explicitement reconnu), et releve
// les drapeaux exploites par `verdictChantier`/D-9 (`registryRef`, `selfInvoke`, `installerInvoke`,
// `portfolioVerb`).
// ---------------------------------------------------------------------------

export const NEUTRAL_SHELL_CMDS = Object.freeze([
  "cd", "pushd", "popd", "set-location", "push-location", "pop-location",
]);
export const SHELL_READ_CMDS = Object.freeze([
  "ls", "dir", "cat", "head", "tail", "less", "more", "wc", "grep", "rg", "find", "echo", "pwd",
  "which", "where", "type", "file", "stat", "du", "df", "tree", "diff", "cmp", "sort", "uniq",
  "cut", "jq", "sed", "awk",
]);
export const SHELL_READ_PS_CMDS = Object.freeze([
  "get-childitem", "get-content", "get-item", "get-location", "test-path", "resolve-path",
  "select-string", "measure-object", "select-object", "sort-object", "where-object",
  "write-output", "write-host",
]);
export const GIT_READ_SUBCOMMANDS = Object.freeze([
  "status", "log", "diff", "show", "rev-parse", "ls-files", "blame", "describe",
]);

const NEUTRAL_SET = new Set(NEUTRAL_SHELL_CMDS);
const READ_SET = new Set(SHELL_READ_CMDS);
const READ_PS_SET = new Set(SHELL_READ_PS_CMDS);
const GIT_READ_SET = new Set(GIT_READ_SUBCOMMANDS);

const WRITE_REDIR_EXCEPTIONS = [
  /2>&1/g, />\s*\/dev\/null/g, /2>\s*\/dev\/null/g, />\s*\$null/g, /2>\s*nul\b/gi, />\s*nul\b/gi,
];
const WRITE_MARKERS_RE = /(>>|>|Out-File|Set-Content|Add-Content|Tee-Object)/i;
const ABS_PATH_RE = /(?:[A-Za-z]:[\\/][^\s"'`;|&><]*|\/[^\s"'`;|&><]*|~\/[^\s"'`;|&><]*)/g;

function hasWriteRedirection(command) {
  let s = command;
  for (const re of WRITE_REDIR_EXCEPTIONS) s = s.replace(re, " ");
  return WRITE_MARKERS_RE.test(s);
}

function splitShellSegments(command) {
  return String(command == null ? "" : command)
    .split(/\n/)
    .flatMap((line) => line.split(/&&|\|\||;|\|/))
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

// Retire les affectations de tete "X=y" (POSIX) avant d'identifier la commande d'un segment.
function stripLeadingAssignments(segment) {
  let s = segment;
  while (/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/.test(s)) s = s.replace(/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/, "");
  return s;
}

// Tokenisation grossiere (MVP honnete, comme le garde historique) : suffit a la classification.
function tokenizeShell(segment) {
  return segment.match(/(?:"[^"]*"|'[^']*'|\S+)/g) || [];
}

function stripQuotes(tok) {
  if (tok.length >= 2) {
    const a = tok[0], z = tok[tok.length - 1];
    if ((a === '"' && z === '"') || (a === "'" && z === "'")) return tok.slice(1, -1);
  }
  return tok;
}

function neutralTargetOf(tokens) {
  for (let i = 1; i < tokens.length; i++) {
    if (!tokens[i].startsWith("-")) return stripQuotes(tokens[i]);
  }
  return null;
}

// `git ...` : saute les options globales (`-C`, `-c`, `--git-dir[=]`, `--work-tree`, `--no-pager`,
// `-P`), releve les chemins de `-C`/`--git-dir`/`--work-tree`, juge la sous-commande.
function classifyGitSegment(tokens) {
  const paths = [];
  let i = 1;
  let sub = null;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "-C") { paths.push(stripQuotes(tokens[i + 1] || "")); i += 2; continue; }
    if (t.startsWith("--git-dir=")) { paths.push(t.slice("--git-dir=".length)); i += 1; continue; }
    if (t === "--git-dir") { paths.push(stripQuotes(tokens[i + 1] || "")); i += 2; continue; }
    if (t.startsWith("--work-tree=")) { paths.push(t.slice("--work-tree=".length)); i += 1; continue; }
    if (t === "--work-tree") { paths.push(stripQuotes(tokens[i + 1] || "")); i += 2; continue; }
    if (t === "-c") { i += 2; continue; }
    if (t === "--no-pager" || t === "-P") { i += 1; continue; }
    sub = t; i += 1; break;
  }
  const rest = tokens.slice(i);
  if (sub == null) return { read: false, paths };
  if (GIT_READ_SET.has(sub)) return { read: true, paths };
  if (sub === "branch") return { read: rest.length === 0 || rest.every((a) => a === "-a" || a === "-r" || a === "--list"), paths };
  if (sub === "remote") return { read: rest.length === 1 && rest[0] === "-v", paths };
  if (sub === "config") return { read: rest[0] === "--get", paths };
  return { read: false, paths };
}

// classifyShell(command, dialect) -> { kind: "READ"|"MUTATE", paths, registryRef, selfInvoke,
//                                      installerInvoke, portfolioVerb, segments }
export function classifyShell(command, dialect) {
  const cmd = String(command == null ? "" : command);
  const dial = dialect === "powershell" ? "powershell" : "bash";
  const segments = splitShellSegments(cmd);
  const paths = [];
  const registryRef = cmd.includes("iakaframe-sessions");
  let selfInvoke = false;
  let installerInvoke = false;
  let portfolioVerb = false;

  ABS_PATH_RE.lastIndex = 0;
  let m;
  while ((m = ABS_PATH_RE.exec(cmd)) !== null) paths.push(m[0]);

  let allRead = segments.length > 0;
  for (const rawSeg of segments) {
    const seg = stripLeadingAssignments(rawSeg);
    const tokens = tokenizeShell(seg);
    if (tokens.length === 0) { allRead = false; continue; }
    const head = tokens[0];
    const headLower = head.toLowerCase();

    if (/(^|[\\/])claude(\.exe)?$/i.test(head) &&
      tokens.some((t) => ["-p", "--print", "-r", "--resume", "-c", "--continue"].includes(t))) {
      selfInvoke = true;
    }
    if (tokens.some((t) => /install\.mjs$/i.test(t))) installerInvoke = true;
    if (headLower === "iakaframe" && (tokens[1] || "").toLowerCase() === "install") installerInvoke = true;

    if (headLower === "iakaframe") {
      const a1 = (tokens[1] || "").toLowerCase();
      const a2 = (tokens[2] || "").toLowerCase();
      const a3 = (tokens[3] || "").toLowerCase();
      if (a1 === "onboard" || a1 === "init") portfolioVerb = true;
      if (a1 === "agents" && a2 === "fullteam") portfolioVerb = true;
      if (a1 === "agents" && a2 === "--action" && a3 === "fullteam") portfolioVerb = true;
      if (portfolioVerb) {
        for (let i = 1; i < tokens.length; i++) {
          if ((tokens[i] === "--path" || tokens[i] === "--project") && tokens[i + 1]) {
            paths.push(stripQuotes(tokens[i + 1]));
          }
        }
      }
    }

    if (NEUTRAL_SET.has(headLower)) {
      const t = neutralTargetOf(tokens);
      if (t) paths.push(t);
      continue;
    }

    if (headLower === "git") {
      const g = classifyGitSegment(tokens);
      for (const p of g.paths) if (p) paths.push(p);
      if (!g.read) allRead = false;
      continue;
    }

    if (headLower === "node" || headLower === "npm" || headLower === "python") {
      if (!tokens.includes("--version")) allRead = false;
      continue;
    }

    if (headLower === "iakaframe") {
      const a1 = (tokens[1] || "").toLowerCase();
      const readVerbs = ["list", "show", "recap", "brief", "banner", "jalon", "vendor-check"];
      if (!readVerbs.includes(a1)) allRead = false;
      continue;
    }

    if (dial === "powershell" && (READ_PS_SET.has(headLower) || headLower.startsWith("format-"))) continue;

    if (READ_SET.has(headLower)) {
      if (headLower === "find" && tokens.some((t) => t === "-delete" || t === "-exec")) { allRead = false; continue; }
      if (headLower === "sed" && tokens.some((t) => t === "-i" || /^-i./.test(t))) { allRead = false; continue; }
      continue;
    }

    allRead = false;
  }

  const mutate = hasWriteRedirection(cmd) || !allRead;

  return {
    kind: mutate ? "MUTATE" : "READ",
    paths: [...new Set(paths)],
    registryRef,
    selfInvoke,
    installerInvoke,
    portfolioVerb,
    segments: segments.length,
  };
}

// ---------------------------------------------------------------------------
// D-5 — Verdict des GESTES DIRECTS (Edit/Write/NotebookEdit/Bash/PowerShell). Pur.
// ---------------------------------------------------------------------------

// Regime Odin (partage D-5 regle 6 / D-6) : le thread principal a DERIVE hors de "chez lui"
// (son dossier de lancement) sans qu'un grant ne couvre le chantier actif.
function inOdinRegime(actor, launch, state) {
  if (actor !== "MAIN") return false;
  const home = launch ? keySig(launch) : null;
  const activeKey = state.active ? state.active.key : null;
  const activeSig = activeKey ? keySig(activeKey) : null;
  const grantedActive = !!(activeKey && state.grants && state.grants.has(activeSig));
  const drifted = (launch && launch.kind === "portefeuille") || activeSig !== home;
  const activeIsPortfolio = !!(activeKey && activeKey.kind === "portefeuille");
  return drifted && !activeIsPortfolio && !grantedActive;
}

// Chantier EFFECTIF d'un geste (D-1/D-13) : la liaison du sous-agent PRIME sur le chantier de
// session — mais seulement si elle porte une cle (un `bind{key:null}` ambigu "retombe sur le
// chantier de session", D-13 §3).
function effectiveChantierKey(actor, agentId, state) {
  if (actor === "SUB" && agentId && state.bindings && state.bindings.has(agentId)) {
    const b = state.bindings.get(agentId);
    if (b.key) return b.key;
  }
  return state.active ? state.active.key : null;
}

// verdictChantier(input) -> { decision: "ALLOW"|"DENY", code?, key? } — les SEPT regles de D-5,
// dans l'ordre. `input` :
//   gesture   : "SHELL_READ" | "SHELL_MUTATE" | "EDIT"
//   actor     : "MAIN" | "SUB" (selon la seule presence d'agent_id, jamais agent_type)
//   agentId   : string | null
//   launch    : `key` du lancement de session (ancrage "chez soi")
//   state     : { active, grants, bindings } (sortie de `foldChantier`)
//   keys      : `key[]` DEJA resolues et EXCLUES (D-8) touchees par le geste
//   portfolioVerb, segments : drapeaux de `classifyShell` (regle 3, D-14)
export function verdictChantier(input) {
  const { gesture, actor, agentId, launch, state, keys, portfolioVerb, segments } = input;

  // 1. Lecture toujours libre.
  if (gesture === "SHELL_READ") return { decision: "ALLOW" };

  // 2. keys vide (tout exclu, D-8) -> ALLOW.
  const ks = keys || [];
  if (ks.length === 0) return { decision: "ALLOW" };

  // 3. Commande portefeuille (D-14, Q-B).
  if (
    actor === "MAIN" && launch && launch.kind === "portefeuille" &&
    portfolioVerb && segments === 1 &&
    ks.every((k) => k.kind === "repo" || k.kind === "dir")
  ) {
    return { decision: "ALLOW", code: "PORTFOLIO_VERB" };
  }

  // 4. Chantier effectif.
  const effective = effectiveChantierKey(actor, agentId, state);
  if (!effective) return { decision: "DENY", code: "NO_CHANTIER" };

  // 5. Une cle touchee != effective (le "@hors" inclus).
  const effSig = keySig(effective);
  if (ks.some((k) => keySig(k) !== effSig)) return { decision: "DENY", code: "CHANTIER_MISMATCH" };

  // 6. Regime Odin.
  if (inOdinRegime(actor, launch, state)) return { decision: "DENY", code: "ODIN_DIRECT" };

  // 7. sinon ALLOW.
  return { decision: "ALLOW" };
}

// ---------------------------------------------------------------------------
// D-6 — Verdict des DELEGATIONS (`Agent`/`Task`, apres le controle de roster existant). Pur.
// ---------------------------------------------------------------------------

// verdictDispatch(input) -> { decision: "ALLOW"|"DENY", code?, dispatch? }. `input` :
//   actor, agentId  : idem verdictChantier
//   target          : `subagent_type` normalise (ou null -> AGENT_UNSET)
//   requested       : { key, ambiguous } DEJA resolu par l'adaptateur (D-3/D-4) depuis la(les)
//                      ligne(s) `Chantier: <repo>` du prompt de delegation
//   state, launch   : idem verdictChantier
export function verdictDispatch(input) {
  const { actor, agentId, target, requested, state, launch } = input;
  const tgt = target == null ? AGENT_UNSET : String(target);
  const tgtLower = tgt.toLowerCase();

  // Cibles lecture seule tolerees SANS CONDITION (avant meme de juger la ligne `Chantier:`).
  if (READONLY_BUILTINS.some((b) => b.toLowerCase() === tgtLower)) return { decision: "ALLOW" };

  const req = requested || { key: null, ambiguous: false };
  if (req.ambiguous) return { decision: "DENY", code: "DISPATCH_AMBIGUOUS" };

  const dispatcherKey = effectiveChantierKey(actor, agentId, state);
  const odinRegime = inOdinRegime(actor, launch, state);

  if (odinRegime) {
    if (tgtLower !== "aragorn") return { decision: "DENY", code: "ODIN_DISPATCH" };
    if (!req.key) return { decision: "DENY", code: "DISPATCH_UNNAMED" };
  }

  if (!req.key) {
    if (!dispatcherKey) return { decision: "DENY", code: "NO_CHANTIER" };
    return { decision: "ALLOW", dispatch: { key: dispatcherKey, target: tgt } };
  }

  const reqSig = keySig(req.key);
  if (dispatcherKey && reqSig === keySig(dispatcherKey)) {
    return { decision: "ALLOW", dispatch: { key: req.key, target: tgt } };
  }
  if (state.named && state.named.has(reqSig)) {
    return { decision: "ALLOW", dispatch: { key: req.key, target: tgt } };
  }
  return { decision: "DENY", code: "NOT_DESIGNATED" };
}
