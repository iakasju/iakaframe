---
id: scrum-default
methodId: scrum
teamId: scrum-team
node: claude
origin: forge-scrum
assignments:
  - { personaId: carter, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit, WebSearch, WebFetch] }
  - { personaId: gregan, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write] }
  - { personaId: meads,  runner: claude-code, model: "sonnet", tools: [Read, Edit, Write, Bash, Grep, Glob] }
---
# Binding Scrum — défaut Claude Code

Appariement **méthode ↔ team** + **triplet `{runner, model, tools}` par persona** — le SEUL endroit
où vivent `runner`, `model` et `tools` (les personas de `library/personas/` restent pures :
casting sans runner ni model).

`tools` = **allowlist runner-scoped** (noms d'outils built-in Claude Code), au principe du
**moindre privilège**, alignée sur le périmètre de chaque comptabilité :
- **Carter (Product Owner)** — écrit/ordonne le Product Backlog (`Write`/`Edit`) et recherche la
  valeur marché (`WebSearch`/`WebFetch`) ; **pas de `Bash`** (il ne construit pas).
- **Gregan (Scrum Master)** — facilite et trace impediments/notes (`Write`) ; **ni `Bash` ni `Edit`
  de code** : il ne construit pas et ne priorise pas, il sert.
- **Meads (Developers)** — construit l'Increment : `Edit`/`Write`/`Bash` (build, tests), lecture
  large. N instances possibles en parallèle sur le même Sprint Backlog.

Modèles : `opus` pour les comptabilités à forte charge de jugement (valeur, coaching), `sonnet` pour
l'exécution de construction — **défaut suggéré**, surchargeable. Runner unique : **claude-code**.
