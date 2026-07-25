---
id: scrum
name: Méthode Scrum
workflowId: scrum-sprint
principleIds: [scrum-engagement, scrum-courage, scrum-focus, scrum-ouverture, scrum-respect, scrum-transparence, scrum-inspection, scrum-adaptation]
ritualIds: [scrum-sprint, scrum-sprint-planning, scrum-daily-scrum, scrum-backlog-refinement, scrum-sprint-review, scrum-sprint-retrospective]
guardrailIds: [time-box, scrum-scope-integrity, definition-of-done, scrum-self-management]
roleKeys: [scrum-product-owner, scrum-master, scrum-developers]
scaffoldIds: [scrum-artifacts]
---
# Méthode Scrum (assemblage de discipline)

Assemblage de **discipline** au format réservoir : **que des ids** vers `library/*` partagée — aucun
corps recopié. Ne nomme **aucune persona** (le casting est apparié à la méthode dans `bindings/` via
la `team`). Le narratif de référence est le *Scrum Guide 2020* (Schwaber & Sutherland).

Scrum est un cadre **léger** de contrôle empirique de processus : une Scrum Team **auto-organisée**
(Product Owner, Scrum Master, Developers — trois comptabilités de **même niveau**, sans décideur
surplombant), un **cycle de Sprints** (`workflowId: scrum-sprint`) rythmé par cinq événements, trois
**artefacts** avec leurs engagements (Product Goal, Sprint Goal, Definition of Done), **cinq valeurs**
(engagement, courage, focus, ouverture, respect) et **trois piliers** empiriques (transparence,
inspection, adaptation).

> **Rangement réservoir.** Les valeurs, piliers, rituels, rôles et deux garde-fous propres à Scrum
> sont **qualifiés** (`scrum-*`) dans la library partagée ; deux garde-fous **génériques** —
> `time-box` et `definition-of-done` — sont **promus neutres** (partageables avec d'autres frames) et
> référencés ici tels quels. La méthode ne porte que des ids.

> **Contraste de gouvernance avec iakaframe.** Là où iakaframe pose un **décideur au-dessus** d'une
> équipe d'experts à périmètres étanches, Scrum **répartit** l'autorité : le Product Owner décide de
> la **valeur**, les Developers décident du **comment** (auto-gestion, garde-fou `scrum-self-management`),
> le Scrum Master **facilite** le process **sans commander**. Aucune couche ne surplombe les deux
> autres. C'est le même **modèle d'assemblage** (méthode = ids vers un réservoir d'atomes agnostiques)
> au service d'une **gouvernance opposée** — la preuve que le frame est neutre vis-à-vis de la
> gouvernance qu'il outille.
