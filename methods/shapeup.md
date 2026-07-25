---
id: shapeup
name: Méthode Shape Up
workflowId: shapeup-cycle
principleIds: [shapeup-fixed-time-variable-scope, shapeup-appetite-not-estimate, shapeup-shaped-work, shapeup-bets-not-plans, shapeup-team-autonomy, shapeup-no-backlog, shapeup-integrate-one-slice]
ritualIds: [shapeup-six-week-cycle, shapeup-cool-down, shapeup-shaping, shapeup-betting-table, shapeup-kickoff, shapeup-hill-chart-check, shapeup-scope-hammering]
guardrailIds: [shapeup-circuit-breaker, shapeup-appetite-respected, shapeup-no-scope-creep, shapeup-no-backlog-accumulation, time-box]
roleKeys: [shapeup-shaper, shapeup-betting-table, shapeup-designer, shapeup-programmer]
scaffoldIds: [shapeup-artifacts]
---
# Méthode Shape Up (assemblage de discipline)

Assemblage de **discipline** au format réservoir : **que des ids** vers `library/*` partagée — aucun
corps recopié. Ne nomme **aucune persona** (le casting est apparié à la méthode dans `bindings/` via
la `team`). Le narratif de référence est le livre *Shape Up* de Ryan Singer (Basecamp, 2019).

Shape Up est une méthode de développement produit organisée en **cycles de 6 semaines** suivis d'un
**cool-down de 2 semaines**. Elle repose sur trois activités **distinctes et séparées dans le temps** :
le **shaping** (façonner le travail au bon niveau d'abstraction, **avant** l'engagement, par des
seniors, à huis clos), le **betting** (des dirigeants **parient** sur des pitchs façonnées, au lieu de
planifier un backlog), et le **building** (une **équipe réduite** — un designer + un ou deux
programmeurs — construit en **autonomie totale**, par scopes). Ses invariants : **temps fixe, périmètre
variable** ; un **appétit** plutôt qu'une estimation ; **pas de backlog** ; et le **circuit breaker**
(un projet non fini en 6 semaines n'est pas prolongé par défaut).

> **Rangement réservoir.** Les 4 rôles, 7 principes, 7 rituels et 4 garde-fous propres à Shape Up
> sont **qualifiés** (`shapeup-*`) dans la library partagée. Shape Up **référence** en outre le
> garde-fou **neutre** `time-box` (déjà promu par le pilote Scrum, partagé par Kanban) : le **cycle
> de 6 semaines** et le **cool-down** sont des durées bornées fixes. Les garde-fous propres restent
> qualifiés car ils portent des **nuances** que le neutre `time-box` ne peut pas exprimer sans
> trahir : `shapeup-circuit-breaker` (à l'échéance, le projet **retombe** et exige un **re-pari**
> explicite — pas d'extension), `shapeup-appetite-respected` (le périmètre plie pour tenir le temps).
> Le test de neutralité §3.1 échoue pour ces deux-là → QUALIFIER, pas fusionner. `time-box` est
> désormais **partagé par 3 frames** (Scrum, Kanban, Shape Up) — A5 vérifié.
>
> **Contraste de gouvernance avec iakaframe.** Là où iakaframe pose un **décideur au-dessus** d'une
> équipe d'experts et un **pipeline à gates** successifs, Shape Up est **bicéphale** : **pari fort au
> sommet** (la Betting Table est le seul vrai go/no-go) et **autonomie totale en bas** (l'équipe de
> build n'a aucun gate hiérarchique pendant le cycle). Le contrôle n'est **pas** au milieu (management
> d'exécution) mais aux **frontières** : bien **façonner** en amont, bien **parier** au seuil, **laisser
> tomber** à l'échéance (circuit breaker). Le temps fixe — pas un chef qui surveille — est ce qui borne
> l'équipe. C'est le **même modèle d'assemblage** (méthode = ids vers un réservoir d'atomes agnostiques)
> au service d'une **cinquième gouvernance**, distincte à la fois du pipeline surplombant (iakaframe) et
> du collectif plat auto-organisé (Scrum) — preuve renouvelée que le frame est **neutre vis-à-vis de la
> gouvernance** qu'il outille.
