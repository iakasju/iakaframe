# iakaframe — Méthode de travail IA-augmentée

> La méthode de collaboration entre **Stéphane** (le développeur), **Cowork**
> (Claude en mode réflexion) et **Claude Code** (Claude en mode exécution),
> extraite et généralisée à partir des projets `IAKA Vod`, `robotimmo`,
> `iakaAFstorage`, `iakabox`, `iakaJarvis`.
>
> Ce document est la référence canonique. Il est volontairement agnostique du
> stack : il s'applique à n'importe quel langage, framework ou type de projet.

---

## Le principe fondateur

**C'est le workflow qui produit la qualité, pas l'IA.**

Une IA sans cadre génère du code plausible. Un workflow structuré — avec des
rôles clairs, des instructions écrites et des outils de vérification — produit
du logiciel fiable. La différence entre les deux, c'est la méthode.

Le postulat est simple : l'IA est un exécutant puissant mais aveugle. Elle ne
sait pas ce qu'elle ne sait pas. C'est le développeur qui apporte la vision, les
décisions d'architecture et les critères de qualité. **L'IA amplifie ; le
workflow cadre.**

---

## Les trois acteurs

### 1. Le développeur (Stéphane) — le décideur

Il tranche sur l'architecture, valide les choix techniques et juge le résultat.
Il ne délègue pas la réflexion — il délègue l'exécution.

- Définit les features et leur priorité (le backlog dans `CLAUDE.md`)
- Valide ou corrige les propositions de Cowork
- Teste le résultat dans l'app réelle
- Donne du feedback qui sera **mémorisé** et appliqué aux sessions suivantes

**Préférences confirmées (transverses aux projets) :**
- Réponses **en français**, concises et directes — pas de bavardage.
- **MVP d'abord, puis on itère.** Pas de sur-ingénierie.
- **Self-hosted / open-source d'abord** : pour tout choix de backend, proposer
  la version locale en option n°1 ; le cloud n'est qu'un *fallback* justifié.
- Travaille sur **Windows + Docker Desktop + PowerShell**.
- **Isolation Docker par projet** : chaque projet tourne dans sa **propre stack
  Docker** — réseau, volumes et containers **nommés/préfixés par projet**
  (`<projet>-dev-*`) **et ports hôte distincts** (chaque projet décale ses ports
  pour ne jamais entrer en collision avec un autre, ex. robotimmo 5432 / robby-bo
  5433 / robbycollect 5434). Jamais de partage de stack ni de ressources entre projets.
- Valide vite les plans détaillés ; choisit souvent l'option « Recommandé ».
- Apprécie un découpage en **commits atomiques** par étape.

### 2. Cowork (Claude — mode réflexion) — architecte & rédacteur

Cowork **ne touche jamais au code**. Il analyse, propose, documente et produit
les fichiers d'instructions que Claude Code consommera.

- Analyse le code existant pour comprendre l'état réel du projet (lecture seule)
- Discute les choix techniques avec le développeur
- Rédige des fichiers d'instructions précis dans `specs/instructions/`
- Produit specs, docs projet, rapports
- Prépare les workflows d'outillage (tests, doc, qualité)

> **Règle absolue : Cowork ne modifie jamais le code source.** Le jour où l'agent
> qui réfléchit est aussi celui qui exécute, il n'y a plus de contrôle.

### 3. Claude Code (Claude — mode exécution) — le développeur IA

Il lit les instructions, écrit le code, lance les commandes, produit les fichiers.
Il travaille dans le projet réel (`src/`, `src-tauri/`, `auth-api/`…).

- Lit l'instruction correspondante avant chaque tâche
- Implémente feature par feature, étape par étape
- Exécute builds, tests, linting
- Commite en *conventional commits*

Claude Code a des permissions explicites dans `.claude/settings.local.json`.

---

## L'équipe d'agents (« Yakaframe Avancé »)

Les trois acteurs sont le **modèle conceptuel** (décideur / réflexion / exécution). Pour
industrialiser le développement « au fil de l'eau » sur une chaîne CI/CD, la couche
réflexion+exécution se **spécialise en une équipe d'agents**, chacun avec un rôle fermé.
Chaque agent porte une **incarnation** (un nom) pour le rendre mémorisable.

> Référence canonique et fiches détaillées : `specs/equipe-agents.md`.
> Définitions exécutables : `agents/` (subagents) + `skills/iakaframe-*` (savoir-faire).

### Le roster

| Agent | Rôle | Étape | Skill |
|---|---|---|---|
| 🦅 **Odin** | Super-agent **portefeuille** : switch d'équipe, démarrage projet, création d'équipe | `C:\work` (le seul) | `iakaframe-odin` |
| 🛡️ **Aragorn** | Coordination entre agents, suivi des jalons, reporting | par projet | `iakaframe-aragorn` |
| 🧙 **Gandalf** | Architecte-cadreur : besoin → instruction fermée | 0 | `iakaframe-cadrage` |
| ⚒️ **Gimli** | Développement : code, build, commits (×N parallèle) | 1 | (CLAUDE.md) |
| 🏹 **Legolas** | Qualité / test : verdict PASS, gate auto | 2-3 | `iakaframe-qualite` |
| 🌉 **Helm** | Production : déploiement, accès, rollback **+ surveillance** | 4-5 | `iakaframe-deploiement` |
| 🎭 **Loki** | Design : supports on-brand (catalogue de chartes `design-*/`) | brique | `iakaframe-naonedge` |
| 📖 **Nathalie** | Guides utilisateurs / documentation | brique | `iakaframe-nathalie` |

> **n8n / Hermes** sont des **outils** d'orchestration qu'Aragorn pilote — pas des agents.

**Deux niveaux d'orchestration.** Au-dessus des équipes, un **super-agent portefeuille,
🦅 Odin**, disponible en permanence, est le **seul agent affecté à `C:\work`** (la racine de
tous les projets). Il reçoit les ordres de haut niveau de Stéphane — **switcher** d'équipe,
**démarrer** un projet (`init iakaframe`), **créer** une équipe (`fullteam`) — et passe la
main à l'**Aragorn** du projet concerné. La hiérarchie&nbsp;:

```
Stéphane → 🦅 Odin (portefeuille, C:\work) → 🛡️ Aragorn (par projet) → agents
```

Odin n'entre jamais dans le métier d'un projet&nbsp;: il ouvre la bonne porte, Aragorn
coordonne à l'intérieur. C'est la **répartition entre projets** matérialisée — celle qui,
sinon, resterait un geste manuel de Stéphane.

### Les jalons (qui fait quoi)

Une feature avance par jalons. À chaque jalon, **un seul** agent est aux commandes ;
Aragorn enchaîne et vérifie le gate avant de passer au suivant.

| Jalon | Agent | Entrée → Sortie | Gate |
|---|---|---|---|
| **J0 — Cadrage** | 🧙 Gandalf | besoin → `specs/instructions/{feature}.md` | **humain** (Stéphane valide l'instruction) |
| **J1 — Dev** | ⚒️ Gimli (×N) | instruction → branche + commits | — |
| **J2 — Qualité** | 🏹 Legolas | branche → verdict PASS/FAIL | **auto** (tests verts) |
| **J3 — Intégration** | 🏹 Legolas → 🌉 Helm | PASS → version candidate `vX.Y.Z-rc` sur stage | auto |
| **J4 — Déploiement** | 🌉 Helm | rc recettée + feu vert → prod via alias | **humain** (feu vert tracé) |
| **J5 — Surveillance** | 🌉 Helm | prod → santé OK / alerte / rollback | continu |

Transverses : 🎭 **Loki** (supports visuels) et 📖 **Nathalie** (guides) interviennent sur
sollicitation, à tout jalon. **Tout agent peut solliciter Stéphane directement** ; Aragorn
est l'interlocuteur par défaut.

À l'inverse, **Stéphane peut demander à Aragorn de lancer un travail sur un agent** — en le
nommant (« lance Gimli sur X ») ou en décrivant la tâche (Aragorn route). Aragorn émet un
**ordre de mission** (quoi, base, critère de fin), vérifie le **gate amont** du jalon, puis
**dispatche le subagent** (outil Agent en session, ou n8n/Hermes en chaîne automatisée).

**Canal de communication — Slack (bidirectionnel, via n8n).** Aragorn dialogue avec Stéphane
sur **Slack**, piloté par n8n (qui porte les identifiants — aucun secret côté agent) :
sortant (états de jalons, blocages, **demandes de feu vert**) et entrant (arbitrages, ordres
de dispatch, **feu vert prod** captés par un trigger n8n). Slack devient un **canal de
pilotage à distance**. Équivalent self-hosted : Mattermost (même schéma).

### Étanchéité : l'image est mutualisée, le conteneur est étanche

Comme pour l'isolation Docker par projet, on distingue **définition** et **exécution** :

- **Définitions mutualisées** : une persona/skill est définie **une seule fois** (ici, dans
  l'installation iakaframe) et réutilisée partout. *Da Vinci n'existe qu'une fois.*
- **Exécution étanche** : **chaque projet instancie SA propre équipe**, scopée à son repo,
  son `CLAUDE.md`, ses `specs/`. **Aucun agent ne porte deux projets dans un même contexte**
  (zéro contamination inter-projets).
- **Répartition entre projets** : elle se fait **au niveau portefeuille** (Stéphane décide
  quel projet avance), **pas dans l'agent**. Dans un projet, Aragorn répartit entre agents.

### Incarnation technique : subagents + skills

- Chaque agent = un **subagent Claude Code** (`agents/<agent>.md`, déployé dans
  `<projet>/.claude/agents/`) : contexte isolé, outils propres, **dispatchable** par Aragorn
  et **parallélisable** (N Gimli en worktrees).
- Le **savoir-faire** du rôle vit dans une **skill** (`skills/iakaframe-*`) que l'agent
  charge. Le subagent = le *contrat* ; la skill = la *méthode*.
- Cap multi-plateformes (vision PDF) : la même équipe sera déclinable sur Claude, ChatGPT et
  IA locale auto-hébergée. Aujourd'hui : incarnation **Claude**.

### Créer un agent

1. **Partir du template** : `pwsh iakaframe-agents.ps1 -Action create -Agent <nom>` copie
   `agents/_TEMPLATE.md` → `agents/<nom>.md`.
2. **Remplir le frontmatter** (`name`, `description` précise pour le routage, `tools`) et le
   corps (mission, périmètre fermé, entrées→sorties, gate, étanchéité).
3. **Savoir-faire** : si le rôle a une méthode détaillée, créer la skill
   `skills/iakaframe-<nom>/SKILL.md` et l'associer dans `iakaframe-agents.ps1` (`$skillOf`).
4. **Déployer** : `-Action affect -Agent <nom> -Project <chemin>` (ou `fullteam`).

### Gérer et lancer l'équipe — `iakaframe-agents.ps1`

| Commande | Effet |
|---|---|
| `-Action list` | liste les agents canon + leur skill |
| `-Action create -Agent <nom>` | scaffold un nouvel agent depuis le template |
| `-Action affect -Agent <nom> -Project <chemin>` | affecte **un** agent à un projet |
| `-Action fullteam -Project <chemin>` | **déploie la full team** dans un projet |
| `-Action status -Project <chemin>` | liste les agents déjà affectés |
| `-Global` | cible l'installation utilisateur `~/.claude` (définitions mutualisées) |

`affect`/`fullteam` copient le subagent + sa skill dans `<projet>/.claude/` (et le catalogue
de chartes `design-*/` pour Loki) : le projet reçoit **sa** copie scopée.

---

## Le workflow en pratique

### Le cycle standard d'une feature

```
1. Le développeur exprime un besoin
        ↓
2. Cowork analyse le code existant (lecture seule)
        ↓
3. Discussion développeur ↔ Cowork (choix techniques, arbitrages, scope)
        ↓
4. Cowork rédige un fichier d'instructions → specs/instructions/{feature}.md
        ↓
5. Le développeur valide les instructions
        ↓
6. Claude Code lit les instructions et implémente (étape par étape, commits intermédiaires)
        ↓
7. Le développeur teste et donne du feedback
        ↓
8. Si correction nécessaire → retour à l'étape 2 (en Cowork)
```

### Le cycle de correction d'erreur

Quand Claude Code prend une mauvaise direction, le développeur **ne corrige pas
l'IA ligne par ligne**. Il remonte au niveau de la décision (en Cowork), et la
décision redescend sous forme d'instruction écrite.

```
1. Le développeur constate le problème
        ↓
2. Discussion en Cowork (pas de micro-management dans Claude Code)
        ↓
3. Cowork diagnostique, propose une solution
        ↓
4. Cowork rédige une instruction corrective → specs/instructions/fix-{problème}.md
        ↓
5. Claude Code lit et applique la correction
```

---

## Pourquoi le workflow crée la qualité

### 1. La séparation réflexion / exécution empêche les dérives

Une IA qui réfléchit et code en même temps optimise localement, sans recul sur
l'architecture globale. En séparant les rôles, chaque décision passe par un
filtre : *est-ce cohérent avec le reste du projet ?*

> Exemple réel (IAKA Vod) : Claude Code voulait ajouter FFmpeg pour le transcodage
> vidéo. C'est en Cowork que la décision a été prise de supprimer cette approche —
> les players natifs (AVPlay, Shaka, hls.js) décodent tout en hardware. Claude Code
> seul aurait implémenté une solution complexe et inutile.

### 2. Les instructions écrites sont une spécification vérifiable

Un fichier `specs/instructions/{feature}.md` n'est pas un prompt vague. C'est un
document structuré : le problème, ce qui existe, la décision, les étapes, les
fichiers concernés, les comportements attendus. Claude Code peut le relire, le
développeur peut le relire, et six mois plus tard l'historique des décisions est
toujours là.

**La mémoire de l'IA est volatile. Les fichiers d'instructions sont permanents.**

### 3. Les outils de vérification ferment la boucle

Sans vérification automatique, l'IA peut produire du code qui compile mais qui ne
fait pas ce qu'on attend.

| Catégorie | Ce qu'elle vérifie | Exemples d'outils |
|---|---|---|
| Typage statique | Types corrects, cohérence des interfaces | `tsc` · `mypy` · `cargo check` |
| Linting | Conventions, patterns dangereux, code mort | ESLint · Clippy · Ruff · Biome |
| Tests unitaires | Comportement attendu, régressions | Vitest · Jest · pytest · `cargo test` |
| Couverture | Code non testé identifié | V8 Coverage · Istanbul · coverage.py |
| Doc automatique | API documentée depuis le code | TypeDoc · Sphinx · `cargo doc` |
| Rapport qualité | Vue consolidée de toutes les métriques | script custom (`quality-report.sh`) |

L'IA génère le code. Les outils vérifient le code. Le développeur juge le
résultat. Aucun des trois ne fait le travail des deux autres.

### 4. Le feedback persiste entre les sessions

Chaque correction, chaque préférence exprimée est **mémorisée** (mémoire projet
Claude) et appliquée aux sessions suivantes. Exemples réels :

- « Ne pas gaspiller les appels API — utiliser du mock en dev, cacher
  agressivement » → fixtures figées dans `specs/mock/` + cache.
- « Cowork = réflexion, Claude Code = exécution » → jamais de code depuis Cowork.
- « Commit régulièrement pour pouvoir downgrade une erreur » → commits atomiques
  fréquents, jamais de `reset --hard`/`push --force` côté IA (filet de sécurité git).
- « Privilégier le self-hosted » → Ollama/local proposé avant tout cloud.
- « Réutiliser l'infra MCP existante plutôt qu'embarquer un LLM ».

L'IA apprend de ses erreurs si — et seulement si — le workflow prévoit un
mécanisme de feedback persistant.

---

## Permissions & filet de sécurité

Le travail itératif sur Docker/dev est ralenti par les prompts de permission. La
convention retenue sur les projets :

- **Allowlist large** (`Bash(*)`, `PowerShell(*)`, outils fichiers) + **denylist
  ciblée** sur le destructif (`rm -rf` sur paths système, `format`, fork-bomb,
  `push --force`, suppression de volumes nommés…). Voir le `settings.local.json`
  du kit.
- Sur certains projets, `defaultMode: bypassPermissions` est actif (aucun prompt).
- **Contrepartie obligatoire : commit après chaque jalon logique** (toutes les
  5-10 min de travail productif), messages préfixés (`feat:`, `fix:`, `chore:`,
  `wip:`). Le filet de sécurité devient git : `git reset --hard <sha>` possible
  côté **développeur** en cas d'erreur.
- Pour une action **vraiment** destructive hors denylist : demander confirmation
  par **message texte** avant d'agir (pas via prompt de permission, qui est bypass).

---

## La structure du projet reflète le workflow

```
mon-projet/
├── CLAUDE.md                    ← Contrat de travail pour Claude Code
│                                  (stack, conventions, commandes, backlog)
│
├── specs/                       ← Espace Cowork (JAMAIS de code ici)
│   ├── PROJET.md                ← Vision projet, specs, sources de données
│   ├── instructions/            ← LE CŒUR DU WORKFLOW
│   │   ├── _TEMPLATE.md             (gabarit d'instruction)
│   │   ├── feature-auth.md          (✓ livrée)
│   │   ├── feature-search.md        (✓ livrée)
│   │   ├── fix-navigation.md        (← correction en cours)
│   │   └── quality-workflow.md      ← outils qualité (doc, tests, rapport)
│   └── mock/                    ← Données figées pour dev/test (zéro appel API)
│
├── src/                         ← Code source (Claude Code écrit ici)
├── scripts/quality-report.sh    ← Rapport qualité automatisé
└── .claude/settings.local.json  ← Permissions explicites de Claude Code
```

Le dossier `specs/instructions/` est la trace complète de toutes les décisions
techniques du projet. Chaque feature a son fichier ; chaque fichier contient le
« pourquoi » et le « comment ». C'est de la documentation **vivante**, écrite
*avant* l'implémentation — pas après coup.

> Note : sur IAKA Vod, ce dossier s'appelle `claudecowork/` au lieu de `specs/`.
> Le nom importe peu — c'est le rôle (espace réflexion, jamais de code) qui compte.

---

## Démarrer ou reprendre un projet — « init iakaframe »

La méthode s'amorce en une commande, sur un projet **neuf** comme **existant**.
Déclencheur : dire à Claude **« init iakaframe »** dans le répertoire.

- **Répertoire vide → nouveau projet.** Nom du dépôt = nom du dossier. On crée le
  dépôt Forgejo, on déploie la structure, premier commit, état des lieux `v0.1.0`,
  push. Puis on remplit `CLAUDE.md` et `specs/PROJET.md`.
- **Répertoire avec déjà du dev → reprise.** On déploie la structure *autour* du
  code existant (rien d'écrasé), on branche Forgejo si absent, on génère l'état des
  lieux de **reprise**, on en fait la synthèse et on propose la prochaine étape.

Orchestrateur : `iakaframe-onboard.ps1` (= `iakaframe-init` + `iakaframe-forgejo` +
commit + `iakaframe-snapshot`). Un projet déjà doté d'un `CLAUDE.md` : celui-ci prime.

**Auto-détection init ↔ update.** Les deux commandes interrogent l'API Forgejo : `init`
sur un dépôt déjà présent sur Forgejo bascule en `update`, et `update` sur un dépôt
absent (ou sans git local) bascule en `init`. Une seule chose à retenir, donc — le bon
comportement est choisi tout seul.

## Git par défaut : Forgejo (iakabox)

Tout projet est versionné sur le **Forgejo auto-hébergé du homelab iakabox** —
cohérent avec la préférence self-hosted. Pattern :
`http://192.168.2.11:3001/sjupin/<repo>.git`, **HTTP + token** (le SSH de cette box
est inutilisable). Le token n'est **jamais** écrit en dur ni commité : variable
`$env:FORGEJO_TOKEN` ou `.git/config` local. Création de dépôt via l'API Forgejo
(description **ASCII uniquement**, sinon HTTP 422). Guide complet : `iakabox-usage.html`.

## Cycle de documentation — version & reprise

La doc d'état n'est pas écrite « quand on y pense » : elle est régénérée **à deux
moments précis**, par `iakaframe-snapshot.ps1` :

1. **À chaque changement de version** (`-Reason version -Version vX.Y.Z`).
2. **À chaque pause de dev / préparation de reprise** (`-Reason pause` puis
   `-Reason reprise`).

Le script produit `specs/etat-des-lieux.md` + `.html` à partir des faits git (version,
branche, derniers commits, arbre propre/sale, nb de fichiers) et tient un **journal
append-only**. Les faits sont automatiques ; **Cowork complète le récit de reprise**
(ce qui vient d'être fait, ce qui reste, la prochaine étape concrète). Ainsi, reprendre
un projet après une pause = lire `etat-des-lieux.md`, pas fouiller sa mémoire.

**Commande « update iakaframe »** — le checkpoint en une fois : `iakaframe-update.ps1`
régénère l'état des lieux **puis** fait un **commit global** (`git add -A` + commit) et
**push**. C'est le geste à faire à chaque changement de version et à chaque pause/reprise
(`-Reason version|pause|reprise`), ou comme simple point de sauvegarde.

---

## Ce que cette méthode n'est pas

- **Pas du « vibe coding ».** Pas de prompt vague suivi d'une acceptation aveugle.
  Chaque ligne est spécifiée, vérifiée par des outils, validée par un humain.
- **Pas de l'automatisation aveugle.** L'IA ne tourne pas en boucle. Chaque cycle
  passe par le développeur. Le feedback humain est structurel, pas optionnel.
- **Pas un remplacement du développeur.** Le développeur fait moins de frappe et
  plus de décisions. Son temps se déplace de l'implémentation vers l'architecture,
  la revue et le jugement. Le métier monte en abstraction.

---

## En résumé

L'IA sans workflow produit du code jetable. L'IA dans un workflow produit du
logiciel.

Trois piliers : **séparation des rôles** (réflexion ≠ exécution), **instructions
écrites** (specs vérifiables), **vérification automatique** (tests, linting,
couverture). Le développeur reste le décideur à chaque étape.

**La qualité n'est pas dans le modèle. Elle est dans la méthode.**
