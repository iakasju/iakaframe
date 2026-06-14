# Skills iakaframe — La méthode de l'équipe augmentée

Neuf skills Claude qui rendent la méthode iakaframe exécutable dans Claude Code et Cowork.
Chaque skill incarne une étape, un rôle ou une brique du cycle, avec son cadre, ses règles
et son format de sortie.

## Installation

Dépose chaque dossier `iakaframe-*` dans ton répertoire de skills :
- **Claude Code** : `~/.claude/skills/` (global) ou `.claude/skills/` (projet)
- **Cowork** : via le panneau des skills

Chaque skill se déclenche automatiquement quand le contexte correspond à sa description.

## Le cœur du cycle (5 skills)

| Skill | Rôle / étape | Se déclenche quand… |
|---|---|---|
| `iakaframe-init` | Amorçage | démarrer / mettre en place la méthode sur un projet |
| `iakaframe-cadrage` | Étape 0 — architecte | décrire une feature, un bug, « cadrer », « spécifier » |
| `iakaframe-qualite` | Étape 2 — vérificateur | « vérifier », « tester », gate avant intégration |
| `iakaframe-deploiement` | Étape 4 — opérateur | « déployer », « mettre en prod » (gate humain) |
| `iakaframe-etat-des-lieux` | Orchestrateur (lecture) | « où en est le projet », « fais le point », reprise |

## Les briques (4 skills)

| Skill | Rôle / brique | Se déclenche quand… |
|---|---|---|
| `iakaframe-forgejo` | Git par défaut (iakabox) | « créer le dépôt », « brancher Forgejo », « pousser sur iakabox » |
| `iakaframe-docker` | Stack isolée par projet | « dockeriser », « docker-compose », « allouer les ports » |
| `iakaframe-update` | Orchestrateur (écriture) | « update iakaframe », « checkpoint », « commit global », « pousse tout » |
| `iakaframe-naonedge` | Studio de design (charte NaonEdge) | « faire une doc HTML », « un deck », « en style naonedge » |

> Référence visuelle de l'ensemble : `iakaframe-skills.html` (style NaonEdge).

## Pourquoi ces skills et pas une par agent

Une skill se déclenche sur des tâches **complexes et multi-étapes**, pas sur des gestes
triviaux. Les étapes 1 (dev), 3 (intégration) et 5 (surveillance) sont déjà portées par
l'agent de dev cadré via `CLAUDE.md` (déposé par `iakaframe-init`) et par l'outillage — en
faire des skills séparées les ferait sous-déclencher. Restent **écartés volontairement** :
le cycle de correction d'erreur (variante de `cadrage`, instruction `fix-*.md`) et le mock
des API (`specs/mock/`, convention de dev appliquée à l'exécution). Les neuf retenues
correspondent aux moments où un cadre explicite change vraiment le résultat : amorcer,
cadrer, vérifier, déployer, faire le point — et versionner, isoler, sauvegarder, mettre en forme.

## Le principe qui traverse tout

L'IA prépare et propose à l'intérieur d'un périmètre borné ; **l'humain décide aux
gates**. Les skills `qualite` (gate automatique) et `deploiement` (gate humain) matérialisent
cette règle. Aucune skill ne franchit un gate de mise en production seule.
