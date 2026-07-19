# Garde `vendor-check` cross-repo — détecter la dérive mutuellement cohérente

> Instruction de cadrage (Gandalf, P1). **Lecture seule** sur le code ; ce fichier est le seul
> artefact produit. Objectif : fermer la **cause racine** démontrée par Legolas au gate v0.17.14 —
> un drift injecté à travers binding + golden + sha256 **recalculés ensemble** laisse
> **475/475 tests GUI verts**. Le lot v0.17.14 a corrigé une *instance*, pas la *cause*.
> Aucun code ici : spec fermée pour un lot d'exécution.

## 1. Problème posé (avant toute solution)

### 1.1 Pourquoi la dérive est structurellement indétectable

Le dispositif de parité actuel est un **cliquet bilatéral** : le CLI rend le contrat, le golden le
fige avec un `sha256`, la GUI compare son rendu au golden vendoré. Il attrape parfaitement la
dérive **de format** (un générateur qui change de rendu).

Il n'attrape **rien** de la dérive **de contenu**, parce que **les trois intrants du test GUI sont
vendorés** :

| Intrant du test GUI | Fichier | Origine |
|---|---|---|
| 8 personas | `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/personas/*.md` | copie |
| 1 binding | `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/binding/iakaframe-claude-default.md` | copie |
| 8 goldens | `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/agents-golden/*.md` | copie |

Le test GUI (`packages/core/__tests__/parite-generateurs.test.ts:24-41`) importe les **17 fixtures**
et rien d'autre. Il prouve donc : *« le rendu GUI est cohérent avec les copies que la GUI détient »*.
Il ne prouve **jamais** : *« les copies que la GUI détient sont fidèles à `iakaframe` »*.

La garde `sha256` (`:130-135`) ne change rien : elle prouve la **cohérence interne** de la copie,
pas sa **fidélité à la source**. Un drift qui recalcule le hash passe par construction.

**Corollaire, à graver dans l'instruction d'exécution** : aucune garde vivant **à l'intérieur** de
`iakaFrameGUI` et ne lisant **que** des fixtures vendorées ne peut détecter ce drift. Il faut une
garde qui lit **les deux dépôts**.

### 1.2 Le nœud : les deux dépôts ne se voient pas en CI

`iakaframe` et `iakaFrameGUI` sont deux dépôts Forgejo distincts. Un clone isolé de l'un n'a aucune
visibilité sur l'autre. Le seul lieu où **les deux sont simultanément présents** est la machine de
dev (dossier chapeau `~/work`, ou `$IAKAFRAME_ROOT`).

Conséquence directe, qui borne tout le design : **la garde ne peut pas être un test bloquant
inconditionnel**. Elle doit être **conditionnelle à la présence du dépôt frère** et se dégrader
gracieusement — principe iaka : *pas de dépendance dure* (mémoire `iaka-iakabox-optionnelle`).

### 1.3 Précédent déjà en place dans le dépôt (à réutiliser, pas à réinventer)

`cli/test/vocab-parity.test.js` résout **exactement** ce problème pour `vocab.json` :

- liste de **chemins candidats** (`:16-21`) : override d'environnement, puis `../iakaFrameGUI/…`,
  puis `../iakaframegui/…` (casse alternative) ;
- résolution tolérante (`findVocab`, `:23-26`) ;
- **skip documenté** si absent (`:28-29`) : `'core vocab.json introuvable (depot iakaFrameGUI absent - CI isolee)'` ;
- les tests **indépendants du frère restent actifs** (`:48-93`).

> **Décision de cadrage** : le `vendor-check` **reprend ce patron à l'identique**. Zéro nouveau
> mécanisme de résolution. C'est un invariant de l'instruction, pas une suggestion.

## 2. Périmètre

- **Dans le périmètre** : détecter qu'une des **17 fixtures vendorées** de `iakaFrameGUI` diverge de
  sa source `iakaframe` ; exposer le geste de re-vendorage ; dégrader gracieusement si le frère est
  absent.
- **Hors périmètre** : synchroniser automatiquement (le re-vendorage reste un geste **conscient**,
  c'est le principe même du cliquet) ; toucher aux tests GUI existants ; toucher au format du
  contrat ou au générateur.

## 3. Options structurantes (avec recommandation)

### 3.1 Où la garde vit

| Option | Description | Analyse |
|---|---|---|
| **A** | Test dans `iakaframe` (`cli/test/vendor-check.test.js`) | `iakaframe` est la **source**, donc l'autorité. Patron `vocab-parity` déjà éprouvé. Tourne dans la suite `node --test` existante. |
| B | Test dans `iakaFrameGUI` qui remonte vers `iakaframe` | Inverse la relation d'autorité : le miroir irait juger la source. Ajoute une dépendance vitest→FS hors racine. |
| C | Script portefeuille indépendant (`~/work`) | Ne s'exécute dans aucune suite ; garde qui ne tourne jamais = garde inexistante. |

> **Recommandation : A**, complétée par un verbe CLI (§ 3.2). La source détient la vérité ; c'est
> elle qui constate que son miroir a décroché.

### 3.2 Quand elle tourne

Trois déclencheurs possibles, **non exclusifs** :

| Option | Analyse | Reco |
|---|---|---|
| **Test conditionnel** dans la suite CLI | Coût nul, tourne à chaque gate Legolas, skip propre en CI isolée | **Retenu** |
| **Verbe CLI** `iakaframe vendor-check` | Rend la garde **invocable à la demande** + scriptable (`--json`), et donne le message de remédiation | **Retenu** |
| Hook `pre-commit` git | Dépendance dure à un hook local non versionné, casse un clone isolé, contraire au principe iaka | **Écarté au MVP** — à réévaluer plus tard, jamais bloquant |

> Le pré-commit est explicitement **écarté** : il introduirait précisément la dépendance dure que la
> méthode interdit. Le couple *test conditionnel + verbe explicite* couvre le besoin.

### 3.3 Ce qu'elle compare — le point qui défait le drift cohérent

**C'est ici que se joue la valeur de tout le lot.** Comparer les fixtures GUI à *elles-mêmes* (ce
que fait la GUI aujourd'hui) est inutile. Il faut comparer **la copie à la source vivante**, en
**deux niveaux** :

**Niveau 1 — fidélité de copie (17 comparaisons byte-à-byte)**

| # | Copie GUI | Source `iakaframe` |
|---|---|---|
| 1-8 | `__tests__/fixtures/personas/<id>.md` | `library/personas/<id>.md` |
| 9 | `__tests__/fixtures/binding/iakaframe-claude-default.md` | `bindings/iakaframe-claude-default.md` |
| 10-17 | `__tests__/fixtures/agents-golden/<id>.md` | `cli/test/fixtures/agents-golden/<id>.md` |

**Niveau 2 — fidélité au rendu vivant (8 régénérations en mémoire)**

Pour chacun des 8 ids : régénérer le contrat **depuis les sources `iakaframe` courantes** via
`generateAgent(id, { root: REPO, binding })` (`cli/src/lib/generate-agents.js:68-80`) et le comparer
au **contenu utile du golden vendoré côté GUI**.

> **Pourquoi les deux niveaux ?** Le niveau 1 attrape la copie oubliée. Le niveau 2 attrape le cas
> pervers où quelqu'un aurait **régénéré un golden côté GUI** sans que la source ait bougé (ou
> l'inverse) : il ancre la comparaison sur `library/personas/` + `bindings/`, c'est-à-dire sur le
> **canon**, jamais sur un artefact dérivé. Un drift mutuellement cohérent **injecté dans les
> fixtures GUI** échoue au niveau 2 ; un drift injecté **dans les deux dépôts à la fois** reste
> hors de portée de toute garde automatique (il exige alors deux commits conscients dans deux
> dépôts — c'est le geste conscient qu'on veut préserver, cf. § 8).

### 3.4 Comportement quand le dépôt frère est absent

| Contexte | Comportement | Sortie |
|---|---|---|
| Frère absent, test | **SKIP** avec raison lisible | `node --test` vert, raison affichée |
| Frère absent, verbe CLI | `{ ok: true, status: "skipped", reason: … }` | **exit 0** |
| Frère absent, verbe CLI `--strict` | `{ ok: false, error: … }` | **exit 1** |
| Frère présent, aucune dérive | `{ ok: true, status: "clean", checked: 17, drift: 0 }` | exit 0 |
| Frère présent, dérive | `{ ok: false, status: "drift", drift: N, files: [...] }` | **exit 1** |

`--strict` existe pour l'usage portefeuille (où l'on *sait* que les deux dépôts sont là) sans jamais
pénaliser un clone isolé. **Le défaut est toujours gracieux.**

## 4. Spécification fermée

### 4.1 Résolution du dépôt frère

Ordre de résolution, **calqué sur `cli/test/vocab-parity.test.js:16-21`** :

1. `process.env.IAKAFRAME_GUI_ROOT` (chemin absolu vers la racine `iakaFrameGUI`) ;
2. `<racine iakaframe>/../iakaFrameGUI` ;
3. `<racine iakaframe>/../iakaframegui`.

Premier chemin existant gagne. Aucun trouvé → **absent** (§ 3.4). Un chemin est retenu seulement si
`<candidat>/packages/core/__tests__/fixtures` existe (évite de désigner un dossier homonyme vide).

### 4.2 Table des 17 paires (source de vérité du lot)

`IDS = ['aragorn','gandalf','gimli','helm','legolas','loki','nathalie','odin']` — **même liste et
même ordre** que `cli/test/parite-generateurs.test.js:22`.

```
personas : library/personas/<id>.md
        ↔ <GUI>/packages/core/__tests__/fixtures/personas/<id>.md
binding  : bindings/iakaframe-claude-default.md
        ↔ <GUI>/packages/core/__tests__/fixtures/binding/iakaframe-claude-default.md
golden   : cli/test/fixtures/agents-golden/<id>.md
        ↔ <GUI>/packages/core/__tests__/fixtures/agents-golden/<id>.md
```

Comparaison **byte-à-byte** (`Buffer.equals` ou égalité de chaînes utf8 sans normalisation). Aucune
tolérance sur les fins de ligne : le golden est byte-identique **par contrat**
(`cli/scripts/gen-agents-golden.mjs:6-8`).

### 4.3 Anti-régression sur le comptage

La garde **doit** échouer si le nombre de fixtures vendorées diffère de l'attendu (fixture
**surnuméraire** ou **manquante**), et pas seulement si un contenu diverge. Une persona ajoutée au
canon sans vendorage doit être rouge. Miroir du test d'inventaire existant
(`cli/test/parite-generateurs.test.js:56-59`).

### 4.4 Message de remédiation

En cas de dérive, la sortie humaine **doit** rappeler le rituel exact (déjà documenté en
`cli/scripts/gen-agents-golden.mjs:10-15`) : régénérer, re-vendorer les 17 fichiers, rejouer les
deux suites.

## 5. Critères d'acceptation (testables)

| # | Critère | Vérification |
|---|---|---|
| A1 | Le verbe `iakaframe vendor-check` existe et est mappé | `cli/src/index.js` ; `iakaframe vendor-check --json` renvoie du C-JSON valide |
| A2 | Les 17 paires sont comparées quand le frère est présent | sortie `--json` : `checked: 17` |
| A3 | Altérer 1 octet d'une **persona vendorée** GUI → rouge | `drift ≥ 1`, exit 1, fichier nommé |
| A4 | Altérer 1 octet du **binding vendoré** GUI → rouge | idem |
| A5 | **Test de non-régression du scénario Legolas** : injecter un drift *mutuellement cohérent* côté GUI (binding + golden + sha256 recalculés ensemble) → **la GUI reste verte** MAIS `vendor-check` est **ROUGE** | c'est **LE** critère du lot : il reproduit l'attaque de v0.17.14 |
| A6 | Ajouter une fixture surnuméraire côté GUI → rouge | § 4.3 |
| A7 | Supprimer une fixture côté GUI → rouge | § 4.3 |
| A8 | Frère absent → SKIP (test) et exit 0 (CLI) | renommer temporairement le dossier frère, ou pointer `IAKAFRAME_GUI_ROOT` sur un chemin inexistant |
| A9 | Frère absent + `--strict` → exit 1 | idem |
| A10 | `IAKAFRAME_GUI_ROOT` est honoré en priorité | pointer sur une copie contrôlée |
| A11 | La suite CLI complète reste verte, état actuel du dépôt | `node --test` : aucun échec, aucune régression |
| A12 | Le sha256 de chaque golden vendoré == sha256 du contrat **régénéré depuis les sources vivantes** | niveau 2, § 3.3 |
| A13 | `docs/commandes.md` documente le verbe | mémoire `iakaframe-doc-commandes-a-jour` |

> **A5 est le critère de recette du lot.** Une implémentation qui passe A1-A4 mais échoue A5 n'a pas
> traité la cause racine — elle a reconstruit un cliquet de format de plus.

## 6. Critère de « fini » (celui qui a coûté un cycle au lot précédent)

> **Rappel non négociable.** Tout changement touchant **une persona** (`library/personas/*.md`) ou
> **le binding** (`bindings/iakaframe-claude-default.md`) impose, **dans le même lot** :
> 1. **régénérer** les goldens — `node cli/scripts/gen-agents-golden.mjs` ;
> 2. **régénérer le déployé** — `iakaframe agents generate --global` (vérif : `--check` sort 0) ;
> 3. **re-vendorer côté GUI** les fichiers concernés (personas, binding, goldens) ;
> 4. **rejouer les deux suites** (CLI `node --test` **et** GUI `npm run test`).
>
> Ce lot-ci **ne modifie ni persona ni binding**, donc l'obligation ne devrait pas se déclencher.
> Si l'exécution en vient à toucher l'un ou l'autre, **le lot sort de son périmètre** → remonter à
> Gandalf avant de continuer. Une fois `vendor-check` livré, il devient précisément **l'outil qui
> vérifie mécaniquement l'étape 3**.

## 7. Points que SEUL le décideur tranche

1. **Le verbe s'appelle-t-il `vendor-check`** (nom du backlog, orienté outil) ou un nom orienté
   geste, cohérent avec la mémoire `iakaframe-skills-nommees-par-geste` (ex. `parite --miroir`,
   `miroir-check`) ? Le cadrage retient `vendor-check` par fidélité au backlog, mais la convention
   de nommage par geste pousse vers l'autre.
2. **`--strict` par défaut au niveau portefeuille ?** Le cadrage recommande *gracieux partout,
   `--strict` sur demande*. Le décideur peut vouloir que la machine de dev soit stricte d'office.
3. **Symétrie `+`/`−`** (mémoire `iakaframe-symetrie-ajout-suppression`) : faut-il un geste
   **d'application** (`--fix` qui re-vendore) en regard du geste de **constat** ? Le cadrage
   **recommande NON** au MVP : le re-vendorage automatique détruirait le caractère conscient du
   cliquet. Décision structurante, donc décideur.
4. **Étend-on la garde aux autres artefacts vendorés** (`vocab.json` a déjà son test ;
   `parity-kit.test.js` couvre le kit) pour en faire une garde de vendorage **unique**, ou reste-t-on
   sur une garde dédiée aux 17 fixtures d'agents ? Le cadrage recommande de **rester dédié** au MVP.

## 8. Limite assumée (à documenter, pas à corriger)

Un drift injecté **simultanément et de façon cohérente dans les deux dépôts** reste indétectable —
par construction : plus aucun référentiel externe ne permet de le juger. La garde ramène le coût
d'un drift silencieux de *« un commit dans un dépôt »* à *« deux commits cohérents dans deux
dépôts »*. C'est le résultat visé, et c'est le maximum atteignable sans dépôt tiers d'ancrage.
À inscrire en commentaire d'en-tête du test, comme le fait déjà `vocab-parity.test.js:5-7`.

## 9. Estimation (jalon P1→P2)

- **Charge** : **~1 jour-homme** (0,5 j test + verbe CLI ; 0,25 j scénario A5 ; 0,25 j doc + gate).
- **Complexité** : **faible** — patron `vocab-parity` réutilisable presque tel quel, aucune
  nouvelle dépendance, aucun changement de format.
- **Risque** : **faible**. Le seul risque réel est de livrer une garde qui **passe A5 par accident**
  (ex. comparaison ancrée sur un artefact dérivé plutôt que sur le canon) : d'où l'exigence explicite
  du niveau 2 en § 3.3.
- **Inconnues** :
  - la casse du dossier frère selon la machine (`iakaFrameGUI` / `iakaframegui`) — déjà couverte par
    la liste de candidats ;
  - la façon exacte de **scripter** l'injection du drift A5 sans salir l'arbre GUI (recommandation :
    copie temporaire du dossier fixtures dans le scratchpad + `IAKAFRAME_GUI_ROOT` pointé dessus —
    **le dépôt GUI n'est jamais muté par un test**).

## 10. Fichiers de référence

- `cli/test/vocab-parity.test.js:16-29` — patron de résolution + skip gracieux (**à copier**)
- `cli/test/parite-generateurs.test.js:22,56-59` — liste d'ids, test d'inventaire
- `cli/scripts/gen-agents-golden.mjs:10-15,28-37` — rituel de resynchronisation, format d'en-tête
- `cli/src/lib/generate-agents.js:68-80` — `generateAgent` (régénération niveau 2)
- `cli/src/lib/output.js` — convention C-JSON (`ok` en tête, collections + `count`)
- `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:24-41,130-135` — les 17
  imports vendorés + la garde sha256 qui ne prouve que la cohérence interne
