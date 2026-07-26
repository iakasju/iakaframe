# Instruction — Persistance disque des pools SANS parseur : roles / guardrails / skills (+ verdict dualité workflow) — Lot 5c

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (chantier #3, **Lot 5c** —
> le dernier de la persistance, le plus novateur ; cadrage dédié demandé par le décideur AVANT code).
> **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture Gandalf est
> bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli (**cross-repo**) ; gate P2→P3 =
> 🏹 Legolas. Ce fichier **approfondit** la section 5c générale de
> `persistance-disque-authoring-elements.md` (§ 3 AR-D, § 7) — cette dernière reste l'**overview** ;
> ici on **mesure et on tranche** les 3 points durs.
>
> **Constats mesurés sur le disque le 2026-07-26** — `preuve-avant-declaration`. Deux dépôts :
> `~/work/iakaframe` (réservoir : `library/` canon + CLI + vendorage) et `~/work/iakaFrameGUI`
> (cœur `packages/core` + hôte React `src/` + backend Tauri `src-tauri/`). Lecture seule sur le code.
> Citations par nom de fichier / de symbole (les pointeurs chiffrés vieillissent) ; le message de
> remise à Aragorn porte les `chemin:ligne` cliquables.

---

## 0. Le socle 5a/5b est éprouvé — 5c ne réinvente rien SAUF ce que le patron ne couvre pas

Les Lots 5a (infra + pilote persona) et 5b (principles/rituals/scaffolds) sont **mergés (v0.31.0)**.
Le patron de persistance d'un pool est **complet et vérifié sur pièces** :

- **Writer Rust** `pool_write_in(home, pool_type, id, text)` → `<home>/library/<pool>/<id>.md`, calque
  de `write_in` : `validate_pool_type` + `validate_id` + `safe_path` (anti-traversée), `create_dir_all`,
  racine absente → erreur. Garde de création `pool_exists_in`. Façade `poolWrite`/`poolExists`.
- **Patcheur non-destructif** `patchFrontmatter(rawMd, patch)` (`frontmatter.ts`, C1) : ne réécrit
  une ligne **que si la valeur change** ; clés hors patch + corps (`verbatimBody`) + layout des listes
  (`readListLayout`) **préservés à l'octet**. Un patch sans changement ⇒ document byte-identique.
- **Par pool** : un parseur `parse<Pool>` (défensif, record invalide → `null`), un
  `<pool>FrontmatterPatch(obj)` (**uniquement les champs éditables**, `id` exclu — C-1), un
  `serialize<Pool>Md` **canonique** réservé à la **création**, une dérivée `frame.<pool>` (promotion
  de la liste réelle parsée, à la manière de `frame.personas`), et la **vendorisation** de l'ensemble
  référencé (`fixtureTable()` + `EXPECTED_COPIES`, `cli/src/lib/vendor.js`).

**Ce que le patron NE couvre PAS, et qui EST le Lot 5c** — les 3 vraies inconnues mesurées ci-dessous :
1. `roles`/`guardrails`/`skills` **n'ont AUCUN parseur** (contrairement à persona/principle/ritual/
   scaffold/workflow) — à créer, en préservant des clés load-bearing non modélisées.
2. `skills` est stocké en **DOSSIER `<id>/SKILL.md`** (pas un `.md` plat) ; le writer Rust
   `pool_write_in` **refuse `skills` aujourd'hui** (garde posée au 5a).
3. La **dualité workflow** (pool read-only vs collection éditable) — **tranchée DANS 5c** (verdict
   révisé décideur 2026-07-26) : vérité unique = pool, chemin collection retiré ; sous-lot
   **5c-workflow**. Résolution dédiée : `unification-workflow-pool-collection-5c.md` (cf. § 3).

---

## 1. FAITS MESURÉS — la forme réelle des `.md` des 3 pools (round-trip byte = contrainte reine)

Mesure sur le canon `~/work/iakaframe/library/{roles,guardrails,skills}/…`. Pour chaque pool : le
frontmatter réel, les clés, la clé d'**identité**, et les clés **load-bearing à préserver verbatim**.

### 1.1 — `role` : identité = **`key`** (jamais `id` seul), et POURTANT `id` ET `key` coexistent

Canon `library/roles/cadrage.md` (idem `coordination.md`, …) :

```
---
id: cadrage
key: cadrage
label: Architecte-cadreur
roleIndex: 3
scope: team
---
# Architecte-cadreur
… (corps narratif, I5)
```

- **Clés** : `id`, `key`, `label`, `roleIndex`, `scope`. Par convention canon, **`id == key == nom de
  fichier`** (`cadrage`).
- **Identité de référence = `key`** (VERROU C-1). Mesuré : `frame.ts` `poolAtomId('roles', …)` renvoie
  **`str(data.key) ?? str(data.id)`**, et `methods/iakaframe.md` réfère les rôles par
  `roleKeys: [portefeuille, coordination, cadrage, dev, qualite, deploiement, design, documentation,
  frame]` (= des **`key`**). Une persona réfère un rôle par `roleKey` = `Role.key`.
- **`roleIndex` est un CHAMP DE FICHIER ici** (≠ persona, où `roleIndex` est dérivé). Attention au
  **décalage de base** (mesuré dans `roles.ts`) : cœur base 0, **bibliothèque base 1** (library =
  cœur + 1). Canon `cadrage` : `roleIndex: 3` sur disque (= index cœur 2). `roleIndex` **NE doit pas
  être recalculé** à l'écriture — préservé verbatim.
- **Clés à préserver verbatim** : `id`, `key`, `roleIndex`, `scope` **et le corps**. Seul `label` est
  un candidat éditable (libellé d'affichage).

### 1.2 — `guardrail` : le canon est **PLAT** — PAS de `rendering {hook, prose}`

> ⚠️ **Correction de modèle mesurée.** La mission évoque un « champ riche `rendering ({hook, prose})`
> à préserver à l'octet ». **Ce champ N'EXISTE PAS sur le disque.** Le canon guardrail est **plat** :
> deux scalaires `hook` et `policy`, jamais un inline-map `rendering`. Le « rendering » est une vue
> mentale (ou un futur modèle GUI) ; le **contrat de round-trip** se joue sur la forme réelle.

Canon `library/guardrails/identity.md` (idem `perimeter.md`, `delegation.md`) :

```
---
id: identity
label: Double badge ouverture/clôture
kind: identity
hook: "Stop;SubagentStop;UserPromptSubmit"
policy: "La position de la pastille porte le sens ; « START/STOP » bannis ; badge en 1re ligne…"
---
# Double badge ouverture/clôture
… (corps : rappel de la politique + description du hook, I5)
```

- **Clés** : `id`, `label`, `kind`, `hook`, `policy`. Identité = **`id`**.
- **`hook` et `policy` sont load-bearing et fragiles** : `hook` est une **spec de branchement**
  (`"Stop;SubagentStop;UserPromptSubmit"`, `"PreToolUse (Edit|Write|Bash|NotebookEdit)"`,
  `"PreToolUse;PostToolUse (Task)"`) couplée au code des hooks ; `kind` est un enum lié à
  l'implémentation. Tous deux **quotés** dans le canon. Les éditer à l'aveugle casserait un garde-fou.
- **Verdict `rendering` (réponse à la mission)** : l'équivalent réel du « rendering non éditable
  préservé à l'octet » = **`kind` + `hook` + `policy`**, à **NE PAS modéliser dans le patch** (donc
  préservés verbatim par `patchFrontmatter`, exactement comme `scaffold.entries` au 5b). Le type
  `Guardrail` **porte** ces champs (pour la fiche du réservoir) mais le `guardrailFrontmatterPatch`
  n'expose que **`label`** au MVP. **Clés à préserver verbatim** : `id`, `kind`, `hook`, `policy` + corps.

### 1.3 — `skill` : `<id>/SKILL.md`, `description` load-bearing, gros corps

Canon `library/skills/iakaframe-cadrage/SKILL.md` (idem `iakaframe-jalon/`, `iakastart/`, …) :

```
---
id: iakaframe-cadrage
name: iakaframe-cadrage
description: Transforme un besoin exprimé en langage naturel en une instruction… (blurb LONG,
  déclencheur de sous-agent — load-bearing, exactement comme persona.description)
subskills: [iakaframe-jalon]
---

# iakaframe — Cadrage & spécification
… (CORPS = le vrai payload de la skill : instructions complètes, souvent long)
```

- **Clés** : `id`, `name`, `description`, `subskills`. Par convention canon **`id == name == nom de
  dossier`** (confirmé par l'état de l'art Claude Agent Skills, § Sources : *le nom de dossier fait
  foi ; la frontmatter porte `name`/`description` de découverte*). Identité = **`id`** (= le nom du
  dossier `<id>/`).
- **`description` est load-bearing** (blurb de déclenchement) — scalaire mono-ligne, non quoté au
  canon (KEY_RE capture toute la fin de ligne, les `,`/`:` internes sont sans risque). **Le CORPS est
  le payload** : préservé verbatim (`verbatimBody`), y compris la **ligne blanche** entre `---` et
  `# …` (mesurée sur `iakaframe-cadrage/SKILL.md`).
- **Clés à préserver verbatim** : `id`, `name`, le **corps**. Candidats éditables : `description` et
  `subskills` (le libellé `name` = `id`, verrouillé C-1).

### 1.4 — Tableau de synthèse (par pool : forme, identité, préservé, éditable MVP)

| Pool | Fichier | Frontmatter (ordre canon) | Identité (réf) | Préservé verbatim (hors patch) | Éditable MVP (patch) |
|---|---|---|---|---|---|
| **roles** | `library/roles/<key>.md` (plat) | `id, key, label, roleIndex, scope` | **`key`** (C-1) | `id, key, roleIndex, scope` + corps | `label` |
| **guardrails** | `library/guardrails/<id>.md` (plat) | `id, label, kind, hook, policy` | `id` | `id, kind, hook, policy` + corps | `label` |
| **skills** | `library/skills/<id>/SKILL.md` (**DOSSIER**) | `id, name, description, subskills` | `id` (= nom dossier) | `id, name` + corps | `description, subskills` |

**Le round-trip byte sans édition ⇒ document byte-identique** est garanti par `patchFrontmatter`
(no-op) dès lors que le patch ne modélise **que** les colonnes « éditable ». C'est le socle 5a réutilisé.

---

## 2. POINT DUR #2 — le cas dossier `skills = <id>/SKILL.md` : extension Rust TRANCHÉE

### 2.1 — Ce qui existe déjà (mesuré `src-tauri/src/library_store.rs`)

La LECTURE du dossier skill est **déjà faite** — c'est l'ÉCRITURE qui manque :
- `pool_list_in` : un dossier `<id>/` contenant `SKILL.md` → id = **nom du dossier** (déjà géré,
  testé `pool_list_gere_les_skills_en_dossier`).
- `pool_read_all_in` / `pool_read_in` : lisent le contenu de `<id>/SKILL.md` (déjà testés).
- `pool_write_in` / `pool_exists_in` / `pool_file` : **REFUSENT `skills`** explicitement — garde 5a
  (`"écriture du pool skills non supportée en 5a … voir Lot 5c"`), test
  `pool_write_skills_dossier_est_refuse_en_5a`.

La **vendorisation** (`cli/src/lib/vendor.js`) supporte nativement les fixtures imbriquées : `checkVendor`
compare byte-à-byte des chemins relatifs, et `listFixtureFiles` **marche récursivement** (walk) en
matchant `.md`. Une fixture `skills/<id>/SKILL.md` est donc un `kind:'copy'` valide sans effort.

### 2.2 — Extension Rust tranchée (petite, sûre, non destructive)

Le refus skills est **la seule frontière** ; le reste du writer est déjà générique. Tranche :

- Dans **`pool_file`** : remplacer le `return Err(skills…)` par un **routage** — pour `skills`,
  `rel = library/skills/<id>/SKILL.md` (au lieu de `library/<pool>/<id>.md`) ; sinon inchangé. Les
  gardes restent : `validate_pool_type` + `validate_id` (interdit `/`, `\`, `.`, `..` → pas de
  traversée dans l'id) + `safe_path` (borne sous `home`). `create_dir_all(parent)` crée le
  sous-dossier `<id>/` au besoin.
- **`pool_exists_in`** fonctionne alors pour skills (teste `<id>/SKILL.md`) sans code propre.
- **Non-destructif** : écrire `SKILL.md` ne touche **aucun autre fichier** du dossier `<id>/`
  (sous-skills, assets) — `write` cible un seul fichier, `create_dir_all` ne supprime rien.
- **Tests Rust** : `pool_write_skills_dossier_est_refuse_en_5a` **bascule** en
  `pool_write_skills_ecrit_sous_id_slash_skill_md` (round-trip via `pool_read_in`, chemin =
  `library/skills/<id>/SKILL.md`, création du sous-dossier, traversée `../evil` toujours refusée,
  non-écrasement d'un sibling du dossier). Mettre à jour le commentaire de `pool_file`.

**Aucune nouvelle commande Tauri, aucun changement `capabilities/default.json`** : c'est le **même**
`pool_write(pool_type="skills", id, text)`, la façade `poolWrite` est inchangée.

---

## 3. POINT DUR #3 — dualité workflow : verdict **RÉVISÉ → DANS 5c** (sous-lot 5c-workflow)

> ⚠️ **Verdict initial « HORS 5c » RÉVISÉ par le décideur le 2026-07-26.** Le décideur a demandé de
> **cadrer et résoudre la vérité unique MAINTENANT** et d'**inclure le workflow dans le lot 5c**. La
> résolution complète (cartographie mesurée des deux vies, options A/B/C tranchées, migration non
> destructive, impact découpage, critères d'acceptation) vit dans le fichier dédié
> **`unification-workflow-pool-collection-5c.md`**. Verdict : **Option A** — le pool
> `library/workflows/<id>.md` est la **vérité unique** ; les deux surfaces convergent sur
> `pool_write("workflows")` ; le chemin d'écriture **collection** (`<home>/workflows/`) est **retiré**
> (aucune double écriture). Le workflow devient le **sous-lot `5c-workflow`, séquencé APRÈS les atomes**
> (roles+guardrails+skills). La mesure ci-dessous (§ 3.1) reste exacte et alimente ce fichier dédié ;
> seul le verdict de § 3.2 est remplacé par le renvoi ci-dessus.

### 3.1 — Mesure : le workflow vit dans DEUX espaces distincts, par conception

`src-tauri/src/library_store.rs` (commentaire d'en-tête, explicite) : la collection **éditable**
`<home>/workflows/` est **distincte** du pool d'atomes **read-only** `<home>/library/workflows/` —
« **même nom, deux espaces séparés au MVP** ». Concrètement :

- **Espace COLLECTION** `<home>/workflows/` : l'un des 4 onglets de la forge, **déjà éditable** via
  `library_write("workflows", …)`, avec un **sérialiseur complet** (`serializeWorkflowMd` /
  `serializeWorkflowFrontmatterMd`, mapper `workflowToMd`/`mdToWorkflow`, `frontmatter.ts`) et un
  round-trip byte capturé verbatim côté hôte. **La persistance d'authoring du workflow EXISTE ici.**
- **Espace POOL** `library/workflows/<id>.md` : atome read-only, scanné pour l'intégrité (compté une
  fois, G5), **vendoré** (`fixtureTable()` famille `workflow`, copie byte-à-byte de
  `library/workflows/iakaframe-3phases.md`).

À noter : `pool_write_in` **accepte déjà** `"workflows"` (dans `POOL_TYPES`, hors garde skills) — le
chemin d'écriture pool existe **techniquement**, mais **aucun flux d'authoring GUI ne l'emprunte** (le
workflow s'édite par l'onglet collection / l'atelier diagramme, pas par la grille du réservoir).

### 3.2 — Tranche RÉVISÉE : **workflow DANS 5c** (vérité unique = pool, chemin collection retiré)

**Verdict (révisé décideur 2026-07-26) : on RÉSOUT la dualité et on câble la persistance workflow en
5c, comme sous-lot `5c-workflow`.** La résolution est **Option A** : le pool
`library/workflows/<id>.md` est la **vérité unique** (constitution C-1/C-2 : élément plat référencé par
`method.workflowId`), les deux surfaces (« éléments » #3 Lot 3 **et** « méthode » `WorkflowAtelier`)
convergent sur `pool_write("workflows")`, et le **chemin d'écriture collection** (`library_write("workflows")`
→ `<home>/workflows/`) est **retiré** — plus de seconde maison éditable, plus de double source de
vérité. **Migration non destructive** : le canon n'a aucun `<home>/workflows/` matérialisé → rien à
déplacer (re-pointage de code) ; un legacy éventuel est importé par copie, jamais supprimé (C-1).
**Cross-repo drift 0 sans nouvelle fixture ni bump** : le workflow est **déjà vendoré** (famille
`workflow`, `EXPECTED_COPIES`) et le canon reste byte-identique. **Zéro Rust, zéro parseur/sérialiseur
neuf** (`parseWorkflow`/`serializeWorkflowMd` existent). Détail complet, options B/C rejetées, critères
d'acceptation et estimation : **`unification-workflow-pool-collection-5c.md`**.

> L'ancien item de backlog « réconcilier la dualité pool/collection du workflow » est **soldé** par ce
> cadrage dédié : il n'est plus « à part », il est le **sous-lot 5c-workflow** du même lot 5c.

---

## 4. Objectif fermé & critères d'acceptation (mesurables)

Rendre l'édition des pools **`roles`, `guardrails`, `skills`** **durable, non-destructive et
round-trip byte-préservante**, en réutilisant l'infra 5a/5b. Additions rétrocompatibles seulement.

- **AC1 — parseurs neufs (cœur, additions pures).** `parseRole` → `Role {id, key, label, roleIndex,
  scope}` ; `parseGuardrail` → `Guardrail {id, label, kind, hook, policy}` ; `parseSkill` → `Skill
  {id, name, description, subskills}` (au-dessus / à côté de `parseSkillRefs` existant, sans le
  modifier). Défensifs (record invalide → `null`, jamais d'exception), calqués sur `parsePersona`/
  `parsePrinciple`. **Aucune signature existante modifiée.**

- **AC2 — patch non-destructif + clés load-bearing PRÉSERVÉES (DUR).** `roleFrontmatterPatch` = `{label}`
  (préserve `id, key, roleIndex, scope`) ; `guardrailFrontmatterPatch` = `{label}` (préserve `id, kind,
  hook, policy` — l'équivalent réel du « rendering non éditable ») ; `skillFrontmatterPatch` =
  `{description, subskills}` (préserve `id, name`). **`id` (et `key` pour role) JAMAIS dans le patch**
  (C-1, verrou de non-renommage). Born-red : réécrire un guardrail sans changer son `label` **ne doit
  PAS** altérer `hook`/`policy`/`kind` ni le corps ; idem role (`roleIndex`/`scope`) et skill (corps).

- **AC3 — round-trip byte sans édition (DUR).** Pour chaque pool, `lire .md canon → (aucune édition) →
  réécrire` est **byte-identique**, sur toutes les fixtures vendorées du pool (dont **`SKILL.md`** dans
  son dossier). Corps repris via `verbatimBody`, layout via `readListLayout`.

- **AC4 — writer skill folder (Rust) TESTÉ (DUR).** `pool_write("skills", id, text)` écrit
  `<home>/library/skills/<id>/SKILL.md` : création du **sous-dossier**, **non destructif** (siblings du
  dossier intacts), **traversée refusée** (`../evil`, `a/b`, `..`, `""`), type invalide refusé, garde de
  création `pool_exists("skills", …)` opérante. Le test `…refuse_en_5a` est **remplacé** par le test de
  round-trip. `roles`/`guardrails` passent par le writer plat **inchangé** (aucun code Rust).

- **AC5 — source réelle branchée + `onSubmit` écrit disque.** Les `roleKind`/`guardrailKind`/`skillKind`
  amorcent leur grille sur la source réelle (`frame.roles`/`frame.guardrails`/`frame.skills`, dérivées
  promues comme `frame.personas`), le `fallback()` synthétique (`CANONICAL_ROLES`/`CATALOG_GUARDRAILS`/
  `CATALOG_SKILLS`) restant le **repli hors-ligne** ; l'`onSubmit` (création ET édition) appelle
  `poolWrite` ; après écriture, la grille reflète le disque (relecture). Hors Tauri, dégradation propre
  (`BACKEND_UNAVAILABLE_MSG`, jamais une stack).

- **AC6 — parité cross-repo : `vendor-check --strict` drift 0 (DUR).** Les 3 pools **entrent dans
  `fixtureTable()`** (nouvelles familles `roles`/`guardrails`/`skills`, `kind:'copy'`) + `EXPECTED_COPIES`
  **bumpé du bon compte**, **dans le même lot** que les copies byte-à-byte. Ensemble vendoré = celui
  **référencé par le canon** (méthode/team), jamais tout le pool disque (cf. § 6). Après re-vendorisation,
  `iakaframe vendor-check --strict` = **drift 0** ; `checked == nouveau EXPECTED_COPIES`.

- **AC7 — constitution & non-régression (DUR).** **Aucun renommage** d'id, de `key` ni de fichier
  (C-1/C-4). Library **plate**, éléments de 1er ordre référencés par id/key (jamais copiés). L'écriture
  atterrit dans `<IAKAFRAME_HOME>/library/<pool>/…`, jamais dans le projet. Les sérialiseurs de contrat
  de `frontmatter.ts` restent **byte-inchangés**. `iakaframe frame lint --all --strict` reste **exit 0**.
  **Workflow DANS le lot** (sous-lot 5c-workflow, § 3 / `unification-workflow-pool-collection-5c.md`) :
  le **contenu** canon de `library/workflows/` reste **byte-inchangé** (seul le chemin d'écriture
  d'authoring converge vers le pool) — vendorisation déjà en place, aucun bump.

- **AC8 — suites vertes.** `vitest` + `tsc` + `eslint` (GUI) verts ; tests Rust `library_store` verts
  (skill folder write : round-trip, sous-dossier, non-destructif, traversée refusée) ; test de parité
  `vendor-check` vert. Les born-red d'AC2/AC3/AC4 naissent rouges puis verts.

---

## 5. Arbitrages structurants — Gandalf PROPOSE, le décideur TRANCHE

### AR-1 — Découpage : **5c-1 (roles + guardrails) puis 5c-2 (skills)** (reco MVP)

Mesure du risque : `roles` et `guardrails` sont des `.md` **plats**, writer Rust **déjà opérant**
(dans `POOL_TYPES`, hors garde skills) → **ZÉRO code Rust**, additions pures cœur + vendorisation. `skills`
est le **seul** à porter du risque cross-langage (extension Rust du writer folder + fixtures imbriquées).

- **Lot 5c-1 — `roles` + `guardrails`** (un chantier cross-repo, **sans Rust**) : `parseRole`/
  `parseGuardrail` + `role/guardrailFrontmatterPatch` + `serializeRole/GuardrailMd` (création) +
  dérivées `frame.roles`/`frame.guardrails` + bascule des Kind + **vendorisation** (9 roles + 3
  guardrails). Verrou C-1 sur **`key`** (role).
- **Lot 5c-2 — `skills`** (un chantier cross-repo, **avec** la petite extension Rust folder-write, § 2) :
  `parseSkill` + `skillFrontmatterPatch` + `serializeSkillMd` + dérivée `frame.skills` + bascule Kind +
  **vendorisation** (skills imbriqués `<id>/SKILL.md`) + Rust `pool_file` routage skills + tests.

**Motif : MVP d'abord + anti-emmêlement** (« un seul chantier cross-repo à la fois »,
`persistance-disque-authoring-elements.md` § 5). Isole l'unique risque Rust (skills) des deux pools
triviaux. *Le décideur peut regrouper les trois en UN lot* : l'extension Rust skills est **réellement
petite** (une branche dans `pool_file` + bascule d'un test, lecture folder déjà faite) — reco = **split**,
mais le regroupement reste raisonnable si le décideur veut de l'élan.

### AR-2 — `guardrail.rendering` : **NON éditable, préservé à l'octet** — mais c'est `kind`+`hook`+`policy` (tranché)

Il n'y a **pas** d'inline-map `rendering` sur disque (§ 1.2). Le « champ riche non éditable préservé à
l'octet » évoqué par la mission se **matérialise** en `kind` + `hook` + `policy` (scalaires plats),
**absents du patch** donc préservés verbatim (comme `scaffold.entries` au 5b). Le type `Guardrail` les
**porte** (fiche du réservoir) ; seul `label` est éditable au MVP. *Le décideur peut, plus tard, ouvrir
`policy` à l'édition* (c'est de la prose) — mais **jamais `hook`/`kind`** sans un lot dédié (couplés au
code des hooks). Reco MVP : **`label` seul éditable**.

### AR-3 — Verrou `key` (role) : identité de référence = **`key`**, pas `id` (tranché)

Les rôles sont référencés par **`key`** (`method.roleKeys`, `persona.roleKey`, `frame.poolAtomId`). Le
`roleFrontmatterPatch` **exclut `id` ET `key`** ; le nom de fichier (`<key>.md`) n'est jamais renommé
(C-1/C-4). `roleIndex` (base bibliothèque 1) est **préservé, jamais recalculé**. `serializeRoleMd`
(création) émet `id` **et** `key` (= le même id choisi), ordre canon `id, key, label, roleIndex, scope`.

### AR-4 — Workflow : **DANS 5c** (verdict RÉVISÉ décideur 2026-07-26, § 3) — vérité unique = pool `library/workflows/`, chemin collection retiré ; sous-lot **5c-workflow** séquencé après les atomes. Résolution : `unification-workflow-pool-collection-5c.md`.

---

## 6. Portée cross-repo & vendorisation (contrainte DURE)

**5c est cross-repo pour les 3 pools** : `roles`/`guardrails`/`skills` **ne sont PAS encore vendorés**
(mesuré : `fixtureTable()` couvre personas/goldens/binding/workflow/principles/rituals/scaffolds = 45
copies ; aucun des 3 pools 5c n'y figure). Les `.md` canon **existent déjà et sont corrects** (lus, bien
formés) → **aucun `.md` canon à modifier**, mais chaque pool doit **entrer dans le miroir** (fixtures +
`EXPECTED_COPIES`) **dans le même lot** que sa bascule cœur.

**Ensemble vendoré (comme les 9 personas = le casting, pas les 34 du pool)** :
- **roles** : les **9 `roleKeys` référencés par `methods/iakaframe.md`** — `portefeuille, coordination,
  cadrage, dev, qualite, deploiement, design, documentation, frame` → `library/roles/<key>.md`. `+9`.
- **guardrails** : les **3 `guardrailIds`** de la méthode — `identity, perimeter, delegation` →
  `library/guardrails/<id>.md`. `+3`.
- **skills** : les skills **référencés par le casting** (union des `persona.skills` des 9 personas de la
  team active **+ fermeture `subskills`**) — à **énumérer précisément à l'exécution** (comme `IDS`
  énumère le casting), fixtures imbriquées `skills/<id>/SKILL.md` ← `library/skills/<id>/SKILL.md`.
  `+N`. (L'exécutant mesure `library/personas/*.md` `skills:` + `library/skills/*/SKILL.md` `subskills:`
  pour fixer la liste exacte et `EXPECTED_COPIES`.)

**Ordre cross-repo (par lot) :** porter les fixtures byte-à-byte → les ajouter à `fixtureTable()` (+
bump `EXPECTED_COPIES`) → `iakaframe vendor-check --strict` = **drift 0** → canon (inchangé) + fixtures
committés ensemble. **Contrats INTOUCHABLES** : sérialiseurs de contrat de `frontmatter.ts` +
`parsePersona`/`parseFrontmatter` inchangés — on **ajoute** parseurs/patches/dérivées, on ne modifie rien.

---

## 7. Critère d'ouverture d'exécution (A-CONF)

Avant tout code, l'exécutant **localise et confirme sur pièce** (l'outillage de listage du cadrage est
indisponible — `Glob`/`Grep` en échec, ripgrep absent — le contrat de données ci-dessus fait foi) :
(a) les composants `roleKind`/`guardrailKind`/`skillKind` (ou l'hôte générique d'élément) et le point
d'`onSubmit` où insérer `poolWrite` + relecture (comme l'A-CONF de 5a) ; (b) que `frame.ts` n'expose
**pas encore** `frame.roles`/`frame.guardrails`/`frame.skills` riches (seulement `poolIds`) → à ajouter
en promotion (patron `frame.personas`/`frame.principles`) ; (c) l'énumération exacte de l'ensemble
skills à vendoriser (§ 6). Toute divergence entre la mesure et le disque est **signalée au gate**.

---

## 8. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Lot 5c-1 (roles + guardrails) : ~1–1,5 j-h.** 2 × [parseur + patch + serialize création + dérivée `frame.<pool>` + bascule Kind] (~0,6) ; vendorisation 9+3 (~0,25) ; born-red AC2/AC3 + suites (~0,3). **ZÉRO Rust.** — **Lot 5c-2 (skills) : ~1–1,75 j-h.** parseur + patch + serialize + dérivée + bascule Kind (~0,4) ; **extension Rust `pool_file` folder-write + tests** (~0,4, le seul risque cross-langage) ; vendorisation imbriquée + énumération de l'ensemble (~0,3) ; born-red AC4 (~0,25). — **Sous-lot 5c-workflow (verdict révisé, § 3) : ~0,75–1 j-h** (zéro Rust/parseur/fixture/bump ; convergence pool + retrait du chemin collection — estimé à part dans `unification-workflow-pool-collection-5c.md`). **Total 5c ≈ 2,75–4,25 j-h** (atomes 2–3,25 + workflow 0,75–1). |
| **Complexité / risque** | **FAIBLE à MOYENNE.** Le round-trip est **déjà résolu** par `patchFrontmatter` (5a) : les 3 pools sont des parseurs de plus sur un patron éprouvé. Le seul point neuf est le **folder-write skills** (§ 2) — petit, la lecture folder étant déjà faite/testée. Risque cross-repo **maîtrisé** par `vendor-check --strict` en gate. Le **seul** geste d'archi du lot est la **convergence workflow** (sous-lot 5c-workflow, § 3) — petite (zéro Rust/parseur/fixture/bump), mais elle **retire un chemin d'écriture** ; cadrée et estimée à part dans `unification-workflow-pool-collection-5c.md`. |
| **Inconnues (susceptibles de faire glisser)** | (1) **Composants Kind/hôte** des 3 pools non localisés au cadrage (A-CONF) ; si l'`onSubmit` est plus imbriqué, +0,25 j-h. (2) **Énumération exacte de l'ensemble skills** à vendoriser (union `persona.skills` + fermeture `subskills`) — à mesurer, impacte `EXPECTED_COPIES`. (3) Un skill dont le **corps** contiendrait un délimiteur `---` en tête de ligne pourrait piéger `splitDocument`/`verbatimBody` (à vérifier sur le canon réel au born-red AC3). (4) `label` guardrail/role : confirmer qu'aucun n'est quoté au canon (mesuré non quoté sur `identity`/`cadrage`, à re-vérifier sur les 12). |

> Rappel méthode : estimation **rappelée à la clôture du lot**, confrontée au temps réel, pour affiner
> les suivantes. Pas un engagement ferme.

---

## 9. Récapitulatif des tranches (pour le décideur)

1. **Forme réelle mesurée** → role `{id, key, label, roleIndex, scope}` (identité **`key`**) ;
   guardrail **plat** `{id, label, kind, hook, policy}` (**pas** de `rendering`) ; skill
   `{id, name, description, subskills}` en **dossier `<id>/SKILL.md}`** (§ 1).
2. **Skills folder-write** → petite extension Rust `pool_file` (routage `<id>/SKILL.md`), non
   destructive, gardes conservées, lecture folder déjà faite (§ 2).
3. **Dualité workflow** → **DANS 5c** (verdict révisé décideur) : vérité unique = **pool**
   `library/workflows/` (Option A), les deux surfaces convergent sur `pool_write`, chemin collection
   **retiré** ; sous-lot **5c-workflow** séquencé après les atomes ; migration non destructive,
   cross-repo drift 0 sans bump. Résolution : `unification-workflow-pool-collection-5c.md` (§ 3).
4. **Découpage** → **5c-1 roles+guardrails (sans Rust)** puis **5c-2 skills (avec Rust folder)** ;
   regroupable en un lot si le décideur veut de l'élan (AR-1).
5. **`guardrail.rendering`** → non éditable, préservé à l'octet = **`kind`+`hook`+`policy`** hors patch
   (AR-2). **`key` role** → verrou C-1, jamais renommé (AR-3).
6. **Cross-repo** → **OUI pour les 3 pools** (aucun n'est vendoré) ; canon inchangé, fixtures +
   `EXPECTED_COPIES` dans le même lot ; `vendor-check --strict` drift 0 (§ 6).

---

## 10. Sources (faits externes vérifiés — obligation de sourcing)

Le fait externe qui **fonde le cas dossier skills** (§ 1.3 / § 2) : dans la convention **Claude Agent
Skills**, un skill est un **dossier** contenant un `SKILL.md` ; **le nom du DOSSIER fait foi** (il
détermine l'invocation), et la frontmatter porte `name`/`description` de découverte. Cela **valide** le
stockage canon `library/skills/<id>/SKILL.md` (id = nom de dossier), le routage Rust du writer (§ 2), et
la préservation verbatim du corps (le payload de la skill). La **stratégie de round-trip** (patch en
place préservant clés non modélisées + corps) reste celle établie au Lot 5a (état de l'art round-trip
YAML) — aucune dépendance nouvelle (`@iakaframe/core` zéro-dépendance).

- [Extend Claude with skills — Claude Code Docs](https://code.claude.com/docs/en/skills)
- [Agent Skills — Claude Platform Docs (overview)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Skill authoring best practices — Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [anthropics/skills — Public repository for Agent Skills (GitHub)](https://github.com/anthropics/skills)
- [SKILL.md Format Specification — YAML Frontmatter Reference](https://www.agensi.io/learn/skill-md-format-reference)
