# Instruction — Unification de la dualité workflow (pool vs collection) : vérité unique + sous-lot 5c-workflow

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (marche forcée décideur).
> **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture Gandalf est
> bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli (**cross-repo**) ; gate P2→P3 =
> 🏹 Legolas.
>
> **Pourquoi ce fichier.** Le cadrage `persistance-5c-roles-guardrails-skills.md` (§ 3, AR-4) avait
> **écarté** la persistance workflow parce qu'elle crée une **double source de vérité** (pool
> `library/workflows/` vs collection `<home>/workflows/`) — « un choix d'archi non trivial à cadrer à
> part ». **Le décideur a révisé ce verdict le 2026-07-26** : il demande de **résoudre la vérité
> unique MAINTENANT** et d'**inclure le workflow dans le lot 5c** (roles + guardrails + skills +
> workflow unifié). Ce fichier **cadre et tranche** cette résolution ; il **corrige** le verdict de
> `persistance-5c-roles-guardrails-skills.md` (§ 3 / AR-4 amendés en renvoi vers ici).
>
> **Constats mesurés sur pièces le 2026-07-26** (`preuve-avant-declaration`). Deux dépôts :
> `~/work/iakaframe` (réservoir : `library/` canon + CLI + vendorage) et `~/work/iakaFrameGUI`
> (cœur `packages/core` + hôte React `src/` + backend Tauri `src-tauri/`). Lecture seule sur le code.
> Citations par nom de fichier / de symbole (les pointeurs chiffrés vieillissent) ; le message de
> remise à Aragorn porte les `chemin:ligne` cliquables.

---

## 1. CARTOGRAPHIE MESURÉE — les deux vies du workflow

### 1.1 — Vie POOL : `library/workflows/<id>.md` (l'atome de réservoir, la vérité de l'assemblage)

- **Sur disque** : `library/workflows/iakaframe-3phases.md` — frontmatter **frame-format** (séquences
  de maps inline `phases:` `- { id, label, side?, actorsRoleKeys, input, output }` + `gates:` en
  tableau séparé), `kind: pipeline`, corps narratif. **Read-only canon.**
- **Un des 8 `POOL_FRAME_TYPES`** (`frame.ts`) : `workflows` est un atome de pool de 1er ordre, au
  même titre que personas/roles/principles/…
- **Id d'atome** : `poolAtomId('workflows', md)` = `parseWorkflow(data).id` (`frame.ts`).
- **Référencé par la méthode PAR ID** : `methods/iakaframe.md` porte `workflowId: iakaframe-3phases`
  (mesuré). L'intégrité (`checkFrameRefs`, `frame.ts`) résout ce `workflowId` **contre le POOL** :
  `if (wf && !workflows.has(wf) && workflowById(wf) === undefined)`, où `workflows = new
  Set(poolIds.workflows)` (les ids du pool `library/workflows/`) + repli `workflowById` (catalogue
  **codé en dur** dans `packages/core/src/workflow.ts`). **La cible de la référence, c'est le pool.**
- **Vendorisé** : `fixtureTable()` (`cli/src/lib/vendor.js`) porte **déjà** la famille `workflow`
  (`kind:'copy'`, byte-à-byte, `source: library/workflows/iakaframe-3phases.md`), comptée dans
  `EXPECTED_COPIES = 45`. **Le pool workflow est déjà au miroir cross-repo.**
- **Écriture pool** : `pool_write("workflows", id, text)` (`src-tauri`, façade `poolWrite` de
  `backend.ts`) est **déjà acceptée** (`workflows` ∈ `POOL_TYPES`, hors garde skills). Le chemin
  d'écriture pool **existe techniquement**.
- **Surface « éléments » (#3 Lot 3)** : `workflowKind.tsx` + `workflowCards.ts` exposent le workflow
  dans le réservoir générique `ElementReservoir`, éditeur `WorkflowAtelier` réutilisé via
  `WorkflowElementEditor`. **MAIS mesuré** : sa **source est `WORKFLOW_CATALOG`** (catalogue vendoré
  **en dur** dans `@iakaframe/core`), **pas** le pool disque — et l'**édition est état de session,
  AUCUNE écriture disque** (commentaire d'en-tête `workflowKind.tsx` : « édition = état local de
  session (aucune écriture disque — Lot 5 différé, cross-repo) »). `frame.ts` **n'expose PAS** de
  `frame.workflows` riche (seulement `poolIds.workflows`).

### 1.2 — Vie COLLECTION : `<home>/workflows/<id>.md` (l'onglet « méthode » éditable, parallèle)

- **La surface** : `WorkflowAtelier.tsx` (rattaché à l'entrée `méthode`, sous-nav Discipline/Workflow)
  édite `kind` + phases/gates via les helpers purs du cœur. Le bandeau affiche
  `workflows/{workflow.id}.md` (**hors** `library/`).
- **Persistance** : via `libraryWrite("workflows", id, serializeWorkflowMd(wf))` — le type
  `LibraryCollection` (`backend.ts`) inclut `workflows`, documenté **explicitement** : « la collection
  **éditable** `<home>/workflows/` (P6b) — **distincte** du pool d'atomes read-only
  `<home>/library/workflows/` … **même nom, deux espaces séparés au MVP** ».
- **Sérialiseur COMPLET déjà là** : `serializeWorkflowMd` / `serializeWorkflowFrontmatterMd` +
  mapper `workflowToMd` / `mdToWorkflow` (`frontmatter.ts`), frame-format canonique. Round-trip byte
  d'un fichier ouvert non édité assuré côté hôte par **ré-émission du source capturé verbatim**.
- **Sur disque** : `<home>/workflows/<id>.md`. **MESURÉ** :
  `~/work/iakaframe/workflows/iakaframe-3phases.md` **N'EXISTE PAS** — le réservoir canon n'a **aucun**
  dossier `workflows/` de 1er niveau, **seulement** `library/workflows/`. **La collection n'est PAS
  matérialisée dans le canon.** C'est un **chemin de code latent/legacy** (une écriture s'y ferait
  dans un `IAKAFRAME_HOME` runtime d'utilisateur, jamais dans le canon vendoré).

### 1.3 — LE CONFLIT RÉEL (où est la vérité, où est le risque)

| | Vie POOL | Vie COLLECTION |
|---|---|---|
| **Chemin disque** | `<home>/library/workflows/<id>.md` | `<home>/workflows/<id>.md` |
| **Id** | `iakaframe-3phases` | `iakaframe-3phases` (**le même**) |
| **Sérialisation** | frame-format frontmatter | frame-format frontmatter (**la même**) |
| **Écrit par** | `pool_write` (façade là, **aucun flux GUI ne l'emprunte**) | `library_write` (`WorkflowAtelier` — flux réel) |
| **Lu par la méthode** | **OUI** (`checkFrameRefs` résout `workflowId` ici) | **NON** (jamais résolu) |
| **Vendorisé** | **OUI** (famille `workflow`, dans `EXPECTED_COPIES`) | non |
| **Matérialisé en canon** | **OUI** | **NON** |

**Où est la vérité aujourd'hui.** L'assemblage (méthode → `workflowId`) ne connaît **que le POOL**.
Le pool est **la** vérité de fait : c'est lui que la méthode résout, lui qui est vendoré, lui qui est
matérialisé en canon.

**Où est le risque.** Deux **chemins d'écriture** visent **le même id, la même forme, deux dossiers** :
`WorkflowAtelier` écrit dans la **collection** (`<home>/workflows/`), que la méthode **n'ouvre jamais**.
Une édition faite dans l'atelier « méthode » produit donc une **copie orpheline** que l'assemblage
**ignore** → **divergence structurelle** dès que la collection est matérialisée. Le risque est
**aujourd'hui LATENT** (collection non matérialisée en canon ; surface « éléments » sans écriture) —
c'est une **dualité de CODE** (deux écritures possibles vers deux dossiers), pas encore une
**divergence de DONNÉES**. Câbler naïvement `pool_write("workflows")` en 5c **sans trancher** ferait
passer la dualité de latente à **active** (deux maisons éditables du même workflow). D'où ce cadrage.

---

## 2. VÉRITÉ UNIQUE — options, conséquences, recommandation

Trois modèles possibles ; on tranche au regard de la **constitution déjà gravée**
(`constitution-modele-de-frame.md`) et de la mémoire `iakaframe-reservoir-de-frames`.

### Rappel constitutionnel (contraignant)
- **C-1** : `library/` est un pot **plat et partagé** ; **`workflows`** y figure nommément ;
  chaque élément a **`id == nom de fichier`, unique et définitif**.
- **C-2** : **la méthode porte des ids d'éléments** — dont **`workflowId`**. L'élément est
  **référencé par id**, jamais recopié (I1/E2).

Le workflow est donc **constitutionnellement un atome de pool référencé par id**. Ce n'est pas une
préférence d'implémentation : c'est déjà gravé, et déjà réalisé côté résolution (`checkFrameRefs`).

### Option A — le workflow est un élément de POOL (`library/workflows/<id>.md` = la vérité) — **RECOMMANDÉE**
La collection/méthode **référence par id** ; **les deux surfaces lisent/écrivent le même `.md` de
pool** via `pool_write("workflows", …)`.
- **Où l'écriture atterrit** : `<home>/library/workflows/<id>.md` — **une seule maison**.
- **Surface « éléments »** : amorcée sur la **source réelle** `frame.workflows` (dérivée **promue**,
  patron `frame.principles`/`frame.personas` du 5b), repli hors-ligne `WORKFLOW_CATALOG` conservé ;
  `onSubmit` → `poolWrite("workflows", …)` (création ET édition).
- **Surface « méthode » (`WorkflowAtelier`)** : **re-pointée** de `libraryWrite("workflows")`
  (collection) vers `poolWrite("workflows")` (pool). Les deux surfaces convergent sur le **même**
  fichier de pool. **La seconde maison éditable disparaît.**
- **Migration** : le canon n'a **aucun** `<home>/workflows/` → **rien à déplacer, non destructif par
  construction**. La « migration » est un **re-pointage de code**, pas un déplacement de fichier. Pour
  un `IAKAFRAME_HOME` utilisateur qui aurait un legacy `<home>/workflows/<id>.md` : garde **one-shot,
  non destructive, byte-préservante** — si le pool ne porte pas cet id, **copier** le legacy vers
  `library/workflows/<id>.md` (même id, C-1) ; **ne jamais supprimer** le legacy. MVP : le legacy
  n'est plus ni écrit ni lu comme vérité d'authoring (chemin retiré, § 3).
- **Non-régression des deux surfaces** : la surface « éléments » **gagne** la persistance (elle n'en
  avait aucune) ; la surface « méthode » **édite désormais la vérité** (le pool) au lieu d'une copie
  orpheline — c'est une **correction**, pas une régression.
- **`vendor-check`** : le workflow est **déjà vendoré** (famille `workflow`, `EXPECTED_COPIES`
  inchangé). Le canon `library/workflows/iakaframe-3phases.md` **reste byte-identique** (seul le
  **chemin d'écriture** change, jamais le contenu canon) → **drift 0 préservé sans nouvelle fixture
  ni bump**.
- **Cohérence archi** : **exactement** « éléments de 1er ordre référencés par id » (constitution
  C-1/C-2, mémoire réservoir). Aucune inversion de modèle.

### Option B — le workflow vit dans la COLLECTION (inline dans l'assemblage) ; « éléments » = vue lecture — **REJETÉE**
Ferait de `<home>/workflows/` la vérité et du pool une projection read-only.
- **Conséquence** : la méthode devrait résoudre `workflowId` **contre la collection**, brisant le
  modèle des 8 pools ; il faudrait re-pointer `poolAtomId`, `checkFrameRefs`, la vendorisation (qui
  source le pool) et le catalogue d'intégrité. **Blast radius élevé, anti-constitution** (C-1/C-2
  gravent l'inverse). Rejetée.

### Option C — hybride avec règle de canonicité — **REJETÉE au MVP**
Pool = canon, collection = cache/legacy read-only. C'est **A moins le retrait** : conserve deux
espaces à garder synchrones pour **zéro bénéfice MVP**, et laisse le risque de divergence entrouvert.
A **subsume** C plus proprement en **retirant** le chemin collection. Rejetée au MVP (réouvrable si un
besoin réel de vue collection émergeait — non identifié).

**➡️ Recommandation : Option A.** Le pool `library/workflows/<id>.md` est la **vérité unique**. On
**retire** le chemin d'écriture collection. Les deux surfaces convergent sur `pool_write("workflows")`.
Aucune migration destructive (collection non matérialisée en canon).

---

## 3. IMPACT SUR LE LOT 5c — sous-lot **5c-workflow**, séquencé APRÈS les atomes

### 3.1 — Ce que le workflow N'a PAS besoin (déjà là, à réutiliser)
- **Parseur** : `parseWorkflow` / `parseWorkflowFrontmatterMd` existent. **Rien à créer.**
- **Sérialiseur** : `serializeWorkflowMd` (+ `workflowToMd`/`mdToWorkflow`) existent, byte-fidèles.
  **Rien à créer.**
- **Writer Rust** : `pool_write("workflows")` **déjà accepté** (`.md` plat sous `library/workflows/`,
  hors garde skills). **ZÉRO Rust** (contrairement à 5c-2 skills).
- **Vendorisation** : famille `workflow` **déjà** dans `fixtureTable()` / `EXPECTED_COPIES`.
  **Aucune nouvelle fixture, aucun bump.**

### 3.2 — Ce que 5c-workflow DOIT livrer (petit, mais c'est une CONVERGENCE d'assemblage)
1. **Promotion `frame.workflows`** (cœur, addition pure) : liste riche `Workflow[]` promue depuis les
   `.md` du pool `workflows` déjà lus (patron `frame.principles`/`frame.personas` du 5b). Source unique
   des fiches du réservoir workflow.
2. **Surface « éléments » branchée sur le disque** : `workflowKind` amorce sa grille sur
   `frame.workflows` (repli `WORKFLOW_CATALOG` = repli hors-ligne) ; `onSubmit` → `poolWrite`.
3. **Surface « méthode » re-pointée** : `WorkflowAtelier`/son onSubmit écrit via **`poolWrite`**
   (`library/workflows/`), **plus** via `libraryWrite("workflows")` (collection). **Préservation du
   corps** à l'édition : ré-émettre avec `serializeWorkflowMd(wf, verbatimBody(original))` (le workflow
   est **entièrement modélisé** dans le frontmatter — phases/gates/kind — donc la ré-émission canonique
   est légitime ; seul le **corps prose** doit être préservé, l'atelier n'ayant pas d'éditeur de corps).
4. **Retrait du chemin collection** : retirer `"workflows"` de `LibraryCollection` (ou le marquer
   déprécié/read-only), pour qu'**aucune** seconde écriture divergente ne subsiste (**contrainte dure :
   une seule écriture**). A-CONF : vérifier au préalable qu'aucun autre appelant ne dépend de
   `libraryWrite("workflows")`.
5. **Garde de migration one-shot** (si utile) : import non destructif d'un legacy `<home>/workflows/`
   vers le pool (§ 2 Option A), byte-préservant, C-1. MVP : optionnel (canon n'en a pas).

### 3.3 — Nature ≠ atomes : pourquoi un **sous-lot séquencé**, dans le même parapluie 5c
Roles/guardrails/skills sont des **atomes à round-trip scalaire** (parseur + patch non-destructif +
vendorisation). Le workflow, lui, est une **convergence d'assemblage** : pas de parseur/sérialiseur/
Rust/fixture neufs, mais **le retrait d'un chemin d'écriture** et le **re-pointage de deux surfaces**
vers la vérité unique. C'est **peu de code mais un geste d'architecture** (l'unique acte structurant du
5c). Sa **persistance est structurelle** (phases/gates), pas un patch de scalaires — modèle de
persistance **différent** des atomes.

**Verdict de découpage.** Le workflow **reste dans le lot 5c** (le décideur l'a demandé) mais comme
**sous-lot distinct `5c-workflow`, séquencé APRÈS `5c-atomes` (roles+guardrails+skills)**. Motifs :
(1) **MVP + anti-emmêlement** — isoler l'unique geste d'archi (retrait du chemin collection) du
round-trip des atomes ; (2) **nature différente** (convergence vs atome) ; (3) **faisable en un seul
lot** car réellement petit (**zéro Rust, zéro parseur, zéro fixture, zéro bump**) — le décideur peut le
**fusionner** avec 5c-atomes s'il veut de l'élan, le risque restant faible. Ordre recommandé :
**5c-1 (roles+guardrails) → 5c-2 (skills) → 5c-3 (workflow, convergence)**.

---

## 4. Objectif fermé & critères d'acceptation (mesurables)

Faire du **pool `library/workflows/<id>.md` la vérité unique** du workflow, les deux surfaces
d'édition convergeant dessus, **sans aucune double écriture**, **sans migration destructive**, **sans
drift cross-repo**. Additions/re-pointages rétrocompatibles ; contrats de `frontmatter.ts`
byte-inchangés (on **réutilise** `serializeWorkflowMd`/`verbatimBody`, on ne les modifie pas).

- **AC-W1 — vérité unique (DUR).** Après le lot, **une seule** écriture d'authoring du workflow existe :
  `pool_write("workflows", id, text)` → `<home>/library/workflows/<id>.md`. Le chemin
  `libraryWrite("workflows")` (collection `<home>/workflows/`) **n'est plus emprunté par aucune
  surface** (retiré ou dégradé read-only). **Aucun** flux ne produit deux écritures divergentes du même
  workflow (grep de non-régression : `libraryWrite(.*workflows` hors legacy = 0 au A-CONF).

- **AC-W2 — `frame.workflows` promu (cœur, addition pure).** `buildFrame` expose `frame.workflows:
  Workflow[]`, dérivé des `.md` du pool `workflows` déjà lus (patron `frame.principles`). Aucune
  signature existante modifiée ; `poolIds.workflows`/`parseWorkflowRefs`/`checkFrameRefs` inchangés.

- **AC-W3 — les deux surfaces écrivent le pool.** La surface « éléments » (`workflowKind`) amorce sur
  `frame.workflows` (repli `WORKFLOW_CATALOG` = hors-ligne) et son `onSubmit` (création + édition)
  appelle `poolWrite("workflows", …)` ; la surface « méthode » (`WorkflowAtelier`/onSubmit) écrit elle
  aussi via `poolWrite("workflows", …)`. Après écriture, la grille/atelier reflète le disque (relecture).

- **AC-W4 — round-trip byte non destructif à l'édition (DUR).** Éditer un workflow existant réécrit
  `library/workflows/<id>.md` en **préservant le corps prose** (`serializeWorkflowMd(wf,
  verbatimBody(original))`) ; un workflow **ouvert et ré-enregistré sans changement** est
  **byte-identique** (ré-émission canonique du frontmatter frame-format + corps verbatim). C-1 : l'`id`
  (= nom de fichier) **jamais renommé**.

- **AC-W5 — migration non destructive (DUR).** Aucun fichier `library/workflows/*.md` du canon n'est
  déplacé, renommé ni supprimé. Un éventuel legacy `<home>/workflows/<id>.md` est **importé par copie
  byte-préservante** vers le pool si absent (même id, C-1) et **jamais supprimé**.

- **AC-W6 — parité cross-repo drift 0 (DUR).** `iakaframe vendor-check --strict` reste **drift 0**,
  `EXPECTED_COPIES` **inchangé** (le workflow est déjà vendoré ; le canon
  `library/workflows/iakaframe-3phases.md` reste **byte-identique** — seul le chemin d'écriture change).
  **Aucune** nouvelle fixture workflow, **aucun** bump pour ce sous-lot.

- **AC-W7 — constitution & non-régression (DUR).** `iakaframe frame lint --all --strict` reste exit 0 ;
  la résolution `method.workflowId → library/workflows/` (`checkFrameRefs`) inchangée ; les
  sérialiseurs de contrat de `frontmatter.ts` byte-inchangés. Hors Tauri, dégradation propre
  (`BACKEND_UNAVAILABLE_MSG`, jamais une stack).

- **AC-W8 — suites vertes.** `vitest` + `tsc` + `eslint` (GUI) verts ; test de parité `vendor-check`
  vert (drift 0) ; born-red d'AC-W1 (pas de double écriture) et AC-W4 (round-trip byte) naissent rouges
  puis verts.

---

## 5. Critère d'ouverture d'exécution (A-CONF) — à confirmer sur pièce avant code
L'outillage de listage du cadrage est indisponible (`Glob`/`Grep` en échec, ripgrep absent) ; le
contrat ci-dessus fait foi, mais l'exécutant **localise et confirme** : (a) tous les appelants de
`libraryWrite("workflows")` / `LibraryCollection` incluant `"workflows"` (pour retirer le chemin sans
casser un appelant) ; (b) le point d'`onSubmit` de `WorkflowAtelier` (via `WorkflowElementEditor`) où
insérer `poolWrite` + relecture ; (c) que `frame.ts` n'expose **pas encore** `frame.workflows` riche
(seulement `poolIds.workflows`) → à promouvoir ; (d) l'existence (ou non) d'un legacy `<home>/workflows/`
dans les homes runtime ciblés (migration one-shot). Toute divergence mesure/disque est **signalée au
gate**.

---

## 6. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Sous-lot 5c-workflow : ~0,75–1 j-h.** Promotion `frame.workflows` (~0,2) ; branchement source réelle + `onSubmit` `poolWrite` des deux surfaces (~0,25) ; re-pointage `WorkflowAtelier` + préservation corps (`verbatimBody`) (~0,2) ; retrait du chemin collection + garde migration one-shot (~0,15) ; born-red AC-W1/AC-W4 + suites (~0,2). **ZÉRO Rust, ZÉRO parseur/sérialiseur neuf, ZÉRO fixture, ZÉRO bump.** Additionné au 5c global (`persistance-5c…` § 8 : ~2–3,25 j-h) → **lot 5c complet ≈ 2,75–4,25 j-h**. |
| **Complexité / risque** | **FAIBLE à MOYENNE.** Aucun code neuf de (dé)sérialisation (tout existe) ; l'unique geste d'archi est le **retrait du chemin collection** — chirurgical mais à faire **sans casser un appelant** (A-CONF). La persistance est **structurelle** (phases/gates), donc édition = **ré-émission canonique + corps verbatim**, pas un patch scalaire : modèle différent des atomes, mais l'outillage (`serializeWorkflowMd`, `verbatimBody`) est **déjà éprouvé**. Risque cross-repo **nul en pratique** (déjà vendoré, canon byte-inchangé). |
| **Inconnues (susceptibles de faire glisser)** | (1) **Appelants de `libraryWrite("workflows")`** non énumérés au cadrage (A-CONF) : si le retrait touche plus de surfaces que prévu, +0,25 j-h. (2) **Legacy `<home>/workflows/`** matérialisé chez un utilisateur : la garde de migration one-shot devient nécessaire (sinon optionnelle). (3) **Préservation du corps** à l'édition : confirmer que `WorkflowAtelier` peut ré-injecter `verbatimBody(original)` (l'atelier n'édite pas le corps) sans le perdre. (4) `frame.workflows` : vérifier qu'aucune vue ne présuppose l'absence de la dérivée (addition pure attendue). |

> Rappel méthode : estimation **rappelée à la clôture du lot**, confrontée au temps réel, pour affiner
> les suivantes. Pas un engagement ferme.

---

## 7. Récapitulatif des tranches (pour le décideur)

1. **Cartographie** → deux vies : **POOL** `library/workflows/<id>.md` (vérité de l'assemblage,
   vendorée, matérialisée, référencée par `method.workflowId`) et **COLLECTION** `<home>/workflows/<id>.md`
   (onglet « méthode » éditable via `library_write`, **non matérialisée en canon**, jamais lue par la
   méthode). Conflit = **deux chemins d'écriture, même id/forme, deux dossiers** ; risque **latent** de
   copie orpheline (§ 1.3).
2. **Vérité unique** → **Option A** : le **pool** est la vérité ; les deux surfaces convergent sur
   `pool_write("workflows")` ; le chemin collection est **retiré**. Constitutionnellement aligné
   (C-1/C-2 : élément plat référencé par id). B et C rejetées (§ 2).
3. **Migration** → **non destructive par construction** (canon sans collection matérialisée) ;
   legacy éventuel **importé par copie**, jamais supprimé, id inchangé (C-1).
4. **Découpage 5c** → workflow **dans le lot 5c** mais **sous-lot `5c-workflow` séquencé APRÈS les
   atomes** (nature = convergence d'assemblage, pas atome) ; **fusionnable** avec 5c-atomes si le
   décideur veut de l'élan (petit : zéro Rust/parseur/fixture/bump).
5. **Cross-repo** → `vendor-check --strict` **drift 0**, `EXPECTED_COPIES` **inchangé** (déjà vendoré,
   canon byte-inchangé) — verdict **VERT**.

---

## 8. Sources & renvois (canon interne)
- `constitution-modele-de-frame.md` § 1 (C-1 pot plat partagé, `workflows` élément à `id == fichier` ;
  C-2 méthode porteuse de `workflowId`) — **fonde l'Option A**.
- `persistance-5c-roles-guardrails-skills.md` § 3 / AR-4 / § 9.3 — **verdict « HORS 5c » révisé** ;
  amendés en renvoi vers ce fichier.
- Mémoire `iakaframe-reservoir-de-frames` (library plate = pot commun ; assemblage = ids par référence).
- Faits mesurés (`preuve-avant-declaration`) : `methods/iakaframe.md` (`workflowId`),
  `library/workflows/iakaframe-3phases.md` (canon frame-format), absence de
  `~/work/iakaframe/workflows/` (collection non matérialisée), `cli/src/lib/vendor.js`
  (famille `workflow` déjà vendorée, `EXPECTED_COPIES = 45`), `packages/core/src/frame.ts`
  (`poolIds.workflows`, pas de `frame.workflows` ; résolution `workflowId` contre le pool),
  `packages/core/src/frontmatter.ts` (`serializeWorkflowMd`/`verbatimBody`), `src/api/backend.ts`
  (`LibraryCollection` inclut `workflows` = collection ; `poolWrite` accepte `workflows`),
  `src/forge/ateliers/WorkflowAtelier.tsx` (édite `workflows/{id}.md`), `src/forge/workflowKind.tsx` +
  `workflowCards.ts` (source `WORKFLOW_CATALOG`, édition de session sans écriture disque).
