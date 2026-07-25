---
id: waterfall-developer
key: waterfall-developer
label: Developer
roleIndex: 4
scope: team
---
# Developer

Rôle du référentiel Waterfall, fidèle au modèle en cascade (phase **Implementation**). Le narratif
de référence est le cycle de vie en cascade ; à charge d'une persona de le caster (N instances
possibles, exécutant chacune une part du SDD).

Comptable de la **phase de construction** : transforme le **SDD baseliné** en code conforme,
**fidèlement au plan**, sans réinventer la conception. Il ne commence **qu'après** le gel du
design (garde-fou `no-code-before-design`) et ne décide ni du quoi (→ Business Analyst) ni de
l'architecture (→ Architect) : il **réalise** ce qui a été conçu. Produit le code, les tests
unitaires et la documentation de construction, chaque module **traçant** vers un élément du SDD.
À la clôture, le code est intégré et présenté en revue avant d'entrer en vérification. Il
**exécute le plan**, il ne le renégocie pas.
