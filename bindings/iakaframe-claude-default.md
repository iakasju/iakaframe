---
id: iakaframe-claude-default
methodId: iakaframe
teamId: iakaframe-8
assignments:
  - { personaId: odin,     runner: claude-code, model: "opus" }
  - { personaId: aragorn,  runner: claude-code, model: "opus" }
  - { personaId: gandalf,  runner: claude-code, model: "opus" }
  - { personaId: gimli,    runner: claude-code, model: "sonnet" }
  - { personaId: legolas,  runner: claude-code, model: "sonnet" }
  - { personaId: helm,     runner: claude-code, model: "sonnet" }
  - { personaId: loki,     runner: claude-code, model: "sonnet" }
  - { personaId: nathalie, runner: claude-code, model: "sonnet" }
---
# Binding iakaframe — défaut Claude Code

Appariement **méthode ↔ team** + **runner+modèle par persona** (I3 : le SEUL endroit où vivent
`runner` et `model` ; les personas de `library/personas/` restent pures). Binding **défaut** au
MVP (Q-4 : un seul binding, `claude`) ; les autres runners restent des kits rangés dans `kits/`.

Runner : **claude-code** pour toutes les personas. Les modèles (opus pour
portefeuille/coordination/cadrage, sonnet pour dev/qualité/prod/design/doc) sont un **défaut
suggéré**, surchargeable au cockpit. Source d'inspiration des affectations : `kits/*/MODELES.md`.
