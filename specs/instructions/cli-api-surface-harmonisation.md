# Harmonisation de la surface API du CLI (`@naonedge/iakaframe`)

> **Nature** : **régularisation** de la surface de commandes du CLI existant
> `@naonedge/iakaframe` (`iakaframe/cli/`) — cohérence des **sorties `--json`**, du **drapeau
> `--json` lui-même**, de la **discipline d'erreur en mode machine**, et de la **frontière
> `commands/` ↔ `lib/`**. **Aucune commande n'est ajoutée ni renommée** ; on rend la surface
> **régulière et prévisible**. · **Cadreur** : l'architecte-cadreur. · **Statut : CADRÉ — À
> VALIDER par le décideur** (jalon humain de cadrage). **Date** : 2026-07-18. Français ; code et
> identifiants en anglais.
>
> **Références**
> - CLI existant : `../../cli/src/index.js` (dispatch + `HELP`), `../../cli/package.json`
>   (Node ≥20, **zéro-dep runtime**, `bin: iakaframe`, tests `node --test`).
> - Style d'une commande : `../../cli/src/commands/*.js` (`parseArgs` de `node:util` ; un module
>   `commands/<verbe>.js` exporte `run<Verbe>(rest)`).
> - Couche de commandes bibliothèque (contexte du parc de verbes) :
>   `./cli-bibliotheque-verbes.md` (dont le § 3 « Sortie humaine par défaut ; `--json` émet la
>   donnée brute » — c'est **cette** phrase qui a divergé et qu'on referme ici).
> - Symétrie ajout/suppression (verbes `add`/`remove`, `attach`/`detach`) :
>   `./symetrie-ajout-suppression.md`.
> - État de l'art vérifié le 2026-07-18 (§ 9).

---

## 1. Problème (avant la solution)

Le CLI a grossi verbe par verbe (28 commandes, cf. `src/index.js`). Chaque commande a **ré-inventé
sa propre forme de sortie `--json`** : il n'existe **aucun contrat commun**. Résultat : un
consommateur machine (forge, cockpit, script, agent) **ne peut pas écrire un parseur unique** — il
doit connaître la forme au cas par cas. Inventaire **factuel** relevé dans le code (§ 3) :

1. **Tableau nu vs enveloppe** (le défaut signalé au backlog) : `list --json` émet un **tableau nu**
   (`JSON.stringify(entries)`, `commands/list.js:42`) tandis que `portfolio --json` émet une
   **enveloppe** `{ ok, root, count, projects }` (`commands/portfolio.js:99`). Même famille (lecture
   d'un inventaire), deux formes racines incompatibles.
2. **Champ `ok` présent ou absent, sans règle** : `portfolio`, `review`, `remove`, `attach`,
   `observe`, `consolidate` portent `ok:true` ; `show`, `open`, `recall`, `close`, `switch`,
   `assemble` (succès), `memory path|config|list` **n'ont pas de `ok`**. Impossible de tester le
   succès de façon uniforme.
3. **`--json` n'a pas le même type selon la commande** : partout c'est un **booléen** (drapeau
   stdout)… **sauf `services`**, où `--json <fichier>` est une **chaîne = chemin de sortie** qui
   **écrit un fichier** (`commands/services.js:24,56`) au lieu d'émettre sur stdout. Collision de
   sens sur le même nom d'option.
4. **Erreur non-machine en mode `--json`** : plusieurs chemins d'erreur écrivent du **texte humain
   sur stderr même quand `--json` est actif** (`list` type inconnu `commands/list.js:19-22` ;
   `show` introuvable/ambigu `commands/show.js:27-38`). Un consommateur `--json` reçoit alors du
   texte non-JSON. À l'inverse, la majorité des commandes ont un helper `fail()` qui émet bien
   `{ ok:false, error }` — mais il est **recopié à la main dans ~12 fichiers**, sans source unique.
5. **Deux commandes de lecture n'ont pas de `--json` du tout** : `agents` (`commands/agents.js`) et
   `config` (`commands/config.js`) — trous dans la surface machine.
6. **Frontière `commands/` ↔ `lib/` irrégulière** : certaines commandes **délèguent** toute la
   logique à un module `lib/` (`close`→`lib/close.js`, `review`→`lib/review.js`,
   `recall`→`lib/recall.js`, `open`→`lib/open.js`, `remove`→`lib/remove.js`,
   `observe`→`lib/observation.js`, `memory`→`lib/memory.js`) ; d'autres portent la **logique métier
   en ligne dans le fichier de commande** (`portfolio` : `scanPortfolio/isProject/defLine`
   `commands/portfolio.js:16-84` ; `add` : validation+dépôt `commands/add.js` ; `list` : agrégation
   inline). Il n'y a pas de **helper de sortie partagé** : le `JSON.stringify` et le `fail()` sont
   dupliqués partout.

**Besoin (formulé par le décideur)** : une **API CLI régulière et prévisible** — un **seul contrat
de sortie `--json`** appliqué **partout**, un `--json` **toujours booléen**, une **discipline
d'erreur machine** uniforme, et une **frontière `commands/`/`lib/` nette** via un **helper de sortie
unique**. **Sans casser les verbes** (le parc de verbes est jugé cohérent — cf. § 6) ni la **sortie
humaine**.

**Ce lot ne change ni les verbes, ni la sortie humaine, ni la logique métier** : il **normalise la
forme des sorties machine** et **factorise** la mécanique de sortie. C'est une régularisation, pas
une refonte.

---

## 2. Décision centrale — Convention de sortie `--json` (« C-JSON », à graver)

> **Fait vérifié (§ 9)** : l'état de l'art CLI (clig.dev, clispec.dev, retours de terrain) est
> **catégorique** : **ne jamais renvoyer un tableau (ni un scalaire) à la racine** d'une sortie
> `--json` — **toujours une enveloppe objet**, sinon on ne peut **jamais** ajouter de métadonnée
> (`count`, pagination, `warnings`) sans **casser** les consommateurs. Un tableau nu est un
> **cul-de-sac de compatibilité** ; l'enveloppe coûte quelques octets et reste **évolutive**.
>
> **On tranche donc en alignant `list` (et tous les tableaux nus) SUR `portfolio` (enveloppe), et
> jamais l'inverse.**

**C-JSON — contrat unique (5 règles) :**

1. **Racine = toujours un objet JSON.** Jamais un tableau nu, jamais un scalaire. Une seule
   impression sur **stdout**, en JSON `2`-indenté (`JSON.stringify(obj, null, 2)`), rien d'autre.
2. **`ok: boolean` obligatoire, en première clé.** `true` en succès, `false` en erreur.
3. **Charge utile :**
   - **Collection** (la commande renvoie une liste) → l'array vit sous une **clé nommée au
     pluriel**, accompagnée d'un frère **`count: <entier>`**. Ex. `{ ok, count, projects }`,
     `{ ok, count, items }`, `{ ok, count, proposals }`. **Jamais de tableau à la racine.**
   - **Ressource ou rapport d'action** (objet unique) → ses champs sont **à plat** sous
     `{ ok, ... }`. Ex. `show` → `{ ok, collection, id, path, data, body }` ; `switch` →
     `{ ok, methodId, teamId, ... }`.
4. **Erreur = `{ ok:false, error:"<message>" }`** (+ champs de diagnostic éventuels : `reason`,
   `missing`, `orphans`, `referrers`…), `process.exitCode = 1`. **En mode `--json`, AUCUNE sortie
   humaine sur stderr** : l'erreur EST l'objet JSON, sur **stdout**.
5. **`--json` est PARTOUT un booléen** (drapeau `{ type: 'boolean', default: false }`). Aucune
   commande ne détourne `--json` pour désigner un fichier ou une valeur.

> **Non-objectifs de C-JSON** (pour rester fermé) : on ne normalise **pas** le **nommage interne**
> des champs de rapport (les clés à plat des mutations restent celles d'aujourd'hui), on **n'impose
> pas** NDJSON/streaming (aucun volume ne le justifie — noté [différé] § 6), et on **ne touche pas**
> à la **sortie humaine** (défaut) d'une seule commande.

---

## 3. Inventaire factuel des sorties `--json` actuelles → cible

> Relevé **dans le code réel** (lignes citées). Colonne « Cible » = application de C-JSON (§ 2).
> `Δ` = ampleur du changement pour le consommateur : **0** conforme, **A** ajout de `ok` (non
> cassant si le consommateur teste des clés existantes), **W** passage tableau→enveloppe (cassant),
> **T** changement de type de `--json`.

| Commande | `--json` | Forme racine actuelle | `ok`? | Cible C-JSON | Δ |
|---|---|---|---|---|---|
| `portfolio` | bool | `{ ok, root, count, projects:[] }` | ✅ | **inchangée** (référence) | 0 |
| `review list` | bool | `{ ok, home, count, proposals:[] }` | ✅ | inchangée | 0 |
| `review show` | bool | `{ ok, proposal, text }` | ✅ | inchangée | 0 |
| `review apply/reject/auto` | bool | rapport `{ ok, ... }` | ✅ | inchangée | 0 |
| `remove` | bool | `{ ok, kind, id, trash, trashed:[], detached:[] }` | ✅ | inchangée | 0 |
| `attach`/`detach` | bool | `{ ok, mode, skillId, personaId, changed, skills:[] }` | ✅ | inchangée | 0 |
| `observe list` | bool | `{ ok, home, files:[] }` | ✅ | **+`count`** (frère de `files`) | A |
| `observe` (write) | bool | `{ ok, changed, scope, file }` | ✅ | inchangée | 0 |
| `consolidate` | bool | `{ ok, home, sourceDir, profil, registre, ... }` | ✅ | inchangée | 0 |
| `memory add/replace/remove` | bool | rapport `{ ok, action, target, ... }` | ✅ | inchangée | 0 |
| `memory init` | bool | `{ ok, home, created:[] }` | ✅ | **+`count`** (frère de `created`) | A |
| `memory path` | bool | `{ home }` | ❌ | **+`ok`** → `{ ok, home }` | A |
| `memory config` | bool | `{ home, config, configFile }` | ❌ | **+`ok`** | A |
| `memory list` | bool | `{ home, target, entries:[] }` | ❌ | **+`ok` +`count`** | A |
| `show` | bool | `{ collection, id, path, data, body }` | ❌ | **+`ok`** (champs à plat) | A |
| `open` | bool | `canon` nu `{ profil, registre, pending, ... }` | ❌ | **+`ok`** (champs à plat) | A |
| `recall` | bool | `{ degraded, count, dir, engine, results:[] }` | ❌ | **+`ok`** (a déjà `count`+`results`) | A |
| `close` | bool | `{ analyzed, emitted:[], skipped:[] }` | ❌ | **+`ok`** | A |
| `switch`/`use` | bool | `{ ...marker, path, personas:[], skills:[] }` | ❌ | **+`ok`** (champs à plat) | A |
| `switch --rollback` | bool | `{ rollback, path }` | ❌ | **+`ok`** | A |
| `assemble` (succès) | bool | **descripteur nu** `{ id, methodId, ... }` | ❌ | **`{ ok, descriptor:{...} }`** | W |
| `assemble` (échec compat) | bool | `{ ok:false, orphans:[], unknownPersonas:[] }` | ✅ | **+`error`** (message) | A |
| `add` | bool | rapport `{ kind, file, ok, errors:[], ... }` | ✅(partiel) | **`ok` en tête** (déjà présent) | 0/A |
| **`list`** (sans type) | bool | **tableau nu** `[ {collection,count,ids} ]` | ❌ | **`{ ok, root, count, collections:[] }`** | **W** |
| **`list <type>`** | bool | **tableau nu** `[ {id,label} ]` | ❌ | **`{ ok, root, type, count, items:[] }`** | **W** |
| **`services`** | **string=fichier** | écrit un fichier `{ generated, services:[] }` | ❌ | **`--json` bool → stdout** `{ ok, generated, count, services:[] }` ; **`--out <fichier>`** reprend l'écriture fichier | **T** |
| **`agents`** (list/status) | **absent** | — (humain seul) | — | **ajouter `--json`** `{ ok, count, personas\|agents:[] }` | (nouveau) |
| **`config`** | **absent** | — (humain seul) | — | **ajouter `--json`** `{ ok, path, runner, node, diagnostics }` | (nouveau) |
| chemins `fail()` (12 cmds) | — | `{ ok:false, error }` | ✅ | **factorisés** dans un helper unique (§ 4) | 0 |
| `list` type inconnu / `show` introuvable | — | **stderr humain même en `--json`** | — | **erreur JSON** en mode `--json` (règle 4) | **A** |

**Verdict** : la cible est **entièrement dérivable** de C-JSON. La majorité des commandes sont **déjà
conformes** (Δ=0) ou ne demandent qu'un **ajout de `ok`/`count`** (Δ=A, non cassant pour un
consommateur qui lit des clés existantes). Les **seuls changements cassants** sont **`list`**
(tableau→enveloppe, **le défaut signalé**), **`assemble` succès** (descripteur→`{ ok, descriptor }`)
et **`services`** (`--json` fichier → `--json` stdout + `--out`).

---

## 4. Frontière `commands/` ↔ `lib/` — helper de sortie unique (à graver)

Aujourd'hui, chaque commande **recopie** sa mécanique de sortie (`console.log(JSON.stringify(...))`
et un `fail()` local ~identique dans 12 fichiers). C'est **la** cause de la dérive : sans point
unique, chaque verbe ré-invente sa forme. **Décision** : créer **un seul module** portant C-JSON.

**Nouveau module `cli/src/lib/output.js`** (zéro-dep), source unique de la convention :

- `emit(json, payload, humanFn)` — si `json` : imprime `JSON.stringify(payload, null, 2)` sur
  stdout ; sinon exécute `humanFn()` (rendu humain inchangé). **Toute** commande passe par là.
- `ok(payload)` — normalise en `{ ok: true, ...payload }` (garantit `ok` en tête).
- `collection(key, arr, meta?)` — construit `{ ok:true, count: arr.length, [key]: arr, ...meta }`
  (fabrique l'enveloppe de collection ; interdit le tableau nu par construction).
- `fail(json, message, diag?)` — imprime `{ ok:false, error: message, ...diag }` sur **stdout** si
  `json`, sinon `console.error(message)` ; positionne `process.exitCode = 1`. **Remplace** les 12
  `fail()` locaux.

**Règle de frontière (à graver)** : `commands/<verbe>.js` = **parsing des args (`parseArgs`) +
appel `lib/` + rendu via `lib/output.js`**. La **logique métier** vit dans `lib/`. En conséquence,
extraire la logique inline restante vers `lib/` :
- `commands/portfolio.js` → `lib/portfolio.js` (`scanPortfolio`, `isProject`, `defLine`,
  `openMilestones`) ; la commande ne garde que parsing + `emit`.
- `commands/list.js` → la construction de l'inventaire va dans `lib/library.js` (déjà l'hôte des
  `COLLECTIONS`/`scan`) ; la commande ne garde que parsing + `emit`.
- `commands/add.js`, `commands/assemble.js`, `commands/show.js` : la logique s'appuie déjà sur
  `lib/library.js` ; ne reste qu'à router **toute** sortie par `lib/output.js`.

> **Ce module est le verrou anti-dérive** : après ce lot, ajouter un verbe ou un chemin d'erreur
> **sans** passer par `output.js` doit être visible en revue (et testable, § 7). C'est la réponse
> concrète au volet « structure interne `commands/` ↔ `lib/` » du backlog.

---

## 5. Lexique des drapeaux partagés (audit + gel, à graver)

Au-delà de `--json`, l'audit des options révèle un **socle commun déjà cohérent** ; on le **fige**
comme lexique de référence (aucun renommage dans ce lot) :

| Drapeau | Type | Sens (unique) | Commandes |
|---|---|---|---|
| `--json` | **booléen** | sortie machine C-JSON sur stdout | **toutes** (après ce lot) |
| `--ascii` | booléen | repli table ASCII (rendu **humain**) | `list`, `portfolio`, `assemble`, `brief`… |
| `--force` | booléen | outrepasser une garde non destructive | `add`, `attach`, `switch`, `init`, `onboard`… |
| `--yes` | booléen | confirmer une cascade (avec `--cascade`) | `remove` |
| `--path <dir>` | chaîne | **dossier d'un projet** cible | `switch`, `config`, `snapshot`, `update`… |
| `--home <dir>` | chaîne | **racine du canon** mémoire (`~/.iaka/memory/`) | `memory`, `open`, `recall`, `close`, `review`, `consolidate`, `observe` |
| `--root <dir>` | chaîne | racine — **DEUX sens selon la commande** (voir ⚠) | `portfolio`/`observe` (chapeau `~/work`) **vs** `list`/`show`/`add`/… (bibliothèque) |
| `--out <fichier>` | chaîne | **[nouveau]** écriture fichier (ex-`services --json`) | `services` |

> ⚠ **Collision de sens sur `--root`** (relevée, **hors périmètre de correction ici**) : `--root`
> désigne le **dossier chapeau `~/work`** pour `portfolio`/`observe` (`lib/root.js` `resolveRoot`)
> **et** la **racine de bibliothèque** pour `list`/`show`/`add`/`assemble`/`switch`
> (`lib/library.js` `libraryRoot`). Deux racines distinctes (env `IAKAFRAME_ROOT` vs
> `IAKAFRAME_HOME`) partagent le **même nom de flag**. **Décision de cadrage : NE PAS traiter ici**
> — c'est un changement structurel (env + résolution + doc) qui mérite **son propre gate** (→ § 6
> [différé], `cli-racines-resolution.md` à cadrer plus tard). On se **contente de le documenter**
> dans le `HELP` pour lever l'ambiguïté à l'usage.

**Verbes** : l'audit du parc (28 verbes, `src/index.js:118-152`) ne relève **aucune incohérence de
nommage** à corriger — verbe-premier partout, un seul alias assumé (`use`→`switch`), paires
symétriques nettes (`add`/`remove`, `attach`/`detach`). **Décision : conserver le parc de verbes
tel quel.** Ce lot **ne renomme aucun verbe**.

---

## 6. Périmètre — inclus / exclu

**Inclus (ce lot) :**
1. `lib/output.js` (`emit`, `ok`, `collection`, `fail`) — source unique de C-JSON (§ 4).
2. Application de **C-JSON à toutes les commandes** avec `--json` (colonne « Cible » du § 3),
   y compris l'ajout de `ok`/`count` et la mise en enveloppe de `list`/`assemble`.
3. **`--json` rendu booléen partout** ; **`services`** : `--json` devient booléen stdout et
   l'écriture fichier passe à **`--out <fichier>`**.
4. **Discipline d'erreur machine** : en mode `--json`, **toute** erreur sort en `{ ok:false, error }`
   sur stdout (plus de texte humain sur stderr en mode `--json`) — corrige `list`/`show`.
5. **Ajout de `--json`** à `agents` (list/status) et `config`.
6. **Extraction de la logique inline** de `portfolio`/`list` vers `lib/` (frontière § 4).
7. Mise à jour du bloc **`HELP`** (`src/index.js`) : mention de `--json` (booléen) uniforme,
   `services --out`, et note sur le double sens de `--root`.
8. **Tests `node --test`** de la convention (§ 7).

**Exclu (hors périmètre, explicite) :**
- **Aucun renommage de verbe**, aucune suppression/ajout de commande.
- **Aucune modification de la sortie humaine** (défaut) d'aucune commande.
- **Aucune modification de la logique métier** ni des schémas de fichiers écrits (kits, canon,
   iakaframe.json…) : on ne touche qu'à la **forme des sorties**.
- **Unification `--root`/`--home`/`IAKAFRAME_ROOT`/`IAKAFRAME_HOME`** → **[différé]**, gate séparé
   (`cli-racines-resolution.md`). Ici : simple documentation dans `HELP`.
- **NDJSON / streaming / pagination** → **[différé]** (aucun volume ne le justifie ; C-JSON reste
   compatible d'une extension `meta` ultérieure sans casse).
- **Rétro-compat des consommateurs `list --json`/`assemble --json`/`services --json`** : ce lot
   **assume les 3 ruptures** (W/T du § 3). Le CLI est **v0.x** (`package.json:3`) et interne — pas de
   politique de dépréciation formelle exigée ; les ruptures sont listées au § 8 pour le décideur.

---

## 7. Critères d'acceptation (vérifiables)

1. **Contrat racine** : pour **chaque** commande acceptant `--json`, la sortie `--json` sur un cas
   nominal est **un objet** dont `JSON.parse` réussit et dont `obj.ok === true`. **Aucune** commande
   n'émet un tableau ou un scalaire à la racine (test balaie tout le parc via des fixtures).
2. **`list` (défaut signalé)** : `iakaframe list --json` → objet `{ ok:true, count, collections:[…] }`
   (12 collections) ; `iakaframe list personas --json` → `{ ok:true, type:"personas", count:8,
   items:[…] }`. **Plus jamais** de tableau nu.
3. **`portfolio` inchangé** : `portfolio --json` reste `{ ok:true, root, count, projects:[…] }`
   (référence — non-régression).
4. **`assemble`** : `assemble <m> <t> --json` (succès) → `{ ok:true, descriptor:{…} }` ; incompat →
   `{ ok:false, error, orphans:[…] }`, `exitCode=1`.
5. **`services`** : `services --json` **écrit sur stdout** `{ ok:true, generated, count, services:[…] }`
   (aucun fichier créé) ; `services --out <fichier>` écrit le fichier ; `--json` **n'accepte plus**
   de valeur (booléen).
6. **Erreur machine** : `iakaframe list zzz --json` et `iakaframe show inexistant --json` émettent
   `{ ok:false, error:"…" }` **sur stdout**, `exitCode=1`, et **rien** sur stderr. Même vérif pour un
   échantillon de commandes à `fail()` (memory/recall/close…).
7. **`ok` universel** : un test paramétré vérifie `ok:true`/`ok:false` sur ≥1 cas succès et ≥1 cas
   erreur pour **chaque** commande à `--json` (y compris `show`, `open`, `recall`, `close`, `switch`,
   `memory path|config|list`, `observe list`, `agents`, `config`).
8. **`count` sur les collections** : toute sortie dont la charge utile est un tableau porte un
   `count` égal à la longueur du tableau (test sur `list`, `portfolio`, `review list`, `recall`,
   `observe list`, `memory init/list`, `agents`).
9. **Helper unique** : `lib/output.js` existe et **toutes** les impressions `--json` du dossier
   `commands/` transitent par lui ; un test/lint interdit un `JSON.stringify(` en `console.log`
   **hors** `lib/output.js` (garde anti-dérive, à la manière des tests `guard-*`).
10. **Frontière** : `commands/portfolio.js` et `commands/list.js` ne contiennent plus de logique de
    scan/agrégation (celle-ci vit dans `lib/portfolio.js` / `lib/library.js`) ; les commandes = args
    + délégation + `emit`.
11. **Sortie humaine intacte** : pour un échantillon (`portfolio`, `list`, `show`, `assemble`,
    `services`) la sortie **sans** `--json` est **inchangée** (test de non-régression sur le rendu).
12. **Non-régression globale** : `node --test` vert ; `iakaframe --help` mentionne `--json`
    (booléen) et `services --out` ; **zéro dépendance runtime** ajoutée (`package.json` `dependencies`
    inchangé).

---

## 8. Ruptures assumées (pour le décideur, au jalon)

Trois sorties `--json` **changent de forme** (consommateurs éventuels à adapter) :
- **`list --json`** : tableau nu → `{ ok, count, collections|items }`. *(C'est le défaut cible.)*
- **`assemble --json`** (succès) : descripteur nu → `{ ok, descriptor }`.
- **`services --json`** : n'écrit plus de fichier → sortie stdout ; l'écriture fichier passe à
  **`--out`**. Vérifier les appelants (dont la parité éventuelle avec `iakaframe-services.ps1`).

Tout le reste est **additif** (ajout de `ok`/`count`) : non cassant pour un consommateur qui lit des
clés déjà existantes. → *Le décideur valide ces 3 ruptures (CLI v0.x interne) ou demande une phase de
compat.*

---

## 9. Faits vérifiés sur le web (2026-07-18) + sources

- **Ne jamais renvoyer un tableau (ni un scalaire) à la racine d'une sortie machine** : l'état de
  l'art CLI/JSON est unanime — **toujours une enveloppe objet**, car un tableau nu **interdit**
  d'ajouter ultérieurement `count`/pagination/`warnings`/`meta` **sans casser** les consommateurs
  (« bare array = breaking change waiting to happen »). L'enveloppe coûte quelques octets et reste
  **évolutive**. → **Tranche C-JSON règle 1** : on aligne `list` (et tout tableau nu) **sur**
  `portfolio` (enveloppe), jamais l'inverse.
- **Un drapeau `--json` doit produire du JSON *pur* sur stdout** et router messages/erreurs de façon
  cohérente (pas de texte humain mêlé quand le mode machine est actif) — fondement de la **règle 4**
  (erreur = objet JSON, jamais du stderr humain en `--json`).
- **NDJSON** est la réponse **au streaming / gros volumes** — non requis ici (aucun volume), donc
  **[différé]** ; C-JSON reste compatible d'un ajout `meta` sans rupture.

Sources :
- [Command Line Interface Guidelines (clig.dev)](https://clig.dev/)
- [The CLI Spec (clispec.dev)](https://clispec.dev/)
- [Tips on Adding JSON Output to Your CLI App — Kelly Brazil](https://blog.kellybrazil.com/2021/12/03/tips-on-adding-json-output-to-your-cli-app/)
- [Structured CLI Output as Pipeline Glue — Steve Kinney](https://stevekinney.com/courses/self-testing-ai-agents/structured-cli-output-as-pipeline-glue)
- [JSON Best Practices: Design, Naming, and Structure](https://jsonwebtools.com/json-best-practices)

---

## 10. Journal de décision
- **2026-07-18** — Le décideur cadre l'**harmonisation de la surface API** du CLI
  `@naonedge/iakaframe`. **Tranché** : **convention `--json` unique (C-JSON)** — enveloppe **objet**
  systématique, `ok` obligatoire en tête, **collection sous clé pluriel + `count`** (jamais de
  tableau nu), **erreur `{ ok:false, error }`** sur stdout (rien d'humain sur stderr en `--json`),
  **`--json` booléen partout** (`services` bascule son écriture fichier vers **`--out`**). Le défaut
  signalé (`list` tableau nu vs `portfolio` enveloppe) se résout en **alignant `list` sur
  `portfolio`**. **Source unique** de la convention : nouveau **`lib/output.js`** (`emit/ok/
  collection/fail`), verrou anti-dérive ; logique inline de `portfolio`/`list` extraite vers `lib/`.
  **`--json` ajouté** à `agents`/`config`. **Aucun verbe renommé**, **sortie humaine intacte**,
  **zéro-dep**. **[Différé]** : unification des racines `--root`/`--home` (gate séparé), NDJSON.
  **Cadrage seul, aucun code de production.**

> Tant que ce jalon n'est pas validé, **aucun code n'est écrit**. Ce lot ne produit que du
> **cadrage** ; l'implémentation (Gimli) suit la validation du décideur.
