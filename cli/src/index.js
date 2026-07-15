#!/usr/bin/env node
// @naonedge/iakaframe - CLI multi-OS (Windows/macOS/Linux). Zero dependance runtime.
import { runServices } from './commands/services.js';
import { runConfig } from './commands/config.js';
import { runInit } from './commands/init.js';
import { runSnapshot } from './commands/snapshot.js';
import { runOnboard } from './commands/onboard.js';
import { runUpdate } from './commands/update.js';
import { runAgents } from './commands/agents.js';
import { runGo } from './commands/go.js';
import { runBanner } from './commands/banner.js';
import { runBrief } from './commands/brief.js';
import { runRecap } from './commands/recap.js';
import { runJalon } from './commands/jalon.js';
import { runList } from './commands/list.js';
import { runShow } from './commands/show.js';
import { runAdd } from './commands/add.js';
import { runAssemble } from './commands/assemble.js';
import { runSwitch } from './commands/switch.js';
import { resolveRoot } from './lib/root.js';

const VERSION = '0.1.0';

const HELP = `iakaframe v${VERSION} - methode de travail outillee (CLI multi-OS)

Usage : iakaframe <commande> [options]

Commandes :
  onboard             Met en place la methode : structure + Forgejo + commit + etat + push
                        --path <dir> --node claude|codex|ollama-localhost|ollama-lan --repo <nom>
                        --description "ascii" --version vX.Y.Z
                        --skip-forgejo  --no-push  --force  (--target = alias deprecie de --node)
  init                Deploie le kit + marqueur .iakaframe (non destructif)
                        --path <dir> --node claude|codex|ollama-localhost|ollama-lan --force
                        (--target = alias deprecie de --node)
  snapshot            Etat des lieux (journal + MD + HTML)
                        --path <dir> --reason version|pause|reprise|manual --version --note
  update              Checkpoint : snapshot + commit global + push
                        --path <dir> --reason --version --note --message --no-push
  services            Sonde git(Forgejo) / Ollama / ComfyUI
                        --hosts a,b,c  --json <fichier>  --timeout <sec>
  config              Ecrit/maj <projet>/iakaframe.json (runner + nœud)
                        --path <dir> --runner claude-code|ollama|litellm|codex --node <n>
                        (alias legacy runner : ps, iakaide, aider - deprecies ; --target = alias de --node)
                        --aider-model <m>  (ex: ollama/llama3, pour le launcher legacy aider)
  agents              Equipe de personas : list | affect | fullteam | status
                        --agent <nom> --project <dir> --global --force
  go <projet>         Lance l'action du projet via son runner (claude-code|ollama|litellm|codex)
                        --path <dir> --runner <r> --do "tache"  (launchers legacy : aider, iakaide)
  banner <texte>      Titre ASCII (FIGlet embarque, zero dep)
                        --font <nom>  (defaut : ANSI Shadow ; repli : Standard)
  brief <projet>      Entree projet : titre + tableau (derniere etape + backlog) + agents
                        --path <dir> --font <nom>
  recap <projet>      Fermeture : tableau recap session (commits + agents + projet)
                        --path <dir> --n <nb commits>
  jalon               Cadre d'un jalon (gate) : titre Standard + tableau emetteur/contenu/recepteur
                        --project --name --from --to --content --files a:1,b:2 --next --validated
  list [type]         Inventaire de la bibliotheque (pool + assemblages) par scan
                        type : personas|skills|principles|rituals|guardrails|roles|workflows|
                        scaffolds|teams|methods|bindings|kits  (--json --ascii --root)
  show <id>           Contrat d'un atome/assemblage : frontmatter + corps  (--type --json --root)
  add <kind> <fic>    Livre un assemblage : team|method|binding (valide refs I1)  (--force --json)
  assemble <m> <t>    Compose un kit (methode+team[+binding]) - dry-run  (--write --binding --json)
  switch|use <m> <t>  Bascule un projet vers methode/team  (--path --binding --rollback --json)
  root                Affiche le dossier chapeau resolu (~/work | C:\\work)

Umbrella : onboard --umbrella --path <chapeau> [--init-projects]

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
    case 'agents':   runAgents(rest); break;
    case 'go':       runGo(rest); break;
    case 'banner':   runBanner(rest); break;
    case 'brief':    runBrief(rest); break;
    case 'recap':    runRecap(rest); break;
    case 'jalon':    runJalon(rest); break;
    case 'list':     runList(rest); break;
    case 'show':     runShow(rest); break;
    case 'add':      runAdd(rest); break;
    case 'assemble': runAssemble(rest); break;
    case 'switch':
    case 'use':      runSwitch(rest); break;
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
