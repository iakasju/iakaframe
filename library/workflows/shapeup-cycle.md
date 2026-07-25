---
id: shapeup-cycle
name: Shape Up — cycle façonner → parier → construire → refroidir (fixed time, variable scope)
kind: cycle-with-betting-gate
container: six-week-cycle
phases:
  - { id: shaping,    label: "Shaping (façonnage, hors calendrier)", ritual: shapeup-shaping, actorsRoleKeys: [shapeup-shaper], input: "raw ideas / problèmes bruts", output: "pitch façonnée (problème + appétit + solution esquissée + rabbit holes + no-gos)" }
  - { id: betting,    label: "Betting Table (GATE d'engagement)", ritual: shapeup-betting-table, actorsRoleKeys: [shapeup-betting-table], input: "pitchs façonnées disponibles", output: "paris placés (quoi + appétit + équipe) pour le prochain cycle" }
  - { id: kickoff,    label: "Kickoff (passage de relais)", ritual: shapeup-kickoff, actorsRoleKeys: [shapeup-betting-table, shapeup-designer, shapeup-programmer], input: "pitch pariée", output: "responsabilité pleine remise à l'équipe autonome" }
  - { id: build,      label: "Build (6 semaines, autonomie totale)", ritual: shapeup-six-week-cycle, actorsRoleKeys: [shapeup-designer, shapeup-programmer], input: "pitch pariée + appétit", output: "scopes expédiés (ship) OU projet retombé (circuit breaker)" }
  - { id: cool-down,  label: "Cool-down (2 semaines)", ritual: shapeup-cool-down, actorsRoleKeys: [shapeup-designer, shapeup-programmer, shapeup-shaper, shapeup-betting-table], input: "cycle écoulé", output: "bugs corrigés, explorations, pitchs façonnées et paris préparés pour le cycle suivant" }
tracking: [hill-chart-check, scope-hammering]
loop: "après le cool-down, la Betting Table place de nouveaux paris et un nouveau cycle démarre (rythme 6 + 2)"
---
# Workflow Shape Up — façonner → parier → construire → refroidir

Le narratif de référence est le livre *Shape Up* (Ryan Singer, Basecamp, 2019). Shape Up n'est **ni**
un pipeline à gates hiérarchiques successifs (comme iakaframe) **ni** un cycle plat sans gate (comme
Scrum) : c'est un **cycle avec UN gate d'engagement à la frontière**. La gouvernance y est
**bicéphale** : **pari fort au sommet** (la Betting Table décide, seul vrai go/no-go) et **autonomie
totale en bas** (l'équipe de build n'a **aucun gate hiérarchique** pendant le cycle).

## Les phases
1. **Shaping** — hors calendrier, à huis clos, par des seniors (le Shaper). Produit des **pitchs**.
   N'engage rien : le shaping du cycle *n+1* tourne en parallèle du build du cycle *n*.
2. **Betting Table** — **le gate**. En cool-down, les dirigeants **parient** sur des pitchs façonnées.
   C'est la seule autorisation descendante du frame — et elle est **entre** les cycles, pas dedans.
3. **Kickoff** — passage de relais : la pitch pariée est remise à l'équipe, qui reçoit la
   **responsabilité pleine du comment**. Les dirigeants se retirent.
4. **Build** — **6 semaines fixes, autonomie totale**. L'équipe s'organise par **scopes**, **intègre
   une tranche de bout en bout tôt**, se repère au **hill chart**, **martèle le périmètre**. À
   l'échéance : ship, ou **circuit breaker** (retombe, pas d'extension automatique).
5. **Cool-down** — **2 semaines** sans travail programmé : respirer, corriger, explorer ; et mûrir le
   façonnage + les paris du cycle suivant.

## Suivi (pas des gates)
`hill-chart-check` et `scope-hammering` **ne sont pas des gates** : ce sont des **pratiques continues**
de l'équipe autonome. Le hill chart **montre** l'avancement (position sur la colline), il ne
**l'autorise** pas ; le scope hammering **taille** le périmètre pour tenir l'appétit.

## Ce qui remplace les gates internes : le temps
> Différence de gouvernance essentielle. Dans un pipeline à décideur surplombant, chaque étape franchit
> un **verrou humain**. Ici, une fois le **pari** placé, il n'y a **plus aucun verrou** jusqu'au ship :
> ce qui **borne** l'équipe autonome, ce n'est pas un chef qui surveille, c'est le **temps fixe**
> défendu par le **circuit breaker**. Le contrôle est déplacé du **milieu** (management d'exécution)
> vers les **frontières** (bien façonner en amont, bien parier au seuil, laisser tomber à l'échéance).
> À la fin du cool-down, de nouveaux paris relancent un cycle — le rythme **6 + 2** ne s'arrête pas.
