# Etat des lieux - iakaframe

> Genere par iakaframe-snapshot.ps1 le 2026-06-22 18:11 (motif: pause).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | v0.6.1 |
| Branche | main |
| Dernier commit | df44b3d chore(iakaframe): update etat des lieux + commit global (manual) |
| Arbre | propre |
| Fichiers (hors .git/node_modules) | 164 |
| Note | Pause apres session: 3 features (titres ASCII, cycle de session, runner aider) + gate Legolas durci + framework generique + refonte docs A-D + 2 dettes soldees. Tout pousse (df44b3d). |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `df44b3d` | 2026-06-22 | chore(iakaframe): update etat des lieux + commit global (manual) |
| `85a35c9` | 2026-06-22 | fix(update): bascule ErrorActionPreference=Continue autour du bloc git |
| `467528a` | 2026-06-22 | fix(update): git stderr ne tue plus le script (piege PS 5.1) |
| `28bf866` | 2026-06-22 | fix(build): panneau Code idempotent (marqueurs START/END) + regen 22 fichiers |
| `4f847ab` | 2026-06-22 | docs: refonte docs lots B/C/D - 13 skills + cycle de session + alignement HTML |
| `9dff45d` | 2026-06-22 | docs: refonte docs lot A - verite des commandes CLI + chemins |
| `a667410` | 2026-06-22 | chore(iakaframe): update etat des lieux + checkpoint session (manual) |
| `4b048ab` | 2026-06-22 | docs(method): gate Legolas independant obligatoire + gradation (anti Gimli-solo) |
| `380e732` | 2026-06-22 | feat(cli): runner aider (exécuteur alternatif, sgpt annulé) |
| `3b22147` | 2026-06-22 | docs(method): durcit identite (DOIT) + rituels jalons et cloture (briques C/F/E) |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** : session "titres & rituels". 3 features CLI livrees,
  testees (38 tests) et poussees : (1) **titres ASCII de royaume** (moteur FIGlet maison
  zero-dep, `banner`, defaut ANSI Shadow / repli Standard, `bannerFont`) ; (2) **cycle de
  session** (`brief`/`recap`/`jalon` + libs `table.js`/`etat.js`, hooks portefeuille
  `C:\work\.claude\settings.json`) ; (3) **runner `aider`** (`go --runner aider`,
  `--no-auto-commits`, `aiderModel`/Ollama, sgpt annule). Methode durcie : identite "DOIT",
  **gate Legolas independant + gradation** (anti "Gimli solo"). Framework generique :
  "Stephane" -> "l'utilisateur" (217 occ.). **Refonte docs A->D** (cli/README, README,
  skills 13, cycle de session HTML, methode-de-travail.html par Loki). 2 dettes soldees :
  panneau Code idempotent + fix stderr `update.ps1` (EAP Continue). Tout pousse (`df44b3d`).
- **En cours / a reprendre** : rien d'ouvert. Backlog optionnel : "Cycle de session" en
  **onglet dedie** de `methode-de-travail.html` (Loki) ; integration eventuelle de
  `log-conversation` dans le "Zoom 4 briques" de `iakaframe-skills.html`.
- **Prochaine etape concrete** : selon l'envie de l'utilisateur. Pistes : essayer le runner
  `aider` en reel (installer `aider` + backend Ollama) ; OU envisager un **bump de version
  mineure** (v0.7.0) vu les features ajoutees (decision utilisateur) ; OU nouveau projet.
- **Pieges connus** : `pwsh` absent -> `powershell.exe`. Les scripts `.ps1` calent sur le
  stderr git sous `ErrorActionPreference=Stop` (corrige dans `update.ps1` via EAP Continue ;
  `onboard.ps1`/autres pourraient avoir le meme piege). Hooks de session : `SessionStart`
  peut envoyer son stdout au contexte plutot qu'a l'ecran selon la version (a verifier ;
  repli = profil PowerShell). Au niveau `C:\work`, seul `odin` est expose comme subagent ->
  lancer les gates (Legolas) / agents via general-purpose portant la skill du role.

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-06-22 18:11 | pause | v0.6.1 | main | Pause apres session: 3 features (titres ASCII, cycle de session, runner aider) + gate Legolas durci + framework generique + refonte docs A-D + 2 dettes soldees. Tout pousse (df44b3d). |
| 2026-06-22 18:08 | manual | v0.6.1 | main | Dettes corrigees : panneau Code idempotent + fix stderr update.ps1 (EAP Continue). |
| 2026-06-22 18:07 | manual | v0.6.1 | main | Dettes corrigees : panneau Code idempotent (build) + fix stderr update.ps1. |
| 2026-06-22 16:37 | manual | v0.6.1 | main | Session: titres ASCII de royaume (FIGlet zero-dep) + cycle de session (brief/recap/jalon, tableaux, hooks) + runner aider + durcissement gate Legolas (anti Gimli-solo) + framework generique (l'utilisateur). |
| 2026-06-21 22:57 | pause | v0.6.1 | main | Pause apres livraison kit-codex v0.6.0 (MODELES.md + AGENTS/README/_TEMPLATE alignes) + doc HTML prise en main IA iakabox + zip des 3 kits (local, gitignore). Reprise : envoyer le zip a l'ami (cible Codex) ; option release Forgejo ; iakaIDE Codex a venir. |
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

