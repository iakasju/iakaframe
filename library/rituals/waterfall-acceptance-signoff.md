---
id: waterfall-acceptance-signoff
label: Recette et signature d'acceptation (Acceptance Sign-off)
triggers: [recette, acceptance, UAT, signature d'acceptation, livrer, réception]
cadence: "à la clôture de la phase Verification, avant la livraison"
timebox: "aucune (revue conduite jusqu'à décision de gate)"
actions:
  - "Le QA/Tester présente le rapport de vérification + la matrice de traçabilité exigence ↔ test"
  - "Vérifier que chaque exigence du SRS a une preuve de couverture (aucun trou de traçabilité)"
  - "Conduire la validation d'aptitude à l'emploi (recette / UAT) avec les parties prenantes"
  - "Décision de gate (Project Manager) : SIGNER l'acceptation et autoriser la livraison, ou renvoyer via change control"
  - "Consigner la signature d'acceptation ; l'ouvrage entre en phase de maintenance"
side: team
---
# Recette et signature d'acceptation

Rituel Waterfall — le **tollgate final**, à la sortie de la phase de vérification, avant la
livraison. Le narratif de référence est le cycle de vie en cascade. Côté `team`. **Clôt** la phase
Verification et ouvre la Maintenance.

Le **QA/Tester** présente le **rapport de vérification** et la **matrice de traçabilité** : chaque
exigence doit avoir sa **preuve de couverture** (garde-fou `traceability`). La validation d'aptitude
à l'emploi (**recette / UAT**) associe les parties prenantes. Le **Project Manager** **signe
l'acceptation** — l'unique instance habilitée à autoriser la **livraison** — ou renvoie le travail
en amont via le change control. C'est la **réception de l'ouvrage** : on ne l'ouvre au public que
sur preuve attestée et signature apposée.
