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

// isAnchoredKey(key) -> bool (3e amendement, A3-3/A3-4). Une `key` identifie un chantier REEL
// sauf si elle est `kind:"hors"` SANS `root` : forme HERITEE d'un registre ecrit avant le Lot
// 1ter, ou ancre refusee car trop large (A3-9, Q-H1). Une telle cle ne peut jamais servir de
// chantier effectif (verdictChantier regle 5) ni d'actif de dispatch (verdictDispatch regle 3).
export function isAnchoredKey(key) {
  return !!key && (key.kind !== "hors" || !!key.root);
}

// Sous-agents natifs lecture-seule TOLERES sans condition en dispatch (D-6). Distinct de BUILTINS
// (roster) : `statusline-setup` en est explicitement absent (il ECRIT settings.json).
export const READONLY_BUILTINS = Object.freeze(["Explore", "Plan", "claude-code-guide"]);

// Commandes portefeuille (D-14, Q-B) : liste FERMEE, cf. `classifyShell` pour la reconnaissance
// (avec arguments variables : `--path`/`--project`, ou `<repo>` pour `launch`) et
// `verdictChantier` regle 3 pour l'ALLOW. `iakaframe launch` (Lot 1bis, instruction soeur
// lancement-session-aragorn.md) : SEUL le littéral compte, jamais la forme par chemin du CLI
// (D-7, "afin que la regle de permission `ask` du lanceur couvre TOUT lancement autorise").
export const PORTFOLIO_VERBS = Object.freeze([
  "iakaframe onboard",
  "iakaframe init",
  "iakaframe agents fullteam",
  "iakaframe agents --action fullteam",
  "iakaframe launch",
]);

// Phrases reservees (D-3, detection (b)) : retirees du texte AVANT `detectRepoMentions`, pour que
// l'usage courant de la methode ("update iakaframe", "iakastart"...) ne nomme jamais un depot.
// Le motif generique `iakaframe <mot>` couvre en plus tout verbe CLI ("iakaframe onboard/install/
// show/..."), cf. `chantier-remind.mjs` (detection (b), Lot 3).
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
//   { active, segments, grants, named, launch }
//   - active   : { key, segment, since, by, aragorn } | null (segment courant, sans `until`)
//   - segments : segments CLOS (avec `until`) dans l'ordre, puis le segment courant en dernier
//   - grants   : Set de signatures de `key` accordees (`odin-direct`)
//   - named    : Set de signatures de `key` nommees par le decideur (mentions/declarations)
//   - launch   : { key, main_role, main_agent_type } du PREMIER `launch` (D-1) — IMMUABLE pour
//                toute la session (contrairement a `active`, qui evolue au fil des `declare`).
//                `main_role` = "odin" par defaut si absent du registre (D-1, "cas theorique").
// Lot 1bis (2e amendement) : la liaison par sous-agent (ex-D-13) est EXCLUE (Q-A revise, "une
// session par depot"). Les types `dispatch`/`bind` d'un registre HERITE, comme tout type
// INCONNU, sont desormais IGNORES sans effet sur l'etat (cf. `default` ci-dessous) — jamais une
// erreur : un registre ecrit par une version anterieure du garde reste lisible.
export function foldChantier(lines) {
  const arr = Array.isArray(lines) ? lines : String(lines == null ? "" : lines).split("\n");
  let active = null;
  let launched = false;
  let launch = null;
  const segments = [];
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
        launch = {
          key: ev.key ?? null,
          main_role: ev.main_role != null ? ev.main_role : "odin",
          main_agent_type: ev.main_agent_type ?? null,
        };
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
      default:
        break; // `fail_open`, anciens `dispatch`/`bind` (Lot 1bis) et types inconnus : sans effet
    }
  }
  if (active) segments.push({ ...active }); // segment courant, sans `until`

  return { active, segments, grants, named, launch };
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

// D-7/D-9 (Lot 1bis) — reconnaissance elargie.
const CLAUDE_HEAD_RE = /(^|[\\/])claude(\.exe|\.cmd)?$/i;
const CLAUDE_WORD_RE = /(?<!\.)\bclaude\b/i;
const VERSION_ONLY_FLAGS = new Set(["--version", "-v", "--help"]);
// Lanceurs de processus (D-7, `selfInvoke` elargi) : un segment dont la commande est l'un de
// ceux-ci ET qui contient le mot `claude` (non precede de `.`) est aussi `selfInvoke`.
const LAUNCHER_HEADS = new Set(["wt", "wt.exe", "start", "cmd", "start-process", "powershell", "pwsh"]);
// Forme par chemin du CLI (D-7) : `node <...>/cli/src/index.js` — separateurs `/` OU `\`.
const CLI_INDEX_RE = /(^|[\\/])cli[\\/]src[\\/]index\.js$/i;
const READ_VERBS = Object.freeze(["list", "show", "recap", "brief", "banner", "jalon", "vendor-check"]);

// iakaframeEquivalent(tokens) -> tokens COMME SI `iakaframe <verbe> ...` si le segment est
// `node <...>/cli/src/index.js <verbe> ...` (D-7, "forme par chemin du CLI" — cf. M-17,
// `iakastart`) ; sinon null. Cette forme est traitee EXACTEMENT comme `iakaframe <verbe>` pour
// les regles de lecture, `portfolioVerb` et `installerInvoke` — SAUF `launch` (cf. appelant).
function iakaframeEquivalent(tokens) {
  if (tokens.length >= 2 && /^node(\.exe)?$/i.test(tokens[0]) && CLI_INDEX_RE.test(stripQuotes(tokens[1]))) {
    return ["iakaframe", ...tokens.slice(2)];
  }
  return null;
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
    // Forme par chemin du CLI (D-7) : `effHeadLower`/`effTokens` valent pour lecture,
    // `portfolioVerb` (hors `launch`) et `installerInvoke` ; `head`/`tokens` bruts restent la
    // reference pour `selfInvoke` et le littéral `iakaframe launch`.
    const cliEquiv = iakaframeEquivalent(tokens);
    const effTokens = cliEquiv || tokens;
    const effHeadLower = cliEquiv ? "iakaframe" : headLower;

    // selfInvoke (D-7/D-9, elargi) : commande `claude`/`claude.exe`/`claude.cmd` (hors
    // --version/-v/--help) ; OU un lanceur de processus dont un argument contient le mot
    // `claude` ; OU `iakaframe go` (M-17, lance `claude`). Un simple argument d'une AUTRE
    // commande ("git commit -m \"fix claude\"") n'est jamais `selfInvoke`.
    if (CLAUDE_HEAD_RE.test(head)) {
      const readOnly = tokens.some((t) => VERSION_ONLY_FLAGS.has(t));
      if (!readOnly) selfInvoke = true;
    }
    if (LAUNCHER_HEADS.has(headLower) && tokens.slice(1).some((t) => CLAUDE_WORD_RE.test(stripQuotes(t)))) {
      selfInvoke = true;
    }
    if (effHeadLower === "iakaframe" && (effTokens[1] || "").toLowerCase() === "go") {
      selfInvoke = true;
    }

    // installerInvoke (Q-C) : invocation directe de `install.mjs`, ou `iakaframe install`
    // (littéral ou forme par chemin du CLI).
    if (tokens.some((t) => /install\.mjs$/i.test(t))) installerInvoke = true;
    if (effHeadLower === "iakaframe" && (effTokens[1] || "").toLowerCase() === "install") installerInvoke = true;

    // portfolioVerb (Q-B/D-14) : `onboard`/`init`/`agents fullteam` suivent la forme par chemin
    // du CLI ; `launch` (D-9) exige le LITTÉRAL `iakaframe launch` (jamais la forme par chemin,
    // qui reste MUTATE ordinaire — cf. commentaire de `PORTFOLIO_VERBS`).
    if (effHeadLower === "iakaframe") {
      const a1 = (effTokens[1] || "").toLowerCase();
      const a2 = (effTokens[2] || "").toLowerCase();
      const a3 = (effTokens[3] || "").toLowerCase();
      if (a1 === "onboard" || a1 === "init") portfolioVerb = true;
      if (a1 === "agents" && a2 === "fullteam") portfolioVerb = true;
      if (a1 === "agents" && a2 === "--action" && a3 === "fullteam") portfolioVerb = true;
      if (portfolioVerb) {
        for (let i = 1; i < effTokens.length; i++) {
          if ((effTokens[i] === "--path" || effTokens[i] === "--project") && effTokens[i + 1]) {
            paths.push(stripQuotes(effTokens[i + 1]));
          }
        }
      }
    }
    if (headLower === "iakaframe" && (tokens[1] || "").toLowerCase() === "launch") {
      portfolioVerb = true;
      if (tokens[2] && !tokens[2].startsWith("-")) paths.push(stripQuotes(tokens[2])); // <repo> du lanceur
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

    // `iakaframe <verbe>` (littéral OU forme par chemin du CLI, D-7) : `models` est en LECTURE
    // sauf `set`/`unset` ; sinon liste fermee `READ_VERBS`.
    if (effHeadLower === "iakaframe") {
      const a1 = (effTokens[1] || "").toLowerCase();
      if (a1 === "models") {
        const sub = (effTokens[2] || "").toLowerCase();
        if (sub === "set" || sub === "unset") allRead = false;
        continue;
      }
      if (!READ_VERBS.includes(a1)) allRead = false;
      continue;
    }

    // `claude|node|npm|python --version` : lecture (D-7). N'est atteint QUE si le segment n'est
    // ni la forme par chemin du CLI ni `iakaframe` litteral (deja traites ci-dessus).
    if (headLower === "node" || headLower === "npm" || headLower === "python" || headLower === "claude") {
      if (!tokens.includes("--version")) allRead = false;
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

// mainRoleOf(agentType) -> "odin" | "team" (D-5, Q-F). Calcule sur le payload qui CREE le
// registre (le tout premier hook, D-1) : "odin" si `agent_type` est absent/vide OU vaut "odin"
// (insensible a la casse) ; toute AUTRE valeur ("aragorn", "gimli"...) -> "team", une session
// lancee avec `--agent X` (X != odin) qui travaille DANS son repertoire de lancement, sans plus.
export function mainRoleOf(agentType) {
  if (agentType == null || String(agentType).trim() === "") return "odin";
  return String(agentType).trim().toLowerCase() === "odin" ? "odin" : "team";
}

// Regime Odin (partage D-5 regle 7 / D-6 regle 4) : le thread principal, en session de role
// "odin", a DERIVE hors de "chez lui" (son dossier de lancement) sans qu'un grant ne couvre le
// chantier actif. En regime Equipe (sessionRole = "team"), jamais de regime Odin — le thread
// principal (Aragorn) et ses sous-agents restent "chez eux" dans le depot de lancement (D-5).
function inOdinRegime(actor, sessionRole, launch, state) {
  if (actor !== "MAIN" || sessionRole !== "odin") return false;
  const home = launch ? keySig(launch) : null;
  const activeKey = state.active ? state.active.key : null;
  const activeSig = activeKey ? keySig(activeKey) : null;
  const grantedActive = !!(activeKey && state.grants && state.grants.has(activeSig));
  const drifted = (launch && launch.kind === "portefeuille") || activeSig !== home;
  const activeIsPortfolio = !!(activeKey && activeKey.kind === "portefeuille");
  return drifted && !activeIsPortfolio && !grantedActive;
}

// verdictChantier(input) -> { decision: "ALLOW"|"DENY", code? } — les HUIT regles de D-5
// (2e amendement), dans l'ordre. `input` :
//   gesture     : "SHELL_READ" | "SHELL_MUTATE" | "EDIT"
//   actor       : "MAIN" | "SUB" (selon la seule presence d'agent_id, jamais agent_type)
//   sessionRole : "odin" | "team" — `launch.main_role` du registre, vaut pour TOUS les acteurs
//                 de la session (sous-agents compris : leur `agent_type` est celui du
//                 sous-agent, pas de la session, D-5)
//   launch      : `key` du lancement de session (ancrage "chez soi")
//   state       : { active, grants } (sortie de `foldChantier`)
//   keys        : `key[]` DEJA resolues et EXCLUES (D-8) touchees par le geste
//   portfolioVerb, segments : drapeaux de `classifyShell` (regle 3, D-14)
export function verdictChantier(input) {
  const { gesture, actor, sessionRole, launch, state, keys, portfolioVerb, segments } = input;

  // 1. Lecture toujours libre.
  if (gesture === "SHELL_READ") return { decision: "ALLOW" };

  // 2. keys vide (tout exclu, D-8) -> ALLOW.
  const ks = keys || [];
  if (ks.length === 0) return { decision: "ALLOW" };

  // 3. Commande portefeuille (D-14, Q-B) : thread principal, session de role odin, lancee au
  // portefeuille, un SEUL segment, chaque cle sous la racine (repo/dir).
  if (
    actor === "MAIN" && sessionRole === "odin" &&
    launch && launch.kind === "portefeuille" &&
    portfolioVerb && segments === 1 &&
    ks.every((k) => k.kind === "repo" || k.kind === "dir")
  ) {
    return { decision: "ALLOW", code: "PORTFOLIO_VERB" };
  }

  // 4. Session d'equipe hors depot : une session `team` DOIT etre lancee dans un depot/dossier.
  if (sessionRole === "team" && (!launch || (launch.kind !== "repo" && launch.kind !== "dir"))) {
    return { decision: "DENY", code: "TEAM_NEEDS_REPO" };
  }

  // 5. Chantier effectif = actif (en session team, actif = lancement, TOUJOURS). Pas d'effectif,
  // OU effectif hors NON ANCRE (3e amendement, A3-4/A3-3 : forme heritee ou ancre refusee) ->
  // NO_CHANTIER.
  const effective = state.active ? state.active.key : null;
  if (!effective || !isAnchoredKey(effective)) return { decision: "DENY", code: "NO_CHANTIER" };

  // 6. Une cle touchee != effective : toute cle hors d'un AUTRE root que l'effective, ou NON
  // ANCREE, compte comme un mismatch (3e amendement, A3-4 ; "@hors compris" avant le 3e amendement).
  const effSig = keySig(effective);
  if (ks.some((k) => keySig(k) !== effSig)) return { decision: "DENY", code: "CHANTIER_MISMATCH" };

  // 7. Regime Odin.
  if (inOdinRegime(actor, sessionRole, launch, state)) return { decision: "DENY", code: "ODIN_DIRECT" };

  // 8. sinon ALLOW.
  return { decision: "ALLOW" };
}

// ---------------------------------------------------------------------------
// D-6 — Verdict des DELEGATIONS (`Agent`/`Task`, apres le controle de roster existant). Pur.
// ---------------------------------------------------------------------------

// verdictDispatch(input) -> { decision: "ALLOW"|"DENY", code? } — les SIX regles de D-6
// (2e amendement : plus d'evenement `dispatch` a ecrire, plus de `NOT_DESIGNATED`). `input` :
//   actor, sessionRole : idem verdictChantier
//   target              : `subagent_type` normalise (ou null -> AGENT_UNSET)
//   requested           : { key, ambiguous } DEJA resolu par l'adaptateur (D-3/D-4) depuis la
//                          (les) ligne(s) `Chantier: <repo>` du prompt de delegation
//   state, launch       : idem verdictChantier
export function verdictDispatch(input) {
  const { actor, sessionRole, target, requested, state, launch } = input;
  const tgt = target == null ? AGENT_UNSET : String(target);
  const tgtLower = tgt.toLowerCase();

  // 1. Cibles lecture seule tolerees SANS CONDITION (avant meme de juger la ligne `Chantier:`).
  if (READONLY_BUILTINS.some((b) => b.toLowerCase() === tgtLower)) return { decision: "ALLOW" };

  // 2. Plusieurs lignes `Chantier:` divergentes.
  const req = requested || { key: null, ambiguous: false };
  if (req.ambiguous) return { decision: "DENY", code: "DISPATCH_AMBIGUOUS" };

  // 3. Pas de chantier actif, OU actif hors NON ANCRE (3e amendement, A3-4).
  const active = state.active ? state.active.key : null;
  if (!active || !isAnchoredKey(active)) return { decision: "DENY", code: "NO_CHANTIER" };

  // 4. Regime Odin (Q-D) — memes conditions que D-5 regle 7.
  if (inOdinRegime(actor, sessionRole, launch, state)) {
    if (tgtLower !== "aragorn") return { decision: "DENY", code: "ODIN_DISPATCH" };
    if (!req.key) return { decision: "DENY", code: "DISPATCH_UNNAMED" };
  }

  // 5. Ligne `Chantier: <repo>` presente et resolue != actif.
  if (req.key && keySig(req.key) !== keySig(active)) {
    return { decision: "DENY", code: "CHANTIER_MISMATCH" };
  }

  // 6. sinon ALLOW (en regime Equipe, toute cible du roster, avec ou sans ligne).
  return { decision: "ALLOW" };
}

// ---------------------------------------------------------------------------
// Verdict VOIX (specs/instructions/prise-de-parole-odin-aragorn.md, Lot P1). Pur : AUCUNE E/S,
// AUCUNE resolution de chemin (la `launchKey` est DEJA resolue par l'adaptateur `chantier-state.mjs`
// via `keyOf`, comme pour le verdict CHANTIER). Determine QUI PARLE (Aragorn dans un depot, Odin au
// portefeuille/hors), independamment du `sessionRole` du garde (P-2 : les deux notions coexistent
// sans etre alignees, decision Q-P1 = A — ce module ne touche a AUCUN verdict de garde existant).
// ---------------------------------------------------------------------------

// isOdinSolicitation(prompt) -> bool (P-3). Sollicitation directe d'Odin dans un depot : la
// PREMIERE LIGNE NON VIDE du prompt, apres trim(), commence par le mot `odin` (casse ignoree), non
// suivi d'une lettre, d'un chiffre, de `_` ou de `-` (exclut `odin-direct`, `odinson`). Une mention
// d'Odin plus loin dans le prompt, ou en dehors de la 1ere ligne non vide, ne compte pas.
const RE_ODIN_SOLICITATION = /^odin(?![a-z0-9_-])/i;

export function isOdinSolicitation(prompt) {
  const text = String(prompt == null ? "" : prompt);
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  if (lines.length === 0) return false;
  return RE_ODIN_SOLICITATION.test(lines[0]);
}

// voiceOf({ launchKey, agentType, prompt }) -> { voice, royaume, turnVoice } (P-5). `launchKey` =
// cle DEJA resolue du lieu de lancement de la session (`{ kind, root, name }`, ou null/absente) ;
// `agentType` = valeur brute du payload (peut etre absente) ; `prompt` = texte du tour courant.
// Regles DANS L'ORDRE (P-5) :
//   1. `agentType` non vide et, en minuscules, hors {"odin","aragorn"} -> tout "generic" ;
//   2. `launchKey` absent -> tout "generic" ;
//   3. `launchKey.kind` in {"repo","dir"} -> voice:"aragorn", royaume = nom en MAJUSCULE ;
//      turnVoice = "odin" si isOdinSolicitation(prompt), sinon "aragorn" ;
//   4. sinon (`portefeuille`, `hors`) -> voice = turnVoice = "odin", royaume:"PORTEFEUILLE".
export function voiceOf({ launchKey, agentType, prompt } = {}) {
  const at = agentType == null ? "" : String(agentType).trim().toLowerCase();
  if (at !== "" && at !== "odin" && at !== "aragorn") {
    return { voice: "generic", royaume: null, turnVoice: "generic" };
  }
  if (!launchKey) {
    return { voice: "generic", royaume: null, turnVoice: "generic" };
  }
  if (launchKey.kind === "repo" || launchKey.kind === "dir") {
    const royaume = String(launchKey.name == null ? "" : launchKey.name).toUpperCase();
    const turnVoice = isOdinSolicitation(prompt) ? "odin" : "aragorn";
    return { voice: "aragorn", royaume, turnVoice };
  }
  return { voice: "odin", royaume: "PORTEFEUILLE", turnVoice: "odin" };
}
