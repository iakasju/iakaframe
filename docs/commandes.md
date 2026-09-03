# Commandes de la méthode iakaframe — référence unique

> Référence **exhaustive et maintenue** de toutes les façons de piloter la méthode :
> les **déclencheurs conversationnels / skills** (en session Claude Code) et la **CLI
> `iakaframe`** (Node, cross-OS, zéro dépendance runtime).

## Statut

| Élément | Valeur |
|---|---|
| Dernière mise à jour | 2026-09-03 |
| Version CLI documentée | `@naonedge/iakaframe` **v0.39.0** (source : `cli/package.json`) |
| Commandes CLI couvertes | **39 / 39** verbes distincts (un par `case` de `cli/src/index.js`), **+ 1 alias** (`use` → `switch`) = **40 `case`** au total |
| Sources de vérité | `~/.claude/CLAUDE.md` (déclencheurs), **`cli/src/lib/verbes.js`** (registre déclaratif — source UNIQUE de l'inventaire, dont dérivent le bloc `HELP` de `cli/src/index.js` et `iakaframe commands --json`), `cli/src/commands/*.js` |

> ⚠️ **Le compteur ci-dessus était périmé (29/29) avant le Lot 0** (mode guidé du CLI,
> `specs/instructions/cli-mode-guide-selections.md`) : `iakaframe --help` était une constante de
> prose écrite à la main, sans inventaire lisible par machine. Il est corrigé dans le même lot que
> celui qui introduit le registre (`cli/src/lib/verbes.js`) et le verbe `commands` — cohérent avec
> la discipline du fichier lui-même : « un nombre dupliqué à la main finit toujours par mentir ».

## Règle de maintenance (à respecter)

Cette doc **porte sa propre discipline** :

- **Toute commande CLI ajoutée ou modifiée** — c.-à-d. un fichier dans `cli/src/commands/`
  **+** un `case` dans `cli/src/index.js` **+** son entrée dans le bloc `HELP` — **DOIT**
  être répercutée ici (partie B), dans le même lot de travail.
- **Tout déclencheur de skill créé/renommé/supprimé** (dans `~/.claude/CLAUDE.md` ou une
  skill) **DOIT** être répercuté ici (partie A).
- **Vérifier la complétude (moyen léger)** : comparer la liste des `case` de
  `cli/src/index.js` avec les entrées de la partie B, p. ex.
  `grep -oE "case '\w+'" cli/src/index.js` vs les lignes de la table B — tout `case`
  absent de la doc = un trou à combler. **Moyen fort, désormais préféré** : `iakaframe
  commands --json` (registre `cli/src/lib/verbes.js`, dont dérive `--help`) — une seule
  lecture donne les 39 `id` sans reconstituer soi-même le mapping alias. **Attention au
  décompte** si l'on reste au `grep` : il rend **40** `case` alors qu'il n'y a que **39
  verbes distincts**, car `use` et `switch` partagent un même traitement (`use` est un
  **alias**, documenté sur la ligne de `switch` — jamais compté deux fois). `help`/`version`
  sont traités **avant** le `switch` (options globales) et ne comptent pas comme verbes.
- **Compteur = partie du contrat.** Si la ligne « Dernière mise à jour » est rafraîchie,
  **tous** les compteurs de ce fichier doivent avoir été revérifiés dans le même geste :
  une date fraîche sur un compteur faux produit un doc périmé qui **a l'air** vérifié.
- Ne rien auto-générer pour l'instant : c'est une **discipline documentaire**, pas un script.

---

# A. Commandes conversationnelles / skills

Déclencheurs tapés **en session Claude Code** (langage naturel ou `/skill`). Formulations
reprises de `~/.claude/CLAUDE.md` — non inventées.

## A.1 Bootstrap de l'équipe

| Déclencheur | Alias | Ce que ça fait |
|---|---|---|
| `iakastart` | `iakaframe`, `odin` | Invoque la skill **`iakastart`** : affiche le banner ASCII `IAKAFRAME` + le **roster des 9 agents** (dont `feanor`, à activation explicite) et **rend les agents prêts au dispatch — sans en spawner aucun**. Déclenchable en **début** ou en **cours** de session. |

Précisions :
- Les alias `iakaframe` et `odin` mènent à la **même** skill `iakastart` ; **`odin`
  conserve en plus** sa posture portefeuille via la skill `iakaframe-odin` (inchangée).
- **Déclenchement sans hook** : uniquement via le champ `description` de la skill + la règle
  du `CLAUDE.md` global. Aucun hook/watcher/daemon/slash custom pour *déclencher* iakastart.
  (Les gardes-fous par hooks restent autorisés ailleurs : garde d'identité, garde du canal
  des gestes.)

## A.2 Cycle de vie d'un projet

| Déclencheur | Ce que ça fait |
|---|---|
| `init iakaframe` (aussi « initialise / lance iakaframe ») | Met la méthode en place dans le répertoire courant. **Répertoire vide → nouveau projet** (structure + dépôt Forgejo + 1er commit + état des lieux + push, nom de dépôt = nom du répertoire). **Répertoire avec du dev → reprise non destructive** (déploie la structure autour du code, branche Forgejo si pas de remote, génère l'état des lieux de reprise, en fait la synthèse et propose la prochaine étape). |
| `update iakaframe` (ou « update » dans un projet de la méthode) | **Régénère l'état des lieux** puis fait un **commit global** (`git add -A` + commit) **et push**. Options usuelles : `--reason version --version vX.Y.Z --note "..."`, `--no-push`. |

**Auto-détection init ↔ update** (via l'API Forgejo) : `init iakaframe` sur un dépôt **déjà
présent** sur Forgejo bascule en `update` ; `update iakaframe` sur un dépôt **absent** (ou
sans git local) bascule en `init`. On peut donc taper indifféremment l'une ou l'autre.

> Note : ces déclencheurs conversationnels s'appuient sur la CLI `iakaframe onboard` /
> `update` / `snapshot` (partie B), cross-OS.

## A.3 Dispatch des agents par leur nom

Nommer un agent le met à contribution dans son **périmètre étanche**. Le **roster complet
est porté par la skill `iakastart`** ; rappel synthétique :

| Agent | Rôle (résumé) |
|---|---|
| **odin** | Décideur-relais / posture portefeuille (orchestration, arbitrages). |
| **aragorn** | Chef d'orchestre / routage des demandes vers le bon expert. |
| **gandalf** | Architecte-cadreur : rédige les instructions (`specs/instructions/`), jamais de code. |
| **gimli** | Développeur-devops : implémente, build, teste, commite. |
| **legolas** | Qualité / gate : vérifie avant de livrer. |
| **charon** | Squad prod, le passeur : bascule stage → prod, accès/SSO, rollback — **sur feu vert humain**. |
| **helm** | Squad prod, le veilleur : santé de la prod, charge, **alerte** — **sans ordre**. |
| **loki** | Mise en forme visuelle / habillage (HTML, présentation). |
| **nathalie** | Doc utilisateur + mémoire humaine (AppFlowy). |

## A.4 Convention d'invocation des skills

Les skills s'invoquent par `/<skill>` (mécanisme natif de découverte/invocation). Exemples de
skills-rôles : `iakaframe-odin`, `iakaframe-nathalie`, `iakaframe-appflowy-doc`. La skill
`iakastart` est, elle, déclenchée par langage naturel (cf. A.1).

Certaines skills sont des **sous-skills partagés** : composés par plusieurs skills-rôles via
`subskills:`, ils restent invocables directement.

| Skill | Composée par | Ce qu'elle fait |
|---|---|---|
| `iakaframe-jalon` | `iakaframe-aragorn`, `iakaframe-cadrage` | Pose un **jalon** (gate visible) à une transition de phase : titre ASCII FIGlet `<PROJET> - JALON : <nom>` + tableau à 3 zones **émetteur / contenu / récepteur**, fichiers en `chemin:ligne`. S'appuie sur le verbe CLI `jalon` (cf. B.3). |

## A.5 Mode guidé — sélection de commande dans Claude Code (Lot B)

Réf. : `specs/instructions/cli-mode-guide-selections.md` (Lot 0 = pivot machine, **Lot B** =
cette section ; **Lot A**, le mode guidé au **terminal** — sélection de **valeur** — est décrit
en § B.0).

Taper `/iaka` dans Claude Code **filtre nativement** toutes les commandes `iaka*` déployées
(mécanisme natif, aucun code à nous) — ce qui manquait n'était pas un sélecteur, mais la
**couverture** (10 verbes sur 38 avant ce lot) et une source unique pour la produire.

| Déclencheur | Ce que ça fait |
|---|---|
| `/iaka-guide` | **Aiguilleur** (jamais un backend, A7) : interroge `iakaframe commands --json`, propose les verbes disponibles, **affiche la commande équivalente** (`→ iakaframe <verbe> …`, écho obligatoire et non désactivable, A3) puis l'exécute et **restitue la sortie VERBATIM**. N'énumère **rien** de mémoire. `/iaka` (alias de `/learning`, boucle de consentement du réservoir) reste **intact** — ce n'est **pas** ce déclencheur (M9 : réaffecter `/iaka` casserait `learning-skill.test.js` et détournerait la garde de consentement). |
| `/iaka-<verbe>` (générées) | Pour chaque verbe dont `guideClaudeCode.generer === true` dans le registre, un aiguilleur **thin** est **généré** (`cli/scripts/gen-iaka-commands.mjs`) : exécute `iakaframe <verbe> $ARGUMENTS`, affiche l'écho A3, restitue verbatim. **Liste vivante, jamais recopiée ici** (ce serait exactement la 2ᵉ source de vérité que ce lot combat) : `iakaframe commands --json` (champ `guideClaudeCode`) ou `ls kits/iakaframe-claude/.claude/commands/iaka-*.md` en donnent l'état réel. |

**Couverture.** Un verbe **exclu** de la génération porte toujours un `motif` explicite dans le
registre (`guideClaudeCode.motif`, jamais une exclusion silencieuse — même discipline que le
registre de corpus `cli/package.json:24`). Depuis le lot `fix/lotB-conditions-de-chute-et-temoin-A3`,
chaque `motif` porte en outre sa **condition de chute** — ce qui, mesuré ou survenu, le rendrait
faux (ex. « chute si `--note` disparaît ou devient un vocabulaire fermé ») — sous peine de compter
comme un motif **non déclaré** (garde `cli/test/guard-verbes-registre.test.js`, G5c). Trois
familles de motifs :

1. **Déjà couvert** par une entrée `/iaka-*` **hand-authored** antérieure à ce lot (`list`,
   `brief`, `recap`, `services`, `update` → invocateurs directs ou de skill déjà en place) ;
2. **Destructif / réseau / texte libre**, exclu explicitement par l'instruction (`onboard`,
   `snapshot`, `update`, `repo`, `services`, `canaux`, `endpoints`, `go`, `range`) ;
3. **Verbe de garde ou déjà couvert par un parcours plus riche** (`vendor-check` : diagnostic/CI,
   pas un usage direct ; `frame` : **arbitrage de GRAIN nommé comme tel** — le registre ne
   granularise pas par sous-verbe, alors que 3 de ses 4 sous-verbes (`verify`/`lint`/`new`) sont
   des outils de garde CI et que son 4ᵉ, `use`, mute le pointeur de frame du projet exactement
   comme `switch` (généré, lui) mute méthode/team — chute le jour où le registre porte une
   granularité par sous-verbe ; `review` : déjà piloté par `/iaka`/`/learning` avec le geste de
   consentement — un doublon nu court-circuiterait ce contexte ; `consolidate`, `observe` :
   amorçage ponctuel / observation silencieuse par construction ; `commands` : consommé par
   `/iaka-guide` et `/iaka-help`, une entrée dédiée ferait doublon direct).

**Génération, jamais écriture à la main.** `node cli/scripts/gen-iaka-commands.mjs [--check]`
régénère les fichiers couverts depuis `resume` (en-tête `NE PAS ÉDITER À LA MAIN`) et cible **le
kit** (`kits/iakaframe-claude/.claude/commands/`) — **jamais** `~/.claude/commands/` directement,
le déploiement restant le geste existant (`iakaframe init` / `skills deploy`). `--check` échoue
(exit 1) si un fichier généré diverge du registre — c'est le verrou anti-dérive kit ↔ CLI
(`cli/test/guard-verbes-registre.test.js`, gardes G5a/G5b/G5c).

---

## B.0 Mode guidé — sélection de VALEUR au terminal (Lot A)

Réf. : `specs/instructions/cli-mode-guide-selections.md` § LOT A. Complémentaire du Lot B (§ A.5,
qui guide **quelle commande** lancer, dans Claude Code) : le Lot A guide **quelle valeur** passer
à un paramètre, **au terminal**, en Node pur (zéro dépendance — `cli/package.json` ne porte
toujours **aucune** clé `dependencies`/`devDependencies`).

**Drapeau `--guide`** — opt-in, **invisible des appelants existants** : sur les **10 cibles**
suivantes, celles dont un paramètre a une **autorité énumérable** en place (A5) :

| Cible | Ce qui est proposé | Autorité |
|---|---|---|
| `models set --guide` | persona, puis valeur de modèle | `personasForTarget`, `ACCEPTED_VOCABULARY` |
| `models unset --guide` | surcharges **posées** sur le projet | `readModelOverrides` |
| `show --guide` | collection, puis id | `COLLECTION_TYPES`, `scan()` |
| `list --guide` | collection | `COLLECTION_TYPES` |
| `add --guide` | `kind`, puis id/fichier (**texte libre**, aucune autorité possible sur une cible neuve — M5) | `ASSEMBLY_KINDS`, `POOL_KINDS` |
| `remove --guide` | `kind`, puis id **existant** | `scan()` |
| `attach --guide` | skill, puis persona | `scan('skills')`, `scan('personas')` |
| `detach --guide` | persona, puis un skill **attaché** | `scan('personas')`, frontmatter du persona |
| `frame use --guide` | frames du réservoir | `scan('frames')` |
| `switch --guide` / `use --guide` | méthode, puis team | `scan('methods')`, `scan('teams')` |

**Trois règles, gravées (A4)** :
1. Le guidage propose **d'abord** les valeurs de l'autorité, **plus** une entrée « saisir une
   valeur libre » (sauf `add <id/fichier>`, sans autorité par construction : simple question texte).
2. En valeur libre, il **assemble l'argv et appelle le chemin normal** — c'est `validateModelValue()`
   (ou l'équivalent du paramètre) qui tranche, **jamais** le moteur de guidage.
3. Si la commande **refuse**, le guidage **affiche le refus tel quel et s'arrête**.

**Écho de la commande équivalente (A3)** — **obligatoire, non désactivable**, imprimé **avant**
l'exécution : `→ iakaframe models set gandalf opus[1m] --path /chemin/du/projet`. C'est ce qui
empêche le guidage de remplacer l'apprentissage du CLI — l'utilisateur repart toujours avec une
commande réutilisable, transmissible à un agent.

🛑 **Interdit non négociable (A4.3)** : `--force`, `--yes`, `--cascade`, `--autoriser-creation-depot`
ne sont **jamais** ajoutés par le guidage, ni proposés comme entrée de menu — un guidage qui les
proposerait annulerait la garde de vocabulaire posée par l'Amendement A. `switch --guide` est
**sans effet** si `--rollback` est demandé (jamais deviné).

**Deux paliers, derrière la MÊME interface** (`cli/src/lib/guidage.js`) — le palier 1 est le
**repli automatique** du palier 2, pas un brouillon jeté :
- **Palier 1** — listes numérotées (`node:readline/promises`), le même patron que le process
  interactif de `models` (`pickAndAct`). Testé automatiquement, y compris **en process réel** avec
  un flux d'entrée factice (`cli/test/guidage-non-interactif.test.js`).
- **Palier 2** — flèches, surbrillance, filtre à la frappe (mode brut, `setRawMode`). **Non
  testable de bout en bout** (Node n'a pas de pty ; `node-pty` serait une dépendance, interdite) —
  sa recette est **manuelle, sur deux OS** : `specs/recettes/mode-guide-palier-2-manuelle.md`.
  Ctrl-C y est intercepté explicitement (la doc Node `tty` avertit qu'il n'émet plus SIGINT en
  mode brut) et le terminal est restauré dans **tous** les chemins de sortie.

**Règle unique de non-interactivité (`cli/src/lib/interactif.js`, `peutDemander()`)** — remplace
les deux règles qui divergeaient avant ce lot (`models` ne regardait que `stdin.isTTY`, `onboard`
regardait `stdout.isTTY` + `CI` + `IAKA_NON_INTERACTIF`) : un prompt (guidé ou pas) n'a lieu que
si **toutes** ces conditions tiennent — `stdin.isTTY` **ET** `stdout.isTTY` **ET** `CI`
absent/neutre **ET** `IAKA_NON_INTERACTIF` absent/neutre **ET** `--json` absent **ET** le flux est
« guidé » (soit `--guide`, soit un process déjà interactif par construction). `IAKA_NON_INTERACTIF`
(variable d'échappement, `1`/`true` pour forcer le mode non interactif) fonctionne sur toutes les
cibles. « Neutre » = non défini, vide, `0` ou `false` (certains runners exportent `CI=false`).

**Refus loquaces (palier 0, filet du lot)** — indépendant de `--guide` : chaque refus sur un
vocabulaire fermé, sur ces mêmes 10 cibles, liste désormais les valeurs **dérivées** de l'autorité
réelle (jamais une liste recopiée à la main) — ex. `models set <persona introuvable>` liste les
personas de la team active, `remove <kind> <id introuvable>` liste les ids existants.

---

# B. CLI `iakaframe <commande>`

`@naonedge/iakaframe` — CLI multi-OS (Windows / macOS / Linux), **zéro dépendance runtime**.
Source de vérité = le **registre déclaratif** `cli/src/lib/verbes.js` (`id`, `resume`,
`sousVerbes`, `options`, et l'**autorité** — nom du symbole source, jamais les valeurs — de chaque
paramètre à vocabulaire fermé) + un fichier par commande dans `cli/src/commands/`. Le bloc `HELP`
de `cli/src/index.js` en **dérive** (plus une constante de prose écrite à la main), de même que
`iakaframe commands --json` (verbe de lecture seule, § B.2) — **une seule source, deux rendus**.
**39 verbes distincts** (+ 1 alias, `use` → `switch`), regroupés par thème.

**Options globales** : `-h`/`--help`, `-v`/`--version`.
**Environnement** : `FORGEJO_TOKEN` (Forgejo), `IAKAFRAME_ROOT`/`--root` (dossier chapeau,
sinon `~/work`), `IAKA_MEMORY_HOME` (canon mémoire), `IAKA_NON_INTERACTIF` (force le mode non
interactif partout — mode guidé du terminal § B.0 **et** confirmations existantes).

## B.1 Mise en place & cycle de vie du projet

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `onboard` | `--path <dir> --node claude\|codex\|ollama-localhost\|ollama-lan --repo <nom> --description "ascii" --version vX.Y.Z --skip-forgejo --no-push --force` | Met en place la méthode : structure + dépôt Forgejo + commit + état des lieux + push. Mode **umbrella** : `onboard --umbrella --path <chapeau> [--init-projects]`. |
| `init` | `--path <dir> --node <n> --force` | Déploie le kit + le marqueur `.iakaframe` (**non destructif**). |
| `snapshot` | `--path <dir> --reason version\|pause\|reprise\|manual --version --note` | État des lieux (journal + MD + HTML). **Résolution de la version**, dans l'ordre : `--version` explicite → autorité `cli/package.json` (le projet `iakaframe` lui-même) → `git describe --tags` → **`package.json` du projet** → `-`. Le dernier repli évite le « Version : `-` » muet des projets non tagués ; un projet qui tague garde son comportement. **Forme de `--version`** : `vX.Y.Z` ou `X.Y.Z` (suffixe `-rc.1` / `+build` toléré) ; le préfixe `v` est **normalisé** (`0.39.0` → `v0.39.0`), toute autre forme est **refusée** (message + code de sortie 1, rien n'est écrit) — même refus via `update`, **avant** tout `git add`. La sortie de `git describe` reste **verbatim** (un tag est un nom, pas un littéral de version). **Compte de fichiers** : sur un dépôt git, `git ls-files --cached --others --exclude-standard`, soit *les fichiers que le projet versionne ou versionnera* — l'exclusion suit le `.gitignore` du projet mesuré (donc `target/`, `dist/`, `node_modules/`…), et le chiffre ne dépend plus de l'arbre depuis lequel on tire. Hors git, parcours d'arbre inchangé (hors `.git`/`node_modules`). Le **libellé** de l'état des lieux annonce la règle appliquée. |
| `update` | `--path <dir> --reason --version --note --message --no-push` | Checkpoint : snapshot + commit global + push. Refuse une `--version` mal formée **avant** tout `git add`/`commit` (cf. `snapshot`). |
| `config` | `--path <dir> --runner claude-code\|ollama\|litellm\|codex --node <n> --aider-model <m>` | Écrit/màj `<projet>/iakaframe.json` (runner + nœud). |

> `--target` = alias **déprécié** de `--node` (onboard/init/config). Alias runner legacy
> (`ps`, `iakaide`, `aider`) également dépréciés.

> **Provenance (`snapshot` et `update`)** — les deux verbes qui *écrivent* annoncent, sur une
> ligne, `cli=<dossier du CLI réellement exécuté> root=<racine visée>`. C'est le **couple** qui
> compte : lancé depuis un arbre lié, le lanceur de poste peut exécuter le CLI d'un **autre**
> dépôt, et la discordance n'est lisible que si les deux chemins sont affichés ensemble.

## B.2 Diagnostic & exécution

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `services` | `--hosts a,b,c --out <fichier> --json --timeout <sec>` | Sonde git (Forgejo) / Ollama / ComfyUI. **Hôtes neutres par défaut** (`localhost,127.0.0.1`) : renseigner `IAKAFRAME_HOSTS` (CSV) dans `~/work/.env` pour les hôtes du LAN. `--hosts` prime sur l'env var. |
| `models` | `--json --hosts a,b,c --timeout <sec> --path <projet> --root <dir> --binding <id>` | **Modèles d'IA suggérés par `roleKey`** et leur mise à disposition. Sans option : **process interactif** en 4 temps — état des lieux (suggéré / affecté / disponible, avec la **date de fraîcheur** des suggestions) → « voir les suggestions ? » → diff → **installer / remplacer / retirer sur validation explicite**. Cinq cibles : `ollama-local`, `ollama-distant`, `litellm`, `claude`, `codex` (pour les deux derniers, « installer » = **vérifier**, rien à télécharger). Source unique des suggestions : `models/suggestions.json`. **Quel modèle pour quel agent :** → [`docs/modeles-ia-des-agents.md`](modeles-ia-des-agents.md) (doc utilisateur, **générée** depuis les sources par `node cli/scripts/gen-models-doc.mjs`, actualité gardée par un test). **`--binding <id>`** choisit le binding lu et écrit — une team peut en porter plusieurs (`iakaframe-claude-default` par défaut, `iakaframe-ollama-default` pour les modèles locaux) ; un binding rattaché à une autre team est **refusé** (exit 1), jamais deviné. **Aucun téléchargement ni écriture sans gate** ; `--json` et l'absence de terminal s'arrêtent à l'état des lieux. Hôtes/ports neutres (`IAKAFRAME_HOSTS`, `IAKAFRAME_OLLAMA_PORT`, `IAKAFRAME_LITELLM_PORT`, `IAKAFRAME_LITELLM_KEY`). **`--json` rend aussi `roles[].personas[].modelSource`** (`frame`\|`projet`), **`overrideDivergences`** (surcharges décidées sans projection déployée, cf. `models set`/`unset` ci-dessous) et **`unknownOverrides`** (surcharges déjà écrites dont la valeur est hors du vocabulaire connu — **signalé, jamais refusé ni ignoré en lecture**, Amendement A/D14). ⚠️ Ici « model » = **modèle d'IA**, pas modèle de frame. |
| `models set <persona> <modèle>` | `--path <projet> --root <dir> --force --guide --json` | **Surcharge le modèle d'UNE persona POUR CE PROJET** (étage *affectation*, au-dessus du défaut de la frame, sans toucher au binding — surcharge-modele-par-projet.md). Écrit `modelOverrides[<persona>]` dans `<projet>/iakaframe.json` (non destructif) **et** projette `<projet>/.claude/agents/<persona>.md` par le **même moteur de rendu** que `agents generate` — **jamais** `~/.claude/agents/` (une surcharge de projet n'y a rien à faire : elle fuirait sur tous les autres projets du portefeuille). `<persona>` **doit** appartenir à la team de la frame active du projet, sinon **refus, rien n'est écrit**. Validation de la valeur (Amendement A, 2026-09-02, garde de vocabulaire **BLOQUANTE**) : (1) **forme** invalide (vide/blanche, espace, caractère de tête cassant le frontmatter) → **refus bloquant**, `--force` **ne le lève pas** ; (2) hors du vocabulaire connu (`sonnet`, `opus`, `haiku`, `fable`, `inherit`, ou `claude-<id>`, suffixe `[1m]` optionnel) → **refus, rien n'est écrit**, sauf **`--force`** qui écrit quand même en le disant ; (3) id complet bien formé mais non mesuré → **écrit**, avec un avertissement (un alias connu n'en émet aucun). **Signale** (sans jamais l'écrire) si la projection `.claude/agents/` n'est pas ignorée par le `.gitignore` **du projet cible**. |
| `models unset <persona>\|--all` | `--path <projet> --guide --json` | **Retire** une surcharge de projet (ou **toutes**, `--all`) : supprime l'entrée de `iakaframe.json` **et** le(s) contrat(s) de projet correspondants — retour au défaut de la frame. **Idempotent** (entrée/fichier déjà absents = pas une erreur). `--all` ne touche **jamais** un contrat de projet préexistant qui ne provient pas d'une surcharge. |
| `go <projet>` | `--path <dir> --runner <r> --do "tache"` | Lance l'action du projet via son runner (`claude-code\|ollama\|litellm\|codex` ; launchers legacy : `aider`, `iakaide`). |
| `agents` | `list \| affect \| fullteam \| status` · `--agent <nom> --project <dir> --global --force` | Équipe de personas : inventaire / affectation / équipe complète / statut. |
| `canaux` | `--path <dir> --remotes a,b,c --branch <nom> --rattraper --timeout <sec> --json` | **Écriture redondante** : état des dépôts synchrones, **mesuré en direct** (`a-jour` / `en-retard` de N / `en-avance` / `divergent` / `injoignable`) **avec la date de la mesure**. Une cible injoignable est un **état**, pas une erreur. `--rattraper` ne pousse que ce qui est une **avance rapide** et **refuse le reste en le disant** — jamais de `--force`. Le dernier état lu dans une ref locale est rendu **à part** (`dernierConnu`) : un souvenir ne se confond jamais avec une mesure. |
| `endpoints` | `--app <dir> --conf <fichier> --url a,b,c --premier --artefacts --manifeste <f> --timeout <sec> --json` | **Lecture redondante** (pendant de `canaux`) : état **mesuré** des endpoints d'auto-update d'une app Tauri. Un **200 ne suffit pas** (un dépôt privé rend 200 + page de connexion) : seul un manifeste **au contrat** (`version` + `platforms`) compte comme *servant*. Dit lequel **gagne**, combien de canaux servent, et donc si **CA-11** (« le premier endpoint peut mourir ») est tenu. `--premier` applique le contrat exact de l'updater et **ne rend alors aucun verdict de redondance**. **`--artefacts`** prolonge la mesure au **second demi-tour** — les URL de téléchargement que le manifeste **annonce** : servir un manifeste ne prouve pas qu'une mise à jour s'**installe** (le 2026-08-28, deux apps servaient leur manifeste sur deux canaux et **aucune** des cinq URL annoncées n'était téléchargeable). **`--manifeste <fichier>`** mesure les artefacts d'un manifeste **local**, *avant* publication : « ce que je m'apprête à annoncer, est-ce là ? ». |
| `root` | `--root <dir>` | Affiche le dossier chapeau résolu (`~/work` \| `C:\work`). |
| `commands` | `--json --ascii` | **Pivot du mode guidé** (Lot 0, `specs/instructions/cli-mode-guide-selections.md`) : inventaire **machine** des verbes/sous-verbes lu depuis `cli/src/lib/verbes.js` (`{ ok, count, verbes:[{id,resume,options,sousVerbes,parametres,guideClaudeCode}] }`). **Lecture seule.** C'est la source dont dérivent `--help` et les entrées Claude Code `/iaka-*` générées (§ A.5) — jamais l'inverse. |

## B.3 Rendu & rituels de session

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `banner <texte>` | `--font <nom>` (défaut : *ANSI Shadow* ; repli : *Standard*) | Titre ASCII (FIGlet embarqué, zéro dep). |
| `brief <projet>` | `--path <dir> --font <nom>` | Entrée projet : titre + tableau (dernière étape + backlog) + agents. |
| `recap <projet>` | `--path <dir> --n <nb commits>` | Fermeture : tableau récap de session (commits + agents + projet). |
| `jalon` | `--project --name --from --to --content --files a:1,b:2 --next --validated` | Cadre un jalon (gate) : titre + tableau émetteur / contenu / récepteur. |

## B.4 Bibliothèque (atomes & assemblages)

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `list [type]` | `type : personas\|skills\|principles\|rituals\|guardrails\|roles\|workflows\|scaffolds\|teams\|methods\|bindings\|kits` · `--json --ascii --root --guide` | Inventaire de la bibliothèque (pool + assemblages) par scan. `--guide` (Lot A) : propose la collection. |
| `show <id>` | `--type --json --root --guide` | Contrat d'un atome/assemblage : frontmatter + corps. `--guide` (Lot A) : propose collection puis id. |
| `add <kind> <fic>` | `kind : team\|method\|binding` · `--force --guide --json` | Livre un assemblage (valide les réfs I1). `--guide` (Lot A) : propose `kind`, puis demande l'id/fichier en texte libre (aucune autorité possible sur une cible neuve). |
| `remove <kind> <id>` | `kind : team\|method\|binding\|skill` · `--cascade --yes --root --guide --json` | Le **`−` de `add`** + la **dé-matérialisation d'un skill**. **RESTRICT** par défaut : refuse si l'élément est encore référencé (liste les référents via `findReferrers`) ; **cascade explicite** (`--cascade --yes`, jamais silencieuse) archive aussi les référents (ou, pour un skill, le détache de tous les personas) ; retrait **non destructif** → corbeille horodatée `<root>/.trash-<ts>/` **restaurable** + trace `manifest.json`. `--guide` (Lot A) : propose `kind` puis un id **existant** — ne propose **jamais** `--cascade`/`--yes`. |
| `attach <skill>` | `--persona <id>` · `--force --guide --json` | Attache un skill à un persona : **mute le seul `skills:[]`** du frontmatter (source unique de vérité) ; refuse un skill absent de la bibliothèque (I1) sauf `--force`. Le `+` symétrique de `detach`. `--guide` (Lot A) : propose skill puis persona. |
| `detach <skill>` | `--persona <id>` · `--guide --json` | Détache un skill d'un persona : retire l'id de `skills:[]` (idempotent, réversible par `attach`). Le **`−` au « titre du skill »** — affordance rendue par la vue, jamais écrite dans le corps du persona. `--guide` (Lot A) : propose persona puis un skill **attaché** à cette persona. |
| `assemble <m> <t>` | `--write --binding --json` | Compose un kit (méthode + team [+ binding]) — dry-run par défaut. |
| `switch` \| `use <m> <t>` | `--path --binding --rollback --guide --json` | Bascule un projet vers une méthode/team. (`use` = alias de `switch`.) `--guide` (Lot A) : propose méthode puis team — **sans effet** si `--rollback` est demandé (jamais deviné), ne propose jamais `--force`. |
| `vendor-check` | `--strict --gui <dir> --root --json` | **Garde de vendorage cross-repo** : constate que les **82 fixtures** vendorées par `iakaFrameGUI` (**78 copies** + **4 dérivées**) sont fidèles au canon `iakaframe`. Seule garde capable de voir la dérive **mutuellement cohérente** (binding + golden + `sha256` recalculés ensemble), invisible de la suite GUI qui compare ses copies à elles-mêmes. **Gracieux par défaut** : dépôt frère absent → `ok:false` + `status:"skipped"` + **exit 0** (jamais de blocage d'un clone isolé) ; `--strict` en fait un échec. `IAKAFRAME_GUI_ROOT` est **autoritaire** (jamais de repli silencieux sur un autre dépôt). |
| `frame verify` | `--frame <dir> --verbose --json` | **Garde d'anonymisation du miroir** `frames/releases/` : gates **G1→G6 par CLASSES**, jamais par énumération. Le gate central **G2 fonctionne par ALLOWLIST** de marque — tout `iaka*` hors liste blanche est refusé, **y compris un nom créé après l'écriture de la règle**, ce qu'une blacklist ne peut structurellement pas faire. Couvre aussi les secrets/infra, l'identité du décideur (**y compris en position de regex exécutée**), la couche `product` + références pendantes, et les ports **quel que soit le séparateur** (`port: 3001` comme `:3001`). **G6 est un avertissement**, jamais bloquant. **Constate, ne réécrit pas** (pas de `--fix` : réécrire automatiquement un livrable destiné à des tiers est un risque supérieur à celui qu'il prévient). Exit **1** si fuite bloquante. |
| `frame use <frameId>` | `--path <projet> --root <dir> --guide --json` | Pose le **pointeur** de frame active du projet (`<projet>/iakaframe.json`, clé `frame`, non destructif). `<frameId>` **doit** exister dans le réservoir (`frames/<id>.md`) sinon refus (jamais de dangling) ; valeur vide (`""`) **retire** la clé (repli sur le default). `--guide` (Lot A) : propose les frames du réservoir. Distinct de `iakaframe use <m> <t>` (matérialisation du kit, alias de `switch`). |

> **Un geste par dérive constatée** — le remède est **dérivé de l'état mesuré**, jamais une liste
> constante : `vendor-check` n'imprime que les gestes des fixtures **réellement** en dérive, avec des
> chemins **nommés** (aucun joker `*`). Zéro dérive sur une famille → **aucune ligne** sur cette
> famille. Quatre natures de gestes :
>
> 1. **`copy`** — les 20 copies (9 goldens + 9 personas + 1 binding + 1 workflow) : re-vendorage par `cp`, fichier
>    par fichier ;
> 2. **`run`** — les 3 dérivées **sérialisées** (méthode, méthode *wrapped*, team) :
>    `node packages/core/scripts/gen-fixtures.mjs` depuis `iakaFrameGUI` (`--check` non mutant).
>    Sur `niveau2-contrat-vivant-different`, c'est `node cli/scripts/gen-agents-golden.mjs`
>    **puis** la copie — dans cet ordre, car cette raison signifie que le golden lui-même est périmé
>    et que le copier tel quel propagerait le périmé ;
> 3. **`delete`** — fixture surnuméraire : la **supprimer**. Aucune copie ne l'éteindrait ;
> 4. **`investigate`** — anomalie côté **canon** (`source-introuvable`, en-tête illisible) : le
>    miroir n'est pas en cause, aucun geste de copie ne s'applique.
>
> Le **kit** est le seul geste qui **transforme** son contenu : sa référence est le golden CLI
> `cli/test/fixtures/kit.iakaframe-claude.golden.md` **dépouillé de son en-tête** (`strip: true`).
> Un `cp` nu y laisserait l'en-tête et produirait une nouvelle dérive.
>
> **Copier une dérivée sérialisée la détruirait** : ce sont des formes canoniques sérialisées, pas
> des copies — `methodMd.test.ts`, `teamMd.test.ts` et `kitMd.test.ts` sont bâtis sur cette forme.
> C'est un **invariant testé**, plus une consigne en prose.
>
> En `--json`, le remède est exposé sous `remediation[]`
> (`{ action, reason, fixture, family, source?, dest?, strip?, command, note? }`) : `source` est
> relatif à la racine `iakaframe`, `dest` à la racine du miroir — un agent consommateur peut
> l'appliquer sans passer par un shell. `vendor-check` reste **strictement en lecture seule** : il
> n'existe **pas** de `--fix`, le geste de réparation demeure conscient et explicite.

## B.5 Canon du portefeuille — boucle d'apprentissage incrémentale

Six commandes de la même boucle (réf. d'architecture :
`specs/instructions/boucle-apprentissage-incrementale.md`) — les cinq premières livrées
ensemble, `consolidate` venant en amorçage (§ 9, critère 10). Elles opèrent sur le **canon
UNIQUE** du portefeuille, un substrat de fichiers **neutre** (aucun runner privilégié).

**Résolution du chemin du canon**, commune aux six : `--home <dir>` **>** `IAKA_MEMORY_HOME`
**>** `~/.iaka/memory/`. Toutes acceptent `--json` (sortie machine).

| Commande | Usage / spécificités | Rôle |
|---|---|---|
| `memory <action>` | `init \| path \| config \| list \| add \| replace \| remove` sur `<profil\|registre>` · `--home --json` | Outil du canon : crée le layout, expose le chemin/la config (plafonds, seuils, consentement, cadence), liste et **mute** PROFIL.md / REGISTRE.md. `add` est daté & idempotent et **refuse tout dépassement du plafond dur** (consolidation à ~80 %). |
| `open` | `--home --project <dir> --json` | Charge le canon (PROFIL + REGISTRE + rappel du réservoir) à **l'ouverture de session**, **scope-agnostique**, prêt à injecter. **Lecture seule** sur le canon ; canon vide → sortie gracieuse. Avec `--project`, le **canon PROJET s'ajoute** (jamais à la place) et le **marqueur de session** est armé. |
| `recall <requête…>` | `--home --json` (objets `file/path/line/text/date`) | Rappel **plein-texte** sur l'historique brut (`transcripts/`) : retrouve un passage **sans le charger dans le prompt**. Moteur **ripgrep**, **repli Node** si `rg` absent (jamais de crash, mode dégradé signalé). |
| `close` | `--session <fic> --home --json` | Revue de clôture **cadencée** : rejoue les `transcripts/` et **dépose des propositions typées** (`memory\|skill\|hook\|config`) dans `proposals/`. **N'APPLIQUE RIEN** (invariant Q-2) : rien n'est modifié sans consentement. |
| `review <action>` | `list \| show <id> \| apply <id> \| reject <id> \| auto` · `--status <s> --library <dir> --home --json` | Revue du réservoir sous **garde de consentement** : applique/rejette les propositions de `close`. Politique par défaut : **PROFIL en file**, **REGISTRE auto** (si `write_approval:auto`), **PRODUIT toujours en file** (canon versionné, cf. B.5 bis), **STRUCTUREL toujours en file** (jamais auto). |
| `consolidate` | `--source <dir> --home <dir> --json` | **Consolidation initiale** (amorçage du canon) : fond les fiches mémoire existantes du portefeuille en un **aperçu capé** de PROFIL / REGISTRE — **curation, pas copie**, sous **plafond dur**. **N'APPLIQUE RIEN** au canon réel : produit `consolidation/{PROFIL,REGISTRE}.proposed.md` + `DIFF.md` + `RAPPORT.md`, pour **revue humaine sur DIFF**. Recopier l'aperçu sur le canon reste un **geste humain gaté**. Utiliser un `--home` de staging pour ne pas toucher au canon réel. |

## B.5 bis Canon PROJET — la connaissance incrémentale du produit

Réf. d'architecture : `specs/instructions/canon-projet-connaissance-produit.md` (**lot A**).
**Second axe du même moteur** : le canon du portefeuille (B.5) apprend *qui est le décideur*,
le canon projet apprend *ce qu'on a appris **du produit***.

**Ce n'est ni un instantané ni une main courante.** `specs/etat-des-lieux.md` **écrase** à
chaque passage, un journal **empile** — **aucun des deux ne RÉVISE**. Le canon projet corrige
ses entrées **en place** (`replace` re-date la ligne et **fait disparaître** la formulation
antérieure) ; un **plafond dur** force la consolidation.

**Où** : `<projet>/specs/canon/PRODUIT.md` — **versionné**, revu en diff, poussé. Le
**marqueur de session** (dette de clôture), lui, est **local et NON versionné**
(`~/.iaka/memory/sessions/`) : un fichier d'état versionné produirait conflits de merge et
bruit de diff à perpétuité, pour une information qui ne concerne que la machine courante.

| Commande | Usage / spécificités | Rôle |
|---|---|---|
| `produit <action>` | `init \| path \| config \| list \| add \| replace \| remove` · `--project <dir> --json` | Outil du canon projet. `add` daté & idempotent ; **`replace` RÉVISE EN PLACE** (le cœur du lot) ; `remove` est le `-` symétrique de `add`. **Refuse tout dépassement du plafond dur.** `init` crée `PRODUIT.md` **et rien d'autre** (aucune structure machine dans un dépôt versionné). |

**Rituel** — greffé sur `snapshot` / `update`, **sans nouvelle plomberie** :

- `--reason pause|version` → **clôture** du canon projet : dépose des **propositions** dans le
  réservoir global, **n'écrit jamais** dans `PRODUIT.md` ; le marqueur passe à `pending:false`.
- `--reason reprise` → **rattrapage** d'une clôture manquée, **et seulement s'il y a une dette**.
  Sans dette : **strictement rien**. `cadence.close_on` reste `['pause','version']` et
  **n'accueille jamais `reprise`** — « capturer à la reprise » (analyser la session qui commence)
  serait absurde ; « rattraper une clôture manquée » exécute la clôture de la session
  **précédente**. Deux gestes, deux objets.
- **Dégradation gracieuse** : canon absent, dépôt en lecture seule, marqueur corrompu →
  incident **journalisé**, rituel **réussi**. Une clôture en échec **ne solde pas** la dette.

**Garde de consentement — plus stricte que celle du canon portefeuille.** La cible `produit`
est **toujours en file** : `write_approval: auto` **ne peut pas** la rendre automatique. Motif
**matériel** : le canon global est un fichier **local**, le canon projet est **versionné et
poussé** — une entrée erronée n'y est pas une ligne à corriger, c'est une **ligne d'historique
public**. Application via `iakaframe review apply` (geste humain).

**Étanchéité.** Le canon projet ne parle **que du produit** : un fait sur le **décideur** va au
canon **global**. Le canon global reste chargé **partout** ; le canon projet **s'ajoute**, il ne
remplace jamais — entrer dans un projet n'aveugle donc pas sur la connaissance portefeuille. Il
ne réécrit **jamais** `specs/PROJET.md` (intention) ni `etat-des-lieux.md` (situation).

**Porteur** : le **coordinateur projet**, en symétrie avec le coordinateur portefeuille sur le
canon global (contrat de rôle `library/personas/aragorn.md`).

### Binding Claude Code (optionnel)

Le geste `open` est **agnostique** ; le seul morceau qui connaît Claude Code vit dans
`cli/bindings/claude-code/` : un hook **`SessionStart`** (`session-start.mjs`) qui appelle
`iakaframe open` et injecte le canon en session — **en plus** de la mémoire par scope, jamais
en remplacement. Il est **mince, optionnel, non bloquant**. Le canon fonctionne **sans** ce
binding (`iakaframe open` à la main). **L'activation est un geste humain** : un agent ne
modifie pas `~/.claude/settings.json` (voir `cli/bindings/claude-code/README.md`).

Le hook passe aussi `--project <racine>` : il **arme le marqueur de session**, ce qui permet de
**rattraper la clôture** à la reprise si une session se ferme sans rituel. Le répertoire n'est pas
*deviné* — le binding **relaie ce que le runner déclare** (`CLAUDE_PROJECT_DIR`, puis le `cwd` du
payload `SessionStart`, puis le répertoire courant) ; le **jugement** « ce répertoire est-il un
projet à canon ? » reste **dans le cœur** (`projectCanonExists`). C'est le sens précis de
« **mince** » : le binding fournit le **contexte**, jamais la **logique** — il n'a le droit d'aucune
heuristique de projet (ni remontée d'arborescence, ni sonde), interdiction **verrouillée par test**.
Sans canon projet dans le répertoire, **rien n'est créé ni armé** : le canon portefeuille est injecté
seul.

## B.6 Portefeuille (dossier chapeau) — vue agrégée & observation

Ces deux commandes opèrent au niveau du **dossier chapeau** (`~/work`), pas d'un projet.
⚠️ `--root` y désigne le **chapeau** — et non la racine de bibliothèque comme en B.4.

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `portfolio` | `--root <chapeau> --json --ascii` | Vue agrégée du portefeuille, **strictement lecture seule** : par projet, définition / version / état de l'arbre / dernier commit / jalons. Sortie machine C-JSON `{ ok, count, projects, root }`. |
| `range <all\|projet>` | `--list --branches --root <chapeau> --repository <url> --password-command <cmd> --exclude-file <f> --dry-run --json` | Sauvegarde le portefeuille dans un dépôt **restic chiffré**, **sur commande** (rien n'est planifié) : `all` = tout le chapeau, **secrets compris, sans aucune exclusion** ; un nom de projet inconnu est **REFUSÉ** (jamais un repli sur `all`). N'appelle **jamais** `forget`/`prune`. **Signale les branches locales sans copie distante** — celles dont des commits n'existent sur **aucune** ref distante (`git rev-list --count <B> --not --remotes`, zéro réseau) — **avant** de lancer restic puis en **rappel après le `OK`**, **jamais bloquant**, et **même quand il n'a rien à signaler**. Le signal dit « **sans copie distante** », jamais « non sauvegardé » : l'instantané contient les `.git`. `--branches` = **balayage seul**, lecture seule, sans restic, exit 0. Motifs à écarter : `config/sauvegarde-branches-ignorees.txt` (**vide** ; écarter n'est jamais taire — `branchesEcartees` reste affiché). |
| `observe` | `--project <p> "<note>"` \| `--portfolio "<note>"` \| `list` · `--home <dir> --root <dir> --json` | **Observation silencieuse d'Odin** : écrit une puce datée idempotente dans un store **non gaté**, `<IAKAFRAME_ROOT>/.iaka/observation/` (`<projet>.md` ou `_portefeuille.md`). **Sans consentement, sans réservoir** — **distinct** du canon review-gaté (`close`/`review`). `list` relit le store. |

---

> **Note — voie unique cross-OS.**
> La CLI Node `@naonedge/iakaframe` (partie B : `onboard`, `snapshot`, `update`…) est la **voie
> unique et cross-OS**, équivalente sur Windows / macOS / Linux. Les scripts PowerShell qui ont
> historiquement porté la méthode sous Windows ont été retirés du dépôt.
