// iakaframe go - lance l'action d'un projet via son runner (enum claude-code|ollama|litellm|codex
// + launchers legacy aider/iakaide), inline. Le runner vient de <projet>/iakaframe.json (surcharge
// --runner). Les valeurs legacy (ps/iakaide) sont normalisees via la table d'alias. Cross-OS.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { resolveRoot } from '../lib/root.js';
import { hasCmd } from '../lib/which.js';
import { printBanner, DEFAULT_FONT } from '../lib/banner.js';
import { normalizeRunner } from '../lib/vocab.js';
import { brief } from './brief.js';

function launchCli(cmd, dir, task) {
  const safe = task ? task.replace(/["`$;|&<>\r\n]/g, ' ').trim() : '';
  console.log(`-> ${cmd}${safe ? ` "${safe}"` : ''}  (dans ${dir})`);
  if (process.platform === 'win32') {
    return spawnSync(safe ? `${cmd} "${safe}"` : cmd, { cwd: dir, stdio: 'inherit', shell: true });
  }
  return spawnSync(cmd, safe ? [safe] : [], { cwd: dir, stdio: 'inherit' });
}

// Construit les args d'aider (fonction pure, testable). --no-auto-commits : iakaframe
// garde la main sur le git. Avec une tache -> one-shot (--yes --message), sinon interactif.
export function aiderArgs({ task = '', model = '' } = {}) {
  const safe = task ? task.replace(/["`$;|&<>\r\n]/g, ' ').trim() : '';
  const args = ['--no-auto-commits'];
  if (model) args.push('--model', model);
  if (safe) args.push('--yes', '--message', safe);
  return args;
}

function launchAider(dir, args) {
  console.log(`-> aider ${args.join(' ')}  (dans ${dir})`);
  if (process.platform === 'win32') {
    const str = 'aider ' + args.map(a => (/\s/.test(a) ? `"${a}"` : a)).join(' ');
    return spawnSync(str, { cwd: dir, stdio: 'inherit', shell: true });
  }
  return spawnSync('aider', args, { cwd: dir, stdio: 'inherit' });
}

function iakaideBinary(root) {
  const dir = path.join(root, 'iakaide', 'src-tauri', 'target', 'release');
  try {
    if (!fs.existsSync(dir)) return null;
    const ext = process.platform === 'win32' ? '.exe' : '';
    const hit = fs.readdirSync(dir).find(f => (ext ? f.endsWith(ext) : !path.extname(f)) && !/build|deps/.test(f));
    return hit ? path.join(dir, hit) : null;
  } catch { return null; }
}

export function runGo(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: { project: { type: 'string' }, path: { type: 'string' }, runner: { type: 'string' }, do: { type: 'string' }, root: { type: 'string' } },
  });

  const root = resolveRoot(values.root);
  let dir;
  if (values.path) dir = path.resolve(values.path);
  else {
    const name = values.project || positionals[0];
    if (!name) { console.error('Preciser <projet> ou --path.'); process.exitCode = 1; return; }
    dir = path.join(root, name);
  }
  if (!fs.existsSync(dir)) { console.error(`Dossier introuvable : ${dir}`); process.exitCode = 1; return; }

  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(path.join(dir, 'iakaframe.json'), 'utf8')); } catch { /* defaut */ }
  const bannerFont = cfg.bannerFont || DEFAULT_FONT;
  const task = values.do || '';

  // Resolution du runner (enum + alias legacy). aider/iakaide restent des launchers reels
  // (soft-deprecation, warning stderr) ; ps -> claude-code ; defaut claude-code.
  const rawRunner = values.runner || cfg.runner || 'claude-code';
  const norm = normalizeRunner(rawRunner);
  let runner;
  if (norm.legacyLauncher === 'aider') runner = 'aider';
  else if (norm.raw === 'iakaide') { console.warn("Runner 'iakaide' est deprecie (launcher legacy conserve)."); runner = 'iakaide'; }
  else {
    runner = norm.kind || 'claude-code';
    if (norm.deprecated) console.warn(`Runner '${norm.raw}' est deprecie -> normalise en '${runner}'.`);
  }

  // Entree de royaume : titre ASCII + tableau (derniere etape + backlog + agents).
  brief(dir, bannerFont);

  if (runner === 'codex') {
    if (hasCmd('codex')) { printBanner('Codex', bannerFont); return void launchCli('codex', dir, task); }
    console.warn('Codex CLI absent -> fallback Claude.'); runner = 'claude-code';
  }
  if (runner === 'iakaide') {
    const exe = iakaideBinary(root);
    if (exe) { printBanner('iakaIDE', bannerFont); console.log(`-> iakaIDE (${path.basename(dir)})`); spawn(exe, ['--project', path.basename(dir), '--do', task], { detached: true, stdio: 'ignore' }).unref(); return; }
    console.warn('iakaIDE non build -> fallback Claude.'); runner = 'claude-code';
  }
  if (runner === 'aider') {
    if (hasCmd('aider')) { printBanner('aider', bannerFont); return void launchAider(dir, aiderArgs({ task, model: cfg.aiderModel })); }
    console.warn('aider absent -> fallback Claude.'); runner = 'claude-code';
  }
  // claude-code / defaut
  if (!hasCmd('claude')) { console.error('Claude Code (claude) introuvable dans le PATH.'); process.exitCode = 1; return; }
  launchCli('claude', dir, task);
}
