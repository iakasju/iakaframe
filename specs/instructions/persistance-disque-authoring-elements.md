# Instruction — Persistance disque de l'authoring d'éléments (chantier #3, Lot 5)

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (chantier #3 « éléments
> authorables du réservoir GUI », Lot 5 priorisé par le décideur — le plus lourd). **Cadrage pur —
> ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture Gandalf est bornée à
> `specs/instructions/`. Exécution downstream = ⚒️ Gimli (**cross-repo** : canon iakaframe +
> `iakaFrameGUI`, § 7) ; gate P2→P3 = 🏹 Legolas.
>
> **Constats mesurés sur le disque le 2026-07-26** — `preuve-avant-declaration`. Deux dépôts :
> `~/work/iakaframe` (réservoir : CLI + `library/` canon + vendorage), et `~/work/iakaFrameGUI`
> (cœur `packages/core` + hôte React `src/` + backend Tauri `src-tauri/`). Lecture seule sur le code.
> Citations **par nom de fichier / de symbole** (les pointeurs chiffrés vieillissent) ; le message de
> remise à Aragorn porte les `chemin:ligne` cliquables.

---

## 0. Le constat qui recadre le besoin (à lire avant tout)

Le besoin — « rendre l'édition durable : lire depuis les `.md` réels, réécrire sur disque » — est
juste, mais la mesure **déplace le centre de gravité** et **désigne le vrai risque**. Trois faits
structurants, vérifiés sur pièces :

**Fait 1 — la lecture disque existe déjà ; l'écriture disque des pools, NON.**
- Côté backend Tauri (`src-tauri/src/library_store.rs`, façade `src/api/backend.ts`) : les pools
  `library/<type>/` sont **lisibles** (`pool_read`, `pool_read_all`, `pool_list`, `pool_present`)
  mais **read-only** — le commentaire Rust le dit noir sur blanc : « *la forge n'édite pas encore
  les atomes (E2 différé), mais doit les scanner* ». **Il n'existe AUCUN `pool_write`.**
- En regard, l'écriture existe **pour les collections** (`library_write` → `<home>/<collection>/<id>.md`,
  collections = teams/methods/kits/workflows/bindings/frames), avec sa garde non-destructive
  `library_exists` et son pathguard (`pathguard::safe_path` + `validate_id` + `validate_collection`).
  **Le writer de pool à créer est le calque exact de `write_in`/`library_write`**, réorienté vers
  `library/<pool>/` — c'est le pattern à réutiliser (l'analogue de ce que le brief appelle
  `write_active_frame`).

**Fait 2 — un seul pool a la chaîne complète ; les six autres sont des catalogues synthétiques.**
Mesure, pour CHAQUE pool, « le cœur sait-il parser son `.md` et le sérialiser (round-trip) ? » :

| Pool | Parseur `.md`→objet | Dérivé des `.md` réels | Sérialiseur objet→`.md` | Vendoré (fixtures) | Stockage |
|---|---|---|---|---|---|
| **personas** | `parsePersona` ✅ | **`frame.personas` ✅** (déjà mergé, lot enrichissement) | ❌ | ✅ 9 `.md` byte-à-byte | `<id>.md` |
| **principles** | `parsePrinciple` ✅ (parse-only) | ❌ (seulement `poolIds` + `CATALOG_PRINCIPLES`) | ❌ | ❌ | `<id>.md` |
| **rituals** | `parseRitual` ✅ (parse-only) | ❌ (`CATALOG_RITUALS`) | ❌ | ❌ | `<id>.md` |
| **scaffolds** | `parseScaffold` ✅ (parse-only) | ❌ (`CATALOG_SCAFFOLDS`) | ❌ | ❌ | `<id>.md` |
| **workflows** | `parseWorkflowMd` ✅ | ⚠️ ambigu (voir Fait 3) | **`serializeWorkflowMd` ✅** | ✅ 1 `.md` byte-à-byte | `<id>.md` |
| **roles** | ❌ (aucun ; `poolAtomId` lit `str(data.key)`) | ❌ (`CANONICAL_ROLES`) | ❌ | ❌ | `<id>.md` |
| **guardrails** | ❌ (aucun ; `str(data.id)`) | ❌ (`CATALOG_GUARDRAILS`) | ❌ | ❌ | `<id>.md` |
| **skills** | ❌ (aucun ; `parseSkillRefs` = refs seules) | ❌ (`CATALOG_SKILLS`) | ❌ | ❌ | **`<id>/SKILL.md` (DOSSIER)** |

Lecture de la table : **personas** est la seule persona-comme-donnée-réelle bout-en-bout côté
lecture (dérivée `frame.personas`, riche, parsée des `.md`, déjà vendorée). **Aucun pool n'a de
sérialiseur** sauf `workflows` (via `WorkflowMd`/`serializeWorkflowMd`, `frontmatter.ts`). Les
sérialiseurs existants de `frontmatter.ts` couvrent **team/method/kit/agent-contract/workflow** — pas
les atomes de pool. **skills** a en plus un stockage atypique (dossier `<id>/SKILL.md`, pas un `.md`
plat) — un writer de pool devra le traiter à part.

**Fait 3 — le round-trip byte-préservant est le VRAI risque, et il n'est pas « parser → sérialiser ».**
Deux pièges mesurés, l'un interne, l'autre confirmé par l'état de l'art :
- **Perte de clés non modélisées (piège critique, interne).** Un persona `.md` porte des champs que
  `parsePersona` **ne modélise PAS** — au moins `description` (le **blurb de déclenchement du
  sous-agent Claude Code**, load-bearing) et `vignette`. Un round-trip naïf « objet typé →
  `serialize` » **écraserait ces clés** (les sérialiseurs de `frontmatter.ts` émettent un ordre de
  champs FIXE depuis le type, sans passe-plat des clés inconnues). Réécrire un persona en jetant sa
  `description` est une **régression destructive**, pas une persistance.
- **Perte de formatage/commentaires (état de l'art).** La littérature round-trip YAML est unanime :
  un cycle parse→sérialise naïf **jette commentaires, blancs et mise en page** (PyYAML, C-libyaml) ;
  seules les approches « préservantes » (ruamel.yaml, patch respectueux) tiennent la byte-parité
  (§ 9, Sources). Le cœur GUI a **déjà** l'outillage de mitigation : `verbatimBody` (corps préservé
  tel quel) + `readListLayout`/`ListLayout` (wrapping des listes flow restitué) + un sérialiseur
  **canonique zéro-dépendance** (contrainte dure : `@iakaframe/core` n'embarque aucun parseur YAML).

> **Ce que cela change pour le décideur.** Le Lot 5 n'est pas « ajouter 7 sérialiseurs ». C'est
> **(a)** ouvrir la voie d'écriture disque des pools (le `pool_write` manquant), **(b)** définir un
> **écrivain non-destructif qui PRÉSERVE les clés non modélisées et le corps** (édition-en-place, pas
> réémission depuis le type), et **(c)** basculer le câblage authoring de la source synthétique
> (`CATALOG_*`) vers la source réelle (`.md` dérivés). La persona est le **pilote naturel** : côté
> lecture, tout est déjà fait ; il ne manque que l'écriture. Faire les 7 pools d'un bloc serait
> anti-MVP et emmêlerait 3 pools sans parseur (`roles`/`guardrails`/`skills`) + le cas dossier des
> skills + la dualité pool/collection des workflows.

---

## 1. Problème (avant la solution)

L'authoring des 7 types d'élément du réservoir GUI est **volatile** : l'`onSubmit` d'un éditeur fait
un upsert **en état de session** (cf. `elementKind.ts` : « *l'hôte fait l'upsert en état de
session* »), et la source d'amorçage d'un pool est son **catalogue synthétique** (`fallback()` →
`CATALOG_*`/`cloneCanonicalRoster`). Rien n'est écrit sur disque ; tout est perdu au rechargement.
Or la voie de **lecture** des `.md` réels existe (`poolReadAll`/`loadFrame` → `frame.personas` pour
les personas) et la voie d'**écriture** existe pour les collections (`library_write`) — mais **pas
pour les pools**. Rendre l'édition durable suppose donc de fermer la boucle **lecture réelle →
édition → écriture disque non-destructive**, en préservant l'existant à l'octet.

**Ce n'est PAS** : réécrire les sérialiseurs de contrat (`frontmatter.ts`, miroir byte-à-byte du
CLI) ; renommer un id ou un fichier (constitution C-1/C-4/C-5 : ids définitifs) ; introduire une
dépendance YAML (zéro-dépendance) ; brancher un runner d'exécution ; migrer les 8 frames tierces ;
faire les 7 pools d'un seul lot.

---

## 2. Objectif fermé & critères d'acceptation (mesurables)

Rendre l'édition d'éléments **durable sur disque**, **non-destructive** et **round-trip
byte-préservante**, en livrant d'abord l'**infra + un pilote persisté bout-en-bout** (persona), puis
en itérant pool par pool. Additions rétrocompatibles seulement.

- **AC1 — Writer de pool (Rust + façade).** Une commande `pool_write` (Rust `library_store`) écrit
  `<IAKAFRAME_HOME>/library/<pool>/<id>.md`, **calque de `write_in`/`library_write`** : `validate_pool_type`
  + `validate_id` + `pathguard::safe_path` (anti-traversal), création du dossier au besoin, racine
  introuvable → **erreur** (jamais d'écriture aveugle). Exposée via la **façade unique**
  `src/api/backend.ts` (`poolWrite(poolType, id, text)` + ajout à l'objet `backend`) — **aucun
  `invoke` hors façade** (invariant C-8). Une garde d'écrasement `pool_exists` (ou réutilisation du
  contrôle d'id existant du frame chargé) protège la **création** (refus d'écraser hors intention).

- **AC2 — Écriture NON-DESTRUCTIVE, clés non modélisées PRÉSERVÉES (DUR).** À l'édition d'un
  élément, le `.md` réécrit **conserve toute clé de frontmatter que l'éditeur ne modélise pas** (au
  moins `description`, `vignette` pour un persona) **et le corps** (prose sous le frontmatter),
  **inchangés à l'octet**. Prouvé par un test born-red : éditer un persona porteur d'une
  `description` et la réécrire **ne doit PAS** faire disparaître `description`.

- **AC3 — Round-trip byte-préservant (DUR).** Pour le pool pilote, un cycle **lire `.md` réel →
  (aucune édition) → réécrire** est **byte-identique** à la source, sur les 9 fixtures persona
  vendorées (les mêmes que `vendor-check` compare). Le wrapping des listes flow est restitué
  (`readListLayout`), le corps est repris via `verbatimBody`. Une édition d'un seul champ ne modifie
  **que** les octets de ce champ (diff git minimal).

- **AC4 — Source réelle branchée + `onSubmit` écrit sur disque (pilote).** Le `personaKind` (et
  l'hôte `ElementReservoir`) **amorce la grille sur les `.md` réels** (`frame.personas` via
  `loadFrame`), le `fallback()` synthétique restant le **repli hors-ligne** (racine non résolue /
  hors Tauri). L'`onSubmit` (création ET édition) **appelle `poolWrite`** au lieu de muter la seule
  session ; après écriture, la grille reflète le disque (relecture). Hors Tauri (dev navigateur /
  tests), le chemin dégrade proprement (message `BACKEND_UNAVAILABLE_MSG`, jamais une stack).

- **AC5 — Parité cross-repo : `vendor-check --strict` drift 0 (DUR).** Après re-vendorisation, la
  garde `iakaframe vendor-check --strict` rend **drift 0**. Le pilote persona **est déjà vendoré**
  (9 `.md` byte-à-byte, `fixtureTable()` famille `personas`) : ajouter un **sérialiseur/écrivain**
  côté GUI **ne modifie aucun `.md` canon** → drift 0 **par construction** pour 5a. Tout pool ajouté
  **plus tard** (5b/5c) qui n'est pas encore vendoré **DOIT** entrer dans `fixtureTable()` +
  `EXPECTED_COPIES` **dans le même lot** que son canon (anti-emmêlement, § 7).

- **AC6 — Constitution & non-régression (DUR).** **Aucun renommage** d'id ni de fichier (C-1/C-4/C-5).
  Library **plate**, éléments de **1er ordre** référencés par id (jamais copiés). L'écriture atterrit
  dans la **library du réservoir** (`<IAKAFRAME_HOME>/library/<pool>/`, AR-A), **jamais** dans le
  projet chargé. Les sérialiseurs de contrat de `frontmatter.ts` restent **byte-inchangés**. Les 8
  frames du réservoir restent valides ; `iakaframe frame lint --all --strict` reste **exit 0**.

- **AC7 — Rollback pensable.** L'écriture est un `write` d'UN fichier `.md` sous pathguard ;
  l'annulation d'une édition malencontreuse est un `git checkout` du fichier (la library est
  versionnée). Aucune écriture hors `library/<pool>/<id>.md`. Aucune suppression dans ce lot (le
  retrait sûr vit déjà côté CLI `remove`, hors périmètre).

- **AC8 — Suites vertes.** `vitest` + `tsc` + `eslint` (GUI) verts ; tests Rust `library_store` verts
  (nouveau `pool_write` : round-trip, traversal refusé, type invalide refusé, skill-dossier traité ou
  explicitement hors-périmètre 5a) ; test de parité `vendor-check` vert. Le born-red d'AC2/AC3 naît
  rouge puis vert.

---

## 3. Arbitrages structurants — Gandalf PROPOSE, le décideur TRANCHE

### AR-A — Où atterrit l'écriture ? → **la library du réservoir** `<IAKAFRAME_HOME>/library/<pool>/` (tranché)

Mesure : `loadFrame` résout `root = iakaframeHome()` (= `IAKAFRAME_HOME`, `resolve_iakaframe_home`,
**racine partagée avec le CLI**, réglable en Réglages) et lit les pools sous `<home>/library/<pool>/`.
Le **projet** chargé (`projectDir`) et la **frame active** (`activeFrameId`, clé `frame` de
`<projectDir>/iakaframe.json`) sont des concepts **distincts** : le projet ne porte qu'un **pointeur**
de frame, **pas de copie de briques** (I1/E2 : ids seulement).

**Tranche : l'écriture atterrit dans `<IAKAFRAME_HOME>/library/<pool>/<id>.md` — exactement là où
`pool_read` lit.** Symétrie lecture/écriture, et cohérence avec la mémoire
`iakaframe-reservoir-de-frames` (« `library/` = pot commun de briques partagé de TOUTES les frames »)
et la constitution (library plate, éléments de 1er ordre, ids définitifs). Éditer la brique
`gimli.md` édite la **brique partagée du réservoir** — ce qui est le sens même d'un élément de 1er
ordre référencé par id. Écrire dans le projet serait un doublement de vérité (une copie locale
divergerait du réservoir sans qu'aucune garde ne le voie) et violerait I1/E2. *Ce n'est pas un
arbitrage laissé ouvert : la mesure ne laisse qu'une réponse cohérente ; il est listé pour que le
décideur puisse l'infirmer en connaissance de cause.*

### AR-B — Quel pilote pour 5a ? → **persona** (reco forte)

Persona est le **seul pool dont la lecture réelle est déjà bout-en-bout** (`frame.personas` mergé),
avec un **éditeur riche existant** (`PersonaEditor`, réutilisé tel quel par `personaKind`) et **déjà
vendoré** byte-à-byte (9 fixtures). Ne manquent que **l'écrivain non-destructif** et le **câblage
`onSubmit`→disque**. C'est donc le **plus petit bout-en-bout** qui prouve toute la chaîne (writer +
préservation + round-trip + branchement) **sans toucher au canon** (drift 0 par construction, AC5).
*Repli si le décideur préfère* : `principles` (parseur présent, fichier plat, mais **non dérivé** et
**non vendoré** → 5a devient cross-repo d'emblée, moins MVP). **Reco : persona.**

### AR-C — Mécanique du round-trip non-destructif → **patch de frontmatter en place** (reco) vs **modèle avec passe-plat**

Le piège d'AC2 (perte de `description`/`vignette`) interdit le naïf « type → `serialize` ». Deux voies :

- **Option C1 — édition-en-place / patch de frontmatter (reco).** Relire le `.md` existant ; ne
  réécrire **que** les lignes des champs que l'éditeur possède (upsert de clé), **préserver verbatim**
  toute autre clé + le corps (`verbatimBody`) + le layout des listes (`readListLayout`). Sur une
  **création** (fichier absent), émettre la forme canonique via un `serialize<Pool>Md` neuf. C'est
  l'approche « préservante » de l'état de l'art (§ 9), la plus **non-destructive** et la seule qui
  tienne **AC3 byte-à-byte** sur des `.md` écrits à la main. *Coût :* un patcheur de frontmatter
  générique (au-dessus de `parseFrontmatter`/`splitDocument`), réutilisable par tous les pools.
- **Option C2 — modèle typé étendu + passe-plat des clés inconnues.** Étendre le type (`Persona` +
  `unknownFrontmatter: Record<…>`) pour capturer TOUTES les clés, puis `serialize` canonique. Plus
  « typé », mais **reflow** garanti des fichiers hand-formatés (échoue AC3 hors forme canonique) et
  oblige à modéliser/repasser chaque clé. **Non retenu** au MVP.

**Reco : C1.** Motif : non-destructif d'abord, byte-parité tenable, mécanique **mutualisable** sur
les 7 pools (un patcheur, pas 7 sérialiseurs exhaustifs). Un `serialize<Pool>Md` canonique reste
requis **uniquement pour la création** (fichier neuf), où il n'y a rien à préserver.

### AR-D — Découpage en lots (MVP d'abord) → **5a pilote, puis 5b/5c** (reco)

- **Lot 5a — INFRA + PILOTE PERSONA (le socle).** `pool_write` Rust + `poolWrite` façade + patcheur
  de frontmatter non-destructif (C1) + `serializePersonaMd` (création) + câblage `personaKind`
  (source réelle `frame.personas`, `onSubmit`→`poolWrite`). **GUI-only côté canon** (persona déjà
  vendoré) → `vendor-check` drift 0 par construction. Prouve la chaîne complète.
- **Lot 5b — pools PLATS À PARSEUR : `principles`, `rituals`, `scaffolds`.** Ajouter par pool :
  sérialiseur de création + dérivée `frame.<pool>` (promotion, à la manière de `frame.personas`) +
  bascule du `<pool>Kind` sur la source réelle + **vendorisation** des `.md` canon (entrée dans
  `fixtureTable()` + `EXPECTED_COPIES`, **cross-repo, même lot**). Réutilise l'infra 5a intégralement.
- **Lot 5c — pools SANS PARSEUR + cas spéciaux : `roles`, `guardrails`, `skills`.** Créer d'abord le
  **parseur `.md`→objet** manquant (aucun n'existe), + le cas **skills = dossier `<id>/SKILL.md`**
  (le `pool_write` doit router vers le sous-dossier), + réconcilier la **dualité workflow** (pool
  read-only `library/workflows/` vs collection éditable `<home>/workflows/` — statuer laquelle est
  l'autorité d'édition). Le plus risqué ; à cadrer finement le moment venu.
  > **Cadrage détaillé livré (2026-07-26) : `specs/instructions/persistance-5c-roles-guardrails-skills.md`.**
  > Mesure la forme réelle des 3 pools + tranche : découpage **5c-1 roles+guardrails (sans Rust)** puis
  > **5c-2 skills (extension Rust folder-write)** ; `guardrail` **plat** (`kind/hook/policy` préservés,
  > **pas** de `rendering` inline-map) ; verrou C-1 sur **`key`** (role) ; **workflow HORS 5c**
  > (persistance déjà résolue côté collection, fusion pool/collection = lot d'archi séparé).

**Reco : livrer 5a seul, valider en réel, puis engager 5b, puis 5c.** Le décideur peut regrouper
5b+5c ou réordonner ; la dépendance dure est « 5a d'abord » (l'infra conditionne tout le reste).

---

## 4. Portée précise du changement (mesurée, par fichier) — pour le Lot 5a

**Backend Tauri `iakaFrameGUI/src-tauri/src`** :
- `library_store.rs` — **ajouter `pool_write_in(home, pool_type, id, text)`** (+ commande
  `pool_write`), calque de `write_in`, sous `library/<pool>/` ; `validate_pool_type` + `validate_id`
  + `safe_path` ; racine absente → erreur. Tests : round-trip, traversal refusé, type invalide
  refusé. **Décider** en 5a : `skills` (dossier) hors-périmètre du pilote → soit refuser
  explicitement `skills` au write, soit router `<id>/SKILL.md` (reco : hors-périmètre 5a, traité en 5c).
- `lib.rs` — enregistrer `library_store::pool_write` dans `invoke_handler!`.
- `capabilities/default.json` — vérifier qu'aucune allow-list ne bloque la commande (les commandes
  `#[tauri::command]` internes ne passent pas par l'allow-list shell ; à confirmer par l'exécutant).

**Façade `iakaFrameGUI/src/api/backend.ts`** :
- `poolWrite(poolType: PoolType, id: string, text: string): Promise<void>` + ajout à l'objet
  `backend` (mockable). Éventuel `poolExists` si la garde de création ne peut s'appuyer sur le frame
  chargé.

**Cœur `iakaFrameGUI/packages/core/src`** :
- **`frontmatter.ts`** — ajouter un **patcheur de frontmatter non-destructif** (C1) : `upsertField` /
  `patchFrontmatter(rawMd, patch)` qui réécrit les seules clés fournies, **préserve** clés inconnues
  + corps (`verbatimBody`) + layout (`readListLayout`), zéro-dépendance. **Ne pas toucher** aux
  sérialiseurs de contrat existants (byte-inchangés).
- **`persona.ts`** — `serializePersonaMd(persona, body?)` pour la **création** (canonique) ; aucune
  mutation du type `Persona` ni de `parsePersona`.

**Hôte `iakaFrameGUI/src/forge`** :
- `personaKind.tsx` — `onSubmit` appelle `poolWrite` (via le hook/hôte) ; source de grille = source
  réelle (`frame.personas`) ; `fallback` synthétique conservé en repli hors-ligne.
- `ElementReservoir` (l'hôte générique) — brancher le flux d'écriture + relecture après save (le
  composant exact est à localiser par l'exécutant, cf. § 6).

**Aucun fichier canon iakaframe modifié en 5a** (persona déjà vendoré). Aucune écriture hors
`specs/instructions/` pour ce cadrage.

---

## 5. Contrainte DURE — parité cross-repo & anti-emmêlement

- **Un seul chantier cross-repo à la fois.** 5a est **GUI-only côté canon** (aucun `.md` touché).
  Dès 5b, chaque pool nouvellement persisté est **cross-repo** : son canon `library/<pool>/*.md` et
  son **miroir vendoré** (`fixtureTable()` + `EXPECTED_COPIES`, `cli/src/lib/vendor.js`) bougent
  **ENSEMBLE, dans le même lot** — jamais l'un sans l'autre.
- **`vendor-check --strict` drift 0 après re-vendorisation** (AC5). Ordre pour 5b/5c : modifier/porter
  le canon → l'ajouter à `fixtureTable()` (+ bump `EXPECTED_COPIES`) → copier byte-à-byte la fixture
  → `iakaframe vendor-check --strict` = drift 0.
- **Contrats INTOUCHABLES** : `frontmatter.ts` sérialiseurs de contrat (miroir byte-à-byte de
  `cli/src/lib/frontmatter.js`) restent inchangés ; on **ajoute** un patcheur, on ne modifie pas
  l'existant. `parsePersona`/`parseFrontmatter` inchangés.

---

## 6. Critère d'ouverture d'exécution (A-CONF)

Avant tout code, l'exécutant **localise** (a) le composant hôte `ElementReservoir` et le hook qui
porte l'`onSubmit`/l'état de session des éléments (Lot 1–3 mergés) pour y insérer l'écriture disque +
la relecture ; (b) confirme sur pièce que `personaKind` amorce bien la grille sur `frame.personas`
(source réelle) quand un frame est chargé, le `fallback` n'étant que le repli hors-ligne. **Limite de
mesure assumée** : l'outillage de listage de l'environnement de cadrage est indisponible (ripgrep
absent → `Glob`/`Grep` en échec) ; le **contrat de données** ci-dessus fait foi, l'identification du
composant hôte exact est portée en critère d'ouverture. Si — contre la mesure — un `pool_write`
existait déjà, 5a se réduirait au câblage : à signaler au gate.

---

## 7. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Lot 5a (infra + pilote persona) : ~2–3 j-h.** `pool_write` Rust + tests (~0,5) ; façade `poolWrite` (~0,15) ; **patcheur de frontmatter non-destructif** C1 + tests byte-parité (~0,75–1, le cœur du risque) ; `serializePersonaMd` création (~0,25) ; câblage `personaKind`/hôte `onSubmit`→disque + relecture (~0,5) ; born-red AC2/AC3 + suites (~0,5). **Lot 5b (principles/rituals/scaffolds) : ~1,5–2,5 j-h** (3 × [sérialiseur création + dérivée `frame.<pool>` + bascule Kind + vendorisation], l'infra 5a réutilisée). **Lot 5c (roles/guardrails/skills + dualité workflow) : ~2,5–4 j-h** (3 parseurs à créer + cas dossier skill + arbitrage workflow — le plus incertain). |
| **Complexité / risque** | **MOYENNE à ÉLEVÉE.** Le risque n'est PAS l'I/O (pattern `library_write` éprouvé) mais le **round-trip non-destructif** : préserver les clés non modélisées (`description` load-bearing) + le formatage à l'octet (piège d'état de l'art confirmé, § 9). Le patcheur C1 est le pivot technique. Risque cross-repo (5b/5c) **maîtrisé** par la garde `vendor-check --strict` en gate. |
| **Inconnues (susceptibles de faire glisser)** | (1) **Composant hôte `ElementReservoir`/hook non localisé** au cadrage (A-CONF, § 6) — outillage indisponible ; si l'`onSubmit` est plus imbriqué, +0,25 j-h. (2) **Forme réelle des `.md` canon** (canonique vs hand-formatée) : plus le formatage est irrégulier, plus C1 doit être robuste (le corps est déjà couvert par `verbatimBody`). (3) **skills = dossier** `<id>/SKILL.md` : reporté en 5c mais peut exiger un routage `pool_write` plus tôt si le décideur veut skills tôt. (4) **Dualité workflow** (pool read-only vs collection éditable) : arbitrage d'autorité à trancher en 5c. (5) `capabilities/default.json` : confirmer qu'aucune allow-list ne gêne `pool_write`. |

> Rappel méthode : estimation **rappelée à la clôture du lot**, confrontée au temps réel, pour
> affiner les suivantes. Pas un engagement ferme.

---

## 8. Récapitulatif des tranches (pour le décideur)

1. **Où écrit-on ?** → `<IAKAFRAME_HOME>/library/<pool>/<id>.md`, la library **du réservoir**
   partagé, symétrique de la lecture (AR-A). Jamais dans le projet.
2. **Pilote ?** → **persona** (lecture réelle déjà faite, éditeur existant, déjà vendoré) — 5a
   sans toucher au canon (AR-B).
3. **Round-trip ?** → **patch de frontmatter en place** (C1), préservant clés non modélisées +
   corps + layout ; `serialize` canonique réservé à la **création** (AR-C).
4. **Découpage ?** → **5a** (infra + persona) → **5b** (principles/rituals/scaffolds) → **5c**
   (roles/guardrails/skills + dualité workflow) (AR-D).
5. **Cross-repo ?** → **oui à partir de 5b** ; 5a est GUI-only côté canon (drift 0 par construction).

---

## 9. Sources (faits externes vérifiés — obligation de sourcing)

L'unique décision de conception dépendant d'un fait externe est la **stratégie de round-trip**
(AR-C / AC2 / AC3). L'état de l'art confirme le piège que ce cadrage verrouille : un cycle
parse→sérialise **naïf** de frontmatter YAML **jette commentaires, blancs, mise en page** (et, dans
notre cas typé, les **clés non modélisées**) ; seules les approches **préservantes** (patch en place,
capture verbatim) tiennent la byte-parité. Cela **valide** le choix C1 (patcheur + `verbatimBody` +
`readListLayout`) contre C2 (réémission depuis le type). Le lot **n'introduit aucune dépendance**
(zéro-dépendance dur ; on n'adopte aucune lib YAML — on réutilise l'outillage maison existant) : il
n'y a **ni compatibilité de version ni choix de lib à arbitrer**. Le reste des décisions repose
**exclusivement** sur les constats mesurés sur le disque des deux dépôts (§ 0, cités par symbole).

- [Preserving comments with round trip decode/encode — snoyberg/yaml #111](https://github.com/snoyberg/yaml/issues/111)
- [« Respectful » YAML patching in Rust — E. Terekhin](https://verrchu.github.io/blog/2-respectful-yaml-patching-in-rust/)
- [ruamel.yaml — round-trip preserving YAML (détails)](https://yaml.dev/doc/ruamel.yaml/detail/)
- [Markdown Frontmatter YAML — 5 SSGs, 5 YAML traps — FormatArc](https://formatarc.com/en/blog/markdown-frontmatter-yaml-json/)
