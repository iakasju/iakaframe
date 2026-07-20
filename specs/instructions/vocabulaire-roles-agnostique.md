# Vocabulaire des rôles — agnosticisme de méthode (re-cadrage de CH-A)

> Instruction de cadrage (Gandalf, P1). **Lecture seule** sur les deux dépôts ; ce fichier est le
> seul artefact produit. Elle **remplace le périmètre de CH-A** tel que porté par
> `audit-amelioration-roster-personas.md` et par `decision-rolekey-reconciliation.md`. En cas de
> contradiction avec ces deux fichiers, **la présente instruction prime** (§ 1.3).
>
> ⚠️ **Elle ne remplace pas leur valeur de trace.** Les faits qu'ils établissent restent vrais ;
> c'est leur **direction** qui est rouverte, sur contrainte neuve du décideur.

---

## 0. AVERTISSEMENT DE LECTURE — l'état sur disque n'est PAS `main`

**Constat vérifié à l'ouverture de ce cadrage** (`preuve-avant-declaration`), et il conditionne toute
lecture de ce fichier :

| Fichier lu | Ce qu'il porte sur disque | Ce que porte `main` |
|---|---|---|
| `library/personas/*.md` | `architecture`, `fabrication`, `tests`, `graphisme`, `doc` | `cadrage`, `dev`, `qualite`, `design`, `documentation` |
| `methods/iakaframe.md` (`roleKeys`) | vocabulaire CLI (renommé) | vocabulaire canon |
| `cli/src/lib/agents.js` | `ROLE_OF.helm = 'deploiement'`, `SKILL_OVERRIDE_OF` **supprimée** | `coordination` + exception codée |
| `packages/core/src/roles.ts` | **8** rôles, `deploiement` index 7 | 7 rôles |
| `src/forge/casting.ts` | 8ᵉ dégradé + `export` de `CASTING_GRADIENTS` | 7 dégradés, const privée |

> **Les deux répertoires de travail portent le renommage suspendu**, pas l'état de `main`. Toute
> mesure faite « sur disque » sans vérifier la branche courante décrira le lot arrêté, pas la base.
> **Premier geste de l'exécutant, avant toute autre chose** : établir la branche courante des deux
> dépôts et, si le re-cadrage est retenu, **repartir de `main`**. Ce fichier a été rédigé en toute
> connaissance de ce décalage : quand il décrit un état, il précise lequel.

**Conséquence sur un fait du brief.** Le brief signale que le renommage a cassé l'intégrité
référentielle **I1** (5 références mortes) sans que les 370 tests bronchent. Sur l'état **actuel du
disque**, I1 est **satisfaite** : `library/roles/` porte bien les 8 clés référencées par
`methods/iakaframe.md`. Deux lectures possibles — le renommage a été propagé à `library/roles/`
depuis, ou la rupture était transitoire. **Je ne tranche pas** : je n'ai pas accès à l'historique
git depuis ce cadrage. **Ce qui n'est pas affecté** : la démonstration reste entièrement valide,
puisque son objet est que **rien n'a rendu la rupture visible**, quel que soit le moment où elle a
été refermée.

---

## 1. La prémisse — validation, correction, et sa portée

### 1.1 La contrainte du décideur

> « Le vocabulaire de la GUI doit être **agnostique de la frame et de la méthode** : **on encadre
> mais on ne force pas.** »

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

### 1.3 Portée — ce que la contrainte renverse

L'arbitrage du 2026-07-19 (§ 13.2 de l'audit) faisait **céder le canon** au motif de coût, en
assumant explicitement de « plier la source de vérité à son implémentation ». Cette direction a été
rendue **avant** la contrainte d'agnosticisme, et elle est désormais **sans objet plutôt que
fausse** : elle répond à la question « lequel des deux vocabulaires gagne ? », alors que la
contrainte dit que **le cœur ne doit porter aucun des deux comme loi**. Aligner `cadrage` sur
`architecture` ou l'inverse revient à choisir la couleur d'un mur qu'on va démolir.

> **Ce qui suit ne remet en cause ni la compétence ni la bonne foi de l'arbitrage rendu.** Il a été
> rendu sur un jeu de contraintes qui ne contenait pas celle-ci. C'est la contrainte qui est neuve.

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

### 2.3 L'indexation — divergence réelle, sur **deux** axes

Les **clés** concordent 8/8 entre `library/roles/` et le cœur GUI. Les **index** divergent :

| Clé | `library/roles/*.md` | `roles.ts` (cœur GUI) |
|---|---|---|
| portefeuille | 1 | 0 |
| coordination | 2 | 1 |
| architecture | 3 | 2 |
| fabrication | 4 | 3 |
| tests | 5 | 4 |
| **deploiement** | **6** | **7** |
| **graphisme** | **7** | **5** |
| **doc** | **8** | **6** |

Deux écarts distincts, à ne pas confondre : un **décalage de base** (1 vs 0, mécanique) et un
**ordre différent** (`deploiement` est 6ᵉ dans la bibliothèque, 8ᵉ dans le cœur). Le second n'est pas
un détail : `roleIndex` **pioche la couleur de vignette**. Deux ordres = deux castings visuels pour
la même équipe, selon la source lue.

### 2.4 Le motif factuel n° 1 de l'arbitrage — statut

L'audit fondait sa présomption sur : « le canon est le seul à être en désaccord ; le CLI et le cœur
GUI utilisent le **même** vocabulaire ». Avec les porteurs 2 et 3 au tableau, l'énoncé devient : le
canon `personas` était en désaccord avec **le CLI, le cœur GUI, la bibliothèque de rôles et la
méthode**. Le motif n'était pas faux, il était **incomplet dans un sens qui renforçait sa
conclusion** — ce qui est précisément la forme d'erreur qu'un ré-examen doit relever.

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

> **Mais il reste une réconciliation à faire, et il ne faut pas croire qu'elle disparaît.** Les
> porteurs **1, 2, 3 et 4** sont tous **de la méthode iakaframe** — ils doivent s'accorder **entre
> eux**, sur les termes de la méthode. Le renommage suspendu allait dans le mauvais sens (aligner la
> méthode sur le cœur) ; le bon sens est d'aligner `library/roles/`, `methods/iakaframe.md` et
> `ROLE_OF` sur le canon `personas`. **C'est la direction que l'audit recommandait à l'origine**
> (§ 7 point 1, reco Gandalf), écartée alors pour un motif de coût que la contrainte d'agnosticisme
> rend caduc. → **Point décideur D-2** (§ 7).

---

## 4. La frontière « encadrer / forcer », rendue vérifiable

C'est le cœur de la commande. Une frontière énoncée en prose ne tient pas : il faut un test qui
échoue quand on la franchit.

### 4.1 Le critère-souche — **la méthode fictive**

> **F-0 — Une méthode à vocabulaire arbitraire se charge, s'affiche et se valide sans dégradation.**

Le lot **doit** livrer une **fixture de méthode étrangère**, complète (référentiel de rôles + team +
méthode), dont **aucune clé** n'appartient au vocabulaire iakaframe, et dont le **nombre** de rôles
diffère de 8. Toute la batterie F-1..F-8 se joue **contre elle**. C'est l'unique manière de prouver
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

**Sur F-8, la nuance qui empêche le critère de devenir absurde.** `DEFAULT_NAMES.coordination` est
une **entrée de gabarit** — une donnée, remplaçable. `p.roleKey === "coordination"` dans
`buildTeamFromRoster` est une **règle codée** : elle affirme que le coordinateur d'une équipe est
toujours celui qui porte cette clé. Faux pour BMAD (dont le rôle d'orchestration est `sm`), faux pour
MetaGPT (`ProjectManager`). **Le coordinateur est une propriété de la Team** (`team.coordinator`
existe déjà, et le CLI s'en sert), pas une propriété déduite d'une clé de rôle. → le gabarit doit
**désigner** son coordinateur, et non le faire **deviner** par comparaison de chaîne.

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
- **(b) Palette + garde** : conserver les 8 teintes explicites comme gabarit, et rendre **rouge**
  toute résolution où deux rôles du référentiel **chargé** partagent une teinte.

> **Reco : (b)**, en MVP. Elle satisfait F-5, n'introduit aucune régression visuelle, et laisse (a)
> ouverte. Le vrai gain de (a) — cardinal illimité — ne devient nécessaire qu'avec une méthode de
> plus de 8 rôles, cas non observé sur les cibles connues (BMAD : 6, MetaGPT : 5).

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
| **C1b** | **Absence de vocabulaire dans le cœur.** Aucun porteur du **cœur de la forge** ne conditionne son comportement à une **valeur** de rôle ; les valeurs présentes sont des **données de gabarit**, remplaçables et non opposables | dépôt `iakaFrameGUI` | F-1..F-8 (§ 4.2) |

> **La bascule tient en une phrase** : C1 exigeait que les six porteurs **s'accordent** ; C1a/C1b
> exigent que **quatre s'accordent** et que **deux n'aient rien à dire**. C'est le même mot
> « cohérence », appliqué à deux périmètres qu'il fallait séparer.

**Les autres critères hérités :**

| Critère | Sort |
|---|---|
| **C2** (parité `roleKey`↔`ROLE_OF`) | **CONSERVÉ INTACT** — parité de forme, ne nomme aucune valeur attendue. Il **est** le modèle de ce qu'on veut. Sa sortie rouge est recettée (`005f519`) ; **ne pas la rejouer, la réutiliser**. |
| **C3** (`SKILL_OVERRIDE_OF` supprimée) | **CONSERVÉ**, mais **dépend de D-2** : l'exception codée disparaît si `deploiement` est un rôle de plein droit **dans la bibliothèque**, ce qui est un fait déjà vrai (`library/roles/deploiement.md`). |
| **C13..C20** (vignette du 8ᵉ rôle) | **ABSORBÉS par F-5**, qui est strictement plus fort. C19 (non-collision Helm↔Odin) devient un **cas particulier** de F-5. **C20 est à retirer** : sa formulation (`>= CANONICAL_ROLES.length`) référence la liste fermée et **survivrait** au chantier en y réintroduisant l'autorité qu'on lui retire. |
| **C21** (`methods/iakaframe.md` accordé) | **CONSERVÉ**, rattaché à **C1a**. |
| **C22 / C23** (`method.roleKeys` ↔ union team ; `coveredByCoordinator == []`) | **CONSERVÉS, et ils montent en importance.** Ce sont des gardes de **couverture**, purement formelles — le type même d'encadrement légitime. C23 reste la **seule** parade au filet qui masque (note R.3). Leur morsure est prouvée par simulation. |

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
| **D-1** | **La lecture de la contrainte** (§ 1.2), *avec ses deux corrections* : la GUI exige la forme **et les invariants structurels** ; elle peut porter des **défauts remplaçables** mais aucune valeur **opposable**. **Tout le lot en dépend.** | valider — c'est la formulation la plus restrictive qui reste implémentable |
| **D-2** | **Le sens de la réconciliation intra-méthode (C1a).** Aligner `library/roles/` + `methods/` + `ROLE_OF` sur le **canon `personas`** (`cadrage`, `dev`, `qualite`, `design`, `documentation`), ou aligner les personas sur le vocabulaire actuel de `library/roles/` ? | **aligner sur le canon `personas`** — c'était la reco d'origine, écartée pour un coût qui n'a plus lieu d'être ; les termes de la méthode doivent porter le vocabulaire de la méthode. **Mais c'est bien le sens le plus coûteux**, et le décideur peut légitimement préférer le moins-disant : l'agnosticisme est tenu **dans les deux cas**, seule la justesse sémantique d'iakaframe est en jeu |
| **D-3** | **L'indexation** (§ 2.3) : base 0 ou base 1, et quel **ordre** fait foi ? | **base 0** (alignée sur le cœur et sur toute logique de tableau) et l'**ordre de `library/roles/`** — car après ce lot, c'est la bibliothèque qui est la source. Implique de renuméroter les 8 fiches |
| **D-4** | **Découpage** : un lot, ou deux (A = vocabulaire chargeable et frontière ; B = casting, gabarit, `DEFAULT_*`) ? | **deux** — A porte le risque et la valeur, B est mécanique. Deux gates valent mieux qu'un lot de 4 jours |
| **D-5** | **Le renommage suspendu est-il abandonné ?** (§ 3.3 — branches `d9f4e1f` / `27d8a2d`) | **abandonné**. Rien n'en est perdu sauf la garde C2, qui est sur un commit **isolé** (`005f519`) et se reprend telle quelle |

> **D-1 est bloquant** : les autres n'ont pas de sens s'il est infirmé. D-2 et D-3 peuvent être
> tranchés à l'ouverture du lot. D-4 et D-5 sont d'ordonnancement.

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
| **A4** — **Fixture de méthode étrangère** (référentiel + team + méthode) + batterie **F-1..F-8** | **0,75 j-h** |
| **B1** — Casting : index dérivé du référentiel résolu, remède (b), **F-5** ; retrait de C20 | **0,5 j-h** |
| **B2** — `DEFAULT_NAMES`/`DEFAULT_SKILLS` sortis du cœur ; `buildTeamFromRoster` dégabarisé ; **F-8** (`roleKey ===`) | **0,5 j-h** |
| **B3** — **C1a** : réconciliation intra-méthode (personas + `library/roles/` + `methods/` + `ROLE_OF`) + renumérotation **D-3** | **0,5 j-h** *(si D-2 = statu quo : **0,25**)* |
| **B4** — Reprise de C2 (`005f519`), C21/C22/C23 | **0,25 j-h** |
| **Z** — Rituel de « fini » : goldens → déployé → re-vendorage → **2 suites** | **0,25 j-h** |
| **Total** | **~4,5 j-h** — fourchette **4 à 5** |

**Complexité : haute** — supérieure au lot arrêté. Le renommage était **large mais mécanique** ; ici
on change un **modèle** (une liste codée devient une donnée chargée) dans un cœur qu'une app entière
consomme. En revanche, la découverte du § 2.1 — la voie de chargement **existe déjà** — retire le
gros du risque : on raccorde, on ne construit pas.

**Risque : moyen** — *abaissé* par rapport à R.6 (« haut »), pour une raison précise : le piège
central de R.3 (un renommage partiel silencieusement absorbé par le coordinateur, sous des tests
verts) **n'est plus au centre du lot**. Il persiste sur le seul poste **B3**, où C23 le couvre, et
B3 est le poste le plus petit et le plus isolable.

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
- `specs/instructions/decision-rolekey-reconciliation.md` — direction **rouverte** (§ 1.3)
- `specs/instructions/garde-vendor-check-cross-repo.md` — dépendance de re-vendorage
