# Etat des lieux - iakaframe

> Genere par iakaframe (CLI) le 2026-07-18 15:16 (motif: version).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | v0.15.0 |
| Branche | main |
| Dernier commit | b2c3b7f merge(openwebui): Lot A2 — Filter d'identite (port Python fidele de guard-core.verdictIdentity) |
| Arbre | propre |
| Fichiers (hors .git/node_modules) | 788 |
| Note | Multi-runner Lot A2 : host OpenWebUI — Filter Function Python d'identite (outlet leve/inlet rappelle), port fidele de guard-core.verdictIdentity verrouille par parite Python<->Node cas-par-cas ; doc import webui.db ; identite seule (perimetre/delegation N/A). e2e OWUI reel = gate humain differe. |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `b2c3b7f` | 2026-07-18 | merge(openwebui): Lot A2 — Filter d'identite (port Python fidele de guard-core.verdictIdentity) |
| `26a560c` | 2026-07-18 | docs(openwebui-guard): doc d'import admin/API + limites honnetes ; manifest emits functions/*.py |
| `94a69a4` | 2026-07-18 | feat(openwebui-guard): Filter identite OWUI (outlet/inlet) + parite Python<->guard-core — Lot A2 |
| `573d48c` | 2026-07-18 | chore(iakaframe): update etat des lieux + commit global (version v0.14.0) |
| `0e97a70` | 2026-07-18 | merge(codex): Lot A1 — Codex perimetre + delegation (adaptateurs guard-core) |
| `694ae34` | 2026-07-18 | docs(codex-guard): README couvre desormais perimetre + delegation (Lot A1) |
| `497f482` | 2026-07-18 | test(codex-guard): parite perimetre + delegation core<->runner + refus e2e (Lot A1) |
| `a507204` | 2026-07-18 | feat(codex-guard): cable perimetre (PreToolUse) + delegation (Pre/PostToolUse) |
| `56c1d3b` | 2026-07-18 | feat(codex-guard): adaptateurs perimetre + delegation via guard-core (Lot A1) |
| `a53442f` | 2026-07-18 | chore(iakaframe): update etat des lieux + commit global (version v0.13.0) |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** : <!-- ... -->
- **En cours / a reprendre** : <!-- ... -->
- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->
- **Pieges connus** : <!-- ... -->

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-07-18 15:16 | version | v0.15.0 | main | Multi-runner Lot A2 : host OpenWebUI — Filter Function Python d'identite (outlet leve/inlet rappelle), port fidele de guard-core.verdictIdentity verrouille par parite Python<->Node cas-par-cas ; doc import webui.db ; identite seule (perimetre/delegation N/A). e2e OWUI reel = gate humain differe. |
| 2026-07-18 15:06 | version | v0.14.0 | main | Multi-runner Lot A1 : host Codex complet — adaptateurs codex-perimeter-guard + codex-delegation-guard consommant guard-core (parite verdict Claude<->Codex prouvee), cablage 3 gardes, doc. e2e Codex reel = gate humain differe. |
| 2026-07-18 14:53 | version | v0.13.0 | main | Multi-runner Lot B2 : vocab split host{claude,codex,openwebui} <-> runner{claude,chatgpt,ollama-local,ollama-distant,litellm} ; chatgpt (pas openai), litellm plein droit, anythingllm hors modele ; alias legacy ; checkRefs alias-aware ; parite miroir verte. |
| 2026-07-18 13:31 | version | v0.12.0 | main | Reconciliation kit source claude <-> frame : rapatrie en source delegation-guard (refactore guard-core) + identity-remind + plan-courante + settings.example.json (5 hooks) ; de-tokenise LOG_PREFIX ; agents/skills laisses en materialisation frame (voulu). + backlog item chemin machine perimeter-guard. |
| 2026-07-18 13:01 | version | v0.11.0 | main | Regle 'merge => versionnement' promue en element dedie : principe library/principles/merge-versionnement.md, cable dans methods (principleIds=16), reference par aragorn.md + commits-versionnement. Vaut pour tout coordinateur (Aragorn/Odin). |
| 2026-07-18 12:52 | version | v0.10.0 | main | Multi-runner Lot 0 (guard-core runner-agnostique : 3 verdicts purs, hooks Claude refactores non-regressifs, test de parite) + Lot 1 pilote Codex x identite. e2e Codex reel = gate humain differe. Kit source claude en retard sur la frame (delegation-guard/settings) a reconcilier. |
| 2026-07-18 12:14 | version | v0.9.0 | main | Scission iakaframe-learning -> REVUE (iakaframe-learning) + RETRAIT (iakaframe-retrait, alias /retrait, badge Retrait) ; triggers repartis sans recouvrement ; CLI intact ; frames figees |
| 2026-07-18 11:50 | version | v0.8.0 | main | Quick wins P0 (grue, casting Helm 8, Odin/Aragorn bornes) + charte CTO d'Odin + starter set Odin-CTO (STRATEGIE.md decl., observe silencieux, portfolio, skill+principe interruption-minimale) + audit du frame + cadrages (binding GUI, split learning, multi-runner, odin-cto) |
| 2026-07-18 00:37 | version | v0.7.0 | main | Frames StefFrame1 (methode portable sans GUI) + StefFrame2 (frame executable : CLI + hooks + installeur collision-aware) livres, gates Legolas PASS ; guides MD+HTML et cadrages frame-stefframe1/2 |
| 2026-07-17 20:52 | pause | v0.6.1 | main | Pause : boucle d'apprentissage + symetrie +/- livrees et poussees ; canon amorce ; T7 archivage #odin OK en reel. Reprise = extraire l'archiveur hors iakaHub (pub/sub maison) -> 'reprise T7'. |
| 2026-07-17 18:50 | version | v0.6.1 | main | Boucle d'apprentissage + symetrie +/- livrees : canon amorce, gestes memory/open/recall/close/review/consolidate + cadence, 3 surfaces (CLI/skill/GUI), retrait symetrique |
| 2026-07-15 20:13 | reprise | v0.6.1 | feat/cli-convergence | convergence CLI (GAP a/b/c) : racine partagee, schema binding E1, parite kit core |
