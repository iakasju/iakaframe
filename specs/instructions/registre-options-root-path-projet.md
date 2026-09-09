# Le registre dit-il la vérité sur `--root`, `--path` et `--project` ?

> Lot : `REGISTRE-OPTIONS-ROOT-PATH-PROJET`. Dette **nommée** par le lot J3 de
> `C-JSON-COUVERTURE-COMPLETE` (`BACKLOG.md:685-690`), **confirmée par lecture directe sur 2 des 8
> verbes** au gate de J3 (`docs/qualite/gate-c-json-j3.md:198-205`, écart nº 4 l.268-271), et
> **explicitement non traitée** dans ce lot-là au titre du § 2 de son cadrage
> (`c-json-couverture-complete.md:206` : « aucune retouche de confort »).
>
> Cadré par 🔵 Gandalf le 2026-09-09 sur `main` @ `1c9f03e`. **Instruction — aucun code n'a été
> écrit ni exécuté ici.**

---

## 0. Ce qui a été mesuré le 2026-09-09

### 0.1 — Instruments, et leur limite déclarée

**Je n'ai pas de shell.** Ce cadrage est une **lecture de fichiers** (`Read`, `Grep`, `Glob`) : je
n'ai lancé **aucune** commande, **aucun** test, **aucun** `node`. Tout le § 0 est une **mesure
statique de source**, jamais une mesure d'exécution.

Trois conséquences, à ne pas contourner :

1. Une lecture dit ce que le code **déclare**, pas ce qu'il **fait**. Que `go.js:55` porte
   `root: { type: 'string' }` prouve que l'option est **acceptée** ; seule l'exécution dit ce que
   `iakaframe go monprojet --root /ailleurs` **résout** réellement.
2. **L'étape 0 de ⚒️ Gimli est obligatoire et bloquante** (§ 5). C'est elle qui fait foi pour
   chaque cellule du § 0.3, pas moi. Les cellules que je ne peux pas trancher par lecture sont
   marquées **« à mesurer par Gimli étape 0 »** dans les tables — elles ne sont pas des trous, ce
   sont des **questions posées**.
3. Là où l'exécution de Gimli contredit ma lecture, **l'exécution gagne**, et la divergence est
   **notée dans le rapport de remise** (elle instruit la qualité de ce cadrage).

**Aucun fait externe (web) n'a été vérifié, et c'est délibéré.** Ce lot ne dépend d'aucune version,
d'aucune bibliothèque tierce, d'aucun état de l'art : le CLI est à zéro dépendance runtime, le
registre `cli/src/lib/verbes.js` est interne au dépôt, et l'objet du lot est une **cohérence
interne entre trois fichiers du même dépôt**. Il n'y avait rien de dehors à aller chercher — je le
déclare plutôt que de le laisser supposer. Le seul point où une source externe aurait pu compter —
le comportement de `node:util parseArgs` face à une option inconnue — est arbitré au § 3 (AR-R1) à
partir de la **source du dépôt** (`cli/src/index.js:177`), pas d'une documentation en ligne : c'est
le gestionnaire d'erreur **du dépôt** qui décide de ce que voit l'utilisateur, et il est ici.

### 0.2 — Les faits hérités, attribués

- **Gate J3, 2026-09-09, 🏹 Legolas — PASS** (`docs/qualite/gate-c-json-j3.md`). Deux des huit
  écarts y sont **vérifiés par lecture directe** (l.198-205) : `config` (parse `--root`, ni déclaré
  ni documenté) et `repo` (`--path` déclaré + parsé, **aucune ligne de tableau `repo`** dans
  `docs/commandes.md` — « grep vide »). Je cite cette mesure **comme mesure d'autrui**, datée et
  attribuée ; je ne la rejoue pas.
- **Suite au 2026-09-09 : 1263 tests, 1262 pass, 0 fail, 1 skipped** (`BACKLOG.md:680-681`, relevé
  par ⚒️ Gimli, gaté PASS). C'est le **plancher** de ce lot (CA-R9) — pas un chiffre que j'ai mesuré.
- **Angle mort connu de la dérivation textuelle** (`gate-c-json-j3.md:260-264`, écart nº 2) : une
  entrée **neutralisée par `//`** reste comptée comme présente, la garde lisant du **texte**, pas
  un AST. Ce lot **hérite** de cet angle mort et **ne le lève pas** — il le **redit** (CA-R8).

### 0.3 — L'inventaire, cellule par cellule

Trois sources, une seule vérité attendue :

- **déclaré** — l'option figure dans `options` du verbe (ou d'un de ses sous-verbes) dans
  `cli/src/lib/verbes.js` ; c'est ce que publient `iakaframe --help` (`index.js:62-90`, l'aide
  **imprime** ce tableau d'options) et `iakaframe commands --json`.
- **parsé** — `cli/src/commands/<verbe>.js` porte la clé correspondante dans son `parseArgs`.
- **documenté** — la ligne de tableau de `docs/commandes.md` dont le premier token entre backticks
  est le verbe mentionne l'option.

> ⚠️ **Tables établies par lecture le 2026-09-09** ; chaque cellule est à **re-vérifier** à l'étape
> 0. Les verbes dont les trois cellules sont fausses sur les trois options ne figurent pas (rien à
> dire d'eux).

#### Table A — `--root`

| verbe | déclaré | parsé | documenté | verdict |
|---|---|---|---|---|
| `install` | oui `verbes.js:84` | oui `install.js:699` | oui `commandes.md:267` | conforme |
| `models` | oui `verbes.js:167` (+ `set` l.174) | oui `models.js:832` | oui `commandes.md:333` | conforme |
| `list` | oui `verbes.js:245` | oui `list.js:52` | oui `commandes.md:357` | conforme |
| `show` | oui `verbes.js:256` | oui `show.js:56` | oui `commandes.md:358` | conforme |
| `add` | oui `verbes.js:268` | oui `add.js:62` | oui `commandes.md:359` | conforme |
| `remove` | oui `verbes.js:281` | oui `remove.js:74` | oui `commandes.md:360` | conforme |
| `attach` | oui `verbes.js:293` | oui `attach.js:31` | oui `commandes.md:361` | conforme (fermé en J3) |
| `detach` | oui `verbes.js:306` | oui `attach.js:31` (fichier partagé) | oui `commandes.md:362` | conforme (fermé en J3) |
| `vendor-check` | oui `verbes.js:331` | oui `vendor-check.js:257` | oui `commandes.md:365` | conforme |
| `frame` | oui `verbes.js:339` (+ `lint` 342, `new` 344, `use` 345) | oui `frame.js:73` | oui `commandes.md:367` | conforme |
| `portfolio` | oui `verbes.js:473` | oui `portfolio.js:17` | oui `commandes.md:490` | conforme |
| `range` | oui `verbes.js:483` | oui `range.js:51` | oui `commandes.md:491` | conforme |
| `observe` | oui `verbes.js:463` | oui `observe.js:30` | oui `commandes.md:492` | conforme |
| `root` | oui `verbes.js:491` | **n/a** — **pas de `commands/root.js`** : traité en ligne, `index.js:165-169` (`rest.indexOf('--root')`, sans `parseArgs`) | oui `commandes.md:341` | **faux positif de l'heuristique**, pas un écart réel |
| **`switch`** | oui `verbes.js:364` | oui `switch.js:81` | **NON** — `commandes.md:364` liste `--path --binding --rollback --guide --json` | **ÉCART** |
| **`config`** | **NON** `verbes.js:130` | oui `config.js:45`, **lu** l.73 (`resolveRoot`) | **NON** `commandes.md:266` | **ÉCART** |
| **`go`** | **NON** `verbes.js:199` | oui `go.js:55`, **lu** l.58 (`resolveRoot`) | **NON** `commandes.md:336` | **ÉCART** |
| **`brief`** | **NON** `verbes.js:218` | oui `brief.js:30`, **lu** l.37 (`resolveRoot`) | **NON** `commandes.md:349` | **ÉCART** |
| **`recap`** | **NON** `verbes.js:227` | oui `recap.js:21`, **lu** l.27 (`resolveRoot`) | **NON** `commandes.md:350` | **ÉCART** |
| **`assemble`** | **NON** `verbes.js:319` | oui `assemble.js:34`, **lu** l.46 (`libraryRoot`) | **NON** `commandes.md:363` — mais l'**USAGE local** `assemble.js:26` le documente | **ÉCART** |

#### Table B — `--path`

| verbe | déclaré | parsé | documenté | verdict |
|---|---|---|---|---|
| `onboard` | oui `verbes.js:51` | oui `onboard.js:46` | oui `commandes.md:262` | conforme |
| `init` | oui `verbes.js:59` | oui `init.js:33` | oui `commandes.md:263` | conforme |
| `snapshot` | oui `verbes.js:68` | oui `snapshot.js:377` | oui `commandes.md:264` | conforme |
| `update` | oui `verbes.js:76` | oui `update.js:61` | oui `commandes.md:265` | conforme |
| `config` | oui `verbes.js:130` | oui `config.js:40` | oui `commandes.md:266` | conforme |
| `canaux` | oui `verbes.js:114` | oui `canaux.js:62` | oui `commandes.md:339` | conforme |
| `models` | oui `verbes.js:167` (+ `set` 174, `unset` 185) | oui `models.js:831` | oui `commandes.md:333-335` | conforme |
| `go` | oui `verbes.js:199` | oui `go.js:55` | oui `commandes.md:336` | conforme |
| `brief` | oui `verbes.js:218` | oui `brief.js:30` | oui `commandes.md:349` | conforme |
| `recap` | oui `verbes.js:227` | oui `recap.js:21` | oui `commandes.md:350` | conforme |
| `frame` | oui `verbes.js:339` (+ `use` 345) | oui `frame.js:74` | oui `commandes.md:367` | conforme |
| `switch` | oui `verbes.js:364` | oui `switch.js:81` | oui `commandes.md:364` | conforme |
| **`repo`** | oui `verbes.js:98` | oui `repo.js:41` | **NON — le verbe `repo` n'a AUCUNE ligne de tableau dans `docs/commandes.md`** (seules occurrences du mot : l.137 dans une énumération, l.262 comme option `--repo` d'`onboard`) | **ÉCART, et plus large que l'option** |

#### Table C — `--project`

| verbe | déclaré | parsé | documenté | verdict |
|---|---|---|---|---|
| `agents` | oui `verbes.js:142` (+ `affect` 145, `fullteam` 146) | oui `agents.js:24` | oui `commandes.md:337` | conforme |
| `skills` | oui `verbes.js:156` | oui `skills.js:17` | oui `commandes.md:338` | conforme |
| `jalon` | oui `verbes.js:235` | oui `jalon.js:32` | oui `commandes.md:351` | conforme |
| `produit` | oui `verbes.js:395` (+ 7 sous-verbes) | oui `produit.js:47` | oui `commandes.md:436` | conforme |
| `open` | oui `verbes.js:412` | oui `open.js:38` | oui `commandes.md:412` | conforme |
| **`observe`** | **NON** `verbes.js:463` | oui `observe.js:27` | **oui** `commandes.md:492` (+ USAGE local `observe.js:17`) | **ÉCART (inverse : promis, jamais déclaré)** |
| **`go`** | **NON** `verbes.js:199` | oui `go.js:55`, **lu** l.62 | **NON** `commandes.md:336` | **ÉCART** |
| **`brief`** | **NON** `verbes.js:218` | oui `brief.js:30`, **lu** l.35 | **NON** `commandes.md:349` | **ÉCART** |
| **`recap`** | **NON** `verbes.js:227` | oui `recap.js:21`, **lu** l.26 | **NON** `commandes.md:350` | **ÉCART** |

**Total : 8 verbes en écart** — `config`, `go`, `brief`, `recap`, `assemble`, `switch`, `observe`,
`repo` — exactement la liste du gate J3 (`gate-c-json-j3.md:268-271`), plus un **faux positif
d'heuristique** (`root`) que la garde future devra savoir ne pas accuser.

#### Ce que la lecture m'apprend, et que la dette ne disait pas

1. **`--root` n'a pas une sémantique, il en a deux — et l'aide le sait déjà.**
   `index.js:110-111` avertit : « `--root` a DEUX sens selon la commande : dossier chapeau `~/work`
   (`portfolio`, `observe`) vs racine de bibliothèque (`list`, `show`, `add`, `assemble`,
   `switch`) ». **`assemble` y est nommé alors qu'il ne déclare pas `--root`.** L'aide **promet
   déjà** l'option ; c'est le registre qui ment. Les cinq écarts se répartissent : famille
   **chapeau** (`config` → `resolveRoot`, `go`, `brief`, `recap`) et famille **bibliothèque**
   (`assemble` → `libraryRoot`). L'avertissement devra être complété en conséquence (CA-R10).
2. **`--project` n'a pas une sémantique, il en a deux — et personne ne le dit.** Sur `agents`,
   `skills`, `produit`, `open`, c'est un **dossier** (`--project <dir>`). Sur `go`/`brief`/`recap`,
   c'est un **nom de projet** résolu sous le chapeau (`path.join(resolveRoot(values.root), name)`,
   `go.js:64`), alias du positionnel `<projet>`. Sur `observe`, `commandes.md:492` écrit
   `--project <p>` — nom de fichier du store, donc un **nom**. Documenter ces quatre-là en
   `<dir>` serait écrire une **fausseté** : la documentation doit suivre la sémantique **réelle**,
   verbe par verbe (R-R3). *À confirmer par Gimli étape 0 : la sémantique exacte de `--project`
   sur `jalon` et `observe`.*
3. **`repo` n'est pas « une option non documentée », c'est un verbe non documenté.** Le dépôt a
   déjà rencontré ce cas et l'a traité par un test nommé — `branches-locales.test.js:461` :
   « CA-14 : `docs/commandes.md` porte la ligne `range` (absente avant ce lot) ». Le précédent
   existe, la forme du remède aussi.
4. **Déclarer une option n'est pas un geste neutre : c'est une publication.** `--help` **imprime**
   les `options` du registre (`index.js:69-73`), et `commands --json` les rend telles quelles.
   Ajouter `'--root <dir>'` à cinq verbes **change deux surfaces publiques** — voulu, mais à
   énumérer ligne à ligne (CA-R4), jamais à découvrir après coup. *Bonne nouvelle mesurée* :
   `cli/scripts/gen-iaka-commands.mjs` **n'utilise pas** `options` (aucune occurrence dans le
   fichier) — les entrées `iaka-<verbe>.md` du kit ne dérivent que du `resume`, donc **aucune
   régénération de kit** n'est due, et G5c (`guard-verbes-registre.test.js:102-110`) ne bougera pas.

### 0.4 — Le harnais disponible, et le trou exact qu'il laisse

- **`guard-json-couverture.test.js:186-219` — le mécanisme générique existe déjà.**
  `verbesEnDeriveOption(verbes, { cmdDir, docText, option })` calcule exactement
  *déclaré ⟺ parsé ⟺ documenté* pour **n'importe laquelle** des quatre options du triplet
  (`TYPE_PAR_OPTION`, l.157). **Il n'y a rien à inventer : il y a une boucle à ouvrir.**
- **Le trou tient en une ligne : `for (const option of ['--json'])` (l.213).** Le balayage
  **bloquant** ne porte que sur `--json`. `--root`/`--path`/`--project` ne sont exercés que sur des
  **sondes synthétiques** (l.221-233) — le mécanisme est prouvé, il n'est pas **branché**. Le
  commentaire l.197-212 le dit explicitement et **nomme ce lot** comme successeur. Voilà pourquoi
  les 8 verbes passent aujourd'hui : **rien ne les regarde**.
- **`guard-verbes-registre.test.js` ne comble pas ce trou et ne prétend pas le faire.** Ses 18
  tests gardent le registre ↔ `index.js` (G5a), le registre ↔ `--help` (G5b), le registre ↔ kit
  généré (G5c), les motifs d'exclusion (GC). **Aucun** ne compare les `options` déclarées au
  `parseArgs` réel ni à la doc. C'est le bon fichier pour accueillir la garde si l'on veut la
  ranger par sujet (« le registre dit-il vrai ? ») ; c'est le bon fichier **actuel** si l'on veut la
  ranger par mécanisme (`guard-json-couverture.test.js`). → **AR-R3**.
- **Deux angles morts, hérités et à redire, jamais à taire** :
  (a) **entrée commentée comptée** — la dérivation est **textuelle** (`fs.readFileSync` + regex) :
  un `// root: { type: 'string' }` compte comme parsé, une ligne de tableau dans un bloc de code
  compte comme documentée (`gate-c-json-j3.md:260-264`) ;
  (b) **`docMentionneOption` fait un `includes` nu** (l.182) : `--project` matcherait `--projects`.
  Le côté *déclaré* est propre (`optionDeclaree`, l.162, exige l'égalité ou un espace suivant), le
  côté *doc* ne l'est pas.
- **Les témoins de prose existent déjà** : `cli/test/fixtures/temoins-prose/` (22 fichiers, posés
  aux lots J0-J3). Ce lot **étend le patron**, il ne l'invente pas.
- **`main().catch(e => { console.error(e); … })` (`index.js:177`) est le seul filet.** Une option
  **retirée** ferait donc sortir `parseArgs` par une **exception brute** : objet `Error` complet
  sur **stderr**, en anglais, exit 1. Pour un verbe déclarant `--json`, c'est en prime une
  **violation de la règle 4** du contrat C-JSON (stderr non vide). Ce fait, à lui seul, cadre
  AR-R1.

## 1. Problème

Le CLI **accepte** des options qu'il n'annonce nulle part, et **annonce** des options qu'il ne
déclare pas. Sur **8 verbes**, les trois sources divergent :

- `config`, `go`, `brief`, `recap`, `assemble` **acceptent `--root`** sans que le registre ni la
  doc en disent un mot — un utilisateur ne peut le découvrir qu'en lisant le code, et
  `iakaframe commands --json`, publié comme **source unique** de l'inventaire, **ment par
  omission** à ses consommateurs ;
- `go`, `brief`, `recap` **acceptent `--project`** dans le même silence ;
- `switch` **déclare `--root`** sans que la doc le reprenne ;
- `observe` **documente `--project`** sans que le registre le déclare — la promesse est publiée,
  l'inventaire machine l'ignore ;
- `repo` **déclare et parse `--path`** mais **n'a aucune ligne** dans `docs/commandes.md` : le
  verbe entier est absent de la doc de référence.

C'est **le même défaut que `config`/`--json`**, réglé au lot J0 — vu sous un autre drapeau. Le lot
J3 a construit la garde qui l'attrape (`verbesEnDeriveOption`), l'a prouvée sur des sondes… et ne
l'a **pas branchée** sur ces trois options, parce que la brancher aurait fait rougir le gate sur une
dette étrangère à C-JSON. Le successeur a été **nommé** plutôt que le trou tu. **Ce lot est ce
successeur** : il aligne les trois sources sur les 8 verbes, puis **ouvre la boucle** pour que le
prochain écart ne puisse plus naître en silence.

## 2. Décision retenue

**La règle cible, en une phrase :**

> **Une option parsée par un verbe est déclarée dans `cli/src/lib/verbes.js` ET documentée dans
> `docs/commandes.md` — ou elle n'est pas parsée.**

C'est mot pour mot la règle de dérivation posée au § 2(b) du lot précédent
(`c-json-couverture-complete.md:219-223`), **étendue de `--json` au triplet
`--root`/`--path`/`--project`**. Elle est **symétrique et elle mord dans les deux sens** : déclarer
sans parser est un mensonge (`observe` vu du registre), parser sans déclarer en est un autre
(`config`), documenter sans déclarer en est un troisième (`observe` vu de la doc).

Quatre engagements en découlent.

**(a) Ce lot ne change AUCUN comportement.** Aucune résolution de chemin n'est touchée, aucun
défaut n'est modifié, aucune option n'est ajoutée ni retirée du `parseArgs` d'aucun verbe (sauf
arbitrage explicite en AR-R1). Le lot **rend visible ce qui existe** ; il ne fabrique rien.
Corollaire opposable : **toute** ligne de diff hors `verbes.js` / `docs/commandes.md` /
`cli/test/` doit être justifiée, ou refusée au gate.

**(b) On déclare, on ne retire pas — par défaut.** Les cinq `--root` sont **lus et utilisés**
(§ 0.3, colonne « parsé »), l'aide en **promet déjà** une partie (`index.js:110-111`), et un
retrait ferait sortir le CLI par une **exception brute** (§ 0.4). Le retrait reste une option
d'arbitrage (AR-R1), mais il porte alors une **charge de preuve** : rendre un **refus explicite
nommant l'option**, jamais un dump de pile.

**(c) La documentation dit la sémantique RÉELLE, pas une sémantique uniforme.** `--root` a deux
sens (chapeau / bibliothèque), `--project` en a deux (nom / dossier). Écrire `--project <dir>` sur
`go` serait remplacer une omission par une erreur — strictement pire. Chaque ligne ajoutée nomme
**son** sens.

**(d) La garde est branchée, et son hors-champ est déclaré.** Ouvrir la boucle de la l.213 aux
quatre options est le cœur du lot. Ce qui reste hors du balayage (`--ascii`, `--binding`, `--node`,
`--force`, `--portfolio`, `--help`, `--target`…) n'est **pas** oublié : il est **écrit, motivé et
compté** (AR-R4), à l'image de `couverture-json.json`. Une garde muette sur son propre périmètre
est le défaut que ce dépôt a déjà décidé de ne plus commettre.

## 3. Arbitrages — ce que je ne peux pas trancher seul

Quatre arbitrages. Chacun porte une **recommandation** ; Aragorn dispose de l'autonomie maximale
accordée par le décideur pour les appliquer.

> **Verdicts d'Aragorn (2026-09-09, autonomie max accordée par le décideur, « comme reco ») :**
> **AR-R1 → (a)** conserver `--project` sur `go`/`brief`/`recap` et le déclarer avec sa sémantique
> réelle `<nom>` ; **AR-R2 → (a)** écrire la ligne de doc complète du verbe `repo` (5 options),
> pas de renommage de `--path` ; **AR-R3 → (a)** ouvrir la boucle existante de
> `verbesEnDeriveOption` aux 4 options + entrée motivée pour le verbe `root`, sans le déménager ;
> **AR-R4 → (a)** registre motivé + cliquet `couverture-options.json` (les 4 écarts adjacents mesurés
> y entrent nommés). Engagement **R1 + R2 ensemble**, une branche, deux gates. Point vu : CA-R4 est
> une identité stricte SAUF `--help` et `commands --json`, dont le diff est énuméré ligne par ligne
> dans la remise — Gimli ne doit pas le lire comme « rien ne bouge ».

### AR-R1 — `--project` sur `go` / `brief` / `recap` : conserver et déclarer, ou retirer ?

Sur ces trois verbes, `--project <nom>` est un **alias du positionnel `<projet>`**
(`go.js:62`, `brief.js:35`, `recap.js:26` : `values.project || positionals[0]`). Il fonctionne, il
n'est annoncé nulle part, et il **ne veut pas dire la même chose** que le `--project <dir>` de
`agents`/`skills`/`produit`/`open`.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| **(a) Conserver et déclarer** — `'--project <nom>'` au registre, documenté avec **son** sens (« nom de projet sous le chapeau, alias du positionnel ») | zéro changement de comportement ; l'alias devient **découvrable** ; la divergence `<nom>` vs `<dir>` est **écrite** au lieu d'être subie | on publie une incohérence de vocabulaire (deux sens pour un drapeau) — mais on la publie **en la nommant**, ce qui est la condition pour la corriger un jour |
| (b) Retirer les trois `project:` du `parseArgs` | un seul sens pour `--project` dans tout le CLI | **change un comportement observable** ; et sans travail supplémentaire, l'ancien usage sort par une **exception brute** (`index.js:177`) : pile en anglais sur stderr. Il faudrait donc écrire un refus explicite — c'est-à-dire **ajouter du code de production** dans un lot qui promet de n'en pas ajouter |
| (c) Retirer, avec refus explicite nommant l'option | franc et propre pour l'utilisateur | (b) + le coût du refus × 3 verbes, pour supprimer une capacité qui **marche** |

> **Recommandation : (a).** Le lot s'appelle « le registre dit-il la vérité » — pas « le CLI
> a-t-il le bon vocabulaire ». Retirer une entrée qui fonctionne pour rendre le registre vrai, c'est
> corriger la carte en rasant la maison. La divergence `<nom>`/`<dir>` est réelle et mérite d'être
> traitée : elle est **nommée en successeur** (`CLI-SEMANTIQUE-PROJECT-ET-ROOT`, § 4), pas réglée
> ici « tant qu'on y est ». **Si le décideur préfère (c)**, la contrainte CA-R3 s'applique
> intégralement : refus explicite `{ok:false,error}` nommant l'option, exit 1, **stderr vide** sur
> les verbes déclarant `--json` — jamais une exception nue.

### AR-R2 — `repo` : documenter l'option, ou documenter le verbe ?

`repo` déclare et parse `--path` ; `docs/commandes.md` **ne porte aucune ligne pour ce verbe**.
Documenter `--path` sans documenter `repo` est impossible : il n'y a pas de ligne où l'écrire.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| **(a) Écrire la ligne `repo` complète** en § B.1, dérivée du registre (`verbes.js:95-102`) et de l'`USAGE` local (`repo.js:28-33`) : `--repo`, `--path`, `--provider`, `--create`, `--description` | la garde passe **et** un verbe cesse d'être invisible ; précédent exact du dépôt : `range`, `branches-locales.test.js:461` | rédaction d'une ligne de doc de référence (≈ 3-5 lignes), à faire **juste** : `--create` est le seul drapeau qui autorise une création distante |
| (b) Une ligne minimale, `--path` seul | plus court | une ligne de doc qui cache 4 des 5 options du verbe est une **nouvelle** dette, écrite à la main, le jour même |
| (c) Renommer `--path` → `--root` sur `repo` | uniformise le nom | **faux sémantiquement** : dans ce CLI `--root` est le **chapeau** ou la **bibliothèque** (`index.js:110-111`), jamais le dépôt cible ; `repo.js:49` en fait la racine du dépôt git — exactement le sens de `--path` partout ailleurs (`onboard`, `init`, `snapshot`, `update`, `config`). Ce serait créer une collision, pas la lever |

> **Recommandation : (a).** Et **explicitement pas (c)** : `--path` est le nom **juste** ici ; c'est
> `--root` qui serait faux. La ligne se rédige à partir de deux sources déjà écrites (registre +
> `USAGE` local), pas d'invention.

### AR-R3 — La garde : où la brancher, et jusqu'où ?

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| **(a) Ouvrir la boucle existante aux 4 options** (`guard-json-couverture.test.js:213`) : `['--json','--root','--path','--project']`, + traitement **nommé** du verbe `root` (sans fichier de commande), + contrefactuels par option | une ligne de mécanisme, le reste étant déjà écrit et déjà prouvé sur sondes ; angle mort inchangé et **redit** | la garde vit dans un fichier nommé `guard-json-*` alors qu'elle ne parle plus seulement de `--json` — dissonance de nommage à assumer ou à corriger par un déplacement |
| (b) (a) + **déplacer** la garde de dérivation dans `guard-verbes-registre.test.js` (« le registre dit-il vrai ? ») | rangement par sujet, cohérent avec le nom des fichiers | déplacer du test **vert** (`FICHIER_PAR_ID`, `optionDeclaree`, `docMentionneOption`, 6 témoins) : diff large, risque de casser au transport, pour un gain de **nommage** |
| (c) Balayer **toutes** les options, tous verbes | fin de la catégorie entière | **rouge immédiat et massif** : `help` est parsé par une dizaine de verbes et déclaré par aucun ; `--target` est un alias déprécié volontairement non déclaré (`commandes.md:270-271`) ; `--all`, `--yes`, `--global`, `--portfolio`… Le mécanisme demanderait en plus un type attendu par nom d'option (`TYPE_PAR_OPTION`) pour chacune. Ce n'est pas un élargissement, c'est un autre lot |

> **Recommandation : (a).** Le mécanisme est écrit, prouvé, commenté et **désigne ce lot** comme son
> successeur (l.197-212) : le geste juste est de **l'utiliser**, pas de le refaire ni de le
> déménager. La dissonance de nommage se traite par un **commentaire d'en-tête** qui dit ce que la
> section garde désormais — un renommage de fichier est un lot de rangement, pas celui-ci. Pour le
> verbe `root` : une entrée **nommée et motivée** (implémentation en ligne, `index.js:165-169`,
> vérifiée par la présence littérale de `'--root'` dans `index.js`), **jamais** une liste blanche
> muette, et **jamais** un déplacement de `root` vers `commands/root.js` (ce serait modifier la
> production pour le confort d'un test).

### AR-R4 — Ce qui reste hors du balayage : déclaré et compté, ou laissé en prose ?

(a) exclut de fait `--ascii`, `--binding`, `--node`, `--force`, `--portfolio`, `--help`, `--target`…
Or **j'ai déjà mesuré quatre écarts dans cette zone** : `assemble` parse `--node`/`--force`/`--ascii`
(`assemble.js:34-36`) sans les déclarer ; `observe` parse et documente `--portfolio`
(`observe.js:28`, `commandes.md:492`) sans le déclarer ; `commands` parse et documente `--ascii`
(`commands.js:39`, `commandes.md:342`) sans le déclarer ; `models` parse et documente `--binding`
(`models.js:1055`, `commandes.md:333`) sans le déclarer.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| **(a) Registre motivé + cliquet** : `cli/test/fixtures/couverture-options.json` — options **balayées** (avec motif) et écarts **hors balayage** connus (verbe, option, motif, successeur), plus un `horsBalayageCount` gardé comme `horsCouvertureCount` l'est déjà (`guard-json-couverture.test.js:61-70`) | ce que j'ai trouvé devient une **dette déclarée et comptée**, pas une note perdue dans un cadrage ; le patron existe déjà dans le dépôt et est gaté PASS | une fixture + 2 tests (~0,15 j) |
| (b) Déclaration en **prose seule**, dans le commentaire d'en-tête de la garde | gratuit | c'est exactement ce qu'a fait J3 (commentaire l.197-212) — ça a **marché** parce qu'un humain a lu le commentaire et ouvert un lot. Ça ne marche pas deux fois : le prochain écart naîtra dans une zone que personne ne relit |
| (c) Ne rien dire | gratuit | garde muette sur son propre périmètre : le défaut nommément proscrit |

> **Recommandation : (a).** Une garde doit dire **ce qu'elle ne garde pas**. Et les 4 écarts
> ci-dessus sont l'argument : ils existent **aujourd'hui**, je les ai trouvés **en cadrant**, et
> sans registre ils ne survivraient pas à ce document. Successeur nommé :
> `REGISTRE-OPTIONS-BALAYAGE-COMPLET`.

## 4. Périmètre

### Découpage — deux sous-lots gatables

| Lot | Contenu | Gate |
|---|---|---|
| **R1 — Aligner les trois sources** | Étape 0 (mesure) ; témoins de prose ; 8 verbes alignés dans `verbes.js` + `docs/commandes.md` (dont la ligne `repo` complète, AR-R2) ; avertissement `--root` d'`index.js:110-111` complété | 🏹 Legolas |
| **R2 — Brancher la garde** | Boucle de balayage ouverte aux 4 options ; traitement nommé du verbe `root` ; contrefactuels dans les deux sens par option ; registre `couverture-options.json` + cliquet (AR-R4) ; angles morts redits | 🏹 Legolas + jalon de clôture |

**L'ordre est contraint** : R2 avant R1 rendrait le gate rouge sur les 8 écarts. R1 seul est
livrable, vert, et vaut déjà par lui-même (l'inventaire machine cesse de mentir) — le décideur peut
s'arrêter là sans laisser de chantier ouvert, au prix de laisser la régression possible.

### Inclus

1. **La mesure d'exécution de l'étape 0**, consignée dans
   `docs/qualite/mesures-etape-0-registre-options.md` — c'est **elle** qui fait autorité, pas le
   § 0.3.
2. **`cli/src/lib/verbes.js`** — ajouts d'entrées `options` **uniquement** : `'--root <dir>'` sur
   `config`, `go`, `brief`, `recap`, `assemble` ; `'--project <nom>'` sur `go`, `brief`, `recap`
   (si AR-R1 = a) et sur `observe`. **Aucune autre modification de ce fichier.**
3. **`docs/commandes.md`** — `--root` sur les lignes `config` (266), `go` (336), `brief` (349),
   `recap` (350), `assemble` (363), `switch` (364) ; `--project` sur `go`/`brief`/`recap` avec sa
   sémantique de **nom** ; **ligne `repo` neuve** en § B.1 (AR-R2).
4. **`cli/src/index.js:110-111`** — l'avertissement « `--root` a DEUX sens » cite les verbes
   nouvellement déclarants dans la **bonne** famille (chapeau : `config`, `go`, `brief`, `recap` ;
   bibliothèque : `assemble`, déjà cité). **Deux lignes de commentaire d'aide, aucune ligne de
   logique** — c'est la seule écriture dans `src/` hors `verbes.js`, et elle est nommée comme telle.
5. **`cli/test/guard-json-couverture.test.js`** — boucle de balayage ouverte (l.213), entrée nommée
   pour `root`, contrefactuels par option, en-tête réécrit (ce que la garde couvre / ne couvre pas).
   **Les tests existants restent inchangés**, y compris les 4 CA-M16 et les 6 témoins de G-J2.
6. **`cli/test/fixtures/couverture-options.json`** — neuf, si AR-R4 = (a).
7. **`cli/test/fixtures/temoins-prose/`** — témoins **neufs** pour les verbes touchés qui n'en ont
   pas (`config`, `go`, `brief`, `recap`, `assemble`, `observe`, `repo`), enregistrés **avant**
   toute modification.

### Exclu — décisions, pas oublis

| Exclu | Motif | Successeur |
|---|---|---|
| **Le grain sous-verbe du registre de couverture** | Arbitrage gelé `verbes.js:349-357`, hors sujet ici | `REGISTRE-GRAIN-SOUS-VERBE` (déjà nommé) |
| **Donner `--json` à un verbe qui ne le déclare pas** | Ce lot prouve des promesses existantes | `C-JSON-EXTENSION` (déjà nommé) |
| **Harmoniser le vocabulaire des champs de sortie** | Sans rapport | `C-JSON-VOCABULAIRE` (déjà nommé) |
| **Balayer les autres options** (`--ascii`, `--binding`, `--node`, `--force`, `--portfolio`, `--help`, `--target`…) | AR-R3(c) : rouge massif, mécanisme à étendre par type | `REGISTRE-OPTIONS-BALAYAGE-COMPLET` (déclaré et compté par AR-R4) |
| **Unifier la sémantique de `--project` (`<nom>` vs `<dir>`) et de `--root` (chapeau vs bibliothèque)** | Changerait un comportement observable sur ≥ 9 verbes. Ce lot **documente** la divergence ; il ne la résout pas | `CLI-SEMANTIQUE-PROJECT-ET-ROOT` |
| **Déplacer `root` dans `cli/src/commands/root.js`** | Modifier la production pour le confort d'une heuristique de test | — |
| **Déplacer la garde de dérivation dans `guard-verbes-registre.test.js`** | AR-R3(b) : gain de nommage, risque de transport | `RANGEMENT-GARDES-REGISTRE` |
| **Lever l'angle mort « entrée commentée »** | Demande un parsing JS réel (AST) ; hérité de J0-J3, redit ici (CA-R8), pas résolu | `GARDES-DERIVATION-PAR-AST` |
| **Toute retouche de la prose humaine ou du comportement** | Protégé par témoins (CA-R4) et par le § 2(a) | — |
| **Les `USAGE` locaux des commandes** | Autorité **fine** par construction (`verbes.js:18-22`) ; ils **corroborent** ici (`assemble.js:26`, `observe.js:17`) mais ne sont pas une 4ᵉ source à garder | — |

## 5. Étapes d'implémentation, ordonnées

**Étape 0 — Mesurer, AVANT d'écrire une ligne (⚒️ Gimli, obligatoire et bloquante).**
Je n'ai pas de shell (§ 0.1). Ces mesures sont **dues**, et leurs sorties **citées** dans le rapport
de remise. Elles doivent (1) rejouer chaque cellule des tables A/B/C, (2) trancher les cellules
marquées « à mesurer », (3) établir le point de comparaison.

```bash
cd ~/work/iakaframe
# 0.1 — Le dépôt est vert AVANT (plancher : 1263/1262/0/1)
cd cli && node --test test/ ; cd ..
# 0.2 — Les 3 sources, option par option (rejouer les tables A/B/C)
grep -n "options: \[" cli/src/lib/verbes.js
grep -rn "root: { type:\|path: { type:\|project: { type:" cli/src/commands/
grep -n '^| `' docs/commandes.md | grep -E '\-\-root|\-\-path|\-\-project'
grep -c '^| `repo' docs/commandes.md            # attendu : 0 — verbe non documenté
# 0.3 — Les 5 --root sont-ils LUS, ou morts ?  (si morts, AR-R1 change de réponse)
grep -n "values.root" cli/src/commands/{config,go,brief,recap,assemble}.js
# 0.4 — La sémantique réelle de --project, verbe par verbe (nom vs dossier)
grep -n "values.project" cli/src/commands/{go,brief,recap,observe,jalon,agents,skills,produit,open}.js
# 0.5 — Le comportement ACTUEL de chaque option non déclarée (en bac à sable, jamais ~/.claude)
T=$(mktemp -d) && node cli/src/index.js brief --path "$T" ; echo "exit=$?"
node cli/src/index.js config --path "$T" --root "$T" --json ; echo "exit=$?"
node cli/src/index.js go --project inexistant --root "$T" ; echo "exit=$?"
# 0.6 — Ce que le retrait d'une option DONNERAIT (mesure de l'argument d'AR-R1, sans rien modifier)
node cli/src/index.js banner test --option-qui-nexiste-pas ; echo "exit=$?"   # forme de l'échec parseArgs
# 0.7 — Les surfaces publiques qui vont changer (empreinte AVANT)
node cli/src/index.js --help > /tmp/help-avant.txt
node cli/src/index.js commands --json > /tmp/commands-avant.json
```

**Si une mesure contredit le § 0.3, ARRÊTER et remonter à 🔵 Gandalf.** En particulier : si
l'étape 0.3 montre qu'un `--root` est **parsé mais jamais lu**, l'arbitrage bascule pour ce verbe
(on ne déclare pas une option morte : on la retire), et cela **revient au décideur**.

**Étape 1 — Enregistrer les témoins, AVANT la première ligne modifiée.** Pour chaque verbe touché,
capturer la sortie humaine **et** (si le verbe le porte) la sortie `--json`, dans
`cli/test/fixtures/temoins-prose/<verbe>.txt`. Un témoin pris après ne prouve rien.

**Étape 2 (R1) — Déclarer.** Ajouter les entrées `options` au registre (§ 4, Inclus 2). **Un commit
par famille d'option** (`--root`, puis `--project`), jamais un commit fourre-tout.

**Étape 3 (R1) — Documenter.** Les 6 lignes de `docs/commandes.md` + la **ligne `repo` neuve**.
Chaque ajout nomme **le sens** de l'option sur **ce** verbe (§ 2(c)). Dans le **même commit** que
la déclaration correspondante (CA-09 hérité des lots précédents).

**Étape 4 (R1) — Compléter l'avertissement d'`index.js:110-111`.** Les nouveaux déclarants
rejoignent la bonne famille. Deux lignes de commentaire d'aide, rien d'autre.

**Étape 5 (R1) — Constater les surfaces publiques.** Rejouer `--help` et `commands --json`, diffé
contre les empreintes de l'étape 0.7 : le diff doit être **exactement** les options ajoutées, ligne
par ligne, et rien d'autre. **L'énumérer dans le rapport** (CA-R4).

**Étape 6 (R2) — Ouvrir la boucle.** `guard-json-couverture.test.js:213` :
`['--json','--root','--path','--project']`. La garde doit être **verte du premier coup** si R1 est
complet ; si elle rougit, c'est une **cellule manquée de l'étape 0** — la corriger, et le **dire**.

**Étape 7 (R2) — Traiter le verbe `root` sans liste blanche muette.** Une entrée nommée et motivée
(implémentation en ligne, `index.js:165-169`) : pour un tel verbe, la preuve de « parsé » est la
présence littérale de `'--root'` dans `cli/src/index.js`. Contrefactuel obligatoire (CA-R6).

**Étape 8 (R2) — Contrefactuels, un par option, dans les deux sens.** Sur sondes synthétiques (le
patron des l.221-241), **jamais** en modifiant le registre réel : (1) option retirée du registre
d'un verbe qui la parse et la documente ⇒ rouge **nommant verbe + option** ; (2) option ajoutée au
registre d'un verbe qui ne la parse pas ⇒ rouge **nommant verbe + option**.

**Étape 9 (R2) — Déclarer le hors-balayage** (si AR-R4 = a) : `couverture-options.json` + cliquet,
avec les 4 écarts adjacents déjà mesurés (`assemble --node/--force/--ascii`, `observe --portfolio`,
`commands --ascii`, `models --binding`) et le successeur nommé.

**Étape 10 — Non-régression et remise.** `cd cli && node --test test/` ≥ 1263/1262/0/1 ;
`git status --porcelain` **vide** après la suite ; témoins comparés ; remise à 🏹 Legolas avec les
sorties de l'étape 0 citées.

## 6. Fichiers concernés

| Fichier | Ce qui change | Lot |
|---|---|---|
| `cli/src/lib/verbes.js` | `options` de `config` (130), `go` (199), `brief` (218), `recap` (227), `assemble` (319), `observe` (463). **Rien d'autre** | R1 |
| `docs/commandes.md` | Lignes `config` (266), `go` (336), `brief` (349), `recap` (350), `assemble` (363), `switch` (364) ; **ligne `repo` neuve** en § B.1 | R1 |
| `cli/src/index.js` | **Uniquement** l.110-111 : l'avertissement « `--root` a DEUX sens » cite les nouveaux déclarants. Aucune logique touchée | R1 |
| `cli/test/fixtures/temoins-prose/*.txt` | **Neufs** pour les verbes touchés qui n'en ont pas | R1 |
| `cli/test/guard-json-couverture.test.js` | Boucle l.213 ouverte aux 4 options ; entrée nommée pour `root` ; contrefactuels par option ; en-tête réécrit. **Tests existants intacts** | R2 |
| `cli/test/fixtures/couverture-options.json` | **Neuf** (si AR-R4 = a) : options balayées + hors-balayage motivé + cliquet | R2 |
| `docs/qualite/mesures-etape-0-registre-options.md` | **Neuf** : les tables A/B/C **mesurées**, qui remplacent le § 0.3 comme autorité | R1 |

## 7. Risques

| # | Risque | Mitigation |
|---|---|---|
| **R-R1** | **Le § 0.3 est une lecture, pas une mesure** (pas de shell) | Étape 0 **bloquante** ; toute contradiction ⇒ ARRÊT et retour à 🔵 Gandalf ; provision chiffrée au § 9 |
| **R-R2** | **Déclarer change deux surfaces publiques.** `--help` imprime les options (`index.js:69-73`), `commands --json` les rend. Un test d'empreinte peut rougir sans qu'aucun comportement n'ait bougé | Empreintes AVANT (étape 0.7), diff **énuméré** (CA-R4). Candidats à surveiller : `guard-verbes-registre.test.js` (G5b), `guide-doc-a-jour.test.js`, `project-models.test.js:426,548` (CA-34/CA-21, `models`). **Mesuré** : `gen-iaka-commands.mjs` n'utilise pas `options` ⇒ G5c ne bouge pas |
| **R-R3** | **Documenter faux est pire que ne pas documenter.** `--project` = nom sur `go`/`brief`/`recap`, dossier sur `agents`/`skills`/`produit`/`open` | Étape 0.4 mesure la sémantique verbe par verbe ; § 2(c) impose de nommer **le** sens ; CA-R2 le vérifie |
| **R-R4** | **`--root` déjà ambigu** (`index.js:110-111`) : classer `config` en famille « bibliothèque » induirait en erreur | Étape 0.3 lit le **résolveur** appelé (`resolveRoot` vs `libraryRoot`) ; CA-R10 |
| **R-R5** | **La garde reste textuelle.** Une entrée commentée compte ; `docMentionneOption` fait un `includes` nu (`--project` matcherait `--projects`) | **Déclaré, pas réparé** (CA-R8) : en-tête de la garde + rapport de remise + successeur `GARDES-DERIVATION-PAR-AST`. Ne **jamais** annoncer une garde plus forte qu'elle n'est |
| **R-R6** | **Le verbe `root` traité par une liste blanche muette** — la garde deviendrait fausse au premier verbe suivant implémenté en ligne | Entrée **nommée + motivée** (AR-R3), contrefactuel CA-R6 ; motif obligatoire, à l'image de GC (`guard-verbes-registre.test.js:198`) |
| **R-R7** | **Le lot déborde en « tant qu'on y est »** : 4 écarts adjacents mesurés (`--node`, `--ascii`, `--binding`, `--portfolio`) tendent la main | § 4 « Exclu » + AR-R4 : ils sont **déclarés et comptés**, jamais corrigés ici. Un diff qui les corrige est un **refus au gate** |
| **R-R8** | **Une ligne de doc écrite à la main diverge du registre** dès le lot suivant (la ligne `repo` en particulier) | La garde de R2 **est** ce filet : `repo`/`--path` entre dans le balayage bloquant dès l'étape 6 |

## 8. Critères d'acceptation

Chaque critère est **testable** et porte son **contrefactuel** — la manipulation qui doit le faire
**rougir**, jouée puis **révoquée**, et citée dans le rapport de remise.

### Lot R1 — Aligner les trois sources

- [x] **CA-R1 — La mesure existe et fait autorité.** `docs/qualite/mesures-etape-0-registre-options.md`
      contient les tables A/B/C **mesurées** (verbe × option × déclaré/parsé/documenté, avec la
      ligne source), la sémantique réelle de `--project` et de `--root` verbe par verbe, et
      **signale toute divergence** avec le § 0.3 de cette instruction.
      *Contrefactuel : n/a (artefact de mesure — sa preuve est d'exister, d'être daté et attribué).*
      **PREUVE** : fichier créé, commit `c6305a9`. Aucune divergence de fond trouvée avec le § 0.3 ;
      deux compléments factuels consignés (plancher `1263/1256/0/7` dans ce worktree isolé,
      sémantique `--project` de `jalon`/`observe` tranchée).
- [x] **CA-R2 — Les 8 verbes sont alignés sur les trois sources.** Pour chacun de `config`, `go`,
      `brief`, `recap`, `assemble`, `switch`, `observe`, `repo` et pour chaque option du triplet
      qu'il parse : déclarée dans `verbes.js` **et** documentée sur sa ligne de `docs/commandes.md`,
      **avec la sémantique juste** (`<nom>` vs `<dir>`, chapeau vs bibliothèque). `repo` a une ligne
      de tableau **complète** (5 options).
      *Contrefactuel : retirer `--root` de la ligne `config` de `docs/commandes.md` ⇒ la garde de
      R2 rougit en nommant `config(déclaré=true,parsé=true,documenté=false)`.*
      **PREUVE** : commits `c0da329` (`--root`), `89ad496` (`--project` + ligne `repo`).
      Contrefactuel **joué puis révoqué** le 2026-09-10 : rouge obtenu textuellement
      `config(déclaré=true,parsé=true,documenté=false)` (identique à la prédiction), arbre restauré
      octet pour octet (`diff` vide), `git status --porcelain` vide après restauration.
- [x] **CA-R3 — Aucune option retirée sans refus explicite.** Toute option acceptée avant le lot
      l'est encore après, avec le **même** effet. **Si** AR-R1 = (c) : l'ancien usage rend
      `{ok:false, error}` **nommant l'option**, exit 1, **stderr vide** sur tout verbe déclarant
      `--json` — **jamais** l'exception brute d'`index.js:177`.
      *Contrefactuel : invoquer chaque option retirée ⇒ refus nommant l'option, jamais une pile.*
      **PREUVE** : AR-R1 = (a) retenu (conserver, jamais retirer) — aucune option retirée, donc rien
      à refuser. Le « même effet » est prouvé par les 9 témoins de prose (`temoins-prose.test.js`,
      commit `6e9ff25`) byte-identiques avant/après les commits `c0da329`/`89ad496`, et par le fait
      qu'aucune ligne de `cli/src/commands/*.js` n'a été modifiée (git diff limité à `verbes.js`,
      `docs/commandes.md`, `index.js:110-111`, `cli/test/**`).
- [x] **CA-R4 — Prose et `--json` byte-identiques, sauf les deux surfaces publiques énumérées.**
      Pour chaque verbe touché, la sortie humaine **et** la sortie `--json` sont identiques aux
      témoins de l'étape 1, **octet pour octet**. **Exception unique et énumérée** :
      `iakaframe --help` et `iakaframe commands --json` changent **par construction** — leur diff
      contre les empreintes de l'étape 0.7 contient **exactement** les options déclarées, **ligne
      par ligne**, et **rien d'autre** ; ce diff est **recopié dans le rapport de remise**.
      *Contrefactuel : modifier un caractère d'un message humain ⇒ rouge nommant le verbe.*
      **PREUVE** : 9 témoins de prose verts (`temoins-prose.test.js`, `node --test` → 0 fail).
      Diff `--help`/`commands --json` AVANT→FINAL énuméré dans le rapport de remise (message de
      clôture de Gimli) — exactement 5 `--root` + 4 `--project` + 2 lignes de commentaire d'aide,
      rien d'autre.
- [x] **CA-R10 — L'avertissement `--root` dit la vérité.** `index.js:110-111` cite les nouveaux
      déclarants dans la **bonne** famille (chapeau : `config`, `go`, `brief`, `recap` ;
      bibliothèque : `assemble`), conformément au résolveur mesuré à l'étape 0.3.
      *Contrefactuel : n/a — se constate au diff et se cite dans le rapport.*
      **PREUVE** : commit `c0da329`, diff `index.js:110-111` cité dans la remise.

### Lot R2 — Brancher la garde

- [x] **CA-R5 — Le balayage bloquant porte les 4 options.** `guard-json-couverture.test.js` exécute
      `verbesEnDeriveOption` sur **tous** les verbes réels pour `--json`, `--root`, `--path`,
      `--project`, et il est **vert**.
      *Contrefactuels obligatoires, un par option, dans les deux sens, sur sondes synthétiques :
      (1) option retirée du registre d'un verbe qui la parse+documente ⇒ rouge **nommant verbe +
      option** ; (2) option ajoutée au registre d'un verbe qui ne la parse pas ⇒ rouge **nommant
      verbe + option**. Puis révoquer.*
      **PREUVE** : commit `875cf32`, 8 tests (4 options × 2 sens) tous verts — `add`/`--root`
      retiré, `banner`/`--project` ajouté, `list`/`--json` retiré, `banner`/`--json` ajouté,
      `banner`/`--root` ajouté, `onboard`/`--path` retiré, `banner`/`--path` ajouté, `agents`/
      `--project` retiré. Sondes synthétiques uniquement, jamais écrites au registre réel.
- [x] **CA-R6 — Le verbe `root` est traité par une entrée nommée, jamais par un silence.**
      L'exception porte un **motif** (implémentation en ligne, `index.js:165-169`) et une **preuve
      positive** (présence littérale de `'--root'` dans `cli/src/index.js`).
      *Contrefactuel : retirer `'--root'` de `index.js:166` ⇒ rouge **nommant `root`**. Puis
      révoquer.*
      **PREUVE** : `EXCEPTIONS_PARSE_INLINE` (commit `95cebba`). Contrefactuel **joué puis
      révoqué** le 2026-09-10 : rouge obtenu `root(déclaré=true,parsé=false,documenté=true)`,
      restauration vérifiée par `diff` (identique) et `git status --porcelain` vide.
- [x] **CA-R7 — Le hors-balayage est déclaré et compté** (si AR-R4 = a).
      `cli/test/fixtures/couverture-options.json` porte les options balayées (avec motif) et les
      écarts hors balayage connus — **au moins** `assemble --node/--force/--ascii`,
      `observe --portfolio`, `commands --ascii`, `models --binding` — chacun avec un motif **non
      vide** et le successeur nommé ; `horsBalayageCount` reflète le compte réel.
      *Contrefactuels : (1) une entrée hors-balayage sans motif ⇒ rouge la nommant ; (2) un compte
      désaccordé du réel ⇒ rouge (même patron que `guard-json-couverture.test.js:61-70`).*
      **PREUVE** : commit `875cf32`, `couverture-options.json` (6 écarts, `horsBalayageCount: 6`),
      5 tests CA-R7 verts dont 2 contrefactuels joués sur copie en mémoire (jamais le fichier réel).
- [x] **CA-R8 — Les angles morts sont redits, pas maquillés.** L'en-tête de la garde **et** le
      rapport de remise énoncent : (a) une entrée **commentée** est comptée (dérivation textuelle,
      hérité de `gate-c-json-j3.md:260-264`) ; (b) `docMentionneOption` teste une **sous-chaîne**
      (`--project` matcherait `--projects`). Aucune formulation ne laisse croire à une garde
      sémantique.
      *Contrefactuel : n/a — se constate à la lecture, et se cite.*
      **PREUVE** : commit `bfd7bad`, commentaires ajoutés au-dessus de `parseOptionDansFichier` (a)
      et `docMentionneOption` (b). Repris dans le rapport de remise.
- [x] **CA-R9 — Le dépôt est vert et propre.** `cd cli && node --test test/` : **≥ 1263 tests,
      0 fail** (plancher hérité, `BACKLOG.md:680-681`) ; `git status --porcelain` **vide** après la
      suite (aucun test n'écrit hors bac à sable — **jamais** dans `~/.claude` ni `~/Applications`).
      *Contrefactuel : n/a — se constate à l'exécution, sorties citées.*
      **PREUVE** : `node --test` (forme qui marche sous Node v24.18.0, cf. § 0.1) → **1287 tests,
      1280 pass, 0 fail, 7 skipped**, rejoué deux fois à l'identique. `git status --porcelain` vide
      après chaque run.

### Ce qui n'est PAS prouvable dans ce lot — et qui doit donc être dit

- **Que le registre soit vrai sur TOUTES les options.** Quatre drapeaux sont balayés ; les autres
  sont **déclarés hors balayage** (AR-R4), avec 4 écarts déjà connus. Le lot rend vrai **ce qu'il
  garde**, pas le registre entier.
- **Que la garde résiste à du code commenté ou à une doc reformulée.** Dérivation textuelle
  (CA-R8).
- **Que `--project` et `--root` aient un sens cohérent dans le CLI.** Explicitement exclu :
  ce lot **documente** la divergence, il ne l'unifie pas (`CLI-SEMANTIQUE-PROJECT-ET-ROOT`).

## 9. Estimation — au jalon P1→P2

**Ordre de grandeur assumé et révisable — pas un engagement ferme.**

| Lot | Équivalent jour-homme | Complexité / risque | Ce qui peut le faire glisser |
|---|---|---|---|
| **R1 — Aligner** | **0,5 à 0,75 j** | **Faible.** Trois fichiers, ~15 cellules, aucune logique touchée | La ligne `repo` (verbe non documenté, à rédiger juste) : +0,15 j. Un test d'empreinte inattendu sur `--help`/`commands --json` (R-R2) : +0,25 j |
| **R2 — Garder** | **0,5 j** | **Faible-moyenne.** Une ligne de mécanisme, mais 8 contrefactuels + l'entrée `root` + la fixture | Si l'entrée `root` demande plus qu'une preuve littérale (heuristique à généraliser) : +0,2 j |
| **Total** | **1 à 1,25 j-h** | **Faible** | — |

**Inconnues, nommées :**

1. **L'étape 0 peut retourner AR-R1.** Si un `--root` est **parsé mais jamais lu**, on ne le déclare
   pas : on le retire — et le lot gagne une écriture de production (refus explicite) plus un retour
   au décideur. **Provision : +0,3 j.** *(Ma lecture dit que les cinq sont lus —
   `config.js:73`, `go.js:58`, `brief.js:37`, `recap.js:27`, `assemble.js:46` — mais c'est une
   lecture, § 0.1.)*
2. **Les tests d'empreinte sur les surfaces publiques.** Je n'ai pas pu exécuter la suite : je ne
   sais pas si un test compare `--help` ou `commands --json` à une empreinte figée. C'est la seule
   inconnue **d'ingénierie** du lot. **Provision : +0,25 j.**
3. **La rédaction de la ligne `repo`.** Documenter un verbe réseau qui **crée un dépôt distant**
   demande de dire `--create` juste, du premier coup. **Provision : +0,15 j.**

**Recommandation d'engagement.** Engager **R1 + R2 ensemble** (**1 à 1,25 j**) : R1 seul laisse le
dépôt vrai mais non gardé — c'est-à-dire exactement l'état d'où vient cette dette. Le gain du lot
n'est pas de corriger 8 verbes ; il est d'ouvrir la boucle qui empêchera le neuvième. Si le décideur
veut fractionner, R1 est livrable, vert et refusable seul — mais alors R2 doit être **rouvert au
backlog le jour même**, pas laissé au fil de l'eau.
