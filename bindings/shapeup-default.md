---
id: shapeup-default
methodId: shapeup
teamId: shapeup-team
node: claude
origin: forge-shapeup
assignments:
  - { personaId: whymper, runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit, WebSearch, WebFetch] }
  - { personaId: herzog,  runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write] }
  - { personaId: messner, runner: claude-code, model: "opus",   tools: [Read, Edit, Write, Grep, Glob, Bash] }
  - { personaId: hillary, runner: claude-code, model: "sonnet", tools: [Read, Edit, Write, Bash, Grep, Glob] }
---
# Binding Shape Up — défaut Claude Code

Appariement **méthode ↔ team** + **triplet `{runner, model, tools}` par persona** — le SEUL endroit où
vivent `runner`, `model` et `tools` (les personas de `library/personas/` restent pures : casting sans
runner ni model).

`tools` = **allowlist runner-scoped** (noms d'outils built-in Claude Code), au principe du **moindre
privilège**, alignée sur le périmètre de chaque comptabilité :
- **Whymper (Shaper)** — façonne : recherche (`WebSearch`/`WebFetch`), écrit des pitchs
  (`Write`/`Edit`) ; **pas de `Bash`** (il ne construit pas).
- **Herzog (Betting Table)** — parie : lit les pitchs, écrit les décisions de pari (`Write`) ; **ni
  `Bash` ni `Edit` de code** (il ne construit ni ne façonne). N instances possibles (la table est un
  groupe).
- **Messner (Designer)** — construit la forme : `Edit`/`Write`/`Bash` (lancer l'app, itérer),
  lecture large.
- **Hillary (Programmer)** — construit ce qui expédie : `Edit`/`Write`/`Bash` (build, tests), lecture
  large. Une ou deux instances en parallèle sur le **même** cycle, intégrées à Messner.

Modèles — **défaut suggéré, surchargeable** : `opus` pour les comptabilités à **fort jugement**, et
Shape Up en met **partout** : le shaping (Whymper) et le betting (Herzog) sont les décisions les plus
lourdes ; côté build, Shape Up s'appuie sur des **seniors** — le Designer (Messner) porte le
**scope hammering**, arbitrage de périmètre à fort jugement, d'où `opus`. Seule l'**exécution
technique pure** (Hillary, Programmer) descend à `sonnet`. Runner unique : **claude-code**.

> **Nuance vs frame-scrum.** Là où le binding Scrum met **tout le build à `sonnet`** (exécution), Shape
> Up **remonte le jugement dans l'équipe de build** : le Designer garde `opus` car c'est lui qui
> **taille le périmètre** (décision, pas exécution). C'est une conséquence directe de l'autonomie
> Shape Up — l'équipe de build décide **beaucoup** (scopes, coupes, comment), donc le modèle suit le
> jugement, pas la couche technique.
