# La couverture complète du contrat machine `C-JSON`

> Lot : `C-JSON-COUVERTURE-COMPLETE`. Successeur nommé de `CONTRAT-MACHINE-DU-VERBE-INSTALL`
> (fusionné `efe195c`, gate PASS), qui a **déclaré et cliqueté** le trou sans le fermer
> (`cli/test/fixtures/couverture-json.json`, 14 verbes `hors-couverture`, motif
> « Successeur : C-JSON-COUVERTURE-COMPLETE » sur chacun).
>
> Cadré par 🔵 Gandalf le 2026-09-08. **Instruction — aucun code n'a été écrit ni exécuté ici.**

---

## 0. Ce qui a été mesuré le 2026-09-08

### 0.1 — Instruments, et leur limite déclarée

**Je n'ai pas de shell.** Ce cadrage a été fait **par lecture seule de fichiers** (`Read`,
`Grep`, `Glob`) — je n'ai lancé **aucune** commande, **aucun** test, **aucun** `node`. Toute
affirmation de ce § 0 est donc une **mesure statique de source**, jamais une mesure
d'exécution.

Conséquence directe, à ne pas contourner :

- Une lecture dit ce que le code **prétend** faire ; elle ne dit pas ce qu'il **fait**. Un verbe
  qui appelle `emit(json, …)` *paraît* conforme C-JSON ; seule l'exécution dit si sa racine est
  bien un objet, si `count` est juste, si `stderr` est vide, et quel est son code de sortie.
- **L'étape 0 de ⚒️ Gimli est donc obligatoire et non négociable** : avant toute modification,
  Gimli **exécute** chaque verbe déclarant `--json` en bac à sable (`--dry-run` quand le verbe
  écrit, dossiers temporaires, réseau réputé injoignable) et **enregistre la sortie observée**.
  C'est cette mesure d'exécution — pas la mienne — qui fait foi pour la colonne « honoré » de la
  table du § 0.3.
- Là où ma lecture et l'exécution de Gimli divergent, **l'exécution gagne**, et la divergence
  est **notée dans le rapport de remise** (elle instruit la qualité du présent cadrage).

Aucun fait externe (web) n'a été vérifié : ce lot ne dépend d'aucune version, d'aucune
bibliothèque tierce ni d'aucun état de l'art. Le CLI est à zéro dépendance runtime, le contrat
C-JSON est interne au dépôt, l'arbitrage est un arbitrage de **discipline interne**. Il n'y
avait donc rien de dehors à aller chercher — et je le déclare plutôt que de le laisser
supposer.

### 0.2 — Le fait d'exécution, attribué

Le seul fait d'**exécution** dont dispose ce cadrage est **hérité**, pas produit : c'est la
mesure **M-10** du lot précédent, relevée le 2026-09-04 par ⚒️ Gimli et gatée PASS par
🏹 Legolas — `cli/src/lib/verbes.js` déclare **40 verbes** et **57 occurrences** de `'--json'`,
pour **19** entrées `NOMINAL` dans `cli/test/guard-json-output.test.js` avant le lot (20 après
l'ajout d'`install`). Je la cite **comme mesure d'autrui**, datée et attribuée ; je ne la
rejoue pas.

### 0.3 — Les 40 verbes, tels que la source les déclare

*(Lecture statique, à **confirmer ou infirmer** par l'exécution de l'étape 0 — cf. § 0.1.)*

Trois colonnes, trois sources **différentes** — c'est leur écart qui est le sujet du lot :

- **déclaré** — le verbe porte `'--json'` dans son `options` (ou celui d'un sous-verbe) dans
  `cli/src/lib/verbes.js` ; c'est l'autorité que dérive déjà `guard-json-couverture.test.js:24-28`.
- **parsé** — le fichier de commande porte `json: { type: 'boolean' … }` dans son `parseArgs`.
- **émis** — la commande route sa sortie par `emit(...)` / `fail(...)` de `cli/src/lib/output.js`
  (jamais un `JSON.stringify` direct — le verrou statique `guard-json-output.test.js:30-39`
  l'interdit dans `commands/`, et je n'ai relevé **aucun** contrevenant).
- **NOMINAL** — le verbe a au moins une entrée dans `guard-json-output.test.js:79-105`.

| # | verbe | déclaré | parsé | émis | NOMINAL | classe |
|---|---|---|---|---|---|---|
| 1 | `onboard` | non | non | — | — | écrivain réseau, **interactif par construction** |
| 2 | `init` | non | non | — | — | écrivain |
| 3 | `snapshot` | non | non | — | — | écrivain |
| 4 | `update` | non | non | — | — | écrivain réseau |
| 5 | `install` | **oui** | oui | oui | **oui** | écrivain (gaté, lot précédent) |
| 6 | `repo` | non | non | — | — | écrivain réseau |
| 7 | `services` | **oui** | oui | oui | **oui** | lecteur réseau |
| 8 | `canaux` | **oui** | oui | oui | **oui** | lecteur réseau (`--rattraper` écrit) |
| 9 | `endpoints` | **oui** | oui | oui | **non** | lecteur réseau |
| 10 | `config` | **non** | **oui** | **oui** | **oui** | écrivain — **écart, cf. ci-dessous** |
| 11 | `agents` | **oui** | oui | oui | partiel | `list`/`status` couverts ; `affect`/`fullteam` non |
| 12 | `skills` | **oui** | oui | oui | **non** | écrivain (`deploy`, `--check`) |
| 13 | `models` | **oui** (+ `set`/`unset`) | oui | oui | **non** | **interactif** + deux écrivains |
| 14 | `go` | non | non | — | — | exécution (texte libre) |
| 15 | `banner` | non | non | — | — | lecteur (ASCII, prose par nature) |
| 16 | `brief` | non | non | — | — | lecteur (prose) |
| 17 | `recap` | non | non | — | — | lecteur (prose) |
| 18 | `jalon` | non | non | — | — | lecteur (prose) |
| 19 | `list` | **oui** | oui | oui | **oui** (×2) | lecteur |
| 20 | `show` | **oui** | oui | oui | **oui** | lecteur |
| 21 | `add` | **oui** | oui | oui | **non** | écrivain (bibliothèque) |
| 22 | `remove` | **oui** | oui | oui | **non** | écrivain (bibliothèque) |
| 23 | `attach` | **oui** | oui | oui | **non** | écrivain (bibliothèque) |
| 24 | `detach` | **oui** | oui (`attach.js`) | oui | **non** | écrivain (bibliothèque) |
| 25 | `assemble` | **oui** | oui | oui | **oui** | lecteur (dry-run par défaut, `--write` écrit) |
| 26 | `vendor-check` | **oui** | oui | oui | **non** | lecteur — **abstention `ok:false` + exit 0**, cf. AR-J3 |
| 27 | `frame` | **oui** (`verify`/`lint`/`new`/`use`) | oui | oui | **non** | 2 lecteurs + 2 écrivains |
| 28 | `switch` \| `use` | **oui** | oui | oui | **non** | écrivain (kit du projet) |
| 29 | `memory` | **oui** (7 sous-verbes) | oui | oui | partiel | `init`/`path`/`config`/`list` couverts ; `add`/`replace`/`remove` non |
| 30 | `produit` | **oui** (7 sous-verbes) | oui | oui | **non** | 3 lecteurs + 4 écrivains |
| 31 | `open` | **oui** | oui | oui | **oui** | lecteur |
| 32 | `recall` | **oui** | oui | oui | **oui** | lecteur |
| 33 | `close` | **oui** | oui | oui | **oui** | écrivain (`proposals/`) |
| 34 | `review` | **oui** (5 sous-verbes) | oui | oui | partiel | `list` couvert ; `show`/`apply`/`reject`/`auto` non |
| 35 | `consolidate` | **oui** | oui | oui | **non** | écrivain (`proposals/`, n'applique rien) |
| 36 | `observe` | **oui** (+ `list`) | oui | oui | partiel | `list` couvert ; le top-level écrit le store |
| 37 | `portfolio` | **oui** | oui | oui | **oui** | lecteur |
| 38 | `range` | **oui** | oui | oui | **non** | écrivain (dépôt restic), a déjà `--dry-run` |
| 39 | `root` | non | non | — | — | lecteur (une ligne de prose) |
| 40 | `commands` | **oui** | oui | oui | **non** | lecteur (introspection du registre) |

**Ce que cette table dit — et qui n'est pas ce que j'attendais.**

1. **Il n'y a, statiquement, aucun « accepté-et-ignoré ».** Les **28** verbes qui déclarent
   `--json` au registre le **parsent** tous, et **tous** routent leur sortie par `output.js`. Le
   verrou statique de `guard-json-output.test.js:30-39` a tenu : aucune commande n'imprime un JSON
   en direct. La règle demandée au § 2 (« honore, ou retire la déclaration ») est donc — sur cette
   lecture — **déjà vraie partout**. Ce que le lot doit fermer n'est **pas** un trou de
   *comportement* : c'est un trou de **preuve**.
2. **Le trou réel est un trou de mesure.** `guard-json-output.test.js:79-105` porte **20**
   invocations pour **15** verbes distincts ; **14** verbes déclarant `--json` ne sont mesurés par
   **aucune** invocation, et parmi les couverts, plusieurs le sont **partiellement** (sous-verbes :
   `agents affect`/`fullteam`, `memory add`/`replace`/`remove`, `review show`/`apply`/`reject`/`auto`,
   `observe` top-level). Le registre `couverture-json.json` compte au **grain verbe** ; le grain
   réel du risque est le **sous-verbe**.
3. **Un écart franc : `config`.** `cli/src/commands/config.js:46` parse `--json` (commentaire
   explicite « sortie machine C-JSON »), `config.js:110` l'émet, et
   `guard-json-output.test.js:86` le **teste** — mais `verbes.js:130` **ne le déclare pas**, et
   `docs/commandes.md:247` **ne le documente pas**. C'est l'inverse exact du défaut recherché : une
   option **honorée et testée mais invisible**. Conséquence mécanique : `config` est **absent** de
   `couverture-json.json` (le registre dérive de `verbes.js`), donc **le registre lui-même est
   incomplet** — un consommateur machine qui lit `iakaframe commands --json` pour savoir qui parle
   JSON se voit **cacher** `config`.
4. **Une déviation de contrat assumée mais non nommée : `vendor-check`.**
   `cli/src/commands/vendor-check.js:275-277` rend, quand le frère GUI est absent, `ok:false` avec
   un **exit 0** (« défaut gracieux »). La règle 4 du contrat (`cli/src/lib/output.js:6-8`) dit
   `ok:false` ⇒ `exitCode = 1`. Ce n'est pas un bug — c'est un **troisième état** (« rien n'a été
   vérifié ») que le contrat ne connaît pas. Il faut le **nommer** (AR-J3), pas le découvrir en
   écrivant la garde.
5. **Le grain du registre est déjà déclaré comme un chantier.** `verbes.js:349-357` nomme
   explicitement l'« arbitrage de GRAIN » (couverture par verbe, jamais par sous-verbe) à propos de
   `frame`. Ce lot **hérite** de cette limite ; il ne la lève pas (§ 4, Exclu).

### 0.4 — Le harnais disponible, relevé

- `cli/test/guard-json-output.test.js` — deux volets : verrou statique (l.30-39) et balayage de
  contrat (`NOMINAL` l.79-105, **20** invocations ; `ERRORS` l.124-131, **6** invocations). Le
  harnais **monte déjà** des bacs à sable : `mkdtempSync` ×4 + un dépôt git minimal avec un `--bare`
  local (l.50-67) et trois dossiers dédiés à `install` (l.73-76). **Le patron d'isolement existe :
  ce lot l'étend, il ne l'invente pas.**
- `cli/test/guard-json-couverture.test.js` — 4 tests : fidélité registre ↔ `verbes.js`, double
  couverture d'`install`, motif obligatoire sur tout `hors-couverture`, cliquet
  `horsCouvertureCount`. **Ces 4 tests restent, inchangés** : ils sont le socle sur lequel le
  présent lot fait **descendre le cliquet à 0**.
- `cli/test/fixtures/couverture-json.json` — 28 entrées, `horsCouvertureCount: 14`, chaque
  hors-couverture portant le motif « Successeur : C-JSON-COUVERTURE-COMPLETE ». **Ce lot est ce
  successeur** : il doit vider ces 14 motifs, pas les réécrire.
- **Tous les verbes écrivains offrent déjà un drapeau de redirection** (`--path`, `--project`,
  `--home`, `--root`, `--library`, `--gui`, `--target-claude`…) : `init`, `config`, `agents`,
  `skills`, `models set/unset`, `add`, `remove`, `attach`, `detach`, `switch`, `frame new/use`,
  `memory *`, `produit *`, `close`, `review apply/reject/auto`, `consolidate`, `observe`, `range`.
  C'est le fait qui rend l'arbitrage AR-J2 tranchable **sans toucher au code de production**.
- `cli/src/lib/interactif.js:36-50` — `peutDemander()` refuse **déjà** l'interactivité quand
  `json === true` (condition 5). La cohabitation `--json` / `--guide` est donc **déjà sûre** ; ce
  qui reste à trancher, c'est si elle doit être **silencieuse** (AR-J4).

### 0.5 — Les consommateurs machine, relevés

| Consommateur | Ce qu'il consomme réellement | Source |
|---|---|---|
| **`iakaInstall`** (façade Tauri) | **`install --events --feu-vert stdin`** — le canal **NDJSON**, pas `--json` | `iakaInstall/src-tauri/src/pilote.rs:96-108, 496-522` |
| **`IakaCockpit`** | **Rien du CLI.** Le seul `Command::new` de `src-tauri/src/` est `git` (`git.rs:15,32`, `resume.rs:245-264`) ; le Cockpit lit la bibliothèque **par le système de fichiers** (`frame.rs`, `reservoir.rs`, `config.rs`) | grep `Command::new` sur `IakaCockpit/src-tauri/src/` |
| **Scripts du portefeuille / n8n** | **Non mesuré** — je n'ai pas de shell et n'ai pas inspecté `~/work/.portefeuille` ni les workflows n8n | § 0.1 |

**Ce que ça change pour le lot.** Aucun consommateur machine **actuel** ne dépend de `--json` sur
un des 14 verbes non couverts. Le lot n'est donc **pas** tiré par un besoin client immédiat : il
est tiré par une **promesse déjà publiée** — 28 verbes annoncent `--json` dans `--help` et dans
`docs/commandes.md`, et 14 d'entre eux ne sont **prouvés par rien**. C'est une dette de **preuve
sur une promesse publique**, et c'est à ce titre qu'elle se solde — pas au titre d'un client qui
attend.

## 1. Problème

Le CLI **promet** une sortie machine sur **28 verbes** (`--json` au registre, dans `--help`, dans
`docs/commandes.md`). Il n'en **prouve** que 15, par 20 invocations — et partiellement : les
sous-verbes qui écrivent (`agents affect`, `memory add`, `review apply`, `produit replace`…) ne
sont mesurés par aucune garde de sortie. Un programme qui appelle un des 14 verbes non couverts
n'a **aucune assurance** que la racine sera un objet, que `count` sera juste, que `stderr` sera
vide, ni que le code de sortie voudra dire quelque chose.

Trois écarts précis, mesurés au § 0.3, aggravent le tableau :

- `config` **honore** `--json` sans le **déclarer** : le registre — que `iakaframe commands --json`
  publie comme source unique — **ment par omission** à ses consommateurs.
- `vendor-check` rend `ok:false` avec **exit 0** : le contrat C-JSON ne connaît pas cet état, donc
  personne ne peut le consommer correctement.
- Le registre de couverture compte au **grain verbe** alors que le risque vit au **grain
  sous-verbe** : un verbe « couvert » peut avoir six sous-verbes non mesurés.

Le lot précédent a fait ce qu'il devait : il a **déclaré, motivé et cliqueté** le trou plutôt que
de le taire (`couverture-json.json`, `horsCouvertureCount: 14`). Un cliquet qui ne descend jamais
n'est cependant qu'une dette bien tenue. **Ce lot le descend à 0.**

## 2. Décision retenue

**Ce lot ferme un trou de PREUVE, pas un trou de COMPORTEMENT.** La lecture (§ 0.3) ne trouve
aucun verbe qui accepte `--json` et l'ignore. La décision structurante en découle et doit être
tenue fermement :

> **Le lot est un lot de GARDES, pas de refonte.** Toute modification du code de production est
> une **exception**, autorisée uniquement quand une mesure d'exécution de l'étape 0 **prouve** une
> non-conformité, et alors **limitée à cette non-conformité**. Aucune retouche de confort, aucune
> harmonisation de champs, aucun renommage de clé.

Quatre engagements en découlent.

**(a) La règle, énoncée une fois pour toutes.** *Un verbe qui déclare `--json` l'honore — ou il ne
le déclare pas.* « Honorer » = les 5 règles de `cli/src/lib/output.js:1-11` : une racine objet,
`ok` en première clé, collection ⇒ pluriel + `count`, erreur ⇒ `{ok:false,error}` sur **stdout** +
exit 1 + **stderr vide**, `--json` **booléen** partout. Aucun troisième état (« accepté et
ignoré ») n'est admis. Le corollaire est **symétrique et il mord** : un verbe qui honore `--json`
sans le déclarer (`config`) est **le même défaut vu de l'autre côté**, et il se corrige dans ce
lot.

**(b) Trois sources, une seule vérité.** `--json` existe aujourd'hui dans trois fichiers —
`verbes.js`, l'`USAGE` de la commande, `docs/commandes.md`. Le dépôt connaît déjà ce raisonnement
(`verbes.js:8-10` : « un nombre dupliqué à la main finit toujours par mentir »). Le lot pose une
**garde de dérivation** : *déclaré au registre ⟺ parsé par la commande ⟺ documenté*. C'est elle
qui a attrapé `config` par lecture ; c'est elle qui attrapera le prochain.

**(c) Les écrivains se mesurent en bac à sable, pas en `--dry-run`.** Tous les verbes écrivains
offrent déjà un drapeau de redirection (§ 0.4). Ajouter un `--dry-run` à quinze verbes serait
inventer quinze comportements nouveaux pour tester l'ancien — l'exact opposé de la sobriété. Le
harnais **monte déjà** des `mkdtempSync` et un dépôt git jetable
(`guard-json-output.test.js:50-67`) : on **étend ce patron**. → AR-J2.

**(d) Le grain reste le verbe pour le registre, le sous-verbe pour la garde.**
`couverture-json.json` continue de compter par **verbe** — changer son grain rouvrirait
l'arbitrage explicitement gelé en `verbes.js:349-357`, qui n'est pas le sujet de ce lot. Mais
`NOMINAL`, lui, porte des **invocations** : la garde de complétude exige une invocation par
**sous-verbe déclarant `--json`**, pas une par verbe. Le registre reste un compteur ; la garde
devient la mesure. → AR-J1.

## 3. Arbitrages — ce que je ne peux pas trancher seul

> **Verdicts rendus le 2026-09-08** — autonomie maximale (Stéphane, 2026-09-06), recommandations appliquées
> par 🔴 Aragorn : **AR-J1 → (b)** sous-verbe pour `NOMINAL`, verbe pour le registre. **AR-J2 → (b)** bac à sable
> par les drapeaux de redirection existants. **AR-J3 → (b)** règle 6 (abstention légale ssi `status` explicite)
> + `vendor-check --strict` couvert. **AR-J4 → (c)** refus explicite seulement si `--guide` tapé. **AR-J5 → (a)**
> zéro strict puis garde de complétude. **Engagement** : J0 + J1 fermes maintenant ; J2/J3 décidés après le
> gate de J1.

Cinq arbitrages. Chacun a une **recommandation** ; Aragorn dispose de l'autonomie maximale
accordée par le décideur pour les appliquer.

### AR-J1 — À quel grain la couverture est-elle exigée ?

Le registre compte par verbe ; le risque vit par sous-verbe (`memory` a 7 sous-verbes, `produit` 7,
`review` 5, `frame` 4).

| Option | Ce que ça donne | Coût |
|---|---|---|
| (a) Grain **verbe** partout | une invocation par verbe suffit ; `memory add` reste non mesuré | faible, mais la garde ment : « couvert » ≠ mesuré |
| (b) Grain **sous-verbe** pour `NOMINAL`, grain **verbe** pour le registre | ~50 invocations au lieu de 28 ; le registre inchangé dans sa forme | moyen ; c'est le vrai coût du lot |
| (c) Grain **sous-verbe** partout (registre inclus) | cohérent de bout en bout | rouvre l'arbitrage gelé `verbes.js:349-357` + refonte de fixture + des 4 tests CA-M16 |

> **Recommandation : (b).** C'est la seule qui mesure le risque là où il est sans rouvrir un
> arbitrage que le dépôt a explicitement décidé de laisser fermé. (c) est le bon état final, mais
> c'est un lot à lui seul (`REGISTRE-GRAIN-SOUS-VERBE`), à nommer comme successeur — pas à faire
> « tant qu'on y est ».

### AR-J2 — Comment mesurer les verbes qui écrivent ?

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) Ajouter `--dry-run` aux ~15 écrivains | uniforme, lisible | **inventer 15 comportements neufs** pour tester l'existant ; 15 nouvelles surfaces à documenter, à garder, à faire diverger |
| (b) **Bac à sable** via les drapeaux de redirection existants | zéro ligne de production ; étend `guard-json-output.test.js:50-67` | montage de fixtures (bibliothèque jetable pour `add`/`remove`/`attach`/`detach`) |
| (c) Ne pas mesurer les écrivains | gratuit | laisse le trou exactement où il est le plus dangereux |

> **Recommandation : (b).** Le § 2 pose que ce lot ne touche pas au code de production ; (a) le
> viole d'entrée. Et (b) est déjà le patron du dépôt. **Précision d'exécution** : `range` a déjà
> `--dry-run` — on l'**utilise** ; `assemble` est dry-run **par défaut** — on ne passe pas
> `--write`. Ce ne sont pas des exceptions à (b), ce sont des redirections déjà offertes.

### AR-J3 — Que fait le contrat de l'état « rien n'a été vérifié » ?

`vendor-check.js:275-277` rend `ok:false` **avec exit 0** quand le frère GUI est absent. La règle 4
dit `ok:false` ⇒ exit 1. Un consommateur ne peut pas distinguer « échec » de « abstention ».

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) Corriger `vendor-check` (exit 1) | contrat pur | **change un comportement observable** d'un verbe gaté, et casse un « défaut gracieux » voulu (le frère GUI est légitimement absent chez la plupart) |
| (b) **Nommer l'abstention dans le contrat** : `ok:false` + `exit 0` est légal **si et seulement si** la charge porte un `status` explicite ; l'écrire dans l'en-tête de `output.js` et dans `docs/commandes.md` ; couvrir `vendor-check` par la liste **`ERRORS`** en `--strict` (là il rend bien `ok:false` + exit 1 + stderr vide) | le contrat dit enfin la vérité ; zéro changement de comportement | il faut écrire la règle et une garde dédiée à l'abstention |
| (c) Exempter `vendor-check` de la garde | gratuit | ré-institue une exclusion silencieuse, exactement ce que CA-M16 a supprimé |

> **Recommandation : (b).** Un contrat qui ne décrit pas un état que son propre code produit est un
> contrat faux. (b) le rend vrai sans toucher au verbe, et transforme la déviation en **règle 6**
> documentée. **Contrainte** : la règle 6 doit être **restrictive** — l'abstention est réservée à
> « je n'ai rien pu mesurer », jamais à « j'ai mesuré et c'est mauvais ». Une garde doit interdire
> qu'un autre verbe l'invoque sans `status`.

### AR-J4 — `--json --guide` : précédence silencieuse ou refus explicite ?

`peutDemander()` (`interactif.js:47`) rend `false` dès `json === true` : `--guide` est aujourd'hui
**silencieusement ignoré** quand `--json` est demandé.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) Statu quo (précédence silencieuse) | zéro travail | un drapeau **explicitement tapé** est ignoré sans un mot : c'est un « accepté-et-ignoré », exactement ce que le § 2 (a) proscrit |
| (b) Refus explicite dès que les deux sont présents | franc | casserait les flux **interactifs par construction** (`models` top-level, `install`, `onboard --from-update`) qui passent `guide: true` **inconditionnellement** (`interactif.js:19-24`) — ils deviendraient un refus alors qu'ils n'ont jamais vu de `--guide` |
| (c) Refus explicite **seulement quand `--guide` a été tapé par l'appelant** — c.-à-d. aux sites `values.guide && peutDemander(...)` — `{ok:false, error:"--json et --guide s'excluent"}`, exit 1, stderr vide ; la précédence inconditionnelle reste inchangée | dit l'exclusion sans casser les flux existants | **9 sites** d'appel (`list.js:60`, `show.js:67`, `add.js:71`, `remove.js:82`, `attach.js:103` — **mutualisé** `attach`+`detach` —, `switch.js:93`, `frame.js:237`, `models.js:843`, `models.js:978`) couvrant les **10 cibles guidées** de `docs/commandes.md:169-178` — **du code de production**, donc une exception au § 2 à assumer |

> **Recommandation : (c).** C'est le seul qui distingue « l'appelant a demandé deux choses
> incompatibles » de « le flux est interactif par nature ». C'est une exception assumée à la règle
> « pas de code de production » du § 2, et je la nomme comme telle : elle est **petite,
> mécanique et gardée** (une garde par site). **Si le décideur veut un lot strictement sans
> production, (a) est acceptable** — à condition d'être **écrit** dans `docs/commandes.md` comme
> une précédence **voulue**, jamais laissé implicite.

### AR-J5 — Le cliquet doit-il atteindre 0, et que vaut « couvert » ?

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) **0 strict** en fin de lot, avec un vocabulaire de couverture élargi (`c-json`, `c-json-erreur`, `evenements`) | la promesse est tenue en entier ; le registre devient un compteur à zéro qui ne peut que remonter visiblement | le plus de travail ; oblige à trancher AR-J3 |
| (b) 0 **sauf liste blanche nommée** | pragmatique | une liste blanche est un `hors-couverture` qui a changé de nom |
| (c) Cliquet décroissant sans cible | progressif | on ne saura jamais quand c'est fini |

> **Recommandation : (a).** Un cliquet a besoin d'un fond. Et une fois à 0, la garde de complétude
> (G-J1) prend le relais : elle rougit à **l'ajout** d'un verbe `--json` sans invocation, ce qui
> rend la régression impossible **sans** avoir à maintenir un compteur à la main.

## 4. Périmètre

### Découpage en quatre lots gatables

Chaque sous-lot est **livrable et gatable seul**, laisse le dépôt **vert**, et fait **descendre le
cliquet**. C'est la condition pour que le décideur puisse arrêter après J1 ou J2 sans laisser un
chantier ouvert.

| Lot | Contenu | Cliquet en sortie | Gate |
|---|---|---|---|
| **J0 — Socle** | Mesure d'exécution des 28 verbes ; correction de l'écart `config` ; **garde de dérivation** (déclaré ⟺ parsé ⟺ documenté) ; **règle 6** du contrat (abstention, AR-J3) | 14 → 14 (inchangé) | Legolas |
| **J1 — Lecteurs purs** | 9 invocations : `commands`, `endpoints`, `frame verify`, `frame lint`, `review show`, `produit path`/`config`/`list`, `vendor-check --strict` (en `ERRORS`) | 14 → **9** | Legolas |
| **J2 — Écrivains en bac à sable** | ~26 invocations : `skills`, `add`, `remove`, `attach`, `detach`, `switch`, `frame new`/`use`, `produit init/add/replace/remove`, `memory add/replace/remove`, `review apply/reject/auto`, `consolidate`, `range --dry-run`, `agents affect`/`fullteam`, `models set`/`unset`, `observe` | 9 → **0** | Legolas |
| **J3 — Interactifs & verrou** | AR-J4 (refus explicite `--json --guide`, 9 sites / 10 cibles) ; **garde de complétude** G-J1 ; contrefactuels ; `horsCouvertureCount: 0` figé | 0, **verrouillé** | Legolas + jalon de clôture |

### Inclus

1. **La mesure d'exécution des 28 verbes déclarant `--json`** (étape 0), consignée dans
   `docs/qualite/` — c'est elle qui fait foi, pas le § 0.3.
2. **`cli/src/lib/verbes.js`** — ajout de `'--json'` aux `options` de `config` (l.130) **et rien
   d'autre** dans ce fichier, sauf si l'étape 0 prouve un autre écart déclaré/parsé.
3. **`docs/commandes.md`** — la ligne `config` (l.247) gagne `--json` ; la **règle 6** (abstention)
   est écrite ; la précédence `--json`/`--guide` retenue en AR-J4 est écrite. Dans **le même lot**
   que le code (CA-09 hérité).
4. **`cli/src/lib/output.js`** — l'en-tête de contrat (l.1-11) gagne la **règle 6** (AR-J3). Le
   **code** du module reste inchangé.
5. **`cli/test/guard-json-output.test.js`** — extension de `NOMINAL` et d'`ERRORS` au **grain
   sous-verbe** ; montage des bacs à sable ; les **20 invocations existantes restent identiques,
   octet pour octet**.
6. **`cli/test/guard-json-couverture.test.js`** — la **garde de complétude** (G-J1) et la garde de
   **dérivation** (G-J2) s'y ajoutent ; les **4 tests CA-M16 existants restent inchangés**.
7. **`cli/test/fixtures/couverture-json.json`** — entrée `config` ajoutée, 14 motifs
   `hors-couverture` retirés au fil des lots, `horsCouvertureCount` mené à **0**, vocabulaire de
   couverture élargi (`c-json-erreur`) si AR-J3 = (b).
8. **Les témoins de prose humaine** (§ 5, étape 1) — enregistrés **avant** toute modification,
   comparés après, sur le modèle de CA-M8 du lot précédent.
9. **AR-J4 = (c) uniquement** : les **9 sites** `values.guide && peutDemander(...)` (10 cibles
   guidées, `attach`/`detach` partageant le site `attach.js:103`). C'est la **seule** écriture de
   production autorisée hors correction prouvée par l'étape 0.

### Exclu — décisions, pas oublis

| Exclu | Motif | Successeur |
|---|---|---|
| **Donner `--json` à un verbe qui ne le déclare pas** (`init`, `snapshot`, `update`, `repo`, `go`, `banner`, `brief`, `recap`, `jalon`, `root`, `onboard`) | Ce lot **prouve** une promesse existante ; il n'en fait pas de nouvelle. Un verbe sans `--json` n'a **pas** de trou de couverture, il a une absence de promesse — c'est légitime | `C-JSON-EXTENSION` (à cadrer **si** un consommateur le demande, jamais avant) |
| **Faire passer le registre de couverture au grain sous-verbe** | Rouvre l'arbitrage explicitement gelé `verbes.js:349-357` | `REGISTRE-GRAIN-SOUS-VERBE` |
| **Harmoniser les noms de champs entre verbes** (`projets` vs `projects`, `essais` vs `services`…) | Ce lot **mesure la forme**, il ne **refait pas** le vocabulaire. Toute renomination casse un consommateur | `C-JSON-VOCABULAIRE` |
| **Toute retouche de la prose humaine** | Protégée par témoins (CA-J8) | — |
| **`--events` sur un autre verbe qu'`install`** | Décision du lot précédent, § 4 « Exclu ». Inchangée | — |
| **Toute écriture dans `iakaInstall` ou `IakaCockpit`** | Autres dépôts ; et aucun des deux ne consomme `--json` (§ 0.5) | — |
| **Corriger le comportement de `vendor-check`** | AR-J3 recommande de **nommer** l'état, pas de changer un verbe gaté | — |
| **Mesurer les scripts du portefeuille / n8n** | Non inspectés (§ 0.5) ; les inclure serait supposer | à relever si un rouge apparaît |
| **`--help` sous contrat C-JSON** | `--help` est de la **prose par destination** ; aucun verbe ne déclare `--json` sur son aide. `iakaframe commands --json` **est** la forme machine de l'inventaire, et il est couvert en J1 | — |

## 5. Étapes d'implémentation, ordonnées

**Étape 0 — Mesurer, AVANT d'écrire une ligne (⚒️ Gimli, obligatoire).**
Je n'ai pas de shell (§ 0.1). Ces mesures sont **dues** et leurs sorties **citées** dans le rapport
de remise. Pour **chacun des 28 verbes** déclarant `--json` (et pour `config`), exécuter en bac à
sable et enregistrer : `stdout` parse-t-il en JSON ? racine = objet ? `ok` en première clé ?
collection ⇒ pluriel + `count` juste ? `stderr` vide ? code de sortie ?

```bash
cd ~/work/iakaframe
# Le dépôt est vert AVANT toute modification (le point de comparaison)
cd cli && node --test test/ && cd ..
# L'écart `config` : parsé+émis+testé, mais absent du registre et de la doc
grep -n "json" cli/src/commands/config.js | head -3
grep -n "'--json'" cli/src/lib/verbes.js | sed -n '1,60p'   # attendu : PAS de ligne config
grep -n '^| `config`' docs/commandes.md                     # attendu : PAS de --json
# L'abstention de vendor-check : ok:false AVEC exit 0
node cli/src/index.js vendor-check --json --gui /tmp/absent-$$ ; echo "exit=$?"
# Les comptes qui commandent le lot (attendu : 40 verbes, 57 '--json', 20 NOMINAL, 14 hors-couverture)
grep -c "^    id: '" cli/src/lib/verbes.js
grep -c "'--json'" cli/src/lib/verbes.js
node -e "const j=require('./cli/test/fixtures/couverture-json.json');console.log(j.horsCouvertureCount, j.verbes.length)"
```

**Si une mesure contredit le § 0.3, ARRÊTER et remonter à 🔵 Gandalf.** Le § 2 et les cinq
arbitrages reposent sur cette table ; une instruction assise sur un fait faux se **re-cadre**, elle
ne s'exécute pas. En particulier : si l'étape 0 découvre un verbe qui **accepte et ignore**
`--json`, le § 2 change de nature (le lot cesse d'être « garde seule ») et l'arbitrage revient au
décideur.

**Étape 1 — Enregistrer les témoins de prose, AVANT la première ligne de production.**
Pour chaque verbe touché, capturer la sortie humaine (sans `--json`) dans
`cli/test/fixtures/temoins-prose/<verbe>.txt`. C'est le point de comparaison de CA-J8. Ce geste
vient **avant** toute modification — un témoin pris après ne prouve rien.

**Étape 2 (J0) — Fermer l'écart `config`.** `'--json'` dans `verbes.js:130` ; `--json` dans la
ligne `docs/commandes.md:247` ; entrée `config` dans `couverture-json.json` avec
`couverture: ["c-json"]` (elle **est** déjà testée, `guard-json-output.test.js:86`) — donc
`horsCouvertureCount` **ne bouge pas** et le compte de verbes passe de 28 à 29. Vérifier que
`guard-json-couverture.test.js` (test 1) reste vert : c'est lui qui exige la correspondance exacte.

**Étape 3 (J0) — Poser la garde de dérivation (G-J2).** Un test qui, pour chaque verbe de
`verbes.js` : si `'--json'` est déclaré ⇒ le fichier `commands/<verbe>.js` porte
`json: { type: 'boolean'` **et** la ligne de `docs/commandes.md` du verbe mentionne `--json` ; et
réciproquement. Jouer le contrefactuel dans les deux sens, puis le révoquer.

**Étape 4 (J0) — Écrire la règle 6 (AR-J3).** En-tête de `cli/src/lib/output.js` + section de
`docs/commandes.md`. Ajouter la garde : toute charge `ok:false` sortant avec un **exit 0** doit
porter un champ `status` non vide.

**Étape 5 (J1) — Les 9 invocations de lecteurs purs.** Aucune ne demande de fixture lourde.
Points d'attention nommés : `endpoints` se mesure **sans réseau réel** avec
`--url http://127.0.0.1:1/x --timeout 1` (le rapport reste `ok:true`, la sonde échoue — même
patron que `services --hosts 127.0.0.1` déjà en place, `guard-json-output.test.js:97`) ;
`vendor-check` va dans **`ERRORS`** avec `--strict --gui <tmp>` (ok:false, exit 1, stderr vide) ;
`frame lint --all` évite de dépendre d'un id précis. Retirer les 9 motifs correspondants et
descendre `horsCouvertureCount` à 9 **dans le même commit**.

**Étape 6 (J2) — Les écrivains, en bac à sable.** Étendre le préambule de fixtures de
`guard-json-output.test.js:50-76`. Trois familles de bacs à sable, à monter une fois :

- **bibliothèque jetable** (`--root`) pour `add`, `remove`, `attach`, `detach`, `frame new`,
  `frame use`, `switch` — copier le strict minimum d'atomes nécessaires, jamais la vraie
  bibliothèque du dépôt ;
- **canon jetable** (`--home` / `--project`) pour `memory add/replace/remove`,
  `produit init/…/remove`, `review apply/reject/auto`, `consolidate`, `observe` ;
- **projet jetable** (`--path` / `--project`) pour `agents affect`/`fullteam`, `skills`,
  `models set`/`unset`.

`range` s'exécute avec **son** `--dry-run`. `assemble` reste en dry-run par défaut. **Aucune
écriture hors des `mkdtempSync`** : l'ajouter au `test.after()` de nettoyage
(`guard-json-output.test.js:145-147`). Descendre `horsCouvertureCount` à **0**.

**Étape 7 (J3) — L'exclusion `--json` / `--guide` (si AR-J4 = (c)).** Aux **9 sites**
`values.guide && peutDemander(...)`, insérer le refus explicite **avant** l'appel à
`peutDemander()` — sinon la condition 5 (`interactif.js:47`) avale le cas et le refus n'est jamais
atteint. Un test par **cible guidée** (10), pas par site : `attach` et `detach` partagent
`attach.js:103` mais sont deux verbes distincts pour l'appelant.

**Étape 8 (J3) — La garde de complétude (G-J1) et le verrouillage.** Dériver de `verbes.js` la
liste des **invocations attendues** (verbe + sous-verbes déclarant `--json`) et exiger que chacune
ait au moins une entrée dans `NOMINAL` **ou** dans `ERRORS`. Contrefactuel obligatoire : ajouter un
verbe fictif portant `--json` à `verbes.js` ⇒ **rouge nommant l'id**, puis révoquer.

**Étape 9 — Non-régression et remise.** Rejouer `node --test test/` (tout vert, y compris les 20
invocations d'origine intactes), comparer les témoins de prose de l'étape 1, puis remettre à
🏹 Legolas avec les sorties de l'étape 0 citées.

## 6. Fichiers concernés

| Fichier | Ce qui change | Lot |
|---|---|---|
| `cli/src/lib/verbes.js` | `'--json'` ajouté aux `options` de `config` (l.130). **Rien d'autre** | J0 |
| `cli/src/lib/output.js` | En-tête de contrat : **règle 6** (abstention `ok:false` + exit 0 + `status`). **Code inchangé** | J0 |
| `docs/commandes.md` | Ligne `config` (l.247) ; règle 6 ; précédence `--json`/`--guide` (AR-J4) | J0 / J3 |
| `cli/test/guard-json-output.test.js` | Bacs à sable étendus ; ~35 invocations ajoutées à `NOMINAL`/`ERRORS` ; nettoyage étendu. **Les 20 existantes intactes** | J1 / J2 |
| `cli/test/guard-json-couverture.test.js` | +G-J1 (complétude), +G-J2 (dérivation), +garde de la règle 6. **Les 4 tests CA-M16 intacts** | J0 / J3 |
| `cli/test/fixtures/couverture-json.json` | +`config` ; 14 motifs retirés ; `horsCouvertureCount` 14 → 9 → 0 ; vocabulaire `c-json-erreur` | J0→J2 |
| `cli/test/fixtures/temoins-prose/*.txt` | **Neufs** : témoins de prose humaine, enregistrés à l'étape 1 | J0 |
| `cli/src/commands/{list,show,add,remove,attach,switch,frame,models}.js` | **Uniquement si AR-J4 = (c)** : refus explicite `--json --guide` aux 10 sites | J3 |
| `docs/qualite/mesures-etape-0-lot-C-JSON.md` | **Neuf** : la table des 28 verbes **mesurée par exécution**, qui remplace le § 0.3 comme autorité | J0 |

## 7. Risques

| # | Risque | Mitigation |
|---|---|---|
| **R-J1** | **Le § 0.3 est une lecture, pas une mesure.** Si un verbe accepte-et-ignore réellement `--json`, le § 2 (« lot de gardes ») est faux et le lot change de taille | **Étape 0 bloquante** : toute contradiction ⇒ ARRÊT et retour à 🔵 Gandalf (§ 5). L'estimation du § 9 porte une **inconnue chiffrée** pour ce cas |
| **R-J2** | **Une garde qui écrit hors bac à sable.** `add`/`remove`/`attach`/`detach` écrivent dans la **bibliothèque** ; un `--root` oublié dans un test corrompt le dépôt réel | Bibliothèque **jetable obligatoire** (étape 6) ; garde de test : aucun chemin de fixture ne doit résoudre sous `REPO` ; `test.after()` étendu (`guard-json-output.test.js:145-147`) |
| **R-J3** | **Un test réseau déguisé.** `endpoints`, `services`, `canaux` peuvent devenir des tests lents ou flaky en CI hors ligne | `--url http://127.0.0.1:1/...` + `--timeout 1` : la sonde **échoue vite et de façon déterministe**, et c'est exactement ce qu'on veut mesurer (la **forme** du rapport, pas le réseau). Patron déjà en place l.97-98 |
| **R-J4** | **~35 invocations ajoutées = un test lent.** Chaque invocation est un `spawnSync` de Node | Mesurer la durée à l'étape 0 et la **reporter** ; si le fichier dépasse ~60 s, le scinder par classe (`guard-json-lecteurs`/`guard-json-ecrivains`) — décision **de Gimli au constat**, pas d'avance |
| **R-J5** | **La garde de dérivation (G-J2) parse `docs/commandes.md` en texte.** Une reformulation de la doc la casse sans qu'un comportement ait changé | La garde cherche la **présence de la sous-chaîne `--json` sur la ligne du verbe**, jamais une forme exacte de phrase. Si ça reste fragile au constat, la garde se réduit à `verbes.js ⟺ commands/` et l'écart doc se **déclare** au lieu d'être gardé |
| **R-J6** | **AR-J4 = (c) touche 9 fichiers de production dans un lot annoncé « sans production »** | La contradiction est **nommée** (§ 4, Inclus 9) ; elle est isolée en **J3**, gatée à part, et refusable seule sans invalider J0-J2 |
| **R-J7** | **La règle 6 (abstention) devient une porte de sortie.** Un futur verbe pourrait rendre `ok:false`+exit 0 pour éviter un rouge | Garde dédiée (étape 4) : `status` non vide **obligatoire** ; et la règle 6 est rédigée **restrictivement** (« je n'ai rien pu mesurer », jamais « j'ai mesuré et c'est mauvais ») |
| **R-J8** | **Régression silencieuse de la prose humaine** en touchant les 9 sites de guidage | Témoins enregistrés **avant** (étape 1), comparés après (CA-J8) — même geste que CA-M8 du lot gaté |
| **R-J9** | **Le cliquet descendu trop tôt.** Retirer un motif `hors-couverture` sans que l'invocation correspondante soit verte | `horsCouvertureCount` et le retrait du motif **dans le même commit** que l'entrée `NOMINAL` — le test CA-M16 (l.56-65) l'impose déjà |

## 8. Critères d'acceptation

Chaque critère est **testable** et porte son **contrefactuel** — la manipulation qui doit le faire
**rougir**, jouée puis **révoquée**, et citée dans le rapport de remise.

### Lot J0 — Socle

- [ ] **CA-J1 — La mesure existe et fait autorité.** `docs/qualite/mesures-etape-0-lot-C-JSON.md`
      contient, pour chacun des **29** verbes (28 déclarants + `config`), la sortie **observée** :
      JSON valide o/n, racine objet o/n, `ok` en 1re clé o/n, `count` juste o/n, `stderr` vide o/n,
      code de sortie. Toute ligne divergeant du § 0.3 est **signalée comme telle**.
      *Contrefactuel : n/a (artefact de mesure — sa preuve est d'exister et d'être daté).*
- [ ] **CA-J2 — `config` est déclaré partout où il est honoré.** `verbes.js` porte `'--json'` pour
      `config` ; `docs/commandes.md` (ligne `config`) le mentionne ; `couverture-json.json` porte
      une entrée `config` en `c-json`. Le test 1 de `guard-json-couverture.test.js` reste vert avec
      **29** entrées.
      *Contrefactuel : retirer `'--json'` de `verbes.js:config` ⇒ le test 1 rougit en nommant
      `config` comme fantôme du registre.*
- [ ] **CA-J3 — La garde de dérivation tient les trois sources.** Pour tout verbe : `--json`
      déclaré au registre ⟺ `json: { type: 'boolean'` présent dans `commands/<verbe>.js` ⟺ `--json`
      mentionné sur sa ligne de `docs/commandes.md`.
      *Contrefactuel (×2, joués séparément) : (1) retirer `--json` de la ligne doc d'un verbe ⇒
      rouge nommant le verbe ; (2) ajouter `'--json'` au registre d'un verbe qui ne le parse pas
      (ex. `banner`) ⇒ rouge nommant `banner`.*
- [ ] **CA-J4 — L'abstention est une règle, pas une surprise.** `cli/src/lib/output.js` porte une
      **règle 6** écrite ; `docs/commandes.md` la reprend ; une garde exige qu'une charge
      `ok:false` sortant avec **exit 0** porte un `status` non vide. `vendor-check --json` sans
      frère GUI est **conforme** à cette règle.
      *Contrefactuel : émettre depuis un verbe de test une charge `{ok:false}` sans `status` avec
      exit 0 ⇒ rouge nommant le verbe.*

### Lot J1 — Lecteurs purs

- [ ] **CA-J5 — Les 9 lecteurs sont mesurés.** `commands`, `endpoints`, `frame verify`,
      `frame lint`, `review show`, `produit path`, `produit config`, `produit list` en `NOMINAL` ;
      `vendor-check --strict` en `ERRORS`. Chacun : racine objet, `ok` en 1re clé, `count` juste sur
      les collections, `stderr` vide.
      *Contrefactuel : retirer l'entrée `commands` de `NOMINAL` ⇒ la garde de complétude (CA-J9)
      rougit en nommant `commands`.*
- [ ] **CA-J6 — Aucun de ces tests ne dépend d'un réseau réel.** Les invocations d'`endpoints`
      passent par `127.0.0.1:1` et un `--timeout` ≤ 2 s ; le test est vert **carte réseau coupée**.
      *Contrefactuel : remplacer l'URL par un hôte externe ⇒ le test devient dépendant du réseau —
      constat à consigner, la version retenue restant l'URL locale.*
- [ ] **CA-J7 — Le cliquet descend à 9 dans le même commit.** `horsCouvertureCount: 9` et les 9
      motifs correspondants retirés.
      *Contrefactuel : retirer un motif sans décrémenter ⇒ le test CA-M16 du cliquet
      (`guard-json-couverture.test.js:56-65`) rougit.*
- [ ] **CA-J8 — La prose humaine est inchangée, octet pour octet.** Pour chaque verbe touché, la
      sortie sans `--json` est **identique** au témoin de l'étape 1.
      *Contrefactuel : modifier un caractère d'un message humain ⇒ rouge nommant le verbe.*

### Lot J2 — Écrivains

- [ ] **CA-J9 — Les ~26 invocations d'écrivains sont mesurées en bac à sable**, et le cliquet
      atteint **0**. `horsCouvertureCount: 0`, plus aucune entrée `hors-couverture` dans
      `couverture-json.json`.
      *Contrefactuel : remettre un verbe en `hors-couverture` sans décrémenter ⇒ rouge.*
- [ ] **CA-J10 — Aucun test n'écrit hors d'un `mkdtempSync`.** Après un `node --test test/`,
      `git status --porcelain` du dépôt est **vide**.
      *Contrefactuel : retirer le `--root <tmp>` d'une invocation d'`add` ⇒ `git status` n'est plus
      vide ⇒ le test de propreté rougit. **À jouer sur une copie jetable du dépôt**, jamais sur le
      dépôt réel.*
- [ ] **CA-J11 — Les écrivains rendent un résultat structuré, pas un accusé vide.** Chaque
      invocation d'écrivain expose au moins un champ nommant **ce qui a été écrit** (`path`,
      `written`, `created`, `cleared`, `removedFiles`…), et jamais un simple `{ok:true}`.
      *Contrefactuel : réduire une charge d'écrivain à `{ok:true}` ⇒ rouge nommant le verbe.*

### Lot J3 — Interactifs & verrou

- [ ] **CA-J12 — `--json --guide` ne s'ignore plus en silence** (si AR-J4 = (c)). Pour chacune des
      **10 cibles guidées**, `--json --guide` rend `{ok:false, error}` sur **stdout**, exit 1,
      `stderr` vide. Les flux interactifs **par construction** (`models` top-level, `install`,
      `onboard --from-update`) sont **inchangés** : ils n'ont jamais reçu de `--guide`.
      *Contrefactuel : retirer le refus d'une cible ⇒ rouge nommant la cible ; et vérifier que
      `models --json` (sans `--guide`) reste vert — sinon on a cassé la précédence
      inconditionnelle.*
- [ ] **CA-J13 — La complétude est gardée, pas comptée à la main.** Pour chaque **invocation
      attendue** dérivée de `verbes.js` (verbe + sous-verbes déclarant `--json`), il existe au moins
      une entrée dans `NOMINAL` **ou** `ERRORS`.
      *Contrefactuel (le cœur du lot) : ajouter à `verbes.js` un verbe fictif portant `'--json'`
      sans entrée `NOMINAL` ⇒ **rouge nommant l'id du verbe fictif**. Puis révoquer.*
- [ ] **CA-J14 — Les 20 invocations d'origine sont intactes.** Le diff de
      `guard-json-output.test.js` **n'altère aucune** des 20 lignes de `NOMINAL` ni des 6 d'`ERRORS`
      préexistantes (ajouts seulement).
      *Contrefactuel : n/a — se constate au diff, et se cite dans le rapport de remise.*
- [ ] **CA-J15 — Le dépôt est vert.** `cd cli && node --test test/` : 0 échec, y compris les 4
      tests CA-M16 d'origine, inchangés.

### Ce qui n'est PAS prouvable dans ce lot — et qui doit donc être dit

- **Que les 29 verbes soient conformes sur *tous* leurs chemins.** Une garde nominale mesure **un**
  cas par invocation. Un chemin d'erreur rare peut rester non conforme. Le lot rend la **promesse**
  vérifiée, pas le verbe **exhaustivement** vérifié — et c'est une différence à ne pas maquiller.
- **Que les consommateurs du portefeuille et n8n soient satisfaits** : ils n'ont pas été inspectés
  (§ 0.5).
- **Que le vocabulaire des champs soit cohérent entre verbes** : explicitement exclu (§ 4).

## 9. Estimation — au jalon P1→P2

**Ordre de grandeur assumé et révisable — pas un engagement ferme.**

| Lot | Équivalent jour-homme | Complexité / risque | Ce qui peut le faire glisser |
|---|---|---|---|
| **J0 — Socle** | **0,5 j** | Faible. Deux fichiers touchés, une garde de dérivation, une règle écrite | Si l'étape 0 contredit le § 0.3 → **re-cadrage**, +1 j |
| **J1 — Lecteurs** | **1 j** | Faible-moyenne. 9 invocations, aucune fixture lourde | `frame lint --all` et `produit *` peuvent demander plus de montage que prévu (+0,25 j) |
| **J2 — Écrivains** | **1,5 à 2 j** | **Moyenne-haute** — le vrai coût du lot | La **bibliothèque jetable** pour `add`/`remove`/`attach`/`detach`/`switch`/`frame` : si le minimum d'atomes viable est plus gros qu'espéré, +0,5 j |
| **J3 — Interactifs & verrou** | **0,75 j** | Moyenne. 9 sites de production + la garde de complétude + ses contrefactuels | Si AR-J4 = (a), tombe à **0,4 j** (plus de code de production) |
| **Total** | **3,75 à 4,25 j-h** | **Moyenne** | — |

**Inconnues, nommées :**

1. **La plus lourde — l'étape 0 peut invalider le § 2.** Tout ce cadrage repose sur une lecture
   statique faite **sans shell**. Si l'exécution découvre un verbe qui accepte-et-ignore `--json`,
   ou une non-conformité de forme (racine tableau, `count` faux, `stderr` bavard), le lot cesse
   d'être « garde seule » et **chaque correction est un changement de comportement observable** →
   retour au décideur. **Provision : +1 à +1,5 j.**
2. **Le coût réel de la bibliothèque jetable.** Je n'ai pas pu mesurer combien d'atomes il faut
   pour qu'un `add`/`attach`/`switch` réussisse sur un `--root` neuf. C'est la seule inconnue
   d'**ingénierie** du lot. **Provision : +0,5 j.**
3. **La durée du fichier de test.** ~55 invocations `spawnSync` au total. Si le seuil de confort CI
   est franchi, la scission par classe est un travail supplémentaire. **Provision : +0,25 j.**
4. **AR-J4.** Écart de **0,35 j** entre l'option (a) et l'option (c) — et, plus important qu'un
   coût, un écart de **nature** : (c) fait de ce lot un lot qui touche à la production.

**Recommandation d'engagement.** Engager **J0 + J1** fermement (**1,5 j**) : ils ferment l'écart
`config`, posent les deux gardes structurantes et font descendre le cliquet de 14 à 9 — un gain
réel, refusable indépendamment de la suite. **Décider de J2 et J3 après le gate de J1**, avec la
mesure d'exécution en main : c'est le moment où l'inconnue nº 1 sera levée, et l'estimation de J2
deviendra un chiffre plutôt qu'une fourchette.

