# Contrefactuel du vol de `latest` — prouver la branche qui n'a jamais tourné

> Cadré par 🔵 **Gandalf** le **2026-08-29**. Successeur nommé et **explicitement dû** par
> `iakaframe/specs/instructions/installer-depuis-rien.md` (**L42**, § Critères d'acceptation →
> **CA-5**, ligne ~546). Le run `33273513846` (tag `v0.32.2`, `event: push`, 6 jobs verts) a prouvé
> CA-12 et CA-13 ; il n'a **pas** prouvé CA-5, et le dire prouvé serait faux.
>
> **Tous les chiffres et comportements ci-dessous ont été mesurés ou lus le 2026-08-29** : lecture
> sur le disque, appels **anonymes** à l'API GitHub publique, et lecture de la **source de
> `tauri-action` au SHA épinglé**. Ce que le relevé reçu affirme et que la mesure **contredit** est
> en § Rectifications — **six points, dont trois changent la conception de l'expérience**.
>
> **Ce lot ne livre pas une fonctionnalité.** Il livre une **preuve**, ou l'aveu écrit qu'elle
> n'a pas été faite. Les actes de publication (`push` de tag, `gh release`, `gh workflow run`)
> sont **refusés aux agents** : ce document est donc, pour partie, une **procédure destinée au
> décideur**, et pour partie un travail d'exécution (dépôt de répétition, mesures, consignation).

---

## Problème

La garde V3 de L42 — le job `latest` de `.github/workflows/release.yml` — décide `--latest` ou
`--latest=false` selon que le tag publié est, ou non, le plus haut semver du dépôt. **Seule la
branche `--latest` a jamais tourné.** La branche `--latest=false`, celle qui est censée rendre le
vol du `latest` mécaniquement impossible, n'a **jamais été exécutée** — ni sur `IakaCockpit`, ni
sur `iakaFrameGUI`.

La *Vérif* écrite en CA-5 demande de **republier un tag antérieur** en `workflow_dispatch` puis de
re-mesurer. Or ce geste est **exactement celui que L41 a désigné comme piège** : relancer un build
sur un tag ancien **republie ses artefacts**. Et cette fois il y a quelque chose à protéger.

**La question que personne n'a tranchée, et qui est tout l'objet de ce cadrage : comment prouver
qu'une garde empêche un dégât, sans risquer ce dégât ?**

---

## Rectifications du relevé reçu

> Sur ce chantier chaque maillon a corrigé le précédent. Six points du relevé sont faux, imprécis,
> ou décrivent un mécanisme qui n'est pas celui qui s'exécute. Trois d'entre eux **changent la
> conception de l'expérience** — ils sont marqués ⚠️.

### R-1 ⚠️ — « Republier un tag ancien vole le `latest` » est **faux au SHA épinglé**

C'est écrit dans les deux `CLAUDE.md` et dans le cartouche L42 du workflow
(`.github/workflows/release.yml:130-135`). La **source lue** de `tauri-apps/tauri-action` au SHA
épinglé `84b9d35b5fc46c1e45415bdb6144030364f7ebc5` (`action-v0.6.2`) dit autre chose :

- `getOrCreateRelease` (`src/create-release.ts`) appelle `repos.getReleaseByTag` quand
  `draft: false`. **Si la release existe, elle est renvoyée telle quelle** — aucun
  `repos.updateRelease`, et `make_latest` n'est **jamais** passé.
- **Si la release n'existe pas**, il appelle `repos.createRelease` avec `tag_name`, `name`, `body`,
  `draft`, `prerelease`, `target_commitish`, `generate_release_notes` — **sans `make_latest`**,
  donc au défaut **`true`**.

**Conséquence directe** : le vol du `latest` n'est **pas** causé par la republication en soi, mais
par la **création** d'une release. Republier un tag dont la release **existe déjà** ne peut pas
voler le `latest` — l'action n'y touche pas. L'incident historique d'`iakaFrameGUI` (v0.1.5/v0.1.6
republiées le 18/08 après v0.1.7 du 13/08) est cohérent avec une **création**, pas avec une
mise à jour.

Cela invalide la voie la plus intuitive : **republier `v0.32.1` n'exercerait la branche
`--latest=false` que sur un danger nul** — il n'y aurait aucun vol à réparer.

### R-2 ⚠️ — Le vrai risque n'est pas « des artefacts irremplaçables », c'est **le canal de mise à jour servi**

`IakaCockpit/updater/latest.json` (le manifeste que les clients lisent) porte `version: "0.32.1"`
et ses **neuf** clés de plateforme pointent **toutes** vers des assets de la release `v0.32.1`,
**chacune avec la signature minisign des octets de cet asset** :

| Clé | URL (release `v0.32.1`) |
|---|---|
| `darwin-aarch64` / `darwin-x86_64` | `IakaCockpit_aarch64.app.tar.gz` · `IakaCockpit_x64.app.tar.gz` |
| `linux-x86_64` / `-appimage` | `IakaCockpit_0.32.1_amd64.AppImage` |
| `linux-x86_64-deb` / `-rpm` | `IakaCockpit_0.32.1_amd64.deb` · `IakaCockpit-0.32.1-1.x86_64.rpm` |
| `windows-x86_64` / `-nsis` / `-msi` | `IakaCockpit_0.32.1_x64-setup.exe` · `…_x64_en-US.msi` |

Rebâtir **n'importe quelle** plateforme sur `v0.32.1` remplace l'asset (l'action **supprime**
l'asset de même nom avant de téléverser — `src/upload-release-assets.ts`, lu). Les nouveaux octets
ne correspondent plus à la signature inscrite au manifeste : **la charge utile servie devient
invérifiable**, et le client refuse la mise à jour. Ce n'est pas « un asset écrasé », c'est le
canal de distribution cassé.

**Et la réparation est actuellement indisponible** : régénérer le manifeste passe par
`scripts/publish-update.mjs`, dont la voie d'écriture publie une release **Forgejo sur le NAS**
`192.168.1.139`, mesuré **code 000** au lot L42. *(Fait repris du rapport L42, non re-mesuré ici —
à re-vérifier avant de s'en servir comme argument.)*

**Conséquence : `v0.32.1` est interdite comme cible du contrefactuel, sur toutes les plateformes.**

### R-3 — `v0.32.1` porte **quatre** assets posés à la main, pas deux

Mesuré (`GET /repos/iakasju/IakaCockpit/releases/tags/v0.32.1`, anonyme) : uploader `iakasju`,
tous à `2026-08-28T17:05:03Z` — `IakaCockpit_aarch64.app.tar.gz` (14 922 054 o), son `.sig`
(412 o), `IakaCockpit_x64.app.tar.gz` (15 065 561 o), son `.sig` (412 o). **Les signatures comptent
autant que les archives** : sans elles, `publish-update.mjs` ne sait plus remplir le champ
`signature`. Le relevé n'en comptait que deux.

### R-4 ⚠️ — CA-5 est **littéralement écrit contre `iakaFrameGUI`**, pas contre `IakaCockpit`

CA-5 dit : « re-mesurer **CA-4** ». Et CA-4 (ligne 544) mesure
`gh api repos/iakasju/iakaFrameGUI/releases/latest`. Le relevé reçu instruit CA-5 sur
`IakaCockpit`. **Sur quel dépôt CA-5 doit être prouvé est donc un arbitrage ouvert** (AR-1), pas
un détail de rédaction.

### R-5 — Il n'existe **pas** de « matrice vide », et le dispatch doit partir de `main`

- Les seules valeurs de l'entrée `platforms` sont `toutes | windows,linux | windows | linux |
  macos` (`release.yml:20-25`). **Le minimum est une plateforme**, jamais zéro.
- `workflow_dispatch` exécute le fichier de workflow **de la référence choisie dans l'UI**, pas
  celui du tag construit. Lancer le dispatch **depuis le tag ancien** ferait tourner le
  `release.yml` **de ce tag** : sans job `latest`, et sans le SHA épinglé de L41. Le dispatch
  **doit** partir de `main`, avec l'entrée `tag` renseignée. Le workflow est écrit pour ça :
  `TAG: ${{ github.event.inputs.tag || github.ref_name }}` et `checkout ref: inputs.tag`.

### R-6 — Le dépôt est **public** : l'argument « minutes macOS facturées 10× » ne s'applique pas ici

`GET /repos/iakasju/IakaCockpit` → `private: false`, `visibility: "public"`. Les runners standard
sont gratuits sur les dépôts publics ; le commentaire `release.yml:4-5` reste vrai en général,
faux pour ce dépôt. **Le coût n'est donc pas un critère d'arbitrage** ; la durée d'exposition, si.

### R-7 — Les comptes d'assets lus dans un résumé ne sont pas des mesures

Trois relevés d'API résumés se sont contredits d'une unité au cours de ce cadrage (v0.32.2 annoncé
« 17 » puis énuméré à 16 ; v0.31.1 annoncé « 7 » puis énuméré à 6). **Tout compte se mesure par
`--jq '.assets|length'`**, jamais par lecture d'un résumé. Les valeurs du relevé reçu pour
`v0.32.2` (`assets 16 · sig 7 · latest.json 0 · dmg 2`) et `v0.32.1` (`15 · 7 · 1`) sont, elles,
**confirmées** par énumération.

---

## Faits établis — mesurés ou lus le 2026-08-29

### F1 — Sur `IakaCockpit`, **4 tags sur 29 seulement portent une release**

Tags (anonyme) : `v0.32.2, v0.32.1, v0.31.2, v0.31.1, v0.31.0, v0.30.2, v0.30.1, v0.30.0, v0.29.0,
v0.28.0, v0.27.3, v0.27.2, v0.27.1, v0.27.0, v0.26.0, v0.25.1, v0.25.0, v0.24.0, v0.23.0, v0.22.0,
v0.21.0, v0.20.0, v0.19.0, v0.18.0, v0.17.0, v0.16.0, v0.15.0, v0.14.0, v0.13.0`. **Aucun tag
`archive/*`** (ceux-là sont sur le GUI). Tous matchent `^v[0-9]+\.[0-9]+\.[0-9]+$` ; `v0.32.0`
n'existe pas.

Releases : **`v0.32.2`, `v0.32.1`, `v0.31.2`, `v0.31.1` — et rien d'autre.**

Croisé avec **R-1**, cela veut dire : « republier un tag ancien », sur ce dépôt, désigne dans
**25 cas sur 29** une **création** de release — donc un **vol** du `latest`.

### F2 — Ordre des opérations de `tauri-action` au SHA épinglé

Lu dans `src/index.ts` : **(1)** build, **(2)** `getOrCreateRelease`, **(3)**
`uploadReleaseAssets`, **(4)** `uploadVersionJSON` (sous garde `includeUpdaterJson`, posé à
`false`). **La release est créée après le build**, pas avant. La fenêtre pendant laquelle un
`latest` volé reste volé n'est donc **pas** la durée du build : c'est la durée
`téléversement + transition de job + job latest` — de l'ordre de **quelques minutes**.

### F3 — `gh release edit --latest=false` existe et envoie bien `make_latest: "false"`

`pkg/cmd/release/edit/edit.go` : le drapeau est déclaré en `cmdutil.NilBoolFlag` (trois états :
absent / vrai / faux) et la valeur part en `params["make_latest"] = fmt.Sprintf("%v", *IsLatest)`.
`--latest=false` est donc **supporté** et envoie la chaîne `"false"`.

### F4 — Ce que fait GitHub **après** `make_latest=false` n'est pas documenté clairement

La doc REST donne `make_latest` (`true|false|legacy`, défaut **`true`**) et décrit le `latest`
comme « la release non-brouillon, non-préversion **la plus récente, triée sur `created_at`** ». La
discussion communautaire n°78063 acte l'écart entre ce tri par date (API) et le drapeau posé par
le mainteneur (interface). **Attention au piège** : le `created_at` d'une release suit la date du
**commit** du tag, pas la date de publication — mesuré ici, `v0.32.1` porte
`created_at 2026-08-10` pour un `published_at 2026-08-28`.

**Ce que le contrefactuel doit mesurer, et qu'aucune lecture ne remplace :** vers quoi retombe le
`latest` quand on l'ôte à la release qui le porte. Sur `IakaCockpit`, les deux règles plausibles
(plus récent `created_at` hors exclu · plus haut semver) désignent **la même** release, `v0.32.2` —
l'expérience est donc **robuste à cette inconnue**, mais elle ne permet pas de **discriminer**
entre les deux règles. À déclarer tel quel.

### F5 — La garde est **auto-instrumentée** : elle mesure son propre résultat

`release.yml:190-199` : après le `gh release edit`, le job relit
`gh api repos/$DEPOT/releases/latest --jq '.tag_name'`, **exige** l'égalité avec `PLUS_HAUT`, et en
cas d'écart sort en erreur **en dictant la commande de rattrapage**
(`gh release edit <PLUS_HAUT> --latest --repo <DEPOT>`). Autrement dit : **si l'hypothèse F4 est
fausse, le contrefactuel le dira lui-même, en rouge et par écrit** — c'est le meilleur filet dont
on dispose, et il est déjà en place.

### F6 — Rien, dans la vitrine, ne dépend de `releases/latest` pour télécharger

`README.md:19-35` : les liens pointent `…/releases/tag/v0.32.2` — **épinglés au tag**. Aucune
occurrence de `/releases/latest/download` dans le dépôt. En revanche
`scripts/vitrine-en-ligne.mjs:101` lit `/repos/<depot>/releases/latest` pour son égalité **E-1** :
pendant une fenêtre de vol, `npm run vitrine:en-ligne` **rougirait à raison** (exit 1). C'est un
effet attendu, pas un défaut — mais il interdit de mesurer la vitrine pendant la fenêtre.

### F7 — Les clients de mise à jour ne lisent **pas** `releases/latest`

Le manifeste est un **fichier statique** (`updater/latest.json`) servi par endpoint ; ses URL sont
épinglées au tag `v0.32.1`. **Un `latest` transitoirement volé n'a donc aucun effet sur les
clients** — l'effet est limité à ce que voit un visiteur sur la page du dépôt, et à E-1.

### F8 — Le `latest` d'`iakaFrameGUI` est le même job… sans que rien ne le garde

`iakaFrameGUI/.github/workflows/release.yml` porte le job `latest` **aux mêmes numéros de ligne**
(147-199) et les mêmes lignes aux mêmes endroits (93, 119, 124, 127, 143, 167-199) : les deux
fichiers sont **vraisemblablement byte-identiques**. Mais `.github/workflows/release.yml`
**n'est pas** dans `fixtures/convergence.sha256` (18 fichiers, plancher 17) : rien ne garde cette
identité. **Une preuve faite sur un dépôt ne se transporte à l'autre que par une coïncidence non
gardée.** La byte-identité est ici **non mesurée** — c'est une étape de ce lot, pas un acquis.

Topologie du GUI : tags `v0.1.7, v0.1.6, v0.1.5, v0.1.4` + trois `archive/feat/*` ; **les quatre
tags de version portent une release**. Il n'y a donc, sur le GUI, **aucun tag sans release** — la
voie recommandée ci-dessous y coûterait la création d'un tag neuf.

---

## Les voies — ce que chacune prouve, ce qu'elle ne prouve pas

> La proposition à prouver n'est **pas** « le bash choisit le bon drapeau ». C'est : **« GitHub,
> ayant reçu `make_latest=false`, laisse le `latest` sur la plus haute release »** — et, dans sa
> forme forte, **« un vol qui a réellement eu lieu est réparé dans le même run »**.

| Voie | Ce qu'elle prouve | Ce qu'elle ne prouve **pas** | Risque |
|---|---|---|---|
| **V-A** — exécution hors CI du bash contre un `gh` factice *(déjà faite au gate L42)* | la décision de branche, le filtre `^v…$`, `sort -V` | **rien de ce qui compte** : le composant sous test (`gh` + API GitHub) est remplacé par un bouchon ; aucun vol n'existe donc aucune réparation | nul |
| **V-B** — `workflow_dispatch` sur un tag **dont la release existe** (`v0.31.2`) | la chaîne réelle de bout en bout : runner, `gh` présent, jeton, `contents: write`, API acceptant `--latest=false`, `latest` inchangé — **satisfait CA-5 à la lettre** | la **réparation** : au SHA épinglé, aucune création n'a lieu (R-1), donc aucun vol ne menaçait. Prouve la décision, pas l'effet | écrase les assets CI de `v0.31.2` (10 assets, tous `github-actions[bot]`, non référencés par le manifeste) et y **ajoute** des `.sig` qu'elle n'avait pas |
| **V-C** — `workflow_dispatch` sur un tag **neuf, hors semver**, dont la release **n'existe pas** | **tout V-B, plus la séquence complète vol → réparation** sur le dépôt réel, avec le vrai `tauri-action` au SHA épinglé | le comportement sur `iakaFrameGUI` (F8) ; la discrimination entre les deux règles de repli de F4 | **fenêtre de quelques minutes** (F2) où `releases/latest` désigne le tag contrefactuel. **Aucun asset existant touché** (release neuve) |
| **V-D** — dépôt **jetable**, job `latest` recopié, topologie fabriquée | le mécanisme : création sans `make_latest` ⇒ vol · `--latest=false` ⇒ restitution · `sort -V` + filtre sur `v0.9.0/v0.10.0/v0.2.0` + `archive/*`, cas que le dépôt réel **ne peut pas offrir** | que c'est **ce fichier-là** qui tourne sur `IakaCockpit` (atténuable : comparer le bloc au `raw` du dépôt réel) ; que `tauri-action` crée la release **de cette façon** (le `gh release create` du banc en est un **substitut**, pas l'acteur) ; les droits réels du dépôt | **nul sur le produit** |
| **V-E** — dispatch avec un `tag` **inexistant** | le `checkout` échoue, `latest` tourne quand même (`if: always()`), la décision se prend sur des données réelles, et **le chemin d'erreur R6 s'exerce** — lui non plus n'a jamais tourné | l'appel `--latest=false` **réussi** : `gh release edit` échoue faute de release | nul, mais laisse **un run rouge** dans l'historique |

**Trois limites à nommer, puisque le brief le demande explicitement :**

1. **Une preuve en dépôt jetable n'établit pas le comportement de GitHub sur le dépôt réel.** Elle
   établit le comportement de l'**API** sur un dépôt du même compte. Ce qui ne se transporte pas :
   le fichier exécuté, les droits, la topologie de tags, et l'identité de l'acteur qui crée la
   release.
2. **Une preuve hors CI n'établit pas que le runner exécute ce bash-là** — et surtout, elle
   remplace par un bouchon précisément ce qu'on veut éprouver. **V-A ne suffit pas, et c'est
   démontrable sans la rejouer** : elle ne peut pas produire de vol, donc pas de réparation.
   Elle reste **acquise** : ne pas la refaire.
3. **Aucune voie ne prouve, à elle seule, que le `latest` d'`iakaFrameGUI` est gardé.** Tant que
   `release.yml` n'est pas au registre de convergence, la garde du GUI reste **espérée**.

---

## Décision retenue — recommandation, non arbitrage

**Recommandation : V-D puis V-C, dans cet ordre.** V-D est une **répétition** : elle apprend, à
coût nul, ce que GitHub fait après `make_latest=false` (l'inconnue F4). V-C est la **preuve** :
elle rejoue la séquence complète sur le dépôt réel, avec le vrai acteur, **sans mettre en jeu un
seul asset existant**.

**Forme précise de V-C, et pourquoi chaque choix :**

- **Un tag neuf**, donc **aucune collision de nom d'asset** possible, donc rien à écraser. C'est ce
  qui retourne le raisonnement du relevé : ce n'est pas la republication d'un tag existant qui est
  la voie sûre, c'est la **création d'un tag neuf**.
- **Un nom qui ne matche pas `^v[0-9]+\.[0-9]+\.[0-9]+$`** — par exemple
  `contrefactuel-ca5-2026-08-29`. Trois bénéfices : **(a)** il ne peut **jamais** devenir
  `PLUS_HAUT`, donc la branche `--latest=false` est **déterministe** et non « choisie par
  comparaison » ; **(b)** il ne matche pas non plus `push: tags: v*`, donc **pousser le tag ne
  déclenche aucun build** — le décideur garde la main sur le moment ; **(c)** il ne pollue pas la
  suite des versions et ne perturbera jamais un `PLUS_HAUT` futur.
- **Pointé sur le commit de `v0.32.2`** : ce commit vient de bâtir **vert sur les 4 plateformes**
  (run `33273513846`), le build est donc connu bon. Effet de bord déclaré : le `created_at` de la
  release contrefactuelle **égalera** celui de `v0.32.2` (F4).
  ⚠️ **RÉFUTÉ LE 2026-08-30 — on date, on n'efface pas.** Ce point se poursuivait par : *« sans
  conséquence, une release exclue par `make_latest=false` ne peut pas être `latest` »*. **Le run
  `33277643229` l'a réfuté** : `v0.2.0`, sur laquelle le job venait de poser `--latest=false`,
  **était** encore ce que rendait `GET /releases/latest`. C'est **la ligne qui justifiait le choix
  de la cible de V-C** — elle tombe, et avec elle l'argument « effet de bord sans conséquence ».
  La cible reste **mal choisie pour discriminer**, mais pour une **autre** raison : l'égalité des
  `created_at` rendrait le repli par date **indéfini** (encart « V-C ne trancherait rien de plus »
  de `contrefactuel-ca5-procedure-decideur.md`).
- **`platforms: linux`** : un seul job, le plus court, donc la **fenêtre la plus étroite**.
- **Dispatch depuis `main`** (R-5), jamais depuis le tag.
- **Nettoyage** : `gh release delete <tag> --cleanup-tag` une fois les mesures prises.

**Si le décideur refuse tout geste sur le dépôt réel**, la réponse légitime existe et elle est
écrite en **AR-3** : CA-5 est clos en **« partiellement prouvé »**, avec sa part d'espéré
**déclarée**, datée et dotée d'une **condition de levée**. Ce serait une réponse acceptable ; ce
qui ne l'est pas, c'est de la subir en silence.

---

## Registre des énoncés sur le repli du `latest` — **ajouté le 2026-08-30**

> **Pourquoi il existe, et pourquoi il n'existait pas.** Trois passages de gate ont échoué sur la
> même classe d'énoncés. Ce n'était pas la même erreur répétée : c'était un **front qui recule** —
> le mécanisme, puis la portée, puis la propagation. Chaque passage a corrigé **exactement là où le
> gate pointait**, et **les pointeurs d'un gate sont des exemples, pas une énumération**. Quand la
> classe est une **chaîne** (`NO-OP`), un `grep` la balaie entièrement ; quand c'est une **forme
> d'inférence** (`drapeau inamovible ⇒ v0.10.0`), il est aveugle — la phrase ne contient aucun des
> mots proscrits. **On ne `grep` pas une implication.**
>
> La réponse n'est donc **pas** un meilleur motif, c'est un **registre** : on énumère **une fois**
> les énoncés du corpus qui affirment quelque chose sur ce repli, on les **fige**, et on se donne
> un moyen de **rougir** quand ils dérivent. *« Ce dépôt sait déjà faire ça :
> `fixtures/convergence.sha256` **est** ce geste. »* Celui-ci est un artefact **distinct** — il ne
> touche pas à ce registre-là, dont le **plancher reste à 17**.

### Méthode de construction — reproductible, et c'est le point

1. **Balayage lexical** des trois dépôts, sur `*.md *.yml *.yaml *.mjs *.js *.ts *.tsx *.sh`,
   hors `node_modules dist target build coverage .git package-lock.json`, avec le motif —
   **sensible à la casse**, faute de quoi `NO-OP` attrape tous les `noop` du code applicatif
   (27 fichiers de bruit au lieu de 7) :

   ```
   make_latest|--latest|NO-OP|drapeau inamovible|repli par (date|semver|created_at|published_at)
   |aucun repli|repli du .?latest|[Vv]ole le .?latest|vol du .?latest
   |[Mm][eé]caniquement impossible|releases/latest
   ```

2. **Triage à la main de chaque fichier touché** — le balayage propose, il ne décide pas. Chaque
   fichier atterrit dans **l'une des deux listes**, jamais dans aucune : `couverts` (il porte au
   moins un énoncé de la classe) ou `horsCouverture` (il n'en porte pas, **et le motif de son
   exclusion est écrit**).
3. **Inscription** : pour chaque énoncé, `depot`, `chemin`, `ligne`, un **extrait**, le `sha256`
   **de la ligne**, sa **classe** (`repli` · `vol` · `vol+reparation`) et son **statut**.
4. **Comptage** du nombre d'occurrences du motif **par fichier couvert** — c'est ce qui permet de
   voir qu'un fichier déjà couvert a **gagné** un énoncé.

**Artefacts** : `iakaframe/cli/fixtures/registre-repli-latest.json` (les données) et
`iakaframe/cli/scripts/registre-repli-latest.js` (le vérificateur). Il est **hors gate et hors
réseau**, comme `vitrine:en-ligne`, et pour la même raison écrite : il lit **trois dépôts**, donc
sa mesure dépend de ce qui est présent sur la machine.

```
node cli/scripts/registre-repli-latest.js            # verifie
node cli/scripts/registre-repli-latest.js --ecrire   # re-inscrit apres une correction VOULUE
```

### Comment il rougit — et ce qu'il ne voit pas

| | Détection | Rouge quand… |
|---|---|---|
| **D-1** | l'énoncé a **disparu ou été réécrit** | le `sha256` de la ligne inscrite ne se retrouve nulle part dans le fichier |
| **D-2** | l'énoncé a **migré de ligne** | il est là, mais plus à la ligne inscrite — **tout `chemin:ligne` qui le cite mentirait** |
| **D-3** | un **fichier neuf** entre dans le vocabulaire | il est touché par le motif et n'est **dans aucune** des deux listes |
| **D-4** | un fichier **couvert** a gagné (ou perdu) des occurrences | **un énoncé a été ajouté** sans passer par le registre |

**Codes de sortie** : `0` conforme · `1` dérive(s) · `2` usage · **`3` NON MESURÉ** (un dépôt du
registre est introuvable) — distinct de `0` à dessein : *un contrôle qui rend « succès » alors
qu'il n'a rien vu est le pire des faux verts.*

**Le contrefactuel du registre — les quatre détections prouvées ROUGE D'ABORD, puis révoquées.**
Un registre qu'on n'a pas vu rougir est décoratif. Les quatre mutations ont été jouées une à une,
chacune révoquée immédiatement (jamais en fin de campagne), le 2026-08-30 :

| Mutation jouée | Rouge obtenu, **nommé** | code |
|---|---|---|
| réécrire un énoncé inscrit (`IakaCockpit/CLAUDE.md`, un mot retiré) | `D-1 … l'enonce « IakaCockpit/bloc-latest/en-tete » a DISPARU ou a ETE REECRIT` | `1` |
| insérer une ligne au-dessus (procédure `iakaframe`) | `D-2 … a MIGRE de la ligne 223 a la ligne 224 : tout « chemin:ligne » qui le cite ment desormais` | `1` |
| créer `iakaFrameGUI/specs/note-contrefactuelle.md` disant *« sous repli par date, le job reparerait »* | `D-3 … FICHIER NEUF dans le vocabulaire du repli (1 occurrence), absent du registre` | `1` |
| ajouter une ligne `make_latest` à `iakaframe/specs/etat-des-lieux.md` | `D-4 … 9 occurrence(s) aujourd'hui, 8 a l'inscription : un enonce a ete AJOUTE` | `1` |
| **révocation des quatre** | `CONFORME : chaque enonce inscrit est a sa place, et aucun n'a ete ajoute.` | **`0`** |

**Le registre est resté intact pendant tout le contrefactuel** — `sha256` de
`cli/fixtures/registre-repli-latest.json` mesuré **avant** et **après** la campagne, **égaux à
l'octet** : `fc7ab92335f4cb9805034c5186031e4ee7c60c4193c73be7de5c88ec117fe44a`. *La preuve se compare au **fichier**, jamais à une autre sortie.*

> ⚠️ **Cette empreinte n'est PAS un point d'ancrage, et le dire évite un mensonge futur.** Elle
> change **à chaque `--ecrire`** — donc à chaque correction voulue du corpus. Ce qui est prouvé ici
> n'est pas **sa valeur**, c'est **son égalité** aux deux bouts de la campagne : les mutations ont
> rougi **sans** que l'étalon bouge. Un lecteur qui la recalcule après un lot suivant obtiendra
> autre chose, **et ce ne sera pas une dérive**.

> ⛔ **CE QU'IL NE VOIT PAS — déclaré, pas tu.**
> **H-1** — une implication **neuve**, dans un fichier **déjà couvert**, écrite **sans aucun mot du
> motif**. C'est l'angle mort de tout balayage lexical, et c'est **exactement** la faute des trois
> passages précédents. **D-4 le réduit fortement** — une phrase sur le repli emploie presque
> toujours l'un de ces mots — **sans le fermer**. Il se ferme à la **lecture** de ce registre.
> **H-2** — la **justesse** d'un énoncé. Ce script compare des octets ; il ne juge rien. Un énoncé
> faux et stable est **vert** chez lui.

### Le registre — 49 énoncés, 16 fichiers couverts, 13 déclarés hors couverture

**Statuts** : **CORRIGÉ** (ce passage l'a réécrit) · **CONFORME** (juste, laissé tel quel, inscrit
pour qu'une dérive future se voie) · **CONSIGNÉ-NON-CORRIGÉ** (dans la classe, **faux**, et **non
traité** — avec son motif et sa condition de levée).

Les `chemin:ligne` exacts et les empreintes vivent dans le JSON, **pas ici** : recopiés en prose,
ils se périmeraient au premier commit. Ce qui suit est le **avant / après** par famille.

| # | Énoncé | Fichiers | Avant | Après | Statut |
|---|---|---|---|---|---|
| **1** | en-tête du bloc `latest` | les 2 `CLAUDE.md` | *« RIEN N'ETABLIT QU'IL LE REPARE »* | *« ET, DANS LES LIMITES ENUMEREES, IL NE LE REPARE PAS NON PLUS »* | CORRIGÉ |
| **2** | le bornage « un repli par date **réparerait** ici » | les 2 `CLAUDE.md` (bloc **et** backlog), `installer-depuis-rien.md`, la procédure | donné comme la **seule variante survivante** | **daté et réfuté** : plus aucune règle survivante ne regarde les dates | CORRIGÉ |
| **3** | l'inférence `drapeau inamovible ⇒ v0.10.0` | `IakaCockpit/CLAUDE.md` ×2, `iakaFrameGUI/CLAUDE.md` ×2, `installer-depuis-rien.md` | une conclusion tirée d'**une sortie unique**, celle dont le § voisin dit qu'elle **ne tranche rien** | la **table des neuf règles**, croisée sur **deux** mesures, et le **résidu** | CORRIGÉ |
| **4** | l'avertissement d'asymétrie | la procédure (`bash` en 180-183, avertissement en 187-196) ; les 2 `CLAUDE.md` (**aucun** avertissement) | **après** les commandes, ou absent | **avant** les commandes, dans les trois | CORRIGÉ |
| **5** | le résidu | partout où la conclusion est écrite | **absent** | 5 points, dont *« une règle non énumérée reste possible »* et *« le NO-OP est **observationnel** »* | CORRIGÉ |
| **6** | la reproduction du compte `NO-OP` | la procédure | commits `895e74f` / `2b09615` → **six** occurrences, pas huit | `58f4e6f` / `589c4d6` / `26d096d` → **huit sur six fichiers**, vérifiés un à un | CORRIGÉ |
| **7** | le § 2 et le § 3.4 de la procédure | la procédure | au **futur de l'indicatif**, contre la décision **(γ)** du § 5 | **conditionnels**, et dits **non exécutés** | CORRIGÉ |
| **8** | le cartouche du workflow | les 2 `release.yml` (**17 lignes**, job 147-199 intact) | *« ICI, voleuse = tag ANCIEN : un repli par date REPARERAIT »* | *« IL NE LE REPARE PAS »* + le résidu | CORRIGÉ |
| **9** | *« celle qui rend le vol du `latest` **mécaniquement impossible** »* | `IakaCockpit/specs/etat-des-lieux.md`, `iakaFrameGUI/specs/etat-des-lieux.md` | **la forme la plus forte du corpus**, dans « Reprise du travail » — le **premier texte lu au prochain passage** | **réfutée en place** : elle n'empêche rien (§ F2) et ne répare pas (table des neuf règles) | CORRIGÉ |
| **10** | *« Prochaine étape : le contrefactuel de CA-5, republier un tag ancien »* | `IakaCockpit/specs/etat-des-lieux.md` | contre **R-1** *et* contre la décision **(γ)**, et le geste **venait d'être joué** | **réécrite** : re-cadrer la garde | CORRIGÉ |
| **11** | ⚠️ **un TROISIÈME état des lieux**, jamais pointé | `iakaframe/specs/etat-des-lieux.md` (H-2 **et** « Pièges connus » n° 1) | *« republier une version ancienne vole le latest »* + *« Remède : … ou le job conditionné au plus haut semver »* | le vol vient de la **CRÉATION** ; le job **n'est pas un remède** — il détecte, rougit, dicte | CORRIGÉ |
| **12** | ⚠️ **un QUATRIÈME cartouche**, jamais rectifié | `iakaframe/.github/workflows/release.yml` | *« Republier un tag ANCIEN VOLE donc le `latest` »* + *« réécrit à chaque création **ou mise à jour** »* | daté et rectifié ; **et** la distinction d'acteur (`softprops`, **pas** `tauri-action`) est **écrite**, plus supposée | CORRIGÉ |
| **13** | F4 et F5 de cette instruction | ce fichier | — | **inchangés** : F4 dit vrai (la **doc** ne tranche pas — c'est l'**élimination** qui tranche), F5 aussi | CONFORME |
| **14** | *« c'est le seul détecteur »* | `IakaCockpit/CLAUDE.md:195`, `iakaFrameGUI/CLAUDE.md:176` | — | **inchangé** — la distinction tient, et **les lignes exactes sont `195` / `176`**, pas `194` / `175` | CONFORME |
| **15** | `make_latest` calculé **non éprouvé** | `iakaframe/cli/scripts/lib/vitrine.js`, `iakaframe/BACKLOG.md` | — | **inchangé** : ils disent déjà « non éprouvé ». Inscrits pour qu'une promotion future se voie | CONFORME |
| **16** | 🛑 le message **E-1** de la vitrine en ligne | `IakaCockpit/scripts/vitrine-en-ligne.mjs`, `iakaFrameGUI/…`, `iakaframe/cli/scripts/vitrine-en-ligne.js` | *« Republier un tag ancien **VOLE** le latest … **Rattrapage** : `gh release edit <plusHaut> --latest` »* | **INCHANGÉ — voir ci-dessous** | **CONSIGNÉ-NON-CORRIGÉ** |

### 🛑 L'entrée 16 — pourquoi elle n'est pas corrigée, et ce que ça coûte

**C'est la trouvaille du registre, et la plus gênante** : la phrase que L43 a rectifiée dans les
`CLAUDE.md` et les cartouches vit **aussi dans du code qui s'imprime à l'opérateur**, aux
**trois** dépôts — et **aucun** des quatre passages ne l'avait vue. Elle est **doublement fautive** :
elle attribue le vol à la **republication** (faux au SHA épinglé — **R-1**) et elle annonce un
**rattrapage** dont le fonctionnement **n'a aucune trace**. C'est l'endroit du corpus où
l'inexactitude a le **plus** de conséquence : elle s'affiche au moment précis où quelqu'un décide
quoi faire.

**Elle n'est pas corrigée dans ce passage**, et le motif est mécanique, pas discrétionnaire :
`scripts/vitrine-en-ligne.mjs` **est inscrit à `fixtures/convergence.sha256`** (registre à 17
entrées). Le modifier obligerait à l'éditer **dans les deux dépôts au même commit logique** *puis*
à **régénérer les empreintes du registre de convergence** — ce que les garde-fous de ce passage
interdisent (*« n'inscris rien à `fixtures/convergence.sha256` »*, plancher **17**). Et corriger la
seule copie libre — celle de la CLI — laisserait **une** des trois formulations rectifiée et deux
fausses : une divergence pire que l'erreur.

> **CONDITION DE LEVÉE** : un lot qui **décide** de toucher au registre de convergence, corrige les
> **trois** copies et régénère les empreintes. **Coût déclaré en attendant** : sur une fenêtre de
> vol réelle, `npm run vitrine:en-ligne` imprime à l'opérateur un diagnostic **faux** et un remède
> **non éprouvé**. C'est un **hors-couverture assumé**, pas un oubli.

### Ce que le registre a trouvé que quatre passages n'avaient pas vu

1. **Un troisième état des lieux** (`iakaframe`), avec la phrase fausse **et** le job donné comme
   remède — dans « Pièges connus », la section la plus relue du fichier.
2. **Un quatrième cartouche** (`iakaframe/.github/workflows/release.yml`), alors que l'étape 1.1 de
   ce cadrage n'en nommait que **trois**.
3. **Trois copies du message E-1**, dans du code exécuté.

**C'est la mesure de l'écart entre un pointeur et une énumération** — et la seule raison d'être de
ce registre.

---

## Périmètre

**Inclus**

1. Rectifier, dans les trois endroits où il est écrit, le mécanisme du vol (R-1) : les deux
   `CLAUDE.md` et le cartouche `release.yml:130-146`. *Inclus, et non renvoyé à un successeur,
   parce que la conception même de l'expérience en dépend : prouver CA-5 tout en laissant une
   description fausse du mécanisme serait incohérent.*
2. **Mesurer** la byte-identité des deux `release.yml` (F8) et, selon AR-2, l'inscrire au registre
   de convergence.
3. Monter le **dépôt de répétition** (V-D) et y rejouer vol + réparation + tri.
4. Rédiger la **procédure du décideur** pour V-C (gestes exacts, ordre, mesures, fenêtre,
   restauration) et l'exécuter **avec** lui.
5. Consigner le résultat : cocher ou non CA-5 dans `installer-depuis-rien.md`, mettre à jour les
   deux backlogs, avec les commandes et leurs sorties citées.

**Exclu — nommément**

- La **dette de canal à deux étages** : NAS injoignable **et** `publish-update.mjs:418` qui ne
  pousse que vers `origin` alors que l'endpoint réellement lu est `raw.githubusercontent.com`.
  **Défaut réel, autre lot.**
- Le **bump** du GUI et celui d'`iakaframe` (première exécution de son CI).
- Les deux porteurs de version non gardés (`Cargo.lock`, `package-lock.json`).
- Les cinq successeurs de L42 : **F-2**, **F-3**, couverture asymétrique,
  `D3-OBSERVABLE-ENREGISTREMENT`, `CI-RELEASE-AUCUN-EPINGLAGE`.
- **Toute modification du job `latest` lui-même.** On le prouve, on ne le retouche pas. Un
  contrefactuel qui modifie son objet ne prouve rien.
- **Le dé-épinglage de `tauri-action`** — l'acquis de L41 n'est pas rouvert.
- L'anomalie relevée au passage sur `v0.31.1` (ses assets CI sont nommés **`0.13.0`** alors que le
  tag est `v0.31.1`, et elle porte un `.dmg` posé à la main par `iakasju`) : **constat, pas
  chantier**. Il sert seulement d'argument à R-7 — on ne raisonne jamais sur des noms d'assets
  **inférés**, uniquement sur des noms **mesurés**.

---

## Étapes d'implémentation

### 1. Rectification du mécanisme (agent, hors ligne)

1.1 Réécrire le cartouche `release.yml:130-146` **des deux dépôts** : le vol vient de la
**création** d'une release sans `make_latest` (défaut `true`), pas de la republication ; une
republication sur une release **existante** ne touche pas au drapeau **au SHA épinglé**, et la
phrase doit dire « au SHA épinglé », car c'est une propriété de cette version-là.
*(Contrainte : si le fichier entre au registre de convergence en 2., l'édition se fait **dans les
deux dépôts au même commit logique**, puis régénération des empreintes.)*

1.2 Même rectification dans les deux `CLAUDE.md` (bloc « ⚠️ REPUBLIER UN TAG ANCIEN VOLE LE
`latest` »).

1.3 Ne **pas** supprimer la trace de l'affirmation antérieure : la corriger en la datant, comme
L41 l'a fait pour sa déclaration fausse.

### 2. Mesure de la convergence des deux workflows (agent)

2.1 `sha256` des deux `.github/workflows/release.yml`. **Citer les deux empreintes.**

2.2 Si identiques et si AR-2 = inscrire : ajouter la ligne au registre des **deux** dépôts,
**relever le plancher de complétude** de 17 à 18, régénérer les empreintes avec la commande en tête
de `fixtures/convergence.sha256`, rejouer les deux faces.

2.3 Si **différents** : ne rien inscrire, **écrire le diff** dans le rapport, et déclarer que la
preuve de CA-5 ne couvrira **qu'un** dépôt.

### 3. Dépôt de répétition (agent — V-D)

3.1 Créer un dépôt jetable (recommandé **privé**, cf. AR-4), p. ex. `iakasju/latest-contrefactuel`.

3.2 Y poser un workflow à **deux** jobs reproduisant la topologie : un `build` factice
(`run: echo`) et le job `latest` **recopié verbatim** depuis `IakaCockpit`.

3.3 **Rendre le transport de preuve mesurable** : première étape du job, télécharger
`https://raw.githubusercontent.com/iakasju/IakaCockpit/main/.github/workflows/release.yml`, en
extraire le bloc `latest:` et le **comparer octet à octet** à la copie locale — rouge si divergence.
Sans cette étape, le banc prouve un texte que personne ne relie au vrai.

3.4 Fabriquer la topologie adverse : releases `v0.9.0`, `v0.10.0`, `v0.2.0` (vides, sans asset) et
un tag `archive/feat/x`. **Attendu du tri** : `PLUS_HAUT = v0.10.0` — c'est le cas de bord que le
dépôt réel ne contient pas.

3.5 Rejouer, **dans cet ordre et en mesurant entre chaque** : (a) `latest` initial ; (b)
`gh release create v0.2.0` **sans** `make_latest` → mesurer : le `latest` **a-t-il été volé** ?
(c) lancer le job `latest` avec `TAG=v0.2.0` → mesurer : est-il **rendu** à `v0.10.0` ?

3.6 Consigner **les trois mesures**, plus la sortie du job. **Répondre à l'inconnue F4** : vers
quoi GitHub retombe après `make_latest=false`.

### 4. Procédure du décideur (V-C) — **gestes humains, refusés aux agents**

> L'agent prépare, mesure et rédige ; **le décideur exécute les quatre gestes marqués 👤**.

4.1 **Préalable — figer l'état d'avant**, en anonyme :
`gh api repos/iakasju/IakaCockpit/releases/latest --jq .tag_name` ·
`gh api repos/iakasju/IakaCockpit/releases/tags/v0.32.2 --jq '.assets|length'` ·
`gh api repos/iakasju/IakaCockpit/releases/tags/v0.32.1 --jq '[.assets[].name]'` ·
`sha256` de `updater/latest.json`. **Ces quatre valeurs sont l'état de référence de la
restauration.**

4.2 👤 Créer et pousser le tag hors semver sur le commit de `v0.32.2` :
`git tag contrefactuel-ca5-2026-08-29 <sha de v0.32.2>` puis `git push github <tag>`.
**Vérifier qu'aucun run ne démarre** (le nom ne matche pas `v*`) — c'est le premier attendu
mesurable de l'expérience.

4.3 👤 Lancer le dispatch **depuis `main`** :
`gh workflow run release.yml --ref main -f tag=contrefactuel-ca5-2026-08-29 -f platforms=linux
--repo iakasju/IakaCockpit`.

4.4 **Sonder la fenêtre** pendant le run (authentifié, toutes les 30 s, horodaté) :
`gh api repos/iakasju/IakaCockpit/releases/latest --jq .tag_name`. **Attendu** : `v0.32.2`, puis
éventuellement le tag contrefactuel pendant quelques minutes (F2), puis **retour à `v0.32.2`**.
*Ne pas sonder en anonyme : 60 requêtes/heure par IP.*

4.5 Après la fin du run : relire **le log du job `latest`** et citer verbatim les lignes
`DECISION : …` et `VERIFICATION : latest effectif = …`.

4.6 **Re-mesurer en anonyme** (point de vue du visiteur) : `releases/latest`, le nombre d'assets de
`v0.32.2`, la liste des noms d'assets de `v0.32.1`, et le `sha256` de `updater/latest.json`.
**Comparer aux quatre valeurs de 4.1.**

4.7 👤 Nettoyer : `gh release delete contrefactuel-ca5-2026-08-29 --cleanup-tag --yes --repo
iakasju/IakaCockpit`, puis **re-mesurer `releases/latest` une dernière fois** — supprimer une
release est aussi un geste qui peut déplacer le drapeau.

### 5. Consignation (agent)

5.1 Cocher CA-5 dans `installer-depuis-rien.md` **si et seulement si** CA-5.1 à CA-5.6 sont verts,
avec les commandes et leurs sorties. Sinon, écrire ce qui est prouvé et ce qui ne l'est pas.

5.2 Mettre à jour les deux backlogs (`IakaCockpit/CLAUDE.md`, `iakaFrameGUI/CLAUDE.md`) : ce lot
dit ce qu'il a fait, et **ce qu'il n'a pas fait**.

---

## Fichiers concernés

- `iakaframe/specs/instructions/contrefactuel-du-vol-de-latest.md` — **ce fichier** (copie unique,
  conformément à AR-5=(b) de L42 : le défaut vit dans une convention de portefeuille, pas dans deux
  implémentations jumelles).
- `iakaframe/specs/instructions/installer-depuis-rien.md` — **CA-5 seul** : coché ou requalifié,
  avec sa preuve ou son aveu. Ne rien toucher d'autre.
- `IakaCockpit/.github/workflows/release.yml:130-146` et
  `iakaFrameGUI/.github/workflows/release.yml:130-146` — **cartouche uniquement**. **Le job
  `latest` (147-199) n'est pas touché.**
- `IakaCockpit/CLAUDE.md` et `iakaFrameGUI/CLAUDE.md` — bloc « REPUBLIER UN TAG ANCIEN… » + backlog.
- `IakaCockpit/fixtures/convergence.sha256` et son jumeau — **seulement si AR-2 = inscrire**
  (ligne ajoutée + plancher relevé 17 → 18).
- **Dépôt jetable** (hors portefeuille) : workflow + fixture d'extraction du bloc.

**Ne pas toucher** : le job `latest` · `fixtures/tauri-action-pin.json` et le SHA épinglé ·
`updater/latest.json` · la matrice du CI · `scripts/publish-update.mjs` · `README.md` ·
`fixtures/vitrine-*.json`.

---

## Risques et **procédure de restauration**

- **R1 — Le `latest` reste volé** (le job `latest` n'a pas tourné : run annulé, panne de runner,
  quota `gh`, `if: always()` ne couvrant pas une annulation de workflow).
  *Détection* : sonde 4.4, ou mesure 4.6.
  *Restauration* — **la commande est déjà celle que le workflow imprime lui-même** :
  `gh release edit v0.32.2 --latest --repo iakasju/IakaCockpit`, puis re-mesurer
  `releases/latest --jq .tag_name` → doit rendre `v0.32.2`. Coût : quelques secondes.
- **R2 — Un asset est écrasé.** *Impossible sur la voie recommandée* (release neuve, aucun nom en
  collision). Si le décideur choisit malgré tout V-B : un asset **produit par le CI** se restaure en
  **relançant le même dispatch** ; un asset **posé à la main** (les 4 de `v0.32.1`, le `.dmg` de
  `v0.31.1`) **ne se restaure pas** — d'où l'interdiction de R-2/R-3.
- **R3 — Le manifeste servi devient invérifiable.** *Impossible sur la voie recommandée.* Sur V-B
  appliquée à `v0.32.1`, la réparation exigerait de republier le manifeste, **ce que le NAS mort
  interdit aujourd'hui** (R-2). C'est le risque qui **exclut** `v0.32.1`, pas qui se mitige.
- **R4 — La fenêtre est vue par un visiteur.** Quelques minutes (F2), pendant lesquelles la page du
  dépôt annonce une « Latest » absurde. Les **liens de téléchargement du README restent valides**
  (F6) et **les clients de mise à jour ne sont pas affectés** (F7). *Mitigation* : `platforms:
  linux`, et ne pas lancer aux heures où le dépôt est montré.
- **R5 — `npm run vitrine:en-ligne` rougit pendant la fenêtre** (E-1). **C'est le comportement
  correct** ; ne pas le corriger, ne pas mesurer la vitrine pendant la fenêtre, et **le dire dans
  le rapport** pour qu'un lecteur futur ne prenne pas ce rouge pour une régression.
- **R6 — Deux runs concurrents.** Le workflow n'a **aucun** `concurrency:`. Ne rien publier
  d'autre pendant l'expérience.
- **R7 — Le build du tag contrefactuel échoue.** Alors aucune release n'est créée, `gh release
  edit` échoue, le run est **rouge** et l'expérience retombe sur V-E : la décision est prouvée, la
  réparation non. *Mitigation* : pointer le tag sur le commit de `v0.32.2`, dont le build est connu
  vert (run `33273513846`).
- **R8 — Le dépôt jetable rassure à tort.** Un vert en V-D **ne prouve rien** sur `IakaCockpit` si
  l'étape 3.3 (comparaison au `raw` réel) est omise ou désarmée. *Mitigation* : elle est un critère
  d'acceptation à part entière (CA-5.8), et son contrefactuel est exigé.

---

## Critères d'acceptation

> Discipline héritée de L40/L41/L42, **non négociable ici** : un « OK » sans chiffre vaut **FAIL** ·
> une preuve se compare à une **valeur figée avant l'expérience**, jamais à la sortie d'une autre
> commande · un critère **non mesuré** se déclare *non mesuré*, **jamais** *PASS* · les mesures de
> verdict se font **en anonyme, sans jeton** (point de vue de l'audience), les sondes de fenêtre
> **authentifiées** (quota).

### La branche `--latest=false` a réellement tourné

- [ ] **CA-5.1** — Le log du job `latest` du run contrefactuel porte **verbatim** la ligne
      `DECISION : <tag> n'est PAS le plus haut (v0.32.2) -> on pose explicitement` et la ligne
      `--latest=false`. *Vérif* : `gh run view <id> --log --repo iakasju/IakaCockpit`, lignes citées
      avec le n° de run. **C'est le cœur de CA-5** : cette ligne n'a jamais existé dans aucun log.
- [ ] **CA-5.2** — Le job `latest` est **vert** et sa ligne d'auto-vérification dit
      `VERIFICATION : latest effectif = v0.32.2 (attendu : v0.32.2)`. *Vérif* : même log +
      `gh run view <id> --json conclusion`.

### Le `latest` n'a pas bougé — mesuré, pas supposé

- [ ] **CA-5.3** — **Avant / après, en anonyme, valeur identique** :
      `gh api repos/iakasju/IakaCockpit/releases/latest --jq .tag_name` → `v0.32.2` en 4.1 **et** en
      4.6 **et** en 4.7 (après suppression de la release contrefactuelle). **Trois mesures citées.**
- [ ] **CA-5.4** — **Le vol a bien eu lieu, et a bien été réparé.** La sonde 4.4 montre au moins un
      relevé horodaté où `releases/latest` ≠ `v0.32.2`, suivi d'un relevé où il vaut de nouveau
      `v0.32.2`. *Vérif* : la trace horodatée de la sonde, citée.
      ⚠️ **Si aucun vol n'est observé, CA-5.4 est FAIL et non « encore mieux »** : cela voudrait
      dire que le mécanisme décrit en R-1 est faux à son tour, et **la description du défaut devrait
      être re-cadrée** avant de conclure quoi que ce soit.

### Rien n'a été abîmé

- [ ] **CA-5.5** — `gh api …/releases/tags/v0.32.2 --jq '.assets|length'` rend **la même valeur**
      qu'en 4.1 (`16` attendu). Les deux valeurs citées côte à côte.
- [ ] **CA-5.6** — `gh api …/releases/tags/v0.32.1 --jq '[.assets[].name]|sort'` rend une liste
      **identique** à celle figée en 4.1 — **les quatre assets posés à la main sont nommément
      présents** (`IakaCockpit_aarch64.app.tar.gz`, `…_aarch64.app.tar.gz.sig`,
      `IakaCockpit_x64.app.tar.gz`, `…_x64.app.tar.gz.sig`). *Vérif* : `diff` des deux listes → vide.
- [ ] **CA-5.7** — `sha256` de `updater/latest.json` **inchangé**. Les deux empreintes citées.

### La répétition prouve le mécanisme, et se sait reliée

- [ ] **CA-5.8** — Sur le dépôt jetable, l'étape de **comparaison au `raw` du dépôt réel** rougit
      quand on altère d'un octet la copie locale du bloc `latest:`. *Vérif* : la mutation, le rouge
      **nommé**, puis la **révocation prouvée** au `sha256` du fichier. Sans ce contrefactuel, le
      banc est décoratif.
- [ ] **CA-5.9** — Les trois mesures de 3.5 sont citées, et elles **répondent à F4** : le
      `latest` après `make_latest=false` est nommé, et la règle de repli observée est **décrite**
      (« retombe sur X ») — ou **déclarée non discriminable** si les deux règles convergent.
- [ ] **CA-5.10** — Le tri est prouvé sur le cas de bord : avec `v0.9.0`, `v0.10.0`, `v0.2.0` et un
      tag `archive/feat/x`, le job imprime `plus haut semver: v0.10.0`. *Vérif* : ligne de log citée.

### Le périmètre de la preuve est dit

- [ ] **CA-5.11** — Le `sha256` des deux `release.yml` est cité. **S'ils diffèrent**, le rapport
      **écrit** que CA-5 ne couvre qu'`IakaCockpit` et que la garde du GUI reste **espérée**, avec
      sa condition de levée. **S'ils sont identiques**, la ligne est au registre de convergence des
      deux dépôts, le plancher est relevé, et `npm run test` + `npm run test:convergence` sont verts
      **des deux côtés**, chiffres cités.
- [ ] **CA-5.12** — Le cartouche du workflow et les deux `CLAUDE.md` décrivent le mécanisme **réel**
      (création ⇒ vol · republication sur release existante ⇒ pas de vol, **au SHA épinglé**), et
      **datent** l'affirmation antérieure au lieu de l'effacer. *Vérif* : lecture des trois
      emplacements + `git diff`.
- [ ] **CA-5.13** — **Aucune ligne du job `latest` (147-199) n'a été modifiée** dans l'un ou l'autre
      dépôt. *Vérif* : `git diff` restreint à ces lignes → vide. Un contrefactuel qui retouche son
      objet ne prouve rien.
- [ ] **CA-5.14** — Les suites des deux dépôts sont vertes, **chaque commande sur sa ligne, avec son
      code de sortie et son chiffre** : Cockpit `npm run test` puis `bash scripts/quality.sh` ; GUI
      `npm run lint:all`, `npm run test:all`, `npm run test:rust`. Une formule d'ensemble vaut FAIL.

---

## Arbitrages — TRANCHES par le decideur le 2026-08-29

> **AR-1 a AR-5 sont TRANCHES : le decideur a valide l'instruction sur ses recommandations.**
> Le tableau se lit comme la **decision**, plus comme une proposition. Si l'execution rencontre un cas
> qu'un arbitrage ne couvre pas, elle **s'arrete et remonte** — elle ne tranche pas a la place du
> decideur.
>
> **AR-3 en particulier est tranche sur la voie la plus prudente** : repetition en depot jetable
> **PUIS** contrefactuel reel. L'option « clore en partiellement prouve, ecrit et date » reste
> ouverte si la repetition revele que le risque n'est pas borne comme prevu — dans ce cas,
> **s'arreter et remonter**.
>
> **Rappel du fait qui a renverse ce cadrage** : republier un tag ANCIEN ne vole PAS le `latest` au
> SHA epingle (`getOrCreateRelease` renvoie la release existante telle quelle, `make_latest` jamais
> passe). **Le vol vient de la CREATION.** La voie retenue est donc un **tag NEUF hors semver**, qui
> ne peut jamais etre le plus haut : la branche `--latest=false` devient **deterministe**, et il n'y
> a **aucune collision de nom, donc rien a ecraser**.
>
> ⚠️ **`v0.32.1` est INTERDITE comme cible**, et pas seulement pour macOS : les neuf cles du
> manifeste servi pointent ses assets **avec leurs signatures minisign**, et l'action **supprime
> l'asset de meme nom avant de televerser**. Rebatir n'importe quelle plateforme dessus rend la
> charge utile servie **inverifiable**, et la reparation passe par le NAS **mort**.
>
> Relaye par [PORTEFEUILLE][Odin]. Cadrage inchange par ailleurs.


| # | Question | Options | Recommandation |
|---|---|---|---|
| **AR-1** | **Sur quel dépôt CA-5 doit-il être prouvé ?** CA-5 est littéralement écrit contre `iakaFrameGUI` (R-4), le relevé l'instruit sur `IakaCockpit`. | (a) `IakaCockpit` seul · (b) `iakaFrameGUI` seul · (c) les deux | **(a)**, **et** rectifier la rédaction de CA-5 pour dire « sur le dépôt où la preuve a été faite ». Motifs : le Cockpit offre **25 tags sans release** (F1) donc une cible neuve à coût nul, il vient de bâtir vert, et son `latest` est déjà correct. Le GUI n'a **aucun** tag libre : y refaire l'expérience coûterait un tag neuf pour un gain nul, **si** AR-2 est retenu. |
| **AR-2** | **Inscrire `.github/workflows/release.yml` au registre de convergence ?** Aujourd'hui les deux fichiers sont probablement byte-identiques et **rien ne le garde** (F8). | (a) inscrire (plancher 17 → 18) · (b) ne pas inscrire et **déclarer** que la preuve ne couvre qu'un dépôt | **(a)** — c'est ce qui **transporte** la preuve de AR-1(a) vers le GUI, et c'est exactement le geste que L41 a inventé pour ça. Coût quasi nul. Si les fichiers diffèrent, (a) devient impossible et (b) s'impose : **ne pas les aligner en passant**, ce serait un « tant qu'on y est ». |
| **AR-3** | **Accepte-t-on le risque mesuré de V-C, ou déclare-t-on l'espéré ?** | (a) V-D + V-C *(reco)* · (b) V-D seul, CA-5 clos en **« partiellement prouvé »** avec déclaration datée et condition de levée · (c) V-B sur `v0.31.2` · (d) rien, CA-5 reste dû | **(a)**. Le risque de V-C est **borné, détecté et réparable en une commande** (R1) ; il ne touche **aucun** asset et **aucun** client (F7). **(b) est une réponse légitime** si le décideur ne veut aucune fenêtre : elle doit alors être **écrite**, pas subie. **(c) est déconseillée** : elle prouve moins (R-1) pour un risque plus grand (elle modifie une release historique). |
| **AR-4** | **Le dépôt de répétition : public ou privé ? conservé ou supprimé ?** | (a) privé, conservé comme banc · (b) privé, supprimé après · (c) public | **(a)** — privé (il n'a pas d'audience) et **conservé** : c'est le seul endroit où l'on pourra rejouer cette classe d'expérience sans toucher un produit. Le garder est moins cher que le refaire. |
| **AR-5** | **Le nom du tag contrefactuel.** | (a) `contrefactuel-ca5-2026-08-29` (hors semver) · (b) `v0.31.3` (semver, inférieur) | **(a)**. (b) déclenche le `push` sur `v*` donc **la matrice complète** sans qu'on l'ait demandée, pollue la suite des versions, et fait dépendre la branche d'une **comparaison** au lieu d'une **impossibilité**. |

---

## Estimation — jalon P1→P2

**Équivalent jour-homme : ≈ 1,25 j** *(fourchette 1 à 2 j)*, dont **~45 min de gestes du décideur**
(les quatre 👤 de l'étape 4).

| Étape | Charge |
|---|---|
| 1. Rectification du mécanisme (2 dépôts) | 0,25 j |
| 2. Mesure + convergence des deux `release.yml` | 0,1 j |
| 3. Dépôt de répétition (V-D) + contrefactuel 3.3 | 0,5 j |
| 4. Procédure V-C : préparation, sonde, mesures, nettoyage | 0,25 j *(+ 45 min décideur)* |
| 5. Consignation CA-5 + backlogs | 0,15 j |

**Complexité / risque : moyenne.** Peu de code — l'essentiel est de la **mesure disciplinée** et
une expérience **à un coup**. Le risque n'est pas technique, il est de **rater la fenêtre** : la
sonde 4.4 est la seule occasion d'observer le vol, et elle ne se rejoue pas sans refaire tout le
geste.

**Inconnues susceptibles de faire glisser l'estimation**

1. **F4 — le comportement de GitHub après `make_latest=false`.** C'est l'inconnue de fond. Si le
   repli ne désigne pas `v0.32.2`, le job rougira (F5) et le lot gagne un **volet correctif non
   estimé** : la garde répare *après coup* au lieu d'empêcher, ce qui est un défaut à part entière.
2. **La fenêtre pourrait être plus longue que prévu.** F2 est déduit de l'**ordre du code** de
   `tauri-action`, pas d'une mesure : si la création de release avait lieu **avant** le build, la
   fenêtre passerait de quelques minutes à toute la durée du run. *Première chose à confirmer en
   V-D, avant de toucher au dépôt réel.*
3. **La byte-identité des deux `release.yml` est non mesurée.** Si elle est fausse, AR-2 tombe et le
   périmètre de la preuve se réduit — sans surcoût, mais avec un successeur à nommer.
4. **Le build du tag contrefactuel.** Réputé vert (même commit que `v0.32.2`), mais un cache Rust
   froid ou une dérive de runner peuvent le faire échouer : +1 relance.
5. **Quotas d'API anonymes** (60/h par IP) : les mesures de verdict sont peu nombreuses, mais une
   sonde lancée par erreur en anonyme épuise le quota et **rend la mesure finale impossible sur la
   fenêtre utile**.
6. **La dette de canal (NAS mort)** est exclue — mais si le décideur décidait d'y toucher pendant
   ce lot, l'estimation ne vaut plus.

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## Ce que ce lot ne prouvera pas, quoi qu'il arrive

À écrire dans le rapport final, **avant** de cocher quoi que ce soit :

1. Que la garde **empêche** le vol. Elle le **répare**, dans le même run, après qu'il a eu lieu
   (F2). C'est un fait de conception qu'aucune mesure ne changera — et **le contrefactuel est
   précisément ce qui le rendra visible**.
2. Que le `latest` est gardé **si le job `latest` ne tourne pas** (annulation, panne, quota). Le
   `if: always()` couvre un `build` rouge, **pas** un run annulé.
3. Que le comportement observé vaut pour **une autre version** de `tauri-action` : tout ce qui est
   établi ici l'est **au SHA `84b9d35b…`**, et le cliquet `fixtures/tauri-action-pin.json` est ce
   qui force à re-prouver au prochain SHA.
