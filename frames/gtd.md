---
id: gtd
name: Frame GTD (Getting Things Done)
version: v0.1.0
methodId: gtd
teamId: gtd-solo
default: false
---
# Frame GTD (frame tierce du réservoir — mono-acteur)

Descripteur d'une **frame tierce** rangée dans le réservoir iakaframe (AR-1 : objet de 1ʳᵉ classe,
type `frames`). Une frame est un **assemblage nommé** = un tuple d'ids (`methodId` + `teamId`) qui
**pioche dans la library partagée** ; elle n'a **pas** sa propre copie de briques (I1/E2 : ids
seulement, aucun corps recopié, aucune persona nommée ici).

`default: false` : GTD est une frame **disponible à côté** du default. Le default du réservoir reste
`iakaframe` (`methods/iakaframe.md`, `teams/iakaframe-8.md`,
`bindings/iakaframe-claude-default.md`) — **byte-inchangé** par ce rangement.

**GTD est la frame SOLO (N = 1)** : une team de **cardinalité 1** (`gtd-solo`, persona unique Lee) qui
**stress-teste** le présupposé d'équipe du modèle. Elle lint proprement (exit 0), mais fait
**dégénérer** honnêtement plusieurs champs (coordinateur sans coordonnés, périmètres sans frontière) —
le **biais de cardinalité d'équipe** documenté comme dette déclarée.

`version` (AR-3) est la source du `frameVersion` gravé dans `<projet>/.iakaframe` si un projet
bascule sur GTD. Cf. `specs/instructions/reservoir-de-frames.md` et
`specs/instructions/rangement-catalogue-frames-reservoir.md`.
