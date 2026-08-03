# Correctif — l'aide en ligne `<verbe> --help` est inatteignable sur 19 des 36 entrées du CLI

> Cadrage P1 (2026-08-03). Origine : constat de Legolas du 2026-07-21 sur le verbe `open`, assorti
> d'une note « à vérifier sur les autres verbes » jamais honorée. Ce cadrage honore cette note :
> le balayage est fait, il ferme le périmètre.

## Outillage du cadreur (déclaration)

**`Bash` INDISPONIBLE.** Ce cadrage a été mené avec `Read` / `Grep` / `Glob` uniquement. En
conséquence :

- **aucune commande n'a été exécutée** — ni `node`, ni `npm test`, ni `iakaframe` ;
- tout constat ci-dessous est un **constat de lecture**, traçable au `chemin:ligne` ;
- les points qui exigent une exécution sont **explicitement marqués « à mesurer par l'exécutant »**
  et ne sont pas présentés comme établis.

**Branche sortie au moment du cadrage** : `feat/models-par-rolekey`
(`/Users/sjupin/work/iakaframe/.git/HEAD`). Les numéros de ligne cités valent sur cette branche.
Les critères d'acceptation ne référencent que des **symboles** et des **comportements
observables**, jamais un numéro de ligne.

**Fait externe vérifié (web)** : `util.parseArgs` est **stable depuis Node 20.0.0** (« The API is
no longer experimental »), accepte un alias court via `short: 'h'`, et lève en mode `strict`
(défaut) sur option inconnue. Source : <https://nodejs.org/api/util.html#utilparseargsconfig>.
`cli/package.json:9-11` déclare `"node": ">=20"` : le socle est donc acquis, **aucune dépendance
tierce n'est nécessaire** et la contrainte zéro-dépendance est tenue sans concession.

---

## 0. Faits du brief corrigés ou nuancés

Trois rectifications. Elles ne changent pas la nature du lot, elles en changent le **périmètre** et
la **preuve**.

### 0.1 — Le constat de Legolas est exact au caractère près

`cli/src/commands/open.js:14` déclare bien `const USAGE = ...` ; `runOpen` (l. 31) ne le référence
**nulle part** ; l. 42 fait `} catch (e) { return fail(false, e.message); }`. Le nom de fonction et
le numéro de ligne du brief sont **corrects**. Rien à corriger de ce côté.

### 0.2 — ÉCART : `open --help` devrait sortir en **1**, pas en **0**, d'après le code

Le brief mesure `exit=0`. **La lecture du code dit l'inverse** et je ne peux pas trancher sans
exécuter :

- `open.js:42` appelle `fail(false, e.message)` ;
- `cli/src/lib/output.js:41-52` — `fail()` fait `console.error(message)` **puis
  `process.exitCode = 1`** (l. 51), inconditionnellement.

Rien, entre cet appel et la fin de `main()` (`cli/src/index.js:161-213`), ne remet `process.exitCode`
à 0. **Par lecture, `open --help` sort en 1.** Le `exit=0` mesuré n'est pas reproductible par
lecture : soit la mesure a capté le code de retour d'autre chose (pipeline, wrapper, substitution),
soit un élément m'échappe.

> **À mesurer par l'exécutant, en tout premier geste du lot** : relever le code de sortie réel de
> `node cli/src/index.js open --help` et le consigner. Ce n'est pas un préalable bloquant — le
> correctif et ses critères sont valides dans les deux cas, puisque le comportement **attendu**
> (exit 0 **+ aide sur stdout**) diffère du comportement actuel quel que soit le code de sortie
> observé aujourd'hui.

### 0.3 — Le défaut (b) « le code de sortie ment » est RÉEL, mais pas là où le brief le situe

Le balayage a trouvé **deux** cas d'échec silencieux vérifiés par lecture, tous deux **hors**
`open` :

- **`root --help`** — `cli/src/index.js:203-207` : le verbe `root` n'utilise pas `parseArgs` du
  tout. Il cherche `rest.indexOf('--root')`, ne trouve rien, **imprime le dossier chapeau et sort
  en 0**. L'utilisateur a demandé une aide, il reçoit un chemin et un succès. C'est l'archétype du
  défaut (b).
- **`models --<n'importe quoi>`** — `cli/src/commands/models.js:695-698` : le `catch` autour de
  `parseArgs` fait `console.log(HELP); return;` **sans positionner `process.exitCode`**. Toute
  option inconnue est donc absorbée en **succès**. Un script qui teste `$?` conclut que tout va
  bien.

Le défaut (b) est donc bien à traiter, indépendamment de (a) — comme le demande le brief — mais son
inventaire réel est celui-ci, pas `open`.

### 0.4 — Ce lot n'ouvre pas un chantier : il **termine** un chantier laissé à moitié

`cli/test/help-systemique.test.js` existe déjà (lot `fix/help-systemique`) et fige une **liste
écrite à la main de 10 verbes** (l. 17) : `snapshot, update, onboard, repo, switch, list, show,
add, assemble, banner`. `cli/test/jalon-help.test.js` couvre `jalon`. Le correctif précédent a
donc traité un **sous-ensemble**, et sa garde a **gelé ce sous-ensemble au lieu de couvrir la
table des verbes**. Les 19 entrées restantes sont passées au travers sans que rien ne le signale.

C'est exactement la faute que le dépôt dénonce déjà lui-même à `cli/src/index.js:43-45` :

> « L'aide avait fige « 21 fixtures (17 copies) » alors que la garde en verifiait 82 — un nombre
> duplique a la main finit toujours par mentir. »

Une **liste de verbes** dupliquée à la main ment de la même façon. **La direction technique
retenue au § 2 en découle directement** : sans source unique, ce lot sera à refaire au prochain
verbe ajouté.

---

## 1. Problème

Sur les **36 entrées** du dispatch de `cli/src/index.js:167-207`, **19 n'ont aucun traitement de
`--help`** : l'utilisateur qui demande l'aide d'un verbe reçoit soit une erreur de parsing, soit
une trace de pile nue, soit — pire — une sortie sans rapport assortie d'un code de succès. La garde
censée empêcher cela enferme une liste de verbes écrite à la main, donc muette sur tout verbe
ajouté depuis.

### 1.1 Inventaire — le balayage qui ferme le périmètre

Méthode : lecture de `cli/src/index.js:167-207` (table de dispatch) puis, pour chaque module de
`cli/src/commands/`, recherche de la déclaration `help: { type: 'boolean' }` **et** de sa
consommation `if (values.help) { console.log(USAGE); return; }`. Les deux doivent être présentes
pour que le verbe soit compté comme traité.

**A. 17 entrées TRAITÉES — hors périmètre du lot** (aucune modification attendue) :

| Entrée | Traitement |
|---|---|
| `onboard` | `commands/onboard.js:68,71` |
| `snapshot` | `commands/snapshot.js:221,224` |
| `update` | `commands/update.js:63,66` |
| `repo` | `commands/repo.js:45,48` |
| `banner` | `commands/banner.js:19,21` |
| `jalon` | `commands/jalon.js:37,40` |
| `list` | `commands/list.js:31,34` |
| `show` | `commands/show.js:27,30` |
| `add` | `commands/add.js:37,40` |
| `assemble` | `commands/assemble.js:37,40` |
| `switch` / `use` | `commands/switch.js:51,54` (une seule implémentation, deux entrées) |
| `close` | `commands/close.js:28,32` |
| `consolidate` | `commands/consolidate.js:31,35` |
| `review` | `commands/review.js:43,47` — **traité mais porteur d'un autre défaut, cf. § 1.2** |
| `models` | `commands/models.js:692,699` — **traité mais porteur du défaut (b), cf. § 0.3** |
| `frame` | `commands/frame.js:77,95` + sous-verbes `lint` (l. 127), `new` (l. 168), `use` (l. 207) |

**B. 19 entrées NON TRAITÉES — le périmètre du lot :**

| Entrée | Module | État de l'aide | Comportement actuel sur `--help` |
|---|---|---|---|
| `init` | `commands/init.js` | pas de `USAGE` | `parseArgs` lève, non rattrapé → trace de pile, exit 1 |
| `services` | `commands/services.js` | pas de `USAGE` | idem |
| `config` | `commands/config.js` | pas de `USAGE` | idem |
| `agents` | `commands/agents.js` | pas de `USAGE` | idem |
| `skills` | `commands/skills.js` | pas de `USAGE` | idem |
| `go` | `commands/go.js:53-56` | pas de `USAGE` | idem |
| `brief` | `commands/brief.js` | pas de `USAGE` | idem |
| `recap` | `commands/recap.js` | pas de `USAGE` | idem |
| `remove` | `commands/remove.js:26-32` | pas de `USAGE` (message inline l. 37) | idem |
| `attach` | `commands/attach.js:12-18` | pas de `USAGE` (message inline l. 31) | idem |
| `detach` | `commands/attach.js:12-18` | idem | idem |
| `vendor-check` | `commands/vendor-check.js:254-262` | pas de `USAGE` | idem |
| `portfolio` | `commands/portfolio.js:14-21` | pas de `USAGE` | idem |
| `open` | `commands/open.js:14` | **`USAGE` écrit, jamais référencé** | rattrapé l. 42 → `fail(false, …)` → message + exit 1 *(à mesurer, cf. § 0.2)* |
| `produit` | `commands/produit.js:20` | **`USAGE` écrit, jamais sur `--help`** | rattrapé l. 49 → `fail(false, …)` → message + exit 1 |
| `memory` | `commands/memory.js:13` | **`USAGE` écrit, jamais sur `--help`** | `parseArgs` lève, non rattrapé → trace de pile, exit 1 |
| `recall` | `commands/recall.js:11` | **`USAGE` écrit, jamais sur `--help`** | idem |
| `observe` | `commands/observe.js:9` | **`USAGE` écrit, jamais sur `--help`** | idem |
| `root` | `cli/src/index.js:203-207` | pas de `USAGE`, **pas de `parseArgs`** | **imprime le chemin chapeau, exit 0** — défaut (b) |

**Verdict de balayage : le défaut est SYSTÉMIQUE** (19 entrées sur 36, soit 5 modules qui ont
écrit leur `USAGE` sans jamais le brancher, 13 qui n'en ont aucun, et 1 verbe sans parsing du
tout). Il n'est **pas** isolé à `open`. La correction doit donc être systémique.

### 1.2 Défaut connexe relevé au balayage : `review` détruit son propre message d'usage

`cli/src/commands/review.js:64` :

```js
default:       return fail(USAGE, json);
```

La signature est `fail(json, message, diag, humanFn)` (`cli/src/lib/output.js:41`). **Les deux
arguments sont inversés.** `USAGE` (chaîne non vide, donc *truthy*) est pris pour le drapeau
`json`, et `json` (booléen `false`) pour le message. Conséquence : `iakaframe review` sans action —
ou avec une action inconnue — imprime sur stdout, **même hors mode `--json`** :

```json
{
  "ok": false,
  "error": false
}
```

L'usage est perdu, et la convention C-JSON de `specs/instructions/cli-api-surface-harmonisation.md`
§ 4 est violée (sortie machine émise sans que `--json` ait été demandé). Le code de sortie, lui,
reste correct (1). C'est le même défaut de fond — *un usage rédigé mais rendu inatteignable* — donc
il entre dans le périmètre.

---

## 2. Décision retenue

**Une seule direction, tranchée ici. Le développeur n'a rien à arbitrer.**

> **Interception centralisée de `--help` / `-h`, pilotée par une table de verbes qui devient la
> source unique — partagée par le dispatch ET par la garde de test.**

### 2.1 Ce qui est retenu

1. **Extraire la table de dispatch** de `cli/src/index.js` vers un nouveau module
   `cli/src/router.js`, sous la forme d'un objet exporté :

   ```js
   export const ROUTES = {
     onboard: { run: runOnboard, usage: ONBOARD_USAGE },
     // …une entrée par verbe, y compris `use` (alias de `switch`) et `root`
     frame:   { run: runFrame,   usage: FRAME_USAGE, selfHelp: true },
   };
   ```

   `index.js` reste le point d'entrée (shebang, `HELP` global, `main()`), mais **dispatche via
   `ROUTES`** au lieu d'un `switch`. Cette extraction n'est pas un ornement : `index.js` exécute
   `main()` à l'import (l. 215), donc **rien ne peut y être importé depuis un test** sans lancer le
   CLI. C'est précisément pourquoi la garde actuelle a dû recopier sa liste à la main. Le module
   `router.js` est importable sans effet de bord : il rend la garde dérivable.

2. **Intercepter `--help` / `-h` dans `main()`, avant la délégation** : si les arguments du verbe
   contiennent `--help` ou `-h` et que l'entrée n'est pas marquée `selfHelp`, imprimer
   `ROUTES[cmd].usage` sur **stdout** et sortir en **0**. Un seul point de passage, donc un seul
   comportement possible pour les 36 entrées.

3. **`selfHelp: true` pour `frame` uniquement** : `frame` route ses sous-verbes avant son propre
   `HELP` (`commands/frame.js:83-88`) pour que `frame lint --help` rende l'aide du *lint* et non
   celle de `verify` — le commentaire l. 84 le dit explicitement (« ne pas rejouer le bug
   `jalon --help` »). Intercepter en amont **casserait** ce comportement acquis. Il est donc
   préservé tel quel, et la garde vérifiera séparément les trois sous-verbes.

4. **Rédiger les 14 `USAGE` manquants** — 13 dans leur module de commande (12 fichiers, `attach.js`
   en portant deux : `attach` et `detach`) et 1 pour `root`, qui n'a pas de module, déclaré dans
   `router.js`. Et **exporter les `USAGE`/`HELP` existants** : **21 modules**, soit **24 constantes**
   (`frame.js` en porte quatre : `HELP`, `LINT_HELP`, `NEW_HELP`, `USE_HELP`) — ajout du mot-clé
   `export`, aucune réécriture de texte. Chaque texte
   commence par la ligne `Usage : iakaframe <verbe>`, conformément à la forme déjà en place
   (`commands/open.js:14`, `commands/jalon.js:11`, …). **Source de rédaction imposée** : le bloc
   `HELP` global de `cli/src/index.js:48-159` documente déjà chaque verbe et ses options — les
   nouveaux `USAGE` en sont la mise au propre, pas une invention. `root` n'ayant pas de module,
   son `USAGE` est déclaré dans `router.js`.

5. **Contrat de sortie unique, gravé** (c'est le traitement du défaut (b), indépendant de (a)) :

   | Invocation | stdout | stderr | exit |
   |---|---|---|---|
   | `<verbe> --help` / `-h` | l'usage du verbe | vide | **0** |
   | `<verbe> --<option inconnue>` | vide (hors `--json`) | **une seule ligne** de message | **1** |
   | `<verbe>` avec arguments requis manquants | (inchangé) | message d'usage | **1** |

6. **Trois corrections ponctuelles** qui matérialisent le point 5 :
   - `cli/src/index.js:215` — le `main().catch(e => { console.error(e); … })` imprime l'objet
     `Error` entier, donc une **trace de pile**. À remplacer par : si `e.code` commence par
     `ERR_PARSE_ARGS`, imprimer `e.message` seul sur stderr ; sinon comportement actuel.
     `process.exitCode = 1` dans les deux cas.
   - `cli/src/commands/models.js:695-698` — le `catch` qui avale toute erreur de parsing en
     `console.log(HELP); return;` (exit 0) devient `catch (e) { return fail(false, e.message); }`
     (exit 1). **`models --help` continue de fonctionner** par l'interception centrale et par
     `models.js:699`.
   - `cli/src/commands/review.js:64` — `fail(USAGE, json)` → `fail(json, USAGE)`.

7. **Rendre la garde dérivable** : `cli/test/help-systemique.test.js` n'écrit plus sa liste ; elle
   **importe `ROUTES`** et itère sur `Object.keys(ROUTES)`. Un verbe ajouté demain sans usage fait
   **échouer** la garde. C'est le seul moyen que ce lot ne soit pas à refaire.

### 2.2 Ce qui a été écarté, et pourquoi

- **Recopier `help:` + `if (values.help)` dans les 19 modules.** Le geste le plus court, et c'est
  exactement ce qu'a fait le lot précédent sur 10 verbes : 19 points de vérité de plus, aucune
  garantie d'uniformité, et le défaut revient au verbe suivant. Écarté.
- **Dériver l'usage de chaque verbe en découpant le bloc `HELP` global de `index.js`.** Séduisant
  (zéro duplication de texte), mais le bloc est aligné à la main sur trois niveaux d'indentation :
  l'analyser est fragile et inaudible en revue. Écarté comme sur-ingénierie.
- **Un parseur d'arguments tiers** (`commander`, `yargs`, `meow`). **Exclu d'office** : le CLI est
  zéro-dépendance runtime (`cli/package.json` n'a aucun champ `dependencies`,
  `cli/src/index.js:2`), contrainte non négociable. `util.parseArgs` couvre le besoin (§ vérif.
  web ci-dessus).

---

## 3. Périmètre

### Inclus

- Les **19 entrées** listées au § 1.1 tableau B : `init`, `services`, `config`, `agents`, `skills`,
  `go`, `brief`, `recap`, `remove`, `attach`, `detach`, `vendor-check`, `portfolio`, `open`,
  `produit`, `memory`, `recall`, `observe`, `root`.
- L'extraction de `ROUTES` vers `cli/src/router.js` et l'interception centrale dans `index.js`.
- Le contrat de sortie du § 2.1 point 5, appliqué aux **36 entrées**.
- Les trois correctifs ponctuels du § 2.1 point 6 (`index.js` catch, `models.js`, `review.js`).
- La garde `cli/test/help-systemique.test.js` rendue dérivable + couverture des sous-verbes
  `frame lint|new|use`.
- La mise à jour de `docs/commandes.md` **dans le même lot**.

### Exclu — explicitement hors lot

- **Toute réécriture des 22 `USAGE`/`HELP` existants.** Seul le mot-clé `export` est ajouté. Le
  texte est intouché, y compris s'il est perfectible.
- **Toute modification du bloc `HELP` global** de `cli/src/index.js:48-159` (contenu ; le module
  peut être déplacé, pas récrit).
- **Le comportement des verbes hors `--help`** : parsing, options, sorties métier, sortie `--json`.
  Un `USAGE` qui décrit une option est une **description**, jamais un ajout de fonctionnalité.
- **`fail(false, …)` dans `open.js:42` et `produit.js:49`.** Ces appels ignorent un éventuel
  `--json` (le drapeau n'est pas encore parsé quand l'erreur survient) : c'est une entorse latente
  à C-JSON, **réelle mais distincte**, à traiter dans un lot dédié. Le code de sortie, lui, est
  correct (1) — ce n'est donc pas le défaut (b).
- **`vendor-check` sans `--strict` qui sort 0 avec `ok:false`** (`commands/vendor-check.js:275`) :
  comportement **délibéré et documenté** (frère absent → gracieux). Ne pas le « corriger ».
- Toute refonte de `library/`, des personas, des skills ou des frames.

### Vendorage — verdict explicite (piège D-9)

**Ce lot ne touche AUCUN artefact vendoré.** Constat de lecture : le manifeste
`cli/src/lib/vendor.js:15` énumère les classes copiées vers iakaFrameGUI (personas, goldens,
binding, workflow, principles, rituals…) et `cli/src/lib/vendor.js:76` fixe la racine des fixtures
à `packages/core/__tests__/fixtures`. **Rien sous `cli/src/`, `cli/test/` ou `docs/` n'y figure.**
Les 78 copies + 4 dérivées (`vendor.js:73-74`) sont donc hors trajectoire.

> **À confirmer par l'exécutant au gate** (je n'ai pas pu exécuter) : `iakaframe vendor-check`
> rend le même verdict **avant et après** le lot. Si le compte bouge, **arrêter** et remonter :
> cela signifierait que mon constat de lecture est faux.

---

## 4. Étapes d'implémentation

1. **Mesurer l'état de départ** et le consigner (§ 0.2) : pour les 36 entrées, relever
   `<verbe> --help` → sortie + code de sortie. C'est la baseline opposable du lot ; sans elle, on
   ne peut pas prouver qu'un critère a basculé.
2. Créer `cli/src/router.js` : y déplacer les imports de commandes et la table `ROUTES`
   (36 entrées, `use` inclus, `frame` marqué `selfHelp: true`, `root` avec son `usage` local).
3. Réduire `cli/src/index.js` à : shebang, `HELP` global (texte inchangé), `main()`,
   interception `--help`/`-h`, délégation via `ROUTES`, `catch` de fin corrigé.
4. Ajouter `export` devant les 22 `USAGE`/`HELP` existants. Aucune autre modification de ces
   fichiers.
5. Rédiger les 14 `USAGE` manquants (§ 2.1 point 4), à partir du bloc `HELP` global comme source.
6. Appliquer les trois correctifs ponctuels (`models.js:695-698`, `review.js:64`,
   `index.js` catch final).
7. Réécrire `cli/test/help-systemique.test.js` : importer `ROUTES`, itérer sur toutes les entrées,
   asserter le contrat du § 2.1 point 5. Ajouter les cas `frame lint|new|use --help` et les cas
   d'option inconnue.
8. Mettre à jour `docs/commandes.md` : § B — rendre explicite que **tout verbe** accepte
   `-h`/`--help` (aide sur stdout, exit 0) et que toute option inconnue sort en 1 sans trace de
   pile. Compléter la ligne `root` (`docs/commandes.md:135`).
9. Vérifier : `npm test` dans `cli/` (`node --test`), puis `iakaframe vendor-check`.

---

## 5. Fichiers concernés

- `cli/src/router.js` — **nouveau**. Table `ROUTES` : verbe → `{ run, usage, selfHelp? }`.
- `cli/src/index.js` — allégé du `switch` ; interception `--help`/`-h` ; `catch` final sans trace
  de pile. Le texte du `HELP` global est **conservé**.
- `cli/src/commands/init.js`, `services.js`, `config.js`, `agents.js`, `skills.js`, `go.js`,
  `brief.js`, `recap.js`, `remove.js`, `attach.js` (deux usages : `attach` + `detach`),
  `vendor-check.js`, `portfolio.js` — **ajout** d'un `export const USAGE` : **12 fichiers,
  13 textes**. Le 14ᵉ texte (`root`) est déclaré dans `router.js`, ce verbe n'ayant pas de module.
- `cli/src/commands/open.js`, `produit.js`, `memory.js`, `recall.js`, `observe.js` — `USAGE`
  existant : ajout de `export` seul.
- `cli/src/commands/onboard.js`, `snapshot.js`, `update.js`, `repo.js`, `banner.js`, `jalon.js`,
  `list.js`, `show.js`, `add.js`, `assemble.js`, `switch.js`, `close.js`, `consolidate.js`,
  `frame.js` — ajout de `export` seul.
- `cli/src/commands/models.js` — `export` du `HELP` + correctif du `catch` (l. 695-698).
- `cli/src/commands/review.js` — `export` du `USAGE` + inversion d'arguments corrigée (l. 64).
- `cli/test/help-systemique.test.js` — garde dérivée de `ROUTES`.
- `docs/commandes.md` — convention `-h`/`--help` + ligne `root`.

---

## 6. Risques

| Risque | Mitigation |
|---|---|
| L'extraction du dispatch vers `router.js` casse **tous** les verbes d'un coup (point d'entrée). | 55 fichiers de test existent sous `cli/test/`, dont plusieurs pilotent le CLI par `execFileSync` sur `index.js` (`help-systemique`, `jalon-help`, `verbs-args`, `switch-flags-guard`, `repo-guard`). `npm test` vert **avant** et **après** est la condition d'acceptation du lot. |
| L'interception centrale court-circuite un verbe qui rendait déjà `--help` correctement (les 17 du tableau A). | L'interception rend le **même** `usage` que celui déjà exporté par le module. `frame` est exempté via `selfHelp`. La garde vérifie les 36 entrées, pas seulement les 19 corrigées. |
| Régression sur `frame lint --help` — bug déjà corrigé une fois (`commands/frame.js:84`). | `selfHelp: true` + trois cas de garde dédiés (`lint`, `new`, `use`). Non négociable. |
| Le correctif `models.js` transforme un `exit 0` en `exit 1` : un script d'automatisation existant pouvait s'appuyer sur l'ancien comportement. | C'est **l'objet même** du lot (défaut (b)). À signaler au jalon de remise plutôt qu'à masquer. |
| Les 14 `USAGE` rédigés divergent un jour du `HELP` global. | Risque **assumé et non traité ici** (l'option « dériver du `HELP` » est écartée au § 2.2). La garde n'assure que la **présence** et la forme de la ligne `Usage :`, pas la justesse du contenu. À noter comme dette. |
| `-h` entre en collision avec un alias court existant. | Vérifié : `Grep 'short:'` sur `cli/src/` → **aucune occurrence**. Aucun alias court n'est déclaré nulle part dans le CLI. Risque nul. |

---

## 7. Critères d'acceptation

Toutes les commandes s'exécutent depuis la **racine du dépôt** `/Users/sjupin/work/iakaframe`.
Convention de relevé, opposable au gate : **chaque critère cite sa commande, sa sortie et son code
de sortie**. Le code se relève par `; echo "exit=$?"` accolé à la commande.

### 7.1 Les 19 entrées du périmètre — aide atteignable

- [ ] **AC-1.** Pour **chacune** des 19 entrées — `init`, `services`, `config`, `agents`, `skills`,
      `go`, `brief`, `recap`, `remove`, `attach`, `detach`, `vendor-check`, `portfolio`, `open`,
      `produit`, `memory`, `recall`, `observe`, `root` — la commande
      `node cli/src/index.js <verbe> --help ; echo "exit=$?"` produit :
      **`exit=0`**, une ligne `Usage : iakaframe <verbe>` sur **stdout**, **stderr vide**, et la
      sortie ne contient **ni** `ERR_PARSE_ARGS_UNKNOWN_OPTION` **ni** de ligne de trace (`   at `).
      *Les 19 relevés sont consignés, verbe par verbe.*
- [ ] **AC-2.** Idem avec la forme courte : `node cli/src/index.js <verbe> -h ; echo "exit=$?"` →
      **`exit=0`** et sortie **identique** à celle de `--help`, pour les 19 entrées.

> **AC-1 et AC-2 ÉCHOUENT sur le code d'aujourd'hui**, pour les 19 entrées et par au moins un motif
> chacune : trace de pile (16 entrées), message `Unknown option '--help'` sur stderr au lieu de
> l'usage sur stdout (`open`, `produit`), sortie hors sujet en `exit=0` (`root`).

### 7.2 Les défauts (b) — le code de sortie ne ment plus

- [ ] **AC-3.** `node cli/src/index.js root --help ; echo "exit=$?"` → **`exit=0`** et stdout
      contient `Usage : iakaframe root`, **et n'est pas** un chemin de dossier.
      *(Aujourd'hui : imprime le dossier chapeau, `exit=0`. **Échoue.**)*
- [ ] **AC-4.** `node cli/src/index.js models --option-qui-nexiste-pas ; echo "exit=$?"` →
      **`exit=1`**.
      *(Aujourd'hui : imprime le `HELP` et sort **`exit=0`**. **Échoue.**)*
- [ ] **AC-5.** Pour **chacune** des 36 entrées,
      `node cli/src/index.js <verbe> --zzz-inconnu ; echo "exit=$?"` → **`exit=1`**, message sur
      **stderr uniquement**, **une seule ligne**, **sans** `   at ` ni `ERR_PARSE_ARGS_UNKNOWN_OPTION`.
      *(Aujourd'hui : trace de pile complète sur la majorité des verbes ; `exit=0` sur `models` et
      `root`. **Échoue.**)*

### 7.3 Le défaut connexe `review`

- [ ] **AC-6.** `node cli/src/index.js review ; echo "exit=$?"` → **`exit=1`** et stderr contient
      `Usage : iakaframe review`. La sortie **ne contient pas** `"error": false`.
      *(Aujourd'hui : imprime `{ "ok": false, "error": false }` sur stdout. **Échoue.**)*

### 7.4 Non-régression sur les 17 entrées déjà traitées

- [ ] **AC-7.** Pour les 17 entrées du § 1.1 tableau A, `<verbe> --help` rend **exactement** la même
      sortie qu'avant le lot (comparaison à la baseline de l'étape 1) et **`exit=0`**.
- [ ] **AC-8.** `node cli/src/index.js frame lint --help`, `frame new --help` et `frame use --help`
      rendent chacun **l'aide de leur sous-verbe** (respectivement `frame lint`, `frame new`,
      `frame use` dans la ligne d'usage), **`exit=0`** — et **non** celle de `frame verify`.
- [ ] **AC-9.** `node cli/src/index.js --help ; echo "exit=$?"` et `node cli/src/index.js -h` →
      **`exit=0`**, bloc `HELP` global **inchangé au caractère près**.
- [ ] **AC-10.** `node cli/src/index.js verbe-qui-nexiste-pas ; echo "exit=$?"` → **`exit=1`**,
      message `Commande inconnue :` + `HELP` global (comportement de `index.js:208-211` **préservé**).

### 7.5 Garde et outillage

- [ ] **AC-11.** `cli/test/help-systemique.test.js` ne contient **aucune liste de verbes écrite à
      la main** : elle importe `ROUTES` depuis `cli/src/router.js` et itère sur
      `Object.keys(ROUTES)`. Vérifiable par lecture du fichier.
- [ ] **AC-12.** Preuve que la garde mord : ajouter temporairement une entrée bidon à `ROUTES`
      **sans** `usage` → `npm test` **échoue** ; la retirer → `npm test` repasse. Les deux sorties
      sont consignées.
- [ ] **AC-13.** `cd cli && npm test` → **`exit=0`**, et le nombre de tests réussis est **≥** celui
      relevé avant le lot (baseline étape 1). Aucun test existant supprimé ni neutralisé.
- [ ] **AC-14.** `node cli/src/index.js vendor-check ; echo "exit=$?"` rend le **même** verdict et
      les **mêmes compteurs** qu'avant le lot (§ 3, piège D-9).

### 7.6 Documentation

- [ ] **AC-15.** `docs/commandes.md` énonce, en § B, que **tout verbe** accepte `-h`/`--help`
      (usage sur stdout, `exit 0`) et qu'une option inconnue sort en **1** sans trace de pile ; la
      ligne `root` (`docs/commandes.md:135`) mentionne `--help`. *Convention permanente du
      portefeuille : la doc des commandes est mise à jour dans le **même lot**.*

---

## 8. Estimation (jalon P1→P2)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **1 j-h** (fourchette 0,75 – 1,25) |
| **Complexité** | **Faible.** Aucune algorithmique. Le gros du volume est de la rédaction : 14 textes d'usage, dont la source (`index.js:48-159`) existe déjà. |
| **Risque** | **Moyen.** Le lot touche le **point d'entrée de tous les verbes** : une erreur d'extraction casse le CLI en entier. Compensé par 55 fichiers de test existants et par AC-13. |
| **Volume** | **37 fichiers** : 1 créé (`router.js`), 36 touchés — dont **19 par l'ajout du seul mot-clé `export`**. Détail : `index.js` (1) + 12 modules recevant un `USAGE` + 19 modules `export`-seul + `models.js` et `review.js` (`export` + correctif) + le test + `docs/commandes.md`. |

**Inconnues susceptibles de faire glisser l'estimation**

1. **Le `exit=0` de `open --help` (§ 0.2).** Si la mesure du brief est exacte alors que le code dit
   1, il existe un mécanisme que je n'ai pas identifié par lecture — et qui pourrait affecter le
   contrat de sortie de tout le CLI. **+0,25 à +0,5 j-h** d'investigation. *C'est l'inconnue n°1 :
   elle se lève en une commande, dès l'étape 1.*
2. **L'extraction de `ROUTES`.** Si un test existant importe `cli/src/index.js` directement (et non
   par `execFileSync`), il faudra le réoutiller. Non vérifié exhaustivement. **+0,25 j-h.**
3. **Les sous-verbes.** `memory`, `produit`, `review`, `observe`, `skills`, `agents`, `frame`
   prennent une **action** en positionnel. Si l'utilisateur attend `memory add --help` (aide de
   l'action) et non l'aide du verbe, le périmètre double. **Ce cadrage tranche : hors lot** — un
   seul usage par verbe, sauf `frame` dont les sous-verbes sont **déjà** outillés. Si le décideur
   veut l'aide par action : **+1 j-h**, et c'est un autre lot.
4. **La qualité attendue des 14 textes d'usage.** Estimé pour des usages *concis* alignés sur
   l'existant. Si l'exigence est « aide exhaustive par option », **+0,5 j-h**.

**Ce chiffre n'est pas un engagement ferme** : c'est un ordre de grandeur assumé et révisable, à
confronter au temps réel à la clôture du lot.

---

## 9. Références

- `specs/instructions/cli-api-surface-harmonisation.md` § 4 — helper de sortie unique
  (`lib/output.js`), convention C-JSON. Ce lot s'y conforme et corrige une violation (`review.js:64`).
- `specs/instructions/verdict-de-gate-opposable.md` — un verdict qui ne cite pas ses commandes et
  leurs sorties est inopposable. D'où la forme du § 7.
- `cli/test/jalon-help.test.js`, `cli/test/help-systemique.test.js` — l'antériorité partielle.
- <https://nodejs.org/api/util.html#utilparseargsconfig> — `util.parseArgs` stable depuis Node 20,
  `short`, mode `strict`. (Consulté le 2026-08-03.)
