---
id: scrum-claude
methodId: scrum
teamId: scrum-team
bindingId: scrum-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", "SCRUM.md"]
---
# Kit scrum-claude

Manifeste du livrable généré pour le runner **claude** : assemble `method: scrum` + `team:
scrum-team` + `binding: scrum-default` en un kit installable. Le narratif de référence est le
*Scrum Guide 2020*.

Émet les **trois subagents** (Carter / Gregan / Meads) avec leur skill-rôle, les **skills** de
facilitation/backlog/livraison, et un contrat **`SCRUM.md`** (équivalent du `CLAUDE.md` iakaframe :
conventions d'équipe, artefacts, Definition of Done, cadence de Sprint). La **génération automatique**
depuis le binding est **[différée]** — au MVP, le kit est rangé tel quel, comme le fait iakaframe pour
ses kits runner.

> Le kit **n'émet aucun hook d'identité/périmètre** au sens iakaframe : les garde-fous Scrum
> (`time-box`, `scrum-scope-integrity`, `definition-of-done`, `scrum-self-management`) sont des
> **disciplines de facilitation humaine**, pas des *hooks* runtime — un outil peut au mieux les
> rendre visibles, jamais les forcer. C'est une différence structurelle assumée entre un frame à
> gouvernance auto-organisée (Scrum) et un frame à gouvernance surplombante outillée par hooks
> (iakaframe).
