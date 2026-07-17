// iakaframe init - deploie le kit (nœud claude|codex|ollama-localhost|ollama-lan) + marqueur
// .iakaframe. Non destructif. --node = canonique ; --target = alias DEPRECIE (warning stderr).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { frameworkRoot, kitNameForNode, contractFileForNode, frameworkVersion, copyKit } from '../lib/kit.js';
import { NODE_KINDS, normalizeNode, legacyTargetForNode } from '../lib/vocab.js';
import { now } from '../lib/date.js';

// Resout le nœud a partir de --node (canonique) ou --target (alias deprecie). Retourne
// { node, error } ; emet les warnings de deprecation sur stderr (jamais stdout).
export function resolveNode(values) {
  let raw = values.node;
  if (!raw && values.target) {
    console.error("Avertissement : --target est deprecie, utiliser --node (alias conserve >= 1 version mineure).");
    raw = values.target;
  }
  if (!raw) raw = 'claude';
  const { node, deprecated } = normalizeNode(raw);
  if (!node) {
    return { node: null, error: `nœud invalide : ${raw} (attendu: ${NODE_KINDS.join('|')} ; alias legacy: ollama)` };
  }
  if (deprecated) console.error(`Avertissement : 'ollama' est ambigu -> normalise en '${node}' (préciser --node ollama-lan pour le LAN).`);
  return { node, error: null };
}

export function runInit(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' },
      node: { type: 'string' },                        // claude|codex|ollama-localhost|ollama-lan
      target: { type: 'string' },                      // alias DEPRECIE de --node
      force: { type: 'boolean', default: false },
    },
  });
  const { node, error } = resolveNode(values);
  if (error) { console.error(error); process.exitCode = 1; return false; }

  const dest = path.resolve(values.path || process.cwd());
  const root = frameworkRoot();
  if (!root) { console.error('Racine iakaframe introuvable (dossier kit-claude/ absent).'); process.exitCode = 1; return false; }

  const kit = path.join(root, kitNameForNode(node));
  const contract = contractFileForNode(node);
  const version = frameworkVersion(root);
  if (!fs.existsSync(kit)) { console.error(`Kit introuvable : ${kit}`); process.exitCode = 1; return false; }
  fs.mkdirSync(dest, { recursive: true });

  console.log(`iakaframe ${version} -> deploiement du kit [nœud ${node}] dans : ${dest}`);

  const existing = path.join(dest, contract);
  if (fs.existsSync(existing) && !values.force) {
    console.log(`  ! ${contract} existe deja : projet semble deja initialise (relancer --force pour ecraser).`);
    return true;
  }

  const { copied, skipped } = copyKit(kit, dest, { force: values.force });

  // Marqueur .iakaframe : node= (canonique) ET target= (mirror legacy, non destructif) pour
  // que les lecteurs anciens continuent de lire 'target'. Lecture : node prioritaire, repli target.
  const stamp = [
    `iakaframe=${version}`,
    `node=${node}`,
    `target=${legacyTargetForNode(node)}`,
    `contract=${contract}`,
    `installed=${now()}`,
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(dest, '.iakaframe'), stamp, 'utf8');

  console.log(`  + .iakaframe (version ${version}, nœud ${node})`);
  console.log(`\nTermine : ${copied} copie(s), ${skipped} ignore(s).`);
  return true;
}
