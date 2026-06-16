# Skills iakaframe — Le savoir-faire de l'équipe d'agents

**Douze skills Claude** qui rendent la méthode iakaframe exécutable. Depuis la formalisation
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
| `iakaframe-odin` | 🦅 Odin | Super-agent **portefeuille** : switch d'équipe, démarrage projet, création d'équipe (seul à `C:\work`) |
| `iakaframe-aragorn` | 🛡️ Aragorn | Coordination entre agents, 3 phases + squad prod, dispatch à la demande, canal Slack |
| `iakaframe-cadrage` | 🧙 Gandalf | P1 — cadrage : besoin → instruction fermée |
| `iakaframe-qualite` | 🏹 Legolas | P2 / P3 — qualité / test, gate auto |
| `iakaframe-deploiement` | 🌉 Helm | Squad prod — déploiement, accès, rollback, surveillance, alertes |
| `iakaframe-naonedge` | 🎭 Loki | Design : supports on-brand (catalogue de chartes `design-*/`) |
| `iakaframe-nathalie` | 📖 Nathalie | Guides utilisateurs / documentation |

> ⚒️ **Gimli** (développement + devops, P2 → P3) n'a **pas** de skill dédiée : il est porté par le
> `CLAUDE.md` du projet et l'outillage.

## Skills méthode & briques (5)

| Skill | Rôle / brique | Se déclenche quand… |
|---|---|---|
| `iakaframe-init` | Amorçage | démarrer / mettre en place la méthode sur un projet |
| `iakaframe-etat-des-lieux` | Cycle de doc (lecture) | « où en est le projet », « fais le point », reprise |
| `iakaframe-update` | Cycle de doc (écriture) | « update iakaframe », « checkpoint », « commit global », « pousse tout » |
| `iakaframe-forgejo` | Git par défaut (iakabox) | « créer le dépôt », « brancher Forgejo », « pousser sur iakabox » |
| `iakaframe-docker` | Stack isolée par projet | « dockeriser », « docker-compose », « allouer les ports » |

> Référence visuelle : `../iakaframe-skills.html` (style NaonEdge).

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
Stéphane directement** ; Aragorn (par projet) et Odin (portefeuille) sont les interlocuteurs
par défaut, joignables par voix / Slack.
