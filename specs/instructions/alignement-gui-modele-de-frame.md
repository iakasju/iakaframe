# Instruction — Alignement du GUI (iakaFrameGUI) sur la constitution du modèle de frame + la direction des maquettes

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (décision décideur).
> **Cadrage pur — ZÉRO code produit ici.** Ce fichier est le seul artefact ; l'écriture Gandalf est
> bornée à `specs/instructions/`. Exécution downstream = ⚒️ Gimli (cross-repo `iakaFrameGUI`), gate
> P2→P3 = 🏹 Legolas.
>
> **Suite déclarée de la constitution.** `constitution-modele-de-frame.md` § 8 nomme explicitement, en
> item downstream, « aligner le GUI sur *frame = méthode + team (frères)* » comme **lot à part entière,
> hors de son périmètre**. La présente instruction **est** ce lot, élargi à la direction des 4 maquettes
> validées (nav à 7 entrées, réservoir, Fëanor-en-tête, workflow agnostique).
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

Nav à **7 entrées** : `frame · méthode · team · persona · éléments · assemblage · models`. **library =
réservoir** (fiches de persona à vignettes). Écran **assemblage** = frame → méthode + team (**frères**) +
binding. **Création de workflow agnostique** (`kind` pipeline/cycle/flow/cycle-with-gate). **Fëanor
en tête** (même composant en création ET édition, dock latéral en vue simple). Bouton **New**. Sélection
d'un élément → **mode édition**. Charte **Studio clair**.

### 2.3 Synthèse de l'écart — ce qui aligne facilement vs ce qui demande une refonte

| Pan de la cible | Existe déjà (réutilisable) | Nature de l'écart |
|---|---|---|
| **Assemblage « frères »** | Données **prêtes** : `FrameAssembly = { frame, binding, method, team }`, `resolveAssembly`, `FrameDescriptor{methodId,teamId}` (`packages/core/src/frame.ts`) ; contenu déjà rendu (read-only) dans `OpenFramePanel` | **Purement présentationnel** — promouvoir le read-only enfoui en écran de 1er ordre qui montre méthode **à côté de** team, mariées par le binding. **Aucun contrat de données à toucher.** |
| **models** (runner/model/tools) | `FrameAssignment{runner,model,tools}` + rendu read-only « Outils par persona » (`OpenFramePanel`) | Présentationnel — extraire en entrée dédiée. |
| **éléments / réservoir** | `buildElementPool`, `ElementPoolPanel`, `FRAME_TYPE_LABELS` | Présentationnel — promouvoir « Briques » en entrée réservoir de 1er ordre. |
| **persona (fiches à vignettes)** | `casting.ts` (vignettes), roster, `parsePersona` | Présentationnel + composant fiche neuf (léger). |
| **workflow agnostique (`kind`)** | Données **prêtes** : `WorkflowKind`, `WORKFLOW_KINDS`, `parseWorkflow`, `WorkflowAtelier` | Surfacer un sélecteur `kind` — data déjà là. |
| **Nav à 7 entrées + New + sélection→édition** | Le pattern onglet `useState<Tab>` + `useForgeDocument` (New/Open/Save) | **Refonte d'IA** — remplacer/reformer la coquille `ForgeShell`. Le plus structurant. |
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

> Autrement dit : le découpage est **conçu** pour que la parité soit tenue **par construction** — les
> lots vivent au-dessus de la ligne de flottaison des contrats. Le seul lot qui *frôle* un contrat
> (workflow `kind`) ne fait que **lire** un champ déjà modélisé et déjà vendoré (v0.26.0/v0.27.0).

---

## 4. Découpage en lots — ordre recommandé + estimations

> Principe : **le plus de valeur pour le moins de casse**, la priorité n°1 en tête, le plus risqué en
> queue. Chaque lot est **livrable et gaté seul** (parité verte à chaque fin de lot).

| # | Lot | Valeur | Réutilise | j-h | Complexité / risque |
|---|---|---|---|---|---|
| **1 — PILOTE** | **Écran d'assemblage « frame = méthode + team (frères) + binding »** | **Priorité n°1** — le récit « frères » | `FrameAssembly`, `resolveAssembly`, contenu de `OpenFramePanel` | **1,5–2,5** | Moyenne / **faible** (data prête) |
| **2** | **Nav à 7 entrées** (`frame·méthode·team·persona·éléments·assemblage·models`) + bouton **New** + **sélection→édition** | Fondation d'IA cible | pattern `useState<Tab>` + `useForgeDocument` ; ateliers existants comme surfaces d'édition | **3–4** | **Haute** / moyen (cycle de doc, routage) |
| **3** | **Sensation réservoir** : `persona` (fiches à vignettes) + `éléments` (réservoir de 1er ordre) | Le « réservoir » cible | `buildElementPool`, `ElementPoolPanel`, `casting.ts` | **2–3** | Moyenne / faible |
| **4** | **Écran `models`** (runner/model/tools par persona) | Complète la nav | `FrameAssignment` + rendu read-only existant | **0,5–1** | Faible / faible |
| **5** | **Workflow agnostique** — surfacer le sélecteur `kind` (pipeline/cycle/flow/cycle-with-gate) | Aligne la création de workflow | `WORKFLOW_KINDS`, `WorkflowAtelier` (data prête) | **0,5–1** | Faible / faible |
| **6** | **Fëanor-en-tête** (assistant : même composant création+édition, dock latéral en vue simple) — **MVP = coquille de dock**, pas d'IA fonctionnelle | Le pattern signature des maquettes | persona Fëanor (donnée), `casting.ts` (flamme) | **2–4** | **Haute** / **inconnues** (voir § 7) |

**Ordre recommandé : 1 → 2 → 3 → 4 → 5 → 6.** Justification : (1) livre la valeur n°1 en isolé et
prouve la tenue de parité sur un lot self-contained ; (2) pose l'IA cible une fois le récit central
acquis ; (3–4–5) remplissent les entrées avec des data déjà prêtes ; (6) en dernier car net-neuf et
porteur d'inconnues. **Total cible ≈ 9,5–15,5 j-h** ; **premier incrément de valeur (Lot 1) ≈ 1,5–2,5
j-h**.

> Si le décideur veut plus court encore : **Lot 1 seul** est un livrable complet et défendable (le récit
> « frères » rendu, parité verte), avant tout engagement sur la refonte d'IA (Lot 2).

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

**Hors périmètre du pilote :** l'édition inline, la nav à 7 entrées, Fëanor, la charte. (Lots suivants.)

---

## 6. Charte — écart réel à trancher

- **Cible (maquettes) : Studio clair.**
- **Existant : `CharteSelector` liste « Cinabre par défaut + NaonEdge »** — **Studio clair n'y est pas
  le défaut** (peut-être absent du registre). Écart **confirmé**.
- **Cohérence méthode** : la règle *charte par défaut contextuelle* (mémoire projet) dit que le défaut
  doit être **Studio clair pour le dev logiciel** — donc la cible est **conforme à la doctrine**, et
  c'est le **registre actuel qui diverge** (défaut Cinabre).
- **Conséquence** : petit lot d'UI (thème) = **adopter Studio clair comme charte par défaut du GUI**
  (ajouter la charte si absente ; basculer le défaut). **Sans impact parité** (thème = `src/`/tokens,
  hors contrats). À rattacher au Lot 2 (la nav) **ou** à traiter en quick-win isolé — **arbitrage
  décideur** (§ 7, fork E). L'exécutant **ne bascule pas le défaut sans arbitrage**.

---

## 7. Arbitrages décideur (forks structurants — NON tranchés ici)

> Gandalf **propose**, le décideur **tranche**. Ces forks engagent l'ampleur et le coût.

- **Fork A — Ampleur de la refonte d'IA (Lot 2).** *(a)* Remplacer d'un coup la coquille à 5
  onglets-documents par la nav à 7 entrées ; *(b)* **superposer progressivement** — garder les ateliers
  existants comme **surfaces d'édition** derrière les nouvelles entrées, migration entrée par entrée.
  **Reco Gandalf : (b)** (réutilise l'existant, MVP, casse minimale). *Décision décideur.*
- **Fork B — Sort du « Kit » et de l'« Apprentissage ».** Les 7 entrées cibles ne comportent ni « Kit »
  ni « Apprentissage ». Le **Kit** doit-il **fondre** dans l'entrée `assemblage` (recommandé — c'est le
  même matériau) ou survivre ailleurs ? L'**Apprentissage** (pilote de `iakaframe review`, hors
  document) doit-il rester **hors nav** (bouton dédié), migrer, ou être retiré du GUI ? *Décision
  décideur.*
- **Fork C — Fëanor-en-tête, jusqu'où maintenant (Lot 6).** *(a)* **Coquille de dock** MVP (présence
  visuelle, même composant création/édition, aucun comportement d'IA) ; *(b)* assistant **fonctionnel**
  (dépasse le MVP, ouvre la question du runner/binding de Fëanor et sort du périmètre « alignement
  visuel »). **Reco Gandalf : (a)** au titre de ce chantier ; *(b)* = chantier séparé à cadrer.
  *Décision décideur.*
- **Fork D — `models` : entrée séparée ou facette de l'assemblage ?** Les maquettes montrent `models`
  comme **7ᵉ entrée** ; le binding `{runner,model,tools}` est aussi une **facette de l'assemblage**.
  Entrée dédiée (fidèle aux maquettes) **ou** onglet interne de l'écran assemblage ? *Décision décideur.*
- **Fork E — Charte Studio clair : quick-win isolé ou dans le Lot 2 ?** (cf. § 6). *Décision décideur.*
- **Fork F — `persona` vs `team`.** Deux entrées distinctes dans les maquettes. La **fiche persona**
  éditable est-elle un **élément de 1er ordre** (`library/personas/`, édité hors team — cohérent avec la
  constitution C-5 « personas = éléments de frame ») ou une **vue dérivée** de la team ? **Reco
  Gandalf : élément de 1er ordre** (fidèle à la constitution + aux maquettes). *Décision décideur.*

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
- **A2 (Lot 2)** : la coquille présente les **7 entrées** ; un bouton **New** ; **sélectionner un
  élément → mode édition**. Les surfaces d'édition réutilisent les ateliers existants (Fork A(b)).
- **A3 (Lot 3)** : l'entrée `persona` rend des **fiches à vignettes** (via `casting.ts`) ; l'entrée
  `éléments` rend le **réservoir** typé (via `buildElementPool`), en 1er ordre.
- **A4 (Lot 4)** : l'entrée `models` rend `{runner, model, tools}` par persona (via `FrameAssignment`).
- **A5 (Lot 5)** : la création de workflow expose le choix de `kind` parmi
  `pipeline/cycle/flow/cycle-with-gate` (via `WORKFLOW_KINDS`) ; un workflow créé se relit à l'identique
  (round-trip `parseWorkflowMd`/sérialiseur inchangés).
- **A6 (Lot 6)** : **Fëanor-en-tête** présent, **même composant** en création ET édition, **dock latéral**
  en vue simple (MVP = coquille, Fork C(a)).
- **A7 (charte, Fork E)** : si tranché, **Studio clair** est la charte **par défaut** du GUI ; aucune
  régression des autres chartes du registre.

---

## 9. Estimation (obligatoire au jalon P1→P2 — ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Lot pilote (1) : 1,5–2,5 j-h.** Chantier cible complet (Lots 1→6) : **≈ 9,5–15,5 j-h**, à engager **par lots gatés** (pas un big-bang). |
| **Complexité / risque** | **Faible** pour les lots présentationnels sur data prête (1, 3, 4, 5) — la parité est tenue **par construction** (§ 3). **Haute** pour la refonte d'IA (2) et Fëanor-en-tête (6). Risque de parité **maîtrisé** tant que les lots restent au-dessus de la ligne des contrats de `packages/core/src/*`. |
| **Inconnues (susceptibles de faire glisser)** | (1) **Maquettes non lues à ce cadrage** — l'écart de détail au pixel est une inconnue jusqu'à A-CONF (noms de fichiers + contenus exacts à confirmer par Gimli). (2) **Ampleur du Lot 2** dépend du Fork A (progressif vs big-bang). (3) **Fëanor-en-tête** (Lot 6) : périmètre fonctionnel non figé (Fork C) — un assistant *fonctionnel* dépasse le MVP et n'est **pas** chiffré ici. (4) **Propreté du dépôt GUI** à vérifier avant de brancher (espace de dev du décideur). (5) **Sort du Kit/Apprentissage** (Fork B) peut ajouter du travail de migration. |

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
