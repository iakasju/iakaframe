#!/usr/bin/env node
// Binding Claude Code MINCE et OPTIONNEL du geste agnostique `iakaframe open` (T3, § 5.1 / Q-6 de
// l'instruction boucle-apprentissage-incrementale.md). C'est le SEUL endroit qui connait Claude Code :
// un simple greffon de hook `SessionStart` qui (1) invoque `iakaframe open` et (2) transmet sa sortie
// au contexte de session via le contrat de hook Claude Code (hookSpecificOutput.additionalContext).
//
// ---------------------------------------------------------------------------------------------------
// DOCTRINE (arbitrage AR-1, option B, validee par le decideur — instruction
// armement-marqueur-session-binding.md) :
//
//                   LE BINDING FOURNIT LE CONTEXTE ; LE COEUR PORTE LE JUGEMENT.
//
// Le binding relaie le repertoire que le RUNNER DECLARE de lui-meme, et le passe en `--project`.
// Ce n'est PAS de la detection : c'est du relais — exactement la raison d'etre du « seul endroit qui
// connait Claude Code ». Le JUGEMENT (« ce repertoire est-il un projet a canon ? ») reste ENTIEREMENT
// dans le coeur agnostique (`projectCanonExists`, cote `open`) et n'y bouge pas d'une ligne.
//
// INTERDICTION D'HEURISTIQUE — c'est un CRITERE DE RECETTE (C-8), pas un conseil. Ce fichier n'a le
// droit d'implementer AUCUNE heuristique de projet : aucune remontee d'arborescence, aucune sonde de
// systeme de fichiers, aucune recherche de marqueur de depot, aucune connaissance du layout du canon
// projet. C'est cette interdiction, verrouillee par test, qui rend « MINCE » VERIFIABLE plutot que
// declaratif : le binding gagne un CANAL D'ENTREE, jamais une LOGIQUE.
// (Pourquoi pas `--project .` : sous Claude Code, le repertoire courant d'un hook `command` n'est PAS
//  contractuel — le coeur deduirait le projet d'une valeur que le runner ne promet pas.)
// ---------------------------------------------------------------------------------------------------
//
// MINCE : il ne fait qu'invoquer `open`, lui relayer le contexte declare, et relayer sa sortie ; toute
//   la logique du canon vit dans le coeur agnostique (le canon IGNORE les runners). OPTIONNEL : le
//   canon marche sans lui ; c'est un greffon. EN PARALLELE : il n'affecte pas la memoire par scope
//   existante, il l'AJOUTE.
// NON BLOQUANT : toute defaillance (CLI absente, canon vide, stdin illisible) -> exit 0 ; jamais de
//   session bloquee, jamais de pendaison. Aucune dependance : Node core uniquement.
// DEGRADATION VERS `open` NU, PAS VERS LE SILENCE : si le contexte projet est indisponible, on invoque
//   `open` SANS `--project`. On ne perd JAMAIS le canon portefeuille a cause du canon projet.
//
// Resolution de la CLI (dans l'ordre) : env IAKAFRAME_BIN (peut porter des arguments, ex.
//   "node /chemin/cli/src/index.js"), sinon la commande `iakaframe` du PATH. Le chemin du canon suit
//   la resolution native de `open` (IAKA_MEMORY_HOME, sinon defaut) — l'environnement est herite.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function resolveBin() {
  const raw = (process.env.IAKAFRAME_BIN || 'iakaframe').trim();
  const parts = raw.split(/\s+/); // supporte "node /chemin/index.js" (dev) ou "iakaframe" (installe)
  return { cmd: parts[0], baseArgs: parts.slice(1) };
}

// Payload `SessionStart` du runner, lu sur stdin. Champs documentes : session_id, transcript_path,
// cwd, hook_event_name, source. On n'en exploite qu'un : `cwd`.
//
// LECTURE STRICTEMENT NON BLOQUANTE. La garde `isTTY` est OBLIGATOIRE : sans elle, la verification
// manuelle decrite au README (`node session-start.mjs` dans un terminal) PENDRAIT en attendant une
// entree qui ne vient jamais. Toute anomalie -> objet vide, jamais d'exception.
function readPayload() {
  if (process.stdin.isTTY) return {}; // terminal interactif : personne n'ecrira sur stdin
  let raw;
  try { raw = readFileSync(0, 'utf8'); } catch { return {}; }
  if (!raw || !raw.trim()) return {};
  try {
    const data = JSON.parse(raw);
    return (data && typeof data === 'object') ? data : {};
  } catch { return {}; } // stdin non-JSON -> on ignore, sans bruit
}

// CONTEXTE DECLARE PAR LE RUNNER — trois sources EMPILEES, premiere valeur non vide gagnante.
//
// POURQUOI PAS UNE SOURCE UNIQUE : un defaut connu de Claude Code rend les variables d'environnement
// de hook vides dans certaines versions. Une source unique rendrait le mecanisme inerte a la premiere
// regression du runner — precisement le defaut que ce lot ferme.
//
// POURQUOI CLAUDE_PROJECT_DIR EN PREMIER (ordre valide par le decideur) : sa semantique est RACINE DU
// PROJET, or le canon projet vit a la racine ; `payload.cwd` peut etre un SOUS-REPERTOIRE de session,
// ou le coeur ne trouverait rien. On rend un chemin ABSOLU RESOLU, jamais un chemin relatif.
function resolveProjectDir(payload) {
  for (const candidat of [process.env.CLAUDE_PROJECT_DIR, payload.cwd, safeCwd()]) {
    if (typeof candidat !== 'string') continue;
    const valeur = candidat.trim();
    if (!valeur) continue;
    try { return resolve(valeur); } catch { /* candidat inutilisable -> source suivante */ }
  }
  return ''; // aucun contexte -> `open` NU (jamais le silence)
}

// Dernier repli. `process.cwd()` LEVE si le repertoire courant a ete supprime : jamais nu.
function safeCwd() {
  try { return process.cwd(); } catch { return ''; }
}

function loadContext(projectDir) {
  const { cmd, baseArgs } = resolveBin();
  // Le contexte n'est passe que s'il existe : `open` NU reste le comportement de repli.
  const args = projectDir ? ['open', '--project', projectDir] : ['open'];
  let res;
  try {
    res = spawnSync(cmd, [...baseArgs, ...args], { encoding: 'utf8' });
  } catch { return ''; } // CLI introuvable -> greffon silencieux (non bloquant)
  if (res.error || res.status !== 0 || !res.stdout) return '';
  return res.stdout.replace(/\s+$/, '');
}

const context = loadContext(resolveProjectDir(readPayload()));
// Contrat Claude Code `SessionStart` : additionalContext est injecte EN PLUS de la memoire par scope.
if (context) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }));
}
process.exit(0); // toujours 0 : le greffon ne bloque jamais l'ouverture de session
