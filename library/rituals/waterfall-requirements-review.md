---
id: waterfall-requirements-review
label: Revue des exigences (SRR — System Requirements Review)
triggers: [revue des exigences, SRR, valider le SRS, geler les exigences]
cadence: "à la clôture de la phase Requirements"
timebox: "aucune (revue conduite jusqu'à décision de gate)"
actions:
  - "Le Business Analyst présente le SRS complet (exigences fonctionnelles + non fonctionnelles + critères d'acceptation)"
  - "Vérifier la complétude, la non-ambiguïté et la vérifiabilité de chaque exigence"
  - "Contrôler que chaque exigence porte un identifiant traçable"
  - "Décision de gate (Project Manager) : signer la baseline des exigences, ou renvoyer le SRS"
  - "Geler le SRS baseliné ; à partir d'ici tout changement passe par le change control"
side: team
---
# Revue des exigences (SRR)

Rituel Waterfall — le **premier tollgate**, à la sortie de la phase des exigences. Le narratif de
référence est le cycle de vie en cascade. Côté `team`. **Clôt** la phase Requirements.

Le **Business Analyst** présente le **SRS** ; l'équipe et les parties prenantes vérifient qu'il est
**complet, non ambigu, vérifiable et tracé**. Le **Project Manager** préside et décide : la
**baseline des exigences** est signée et **gelée** (garde-fou `requirements-freeze`), ou le SRS
retourne en correction. Sans cette signature, **la conception ne commence pas**. C'est ici que se
joue le pari de Waterfall : figer le **quoi** en amont, une fois.
