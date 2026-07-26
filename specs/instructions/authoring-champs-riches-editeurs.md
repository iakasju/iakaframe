# Instruction — Authoring des champs riches dans les éditeurs de pool (chantier #4, après Lot 5)

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (chantier « authoring des
> champs riches », priorisé par le décideur après la clôture de la persistance disque — Lot 5, mergé
> v0.32.0). **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture
> Gandalf est bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli ; gate P2→P3 = 🏹 Legolas.
>
> **Constats mesurés sur le disque le 2026-07-26** — `preuve-avant-declaration`. Dépôt du code :
> `~/work/iakaFrameGUI` (cœur `packages/core` + hôte React `src/` + backend Tauri `src-tauri/`) ;
> dépôt canon/vendorage : `~/work/iakaframe` (`library/` + CLI + `vendor-check`). **Lecture seule sur
> le code.** Citations par nom de fichier/symbole (les pointeurs chiffrés vieillissent) ; le message de
> remise à Aragorn porte les `chemin:ligne` cliquables. Limite d'outillage assumée : ripgrep absent
> (`Glob`/`Grep` en échec) — la mesure a été faite par lecture directe des fichiers ; l'énumération
> exhaustive des sites de montage est portée en critère d'ouverture (§ 9).

---

## 0. Le constat qui recadre le besoin (à lire avant tout)

Le besoin — « les éditeurs sont minimaux, le patcheur modélise déjà les champs, il ne manque que
l'UI » — est **juste dans l'esprit mais imprécis sur trois points mesurés**, et ces trois points
**déplacent le centre de gravité** du chantier. Ce n'est pas « ajouter des `<input>` » : c'est
**rendre les éditeurs honnêtes et complets** sur la forme réelle du disque.

**Fait 1 — la persistance des 8 pools EST câblée (les commentaires « Lot 5 différé » sont périmés).**
Contre l'impression que donnent les en-têtes de `skillKind.tsx`/`guardrailKind.tsx`/`roleKind.tsx`
(« *aucune écriture disque — Lot 5 différé* »), les **8 modules de persistance existent et sont
opérants** : `personaPersist`, `principlePersist`, `ritualPersist`, `scaffoldPersist`, `rolePersist`,
`guardrailPersist`, `skillPersist` — tous sur le patron `poolRead → patchFrontmatter(existing,
<pool>FrontmatterPatch) → poolWrite` (création = `serialize<Pool>Md`). Le cœur porte **tout** :
parseurs, `<pool>FrontmatterPatch`, `serialize<Pool>Md`, et les dérivées `frame.roles`,
`frame.guardrails: GuardrailAtom[]`, `frame.skills: SkillAtom[]`, `frame.workflows` (mesuré dans
`frame.ts` `buildFrame`). **Le chantier n'a donc pas à re-câbler l'I/O** — il travaille au-dessus d'un
socle acquis. *Les commentaires d'en-tête périmés seront rectifiés en passant (dette de lisibilité).*

**Fait 2 — plusieurs éditeurs exposent des contrôles FANTÔMES : éditables à l'écran, silencieusement
jetés à l'écriture.** C'est le vrai défaut, et il **viole l'honnêteté Fëanor** (un contrôle qui ne
persiste pas ment à l'auteur). Mesuré :
- `PersonaEditor` laisse éditer **`roleIndex`**, mais `personaFrontmatterPatch` **ne l'émet pas**
  (dérivé, pas un champ de fichier) → l'édition est **perdue au save**.
- `RoleEditor` laisse éditer **`roleIndex`**, mais `roleFrontmatterPatch` **l'exclut** (préservé
  verbatim, jamais recalculé — 5c) → **perdu au save**.
- `GuardrailEditor` laisse éditer **`kind`** et **`scope`**, mais `guardrailFrontmatterPatch` n'émet
  que `label` (et `scope` n'est même pas un champ du disque plat) → **perdus au save**.
- `SkillEditor` laisse éditer **`label`** et **`roleKey`**, mais ce sont les champs du type
  d'**attribution** `Skill {id,roleKey,label}`, **pas** ceux de l'atome disque `SkillAtom
  {id,name,description,subskills}` — `persistSkill` relit l'atome réel et **ignore l'entrée de
  l'éditeur** → l'édition d'une skill est un **quasi no-op** sur le contenu réel.

**Fait 3 — deux pools portent une DUALITÉ de type (attribution/riche ↔ atome disque), source du
Fait 2.** `skillKind`/`SkillEditor` parlent `Skill {id,roleKey,label}` (vue d'attribution catalogue) ;
`guardrailKind`/`GuardrailEditor` parlent `Guardrail {id,kind,label,scope,rendering}` (vue riche P3b).
Or le **disque** porte `SkillAtom {id,name,description,subskills}` et `GuardrailAtom
{id,label,kind,hook,policy}`. Les `*Persist` font aujourd'hui un **mapping de secours** (`atomToRich`,
`atomToAttribution`) qui **n'a pas de home pour les champs riches** (`description`, `subskills`,
`policy`). **Exposer les champs riches suppose de réconcilier cette dualité** — c'est le vrai travail
de conception, pas un `<textarea>` de plus.

> **Ce que cela change pour le décideur.** Le chantier a **trois natures de travail** superposées :
> **(a)** exposer des champs que le patch modélise DÉJÀ (gain pur `src/`, aucun cœur) ;
> **(b)** exposer des champs que le patch **ne modélise pas encore** (petit élargissement additif de
> `<pool>FrontmatterPatch` dans `packages/core` — **sans toucher aucun `.md` canon ni fixture**, donc
> `vendor-check` drift 0 par construction) ; **(c)** **corriger les contrôles fantômes** (honnêteté).
> Le découpage MVP doit trier par **patron d'UI** (scalaire / liste simple / liste structurée /
> scalaire load-bearing / corps markdown), pas seulement par pool.

---

## 1. Problème (avant la solution)

Les éditeurs de pool du réservoir GUI sont **volontairement minimaux** : ils exposent le libellé et
1–3 champs simples, laissent des champs riches **préservés à l'octet mais non éditables**
(`skill.description`/`subskills`, `guardrail.policy`, `scaffold.entries`, `persona.mission`/`pastille`,
`role.scope`), **et** — pire — présentent des contrôles qui **semblent** éditer un champ mais dont la
valeur est **jetée au save** (§ 0, Fait 2). L'auteur d'un frame ne peut donc ni régler la
`description` d'une skill (son blurb de déclenchement de sous-agent), ni composer ses `subskills`, ni
éditer une `policy` de garde-fou, ni composer les `entries` d'un scaffold — et croit à tort pouvoir
changer un `roleIndex` ou un `kind`. Rendre l'authoring **complet et honnête** suppose d'exposer les
champs riches **par leur patron d'UI** et de **verrouiller franchement** ce qui n'est pas éditable.

**Ce n'est PAS** : recâbler l'I/O disque (acquis, Lot 5) ; modifier les sérialiseurs de contrat de
`frontmatter.ts` (miroir byte-à-byte du CLI, intouchables) ; toucher au canon `~/work/iakaframe/
library/` ou aux fixtures/`vendor-check` ; renommer un id/`key` (C-1) ; rendre éditables des champs
**load-bearing couplés au code** (`guardrail.kind`/`hook`) ; ouvrir l'atelier workflow (surface à part,
hors de ce chantier) ; faire les 8 pools × tous les champs d'un bloc.

---

## 2. Objectif fermé & critères d'acceptation (mesurables)

Rendre l'édition des champs riches **complète et honnête**, **round-trip byte-préservante quand
inchangée**, en livrant d'abord un **pilote prouvant les patrons réutilisables** (scalaire riche +
éditeur de liste), puis en itérant. Additions rétrocompatibles seulement.

- **AC1 — honnêteté (DUR, transverse).** Aucun contrôle d'éditeur n'est **éditable-mais-jeté**. Tout
  champ affiché comme éditable **persiste** (present dans le `<pool>FrontmatterPatch` correspondant),
  **ou** est présenté **verrouillé** (classe `locked` + `lockhint`, comme `id`) avec la raison
  (dérivé / load-bearing / invariant). Cible du lot : `persona.roleIndex`, `role.roleIndex`,
  `guardrail.kind`+`scope`, `skill.label`+`roleKey` cessent d'être des contrôles trompeurs.

- **AC2 — champs riches exposés selon le tableau cible (§ 4).** Chaque champ marqué « éditable » au
  § 4 dispose d'un contrôle qui **modifie effectivement le `.md`** ; chaque champ marqué « préservé »
  reste **hors patch** (donc byte-préservé). Le périmètre exact des champs livrés est fixé par le
  découpage en lots (§ 3 AR-F).

- **AC3 — round-trip byte-préservant conservé (DUR).** Pour tout pool touché, `lire .md réel →
  (aucune édition) → réécrire` reste **byte-identique** (le socle `patchFrontmatter` + `verbatimBody`
  + `readListLayout` le garantit ; l'UI ne doit **pas** réintroduire de réémission depuis le type).
  Éditer un seul champ ne modifie **que** les octets de ce champ (diff git minimal). Prouvé par
  born-red sur les fixtures vendorées du/des pool(s) du lot.

- **AC4 — C-1 (DUR).** `id` (tous pools) et `key` (role) **jamais éditables** (déjà verrouillés,
  inchangé). `name` (skill == id) reste verrouillé. Les champs **load-bearing couplés au code**
  (`guardrail.kind`, `guardrail.hook`) restent **non éditables au MVP** (verrouillés + hint), jamais
  émis dans le patch.

- **AC5 — patron « éditeur de liste » réutilisable (DUR pour le pilote).** Un composant
  `<ListEditor>` (ajout / suppression / réordonnancement de lignes, ARIA) est livré **une fois** et
  prouvé sur la première liste du pilote (§ 3 AR-F). Il sert les listes **simples** (`subskills`) ET
  **structurées** (`scaffold.entries` = `{path, role, createIfAbsent}`) via un rendu de ligne
  injecté — même patron « composant générique + injection » que `ElementKind`/`ElementReservoir`.

- **AC6 — GUI-only côté canon : `vendor-check --strict` drift 0 (DUR).** Aucun `.md` de
  `~/work/iakaframe/library/`, aucune fixture, aucun `EXPECTED_COPIES` **modifié** : ce chantier vit
  **entièrement dans `~/work/iakaFrameGUI`**. Les élargissements de `<pool>FrontmatterPatch` (AR-E) et
  du type d'atome sont des **additions de code `packages/core`**, **sans effet sur les octets d'aucun
  fichier `.md`** → `iakaframe vendor-check --strict` reste **drift 0 par construction**. (Si l'exécutant
  découvre qu'un champ visé n'a **aucun home fichier** sur le disque canon — donc exigerait de modifier
  un `.md` canon — il **remonte au gate** : ce serait alors cross-repo, hors du présent périmètre.)

- **AC7 — honnêteté Fëanor & non-régression (DUR).** Fëanor-en-tête reste **honnête** (aucun appel LLM
  au montage). Les fiches du réservoir ne montrent que ce que l'élément **déclare** (jamais un champ
  fabriqué). `frame lint --all --strict` (canon) **exit 0** ; les 8 frames restent valides. Les
  sérialiseurs de contrat de `frontmatter.ts` restent **byte-inchangés**.

- **AC8 — suites vertes.** `vitest` + `tsc` + `eslint` (GUI) verts ; les born-red d'AC1/AC3/AC5
  naissent rouges puis verts. Aucune régression des tests de persistance 5a–5c.

---

## 3. Arbitrages structurants — Gandalf PROPOSE, le décideur TRANCHE

### AR-A — L'unité de travail est le **patron d'UI**, pas le pool (reco forte)

La mesure (§ 0) montre que le vrai découpage suit les **types de champ**, pas les pools. Cinq patrons
couvrent tout le chantier :

| Patron | Champs concernés | Coût | Cœur touché ? |
|---|---|---|---|
| **P1 — scalaire simple** (input/textarea) | `persona.mission`, `persona.pastille`, `role.scope` | faible | mission/pastille : **non** (patch les modélise) ; scope : oui (élargir patch, +1 champ) |
| **P2 — enum** (select) | `guardrail.kind` (→ verrouillé, load-bearing), `ritual.side` (déjà fait) | nul | non |
| **P3 — scalaire load-bearing** (textarea + garde visible) | `skill.description` (blurb de sous-agent) | faible | non (patch le modélise) |
| **P4 — liste simple** (`<ListEditor>` de strings) | `skill.subskills` | moyen | non (patch le modélise) |
| **P5 — liste structurée** (`<ListEditor>` de lignes `{…}`) | `scaffold.entries` `{path,role,createIfAbsent}`, `guardrail.policy` reste scalaire | élevé (le vrai design) | oui (élargir `scaffoldFrontmatterPatch`) |

**Reco : cadrer et livrer par patron** (le pilote combine P1 + le socle `<ListEditor>` sur une liste
simple), ce qui **mutualise** la conception au lieu de la refaire pool par pool.

### AR-B — Champs load-bearing `description` → **éditables AVEC garde visible** (reco) vs verrouillés

`skill.description` (et `persona.description`) sont des **blurbs de déclenchement de sous-agent** :
load-bearing au sens **sémantique** (un mauvais blurb misroute le dispatch), mais **pas** au sens
**technique** (ce sont des scalaires ; `patchFrontmatter` les réécrit sans risque de round-trip). Deux
voies :

- **Option B1 (reco) — éditable + garde visible.** `skill.description` devient éditable (textarea)
  avec un `lockhint` d'avertissement (« *blurb de déclenchement du sous-agent — sa formulation
  conditionne la découverte/l'invocation de la skill* »). Motif : c'est **exactement** ce qu'un auteur
  de frame doit pouvoir régler ; le risque est un **jugement d'authoring**, pas une corruption. Le
  contrat déployé reste sûr (scalaire patché).
- **Option B2 — verrouillé au MVP.** `description` reste préservé/non éditable ; on n'expose que
  `subskills`. Plus prudent, mais **prive l'auteur du champ le plus utile** de la skill.

**Reco : B1 pour `skill.description`** (avec garde). Pour **`persona.description`** : la persona a
déjà `mission` (la ligne humaine d'affichage) comme surface éditable ; sa `description` (blurb de
dispatch) **n'est pas dans `personaFrontmatterPatch`** aujourd'hui. Reco : **laisser
`persona.description` verrouillée au MVP** (asymétrie assumée : la skill EST son blurb ; la persona a
une surface d'édition distincte via `mission`). *Le décideur peut trancher la symétrie inverse.*

### AR-C — Contrôles fantômes → **verrouiller franchement** (reco), sauf là où la persistance a un sens

- `persona.roleIndex`, `role.roleIndex` : **dérivé / préservé-jamais-recalculé** → **verrouiller**
  (afficher en `locked` + hint « index de casting, dérivé du rôle » / « préservé du disque »). Les
  rendre persistants contredirait le modèle (roleIndex n'est pas un champ éditable du fichier persona ;
  côté role il est explicitement préservé verbatim, 5c AR-3).
- `guardrail.kind` : **load-bearing** (enum couplé au code des hooks) → **verrouiller** (P2, affiché
  non éditable). `guardrail.scope` : **n'existe pas sur le disque plat** → **retirer le contrôle** (ou
  l'afficher comme méta dérivée du catalogue, non persistée, clairement étiquetée).
- `skill.label`/`roleKey` : **pas des champs disque** (attribution catalogue) → dépend d'AR-E
  (réconciliation de dualité) ; au minimum, **ne plus les présenter comme persistés**.

**Reco : lever tous les contrôles fantômes du/des pool(s) touché(s) dans le même lot** que l'exposition
de leurs champs réels (sinon on livre un éditeur à moitié honnête).

### AR-D — Corps markdown (`SKILL.md` body) → **différé hors MVP** (reco)

Le corps d'un `SKILL.md` est **le payload réel** de la skill (souvent long, markdown libre). Le socle
le **préserve déjà verbatim** (`verbatimBody`) — donc un round-trip sans édition est sûr. Mais l'exposer
à l'édition (un grand `<textarea>` de markdown libre) est **le plus gros surface / le moins réutilisable**
des patrons, et **orthogonal** aux champs de frontmatter. **Reco : différer** l'édition du corps à un lot
dédié ultérieur ; au MVP, le corps reste **préservé et non édité** (éventuellement affiché en lecture
seule repliable). *Le décideur peut le prioriser, au prix d'un lot P6 à part.*

### AR-E — Dualité `skill`/`guardrail` (atome ↔ attribution/riche) → **rebrancher sur l'atome** (reco)

Pour exposer `description`/`subskills` (skill) et `policy` (guardrail), l'éditeur doit **éditer l'atome
disque**, pas la vue d'attribution/riche. Deux voies :

- **Option E1 (reco) — rebrancher `skillKind`/`SkillEditor` (et `guardrailKind`/`GuardrailEditor`) sur
  l'atome** (`SkillAtom`, `GuardrailAtom`), et faire porter par le `*Persist` l'entrée réelle de
  l'éditeur (au lieu de relire l'atome et jeter l'entrée). Le `roleKey`/`label` d'attribution (skill)
  et le `scope`/`rendering` (guardrail) deviennent, s'ils sont conservés, de la **méta d'affichage
  dérivée du catalogue**, clairement étiquetée non persistée. C'est la voie **honnête et complète**.
- **Option E2 — étendre le type d'attribution/riche** pour héberger les champs disque. Plus court à
  écrire, mais **perpétue deux vérités** (attribution vs disque) et rouvre le risque du Fait 2.

**Reco : E1** — l'atome disque est la vérité ; l'attribution/riche redevient une projection
d'affichage. C'est la même doctrine que « la vérité DÉRIVE des `.md` » (AR-2 du Lot 5).

### AR-F — Découpage en lots (MVP d'abord) → **pilote tranché** puis itérations

- **Lot A — PILOTE (le socle des patrons + les gains purs `src/`).**
  1. **P1 scalaire** : `persona.mission` + `persona.pastille` (le patch les modélise déjà →
     **aucun cœur**, gain immédiat et honnête).
  2. **Socle `<ListEditor>`** (AC5) livré et prouvé sur une **liste structurée** : `scaffold.entries`
     `{path, role, createIfAbsent}` — pool **sans dualité** (`ScaffoldEditor` porte déjà `draft.entries`),
     qui exige d'**élargir `scaffoldFrontmatterPatch`** (+`entries`, `packages/core`, **zéro fixture**).
  3. **Honnêteté** (AC1) sur ces deux pools : verrouiller `persona.roleIndex`.
  *Motif : Lot A prouve P1 (scalaire) + P5 (liste structurée, le patron le plus dur) + l'honnêteté,
  sur des pools **sans dualité**, sans aucun `.md` canon touché.*

- **Lot B — role + guardrail (scalaires + verrouillages honnêtes).** `role.scope` (P1, élargir
  `roleFrontmatterPatch`) ; `guardrail.policy` (P1 textarea, élargir `guardrailFrontmatterPatch`) ;
  verrouiller `role.roleIndex`, `guardrail.kind`, retirer `guardrail.scope` fantôme (AR-C). Guardrail
  reste sur la dualité display (AR-E E1 léger : l'édition ne porte que `label`+`policy`).

- **Lot C — skill (le plus riche, avec dualité E1 pleine).** Rebrancher `skillKind`/`SkillEditor` sur
  `SkillAtom` ; exposer `description` (P3, garde B1) + `subskills` (P4, `<ListEditor>` simple, réutilise
  le socle du Lot A) ; verrouiller `name`, retirer `label`/`roleKey` fantômes. **Corps `SKILL.md`
  différé** (AR-D).

**Reco : livrer Lot A seul, valider en réel, puis B, puis C.** Le décideur peut regrouper B+C ou
réordonner ; la dépendance dure est « le socle `<ListEditor>` du Lot A d'abord » (Lot C le réutilise).

---

## 4. Tableau cible par pool (champs éditables / préservés / fantômes à corriger)

| Pool | Déjà éditable | **À exposer** (patron) | Patch cœur le modélise déjà ? | Reste **préservé/verrouillé** (pourquoi) | **Fantôme à corriger** |
|---|---|---|---|---|---|
| **persona** | name, roleKey, royaume, skills, guardrails | **mission** (P1), **pastille** (P1) | **OUI** (`personaFrontmatterPatch`) → **aucun cœur** | `description` (blurb dispatch, AR-B B2), `vignette`, inconnues, corps, `id` | **roleIndex** (dérivé, jeté au save) → **verrouiller** |
| **principle** | label, policy, trigger | — (aligné) | — | `id` | — |
| **ritual** | label, side, triggers, actions | — (listes déjà éditées) | OUI | `cadence`/`timebox`/inconnues, `id` | — |
| **scaffold** | level (+ nom en création) | **entries[]** `{path,role,createIfAbsent}` (P5) | **NON** → élargir `scaffoldFrontmatterPatch` | `nonDestructive` (invariant), `id` | — |
| **role** | label | **scope** (P1) | **NON** → élargir `roleFrontmatterPatch` | `id`, **`key` (C-1)**, `roleIndex` (préservé, jamais recalculé) | **roleIndex** (jeté au save) → **verrouiller** |
| **guardrail** | label | **policy** (P1 textarea) | **NON** → élargir `guardrailFrontmatterPatch` | **`kind`/`hook`** (load-bearing, couplés hooks), `id` | **kind + scope** (jetés/inexistants) → **verrouiller/retirer** |
| **skill** | — (label/roleKey = attribution, no-op) | **description** (P3, garde), **subskills** (P4 liste) | **OUI** (`skillFrontmatterPatch`) → **aucun cœur** | `id`, **`name` (== id, C-1)**, **corps `SKILL.md`** (payload, AR-D différé) | **label + roleKey** (pas des champs disque) → rebrancher sur l'atome (AR-E) |
| **workflow** | (atelier dédié) | — (HORS chantier) | — | — | — |

> Lecture : **persona.mission/pastille** et **skill.description/subskills** sont des **gains purs
> `src/`** (le patch les modélise déjà). **scaffold.entries / role.scope / guardrail.policy** exigent
> un **petit élargissement additif** de leur `<pool>FrontmatterPatch` (cœur `packages/core`, **zéro
> `.md` canon, zéro fixture** → `vendor-check` drift 0). Les **fantômes** (roleIndex ×2, kind, scope,
> label/roleKey) sont **corrigés dans le lot de leur pool**.

---

## 5. Patrons d'UI (le vrai travail de conception)

**P1 — scalaire simple.** `<input>`/`<textarea>` contrôlé, comme `PrincipleEditor.policy`. `onSubmit`
porte la valeur ; le `*Persist` la passe au `<pool>FrontmatterPatch`. Réutilise l'existant tel quel.

**P2 — enum.** `<select>` d'un `const KINDS[]` (comme `ritual.side`). Au MVP, `guardrail.kind` est
rendu **verrouillé** (affichage), pas un select actif (AR-C).

**P3 — scalaire load-bearing.** `<textarea>` + `lockhint` d'**avertissement** (non un verrou) :
signale la portée (blurb de dispatch) sans empêcher l'édition (AR-B B1). Round-trip sûr (scalaire).

**P4 — liste simple (`<ListEditor>` de strings).** Ajout (input + bouton `+`), suppression par ligne
(bouton `✕`), réordonnancement (↑/↓ ou drag), **ARIA** (`aria-label` par ligne, annonce des
changements). Sert `subskills`. *Précédents internes réutilisables* : les **tags** de
`PersonaEditor.skills` (add/remove) et le **textarea-lignes** de `RitualEditor` (triggers/actions) —
le `<ListEditor>` **généralise** ces deux gestes en un composant unique. **Ne pas** réintroduire de
réémission : la valeur remonte en `string[]`, le `<pool>FrontmatterPatch` (kind `list`) la sérialise ;
`patchFrontmatter` laisse la ligne **verbatim** tant que les valeurs ne changent pas.

**P5 — liste structurée (`<ListEditor>` de lignes `{…}`).** Même socle que P4, mais chaque ligne rend
un **sous-formulaire injecté** (`scaffold.entries` : `path` input + `role` input + `createIfAbsent`
checkbox). Le composant `<ListEditor<T>>` prend un `renderRow(item, onChange)` et un `blankRow` —
patron « générique + injection », cohérent avec `ElementKind`. **C'est le livrable de conception du
pilote** (AC5).

**Corps markdown (différé, AR-D).** Un `<textarea>` de markdown libre écrivant le corps via
`verbatimBody` (préservé si inchangé). **Hors MVP** ; cadré à part le moment venu.

**État de l'art (sources § 12).** Les éditeurs de frontmatter modernes **conservent le corps** sous le
frontmatter et **suivent le type par champ** (scalaire/liste, inline vs bloc) pour un round-trip
propre — exactement le modèle `PatchField {kind: "scalar"|"list"}` + `readListLayout` déjà en place. La
gestion de liste dynamique (add/remove/reorder) est un patron **standard** (React Hook Form
`useFieldArray`, Shadcn/Radix) ; iakaFrameGUI n'utilisant **pas** de lib de formulaire, un `<ListEditor>`
**à la main** (état React local + ARIA) est **cohérent avec les éditeurs existants** et suffisant —
pas d'introduction de dépendance (contrainte zéro-dépendance du cœur ; sobriété côté hôte).

---

## 6. Round-trip, non-régression & C-1 (contraintes DURES)

- **Round-trip préservé par construction.** Le socle (`patchFrontmatter` ne réécrit une ligne que si
  la valeur change ; `verbatimBody` ; `readListLayout`) garantit AC3. **La seule façon de le casser
  côté UI** serait de repasser par un `serialize<Pool>Md` (réémission canonique) en **édition** — ce
  qui est **interdit** (réservé à la **création**). L'UI remonte des valeurs ; le `*Persist` **relit le
  `.md` réel** et **patche** — jamais réémet. Born-red obligatoire par pool touché.
- **Élargir un patch reste non-destructif.** Ajouter `entries`/`scope`/`policy` à un
  `<pool>FrontmatterPatch` réécrit **cette clé** quand elle change et la laisse **verbatim** sinon ;
  toute autre clé (load-bearing, inconnue) + le corps restent préservés. `subskills`/`entries` (listes)
  ne doivent être émises **que non vides** au patch (piège mesuré `skillFrontmatterPatch` : émettre
  `subskills: []` **ajouterait** une ligne parasite et casserait le round-trip d'une skill atomique).
- **C-1.** `id` (tous) et `key` (role) restent **verrouillés** ; `name` (skill) reste verrouillé
  (== id). Aucun renommage de fichier. Les champs load-bearing couplés au code (`guardrail.kind`/`hook`)
  ne sont **jamais** ouverts sans un lot dédié.

---

## 7. Verdict cross-repo → **GUI-only (repo `iakaFrameGUI`), canon iakaframe INTOUCHÉ, drift 0**

**Confirmé : le chantier est GUI-only côté canon.** Aucun `.md` de `~/work/iakaframe/library/`,
aucune fixture, aucun `EXPECTED_COPIES`, aucun `vendor-check` **modifié** — le cœur modélise déjà les
champs (ou les modélisera par élargissement additif **sans effet fichier**), et l'écriture atterrit
dans `<IAKAFRAME_HOME>/library/<pool>/` via le socle 5a–5c. **Nuance importante à porter au gate** :
« GUI-only » **≠ `src/`-only**. Trois champs (`scaffold.entries`, `role.scope`, `guardrail.policy`)
exigent un **élargissement de `<pool>FrontmatterPatch` dans `packages/core`** (+ le champ dans l'atome
si absent) — c'est du **code cœur**, mais **sans toucher aucun octet de fichier `.md`** → `iakaframe
vendor-check --strict` reste **drift 0 par construction**. **Signal de remontée (A-CONF)** : si un
champ visé n'a **aucun home fichier** sur le canon (donc exigerait de modifier un `.md` canon pour
exister), il devient **cross-repo** et **sort de ce périmètre** — l'exécutant remonte au gate plutôt
que de toucher le canon.

---

## 8. Portée précise du changement (mesurée, par fichier) — pour le Lot A (pilote)

**Cœur `~/work/iakaFrameGUI/packages/core/src`** :
- `scaffold.ts` — **élargir `scaffoldFrontmatterPatch`** avec `entries` (kind `list` de maps
  structurées, ou sérialisation dédiée `- { path, role, createIfAbsent }` alignée sur le parseur
  `parseScaffoldEntry`). **Émettre `entries` uniquement si l'édition l'a modifiée** (sinon verbatim).
  Aucune signature existante retirée ; `serializeScaffoldMd` (création) inchangé ou aligné. *Aucun
  autre pool touché au Lot A.*

**Hôte `~/work/iakaFrameGUI/src`** :
- **`components/ListEditor.tsx`** (NOUVEAU) — le composant réutilisable P4/P5 (générique `<T>`,
  `renderRow` + `blankRow`, add/remove/reorder, ARIA). Livrable de conception.
- `components/PersonaEditor.tsx` — ajouter les champs **`mission`** (input) et **`pastille`** (input
  emoji) ; **verrouiller `roleIndex`** (classe `locked` + hint « dérivé du rôle »).
- `components/ScaffoldEditor.tsx` — remplacer l'affichage `locked` des `entries` par le
  `<ListEditor>` (P5) ; remonter les `entries` éditées dans `onSubmit`.
- `forge/scaffoldPersist.ts` — s'assurer que `persistScaffold` porte les `entries` de l'éditeur
  (aujourd'hui préservées ; désormais patchées quand modifiées). `forge/personaPersist.ts` : inchangé
  (mission/pastille déjà dans `personaFrontmatterPatch`).
- Rectifier en passant les **en-têtes périmés** (`skillKind`/`guardrailKind`/`roleKind` « Lot 5
  différé ») — dette de lisibilité, pas de logique.

**Aucun fichier `~/work/iakaframe/**` modifié.** Aucune écriture hors `specs/instructions/` pour ce
cadrage.

*(Lots B/C : `packages/core/src/roles.ts`, `guardrail.ts` — élargir les patches ; `src/components/
{Role,Guardrail,Skill}Editor.tsx` + `forge/{role,guardrail,skill}Persist.ts` + `{skill,guardrail}Kind`
rebranchés sur l'atome. Détail au lancement de chaque lot.)*

---

## 9. Critère d'ouverture d'exécution (A-CONF)

Avant tout code, l'exécutant **localise et confirme sur pièce** (outillage de listage indisponible au
cadrage — le contrat de données ci-dessus fait foi) :
(a) le **site de montage** exact de chaque pool (`PersonaReservoir`/`ScaffoldReservoir`/… → `persist`/
`loadElements` passés à `ElementReservoir`) — mesuré pour persona (`PersonaReservoir` + `personaPersist`)
et principe (`principlePersist`) ; les autres wrappers sont à confirmer ;
(b) que **`scaffoldFrontmatterPatch` n'émet aujourd'hui que `level`** (mesuré) et que `parseScaffold`/
`parseScaffoldEntry` restituent bien `entries` (mesuré) → l'élargissement est additif ;
(c) qu'aucun champ du tableau § 4 n'exige de modifier un `.md` **canon** (§ 7 — sinon **remonte au
gate**) ;
(d) que les born-red round-trip s'appuient sur des **fixtures réelles** du pool touché (scaffold pour
le Lot A). Toute divergence entre la mesure et le disque est **signalée au gate**.

---

## 10. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Lot A (pilote) : ~1,5–2,5 j-h.** `<ListEditor>` générique + ARIA + tests (~0,75–1, le vrai design) ; élargissement `scaffoldFrontmatterPatch` (entries) + born-red round-trip (~0,4) ; `ScaffoldEditor` branché sur `<ListEditor>` (~0,4) ; `persona.mission`+`pastille` + verrou `roleIndex` (~0,3, gain pur) ; rectif en-têtes + suites (~0,25). **Lot B (role.scope + guardrail.policy + verrouillages) : ~1–1,5 j-h** (2 petits élargissements de patch + 2 scalaires + honnêteté ; réutilise le socle). **Lot C (skill : dualité E1 + description + subskills) : ~1,5–2,5 j-h** (rebranchement `skillKind`/`SkillEditor` sur `SkillAtom` = le gros ; `<ListEditor>` simple réutilisé ; garde B1 ; corps différé). **Total ~4–6,5 j-h** pour les 3 lots. |
| **Complexité / risque** | **FAIBLE à MOYENNE.** L'I/O et le round-trip sont **acquis** (Lot 5) ; le seul vrai travail neuf est le **`<ListEditor>` réutilisable** (P4/P5) et la **réconciliation de dualité** skill/guardrail (Lot C). Risque round-trip **maîtrisé** (patch en place, jamais de réémission en édition ; born-red par pool). Risque cross-repo **nul** côté canon (drift 0 par construction, § 7). Le point de vigilance est l'**honnêteté** : ne pas livrer un éditeur à moitié corrigé (contrôle fantôme résiduel). |
| **Inconnues (susceptibles de faire glisser)** | (1) **Réordonnancement de liste** : ↑/↓ (simple) vs drag-and-drop (plus riche mais +accessibilité/tests, +0,25–0,5 j-h) — à trancher au Lot A. (2) **Dualité skill** (Lot C) : si le rebranchement sur `SkillAtom` impacte `skillCards`/`toAuthoredEntity`/Fëanor-en-tête plus que prévu, +0,5 j-h. (3) **`guardrail.scope` fantôme** : retirer le contrôle vs le garder en méta d'affichage — décision d'UX à confirmer. (4) **`persona.description`** (AR-B) : si le décideur veut la symétrie « éditable comme skill », +0,25 j-h (élargir `personaFrontmatterPatch`). (5) Un `entries`/`subskills` au **layout bloc** inhabituel du canon pourrait exiger un soin `readListLayout` supplémentaire (à vérifier au born-red). |

> Rappel méthode : estimation **rappelée à la clôture du lot**, confrontée au temps réel, pour affiner
> les suivantes. Pas un engagement ferme.

---

## 11. Récapitulatif des tranches (pour le décideur)

1. **Nature du travail** → 3 couches superposées : exposer des champs **déjà modélisés** (gain pur
   `src/`), **élargir** 3 patches (cœur, zéro fixture), **corriger les contrôles fantômes**
   (honnêteté) — cadrées par **patron d'UI**, pas par pool (§ 3 AR-A).
2. **Load-bearing `description`** → **éditable avec garde** (skill) ; persona.description **verrouillée
   au MVP** (surface `mission` distincte) — AR-B, décideur peut inverser.
3. **Contrôles fantômes** → **verrouiller franchement** roleIndex ×2 / guardrail.kind, **retirer**
   guardrail.scope, **rebrancher** skill sur l'atome (AR-C/AR-E).
4. **Corps `SKILL.md`** → **différé hors MVP** (AR-D).
5. **Patrons d'UI** → `<ListEditor>` réutilisable (simple + structuré), scalaire, scalaire load-bearing
   avec garde, enum verrouillé (§ 5).
6. **Découpage** → **Lot A pilote** (mission/pastille + socle `<ListEditor>` sur `scaffold.entries` +
   honnêteté), puis **B** (role.scope + guardrail.policy), puis **C** (skill riche + dualité) — AR-F.
7. **Cross-repo** → **GUI-only côté canon, drift 0 par construction** ; « GUI-only » ≠ « src-only »
   (3 patches cœur, sans effet fichier) ; remontée au gate si un champ exigeait de toucher un `.md`
   canon (§ 7).

---

## 12. Sources (faits externes vérifiés — obligation de sourcing)

Les décisions dépendant d'un fait externe sont **les patrons d'UI** (P4/P5 éditeur de liste ; édition
de frontmatter préservant le round-trip). L'état de l'art confirme : (a) l'édition dynamique de listes
(add/remove/reorder) est un **patron standard** (React Hook Form `useFieldArray`, Shadcn/Radix), avec
**ARIA** obligatoire pour l'accessibilité — ce qui **valide** un `<ListEditor>` à la main + ARIA
(cohérent avec les éditeurs hand-rolled existants, aucune dépendance introduite) ; (b) les éditeurs de
frontmatter modernes **conservent le corps** sous le frontmatter et **suivent le type par champ**
(scalaire/liste, inline vs bloc) pour un round-trip propre — ce qui **valide** le modèle en place
(`PatchField {kind}` + `verbatimBody` + `readListLayout`) et le choix de **différer** l'édition du corps
(AR-D). Le round-trip non-destructif lui-même reste celui établi au Lot 5a (état de l'art YAML
préservant), **aucune dépendance nouvelle**.

- [8 Best React Form Libraries for Developers (2025) — snappify](https://snappify.com/blog/best-react-form-libraries)
- [Building Dynamic Form Fields with React and Shadcn UI — Medium](https://medium.com/front-end-world/building-dynamic-form-fields-with-react-and-shadcn-ui-93454652b2d6)
- [ReactJS useForm for Dynamic Forms (useFieldArray) — daily.dev](https://daily.dev/blog/reactjs-useform-for-dynamic-forms/)
- [React Accessibility (A11y) Best Practices and Guidelines — rtcamp](https://rtcamp.com/handbook/react-best-practices/accessibility/)
- [Markdown Frontmatter Editor — YAML per-field types & round-trip](https://trymarkdownviewer.com/tools/markdown-frontmatter-editor)
- [Frontmatter — mdedit.ai Docs (form fields, save-to-frontmatter)](https://docs.mdedit.ai/markdown-features/frontmatter)
- [Round-trip format conversion — Wikipedia](https://en.wikipedia.org/wiki/Round-trip_format_conversion)
