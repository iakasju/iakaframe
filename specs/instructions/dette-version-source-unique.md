# Instruction — Dette : source unique de vérité de version

> Cadrage P1 (Gandalf). Statut : **PROPOSITION**, en attente d'arbitrage du décideur.
> Périmètre : réconcilier les versions divergentes du dépôt iakaframe autour d'une
> autorité unique + poser une garde anti-re-divergence. **Aucun code écrit à ce stade.**

## 1. Contexte & problème

Deux chiffres censés désigner « la version d'iakaframe » divergent lourdement :

- `cli/package.json` (champ `version`) = **`0.1.0`**
- `specs/etat-des-lieux.md` (ligne du tableau *Etat courant*, champ *Version*) = **`v0.6.1`**

Le constat de départ sous-estime le problème : il n'y a pas **deux** mais **trois** lignées
de version, indépendantes et non câblées entre elles, dont l'une a **silencieusement régressé**
(de `v0.19.0` retombée à `v0.6.1`). Poser le problème avant la solution impose d'abord
d'établir les faits.

## 2. Faits établis (lecture seule)

### 2.1 Inventaire des sources de vérité

> Pointeurs donnés par **chemin + nom de section / de fonction / de champ** (les
> `chemin:ligne` étant réputés fragiles). Les numéros de ligne relevés au cadrage sont
> indicatifs et à revérifier à l'exécution.

| # | Source | Valeur constatée | Nature | Qui la lit / l'écrit |
|---|---|---|---|---|
| S1 | `cli/package.json`, champ `version` | `0.1.0` | **Manifeste npm** (jamais bumpé) | Lu par `frameworkVersion()` (dernier fallback) et par `cli/scripts/bundle.js` |
| S2 | `cli/src/index.js`, constante `VERSION` | `0.1.0` | **Copie codée en dur** | Alimente le bandeau `HELP` (`iakaframe v${VERSION}`) et la commande `-v` / `--version` / `version` |
| S3 | Tags git (`.git/packed-refs`) | dernier = `v0.6.1` (aussi `v0.5.0`, `v0.6.0`) | **Actes de release** | Lu par `snapshot.js` via `git describe --tags --abbrev=0` |
| S4 | `specs/etat-des-lieux.md`, tableau *Etat courant* → champ *Version* | `v0.6.1` | **Dérivé** (généré) | Écrit par `doSnapshot()` (`snapshot.js`) ; **relu** par `frameworkVersion()` et `bundle.js` comme source primaire |
| S5 | `specs/etat-des-lieux.html` | `v0.6.1` | **Dérivé** (miroir HTML) | Écrit par `doSnapshot()` |
| S6 | `specs/.iakaframe-journal.json`, champ `version` de chaque entrée | historique `v0.6.1 → v0.19.0 → v0.6.1` | **Journal append-only** | Écrit/relu par `doSnapshot()` ; alimente la table *Journal* |
| S7 | `cli/_bundled/VERSION` | (dérivé, régénéré au pack) | **Artefact de publication** | Écrit par `bundle.js` depuis l'état des lieux ; lu par `frameworkVersion()` (fallback intermédiaire — cf. § 2.4 remarque) |
| S8 | Marqueur `.iakaframe` déposé chez les projets cibles (`init.js`, ligne `iakaframe=<version>`) | reflète S4 → `v0.6.1` | **Empreinte du kit déployé** | Écrit par `runInit()` via `frameworkVersion()` |
| S9 | `frames/releases/StefFrame2/cli/package.json`, champ `version` | `0.1.0` | **Miroir vendoré figé** d'une release | Aucun runtime actif — instantané gelé |

### 2.2 D'où vient le `v0.6.1`

`doSnapshot()` (`snapshot.js`) calcule la version ainsi : si un `--version` explicite est
fourni, il l'utilise ; **sinon** il retombe sur `git describe --tags --abbrev=0`, qui rend
le **dernier tag git atteignable**. Les tags s'arrêtant à `v0.6.1` (S3), toute cloture
récente **sans `--version`** réécrit `v0.6.1` dans l'état des lieux, le HTML et le journal.

### 2.3 D'où vient le `0.1.0`

`package.json` (S1) et la constante codée en dur `VERSION` d'`index.js` (S2) n'ont **jamais
été bumpés** depuis l'échafaudage initial. Ils sont figés à la valeur de scaffold. Ce sont
**deux copies indépendantes** de la même intention (« version du paquet CLI »), qu'aucun
mécanisme ne maintient synchrones — piège de dérive classique.

### 2.4 Pourquoi elles ont divergé (diagnostic)

Trois lignées jamais reliées à une source unique :

1. **Lignée npm (S1+S2)** : maintenue à la main, jamais touchée → **gelée à `0.1.0`**.
2. **Lignée tags git (S3)** : la discipline de tag s'est **arrêtée à `v0.6.1`**.
3. **Lignée état-des-lieux / journal (S4+S6)** : pilotée par l'argument `--version` passé à
   chaque cloture `version`. Elle a **réellement grimpé jusqu'à `v0.19.0`** (visible dans le
   journal et dans des messages de commit type *« update … (version v0.18.0) »*). Puis, dès
   qu'une cloture a **omis `--version`**, le fallback `git describe` a rendu `v0.6.1` : la
   version affichée a **régressé silencieusement de `v0.19.0` à `v0.6.1`**.

**Symptôme le plus grave** : la régression silencieuse. L'état des lieux **sous-déclare**
l'avancement réel du projet, et cette valeur fausse **se propage** vers le bundle (S7) et
vers l'empreinte déposée chez les projets cibles (S8).

> Remarque secondaire (dette annexe, à confirmer à l'exécution) : le commentaire de
> `frameworkVersion()` évoque `_bundled/VERSION` alors que le code lit `<root>/VERSION`.
> Écart de commentaire vs code, non bloquant ; à trancher dans le même geste.

## 3. Décisions structurantes — arbitrage du décideur requis

Ces points **ne sont pas tranchés ici** (Gandalf propose, le décideur tranche). Ils
remontent à Aragorn.

- **D1 — Autorité.** Quelle source fait foi ? (reco § 4 : `package.json`.)
- **D2 — Valeur cible.** Sur quel chiffre réconcilier ? Options :
  - (a) **Adopter le point haut réel** atteint dans le journal — `v0.19.0` — car ce travail
    a réellement eu lieu ; puis repartir en `v0.20.0` au prochain lot. **← recommandé.**
  - (b) S'aligner sur le dernier tag `v0.6.1`.
  - (c) Déclarer une **base neuve** explicite.
  > Reco : (a). Réinitialiser à `0.1.0` ou `v0.6.1` **effacerait** de l'historique réel ;
  > c'est un choix de récit de version, il appartient au décideur.
- **D3 — Rétro-tags.** Faut-il fabriquer a posteriori les tags manquants
  (`v0.7.0`…`v0.19.0`) ? **Reco : non** — ne pas poser de tags historiques sur des commits
  incertains ; ne tagger que **la cible, sur `HEAD`**, et repartir proprement.
- **D4 — Format.** `package.json` impose le semver **nu** (`0.19.0`) ; l'état des lieux et
  les tags utilisent le préfixe `v` (`v0.19.0`). La règle de propagation doit **normaliser**
  (ajout/retrait du `v`) de façon déterministe. Reco : autorité en semver nu, préfixe `v`
  ajouté à l'affichage/aux tags.
- **D5 — Miroir figé S9.** `frames/releases/StefFrame2` reste-t-il gelé ? **Reco : hors
  scope** — instantané de release, on n'y touche pas.

## 4. Autorité proposée & règle de propagation

**Autorité proposée : `cli/package.json`, champ `version` (S1).** Justification :

- c'est **l'identité réelle** du paquet publié (`@naonedge/iakaframe`, `publishConfig` vers
  le registre npm Forgejo) ;
- c'est ce que `npm version` / `npm publish` utilisent — outillage atomique bump + tag ;
- cela permet de **supprimer la copie codée en dur** d'`index.js` (S2), pure source de
  dérive ;
- les **tags git deviennent un miroir** (créé au moment du release depuis `package.json`),
  et le fallback `git describe` de `snapshot.js` reste comme **filet**, non comme source.

**Dérivées à propager depuis l'autorité :**

- **S2** (`index.js`) : ne plus coder la version en dur — la **lire** depuis `package.json`.
- **S3** (tag git) : créé au release à partir de la valeur d'autorité (`v` + semver).
- **S4/S5/S6** (état des lieux, HTML, journal) : renseignés par `doSnapshot()` en lisant
  l'autorité quand `--version` n'est pas fourni (au lieu de `git describe` seul).
- **S7/S8** (bundle, marqueur kit) : dérivent mécaniquement des précédentes.

> Alternative écartée : faire de **l'état des lieux** l'autorité — rejetée, car c'est un
> **artefact généré** ; ériger un rapport en source inverse le sens de la dérivation.
> Alternative recevable mais non recommandée : **les tags git** comme autorité (git-natif,
> immuable) — pénalisée par la copie codée en dur à lire dynamiquement et par la publication
> npm qui reste à câbler.

## 5. Règle de réconciliation (cible à écrire)

> Détail d'implémentation laissé à l'exécution (Gimli) ; ci-dessous le **contrat** à tenir.

1. **Fixer l'autorité** : écrire la valeur cible (D2, ex. `0.19.0`) dans `cli/package.json`.
2. **Dé-dupliquer S2** : dans `index.js`, remplacer `const VERSION = '0.1.0'` par une
   **lecture de `package.json`**. Approche recommandée, cohérente avec le code existant
   (`frameworkVersion()` procède déjà ainsi) : `fs.readFileSync` + `JSON.parse` d'un chemin
   résolu depuis `import.meta.url` — **sans flag expérimental**, compatible `node >=20`
   (cf. `engines`). Les import attributes `with { type: 'json' }` ne sont stables qu'à partir
   de Node 22 : à **écarter** ici pour ne pas remonter le plancher moteur (cf. sources § 9).
3. **Câbler `snapshot.js`** : quand aucun `--version` n'est passé, lire l'autorité
   (`package.json`) **avant** de retomber sur `git describe` — supprime la voie de la
   régression silencieuse.
4. **Créer le tag cible** sur `HEAD` (D3) pour que `git describe` **concorde** avec
   l'autorité.
5. **Régénérer les dérivées** : `iakaframe update` (ou `snapshot`) pour réécrire
   `etat-des-lieux.md` + `.html` + journal avec la valeur d'autorité ; le bundle et le
   marqueur kit suivent.
6. **Normaliser le préfixe `v`** (D4) partout où l'affichage l'exige.

## 6. Garde anti-re-divergence (le livrable de valeur)

Ajouter au moins un **test** (la suite CLI en compte déjà ~476, motif « guard-*-regression »
existant) qui **échoue** si les lecteurs de version se désalignent de l'autorité :

- **G1 (obligatoire)** — `package.json.version` (nu) === version rendue par la commande `-v`
  d'`index.js` === version stampée par `frameworkVersion()` (préfixe `v` normalisé). Un seul
  chiffre, plusieurs lecteurs, égalité asserted.
- **G2 (recommandé)** — au release, le tag git créé === `v` + `package.json.version` (garde
  côté outillage de release plutôt que test unitaire, si le décideur veut aller jusque-là).
- **G3 (optionnel)** — garde sur `snapshot.js` : sans `--version`, la version écrite provient
  de l'autorité, jamais d'un `git describe` en retrait de l'autorité (empêche la régression).

## 7. Périmètre

**Dans le scope :**
- `cli/package.json` (valeur d'autorité), `cli/src/index.js` (dé-duplication S2),
  `cli/src/commands/snapshot.js` (câblage lecture d'autorité), création du tag cible,
  régénération des dérivées, **1 à 3 tests de garde** (§ 6).

**Hors scope :**
- `frames/releases/StefFrame2/**` (miroir figé S9).
- Toute refonte du système de journal / cadence.
- La publication npm elle-même (seulement rendre la version cohérente, pas publier).
- Rétro-tagger l'historique `v0.7.0…v0.19.0` (sauf décision D3 contraire).

## 8. Critères d'acceptation (vérifiables)

Après exécution, **tous** doivent passer :

1. `node cli/src/index.js -v` affiche **exactement** la valeur cible (D2), plus jamais
   `0.1.0`.
2. `grep -n "0\.1\.0" cli/src/index.js` ne renvoie **aucune** occurrence d'une constante
   `VERSION` codée en dur (la version n'est plus littérale dans `index.js`).
3. `node -e "console.log(require('./cli/package.json').version)"` === la valeur cible (nue).
4. Le champ *Version* de `specs/etat-des-lieux.md` (après `iakaframe update`) === `v` +
   valeur cible ; idem `specs/etat-des-lieux.html`.
5. `git describe --tags --abbrev=0` === `v` + valeur cible (tag créé sur `HEAD`).
6. La suite de tests CLI (`npm test` dans `cli/`) passe **à 100 %**, incluant la/les
   nouvelle(s) garde(s) G1 (et G2/G3 si retenues).
7. Un test de garde échoue **délibérément** si l'on ré-introduit une divergence (ex. bumper
   `package.json` sans régénérer) — preuve que la garde mord.

## 9. Estimation dev (gate P1→P2)

- **Équivalent jour-homme (spec fermée)** : **~0,5 à 0,75 j-h**.
  - Réconciliation valeurs + dé-duplication S2 + câblage `snapshot.js` : ~0,25 j-h.
  - Garde G1 (+ éventuelles G2/G3) : ~0,25 j-h.
  - Régénération dérivées + tag + vérif critères : ~0,15 j-h.
- **Complexité / risque** : **faible-modéré**. Le geste est petit et cerné ; le risque
  n'est pas technique mais **décisionnel** (choix de la valeur cible D2 = récit de version).
- **Inconnues susceptibles de faire glisser** :
  - **D2** non tranché → l'exécution est bloquée (décideur).
  - Effets de bord de la lecture de `package.json` en ESM selon la résolution de chemin au
    packaging/bundle (`_bundled`) — à valider sur le binaire empaqueté, pas seulement en dev.
  - Le fallback `git describe` peut masquer un désalignement en CI sans historique de tags
    (clones *shallow*) — à surveiller pour G2/G3.
  - Cohérence attendue du champ après `iakaframe update` : vérifier que `bundle.js` (S7) ne
    ré-introduit pas l'ancienne valeur via l'état des lieux si régénéré dans le mauvais ordre.

> Estimation = ordre de grandeur assumé et révisable, **pas un engagement ferme**. À
> confronter au temps réel à la clôture du lot.

## 10. Sources (vérification web)

- [How to import JSON files in ES modules (Node.js) — Stefan Judis](https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/)
- [Modules: ECMAScript modules — Node.js (import attributes)](https://nodejs.org/api/esm.html)
