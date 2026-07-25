---
id: waterfall-design-review
label: Revue critique de conception (CDR — Critical Design Review)
triggers: [revue de conception, CDR, valider le SDD, geler la conception]
cadence: "à la clôture de la phase Design"
timebox: "aucune (revue conduite jusqu'à décision de gate)"
actions:
  - "L'Architect présente le SDD complet (architecture, composants, interfaces, données, algorithmes)"
  - "Vérifier la cohérence du SDD avec le SRS baseliné (chaque exigence est couverte par la conception)"
  - "Contrôler la traçabilité conception → exigence (aucun élément orphelin, aucune exigence non conçue)"
  - "Décision de gate (Project Manager) : signer la baseline de conception, ou renvoyer le SDD"
  - "Geler le SDD baseliné ; la construction peut alors — et seulement alors — commencer"
side: team
---
# Revue critique de conception (CDR)

Rituel Waterfall — le **deuxième tollgate**, à la sortie de la phase de conception. Le narratif de
référence est le cycle de vie en cascade. Côté `team`. **Clôt** la phase Design.

L'**Architect** présente le **SDD** ; on vérifie qu'il **couvre entièrement** le SRS baseliné et que
chaque élément de conception **trace** vers une exigence. Le **Project Manager** préside et décide :
la **baseline de conception** est signée et **gelée**, ou le SDD retourne en correction. Sans cette
signature, **la construction ne commence pas** (garde-fou `no-code-before-design`). C'est le verrou
du *big design up front* : tout l'ouvrage est validé sur le papier avant qu'on ne coule le béton.
