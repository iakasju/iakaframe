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

- **Dans le périmètre** : détecter qu'une des ~~**17 fixtures vendorées**~~ → **21 fixtures vendorées
  sur 6 familles** (§ 12.1) de `iakaFrameGUI` diverge de
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

Le vendorage compte **21 fixtures**, réparties en **deux natures qui n'appellent pas le même
traitement** — c'est le partage structurant de tout le lot :

**Niveau 1a — les 17 COPIES : comparaison byte-à-byte**

| # | Copie GUI (`packages/core/__tests__/fixtures/`) | Source `iakaframe` |
|---|---|---|
| 1-8 | `personas/<id>.md` | `library/personas/<id>.md` |
| 9 | `binding/iakaframe-claude-default.md` | `bindings/iakaframe-claude-default.md` |
| 10-17 | `agents-golden/<id>.md` | `cli/test/fixtures/agents-golden/<id>.md` |

**Niveau 1b — les 4 DÉRIVÉES : comparaison de frontmatter sémantique, corps exempté**

Ce ne sont **pas des copies** mais des **formes canoniques sérialisées** (frontmatter dé-wrappé,
corps réduit au titre), produites par les sérialiseurs du cœur GUI. Elles servent d'ancres de parité
de **sérialisation**. Les comparer byte-à-byte est une erreur de catégorie : elles ne sont pas
censées être identiques à leur source.

| # | Fixture dérivée | Référence pour la **détection** | Geste de **réparation** |
|---|---|---|---|
| 18 | `method.iakaframe.md` | `methods/iakaframe.md` (frontmatter) | `serializeMethodMd` |
| 19 | `method.iakaframe-wrapped.md` | `methods/iakaframe.md` (frontmatter) | `serializeMethodMd` + re-wrapping |
| 20 | `team.iakaframe-8.md` | `teams/iakaframe-8.md` (frontmatter) | `serializeTeamMd` |
| 21 | `kit.iakaframe-claude.md` | **`cli/test/fixtures/kit.iakaframe-claude.golden.md` moins son en-tête** — byte-à-byte | `iakaframe assemble iakaframe iakaframe-8 --write` |

> **Le canon reste la référence de DÉTECTION pour les quatre** : la comparaison de frontmatter
> s'ancre sur `methods/`, `teams/` — jamais sur un artefact dérivé. **Le kit est le seul cas où une
> égalité byte-à-byte est définie**, et elle l'est contre le **golden CLI**, pas contre
> `kits/iakaframe-claude.md` : le golden se déclare lui-même « ancre de parité core↔CLI calquée
> byte-à-byte » sur la fixture GUI, et `parity-kit.test.js` retire son en-tête avant de comparer.
> **`kits/iakaframe-claude.md` n'a de relation d'égalité avec aucun des deux et ne doit jamais être
> désigné comme référence.**

> **Mesure fondant ce tableau** (relevée sur disque, 2026-07-20) : `method.iakaframe.md` 11 lignes
> vs source 22 · `team.iakaframe-8.md` 9 vs 18 · `kit.iakaframe-claude.md` 9 vs `kits/…` 15, mais
> **byte-identique au golden dépouillé**. Aucune des trois n'est une copie.

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

| Contexte | Sortie `--json` | Code de sortie |
|---|---|---|
| Frère absent, test | SKIP avec raison lisible | `node --test` vert |
| Frère absent, verbe CLI | `{ ok: false, status: "skipped", reason: … }` | **0** |
| Frère absent, verbe CLI `--strict` | `{ ok: false, error: … }` | **1** |
| Frère présent, aucune dérive | `{ ok: true, status: "clean", checked: 17, derived: 4, drift: 0 }` | **0** |
| Frère présent, dérive | `{ ok: false, status: "drift", drift: N, files: [...] }` | **1** |

`--strict` existe pour l'usage portefeuille (où l'on *sait* que les deux dépôts sont là) sans jamais
pénaliser un clone isolé. **Le défaut est toujours gracieux.**

**Règle cardinale : `ok` ne vaut JAMAIS `true` sans vérification réelle.** Frère absent ⇒
`ok: false`, parce que rien n'a été comparé — et **exit 0** quand même, parce qu'on ne bloque pas un
clone isolé. Les deux signaux répondent à deux questions distinctes et ne doivent pas partager une
valeur :

| Signal | Question | Frère absent |
|---|---|---|
| **code de sortie** | *« est-ce que je te bloque ? »* | **0** — non |
| **`ok`** | *« est-ce que j'ai vérifié ? »* | **`false`** — non |

> Un consommateur ne doit jamais pouvoir écrire `if (res.ok) { … }` et en déduire que le vendorage
> est sain alors que rien n'a été comparé. `status` distingue bien `skipped` de `clean`, mais il ne
> peut pas porter seul l'information : ce n'est pas le champ que les scripts testent par réflexe.
> Le § 1.2 est intégralement préservé — il portait sur le **blocage**, jamais sur la **véracité**.

## 4. Spécification fermée

### 4.1 Résolution du dépôt frère

Ordre de résolution, **calqué sur `cli/test/vocab-parity.test.js:16-21`** :

1. `process.env.IAKAFRAME_GUI_ROOT` (chemin absolu vers la racine `iakaFrameGUI`) — **override
   AUTORITAIRE** (cf. décision ci-dessous) ;
2. `<racine iakaframe>/../iakaFrameGUI` ;
3. `<racine iakaframe>/../iakaframegui`.

**Décision de cadrage — l'override `IAKAFRAME_GUI_ROOT` est AUTORITAIRE ; jamais de repli silencieux
sur un dépôt non choisi.** *(Tranchée EN CODE par Gimli, arbitrage validé au gate Legolas, et déjà
portée comme décision opposable par `docs/commandes.md` B.4, entrée `vendor-check` : « `IAKAFRAME_GUI_ROOT`
est **autoritaire** (jamais de repli silencieux sur un autre dépôt) ».)* Quand la variable est **posée**,
elle **gouverne seule** : le dépôt qu'elle désigne est le **seul** candidat retenu. S'il est **valide**
(dossier `packages/core/__tests__/fixtures` présent), il gagne ; s'il est **absent ou invalide**, la
résolution s'arrête sur **absent** (§ 3.4) — **jamais** un repli sur les candidats 2/3. Motif :
l'opérateur qui a **explicitement** pointé un dépôt ne doit pas voir l'outil juger un **autre** dépôt
qu'il n'a pas choisi ; un faux « vert » sur un frère non désigné est **pire** qu'un SKIP honnête.

**Corollaire — « premier chemin existant gagne » ne vaut QUE pour la découverte automatique
(candidats 2/3), quand la variable n'est PAS posée.** Un chemin n'est alors retenu que si
`<candidat>/packages/core/__tests__/fixtures` existe (évite de désigner un dossier homonyme vide) ;
aucun trouvé → **absent** (§ 3.4).

### 4.2 Table des 21 fixtures (source de vérité du lot)

`IDS = ['aragorn','gandalf','gimli','helm','legolas','loki','nathalie','odin']` — **même liste et
même ordre** que le test d'inventaire de `cli/test/parite-generateurs.test.js`.

```
# 17 COPIES — comparaison byte-a-byte
personas : library/personas/<id>.md
        ↔ <GUI>/packages/core/__tests__/fixtures/personas/<id>.md
binding  : bindings/iakaframe-claude-default.md
        ↔ <GUI>/packages/core/__tests__/fixtures/binding/iakaframe-claude-default.md
golden   : cli/test/fixtures/agents-golden/<id>.md
        ↔ <GUI>/packages/core/__tests__/fixtures/agents-golden/<id>.md

# 4 DERIVEES — comparaison de frontmatter semantique, corps exempte
methode  : methods/iakaframe.md          ↔ <GUI>/.../fixtures/method.iakaframe.md
wrapped  : methods/iakaframe.md          ↔ <GUI>/.../fixtures/method.iakaframe-wrapped.md
team     : teams/iakaframe-8.md          ↔ <GUI>/.../fixtures/team.iakaframe-8.md
kit      : cli/test/fixtures/kit.iakaframe-claude.golden.md (en-tete retire)
                                         ↔ <GUI>/.../fixtures/kit.iakaframe-claude.md   [byte-a-byte]
```

**Les 17 copies** se comparent **byte-à-byte** (`Buffer.equals` ou égalité utf8 sans normalisation),
sans tolérance sur les fins de ligne : le golden est byte-identique **par contrat**.

**Les 4 dérivées** se comparent **champ à champ sur le frontmatter parsé** — jamais byte-à-byte,
sauf le **kit**, seul cas où une égalité byte est définie (contre le **golden dépouillé de son
en-tête**, cf. § 3.3).

### 4.3 Anti-régression sur le comptage

La garde **doit** échouer si l'inventaire des fixtures vendorées diffère de l'attendu — **fixture
surnuméraire ou manquante** — et pas seulement si un contenu diverge. Une persona ajoutée au canon
sans vendorage doit être rouge.

**Attendu : 21 fixtures = 17 copies + 4 dérivées.** Miroir du test d'inventaire existant. Une
anti-régression posée sur un compte inférieur validerait un dossier amputé — c'est-à-dire une garde
de comptage qui rend vert le trou qu'elle est censée fermer.

### 4.4 Message de remédiation

En cas de dérive, la sortie humaine **doit** prescrire **deux gestes distincts**, jamais un seul :

1. **Les 17 copies** → **re-vendorage par copie** (goldens 8, personas 8, binding 1) ;
2. **Les 4 dérivées** → **régénération par le sérialiseur** (§ 4.5) — **jamais une copie**.

> Le rituel d'en-tête de `cli/scripts/gen-agents-golden.mjs` ne couvre que les 8 goldens : il est
> **incomplet pour cet usage** et ne doit pas être cité seul. Un message qui noierait les dérivées
> dans « re-vendorez les 21 fichiers » conduirait l'opérateur à les **copier**, détruisant la forme
> canonique sur laquelle `methodMd`/`teamMd`/`kitMd.test.ts` sont bâtis.

### 4.5 Geste de régénération des 4 dérivées *(périmètre élargi — arbitrage du 2026-07-20)*

**Le lot livre la réparation, pas seulement la détection.** Motif : *une garde qui affiche un rouge
que personne ne sait éteindre est une garde qu'on finit par désactiver.*

**Fait mesuré** : `serializeMethodMd`, `serializeTeamMd` et `serializeKitMd` existent dans
`iakaFrameGUI/packages/core/src/frontmatter.ts` — **comme fonctions de bibliothèque, sans aucun
point d'entrée exécutable**. Côté `iakaframe`, seul `serializeKit` existe
(`cli/src/lib/library.js`). Prescrire « régénérez par le sérialiseur » sans commande fait
**retomber l'opérateur sur la copie** — le geste exact que le § 4.4 interdit.

| Dérivée | Commande |
|---|---|
| `kit.iakaframe-claude.md` | `iakaframe assemble iakaframe iakaframe-8 --write` *(chemin CLI, déjà existant)* |
| `method.iakaframe.md`, `method.iakaframe-wrapped.md`, `team.iakaframe-8.md` | **script à livrer** côté GUI (§ ci-dessous) |

**Décision de cadrage — le script vit dans `iakaFrameGUI`, pas dans le CLI.** Les sérialiseurs sont
la **référence d'implémentation** ; les porter côté CLI créerait une **seconde source de vérité**
sur le format — exactement la faute que le lot skills condamne pour `SKILL_OF`. Le script les
**importe** au lieu de les réécrire.

- **Emplacement** : `packages/core/scripts/gen-fixtures.mjs` (miroir de `cli/scripts/gen-agents-golden.mjs`).
- **Entrée** : le **canon `iakaframe`**, résolu par la **même liste de chemins candidats** que
  `vendor-check` (§ 4.1), en sens inverse.
- **Sortie** : les 3 fixtures dérivées, régénérées depuis le canon courant.
- **Symétrie** : `vendor-check` **constate** côté `iakaframe` ; `gen-fixtures` **répare** côté GUI.
  Le geste reste **conscient et explicite** — jamais de synchronisation automatique (§ 2).

| # | Critère | Vérification |
|---|---|---|
| A22 | `gen-fixtures.mjs` régénère les 3 fixtures dérivées depuis le canon ; `vendor-check` passe de rouge à vert sur elles | exécution réelle, avant/après |
| A23 | Le script **importe** les sérialiseurs du cœur, sans réimplémenter le format | revue : aucun rendu de frontmatter en propre |
| A24 | Le message de remédiation de `vendor-check` **nomme les deux commandes** exactes (§ 4.5) | sortie humaine |
| A25 | `docs/commandes.md` documente le verbe **et** le script | mémoire `iakaframe-doc-commandes-a-jour` |

## 5. Critères d'acceptation (testables)

| # | Critère | Vérification |
|---|---|---|
| A1 | Le verbe `iakaframe vendor-check` existe et est mappé | `cli/src/index.js` ; `--json` renvoie du C-JSON valide |
| A2 | **17 copies + 4 dérivées** comparées quand le frère est présent | `--json` : `checked: 17`, `derived: 4` |
| A3 | Altérer 1 octet d'une **persona vendorée** → rouge | `drift ≥ 1`, exit 1, fichier nommé |
| A4 | Altérer 1 octet du **binding vendoré** → rouge | idem |
| A5 | **Recette du lot** : drift *mutuellement cohérent* (binding + golden + sha256 recalculés ensemble) → **GUI verte** MAIS `vendor-check` **ROUGE** | reproduit l'attaque de v0.17.14 ; volets A5-a/A5-b au § 11.1 |
| A6 | Fixture surnuméraire → rouge | § 4.3 |
| A7 | Fixture supprimée → rouge | § 4.3 |
| A8 | Frère absent → SKIP (test) ; CLI `ok: false` + `status: "skipped"` + **exit 0** | `IAKAFRAME_GUI_ROOT` **posé sur un chemin inexistant/invalide** ⇒ SKIP **même si un frère `../iakaFrameGUI` réel existe** (override autoritaire, § 4.1 — pas de repli sur les candidats 2/3) ; `--json` **et** `echo $?` |
| A9 | Frère absent + `--strict` → **exit 1** | idem |
| A10 | `IAKAFRAME_GUI_ROOT` honoré en priorité | pointer sur une copie contrôlée |
| A11 | La suite CLI complète reste verte | `node --test` |
| A12 | sha256 de chaque golden vendoré == sha256 du contrat **régénéré depuis les sources vivantes** | niveau 2, § 3.3 |
| A13 | `docs/commandes.md` documente le verbe | *(absorbé par A25)* |
| A14 | Le message de remédiation prescrit **deux gestes** (copie / régénération) et ne prescrit **jamais** de copier une dérivée | sortie humaine |
| A15 | *(hygiène)* L'en-tête de `gen-agents-golden.mjs` ne laisse plus croire que re-vendorer les 8 goldens suffit | relecture — commentaire seul |
| A16 | **État initial consigné exhaustivement, fixture par fixture** : **15 dérives sur 17 copies** (`aragorn.md` et son golden seuls conformes) et **3 dérives sur 4 dérivées** (méthode, *wrapped*, team ; **kit propre**) | exécution réelle + `--json` ; le rapport de gate porte **la liste complète**, jamais un échantillon |
| A17 | Les dérivées se comparent sur le **frontmatter parsé** (égalité sémantique champ à champ), corps **exempté** | dérive de frontmatter ⇒ rouge ; re-wrapping seul ⇒ vert |
| A18 | L'écart de corps d'une dérivée est **déclaré** (`status: "derived"`), jamais silencieux ni compté en `drift` | `--json` |
| A19 | `ok: true` **implique `checked == 17` ET `derived == 4`** — l'attendu **exact**, jamais un minimum | test dédié sur les 5 contextes du § 3.4 |
| A20 | `derived` exempte **le corps seul** : une dérive de **frontmatter** d'une dérivée vaut `ok: false` + **exit 1** | altérer un champ de frontmatter ⇒ exit 1 ; altérer le corps ⇒ exit 0 |
| A21 | La référence du kit est **le golden CLI dépouillé de son en-tête**, jamais `kits/iakaframe-claude.md` | test dédié |
| A22-A25 | Geste de régénération | § 4.5 |

> **A5 est le critère de recette du lot.** Une implémentation qui passe A1-A4 mais échoue A5 n'a pas
> traité la cause racine — elle a reconstruit un cliquet de format de plus.
>
> **A16 est le critère de non-complaisance.** L'état initial est **massivement rouge** (18 fixtures
> sur 21) : c'est une dette **préexistante**, pas un échec du lot. Une garde qui sortirait verte sur
> cet état serait fausse par construction. Il interdit de « rendre vert » en re-vendorant — geste
> qui **effacerait la preuve** (§ 12.3).

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
   ~~`parity-kit.test.js` couvre le kit~~ — **FAUX, cf. encadré**) pour en faire une garde de
   vendorage **unique**, ou reste-t-on sur une garde dédiée aux ~~17 fixtures d'agents~~ **21
   fixtures** ? Le cadrage recommande de **rester dédié** au MVP.

> ⛔ **Deux prémisses de ce point rectifiées le 2026-07-20 (re-gate) — la QUESTION reste ouverte et
> intacte, seuls ses FAITS sont corrigés.** Le décideur ne doit pas trancher sur du faux.
>
> 1. **« garde dédiée aux 17 fixtures d'agents »** — périmé : le périmètre est de **21 fixtures sur
>    6 familles** (§ 12.1), dont **4 dérivées** (§ 3.3). La garde n'est déjà plus « dédiée aux
>    agents » : elle couvre méthode, team et kit. **La question posée est donc en partie déjà
>    tranchée par la spec elle-même** — ce qui reste ouvert est l'extension à `vocab.json` et aux
>    artefacts encore hors périmètre.
> 2. **« `parity-kit.test.js` couvre le kit »** — **faux**. Ce test compare la sortie de
>    `assemble()` au **golden local** `cli/test/fixtures/kit.iakaframe-claude.golden.md` ; il ne
>    regarde **jamais** la copie GUI. Il verrouille la parité **sérialiseur CLI ↔ golden**, pas le
>    **vendorage**. Le kit n'était donc couvert par **aucune** garde de vendorage — c'est
>    précisément pourquoi il entre dans le périmètre de ce lot (A21).
>
> *(Ce point avait été identifié comme candidat D4 et laissé intact faute de mandat ; le re-gate
> l'a classé **tolérable** et distinct de D4. Seuls les faits sont amendés.)*

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
- `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:24-41,130-135` — les ~~17~~
  **17 imports de ce fichier** + la garde sha256 qui ne prouve que la cohérence interne. ⛔ **Ce
  fichier ne voit PAS tout le vendorage** : les 4 fixtures méthode / team / kit / méthode *wrapped*
  sont consommées **ailleurs** — `kitMd.test.ts`, `teamMd.test.ts`, `methodMd.test.ts` (§ 12.1). Les
  ajouter à cette liste de référence :
- `~/work/iakaFrameGUI/packages/core/__tests__/kitMd.test.ts`, `teamMd.test.ts`, `methodMd.test.ts` —
  les **4 fixtures oubliées** de l'inventaire d'origine, dont les **2 de méthode déjà en dérive**

---

## 11. Note additive — levées du gate Legolas (2026-07-19)

> Ajout **postérieur** à l'analyse ci-dessus, qui reste inchangée sauf mention contraire.

### 11.1 A5 — critère **scindé** : il était non rejouable en l'état (levée B-3)

**Contradiction relevée, et fondée.** Le § 5 (A5) exige d'observer « **GUI verte MAIS `vendor-check`
rouge** », tandis que le § 9 impose de **confiner** l'injection du drift au scratchpad pour ne jamais
muter le dépôt GUI. Les deux sont **incompatibles** : la suite GUI importe ses fixtures par **chemin
figé** (`parite-generateurs.test.ts:24-41`, imports `?raw` statiques). Un drift confiné dans le
scratchpad est donc **invisible de vitest** — « GUI verte » deviendrait vrai **par construction**,
et ne prouverait strictement **rien**.

**Tranché : A5 est scindé en deux volets de nature différente.**

**A5-a — volet AUTOMATISÉ (permanent, dans la suite)**

Injection d'un drift *mutuellement cohérent* (binding + golden + sha256 recalculés ensemble) dans une
**copie scratchpad** des ~~17~~ **21** fixtures (§ 12.1), `IAKAFRAME_GUI_ROOT` pointé dessus.

| Attendu | Vérification |
|---|---|
| `vendor-check` sort **1** et nomme les fichiers dérivés | exit code + `--json` |
| Le dépôt GUI réel n'est **jamais** muté | `git -C <GUI> status --porcelain` vide avant/après |

> C'est **ce volet qui est rejoué à chaque exécution** : il verrouille la seule chose qui doit l'être
> en permanence — **`vendor-check` détecte le drift cohérent**.

**A5-b — volet RECETTE MANUELLE (one-shot, documenté)**

Drift réel injecté dans le dépôt GUI, observation des **deux couleurs**, puis `git checkout` de
revert. Exécuté **une fois**, à la livraison du lot ; **consigné** (date, commande, sortie des deux
suites, confirmation du revert) dans l'instruction ou le rapport de gate.

| Attendu | Vérification |
|---|---|
| Suite GUI **verte** malgré le drift | `npm run test` côté GUI |
| `vendor-check` **rouge** sur le même état | exit 1 |
| Arbre GUI **propre** après revert | `git status --porcelain` vide |

**Pourquoi ce découpage plutôt que « copier le dépôt GUI entier »** — j'ai écarté l'option
d'automatiser intégralement A5 en dupliquant tout `iakaFrameGUI` dans le scratchpad : elle exigerait
d'y installer les dépendances pour exécuter vitest, soit un coût et une fragilité sans rapport avec
le bénéfice. Et surtout : **le fait « un drift cohérent laisse la GUI verte » est déjà établi** —
Legolas l'a démontré au gate v0.17.14 (475/475). Ce n'est pas un **risque de régression** à surveiller
en continu, c'est un **constat de conception** ; le re-prouver à chaque run n'apporte rien. Ce qui
doit être gardé en permanence, c'est l'**autre moitié** : que `vendor-check` reste rouge. D'où
A5-a automatisé, A5-b en recette.

> **Si un jour une CI héberge les deux dépôts**, A5-b pourra être automatisé sans changer A5-a.

**Impact estimation : +0,25 j-h sur le lot 1** (~1 → **~1,25 j-h**) — rédaction du protocole A5-b et
consignation de son exécution.

### 11.2 § 4.4 — le rituel cité ne documente que 8 fichiers, pas 17 (levée non bloquante)

Le § 4.4 renvoie à `cli/scripts/gen-agents-golden.mjs:10-15` comme documentant le re-vendorage. **Ce
rituel ne couvre que les 8 goldens** (`:12-14` : `cp cli/test/fixtures/agents-golden/*.md → …`). Il
**ne mentionne ni les 8 personas ni le binding**, alors que la garde en compare **17**.

**Correction du § 4.4** : le message de remédiation de `vendor-check` doit énumérer les **trois**
familles à re-vendorer — **goldens (8)**, **personas (8)**, **binding (1)** — et **ne pas se contenter
de renvoyer** au commentaire de `gen-agents-golden.mjs`, qui est **incomplet pour cet usage**.

| # | Critère ajouté | Vérification |
|---|---|---|
| **A14** | ~~Le message de remédiation cite les **3 familles** (goldens, personas, binding) et le compte **17**~~ → ⛔ **AMENDÉ, voir A14 rév. ci-dessous** | sortie humaine en cas de dérive |

> ⛔ **A14 AMENDÉ le 2026-07-20 (gate Legolas, D3) — la rédaction ci-dessus est PÉRIMÉE.**
> Le § 12.1 a établi que la garde surveille **21 fixtures sur 6 familles**, mais A14 était resté
> chiffré sur **3 familles / 17**. Appliqué à la lettre, il fait dire à l'outil de re-vendorer
> **17 fichiers dans 3 familles** alors que la garde en juge **21 sur 6** : l'opérateur re-vendore,
> relance, **la garde reste rouge** sur méthode / team / kit — et il n'a aucun moyen de comprendre
> pourquoi, puisque le message qu'il vient de suivre lui a affirmé avoir tout couvert.
> **C'est exactement le défaut qu'A14 avait été créé pour réparer** (§ 11.2 : un rituel incomplet qui
> laisse croire que re-vendorer les 8 goldens suffit), réinstallé un cran plus haut. La clause de
> primauté du § 12 **ne suffit pas ici** : A14 est un critère **chiffré**, destiné à être implémenté
> et testé tel quel — un exécutant code le message d'après A14, pas d'après un § de doctrine.

| # | Critère | Vérification |
|---|---|---|
| ~~**A14 rév.**~~ | ⛔ **PÉRIMÉ — comptait « 20 paires + 1 dérivée ». Le partage réel est 17 copies + 4 dérivées.** Version en vigueur : **A14 au § 5**, spécifiée par le § 4.4 (deux gestes distincts) | — |

> **Le traitement distinct de la dérivée est la partie non négociable d'A14 rév.** Un message qui
> noierait `method.iakaframe-wrapped.md` dans « re-vendorez les 21 fichiers » conduirait l'opérateur
> à la **copier telle quelle** depuis `methods/iakaframe.md` — détruisant du même coup la **variante
> de wrapping** qui est sa seule raison d'exister, et faisant disparaître le test que la GUI construit
> dessus. Le message doit donc porter **deux gestes**, pas un seul avec un compte plus gros.
| **A15** | *(hygiène)* L'en-tête de `gen-agents-golden.mjs:10-15` est complété pour ne plus laisser croire que re-vendorer les 8 goldens suffit | relecture — **modification de commentaire uniquement** |

> A15 sort littéralement du périmètre « garde », mais laisser un rituel **incomplet** dans le fichier
> que tout exécutant lit en premier reviendrait à réinstaller la cause racine par la doc.

---

## 12. État du vendorage, dépendances et estimation

> Réécrit le 2026-07-20 après trois passages de gate. Les valeurs ci-dessous sont **les valeurs en
> vigueur**, énoncées **une seule fois**, chacune accompagnée de **la mesure qui la fonde**
> (règle (d), § A.4). L'historique des rédactions successives n'est pas conservé : ce qui devait
> survivre — **les décisions et leurs motifs** — est en **annexe A**. La version antérieure reste
> récupérable par git.

### 12.1 Inventaire mesuré du vendorage

**21 fixtures**, sur 6 familles, **toutes réellement consommées** par la suite GUI —
`parite-generateurs.test.ts` importe les 17 copies, `methodMd.test.ts` les deux fixtures de méthode,
`teamMd.test.ts` la team, `kitMd.test.ts` le kit.

| Famille | Compte | Nature | Réf. de détection |
|---|---|---|---|
| personas | 8 | copie | `library/personas/<id>.md` |
| goldens | 8 | copie | `cli/test/fixtures/agents-golden/<id>.md` |
| binding | 1 | copie | `bindings/iakaframe-claude-default.md` |
| méthode | 1 | **dérivée** | `methods/iakaframe.md` (frontmatter) |
| méthode *wrapped* | 1 | **dérivée** | `methods/iakaframe.md` (frontmatter) |
| team | 1 | **dérivée** | `teams/iakaframe-8.md` (frontmatter) |
| kit | 1 | **dérivée** | golden CLI dépouillé (byte-à-byte) |

**= 17 copies + 4 dérivées.** Détail du traitement : § 3.3 (natures) et § 4.2 (table normative).

### 12.2 État initial mesuré — **18 fixtures sur 21 sont déjà en dérive**

| Ensemble | Dérives | Conformes |
|---|---|---|
| **17 copies** | **15** — 7 personas + 7 goldens + le binding | **2** — `aragorn.md` **et son golden** |
| **4 dérivées** | **3** — méthode, *wrapped*, team | **1** — **kit** |

**Mesures fondant ces chiffres** (relevées sur disque, 2026-07-20) :

- **binding** — la fixture porte `odin: [Read, Grep, Glob, Bash]` et `helm: [Read, Grep, Glob, Bash]`,
  quand la source porte `Task` pour Odin et `Write` pour Helm (livrés en phase 1) → **dérivée** ;
- **aragorn** — frontmatter de la fixture **identique** à `library/personas/aragorn.md` ; seul
  re-vendoré, au lot v0.17.14 → **conforme**, lui et son golden ;
- **7 autres personas** — modifiées par la phase 1 (Odin, Helm, Loki, Gimli, Legolas, Nathalie,
  Gandalf), jamais re-vendorées → **dérivées**, goldens compris ;
- **méthode** — 14 `principleIds` vendorés contre **18** à la source ; manquent
  `interruption-minimale-odin`, `merge-versionnement` et les deux principes nés de la phase 1 ;
- ***wrapped*** — **16** contre 18 ; manquent `canon-avant-citation` et `preuve-avant-declaration` ;
- **team** — la fixture porte `guardrails: [identity, perimeter, delegation]`, la source `[]` :
  dérive **sémantique de frontmatter**, pas seulement de sérialisation → **rouge légitime** ;
- **kit** — golden CLI **dépouillé de son en-tête** byte-identique à la fixture GUI → **propre**.

> **Ce n'est pas un incident isolé : c'est ~86 % du vendorage qui a décroché**, et **rien ne le
> signale**. Le lot livre la **garde** ; le re-vendorage est le lot suivant. Conséquences à assumer :
> la sortie du premier lancement sera **massivement rouge** — c'est **attendu** (A16) — et le lot de
> réparation est **bien plus lourd** qu'estimé jusqu'ici : 15 copies **et** 3 régénérations.

### 12.3 Contrainte d'ordre — la garde AVANT le re-vendorage

Re-vendorer d'abord **effacerait la preuve sans traiter la cause** : un drift mutuellement cohérent
laisse **475/475 tests GUI verts** (démontré au gate v0.17.14), et une fois les copies rafraîchies,
plus rien ne témoigne du trou. On poserait la garde sur un état **artificiellement propre**, sans
avoir jamais observé qu'elle détecte quoi que ce soit — donc **sans l'avoir recettée**. **A16**
matérialise cette contrainte en critère.

### 12.4 Dépendances

> La phase 1 a établi que déclarer un **rang** oblige à renuméroter tous les fichiers dès qu'un lot
> bouge. Ce lot déclare donc ses **dépendances**.

| Nature | Contenu |
|---|---|
| **Dépend de** | **rien**. Exécutable immédiatement. |
| **Est prérequis de** | le re-vendorage des 21 fixtures · le lot **roster** (`roleKey`) · le lot **skills** |
| **Ne doit PAS être précédé par** | le re-vendorage (§ 12.3) |

### 12.5 Estimation — **révisée intégralement** (jalon P1→P2)

Chiffrage **neuf**, pas un ajustement : le reclassement `17+4` a changé les postes, et l'outillage
de régénération (§ 4.5) élargit le périmètre du lot.

| Poste | Charge | Commentaire |
|---|---|---|
| Garde : résolution du frère, 17 comparaisons byte, verbe CLI, C-JSON | 0,5 j-h | patron `vocab-parity` réutilisable |
| **2ᵉ mode de comparaison** : frontmatter sémantique pour les 4 dérivées (A17/A18/A20) | 0,4 j-h | le vrai coût technique — deux familles de règles, pas une boucle |
| Cas particulier du kit : dépouillement d'en-tête + ancrage sur le golden (A21) | 0,15 j-h | règle propre à une seule fixture |
| Anti-régression d'inventaire + invariants `ok`/`checked` (A19) | 0,2 j-h | — |
| Recette A5-a (automatisée) + A5-b (manuelle, consignée) | 0,35 j-h | inchangé |
| **Consignation exhaustive de l'état initial (A16)** | 0,2 j-h | 21 fixtures, fixture par fixture |
| **Geste de régénération (§ 4.5, A22-A25)** — script GUI important les sérialiseurs, résolution du canon, 3 fixtures | **0,6 j-h** | **poste entièrement nouveau** |
| Message de remédiation à deux gestes (A14) + doc (A25) + gate | 0,25 j-h | — |
| **Total** | **~2,5 à 2,75 j-h** | *(contre ~1,25 au premier chiffrage)* |

- **Complexité : moyenne** *(relevée de « faible »)*. Le lot n'est plus une boucle de comparaison :
  il porte **deux modes de comparaison**, **une exception** (le kit), et **un producteur** vivant
  dans l'autre dépôt.
- **Risque : moyen** *(relevé de « faible »)*. Trois risques nommés :
  1. traiter une dérivée **comme une copie** — c'est la faute qui a coûté ce 3ᵉ gate ; bornée par
     A2/A17/A20 ;
  2. livrer une garde **rouge sans remède** — bornée par le § 4.5 ;
  3. « rendre vert » en re-vendorant pendant le lot — bornée par A16 et le § 12.3.
- **Inconnues** :
  - **égalité sémantique de frontmatter** : `parseFrontmatter` (`cli/src/lib/frontmatter.js`)
    suffit-il à comparer des listes re-wrappées sans faux positif ? **À confirmer en ouverture** —
    c'est le cœur technique du lot ;
  - **import des sérialiseurs GUI depuis un script `packages/core/scripts/`** — pratiqué ailleurs,
    mais **non vérifié** pour ce cas ;
  - **le compte de fixtures peut bouger** si la GUI en ajoute → d'où l'anti-régression du § 4.3 ;
  - **la fixture *wrapped* exige un re-wrapping**, pas seulement une sérialisation : la forme exacte
    du wrapping attendu par son test **n'a pas été spécifiée ici** et reste à établir en ouverture.

---

# Annexe A — Décisions rendues et leurs motifs

> **Trace d'arbitrage.** Conservée ici plutôt qu'en couches d'amendements dans le corps : ce qui doit
> survivre est **ce qui a été décidé et pourquoi**, pas l'historique typographique des rédactions.
> Les valeurs en vigueur sont dans le corps ; cette annexe ne les redéfinit jamais.

### A.1 `ok` ne vaut jamais `true` sans vérification réelle *(décideur, 2026-07-20)*

**Défaut** : `ok = frereAbsent ? true : verdictReel` — la forme exacte mise en accusation au cas 3
du § A.3 (`orphans = hasCoordinator ? [] : uncoveredRoles`). Sur `ok` et le code de sortie, *« la
garde n'a jamais tourné »* était indistinguable de *« le vendorage est sain »*. **La garde échouait
à sa propre règle (c).**

**Décision** : frère absent → `ok: false`, `status: "skipped"`, **exit 0 conservé**. Le code de
sortie répond *« est-ce que je te bloque »*, `ok` répond *« est-ce que j'ai vérifié »* — deux
questions qui ne partagent plus une valeur. Le clone isolé reste gracieux ; `--strict` ne devient
pas le défaut. → § 3.4, A8, A19.

### A.2 Les fixtures méthode / team / kit sont des dérivées, pas des copies *(gate, 2026-07-20)*

**Défaut** : elles avaient été déclarées « paires byte-à-byte » **sans mesure**. Mesuré : 11 vs 22
lignes, 9 vs 18, 9 vs 15. Ce sont des **formes canoniques sérialisées**.

**Pourquoi c'était disqualifiant** : `checked: 20` était **inatteignable** (3 rouges structurels
permanents) ; le message de remédiation prescrivait de **copier** méthode/team/kit, écrasant la
forme canonique sur laquelle trois suites de tests sont bâties ; et les 3 dérivées ne relevaient
d'**aucun statut**. → § 3.3, § 4.2, A2/A17/A20/A21.

**Cas du kit** : sa référence est le **golden CLI dépouillé de son en-tête** — le golden se déclare
lui-même « ancre de parité core↔CLI calquée byte-à-byte » sur la fixture GUI.
`kits/iakaframe-claude.md` n'a de relation d'égalité avec **aucun** des deux. → A21.

### A.3 La classe de défaut que ce lot ferme — **la garde se trompe en silence et affiche vert**

Quatre occurrences, trouvées séparément, dans des zones sans rapport apparent :

| # | Défaut | Ce qu'affichaient les tests |
|---|---|---|
| 1 | **Contrat fantôme** (v0.17.14) — drift cohérent à travers binding + golden + sha256 recalculés ensemble | **475/475 verts** |
| 2 | **Fixture *wrapped*** — déclarée « copie CONFORME » par son propre test, corps tronqué | **vert** |
| 3 | **Absorption par le coordinateur** — `orphans = hasCoordinator ? [] : uncoveredRoles` fait absorber 5 rôles sur 8 par Aragorn | **vert**, `orphans == []` |
| 4 | **Auto-contrôle de cette spec** — règle (a) déclarée ✅ sur un fait non mesuré (§ A.4) | **✅** |

Dans les quatre cas **une garde existait et tournait**. Elle se trompe parce qu'elle **compare un
artefact à lui-même** (1), **prend une déclaration pour une vérification** (2), laisse un **repli
légitime absorber la panne** (3), ou **applique une règle juste à un fait faux** (4).

**Trois règles opposables à toute garde de ce dépôt, y compris celle-ci :**

- **(a)** une garde s'ancre sur un référentiel **qu'elle ne contrôle pas** → niveau 2 (§ 3.3),
  ancrage sur le canon, jamais sur un dérivé ;
- **(b)** une garde doit avoir été **vue rouge** sur un défaut réel avant d'être crue → A16, A5-b,
  et la contrainte d'ordre du § 12.3 qui existe **pour** rendre (b) possible ;
- **(c)** un repli gracieux ne rend **jamais** un échec indistinguable d'un succès → A19 (`ok`),
  A18/A20 (`derived` n'exempte que le corps).

### A.4 Règle (d) — **une garde ne vaut que ce que vaut le fait sur lequel elle s'applique**

Le premier auto-contrôle avait déclaré la règle (a) ✅ tenue au motif que méthode/team/kit
« s'ancrent sur le canon ». **Assertion fausse et non mesurée** : les quatre désignations de source
étaient erronées — trois pointaient un fichier qui n'est pas la référence, la quatrième
(`kits/iakaframe-claude.md`) un fichier sans **aucune** relation d'égalité avec sa copie.
*(Formulation antérieure « trois sur quatre, et la quatrième… » : auto-contradictoire — tranché,
c'est **quatre sur quatre**.)*

> Les règles (a), (b) et (c) portent sur la **forme** du dispositif. Elles sont toutes trois
> **satisfaisables sur des données fausses**. Vérifier qu'une garde « s'ancre sur le canon » ne
> prouve rien tant qu'on n'a pas **mesuré que le fichier désigné est bien le canon de cette
> fixture**.
>
> **Conséquence opposable** : tout verdict d'auto-contrôle **cite la mesure** qui le fonde — compte,
> diff, byte-parité constatée — jamais la seule intention de conception. Un ✅ sans mesure est une
> **déclaration**, et le cas 2 a établi qu'une déclaration prise pour une vérification est
> précisément le défaut.

**Verdict courant des quatre règles sur la spec réécrite** *(mesures : § 12.1 et § 12.2)* :

| Règle | Verdict | Mesure / mécanisme |
|---|---|---|
| **(a)** ancrage non contrôlé | ✅ **tenue** | Références **mesurées** fixture par fixture (§ 12.1) : canon pour les 17 copies et les 3 dérivées de frontmatter ; **golden dépouillé** pour le kit, byte-parité constatée. La désignation fautive est corrigée à la source. |
| **(b)** vue rouge avant d'être crue | ✅ **tenue** | A16 exige la consignation **exhaustive** des **18 dérives sur 21** ; A5-b la recette manuelle. |
| **(c)** repli non masquant | ✅ **tenue** | A19 (`ok: true` ⟹ `checked == 17` ET `derived == 4`) ; A20 (`derived` n'exempte que le corps). |
| **(d)** fait mesuré | ✅ **tenue** | Chaque chiffre du § 12.1-12.2 est accompagné de sa mesure ; aucun n'est repris d'un rapport. |

### A.5 Le lot livre la réparation, pas seulement la détection *(décideur, 2026-07-20)*

**Défaut** : les sérialiseurs n'existent que comme fonctions de bibliothèque, **sans point
d'entrée**. Prescrire « régénérez par le sérialiseur » sans commande fait retomber l'opérateur sur
la **copie** — le geste destructeur que le § 4.4 interdit.

**Décision** : le lot livre le geste. **Motif** : *une garde qui affiche un rouge que personne ne
sait éteindre est une garde qu'on finit par désactiver.* → § 4.5, A22-A25.

**Ce qui n'était PAS en cause** : la **détection** n'a pas de trou — le canon reste la référence de
comparaison sémantique. Ce qui manquait était la **réparation**.

### A.6 Points de forme tranchés

- **Pointeurs `chemin:ligne`** : les §§ 1-11 en portent plusieurs dizaines, dont une partie est
  périmée par la phase 1. Ils sont **présumés faux** et doivent être revérifiés avant usage. Toute
  rédaction nouvelle cite **par nom de section ou de symbole**. Dette inscrite au backlog projet.
- **§ 7 point 4** : deux prémisses corrigées sans toucher à la question — la garde n'est plus
  « dédiée aux 17 fixtures d'agents » (21, 6 familles), et `parity-kit.test.js` **ne couvre pas** le
  vendorage du kit (il compare `assemble()` à un golden local et ne regarde jamais la copie GUI).
- **D4** : l'énoncé du 4ᵉ défaut du premier gate est **définitivement perdu** (agent porteur mort
  avant restitution). Le fichier a été **re-gaté de bout en bout** à la place ; le disqualifiant du
  § A.2 est le produit de cette re-dérivation.

### A.7 La fixture *wrapped* — fait mesuré à ne pas perdre

**Note conservée — la fixture *wrapped*.** Variante de wrapping volontaire de `methods/iakaframe.md`,
servant à prouver que le parseur GUI absorbe un frontmatter re-wrappé. Le backlog l'avait déclarée
« copie CONFORME » à tort : **son frontmatter est lui aussi en dérive** (16 `principleIds` contre 18
— manquent `canon-avant-citation` et `preuve-avant-declaration`), et son corps est tronqué. Seule la
troncature du corps avait été correctement identifiée.

> **Pourquoi ce fait doit rester écrit.** A17 exige de comparer le frontmatter *wrapped* à celui de
> la source. Un exécutant croyant la fixture saine la verrait rouge, en conclurait que **son
> comparateur** est en tort, et l'ajusterait — normalisation, tolérance sur les listes, exclusion de
> champ — **jusqu'au vert**. Il aurait alors écrit de bonne foi une garde calibrée sur un état
> dérivé : le contrat fantôme réinstallé **par la spec elle-même**. Une spec qui affirme un état sain
> là où l'état est dérivé ne produit pas une erreur d'implémentation, elle produit **une garde fausse
> qui affiche vert**.
>
> **État attendu au premier lancement : la fixture *wrapped* est ROUGE au frontmatter**, comme
> `method.iakaframe.md`. C'est un constat de dette préexistante — **surtout pas** un signal
> d'ajuster le comparateur.

> **Ce que le lot NE fait PAS** : corriger la déclaration mensongère du test GUI
> (`methodMd.test.ts`, commentaire « copie CONFORME »). Correction dans l'autre dépôt, hors
> périmètre ; elle reste à l'item de backlog dédié. Le lot **rend l'écart visible**, rien de plus.

*Fin de l'annexe A. Fin du document.*
