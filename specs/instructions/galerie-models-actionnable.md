# Instruction — Galerie `models` **actionnable** : poser la frame active du projet depuis iakaFrameGUI (+ source unique CLI↔GUI du pointeur)

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (chantier #2, priorisé par
> le décideur). **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture
> Gandalf est bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli (et 🟠 Fëanor si le canon
> bouge), gate P2→P3 = 🏹 Legolas.
>
> **Décision d'architecture déjà prise (à respecter, NON rouverte)** : le pointeur `iakaframeactive`
> est une **propriété du PROJET** (pas un état global), posé sur le `default` à l'init, changeable par
> l'utilisateur **via iakaFrameGUI OU sur ordre à Odin** (CLI). *(Rappel brief Aragorn.)*
>
> **Constats mesurés sur le disque le 2026-07-26** — `preuve-avant-declaration`. Côté canon :
> `~/work/iakaframe` (réservoir). Côté GUI : `~/work/iakaFrameGUI` (lecture seule, les DEUX dépôts).
> Citations par **nom de fichier / de symbole** ; les `chemin:ligne` cliquables sont dans le message
> de remise à Aragorn (les pointeurs chiffrés vieillissent, l'instruction non).
>
> **Limite d'outillage assumée (honnêteté de sourcing).** `ripgrep` est indisponible dans
> l'environnement (`Glob`/`Grep` en échec) : l'exploration s'est faite par **lecture directe de
> chemins connus**. Les fichiers cités ont tous été **ouverts et lus** ; les fichiers de test sont
> nommés sans avoir été relus (l'exécutant les ouvrira — porté en critère).

---

## 0. État de référence — mesuré, pas présumé

### 0.1 Le fait qui allège tout : **l'écrivain du pointeur existe DÉJÀ côté GUI, et le geste de bascule est prouvé**

Le chantier #2 ne part **pas** de zéro. Mesuré :

| Brique | Réalité mesurée le 2026-07-26 | Statut |
|---|---|---|
| **Écrivain du pointeur (GUI)** | `src/api/backend.ts` → `setActiveFrameId(frameId)` → commande Rust `set_active_frame_id` → `project_conf.rs::write_active_frame` : écrit la clé `frame` de `<projectDir>/iakaframe.json`, **fusion non destructive**, **refuse** d'écrire si le JSON est illisible (préserve `runner`/`node`/`target`/`note` du CLI). | ✅ **LIVRÉ** 2026-07-26 (`iakaFrameGUI/specs/instructions/pointeur-frame-active.md` § 3bis) |
| **Lecteur du pointeur (GUI)** | `active_frame_id` (Rust) + `api.activeFrameId()` ; `loadFrame` le lit et le passe à `buildFrame` → `resolveAssembly` (pivot = frame pointée, repli `default`, repli 1re). | ✅ **LIVRÉ** |
| **Geste de bascule PROUVÉ (GUI)** | `src/components/OpenFramePanel.tsx::selectFrame(frameId)` : `setActiveFrameId` → **recharge depuis le disque** (`loadFrame`, jamais un état local optimiste) → relit le pointeur → **désactive** la carte active (no-op) → **signale le dangling** (`activeFrameIsDangling` + `DANGLING_FRAME_HINT`) → **gère l'erreur** (pas de projet réglé / JSON illisible). | ✅ **LIVRÉ et testé** |
| **Galerie `models` (GUI)** | `src/forge/FramesGallery.tsx` + `src/forge/frameCards.ts` (`buildFramesGallery`, `galleryFromFrame`) : grille de cartes à vignettes des frames du réservoir (`frame.frames`), carte **active** marquée. **Read-only** — son en-tête déclare : *« PÉRIMÈTRE MVP — affichage + marqueur seulement. Le changement de frame active est un chantier séparé (backlog). »* | ⚠️ **read-only** — c'est CE chantier |

> **Conséquence directe.** Rendre la galerie actionnable = **porter le pattern `selectFrame` déjà
> prouvé** (`OpenFramePanel`) dans les cartes de `FramesGallery`. On **réutilise** l'écrivain, le
> rechargement-depuis-disque, la garde de dangling et le no-op — on ne réinvente aucune I/O. **Pure
> présentation `src/`** (invariant de parité tenu par construction, `alignement-gui-modele-de-frame.md`
> § 3).

### 0.2 Le fait qui pèse : **le pointeur n'est PAS une source unique CLI↔GUI** — deux fichiers divergent

C'est la découverte structurante du cadrage, et elle **tranche** la question du brief (« où le pointeur
est-il stocké **exactement** ? »). Il y a **deux supports concurrents, jamais réconciliés** :

| Côté | Fichier réel | Format | Clé | Écrit par | Lu par |
|---|---|---|---|---|---|
| **Canon CLI** (`iakaframe`) | `<projet>/.iakaframe` | **texte `clé=valeur`** | `frame=` (+ `frameVersion=`) | `runInit` (`init.js`) | `activeFrameId`, `frameCoherence`, `resolveFrameForInit` (`frame-active.js`) |
| **GUI** (`iakaFrameGUI`) | `<projet>/iakaframe.json` | **JSON** | `frame` | `set_active_frame_id` (`project_conf.rs`) | `active_frame_id`, `loadFrame` |

**Ce sont DEUX fichiers différents dans le même projet.** Une frame posée depuis la galerie GUI atterrit
dans `iakaframe.json` ; le CLI (`iakastart`, `fullteam`, « ordre à Odin ») continue de lire `.iakaframe`.
**La frame choisie dans le GUI est invisible au CLI, et réciproquement.** C'est une violation frontale
de l'invariant **I-1 « source unique CLI/GUI »** (posé par `pointeur-frame-active.md` § 3) et l'exact
« écran silencieusement faux » que l'invariant **I-4** interdit — au niveau **système**.

**Chronologie qui explique (et tranche) la divergence :**
1. **2026-07-24** — lot réservoir (`reservoir-de-frames.md` D-C) : pointeur dans `.iakaframe` (texte,
   `frame=`+`frameVersion=`). **Exécuté côté CLI** (`init.js` et `frame-active.js` le portent).
2. **2026-07-26** — le décideur **tranche** (`pointeur-frame-active.md`, en-tête) : *« le pointeur de
   frame active **va dans `iakaframe.json`** du projet »*. **Exécuté côté GUI.** Mais §§ 1.2 / 5-R2 / 6
   **diffèrent explicitement** l'alignement du CLI : *« le nom de clé est à confirmer au dépôt iakaframe
   **avant que le CLI ne s'y branche** »* et *« Modifier le CLI (lecture de la clé) : **dépôt
   iakaframe** [hors périmètre] »*.

> **Verdict de fichier (question du brief, tranchée) :** le **support canonique go-forward est
> `<projet>/iakaframe.json`, clé `frame`** — c'est la décision du décideur du **2026-07-26**, qui
> **supersède** le `.iakaframe`/`frame=` du lot réservoir (2026-07-24). Le lecteur CLI lisant
> `.iakaframe` est donc **du code resté en arrière** : l'aligner n'est **pas** une nouvelle décision
> d'architecture, c'est **honorer une décision déjà prise**. (Le nom de clé `frame` est **confirmé
> ici** — R2 de `pointeur-frame-active.md` levé.)

### 0.3 `iakaframe config` fusionne — mais **repart à vide** sur un JSON illisible (faille R1)

`cli/src/commands/config.js` relit `iakaframe.json`, ne touche que ses clés (`runner`/`node`/`target`/
`note`/`aiderModel`) et réécrit — la co-écriture CLI↔GUI est donc **sûre** dans le cas nominal (une clé
`frame` posée par la GUI survit à un `iakaframe config`). **Une faille** (mesurée, `pointeur-frame-
active.md` § 0.1 / R1) : sur un JSON **illisible**, `config` fait `catch { cfg = {} }` et **réécrit à
vide** → la clé `frame` serait **perdue en silence**. Dès que `iakaframe.json` devient le domicile du
pointeur, cette faille peut **effacer la frame active**. À corriger dans le volet canon (Lot 2).

---

## 1. Le problème, posé avant la solution

La galerie `models` **montre** les frames du réservoir mais ne permet pas d'en **poser** une comme
active — alors que tout l'outillage pour le faire (écrivain non destructif, geste de bascule prouvé)
**existe déjà** à côté, dans `OpenFramePanel`. Et même une fois la galerie rendue actionnable, le
pointeur qu'elle pose (`iakaframe.json`) **n'est pas honoré par le CLI** (qui lit `.iakaframe`) : la
décision *« changeable via GUI **ou** sur ordre à Odin »* suppose **une seule** frame active, lue des
deux côtés — ce qui n'est pas le cas aujourd'hui.

Le besoin se dédouble donc, proprement :
1. **Rendre la carte de galerie cliquable** → poser le pointeur → re-résoudre l'assemblage (GUI).
2. **Faire du pointeur une source unique CLI↔GUI** (`iakaframe.json`/`frame`), sans quoi la frame posée
   depuis la galerie ne gouverne ni `iakastart`, ni `fullteam`, ni « l'ordre à Odin ».

---

## 2. La forme retenue — deux lots, dont un GUI-only immédiat

| Lot | Nature | Ce qu'il livre | Portée |
|---|---|---|---|
| **Lot 1 — Galerie actionnable** | **GUI-only** (`src/`) | Les cartes de `FramesGallery` deviennent cliquables → réutilisent le pattern `selectFrame` prouvé (`setActiveFrameId` → recharge disque → dangling → no-op sur l'active). | `iakaFrameGUI/src/` seul. **Aucun contrat, aucune fixture, aucun `vendor-check`.** Shippable seul. |
| **Lot 2 — Pointeur = source unique CLI↔GUI** | **Canon (cross-repo)** | Le CLI lit/écrit le pointeur dans `iakaframe.json`/`frame` (support tranché) au lieu de `.iakaframe`/`frame=` ; correctif R1 ; verbe `iakaframe frame use <frameId>` pour « l'ordre à Odin ». | Canon `iakaframe` (`frame-active.js`, `init.js`, `config.js`, un verbe) + tests. Ferme **I-1**. |

**Lot 1 est le cœur de la demande** (« rendre la galerie actionnable ») et se suffit à lui-même **dans
le GUI** : l'écriture et la relecture passant toutes deux par `iakaframe.json`, la galerie devient un
sélecteur de frame fonctionnel de bout en bout **côté GUI**. **Lot 2 est la clôture honnête** de la
décision décideur : sans lui, le pointeur reste **à moitié câblé** (I-1 non tenu).

---

## 3. Décisions de cadrage — ce que je tranche, ce que je remonte

### D-1 — Support canonique du pointeur : **`<projet>/iakaframe.json`, clé `frame`.** **Tranché (décision décideur du 2026-07-26, rappelée).**
Cf. § 0.2. Le nom de clé `frame` est **confirmé** (lève R2 de `pointeur-frame-active.md`). Le
`.iakaframe`/`frame=` devient **legacy** (lu en repli de transition, D-4).

### D-2 — Lot 1 réutilise le pattern PROUVÉ, il ne le réinvente pas. **Tranché.**
La galerie appelle **le même** `setActiveFrameId` et **le même** geste « recharge-depuis-disque » que
`OpenFramePanel.selectFrame`. Recommandé : **extraire ce geste** en hook/fonction partagée (ex.
`useFrameSwitch(api)`) consommée par les DEUX surfaces (galerie + panneau) — zéro divergence de
comportement, une seule garde de dangling/erreur. À défaut, calque à l'identique.

### D-3 — Confirmation : **pas de modale au MVP** ; retour visuel immédiat + réversibilité. **Tranché (question déléguée du brief).**
Poser le pointeur est **non destructif** (seule la clé `frame` change ; clés CLI préservées ;
« rollback » = re-sélectionner la frame précédente, ou vider la clé → repli `default`). Le GUI **n'a pas
d'utilisateur final** (`alignement-gui-modele-de-frame.md` § 1) et `OpenFramePanel` **ne confirme pas**
déjà. Reco : **pas de modale** ; l'assemblage re-résolu s'affiche **immédiatement** (l'utilisateur
**voit** le changement), plus un liseré/notice inline *« Frame active : X — assemblage re-résolu »*.
Une modale de confirmation serait de la sur-ingénierie contraire au pattern livré. *(Arbitrage mineur :
le décideur peut demander une confirmation ; ce serait un ajout trivial.)*

### D-4 — Transition sans orphelin : **lecture en priorité `iakaframe.json`, repli `.iakaframe`.** **Tranché (Lot 2).**
Les projets déjà initialisés portent `frame=` dans `.iakaframe` (init actuel) mais peut-être **pas** de
clé `frame` dans `iakaframe.json`. Pour ne pas les orpheliner, le lecteur CLI migré résout : **(1)**
`iakaframe.json`/`frame` → **(2)** `.iakaframe`/`frame=` (repli de transition) → **(3)** `default`
câblé. `init.js` **sème** désormais la clé `frame` dans `iakaframe.json` (fusion non destructive, calque
de `config.js`) en plus (ou à la place, choix d'exécution) du `frame=` legacy. Aucune régression : sans
aucun des deux → `default`.

### D-5 — Verbe CLI pour « l'ordre à Odin » : **`iakaframe frame use <frameId>` dédié**, pas d'extension de `use`. **Tranché (Lot 2).**
`iakaframe use <method> <team>` est la **matérialisation** (déploie personas/skills, écrit
`.claude/iakaframe-kit.json`) ; le pointeur est l'**intention** (quelle frame). Les conflater dans `use`
mélangerait deux gestes distincts (cf. `frameCoherence` qui **oppose** justement intention et
matérialisation). Reco : un verbe **`iakaframe frame use <frameId>`** qui écrit `iakaframe.json`/`frame`
(fusion non destructive, **miroir exact** du `write_active_frame` Rust). *(Le § 9 dep 1 de
`reservoir-de-frames.md` prévoyait déjà cette bascule ; elle se pose ici sur `iakaframe.json`, support
tranché.)* **Le verbe n'est PAS requis par la galerie** — il sert « l'ordre à Odin » et complète I-1.

### AR (remonté au décideur) — **périmètre / séquençage : Lot 1 seul, ou Lot 1 + Lot 2 ensemble ?**
C'est le **seul arbitrage ouvert**, et il est **de scope, pas d'architecture** (le support est déjà
tranché, D-1). Deux voies :
- **Option MVP — Lot 1 seul, maintenant.** La galerie devient un sélecteur fonctionnel **dans le GUI**.
  Le pointeur **n'est pas** honoré par le CLI/Odin (I-1 reste ouvert, déjà backlogé par
  `pointeur-frame-active.md` § 6). Le moins cher ; livre la valeur visible immédiatement.
- **Option clôture (RECO Gandalf) — Lot 1 + Lot 2 ensemble.** La frame posée depuis la galerie gouverne
  **aussi** `iakastart`/`fullteam`/« l'ordre à Odin » (I-1 fermé). C'est ce que la décision *« via GUI
  **ou** Odin »* implique littéralement ; sinon la galerie pose un pointeur que la moitié du système
  ignore (I-4, au niveau système). Coût marginal faible (§ 11).

> **Gandalf propose, le décideur tranche** (jalon P1→P2). Ma reco : **Option clôture**, parce qu'un
> pointeur à moitié câblé est exactement le défaut que les invariants I-1/I-4 nous demandent d'éviter,
> et que le coût de Lot 2 est faible.

---

## 4. Périmètre

### Dans le périmètre
- **Lot 1 (GUI).** `FramesGallery.tsx` : cartes cliquables → bascule de frame active (réutilise
  `setActiveFrameId` + geste recharge-depuis-disque) ; **no-op** sur la carte active (désactivée /
  `aria-pressed`) ; **dangling** signalé (`activeFrameIsDangling` + `DANGLING_FRAME_HINT`) ; **erreur**
  gérée (pas de projet réglé / `iakaframe.json` illisible) ; notice inline du changement (D-3).
  Extraction reco du geste partagé `useFrameSwitch` (D-2). `frameCards.ts` inchangé dans son contrat
  (projection pure ; `isActive` déjà porté).
- **Lot 2 (canon), si l'Option clôture est retenue.** `frame-active.js` : `activeFrameId` /
  `frameCoherence` / `resolveFrameForInit` lisent `iakaframe.json`/`frame` en priorité, repli
  `.iakaframe`/`frame=` (D-4). `init.js` : sème `frame` dans `iakaframe.json` (fusion non destructive).
  `config.js` : correctif R1 (ne pas réécrire à vide un JSON illisible — s'abstenir, miroir de la garde
  Rust). Verbe `iakaframe frame use <frameId>` (D-5). Tests des deux dépôts.

### Hors périmètre — explicitement
- **Création / édition de descripteurs de frames** (`frame new`, éditer un `frames/<id>.md`) — chantier
  séparé (`reservoir-de-frames.md` § 9 dep 2).
- **Le pointeur PORTEFEUILLE** (`<hat>/.iakaframe-portefeuille`) comme fallback hérité — déjà lu par
  `resolveFrameForInit` ; **non modifié** ici (second temps, `pointeur-frame-active.md` § 6).
- **La bascule d'assemblage matérialisé** (`use`/`switch` déploie personas/skills) — **distincte** du
  pointeur (D-5) ; non touchée.
- **Toute migration de contenu entre frames** — le lot ne pose **que** le pointeur (contrainte MVP du
  brief).
- **Documentation utilisateur / mémoire** au-delà de la mise en cohérence → 📖 Nathalie.

---

## 5. Spécification fermée

### 5.1 Lot 1 — Galerie actionnable (GUI)

**But.** Cliquer une carte de `FramesGallery` **pose cette frame comme active** et **re-résout**
l'assemblage affiché, avec exactement les mêmes garanties que `OpenFramePanel.selectFrame`.

**Source (existant, réutilisé) :** `api.setActiveFrameId(frameId)` (écrivain livré) ;
`loadFrame(api)` (recharge) ; `activeFrameIsDangling(frames, pointer)` +
`DANGLING_FRAME_HINT` (garde livrée) ; `galleryFromFrame(frame)` (projection).

**Geste.**
1. `FramesGallery` reçoit le **backend injectable** (comme `OpenFramePanel`) — plus qu'un simple
   `loadGallery` : il lui faut l'écrivain + le rechargement. Reco (D-2) : un hook `useFrameSwitch(api)`
   exposant `{ frames, activeId, dangling, busy, error, switchTo }`, partagé avec `OpenFramePanel`.
2. Chaque carte devient un contrôle cliquable (`button`/`role`) : `onClick → switchTo(card.id)`.
3. `switchTo(id)` : `setBusy(true)` → `api.setActiveFrameId(id)` → **recharge** (`loadFrame`) → relit le
   pointeur → recompose les cartes. **Jamais** d'état local optimiste (calque de `selectFrame`).
4. **No-op** : la carte active (`card.isActive`) est **désactivée** (`disabled` / `aria-pressed=true`),
   pas de nouvelle écriture.
5. **Dangling** : si le pointeur relu ne résout pas dans `frame.frames`, afficher `DANGLING_FRAME_HINT`
   (l'utilisateur voit qu'on est retombé sur `default`).
6. **Erreur** : message inline réutilisant celui de `selectFrame` (« aucun dossier de projet réglé, ou
   `iakaframe.json` illisible — écriture refusée plutôt que d'écraser les clés du CLI »).
7. **Notice** de changement (D-3) : *« Frame active : `<name>` — assemblage re-résolu. »*

**Ce qui NE bouge PAS.** Aucun fichier `packages/core/src/*`, aucun schéma vendoré, aucune fixture,
aucun contrat. `frameCards.ts` garde sa signature (projection pure). C'est un lot **au-dessus de la
ligne de flottaison des contrats** (`alignement-gui-modele-de-frame.md` § 3) : parité tenue **par
construction**.

### 5.2 Lot 2 — Pointeur source unique CLI↔GUI (canon, si Option clôture)

**But.** Le CLI lit et écrit le pointeur **là où la GUI l'écrit** : `iakaframe.json`/`frame`.

1. **`frame-active.js`** — `activeFrameId(projectDir)` : lire `iakaframe.json`/`frame` (JSON) en
   **priorité**, repli `.iakaframe`/`frame=` (transition, D-4), repli `HARDWIRED_DEFAULT_FRAME`. Idem la
   source de `frameCoherence` (le pointeur d'intention) et de `resolveFrameForInit`/`frameVersion`.
   *(Ajouter un `parseJsonKey` défensif à côté de `parseKeyValueFile` — fichier absent/illisible → repli,
   jamais de jet.)*
2. **`init.js`** — semer la clé `frame` dans `iakaframe.json` (fusion non destructive, calque de
   `config.js`), en plus du `frame=` legacy (ou à la place — choix d'exécution, tant que D-4 tient).
3. **`config.js`** — correctif **R1** : sur un `iakaframe.json` illisible, **ne pas réécrire à vide**
   (s'abstenir + signaler), miroir de la garde `write_active_frame` (Rust). Ne jamais effacer `frame`.
4. **Verbe `iakaframe frame use <frameId>`** (D-5) — écrit `iakaframe.json`/`frame` (fusion non
   destructive) ; `--path <projet>` ; valeur vide → retrait de la clé (repli `default`). Miroir exact du
   `set_active_frame_id` GUI. Sortie `--json`.
5. **Tests** — canon : lecture prioritaire JSON, repli `.iakaframe`, projet sans pointeur → `default`,
   `config` n'efface pas `frame`, verbe `frame use` round-trip non destructif. GUI : inchangé (déjà
   testé) sauf ajouts Lot 1.

---

## 6. Invariants — à ne pas casser

- **I-1 — source unique CLI/GUI** : après Lot 2, un seul fichier/clé porte le pointeur
  (`iakaframe.json`/`frame`), lu des deux côtés. *(Lot 1 seul : I-1 reste ouvert — assumé, remonté.)*
- **I-2 — écriture non destructive** : ni la galerie, ni le verbe CLI, ni `init`/`config` ne réécrivent
  le fichier entier ; `runner`/`node`/`target`/`note`/`aiderModel` sont **intouchables**.
- **I-3 — sans pointeur = comportement actuel**, à l'identique (repli `default`, prouvé par test).
- **I-4 — un pointeur mort ne ment pas** : frame introuvable → repli `default` **et** signalé
  (`activeFrameIsDangling`).
- **I-5 — le pointeur est propriété du LIEU**, jamais un état de la GUI (aucun miroir dans
  `settings.json`).
- **Parité** : `vendor-check --strict` **drift 0** inchangé ; suites GUI (`vitest`/`tsc`/`eslint`) et
  CLI vertes ; `git diff` sur `packages/core/src/*` sérialiseurs + schéma vendoré + fixtures = **vide**
  (Lot 1 ne les touche pas ; Lot 2 non plus — il touche la lib CLI + tests, pas les fixtures vendorées).

---

## 7. Critères d'acceptation — numérotés, mesurables

**Lot 1 (GUI)**
- **A1** — Cliquer une carte non active de `FramesGallery` **pose** cette frame (`setActiveFrameId`
  appelé avec son id) puis **recharge depuis le disque** ; l'assemblage/le marqueur « actif » reflètent
  la nouvelle frame. *(Test : backend mocké, `setActiveFrameId` reçoit l'id, `loadFrame` rappelé.)*
- **A2** — La carte **active** est **non cliquable** (`disabled`/`aria-pressed`) : re-sélectionner
  l'active est un **no-op** (aucune écriture).
- **A3** — Pointeur mort (frame absente du réservoir) → `DANGLING_FRAME_HINT` affiché, repli `default`.
- **A4** — Sans projet réglé / `iakaframe.json` illisible → message d'erreur inline, **aucune**
  exception, **aucune** écriture partielle.
- **A5** — **Zéro impact parité** : `git diff` sur `packages/core/src/*` + fixtures vendorées = vide ;
  `vitest`/`tsc`/`eslint` verts ; compte de tests **non diminué** (ajouts pour la galerie).
- **A-CONF** — Rendu confronté à la maquette `specs/mock/gui/01-library.html` (galerie de cartes),
  cohérence Studio clair.

**Lot 2 (canon, si Option clôture)**
- **A6** — `activeFrameId(projet)` rend la frame de `iakaframe.json`/`frame` **en priorité** ; à défaut
  celle de `.iakaframe`/`frame=` (transition) ; à défaut `iakaframe` (`default`). *(Test des 3 cas.)*
- **A7** — Une frame **posée par la GUI** (`iakaframe.json`/`frame`) est **lue par le CLI**
  (`activeFrameId`) et **gouverne** `fullteam`/`iakastart` : I-1 fermé. *(Test de bout en bout.)*
- **A8** — `iakaframe config` sur un `iakaframe.json` **illisible** **n'efface pas** la clé `frame`
  (R1 corrigé : s'abstient au lieu de réécrire à vide). *(Test.)*
- **A9** — `iakaframe frame use <id>` écrit `iakaframe.json`/`frame` **sans** toucher `runner`/`node`/
  `target`/`note` (round-trip prouvé) ; valeur vide → retrait de la clé. *(Test.)*
- **A10** — `vendor-check --strict` **drift 0** inchangé ; suites CLI vertes ; compte non diminué.

---

## 8. Risques et défauts relevés

| # | Risque / défaut | Portée | Traitement |
|---|---|---|---|
| R1 | **`iakaframe config` réécrit à vide** un JSON illisible → clé `frame` perdue en silence | canon | **A8** — s'abstenir (miroir garde Rust) ; le CLI n'efface jamais `frame` |
| R2 | **Lot 1 seul = pointeur à moitié câblé** (GUI pose `iakaframe.json`, CLI lit `.iakaframe`) → I-1 non tenu | système | **AR remonté** : Option clôture (Lot 2) recommandée ; sinon assumé et re-backlogé |
| R3 | **Projets legacy** avec `frame=` dans `.iakaframe` mais rien dans `iakaframe.json` | canon | **D-4** — lecture repli `.iakaframe` ; `init` sème `iakaframe.json` |
| R4 | **Divergence de comportement** galerie ↔ `OpenFramePanel` si le geste est dupliqué au lieu d'être partagé | GUI | **D-2** — extraire `useFrameSwitch` partagé |
| R5 | **État optimiste** menteur si l'écriture échoue | GUI | Calque `selectFrame` : **recharge-depuis-disque**, jamais d'optimisme |
| R6 | **Sur-ingénierie** (modale de confirmation, migration de contenu) | méthode | § 4 hors périmètre ; D-3 : pas de modale au MVP |
| R7 | **`frameVersion`** (re-sync AR-3) : où vit-il une fois le pointeur en `iakaframe.json` ? | canon | Hors périmètre strict ; à cadrer avec `frame new`/re-sync — **signalé**, non traité ici |

---

## 9. Dépendances — déclarées

1. **`pointeur-frame-active.md` (dépôt `iakaFrameGUI`, LIVRÉ)** — fournit l'écrivain + le lecteur GUI +
   le geste `selectFrame`. **Ce lot en dépend directement** (Lot 1 le réutilise ; Lot 2 aligne le CLI
   sur son choix de support et **lève** son R2/§6).
2. **`reservoir-de-frames.md` § 9 dep 1** — prévoyait la bascule de frame par le user ; **ce lot la
   réalise** (galerie + verbe `frame use`), sur `iakaframe.json` (support tranché depuis).
3. **`frame new` / `frame lint` / re-sync `frameVersion`** — chantier séparé ; consommera le même
   pointeur. Non bloquant.

---

## 10. Portée cross-repo — **verdict explicite**

- **Lot 1 (galerie actionnable) = GUI-only.** L'écrivain existe (`setActiveFrameId`, livré) ; il ne
  reste que le **câblage `src/`** de `FramesGallery`. **Aucun** contrat de données, **aucune** fixture,
  **aucun** `vendor-check` touché. La règle anti-emmêlement (`alignement-gui-modele-de-frame.md` § 3.5)
  n'est **pas** déclenchée (rien de vendoré ne bouge).
- **Lot 2 (source unique) = CROSS-REPO**, au sens où il **aligne le canon `iakaframe`** (lecteur/écrivain
  + verbe + tests) sur le **contrat de fichier** (`iakaframe.json`/`frame`) que la GUI porte déjà. Les
  deux dépôts partagent alors ce **contrat de données** (le format du pointeur) — c'est ce qui rend I-1
  vrai. **Mais aucune fixture vendorée ne bouge** : Lot 2 touche la **lib CLI + tests**, pas le golden
  kit ni `frontmatter-schema.json`. Donc `vendor-check --strict` **reste vert par construction** (gate,
  pas objet du lot). L'écrivain GUI n'a **pas** à re-bouger (déjà sur `iakaframe.json`).

> **Réponse directe au brief :** l'`api` GUI a **déjà** son setter (pas à ajouter) ; le canon a **déjà**
> un lecteur, mais **sur le mauvais fichier** — l'aligner est le vrai travail cross-repo, sans fixture
> ni vendor-check impacté. Le chantier n'est donc **pas** « GUI api + canon écrivain + fixtures »
> comme un lot de contrat classique : c'est **GUI (câblage) + canon (ré-adressage du lecteur)**, gate
> `vendor-check` trivialement vert.

---

## 11. Estimation — jalon P1→P2 (obligatoire)

> **Ordre de grandeur assumé et révisable, jamais un engagement ferme.**

| Poste | Charge (j-h) |
|---|---|
| **Lot 1** — `useFrameSwitch` partagé + cartes cliquables + no-op + dangling + erreur + notice + tests galerie | **0,5 – 0,75** |
| **Lot 2** — `frame-active.js` lecture prioritaire JSON + repli `.iakaframe` + tests | 0,3 |
| **Lot 2** — `init.js` sème `iakaframe.json`/`frame` + `config.js` correctif R1 + tests | 0,3 |
| **Lot 2** — verbe `iakaframe frame use <frameId>` + `--json` + tests | 0,25 |
| Rituel de « fini » : 2 suites vertes + `vendor-check --strict` drift 0 | 0,15 |
| **Total Option MVP (Lot 1 seul)** | **~0,5 – 0,75 j-h** |
| **Total Option clôture (Lot 1 + Lot 2)** | **~1,5 j-h** *(fourchette 1,25 – 2)* |

**Complexité : faible** (Lot 1) à **moyenne** (Lot 2, cross-repo mais sans fixture). **Risque : faible.**
- *Ce qui abaisse le risque* : l'écrivain, la garde de dangling et le geste de bascule sont **déjà
  livrés et testés** (`OpenFramePanel`) ; Lot 1 est **pure présentation** (parité par construction) ;
  Lot 2 ne touche **aucune** fixture vendorée (`vendor-check` vert trivialement).
- *Inconnues susceptibles de faire glisser* :
  1. **Extraction `useFrameSwitch`** — si `OpenFramePanel` est refactoré pour partager le geste, l'effort
     de non-régression du panneau s'ajoute (mineur).
  2. **Maquette `01-library.html`** non relue à ce cadrage (ripgrep absent) — écart de détail au pixel
     à confirmer par l'exécutant (A-CONF).
  3. **`frameVersion` (re-sync AR-3)** une fois le pointeur en `iakaframe.json` — **signalé** (R7),
     non chiffré ici (chantier `frame new`/re-sync).

---

## 12. Fichiers de référence
*(Par nom de fichier / de symbole ; les `chemin:ligne` cliquables sont dans le message à Aragorn.)*

**Dépôt `iakaFrameGUI`**
- `src/forge/FramesGallery.tsx`, `src/forge/frameCards.ts` — la galerie `models` à rendre actionnable.
- `src/components/OpenFramePanel.tsx` — `selectFrame` : **le geste de bascule prouvé à réutiliser**.
- `src/api/backend.ts` — `setActiveFrameId` / `activeFrameId` (écrivain/lecteur livrés).
- `src/forge/frame.ts` — `loadFrame` (recharge) ; `packages/core/src/frame.ts` — `resolveAssembly`,
  `activeFrameIsDangling`, `buildFrame` (résolution multi-frame, **inchangés**).
- `src-tauri/src/project_conf.rs` — `write_active_frame` / `read_active_frame` (`iakaframe.json`/`frame`,
  non destructif).
- `specs/instructions/pointeur-frame-active.md` — **dépendance directe** (livré 2026-07-26).

**Dépôt `iakaframe`**
- `cli/src/lib/frame-active.js` — `activeFrameId`, `frameCoherence`, `resolveFrameForInit` (à ré-adresser
  vers `iakaframe.json`/`frame`, Lot 2).
- `cli/src/commands/init.js` — `runInit` (stamp du pointeur ; sème `iakaframe.json`, Lot 2).
- `cli/src/commands/config.js` — fusion `iakaframe.json` ; **correctif R1** (Lot 2).
- `cli/src/commands/switch.js` — `runSwitch` (matérialisation `iakaframe-kit.json`, **distincte** du
  pointeur ; non touchée).
- `specs/instructions/reservoir-de-frames.md` (D-C, § 9 dep 1), `constitution-modele-de-frame.md`,
  `alignement-gui-modele-de-frame.md` (Lot 4 galerie, § 3 parité).

---

## Sources (faits externes vérifiés — obligation de sourcing)

Aucune **décision** de ce cadrage ne dépend d'un fait externe versionné : le chantier **réutilise**
des commandes Tauri et des composants React **déjà livrés** (aucune dépendance nouvelle, donc aucune
question de compatibilité de version ouverte). Vérification de l'état de l'art confirmant que la pile
existante (`#[tauri::command]` + façade `invoke`, `Result<T,E>`, args JSON-sérialisables, écriture
fichier côté Rust) **reste l'idiome courant de Tauri v2** — donc réutiliser la façade `backend.ts` et
`project_conf.rs` est la voie MVP, sans migration due :

- [Tauri — Inter-Process Communication (v2)](https://v2.tauri.app/concept/inter-process-communication/)
- [Tauri — Calling Rust from the Frontend (v2)](https://v2.tauri.app/develop/calling-rust/)
- [IPC in Tauri — Commands vs Custom IPC (DEV Community)](https://dev.to/hiyoyok/ipc-in-tauri-tauri-commands-vs-custom-ipc-what-to-use-when-2ab4)
