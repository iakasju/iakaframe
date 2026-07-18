# Etat des lieux - iakaframe

> Genere par iakaframe (CLI) le 2026-07-18 13:31 (motif: version).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | v0.12.0 |
| Branche | main |
| Dernier commit | d6798c4 merge(kit): reconcilie le kit source claude avec la frame (rapatrie delegation-guard refactore/identity-remind/plan-courante/settings, de-tokenise) |
| Arbre | MODIFICATIONS NON COMMITEES |
| Fichiers (hors .git/node_modules) | 778 |
| Note | Reconciliation kit source claude <-> frame : rapatrie en source delegation-guard (refactore guard-core) + identity-remind + plan-courante + settings.example.json (5 hooks) ; de-tokenise LOG_PREFIX ; agents/skills laisses en materialisation frame (voulu). + backlog item chemin machine perimeter-guard. |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `d6798c4` | 2026-07-18 | merge(kit): reconcilie le kit source claude avec la frame (rapatrie delegation-guard refactore/identity-remind/plan-courante/settings, de-tokenise) |
| `d3f928b` | 2026-07-18 | fix(kit-claude): de-tokenise LOG_PREFIX dans les hooks source (§8 anti-placeholder) |
| `c91bdbf` | 2026-07-18 | feat(kit-claude): rapatrie delegation-guard(refactore guard-core)/identity-remind/plan-courante + settings.example (reconciliation frame) |
| `5eda405` | 2026-07-18 | docs(instructions): instruction validee reconcilier-kit-source-frame (Gandalf P1) |
| `7643e36` | 2026-07-18 | chore(backlog): ouvre BACKLOG.md + item 'structure API & commandes du CLI' |
| `a388ab8` | 2026-07-18 | chore(iakaframe): update etat des lieux + commit global (version v0.11.0) |
| `25a43e4` | 2026-07-18 | feat(principle): merge-versionnement — regle 'merge => versionnement' comme element dedie |
| `2829bf6` | 2026-07-18 | chore(iakaframe): update etat des lieux + commit global (version v0.10.0) |
| `dfe7e89` | 2026-07-18 | merge(guard): guard-core runner-agnostique + pilote Codex x identite (Lot 0+1) |
| `bde22a2` | 2026-07-18 | test(guard): non-regression perimeter-guard (baseline pre-refactor == refactor) |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** : <!-- ... -->
- **En cours / a reprendre** : <!-- ... -->
- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->
- **Pieges connus** : <!-- ... -->

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-07-18 13:31 | version | v0.12.0 | main | Reconciliation kit source claude <-> frame : rapatrie en source delegation-guard (refactore guard-core) + identity-remind + plan-courante + settings.example.json (5 hooks) ; de-tokenise LOG_PREFIX ; agents/skills laisses en materialisation frame (voulu). + backlog item chemin machine perimeter-guard. |
| 2026-07-18 13:01 | version | v0.11.0 | main | Regle 'merge => versionnement' promue en element dedie : principe library/principles/merge-versionnement.md, cable dans methods (principleIds=16), reference par aragorn.md + commits-versionnement. Vaut pour tout coordinateur (Aragorn/Odin). |
| 2026-07-18 12:52 | version | v0.10.0 | main | Multi-runner Lot 0 (guard-core runner-agnostique : 3 verdicts purs, hooks Claude refactores non-regressifs, test de parite) + Lot 1 pilote Codex x identite. e2e Codex reel = gate humain differe. Kit source claude en retard sur la frame (delegation-guard/settings) a reconcilier. |
| 2026-07-18 12:14 | version | v0.9.0 | main | Scission iakaframe-learning -> REVUE (iakaframe-learning) + RETRAIT (iakaframe-retrait, alias /retrait, badge Retrait) ; triggers repartis sans recouvrement ; CLI intact ; frames figees |
| 2026-07-18 11:50 | version | v0.8.0 | main | Quick wins P0 (grue, casting Helm 8, Odin/Aragorn bornes) + charte CTO d'Odin + starter set Odin-CTO (STRATEGIE.md decl., observe silencieux, portfolio, skill+principe interruption-minimale) + audit du frame + cadrages (binding GUI, split learning, multi-runner, odin-cto) |
| 2026-07-18 00:37 | version | v0.7.0 | main | Frames StefFrame1 (methode portable sans GUI) + StefFrame2 (frame executable : CLI + hooks + installeur collision-aware) livres, gates Legolas PASS ; guides MD+HTML et cadrages frame-stefframe1/2 |
| 2026-07-17 20:52 | pause | v0.6.1 | main | Pause : boucle d'apprentissage + symetrie +/- livrees et poussees ; canon amorce ; T7 archivage #odin OK en reel. Reprise = extraire l'archiveur hors iakaHub (pub/sub maison) -> 'reprise T7'. |
| 2026-07-17 18:50 | version | v0.6.1 | main | Boucle d'apprentissage + symetrie +/- livrees : canon amorce, gestes memory/open/recall/close/review/consolidate + cadence, 3 surfaces (CLI/skill/GUI), retrait symetrique |
| 2026-07-15 20:13 | reprise | v0.6.1 | feat/cli-convergence | convergence CLI (GAP a/b/c) : racine partagee, schema binding E1, parite kit core |
