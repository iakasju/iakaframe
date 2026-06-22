// iakaframe config - ecrit/maj <projet>/iakaframe.json (runner + cible) avec diagnostic.
// Iso du iakaframe-config.ps1. runner: ps|codex|iakaide ; target: claude|codex|ollama.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { hasCmd } from '../lib/which.js';
import { resolveRoot } from '../lib/root.js';

const RUNNERS = ['ps', 'codex', 'iakaide', 'aider'];
const TARGETS = ['claude', 'codex', 'ollama'];

function iakaideBinary(root) {
  const dir = path.join(root, 'iakaide', 'src-tauri', 'target', 'release');
  try {
    if (!fs.existsSync(dir)) return null;
    const ext = process.platform === 'win32' ? '.exe' : '';
    const hit = fs.readdirSync(dir).find(f =>
      (ext ? f.endsWith(ext) : !path.extname(f)) && !/build|deps/.test(f));
    return hit ? path.join(dir, hit) : null;
  } catch { return null; }
}

export function runConfig(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' },                 // dossier projet (defaut: cwd)
      runner: { type: 'string' },               // ps|codex|iakaide|aider
      target: { type: 'string' },               // claude|codex|ollama
      'aider-model': { type: 'string' },        // modele pour le runner aider (ex: ollama/llama3)
      root: { type: 'string' },                 // chapeau (pour trouver iakaIDE)
    },
  });

  const projDir = path.resolve(values.path || process.cwd());
  if (!fs.existsSync(projDir) || !fs.statSync(projDir).isDirectory()) {
    console.error(`Dossier introuvable : ${projDir}`); process.exitCode = 1; return;
  }
  if (values.runner && !RUNNERS.includes(values.runner)) {
    console.error(`runner invalide : ${values.runner} (attendu: ${RUNNERS.join('|')})`); process.exitCode = 1; return;
  }
  if (values.target && !TARGETS.includes(values.target)) {
    console.error(`target invalide : ${values.target} (attendu: ${TARGETS.join('|')})`); process.exitCode = 1; return;
  }

  // Diagnostic des runners disponibles
  const root = resolveRoot(values.root);
  const hasClaude = hasCmd('claude');
  const hasCodex = hasCmd('codex');
  const hasIakaide = !!iakaideBinary(root);
  const hasAider = hasCmd('aider');
  console.log(`Diagnostic runners : claude=${hasClaude}  codex=${hasCodex}  iakaIDE=${hasIakaide}  aider=${hasAider}`);

  // Deduction du runner si non fourni (cible -> runner, selon dispo)
  let runner = values.runner;
  if (!runner) runner = (values.target === 'codex' && hasCodex) ? 'codex' : 'ps';
  if (runner === 'codex' && !hasCodex) console.warn("Codex CLI absent : 'Go' basculera sur Claude (ps) au runtime.");
  if (runner === 'iakaide' && !hasIakaide) console.warn("iakaIDE non build : 'Go' basculera sur Claude (ps) au runtime.");
  if (runner === 'aider' && !hasAider) console.warn("aider absent : 'Go' basculera sur Claude (ps) au runtime.");
  const target = values.target || (runner === 'codex' ? 'codex' : 'claude');

  // Ecrire/fusionner iakaframe.json
  const cfgPath = path.join(projDir, 'iakaframe.json');
  let cfg = {};
  if (fs.existsSync(cfgPath)) { try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { /* repart a vide */ } }
  cfg.runner = runner;
  cfg.target = target;
  if (values['aider-model']) cfg.aiderModel = values['aider-model'];
  if (!cfg.note) cfg.note = "Conf iakaframe du projet (runner du bouton Go, cible d'incarnation). runner: ps | codex | iakaide | aider.";
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  console.log(`OK - ${cfgPath}  (runner=${runner}, target=${target}${cfg.aiderModel ? `, aiderModel=${cfg.aiderModel}` : ''})`);
}
