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
| [`methode-de-travail.md`](./methode-de-travail.md) | **La référence canonique.** Principe, 3 acteurs, cycle, piliers de qualité. |
| [`methode-de-travail.html`](./methode-de-travail.html) | Version présentable de la méthode (dark premium, ouvrable dans un navigateur). |
| [`methode-de-travail.html`](./methode-de-travail.html) | Version présentable de la méthode. |
| [`iakabox-usage.html`](./iakabox-usage.html) | **Guide d'usage du homelab iakabox** : Git via Forgejo, IA locale, services. |
| [`kit/`](./kit/) | **Kit de démarrage** à copier dans tout nouveau projet. |
| [`iakaframe-init.ps1`](./iakaframe-init.ps1) | Déploie la structure du kit (sans rien écraser). |
| [`iakaframe-forgejo.ps1`](./iakaframe-forgejo.ps1) | Crée le dépôt Forgejo + branche le remote (token via env). |
| [`iakaframe-snapshot.ps1`](./iakaframe-snapshot.ps1) | Génère l'état des lieux (MD + HTML) à chaque version / pause / reprise. |
| [`iakaframe-onboard.ps1`](./iakaframe-onboard.ps1) | **Orchestrateur** : structure + Forgejo + 1er commit + docs, sur projet neuf ou existant. |

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
