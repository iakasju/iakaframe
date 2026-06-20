#!/usr/bin/env node
// @naonedge/iakaframe - CLI multi-OS (Windows/macOS/Linux). Zero dependance runtime.
import { runServices } from './commands/services.js';
import { runConfig } from './commands/config.js';
import { runInit } from './commands/init.js';
import { runSnapshot } from './commands/snapshot.js';
import { runOnboard } from './commands/onboard.js';
import { runUpdate } from './commands/update.js';
import { resolveRoot } from './lib/root.js';

const VERSION = '0.1.0';

const HELP = `iakaframe v${VERSION} - methode de travail outillee (CLI multi-OS)

Usage : iakaframe <commande> [options]

Commandes :
  onboard             Met en place la methode : structure + Forgejo + commit + etat + push
                        --path <dir> --target claude|codex|ollama --repo <nom>
                        --description "ascii" --version vX.Y.Z
                        --skip-forgejo  --no-push  --force
  init                Deploie le kit + marqueur .iakaframe (non destructif)
                        --path <dir> --target claude|codex|ollama --force
  snapshot            Etat des lieux (journal + MD + HTML)
                        --path <dir> --reason version|pause|reprise|manual --version --note
  update              Checkpoint : snapshot + commit global + push
                        --path <dir> --reason --version --note --message --no-push
  services            Sonde git(Forgejo) / Ollama / ComfyUI
                        --hosts a,b,c  --json <fichier>  --timeout <sec>
  config              Ecrit/maj <projet>/iakaframe.json (runner + cible)
                        --path <dir> --runner ps|codex|iakaide --target claude|codex|ollama
  root                Affiche le dossier chapeau resolu (~/work | C:\\work)

Options globales :
  -v, --version       Version
  -h, --help          Aide

Forgejo : token via FORGEJO_TOKEN. Dossier chapeau : IAKAFRAME_ROOT/--root, sinon ~/work.`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') { console.log(HELP); return; }
  if (cmd === '-v' || cmd === '--version' || cmd === 'version') { console.log(VERSION); return; }

  switch (cmd) {
    case 'onboard':  await runOnboard(rest); break;
    case 'init':     runInit(rest); break;
    case 'snapshot': runSnapshot(rest); break;
    case 'update':   await runUpdate(rest); break;
    case 'services': await runServices(rest); break;
    case 'config':   runConfig(rest); break;
    case 'root': {
      const i = rest.indexOf('--root');
      console.log(resolveRoot(i >= 0 ? rest[i + 1] : undefined));
      break;
    }
    default:
      console.error(`Commande inconnue : ${cmd}\n`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch(e => { console.error(e); process.exitCode = 1; });
