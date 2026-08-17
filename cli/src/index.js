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
import { resolveRoot } from './lib/root.js';
import { packageVersion } from './lib/version.js';
import { EXPECTED_COPIES, EXPECTED_DERIVED } from './lib/vendor.js';

// Source unique : lue depuis cli/package.json (cf. lib/version.js). Plus aucune copie codee en dur.
const VERSION = packageVersion();

// Meme principe pour le compte de fixtures : derive du manifeste de vendorage, jamais recopie.
// L'aide avait fige « 21 fixtures (17 copies) » alors que la garde en verifiait 82 — un nombre
// duplique a la main finit toujours par mentir.
const VENDOR_TOTAL = EXPECTED_COPIES + EXPECTED_DERIVED;

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
                        --path <dir> --repo <nom> --reason --version --note --message --no-push --home
                        (bascule onboarding : creation de depot distant REFUSEE par defaut ;
                         --autoriser-creation-depot pour la forcer)
  repo [<nom>]        Branche le remote d'un depot git EXISTANT (geste provider-neutre)
                        --path <dir> --repo <nom> --provider <nom> (defaut forgejo)
                        --create (REQUIS pour creer le depot distant) --description "ascii"
                        (sans --create : test + remote LOCAL seulement, jamais de creation)
  services            Sonde git(Forgejo) / Ollama / ComfyUI
                        --hosts a,b,c  --json (stdout)  --out <fichier>  --timeout <sec>
  config              Ecrit/maj <projet>/iakaframe.json (runner + nœud)
                        --path <dir> --runner claude-code|ollama|litellm|codex --node <n>  --json
                        (alias legacy runner : ps, iakaide, aider - deprecies ; --target = alias de --node)
                        --aider-model <m>  (ex: ollama/llama3, pour le launcher legacy aider)
  agents              Equipe de personas : list | affect | fullteam | status
                        --agent <nom> --project <dir> --global --force  --json (list/status)
  skills deploy       Deploie l'union resolue des skills -> <cible>/.claude/skills/ (non destructif)
                        --project <dir> --global --check (diff sans ecriture)  --json
                        (orphelines signalees orphan, jamais supprimees ; exit!=0 si drift/absent)
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
  remove <kind> <id>  Retire l'assemblage/skill : team|method|binding|skill (le - de add).
                        RESTRICT par defaut si reference ; --cascade --yes pour forcer ;
                        archive en corbeille <root>/.trash-<ts>/ (restaurable)  (--json)
  attach <skill>      Attache un skill a un persona : mute skills:[] du persona
                        --persona <id>  (--force --json)
  detach <skill>      Detache un skill d'un persona : retire de skills:[] (le - de attach)
                        --persona <id>  (--json)
  assemble <m> <t>    Compose un kit (methode+team[+binding]) - dry-run  (--write --binding --json)
  vendor-check        Constate que les ${VENDOR_TOTAL} fixtures vendorees de iakaFrameGUI (${EXPECTED_COPIES} copies +
                        ${EXPECTED_DERIVED} derivees) sont fideles au canon. Gracieux si le frere est absent
                        (exit 0, ok:false)  (--strict --gui <dir> --root --json)
  frame verify        Garde d'anonymisation du miroir frames/releases/ : gates G1-G6 par CLASSES
                        (G2 = ALLOWLIST de marque, attrape le nom SUIVANT). Constate, ne reecrit
                        pas  (--frame <dir> --verbose --json)
  frame use <id>      Pose la frame active du projet : ecrit iakaframe.json cle \`frame\` (source
                        unique CLI<->GUI, non destructif). "" retire la cle (repli default).
                        Distinct de \`use <m> <t>\` (materialisation)  (--path <projet> --json)
  switch|use <m> <t>  Bascule un projet vers methode/team  (--path --binding --rollback --json)
  memory <action>     Canon du portefeuille : init|path|config|list|add|replace|remove
                        <profil|registre>  (--home <dir>  --json ; defaut ~/.iaka/memory/)
  produit <action>    Canon PROJET (connaissance du PRODUIT, revisee EN PLACE, versionnee dans
                        <projet>/specs/canon/PRODUIT.md) : init|path|config|list|add|replace|
                        remove  (--project <dir>  --json)
  open                Charge le canon (PROFIL+REGISTRE) a l'ouverture, scope-agnostique,
                        pret a injecter en session (lecture seule)  (--home <dir>  --json)
                        --project <dir> : ajoute le canon PRODUIT + arme le marqueur de session
  recall <requete>    Rappel plein-texte sur l'historique brut du canon (transcripts/)
                        moteur ripgrep, repli Node  (--home <dir>  --json)
  close               Revue de cloture : rejoue transcripts/ -> propositions typees dans
                        proposals/ (memory|skill|hook|config) ; N'APPLIQUE RIEN
                        --session <fic>  --home <dir>  --json
  review <action>     Revue du reservoir (garde de consentement) : list|show|apply|reject|auto
                        PROFIL en file, REGISTRE auto, STRUCTUREL toujours en file (jamais auto)
                        --status <s>  --library <dir>  --home <dir>  --json
  consolidate         Consolidation initiale : fond les fiches memoire portefeuille en un APERCU
                        capé PROFIL/REGISTRE (curation) pour revue sur DIFF ; N'APPLIQUE RIEN
                        --source <dir>  --home <dir>  --json
  observe             Observation SILENCIEUSE d'Odin (store non-gate, distinct du canon review) :
                        --project <p> "note" | --portfolio "note" | list
                        --home <dir> (defaut <IAKAFRAME_ROOT>/.iaka/observation/)  --root  --json
  portfolio           Vue agregee du portefeuille (LECTURE SEULE) : def/version/arbre/commit/jalons
                        --root <chapeau>  --json  --ascii
  range <all|projet>  Sauvegarde le portefeuille (depot restic chiffre). SUR COMMANDE : rien
                        n'est planifie. "all" = tout le chapeau, SECRETS COMPRIS, sans exclusion ;
                        un nom de projet inconnu est REFUSE (jamais un repli sur "all")
                        --list --root <chapeau> --repository <url> --password-command <cmd>
                        --exclude-file <f> --dry-run --json  (n'appelle jamais forget/prune)
                        SIGNALE les branches locales sans copie distante (avant restic, puis en
                        rappel apres le OK) : celles dont des commits n'existent sur AUCUNE ref
                        distante. Jamais bloquant. Motifs a ecarter dans
                        config/sauvegarde-branches-ignorees.txt (vide ; ecarter n'est pas taire)
                        --branches  BALAYAGE SEUL, sans lancer restic (lecture seule, exit 0)
  root                Affiche le dossier chapeau resolu (~/work | C:\\work)

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
    case 'config':   runConfig(rest); break;
    case 'agents':   runAgents(rest); break;
    case 'skills':   runSkills(rest); break;
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
