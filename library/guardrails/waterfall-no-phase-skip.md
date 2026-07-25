---
id: waterfall-no-phase-skip
label: Pas de saut de phase (gate signé obligatoire)
kind: gate
hook: "gouvernance:à chaque frontière de phase (Project Manager garant ; matérialisable par un verrou de baseline)"
policy: "Aucune phase suivante ne démarre tant que le gate de la phase précédente n'est pas signé et sa baseline gelée. Le passage est séquentiel et à sens unique ; sauter une phase ou anticiper la suivante est interdit."
---
# Pas de saut de phase (gate signé obligatoire)

Garde-fou Waterfall (stage-gate / tollgate). Le narratif de référence est le cycle de vie en cascade.

**Politique.** Aucune phase suivante ne démarre tant que le **gate** de la phase précédente n'est pas
**signé** et sa **baseline gelée**. Le passage est **séquentiel et à sens unique** : sauter une phase,
paralléliser deux phases consécutives ou anticiper la suivante est **interdit**. Le contrôle du
projet **repose** sur ce verrou.

> **Enforcement** — garant : le **Project Manager**, en revue de gate. Contrairement aux disciplines
> purement humaines d'un cadre agile, ce garde-fou est **matérialisable** par un outil : un **verrou
> de baseline** (le livrable amont doit être marqué « signé/gelé » avant que la phase aval n'ouvre)
> se prête à un contrôle machine — le format à `gates` du frame le porte déjà nativement (cf.
> `workflows/waterfall-lifecycle`). C'est un point où Waterfall se **rapproche** d'un frame à hooks :
> le gate est une donnée vérifiable, pas seulement une convention de séance. Portée : toutes les
> frontières de phase.
