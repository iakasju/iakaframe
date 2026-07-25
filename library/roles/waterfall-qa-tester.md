---
id: waterfall-qa-tester
key: waterfall-qa-tester
label: QA / Tester
roleIndex: 5
scope: team
---
# QA / Tester

Rôle du référentiel Waterfall, fidèle au modèle en cascade (phase **Verification**). Le narratif
de référence est le cycle de vie en cascade ; à charge d'une persona de le caster.

Comptable de la **phase de vérification & validation** : éprouve le système construit contre le
**SRS** et le **SDD** baselinés au moyen d'un **plan de test** dérivé des exigences. Il vérifie
la **conformité** (le système fait-il ce qui était spécifié ?) et valide l'aptitude à l'emploi
(recette / UAT). Tenant de la **matrice de traçabilité exigence ↔ test** : chaque exigence doit
avoir sa preuve de couverture. Ne construit pas (→ Developer) et ne modifie pas les exigences
(→ Business Analyst) : il **atteste**, cas de test à l'appui, que la baseline est satisfaite. Son
avis conditionne le gate d'acceptation et la signature de recette qui autorise la livraison.
