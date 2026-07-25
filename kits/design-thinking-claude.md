---
id: design-thinking-claude
methodId: design-thinking
teamId: design-thinking-team
bindingId: design-thinking-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", "DESIGN-THINKING.md"]
---
# Kit design-thinking-claude

Manifeste du livrable généré pour le runner **claude** : assemble `method: design-thinking` + `team:
design-thinking-team` + `binding: design-thinking-default` en un kit installable. Le narratif de
référence est la tradition d.school / IDEO et le Double Diamond.

Émet les **cinq subagents** (Kelley / Suri / Brown / Faste / Norman) avec leur skill-rôle
(`dt-facilitation`, `dt-user-research`, `dt-ideation`, `dt-prototyping`, `dt-testing`), les **skills**
correspondantes, et un contrat **`DESIGN-THINKING.md`** (équivalent du `CLAUDE.md` iakaframe :
conventions d'équipe, phases du Double Diamond, rythme divergence/convergence, artefacts du défi,
garde-fous). La **génération automatique** depuis le binding est **[différée]** — au MVP, le kit est
rangé tel quel, comme le fait iakaframe pour ses kits runner.

> Le kit **n'émet aucun hook d'identité/périmètre** au sens iakaframe. Les garde-fous Design Thinking
> (`protect-divergence`, `problem-before-solution`, `prototype-before-invest`, `evidence-from-users`)
> sont des **disciplines de facilitation humaine**, pas des *hooks* runtime — un outil peut au mieux
> les **rendre visibles** (« ici on diverge / ici on converge », « où sont les preuves ? »), jamais
> les forcer. C'est cohérent avec la nature **non-logicielle** de la méthode : l'objet du travail
> (comprendre un humain, poser le bon problème, apprendre par prototype) échappe par construction à
> un contrôle machine. Différence structurelle assumée entre un frame à gouvernance auto-organisée /
> non-logicielle (Design Thinking) et un frame à gouvernance surplombante outillée par hooks
> (iakaframe).
