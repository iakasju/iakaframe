# Instruction — iakaframe devient le **réservoir de frames** (library partagée + N assemblages, pointeur de frame active par projet)

> Instruction de cadrage (Gandalf, P1, 2026-07-24), sur décision explicite du décideur portée par
> Aragorn. **Cœur de l'architecture.** Lecture seule sur le code pendant le cadrage ; ce fichier est
> le seul artefact produit.
>
> **Citations par nom de section / de symbole, jamais par `chemin:ligne`.** Tous les constats des
> § 0 et § 5 ont été **mesurés sur le disque le 2026-07-24** dans `~/work/iakaframe` et
> `~/work/iakaFrameGUI` (`preuve-avant-declaration`).
>
> ✅ **Décisions du décideur — fermées, gravées, non rouvertes** (rappel, cf. brief Aragorn) :
> 1. `iakaframe` n'est plus « une frame » : c'est le **réservoir de toutes les frames iaka**.
> 2. **Une seule `library/` PARTAGÉE** = le pot commun de briques (atomes) de **toutes** les frames.
> 3. **N frames de même niveau**, chacune = un **assemblage** `method + team + binding + kit` piochant
>    des briques dans la library partagée.
> 4. La frame actuelle « iakaframe » devient le **default**.
> 5. **Pointeur `iakaframeactive` au niveau du PROJET** (propriété du lieu, pas d'état global mutable).
>    À l'init → le pointeur est posé sur le **default**. **Pas** de pointeur global, **pas**
>    d'aiguillage/dispatch à construire.
> 6. **Pointeur `iakaframe` par défaut au portefeuille** (`~/work`) = frame héritée par les nouveaux
>    projets / fallback.
> 7. Bascule de frame par le user (iakaFrameGUI ou ordre à Odin) = **backlog** — décrite ici, **pas
>    réalisée**. Idem outillage de forge `frame new`/`frame lint` = **chantier séparé**.

---

## 0. État de référence — mesuré, pas présumé

### 0.1 Le « pot commun » et les « assemblages » existent DÉJÀ, sans le nom

C'est le fait le plus structurant de ce cadrage, et il **allège massivement** le travail : la
structure que le décideur décrit est, pour l'essentiel, **déjà en place** — il lui manque un **nom**
et un **pointeur**, pas une refonte.

| Décision décideur | Réalité mesurée le 2026-07-24 |
|---|---|
| « une seule `library/` partagée = pot commun de briques » | `library/` (racine) porte déjà 8 pools d'atomes agnostiques (personas, roles, principles, rituals, guardrails, roles, scaffolds, workflows, skills). `libraryRoot()` (CLI) et `resolve_iakaframe_home()` (GUI) la résolvent par **double marqueur `library/` + `methods/`** à `<chapeau>/iakaframe`. **Elle est déjà unique et partagée.** |
| « N assemblages `method + team + binding + kit` » | `methods/`, `teams/`, `bindings/`, `kits/` sont déjà des **collections plates** (mapping dans la table `COLLECTIONS` de `library.js`) qui peuvent porter **N** entrées, résolues **par id**. `assemble(methodId, teamId, bindingId, {node})` compose déjà un assemblage en piochant par id. |
| « frame active = propriété du projet » | Deux marqueurs de projet existent déjà (§ 0.2). |

> **Conséquence.** Ce lot **ne déplace ni ne fork la library**. Il **nomme** le concept « frame »
> (un tuple d'ids déjà résoluble), pose le **pointeur**, et fait **lire ce pointeur** aux commandes.
> Ce n'est **pas** un chantier de restructuration de fichiers.

### 0.2 Deux marqueurs de projet existent déjà — le pointeur n'est pas à inventer de zéro

| Marqueur | Écrit par | Contenu mesuré | Lu par |
|---|---|---|---|
| `<projet>/.iakaframe` | `runInit` (`init.js`) | texte `clé=valeur` : `iakaframe=<version>`, `node=`, `target=`, `contract=`, `installed=` | `onboard.js` et `portfolio.js` — **existence seule**, jamais parsé pour son contenu |
| `<projet>/.claude/iakaframe-kit.json` | `runSwitch` (`switch.js`, verbe `use`/`switch`) | JSON : `methodId`, `teamId`, `bindingId`, `node`, `assembledAt` | **personne** (write-only aujourd'hui) |

> **Deux constats forts.** (1) `.iakaframe` est **déjà écrit à l'init**, **déjà porteur d'une
> version**, vit à la **racine du projet** (node-agnostique) — c'est le meilleur candidat pour le
> pointeur `iakaframeactive`. (2) `.claude/iakaframe-kit.json` est **déjà** l'assemblage résolu et
> déployé (method+team+binding+node) : c'est la **matérialisation** de la frame, complémentaire de
> l'**intention** portée par `.iakaframe`.

### 0.3 Le geste de bascule existe DÉJÀ pour partie — le backlog est plus petit qu'il n'en a l'air

`switch.js` (verbes `use`/`switch`) fait **déjà** une bascule de frame au niveau projet :
`assemble()` (refuse si casting incompatible) → sauvegarde non destructive `.claude/` →
`.claude.bak-<ts>` → déploie **les personas de la team + leurs skills** → écrit le marqueur
`.claude/iakaframe-kit.json` → `--rollback` restaure. **La bascule décideur (backlog) ne part pas de
zéro** : elle réutilise `switch` en lui faisant (a) prendre une **frame** en argument (au lieu de
`method team`) et (b) mettre à jour le pointeur `.iakaframe`. À nommer comme dépendance (§ 9), pas à
réaliser ici.

### 0.4 Ce que `iakastart` et le CLI lisent aujourd'hui — le roster figé

| Porteur | Ce qu'il lit aujourd'hui (mesuré) |
|---|---|
| skill `library/skills/iakastart/SKILL.md` | **roster des 8 agents écrit EN DUR** (tableau + banner `IAKAFRAME`). **Ne lit ni `teams/` ni le projet.** |
| rituel `library/rituals/iakastart.md` | `triggers`, `actions` génériques — ne nomme pas le compte |
| `agents.js` — `assignedPersonas(projectDir)` | lit `<projet>/.claude/agents/*.md` (empreinte déployée) **en premier** ; sinon `listPersonas()` moins `PORTFOLIO_PERSONAS` |
| `agents.js` — `fullteam()` | déploie **toute** la library de personas moins `PORTFOLIO_PERSONAS` — **ignore `teams/` et tout pointeur** |

> **Le gap réel est là.** `assignedPersonas` sait **déjà** lire l'empreinte projet ; mais `fullteam`
> et la skill `iakastart` ignorent la notion de frame. Faire lire le pointeur = **fermer ce gap**,
> pas réécrire la résolution d'agents.

### 0.5 Le modèle GUI d'un « Frame » — mono-racine, mono-assemblage

`packages/core/src/frame.ts` : un `Frame` = **une racine `IAKAFRAME_HOME`** exposant **11 types**
(8 pools + 3 collections). `resolveAssembly()` prend **`bindings[0]`** comme pivot (mono-méthode /
mono-team au MVP). `detectPortfolioFacet()` détecte la persona du rôle `portefeuille` **par rôle**.

> **Effet sur ce lot.** Le cœur GUI modélise aujourd'hui **une** frame par racine. « N frames de même
> niveau **dans la même racine partagée** » est une **notion neuve pour le cœur GUI** : sélectionner
> la frame active d'un projet reviendra à choisir **quel binding/(method,team)** est le pivot, au lieu
> de prendre `bindings[0]`. C'est le plus gros impact GUI (§ 5.2).

### 0.6 Deux collisions de vocabulaire à désamorcer — sinon le prochain lecteur se trompe

1. **`frames/`** = aujourd'hui `frames/releases/StefFrame1|2` = **exports/releases** de la méthode
   iakaframe (miroirs anonymisés). **Ce n'est PAS** un dossier de frames-pairs. Employer « frame »
   pour l'assemblage-tuple **et** pour un export sous `frames/releases/` est ambigu.
2. **`reservoir.ts`** (cœur GUI) = le **réservoir de sous-éléments** d'un élément en cours d'édition
   dans la forge (`team ← personas`, `skill ← sous-skills`, `kit ← 11 types`). **Ce n'est PAS** le
   « réservoir de frames » du décideur. Deux sens du mot « réservoir » coexisteront.

> Ces collisions n'empêchent rien mécaniquement, mais **doivent être tranchées en vocabulaire**
> (§ 3, AR-2) pour ne pas graver une ambiguïté dans le cœur de l'architecture.

---

## 1. Le problème, posé avant la solution

**iakaframe se comporte comme s'il n'existait qu'une frame, alors que sa structure en porte déjà
plusieurs — sans jamais nommer ce fait ni permettre de choisir.** La library est partagée, les
collections d'assemblages sont plates et multiples, mais : (a) aucun objet ne dit « la frame X = ce
method + ce team + ce binding + ce kit » ; (b) aucun pointeur ne dit « **ce projet** tourne sur la
frame X » ; (c) `iakastart` récite un roster figé de 8 agents sans regarder ni le projet ni `teams/`.
Résultat : impossible de faire coexister, sous le portefeuille, un projet en frame iakaframe et un
projet en frame Scrum sans que l'outillage ne récite les 8 de toujours.

Le besoin n'est donc **pas** de restructurer les fichiers (ils sont déjà au bon endroit) : c'est de
**nommer la frame, la pointer par projet, et faire lire ce pointeur**.

---

## 2. La forme retenue — frame = **assemblage nommé**, pas un dossier

> **Principe directeur : réutiliser l'existant, MVP d'abord.** Une frame est un **tuple d'ids**
> (method + team, matérialisé par binding + kit selon le nœud) qui **pioche dans la library
> partagée**. Elle n'est **pas** un dossier ; elle n'a **pas** sa propre copie de briques.

Une frame porte : un **id** (ASCII, minuscules), un **nom** lisible, une **version**, un `methodId`,
un `teamId`, et un drapeau `default` (un seul frame le porte). Les bindings/kits (par nœud) sont
résolus depuis les collections plates par `assemble(...)`. La frame `iakaframe` (default) nomme
`method: iakaframe` + `team: iakaframe-8` ; sa version = celle du dépôt (`frameworkVersion`).

### 2.1 Le default `iakaframe` reste **monté à la racine** — tranché (question déléguée)

> Le décideur a **délégué** à Gandalf le choix : le default reste-t-il à la racine (legacy) ou
> descend-il au rang d'assemblage-pair rangé dans un sous-dossier ? **Tranché : il RESTE à la
> racine.** Argumenté ci-dessous ; ce n'est pas un arbitrage rendu à la place du décideur, c'est la
> question qu'il m'a confiée.

**Pourquoi le default ne descend PAS dans un sous-dossier :**

1. **La library de la racine EST le pot commun.** Les atomes d'iakaframe **sont** les briques du
   réservoir. Les déplacer dans `frames/iakaframe/library/` **forkerait** le pool — l'exact
   contraire de « une seule library partagée ». Le default ne « possède » pas ses briques : il les
   **pioche**, comme toute autre frame.
2. **Descendre casse les deux résolveurs de racine.** `libraryRoot()` (CLI) et
   `resolve_iakaframe_home()` (GUI) ancrent la bibliothèque sur le **double marqueur
   `library/`+`methods/` à `<chapeau>/iakaframe`**. Un sous-dossier romprait la résolution, le modèle
   `Frame` du cœur GUI (une racine = 11 types), les chemins de `vendor-check` et **toutes** les
   fixtures vendorées. Coût élevé, régression garantie, **zéro bénéfice MVP**.
3. **Une frame est logique, pas physique.** Puisqu'une frame = un tuple d'ids référençant les
   collections partagées, le default est simplement **la frame dont le descripteur porte
   `default: true`**. Les frames-pairs (Scrum…) sont d'**autres descripteurs** référençant, eux
   aussi, la **même** library partagée + leurs propres method/team dans les mêmes collections plates.

**Conséquence pour la frame Scrum (`~/work/frame-scrum`, hors dépôt).** Sa `library/` **privée** est
**non conforme** au modèle : ses briques réutilisables doivent rejoindre le **pot commun** du
réservoir ; le dépôt Scrum ne conserve que son **assemblage** (son method + team + binding + kit +
descripteur de frame). Ce ré-rangement est **hors périmètre d'exécution** de ce lot (dépôt tiers)
mais **nommé** comme conséquence directe du modèle (§ 9, dépendance).

### 2.2 Arbitrages décideur — **TRANCHÉS le 2026-07-24** (§ 3)

Trois points **user-visible et/ou cross-repo structurants** relevaient du décideur, pas de Gandalf.
Il les a **tranchés le 2026-07-24** : **AR-1** = frame de **1ʳᵉ classe (nouveau type `frames`)**,
**AR-2** = renommage adopté avec **identifiants anglais**, **AR-3** = `frameVersion` = **version du
descripteur** (source unique). Détaillés et gravés au § 3. **Aucun arbitrage ne reste ouvert.**

---

## 3. Décisions de cadrage — ce que je tranche, ce que je remonte

### D-A — Frame = **assemblage nommé** référençant la library partagée. **Tranché.**
Cf. § 2. Pas de dossier par frame, pas de fork de library.

### D-B — Le default `iakaframe` **reste à la racine**. **Tranché** (question déléguée, § 2.1).

### D-C — Pointeur projet `iakaframeactive` : **dans `<projet>/.iakaframe`, en additif.** **Tranché.**

Le marqueur `.iakaframe` est **déjà** écrit à l'init, **déjà** versionné, vit à la racine du projet
(node-agnostique), et n'est lu qu'en **existence** (§ 0.2) → l'étendre est **non destructif** et sûr.
Ajout de **deux clés** : `frame=<frameId>` et `frameVersion=<version>`. Le marqueur
`.claude/iakaframe-kit.json` (écrit par `switch`) reste la **matérialisation résolue** (method /
team / binding / node) — complémentaire, pas concurrent : `.iakaframe` porte l'**intention** (quelle
frame), `iakaframe-kit.json` porte l'**assemblage déployé**. La cohérence des deux est une **garde
candidate** (§ 7, A-cohérence).

*Forme exacte des clés ajoutées à `.iakaframe` (patron `clé=valeur` existant) :*
```
iakaframe=<version-outil>      (existant, inchangé)
frame=<frameId>                (neuf — ex. iakaframe)
frameVersion=<version-frame>   (neuf — ex. v0.20.4 pour le default ; cf. AR-3)
node=… target=… contract=… installed=…   (existants, inchangés)
```

### D-D — Pointeur portefeuille par défaut : **marqueur au niveau chapeau `<hat>/`.** **Tranché.**

Le default hérité par les nouveaux projets vit au **niveau chapeau** (`~/work`, le scaffold
`portefeuille`). Recommandé : un marqueur `<hat>/.iakaframe-portefeuille` (texte `clé=valeur`)
portant `defaultFrame=iakaframe` + sa version. `init`/`onboard` **le lisent** pour stamper le
pointeur projet ; **absent → repli sur le default câblé `iakaframe`** (jamais d'échec dur). Le choix
entre un fichier dédié et un champ dans un fichier existant (`STRATEGIE.md`, ou le `settings.json`
du workspace GUI) est un **détail d'implémentation** laissé à l'exécutant, **à condition** que la
valeur soit **lisible par le CLI ET par la GUI** (source unique, comme `IAKAFRAME_HOME`).

### D-E — `iakastart` et `fullteam` lisent le pointeur du projet. **Tranché (le cœur du besoin).**

- La skill `iakastart` **cesse** de réciter un roster figé : elle **lit la frame active du projet**
  (`.iakaframe` → `frame`), résout son `team` (via le descripteur/binding), et affiche **le roster de
  cette team**. Hors d'un projet (ou pointeur absent) → **repli sur le default `iakaframe`**, roster
  actuel des 8 — **aucune régression** pour l'usage courant.
- `fullteam()` (CLI) déploie **les personas de la team de la frame active**, pas « toute la library
  moins portefeuille ». `assignedPersonas()` garde sa priorité à l'empreinte `.claude/agents/`
  déployée (déjà correct), avec repli sur **la team de la frame active** au lieu de la library
  entière.

### AR-1 — **TRANCHÉ (décideur, 2026-07-24) : frame = objet de 1ʳᵉ classe, nouveau type `frames`.**

Une frame porte son **home** : un **descripteur** par frame — une **collection plate à la racine**,
miroir exact de `teams/`, `methods/`, `bindings/`. Frontmatter : `id`, `name`, `version`, `methodId`,
`teamId`, `default` (un seul `true`). **+1 type dans la taxonomie — CLI `COLLECTIONS` 12→13, GUI
`FRAME_TYPES` 11→12** (comptes distincts, cf. § 5 note d'asymétrie `kits`), coût cross-repo
**assumé** : touche la table `COLLECTIONS` (CLI) **et** `FRAME_TYPES` (cœur GUI), `element pool`
(ex-`reservoir.ts`, cf. AR-2), `vendor-check`, `checkFrameRefs`. **Bénéfice retenu :** la frame
devient un **objet éditable dans iakaFrameGUI** (aligné « la GUI sélectionne/édite la frame active »).

> *Option écartée (trace) :* frame « dérivée » du couple (method, team) sans nouveau type — coût
> taxonomique nul mais **aucun home** pour `name`/`version`/`default` ni objet éditable. **Écartée
> par le décideur** : elle laisse le concept implicite, exactement ce que le lot doit faire cesser.

### AR-2 — **TRANCHÉ (décideur, 2026-07-24) : renommage adopté, identifiants ANGLAIS.**

Convention iakaframe : **code / identifiants / arbo / taxonomie en anglais** ; prose explicative en
français. Termes **fixés, sans ambiguïté résiduelle** :

| Sens | Terme retenu (identifiant/label, **anglais**) | Home |
|---|---|---|
| Le **dépôt iakaframe = le réservoir de toutes les frames** | **`reservoir`** (mot réservé à ce niveau) | concept, doc |
| L'**assemblage nommé** `method + team + binding + kit` | **`frame`** (mot du décideur, conservé) | type `frames`, descripteurs `frames/<id>.md` |
| Les **exports/releases** anonymisés (ex-`frames/releases/`) | **`releases`** — `frames/releases/` **→ `releases/`** | dossier `releases/` à la racine |
| Le **pool de sous-éléments** d'un élément en cours d'édition (GUI, ex-`reservoir.ts`) | **`element pool`** — types `ElementPool`, `buildElementPool`, `ELEMENT_POOL_COMPOSITION`, `ElementPoolGroup` | cœur GUI (renommé depuis `reservoir.ts`) |

- Le mot **`reservoir`** cesse de désigner le pool de sous-éléments GUI (renommé **`element pool`**)
  et **ne désigne plus que** le niveau dépôt/frame — le sens du décideur. Plus de collision.
- **`frames/`** (racine) est **libéré** pour les descripteurs de frames, puisque les exports
  descendent de `frames/releases/` vers **`releases/`**. ⚠️ Le renommage `frames/releases/` → `releases/`
  **touche `vendor-check`/`frame verify`, les guides et le miroir** ; il peut être **exécuté dans ce
  lot** (recensé § 5) ou **cadré à part** (§ 9) — mais le **terme** est acté ici.

### AR-3 — **TRANCHÉ (décideur, 2026-07-24) : `frameVersion` = version du descripteur (source unique).**

`frameVersion` est **toujours** la `version` portée par le **descripteur de frame** (AR-1) — y
compris pour le default `iakaframe` (sa `version` de descripteur, **pas** `frameworkVersion` de
l'outil). La **re-sync** compare le `frameVersion` gravé dans `<projet>/.iakaframe` à la `version`
du descripteur courant ; un écart signale un projet à re-synchroniser. Une seule source de vérité,
cohérente avec AR-1.

> *Option écartée (trace) :* `frameVersion` = version de l'**outil** pour le default et propre pour
> les tierces — **écartée** : deux sources de vérité, re-sync ambiguë.

---

## 4. Périmètre

### Dans le périmètre
- La **notion nommée de frame** (D-A) et le **descripteur** de 1ʳᵉ classe (type `frames`, AR-1 acté).
- Le **pointeur projet** dans `.iakaframe` (D-C) : écriture à l'init (`runInit`), lecture par
  `iakastart` et `fullteam`/`assignedPersonas` (D-E).
- Le **pointeur portefeuille** (D-D) : lu par `init`/`onboard` pour stamper le projet, repli câblé.
- La **fin du roster figé** dans la skill `iakastart` (D-E) : lecture de la team de la frame active,
  repli default.
- Le **vocabulaire anglais AR-2** : type `frames` + descripteurs, renommage GUI `reservoir`→
  `element pool`. Le **move `frames/releases/`→`releases/`** est **optionnel dans ce lot** (le terme
  est acté ; l'exécution peut être un lot à part, § 9) car il touche `vendor-check`/`frame verify`.
- Les **conséquences mécaniques** du § 5 (CLI + cœur GUI), la **remise au vert** des gardes touchées,
  la **mise en cohérence des comptes** doc — **distinctement** : CLI `COLLECTIONS` **12→13**, GUI
  `FRAME_TYPES` **11→12** (cf. § 5 note d'asymétrie `kits`).
- La **garde de cohérence** `.iakaframe`.frame ↔ `.claude/iakaframe-kit.json` (§ 7).

### Hors périmètre — explicitement
- **La bascule de frame par le user** (backlog) — décrite (§ 0.3, § 9), pas réalisée. `switch`
  fournit déjà 80 % du geste.
- **L'outillage de forge `frame new`/`frame lint`** (chantier séparé, déjà backlogé).
- **Le ré-rangement de `~/work/frame-scrum`** (dépôt tiers) : nommé (§ 2.1, § 9), pas exécuté.
- **Le *move physique* de `frames/releases/` → `releases/`** peut être un lot à part (le **terme**
  `releases` est **déjà acté par AR-2** ; seul le déplacement, qui touche vendor-check/`frame verify`,
  reste optionnel dans ce lot).
- **Toute documentation utilisateur** au-delà de la mise en cohérence des comptes → 📖 Nathalie.
- **Tout pointeur global / aiguillage / dispatch** : le décideur l'a exclu (la frame est propriété du
  lieu). **Ne rien construire de tel.**

---

## 5. Recensement d'impact — sur pièces, dépôt par dépôt

Un impact manquant est un défaut de cadrage. **AR-1/2/3 tranchés** : la colonne **Dépend de** dit
« acté » pour ce qui est désormais fixé (12ᵉ type, vocabulaire), et pointe une décision de cadrage
(D-x) ou une dépendance (§ 9) sinon.

### 5.1 Dépôt `iakaframe` (CLI + assets)

> **Note d'asymétrie `kits` — deux comptes à ne PAS conflater.** La table `COLLECTIONS` du CLI
> (`library.js`) porte **déjà 12** entrées (…, `teams`, `methods`, `bindings`, **`kits`**) ; `list.js`
> documente « résumé des **12** collections ». Ajouter `frames` fait donc **CLI 12→13**. Côté GUI,
> `FRAME_TYPES` (`frame.ts`) porte **11** types (8 pools + `teams`/`methods`/`bindings`) et **exclut
> `kits`** : ajouter `frames` fait **GUI 11→12**. Les deux comptes sont **corrects et différents** —
> l'écart vient de `kits`, collection côté CLI mais **non** un `FrameType` côté GUI.

| # | Fichier / symbole | Ce qui bouge | Dépend de |
|---|---|---|---|
| 1 | `cli/src/commands/init.js` — `runInit` | ajoute `frame=` + `frameVersion=` au marqueur `.iakaframe` ; lit le pointeur portefeuille (D-D) pour choisir la frame, repli `iakaframe` | D-C/D-D |
| 2 | `cli/src/commands/onboard.js` — `runOnboard` | propage le choix de frame à `runInit` ; le mode `umbrella` peut poser le marqueur portefeuille | D-D |
| 3 | `cli/src/lib/agents.js` — `fullteam`, `assignedPersonas` | déploie/résout **la team de la frame active** au lieu de « toute la library moins portefeuille » ; source = pointeur `.iakaframe` → descripteur/team | D-E |
| 4 | `library/skills/iakastart/SKILL.md` | **fin du roster en dur** : lit la frame active du projet, affiche le roster de sa team ; repli default `iakaframe` (8) hors projet | D-E |
| 5 | `library/rituals/iakastart.md` | `actions` reformulées : « afficher le roster **de la frame active** » (au lieu d'un compte figé) | D-E |
| 6 | `cli/src/lib/library.js` — table `COLLECTIONS`, `checkRefs`, `checkSchema`, `ADD_DIR` | **acté (AR-1)** : +1 collection `frames` (`dir: frames`, `kind: flat`, `label: name`), règles d'intégrité (`methodId`∈methods, `teamId`∈teams), schéma requis (`id`,`methodId`,`teamId`), `ADD_DIR.frame='frames'` | acté |
| 7 | nouveau `frames/iakaframe.md` (descripteur du default) | frontmatter `id: iakaframe`, `name`, `version`, `methodId: iakaframe`, `teamId: iakaframe-8`, `default: true` | acté |
| 8 | `cli/src/commands/list.js` + `inventory()` | `iakaframe list` affiche la collection `frames` ; compte CLI `COLLECTIONS` **12→13** ; le texte « résumé des 12 collections » de `list.js` → **13** | acté |
| 9 | `cli/src/lib/vendor.js` — `fixtureTable`, `IDS`/comptes | si le descripteur default est vendoré cross-repo, ajouter sa ligne + ajuster les comptes ; **le renommage `frames/releases/`→`releases/` (AR-2) peut déplacer des chemins de `frame verify`** | acté (AR-1/AR-2) |
| 10 | `cli/src/commands/switch.js` — `runSwitch` | (bascule = backlog) mais **écrire le pointeur `.iakaframe`.frame** en plus de `iakaframe-kit.json` est le pont naturel — **à cadrer avec la bascule**, pas forcément ici | § 9 |
| 11 | `cli/src/commands/frame.js` + `cli/src/lib/frame.js` (`DEFAULT_FRAME`) | `frame verify` cible `frames/releases/StefFrame2` → **`releases/StefFrame2`** après le renommage AR-2 ; sinon inchangé | acté (AR-2) |
| 11b | dossier `frames/releases/` → **`releases/`** | déplacement des exports StefFrame1/2 ; **peut être un lot à part** (§ 9) — le **terme** est acté, l'exécution du move est optionnelle ici | AR-2 |
| 12 | `docs/commandes.md`, guides | comptes **distincts** : CLI `COLLECTIONS` **12→13**, GUI `FRAME_TYPES` **11→12** (note d'asymétrie `kits`) ; description du pointeur de frame + du type `frames` | acté |
| 13 | `cli/test/library.test.js`, `agents.test.js`, `init-kit-resolve.test.js` | assertions de compte de collection CLI (**13**) ; `.iakaframe` porte `frame=`+`frameVersion=` ; `fullteam` déploie la team de la frame active | acté |

### 5.2 Dépôt `iakaFrameGUI` (cœur + forge)

| # | Fichier / symbole | Ce qui bouge | Dépend de |
|---|---|---|---|
| 14 | `packages/core/src/frame.ts` — `FRAME_TYPES`, `FRAME_TYPE_LABELS`, `buildFrame`, `parseFrame` | **acté (AR-1)** : 11→12 types (+`frames`) ; `FRAME_TYPE_LABELS` gagne la clé `frames` (le type `Record<FrameType,…>` **force** la MAJ à la compilation — garde native) ; `frames` = collection à plat (comme teams/methods/bindings) | acté |
| 15 | `packages/core/src/frame.ts` — `resolveAssembly` | aujourd'hui pivot = `bindings[0]`. Pour « **frame active** parmi N », le pivot devient **le binding/(method,team) de la frame sélectionnée** (résolue depuis le descripteur `frames`) — cœur du changement mono→multi | acté (AR-1) |
| 16 | `packages/core/src/reservoir.ts` → **`element-pool.ts`** (AR-2) | **renommage acté** : `reservoir.ts`→`element-pool.ts`, `ReservoirElement`→`ElementPoolTarget`, `RESERVOIR_COMPOSITION`→`ELEMENT_POOL_COMPOSITION`, `buildReservoir`→`buildElementPool`, `Reservoir`/`ReservoirGroup`→`ElementPool`/`ElementPoolGroup`. Le mot `reservoir` est **libéré** pour le sens dépôt/frame. `frames` **ne compose pas** `kit`/`frame` (une frame ne se compose pas de frames) | acté (AR-2) |
| 17 | `src-tauri/src/paths.rs` — résolution racine | **inchangé** pour la library partagée (une racine = un `reservoir`). Ajout possible : lecture du pointeur portefeuille (D-D) si la GUI le pose/lit | D-D |
| 18 | `src-tauri/src/library_store.rs` | **acté (AR-1)** : +1 type `frames` dans l'allow-list de lecture | acté |
| 19 | `src/components/SettingsRoot.tsx`, `src/forge/ForgeShell.tsx`, `OpenFramePanel` | **où iakaFrameGUI sélectionne/édite la frame active** : un sélecteur qui écrit le pointeur projet/portefeuille + l'édition du descripteur `frames` (AR-1 rend la frame éditable). **Neuf.** MVP = affichage + sélection ; l'écriture peut être différée au lot bascule | D-D/§ 9 |
| 20 | `packages/core/__tests__/`, `src/forge/*.test.ts` (dont les tests ex-`reservoir`) | **acté** : comptes de types (12), fixtures, `checkFrameRefs` ; renommer les tests `reservoir`→`element-pool` | acté |

> **Le plus gros risque GUI est l'entrée 15** : passer de « `bindings[0]` = la frame » à « la frame
> **active** est le pivot » touche le modèle central `Frame`. À éprouver tôt.

### 5.3 Hors dépôts — à signaler, jamais à écrire
`~/.claude/CLAUDE.md` (global) et `~/.claude/agents/` portent le roster déployé. **Aucun agent n'y
écrit** : le lot les **signale** au décideur. Idem `~/work/frame-scrum` (dépôt tiers, § 2.1).

---

## 6. Ré-ancrage de `role-frame-builder.md` (Fëanor) — amendement dépendant

> **Ce lot (gate P1 PASS) est reconditionné par le réservoir.** Il n'est **pas réécrit ici** : je
> nomme précisément ce qui doit être **relu/amendé**, et l'**ordre**.

`role-frame-builder.md` a été cadré **avant** que « iakaframe = réservoir » ne soit acté. Trois de ses
fondations bougent, et une se **renforce** :

1. **Sa frontière « par cible » (§ 2.1) devient une frontière « frame du réservoir vs default ».**
   Fëanor y est défini comme agissant sur « **un frame NEUF, ailleurs, appartenant au tiers** », par
   opposition à Gimli qui agit sur « le frame iakaframe (CE dépôt) ». Dans le modèle réservoir, la
   ligne se reformule : **Gimli maintient le réservoir et la frame default ; Fëanor forge une frame
   X (nouvelle ou tierce) qui pioche dans le pot commun partagé.** La cible n'est plus « quel dépôt »
   mais « **quelle frame du réservoir** » — potentiellement **dans le même réservoir**. Les tests de
   non-recouvrement N1/N2/N3 doivent être **relus** sous cet angle (la cible « dépôt tiers » devient
   « frame ≠ default », qui peut vivre dans le réservoir partagé).
2. **Sa « boucle library » devient le pot commun partagé.** Là où Fëanor scaffoldait une `library/`
   **propre au frame tiers**, le modèle réservoir dit : **une frame n'a pas sa library ; elle pioche
   dans le pot commun**. Fëanor **enrichit le pot commun** (briques neuves) + **assemble** un tuple.
   C'est exactement la correction à appliquer à `~/work/frame-scrum` (§ 2.1). Le § 2 « ce que le rôle
   EST » de `role-frame-builder.md` doit être **amendé** en ce sens.
3. **Fëanor = résident iakaFrameGUI.** Son activation explicite (D-G de `role-frame-builder.md`) et sa finalité
   « forger un frame » le placent naturellement **dans la forge** (iakaFrameGUI), là où l'entrée 19
   (§ 5.2) situe la sélection/forge de frames. À **relier** explicitement.

**Dépendance et ordre.** Le présent lot (réservoir) est **structurant** ; `role-frame-builder.md`
en **dépend**. Recommandation : **cadrer/exécuter le réservoir d'abord** (il fixe le vocabulaire
« frame », le pot commun, le pointeur), **puis amender `role-frame-builder.md`** en un **lot
d'amendement dépendant** (pas une réécriture). Tant que le réservoir n'est pas acté, la frontière de
Fëanor repose sur un « par cible » qui va changer de sens — engager Fëanor avant serait bâtir sur un
socle qui bouge. **Ne pas exécuter `role-frame-builder.md` avant que ce lot soit gaté.**

---

## 7. Critères d'acceptation — numérotés, mesurables

**Structure & vocabulaire**
- **A1** — La library reste **unique et partagée** : `libraryRoot()` (CLI) et
  `resolve_iakaframe_home()` (GUI) résolvent **la même racine** par le double marqueur, **inchangés**.
  Aucune brique n'est déplacée hors de `library/`.
- **A2** — Le default `iakaframe` **reste monté à la racine** : `methods/iakaframe.md`,
  `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md` sont **au même endroit** qu'avant
  (diff = 0 déplacement).
- **A3** — Une frame est **nommée** et résoluble : il existe un **descripteur** (type `frames`, AR-1)
  associant `frame=iakaframe` → `method: iakaframe` + `team: iakaframe-8` + `default: true` + version.

**Pointeur projet & portefeuille**
- **A4** — Après `iakaframe init`, `<projet>/.iakaframe` porte `frame=<id>` **et**
  `frameVersion=<v>`, en **plus** des clés existantes (aucune clé existante retirée/altérée).
- **A5** — En l'absence de pointeur portefeuille, `init` pose `frame=iakaframe` (repli câblé, jamais
  d'échec). En présence de `<hat>/.iakaframe-portefeuille` (ou équivalent tranché en D-D), `init`
  **hérite** de sa `defaultFrame`.
- **A-cohérence** — Une garde constate que `.iakaframe`.frame et `.claude/iakaframe-kit.json`
  (method/team) **désignent la même frame** quand les deux existent ; divergence = signalée.

**Lecture par iakastart & CLI (le cœur du besoin)**
- **A6** — La skill `iakastart` **ne contient plus de roster figé de 8 agents** : dans un projet en
  frame X, elle affiche **le roster de la team de X** ; hors projet / pointeur absent, elle affiche
  le default (8). (`grep "roster des 8 agents"` dans la skill ⇒ 0.)
- **A7** — `fullteam()` déploie **exactement les personas de la team de la frame active** ; un projet
  pointant une frame à team réduite ne reçoit **pas** les 8 par défaut.
- **A8** — `assignedPersonas()` conserve la priorité à l'empreinte `.claude/agents/` ; son **repli**
  est **la team de la frame active**, pas la library entière.

**Non-régression & gates**
- **A9** — Les deux suites (`iakaframe` et `iakaFrameGUI`) sont vertes ; le compte de tests **ne
  diminue pas**.
- **A10** — `iakaframe vendor-check` rend **OK, drift 0** avec l'inventaire **exact** attendu, comptes
  ajustés pour le type `frames` (et pour le move `releases/` s'il est exécuté ici).
- **A11** — Aucune régression de l'usage courant : un projet iakaframe existant, sans re-init, se
  comporte comme avant (pointeur absent → repli default).
- **A12** — Les arbitrages **AR-1/AR-2/AR-3 sont TRANCHÉS (décideur, 2026-07-24) et gravés au § 3** :
  frame de 1ʳᵉ classe (type `frames`), vocabulaire anglais (`reservoir`/`frame`/`releases`/`element
  pool`), `frameVersion` = version du descripteur. **Aucun arbitrage n'est ouvert.**
- **A13** — Le renommage GUI est complet : `grep -ri "reservoir"` dans le cœur GUI ne désigne plus le
  pool de sous-éléments (seul le sens dépôt/frame subsiste) ; les symboles `ElementPool*` existent.

---

## 8. Invariants — à ne pas casser
- **Une seule library partagée** — jamais de library par frame (A1).
- **Le default reste à la racine** — jamais de sous-dossier `frames/iakaframe/` (A2).
- **Pas de pointeur global / d'aiguillage** — la frame est propriété du **lieu** (projet), pas un
  état mutable global (décision décideur).
- **Additif, non destructif** — `.iakaframe` gagne des clés, n'en perd aucune ; `switch`/`use`
  restent non destructifs.
- **Repli toujours défini** — pointeur absent → default `iakaframe` ; jamais d'échec dur.
- **I1/I3/E2** — assemblages = ids seulement ; personas pures ; la méthode ne nomme aucune persona.
  Un descripteur de frame ne porte **que des ids** (method/team), aucun corps recopié.
- **Le canon est l'autorité** — la frame active se résout depuis le pointeur + les collections, pas
  depuis une table codée.

---

## 9. Dépendances — déclarées
1. **Bascule de frame par le user (backlog)** — `switch`/`use` fournit déjà `assemble` + déploiement
   + sauvegarde + rollback ; il lui manque (a) prendre une **frame** en argument, (b) écrire
   `.iakaframe`.frame. **Ce lot pose le pointeur qu'elle mettra à jour.** À cadrer à part.
2. **Outillage de forge `frame new`/`frame lint`** (chantier séparé) — consommera le descripteur de
   frame (type `frames`, AR-1). Dépendance de vocabulaire, pas d'ordre bloquant.
3. **`role-frame-builder.md` (Fëanor)** — **dépend de ce lot** (§ 6). Amender **après**, jamais avant.
4. **Ré-rangement de `~/work/frame-scrum`** — sa library privée → pot commun ; le dépôt ne garde que
   son assemblage. Conséquence directe du modèle ; dépôt tiers, hors exécution ici.
5. **Renommage éventuel de `frames/releases/`** (AR-2) — touche `vendor-check`/`frame verify`, les
   guides et le miroir. À cadrer séparément si retenu.
6. **`vocabulaire-roles-agnostique.md`** — non lié directement, mais le 12ᵉ type (AR-1 acté) re-pose
   le même « compte gravé dans le cœur GUI » qu'il combat ; à connaître (audit des consommateurs, R4).

---

## 10. Risques et défauts relevés

| # | Risque / défaut | Portée | Traitement |
|---|---|---|---|
| R1 | **Descendre le default en sous-dossier** casserait les résolveurs de racine, le modèle `Frame`, vendor-check, les fixtures | cross-repo | **Écarté (D-B/§ 2.1)** : le default reste à la racine |
| R2 | **`resolveAssembly` = `bindings[0]`** ne sait pas choisir « la frame active » parmi N | cœur GUI | § 5.2 entrée 15 — changement de modèle mono→multi, à éprouver tôt |
| R3 | **Collisions de vocabulaire** (`frames/` releases ; `reservoir` sous-éléments) | architecture | **Résolu (AR-2 tranché)** : `frame`/`releases`/`reservoir`/`element pool` fixés en anglais (§ 3) |
| R4 | **12ᵉ type** re-pose le « compte gravé » côté cœur GUI (leçon `vocabulaire-roles-agnostique`) | GUI | **Acté (AR-1)** : le `Record<FrameType,…>` **force** la MAJ à la compilation (garde native) ; **l'audit des consommateurs reste dû** (poste § 11) |
| R5 | **`frameVersion` ambigu** (outil vs frame) pour le default | pointeur | **Résolu (AR-3 tranché)** : version = celle du **descripteur**, source unique |
| R6 | **Divergence `.iakaframe` ↔ `iakaframe-kit.json`** après une bascule qui n'écrit qu'un des deux | runtime | A-cohérence — garde de cohérence des deux marqueurs |
| R7 | **`~/.claude/` hors dépôt** garde un roster de 8 après le lot | runtime | § 5.3 — signalé, jamais écrit par un agent |
| R8 | **Régression silencieuse de l'usage courant** si le repli default n'est pas câblé | CLI | A5/A11 — repli obligatoire, testé |
| R9 | **Sur-ingénierie** : construire un aiguillage/pointeur global non demandé | méthode | § 4 hors périmètre — **interdit** ; la frame est propriété du lieu |
| R10 | **Fëanor bâti sur un socle mouvant** si `role-frame-builder.md` est exécuté avant | ordonnancement | § 6/§ 9 — réservoir d'abord, amendement ensuite |

---

## 11. Estimation — jalon P1→P2

> **Ordre de grandeur assumé et révisable, jamais un engagement ferme.** **AR-1 étant tranché
> (frame = nouveau type de 1ʳᵉ classe), l'estimation est verrouillée sur ~4,25 j-h** — la taxe du
> 12ᵉ type cross-repo est **incluse**, non plus optionnelle.

### 11.1 Postes

| Poste | Charge |
|---|---|
| Descripteur de frame default + collection `frames` (CLI : `COLLECTIONS`, `checkRefs`, `list`) | 0,4 |
| Pointeur projet `.iakaframe` (écriture init + lecture) + tests | 0,3 |
| Pointeur portefeuille + héritage init/onboard + repli + tests | 0,3 |
| `fullteam`/`assignedPersonas` lisent la team de la frame active + tests | 0,4 |
| Skill `iakastart` + rituel : fin du roster figé, lecture de la frame, repli default | 0,4 |
| Garde de cohérence `.iakaframe` ↔ `iakaframe-kit.json` | 0,2 |
| Cœur GUI : `FRAME_TYPES` 11→12, `frame.ts`, renommage `reservoir`→`element pool`, `resolveAssembly` pivot par frame active | 0,6 |
| Sélecteur de frame active GUI (affichage + sélection ; écriture MVP ou différée) | 0,4 |
| `vendor-check` + fixtures (si descripteur vendoré) + comptes doc | 0,3 |
| Audit des consommateurs GUI du compte de types (R4) | 0,3 |
| Rituel de « fini » : goldens → déployé → re-vendorage → 2 suites | 0,25 |
| **Total (VERROUILLÉ)** | **~4,25 j-h** *(fourchette 3,5 – 5,5)* |

> *Trace — option écartée par le décideur (AR-1) :* frame « dérivée » sans nouveau type ≈ **~2,5 j-h**
> (supprimait les postes descripteur/12ᵉ type/audit des consommateurs) — **écartée** au prix de
> l'absence d'objet frame éditable/versionné. Conservée ici comme trace, non retenue.

### 11.2 Complexité, risque, gate
**Complexité : moyenne-haute.** **Risque : moyen.** **Gate : Legolas**
(typecheck/lint/tests + `vendor-check`).
- *Ce qui abaisse le risque* : la structure existe déjà (§ 0.1) ; le geste est **additif** (repli
  default garantit la non-régression) ; le `Record<FrameType,…>` du cœur GUI **mord** à la compilation.
- *Ce qui le maintient à moyen* : **cross-repo obligatoire** (12ᵉ type) ; le passage `resolveAssembly`
  mono→multi touche le **modèle central** du cœur GUI ; trois arbitrages (AR-1/2/3) conditionnent le
  chiffre et **doivent être rendus avant** l'exécution.

### 11.3 Inconnues susceptibles de faire glisser le chiffre
*(AR-1/2/3 tranchés : plus d'inconnue d'arbitrage. Restent des inconnues d'exécution.)*
1. **`resolveAssembly` multi-frame** (R2) : ampleur réelle non mesurée au fichier près côté GUI —
   inconnue n° 1, à éprouver en premier.
2. **Consommateurs du compte de types** (R4) : à inventorier tôt (12ᵉ type acté).
3. **Sélecteur GUI** : MVP (affichage) vs écriture réelle du pointeur (chevauche la bascule backlog).
4. **Move `frames/releases/`→`releases/`** (AR-2) : si exécuté dans ce lot plutôt qu'à part, il
   s'ajoute (touche `vendor-check`/`frame verify`, guides, miroir) — d'où son statut optionnel (§ 4/§ 9).

---

## 12. Fichiers de référence
*(Par nom de section / de symbole, jamais par `chemin:ligne`.)*

**Dépôt `iakaframe`**
- `cli/src/lib/library.js` — table `COLLECTIONS`, `libraryRoot`, `checkRefs`, `checkSchema`,
  `ADD_DIR`, `assemble` (le point d'ajout d'un type `frames`)
- `cli/src/lib/agents.js` — `fullteam`, `assignedPersonas`, `PORTFOLIO_PERSONAS`, `ROLE_OF`/`SKILL_OF`
- `cli/src/commands/init.js` — `runInit` (écriture du marqueur `.iakaframe`)
- `cli/src/commands/onboard.js` — `runOnboard`, `runUmbrella` (niveau chapeau)
- `cli/src/commands/switch.js` — `runSwitch` (bascule projet existante + marqueur `iakaframe-kit.json`)
- `cli/src/commands/frame.js` — `frame verify` (anonymisation du miroir `frames/releases/`)
- `cli/src/lib/kit.js` — `frameworkRoot`, `frameworkVersion`, `hasFrameworkMarker`
- `library/skills/iakastart/SKILL.md` — le **roster figé** à supprimer ; `library/rituals/iakastart.md`
- `library/scaffolds/projet.md`, `library/scaffolds/portefeuille.md` — niveaux projet/portefeuille
- `cli/src/lib/vendor.js` — `fixtureTable`, `IDS`, comptes (si descripteur vendoré)
- `methods/iakaframe.md`, `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md` — l'assemblage
  du default (reste à la racine)

**Dépôt `iakaFrameGUI`**
- `packages/core/src/frame.ts` — `FRAME_TYPES`, `FRAME_TYPE_LABELS`, `resolveAssembly`, `buildFrame`,
  `parseFrame`, `checkFrameRefs` (le cœur du modèle mono→multi)
- `packages/core/src/reservoir.ts` — `RESERVOIR_COMPOSITION` (collision de vocabulaire, AR-2)
- `src-tauri/src/paths.rs` — `resolve_iakaframe_home`, `is_library_home` (racine partagée, inchangée)
- `src-tauri/src/library_store.rs` — allow-list de lecture des types
- `src/components/SettingsRoot.tsx`, `src/forge/ForgeShell.tsx` — où sélectionner la frame active

**Instructions liées**
- `specs/instructions/role-frame-builder.md` — **dépend de ce lot** ; à amender après (§ 6)
- `specs/instructions/place-odin-roster-portefeuille.md` — précédent du marqueur « hors dispatch »
- `specs/instructions/vocabulaire-roles-agnostique.md` — leçon du « compte gravé » côté cœur GUI
