---
id: waterfall-default
methodId: waterfall
teamId: waterfall-team
node: claude
origin: forge-waterfall
assignments:
  - { personaId: crowe,   runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write] }
  - { personaId: caquot,  runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit, WebSearch, WebFetch] }
  - { personaId: savage,  runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit] }
  - { personaId: eiffel,  runner: claude-code, model: "sonnet", tools: [Read, Edit, Write, Bash, Grep, Glob] }
  - { personaId: rankine, runner: claude-code, model: "sonnet", tools: [Read, Grep, Glob, Bash, Write] }
---
# Binding Waterfall — défaut Claude Code

Appariement **méthode ↔ team** + **triplet `{runner, model, tools}` par persona** — le SEUL endroit
où vivent `runner`, `model` et `tools` (les personas de `library/personas/` restent pures : casting
sans runner ni model).

`tools` = **allowlist runner-scoped** (noms d'outils built-in Claude Code), au principe du **moindre
privilège**, alignée sur le périmètre de chaque comptabilité de phase :
- **Crowe (Project Manager)** — planifie, préside les gates, signe et tient les baselines
  (`Write` : plan, journal des gates, décisions) ; **pas de `Bash` ni d'`Edit` de code** : il
  gouverne, il ne produit aucun livrable technique.
- **Caquot (Business Analyst)** — rédige le SRS (`Write`/`Edit`) et recherche l'état de l'art / le
  contexte métier (`WebSearch`/`WebFetch`) ; **pas de `Bash`** : il spécifie, il ne construit pas.
- **Savage (Architect)** — rédige le SDD (`Write`/`Edit`) ; **pas de `Bash`** : il conçoit sur le
  papier, il ne code pas (`no-code-before-design`).
- **Eiffel (Developer)** — construit selon le SDD : `Edit`/`Write`/`Bash` (build, tests unitaires),
  lecture large. N instances possibles en parallèle sur des parts distinctes du SDD.
- **Rankine (QA/Tester)** — dérive et exécute les tests (`Bash`), consigne rapport et matrice
  (`Write`) ; **pas d'`Edit` de code** : il atteste, il ne corrige pas.

Modèles : `opus` pour les comptabilités à forte charge de jugement (gouvernance de gate, exigences,
conception), `sonnet` pour l'exécution de construction et de test — **défaut suggéré**, surchargeable.
Runner unique : **claude-code**.
