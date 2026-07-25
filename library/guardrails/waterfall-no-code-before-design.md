---
id: waterfall-no-code-before-design
label: Pas de code avant conception validée
kind: gate
hook: "gouvernance:à l'ouverture de la phase Implementation (matérialisable par une garde de chemin sur le code)"
policy: "Aucune construction (code) ne commence tant que le SDD n'est pas baseliné et signé en revue de conception. Le design précède et gouverne la construction (big design up front) ; combler un manque du SDD en codant est interdit — on le remonte en change control."
---
# Pas de code avant conception validée

Garde-fou Waterfall (*big design up front*). Le narratif de référence est le cycle de vie en cascade.

**Politique.** Aucune **construction** (écriture de code) ne commence tant que le **SDD** n'est pas
**baseliné** et **signé** en revue critique de conception. Le **design précède et gouverne** la
construction. Combler un manque ou une ambiguïté du SDD **en codant** est **interdit** : on le
**remonte** au Project Manager (change control), on n'improvise pas la conception sous pression de délai.

> **Enforcement** — garant : le **Project Manager** (gate de conception). Matérialisable par une
> **garde de chemin** analogue au `perimeter` d'un frame à hooks : tant que le SDD n'est pas marqué
> baseliné, un geste mutateur sur l'arbre de code (Write/Edit) peut être signalé ou bloqué. Waterfall
> se prête donc à un **outillage runtime** de ce garde-fou — davantage qu'une discipline de séance.
> Portée : toute la phase Implementation.
