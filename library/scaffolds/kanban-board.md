---
id: kanban-board
level: service
nonDestructive: true
entries:
  - { path: "board/BOARD.md", role: "le tableau — colonnes (états réels du flux) + limite de WIP par colonne", createIfAbsent: true }
  - { path: "board/POLICIES.md", role: "politiques explicites — critères d'entrée/sortie de chaque colonne, définition du « fini », règles de tirage", createIfAbsent: true }
  - { path: "board/CLASSES-OF-SERVICE.md", role: "classes de service — Expedite / Date fixe / Standard / Intangible, avec leur politique de coût du délai", createIfAbsent: true }
  - { path: "options/", role: "pool d'options amont (demandes non engagées, ordonnées par valeur/risque)", createIfAbsent: true }
  - { path: "options/COMMITMENT-POINT.md", role: "définition du point d'engagement — ce qui fait passer une option en item engagé (au replenishment)", createIfAbsent: true }
  - { path: "metrics/", role: "métriques de flux — lead time, throughput, WIP, diagramme de flux cumulé (CFD), efficience de flux, aging WIP", createIfAbsent: true }
  - { path: "blockers/BLOCKERS.md", role: "journal des blocages et du travail vieillissant (alimente la risk review)", createIfAbsent: true }
  - { path: "cadences/", role: "notes des cadences (replenishment, service delivery review, risk review, operations review)", createIfAbsent: true }
---
# Scaffold tableau Kanban

Échafaudage **NON DESTRUCTIF** du **tableau** Kanban et de ses **politiques explicites** (*Kanban
Method*, David J. Anderson). On crée ce qui manque, on n'écrase rien. Le narratif de référence est
cette littérature.

Le tableau est le **radiateur d'information** du système : il **visualise** le flux, **encode** les
limites de WIP, et **rend les politiques explicites** — les trois pratiques sans lesquelles Kanban
n'est qu'un mur de post-its. Chaque pièce du scaffold matérialise une pratique ou un garde-fou :

| Pièce | Ce qu'elle matérialise |
|---|---|
| `board/BOARD.md` | pratiques **`visualize`** + **`limit-wip`** (colonnes + limites) |
| `board/POLICIES.md` | pratique **`explicit-policies`** / garde-fou **`policies-on-the-board`** |
| `board/CLASSES-OF-SERVICE.md` | politiques de **coût du délai** (Expedite / Date fixe / Standard / Intangible) |
| `options/` + `COMMITMENT-POINT.md` | l'**amont** et le **point d'engagement** (garde-fou **`pull-not-push`**) |
| `metrics/` | pratique **`manage-flow`** (loi de Little, CFD, lead time, throughput) |
| `blockers/BLOCKERS.md` | matière de la **`risk-review`** |
| `cadences/` | pratique **`feedback-loops`** (les boucles de feedback) |

> `level: service` (et non `project`/`product`) : l'unité Kanban est un **service** qui rend un
> **flux de travail** à un client — Kanban se superpose à l'existant (`start-where-you-are`) sans
> imposer une structure de projet.
