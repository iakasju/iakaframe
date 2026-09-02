#!/usr/bin/env node
// @naonedge/iakaframe - CLI multi-OS (Windows/macOS/Linux). Zero dependance runtime.
import { runServices } from './commands/services.js';
import { runConfig } from './commands/config.js';
import { runInit } from './commands/init.js';
import { runSnapshot } from './commands/snapshot.js';
import { runOnboard } from './commands/onboard.js';
import { runUpdate } from './commands/update.js';
import { runRepo } from './commands/repo.js';
import { runAgents } from './commands/agents.js';
import { runSkills } from './commands/skills.js';
import { runModels } from './commands/models.js';
import { runGo } from './commands/go.js';
import { runBanner } from './commands/banner.js';
import { runBrief } from './commands/brief.js';
import { runRecap } from './commands/recap.js';
import { runJalon } from './commands/jalon.js';
import { runList } from './commands/list.js';
import { runShow } from './commands/show.js';
import { runAdd } from './commands/add.js';
import { runRemove } from './commands/remove.js';
import { runAttach, runDetach } from './commands/attach.js';
import { runAssemble } from './commands/assemble.js';
import { runVendorCheck } from './commands/vendor-check.js';
import { runFrame } from './commands/frame.js';
import { runSwitch } from './commands/switch.js';
import { runMemory } from './commands/memory.js';
import { runProduit } from './commands/produit.js';
import { runOpen } from './commands/open.js';
import { runRecall } from './commands/recall.js';
import { runClose } from './commands/close.js';
import { runReview } from './commands/review.js';
import { runConsolidate } from './commands/consolidate.js';
import { runObserve } from './commands/observe.js';
import { runPortfolio } from './commands/portfolio.js';
import { runRange } from './commands/range.js';
import { runCanaux } from './commands/canaux.js';
import { runEndpoints } from './commands/endpoints.js';
import { runCommands } from './commands/commands.js';
import { resolveRoot } from './lib/root.js';
import { packageVersion } from './lib/version.js';
import { VERBES, resumeOf, optionsOf } from './lib/verbes.js';
import { wrap } from './lib/table.js';

// Source unique : lue depuis cli/package.json (cf. lib/version.js). Plus aucune copie codee en dur.
const VERSION = packageVersion();

// L'aide etait une constante de prose ecrite a la main (39 lignes recopiees, une par verbe) —
// exactement le defaut deja nomme plus bas dans ce fichier a propos du compte de fixtures : « un
// nombre duplique a la main finit toujours par mentir ». Un INVENTAIRE duplique a la main ment de
// la meme facon. Elle est DESORMAIS DERIVEE de lib/verbes.js (Lot 0, source unique de l'inventaire,
// dont dependent aussi `iakaframe commands --json` et — plus tard — le menu terminal et les
// commandes Claude Code). `--help` d'un verbe precis reste l'autorite fine et INCHANGEE : ce bloc
// n'est qu'un INDEX.
const COL = 22;   // 2 espaces + id, aligne sur la colonne ou demarre le resume
const IND = 24;   // indentation des lignes d'options (continuation)
const WRAP_WIDTH = 96;

// Une entree (verbe OU sous-verbe) -> un bloc { <id> [<arguments>]  <resume>\n  <options...> }.
// `idDisplay` permet d'afficher un alias groupe (ex. `switch|use`) sans dupliquer l'entree.
function verbeBlock(entree) {
  const idCol = entree.idDisplay || entree.id;
  const headLabel = entree.arguments ? `${idCol} ${entree.arguments}` : idCol;
  const prefix = `  ${headLabel}`;
  // padEnd n'ajoute rien si le libelle depasse deja COL (id + arguments longs, ex. `models set
  // <personaId> <modele>`) : on garantit alors au moins un separateur visible.
  const header = (prefix.length >= COL ? prefix + '  ' : prefix.padEnd(COL)) + resumeOf(entree);
  const opts = optionsOf(entree);
  if (!opts.length) return header;
  const optLine = opts.join('  ');
  const wrapped = wrap(optLine, WRAP_WIDTH - IND);
  return [header, ...wrapped.map(l => ' '.repeat(IND) + l)].join('\n');
}

// Sous-verbes dont la GRAMMAIRE differe assez du parent pour meriter leur propre ligne dans
// l'aide globale (ex. `models set <personaId> <modele>` vs `models unset <personaId>|--all`) :
// marques `enteteAide:true` dans le registre. Les autres restent inline dans le resume du parent
// (ex. `agents : list | affect | fullteam | status`) — non regressif, sans allonger l'index.
function sousVerbeBlocs(parent) {
  return (parent.sousVerbes || [])
    .filter(sv => sv.enteteAide)
    .map(sv => verbeBlock({ ...sv, id: `${parent.id} ${sv.id}` }));
}

function commandesSection() {
  return VERBES
    .flatMap(v => [verbeBlock(v), ...sousVerbeBlocs(v)])
    .join('\n');
}

const HELP = `iakaframe v${VERSION} - methode de travail outillee (CLI multi-OS)

Usage : iakaframe <commande> [options]

Commandes :
${commandesSection()}

Umbrella : onboard --umbrella --path <chapeau> [--init-projects]

Options globales :
  -v, --version       Version
  -h, --help          Aide

Sortie machine (--json) : partout un BOOLEEN ; emet un objet JSON 2-indente sur stdout
  (jamais de tableau nu), avec ok:true|false ; collection = clef au pluriel + count ;
  erreur = { ok:false, error } sur stdout (exit 1, rien d'humain sur stderr). services
  ecrit desormais son fichier via --out <fichier> (l'ancien --json <fichier> est retire).

⚠ --root a DEUX sens selon la commande : dossier chapeau ~/work (portfolio, observe) vs
  racine de bibliotheque (list, show, add, assemble, switch). Voir IAKAFRAME_ROOT / IAKAFRAME_HOME.

Chaque verbe porte sa PROPRE aide detaillee : iakaframe <verbe> --help. L'inventaire machine de
ce bloc (verbes, sous-verbes, options) est disponible en JSON : iakaframe commands --json.

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
    case 'repo':     await runRepo(rest); break;
    case 'services': await runServices(rest); break;
    case 'canaux':   runCanaux(rest); break;
    case 'endpoints': await runEndpoints(rest); break;
    case 'commands': runCommands(rest); break;
    case 'config':   runConfig(rest); break;
    case 'agents':   runAgents(rest); break;
    case 'skills':   runSkills(rest); break;
    case 'models':   await runModels(rest); break;
    case 'go':       runGo(rest); break;
    case 'banner':   runBanner(rest); break;
    case 'brief':    runBrief(rest); break;
    case 'recap':    runRecap(rest); break;
    case 'jalon':    runJalon(rest); break;
    case 'list':     runList(rest); break;
    case 'show':     runShow(rest); break;
    case 'add':      runAdd(rest); break;
    case 'remove':   runRemove(rest); break;
    case 'attach':   runAttach(rest); break;
    case 'detach':   runDetach(rest); break;
    case 'assemble': runAssemble(rest); break;
    case 'vendor-check': runVendorCheck(rest); break;
    case 'frame':    runFrame(rest); break;
    case 'switch':
    case 'use':      runSwitch(rest); break;
    case 'memory':   runMemory(rest); break;
    case 'produit':  runProduit(rest); break;
    case 'open':     runOpen(rest); break;
    case 'recall':   runRecall(rest); break;
    case 'close':    runClose(rest); break;
    case 'review':   runReview(rest); break;
    case 'consolidate': runConsolidate(rest); break;
    case 'observe':  runObserve(rest); break;
    case 'portfolio': runPortfolio(rest); break;
    case 'range':    runRange(rest); break;
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
