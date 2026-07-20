# Vocabulaire des rôles — agnosticisme de méthode (re-cadrage de CH-A)

> Instruction de cadrage (Gandalf, P1). **Lecture seule** sur les deux dépôts ; ce fichier est le
> seul artefact produit. Elle **remplace le périmètre de CH-A** tel que porté par
> `audit-amelioration-roster-personas.md` et par `decision-rolekey-reconciliation.md`. En cas de
> contradiction avec ces deux fichiers, **la présente instruction prime** (§ 1.6).
>
> ⚠️ **Elle ne remplace pas leur valeur de trace.** Les faits qu'ils établissent restent vrais ;
> c'est leur **direction** qui est rouverte, sur contrainte neuve du décideur.

---

## 0. ÉTAT DE RÉFÉRENCE — mesuré sur `main` (rectifié)

> ⚠️ **Ce § a été RÉÉCRIT.** Sa première rédaction décrivait l'état des répertoires de travail
> **alors positionnés sur la branche du lot suspendu**, et elle avertissait de ne pas confondre.
> L'avertissement était juste mais **insuffisant** : plusieurs de mes propres constats (§ 2.3, § 2.4)
> avaient été mesurés sur cette branche. Les deux dépôts sont depuis revenus sur `main` ; **tout ce
> qui suit est re-mesuré sur `main`** (`preuve-avant-declaration`), et les §§ concernés sont corrigés.

**Le canon réel, sur `main` — vérifié fiche par fiche :**

| Porteur | Vocabulaire porté sur `main` | Accord |
|---|---|---|
| `library/personas/*.md` (`roleKey`) | `portefeuille`, `coordination`, `cadrage`, `dev`, `qualite`, `deploiement`, `design`, `documentation` | — |
| `library/roles/*.md` (`key`) | **les mêmes 8 clés**, une fiche chacune | ✅ **8/8** |
| `methods/iakaframe.md` (`roleKeys`) | **les mêmes 8 clés**, dans l'ordre des `roleIndex` | ✅ **8/8** |
| `cli/src/lib/agents.js` (`ROLE_OF`) | `architecture`, `fabrication`, `tests`, `graphisme`, `doc` ; `helm → coordination` | ❌ **6/8 divergents** |
| `packages/core/src/roles.ts` (`CANONICAL_ROLES`) | 7 rôles, vocabulaire CLI, **pas de `deploiement`** | ❌ |

### 0.1 Le renversement — l'énoncé fondateur de l'audit était **à l'envers**

L'audit fonde sa présomption sur : « **le canon est le seul à être en désaccord** ; le CLI et le
cœur GUI utilisent le même vocabulaire ». Mesuré sur `main`, avec les porteurs 2 et 3 au tableau,
l'énoncé exact est l'**inverse** :

> **Trois des quatre porteurs de la méthode s'accordent déjà parfaitement, 8/8** — personas,
> référentiel de rôles, méthode. Les **deux tables codées** (`ROLE_OF`, `CANONICAL_ROLES`) sont les
> **seules** en désaccord.

Ce n'est pas une nuance : c'est le **motif entier** de l'arbitrage du 2026-07-19 qui tombe. Faire
céder le canon se justifiait par « il est seul contre trois, donc il a dérivé ». Il est en réalité
**trois contre deux**, et les deux dissidents sont précisément ceux dont le décideur vient de dire
qu'ils n'ont pas voix au chapitre. Le compte avait été fait sur un inventaire incomplet — celui-là
même que la note R.2 avait commencé à corriger sans aller au bout.

### 0.2 Conséquence sur la rupture I1 — élucidée

Ma première rédaction laissait ouverte la question de la rupture I1 signalée au brief (5 références
mortes, 370 tests verts). **Elle est désormais explicable sans recours à git** : sur `main`,
`library/roles/` porte `cadrage.md`, `dev.md`, `qualite.md`, `design.md`, `documentation.md`.
Renommer `methods/iakaframe.md` vers le vocabulaire CLI **sans renommer les fiches de rôles** produit
donc **exactement 5 références mortes** — le compte annoncé, au fichier près. Le mécanisme est
confirmé, et l'hypothèse « rupture transitoire » est la bonne.

> **Ce qui reste entier, et c'est l'essentiel** : rien n'a rendu la rupture visible. Le défaut que le
> lot devait corriger s'est reproduit **pendant** le lot, sur un porteur non inventorié, sous
> 370 tests verts.

---

## 1. La prémisse — validation, correction, et sa portée

### 1.1 La contrainte du décideur — **D-1 TRANCHÉ**

> « Le vocabulaire de la GUI doit être **agnostique de la frame et de la méthode** : **on encadre
> mais on ne force pas.** »
>
> « Je pense que les rôles doivent être des **éléments de la méthode**. » *(D-1, tranché)*
>
> « Si il faut, on peut autoriser qu'il soit **obligatoire d'assigner le rôle de coordinateur à un
> persona**, comme **seule obligation**. » *(la borne, § 1.4)*

**D-1 est tranché dans une forme plus forte que la lecture soumise**, et l'écart mérite d'être
nommé : « le cœur n'impose pas les valeurs » est une **interdiction** ; « les rôles sont des éléments
de la méthode » est une **appartenance**. La première laissait ouverte la question de savoir où le
vocabulaire vit ; la seconde y répond. Le rôle prend rang de constituant, au même titre qu'un
principe, un rituel ou un garde-fou — avec les mêmes devoirs de déclaration, de résolution et de
composition (§ 1.5).

Mes deux corrections (§ 1.2) **survivent et s'y intègrent** : les invariants structurels relèvent de
la forme ; le cœur peut porter des défauts tant qu'ils ne rejettent, ne tronquent ni ne dégradent une
valeur venue de la méthode chargée. La borne du § 1.4 en restreint toutefois la portée **bloquante**.

### 1.2 La lecture proposée — **validée sur le fond, corrigée sur deux points**

La lecture soumise (« la GUI a le droit d'exiger la **forme**, pas les **valeurs** ») est **juste et
opérante**. Je la retiens comme axe. Elle demande **deux corrections**, sans lesquelles elle
produirait des critères impossibles à tenir.

**Correction 1 — « forme » ne se limite pas à l'existence d'un champ ; elle inclut les invariants
structurels.** Exiger qu'un `roleKey` existe est le plancher, pas le plafond. La GUI a **aussi** le
droit d'exiger que les `roleIndex` d'un référentiel chargé soient **uniques et sans trou**, que tout
`roleKey` référencé par une méthode **résolve** vers un rôle du référentiel (c'est I1, déjà
implémentée des deux côtés), qu'un rôle déclaré soit **couvert** par le casting. Ce sont des
propriétés **relationnelles**, pas des valeurs — elles restent vraies pour BMAD comme pour
iakaframe. Sans cette correction, on interdirait à la GUI toute vérification utile, et « on encadre »
perdrait son sens.

**Correction 2 — le cœur a le droit de porter des valeurs *par défaut*, à condition qu'elles soient
remplaçables et jamais opposables.** La contrainte n'interdit pas un gabarit de démarrage ; elle
interdit qu'un gabarit fasse **loi**. La ligne exacte, et c'est elle qu'il faut rendre vérifiable :

> **Une valeur codée dans le cœur ne doit jamais pouvoir causer le REJET, la TRONCATURE ou la
> DÉGRADATION d'une valeur venue de la méthode chargée.**

C'est plus fort que « pas de valeurs dans le cœur », et surtout **c'est testable**. Un gabarit
proposé au moment de créer une méthode *ex nihilo* est légitime. Une liste fermée contre laquelle on
valide un rôle chargé ne l'est pas. Une palette indexée sur 8 positions qui replie silencieusement
le 9ᵉ rôle sur le 1ᵉʳ ne l'est pas non plus — c'est une **dégradation** (§ 4.3).

### 1.4 La borne — **une seule obligation opposable**

> La forge n'a qu'**une seule contrainte opposable** à une méthode chargée : **qu'un coordinateur
> soit assigné à un persona**. Tout le reste — cardinal, clés, libellés, index, ordre — appartient à
> la méthode.

C'est la réponse au critère **C1b**, et c'est la définition de frontière que je cherchais à rendre
vérifiable. Les deux précisions du coordinateur sont **exactes, je les valide** :

**1. L'obligation est STRUCTURELLE, jamais LEXICALE.** Elle porte sur « un persona tient le rôle de
coordinateur », **jamais** sur la chaîne `"coordination"`. La désignation existe déjà en donnée
(`teams/iakaframe-8.md` porte `coordinator: aragorn`) et le CLI s'en sert déjà
(`hasCoordinator` dans `assemble`). **La contrainte se vérifie donc sans que le cœur connaisse le
moindre nom de rôle** — elle est nativement agnostique. C'est le même point que F-8, vu par l'autre
bout : `p.roleKey === "coordination"` n'est pas seulement une règle codée fausse pour BMAD, c'est une
**réimplémentation fautive d'une donnée qui existe déjà**.

**2. « Seule obligation » est une borne SUPÉRIEURE, opposable à mes propres critères.** J'ai repassé
F-1..F-10 et C1a/C1b à cette aune. Verdict honnête :

| Critère | Verdict à l'aune de la borne |
|---|---|
| **F-1..F-10** | ✅ **conformes** — ils décrivent tous ce que la forge **ne doit pas** faire (rejeter, filtrer, normaliser, présumer un cardinal, dégrader). Aucun n'ajoute d'obligation à la méthode. |
| **C1a** | ✅ **conforme** — il porte sur la cohérence **interne d'iakaframe**, dans le dépôt `iakaframe`. Il n'est opposé à aucune méthode chargée. |
| **C1b** | ✅ **reformulé par la borne elle-même** — il devient : *aucune contrainte opposable hors celle du coordinateur*. |
| **Unicité / contiguïté des `roleIndex`** | ⚠️ **excédait le mandat en tant que critère bloquant** → rétrogradé en **avertissement** (§ 4.3). |
| **Intégrité référentielle I1** (`method.roleKeys` ⊆ `roles`) | ⚠️ **cas litigieux → point décideur D-6** (§ 7). |

**Sur I1, je remonte plutôt que de glisser** — c'est exactement ce que le coordinateur demande. I1
est **déjà implémentée et bloquante des deux côtés** (`checkRefs` CLI, `refs.ts` GUI). La rétrograder
n'est pas neutre : c'est elle qui a failli attraper la rupture du lot suspendu.

> **Mon argument pour la conserver bloquante** : I1 n'est **pas une contrainte sur le vocabulaire de
> la méthode**, c'est une contrainte sur la **cohérence de la méthode avec elle-même**. Une méthode
> qui référence un rôle qu'elle ne déclare pas est cassée **selon ses propres termes**, pas selon les
> nôtres — la forge ne lui impose aucune valeur, elle lui signale qu'elle se contredit. C'est
> catégoriquement différent de « ce rôle n'est pas dans ma liste ». **Mais l'énoncé du décideur dit
> "seule obligation", et je ne m'autorise pas à décider qu'il ne le pensait pas.** → **D-6**.

### 1.5 Cohérence avec le modèle (a)-(f) — **le défaut est plus large que les rôles**

Le coordinateur demande de vérifier que les rôles suivent le **même mécanisme** que les autres
constituants, une asymétrie valant défaut de modèle. **Vérifié — et le résultat est double.**

**Constat 1 — le trou soupçonné existe, et il est spécifique aux rôles.** Les 8 types d'atomes de
pool ont un parseur dédié dans le cœur (`parsePersona`, `parsePrinciple`, `parseRitual`,
`parseScaffold`, `parseWorkflow`) — **sauf `roles`**, dont `poolAtomId` n'extrait que la clé
(`str(data.key) ?? str(data.id)`) et **jette `label` et `roleIndex`**. Or `roles` est le seul type de
pool dont la charge utile porte de l'**affichage** (`label`) et de l'**ordonnancement** (`roleIndex`).
L'asymétrie est donc réelle, et c'est bien ce trou-là : **`parseRole` est la pièce manquante** (poste
A1).

**Constat 2 — mais le défaut de fond n'est PAS propre aux rôles, et je dois le dire.** Tous les
constituants du modèle portent un **catalogue codé en dur** dans le cœur : `CATALOG_PRINCIPLES`,
`CATALOG_RITUALS`, `CATALOG_GUARDRAILS`, `CATALOG_SCAFFOLDS`, `WORKFLOW_CATALOG`, `CATALOG_SKILLS`.
Pire, `method.ts` documente en toutes lettres que **les ids inconnus sont filtrés à la résolution** :

> `principlesForMethod` / `ritualsForMethod` / `scaffoldsForMethod` → `.filter(… !== undefined)`

**C'est une TRONCATURE de valeurs venues de la méthode chargée** — la violation exacte que D-1
interdit, appliquée aux principes, rituels et scaffolds. Une méthode BMAD chargée verrait ses
principes **silencieusement disparaître** de l'affichage.

> **Conséquence de cadrage, et elle est inconfortable** : les rôles ne sont pas le défaut, ils en
> sont **l'instance la plus visible**. Le modèle (a)-(f) est hardcodé dans le cœur **sur ses six
> constituants**. Traiter les rôles seuls livre un cœur agnostique **sur un sixième** de la méthode.
> Je **maintiens néanmoins le périmètre aux rôles** — c'est l'instance mûre, celle qui bloque, et
> celle dont la voie de chargement existe déjà — mais je refuse de laisser croire que le chantier
> sera clos. → **D-7** (§ 7).

**Ce que le lot doit livrer pour que la suite soit peu coûteuse** : `parseRole` et le mécanisme de
résolution « référentiel chargé sinon gabarit » doivent être écrits comme le **patron** applicable
aux cinq autres constituants, pas comme un cas particulier des rôles. C'est un critère de conception,
pas un vœu → **F-9** (§ 4.2).

### 1.6 Portée — ce que la contrainte renverse

L'arbitrage du 2026-07-19 (§ 13.2 de l'audit) faisait **céder le canon** au motif de coût, en
assumant explicitement de « plier la source de vérité à son implémentation ». Cette direction a été
rendue **avant** la contrainte d'agnosticisme, et elle est désormais **sans objet plutôt que
fausse** : elle répond à la question « lequel des deux vocabulaires gagne ? », alors que la
contrainte dit que **le cœur ne doit porter aucun des deux comme loi**. Aligner `cadrage` sur
`architecture` ou l'inverse revient à choisir la couleur d'un mur qu'on va démolir.

**Et son motif factuel est tombé indépendamment** (§ 0.1) : il reposait sur « le canon est seul
contre trois », alors qu'il est **trois contre deux**, les deux dissidents étant les tables codées.
La direction était donc adossée à un compte inexact **en plus** d'être caduque.

> **Ce qui précède ne remet en cause ni la compétence ni la bonne foi de l'arbitrage rendu.** Il a
> été rendu sur un jeu de contraintes qui ne contenait pas celle-ci, et sur un inventaire de porteurs
> qui était incomplet des deux plus décisifs. C'est la contrainte qui est neuve — et l'inventaire qui
> était faux.

### 1.7 Rattachement — ce lot **implémente une décision de 2026-07-14**

Ce cadrage n'est **pas une initiative isolée**, et son motif change en conséquence. Le backlog
portefeuille (`~/work/BACKLOG.md`) porte, au titre du cadrage du **2026-07-14** « **Modèle Méthode
élargi + séparation Méthode/Team** », la composition de la Méthode en six constituants :

> (a) scaffold · (b) workflow · (c) assemblage de principes · (d) rituels/gestes · (e) gardes-fous ·
> **(f) référentiel de rôles**

**Le référentiel de rôles est donc un constituant de la Méthode depuis six jours.** D-1 ne tranche
pas du neuf : **il rejoint une décision déjà prise et jamais implémentée**.

**Trois conséquences, à ne pas perdre :**

1. **`CANONICAL_ROLES` n'est pas seulement un doublon codé — c'est la violation d'un modèle déjà
   arbitré**, restée invisible faute d'implémentation. Le lot cesse d'être une amélioration pour
   devenir une **mise en conformité**.
2. **La priorité monte**, et le motif se simplifie : on n'argumente plus une direction, on exécute un
   modèle. C'est aussi ce qui **évite un troisième arbitrage** sur la même question — le point
   décideur D-2 s'en trouve dissous (§ 3.3).
3. **Ce lot est une implémentation PARTIELLE** du modèle (a)-(f) : il livre (f), et laisse (a)-(e)
   dans le même défaut (§ 1.5, D-7). Le dire évite qu'on lise sa clôture comme celle du modèle.

> **Convergence à trois voix sur `library/roles/`** — l'intuition de Gimli, la preuve indépendante du
> § 2.2 (c'est déjà l'autorité référentielle des deux côtés) et le modèle du 2026-07-14 désignent le
> **même** endroit. Quand trois chemins distincts aboutissent au même point, la question n'est plus
> ouverte.

---

## 2. Faits établis — les porteurs du vocabulaire (inventaire refait)

L'audit en listait 3, puis 5 (note R.2), le brief en signale un 6ᵉ. **L'inventaire ci-dessous en
compte 8**, tous vérifiés sur le disque.

| # | Porteur | Nature | Vocabulaire porté |
|---|---|---|---|
| 1 | `library/personas/*.md` (`roleKey`) | **donnée**, bibliothèque | 1 clé par persona |
| 2 | `library/roles/*.md` (`key`, `label`, `roleIndex`, `scope`) | **donnée**, bibliothèque | **le référentiel — 8 fiches** |
| 3 | `methods/iakaframe.md` (`roleKeys`) | **donnée**, bibliothèque | le jeu requis par la méthode |
| 4 | `cli/src/lib/agents.js` — `ROLE_OF`, `SKILL_OF` | **code** CLI | table persona→rôle→skill |
| 5 | `packages/core/src/roles.ts` — `CANONICAL_ROLES` | **code**, cœur GUI | liste **fermée**, clés + labels FR |
| 6 | `packages/core/src/roster.ts` — `DEFAULT_NAMES`, `DEFAULT_SKILLS` | **code**, cœur GUI | rôle→nom Tolkien, rôle→skill `iakaframe-*` |
| 7 | `src/forge/casting.ts` — `CASTING_GRADIENTS` | **code**, app GUI | palette indexée sur les rôles iakaframe |
| 8 | `packages/core/src/frame.ts` — collection `roles` + `poolAtomId` | **code**, cœur GUI | **le chargeur** — lit `library/roles/` |

### 2.1 Le fait structurant, jamais énoncé : **la GUI porte DÉJÀ deux vocabulaires en parallèle**

C'est la découverte de ce cadrage, et elle change la nature du chantier.

- **Une voie chargée, agnostique, déjà livrée.** `roles` est l'un des **8 types d'atomes de pool**
  (`frame.ts`, `POOL_FRAME_TYPES`), il est dans l'allow-list de lecture Rust
  (`src-tauri/src/library_store.rs`), exposé au front (`src/api/backend.ts`), affiché par le
  réservoir (`reservoir.ts`) et **contrôlé en intégrité** (`src/forge/refs.ts` — `needEach("roleKeys",
  method.roleKeys, roles, "roles")`). Un frame quelconque peut donc **déjà** livrer son propre
  référentiel de rôles, et la GUI le charge, le compte et le valide.
- **Une voie codée, iakaframe-only, qui gouverne l'UI.** `CANONICAL_ROLES` est une liste **fermée**
  qui alimente les menus déroulants de `PersonaEditor`, `WorkflowAtelier` (3 occurrences),
  le rail « Référentiel de rôles » de `MethodeAtelier`, le vocabulaire du copilote
  (`src/forge/llm/prompt.ts`), le gabarit `method.ts` (`roleKeys: [...CANONICAL_ROLE_KEYS]`), le
  roster et l'indexation du casting.

> **Le chantier n'est donc pas « rendre la GUI agnostique » — il est de RACCORDER l'UI à la voie
> agnostique qui existe déjà, et de rétrograder la liste codée au rang de gabarit.** C'est une
> réduction de périmètre substantielle par rapport à ce qu'on aurait cadré sans ce constat.

**Une seule pièce manque à la voie chargée** : `poolAtomId` n'extrait d'un atome `roles` que sa
**clé** (`str(data.key) ?? str(data.id)`) — le `label` et le `roleIndex` sont **lus puis jetés**. Il
n'existe **aucun `parseRole`** dans le cœur, alors que `personas`/`principles`/`rituals`/`scaffolds`/
`workflows` en ont un. C'est exactement la pièce dont l'UI a besoin pour afficher un rôle étranger.

### 2.2 `library/roles/` — l'endroit légitime, l'intuition de Gimli est **confirmée**

Elle l'est par une preuve indépendante de toute considération de design : `library/roles/` est
**déjà l'autorité référentielle** des deux côtés.

- Côté CLI : `cli/src/lib/library.js` — `needEach('roleKeys', data.roleKeys, 'roles')`. Une méthode
  ne peut déclarer que des rôles **présents dans `library/roles/`**.
- Côté GUI : `src/forge/refs.ts` fait **le même contrôle**, contre la collection chargée.

Autrement dit : le référentiel de rôles est **déjà une donnée de bibliothèque, déjà chargeable, déjà
validée**. `CANONICAL_ROLES` n'est pas *une* source parmi d'autres — c'est un **doublon codé** d'une
donnée qui existe. Il n'y a pas de choix d'architecture à faire ; il y a un doublon à supprimer.

### 2.3 L'indexation — **table rectifiée** (mesurée sur `main`)

> ⚠️ **Rédaction précédente ERRONÉE.** Elle affirmait que « les clés concordent 8/8 entre
> `library/roles/` et le cœur GUI » — c'était vrai **sur la branche suspendue**, faux sur `main`.
> Table refaite fiche par fiche.

| Clé (canon `main`) | `library/roles/*.md` | `roles.ts` (cœur GUI, `main`) |
|---|---|---|
| portefeuille | 1 | 0 |
| coordination | 2 | 1 |
| **cadrage** | **3** | *(absent — le cœur porte `architecture`)* |
| **dev** | **4** | *(absent — `fabrication`)* |
| **qualite** | **5** | *(absent — `tests`)* |
| **deploiement** | **6** | **absent du cœur** *(7 rôles seulement)* |
| **design** | **7** | *(absent — `graphisme`)* |
| **documentation** | **8** | *(absent — `doc`)* |

**Ce que la rectification change — deux points, et le second est important :**

1. **La divergence n'est pas d'index, elle est de clés.** Sur `main`, 6 des 8 clés du cœur GUI
   n'existent pas dans la bibliothèque et réciproquement. L'écart d'index est un **sous-produit** de
   deux listes différentes, pas un défaut autonome.
2. **`deploiement` n'a jamais été un « 8ᵉ rôle » à promouvoir.** Dans la bibliothèque, il porte
   `roleIndex: 6` — **6ᵉ rôle de plein droit**, entre `qualite` et `design`, exactement comme dans
   `methods/iakaframe.md`. Le récit de « promotion d'un 8ᵉ rôle » (§ 13.5 de l'audit, `roleIndex: 7`)
   était un **artefact de la liste à 7 du cœur GUI** — on a pris le trou d'une table codée pour une
   lacune de modélisation de la méthode. La méthode, elle, modélisait le déploiement depuis le début.

> **`library/roles/` est cohérent avec lui-même et avec la méthode** : ses 8 `roleIndex` sont
> **1..8, sans trou ni doublon**, et leur ordre est **exactement** celui de la ligne `roleKeys` de
> `methods/iakaframe.md`. C'est le porteur le plus propre des huit — et c'est celui que personne
> n'avait inventorié.

### 2.4 Le motif factuel n° 1 de l'arbitrage — **RENVERSÉ, pas seulement incomplet**

> ⚠️ **Rédaction précédente à corriger.** Elle concluait que le motif « n'était pas faux, mais
> incomplet dans un sens qui renforçait sa conclusion ». **Mesuré sur `main`, il est faux.**

L'audit fondait sa présomption sur : « le canon est le seul à être en désaccord ; le CLI et le cœur
GUI utilisent le même vocabulaire ». Le décompte réel sur `main` (§ 0.1) :

| Camp | Porteurs | Vocabulaire |
|---|---|---|
| **La méthode — 3 porteurs, accord parfait** | `library/personas/*.md`, `library/roles/*.md`, `methods/iakaframe.md` | `cadrage`, `dev`, `qualite`, `design`, `documentation`, `deploiement`… |
| **Les tables codées — 2 porteurs** | `ROLE_OF` (CLI), `CANONICAL_ROLES` (cœur GUI) | `architecture`, `fabrication`, `tests`, `graphisme`, `doc` |

**Le canon n'était pas seul contre trois : il était majoritaire, trois contre deux.** La présomption
de dérive visait le mauvais camp. Ce n'est pas une erreur de raisonnement — le raisonnement était bon
sur les faits dont il disposait — c'est une **erreur d'inventaire** : deux des trois porteurs de la
méthode n'avaient jamais été recensés, et ce sont précisément eux qui font la majorité.

> **La leçon de méthode, qui vaut au-delà de ce lot** : un arbitrage rendu sur un inventaire non
> exhaustif peut être **rigoureux et faux**. La note R.2 avait ouvert cette brèche en découvrant un
> 5ᵉ porteur ; elle n'a pas été relue comme une invitation à **refaire le décompte**. C'est ce que
> réclamait le critère d'exhaustivité posé en clôture de R.6 (« rien ne garantit qu'il soit le
> dernier »), resté lettre morte.

---

## 3. Direction retenue — le vocabulaire est une DONNÉE de la méthode

**Principe directeur, à opposer à tout arbitrage de détail du lot :**

> Le vocabulaire des rôles **vit dans la bibliothèque de la méthode** (`library/roles/`), sous forme
> d'atomes chargeables. Le cœur de la forge porte **la forme** (le type `Role`, le parseur, les
> invariants) et **un gabarit de démarrage remplaçable** — jamais un canon opposable.

### 3.1 Ce qui devient quoi

| Aujourd'hui | Après |
|---|---|
| `CANONICAL_ROLES` — « LISTE CANONIQUE **FERMÉE** », consultée comme **autorité** | `SEED_ROLES` (ou `STARTER_ROLES`) — **gabarit** de création *ex nihilo*, jamais consulté pour **valider** |
| Pas de `parseRole` ; `poolAtomId` jette `label` et `roleIndex` | `parseRole` dans le cœur, aligné sur `parsePersona`/`parseWorkflow` ; le frame expose des `Role[]` complets |
| L'UI itère sur `CANONICAL_ROLES` | L'UI itère sur le **référentiel résolu** : celui du frame chargé s'il y en a un, le gabarit sinon |
| `roleIndexOf(inconnu) → 0` | index **dérivé du référentiel résolu** ; aucun repli silencieux sur une autre valeur |
| `CASTING_GRADIENTS` indexée sur 8 rôles iakaframe | palette **dérivée** de l'index de manière **totale** (§ 4.3), ou palette + garde de couverture |

### 3.2 Ce qui ne bouge pas

- Les **contrôles d'intégrité** existants (`checkRefs` CLI, `refs.ts` GUI) : c'est déjà de
  l'encadrement pur, ils ne nomment aucune valeur.
- Le **modèle d'équipe** (rôle non couvert → coordinateur) : règle voulue, hors sujet ici — sous
  réserve de C23 (§ 5), qui ne la change pas mais l'empêche de **masquer** un lot raté.
- `roleLabel(inconnu) → la clé telle quelle` et `parseMethod` qui conserve les ids inconnus
  (AR-9) : **ces deux-là respectent déjà la contrainte**. Ce sont les points d'appui du lot, pas
  des cibles.

### 3.3 Le sort du renommage suspendu — **abandonné, et c'est un gain net**

Le renommage devient **sans objet** : il tranchait quel vocabulaire grave dans le cœur, alors que le
cœur ne doit plus en graver. `library/personas/*.md` **reste sur son vocabulaire de `main`**
(`cadrage`, `dev`, `qualite`, `design`, `documentation`) — non par conservatisme, mais parce que ce
sont **les termes de la méthode iakaframe**, et qu'ils n'ont plus à s'accorder à un cœur agnostique.

**La réconciliation résiduelle est bien plus petite qu'annoncé — D-2 est DISSOUS.** Ma première
rédaction posait la question « dans quel sens aligner les porteurs 1-2-3-4 ? » et la remontait au
décideur. **Mesuré sur `main`, la question n'existe pas** :

- porteurs **1, 2, 3** (personas, `library/roles/`, `methods/iakaframe.md`) : **déjà accordés 8/8**
  sur le canon ;
- porteur **4** (`ROLE_OF`, CLI) : **seul écart**, 6 lignes ;
- porteur **5** (`CANONICAL_ROLES`) : **disparaît** comme autorité par D-1.

> **C1a est donc satisfait à 3/4 sans écrire une ligne.** Il ne reste qu'à faire **dériver `ROLE_OF`
> de `library/roles/`** — ou à l'y aligner. Et le sens n'est plus arbitrable par le coût : **le modèle
> du 2026-07-14 le détermine.** Si le référentiel de rôles est un constituant de la Méthode, alors
> `library/roles/` **est** la source et une table codée du CLI ne peut que s'y conformer. Le décideur
> n'a pas un sens à choisir ; il a une conséquence à confirmer.

**Le renommage suspendu apparaît rétrospectivement plus coûteux qu'estimé** : il n'aurait pas
« aligné un canon dérivant », il aurait **cassé un accord 8/8 existant entre trois porteurs** pour le
plier à deux tables codées dont l'une est en cours de suppression. Son abandon n'est pas une
économie, c'est un dommage évité.

---

## 4. La frontière « encadrer / forcer », rendue vérifiable

C'est le cœur de la commande. Une frontière énoncée en prose ne tient pas : il faut un test qui
échoue quand on la franchit.

### 4.1 Le critère-souche — **la méthode fictive**

> **F-0 — Une méthode à vocabulaire arbitraire se charge, s'affiche et se valide sans dégradation.**

Le lot **doit** livrer une **fixture de méthode étrangère**, complète (référentiel de rôles + team +
méthode), dont **aucune clé** n'appartient au vocabulaire iakaframe, et dont le **nombre** de rôles
diffère de 8. Toute la batterie F-1..F-10 se joue **contre elle**. C'est l'unique manière de prouver
l'agnosticisme : une GUI qu'on ne teste qu'avec iakaframe ne prouve rien.

**Choix de la fixture — grounded, pas inventé.** Prendre un vocabulaire **réel** de la north-star
plutôt qu'un `role-a`/`role-b` : cela teste l'agnosticisme *et* documente la cible.

- **BMAD-METHOD** : `analyst`, `pm`, `architect`, `sm` *(scrum master)*, `dev`, `qa` — **6 rôles**,
  déclarés en **YAML** (donnée, pas code). *(source § 9)*
- **MetaGPT** : `ProductManager`, `Architect`, `ProjectManager`, `Engineer`, `QaEngineer` —
  **5 rôles**, en **CamelCase**. *(source § 9)*

> **Trois propriétés qu'aucune de ces deux méthodes ne partage avec iakaframe, et que la fixture doit
> donc porter** : un **compte** différent de 8 (5 ou 6) ; des **clés** entièrement étrangères ; et
> — pour MetaGPT — une **casse** non-minuscule, qui heurte frontalement les `toLowerCase()` de
> `roleByKey`/`isCanonicalRole`. Ni l'une ni l'autre ne possède d'équivalent de `portefeuille`, de
> `deploiement` ou de `graphisme` : ce ne sont pas des synonymes à mapper, ce sont des **découpages
> du travail différents**. **Reco : MetaGPT**, parce que sa casse fait tomber un défaut de plus.

### 4.2 Les critères de frontière

| # | Critère | Vérification |
|---|---|---|
| **F-1** | Le référentiel affiché par l'UI (menus `PersonaEditor`, `WorkflowAtelier`, rail `MethodeAtelier`) est celui du **frame chargé** — les rôles étrangers y figurent **tous**, aucun rôle iakaframe n'y figure | test de composant sur la fixture |
| **F-2** | **Aucune valeur de rôle n'est rejetée, filtrée ni normalisée** parce qu'elle est absente d'une liste du cœur | assigner `Engineer` à une persona → conservé tel quel, **casse comprise**, jusqu'au kit généré |
| **F-3** | `roleLabel` d'un rôle chargé rend **son `label` de bibliothèque**, pas sa clé brute *(régression du repli actuel : sans `parseRole`, le label est perdu)* | assertion sur la fixture |
| **F-4** | Le **compte** de rôles n'est jamais présumé : ni `=== 8`, ni `>= 8` | grep de non-régression + fixture à 5 |
| **F-5** | **Aucune collision de casting** dans un référentiel chargé, quel que soit son cardinal (5, 8, 12) | § 4.3 |
| **F-6** | Créer une méthode *ex nihilo* propose le **gabarit**, et ce gabarit est **modifiable et supprimable** intégralement | test : vider les rôles d'une méthode neuve → état valide, aucun rôle réinjecté |
| **F-7** | Le vocabulaire soumis au **copilote** (`prompt.ts`) est celui du référentiel **résolu** | sinon le copilote suggère des rôles iakaframe dans un projet BMAD |
| **F-8** | Le cœur ne contient **aucune** occurrence littérale d'une clé de rôle dans une **expression logique** *(≠ dans une donnée de gabarit, qui reste permise)* | grep `roleKey === "…"` ⇒ **0** ; cible connue : `buildTeamFromRoster` |
| **F-9** *(nouveau, § 1.5)* | `parseRole` + la résolution « chargé sinon gabarit » sont écrits comme un **patron réutilisable** pour les cinq autres constituants (a)-(e), non comme un cas particulier des rôles | revue de conception au gate : un 2ᵉ constituant doit pouvoir l'adopter **sans réécriture du mécanisme** |
| **F-10** *(nouveau, § 1.4)* | **La seule condition de rejet d'une méthode chargée est l'absence de coordinateur assigné**, vérifiée **structurellement** (`team.coordinator` résout vers un persona), jamais par comparaison à une clé de rôle | fixture étrangère **sans** coordinateur ⇒ rejet ; **avec** coordinateur ⇒ acceptée quelles que soient ses clés |

**Sur F-8, la nuance qui empêche le critère de devenir absurde.** `DEFAULT_NAMES.coordination` est
une **entrée de gabarit** — une donnée, remplaçable. `p.roleKey === "coordination"` dans
`buildTeamFromRoster` est une **règle codée** : elle affirme que le coordinateur d'une équipe est
toujours celui qui porte cette clé. Faux pour BMAD (dont le rôle d'orchestration est `sm`), faux pour
MetaGPT (`ProjectManager`). **Le coordinateur est une propriété de la Team** (`team.coordinator`
existe déjà, et le CLI s'en sert), pas une propriété déduite d'une clé de rôle. → le gabarit doit
**désigner** son coordinateur, et non le faire **deviner** par comparaison de chaîne.

**F-8 et F-10 sont les deux faces d'un même fait**, et c'est ce qui rend la borne du décideur
implémentable sans effort : l'unique obligation opposable porte sur `team.coordinator`, **une donnée
qui existe déjà et qui ne nomme aucun rôle**. Supprimer la comparaison littérale (F-8) et instituer
l'obligation (F-10) sont **le même geste** — on cesse de deviner le coordinateur pour le lire là où
il est déclaré.

**Ce qui, à l'inverse, ne peut PAS être bloquant** — conséquence directe de la borne :

| Situation | Traitement |
|---|---|
| `roleIndex` en collision ou avec des trous dans le référentiel chargé | **avertissement**, jamais rejet (§ 4.3) |
| Cardinal inhabituel (3 rôles, 40 rôles) | rien à signaler |
| Clés en casse mixte, accentuées, espacées | rien à signaler ; **conservées telles quelles** (F-2) |
| Aucun rôle déclaré du tout | **avertissement** ; une méthode sans référentiel reste chargeable |
| `method.roleKeys` référence un rôle non déclaré | **→ D-6, non tranché** (§ 1.4) |

### 4.3 Le casting — le défaut d'agnosticisme le plus concret, et le plus invisible

`roleIndexOf(inconnu)` renvoie **`0`**. `vignetteGradient` fait `i % CASTING_GRADIENTS.length`.
Conséquence, sur une méthode étrangère :

> **Les 5 rôles de MetaGPT reçoivent tous `roleIndex = 0`, donc tous la MÊME vignette or —
> celle du `portefeuille` d'iakaframe.** Aucune exception, aucun warning, aucun test rouge.

C'est la démonstration la plus nette que la contrainte n'est pas théorique : dans une méthode
importée, **le rail d'équipe s'affiche entièrement monochrome, aux couleurs d'un rôle qui n'existe
pas dans cette méthode**. Et dans une méthode où la couleur porte le sens, c'est une perte de
fonction, pas un défaut cosmétique.

C20 (`CASTING_GRADIENTS.length >= CANONICAL_ROLES.length`), déjà livrée, **ne voit rien de tout
cela** : elle confronte la palette à la liste **codée**, jamais au référentiel **chargé**. Elle reste
verte pendant que l'écran est monochrome. → **F-5 la remplace en la généralisant** : la garde doit
porter sur le référentiel **résolu**.

**Deux options pour le remède** — **arbitrage technique de l'exécutant**, pas du décideur :

- **(a) Palette totale** : dériver la teinte de l'index par une fonction (rotation de teinte HSL sur
  `n` positions), qui rend un couple distinct pour tout cardinal. Élégant, sans borne, mais
  **change les 8 teintes actuelles** — donc l'identité visuelle d'iakaframe.
- **(b) Palette + garde** : conserver les 8 teintes explicites comme gabarit, et **signaler** toute
  résolution où deux rôles du référentiel **chargé** partagent une teinte.

> **Reco révisée : (a)**, et la borne du § 1.4 est ce qui fait basculer la recommandation.
>
> Mon premier choix — (b) — reposait sur l'idée qu'on pouvait rendre **rouge** une collision. La
> borne l'interdit : une méthode dont le casting collisionne **ne peut pas être rejetée**, ce n'est
> pas l'unique obligation. (b) se dégrade donc en simple avertissement… qui laisse l'écran
> monochrome. **Elle ne résout plus le problème, elle le commente.** (a), au contraire, rend le
> défaut **structurellement impossible** : il n'y a plus de collision à signaler, donc plus de
> contrainte à opposer. C'est la solution qui *encadre sans forcer*, au sens propre.
>
> **Coût de (a), assumé** : les 8 teintes actuelles changent. À moins de choisir les `n` positions de
> la rotation de sorte que le cas `n = 8` **reproduise la palette existante** — faisable, et c'est ce
> que je recommande à l'exécutant : identité visuelle d'iakaframe préservée, agnosticisme obtenu.

**Et l'indexation devient un non-sujet.** Si la teinte dérive de la **position dans le référentiel
résolu** (trié par `roleIndex` déclaré), alors la **base** de numérotation (0 ou 1) n'a plus aucun
effet observable, et **l'ordre** est celui que la méthode déclare. Le cœur n'impose ni base ni ordre :
il lit un rang et s'en sert relativement. → **D-3 est dissous** (§ 7).

---

## 5. Le sort de C1 — **abrogé et réécrit**

**C1, tel qu'il est écrit** (`audit-amelioration-roster-personas.md` § 9) :

> « un seul vocabulaire de rôles entre `library/personas/*.md`, `agents.js`, `roster.ts` —
> table de correspondance 8/8 en accord »

**Verdict : à abroger.** Le défaut n'est pas le mot « unique », c'est le **périmètre sur lequel
l'unicité est exigée**. C1 met dans le même sac quatre porteurs **de la méthode** (1,2,3,4) et deux
porteurs **du cœur de la forge** (5,6). Exiger leur accord, c'est **exiger que le cœur connaisse la
méthode** — c'est la définition même de ce que la contrainte interdit. C1 ne pousse pas
accidentellement dans le mur : **il est le mur**, énoncé comme critère de réussite.

Et le « 8/8 » est un second défaut, plus discret : il grave un **cardinal** dans un critère
d'acceptation. Une méthode à 5 rôles le fait échouer sans rien casser.

**Réécriture — C1 se scinde en deux critères qui ne se recouvrent pas :**

| # | Critère | Portée | Vérification |
|---|---|---|---|
| **C1a** | **Unicité intra-méthode.** Les porteurs **de la méthode iakaframe** — `library/personas/*.md` (`roleKey`), `library/roles/*.md` (`key`), `methods/iakaframe.md` (`roleKeys`), `ROLE_OF` — portent **le même vocabulaire**, et **`library/roles/` en est la source** | dépôt `iakaframe` | comparaison ensembliste sur **le cardinal réel du référentiel**, jamais un littéral |
| **C1b** | **Une seule contrainte opposable.** Aucun porteur du **cœur de la forge** ne conditionne son comportement à une **valeur** de rôle ; les valeurs présentes sont des **données de gabarit**, remplaçables et non opposables. **La seule condition de rejet d'une méthode chargée est l'absence de coordinateur assigné** (§ 1.4) | dépôt `iakaFrameGUI` | F-1..F-10 (§ 4.2) |

> **La bascule tient en une phrase** : C1 exigeait que les six porteurs **s'accordent** ; C1a/C1b
> exigent que **quatre s'accordent** et que **deux n'aient rien à dire**. C'est le même mot
> « cohérence », appliqué à deux périmètres qu'il fallait séparer.

**Les autres critères hérités :**

| Critère | Sort |
|---|---|
| **C2** (parité `roleKey`↔`ROLE_OF`) | **CONSERVÉ INTACT** — parité de forme, ne nomme aucune valeur attendue. Il **est** le modèle de ce qu'on veut. Sa sortie rouge est recettée (`005f519`) ; **ne pas la rejouer, la réutiliser**. |
| **C3** (`SKILL_OVERRIDE_OF` supprimée) | **CONSERVÉ et SIMPLIFIÉ** : `deploiement` est un rôle de plein droit dans la bibliothèque **depuis toujours** (`library/roles/deploiement.md`, `roleIndex: 6`). L'exception codée n'a jamais rattrapé qu'un trou de `ROLE_OF`. Aucune dépendance à un arbitrage. |
| **C13..C20** (vignette du « 8ᵉ rôle ») | **ABSORBÉS par F-5**, strictement plus fort. **C20 est à retirer** : sa formulation (`>= CANONICAL_ROLES.length`) référence la liste fermée et **survivrait** au chantier en y réintroduisant l'autorité qu'on lui retire. **C19 devient sans objet** avec le remède (a) : il n'y a plus de collision possible à tester. |
| **C21** (`methods/iakaframe.md` accordé) | **CONSERVÉ**, rattaché à **C1a** — et **déjà satisfait sur `main`**. |
| **C22** (`method.roleKeys` ↔ union des `roleKey` de la team) | **CONSERVÉ** — garde de couverture, purement formelle. Sous réserve de **D-6** quant à son caractère bloquant. |
| **C23** (`coveredByCoordinator == []`) | **CONSERVÉ mais REFORMULÉ** — cf. § 5.1. Sa forme actuelle entre en conflit avec une règle de méthode établie. |

### 5.1 La tension C23 ↔ « le coordinateur absorbe les rôles non couverts »

Le coordinateur signale un conflit entre C23 (`coveredByCoordinator == []`, sinon échec de lot) et la
règle de méthode du 2026-07-16 (*un rôle non couvert est pris par le coordinateur ; ce n'est pas un
orphelin bloquant*). **Sa lecture est juste, et je la valide : ce n'est pas une contradiction, c'est
une confusion de plans.**

| Plan | Ce qui est vrai |
|---|---|
| **Runtime** | Absorber un rôle non couvert est un **repli légitime et voulu**. La compagnie tourne. Rien à signaler. |
| **Conception d'un lot** | Une absorption **qui apparaît à cause du lot** est le symptôme d'une clé qui a divergé. C'est un défaut. |

Le discriminant n'est donc **pas l'état** (`coveredByCoordinator` vide ou non) mais la **variation**.
D'où la reformulation, qui répond aussi à la question « C23 peut-elle distinguer les deux ? » —
**oui, mécaniquement, sans connaître l'intention** :

> **C23 (reformulé) — garde DIFFÉRENTIELLE.** L'ensemble `coveredByCoordinator` produit par
> `assemble` **après** le lot doit être **inclus dans** celui mesuré **avant** le lot (baseline
> capturée à l'ouverture, `--json`). **Tout rôle nouvellement absorbé fait échouer le lot** ; un rôle
> absorbé de longue date, par choix de méthode, ne dit rien.

**Trois propriétés qui rendent cette forme préférable à l'égalité à vide :**

1. Elle **ne contraint aucune méthode** — elle contraint un **lot**. Elle est donc hors du champ de
   la borne du § 1.4 : ce n'est pas une obligation opposée à une méthode chargée, c'est un test de
   non-régression du dépôt. La règle de 2026-07-16 reste intégralement en vigueur.
2. Elle **survit à une méthode qui laisse délibérément des rôles au coordinateur** — cas qu'une
   petite équipe rendra courant, et que `== []` interdisait de fait.
3. Elle **conserve toute la morsure** sur le scénario de la note R.3 : un renommage partiel fait
   passer 5 rôles de « couverts » à « absorbés » — l'ensemble **grossit**, le test rouge tombe.

> **Sur `main`, la baseline est vide** (les 3 porteurs de la méthode s'accordent 8/8, donc tout rôle
> est couvert). `⊆ baseline` et `== []` y sont **équivalents aujourd'hui** — la reformulation ne
> change donc rien au comportement immédiat, elle empêche seulement le critère de devenir faux
> demain. C'est le bon moment pour la poser : elle ne coûte rien.

**Je ne remonte donc pas C23 en point décideur** — la garde sait distinguer, la question est close au
niveau de la conception. **Si le principe différentiel était refusé** (au motif qu'il exige de
capturer une baseline en ouverture de lot, ce qui est une contrainte de procédure réelle), alors il
redeviendrait un arbitrage : `== []` strict et une règle de méthode amputée, ou pas de garde du tout.

---

## 6. `DEFAULT_NAMES` (Tolkien) et `DEFAULT_SKILLS`

### 6.1 Le fait, et son aggravation

`roster.ts` mappe `architecture → "Gandalf"`, `fabrication → "Gimli"`… et
`architecture → ["iakaframe-cadrage"]`, `graphisme → ["iakaframe-naonedge"]`. Le **cœur partagé**
d'une forge agnostique connaît donc nommément la compagnie **et** le catalogue de skills d'une
méthode.

**Le commentaire du fichier dit déjà le droit** : « des **noms par défaut** (donnée éditable —
AR-5, **JAMAIS une désignation de doc**) ». L'intention est bonne et explicite. Ce qui manque n'est
pas la doctrine, c'est **l'emplacement** : une donnée de gabarit d'iakaframe rangée dans le cœur.

**Le point aggravant, spécifique aux `DEFAULT_SKILLS`** : il n'y a **aucune raison** qu'une méthode
étrangère nomme ses skills `iakaframe-*`. Sur BMAD, ce mapping ne produit pas un défaut cosmétique —
il produit des **références de skills mortes** dans une team générée. `DEFAULT_NAMES` est un
problème de doctrine ; `DEFAULT_SKILLS` est un problème de **correction**.

### 6.2 Direction — **déplacer, ne pas supprimer**

Ces deux tables sont **utiles** : un roster de démarrage vide serait une régression d'ergonomie
réelle, et le gabarit iakaframe a de la valeur pour l'usage principal du produit.

> **Elles sortent du cœur et deviennent une donnée de gabarit rattachée à la méthode.** Le cœur
> expose la **fonction** (« construire une team de départ à partir d'un référentiel de rôles et d'un
> gabarit fourni »), la **méthode** fournit le gabarit.

**Trois exigences non négociables sur le résultat :**

1. Sans gabarit, `buildTeamFromRoster` produit des personas nommées **d'après le rôle** (le `label`
   du référentiel), jamais d'après une liste codée — repli **gracieux**, qui est le comportement en
   contexte étranger.
2. `skills` **vide** en l'absence de gabarit : mieux vaut aucune skill qu'une skill morte.
3. Le **coordinateur** vient du gabarit ou de la Team, **jamais** d'une comparaison `roleKey ===`
   (F-8).

**Sur la doctrine « rôle, pas nom Tolkien ».** La règle porte sur la **doc publique** ; `roster.ts`
est du code, et son commentaire prend déjà la précaution de dire que le `name` n'est pas une
désignation. Mais le rappel du brief est fondé et je le retiens : **le cœur d'une forge destinée à
d'autres méthodes est au moins aussi exposé qu'une page de doc** — c'est le fichier que lira
quiconque veut brancher BMAD. Y trouver « Gandalf » et « Gimli » ne se lit pas comme un exemple,
mais comme une **appartenance du produit à une méthode**. L'argument tient donc **sans avoir besoin
d'invoquer la règle de doc**, et c'est mieux ainsi.

---

## 7. Points que SEUL le décideur tranche

| # | Question | Reco Gandalf |
|---|---|---|
| **D-1** | **La lecture de la contrainte.** | ✅ **TRANCHÉ** (§ 1.1) — « les rôles sont des éléments de la méthode », borné par « le coordinateur assigné comme seule obligation » (§ 1.4). Mes deux corrections survivent et s'y intègrent. |
| **D-2** | **Sens de la réconciliation intra-méthode (C1a).** | ⛔ **DISSOUS** (§ 3.3) — la question n'existe pas : sur `main`, les 3 porteurs de la méthode s'accordent **déjà 8/8** sur le canon. Seul `ROLE_OF` diverge, et le **modèle du 2026-07-14 détermine le sens** (la bibliothèque est la source, la table codée s'y conforme). Rien à arbitrer, une conséquence à confirmer. |
| **D-3** | **L'indexation** : base 0 ou 1, quel ordre ? | ⛔ **DISSOUS** (§ 4.3) — si la teinte dérive du **rang dans le référentiel résolu**, la base n'a plus d'effet observable et l'ordre est celui que la méthode déclare. Le cœur n'impose ni l'une ni l'autre. **`library/roles/` reste en base 1, inchangé.** |
| **D-4** | **Découpage** : un lot ou deux (A = vocabulaire chargeable + frontière ; B = casting, gabarit, `DEFAULT_*`) ? | **OUVERT** — reco **deux**. A porte le risque et la valeur, B est mécanique. Deux gates valent mieux qu'un lot de 4 jours. |
| **D-5** | **Le renommage suspendu est-il abandonné ?** (branches `d9f4e1f` / `27d8a2d`, WIP `fe230ab`) | **OUVERT** — reco **abandonné**, et l'argument s'est **renforcé** : il n'aurait pas corrigé une dérive, il aurait **cassé un accord 8/8** existant. Seule la garde C2 est à reprendre (commit isolé `005f519`). |
| **D-6** *(nouveau)* | **L'intégrité référentielle I1 reste-t-elle BLOQUANTE ?** Une méthode dont `method.roleKeys` référence un rôle qu'elle ne déclare pas est-elle **rejetée**, ou seulement **signalée** ? (§ 1.4) | reco **la conserver bloquante** — I1 ne contraint pas le **vocabulaire** de la méthode, elle constate que la méthode **se contredit elle-même**. Mais l'énoncé dit « seule obligation », et je ne m'autorise pas à décider qu'il ne le pensait pas. **Le décideur tranche.** |
| **D-7** *(nouveau)* | **Périmètre : les rôles seuls, ou le modèle (a)-(f) entier ?** Les cinq autres constituants souffrent du même défaut, et `principlesForMethod` **tronque déjà** les principes d'une méthode chargée (§ 1.5). | reco **les rôles seuls**, avec **F-9** (patron réutilisable) pour que la suite soit peu coûteuse. Mais **acter que le chantier n'est pas clos** : le cœur restera agnostique sur **un sixième** de la méthode. Un item de dette est à inscrire au backlog. |

> **D-1 étant tranché, aucun point n'est bloquant pour engager.** D-2 et D-3 se sont dissous à la
> mesure sur `main` — c'est le gain net de la rectification. **D-6 est le seul qui touche la
> conception** et il peut être tranché à l'ouverture du lot ; **D-7 est un arbitrage de portée** qui
> peut l'être à la clôture. D-4 et D-5 sont d'ordonnancement.
>
> **Une observation que je dois au décideur** : D-2 et D-3 n'étaient des questions que parce que
> j'avais mesuré sur la mauvaise branche. Deux des cinq arbitrages que je lui demandais étaient des
> **artefacts de mon erreur de lecture**. C'est le coût direct de l'avertissement que j'avais moi-même
> écrit au § 0 et que je n'ai pas appliqué à mes propres mesures.

---

## 8. Estimation — **périmètre neuf, chiffre neuf**

> Les chiffres antérieurs sont **caducs**, tous : le § 10 (~1,5-2 j-h) chiffrait un renommage sur des
> critères qu'il ne portait pas ; R.6 et 13.9 (~2,75-3 j-h) chiffraient ce même renommage **élargi**.
> **Le renommage n'est plus le lot.**

| Poste | Charge |
|---|---|
| **A1** — `parseRole` dans le cœur + `Role` complet remonté par le frame (`poolAtomId` cesse de jeter `label`/`roleIndex`) | **0,5 j-h** |
| **A2** — Résolution du référentiel : « frame chargé sinon gabarit », un point d'entrée unique consommé par toute l'UI | **0,5 j-h** |
| **A3** — Raccordement des consommateurs (`PersonaEditor`, `WorkflowAtelier` ×3, `MethodeAtelier`, `prompt.ts`, `method.ts`) ; `CANONICAL_ROLES` → `SEED_ROLES` ; 8 commentaires « les N rôles » | **0,75 j-h** |
| **A4** — **Fixture de méthode étrangère** (référentiel + team + méthode) + batterie **F-1..F-10** | **0,75 j-h** |
| **B1** — Casting : rang dérivé du référentiel résolu, remède **(a)** calibré pour reproduire la palette à `n = 8`, **F-5** ; retrait de C20/C19 | **0,5 j-h** |
| **B2** — `DEFAULT_NAMES`/`DEFAULT_SKILLS` sortis du cœur ; `buildTeamFromRoster` dégabarisé ; **F-8** + **F-10** (coordinateur lu, non deviné) | **0,5 j-h** |
| **B3** — **C1a** : `ROLE_OF` dérivé de `library/roles/` — **seul écart restant** *(les porteurs 1-2-3 sont déjà accordés ; plus de renumérotation, D-3 dissous)* | **0,25 j-h** |
| **B4** — Reprise de C2 (`005f519`) ; C21 *(déjà satisfait)* ; C22 ; **C23 différentiel** + capture de baseline | **0,25 j-h** |
| **Z** — Rituel de « fini » : goldens → déployé → re-vendorage → **2 suites** | **0,25 j-h** |
| **Total** | **~4,25 j-h** — fourchette **4 à 5** |

**Complexité : haute** — supérieure au lot arrêté. Le renommage était **large mais mécanique** ; ici
on change un **modèle** (une liste codée devient une donnée chargée) dans un cœur qu'une app entière
consomme. En revanche, la découverte du § 2.1 — la voie de chargement **existe déjà** — retire le
gros du risque : on raccorde, on ne construit pas.

**Risque : moyen** — *abaissé* par rapport à R.6 (« haut »), pour une raison précise : le piège
central de R.3 (un renommage partiel silencieusement absorbé par le coordinateur, sous des tests
verts) **n'est plus au centre du lot**. Il persiste sur le seul poste **B3**, où C23 le couvre, et
B3 est désormais le poste **le plus petit du lot** (0,25 j-h, une table).

**Ce que la rectification sur `main` a changé au chiffre** : −0,25 j-h seulement, mais **la
composition du risque a changé plus que son montant**. La part « renommage de vocabulaire » —
celle qui portait le danger de la note R.3 — est passée de *cinq porteurs à réconcilier* à *une table
à faire dériver*. Le lot est maintenant presque entièrement du **travail de structure côté GUI**,
dont le risque est ordinaire (régression d'affichage, rattrapée par les tests) plutôt que silencieux.

**Inconnues — celles qui feraient glisser le chiffre :**

1. **Le nombre réel de consommateurs de `CANONICAL_ROLES`.** J'en ai relevé **9 fichiers**
   (`PersonaEditor`, `WorkflowAtelier`, `MethodeAtelier`, `prompt.ts`, `casting.test.tsx`,
   `useForgeTeams.test.ts`, `roster.ts`, `method.ts`, `roles.ts`) — jamais audités un par un.
   **Inventaire exigé en ouverture** ; A3 peut doubler si l'un d'eux fait plus qu'itérer.
2. **La résolution du référentiel exige-t-elle un état applicatif ?** Si l'UI n'a pas déjà accès au
   frame chargé au point où elle affiche les menus, **A2 grossit** — c'est du câblage d'état, pas de
   la logique. **À vérifier en premier** : c'est l'inconnue la plus structurante des huit postes.
3. **La casse** (`toLowerCase()` dans `roleByKey`/`isCanonicalRole`) : combien de comparaisons
   normalisent la casse et casseraient sur `ProductManager` ? Si D-4 retient MetaGPT, **F-2 mordra**
   — c'est voulu, mais la charge de correction n'est pas mesurée.
4. **Le périmètre CLI.** Ce cadrage porte surtout sur la GUI. `ROLE_OF`/`SKILL_OF` sont eux aussi des
   tables codées portant du vocabulaire — mais le CLI **est** l'outil d'iakaframe, pas une forge
   agnostique. **Je ne l'inclus pas au périmètre**, et je signale que c'est une **décision de
   cadrage discutable** : si le CLI doit un jour servir d'autres méthodes, la même analyse s'y
   applique intégralement. → non chiffré, à rouvrir sciemment.
5. **La suite GUI complète n'est pas re-mesurable** sur machine chargée (réserve connue,
   `ForgeShell.test.tsx`) : le gate final peut demander une passe CI.

**Hors chiffrage** : la teinte définitive de Loki (décision de charte, non bloquante — et **sans
objet** si le remède (a) est retenu).

---

## 9. Sources (faits externes vérifiés — load-bearing pour § 4.1)

Vérifiés le 2026-07-20. Ils fondent le choix de la fixture et l'affirmation que les vocabulaires
cibles diffèrent d'iakaframe en **cardinal**, en **clés** et en **casse** :

- BMAD-METHOD — rôles `analyst` / `pm` / `architect` / `sm` / `dev` / `qa`, blueprint **YAML** :
  https://github.com/bmad-code-org/bmad-method
- BMAD-METHOD — description des agents et de leur enchaînement :
  https://dev.to/jacktt/understanding-the-agents-in-the-bmad-235o
- MetaGPT — rôles `ProductManager` / `Architect` / `ProjectManager` / `Engineer` / `QaEngineer` :
  https://github.com/FoundationAgents/MetaGPT
- MetaGPT — « Code = SOP(Team) », rôles matérialisés en classes :
  https://arxiv.org/html/2308.00352v6

## 10. Fichiers de référence

*(Citations par **nom de symbole**, conformément à R.4 — les pointeurs `chemin:ligne` des
instructions antérieures sont présumés faux.)*

**Dépôt `iakaframe`**
- `library/roles/*.md` — les 8 fiches : le référentiel, **source retenue** (§ 2.2)
- `library/personas/*.md` — `roleKey` (C1a)
- `methods/iakaframe.md` — `roleKeys` (C21)
- `cli/src/lib/library.js` — `checkRefs` (`needEach('roleKeys', …, 'roles')`) et `assemble`
  (`coveredByCoordinator`, `orphans`) — C22/C23
- `cli/src/lib/agents.js` — `ROLE_OF`, `SKILL_OF` (C1a, C2)

**Dépôt `iakaFrameGUI`**
- `packages/core/src/frame.ts` — `POOL_FRAME_TYPES`, `poolAtomId` — **la voie chargée** (A1)
- `packages/core/src/roles.ts` — `CANONICAL_ROLES` → `SEED_ROLES` (A3)
- `packages/core/src/roster.ts` — `DEFAULT_NAMES`, `DEFAULT_SKILLS`, `buildTeamFromRoster` (B2, F-8)
- `packages/core/src/method.ts` — `IAKAFRAME_CANONICAL_METHOD` (`roleKeys: [...CANONICAL_ROLE_KEYS]`)
- `packages/core/src/reservoir.ts` — collection `roles` déjà déclarée
- `src/forge/refs.ts` — `needEach("roleKeys", …, "roles")` : I1 côté GUI
- `src/forge/casting.ts` + `src/forge/casting.test.tsx` — `CASTING_GRADIENTS`, C20 à retirer (B1)
- `src/forge/llm/prompt.ts` — `"method-role": CANONICAL_ROLE_KEYS` (F-7)
- `src/components/PersonaEditor.tsx`, `src/forge/ateliers/WorkflowAtelier.tsx`,
  `src/forge/ateliers/MethodeAtelier.tsx` — les menus à raccorder (F-1)
- `src-tauri/src/library_store.rs` — `roles` dans l'allow-list de lecture

**Instructions liées**
- `specs/instructions/audit-amelioration-roster-personas.md` — porteur historique de CH-A ;
  **C1 abrogé** (§ 5), C2/C21/C22/C23 conservés, C13..C20 absorbés
- `specs/instructions/decision-rolekey-reconciliation.md` — direction **rouverte**, motif factuel
  **renversé** (§ 0.1, § 2.4)
- `~/work/BACKLOG.md` — cadrage du **2026-07-14**, « Modèle Méthode élargi + séparation
  Méthode/Team », constituant **(f) référentiel de rôles** : **ce lot en est l'implémentation
  partielle** (§ 1.7)
- `specs/instructions/garde-vendor-check-cross-repo.md` — dépendance de re-vendorage
