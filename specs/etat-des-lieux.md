# Etat des lieux - iakaframe

> Genere par iakaframe (CLI) le 2026-07-18 12:52 (motif: version).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | v0.10.0 |
| Branche | main |
| Dernier commit | dfe7e89 merge(guard): guard-core runner-agnostique + pilote Codex x identite (Lot 0+1) |
| Arbre | propre |
| Fichiers (hors .git/node_modules) | 771 |
| Note | Multi-runner Lot 0 (guard-core runner-agnostique : 3 verdicts purs, hooks Claude refactores non-regressifs, test de parite) + Lot 1 pilote Codex x identite. e2e Codex reel = gate humain differe. Kit source claude en retard sur la frame (delegation-guard/settings) a reconcilier. |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `dfe7e89` | 2026-07-18 | merge(guard): guard-core runner-agnostique + pilote Codex x identite (Lot 0+1) |
| `bde22a2` | 2026-07-18 | test(guard): non-regression perimeter-guard (baseline pre-refactor == refactor) |
| `466b12d` | 2026-07-18 | test(guard): non-regression Claude + parite core<->runner + unite des verdicts purs |
| `41de172` | 2026-07-18 | feat(codex): adaptateur garde d'identite Codex sur guard-core partage (Lot 1, pilote) |
| `496747f` | 2026-07-18 | feat(guard-core): extrait les 3 verdicts purs runner-agnostiques + refactor non-regressif des hooks Claude |
| `b99a302` | 2026-07-18 | chore(iakaframe): update etat des lieux + commit global (version v0.9.0) |
| `27e48db` | 2026-07-18 | merge(learning): scinde iakaframe-learning en REVUE + iakaframe-retrait (symetrie +/-) |
| `652dc80` | 2026-07-18 | test(skills): scinder le verrou learning/retrait (bloc S6 -> retrait-skill.test.js) |
| `f115557` | 2026-07-18 | feat(retrait): nouvelle skill iakaframe-retrait + alias /retrait (symetrie +/-) |
| `f9ee9a1` | 2026-07-18 | refactor(learning): alleger la skill REVUE — retrait demenage vers iakaframe-retrait |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** : <!-- ... -->
- **En cours / a reprendre** : <!-- ... -->
- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->
- **Pieges connus** : <!-- ... -->

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-07-18 12:52 | version | v0.10.0 | main | Multi-runner Lot 0 (guard-core runner-agnostique : 3 verdicts purs, hooks Claude refactores non-regressifs, test de parite) + Lot 1 pilote Codex x identite. e2e Codex reel = gate humain differe. Kit source claude en retard sur la frame (delegation-guard/settings) a reconcilier. |
| 2026-07-18 12:14 | version | v0.9.0 | main | Scission iakaframe-learning -> REVUE (iakaframe-learning) + RETRAIT (iakaframe-retrait, alias /retrait, badge Retrait) ; triggers repartis sans recouvrement ; CLI intact ; frames figees |
| 2026-07-18 11:50 | version | v0.8.0 | main | Quick wins P0 (grue, casting Helm 8, Odin/Aragorn bornes) + charte CTO d'Odin + starter set Odin-CTO (STRATEGIE.md decl., observe silencieux, portfolio, skill+principe interruption-minimale) + audit du frame + cadrages (binding GUI, split learning, multi-runner, odin-cto) |
| 2026-07-18 00:37 | version | v0.7.0 | main | Frames StefFrame1 (methode portable sans GUI) + StefFrame2 (frame executable : CLI + hooks + installeur collision-aware) livres, gates Legolas PASS ; guides MD+HTML et cadrages frame-stefframe1/2 |
| 2026-07-17 20:52 | pause | v0.6.1 | main | Pause : boucle d'apprentissage + symetrie +/- livrees et poussees ; canon amorce ; T7 archivage #odin OK en reel. Reprise = extraire l'archiveur hors iakaHub (pub/sub maison) -> 'reprise T7'. |
| 2026-07-17 18:50 | version | v0.6.1 | main | Boucle d'apprentissage + symetrie +/- livrees : canon amorce, gestes memory/open/recall/close/review/consolidate + cadence, 3 surfaces (CLI/skill/GUI), retrait symetrique |
| 2026-07-15 20:13 | reprise | v0.6.1 | feat/cli-convergence | convergence CLI (GAP a/b/c) : racine partagee, schema binding E1, parite kit core |
