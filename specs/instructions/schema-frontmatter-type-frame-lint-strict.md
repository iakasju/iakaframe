# Finding 3 — Schéma de frontmatter typé + politique de lint sur l'inconnu

> Cadrage P1 (Gandalf). Débloqué : le **modèle de frame agnostique est mergé (v0.26.0)** —
> `kind` first-class, `gates`/`loop` optionnels, conteneur `phases`+`stages` et acteurs
> `actorsRoleKeys`+`agentsRoleKeys` unifiés alias-aware CLI+GUI. On peut **canoniser un schéma
> sans cimenter un modèle biaisé** (le blocage explicite d'ARB-1 est levé).
>
> **Statut : PÉRIMÈTRE FERMÉ — 6 arbitrages TRANCHÉS par le décideur (2026-07-26), tous sur la reco
> de Gandalf.** Plus aucun arbitrage ouvert (§ 8). Prêt pour le gate Legolas ; exécutant P2 : Gimli.

Réf. canon lues (sur pièces) : `cli/src/lib/frame-lint.js`, `cli/src/lib/library.js`
(`checkSchema`/`REQUIRED`/`ADD_DIR`/`checkRefs`), `cli/src/lib/scaffold.js` (gabarits
`poolTemplate`/`scaffoldFrameNew`), `cli/src/commands/frame.js` (`LINT_HELP`), `cli/src/commands/add.js`,
`cli/test/frame-lint-parity.test.js` ; côté GUI (lecture seule, dépôt frère)
`packages/core/src/frame.ts` (`checkFrameRefs`), `packages/core/src/workflow.ts`
(`parseWorkflow`/`WORKFLOW_KINDS`), `packages/core/src/persona.ts` (`parsePersona`) ; les 8 frames
rangées (`frames/`, `methods/`, `library/workflows/`) + le default.

---

## 1. Problème (avant la solution)

`frame lint` **valide le graphe d'ids** (résolution, casting, couverture, refs sortantes T1/T5/T3,
unicité inter-collections) mais **tolère silencieusement tout champ de frontmatter inconnu** — c'est
écrit noir sur blanc dans `LINT_HELP` (`cli/src/commands/frame.js`) : *« Les champs de frontmatter
inconnus sont TOLERES sans avertissement (ARB-1 : MVP permissif, aucun schema strict grave). »*

Conséquences mesurées :

- **Aucun garde-fou de type ni de frappe.** Rien n'empêche `roleKey` écrit `rolekey`, `guardrails`
  écrit `guardrials`, une liste attendue reçue en scalaire, ou une valeur d'énum hors énum. Le champ
  fautif est ignoré en silence ; le lint reste vert alors que la donnée est fausse. `checkSchema`
  (`library.js`) ne contrôle que la **présence** de champs requis, et **seulement pour les 4
  assemblages** (team/method/binding/frame) — **jamais** les 8 atomes de pool, **jamais** les types,
  **jamais** les champs en trop.

- **Chaque frame a inventé son vocabulaire par imitation.** Au-delà des champs first-class, la
  recension sur pièces (§ 3) relève **~16 champs tolérés** portés par les workflows et rituels des 8
  frames. Sans schéma, ce vocabulaire n'est ni documenté, ni vérifié, ni distingué d'une faute.

- **Prises latentes déjà présentes** (des « champs inconnus » qui sont en fait des bugs ou des dérives,
  cf. § 7) : `shapeup-cycle.md` déclare `kind: cycle-with-betting-gate` **hors énum**, un champ
  `soleActor` qui **référence une persona sans être vérifié**, et une recension backlog **incomplète**
  (elle citait 14 champs et un `wipLimits` fantôme ; le réel en compte ~16 dont `principlesInPlay`).

**Le Finding à corriger** : rendre le vocabulaire de frontmatter **connu, typé et vérifiable**, et
choisir une **politique sur l'inconnu** qui attrape les erreurs de type/frappe **sans casser** les 8
frames rangées ni brider l'expérimentation.

**Ce n'est PAS** : figer un schéma exhaustif de chaque nuance de chaque méthode (sur-ingénierie) ; ni
migrer les frames (invariant § 6) ; ni traiter le namespacing des personas (Finding 4, § 9).

---

## 2. Objectif fermé & critères d'acceptation

Livrer un **schéma de frontmatter typé, source unique CLI↔GUI**, et une **passe de schéma** dans
`frame lint` qui **type les champs connus** et **signale l'inconnu**, sans régression sur le catalogue.

- **AC1 — Schéma typé par type d'atome.** Une **table de schéma déclarative** (donnée, pas de logique)
  déclare, pour chacun des 8 types de pool (personas, skills, principles, rituals, guardrails, roles,
  workflows, scaffolds) + 4 assemblages (methods, teams, bindings, frames) : les champs **requis**,
  **optionnels first-class**, et **extensions reconnues** (§ 4), avec leur **type** (scalar / list /
  bool / enum / map-list). Le contenu de base est celui de la recension § 3.

- **AC2 — Type-check des champs connus (BLOQUANT).** Pour chaque document du graphe linté, un champ
  **connu** porté avec un **type incompatible** (liste attendue / scalaire reçu, énum hors valeurs,
  bool attendu / string reçue) produit un finding **BLOQUANT** (severity `blocking`, `kind:
  'bad-type'`). Un champ **requis manquant** reste bloquant (extension de la règle `checkSchema`
  existante à tous les types). *C'est le cœur bug-catcher : il ne peut pas rougir les 8 frames, qui
  portent les bons types.*

- **AC3 — Politique sur l'inconnu (WARN par défaut, `--strict` opt-in — reco Fork A, § 8).** Un champ
  **hors** de la réunion {requis ∪ optionnels ∪ extensions reconnues} produit un **AVERTISSEMENT**
  (`severity: 'warning'`, `kind: 'unknown-field'`) en mode par défaut — **surface le champ, ne bloque
  pas**. Le drapeau `--strict` **promeut** ces avertissements en **BLOQUANT** (pour `frame new` et la
  CI de forge). `frame lint`/`frame lint --all` **par défaut** restent **exit 0** sur le catalogue
  (invariant AC6).

- **AC4 — Source unique CLI↔GUI, verrouillée par test.** La table de schéma existe en **un seul
  endroit faisant autorité** (reco : donnée dans le réservoir iakaframe, consommée par
  `frame-lint.js` **et** le cœur GUI — § 5), **verrouillée** par un test de parité (extension de
  `cli/test/frame-lint-parity.test.js` et/ou `vendor-check`) : muter une définition sans l'autre
  **rougit** le test. Pas deux définitions divergentes.

- **AC5 — Sort des ~16 champs tolérés tranché (§ 4).** Chaque champ toléré est classé **promu
  first-class typé** (générique, réutilisé) **ou** **extension reconnue** (spécifique d'une méthode) —
  aucun ne reste « toléré sans nom ». Un champ spécifique légitime (ex. `diamonds`, `pillars`) a une
  **voie déclarée** qui ne le fait **pas rougir** abusivement.

- **AC6 — Invariant de non-régression (NON négociable, § 6).** Après le lot :
  `iakaframe frame lint --all` reste **exit 0** ; le default `iakaframe` reste **byte-inchangé** ;
  `vendor-check` reste **drift 0**. Aucun rouge surprise sur les 8 frames rangées.

- **AC7 — `frame new`/`add` restent lint-clean.** Les gabarits (`scaffold.js`) produisent des atomes
  qui passent la passe de schéma **y compris `--strict`** (ARB-3 préservé) : leurs champs sont tous
  connus/typés. `LINT_HELP` est corrigé (il annonce aujourd'hui « TOLERES sans avertissement »).

- **AC8 — les 3 prises fermées (§ 7).** (1) `shapeup-cycle.md` renommé `kind: cycle-with-gate` (D-5),
  vérifié par un type-check d'énum à 4 familles ; (2) `soleActor` promu + **vérifié comme ref persona**
  (D-6), avec un test born-red d'un `soleActor` pendant ; (3) le census de la table de schéma (§ 3)
  **inclut `principlesInPlay`** (15ᵉ champ, LeanStartup) et **ne comporte pas** de `wipLimits`
  fantôme (seul `wipLimited` step-level existe) — le census § 3, pas le backlog, fait autorité.

---

## 3. Recension sur pièces (base du schéma)

Relevé **sur les fichiers réels** (les 8 frames + le default). Cette table est la matière première
d'AC1.

### 3.1 Atomes de pool — champs observés

| Type | Requis (observés) | Optionnels first-class candidats | Extensions spécifiques observées |
|---|---|---|---|
| **personas** | `id`, `name`, `roleKey` | `royaume`, `pastille`, `vignette`, `skills[]`, `guardrails[]`, `description` | — (casting pur, I3 ; `runner`/`model` **interdits**) |
| **skills** | `id`, `name` | `subskills[]`, `description`, `layer` | — |
| **principles** | `id`, `label` | `policy`, `trigger` | — |
| **rituals** | `id`, `label` | `triggers[]`, `cadence`, `timebox`, `actions[]`, `side` | — |
| **guardrails** | `id`, `label` | `kind`, `hook`, `policy` | — |
| **roles** | `id`, `key`, `label` | `roleIndex`, `scope` (`team`/`mode`/`inherited`) | — |
| **scaffolds** | `id` | `level`, `nonDestructive`, `entries[]{path,role,createIfAbsent}` | — |
| **workflows** | `id`, `name` | `kind` (énum), `container`, `phases[]`\|`stages[]`, `gates[]`, `loop` | `pillars`, `diamonds`, `mindsets`, `nonLinear`, `pullPoints`, `commitmentPoint`, `deliveryPoint`, `metrics`, `cadences`, `practices`, `tracking`, `noBackflow`, `principlesInPlay`, `soleActor` |

**Sous-objets de workflow** (dans les items de `phases`/`stages`) : `id`, `label`, `ritual`,
`actorsRoleKeys[]`\|`agentsRoleKeys[]`, `input`, `output`, `entry`, `exit`, plus les extensions
step-level `nature` (`divergent`/`convergent`, DT), `wipLimited` (bool, Kanban), `side` (`prod`,
iakaframe). Items de `gates` : `afterPhase`, `kind` (`human`/`auto`), `criteria`. Items de `diamonds` :
`id`, `label`, `spans[]`.

> **Piège de double vocabulaire (à cadrer explicitement dans le lot).** Le cœur GUI porte **deux**
> lectures d'un workflow : (a) `parseWorkflowRefs` (`frame.ts`) — **alias-aware**, lit
> `phases||stages` + `actorsRoleKeys||agentsRoleKeys` : c'est la lecture d'**intégrité**, celle que les
> `.md` du réservoir remplissent ; (b) `parseWorkflow` (`workflow.ts`) — le **modèle de rendu** de la
> section « phases/gates » du canon, qui lit `phases[].name`/`.roleKeys`/`.order`/`gate.condition` —
> des champs que les frames rangées **n'utilisent pas** (elles portent `label`/`actorsRoleKeys`/
> `ritual`/`gates.criteria`). **Le schéma des `.md` de workflow DOIT s'aligner sur (a)** — le
> vocabulaire réservoir réellement écrit — **et NON sur (b)**, le modèle de rendu du canonique. Ne pas
> confondre les deux est la principale source d'erreur du lot.

### 3.2 Assemblages — champs (source : `REQUIRED`/`checkRefs` + fichiers)

| Type | Requis (`REQUIRED`) | Optionnels first-class |
|---|---|---|
| **methods** | `id`, `workflowId`, `roleKeys[]` | `name`, `principleIds[]`, `ritualIds[]`, `guardrailIds[]`, `scaffoldIds[]` |
| **teams** | `id`, `personas[]` | `name`, `coordinator`, `guardrails[]` |
| **bindings** | `id`, `teamId`, `assignments[]`\|`bindings[]` | `methodId`, `node`, `origin` ; item : `personaId`(req), `runner`, `model`, `tools[]` |
| **frames** | `id`, `methodId`, `teamId` | `name`, `version`, `default` |

Ces requis sont **déjà** portés par `REQUIRED` (`library.js`) : le lot les **réutilise** (ne les
réinvente pas) et les **étend** aux types de pool et aux types de champ.

---

## 4. Sort des ~16 champs tolérés (AC5) — promus vs extensions

Critère de tranchage (reprend la posture CONSERVATRICE des rangements de frames) : **promotion
first-class** seulement si le champ est **générique** (agnostique de méthode) **et partagé/partageable**
par ≥ 2 frames ou structurellement porté par le modèle agnostique ; sinon **extension reconnue**
(déclarée par type, acceptée sans warning, non typée au-delà de sa forme).

**Promus first-class typés (reco) :**

- **`container`** (workflow, scalar opt.) — porté par 5 frames sur 8, concept de conteneur du modèle
  agnostique. *Réserve : usage à normaliser — sentinelle `none` (Kanban/GTD) vs omission
  (Waterfall/iakaframe), cf. prise § 7.4.*
- **`loop`** (workflow, scalar opt.) — quasi-canonique (tous les `cycle`/`flow`).
- **`soleActor`** (workflow, scalar opt.) — **structurel du modèle agnostique** (marque N=1, cité par
  la correction des biais). Reco forte : le **promouvoir ET le vérifier comme ref persona** (§ 7.5) —
  il pointe une persona (`lee`) aujourd'hui non contrôlée.
- **`nature`** (step, énum `divergent`/`convergent`, opt.) et **`wipLimited`** (step, bool, opt.) —
  attributs d'étape génériques et typables sans ambiguïté ; peu coûteux à typer, haute valeur (bool
  et énum sont exactement ce qu'une erreur de frappe casse en silence).

**Restent extensions reconnues (spécifiques d'une méthode, déclarées par type, sans warning) :**
`pillars` (Scrum), `diamonds`+`mindsets`+`nonLinear` (DT), `pullPoints`+`commitmentPoint`+
`deliveryPoint`+`metrics`+`cadences`+`practices` (Kanban), `tracking` (ShapeUp), `noBackflow`
(Waterfall), `principlesInPlay` (LeanStartup), `side` step-level (`prod`, iakaframe). Rituel :
`cadence`/`timebox`/`actions`/`side` restent optionnels first-class du type `ritual` (ils sont
génériques au rituel, pas spécifiques d'une frame).

> **Ces classements sont une PROPOSITION** ; le décideur peut déplacer un champ d'une colonne à
> l'autre (D-2, § 8). L'important est qu'**aucun** champ ne reste « toléré sans nom ».

---

## 5. Source unique CLI↔GUI (AC4)

**Contrainte** : le CLI est zéro-dépendance JS ESM ; le cœur GUI est TS. Le CLI ne peut pas importer
le TS à l'exécution (il **miroir** déjà des constantes du cœur — ex. `WORKFLOW_CATALOG_IDS`).

**Précédent établi** : `frame-lint-parity.test.js` charge le **vrai** `checkFrameRefs` du GUI **vivant**
(transpile esbuild à la volée) et verrouille la parité ; `vendor-check` garde la fidélité cross-repo
des fixtures. iakaframe est **le réservoir/l'autorité** ; le GUI **vendore**.

**Options (arbitrage D-3, § 8) :**

- **Option 5a (reco) — schéma DONNÉE dans le réservoir iakaframe, vendoré vers le GUI.** La table de
  schéma est un fichier de données **pur** (ex. `library/_schema/frontmatter.json` ou un module
  constant sans logique) **dans iakaframe** ; `frame-lint.js` le lit directement ; le GUI le
  **consomme via vendorage** (garde `vendor-check`). Vraie source unique (un fichier), cohérent avec
  « iakaframe = réservoir, GUI = miroir ». Parité verrouillée par `vendor-check` + un test de forme.
- **Option 5b — constante mirroir + test de parité vivant.** Le CLI porte la constante, le GUI porte
  la sienne, `frame-lint-parity.test.js` est étendu pour asserter l'**égalité profonde** des deux
  tables (charge la table du cœur en vivant). Aligné sur le pattern `WORKFLOW_CATALOG_IDS` existant,
  mais **deux fichiers** à maintenir (source unique *logique*, pas *physique*).

Dans les deux cas : **la validation stricte peut d'abord n'exister que côté CLI** (le GUI parse déjà
défensivement et n'a pas de validateur « champ inconnu »). Le **schéma** est partagé ; l'**usage** du
schéma pour valider peut rester CLI-only au MVP (le surplus CLI-only est déjà admis par la parité —
cf. réserve #1 du test). Que le GUI **consomme** aussi le schéma pour valider (afficher les warnings
dans le panneau) est un **incrément GUI séparé** (D-4).

---

## 6. Invariant de non-régression (AC6 — NON négociable)

Comme les lots précédents (modèle agnostique, rangements) :

1. `iakaframe frame lint --all` **exit 0** après le lot. Mécanisme qui le garantit **par
   construction** : politique **WARN par défaut** (Fork A) → les ~16 extensions, une fois **déclarées**
   dans la table comme « extensions reconnues » de leur type, ne produisent **ni warning ni blocage** ;
   et les champs first-class typés sont portés avec les bons types par les 8 frames (vérifié à la
   recension § 3). **Aucune migration de frame requise** en Fork A.
2. Default `iakaframe` **byte-inchangé** (aucune écriture dans `frames/iakaframe.md`,
   `methods/iakaframe.md`, `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md`,
   `library/workflows/iakaframe-3phases.md`). **Seule exception au catalogue : la micro-correction
   `shapeup-cycle.md` (D-5, `kind: cycle-with-betting-gate` → `cycle-with-gate`)** — **une** frame
   tierce, **pas** le default ; à re-vendorer/re-golden dans le même commit (drift 0 préservé).
3. `vendor-check` **drift 0** (si le schéma est vendoré — option 5a — le lot doit re-vendorer et
   re-golden dans le même passage, exactement comme le modèle agnostique l'a fait pour
   `iakaframe-3phases.md`).
4. **Test born-red exigé** : la passe de schéma **naît rouge** sur une fixture portant un champ mal
   typé et un champ inconnu, puis **verte** une fois la règle branchée — preuve qu'elle mord (calque
   des lots vendor-check/parité).

> **Si un fork casse l'invariant** (Fork B strict-par-défaut, ou Fork C migration `ext:`), le lot doit
> livrer la **micro-migration bornée** qui déclare/déplace les 16 champs **dans le même commit**, en
> re-golden/re-vendorant, pour qu'aucun rouge n'apparaisse jamais entre deux commits. Fork A évite ce
> risque entièrement (reco).

---

## 7. Prises (bugs/dérives déjà présents, révélés par la recension)

À traiter ou à consigner explicitement — ce sont des « champs inconnus » qui sont en réalité des
défauts latents que le Finding attrape :

1. **`kind: cycle-with-betting-gate` hors énum (BUG latent) → RÉGLÉE par D-5 (renommer).**
   `library/workflows/shapeup-cycle.md` déclare `kind: cycle-with-betting-gate`, hors énum canon
   `WORKFLOW_KINDS` (`packages/core/src/workflow.ts`) = `pipeline`\|`cycle`\|`flow`\|`cycle-with-gate`.
   Un type-check d'énum (AC2) le **flaggerait**. **Décision : renommer** en `kind: cycle-with-gate`
   (énum à 4 familles inchangée ; « betting » en prose/extension). **Micro-correction bornée d'UNE
   frame** (Lot 2), à faire dans le commit qui branche l'énum pour qu'aucun rouge n'apparaisse. *C'est
   exactement le genre de dérive silencieuse que Finding 3 vise.*
2. **`principlesInPlay` (LeanStartup) absent de la recension backlog.** Le backlog citait 14 champs ;
   `leanstartup-loop.md` en porte un 15ᵉ non listé. La recension § 3 est la **référence** (le backlog
   était approximatif).
3. **`wipLimits` fantôme.** Le backlog listait `wipLimits`/`wipLimited` ; seul `wipLimited` (bool
   step-level, Kanban) existe. Pas de `wipLimits` top-level dans le canon.
4. **`container: none` sentinelle** (Kanban/GTD) vs **omission** (Waterfall/iakaframe) — usage
   incohérent d'un champ qu'on veut promouvoir. À normaliser à la promotion (accepter l'omission
   comme « pas de conteneur » plutôt qu'une string `none`), ou documenter la sentinelle.
5. **`soleActor` non vérifié (trou de ref latent) → RÉGLÉE par D-6 (promu + vérifié).**
   `gtd-flow.md` porte `soleActor: lee` — une **ref persona** qu'aucun moteur ne contrôle, exactement
   comme les `actorsRoleKeys` qui échappaient au lint avant v0.26.0. **Décision : promu first-class ET
   ajouté à `checkFrameRefs`/`frame-lint` comme ref persona** (sa cible doit résoudre) — ferme le trou
   des deux côtés (Lot 2).

---

## 8. Arbitrages — TRANCHÉS décideur 2026-07-26 (tous sur la reco de Gandalf)

Plus aucun arbitrage ouvert. Le périmètre est fermé.

- **D-1 (LE fork central) — politique sur l'inconnu → ✅ TRANCHÉ décideur 2026-07-26 : Fork A.**
  WARN par défaut sur champ inconnu + `--strict` opt-in (bloquant sous `--strict`, pour `frame new`
  et la CI de forge). **Type-error sur champ CONNU = BLOQUANT dans les deux modes** (le vrai
  attrape-bug). Zéro migration ; `frame lint --all` reste **exit 0** par construction.
  - *Écartés (trace) :* **Fork B** (strict par défaut) — exigeait de déclarer les 16 extensions en
    amont, risque de rouge si census incomplet (il l'était, § 7). **Fork C** (extension déclarative
    `ext:`/`x-*`) — micro-migration ≥ 6 fichiers workflow, reporté (pas retenu pour ce lot).
- **D-2 — classements promus/extensions (§ 4) → ✅ TRANCHÉ décideur 2026-07-26 : les classements de
  Gandalf.** Promus first-class typés = `container`, `loop`, `soleActor`, `nature` (énum),
  `wipLimited` (bool). Extensions reconnues (déclarées, sans warning) = `pillars`,
  `diamonds`/`mindsets`/`nonLinear`, `pullPoints`/`commitmentPoint`/`deliveryPoint`/`metrics`/
  `cadences`/`practices`, `tracking`, `noBackflow`, `principlesInPlay`, `side`.
- **D-3 — placement de la source unique (§ 5) → ✅ TRANCHÉ décideur 2026-07-26 : Option 5a.** Schéma
  en DONNÉE dans le réservoir iakaframe (fichier de données), lu par `frame-lint.js`, **vendoré vers
  le GUI**, verrouillé par `vendor-check` + parité — vraie source unique physique. (5b mirroir écarté.)
- **D-4 — le GUI valide-t-il le schéma maintenant ? → ✅ TRANCHÉ décideur 2026-07-26 : NON.** MVP : le
  GUI **consomme** la donnée vendorée mais la **validation stricte reste CLI-only** pour ce lot
  (surplus CLI-only admis par la parité). Le panneau GUI qui afficherait les warnings est un incrément
  séparé, ultérieur.
- **D-5 — `cycle-with-betting-gate` (§ 7.1) → ✅ TRANCHÉ décideur 2026-07-26 : RENOMMER.**
  `library/workflows/shapeup-cycle.md` passe de `kind: cycle-with-betting-gate` à
  **`kind: cycle-with-gate`** ; l'énum reste à **4 familles** (`pipeline`/`cycle`/`flow`/
  `cycle-with-gate`) ; le « betting » reste en **prose/extension**, hors du `kind`. Micro-correction
  bornée d'**UNE** frame (pas le default) — cf. § 6, invariant préservé.
- **D-6 — `soleActor` promu ET vérifié comme ref persona (§ 7.5) → ✅ TRANCHÉ décideur 2026-07-26 :
  OUI.** `soleActor` est promu first-class **et** sa ref persona **doit résoudre** (ajout à
  `checkFrameRefs`/`frame-lint`) — ferme la prise n°2, même classe que le trou d'acteurs de v0.26.0.

---

## 9. Positionnement de Finding 4 (namespacing personas inter-frames)

**Hors périmètre de ce lot.** Finding 4 (collision/qualification des ids de personas entre frames)
est un **axe orthogonal** au schéma de frontmatter : il concerne l'**unicité/résolution d'ids** entre
collections/frames, pas la **forme typée des champs**. Il reste le **lot séparé suivant**, à cadrer à
part. Ce document ne le traite pas et ne doit pas le pré-cadrer.

---

## 10. Découpage recommandé

- **Lot 1 (la valeur, zéro migration)** : table de schéma (§ 3–4) + type-check des champs connus
  (AC2) + WARN par défaut sur l'inconnu (AC3, Fork A) + source unique (AC4) + tests born-red +
  correction de `LINT_HELP`. Invariant tenu sans toucher une frame.
- **Lot 2 (discipline de forge)** : mode `--strict` + `frame new`/`add` re-vérifiés `--strict`-clean
  (AC7) + promotion+vérification de `soleActor` (D-6) + résolution de la prise énum (D-5).
- **Lot 3 (optionnel, si Fork C)** : mécanisme d'extension déclaratif `ext:` + micro-migration bornée
  re-vendorée. **À n'engager que sur arbitrage D-1=Fork C.**

---

## 11. Estimation (obligatoire au jalon P1→P2)

- **Équivalent jour-homme (spec fermée, Fork A + Lots 1–2)** : **~3,5 à 4,25 j-h**.
  - Table de schéma (census déjà fait à 80 % ici) : ~1 j-h.
  - Passe de schéma + type-check + WARN/`--strict`, câblage `frame lint`/`--all`/`add` : ~1,25 j-h.
  - Source unique + parité (5a re-vendorage, ou 5b test vivant) : ~0,75 j-h.
  - Prises (énum, `soleActor` promu+vérifié) + garantie 8 frames vertes + born-red : ~0,5 j-h.
  - Tests + docs (`LINT_HELP`, `docs/commandes.md`) : ~0,5 j-h.
- **Complexité / risque** : **MOYENNE-HAUTE**. Le risque n'est **pas** le type-check (simple) mais
  (a) le **double vocabulaire de workflow** (§ 3.1, ne pas aligner le schéma sur `parseWorkflow`) et
  (b) la **parité cross-repo** (source unique vendorée + `vendor-check` drift 0). Fork A élimine le
  risque de migration.
- **Inconnues susceptibles de faire glisser** :
  - Complétude de la recension d'extensions (déjà +2 vs backlog — § 7 ; un scan exhaustif du canon
    peut en révéler d'autres) → glissement Lot 1.
  - Placement/vendorage de la source unique (D-3) : 5a demande un passage re-golden/re-vendore comme
    le modèle agnostique ; 5b demande un chargement TS vivant du schéma (esbuild) → +0,25–0,5 j-h.
  - Si le décideur choisit **Fork B/C**, ajouter la migration bornée : **+0,5 à 1 j-h** et un risque
    de rouge à maîtriser dans un seul commit.
- **Ordre de grandeur assumé et révisable** (pas un engagement ferme) ; rappelé et confronté au réel
  à la clôture du lot.
