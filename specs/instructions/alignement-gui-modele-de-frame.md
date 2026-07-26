# Instruction — Alignement du GUI (iakaFrameGUI) sur la constitution du modèle de frame + la direction des maquettes

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (décision décideur).
> **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture Gandalf est
> bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli (cross-repo `iakaFrameGUI`), gate
> P2→P3 = 🏹 Legolas.
>
> **Suite déclarée de la constitution.** `constitution-modele-de-frame.md` § 8 nomme explicitement, en
> item downstream, « aligner le GUI sur *frame = méthode + team (frères)* » comme **lot à part entière,
> hors de son périmètre**. La présente instruction **est** ce lot, élargi à la direction des 4 maquettes
> validées (nav de concept, réservoir, Fëanor-en-tête, workflow agnostique). **Arbitrages A→F tranchés
> par le décideur le 2026-07-26** (§ 7) : nav réelle à **9 entrées** (Kit + Apprentissage conservés),
> bascule globale Studio clair, `models` = écran galerie des 8 frames, persona = élément de 1er ordre,
> Fëanor = coquille MVP, refonte d'IA progressive.
>
> **Constats mesurés sur le disque le 2026-07-26** — `preuve-avant-declaration`. Côté iakaframe :
> `~/work/iakaframe` (réservoir, v0.27.0). Côté GUI : `~/work/iakaFrameGUI` (lecture seule, les DEUX
> dépôts). Citations par **nom de fichier / de symbole**, jamais par `chemin:ligne` (les pointeurs
> chiffrés vieillissent ; le message de remise à Aragorn, lui, porte les `chemin:ligne` cliquables).
>
> **Limite de mesure assumée (honnêteté de sourcing).** Les 4 maquettes `specs/mock/gui/*.html` **n'ont
> pas pu être lues** à ce cadrage : l'outillage de listage de répertoire de l'environnement est
> indisponible (ripgrep absent → `Glob`/`Grep` en échec), et l'énumération par noms devinés a échoué.
> La **cible** ci-dessous est donc reconstruite depuis le brief d'Aragorn (qui décrit les maquettes
> validées). **Conséquence portée en critère d'acceptation** : avant tout pixel, l'exécutant (Gimli)
> **ouvre les maquettes réelles** et confronte son rendu à celles-ci (A-CONF). Les **noms exacts** des
> fichiers de maquette sont à confirmer à l'ouverture.

---

## 1. Le besoin, reformulé (le problème avant la solution)

Le GUI est aujourd'hui une **forge à onglets-documents** ; les maquettes validées visent une **console à
7 entrées de concept** qui *raconte* le modèle de frame gravé par la constitution. Le décalage n'est pas
un défaut de données — le cœur `@iakaframe/core` **modélise déjà correctement** l'assemblage — mais un
défaut de **récit visuel** : l'écran ne montre pas que **le frame possède deux frères, une méthode et une
team, que le binding marie**.

**Contexte décisif (décideur) : le GUI n'a PAS d'utilisateur final.** Aucune rétro-compat d'IA/UX n'est
due à un end-user → **liberté de restructurer l'IA**. Posture : **ambitieux sur la cible, MVP sur
l'exécution** — un premier lot pilote qui livre la valeur n°1 (le récit « frères ») sans casser les
contrats de données.

**Priorité n°1 (backlog, item constitution § 2.2 / § 8)** : rendre **visuellement clair** que
**frame = méthode + team (frères)**, et **jamais** « méthode ⊃ team ».

---

## 2. Écart cible ↔ existant (mesuré)

### 2.1 L'existant (mesuré, `~/work/iakaFrameGUI`)

- **Coquille — `src/forge/ForgeShell.tsx`.** Paradigme = **onglets-documents**. `TABS` = 5 entrées
  (`Team · Méthode · Workflow · Kit · Apprentissage`), chacune un **document** (`useForgeDocument` :
  New/Open/Save/Save As/Close + dirty + persistance `.md`). Barre supérieure : marque, onglets,
  `CharteSelector`, boutons **« Ouvrir un frame »** / **« Briques »** / **« Réglages »** (panneaux
  bascule), **« Livrer au Cockpit → »** (handoff).
- **Le frame n'est qu'un panneau read-only — `src/components/OpenFramePanel.tsx`.** Derrière le bouton
  « Ouvrir un frame » : compte les 12 types, montre l'intégrité, la **facette portefeuille** (étage
  Odin), un sélecteur **« Frame active »**, et une ligne **« Assemblage résolu : Méthode · Team ·
  Binding »** + **« Outils par persona (binding) »** (`{runner, model, tools}`). Tout le matériau du
  récit « frères » **existe déjà, mais en lecture seule et enfoui** dans un panneau de réglage.
- **Le « Kit » brouille le récit.** L'onglet Kit se présente comme « **assemblage total** (méthode +
  team + binding) » (`ForgeShell.tsx` `TABS`, `KitAtelier`) — un **4ᵉ document**, pas le **frame**
  montrant ses deux frères. C'est le point exact que la constitution (§ 2.2, « À ne PAS comprendre :
  *la méthode possède la team* ») demande de désamorcer.
- **Réservoir / element pool — `src/forge/ElementPoolPanel.tsx` + `packages/core/src/element-pool.ts`.**
  La « sensation réservoir » **existe en germe** : `buildElementPool(target, frame)` (pur) identifie le
  stock typé de sous-éléments ; le panneau « Briques » l'affiche en rail-accordéon read-only. Ce n'est
  pas encore une entrée de 1er ordre à **fiches à vignettes**.
- **Vignettes / casting — `src/forge/casting.ts`.** `vignetteGradient` (9 dégradés, index 8 = flamme
  Fëanor) + `initialsOf`. Les vignettes existent pour le rail ; **pas** d'écran « persona » de 1er ordre.
- **Fëanor.** Présent comme **persona du roster** (`packages/core/src/roster.ts` : index 8, « Fëanor »,
  rôle `frame`) — **mais aucun composant « Fëanor-en-tête »** (assistant du GUI, dock latéral, même
  composant création/édition) n'existe dans la coquille.
- **Charte — `src/components/CharteSelector.tsx`.** Registre = **« Cinabre par défaut + NaonEdge »**
  (cf. en-tête du fichier). **Studio clair n'y est pas le défaut** (voir § 6).

### 2.2 La cible (4 maquettes validées, d'après le brief Aragorn — à confronter au pixel, A-CONF)

Nav des maquettes = **7 entrées** : `frame · méthode · team · persona · éléments · assemblage · models`.
**library = réservoir** (fiches de persona à vignettes). Écran **assemblage** = frame → méthode + team
(**frères**) + binding. **Création de workflow agnostique** (`kind` pipeline/cycle/flow/cycle-with-gate).
**Fëanor en tête** (même composant en création ET édition, dock latéral en vue simple). Bouton **New**.
Sélection d'un élément → **mode édition**. Charte **Studio clair**.

> **⚙️ Ajustement décideur (2026-07-26, Fork B) — la nav réelle porte 9 entrées, pas 7.** Kit et
> Apprentissage sont **conservés** comme entrées de nav en plus :
> `frame · méthode · team · persona · éléments · assemblage · models · kit · apprentissage`.
> **Divergence assumée** avec les maquettes (7 entrées) : les maquettes restent la **référence de
> STYLE/pattern** ; la nav réelle est à **9 entrées**. `models` est en outre redéfini (Fork D) comme un
> **écran galerie des 8 frames du réservoir**, et non la facette binding. Détail : § 7.

### 2.3 Synthèse de l'écart — ce qui aligne facilement vs ce qui demande une refonte

| Pan de la cible | Existe déjà (réutilisable) | Nature de l'écart |
|---|---|---|
| **Assemblage « frères »** | Données **prêtes** : `FrameAssembly = { frame, binding, method, team }`, `resolveAssembly`, `FrameDescriptor{methodId,teamId}` (`packages/core/src/frame.ts`) ; contenu déjà rendu (read-only) dans `OpenFramePanel` | **Purement présentationnel** — promouvoir le read-only enfoui en écran de 1er ordre qui montre méthode **à côté de** team, mariées par le binding. **Aucun contrat de données à toucher.** |
| **models** (écran galerie des 8 frames — Fork D) | `frame.frames` (`FrameDescriptor[]`) + logique `selectFrame` (`OpenFramePanel`) | Présentationnel — page galerie dédiée (parcourir/choisir un frame). |
| **éléments / réservoir** | `buildElementPool`, `ElementPoolPanel`, `FRAME_TYPE_LABELS` | Présentationnel — promouvoir « Briques » en entrée réservoir de 1er ordre. |
| **persona (fiches à vignettes)** | `casting.ts` (vignettes), roster, `parsePersona` | Présentationnel + composant fiche neuf (léger). |
| **workflow agnostique (`kind`)** | Données **prêtes** : `WorkflowKind`, `WORKFLOW_KINDS`, `parseWorkflow`, `WorkflowAtelier` | Surfacer un sélecteur `kind` — data déjà là. |
| **Nav à 9 entrées** (Fork B) **+ New + sélection→édition** | Le pattern onglet `useState<Tab>` + `useForgeDocument` (New/Open/Save) | **Refonte d'IA progressive** — reformer la coquille `ForgeShell`, ateliers conservés. Le plus structurant. |
| **Fëanor-en-tête** | Persona Fëanor (donnée) ; **aucun** composant d'assistant | **Net neuf** — le plus ambitieux ; MVP = coquille de dock, pas d'IA fonctionnelle. |

**Lecture d'ensemble : le modèle de données est bon ; c'est le récit visuel qui diverge.** La majorité
des lots sont des **coquilles de présentation neuves posées sur des fonctions pures existantes** — donc
à **faible risque de parité**. Seuls la nav (refonte IA) et Fëanor-en-tête (composant neuf) sont lourds.

---

## 3. Invariant DUR — la parité cross-repo (non négociable)

**Le GUI et le canon iakaframe partagent le même modèle de données.** Frontière nette, mesurée :

- **Contrats de données (INTOUCHABLES par un lot d'UI)** : `packages/core/src/frontmatter.ts`
  (`WorkflowMd`, `TeamMd`, `MethodMd`, `KitMd`, les sérialiseurs — **miroir byte-à-byte** de
  `cli/src/lib/frontmatter.js`), `packages/core/src/frame.ts` (`buildFrame`, `checkFrameRefs`,
  `parseWorkflowRefs`, `FrameAssembly`, taxonomie des 12 types), `packages/core/src/workflow.ts`,
  `packages/core/src/element-pool.ts`, `roles.ts`/`roster.ts`, **le schéma vendoré**
  `frontmatter-schema.json`, **les fixtures vendorées**.
- **Surface d'UI (LIBRE de bouger)** : tout `src/` React — `ForgeShell.tsx`, les ateliers
  (`src/forge/ateliers/*`), les panneaux (`OpenFramePanel`, `ElementPoolPanel`), `casting.ts`, le thème.

**Règle de tenue de l'invariant, opposable à CHAQUE lot :**

1. **Un lot d'UI ne modifie AUCUN fichier de `packages/core/src/*` (sérialiseurs/schéma), ni le schéma
   vendoré, ni une fixture vendorée.** Il **consomme** ces contrats (les fonctions y sont déjà pures :
   `buildFrame`, `resolveAssembly`, `buildElementPool`, `parseWorkflow`).
2. **Besoin d'une dérivation neuve ?** L'ajouter comme **nouvelle fonction pure** (à la manière de
   `buildElementPool`), **sans modifier** une signature/sortie existante. Une pure addition ne peut pas
   déplacer la byte-parité.
3. **Un contrat DOIT-il bouger** (cas non attendu pour de la pure présentation) ? Alors il bouge **des
   deux côtés en miroir** (CLI **et** GUI), **re-vendorage** + **golden régénéré**, dans un **lot
   dédié** gaté par Legolas — **jamais** en dommage collatéral d'un lot d'UI.
4. **Gate de sortie de tout lot** (récité en critère d'acceptation) : `vendor-check` (côté iakaframe)
   **drift 0**, suites GUI **`vitest` / `tsc` / `eslint` vertes**, **tests de parité verts**
   (`checkFrameRefs` CLI↔GUI, golden de contrats).
5. **Règle anti-enchevêtrement (séquençage, DUR).** Un lot qui touche une **persona** ou une **fixture**
   (ex. Lot 3, `persona` = élément de 1er ordre — Fork F) est **cross-repo** : il bouge **le canon
   iakaframe ET le GUI ENSEMBLE**, en miroir, dans le **même chantier** — jamais l'un sans l'autre (sinon
   la parité dérive en silence). Corollaire : **un seul chantier par dépôt à la fois** — on ne mène pas
   deux lots concurrents sur `iakaframe` (ou sur `iakaFrameGUI`) en parallèle. Les lots **purement UI**
   (`src/` du GUI seul, sans toucher persona/fixture/contrat) échappent au volet canon, mais restent
   soumis à « un chantier à la fois » côté GUI.

> Autrement dit : le découpage est **conçu** pour que la parité soit tenue **par construction** — les
> lots vivent au-dessus de la ligne de flottaison des contrats. Le seul lot qui *frôle* un contrat
> (workflow `kind`) ne fait que **lire** un champ déjà modélisé et déjà vendoré (v0.26.0/v0.27.0).

---

## 4. Découpage en lots — ordre recommandé + estimations

> Principe : **le plus de valeur pour le moins de casse**, la priorité n°1 en tête, le plus risqué en
> queue. Chaque lot est **livrable et gaté seul** (parité verte à chaque fin de lot).

> **Découpage figé après arbitrages décideur (§ 7).** Ajouts : **Lot 0** (bascule Studio clair, Fork E),
> Lot 2 à **9 entrées** (Fork B), Lot 4 = **écran galerie des 8 frames** (Fork D).

| # | Lot | Valeur | Réutilise | j-h | Complexité / risque |
|---|---|---|---|---|---|
| **0** | **Bascule GLOBALE Studio clair** (Fork E) — tout le GUI passe en Studio clair (défaut actuel = Cinabre) | Contexte visuel cible **avant** tout écran | `CharteSelector`/registre de chartes, tokens de thème | **0,5–1** | Faible / faible (thème `src/`, **zéro impact parité**) |
| **1 — PILOTE** | **Écran d'assemblage « frame = méthode + team (frères) + binding »** | **Priorité n°1** — le récit « frères » | `FrameAssembly`, `resolveAssembly`, contenu de `OpenFramePanel` | **1,5–2,5** | Moyenne / **faible** (data prête) |
| **2** | **Nav à 9 entrées** (`frame·méthode·team·persona·éléments·assemblage·models·kit·apprentissage`) + bouton **New** + **sélection→édition** — **superposition PROGRESSIVE** (Fork A), ateliers conservés comme surfaces d'édition | Fondation d'IA cible | pattern `useState<Tab>` + `useForgeDocument` ; **ateliers Team/Méthode/Workflow/Kit/Apprentissage réutilisés** | **3–4** | **Haute** / moyen (cycle de doc, migration entrée par entrée) |
| **3** | **Réservoir + persona 1er ordre** (Fork F) : `persona` = **élément de 1er ordre** (`library/personas/`, fiches à vignettes) + `éléments` (réservoir) | Le « réservoir » cible | `buildElementPool`, `ElementPoolPanel`, `casting.ts`, `parsePersona` | **2–3** | Moyenne / **moyen** (**cross-repo canon+GUI** — règle anti-enchevêtrement § 3.5) |
| **4** | **Écran galerie `models`** (Fork D) — page dédiée qui **parcourt/choisit un des 8 frames** du réservoir | Sélection de frame de 1er ordre | `frame.frames` (`FrameDescriptor[]`), logique `selectFrame` | **1–2** | Moyenne / faible (data prête) |
| **5** | **Workflow agnostique** — surfacer le sélecteur `kind` (pipeline/cycle/flow/cycle-with-gate) | Aligne la création de workflow | `WORKFLOW_KINDS`, `WorkflowAtelier` (data prête) | **0,5–1** | Faible / faible |
| **6** | **Fëanor-en-tête — COQUILLE MVP** (Fork C) : le composant + le pattern (même composant création/édition, dock latéral en vue simple), **sans IA fonctionnelle** | Le pattern signature des maquettes | persona Fëanor (donnée), `casting.ts` (flamme) | **2–4** | **Haute** / **inconnues** ; l'assistant fonctionnel = **chantier séparé** |

**Ordre recommandé : 0 → 1 → 2 → 3 → 4 → 5 → 6.** Justification : (0) bascule Studio clair **d'abord**,
pour que chaque écran suivant soit conçu et confronté au pixel directement dans la charte cible (pas de
repasse de thème) ; (1) livre la valeur n°1 en isolé et prouve la tenue de parité sur un lot
self-contained ; (2) pose l'IA cible (9 entrées, progressif) une fois le récit central acquis ; (3–4–5)
remplissent les entrées (3 est **cross-repo** — canon+GUI ensemble, § 3.5) ; (6) en dernier, net-neuf et
porteur d'inconnues. **Total cible ≈ 10,5–17,5 j-h** ; **premier incrément de valeur (Lot 0 puis Lot 1)
≈ 2–3,5 j-h**.

> Si le décideur veut le plus court chemin de valeur : **Lot 0 + Lot 1** est un livrable complet et
> défendable (GUI en Studio clair + récit « frères » rendu, parité verte), avant tout engagement sur la
> refonte d'IA (Lot 2).

---

## 5. Lot pilote (Lot 1) — spécification fermée

**But.** Un **écran d'assemblage de 1er ordre** qui rend le frame comme **deux frères** — une **méthode**
(des rôles) et une **team** (des personas) — **côte à côte** sous le frame, **mariés par le binding**.
Jamais la team imbriquée dans la méthode.

**Source de données (existante, read-only, aucun contrat touché) :** `loadFrame(api)` →
`frame.assembly` (`{ frame, binding, method, team }`), `frame.frames` (réservoir + sélecteur de frame
active), `frame.assembly.binding.assignments` (le mariage persona→couple). Tout est déjà produit par
`buildFrame`/`resolveAssembly` (`packages/core/src/frame.ts`) et déjà affiché — en vrac — par
`OpenFramePanel`.

**Geste.** Extraire/composer une vue dédiée (nouveau composant `src/`, ex. `AssemblyView`) qui :
1. affiche le **frame** en nœud parent (nom + version + `default ★`), avec le sélecteur de frame active
   (réutiliser la logique `selectFrame` d'`OpenFramePanel`) ;
2. sous lui, **deux colonnes frères de même niveau** : **Méthode** (workflow + principes/rituels/
   gardes-fous/rôles/scaffolds, par ids) et **Team** (personas + coordinateur), **visuellement pairs** ;
3. entre/sous les deux, le **binding comme lien de mariage** : chaque `assignment` reliant une persona
   de la team à un rôle de la méthode ; réutiliser le message d'orphelin d'intégrité
   (`frame.integrity`) pour signaler un rôle non couvert ;
4. **read-only au MVP** (identifier/afficher, comme `OpenFramePanel`) — l'édition viendra avec la nav
   (Lot 2). Aucun nouvel I/O au-delà de `loadFrame`.

**Hors périmètre du pilote :** l'édition inline, la nav (9 entrées, Lot 2), Fëanor (Lot 6), la charte
(Lot 0, faite avant le pilote). (Lots dédiés.)

---

## 6. Charte — écart réel à trancher

- **Cible (maquettes) : Studio clair.**
- **Existant : `CharteSelector` liste « Cinabre par défaut + NaonEdge »** — **Studio clair n'y est pas
  le défaut** (peut-être absent du registre). Écart **confirmé**.
- **Cohérence méthode** : la règle *charte par défaut contextuelle* (mémoire projet) dit que le défaut
  doit être **Studio clair pour le dev logiciel** — donc la cible est **conforme à la doctrine**, et
  c'est le **registre actuel qui diverge** (défaut Cinabre).
- **✅ TRANCHÉ décideur (Fork E) → BASCULE GLOBALE.** Tout le GUI passe en **Studio clair** (ajouter la
  charte si absente ; basculer le défaut Cinabre → Studio clair). **Sans impact parité** (thème =
  `src/`/tokens, hors contrats). **Positionnement : Lot 0 dédié, avant le pilote** (reco Gandalf, § 4 /
  § 7) — pour que chaque écran suivant soit conçu et confronté au pixel directement dans la charte cible.

---

## 7. Arbitrages décideur (forks structurants — ✅ TRANCHÉS le 2026-07-26)

> Gandalf **proposait**, le décideur **a tranché** (2026-07-26). Les 6 forks sont **figés** ci-dessous et
> reportés dans les lots (§ 4) et les critères (§ 8).

- **Fork A — Ampleur de la refonte d'IA (Lot 2). ✅ TRANCHÉ décideur → PROGRESSIF.** Le Lot 2 se fait par
  **superposition progressive** — les ateliers existants sont **conservés comme surfaces d'édition**
  derrière les nouvelles entrées, migration **entrée par entrée**. **Pas de big-bang.** (Conforme à la
  reco Gandalf.)
- **Fork B — Sort du « Kit » et de l'« Apprentissage ». ✅ TRANCHÉ décideur → GARDER LES DEUX comme
  entrées de nav.** Conséquence structurante : **la nav n'est PAS 7 mais 9 entrées** —
  `frame · méthode · team · persona · éléments · assemblage · models · kit · apprentissage`.
  **Divergence assumée avec les maquettes** (qui montraient 7) : les maquettes restent la **référence de
  STYLE/pattern**, mais la **nav réelle porte 9 entrées** (Kit et Apprentissage conservés). L'écran
  `assemblage` montre **déjà** le kit (méthode + team + binding + kit) ; l'**entrée Kit dédiée est
  néanmoins conservée** par choix décideur (elle ne fond pas dans `assemblage`).
- **Fork C — Fëanor-en-tête (Lot 6). ✅ TRANCHÉ décideur → COQUILLE MVP.** Le Lot 6 livre une **coquille**
  (le composant + le pattern « même composant création/édition, dock latéral en vue simple »), **sans
  comportement d'IA**. L'assistant **fonctionnel (LLM branché) est un chantier SÉPARÉ**, hors ce lot.
  (Conforme à la reco Gandalf.)
- **Fork D — `models`. ✅ TRANCHÉ décideur → ÉCRAN GALERIE À PART.** `models` est une **page dédiée** qui
  **parcourt et choisit un des 8 frames** du réservoir — **pas** une simple facette de l'assemblage, ni
  la facette binding `{runner,model,tools}`. Réutilise `frame.frames` (`FrameDescriptor[]`) + la logique
  `selectFrame`.
- **Fork E — Charte Studio clair. ✅ TRANCHÉ décideur → BASCULE GLOBALE.** **Tout le GUI passe en Studio
  clair** (charte contextuelle du contexte dev, cohérente avec les maquettes). C'est un **lot de bascule
  de charte** (le défaut actuel est **Cinabre**, `CharteSelector.tsx`). **Positionnement — reco Gandalf :
  lot dédié le PLUS TÔT (Lot 0), avant le pilote** — voir § 4 et la justification ci-dessous.
- **Fork F — `persona`. ✅ TRANCHÉ décideur → ÉLÉMENT DE 1er ORDRE.** La fiche persona est un **élément de
  frame de 1er ordre** (`library/personas/`, éditée hors team — fidèle à la constitution C-5 « personas =
  éléments de frame »), **pas** une vue dérivée de la team. (Conforme à la reco Gandalf.)

**Positionnement de la bascule Studio clair (reco Gandalf, motivée).** La placer en **Lot 0 dédié, avant
le pilote** : (1) c'est une bascule **globale, à faible risque, sans impact parité** (thème = `src/`/tokens,
hors contrats) ; (2) la faire **d'abord** garantit que **chaque écran suivant** (pilote inclus) est
**conçu ET confronté au pixel (A-CONF) directement dans la charte cible** — pas de repasse de re-thématisation
après coup. L'intégrer au Lot 2 mélangerait une bascule transverse à une refonte d'IA (deux natures de
risque dans un même lot). **Reco : Lot 0.**

---

## 8. Critères d'acceptation (mesurables — par lot)

- **A-PARITÉ (tous les lots, DUR)** : à la fin de **chaque** lot — `vendor-check` (iakaframe) **drift 0**
  inchangé ; suites GUI **`vitest` + `tsc` + `eslint` vertes** ; **tests de parité verts**
  (`checkFrameRefs` CLI↔GUI, golden de contrats) ; `git diff` sur `packages/core/src/*` sérialiseurs,
  schéma vendoré et fixtures vendorées = **vide** (sauf lot de contrat dédié explicitement décidé, § 3.3).
- **A-CONF (tous les lots)** : le rendu est **confronté aux maquettes réelles** `specs/mock/gui/*.html`
  (ouvertes par l'exécutant) et jugé **conforme** à la maquette correspondante.
- **A1 (Lot 1 — pilote)** : l'écran d'assemblage montre **méthode et team au même niveau** (deux frères),
  **jamais** la team imbriquée dans la méthode ; le **binding** est rendu comme le lien qui les marie ;
  un rôle non couvert (orphelin d'intégrité) est **signalé**. Conforme à la maquette d'assemblage.
- **A0 (Lot 0)** : **tout le GUI** rend en **Studio clair** (défaut basculé Cinabre → Studio clair) ;
  aucune régression des autres chartes du registre ; **zéro impact parité** (`git diff` sur
  `packages/core/src/*` et fixtures = vide).
- **A2 (Lot 2)** : la coquille présente les **9 entrées**
  (`frame·méthode·team·persona·éléments·assemblage·models·kit·apprentissage`) ; un bouton **New** ;
  **sélectionner un élément → mode édition**. Migration **progressive** (Fork A) : les surfaces d'édition
  **réutilisent les ateliers existants** (Team/Méthode/Workflow/Kit/Apprentissage).
- **A3 (Lot 3)** : `persona` est un **élément de 1er ordre** (`library/personas/`, éditable hors team,
  fiches à vignettes via `casting.ts`) ; `éléments` rend le **réservoir** typé (via `buildElementPool`).
  Lot **cross-repo** : canon iakaframe + GUI bougent **ensemble** (§ 3.5) — parité verte des deux côtés.
- **A4 (Lot 4)** : l'entrée `models` est un **écran galerie** qui **liste les 8 frames** du réservoir et
  permet d'en **choisir un** (via `frame.frames` + `selectFrame`).
- **A5 (Lot 5)** : la création de workflow expose le choix de `kind` parmi
  `pipeline/cycle/flow/cycle-with-gate` (via `WORKFLOW_KINDS`) ; un workflow créé se relit à l'identique
  (round-trip `parseWorkflowMd`/sérialiseur inchangés).
- **A6 (Lot 6)** : **Fëanor-en-tête** présent, **même composant** en création ET édition, **dock latéral**
  en vue simple — **coquille MVP** (aucune IA fonctionnelle ; l'assistant branché = chantier séparé, Fork C).
- **A7 (anti-enchevêtrement, § 3.5)** : tout lot touchant une **persona/fixture** (Lot 3) a bougé
  **canon + GUI ensemble** ; **un seul chantier par dépôt** à la fois. (La charte Studio clair est
  couverte par **A0**.)

---

## 9. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Premier chemin de valeur (Lot 0 + Lot 1) : 2–3,5 j-h.** Chantier cible complet (Lots 0→6) : **≈ 10,5–17,5 j-h**, à engager **par lots gatés** (pas un big-bang — Fork A tranché PROGRESSIF). |
| **Complexité / risque** | **Faible** pour les lots présentationnels sur data prête (0, 1, 4, 5) — la parité est tenue **par construction** (§ 3). **Moyen** pour le Lot 3 (**cross-repo** canon+GUI, § 3.5). **Haute** pour la refonte d'IA progressive (2) et Fëanor-en-tête (6). Risque de parité **maîtrisé** tant que les lots restent au-dessus de la ligne des contrats de `packages/core/src/*`. |
| **Inconnues (susceptibles de faire glisser)** | (1) **Maquettes non lues à ce cadrage** — l'écart de détail au pixel reste une inconnue jusqu'à A-CONF (noms de fichiers + contenus exacts à confirmer par Gimli) ; **la nav réelle diverge des maquettes (9 vs 7 entrées)** par choix décideur assumé (Fork B). (2) **Fëanor-en-tête** (Lot 6) : seul le périmètre **coquille** est chiffré ; l'assistant **fonctionnel (LLM)** est un **chantier séparé**, non chiffré ici (Fork C). (3) **Propreté du dépôt GUI** à vérifier avant de brancher (espace de dev du décideur — le coordinateur confirme iakaframe propre sur `main`). (4) **Lot 3 cross-repo** : le coût de mise en miroir canon↔GUI de la persona 1er ordre peut dépasser l'estimation si des fixtures nombreuses bougent. *(Forks A/B/D/E/F désormais tranchés → inconnues correspondantes levées.)* |

> Rappel méthode : cette estimation est **rappelée à la clôture du lot**, confrontée au **temps réel**,
> pour affiner les suivantes. Ce n'est **pas un engagement ferme**.

---

## 10. Portée cross-repo

**Cross-repo `iakaFrameGUI`** — l'exécution touche `src/` du dépôt GUI. **Le dépôt iakaframe n'est
touché que pour la doc de cadrage** (ce fichier). **Aucun contrat de données ne bouge** dans ce chantier
(§ 3) : le cœur `@iakaframe/core`, le schéma vendoré et les fixtures restent **byte-inchangés** ; la
parité (`vendor-check` drift 0) est un **invariant de sortie de chaque lot**, pas un objet du chantier.

---

## Sources (faits externes vérifiés — obligation de sourcing)

- **Décision de ne PAS introduire de dépendance de navigation** (nav à 7 entrées hand-rolled en
  extension du pattern `useState<Tab>` existant, esprit zéro-dépendance du cœur) : l'état de l'art des
  coquilles React confirme que la sidebar/nav est un pattern composant standard, sans lib requise —
  [Sidebar (computing), Wikipedia](https://en.wikipedia.org/wiki/Sidebar_(computing)),
  [CoreUI — React Sidebar](https://coreui.io/react/docs/components/sidebar/),
  [Flowbite React — Sidebar](https://flowbite-react.com/docs/components/sidebar/).
  Aucune décision de ce cadrage ne dépend d'un fait externe versionné (posture MVP/réutilisation :
  **aucune dépendance nouvelle**, donc aucune question de compatibilité de version ouverte).
