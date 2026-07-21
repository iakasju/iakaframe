# Commandes de la méthode iakaframe — référence unique

> Référence **exhaustive et maintenue** de toutes les façons de piloter la méthode :
> les **déclencheurs conversationnels / skills** (en session Claude Code) et la **CLI
> `iakaframe`** (Node, cross-OS, zéro dépendance runtime).

## Statut

| Élément | Valeur |
|---|---|
| Dernière mise à jour | 2026-07-19 |
| Version CLI documentée | `@naonedge/iakaframe` **v0.1.0** (source : `cli/package.json`) |
| Commandes CLI couvertes | **29 / 29** verbes distincts (un par `case` de `cli/src/index.js`), **+ 1 alias** (`use` → `switch`) = **30 `case`** au total |
| Sources de vérité | `~/.claude/CLAUDE.md` (déclencheurs), `cli/src/index.js` (bloc `HELP` + `switch`), `cli/src/commands/*.js` |

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
  absent de la doc = un trou à combler. **Attention au décompte** : ce `grep` rend **30**
  `case` alors qu'il n'y a que **29 verbes distincts**, car `use` et `switch` partagent un
  même traitement (`use` est un **alias**, documenté sur la ligne de `switch` — jamais
  compté deux fois). `help`/`version` sont traités **avant** le `switch` (options globales)
  et ne comptent pas comme verbes.
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
| `iakastart` | `iakaframe`, `odin` | Invoque la skill **`iakastart`** : affiche le banner ASCII `IAKAFRAME` + le **roster des 8 agents** et **rend les agents prêts au dispatch — sans en spawner aucun**. Déclenchable en **début** ou en **cours** de session. |

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
| `update iakaframe` (ou « update » dans un projet de la méthode) | **Régénère l'état des lieux** puis fait un **commit global** (`git add -A` + commit) **et push**. Options usuelles : `-Reason version -Version vX.Y.Z -Note "..."`, `-NoPush`. |

**Auto-détection init ↔ update** (via l'API Forgejo) : `init iakaframe` sur un dépôt **déjà
présent** sur Forgejo bascule en `update` ; `update iakaframe` sur un dépôt **absent** (ou
sans git local) bascule en `init`. On peut donc taper indifféremment l'une ou l'autre.

> Note : ces déclencheurs conversationnels s'appuient historiquement sur les scripts
> PowerShell (partie C). La **voie cross-OS équivalente** est la CLI `iakaframe onboard` /
> `update` / `snapshot` (partie B).

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
| **helm** | Sécurité / garde-fous. |
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

---

# B. CLI `iakaframe <commande>`

`@naonedge/iakaframe` — CLI multi-OS (Windows / macOS / Linux), **zéro dépendance runtime**.
Source de vérité = le bloc `HELP` de `cli/src/index.js` + un fichier par commande dans
`cli/src/commands/`. **29 verbes distincts** (+ 1 alias, `use` → `switch`), regroupés par thème.

**Options globales** : `-h`/`--help`, `-v`/`--version`.
**Environnement** : `FORGEJO_TOKEN` (Forgejo), `IAKAFRAME_ROOT`/`--root` (dossier chapeau,
sinon `~/work`), `IAKA_MEMORY_HOME` (canon mémoire).

## B.1 Mise en place & cycle de vie du projet

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `onboard` | `--path <dir> --node claude\|codex\|ollama-localhost\|ollama-lan --repo <nom> --description "ascii" --version vX.Y.Z --skip-forgejo --no-push --force` | Met en place la méthode : structure + dépôt Forgejo + commit + état des lieux + push. Mode **umbrella** : `onboard --umbrella --path <chapeau> [--init-projects]`. |
| `init` | `--path <dir> --node <n> --force` | Déploie le kit + le marqueur `.iakaframe` (**non destructif**). |
| `snapshot` | `--path <dir> --reason version\|pause\|reprise\|manual --version --note` | État des lieux (journal + MD + HTML). |
| `update` | `--path <dir> --reason --version --note --message --no-push` | Checkpoint : snapshot + commit global + push. |
| `config` | `--path <dir> --runner claude-code\|ollama\|litellm\|codex --node <n> --aider-model <m>` | Écrit/màj `<projet>/iakaframe.json` (runner + nœud). |

> `--target` = alias **déprécié** de `--node` (onboard/init/config). Alias runner legacy
> (`ps`, `iakaide`, `aider`) également dépréciés.

## B.2 Diagnostic & exécution

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `services` | `--hosts a,b,c --out <fichier> --json --timeout <sec>` | Sonde git (Forgejo) / Ollama / ComfyUI. **Hôtes neutres par défaut** (`localhost,127.0.0.1`) : renseigner `IAKAFRAME_HOSTS` (CSV) dans `~/work/.env` pour les hôtes du LAN. `--hosts` prime sur l'env var. |
| `go <projet>` | `--path <dir> --runner <r> --do "tache"` | Lance l'action du projet via son runner (`claude-code\|ollama\|litellm\|codex` ; launchers legacy : `aider`, `iakaide`). |
| `agents` | `list \| affect \| fullteam \| status` · `--agent <nom> --project <dir> --global --force` | Équipe de personas : inventaire / affectation / équipe complète / statut. |
| `root` | `--root <dir>` | Affiche le dossier chapeau résolu (`~/work` \| `C:\work`). |

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
| `list [type]` | `type : personas\|skills\|principles\|rituals\|guardrails\|roles\|workflows\|scaffolds\|teams\|methods\|bindings\|kits` · `--json --ascii --root` | Inventaire de la bibliothèque (pool + assemblages) par scan. |
| `show <id>` | `--type --json --root` | Contrat d'un atome/assemblage : frontmatter + corps. |
| `add <kind> <fic>` | `kind : team\|method\|binding` · `--force --json` | Livre un assemblage (valide les réfs I1). |
| `remove <kind> <id>` | `kind : team\|method\|binding\|skill` · `--cascade --yes --root --json` | Le **`−` de `add`** + la **dé-matérialisation d'un skill**. **RESTRICT** par défaut : refuse si l'élément est encore référencé (liste les référents via `findReferrers`) ; **cascade explicite** (`--cascade --yes`, jamais silencieuse) archive aussi les référents (ou, pour un skill, le détache de tous les personas) ; retrait **non destructif** → corbeille horodatée `<root>/.trash-<ts>/` **restaurable** + trace `manifest.json`. |
| `attach <skill>` | `--persona <id>` · `--force --json` | Attache un skill à un persona : **mute le seul `skills:[]`** du frontmatter (source unique de vérité) ; refuse un skill absent de la bibliothèque (I1) sauf `--force`. Le `+` symétrique de `detach`. |
| `detach <skill>` | `--persona <id>` · `--json` | Détache un skill d'un persona : retire l'id de `skills:[]` (idempotent, réversible par `attach`). Le **`−` au « titre du skill »** — affordance rendue par la vue, jamais écrite dans le corps du persona. |
| `assemble <m> <t>` | `--write --binding --json` | Compose un kit (méthode + team [+ binding]) — dry-run par défaut. |
| `switch` \| `use <m> <t>` | `--path --binding --rollback --json` | Bascule un projet vers une méthode/team. (`use` = alias de `switch`.) |
| `vendor-check` | `--strict --gui <dir> --root --json` | **Garde de vendorage cross-repo** : constate que les **21 fixtures** vendorées par `iakaFrameGUI` (**17 copies** + **4 dérivées**) sont fidèles au canon `iakaframe`. Seule garde capable de voir la dérive **mutuellement cohérente** (binding + golden + `sha256` recalculés ensemble), invisible de la suite GUI qui compare ses copies à elles-mêmes. **Gracieux par défaut** : dépôt frère absent → `ok:false` + `status:"skipped"` + **exit 0** (jamais de blocage d'un clone isolé) ; `--strict` en fait un échec. `IAKAFRAME_GUI_ROOT` est **autoritaire** (jamais de repli silencieux sur un autre dépôt). |
| `frame verify` | `--frame <dir> --verbose --json` | **Garde d'anonymisation du miroir** `frames/releases/` : gates **G1→G6 par CLASSES**, jamais par énumération. Le gate central **G2 fonctionne par ALLOWLIST** de marque — tout `iaka*` hors liste blanche est refusé, **y compris un nom créé après l'écriture de la règle**, ce qu'une blacklist ne peut structurellement pas faire. Couvre aussi les secrets/infra, l'identité du décideur (**y compris en position de regex exécutée**), la couche `product` + références pendantes, et les ports **quel que soit le séparateur** (`port: 3001` comme `:3001`). **G6 est un avertissement**, jamais bloquant. **Constate, ne réécrit pas** (pas de `--fix` : réécrire automatiquement un livrable destiné à des tiers est un risque supérieur à celui qu'il prévient). Exit **1** si fuite bloquante. |

> **Un geste par dérive constatée** — le remède est **dérivé de l'état mesuré**, jamais une liste
> constante : `vendor-check` n'imprime que les gestes des fixtures **réellement** en dérive, avec des
> chemins **nommés** (aucun joker `*`). Zéro dérive sur une famille → **aucune ligne** sur cette
> famille. Quatre natures de gestes :
>
> 1. **`copy`** — les 17 copies (8 goldens + 8 personas + 1 binding) : re-vendorage par `cp`, fichier
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
| `open` | `--home --json` | Charge le canon (PROFIL + REGISTRE + rappel du réservoir) à **l'ouverture de session**, **scope-agnostique**, prêt à injecter. **Lecture seule** : n'écrit ni ne crée rien ; canon vide → sortie gracieuse. |
| `recall <requête…>` | `--home --json` (objets `file/path/line/text/date`) | Rappel **plein-texte** sur l'historique brut (`transcripts/`) : retrouve un passage **sans le charger dans le prompt**. Moteur **ripgrep**, **repli Node** si `rg` absent (jamais de crash, mode dégradé signalé). |
| `close` | `--session <fic> --home --json` | Revue de clôture **cadencée** : rejoue les `transcripts/` et **dépose des propositions typées** (`memory\|skill\|hook\|config`) dans `proposals/`. **N'APPLIQUE RIEN** (invariant Q-2) : rien n'est modifié sans consentement. |
| `review <action>` | `list \| show <id> \| apply <id> \| reject <id> \| auto` · `--status <s> --library <dir> --home --json` | Revue du réservoir sous **garde de consentement** : applique/rejette les propositions de `close`. Politique par défaut : **PROFIL en file**, **REGISTRE auto** (si `write_approval:auto`), **STRUCTUREL toujours en file** (jamais auto). |
| `consolidate` | `--source <dir> --home <dir> --json` | **Consolidation initiale** (amorçage du canon) : fond les fiches mémoire existantes du portefeuille en un **aperçu capé** de PROFIL / REGISTRE — **curation, pas copie**, sous **plafond dur**. **N'APPLIQUE RIEN** au canon réel : produit `consolidation/{PROFIL,REGISTRE}.proposed.md` + `DIFF.md` + `RAPPORT.md`, pour **revue humaine sur DIFF**. Recopier l'aperçu sur le canon reste un **geste humain gaté**. Utiliser un `--home` de staging pour ne pas toucher au canon réel. |

### Binding Claude Code (optionnel)

Le geste `open` est **agnostique** ; le seul morceau qui connaît Claude Code vit dans
`cli/bindings/claude-code/` : un hook **`SessionStart`** (`session-start.mjs`) qui appelle
`iakaframe open` et injecte le canon en session — **en plus** de la mémoire par scope, jamais
en remplacement. Il est **mince, optionnel, non bloquant**. Le canon fonctionne **sans** ce
binding (`iakaframe open` à la main). **L'activation est un geste humain** : un agent ne
modifie pas `~/.claude/settings.json` (voir `cli/bindings/claude-code/README.md`).

## B.6 Portefeuille (dossier chapeau) — vue agrégée & observation

Ces deux commandes opèrent au niveau du **dossier chapeau** (`~/work`), pas d'un projet.
⚠️ `--root` y désigne le **chapeau** — et non la racine de bibliothèque comme en B.4.

| Commande | Usage / options principales | Rôle |
|---|---|---|
| `portfolio` | `--root <chapeau> --json --ascii` | Vue agrégée du portefeuille, **strictement lecture seule** : par projet, définition / version / état de l'arbre / dernier commit / jalons. Sortie machine C-JSON `{ ok, count, projects, root }`. |
| `observe` | `--project <p> "<note>"` \| `--portfolio "<note>"` \| `list` · `--home <dir> --root <dir> --json` | **Observation silencieuse d'Odin** : écrit une puce datée idempotente dans un store **non gaté**, `<IAKAFRAME_ROOT>/.iaka/observation/` (`<projet>.md` ou `_portefeuille.md`). **Sans consentement, sans réservoir** — **distinct** du canon review-gaté (`close`/`review`). `list` relit le store. |

---

# C. Scripts power-path Windows (voie historique)

Sous Windows, la méthode s'est d'abord pilotée par des scripts PowerShell — **voie
historique** conservée :

- `iakaframe-onboard.ps1` — mise en place / onboarding projet.
- `iakaframe-snapshot.ps1` — état des lieux (`-Reason version|pause|reprise -Note "..."`).
- `iakaframe-update.ps1` — snapshot + commit global + push (`-Reason -Version -Note -NoPush`).

La **voie recommandée et cross-OS** est désormais la CLI Node `@naonedge/iakaframe` (partie B :
`onboard`, `snapshot`, `update`…), équivalente sur Windows / macOS / Linux.
