// chantier-state.mjs — ADAPTATEUR I/O de la couche CHANTIER (Lot 2, specs/instructions/
// declaration-chantier-session.md § D-1/D-4/D-8/D-9/D-10). Toute la logique de DECISION pure
// (fold du registre, verdicts) vit dans guard-core.mjs ; ce fichier ne porte QUE l'I/O :
// lecture/ecriture du registre JSONL, resolution de chemins (normalisation Windows/POSIX,
// chemin -> `key`), listage des depots connus, exclusions et hors-limite absolu.
//
// Consomme par chantier-remind.mjs (UserPromptSubmit, Lot 3). Sera consomme par
// perimeter-guard.mjs / delegation-guard.mjs / plan-courante.mjs aux Lots 4-5 (non cables ici).
// Lot 1bis (2e amendement) : la liaison de chantier par sous-agent (ex-D-13, hook `SubagentStart`,
// `chantier-bind.mjs`) est EXCLUE (Q-A revise, "une session par depot") — ni ce fichier ni aucun
// autre du Lot 2 n'en porte trace.
//
// FAIL-OPEN partout cote appelant : ce module ne process.exit() JAMAIS lui-meme ; toute erreur
// interne remonte a l'appelant, qui doit passer par failOpen() (D-10).

import {
  appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { foldChantier, isUnder, mainRoleOf } from "./guard-core.mjs";

// ---------------------------------------------------------------------------
// 3e amendement (A3-9, Q-H1) — ancre hors TROP LARGE : racine de volume, ou dossier personnel.
// Verifie au moment de POSER une ancre (ensureLaunch, resolveRepoArg) ; `keyOf` lui-meme ne la
// pose jamais (elle ne sait pas si le chemin qu'elle resout EST une ancre en cours de creation).
// ---------------------------------------------------------------------------

// isAnchorTooLarge(root) -> bool : `root` (deja normalise, ou non) est la racine d'un volume
// (`dirname(root) === root`, ex. `C:\`, `/`) ou le dossier personnel (`normalize(homedir())`).
function isAnchorTooLarge(root) {
  if (!root) return false;
  const norm = normalize(root);
  if (dirname(norm) === norm) return true;
  if (norm === normalize(homedir())) return true;
  return false;
}

const SID_RE = /^[A-Za-z0-9-]+$/;

const claudeDir = () => join(homedir(), ".claude");
const sessionsDir = () => join(claudeDir(), "iakaframe-sessions");

// ---------------------------------------------------------------------------
// D-1 — Registre JSONL append-only, un fichier par session.
// ---------------------------------------------------------------------------

// registryPath(sid) -> chemin du registre, ou null si `sid` est absent / hors de la forme
// autorisee ([A-Za-z0-9-]+) : la couche chantier est alors IGNOREE par l'appelant (D-1).
export function registryPath(sid) {
  if (sid == null) return null;
  const s = String(sid);
  if (!SID_RE.test(s)) return null;
  return join(sessionsDir(), `${s}.jsonl`);
}

// loadState(sid) -> etat replie (foldChantier) ou null (sid invalide, registre absent ENOENT).
export function loadState(sid) {
  const p = registryPath(sid);
  if (!p) return null;
  let raw;
  try {
    raw = readFileSync(p, "utf8");
  } catch (e) {
    if (e && e.code === "ENOENT") return null;
    throw e;
  }
  return foldChantier(raw.split(/\r?\n/));
}

// appendEvent(sid, ev) -> true si la ligne a ete ecrite. `ev` doit porter `type` ; `v`/`at`
// sont poses ici s'ils sont absents (append d'UNE ligne < 4 Ko, jamais de lecture-modification).
export function appendEvent(sid, ev) {
  const p = registryPath(sid);
  if (!p) return false;
  try {
    mkdirSync(dirname(p), { recursive: true });
    const rec = { v: 1, at: new Date().toISOString(), ...ev };
    appendFileSync(p, JSON.stringify(rec) + "\n", "utf8");
    return true;
  } catch {
    return false;
  }
}

// ensureLaunch(payload) -> init paresseuse (D-1 : "1er hook qui voit la session"). `payload` =
// entree canonique du hook (session_id, cwd, et EVENTUELLEMENT agent_id/agent_type — le premier
// hook a voir la session peut, en theorie, etre celui d'un sous-agent, cf. D-1 "cas theorique").
// Renvoie { created, state } ou null si `sid` invalide. Idempotent au sens du fold (premier
// `launch` gagnant) : deux hooks concurrents peuvent tous deux ecrire un `launch`, sans
// consequence (D-1, "Concurrence d'ecriture").
//
// `main_role`/`main_agent_type` (D-1, Q-F) : si le payload qui cree le registre porte `agent_id`
// (cas theorique d'un sous-agent en tout premier hook), `main_role:"odin"`, `main_agent_type:null`
// (D-1) ; sinon `main_role = mainRoleOf(payload.agent_type)` (pur, guard-core) et
// `main_agent_type = payload.agent_type` tel quel (ou null si absent).
export function ensureLaunch(payload) {
  const sid = payload && payload.session_id;
  const p = registryPath(sid);
  if (!p) return null;
  if (existsSync(p)) return { created: false, state: loadState(sid) };
  const cwd = resolve((payload && payload.cwd) || process.cwd());
  let key = keyOf(cwd);
  // 3e amendement (A3-9, Q-H1) : une ancre hors trop large (racine de volume, `~`) n'est PAS
  // posee -> repli sur la forme NON ANCREE (A3-3), comme un registre herite (`NO_CHANTIER`).
  if (key.kind === "hors" && key.root && isAnchorTooLarge(key.root)) {
    key = { kind: "hors", root: null, name: "@hors" };
  }
  const isSub = !!(payload && payload.agent_id);
  const mainRole = isSub ? "odin" : mainRoleOf(payload && payload.agent_type);
  const mainAgentType = isSub ? null : ((payload && payload.agent_type) ?? null);
  appendEvent(sid, {
    type: "launch", project_dir: cwd, key, main_role: mainRole, main_agent_type: mainAgentType,
  });
  return { created: true, state: loadState(sid) };
}

// ---------------------------------------------------------------------------
// D-4 — Resolution chemin -> `key` (adaptateur, I/O).
// ---------------------------------------------------------------------------

// Racine du portefeuille (meme regle que cli/src/lib/root.js, dupliquee ici a dessein : les
// hooks sont des fichiers AUTONOMES deployes hors du depot, sans acces a cli/src).
export function resolveRoot() {
  if (process.env.IAKAFRAME_ROOT) return resolve(process.env.IAKAFRAME_ROOT);
  return process.platform === "win32" ? "C:\\work" : join(homedir(), "work");
}

// normalize(abs) -> forme CANONIQUE d'un chemin absolu (M-12) : `fs.realpathSync.native` du
// plus proche ANCETRE EXISTANT (resout formes courtes 8.3, casse Windows, liens symboliques
// POSIX), puis reconstitution de la queue non existante telle quelle (un chemin de fichier a
// CREER n'existe pas encore ; seul son dossier parent doit exister). Aucun ancetre n'existe
// (racine du disque comprise, cas degenere) -> chemin resolu tel quel, inchange.
export function normalize(abs) {
  const resolved = resolve(String(abs));
  let candidate = resolved;
  const tail = [];
  for (;;) {
    try {
      const real = realpathSync.native(candidate);
      return tail.length ? join(real, ...tail) : real;
    } catch {
      const parent = dirname(candidate);
      if (parent === candidate) return resolved; // racine du disque : rien n'existe, on abandonne
      tail.unshift(basename(candidate));
      candidate = parent;
    }
  }
}

function hasDotGit(dir) {
  try {
    return existsSync(join(dir, ".git"));
  } catch {
    return false;
  }
}

// Un `.git` FICHIER (worktree, cf. `git worktree add`) contient `gitdir: <chemin>`. Si ce
// chemin porte `/worktrees/<nom>` -> c'est une worktree de Gimli : le depot PRINCIPAL est
// l'ancetre qui porte le `.git` REEL (D-4 §1). Sinon (sous-module) -> null.
function worktreeMainRoot(gitPath) {
  let content;
  try {
    content = readFileSync(gitPath, "utf8");
  } catch {
    return null;
  }
  const m = /^gitdir:\s*(.+?)\s*$/m.exec(content);
  if (!m) return null;
  const gitdir = m[1].replace(/\\/g, "/");
  const wt = /^(.*)\/\.git\/worktrees\/[^/]+\/?$/.exec(gitdir);
  return wt ? resolve(wt[1]) : null;
}

// keyOf(absPath, opts?) -> `key` D-4 : { kind: "repo"|"dir"|"portefeuille"|"hors", root, name }.
// Chemin d'abord NORMALISE (M-12). `opts.fileTarget` (AFFINE au Lot 4, cf. limite CONNUE ci-avant
// dans l'historique du fichier) : quand l'appelant SAIT que le chemin resout un geste Edit/Write/
// NotebookEdit (un FICHIER, toujours), un chemin INEXISTANT a un seul segment sous la racine est
// traite comme un fichier place DIRECTEMENT dans la racine (`kind:"portefeuille"`), au lieu d'etre
// suppose etre un DOSSIER de projet — l'ambiguite ne se pose QUE pour un chemin qui n'existe pas
// encore (un chemin EXISTANT est deja tranche par `statSync`, hint ignore). Par defaut
// (`fileTarget` absent/false, comportement du Lot 2 INCHANGE pour tout appelant existant —
// `chantier-remind.mjs`/`resolveRepoArg` ne passent jamais ce hint) : un chemin inexistant a un
// segment reste suppose etre un DOSSIER de projet (cas de creation de projet, D-3).
// `opts.state` (3e amendement, A3-2) : etat replie de la session (sortie de `foldChantier`),
// utilise UNIQUEMENT par la branche 3 (hors racine, hors depot) pour retrouver les ANCRES de la
// session en cours (`state.launch.key`/`state.active.key`, `kind:"hors"` a `root` non nul) — un
// chemin hors dont la resolution ordinaire (branche 1/2) echoue mais qui tombe SOUS une ancre
// EST cette ancre (meme chantier), jamais une cle propre distincte.
export function keyOf(absPath, opts) {
  const fileTarget = !!(opts && opts.fileTarget);
  const norm = normalize(resolve(String(absPath)));

  // 1. Remonter jusqu'a un `.git` (dossier ou racine elle-meme si c'est un depot).
  let startsAsDir = false;
  try {
    startsAsDir = statSync(norm).isDirectory();
  } catch {
    startsAsDir = false; // chemin inexistant -> on part de son dossier parent
  }
  let dir = startsAsDir ? norm : dirname(norm);
  for (;;) {
    const gitPath = join(dir, ".git");
    if (existsSync(gitPath)) {
      let isDir = false;
      try {
        isDir = statSync(gitPath).isDirectory();
      } catch {
        isDir = false;
      }
      if (isDir) return { kind: "repo", root: dir, name: basename(dir) };
      const mainRoot = worktreeMainRoot(gitPath);
      if (mainRoot) return { kind: "repo", root: mainRoot, name: basename(mainRoot) };
      return { kind: "repo", root: dir, name: basename(dir) }; // `.git` fichier, pas une worktree : sous-module
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // 2. Sous la racine du portefeuille (racine elle-meme NORMALISEE : meme espace de
  // comparaison que `norm`, sinon un alias 8.3/casse de la racine romprait la comparaison).
  const root = normalize(resolveRoot());
  if (isUnder(root, norm, relative, isAbsolute)) {
    const rel = relative(root, norm);
    if (rel === "") return { kind: "portefeuille", root, name: "@portefeuille" };
    const segs = rel.split(/[\\/]/).filter(Boolean);
    const first = segs[0];
    if (first.startsWith(".")) return { kind: "portefeuille", root, name: "@portefeuille" };
    // Un FICHIER (existant, OU cible connue d'un geste Edit/Write via `fileTarget`) directement
    // dans la racine (un seul segment) -> portefeuille.
    if (segs.length === 1) {
      let isFile = false;
      try {
        isFile = statSync(norm).isFile();
      } catch {
        isFile = fileTarget; // inexistant : "dossier de projet" (D-3) sauf hint fileTarget explicite
      }
      if (isFile) return { kind: "portefeuille", root, name: "@portefeuille" };
    }
    return { kind: "dir", root: join(root, first), name: first };
  }

  // 3. Hors racine, hors depot (3e amendement, A3-2).
  // (a) Ancres de la session (`kind:"hors"` a `root` NON NUL parmi `state.launch.key` et
  // `state.active.key`) : `norm` sous une ancre (egalite comprise) -> la cle rendue EST cette
  // ancre (meme chantier) ; plusieurs ancres contiennent `norm` -> celle au `root` le plus long
  // (la plus specifique, cf. ancres imbriquees launch/active).
  const state = opts && opts.state;
  if (state) {
    let best = null;
    const candidates = [
      state.launch && state.launch.key,
      state.active && state.active.key,
    ];
    for (const k of candidates) {
      if (!k || k.kind !== "hors" || !k.root) continue;
      const aRoot = normalize(k.root);
      if (!isUnder(aRoot, norm, relative, isAbsolute)) continue;
      if (!best || aRoot.length > normalize(best.root).length) best = k;
    }
    if (best) return { kind: "hors", root: best.root, name: best.name };
  }
  // (b) sinon, cle hors PROPRE : `root` = `norm` s'il est un dossier EXISTANT, sinon son parent ;
  // `name` = "@hors:" + (basename(root) || root) (ex. "@hors:scripts" ; racine de volume ->
  // "@hors:C:\"). Invariant de surete : ici `norm` n'est sous AUCUNE ancre (le bloc (a) ci-dessus
  // aurait deja rendu la main) ; son `root` (norm ou son parent) ne peut donc JAMAIS etre egal au
  // `root` d'une ancre — une cle propre ne porte jamais la signature du chantier effectif.
  let isDir = false;
  try {
    isDir = statSync(norm).isDirectory();
  } catch {
    isDir = false;
  }
  const horsRoot = isDir ? norm : dirname(norm);
  const horsName = `@hors:${basename(horsRoot) || horsRoot}`;
  return { kind: "hors", root: horsRoot, name: horsName };
}

// ---------------------------------------------------------------------------
// D-4 §3 — Depots connus, et resolution nom -> `key` (directives D-3).
// ---------------------------------------------------------------------------

// Lot 1bis (2e amendement) : `foldChantier` ne renvoie plus `bindings`/`dispatches` (liaison par
// sous-agent EXCLUE, ex-D-13) — l'etat replie ne porte plus que `{ active, segments, grants,
// named, launch }`. Le "depot de lancement" reste toujours connu via `segments` (`launch` ouvre
// TOUJOURS le segment 1) ; `state.launch.key` est ajoute par surcroit, en garde-fou, au cas ou un
// etat partiel serait fourni sans ses `segments` (jamais le cas de `loadState`, mais `state` peut
// aussi venir d'un appelant qui construit sa propre fixture, cf. tests).
function stateAllKeys(state) {
  if (!state) return [];
  const out = [];
  if (state.active) out.push(state.active.key);
  if (state.launch) out.push(state.launch.key);
  for (const s of state.segments || []) out.push(s.key);
  return out.filter(Boolean);
}

// knownRepos(state?) -> noms de depots connus (D-4 §3) : dossiers de 1er niveau de la racine
// portant `.git` UNION les cles deja presentes dans l'etat replie de la session (segments, actif,
// lancement — le "depot de lancement" est TOUJOURS le 1er segment). `state` optionnel (issu de
// `foldChantier`, cf. `loadState`).
export function knownRepos(state) {
  const root = resolveRoot();
  const names = new Set();
  try {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      if (hasDotGit(join(root, entry.name))) names.add(entry.name);
    }
  } catch {
    /* racine absente : rien a scanner, les depots deja au registre restent connus */
  }
  for (const k of stateAllKeys(state)) {
    if (k.name && k.kind !== "portefeuille" && k.kind !== "hors") names.add(k.name);
  }
  return [...names];
}

// resolveRepoArg(token, opts) -> { key } | { ambiguous: true } | { unknown: true }.
// `token` = un NOM/chemin de depot a resoudre : la valeur BRUTE d'une directive de prompt (D-3,
// deja passee par `resolveDirectiveToken` de guard-core — "portefeuille" -> "@portefeuille"), la
// valeur d'une ligne `Chantier: <repo>` (D-6, dispatch), ou le `<repo>` d'un `iakaframe launch`
// (D-14) : soit "@portefeuille", soit un chemin absolu, soit un NOM de depot. `opts.requireExisting`
// (odin-direct, D-3) exige un dossier EXISTANT ; `opts.state` (etat replie) sert a detecter un nom
// AMBIGU (M-10 : deux depots de meme nom sous des racines DIFFERENTES — p. ex. un scanne sous la
// racine, l'autre connu via le depot de lancement d'une session ouverte ailleurs).
export function resolveRepoArg(token, opts) {
  const o = opts || {};
  const requireExisting = !!o.requireExisting;
  const root = resolveRoot();

  if (token === "@portefeuille") return { key: { kind: "portefeuille", root, name: "@portefeuille" } };

  if (isAbsolute(String(token))) {
    const key = keyOf(token, { state: o.state });
    // A3-8 (3e amendement, Q-H2) : un chemin HORS exige TOUJOURS un dossier EXISTANT et une
    // ancre non trop large (A3-9) — que la directive soit `chantier` (requireExisting=false,
    // souplesse ordinairement reservee a la creation de projet SOUS la racine) ou `odin-direct`
    // (requireExisting=true). Chemin inexistant, fichier, ou ancre trop large -> refus.
    if (key.kind === "hors") {
      let isDir = false;
      try {
        isDir = statSync(token).isDirectory();
      } catch {
        isDir = false;
      }
      if (!isDir) return { unknown: true };
      if (!key.root || isAnchorTooLarge(key.root)) return { unknown: true };
      return { key };
    }
    if (requireExisting && !existsSync(token)) return { unknown: true };
    return { key };
  }

  const name = String(token);
  const roots = new Set();
  const scanned = join(root, name);
  if (hasDotGit(scanned)) roots.add(resolve(scanned));
  for (const k of stateAllKeys(o.state)) {
    if (k.name === name && k.root) roots.add(resolve(k.root));
  }

  if (roots.size > 1) return { ambiguous: true };
  if (roots.size === 1) {
    const only = [...roots][0];
    if (requireExisting && !existsSync(only)) return { unknown: true };
    return { key: keyOf(only) };
  }
  // Aucun candidat connu : `chantier <nom>` sur un dossier INEXISTANT sous la racine est
  // accepte (cas de creation de projet, D-3) ; `odin-direct` l'exige existant -> refus.
  if (requireExisting) return { unknown: true };
  return { key: { kind: "dir", root: scanned, name } };
}

// ---------------------------------------------------------------------------
// D-8 — Exclusions (jamais attribuees, jamais bloquees).
// ---------------------------------------------------------------------------

function extraRoots() {
  const ALLOW_FILE = join(claudeDir(), "iakaframe-perimeter-allow.txt");
  try {
    return readFileSync(ALLOW_FILE, "utf8").split(/\r?\n/)
      .map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => resolve(l));
  } catch {
    return [];
  }
}

function isDevNullLike(p) {
  const s = String(p);
  return s === "/dev/null" || s === "$null" || s.toUpperCase() === "NUL";
}

// isExcluded(abs, payload) -> true si `abs` doit etre retire de `keys` (D-8) : scratchpad de
// session (champ CONDITIONNEL du payload), `os.tmpdir()`, `~/.claude/**` SAUF les chemins
// hors-limite D-9 (qui restent geres par `hardDeny`, jamais silencieusement exclus), racines
// `ALLOW_EXTRA`, et les alias de "null" (`/dev/null`, `NUL`, `$null`).
//
// Garde D-9 UNCONDITIONNELLE (jamais seulement dans la branche `~/.claude`) : D-9 est
// "hors-limite ABSOLU ... avant tout autre verdict" — un chemin hors-limite n'est JAMAIS traite
// comme "exclu" (silencieux), meme s'il tombe AUSSI sous `os.tmpdir()`/une racine `ALLOW_EXTRA`
// (cas degenere mais possible : un `$HOME` lui-meme niche sous le dossier temporaire de l'OS).
// Precede seulement par `isDevNullLike` (alias de "null", D-8) : les deux verifications sont
// disjointes en pratique (un alias "null" ne tombe jamais dans la zone D-9), l'ordre n'a donc
// aucun effet observable — mais D-9 reste verifie AVANT tout retour "exclu" ci-dessous.
export function isExcluded(abs, payload) {
  if (isDevNullLike(abs)) return true;
  if (hardDeny(abs).denied) return false;
  const norm = normalize(resolve(String(abs)));
  const under = (base) => isUnder(normalize(resolve(String(base))), norm, relative, isAbsolute);

  if (payload && payload.scratchpad_dir && under(payload.scratchpad_dir)) return true;
  if (under(tmpdir())) return true;
  if (under(claudeDir())) return true; // hors-limite deja exclu ci-dessus : le reste de ~/.claude est exclu
  for (const r of extraRoots()) if (under(r)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// D-9 — Hors-limite ABSOLU (DENY quel que soit l'acteur, avant tout autre verdict).
// ---------------------------------------------------------------------------

// hardDeny(abs) -> { denied, code } : la comparaison se fait sur la forme BRUTE resolue ET sur
// la forme NORMALISEE (M-12/realpath) — un chemin est hors-limite si L'UNE OU L'AUTRE tombe
// dans la zone (Q-C : ferme le cas `--link`/symlink de M-13).
export function hardDeny(abs) {
  const raw = resolve(String(abs));
  const norm = normalize(raw);
  const cDir = claudeDir();
  const settings = join(cDir, "settings.json");
  const allowFile = join(cDir, "iakaframe-perimeter-allow.txt");
  const hooksDir = join(cDir, "hooks");
  const sessDir = sessionsDir();

  const codeFor = (p) => {
    if (p === settings || p === allowFile) return "DENY_HARNESS";
    if (isUnder(hooksDir, p, relative, isAbsolute)) return "DENY_HARNESS";
    if (isUnder(sessDir, p, relative, isAbsolute)) return "DENY_REGISTRY";
    return null;
  };
  const code = codeFor(raw) || codeFor(norm);
  return code ? { denied: true, code } : { denied: false, code: null };
}

// ---------------------------------------------------------------------------
// D-10 — Panne interne : ouverte-mais-visible (jamais silencieuse).
// ---------------------------------------------------------------------------

// failOpen(sid, hook, err) -> { systemMessage } (Q6) : tente de journaliser un evenement
// `fail_open` au registre (best-effort, silencieux si le registre est illisible) et renvoie
// TOUJOURS le message a afficher (exit 0 cote appelant).
export function failOpen(sid, hook, err) {
  const raw = err && err.message != null ? err.message : err;
  const msg = String(raw == null ? "erreur inconnue" : raw).slice(0, 300);
  try {
    appendEvent(sid, { type: "fail_open", hook, error: msg });
  } catch {
    /* best-effort : le registre peut lui-meme etre la cause de la panne */
  }
  return { systemMessage: `[chantier-guard] FAIL-OPEN : ${hook} — ${msg}` };
}

// sessionShellHint(root, role, kind?) -> texte a proposer en tete de message de refus/rappel pour
// travailler DANS le bon depot (D-12, modele au § "Messages" de l'instruction) :
//   - `kind === "hors"` (3e amendement, A3-7) : Odin ne lance JAMAIS de session hors (`iakaframe
//     launch` exige un depot, D-14) -> commande shell DIRECTE, SANS `--agent` (une session
//     d'equipe hors depot serait `TEAM_NEEDS_REPO`), QUEL QUE SOIT le role ;
//   - role "odin" (autres `kind`) : le thread principal ne lance pas lui-meme de session -> il
//     propose de demander a Odin de lancer une session Aragorn dans `root` ;
//   - toute autre valeur (role "team", ou absent) : commande shell directe, adaptee a l'OS
//     courant, TOUJOURS avec `--agent aragorn` (une session lancee par ce hint est une session
//     d'equipe, jamais une session `odin`).
export function sessionShellHint(root, role, kind) {
  if (kind === "hors") {
    return process.platform === "win32" ? `Set-Location ${root} ; claude` : `cd ${root} && claude`;
  }
  if (role === "odin") return `demande a Odin de lancer une session Aragorn dans ${root}`;
  return process.platform === "win32"
    ? `Set-Location ${root} ; claude --agent aragorn`
    : `cd ${root} && claude --agent aragorn`;
}

// countFailOpens(sid) -> nombre d'evenements `fail_open` au registre (D-10 : "le prochain
// UserPromptSubmit rappelle le compte"). `foldChantier` ignore volontairement ce type
// d'evenement (aucun effet sur l'etat chantier) ; on relit donc le registre brut ici.
export function countFailOpens(sid) {
  const p = registryPath(sid);
  if (!p) return 0;
  let raw;
  try {
    raw = readFileSync(p, "utf8");
  } catch {
    return 0;
  }
  let n = 0;
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    try {
      const ev = JSON.parse(s);
      if (ev && ev.type === "fail_open") n++;
    } catch {
      /* ligne illisible : ignoree (D-1) */
    }
  }
  return n;
}
