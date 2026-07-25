---
id: leanstartup-loop
name: Lean Startup — boucle build-measure-learn (idée → build → mesure → apprentissage)
kind: cycle
container: build-measure-learn
phases:
  - { id: ideas,      label: "Idées / Hypothèse", ritual: leanstartup-hypothesis-experiment, actorsRoleKeys: [leanstartup-founder, leanstartup-customer-developer, leanstartup-early-adopter], input: "vision + hypothèses de foi classées par risque", output: "expérience falsifiable + métrique actionnable + seuil de succès" }
  - { id: build,      label: "Build (MVP)", ritual: leanstartup-build-measure-learn, actorsRoleKeys: [leanstartup-builder], input: "expérience conçue", output: "MVP minimal instrumenté livré aux early adopters" }
  - { id: measure,    label: "Measure (comportement réel)", ritual: leanstartup-learning-review, actorsRoleKeys: [leanstartup-early-adopter, leanstartup-builder], input: "MVP entre les mains des early adopters", output: "données actionnables (cohortes) — vanity écartées" }
  - { id: learn,      label: "Learn (apprentissage validé)", ritual: leanstartup-learning-review, actorsRoleKeys: [leanstartup-customer-developer, leanstartup-early-adopter, leanstartup-founder], input: "données mesurées", output: "apprentissage validé + baseline mise à jour" }
  - { id: decide,     label: "Pivot-or-Persevere", ritual: leanstartup-pivot-or-persevere-review, actorsRoleKeys: [leanstartup-founder, leanstartup-customer-developer, leanstartup-early-adopter], input: "comptabilité de l'innovation (progrès vers les learning milestones)", output: "décision persévère (nouvelle itération) ou pivote (hypothèse structurelle changée)" }
principlesInPlay: [validated-learning, innovation-accounting, minimize-time-through-the-loop]
loop: "après learn, on repart aussitôt sur une nouvelle hypothèse (persévère) ou une hypothèse pivotée (pivote) — la boucle ne s'arrête pas, elle apprend"
---
# Workflow Lean Startup — boucle build-measure-learn

Contrairement à un **pipeline à phases avec gates hiérarchiques** (où chaque étape franchit un verrou
accordé par un décideur), le Lean Startup est une **boucle empirique** : le contrôle ne vient pas de
portes d'autorisation mais du cycle **idée → build → produit → measure → données → learn** répété au
plus vite. Le narratif de référence est *The Lean Startup* (Eric Ries).

La **boucle** (conteneur `build-measure-learn`) enchaîne : **Idées/Hypothèse** (on entre par
l'apprentissage visé et on conçoit l'expérience à rebours), **Build** (le MVP minimal instrumenté),
**Measure** (le comportement réel des early adopters, en cohortes, vanity écartées), **Learn**
(l'apprentissage validé qui met à jour la baseline), et — à cadence — **Pivot-or-Persevere** (la
décision de cap sur la donnée). On **conçoit à rebours** : on part de ce qu'on veut apprendre pour
déduire quoi mesurer, puis quoi construire.

> **Différence de gouvernance avec un frame à décideur surplombant.** Il n'y a **pas de gate humain
> hiérarchique** entre les étapes : le point de décision (pivot-or-persevere) est **collectif et
> fondé sur la donnée** (garde-fous `evidence-based-pivot`, `actionable-metrics`), pas une
> autorisation accordée par un chef. Le fondateur **convoque** mais **ne tranche pas contre les
> faits**. Après Learn, un **nouveau tour démarre aussitôt** — on persévère (nouvelle itération) ou
> on pivote (hypothèse structurelle changée). La boucle ne s'arrête pas, elle **apprend**.
