# Mesures d'exécution — Étape 0 du lot `REGISTRE-GRAIN-SOUS-VERBE`

> Réalisé par ⚒️ Gimli le 2026-09-10, sur `specs/instructions/registre-grain-sous-verbe.md`.
> **Ceci est une mesure d'EXÉCUTION** (Node lancé en bac à sable), pas une lecture statique — elle
> **remplace** le § 0 du cadrage (fait par 🔵 Gandalf sans shell, cf. § 0.1 de l'instruction) comme
> autorité. Là où les deux divergent, cette mesure fait foi et la divergence est nommée ci-dessous.
> Aucune ligne de `cli/src/` ni de `cli/test/` n'a été modifiée pour produire ce rapport. Tous les
> scripts et bacs à sable vivent sous
> `/private/tmp/claude-501/-Users-sjupin-work/51dc7ce4-75a8-4059-887c-b01a6f16eaf9/scratchpad/gimli-grain/`
> et ne sont **jamais** committés.

## Méthode

Worktree `/Users/sjupin/work/.wt/iakaframe-registre-grain-sous-verbe`, branche
`feat/registre-grain-sous-verbe` @ `88682c4`. Arbre propre avant toute mesure
(`git status --porcelain` vide) et **vide après** (vérifié à la fin de ce rapport). Chaque verbe/
sous-verbe mesuré a été exécuté en bac à sable (`mkdtempSync`-like, répertoires dédiés sous le
scratchpad ci-dessus) ; aucune écriture hors bac à sable, aucune écriture dans la vraie
bibliothèque du dépôt.

## 0.a — Le dépôt est vert AVANT toute modification

```
$ cd cli && node --test
ℹ tests 1263
ℹ pass 1256
ℹ fail 0
ℹ cancelled 0
ℹ skipped 7
```

**Divergence signalée face à l'attendu du § 0.2 (gate J3 : `1263, pass 1262, fail 0, skipped 1`).**
`fail` est bien **0** dans les deux cas — le dépôt est vert au sens qui compte (aucune régression).
Mais `skipped` passe de 1 à 7 et `pass` de 1262 à 1256, un écart de 6 qui **s'explique entièrement**
et n'est **pas un fait nouveau introduit par ce lot** :

```
﹣ AC1.11 : les cles du catalogue de workflows CLI == celles du coeur GUI … # frere iakaFrameGUI absent
﹣ AC1.11 : COUVERTURE - toute ref manquante du coeur GUI a un finding BLOQUANT … # frere iakaFrameGUI absent
﹣ AC1.11 : SEVERITE COMMUNE ARB-2 … # frere iakaFrameGUI absent
﹣ AC1.11 : parite du VERT - fixture saine … # frere iakaFrameGUI absent
﹣ parite : la copie vendoree du GUI == la source iakaframe … # copie vendoree GUI introuvable (depot iakaFrameGUI absent - CI isolee)
﹣ recall : moteur ripgrep si rg est installe (sinon test saute) # SKIP
﹣ parite miroir CLI <-> core vocab.json (enums + alias) … # core vocab.json introuvable (depot iakaFrameGUI absent - CI isolee)
```

Six skips sont des gardes de PARITÉ avec le dépôt frère `iakaFrameGUI`, **absent de ce worktree**
(le worktree ne clone que `iakaframe`) — auto-déclarés, avec motif explicite dans le message même du
test, pas une dérive silencieuse. Le septième dépend de la présence de `rg` (ripgrep) sur la
machine. **Aucun de ces sept skips n'est lié au grain sous-verbe ni à `couverture-json.json`** —
c'est une caractéristique de l'environnement worktree, pas du lot. Signalé (CA-G1), non traité :
hors périmètre de ce lot.

**Note secondaire, non retenue au verdict** : une première exécution en cours de suite complète a
montré une assertion rouge transitoire sur `install-contrat-machine.test.js:370` (« Écart gate —
`install --dry-run --events` : evt:"fin" porte etatAtteint.etapesFaites VIDE »). Rejoué isolément
**3 fois d'affilée**, ce fichier passe **24/24** à chaque fois ; rejoué en suite complète une
seconde fois (capturée dans `run1.log`), **0 échec**. Comportement compatible avec une flakiness
d'exécution concurrente (le test runner de Node lance les fichiers en parallèle), **pas une
régression du dépôt** — mais je le nomme au lieu de le taire, comme l'exige la méthode.

**Verdict 0.a : CONFIRMÉ pour `fail=0` (le point qui compte pour « dépôt vert avant modification »),
divergence bénigne et expliquée sur `pass`/`skipped`.**

## 0.b — Le décompte du grain, DÉRIVÉ de `verbes.js`

```
$ cd cli && node -e "import('./src/lib/verbes.js').then(({ VERBES }) => { … })"
sans sous-verbes : 21 | sous-verbes declarants : 29 | formes nues a arbitrer : 8
```

Détail complet (JSON) : 21 verbes sans sous-verbes (`install`, `services`, `canaux`, `endpoints`,
`config`, `list`, `show`, `add`, `remove`, `attach`, `detach`, `assemble`, `vendor-check`, `switch`,
`open`, `recall`, `close`, `consolidate`, `portfolio`, `range`, `commands`) ; 29 sous-verbes
déclarants `--json` répartis sur les 8 verbes à sous-verbes (`agents` ×2, `skills` ×1, `models` ×2,
`frame` ×4, `memory` ×7, `produit` ×7, `review` ×5, `observe` ×1) ; 8 formes nues à arbitrer.

**Verdict 0.b : CONFIRMÉ exactement — 21 | 29 | 8, identique à la lecture du § 0.4.**

## 0.c — Les 8 formes NUES, classées PAR EXÉCUTION

Chaque verbe exécuté `<verbe> --json` en bac à sable (`--project`/`--home` selon le verbe).
`observe` exécuté avec `--home <tmp>` dédié, conformément à l'avertissement du § 5.

| Verbe nu | stdout (résumé) | Classement mesuré | Prédiction (§ 0, à infirmer) |
|---|---|---|---|
| `agents --json` | `{ok:true, count:35, personas:[…]}` — **octet pour octet identique** à `agents list --json` | **ALIAS de `list`** | erreur d'usage — **INFIRMÉE** |
| `skills --json` | `{ok:true, count:20, skills:[…], orphans:[], target, drift:0}` — **identique** à `skills deploy --check --json` | **ALIAS de `deploy`** | alias — **confirmée** |
| `models --json` | `{ok:true, frameId, methodId, teamId, bindingId, suggestions, count:10, targets:[…], roles:[…], overrideDivergences:[], unknownOverrides:[]}` — rapport propre, distinct de `set`/`unset` | **comportement PROPRE** | comportement propre — **confirmée** |
| `frame --json` | `{ok:true, checked:288, count:21, findings:[…]}` — **octet pour octet identique** à `frame verify --json` | **ALIAS de `verify`** | erreur d'usage — **INFIRMÉE** |
| `memory --json` | `{ok:false, error:"Usage : iakaframe memory <action> [options]\n…"}`, exit 1 | **erreur d'usage** | erreur d'usage — **confirmée** |
| `produit --json` | `{ok:false, error:"Usage : iakaframe produit <action> [options]\n…"}`, exit 1 | **erreur d'usage** | erreur d'usage — **confirmée** |
| `review --json` | `{ok:false, error:true}` (⚠️ `error` est un **booléen**, pas une chaîne — forme différente des autres erreurs d'usage), exit 1 | **erreur d'usage** (forme irrégulière) | erreur d'usage — **confirmée dans la catégorie, forme non prédite** |
| `observe --json` | `{ok:false, error:"Usage : iakaframe observe [action] [options]\n…"}`, exit 1 ; **aucun fichier créé** dans le bac à sable `--home` (`ls` vide après coup) | **erreur d'usage, n'écrit PAS le store** | comportement propre + « écrit le store » — **INFIRMÉE sur les deux points** |

**Divergence majeure signalée face au § 0.c et à AR-G2.** La prédiction de lecture (« propre pour
`models` et `observe` ; alias pour `skills` ; erreur d'usage pour `agents`, `frame`, `memory`,
`produit`, `review` ») **ne tient que pour 5 des 8 formes** (`models`, `skills`, `memory`,
`produit`, `review`). Deux écarts :

1. **`agents` et `frame` sont aussi des ALIAS**, pas des erreurs d'usage — `agents` dispatche
   silencieusement vers `list`, `frame` vers `verify` (sorties byte-identiques, vérifiées par
   `diff`). Si AR-G3(b) est retenu, `sousVerbeParDefaut` doit donc être déclaré sur **trois**
   verbes (`skills → deploy`, `agents → list`, `frame → verify`), pas un seul.
2. **`observe` n'écrit PAS le store en l'absence d'action/texte** — c'est une erreur d'usage propre
   (positional manquant), et non le comportement « écrit silencieusement » que l'avertissement du
   § 5 anticipait pour la forme nue. L'avertissement visait, à la lecture, la fonction de bas niveau
   d'écriture ; l'exécution montre que le CLI refuse AVANT d'écrire quand aucun texte n'est fourni.
   Conséquence sur AR-G2(b) : `observe` **n'entre pas** au registre par ce chemin (ce n'est pas un
   comportement propre), contrairement à la prédiction du cadrage.

Cette divergence porte sur une **prédiction explicitement déclarée « à infirmer »** par le cadrage
lui-même (§ 3, AR-G2 : « Si l'étape 0 dit autre chose, l'étape 0 gagne et le chiffre change sans que
ce cadrage soit rouvert »). Elle **ne touche pas** le fait central du § 0.3 (le repli `verbId`,
mesuré en 0.e ci-dessous) : je la signale, je ne l'utilise pas pour déclencher un retour à Gandalf,
conformément à la règle d'arrêt qui vise spécifiquement 0.e.

**Verdict 0.c : PARTIEL — 5/8 classements confirmés, 3 infirmés (`agents`, `frame` : alias au lieu
d'erreur d'usage ; `observe` : erreur d'usage au lieu de comportement propre écrivain). Compte final
d'entrées AR-G2(b) recalculé : `models` seul entre au registre comme forme nue propre → **une**
entrée nue, pas deux ni huit.**

## 0.d — Les dix trous, confirmés absents puis exécutés

**Absence confirmée** par grep sur `cli/test/guard-json-output.test.js` : aucune des dix chaînes
`'memory', 'add'` / `'memory', 'replace'` / `'memory', 'remove'` / `'produit', 'init'` /
`'produit', 'add'` / `'produit', 'replace'` / `'produit', 'remove'` / `'review', 'apply'` /
`'review', 'reject'` / `'review', 'auto'` n'apparaît dans le fichier (grep vide). Lecture complète
du tableau `ERRORS` (l. 334-361) : confirmé, aucune des dix n'y figure non plus.

**Exécution en bac à sable**, patrons du fichier de test recopiés dans le scratchpad (jamais dans
le fichier de test) :

| Invocation | Bac à sable | Racine objet | `ok` 1ʳᵉ clé | `count` | stderr | exit |
|---|---|---|---|---|---|---|
| `memory add registre "entree-neuve-add"` | `--home <HOME jetable>`, pré-seedé par `memory init` | oui | oui | — (rapport à plat : `action,target,changed,length,cap`) | vide | 0 |
| `memory replace registre "…pour-replace" "…revisee-par-replace"` | idem, cible **sa propre** entrée pré-existante | oui | oui | — | vide | 0 |
| `memory remove registre "…pour-remove"` | idem, cible une **troisième** entrée distincte | oui | oui | — | vide | 0 |
| `produit init` | `--project <PROJ jetable>` | oui | oui | oui (`created`, 2 éléments) | vide | 0 |
| `produit add "entree-neuve-add"` | idem, après `init` | oui | oui | — | vide | 0 |
| `produit replace "…pour-replace" "…revisee-par-replace"` | idem, entrée dédiée pré-seedée | oui | oui | — | vide | 0 |
| `produit remove "…pour-remove"` | idem, entrée dédiée pré-seedée | oui | oui | — | vide | 0 |
| `review apply <id-alpha>` | `--home <REVIEW jetable>` + `--library <tmp>`, proposition **réelle** produite par `close` (3 propositions `registre` distinctes : alpha/beta/gamma) | oui | oui | — (`materialize` imbriqué) | vide | 0 |
| `review reject <id-beta>` | idem, **deuxième** proposition, indépendante d'alpha | oui | oui | — | vide | 0 |
| `review auto` | idem, applique **uniquement** la troisième (gamma), les deux premières n'étant plus en attente | oui | oui | — (`applied[1]`, `kept[0]`) | vide | 0 |

**Vérification R-G2 (fuite hors bac à sable)** : `git status --porcelain` **vide** après toute la
séquence (aucune écriture dans la vraie bibliothèque ni le vrai canon du dépôt). `produit init`
n'a créé que `specs/canon/PRODUIT.md` **sous le projet jetable** (`find` ciblé confirmé).

**Vérification R-G7 (couplage des trois `review …`)** : trois propositions distinctes (`alpha`,
`beta`, `gamma`), chacune mutée par un seul geste (`apply`/`reject`/`auto` respectivement) — aucun
couplage d'ordre constaté, patron `models set`/`unset` bien reproductible sur `review`.

**Verdict 0.d : CONFIRMÉ.** Les dix invocations, une fois exécutées, rendent toutes une racine
objet avec `ok` en première clé, aucun `count` erroné (les rapports de mutation n'en portent pas,
conformément au patron déjà vu sur `memory`/`produit` dans le lot parent), stderr vide, exit 0.

## 0.e — Le repli `verbId`, mesuré des deux côtés (le fait central)

Script jetable (jamais committé) :
`/private/tmp/…/scratchpad/gimli-grain/mesure-0e.mjs` — rejoue exactement
`invocationsCouvertesReelles()` et `invocationsAttendues()` de
`cli/test/guard-json-couverture.test.js` (import direct de `VERBES`, lecture texte du même fichier
`guard-json-output.test.js`), une fois avec le repli `!couvertes.has(a.verbId)`
(`guard-json-couverture.test.js:368`), une fois sans.

```
$ node mesure-0e.mjs
AVEC repli (!couvertes.has(a.verbId)) : []
SANS repli                          : ["skills deploy","memory add","memory replace","memory remove",
  "produit init","produit add","produit replace","produit remove","review apply","review reject","review auto"]
compte AVEC : 0 | compte SANS : 11
```

**Verdict 0.e : CONFIRMÉ EXACTEMENT.** L'attendu du § 5 (« `[]` avec le repli, 10 entrées +
`skills deploy` sans ») est vérifié à la lettre : **0** manquante avec le repli, **11** sans
(les 10 trous nommés au § 0.5 + `skills deploy`, l'alias qui a motivé le repli). Le fait central du
§ 0.3 — « dès qu'UN sous-verbe d'un verbe est mesuré, TOUS ses sous-verbes sont réputés couverts »
— **tient**. **Aucun ARRÊT requis** : la règle d'arrêt du § 5 ne se déclenche pas.

## Bonus — R-G9 (consommateurs de la fixture)

```
$ grep -rl "couverture-json.json" --include="*.js" --include="*.mjs" --include="*.md" .
BACKLOG.md
specs/instructions/*.md (mentions, pas du code)
docs/qualite/*.md (mentions, pas du code)
cli/test/guard-json-couverture.test.js
```

**Confirmé** : la fixture n'est consommée en **code** que par `guard-json-couverture.test.js`.
Aucun risque supplémentaire identifié pour AR-G1(a) (identifiants plats avec espace).

## Non-régression (avant toute modification)

```
$ git status --porcelain
(vide)
```

Arbre propre après toute la séquence de mesure (0.a → 0.e + bonus), avant la première ligne de
code de ce lot.

## Récapitulatif des verdicts

| Mesure | Verdict | Écart notable |
|---|---|---|
| 0.a | CONFIRMÉ (fail=0) | `skipped` 1→7, `pass` 1262→1256, entièrement expliqué (absence du dépôt frère `iakaFrameGUI` + `rg`), sans rapport avec le lot |
| 0.b | CONFIRMÉ EXACTEMENT | — |
| 0.c | PARTIEL | `agents`/`frame` sont des alias (pas des erreurs d'usage) ; `observe` est une erreur d'usage (pas un comportement propre écrivain) |
| 0.d | CONFIRMÉ | — |
| 0.e | CONFIRMÉ EXACTEMENT | — |

**Le fait central du lot (§ 0.3, mesuré en 0.e) tient sans réserve : le repli `verbId` masque bien
et exactement les dix trous nommés, plus l'alias `skills deploy`.** La seule divergence
substantielle porte sur le classement des formes nues (0.c), un point que le cadrage lui-même
déclare révisable par l'exécution sans réouverture. Elle a deux conséquences concrètes pour les
étapes 1-2 : (a) `sousVerbeParDefaut` doit être déclaré sur **trois** verbes (`skills`, `agents`,
`frame`), pas un ; (b) `observe` nu n'entre pas au registre comme forme nue « propre » — seul
`models` y entre.
