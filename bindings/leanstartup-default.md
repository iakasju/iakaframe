---
id: leanstartup-default
methodId: lean-startup
teamId: leanstartup-team
node: claude
origin: forge-leanstartup
assignments:
  - { personaId: edison, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit, WebSearch, WebFetch] }
  - { personaId: leanstartup-ohno,   runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, WebSearch, WebFetch] }
  - { personaId: leanstartup-shingo, runner: claude-code, model: "sonnet", tools: [Read, Edit, Write, Bash, Grep, Glob] }
  - { personaId: deming, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Bash, Write] }
---
# Binding Lean Startup — défaut Claude Code

Appariement **méthode ↔ team** + **triplet `{runner, model, tools}` par persona** — le SEUL endroit
où vivent `runner`, `model` et `tools` (les personas de `library/personas/` restent pures :
casting sans runner ni model).

`tools` = **allowlist runner-scoped** (noms d'outils built-in Claude Code), au principe du
**moindre privilège**, alignée sur le périmètre de chaque comptabilité :
- **Edison (Entrepreneur)** — cadre la vision et la comptabilité de l'innovation (`Write`/`Edit`) et
  scrute l'état de l'art / le marché (`WebSearch`/`WebFetch`) ; **pas de `Bash`** (il ne construit pas).
- **Ohno (Développeur de clientèle)** — conçoit les expériences, va « voir » (recherche marché
  `WebSearch`/`WebFetch`) et écrit l'apprentissage validé (`Write`) ; **ni `Bash` ni `Edit` de code**
  (il ne construit pas).
- **Shingo (Constructeur)** — construit le MVP instrumenté : `Edit`/`Write`/`Bash` (build, tests,
  instrumentation), lecture large. **N instances** possibles en parallèle sur le même appareil
  d'expérimentation.
- **Deming (Voix du client)** — lit et analyse les données réelles (`Read`/`Grep`/`Bash` pour
  interroger métriques et logs), écrit le verdict (`Write`) ; **pas d'`Edit` de code** (il ne
  construit pas) ni de web (la donnée vient de l'instrumentation interne).

Modèles : `opus` pour les comptabilités à forte charge de **jugement** (cadrer les hypothèses,
interpréter le réel, juger l'actionnabilité des métriques), `sonnet` pour l'**exécution de
construction** (Shingo) — **défaut suggéré**, surchargeable. Runner unique : **claude-code**.
