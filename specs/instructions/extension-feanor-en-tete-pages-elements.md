# Instruction — Étendre **Fëanor-en-tête** aux pages-éléments : généraliser le patron « réservoir + fiche + création/édition » du persona aux autres pools

> Cadrage P1 (🔵 **Gandalf**, 2026-07-26), sur mission Aragorn (chantier #3 priorisé décideur).
> **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture Gandalf est
> bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli (cross-repo `iakaFrameGUI`), gate
> P2→P3 = 🏹 Legolas.
>
> **Suite déclarée de deux lots livrés.** (1) `alignement-gui-modele-de-frame.md` § 4 Lot 3 (Fork F) a
> fait de la **persona** un élément de 1er ordre avec **réservoir + fiche + création/édition**
> (`PersonaReservoir.tsx`) ; (2) `feanor-en-tete-fonctionnel-llm.md` (chantier #1, mergé) a rendu
> `FeanorHead` **fonctionnel** (conseil/chat branché sur le LLM Ollama, MVP-A). La présente instruction
> **généralise** ce patron aux **autres pages d'authoring d'élément**, conformément à la volonté
> décideur (« dans chaque page un bouton *New* ; en création/édition, Fëanor se glisse en tête »).
>
> **Constats mesurés sur le disque le 2026-07-26** — `preuve-avant-declaration`. Côté iakaframe :
> `~/work/iakaframe` (réservoir/canon, v0.27.0). Côté GUI : `~/work/iakaFrameGUI` (lecture seule, les
> deux dépôts). Citations par **nom de fichier / de symbole**, jamais par `chemin:ligne` (les pointeurs
> chiffrés vieillissent ; le message de remise à Aragorn porte, lui, les `chemin:ligne` cliquables).
>
> **Où vit cette instruction & doctrine cross-repo.** L'exécution touche le **dépôt GUI** (`src/`). Le
> cadrage est versé **ici, dans le canon** (comme ses parents). **Avant que Gimli ne code**, en verser
> un miroir dans `~/work/iakaFrameGUI/specs/instructions/` (pattern établi).

---

## 0. Reframe décisif (mesuré) — le vrai nœud n'est pas « monter Fëanor », c'est le **pré-requis fiche+édition**

Le brief dit « étendre `FeanorHead` aux autres pages-éléments ». La mesure recadre : **`FeanorHead`
est déjà générique dans sa forme** (il prend `mode` / `entity` / `feanorSource`), et le monter est
**trivial** là où une page d'authoring d'élément existe. Le problème réel est qu'**une seule page
d'authoring d'élément existe** — la persona. Pour tous les autres éléments de `library/`, **il n'y a
ni réservoir, ni fiche, ni mode création/édition** : ils ne sont que des **catalogues read-only
référencés par id**. Donc **« étendre Fëanor-en-tête » = d'abord construire les pages qui l'accueillent.**

---

## 1. Le besoin, reformulé (le problème avant la solution)

Rendre **chaque élément de 1er ordre de `library/`** (au sens de la constitution C-5 : persona **et**
skill, plus principe, rituel, garde-fou, rôle, scaffold, workflow) **authorable** dans le GUI sur le
**même patron que la persona** — un **réservoir** (grille de fiches à vignettes), un bouton **New**
(✚ création), la **sélection d'une fiche → mode édition** (✎), et **Fëanor-en-tête** (le composant
déjà fonctionnel) **glissé en haut** en création ET en édition. Le tout **sans copier-coller** le
montage N fois (une **page-élément générique**), **sans** toucher un contrat de données au MVP, et
**MVP d'abord** (1 pool pilote + la factorisation, le reste en itérations).

---

## 2. Ce qui existe déjà — MESURÉ (le cœur du cadrage)

### 2.1 Le patron de référence — la **persona** (page d'authoring d'élément COMPLÈTE)

`src/forge/PersonaReservoir.tsx` porte **tout** le patron cible, à répliquer :

- **Réservoir** = grille de fiches à vignettes (`buildPersonaReservoir`, `personaCards.ts`), source =
  personas réelles parsées du frame (`reservoirPersonasFromFrame(loadFrame())`), repli hors-ligne
  `cloneCanonicalRoster()`.
- **Modes** `grid` / `create` / `edit` (état local). **New** → `PersonaFiche mode="create"` ;
  clic sur une fiche → `PersonaFiche mode="edit"`.
- **`PersonaFiche`** = coquille de fiche : fil d'Ariane + **pastille de mode** (`✎ édition`/`✚
  création`) + **`<FeanorHead mode entity feanorSource />` monté en tête** + le formulaire
  (`PersonaEditor`).
- **Édition = état local de session** (MVP, **aucune écriture disque** ; la persistance
  `library/personas/` est explicitement différée à « un chantier I/O ultérieur »).

### 2.2 `FeanorHead` — déjà fonctionnel, mais **couplé à `Persona`**

`src/forge/FeanorHead.tsx` (+ `feanorHeadModel.ts`) : bande d'en-tête vignette-entité + vignette-Fëanor
+ prompt + réponse LLM réelle (chantier #1). **Contrat d'entrée déjà quasi générique** : `mode:
"create"|"edit"`, `entity: Persona | null`, `feanorSource?: Persona[]`. **Trois points de couplage à
`Persona`** mesurés, à décoincer pour généraliser :
1. `entity: Persona | null` (type) ;
2. `feanorHeadModel.buildEntityVignette(entity: Persona)` hard-code `typeLabel: "persona"` et lit
   `entity.roleIndex`/`entity.name`/`entity.pastille` ;
3. `handleSend` hard-code `entityType: "persona"` dans le contexte passé à `resolveAdvice`.
Tout le reste (transport LLM, identité Fëanor, honnêteté, badge) est **agnostique de l'entité**.

### 2.3 Les autres surfaces de la nav 9 (`ForgeShell.tsx`) — **mesure par surface**

| Entrée nav | Composant | A-t-elle un mode **création/édition d'un élément** (patron persona) ? |
|---|---|---|
| `persona` | `PersonaReservoir` | **OUI** — réservoir + fiche + create/edit + **FeanorHead monté**. *(la référence)* |
| `team` | `TeamAtelier` (via `teamDoc`) | **Non — c'est un DOCUMENT-assemblage** (New/Open/Save d'un `team.md` entier), pas la fiche d'un élément. Porte un `CopiloteShell` (console d'atelier). |
| `méthode` | `MethodeAtelier` / `WorkflowAtelier` (`methodDoc`/`workflowDoc`) | **Non — DOCUMENT-assemblage.** Les éléments (principes, rituels, gardes, rôles, scaffolds) n'y sont que des **catalogues read-only insérés par id** (`insertMethodRef`), jamais une fiche éditable. Porte un `CopiloteShell`. |
| `kit` | `KitAtelier` (`kitDoc`) | **Non — DOCUMENT-assemblage** (méthode + team + binding). |
| `apprentissage` | `LearningAtelier` | **Non** — pilote de revue (`iakaframe review`), aucun document, aucune fiche. |
| `éléments` | `ElementPoolPanel` | **Non — read-only.** Rail-accordéon du **stock** (ids + comptes) via `buildElementPool` ; pas de fiche, pas d'édition. *(hôte candidat, § 4.)* |
| `frame` | `OpenFramePanel` | **Non** — panneau read-only (intégrité, facette portefeuille, sélecteur de frame active). |
| `assemblage` | `AssemblyView` | **Non** — écran read-only du récit « frères » (seul geste : bascule de frame active). |
| `models` | `FramesGallery` | **Non** — galerie read-only ; le seul geste est **choisir** une frame active (pas créer/éditer un élément). |

**Fait central mesuré : le patron « réservoir + fiche + create/edit + FeanorHead » n'existe QUE pour
la persona.** Les entrées `team`/`méthode`/`kit` ont un **cycle de document** (DocBar) et un
`CopiloteShell`, mais ce sont des **assemblages** (elles composent **par référence d'ids**), pas des
**fiches d'élément individuel**. Les 7 autres types d'éléments de 1er ordre (skill, principe, rituel,
garde-fou, rôle, scaffold, workflow) **ne s'éditent nulle part comme éléments** : ils vivent en
**catalogues du cœur** (`CATALOG_SKILLS`, `CATALOG_PRINCIPLES`, `CATALOG_RITUALS`,
`CATALOG_GUARDRAILS`, `CATALOG_SCAFFOLDS`, `CANONICAL_ROLES`, `WORKFLOW_KINDS`) **insérés par id**.

### 2.4 Ce que le cœur expose déjà (utile au MVP GUI-only)

- **Catalogues canoniques vendorés** (dans `@iakaframe/core`, déjà en parité) : `CATALOG_SKILLS`
  (`{id,label,roleKey}`), `CATALOG_PRINCIPLES` (`{id,label,policy,trigger}`), `CATALOG_RITUALS`
  (`{id,label,side}`), `CATALOG_GUARDRAILS` (`{id,label}`), `CATALOG_SCAFFOLDS` (`{id,level}`),
  `CANONICAL_ROLES` (`{key,label}`), `WORKFLOW_KINDS`.
- **Element-pool** (`buildElementPool`, `ELEMENT_POOL_COMPOSITION`) : par type, les **ids réels
  scannés du frame** (`frame.poolIds[type]`) + les **comptes** — mais **PAS les corps/champs parsés**
  des éléments non-persona (contrairement à `frame.personas`, qui expose des `Persona` complètes).
- **Vignettes** : `casting.ts` (`vignetteGradient`, `initialsOf`) — agnostique.

**Asymétrie décisive** : la persona est le **seul** pool dont le cœur surface les **objets parsés
complets** (`frame.personas`, champs éditables). Pour les autres pools, le cœur ne surface aujourd'hui
que **ids + comptes** (via l'element-pool) et les **catalogues canoniques**. Cette asymétrie **fonde
le verdict cross-repo** (§ 6).

---

## 3. Où Fëanor-en-tête doit apparaître (la liste cible fermée)

**Règle de placement (honnête au sens du #1) : Fëanor-en-tête n'a de sens QUE sur une page d'authoring
d'un élément de 1er ordre** — là où l'on **crée/édite une entité** avec sa vignette. Donc :

**Cibles (pages d'authoring d'élément — FeanorHead en tête, création ET édition) :**
1. **persona** — ✅ déjà fait (référence).
2. **skill**
3. **principe** (principle)
4. **rituel** (ritual)
5. **garde-fou** (guardrail)
6. **rôle** (role)
7. **scaffold**
8. **workflow** *(cas riche — voir § 5.4 : éditeur existant `WorkflowAtelier` + `kind`/phases/gates ;
   son intégration au patron est une itération à part).*

**Hors cible (jamais de FeanorHead) :**
- **Read-only** : `frame` (`OpenFramePanel`), `assemblage` (`AssemblyView`), `models`
  (`FramesGallery`), `apprentissage` (`LearningAtelier`).
- **Documents-assemblage** : `team`, `méthode`, `kit` — ce ne sont **pas** des fiches d'élément ; ils
  composent par référence et portent **déjà** un `CopiloteShell` (assistant d'atelier, registre
  distinct de FeanorHead — cf. #1 § 0.3 « les deux surfaces ne sont pas redondantes »). **Ne pas y
  monter FeanorHead au MVP** (éviterait un double-emploi Fëanor sur la même surface).

---

## 4. La solution proposée — une **page-élément générique** + un `FeanorHead` **agnostique**

Deux gestes de factorisation (les deux **GUI-only**, `src/`), pour ne pas copier-coller le montage 8×.

### 4.1 Décoincer `FeanorHead` de `Persona` (contrat d'`entity` générique)

Introduire un **descripteur d'entité générique** (view-model, `src/`) que `FeanorHead` consomme à la
place de `Persona`. Contrat proposé :

```
AuthoredEntity = {
  type: string;        // le pool : "persona" | "skill" | "principle" | "ritual" | ...
  typeLabel: string;   // libellé FR affiché ("persona", "skill", "principe"...)
  name: string;        // nom/id affiché de l'élément en cours
  key: string | null;  // clé secondaire : roleKey (persona), roleKey (skill), side (ritual), ø sinon
  roleIndex: number;   // pour le dégradé de vignette (casting) ; défaut stable si absent
  pastille: string | null;
}
```

- `buildEntityVignette` prend `AuthoredEntity | null` (au lieu de `Persona`) → vignette générique
  (initiales + dégradé casté par `roleIndex`/type, placeholder honnête « Nouveau {typeLabel} » en
  création vierge). **Aucune fausse identité** (règle #1 préservée).
- `handleSend` passe `entityType: entity.type` (au lieu de `"persona"` en dur) dans `resolveAdvice`.
- **Adaptateur persona** : une fonction `personaToAuthoredEntity(p: Persona)` conserve l'existant sans
  régression (la persona reste un cas de l'entité générique). Tout le reste de `FeanorHead`
  (transport, identité, honnêteté, badge) **inchangé**.

### 4.2 Une **page-élément générique** (hôte réutilisable)

Extraire de `PersonaReservoir`/`PersonaFiche` un hôte générique — nommé p. ex. `ElementReservoir` +
`ElementFiche` — **paramétré** (patron « composant générique + injection », conforme à l'état de l'art
React 2026, sources § fin) :

- **props d'assemblage** : `type` (le pool), `loadElements()` (source de la liste), `buildCards()`
  (projection vignettes, sœur de `buildPersonaReservoir`), et **le composant éditeur injecté**
  (`editor: (entity, onSubmit, onCancel) => ReactNode`) — comme `PersonaEditor` l'est pour la persona.
- **`ElementFiche`** monte `<FeanorHead mode entity={toAuthoredEntity(sel)} feanorSource={personas} />`
  en tête (création ET édition) — **une seule fois**, réutilisé par tous les types.
- **`PersonaReservoir` devient un cas** de l'hôte générique (ou partage `ElementFiche`) — **prouver la
  non-régression** (tests persona verts, FeanorHead persona inchangé). *Reco : ne pas réécrire
  `PersonaEditor` ; le brancher tel quel dans l'hôte générique.*
- **Hôte de nav = l'entrée `éléments`.** L'entrée `éléments` (aujourd'hui `ElementPoolPanel`
  read-only) devient le **réservoir d'éléments authorables** : un **sélecteur de type**
  (skill/principe/rituel/…) → grille de fiches → New/édition, **exactement le geste décideur**
  (« réservoir à gauche, sélection → édition, Fëanor en tête »). C'est la réponse à la question
  d'Aragorn : **oui, `éléments` est le bon hôte** pour la fiche+édition générique des pools
  non-persona. *(Alternative : une entrée de nav par type — écartée, alourdit la nav 9→16 ; le
  sélecteur de type dans `éléments` est plus sobre et MVP.)*

### 4.3 Source des fiches au MVP — **catalogues canoniques** (GUI-only, honnête)

Pour chaque pool non-persona, la liste et les champs éditables **au MVP** dérivent du **catalogue
canonique du cœur** (déjà vendoré : `CATALOG_*` / `CANONICAL_ROLES`), **croisé** avec les **ids réels**
de l'element-pool (`frame.poolIds[type]`) pour signaler ce qui est réellement présent. **Édition = état
local de session** (aucune écriture disque) — **strictement le même MVP que la persona**
(`PersonaReservoir` ne persiste pas non plus). Honnêteté : la source est le **catalogue canonique
étiqueté comme tel**, jamais une donnée fabriquée — miroir exact du repli `cloneCanonicalRoster()` de
la persona.

---

## 5. Découpage en lots — MVP d'abord, puis itérations

> Principe : la **factorisation d'abord** (pour ne pas copier-coller), **un pool pilote** pour prouver
> le patron de bout en bout, puis **itérer les pools restants** un ou deux à la fois. Chaque lot est
> **livrable et gaté seul** (parité verte, gate GUI vert à chaque fin de lot).

### Lot 1 — MVP : factorisation + **1 pool pilote** *(le cœur de valeur)*
- **1a** — `FeanorHead`/`feanorHeadModel` **agnostiques** (§ 4.1) + adaptateur persona ; persona
  **inchangée fonctionnellement** (tests verts).
- **1b** — hôte générique `ElementReservoir`/`ElementFiche` (§ 4.2) ; `PersonaReservoir` **rebasculé**
  dessus (ou partage `ElementFiche`) sans régression.
- **1c** — **1 pool pilote** authorable dans l'entrée `éléments` (sélecteur de type + grille + New +
  édition + **FeanorHead en tête**), source catalogue canonique (§ 4.3), édition locale de session.
  **Reco de pilote : `principe`** (`CATALOG_PRINCIPLES` = `{label,policy,trigger}` → éditeur
  représentatif mais petit) **ou `skill`** (`skill ← skills` = miroir exact de `team ← personas`,
  emblématique). *(À trancher décideur, § 7 FORK B.)*
- **j-h : 2,5–4** · **complexité : moyenne** (factorisation = le vrai risque ; parité tenue par
  construction, GUI-only).

### Lot 2 — itération : **2–3 pools de plus** (réutilisation pure de l'hôte)
- Ajouter garde-fou (`CATALOG_GUARDRAILS`, éditeur trivial `{id,label}`), rituel
  (`CATALOG_RITUALS`), rôle (`CANONICAL_ROLES`) — chacun = **un éditeur + un enregistrement dans le
  sélecteur de type**, l'hôte et FeanorHead **déjà en place**.
- **j-h : 1–2** · **complexité : faible** (pur remplissage).

### Lot 3 — itération : **scaffold + skill** (si non pris en pilote) — même mécanique.
- **j-h : 0,5–1,5** · **complexité : faible**.

### Lot 4 — **workflow** (cas riche, à part)
- Le workflow a **déjà** un éditeur (`WorkflowAtelier` : `kind` + phases + gates) et vit dans la
  sous-nav `méthode`. L'intégrer au patron réservoir+fiche+FeanorHead (ou y monter FeanorHead en tête
  de `WorkflowAtelier` en mode create/edit) est une **itération distincte** — l'éditeur existant
  n'est pas un simple formulaire de champs. **À cadrer/affiner à l'ouverture.**
- **j-h : 1–2** · **complexité : moyenne** (éditeur non trivial, ne pas casser la sous-nav méthode).

### Lot 5 — *(hors ce chantier, cross-repo, à re-cadrer)* — **fiches dérivées du réel + persistance**
- Faire dériver les fiches non-persona des **corps `.md` réels** (comme la persona dérive de
  `frame.personas`) **et** persister les éditions dans `library/<pool>/<id>.md`. **Cross-repo** : le
  cœur doit exposer des **parseurs + shapes typés** par pool et les **surfacer via `loadFrame`**
  (canon + fixtures en miroir, `vendor-check` drift 0, gate Legolas). C'est le pendant, pour tous les
  pools, du « chantier I/O ultérieur » déjà nommé pour la persona. **Hors MVP.**

**Ordre recommandé : 1 → 2 → 3 → 4**, Lot 5 différé (cross-repo). **Premier incrément de valeur = Lot
1** (factorisation + 1 pool + FeanorHead généralisé), défendable seul.

**Tranche du pré-requis modes création/édition (question d'Aragorn) :** l'option (a) « monter Fëanor
seulement là où les modes existent déjà » est **rejetée** — les modes n'existent QUE pour la persona
(déjà faite), donc (a) ne livrerait **rien de neuf**. On retient **(b) généraliser d'abord le patron**,
mais **par lots** (Lot 1 = factorisation + 1 pool, pas les 8 d'un coup) — c'est la lecture MVP-first de
(b), non un big-bang.

---

## 6. Verdict **cross-repo vs GUI-only**

- **MVP (Lots 1–4) = GUI-ONLY.** Tout se fait dans `src/` du GUI : généralisation de `FeanorHead`
  (addition `src/`), hôte générique (`src/`), fiches sourcées des **catalogues canoniques déjà
  vendorés** + ids de l'**element-pool déjà exposé**, édition **locale de session**, réutilisation de
  la **pile LLM du chantier #1**. **Aucun `packages/core/src/*` (sérialiseur/schéma/parseur) touché,
  aucun schéma vendoré, aucune fixture vendorée, aucun Rust.** `vendor-check` reste **drift 0 par
  construction** — c'est un **invariant de sortie**, pas un objet du chantier.
- **La dérivation réelle + persistance (Lot 5) = CROSS-REPO** — *hors ce chantier*. Elle exige
  d'exposer, côté cœur, les objets parsés des pools non-persona (parseurs + shapes + surfaçage
  `loadFrame`), donc canon + fixtures en miroir, `vendor-check` drift 0, gate Legolas. À re-cadrer
  séparément (règle anti-enchevêtrement : un lot touchant une fixture est cross-repo, ne se mène pas
  en dommage collatéral d'un lot d'UI).

**Reco : engager le MVP GUI-only (Lots 1–2 au moins), différer le cross-repo (Lot 5)** — cohérent avec
le MVP persona lui-même (édition locale, persistance différée), et sans risque de parité.

---

## 7. FORKS décideur (Gandalf propose, le décideur tranche)

### FORK A — Hôte de nav des pages-éléments non-persona → **l'entrée `éléments` avec sélecteur de type** (reco)
- **Reco** : faire évoluer l'entrée `éléments` (`ElementPoolPanel` read-only) en **réservoir
  authorable** (sélecteur de type → grille → New/édition → FeanorHead). Sobre, MVP, fidèle au geste
  décideur, **nav 9 inchangée**.
- **Alternative écartée** : une entrée de nav par type (nav 9 → 16) — trop lourde.
- **À trancher** : confirmer `éléments` comme hôte (vs entrées dédiées).

### FORK B — **Pool pilote** du Lot 1 → **`principe`** (reco) ou **`skill`**
- **`principe`** : éditeur `{label, policy, trigger}` **représentatif mais petit** → bonne preuve du
  patron générique sans se noyer.
- **`skill`** : `skill ← skills` est le **miroir exact** de `team ← personas` (§ element-pool) →
  emblématique, mais champs un peu plus riches (roleKey de scoping).
- **À trancher** : `principe` (le plus propre pour prouver la factorisation) ou `skill` (le plus
  emblématique). *(Reco Gandalf : `principe` en pilote, `skill` en Lot 3.)*

### FORK C — Faut-il un **FeanorHead sur les documents-assemblage** (team/méthode/kit) ? → **NON au MVP** (reco)
- Ces surfaces portent **déjà** un `CopiloteShell` (assistant d'atelier, registre propose-ops →
  matérialise). Y ajouter FeanorHead **doublerait** Fëanor sur la même page. **Reco : NON** ; on
  réserve FeanorHead aux **fiches d'élément** (son registre = conseil/chat sur l'entité en cours).
- **À trancher** : confirmer « pas de FeanorHead sur team/méthode/kit ».

### FORK D — **Périmètre du MVP** : jusqu'où pousser au Lot 1 ? → **factorisation + 1 pool** (reco)
- **Reco** : Lot 1 = factorisation + **1** pool pilote (pas 2). Les pools suivants sont du remplissage
  à faible risque (Lots 2–3) une fois l'hôte prouvé.
- **À trancher** : 1 pool (reco) ou 2 pools au Lot 1 ?

---

## 8. Contraintes DURES inscrites (rappel opposable à Gimli)

- **MVP d'abord** : factorisation + 1 pool au Lot 1 ; **jamais** les 8 pools d'un coup ; itérer.
- **Réutiliser l'existant** : `FeanorHead` (#1), `PersonaReservoir`/`PersonaFiche`/`PersonaEditor`
  (Lot 3 GUI), `casting.ts`, `buildElementPool`, les `CATALOG_*` du cœur, la pile LLM (#1). **Ne rien
  réimplémenter** (ni 2ᵉ transport, ni 2ᵉ éditeur de persona).
- **Constitution (C-1/C-5)** : éléments de 1er ordre, `id == nom de fichier`, **pas de renommage** ;
  au MVP **aucune écriture disque** (donc aucun risque de renommage/collision) — l'édition est locale.
- **Honnêteté (comme #1)** : la source des fiches non-persona (catalogue canonique) est **étiquetée**
  comme telle ; jamais une donnée fabriquée ; FeanorHead reste **honnête** (aucun appel LLM au
  montage, repli/aveu du #1 préservé, badge posé par l'UI, pas de ventriloquie).
- **Parité** : `vendor-check` (iakaframe) **drift 0** inchangé — **par construction** (GUI-only,
  addition `src/` au-dessus des contrats).
- **A-CONF** : le rendu est confronté aux **maquettes réelles** (`specs/mock/gui/01-library.html` =
  grille de fiches ; `02-feanor-prompt-element.html` = fiche + Fëanor-en-tête), ouvertes par
  l'exécutant.
- **Pas de nouvelle dépendance** : hôte générique en composition React native (générique + injection
  de composant + hook d'état), zéro lib.

---

## 9. Critères d'acceptation (mesurables — par lot)

- **A-PARITÉ (tous lots, DUR)** : à la fin de chaque lot — `vendor-check` (iakaframe) **drift 0**
  inchangé ; `git diff` sur `packages/core/src/*` (sérialiseurs/schéma/parseurs), schéma vendoré,
  fixtures vendorées et `src-tauri` = **vide** ; gate GUI vert : `npm run lint:all` = 0,
  `npm run test:all` = 0, **compte de tests non diminué**.
- **A1a — FeanorHead agnostique** : `FeanorHead` accepte une entité **générique** (`AuthoredEntity`) ;
  `entityType` passé à `resolveAdvice` = le **type réel** (plus « persona » en dur) ; la persona reste
  **fonctionnellement inchangée** (tests persona + FeanorHead persona verts). Prouvé en test avec au
  moins **deux types** d'entité.
- **A1b — hôte générique** : `PersonaReservoir` **passe par** l'hôte générique (ou partage
  `ElementFiche`) **sans régression** ; le montage de FeanorHead n'est **écrit qu'une fois**
  (pas de duplication).
- **A1c — pool pilote authorable** : dans l'entrée `éléments`, le type pilote (§ 7 FORK B) présente un
  **réservoir de fiches**, un bouton **New** (✚ création), la **sélection d'une fiche → ✎ édition**,
  et **FeanorHead en tête** en création ET édition ; édition **locale de session** (aucune écriture
  disque) ; source = **catalogue canonique étiqueté**. Conforme aux maquettes `01-library` /
  `02-feanor-prompt-element` (A-CONF).
- **A2/A3 — pools itérés** : chaque pool ajouté (garde-fou, rituel, rôle, scaffold, skill) réutilise
  l'hôte + FeanorHead **sans nouvelle duplication** ; New + sélection→édition + FeanorHead en tête ;
  édition locale de session.
- **A4 — workflow** *(si engagé)* : le workflow expose son authoring (réservoir/fiche **ou**
  FeanorHead en tête de `WorkflowAtelier` en create/edit) **sans casser** la sous-nav `méthode` ni le
  `kind`/phases/gates existants.
- **A5 — honnêteté & activation** : **aucun** appel LLM au montage d'une fiche ; FeanorHead conserve
  le repli/aveu honnête du #1 ; badge Fëanor `🟠 [FRAME][Fëanor]` posé par l'UI (ouverture/clôture),
  jamais par le modèle.
- **A6 — placement respecté** : **aucun** FeanorHead sur `frame`/`assemblage`/`models`/`apprentissage`
  (read-only) ni, au MVP, sur `team`/`méthode`/`kit` (documents-assemblage, déjà `CopiloteShell`).

---

## 10. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **MVP (Lot 1 : factorisation + 1 pool) ≈ 2,5–4 j-h.** Chantier GUI-only complet (Lots 1→4, tous pools non-persona sauf persistance) ≈ **5–9,5 j-h**, à engager **par lots gatés**. Le cross-repo (Lot 5, dérivation réelle + persistance) est **hors ce chiffrage** (à re-cadrer). |
| **Complexité / risque** | **Moyenne** pour le Lot 1 (la **factorisation** est le vrai risque : décoincer FeanorHead de `Persona` + extraire l'hôte sans régresser la persona). **Faible** pour les Lots 2–3 (remplissage sur hôte prouvé). **Moyenne** pour le workflow (Lot 4, éditeur non trivial). Parité **tenue par construction** (GUI-only, au-dessus des contrats). |
| **Inconnues (susceptibles de faire glisser)** | (1) **Maquettes non lues à ce cadrage** (outillage de listage indisponible, `rg` absent) → l'écart de détail au pixel de la fiche générique reste une inconnue jusqu'à A-CONF (`01-library`/`02-feanor-prompt-element`). (2) **Choix du pilote** (FORK B) et **de l'hôte** (FORK A) déplacent légèrement le coût. (3) **Workflow** (Lot 4) : intégrer un éditeur riche existant au patron peut coûter plus qu'un formulaire de champs. (4) **Tentation de dérive vers le réel** : si le décideur veut d'emblée les fiches **dérivées des `.md` réels** ou la **persistance disque**, on **bascule en cross-repo** (Lot 5) — sort de cette estimation GUI-only. (5) **Propreté du dépôt GUI** (espace de dev du décideur) à confirmer avant de brancher. |

> Rappel méthode : estimation **rappelée à la clôture du lot**, confrontée au **temps réel**. Ce n'est
> **pas** un engagement ferme.

---

## 11. Hors périmètre

- La **dérivation des fiches non-persona depuis les `.md` réels** et la **persistance disque**
  (`library/<pool>/`) — **cross-repo, Lot 5 différé** (§ 5/§ 6).
- Le **FeanorHead sur team/méthode/kit** (documents-assemblage, déjà `CopiloteShell`) — FORK C : NON
  au MVP.
- Toute évolution de `@iakaframe/core`, du schéma vendoré, des fixtures, du Rust.
- La **génération/écriture d'élément par Fëanor** depuis l'en-tête (MVP-B du #1, déjà écarté ; porté
  par `CopiloteShell` dans son registre).
- Le **web live** de Fëanor et le **streaming** (déjà hors périmètre au #1).

---

## Sources (faits externes vérifiés — obligation de sourcing)

- **Design de la factorisation** (page-élément générique = composant générique TypeScript + injection
  de composant éditeur + hook d'état ; render props quand le parent doit passer la donnée interne au
  rendu) — conforme à l'état de l'art React 2026 :
  [Building Reusable React Components in 2026 (Medium)](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4),
  [How to Create Reusable React Components: Best Practices 2026 (Codersera)](https://codersera.com/blog/how-to-create-reusable-react-components/),
  [Mastering TypeScript Generics in React for Component Reusability (Medium)](https://arnab-k.medium.com/mastering-typescript-generics-in-react-for-enhanced-component-reusability-f026ab76a0e4),
  [React Design Patterns: Complete Guide 2026 (TurboDocx)](https://www.turbodocx.com/blog/react-design-patterns),
  [How to Implement Generic Components in React with TypeScript (OneUptime)](https://oneuptime.com/blog/post/2026-01-15-generic-components-react-typescript/view).
- **Aucune décision de ce cadrage ne dépend d'un fait externe versionné** : posture MVP/réutilisation
  (aucune dépendance nouvelle, réutilisation de la pile LLM et des catalogues déjà en place) → aucune
  question de compatibilité de version ouverte. Faits déterminants **mesurés sur disque** (§ 2),
  l'existant primant sur l'état de l'art ici.
