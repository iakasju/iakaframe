# Guide d'utilisation de StefFrame2

> Guide utilisateur complet : installation, prise en main et inventaire de tout ce que
> contient le zip **StefFrame2**. Écrit pour quelqu'un qui reçoit l'archive et veut s'en
> servir, sans avoir participé à sa fabrication.
>
> Ce guide décrit le **comportement réel** de StefFrame2 tel que défini par son cadrage
> (`specs/instructions/frame-stefframe2.md`) et par les fichiers réellement livrés. Là où un
> détail dépend de ta propre installation (chemins, serveurs), c'est signalé.

---

## Sommaire

1. [Qu'est-ce que StefFrame2](#1-quest-ce-que-stefframe2)
2. [Prérequis](#2-prérequis)
3. [Installation pas-à-pas](#3-installation-pas-à-pas)
4. [Premier lancement et prise en main](#4-premier-lancement-et-prise-en-main)
5. [Listing exhaustif des éléments](#5-listing-exhaustif-des-éléments)
6. [Les skills qui « ne font rien » (no-op) et comment les activer](#6-les-skills-qui-ne-font-rien-no-op-et-comment-les-activer)
7. [Dépannage](#7-dépannage)
8. [Ce qui n'est PAS inclus (et pourquoi)](#8-ce-qui-nest-pas-inclus-et-pourquoi)

---

## 1. Qu'est-ce que StefFrame2

**StefFrame2, c'est la méthode de travail « iakaframe » rendue exécutable.**

La méthode iakaframe organise le travail comme une **équipe d'experts** pilotée par un
**décideur** (toi). Chaque expert a un rôle borné (cadrage, réalisation, qualité,
documentation…) et ces rôles sont incarnés par des **personas** (Odin, Aragorn, Gandalf,
Gimli, Legolas, Helm, Loki, Nathalie). L'idée : on cadre par écrit **avant** de coder, on
avance par petites étapes, et l'humain valide aux points clés.

Il a existé une première version, **StefFrame1**, qui était un simple **corpus de
documentation et de kits** : tout était écrit, mais rien ne « tournait » vraiment. On avait le
mode d'emploi de la méthode, mais pas l'outil.

**StefFrame2 = tout StefFrame1 + ce qu'il faut pour que ça FONCTIONNE :**

- un **CLI** (un programme en ligne de commande) qui exécute réellement les rituels de la
  méthode : afficher un bandeau de démarrage, poser un jalon, lister les personas, gérer une
  bibliothèque d'éléments réutilisables, etc. ;
- les **hooks** (petits scripts de garde-fou) qui rappellent leur identité et leur périmètre
  aux agents, réellement câblés ;
- un fichier de **réglages d'exemple** qui branche ces hooks ;
- une **charte graphique de démarrage** neutre pour habiller d'éventuels documents ;
- ce **guide** et un `GUIDE-INSTALLATION.md` court fourni dans l'archive.

### Ce que ça permet concrètement

Une fois installé, tu peux :

- lancer **Claude Code** (l'assistant qui joue les personas) et dire « iakastart » pour
  réveiller l'équipe ;
- utiliser la commande **`iakaframe`** pour les rituels outillés (bandeaux, jalons,
  bibliothèque d'atomes, mémoire de session…) ;
- suivre le **cycle d'une feature** : besoin → cadrage écrit → réalisation → qualité →
  documentation, avec des garde-fous automatiques.

> **Important** : StefFrame2 est la méthode **sans interface graphique**. Il n'y a pas
> d'application avec des fenêtres et des boutons : tout se passe dans le **terminal** (la
> console) et dans **Claude Code**. C'est un choix assumé (voir §8). C'est plus austère au
> premier regard, mais tout est là et tout fonctionne.

---

## 2. Prérequis

StefFrame2 a besoin de **trois choses qui ne sont PAS dans le zip** et que tu dois installer
toi-même. Elles sont volontairement séparées : le zip contient la **méthode et son outil**, pas
le moteur qui les fait tourner.

| À installer | À quoi ça sert | Fourni dans le zip ? |
|---|---|---|
| **Claude Code** | Le **runner** : l'assistant IA qui incarne les personas et exécute la méthode. Nécessite un abonnement. | ❌ Non — à installer et souscrire séparément |
| **Node.js ≥ 20** | Le moteur qui fait tourner le **CLI** et les **hooks** (ils sont écrits en JavaScript). | ❌ Non |
| **git** | Le versionnement du code (historique, sauvegardes, envoi vers un serveur). | ❌ Non |

### Bien distinguer les deux « outils »

C'est le point qui prête le plus à confusion, donc prenons le temps :

- **Le runner = Claude Code.** C'est le programme dans lequel tu **discutes** avec l'assistant.
  C'est lui qui « joue » Odin, Gandalf, etc. **Il s'installe à part** (et demande un
  abonnement). Rien à voir avec le zip.
- **Le CLI = `iakaframe`.** C'est le **petit outil de la méthode**, **fourni dans le zip**
  (dossier `cli/`). Il ne parle pas, il **exécute** des commandes précises (afficher un
  bandeau, lister des éléments…). C'est du code que tu installes depuis l'archive.

Les deux travaillent ensemble mais s'installent séparément.

### Vérifier que les prérequis sont là

Ouvre un terminal et lance ces commandes. Chacune doit répondre par une version ou un chemin,
**pas** par une erreur « command not found » :

```bash
node -v          # doit afficher v20.x.x ou plus récent
git --version    # doit afficher git version 2.x.x
claude --version # doit afficher une version de Claude Code
```

- Si `node -v` affiche une version **inférieure à 20** (ex. `v18.x`), mets Node à jour :
  StefFrame2 vise **Node 20 ou plus** (le CLI s'appuie sur des fonctions natives de Node 20).
- Si `claude` répond « command not found », c'est que Claude Code n'est pas installé ou pas
  dans le `PATH` : installe-le en suivant sa documentation officielle.

> **Où installer Node.js et git ?**
> - **macOS** : le plus simple est [Homebrew](https://brew.sh) → `brew install node git`.
> - **Windows** : télécharge les installeurs officiels de [nodejs.org](https://nodejs.org) et
>   [git-scm.com](https://git-scm.com), ou utilise `winget install OpenJS.NodeJS Git.Git`.
> - **Linux** : via le gestionnaire de paquets de ta distribution (ex.
>   `sudo apt install nodejs git`, en veillant à obtenir Node ≥ 20).

---

## 3. Installation pas-à-pas

On va faire trois choses, dans l'ordre : **(A)** décompresser le zip, **(B)** installer le CLI,
**(C)** poser la configuration de Claude Code dans ton dossier personnel `~/.claude`.

Les exemples sont donnés pour **macOS / Linux**. Les notes Windows sont signalées.

### Étape A — Décompresser l'archive

Choisis un emplacement stable où l'archive va **rester** (le CLI et Claude Code pointeront
dessus). Par exemple un dossier `~/iakaframe` :

```bash
mkdir -p ~/iakaframe
cd ~/iakaframe
unzip ~/Téléchargements/StefFrame2.zip
```

Tu obtiens un dossier `StefFrame2/` contenant tout le corpus, le dossier `cli/`, les kits, etc.
Place-toi dedans :

```bash
cd ~/iakaframe/StefFrame2
```

> **Windows** : clic droit sur le zip → « Extraire tout… », puis ouvre un terminal (PowerShell)
> dans le dossier extrait.

### Étape B — Installer le CLI `iakaframe`

Le CLI est **sans aucune dépendance** : il n'a besoin d'aller chercher aucun paquet sur
Internet. L'installation est donc **hors-ligne** et instantanée.

```bash
npm install -g ./cli
```

Cela installe la commande **`iakaframe`** sur ton système. Vérifie :

```bash
iakaframe --version
```

> **Alternative sans installation globale** : si tu ne veux rien installer, tu peux appeler le
> CLI directement depuis le dossier :
> ```bash
> node cli/src/index.js --version
> ```
> Partout où ce guide écrit `iakaframe <commande>`, tu peux remplacer par
> `node cli/src/index.js <commande>`.

### Étape C — Poser la configuration globale de Claude Code (avec l'installeur)

Claude Code lit sa configuration dans le dossier caché **`~/.claude`** de ton compte. Le zip
fournit tout ce qu'il faut dans le **kit Claude** (`kits/iakaframe-claude/`) : les instructions
globales, les skills, les agents, les hooks, et le fichier de réglages qui câble les hooks.

**Ne copie pas ces fichiers à la main** : StefFrame2 embarque un **installeur intelligent**
(`install.mjs`, à la racine de l'archive) qui **détecte ce que tu as déjà** dans `~/.claude` et
**ne l'écrase jamais aveuglément**. C'est la voie normale — plus sûre, et rejouable sans risque.

#### Étape C.1 — Voir le plan sans rien écrire

Commence toujours par un « essai à blanc » : il **affiche ce qui serait fait**, catégorie par
catégorie, **sans écrire un seul fichier** et **sans créer de sauvegarde**.

```bash
node install.mjs --dry-run
```

Tu verras, pour chacune des **5 catégories gérées**, ce qui est **absent** (donc à ajouter) et
ce qui est **déjà présent** (collision → l'action prévue). Les 5 catégories :

| Catégorie | Ce que l'installeur apporte | Cible dans `~/.claude/` |
|---|---|---|
| Contrat global | `CLAUDE.md` (encadré par un bloc repérable) | `CLAUDE.md` |
| Réglages | la section `hooks` de `settings.example.json` | `settings.json` |
| Hooks | les 5 fichiers `.mjs` | `hooks/*.mjs` |
| Skills | les 16 skills | `skills/*` |
| Agents | les 8 agents | `agents/*` |

> **Rien d'autre n'est touché.** Tout le reste de `~/.claude` — ta mémoire par projet
> (`projects/`), tes `todos/`, ton `history`, tes `plugins/`, etc. — n'est **jamais lu en
> écriture, jamais sauvegardé, jamais écrasé**. L'installeur n'agit **que** sur les 5 catégories
> ci-dessus, et **uniquement en ajout** par défaut.

#### Étape C.2 — Poser la configuration

Quand le plan te convient, lance l'installeur pour de vrai :

```bash
node install.mjs
```

Par défaut (mode **`--merge`**), il **fusionne intelligemment** : il ajoute ce qui manque et,
**en cas de conflit, garde ce que tu as déjà**. Avant la moindre écriture, il crée une
**sauvegarde horodatée** dans `~/.claude/.iakaframe-backup-<ts>/` (`<ts>` = un horodatage) — tu
peux donc toujours revenir en arrière.

En mode **interactif** (le comportement par défaut si tu ne passes pas `--yes`), pour chaque
élément **déjà présent** il te propose, **regroupé par catégorie**, trois actions :

| Choix | Effet |
|---|---|
| **[f]usionner** | Combine intelligemment (voir plus bas) sans rien perdre — le défaut. |
| **[e]craser** | Remplace par la version du kit (après sauvegarde). |
| **[g]arder** | Ne touche à rien, conserve ta version. |

> Astuce : la **majuscule** (`[F]`, `[E]`, `[G]`) applique le même choix à **toute la
> catégorie** d'un coup. Les éléments **absents** sont simplement **ajoutés**, sans question.

Ce que « fusionner » veut dire concrètement, selon le type de fichier :

- **`CLAUDE.md`** : le contenu de la méthode est inséré dans un **bloc balisé**
  `<!-- iakaframe:start -->` … `<!-- iakaframe:end -->`. S'il manque, il est ajouté en fin de
  fichier ; s'il existe déjà, seul **son contenu** est mis à jour. **Rien hors du bloc n'est
  modifié** — tes instructions personnelles restent intactes.
- **`settings.json`** : fusion en profondeur. Les **entrées de hooks manquantes** sont ajoutées
  (identifiées par leur trio événement + matcher + commande) ; **aucune de tes entrées n'est
  retirée** ; sur un réglage en conflit, **ta valeur est conservée**. (Si ton `settings.json`
  est un JSON invalide, l'installeur **ne fusionne pas** : il t'avertit et te laisse choisir.)
- **`skills/`, `agents/`, `hooks/`** : les éléments **absents** sont copiés ; un élément de même
  nom déjà présent est **gardé tel quel** par défaut (jamais écrasé sans que tu le demandes).

#### Étape C.3 — Les options de l'installeur

Tu peux piloter le comportement avec ces drapeaux :

| Drapeau | Effet |
|---|---|
| `--merge` | **(défaut)** Fusion sûre ; en cas de conflit, garde l'existant. |
| `--overwrite` | Sur collision, **écrase** (après sauvegarde). Non-interactif. |
| `--keep` | Sur collision, **garde** l'existant (ignore). Non-interactif. |
| `--dry-run` | Affiche le plan par catégorie, **n'écrit rien**, ne crée aucune sauvegarde. |
| `--yes` | **Non-interactif** : applique le mode choisi sans poser de question. |
| `--backup-dir <chemin>` | Dossier de sauvegarde explicite (défaut `~/.claude/.iakaframe-backup-<ts>/`). |
| `--target <dossier>` | Cible alternative (défaut `~/.claude`). |

L'installeur est **idempotent** : le relancer en mode fusion **ne produit aucun changement** si
tout est déjà en place (pas de doublon, pas de corruption). Tu peux donc le rejouer sans crainte
après une mise à jour du frame.

> **Windows / autres shells** : deux wrappers légers font exactement la même chose —
> `./install.sh [options]` (macOS/Linux) et `./install.ps1 [options]` (Windows PowerShell). Ils
> ne font qu'appeler `node install.mjs` avec tes arguments.

#### Repli manuel (si tu préfères tout faire à la main)

L'installeur est recommandé, mais rien ne t'empêche de poser la config manuellement. **Dans ce
cas, ne remplace jamais l'existant** — procède par ajout, après sauvegarde :

1. **Sauvegarde d'abord** : `cp -R ~/.claude ~/.claude.bak-<date>` (ou un zip).
2. **`CLAUDE.md`** : ouvre `kits/iakaframe-claude/global/CLAUDE.md`, copie son bloc
   `<!-- iakaframe:start -->` … `<!-- iakaframe:end -->` dans ton `~/.claude/CLAUDE.md`
   **s'il manque**. Ne supprime rien d'autre.
3. **`settings.json`** : ajoute **à la main** les entrées `hooks` manquantes (événement +
   matcher + commande) depuis `kits/iakaframe-claude/global/settings.example.json` ; garde tes
   valeurs. Dépose les hooks dans `~/.claude/hooks/`.
4. **skills / agents / hooks** : copie **uniquement** les éléments **absents** de ton
   `~/.claude/` ; n'écrase pas les tiens.

Pour référence, voici le contenu des dossiers sources dans l'archive :
`kits/iakaframe-claude/global/CLAUDE.md`, `.../global/hooks/*.mjs`,
`.../global/settings.example.json`, `.claude/skills/*`, `.claude/agents/*`.

#### Ce que câble le fichier de réglages

Une fois la config posée, les garde-fous sont branchés ainsi (tu n'as rien à faire, c'est pour
comprendre) :

| Quand | Ce qui se déclenche | Rôle |
|---|---|---|
| Fin de tour de l'assistant (`Stop`) | `identity-guard.mjs` | Vérifie que l'agent s'est bien identifié |
| Fin d'un sous-agent (`SubagentStop`) | `identity-guard.mjs` | Idem pour les agents délégués |
| Envoi d'un message (`UserPromptSubmit`) | `identity-remind.mjs` | Rappelle à l'agent son identité |
| Avant/après une délégation (`Task`) | `delegation-guard.mjs` | Garde le canal de délégation propre |
| Après une action de plan (`TodoWrite`/`Task`) | `plan-courante.mjs` | Tient le plan de travail à jour |

> **Bon à savoir** : ces hooks sont conçus pour **échouer en silence** (fail-open). S'ils ne
> sont pas configurés ou si un service qu'ils cherchent est absent, ils **ne bloquent rien** —
> ils se contentent de ne rien faire. Aucun risque de casser Claude Code.

#### Pointer vers le « foyer » du frame

Certaines commandes du CLI qui lisent la bibliothèque d'éléments ont besoin de savoir **où est
le frame**. Deux façons :

- **Ponctuellement** : ajoute `--root <chemin-du-StefFrame2>` à la commande, par ex.
  `iakaframe list personas --root ~/iakaframe/StefFrame2`. Depuis le dossier lui-même, `--root .`
  suffit.
- **Une fois pour toutes** : exporte une variable d'environnement.

  ```bash
  export IAKAFRAME_ROOT=~/iakaframe/StefFrame2
  ```

  Pour rendre ça permanent, ajoute cette ligne à ton `~/.zshrc` (macOS) ou `~/.bashrc` (Linux).

> Le terme `<IAKAFRAME_HOME>` que tu peux croiser dans la doc désigne exactement cet
> emplacement : le dossier décompressé du frame.

---

## 4. Premier lancement et prise en main

### 4.1 Vérifier que le CLI répond

Depuis le dossier `StefFrame2/` :

```bash
iakaframe banner IAKAFRAME
```

Tu dois voir un **grand titre en lettres ASCII** (dessiné avec le moteur FIGlet embarqué),
sur plusieurs lignes. Si ça s'affiche, le CLI fonctionne.

```bash
iakaframe list personas --root .
```

Doit lister **8 personas** (Odin, Aragorn, Gandalf, Gimli, Legolas, Helm, Loki, Nathalie), lus
depuis la bibliothèque embarquée dans le frame.

### 4.2 Réveiller l'équipe dans Claude Code

Lance Claude Code dans un dossier de projet, puis écris simplement :

```
iakastart
```

Cela affiche le **bandeau IAKAFRAME** et le **roster des 8 agents**, et rend l'équipe prête à
être sollicitée. (Les mots `iakaframe` et `odin` déclenchent la même chose.) **Rien n'est
lancé automatiquement** : c'est juste la mise en place ; ensuite tu demandes ce que tu veux.

### 4.3 Poser un premier jalon

Un **jalon** est un point de validation : un cadre qui dit « qui a produit quoi, pour qui ».
Le CLI sait le dessiner :

```bash
iakaframe jalon --name "Premier essai" --from Gandalf --to Gimli --content "Ça tourne"
```

Tu obtiens un encadré propre avec émetteur / contenu / récepteur. C'est l'outil qu'on utilise
aux points de décision de la méthode.

### 4.4 Le cycle d'une feature

Voici la boucle de travail que la méthode fait vivre (dans Claude Code, avec l'équipe) :

1. **Besoin** — tu exprimes ce que tu veux.
2. **Cadrage** (Gandalf) — l'agent transforme le besoin en **instruction écrite** dans
   `specs/instructions/<feature>.md`. Aucun code à ce stade.
3. **Validation** — tu relis et tu valides l'instruction (c'est un jalon).
4. **Réalisation** (Gimli) — l'agent lit l'instruction, code, teste, commite par petits pas.
5. **Qualité** (Legolas) — vérification, tests, gate automatique.
6. **Documentation** (Nathalie) — le guide utilisateur de la feature, et la mémoire du projet.
7. **Boucle** — feedback, ajustements, on recommence.

Entre les étapes, les **checkpoints** (`iakaframe update` / `snapshot`) enregistrent l'état du
projet et son historique.

---

## 5. Listing exhaustif des éléments

Tout ce que contient StefFrame2, catégorie par catégorie. StefFrame2 **hérite intégralement**
de StefFrame1, puis **ajoute** le CLI, les hooks, les réglages, la charte de démarrage et les
guides.

### 5.1 Les personas / agents (8)

Ce sont les rôles de l'équipe. Chacun a un **contrat** (`personas/<nom>.md`, aussi déployé dans
`~/.claude/agents/`) et, pour la plupart, une **skill** (son savoir-faire détaillé).

| Pastille | Persona | Rôle |
|---|---|---|
| 🦅 | **Odin** | Super-agent portefeuille : démarrage de projet, changement d'équipe, création d'équipe. Le seul à toucher au « foyer » de la méthode. |
| 🛡️ | **Aragorn** | Coordination entre agents : orchestration en 3 phases, dispatch à la demande, interlocuteur par défaut d'un projet. |
| 🧙 | **Gandalf** | Cadrage (phase 1) : transforme un besoin en instruction fermée, écrite, sans code. |
| ⚒️ | **Gimli** | Développement + devops (phases 2→3) : lit l'instruction, code, teste, déploie. Pas de skill dédiée — son cadre vit dans le `CLAUDE.md` du projet. |
| 🏹 | **Legolas** | Qualité / test (phases 2/3) : vérification, tests, gate automatique. |
| 🌉 | **Helm** | Déploiement (squad prod) : mise en production, accès, rollback, surveillance, alertes. |
| 🎭 | **Loki** | Design : supports visuels « on-brand » à partir d'un catalogue de chartes. |
| 📖 | **Nathalie** | Documentation : guides utilisateurs et mémoire humaine du projet. |

> La bibliothèque contient aussi un fichier `_TEMPLATE.md` (gabarit pour créer un nouveau
> persona), ce qui fait **9 fichiers** dans `personas/` — mais **8 agents réels**.

### 5.2 La bibliothèque d'atomes (`library/`)

Les « briques » réutilisables de la méthode, rangées par famille. Ce sont des fichiers Markdown
que le CLI sait lister, montrer et assembler.

| Famille | Nombre | Ce que c'est |
|---|---|---|
| **principles/** | 14 | Les règles permanentes : cadrage-avant-code, commits & versionnement, confirmation des actes destructifs, documentation, gestion du backlog, identité & badges, isolation Docker, langue, mock en dev, MVP d'abord, périmètres étanches, qualité, réutilisation de l'existant, self-hosted d'abord. |
| **rituals/** | 5 | Les gestes récurrents : `iakastart`, `init`, `log-conversation`, `snapshot`, `update`. |
| **guardrails/** | 3 | Les garde-fous : délégation, identité, périmètre (matérialisés par les hooks). |
| **roles/** | 8 | Les définitions de rôle : cadrage, coordination, déploiement, design, dev, documentation, portefeuille, qualité. |
| **personas/** | 9 | Les incarnations des rôles (8 agents + 1 gabarit). |
| **scaffolds/** | 2 | Les squelettes de projet : `projet` (projet simple) et `portefeuille` (dossier chapeau). |
| **workflows/** | 1 | Le flux de référence : `iakaframe-3phases` (cadrage → réalisation → qualité). |

### 5.3 Les assemblages

Au-dessus des atomes, les documents qui les combinent :

- **`methode-de-travail.md`** — le document de référence complet de la méthode.
- **`methods/iakaframe.md`** — la méthode assemblée.
- **`teams/iakaframe-8.md`** — la composition de l'équipe des 8 agents.
- **`bindings/iakaframe-claude-default.md`** — le « branchement » par défaut de la méthode sur
  Claude Code.
- **`README.md`** — l'index du frame.

### 5.4 Les 16 skills (savoir-faire des agents)

Une skill est une méthode détaillée qui se **déclenche** quand le contexte s'y prête. Il y en a
**16**. Sept sont attachées à un agent, neuf sont des briques transverses.

**Skills de rôle (7) :**

| Skill | Agent | Ce qu'elle fait |
|---|---|---|
| `iakaframe-odin` | Odin | Gestion du portefeuille : switch d'équipe, démarrage de projet, création d'équipe. |
| `iakaframe-aragorn` | Aragorn | Coordination : orchestration 3 phases, dispatch, canal de discussion. |
| `iakaframe-cadrage` | Gandalf | Cadrage : du besoin à l'instruction fermée. |
| `iakaframe-qualite` | Legolas | Qualité / test avec gate automatique. |
| `iakaframe-deploiement` | Helm | Déploiement, accès, rollback, surveillance. |
| `iakaframe-design` | Loki | Production de supports on-brand à partir d'un catalogue de chartes. |
| `iakaframe-nathalie` | Nathalie | Guides utilisateurs et documentation. |

**Skills méthode & briques (9) :**

| Skill | Ce qu'elle fait |
|---|---|
| `iakastart` | Bootstrap : affiche le roster et rend l'équipe prête (déclenchée par « iakastart / iakaframe / odin »). |
| `iakaframe-init` | Amorçage de la méthode sur un projet. |
| `iakaframe-etat-des-lieux` | Fait le point sur le projet (lecture de l'état des lieux, reprise). |
| `iakaframe-update` | Checkpoint : régénère l'état des lieux, commit global, push. |
| `iakaframe-git` | Branche le projet sur un serveur git self-hosted. |
| `iakaframe-docker` | Stack Docker isolée par projet (compose, ports). |
| `iakaframe-log-conversation` | Main courante des IA : pousse les échanges vers une base de documents. |
| `iakaframe-humandoc` | Mémoire humaine : publie les specs dans un outil de doc externe. |
| `iakaframe-learning` | Boucle d'apprentissage : capitalise un feedback dans la méthode. |

> Certaines de ces skills supposent une infrastructure que tu n'as pas forcément : voir §6.

### 5.5 Le CLI `iakaframe` (l'outil exécutable)

Le cœur de ce que StefFrame2 ajoute. C'est un paquet Node **sans aucune dépendance** (il tourne
hors-ligne). Il expose **~27 commandes**, organisées en familles. Les commandes de la
bibliothèque acceptent `--root <frame>` pour savoir où lire les atomes.

| Famille | Commandes | À quoi ça sert |
|---|---|---|
| **Rituels & gates** | `banner`, `jalon` | Afficher un titre ASCII (FIGlet embarqué) ; dessiner le cadre d'un point de validation. |
| **Entrée / sortie de projet** | `go`, `brief`, `recap`, `root` | Entrer dans un projet et lancer son runner ; afficher le brief d'entrée ; le récap de fermeture ; résoudre le dossier chapeau. |
| **Cycle de vie du projet** | `onboard`, `init`, `snapshot`, `update` | Créer/amorcer un projet ; déployer le kit ; générer l'état des lieux ; faire un checkpoint (snapshot + commit + push). |
| **Diagnostic & config** | `services`, `config`, `agents` | Sonder les services disponibles ; écrire la config du projet ; gérer l'équipe d'agents (list / fullteam / affect / status). |
| **Bibliothèque d'atomes** | `list`, `show`, `add`, `remove`, `attach`, `detach`, `assemble`, `switch` (alias `use`) | Lister et afficher les atomes ; en ajouter/retirer ; les rattacher/détacher ; assembler un document ; changer d'équipe active. |
| **Mémoire & apprentissage** | `memory`, `open`, `recall`, `close`, `review`, `consolidate` | Ouvrir/rappeler/fermer une mémoire de session ; passer en revue ; consolider un apprentissage. |

Utilise `iakaframe --help` pour l'aide générale, et `iakaframe <commande> --help` selon les cas.

**Contenu technique du dossier `cli/`** livré :

- `cli/package.json` — le manifeste du paquet (nettoyé : plus de registre privé, la commande
  `iakaframe` conservée). Exige **Node ≥ 20**.
- `cli/README.md` — la doc de référence du CLI.
- `cli/src/index.js` — le point d'entrée (dispatch des commandes, zéro dépendance).
- `cli/src/commands/*.js` — les fichiers de commandes.
- `cli/src/lib/*.js` — les fonctions internes (git, table, bibliothèque, mémoire…).
- `cli/src/lib/figfont/*.flf` — **7 polices** FIGlet embarquées (`ansi_shadow`, `standard`,
  `big`, `bloody`, `doom`, `slant`, `small`) + un fichier `CREDITS.txt`. C'est ce qui permet
  les titres ASCII **sans rien télécharger**.

### 5.6 Les 5 kits (un par runner)

Un « kit » adapte la méthode à un environnement d'IA donné. Il y en a **5** :

| Kit | Pour quel outil |
|---|---|
| `iakaframe-claude` | **Claude Code** — c'est celui que tu utilises (contient CLAUDE.md, skills, agents, hooks, réglages). |
| `iakaframe-codex` | Codex CLI. |
| `iakaframe-ollama` | Ollama (modèles locaux). |
| `iakaframe-openwebui` | Open WebUI. |
| `iakaframe-anythingllm` | AnythingLLM. |

Pour StefFrame2, **seul le kit `iakaframe-claude` est nécessaire** ; les autres sont fournis
pour référence si un jour tu changes de runner.

### 5.7 Les hooks (garde-fous, dans le kit Claude)

Dans `kits/iakaframe-claude/global/hooks/`, **5 fichiers `.mjs`** :

| Hook | Rôle |
|---|---|
| `identity-guard.mjs` | Vérifie qu'un agent s'est bien identifié (badge) en fin de tour. |
| `perimeter-guard.mjs` | Vérifie qu'un agent reste dans son périmètre. |
| `identity-remind.mjs` | Rappelle son identité à l'agent à chaque message. |
| `delegation-guard.mjs` | Garde propre le canal de délégation entre agents. |
| `plan-courante.mjs` | Tient à jour le plan de travail vivant. |

> Des équivalents `.ps1` (PowerShell, pour Windows) sont aussi présents pour la parité
> multi-OS, mais le fichier de réglages d'exemple ne branche **que** les `.mjs` (puisque tu
> installes Node).

### 5.8 La charte de démarrage `design-starter/`

Une charte graphique **neuve et neutre** (sans marque personnelle), fournie pour habiller
d'éventuels documents produits par l'agent de design (Loki). **6 fichiers :**

| Fichier | Contenu |
|---|---|
| `starter.css` | Palette générique documentée (variables CSS), sobre. |
| `logo.svg` | Un logo placeholder neutre. |
| `template-doc.html` | Gabarit de document lié à `starter.css`. |
| `template-slides.html` | Gabarit de présentation. |
| `template-flyer.svg` | Gabarit d'affichette. |
| `charte.md` | Mode d'emploi court : « charte par défaut ; duplique-la pour créer la tienne ». |

### 5.9 La documentation fournie

- **`docs/git-hosting.md`** — mini-guide pour brancher un projet sur **ton propre serveur git**
  self-hosted (en HTTP + token), avec des placeholders `<GIT_HOST>`, `<GIT_TOKEN>`… à remplacer
  par tes valeurs. Aucun secret n'est jamais écrit en dur.
- **`GUIDE-INSTALLATION.md`** — le guide d'installation court, à la racine de l'archive.
- **`README.md`** — l'index du frame (mentionne le CLI, la charte, le guide).

### 5.10 L'installeur `install.mjs` (+ wrappers)

À la racine de l'archive, l'**installeur collision-aware** qui pose la config Claude Code sans
jamais écraser l'existant (voir §3, étape C). Node pur, zéro dépendance :

| Fichier | Rôle |
|---|---|
| `install.mjs` | L'installeur : détection par catégorie, fusion intelligente, sauvegarde horodatée, mode interactif ou drapeaux (`--dry-run`, `--merge`, `--overwrite`, `--keep`, `--yes`, `--backup-dir`, `--target`). Idempotent. |
| `install.sh` | Wrapper POSIX (macOS/Linux) qui appelle `node install.mjs` avec tes arguments. |
| `install.ps1` | Wrapper Windows (PowerShell), même rôle. |

---

## 6. Les skills qui « ne font rien » (no-op) et comment les activer

C'est un point important à comprendre pour ne pas être surpris.

Certaines skills supposent une **infrastructure** (des serveurs, des services réseau) que tu
n'as **pas** en installant simplement le zip. **Elles ne plantent pas** : elles sont conçues
pour se **désactiver proprement** (on dit « no-op » : elles ne font rien plutôt que d'échouer).

Les **4 skills concernées** :

| Skill | Ce qu'elle voudrait faire | Ce qu'il lui faudrait |
|---|---|---|
| `iakaframe-git` | Créer/pousser un dépôt sur un serveur git | Un **serveur git self-hosted** + un token |
| `iakaframe-humandoc` | Publier les specs dans un wiki / outil de doc | Un **outil de documentation externe** (wiki) |
| `iakaframe-log-conversation` | Tracer les échanges dans une base | Un **broker de messages + une base de documents** |
| `iakaframe-design` | Produire des supports on-brand | Un **catalogue de chartes** (au-delà de la charte de démarrage) |

Tant que tu ne fournis pas ces éléments, ces skills restent **dormantes**. Le reste de la
méthode fonctionne parfaitement sans elles.

### Comment les activer plus tard

Ces skills utilisent des **placeholders** — des marqueurs `<...>` à remplacer par tes vraies
valeurs quand tu seras prêt :

- **git** : renseigne `<GIT_HOST>`, `<GIT_REMOTE_URL>`, `<GIT_TOKEN>`, `<vous>`, `<repo>` en
  suivant `docs/git-hosting.md`. Le token passe par une variable d'environnement ou le
  `.git/config` local — **jamais** écrit en dur ni commité.
- **main courante / logs** : renseigne `<MQTT_BROKER>` (le broker) et l'URL de ta base de
  documents (`<COUCHDB_URL>` ou équivalent), via variables d'environnement.
- **mémoire humaine** : renseigne l'URL de ton outil de doc (`<APPFLOWY_URL>` ou équivalent).
- **design** : pour de nouvelles chartes, **duplique** le dossier `design-starter/` et
  pointe la charte par défaut (`<CHARTES_DIR>` / `<charte-defaut>`) vers ta copie. La charte
  de démarrage sert de base neutre à personnaliser.

> **En résumé** : à l'installation « nue », ces 4 skills sont silencieuses et inoffensives. Tu
> les allumes une par une, plus tard, en remplaçant leurs placeholders — sans jamais mettre de
> secret dans un fichier suivi par git.

---

## 7. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `node : command not found` | Node.js n'est pas installé | Installe Node ≥ 20 (§2), puis vérifie avec `node -v`. |
| `node -v` affiche `v18.x` ou moins | Version trop ancienne | Mets Node à jour vers **20+** : le CLI utilise des fonctions natives de Node 20. |
| `iakaframe : command not found` | Le CLI n'a pas été installé globalement | Refais `npm install -g ./cli` depuis le dossier `StefFrame2/`, **ou** utilise `node cli/src/index.js <cmd>`. |
| `iakaframe list personas` renvoie une liste vide ou une erreur de chemin | Le CLI ne sait pas où est le frame | Ajoute `--root .` (depuis le dossier) ou définis `IAKAFRAME_ROOT` (§3, étape C). |
| `claude : command not found` | Claude Code n'est pas installé | Installe Claude Code séparément (§2) ; il n'est pas dans le zip. |
| « iakastart » n'affiche pas le roster | Config globale non posée | Relance l'installeur : `node install.mjs --dry-run` pour voir ce qui manque, puis `node install.mjs`. Vérifie que `~/.claude/CLAUDE.md`, `~/.claude/skills/` et `~/.claude/agents/` sont bien en place (§3, étape C). |
| Les garde-fous (badges, plan) ne se déclenchent pas | Hooks non câblés | Vérifie que la section `hooks` a bien été fusionnée dans ton `~/.claude/settings.json` et que les `.mjs` sont dans `~/.claude/hooks/`. Au besoin, rejoue `node install.mjs` (idempotent). |
| L'installeur a modifié un fichier que tu voulais garder | Choix « écraser » retenu par erreur | Restaure depuis la sauvegarde : le contenu d'avant est dans `~/.claude/.iakaframe-backup-<ts>/` (arborescence préservée). Recopie le fichier voulu, puis relance en `--keep` si besoin. |
| Une skill git / doc / logs « ne fait rien » | Placeholders non renseignés (comportement normal) | C'est voulu : voir §6. Renseigne les `<...>` correspondants pour l'activer. |
| Le bandeau ASCII s'affiche « cassé » ou en simple texte | Terminal non-UTF8 | Normal : le CLI **replie** automatiquement sur la police `Standard` (ASCII pur). Rien à corriger. |

> **Le CLI est hors-ligne** : si `npm install -g ./cli` semble « chercher » sur Internet, ce
> n'est pas le CLI qui en a besoin (il a zéro dépendance) — vérifie juste que tu es bien dans
> le dossier `StefFrame2/` et que tu vises `./cli`.

---

## 8. Ce qui n'est PAS inclus (et pourquoi)

Pour éviter les mauvaises surprises, voici ce que StefFrame2 **ne contient volontairement pas** :

| Non inclus | Pourquoi |
|---|---|
| **Une interface graphique (GUI)** | Par conception. StefFrame2 est la méthode **exécutable en ligne de commande**. L'application graphique « iakaFrameGUI » est un autre produit, hors périmètre. |
| **Claude Code, Node.js, git** | Ce sont les prérequis à installer soi-même (§2). Le zip fournit la méthode et son outil, pas leur moteur. |
| **Le moindre secret ou token** | Aucun mot de passe, jeton ou clé n'est présent. Tout ce qui touche à ton infra passe par des placeholders `<...>` que tu renseignes par variable d'environnement. |
| **Le registre npm privé** | Le CLI est livré **en direct** (dossier `cli/`) et s'installe hors-ligne. Aucun besoin d'un serveur de paquets privé — la configuration correspondante a été retirée. |
| **Les tests du CLI** (`cli/test/`) | Ils dépendaient de composants internes non livrés ; les retirer ne change rien à l'exécution. |
| **Les artefacts personnels de réglages** | Barre d'état sur mesure, démon de fond, serveur de langage (LSP), places de marché d'extensions, mode « permissions désactivées » : tout ce qui était spécifique à la machine d'origine a été exclu du fichier de réglages d'exemple. |

> **Un mot sur Node ≥ 18 vs ≥ 20** : le guide d'installation court de l'archive
> (`GUIDE-INSTALLATION.md`) mentionne « Node ≥ 18 », mais le manifeste du CLI (`cli/package.json`)
> exige **Node ≥ 20** et le smoke test de fabrication cible Node 20. **Installe donc Node 20 ou
> plus** — c'est la valeur qui fait foi. (Point de détail signalé plutôt que masqué.)

---

Ce guide décrit StefFrame2 tel que défini par son cadrage et par les fichiers réellement
présents dans l'archive. Si tu bloques sur une étape, reviens au §7 (dépannage) ou relis le
`GUIDE-INSTALLATION.md` fourni à la racine du zip. Bonne exploration.

[NATHALIE][Nathalie] 🟠
