---
id: waterfall-traceability
label: Traçabilité maintenue (matrice complète)
kind: quality
hook: "gouvernance:à chaque livrable dérivé (matrice de traçabilité tenue ; trou = gate bloqué)"
policy: "La chaîne exigence → conception → code → test doit rester complète et vérifiable à chaque phase. Un maillon manquant (exigence non conçue, code sans exigence, exigence non testée) est un trou de traçabilité qui bloque le gate de la phase concernée."
---
# Traçabilité maintenue (matrice complète)

Garde-fou Waterfall (traçabilité des exigences, systems engineering). Le narratif de référence est le
cycle de vie en cascade.

**Politique.** La chaîne **exigence → conception → code → test** doit rester **complète et
vérifiable** à chaque phase. Un **maillon manquant** — une exigence non conçue, un élément de
conception sans exigence, un module sans conception, une exigence sans cas de test — est un **trou de
traçabilité** qui **bloque le gate** de la phase concernée. La **matrice de traçabilité** est tenue à
jour en continu et présentée à chaque revue.

> **Enforcement** — garant : le rôle de chaque phase pour son maillon, contrôlé au gate par le
> **Project Manager** ; attesté en fin de chaîne par le **QA/Tester** (matrice exigence ↔ test). La
> complétude de la matrice est **calculable** : un outil peut détecter automatiquement les orphelins
> et les couvertures manquantes. Waterfall rend donc ce garde-fou **outillable**, au-delà de la revue
> manuelle. Portée : tous les livrables dérivés d'un livrable amont.
