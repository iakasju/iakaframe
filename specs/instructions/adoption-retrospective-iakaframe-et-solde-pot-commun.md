# Instruction — Adoption du rituel neutre `retrospective` dans le default iakaframe + solde du pot commun émergent

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-29), sur mission Aragorn (« promouvoir les briques
> émergentes des 7 frames Fëanor vers `library/` partagée »).
> **Lecture seule sur le code pendant le cadrage** ; ce fichier est le seul artefact produit.
> Réf. backlog : item *« Catalogue de frames forgé (7) + 3 biais »*, sous-item *« Pot commun de
> briques émergent »*. Réf. instructions amont : `rangement-catalogue-frames-reservoir.md` (le lot
> qui a déjà exécuté la promotion), `constitution-modele-de-frame.md` (C-1..C-5).
>
> **Constats MESURÉS sur le disque le 2026-07-29** dans `~/work/iakaframe` (réservoir, **v0.37.0**) —
> `preuve-avant-declaration`. Citations par nom de section / de symbole, jamais par `chemin:ligne`.
>
> 🔴 **RENVERSEMENT DE PRÉMISSE (le cœur de ce cadrage).** Le brief demandait de **promouvoir** les
> briques émergentes (rétrospective en pilote) « car iakaframe n'a pas de rétrospective ». **La mesure
> dit autre chose : la promotion est DÉJÀ FAITE ET MERGÉE.** Le lot
> `rangement-catalogue-frames-reservoir.md` (cadré 2026-07-25, exécuté par Fëanor, gaté Legolas) a
> rangé **les 7 frames** et **promu les 3 briques neutres convergentes**. Il ne reste **rien à
> promouvoir** pour ces briques. Le brief lisait un **BACKLOG périmé** sur ce point (l'item n'a pas
> été coché). Ce cadrage **corrige la prémisse**, puis cadre le **résiduel réel**.

---

## Problème

Le besoin exprimé — « promouvoir les briques convergentes des 7 frames vers `library/` partagée par
copie généralisée » — **est déjà satisfait sur le disque**. La re-mesure (obligatoire, demandée par
le brief) le prouve pièce par pièce (§ Mesure). Ce qui **reste réellement ouvert** est plus étroit et
plus précis :

1. **Le default `iakaframe` ne caste toujours pas la rétrospective.** La brique neutre
   `library/rituals/retrospective.md` **existe** (promue depuis l'`iteration-loop` de Design Thinking),
   mais le rangement l'a **délibérément** laissée **hors du default** (invariant de non-régression :
   `methods/iakaframe.md` byte-inchangé pour garder `vendor-check` au vert). Le « manque de
   rétrospective » que le brief pointe est donc réel **au niveau de la méthode iakaframe**, pas au
   niveau de la library. **C'est le seul geste actionnable qui reste — et c'est une décision
   structurante** (muter le default), donc du ressort du décideur.

2. **Un seul concept multi-frames n'a pas été promu et pourrait l'être** : le **« centré-utilisateur »**.
   Il apparaît qualifié dans ≥ 2 frames (`dt-user-centered`, `kanban-customer-focus`,
   `leanstartup-get-out-of-the-building`, `dt-evidence-from-users`) mais **aucun neutre
   `user-centered`/`customer-focus` n'existe** — la posture conservatrice (§ 3.4 du rangement) l'a
   maintenu qualifié. C'est le **seul candidat de 2ᵉ vague** ; tous les autres candidats du brief sont
   mono-frame → correctement qualifiés → **à écarter** de toute promotion.

3. **Hygiène déclarée non bloquante** : slugs de frame non canoniques (`design-thinking` vs
   `lean-startup` vs teamId `gtd-solo`) et **item de BACKLOG à solder avec preuve**.

---

## Mesure — l'état réel sur le disque (v0.37.0), pas la présomption du brief

### Les 7 frames sont TOUTES rangées dans le réservoir (mesuré)

`methods/scrum.md`, `methods/kanban.md`, `methods/lean-startup.md`, `methods/waterfall.md`,
`methods/shapeup.md`, `methods/gtd.md`, `methods/design-thinking.md` **existent tous** et ne portent
**que des ids** vers `library/*` partagée. (Le brief cherchait `designthinking` : le slug réel est
`design-thinking` — cf. hygiène § Périmètre.)

### Tableau des candidats — verdict MESURÉ (présent / absent / dédup + fait / à faire / écarter)

| Concept | ids locaux mesurés | Canon iakaframe | Verdict RÉEL sur disque |
|---|---|---|---|
| **Engagement borné (time-box)** | `time-box` (Scrum) + réf. Kanban/Shape Up ; nuances qualifiées `kanban-wip-limit`, `shapeup-circuit-breaker`/`shapeup-appetite-respected` | absent au default | ✅ **PROMU NEUTRE — FAIT.** `library/guardrails/time-box.md` (kind `timebox`), casté par **3 frames** (Scrum, Kanban, Shape Up). Les nuances (WIP quantité ≠ durée ; circuit-breaker) restent **qualifiées** à raison (test de neutralité échoue). **Rien à faire.** |
| **Inspect-adapt / rétrospective** | `retrospective` (neutre, casté par Design Thinking) ; qualifiés : `scrum-sprint-retrospective`, `gtd-weekly-review`, `leanstartup-learning-review`/`leanstartup-pivot-or-persevere-review` | **absent au default iakaframe** (ses `ritualIds` n'ont pas de rétrospective) | ✅ **PROMU NEUTRE — FAIT** (`library/rituals/retrospective.md`, depuis l'`iteration-loop` de DT). ❗ **MAIS non casté par le default iakaframe.** → **C'est le PILOTE résiduel** (§ Décision). Les 4 variantes qualifiées restent qualifiées à raison (cadences/timebox propres). |
| **Definition of Done** | `definition-of-done` (Scrum, Waterfall) | absent au default | ✅ **PROMU NEUTRE — FAIT.** `library/guardrails/definition-of-done.md` (kind `quality`), casté par **2 frames** (Scrum + Waterfall). **Rien à faire.** |
| **MVP** | `mvp` (Lean Startup) | **`mvp-first` PRÉSENT** (`library/principles/mvp-first.md`) | ✅ **DÉDUPLIQUÉ — FAIT.** `lean-startup` **référence `mvp-first`** (RÉFÉRENCER-CANON) ; aucun `mvp.md` créé ; canon non muté. `leanstartup-mvp-minimal` (guardrail) reste qualifié (type ≠ principe). **Rien à faire.** |
| **Centré-utilisateur** | `dt-user-centered`, `kanban-customer-focus`, `leanstartup-get-out-of-the-building`, garde `dt-evidence-from-users` | absent | ⚠️ **QUALIFIÉ par frame — non promu.** Apparaît dans **≥ 2 frames** → **SEUL candidat de 2ᵉ vague**. Neutralité **non tranchée sur pièces** (DT « concevoir pour de vrais humains » vs Kanban « focus service » vs Lean « validated learning » — nuances possiblement irréductibles). **À trancher** (§ Décision, follow-up, PAS le pilote). |
| **five-whys** | `leanstartup-five-whys` | absent | ❌ **QUALIFIÉ (1 frame) — ÉCARTER.** Mono-frame → posture conservatrice : pas de promotion. |
| **GTD : next-action / two-minute-rule / capture-everything / inbox-zero** | `gtd-next-action`, `gtd-two-minute-rule`, `gtd-capture-everything`, `gtd-inbox-zero` | absent | ❌ **QUALIFIÉ (1 frame, GTD solo) — ÉCARTER.** Mono-frame ; en outre spécifiques à la productivité solo. |
| **Waterfall : phase-gate / traceability / baseline-freeze** | `waterfall-traceability`, `waterfall-requirements-freeze`, `waterfall-no-phase-skip` | absent | ❌ **QUALIFIÉ (1 frame) — ÉCARTER.** Candidats *futurs* si une 2ᵉ frame les partage un jour ; pas maintenant. |
| **pull-not-push / no-backlog / explicit-policies** | `kanban-pull-not-push`, `kanban-explicit-policies`, `shapeup-no-backlog`/`shapeup-no-backlog-accumulation` | absent | ❌ **QUALIFIÉ (1 frame chacun) — ÉCARTER.** |
| **diverge-before-converge / prototype-before-invest / bias-toward-action** | `dt-diverge-before-converge`, `dt-prototype-before-invest`, `dt-bias-toward-action` | absent | ❌ **QUALIFIÉ (1 frame, DT) — ÉCARTER.** |

**Synthèse chiffrée** : sur les ~20 candidats du brief → **3 déjà promus neutres** (time-box,
retrospective, definition-of-done) + **1 déjà dédupliqué** (mvp→mvp-first) + **1 seul candidat de 2ᵉ
vague** (centré-utilisateur) + **le reste (≈ 15) correctement qualifié mono-frame, à écarter**. La
promotion « de masse » n'existe pas : elle est **faite pour les convergents, close pour les
mono-frame**.

### Où vivent les originaux (mesuré)

Les 7 brouillons `~/work/frame-*` (et scratchpad Fëanor) ont été **rangés** : leurs atomes vivent
désormais **uniquement** dans `library/*` partagée (qualifiés `<frame>-*` ou promus neutres), leurs
assemblages à la racine (`methods/`, `teams/`, `bindings/`, `kits/`, `frames/`). Les brouillons
d'origine sont **archivés** (arbitrage 4 du rangement : rien de supprimé, suppression tranchée
ultérieurement). **Il n'y a plus d'original à promouvoir** : la source vit dans le canon.

### Typage par pool (Q3 du brief) — déjà tranché et lint-vert

- `retrospective` → **`rituals/`** (rituel réflexif, `side: team`, `cadence`/`timebox` en champs
  optionnels/extension du schéma `rituals`). Cohérent `frontmatter.json`.
- `time-box` → **`guardrails/`** (`kind: timebox`) — une borne qu'on tient, pas un principe de
  conception.
- `definition-of-done` → **`guardrails/`** (`kind: quality`).
- `mvp` → **non créé** (dédup vers le principe `mvp-first`).
- (2ᵉ vague) `user-centered`/`customer-focus` → **`principles/`** s'il est promu (posture de
  conception centrée sur l'utilisateur). **À confirmer au moment de trancher.**

Ces typages **respectent le schéma** (`library/_schema/frontmatter.json`) et passent `frame lint` —
**rien à retyper**.

---

## Décision retenue

### 1. La promotion du pot commun est CLOSE — aucune re-promotion (mesure, pas décision)

`time-box`, `retrospective`, `definition-of-done` sont promus ; `mvp` est dédupliqué. Ce cadrage
**n'en refait aucune**. Toute instruction qui « promeut la rétrospective » serait un **doublon
d'un lot livré** — interdit (réutiliser l'existant, pas de sur-ingénierie).

### 2. Doctrine de référencement (Q4 du brief) — TRANCHÉE par l'existant, à graver

**Une brique promue vit dans la library DISPONIBLE, castée par les frames qui la veulent — PAS
rétro-injectée dans le default.** C'est l'invariant de non-régression du rangement (§ 2), et c'est le
bon défaut : `retrospective` est castée par `design-thinking`, `time-box` par 3 frames, mais
`methods/iakaframe.md` reste **byte-inchangé** → `vendor-check` drift 0, `frame lint iakaframe` exit
0. **Réponse nette à la question du brief : une brique promue n'est JAMAIS automatiquement rattachée
au default.** Le pot commun est un **réservoir**, pas une injection.

### 3. PILOTE résiduel — le default iakaframe adopte-t-il `retrospective` ? (décision STRUCTURANTE)

C'est le **seul geste actionnable** et il **mute le default** : Gandalf **propose et recommande**, le
**décideur tranche** (§ Options). Ce n'est **pas** une promotion (la brique existe) mais une
**adoption** : ajouter l'id `retrospective` aux `ritualIds` de `methods/iakaframe.md` et l'ancrer à la
chaîne 3-phases (clôture de lot). Le brief le dit lui-même : « rétrospective seule … l'aligner à la
méthode 3-phases d'iakaframe ».

### 4. Follow-up 2ᵉ vague (PAS le pilote) — trancher `user-centered`

Seul candidat multi-frames non promu. Exige un **jugement de neutralité sur pièces** (non
automatisable). **Différé après le pilote**, exactement comme le rangement a différé ses promotions
au gate.

---

## Options structurantes — l'adoption de la rétrospective par le default (à arbitrer)

> Gandalf pose le choix et recommande ; il ne tranche pas (gate humain P1→P2).

**Option A — ADOPTER `retrospective` dans le default iakaframe (recommandée).**
Ajouter `retrospective` aux `ritualIds` de `methods/iakaframe.md`, ancré à la **clôture de lot /
session** (là où la méthode confronte déjà l'estimation au temps réel — cf. charte Gandalf, jalon
P1→P2). Bénéfices : comble un **manque nommé** (inspect-adapt absent du default) avec une brique
**déjà prête** (zéro brique neuve) ; le default « mange sa propre nourriture » (il référence le pot
commun comme n'importe quelle frame). Coût : mute le default → **churn cross-repo** (§ Cross-repo).

**Option B — NE PAS adopter ; garder `retrospective` disponible-non-castée.**
Le default reste lean, `vendor-check`/vitrine intouchés. La confrontation estimation↔réel de clôture
reste **informelle** (non formalisée en rituel). Le « manque » persiste mais est assumé.

**Recommandation Gandalf : Option A, minimale.** Le manque inspect-adapt est réel et récurrent dans
le backlog ; la brique existe ; l'ancrage à la clôture de lot est **cohérent avec la méthode
existante** (jalon + rappel d'estimation), donc c'est un **enrichissement sobre, pas une nouvelle
mécanique**. Réserve honnête : c'est le décideur qui accepte le churn cross-repo (vitrine + éventuel
re-vendorage) ; si ce coût n'est pas voulu maintenant, Option B est défendable.

---

## Périmètre — fermé

**Inclus (si Option A) :**
- Ajouter l'id `retrospective` aux `ritualIds` de `methods/iakaframe.md` (référence seule — aucun
  corps recopié, I1).
- Ancrer le rituel dans le **narratif** `methode-de-travail.md` à la clôture de lot/session (geste
  **Nathalie** — mémoire/narratif de méthode, hors périmètre d'écriture de Gandalf ; signalé ici).
- Régénérer la **vitrine** `methode-de-travail.html` via le générateur en place
  (`cli/scripts/gen-methode-vitrine.mjs`) puisqu'elle rend le canon vivant.
- Vérifier/rétablir la **parité vendor** si `methods/iakaframe.md` fait partie de l'union vendorée
  (§ Cross-repo) → `vendor-check --strict` drift 0.

**Exclu (déclaré des deux côtés) :**
- **Re-promouvoir** time-box / retrospective / definition-of-done, **re-dédupliquer** mvp : **déjà
  fait**, byte-intouché.
- **Promouvoir `user-centered`** : follow-up 2ᵉ vague, tranché après le pilote (§ Décision-4).
- **Promouvoir tout candidat mono-frame** (five-whys, atomes GTD, gates Waterfall, pull/no-backlog,
  diverge/prototype/bias) : écartés par la posture conservatrice.
- **Corriger les 3 biais du modèle** (gouvernance/cardinalité/schéma) : lots séparés, déjà soldés
  (v0.26/v0.27 d'après backlog + constitution).
- **Réécrire les frames tierces**, muter leurs assemblages, toucher le miroir `StefFrame2`.
- **Tout code de production/test/config, toute doc utilisateur.** L'adoption = édition de canon
  (méthode + narratif) + régénération outillée, pas du dev applicatif.

---

## Étapes d'implémentation (si Option A retenue)

1. **Éditer `methods/iakaframe.md`** : insérer `retrospective` dans `ritualIds`
   (`[iakastart, init, update, snapshot, log-conversation, retrospective]`). Aucun autre champ touché.
2. **`iakaframe frame lint iakaframe`** → doit rester **exit 0** (la référence `retrospective` résout
   dans `library/rituals/`).
3. **Narratif (Nathalie)** : décrire, dans `methode-de-travail.md`, la rétrospective de clôture de
   lot/session (inspect-adapt : confronter estimation↔réel, choisir 1-2 améliorations). *Geste hors
   canal d'écriture de Gandalf — porté par 📖 Nathalie.*
4. **Régénérer la vitrine** : `node cli/scripts/gen-methode-vitrine.mjs` → `methode-de-travail.html`
   (splice byte-exact sous garde `vitrine-methode.test.js`).
5. **Cross-repo** : mesurer si `methods/iakaframe.md` ∈ union vendorée ; si oui, re-vendoriser le
   miroir GUI ; puis `iakaframe vendor-check --strict` → **drift 0**.
6. **`npm test` (CLI)** vert, zéro dépendance nouvelle.
7. **Solder le BACKLOG** : cocher le sous-item *« Pot commun de briques émergent »* avec sa **preuve
   de clôture** (3 briques promues + mvp dédupliqué, mesuré v0.37.0) et **ce pilote** comme suite.
   *(Geste de tenue de backlog — Aragorn/Nathalie.)*

---

## Fichiers concernés

- `methods/iakaframe.md` — **+1 id** `retrospective` dans `ritualIds` (seule mutation de canon
  structurante).
- `methode-de-travail.md` — narratif du rituel de clôture (**Nathalie**, signalé, hors écriture
  Gandalf).
- `methode-de-travail.html` — **régénéré** par `gen-methode-vitrine.mjs` (pas d'édition manuelle).
- `library/rituals/retrospective.md` — **inchangé** (existe déjà, on ne fait que le référencer).
- Miroir GUI (`~/work/iakaFrameGUI`) — **seulement si** `methods/iakaframe.md` est vendoré :
  re-synchronisation puis `vendor-check --strict`.
- `BACKLOG.md` — clôture de sous-item avec preuve (tenue de backlog).

---

## Cross-repo & vendorisation (Q5 du brief) — verdict

- **Les briques déjà promues (time-box, retrospective, definition-of-done) n'ont PAS bougé le
  vendor** : elles ne sont castées que par des **frames tierces**, jamais par le default, donc elles
  **ne sont pas entrées dans l'union vendorée** → `vendor-check` est resté drift 0 tout du long. C'est
  la **preuve vivante** de la doctrine « disponible ≠ castée » (§ Décision-2).
- **Le pilote change la donne UNIQUEMENT s'il caste dans le default.** Adopter `retrospective` mute
  `methods/iakaframe.md`. Séquence canon→miroir : (1) éditer le canon ; (2) régénérer la vitrine
  (elle lit le canon) ; (3) **vérifier si `methods/iakaframe.md` appartient aux « 18 copies + 4
  dérivées »** ; si oui, re-vendoriser le miroir GUI ; (4) `vendor-check --strict` → **drift 0** des
  deux côtés. **Inconnue à lever tôt** : l'appartenance exacte de `methods/iakaframe.md` à l'union
  vendorée (le vendor porte surtout des **contrats d'agent** + dérivées de schéma ; la méthode
  elle-même est **à confirmer sur pièces** avant de chiffrer le cross-repo).

---

## Risques

- **Churn cross-repo sous-estimé** *(mitigation : lever l'inconnue « method vendoré ? » AVANT
  d'engager — si non vendoré, le lot est trivial et iakaframe-seul ; si vendoré, ajouter le
  re-vendorage au chiffrage).*
- **Sur-formalisation d'un geste déjà pratiqué** : la confrontation estimation↔réel existe déjà à la
  clôture ; le rituel doit la **nommer**, pas ajouter de cérémonie lourde *(mitigation : rituel
  `side: team`, enforcement = discipline humaine, zéro hook — comme la brique le prescrit déjà).*
- **« Générique qui ne l'est pas » pour la 2ᵉ vague (`user-centered`)** : DT/Kanban/Lean nuancent
  différemment *(mitigation : appliquer le test de neutralité § 3.1 du rangement sur pièces ; en cas
  de doute → rester qualifié, la posture conservatrice est réversible).*
- **Hygiène de slug** (`design-thinking` vs `lean-startup` vs teamId `gtd-solo`) : non bloquante
  (constitution § 9), à ne PAS corriger dans ce lot (renommer casserait des références, C-1/C-4).

---

## Critères d'acceptation

**Volet mesure (vrai indépendamment de l'option retenue) :**
- [ ] Le tableau des candidats est **acté** : 3 briques promues (time-box, retrospective,
  definition-of-done) + mvp dédupliqué **confirmés présents** au canon ; ~15 mono-frame **confirmés
  qualifiés** ; `user-centered` **confirmé seul candidat 2ᵉ vague**.
- [ ] Le sous-item BACKLOG *« Pot commun de briques émergent »* est **soldé avec preuve** (ou requalifié
  en « fait, reste l'adoption default + 2ᵉ vague »).

**Volet pilote (si Option A) :**
- [ ] `methods/iakaframe.md` porte `retrospective` dans `ritualIds` (et **rien d'autre** n'y change).
- [ ] `iakaframe frame lint iakaframe` → **exit 0** ; `frame lint --all` → **exit 0**.
- [ ] `methode-de-travail.html` **régénéré** par le générateur (garde `vitrine-methode.test.js` verte),
  pas d'édition manuelle.
- [ ] `iakaframe vendor-check --strict` → **drift 0** (après re-vendorage si `methods/iakaframe.md` est
  dans l'union ; sinon inchangé).
- [ ] `library/rituals/retrospective.md` **byte-inchangé** (référencé, pas modifié).
- [ ] `npm test` (CLI) vert, **zéro dépendance** nouvelle.
- [ ] Le narratif de clôture de lot est décrit dans `methode-de-travail.md` (**Nathalie**).

---

## Estimation (ordre de grandeur assumé, révisable — pas un engagement ferme)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Volet mesure + solde backlog : ~0,25 j-h** (le constat est fait, il s'agit de le graver). **Pilote Option A : ~0,5 à 1 j-h** selon l'inconnue vendor — **~0,5 j-h si `methods/iakaframe.md` n'est pas vendoré** (iakaframe-seul : édition + lint + vitrine) ; **~1 j-h s'il l'est** (re-vendorage miroir + parité). **2ᵉ vague `user-centered` : ~0,5 j-h** (jugement sur pièces + éventuelle promotion), **différée**. **Total spec fermée du pilote : ~0,75 à 1,25 j-h.** |
| **Complexité / risque** | **FAIBLE.** Aucun code applicatif ; l'outillage (`frame lint`, `gen-methode-vitrine`, `vendor-check`) est en place et gardé. Le seul risque est le **cross-repo** (churn vendor), borné par l'inconnue ci-dessous. Décision **structurante mais réversible** (retirer un `ritualId` ne casse rien). |
| **Inconnues susceptibles de faire glisser** | (1) **`methods/iakaframe.md` est-il dans l'union vendorée** (« 18 copies + 4 dérivées ») ? — détermine si le pilote est iakaframe-seul ou cross-repo. **À lever en tout premier.** (2) L'arbitrage décideur Option A vs B (le pilote n'existe que sous A). (3) La neutralité de `user-centered` (2ᵉ vague) — jugement non automatisable, différé. |

---

## Sources (faits externes vérifiés — obligation de sourcing)

Les deux faits de domaine qui fondent les verdicts de dédup ont été vérifiés au web lors du lot amont
(`rangement-catalogue-frames-reservoir.md`) et **restent valides** ; ils sont réutilisés ici sans
re-vérification (aucune décision nouvelle n'en dépend) :

- **Inspect-and-adapt = principe agile général** (principe 12 du Manifeste Agile) — donc `retrospective`
  passe le test de neutralité et est promue neutre ; la *Sprint Retrospective* (cadence/timebox
  Scrum) échoue le test et reste qualifiée :
  [Scrum.org — What is a Sprint Retrospective](https://www.scrum.org/resources/what-is-a-sprint-retrospective),
  [Atlassian — Agile ceremonies](https://www.atlassian.com/agile/scrum/ceremonies).
- **MVP = concept Lean Startup à portée générale** — donc `mvp` (Lean) dédupliqué vers `mvp-first` :
  [Agile Alliance — MVP glossary](https://agilealliance.org/glossary/mvp/),
  [Atlassian — Minimum Viable Product](https://www.atlassian.com/agile/product-management/minimum-viable-product).
</parameter>
</invoke>
