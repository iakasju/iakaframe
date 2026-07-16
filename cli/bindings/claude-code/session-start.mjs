#!/usr/bin/env node
// Binding Claude Code MINCE et OPTIONNEL du geste agnostique `iakaframe open` (T3, § 5.1 / Q-6 de
// l'instruction boucle-apprentissage-incrementale.md). C'est le SEUL endroit qui connait Claude Code :
// un simple greffon de hook `SessionStart` qui (1) invoque `iakaframe open` et (2) transmet sa sortie
// au contexte de session via le contrat de hook Claude Code (hookSpecificOutput.additionalContext).
//
// MINCE : il ne fait qu'invoquer `open` et relayer sa sortie ; toute la logique du canon vit dans le
//   coeur agnostique (le canon IGNORE les runners). OPTIONNEL : le canon marche sans lui ; c'est un
//   greffon. EN PARALLELE : il n'affecte pas la memoire par scope existante, il l'AJOUTE.
// NON BLOQUANT : toute defaillance (CLI absente, canon vide) -> exit 0 sans contexte ; jamais de
//   session bloquee. Aucune dependance : Node core uniquement.
//
// Resolution de la CLI (dans l'ordre) : env IAKAFRAME_BIN (peut porter des arguments, ex.
//   "node /chemin/cli/src/index.js"), sinon la commande `iakaframe` du PATH. Le chemin du canon suit
//   la resolution native de `open` (IAKA_MEMORY_HOME, sinon defaut) — l'environnement est herite.
import { spawnSync } from 'node:child_process';

function resolveBin() {
  const raw = (process.env.IAKAFRAME_BIN || 'iakaframe').trim();
  const parts = raw.split(/\s+/); // supporte "node /chemin/index.js" (dev) ou "iakaframe" (installe)
  return { cmd: parts[0], baseArgs: parts.slice(1) };
}

function loadContext() {
  const { cmd, baseArgs } = resolveBin();
  let res;
  try {
    res = spawnSync(cmd, [...baseArgs, 'open'], { encoding: 'utf8' });
  } catch { return ''; } // CLI introuvable -> greffon silencieux (non bloquant)
  if (res.error || res.status !== 0 || !res.stdout) return '';
  return res.stdout.replace(/\s+$/, '');
}

const context = loadContext();
// Contrat Claude Code `SessionStart` : additionalContext est injecte EN PLUS de la memoire par scope.
if (context) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }));
}
process.exit(0); // toujours 0 : le greffon ne bloque jamais l'ouverture de session
