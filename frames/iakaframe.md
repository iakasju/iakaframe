---
id: iakaframe
name: Frame iakaframe
version: v0.20.0
methodId: iakaframe
teamId: iakaframe-8
default: true
---
# Frame iakaframe (le default du réservoir)

Descripteur de la **frame default** du réservoir iakaframe (AR-1 : objet de 1ʳᵉ classe, type
`frames`). Une frame est un **assemblage nommé** = un tuple d'ids (`methodId` + `teamId`) qui
**pioche dans la library partagée** ; elle n'a **pas** sa propre copie de briques (I1/E2 : ids
seulement, aucun corps recopié, aucune persona nommée ici).

`default: true` désigne la frame héritée par les nouveaux projets et le repli de tout pointeur
absent (invariant « repli toujours défini »). Le default **reste monté à la racine** (D-B) :
`methods/iakaframe.md`, `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md` ne bougent
pas — la frame est **logique**, pas un dossier.

`version` (AR-3) est la **source unique** du `frameVersion` gravé dans `<projet>/.iakaframe` : une
divergence signale un projet à re-synchroniser. Cf. `specs/instructions/reservoir-de-frames.md`.
