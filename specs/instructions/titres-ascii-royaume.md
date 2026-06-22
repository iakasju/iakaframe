# Titre ASCII (FIGlet) du royaume / de la cible du focus

## Problème
Quand on bascule de contexte dans iakaframe (entrer dans un royaume, lancer un
runner, passer la main à un agent), rien ne marque visuellement la transition. On
veut un **titre ASCII** affiché au moment du switch — il rend lisible « où on est »
et qui prend la main. Ex. : entrer dans le projet `portefeuille` affiche `PORTEFEUILLE`
en gros ; passer la main à `iakaide` affiche `IAKAIDE`.

## Décision retenue
- **Titre ASCII généré avec un moteur FIGlet embarqué**, **zéro dépendance runtime**
  (on ne tire **ni `figlet` ni `commander`** : on vendorise un mini-moteur FIGfont JS
  pur + les fichiers de police `.flf`).
- **Police par défaut : `ANSI Shadow`**, **configurable** par projet via
  `iakaframe.json` → clé **`bannerFont`** (défaut `ANSI Shadow`).
  - Arbitré avec l'utilisateur : ANSI Shadow est **capitales seulement** → le texte est
    rendu en MAJUSCULES (`iakaIDE` → `IAKAIDE`). Accepté.
- Le titre représente **le nom de la cible du focus** :
  1. **entrée de projet** (commande `go`) → nom du projet ;
  2. **dispatch runner** (`go` lance `claude`/`codex`/`iakaide`) → nom du runner ;
  3. **passage de main entre agents** → nom du royaume / de l'agent, via une commande
     réutilisable (voir ci-dessous), pour ne pas dupliquer la logique de rendu.
- **Portraits ASCII d'agent : ANNULÉS** — explicitement hors périmètre (décision
  l'utilisateur). Cette instruction ne traite QUE le titre.

## Périmètre
- **Inclus :**
  - Un module `cli/src/lib/banner.js` : parseur `.flf` minimal + `renderBanner(text, { font, width })`.
  - Les polices `.flf` embarquées sous `cli/src/lib/figfont/` : **au moins `ANSI Shadow`**
    + un repli ASCII (`Standard`). Optionnel : `slant`, `small`, `big`, `doom`, `bloody`
      (déjà prévisualisées et validées par l'utilisateur comme choix possibles).
  - Greffe dans `cli/src/commands/go.js` : afficher le banner du **projet** à l'entrée,
    puis le banner du **runner** au dispatch.
  - Nouvelle commande **`iakaframe banner <texte> [--font <nom>]`** (point d'entrée
    unique de rendu, réutilisable par les `.ps1` et par les agents lors d'un passage
    de main).
  - Lecture de `bannerFont` depuis `iakaframe.json` (go.js lit déjà ce fichier pour
    `runner` — étendre la lecture).
  - Repli automatique : si la police demandée est introuvable **ou** si l'encodage du
    terminal ne supporte pas les blocs UTF-8, retomber sur la police ASCII `Standard`
    (avertissement non bloquant, jamais de crash).
- **Exclu :**
  - Portraits ASCII des agents (annulés).
  - Couleur / ANSI colors (titre monochrome pour le MVP).
  - Détection fine multi-plateforme de l'encodage au-delà du simple repli ci-dessus.
  - Ajout de la moindre dépendance npm runtime (la promesse zéro-dep est non négociable).

## Étapes d'implémentation
1. Récupérer les fichiers `.flf` (licences libres) : `ANSI Shadow` + `Standard`
   (+ optionnels), les déposer sous `cli/src/lib/figfont/` avec un `CREDITS`/licence.
2. Écrire `cli/src/lib/banner.js` : lecture d'un `.flf`, parsing header (hardblank,
   hauteur, baseline, règles de smushing) + rendu d'une chaîne. Exporter
   `renderBanner(text, { font = 'ANSI Shadow', width })`. Gérer la largeur (pas de wrap
   cassé sur les noms longs : largeur généreuse ou détection `process.stdout.columns`).
3. Ajouter la commande `banner` : `cli/src/commands/banner.js` + branchement dans
   `cli/src/index.js`.
4. Modifier `cli/src/commands/go.js` : lire `bannerFont` dans `iakaframe.json` ; afficher
   `renderBanner(<nomProjet>)` à l'entrée et `renderBanner(<runner>)` au dispatch, avant
   les `console.log` actuels.
5. Repli : try/catch autour du rendu ; police inconnue ou erreur d'encodage →
   `Standard` + `console.warn`.
6. (Power-path Windows) Documenter / brancher l'appel `iakaframe banner` depuis les
   `.ps1` concernés si le coût est faible ; sinon documenter l'usage.
7. Tests + fixtures (voir critères).

## Fichiers concernés
- `cli/src/lib/banner.js` — **nouveau** : moteur FIGfont + `renderBanner`.
- `cli/src/lib/figfont/*.flf` — **nouveau** : polices embarquées + licence/crédits.
- `cli/src/commands/banner.js` — **nouveau** : commande `iakaframe banner`.
- `cli/src/index.js` — enregistrer la commande `banner`.
- `cli/src/commands/go.js` — afficher les banners (projet + runner), lire `bannerFont`.
- `cli/test/banner.test.js` — **nouveau** : test de rendu contre fixture.
- `cli/package.json` — vérifier : **aucune** nouvelle dépendance runtime.
- (option) `.ps1` du power-path — appel `iakaframe banner`.

## Risques
- **Noms longs qui débordent** (constaté : `PORTEFEUILLE` wrap à 80 col.) → gérer la
  largeur ; à défaut, accepter le wrap mais le tester.
- **Encodage** : ANSI Shadow = blocs UTF-8 ; sur terminal non-UTF-8 → repli `Standard`.
- **Licences `.flf`** : n'embarquer que des polices à licence libre + créditer.
- **Régression zéro-dep** : interdiction d'importer `figlet`. Vendoriser le parseur.
- **Smushing FIGfont** : un parseur trop naïf rend mal certaines polices → caler le
  rendu d'`ANSI Shadow` et `Standard` au pixel près contre la sortie figlet de référence
  (fixtures générées avec pyfiglet pendant le cadrage).

## Critères d'acceptation
- [ ] `iakaframe banner iakaIDE` affiche le titre en `ANSI Shadow` (donc `IAKAIDE`),
      identique à la sortie figlet de référence, exit 0.
- [ ] `iakaframe go <projet>` affiche le banner du nom du projet avant de lancer le runner.
- [ ] Quand le runner diffère du défaut (ex. `iakaide`), son nom est affiché en banner au dispatch.
- [ ] `bannerFont` dans `iakaframe.json` change la police effective ; une police inconnue
      retombe sur `Standard` avec un avertissement, **sans crash**.
- [ ] `cli/package.json` : la liste des `dependencies` runtime reste **vide** (zéro-dep préservé).
- [ ] Un test unitaire rend une chaîne connue en `ANSI Shadow` et l'égale à une fixture stockée.
- [ ] Fonctionne sous Node multi-OS ; repli ASCII opérationnel si l'UTF-8 n'est pas supporté.
