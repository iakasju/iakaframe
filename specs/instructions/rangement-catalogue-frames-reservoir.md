# Instruction — Ranger les 7 frames-brouillons dans le réservoir (briques → library partagée, frame réduite à son assemblage)

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-25), sur décision du décideur portée par Aragorn
> (chantier 3, dernier d'une séquence 1+2+3 : 1 = outillage de forge, 2 = réservoir, 3 = rangement).
> **Lecture seule sur le code pendant le cadrage** ; ce fichier est le seul artefact produit.
> Réf. backlog : *« Catalogue de frames forgé (7) + 3 biais d'architecture »* et *« Outiller le geste
> de forge d'un frame vierge »* (§ « base de démonstration à re-ranger selon le modèle réservoir »).
>
> **Exécutant = 🟠 Fëanor (rôle `frame`), PAS Gimli.** Ranger des frames tierces dans le réservoir
> (écrire dans `library/`, `frames/`, `methods/`, `teams/`, `bindings/`, `kits/`) **est le périmètre
> étanche du rôle `frame`** (`library/roles/frame.md`, `library/personas/feanor.md`). Fëanor s'active
> **sur demande explicite** (`teams/iakaframe-8.md` § « activation explicite »). Gate P2→P3 : 🏹 Legolas.
>
> **Citations par nom de section / de symbole, jamais par `chemin:ligne`.** Tous les constats du § 0
> ont été **mesurés sur le disque le 2026-07-25** dans `~/work/iakaframe` (réservoir, v0.23.0),
> `~/work/frame-scrum` et le corpus de brouillons Fëanor — `preuve-avant-declaration`.
>
> **Faits externes vérifiés (obligation de sourcing).** Deux décisions de dédup dépendent d'un fait de
> domaine — *« retrospective » et « MVP » sont-ils des concepts transverses ou propres à une méthode ?*
> Vérifié sur le web (sources en pied de page) : **l'inspect-and-adapt / la rétrospective est un
> principe agile général** (principe 12 du Manifeste Agile), *mais* la *Sprint Retrospective* est une
> **cérémonie Scrum spécifique** (cadence/timebox propres) ; **le MVP est un concept Lean Startup**
> (Ries 2009, terme forgé par F. Robinson en 2001), central à l'agile en général. Ces deux faits
> **fondent** la règle d'identité du § 3.
>
> ✅ **Arbitrages décideur — TRANCHÉS le 2026-07-25 (tous sur recommandation Gandalf, « reco ok »),
> fermés et gravés** (détail § 8) : (1) dédup **CONSERVATEUR, promotion sur preuve** ; (2) ranger
> **AVANT** correction des 3 biais (frontmatter non canonique = **dette déclarée assumée**, non un
> oubli) ; (3) découpage **pilote Scrum → gate → 6 autres** (MVP-first) ; (4) brouillons **ARCHIVÉS**
> (aucune suppression irréversible dans ce lot). **Exécutant du pilote : 🟠 Fëanor (rôle `frame`).**
>
> 🔒 **INVARIANT CRITIQUE (rappelé en tête, gouverne tout le lot).** Promouvoir une brique dans la
> library partagée **ne touche JAMAIS le default `iakaframe`** : `methods/iakaframe.md`,
> `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md` restent **byte-inchangés**. Une brique
> promue est référencée par les **nouvelles** frames, jamais rétro-injectée dans le default. C'est ce
> qui maintient **`vendor-check` (drift 0) et `frame lint iakaframe` (exit 0) au vert** (A3/A4/A6).

---

## 0. État de référence — mesuré, pas présumé

### 0.1 Le modèle réservoir, tel qu'il tourne (v0.23.0)

- **Une seule `library/` partagée** = 8 pools d'atomes agnostiques : `personas`, `roles`,
  `principles`, `rituals`, `guardrails`, `skills`, `workflows`, `scaffolds` (table `COLLECTIONS`,
  `cli/src/lib/library.js`).
- **Collections d'assemblage à la racine** : `methods/`, `teams/`, `bindings/`, `kits/`, `frames/`
  (plates, résolues par id).
- **Une frame = un descripteur** `frames/<id>.md` — frontmatter `id, name, version, methodId, teamId,
  [default]` (cf. `frames/iakaframe.md`) — qui **pointe** un `methodId` (∈ `methods/`) et un `teamId`
  (∈ `teams/`) ; la chaîne `method → workflow/principles/rituals/guardrails/roles/scaffolds`, `team →
  personas/coordinator`, `binding → runners/tools` **pioche par id dans la library partagée**. Aucun
  corps de brique n'est recopié dans le descripteur (I1/E2).
- Invariant clé : **le default reste monté à la racine** (`methods/iakaframe.md`, `teams/iakaframe-8.md`,
  `bindings/iakaframe-claude-default.md`) — la frame est **logique**, pas un dossier.

### 0.2 L'outillage de rangement existe déjà — c'est son **premier grand usage** (réutilisation exigée)

| Geste | Ce qu'il fait (mesuré) | Rôle dans ce lot |
|---|---|---|
| `add <persona\|role\|principle\|ritual\|guardrail\|skill\|workflow\|scaffold> <id>` | scaffolde un **atome typé** neuf dans la bonne collection de la library partagée, non destructif | poser chaque brique promue |
| `add <team\|method\|binding\|frame> <fichier.md>` | **valide schéma + I1 AVANT écriture** (refuse sans écrire si une réf casse), copie dans la collection | livrer chaque pièce d'assemblage |
| `frame new <id>` | ossature `frames/<id>.md` + `methods/<id>.md` + `teams/<id>-team.md` + `bindings/<id>-default.md` + `kits/<id>-claude.md`, **lint-clean par construction** | point de départ optionnel d'un assemblage |
| `frame lint <id>` / `--all` | valide **tout le graphe** tiré par le descripteur : refs method/team/binding (`checkRefs`), refs **sortantes des atomes de pool** (persona `roleKey`/`skills`/`guardrails`, workflow `agentsRoleKeys`, skill `subskills` + anti-self-ref), **couverture du casting**, **id == nom de fichier**, unicité inter-collections | **critère de recette** par frame |

**Tolérance de schéma (ARB-1, décisive ici).** `frame lint` est **permissif** : les **champs de
frontmatter inconnus sont tolérés sans avertissement**. Les collisions d'id inter-collections et le
`workflowId` catalogue-connu/pool-absent sont des **avertissements** (exit 0), pas des blocages. Le
rangement se fait donc **avec le lint permissif tel quel** — **la canonisation du schéma (Finding 3)
n'est PAS rouverte** (cf. § 8, arbitrage 2).

### 0.3 La forme réelle des 7 brouillons — non conforme au réservoir

Mesuré sur `~/work/frame-scrum` (représentatif ; les 6 autres sont bâtis « par imitation »
selon le même patron, cf. backlog *Catalogue de frames forgé (7)*) :

- **Chaque brouillon porte une `library/` PRIVÉE** (roles/personas/principles/rituals/guardrails/
  skills/workflows/scaffolds) + `methods/<id>.md`, `teams/<id>-team.md`, `bindings/<id>-default.md`,
  `kits/<id>-claude.md`. C'est un **mini-réservoir autonome** — la forme à dissoudre.
- **Aucun brouillon ne porte de descripteur `frames/<id>.md`** (mesuré : `frames/scrum.md` absent).
  Ils **précèdent le type de 1ʳᵉ classe `frame`** (AR-1) : le descripteur est **à créer**.
- **Frontmatter non canonique toléré** : mesuré `side: team`, `vignetteTeam: none`, `origin:`,
  `cadence:`, `timebox:` (ritual `sprint-retrospective`) ; backlog *Finding 3* recense aussi `kind`,
  `nature`, `pillars`, `scope: mode`, `soleActor`, `noBackflow`, `optional`. **Tous tolérés** par le
  lint permissif — on **ne les corrige pas** dans ce lot.

### 0.4 Carte des convergences réelles (le « pot commun émergent »)

Mesurée sur les READMEs de forge + backlog. Les briques qui **désignent le même concept** doivent
devenir **une seule** dans la library partagée, jamais N copies :

| Concept | Occurrences par frame (id local) | État au canon iakaframe |
|---|---|---|
| **Engagement borné dans le temps** | `time-box` (Scrum), `wip-limit` (Kanban), `circuit-breaker`+`fixed-time-variable-scope`+`appetite` (Shape Up) | absent |
| **Inspect-adapt / rétrospective** | `sprint-retrospective` (Scrum), `iteration-loop` (DT), `weekly-review` (GTD), `learning-review`/`pivot-or-persevere` (Lean) | **absent** (iakaframe n'a pas de rétrospective) |
| **MVP** | `mvp` (Lean) | **`mvp-first` PRÉSENT au canon** (`library/principles/mvp-first.md`) → collision |
| **Centré-utilisateur** | `customer-focus` (Scrum/Lean), `user-centered` (DT), `evidence-from-users`, `market-evidence` (Lean) | absent |
| **Definition of Done** | `definition-of-done` (Scrum, Waterfall) | absent |
| Autres spécifiques | `five-whys` (Lean), `next-action`/`two-minute-rule`/`capture-everything`/`inbox-zero` (GTD), `pull-not-push`/`no-backlog`/`explicit-policies` (Kanban), `phase-gate`/`traceability`/`baseline-freeze` (Waterfall), `diverge-before-converge`/`prototype-before-invest` (DT), `bias-toward-action` (Lean) | absent |

---

## 1. Le problème (posé avant la solution)

Sept frames existent, **valides dans leur forme brouillon** (0 id pendant sur 251 fichiers) mais
**hors modèle réservoir** : chacune traîne une `library/` privée, donc **le pot commun est éclaté en
7 copies**. Trois symptômes :

1. **Duplication de concept** : `time-box`, une rétrospective, un « centré-utilisateur » existent en
   3-4 exemplaires quasi identiques — l'inverse du « pot commun ».
2. **Collision avec le canon** : `mvp` (Lean) recouvre `mvp-first` déjà au canon ; livré tel quel, on
   aurait **deux briques pour un concept**, et un risque d'**écrasement du canon**.
3. **Descripteur manquant** : sans `frames/<id>.md`, ces frames ne sont ni listables, ni lintables, ni
   activables par le réservoir.

**Ce que le lot NE résout pas** (et ne doit pas prétendre résoudre) : les 3 biais du modèle
(gouvernance/cardinalité/schéma, backlog *Findings 1-2-3*). Le rangement **compose avec** ces biais via
les contournements de frontmatter déjà présents dans les brouillons ; il ne les **corrige pas** (§ 8).

---

## 2. Modèle cible du rangement (la transformation, pièce par pièce)

Pour **chaque** frame `<id>` rangée :

1. **Ses atomes montent dans la `library/` partagée du réservoir** (`~/work/iakaframe/library/*`), par
   `add <pool> <id>` puis remplissage du corps — **jamais** de sous-dossier `library/` propre à la frame.
   Le nommage suit la **règle d'identité du § 3** (neutre si générique/promue, qualifié si spécifique).
2. **Son assemblage monte à la racine** : `methods/<id>.md`, `teams/<id>-team.md`,
   `bindings/<id>-default.md`, `kits/<id>-claude.md` — chaque pièce livrée par `add method|team|binding`
   (kit par la chaîne `assemble`/`frame new` ou `add`), **ne portant QUE des ids** vers la library
   partagée (aucun corps de brique recopié).
3. **Un descripteur `frames/<id>.md` est créé** : frontmatter `id, name, version, methodId: <id>,
   teamId: <id>-team` (sans `default: true` — le default reste `iakaframe`). Livré par `add frame`.
4. **La `library/` privée du brouillon est dissoute** : une fois ses atomes promus/qualifiés dans le
   réservoir, le mini-réservoir autonome du brouillon n'a plus de raison d'être (cf. A7).
5. **Recette** : `frame lint <id>` → **exit 0**.

> **Invariant de non-régression du default (critique).** Promouvoir une brique neutre (ex.
> `retrospective`) **n'autorise PAS** à modifier `methods/iakaframe.md`, `teams/iakaframe-8.md` ni
> `bindings/iakaframe-claude-default.md`. Le default garde ses références **inchangées** : une brique
> promue est référencée par les **nouvelles** frames, pas rétro-injectée dans le default. (Adopter la
> rétrospective *dans iakaframe* serait une décision distincte, hors périmètre — cf. § 5.) C'est ce qui
> maintient `vendor-check` et `frame lint iakaframe` au vert (A3/A4).

---

## 3. Stratégie de déduplication / promotion — RECOMMANDATION (cœur de l'arbitrage)

### 3.1 Règle d'identité : « est-ce la même brique ? »

Deux atomes locaux désignent **la même brique partageable** — et fusionnent en **une seule brique à id
neutre** — **si et seulement si** les trois conditions tiennent :

1. **Même `type`** (même collection de pool : deux principes, deux rituels…).
2. **Même intention opérante** (même `policy`/`trigger`/`actions` au fond, au-delà du vocabulaire).
3. **Test de neutralité** : *un même texte neutre pourrait-il être référencé par les deux méthodes sans
   induire en erreur le lecteur de l'une ou de l'autre ?* Si **oui** → fusion neutre. Si **non** (une
   méthode a besoin d'une nuance que le texte neutre trahit) → **pas de fusion**.

Le fait web du § en-tête tranche les deux cas litigieux : l'**inspect-adapt** passe le test de
neutralité (principe agile général) → **brique neutre `retrospective`** ; la *Sprint Retrospective*
avec sa cadence/timebox propres **échoue** le test → reste un **rituel qualifié** si Scrum en a besoin.

### 3.2 Trois destinations pour chaque atome local

- **RÉFÉRENCER-CANON** — l'atome est **identique** à une brique **déjà au canon** (§ 3.1) : la frame
  **référence l'id canon existant**, **aucun fichier neuf**, **aucune mutation du canon**. Ex. : Lean
  `mvp` → référence `mvp-first`.
- **PROMOUVOIR-NEUTRE** — l'atome apparaît dans **≥ 2 frames** avec une intention neutre partagée
  (§ 3.1) : **une seule** brique à **id neutre** (copie généralisée, vocabulaire de méthode retiré),
  référencée par toutes. Ex. : `retrospective`, `time-box`, `user-centered`, `definition-of-done`.
- **QUALIFIER** — l'atome est **propre à la méthode** (échoue § 3.1, ou n'apparaît que dans 1 frame) :
  **id préfixé par la frame** (`<frame>-<atome>`), rangé dans la library partagée **à côté** de la
  brique neutre si une existe. Ex. : `scrum-facilitation`, `gtd-two-minute-rule`, `waterfall-baseline-freeze`.

### 3.3 Gestion des collisions

- **Collision avec un id canon existant** : **jamais d'écrasement**. Soit identique → RÉFÉRENCER-CANON ;
  soit nuance requise → QUALIFIER (id préfixé). Le canon est **autoritaire et gelé** dans ce lot.
- **Collision inter-frames** (deux frames castent le **même personnage** — même `name:` d'affichage —,
  ou portent deux atomes de même id local de sens différent) : **ranger sous des ids distincts** —
  l'un peut rester **nu**, l'autre **préfixé** de sa frame (« natif nu / emprunteur qualifié », ex.
  `ohno` natif Kanban / `leanstartup-ohno` emprunteur Lean) — **sans dédup forcée ni renommage du
  personnage**. Les homonymes inter-frames **coexistent légitimement** : un id qualifié est un
  **rangement**, jamais un renommage — le `name:` d'affichage reste **identique des deux côtés**.
  Réf. autorité : `specs/instructions/constitution-modele-de-frame.md` **règle C-5** (« aucune
  déduplication forcée, aucune garde qui pousse à qualifier »). L'avertissement `id-collision` du lint
  reste **toléré** (exit 0) pour les partages délibérés inter-collections, comme au canon.

### 3.4 Politique de dédup — ✅ TRANCHÉ décideur 2026-07-25 : CONSERVATEUR, promotion sur preuve

**Posture DÉFINITIVE (tranchée par le décideur, plus un curseur ouvert) : conservateur, promotion sur
preuve.** On **QUALIFIE par défaut** ; on ne **PROMEUT-NEUTRE que** lorsque les 3 conditions du § 3.1
sont **explicitement vérifiées sur pièces** — c.-à-d. **≥ 2 frames partagent la brique ET le test de
neutralité passe**. À défaut de cette double preuve → **QUALIFIER** (`<frame>-<atome>`). Motifs
(confirmés par le décideur) : (a) **MVP** — une brique faussement « générique » est un piège ; le
conservateur ne promeut que le prouvé ; (b) réversible — qualifier puis promouvoir plus tard est sûr,
l'inverse (fusionner à tort puis re-séparer) casse des références.

La **règle des 3 destinations** du § 3.2 (RÉFÉRENCER-CANON / PROMOUVOIR-NEUTRE / QUALIFIER) est donc
**définitive**, avec **QUALIFIER comme défaut** et PROMOUVOIR-NEUTRE conditionné à la double preuve
ci-dessus. Le curseur « agressif » (une brique canonique par concept, nuances lissées) est **écarté**.

---

## 4. Découpage, pilote et estimation

### 4.1 Frame pilote — ✅ TRANCHÉ décideur : **Scrum**

Pourquoi Scrum et pas une autre :

- **Sur disque à un chemin stable** (`~/work/frame-scrum`, pas dans un scratchpad volatil) et
  **README de forge le plus complet** (candidats de promotion déjà nommés).
- **Grammaire la plus proche d'iakaframe** → moins de contournements de frontmatter à absorber d'un coup.
- **Concentre les convergences partagées** avec les 6 autres : `retrospective`, `time-box`,
  `definition-of-done`, `user-centered`. Ranger Scrum en premier **établit les briques neutres du pot
  commun** que les 6 suivantes n'auront plus qu'à **référencer** — c'est le premier move à plus fort levier.

### 4.2 Ordre des 6 suivantes — ✅ TRANCHÉ décideur (du plus convergent au plus risqué)

`kanban` (WIP ↔ `time-box`) → `lean-startup` (`mvp` ↔ `mvp-first`, `five-whys`, centré-utilisateur) →
`shapeup` (`appetite`/`circuit-breaker` ↔ `time-box`) → `designthinking` (`iteration-loop` ↔
`retrospective`, `user-centered`) → `waterfall` (remplit le format tel quel ; `definition-of-done`,
`phase-gate`) → **`gtd` en DERNIER** (solo N=1 : stresse la cardinalité, *Finding 2* ; risque le plus
haut qu'un atome « générique » se révèle lié à la méthode).

### 4.3 MVP et gate

**MVP = la frame pilote rangée proprement**, gate décideur avant d'engager les 6 autres. « Une frame
pilote rangée proprement vaut mieux que 7 à moitié. » Le pilote **valide le patron** (règle d'identité,
nommage, dissolution de la library privée, recette lint) **et** révèle le volume réel d'atomes par frame
après dédup — inconnu tant que le pilote n'est pas fait.

### 4.4 Estimation (ordre de grandeur assumé, révisable — pas un engagement ferme)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **Pilote Scrum : ~1 j-h** (établit le patron + les briques neutres partagées). **6 frames suivantes : ~0,5 j-h chacune** (patron établi, réutilisation des briques neutres) = ~3 j-h. **Total spec fermée : ~4 à 5 j-h.** |
| **Complexité / risque** | **MOYEN.** Faible sur la mécanique (outillage prêt, lint permissif) ; le risque est **de jugement** : la dédup (§ 3) et la découverte d'un « générique » qui ne l'est pas. `gtd` (N=1) = la frame la plus risquée à elle seule. |
| **Inconnues susceptibles de faire glisser** | *(La politique de dédup est désormais TRANCHÉE — § 8-1 — donc n'est plus une inconnue.)* (1) l'application de la règle de neutralité (§ 3.1) frame par frame demande un **jugement sur pièces** non automatisable → coût variable selon le nombre de promotions réellement prouvées ; (2) `gtd` solo range-t-il proprement sous lint permissif, ou heurte-t-il *Finding 2* au point d'exiger un contournement lourd ? ; (3) combien d'atomes réels par frame après dédup (borné seulement après le pilote) ; (4) localisation des 6 brouillons de scratchpad à confirmer avant exécution (chemins volatils). |

---

## 5. Périmètre — fermé

**DANS le périmètre** : créer/promouvoir/qualifier les atomes des 7 frames dans `library/*` partagée ;
créer leurs assemblages (`methods/`, `teams/`, `bindings/`, `kits/`) et descripteurs (`frames/`) au
réservoir ; dissoudre les `library/` privées des brouillons ; **frame pilote Scrum d'abord, gate, puis
les 6 autres**. Écriture par l'outillage (`add <pool>`, `add <assemblage>`, `frame lint`, éventuellement
`frame new`).

**HORS périmètre** (déclaré des deux côtés) :

- **Corriger les 3 biais du modèle** (gouvernance/cardinalité/schéma, *Findings 1-2-3*) — on **range
  avec** les contournements, on ne canonise pas le schéma (§ 8-2).
- **Modifier le default `iakaframe`** (method/team/binding/kit) — y compris **lui adopter** une brique
  promue (ex. rétrospective) : décision distincte, non prise ici (§ 2, invariant de non-régression).
- **Le miroir `frames/releases/StefFrame2/`** (gelé, backlog A14) et la bascule de frame par le user
  (backlog séparé).
- **Toute écriture de code de production, de test, de config** ou de doc utilisateur.

---

## 6. Dépendances

- **`specs/instructions/reservoir-de-frames.md`** — modèle réservoir (library partagée + N assemblages,
  type `frame` 1ʳᵉ classe, descripteur = ids seulement). **Doit être livré/mergé** avant ce lot.
- **`specs/instructions/outillage-forge-frame.md`** — `add <pool>`, `add frame`, `frame lint`,
  `frame new` (le canal d'écriture de ce lot). **Doit être livré/mergé** (l'est en v0.22.0 d'après backlog).
- **Rôle/persona `frame` (Fëanor)** — l'exécutant (`role-frame-builder.md`, livré v0.23.0).
- **Corpus des 7 brouillons** : `~/work/frame-scrum` (confirmé) + 6 sous scratchpad Fëanor
  (`frame-kanban`, `frame-shapeup`, `frame-designthinking`, `frame-leanstartup`, `frame-waterfall`,
  `frame-gtd`) — **chemins volatils à re-localiser avant exécution** (inconnue § 4.4-4).

---

## 7. Critères d'acceptation (numérotés, mesurables)

Recette **du pilote** (MVP), puis répliquée par frame :

- **A1 — pilote lint vert** : `iakaframe frame lint scrum` → **exit 0**, 0 finding bloquant.
- **A2 — lint global vert** : après chaque frame rangée, `iakaframe frame lint --all` → **exit 0**
  (les frames rangées **et** `iakaframe`).
- **A3 — non-régression du canon (default)** : `iakaframe frame lint iakaframe` → **exit 0 inchangé** ;
  `git diff` sur `methods/iakaframe.md`, `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md`,
  `kits/iakaframe-claude.md` = **vide**.
- **A4 — vendor-check inchangé** : `iakaframe vendor-check` → **OK, drift 0** (18 copies + 4 dérivées),
  exit 0, avant/après.
- **A5 — dédup vérifiable** : pour chaque brique **PROMUE-NEUTRE**, il existe **exactement un** fichier
  dans la library partagée (aucune copie), et elle est **référencée par ≥ 1 assemblage de frame**. Aucun
  atome à **vocabulaire de méthode** (« sprint », « pivot »…) ne porte un **id neutre**.
- **A6 — canon non muté** : aucun fichier d'atome **canon préexistant** de `library/*` n'est modifié
  (`git diff` limité à des **ajouts** de fichiers + les nouveaux assemblages/descripteurs).
- **A7 — library privée dissoute** : chaque frame rangée **ne conserve aucun sous-dossier `library/`
  propre** ; ses atomes vivent **uniquement** dans la library partagée. Le descripteur `frames/<id>.md`
  existe et ne porte que des ids.
- **A8 — canal outillage** : chaque brique/assemblage est **posé via `add`/`frame lint`** (réutilisation
  exigée) ; aucune écriture « à la main » contournant la validation `add` (schéma + I1 avant écriture).
- **A9 — id == nom de fichier partout** (imposé et vérifié par le lint, tout document du graphe).
- **A10 — suite CLI verte, zéro dépendance runtime nouvelle** : `npm test` (CLI) au vert, aucune
  dépendance ajoutée.
- **A11 — collision canon sans écrasement** : `mvp` (Lean) **référence** `mvp-first` (aucun fichier
  `mvp.md` neuf) ; toute autre collision avec un id canon suit RÉFÉRENCER-CANON ou QUALIFIER (§ 3.3).

---

## 8. Arbitrages décideur — ✅ TOUS TRANCHÉS le 2026-07-25 (sur recommandation Gandalf)

> Les 4 arbitrages ci-dessous étaient soumis au décideur ; il les a **tous fermés le 2026-07-25 sur la
> recommandation Gandalf** (« reco ok »). Ils sont **gravés, non rouverts**. Plus aucun n'est ouvert.

1. **✅ TRANCHÉ — Politique de dédup : CONSERVATEUR, promotion sur preuve (§ 3.4).** Une brique ne monte
   en canon partagé (PROMOUVOIR-NEUTRE) que si **≥ 2 frames la partagent ET le test de neutralité passe**
   (§ 3.1) ; **sinon QUALIFIER** (`<frame>-<atome>`). La **règle des 3 destinations** (§ 3.2) est
   **définitive**, QUALIFIER par défaut. Le curseur « agressif » est **écarté**.
2. **✅ TRANCHÉ — Ranger AVANT correction des 3 biais (Findings 1-2-3).** Le rangement se fait
   **maintenant**, sans attendre la correction du modèle. Les champs de frontmatter non canoniques que
   les brouillons portent (`kind`, `scope: mode`, `soleActor`, `side`, `noBackflow`, `pillars`…) et que
   le **lint permissif tolère** (ARB-1) sont une **DETTE DÉCLARÉE ET ASSUMÉE — pas un oubli** : elle est
   **à solder quand les 3 biais seront corrigés** (chantier séparé, *Finding 3* = schéma typé). Motifs
   gravés : le réservoir peuplé de contenu réel prime sur un schéma parfait sur réservoir vide ; les
   contournements sont déjà présents et tolérés ; le rangement **produit la preuve** qui pilotera la
   future correction (corriger d'abord serait spéculatif).
3. **✅ TRANCHÉ — Découpage : pilote Scrum → gate → 6 autres, MVP-first.** Scrum rangé et **gaté**
   d'abord (établit le patron + les briques neutres partagées), puis, dans cet ordre :
   **kanban → lean-startup → shapeup → designthinking → waterfall → gtd** (§ 4.1-4.2). MVP = le pilote
   rangé proprement.
4. **✅ TRANCHÉ — Brouillons : ARCHIVER, rien de supprimé.** Les répertoires brouillons
   (`~/work/frame-scrum`, scratchpad Fëanor) sont **archivés** (référence de forge conservée) **jusqu'à
   ce que les 7 soient rangées ET gatées**. **Aucune suppression irréversible n'est faite dans ce lot** :
   la suppression éventuelle sera **tranchée ensuite**, une fois le rangement complet validé.

---

## 9. Risques et défauts relevés (dits franchement)

- **« Générique qui ne l'est pas vraiment » (le risque central).** Le brief l'anticipe : un atome
  candidat à la promotion peut se révéler, à l'inspection, lié à sa méthode (ex. `weekly-review` GTD
  n'est *pas* une rétrospective d'équipe — c'est une revue **solo hebdomadaire** ; les fusionner en un
  `retrospective` neutre trahirait GTD). La règle d'identité du § 3.1 (test de neutralité) est le
  garde-fou ; mais chaque promotion **exige un jugement sur pièces**, non automatisable — c'est pourquoi
  le pilote **doit** précéder l'engagement des 6.
- **A5 (« aucun id neutre à vocabulaire de méthode ») est partiellement machine-vérifiable seulement.**
  Un `grep` attrape le vocabulaire flagrant ; la justesse **sémantique** d'une fusion (le § 3.1 tenu ou
  non) repose sur la **relecture au gate**, pas sur une suite verte. À porter à l'attention de Legolas.
- **Cardinalité GTD (N=1, Finding 2).** Le casting solo fait dégénérer `coordinator`/`personas`/
  `roleKeys`. Le lint **couvre** le cas (un rôle non couvert dédié est pris par le coordinateur), donc
  `frame lint gtd` peut sortir 0 **malgré** la dégénérescence — mais le résultat rangé portera les
  contournements `scope: mode`. Conforme à l'arbitrage 8-2 (dette déclarée), à surveiller.
- **Volume d'atomes inconnu avant le pilote** : l'estimation § 4.4 est bornée par le nombre réel
  d'atomes distincts **après** dédup, mesurable seulement une fois Scrum rangé. D'où le gate pilote.

---

## Sources (faits externes vérifiés — obligation de sourcing)

- Inspect-and-adapt comme principe agile général vs Sprint Retrospective cérémonie Scrum :
  [Scrum.org — What is a Sprint Retrospective](https://www.scrum.org/resources/what-is-a-sprint-retrospective),
  [Atlassian — Agile ceremonies & scrum meetings](https://www.atlassian.com/agile/scrum/ceremonies),
  [Wrike — Scrum inspect and adapt events](https://www.wrike.com/scrum-guide/faq/what-are-scrum-inspect-adapt-events/).
- MVP, origine Lean Startup et portée générale :
  [Lean Startup Co. — What is an MVP (Eric Ries)](https://leanstartup.co/resources/articles/what-is-an-mvp/),
  [Agile Alliance — MVP glossary](https://agilealliance.org/glossary/mvp/),
  [Atlassian — Minimum Viable Product](https://www.atlassian.com/agile/product-management/minimum-viable-product).
</content>
</invoke>
