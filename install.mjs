#!/usr/bin/env node
// install.mjs — installeur MULTI-HOST collision-aware de la conf iakaframe (§5bis, Lot C1).
// Node pur, ZERO dependance (Node >= 20). SOURCE de l'installeur multi-host : vit a la RACINE
// du depot, a cote de kits/ — exactement la ou il atterrit a la racine d'une frame assemblee
// (frame = snapshot de la racine). La frame figee frames/releases/StefFrame2/install.mjs est la
// REFERENCE de logique (claude-only) ; on l'ETEND ici en fan-out sans toucher a la frame.
//
// Principe (§5bis.1) : installer la frame = un BUNDLE MULTI-HOST → deployer le kit de CHAQUE
// host present parmi {claude, codex, openwebui} dans le dir de config de ce host. Strategie par
// defaut = COPIE fan-out (deterministe, cross-OS). Les liens (--link) sont une EVOLUTION opt-in
// PAR ELEMENT avec repli COPIE automatique (Codex ne suit pas les liens, Windows KO). OpenWebUI
// n'est JAMAIS une copie de fichier de config : ses Functions vivent en base (webui.db) →
// install = IMPORT admin/API (ici : bundle d'import stage). ollama/anythingllm ne sont JAMAIS
// des hosts (aucun mapping) — demander a les installer = refus documente.
//
// Categories gerees, par host :
//   claude : CLAUDE.md (merge bloc) · settings.json (merge JSON) · hooks/*.mjs · commands/* ·
//            skills/* · agents/*.md   (cible defaut : ~/.claude)
//   codex  : AGENTS.md (merge bloc) · hooks.json (merge JSON) · hooks/*.mjs
//            (cible defaut : ~/.codex)   [experimental, non-Windows]
//   openwebui : Functions (import admin/API) + Models — bundle d'import STAGE (jamais copie
//            dans un dir de config, jamais lie). Detecte via --target-openwebui (point ouvert
//            §5bis.6 : pas de dir local fiable, souvent conteneurise).
//
// JAMAIS touche (hors categories gerees) : projects/, todos/, history*, shell-snapshots/,
// statsig/, plugins/, ~/.iaka/, sessions/, etc.
//
// Flags : --merge (defaut) | --overwrite | --keep | --dry-run | --backup-dir <p> | --yes
//         | --hosts <csv>            (restreint aux hosts listes ; sinon detection auto)
//         | --target <dir>           (LEGACY : mode claude-only historique dans <dir>)
//         | --target-claude <dir> | --target-codex <dir> | --target-openwebui <dir>
//         | --kits-dir <dir>         (racine des kits ; defaut : ./kits a cote de ce fichier)
//         | --link                   (opt-in : lie PAR ELEMENT, repli copie auto)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLOCK_START = '<!-- iakaframe:start -->';
const BLOCK_END = '<!-- iakaframe:end -->';

// Hosts = points d'entree = SEULES cibles d'installation (§ 1/§ 6.2).
const HOST_KINDS = ['claude', 'codex', 'openwebui'];
// Jamais des hosts (§ 5bis.3) : ollama = cible d'execution de persona ; anythingllm = abandonne.
const NON_HOST_KINDS = ['ollama', 'ollama-local', 'ollama-distant', 'ollama-localhost', 'ollama-lan', 'anythingllm', 'chatgpt', 'litellm'];

// Nom de dossier de kit pour un host (kits/iakaframe-<host>). Choix ASSUME cote installeur
// standalone — RECTIFIE (COMMENTAIRE-FAUX-INSTALL-MJS-50, 2026-09-04) : la premisse « la frame
// embarque install.mjs SANS cli/ » etait DEJA FAUSSE depuis le 2026-07-18 (frames/releases/
// StefFrame2/cli/package.json existe) et BUNDLE-INSTALL-MJS-ABSENT vient d'ajouter un TROISIEME
// emplacement (cli/_bundled/install.mjs, A COTE d'un cli/ bien present). La premisse JUSTE, qui ne
// peut plus etre demente par une mesure : install.mjs doit tourner depuis N'IMPORTE QUEL
// emplacement — racine de depot, racine de frame, ou cli/_bundled/ — SANS JAMAIS supposer un cli/
// voisin. La decision, elle, ne change pas : pas d'import de cli/src/lib/vocab.js.
const kitDirName = (host) => `iakaframe-${host}`;

// Cible de config par defaut, par host. openwebui = null : pas de dir local fiable (conteneurise)
// → present uniquement via --target-openwebui explicite (§ 5bis.6, point ouvert).
const DEFAULT_TARGET = {
  claude: path.join(os.homedir(), '.claude'),
  codex: path.join(os.homedir(), '.codex'),
  openwebui: null,
};

// Suivi fiable des liens par host (§ 5bis.4). false ⇒ --link retombe en COPIE.
const LINK_SAFE = { claude: true, codex: false, openwebui: false };

// --------------------------------------------------------------------------- args
function parseArgs(argv) {
  const o = {
    mode: 'merge', dryRun: false, yes: false, help: false, link: false,
    target: null, backupDir: null, kitsDir: null, hosts: null,
    targets: { claude: null, codex: null, openwebui: null },
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--merge') o.mode = 'merge';
    else if (a === '--overwrite') o.mode = 'overwrite';
    else if (a === '--keep') o.mode = 'keep';
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--yes') o.yes = true;
    else if (a === '--link') o.link = true;
    else if (a === '--target') o.target = argv[++i];
    else if (a === '--backup-dir') o.backupDir = argv[++i];
    else if (a === '--kits-dir') o.kitsDir = argv[++i];
    else if (a === '--hosts') o.hosts = String(argv[++i] || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    else if (a === '--target-claude') o.targets.claude = argv[++i];
    else if (a === '--target-codex') o.targets.codex = argv[++i];
    else if (a === '--target-openwebui') o.targets.openwebui = argv[++i];
    else if (a === '-h' || a === '--help') o.help = true;
  }
  return o;
}

const HELP = `iakaframe — installeur multi-host collision-aware (fan-out)

Usage : node install.mjs [options]

  --dry-run              Affiche le plan PAR HOST, n'ecrit RIEN, aucun backup.
  --merge                (defaut) Fusion sure : garde l'existant sur conflit.
  --overwrite            Sur collision : ecraser (apres backup).
  --keep                 Sur collision : garder l'existant (skip).
  --hosts <csv>          Restreint aux hosts listes (claude,codex,openwebui). Sinon detection.
  --link                 (opt-in) Lie PAR ELEMENT ; repli COPIE auto (Codex/Windows).
  --backup-dir <p>       Racine de backup (nichee par host).
  --yes                  Non-interactif (applique le mode choisi).
  --target <dir>         LEGACY : mode claude-only historique dans <dir> (non-regression).
  --target-claude <dir>  Cible explicite host claude (defaut : ~/.claude).
  --target-codex <dir>   Cible explicite host codex (defaut : ~/.codex).
  --target-openwebui <d> Cible/bundle d'import OpenWebUI (import admin/API ; pas de copie config).
  --kits-dir <dir>       Racine des kits (defaut : ./kits a cote de install.mjs).
  -h, --help             Cette aide.

Hosts SEULS = cibles d'installation. ollama/anythingllm ne sont JAMAIS des hosts (refus).
`;

// --------------------------------------------------------------------------- utils
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function readIfExists(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function ask(rl, q) { return new Promise((res) => rl.question(q, (a) => res(a.trim()))); }

// Detection d'un binaire dans le PATH (repli si pas de --target explicite ni dir par defaut).
function hasBinary(names) {
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];
  const dirs = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const name of names) for (const d of dirs) for (const ext of exts) {
    if (exists(path.join(d, name + ext))) return true;
  }
  return false;
}
const HOST_BINARIES = { claude: ['claude'], codex: ['codex'], openwebui: [] };

// --------------------------------------------------------------------------- settings/JSON merge
function stripComments(obj) {
  if (!isObj(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (!k.startsWith('//')) out[k] = v;
  return out;
}
function mergeHooks(tgt = {}, src = {}) {
  const out = JSON.parse(JSON.stringify(tgt));
  for (const [event, groups] of Object.entries(src)) {
    out[event] = out[event] || [];
    for (const g of groups) {
      const matcher = g.matcher ?? undefined;
      let tg = out[event].find((x) => (x.matcher ?? undefined) === matcher);
      if (!tg) { tg = matcher === undefined ? { hooks: [] } : { matcher, hooks: [] }; out[event].push(tg); }
      tg.hooks = tg.hooks || [];
      for (const h of (g.hooks || [])) {
        if (!tg.hooks.some((x) => x.type === h.type && x.command === h.command)) tg.hooks.push(h);
      }
    }
  }
  return out;
}
// Additif : ajoute les manquants ; sur conflit scalaire GARDE l'existant ; hooks = union par triplet.
function deepMerge(tgt, src) {
  const out = isObj(tgt) ? { ...tgt } : {};
  for (const [k, v] of Object.entries(src)) {
    if (k === 'hooks') { out.hooks = mergeHooks(isObj(tgt) ? tgt.hooks : {}, v); continue; }
    if (!(k in out)) out[k] = v;
    else if (isObj(out[k]) && isObj(v)) out[k] = deepMerge(out[k], v);
    // conflit scalaire / type -> on garde l'existant (out[k] inchange)
  }
  return out;
}

// --------------------------------------------------------------------------- backup (lazy, PAR HOST)
function makeBackup(state) {
  if (!state.backupRoot) {
    // backup PAR HOST : racine propre a l'host, jamais partagee entre hosts.
    state.backupRoot = state.opts.backupDir
      ? path.join(state.opts.backupDir, state.host)
      : path.join(state.target, `.iakaframe-backup-${state.stamp}`);
  }
  if (!state.backupCreated) { fs.mkdirSync(state.backupRoot, { recursive: true }); state.backupCreated = true; }
  return state.backupRoot;
}
function backupRel(state, rel) {
  const src = path.join(state.target, rel);
  if (!exists(src)) return;
  const dst = path.join(makeBackup(state), rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

// --------------------------------------------------------------------------- planners (parametres)
// Chaque planner retourne { category, items:[{ name, status, action?, resolve?, apply? }] }.

// Contrat markdown (CLAUDE.md / AGENTS.md) : merge par bloc iakaframe:start/end. JAMAIS lie.
function planContract(state, { file, srcRel }) {
  const srcContent = readIfExists(path.join(state.kitDir, srcRel)) || '';
  const block = `${BLOCK_START}\n${srcContent.trim()}\n${BLOCK_END}\n`;
  const tgtPath = path.join(state.target, file);
  const cur = readIfExists(tgtPath);
  const items = [];
  const writeWrapped = () => { fs.mkdirSync(state.target, { recursive: true }); fs.writeFileSync(tgtPath, block, 'utf8'); };

  if (srcContent.trim() === '') return { category: `Contrat (${file})`, items };
  if (cur == null) {
    items.push({ name: file, status: 'add', action: 'ajout du bloc iakaframe', apply: () => writeWrapped() });
  } else {
    const hasBlock = cur.includes(BLOCK_START) && cur.includes(BLOCK_END);
    let merged;
    if (hasBlock) merged = cur.replace(new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}`), block.trim());
    else merged = cur.replace(/\s*$/, '') + `\n\n${block}`;
    const mergeNoop = merged === cur;
    items.push({
      name: file, status: 'collision',
      resolve: (mode) => {
        if (mode === 'keep') return { action: 'garder (inchange)', apply: () => {} };
        if (mode === 'overwrite') return { action: 'ecraser (bloc iakaframe)', apply: () => { backupRel(state, file); writeWrapped(); } };
        if (mergeNoop) return { action: 'a jour (rien a changer)', apply: () => {} };
        return { action: hasBlock ? 'fusion : maj du bloc' : 'fusion : ajout du bloc en fin', apply: () => { backupRel(state, file); fs.writeFileSync(tgtPath, merged, 'utf8'); } };
      },
    });
  }
  return { category: `Contrat (${file})`, items };
}

// Reglages JSON (settings.json / hooks.json) : deepMerge additif. JAMAIS lie.
function planJsonMerge(state, { file, srcRel }) {
  const category = `Reglages (${file})`;
  const srcRaw = readIfExists(path.join(state.kitDir, srcRel));
  if (srcRaw == null) return { category, items: [] };
  let src;
  try { src = stripComments(JSON.parse(srcRaw)); } catch { return { category, items: [] }; }
  const tgtPath = path.join(state.target, file);
  const curRaw = readIfExists(tgtPath);
  const items = [];
  const writePretty = (obj) => { fs.mkdirSync(state.target, { recursive: true }); fs.writeFileSync(tgtPath, JSON.stringify(obj, null, 2) + '\n', 'utf8'); };

  if (curRaw == null) {
    items.push({ name: file, status: 'add', action: 'ajout (hooks iakaframe)', apply: () => writePretty(src) });
    return { category, items };
  }
  let cur; let invalid = false;
  try { cur = JSON.parse(curRaw); } catch { invalid = true; }
  if (invalid) {
    items.push({
      name: file, status: 'collision', note: 'JSON existant INVALIDE',
      resolve: (mode) => {
        if (mode === 'overwrite') return { action: 'ecraser (existant invalide sauvegarde)', apply: () => { backupRel(state, file); writePretty(src); } };
        return { action: 'JSON invalide -> garde + sauvegarde + avertissement', apply: () => { backupRel(state, file); process.stderr.write(`[install] ${file} invalide : non fusionne, sauvegarde faite. Utilisez --overwrite.\n`); } };
      },
    });
    return { category, items };
  }
  const merged = deepMerge(cur, src);
  const noop = deepEqual(merged, cur);
  items.push({
    name: file, status: 'collision',
    resolve: (mode) => {
      if (mode === 'keep') return { action: 'garder (inchange)', apply: () => {} };
      if (mode === 'overwrite') return { action: 'ecraser (hooks iakaframe)', apply: () => { backupRel(state, file); writePretty(src); } };
      if (noop) return { action: 'a jour (rien a changer)', apply: () => {} };
      return { action: 'fusion : ajout des entrees hooks manquantes (garde l existant)', apply: () => { backupRel(state, file); writePretty(merged); } };
    },
  });
  return { category, items };
}

// Named-set (hooks / commands / skills / agents) : additif ; collision -> defaut garder.
// COPIE par defaut ; sous --link (host link-safe, hors Windows) : symlink PAR ELEMENT + repli copie.
function planNamedSet(state, category, srcRel, tgtSub, filter) {
  const srcDir = path.join(state.kitDir, srcRel);
  const items = [];
  let names = [];
  try { names = fs.readdirSync(srcDir).filter(filter).sort(); } catch { names = []; }
  const linkMode = state.opts.link && LINK_SAFE[state.host] && process.platform !== 'win32';
  const linkFallback = state.opts.link && !linkMode; // --link demande mais non suivi -> repli copie

  for (const name of names) {
    const srcPath = path.join(srcDir, name);
    const rel = path.join(tgtSub, name);
    const tgtPath = path.join(state.target, rel);
    const copy = () => { fs.mkdirSync(path.dirname(tgtPath), { recursive: true }); fs.cpSync(srcPath, tgtPath, { recursive: true }); };
    const link = () => {
      fs.mkdirSync(path.dirname(tgtPath), { recursive: true });
      try { fs.symlinkSync(srcPath, tgtPath, isDir(srcPath) ? 'dir' : 'file'); }
      catch { copy(); } // repli copie si le lien echoue (droits, FS)
    };
    const addAction = linkMode ? 'lien (par element)' : (linkFallback ? 'copie (repli : lien non suivi)' : 'ajout');
    const put = linkMode ? link : copy;

    if (!exists(tgtPath) && !isSymlink(tgtPath)) {
      items.push({ name, status: 'add', action: addAction, apply: () => put() });
    } else {
      items.push({
        name, status: 'collision',
        resolve: (mode) => {
          if (mode === 'overwrite') return { action: 'ecraser (apres backup)', apply: () => { backupRel(state, rel); fs.rmSync(tgtPath, { recursive: true, force: true }); put(); } };
          return { action: 'garder l existant (skip)', apply: () => {} }; // merge + keep = garder
        },
      });
    }
  }
  return { category, items };
}
function isSymlink(p) { try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; } }

// OpenWebUI : IMPORT admin/API. Les Functions vivent en base (webui.db) → JAMAIS de copie dans un
// dir de config, JAMAIS de lien/mount. Ici : on STAGE un bundle d'import (functions/*.py + models/
// *.json) dans --target-openwebui, a importer ensuite via l'admin/API OWUI (cf. Lot A2).
function planOwuiImport(state) {
  const category = 'OpenWebUI (import admin/API)';
  const bundleDir = state.target; // --target-openwebui = destination du bundle d'import
  const items = [];
  const sets = [
    { sub: 'functions', srcRel: 'functions', filter: (n) => n.endsWith('.py') && !n.startsWith('test_') },
    { sub: 'models', srcRel: 'models', filter: (n) => n.endsWith('.json') },
  ];
  for (const s of sets) {
    const srcDir = path.join(state.kitDir, s.srcRel);
    let names = [];
    try { names = fs.readdirSync(srcDir).filter(s.filter).sort(); } catch { names = []; }
    for (const name of names) {
      const srcPath = path.join(srcDir, name);
      const rel = path.join(s.sub, name);
      const tgtPath = path.join(bundleDir, rel);
      const stage = () => { fs.mkdirSync(path.dirname(tgtPath), { recursive: true }); fs.cpSync(srcPath, tgtPath, { recursive: true }); };
      const cur = readIfExists(tgtPath);
      const src = readIfExists(srcPath);
      if (cur == null) items.push({ name: rel, status: 'add', action: 'bundle import (a importer via admin/API)', apply: () => stage() });
      else if (cur === src) items.push({ name: rel, status: 'collision', resolve: () => ({ action: 'a jour (rien a changer)', apply: () => {} }) });
      else items.push({
        name: rel, status: 'collision',
        resolve: (mode) => {
          if (mode === 'overwrite') return { action: 'restager (apres backup)', apply: () => { backupRel(state, rel); stage(); } };
          return { action: 'garder l existant (skip)', apply: () => {} };
        },
      });
    }
  }
  if (items.length) items.push({ name: '(note)', status: 'note', action: `bundle stage dans ${bundleDir} — importer via OWUI admin/API (Functions en base webui.db)`, apply: () => {} });
  return { category, items };
}

// --------------------------------------------------------------------------- plan par host
function buildHostPlans(state) {
  const host = state.host;
  if (host === 'claude') {
    return [
      planContract(state, { file: 'CLAUDE.md', srcRel: path.join('global', 'CLAUDE.md') }),
      planJsonMerge(state, { file: 'settings.json', srcRel: path.join('global', 'settings.example.json') }),
      planNamedSet(state, 'Hooks', path.join('global', 'hooks'), 'hooks', (n) => n.endsWith('.mjs')),
      planNamedSet(state, 'Commands', path.join('.claude', 'commands'), 'commands', (n) => n.endsWith('.md')),
      planNamedSet(state, 'Skills', path.join('.claude', 'skills'), 'skills', (n) => !n.startsWith('.')),
      planNamedSet(state, 'Agents', path.join('.claude', 'agents'), 'agents', (n) => n.endsWith('.md')),
    ];
  }
  if (host === 'codex') {
    return [
      planContract(state, { file: 'AGENTS.md', srcRel: 'AGENTS.md' }),
      planJsonMerge(state, { file: 'hooks.json', srcRel: path.join('global', 'hooks', 'hooks.example.json') }),
      planNamedSet(state, 'Hooks', path.join('global', 'hooks'), 'hooks', (n) => n.endsWith('.mjs')),
    ];
  }
  if (host === 'openwebui') {
    return [planOwuiImport(state)];
  }
  return [];
}

// --------------------------------------------------------------------------- resolution/execution d'un host
async function runHost(host, opts, kitsDir, stamp) {
  const target = path.resolve(opts.targets[host] || opts.target || DEFAULT_TARGET[host]);
  const kitDir = path.join(kitsDir, kitDirName(host));
  const state = { opts, host, target, kitDir, stamp, backupRoot: null, backupCreated: false };

  process.stdout.write(`\n================ host: ${host} ================\nKit   : ${kitDir}\nCible : ${target}\nMode  : ${opts.mode}${opts.link ? ' +link' : ''}${opts.dryRun ? '  (dry-run : rien ne sera ecrit)' : ''}\n`);
  if (!isDir(kitDir)) { process.stdout.write(`  ! kit introuvable (${kitDir}) — host ignore\n`); return { host, wrote: false, backup: null }; }

  const plans = buildHostPlans(state);
  const interactive = !opts.dryRun && !opts.yes && process.stdin.isTTY;
  let rl = null;
  if (interactive) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const catChoice = {};

  for (const plan of plans) {
    process.stdout.write(`\n[${plan.category}]\n`);
    if (plan.items.length === 0) { process.stdout.write('  (rien a poser)\n'); continue; }
    for (const it of plan.items) {
      if (it.status === 'note') { process.stdout.write(`  i ${it.action}\n`); it._todo = it; continue; }
      if (it.status === 'add') { process.stdout.write(`  + ${it.name} — ${it.action}\n`); it._todo = it; continue; }
      let mode = opts.mode;
      if (interactive) {
        if (catChoice[plan.category]) mode = catChoice[plan.category];
        else {
          const ans = await ask(rl, `  ? ${it.name} en collision — [f]usionner/[e]craser/[g]arder (majuscule = toute la categorie) : `);
          const m = { f: 'merge', e: 'overwrite', g: 'keep' }[ans.toLowerCase()] || 'merge';
          if (ans === ans.toUpperCase() && ans) catChoice[plan.category] = m;
          mode = m;
        }
      }
      const res = it.resolve(mode);
      const sign = res.action.startsWith('a jour') || res.action.startsWith('garder') ? '=' : '~';
      process.stdout.write(`  ${sign} ${it.name} — ${res.action}\n`);
      it._todo = { apply: res.apply };
    }
  }
  if (rl) rl.close();

  if (opts.dryRun) { process.stdout.write(`  (dry-run) host ${host} : aucun fichier ecrit, aucun backup.\n`); return { host, wrote: false, backup: null }; }

  for (const plan of plans) for (const it of plan.items) { try { it._todo && it._todo.apply(); } catch (e) { process.stderr.write(`[install] echec ${host}/${it.name} : ${e.message}\n`); } }
  if (state.backupCreated) process.stdout.write(`  Backup (${host}) : ${state.backupRoot}\n`);
  return { host, wrote: true, backup: state.backupCreated ? state.backupRoot : null };
}

// --------------------------------------------------------------------------- detection des hosts presents
function hostPresent(host, opts) {
  if (opts.targets[host]) return { present: true, why: `--target-${host}` };          // intention explicite
  const def = DEFAULT_TARGET[host];
  if (def && isDir(def)) return { present: true, why: `dir ${def}` };                  // dir de config existant
  if (hasBinary(HOST_BINARIES[host] || [])) return { present: true, why: 'binaire PATH' };
  return { present: false, why: null };
}

// --------------------------------------------------------------------------- run
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { process.stdout.write(HELP); return; }
  const kitsDir = path.resolve(opts.kitsDir || path.join(HERE, 'kits'));
  const stamp = String(Date.now());

  process.stdout.write(`\n== iakaframe — installeur multi-host (fan-out) ==\nKits  : ${kitsDir}\n`);

  // Mode LEGACY claude-only : --target <dir> sans --target-<host> ⇒ historique (non-regression).
  const legacyClaudeOnly = opts.target && !opts.targets.claude && !opts.targets.codex && !opts.targets.openwebui && !opts.hosts;
  let candidates = opts.hosts || HOST_KINDS;
  if (legacyClaudeOnly) candidates = ['claude'];

  // Refus documente des non-hosts (ollama / anythingllm / runners) demandes explicitement.
  for (const c of candidates) {
    if (NON_HOST_KINDS.includes(c)) {
      process.stdout.write(`\n[refus] '${c}' n'est PAS un host (cible d'execution de persona ou abandonne) — aucun mapping d'installation. Ignore.\n`);
    }
  }
  candidates = candidates.filter((c) => HOST_KINDS.includes(c));

  const results = [];
  for (const host of candidates) {
    if (legacyClaudeOnly) { results.push(await runHost(host, opts, kitsDir, stamp)); continue; }
    const det = hostPresent(host, opts);
    if (!det.present) { process.stdout.write(`\n---- host: ${host} — ABSENT (aucune detection) — ignore ----\n`); continue; }
    process.stdout.write(`\n---- host: ${host} — present (${det.why}) ----`);
    results.push(await runHost(host, opts, kitsDir, stamp));
  }

  const posed = results.filter((r) => r.wrote).map((r) => r.host);
  process.stdout.write(`\n== Termine ==\nHosts traites : ${posed.length ? posed.join(', ') : '(aucun)'}\n`);
  if (opts.dryRun) process.stdout.write('(dry-run) Aucun fichier ecrit, aucun backup cree.\n');
  const backups = results.filter((r) => r.backup).map((r) => `${r.host}:${r.backup}`);
  if (backups.length) process.stdout.write(`Backups : ${backups.join('  ')}\n`);
}

main().catch((e) => { process.stderr.write(`[install] erreur : ${e.stack || e}\n`); process.exit(1); });
