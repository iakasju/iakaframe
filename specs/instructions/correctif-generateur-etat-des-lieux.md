# Correctif du générateur d'état des lieux — nom du projet, version, compte de fichiers

> **Statut** : PROPOSÉE (cadrage 🧙 Gandalf, 2026-08-16) — **AMENDÉE le 2026-08-17** (🧙 Gandalf).
> Attend l'arbitrage du décideur sur **A-1** seul ; le reste est exécutable.
> **Périmètre technique** : `cli/src/commands/snapshot.js` et son entourage direct.
> **Voisins jamais absorbés** : `garde-balayante-routage-prod` (livré depuis, merge `3111230`),
> `GUI-VENDOR-CHARON`, `ROLE-VOCAB-CANON`, `GUI-PARITE-WORKTREE`, dette de tagging,
> et les **trois successeurs neufs** nommés en § 5 (`CHECKPOINT-NARRATIF`,
> `VENDOR-REMEDE-CARDINAL`, `CLI-WRAPPER-RACINE`).

> ### Amendement du 2026-08-17 — ce qui a changé, et pourquoi
>
> Trois mesures neuves sont arrivées **après** le cadrage initial. Elles ne l'invalident pas ;
> elles **élargissent la nature du défaut (3)** et ajoutent deux décisions. Résumé des mouvements :
>
> | Mouvement | Portée |
> |---|---|
> | **§ 2.6 neuf** — mesure sur le dépôt frère `iakaFrameGUI` | Le défaut (3) change de nature : la règle d'exclusion est **incohérente avec elle-même**. |
> | **D3 requalifiée** (décision **inchangée**) | Le remède écrit tenait déjà ; c'est le **diagnostic** qui était trop étroit. |
> | **D5 devient SANS OBJET** | La note fausse a **disparu** d'elle-même — et c'est la preuve de D6. |
> | **D6 neuve** | `update` avertit avant tout `git add` quand le narratif est resté en placeholders. |
> | **D7 neuve** | `snapshot`/`update` disent **quel CLI** s'exécute et **sur quelle racine**. |
> | **§ 5 rectifiée** | Une affirmation de vendorage du cadrage initial était **imprécise**. |
> | **Estimation** | **0,5 → 0,75 j-h**. Motif détaillé en § 10. |
>
> **Ce que cet amendement N'a PAS fait**, à dessein : `A-1` reste ouvert, `D4` tient, la structure
> et les décisions D1/D2/D3 ne sont pas refaites. Les refus argumentés sont en § 11.

> ### Note de méthode — ce que j'ai pu vérifier moi-même, et ce que je n'ai pas pu
>
> Cette session d'amendement **ne dispose pas de shell**. Les constats ci-dessous ont donc été
> repris **par lecture de fichiers sur le disque** (sources, `.gitignore`, journaux), jamais par
> exécution. Les **comptages** cités en § 2.6 (469 fichiers suivis, 8 466 sous `src-tauri/target/`)
> sont des **mesures de 🤴 Aragorn**, attribuées comme telles et **non re-mesurées par moi** ; ce
> que j'ai vérifié moi-même, c'est leur **cohérence arithmétique** et les **causes dans le code**.
> Les mesures du § 2 d'origine, elles, ont bien été faites par moi en session outillée.

---

## 1. Problème

Le générateur d'état des lieux produit trois chiffres ou libellés que **l'appelant doit corriger
à la main** : le titre porte le nom du dossier courant (donc « merge-main » quand on le lance
depuis un arbre lié), `--version` s'inscrit tel quel sans contrôle de forme, et le compte de
fichiers dépend de l'arbre depuis lequel on tire — ce qui rend la colonne `files` du journal
non comparable d'une entrée à l'autre. Le dépôt travaille **couramment en worktrees** : ce
n'est pas un cas marginal, c'est le mode nominal.

Un générateur qui exige un contournement (racine symlinkée) pour écrire le bon titre est cassé.
Un format de journal tenu par **la vigilance de l'appelant** et non par le code finira par mentir
— le dépôt en a déjà la preuve écrite : le compte de fixtures de l'aide `vendor-check` était
recopié à la main et faux depuis les lots 5b/5c (journal, entrée `2026-07-31 16:31`).

---

## 2. Constat vérifié moi-même — sources en `chemin:ligne`

### 2.0 Rectification de chemin (le brief citait un fichier qui n'existe pas)

Le générateur est en **`cli/src/commands/snapshot.js`**, pas `cli/src/lib/snapshot.js`. Les numéros
de ligne transmis (97, 89-92) tombent juste — sur ce fichier-là. Tous les renvois ci-dessous sont
relus sur le disque de ce worktree.

### 2.1 D1 — le nom du projet vient du dossier courant

- `cli/src/commands/snapshot.js:97` — `const project = path.basename(root);`
- Consommé en `cli/src/commands/snapshot.js:116` (titre MD), `:150` (`<title>`) et `:173` (`<h1>`).
- `root` vient de `:82` → `path.resolve(projectPath)`, lui-même `values.path || process.cwd()`
  (`:228`), ou `root` de l'appelant (`update.js:95`, `onboard.js:156`).
- **Conséquence mesurée** : lancé depuis `.claude/worktrees/merge-main`, le générateur écrit
  « Etat des lieux - merge-main ». Trace du contournement dans ~~`specs/etat-des-lieux.md:74-78`~~
  → **`specs/etat-des-lieux.md:81-84`** (renvoi rectifié le 2026-08-17 : le narratif a été réécrit
  entre-temps, la trace est aujourd'hui dans les « Pièges connus », point (1)).

### 2.2 D2 — `--version` n'est ni normalisé ni validé

- Cascade : `cli/src/commands/snapshot.js:89-92`.
- `authorityVersion()` (`:46`) et `projectPackageVersion()` (`:59`) **forcent** le préfixe (`'v' + …`).
  `git describe --tags` (`:90`) rend le tag verbatim. Le `--version` explicite (`:228`) **traverse
  sans aucun contrôle** jusqu'à `:109` (journal), `:120` (MD), `:177` (HTML).
- L'asymétrie est le vrai défaut : `reason` **est** validé strictement, avec sortie en erreur
  (`:225-227`) ; `version`, qui alimente un fichier versionné, ne l'est pas du tout.
- Toutes les entrées du journal antérieures portent le `v` (`specs/.iakaframe-journal.json`) : cet
  invariant n'est tenu par **rien** dans le code.
- Effet de bord voisin : `update.js:103` réinjecte `values.version` **brut** dans le message de commit.

### 2.3 D3 — le compte de fichiers dépend de l'arbre de mesure

- `cli/src/commands/snapshot.js:64-76` — `countFiles` marche l'arbre et n'exclut, par **nom**, que
  `.git` et `node_modules`. Appel en `:95`, écrit en `:109` (`files`), `:124` (MD), `:181` (HTML).
- Rien n'exclut `.claude/`, où vivent les arbres liés du dépôt.

**Mesures faites dans ce worktree :**

| Mesure | Valeur | Comment |
|---|---|---|
| Fichiers d'un worktree (`cadrage-snapshot`) | **1079** entrées, dont `.git` (un **fichier** en arbre lié, exclu par nom en `:69`) → **1078** | énumération exhaustive |
| Fichiers sous `.claude/` de la racine réelle | **6471** | énumération exhaustive |
| `.claude/` est-il ignoré ? | **oui** — `.gitignore:2` (`/.claude/`) | lecture |
| Dernière entrée du journal | `files: 1078` | `specs/.iakaframe-journal.json` (dernière entrée) |
| Entrée précédente (2026-08-03) | `files: 1469` | idem |

### 2.4 Ce que j'**infirme** dans les mesures de ⚒️ Gimli

**La chute 1469 → 1078 n'est pas causée par le comptage des worktrees.** L'arithmétique ne tient
pas : un worktree pèse ~1078 fichiers, quatre en pèsent ~4300, et l'ensemble de `.claude/` en pèse
**6471**. Si le snapshot du 2026-08-03 avait compté les arbres liés, il aurait inscrit **~7500**,
pas 1469. Le delta réel de 391 s'explique autrement : **1469 a été pris depuis la racine réelle**
(fichiers suivis **+** artefacts locaux ignorés/non suivis : réglages de session, `dist/`, `*.zip`,
`*.pdf`…) **à une date où `.claude/` ne portait pas encore d'arbres liés** ; **1078 a été pris
depuis un arbre fraîchement lié**, qui ne contient que les fichiers suivis. Coïncidence probante :
1079 entrées − le fichier `.git` = **exactement 1078**.

Deux conséquences, et la seconde est plus grave que le constat d'origine :

1. La formulation « les valeurs antérieures sont **gonflées par les worktrees** » est **fausse**.
   La formulation juste est : « les valeurs antérieures **ne sont pas comparables** à 1078, parce
   que la règle de comptage dépend de l'arbre depuis lequel on tire. » Le journal porte d'ailleurs
   déjà une autre discontinuité de la même famille : `873` → `730` → `894`
   (`specs/.iakaframe-journal.json:329`, `:339`, `:359`).
2. Le défaut décrit est **réel et latent, pas encore inscrit** : un `snapshot` lancé **aujourd'hui**
   depuis `/Users/sjupin/work/iakaframe` inscrirait ~**7500**. Le correctif est donc à faire
   **avant** le prochain checkpoint depuis la racine, sans quoi le journal prendra un chiffre
   absurde qu'on ne pourra plus qu'expliquer.
   > **Amendement 2026-08-17 — « latent » ne vaut que POUR CE DÉPÔT.** Le § 2.6 montre que sur le
   > dépôt frère `iakaFrameGUI`, le même défaut est **déjà inscrit, cinq entrées de suite**. Le
   > correctif n'anticipe donc pas seulement un accident : il arrête un **saignement en cours**
   > ailleurs dans le portefeuille.

En revanche « **1078 est le compte honnête** » se tient : c'est le nombre de fichiers **suivis**
du dépôt, et c'est une définition reproductible.

### 2.5 Faits externes vérifiés sur le web (avant de trancher D1)

- `git rev-parse --git-common-dir` **est** dans la liste des options « modified by `--path-format` »
  de la documentation officielle. Un résultat de recherche affirmait l'inverse ; il est **faux** —
  vérifié sur la page man de référence.
- `--path-format=(absolute|relative)` a été **introduit en git 2.31** (mars 2021). Avant, l'option
  n'est pas comprise et pollue la sortie.
- **Conséquence de cadrage** : on **n'utilise pas** `--path-format`. `git rev-parse --git-common-dir`
  seul rend un chemin **relatif** depuis l'arbre principal (`.git`) et **absolu** depuis un arbre
  lié ; `path.resolve(root, sortie)` couvre les deux **sans plancher de version git**. Moins de
  surface, même résultat.

### 2.6 (amendement 2026-08-17) — le défaut (3) change de NATURE : la règle d'exclusion est incohérente **avec elle-même**

Le cadrage initial n'a mesuré qu'**un** dépôt. Le dépôt frère **`/Users/sjupin/work/iakaFrameGUI`**
donne la mesure qui manquait, et elle est **plus grave** que le cas « worktrees » déjà instruit.

**Mesures (🤴 Aragorn, 2026-08-16) — non re-mesurées par moi, faute de shell :**

| Mesure | Valeur |
|---|---|
| Champ « Fichiers (hors `.git`/`node_modules`) » du dernier état des lieux GUI | **9 227** |
| Fichiers **suivis** par git | **469** |
| Fichiers sous `src-tauri/target/` | **8 466** |

**Série historique de son journal** — vérifiée par moi, lecture de
`/Users/sjupin/work/iakaFrameGUI/specs/.iakaframe-journal.json` :
`25 324 → 25 862 → 26 208 → **13 194** → **9 227**`. Le projet n'a pas perdu 17 000 fichiers ;
ce sont des `cargo clean` et des recompilations.

**La cause, vérifiée par moi dans le code et la configuration :**

- `cli/src/commands/snapshot.js:69` — `if (e.name === '.git' || e.name === 'node_modules') continue;`
  Deux noms. **Deux seulement.**
- `/Users/sjupin/work/iakaFrameGUI/.gitignore:1-9` — le dépôt ignore `node_modules/`, `dist/`,
  `build/`, `target/`, `src-tauri/target/`, `src-tauri/gen/`, `coverage/`.

`node_modules` et `target/` sont **exactement la même chose** : des dépendances **reconstructibles**,
déclarées non versionnables par le projet lui-même. Le générateur en exclut **une** et compte
**l'autre**. Il n'applique donc aucune règle : il applique une **liste de deux noms, écrite en dur,
qui a vieilli**. Le jour où un projet est en Rust, en Go ou en Java, la liste ne couvre plus rien.

**Cohérence arithmétique — le seul contrôle que je pouvais faire sans shell** : `469 + 8 466 = 8 935`,
soit un résidu de **292** face aux 9 227 annoncés. Ce résidu est **du même ordre que les autres
dossiers ignorés du GUI** (`dist/`, `build/`, `coverage/`, `src-tauri/gen/`, `*.log`, `.DS_Store`)
que le parcours compte et que la règle de D3 écarterait. Les chiffres se **tiennent** ; je ne les
déclare pas **fermés** — le résidu n'est pas mesuré.

**Requalification du défaut (3), à substituer à sa formulation d'origine :**

> ~~« la règle de comptage dépend de l'arbre de mesure »~~
> **« la règle d'exclusion est arbitraire et incohérente, et le champ ne mesure pas ce que son nom
> annonce. »**

Le champ annonce « Fichiers (hors `.git`/`node_modules`) » — ce qui est **littéralement vrai** et
**trompeur en pratique** : ce qu'il mesure réellement, à 92 % sur le GUI, c'est **l'état du cache de
build local de la machine qui a lancé la commande**. Et il l'inscrit dans un journal **append-only**
dont la fonction déclarée est de servir de **mémoire de reprise**.

**Conséquence sur la décision : aucune. D3 tenait déjà.** `git ls-files --cached --others
--exclude-standard` écarte `target/` **gratuitement**, par le même mécanisme qui écarte
`node_modules` et `.claude/` : parce que le **projet** les a déclarés ignorés, et non parce qu'un
mainteneur du CLI a pensé à leur nom. C'est le diagnostic qui était trop étroit, pas le remède.
Le refus de la variante « compter les suivis **seuls** » est argumenté en D3.

### 2.7 (amendement 2026-08-17) — trois défauts voisins, **dont un seul entre**

Vérifiés par moi, lecture directe des sources de ce worktree :

**(a) `iakaframe update` lancé d'un bloc commiterait un narratif VIDE** — trouvé par ⚒️ Gimli au
merge du 2026-08-16.
- `cli/src/commands/snapshot.js:132-136` — le générateur **réécrit** la section « Reprise du travail »
  avec quatre placeholders `<!-- ... -->`, **à chaque appel**, sans jamais lire ce qui s'y trouvait.
- `cli/src/commands/update.js:95` (snapshot) → `:100` (`git add -A`) → `:104` (commit) → `:110` (push) :
  **le même processus**, sans point d'arrêt. Le récit part donc en commentaires vides.
- **Trace du contournement, écrite dans l'artefact lui-même** : `specs/etat-des-lieux.md:86-89`
  (« la section « Reprise du travail » est **ecrasee par des placeholders** […] le checkpoint a donc
  ete **decompose** »). L'outil impose une décomposition manuelle du verbe — cousin exact des
  défauts (1) et (3), où l'appelant corrige à la main ce que le code devrait tenir.
- **Verdict de périmètre : moitié dedans (D6), moitié dehors (`CHECKPOINT-NARRATIF`).** Motivé en D6.

**(b) `vendor-check` affirme une correspondance qu'il n'honore pas.**
- `cli/src/commands/vendor-check.js:228` — `REMEDE - ${remediation.length} geste(s), **un par derive
  constatee**` — et le commentaire `:223-224` répète le même invariant.
- Or `remediationFor` (`:174-192`) **déduplique** sur la clé `action|source|dest|command` (`:183-185`),
  avec un commentaire qui l'assume : « une même copie peut être demandée par deux raisons […]
  l'opérateur ne doit la lire qu'une fois ».
- **Donc la phrase est fausse dès que la déduplication mord** — ce qui est précisément le cas des
  trois dérivées régénérées par le même `gen-fixtures.mjs` : une commande identique, une seule entrée,
  d'où **23 gestes pour 24 dérives**. Le **remède est correct** ; c'est la **phrase** qui ment.
- **Verdict de périmètre : DEHORS.** Autre commande, autre fichier, autre suite de tests
  (`cli/test/vendor-check.test.js:378-427` porte une recette dédiée du bloc `REMEDE`). Successeur
  **`VENDOR-REMEDE-CARDINAL`** nommé en § 5, avec titulaire.

**(c) le wrapper de poste exécute toujours le CLI de la RACINE.**
- `/Users/sjupin/.local/bin/iakaframe:5` — `exec node "$HOME/work/iakaframe/cli/src/index.js" "$@"`.
  Chemin **en dur**, indépendant du répertoire courant.
- Son en-tête (`:2-4`) assume l'intention — pas d'install npm globale, donc pas de rupture quand nvm
  change de version de node, « le code exécuté est TOUJOURS celui du dépôt (live) ». L'intention est
  bonne ; c'est le mot **« le »** qui est faux : il y a **N** dépôts (la racine et ses arbres liés).
- **Effet mesuré** : `iakaframe <verbe>` lancé depuis un worktree exécute le CLI de la racine —
  laquelle portait, le 2026-08-16, la branche **non commitée** du décideur. On aurait exécuté du code
  **en cours d'édition** en croyant tester le lot. ⚒️ Gimli a dû appeler `node cli/src/index.js` à la main.
- **Verdict de périmètre : la CAUSE dehors, la CÉCITÉ dedans (D7).** Motivé en D7 et § 5.

---

## 3. Décisions retenues

### D1 — La « racine du projet » pour le NOM, c'est le **dépôt principal**, résolu par git

**Retenu.** Le nom affiché dérive du **dossier du dépôt principal** (`--git-common-dir`), pas du
dossier courant :

```
si isRepo(root) :
    commonDir = path.resolve(root, out(root, ['rev-parse', '--git-common-dir']))
    si path.basename(commonDir) === '.git' : nom = path.basename(path.dirname(commonDir))
    sinon                                   : nom = path.basename(root)      // repli
sinon :
    nom = path.basename(root)                                                // hors git, inchangé
si nom vide ou '.' : nom = path.basename(root)                               // repli
```

**Pourquoi la garde `basename(commonDir) === '.git'`** — c'est elle qui rend la règle sûre hors des
deux cas nominaux, et elle coûte une ligne :

| Cas | `--git-common-dir` | Résultat |
|---|---|---|
| Racine réelle | `.git` (relatif) | `iakaframe` ✅ |
| Arbre lié `.claude/worktrees/merge-main` | `/…/iakaframe/.git` (absolu) | `iakaframe` ✅ |
| **Sous-module** | `…/.git/modules/<nom>` | basename ≠ `.git` → repli sur le dossier courant ✅ |
| **Dépôt bare** (`foo.git`) | `…/foo.git` | basename ≠ `.git` → repli ✅ |
| **Hors git** | (rien) | repli, comportement **identique à aujourd'hui** ✅ |

**Écarté — `--show-toplevel`** : dans un arbre lié il rend l'arbre lié lui-même, donc reproduit
exactement le bug. **Écarté — une autorité de nom déclarée** (champ `name` d'un `package.json`,
d'un `iakaframe.json`) : `@naonedge/iakaframe` n'est pas un nom de projet affichable, et un
`iakaframe.json` n'existe pas à la racine de ce dépôt ; ça changerait le titre de tous les projets
du portefeuille pour régler un problème de worktree. Sur-ingénierie.

**Frontière explicite, à ne pas franchir** : cette décision porte **uniquement sur le nom affiché**.
Les **écritures restent dans `root`** (`specs/etat-des-lieux.md`, `.html`, `.iakaframe-journal.json`)
— c'est là que le travail est commité. Rediriger les écritures vers le dépôt principal ferait
écrire un worktree dans un autre : interdit.

### D2 — Validation **stricte** de la forme + normalisation du **seul** préfixe `v`, sur la **seule** entrée explicite

**Retenu**, et c'est un « les deux », pas un « l'un ou l'autre » :

- **Forme refusée** : tout `--version` qui ne correspond pas à `^v?\d+\.\d+\.\d+([-+][0-9A-Za-z.+-]*)?$`
  → message clair + `process.exitCode = 1`, **sur le modèle exact de la validation de `reason`**
  (`snapshot.js:225-227`). On aligne une asymétrie existante, on n'invente pas un mécanisme.
- **Préfixe normalisé** : `0.39.0` → `v0.39.0`.

**Pourquoi ce partage, et pas la normalisation seule** — l'objection « une normalisation silencieuse
masque une faute de frappe » est juste, mais elle ne vise pas le préfixe : un `v` manquant n'est pas
une faute de frappe, c'est une **variante de notation** de la même valeur, et 3 des 4 branches de la
cascade le forcent déjà (`:46`, `:59`). En revanche `v0.39`, `0.39.O` ou `derniere` **sont** des
fautes, et elles doivent mordre.

**Pourquoi ce partage, et pas le refus seul** — « un refus peut casser des appels existants » : avec
ce partage, **aucun appel légitime ne casse**. Un appel qui passait `0.39.0` continue de marcher (et
écrit désormais la bonne forme) ; les seuls appels qui cassent sont ceux qui **inscrivaient déjà de
la fausse donnée** dans un fichier versionné. Casser ceux-là est le but.

**Ce qu'on ne touche pas, et pourquoi** : la sortie de `git describe --tags` (`:90`) est laissée
**verbatim**. Un tag est un **nom**, pas un littéral de version : un projet tiers peut taguer
`release-2026-01` ou `2026.08`, et lui coller un `v` serait renommer son tag dans son propre état
des lieux. Le sentinelle `'-'` (`:92`) est également hors normalisation.

**Où poser le contrôle** : une seule fonction exportée (p. ex. `normalizeVersion(raw)` → `{ ok, value }`),
appelée (a) dans `runSnapshot` **et** `runUpdate` pour le refus + `exitCode = 1`, et (b) dans
`doSnapshot` pour que les appels **programmatiques** (`update.js:95`, `onboard.js:156`, tests) ne
puissent pas contourner la règle — `doSnapshot` **lève** sur une forme invalide plutôt que d'écrire.
Un seul endroit décide, deux couches l'appliquent.

### D3 — Le compte de fichiers dérive de **l'index git** ; le parcours de fichiers devient le repli hors git

**Retenu — et RECONFIRMÉ tel quel au vu du § 2.6.** La décision ne bouge pas ; son **motif s'élargit** :
elle ne répare plus seulement un chiffre non comparable d'un arbre à l'autre, elle répare un chiffre
qui **ne mesure pas ce que son nom annonce**. `--exclude-standard` délègue l'exclusion au
**`.gitignore` du projet mesuré**, ce qui rend le générateur juste sur un projet Rust, Go ou Java
**sans que personne n'ait à penser à `target/`**. Une liste de noms en dur ne pouvait pas tenir cette
promesse ; c'est la leçon du GUI.

```
si isRepo(root) et que `git ls-files --cached --others --exclude-standard` réussit :
    compte = nombre de lignes non vides
sinon :
    compte = countFiles(root)        // parcours existant, inchangé
```

- **Pourquoi l'index** : c'est la seule définition **indépendante de l'arbre de mesure**. Elle rend
  le même chiffre depuis la racine et depuis n'importe quel arbre lié — ce qui est précisément la
  propriété qui manquait. Elle exclut les worktrees **gratuitement** (`.claude/` est ignoré,
  `.gitignore:2`), sans jamais coder « `.claude/worktrees` » en dur dans le générateur : une
  exclusion en dur ne tiendrait pas le jour où les arbres liés déménagent.
- **Pourquoi `--others --exclude-standard` et pas l'index seul** : un snapshot de `pause` se prend
  presque toujours sur un arbre sale ; compter l'index seul manquerait les fichiers du lot en cours.
  La définition devient « **les fichiers que le projet versionne ou versionnera** ».
- **Pourquoi garder le parcours** : les projets **hors git** existent (`onboard` sur un dossier nu) ;
  leur comportement doit rester **mot pour mot** celui d'aujourd'hui.
- **Repli sur échec** : on teste le **succès de la commande** (`run(...).ok`), pas la sortie vide —
  un dépôt réellement vide rend légitimement `0`, et il ne doit pas basculer sur le parcours.
- **Le libellé change avec la règle** — c'est lui qui rend le chiffre lisible :
  - git : `| Fichiers (suivis + non ignores) | N |`
  - hors git : `| Fichiers (hors .git/node_modules) | N |` (inchangé)
  - HTML symétrique (`:181`).
  Aucun consommateur ne lit ce libellé (vérifié : `lib/etat.js` n'indexe que `Version`, `Note`,
  `Dernier commit` ; aucun test n'assertionne `fileCount`). **Le libellé EST le marqueur de
  discontinuité** : l'état des lieux dit désormais, sur sa face, quelle règle a produit le nombre.
  Aucun champ machine supplémentaire n'est nécessaire.

**(amendement 2026-08-17) Écarté — « compter les fichiers SUIVIS seuls » (`git ls-files` nu).**
La piste m'a été proposée sans m'être imposée ; je la refuse, et voici pourquoi.

- **L'écart entre les deux options est du second ordre.** Sur le GUI : la règle actuelle compte
  **9 227**, la variante « suivis seuls » rendrait **469**, D3 rendrait **469 + les non-suivis non
  ignorés** — quelques unités à quelques dizaines. Les deux options corrigent **le même 8 700** ;
  elles se disputent une frange. Trancher sur la frange en dégradant le cas dominant serait un
  mauvais échange.
- **Le cas dominant, dans ce dépôt, est le tir sur arbre SALE.** Le journal est majoritairement fait
  d'entrées `pause` et `manual` prises en cours de lot. « Suivis seuls » **manquerait par
  construction les fichiers du lot en cours** — c'est-à-dire exactement le travail que le checkpoint
  est censé mémoriser. Le champ deviendrait juste **et aveugle au présent**.
- **L'argument « ça ne bouge que quand le projet bouge » se retourne** : un fichier source neuf,
  écrit et pas encore commité, **est** le projet qui bouge. C'est un mouvement réel, pas du bruit.
  Le bruit — caches, artefacts, réglages de poste — est déjà écarté par `--exclude-standard`.
- **Ce que la piste vise réellement est déjà obtenu.** « Un chiffre qui a un sens » : D3 en donne un,
  énonçable en une phrase — *les fichiers que le projet versionne ou versionnera*. « Qui ne dépend
  pas de la machine » : `--exclude-standard` s'en charge.
- **Réserve honnête, inscrite plutôt que tue** : un fichier non suivi, non ignoré et **non
  destiné à l'être** (brouillon, export ponctuel) sera compté. C'est un **défaut d'hygiène du dépôt
  rendu visible**, pas un défaut du compteur — et le rendre visible vaut mieux que le masquer.
  Si l'usage montre que cette frange bruite le journal, la bascule vers « suivis seuls » est un
  changement d'**un seul drapeau** : la porte reste ouverte, elle n'est pas condamnée.

### D4 — L'historique du journal n'est **pas** réécrit

**Retenu, et ce n'est pas mon arbitrage : j'applique un précédent du décideur.** Le journal porte
déjà la décision, prise le 2026-07-31 sur un cas identique (un compte recopié devenu faux) :

> « Journal et instructions NON reecrits : leurs comptes sont vrais a leur date. »
> — `specs/.iakaframe-journal.json`, entrée `2026-07-31 16:31`

Les valeurs antérieures **étaient vraies à leur date, sous la règle de leur date**. Les recalculer
commit par commit (les hashes sont dans le journal) est techniquement possible pour la part suivie,
mais transformerait un **relevé de ce qui a été observé** en **jeu de données reconstruit** — ce qui
change la nature de l'artefact. Non.

**(amendement 2026-08-17) D4 s'étend au journal de `iakaFrameGUI`, et pour UNE RAISON DE PLUS.**
La tentation est plus forte là-bas : cinq entrées visiblement absurdes (`25 324 → … → 9 227`) et une
vérité connue (469). Le précédent du décideur tient quand même — le passé reste ce qu'il était à sa
date. Mais s'y ajoute un motif que ce lot ne peut pas contourner : **`iakaFrameGUI` est un autre
dépôt**. Réécrire sa mémoire append-only depuis ce lot serait une **écriture cross-repo sans gate**,
sur un artefact dont ce lot n'a ni la branche, ni la revue, ni le décideur au bout. Non — deux fois non.

*Ce qui, en revanche, se pose sciemment : le **prochain** snapshot du GUI passera de `9 227` à
~`470`. Voir R1 et § 11.*

### D5 — ~~La note fausse de l'état des lieux est corrigée **en place**~~ → **SANS OBJET** (amendement 2026-08-17)

**Retirée du périmètre : la cible n'existe plus.**

Le cadrage visait `specs/etat-des-lieux.md:79-82`, qui portait l'explication causale infirmée en
§ 2.4 (« il compte aussi les worktrees », « les valeurs anterieures etaient gonflees »). **Vérifié
sur le disque de ce worktree ce jour** : une recherche de `gonfl` et de `worktrees` dans
`specs/etat-des-lieux.md` ne rend **aucune occurrence**. Les lignes 79-82 portent aujourd'hui tout
autre chose (la fin du bullet « Prochaine étape concrète » et le début des « Pièges connus » du lot
`garde-balayante`). Le checkpoint du 2026-08-16 a **réécrit le narratif de bout en bout**, et la
note fausse est partie avec.

**Il n'y a donc rien à corriger, et ce serait une faute d'inventer une correction pour honorer une
décision périmée.** Le § 2.4 reste la trace écrite de l'infirmation, dans cette instruction, qui est
versionnée — c'est suffisant.

> 🛑 **Ce qui vient de se passer EST le constat (a) du § 2.7, en acte.** Une correction cadrée, datée
> et argumentée a été **effacée sans que personne la retire** — simplement parce que la section n'a
> aucune continuité d'un checkpoint à l'autre. Ni le décideur ni moi n'avons décidé de l'abandonner ;
> elle est tombée. C'est la démonstration la plus nette qu'on puisse produire du défaut, et c'est ce
> qui fonde **D6**.
>
> Elle fonde aussi, en creux, un **refus** : cette même démonstration pourrait servir à réclamer que
> le générateur **préserve** le narratif. Ce serait la mauvaise conclusion, et D6 dit pourquoi.

### D6 (neuve — amendement 2026-08-17) — `update` ne peut plus committer un narratif vide **en silence**

**Retenu, et délibérément PARTIEL.** Le défaut (a) du § 2.7 a deux moitiés, qui n'ont pas le même
statut : l'une est un **bug incontestable**, l'autre est une **décision de flux**. Je ne fais entrer
que la première.

**Ce qui entre — le silence.** `runUpdate` gagne un avertissement, posé **entre `doSnapshot`
(`update.js:95`) et `git add -A` (`update.js:100`)**, exactement là où `warnFrameLeak` est déjà
appelé (`:98`) : si la section « Reprise du travail » du MD qui vient d'être écrit ne contient que
des placeholders, la commande le **dit**, nomme le fichier, et **continue**.

- **Non bloquant, et ce n'est pas une timidité** : `update.js:29-36` porte une doctrine explicite et
  argumentée — *« y placer un gate bloquant transformerait le geste de sauvegarde en geste de
  publication, et la première fois qu'il empêcherait de sauvegarder du travail en cours, il serait
  contourné ou désactivé »*. Je m'y range plutôt que de la contredire dans un lot de correctif.
  Le même fichier porte déjà le précédent : l'avertissement de fuite de miroir.
- **Ce que ça change réellement** : le checkpoint peut toujours partir avec un récit vide — mais
  **plus jamais sans qu'on l'ait su au moment de le faire**. C'est le passage de *défaut silencieux*
  à *défaut déclaré*, qui est la doctrine de tout ce lot (D2 refuse une fausse version, D3 nomme sa
  règle dans le libellé, D7 nomme sa provenance).

**Ce qui NE rentre PAS — la refonte du flux, et pourquoi je ne la tranche pas ici.** Le remède
« évident » est de faire **préserver** le narratif par le générateur au lieu de l'écraser. Je refuse
de le glisser dans un lot d'exécution, parce qu'il a un **contre-argument qui le rend nuisible** :

> la section décrit un **instant** (« ce qui vient d'être fait », « prochaine étape »). La préserver
> ferait **présenter comme courant** un récit périmé. Or un récit périmé qui se donne pour frais est
> **pire** qu'un placeholder, qui est au moins honnête sur son vide. On échangerait un défaut visible
> contre un défaut crédible.

Il y a au moins quatre options défendables (préserver ; préserver **en datant** la section du
checkpoint qui l'a écrite ; décomposer le verbe `update` avec un point d'arrêt ; ne rien changer et
vivre avec D6). Choisir entre elles est un **arbitrage de flux de travail du décideur**, pas une
étape d'implémentation. → successeur **`CHECKPOINT-NARRATIF`** (§ 5), option space déjà instruit
ci-dessus pour qu'il ne reparte pas de zéro.

**Coût** : ~10 lignes dans `update.js` + une garde. **Aucune** modification de `snapshot.js` au titre
de D6 — la détection lit le MD produit, elle ne change pas la génération.

### D7 (neuve — amendement 2026-08-17) — `snapshot` et `update` disent **quel CLI** s'exécute, et **sur quelle racine**

**Retenu — la cécité entre, la cause reste dehors.**

Le § 2.7 (c) décrit un piège de poste réel : depuis un arbre lié, `iakaframe <verbe>` exécute le CLI
de la **racine**, pas celui de l'arbre. **Je ne corrige pas le wrapper** (motifs en § 5 : fichier
hors du dépôt, et le remède est un arbitrage sur la stratégie d'installation). Mais je refuse de
laisser le piège **muet**, parce que c'est le silence — pas le chemin en dur — qui a produit
l'incident : ⚒️ Gimli a cru mesurer le lot, et mesurait autre chose.

`runSnapshot` (`snapshot.js:229-232`) et `runUpdate` (`update.js:93-96`) affichent donc, sur une
ligne, **le CLI réellement exécuté** et **la racine visée** :

```
  cli=<dirname(fileURLToPath(import.meta.url)) remonté jusqu'à cli/>   root=<root résolu>
```

- **Les deux, pas un seul.** `runUpdate` affiche déjà la racine (`:93`) ; c'est le **couple** qui
  révèle le piège — une racine dans `.claude/worktrees/x` face à un `cli=` à la racine réelle est
  immédiatement lisible comme une discordance. Isolée, chaque valeur a l'air normale.
- **Pourquoi seulement ces deux verbes** : ce sont ceux qui **écrivent**. Un bandeau global sur
  chaque invocation polluerait les verbes de lecture pour un bénéfice nul.
- **Aucun test n'assertionne ces sorties** — vérifié : les chaînes `Snapshot OK`, `fichiers=` et
  `==== update iakaframe` n'apparaissent que dans les **sources**, jamais dans `cli/test/`.
  **Clause d'échappement** : si l'implémentation découvre malgré tout une garde qui capture ce flux,
  **retirer D7 et le dire** dans le compte rendu — D7 est un confort de diagnostic, il ne vaut pas
  qu'on modifie un test pour l'accommoder (cf. CA-14).

---

## 4. Arbitrage laissé ouvert au décideur — **je ne le tranche pas**

**A-1 — Faut-il, en plus du libellé (D3), poser une note humaine dans le journal au point de
rupture ?** Le libellé rend la règle lisible **en avant** ; il ne dit rien à qui relit la colonne
`files` de 2026-07 à 2026-08 et cherche pourquoi elle sautille. Une ligne de note dans la prochaine
entrée de journal réglerait ça — mais écrire dans le journal pour commenter le journal est un geste
sur **la mémoire du projet**, pas sur le générateur, et il appartient au décideur.

**Défaut si non tranché : on ne fait rien de plus.** Le lot est **exécutable en l'état** ; A-1
n'ajoute qu'une phrase et ne bloque aucun critère d'acceptation.

> **(amendement 2026-08-17) A-1 reste OUVERT et NON TRANCHÉ.** L'amendement ne le referme pas et
> n'y touche pas. Le § 2.6 lui donne seulement **plus de matière** : la rupture à commenter ne
> concerne pas que ce dépôt (`1469 → 1078 → …`), elle concernera aussi le journal du GUI
> (`9 227 → ~470`). Si le décideur retient A-1, la note vaut **par dépôt**, chacune écrite dans son
> propre journal par son propre checkpoint — jamais l'une depuis l'autre (D4).
> Le défaut de décision est **inchangé** : sans arbitrage, on ne fait rien de plus.

*Note : la « dette de tagging » (`v0.20.4` face à `0.39.0`) est **signalée, hors périmètre**. Elle
touche `git describe`, que D2 laisse justement verbatim — les deux sujets ne se croisent pas ici.*

---

## 5. Périmètre

### Inclus
- `cli/src/commands/snapshot.js` : résolution du nom (D1), normalisation/validation de version (D2),
  comptage (D3), libellés MD + HTML.
- `cli/src/commands/update.js` : refus sur `--version` mal formé avant tout commit ; message de commit
  bâti sur la valeur **normalisée** (`update.js:103`) ; **avertissement narratif vide (D6)** posé
  entre `:95` et `:100`.
- **Ligne de provenance (D7)** dans `runSnapshot` et `runUpdate`.
- **Cinq tests de garde** — un par défaut : D1, D2, D3, D6, D7 — chacun **vu rouge avant d'être
  vert** (§ 9). *(Le cadrage initial en annonçait trois ; D6 et D7 en ajoutent deux.)*
- `docs/commandes.md:121` : la ligne `snapshot` documente déjà la cascade de version ; elle est
  complétée par la règle de forme (D2) et la règle de comptage (D3). **Y ajouter l'avertissement
  D6** sur la ligne `update` (cf. mémoire « doc des commandes à jour » : toute commande dont le
  comportement observable change est répercutée **dans le même lot**).
- ~~`specs/etat-des-lieux.md:79-82` : correction en place de la note fausse (D5).~~
  **RETIRÉ (2026-08-17)** — cible inexistante, cf. D5. **Ne rien écrire dans
  `specs/etat-des-lieux.md` sous ce lot.**

### Explicitement exclu — avec titulaire quand ça sort
- **`garde-balayante-routage-prod`** — ~~en cours~~ **livré depuis** (merge `3111230`, 2026-08-16).
  Aucun fichier commun ; la mention est conservée pour la traçabilité.
- **`GUI-VENDOR-CHARON`**, **`ROLE-VOCAB-CANON`**, **`GUI-PARITE-WORKTREE`** — successeurs nommés,
  titulaires déjà désignés. Voisins, jamais absorbés.
- **Dette de tagging** — signalée (§ 4), non traitée, décideur.
- **Réécriture rétroactive du journal** — refusée (D4), **des deux dépôts**.
- **Toute refonte du format de l'état des lieux** (sections, récit de reprise, gabarit HTML). Ce lot
  corrige des défauts, il ne redessine pas le livrable.
- **`countFiles` de `cli/test/install-multihost.test.js:20`** — homonyme, sans rapport (il compte des
  fichiers déposés dans un `~/.claude` factice). Ne pas y toucher.
- **Une garde contre les dépôts imbriqués dans le parcours hors git** — spéculatif : un arbre lié
  suppose git, donc le cas ne peut pas se produire sur la branche hors git. Non fait, à dessein.

#### 🛑 Rectification (2026-08-17) — une affirmation de vendorage du cadrage initial était FAUSSE

Le cadrage disait : *« Le miroir `iakaFrameGUI` : `snapshot.js` n'est pas vendorisé ; ce lot n'a pas
d'effet cross-repo. »* La **première** moitié est exacte pour le GUI ; la **conclusion** ne l'est pas,
et j'ai manqué une copie **dans ce dépôt-ci**. Deux corrections :

1. **Il existe bien une copie de `snapshot.js` dans `iakaframe`** :
   `frames/releases/StefFrame2/cli/src/commands/snapshot.js`. C'est une **release de frame gelée**,
   déjà divergente du canon de plusieurs fonctions (elle ignore `authorityVersion`,
   `projectPackageVersion` et `runProjectCadence`). **Hors périmètre par NATURE** : une release ne se
   rétro-patche pas, sinon elle cesse d'être une release. **Ne pas y toucher**, et ne pas la « mettre
   à jour » en croyant réparer une dérive (CA-19).
2. **Ce lot A un effet cross-repo, et il est voulu.** `snapshot.js` n'est pas vendorisé vers le GUI,
   mais le GUI **exécute ce même code** — c'est précisément l'effet du wrapper (§ 2.7 c). Le premier
   `snapshot` du GUI post-correctif passera de `9 227` à ~`470`. Ce n'est pas un accident à éviter,
   c'est **le correctif qui atteint le dépôt frère** ; ce qui est dû, c'est de le **poser sciemment**
   (R1, § 11) — pas de le neutraliser.
   Le `vendor-check` reste dû au gate, pour la raison d'origine (rien à voir avec `snapshot.js`).

#### Successeurs NEUFS nommés par cet amendement — aucun laissé orphelin

> Ces trois entrées sont à **porter dans `BACKLOG.md`** au format des items existants
> (`CODE-MAJUSCULE`, estimation, dépôt, titulaire). **Je ne les y écris pas moi-même** : mon canal
> d'écriture est borné à `specs/instructions/`. Le portage revient à 🤴 **Aragorn** au franchissement
> du jalon P1→P2.

| Code | Ce que c'est | Dépôt / fichier | Estimation | Titulaire |
|---|---|---|---|---|
| **`CHECKPOINT-NARRATIF`** | Trancher le flux du checkpoint face au narratif écrasé (§ 2.7 a, D6) : préserver / préserver+dater / décomposer le verbe / statu quo. **Les 4 options et leur contre-argument sont déjà écrits en D6** — le cadrage part chargé. | `iakaframe` — `snapshot.js:132-136`, `update.js:95-111` | **cadrage 0,25 j-h**, dev **0,5 à 1 j-h** selon l'option | **cadrage 🧙 Gandalf → arbitrage DÉCIDEUR → dev ⚒️ Gimli** |
| **`VENDOR-REMEDE-CARDINAL`** | La phrase « un par derive constatee » ment dès que la déduplication mord (§ 2.7 b). Remède pré-mâché : cesser d'affirmer une bijection et rendre les **deux** cardinaux — `REMEDE - N geste(s) pour M derive(s) constatee(s)` — en corrigeant **aussi** le commentaire `:223-224` qui porte le même faux invariant. | `iakaframe` — `cli/src/commands/vendor-check.js:223-228`, garde dans `cli/test/vendor-check.test.js` | **0,25 j-h** | ⚒️ **Gimli**, déclenché par 🤴 Aragorn — **à grouper avec `GUI-VENDOR-CHARON`** : même opérateur, même session, et c'est **ce bloc-là** qu'il lira pour vendoriser les 4 fixtures manquantes |
| **`CLI-WRAPPER-RACINE`** | `~/.local/bin/iakaframe` pointe en dur sur la racine (§ 2.7 c). **Pourquoi ce n'est pas une correction évidente** : le remède naïf — résoudre le CLI depuis le dépôt courant — ferait exécuter le code de **n'importe quel clone** où l'on se trouve, ce qui échange un piège contre un pire. C'est un **arbitrage sur la stratégie d'installation**, pas un bug à écraser. | **Hors dépôt** — `/Users/sjupin/.local/bin/iakaframe` (artefact de poste, non versionné) | **0,25 j-h** une fois l'option choisie | **arbitrage DÉCIDEUR** (stratégie d'install), exécution ⚒️ **Gimli** — et l'écriture étant **hors de tout worktree**, elle ne peut se faire sous aucun lot borné à un dépôt |

---

## 6. Étapes d'implémentation

1. **Rouge d'abord.** Écrire `cli/test/snapshot-generateur.test.js` avec les **cinq** familles de
   gardes (§ 9), **lancer la suite, constater les cinq échecs**, et **noter la sortie rouge** dans
   le compte rendu de lot. Un test qui n'a jamais été vu rouge ne prouve rien.
2. **D1** — extraire `projectName(root)` dans `snapshot.js` (garde `basename === '.git'` + replis),
   la brancher en `:97`. Vérifier que `:116`, `:150`, `:173` consomment la nouvelle valeur.
3. **D2** — ajouter `normalizeVersion(raw)`, l'appeler dans `doSnapshot` (lève sur invalide) et dans
   `runSnapshot` / `runUpdate` (message + `exitCode = 1`, calqué sur `:225-227`). Normaliser aussi la
   valeur réinjectée dans le message de commit (`update.js:103`). Ne **pas** toucher `:90` ni `:92`.
4. **D3** — réécrire `countFiles` en `filesCount(root)` : voie git (`run(...).ok`) puis repli parcours.
   Adapter les libellés `:124` et `:181`.
4bis. **D6** — ajouter dans `update.js` une fonction d'avertissement **calquée sur `warnFrameLeak`**
   (même forme, même ceinture `try/catch`, même registre de message), appelée **après `:98` et avant
   `:100`**. Elle relit `specs/etat-des-lieux.md`, isole la section `## Reprise du travail`, et
   avertit si le corps ne contient que des placeholders. **Elle ne lève jamais et ne retourne
   jamais** — un checkpoint ne doit pas échouer à cause d'elle.
4ter. **D7** — ajouter la ligne de provenance dans `runSnapshot` et `runUpdate`. Si une garde
   existante capture ce flux, **retirer D7 et le déclarer** (clause d'échappement, D7).
5. **Vert.** Relancer `node --test` depuis `cli/` : les cinq gardes passent, **et la suite complète
   reste verte** — attention particulière à `guard-version-source-unique.test.js` (5 appels à
   `doSnapshot` sur des dépôts tmp), `cadence.test.js`, `switch-flags-guard.test.js`,
   `vendor-check.test.js` (il compare des miroirs au canon : vérifier qu'aucune fixture ne se met à
   dériver du fait de ce lot).
6. ~~**D5** — corriger en place `specs/etat-des-lieux.md:79-82`.~~ **ÉTAPE SUPPRIMÉE (2026-08-17)** —
   la cible n'existe plus (D5). **Ne rien écrire dans `specs/etat-des-lieux.md`.**
7. **Doc** — compléter `docs/commandes.md:121` (règle de forme `--version` + définition du compte)
   **et** la ligne `update` (avertissement D6).
8. **Ne pas régénérer l'état des lieux sous ce lot** : le premier `snapshot` post-correctif changera
   le libellé et le compte, et il doit être **posé sciemment** par le décideur, pas tombé d'un test.

---

## 7. Fichiers concernés

- `cli/src/commands/snapshot.js` — `projectName()` (D1), `normalizeVersion()` (D2), `filesCount()` (D3),
  libellés `:124` / `:181`, ligne de provenance dans `runSnapshot` (D7).
- `cli/src/commands/update.js` — refus avant commit + message normalisé (`:95`, `:103`),
  avertissement narratif entre `:98` et `:100` (D6), ligne de provenance (D7).
- `cli/test/snapshot-generateur.test.js` — **nouveau**, les **cinq** gardes.
- `docs/commandes.md:121` — règle de forme de `--version`, définition du compte de fichiers,
  avertissement D6 sur `update`.

**Fichiers qu'il ne faut PAS toucher, et qu'on pourrait croire concernés :**

- ~~`specs/etat-des-lieux.md:79-82`~~ — **retiré** (D5, cible inexistante). Le lot n'écrit **rien**
  dans l'état des lieux, ni en place ni par régénération (CA-16).
- `frames/releases/StefFrame2/cli/src/commands/snapshot.js` — copie **gelée** d'une release
  antérieure. **Ne pas la synchroniser** (§ 5, CA-19).
- `cli/src/commands/vendor-check.js` — successeur `VENDOR-REMEDE-CARDINAL`, pas ce lot.
- `/Users/sjupin/.local/bin/iakaframe` — **hors dépôt**, successeur `CLI-WRAPPER-RACINE`.

---

## 8. Risques

| # | Risque | Mitigation |
|---|---|---|
| R1 | **Le compte change pour tous les projets du portefeuille**, pas seulement iakaframe. **Amplitude désormais MESURÉE, et elle est massive** : sur `iakaFrameGUI`, `9 227 → ~470`, soit **−95 %** (§ 2.6). Tout projet à cache de build volumineux (Rust/`target`, Java/`build`, coverage) est concerné au même ordre. | C'est le but (le chiffre devient honnête), mais il faut que ce soit **lisible** : le libellé change avec la règle (D3), et **chaque dépôt pose son premier snapshot post-correctif sciemment**, par son propre opérateur (étape 8, § 11). Ne **jamais** compenser la chute en réintroduisant des exclusions en dur : ce serait rendre la garde verte en cessant de regarder. |
| R2 | `git ls-files --others` pourrait descendre dans un dépôt imbriqué **non ignoré** (cas d'un projet dont les worktrees ne sont pas dans une zone ignorée). | Comportement **non tenu pour acquis** : c'est CA-7 qui l'établit. Si la garde naît verte, l'implémenteur doit la rendre rouge en retirant l'exclusion — et si git compte réellement l'imbriqué, ajouter l'exclusion explicite **et le dire**. |
| R3 | `doSnapshot` qui **lève** sur version invalide peut faire échouer `onboard` (`onboard.js:156`) au milieu d'un onboarding. | Voulu : échouer bruyamment plutôt qu'écrire une fausse version dans un fichier versionné. Le refus arrive **avant** toute écriture. Couvert par CA-5. |
| R4 | Un projet **hors git** perd le bénéfice de D1 et D3 (nom = dossier, compte = parcours). | Assumé et documenté : hors git, aucune autorité ne peut trancher. Le comportement reste **identique à aujourd'hui** — c'est une non-régression, pas un trou (CA-3, CA-8). |
| R5 | Le libellé MD change → un consommateur inconnu casse. | Vérifié : `lib/etat.js` n'indexe que `Version`/`Note`/`Dernier commit` ; aucun test n'assertionne `fileCount` ni le libellé. Risque résiduel faible, tenu par la suite complète (étape 5). |
| R6 | Le lot touche le **même fichier de journal/état des lieux** que d'autres travaux en cours. | ~~n'y toucher qu'aux lignes 79-82 (D5)~~ **Simplifié (2026-08-17)** : D5 étant retirée, le lot **n'écrit plus du tout** dans `specs/etat-des-lieux.md`. Le partage de fichier disparaît, et avec lui le risque. |
| R7 | **(neuf)** L'implémenteur voit `frames/releases/StefFrame2/cli/src/commands/snapshot.js` diverger du canon et « répare » la release. | La divergence est **antérieure et voulue** (la release ignore déjà 3 fonctions du canon). CA-19 la verrouille : le fichier doit sortir du lot **byte-identique**. |
| R8 | **(neuf)** D6 lit `specs/etat-des-lieux.md` pour détecter les placeholders → couplage du checkpoint à un format de fichier. | Détection **volontairement grossière** (présence du marqueur `<!-- ` dans le corps de la section) et **entièrement ceinturée** : format inattendu ⇒ pas d'avertissement, jamais d'erreur. Un faux négatif est acceptable ; un `update` qui casse ne l'est pas (doctrine `update.js:29-36`). |
| R9 | **(neuf)** D7 ajoute deux lignes de sortie → une garde inconnue capture le flux et rougit. | Vérifié qu'aucun test n'assertionne la sortie de ces deux verbes. Si ça se produit malgré tout : **retirer D7**, ne pas modifier le test (CA-14 prime sur CA-18d). |

---

## 9. Critères d'acceptation

> **Numérotation non contiguë, à dessein.** Les critères neufs de l'amendement (CA-17, CA-18a→d,
> CA-19) sont **ajoutés en fin de série**, jamais intercalés : renuméroter aurait invalidé les
> renvois déjà écrits ailleurs dans cette instruction (R1→CA-19, R2→CA-7, R9→CA-14…). Lire par
> **section**, pas par ordre numérique. **22 critères au total.**

### D1 — nom du projet
- [ ] **CA-1** — Depuis un **arbre lié** (`git worktree add`) d'un dépôt tmp nommé `projet-alpha`,
      `specs/etat-des-lieux.md` s'intitule `# Etat des lieux - projet-alpha` — **pas** le nom du
      dossier de l'arbre lié. Même assertion sur `<title>` et `<h1>` du `.html`.
- [ ] **CA-2** — Depuis la **racine** du même dépôt, le titre est **identique** à CA-1.
- [ ] **CA-3** — Sur un dossier **hors git**, le titre reste `path.basename(root)` (non-régression
      mot pour mot).
- [ ] **CA-4** — L'état des lieux, le `.html` et le journal sont écrits **dans l'arbre lié**
      (`root`), jamais dans le dépôt principal.

### D2 — version
- [ ] **CA-5** — `--version 0.39.0` inscrit **`v0.39.0`** dans le journal, le MD et le HTML ;
      `--version v0.39.0` inscrit la même chose (idempotence).
- [ ] **CA-6** — `--version 0.39`, `--version derniere`, `--version v0.39.O` : **rien n'est écrit**,
      un message nomme la valeur fautive, `exitCode = 1`. Même refus via `update`, **avant** tout
      `git add` / `commit`.
- [ ] **CA-7** — Un projet tiers dont le dernier tag est `2026.08` (sans `v`) garde **`2026.08`**
      verbatim : la normalisation ne touche pas `git describe`. Les 5 gardes existantes de
      `guard-version-source-unique.test.js` restent **vertes sans modification**.

### D3 — compte de fichiers
- [ ] **CA-8** — Sur un dépôt tmp, le compte est **identique** depuis la racine et depuis un arbre
      lié placé dans un dossier **ignoré**, et **aucun** fichier interne de l'arbre lié n'est compté
      (au pire l'arbre lié pèse **≤ 1** entrée).
- [ ] **CA-9** — Même assertion avec l'arbre lié dans un dossier **non ignoré** (R2). Si git compte
      malgré tout l'imbriqué, une exclusion explicite est ajoutée **et documentée** en commentaire.
- [ ] **CA-10** — Un fichier **non suivi et non ignoré** est compté ; un fichier **ignoré** ne l'est
      pas ; `node_modules` ignoré ne l'est pas.
- [ ] **CA-11** — Sur un dossier **hors git**, le compte est celui du parcours actuel, **inchangé**.
- [ ] **CA-12** — Le libellé MD/HTML reflète la règle appliquée (`suivis + non ignores` en git,
      `hors .git/node_modules` hors git).
- [ ] **CA-17** *(neuf — le cas `iakaFrameGUI`, § 2.6)* — Sur un dépôt tmp dont le `.gitignore`
      porte `target/` et qui contient un `target/` **peuplé de plusieurs fichiers**, le compte est
      celui des seuls fichiers du projet : **aucun** fichier de `target/` n'est compté. Même
      assertion pour un `dist/` ignoré. **C'est la garde qui prouve que la règle a cessé d'être une
      liste de deux noms en dur** — sans elle, le correctif du GUI n'est pas démontré.

### D6 — narratif vide (neuf)
- [ ] **CA-18a** — `update` sur un dépôt tmp dont la section « Reprise du travail » ne contient que
      des placeholders : la sortie porte un avertissement **nommant le fichier**, il apparaît
      **avant** la ligne de commit, et **le commit a bien lieu** (non bloquant).
- [ ] **CA-18b** — Même `update` avec une section renseignée : **aucun** avertissement.
- [ ] **CA-18c** — `specs/etat-des-lieux.md` illisible, absent, ou sans section reconnaissable :
      `update` **se termine normalement**, sans avertissement et **sans erreur**. La ceinture tient.

### D7 — provenance (neuf)
- [ ] **CA-18d** — `snapshot` et `update` affichent tous deux `cli=<…>` et `root=<…>`. Lancés depuis
      un arbre lié avec un CLI situé ailleurs, **les deux chemins diffèrent visiblement** dans la
      sortie. *(Ou : D7 retiré, avec son motif écrit au compte rendu — clause d'échappement.)*

### Transverse
- [ ] **CA-13** — Les **cinq** gardes (D1, D2, D3, D6, D7) ont été **vues rouges** avant d'être
      vertes ; les sorties rouges figurent dans le compte rendu du lot.
- [ ] **CA-14** — `node --test` depuis `cli/` : **0 échec**, aucun test existant modifié pour
      accommoder le correctif. **CA-14 prime sur CA-18d** : plutôt retirer D7 que toucher un test.
- [ ] **CA-15** — `docs/commandes.md:121` énonce la règle de forme de `--version`, la définition du
      compte, et l'avertissement D6 sur `update`.
      ~~`specs/etat-des-lieux.md:79-82` ne porte plus l'explication causale fausse~~ — **retiré**
      (D5 sans objet ; la note a disparu d'elle-même).
- [ ] **CA-16** — Aucun `specs/etat-des-lieux.md` / `.html` / `.iakaframe-journal.json` **régénéré
      ni édité** sous ce lot (hors fixtures tmp des tests). *(Renforcé : « ni édité », D5 étant retirée.)*
- [ ] **CA-19** *(neuf)* — `frames/releases/StefFrame2/cli/src/commands/snapshot.js` est **inchangé**
      au bit près à la sortie du lot. Une release gelée ne se rétro-patche pas.

---

## 10. Estimation — jalon P1→P2

> **Révisée le 2026-08-17 : 0,5 → 0,75 j-h.** Le glissement est **déclaré et décomposé** ci-dessous
> plutôt que fondu dans un nouveau chiffre.

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **0,75 j-h** (≈ 5 à 6 h) — dont ~2 h de tests, toujours la partie longue. Les correctifs pèsent une **quarantaine** de lignes de production. |
| **Complexité / risque** | **Faible en complexité, MOYEN en risque** — inchangé. La complexité n'augmente pas : D6 et D7 sont additifs, locaux, non bloquants. Le risque **reste** celui de D3, mais son amplitude est désormais **connue et chiffrée** (−95 % sur le GUI) au lieu d'être supposée : c'est un risque **mieux tenu**, pas un risque plus grand. |
| **Inconnues susceptibles de faire glisser** | (a) **R2** — comportement de `git ls-files --others` face à un dépôt imbriqué non ignoré : si l'hypothèse tombe, +1 h. (b) **Effets de bord sur la suite existante** : ~640 tests, dont 5 appels directs à `doSnapshot` ; aucun n'assertionne `fileCount` ni la sortie des deux verbes (vérifié), mais un test qui compterait indirectement coûterait +1 h. (c) **A-1** — si le décideur veut une note de discontinuité, +15 min **par dépôt** concerné, et c'est un geste sur la mémoire, pas sur le code. (d) ~~effet cross-repo par vendorage~~ **requalifié** : `snapshot.js` n'est pas vendorisé vers le GUI, mais le GUI **exécute le même code** — l'effet cross-repo est **certain**, pas hypothétique, et il ne coûte rien au lot (il coûte un checkpoint posé sciemment, § 11). (e) **(neuve)** D6 doit isoler une section markdown : si le format se révèle plus capricieux que prévu, la ceinture de R8 permet de **livrer une détection imparfaite** plutôt que de faire glisser le lot. |

### Détail du glissement +0,25 j-h — ce qui monte, ce qui descend

| Mouvement | Effet |
|---|---|
| **D6** — avertissement narratif + 3 gardes (CA-18a/b/c) | **+1 h** |
| **D7** — ligne de provenance + garde (CA-18d) | **+0,25 h** |
| **CA-17** — garde du cas `target/` ignoré (§ 2.6) | **+0,25 h** |
| **CA-19** — vérification de la release gelée | **+0,1 h** |
| **D5 retirée** — une édition et une étape en moins | **−0,25 h** |
| **R6 dissous** — plus de fichier partagé, donc plus de précaution de coexistence | **−0,1 h** |
| **Net** | **≈ +1,25 h, soit +0,25 j-h** |

**Ce que le glissement n'achète PAS** : aucune des trois décisions d'origine n'a été refaite. D1, D2
et D3 sortent de l'amendement **inchangées dans leur remède** ; seul le **motif** de D3 s'est élargi.
Le surcoût est intégralement dû à **deux défauts neufs** et **une garde neuve**, pas à une révision.

Ordre de grandeur assumé et révisable, **pas un engagement ferme** ; à confronter au temps réel à
la clôture du lot.

---

## 11. Statut de clôture du cadrage — qui doit quoi

### ⏸️ Ce qui attend le DÉCIDEUR (gate humain — rien ne se franchit sans lui)

1. **`A-1` — la note de discontinuité au journal.** *Seul arbitrage bloquant au sens strict, et il ne
   bloque rien* : le lot est exécutable sans lui, défaut = on ne fait rien de plus. Écrire dans la
   mémoire du projet pour la commenter appartient au décideur, pas au cadrage. **Laissé ouvert à
   dessein.**
2. **La validation de cette instruction amendée elle-même** — le gate P1→P2. 🧙 Gandalf **propose** un
   périmètre ; il ne le valide pas.
3. **Le premier checkpoint post-correctif, dépôt par dépôt.** Ce n'est pas une tâche du lot, c'est un
   **geste à poser sciemment** : `iakaframe` verra son compte passer de `1 078` (mesure d'arbre lié) à
   la nouvelle règle, et **`iakaFrameGUI` passera de `9 227` à ~`470`**. Le libellé porte la
   discontinuité sur la face de l'artefact (D3) ; ce qui reste humain, c'est le **moment** où on la
   pose. Pour le GUI, l'opérateur est celui de ce dépôt — jamais ce lot depuis l'extérieur (D4).
4. **`CLI-WRAPPER-RACINE`** — arbitrage sur la stratégie d'installation du CLI de poste. Le remède
   naïf est pire que le mal (§ 5) ; il faut une décision, pas un correctif.

### 📤 Ce qui SORT du périmètre — avec son destinataire nommé

| Ce qui sort | Vers qui |
|---|---|
| Refonte du flux du checkpoint face au narratif écrasé | **`CHECKPOINT-NARRATIF`** — cadrage 🧙 Gandalf → arbitrage décideur → dev ⚒️ Gimli |
| La phrase fausse de `vendor-check` (23 gestes / 24 dérives) | **`VENDOR-REMEDE-CARDINAL`** — ⚒️ Gimli, groupé avec `GUI-VENDOR-CHARON` |
| Le wrapper `~/.local/bin/iakaframe` | **`CLI-WRAPPER-RACINE`** — décideur (option) puis ⚒️ Gimli (exécution hors dépôt) |
| Réécriture rétroactive des journaux (`iakaframe` **et** `iakaFrameGUI`) | **Personne — refusé** (D4, précédent du décideur du 2026-07-31) |
| `frames/releases/StefFrame2/…/snapshot.js` | **Personne — gelé par nature** (CA-19) |
| `GUI-VENDOR-CHARON`, `ROLE-VOCAB-CANON`, `GUI-PARITE-WORKTREE`, dette de tagging | Successeurs **antérieurs**, titulaires déjà désignés — inchangés |

> **Portage requis** : les trois codes neufs (`CHECKPOINT-NARRATIF`, `VENDOR-REMEDE-CARDINAL`,
> `CLI-WRAPPER-RACINE`) doivent rejoindre `BACKLOG.md`. **Je ne les y écris pas** — mon canal
> d'écriture est borné à `specs/instructions/`. Geste dû par 🤴 **Aragorn** au franchissement du jalon.
> Un successeur nommé dans une instruction mais absent du backlog est un successeur à moitié nommé,
> et c'est exactement la faute que deux lots ont servi à corriger.

### ✅ Ce qui est PRÊT

D1, D2, D3, D6, D7 sont fermées et exécutables. **22** critères d'acceptation testables (§ 9).
Aucune décision d'architecture n'attend, hors A-1 dont le défaut est explicite et sans conséquence.

> **Vérification de clôture (`preuve-avant-declaration`)** : ce fichier a été **relu intégralement
> sur le disque** après les treize éditions partielles de l'amendement. Trois défauts de mon propre
> fait y ont été trouvés et corrigés — un renvoi `chemin:ligne` périmé en § 2.1, un renvoi `CA-18`
> ambigu en R9, et un cardinal de critères faux ici même (`19` → `22`). Aucun doublon de section ni
> résidu d'ancienne rédaction. C'est le constat, pas le souvenir d'avoir écrit.
