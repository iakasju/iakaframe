# iakaframe

**Une méthode de travail entre un décideur humain et une équipe d'agents — formalisée,
outillée, et portable d'un runner à l'autre.**

Ce dépôt extrait et généralise la façon de collaborer mise au point au fil des
projets `IAKA Vod`, `robotimmo`, `iakaAFstorage`, `iakabox` et `iakaJarvis`.
Objectif : pouvoir démarrer **n'importe quel nouveau projet** avec le cadre déjà
en place, au lieu de le réinventer à chaque fois.

---

## Installation

<!-- vitrine:debut:installation -->
La version scellée courante est **[v0.39.0](https://github.com/iakasju/iakaframe/releases/tag/v0.39.0)** — voir
[toutes les versions](https://github.com/iakasju/iakaframe/releases).

**Prérequis :** Node.js **≥ 20** (rien d'autre : la CLI est en Node pur, **zéro
dépendance** runtime, identique sous Windows, macOS et Linux).

### Installer depuis la release — voie recommandée

Un seul fichier à télécharger sur la [page de la release](https://github.com/iakasju/iakaframe/releases/tag/v0.39.0) :

| Fichier | Commande |
|---|---|
| `naonedge-iakaframe-0.39.0.tgz` | `npm install -g naonedge-iakaframe-0.39.0.tgz` |

```bash
# 1. Télécharger le fichier ci-dessus depuis la page de la release (Assets)
# 2. L'installer globalement — identique sous Windows, macOS et Linux
npm install -g naonedge-iakaframe-0.39.0.tgz

# 3. Vérifier
iakaframe --help
iakaframe banner IAKAFRAME
```

### Depuis l'archive des sources

```bash
# 1. Récupérer l'archive de la version depuis la page des releases
#    (Assets > Source code), puis la décompresser
cd iakaframe-0.39.0

# 2. Installer la CLI globalement depuis le dossier cli/
npm install -g ./cli
```

Sans installation globale, la CLI s'exécute directement depuis l'archive :

```bash
node cli/src/index.js --help
```

> **Réservé au réseau interne** — le paquet est aussi publié sur un registre npm privé :
> `npm install -g @naonedge/iakaframe`. Ce registre n'est **pas accessible depuis
> Internet** : hors du LAN, prendre le `.tgz` de la release ci-dessus.
<!-- vitrine:fin:installation -->

Première utilisation : se placer dans un dossier de projet et lancer `iakaframe init`
(ou `iakaframe onboard` pour amorcer aussi le dépôt distant). La commande n'écrase
jamais un fichier existant sans `--force`.

---

## Contenu

| Fichier | Rôle |
|---|---|
| [`methode-de-travail.md`](./methode-de-travail.md) | **La référence canonique.** Principe, 3 acteurs, **équipe d'agents**, cycle, piliers de qualité. |
| [`methode-de-travail.html`](./methode-de-travail.html) | Version présentable de la méthode (dark premium, ouvrable dans un navigateur). |
| [`iakaframe-methode.html`](./iakaframe-methode.html) | **Présentation à onglets** de la méthode + équipe d'agents + infra + vision (NaonEdge). |
| [`iakaframe-skills.html`](./iakaframe-skills.html) | Référence visuelle des **skills** (NaonEdge). |
| [`iakabox-usage.html`](./iakabox-usage.html) | **Guide d'usage du homelab iakabox** : Git via Forgejo, IA locale, services. |
| [`library/`](./library/) | **Réservoir partagé** : `personas/` (définitions des rôles incarnés), `skills/` (savoir-faire), `roles/`, `workflows/`, `guardrails/`, `principles/`, `rituals/`, `scaffolds/`. |
| [`methods/`](./methods/) | **Méthodes de travail** disponibles : `iakaframe`, mais aussi `scrum`, `kanban`, `shapeup`, `lean-startup`, `design-thinking`, `waterfall`, `gtd`. |
| [`teams/`](./teams/) | **Compositions d'équipe** (qui joue quel rôle) — dont `iakaframe-8`, l'équipe par défaut de la méthode. |
| [`frames/`](./frames/) | **Frames** = méthode + équipe + bindings + kits assemblés. `frames/releases/` contient les frames figées, prêtes à déployer. |
| [`bindings/`](./bindings/) | **Appariements** entre un rôle et un runner concret (Claude Code, Codex…). |
| [`kits/`](./kits/) | **Kits de démarrage** par hôte et par méthode (`iakaframe-claude`, `iakaframe-codex`, `iakaframe-openwebui`, `scrum-claude`…), déployés par [`install.mjs`](./install.mjs). |
| [`specs/equipe-agents.md`](./specs/equipe-agents.md) | **Référence canonique de l'équipe** (roster, 3 phases + squad prod, identité, étanchéité, incarnation). |
| [`cli/`](./cli/) | **CLI Node multi-OS** `@naonedge/iakaframe` (Windows/macOS/Linux, **zéro dépendance** runtime) : 13 commandes de la méthode (`onboard`/`init`/`snapshot`/`update`/`services`/`config`/`agents`/`go`/`banner`/`brief`/`recap`/`jalon`/`root`). Voir [`cli/README.md`](./cli/README.md). |
| [`design-naonedge/`](./design-naonedge/) | **Design NaonEdge** (label figé) : `naonedge.css` (charte canon), `naonedge-charte.md`, gabarits doc/slides/flyer, logo. À réutiliser pour tous les supports. |
| [`docs/`](./docs/) | Documents de référence (note de cadrage « Yakaframe Avancé », etc.). |

### Les kits de démarrage (`kits/`)

Un **kit** est ce qui est réellement déposé sur un poste pour qu'un runner applique la
méthode. **La méthode ne dépend d'aucun hôte** : il existe un kit par couple
(méthode, hôte), et c'est le kit qui traduit la méthode dans le format attendu par
l'hôte visé.

| | Hôtes disponibles | Méthodes disponibles |
|---|---|---|
| Kits publiés | `claude`, `codex`, `openwebui`, `ollama` | `iakaframe`, `scrum`, `kanban`, `shapeup`, `leanstartup`, `design-thinking`, `waterfall`, `gtd` |

Quel que soit l'hôte, un kit dépose la même chose sous trois formes différentes :

```
kits/<methode>-<hote>/
├── <contrat de projet>     ← ce que l'agent lit en priorité (CLAUDE.md, AGENTS.md… selon l'hôte)
├── <réglages de l'hôte>    ← permissions : allowlist large + denylist destructive
├── <commandes>             ← verbes de la méthode (iaka-brief, iaka-cadre, iaka-etat…)
└── global/                 ← configuration hors projet + hooks de garde-fous
```

**Pour démarrer un projet :** lancer `iakaframe init` dans le dossier (le kit est déployé
sans rien écraser), puis remplir le contrat de projet et `specs/PROJET.md`. Le déploiement
multi-hôte — un seul geste, tous les hôtes présents sur le poste — se fait par
[`install.mjs`](./install.mjs).

---

## La méthode appliquée par défaut sur tout nouveau projet

Deux mécanismes la rendent automatique :

1. **Le contrat global du runner** — le fichier d'instructions que l'agent lit à
   chaque session, tous projets confondus, déposé dans le dossier de configuration de
   l'hôte par [`install.mjs`](./install.mjs). Il pose la règle : sur un projet
   **neuf ou vide** (ni contrat de projet, ni `specs/`), amorcer la méthode avant
   toute autre chose ; sur un projet qui a déjà le sien, **celui-ci prime** — pas
   d'écrasement.

2. **`iakaframe init`** — déploiement en une commande :

   ```bash
   iakaframe init                            # dans le dossier courant
   iakaframe init --path /chemin/mon-projet
   iakaframe init --force                    # autorise l'écrasement
   ```

   La commande ne remplace jamais un fichier existant (sauf `--force`).

> Concrètement : dans un nouveau dossier, ouvrez votre runner et demandez « initialise
> le projet » — la méthode se met en place toute seule.

---

## La commande « init iakaframe »

Dans n'importe quel répertoire, dire à l'agent **« init iakaframe »**. Selon le contenu :

- **Répertoire vide** → nouveau projet : dépôt Forgejo nommé d'après le dossier,
  structure de la méthode, premier commit, état des lieux v0.1.0, push.
- **Répertoire avec déjà du dev** → reprise : structure déployée *autour* du code
  existant (rien d'écrasé), dépôt Forgejo branché si absent, état des lieux de
  **reprise** généré et résumé — puis on continue selon la méthode.

En une commande, sur un projet existant :

```bash
export FORGEJO_TOKEN="<token>"
iakaframe onboard --path /chemin/mon-projet --description "ASCII description"
```

Options utiles : `--skip-forgejo` (structure + docs sans dépôt distant), `--no-push`,
`--force` (réécrit la structure), `--version vX.Y.Z`.

> **Auto-détection (init ↔ update).** Les deux commandes vérifient l'existence du dépôt
> sur Forgejo et basculent l'une vers l'autre : `init` sur un dépôt **déjà sur Forgejo**
> → fait un `update` ; `update` sur un dépôt **absent de Forgejo** (ou sans git local)
> → fait un `init`. On peut taper indifféremment l'une ou l'autre.

---

## Git par défaut : Forgejo (iakabox)

Tout projet est versionné sur le **Forgejo du homelab iakabox** :
`http://192.168.2.11:3001/sjupin/<repo>.git`, en **HTTP + token** (SSH inutilisable).
Le token n'est jamais écrit en dur ni commité — il est lu depuis `$env:FORGEJO_TOKEN`
(ou vit dans le `.git/config` local). Voir [`iakabox-usage.html`](./iakabox-usage.html)
pour le détail (clone, push, création de dépôt via l'API, rotation).

## Cycle de documentation (état des lieux)

L'état des lieux (`specs/etat-des-lieux.md` + `.html`) est régénéré **à chaque
changement de version** et **à chaque pause de dev / préparation de reprise** :

```bash
iakaframe snapshot --reason version --version v0.2.0 --note "feature X livrée"
iakaframe snapshot --reason pause   --note "WIP : reprendre par les tests"
```

Le script capte les faits git (version, branche, commits, état de l'arbre) et tient un
journal append-only ; **le rôle de cadrage complète le récit de reprise** dans le `.md`.

### Commande « update iakaframe »

Checkpoint en une commande : **régénère l'état des lieux + commit global + push**.

```bash
iakaframe update                                       # checkpoint manuel
iakaframe update --reason version --version v0.3.0     # à un changement de version
iakaframe update --reason pause --note "..." --no-push
```

---

## CLI & rituels de session

La méthode est aussi outillée par la **CLI Node multi-OS** [`@naonedge/iakaframe`](./cli/)
(zéro dépendance runtime) : `iakaframe <cmd>`, identique sous Windows / macOS / Linux.
Au-delà du cycle de vie (`onboard`/`init`/`snapshot`/`update`), elle ajoute des **rituels
de session** : les titres ASCII (`banner`), l'entrée de projet (`brief`), les gates
(`jalon`) et la fermeture de session (`recap`).

```bash
iakaframe banner "IAKAFRAME"                 # titre ASCII (FIGlet embarqué, zéro dep)
iakaframe go mon-projet                       # entre dans le projet : titre + brief, puis runner
iakaframe brief mon-projet                    # dernière étape + backlog + agents assignés
iakaframe jalon --project mon-projet --name "Cadrage validé" --from cadrage --to realisation
iakaframe recap mon-projet                    # fermeture : commits + agents mobilisés
```

Ces rituels se câblent au **dossier chapeau** via les **hooks** du runner — le fichier de
réglages de l'hôte, déposé par [`install.mjs`](./install.mjs) :

- **`SessionStart`** → affiche le titre ASCII `IAKAFRAME` (`iakaframe banner IAKAFRAME`).
- **`SessionEnd`** → régénère l'état des lieux pour préparer la reprise
  (`iakaframe snapshot --reason pause`, uniquement si un dossier `specs/` est présent).

---

## L'équipe de rôles

La couche réflexion + exécution se spécialise en une **équipe de rôles** à périmètres
fermés, qui incarnent la chaîne de bout en bout. Chaque rôle est tenu par un **persona**
— librement nommable, et portable d'un runner à l'autre.
Référence : [`specs/equipe-agents.md`](./specs/equipe-agents.md).

```
le décideur → portefeuille (dossier chapeau) → coordination (par projet) → rôles d'exécution
```

| Rôle | Périmètre |
|---|---|
| **Portefeuille** | Au-dessus de tous les projets : changer d'équipe, démarrer un projet, vue d'ensemble. |
| **Coordination** | Répartit le besoin, suit les phases (cadrage → réalisation → staging), décide qui intervient. |
| **Cadrage** | Transforme un besoin en instruction fermée et vérifiable. N'écrit jamais de code. |
| **Réalisation** | Lit l'instruction, code, build, teste, commite, déploie jusqu'au staging. |
| **Qualité** | Tests, lint, typage, couverture — rend un verdict pass/fail. Ne corrige jamais le code. |
| **Déploiement** | Fait *passer* stage → production : bascule d'alias, accès (proxy, SSO), rollback. Agit **sur ordre** — feu vert humain non négociable. |
| **Surveillance** | *Veille* sur la production : health-checks, disponibilité des endpoints, charge, et **alerte**. Agit **sans ordre** ; n'exécute jamais la reprise. |
| **Design** | Supports visuels et UX, selon la charte du projet. |
| **Documentation** | Guides et modes d'emploi destinés à l'utilisateur final. |

**Modèle d'étanchéité** : définitions mutualisées (source unique dans `library/`),
exécution étanche — chaque projet instancie sa propre équipe scopée. **Incarnation** :
un persona (`library/personas/`) apparié à une skill de rôle (`library/skills/`), l'appariement
au runner concret étant porté par `bindings/`.

```bash
iakaframe agents --action fullteam --project /chemin/mon-projet   # deployer l'equipe
iakaframe agents --action affect --agent <persona> --project ~/work
```

---

## Résumé de l'investigation — la méthode telle qu'elle est réellement appliquée

En analysant les projets et leur mémoire de travail, la méthode se résume à
**trois acteurs, un cycle, des preuves persistantes** :

### Trois acteurs, zéro chevauchement
- **le décideur (humain)** : vision, arbitrages, validation, test réel.
- **le cadrage** = architecte/rédacteur : analyse en lecture seule, rédige les
  instructions. **Ne code jamais.**
- **l'exécution** = développeur IA : lit l'instruction, code, build, teste, commite.

### Un cycle répété pour chaque feature
besoin → analyse (cadrage) → discussion → **instruction écrite** → validation →
implémentation (exécution) → test & feedback → (boucle).

### Des preuves transverses (relevées dans la mémoire des projets)
- **Langue : français**, réponses concises. Code/identifiants en anglais.
- **Self-hosted / open-source d'abord** (Ollama local avant tout cloud) —
  *iakaAFstorage*.
- **Commits atomiques fréquents** comme filet de sécurité, surtout quand les
  permissions sont en bypass — *robotimmo*.
- **Permissions larges + denylist destructive** pour fluidifier le workflow
  Docker/dev ; confirmation par message texte pour le vraiment risqué.
- **Réutiliser l'infra existante** (ex. relais MCP) plutôt que réimplémenter —
  *IAKA Vod*.
- **MVP d'abord, puis itérer.** Pas de sur-ingénierie.
- **Mock des données en dev** pour ne pas gaspiller les quotas API — *IAKA Vod*.
- **Outils de vérification** systématiques : typecheck, lint, tests, rapport
  qualité consolidé.

### La conviction de fond
> L'IA sans workflow produit du code jetable. L'IA dans un workflow produit du
> logiciel. **La qualité n'est pas dans le modèle, elle est dans la méthode.**

---

## Origine

La première formalisation est née sur un projet unique, sous la forme d'un simple
`methode-de-travail.md`. `iakaframe` en est la version agnostique — indépendante du
projet comme du runner —, destinée à être réutilisée telle quelle.
