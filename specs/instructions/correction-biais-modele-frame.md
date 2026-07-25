---
feature: correction-biais-modele-frame
phase: P1 — cadrage
statut: 5 arbitrages TRANCHÉS (décideur 2026-07-26) — prêt pour gate Legolas puis P2 (Gimli)
auteur: Gandalf (rôle cadrage)
provenance: Aragorn, sur décision du décideur (BACKLOG.md § « Catalogue de frames forgé (7) + 3 biais »)
périmètre: Findings 1 (gouvernance) & 2 (cardinalité) — Findings 3 & 4 positionnés, non cadrés ici
cross-repo: probable (CLI iakaframe + cœur GUI iakaFrameGUI + fixtures vendorées)
---

# Instruction — Corriger les deux biais fondateurs du modèle de frame (Findings 1 & 2)

> **Bandeau de lecture.** Cette instruction **cadre** (P1). Elle ne code pas. Elle pose le problème
> avant la solution, mesure les biais **sur pièces**, recommande un modèle agnostique, ferme un
> périmètre et écrit des critères mesurables. Les **arbitrages décideur** (§ 7) ne sont **pas**
> tranchés : Gandalf propose, l'utilisateur tranche au gate P1→P2.

## 0. Origine & invariant surplombant

La démo Fëanor (v0.25.0) a forgé 7 gouvernances contrastées puis les a rangées dans le réservoir. Le
modèle **fonctionne** (251 fichiers, 0 id pendant, `frame lint --all` exit 0) mais **n'est pas
agnostique** : deux présupposés sont cimentés dans la grammaire. Ils sont documentés au
`BACKLOG.md` (item « Catalogue de frames forgé (7) + 3 biais »).

**Invariant non négociable (repris du rangement, AR-1/E2) — TENU par rétro-compat d'alias.** La
correction **ne casse ni** le default `iakaframe` **ni** les 8 frames déjà rangées. Point clé
**gravé** : **aucune des 8 frames rangées n'est à migrer** — elles portent **déjà** `kind` **et**
`actorsRoleKeys`. Cibles de non-régression **mesurables** : `frame lint --all` reste **exit 0**,
`vendor-check` reste **drift 0**, parité CLI↔GUI verrouillée par test. Le default reste
**byte-inchangé** à **une seule exception, actée par le décideur (A-2, 2026-07-26)** : le workflow
canon `library/workflows/iakaframe-3phases.md` gagne `kind: pipeline` + le renommage
`agentsRoleKeys`→`actorsRoleKeys`, **re-vendoré dans le lot**. Cette entorse est **assumée et
réparatrice** — elle rend le default honnête (nom d'acteurs neutre) et **ferme le trou du lint** du
§ 1.3.

---

## 1. Le problème (posé avant toute solution), mesuré sur pièces

### 1.1 Finding 1 — biais de gouvernance : le vocabulaire du workflow présuppose un pipeline à gates

Le format du pool `library/workflows/` — une liste `phases` (avec `input`/`output`) coiffée d'un bloc
`gates` — **encode une gouvernance**, pas une neutralité. La preuve tient **par les deux bouts**,
lisible dans les fichiers :

- **Waterfall remplit le format tel quel.** `library/workflows/waterfall-lifecycle.md` (frontmatter
  `phases:` + `gates:`) est **structurellement identique** au canon `iakaframe-3phases.md`. Sa propre
  prose l'admet (§ « Le format à `phases` + `gates` accueille Waterfall NATIVEMENT ») : « le format de
  frame **penche vers le pipeline à gates**, et Waterfall y entre plus facilement que les cadres
  itératifs ou cycliques ».
- **Les gouvernances non-pipeline doivent DÉTOURNER le format.** Pour dire « pas de porte
  hiérarchique », chaque frame a dû **inventer** des champs hors format :
  - `scrum-sprint.md` : `kind: cycle`, **pas de bloc `gates`**, `loop:`, `pillars:`.
  - `dt-double-diamond.md` : `kind: cycle`, `nonLinear: true`, `nature:` (divergent/convergent) par
    phase, `diamonds:`, `mindsets:`.
  - `shapeup-cycle.md` : `kind: cycle-with-betting-gate`, `loop:`, `tracking:` — un **seul** gate
    d'engagement, exprimé dans la prose faute de le pouvoir dans la grammaire.
  - `kanban-flow.md` : `kind: flow`, **`stages:` au lieu de `phases:`**, `wipLimited` par colonne,
    `pullPoints`/`commitmentPoint`/`deliveryPoint`, `metrics`/`cadences`/`practices`, `loop:`.
  - `gtd-flow.md` : `kind: flow`, `container: none`, `soleActor:`, `loop:`.

**Diagnostic.** Un modèle agnostique traiterait pipeline-à-gates, cycle, flux-tiré et
bet+autonomie comme des **cas de première classe**. Ici, un seul (le pipeline) est natif ; les autres
sont des **exceptions bricolées par imitation**. Le `gate` n'est pas une **propriété optionnelle** :
c'est le **présupposé par défaut** — son absence oblige à le déclarer par un champ inventé.

### 1.2 Finding 2 — biais de cardinalité : le format d'équipe présuppose N ≥ 2

Le format `team` présuppose **plusieurs acteurs coordonnés**. Trois porteurs, vérifiés sur pièces :

1. **Schéma dur.** `cli/src/lib/library.js` § « Validation de schema minimale » :
   `REQUIRED.team = ['id', 'personas', 'coordinator']` — le **coordinateur est OBLIGATOIRE**. Une
   team qui l'omet **échoue** `checkSchema`.
2. **Assemblage.** `cli/src/lib/library.js` fn `assemble` : le coordinateur sert de **repli** couvrant
   les rôles sans persona dédiée ; **sans coordinateur**, tout rôle non couvert devient un
   **orphelin bloquant**. La coordination est câblée comme une nécessité structurelle.
3. **Prose du modèle.** `teams/iakaframe-8.md` : `coordinator: aragorn` articule 9 personas à
   périmètres étanches.

**Dégénérescence à N = 1, sur pièces (`teams/gtd-solo.md`, `library/personas/lee.md`).** GTD est solo :
`personas: [lee]`, `coordinator: lee`. Or `lee.roleKey = gtd-practitioner` **couvre déjà** l'unique
`method.roleKeys` (`methods/gtd.md`) — la couverture ne passe **jamais** par le coordinateur. Le champ
`coordinator: lee` est rempli **par pure conformité de schéma** : coordinateur **et** unique exécutant
sont la même personne, « il n'y a personne à coordonner » (prose de `teams/gtd-solo.md`). Les
« périmètres étanches entre agents » n'ont **aucune frontière** à tracer. La méthode s'articule
**dans le temps** (revue hebdomadaire, auto-discipline), pas **dans l'espace** (répartition entre
pairs) — ce que le modèle ne sait pas exprimer.

### 1.3 Découverte annexe (sur pièces) — divergence de champ + vacuité partielle du lint

En inventoriant les workflows, un fait non listé au backlog apparaît et **doit être tranché avec 1** :

- Le canon nomme les acteurs d'une phase **`agentsRoleKeys`** (`iakaframe-3phases.md`). Les **8
  workflows forgés** nomment le même concept **`actorsRoleKeys`** (et Kanban range ses acteurs sous
  `stages[]`, pas `phases[]`). Le mot « **agents** » n'est pas neutre : il connote l'équipe
  multi-agent iakaframe. Les forges ont spontanément préféré « **actors** ».
- Conséquence mécanique **vérifiée** : `cli/src/lib/frame-lint.js` fn `workflowRoleKeys` ne lit **que**
  `phases[].agentsRoleKeys`. Donc les `actorsRoleKeys` des 8 workflows forgés (et les `stages` de
  Kanban) **ne sont jamais validés** — leurs refs de rôle **échappent au lint**. Le « `frame lint
  --all` exit 0 » des frames rangées est, pour cette dimension, **partiellement vide** : il passe
  faute de regarder.

Ce fait a deux effets sur le cadrage : (a) l'unification du nom de champ est **requise** pour que le
modèle agnostique ait **un seul** mot pour « qui agit » ; (b) elle est aussi un **correctif de
justesse du lint** — ce qui rejoint et **précède** Finding 3.

---

## 2. Recensement des champs-contournements à absorber (= la spec du modèle agnostique)

Les champs inventés par les forges **sont** la spécification de ce que le format neutre doit accueillir
nativement. Inventaire exhaustif (source : les 8 fichiers `library/workflows/*.md`) :

| Champ inventé | Workflow(s) | Sens | Statut recommandé dans le modèle agnostique |
|---|---|---|---|
| `kind` | scrum, waterfall, gtd, kanban, shapeup, dt | famille de gouvernance | **Première classe (enum requis)** — cf. § 3.1 |
| `actorsRoleKeys` (vs `agentsRoleKeys`) | tous les forgés (vs canon) | qui agit à cette étape | **Unifier** en un seul nom (arbitrage A-2) |
| `stages` (vs `phases`) | kanban | unités du flux (colonnes) | **Unifier** le nom du conteneur d'étapes (arbitrage A-1) |
| `gates` | canon, waterfall | portes de validation | **Optionnel** (absence = légitime, pas un détour) |
| `gate.kind: human\|auto` | canon, waterfall | nature de la porte | Optionnel, conservé tel quel |
| `loop` | scrum, kanban, shapeup, dt, gtd | récurrence / non-arrêt | **Première classe optionnel** (texte libre MVP) |
| `container` | scrum, kanban, gtd, shapeup, dt | conteneur temporel (Sprint, cycle 6s) | Optionnel |
| `nonLinear` | dt | le flux peut rouvrir une étape | Optionnel (booléen) |
| `nature` (par phase) | dt | divergent / convergent | Optionnel par étape |
| `soleActor` | gtd | **un seul acteur porte toutes les étapes** | **Charnière cardinalité** — lie § 3.2 |
| `noBackflow` | waterfall | pas de retour arrière | Optionnel (booléen/texte) |
| `wipLimited` (par stage) | kanban | colonne sous limite de WIP | Toléré (descriptif kind-flow) |
| `pullPoints`, `commitmentPoint`, `deliveryPoint` | kanban | frontières de tirage/livraison | Toléré (descriptif kind-flow) |
| `metrics`, `cadences`, `practices` | kanban | mesures & rituels du flux | Toléré (descriptif) |
| `pillars`, `mindsets` | scrum, dt | valeurs/postures du cadre | Toléré (descriptif) |
| `diamonds` | dt | regroupement d'étapes | Toléré (descriptif) |
| `tracking` | shapeup | pratiques de suivi (hill chart) | Toléré (descriptif) |
| `entry`/`exit` (vs `input`/`output`) | kanban (vs autres) | conditions d'entrée/sortie d'étape | **Unifier** ou tolérer (arbitrage A-1) |
| `ritual` (par étape) | tous les forgés | rituel attaché à l'étape | Optionnel par étape |
| `side: prod` | canon | étape hors-chaîne (prod) | Déjà au canon, conservé |

**Principe de tri (MVP).** On rend **première classe** le strict nécessaire pour que les 4 familles de
gouvernance cessent d'être des détours : `kind`, un **conteneur d'étapes unifié**, un **champ
d'acteurs unifié**, `gates` **optionnel**, `loop` **optionnel**, et la **charnière solo**. Tout le
reste (colonne « Toléré ») **demeure champ libre toléré** (régime permissif ARB-1 en vigueur) et
recevra un **foyer typé par `kind`** au Finding 3 — **pas ici** (§ 9). On ne sur-génialise pas.

---

## 3. Le modèle agnostique recommandé

### 3.1 Gouvernance — `kind` first-class, `gates` optionnels, boucles natives

Recommandation :

1. **`kind` devient un champ de première classe, requis, à valeurs énumérées.** MVP = les 4 familles
   effectivement forgées, plus le pipeline canon :
   - `pipeline` (étapes séquentielles + gates ; iakaframe, waterfall) ;
   - `cycle` (itération/boucle sans gate hiérarchique ; scrum, design-thinking) ;
   - `flow` (flux tiré continu, sans conteneur temporel ; kanban, gtd) ;
   - `cycle-with-gate` (cycle avec **un** gate d'engagement aux frontières ; shape up — normalise
     l'actuel `cycle-with-betting-gate`).
   L'énum est **ouverte à extension** mais **fermée à la validation** au Finding 3 (pas ici).
   La grounding de ces familles contre l'état de l'art (pipeline+gates / continuous flow / bounded
   autonomy) est confirmée — cf. § 10.

2. **`gates` devient une propriété OPTIONNELLE, jamais un présupposé.** Son absence est un état
   **légitime et premier** (un `cycle` ou un `flow` n'a pas de gate hiérarchique), pas une anomalie à
   déclarer par un champ inventé. Le canon `iakaframe-3phases` **garde** ses `gates` inchangés.

3. **Le conteneur d'étapes est unifié sous un seul nom** (✅ A-1 tranché : `phases` **conservé au
   canon** — 7 workflows sur 8 l'utilisent déjà — avec `stages` **toléré en alias** pour Kanban ;
   l'option `steps` est écartée). L'étape porte : un id, un label, l'acteur (§ ci-dessous), et —
   **selon `kind`** — des champs optionnels (`ritual`, `nature`, `wipLimited`, `input`/`output` ou
   `entry`/`exit`).

4. **Le champ d'acteurs est unifié** (✅ A-2 tranché : `actorsRoleKeys` **canonisé** comme nom neutre —
   adopté par 7 forges, « actors » ne connote pas l'équipe — avec **tolérance d'alias** de
   `agentsRoleKeys` pour la rétro-compat). Corollaire **inclus au lot** : `frame-lint.js` fn
   `workflowRoleKeys` **et** le cœur GUI (`parseWorkflowRefs`) lisent **le nom unifié** (et l'alias),
   refermant la vacuité du § 1.3 — c'est le **correctif de justesse du lint**, pas un travail séparé.

5. **`loop` est promu champ optionnel de première classe** (texte libre au MVP : décrit la récurrence
   sans la sur-structurer). Une structuration fine de la récurrence relève, si besoin, du Finding 3.

> **Ce que le modèle NE fait PAS (anti-sur-ingénierie).** Il ne modélise pas finement WIP, cadences,
> diamants, piliers : ceux-ci restent **champs libres tolérés** par `kind`, formalisés plus tard
> (Finding 3). Le but est que les **gouvernances déjà forgées soient exprimables sans détournement** —
> pas de couvrir des cas hypothétiques.

### 3.2 Cardinalité — `coordinator` optionnel, N = 1 légitime de première classe

Recommandation :

1. **Retirer `coordinator` des champs requis** : `REQUIRED.team = ['id', 'personas']`
   (`cli/src/lib/library.js`). `checkRefs('team')` **tolère déjà** un coordinateur absent (il ne le
   vérifie que s'il est présent) : la seule barrière est `checkSchema`. La levée est donc une
   **relaxation**, pas une réécriture.

2. **Assainir `assemble` pour N = 1 sans coordinateur.** Quand `personas.length === 1` et que
   l'unique persona **couvre** les `method.roleKeys` par sa `roleKey`, il **n'y a pas d'orphelin** —
   donc pas besoin d'un coordinateur-repli. Le seul travail : ne pas transformer l'absence de
   coordinateur en orphelin bloquant **quand la couverture est déjà assurée** par le casting. (Le
   cas « rôle non couvert **sans** coordinateur » reste un orphelin bloquant — garde conservée.)

3. **Charnière avec le workflow (`soleActor`).** Une team `flow`/solo peut porter `soleActor` côté
   workflow (déjà le cas `gtd-flow`) : c'est la marque explicite « **un** acteur, plusieurs
   **modes** ». Le modèle reconnaît alors N = 1 comme **cas de première classe** (auto-discipline dans
   le temps), pas comme une équipe dégénérée. **Recommandation MVP** : `coordinator` **simplement
   optionnel** (le plus petit changement), la marque solo restant portée par `soleActor` + `roleKey`
   `scope: mode` déjà en place. **✅ Tranché décideur (A-2026-07-26) : `coordinator` optionnel +
   `soleActor`** ; l'alternative d'un rôle « auto/solo » explicite est écartée.

4. **Non-régression.** Les teams N ≥ 2 (`iakaframe-8`, `scrum-team`…) **gardent** leur `coordinator` :
   le champ reste **accepté et sémantiquement porteur** quand il y a plusieurs acteurs. On rend
   l'**absence** légitime, on n'**interdit** pas la présence.

---

## 4. Invariant de non-régression : rétro-compatible, avec UNE migration bornée

Bilan par changement (dis lequel, comme demandé) :

| Changement | Nature | Migration ? | Impact default |
|---|---|---|---|
| `gates` optionnel | **Relaxation** | Aucune | Nul (le default garde ses gates) |
| `kind` first-class requis | Additif | **Ajouter `kind: pipeline`** à `iakaframe-3phases.md` (1 ligne) ; défaut `pipeline` si absent pour la rétro-compat des lecteurs | **1 fichier du default change** |
| `loop` optionnel | Additif | Aucune | Nul |
| `coordinator` optionnel | **Relaxation** | Aucune (les teams N≥2 gardent le champ) | Nul |
| **Unification du champ d'acteurs** (A-2) | **Migration** | Renommer `agentsRoleKeys`→`actorsRoleKeys` dans le canon **+ tolérer l'alias** en lecture (core + CLI) | **1 fichier du default change** (`iakaframe-3phases.md`) |

**Verdict recommandé : rétro-compatible par tolérance d'alias, avec deux touches d'un seul fichier du
default** (`iakaframe-3phases.md` : ajout de `kind: pipeline` + renommage du champ d'acteurs). Aucun
des 8 frames rangés n'a besoin d'être migré : ils portent **déjà** `kind` et `actorsRoleKeys`. Donc
« default byte-inchangé » est **presque** tenu — l'exception est **ce seul fichier canon**, et elle est
**assumée et bornée**. `vendor-check` drift 0 se retient en **re-vendorant** ce fichier (et le golden
qui en dépend) dans le même lot. Si le décideur refuse tout changement du default (arbitrage A-2 =
« garder `agentsRoleKeys »), on **conserve `agentsRoleKeys` comme nom canonique** et on tolère
`actorsRoleKeys` en alias : le default reste alors **strictement** byte-inchangé, au prix d'un nom
canonique moins neutre. **Fork explicite → § 7.**

---

## 5. Périmètre fermé

**Ce lot FAIT :**
- Rend `kind` first-class (enum MVP : `pipeline`/`cycle`/`flow`/`cycle-with-gate`) et `gates`
  optionnel dans le modèle de workflow (cœur GUI + miroir CLI + lecture lint).
- Unifie le nom du champ d'acteurs (et, selon A-1, du conteneur d'étapes) avec tolérance d'alias.
- Promeut `loop` en champ optionnel de première classe.
- Rend `coordinator` optionnel (`REQUIRED.team`) et légitime N = 1 dans `assemble`.
- Adapte `frame-lint.js` (`workflowRoleKeys`) et le cœur GUI (`parseWorkflowRefs`, schéma team) au
  nouveau vocabulaire, **sans durcir** le lint au-delà (pas de schéma strict — c'est Finding 3).
- Re-vendorage du **seul** fichier canon touché + goldens dépendants ; maintient `vendor-check`
  drift 0 et `frame lint --all` exit 0.
- Met à jour la prose des atomes concernés (notes « biais » de `teams/gtd-solo.md`, `methods/gtd.md`,
  `waterfall-lifecycle.md`) pour acter que le détour n'en est plus un.

**Ce lot NE FAIT PAS :**
- **Aucun schéma de frontmatter strict, aucune énum fermée à la validation, aucun linter de type par
  champ** → c'est **Finding 3**, qui dépend de ce lot (§ 9).
- **Aucun namespacing de personas inter-frames** → c'est **Finding 4**, lot séparé (§ 9).
- Ne promeut **aucun** atome de pot commun (time-box, rétrospective, mvp…) : hors périmètre (autre
  item backlog).
- Ne touche **pas** aux champs descriptifs tolérés (`pillars`, `wipLimited`, `metrics`, `diamonds`…) :
  ils restent champs libres tolérés jusqu'à Finding 3.
- N'invente **aucun** cas de gouvernance non déjà forgé (MVP : on absorbe l'existant, pas
  l'hypothétique).

---

## 6. Critères d'acceptation (testables)

- **AC1** — `frame lint --all` reste **exit 0** sur les 8 frames + default **APRÈS unification** — et
  le lint **vérifie désormais réellement** les refs d'acteurs des 8 workflows forgés (non-régression
  **et** correctif : la vacuité du § 1.3 est fermée par le fix `frame-lint.js` inclus au lot).
- **AC2** — `vendor-check` reste **drift 0** (le seul fichier canon touché est re-vendoré dans le lot).
- **AC3** — Un workflow **sans bloc `gates`** (ex. `scrum-sprint`, `kanban-flow`) est **valide sans
  champ inventé pour signaler l'absence** de gate : `gates` est absent, point. Vérifié par lint vert.
- **AC4** — Le champ d'acteurs unifié est **effectivement lu par le lint** : introduire une roleKey
  **pendante** dans un `actorsRoleKeys` d'un workflow forgé **fait rougir** `frame lint` (referme la
  vacuité du § 1.3). Test de non-régression dédié.
- **AC5** — `kind` est **requis et énuméré** au niveau modèle : un workflow **sans `kind`** est lu
  comme `pipeline` (rétro-compat) ; un `kind` **hors enum MVP** est accepté (régime permissif ARB-1,
  pas encore rejeté — le rejet est Finding 3).
- **AC6** — Une team **de cardinalité 1 sans `coordinator`** (variante de `gtd-solo`) **passe**
  `checkSchema` **et** `assemble` sans orphelin, **dès lors que** l'unique persona couvre le rôle.
- **AC7** — Une team **N ≥ 2** avec un rôle **non couvert et sans coordinateur** **échoue** toujours
  (orphelin bloquant conservé — la relaxation ne troue pas la garde).
- **AC8** — Le default `iakaframe` reste fonctionnellement identique : `assemble iakaframe iakaframe-8`
  produit le même descripteur, `iakaframe-8` garde `coordinator: aragorn` **actif**.
- **AC9** — Parité CLI ↔ cœur GUI maintenue : `frame-lint-parity.test.js` et
  `parite-generateurs`/`parite-kit` restent verts (le changement traverse les deux moteurs
  identiquement).
- **AC10** — Aucune frame forgée n'a besoin d'un **champ inventé** pour dire sa gouvernance : chaque
  workflow s'exprime avec `kind` + `phases`/`stages` + champ d'acteurs unifié + (`gates`|`loop`)
  optionnels. Constat de relecture au gate.

---

## 7. Arbitrages — ✅ TRANCHÉS décideur 2026-07-26 (tous sur recommandation Gandalf)

Ces choix engageaient la conception du produit. **Gandalf a recommandé, le décideur a tranché — les
cinq suivent la recommandation. Plus aucun arbitrage ouvert.**

- **A-1 — nom du conteneur d'étapes → ✅ TRANCHÉ : `phases` conservé au canon + `stages` toléré en
  alias.** Moindre churn (7/8 workflows l'utilisent déjà). L'option `steps` est écartée.
- **A-2 — nom du champ d'acteurs & sort du default → ✅ TRANCHÉ : CANONISER `actorsRoleKeys` + alias
  toléré `agentsRoleKeys`.** Le nom canonique **neutre** devient `actorsRoleKeys` ; `agentsRoleKeys`
  reste lu en **alias** (rétro-compat). **Conséquence assumée et réparatrice** : le workflow du default
  `library/workflows/iakaframe-3phases.md` gagne `kind: pipeline` **et** le renommage
  `agentsRoleKeys`→`actorsRoleKeys`, **re-vendoré dans le lot** pour tenir `vendor-check` drift 0.
  C'est la **SEULE entorse** au « default byte-inchangé » — assumée : le default devient **honnête**
  (nom neutre) et **ferme le trou du lint** découvert au § 1.3. **Le fix de `frame-lint.js`
  (`workflowRoleKeys` lit le champ d'acteurs unifié, alias-aware) fait PARTIE du lot** — c'est le
  correctif de justesse du lint, pas un travail séparé.
- **A-3 — profondeur de génération → ✅ TRANCHÉ : rester MVP.** First-class : `kind`, conteneur
  d'étapes, acteurs, `gates` optionnel, `loop`, charnière solo. Les **14 autres** champs
  (`pillars`/`nature`/`wipLimited`/`diamonds`/`metrics`/`cadences`/`mindsets`/`tracking`/…) restent
  **champ libre toléré** (régime permissif ARB-1) jusqu'à Finding 3. Pas de sur-ingénierie.
- **A-4 — marque du solo → ✅ TRANCHÉ : `coordinator` optionnel + `soleActor`.** Retirer `coordinator`
  de `REQUIRED.team`, marquer N = 1 par `soleActor`, **conserver la garde** « rôle non couvert sans
  coordinateur » pour N ≥ 2. L'option rôle/flag « auto/solo » explicite est écartée.
- **A-5 — découpage → ✅ TRANCHÉ : une instruction (celle-ci), deux sous-lots séquentiels** — A
  (gouvernance) puis B (cardinalité), partageant la même discipline cross-repo/vendor.

---

## 8. Découpage & estimation (obligatoire au gate P1→P2)

**Découpage recommandé (une instruction, deux sous-lots séquentiels) :**
- **Sous-lot A — Gouvernance (Finding 1 + découverte § 1.3).** `kind` first-class + `gates` optionnel
  + unification champ d'acteurs/conteneur (alias) + `loop` first-class + lecture lint corrigée +
  re-vendorage du fichier canon. **C'est le plus gros fork** (touche la grammaire lue par lint,
  vendor-check, cœur GUI).
- **Sous-lot B — Cardinalité (Finding 2).** `coordinator` optionnel + N=1 dans `assemble` + prose
  gtd-solo. **Plus petit**, largement une relaxation.

**Estimation chiffrée (spec fermée, ordre de grandeur assumé et révisable — pas un engagement ferme) :**

| Composante | Sous-lot A (gouvernance) | Sous-lot B (cardinalité) | Ensemble |
|---|---|---|---|
| **Équivalent jour-homme** | **2 à 3 j-h** | **1 à 1,5 j-h** | **≈ 3 à 4,5 j-h** |
| **Complexité / risque** | **Moyen-élevé** | **Faible-moyen** | **Moyen-élevé** |

- **Pourquoi ce niveau (A).** Le changement traverse **deux moteurs** (CLI `frame-lint.js`/`library.js`
  + cœur GUI `packages/core`) tenus en **parité verrouillée** (tests de parité) et **des fixtures
  vendorées** ; il touche la grammaire même que `frame lint` et `vendor-check` gardent. Le risque
  n'est pas l'algorithme (simple) mais le **ripple cross-repo** et le **re-vendorage propre**.
- **Pourquoi B est plus léger.** Relaxation de schéma + une garde d'`assemble` à préserver ;
  peu de surface, tests ciblés.

**Inconnues susceptibles de faire glisser l'estimation (à éprouver tôt) :**
1. **Accès & forme du cœur GUI** (`~/work/iakaFrameGUI`, dépôt frère). Le modèle typé de workflow y
   vit (`WORKFLOW_CATALOG`, `parseWorkflowRefs`) ; on ignore, sans le lire, s'il modélise déjà `kind`
   ou le durcit. **Si le core type le workflow strictement**, le sous-lot A grossit (schéma TS à
   étendre + tests vitest + regen goldens vendorés). *→ vérifier au démarrage de P2.*
2. **Étendue du re-vendorage.** Combien de goldens/fixtures dépendent du fichier canon touché
   (`golden kit`, `parite-kit`, miroir `StefFrame2` gelé). Le miroir StefFrame2 est **gelé** (backlog)
   — à ne PAS rafraîchir ; confirmer qu'il n'entre pas dans le drift.
3. **Alias vs rename dur** (A-2) : un rename dur sans alias transformerait une relaxation en migration
   des 9 workflows + tous les lecteurs — glissement net vers le haut. L'alias est le garde-fou.

**Rappel de discipline (charte).** Cette estimation sera **confrontée au temps réel à la clôture du
lot** pour affiner les suivantes.

---

## 9. Dépendances — Findings 3 & 4 (positionnés, non cadrés ici)

- **Finding 3 (schéma de frontmatter strict + `frame lint` strict) — STRICTEMENT APRÈS 1 & 2.**
  Grave : un schéma typé par champ, des énums **fermées à la validation** (`kind`, `gate.kind`,
  `scope`…), l'unicité stricte des ids, ne peuvent être écrits **qu'une fois le vocabulaire agnostique
  arrêté**. Canoniser un schéma **avant** aurait pour effet de **cimenter le modèle biaisé** : on
  figerait `agentsRoleKeys`, l'absence de `kind`, `coordinator` obligatoire, comme la « norme ». Le
  régime **permissif ARB-1** actuel (`frame lint` tolère les champs inconnus, cf.
  `cli/src/commands/frame.js` LINT_HELP) **doit rester** jusque-là. **Finding 3 = lot suivant, hors ce
  cadrage.**
- **Finding 4 (collision de personas inter-frames — namespacing) — LOT SÉPARÉ, PLUS PETIT.** La
  library est **partagée** entre toutes les frames du réservoir (personas rangées côte à côte). Le
  risque de **collision d'id de persona** entre frames (deux frames nommant une persona
  identiquement) est **orthogonal** aux biais de gouvernance/cardinalité et **n'en dépend pas**. À
  traiter comme un **lot dédié, de moindre envergure**, indépendamment de la séquence 1→2→3.

**Séquence recommandée :** (1&2, cette instruction) → 3 → 4 en parallèle possible.

---

## 10. Sources (vérification état de l'art — charte Gandalf)

Grounding des familles de gouvernance retenues pour l'énum `kind` (pipeline+gates / continuous flow /
bounded autonomy sont des familles reconnues du champ, ce qui conforte un `kind` first-class plutôt
qu'un présupposé unique) :

- [Process Governance: Definition, Framework & Best Practices](https://lemonlearning.com/blog/process-governance)
- [From Assistance to Agency: Rethinking Autonomy and Control in CI/CD Pipelines](https://arxiv.org/html/2605.07062)
- [A Process Harness for Uplifting Legacy Workflows to Agentic BPM (CUGA FLO)](https://arxiv.org/pdf/2606.27188)

Preuves internes (sur pièces, lues en cadrage) : `library/workflows/iakaframe-3phases.md`,
`scrum-sprint.md`, `waterfall-lifecycle.md`, `gtd-flow.md`, `kanban-flow.md`, `shapeup-cycle.md`,
`dt-double-diamond.md` ; `teams/gtd-solo.md`, `teams/iakaframe-8.md` ; `methods/gtd.md`,
`methods/scrum.md`, `methods/iakaframe.md` ; `library/personas/lee.md` ;
`cli/src/lib/library.js` (`REQUIRED.team`, `assemble`, `checkRefs`), `cli/src/lib/frame-lint.js`
(`workflowRoleKeys`, régime permissif), `cli/src/commands/frame.js` (LINT_HELP) ; `BACKLOG.md`
(item « Catalogue de frames forgé (7) + 3 biais »).
