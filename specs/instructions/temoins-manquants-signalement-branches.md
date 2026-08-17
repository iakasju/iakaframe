# Témoins manquants du signalement des branches — trois promesses que rien ne garde

> **Lot successeur du lot 2** *Signalement des branches sans copie distante*
> (`specs/instructions/signalement-branches-sans-copie-distante.md`), **gaté PASS et mergé**
> (`98026b1` sur `feat/sauvegarde-portefeuille`).
> Cadrage : 🔵 Gandalf, 2026-08-17, sur **quatre réserves de 🏹 Legolas**.
> **Instruction fermée** — ce qui n'y figure pas n'est pas à faire.

> ⛔ **Les cinq décisions `DA` → `DE` du lot 2 ne sont PAS rouvertes.** Elles sont ratifiées et le
> lot est mergé. Ce lot **ajoute des témoins** et **corrige un texte faux** ; il ne rejuge rien.

---

## Problème

Le lot 2 est passé au gate (PASS, mergé en `98026b1`). Legolas a alors fait ce que le lot 2
prescrivait pour lui-même : il a **saboté et mesuré**. Trois de ses constats disent la même chose
sous trois formes : **le lot 2 tient des promesses que rien ne garde**, et **mon instruction en
désigne une fausse**.

1. **Un ordre de rendu promis en commentaire, gardé par rien.**
   `cli/src/lib/branches-locales.js:180` promet : *« Déterministe, pour que le plafond d'AFFICHAGE ne
   cache jamais le cas le plus grave »*. Legolas a **inversé** le rang (`en-avance` avant `absente`)
   et la suite est restée **verte : 26 pass, 0 fail**. Aujourd'hui inoffensif — 2 signalements sur 45
   dépôts. Au-delà de dix branches signalées, les cas **`absente`**, qui sont **la classe exacte de
   l'incident**, seraient repoussés hors affichage par des `en-avance` bénins. C'est la **même zone et
   la même famille** que le sabotage du plafond que Gimli avait trouvé de lui-même
   (`cli/test/branches-locales.test.js:479-483`). Cette zone mérite un témoin, pas un rafistolage.

2. **`DD-7` gardé sur un seul de ses deux chemins.**
   `cli/src/commands/range.js:129` : retirer `...champsScan` du `catch` passe **inaperçu**. Mécanisme
   établi par Legolas : `restic` étant installé au poste, `lancerSauvegarde` **ne lève pas**, elle
   rend `code 10` ; la garde `CA-11` emprunte donc le chemin `if (r.code !== 0)`
   (`range.js:145`) et le chemin **exception** (`range.js:129`) n'a **aucun** témoin. Sur une machine
   **sans** restic, la régression passerait **muette** — précisément le contexte où l'information
   compte.

3. **Un prédicat qui rend `null` produit du SILENCE — et mon propre témoin le décrivait à l'envers.**
   `specs/instructions/signalement-branches-sans-copie-distante.md:436-437` prédit que le sabotage
   `S1` (`--not --remotes` → `--not <B>@{upstream}`) fera **réapparaître** la branche poussée sans
   `-u` et fera donc **rougir** `CA-2`. Legolas l'a joué : **`CA-2` reste VERT.** Ce n'est **pas** un
   faux positif, c'est un **faux négatif**, et il vient d'un **trou de conception**, pas d'un
   sabotage : quand la commande git échoue, `compterCommitsSansCopie` rend `null`
   (`branches-locales.js:144`), `classer(null, …)` rend `null` (`:98`), `analyserDepot` fait
   `continue` (`:164`) — et la branche devient **muette, sans figurer dans aucun compteur**. Le
   sabotage `S1` est bien attrapé, mais **par 8 autres gardes, pas par celle que mon texte désigne**.

**Le besoin, en une phrase** : donner un témoin aux trois promesses non gardées, **faire cesser la
seule classe de panne du lot 2 qui produit du silence**, et **corriger dans le dossier** le témoin
que j'ai écrit faux.

🛑 **Le point de méthode, et il n'est pas décoratif.** Le lot 2 existe parce qu'*une garde muette ne
protège rien*. Sa propre implémentation contient **une garde muette** : une branche dont le prédicat
n'a pas pu être calculé n'est **ni signalée, ni comptée, ni nommée** — elle disparaît, et la sortie
annonce alors sereinement `branches sans copie distante : aucune`. C'est **le défaut du lot 2 dans le
lot 2**. On ne le laisse pas.

---

## Ce qui est vérifié de ma main — constats lus sur le disque, 2026-08-17

> Lecture seule sur `/Users/sjupin/work/iakaframe`. **Aucune commande git lancée** (pas d'outil Bash
> à ce cadrage) : les constats viennent de la **lecture directe** des fichiers de `.git/` et des
> sources. Ils sont donc **opposables** — pas rapportés.

| # | Constat | Preuve lue |
|---|---|---|
| `W1` | Le lot 2 est **mergé** dans `feat/sauvegarde-portefeuille` en `98026b1` | `.git/logs/refs/heads/feat/sauvegarde-portefeuille:9` → `merge feat/signalement-branches-sans-copie-distante` |
| `W2` | La branche porteuse **n'est plus irrécupérable** : local **et** `origin` pointent le même objet | `.git/refs/heads/feat/sauvegarde-portefeuille` = `.git/refs/remotes/origin/feat/sauvegarde-portefeuille` = `98026b1747…` |
| `W3` | La branche fille du lot 2 **existe encore** en local et sur `origin` | `.git/refs/heads/feat/signalement-branches-sans-copie-distante`, `.git/refs/remotes/origin/…` |
| `W4` | 🛑 **Le chemin du silence est bien celui décrit** : `run` échoue → `ok:false` → `null` → `continue`, et **aucun compteur ne bouge** | `cli/src/lib/git.js:13-15` (catch → `ok:false`), `branches-locales.js:144`, `:98`, `:164` |
| `W5` | Une branche indéterminée n'est comptée **que** dans `branchesExaminees` — ni `signalees`, ni `branchesEcartees`, ni `depotsIgnores` | `branches-locales.js:161-165` puis `:212-214` |
| `W6` | Le **niveau dépôt**, lui, est déjà honnête : `lireBranches` rend `null` → le dépôt entre dans `depotsIgnoresNoms` et la sortie dit « depots illisibles » | `branches-locales.js:115`, `:154`, `:210`, `:282-284` |
| `W7` | `ordonner` n'est couvert par **aucune assertion d'ordre** ; les deux gardes du plafond n'affirment que le **nombre** de lignes rendues | `cli/test/branches-locales.test.js:484-510` (aucun `assert` sur la position d'un `absente`) |
| `W8` | Le chemin **exception** de `DD-7` est sans témoin : aucune garde ne fait **lever** `lancerSauvegarde` | `cli/test/branches-locales.test.js:390-405` (`CA-11` passe par un dépôt restic absent), `cli/test/range.test.js` : aucune occurrence de `--exclude-file` en exécution |
| `W9` | 🪤 **`lancerSauvegarde` LÈVE sur un fichier d'exclusion absent**, et **avant** tout appel à restic | `cli/src/lib/range.js:141-147` (`existsSync` → `throw`), le `spawnSync` n'est qu'en `:152` |
| `W10` | Elle lève **aussi** quand `restic` est absent du `PATH` — donc le chemin exception est atteignable **sur toute machine**, par l'une ou l'autre porte | `cli/src/lib/range.js:133-139`, `cli/src/lib/which.js:5-19` |
| `W11` | ⛔ **Neutraliser le `PATH` n'est PAS un harnais viable** : `git` y disparaîtrait aussi, tout deviendrait indéterminé et le rapport n'aurait plus rien à porter | `which.js:6` (lit `process.env.PATH`) vs `git.js:11` (`execFileSync('git', …)`) |
| `W12` | L'en-tête en périmètre ciblé écrit **« 2 sur 1 depots »** : `depots` est **toujours** au pluriel | `branches-locales.js:253` et `:255` (littéral `depots`, aucun accord) |
| `W13` | Le commit `8b2e236` a un **corps vide** ; les sept autres du lot 2 sont renseignés | `.git/logs/refs/heads/feat/signalement-branches-sans-copie-distante:9` (sujet seul) |
| `W14` | ✅ **Chronologie de `DH` mesurée au reflog** : 6ᵉ commit `1d75faf` à `1786960340`, premier push à `1786960390` → **50 s** ; branche créée à `1786959205` → **exposition totale 19 min 45 s** | `.git/logs/refs/heads/feat/signalement-…:7` et `.git/logs/refs/remotes/origin/feat/signalement-…:1` |
| `W15` | Les 15 cases de l'instruction du lot 2 sont **toutes décochées** et **aucun relevé d'exécution** n'y figure | `signalement-branches-sans-copie-distante.md:428-502` (`- [ ]` ×15), fin de fichier = § *Sources* |

**`W9` + `W10` + `W11` commandent le harnais de la réserve `L-2`** : le seul levier qui fasse **lever**
`lancerSauvegarde` sans dépendre de l'outillage du poste et **sans jamais atteindre restic** est un
**`--exclude-file` inexistant**. C'est un fait lu dans le code, pas une astuce de test.

---

## Ce qui est vérifié sur le web — faits opposables

- **`F4` — `<branche>@{upstream}` échoue quand aucun upstream n'est configuré.** La documentation
  définit `B@{u}` comme *« the remote-tracking branch for the branch X taken from remote R
  (configured with `branch.<name>.merge` / `branch.<name>.remote`) »* : **sans cette configuration,
  la révision n'est pas résoluble**. Le comportement observé et documenté est
  `fatal: no upstream configured for branch '<X>'` avec **code de sortie 128** ; la suite de tests de
  git elle-même couvre ce cas d'erreur (`t/t1507-rev-parse-upstream.sh`). **C'est le mécanisme exact
  du faux négatif de `L-3`** : `execFileSync` lève, `git.js:run` rend `ok:false`, le prédicat rend
  `null`, la branche devient muette.
- **`F5` — le caractère `:` est INTERDIT dans un nom de ref git.** Règle 4 de
  `git-check-ref-format` : *« They cannot have ASCII control characters (i.e. bytes whose values are
  lower than \040, or \177 DEL), space, tilde `~`, caret `^`, or colon `:` anywhere. »* C'est ce qui
  rend le séparateur `projet:branche` **non ambigu** pour nommer une branche indéterminée dans un
  tableau de chaînes (`DG`) — le `/` ne l'aurait pas été, les noms de branches en contenant.

---

## Les décisions — tranchées ici, révocables au gate

> Gandalf **propose** ; le décideur **tranche**. Décisions **nommées** pour être renversées d'un mot.
> Elles sont numérotées **`DF`…** : les lettres `DA`→`DE` appartiennent au lot 2 et ne sont pas
> touchées.

### `DF` — Livraison : **un amendement daté du lot 2 *et* ce lot successeur**, pas l'un ou l'autre

La question posée était « amendement ou instruction successeur ». La réponse honnête est **les
deux**, parce que les quatre réserves ne sont pas de même nature :

- **Ce qui appartient au dossier du lot 2** — donc **amendé en place**, dans son fichier :
  1. le **témoin de `CA-2` est faux** (`L-3`). Un texte faux dans une instruction **mergée** est un
     mensonge laissé au dossier ; on ne le corrige pas ailleurs, on le corrige **là**. **Barré, pas
     effacé** : le lecteur doit voir ce qui était prédit **et** ce qui a été mesuré ;
  2. le **relevé d'exécution** (`L-4`) et les **15 cases** : ce sont les traces du lot 2, elles n'ont
     pas d'autre domicile légitime que l'instruction du lot 2.
- **Ce qui est du travail neuf** — donc **ce fichier** : les trois témoins manquants, le trou de
  conception de `DG`, les deux points mineurs, et la doctrine `DH`.

**Pourquoi pas « tout en amendement »** : ajouter des critères d'acceptation neufs à un lot **gaté
PASS** revient à rendre rétroactivement faux un verdict qui était juste sur le périmètre qu'il
jugeait. Legolas a gaté ce qui lui était présenté ; on ne déplace pas la barre après le saut.

**Pourquoi pas « tout en successeur »** : laisser le témoin faux de `CA-2` dans le fichier mergé, en
comptant sur un autre fichier pour dire qu'il est faux, c'est demander à tout futur lecteur de
connaître les deux. Une instruction doit être lisible **seule**.

**Qui écrit quoi** — et c'est net :
- 🔵 **Gandalf a déjà écrit l'amendement** (la rectification `L-3` **est son geste**, le texte faux
  est le sien) **et le squelette du relevé**, dans `specs/instructions/` — son seul chemin d'écriture.
  **Il ne commite pas.**
- ⚒️ **Gimli commite** cet amendement, **remplit** le relevé (il détient les sorties rouges et les
  verdicts), **coche** les 15 cases, puis exécute ce lot.

> **Rappel de méthode appliqué ici** : le § *Fichiers concernés* d'un lot **inclut toujours son
> propre fichier d'instruction**. Ce lot en liste donc **deux** : celui-ci **et** celui du lot 2,
> puisqu'il le modifie.

### `DG` — 🛑 Le prédicat indéterminé **cesse d'être muet** → **DANS le périmètre**

**Tranché : dans le périmètre.** La question posée par `L-3` était : garde-t-on cette classe de
panne, ou est-ce hors sujet ? **Elle est en plein dans le sujet.** Motifs, dans l'ordre :

1. **C'est le défaut que le lot 2 corrige, présent dans le lot 2.** Une branche dont le prédicat n'a
   pas pu être calculé n'est **ni signalée, ni comptée, ni nommée** (`W4`, `W5`) — et l'en-tête
   annonce alors `aucune`. Le lot 2 a écrit noir sur blanc : *« Écarter n'est jamais taire »* (`DE`)
   et *« on ne doit jamais pouvoir confondre "rien à signaler" avec "la garde est cassée" »*
   (`CA-5`). **Ici, on peut.**
2. **Le niveau dépôt est déjà honnête** (`W6`) : un dépôt illisible est compté **et nommé**. Le
   niveau **branche** ne l'est pas. C'est une **asymétrie**, pas un choix.
3. **Le coût est de l'ordre de dix lignes.** Ce n'est pas un arbitrage d'architecture.

**Retenu — trois gestes, et rien de plus :**

```
analyserDepot :  const n = compterCommitsSansCopie(…);
                 if (n === null) { indeterminees.push(b.nom); continue; }   // AVANT classer
                 const etat = classer(n, …);
```

- `classer` **reste inchangée** : son contrat (« un chiffre non lu n'est jamais inventé », garde
  `branches-locales.test.js:520`) est **juste**. Le manque n'est pas dans le classement, il est dans
  le **compte rendu**. On ne casse pas une garde correcte pour réparer ailleurs.
- `balayer` **agrège**, sur le **précédent exact** de `depotsNonGit` / `depotsNonGitNoms` :
  `scanBranches.branchesIndeterminees` (**nombre**) et `scanBranches.branchesIndetermineesNoms`
  (**tableau de chaînes** `projet:branche` — séparateur non ambigu par `F5`).
- `rendreBloc` **le dit**, et **surtout** : quand `branchesIndeterminees > 0`, la première ligne **ne
  peut plus prétendre `aucune` toute seule**. Forme retenue :

```
  branches sans copie distante : aucune de MESURABLE — 3 branches INDETERMINEES (predicat non calculable)
    indeterminees : iakaframe:feat/x, iakaHub:wip/y, dnd:archive/z
```

  C'est **le cœur de la rectification** : sous le sabotage `S1`, la sortie disait `aucune` — un
  **mensonge**. Après `DG`, elle dit **« je n'ai pas pu mesurer »**. La différence n'est pas
  cosmétique : c'est la différence entre une garde et un décor.

**Une couture d'injection, et une seule** — parce qu'*une classe de panne qu'on ne peut atteindre que
par sabotage est une classe de panne sans témoin* : `analyserDepot(chemin, { …, compter = compterCommitsSansCopie })`
et `balayer(perimetre, { …, compter })` qui le transmet. **Paramètre optionnel, défaut = la vraie
fonction.** Aucun drapeau CLI, aucune variable d'environnement, aucun chemin de production ne
l'atteint (`CB-1`).

**Écarté nommément :**
- ⛔ **Faire échouer le balayage** sur une branche indéterminée : `range` **signale**, il ne bloque
  pas (`DD-1`, non rouvert).
- ⛔ **Traiter l'indéterminée comme `absente`** (« dans le doute, on crie ») : ce serait **inventer un
  chiffre non lu** et rouvrir les faux positifs que `DB` a mesurés à 37 %.
- ⛔ **Un troisième état `indetermine` dans `classer`** : casserait une garde juste (ci-dessus) pour
  un gain nul.
- ⛔ **Faire remonter le compteur à la racine du rapport `--json`** : il vit dans `scanBranches`, qui
  **voyage déjà** dans `champsScan` (`range.js:86-90`). **Aucune ligne de `range.js` à écrire.**

### `DH` — Gravée : **capturer dès que la garde répond, pousser `-u` juste après, borner l'exposition**

**Le lot 2 portait deux prescriptions logiquement inconciliables**, et Legolas l'a instruit : son
étape 3 exigeait `push -u` **« au premier commit »**, quand `CA-15` exigeait la capture du témoin
négatif **avant** ce push — or ce témoin n'est capturable que lorsque `--branches` **répond**, ce qui
n'arrive qu'au **câblage**. L'une des deux devait céder.

**Retenu — la recommandation de Legolas, gravée pour cette famille de lots :**
1. **Capturer dès que la garde répond** — pas plus tard, pas « quand on y pensera ».
2. **Pousser `-u` immédiatement après la capture** — le geste suivant, pas le suivant du suivant.
3. **Borner l'exposition par un plafond ÉCRIT : 30 minutes** entre la création de la branche et son
   premier push. Repère mesuré sur le lot 2 : **19 min 45 s** (`W14`) — le plafond a donc de la
   marge et reste tenable.
4. **Si le plafond est atteint avant que la garde réponde** : **on pousse quand même**, et le témoin
   négatif est capturé sur une **branche jetable créée pour cela**, avec **le motif écrit** dans la
   remise. Un témoin dégradé et déclaré vaut mieux qu'une branche irrécupérable.

**C'est `CA-15` qui gagne, et l'étape 3 qui cède** : `CA-15` est *la preuve que la garde mord* ;
`push -u` « au premier commit » n'était qu'un **moyen** de tenir le plafond. Le reflog montre que
Gimli a tenu **l'esprit** sans avoir l'écrit (`W14`) — c'est exactement ce qu'on ne veut pas laisser
au hasard une seconde fois.

**Applicable à ce lot dès son premier commit** : ici la garde `--branches` **existe déjà** sur la
branche parente (`W1`), donc la capture est possible **immédiatement** et le point 4 ne devrait pas
servir (`CB-8`).

### `DI` — Le relevé d'exécution : **appendu à l'instruction du lot, forme prescrite**

`L-4` a raison sur le fond : la traçabilité **instruction ↔ CA** ne vivait que dans le message de
remise, **volatile**. La partie durable existe — les sorties rouges sont dans les corps de commits —
mais elle est **dispersée** et personne ne la retrouve depuis l'instruction. **Gimli ne doit pas
avoir à improviser la forme** : elle est fixée ici.

**Où** : **à la fin du fichier d'instruction du lot**, en **dernière section**, après les *Sources*.
Motif : c'est le seul endroit qu'un lecteur atteint **sans connaître le dépôt** ; et cela rend
l'instruction lisible seule, ce qui est sa raison d'être.

**Comment** — quatre règles, aucune de plus :
1. **Appendu, jamais substitué.** On **n'efface** ni ne réécrit le corps de l'instruction pour le
   faire coïncider avec ce qui a été fait. L'écart entre le cadrage et l'exécution **est une
   information**.
2. **Les cases se cochent en place** (`- [ ]` → `- [x]`) et **seulement** contre une preuve nommée.
   Une case cochée sans ligne de relevé est **un manquement**, pas un raccourci.
3. **Une ligne par critère**, dans un tableau à quatre colonnes :
   `| Critère | Verdict | Preuve (fichier:ligne, commit, ou chiffre mesuré) | Note |`.
   Verdicts autorisés : **`vert`** / **`vert (dégradé)`** / **`non tenu`** / **`sans objet`** — jamais
   « OK ».
4. **Les chiffres mesurés y figurent en chiffres.** « Rapide » n'est pas un relevé (c'était déjà la
   règle de `CA-9` du lot 2).

**Ce que le relevé n'est pas** : ni un état des lieux (`iakaframe snapshot`), ni de la mémoire
humaine (→ 📖 Nathalie), ni un verdict de gate (→ 🏹 Legolas, qui reste **seul** émetteur du PASS).
C'est **la trace d'exécution d'un lot, dans le fichier de ce lot**.

---

## Périmètre

**Inclus**
- **`DG`** — la branche indéterminée cesse d'être muette : garde dans `analyserDepot`, deux compteurs
  dans `balayer`, la phrase honnête dans `rendreBloc`, la couture d'injection.
- **Le témoin de l'ordre de rendu** (`L-1`) : `ordonner` en unitaire **et** à travers `balayer` sur un
  dépôt réel.
- **Le témoin du chemin exception de `DD-7`** (`L-2`) : harnais par **`--exclude-file` inexistant**
  (`W9`/`W10`/`W11`).
- **L'accord de « depot(s) »** dans l'en-tête (`W12`) — les deux occurrences, avec un témoin.
- **L'amendement du lot 2** : rectification datée du témoin de `CA-2` (**déjà écrite par Gandalf**),
  relevé d'exécution rempli et 15 cases cochées (`DI`).
- **La consignation au backlog** : `SIGN-5` reste une **dette distincte** ; `8b2e236` (corps vide)
  reste **de l'histoire**.

**Exclu — nommément, et pour un motif écrit**
- ⛔ **Rouvrir `DA`, `DB`, `DC`, `DD`, `DE`** : ratifiées, lot mergé.
- ⛔ **`SIGN-5` — la pente du coût** (≈ 11 ms par processus git d'après la mesure de Legolas,
  croissance linéaire avec le portefeuille) : **dette distincte, jugée sans urgence par le gate**.
  Ni cache, ni regroupement d'appels, ni `--branches` conditionnel dans ce lot.
- ⛔ **Réécrire `8b2e236`** (`W13`) : c'est de l'histoire, et elle est **poussée** (`W3`). Jamais de
  réécriture côté IA. La compensation est le relevé de `DI`, qui porte ce que le corps ne portait pas.
- ⛔ **Toute modification de `cli/src/commands/range.js`** : `DG` passe entièrement par
  `scanBranches`, déjà transporté (`range.js:86-90`). **Zéro ligne** — et c'est un **critère**
  (`CB-6`), pas une intention.
- ⛔ **`cli/test/range.test.js` et `cli/test/guard-json-output.test.js`** : **inchangés**, comme au lot
  2. Témoins de non-régression.
- ⛔ **`docs/commandes.md`** : aucun verbe ni option ajouté ni modifié — la règle de maintenance
  (`docs/commandes.md:20-22`) ne se déclenche pas. **Ne pas y toucher**, ni la date, ni les compteurs
  (`docs/commandes.md:33-35` : une date fraîche sur des compteurs non revérifiés produit un doc qui
  **a l'air** vérifié).
- ⛔ **`config/sauvegarde-branches-ignorees.txt`** : inchangé, toujours **sans motif**.
- ⛔ **Toute action corrective sur un dépôt** (pousser, poser un upstream, créer une branche) — comme
  au lot 2.
- ⛔ **Toute interrogation réseau** (`ls-remote`, `fetch`) — `DB`, non rouvert.
- ⛔ **L'alerte poussée, le veilleur d'absence, la planification** — lot ultérieur.
- ⛔ **Aucun fichier d'un autre projet du chapeau.** Aucun.

---

## Étapes d'implémentation

1. **Lire** l'instruction du lot 2 **et ce fichier** avant de toucher au code. Le lot 2 est **mergé**
   dans `feat/sauvegarde-portefeuille` (`W1`) : c'est **là** que tout se passe, jamais depuis `main`.
2. **Committer l'amendement du lot 2** — déjà écrit par Gandalf dans
   `specs/instructions/signalement-branches-sans-copie-distante.md` (rectification `CA-2` + squelette
   du relevé) — sur `feat/sauvegarde-portefeuille`, **et pousser**. La branche est déjà sur `origin`
   (`W2`) : c'est un push ordinaire.
3. **Créer le worktree** : branche `feat/temoins-manquants-signalement-branches` depuis
   `feat/sauvegarde-portefeuille`, **hors** de la racine (la racine a la parente en checkout).
   **Appliquer `DH` dès le premier commit** : la garde `--branches` répond déjà → **capturer le
   témoin négatif de `CB-8`**, puis **pousser `-u` immédiatement après**. **Noter l'heure des deux
   gestes** : le plafond de 30 minutes est un critère.
4. 🪤 **Établir quel binaire répond** (piège `R4` du lot 2, toujours valable) : la recette se fait
   **exclusivement** en `node <worktree>/cli/src/index.js range …`. `iakaframe` et tout
   `../iakaframe/cli` exécutent le CLI **de la racine**, donc **sans** ce lot.
5. **`DG`** — dans `cli/src/lib/branches-locales.js`, dans cet ordre :
   a. couture `compter` (paramètre optionnel) sur `analyserDepot` **puis** `balayer` ;
   b. garde `if (n === null)` **avant** `classer`, accumulation des noms ;
   c. agrégation `branchesIndeterminees` / `branchesIndetermineesNoms` dans `scanBranches` ;
   d. `rendreBloc` : la ligne `indeterminees : …`, **et** la première ligne qui ne prétend plus
      `aucune` seule quand le compteur est non nul ;
   e. ajouter la limite correspondante à `LIMITES` — un angle mort **rendu**, comme les huit autres.
6. **Écrire les gardes de `DG`** (`CB-1`, `CB-2`) — **rouge d'abord**, sortie **copiée verbatim**.
7. **Écrire le témoin de l'ordre de rendu** (`CB-3`) : unitaire sur `ordonner` **plus** un passage par
   `balayer` sur un dépôt réel de **12 branches** — **10 `en-avance` à fort nombre de commits** et
   **2 `absente` à 1 commit**, pour que l'inversion du rang **éjecte** les `absente` hors des 10
   lignes affichées. **Un rapport fabriqué à la main ne suffit pas** : c'est exactement la leçon du
   sabotage du plafond (`branches-locales.test.js:479-483`).
8. **Écrire le témoin du chemin exception** (`CB-4`) : `range <projet> --exclude-file <inexistant>
   --json` sur un chapeau factice, avec l'environnement jetable existant. **Assertion discriminante**
   sur le message d'erreur, pour prouver que c'est bien le chemin **exception** qui a été emprunté et
   non `if (r.code !== 0)`.
9. **Corriger l'accord de « depot(s) »** (`W12`) + son témoin (`CB-5`).
10. **Lancer la suite complète** (`node --test` depuis `cli/`) : **26 gardes du lot 2 vertes,
    inchangées**, plus les nouvelles. **Vérifier par `git diff` que `range.js`, `range.test.js` et
    `guard-json-output.test.js` rendent zéro ligne.**
11. **Recetter sur le chapeau réel** en `--branches --json` et **relever les chiffres**, dont
    **`branchesIndeterminees`**, qui doit valoir **0** en fonctionnement normal.
12. **Remplir le relevé d'exécution du lot 2** (`DI`) : les 15 lignes, les verdicts, les preuves, et
    **cocher** les cases. Les sorties rouges sont dans les corps de commits du lot 2 — les y
    reprendre, ne pas les réinventer.
13. **Ajouter le relevé de CE lot** (`DI`) à la fin de **ce** fichier.
14. **Consigner au backlog** : `SIGN-5` (dette distincte, sans urgence), et la note sur `8b2e236`.
15. **Remise au jalon P2→P3**, récepteur 🏹 Legolas, avec les sorties rouges **verbatim** et les
    chiffres de `DH` (heures de capture et de push, exposition réelle).

---

## Falsification des gardes — rouge AVANT vert, consigné verbatim

> **Une garde qu'on n'a jamais vue échouer ne prouve rien.** Le lot 2 l'a payé deux fois : une garde
> du plafond qui ne mordait pas, et **un témoin négatif écrit à l'envers**.

Pour **chaque** garde ajoutée : saboter la source, **lancer**, **copier la sortie d'échec
VERBATIM**, rétablir, relancer au vert. Consignation : verbatim dans la remise **et** une ligne par
garde falsifiée dans le corps du commit qui la pose.

| Sabotage | Ce qui doit rougir | Pourquoi il est nommé ici |
|---|---|---|
| `S1` **rejoué** : `--not --remotes` → `--not <B>@{upstream}` | **`CB-1`/`CB-2`** : `branchesIndeterminees` monte, la sortie cesse de dire `aucune` | Il restait **vert sur `CA-2`** ; c'est **la** réserve `L-3` |
| retirer la garde `if (n === null)` de `DG` | `CB-1` **et** `CB-2` : le silence revient | Prouve que c'est bien `DG` qui attrape `S1`, pas un voisin |
| inverser le rang de `ordonner` (`en-avance` avant `absente`) | **`CB-3`**, en unitaire **et** à travers `balayer` | Legolas l'a joué : **26 pass, 0 fail** — réserve `L-1` |
| retirer `...champsScan` du `catch` de `range.js:129` | **`CB-4`** | Passait **inaperçu** — réserve `L-2` |
| supprimer l'assertion discriminante de `CB-4` | rien ne rougit → **la garde est à réécrire** | Une garde qui passe **pour la mauvaise raison** est un décor |
| remettre `depots` invariable | **`CB-5`** | Réserve mineure `W12` |
| cocher une case sans ligne de relevé | **`CB-7`** | `DI-2` : une case cochée sans preuve est un manquement |

---

## Fichiers concernés

- `specs/instructions/temoins-manquants-signalement-branches.md` — **ce fichier** (le cadrage), qui
  gagnera son **relevé d'exécution** en fin de lot (`DI`).
- `specs/instructions/signalement-branches-sans-copie-distante.md` — **modifié** : rectification
  datée du témoin de `CA-2` (**écrite par Gandalf**, à committer), **relevé d'exécution** rempli et
  **15 cases cochées** (par Gimli).
- `cli/src/lib/branches-locales.js` — **modifié** : couture `compter`, garde `n === null`, deux
  compteurs, phrase honnête dans `rendreBloc`, une entrée de `LIMITES`, accord de « depot(s) ».
- `cli/test/branches-locales.test.js` — **modifié** : les gardes `CB-1` à `CB-5`.
- ⛔ `cli/src/commands/range.js` — **inchangé**, **zéro ligne** (`DG` : tout passe par
  `scanBranches`, déjà transporté en `:86-90`).
- ⛔ `cli/test/range.test.js` — **inchangé** (17 gardes du lot 1, témoin de non-régression).
- ⛔ `cli/test/guard-json-output.test.js` — **inchangé** (`V11` du lot 2 : y ajouter `range`
  lancerait restic sur le vrai dépôt).
- ⛔ `cli/src/lib/range.js` — **inchangé** : le module restic n'a rien à connaître du balayage.
- ⛔ `docs/commandes.md` — **inchangé** : aucun verbe ni option ajouté ni modifié.
- ⛔ `config/sauvegarde-branches-ignorees.txt` — **inchangé**, toujours sans motif.
- ⛔ `specs/instructions/sauvegarde-portefeuille.md` — **inchangé**.
- ⛔ **Aucun fichier d'un autre projet du chapeau.** Aucun.

---

## Risques

**`RB-1` — La couture d'injection devient une porte ouverte.** Un paramètre qui sert aux tests peut
devenir un chemin de production par accident. *Mitigation* : paramètre **optionnel**, défaut = la
vraie fonction, **jamais** lu depuis `process.env` ni depuis un drapeau CLI ; `range.js` reste à zéro
ligne. *Témoin* : `CB-1`.

**`RB-2` — Le champ neuf casse un consommateur machine.** *Mitigation* : **ajout seul**, à
l'intérieur de `scanBranches` (objet **déjà** niché, précédent `resume`), sur le patron exact
`depotsNonGit` / `depotsNonGitNoms` ; **aucune** clé existante renommée, déplacée ou supprimée ;
contrat C-JSON (`lib/output.js`, règle 3) respecté. *Témoin* : `CB-6`.

**`RB-3` — Le témoin de l'ordre écrit sur un rapport fabriqué ne mordrait pas.** C'est arrivé au lot
2, mot pour mot (`branches-locales.test.js:479-483`). *Mitigation* : `CB-3` **traverse `balayer`** sur
un dépôt réel, avec des nombres de commits **choisis pour que l'inversion éjecte** les `absente`.

**`RB-4` — `CB-4` passe pour la mauvaise raison.** Si `restic` est installé, le test pourrait
emprunter `if (r.code !== 0)` et sembler vert sans jamais éprouver le `catch` — **le défaut même que
`L-2` a mis au jour**. *Mitigation* : assertion **discriminante** sur le message (il doit matcher un
des deux `throw` de `lib/range.js` et **pas** `restic a echoue (code …)`), et vérification qu'**aucun**
dépôt restic n'a été créé. `--exclude-file` inexistant lève **avant** tout `spawnSync` (`W9`).

**`RB-5` — L'amendement réécrit l'histoire du gate.** Corriger un fichier mergé peut effacer ce qui a
été validé. *Mitigation* : la rectification est **barrée, datée, non effacée** ; le relevé est
**appendu** ; le **verdict PASS de Legolas n'est pas touché** — et ce lot **n'ajoute aucun critère**
au lot 2 (`DF`).

**`RB-6` — La branche de ce lot reste locale.** Rejouerait l'incident fondateur, dans le lot qui le
garde. *Mitigation* : **`DH`** — capture puis `push -u` immédiat, plafond **écrit** de 30 min,
et le lot **se signale lui-même** dès qu'il tourne. *Témoin* : `CB-8`.

**`RB-7` — Le relevé devient un pensum et se remplit faux.** Un tableau de 15 lignes coché à la
chaîne ne vaut rien. *Mitigation* : `DI-2` (pas de case sans preuve nommée), verdict
**`non tenu`** explicitement autorisé — un critère non tenu et **dit** vaut mieux qu'une case cochée
par politesse. *Témoin* : `CB-7`.

---

## Critères d'acceptation

> Chaque critère porte son **témoin négatif** : ce qu'on doit voir **échouer** pour savoir que le
> contrôle mord. Numérotés **`CB-*`** pour ne pas se confondre avec les `CA-*` du lot 2.

- [ ] **`CB-1` — 🛑 une branche dont le prédicat n'est pas calculable est COMPTÉE et NOMMÉE** (`DG`).
      Via la couture `compter`, sur un chapeau factice : `scanBranches.branchesIndeterminees` vaut le
      nombre exact, `branchesIndetermineesNoms` porte `projet:branche` (`F5`), et le bloc humain
      affiche la ligne `indeterminees : …`. En fonctionnement **normal** (couture non utilisée), le
      compteur vaut **0**.
      **Témoin négatif** : retirer la garde `if (n === null)` doit faire **rougir** — la branche
      redevient invisible, ce qui est exactement l'état d'avant ce lot. Et : `range` ne doit exposer
      **aucun** moyen (drapeau, variable d'environnement) de fixer `compter` — une recherche dans
      `cli/src/commands/` rend **zéro** occurrence.

- [ ] **`CB-2` — 🛑 la sortie ne dit plus `aucune` quand elle n'a rien pu mesurer.** Avec
      `branchesIndeterminees > 0` et **zéro** signalement, la première ligne du bloc **ne contient
      pas** une affirmation `aucune` non qualifiée, et contient `INDETERMIN`. La ligne de rappel de
      `DD-3` suit la même règle.
      **Témoin négatif** : **rejouer le sabotage `S1`** (`--not --remotes` → `--not <B>@{upstream}`,
      mécanisme `F4`) doit désormais faire **rougir cette garde** — et la sortie rouge est **consignée
      verbatim**. *C'est la réserve `L-3` refermée : `S1` est attrapé par la garde qui le décrit, pas
      seulement par ses voisines.*

- [ ] **`CB-3` — l'ordre de rendu est GARDÉ, pas promis** (`L-1`). Deux niveaux : (a) unitaire —
      `ordonner` place **tous** les `absente` avant **tout** `en-avance`, quel que soit le nombre de
      commits ; (b) de bout en bout — via `balayer` sur un dépôt réel de **12 branches** (10
      `en-avance` à fort nombre de commits, 2 `absente` à 1 commit), les **2 lignes `absente`
      figurent parmi les 10 lignes affichées**.
      **Témoin négatif** : inverser le rang dans `ordonner` doit faire rougir **les deux** — Legolas a
      mesuré **26 pass, 0 fail** avant ce lot ; ce chiffre doit devenir un échec.

- [ ] **`CB-4` — le chemin EXCEPTION de `DD-7` a son témoin** (`L-2`). `range <projet>
      --exclude-file <chemin inexistant> --json` sur un chapeau factice : sortie **1**,
      `{ ok:false, … }` portant **`branchesSansCopieDistante`**, son **compteur** et
      **`scanBranches`** ; **aucun** dépôt restic créé.
      **Témoin négatif** (deux, tous deux obligatoires) : (a) retirer `...champsScan` du `catch`
      (`range.js:129`) doit faire **rougir** ; (b) le message d'erreur doit matcher un des `throw` de
      `lib/range.js` et **ne pas** matcher `restic a echoue (code` — sinon le test a emprunté le
      **mauvais chemin** et ne prouve rien (`RB-4`).

- [ ] **`CB-5` — la grammaire ne boite plus** (`W12`). En périmètre ciblé, l'en-tête rend
      **« sur 1 depot »** ; à 2 dépôts et plus, **« depots »**. Idem pour « depots scannes ».
      **Témoin négatif** : une recherche de `1 depots` dans la sortie rendue doit rendre **zéro** ;
      remettre le littéral invariable doit faire rougir.

- [ ] **`CB-6` — aucune régression, et le périmètre est tenu au fichier près.** `node --test` depuis
      `cli/` : **vert**, les **26** gardes du lot 2 comprises. `git diff` rend **zéro ligne** sur
      `cli/src/commands/range.js`, `cli/test/range.test.js`, `cli/test/guard-json-output.test.js`,
      `docs/commandes.md`, `config/sauvegarde-branches-ignorees.txt`.
      **Témoin négatif** : une seule ligne de diff sur l'un de ces cinq fichiers **invalide le lot** —
      `DG` a été conçu pour n'en toucher aucun.

- [ ] **`CB-7` — le relevé d'exécution du lot 2 existe et il est HONNÊTE** (`DI`, `L-4`). Le fichier
      `signalement-branches-sans-copie-distante.md` porte, **en dernière section**, un tableau de
      **15 lignes** (`CA-1`…`CA-15`) avec verdict ∈ {`vert`, `vert (dégradé)`, `non tenu`, `sans
      objet`} et **preuve nommée** (`fichier:ligne`, commit, ou chiffre). Les **15 cases** sont
      cochées **ou** portent un verdict `non tenu` assumé.
      **Témoin négatif** : une case cochée **sans** ligne de relevé, ou une ligne de relevé sans
      preuve, **invalide le critère**. « OK » n'est pas un verdict ; « rapide » n'est pas un chiffre.

- [ ] **`CB-8` — ce lot s'applique à lui-même selon `DH`.** Sa branche a une **ref distante** avant la
      remise ; `--branches` **ne la signale plus** ; et l'**exposition mesurée au reflog** (création →
      premier push) est **inférieure à 30 minutes**, chiffre **écrit** dans la remise.
      **Témoin négatif** : **avant** le `push -u`, elle **doit** apparaître dans le signalement —
      capture **verbatim** dans la remise. *C'est la preuve que la garde attraperait l'incident
      fondateur.* Si le plafond de 30 min avait été atteint, le repli de `DH-4` s'applique **et son
      motif est écrit**.

---

## Chiffrage

> **Estimation, pas engagement.** Ordre de grandeur assumé et révisable, à confronter au temps réel à
> la clôture du lot — la règle que le lot 2 a posée pour lui-même.

| Nature | Geste | Coût |
|---|---|---|
| **Mécanique** | `DG` : couture `compter`, garde `n === null`, 2 compteurs, phrase honnête, 1 limite, accord de « depot(s) » | **0,15 j-h** |
| **Gardes** | `CB-1`, `CB-2` — le silence cesse ; `S1` rejoué **rouge**, consigné verbatim | **0,1 j-h** |
| **Gardes** | `CB-3` — l'ordre de rendu, unitaire **et** à travers `balayer` sur dépôt réel | **0,1 j-h** |
| **Gardes** | `CB-4` — harnais du chemin exception + assertion discriminante | **0,1 j-h** |
| **Gardes** | `CB-5` — l'accord de « depot(s) » | **0,02 j-h** |
| **Dossier** | Amendement du lot 2 : commit de la rectification, **relevé de 15 lignes** rempli, cases cochées (`DI`) | **0,12 j-h** |
| **Mesure** | Recette sur le chapeau réel + chiffres de `DH` (capture, push, exposition) | **0,05 j-h** |
| **TOTAL** | | **≈ 0,65 j-h** |

**Complexité : FAIBLE. Risque : FAIBLE à MOYEN — et il est dans les témoins, pas dans le code.** Le
code de `DG` est une garde et deux compteurs ; ce qui peut rater, c'est **un témoin qui ne morde
pas** — le défaut exact que ce lot vient réparer, et qu'il pourrait reproduire (`RB-3`, `RB-4`). D'où
deux critères (`CB-3`, `CB-4`) qui exigent **explicitement** de prouver que le témoin a emprunté le
bon chemin.

**Les trois inconnues qui peuvent faire glisser le lot :**
1. **Le coût réel de `CB-3` en durée de suite** : le dépôt réel de 12 branches multiplie les processus
   git (repère de Legolas : ≈ 11 ms chacun). Si la suite s'allonge au point de gêner, l'arbitrage est
   de **réduire le nombre de branches** du fixture (12 → 11, plancher pour dépasser le plafond de 10)
   — **jamais** de repasser à un rapport fabriqué à la main : **+0,05 j-h**.
2. **Le nombre de branches indéterminées sur le chapeau réel** : attendu **0**. Si le premier passage
   en rend, ce n'est **pas** un défaut de ce lot — c'est **un constat neuf** sur le portefeuille, à
   remonter au décideur : **+0,1 j-h** et un arbitrage, pas une correction silencieuse.
3. **Le remplissage du relevé du lot 2** : si les corps de commits ne contiennent pas toutes les
   sorties rouges attendues, certaines lignes seront `non tenu` — **c'est un résultat, pas un échec**,
   mais il faut le temps de le constater plutôt que de le supposer : **+0,1 j-h**.

---

## Sources vérifiées pendant le cadrage

- [gitrevisions — `<branchname>@{upstream}` / `@{u}`](https://git-scm.com/docs/gitrevisions)
- [git — suite de tests `t/t1507-rev-parse-upstream.sh` (cas d'erreur sans upstream)](https://github.com/git/git/blob/master/t/t1507-rev-parse-upstream.sh)
- [`fatal: no upstream configured for branch` — code de sortie 128 observé](https://github.com/microsoft/vscode/issues/91811)
- [git-check-ref-format — règle 4 : ni espace, ni `~`, ni `^`, ni `:` dans un nom de ref](https://git-scm.com/docs/git-check-ref-format)
- [git-rev-list — `--remotes`, `--not`, `--count`](https://git-scm.com/docs/git-rev-list) *(hérité du lot 2, non rejugé)*

---

## Relevé d'exécution

> ⚒️ **À remplir par Gimli en fin de lot** (`DI`), **appendu** — jamais substitué au corps ci-dessus.
> Tant que cette section porte cet encadré, le lot n'est pas remis.

| Critère | Verdict | Preuve (`fichier:ligne`, commit, ou chiffre mesuré) | Note |
|---|---|---|---|
| `CB-1` | | | |
| `CB-2` | | | |
| `CB-3` | | | |
| `CB-4` | | | |
| `CB-5` | | | |
| `CB-6` | | | |
| `CB-7` | | | |
| `CB-8` | | | |

**Chiffres de `DH`** — création de la branche : `…` · capture de `CB-8` : `…` · `push -u` : `…` ·
**exposition totale** : `…` (plafond écrit : 30 min).

**Confrontation estimation ↔ temps réel** — estimé **0,65 j-h** · réel : `…` · écart et motif : `…`
