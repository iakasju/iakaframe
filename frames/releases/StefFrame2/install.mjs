#!/usr/bin/env node
// install.mjs — installeur collision-aware de la conf iakaframe (§7-bis).
// Node pur, ZERO dependance (Node >= 20). Pose ~/.claude SANS jamais ecraser
// aveuglement : detecte l'existant, fusionne intelligemment par defaut, sauvegarde
// avant toute ecriture, ne touche JAMAIS aux donnees utilisateur hors categories gerees.
//
// Categories gerees : CLAUDE.md, settings.json, hooks/*.mjs, skills/*, agents/*.
// JAMAIS touche : projects/, todos/, history*, shell-snapshots/, statsig/, plugins/, ~/.iaka/.
//
// Flags : --merge (defaut) | --overwrite | --keep | --dry-run | --backup-dir <p>
//         | --yes | --target <dir>.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(HERE, 'kits', 'iakaframe-claude');
const BLOCK_START = '<!-- iakaframe:start -->';
const BLOCK_END = '<!-- iakaframe:end -->';

// --------------------------------------------------------------------------- args
function parseArgs(argv) {
  const o = { mode: 'merge', dryRun: false, yes: false, target: null, backupDir: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--merge') o.mode = 'merge';
    else if (a === '--overwrite') o.mode = 'overwrite';
    else if (a === '--keep') o.mode = 'keep';
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--yes') o.yes = true;
    else if (a === '--target') o.target = argv[++i];
    else if (a === '--backup-dir') o.backupDir = argv[++i];
    else if (a === '-h' || a === '--help') o.help = true;
  }
  return o;
}

const HELP = `iakaframe — installeur collision-aware

Usage : node install.mjs [options]

  --dry-run          Affiche le plan par categorie, n'ecrit RIEN, aucun backup.
  --merge            (defaut) Fusion sure : garde l'existant sur conflit.
  --overwrite        Sur collision : ecraser (apres backup).
  --keep             Sur collision : garder l'existant (skip).
  --backup-dir <p>   Dossier de backup explicite.
  --yes              Non-interactif (applique le mode choisi).
  --target <dir>     Cible (defaut : ~/.claude).
  -h, --help         Cette aide.
`;

// --------------------------------------------------------------------------- utils
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function readIfExists(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

function ask(rl, q) { return new Promise((res) => rl.question(q, (a) => res(a.trim()))); }

// --------------------------------------------------------------------------- settings merge
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

// --------------------------------------------------------------------------- backup (lazy)
function makeBackup(state) {
  if (!state.backupRoot) {
    state.backupRoot = state.opts.backupDir || path.join(state.target, `.iakaframe-backup-${Date.now()}`);
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

// --------------------------------------------------------------------------- planners
// Chaque planner retourne { category, items:[{ name, status, action, note, apply(state) }] }
// status : 'add' | 'update' | 'noop' | 'collision'   action : ce qui sera fait selon le mode.

function planClaudeMd(state) {
  const srcContent = readIfExists(path.join(KIT, 'global', 'CLAUDE.md')) || '';
  const block = `${BLOCK_START}\n${srcContent.trim()}\n${BLOCK_END}\n`;
  const tgtPath = path.join(state.target, 'CLAUDE.md');
  const cur = readIfExists(tgtPath);
  const items = [];

  const writeWrapped = () => { fs.mkdirSync(state.target, { recursive: true }); fs.writeFileSync(tgtPath, block, 'utf8'); };

  if (cur == null) {
    items.push({ name: 'CLAUDE.md', status: 'add', action: 'ajout du bloc iakaframe',
      apply: () => writeWrapped() });
  } else {
    const hasBlock = cur.includes(BLOCK_START) && cur.includes(BLOCK_END);
    let merged;
    if (hasBlock) {
      merged = cur.replace(new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}`), block.trim());
    } else {
      merged = cur.replace(/\s*$/, '') + `\n\n${block}`;
    }
    const mergeNoop = merged === cur;
    items.push({
      name: 'CLAUDE.md',
      status: 'collision',
      resolve: (mode) => {
        if (mode === 'keep') return { action: 'garder (inchange)', apply: () => {} };
        if (mode === 'overwrite') return { action: 'ecraser (bloc iakaframe)', apply: () => { backupRel(state, 'CLAUDE.md'); writeWrapped(); } };
        // merge
        if (mergeNoop) return { action: 'a jour (rien a changer)', apply: () => {} };
        return { action: hasBlock ? 'fusion : maj du bloc' : 'fusion : ajout du bloc en fin', apply: () => { backupRel(state, 'CLAUDE.md'); fs.writeFileSync(tgtPath, merged, 'utf8'); } };
      },
    });
  }
  return { category: 'Contrat global', items };
}

function planSettings(state) {
  const srcRaw = readIfExists(path.join(KIT, 'global', 'settings.example.json')) || '{}';
  const src = stripComments(JSON.parse(srcRaw));
  const tgtPath = path.join(state.target, 'settings.json');
  const curRaw = readIfExists(tgtPath);
  const items = [];
  const writePretty = (obj) => { fs.mkdirSync(state.target, { recursive: true }); fs.writeFileSync(tgtPath, JSON.stringify(obj, null, 2) + '\n', 'utf8'); };

  if (curRaw == null) {
    items.push({ name: 'settings.json', status: 'add', action: 'ajout (hooks iakaframe)', apply: () => writePretty(src) });
    return { category: 'Reglages', items };
  }
  let cur; let invalid = false;
  try { cur = JSON.parse(curRaw); } catch { invalid = true; }
  if (invalid) {
    items.push({
      name: 'settings.json', status: 'collision', note: 'JSON existant INVALIDE',
      resolve: (mode) => {
        if (mode === 'overwrite') return { action: 'ecraser (existant invalide sauvegarde)', apply: () => { backupRel(state, 'settings.json'); writePretty(src); } };
        // merge impossible sur JSON invalide -> on GARDE, on sauvegarde, on avertit
        return { action: 'JSON invalide -> garde + sauvegarde + avertissement', apply: () => { backupRel(state, 'settings.json'); process.stderr.write('[install] settings.json invalide : non fusionne, sauvegarde faite. Utilisez --overwrite pour remplacer.\n'); } };
      },
    });
    return { category: 'Reglages', items };
  }
  const merged = deepMerge(cur, src);
  const noop = deepEqual(merged, cur);
  items.push({
    name: 'settings.json', status: 'collision',
    resolve: (mode) => {
      if (mode === 'keep') return { action: 'garder (inchange)', apply: () => {} };
      if (mode === 'overwrite') return { action: 'ecraser (hooks iakaframe)', apply: () => { backupRel(state, 'settings.json'); writePretty(src); } };
      if (noop) return { action: 'a jour (rien a changer)', apply: () => {} };
      return { action: 'fusion : ajout des entrees hooks manquantes (garde l existant)', apply: () => { backupRel(state, 'settings.json'); writePretty(merged); } };
    },
  });
  return { category: 'Reglages', items };
}

// file-set (hooks) / dir-set (skills) / file-set (agents) : additif ; collision -> defaut garder.
function planNamedSet(state, category, srcDir, tgtSub, filter) {
  const items = [];
  let names = [];
  try { names = fs.readdirSync(srcDir).filter(filter).sort(); } catch { names = []; }
  for (const name of names) {
    const srcPath = path.join(srcDir, name);
    const rel = path.join(tgtSub, name);
    const tgtPath = path.join(state.target, rel);
    const copy = () => { fs.mkdirSync(path.dirname(tgtPath), { recursive: true }); fs.cpSync(srcPath, tgtPath, { recursive: true }); };
    if (!exists(tgtPath)) {
      items.push({ name, status: 'add', action: 'ajout', apply: () => copy() });
    } else {
      items.push({
        name, status: 'collision',
        resolve: (mode) => {
          if (mode === 'overwrite') return { action: 'ecraser (apres backup)', apply: () => { backupRel(state, rel); fs.rmSync(tgtPath, { recursive: true, force: true }); copy(); } };
          return { action: 'garder l existant (skip)', apply: () => {} }; // merge + keep = garder
        },
      });
    }
  }
  return { category, items };
}

// --------------------------------------------------------------------------- run
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { process.stdout.write(HELP); return; }
  const target = path.resolve(opts.target || path.join(os.homedir(), '.claude'));
  const state = { opts, target, backupRoot: null, backupCreated: false };

  const plans = [
    planClaudeMd(state),
    planSettings(state),
    planNamedSet(state, 'Hooks', path.join(KIT, 'global', 'hooks'), 'hooks', (n) => n.endsWith('.mjs')),
    planNamedSet(state, 'Skills', path.join(KIT, '.claude', 'skills'), 'skills', (n) => !n.startsWith('.')),
    planNamedSet(state, 'Agents', path.join(KIT, '.claude', 'agents'), 'agents', (n) => n.endsWith('.md')),
  ];

  process.stdout.write(`\n== iakaframe — installeur ==\nCible : ${target}\nMode  : ${opts.mode}${opts.dryRun ? '  (dry-run : rien ne sera ecrit)' : ''}\n`);

  // Resolution de l'action de chaque item (collisions : interactif ou mode).
  const interactive = !opts.dryRun && !opts.yes && process.stdin.isTTY;
  let rl = null;
  if (interactive) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const catChoice = {}; // raccourci "toute la categorie"

  for (const plan of plans) {
    process.stdout.write(`\n[${plan.category}]\n`);
    if (plan.items.length === 0) { process.stdout.write('  (rien a poser)\n'); continue; }
    for (const it of plan.items) {
      if (it.status === 'add') { process.stdout.write(`  + ${it.name} — ${it.action}\n`); it._todo = it; continue; }
      // collision
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

  if (opts.dryRun) { process.stdout.write('\n(dry-run) Aucun fichier ecrit, aucun backup cree.\n'); return; }

  // Execution.
  for (const plan of plans) for (const it of plan.items) { try { it._todo && it._todo.apply(); } catch (e) { process.stderr.write(`[install] echec ${it.name} : ${e.message}\n`); } }

  if (state.backupCreated) process.stdout.write(`\nBackup : ${state.backupRoot}\n`);
  process.stdout.write('Termine. (donnees hors categories gerees : intactes)\n');
}

main().catch((e) => { process.stderr.write(`[install] erreur : ${e.stack || e}\n`); process.exit(1); });
