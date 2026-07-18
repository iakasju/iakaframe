# Backlog — iakaframe

Items de backlog du projet (tenus au fil de l'eau ; convertis en instruction cadrée avant tout dev).

## Ouverts

- [ ] **Travailler la structure API & commandes du CLI** — revoir la surface de commandes de `@naonedge/iakaframe` (cohérence des verbes, des flags, des sorties `--json`) et la structure interne (`cli/src/commands/` ↔ `cli/src/lib/`). Objectif : une API CLI régulière et prévisible. *(ex. relevés : `portfolio --json` renvoie un objet-enveloppe alors que `list --json` renvoie un tableau nu — harmoniser.)*
- [ ] **Nettoyer un chemin machine en dur** — `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` porte `/Users/sjupin/...` en commentaire (≈ L186/190). À généraliser (aucun chemin perso dans un kit source). *(repéré au gate réconciliation kit↔frame.)*
