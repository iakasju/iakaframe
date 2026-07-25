---
id: iakaframe-8
name: La compagnie iakaframe
personas: [odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie, feanor]
coordinator: aragorn
guardrails: []
vignetteTeam: none
---
# La compagnie iakaframe

Assemblage de casting (ids de `library/personas/`). Forgé par iakaFrameGUI.

> **Note — `-8` est un identifiant OPAQUE, pas un compteur.** Le suffixe `-8` de `iakaframe-8`
> est un **id figé**, non un décompte de personas : le roster peut croître (9 personas depuis
> l'ajout de `feanor`) sans que l'id change. Renommer coûterait plus que le bénéfice (référencé
> par le binding, la fixture vendorée, les docs et le miroir `StefFrame2`). Ne pas en inférer le
> cardinal du casting. Cf. D-F de `specs/instructions/role-frame-builder.md`.

> **Note — niveau portefeuille.** `odin` figure au roster en tant que **super-agent
> portefeuille**, à l'étage **au-dessus** de la compagnie : présent à l'inventaire de
> référence mais **hors dispatch projet** (non dispatché comme exécutant d'équipe, exclu
> du déploiement `fullteam`) — cf. `library/personas/odin.md`. `coordinator: aragorn` reste
> le coordinateur d'équipe.

> **Note — activation explicite (`feanor`).** `feanor` (Constructeur de frame) figure au roster
> mais **ne s'active que sur demande explicite** de l'utilisateur : il est **hors dispatch
> automatique**, exclu du déploiement `fullteam` — pour une **raison différente** d'Odin (Odin est
> portefeuille au-dessus des équipes ; Fëanor est un membre d'équipe à activation explicite). Porté
> par `EXPLICIT_ACTIVATION_PERSONAS` (`cli/src/lib/agents.js`), **distinct** de `PORTFOLIO_PERSONAS`.
> Cf. `library/personas/feanor.md` § Étanchéité et D-G de `role-frame-builder.md`.
