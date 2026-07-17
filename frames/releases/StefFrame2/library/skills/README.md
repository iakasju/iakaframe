# Skills iakaframe — Le savoir-faire de l'équipe d'agents

**Seize skills Claude** qui rendent la méthode iakaframe exécutable. Depuis la formalisation
de l'**équipe d'agents**, une skill = le **savoir-faire d'un agent** (sa méthode détaillée),
ou une **brique de cycle de vie** transverse. Le subagent (`agents/<nom>.md`) est le
*contrat* ; la skill est la *méthode*.

> Vue d'ensemble de l'équipe : `../specs/equipe-agents.md` · présentation : `../iakaframe-methode.html`.

## Installation

Dépose chaque dossier `iakaframe-*` dans ton répertoire de skills :
- **Claude Code** : `~/.claude/skills/` (global) ou `.claude/skills/` (projet)
- **Cowork** : via le panneau des skills

Le plus simple : `iakaframe-agents.ps1 -Action fullteam -Project <chemin>` dépose agents +
skills dans un projet. Chaque skill se déclenche quand le contexte correspond à sa description.

## Skills de rôle — les agents (7)

| Skill | Agent | Rôle |
|---|---|---|
| `iakaframe-odin` | 🦅 Odin | Super-agent **portefeuille** : switch d'équipe, démarrage projet, création d'équipe (seul à `<IAKAFRAME_HOME>`) |
| `iakaframe-aragorn` | 🛡️ Aragorn | Coordination entre agents, 3 phases + squad prod, dispatch à la demande, canal <CHAT> |
| `iakaframe-cadrage` | 🧙 Gandalf | P1 — cadrage : besoin → instruction fermée |
| `iakaframe-qualite` | 🏹 Legolas | P2 / P3 — qualité / test, gate auto |
| `iakaframe-deploiement` | 🌉 Helm | Squad prod — déploiement, accès, rollback, surveillance, alertes |
| `iakaframe-design` | 🎭 Loki | Design : supports on-brand (catalogue de chartes `design-*/`) |
| `iakaframe-nathalie` | 📖 Nathalie | Guides utilisateurs / documentation |

> ⚒️ **Gimli** (développement + devops, P2 → P3) n'a **pas** de skill dédiée : il est porté par le
> `CLAUDE.md` du projet et l'outillage.

## Skills méthode & briques (9)

| Skill | Rôle / brique | Se déclenche quand… |
|---|---|---|
| `iakastart` | Bootstrap team | « iakastart », « iakaframe », « odin » — affiche le roster, rend les agents prêts à dispatch |
| `iakaframe-init` | Amorçage | démarrer / mettre en place la méthode sur un projet |
| `iakaframe-etat-des-lieux` | Cycle de doc (lecture) | « où en est le projet », « fais le point », reprise |
| `iakaframe-update` | Cycle de doc (écriture) | « update iakaframe », « checkpoint », « commit global », « pousse tout » |
| `iakaframe-git` | Git par défaut (serveur self-hosted) | « créer le dépôt », « brancher le git », « pousser sur le remote » |
| `iakaframe-docker` | Stack isolée par projet | « dockeriser », « docker-compose », « allouer les ports » |
| `iakaframe-log-conversation` | Main courante des IA (push broker → base de documents) | « logguer la conversation », « tracer cet échange », « alimenter la main courante » |
| `iakaframe-humandoc` | Mémoire humaine (outil de doc externe) | « documenter le projet », « publier les specs », « mettre à jour la mémoire humaine » |
| `iakaframe-learning` | Boucle d'apprentissage | « apprends de ça », capitaliser un feedback / une correction dans la méthode |

> Référence visuelle : `../iakaframe-skills.html` (style <charte-defaut>).

## Pourquoi une skill par agent (et pas seulement par étape)

Une skill se déclenche sur des tâches **complexes et multi-étapes**. Depuis l'équipe d'agents,
chaque rôle au périmètre fermé mérite sa skill — c'est le **savoir-faire** que charge le
subagent. **Gimli (dev)** reste l'exception : son cadre vit déjà dans le `CLAUDE.md` du projet,
en faire une skill la ferait sous-déclencher.

Restent **écartés volontairement** : le cycle de correction d'erreur (variante de `cadrage`,
instruction `fix-*.md`) et le mock des API (`specs/mock/`, convention de dev).

## Le principe qui traverse tout

L'IA prépare et propose à l'intérieur d'un périmètre borné ; **l'humain décide aux gates**.
`qualite` (gate automatique) et `deploiement` (gate humain) matérialisent cette règle. Aucune
skill ne franchit seule un gate de mise en production. Et **tout agent peut solliciter
l'utilisateur directement** ; Aragorn (par projet) et Odin (portefeuille) sont les interlocuteurs
par défaut, joignables par voix / <CHAT>.
