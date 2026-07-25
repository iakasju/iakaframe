---
id: waterfall-claude
methodId: waterfall
teamId: waterfall-team
bindingId: waterfall-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", "WATERFALL.md"]
---
# Kit waterfall-claude

Manifeste du livrable généré pour le runner **claude** : assemble `method: waterfall` + `team:
waterfall-team` + `binding: waterfall-default` en un kit installable. Le narratif de référence est le
modèle en cascade.

Émet les **cinq subagents** (Crowe / Caquot / Savage / Eiffel / Rankine) avec leur skill-rôle, les
**skills** de gouvernance de phase / ingénierie des exigences / conception / construction /
vérification, et un contrat **`WATERFALL.md`** (équivalent du `CLAUDE.md` iakaframe : plan de phases,
critères d'entrée/sortie de gate, baselines, matrice de traçabilité, processus de change control). La
**génération automatique** depuis le binding est **[différée]** — au MVP, le kit est rangé tel quel,
comme le fait iakaframe pour ses kits runner.

> **Ce que le kit PEUT outiller — et pourquoi Waterfall va plus loin que Scrum ici.** Le frame Scrum
> notait que ses garde-fous (`timebox`, `definition-of-done`…) sont des **disciplines humaines** non
> forçables par un *hook*. Waterfall est **différent** : ses garde-fous portent sur des **baselines
> documentaires opposables** (SRS/SDD gelés, matrice de traçabilité), donc **matérialisables** par
> l'outil. Un kit avancé pourrait émettre des **hooks à la manière d'iakaframe** : une garde
> `no-code-before-design` (bloquer Write/Edit sur `src/` tant que le SDD n'est pas marqué baseliné —
> analogue au `perimeter-guard`), un contrôle `no-phase-skip` (vérifier la signature du gate amont),
> un calcul de complétude de la **matrice de traçabilité**. Waterfall se **rapproche** donc d'un
> frame à gouvernance outillée par hooks — bien plus qu'un cadre auto-organisé. Au MVP, ces hooks
> restent **[différés]** ; la comptabilité de gate demeure portée par Crowe (Project Manager).
