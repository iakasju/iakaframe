---
id: shapeup-claude
methodId: shapeup
teamId: shapeup-team
bindingId: shapeup-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", "SHAPEUP.md"]
---
# Kit shapeup-claude

Manifeste du livrable généré pour le runner **claude** : assemble `method: shapeup` + `team:
shapeup-team` + `binding: shapeup-default` en un kit installable. Le narratif de référence est le livre
*Shape Up* (Ryan Singer, Basecamp, 2019).

Émet les **quatre subagents** (Whymper / Herzog / Messner / Hillary) avec leur skill-rôle, les
**skills** de façonnage / betting / design / building, et un contrat **`SHAPEUP.md`** (équivalent du
`CLAUDE.md` iakaframe : conventions d'équipe, cadence 6 + 2, appétit, artefacts pitchs/bets/scopes,
circuit breaker, pas de backlog). La **génération automatique** depuis le binding est **[différée]** —
au MVP, le kit est rangé tel quel, comme le fait iakaframe pour ses kits runner.

> Le kit **n'émet aucun hook d'identité/périmètre** au sens iakaframe : les garde-fous Shape Up
> (`circuit-breaker`, `appetite-respected`, `no-scope-creep`, `no-backlog-accumulation`) sont des
> **disciplines de gouvernance et de build**, pas des *hooks* runtime — un outil peut au mieux les
> **rendre visibles** (un minuteur de cycle, une alerte de scope qui gonfle, un refus de recréer un
> dossier `backlog/`), jamais les **forcer**. C'est une différence structurelle assumée : Shape Up
> déplace le contrôle vers les **frontières** (façonner, parier, laisser tomber à l'échéance) plutôt
> que vers des *hooks* d'exécution en continu — à l'inverse d'iakaframe, frame à décideur surplombant
> outillé par hooks, et de manière analogue à frame-scrum (gouvernance non forçable par la machine).
