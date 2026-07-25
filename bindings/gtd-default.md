---
id: gtd-default
methodId: gtd
teamId: gtd-solo
node: claude
origin: forge-gtd
assignments:
  - { personaId: lee, runner: claude-code, model: "opus", tools: [Read, Grep, Glob, Write, Edit, Bash] }
---
# Binding GTD — défaut Claude Code

Appariement **méthode ↔ team** + **triplet `{runner, model, tools}` par persona** — le SEUL endroit
où vivent `runner`, `model` et `tools` (la persona de `library/personas/` reste pure : casting sans
runner ni model). Le narratif de référence est *Getting Things Done* (David Allen).

**Une seule ligne d'assignation**, parce que GTD n'a **qu'un acteur** : **Lee**.

`tools` = **allowlist runner-scoped** (noms d'outils built-in Claude Code), au principe du **moindre
privilège**. Lee **porte les cinq modes** à lui seul ; son allowlist doit donc couvrir **tout** le
flux :
- **Capture / Clarify / Organize / Reflect** — tenir le système de listes et les inbox : `Read`,
  `Grep`, `Glob` (parcourir/relire le système), `Write`, `Edit` (créer et mettre à jour inbox,
  next-actions par contexte, projets, calendrier, waiting-for, someday/maybe, référence).
- **Engage** — exécuter des actions concrètes, y compris opératoires : `Bash`.

Modèle : **`opus`** — le praticien GTD n'exécute pas seulement, il **juge** en permanence (« c'est
quoi ? actionnable ? quelle est la prochaine action ? quel horizon ? »), charge cognitive
comparable aux comptabilités à fort jugement des frames d'équipe. **Défaut suggéré**, surchargeable.
Runner unique : **claude-code**.

> **Pas de séparation de privilèges entre modes.** Dans un frame d'équipe, le binding **borne** chaque
> persona (le PO n'a pas `Bash`, le facilitateur n'a pas `Edit`…) — le **moindre privilège** sépare
> des **acteurs**. Ici, un **seul** acteur porte les cinq modes : l'allowlist est nécessairement
> l'**union** de tous les modes, et le moindre privilège ne peut **pas** cloisonner Capture de
> Engage — c'est **la même personne**. Encore un endroit où le présupposé d'équipe du format ne mord
> pas sur une méthode solo.
