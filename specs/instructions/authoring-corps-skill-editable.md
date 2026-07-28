# Instruction — Rendre le corps du `SKILL.md` éditable (chantier #4, lot « corps skill »)

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-28), sur mission Aragorn (« corps skill »). Ce lot
> **lève le différé AR-D** de l'instruction sœur `authoring-champs-riches-editeurs.md` (§ 3 AR-D, § 5 :
> « corps markdown → différé hors MVP, lot P6 à part »). **Cadrage pur — ZÉRO code produit ici.** Ce
> fichier est le seul artefact ; l'écriture Gandalf est bornée à `specs/instructions/`. Exécution
> downstream = ⚒️ Gimli ; gate P2→P3 = 🏹 Legolas.
>
> **Constats mesurés sur le disque le 2026-07-28** — `preuve-avant-declaration`. Dépôt du code :
> `~/work/iakaFrameGUI` (cœur `packages/core` + hôte React `src/`). Dépôt canon/vendorage :
> `~/work/iakaframe` (`library/` + CLI + `vendor-check`). **Lecture seule sur le code.** Citations par
> nom de fichier/symbole (les pointeurs chiffrés vieillissent) ; le message de remise à Aragorn porte
> les `chemin:ligne` cliquables. Limite d'outillage assumée : ripgrep absent (`Glob`/`Grep` en échec) —
> la mesure a été faite par **lecture directe** des fichiers cités.

---

## 0. Le constat qui tranche le mécanisme (à lire avant tout)

Le besoin — « rendre éditable le corps markdown du `SKILL.md` » — se heurte à **trois faits mesurés**
qui, ensemble, tranchent le mécanisme. Ce n'est **pas** « ajouter un `<textarea>` » : c'est **faire
entrer le corps dans le flux atome→éditeur→persist**, qui aujourd'hui l'ignore de bout en bout.

**Fait 1 — le corps n'entre JAMAIS dans l'atome.** `SkillAtom` (`skill.ts`) porte
`{id, name, description, subskills}` — **pas de champ `body`**. Au chargement (`frame.ts` `buildFrame`,
`skillList`), l'atome est construit par `parseSkill(parseFrontmatter(md).data)` : seul le **`.data`**
(frontmatter) est passé ; le **`.body`** rendu par `parseFrontmatter` est **jeté**. Conséquence : le
corps n'atteint **jamais** `SkillEditor` (qui reçoit `element: SkillAtom`). Pour le rendre éditable, il
faut d'abord **le charger dans l'atome**.

**Fait 2 — `patchFrontmatter` PRÉSERVE le corps mais ne peut pas le MODIFIER.** Le patcheur
(`frontmatter.ts`) découpe le document en `fmLines` (lignes du frontmatter) et
`tail = lines.slice(end)` (le `---` fermant **+ tout le corps**), puis reconstruit
`["---", ...next, ...tail]` : le `tail` — donc le corps — est **repassé verbatim**, jamais réécrit. Le
patcheur **n'a structurellement aucune voie** pour changer le corps. C'est exactement ce qui garantit
le round-trip du corps aujourd'hui — et exactement ce qui empêche de l'éditer.

**Fait 3 — `serializeSkillMd(s, body)` sait écrire un corps, mais RÉ-ÉMET le frontmatter
canoniquement.** Le sérialiseur de **création** accepte bien un `body` (`buildDocument(fields, body)`),
mais il reconstruit le frontmatter **de zéro** depuis le type `{id,name,description,subskills}` — il
**perd** toute clé load-bearing / inconnue absente du type (le commentaire de `persistSkill` cite
`layer`, « inconnues ») **et** le layout des listes. Il est donc **byte-préservant du frontmatter :
NON** — réservé à la création d'un fichier neuf (rien à préserver), jamais à l'édition d'un existant.

> **Verdict de mesure (réponse à la question du brief).** **Le cœur n'a AUCUNE voie existante pour
> écrire un corps modifié tout en préservant le frontmatter à l'octet.** Les deux voies présentes sont
> complémentaires et incomplètes : `patchFrontmatter` préserve le corps sans pouvoir le changer ;
> `serializeSkillMd` change le corps mais ré-canonicalise le frontmatter. **Il faut donc une fonction
> additive** : un « patcheur de corps » `patchBody`, **image miroir** de `patchFrontmatter` (préserve le
> frontmatter à l'octet, remplace le corps). C'est une **addition pure `packages/core`**, sans toucher
> aucun `.md`/fixture → `vendor-check` drift 0 par construction.

---

## 1. Problème (avant la solution)

Depuis le Lot C du chantier authoring, `SkillEditor` rend l'édition d'une skill **honnête et complète
sur le frontmatter** (`description` load-bearing + `subskills` via `<ListEditor>`, `id`/`name`
verrouillés). Mais le **corps du `SKILL.md` — le vrai payload de la skill** (les instructions que le
sous-agent lit et exécute, souvent longues) — reste **préservé verbatim mais non éditable** (différé
AR-D). L'auteur d'un frame peut régler le blurb de déclenchement d'une skill, composer ses sous-skills,
mais **pas toucher à ce que la skill fait réellement**. Le décideur veut lever ce différé : **éditer le
corps** depuis l'éditeur de skill, sans jamais altérer un octet du frontmatter (clés load-bearing
intactes).

**Ce n'est PAS** : modifier les sérialiseurs de contrat de `frontmatter.ts` (miroir byte-à-byte du CLI,
intouchables) ; toucher au canon `~/work/iakaframe/library/` ou aux fixtures/`vendor-check` ; rendre
`id`/`name` éditables (C-1, verrouillés) ; ajouter un **rendu markdown live** (preview) au MVP ; exposer
le corps dans la **proposition Fëanor** (`skillProposition` — le payload n'est pas un champ proposable
au MVP) ; ouvrir le corps des **autres pools** (persona/principe… ont un corps de prose — itération,
§ 8).

---

## 2. Décision retenue (mécanisme tranché)

Trois additions, toutes **rétrocompatibles**, sur le patron « la vérité DÉRIVE du `.md` » déjà établi :

**(D1) Cœur — nouvelle fonction `patchBody(rawMd, newBody): string` dans `frontmatter.ts`**, image
miroir de `patchFrontmatter` :
- découpe `lines = rawMd.split("\n")` ; localise le `---` fermant (`end`), comme `patchFrontmatter` ;
- **conserve `lines.slice(0, end + 1)` littéralement** (l'ouvrant `---`, les lignes de frontmatter,
  le `---` fermant) — **jamais reparsé, jamais réémis** → **frontmatter byte-identique par
  construction** ;
- renvoie `head.join("\n") + "\n" + newBody`.
- **Invariant** : `patchBody(md, verbatimBody(md)) === md` (round-trip exact quand le corps est
  inchangé — AC1).
- **Défensif** (esprit cœur) : document sans frontmatter délimité (`---` … `---`) → **rendu inchangé**
  (jamais de corruption d'un fichier malformé ; born-red couvre le cas nominal). Miroir de la posture
  défensive de `patchFrontmatter`.

**(D2) Cœur — étendre `SkillAtom` d'un champ `body: string`** (addition pure) :
- `parseSkill(raw, body = "")` reçoit le corps en 2e paramètre (défaut `""`, rétrocompatible) ;
- `buildFrame` (`frame.ts`, `skillList`) passe `verbatimBody(md)` :
  `parseSkill(parseFrontmatter(md).data, verbatimBody(md))`. **⚠️ Source du corps = `verbatimBody(md)`,
  JAMAIS `parseFrontmatter(md).body`** — ce dernier **strippe le `\n` de tête** (cf. `splitDocument`),
  ce qui casserait la byte-parité du contrat déployé. `verbatimBody` préserve la ligne blanche de tête
  et le `\n` final.
- Le corps voyage désormais **avec l'atome** jusqu'à `SkillEditor` (`element.body`) — **aucune
  I/O supplémentaire côté hôte** : les fiches du réservoir sont déjà bâties depuis `frame.skills`.

**(D3) Hôte — une zone d'édition du corps dans `SkillEditor`** + composition à l'écriture :
- un grand `<textarea>` (payload) seedé depuis `element.body`, remonté dans `onSubmit` (l'atome émis
  porte `body`) ;
- `persistSkill` (`skillPersist.ts`) **compose** sur les deux chemins :
  - **édition** : `patchBody(patchFrontmatter(existing, skillFrontmatterPatch(s)), s.body)` — les deux
    patcheurs touchent des **régions disjointes** (frontmatter ↔ corps), l'ordre est sûr, chacun
    re-localise le délimiteur ;
  - **création** : `serializeSkillMd({...}, s.body)` (le sérialiseur accepte déjà `body`).

> **Pourquoi étendre l'atome (D2) plutôt que charger le corps à la volée dans l'hôte.** L'atome EST
> l'unité qui circule éditeur→`onSubmit`→`persist` ; y porter le corps est le chemin **cohérent avec
> le socle** (même doctrine que le Lot C : l'atome est la vérité disque) et **sans wiring d'hôte** (le
> corps arrive « gratuitement » dans `element` parce que les cartes viennent de `frame.skills`). Le
> coût — le corps en mémoire pour chaque carte du réservoir — est **négligeable** (peu de skills,
> payload borné) et assumé.

**Pas de rendu markdown live au MVP** : `<textarea>` brut d'édition du texte. Sobriété ; pas de
dépendance introduite (le cœur est zéro-dépendance, l'hôte reste hand-rolled). Preview = itération (§ 8).

---

## 3. Périmètre

- **Inclus** :
  1. `patchBody` dans `packages/core/src/frontmatter.ts` (+ export) — D1.
  2. Champ `body` sur `SkillAtom` + `parseSkill(raw, body?)` — `packages/core/src/skill.ts` — D2.
  3. Capture `verbatimBody(md)` dans `buildFrame` — `packages/core/src/frame.ts` — D2.
  4. `<textarea>` de corps dans `SkillEditor` + `body` dans l'atome émis — `src/components/SkillEditor.tsx` — D3.
  5. Composition `patchBody` (édition) + `body` en création dans `persistSkill` — `src/forge/skillPersist.ts` — D3.
  6. Défauts `body: ""` là où un `SkillAtom` vierge est construit (TS l'imposera) : `EMPTY`
     (`SkillEditor`), `blankSkill` (`skillKind.tsx`), `cloneSkillCatalog` (`skillCards.ts`).
  7. Born-red round-trip (§ 6) sur une **fixture skill réelle**.
- **Exclu** : rendu/preview markdown live ; corps dans la proposition Fëanor (`skillProposition` reste
  inchangé — corps hors schéma) ; corps des autres pools (persona/principe/…) ; toute modification de
  `frontmatter.ts` **sérialiseurs de contrat** ; tout fichier `~/work/iakaframe/**` (canon/fixtures) ;
  `id`/`name` éditables (C-1).

---

## 4. Étapes d'implémentation

1. **Cœur `patchBody`** (`frontmatter.ts`) — écrire la fonction miroir (§ 2 D1) + l'exporter. Born-red
   d'abord (§ 6) : identité quand `newBody === verbatimBody(md)` ; remplacement quand le corps change,
   frontmatter byte-inchangé ; défensif si pas de frontmatter.
2. **Cœur `SkillAtom.body`** (`skill.ts`) — ajouter `body: string` ; `parseSkill(raw, body = "")`
   renvoie `body`. Adapter le commentaire d'en-tête (le corps n'est plus « préservé verbatim, non
   exposé » : il devient éditable). `skillFrontmatterPatch` **inchangé** (le corps n'est pas un champ de
   frontmatter).
3. **Cœur `buildFrame`** (`frame.ts`) — `parseSkill(parseFrontmatter(md).data, verbatimBody(md))` dans
   `skillList`. Vérifier que `verbatimBody` est importable dans `frame.ts` (même module `frontmatter`).
4. **Hôte défauts** — `body: ""` dans `EMPTY` (`SkillEditor`), `blankSkill()` (`skillKind.tsx`),
   `cloneSkillCatalog()` (`skillCards.ts`). `tsc` guide (le type impose le champ).
5. **Hôte `SkillEditor`** — ajouter, sous la section `subskills`, un bloc « Corps du `SKILL.md`
   (payload) » : `<textarea>` grand (≈ `rows={16}`), `value={draft.body}`,
   `onChange → patch({ body })`, seedé depuis `element.body`. Émettre `body: draft.body` dans
   `onSubmit` (**pas de trim** du corps — le payload markdown peut légitimement porter des blancs de
   tête/fin ; c'est l'édition de l'auteur). Hint discret : « payload markdown lu et exécuté par le
   sous-agent ».
6. **Hôte `persistSkill`** — édition : `patchBody(patchFrontmatter(existing, skillFrontmatterPatch(s)), s.body)` ;
   création : `serializeSkillMd({ id, name, description, subskills }, s.body)`.
7. **Suites** — `vitest` + `tsc` + `eslint` (GUI) verts ; born-red rouges→verts. `iakaframe vendor-check
   --strict` (canon) **drift 0** ; `frame lint --all --strict` exit 0.

---

## 5. Fichiers concernés (mesurés)

**Cœur `~/work/iakaFrameGUI/packages/core/src`** :
- `frontmatter.ts` — **AJOUT** `patchBody` (+ export) ; **aucun** sérialiseur de contrat touché.
- `skill.ts` — `SkillAtom` + `body` ; `parseSkill(raw, body?)`.
- `frame.ts` — `skillList` : passer `verbatimBody(md)` à `parseSkill`.

**Hôte `~/work/iakaFrameGUI/src`** :
- `components/SkillEditor.tsx` — `<textarea>` corps + `body` dans l'atome émis + `EMPTY.body`.
- `forge/skillPersist.ts` — composition `patchBody` (édition) + `body` (création).
- `forge/skillKind.tsx` — `blankSkill().body = ""`.
- `forge/skillCards.ts` — `cloneSkillCatalog()` : `body: ""`.

**Inchangés** (mesurés, à ne PAS toucher) : `skillProposition.ts` (corps hors proposition MVP),
`ListEditor.tsx`, `skillFrontmatterPatch`. **Aucun fichier `~/work/iakaframe/**`.** Aucune écriture hors
`specs/instructions/` pour ce cadrage.

---

## 6. Round-trip, non-régression & C-1 (contraintes DURES)

- **AC-round-trip (DUR).** Pour une skill dont le corps **n'est pas édité** :
  `lire SKILL.md → (aucune édition) → réécrire` reste **byte-identique**. Garanti par construction :
  `patchFrontmatter` laisse le frontmatter verbatim si rien ne change, `patchBody` renvoie l'entrée si
  `s.body === verbatimBody(existing)` (et `existing`, relu frais, a le corps que l'atome porte). **Seul
  le corps édité change les octets du corps ; le frontmatter reste byte-inchangé** (clés load-bearing
  `layer`/inconnues intactes). Prouvé **born-red** sur une **fixture skill réelle** (un `SKILL.md` du
  canon avec corps non trivial + une clé de frontmatter au-delà de `{id,name,description,subskills}`
  pour prouver la préservation).
- **Invariant LF (fait externe vérifié — § 9).** Le `.value` d'un `<textarea>` HTML **normalise les
  retours-ligne en LF** sur tous les navigateurs/plateformes ; les fichiers de la bibliothèque sont en
  **LF** (invariant explicite de `patchFrontmatter` : « les fichiers de la bibliothèque sont en LF »).
  Seeder le textarea avec `verbatimBody` (LF) et relire `.value` (LF) est donc **byte-sûr**. Le
  born-red verrouille cette identité — aucune injection CRLF.
- **Composition disjointe.** `patchFrontmatter` touche `fmLines`, `patchBody` touche le corps
  (`lines.slice(end+1)`) : régions disjointes, chacune re-localise `---`. L'ordre
  `patchBody(patchFrontmatter(...), body)` est sûr (le corps survit intact au patch de frontmatter, qui
  le préserve).
- **C-1.** `id`/`name` restent verrouillés (inchangé). Le corps n'est **pas** une identité : l'éditer
  ne renomme rien.

---

## 7. Verdict cross-repo → **GUI-only côté canon (drift 0), avec addition cœur (≠ src-only)**

**Confirmé.** Le chantier vit **entièrement dans `~/work/iakaFrameGUI`**. Aucun `.md` de
`~/work/iakaframe/library/`, aucune fixture, aucun `EXPECTED_COPIES`, aucun `vendor-check` **modifié** —
l'écriture atterrit dans `<IAKAFRAME_HOME>/library/skills/<id>/SKILL.md` via le socle. **Nuance à porter
au gate, identique aux lots précédents** : « GUI-only côté canon » **≠ `src/`-only**. Ce lot exige une
**addition de code `packages/core`** (`patchBody` + `SkillAtom.body`) — c'est du **code cœur**, mais
**sans toucher aucun octet d'aucun fichier `.md`** → `iakaframe vendor-check --strict` reste **drift 0
par construction**. La réponse à la question du brief est donc : **cross-repo au sens « +core additif »**
(le cœur gagne une fonction de remplacement de corps), **pas** GUI-src-only — parce que le cœur, mesuré,
**ne savait pas** écrire un corps modifié en préservant le frontmatter.

---

## 8. Portée & itérations signalées

- **Skill d'abord (pilote).** Le corps du `SKILL.md` est **le payload réel** de la skill — c'est le pool
  où l'édition du corps a le plus de valeur (la persona/le principe ont un corps de **prose légère**,
  moins critique). Ce lot le traite seul.
- **Généralisation gratuite du cœur.** `patchBody` est **agnostique du pool** : rendre le corps
  éditable pour persona/principe/rituel/… au moment voulu sera une **pure addition UI** (textarea +
  `body` sur l'atome concerné + composition `patchBody` au persist), **sans nouveau code cœur**.
  À cadrer à part le moment venu.
- **Rendu markdown live (preview).** Hors MVP. Introduirait une dépendance de rendu côté hôte
  (aujourd'hui hand-rolled, zéro-dép) — à peser dans un lot dédié si le besoin se confirme.

---

## 9. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **~0,75–1,25 j-h.** `patchBody` + born-red round-trip (le vrai livrable de sûreté, ~0,4) ; `SkillAtom.body` + `parseSkill` + `buildFrame` + défauts `body:""` (~0,2, additif guidé par `tsc`) ; `<textarea>` dans `SkillEditor` + composition `persistSkill` (~0,25) ; suites + `vendor-check`/`frame lint` (~0,15). |
| **Complexité / risque** | **FAIBLE.** Le socle est acquis (patcheur, `verbatimBody`, éditeur, persist) ; le seul code neuf est `patchBody` — **image miroir** d'un `patchFrontmatter` déjà éprouvé, sur des régions disjointes. Round-trip **maîtrisé** (invariant LF vérifié, born-red par construction). Cross-repo **nul** côté canon (drift 0). |
| **Inconnues (susceptibles de faire glisser)** | (1) **Fixture born-red** : trouver/retenir un `SKILL.md` canon portant une clé de frontmatter **au-delà** de `{id,name,description,subskills}` (ex. `layer`) pour prouver la préservation load-bearing — si aucune n'existe, fabriquer une fixture GUI-locale (pas de canon touché) : +0,1 j-h. (2) **Défensif `patchBody` sans frontmatter** : trancher « rendu inchangé » (reco) vs « corps remplacé » — décision mineure à confirmer au born-red. (3) **Grandes payloads** : si une skill a un corps très long, vérifier que le `<textarea>` contrôlé React reste fluide (non bloquant au MVP ; sinon `defaultValue` non contrôlé + lecture au submit, +0,15 j-h). (4) `SkillAtom` étendu : si un test cœur assertait **exactement** 4 clés, il naît rouge (attendu, additif) : +0,1 j-h de mise à jour. |

> Rappel méthode : estimation **rappelée à la clôture du lot**, confrontée au temps réel. Pas un
> engagement ferme.

---

## 10. Critères d'acceptation (mesurables)

- [ ] **AC1 — round-trip corps inchangé (DUR).** Ouvrir une skill réelle, enregistrer **sans toucher le
      corps** → `SKILL.md` **byte-identique** (frontmatter ET corps). Born-red vert.
- [ ] **AC2 — édition du corps.** Modifier le corps dans le `<textarea>`, enregistrer → **seul le corps**
      change sur disque ; **frontmatter byte-inchangé** (toute clé, y compris load-bearing/inconnue,
      intacte). Born-red vert.
- [ ] **AC3 — le corps atteint l'éditeur.** `SkillEditor` affiche le corps réel de la skill ouverte
      (via `element.body`, capturé par `verbatimBody` dans `buildFrame`), pas un champ vide.
- [ ] **AC4 — création.** Créer une skill avec un corps saisi → `SKILL.md` neuf portant ce corps
      (`serializeSkillMd(..., body)`), frontmatter canonique valide.
- [ ] **AC5 — `patchBody` cœur.** `patchBody(md, verbatimBody(md)) === md` (identité) ; corps changé →
      frontmatter préservé ; pas de frontmatter → rendu inchangé (défensif). Testé dans le cœur.
- [ ] **AC6 — C-1 & sérialiseurs.** `id`/`name` restent verrouillés ; les sérialiseurs de contrat de
      `frontmatter.ts` restent **byte-inchangés** ; `skillFrontmatterPatch` inchangé.
- [ ] **AC7 — canon intouché.** `iakaframe vendor-check --strict` **drift 0** ; `frame lint --all
      --strict` **exit 0** ; aucun fichier `~/work/iakaframe/**` modifié.
- [ ] **AC8 — suites vertes.** `vitest` + `tsc` + `eslint` (GUI) verts ; born-red d'AC1/AC2/AC5
      naissent rouges puis verts ; aucune régression des tests de persistance skill (Lot C) ni du
      `<ListEditor>`.

---

## 11. Sources (faits externes vérifiés — obligation de sourcing)

Le fait externe dont dépend le mécanisme est le **round-trip byte d'un `<textarea>`** : sa valeur
(`.value` / API value) **normalise les retours-ligne en U+000A LF** sur tous les navigateurs (Firefox et
Safari normalisant même en LF sur toutes plateformes). Comme les fichiers de la bibliothèque sont en LF,
seeder le textarea avec `verbatimBody` (LF) et relire `.value` (LF) est **byte-sûr** — ce qui **valide**
l'approche « textarea brut » sans normalisation ni dépendance. L'état de l'art des éditeurs de
frontmatter (déjà sourcé en `authoring-champs-riches-editeurs.md` § 12) confirme par ailleurs que l'on
**conserve le corps sous le frontmatter** et qu'un round-trip propre suit la structure — exactement le
modèle `verbatimBody` + `patchBody` retenu ici.

- [The HTML `<textarea>` element — value normalizations (raw / API LF / submission CRLF) — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea)
- [JavaScript Traps and Pitfalls: Three Normalizations of `<textarea>` Element's Value](https://zzz.buzz/2017/12/21/javascript-traps-and-pitfalls-three-normalizations-of-textarea-elements-value/)
- [WHATWG HTML — Investigate textarea newline normalization (Issue #6647)](https://github.com/whatwg/html/issues/6647)
