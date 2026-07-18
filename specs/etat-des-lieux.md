# Etat des lieux - iakaframe

> Genere par iakaframe (CLI) le 2026-07-18 18:32 (motif: version).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | v0.17.0 |
| Branche | main |
| Dernier commit | 938ff91 test(cli): garde anti-derive C-JSON + balayage du contrat de sortie |
| Arbre | MODIFICATIONS NON COMMITEES |
| Fichiers (hors .git/node_modules) | 796 |
| Note | Backlog vide en marche forcee : (1) harmonisation surface --json du CLI autour de la convention C-JSON (racine objet, ok en tete, collections pluriel+count, erreurs {ok:false,error} sur stdout+exit1) — source unique lib/output.js, extraction inline portfolio/list vers lib/, garde anti-derive, 3 ruptures assumees (list/assemble/services), gate Legolas PASS ; (2) nettoyage chemins machine perso dans les kits (perimeter-guard.mjs + README), iso-comportement, gate Legolas PASS. 2 items ouverts au backlog (reconciliation services.json CLI vs ps1 ; anonymisation URL Forgejo kits). |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `938ff91` | 2026-07-18 | test(cli): garde anti-derive C-JSON + balayage du contrat de sortie |
| `a8ec920` | 2026-07-18 | refactor(cli): harmonise la surface --json de tout le parc autour de C-JSON |
| `1356c2e` | 2026-07-18 | feat(cli): source unique de sortie machine C-JSON (lib/output.js) |
| `01fa061` | 2026-07-18 | chore(kits): retire les chemins machine perso des kits sources |
| `e9cec6e` | 2026-07-18 | chore(iakaframe): update etat des lieux + commit global (version v0.16.0) |
| `1c8c2ff` | 2026-07-18 | merge(install): Lot C1 — installeur multi-host fan-out (detection hosts + copie collision-aware par host) |
| `8e9879b` | 2026-07-18 | test(install): fan-out multi-host (Lot C1) — 2 hosts presents + 1 absent |
| `49f9af9` | 2026-07-18 | feat(install): installeur multi-host fan-out (Lot C1, §5bis) |
| `a1fc59a` | 2026-07-18 | chore(iakaframe): update etat des lieux + commit global (version v0.15.0) |
| `b2c3b7f` | 2026-07-18 | merge(openwebui): Lot A2 — Filter d'identite (port Python fidele de guard-core.verdictIdentity) |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** : <!-- ... -->
- **En cours / a reprendre** : <!-- ... -->
- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->
- **Pieges connus** : <!-- ... -->

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-07-18 18:32 | version | v0.17.0 | main | Backlog vide en marche forcee : (1) harmonisation surface --json du CLI autour de la convention C-JSON (racine objet, ok en tete, collections pluriel+count, erreurs {ok:false,error} sur stdout+exit1) — source unique lib/output.js, extraction inline portfolio/list vers lib/, garde anti-derive, 3 ruptures assumees (list/assemble/services), gate Legolas PASS ; (2) nettoyage chemins machine perso dans les kits (perimeter-guard.mjs + README), iso-comportement, gate Legolas PASS. 2 items ouverts au backlog (reconciliation services.json CLI vs ps1 ; anonymisation URL Forgejo kits). |
| 2026-07-18 17:21 | version | v0.16.0 | main | Multi-runner Lot C1 (dernier) : installeur multi-host fan-out (install.mjs racine) — detecte les hosts presents {claude,codex,openwebui}, pose le kit de chacun dans son dir (copie collision-aware, backup par host, merge bloc/JSON, dry-run, idempotence), OWUI=bundle import admin/API, ollama/anythingllm refuses ; --link opt-in. MULTI-RUNNER 5/5 (B2 vocab, A1 Codex, A2 OpenWebUI, B1 binding tools/runners, C1 installeur). |
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
