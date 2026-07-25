---
id: leanstartup-claude
methodId: lean-startup
teamId: leanstartup-team
bindingId: leanstartup-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", "LEANSTARTUP.md"]
---
# Kit leanstartup-claude

Manifeste du livrable généré pour le runner **claude** : assemble `method: lean-startup` + `team:
leanstartup-team` + `binding: leanstartup-default` en un kit installable. Le narratif de référence
est *The Lean Startup* (Eric Ries).

Émet les **quatre subagents** (Edison / Ohno / Shingo / Deming) avec leur skill-rôle, les **skills**
de pilotage de vision / découverte client / construction de MVP / preuve de marché, et un contrat
**`LEANSTARTUP.md`** (équivalent du `CLAUDE.md` iakaframe : conventions d'équipe, artefacts
d'apprentissage, comptabilité de l'innovation, cadence build-measure-learn et revue
pivot-or-persevere). La **génération automatique** depuis le binding est **[différée]** — au MVP, le
kit est rangé tel quel, comme le fait iakaframe pour ses kits runner.

> Le kit **n'émet aucun hook d'identité/périmètre** au sens iakaframe : les garde-fous Lean Startup
> (`mvp-minimal`, `actionable-metrics`, `evidence-based-pivot`, `five-whys`) sont des **disciplines
> d'expérimentation et d'honnêteté de la donnée**, pas des *hooks* runtime — un outil peut au mieux
> les rendre visibles (signaler une feature sans hypothèse, une vanity metric, une stagnation), jamais
> les forcer. C'est une différence structurelle assumée entre un frame à **gouvernance par
> l'expérimentation** (Lean Startup) et un frame à **gouvernance surplombante outillée par hooks**
> (iakaframe).
