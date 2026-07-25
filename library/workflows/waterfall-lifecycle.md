---
id: waterfall-lifecycle
name: Waterfall — cycle de vie en cascade (Requirements → Design → Implementation → Verification → Maintenance)
kind: pipeline
phases:
  - { id: requirements, label: "Requirements", ritual: waterfall-requirements-review, actorsRoleKeys: [waterfall-business-analyst, waterfall-project-manager], input: "besoin / mandat des parties prenantes", output: "SRS baseliné (exigences figées, tracées)" }
  - { id: design,        label: "Design", ritual: waterfall-design-review, actorsRoleKeys: [waterfall-architect, waterfall-project-manager], input: "SRS baseliné", output: "SDD baseliné (architecture, composants, interfaces)" }
  - { id: implementation, label: "Implementation", ritual: waterfall-test-readiness-review, actorsRoleKeys: [waterfall-developer, waterfall-project-manager], input: "SDD baseliné", output: "build intégré + tests unitaires + doc de construction" }
  - { id: verification,  label: "Verification", ritual: waterfall-acceptance-signoff, actorsRoleKeys: [waterfall-qa-tester, waterfall-project-manager], input: "build candidat", output: "système accepté (rapport de test + matrice de traçabilité couverte)" }
  - { id: maintenance,   label: "Maintenance", ritual: waterfall-phase-gate-review, actorsRoleKeys: [waterfall-project-manager, waterfall-developer, waterfall-qa-tester], input: "système livré + demandes de changement", output: "corrections/évolutions via change control (nouvelles baselines)" }
gates:
  - { afterPhase: requirements,  kind: human, criteria: "SRS complet, non ambigu, tracé — baseline des exigences signée (SRR) par le Project Manager" }
  - { afterPhase: design,        kind: human, criteria: "SDD couvre le SRS, traçabilité vérifiée — baseline de conception signée (CDR) ; sans quoi pas de code" }
  - { afterPhase: implementation, kind: human, criteria: "tous les modules du SDD construits et tracés, plan de test prêt — entrée en vérification autorisée (TRR)" }
  - { afterPhase: verification,  kind: human, criteria: "chaque exigence a sa preuve de couverture, recette/UAT concluante — signature d'acceptation ; livraison autorisée" }
noBackflow: "aucun retour arrière prévu au fil normal ; un changement après gel passe par le change control (re-baseline formelle), pas par une itération"
---
# Workflow Waterfall — cycle de vie en cascade

Un **pipeline linéaire à phases séquentielles** avec un **gate fort** à chaque frontière : une phase
ne s'ouvre qu'après **signature du gate** de la précédente, et sa **baseline gelée**. Le narratif de
référence est le modèle en cascade (Royce, 1970 ; DoD-STD-2167A ; PMBOK, gestion prédictive).

La cascade enchaîne : **Requirements** (le Business Analyst fige le SRS ; gate SRR), **Design**
(l'Architect fige le SDD ; gate CDR — *big design up front*), **Implementation** (les Developers
construisent selon le SDD ; gate TRR), **Verification** (le QA/Tester éprouve le système contre les
baselines ; gate d'acceptation/recette), puis **Maintenance** (corrections et évolutions **via change
control**). Le **Project Manager** préside **chaque** gate et **signe** le passage.

> **Le format à `phases` + `gates` accueille Waterfall NATIVEMENT.** Là où le frame Scrum a dû
> **détourner** ce format (workflow déclaré `kind: cycle`, sans bloc `gates`, avec un champ `loop`
> pour dire « pas de porte hiérarchique, on recommence »), Waterfall **remplit le format tel quel** :
> une liste ordonnée de `phases` et un bloc `gates` — exactement la structure du canon iakaframe
> (`iakaframe-3phases`). Constat honnête : **le format de frame penche vers le pipeline à gates**, et
> Waterfall y **entre plus facilement** que les cadres itératifs ou cycliques. La seule nuance : ici
> **tous** les gates sont `kind: human` (signature du Project Manager), et le champ `noBackflow`
> encode l'absence d'itération — l'eau ne remonte pas la cascade.
>
> Différence de gouvernance avec iakaframe : les gates y sont **hiérarchiques** (un seul signataire,
> le PM, au-dessus de l'équipe) et **sans retour arrière prévu** ; iakaframe mêle gates humains et
> auto (qualité indépendante) et **itère** (boucle besoin→feedback→boucle). Même squelette de
> pipeline, gouvernance plus **rigide et descendante**.
