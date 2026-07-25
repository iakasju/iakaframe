---
id: waterfall-test-readiness-review
label: Revue d'aptitude aux tests (TRR — Test Readiness Review)
triggers: [revue d'aptitude aux tests, TRR, entrer en vérification, revue de construction]
cadence: "à la clôture de la phase Implementation, avant la vérification"
timebox: "aucune (revue conduite jusqu'à décision de gate)"
actions:
  - "Les Developers présentent le build intégré + la doc de construction"
  - "Vérifier que tous les modules du SDD sont construits et tracés (aucune part manquante)"
  - "Contrôler que le plan de test dérivé du SRS est prêt et que l'environnement de test est disponible"
  - "Décision de gate (Project Manager) : autoriser l'entrée en vérification, ou renvoyer en construction"
  - "Baseliner le build candidat à la vérification"
side: team
---
# Revue d'aptitude aux tests (TRR)

Rituel Waterfall — le **troisième tollgate**, à la sortie de la phase de construction. Le narratif
de référence est le cycle de vie en cascade. Côté `team`. **Clôt** la phase Implementation.

Les **Developers** présentent le **build intégré** ; on vérifie que **tous** les modules du SDD sont
construits et tracés, et que le **plan de test** (dérivé du SRS) et l'environnement sont prêts. Le
**Project Manager** préside et décide : l'entrée en **vérification** est autorisée, ou le build
retourne en construction. C'est la porte qui sépare le *faire* du *prouver* : on n'éprouve un ouvrage
que lorsqu'il est complet et instrumenté.
