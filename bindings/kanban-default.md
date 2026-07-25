---
id: kanban-default
methodId: kanban
teamId: kanban-team
node: claude
origin: forge-kanban
assignments:
  - { personaId: ohno,   runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write] }
  - { personaId: toyoda, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, WebSearch, WebFetch] }
  - { personaId: shingo, runner: claude-code, model: "sonnet", tools: [Read, Edit, Write, Bash, Grep, Glob] }
---
# Binding Kanban — défaut Claude Code

Appariement **méthode ↔ team** + **triplet `{runner, model, tools}` par persona** — le SEUL endroit
où vivent `runner`, `model` et `tools` (les personas de `library/personas/` restent pures : casting
sans runner ni model).

`tools` = **allowlist runner-scoped** (noms d'outils built-in Claude Code), au principe du **moindre
privilège**, alignée sur le périmètre **léger** de chaque responsabilité Kanban :
- **Ohno (Flow Manager)** — visualise, met à jour le tableau, les politiques et les métriques
  (`Write`), lit large (`Read`/`Grep`/`Glob`) ; **pas de `Bash` ni d'`Edit` de code** : il **gère le
  flux**, il ne construit pas.
- **Toyoda (Service Request Manager)** — ordonne les options et écrit l'amont (`Write`), et
  **recherche la valeur/le besoin marché** (`WebSearch`/`WebFetch`) ; **pas de `Bash`** : il façonne
  la demande, il ne construit pas.
- **Shingo (Contributor)** — **tire et construit** : `Edit`/`Write`/`Bash` (build, tests), lecture
  large. **N instances** possibles en parallèle sur le **même tableau**, chacune tirant dans la
  limite de WIP.

Modèles : `opus` pour les responsabilités à forte charge de jugement (gestion de flux, façonnage de
la demande), `sonnet` pour l'exécution de construction — **défaut suggéré**, surchargeable. Runner
unique : **claude-code**.
