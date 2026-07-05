// iakaframe config - ecrit/maj <projet>/iakaframe.json (runner + nœud) avec diagnostic.
// runner: enum unifie claude-code|ollama|litellm|codex (+ alias legacy ps/iakaide -> claude-code,
// aider = launcher legacy conserve). nœud: claude|codex|ollama-localhost|ollama-lan (--target = alias).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { hasCmd } from '../lib/which.js';
import { resolveRoot } from '../lib/root.js';
import { RUNNER_KINDS, normalizeRunner, legacyTargetForNode } from '../lib/vocab.js';
import { resolveNode } from './init.js';

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

// Resout la valeur de runner (enum + alias legacy). Retourne { runner, error }.
// runner = valeur ecrite dans iakaframe.json : soit un RunnerKind canonique, soit le launcher
// legacy 'aider' (hors enum, conserve). Emet les warnings de deprecation sur stderr.
function resolveRunner(raw) {
  const { kind, deprecated, legacyLauncher } = normalizeRunner(raw);
  if (legacyLauncher) return { runner: legacyLauncher, error: null };
  if (!kind) return { runner: null, error: `runner invalide : ${raw} (attendu: ${RUNNER_KINDS.join('|')} ; alias legacy: ps, iakaide, aider)` };
  if (deprecated) console.error(`Avertissement : runner '${raw}' est deprecie -> normalise en '${kind}'.`);
  return { runner: kind, error: null };
}

export function runConfig(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' },                 // dossier projet (defaut: cwd)
      runner: { type: 'string' },               // claude-code|ollama|litellm|codex (+ alias legacy)
      node: { type: 'string' },                 // claude|codex|ollama-localhost|ollama-lan
      target: { type: 'string' },               // alias DEPRECIE de --node
      'aider-model': { type: 'string' },        // modele pour le launcher legacy aider
      root: { type: 'string' },                 // chapeau (pour trouver iakaIDE)
    },
  });

  const projDir = path.resolve(values.path || process.cwd());
  if (!fs.existsSync(projDir) || !fs.statSync(projDir).isDirectory()) {
    console.error(`Dossier introuvable : ${projDir}`); process.exitCode = 1; return;
  }

  // Nœud (canonique) via --node / --target (alias). Defaut : claude.
  const { node, error: nodeErr } = resolveNode(values);
  if (nodeErr) { console.error(nodeErr); process.exitCode = 1; return; }

  // Runner explicite (si fourni) valide immediatement.
  let runner = null;
  if (values.runner) {
    const { runner: r, error: runnerErr } = resolveRunner(values.runner);
    if (runnerErr) { console.error(runnerErr); process.exitCode = 1; return; }
    runner = r;
  }

  // Diagnostic des runners disponibles
  const root = resolveRoot(values.root);
  const hasClaude = hasCmd('claude');
  const hasCodex = hasCmd('codex');
  const hasIakaide = !!iakaideBinary(root);
  const hasAider = hasCmd('aider');
  console.log(`Diagnostic runners : claude=${hasClaude}  codex=${hasCodex}  iakaIDE=${hasIakaide}  aider=${hasAider}`);

  // Deduction du runner si non fourni : nœud codex + codex dispo -> codex, sinon claude-code (defaut).
  if (!runner) runner = (node === 'codex' && hasCodex) ? 'codex' : 'claude-code';
  if (runner === 'codex' && !hasCodex) console.warn("Codex CLI absent : 'Go' basculera sur Claude (claude-code) au runtime.");
  if (runner === 'aider' && !hasAider) console.warn("aider absent : 'Go' basculera sur Claude (claude-code) au runtime.");

  // Ecrire/fusionner iakaframe.json : runner canonique ; node= (canonique) ET target= (mirror legacy).
  const cfgPath = path.join(projDir, 'iakaframe.json');
  let cfg = {};
  if (fs.existsSync(cfgPath)) { try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { /* repart a vide */ } }
  cfg.runner = runner;
  cfg.node = node;
  cfg.target = legacyTargetForNode(node);
  if (values['aider-model']) cfg.aiderModel = values['aider-model'];
  cfg.note = "Conf iakaframe du projet (runner du bouton Go, nœud de deploiement). runner: claude-code | ollama | litellm | codex (alias legacy: ps, iakaide, aider).";
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  console.log(`OK - ${cfgPath}  (runner=${runner}, node=${node}${cfg.aiderModel ? `, aiderModel=${cfg.aiderModel}` : ''})`);
}
