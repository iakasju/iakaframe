# iakaframe — Méthode de travail IA-augmentée

> La méthode de collaboration entre **l'utilisateur** (le décideur) et une **équipe d'agents IA**
> organisée en **3 phases** (cadrage → réalisation → staging) + un **squad prod**,
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

## Les 3 phases (cible staging)

Un **décideur humain** et une **chaîne en 3 phases** portée par des agents IA. Plus de « deux
acteurs Cowork / Claude Code » : la réflexion et l'exécution sont distribuées sur une **équipe**
(voir plus bas), organisée en phases dont la **cible est le staging**.

### Le décideur — l'utilisateur

Il tranche sur l'architecture, valide les choix techniques et juge le résultat. Il ne délègue
pas la réflexion — il délègue l'exécution. Il décide **à chaque gate**.

- Définit les features et leur priorité (le backlog dans `CLAUDE.md`)
- Valide ou corrige les instructions de cadrage
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

### La chaîne en 3 phases

1. **Cadrage** (🧙 Gandalf) — le besoin devient une **instruction fermée et vérifiable** dans
   `specs/instructions/`. Lecture seule sur le code. **Gate humain** : l'utilisateur valide.
2. **Réalisation** (⚒️ Gimli + 🏹 Legolas) — implémentation en **commits atomiques** + **gate
   qualité** (typecheck, lint, tests). Verdict PASS pour avancer.
3. **Déploiement staging** (⚒️ Gimli en **devops** + 🏹 Legolas) — build + mise en **staging**
   (`vX.Y.Z-rc`). **La chaîne s'arrête au staging.**

> **Règle absolue : la phase de cadrage ne touche jamais au code de production.** Le jour où
> celui qui réfléchit est aussi celui qui exécute sans garde-fou, il n'y a plus de contrôle.

La **mise en production** est un **squad séparé** (🌉 Helm : déploiement prod, surveillance,
alertes, rollback), déclenché sur **feu vert humain** — hors les 3 phases. Roster complet,
détail des phases, squad prod et **identité des agents** : section suivante.

---

## Pourquoi des agents ?

Découper la couche IA en agents nommés n'est pas cosmétique — ça résout des problèmes concrets :

1. **Savoir depuis quelle phase arrive une sollicitation.** En multitâche, l'origine des
   questions se brouille. Personnifier les contextes — un **nom**, une **couleur**, une
   **phase** — fait gagner du temps à l'humain : d'un coup d'œil il sait *qui* lui parle et *à
   quel stade*, et trie ses réponses sans recharger tout le contexte.
2. **Discrétiser proprement permissions, limites et process.** Un agent = un rôle **packagé** :
   ses droits (outils autorisés), ses garde-fous (ce qu'il ne fait pas), son process (entrées →
   sorties, gate). Borné, lisible, réutilisable d'un projet à l'autre.
3. **Et c'est plus fun.** Une équipe incarnée rend le travail vivant et mémorisable — on retient
   « Gandalf cadre, Gimli forge » mieux qu'« agent 1, agent 2 ».

---

## L'équipe d'agents (« Yakaframe Avancé »)

Les trois acteurs sont le **modèle conceptuel** (décideur / réflexion / exécution). Pour
industrialiser le développement « au fil de l'eau » sur une chaîne CI/CD, la couche
réflexion+exécution se **spécialise en une équipe d'agents**, chacun avec un rôle fermé.
Chaque agent porte une **incarnation** (un nom) pour le rendre mémorisable.

> Référence canonique et fiches détaillées : `specs/equipe-agents.md`.
> Définitions exécutables : `agents/` (subagents) + `skills/iakaframe-*` (savoir-faire).

### Le roster

| Agent | Pastille | Rôle | Phase | Skill |
|---|---|---|---|---|
| 🦅 **Odin** | 🟡 | Super-agent **portefeuille** : switch d'équipe, démarrage projet, création d'équipe | Portefeuille (le seul sur `C:\work`) | `iakaframe-odin` |
| 🛡️ **Aragorn** | ⬜ | Coordination entre agents, suivi des phases, reporting | Transverse / par projet | `iakaframe-aragorn` |
| 🧙 **Gandalf** | 🔵 | Architecte-cadreur : besoin → instruction fermée | P1 — Cadrage | `iakaframe-cadrage` |
| ⚒️ **Gimli** | 🔴/🟢 | **Dev + devops** : code, build, commits, **déploiement jusqu'au staging** (×N) | P2 Réalisation → P3 Staging | (CLAUDE.md) |
| 🏹 **Legolas** | 🔴/🟢 | Qualité / test : verdict PASS, gate auto (dev + validation stage) | P2 Réalisation / P3 Staging | `iakaframe-qualite` |
| 🌉 **Helm** | 🟣 | **Équipe prod** : déploiement prod, surveillance, alertes, rollback, accès | Prod (squad séparé) | `iakaframe-deploiement` |
| 🎭 **Loki** | ⬜ | Design : supports on-brand (catalogue de chartes `design-*/`) | Transverse | `iakaframe-naonedge` |
| 📖 **Nathalie** | ⬜ | Guides utilisateurs / documentation | Transverse | `iakaframe-nathalie` |

> **n8n / Hermes** sont des **outils** d'orchestration qu'Aragorn pilote — pas des agents.

> **Règle — la réflexion et le cadrage s'appuient sur le web (obligatoire).** Un agent de
> **réflexion / cadrage** (au premier chef 🧙 **Gandalf**, étape 0) **ne travaille pas
> hors-ligne** : cadrer suppose de **vérifier des faits à jour** (versions et leur
> compatibilité, état de l'art d'un outil/d'une lib, pièges connus, alternatives maintenues)
> avant de fermer un périmètre — sinon l'instruction repose sur des suppositions périmées.
> Ces agents disposent donc des outils **`WebSearch` / `WebFetch`** et **doivent** s'en servir
> dès qu'une décision dépend d'un fait externe ; les faits vérifiés sont **cités (avec leurs
> sources)** dans l'instruction. (Ex. vécu : sur Minecraft 1.21.10, dynmap officielle n'existe
> pas encore — un cadrage hors-ligne l'aurait recommandée à tort.)

**Deux niveaux d'orchestration.** Au-dessus des équipes, un **super-agent portefeuille,
🦅 Odin**, disponible en permanence, est le **seul agent affecté à `C:\work`** (la racine de
tous les projets). Il reçoit les ordres de haut niveau de l'utilisateur — **switcher** d'équipe,
**démarrer** un projet (`init iakaframe`), **créer** une équipe (`fullteam`) — et passe la
main à l'**Aragorn** du projet concerné. La hiérarchie&nbsp;:

```
l'utilisateur → 🦅 Odin (portefeuille, C:\work) → 🛡️ Aragorn (par projet) → agents
```

Odin n'entre jamais dans le métier d'un projet&nbsp;: il ouvre la bonne porte, Aragorn
coordonne à l'intérieur. C'est la **répartition entre projets** matérialisée — celle qui,
sinon, resterait un geste manuel de l'utilisateur.

**Réveil d'Odin (par défaut).** Au **premier appel d'Odin dans `C:\work`** (par session), avant
toute autre chose, il **régénère puis affiche le dashboard portefeuille** (NaonEdge dashboard)&nbsp;:
`pwsh C:\work\naonedge-dashboard\scan.ps1` réécrit `data/projects.js` (métriques git/LOC/tokens/état
des projets), puis il ouvre `C:\work\naonedge-dashboard\index.html`. Ensuite seulement il enchaîne
sur la synthèse et l'ordre reçu. Aux appels suivants de la même session, le scan n'est relancé que si
l'état a bougé ou si l'utilisateur le redemande.

> **Lexique.** Une **équipe armée** (full team déployée dans `<projet>/.claude/`, prête à
> démarrer mais pas encore lancée) se dit&nbsp;: **« la compagnie est à l'auberge »**.

### Les 3 phases (cible staging) + le squad prod

La chaîne de dev **a pour cible le staging** et avance en **3 phases**. À chaque phase, **un
agent** est aux commandes ; Aragorn enchaîne et vérifie le gate avant de passer à la suivante.

| Phase | Agent(s) | Entrée → Sortie | Gate |
|---|---|---|---|
| 🔵 **P1 — Cadrage** | 🧙 Gandalf | besoin → `specs/instructions/{feature}.md` | **humain** (l'utilisateur valide l'instruction) |
| 🔴 **P2 — Réalisation** | ⚒️ Gimli (dev, ×N) + 🏹 Legolas (qualité) | instruction → branche + commits + verdict PASS | **auto** (typecheck/lint/tests verts) |
| 🟢 **P3 — Déploiement staging** | ⚒️ Gimli (**devops**) + 🏹 Legolas (validation) | PASS → image/build déployé en **staging** (`vX.Y.Z-rc`) | auto |

> La chaîne **s'arrête au staging**. ⚒️ Gimli monte en **dev + devops** : il finit le travail
> jusqu'à la mise en stage (build, image, déploiement). 🏹 Legolas valide en P2 (tests) puis sur
> le stage en P3.

**Le squad prod — séparé, sur feu vert humain.** La mise en production **n'est pas une phase**
de la chaîne de dev : c'est une **équipe dédiée**, déclenchée par un **feu vert tracé** de
l'utilisateur.

| Étape prod | Agent | Entrée → Sortie | Gate |
|---|---|---|---|
| 🟣 **Déploiement prod** | 🌉 Helm | rc recettée + feu vert → prod (alias de version) | **humain** (feu vert tracé) |
| 🟣 **Surveillance** | 🌉 Helm | prod → santé OK / alerte / rollback | continu |

> Frontière nette : **dev → staging** (les 3 phases) puis **prod** (squad 🌉 Helm), avec une
> **couture humaine** entre les deux. Le squad prod est **extensible** (rôles surveillance /
> alerte dédiés à terme).

Transverses : 🎭 **Loki** (supports visuels) et 📖 **Nathalie** (guides) interviennent sur
sollicitation, à toute phase. **Tout agent peut solliciter l'utilisateur directement** ; Aragorn
est l'interlocuteur par défaut.

À l'inverse, **l'utilisateur peut demander à Aragorn de lancer un travail sur un agent** — en le
nommant (« lance Gimli sur X ») ou en décrivant la tâche (Aragorn route). Aragorn émet un
**ordre de mission** (quoi, base, critère de fin), vérifie le **gate amont** de la phase, puis
**dispatche le subagent** (outil Agent en session, ou n8n/Hermes en chaîne automatisée).

**Canal de communication — Slack (bidirectionnel, via n8n).** Aragorn dialogue avec l'utilisateur
sur **Slack**, piloté par n8n (qui porte les identifiants — aucun secret côté agent) :
sortant (états des phases, blocages, **demandes de feu vert**) et entrant (arbitrages, ordres
de dispatch, **feu vert prod** captés par un trigger n8n). Slack devient un **canal de
pilotage à distance**. Équivalent self-hosted : Mattermost (même schéma).

### Identité des agents — qui te parle, et depuis quelle phase

Quand un agent **s'adresse à l'utilisateur** (une **question**, une **prise de parole** qui lui est
destinée), il **DOIT s'identifier** en tête de message — règle **obligatoire** (anti-dérive hors méthode) :

```
<pastille-phase> [ROYAUME][Agent]  <le message…>
```

- **`[ROYAUME]`** = le projet courant, en **MAJUSCULE** (ex. `IAKABOX`) ; pour 🦅 Odin =
  `PORTEFEUILLE`.
- **La pastille = la PHASE** où l'agent agit (couleur **partagée** entre agents, pas propre à
  l'agent). Un même agent **change de pastille** selon la phase :

  | Phase | Pastille | Couleur |
  |---|---|---|
  | Cadrage / réflexion | 🔵 | bleu |
  | Dev | 🔴 | rouge |
  | Staging | 🟢 | vert |
  | Prod | 🟣 | violet |
  | Portefeuille (🦅 Odin) | 🟡 | or |

  Agents transverses (🛡️ Aragorn, 🎭 Loki, 📖 Nathalie) : pastille de la **phase servie**, ⬜ par défaut.

- **Périmètre STRICT** : seulement les **paroles adressées à l'utilisateur**. **Jamais** sur les
  **logs**, les **traces de réflexion**, la sortie d'outils. L'identité dit « un agent te
  parle » ; elle ne pollue pas le travail.

**Rendu.** Pastille emoji **partout** (terminal, Slack, HTML) ; en session le libellé passe en
`code inline` pour ressortir ; en **HTML** il prend la **vraie couleur** de la phase. Exemples :

> 🔵 `[IAKABOX][Gandalf]` instruction prête à valider.
> 🔴 `[IAKABOX][Gimli]` dev en cours, commit `feat: …`.
> 🟢 `[IAKABOX][Gimli]` déployé en staging, `v0.6.0-rc1`.
> 🟣 `[IAKABOX][Helm]` prod en ligne, surveillance active.
> 🟡 `[PORTEFEUILLE][Odin]` je rebascule le focus.

> **Option terminal « vraie couleur »** : une fonction PowerShell `iaka-say` (profil) colorise le
> bandeau par phase (ANSI : bleu/rouge/vert/magenta/jaune). Documentée en option — la **pastille**
> reste le défaut (universelle, sans plomberie). Les rouges/verts du diff sont rendus par le
> harnais, non reproductibles dans la prose d'un agent.

### Jalons (gates) & clôture de session

**Jalons.** Chaque gate de la méthode (instruction prête, dev à vérifier, qualité, prod) **DOIT**
être rendu **très visible** via `iakaframe jalon` :
- titre ASCII **FIGlet `Standard`** (police réservée aux jalons, distincte de l'ANSI Shadow des
  titres de royaume) : `<PROJET> - JALON : <nom>` ;
- un **tableau à 3 zones** : **émetteur** (l'agent qui pose le jalon) · **contenu** · **récepteur**
  (qui valide — souvent l'utilisateur) ;
- les **fichiers / dev à vérifier** sont listés par l'agent **dans son message** en `chemin:ligne`
  (cliquables côté Claude Code) ;
- à la **validation** par l'utilisateur, le récepteur affiche **« JALON VALIDÉ »** puis **explique
  la suite** (étape / agent suivant).

**Démarrage.** À l'ouverture d'une session sous le portefeuille, on affiche le titre **IAKAFRAME** ;
à l'entrée d'un projet, `iakaframe brief <projet>` (titre + dernière étape + backlog + agents assignés).

**Clôture (pause / stop / exit).** L'agent actif **DOIT**, avant de fermer :
1. préparer la reprise — `iakaframe snapshot --reason pause` (régénère l'état des lieux) ;
2. afficher le recap — `iakaframe recap` (commits de session + agents mobilisés + projet) ;
3. **proposer** de sauvegarder l'état — `iakaframe update` (commit global) — et **attendre la
   validation** de l'utilisateur. **Jamais** de commit automatique silencieux.

### Étanchéité : l'image est mutualisée, le conteneur est étanche

Comme pour l'isolation Docker par projet, on distingue **définition** et **exécution** :

- **Définitions mutualisées** : une persona/skill est définie **une seule fois** (ici, dans
  l'installation iakaframe) et réutilisée partout. *Da Vinci n'existe qu'une fois.*
- **Exécution étanche** : **chaque projet instancie SA propre équipe**, scopée à son repo,
  son `CLAUDE.md`, ses `specs/`. **Aucun agent ne porte deux projets dans un même contexte**
  (zéro contamination inter-projets).
- **Répartition entre projets** : elle se fait **au niveau portefeuille** (l'utilisateur décide
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
- **Contrepartie obligatoire : commit après chaque étape logique** (toutes les
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
