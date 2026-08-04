# iakaframe

**La méthode de travail entre l'utilisateur, Cowork et Claude Code — formalisée et réutilisable.**

Ce dépôt extrait et généralise la façon de collaborer mise au point au fil des
projets `IAKA Vod`, `robotimmo`, `iakaAFstorage`, `iakabox` et `iakaJarvis`.
Objectif : pouvoir démarrer **n'importe quel nouveau projet** avec le cadre déjà
en place, au lieu de le réinventer à chaque fois.

---

## Installation

La version scellée courante est **[v0.20.4](../../releases/tag/v0.20.4)** — voir
[toutes les versions](../../releases).

**Prérequis :** Node.js **≥ 20** (rien d'autre : la CLI est en Node pur, **zéro
dépendance** runtime, identique sous Windows, macOS et Linux).

```bash
# 1. Récupérer l'archive de la version depuis la page des releases
#    (Assets > Source code), puis la décompresser
cd iakaframe-0.20.4

# 2. Installer la CLI globalement depuis le dossier cli/
npm install -g ./cli

# 3. Vérifier
iakaframe --help
iakaframe banner IAKAFRAME
```

Sans installation globale, la CLI s'exécute directement depuis l'archive :

```bash
node cli/src/index.js --help
```

> **Sur le réseau interne**, le paquet est aussi publié sur le registre npm privé :
> `npm install -g @naonedge/iakaframe` (registre `@naonedge` configuré sur Forgejo).
> En dehors du LAN, passer par l'archive de la release ci-dessus.

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
méthode. Il en existe un par couple (méthode, hôte) — par exemple `iakaframe-claude`,
`iakaframe-codex`, `iakaframe-openwebui`, `scrum-claude`, `kanban-claude`…

```
kits/iakaframe-claude/
├── CLAUDE.md                       ← Contrat de travail du projet (à remplir)
├── .claude/settings.local.json     ← Permissions (allowlist large + denylist destructive)
├── .claude/commands/               ← Commandes de la méthode (iaka-brief, iaka-cadre, iaka-etat…)
└── global/                         ← Conf globale : CLAUDE.md, hooks de garde-fous
```

**Pour démarrer un projet :** lancer `iakaframe init` dans le dossier (le kit est déployé
sans rien écraser), puis remplir `CLAUDE.md` et `specs/PROJET.md`. Le déploiement
multi-hôte se fait par [`install.mjs`](./install.mjs).

---

## La méthode appliquée par défaut sur tout nouveau projet

Deux mécanismes la rendent automatique :

1. **`C:\Users\sjupi\.claude\CLAUDE.md`** (instructions globales, lues à chaque
   session, tous projets confondus). Il dit à Claude : sur un projet **neuf/vide**
   (ni `CLAUDE.md` ni `specs/`), amorcer la méthode iakaframe avant toute autre
   chose. Sur un projet qui a déjà son `CLAUDE.md`, celui-ci **prime** — pas
   d'écrasement.

2. **`iakaframe init`** — déploiement en une commande :

   ```bash
   iakaframe init                            # dans le dossier courant
   iakaframe init --path /chemin/mon-projet
   iakaframe init --force                    # autorise l'écrasement
   ```

   La commande ne remplace jamais un fichier existant (sauf `--force`).

> Concrètement : dans un nouveau dossier, lancez `claude` et demandez « initialise
> le projet » — la méthode se met en place toute seule.

---

## La commande « init iakaframe »

Dans n'importe quel répertoire, dire à Claude **« init iakaframe »**. Selon le contenu :

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
journal append-only ; **Cowork complète le récit de reprise** dans le `.md`.

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
iakaframe jalon --project mon-projet --name "Cadrage validé" --from Gandalf --to Gimli
iakaframe recap mon-projet                    # fermeture : commits + agents mobilisés
```

Ces rituels sont câblés au **portefeuille** via les **hooks** de
`C:\work\.claude\settings.json` :

- **`SessionStart`** → affiche le titre ASCII `IAKAFRAME` (`iakaframe banner IAKAFRAME`).
- **`SessionEnd`** → régénère l'état des lieux pour préparer la reprise
  (`iakaframe snapshot --reason pause`, uniquement si un dossier `specs/` est présent).

---

## L'équipe d'agents (« Yakaframe Avancé »)

La couche réflexion+exécution se spécialise en une **équipe d'agents nommés**, au périmètre
fermé, qui incarnent la chaîne CI/CD. Référence : [`specs/equipe-agents.md`](./specs/equipe-agents.md).

```
l'utilisateur → 🦅 Odin (portefeuille, C:\work) → 🛡️ Aragorn (par projet) → agents
```

- 🦅 **Odin** — super-agent **portefeuille**, disponible en permanence, seul affecté à `C:\work` : switch d'équipe, démarrage projet, création d'équipe. **Au premier appel par session, il régénère et affiche le dashboard projets** (`naonedge-dashboard\scan.ps1` puis `index.html`) avant la synthèse.
- 🛡️ **Aragorn** — coordination entre agents, **3 phases** (cadrage → réalisation → staging), dispatch à la demande, canal **iakaHub ↔ Discord** (avec repli terminal).
- 🧙 **Gandalf** (cadrage) · ⚒️ **Gimli** (dev + devops jusqu'au staging) · 🏹 **Legolas** (qualité) · 🌉 **Helm** (**squad prod** : déploiement + surveillance + alertes) · 🎭 **Loki** (design) · 📖 **Nathalie** (guides).

**Modèle d'étanchéité** : définitions mutualisées (source unique), exécution étanche (chaque
projet instancie sa propre équipe scopée). **Incarnation** : un subagent (`agents/`) + une
skill-rôle (`skills/`).

```bash
iakaframe agents --action fullteam --project /chemin/mon-projet   # deployer l'equipe
iakaframe agents --action affect --agent odin --project ~/work    # Odin au portefeuille
```

---

## Résumé de l'investigation — la méthode telle qu'elle est réellement appliquée

En analysant les projets et la mémoire Claude associée, la méthode se résume à
**trois acteurs, un cycle, des preuves persistantes** :

### Trois acteurs, zéro chevauchement
- **l'utilisateur (développeur)** = décideur : vision, arbitrages, validation, test réel.
- **Cowork (Claude réflexion)** = architecte/rédacteur : analyse en lecture seule,
  rédige les instructions. **Ne code jamais.**
- **Claude Code (Claude exécution)** = développeur IA : lit l'instruction, code,
  build, teste, commite.

### Un cycle répété pour chaque feature
besoin → analyse Cowork → discussion → **instruction écrite** → validation →
implémentation Claude Code → test & feedback → (boucle).

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

La première formalisation vit dans `C:\iakaVODdash\claudecowork\`
(`methode-de-travail.md` + `.html`). `iakaframe` en est la version
project-agnostic, destinée à être réutilisée tel quel sur les futurs projets.
