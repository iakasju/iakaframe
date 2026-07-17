# Instruction — Symétrie `+/−` : rendre retirable tout ce qu'un ajout a ajouté

> **Phase** : P1 — Cadrage · **Cadreur** : l'architecte-cadreur (Gandalf) · **Exécutant** : le développeur-devops (Gimli).
> **Statut** : **VALIDÉ — prêt pour Gimli** (jalon de cadrage franchi ; les 6 questions d'arbitrage ont
> été tranchées par le décideur le 2026-07-17, cf. § 14). L'implémentation peut démarrer selon le
> découpage S1..S7 (§ 12) — **S2 est débloqué** (Q-1 = Option 1).
> **Date de cadrage** : 2026-07-17 · **Date de validation** : 2026-07-17. Français ; code et identifiants en anglais.
>
> **Principe du décideur (verbatim de l'intention)**
> « Composabilité ⇒ décomposabilité — tout élément qu'un `+` ajoute doit pouvoir être retiré par un `-`
> symétrique. » Cas emblématique : **un skill attaché à un persona** — on ajoute le skill avec `+`, il
> faut un `-` **au niveau du titre du skill, dans le persona**, pour le retirer. Mémoire graine :
> `iakaframe-symetrie-ajout-suppression`.
>
> **Références (lues avant cadrage)**
> - **Personas** (état réel : skills en **frontmatter** `skills:[]`, pas en sections titrées du corps) :
>   `../../library/personas/*.md` (ex. `gandalf.md:7` `skills: [iakaframe-cadrage]` ; mention de charte
>   en tête `gandalf.md:15`) ; gabarit `../../library/personas/_TEMPLATE.md:8` (`skills: []`).
> - **`add` (le `+` sans symétrique)** : `../../cli/src/commands/add.js` (livre `team|method|binding`,
>   affiche `+ <kind> <id> livré…`, **aucun retrait**) ; intégrité référentielle I1 :
>   `../../cli/src/lib/library.js` (`checkRefs`, `checkSchema`, `ADD_DIR`, `COLLECTIONS`, `scan`).
> - **Déjà symétrique (à réutiliser, ne pas réinventer)** :
>   - `memory add|remove` (T1) : `../../cli/src/lib/memory.js` (`memoryRemove` idempotent, plafond).
>   - `review apply|reject` (T5) : `../../cli/src/lib/review.js` (`rejectProposal` retire une proposition
>     **en attente** ; `applyProposal` → `materializeSkill` écrit `library/skills/<id>/SKILL.md`).
> - **Le trou exact que ce lot comble** : `surface-apprentissage.md` **§ 6 / Q-3** (« retrait d'un
>   élément **déjà inséré** = chantier « symétrie » distinct, à cadrer à part »). **Ce lot EST ce
>   chantier.**
> - **Bascule de kit (retrait déjà partiel)** : `./cli-bibliotheque-verbes.md` § 3.5 / § 4.5
>   (`switch --rollback`, sauvegarde `.claude.bak-*` — patron de non-destructivité à réutiliser).
> - **GUI cible** : `~/work/iakaFrameGUI` (Tauri 2 passe-plat, façade `src/api/backend.ts`, onglet
>   « Apprentissage » U1..U5 de `surface-apprentissage.md`).
> - **État de l'art vérifié le 2026-07-17** (§ 13).

---

## 1. Objectif — graver la décomposabilité

Rendre **retirable** tout ce qu'un geste d'ajout (`+` / `add` / `apply` / attache) a **ajouté**, avec un
**retrait symétrique** de **même accessibilité**. C'est l'invariant de **décomposabilité** : *une
composition n'est complète que si elle est aussi décomposable.* Aujourd'hui la méthode sait **ajouter**
(add team/method/binding, apply skill/memory, attacher un skill à un persona) mais ne sait **pas défaire**
la moitié de ces gestes — l'asymétrie s'accumule et fige la bibliothèque.

**Ce n'est PAS** un nouveau moteur : c'est un **socle de retrait sûr** + les **gestes `−`** manquants,
posés **en miroir exact** des gestes `+` existants, réutilisant ce qui est déjà symétrique
(`memory remove`, `review reject`) et empruntant le patron de non-destructivité de `switch --rollback`.

---

## 2. Problème (avant la solution)

Cartographie de l'asymétrie constatée dans le code :

1. **`add` n'a aucun `−`.** `add.js` dépose un `team|method|binding` dans la bibliothèque (`+ … livré`)
   mais **rien** ne le retire. Retirer à la main = éditer/supprimer un fichier sans contrôle d'intégrité
   (on peut casser une référence I1 d'un kit sans s'en apercevoir).
2. **Un skill attaché à un persona ne se détache pas.** L'attache vit en frontmatter (`skills:[]`) ; il
   n'existe **ni verbe d'attache `+`, ni verbe de détache `−`** — c'est un geste manuel non outillé.
   *C'est le cas emblématique du décideur.*
3. **Un élément déjà appliqué par `review apply` ne se dé-applique pas.** `applyProposal` matérialise un
   `SKILL.md` sous `library/skills/<id>/` (ou une entrée mémoire), et passe la proposition à `applique`
   (**terminal**). `reject` ne concerne qu'une proposition **en attente** : **rien** ne retire un skill
   **déjà matérialisé**. C'est le **Q-3 différé** de `surface-apprentissage.md`.
4. **Seule la mémoire est symétrique** (`memory add|remove`, T1) — mais ce n'est **qu'un** des points
   d'ajout. La symétrie doit couvrir **tous** les points.

**Besoin (formulé par le décideur)** : pour **chaque** chose ajoutable, un retrait symétrique — d'abord
et surtout **détacher un skill d'un persona** — **réutilisant** l'existant symétrique, **non destructif**
(règle iakaframe « action destructive → confirmation »), et **aussi accessible que l'ajout**.

---

## 3. Cartographie « ce qui est ajoutable ↔ son retrait » (fermée)

C'est le cœur du cadrage : chaque geste `+` doit avoir son `−`. Table faisant autorité pour le lot.

| # | Ajout `+` | Où c'est posé | Retrait `−` symétrique | État |
|---|---|---|---|---|
| A | **skill attaché à un persona** (`skills:[]`) | `library/personas/<id>.md` (frontmatter) | **détacher** : retirer l'id de `skills:[]` (+ section de corps selon **Q-1**) | **NEUF** — cas emblématique |
| B | **skill matérialisé** (`review apply` type `skill`) | `library/skills/<id>/SKILL.md` | **dé-matérialiser** : archiver le dossier du skill | **NEUF** — le Q-3 de `surface-apprentissage` |
| C | **entrée mémoire** (`memory add` / apply type `memory`) | `PROFIL.md` / `REGISTRE.md` | `memory remove` | **EXISTE (T1)** — réutilisé tel quel |
| D | **proposition en attente** (`close`) | `proposals/<…>/` | `review reject` | **EXISTE (T5)** — réutilisé tel quel |
| E | **team / method / binding livré** (`add`) | `teams/` `methods/` `bindings/` | `remove <kind> <id>` — **le `−` de `add`** | **NEUF** |
| F | **kit assemblé / projet basculé** (`assemble` / `switch`) | `kits/` , `<projet>/.claude/` | `switch --rollback` (restaure `.claude.bak-*`) | **EXISTE (partiel)** — patron réutilisé |
| G | **hook amendé** (apply type `hook`) | hooks du kit | défaire l'amendement (diff inverse) | **DIFFÉRÉ** — non matérialisé au MVP (cf. `review.js` `type-non-materialisable-mvp`) |
| H | **config patchée** (apply type `config`) | config | défaire le patch | **DIFFÉRÉ** — non matérialisé au MVP |

> **Invariant de symétrie à graver** : pour toute ligne où la colonne « Ajout » existe et est
> **matérialisable**, la colonne « Retrait » **doit exister et être atteignable** ; une ligne différée
> côté ajout (G, H) l'est **aussi** côté retrait (on ne cadre pas le retrait d'un ajout qui n'existe pas
> encore). Le lot **ferme A, B, E** (neuf), **réutilise C, D, F** (existant), **diffère G, H**.

---

## 4. Le cœur — détacher un skill d'un persona (ligne A) + arbitrage de représentation

### 4.1 État réel constaté (non supposé)
Un persona est une **charte pure** (I3) : les skills vivent **en frontmatter** `skills: [<id>, …]`
(`gandalf.md:7`, `_TEMPLATE.md:8`). Le corps **mentionne** le skill-rôle en tête de charte
(`gandalf.md:15` : « Skill-rôle : `iakaframe-cadrage` ») mais **il n'existe aucune section titrée par
skill** dans le corps aujourd'hui. Le **scan** de la bibliothèque et l'intégrité référentielle lisent la
liste **de frontmatter** (`library.js` `scan`/`readEntry`), **jamais** le corps.

### 4.2 Le geste `−` de détache (fermé, indépendant de Q-1)
Un geste **détache un skill d'un persona** : il **retire l'id de `skills:[]`** du frontmatter du persona
visé, **non destructif** (§ 7), réversible. Il **ne supprime pas** le skill de la bibliothèque (ça, c'est
la ligne B, distincte) : détacher ≠ dé-matérialiser. Forme CLI **tranchée** (Q-3/Q-5), **miroir du verbe
d'attache** : `iakaframe detach <skillId> --persona <personaId>` (et l'attache symétrique
`iakaframe attach <skillId> --persona <personaId>`, qui **matérialise le `+` aujourd'hui implicite** —
geste manuel non outillé jusqu'ici). Les deux verbes **mutent le seul `skills:[]`** du frontmatter (Q-1).

### 4.3 Où vit l'affordance `−` ? — **TRANCHÉ (Q-1) : Option 1, une seule source de vérité**
Le décideur demande un `−` « **au niveau du titre du skill, dans le persona** ». **TRANCHÉ (Q-1) :
Option 1.** Le **frontmatter `skills: []` reste la SOURCE UNIQUE de vérité** ; l'affordance `−` (et le
« titre du skill » auquel elle s'accroche) est **RENDUE dans les vues** — jamais une section physique du
corps du persona.

- **Décision gravée** : détacher/attacher un skill = muter **le seul `skills:[]`** du frontmatter. Le
  « titre du skill dans le corps » est une **VUE** : en CLI, une **liste** des skills attachés où chaque
  ligne porte le geste de détache ; en GUI, une **puce/section rendue** portant un bouton `−` en regard
  du skill. **Aucune** section titrée n'est écrite dans le corps du persona.
- **Justification (intégrité — une seule vérité)** : une **double source** frontmatter↔corps
  introduirait un **risque de désynchronisation** et forcerait à **modifier `scan`/`checkRefs`**
  (aujourd'hui aveugles au corps, ils lisent la liste de frontmatter — `library.js`). Garder le
  frontmatter comme unique vérité **préserve I1/I2/I3** (« persona = casting pur »), **ne touche pas** le
  code de scan/intégrité, et **zéro duplication**. L'exigence « `−` au titre du skill » est **honorée par
  la vue** : l'affordance de retrait est une **projection** du frontmatter, pas une seconde donnée.
- **Écarté (Option 2, migration des skills dans le corps en sections titrées)** : rejeté — double source,
  désynchronisation, adaptation de `scan`/`checkRefs`. Le lot **ne migre pas** les skills dans le corps.

**Conséquence pour Gimli** : **S2 est débloqué** — la représentation est fixée (Option 1). Le geste édite
`skills:[]` et rien d'autre ; les vues (CLI, puis GUI en 2ᵉ tranche) rendent le titre + le `−`.

---

## 5. Le `−` de `add` — retirer un team/method/binding livré (ligne E)

Miroir exact de `add.js`. Verbe `iakaframe remove <team|method|binding> <id>` :

1. **Résout** l'élément dans sa collection (`ADD_DIR`/`COLLECTIONS`).
2. **Contrôle d'intégrité référentielle INVERSE (obligatoire)** — le pendant de `checkRefs` : *qui
   pointe vers moi ?* Un `remove` qui **casserait** une référence (un binding qui vise ce team/method, un
   kit qui vise ce binding, un persona qui vise un skill…) est **refusé par défaut** (**RESTRICT**, §
   13), en listant les **référents**. Forcer = geste explicite (`--cascade` ou confirmation, § 7).
   Nouveau `findReferrers(id, root)` dans `library.js` (symétrique de `checkRefs`).
3. **Retrait sûr non destructif** (§ 7) : l'élément est **archivé** (corbeille), jamais supprimé sèchement.
4. **Sortie** en miroir de `add` : `− <kind> <id> retiré (archivé dans <chemin>)`, ou le refus RESTRICT
   avec la liste des référents.

---

## 6. Défaire une application `review apply` (lignes B, C)

- **Entrée mémoire (C)** : **réutilisé tel quel** — `memory remove <target> "<contenu>"` (T1,
  `memoryRemove`) retire une puce de `PROFIL.md`/`REGISTRE.md`. **Aucun nouveau backend.** Le lot se
  contente de **l'exposer au même niveau** que l'ajout dans les surfaces (§ 8).
- **Skill matérialisé (B)** : **NEUF** — dé-matérialiser un skill de `library/skills/<id>/` (l'artefact
  écrit par `materializeSkill`). Contraintes :
  - **RESTRICT** : si un ou plusieurs personas référencent encore ce skill (`skills:[]`), le retrait est
    **refusé** et **oriente vers la détache** (ligne A) d'abord — on ne laisse pas un persona pointer un
    skill fantôme (I1). C'est exactement `findReferrers` (§ 5.2) appliqué aux personas.
  - **Non destructif** (§ 7) : le dossier du skill est **archivé**, jamais supprimé sec ; restaurable.
  - Ce geste **est** la réponse au **Q-3 différé** de `surface-apprentissage.md`.

> **Note** : `review reject` (D) et l'application (B/C) sont **distincts** — `reject` retire une
> proposition **en attente** (déjà livré, T5) ; B/C retirent un artefact **déjà posé**. La symétrie `+/−`
> exige les **deux** ; ce lot ajoute B/C.

---

## 7. Retrait SÛR — non destructif, confirmé, tracé (posture fermée)

Par cohérence avec la méthode (« toute action vraiment destructive → confirmation par message avant
d'agir » ; `memory remove` idempotent non destructif ; `switch --rollback` sauvegarde `.claude.bak-*`) et
avec l'état de l'art (§ 13, *soft delete / corbeille* + friction proportionnelle au risque) :

- **Corbeille, pas suppression sèche.** Tout retrait de fichier/dossier (E, B, et A si Option 2) **déplace
  vers une corbeille** horodatée (patron `.bak-<horodatage>` de `switch`, appliqué à la bibliothèque),
  **restaurable**. Le détach A en Option 1 (édition de `skills:[]`) est déjà réversible par nature (ré-attache).
- **Confirmation proportionnée au risque.** Détacher un skill (réversible d'un geste) → friction légère.
  Retirer un team/binding référencé, ou forcer un `--cascade` → **confirmation explicite** requise.
- **Trace.** Chaque retrait laisse une trace (log + entrée corbeille) : *quoi, d'où, quand, restaurable ?*.
- **RESTRICT par défaut, CASCADE explicite** (§ 13). Le défaut **refuse** un retrait qui orphelinerait une
  référence (I1) ; le décideur peut forcer une cascade **explicitement**. Jamais de cascade silencieuse.

---

## 8. Symétrie des SURFACES — le `−` aussi accessible que le `+`

Le retrait doit être offert **partout où l'ajout existe**. Constat des surfaces d'ajout actuelles :
`add`/`memory`/`review` sont **CLI** ; `review apply/reject` est **aussi** exposé par la skill
conversationnelle `iakaframe-learning` et l'**onglet « Apprentissage »** (U1..U5 de `surface-apprentissage.md`).

- **[MVP] CLI** : miroir complet — `remove <kind> <id>`, `detach`/`attach`, dé-matérialisation de skill,
  `memory remove` (déjà là). C'est la baseline zéro-dep, **toujours disponible**.
- **[2ᵉ tranche — Q-4 acté] Skill conversationnelle** : étendre `iakaframe-learning` (`/learning`) pour
  présenter les gestes `−` **au même niveau** que les `+` (détacher, dé-matérialiser, retirer) —
  cohérent avec la « symétrie +/− de premier plan » déjà posée en § 6 de `surface-apprentissage.md`.
- **[2ᵉ tranche — Q-4 acté] Onglet GUI** : bouton `−` en **regard** du skill/élément (Option 1 de § 4.3 :
  la GUI **rend** le titre du skill depuis le frontmatter + un `−` jumeau du `+`). Le retrait d'un
  **appliqué** vit dans le filtre « historique `applique` » de l'onglet Apprentissage (déjà prévu, Q-4 de
  `surface-apprentissage`).

**TRANCHÉ (Q-4)** : **MVP = CLI** (toutes les lignes A/B/E + C réutilisé) ; **skill + GUI en 2ᵉ tranche**
(S6) — elles ne font que **piloter** les verbes CLI, comme l'onglet pilote `review`.

---

## 9. Rapport à l'existant — réutilisé tel quel vs neuf

**Réutilisé TEL QUEL (aucune réimplémentation) :**
- `memory remove` (T1, `memory.js`) — retrait d'entrée mémoire (ligne C).
- `review reject` (T5, `review.js`) — retrait de proposition en attente (ligne D).
- `switch --rollback` + patron `.bak-<horodatage>` (`cli-bibliotheque-verbes.md` § 4.5) — **modèle de
  non-destructivité** transposé à la corbeille de bibliothèque (§ 7).
- `COLLECTIONS`/`scan`/`readEntry`/`checkRefs` (`library.js`) — pour résoudre et contrôler les références.
- Format persona (frontmatter `skills:[]`) — inchangé en Option 1.

**AJOUTÉ (ce lot) :**
- **Socle « retrait sûr »** : corbeille horodatée + confirmation proportionnée + `findReferrers` (RESTRICT
  inverse de `checkRefs`) — mutualisé par tous les retraits.
- **`attach`/`detach <skillId> --persona <id>`** (ligne A) — matérialise le `+`/`−` skill↔persona.
- **`remove team|method|binding <id>`** (ligne E) — le `−` de `add`, avec RESTRICT.
- **Dé-matérialisation d'un skill** de `library/skills/<id>/` (ligne B) — RESTRICT si un persona pointe
  encore ; réponse au Q-3 de `surface-apprentissage.md`.
- **[2ᵉ tranche / Q-4]** exposition des `−` dans la skill conversationnelle et l'onglet GUI.

---

## 10. Périmètre — MVP / différé (fermé)

**[MVP] — cœur CLI, ce lot :**
- Socle retrait sûr (corbeille + confirmation + `findReferrers`/RESTRICT).
- Ligne A : `attach`/`detach` skill↔persona (représentation selon **Q-1**).
- Ligne E : `remove team|method|binding` (le `−` de `add`).
- Ligne B : dé-matérialisation d'un skill (RESTRICT si référencé).
- Ligne C : `memory remove` **exposé/documenté** au même niveau que l'ajout (réutilisé, zéro neuf backend).

**[différé — hors de ce lot] :**
- **Skill conversationnelle + onglet GUI** des retraits (2ᵉ tranche, **Q-4**) : pilotes des verbes CLL.
- **Lignes G, H** (retrait de hook/config appliqués) : dépend de leur **matérialisation** côté `apply`,
  elle-même différée (`review.js` `type-non-materialisable-mvp`).
- **Représentation Option 2** (skills migrés dans le corps + adaptation `scan`/`checkRefs`) : seulement si
  **Q-1** la retient.
- **Purge définitive de la corbeille** (au-delà de l'archivage) : geste séparé, ultérieur.

---

## 11. Critères d'acceptation — numérotés et vérifiables

Le lot est **PASS** si **tous** les points suivants sont constatables :

1. **[Cartographie complète]** Pour chaque chose ajoutable **matérialisable** (A, B, C, D, E, F de § 3),
   il existe un retrait symétrique **atteignable** ; G/H restent différés côté ajout **et** retrait.
   *Test : la table § 3 est couverte ; A/B/E ont un verbe, C/D/F réutilisent l'existant.*
2. **[`−` de `add`]** `iakaframe remove team|method|binding <id>` retire l'élément livré ; **RESTRICT** :
   un élément encore référencé (binding→team, kit→binding…) est **refusé** avec la **liste des référents**,
   sans rien retirer. *Test : remove d'un team référencé par un binding → refus + référents ; remove d'un
   team orphelin → archivé.*
3. **[Détache skill↔persona — cas emblématique]** Un geste retire le skill du persona (selon **Q-1**) ;
   **non destructif et réversible**. *Test : `detach iakaframe-cadrage --persona gandalf` → `skills:[]`
   de `gandalf.md` ne contient plus l'id ; `attach` le restaure.*
4. **[Dé-matérialisation d'un skill appliqué]** Un skill de `library/skills/<id>/` est **archivé** (pas
   supprimé sec) ; **RESTRICT** si un persona le référence encore (message orientant vers `detach`).
   *Test : dé-matérialiser un skill référencé → refus + persona référent ; après `detach`, retrait OK et
   restaurable depuis la corbeille.*
5. **[Symétrie mémoire réutilisée]** Le retrait d'une entrée `PROFIL`/`REGISTRE` passe par `memory remove`
   **existant** — **aucun** nouveau backend mémoire. *Test : `memory remove` retire la puce ; `grep` : pas
   de réimplémentation.*
6. **[Retrait sûr non destructif]** Tout retrait de fichier/dossier = **corbeille horodatée** restaurable
   + **confirmation** proportionnée au risque + **trace** ; jamais de suppression sèche. *Test : après un
   remove, l'artefact est dans la corbeille et **restaurable** ; forcer une cascade exige une confirmation.*
7. **[Intégrité référentielle inverse]** `findReferrers` refuse par **défaut (RESTRICT)** tout retrait qui
   orphelinerait une référence (I1) ; `--cascade`/confirmation explicite pour forcer ; jamais de cascade
   silencieuse. *Test : les deux chemins observés ; aucun orphelin créé sans geste explicite.*
8. **[Symétrie des surfaces]** Au **MVP**, le `−` est offert en **CLI** partout où le `+` existe en CLI
   (A/B/C/E) ; l'exposition **skill conversationnelle + onglet GUI** suit **Q-4** (pilotes des verbes CLI,
   pas de logique dupliquée). *Test : chaque `+` CLI a son `−` CLI ; le cas échéant, GUI/skill appellent le
   verbe, sans re-décider.*
9. **[Non-régression & conventions]** `node --test` vert ; `add`/`review`/`memory`/`switch` **inchangés**
   dans leur comportement d'ajout ; **zéro dépendance runtime** ajoutée ; doc/échanges en français, code en
   anglais ; commits atomiques (conventional commits). *Test : suites existantes au vert ; `package.json`
   `dependencies` inchangé.*

---

## 12. Découpage en tâches pour Gimli (avec dépendances)

> Commits atomiques (conventional commits) ; typecheck+lint+tests avant clôture de chaque tâche.
> **Arbitrages tranchés (§ 14)** : la représentation est fixée (**Q-1 = Option 1**), donc **S2 est
> débloqué** ; les surfaces skill+GUI (S6) sont la **2ᵉ tranche** actée (Q-4).

| Tâche | Intitulé | Dépend de |
|---|---|---|
| **S1** | **Socle « retrait sûr »** : `findReferrers(id, root)` (RESTRICT inverse de `checkRefs`) + corbeille horodatée restaurable `<root>/.trash-<horodatage>/` (Q-6, patron `.bak-*` de `switch`) + helper de confirmation proportionnée + trace. Mutualisé par tous les retraits. Zéro-dep. | — |
| **S2** | **Détache/attache skill↔persona** (ligne A) : `iakaframe attach\|detach <skillId> --persona <id>` — **mute le seul `skills:[]`** du frontmatter (**Q-1 = Option 1**, source unique) ; non destructif, réversible. Le `−` au « titre du skill » est **rendu par les vues**, pas écrit dans le corps. | S1 |
| **S3** | **`remove team\|method\|binding <id>`** (ligne E) : le `−` de `add`, RESTRICT via `findReferrers` (Q-2), cascade seulement si demandée explicitement, archivage corbeille. Miroir de `add.js`. | S1 |
| **S4** | **Dé-matérialisation d'un skill** (ligne B) : retrait de `library/skills/<id>/` vers la corbeille, RESTRICT si un persona référence (oriente vers `detach`). Réponse au Q-3 de `surface-apprentissage`. | S1 |
| **S5** | **Symétrie mémoire exposée** (ligne C) : `memory remove` documenté/branché au même niveau que l'ajout (aucun nouveau backend) ; vérif `grep` (pas de réimplémentation). | — |
| **S6** | **[2ᵉ tranche — Q-4 acté] Surfaces skill + GUI** : présenter les `−` (détacher/dé-matérialiser/retirer) dans `iakaframe-learning` (`/learning`) et l'onglet Apprentissage de iakaFrameGUI (filtre historique), **pilotes** des verbes S2/S3/S4. | S2, S3, S4 |
| **S7** | **Tests + non-régression** : `findReferrers` (RESTRICT/cascade), corbeille restaurable, détache/attache, remove, dé-matérialisation ; suites `add`/`review`/`memory`/`switch` au vert ; zéro-dep. | S2, S3, S4, S5 |

**Ordre conseillé** : S1 → (S2 // S3 // S4 // S5) → S7 ; **S6 en 2ᵉ tranche** (surfaces skill+GUI, après le cœur CLI).

---

## 13. Faits vérifiés sur le web (2026-07-17) + sources

- **Suppression réversible = norme (soft delete / corbeille).** L'approche recommandée pour un retrait
  récupérable est le **soft delete** (marqueur/déplacement) plutôt que la suppression sèche, souvent en
  **hybride « corbeille »** : on retire d'abord de la vue, on purge plus tard — « comme la Corbeille du
  bureau ». La **friction doit être proportionnelle au risque** : archiver un élément restaurable mérite
  peu de friction + un *undo* atteignable ; un retrait plus lourd mérite une confirmation. Piège connu :
  appliquer la règle **de façon inégale** (masquer côté UI mais réapparaître via API/export). → conforte
  la **corbeille horodatée restaurable** + **confirmation proportionnée** + **trace uniforme** (§ 7).
- **Intégrité référentielle au retrait : RESTRICT vs CASCADE.** `RESTRICT` **empêche** de supprimer un
  « parent » tant que des « enfants » le référencent (protège contre les orphelins en **bloquant**) ;
  `CASCADE` supprime automatiquement les dépendants (à réserver aux données **jetables**). Best practice :
  choisir **selon la sémantique métier**, pas la commodité — RESTRICT quand la donnée dépendante a une
  valeur propre. → conforte **RESTRICT par défaut** (un team/skill référencé n'est pas jetable) +
  **CASCADE explicite** seulement (§ 5, § 7), via `findReferrers`.

Sources :
- [Soft delete vs hard delete — data lifecycle (AppMaster)](https://appmaster.io/blog/soft-delete-vs-hard-delete)
- [Soft deletes vs hard deletes — tradeoffs (koder.ai)](https://koder.ai/blog/soft-deletes-vs-hard-deletes)
- [Destructive Actions & Confirmation UX Patterns 2026 (saasui.design)](https://www.saasui.design/blog/saas-destructive-actions-confirmation-ux-patterns)
- [SQL ON DELETE RESTRICT — prevent accidental loss (DataCamp)](https://www.datacamp.com/tutorial/sql-on-delete-restrict)
- [SQL ON DELETE CASCADE — remove dependents (DataCamp)](https://www.datacamp.com/tutorial/sql-on-delete-cascade)

---

## 14. Décisions tranchées par le décideur (2026-07-17)

Les 6 questions d'arbitrage ont été **tranchées**. Elles sont gravées ci-dessous et propagées dans tout
le document.

- **Q-1 — Représentation skill↔persona → OPTION 1 (frontmatter = SOURCE UNIQUE de vérité). TRANCHÉ.** Le
  frontmatter `skills: []` reste **l'unique vérité** ; l'affordance `−` (et le « titre du skill » auquel
  elle s'accroche) est **RENDUE dans les vues** (CLI liste + bouton GUI), **jamais** une section physique
  du corps du persona. **Justification (une seule vérité)** : pas de double source frontmatter↔corps, pas
  de désynchronisation, **aucune** adaptation de `scan`/`checkRefs` (I1/I2/I3 préservés). L'Option 2
  (skills migrés dans le corps) est **écartée**. **Conséquence : S2 débloqué.** (Propagé : § 4.2, § 4.3,
  § 5, S2.)
- **Q-2 — RESTRICT / cascade → RESTRICT PAR DÉFAUT, cascade seulement si explicitement demandée. TRANCHÉ.**
  Un élément encore référencé n'est **pas** retiré en cascade sans mention explicite ; le refus liste les
  référents (`findReferrers`). (Propagé : § 5, § 7, S1, S3.)
- **Q-3 — Attache aussi → OUI, `attach` en plus de `detach`. TRANCHÉ.** Symétrie complète attache/détache
  (l'attache était jusqu'ici un geste manuel non outillé). (Propagé : § 4.2, S2.)
- **Q-4 — Surfaces au MVP → CLI SEUL ; skill (`/learning`) + onglet iakaFrameGUI en 2ᵉ tranche (S6). TRANCHÉ.**
  Les surfaces ne font que **piloter** les verbes CLI. (Propagé : § 8, § 10, S6.)
- **Q-5 — Vocabulaire → `remove` (pour le `−` de `add`) + `attach`/`detach` (skill↔persona). TRANCHÉ.**
  (Propagé : § 4.2, § 5, S2, S3.)
- **Q-6 — Corbeille → `<root>/.trash-<horodatage>/`, purge différée (geste humain). TRANCHÉ.** Retrait
  non destructif ; la purge définitive est un geste humain ultérieur, hors de ce lot. (Propagé : § 7,
  § 10, S1.)

---

## 15. Journal de décision

- **2026-07-17** — Gandalf cadre la **symétrie `+/−`** (décomposabilité) : rendre **retirable** tout ce
  qu'un ajout a ajouté. **Constat de code** : `add` n'a **aucun `−`** ; un skill attaché à un persona
  (`skills:[]` frontmatter) **ne se détache pas** (ni verbe `+` ni `−`) ; un skill **matérialisé** par
  `review apply` **ne se dé-applique pas** (Q-3 différé de `surface-apprentissage`) ; seule la mémoire est
  symétrique (`memory remove`, T1) et `review reject` ne couvre que le **en-attente**. **Cartographie
  fermée** (§ 3) : ferme **A** (détache skill↔persona, cas emblématique), **B** (dé-matérialisation skill),
  **E** (`remove` = `−` de `add`) ; **réutilise** C (`memory remove`), D (`review reject`), F (`switch
  --rollback`) ; **diffère** G/H (hook/config, non matérialisés au MVP). **Posture retrait sûr** :
  corbeille horodatée restaurable + confirmation proportionnée + trace, **RESTRICT par défaut** (via
  `findReferrers`, inverse de `checkRefs`), cascade explicite seulement (faits web § 13). **Symétrie des
  surfaces** : MVP = CLI ; skill + GUI en 2ᵉ tranche (pilotes). **Cadrage seul, aucun code de production.**
  **Arbitrage central ouvert (Q-1)** : représentation skill↔persona — frontmatter+vue (reco) vs corps
  titré. 5 autres questions (§ 14).
- **2026-07-17 (validation)** — Le décideur **valide le jalon** (« JALON VALIDÉ ») et **tranche les 6
  questions** (§ 14). **Q-1 (central)** : **Option 1** — le frontmatter `skills: []` reste la **source
  unique de vérité** ; le `−` au « titre du skill » est **rendu par les vues** (CLI/GUI), pas une section
  du corps → **une seule vérité**, aucune adaptation de `scan`/`checkRefs`, **S2 débloqué**. **Q-2** :
  **RESTRICT par défaut**, cascade seulement si explicitement demandée. **Q-3** : outiller **`attach` en
  plus de `detach`** (symétrie complète). **Q-4** : **MVP = CLI seul**, surfaces skill+GUI en 2ᵉ tranche
  (S6). **Q-5** : vocabulaire **`remove` + `attach`/`detach`**. **Q-6** : corbeille
  **`<root>/.trash-<horodatage>/`**, purge différée (geste humain). Décisions propagées (§ 4.2, § 4.3,
  § 5, § 7, § 8, § 10, § 12). L'implémentation (Gimli) peut démarrer.

> **Statut : VALIDÉ — prêt pour Gimli.** L'implémentation (Gimli) suit le découpage S1..S7 (§ 12) ; **S2
> est débloqué** (Q-1 = Option 1).
