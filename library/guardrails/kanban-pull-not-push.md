---
id: kanban-pull-not-push
label: Tirer, pas pousser (pull, not push)
kind: pull
hook: "flux:transition d'un item vers l'aval (discipline collective sur le tableau)"
policy: "Le travail est TIRÉ par l'aval quand une capacité se libère, jamais POUSSÉ par l'amont. Un item ne franchit une frontière (dont le point d'engagement) que lorsque l'étape ou l'équipe réceptrice a la capacité de le prendre. Personne n'empile de travail sur qui que ce soit."
---
# Tirer, pas pousser (pull, not push)

Garde-fou de Kanban (*Kanban Method*, David J. Anderson). Le narratif de référence est cette
littérature. Corollaire direct de la limite de WIP : c'est **elle** qui transforme le *push* en
*pull*.

**Politique.** Le travail est **tiré** par l'aval quand une **capacité se libère**, **jamais poussé**
par l'amont. Un item ne franchit une frontière — y compris le **point d'engagement** (replenishment)
— que lorsque l'étape ou l'équipe **réceptrice** a la **capacité** de le prendre. **Personne
n'empile** de travail sur qui que ce soit : ni le Service Request Manager sur l'équipe, ni un
manager sur les contributeurs.

> **Enforcement** — discipline **collective et visuelle**, pas un hook runtime : le mécanisme est le
> **signal de tirage** (la carte kanban, l'espace libre sous la limite de WIP). Un outil peut
> matérialiser le signal ; la comptabilité reste **humaine**. C'est l'inverse exact d'un modèle où
> une autorité **assigne** et **pousse** le travail — ici, la capacité **appelle** le travail.
