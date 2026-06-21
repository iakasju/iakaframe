# Etat des lieux - iakaframe

> Genere par iakaframe-snapshot.ps1 le 2026-06-21 22:53 (motif: manual).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | v0.6.1 |
| Branche | main |
| Dernier commit | 09876cb feat(skills): iakaframe-log-conversation (push main courante MQTT->CouchDB) |
| Arbre | MODIFICATIONS NON COMMITEES |
| Fichiers (hors .git/node_modules) | 108 |
| Note | kit-codex v0.6.0 : ajout MODELES.md + AGENTS/README/_TEMPLATE alignes ; doc HTML prise en main IA iakabox |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `09876cb` | 2026-06-21 | feat(skills): iakaframe-log-conversation (push main courante MQTT->CouchDB) |
| `3047dd5` | 2026-06-21 | docs(cadrage): iakaIDE sidecar branche (etape 9) |
| `c3e45e1` | 2026-06-21 | feat(cli): umbrella lance node scan.js (cross-OS) en priorite, fallback scan.ps1 |
| `5e3d5cb` | 2026-06-21 | feat(cli): agents + go + distribution Forgejo + umbrella (iakaframe multi-OS) |
| `d2903fe` | 2026-06-21 | feat(cli): commandes init/snapshot/onboard/update (portage iakaframe multi-OS) |
| `1585ac1` | 2026-06-21 | feat(cli): squelette @naonedge/iakaframe + commandes services & config (multi-OS, zero-dep) |
| `3917e70` | 2026-06-21 | docs(cadrage): decisions multi-OS tranchees (registre Forgejo, @naonedge/iakaframe, ~/work, sidecar, Node 20) |
| `752a9ad` | 2026-06-21 | docs(cadrage): instruction iakaframe multi-OS (CLI Node + iakaIDE GUI) |
| `54e48d8` | 2026-06-20 | feat(config): iakaframe-config.ps1 - ecrit iakaframe.json par projet (runner/target + diagnostic) |
| `566e629` | 2026-06-20 | fix(stack-qualite): SonarQube sur port 9002 (9001 pris) + stack deployee sur VM4 |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** : <!-- ... -->
- **En cours / a reprendre** : <!-- ... -->
- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->
- **Pieges connus** : <!-- ... -->

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-06-21 22:53 | manual | v0.6.1 | main | kit-codex v0.6.0 : ajout MODELES.md + AGENTS/README/_TEMPLATE alignes ; doc HTML prise en main IA iakabox |
| 2026-06-20 21:51 | version | v0.6.1 | main | v0.6.1 - cible ollama complete : kit-ollama (AGENTS.md + MODELES.md table modele/agent), -Target claude/codex/ollama dans init/onboard, rapport iakaframe-alternatives, outil recommande OpenClaw (openclaw.ai, all-in-one local). Les 3 incarnations : Claude / Codex / Ollama. |
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

