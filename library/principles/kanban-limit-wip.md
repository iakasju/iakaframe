---
id: kanban-limit-wip
label: "Pratique 2 — Limiter le travail en cours (WIP)"
policy: "Fixe une limite explicite au travail en cours de chaque étape. Limiter le WIP transforme un système push en système pull : on ne commence pas plus qu'on ne peut finir. Moins de WIP = flux plus rapide et plus prévisible (loi de Little)."
trigger: "à chaque tirage d'un nouvel item"
---
# Pratique 2 — Limiter le travail en cours (WIP)

Deuxième des **six pratiques générales** de la *Kanban Method* — et le **cœur** de Kanban. Le
narratif de référence est cette littérature.

**Politique.** Fixe une **limite explicite** au travail en cours (*work in progress*) de chaque
étape. Limiter le WIP **transforme un système *push* en système *pull*** : on ne **commence** pas
plus qu'on ne peut **finir**. Moins de WIP → moins de changements de contexte, moins de blocages
cachés, un **lead time plus court et plus prévisible** (loi de Little : *lead time = WIP / débit*).
La limite est un **choix d'équipe**, ajustable, jamais un plafond subi.

> La **pratique** (ce principe) est le *pourquoi* — la philosophie du « stop starting, start
> finishing ». Son **enforcement** vit dans le garde-fou `wip-limit` (le *quoi faire quand la
> limite est atteinte* : on ne tire pas).

**Déclencheur.** à chaque tirage d'un nouvel item.
