# Etat des lieux - iakaframe

> Genere par iakaframe-snapshot.ps1 le 2026-06-20 21:34 (motif: version).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | v0.6.0 |
| Branche | main |
| Dernier commit | 2381a71 docs(codex): iakaIDE annonce pour plus tard cote Codex (orientation Claude actuelle) |
| Arbre | propre |
| Fichiers (hors .git/node_modules) | 67 |
| Note | v0.6.0 multi-plateforme + onboarding : kit-codex (incarnation Codex, AGENTS.md), detection services (git/ollama/comfyui), onboard -Target claude|codex + marqueur .iakaframe versionne, -Umbrella (chapeau: Odin local+global + dashboard + scan) + -InitProjects, iakaframe-alternatives (modeles locaux par agent, lance par Odin). Cadrages : conf GPU (Helm), suggestion/install modeles (Aragorn/Loki), docs en charte NaonEdge, cible ollama (kit-ollama a venir), iakaIDE annonce plus tard cote Codex. |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `2381a71` | 2026-06-20 | docs(codex): iakaIDE annonce pour plus tard cote Codex (orientation Claude actuelle) |
| `350f4f0` | 2026-06-20 | feat(alternatives): iakaframe-alternatives.ps1 - etat des lieux modeles locaux par agent + cadrage cible ollama |
| `faaa3bd` | 2026-06-20 | feat(onboard): -Umbrella propose/amorce les projets du chapeau (-InitProjects) |
| `646be88` | 2026-06-20 | feat(onboard): option -Umbrella - installe le dossier chapeau (Odin local+global + dashboard NaonEdge + scan) |
| `bfb4699` | 2026-06-20 | feat(onboard): -Target threade dans onboard + capture conf GPU (Helm) + regle docs NaonEdge (Loki) |
| `3d09a86` | 2026-06-20 | docs(methode): modeles - Aragorn suggere/installe (Ollama/ComfyUI), Loki check modeles design a l'onboarding ; option install iakaIDE |
| `30fc1dc` | 2026-06-20 | feat(onboard): init multi-cible -Target claude|codex + marqueur .iakaframe (version estampillee) |
| `3da0596` | 2026-06-20 | feat(onboard): iakaframe-services.ps1 - detection git/Forgejo, Ollama, ComfyUI |
| `d462b2e` | 2026-06-20 | feat(codex): kit-codex (AGENTS.md + templates + README) - incarnation Codex de iakaframe |
| `17777d4` | 2026-06-16 | chore(iakaframe): update etat des lieux + commit global (version v0.5.2) |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** : <!-- ... -->
- **En cours / a reprendre** : <!-- ... -->
- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->
- **Pieges connus** : <!-- ... -->

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-06-20 21:34 | version | v0.6.0 | main | v0.6.0 multi-plateforme + onboarding : kit-codex (incarnation Codex, AGENTS.md), detection services (git/ollama/comfyui), onboard -Target claude/codex + marqueur .iakaframe versionne, -Umbrella (chapeau: Odin local+global + dashboard + scan) + -InitProjects, iakaframe-alternatives (modeles locaux par agent, lance par Odin). Cadrages : conf GPU (Helm), suggestion/install modeles (Aragorn/Loki), docs en charte NaonEdge, cible ollama (kit-ollama a venir), iakaIDE annonce plus tard cote Codex. |
| 2026-06-16 15:03 | version | v0.5.2 | main | v0.5.2 - section 'Pourquoi des agents ?' (tri par phase, permissions/limites/process packages, fun) dans methode-de-travail.md, equipe-agents.md, HTML, et les 9 profils agents |
| 2026-06-16 14:47 | version | v0.5.1 | main | v0.5.1 - HTML rebrand (iakaframe XL + grue NaonEdge), onglets reordonnes (Principe/3 phases/Agents IA/.../Code dernier), onglet 3 phases remplace 3 acteurs, diagramme cycle en phases; methode-de-travail.md alignee 3 phases |
| 2026-06-16 12:39 | manual | v0.5.0 | main |  |
| 2026-06-16 11:59 | version | v0.5.0 | main | v0.5.0 - team en 3 phases (cible staging) + squad prod separe (Helm) + Gimli dev+devops + identite agents par phase (pastille [ROYAUME][Agent]); doc/agents/skills/HTML alignes |
| 2026-06-14 16:40 | pause | - | main | pause: equipe d agents (Odin -> Aragorn -> 8 agents) livree + doc impactee. Reprendre par push Forgejo puis cadrage voix-Slack-Piper |
| 2026-06-14 15:14 | version | v0.4.0 | main | equipe d agents (7 subagents + skills) + commande iakaframe-agents + HTML methode v3 + rangement skills/PDF + fix journal |
| 2026-06-14 14:30 | reprise | - | main | rangement skills (9 dossiers) + PDF dans docs + fix journal System.Object |
| 2026-06-14 02:16 | reprise | - | main |  |
| 2026-06-11 23:41 | version | v0.3.0 | main | doc HTML impactee : commandes init/update, Forgejo, cycle de doc, auto-detection |
| 2026-06-11 23:39 | version | v0.2.0 | main | init/update auto-detectent l'existence sur Forgejo |

