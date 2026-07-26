# Instruction — Enrichissement du modèle Persona : surfacer royaume / mission / pastille / skills / guardrails jusqu'aux fiches du réservoir GUI

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (besoin remonté par
> ⚒️ Gimli au Lot 3 de `alignement-gui-modele-de-frame.md`, confirmé par 🏹 Legolas).
> **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture Gandalf est
> bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli (**cross-repo** canon iakaframe +
> `iakaFrameGUI/packages/core`, § 6), gate P2→P3 = 🏹 Legolas.
>
> **Constats mesurés sur le disque le 2026-07-26** — `preuve-avant-declaration`. Côté iakaframe :
> `~/work/iakaframe` (réservoir, v0.28.0). Côté GUI : `~/work/iakaFrameGUI` (lecture seule).
> Citations par **nom de fichier / de symbole**, jamais par `chemin:ligne` (les pointeurs chiffrés
> vieillissent ; le message de remise à Aragorn, lui, porte les `chemin:ligne` cliquables).
>
> **Limite de mesure assumée (honnêteté de sourcing).** Le **composant React exact** qui rend les
> fiches du réservoir (Lot 3 mergé) **n'a pas pu être localisé** à ce cadrage : l'outillage de
> listage de l'environnement est indisponible (ripgrep absent → `Glob`/`Grep` en échec). Le **contrat
> de données** ci-dessous est ce qui fait foi ; l'identification du consommateur précis est portée en
> critère d'ouverture d'exécution (**A-CONF**, § 5).

---

## 0. Le constat qui recadre le besoin (à lire avant tout)

Le besoin remonté est juste — **les fiches du réservoir sont pauvres et partiellement fausses** —
mais sa **cause mesurée** n'est PAS « le canon ne porte pas les champs ». Vérifié sur pièces :

- **Le canon `.md` porte DÉJÀ tout.** `library/personas/gimli.md` déclare `royaume: IAKAFRAME`,
  `pastille: "🔴"`, `skills: [iakaframe-fabrication]`, `guardrails: [identity, perimeter]`,
  `description: …`. Idem pour les 9 personas. **Rien n'est absent du frontmatter canon.**
- **Le schéma typé porte DÉJÀ ces champs.** `library/_schema/frontmatter.json` déclare, pour
  `personas`, les optionnels `royaume`, `pastille`, `vignette`, `description`, `skills`, `guardrails`.
  **Le seul champ qui n'y figure pas est `mission`.**
- **La vendorisation copie DÉJÀ les 9 persona `.md` byte-à-byte** (`cli/src/lib/vendor.js`,
  `fixtureTable()` famille `personas` → `packages/core/__tests__/fixtures/personas/<id>.md`). Les
  fixtures vendorées portent donc déjà la donnée riche.
- **Le cœur GUI PARSE DÉJÀ ces champs mais les JETTE.** `parsePersona` (`packages/core/src/persona.ts`)
  lit `royaume` (VERBATIM si présent), `pastille`, `skills`, `guardrails` — il ne retombe sur
  `roleKey.toUpperCase()` **que** si `royaume` est absent. Et `buildFrame` (`packages/core/src/frame.ts`)
  parse les personas réelles en `personaList`… **uniquement pour l'intégrité** (`checkFrameRefs`) :
  cette liste riche **n'est jamais exposée sur l'objet `Frame`** (le frame n'expose que
  `poolIds.personas` = des **ids**, et `counts.personas`).

**Conséquence — la vraie cause du bug.** La fiche « DEV pour Gimli » ne vient PAS d'un parse du `.md`
(qui donnerait `IAKAFRAME`). Elle vient de **`CANONICAL_ROSTER`** (`packages/core/src/roster.ts`), une
**table SYNTHÉTIQUE écrite à la main** : `royaume: role.key.toUpperCase()` (→ `DEV`),
`guardrails: []` (toujours vide), **pas de `pastille`**, **pas de `description`**, et `skills` tirés
d'un `DEFAULT_SKILLS` où `dev: []`. **La fiche du réservoir consomme le gabarit synthétique
`CANONICAL_ROSTER` au lieu des personas réelles parsées du frame chargé.** C'est un **doublement de
la vérité** : une table à la main plus pauvre que le `.md` qu'elle est censée refléter.

> **Ce que cela change pour le décideur.** L'« enrichissement » demandé est à **~90 % un
> SURFAÇAGE de données déjà présentes**, pas un ajout au canon. Le **seul** datum réellement neuf
> côté canon est la **ligne de mission** — et encore, seulement si on choisit un champ dédié plutôt
> que de réutiliser `description` (arbitrage **AR-1**, § 3). Cela **réduit l'ampleur** et **déplace
> le centre de gravité** vers `iakaFrameGUI/packages/core`. La contrainte « touche le canon ET les
> fixtures » posée au brief n'est vraie **que** si l'on retient AR-1 = champ `mission` dédié.

**Il n'y a PAS de type/parseur `Persona` côté CLI.** La CLI (`cli/src/lib/library.js`) manipule le
frontmatter en **dictionnaire générique** (`readEntry` → `data`), sans modèle typé. Le type `Persona`,
`parsePersona` et `CANONICAL_ROSTER` vivent **uniquement** dans `iakaFrameGUI/packages/core`. La
référence du brief à « le type `Persona` côté CLI (`cli/src/…`) » est **inexacte** et n'implique
**aucun** travail CLI (hors schéma-donnée + re-vendorisation).

---

## 1. Problème (avant la solution)

Les fiches du réservoir de personas doivent afficher, pour chacun des 9 personas : le **royaume réel**
(`[IAKAFRAME][Nom]`, pas `[DEV][…]`), une **ligne de mission**, la **pastille** de couleur déclarée,
et les **skills / guardrails réels**. Aujourd'hui elles s'appuient sur `CANONICAL_ROSTER`
(synthétique, plus pauvre et partiellement faux) et sur un type `Persona` qui **n'a pas de champ de
mission**. La donnée juste **existe** (dans les `.md`, déjà vendorés, déjà parsés pour l'intégrité) ;
elle n'est simplement **ni exposée par le cœur, ni consommée par l'écran**.

**Ce n'est PAS** : renommer une persona ou un id (interdit — constitution C-4/C-5) ; refondre le
casting/vignettes ; brancher un LLM ; retoucher les sérialiseurs de contrat
(`packages/core/src/frontmatter.ts`) ; migrer les 8 frames tierces.

---

## 2. Objectif fermé & critères d'acceptation (mesurables)

Faire **remonter la vérité déjà déclarée dans les `.md`** jusqu'aux fiches du réservoir, en
**éliminant le doublement de vérité** (table synthétique vs `.md`), par **additions rétrocompatibles**
seulement.

- **AC1 — Type `Persona` enrichi (additif).** Le type `Persona` porte un champ de **mission**
  optionnel (`mission?: string` — mapping tranché en AR-1), surfacé par `parsePersona` **s'il est
  déclaré** (émission conditionnelle, à la manière de `pastille` : clé absente si non déclarée, pour
  **préserver l'égalité d'un round-trip** d'une persona qui ne la porte pas). Aucun champ existant du
  type n'est **renommé** ni **retiré**.

- **AC2 — Fiches justes pour les 9 personas.** L'écran réservoir affiche, pour **chaque** persona
  (Gimli inclus) : **royaume réel** (`IAKAFRAME`, jamais `DEV`), **ligne de mission** non vide,
  **pastille** déclarée (🔴/🔵/…), **skills** réels (Gimli : `iakaframe-fabrication`, non vide) et
  **guardrails** réels (`identity, perimeter`, non vides). Confronté à la maquette réservoir (A-CONF).

- **AC3 — Vérité unique : la fiche DÉRIVE des `.md` (arbitrage AR-2).** L'écran réservoir consomme
  les personas **réelles parsées** du frame chargé — via une **sortie additive `frame.personas:
  Persona[]`** promue depuis la `personaList` déjà calculée par `buildFrame` (aujourd'hui jetée après
  `checkFrameRefs`) — **et non** la table synthétique `CANONICAL_ROSTER`. `CANONICAL_ROSTER` est
  **conservé dans son SEUL rôle légitime** (gabarit de création de team neuve, `buildTeamFromRoster`,
  AR-5), avec sa correction de justesse (§ 3, AR-2).

- **AC4 — Schéma & lint non cassés.** Si AR-1 = champ `mission` dédié : `library/_schema/frontmatter.json`
  déclare `personas.optional.mission = "scalar"` (donc `mission` devient un champ **connu**, pas de
  WARN `unknown-field`). `iakaframe frame lint --all` reste **exit 0** ; `frame lint iakaframe` reste
  **inchangé** ; aucun rouge sur les 8 frames.

- **AC5 — Parité cross-repo : `vendor-check --strict` drift 0.** Après re-vendorisation, la garde
  `iakaframe vendor-check --strict` rend **drift 0**. Si AR-1 = champ `mission` dédié : les 9 persona
  `.md` re-vendorés (byte-à-byte) + le schéma vendoré (`packages/core/src/frontmatter-schema.json`)
  sont mis à jour **dans le même lot** (§ 6). Si AR-1 = réutilisation de `description` : **aucun `.md`
  ni schéma ne bouge** → drift 0 **par construction**.

- **AC6 — Rétrocompat & constitution (DUR).** Le champ de mission est **optionnel** : une persona
  d'une frame tierce **sans** mission reste **valide** (`frame lint` non-strict = WARN au pire, jamais
  bloquant si le champ est déclaré au schéma). **Aucun renommage** d'id ni de fichier (C-4/C-5).
  **Aucune signature existante mutée** : `frame.personas` est une **pure addition** (règle
  `alignement-gui-modele-de-frame.md` § 3.2), les sérialiseurs de `frontmatter.ts` restent
  **byte-inchangés**. Les 8 frames du réservoir restent valides.

- **AC7 — Suites vertes.** `vitest` + `tsc` + `eslint` (GUI) verts ; tests de parité verts
  (`frontmatter-schema-parity.test.js` si le schéma bouge ; parité `checkFrameRefs` CLI↔GUI). Un
  **test born-red** naît rouge sur une fixture persona portant `mission`/royaume réel non surfacé,
  puis vert une fois `frame.personas` exposé et consommé.

---

## 3. Arbitrages structurants — Gandalf PROPOSE, le décideur TRANCHE

> Les trois arbitrages ci-dessous ferment le périmètre. **AR-1 est le pivot** : il décide seul si ce
> lot est *cross-repo* (touche le canon + fixtures) ou *GUI-only*.

### AR-1 — Champ de mission : `mission` dédié **(reco)** vs réutiliser `description`

Mesure : le frontmatter `description` des personas est **le blurb de déclenchement du sous-agent
Claude Code** (long, impératif — « *À déclencher dès qu'un besoin doit être transformé…* »). Il est
**load-bearing** : c'est le texte qui pilote la découverte/l'invocation native des skills-personas.
La maquette, elle, veut une **ligne de mission courte** (le `## Mission` du corps, ex. Gimli : « P2 —
Réalisation … P3 — Staging »).

- **Option 1A — réutiliser `description` (GUI-only, le plus léger).** Surfacer `description` comme
  `Persona.description?` ; la carte affiche `description`. **Zéro `.md`, zéro schéma** (déjà présents)
  → `vendor-check` drift 0 par construction ; **pas cross-repo**. *Contre :* la carte affiche un
  **blurb de trigger verbeux**, pas une mission ; on **couple** deux usages (affichage ↔ découverte
  d'agent) sur un même champ.
- **Option 1B — champ `mission` dédié (cross-repo, reco).** Ajouter un champ **optionnel** `mission:`
  (une ligne nette) aux 9 persona `.md`, déclarer `mission: scalar` au schéma, re-vendorer. Garde
  `description` pour **son vrai métier** (trigger d'agent). Carte mission = `mission`. Optionnellement
  surfacer aussi `Persona.description?` (tooltip). *Coût :* 1 ligne × 9 `.md` + 1 ligne de schéma +
  re-vendorisation.

**Reco Gandalf : 1B.** Motif : `description` est un **contrat de découverte d'agent**, pas un libellé
d'affichage ; le réemployer afficherait un trigger sur les cartes et **emmêlerait** deux
responsabilités. Un `mission:` dédié est **additif/optionnel** (rétrocompat AC6), **pas de la
sur-modélisation** (un seul champ, exactement la « ligne mission » de la maquette), et **conforme à
l'intention cross-repo** du brief. 1A reste le repli si le décideur veut un lot strictement GUI sans
toucher au canon.

### AR-2 — Source de vérité du roster **(l'arbitrage central du brief)**

Deux rôles **distincts** de `CANONICAL_ROSTER` à ne pas confondre :

1. **Gabarit de création** (`buildTeamFromRoster` → « New team ») : des **noms/propositions par
   défaut éditables** (AR-5). Rôle **légitime** — une team neuve part d'un gabarit, pas d'un `.md`.
2. **(Mésusage) source d'affichage** du réservoir (Lot 3) : **FAUX** — le réservoir doit montrer les
   personas **réelles** du frame chargé.

**Reco Gandalf — séparer les deux préoccupations :**

- **L'AFFICHAGE du réservoir DÉRIVE des `.md`** (parseur unique `parsePersona`), via la **sortie
  additive `frame.personas: Persona[]`** exposée par `buildFrame` (promotion de la `personaList` déjà
  parsée, aujourd'hui jetée). **Un seul parseur, une seule vérité** — c'est la direction recommandée
  par le décideur (« le roster doit dériver des `.md` pour ne pas dédoubler la vérité »). Corrige
  d'un coup royaume + pastille + skills + guardrails (tous justes dans le `.md`).
- **`CANONICAL_ROSTER` reste le gabarit « New team »** (rôle 1), mais sa **justesse est corrigée** :
  il n'émet plus `royaume: role.key.toUpperCase()` (plus de `DEV`). Deux voies possibles, au choix de
  l'exécutant, la plus simple primant (MVP) : (a) corriger le défaut synthétique (royaume neutre/juste
  par rôle) ; ou (b) faire que « New team » **s'amorce sur `frame.personas`** quand un frame est
  chargé, le `const` restant le repli hors-ligne. **Correction de justesse, PAS une réécriture.**

> C'est le geste qui **supprime le doublement de vérité** pour l'affichage, sans casser le gabarit de
> création. Additif (`frame.personas`), conforme à `alignement…` § 3.2 (nouvelle dérivée pure, aucune
> signature existante déplacée).

### AR-3 — Champs promus au type `Persona` (mapping frontmatter → type)

Le type porte **déjà** : `id`, `name`, `roleKey`, `royaume`, `pastille?`, `roleIndex`, `skills`,
`guardrails`. **Rien à ajouter** pour royaume/pastille/skills/guardrails — ils sont déjà parsés
correctement ; le bug était la **source consommée** (AR-2), pas le type. **Seule addition au type :**
le champ de mission (AR-1) — `mission?: string` (et, en bonus, `description?: string`). Mapping :

| Champ carte | Source frontmatter (`.md`) | Champ `Persona` (cœur GUI) | État |
|---|---|---|---|
| Royaume | `royaume` | `royaume` | **déjà là** — parsé VERBATIM ; à *consommer* (AR-2) |
| Mission | `mission` (AR-1=1B) *ou* `description` (AR-1=1A) | `mission?` (+`description?`) | **à ajouter** au type + parseur |
| Pastille | `pastille` | `pastille?` | **déjà là** ; à *consommer* (AR-2) |
| Skills | `skills` | `skills` | **déjà là** ; à *consommer* (AR-2) |
| Guardrails | `guardrails` | `guardrails` | **déjà là** ; à *consommer* (AR-2) |

---

## 4. Portée précise du changement (mesurée, par fichier)

**Canon iakaframe** *(seulement si AR-1 = 1B)* :
- `library/personas/<id>.md` × 9 — ajouter la ligne `mission:` (optionnelle). **Aucun renommage.**
- `library/_schema/frontmatter.json` — `personas.optional.mission = "scalar"`.

**Cœur GUI `iakaFrameGUI/packages/core/src`** :
- `persona.ts` — ajouter `mission?` (+ `description?`) au type `Persona` ; `parsePersona` lit
  `r.mission` (et/ou `r.description`), **émission conditionnelle** (clé absente si non déclarée).
- `frame.ts` — exposer **`frame.personas: Persona[]`** (promotion de `personaList` déjà calculée dans
  `buildFrame`) ; enrichir `parseFrame` défensif en cohérence (repli `[]`). **Pure addition** : la
  signature/sortie de `checkFrameRefs`, `resolveAssembly`, `buildElementPool` ne bouge pas.
- `roster.ts` — corriger la justesse de `CANONICAL_ROSTER` (AR-2) sans le retirer.

**Fixtures / schéma vendorés (mêmes lot & commit que le canon — anti-emmêlement § 6)** :
- `packages/core/__tests__/fixtures/personas/<id>.md` × 9 — re-vendorer byte-à-byte *(si 1B)*.
- `packages/core/src/frontmatter-schema.json` — re-vendorer le schéma *(si 1B)*.

**UI GUI `iakaFrameGUI/src`** :
- Le composant du réservoir (Lot 3, **à identifier — A-CONF**) consomme `frame.personas` (AR-2) et
  rend royaume/mission/pastille/skills/guardrails.

---

## 5. Critère d'ouverture d'exécution (A-CONF)

Avant tout code, l'exécutant **localise le composant réel** qui rend les fiches du réservoir (Lot 3
mergé) et **confirme** qu'il consomme aujourd'hui `CANONICAL_ROSTER` (ou une team issue de
`buildTeamFromRoster`). Il **confronte** son rendu à la **maquette réservoir** `specs/mock/gui/*.html`.
Si — contre la mesure — l'écran consommait déjà `parsePersona` sur les `.md` réels, alors seule la
**mission** resterait à surfacer (royaume serait déjà juste) : le périmètre se réduit d'autant, à
signaler au gate.

---

## 6. Contrainte DURE — parité cross-repo & anti-emmêlement

- **Un seul chantier cross-repo à la fois** (règle `alignement-gui-modele-de-frame.md` § 3.5). Le
  volet canon (persona `.md` + schéma) et son **miroir vendoré** (fixtures + `frontmatter-schema.json`)
  bougent **ENSEMBLE, dans le même lot** — jamais l'un sans l'autre, sinon la parité dérive en silence.
- **`vendor-check --strict` drift 0 après re-vendorisation** (AC5). Ordre : modifier le canon →
  re-vendorer (copie byte-à-byte des 9 personas + schéma) → `iakaframe vendor-check --strict` = drift 0.
- **Contrats INTOUCHABLES** : `packages/core/src/frontmatter.ts` (sérialiseurs, miroir byte-à-byte de
  `cli/src/lib/frontmatter.js`) restent inchangés — on ne touche qu'au **type `Persona`** (additif) et
  aux **dérivées** (`frame.personas`), jamais aux (dé)sérialiseurs de contrat.
- **Si AR-1 = 1A** (réutiliser `description`) : le lot devient **GUI-only**, aucun `.md`/schéma canon
  touché, `vendor-check` reste drift 0 **par construction** — mais toujours « un chantier à la fois »
  côté GUI.

---

## 7. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **AR-1 = 1B (cross-repo) : ~1,5–2,5 j-h.** Type+parseur `Persona` (~0,25) ; exposer `frame.personas` + câbler le réservoir (~0,5–0,75) ; champ `mission` sur 9 `.md` + schéma + re-vendorisation (~0,5) ; correction `CANONICAL_ROSTER` (~0,25) ; tests + parité + born-red (~0,5). **AR-1 = 1A (GUI-only) : ~1–1,5 j-h** (retire le volet canon/vendorage). |
| **Complexité / risque** | **FAIBLE à MOYENNE.** Le travail est surtout du **surfaçage de données déjà présentes** (le cœur les parse déjà). Risque principal = **parité cross-repo** (maîtrisée : re-vendorisation dans le même lot, `vendor-check --strict` en gate) ; risque secondaire = **identifier le consommateur réel** du réservoir (A-CONF). Aucune dépendance nouvelle, aucun sérialiseur touché. |
| **Inconnues (susceptibles de faire glisser)** | (1) **Composant réservoir non localisé** à ce cadrage (A-CONF) : si l'écran consommait déjà les `.md` parsés, le périmètre se **réduit** ; s'il est plus imbriqué, +0,25 j-h. (2) **AR-1** non tranché : 1B ajoute le volet canon/vendorage (~+0,75 j-h) vs 1A. (3) **Rédaction éditoriale** des 9 lignes `mission:` (si 1B) — court, mais du soin. (4) Le gabarit « New team » (AR-2) doit-il aussi dériver de `frame.personas` — arbitrage mineur d'exécution. |

> Rappel méthode : estimation **rappelée à la clôture du lot**, confrontée au temps réel. Pas un
> engagement ferme.

---

## 8. Sources (faits externes vérifiés — obligation de sourcing)

**Aucune décision de ce cadrage ne dépend d'un fait externe versionné.** Le lot n'introduit **aucune
dépendance** (posture MVP/réutilisation) : ni compatibilité de version, ni état de l'art d'une lib à
vérifier. Les décisions reposent **exclusivement** sur les **constats mesurés sur le disque** des deux
dépôts (§ 0, cités par nom de symbole/fichier), conformément à `preuve-avant-declaration`. La règle de
sourcing web est donc satisfaite par déclaration explicite d'absence de dépendance externe, comme le
précédent `alignement-gui-modele-de-frame.md` § Sources.
