// iakaframe — registre DECLARATIF des verbes et sous-verbes du CLI (Lot 0, source unique de
// l'inventaire, specs/instructions/cli-mode-guide-selections.md § LOT 0).
//
// POURQUOI CE FICHIER. `iakaframe --help` etait une constante de prose ecrite a la main
// (index.js:51-189, avant ce lot) : sans inventaire lisible par MACHINE, l'aide humaine, le futur
// menu terminal (Lot A, non lance) et les commandes Claude Code (Lot B) devaient chacune
// re-enumerer les verbes — soit en parsant de la prose (fragile), soit a la main (derive garantie).
// Le dépôt connait deja ce raisonnement (index.js, doctrine EXPECTED_COPIES/EXPECTED_DERIVED) :
// « un nombre duplique a la main finit toujours par mentir ». Un INVENTAIRE duplique a la main
// ment de la meme facon. Ce registre est desormais CETTE source unique.
//
// FORME (imposee par l'instruction, § LOT 0) : chaque entree porte `id`, `resume`, `sousVerbes`,
// `options`, et pour chaque parametre a vocabulaire ferme son `autorite` — le NOM du symbole
// source (cf. M7 de l'instruction), JAMAIS les valeurs elles-memes (celles-ci vivent dans le
// module qui les exporte reellement ; les recopier ici recreerait une seconde source de verite,
// exactement ce que ce registre existe pour eviter — cf. garde G3a/G5, cli/test/).
//
// `options` reste un INDEX des drapeaux (noms de flags), pas une reecriture de la prose complete
// de chaque `--help` : le detail exhaustif (defauts, exemples, invariants) reste porte par le
// fichier de commande lui-meme (`cli/src/commands/<verbe>.js`, USAGE/HELP locaux, INCHANGES par ce
// lot) — `iakaframe <verbe> --help` demeure l'autorite fine. Ce registre est un INDEX, pas une
// duplication de cette autorite.
//
// `guideClaudeCode` porte la decision de COUVERTURE du Lot B (quels verbes recoivent une entree
// `iaka-<verbe>.md` generee, cf. cli/scripts/gen-iaka-commands.mjs) : `{ generer, motif }`.
// `generer:false` DOIT toujours porter un `motif` explicite (jamais une exclusion silencieuse,
// meme discipline que le registre de corpus D-3/D-5 de ce depot, `cli/package.json:24`). C'est un
// arbitrage de COUVERTURE, pas de securite : un verbe non genere reste utilisable tel quel au
// terminal, et generer une entree ne fait jamais plus que deleguer verbatim au CLI (A7) — aucune
// garde du CLI n'est jamais contournee par cette liste.
//
// Zero dependance runtime (module de donnees pur, aucun import de lib metier — cf. G3a : aucune
// valeur d'autorite n'est copiee ici, seulement son NOM).
import { EXPECTED_COPIES, EXPECTED_DERIVED } from './vendor.js';

// resume() est normalement une chaine ; SEUL `vendor-check` en a besoin en fonction (le nombre de
// fixtures vendorees est calcule, pas un litteral — meme motif que EXPECTED_COPIES/EXPECTED_DERIVED
// dans index.js). resumeOf()/optionsOf() normalisent les deux formes pour les consommateurs.
export function resumeOf(entree) {
  return typeof entree.resume === 'function' ? entree.resume() : entree.resume;
}

export function optionsOf(entree) {
  return Array.isArray(entree.options) ? entree.options : [];
}

export const VERBES = [
  {
    id: 'onboard',
    resume: 'Met en place la methode : structure + Forgejo + commit + etat des lieux + push',
    options: ['--path <dir>', '--node <n>', '--repo <nom>', '--description "ascii"', '--version vX.Y.Z', '--skip-forgejo', '--no-push', '--force', '--umbrella --init-projects'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'destructif/reseau (creation de depot Forgejo + push) — exclu explicitement du Lot B' },
  },
  {
    id: 'init',
    resume: 'Deploie le kit + marqueur .iakaframe (non destructif)',
    options: ['--path <dir>', '--node <n>', '--force'],
    sousVerbes: [],
    parametres: [],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'snapshot',
    resume: 'Etat des lieux du projet (journal + MD + HTML)',
    options: ['--path <dir>', '--reason version|pause|reprise|manual', '--version', '--note'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'texte libre (--note) et effet de bord de journalisation — exclu explicitement du Lot B' },
  },
  {
    id: 'update',
    resume: 'Checkpoint : snapshot + commit global + push',
    options: ['--path <dir>', '--repo <nom>', '--reason', '--version', '--note', '--message', '--no-push', '--home'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'reseau (push) — exclu explicitement du Lot B ; deja couvert par /iaka-update (skill iakaframe-update)' },
  },
  {
    id: 'repo',
    arguments: '[<nom>]',
    resume: "Branche le remote d'un depot git EXISTANT (geste provider-neutre)",
    options: ['--path <dir>', '--repo <nom>', '--provider <nom> (defaut forgejo)', '--create', '--description "ascii"'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'reseau (creation de depot distant) — exclu explicitement du Lot B' },
  },
  {
    id: 'services',
    resume: 'Sonde git(Forgejo) / Ollama / ComfyUI',
    options: ['--hosts a,b,c', '--json', '--out <fichier>', '--timeout <sec>'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'reseau (sonde des hotes) — exclu explicitement du Lot B ; deja couvert par /iaka-services' },
  },
  {
    id: 'canaux',
    resume: "Etat des depots synchrones, MESURE EN DIRECT (a jour/retard/avance/divergent/injoignable)",
    options: ['--path <dir>', '--remotes a,b,c', '--branch <nom>', '--rattraper', '--timeout <sec>', '--json'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'reseau (mesure + eventuel push en avance rapide) — exclu explicitement du Lot B' },
  },
  {
    id: 'endpoints',
    resume: "Pendant en LECTURE de canaux : etat MESURE des endpoints d'auto-update Tauri",
    options: ['--app <dir>', '--conf <fichier>', '--url a,b,c', '--premier', '--artefacts', '--manifeste <f>', '--timeout <sec>', '--json'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'reseau (sonde des endpoints) — exclu explicitement du Lot B' },
  },
  {
    id: 'config',
    resume: "Ecrit/maj <projet>/iakaframe.json (runner + nœud)",
    options: ['--path <dir>', '--runner claude-code|ollama|litellm|codex', '--node <n>', '--aider-model <m>'],
    sousVerbes: [],
    parametres: [
      { nom: 'runner', autorite: { symbole: 'RUNNER_KINDS', module: 'lib/vocab.js' } },
      { nom: 'node', autorite: { symbole: 'NODE_KINDS', module: 'lib/vocab.js' } },
    ],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'agents',
    resume: 'Equipe de personas : list | affect | fullteam | status',
    options: ['--agent <nom>', '--project <dir>', '--global', '--force', '--json'],
    sousVerbes: [
      { id: 'list', resume: 'Inventaire des personas de la team active (+ skills resolues)', options: ['--json'] },
      { id: 'affect', resume: 'Affecte une persona au projet', options: ['--agent <nom>', '--project <dir>'] },
      { id: 'fullteam', resume: "Affecte toute l'equipe au projet", options: ['--project <dir>', '--force'] },
      { id: 'status', resume: 'Statut de deploiement des personas', options: ['--json'] },
    ],
    parametres: [],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'skills',
    resume: "Deploie l'union resolue des skills -> <cible>/.claude/skills/ (non destructif)",
    options: ['--project <dir>', '--global', '--check', '--json'],
    sousVerbes: [
      { id: 'deploy', resume: 'Deploie/verifie les skills resolues de la team active', options: ['--project <dir>', '--global', '--check', '--json'] },
    ],
    parametres: [],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'models',
    resume: "Modeles d'IA suggeres par roleKey + mise a disposition (INTERACTIF)",
    options: ['--json', '--hosts a,b,c', '--timeout <sec>', '--path <projet>', '--root <bibliotheque>'],
    sousVerbes: [
      {
        id: 'set',
        arguments: '<personaId> <modele>',
        enteteAide: true,   // « models set » a sa propre ligne dans l'aide globale (grammaire distincte)
        resume: "Surcharge le modele d'UNE persona POUR CE PROJET (etage AFFECTATION)",
        options: ['--path <projet>', '--root <dir>', '--force', '--json'],
        parametres: [
          { nom: 'personaId', autorite: { symbole: 'personasForTarget', module: 'lib/generate-agents.js' } },
          { nom: 'modele', autorite: { symbole: 'ACCEPTED_VOCABULARY', module: 'lib/project-models.js' } },
        ],
      },
      {
        id: 'unset',
        arguments: '<personaId>|--all',
        enteteAide: true,
        resume: 'Retire une surcharge de projet (et son contrat projete)',
        options: ['--path <projet>', '--json'],
        parametres: [
          { nom: 'personaId', autorite: { symbole: 'readModelOverrides', module: 'lib/project-models.js' } },
        ],
      },
    ],
    parametres: [],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'go',
    arguments: '<projet>',
    resume: 'Lance action du projet via son runner (claude-code|ollama|litellm|codex)',
    options: ['--path <dir>', '--runner <r>', '--do "tache"'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'texte libre (--do) declenchant une execution — exclu explicitement du Lot B' },
  },
  {
    id: 'banner',
    arguments: '<texte>',
    resume: 'Titre ASCII (FIGlet embarque, zero dep)',
    options: ['--font <nom>'],
    sousVerbes: [],
    parametres: [],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'brief',
    arguments: '<projet>',
    resume: 'Entree projet : titre + tableau (derniere etape + backlog) + agents',
    options: ['--path <dir>', '--font <nom>'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'deja couvert par /iaka-brief' },
  },
  {
    id: 'recap',
    arguments: '<projet>',
    resume: 'Fermeture : tableau recap session (commits + agents + projet)',
    options: ['--path <dir>', '--n <nb commits>'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'deja couvert par /iaka-recap' },
  },
  {
    id: 'jalon',
    resume: 'Cadre un jalon (gate) : titre Standard + tableau emetteur/contenu/recepteur',
    options: ['--project', '--name', '--from', '--to', '--content', '--files a:1,b:2', '--next', '--validated'],
    sousVerbes: [],
    parametres: [],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'list',
    arguments: '[type]',
    resume: 'Inventaire de la bibliotheque (pool + assemblages) par scan',
    options: ['--root <dir>', '--ascii', '--json'],
    sousVerbes: [],
    parametres: [
      { nom: 'type', autorite: { symbole: 'COLLECTION_TYPES', module: 'lib/library.js' } },
    ],
    guideClaudeCode: { generer: false, motif: 'deja couvert par /iaka-list' },
  },
  {
    id: 'show',
    arguments: '<id>',
    resume: "Contrat d'un atome/assemblage : frontmatter + corps",
    options: ['--type <collection>', '--json', '--root <dir>'],
    sousVerbes: [],
    parametres: [
      { nom: 'id', autorite: { symbole: 'scan', module: 'lib/library.js' } },
    ],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'add',
    arguments: '<kind> <fic>',
    resume: 'Livre un assemblage, ou scaffolde un atome de pool type neuf (valide refs I1)',
    options: ['--root <dir>', '--force', '--json'],
    sousVerbes: [],
    parametres: [
      { nom: 'kind', autorite: { symbole: 'ASSEMBLY_KINDS', module: 'lib/scaffold.js' } },
      { nom: 'kind', autorite: { symbole: 'POOL_KINDS', module: 'lib/scaffold.js' } },
    ],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'remove',
    arguments: '<kind> <id>',
    resume: "Retire l'assemblage/skill : team|method|binding|skill (le - de add)",
    options: ['--cascade', '--yes', '--root <dir>', '--json'],
    sousVerbes: [],
    parametres: [
      { nom: 'id', autorite: { symbole: 'scan', module: 'lib/library.js' } },
    ],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'attach',
    arguments: '<skill>',
    resume: 'Attache un skill a un persona : mute skills:[] du persona',
    options: ['--persona <id>', '--force', '--json'],
    sousVerbes: [],
    parametres: [
      { nom: 'skillId', autorite: { symbole: "scan('skills')", module: 'lib/library.js' } },
      { nom: 'personaId', autorite: { symbole: "scan('personas')", module: 'lib/library.js' } },
    ],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'detach',
    arguments: '<skill>',
    resume: "Detache un skill d'un persona : retire de skills:[] (le - de attach)",
    options: ['--persona <id>', '--json'],
    sousVerbes: [],
    parametres: [
      { nom: 'skillId', autorite: { symbole: 'readPersonaSkills', module: 'lib/remove.js' } },
      { nom: 'personaId', autorite: { symbole: "scan('personas')", module: 'lib/library.js' } },
    ],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'assemble',
    arguments: '<m> <t>',
    resume: 'Compose un kit (methode+team[+binding]) - dry-run par defaut',
    options: ['--write', '--binding <id>', '--json'],
    sousVerbes: [],
    parametres: [
      { nom: 'methodId', autorite: { symbole: "scan('methods')", module: 'lib/library.js' } },
      { nom: 'teamId', autorite: { symbole: "scan('teams')", module: 'lib/library.js' } },
    ],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'vendor-check',
    resume: () => `Constate que les ${EXPECTED_COPIES + EXPECTED_DERIVED} fixtures vendorees de iakaFrameGUI sont fideles au canon`,
    options: ['--strict', '--gui <dir>', '--root <dir>', '--json'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'verbe de garde technique (CI/maintenance cross-repo), pas un usage direct — recommandation Lot B' },
  },
  {
    id: 'frame',
    resume: "Garde d'anonymisation du miroir + graphe + ossature d'un frame",
    options: ['--frame <dir>', '--verbose', '--json', '--root <dir>', '--path <projet>'],
    sousVerbes: [
      { id: 'verify', resume: "Garde d'anonymisation du miroir frames/releases/ : gates G1-G6 par CLASSES", options: ['--frame <dir>', '--verbose', '--json'] },
      { id: 'lint', resume: "Validateur de graphe d'un descripteur de frame", options: ['--all', '--strict', '--json', '--root <dir>'],
        parametres: [{ nom: 'id', autorite: { symbole: "scan('frames')", module: 'lib/library.js' } }] },
      { id: 'new', resume: "Ossature d'un frame neuf, lint-clean par construction", options: ['--force', '--json', '--root <dir>'] },
      { id: 'use', resume: 'Pose la frame active du projet : ecrit iakaframe.json cle "frame"', options: ['--path <projet>', '--json', '--root <dir>'],
        parametres: [{ nom: 'frameId', autorite: { symbole: "scan('frames')", module: 'lib/library.js' } }] },
    ],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'verbe de garde/composition avancee (anonymisation, ossature) — recommandation Lot B, mutation sensible du pointeur de frame' },
  },
  {
    id: 'switch',
    idDisplay: 'switch|use',
    arguments: '<m> <t>',
    resume: 'Bascule un PROJET (execution) vers une methode/team (alias : use)',
    options: ['--path <dir>', '--binding <id>', '--node <n>', '--rollback', '--root <dir>', '--force', '--json'],
    sousVerbes: [],
    parametres: [
      { nom: 'methodId', autorite: { symbole: "scan('methods')", module: 'lib/library.js' } },
      { nom: 'teamId', autorite: { symbole: "scan('teams')", module: 'lib/library.js' } },
    ],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'memory',
    arguments: '<action>',
    resume: 'Canon du portefeuille : init|path|config|list|add|replace|remove',
    options: ['--home <dir>', '--json'],
    sousVerbes: [
      { id: 'init', resume: 'Cree/complete le layout du canon (non destructif)', options: ['--home <dir>', '--json'] },
      { id: 'path', resume: 'Affiche le chemin du canon resolu', options: ['--home <dir>', '--json'] },
      { id: 'config', resume: 'Affiche la config resolue (plafonds, seuils, consentement, cadence)', options: ['--home <dir>', '--json'] },
      { id: 'list', resume: "Liste les entrees d'un etat (profil|registre)", options: ['--home <dir>', '--json'] },
      { id: 'add', resume: 'Ajoute une entree datee (idempotent), refuse si plafond depasse', options: ['--home <dir>', '--json'] },
      { id: 'replace', resume: 'Remplace une entree existante', options: ['--home <dir>', '--json'] },
      { id: 'remove', resume: 'Retire une entree (idempotent)', options: ['--home <dir>', '--json'] },
    ],
    parametres: [],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'produit',
    arguments: '<action>',
    resume: 'Canon PROJET (connaissance du produit, revisee EN PLACE, versionnee) : init|path|config|list|add|replace|remove',
    options: ['--project <dir>', '--json'],
    sousVerbes: [
      { id: 'init', resume: 'Cree specs/canon/PRODUIT.md (non destructif)', options: ['--project <dir>', '--json'] },
      { id: 'path', resume: 'Affiche le chemin du canon projet resolu', options: ['--project <dir>', '--json'] },
      { id: 'config', resume: 'Affiche le plafond resolu', options: ['--project <dir>', '--json'] },
      { id: 'list', resume: 'Liste les entrees du canon produit', options: ['--project <dir>', '--json'] },
      { id: 'add', resume: 'Ajoute une entree datee (idempotent), refuse si plafond depasse', options: ['--project <dir>', '--json'] },
      { id: 'replace', resume: 'REVISE une entree EN PLACE et la re-date', options: ['--project <dir>', '--json'] },
      { id: 'remove', resume: "Retire une entree (idempotent) — le - de add", options: ['--project <dir>', '--json'] },
    ],
    parametres: [],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'open',
    resume: "Charge le canon (PROFIL+REGISTRE) a l'ouverture, scope-agnostique, pret a injecter en session (lecture seule)",
    options: ['--home <dir>', '--project <dir>', '--json'],
    sousVerbes: [],
    parametres: [],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'recall',
    arguments: '<requete>',
    resume: "Rappel plein-texte sur l'historique brut du canon (transcripts/)",
    options: ['--home <dir>', '--json'],
    sousVerbes: [],
    parametres: [],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'close',
    resume: 'Revue de cloture : rejoue transcripts/ -> propositions typees dans proposals/ ; N\'APPLIQUE RIEN',
    options: ['--session <fic>', '--home <dir>', '--json'],
    sousVerbes: [],
    parametres: [],
    ecriture: true,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'review',
    arguments: '<action>',
    resume: 'Revue du reservoir (garde de consentement) : list|show|apply|reject|auto',
    options: ['--status <s>', '--library <dir>', '--home <dir>', '--json'],
    sousVerbes: [
      { id: 'list', resume: 'Liste les propositions', options: ['--status <s>', '--json'] },
      { id: 'show', resume: "Detail d'une proposition", options: ['--json'] },
      { id: 'apply', resume: 'Applique (geste humain) : materialise + statut applique', options: ['--library <dir>', '--json'] },
      { id: 'reject', resume: 'Rejette : statut rejete, rien materialise', options: ['--json'] },
      { id: 'auto', resume: 'Passe automatique : applique le seul auto-applicable (REGISTRE)', options: ['--json'] },
    ],
    parametres: [],
    guideClaudeCode: { generer: false, motif: "deja couvert par /iaka (alias /learning, skill iakaframe-learning) qui pilote review avec le geste de consentement — un doublon nu court-circuiterait ce contexte" },
  },
  {
    id: 'consolidate',
    resume: 'Consolidation initiale : fond les fiches memoire portefeuille en un apercu cape (curation, revue sur DIFF) ; N\'APPLIQUE RIEN',
    options: ['--source <dir>', '--home <dir>', '--json'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: "amorcage ponctuel du canon (usage unique a l'installation), pas un geste courant" },
  },
  {
    id: 'observe',
    resume: "Observation SILENCIEUSE d'Odin (store non-gate, distinct du canon review)",
    options: ['--home <dir>', '--root <dir>', '--json'],
    sousVerbes: [
      { id: 'list', resume: 'Relit le store', options: ['--home <dir>', '--json'] },
    ],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'observation silencieuse par construction, pas destinee a etre sollicitee au menu' },
  },
  {
    id: 'portfolio',
    resume: 'Vue agregee du portefeuille (LECTURE SEULE) : def/version/arbre/commit/jalons',
    options: ['--root <chapeau>', '--json', '--ascii'],
    sousVerbes: [],
    parametres: [],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'range',
    arguments: '<all|projet>',
    resume: 'Sauvegarde le portefeuille (depot restic chiffre), SUR COMMANDE ; --branches signale les branches locales sans copie distante',
    options: ['--list', '--branches', '--root <chapeau>', '--repository <url>', '--password-command <cmd>', '--exclude-file <f>', '--dry-run', '--json'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: 'destructif potentiel (secrets compris, sans exclusion) — exclu explicitement du Lot B' },
  },
  {
    id: 'root',
    resume: 'Affiche le dossier chapeau resolu (~/work | C:\\work)',
    options: ['--root <dir>'],
    sousVerbes: [],
    parametres: [],
    ecriture: false,
    guideClaudeCode: { generer: true },
  },
  {
    id: 'commands',
    resume: "Inventaire machine des verbes et sous-verbes (source unique de l'aide et du guidage)",
    options: ['--json'],
    sousVerbes: [],
    parametres: [],
    guideClaudeCode: { generer: false, motif: "verbe d'introspection interne consomme par /iaka-guide et /iaka-help — une entree dediee ferait doublon direct" },
  },
];

// Alias de dispatch (index.js) qui ne comptent PAS comme un verbe distinct — au sens ou l'aligne
// deja la doc (`docs/commandes.md`) et la mesure de l'instruction (39 `case`, 38 verbes distincts).
export const ALIAS_VERBES = { use: 'switch' };

export function findVerbe(id) {
  const canon = ALIAS_VERBES[id] || id;
  return VERBES.find(v => v.id === canon) || null;
}
