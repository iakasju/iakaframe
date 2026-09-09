# Mesures d'exécution — Étape 0 du lot `REGISTRE-OPTIONS-ROOT-PATH-PROJET`

> Réalisé par ⚒️ Gimli le 2026-09-10, sur
> `specs/instructions/registre-options-root-path-projet.md`. **Ceci est une mesure
> d'EXÉCUTION** (Node lancé en bac à sable, worktree `feat/registre-options` @ `18bcec0`),
> pas une lecture statique — elle **remplace** le § 0.3 du cadrage (fait par 🔵 Gandalf sans
> shell, § 0.1 de l'instruction) comme autorité pour ce lot. Là où les deux concordent, c'est
> dit ; là où elles divergeraient, la mesure ferait foi et la divergence serait nommée.

## Verdict global de l'étape 0

**Aucune divergence** entre le § 0.3 du cadrage et l'exécution rejouée ici. Les 8 verbes en
écart (`config`, `go`, `brief`, `recap`, `assemble`, `switch`, `observe`, `repo`) sont
confirmés cellule par cellule. Le lot **n'a pas été arrêté** (le § 5 « Si une mesure contredit
le § 0.3, ARRÊTER » ne s'applique pas ici).

## 0.1 — Dépôt AVANT toute modification

`cd cli && node --test` (sans argument — `node --test test/` échoue sous Node v24.18.0 avec
`MODULE_NOT_FOUND`, cf. § « Piège outillage » ci-dessous) :

- **1er run** (concurrent d'autres commandes Bash sur la même machine) : **1262 tests, 1244
  pass, 11 fail, 7 skip**. Les 11 échecs portent tous sur `install-contrat-machine.test.js`
  (CA-M1/CA-M2/CA-M4/CA-M5(1-4)/CA-M10 + 2 « Écart gate »).
- **Fichier seul, isolé** : `node --test test/install-contrat-machine.test.js` → **24/24
  pass, 0 fail**. Le fichier est vert en isolation.
- **2ᵉ run, suite complète, sans activité Bash concurrente** : **1263 tests, 1256 pass, 0
  fail, 7 skip**.

**Diagnostic retenu** : le 1er run est un **flake d'environnement** (contention machine
pendant l'exécution de tests sensibles au timing sur stdin — CA-M4/CA-M5 lisent une ligne de
stdin avec des délais courts), pas une régression du dépôt. La preuve : le fichier rejoué seul
passe 24/24, et la suite entière rejouée sans contention passe 0 fail. **Le 2ᵉ run fait
autorité** comme point de comparaison AVANT.

**Écart avec le plancher annoncé (`1263/1262/0/1`, `BACKLOG.md:680-681`)** : le nombre de
`skip` mesuré ici est **7**, pas **1**. Cause identifiée : ce worktree est un **clone isolé**
sous `.wt/`, sans le dépôt frère `iakaFrameGUI` à son emplacement habituel — les tests
`vendor-check`/parité qui s'abstiennent gracieusement (`status:"skipped"`, comportement
**voulu**, cf. `docs/commandes.md:365`) le font ici en plus grand nombre qu'sur un poste où le
frère est présent. **Ce n'est pas une régression de ce lot** (aucune ligne de production n'a
encore été touchée à ce stade de la mesure) : c'est un fait de l'environnement d'exécution
(worktree isolé), à ne pas confondre avec un fail. Le critère qui compte pour CA-R9
(**≥ 1263 tests, 0 fail**) est satisfait par le 2ᵉ run.

### Piège outillage rencontré (à consigner, hors périmètre du lot)

`node --test test/` (Node v24.18.0) échoue avec `Cannot find module '.../cli/test'` —
Node 24 interprète l'argument positional comme un module à charger plutôt qu'un dossier à
parcourir, contrairement à l'appel sans argument (`node --test`, qui redécouvre `test/` par
défaut via `package.json` → `"test": "node --test"`). La commande exacte de l'instruction
(§ 5, `cd cli && node --test test/`) ne fonctionne donc plus telle quelle sous cette version
de Node ; `node --test` (sans argument) est la forme qui marche et qui a servi à toutes les
mesures de ce rapport.

## 0.2 — Les trois sources, rejouées (tables A/B/C)

### Table A — `--root`

| verbe | déclaré (`verbes.js`) | parsé (`commands/*.js`) | documenté (`commandes.md`) | verdict mesuré |
|---|---|---|---|---|
| `install` | oui :84 | oui `install.js:699` | oui :267 | conforme |
| `models` | oui :167(+174) | oui `models.js:832` | oui :333 | conforme |
| `list` | oui :245 | oui `list.js:52` | oui :357 | conforme |
| `show` | oui :256 | oui `show.js:56` | oui :358 | conforme |
| `add` | oui :268 | oui `add.js:62` | oui :359 | conforme |
| `remove` | oui :281 | oui `remove.js:74` | oui :360 | conforme |
| `attach` | oui :293 | oui `attach.js:31` | oui :361 | conforme |
| `detach` | oui :306 | oui `attach.js:31` (fichier partagé) | oui :362 | conforme |
| `vendor-check` | oui :331 | oui `vendor-check.js:257` | oui :365 | conforme |
| `frame` | oui :339(+342,344,345) | oui `frame.js:73` | oui :367 | conforme |
| `portfolio` | oui :473 | oui `portfolio.js:17` | oui :490 | conforme |
| `range` | oui :483 | oui `range.js:51` | oui :491 | conforme |
| `observe` | oui :463 | oui `observe.js:30` | oui :492 | conforme |
| `root` | oui :491 | **n/a** — traité en ligne `index.js:165-169` (`rest.indexOf('--root')`, sans `parseArgs`), preuve littérale confirmée : `'--root'` présent en toutes lettres à la ligne 166 | oui :341 | **faux positif de l'heuristique**, confirmé — pas un écart réel |
| **`switch`** | oui :364 | oui `switch.js:81` | **était NON** :364 (`--path --binding --rollback --guide --json`) | **ÉCART confirmé** → traité (commit `c0da329`) |
| **`config`** | **était NON** :130 | oui `config.js:45`, **lu** :73 (`resolveRoot`) | **était NON** :266 | **ÉCART confirmé** → traité |
| **`go`** | **était NON** :199 | oui `go.js:55`, **lu** :58 (`resolveRoot`) | **était NON** :336 | **ÉCART confirmé** → traité |
| **`brief`** | **était NON** :218 | oui `brief.js:30`, **lu** :37 (`resolveRoot`) | **était NON** :349 | **ÉCART confirmé** → traité |
| **`recap`** | **était NON** :227 | oui `recap.js:21`, **lu** :27 (`resolveRoot`) | **était NON** :350 | **ÉCART confirmé** → traité |
| **`assemble`** | **était NON** :319 | oui `assemble.js:34`, **lu** :46 (`libraryRoot`) | **était NON** :363 (mais l'USAGE local `assemble.js:26` le documentait) | **ÉCART confirmé** → traité |

**Confirmation de l'étape 0.3 du § 5** (« Les 5 `--root` sont-ils LUS, ou morts ? ») :
`grep -n "values.root" cli/src/commands/{config,go,brief,recap,assemble}.js` retourne
exactement une ligne par fichier (`config.js:73`, `go.js:58`, `brief.js:37`, `recap.js:27`,
`assemble.js:46`) — **les cinq sont lus**, aucun n'est mort. AR-R1 ne bascule pas : on
**déclare**, on ne retire rien (§ 2(b) de l'instruction).

### Table B — `--path`

Toutes les cellules « conforme » du § 0.3 sont confirmées à l'identique par grep direct
(`onboard`, `init`, `snapshot`, `update`, `config`, `canaux`, `models`(+set/unset), `go`,
`brief`, `recap`, `frame`(+use), `switch`). Seul écart :

| verbe | déclaré | parsé | documenté | verdict mesuré |
|---|---|---|---|---|
| **`repo`** | oui `verbes.js:98` | oui `repo.js:41` | **confirmé absent** : `grep -c '^| \`repo' docs/commandes.md` → **0** avant traitement | **ÉCART confirmé, verbe entier absent de la doc** → traité (commit `89ad496`, ligne neuve en § B.1) |

### Table C — `--project`

| verbe | déclaré | parsé | documenté | verdict mesuré |
|---|---|---|---|---|
| `agents`(+affect,fullteam) | oui :142,145,146 | oui `agents.js:24,30` | oui :337 | conforme — sens **`<dir>`** (`values.project \|\| process.cwd()`) |
| `skills` | oui :156 | oui `skills.js:17,22` | oui :338 | conforme — sens **`<dir>`** |
| `jalon` | oui :235 | oui `jalon.js:32,41` | oui :351 | conforme — sens **nom de projet** (`(values.project \|\| 'PROJET').toUpperCase()`, titre du jalon, PAS un chemin lu sur disque) |
| `produit` | oui :395(+7 sous-verbes) | oui `produit.js:47,54` | oui :436 | conforme — sens **`<dir>`** (`projectCanonHome(values.project \|\| process.cwd())`) |
| `open` | oui :412 | oui `open.js:38,49,55,57,58` | oui :412 | conforme — sens **`<dir>`** (`loadCanon(home,{projectPath:values.project})`) |
| **`observe`** | **était NON** :463 | oui `observe.js:27,41,52,55` | oui :492 (« promis, jamais déclaré ») | **ÉCART confirmé (inverse)** → traité (commit `89ad496`) — sens **nom de fichier du store** (`observeList(home,{project:values.project})` → `<projet>.md`), ni `<dir>` ni alias de positionnel |
| **`go`** | **était NON** :199 | oui `go.js:55,62` : `values.project \|\| positionals[0]` | **était NON** :336 | **ÉCART confirmé** → traité — sens **nom**, alias du positionnel |
| **`brief`** | **était NON** :218 | oui `brief.js:30,35` : `values.project \|\| positionals[0]` | **était NON** :349 | **ÉCART confirmé** → traité — sens **nom** |
| **`recap`** | **était NON** :227 | oui `recap.js:21,26` : `values.project \|\| positionals[0] \|\| '.'` | **était NON** :350 | **ÉCART confirmé** → traité — sens **nom** |

**Sémantique de `--project`, confirmée par lecture directe (§ 0.4 du § 5)** : DEUX familles
distinctes coexistent, jamais unifiées par ce lot (successeur `CLI-SEMANTIQUE-PROJECT-ET-ROOT`) :

1. **Dossier** (`<dir>`) — `agents`, `skills`, `produit`, `open`.
2. **Nom** (`<nom>`), résolu sous le chapeau ou servant de clé de fichier — `go`, `brief`,
   `recap` (alias du positionnel `<projet>`) et `jalon`/`observe` (nom/titre, pas un chemin lu
   sur disque). `jalon` et `observe` sont deux variantes de la famille « nom » légèrement
   différentes l'une de l'autre (titre affiché vs nom de fichier), mais toutes deux à
   l'opposé de la famille « dossier » — la question du § 0 « à confirmer par Gimli : la
   sémantique exacte de `--project` sur `jalon` et `observe` » est donc tranchée : ni l'un ni
   l'autre n'est un `<dir>`.

## 0.5 — Comportement actuel des options non déclarées (rejoué)

```
$ node cli/src/index.js brief --path <T>                     → exit=0 (table imprimée)
$ node cli/src/index.js config --path <T> --root <T> --json  → exit=0, { ok:true, ... }
$ node cli/src/index.js go --project inexistant --root <T>   → "Dossier introuvable : <T>/inexistant", exit=1
```

Confirme que les cinq `--root` et les trois `--project` (`go`/`brief`/`recap`) sont déjà
**opérationnels**, silencieusement — exactement le défaut nommé par l'instruction (§ 1).

## 0.6 — Forme de l'échec sur une option retirée (argument d'AR-R1)

```
$ node cli/src/index.js banner test --option-qui-nexiste-pas
TypeError [ERR_PARSE_ARGS_UNKNOWN_OPTION]: Unknown option '--option-qui-nexiste-pas'. ...
    at checkOptionUsage (node:internal/util/parse_args/parse_args:102:13)
    ...
    at main (file:///.../cli/src/index.js:140:22)
    at file:///.../cli/src/index.js:177:1
{ code: 'ERR_PARSE_ARGS_UNKNOWN_OPTION' }
exit=1
```

Confirmé : `main().catch(e => { console.error(e); process.exitCode = 1; })` (`index.js:177`)
est bien le seul filet — une option retirée sortirait par une **exception brute** (objet
`Error` complet, en anglais, sur stderr). Ceci **cadre AR-R1** : retirer une option qui
fonctionne exigerait d'écrire un refus explicite (code de production supplémentaire), ce que
le lot ne fait pas (AR-R1 = a, conserver et déclarer).

## 0.7 — Empreintes AVANT des surfaces publiques

Capturées avant toute modification :
- `iakaframe --help` (120 lignes)
- `iakaframe commands --json` (1116 lignes)

Diffs après chaque commit de déclaration, énumérés ligne par ligne dans le rapport de remise
(CA-R4) — reproduits ici pour mémoire :
- Commit `--root` (`c0da329`) : 5 lignes d'option ajoutées (`config`, `go`, `brief`, `recap`,
  `assemble`) + 2 lignes de commentaire d'aide (`index.js:110-111`). Rien d'autre.
- Commit `--project` (`89ad496`) : 4 lignes d'option ajoutées (`go`, `brief`, `recap`,
  `observe`). Rien d'autre (`repo` n'a pas de nouvelle option de registre, seulement une ligne
  de doc neuve — aucun diff `--help`/`commands --json` pour ce verbe).

## Ce que cette mesure change par rapport au § 0.3 du cadrage

**Rien sur le fond** — toutes les cellules concordent. Deux compléments factuels que la
lecture statique ne pouvait pas donner :
1. Le plancher de suite (`1263/1262/0/1`) doit être lu **1263/1256/0/7** dans ce worktree
   isolé (frère `iakaFrameGUI` absent) — un fait d'environnement, pas une régression.
2. La sémantique de `--project` sur `jalon`/`observe` (question ouverte du § 0) est
   confirmée : ni l'un ni l'autre n'est un `<dir>`, tous deux relèvent de la famille « nom ».
