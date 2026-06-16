# iakaframe

**La méthode de travail entre Stéphane, Cowork et Claude Code — formalisée et réutilisable.**

Ce dépôt extrait et généralise la façon de collaborer mise au point au fil des
projets `IAKA Vod`, `robotimmo`, `iakaAFstorage`, `iakabox` et `iakaJarvis`.
Objectif : pouvoir démarrer **n'importe quel nouveau projet** avec le cadre déjà
en place, au lieu de le réinventer à chaque fois.

---

## Contenu

| Fichier | Rôle |
|---|---|
| [`methode-de-travail.md`](./methode-de-travail.md) | **La référence canonique.** Principe, 3 acteurs, **équipe d'agents**, cycle, piliers de qualité. |
| [`methode-de-travail.html`](./methode-de-travail.html) | Version présentable de la méthode (dark premium, ouvrable dans un navigateur). |
| [`iakaframe-methode.html`](./iakaframe-methode.html) | **Présentation à onglets** de la méthode + équipe d'agents + infra + vision (NaonEdge). |
| [`iakaframe-skills.html`](./iakaframe-skills.html) | Référence visuelle des **skills** (NaonEdge). |
| [`iakabox-usage.html`](./iakabox-usage.html) | **Guide d'usage du homelab iakabox** : Git via Forgejo, IA locale, services. |
| [`agents/`](./agents/) | **Définitions des subagents** de l'équipe (odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie) + `_TEMPLATE.md`. |
| [`skills/`](./skills/) | **12 skills** : savoir-faire des agents + briques de cycle de vie. Voir [`skills/README.md`](./skills/README.md). |
| [`specs/equipe-agents.md`](./specs/equipe-agents.md) | **Référence canonique de l'équipe d'agents** (roster, 3 phases + squad prod, identité, étanchéité, incarnation). |
| [`kit/`](./kit/) | **Kit de démarrage** à copier dans tout nouveau projet. |
| [`iakaframe-init.ps1`](./iakaframe-init.ps1) | Déploie la structure du kit (sans rien écraser). |
| [`iakaframe-forgejo.ps1`](./iakaframe-forgejo.ps1) | Crée le dépôt Forgejo + branche le remote (token via env). |
| [`iakaframe-snapshot.ps1`](./iakaframe-snapshot.ps1) | Génère l'état des lieux (MD + HTML) à chaque version / pause / reprise. |
| [`iakaframe-onboard.ps1`](./iakaframe-onboard.ps1) | **Orchestrateur** : structure + Forgejo + 1er commit + docs, sur projet neuf ou existant. |
| [`iakaframe-update.ps1`](./iakaframe-update.ps1) | **« update iakaframe »** : régénère l'état des lieux + commit global + push. |
| [`iakaframe-agents.ps1`](./iakaframe-agents.ps1) | **Gère l'équipe d'agents** : `list` / `create` / `affect` / `fullteam` / `status`. |
| [`iakaframe-common.ps1`](./iakaframe-common.ps1) | Helper partagé (token + détection d'existence Forgejo) ; dot-sourcé par les autres. |
| [`design-naonedge/`](./design-naonedge/) | **Design NaonEdge** (label figé) : `naonedge.css` (charte canon), `naonedge-charte.md`, gabarits doc/slides/flyer, logo. À réutiliser pour tous les supports. |
| [`docs/`](./docs/) | Documents de référence (note de cadrage « Yakaframe Avancé », etc.). |

### Le kit de démarrage (`kit/`)

```
kit/
├── CLAUDE.md                       ← Contrat de travail Claude Code (à remplir)
├── .claude/settings.local.json     ← Permissions (allowlist large + denylist destructive)
└── specs/
    ├── PROJET.md                   ← Gabarit de vision/specs projet
    └── instructions/
        └── _TEMPLATE.md            ← Gabarit d'un fichier d'instruction
```

**Pour démarrer un projet :** copier le contenu de `kit/` à la racine du nouveau
repo, puis remplir `CLAUDE.md` et `specs/PROJET.md`.

---

## La méthode appliquée par défaut sur tout nouveau projet

Deux mécanismes la rendent automatique :

1. **`C:\Users\sjupi\.claude\CLAUDE.md`** (instructions globales, lues à chaque
   session, tous projets confondus). Il dit à Claude : sur un projet **neuf/vide**
   (ni `CLAUDE.md` ni `specs/`), amorcer la méthode iakaframe avant toute autre
   chose. Sur un projet qui a déjà son `CLAUDE.md`, celui-ci **prime** — pas
   d'écrasement.

2. **`iakaframe-init.ps1`** — déploiement en une commande :

   ```powershell
   pwsh C:\iakaframe\iakaframe-init.ps1                 # dans le dossier courant
   pwsh C:\iakaframe\iakaframe-init.ps1 -Path C:\mon-projet
   pwsh C:\iakaframe\iakaframe-init.ps1 -Force           # autorise l'écrasement
   ```

   Le script ne remplace jamais un fichier existant (sauf `-Force`).

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

```powershell
$env:FORGEJO_TOKEN = "<token>"
pwsh C:\iakaframe\iakaframe-onboard.ps1 -Path C:\mon-projet -Description "ASCII description"
```

Options utiles : `-SkipForgejo` (structure + docs sans dépôt distant), `-NoPush`,
`-Force` (réécrit la structure), `-Version vX.Y.Z`.

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

```powershell
pwsh C:\iakaframe\iakaframe-snapshot.ps1 -Reason version -Version v0.2.0 -Note "feature X livrée"
pwsh C:\iakaframe\iakaframe-snapshot.ps1 -Reason pause   -Note "WIP : reprendre par les tests"
```

Le script capte les faits git (version, branche, commits, état de l'arbre) et tient un
journal append-only ; **Cowork complète le récit de reprise** dans le `.md`.

### Commande « update iakaframe »

Checkpoint en une commande : **régénère l'état des lieux + commit global + push**.

```powershell
pwsh C:\iakaframe\iakaframe-update.ps1                                  # checkpoint manuel
pwsh C:\iakaframe\iakaframe-update.ps1 -Reason version -Version v0.3.0  # à un changement de version
pwsh C:\iakaframe\iakaframe-update.ps1 -Reason pause -Note "..." -NoPush
```

---

## L'équipe d'agents (« Yakaframe Avancé »)

La couche réflexion+exécution se spécialise en une **équipe d'agents nommés**, au périmètre
fermé, qui incarnent la chaîne CI/CD. Référence : [`specs/equipe-agents.md`](./specs/equipe-agents.md).

```
Stéphane → 🦅 Odin (portefeuille, C:\work) → 🛡️ Aragorn (par projet) → agents
```

- 🦅 **Odin** — super-agent **portefeuille**, disponible en permanence, seul affecté à `C:\work` : switch d'équipe, démarrage projet, création d'équipe. **Au premier appel par session, il régénère et affiche le dashboard projets** (`naonedge-dashboard\scan.ps1` puis `index.html`) avant la synthèse.
- 🛡️ **Aragorn** — coordination entre agents, **3 phases** (cadrage → réalisation → staging), dispatch à la demande, canal **Slack** (via n8n).
- 🧙 **Gandalf** (cadrage) · ⚒️ **Gimli** (dev + devops jusqu'au staging) · 🏹 **Legolas** (qualité) · 🌉 **Helm** (**squad prod** : déploiement + surveillance + alertes) · 🎭 **Loki** (design) · 📖 **Nathalie** (guides).

**Modèle d'étanchéité** : définitions mutualisées (source unique), exécution étanche (chaque
projet instancie sa propre équipe scopée). **Incarnation** : un subagent (`agents/`) + une
skill-rôle (`skills/`).

```powershell
pwsh C:\work\iakaframe\iakaframe-agents.ps1 -Action fullteam -Project C:\mon-projet   # deployer l'equipe
pwsh C:\work\iakaframe\iakaframe-agents.ps1 -Action affect -Agent odin -Project C:\work  # Odin au portefeuille
```

---

## Résumé de l'investigation — la méthode telle qu'elle est réellement appliquée

En analysant les projets et la mémoire Claude associée, la méthode se résume à
**trois acteurs, un cycle, des preuves persistantes** :

### Trois acteurs, zéro chevauchement
- **Stéphane (développeur)** = décideur : vision, arbitrages, validation, test réel.
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
