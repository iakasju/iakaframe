# Recette manuelle — mode guidé du terminal, palier 2 (mode brut)

> Réf. : `specs/instructions/cli-mode-guide-selections.md`, CA-13. **Ce critère ne peut pas être
> couvert par un test automatique** (Node n'embarque pas de pty ; `node-pty` serait une
> **dépendance**, interdite par CA-1) : il est **coché par l'humain**, ou le palier 2 n'est pas
> livré. Le palier 1 (liste numérotée) est testé automatiquement et sert de **filet** — cf.
> `cli/test/guidage.test.js`, `cli/test/guidage-non-interactif.test.js`.

## Ce qui est vérifié ici, et pourquoi ce n'est vérifiable qu'à la main

Le mode brut (`readline.emitKeypressEvents` + `setRawMode(true)`) modifie le comportement du
terminal **réel** de l'opérateur — flèches, surbrillance, filtre à la frappe. La doc Node (`tty`)
avertit explicitement : *« Ctrl+C will no longer cause a SIGINT when in this mode »*. Deux risques
ne peuvent être observés que sur un **vrai** terminal :

1. Le terminal reste-t-il **utilisable** après le parcours (écho, saisie suivante) ?
2. Un `Ctrl-C` en plein menu **rend-il la main** proprement, sans terminal muet ?

## Prérequis

- Un poste **macOS** et un poste **Windows** (les deux, cf. R9 — le palier 1, lui, est déjà éprouvé
  cross-OS et sert de repli automatique si le mode brut n'est pas disponible).
- Le CLI construit depuis cette branche (`node cli/src/index.js` ou `.tgz` installé).
- Un vrai terminal interactif (Terminal.app / iTerm2 sur macOS ; Windows Terminal / PowerShell sur
  Windows) — **pas** un terminal intégré qui ne serait pas un TTY complet.

## Scénarios (à cocher, un par ligne, sur CHAQUE OS)

Cible d'exercice recommandée : `iakaframe show --guide` (lecture seule, aucun risque d'écriture).

| # | Scénario | Étapes | Attendu |
|---|---|---|---|
| 1 | Navigation flèches | `iakaframe show --guide` → flèche bas ×3, flèche haut ×1, Entrée | La sélection en surbrillance suit les flèches ; Entrée choisit l'item survolé (pas un autre) |
| 2 | Filtre à la frappe | `iakaframe show --guide` → taper quelques lettres (ex. `ga`) | La liste se réduit aux items dont le libellé contient la frappe ; `Échap` efface le filtre |
| 3 | Entrée libre | `iakaframe show --guide` → naviguer jusqu'à « saisir un id », Entrée, taper un id, Entrée | Le mode brut rend la main (mode cuit) pour la saisie texte ; l'id tapé est repris tel quel |
| 4 | Écho A3 | Sur les 3 scénarios ci-dessus | La ligne `→ iakaframe show <id> --type <type>` s'affiche avant l'exécution, et la commande **rejouée telle quelle** en dehors du mode guidé produit le même effet |
| 5 | **Ctrl-C en plein menu** | `iakaframe show --guide` → dès l'affichage du menu, `Ctrl-C` | Le programme s'arrête proprement (pas de blocage) ; **le terminal reste utilisable** ensuite |
| 6 | **Terminal restauré après Ctrl-C** | Immédiatement après le scénario 5 | Taper une commande quelconque (`echo test`) : l'écho clavier fonctionne, la ligne s'affiche normalement (`stty` non cassé) |
| 7 | Terminal restauré après un choix normal | Immédiatement après le scénario 1 (choix complet, pas d'interruption) | Idem scénario 6 : le terminal répond normalement à la commande suivante |
| 8 | Repli automatique (si applicable) | Sur un terminal qui ne supporte pas le mode brut (ex. certains émulateurs très anciens, ou en forçant un pipe côté sortie) | Le palier 1 (liste numérotée) s'affiche à la place, sans erreur visible |

## Verdict

- [ ] macOS — les 8 scénarios passent
- [ ] Windows — les 8 scénarios passent

**Un scénario 5/6 en échec (terminal resté muet après Ctrl-C) bloque la livraison du palier 2** —
c'est le risque le plus élevé du lot (R8, `specs/instructions/cli-mode-guide-selections.md`).

## Traçabilité

Coché par : ______________________  Date : ______________  Commit testé : ______________
