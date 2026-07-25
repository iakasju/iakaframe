---
id: waterfall
name: Méthode Waterfall
workflowId: waterfall-lifecycle
principleIds: [waterfall-sequentialite, waterfall-documentation-exhaustive, waterfall-tracabilite, waterfall-validation-de-phase, waterfall-predictibilite]
ritualIds: [waterfall-phase-gate-review, waterfall-requirements-review, waterfall-design-review, waterfall-test-readiness-review, waterfall-acceptance-signoff]
guardrailIds: [waterfall-no-phase-skip, waterfall-no-code-before-design, waterfall-requirements-freeze, waterfall-traceability, definition-of-done]
roleKeys: [waterfall-project-manager, waterfall-business-analyst, waterfall-architect, waterfall-developer, waterfall-qa-tester]
scaffoldIds: [waterfall-artifacts]
---
# Méthode Waterfall (assemblage de discipline)

Assemblage de **discipline** au format réservoir : **que des ids** vers `library/*` partagée — aucun
corps recopié. Ne nomme **aucune persona** (le casting est apparié à la méthode dans `bindings/` via
la `team`). Le narratif de référence est le modèle en cascade (Royce, 1970 ; DoD-STD-2167A ; PMBOK).

Waterfall est un **cycle de vie séquentiel à gates forts** : cinq phases strictement ordonnées
(Requirements → Design → Implementation → Verification → Maintenance, `workflowId:
waterfall-lifecycle`), une **revue de fin de phase** (tollgate) à chaque frontière, une
**documentation exhaustive** en amont, des **exigences figées** dès la première phase, une
**traçabilité** de bout en bout et une **autorité surplombante** (le Project Manager) qui préside et
signe chaque passage. Cinq rôles à hiérarchie marquée, quatre garde-fous de gate/baseline.

> **Rangement réservoir.** Les 5 rôles, 5 principes, 5 rituels et 4 garde-fous propres à Waterfall
> sont **qualifiés** (`waterfall-*`) dans la library partagée. Waterfall **référence** en outre le
> garde-fou **neutre** `definition-of-done` (déjà promu par le pilote Scrum) : **chaque gate de
> phase** porte des **critères de sortie/acceptation** formels et opposables (SRR/CDR/TRR/signature
> d'acceptation) — une Definition of Done par phase. `definition-of-done` est ainsi **partagé par 2
> frames** (Scrum + Waterfall) — A5 vérifié. Les garde-fous propres restent **qualifiés** : ils
> portent des nuances spécifiques (`waterfall-no-code-before-design` = couplage design→code,
> `waterfall-requirements-freeze` = gel d'exigences) que le neutre ne peut exprimer (candidats à un
> `phase-gate`/`baseline-freeze` neutre plus tard, mais posture CONSERVATRICE : pas de promotion sur
> une seule frame).
>
> **Contraste de gouvernance avec iakaframe — et proximité structurelle.** Comme iakaframe, Waterfall
> a des **gates de phase forts** : une phase ne s'ouvre qu'après **validation de la précédente**.
> C'est le **seul** frame du catalogue (à côté d'iakaframe) à reposer sur un **pipeline à verrous
> successifs** — et c'est pourquoi il **remplit le format `phases` + `gates` nativement**, sans le
> détourner (contrairement au frame Scrum, cyclique). Deux différences honnêtes : (1) Waterfall est
> **sans itération** — aucun retour arrière prévu (là où iakaframe **boucle**) ; (2) ses gates sont
> **hiérarchiques et descendants** — un signataire unique au-dessus de l'équipe. Même modèle
> d'assemblage, gouvernance plus **rigide, documentaire et plan-driven** — la preuve que le format,
> qui **penche déjà vers le pipeline à gates**, accueille Waterfall avec le **moins de friction** de
> tout le catalogue.
