---
id: kanban-claude
methodId: kanban
teamId: kanban-team
bindingId: kanban-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", "KANBAN.md"]
---
# Kit kanban-claude

Manifeste du livrable généré pour le runner **claude** : assemble `method: kanban` + `team:
kanban-team` + `binding: kanban-default` en un kit installable. Le narratif de référence est la
*Kanban Method* (David J. Anderson).

Émet les **trois subagents** (Ohno / Toyoda / Shingo) avec leurs skills-rôle, les **skills** de
gestion de flux / animation de standup / façonnage de la demande / pull-and-improve, et un contrat
**`KANBAN.md`** (équivalent du `CLAUDE.md` iakaframe : conventions d'équipe, **tableau**, **limites
de WIP**, **politiques explicites**, **classes de service**, **cadences**). La **génération
automatique** depuis le binding est **[différée]** — au MVP, le kit est rangé tel quel, comme le fait
iakaframe pour ses kits runner.

> Le kit **n'émet aucun hook d'identité/périmètre** au sens iakaframe : les garde-fous Kanban
> (`wip-limit`, `pull-not-push`, `policies-on-the-board`) sont des **disciplines visuelles et
> collectives** — elles vivent **sur le tableau** et dans la culture d'équipe, pas dans des *hooks*
> runtime du runner. Un outil de tableau peut au mieux les **rendre visibles et coûteuses à
> transgresser** (coiffer une colonne d'un nombre, colorer un dépassement de WIP, bloquer un tirage
> illégal dans l'UI), **jamais les forcer** au niveau machine. C'est la même différence structurelle
> qu'avec le frame Scrum : un frame à gouvernance **dans le flux** (Kanban) outillé par
> **visualisation**, face à un frame à gouvernance **surplombante** (iakaframe) outillé par **hooks**.
