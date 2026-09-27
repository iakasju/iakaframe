# Push du CLI restreint aux forges self-hosted — GitHub (vitrine) en opt-in projet et en publication explicite

> Cadrage : Gandalf (P1), 2026-09-27. Ordre d'Odin validé par le décideur le 2026-09-27.
> Statut : **arbitré** le 2026-09-27 (points ouverts 1 à 5 tranchés par le décideur, § « Arbitrages ») —
> amendé en conséquence, **prêt pour le jalon P1→P2**.

## Problème

`iakaframe update` pousse par défaut sur **tous** les remotes configurés
(`cli/src/commands/update.js:26` et `:128`, via `listerRemotes` `cli/src/lib/canaux.js:52`).
Le 2026-09-26, le checkpoint de naonedge (commit `822548d`) a ainsi poussé sur le remote `github`
(dépôt privé `iakasju/naonedge`) des transcripts de réunions clients (données nominatives, RH,
montants), alors que le `CLAUDE.md` du projet l'interdisait : une consigne en prose ne protège pas
d'un défaut de l'outil. Le risque est transverse : environ 45 dépôts de `~/work` portent encore un
remote `github`. GitHub n'est **pas** un remote de la méthode (self-hosted d'abord) : le push hors
forge self-hosted doit devenir un **acte explicite, décidé par projet**, jamais un effet par défaut.

Second enjeu, apporté par l'arbitrage : GitHub est la **vitrine** de quatre dépôts publics
(`iakasju/iakaframe`, `iakaFrameGUI`, `IakaCockpit`, `iakaInstall`) dont le workflow
`release.yml` se déclenche sur **tout push de tag `v*`** (`.github/workflows/release.yml:6-9` ;
idem `IakaCockpit/.github/workflows/release.yml:6-10`, `iakaFrameGUI/.github/workflows/release.yml:6-10`,
`iakaInstall/.github/workflows/release.yml:16-20`). Aucun de ces workflows ne se déclenche sur un
push de **branche** (le seul autre workflow GitHub, `banc-etapes-3-4.yml:38-39`, est en
`workflow_dispatch` seul). Chaque tag poussé vers GitHub = un build GitHub Actions. On ne doit
solliciter ces builds que pour une **vraie release** (majeure ou mineure), jamais pour un correctif.

## Arbitrages du décideur (2026-09-27)

| # | Question | Arbitrage |
|---|---|---|
| A1 | Critère d'éligibilité | **Hôte de destination** (URL de push effectives), pas le nom du remote. Reco validée. |
| A2 | Remote inconnu non-GitHub | **Exclu par défaut** (fail-safe). Reco validée. |
| A3 | Où se déclare l'opt-in | **Seulement** dans le `iakaframe.json` du projet ; `--remotes github` seul ne suffit pas. Reco validée. |
| A4 | Code retour d'un refus explicite | **Exit 1**. Reco validée. |
| A5 | Politique GitHub (reformulée par le décideur, **remplace** la reco initiale) | Par défaut, `update` pousse pour **tous** les projets sur la forge VPS (`origin`) + les miroirs self-hosted éligibles (`nas`, `iakabox`). Le push vers GitHub (vitrine) n'a lieu que (a) sur **demande explicite** ou (b) pour une version **majeure ou mineure** (jamais un patch), et **toujours avec l'accord humain du décideur** (jamais automatique). Opt-in `github` **dans ce lot** pour iakaframe, iakaFrameGUI, IakaCockpit, iakaInstall ; tous les autres projets ne poussent plus sur GitHub. |

## Décision retenue

### 1. Éligibilité par destination réelle (A1, A2)

Un remote est classé à partir de **toutes** ses URL de push effectives
(`git remote get-url --push --all <nom>`, qui applique `insteadOf`/`pushInsteadOf` et `pushurl` —
cf. Sources). Il est **forge** si chaque URL désigne :
- un **chemin local** (chemin absolu ou relatif, `file://`, lettre de lecteur Windows `C:\`/`C:/`) ;
- ou un **hôte de forge self-hosted connu** = union des hôtes de `DEF_URLS`
  (`cli/src/lib/forgejo.js:20` : `git.naonedge.com`, `192.168.1.139`, `192.168.2.11`) et des
  hôtes des URL résolues par `cfgList()` (`cli/src/lib/forgejo.js:82`, donc `FORGEJO_URL` shell
  ou `<chapeau>/.env`). Comparaison sur le **hostname en minuscules** (port ignoré).

Tout le reste — `github.com`, toute autre forge, un hôte inconnu, une URL illisible, un `get-url`
en échec — est **hors forge** (fail-safe). Le nom ne compte pas : un `origin` qui pointerait sur
GitHub est hors forge, un `nas` renommé reste forge.

### 2. Trois classes de remote

| Classe | Définition | Fan-out par défaut (`update`, `onboard`, `canaux --rattraper`) | Publication (`update --publier`) |
|---|---|---|---|
| `forge` | toutes URL de push forge/locales | **poussé** | reçoit la branche **et** le tag de release (référence) |
| `vitrine` | hors forge **et** nom ∈ `pushOptInRemotes` du projet | **jamais poussé** (ligne « NON alimentée », § 6) | seule voie d'écriture, sous conditions (§ 5) |
| `hors-forge` | hors forge, sans opt-in | **jamais poussé** (ligne « ignore ») | jamais |

Conséquence voulue (A5) : un projet sans opt-in ne pousse **plus jamais** sur GitHub par le CLI ;
un projet opt-in n'y pousse **que** par publication explicite.

### 3. Opt-in par projet, et seulement par projet (A3)

Clé `pushOptInRemotes` (tableau de **noms** de remotes) dans `<projet>/iakaframe.json` —
domicile canonique de la conf projet (`cli/src/lib/frame-active.js:30`). Sémantique **resserrée
par A5** : l'opt-in ne met pas le remote dans le fan-out ; il le rend **admissible à la
publication** (classe `vitrine`). Le pointeur texte `.iakaframe` (`frame-active.js:93-109`) n'est
**pas** lu pour l'opt-in. Lecture via `parseJsonFile` (`frame-active.js:34`, jamais de jet) ;
valeur absente, non tableau ou entrées non-chaînes → opt-in vide. Un nom opt-in qui désigne un
remote `forge` reste `forge` (l'opt-in est sans effet sur lui). Aucun setter CLI (édition à la main,
versionnée avec le projet).

### 4. `--remotes` restreint, il n'élargit pas (A3, A4)

`--remotes a,b,c` choisit **parmi les remotes `forge`**. Refus nommés (non poussés, exit 1 après
le fan-out des cibles retenues) :
- entrée qui n'est pas un remote configuré (y compris une URL brute) → `remote-non-configure` ;
- remote `hors-forge` → `hors-forge-sans-opt-in` ;
- remote `vitrine` → `vitrine-via-publier` (la vitrine ne s'écrit que par `--publier`).

### 5. Publication vers la vitrine : `update --publier <vX.Y.Z>` (A5, points a, b, c)

**5.1 Forme de l'accord (point c).** Nouvelle option **chaîne** `--publier <vX.Y.Z>` du seul verbe
`update` : le décideur **nomme** le tag à publier (c'est la « demande explicite »). Aucun défaut,
aucun `--yes`, aucune variable d'environnement ni clé de conf qui la déclenche ou saute la
confirmation. La publication exige **en plus** une **confirmation au terminal**, une par remote
vitrine, via les primitives existantes `peutDemander({ guide: true })` et `askYesNo`
(`cli/src/lib/interactif.js:37-51,88-93`, défaut = non).
- **Hors TTY / non interactif** (stdin ou stdout non TTY, `CI` ou `IAKA_NON_INTERACTIF` non
  neutre — les six conditions de `peutDemander`) : **refus**, exit 1, **rien n'est committé ni
  poussé** (contrôle fait avant le snapshot). Un agent ne peut donc jamais publier : son shell n'a
  pas de TTY. Message : `--publier exige l accord du decideur au terminal (session interactive) : rien n a ete committe ni pousse.`
- **Refus au terminal** par le décideur : `publication annulee par le decideur` ; le checkpoint
  (commit + forge) est conservé ; **exit 0** (c'est sa décision, pas un échec).

**5.2 Contrôles, dans cet ordre** (tous avant le snapshot, sauf mention) :
1. forme — `normalizeVersion` (`cli/src/commands/snapshot.js:93`) puis motif **strict**
   `^v\d+\.\d+\.\d+$` : les pré-versions (`-rc.1`) et métadonnées (`+build`) sont refusées (elles
   restent des gestes manuels du décideur, hors CLI) — contrôle placé **avant le routage**, comme
   `--version` ;
2. `--publier` avec `--no-push` → refus (incompatibles) ;
3. en cas de **bascule** `update`→`onboard` : `--publier` est **déclaré ignoré** (ajouté à la liste
   `ignored`, `update.js:100`), jamais transmis ; les contrôles 4 à 7 ne s'appliquent pas ;
4. au moins un remote `vitrine` configuré (opt-in présent) → sinon refus `aucune-vitrine` ;
5. le tag existe en local (`refs/tags/<tag>`) → sinon `tag-absent` ;
6. le tag est atteignable depuis la branche courante (`git merge-base --is-ancestor <tag>^{commit} HEAD`)
   → sinon `tag-hors-branche` ;
7. `peutDemander({ guide: true })` → sinon refus non interactif (§ 5.1).

Puis, **après** le checkpoint : fan-out forge de la branche (inchangé), puis push du **seul** tag
vers les mêmes cibles forge (`pousserFanout(root, 'refs/tags/<tag>', retenues)` — `pousserFanout`
n'est pas modifié, un refspec de tag passe par son argument `branche`). Si **aucune** cible forge
n'a reçu à la fois la branche et le tag → refus `forge-non-servie` (la vitrine n'est jamais en
avance sur la forge de référence), exit 1. Si l'arbre est propre, `update --publier` ne s'arrête
pas à « Rien a committer » (`update.js:115`) : il saute le commit et poursuit au push.

**5.3 Classement majeure / mineure / patch (point a).** Tranché : **comparaison au plus haut tag
semver strict déjà présent sur la vitrine**, lu en direct par
`git ls-remote --tags --refs <vitrine>` (lecture seule, ne déclenche aucun workflow). Soit
`ref = max semver` des tags de la vitrine qui matchent `^v\d+\.\d+\.\d+$` (pré-versions ignorées).
- tag déjà présent sur la vitrine → `deja-publie` (refus) ;
- pas de `ref` (vitrine sans tag de version) → `premiere` (publiable) ;
- `M > ref.M` → `majeure` ; `M = ref.M` et `m > ref.m` → `mineure` (publiables) ;
- `M.m = ref.M.m` et `p > ref.p` → `patch` ;
- sinon (tag inférieur à `ref`) → `inferieure` (refus).

Justification : (1) c'est la vitrine qui déclenche les builds, donc c'est **son** état qui dit si
une publication est nouvelle — une comparaison au tag local précédent classerait `v0.43.2` en
patch même si la vitrine n'a encore aucune 0.43 ; ici `v0.43.2` contre une vitrine à `v0.42.0` est
une **mineure** pour la vitrine (un seul build par mineure, avec les correctifs déjà inclus) ;
(2) un classement intrinsèque (`Z = 0`) ne détecterait ni le déjà-publié ni la régression ;
(3) les **tags**, pas l'API des releases : le déclencheur est le push de tag, `ls-remote` passe
par le remote git lui-même (ni `gh` ni jeton d'API), et la population des releases diffère de celle
des tags (9 tags de version pour 2 releases mesurés le 2026-09-02, `release.yml:117-120`).

Traitement par classe :
- `majeure`, `mineure`, `premiere` → confirmation (§ 5.1), question :
  `Publier <tag> (<classe>, vitrine a <ref|aucun tag>) sur <nom> (hote <hote>) ? Cela declenche le build de release GitHub. [o/N]`
- `patch` → c'est le cas (a) « demande explicite » d'un correctif : **confirmation obligatoire**,
  avec avertissement dans la question :
  `<tag> est un CORRECTIF (vitrine a <ref>) : la regle est de ne publier que les versions majeures/mineures. Publier quand meme sur <nom> et declencher le build ? [o/N]`
- `deja-publie`, `inferieure` → refus, **aucune** question, exit 1.

**5.4 Ce qui est poussé vers la vitrine (point b).** Un **seul** push, atomique, par vitrine :

`git push --atomic --no-follow-tags <vitrine> refs/heads/<branche>:refs/heads/<branche> refs/tags/<tag>:refs/tags/<tag>`

- **Tag** : uniquement le tag nommé — jamais `--tags`, jamais de suivi de tags ;
  `--no-follow-tags` **explicite** neutralise un éventuel `push.followTags=true` de l'utilisateur
  (sinon tous les tags annotés atteignables — dont les patchs accumulés — partiraient avec la
  branche, chacun déclenchant `release.yml`). Refspecs complètement qualifiés (pas d'ambiguïté
  branche/tag).
- **Branche** : la branche **courante** (tête après checkpoint), et seulement si c'est la branche
  par défaut de la vitrine, lue par `git ls-remote --symref <vitrine> HEAD` ; sinon refus
  `branche-non-vitrine` ; symref illisible → refus `branche-vitrine-inconnue` (fail-safe). Aucune
  branche de feature n'est jamais poussée vers la vitrine. Avance rapide seulement (jamais
  `--force`) : un refus non-fast-forward fait échouer **tout** le push (`--atomic`), donc le tag
  ne part pas seul.
- Échec du push → ligne nommée (motif `classerEchec`, URL jamais affichée), exit 1.

**5.5 Codes retour de `--publier`** : publication faite, ou annulée au terminal → 0 ; tout refus
(contrôles 1-2 et 4-7, `forge-non-servie`, `deja-publie`, `inferieure`, `branche-non-vitrine`,
`branche-vitrine-inconnue`, `vitrine-injoignable`, échec du push) → 1.

### 6. Projet opt-in, `update` sans `--publier` (point d, et proposition du cas b)

Push forge **seulement**. Pour chaque vitrine, **une** ligne qui contient toujours
`vitrine <nom>` et `NON alimentee`, suivie du classement du **tag candidat** = plus haut tag
semver strict atteignable depuis la branche (`git tag --merged HEAD --list 'v*'`, filtré au motif
strict), comparé à la vitrine par la même règle (§ 5.3, lecture `ls-remote` bornée à
`min(--timeout, 10 s)`) :
- `patch` → `i vitrine <nom> NON alimentee : <tag> est un correctif (vitrine a <ref>), pas de publication GitHub pour un patch.`
- `majeure`/`mineure`/`premiere` → `i vitrine <nom> NON alimentee : <tag> = version <classe> (vitrine a <ref|aucun tag>), publiable par le decideur : iakaframe update --publier <tag>`
- `deja-publie`/`inferieure` → `i vitrine <nom> NON alimentee : <tag> deja couvert par la vitrine (<ref>).`
- aucun tag candidat → `i vitrine <nom> NON alimentee : aucun tag de release vX.Y.Z sur la branche.`
- vitrine injoignable → `i vitrine <nom> NON alimentee : classement impossible (vitrine injoignable).`

Ces lignes sont informatives : le code retour de `update` n'en dépend pas (0 hors refus § 4).

### 7. Une seule sélection, appliquée aux trois chemins de push

`resoudreCibles(root, demandes)` sert `update`, `onboard`, `canaux`. `pousserFanout`, `rattraper`,
`mesurerCanal`, `classerEchec` restent inchangés : le filtre s'applique en amont.
- `onboard` ne pousse **que** les `forge` ; il n'a pas `--publier`.
- `canaux` : mesure les `forge` **et** les `vitrine` (lecture seule, utile pour voir le retard de
  la vitrine) ; `--rattraper` n'agit **que** sur les `forge` — les vitrines reçoivent l'action
  `hors-rattrapage` (motif `vitrine : publication via iakaframe update --publier`) ; les
  `hors-forge` sont listés, non mesurés.

### 8. Opt-in des quatre dépôts vitrine (dans le lot, A5)

`{ "pushOptInRemotes": ["github"] }` dans `iakaframe.json` de : iakaframe (nouveau fichier),
iakaFrameGUI (nouveau), IakaCockpit (nouveau), iakaInstall (existant, `{"frame":"iakaframe"}` :
clé **ajoutée**, `frame` conservée). Les trois dépôts frères sans `iakaframe.json` ont un pointeur
legacy `.iakaframe` : un `iakaframe.json` sans clé `frame` laisse `readActiveFramePointer`
retomber sur `.iakaframe` (`frame-active.js:47-55`) — aucun changement de frame active. La GUI
préserve les clés inconnues à l'écriture (`iakaFrameGUI/src-tauri/src/project_conf.rs:60-84`).
Les quatre dépôts portent bien un remote nommé `github` (refs `refs/remotes/github/*` présentes).

### Recensement des chemins de push du CLI (grep `push` / `remotes` dans `cli/src/`)

| Chemin | Emplacement | Pousse ? | Périmètre |
|---|---|---|---|
| `update` (checkpoint) | `cli/src/commands/update.js:127-136` → `pousserFanout` `cli/src/lib/canaux.js:75-85` | oui, tous les remotes | **inclus** (+ `--publier`) |
| `onboard` (étape 5/5) | `cli/src/commands/onboard.js:165-174` → `pousserFanout` | oui, tous les remotes (`-u origin`) | **inclus** |
| bascule `update`→`onboard` / `onboard`→`update` | `update.js:88-103`, `onboard.js:77-89` | via les deux ci-dessus | couvert par construction (`--publier` déclaré ignoré) |
| `canaux --rattraper` | `cli/src/commands/canaux.js:74-83` → `rattraper` `cli/src/lib/canaux.js:215-239` (`push` l.220) | oui, remotes en retard | **inclus** |
| `canaux` (mesure seule) | `canaux.js:82` → `mesurerCanal` (`ls-remote`, `fetch`) | non (lecture) | inclus (§ 7) |
| `repo` | `cli/src/commands/repo.js:103-107` | non (`remote add/set-url` sur `origin` forge) | exclu (ne pousse pas) |
| `snapshot`, `forgejo.js` (API) | — | non | exclu |

Aucun script `.ps1`/`.sh` du dépôt ne pousse (grep vide). Le CLI ne pousse aujourd'hui **aucun
tag** (grep `tag` dans `cli/src/` : aucun `push` de tag) ; les tags de release sont posés et poussés
à la main par le décideur (`docs/releases/v0.41.0.md:3-5,18-23`).

## Périmètre

- **Inclus**
  - Fonctions de classification et de sélection dans `cli/src/lib/canaux.js` (3 classes, lecture
    de l'opt-in, résolution des URL de push).
  - Nouveau module `cli/src/lib/vitrine.js` : classement de publication, tag candidat, lecture de
    la vitrine, push de publication, orchestration injectable, message par défaut.
  - Export des hôtes de forge connus depuis `cli/src/lib/forgejo.js`.
  - Application dans `update` (sélection + `--publier`), `onboard`, `canaux` (mesure + `--rattraper`).
  - Ajout de `--publier <vX.Y.Z>` au registre des verbes (`cli/src/lib/verbes.js:76`).
  - Textes `--help` des trois verbes, `cli/README.md`, `methode-de-travail.md`, skill
    `iakaframe-update`, `CLAUDE.md` global du kit.
  - Opt-in `github` des quatre dépôts vitrine (§ 8) : un commit par dépôt.
  - Nouveaux fichiers de tests + non-régression de la suite complète.
- **Exclu (explicite)**
  - **HORS LOT — rotation des tokens Forgejo exposés** (tokens en clair dans les URL de remotes des
    `.git/config`) : aucun geste sur les tokens ni sur les `.git/config` dans ce lot ; sujet à
    traiter séparément (procédure secrets / Vaultwarden).
  - **HORS LOT — inventaire des ~45 remotes `github`** de `~/work` (retrait, conservation ou
    opt-in) : aucun geste ; par construction ils cessent de recevoir dès que le nouveau CLI est
    installé. Inventaire à décider séparément.
  - Aucune action sur les dépôts GitHub existants (ni suppression, ni visibilité, ni purge) ;
    **aucune** purge d'historique naonedge ; aucune suppression de branches déjà poussées sur GitHub.
  - Aucune modification des remotes d'aucun projet.
  - Aucune **publication réelle** (aucun tag poussé vers GitHub, aucun `gh workflow run`) : la
    première publication par `--publier` est un acte du décideur, hors lot.
  - Aucun setter CLI de l'opt-in (`iakaframe config ...`), aucun opt-in portefeuille ni par
    variable d'environnement ; aucun `--yes` ni contournement de la confirmation.
  - Aucune autre nouvelle option que `--publier` ; pas de `--publier` sur `onboard` ni `canaux`.
  - Publication de pré-versions (`-rc`) par le CLI.
  - Pas de modification de `pousserFanout`, `rattraper`, `mesurerCanal`, `classerEchec`,
    `peutDemander`, `askYesNo`, ni des workflows `.github/`.
  - Pas de modification des copies figées ou générées : `frames/releases/**`, `cli/_bundled/**`
    (régénéré par `scripts/bundle.js`), `.claude/worktrees/**`, `~/.claude/skills/**`,
    `~/.claude/CLAUDE.md` (la source est le kit).
  - Pas de réconciliation du reste de `cli/src/lib/verbes.js:76` (`--remotes`/`--timeout` déjà
    absents : dérive préexistante) — seul `--publier` y est ajouté.
  - Bump de version du CLI et installation sur les postes : procédure de release habituelle (G1/G5),
    hors lot.

## Étapes d'implémentation

1. **`cli/src/lib/forgejo.js`** — `export function hotesForge()` : `Set` des hostnames
   (minuscules) de `DEF_URLS` ∪ `cfgList().map(c => c.url)`. URL non parsable → ignorée. Aucun
   token lu, aucun appel réseau.
2. **`cli/src/lib/canaux.js`** (après `listerRemotes`, l. 52-56) :
   - `hoteDeUrl(url)` **pure** → `{ local: true }` | `{ local: false, hote }` (`''` si illisible).
     Règles, dans l'ordre : `^[A-Za-z]:[\\/]` → local ; `^[a-z][a-z0-9+.-]*://` → `new URL`
     (`file:` → local, sinon `hostname` minuscules, credentials jamais conservés) ; forme scp
     `^(?:[^@/]+@)?([^:/]+):` → hôte = groupe 1 ; sinon → local.
   - `classerRemote(urls, hotes)` **pure** → `'forge'` si `urls.length > 0` et chaque URL locale
     ou d'hôte ∈ `hotes`, sinon `'hors-forge'`.
   - `urlsDePush(cwd, nom)` → `gitBorne(cwd, ['remote','get-url','--push','--all',nom])` ; échec →
     `[]`. URL jamais affichées.
   - `lireOptIn(root)` → noms depuis `iakaframe.json` clé `pushOptInRemotes` (via `parseJsonFile`
     + `PROJECT_CONF`), filtrés aux chaînes non vides.
   - `selectionnerCibles({ configures, classes, optIn, demandes })` **pure** → `{ retenues,
     vitrines: [{nom,hote}], ecartees: [{nom,hote,motif}], refusees: [{nom,hote,motif}] }` :
     défaut : `forge` → retenu ; `hors-forge` ∧ ∈ optIn → `vitrines` ; sinon → `ecartees`
     (`hors-forge-sans-opt-in`). Explicite (ordre de la demande, dédoublonné) : non configuré →
     `refusees` `remote-non-configure` ; `forge` → retenu ; vitrine → `refusees`
     `vitrine-via-publier` ; sinon → `refusees` `hors-forge-sans-opt-in`. Les `vitrines` sont
     calculées dans les deux modes (pour le § 6 et `canaux`).
   - `resoudreCibles(root, demandes)` (impure, assemble les précédentes).
   - `formaterEcarts({ ecartees, refusees })` **pure** — une ligne par remote :
     `  i <nom> ignore (hors forge self-hosted, hote <hote|inconnu>)` et
     `  ! <nom> REFUSE : <motif> (hote <hote|inconnu>)`. Aucune URL, aucun token.
3. **`cli/src/lib/vitrine.js`** (nouveau, zéro dépendance, `gitBorne` de `canaux.js`) :
   - `SEMVER_RELEASE = /^v(\d+)\.(\d+)\.(\d+)$/`, `parseSemver(tag)` et `plusHautSemver(tags)` **pures**.
   - `classerPublication(tag, tagsVitrine)` **pure** → `{ classe, reference }`,
     `classe ∈ majeure|mineure|premiere|patch|deja-publie|inferieure` (§ 5.3).
   - `tagCandidat(cwd)` → plus haut tag strict de `git tag --merged HEAD --list 'v*'`, `''` sinon.
   - `lireVitrine(cwd, remote, { timeoutMs })` → `{ ok, tags, head, motif }` via
     `ls-remote --tags --refs <remote>` et `ls-remote --symref <remote> HEAD` (`head` =
     `refs/heads/<x>` ou `''`) ; échec → `ok:false`, motif `classerEchec`.
   - `publierVitrine(cwd, remote, branche, tag, { timeoutMs })` → le push exact du § 5.4
     (`--atomic --no-follow-tags`, deux refspecs qualifiés) ; rend `{ ok, motif, detail }`.
   - `executerPublication({ tag, branche, vitrines, forgeServie, lire, demander, pousser })` —
     orchestration **à dépendances injectées** (calque du patron `ask`/`yes` injectés,
     `cli/src/commands/models.js:526`) : pour chaque vitrine, `lire` → classement → refus ou
     `demander(question)` → `pousser`. Rend `{ resultats: [{ nom, hote, classe, reference,
     verdict: 'publie'|'annule'|'refus'|'echec', motif }], exitCode }`. `forgeServie === false` →
     tout en refus `forge-non-servie` sans appeler `lire`/`demander`/`pousser`.
   - `formaterVitrineDefaut({ nom, hote, candidat, classement, lectureOk })` **pure** → la ligne
     du § 6.
4. **`cli/src/commands/update.js`** :
   - `options` : `publier: { type: 'string' }` ; `USAGE` : remplacer la ligne `--remotes` (l. 26)
     par `--remotes <a,b,c>  Cibles du push, parmi les remotes des forges self-hosted (defaut : toutes, origin d'abord ; GitHub et hors forge : jamais)`
     et ajouter `--publier <vX.Y.Z>  Publie ce tag de release (+ la branche) sur la vitrine opt-in (iakaframe.json "pushOptInRemotes") : version majeure/mineure, accord du decideur au terminal ; patch = confirmation renforcee ; jamais en non-interactif`.
   - Contrôle 1 (§ 5.2) juste après celui de `--version` (l. 76-77) ; contrôle 2 ensuite ;
     `'publier'` ajouté à `ignored` (l. 100) ; contrôles 4-7 après le routage, avant le snapshot
     (l. 107).
   - l. 115 : si `--publier` et arbre propre → pas de commit, on poursuit.
   - l. 127-136 : `resoudreCibles(root, values.remotes ? splitCanaux(values.remotes) : null)` ;
     `formaterEcarts` avant `[3/3] Push sur ...` ; aucune retenue →
     `[3/3] Aucun remote eligible (forge self-hosted) : push ignore, le commit n existe que localement.` ;
     sans `--publier` : une ligne `formaterVitrineDefaut` par vitrine ; avec `--publier` : push du
     tag vers les retenues (`pousserFanout(root, 'refs/tags/'+tag, retenues)`), calcul de
     `forgeServie`, puis `executerPublication` câblée sur `lireVitrine`, `askYesNo`,
     `publierVitrine` ; affichage d'une ligne par vitrine (`[OK] <nom> <- <branche> + <tag>` /
     `! <nom> REFUSE : <motif>` / `  <nom> : publication annulee par le decideur`).
   - `process.exitCode = 1` si `refusees.length > 0` ou si `executerPublication` rend 1, **après**
     les pushes.
5. **`cli/src/commands/onboard.js`** l. 165-174 — `resoudreCibles(root, null)` ; écarts affichés ;
   les vitrines sont signalées par la ligne `i <nom> ignore (vitrine : publication via iakaframe update --publier)` ;
   message « aucun remote éligible » ; `amont: 'origin'` conservé. `USAGE` (l. 18-36) : ajouter
   `Le push ne vise que les remotes des forges self-hosted (GitHub/vitrine : jamais a l onboarding).`
6. **`cli/src/commands/canaux.js`** l. 74-94 — `resoudreCibles(root, demandes)` ; mesure sur
   `retenues ∪ vitrines` ; `rattraper` reçoit la mesure **filtrée aux retenues** ; lignes
   `hors-rattrapage` pour les vitrines ; `hors-forge` listés non mesurés ; aucune cible → `fail(...)`
   `aucun remote eligible dans <root> (forge self-hosted)` ; JSON : ajouter `vitrines`, `ecartees`,
   `refusees` aux métadonnées de `collection(...)` ; refus explicite → exit 1. `USAGE` l. 31 : même
   sens que `update`.
7. **`cli/src/lib/verbes.js:76`** — ajouter `'--publier <vX.Y.Z>'` aux options d'`update`.
8. **Doc** (textes exacts laissés à l'exécutant, sens imposé) :
   - `cli/README.md:43-51` : fan-out = forges self-hosted ; GitHub = vitrine opt-in, écrite
     seulement par `update --publier <vX.Y.Z>` (majeure/mineure, accord au terminal, un seul tag) ;
     remplacer l'exemple `--remotes origin,github` (l. 45) par `--remotes origin,nas`.
   - `methode-de-travail.md:773-788` (§ Git par défaut) : paragraphe « GitHub n'est pas un remote
     de la méthode : le CLI ne pousse que vers les forges self-hosted ; seuls les dépôts vitrine
     (opt-in `iakaframe.json` → `pushOptInRemotes`) publient sur GitHub, par `update --publier`,
     pour une version majeure/mineure, avec l'accord du décideur », date et motif (incident naonedge
     du 2026-09-26, sans détail sur les données) ; `:848-851` : « push vers les forges self-hosted ».
   - `library/skills/iakaframe-update/SKILL.md:29-30` : `--remotes`, `--publier`, règle
     d'éligibilité ; § Garde-fous (l. 46-56) : « jamais de push hors forge self-hosted ; un agent ne
     lance jamais `--publier` (acte du décideur, refusé hors TTY) ; ne pas contourner par
     `git push github` à la main » ; l. 38-39 : `git push origin` explicite au lieu de `git push` nu.
   - `kits/iakaframe-claude/global/CLAUDE.md:74-86` : une phrase après le § Forgejo LAN : GitHub
     hors méthode, vitrine opt-in publiée par `update --publier` avec accord du décideur.
9. **Opt-in des quatre dépôts** (§ 8) : dans chaque dépôt, uniquement si l'arbre est sur `main`
   et que `iakaframe.json` n'a pas de modification en cours (sinon : ne rien faire, le signaler au
   gate) — éditer le fichier, `git add iakaframe.json` **seul**, commit
   `chore(iakaframe): opt-in vitrine github (publication des releases)`, `git push origin main`
   **explicite**. Jamais `iakaframe update` (qui ferait `git add -A` sur l'arbre d'un dépôt frère),
   jamais `git push` nu, jamais `git push github`.
10. **Tests** : `cli/test/remotes-eligibles.test.js` et `cli/test/vitrine.test.js` (nouveaux ;
    `node --test`, `node:assert/strict`, calque des bancs `cli/test/canaux-fanout.test.js` et
    `cli/test/switch-flags-guard.test.js` : bare repos locaux, fausse forge `node:http` sur
    `127.0.0.1` avec la **même garde** `FORGEJO_URL` 127.0.0.1, `getStatus = 200`). **Règle de
    sûreté du banc** : toute URL hors forge des tests de commande a un hôte en `.invalid`
    (RFC 2606) ; `github.com` n'apparaît **que** dans les tests de fonctions pures ; les tests de
    `publierVitrine` passent un **bare local** directement en argument `remote` (la fonction ne
    classe pas) ; aucun test ne touche le réseau réel.
11. `npm test` dans `cli/` (suite complète), puis commits atomiques (lib, vitrine, commandes,
    tests, doc, puis un commit d'opt-in par dépôt) en conventional commits.

## Fichiers concernés

- `cli/src/lib/forgejo.js:20,82` — nouvel export `hotesForge()`.
- `cli/src/lib/canaux.js:44-56` — `hoteDeUrl`, `classerRemote`, `urlsDePush`, `lireOptIn`,
  `selectionnerCibles`, `resoudreCibles`, `formaterEcarts`.
- `cli/src/lib/vitrine.js` — **nouveau**.
- `cli/src/commands/update.js:26,56-137` — sélection, `--publier`, écarts, lignes vitrine, codes
  retour, `USAGE`.
- `cli/src/commands/onboard.js:18-36,165-174` — sélection + écarts + `USAGE`.
- `cli/src/commands/canaux.js:31,74-94` — sélection, vitrines mesurées non rattrapées, JSON, `USAGE`.
- `cli/src/lib/verbes.js:76` — ajout de `--publier <vX.Y.Z>`.
- `cli/test/remotes-eligibles.test.js`, `cli/test/vitrine.test.js` — **nouveaux**.
- `cli/README.md:43-51` — doc du fan-out et de la publication.
- `methode-de-travail.md:773-788,848-851` — règle de méthode.
- `library/skills/iakaframe-update/SKILL.md:29-30,38-39,46-56` — procédure + garde-fous.
- `kits/iakaframe-claude/global/CLAUDE.md:74-86` — règle globale du kit.
- `iakaframe.json` (racine d'iakaframe) — **nouveau**, `{ "pushOptInRemotes": ["github"] }`.
- `/Users/sjupin/work/iakaFrameGUI/iakaframe.json` — **nouveau**, idem.
- `/Users/sjupin/work/IakaCockpit/iakaframe.json` — **nouveau**, idem.
- `/Users/sjupin/work/iakaInstall/iakaframe.json:1-3` — clé `pushOptInRemotes` ajoutée, `frame` conservée.

## Risques

- **Régression silencieuse d'un miroir légitime** (ex. `nas` si `FORGEJO_URL` ne liste que le VPS)
  → union `DEF_URLS` ∪ `cfgList()` ; chaque écart est nommé en sortie.
- **Contournement par l'URL** (`pushurl`, `pushInsteadOf`, URL brute dans `--remotes`) →
  classification sur `get-url --push --all` + refus des noms non configurés ; tests dédiés.
- **Rafale de builds par les tags accumulés** (`push.followTags`, `--tags`) → un seul refspec de
  tag + `--no-follow-tags` explicite ; test contrefactuel avec `push.followTags=true`. Note : GitHub
  ne crée **aucun** événement quand plus de trois tags sont poussés d'un coup (cf. Sources) — un
  push massif ne serait donc pas seulement coûteux, il serait aussi **muet** ; raison de plus pour
  un tag unique.
- **Publication par un agent** → refus en non-interactif avant tout geste (`peutDemander`, six
  conditions) ; aucune option ni variable ne saute la confirmation ; garde-fou écrit dans la skill.
- **Vitrine en avance sur la forge, ou tag seul sans branche** → publication conditionnée au
  service forge (branche + tag) ; push atomique vers la vitrine.
- **Fuite de token dans les nouveaux messages** → nom + hostname seulement ; test de forme
  `user:secret@` absent de la sortie (calque `canaux-fanout.test.js:152-154`).
- **Gardes existantes qui rougissent** (`help-systemique.test.js`, `guard-json-couverture.test.js`,
  `test/fixtures/couverture-options.json`, `guard-guidage-autorite.test.js` — G3b : aucun nouveau
  lecteur `readline`, on réutilise `askYesNo`) → si une garde rougit sur un texte ou l'ajout de
  `--publier`, ajuster la fixture **dans ce lot** et le déclarer au gate, jamais affaiblir la garde.
- **Fenêtre d'exposition** : la protection n'agit sur un poste qu'une fois le CLI **installé** en
  version livrée ; d'ici là, l'ancien CLI continue de pousser `github` par défaut → à signaler au
  décideur au gate (bump + installation hors lot, à enchaîner vite).
- **Écriture dans trois dépôts frères** (opt-in) → fichier unique, `git add` ciblé, push `origin`
  explicite, abstention si l'arbre n'est pas sur `main` ou si le fichier est modifié.
- **Windows** : chemins `C:\...` classés en local par règle explicite ; non testable sur macOS
  au-delà de la fonction pure.

## Critères d'acceptation

Sélection — fonctions pures (`cli/test/remotes-eligibles.test.js`) :
- [ ] CA-1 `hoteDeUrl` : `https://sjupin:tok@git.naonedge.com/sjupin/x.git` → `git.naonedge.com` ;
  `git@github.com:iakasju/x.git` → `github.com` ; `ssh://git@github.com/a/b` → `github.com` ;
  `/tmp/bare`, `../bare`, `file:///tmp/bare`, `C:\depots\bare`, `C:/depots/bare` → local ; aucune
  valeur rendue ne contient le token.
- [ ] CA-2 `classerRemote` : hôte connu → `forge` ; `github.com` → `hors-forge` ; hôte inconnu →
  `hors-forge` ; liste vide → `hors-forge` ; deux URL dont une hors forge → `hors-forge`.
- [ ] CA-3 défaut sans opt-in : `origin`(forge), `nas`(forge), `github`(hors) → retenues
  `[origin, nas]`, `github` en `ecartees` motif `hors-forge-sans-opt-in`, `vitrines` vide.
- [ ] CA-4 défaut avec opt-in `['github']` → retenues `[origin, nas]` (github **absent**),
  `vitrines` = `[{ nom: 'github', hote: 'github.com' }]`, `ecartees` vide.
- [ ] CA-5 explicite : `['origin','github']` sans opt-in → retenues `[origin]`, `github` refusé
  `hors-forge-sans-opt-in` ; **avec** opt-in → `github` refusé `vitrine-via-publier` ;
  `['https://x.invalid/y.git']` → refusé `remote-non-configure`.
- [ ] CA-6 `hotesForge()` contient `git.naonedge.com`, `192.168.1.139`, `192.168.2.11` même quand
  `FORGEJO_URL` ne vaut que `http://127.0.0.1:<port>`, et contient aussi `127.0.0.1`.

Publication — fonctions (`cli/test/vitrine.test.js`) :
- [ ] CA-7 `classerPublication` avec vitrine `{v0.40.0, v0.41.0, v0.41.3, v0.42.0, v0.43.0-rc.1}` :
  `v1.0.0` → `majeure` ; `v0.43.0` → `mineure` (la pré-version est ignorée comme référence) ;
  `v0.43.2` → `mineure` ; `v0.42.1` → `patch` ; `v0.42.0` → `deja-publie` ; `v0.41.5` →
  `inferieure` ; vitrine vide + `v0.1.0` → `premiere` ; `reference` = `v0.42.0` dans les cas non vides.
- [ ] CA-8 forme de `--publier` : `v0.43.0` et `0.43.0` acceptés (→ `v0.43.0`) ; `v0.43.0-rc.1`,
  `v0.43.0+b1`, `v0.43`, `derniere` refusés.
- [ ] CA-9 `tagCandidat` : dépôt avec `v0.42.0`, `v0.42.1`, `v0.43.0-rc.1` sur `main` et `v0.50.0`
  sur une autre branche → `v0.42.1` ; dépôt sans tag → `''`.
- [ ] CA-10 **un seul tag** : dépôt local avec `push.followTags=true`, tags **annotés** `v0.42.0`,
  `v0.42.1`, `v0.43.0` atteignables ; `publierVitrine(cwd, <bare local>, 'main', 'v0.43.0')` →
  `git ls-remote --refs <bare>` liste **exactement** `refs/heads/main` et `refs/tags/v0.43.0`.
  Contrefactuel dans le même test : le même push **sans** `--no-follow-tags` pousse aussi
  `v0.42.0`/`v0.42.1` (preuve que l'option est porteuse).
- [ ] CA-11 **atomicité** : `main` du bare divergente (non fast-forward) → `publierVitrine` rend
  `ok:false` et `refs/tags/v0.43.0` est **absent** du bare.
- [ ] CA-12 `executerPublication` (dépendances injectées, compteurs d'appels) :
  (i) `mineure` + `demander → true` → `pousser` appelé une fois avec `(nom, 'main', 'v0.43.0')`,
  verdict `publie`, exitCode 0 ; (ii) `demander → false` → `pousser` jamais appelé, verdict
  `annule`, exitCode 0 ; (iii) `deja-publie` et `inferieure` → ni `demander` ni `pousser`, refus,
  exitCode 1 ; (iv) `lire` en échec → refus `vitrine-injoignable`, exitCode 1 ; (v) `head` =
  `refs/heads/main` et branche `feat/x` → refus `branche-non-vitrine` ; `head` vide → refus
  `branche-vitrine-inconnue` ; (vi) `forgeServie: false` → refus `forge-non-servie`, `lire`,
  `demander`, `pousser` jamais appelés ; (vii) `patch` → `demander` appelé avec une question qui
  contient `CORRECTIF` ; `mineure` → question qui contient `declenche le build`.
- [ ] CA-13 `formaterVitrineDefaut` : chaque variante contient `vitrine github` et `NON alimentee` ;
  `patch` contient `correctif` et **pas** `--publier` ; `mineure` contient
  `iakaframe update --publier v0.44.0` ; injoignable contient `classement impossible`.

Bout en bout (`update` via `runCli` — donc **sans TTY** —, fausse forge 127.0.0.1, bare locaux) :
- [ ] CA-14 **nominal** : `origin` et `nas` = bare locaux → les deux reçoivent ; aucune ligne
  `ignore` ; exit 0.
- [ ] CA-15 **github ignoré (projet sans opt-in)** : `origin` = bare, `github` =
  `https://hors-forge.invalid/x.git` → `origin` reçoit ; sortie contient `github ignore` et
  `hors-forge.invalid` ; **aucune** ligne `[OK] github` ni `[--] github` ; exit 0.
- [ ] CA-16 **remote inconnu non-github** : `backup` = `https://autre-forge.invalid/x.git` → même
  traitement que CA-15.
- [ ] CA-17 **projet opt-in, update par défaut (point d)** : `iakaframe.json` =
  `{"pushOptInRemotes":["github"]}`, `github` = `https://hors-forge.invalid/x.git`, tag `v0.42.1`
  sur `main` → `origin` reçoit ; **aucune** ligne `[OK] github` / `[--] github` (aucun push tenté) ;
  une ligne contient `vitrine github` et `NON alimentee` (ici `classement impossible`) ; exit 0.
- [ ] CA-18 **`--remotes` vers GitHub** : `--remotes origin,github` sans opt-in → `origin` reçoit,
  `github REFUSE` motif `hors-forge-sans-opt-in`, exit 1 ; **avec** opt-in → `github REFUSE` motif
  `vitrine-via-publier`, aucun push tenté vers `github`, exit 1.
- [ ] CA-19 **URL brute** : `--remotes https://hors-forge.invalid/x.git` → refusée
  (`remote-non-configure`), rien poussé, exit 1.
- [ ] CA-20 **aucun remote éligible** : seul `github` (hors forge) configuré → commit local créé,
  message `Aucun remote eligible`, aucun push tenté, exit 0.
- [ ] CA-21 **anti-contournement `pushurl`** : `origin` url = bare local, `pushurl` =
  `https://hors-forge.invalid/x.git` → `origin` écarté.
- [ ] CA-22 **anti-contournement `pushInsteadOf`** : `origin` url =
  `https://git.naonedge.com/sjupin/x.git` + `url."https://hors-forge.invalid/".pushInsteadOf "https://git.naonedge.com/"`
  (config locale du dépôt de test) → `origin` écarté, aucun push tenté.
- [ ] CA-23 **`--publier` hors TTY (point c)** : projet opt-in, tag `v0.43.0` sur `main`,
  modification en cours dans l'arbre → `update --publier v0.43.0` : exit 1, message contient
  `accord du decideur au terminal` ; `HEAD` **inchangé** (aucun commit), bare `origin`
  **inchangé** (aucun push), aucune ligne `github`. Idem avec `CI=1` et avec `IAKA_NON_INTERACTIF=1`.
- [ ] CA-24 **contrôles amont de `--publier`** (chacun : exit 1, `HEAD` et `origin` inchangés) :
  `--publier v0.43.0-rc.1` (forme) ; `--publier v0.43.0 --no-push` (incompatibles) ; projet
  **sans** opt-in → `aucune-vitrine` ; `--publier v9.9.9` → `tag-absent` ; tag posé sur une autre
  branche seulement → `tag-hors-branche`. Ces refus précèdent le refus non interactif (ordre § 5.2).
- [ ] CA-25 **bascule** : `update --publier v0.43.0` sur un dossier sans git → bascule `onboard`,
  ligne `--publier` déclaré `ignorees`, aucune ligne `github` de push.
- [ ] CA-26 **secret** : dans CA-15 à CA-25, la sortie ne matche jamais
  `/:\/\/[^\s/@:]+:[^\s/@*]+@/`.

Autres chemins :
- [ ] CA-27 **onboard** : dépôt avec `github` `.invalid` préexistant, avec **et** sans opt-in →
  ligne `github ignore`, aucune ligne `[..] github` de push.
- [ ] CA-28 **canaux** : `origin` bare + `github` `.invalid` **opt-in** → `github` mesuré (ligne
  d'état `injoignable`), jamais rattrapé (action `hors-rattrapage` sous `--rattraper`, qui n'agit
  que sur `origin`) ; `--json` expose `vitrines: [{ nom: 'github', hote: 'hors-forge.invalid' }]`.
  Sans opt-in → `github` listé ignoré, **non mesuré**, `ecartees` =
  `[{ nom: 'github', hote: 'hors-forge.invalid', motif: 'hors-forge-sans-opt-in' }]`.
- [ ] CA-29 **garde du banc** : un test vérifie que toute URL hors forge des tests de commande a
  un hôte `.invalid` (calque `canaux-fanout.test.js:159-164`).

Non-régression, doc, opt-in :
- [ ] CA-30 `npm test` dans `cli/` : suite complète verte, **y compris** `canaux-fanout.test.js`,
  `canaux-verbe.test.js`, `switch-flags-guard.test.js`, `guard-guidage-autorite.test.js`
  (aucun `readline` hors `lib/interactif.js`/`lib/guidage.js`).
- [ ] CA-31 `update --help` mentionne `--publier <vX.Y.Z>`, `majeure/mineure`, `accord` et
  `pushOptInRemotes` ; `onboard --help` et `canaux --help` énoncent la règle forge ; plus aucune
  mention `TOUS les remotes configures` dans `cli/src/` (grep vide) ; `verbes.js` liste
  `--publier <vX.Y.Z>` pour `update`.
- [ ] CA-32 `cli/README.md` ne contient plus `--remotes origin,github` ; `methode-de-travail.md`,
  `library/skills/iakaframe-update/SKILL.md` et `kits/iakaframe-claude/global/CLAUDE.md` énoncent
  « GitHub hors méthode ; vitrine opt-in publiée par `update --publier`, majeure/mineure, accord du
  décideur » ; la skill interdit à un agent de lancer `--publier`.
- [ ] CA-33 Aucun fichier modifié sous `frames/releases/`, `cli/_bundled/`, `.claude/worktrees/`,
  `.github/` (vérifié par `git diff --stat`).
- [ ] CA-34 **opt-in des quatre dépôts** : `iakaframe.json` d'iakaframe, iakaFrameGUI, IakaCockpit
  et iakaInstall contient `"pushOptInRemotes": ["github"]` ; celui d'iakaInstall garde
  `"frame": "iakaframe"` ; `readActiveFramePointer(<dépôt>)` rend la même valeur avant et après
  dans les quatre (one-liner `node` montré au gate) ; dans chaque dépôt frère, `git show --stat HEAD`
  ne liste **que** `iakaframe.json` et le commit est présent sur `origin` ; aucun push vers `github`.

## Estimation (au jalon P1→P2)

- **Équivalent jour-homme** : **~2 j-h** (fourchette 1,5 – 2,75) : sélection 3 classes + 3
  commandes ≈ 0,4 ; module `vitrine.js` (classement, lecture, push atomique, orchestration
  injectée) + câblage `--publier` ≈ 0,5 ; tests (34 CA, dont contrefactuels git réels) ≈ 0,7 ;
  doc (5 fichiers) ≈ 0,15 ; opt-in 4 dépôts ≈ 0,05 ; gate et ajustement de gardes ≈ 0,2.
  (Estimation initiale ~1 j-h : le doublement vient entièrement de la publication vitrine, A5.)
- **Complexité / risque** : complexité **moyenne** ; risque **moyen** — changement du défaut d'un
  geste de sauvegarde quotidien sur trois chemins, plus un nouveau geste de publication qui
  déclenche des builds publics ; enjeu de confidentialité (un filtre trop large refait l'incident,
  trop strict prive un miroir) et de coût CI (un tag de trop = un build).
- **Inconnues** : (a) gardes existantes sensibles aux textes d'aide, au registre des verbes ou à la
  forme JSON de `canaux` ; (b) `git remote get-url --push --all` sur les versions de git des postes
  (Windows notamment) ; (c) `ls-remote --symref` sur GitHub en HTTPS avec credential dans l'URL
  (attendu standard, non mesuré dans ce cadrage) ; (d) état des arbres des trois dépôts frères au
  moment du commit d'opt-in (branche, modifications en cours).

## Points ouverts pour le décideur

Aucun point structurant ne reste ouvert : les points 1 à 5 du premier cadrage sont tranchés
(§ « Arbitrages »), l'ancien point 6 (suite des ~45 dépôts) est déclaré **hors lot** (§ Périmètre).
Choix de cadrage faits dans le cadre de A5, à contester au jalon si besoin :
- classement par comparaison au **plus haut tag de la vitrine** (§ 5.3) ;
- l'option **nomme** le tag (`--publier <vX.Y.Z>`) ; un patch reste publiable sur cette demande
  explicite, avec confirmation renforcée (texte `CORRECTIF`) ;
- refus au terminal = exit 0 ; refus non interactif = exit 1, avant tout commit ;
- la clé garde le nom `pushOptInRemotes`, avec la sémantique resserrée « remote vitrine admissible
  à la publication ».

## Sources (vérifiées le 2026-09-27)

- Git, `git remote get-url` : « `--push` : push URLs are queried rather than fetch URLs » ;
  « `--all` : all URLs for the remote will be listed » ; « Configurations for `insteadOf` and
  `pushInsteadOf` are expanded here. » — https://git-scm.com/docs/git-remote
- Git, `git push` : `--atomic` « Either all refs are updated, or on error, no refs are updated. If
  the server does not support atomic pushes the push will fail. » ; `--follow-tags` « also push
  annotated tags in `refs/tags` that are missing from the remote but are pointing at commit-ish
  that are reachable from the refs being pushed. This can also be specified with configuration
  variable `push.followTags`. » — https://git-scm.com/docs/git-push
- Git, `git ls-remote` : `--refs` « Do not show peeled tags or pseudorefs like `HEAD` » ;
  `--symref` « show the underlying ref pointed by it when showing a symbolic ref. Currently,
  upload-pack only shows the symref HEAD » — https://git-scm.com/docs/git-ls-remote
- Git, `git tag --merged [<commit>]` : « Only list tags whose commits are reachable from
  <commit> (`HEAD` if not specified). » — https://git-scm.com/docs/git-tag
- GitHub Docs, événement `push` : « Events will not be created for tags when more than three tags
  are pushed at once. » —
  https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub prend en charge les pushs atomiques depuis git 2.4 —
  https://github.blog/open-source/git/git-2-4-atomic-pushes-push-to-deploy-and-more/
- RFC 2606 (TLD `.invalid` garanti non résoluble), déjà invoquée par le banc existant
  `cli/test/canaux-fanout.test.js:26-36`.
