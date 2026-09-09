# Le registre de couverture C-JSON au grain SOUS-VERBE

> Lot : `REGISTRE-GRAIN-SOUS-VERBE`. Successeur nommé de `C-JSON-COUVERTURE-COMPLETE`
> (J0→J3 tous gatés PASS, `docs/qualite/gate-c-json-j3.md`, 1263 tests, cliquet `0`), dont
> l'arbitrage **AR-J1** a retenu l'option **(b)** — grain sous-verbe pour `NOMINAL`/`ERRORS`,
> grain **verbe** pour le registre — en nommant explicitement l'option **(c)** comme
> « le bon état final, mais un lot à lui seul » (`c-json-couverture-complete.md:259-264`).
> **Ce lot est ce lot-là.**
>
> Cadré par 🔵 Gandalf le 2026-09-09. **Instruction — aucun code n'a été écrit ni exécuté ici.**

---

## 0. Ce qui a été mesuré le 2026-09-09

### 0.1 — Instruments, et leur limite déclarée

**Je n'ai pas de shell.** Ce cadrage est une **lecture statique de fichiers** (`Read`, `Grep`) :
aucune commande lancée, aucun test joué, aucun `node`. Tout chiffre du § 0 est donc une lecture
de source, **jamais** une mesure d'exécution — et doit être **confirmé ou infirmé** par l'étape 0
de ⚒️ Gimli (§ 5) avant qu'une ligne ne soit écrite.

La règle du dépôt vaut ici comme au lot parent : **là où ma lecture et l'exécution de Gimli
divergent, l'exécution gagne**, et la divergence est notée au rapport de remise.

Aucun fait externe (web) n'a été vérifié : ce lot ne dépend d'aucune version, d'aucune
bibliothèque tierce, d'aucun état de l'art. Le CLI est à zéro dépendance runtime, le registre de
couverture est un artefact **interne** au dépôt, l'arbitrage est un arbitrage de **discipline
interne**. Il n'y avait rien de dehors à aller chercher — et je le déclare plutôt que de le
laisser supposer.

### 0.2 — Les faits d'exécution hérités, attribués

- **Gate J3 (🏹 Legolas, 2026-09-09, `docs/qualite/gate-c-json-j3.md`)** : suite complète
  `tests 1263, pass 1262, fail 0, skipped 1` ; `guard-json-output.test.js` **63** tests ;
  `guard-json-couverture.test.js` **18** tests ; `couverture-json.json` à **29** entrées,
  `horsCouvertureCount: 0`, aucune entrée `hors-couverture`.
- **Angle mort constaté et non fermé (même gate, `gate-c-json-j3.md:145-163`)** : G-J1 dérive
  la couverture **par lecture du texte** de `guard-json-output.test.js` ; une entrée
  `NOMINAL`/`ERRORS` **neutralisée par `//`** continue d'être comptée comme couvrante. Déclaré
  non bloquant, **non corrigé**. Ce lot **n'y touche pas** (§ 4, Exclu) mais **en aggrave
  l'exposition** (§ 7, R-G5) — il faut le dire.

Je cite ces mesures **comme mesures d'autrui**, datées et attribuées ; je ne les rejoue pas.

### 0.3 — Le fait central : le grain sous-verbe de G-J1 est aujourd'hui une FICTION

C'est le constat qui commande tout le lot, et il n'était pas dans la commande.

`guard-json-couverture.test.js:361-370` compare les invocations **attendues**
(`invocationsAttendues`, l.344-359 — grain sous-verbe) aux invocations **couvertes**
(`invocationsCouvertesReelles`, l.330-342). Mais le filtre final porte un **repli** :

```js
const manquantes = attendues.filter((a) => !couvertes.has(a.id) && !couvertes.has(a.verbId));
```

Or `invocationsCouvertesReelles` ajoute **systématiquement** le verbe nu au jeu couvert
(`couvertes.add(verbe)`, l.338) pour **chaque** entrée du tableau. Conséquence mécanique :
**dès qu'UN sous-verbe d'un verbe est mesuré, TOUS ses sous-verbes sont réputés couverts.**
`memory init` couvre `memory add`. `produit list` couvre `produit remove`. `review list` couvre
`review apply`.

Ce repli a une raison légitime et écrite (l.364-367) : la forme **nue** de `skills` **est** le
sous-verbe `deploy` — la garde ne devait pas exiger une invocation `skills deploy` qui n'existe
pas au CLI. Mais **le remède couvre bien plus que sa cause** : posé pour un cas d'alias, il
désarme le grain sur les **huit** verbes à sous-verbes.

**Conséquence directe pour ce lot** : `horsCouvertureCount: 0` est vrai **au grain verbe** et
**faux au grain sous-verbe**. Ce lot ne « change pas une unité de compte » — il **cesse de faire
dire à un cliquet à zéro ce qu'il ne mesure pas**.

### 0.4 — Le décompte, tel que la source le déclare

*(Lecture statique — **à confirmer par l'étape 0**, § 5.)*

**Huit** verbes portent des `sousVerbes` non vides dans `cli/src/lib/verbes.js` :

| Verbe | l. | sous-verbes | dont déclarant `--json` |
|---|---|---|---|
| `agents` | 143-148 | `list`, `affect`, `fullteam`, `status` | **2** (`list`, `status`) |
| `skills` | 157-159 | `deploy` | **1** |
| `models` | 168-190 | `set`, `unset` | **2** |
| `frame` | 340-347 | `verify`, `lint`, `new`, `use` | **4** |
| `memory` | 378-386 | `init`, `path`, `config`, `list`, `add`, `replace`, `remove` | **7** |
| `produit` | 396-404 | `init`, `path`, `config`, `list`, `add`, `replace`, `remove` | **7** |
| `review` | 442-448 | `list`, `show`, `apply`, `reject`, `auto` | **5** |
| `observe` | 464-466 | `list` | **1** |
| | | **total** | **29** |

Les **29** entrées actuelles du registre se décomposent en **21** verbes **sans** sous-verbes +
**8** verbes **à** sous-verbes. Le passage au grain sous-verbe donne donc, dans sa forme
exclusive : **21 + 29 = 50 entrées** (et **58** si les 8 formes **nues** comptent chacune pour une
entrée de plus — c'est l'objet d'**AR-G2**).

### 0.5 — Les trous que ce grain rend visibles

En confrontant les **50** invocations attendues aux tableaux `NOMINAL` (l.184-249) et `ERRORS`
(l.334-361) de `guard-json-output.test.js`, **sans** le repli `verbId` :

| Invocation attendue | Entrée `NOMINAL`/`ERRORS` ? | Nature |
|---|---|---|
| les **21** verbes sans sous-verbes | **oui**, tous | — |
| `agents list`, `agents status` | oui | — |
| `models set`, `models unset`, `models` (nu) | oui | — |
| `frame verify`, `frame lint`, `frame new`, `frame use` | oui | fermés en J3 |
| `memory init`, `memory path`, `memory config`, `memory list` | oui | — |
| `produit path`, `produit config`, `produit list` | oui | — |
| `review list`, `review show`, `observe list` | oui | — |
| **`memory add`**, **`memory replace`**, **`memory remove`** | **non** | écrivains du canon |
| **`produit init`**, **`produit add`**, **`produit replace`**, **`produit remove`** | **non** | écrivains du canon projet |
| **`review apply`**, **`review reject`**, **`review auto`** | **non** | écrivains du réservoir |
| `skills deploy` | **non** — mais `skills` **nu** EST `deploy` | **alias**, pas un trou |

**Dix trous réels**, un cas d'alias. Ces dix invocations sont **précisément** celles que le § 5
étape 6 du cadrage parent **nommait** (`c-json-couverture-complete.md:445-447` : « `memory
add/replace/remove`, `produit init/…/remove`, `review apply/reject/auto` ») et que la livraison J2
**n'a pas faites** — le repli `verbId` a empêché G-J1 de le voir, exactement comme il avait laissé
passer `frame new`/`frame use` jusqu'à ce que J3 les trouve **par hasard** en écrivant la garde.

**C'est le même défaut, une seconde fois, sur dix invocations au lieu de deux.**

### 0.6 — Ce que ce lot NE rouvre PAS : l'arbitrage gelé de `verbes.js:349-357`

La commande annonce que la chute de l'arbitrage de grain sur `frame` est « la conséquence
attendue » de ce lot. **La lecture dit autre chose, et il faut le poser franchement.**

Le commentaire `verbes.js:349-357` et le `motif` de `frame.guideClaudeCode` (l.357) ne parlent
**pas** de `couverture-json.json`. Ils parlent de **`guideClaudeCode`** — la décision de
couverture du **Lot B**, c.-à-d. *quels verbes reçoivent une entrée `iaka-<verbe>.md` générée
dans le kit Claude Code* (`verbes.js:24-30`, générateur `cli/scripts/gen-iaka-commands.mjs`,
gardes G5c de `cli/test/guard-verbes-registre.test.js:96-145`). « Le registre ne permet
aujourd'hui une couverture QUE par verbe » y désigne le champ `guideClaudeCode`, **pas** le
registre de couverture C-JSON.

Ce sont **deux registres, deux consommateurs, deux jeux de gardes**. Rendre
`couverture-json.json` sous-verbé ne fait **rien** tomber côté `guideClaudeCode` : il n'existe
aucun champ `guideClaudeCode` par sous-verbe, aucun générateur capable d'émettre
`iaka-frame-verify.md`, et G5c exige aujourd'hui **une entrée par verbe `generer:true`**.

**Le cadrage parent a conflaté les deux** (`c-json-couverture-complete.md:259` : « rouvre
l'arbitrage gelé `verbes.js:349-357` ») — c'est l'unique raison pour laquelle la commande de ce
lot attend cette chute. Je la nomme comme une **erreur de lecture héritée**, pas comme une
promesse à tenir. → **AR-G5**.

Ce que ce lot **doit** faire de cet arbitrage : sa condition de chute est écrite « **chute le jour
où le registre porte une granularité par sous-verbe** ». Après ce lot, un lecteur pressé la croira
remplie. La laisser telle quelle, c'est laisser une **condition de chute ambiguë** — donc une
condition qui se déclenchera sur le mauvais fait, ou jamais. Elle se **désambiguïse en place**,
dans ce lot, en une ligne de prose. C'est tout.

---

## 1. Problème

Le registre de couverture C-JSON (`cli/test/fixtures/couverture-json.json`) compte au **grain
verbe**. Le risque, lui, vit au **grain sous-verbe** : `memory` a 7 sous-verbes, `produit` 7,
`review` 5, `frame` 4. Un verbe « couvert » peut avoir six sous-verbes que rien ne mesure.

Ce n'est pas une gêne théorique. La garde de complétude G-J1, censée tenir le grain fin, porte un
**repli** (`!couvertes.has(a.verbId)`, `guard-json-couverture.test.js:368`) qui fait qu'**un seul
sous-verbe mesuré absout tous les autres**. Résultat mesurable : **dix** invocations déclarant
`--json` — les écrivains de `memory`, `produit` et `review` — n'ont **aucune** entrée
`NOMINAL`/`ERRORS`, et le cliquet affiche pourtant **`horsCouvertureCount: 0`**.

**Un cliquet à zéro qui ne mesure pas ce qu'il prétend mesurer est pire qu'un cliquet à 14 :** le
premier ferme le sujet, le second le tient ouvert. Le lot parent avait explicitement choisi de
laisser cet état (AR-J1(b)) et de le **nommer** comme successeur. Ce lot le solde.

---

## 2. Décision retenue

**Ce lot ferme un trou de MESURE, pas un trou de comportement.** Aucune sortie de verbe ne change,
ni machine ni humaine. Trois engagements en découlent, à tenir fermement.

> **(a) Le lot est un lot de REGISTRE et de GARDES.** Le code de production n'est touché que par
> des **données déclaratives** de `cli/src/lib/verbes.js` (un champ `sousVerbeParDefaut`, une
> reformulation de `motif`) — **aucune fonction, aucune sortie, aucun format**. Toute autre
> écriture dans `cli/src/` est **hors périmètre** et se remonte à 🔵 Gandalf. Aucune retouche de
> confort, aucune harmonisation de champs, aucun renommage de clé.

> **(b) Le registre reste MOTIVÉ, jamais muet, et jamais écrit en dur.** La liste des entrées
> attendues reste **DÉRIVÉE de `verbes.js` par le test** (doctrine `verbes.js:8-10` : « un nombre
> dupliqué à la main finit toujours par mentir »). Chaque entrée `hors-couverture` porte un
> **motif** écrit. La leçon du dépôt s'applique telle quelle : *le défaut n'est pas la liste, c'est
> son mutisme.*

> **(c) La refonte ne doit pas pouvoir MASQUER un trou — et doit le prouver dans les deux sens.**
> Un changement de grain qui ferait passer un compte de 29 à 50 en gardant `0` sans rien mesurer de
> plus serait exactement le mensonge qu'on prétend corriger. Le lot pose donc une garde qui rend le
> mensonge **impossible** : `couverture: ["c-json"]` ⟺ **présence réelle** dans `NOMINAL`/`ERRORS`
> (AR-G6). Après quoi le cliquet **cesse d'être une déclaration** pour devenir un **constat
> mécanique**.

Et le corollaire qui suit de (c), énoncé d'avance pour qu'il ne soit pas une surprise au gate :
**si les dix trous ne sont pas fermés dans ce lot, le cliquet REMONTE à 10** — mécaniquement, pas
par choix. C'est l'objet d'**AR-G4**, et c'est le seul arbitrage d'**engagement** du lot.

---

## 3. Arbitrages — ce que je ne tranche pas seul

Six arbitrages. Chacun porte ses options, son coût et ma **recommandation**. Deux sont
**réservés au décideur** et signalés comme tels.

### AR-G1 — Forme de la fixture : entrées plates ou imbriquées ?

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| **(a) Plates** — `{ "id": "memory add", "couverture": [...] }` | 50 entrées au même niveau ; le test compare **deux listes de chaînes triées**, exactement comme le test 1 actuel (`guard-json-couverture.test.js:35-43`) ; diff git à plat, lisible ligne à ligne | l'`id` contient un espace, ce qui n'est jamais le cas dans `verbes.js` : il faut **déclarer le séparateur** comme canonique |
| (b) Imbriquées — `{ "id": "memory", "sousVerbes": [ { "id": "add", … } ] }` | épouse la forme de `verbes.js` | **duplique la structure** de `verbes.js` dans une fixture (le défaut que ce registre existe pour éviter) ; les 3 tests CA-M16 doivent parcourir deux niveaux ; oblige à répondre partout à « le verbe porte-t-il **lui-même** une couverture ? », y compris là où la réponse n'a pas de sens |
| (c) Deux fichiers (verbes / sous-verbes) | séparation nette | deux cliquets, deux fidélités à tenir : on double la surface pour un gain nul |

> **Recommandation : (a).** Et le séparateur n'est **pas un vocabulaire neuf** : la chaîne
> `"<verbe> <sousVerbe>"` (un espace) est **déjà** celle que G-J1 construit
> (`guard-json-couverture.test.js:339`, `couvertes.add(\`${verbe} ${second}\`)`) et **déjà** celle
> que `NOMINAL` emploie comme nom affiché (`'memory init'`, `'frame verify'`,
> `guard-json-output.test.js:193, 219`). Le lot **adopte** l'identifiant qui existe, il n'en
> invente pas.

### AR-G2 — Un verbe à sous-verbes qui déclare LUI-MÊME `--json` compte-t-il pour une entrée de plus ?

Les **8** verbes à sous-verbes portent tous `--json` dans leur `options` de premier niveau. Leur
forme **nue** (`iakaframe memory --json`, sans action) est-elle une surface de contrat ?

Les faits connus divergent d'un verbe à l'autre : `models` **nu** a une entrée `NOMINAL`
(`guard-json-output.test.js:231`) et un comportement propre **mesuré** à l'étape 0 du lot parent
(`docs/qualite/mesures-etape-0-lot-C-JSON.md:30`) ; `skills` **nu** **est** le sous-verbe `deploy`
(`guard-json-couverture.test.js:364-367`) ; `observe` **nu** **écrit le store** (`verbes.js:461-466`)
et n'est mesuré par rien ; pour `agents`, `frame`, `memory`, `produit`, `review`, ma lecture
suppose une erreur d'usage — **et une supposition n'est pas une mesure**.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) Toujours — 58 entrées | exhaustif, uniforme | crée jusqu'à 6 entrées pour des invocations qui ne sont **que** des erreurs d'usage : on met sous contrat un message d'erreur |
| **(b) Seulement si l'étape 0 mesure un comportement PROPRE** (ni erreur d'usage, ni alias d'un sous-verbe) | le compte est **dérivé d'une mesure**, pas d'une convention ; `observe` nu (écrivain réel, non mesuré) **entre** ; `skills` nu est déclaré **alias** (AR-G3) ; les erreurs d'usage n'entrent pas | il faut mesurer les 8 avant d'écrire la fixture — c'est **le cœur de l'étape 0** |
| (c) Jamais — 50 entrées, grain sous-verbe exclusif | le plus simple | **fait disparaître `observe` nu du registre** alors qu'il écrit et déclare `--json` : la refonte **créerait** un trou. Exactement ce que le § 2(c) proscrit |

> **Recommandation : (b).** C'est la seule option où le compte final (**50, 51, 52…**) est un
> **résultat** et non une convention — et la seule qui ne perde pas `observe` nu en route. Ma
> prédiction de lecture, **à infirmer** : comportement propre pour `models` et `observe` ; alias
> pour `skills` ; erreur d'usage pour `agents`, `frame`, `memory`, `produit`, `review` → **52
> entrées**. Si l'étape 0 dit autre chose, **l'étape 0 gagne** et le chiffre change sans que ce
> cadrage soit rouvert.

### AR-G3 — Comment remplacer le repli `verbId`, qui rend le grain fictif ?

Le repli (`guard-json-couverture.test.js:368`) doit **tomber** — sinon le lot ne change rien
(§ 0.3). Mais sa **cause légitime** (`skills` nu **est** `deploy`) doit être servie autrement.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) Garder le repli | zéro travail | **annule le lot** : le grain resterait une fiction |
| **(b) Déclarer l'alias dans `verbes.js`** : `sousVerbeParDefaut: 'deploy'` sur le verbe concerné ; la garde **dérive** l'exception au lieu de la supposer | le fait « la forme nue dispatche vers X » est une **propriété de forme du CLI** — sa place est au registre de forme ; une fois déclaré, il est **dérivé**, jamais réécrit dans un test | ajoute un champ **de données** à `verbes.js` (aucune fonction, aucun comportement) ; ce champ n'est lu que par les gardes — sa **véracité** repose sur la mesure de l'étape 0, pas sur une garde d'exécution (**déclaré comme tel**, § 8 CA-G7) |
| (c) Liste d'alias motivée dans le fichier de test | ne touche pas à `cli/src/` | ré-institue une liste écrite à la main **à côté** de sa source — le défaut nommé au § 2(b) |

> **Recommandation : (b).** C'est la doctrine du dépôt appliquée à la lettre : l'autorité de forme
> du CLI est `verbes.js`, pas un test. **Repli acceptable : (c)**, si le décideur refuse toute
> écriture dans `cli/src/` — à condition que la liste porte **un motif écrit par entrée** et un
> **témoin négatif** (retirer l'alias ⇒ `skills deploy` remonte comme non couvert).

### AR-G4 — Le cliquet remonte-t-il à 10, ou le lot ferme-t-il les dix trous ? — ⚠️ **RÉSERVÉ AU DÉCIDEUR**

> ✅ **TRANCHÉ par le décideur le 2026-09-09 : option (b)** — grain + fermeture des dix trous dans ce lot, cliquet maintenu à 0 et vrai. L'étape 5 est donc **incluse** au périmètre. (Transmis par Aragorn ; étape 0 dispatchée à Gimli le même jour.)

Une fois AR-G6 posé, le compte de `hors-couverture` n'est plus déclaratif : il **tombe** de la
mesure. Les dix invocations du § 0.5 sont donc, mécaniquement, **dix `hors-couverture` motivés**
— sauf si le lot les ferme.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) **Grain seul** : cliquet **0 → 10**, chaque entrée motivée, successeur nommé | lot court (**≈ 1,25 j**) ; la vérité est **dite** immédiatement | **un cliquet qui remonte** — geste rare et qui se justifie, mais qui laisse la promesse « 29 verbes prouvés » à moitié fausse pendant un lot de plus. Et le dépôt a **déjà** payé deux fois cette dette (14 → 9 → 0, puis ici) |
| **(b) Grain + fermeture des dix** : cliquet reste **0**, mais **vrai** cette fois | la promesse est tenue **en entier** ; le lot ferme ce qu'il révèle | **≈ 2 à 2,5 j**. ~10 invocations neuves dans `guard-json-output.test.js` |
| (c) Grain + liste blanche pour les dix | pragmatique | une liste blanche **est** un `hors-couverture` qui a changé de nom (verdict déjà rendu en AR-J5 du lot parent) |

> **Recommandation : (b)** — et le surcoût est **plus faible qu'il n'en a l'air**, parce que les
> trois bacs à sable existent **déjà**, montés, dans le fichier :
> `HOME` (`guard-json-output.test.js:53`) sert déjà `memory init/path/config/list` ;
> `PROJ` (l.56) sert déjà `produit path/config/list` ;
> `REVIEW_HOME` (l.85-94) porte déjà **une proposition réelle**, produite par le pipeline `close`,
> et sert déjà `review show`. On **étend un patron**, on n'en invente aucun.
> **C'est néanmoins un arbitrage d'ENGAGEMENT (±0,75 j) : il appartient au décideur**, pas à
> l'agent. (a) est **honorable** — à condition que les dix motifs nomment le successeur, comme le
> lot `CONTRAT-MACHINE-DU-VERBE-INSTALL` l'avait fait pour ses quatorze.

### AR-G5 — La chute de `frame.guideClaudeCode` : dans le lot, ou successeur ? — ⚠️ **partiellement RÉSERVÉ AU DÉCIDEUR**

Cf. § 0.6 : l'arbitrage gelé porte sur **`guideClaudeCode`** (les entrées `iaka-<verbe>.md` du kit
Claude Code), **pas** sur `couverture-json.json`. Le faire chuter suppose : un `guideClaudeCode`
**par sous-verbe** dans `verbes.js`, un générateur capable d'émettre des entrées de kit
sous-verbées (`cli/scripts/gen-iaka-commands.mjs`), les gardes G5c/GC de
`guard-verbes-registre.test.js:96-145, 198-217` réécrites, et **4 fichiers de kit neufs** à
maintenir.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) Faire chuter l'arbitrage dans ce lot | la commande est prise au mot | **change de sujet** : générateur + kit + 3 gardes + surface produit. C'est un lot entier, et il ne touche **ni** le registre C-JSON **ni** sa garde |
| **(b) Successeur nommé + désambiguïsation du motif EN PLACE** (une ligne : préciser que « le registre » y désigne `guideClaudeCode`, pas `couverture-json.json`) | le motif cesse d'être ambigu ; sa condition de chute redevient **vérifiable** ; le successeur est écrit au BACKLOG | il faut **résister** à une chute qui semblait acquise — d'où cet arbitrage |
| (c) Ne rien faire | gratuit | laisse une condition de chute que ce lot rend **fausse-vraie** : le prochain lecteur croira la condition remplie et fera chuter l'arbitrage **sur le mauvais fait** |

> **Recommandation : (b).** Successeur : **`GUIDE-CLAUDE-GRAIN-SOUS-VERBE`**.
> Le motif reformulé doit conserver la forme « **chute si …** » exigée par la garde `GC`
> (`guard-verbes-registre.test.js:190, 198-217` — un motif sans condition de chute est compté
> **non déclaré** et son verbe est **nommé**).
> **Réservé au décideur** : *faut-il, sur le fond, ouvrir des entrées de kit par sous-verbe ?*
> C'est une décision de **surface produit** (ce que l'utilisateur voit dans ses `/iaka-*`), pas une
> décision technique — elle ne se prend pas dans un lot de gardes.

### AR-G6 — `couverture` reste-t-il écrit à la main, dérivé, ou GARDÉ ?

Aujourd'hui, `couverture: ["c-json"]` est **écrit à la main** dans la fixture, tandis que G-J1
dérive la couverture réelle du **texte** de `guard-json-output.test.js`. **Deux sources, aucune
garde entre elles** : une entrée marquée `c-json` sans aucune invocation passe **verte**. C'est le
canal exact par lequel la refonte pourrait masquer un trou.

| Option | Ce que ça donne | Coût / risque |
|---|---|---|
| (a) Statu quo (écrit à la main) | zéro travail | **le mensonge reste possible**, et la surface passe de 29 à ~52 lignes : on multiplie les occasions |
| (b) Entièrement **dérivé** : la fixture ne porte plus que les `hors-couverture` motivés + le cliquet | le plus pur | le registre cesse d'être **lisible** comme inventaire ; on perd l'artefact que le décideur ouvre pour voir l'état, au profit d'un calcul |
| **(c) Écrit à la main, mais GARDÉ** : un test exige `couverture ∋ "c-json"/"c-json-erreur"` **⟺** présence réelle dans `NOMINAL`/`ERRORS` | la liste reste lisible **et** le mensonge devient impossible ; le cliquet cesse d'être une déclaration pour devenir un **constat** | une garde de plus, avec ses deux témoins |

> **Recommandation : (c).** C'est la seule qui serve les deux exigences du § 2 en même temps
> (registre **motivé et lisible**, refonte **incapable de masquer**). Elle a un effet de bord
> heureux : elle rend **AR-G4(a) honnête** (les dix trous **apparaîtront** en `hors-couverture`,
> qu'on le veuille ou non) et **AR-G4(b) prouvable** (le `0` final sera un constat, pas une
> affirmation).

---

## 4. Périmètre

### Inclus

1. **La mesure d'exécution de l'étape 0** (§ 5), consignée dans
   `docs/qualite/mesures-etape-0-registre-grain-sous-verbe.md` — c'est **elle** qui fait autorité,
   pas le § 0 de ce cadrage.
2. **`cli/test/fixtures/couverture-json.json`** — passage au grain sous-verbe (AR-G1(a) : ids
   plats `"<verbe> <sousVerbe>"`), `_lisezMoi` **réécrit** (il grave aujourd'hui AR-J1(b), qui
   **cesse d'être vrai**), `horsCouvertureCount` recalculé selon AR-G4.
3. **`cli/test/guard-json-couverture.test.js`** — **une seule** fonction de dérivation, utilisée
   par le test de fidélité du registre **et** par G-J1 ; retrait du repli `verbId` (AR-G3) ; garde
   `couverture ⟺ mesure` (AR-G6(c)) ; contrefactuels du § 8. **Les gardes G-J2 (verbe et grain
   option, l.72-241) et la garde de la règle 6 (l.243-280) restent INCHANGÉES** : elles dérivent
   de `verbes.js`, jamais de la fixture.
4. **`cli/src/lib/verbes.js`** — **données seules** : `sousVerbeParDefaut` (AR-G3(b)) et le
   `motif` de `frame.guideClaudeCode` désambiguïsé (AR-G5(b)). **Aucune fonction, aucune sortie,
   aucun format.**
5. **`cli/test/guard-json-output.test.js`** — **uniquement si AR-G4 = (b)** : ~10 invocations
   ajoutées à `NOMINAL`/`ERRORS`, sur les bacs à sable **existants**. Les invocations
   préexistantes restent **intactes, octet pour octet**.
6. **`specs/instructions/registre-grain-sous-verbe.md`** — la présente instruction : un lot
   contient sa propre instruction, et toute correction apportée en cours de route s'y écrit.
7. **`BACKLOG.md`** — récit de fin de lot et successeurs, écrits **après** réception du gate PASS,
   **jamais en anticipation** (écart nº 1 de `docs/qualite/gate-c-json-j3.md:248-259`).

### Exclu — décisions, pas oublis

| Exclu | Motif | Successeur |
|---|---|---|
| **Faire chuter `frame.guideClaudeCode`** et générer des entrées de kit par sous-verbe | Autre registre, autre consommateur, autres gardes (§ 0.6). Le motif est **désambiguïsé** ici, pas exécuté | **`GUIDE-CLAUDE-GRAIN-SOUS-VERBE`** |
| **La dette `--root`/`--path`/`--project`** (`config`, `go`, `brief`, `recap`, `assemble`, `switch`, `observe`, `repo` déclarent/parsent/documentent en désaccord) | Sans rapport avec le grain ; dette pré-existante confirmée au gate J3 (`gate-c-json-j3.md:198-205`) | **`REGISTRE-OPTIONS-ROOT-PATH-PROJET`** |
| **Donner `--json` à un verbe qui ne le déclare pas** | Ce lot **mesure** une promesse existante, il n'en fait pas de nouvelle | **`C-JSON-EXTENSION`** |
| **Harmoniser les noms de champs entre verbes** (`projets`/`projects`, `essais`/`services`…) | Toute renomination casse un consommateur | **`C-JSON-VOCABULAIRE`** |
| **Fermer l'angle mort de G-J1 sur une entrée neutralisée par `//`** | Constaté et déclaré non bloquant au gate J3 (`gate-c-json-j3.md:145-163, 260-264`). Le fermer suppose un parsing JS (AST) au lieu d'une lecture de texte : autre nature de garde | **`G-J1-ENTREE-NEUTRALISEE`** — et cf. **R-G5**, ce lot **augmente l'exposition** sans changer la nature du risque |
| **Toute modification de sortie, machine ou humaine** | Aucune n'est requise ; les 23 témoins de `temoins-prose.test.js` restent verts et **non retouchés** | — |
| **Toute écriture dans `iakaInstall` / `IakaCockpit`** | Autres dépôts ; aucun ne consomme la fixture ni `--json` (§ 0.5 du lot parent) | — |
| **Corriger `models` nu** (`count` mesuré sur `targets` à l'étape 0 du lot parent, `roles.length` selon `guard-json-output.test.js:228-231`) | Écart de **documentation d'une mesure**, pas de comportement ; hors grain | à relever si un rouge apparaît |

---

## 5. Étapes d'implémentation, ordonnées

### Étape 0 — Mesurer, AVANT d'écrire une ligne (⚒️ Gimli, obligatoire et bloquante)

**Je n'ai pas de shell (§ 0.1).** Ces mesures sont **dues**, et leurs sorties **citées** dans le
rapport de remise et dans `docs/qualite/mesures-etape-0-registre-grain-sous-verbe.md`.

**0.a — Le dépôt est vert AVANT toute modification** (le point de comparaison).

```bash
cd /Users/sjupin/work/iakaframe/cli && node --test test/
# attendu (gate J3) : tests 1263, pass 1262, fail 0, skipped 1
```

**0.b — Le décompte du grain, DÉRIVÉ de `verbes.js` (jamais compté à la main).**

```bash
cd /Users/sjupin/work/iakaframe/cli && node -e "
import('./src/lib/verbes.js').then(({ VERBES }) => {
  const d = (o) => Array.isArray(o.options) && o.options.includes('--json');
  const sans  = VERBES.filter((v) => !(v.sousVerbes||[]).length && d(v)).map((v) => v.id);
  const sv    = VERBES.flatMap((v) => (v.sousVerbes||[]).filter(d).map((s) => v.id + ' ' + s.id));
  const nus   = VERBES.filter((v) => (v.sousVerbes||[]).length && d(v)).map((v) => v.id);
  console.log('sans sous-verbes :', sans.length, '| sous-verbes declarants :', sv.length, '| formes nues a arbitrer :', nus.length);
  console.log(JSON.stringify({ sans, sv, nus }, null, 1));
});"
# attendu (ma LECTURE, § 0.4 — a infirmer) : 21 | 29 | 8
```

**0.c — Les 8 formes NUES, classées PAR EXÉCUTION (AR-G2(b)).** Pour chacun de `agents`,
`skills`, `models`, `frame`, `memory`, `produit`, `review`, `observe` : exécuter
`node src/index.js <verbe> --json <redirection en bac à sable>`, **citer le stdout**, et classer
en **une** des trois cases :

- **comportement propre** (une charge C-JSON qui lui est propre) → **entrée au registre** ;
- **alias d'un sous-verbe** (la forme nue dispatche vers un sous-verbe) → **pas d'entrée**, et
  l'alias se **déclare** via `sousVerbeParDefaut` (AR-G3(b)) ;
- **erreur d'usage** (`{ok:false,error}`, exit 1) → **pas d'entrée**.

Prédiction de lecture à infirmer : propre pour `models` et `observe` ; alias pour `skills` ;
erreur d'usage pour les cinq autres.
⚠️ `observe` **nu écrit le store** : bac à sable `--home <tmp>` **obligatoire**.

**0.d — Les dix trous, confirmés ou infirmés (§ 0.5).** Pour chacun de `memory add/replace/remove`,
`produit init/add/replace/remove`, `review apply/reject/auto` : confirmer l'**absence** de toute
entrée `NOMINAL`/`ERRORS`, puis l'**exécuter** en bac à sable et enregistrer racine objet,
`ok` en 1ʳᵉ clé, `count` juste sur les collections, `stderr` vide, code de sortie.

**0.e — Le repli `verbId`, mesuré des deux côtés (le fait central, § 0.3).** Dans un **script
jetable** (jamais un test committé), calculer les invocations manquantes **avec** puis **sans**
le repli `!couvertes.has(a.verbId)` de `guard-json-couverture.test.js:368`. Citer les **deux**
listes.
**Attendu par ma lecture : `[]` avec le repli, 10 entrées + `skills deploy` sans.** Si l'écart
mesuré n'est pas celui-là, **ARRÊTER et remonter à 🔵 Gandalf** : le § 0.3 est le fait sur lequel
tout ce cadrage repose.

> **Règle d'arrêt, non négociable.** Toute mesure qui contredit le § 0 ⇒ **ARRÊT** et retour à
> 🔵 Gandalf. Une instruction assise sur un fait faux se **re-cadre**, elle ne s'exécute pas.

### Étape 1 — Poser la dérivation UNIQUE (le cœur du lot)

Dans `guard-json-couverture.test.js`, remplacer les deux dérivations qui coexistent
(`declareJson` + ids du registre, l.29-43 ; `invocationsAttendues`, l.344-359) par **une seule**
fonction — `surfacesAttendues(VERBES)` — rendant la liste des identifiants plats
`"<verbe>"` | `"<verbe> <sousVerbe>"` selon AR-G1(a)/AR-G2(b), et **l'utiliser aux deux endroits**
(fidélité du registre **et** G-J1). C'est cette unicité qui garantit qu'un registre et une garde
**ne peuvent plus diverger** (→ CA-G2).

### Étape 2 — Déclarer les alias de forme nue (AR-G3(b))

Ajouter `sousVerbeParDefaut: '<id>'` dans `verbes.js` aux verbes classés **alias** en 0.c
(attendu : `skills` → `'deploy'`). La dérivation de l'étape 1 le **consomme** ; le repli
`!couvertes.has(a.verbId)` **disparaît**. Vérifier que `guard-verbes-registre.test.js` (18 tests)
reste vert : il n'inspecte pas ce champ, mais il **balaie** le registre.

### Étape 3 — Refondre la fixture

Réécrire `couverture-json.json` au grain sous-verbe. `_lisezMoi` **réécrit** : il grave
aujourd'hui « grain VERBE tenu par arbitrage AR-J1(b) » — **faux après ce lot**. Il doit dire le
grain neuf, le séparateur canonique, la règle « `couverture` ⟺ mesure » (AR-G6), et **rappeler
que le compte est dérivé de `verbes.js` par le test, jamais écrit en dur ici**.

### Étape 4 — Poser la garde `couverture ⟺ mesure` (AR-G6(c))

Un test qui, pour **chaque** entrée du registre : `couverture` contient `c-json`/`c-json-erreur`
**⟺** l'identifiant est présent dans les invocations dérivées du texte de
`guard-json-output.test.js`. Et : `hors-couverture` **⟺** absent. Le cliquet
(`guard-json-couverture.test.js:61-70`) devient dès lors un **constat** et non plus une
déclaration.

### Étape 5 (si AR-G4 = (b)) — Fermer les dix trous, en bac à sable

Étendre `NOMINAL`/`ERRORS` sur les bacs à sable **existants** — aucun bac neuf n'est requis :

- `memory add/replace/remove` → `--home <HOME>` (l.53), déjà peuplé par `memory init`. Chaque
  invocation cible **sa propre entrée** : `add` crée, `replace` révise, `remove` retire — jamais
  la même clé, pour que l'ordre des tests ne les couple pas (patron `models set`/`unset`,
  l.135-141).
- `produit init/add/replace/remove` → `--project <PROJ>` (l.56). ⚠️ `produit init` écrit
  `specs/canon/PRODUIT.md` **dans le projet jetable** — vérifier qu'il ne remonte pas au dépôt.
- `review apply/reject/auto` → `--home <REVIEW_HOME>` (l.85-94), qui porte **déjà** une
  proposition réelle produite par `close`. Les trois sous-verbes **mutent le statut** d'une
  proposition : il en faut **trois distinctes** (ou trois canons), sinon le premier test rend les
  deux autres non déterministes. ⚠️ `review apply` **matérialise** dans une bibliothèque : passer
  `--library <tmp>` est **obligatoire** (R-G2).

Étendre le `test.after()` de nettoyage (l.379-385) à tout bac à sable neuf. **Aucune écriture hors
`mkdtempSync`.**

### Étape 6 — Contrefactuels, dans les deux sens

Cf. § 8 (CA-G4, CA-G5, CA-G6). Chacun est **joué**, **révoqué**, et **cité** au rapport de remise ;
ceux qui peuvent l'être vivent comme **tests synthétiques committés** (sondes en mémoire, jamais
d'écriture sur le disque — patron `guard-json-couverture.test.js:121-137, 372-378`).

### Étape 7 — Non-régression et remise

Rejouer `node --test test/` (tout vert), vérifier `git status --porcelain` **vide** après la
suite, comparer les 23 témoins de prose, puis remettre à 🏹 Legolas avec les sorties de l'étape 0
citées, l'écart mesuré du repli (0.e), et le compte final d'entrées **avec sa dérivation**.

---

## 6. Fichiers concernés

| Fichier | Ce qui change |
|---|---|
| `specs/instructions/registre-grain-sous-verbe.md` | **la présente instruction** — toute correction de cadrage en cours de lot s'y écrit |
| `cli/test/fixtures/couverture-json.json` | grain sous-verbe (ids plats), `_lisezMoi` **réécrit** (il grave AR-J1(b), caduc), `horsCouvertureCount` recalculé selon AR-G4 |
| `cli/test/guard-json-couverture.test.js` | dérivation **unique** (étape 1) ; repli `verbId` **retiré** (l.368) ; garde `couverture ⟺ mesure` (AR-G6) ; contrefactuels. **G-J2 (l.72-241) et règle 6 (l.243-280) INCHANGÉES** |
| `cli/src/lib/verbes.js` | **données seules** : `sousVerbeParDefaut` (AR-G3(b)) + `motif` de `frame.guideClaudeCode` (l.357) **désambiguïsé**, forme « chute si … » conservée. **Aucune fonction, aucune sortie** |
| `cli/test/guard-json-output.test.js` | **si AR-G4 = (b)** : ~10 invocations ajoutées sur les bacs à sable existants ; `test.after()` étendu. **Invocations préexistantes intactes** |
| `docs/qualite/mesures-etape-0-registre-grain-sous-verbe.md` | **neuf** — la mesure d'exécution qui **remplace** le § 0 de ce cadrage comme autorité |
| `BACKLOG.md` | récit de fin de lot + successeurs — **après** le gate PASS, jamais avant |

**Lu et jamais écrit** : `cli/src/commands/**`, `cli/src/lib/output.js`, `cli/src/lib/interactif.js`,
`cli/scripts/gen-iaka-commands.mjs`, `docs/commandes.md`, `cli/test/temoins-prose.test.js` et ses
fixtures, `cli/test/guard-verbes-registre.test.js`.

---

## 7. Risques

| # | Risque | Mitigation |
|---|---|---|
| **R-G1** | **Le § 0 est une lecture, pas une mesure.** Si le repli `verbId` ne masque pas dix trous mais deux, ou vingt, l'estimation et AR-G4 changent de nature | **Étape 0 bloquante**, 0.e en particulier : toute contradiction ⇒ **ARRÊT** et retour à 🔵 Gandalf. Provision chiffrée au § 9 |
| **R-G2** | **Une invocation neuve écrit hors bac à sable.** `review apply` **matérialise** dans une bibliothèque ; un `--library` oublié corrompt la vraie `library/` du dépôt | `--library <tmp>` **obligatoire** ; `git status --porcelain` **vide** après la suite (CA-G8) ; `test.after()` étendu. Contrefactuel à jouer **sur une copie jetable du dépôt**, jamais sur le dépôt réel |
| **R-G3** | **La refonte masque un trou** : 29 → ~52 entrées en gardant `0` sans rien mesurer de plus | **AR-G6(c)** rend le mensonge impossible par construction : `couverture` **⟺** présence réelle. Plus CA-G4, son contrefactuel dédié |
| **R-G4** | **Le cliquet remonte et devient un précédent** — « on remonte le cliquet quand ça arrange » | Une remontée n'est légale **qu'accompagnée d'un changement de grain écrit dans le `_lisezMoi` du même commit**, avec un motif par entrée. À écrire comme **règle** dans `_lisezMoi`, pas seulement à faire |
| **R-G5** | **L'angle mort de G-J1 (entrée neutralisée par `//`) porte désormais sur ~52 lignes au lieu de 29** — le risque ne change pas de **nature**, il change d'**exposition** | Déclaré, non fermé (§ 4, Exclu, `G-J1-ENTREE-NEUTRALISEE`). **Si le décideur veut le fermer : +0,25 j** et une garde d'une autre nature (parsing JS/AST au lieu d'une lecture de texte) — un choix, pas un « tant qu'on y est » |
| **R-G6** | **`sousVerbeParDefaut` est une DÉCLARATION que rien n'exécute.** Si `skills` nu cessait un jour de dispatcher vers `deploy`, le champ mentirait en silence | **Nommé, pas prétendu résolu** (CA-G7). Sa véracité repose sur la mesure 0.c, datée et citée. Une garde d'exécution serait une garde **de dispatch**, hors périmètre — à nommer si le décideur la veut |
| **R-G7** | **`review apply/reject/auto` se couplent entre eux** : les trois mutent le statut d'une proposition ; joués sur la même, l'ordre décide du résultat | Trois propositions (ou trois canons) **distinctes**, montées au préambule — patron `models set`/`unset` (`guard-json-output.test.js:135-141`), déjà éprouvé |
| **R-G8** | **La reformulation du `motif` de `frame` casse la garde `GC`**, qui exige la forme « chute si … » (`guard-verbes-registre.test.js:190, 198-217`) | La reformulation **conserve** la forme conditionnelle et ne change que **l'objet** de la condition. `guard-verbes-registre.test.js` rejoué (18/18) dans le **même commit** |
| **R-G9** | **Un `id` à espace casse un consommateur de la fixture** | La fixture n'est lue que par `guard-json-couverture.test.js` (grep du dépôt : aucun autre consommateur, seulement des mentions en doc et en instruction). **À reconfirmer par grep à l'étape 0** |

---

## 8. Critères d'acceptation

Chaque critère est **testable par commande et code de sortie**, et porte son **contrefactuel** —
la manipulation qui doit le faire **rougir**, jouée puis **révoquée**, et **citée** au rapport de
remise. *Un verdict qui ne cite pas ses commandes est inopposable.*

- [ ] **CA-G1 — La mesure existe et fait autorité.**
      `docs/qualite/mesures-etape-0-registre-grain-sous-verbe.md` porte : la sortie de 0.a ; le
      décompte dérivé de 0.b ; le **classement des 8 formes nues** de 0.c (avec stdout cité) ; la
      forme mesurée des dix invocations de 0.d ; et **les deux listes** de 0.e (avec et sans le
      repli). Toute ligne divergeant du § 0 est **signalée comme telle**.
      *Contrefactuel : n/a — artefact de mesure ; sa preuve est d'exister, d'être daté et d'être
      cité.*

- [ ] **CA-G2 — Une seule dérivation, deux consommateurs.** La liste des surfaces attendues est
      produite par **une** fonction de `guard-json-couverture.test.js`, appelée par le test de
      fidélité du registre **et** par G-J1. Aucune liste d'ids n'est écrite en dur dans la fixture
      ni dans le test.
      *Contrefactuel : ajouter à `verbes.js` un sous-verbe fictif portant `'--json'` sur un verbe
      réel ⇒ **deux rouges distincts** — la fidélité du registre (id manquant) **et** G-J1
      (invocation sans `NOMINAL`) — chacun **nommant** `"<verbe> <sousVerbe>"`. Puis révoquer.*

- [ ] **CA-G3 — Le repli `verbId` est mort, et sa cause est déclarée.** `!couvertes.has(a.verbId)`
      n'existe plus dans le fichier. La forme nue qui **est** un sous-verbe est déclarée par
      `sousVerbeParDefaut` dans `verbes.js` (AR-G3(b)) — ou, si AR-G3 = (c), par une liste **avec
      motif par entrée**.
      *Contrefactuel : retirer `sousVerbeParDefaut` du verbe concerné ⇒ rouge nommant
      `skills deploy` comme non couvert. Puis révoquer.*

- [ ] **CA-G4 — Le registre ne peut plus mentir sur sa couverture** (AR-G6(c)). Pour chaque entrée :
      `couverture ∋ c-json|c-json-erreur` **⟺** identifiant présent dans les invocations dérivées
      du texte de `guard-json-output.test.js` ; `hors-couverture` **⟺** absent.
      *Contrefactuel (×2, joués séparément) : (1) marquer une entrée réellement non mesurée en
      `c-json` ⇒ rouge **la nommant** ; (2) marquer en `hors-couverture` une entrée réellement
      mesurée (ex. `memory init`) ⇒ rouge **la nommant**. Deux rouges, deux sens.*

- [ ] **CA-G5 — Un sous-verbe ajouté demain sans invocation est attrapé.**
      *Contrefactuel (le cœur du lot, joué en deux temps) : (1) **sonde synthétique committée** —
      un sous-verbe fictif ajouté en mémoire à un verbe réel ⇒ G-J1 le nomme ; (2) **joué sur le
      fichier réel** `verbes.js`, puis **révoqué** — même rouge, et `git status --porcelain` vide
      après révocation.*

- [ ] **CA-G6 — La garde d'AVANT ne voyait pas ce que la garde d'APRÈS voit** (contrefactuel
      inverse, la preuve que le lot change quelque chose). Rejouer l'**ancienne** dérivation (avec
      le repli `verbId`) sur le registre **neuf** : elle ne signale **rien** ; la neuve signale les
      trous du § 0.5. Les deux sorties sont **citées** côte à côte au rapport de remise.
      *Contrefactuel : n/a — c'est lui-même un contrefactuel, joué en script jetable, jamais
      committé.*

- [ ] **CA-G7 — Le cliquet ne ment plus, et sa variation est un geste écrit.**
      `horsCouvertureCount` **égale** le compte réel d'entrées `hors-couverture` (test préexistant,
      l.61-70, **inchangé**), et chaque `hors-couverture` porte **un motif non vide** (l.53-59,
      **inchangé**). Si AR-G4 = (a), les **dix** motifs **nomment le successeur**. Si AR-G4 = (b),
      `horsCouvertureCount: 0` et **plus aucune** entrée `hors-couverture`. Dans les deux cas, le
      **`_lisezMoi` du même commit** énonce le changement de grain et la règle de R-G4.
      **Déclaré, non prétendu résolu** : `sousVerbeParDefaut` est une **déclaration** que rien
      n'exécute (R-G6) ; sa véracité tient à la mesure 0.c, datée et citée.

- [ ] **CA-G8 — Aucun test n'écrit hors d'un `mkdtempSync`.** Après `cd cli && node --test test/`,
      `git status --porcelain` du dépôt est **vide**.
      *Contrefactuel : retirer le `--library <tmp>` de l'invocation `review apply` ⇒ `git status`
      n'est plus vide ⇒ rouge. **À jouer sur une copie jetable du dépôt**, jamais sur le dépôt
      réel.*

- [ ] **CA-G9 — Aucune sortie ne change, machine ni humaine.** Les **23** tests de
      `temoins-prose.test.js` passent et **aucune** fixture de `cli/test/fixtures/temoins-prose/`
      n'est modifiée (constaté au `git diff --stat`). Le diff de `cli/src/` ne contient **que** des
      lignes de **données** (`sousVerbeParDefaut`, `motif`) — aucune fonction, aucune chaîne
      émise.
      *Contrefactuel : n/a — se constate au diff, et se cite au rapport de remise.*

- [ ] **CA-G10 — Les gardes voisines sont intactes et vertes.** `guard-json-output.test.js`
      (**63** tests + les ajouts d'AR-G4(b), aucune invocation préexistante altérée),
      `guard-verbes-registre.test.js` (**18**), `guide-doc-a-jour.test.js` (**6**), et dans
      `guard-json-couverture.test.js` les blocs **G-J2** (l.72-241) et **règle 6** (l.243-280)
      **non modifiés**.
      *Contrefactuel : n/a — se constate au diff.*

- [ ] **CA-G11 — Le dépôt est vert.** `cd cli && node --test test/` : **0 échec**, compte de tests
      **cité** et confronté aux 1263 du gate J3 (l'écart s'explique par les tests **ajoutés**, et
      par eux seuls).

### Ce qui n'est PAS prouvable dans ce lot — et qui doit donc être dit

- **Que la déclaration `sousVerbeParDefaut` reste vraie.** Elle décrit un dispatch qu'aucune garde
  n'exécute (R-G6). Le lot la rend **explicite et datée** ; il ne la rend pas **auto-vérifiée**.
- **Qu'une entrée `NOMINAL` neutralisée par `//` soit détectée** : angle mort hérité et **exclu**
  (§ 4). Le lot n'améliore ni n'aggrave sa **nature** — seulement son **exposition** (R-G5).
- **Que les invocations soient conformes sur tous leurs chemins.** Une garde nominale mesure **un**
  cas par invocation ; un chemin d'erreur rare peut rester non conforme. Le lot rend la
  **promesse** vérifiée, pas le sous-verbe **exhaustivement** vérifié.

---

## 9. Estimation — au jalon P1→P2

**Ordre de grandeur assumé et révisable — pas un engagement ferme.**

| Étape | Équivalent jour-homme | Complexité / risque |
|---|---|---|
| Étape 0 — mesure (0.a→0.e) | **0,25 j** | Faible, mais **bloquante** : c'est elle qui valide ou casse le cadrage |
| Étapes 1-2 — dérivation unique + retrait du repli + `sousVerbeParDefaut` | **0,5 j** | **Moyenne** — le geste structurant du lot |
| Étapes 3-4 — refonte de la fixture + garde `couverture ⟺ mesure` | **0,5 j** | Faible-moyenne ; mécanique une fois la dérivation posée |
| Étape 5 — fermeture des dix trous (**si AR-G4 = (b)**) | **0,75 j** | **Moyenne-haute** : les trois canons de `review` sont la seule vraie inconnue d'ingénierie |
| Étapes 6-7 — contrefactuels, non-régression, remise | **0,25 j** | Faible |
| **Total AR-G4 = (b)** | **2 à 2,5 j-h** | **Moyenne** |
| **Total AR-G4 = (a)** — grain seul, cliquet 0 → 10 | **1,25 à 1,5 j-h** | Faible-moyenne |

**Découpage possible** (si le décideur veut un gate intermédiaire) : **G1 = étapes 0→4 + 6-7**
(le grain, cliquet à 10, gatable et livrable seul, dépôt vert) ; **G2 = étape 5** (fermeture des
dix, cliquet à 0). C'est exactement la forme d'AR-G4 : (a) = livrer G1 et s'arrêter là ;
(b) = livrer G1 puis G2 dans le même lot.

**Inconnues, nommées :**

1. **La plus lourde — l'étape 0 peut invalider le § 0.3.** Le repli `verbId` masque-t-il bien
   **dix** trous ? Tout le lot (et le choix d'AR-G4) en dépend. **Provision : +0,5 j** si l'écart
   mesuré diffère sensiblement.
2. **Le classement des 8 formes nues (0.c).** Il décide du compte final d'entrées (50 / 52 / 58) et
   de la présence de `sousVerbeParDefaut`. C'est une mesure de 15 minutes qui commande une
   décision de forme. **Provision : +0,25 j** si plusieurs formes nues ont un comportement propre
   non trivial.
3. **Le coût réel des trois canons de `review`** (R-G7). Je n'ai pas pu mesurer combien de
   propositions distinctes il faut monter pour que `apply`/`reject`/`auto` soient indépendants de
   l'ordre. Seule inconnue d'**ingénierie** du lot. **Provision : +0,25 j.**
4. **AR-G4** — écart de **0,75 j** entre (a) et (b), et surtout un écart de **nature** : (b) tient
   la promesse, (a) la reporte d'un lot en la disant.

**Recommandation d'engagement.** Engager **AR-G4 = (b)** (≈ **2 à 2,5 j**) : le dépôt a déjà payé
deux fois cette dette (14 → 9 → 0, et maintenant 0 → 10), les trois bacs à sable existent, et un
cliquet qui remonte pour redescendre plus tard est le motif exact que ce lot corrige. **Si le
décideur veut un lot court, (a) est honorable** — à condition que les dix motifs **nomment leur
successeur** et que le `_lisezMoi` **écrive** la règle de remontée (R-G4).
