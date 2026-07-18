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
import { emit, fail, ok } from '../lib/output.js';

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

// Resout la valeur de runner (enum + alias legacy). Retourne { runner, error, warning }.
// runner = valeur ecrite dans iakaframe.json : soit un RunnerKind canonique, soit le launcher
// legacy 'aider' (hors enum, conserve). Le warning de deprecation est REMONTE (jamais imprime ici) :
// le caller le route (stderr humain ou tableau `warnings` en mode --json, regle 4).
function resolveRunner(raw) {
  const { kind, deprecated, legacyLauncher } = normalizeRunner(raw);
  if (legacyLauncher) return { runner: legacyLauncher, error: null, warning: null };
  if (!kind) return { runner: null, error: `runner invalide : ${raw} (attendu: ${RUNNER_KINDS.join('|')} ; alias legacy: ps, iakaide, aider)`, warning: null };
  const warning = deprecated ? `Avertissement : runner '${raw}' est deprecie -> normalise en '${kind}'.` : null;
  return { runner: kind, error: null, warning };
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
      json: { type: 'boolean', default: false }, // sortie machine C-JSON
    },
  });
  const json = values.json;

  const projDir = path.resolve(values.path || process.cwd());
  if (!fs.existsSync(projDir) || !fs.statSync(projDir).isDirectory()) {
    return fail(json, `Dossier introuvable : ${projDir}`);
  }

  // Nœud (canonique) via --node / --target (alias). Defaut : claude.
  const { node, error: nodeErr } = resolveNode(values);
  if (nodeErr) return fail(json, nodeErr);

  // Warnings collectes (routes en stderr humain ou dans le tableau `warnings` du JSON, regle 4).
  const warnings = [];

  // Runner explicite (si fourni) valide immediatement.
  let runner = null;
  if (values.runner) {
    const { runner: r, error: runnerErr, warning } = resolveRunner(values.runner);
    if (runnerErr) return fail(json, runnerErr);
    runner = r;
    if (warning) warnings.push(warning);
  }

  // Diagnostic des runners disponibles.
  const root = resolveRoot(values.root);
  const diagnostics = {
    claude: hasCmd('claude'),
    codex: hasCmd('codex'),
    iakaide: !!iakaideBinary(root),
    aider: hasCmd('aider'),
  };

  // Deduction du runner si non fourni : nœud codex + codex dispo -> codex, sinon claude-code (defaut).
  if (!runner) runner = (node === 'codex' && diagnostics.codex) ? 'codex' : 'claude-code';
  if (runner === 'codex' && !diagnostics.codex) warnings.push("Codex CLI absent : 'Go' basculera sur Claude (claude-code) au runtime.");
  if (runner === 'aider' && !diagnostics.aider) warnings.push("aider absent : 'Go' basculera sur Claude (claude-code) au runtime.");

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

  const payload = ok({ path: cfgPath, runner, node, diagnostics, warnings });
  emit(json, payload, () => {
    console.log(`Diagnostic runners : claude=${diagnostics.claude}  codex=${diagnostics.codex}  iakaIDE=${diagnostics.iakaide}  aider=${diagnostics.aider}`);
    for (const w of warnings) console.warn(w);
    console.log(`OK - ${cfgPath}  (runner=${runner}, node=${node}${cfg.aiderModel ? `, aiderModel=${cfg.aiderModel}` : ''})`);
  });
}
