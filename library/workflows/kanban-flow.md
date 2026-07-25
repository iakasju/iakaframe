---
id: kanban-flow
name: Kanban — flux tiré continu (visualiser → limiter le WIP → tirer → mesurer → améliorer)
kind: flow
container: none
stages:
  - { id: options,     label: "Options (amont, non engagé)", wipLimited: false, actorsRoleKeys: [kanban-request-manager], entry: "demande recueillie", exit: "sélectionnée & ordonnée pour le replenishment" }
  - { id: committed,   label: "Engagé (file d'attente)", wipLimited: true, actorsRoleKeys: [kanban-request-manager, kanban-contributor], entry: "TIRÉ au replenishment (point d'engagement)", exit: "capacité libre en aval → tiré" }
  - { id: in-progress, label: "En cours", wipLimited: true, actorsRoleKeys: [kanban-contributor], entry: "tiré sous la limite de WIP", exit: "critères de sortie de colonne satisfaits" }
  - { id: done,        label: "Terminé / prêt à livrer", wipLimited: true, actorsRoleKeys: [kanban-contributor, kanban-flow-manager], entry: "définition du « fini » satisfaite", exit: "livré au point de livraison" }
  - { id: delivered,   label: "Livré (point de livraison)", wipLimited: false, actorsRoleKeys: [kanban-flow-manager], entry: "mis à disposition du client", exit: "—" }
pullPoints: [committed, in-progress, done]
commitmentPoint: committed
deliveryPoint: delivered
metrics: [lead-time, throughput, wip, cumulative-flow-diagram, flow-efficiency, aging-wip]
cadences: [daily-standup, replenishment, delivery-planning, service-delivery-review, risk-review, operations-review]
practices: [visualize, limit-wip, manage-flow, explicit-policies, feedback-loops, improve-collaboratively]
loop: "flux continu — pas d'itération de durée fixe ; le contrôle vient des limites de WIP et du pull, l'amélioration des cadences"
---
# Workflow Kanban — flux tiré continu

Contrairement à un **pipeline à phases avec gates** (iakaframe : chaque étape franchit un **verrou
hiérarchique** vers la suivante) **et** à un **cycle d'itérations de durée fixe** (Scrum : le Sprint
comme conteneur temporel), Kanban est un **flux tiré continu**. Il n'a **ni conteneur temporel, ni
gate d'autorisation** : le contrôle vient de **deux mécanismes structurels** — la **limite de WIP**
et le **pull** — et l'amélioration, des **cadences de feedback**. Le narratif de référence est la
*Kanban Method* (David J. Anderson).

Les « étapes » ci-dessus sont des **colonnes du tableau** (états réels du travail), **pas des phases
temporelles**. Le travail traverse : **Options** (amont non engagé, révocable) → *[point
d'engagement au replenishment]* → **Engagé** → **En cours** → **Terminé** → *[point de livraison]* →
**Livré**. Chaque colonne coiffée d'une **limite de WIP** ne se remplit que par **pull** : un item
n'avance **que si** l'aval a de la **capacité libre**.

## Deux frontières distinctes (découplées)
- **Point d'engagement** (`committed`) : avant, tout est **option** (on peut jeter, réordonner,
  différer) ; après, le système **promet** de livrer. Franchi **par pull** au *replenishment*.
- **Point de livraison** (`delivered`) : mise à disposition du client, à la **cadence de livraison**
  — **découplée** de l'engagement. On peut engager à un rythme et livrer à un autre.

Le **lead time** se mesure du point d'engagement au point de livraison.

## Contrôle empirique, sans gate hiérarchique
Comme Scrum, Kanban **n'a pas de gate humain hiérarchique** entre les étapes : les **points
d'inspection** sont les **cadences** (collectives, empiriques), pas des autorisations accordées par
un chef. Mais là où Scrum inspecte à **rythme fixe** (les événements du Sprint), Kanban **découple**
les rythmes : le **flux est continu**, chaque **boucle de feedback** bat à **sa** cadence. Le
système ne s'arrête jamais entre deux itérations — **il n'y a pas d'itération** ; il **coule**, se
**mesure** (loi de Little : *lead time = WIP / débit*) et **s'améliore** en continu.
