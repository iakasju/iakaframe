#!/usr/bin/env node
// @naonedge/iakaframe - CLI multi-OS (Windows/macOS/Linux). Zero dependance runtime.
import { runServices } from './commands/services.js';
import { runConfig } from './commands/config.js';
import { resolveRoot } from './lib/root.js';

const VERSION = '0.1.0';

const HELP = `iakaframe v${VERSION} - methode de travail outillee (CLI multi-OS)

Usage : iakaframe <commande> [options]

Commandes :
  services            Sonde git(Forgejo) / Ollama / ComfyUI
                        --hosts a,b,c   hotes a sonder (defaut iakabox+localhost)
                        --json <fichier>  ecrit un services.json
                        --timeout <sec>   timeout par sonde (defaut 3)
  config              Ecrit/maj <projet>/iakaframe.json (runner + cible)
                        --path <dir>      projet (defaut: dossier courant)
                        --runner ps|codex|iakaide
                        --target claude|codex|ollama
  root                Affiche le dossier chapeau resolu (~/work | C:\\work)
                        --root <dir>      surcharge ponctuelle

Options globales :
  -v, --version       Version
  -h, --help          Aide

Dossier chapeau : IAKAFRAME_ROOT (env) ou --root, sinon ~/work (C:\\work sur Windows).`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') { console.log(HELP); return; }
  if (cmd === '-v' || cmd === '--version' || cmd === 'version') { console.log(VERSION); return; }

  switch (cmd) {
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
