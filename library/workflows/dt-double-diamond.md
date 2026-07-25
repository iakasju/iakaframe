---
id: dt-double-diamond
name: Double Diamond — divergence / convergence en deux temps (le bon problème, puis la bonne solution)
kind: cycle
container: design-cycle
nonLinear: true
phases:
  - { id: discover,         label: "Discover (empathie)",        ritual: dt-empathize,      nature: divergent,  actorsRoleKeys: [dt-design-researcher, dt-user-advocate, dt-facilitator], input: "défi de conception (design brief)", output: "insights bruts (verbatims, cartes d'empathie, personas, parcours)" }
  - { id: define,           label: "Define (synthèse)",          ritual: dt-define,         nature: convergent, actorsRoleKeys: [dt-ideator, dt-design-researcher, dt-user-advocate, dt-facilitator], input: "insights bruts", output: "problème reformulé (point de vue + « How Might We »)" }
  - { id: develop-diverge,  label: "Develop — idéation",         ritual: dt-ideate,         nature: divergent,  actorsRoleKeys: [dt-ideator, dt-prototyper, dt-user-advocate, dt-facilitator], input: "« How Might We »", output: "beaucoup d'idées → quelques concepts retenus" }
  - { id: develop-converge, label: "Develop — prototypage",      ritual: dt-prototype,      nature: convergent, actorsRoleKeys: [dt-prototyper, dt-ideator, dt-user-advocate], input: "concepts retenus", output: "prototypes basse fidélité testables" }
  - { id: deliver,          label: "Deliver (test)",             ritual: dt-test,           nature: convergent, actorsRoleKeys: [dt-user-advocate, dt-design-researcher, dt-prototyper, dt-facilitator], input: "prototypes testables", output: "apprentissages fondés sur des preuves + recommandation" }
diamonds:
  - { id: diamond-1, label: "Le bon PROBLÈME", spans: [discover, define] }
  - { id: diamond-2, label: "La bonne SOLUTION", spans: [develop-diverge, develop-converge, deliver] }
mindsets: [user-centered, diverge-before-converge, bias-toward-action, iterate]
loop: "après Deliver, la boucle iteration-loop décide : aboutir, ou rouvrir un diamant (redéfinir le problème, réidéer, reprototyper). Le processus n'est pas linéaire."
---
# Workflow Design Thinking — le Double Diamond

Contrairement à un **pipeline à phases avec gates hiérarchiques** (où chaque étape franchit un
verrou accordé par un décideur), le Design Thinking est un **cycle de divergence / convergence** en
**deux diamants**. Le narratif de référence est le modèle du **Double Diamond** (British Design
Council) articulé aux **cinq modes d.school** (Empathize, Define, Ideate, Prototype, Test).

## Les deux diamants
- **Diamant 1 — le bon PROBLÈME.** *Discover* (empathie) **diverge** : on élargit la compréhension de
  l'utilisateur. *Define* (synthèse) **converge** : on resserre en un problème bien posé (point de
  vue + « How Might We »).
- **Diamant 2 — la bonne SOLUTION.** *Develop* **diverge** puis **converge** : on **idée** largement
  (idéation) puis on **prototype** quelques concepts. *Deliver* (test) **converge** : on confronte au
  réel et on tranche par les **preuves d'usage**.

## Le geste, pas la marche
Chaque phase porte une **nature** — **divergent** (ouvrir, suspendre le jugement) ou **convergent**
(resserrer, décider). Le contrôle ne vient **pas** de portes de validation successives mais de
l'**alternance disciplinée** ouvrir → fermer, répétée. La divergence est **protégée** (§
`protect-divergence`) ; on ne converge jamais trop tôt.

> **Différence de gouvernance avec un frame à décideur surplombant.** Il n'y a **pas de gate humain
> hiérarchique** entre les phases : l'équipe est **pluridisciplinaire et non hiérarchique**, le
> Facilitateur **sert** le rythme sans commander. Et surtout, le cycle est **non-linéaire** : après
> *Deliver*, `iteration-loop` peut **rouvrir** n'importe quel diamant à la lumière des preuves. Un
> « échec » de test **relance** la boucle — il ne bloque pas un tunnel.
