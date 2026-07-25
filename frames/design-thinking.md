---
id: design-thinking
name: Frame Design Thinking
version: v0.1.0
methodId: design-thinking
teamId: design-thinking-team
default: false
---
# Frame Design Thinking (frame tierce du réservoir)

Descripteur d'une **frame tierce** rangée dans le réservoir iakaframe (AR-1 : objet de 1ʳᵉ classe,
type `frames`). Une frame est un **assemblage nommé** = un tuple d'ids (`methodId` + `teamId`) qui
**pioche dans la library partagée** ; elle n'a **pas** sa propre copie de briques (I1/E2 : ids
seulement, aucun corps recopié, aucune persona nommée ici).

`default: false` : Design Thinking est une frame **disponible à côté** du default. Le default du
réservoir reste `iakaframe` (`methods/iakaframe.md`, `teams/iakaframe-8.md`,
`bindings/iakaframe-claude-default.md`) — **byte-inchangé** par ce rangement. Design Thinking
contraste par son **domaine** (innovation centrée-utilisateur, non-logicielle) et sa **logique**
(diverger/converger, itérer) avec le pipeline de production logicielle d'iakaframe.

C'est la frame qui **promeut le neutre `retrospective`** (généralisé depuis son `iteration-loop`),
désormais partageable par toutes les frames qui bouclent sur l'apprentissage.

`version` (AR-3) est la source du `frameVersion` gravé dans `<projet>/.iakaframe` si un projet
bascule sur Design Thinking. Cf. `specs/instructions/reservoir-de-frames.md` et
`specs/instructions/rangement-catalogue-frames-reservoir.md`.
