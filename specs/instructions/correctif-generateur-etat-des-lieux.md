# Correctif du générateur d'état des lieux — nom du projet, version, compte de fichiers

> **Statut** : PROPOSÉE (cadrage 🧙 Gandalf, 2026-08-16) — attend l'arbitrage du décideur.
> **Périmètre technique** : `cli/src/commands/snapshot.js` et son entourage direct.
> **Voisins jamais absorbés** : `garde-balayante-routage-prod` (en cours, ⚒️ Gimli),
> `GUI-VENDOR-CHARON`, `ROLE-VOCAB-CANON`, `GUI-PARITE-WORKTREE`, dette de tagging.

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
  « Etat des lieux - merge-main ». Trace du contournement dans `specs/etat-des-lieux.md:74-78`.

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

**Retenu.**

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

### D4 — L'historique du journal n'est **pas** réécrit

**Retenu, et ce n'est pas mon arbitrage : j'applique un précédent du décideur.** Le journal porte
déjà la décision, prise le 2026-07-31 sur un cas identique (un compte recopié devenu faux) :

> « Journal et instructions NON reecrits : leurs comptes sont vrais a leur date. »
> — `specs/.iakaframe-journal.json`, entrée `2026-07-31 16:31`

Les valeurs antérieures **étaient vraies à leur date, sous la règle de leur date**. Les recalculer
commit par commit (les hashes sont dans le journal) est techniquement possible pour la part suivie,
mais transformerait un **relevé de ce qui a été observé** en **jeu de données reconstruit** — ce qui
change la nature de l'artefact. Non.

### D5 — La note fausse de l'état des lieux est corrigée **en place**

`specs/etat-des-lieux.md:79-82` porte l'explication causale infirmée en § 2.4 (« il compte aussi les
worktrees », « les valeurs anterieures etaient gonflees »). C'est une note **fraîche et fausse** :
elle se corrige en place, comme le veut la pratique du dépôt pour ce cas, sans relancer `snapshot`.
La correction dit : le delta vient du **changement d'arbre de mesure**, et le comptage des arbres
liés est un défaut **latent** (~7500 attendu depuis la racine réelle), pas la cause du 1469 → 1078.

---

## 4. Arbitrage laissé ouvert au décideur — **je ne le tranche pas**

**A-1 — Faut-il, en plus du libellé (D3), poser une note humaine dans le journal au point de
rupture ?** Le libellé rend la règle lisible **en avant** ; il ne dit rien à qui relit la colonne
`files` de 2026-07 à 2026-08 et cherche pourquoi elle sautille. Une ligne de note dans la prochaine
entrée de journal réglerait ça — mais écrire dans le journal pour commenter le journal est un geste
sur **la mémoire du projet**, pas sur le générateur, et il appartient au décideur.

**Défaut si non tranché : on ne fait rien de plus.** Le lot est **exécutable en l'état** ; A-1
n'ajoute qu'une phrase et ne bloque aucun critère d'acceptation.

*Note : la « dette de tagging » (`v0.20.4` face à `0.39.0`) est **signalée, hors périmètre**. Elle
touche `git describe`, que D2 laisse justement verbatim — les deux sujets ne se croisent pas ici.*

---

## 5. Périmètre

### Inclus
- `cli/src/commands/snapshot.js` : résolution du nom (D1), normalisation/validation de version (D2),
  comptage (D3), libellés MD + HTML.
- `cli/src/commands/update.js` : refus sur `--version` mal formé avant tout commit ; message de commit
  bâti sur la valeur **normalisée** (`update.js:103`).
- **Trois tests de garde**, un par défaut, chacun **vu rouge avant d'être vert** (§ 9).
- `docs/commandes.md:121` : la ligne `snapshot` documente déjà la cascade de version ; elle est
  complétée par la règle de forme (D2) et la règle de comptage (D3).
- `specs/etat-des-lieux.md:79-82` : correction en place de la note fausse (D5).

### Explicitement exclu — avec titulaire quand ça sort
- **`garde-balayante-routage-prod`** — en cours, ⚒️ Gimli. Aucun fichier commun.
- **`GUI-VENDOR-CHARON`**, **`ROLE-VOCAB-CANON`**, **`GUI-PARITE-WORKTREE`** — successeurs nommés,
  titulaires déjà désignés. Voisins, jamais absorbés.
- **Dette de tagging** — signalée (§ 4), non traitée, décideur.
- **Réécriture rétroactive du journal** — refusée (D4).
- **Toute refonte du format de l'état des lieux** (sections, récit de reprise, gabarit HTML). Ce lot
  corrige des défauts, il ne redessine pas le livrable.
- **`countFiles` de `cli/test/install-multihost.test.js:20`** — homonyme, sans rapport (il compte des
  fichiers déposés dans un `~/.claude` factice). Ne pas y toucher.
- **Une garde contre les dépôts imbriqués dans le parcours hors git** — spéculatif : un arbre lié
  suppose git, donc le cas ne peut pas se produire sur la branche hors git. Non fait, à dessein.
- **Le miroir `iakaFrameGUI`** : `snapshot.js` n'est pas vendorisé ; ce lot n'a pas d'effet
  cross-repo. À vérifier d'un `vendor-check` au gate, pas à traiter ici.

---

## 6. Étapes d'implémentation

1. **Rouge d'abord.** Écrire `cli/test/snapshot-generateur.test.js` avec les trois familles de
   gardes (§ 9), **lancer la suite, constater les trois échecs**, et **noter la sortie rouge** dans
   le compte rendu de lot. Un test qui n'a jamais été vu rouge ne prouve rien.
2. **D1** — extraire `projectName(root)` dans `snapshot.js` (garde `basename === '.git'` + replis),
   la brancher en `:97`. Vérifier que `:116`, `:150`, `:173` consomment la nouvelle valeur.
3. **D2** — ajouter `normalizeVersion(raw)`, l'appeler dans `doSnapshot` (lève sur invalide) et dans
   `runSnapshot` / `runUpdate` (message + `exitCode = 1`, calqué sur `:225-227`). Normaliser aussi la
   valeur réinjectée dans le message de commit (`update.js:103`). Ne **pas** toucher `:90` ni `:92`.
4. **D3** — réécrire `countFiles` en `filesCount(root)` : voie git (`run(...).ok`) puis repli parcours.
   Adapter les libellés `:124` et `:181`.
5. **Vert.** Relancer `node --test` depuis `cli/` : les trois gardes passent, **et la suite complète
   reste verte** — attention particulière à `guard-version-source-unique.test.js` (5 appels à
   `doSnapshot` sur des dépôts tmp), `cadence.test.js`, `switch-flags-guard.test.js`.
6. **D5** — corriger en place `specs/etat-des-lieux.md:79-82`.
7. **Doc** — compléter `docs/commandes.md:121`.
8. **Ne pas régénérer l'état des lieux sous ce lot** : le premier `snapshot` post-correctif changera
   le libellé et le compte, et il doit être **posé sciemment** par le décideur, pas tombé d'un test.

---

## 7. Fichiers concernés

- `cli/src/commands/snapshot.js` — `projectName()` (D1), `normalizeVersion()` (D2), `filesCount()` (D3),
  libellés `:124` / `:181`.
- `cli/src/commands/update.js` — refus avant commit + message normalisé (`:95`, `:103`).
- `cli/test/snapshot-generateur.test.js` — **nouveau**, les trois gardes.
- `docs/commandes.md:121` — règle de forme de `--version` + définition du compte de fichiers.
- `specs/etat-des-lieux.md:79-82` — correction en place de la note causale fausse (D5).

---

## 8. Risques

| # | Risque | Mitigation |
|---|---|---|
| R1 | **Le compte change pour tous les projets du portefeuille**, pas seulement iakaframe : un projet git dont `node_modules` n'est **pas** ignoré verra son compte chuter fortement. | C'est le but (le chiffre devient honnête), mais il faut que ce soit **lisible** : le libellé change avec la règle (D3), et le décideur pose le premier snapshot sciemment (étape 8). |
| R2 | `git ls-files --others` pourrait descendre dans un dépôt imbriqué **non ignoré** (cas d'un projet dont les worktrees ne sont pas dans une zone ignorée). | Comportement **non tenu pour acquis** : c'est CA-7 qui l'établit. Si la garde naît verte, l'implémenteur doit la rendre rouge en retirant l'exclusion — et si git compte réellement l'imbriqué, ajouter l'exclusion explicite **et le dire**. |
| R3 | `doSnapshot` qui **lève** sur version invalide peut faire échouer `onboard` (`onboard.js:156`) au milieu d'un onboarding. | Voulu : échouer bruyamment plutôt qu'écrire une fausse version dans un fichier versionné. Le refus arrive **avant** toute écriture. Couvert par CA-5. |
| R4 | Un projet **hors git** perd le bénéfice de D1 et D3 (nom = dossier, compte = parcours). | Assumé et documenté : hors git, aucune autorité ne peut trancher. Le comportement reste **identique à aujourd'hui** — c'est une non-régression, pas un trou (CA-3, CA-8). |
| R5 | Le libellé MD change → un consommateur inconnu casse. | Vérifié : `lib/etat.js` n'indexe que `Version`/`Note`/`Dernier commit` ; aucun test n'assertionne `fileCount` ni le libellé. Risque résiduel faible, tenu par la suite complète (étape 5). |
| R6 | Le lot touche le **même fichier de journal/état des lieux** que d'autres travaux en cours. | `snapshot.js` est **disjoint** du périmètre `garde-balayante`. Seul `specs/etat-des-lieux.md` est partagé : n'y toucher qu'aux lignes 79-82 (D5), jamais régénérer. |

---

## 9. Critères d'acceptation

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

### Transverse
- [ ] **CA-13** — Les **trois** gardes ont été **vues rouges** avant d'être vertes ; les sorties
      rouges figurent dans le compte rendu du lot.
- [ ] **CA-14** — `node --test` depuis `cli/` : **0 échec**, aucun test existant modifié pour
      accommoder le correctif.
- [ ] **CA-15** — `docs/commandes.md:121` énonce la règle de forme de `--version` et la définition
      du compte ; `specs/etat-des-lieux.md:79-82` ne porte plus l'explication causale fausse.
- [ ] **CA-16** — Aucun `specs/etat-des-lieux.md` / `.html` / `.iakaframe-journal.json` **régénéré**
      sous ce lot (hors fixtures tmp des tests).

---

## 10. Estimation — jalon P1→P2

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **0,5 j-h** (≈ 3 à 4 h) — dont ~1 h de tests, la partie longue. Les trois correctifs pèsent une trentaine de lignes de production. |
| **Complexité / risque** | **Faible en complexité, MOYEN en risque.** Le code est court, local, sans dépendance nouvelle. Le risque n'est pas technique : D3 **change un chiffre visible sur tous les projets du portefeuille**, et le rendre juste le rend aussi **différent** de tout l'historique. |
| **Inconnues susceptibles de faire glisser** | (a) **R2** — comportement exact de `git ls-files --others` face à un dépôt imbriqué non ignoré : si l'hypothèse tombe, +1 h (exclusion explicite + garde). (b) **Effets de bord sur la suite existante** : ~600 tests, dont 5 appels directs à `doSnapshot` ; aucun n'assertionne `fileCount` (vérifié), mais un test qui compterait indirectement coûterait +1 h. (c) **A-1** — si le décideur veut une note de discontinuité au journal, +15 min et un geste sur la mémoire du projet (pas sur le code). (d) **Effet cross-repo** : `snapshot.js` n'est pas vendorisé, mais un `vendor-check` au gate reste dû ; s'il révèle une copie miroir, le lot double de taille — à re-cadrer plutôt qu'à absorber. |

Ordre de grandeur assumé et révisable, **pas un engagement ferme** ; à confronter au temps réel à
la clôture du lot.
