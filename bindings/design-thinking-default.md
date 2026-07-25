---
id: design-thinking-default
methodId: design-thinking
teamId: design-thinking-team
node: claude
origin: forge-designthinking
assignments:
  - { personaId: kelley, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write] }
  - { personaId: suri,   runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, WebSearch, WebFetch] }
  - { personaId: brown,  runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit, WebSearch, WebFetch] }
  - { personaId: faste,  runner: claude-code, model: "sonnet", tools: [Read, Write, Edit, Bash, Grep, Glob] }
  - { personaId: norman, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, WebSearch, WebFetch] }
---
# Binding Design Thinking — défaut Claude Code

Appariement **méthode ↔ team** + **triplet `{runner, model, tools}` par persona** — le SEUL endroit
où vivent `runner`, `model` et `tools` (les personas de `library/personas/` restent pures :
casting sans runner ni model).

`tools` = **allowlist runner-scoped** (noms d'outils built-in Claude Code), au principe du **moindre
privilège**, alignée sur le **domaine de contribution** de chaque persona :

- **Kelley (Facilitateur)** — conçoit et trace les ateliers, notes, plans de séance (`Write`) ;
  **ni `Bash` ni `Edit` de code ni web** : il ne construit pas, ne recherche pas le terrain, ne
  décide pas — il **facilite**.
- **Suri (Chercheuse Design)** — mène la recherche : lit large, **écrit** ses restitutions
  (verbatims, cartes d'empathie, personas), et explore le web (`WebSearch`/`WebFetch`) pour la
  recherche secondaire ; **pas de `Bash`** (elle ne fabrique pas).
- **Brown (Idéateur)** — synthétise et idée : `Write`/`Edit` (POV, « How Might We », concepts),
  `WebSearch`/`WebFetch` (analogies, inspiration) ; **pas de `Bash`** (il ne fabrique pas le
  prototype).
- **Faste (Prototypeur)** — le **seul qui fabrique** : `Edit`/`Write`/`Bash` pour matérialiser des
  prototypes (maquettes, scripts d'écran cliquable, storyboards générés), lecture large. N prototypes
  en parallèle possibles.
- **Norman (Voix de l'Utilisateur)** — organise les tests et porte la preuve : lit large, **écrit**
  plans de test et synthèses de feedback, explore le web (recrutement/benchmark) ; **pas de `Bash`**
  (il ne fabrique pas).

Modèles : `opus` pour les domaines à forte charge de **jugement** (facilitation, empathie, idéation,
lecture des preuves), `sonnet` pour l'**exécution fabricante** du prototypage — **défaut suggéré**,
surchargeable. Runner unique : **claude-code**.
