---
id: design-thinking
name: Méthode Design Thinking
workflowId: dt-double-diamond
principleIds: [dt-user-centered, dt-reframe-the-problem, dt-diverge-before-converge, dt-bias-toward-action, dt-fail-early-cheap, dt-show-dont-tell, dt-iterate, dt-radical-collaboration]
ritualIds: [dt-design-cycle, dt-empathize, dt-define, dt-ideate, dt-prototype, dt-test, retrospective]
guardrailIds: [dt-protect-divergence, dt-problem-before-solution, dt-prototype-before-invest, dt-evidence-from-users]
roleKeys: [dt-facilitator, dt-design-researcher, dt-ideator, dt-prototyper, dt-user-advocate]
scaffoldIds: [design-thinking-artifacts]
---
# Méthode Design Thinking (assemblage de discipline)

Assemblage de **discipline** au format réservoir : **que des ids** vers `library/*` partagée — aucun
corps recopié. Ne nomme **aucune persona** (le casting est apparié à la méthode dans `teams/`, relié
par le `binding`). Le narratif de référence est la tradition **d.school (Stanford) / IDEO** et le
modèle du **Double Diamond** (British Design Council).

Le Design Thinking est une méthode d'**innovation centrée-utilisateur**, **non-logicielle par
nature** : elle sert à concevoir des produits, services, espaces ou expériences pour de **vrais
humains**. Sa structure est un **cycle de divergence / convergence** en deux diamants
(`workflowId: dt-double-diamond`) — *le bon problème*, puis *la bonne solution* — décliné en **cinq
modes** (Empathize, Define, Ideate, Prototype, Test), tenu par **huit principes** et **quatre
garde-fous** (protéger la divergence, problème avant solution, prototyper avant d'investir, preuves
venant des utilisateurs).

> **Rangement réservoir.** Les 5 rôles, 8 principes, 6 modes/rituels, 4 garde-fous propres au Design
> Thinking sont **qualifiés** (`dt-*`) dans la library partagée. Geste de dédup majeur :
> - **Création du neutre `retrospective`** (rituel). L'`iteration-loop` du brouillon se décrivait
>   lui-même comme « une rétrospective / revue d'apprentissage » : il **passe le test de neutralité**
>   (§3.1, inspect-and-adapt = principe agile général, fait de domaine vérifié). Il est donc
>   **PROMU NEUTRE** sous l'id `retrospective` et **référencé ici** à la place d'un `dt-iteration-loop`.
>   Le concept est **partagé** avec Scrum (dont la *Sprint Retrospective* prouve la transversalité) —
>   d'où la promotion justifiée. **`scrum-sprint-retrospective` n'est PAS touché** et **reste
>   qualifié** : c'est la cérémonie Scrum spécifique (cadence/time-box propres) qui échoue le test de
>   neutralité. Deux briques distinctes, sans écrasement.
>
> **Contraste de domaine avec iakaframe.** Là où iakaframe outille des **équipes de production
> logicielle** (un pipeline dev → qualité → stage → prod, avec gates), le Design Thinking outille
> l'**innovation non-logicielle** en amont : on ne « livre » pas du code, on **découvre le bon
> problème** et on **valide une direction** par des prototypes jetables et des tests utilisateurs.
> C'est le même **modèle d'assemblage** au service d'un **domaine et d'une logique opposés** : non pas
> franchir des verrous vers la production, mais **alterner ouvrir / fermer** jusqu'à trouver, en
> itérant. Preuve que le frame est neutre vis-à-vis du domaine qu'il outille.

> **Contraste de gouvernance.** Comme Scrum et à l'inverse d'iakaframe, l'équipe est
> **pluridisciplinaire et non hiérarchique** : le **Facilitateur** tient le *process* sans commander,
> l'**utilisateur** est l'autorité de dernier ressort (par les preuves, pas par le grade). Aucune
> couche ne surplombe les autres.
