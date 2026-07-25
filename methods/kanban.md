---
id: kanban
name: Méthode Kanban
workflowId: kanban-flow
principleIds: [kanban-start-where-you-are, kanban-evolutionary-change, kanban-leadership-at-all-levels, kanban-customer-focus,
  kanban-visualize, kanban-limit-wip, kanban-manage-flow, kanban-explicit-policies, kanban-feedback-loops, kanban-improve-collaboratively]
ritualIds: [kanban-daily-standup, kanban-replenishment, kanban-delivery-planning, kanban-service-delivery-review, kanban-risk-review, kanban-operations-review]
guardrailIds: [kanban-wip-limit, kanban-pull-not-push, kanban-policies-on-the-board, time-box]
roleKeys: [kanban-flow-manager, kanban-request-manager, kanban-contributor]
scaffoldIds: [kanban-board]
---
# Méthode Kanban (assemblage de discipline)

Assemblage de **discipline** au format réservoir : **que des ids** vers `library/*` partagée —
aucun corps recopié. Ne nomme **aucune persona** (le casting est apparié à la méthode dans `teams/` +
`bindings/`). Le narratif de référence est la *Kanban Method* de **David J. Anderson** (*Essential
Kanban Condensed*, 2016 ; *Kanban Maturity Model*), elle-même enracinée dans le *Toyota Production
System* (Taiichi Ohno).

Kanban est une **méthode d'amélioration évolutionnaire** appliquée à un **système de travail
existant** : on **commence là où on est** (`kanban-start-where-you-are`), on **visualise** le flux, on
**limite le WIP**, on **gère le flux**, on rend les **politiques explicites**, on installe des
**boucles de feedback** (les cadences) et on **améliore collaborativement**. Le travail est **tiré**
(pull), jamais poussé ; le contrôle vient des **limites de WIP**, pas de gates ni de time-boxes.

> **Rangement réservoir.** Les trois principes de gestion du changement, les six pratiques, le
> principe de service, les six cadences, les trois garde-fous et les trois rôles propres à Kanban
> sont **qualifiés** (`kanban-*`) dans la library partagée. Kanban **référence** en outre le
> garde-fou **neutre** `time-box` (déjà promu par le pilote Scrum) : ses cadences sont bornées dans
> le temps (standup ≈ 15 min, replenishment 30–60 min…). Le garde-fou de flux propre — la **limite
> de WIP** — reste **qualifié** (`kanban-wip-limit`) : une limite de *quantité de travail* n'est
> pas une durée, le test de neutralité échoue, donc pas de fusion avec `time-box`. La méthode ne
> porte que des ids.

> **Contraste de gouvernance — Kanban vs Scrum vs iakaframe.** Le trait distinctif de Kanban est sa
> **minimalité en rôles**, à l'exact opposé de Scrum (rôle-centré : trois comptabilités prescrites).
> Kanban **ne prescrit aucun rôle obligatoire** : il **se superpose** à l'organisation et **hérite**
> de ses rôles/titres existants. Les **deux seuls rôles reconnus** — Flow Manager (Service Delivery
> Manager) et Service Request Manager (Product Manager) — sont **facultatifs et émergents**, à
> **périmètres légers** (des responsabilités de **service**, pas des positions hiérarchiques). Le
> troisième rôle de cet assemblage, `kanban-contributor`, est marqué `scope: inherited` : c'est un
> **placeholder** rendant la team castable, **pas** un rôle canonique Kanban.
>
> Là où **iakaframe** pose un **décideur au-dessus** et un **pipeline à gates**, et où **Scrum**
> **répartit** l'autorité sur trois rôles dans un **cycle de Sprints**, **Kanban** distribue la
> gouvernance dans le **système lui-même** : ce sont les **politiques explicites**, les **limites de
> WIP** et le **pull** qui régulent le travail — pas des personnes qui commandent, pas des rôles qui
> se partagent l'autorité. La **gouvernance est dans le flux**. C'est le même **modèle d'assemblage**
> (méthode = ids vers un réservoir d'atomes agnostiques) au service d'une **troisième gouvernance** —
> preuve, à nouveau, que le frame est **neutre** vis-à-vis de la gouvernance qu'il outille.
>
> **Cadences omises volontairement.** La *Strategy Review* (trimestrielle, orientation/portefeuille)
> existe dans Kanban mais dépasse le périmètre d'une équipe : elle n'est pas matérialisée en atome
> ici (mentionnée dans `kanban-operations-review` et `kanban-flow`).
