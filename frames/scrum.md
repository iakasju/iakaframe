---
id: scrum
name: Frame Scrum
version: v0.1.0
methodId: scrum
teamId: scrum-team
default: false
---
# Frame Scrum (frame tierce du réservoir)

Descripteur d'une **frame tierce** rangée dans le réservoir iakaframe (AR-1 : objet de 1ʳᵉ classe,
type `frames`). Une frame est un **assemblage nommé** = un tuple d'ids (`methodId` + `teamId`) qui
**pioche dans la library partagée** ; elle n'a **pas** sa propre copie de briques (I1/E2 : ids
seulement, aucun corps recopié, aucune persona nommée ici).

`default: false` : Scrum est une frame **disponible à côté** du default. Le default du réservoir reste
`iakaframe` (`methods/iakaframe.md`, `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md`) —
**byte-inchangé** par ce rangement. Scrum exprime la **même grammaire** au service d'une **gouvernance
auto-organisée** (opposée au décideur surplombant d'iakaframe).

`version` (AR-3) est la source du `frameVersion` gravé dans `<projet>/.iakaframe` si un projet bascule
sur Scrum. Cf. `specs/instructions/reservoir-de-frames.md` et
`specs/instructions/rangement-catalogue-frames-reservoir.md`.
