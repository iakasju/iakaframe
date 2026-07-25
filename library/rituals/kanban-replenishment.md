---
id: kanban-replenishment
label: Replenishment (réappro. + point d'engagement)
triggers: [replenishment, réapprovisionnement, commitment meeting, engagement, remplir la file]
cadence: "régulière, typiquement hebdomadaire (ou dès que la file engagée descend sous un seuil)"
timebox: "≈ 30–60 minutes"
actions:
  - "Revoir le pool d'options ordonné (amont) avec le Service Request Manager"
  - "Sélectionner et TIRER dans la file engagée ce que la capacité disponible permet"
  - "Franchir le POINT D'ENGAGEMENT : une option engagée devient une promesse de livraison"
  - "Attribuer/confirmer les classes de service ; ne rien pousser au-delà de la capacité"
side: team
---
# Replenishment (réapprovisionnement + point d'engagement)

Cadence de la *Kanban Method* (David J. Anderson). Le narratif de référence est cette littérature.
Côté `team`.

La cadence qui **remplit** la file engagée du système en **tirant** depuis le **pool d'options**
amont. C'est le lieu du **point d'engagement** (*commitment point*) : avant, tout est **option**
(révocable, réordonnable, sans promesse) ; après, l'item est **engagé** — le système promet de le
livrer. On ne tire **que ce que la capacité permet** (garde-fou `pull-not-push`) : rien n'est
**poussé**. Le Service Request Manager apporte les options ordonnées et les **classes de service** ;
l'équipe **tire**.

> C'est le pendant Kanban du *Sprint Planning*, mais **découplé du temps** : il n'ouvre pas une
> itération de durée fixe — il **réapprovisionne un flux continu** à un rythme régulier. Le
> **différé de l'engagement** (repousser la décision jusqu'au dernier moment responsable) est un
> principe *lean* central que cette cadence matérialise.
