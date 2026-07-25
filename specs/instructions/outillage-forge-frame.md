# Instruction — Outiller le geste de forge d'un frame (`frame lint` / `frame new` / scaffolds d'atomes)

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-25), sur décision du décideur portée par Aragorn
> (chantier 1 d'une séquence 1+2+3). **Lecture seule sur le code pendant le cadrage** ; ce fichier
> est le seul artefact produit. Réf. backlog : *« Outiller le geste de forge d'un frame vierge »*
> (R14, démo Fëanor du 2026-07-24) et *Finding 3* (pas de schéma ni de linter de frontmatter).
>
> **Citations par nom de section / de symbole, jamais par `chemin:ligne`.** Tous les constats du
> § 0 ont été **mesurés sur le disque le 2026-07-25** dans `~/work/iakaframe` (branche `main`,
> v0.21.0) et `~/work/iakaFrameGUI`, plus le corpus de brouillons Fëanor (`~/work/frame-scrum` +
> `…/scratchpad/frame-*`) — `preuve-avant-declaration`.
>
> **Fait externe vérifié (obligation de sourcing).** L'état de l'art de la validation de frontmatter
> par schéma (JSON Schema + AJV, `remark-lint-frontmatter-schema`) repose **systématiquement sur des
> dépendances runtime externes**. Or le CLI `@naonedge/iakaframe` porte l'invariant **« zéro
> dépendance runtime »** (en-tête de `library.js`, `frame.js`). **Décision confirmée : validateur
> maison, table-driven, extension de `checkRefs` — aucune lib externe.** Sources en pied de page.

---

## 0. État de référence — mesuré, pas présumé

### 0.1 Le socle du lint EXISTE DÉJÀ côté CLI : `checkRefs` (I1)

`cli/src/lib/library.js` porte déjà **la moitié du validateur demandé**. `checkRefs(kind, data, root)`
résout par **appartenance à la collection cible** (donc attrape un id pendant OU un id de mauvais
type dès lors que l'id n'existe pas dans la collection attendue) :

| `kind` | Champs vérifiés aujourd'hui par `checkRefs` |
|---|---|
| `method` | `workflowId → workflows`, `principleIds → principles`, `ritualIds → rituals`, `guardrailIds → guardrails`, `roleKeys → roles`, `scaffoldIds → scaffolds` |
| `team` | `personas → personas`, `coordinator → personas`, `guardrails → guardrails` |
| `binding` | `methodId → methods`, `teamId → teams`, `assignments[].personaId → personas`, runner résoluble (alias-aware) |
| `frame` | `methodId → methods`, `teamId → teams` |

`checkSchema(kind, data)` porte déjà les **champs requis** de `team|method|binding|frame`, et `add.js`
enchaîne déjà `checkSchema` → `id == basename` → `checkRefs` **avant toute écriture**. **Le geste
« refuser si une référence est cassée » existe donc déjà** — mais **n'est appliqué qu'à la livraison
d'un assemblage** (`add`), jamais offert comme verbe de diagnostic autonome, et **jamais étendu à la
frame entière ni aux atomes de pool**.

### 0.2 Une validation PLUS COMPLÈTE existe côté cœur GUI : `checkFrameRefs` — à NE PAS re-dupliquer

`iakaFrameGUI/packages/core/src/frame.ts` porte `checkFrameRefs(...)`, **plus complet** que le
`checkRefs` du CLI : en plus du noyau method/team/binding, il valide les **références sortantes des
atomes de pool** — trous que le CLI ne couvre pas :

- **T1 persona** → `roleKey ∈ roles`, `skills ⊆ skills`, `guardrails ⊆ guardrails` ;
- **T5 workflow** → `agentsRoleKeys ⊆ roles` ;
- **T3 skill** → `subskills ⊆ skills` + **anti-self-ref** (`id ∉ subskills`) ;
- **T6 team** → `guardrails ⊆ guardrails` (le CLI le porte aussi).

**Conséquence structurante.** Le lint frame demandé est, pour l'essentiel, **la parité CLI du
`checkFrameRefs` du cœur GUI**. Ce sont **deux implémentations parallèles d'une même règle**
(le CLI ne peut pas importer le TS du cœur GUI : dépôts/packages distincts) — exactement le patron
**source-unique-par-parité** déjà en place pour le générateur persona→contrat (`parite-generateurs`)
et pour le kit (`parity-kit`). Le lot **n'introduit pas un 3ᵉ endroit** : il **hisse le `checkRefs`
du CLI au niveau du `checkFrameRefs` du cœur** et **verrouille la parité par test**.

### 0.3 `frame lint` n'est PAS un `checkRefs` en boucle : il scanne la frame active

`checkRefs` valide **un document** dont on lui passe le `data`. `frame lint <id>` doit valider un
**graphe** : résoudre le descripteur `frames/<id>.md` → son couple (`methodId`, `teamId`) → la
méthode, la team, le(s) binding(s) appariés, puis **toutes les briques de pool** que ces assemblages
tirent — et rapporter d'un coup tous les ids pendants. `frame.js` (verbe `frame verify`) offre déjà
la **coquille de commande** (sous-verbe, `--json`, `emit`/`fail`, exit 1) à recopier ; `frame-active.js`
offre déjà `frameDescriptor(frameId, root)` et la table de résolution.

### 0.4 Le scaffolding d'atomes est un TROU ; `add` est à moitié gréé pour les assemblages

`add.js` déclare `KINDS = ['team','method','binding']` — mais `ADD_DIR`, `checkSchema` et `checkRefs`
supportent **déjà** `frame`. Donc **`add frame` est câblé dans la lib mais non exposé** par la
commande. Et **aucun verbe ne pose un atome de pool neuf** (persona/role/principle/ritual/guardrail/
skill/workflow/scaffold) : la démo Fëanor a écrit **251 fichiers par imitation** (`mkdir` + copie de
gabarit). Le seul gabarit existant est `library/personas/_TEMPLATE.md` ; les autres collections n'ont
**pas** de `_TEMPLATE.md`.

### 0.5 Divergence CLI↔GUI sur le workflow (tranchée ARB-2, § 5.2)

`checkFrameRefs` (GUI) **tolère** un `workflowId` connu d'un **catalogue du cœur** (`workflowById`)
même absent du pool. `checkRefs` (CLI) **exige** `workflowId ∈ collection workflows`. Sur le corpus
Fëanor, chaque frame **fournit son workflow dans son `library/workflows/`** (ex. `scrum-sprint`,
`six-week-cycle`, `double-diamond`) — donc l'exigence stricte du CLI passe. Mais la parité CLI↔GUI
demande de **nommer** ce que le lint fait du cas « workflow catalogue-connu, pool-absent » (§ 5).

### 0.6 Le corpus de test réel du lint (Finding 3)

Les 7 frames-brouillons (`~/work/frame-scrum`, `…/scratchpad/frame-{kanban,shapeup,designthinking,
leanstartup,waterfall,gtd}`) sont le **corpus de validation** de `frame lint`. Ils portent des
**extensions de frontmatter non canoniques**, inventées par imitation : `kind: cycle|loop`,
`nature: iteratif|divergent|convergent`, `scope: mode|team|inherited`, `side: team|solo|leadership|
shaping|org`, `soleActor`, `noBackflow`, `optional`, `pillars`. **Aucun schéma ne les décrit ; rien
n'empêche une erreur de type** (un principe glissé dans `guardrails:`, attrapé à la main sur Lean
Startup). C'est le cœur du **Finding 3** — et l'arbitrage du § 5.

---

## 1. Problème (avant la solution)

Le réservoir de frames est en production, mais **le geste de forge n'a aucun outil** : (a) rien ne
**valide** qu'un frame neuf est intègre (les ids résolvent, les types sont cohérents) — chaque forge
réécrit un resolver `grep` jetable pour prouver « 0 id pendant » ; (b) rien ne **scaffolde** l'ossature
d'un frame neuf ni un atome typé — tout se fait à la main, « par imitation », vecteur direct d'erreurs
de type. Le socle de validation **existe pourtant déjà à moitié** (`checkRefs` CLI, `checkFrameRefs`
GUI) ; il n'est ni exposé, ni complet, ni tenu en parité.

**Objectif du lot** : donner au forgeron trois gestes — **valider** (`frame lint`), **ossaturer un
frame** (`frame new`), **poser un atome typé** (`add <type-de-pool>`) — en **réutilisant et complétant
l'existant**, sans forker la library ni introduire de 3ᵉ moteur de validation.

---

## 2. Découpage recommandé (MVP d'abord)

| Lot | Verbe(s) | Valeur | Dépend de |
|---|---|---|---|
| **Lot 1 — `frame lint`** *(MVP, recommandé en premier)* | `frame lint <id> \| --all` | Remplace le grep ad hoc de chaque forge ; **le plus demandé** ; socle du reste. Autonome, livrable seul. | rien (extension de l'existant) |
| **Lot 2 — Scaffolds** | `frame new <id>` + `add <type-de-pool> <id>` | Pose l'ossature d'un frame + les atomes typés, **puis `frame lint` valide leur sortie** (boucle vertueuse forge→lint). | Lot 1 (le scaffold est jugé par le lint) |

**Recommandation** : engager **Lot 1 seul** comme MVP (valeur immédiate, risque faible, indépendant),
puis décider Lot 2 à sa lumière. Ne **pas** attendre la canonisation du schéma de Finding 3 (§ 5) pour
livrer Lot 1 : le lint MVP est **permissif sur les champs inconnus** et strict sur les références.

---

## 3. Lot 1 — `frame lint <id> | --all`

### 3.1 Comportement

`frame lint <id>` : résout `frames/<id>.md`, puis valide **tout le graphe tiré par ce descripteur**.
`frame lint --all` : itère tous les descripteurs de `frames/` (kind `flat`, ignore `releases/`).
Verbe **de constat** : il **rapporte et sort en erreur** (exit 1 si findings bloquants), **n'écrit
jamais** (calque de `frame verify`). `--json` émet l'enveloppe C-JSON (`ok` en tête, `findings[]`).

### 3.2 Ce qu'il RÉUTILISE (pas de réécriture)

- `frameDescriptor` / `scan` / `readEntry` / `resolveId` / `libraryRoot` de `library.js` +
  `frame-active.js` ;
- **`checkRefs`** pour method/team/binding/frame (le noyau I1 existant, inchangé) ;
- la coquille de sous-verbe de `frame.js` (`parseArgs`, `emit`/`fail`, exit code, `--json`).

### 3.3 Ce qu'il AJOUTE (les trous à combler, en parité avec `checkFrameRefs` GUI)

1. **Résolution de graphe frame-scopé** : descripteur → method + team + binding(s) appariés → l'union
   des atomes de pool référencés. Un rapport unique agrégeant tous les findings.
2. **Refs sortantes des atomes de pool** (parité T1/T5/T3 — aujourd'hui absentes du CLI) :
   - persona → `roleKey ∈ roles`, `skills ⊆ skills`, `guardrails ⊆ guardrails` ;
   - workflow → `agentsRoleKeys ⊆ roles` ;
   - skill → `subskills ⊆ skills` + anti-self-ref.
3. **Cohérence de casting** (déjà porté par `assemble` — le réutiliser plutôt que le refaire) :
   la team caste des roles/personas existants ; `coordinator` présent ; chaque `method.roleKey` non
   couvert par une persona dédiée l'est **par le coordinateur** (sinon orphelin bloquant).
4. **Couverture du binding** : le binding couvre les personas de la team ; `methodId`/`teamId` du
   binding == ceux du descripteur (cohérence d'assemblage, calque de `assemble`).
5. **`id` interne == nom de fichier** pour chaque document du graphe (invariant I2, déjà fait par
   `add.js` pour un seul fichier — à généraliser au graphe).
6. **Unicité d'id inter-collections** (Finding 3, « unicité des ids ») : un même id présent dans deux
   collections (ex. un id à la fois principe et guardrail) est **signalé** — c'est le seul cas où un
   glissement de type échappe à la vérification par appartenance de collection.

### 3.4 Sortie & sévérité

- **Bloquant** (exit 1) : id pendant, casting orphelin sans coordinateur, binding incohérent,
  `id ≠ nom de fichier`, self-ref de skill, collision d'id inter-collections.
- **Avertissement** (exit 0, listé) : role couvert par le coordinateur (informatif), workflow
  catalogue-connu mais pool-absent (**toléré, ARB-2 tranché — parité GUI**), champ de frontmatter
  inconnu rencontré (**toléré, ARB-1 tranché — MVP permissif**).
- Format humain calqué sur `frame verify` (tableau par classe + détail groupé) ; `--json` :
  `{ ok, frame, checked, findings:[{severity, source, field, id, kind}] }`.

### 3.5 Critères d'acceptation — Lot 1

- **AC1.1** — `frame lint iakaframe` (le default en prod) **sort 0** et rapporte 0 finding bloquant.
- **AC1.2** — Un descripteur pointant un `methodId`/`teamId` absent est **bloquant** avec le champ et
  l'id fautifs nommés.
- **AC1.3** — Un `principleIds`/`ritualIds`/`guardrailIds`/`roleKeys`/`scaffoldIds`/`workflowId` de la
  méthode pointant un id absent est bloquant (réutilise `checkRefs`, non régressé).
- **AC1.4** — Une persona du casting dont `roleKey`/`skills[]`/`guardrails[]` ne résout pas est
  bloquante (trou T1 comblé, **cas qui échappe à `checkRefs` aujourd'hui**).
- **AC1.5** — Un workflow dont un `agentsRoleKeys` ne résout pas est bloquant (T5) ; une skill dont un
  `subskills` ne résout pas, ou qui se référence elle-même, est bloquante (T3).
- **AC1.6** — Un role requis par la méthode et non couvert (ni persona dédiée, ni coordinateur) est
  orphelin bloquant ; couvert par le coordinateur → avertissement non bloquant (parité `assemble`).
- **AC1.7** — Un `id` interne ≠ nom de fichier, dans **n'importe quel** document du graphe, est
  bloquant.
- **AC1.8** — Un id présent dans deux collections est signalé (unicité inter-collections, Finding 3).
- **AC1.9** — `frame lint --all` valide chaque descripteur de `frames/` et agrège ; exit 1 si au moins
  un est bloquant ; **ignore `frames/releases/`**.
- **AC1.10** — `--json` respecte C-JSON (`ok` en tête, findings pluriel) ; `frame lint --help` **ne
  plante pas** (ne pas reproduire le bug `jalon --help` du backlog).
- **AC1.11** — **Parité verrouillée** : un test assère que l'ensemble de règles de `frame lint` (CLI)
  **couvre** celui de `checkFrameRefs` (`@iakaframe/core`, GUI) — même classe de findings sur un même
  frame-fixture (patron `parite-generateurs`). Toute règle ajoutée d'un côté sans l'autre rougit.
- **AC1.12** — Le lint **n'écrit rien** (test de non-mutation : arbre inchangé après un run, calque
  `frame verify`).
- **AC1.13** — Sur le corpus Fëanor rangé dans le réservoir (ou une fixture qui en reproduit un frame),
  `frame lint` **reproduit le verdict « 0 id pendant »** que chaque forge prouvait au grep.

---

## 4. Lot 2 — `frame new <id>` + `add <type-de-pool> <id>`

### 4.1 `frame new <id>` — ossature d'un frame neuf

Scaffolde, **sans forker la library**, l'assemblage neuf pointant la library partagée :
- descripteur `frames/<id>.md` (frontmatter `id/name/version/methodId/teamId/default:false`) ;
- squelette d'assemblage : `methods/<id>.md`, `teams/<id>-team.md`, `bindings/<id>-default.md`,
  `kits/<id>-claude.md` — chacun avec son **frontmatter typé requis** (réutilise `checkSchema` +
  `ADD_DIR` + `serializeKit`) et un corps-gabarit minimal.
- **Non destructif** (refus si une cible existe, `--force` pour remplacer) — calque de `add.js`.
- **`add frame`** : exposer le `frame` déjà câblé dans `ADD_DIR`/`checkSchema`/`checkRefs` (ajouter
  `'frame'` à `KINDS` de `add.js`) — geste de livraison d'un descripteur déjà rédigé, complémentaire
  de `frame new` (scaffold vierge).

### 4.2 `add <type-de-pool> <id>` — atome typé dans la bonne collection

Étend `add.js` (aujourd'hui `team|method|binding`) aux **8 types de pool** (`persona`, `role`,
`principle`, `ritual`, `guardrail`, `skill`, `workflow`, `scaffold`) : pose le **frontmatter typé du
bon type dans le bon dossier** (via `COLLECTIONS`/`collectionOf` — table déjà autoritaire), pour ne
plus écrire « par imitation ». `skill` scaffolde le **dossier + `SKILL.md`** (kind `skill`).

### 4.3 Critères d'acceptation — Lot 2

- **AC2.1** — `frame new <id>` crée descripteur + 4 fichiers d'assemblage, chacun au frontmatter typé
  requis, tous pointant la library partagée (aucune copie de brique).
- **AC2.2** — *(ARB-3, tranché)* `frame new <id>` produit une ossature **lint-clean par
  construction** : `frame new <id>` **suivi de** `frame lint <id>` **sort 0** — une base valide,
  jamais un squelette rouge. C'est le critère durci du décideur.
- **AC2.3** — `add <type-de-pool> <id>` pose l'atome dans la collection correcte avec les champs requis
  du type ; refuse si l'id existe (`--force`) ; `id == basename`.
- **AC2.4** — `add skill <id>` crée `library/skills/<id>/SKILL.md` (mode dossier), pas un `.md` plat.
- **AC2.5** — `add frame <fichier.md>` est exposé (le câblage lib existant devient invocable) et valide
  ses refs avant écriture (comportement `add` existant, non régressé).
- **AC2.6** — Aucun scaffold n'écrit hors du réservoir résolu par `libraryRoot()`.
- **AC2.7** — Chaque nouveau gabarit produit un frontmatter que `frame lint` accepte (cohérence
  scaffold↔lint testée).

---

## 5. Décisions — toutes tranchées (Gandalf + décideur 2026-07-25)

### 5.1 Tranché par Gandalf (dans le cadre, opposable)

- **T-a — Validateur maison, zéro dépendance externe** (§ en-tête, fait web vérifié) : extension de
  `checkRefs`, pas d'AJV/remark. Aligné sur l'invariant du CLI.
- **T-b — Pas de 3ᵉ moteur** : `frame lint` hisse `checkRefs` (CLI) à parité avec `checkFrameRefs`
  (cœur GUI) et **verrouille la parité par test** (AC1.11), au lieu de dupliquer une 3ᵉ règle.
- **T-c — `frame lint` d'abord** (MVP autonome), scaffolds ensuite (Lot 2 jugé par le lint).
- **T-d — Lint MVP permissif sur les champs de frontmatter inconnus** : il **valide les références et
  les champs typés connus**, **tolère** (avec avertissement) `kind/nature/scope/side/soleActor/…`
  plutôt que de les rejeter — pour ne pas **figer prématurément** un schéma que Findings 1 & 2 (encore
  ouverts) pourraient déplacer.

### 5.2 Tranché par le décideur (2026-07-25) — plus aucun arbitrage ouvert

Les trois arbitrages ci-dessous ont été **rendus par le décideur le 2026-07-25, tous sur la
recommandation Gandalf**. Ils sont **fermés** ; aucun n'est plus ouvert.

- **✅ ARB-1 — TRANCHÉ : lint permissif au MVP.** `frame lint` valide le **graphe d'ids** (résolution
  method→library, casting team, couverture binding, cohérence de type par champ) mais **tolère les
  champs de frontmatter inconnus** (`kind`, `scope: mode`, `soleActor`, `side`, `nature`, `noBackflow`,
  `optional`, `pillars`…). Il est **strict sur les références et les champs typés connus**, **tolérant
  (avertissement)** sur les extensions.
  > **⛓️ DÉPENDANCE GRAVÉE — report explicite de la canonisation.** La canonisation d'un **schéma
  > strict par champ** (énum des valeurs de `kind`, champs requis par type d'atome, statut des
  > extensions) est **reportée à un lot ultérieur**, **conditionnée à l'arbitrage préalable des
  > Finding 1 (biais de gouvernance / vocabulaire `workflow`) & Finding 2 (biais de cardinalité N≥2)**.
  > **On ne fige pas le vocabulaire des frames avant d'avoir traité les biais du modèle** : un schéma
  > strict posé maintenant graverait dans le linter les présupposés que Findings 1 & 2 doivent lever.
- **✅ ARB-2 — TRANCHÉ : tolérer (parité GUI `checkFrameRefs`).** Le lint CLI **s'aligne sur
  `checkFrameRefs`** (plus complet, déjà en prod côté GUI) : un atome connu du **catalogue partagé**
  (ex. `workflowById` du cœur) **suffit**, sans qu'il soit dans le pool de la frame — avertissement
  non bloquant, jamais un blocage. **Cet assouplissement modifie la sévérité CLI actuelle** (le
  `checkRefs` du CLI exigeait le workflow en pool) : l'assouplissement est **assumé** et le **test de
  parité (AC1.11) doit refléter cette sévérité commune** CLI↔GUI.
- **✅ ARB-3 — TRANCHÉ : ossature lint-clean par construction.** `frame new <id>` produit un descripteur
  + un assemblage **minimal cohérent qui passe `frame lint` immédiatement** (une base valide que le
  user enrichit), **jamais** un squelette rouge par construction. Critère durci : `frame new <id>`
  suivi de `frame lint <id>` **sort 0** (AC2.2).

---

## 6. Périmètre fermé — hors périmètre

- **Ne fait PAS** : Findings 1 (biais workflow/pipeline) & 2 (biais de cardinalité N≥2) — chantiers
  d'agnosticité distincts, non requis pour ce lot.
- **Ne fait PAS** : la **canonisation** d'un schéma typé de frontmatter (dépend d'ARB-1).
- **Ne fait PAS** : le **rangement** des 7 frames-brouillons dans le réservoir (item backlog séparé ;
  ils servent ici de **corpus de test** seulement).
- **Ne fait PAS** : la génération du **kit** depuis le binding au-delà du scaffold `kits/<id>-claude.md`
  (la génération complète relève du chantier kit/assemble existant).
- **Ne fait PAS** : le rôle `frame-builder` (Fëanor) — lot cadré à part (`role-frame-builder.md`).
- **Ne touche PAS** : le cœur GUI (`@iakaframe/core`) — `checkFrameRefs` reste la **référence de
  parité**, non modifiée par ce lot ; seul un test de parité la lit.

---

## 7. Dépendances

- Lot 1 : autonome (extension de `library.js` + nouvelle branche dans `frame.js`).
- Lot 2 : s'appuie sur Lot 1 (le scaffold est validé par le lint) et sur `add.js`/`serializeKit`
  existants.
- Parité (AC1.11) : nécessite l'accès en **lecture** au frère `iakaFrameGUI` (`@iakaframe/core`) au
  moment du test — même contrainte que `vendor-check`/`parite-generateurs` (gracieux si absent). Le
  test de parité doit refléter la **sévérité commune** CLI↔GUI actée par ARB-2 (assouplissement CLI).
- **ARB-1/ARB-2/ARB-3 : tous tranchés par le décideur le 2026-07-25** (§ 5.2) — aucune décision
  bloquante ne reste ouverte avant exécution. **Seul report gravé** : la canonisation d'un schéma
  strict (ARB-1) est un **lot ultérieur conditionné à l'arbitrage des Finding 1 & 2** — hors périmètre
  de ce lot.

---

## 8. Estimation (au jalon P1→P2 — ordre de grandeur, révisable)

| Lot | Équivalent jour-homme (spec fermée) | Complexité / risque | Inconnues susceptibles de faire glisser |
|---|---|---|---|
| **Lot 1 — `frame lint`** | **1,5 à 2,5 j** | **Moyen.** Le socle (`checkRefs`) existe ; l'essentiel est la **résolution de graphe** + les 3 refs de pool (T1/T5/T3) + le **test de parité** avec le cœur GUI (le plus délicat). | Effort réel de mise en parité stricte avec `checkFrameRefs` ; forme exacte du corpus-fixture ; ARB-1/ARB-2 (sévérité). |
| **Lot 2 — scaffolds** | **1,5 à 2 j** | **Faible à moyen.** `add.js`/`ADD_DIR`/`checkSchema`/`serializeKit` sont réutilisables ; l'essentiel est **8 gabarits typés** + le mode dossier `skill` + exposition d'`add frame`. | ARB-3 (complétude ossature) ; nombre/forme des gabarits ; boucle scaffold→lint (AC2.2/AC2.7). |
| **Total séquence** | **3 à 4,5 j** | Moyen | Dominées par ARB-1 (peut transformer Lot 1 strict) et la parité CLI↔GUI. |

Ce n'est **pas un engagement ferme** : un ordre de grandeur assumé, à **confronter au temps réel** en
clôture de lot pour affiner les suivantes.

---

## 9. Risques & défauts relevés (au décideur)

- **R1 — Piège de parité CLI↔GUI.** Deux moteurs (`checkRefs` CLI, `checkFrameRefs` GUI) qui doivent
  dire la même chose : sans le test de parité AC1.11, ils **divergeront silencieusement** (c'est
  exactement la classe de dette que `vendor-check` a révélée). Le test de parité **n'est pas
  optionnel** — c'est le cœur de la valeur « source unique ».
- **R2 — DÉSAMORCÉ par ARB-1 (MVP permissif).** Le risque « figer un schéma strict à la place du
  décideur / avant les Findings 1 & 2 » est écarté : le lint MVP est permissif sur les champs inconnus
  et la canonisation est **reportée en lot ultérieur** (dépendance gravée § 5.2). Vigilance résiduelle
  à l'exécution : que Gimli **ne réintroduise pas** de rejet strict de champ inconnu par zèle.
- **R3 — RÉSOLU par ARB-3.** L'ossature de `frame new` est **lint-clean par construction** (AC2.2,
  exit 0). Vigilance : rester **minimal** (une base valide), sans inventer d'ids superflus.
- **R4 — RÉSOLU par ARB-2, mais reporté dans la parité.** Le CLL s'aligne sur la sévérité GUI
  (tolérant) : plus de frame « valide GUI / rejeté CLI ». **Le test de parité (R1) doit encoder cette
  sévérité commune** — c'est là que se joue désormais la cohérence du verdict.
- **R5 — `add frame` déjà à moitié câblé.** Exposer `KINDS += 'frame'` est trivial mais **doit** passer
  par le cycle (ce cadrage) et non en catimini : `add frame` valide des refs et écrit dans le
  réservoir — geste de livraison à part entière.
- **R6 — Bug `--help` à ne pas rejouer.** `jalon --help` plante (backlog) ; `frame lint --help` doit
  être testé (AC1.10).

---

## Sources (fait externe vérifié — sourcing obligatoire)

- [remark-lint-frontmatter-schema (GitHub)](https://github.com/JulianCataldo/remark-lint-frontmatter-schema) — validation de frontmatter par JSON Schema, **dépendances runtime** (remark/unified).
- [remark-lint-frontmatter-schema (npm)](https://www.npmjs.com/package/remark-lint-frontmatter-schema)
- [frontmatter-to-schema (GitHub)](https://github.com/tettuan/frontmatter-to-schema) — extraction/validation via JSON Schema, **deps AJV/YAML/glob**.
- [sourcemeta/jsonschema — lint](https://github.com/sourcemeta/jsonschema/blob/main/docs/lint.markdown)

> Conclusion de la vérification : toutes les voies « sur étagère » imposent des dépendances runtime,
> **incompatibles avec l'invariant zéro-dépendance du CLI**. Le validateur maison (extension de
> `checkRefs`) est donc le bon choix, confirmé par l'état de l'art plutôt que présumé.
