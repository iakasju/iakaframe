---
id: gtd-claude
methodId: gtd
teamId: gtd-solo
bindingId: gtd-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", "GTD.md"]
---
# Kit gtd-claude

Manifeste du livrable généré pour le runner **claude** : assemble `method: gtd` + `team: gtd-solo` +
`binding: gtd-default` en un kit installable. Le narratif de référence est *Getting Things Done*
(David Allen).

Émet **un seul subagent** — **Lee** (le praticien) — avec ses **trois skill-rôles**
(`gtd-capture-and-clarify`, `gtd-organize-and-review`, `gtd-engage`), et un contrat **`GTD.md`**
(équivalent du `CLAUDE.md` iakaframe : les cinq étapes, les principes, les garde-fous d'auto-
discipline, la cadence de **revue hebdomadaire** et la structure du système de listes). La
**génération automatique** depuis le binding est **[différée]** — au MVP, le kit est rangé tel quel,
comme le fait iakaframe pour ses kits runner.

> **Un seul agent émis, pas une compagnie.** Là où le kit iakaframe émet **sept** subagents et Scrum
> **trois**, gtd-claude n'en émet **qu'un** : GTD est **mono-acteur**. Les cinq **modes** ne
> deviennent **pas** cinq subagents — ce serait fabriquer une fausse équipe et fragmenter un flux
> qui doit rester d'**un seul tenant** dans une **seule** tête. Ils sont rendus comme **sections du
> contrat `GTD.md`** et comme **skills** que l'agent unique charge selon le mode actif.
>
> Le kit **n'émet aucun hook d'identité/périmètre** au sens iakaframe : les garde-fous GTD
> (`inbox-zero`, `next-action-defined`, `no-unclarified-stuff`, `trusted-system`) sont des
> **disciplines personnelles**, pas des *hooks* runtime — un outil peut au mieux les **rendre
> visibles** (compter l'inbox, lister les projets sans next action), jamais les forcer. Et un hook de
> **périmètre inter-agents** n'a **aucun objet** quand il n'y a **qu'un agent** : rien à cloisonner.
> C'est une différence structurelle assumée entre un frame **mono-acteur à auto-discipline** (GTD) et
> un frame **multi-agents à périmètres étanches outillés par hooks** (iakaframe).
