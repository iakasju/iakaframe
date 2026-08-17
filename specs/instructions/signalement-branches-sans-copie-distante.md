# Signalement des branches locales sans copie distante (verbe `range`)

> **Lot successeur du lot 1** *Sauvegarde du portefeuille* (`specs/instructions/sauvegarde-portefeuille.md`).
> Cadrage : 🔵 Gandalf, 2026-08-17. **Instruction fermée** — ce qui n'y figure pas n'est pas à faire.

---

## Problème

Le 2026-08-17, la branche `feat/sauvegarde-portefeuille` — celle qui porte **tout l'outillage de
sauvegarde du portefeuille** (le cadrage de 757 lignes, le verbe `range`, ses 17 gardes, le point de
débrayage `D4`, la procédure de restauration) — a été poussée sur `origin` **pour la première fois**.
Avant cela, elle n'existait **que sur ce disque**, pendant plusieurs jours.

**Le lot qui outille la sauvegarde a donc été, pendant des jours, le seul contenu non répliqué du
portefeuille.** Ce qui a manqué n'est pas la sauvegarde : c'est le **signal**. Rien ne l'annonçait ;
il fallait penser à interroger le distant pour le découvrir.

**Le besoin, en une phrase** : quand `range` sauvegarde, il **dit** quelles branches locales n'ont
aucune copie ailleurs que sur le disque qu'il est en train de sauvegarder.

🛑 **Et il le dit sans mentir sur ce qu'il regarde.** La leçon de la semaine n'est pas qu'une liste
soit en dur : c'est qu'une garde **muette** ne protège rien. Ce signalement **déclare ce qu'il ne
voit pas** (§ *Ce que le signalement ne voit pas*), et **parle même quand il n'a rien à signaler** —
sinon on ne peut pas distinguer « rien à signaler » de « la garde est cassée ».

---

## Ce qui est vérifié de ma main — constats lus sur le disque, 2026-08-17

> Lecture seule, sur `/Users/sjupin/work/iakaframe`. Aucune commande git lancée (pas d'outil Bash à
> ce cadrage) : les constats viennent de la **lecture directe des fichiers de `.git/`**, donc ils
> sont **opposables** — pas rapportés.

| # | Constat | Preuve lue |
|---|---|---|
| `V1` | La racine a bien `feat/sauvegarde-portefeuille` en checkout | `.git/HEAD` → `ref: refs/heads/feat/sauvegarde-portefeuille` |
| `V2` | La branche **n'existait pas** sur `origin` avant le push : le reflog de la ref distante part de l'objet nul | `.git/logs/refs/remotes/origin/feat/sauvegarde-portefeuille` → `0000…0 7201f1d… « update by push »` |
| `V3` | Local et distant coïncident **maintenant** (0 commit d'avance) | `.git/refs/heads/…` = `.git/refs/remotes/origin/…` = `7201f1dde1ad620e7b687b2f21b1102973fa5073` |
| `V4` | **16 branches locales** sur ce dépôt (toutes en refs *loose* ; `packed-refs` ne porte que `origin/main` et 3 tags) | `.git/refs/heads/**`, `.git/packed-refs` |
| `V5` | 🛑 **6 de ces 16 branches n'ont AUCUNE configuration d'upstream** alors qu'une ref distante homonyme existe | absence de `[branch "<nom>"]` dans `.git/config` + présence de `.git/refs/remotes/origin/<nom>` |
| `V6` | Le dépôt a **deux remotes** : `origin` (Forgejo) et `github` (miroir) | `.git/config` §§ `[remote "origin"]`, `[remote "github"]` |
| `V7` | **Aucun worktree** n'est enregistré aujourd'hui | `.git/worktrees/` absent |
| `V8` | `range` existe et compte **exactement 17 gardes** | `cli/test/range.test.js` (17 `test(...)`) |
| `V9` | Le verbe **n'est pas documenté** dans l'inventaire des commandes | `docs/commandes.md` : aucune occurrence de `range` |
| `V10` | Le § *Périmètre* du lot 1 **exclut nommément** « un verbe `iakaframe backup` dans le CLI », alors que `range` a été fabriqué | `specs/instructions/sauvegarde-portefeuille.md:399` |
| `V11` | `range` est **absent** du balayage nominal de la garde C-JSON — et c'est **volontaire** (le lancer écrirait dans le vrai dépôt) | `cli/test/guard-json-output.test.js:56-75` |

**Les 6 branches de `V5`** : `appflowy-doc-wip`, `specs/cadrage-garde-routage-balayante`,
`specs/cadrage-snapshot-defauts`, `feat/garde-balayante-routage-prod`,
`docs/successeur-critere-backlog-d10`, `feat/correctif-generateur-etat-des-lieux`.

`V5` est **le constat qui commande le choix du prédicat** : un signalement fondé sur l'absence
d'upstream produirait, **sur ce dépôt-ci**, **6 faux positifs sur 16 branches** — 37 %. Une garde qui
se trompe une fois sur trois est désactivée mentalement en trois jours.

### Ce que ce cadrage n'a PAS pu mesurer — à dérouler à l'exécution
- **La durée réelle du balayage** sur le chapeau complet (~30 dépôts, dont certains portent des blobs
  de plusieurs centaines de Mo). Non mesurée : pas d'exécution possible au cadrage.
- **Le nombre de branches réellement signalées** au premier passage, tous dépôts confondus. Inconnu.
- **La version de git du poste**, et **quel binaire répond à `iakaframe`** (voir `R4`).
- **Si les 6 branches de `V5` coïncident avec leur ref distante** ou sont en avance : non calculable
  sans lancer git.

---

## Ce qui est vérifié sur le web — faits opposables

- **`F1` — `git rev-list --remotes`** : *« Pretend as if all the refs in `refs/remotes` are listed on
  the command line as `<commit>` »*. Combiné à **`--not`** (*« Reverses the meaning of the `^`
  prefix »*) et **`--count`** (*« Print a number stating how many commits would have been listed »*),
  `git rev-list --count <branche> --not --remotes` donne **le nombre de commits de la branche
  qu'aucune ref distante ne contient**. Aucun accès réseau : ce sont les refs **locales** de suivi.
- **`F2` — `git for-each-ref` / `%(upstream)`** : *« Has no effect if the ref does not have tracking
  information associated with it »* → **chaîne vide** quand aucun upstream n'est configuré ;
  `%(upstream:track)` rend `[ahead N, behind M]` et *« also prints `[gone]` whenever unknown upstream
  ref is encountered »*. Donc `%(upstream)` **ne mesure pas la présence d'une copie distante** : il
  mesure une **configuration locale**.
- **`F3` — `push.autoSetupRemote`** : *« If set to "true" assume `--set-upstream` on default push when
  no upstream tracking exists for the current branch »*, introduit en **git 2.37** (2022-06-27) et
  **non activé par défaut**. C'est **l'explication mécanique de `V5`** : un `git push origin <nom>`
  sans `-u` crée la ref distante **sans** écrire de configuration d'upstream.

---

## Les décisions — tranchées ici, révocables au gate

> Gandalf **propose** ; le décideur **tranche**. Chaque décision ci-dessous est **écrite fermée**
> pour que l'exécution soit mécanique, et **nommée** pour être renversée d'un mot au gate.

### `DA` — Avenant au lot 1, ou lot successeur ? → **LOT SUCCESSEUR**, fabriqué sur une **branche fille**

**Retenu** : une **instruction distincte** (ce fichier), fabriquée sur une branche
`feat/signalement-branches-sans-copie-distante` **créée depuis `feat/sauvegarde-portefeuille`**, et
destinée à y **revenir** — donc à atteindre `main` **avec** le lot 1.

**Pourquoi pas un avenant au lot 1** — trois motifs, aucun d'esthétique :
1. Le lot 1 **n'est pas clos** : ses critères `CA-0` à `CA-16` exigent du terrain non encore
   disponible (accès `bigserver`, une **autre machine** pour `CA-10`, **4 semaines** de mesure pour
   `CA-6`). Greffer une extension dessus **ferait glisser un lot déjà en cours** et rendrait
   impossible la confrontation *estimation ↔ temps réel* à sa clôture, qui est une règle de méthode.
2. Son § *Périmètre* **exclut nommément un verbe CLI** (`V10`) — exclusion déjà démentie par le code
   présent. Un avenant obligerait à **réécrire une décision du décideur** dans un fichier qu'il a
   validé ; un lot successeur **constate** l'écart sans le maquiller.
3. Le chiffrage du lot 1 (≈ 2,5 j-h) est un **repère** ; y noyer 0,7 j-h le rend inexploitable.

**Pourquoi pas non plus « attendre le merge du lot 1 »** : ce merge dépend de mesures de terrain qui
peuvent prendre **des semaines**. Attendre, c'est prolonger exactement le **silence** qu'on corrige.

**Conséquences pour qui exécutera — à lire avant de commencer :**
- Le verbe `range` **n'existe pas sur `main`**. Une instruction posée sur `main` référencerait des
  fichiers introuvables. Tout se passe **dans la descendance de `feat/sauvegarde-portefeuille`**.
- 🛑 **Ce fichier d'instruction est, à l'heure où il est écrit, un fichier non commité de la racine.**
  *L'instruction qui exige de pousser ne doit pas rester locale.* **Premier geste** : la committer
  sur `feat/sauvegarde-portefeuille` et **pousser**, avant de créer le worktree.
- La racine `/Users/sjupin/work/iakaframe` a `feat/sauvegarde-portefeuille` en checkout (`V1`) :
  **on n'y travaille pas**, et git **refuserait** de sortir la même branche dans deux worktrees. D'où
  la branche fille : elle rend la contrainte de worktree **applicable**, au lieu de la contourner.
- 🪤 **Piège de poste, à ne pas apprendre à ses dépens** : `iakaframe <verbe>` et **tout** chemin
  `../iakaframe/cli` exécutent le CLI **de la racine** — jamais celui du worktree, jamais celui de
  `main`. Pour recetter le code du worktree, **une seule forme est valide** :
  `node <worktree>/cli/src/index.js range …`. Le binaire est `cli/src/index.js` (champ `bin` de
  `cli/package.json`) — **il n'y a pas de `cli/bin/`**.

### `DB` — Le prédicat : **des commits qu'aucune ref distante ne contient**

**Retenu** — pour chaque branche locale `B` d'un dépôt :

```
N = git rev-list --count B --not --remotes        # F1
```

- **`N = 0`** → **rien n'est dit**. Silencieux **par construction**, pas par filtrage.
- **`N > 0`** et **aucune** ref `refs/remotes/*/B` → état **`absente`** : *cette branche n'existe
  nulle part ailleurs.* **C'est le cas exact de l'incident** (`V2`).
- **`N > 0`** et une ref `refs/remotes/*/B` existe → état **`en-avance`** : *partiellement répliquée,
  `N` commits ne le sont pas.* Les remotes qui la portent sont **nommés** (`V6` : `origin` **et**
  `github` comptent tous deux — une branche présente sur le seul miroir est visible **comme telle**).

**Les deux états sont rendus distinctement.** C'est ce qui donne du relief au signal **sans aucun
seuil** : le lecteur voit tout de suite ce qui n'existe qu'ici.

**Écarté nommément, avec le motif :**
- ⛔ **L'absence d'upstream** (`%(upstream)` vide) : **mesuré faux** — 6 faux positifs sur 16 sur ce
  dépôt (`V5`), parce que `push` sans `-u` ne configure rien (`F3`). Le prédicat mesurerait une
  **configuration**, pas une **copie** (`F2`).
- ⛔ **`git ls-remote`** (interrogation réseau) : rend le signalement **dépendant du réseau**. La box
  est **optionnelle** par principe ; un balayage qui échoue box éteinte deviendrait **muet
  précisément quand il sert** (pendant les périodes hors ligne, où rien n'est poussé). Coût en durée
  également, sur ~30 dépôts. Limite assumée et **déclarée** (§ *Ce que le signalement ne voit pas*).
- ⛔ **Un seuil d'âge** (« ne signaler qu'au-delà de N jours ») : introduirait **N jours de silence
  organisé** — le défaut même de l'incident. L'âge du dernier commit est **affiché** (il aide à
  trier), **jamais** utilisé comme filtre.
- ⛔ **« des commits que `main` n'a pas »** : mesure une **divergence fonctionnelle**, pas une
  redondance. Une branche mergée dans `main` mais jamais poussée serait alors **muette** — alors
  qu'elle n'existe qu'ici.
- ⛔ **L'arbre sale / l'index / les `git stash`** : hors lot (§ *Ce que le signalement ne voit pas*).

### `DC` — Périmètre du balayage : **celui de la sauvegarde**, pas celui du répertoire courant

Le signalement décrit **ce que l'instantané contient**. Il suit donc **exactement** le périmètre
demandé :

| Invocation | Balayage |
|---|---|
| `range all` | **tous** les répertoires de premier niveau du chapeau (mêmes candidats que `listerProjets`) qui sont des dépôts git |
| `range <projet>` | **ce dépôt seul** — et **rien** n'est dit des autres, ce qui est **écrit dans la sortie** |
| `range --list` | **aucun balayage** (c'est un inventaire, pas une sauvegarde) |
| `range --branches` | balayage **seul**, sans lancer restic (voir `DD`) |

Le **répertoire courant n'entre jamais** dans la résolution : `range` se pilote par `--root` /
`IAKAFRAME_ROOT` (`lib/root.js`), et un signalement qui changerait de sens selon l'endroit où on
tape la commande serait intenable.

### `DD` — Nature du signal : **une section du rapport, jamais un blocage**

1. **Jamais bloquant, jamais de code de sortie propre.** `range` est un verbe de **sauvegarde** :
   empêcher — ou faire échouer — une sauvegarde parce qu'une branche n'est pas poussée serait
   absurde, et **aggraverait** le problème qu'on traite. Le code de sortie reste celui de restic.
2. **Affiché AVANT le lancement de restic**, dans l'en-tête déjà existant. Motif : la sortie de
   restic est **héritée** et dure plusieurs minutes ; un signal placé après serait **noyé**.
3. **Rappelé APRÈS le `OK` final**, en **une seule ligne** (le compteur, pas la liste). Deux
   emplacements, deux formes : ni bloquant, ni noyé.
4. **Il parle toujours**, y compris quand tout va bien — une ligne :
   `branches sans copie distante : aucune (31 depots scannes, 0 ignore, 2 non-git)`.
5. **Il dit quoi faire** : `-> git push -u origin <branche>`.
6. **Plafond d'affichage : 10 lignes de détail**, puis `… et N autres (voir --json)`. On **borne
   l'affichage, jamais le compteur** — le nombre reste exact.
7. **En `--json`** : les données entrent dans le rapport, **y compris dans la charge d'échec** — un
   signalement perdu quand restic rate serait perdu au pire moment. Aucun texte humain sur `stderr`.

**Forme humaine attendue** (l'en-tête existant, augmenté d'un bloc) :

```
range all -> sftp:bigserver:/fast/backups/portefeuille
  chemin      : /Users/sjupin/work
  etiquettes  : iaka-range perimetre:all
  exclusions  : /Users/sjupin/work/iakaframe/config/sauvegarde-exclusions.txt

  branches sans copie distante : 2 sur 31 depots (0 ignore, 2 non-git, 87 branches examinees)
    iakaframe   feat/signalement-branches-…   6 commits   AUCUNE ref distante   (12 j)
    iakaHub     wip/pont-discord              2 commits   en avance sur origin  (3 j)
    -> git push -u origin <branche>
  ce balayage ne voit pas : les modifs non commitees, les stash, les depots imbriques,
  l'etat reel des remotes (connaissance datee du dernier fetch)
```

**Forme machine** — ajouts au rapport existant, sans toucher aux clés en place :

```json
{
  "ok": true,
  "…": "champs existants inchanges",
  "branchesSansCopieDistante": [
    { "projet": "iakaframe", "branche": "feat/x", "commitsLocaux": 6,
      "etat": "absente", "refsDistantes": [], "dernierCommit": "2026-08-05T11:02:13+02:00",
      "ageJours": 12 }
  ],
  "branchesSansCopieDistanteCount": 1,
  "scanBranches": {
    "depotsScannes": 31, "depotsNonGit": 2, "depotsIgnores": 0,
    "branchesExaminees": 87, "branchesEcartees": 0,
    "motifsIgnores": "/Users/sjupin/work/iakaframe/config/sauvegarde-branches-ignorees.txt",
    "dureeMs": 412,
    "limites": ["refs locales de suivi (pas de ls-remote)", "profondeur 1", "…"]
  }
}
```

**Contrainte de forme, lue dans `cli/src/lib/output.js`** : tableau sous une clé **au pluriel** +
**frère compteur** (règle 3) ; **toute** impression passe par `lib/output.js` (règle : `emit`/`ok`/
`fail`, verrou statique de `cli/test/guard-json-output.test.js:30`). Le rapport `range` **niche
déjà** un objet (`resume`) : `scanBranches` suit ce précédent.

### `DE` — Les faux positifs légitimes : **un point de débrayage déclaratif, vide**, jamais une liste en dur

Une branche jetable, un essai, un `archive/*` sont **légitimement** locaux. Mais **aucune** branche
`archive/*` n'existe sur ce dépôt aujourd'hui (`V4`) : l'exclusion est une **provision**, pas un
besoin mesuré. Elle ne sera donc **pas codée en dur**.

**Retenu** — le motif de `D4` du lot 1, à l'identique : un fichier **versionné et VIDE**,
`config/sauvegarde-branches-ignorees.txt`, un **glob de nom de branche par ligne**, `#` = commentaire.
Il existe **avant** d'être nécessaire : le jour où une branche doit être écartée, c'est **un ajout de
ligne**, daté et versionné, **par le décideur**.

🛑 **Écarter n'est jamais taire.** Le compteur `depotsIgnores` / `branchesEcartees` est **affiché**,
et le **chemin du fichier de motifs** figure dans la sortie machine. Une garde qui masque sans le
dire est le défaut qu'on corrige, pas celui qu'on reproduit.

---

## Périmètre

**Inclus**
- Un module de balayage **en lecture seule**, `cli/src/lib/branches-locales.js` : énumération des
  branches d'un dépôt, calcul de `N` (`DB`), état `absente` / `en-avance`, remotes porteurs, âge du
  dernier commit, lecture des motifs ignorés.
- Le **câblage dans `cli/src/commands/range.js`** : bloc d'en-tête + ligne de rappel + champs `--json`
  (succès **et** échec), selon `DD`.
- L'option **`--branches`** : n'exécute **que** le balayage, ne lance **pas** restic, sort en 0. Elle
  n'est pas un confort : c'est **le seul chemin de recette et de test au niveau CLI qui ne puisse pas
  écrire dans un dépôt de sauvegarde** — la parade structurelle héritée de l'incident du 2026-08-15
  consigné en tête de `cli/test/range.test.js`.
- Le **point de débrayage** `config/sauvegarde-branches-ignorees.txt`, **vide et commenté** (`DE`).
- Les **gardes** dans un **nouveau** fichier `cli/test/branches-locales.test.js` — dépôts git
  jetables en `tmpdir`, **remote factice = dépôt nu local**, **zéro réseau**, **zéro restic**.
- La **mise à jour de l'inventaire des commandes** : `docs/commandes.md` gagne la ligne `range`
  (absente aujourd'hui, `V9`) **incluant** le signalement. Une ligne, rien d'autre dans ce fichier.
- Le **texte d'aide** : `USAGE` de `range` + le bloc `range` de `cli/src/index.js`.

**Exclu — nommément, et pour un motif écrit**
- ⛔ **Toute action corrective** : `range` ne pousse **rien**, ne crée **aucune** branche, ne
  configure **aucun** upstream. Il **signale**. *(Un verbe de sauvegarde qui pousse du code serait un
  franchissement de périmètre, et une surprise.)*
- ⛔ **Tout blocage / tout code de sortie dédié** (`DD-1`). À rouvrir seulement si l'usage démontre
  que le signal est ignoré.
- ⛔ **Toute interrogation réseau** (`git ls-remote`, `git fetch`) — `DB`.
- ⛔ **L'arbre sale, l'index, les `git stash`, les commits en HEAD détaché** : autre besoin, autre lot.
- ⛔ **Les sous-modules et les dépôts imbriqués** (profondeur > 1).
- ⛔ **L'alerte poussée** (Discord) et le **veilleur d'absence** : ils appartiennent à *Q6* du lot 1.
  Ce lot n'écrit **rien** sur un canal.
- ⛔ **Ajouter `range` au balayage nominal de `cli/test/guard-json-output.test.js`** : son absence est
  **volontaire** (`V11`) — l'y ajouter lancerait restic sur le **vrai** dépôt. **Ne pas y toucher.**
  Le contrat C-JSON de `range` se garde via `--branches` et via les cas d'erreur déjà présents dans
  `cli/test/range.test.js`.
- ⛔ **Toute modification des 17 gardes existantes** (`cli/test/range.test.js`) : elles doivent passer
  **inchangées**. C'est le témoin de non-régression du lot.
- ⛔ **Toute correction du § *Périmètre* du lot 1** (`V10`) : l'écart est **consigné** ici, pas
  maquillé. Il appartient au décideur.
- ⛔ **`docs/restauration-portefeuille.md`** : document de restauration, hors sujet ici.
- ⛔ **Réparer les 6 branches de `V5`** (poser leurs upstreams) : geste de dépôt, pas de fabrication.
  Consigné au backlog, avec la piste `push.autoSetupRemote` (`F3`).

---

## Ce que le signalement ne voit pas — À ÉCRIRE DANS LE CODE ET DANS LA SORTIE

> **Ce n'est pas un commentaire de fichier : c'est une sortie.** Une garde qui ne déclare pas son
> angle mort laisse croire qu'elle n'en a pas. La liste ci-dessous est **rendue** (forme courte à
> l'écran, `scanBranches.limites` en `--json`) et **testée**.

1. **Ce qui n'est pas un dépôt git** — compté et **nommé** (`depotsNonGit`), jamais avalé en silence.
2. **Les dépôts imbriqués** (profondeur > 1) et les **sous-modules** : hors balayage.
3. **Les modifications non commitées**, l'**index**, les **`git stash`** (ce ne sont pas des refs), et
   les commits d'un **HEAD détaché** non joignables depuis une branche.
4. **Les dépôts hors du périmètre demandé** : `range <projet>` ne dit **rien** des autres — dit
   explicitement.
5. **Ce qui est exclu de la sauvegarde** par `config/sauvegarde-exclusions.txt` (aujourd'hui **vide**,
   `D4`) : le balayage ne recoupe pas ces motifs.
6. **L'état réel des remotes** : connaissance **datée du dernier `fetch`** (`DB`). Une branche
   **supprimée côté serveur** depuis paraîtra encore répliquée.
7. **La hiérarchie des remotes** : `origin` et `github` comptent **tous deux** comme copie distante
   (`V6`). Le rapport **nomme** le remote ; c'est au lecteur de juger si un miroir suffit.
8. 🛑 **Le rapport entre « poussé » et « sauvegardé »** : la sauvegarde `range` prend `~/work` **sans
   exclusion** — donc les répertoires `.git`, donc **les branches locales sont bel et bien dans
   l'instantané**. Le signal ne dit **pas** « ce n'est pas sauvegardé » ; il dit **« il n'existe
   aucune copie hors de ce disque autre que cet instantané »**. C'est pourquoi il s'appelle
   **« sans copie distante »**. Un libellé du type « non sauvegardé » serait **faux** dès que `range`
   a tourné, et un signal faux se paie plus cher qu'un signal absent.
9. **Les branches écartées par motif** (`DE`) : écartées de la **liste**, **pas** du compteur.

---

## Étapes d'implémentation

1. **Committer et pousser CE fichier** sur `feat/sauvegarde-portefeuille` (`DA`), puis
   **`git fetch`** pour que les refs de suivi soient fraîches.
2. **Établir quel binaire répond à `iakaframe`** (`R4`) : `which -a iakaframe`, et **écrire** la
   réponse au dossier. Tant que ce n'est pas écrit, toute recette est ambiguë.
3. **Créer le worktree** : branche `feat/signalement-branches-sans-copie-distante` depuis
   `feat/sauvegarde-portefeuille`, **hors** de la racine. ~~**Pousser avec `-u` au premier commit**~~ —
   ce lot **se mange lui-même** : sa propre branche ne doit pas devenir le prochain incident.
   🛑 **RECTIFICATION DATÉE — 2026-08-17, 🔵 Gandalf, arbitrage instruit par 🏹 Legolas.** « `push -u`
   au premier commit » était **logiquement inconciliable** avec `CA-15`, qui exige la capture du
   témoin négatif **avant** ce push — or `--branches` ne répond qu'au **câblage**. **`CA-15` gagne, et
   cette étape cède** : `CA-15` est la preuve que la garde mord, le push au premier commit n'en était
   qu'un moyen. La règle de remplacement, **gravée pour cette famille de lots**, est `DH` de
   `specs/instructions/temoins-manquants-signalement-branches.md` : **capturer dès que la garde
   répond, pousser `-u` immédiatement après, plafond d'exposition écrit de 30 minutes.** Mesure au
   reflog de ce lot-ci : **50 s** entre le 6ᵉ commit et le push, **19 min 45 s** d'exposition totale —
   l'esprit a été tenu sans avoir été écrit.
4. **Écrire `cli/src/lib/branches-locales.js`** : fonctions **pures** pour tout ce qui est
   décidable sans git (classement, plafond d'affichage, lecture/évaluation des motifs, rendu texte),
   et **une seule** frontière d'exécution git (`lib/git.js:run`, déjà en place).
5. **Écrire les gardes** (`cli/test/branches-locales.test.js`) sur des dépôts jetables, **avant** le
   câblage. **Chaque garde est vue ROUGE d'abord** (§ *Falsification*).
6. **Créer `config/sauvegarde-branches-ignorees.txt`**, **vide de motifs**, commenté sur le modèle de
   `config/sauvegarde-exclusions.txt` (dire ce que le fichier fait, et que le compteur reste visible).
7. **Câbler `commands/range.js`** : `--branches`, bloc d'en-tête, ligne de rappel, champs `--json` en
   succès **et** en échec (`DD-7`). Aucune impression hors `lib/output.js`.
8. **Mettre à jour l'aide** : `USAGE` de `range` et le bloc `range` de `cli/src/index.js`.
9. **Mettre à jour `docs/commandes.md`** (une ligne `range`, `V9`).
10. **Recetter sur le chapeau réel** avec `node <worktree>/cli/src/index.js range --branches --json`
    (jamais `iakaframe`, `R4`) : **relever** la durée, le nombre de dépôts, de branches examinées, de
    branches signalées. **Ce sont des chiffres à écrire, pas à supposer.**
11. **Vérifier que les 17 gardes du lot 1 passent inchangées** (`node --test` depuis `cli/`).
12. **Consigner au backlog** : les 6 branches sans upstream de `V5`, la piste `push.autoSetupRemote`
    (`F3`), et l'écart `V10` du § *Périmètre* du lot 1.

---

## Falsification des gardes — rouge AVANT vert, consigné verbatim

> **Une garde qu'on n'a jamais vue échouer ne prouve rien.** Et la sortie rouge devient
> **irreproductible** dès la correction : si elle n'est pas copiée, elle est perdue.

Pour **chaque** garde ajoutée : saboter la source, **lancer**, **copier la sortie d'échec
VERBATIM**, rétablir, relancer au vert. Les sorties rouges sont consignées :
- **verbatim** dans le message de remise au jalon P2→P3 (récepteur 🏹 Legolas) ;
- **une ligne par garde falsifiée** dans le corps du commit qui la pose — pour qu'elles survivent à
  la session.

Sabotages **nommés** (ce sont eux qui prouvent que le prédicat mord) :
| Sabotage | Ce qui doit rougir |
|---|---|
| `S1` — remplacer `--not --remotes` par `--not @{upstream}` | ~~la branche poussée **sans** `-u` (`V5`) redevient un faux positif~~ → 🛑 **FAUX, rectifié le 2026-08-17** : la branche devient **MUETTE** (git échoue faute d'upstream → prédicat `null` → aucun compteur). `S1` est attrapé par 8 autres gardes, **pas** par `CA-2`. Détail et refermeture : § `CA-2` et `temoins-manquants-signalement-branches.md` |
| retirer `--remotes` (compter tous les commits) | **toute** branche est signalée |
| faire du plafond d'affichage un plafond de **comptage** | le compteur cesse d'être exact |
| rendre le balayage **muet** quand il n'y a rien à dire | la garde « il parle toujours » (`CA-5`) |
| avaler un répertoire non-git en silence | `depotsNonGit` reste à 0 |
| supprimer le bloc des limites de la sortie | la garde `CA-8` |

---

## Fichiers concernés

- `specs/instructions/signalement-branches-sans-copie-distante.md` — **ce fichier** (le cadrage).
- `cli/src/lib/branches-locales.js` — **créé** : le balayage, en lecture seule.
- `cli/src/commands/range.js` — **modifié** : `--branches`, en-tête, rappel, champs `--json`, `USAGE`.
- `cli/src/index.js` — **modifié** : bloc d'aide de `range` (le routage existe déjà, `:202`).
- `cli/test/branches-locales.test.js` — **créé** : les gardes du lot.
- `config/sauvegarde-branches-ignorees.txt` — **créé**, **vide de motifs** (point de débrayage `DE`).
- `docs/commandes.md` — **modifié** : une ligne `range` (`V9`).
- ⛔ `cli/test/range.test.js` — **inchangé**. Les 17 gardes du lot 1 sont le témoin de non-régression.
- ⛔ `cli/test/guard-json-output.test.js` — **inchangé** (`V11` : y ajouter `range` lancerait restic
  sur le vrai dépôt).
- ⛔ `cli/src/lib/range.js` — **inchangé** : le balayage git n'a rien à faire dans le module restic.
- ⛔ `specs/instructions/sauvegarde-portefeuille.md` — **inchangé** (`DA`).
- ⛔ **Aucun fichier d'un autre projet du chapeau.** Aucun.

---

## Risques

**`R1` — Le faux positif qui tue la garde.** Un signalement bruyant est un signalement mort.
*Mitigation* : le prédicat mesuré, pas supposé (`DB`, contre 37 % de faux positifs mesurés en `V5`) ;
deux états distincts ; plafond d'affichage ; débrayage déclaratif (`DE`). *Témoin* : `CA-2`, `CA-3`.

**`R2` — Le balayage ralentit le verbe.** ~30 dépôts × (`for-each-ref` + un `rev-list` par branche).
Non mesuré au cadrage. *Mitigation* : **mesurer** (`CA-9`) et rouvrir devant le décideur si le
balayage dépasse **2 s** — **jamais** le rendre silencieux pour gagner du temps.

**`R3` — Un test qui lance le vrai CLI hérite des vrais défauts.** Cette faute a **déjà eu lieu** le
2026-08-15 (préambule de `cli/test/range.test.js` : un sabotage a réellement écrit un instantané dans
le dépôt **de production**). *Mitigation* : toute garde CLI passe par **`--branches`** (qui ne peut
pas atteindre restic) **et** conserve le harnais de dépôt jetable existant.

**`R4` — 🪤 Recetter le mauvais binaire.** `iakaframe` et tout `../iakaframe/cli` exécutent le CLI
**de la racine** — sur la branche du **lot 1**, sans le signalement. On croirait la garde absente (ou
présente) à tort. *Mitigation* : **étape 2 écrite** ; toute recette en `node <worktree>/cli/src/index.js`.

**`R5` — Le message qui mentait.** Écrire « branche non sauvegardée » serait **faux** : l'instantané
contient les `.git` (§ *ne voit pas*, point 8). *Mitigation* : le libellé **« sans copie distante »**
est un **critère** (`CA-7`), pas une préférence de style.

**`R6` — Le lot fille non poussée.** Fabriquer ce lot sur une branche locale-seule rejouerait
l'incident **mot pour mot**. *Mitigation* : `push -u` **au premier commit** (étape 3), et le lot se
signale lui-même dès qu'il tourne.

---

## Critères d'acceptation

> Chaque critère porte son **témoin négatif** : ce qu'on doit voir **échouer** pour savoir que le
> contrôle mord.

- [ ] **`CA-1` — le cas de l'incident est détecté.** Sur un dépôt jetable ayant une branche locale
      avec des commits et **aucune** ref distante, le signalement la rend avec l'état **`absente`** et
      le **nombre exact** de commits.
      **Témoin négatif** : la même branche **poussée** vers un dépôt nu local **disparaît** du
      signalement — sinon le contrôle crie toujours et ne mesure rien.

- [ ] **`CA-2` — 🛑 le faux positif mesuré en `V5` NE se produit PAS.** Dépôt jetable, branche poussée
      **sans `-u`** (donc `%(upstream)` vide, `F2`/`F3`) : elle **n'est pas** signalée.
      **Témoin négatif** : ~~le sabotage `--not @{upstream}` la fait réapparaître — la garde doit
      **rougir** dans ce cas, et cette sortie rouge est **consignée verbatim**.~~
      🛑 **RECTIFICATION DATÉE — 2026-08-17, 🔵 Gandalf, sur mesure de 🏹 Legolas. Ce témoin négatif
      était FAUX, et le texte barré ci-dessus est de ma main.** Legolas a joué le sabotage : **`CA-2`
      reste VERT**. Mécanisme mesuré, et c'est un faux **négatif**, pas un faux positif : privée
      d'upstream, la révision `<B>@{upstream}` **n'est pas résoluble** (`fatal: no upstream configured
      for branch`, code 128) → `lib/git.js:run` rend `ok:false` → `compterCommitsSansCopie` rend
      `null` (`branches-locales.js:144`) → `classer(null, …)` rend `null` (`:98`) → `analyserDepot`
      fait `continue` (`:164`). **La branche ne réapparaît pas : elle devient MUETTE**, et ne figure
      dans **aucun** compteur. Le sabotage est bien attrapé — **par 8 autres gardes, pas par
      celle-ci.** *Ce que `CA-2` prouve réellement* : le prédicat mesure une **copie** et non une
      **configuration** (c'est juste, et vérifié). *Ce qu'il ne prouve pas* : qu'un prédicat
      non calculable se voie. Cette classe de panne — **un `null` qui produit du silence** — est
      reprise et refermée par le lot successeur
      `specs/instructions/temoins-manquants-signalement-branches.md` (`DG`, `CB-1`, `CB-2`), qui exige
      que le sabotage rougisse **sur la garde qui le décrit**. Le verdict PASS du gate n'est pas
      modifié : il portait sur le périmètre qui lui était présenté.

- [ ] **`CA-3` — l'état `en-avance` est distingué de `absente`.** Branche présente sur le distant mais
      avec `N` commits locaux en plus → état `en-avance`, `N` exact, **remote nommé**.
      **Témoin négatif** : une branche **strictement en retard** (behind) n'est **pas** signalée —
      elle est intégralement répliquée.

- [ ] **`CA-4` — le périmètre du balayage suit celui de la sauvegarde** (`DC`) : `--branches` sur un
      chapeau factice de 3 dépôts en signale les 3 ; ciblé sur **un** projet, il n'en signale **qu'un**.
      **Témoin négatif** : le ciblage ne doit **rien** dire d'un **autre** dépôt du chapeau, et la
      sortie doit **le déclarer** — un silence non déclaré passerait pour un « tout va bien ».

- [ ] **`CA-5` — il parle même quand il n'a rien à signaler.** Chapeau dont tout est poussé → une ligne
      `branches sans copie distante : aucune (…)` avec les compteurs.
      **Témoin négatif** : rendre ce cas **muet** doit faire rougir la garde. *On ne doit jamais
      pouvoir confondre « rien à signaler » avec « la garde est cassée ».*

- [ ] **`CA-6` — jamais bloquant.** `range --branches` sur un chapeau où **3** branches sont signalées
      sort en **0**. La sauvegarde n'est **jamais** refusée à cause d'un signalement.
      **Témoin négatif** : un code de sortie non nul dans ce cas est un **échec** du critère.

- [ ] **`CA-7` — le libellé ne ment pas** (`R5`) : la sortie humaine et les clés JSON portent
      **« sans copie distante »**. Aucune occurrence de « non sauvegardé » / « non sauvegardee ».
      **Témoin négatif** : une recherche de la chaîne « sauvegard » dans les libellés du signalement
      rend **zéro** — sinon le signal contredit `§ ne voit pas` point 8.

- [ ] **`CA-8` — 🛑 les angles morts sont RENDUS, pas commentés** : la sortie humaine porte le bloc
      `ce balayage ne voit pas : …` et `--json` porte `scanBranches.limites` **non vide**, ainsi que
      `depotsNonGit` et `branchesEcartees`.
      **Témoin négatif** : un répertoire **non-git** placé dans le chapeau factice fait **monter**
      `depotsNonGit` — s'il reste à 0, le balayage avale en silence.

- [ ] **`CA-9` — le coût est MESURÉ sur le chapeau réel** : durée du balayage, nombre de dépôts,
      de branches examinées, de branches signalées — **quatre chiffres écrits**. Au-delà de **2 s**,
      le point est **rouvert devant le décideur**, pas corrigé par un silence.
      **Témoin négatif** : « rapide » n'est pas une mesure ; l'absence de chiffre invalide le critère.

- [ ] **`CA-10` — le débrayage existe et se voit** (`DE`) : `config/sauvegarde-branches-ignorees.txt`
      est versionné, **sans motif**, commenté. Un motif ajouté retire la branche de la **liste** et
      fait monter `branchesEcartees`.
      **Témoin négatif** : avec un motif actif, `branchesEcartees` **ne doit pas** rester à 0 — une
      exclusion invisible est interdite.

- [ ] **`CA-11` — le signalement survit à l'échec de restic** (`DD-7`) : en `--json`, sur un dépôt
      restic inexistant, la charge `{ ok:false, … }` porte **quand même** `branchesSansCopieDistante`.
      **Témoin négatif** : le retirer de la charge d'échec doit faire rougir la garde — c'est
      exactement le moment où l'information compte.

- [ ] **`CA-12` — aucune régression** : les **17** gardes de `cli/test/range.test.js` passent, fichier
      **inchangé** ; `cli/test/guard-json-output.test.js` **inchangé** et vert ; `node --test` vert.
      **Témoin négatif** : `git diff` sur ces deux fichiers rend **zéro ligne**.

- [ ] **`CA-13` — zéro réseau, zéro écriture** : aucune garde n'appelle `ls-remote`, `fetch`, `push`
      ni `restic`. Le balayage n'écrit **rien** (aucun fichier créé/modifié dans les dépôts scannés).
      **Témoin négatif** : la comparaison avant/après sur un dépôt scanné rend **zéro fichier
      modifié** — « je n'y touche pas » n'est pas un constat.

- [ ] **`CA-14` — l'aide et l'inventaire disent la même chose que le code** : `range --help`/`--help`
      documentent `--branches` et le signalement ; `docs/commandes.md` porte la ligne `range` (`V9`).
      **Témoin négatif** : la ligne doit **manquer** avant le lot (elle manque, `V9`) et **exister**
      après.

- [ ] **`CA-15` — le lot s'applique à lui-même** : sa propre branche a une **ref distante** avant la
      remise, et `--branches` **ne la signale plus**.
      **Témoin négatif** : avant le `push -u`, elle **doit** apparaître — capture de cette sortie
      **verbatim** dans la remise. *C'est la preuve que la garde aurait attrapé l'incident.*

---

## Chiffrage

> **Estimation, pas engagement.** Ordre de grandeur assumé et révisable, à confronter au temps réel à
> la clôture du lot.

| Nature | Geste | Coût |
|---|---|---|
| **Mécanique** | `lib/branches-locales.js` (énumération, prédicat `DB`, états, âge, motifs) | **0,2 j-h** |
| **Mécanique** | Câblage `commands/range.js` : `--branches`, en-tête, rappel, `--json` (succès + échec) | **0,15 j-h** |
| **Gardes** | `cli/test/branches-locales.test.js` — dépôts jetables + dépôt nu, **rouge avant vert** | **0,25 j-h** |
| **Mesure à dérouler** | Recette sur le chapeau réel + les 4 chiffres de `CA-9` | **0,1 j-h** |
| **Mécanique** | Aide (`USAGE`, `index.js`), `docs/commandes.md`, fichier de débrayage commenté | **0,1 j-h** |
| **TOTAL** | | **≈ 0,8 j-h** |

**Complexité : FAIBLE. Risque : MOYEN — et il n'est pas où on l'attend.** La mécanique est de la
lecture git ; le risque est **dans la justesse du signal** : un prédicat approximatif (`R1`) ou un
libellé faux (`R5`) produirait une garde qu'on apprend à ignorer — c'est-à-dire **rien**, mais avec
la bonne conscience d'être couvert.

**Les trois inconnues qui peuvent faire glisser le lot :**
1. **La durée du balayage** sur ~30 dépôts (`R2`, non mesurée). Si elle dépasse 2 s, il faut arbitrer
   (balayage seulement en `all` ? cache ?) : **+0,2 à +0,4 j-h**, et c'est un **arbitrage**, pas une
   correction.
2. **Le volume du premier signalement** : si le chapeau rend 40 branches, la **lisibilité** est à
   rouvrir devant le décideur (le plafond d'affichage suffit-il ?) — **+0,1 j-h**, ou un arbitrage.
3. **Le binaire qui répond** (`R4`) : si `iakaframe` s'avère être une installation figée (paquet npm
   et non lien vers la racine), la recette et le déploiement du verbe changent de forme — **+0,2 j-h**.

---

## Sources vérifiées pendant le cadrage

- [git-rev-list — `--remotes`, `--branches`, `--not`, `--count`](https://git-scm.com/docs/git-rev-list)
- [git-for-each-ref — `%(upstream)`, `:track`, `[gone]`](https://git-scm.com/docs/git-for-each-ref)
- [`push.autoSetupRemote` — introduit en git 2.37, non activé par défaut](https://adamj.eu/tech/2022/10/31/git-how-to-automatically-create-upstream-branches/)
- [`push.autoSetupRemote` — texte de la configuration et portée (`push.default` simple/upstream/current)](https://leonardomontini.dev/git-push-auto-setup-remote/)

**Ajoutées à la rectification du 2026-08-17** (mécanisme du faux négatif de `CA-2`) :
- [gitrevisions — `<branchname>@{upstream}` : la révision n'est pas résoluble sans upstream configuré](https://git-scm.com/docs/gitrevisions)
- [git — `t/t1507-rev-parse-upstream.sh` : le cas d'erreur « no upstream » est couvert par la suite de tests de git](https://github.com/git/git/blob/master/t/t1507-rev-parse-upstream.sh)

---

## Relevé d'exécution

> **Appendu le 2026-08-17**, forme prescrite par `DI` de
> `specs/instructions/temoins-manquants-signalement-branches.md`. **Appendu, jamais substitué** : le
> corps de l'instruction ci-dessus n'est pas réécrit pour coïncider avec ce qui a été fait — l'écart
> entre le cadrage et l'exécution **est une information**.
>
> ⚒️ **Tableau à remplir par Gimli**, qui détient les verdicts et les sorties rouges (corps des
> **8 commits** du lot, `c53e51e`…`8b2e236`, mergés en `98026b1`). **Une case du § *Critères
> d'acceptation* ne se coche qu'avec une ligne de preuve nommée ici** — une case cochée sans preuve
> est un manquement, pas un raccourci. Verdicts autorisés : **`vert`** / **`vert (dégradé)`** /
> **`non tenu`** / **`sans objet`**. « OK » n'est pas un verdict ; « rapide » n'est pas un chiffre.

| Critère | Verdict | Preuve (`fichier:ligne`, commit, ou chiffre mesuré) | Note |
|---|---|---|---|
| `CA-1` | | | |
| `CA-2` | | | ⚠ témoin négatif **rectifié** le 2026-08-17 — voir le § *Critères d'acceptation* |
| `CA-3` | | | |
| `CA-4` | | | |
| `CA-5` | | | |
| `CA-6` | | | |
| `CA-7` | | | |
| `CA-8` | | | |
| `CA-9` | | | 4 chiffres exigés : durée, dépôts, branches examinées, branches signalées |
| `CA-10` | | | |
| `CA-11` | | | ⚠ gardé sur le chemin `code !== 0` **seulement** — chemin exception repris par `CB-4` du lot successeur |
| `CA-12` | | | |
| `CA-13` | | | |
| `CA-14` | | | |
| `CA-15` | | | chronologie au reflog : capture, `push -u`, exposition totale |

**Réserves du gate 🏹 Legolas (2026-08-17) — PASS, mergé `98026b1`.** Quatre réserves relevées, dont
trois portées par le **lot successeur** `specs/instructions/temoins-manquants-signalement-branches.md` :
`L-1` (ordre de rendu non gardé → `CB-3`), `L-2` (`DD-7` gardé sur un seul chemin → `CB-4`),
`L-3` (témoin de `CA-2` faux + le `null` muet → rectification ci-dessus, `DG`/`CB-1`/`CB-2`),
`L-4` (relevé absent → ce tableau, `CB-7`). Deux points mineurs : l'accord de « depot(s) »
(→ `CB-5`) et le corps vide de `8b2e236` (**de l'histoire, non réécrit** ; ce relevé porte ce que le
corps ne portait pas). Dette laissée **distincte et sans urgence** : `SIGN-5` (pente du coût,
≈ 11 ms par processus git, croissance linéaire avec le portefeuille).

**Confrontation estimation ↔ temps réel** — estimé **≈ 0,8 j-h** · réel : `…` · écart et motif : `…`
