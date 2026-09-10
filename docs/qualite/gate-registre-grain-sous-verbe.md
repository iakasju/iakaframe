# Gate qualité — REGISTRE-GRAIN-SOUS-VERBE — branche `feat/registre-grain-sous-verbe`

Vérificateur : 🏹 Legolas. Date : 2026-09-10. Commits gatés (remis par ⚒️ Gimli) : `9dcc0e7`,
`95b6105`, `0cf4d2c`, `e5e8030`, au-dessus de `ad472ed` (amendement Gandalf), `7c826b3` (mesures
étape 0 Gimli) et `88682c4` (arbitrage AR-G4=(b) du décideur) — base **fixe** de la branche :
`18bcec0` (dernier commit de `main` **au moment de la coupe de branche**). Cadrage :
`specs/instructions/registre-grain-sous-verbe.md` (§ 8, CA-G1 à CA-G11 ; § 7, R-G1 à R-G9).
Toutes les mesures ci-dessous sont **re-jouées** par moi ; aucune n'est reprise du rapport de
Gimli ou de Gandalf sans exécution propre.

⚠️ **Précision de méthode, nommée avant tout le reste** : `main` a **avancé** pendant cette
session de gate (lot indépendant `REGISTRE-OPTIONS-ROOT-PATH-PROJET`, mergé sur `main` par une
autre session pendant que ce gate tournait — `main` pointe désormais `ba336ee`, plusieurs commits
au-delà de `18bcec0`). Un premier `git diff main..HEAD -- cli/src/` a donc donné un **faux
positif** de dépassement de périmètre (options `--root`/`--path`/`--project` apparaissant
« retirées » sur `config`/`go`/`brief`/`recap`/`assemble`/`observe`) — artefact de la comparaison
à un `main` mouvant, pas un fait du lot. Toutes les mesures de périmètre ci-dessous utilisent donc
la base **figée** `18bcec0..HEAD`, pas le ref `main` littéral.

## Verdict : **PASS**

Suite complète verte (`1282/1275/0/7`, confrontée à la ligne de base du **worktree**
`1263/1256/0/7` — pas au gate J3, conformément à CA-G11), périmètre de production exactement
tenu (données seules dans `verbes.js`), les onze critères CA-G1 à CA-G11 rejoués et satisfaits
avec contrefactuels **joués en direct** sur le dépôt réel puis **révoqués** (`git status
--porcelain` vide après chacun), fixture à 51 entrées dérivées indépendamment et sans écart,
`horsCouvertureCount: 0` constaté (pas déclaré). **Deux écarts non bloquants** signalés en fin de
rapport (un sur la portée réelle du contrefactuel CA-G8, un sur une ligne de setup pré-existante
altérée).

## Mesures — suite complète

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` sur `main` figé à `18bcec0` (worktree jetable, 2 exécutions) | `0` (2e run) | 1re exécution : `tests 1263, pass 1255, fail 1, skipped 7` — 1 échec **transitoire** sur `install-contrat-machine.test.js:370` (`evt:"fin" porte etatAtteint.etapesFaites VIDE`, `1 !== 0`) ; 2e exécution, immédiate, mêmes sources : `tests 1263, pass 1256, fail 0, skipped 7`. Flakiness **déjà nommée** par Gimli à l'étape 0 (`mesures-etape-0-registre-grain-sous-verbe.md:54-60`), **non reproduite** sur la branche (2 runs verts consécutifs, cf. ligne suivante) |
| `cd cli && node --test` sur la branche (`feat/registre-grain-sous-verbe` @ `e5e8030`), 2 exécutions consécutives | `0` (les deux fois) | `tests 1282, pass 1275, fail 0, cancelled 0, skipped 7, todo 0` — **identique aux deux runs** ; `git status --porcelain` **vide** après chacun |
| `cd cli && node --test test/guard-json-output.test.js` | `0` | `tests 73, pass 73, fail 0` (63 → 73, +10, conforme à la remise) |
| `cd cli && node --test test/guard-json-couverture.test.js` | `0` | `tests 27, pass 27, fail 0` (18 → 27, +9) |
| `cd cli && node --test test/guard-verbes-registre.test.js` | `0` | `tests 18, pass 18, fail 0` — **inchangé** |
| `cd cli && node --test test/guide-doc-a-jour.test.js` | `0` | `tests 6, pass 6, fail 0` — **inchangé** |
| `cd cli && node --test test/temoins-prose.test.js` | `0` | `tests 23, pass 23, fail 0` — **inchangé** |
| Lint / typecheck | n/a | Aucun `.eslintrc*`/`tsconfig*`, aucun script `lint` dans `cli/package.json` (JS pur) — **sans objet**, non un critère non mesuré (identique au constat du gate J3) |

**Diff des titres de tests (TAP, `node --test --test-reporter=tap`), `18bcec0` vs branche** :
19 tests nets ajoutés (21 titres apparus − 2 titres disparus, qui sont en réalité le **même**
test **renommé** pour refléter le nouveau grain, pas une suppression) :

- **Disparus (renommés, pas supprimés)** : `CA-J13 : toute invocation attendue (verbe/sous-verbe
  déclarant --json) a au moins une entrée NOMINAL ou ERRORS` → devient `CA-J13 : toute surface
  attendue (grain sous-verbe, AR-G1(a)/AR-G2(b)) …` ; `CA-M16 : la liste des verbes du registre
  correspond EXACTEMENT aux verbes déclarant --json …` → devient `CA-M16 : les identifiants du
  registre correspondent EXACTEMENT aux surfaces attendues au grain sous-verbe …`. Même fonction
  de fidélité/complétude, même emplacement dans le fichier, dérivation réécrite (étape 1) : **aucun
  test perdu**.
- **Ajoutés (21 titres, dont les 2 renommages ci-dessus comptés comme "nouveaux" par le diff
  textuel)** : 10 invocations `C-JSON nominal : memory add/replace/remove`, `produit
  init/add/replace/remove`, `review apply/reject/auto` (étape 5, AR-G4=(b)) ; 3 tests
  `sousVerbeParDefaut` (garde structurelle + contrefactuel + inventaire des trois alias) ; 3 tests
  `CA-G3` (contrefactuel n°1 qui tire, contrefactuel n°2 qui ne tire pas et le dit, garde
  structurelle) ; 1 test `CA-G2` (double rougissement) ; 3 tests `AR-G6(c)` (garde + 2
  contrefactuels).

## Périmètre de production — la seule écriture de code de ce lot

`git diff 18bcec0..HEAD --stat -- cli/src/` :

```
cli/src/lib/verbes.js | 23 ++++++++++++++++++++++-
1 file changed, 22 insertions(+), 1 deletion(-)
```

**Exactement le périmètre annoncé, rien d'autre.** Lecture ligne à ligne du diff complet
(`git diff 18bcec0..HEAD -- cli/src/`) :
- `sousVerbeParDefaut: 'list'` sur `agents`, `sousVerbeParDefaut: 'deploy'` sur `skills`,
  `sousVerbeParDefaut: 'verify'` sur `frame` — trois champs de **données**, chacun accompagné d'un
  commentaire motivé citant la mesure 0.c et le risque R-G6.
- `motif` de `frame.guideClaudeCode` reformulé (désambiguïsation AR-G5(b)) : la forme « chute si
  … » exigée par la garde `GC` est **conservée**, seul l'objet de la condition change (`guideClaudeCode`
  nommé explicitement, distinct de `couverture-json.json`).
- **Aucune fonction, aucune sortie, aucun format** ne change ailleurs dans `cli/src/`.

**Fichiers explicitement « lus et jamais écrits » par l'instruction (§ 6), vérifiés intacts** —
`git diff 18bcec0..HEAD --stat -- cli/src/commands/ cli/src/lib/output.js cli/src/lib/interactif.js
cli/scripts/gen-iaka-commands.mjs docs/commandes.md cli/test/guard-verbes-registre.test.js` :
sortie **vide**, aucun de ces fichiers n'a bougé.

**`git diff 18bcec0..HEAD --stat` (tout le dépôt)** — six fichiers, exactement ceux du § 6 de
l'instruction (fixture, garde de couverture, `verbes.js`, garde de sortie, mesures étape 0,
instruction elle-même) :

```
cli/src/lib/verbes.js                                            |  23 +-
cli/test/fixtures/couverture-json.json                           |  48 +-
cli/test/guard-json-couverture.test.js                           | 233 +++++-
cli/test/guard-json-output.test.js                                |  70 +-
docs/qualite/mesures-etape-0-registre-grain-sous-verbe.md         | 221 ++++++
specs/instructions/registre-grain-sous-verbe.md                  | 825 +++++++++++++++++++++
```

`BACKLOG.md` **non touché** — conforme à l'instruction (§ 4, à écrire **après** réception de ce
gate, jamais avant) ; contraste volontairement noté avec l'écart nº 1 du gate J3 précédent
(`gate-c-json-j3.md:246-259`), où le BACKLOG avait été marqué « Soldé » en anticipation.

## CA-G1 à CA-G11 — rejoués un par un

### CA-G1 — La mesure existe et fait autorité. **PASS.**
`docs/qualite/mesures-etape-0-registre-grain-sous-verbe.md` existe, daté 2026-09-10, commit
`7c826b3`, cite ses commandes et leurs sorties (0.a à 0.e), signale explicitement les 3 lignes où
sa mesure diverge du § 0 de lecture de Gandalf (`agents`, `frame` : alias et non erreur d'usage ;
`observe` : erreur d'usage et non comportement propre écrivain) — absorbées en place dans
l'instruction amendée (`ad472ed`). Lu intégralement, vérifié cohérent avec le code final.

### CA-G2 — Une seule dérivation, deux consommateurs. **PASS, contrefactuel rejoué en direct.**
`surfacesAttendues(VERBES)` (une fonction, `guard-json-couverture.test.js:56-71`) alimente **à la
fois** `CA-M16` (fidélité du registre) et `CA-J13` (G-J1). Aucune liste d'ids écrite en dur.
**Contrefactuel joué sur le fichier réel** : injection d'un sous-verbe fictif
`{ id: 'fictif-legolas', options: ['--json'] }` sous `agents` dans `cli/src/lib/verbes.js` →
```
not ok 1 - CA-M16 : les identifiants du registre correspondent EXACTEMENT aux surfaces attendues …
not ok 19 - CA-J13 : toute surface attendue … invocation(s) attendue(s) SANS NOMINAL, ERRORS,
            ni alias déclaré : agents fictif-legolas
```
**Deux rouges distincts**, chacun nommant `agents fictif-legolas`. Révoqué (`git checkout --
cli/src/lib/verbes.js`), `git status --porcelain` vide, `guard-json-couverture.test.js` revert à
27/27.

### CA-G3 — Le repli `verbId` est mort, ses trois causes déclarées. **PASS, 3 contrefactuels rejoués.**
`grep -n "verbId" cli/test/guard-json-couverture.test.js` : **aucune occurrence** de l'ancien repli
`!couvertes.has(a.verbId)` (confirmé par lecture complète du diff, § « repli AR-G3(b) » remplacé
par `estSatisfaiteParAlias`, qui exige `sousVerbeParDefaut` déclaré **et** la forme nue **mesurée**).
- **Contrefactuel n°1 (il tire), joué en direct** : retrait de `sousVerbeParDefaut: 'deploy',` de
  `skills` dans `verbes.js` → `not ok 7`, `not ok 19`, `not ok 20`, `not ok 22`, `not ok 24`,
  `not ok 25` (6 rouges), le test G-J1 nommant explicitement `skills deploy` comme non couvert.
  Révoqué, clean, 27/27.
- **Contrefactuel n°2 (il ne tire pas, et c'est consigné dans le test committé, pas seulement
  déclaré au rapport)** : `guard-json-couverture.test.js:485-491` retire successivement l'alias
  d'`agents` puis de `frame` et **affirme `assert.deepEqual(manquantes, [])`** pour chacun — ce
  test fait partie des 27 verts. Le non-déclenchement est donc **prouvé dans le test lui-même**,
  pas seulement noté au rapport de remise — exactement l'exigence de la mission.
- **Contrefactuel n°3 (garde structurelle), joué en direct** : remplacement de
  `sousVerbeParDefaut: 'deploy'` par `sousVerbeParDefaut: 'deployy'` (faute de frappe) dans
  `verbes.js` → `not ok 5 : sousVerbeParDefaut ne désigne pas un sous-verbe réel : skills` (+ 6
  autres rouges en cascade, dont `AR-G6(c)` qui nomme aussi `skills deploy`). Révoqué, clean, 27/27.

### CA-G4 — Le registre ne peut plus mentir sur sa couverture (AR-G6(c)). **PASS, 2 contrefactuels rejoués.**
- **(1) Entrée réellement NON mesurée déclarée `c-json`** : suppression de la ligne
  `['config', ['config', '--json', '--path', PROJ], null],` dans `guard-json-output.test.js` (le
  fichier `verbes.js` et la fixture restant inchangés, `config` déclaré `c-json`) →
  `not ok 25 : écart(s) couverture <-> mesure : config.c-json (déclaré=true, mesuré=false) |
  config.hors-couverture (déclaré=false, mesuré=true)`. Nomme `config` exactement. Révoqué
  (`git checkout -- cli/test/guard-json-output.test.js`), clean.
  *Précision méthode* : un premier essai en **commentant** (`//`) la ligne au lieu de la supprimer
  n'a **rien** fait rougir — c'est l'angle mort connu de G-J1 (dérivation textuelle, pas de
  parsing JS, déjà nommé au gate J3, `gate-c-json-j3.md:145-163`, exclu de ce lot § 4/R-G5). La
  **suppression** de la ligne (et non son commentaire) est la manipulation qui démontre réellement
  le contrefactuel prévu par l'instruction.
- **(2) Entrée réellement mesurée déclarée `hors-couverture`** : dans la fixture, remplacement de
  `{ "id": "memory init", "couverture": ["c-json"] }` par
  `{ "id": "memory init", "couverture": ["hors-couverture"], "motif": "sonde CA-G4 Legolas" }` →
  `not ok 25 : … memory init.c-json (déclaré=false, mesuré=true) | memory init.hors-couverture
  (déclaré=true, mesuré=false)`. Nomme `memory init` exactement, comme prévu par l'énoncé de
  l'instruction. Révoqué (`git checkout -- cli/test/fixtures/couverture-json.json`), clean.

### CA-G5 — Un sous-verbe ajouté demain sans invocation est attrapé. **PASS.**
Couvert par le contrefactuel de CA-G2 ci-dessus (sonde en mémoire déjà committée dans le test **et**
rejeu sur le fichier réel, révoqué, `git status --porcelain` vide après).

### CA-G6 — La garde d'AVANT ne voyait pas ce que la garde d'APRÈS voit. **PASS, script jetable joué.**
Script jamais committé (`/private/tmp/.../scratchpad/ca-g6.mjs`, supprimé après usage), qui
réimporte `VERBES` et `surfacesAttendues`, simule **en mémoire** (jamais sur disque) la disparition
de l'invocation `memory add` (une des dix fermées par ce lot), puis compare :
```
AVEC repli verbId (ANCIENNE derivation)  : []
SANS repli       (NOUVELLE derivation)   : ["skills deploy","memory add"]
compte AVEC : 0 | compte SANS : 2
```
**L'ancienne dérivation ne voit RIEN** (le verbe nu `memory` reste dans `couvertes` via
`memory init`/`memory replace`, et le repli traite ça comme suffisant pour `memory add`) — **c'est
exactement le mécanisme du § 0.3** rejoué sur le registre neuf. La nouvelle dérivation nomme
`memory add`. (`skills deploy` apparaît aussi côté « SANS » dans ce script simplifié faute d'y avoir
réimplémenté `estSatisfaiteParAlias` — sans incidence sur la démonstration, qui porte sur `memory
add`.)

### CA-G7 — Le cliquet ne ment plus, et sa variation est un geste écrit. **PASS.**
`horsCouvertureCount: 0` dans la fixture, `0` entrée `hors-couverture` sur 51 (vérifié par script
Node direct, ci-dessous), test préexistant `CA-M16 : le CLIQUET … reflète le compte RÉEL`
inchangé et vert. `_lisezMoi` (relu intégralement) énonce le nouveau grain, le séparateur `"<verbe>
<sousVerbe>"`, la règle AR-G6(c), **et** la règle R-G4 (« toute REMONTÉE du cliquet n'est légale
que si CE COMMIT change aussi le grain/la mesure et motive chaque entrée ajoutée ») — **et ne cite
plus AR-J1(b) comme arbitrage en vigueur** (il l'évoque seulement pour dire qu'il « N'EST PLUS
VRAI »). Déclaré non prétendu résolu : les trois `sousVerbeParDefaut` restent des déclarations non
auto-vérifiées (R-G6), correctement nommé comme tel dans le commentaire du code.

### CA-G8 — Aucun test n'écrit hors d'un `mkdtempSync`. **PASS sur le fait mesuré ; écart non bloquant sur la portée du contrefactuel, cf. Écarts nº 1.**
`git status --porcelain` **vide** après les deux exécutions complètes de la suite sur la branche
(mesuré ci-dessus). Contrefactuel joué dans un **worktree jetable dédié** (`legolas-cag8`, détaché
sur `e5e8030`, jamais le dépôt réel, conformément à la consigne de l'instruction) : retrait de
`'--library', REVIEW_LIBRARY` des invocations `review apply`/`review auto` → **aucun rouge**,
`git status --porcelain -- library/` **vide** dans ce worktree jetable. Investigation :
`materialize()` (`src/lib/review.js:180-183`) dispatche par **type** de proposition ; les
corrections `@correction(registre) …` utilisées par ce lot sont de type `memory`
(`materializeMemory`, qui écrit dans `home`, jamais dans `library`) — le chemin `materializeSkill`
(seul consommateur de `--library`) n'est **jamais exercé** par les invocations ajoutées. Voir Écarts
nº 1 pour la portée exacte de ce constat.

### CA-G9 — Aucune sortie ne change, machine ni humaine. **PASS.**
`node --test test/temoins-prose.test.js` : `23/23`. `git diff 18bcec0..HEAD --stat -- cli/test/fixtures/temoins-prose/ cli/test/temoins-prose.test.js` : **sortie vide**, rien touché. Le diff de
`cli/src/` (cité ci-dessus, périmètre de production) ne contient **que** des lignes de données
(`sousVerbeParDefaut`, `motif`) et leurs commentaires — confirmé par lecture ligne à ligne du diff
complet, aucune fonction ni chaîne émise modifiée.

### CA-G10 — Les gardes voisines sont intactes et vertes. **PASS.**
`guard-json-output.test.js` : `73` tests (`63 + 10`, correspondant exactement aux dix invocations
de l'étape 5), aucune invocation préexistante **retirée** (diff des titres TAP ci-dessus : 10
ajouts nets sur ce fichier, 0 retrait). Une ligne de **setup** pré-existante (`REVIEW_PROPOSAL_ID`)
est modifiée, pas seulement ajoutée — cf. Écarts nº 2. `guard-verbes-registre.test.js` (18/18),
`guide-doc-a-jour.test.js` (6/6) : **byte-inchangés** (diff vide sur ces deux fichiers). Dans
`guard-json-couverture.test.js`, comparaison ligne à ligne du diff complet contre `18bcec0` :
aucune ligne modifiée entre les lignes correspondant à l'ancien G-J2 (grain option, ~l.72-241) et à
la règle 6 (~l.243-280) — tous les blocs `diff` tombent **avant** (déclaration/dérivation, CA-M16,
`sousVerbeParDefaut`) ou **après** (repli, CA-J13, CA-G2/G3, AR-G6(c)) cette plage.

### CA-G11 — Le dépôt est vert. **PASS.**
`tests 1282, pass 1275, fail 0, skipped 7` (branche, 2 runs identiques) confronté à `tests 1263,
pass 1256, fail 0, skipped 7` (ligne de base du **worktree**, mesurée en direct par moi sur `main`
figé à `18bcec0`, **pas** les `1263/1262/1` du gate J3 qui valent pour l'arbre racine avec le dépôt
frère présent). Écart `pass` : `+19`, entièrement expliqué par les tests ajoutés (diff des titres
TAP ci-dessus : 19 nets). Écart `skipped` : **0** — reste à **7** des deux côtés, conforme à
l'exigence de CA-G11 (« tout skip supplémentaire… à nommer »).

## Fixture — 51 entrées, dérivation indépendante

```
$ node -e "const fx = require('./test/fixtures/couverture-json.json');
console.log('count', fx.verbes.length);
const ids = fx.verbes.map(v=>v.id);
console.log('dups', ids.filter((id,i)=>ids.indexOf(id)!==i));
console.log('hors-couverture entries', fx.verbes.filter(v=>v.couverture.includes('hors-couverture')).length);"
count 51
dups []
hors-couverture entries 0
```

**Re-dérivation indépendante**, rejouant le script §0.b de l'instruction PUIS construisant la
liste des 51 surfaces attendues moi-même (sans importer `surfacesAttendues` du test, pour ne pas
me fier à la fonction que je suis censé vérifier) :
```
sans sous-verbes : 21 | sous-verbes declarants : 29 | formes nues a arbitrer : 8
attendues total 51
fixture total 51
missing in fixture []
extra in fixture []
```
**Zéro écart**, dans les deux sens, entre ma dérivation indépendante et la fixture committée.

`_lisezMoi` réécrit (cité et vérifié ci-dessus, CA-G7) ; ids plats `"<verbe>"` / `"<verbe>
<sousVerbe>"`, séparateur unique (espace), aucune structure imbriquée.

## Points de vigilance nommés par Gimli — vérifiés

- **`FORMES_NUES_PROPRES = ['models']`** (`guard-json-couverture.test.js:52-57`) : **non muette**.
  Le commentaire au-dessus cite explicitement `docs/qualite/mesures-etape-0-registre-grain-sous-verbe.md
  § 0.c`, nomme la nature de la limite (« FAIT MESURÉ… PAS une dérivation structurelle… rien dans
  sa FORME ne distingue aujourd'hui ce cas des quatre erreurs d'usage ») et précise ce qui la
  justifie (`models` nu rend `count`/`targets`/`roles`/`suggestions`, distinct de `set`/`unset`).
  Conforme à la doctrine du dépôt (registre motivé, jamais muet).
- **Asymétrie CA-G3** : déclarée et **prouvée dans un test committé** (contrefactuel n°2, ci-dessus),
  pas seulement au rapport de remise.
- **Irrégularité `review` (forme nue → `{ok:false, error:true}` booléen)** : hors périmètre confirmé
  — `git diff 18bcec0..HEAD -- cli/src/lib/verbes.js` ne touche **aucune** option de `review`,
  successeur `C-JSON-VOCABULAIRE` déjà nommé dans l'instruction (§ 4, Exclu). Non retesté ici
  (aucune raison de le faire, le lot ne le touche pas).

## Écarts

1. **(non bloquant, précision de portée) Le contrefactuel CA-G8, tel que littéralement décrit dans
   l'instruction (« retirer `--library <tmp>` de l'invocation `review apply` ⇒ `git status` n'est
   plus vide ⇒ rouge »), ne se produit pas pour les invocations réellement ajoutées par ce lot.**
   Elles portent sur des corrections de type `memory`/`registre`, dont `materialize()` écrit dans
   `home` (sandbox), jamais dans `library` — le chemin `materializeSkill`, seul consommateur de
   `--library`, n'est jamais exercé. Vérifié dans un worktree jetable dédié (jamais le dépôt réel) :
   retirer `--library` de `review apply`/`review auto` ne fait **rien** rougir et ne laisse **aucune**
   trace sous `library/`. Ce n'est **pas** une fuite (R-G2 n'est **pas** matérialisé, contrairement à
   la crainte) : c'est que le `--library` obligatoire, bien que défensif et correctement câblé
   (présent sur les deux invocations, avec un commentaire qui anticipe précisément ce cas — « même
   si la proposition mesurée est de type memory/registre »), n'est **testé pour de vrai** que si un
   jour une proposition de type `skill` emprunte ce même chemin `review apply`/`review auto`. Le
   code est prudent ; l'énoncé du contrefactuel de l'instruction décrit un risque qui n'est pas
   celui que l'invocation shippée expose. À corriger dans l'instruction (ou dans un futur lot
   `review`-skill) si l'on veut un contrefactuel qui tire réellement sur ce point.
2. **(non bloquant, littéral) Une ligne de setup pré-existante est modifiée, pas seulement
   ajoutée.** `guard-json-output.test.js` : `const REVIEW_PROPOSAL_ID = listProposals(REVIEW_HOME)[0]?.id;`
   devient `listProposals(REVIEW_HOME).find((p) => p.slug === 'c-json')?.id;` — rendu nécessaire par
   l'ajout de trois propositions supplémentaires (`alpha`/`beta`/`gamma`) dans le même
   `REVIEW_HOME`, qui rendait l'indexation `[0]` ambiguë. Fonctionnellement équivalente (cible
   toujours la même proposition d'origine — confirmé par le test `review show` resté vert aux deux
   runs complets), motivée par le contexte immédiat (commentaire au-dessus explique les trois
   propositions distinctes). Même nature que l'écart nº 3 du gate J3 (`gate-c-json-j3.md:265-267`,
   CA-J14) : une ligne littéralement altérée, pas seulement une addition — à documenter comme telle
   plutôt qu'à déclarer une conformité absolue à « invocations préexistantes intactes ».
3. **(non bloquant, artefact de session, sans rapport avec ce lot) `main` a avancé pendant le gate**
   — signalé en tête de rapport. N'affecte aucune des mesures ci-dessus (toutes rejouées contre la
   base figée `18bcec0`), mais Aragorn doit savoir que le `main` littéral (`ba336ee` au moment de
   ce rapport) n'est **plus** le point de coupe de cette branche : toute fusion ultérieure devra
   composer avec le lot `REGISTRE-OPTIONS-ROOT-PATH-PROJET` déjà mergé en parallèle.
4. **(hors périmètre de blocage, déjà nommé par l'instruction)** Successeurs confirmés inchangés et
   non retraités ici : `GUIDE-CLAUDE-GRAIN-SOUS-VERBE` (chute de `guideClaudeCode` par sous-verbe),
   `C-JSON-VOCABULAIRE` (irrégularité `review` nu), `G-J1-ENTREE-NEUTRALISEE` (angle mort du
   comptage textuel, **son exposition passe de 29 à 51 lignes avec ce lot**, nature inchangée,
   R-G5), `REGISTRE-OPTIONS-ROOT-PATH-PROJET` (déjà en cours, mergé sur `main` en parallèle de ce
   gate — cf. écart nº 3).

## Jalon

`FAIL` : n/a. **`PASS`** — le récepteur du jalon est l'étape suivante (stage), gate franchi sans
humain (gate qualité automatique, profondeur complète car version mineure/feature). La Revue
Qualité de Version et la bascule production restent des gestes humains distincts.

---

# Re-gate après intégration de main (`3481323`)

Vérificateur : 🏹 Legolas. Date : 2026-09-10. Déclencheur : commit de merge `3481323`
(intégration par 🧭 Aragorn de `origin/main` = `ba336ee`, lot `REGISTRE-OPTIONS-ROOT-PATH-PROJET`
R1+R2, dans `feat/registre-grain-sous-verbe` — merge textuel automatique, aucun conflit,
aucune résolution manuelle, sur `cli/src/lib/verbes.js` et `cli/test/guard-json-couverture.test.js`).
Ce re-gate est **court** : il ne rejoue pas les CA-G1..CA-G11 en entier (déjà PASS au gate
principal ci-dessus, sur `40755ba`) — il vérifie **l'interaction sémantique** des deux lots que le
merge textuel automatique ne prouve pas de lui-même. Lieu : le même worktree,
`/Users/sjupin/work/.wt/iakaframe-registre-grain-sous-verbe`.

## Verdict : **PASS**

Suite complète verte après merge (`1306/1299/0/7`, deux runs identiques, `= 1287 + 19` comme
annoncé), aucun test perdu d'aucun des deux lots (diff des titres à trois branches : ours,
theirs, mergé), les deux gardes de grain (fidélité/complétude sous-verbe côté nous, balayage
4-options côté eux) **coexistent sans se neutraliser** — un contrefactuel de chaque lot rejoué
en direct sur le fichier fusionné, chacun nommant sa cible sans faire rougir l'autre garde, révoqué,
`porcelain` vide. Périmètre de production `ba336ee..3481323` toujours strictement les 22 lignes
de données de notre lot (`sousVerbeParDefaut` ×3 + motif `frame`) ; les déclarations `--root`/
`--project` de leur lot présentes et intactes. `docs/commandes.md` non touché par le merge.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` (run 1, post-merge) | `0` | `tests 1306, pass 1299, fail 0, cancelled 0, skipped 7, todo 0` |
| `cd cli && node --test` (run 2, post-merge) | `0` | `tests 1306, pass 1299, fail 0, cancelled 0, skipped 7, todo 0` — identique au run 1 ; `git status --porcelain` vide après chaque run |
| `cd cli && node --test test/guard-json-couverture.test.js` | `0` | `tests 42, pass 42, fail 0` (27 côté notre lot + 15 côté leur lot) |
| `cd cli && node --test test/guard-json-output.test.js` | `0` | `tests 73, pass 73, fail 0` — inchangé depuis le gate principal |
| `cd cli && node --test test/guard-verbes-registre.test.js` | `0` | `tests 18, pass 18, fail 0` — inchangé |
| `cd cli && node --test test/temoins-prose.test.js` | `0` | `tests 32, pass 32, fail 0` — `23 → 32` (+9, entièrement dû au lot `REGISTRE-OPTIONS`, déjà dans `ba336ee`, non retouché par le merge) |
| `cd cli && node --test test/guide-doc-a-jour.test.js` | `0` | `tests 6, pass 6, fail 0` — inchangé |

## 1. Diff des titres de tests — `40755ba` (nous) vs `ba336ee` (eux) vs `3481323` (mergé)

TAP (`node --test --test-reporter=tap`), trois exécutions (worktree branche, worktree jetable
`ba336ee`, worktree branche post-merge), comparées par `comm` :

- **Perdus depuis `40755ba` (nos tests)** : `comm -23 tap-branche-avant-merge.txt
  tap-apres-merge.txt` → **vide**. Rien des 1282 titres de notre lot ne manque après merge.
- **Perdus depuis `ba336ee` (leurs tests)** : `comm -23 tap-ba336ee.txt tap-apres-merge.txt` →
  exactement les **deux mêmes** titres déjà identifiés et expliqués au gate principal comme
  **renommages** de notre lot (`CA-J13 : toute invocation attendue…` → `CA-J13 : toute surface
  attendue…` ; `CA-M16 : la liste des verbes du registre…` → `CA-M16 : les identifiants du
  registre…`) : ce sont les titres AVANT notre rewrite de dérivation, présents dans `ba336ee` (qui
  n'a pas notre lot) et absents après merge (qui l'a) — même test, même emplacement, dérivation
  réécrite. **Aucune perte réelle.**
- **Titres présents après merge mais absents de l'union des deux parents** : **vide**, à un
  artefact de comptage près (`GARDE : la fausse forge ecoute bien sur 127.0.0.1`, titre **dupliqué
  à l'identique** entre `test/repo-guard.test.js:107` et `test/switch-flags-guard.test.js:117`,
  préexistant aux deux lots, sans rapport avec l'un ou l'autre — `sort -u` sur l'union des deux
  parents le fusionne en une ligne, la sortie mergée le compte deux fois ; expliqué, pas un écart).
- **Compte** : `1282` (nous) + `1286` (eux, worktree jetable `ba336ee`, `tests 1287, pass 1280,
  fail 0, skipped 7`) − recouvrement (tests communs aux deux, ni touchés par l'un ni par l'autre) =
  `1306`, exactement la mesure post-merge. Cohérent avec l'annonce d'Aragorn (`1287 + 19 = 1306`,
  où `1287` compte les tests côté `ba336ee` avec `skipped=7` dans CE worktree — l'écart avec le
  `1287/1286/0/1` cité par Aragorn, mesuré sur l'arbre racine avec le dépôt frère `iakaFrameGUI`
  présent, est le même écart de `skipped` (1 vs 7) déjà documenté au gate principal, sans rapport
  avec le merge).

## 2. `guard-json-couverture.test.js` fusionné — les deux gardes coexistent, contrefactuels croisés

Lecture du fichier fusionné (675 lignes) : la boucle `verbesEnDeriveOption` (grain **option**,
leur lot, lignes ~274-437) et `surfacesAttendues`/`AR-G6(c)` (grain **sous-verbe** + couverture ⟺
mesure, notre lot, lignes ~34-260 et ~528-675) occupent des **plages disjointes**, aucune fonction
partagée renommée en collision, `42/42` verts.

- **Contrefactuel du lot NOTRE (fantôme dans `couverture-json.json`)**, joué en direct sur le
  fichier réel : ajout de `{ "id": "fantome-legolas-regate", "couverture": ["c-json"] }` →
  ```
  not ok 1 - CA-M16 : les identifiants du registre correspondent EXACTEMENT aux surfaces attendues …
  not ok 40 - AR-G6(c) : couverture ⟺ mesure — le registre ne peut plus déclarer ce qu'il ne mesure pas
  ```
  **Deux rouges, uniquement les nôtres** — les 15 tests `G-J2 (grain option)` restent verts (pas de
  contamination croisée). Révoqué (`git checkout -- cli/test/fixtures/couverture-json.json`),
  `git status --porcelain` vide, `42/42`.
- **Contrefactuel du lot LEUR (`--root` retiré d'un verbe qui le déclare+parse+documente)**, joué
  en direct sur `cli/src/lib/verbes.js` : retrait de `'--root <dir>'` des `options` de `add` →
  ```
  not ok 13 - G-J2 (grain option) : derivation registre <-> parse <-> doc tient pour --root sur TOUS les verbes REELS
  error: verbe(s) en dérive --root : add(déclaré=false,parsé=true,documenté=true)
  ```
  **Un seul rouge, uniquement le leur** — `CA-M16`/`AR-G6(c)` (nos gardes) restent vertes : retirer
  une option de forme n'affecte ni la liste des surfaces `--json` ni la couverture mesurée. Révoqué
  (`git checkout -- cli/src/lib/verbes.js`), `git status --porcelain` vide, `42/42`.

**Aucune garde n'en neutralise une autre** : chaque contrefactuel nomme sa cible dans son propre
périmètre, sans faire taire ni sur-déclencher l'autre lot.

## 3. `verbes.js` fusionné — les deux jeux de déclarations intacts

`git diff ba336ee..3481323 --stat -- cli/src/` :
```
cli/src/lib/verbes.js | 23 ++++++++++++++++++++++-
1 file changed, 22 insertions(+), 1 deletion(-)
```
**Identique, ligne pour ligne, au diff `18bcec0..HEAD` du gate principal** — le merge n'a fait
qu'appliquer notre patch tel quel par-dessus `ba336ee` (déjà porteur de leur lot), sans en changer
une virgule. Vérifié : les trois `sousVerbeParDefaut` (`agents→list`, `skills→deploy`,
`frame→verify`, lignes 153/169/362) et le motif `frame.guideClaudeCode` désambiguïsé (ligne 378)
sont présents et byte-identiques à ce qu'a gaté le rapport principal. Les déclarations de leur lot
— `--root <chapeau>` sur `config`/`go`/`brief`/`recap`, `--root <dir>` sur `assemble`, `--project
<nom>` sur `observe` — relues directement dans le fichier fusionné : **toutes présentes**,
aucune n'a été écrasée par notre patch (attendu : les deux lots touchent des **plages différentes**
du même fichier, le merge textuel automatique n'a eu aucune zone de recouvrement à arbitrer).

## 4. `docs/commandes.md`

`git diff ba336ee..3481323 --stat -- docs/commandes.md` : **sortie vide** — rien de notre lot n'y
était dû (confirmé au gate principal), et le merge ne l'a pas touché non plus. `guide-doc-a-jour.test.js`
(`6/6`, garde de cohérence doc↔registre) reste vert après merge.

## Écarts

Aucun écart nouveau. Les écarts non bloquants nº 1-2 du gate principal (portée du contrefactuel
CA-G8 ; ligne `REVIEW_PROPOSAL_ID` altérée) restent valables tels quels, inchangés par le merge
(fichiers concernés non touchés par `ba336ee..3481323` côté `guard-json-output.test.js` au-delà de
ce qui était déjà gaté). L'écart nº 3 (« `main` a avancé pendant le gate ») est **soldé** par ce
re-gate : la branche est désormais à jour avec `main` (`ba336ee`), intégrée par Aragorn.

## Jalon

`FAIL` : n/a. **`PASS`** — le récepteur est l'étape suivante (stage). Gate franchi sans humain.
