---
id: scrum-sprint
name: Scrum — cycle empirique du Sprint (transparence → inspection → adaptation)
kind: cycle
container: scrum-sprint
phases:
  - { id: planning,   label: "Sprint Planning", ritual: scrum-sprint-planning, actorsRoleKeys: [scrum-product-owner, scrum-developers, scrum-master], input: "Product Backlog ordonné + Product Goal", output: "Sprint Backlog (Sprint Goal + items + plan)" }
  - { id: execution,  label: "Développement + Daily Scrum", ritual: scrum-daily-scrum, actorsRoleKeys: [scrum-developers], input: "Sprint Backlog", output: "Increment en construction (adapté chaque jour)" }
  - { id: refinement, label: "Backlog Refinement (continu)", ritual: scrum-backlog-refinement, actorsRoleKeys: [scrum-developers, scrum-product-owner], input: "Product Backlog", output: "haut du backlog raffiné / Ready" }
  - { id: review,     label: "Sprint Review", ritual: scrum-sprint-review, actorsRoleKeys: [scrum-product-owner, scrum-developers, scrum-master], input: "Increment « Done »", output: "Product Backlog adapté (feedback stakeholders)" }
  - { id: retro,      label: "Sprint Retrospective", ritual: scrum-sprint-retrospective, actorsRoleKeys: [scrum-developers, scrum-master, scrum-product-owner], input: "vécu du Sprint", output: "améliorations de process pour le prochain Sprint" }
pillars: [scrum-transparence, scrum-inspection, scrum-adaptation]
loop: "à la fin de la Retrospective, un nouveau Sprint démarre immédiatement (cadence constante)"
---
# Workflow Scrum — cycle empirique du Sprint

Contrairement à un **pipeline à phases avec gates** (où chaque étape franchit un verrou vers la
suivante), Scrum est un **cycle empirique** : le contrôle ne vient pas de portes de validation
successives mais de la boucle **transparence → inspection → adaptation** répétée à chaque Sprint. Le
narratif de référence est le *Scrum Guide 2020*.

Le **Sprint** (conteneur, ≤ 1 mois) enchaîne : **Sprint Planning** (ouvre, forge le Sprint Goal et
le Sprint Backlog), **développement quotidien** rythmé par le **Daily Scrum** (les Developers
inspectent et adaptent leur plan chaque jour), un **raffinage continu** du Product Backlog, puis
deux inspections de clôture — **Sprint Review** (inspection du **produit** : on adapte le Product
Backlog avec les stakeholders) et **Sprint Retrospective** (inspection du **process** : on adapte la
manière de travailler).

> Différence de gouvernance avec un frame à décideur surplombant : il n'y a **pas de gate humain
> hiérarchique** entre les étapes. Les points d'inspection sont **collectifs et empiriques**, pas des
> autorisations accordées par un chef. À la fin de la Retrospective, un **nouveau Sprint démarre
> aussitôt** — la boucle ne s'arrête pas, elle apprend.
