# Installer depuis rien — la vitrine dit ce que l'étagère porte

> Cadré par 🔵 **Gandalf** le **2026-08-29**. Successeur n°2 nommé et exclu par
> `IakaCockpit/specs/instructions/cles-installeur-manifeste-updater.md` (**L40**, § Périmètre →
> Exclu, « défaut H »), reconduit par **L41**. Le décideur l'ouvre maintenant.
>
> **Tous les chiffres ci-dessous ont été mesurés le 2026-08-29**, en lecture sur le disque et par
> appels **anonymes** (sans jeton) à l'API GitHub publique. Ce qui vient du relevé reçu et que la
> mesure **contredit** est signalé en § Rectifications — quatre points, dont deux changent le
> périmètre.
>
> **Audience** : un inconnu, qui arrive sur GitHub, ne connaît ni le NAS, ni l'iakabox, ni la
> méthode, ni nos manifestes. Le seul critère de ce lot est **ce qu'il obtient en suivant ce qu'on
> lui montre**.

---

## Problème

Les trois dépôts publics du portefeuille annoncent, dans leur `README`, une **version scellée qui
n'est plus la bonne**, et GitHub présente comme **« Latest »** une release qui n'est pas la plus
haute. Un visiteur qui suit la page d'accueil télécharge donc une version périmée — et, dans un
cas mesuré, **ne trouve aucun fichier à télécharger du tout**.

Le défaut de fond n'est pas l'écart de numéro. C'est que **la vitrine et l'étagère ne sont reliées
par rien** : le `README` est de la prose recopiée à la main, la release est produite par un CI, le
`latest` est décidé par GitHub, et **aucun des trois ne rougit** quand ils divergent. C'est
exactement la classe de défaut que L41 a passé sa journée à supprimer ailleurs.

---

## Faits établis — mesurés le 2026-08-29

### F0 — Les trois dépôts sont bien publics ; un quatrième ne l'est pas

`GET https://api.github.com/repos/iakasju/IakaCockpit` en **anonyme** → `private: false`,
`visibility: "public"`, `default_branch: "main"`, `pushed_at: 2026-08-29T08:53:00Z`. Idem pour
`iakaframe` et `iakaFrameGUI` (releases lues sans jeton). L'audience visée peut donc réellement
tout voir. **En revanche `iakasju/iakaTokenCounter` rend 404 en anonyme** — cf. F5.

### F1 — Les trois README annoncent une version périmée (défaut **H-1**)

| Dépôt | README annonce | Version portée par le dépôt | Plus haut tag local | Release `latest` (mesurée) |
|---|---|---|---|---|
| `iakaframe` (CLI) | **v0.20.4** (`README.md:15`) | **0.39.0** (`cli/package.json:3`) | **v0.20.4** | v0.20.4 |
| `IakaCockpit` | **v0.31.2** (`README.md:18`) | **0.32.1** (`package.json:4`) | v0.32.1 | v0.32.1 |
| `iakaFrameGUI` | **v0.1.4** (`README.md:19`) | **0.1.7** (`package.json:4`) | v0.1.7 | **v0.1.6** |

L'écart va d'**une** version (Cockpit) à **dix-neuf mineures** (la CLI).

### F2 — Le `latest` de GitHub désigne une version **antérieure** (défaut **H-2**)

`GET /repos/iakasju/iakaFrameGUI/releases/latest` (anonyme) → **`v0.1.6`**, alors que `v0.1.7`
existe, n'est ni brouillon ni pré-release. Les dates mesurées :

| Tag | `created_at` | `published_at` |
|---|---|---|
| v0.1.7 | 2026-08-13T16:04:04Z | 2026-08-13T16:09:12Z |
| v0.1.6 | 2026-08-10T17:34:35Z | **2026-08-18T18:51:08Z** |
| v0.1.5 | 2026-08-10T16:56:09Z | 2026-08-18T18:50:33Z |

**Ce que ces chiffres démontrent, et qui rectifie la description reçue** : le classement **ne suit
pas `created_at`** — `v0.1.7` y est postérieure à `v0.1.6` (13/08 > 10/08) et perd quand même. Il
ne suit pas non plus le numéro de version. Il suit **la dernière écriture de release**, dont
`published_at` est le reflet. Cf. F3 pour le mécanisme réel.

`IakaCockpit` n'a pas le problème aujourd'hui (`v0.32.1` est à la fois la plus haute et la plus
récemment écrite) — **et rien ne l'en protège** : la même republication d'un tag ancien
reproduirait le défaut à l'identique.

### F3 — Le mécanisme, vérifié sur la documentation GitHub

- La doc REST de « Get the latest release » énonce : *« The latest release is the most recent
  non-prerelease, non-draft release, sorted by the created_at attribute. »* **Cette phrase décrit le
  mode `legacy`, pas le comportement par défaut** — la mesure F2 la contredit frontalement.
- « Create a release » et « Update a release » exposent un paramètre **`make_latest`**, valeurs
  `true` / `false` / **`legacy`**, **défaut `true`**, décrit comme *« whether this release should be
  set as the latest release for the repository »*, `legacy` signifiant *« determined by creation date
  and semantic version »*.

⇒ **Il existe bien un moyen de désigner explicitement la release « latest ».** Ce n'est donc pas
une fatalité à laquelle on oppose de la discipline de dates : c'est un **champ qu'on n'a jamais
piloté**, et que chaque publication écrase à `true` par défaut. Republier un vieux tag **vole** le
`latest` — c'est très exactement l'histoire de `v0.1.5`/`v0.1.6` republiées le 18/08 après `v0.1.7`
du 13/08.

**Ce dont nos deux chaînes disposent** (lu dans les `action.yml`) :

- `tauri-apps/tauri-action` **au SHA épinglé par L41** (`84b9d35b…`, action-v0.6.2) — inputs :
  `releaseId, tagName, releaseName, releaseBody, releaseDraft, prerelease, releaseCommitish,
  projectPath, distPath, iconPath, appName, appVersion, includeDebug, includeRelease,
  includeUpdaterJson, updaterJsonPreferNsis, updaterJsonKeepUniversal, tauriScript, args,
  retryAttempts, bundleIdentifier, owner, repo, githubBaseUrl, isGitea, assetNamePattern,
  uploadPlainBinary, generateReleaseNotes`. **Aucune entrée `make_latest`.** On ne peut donc pas
  piloter le `latest` *depuis l'appel de l'action* aux deux apps.
- `softprops/action-gh-release` (utilisé par `iakaframe/.github/workflows/release.yml:40`) **déclare
  `make_latest`** : *« Specifies whether this release should be set as the latest release for the
  repository. Drafts and prereleases cannot be set as latest. Can be `true`, `false`, or `legacy`.
  Uses GitHub api default if not provided »*.
- `gh release edit <tag> --latest` — *« Explicitly mark the release as 'Latest' »*. Disponible sur
  tous les runners GitHub.

### F4 — La ligne de version d'`iakaframe` s'est tue (défaut **H-3**)

Tags du dépôt, lus sur le disque : `v0.5.0`, `v0.6.0`, `v0.6.1` (`.git/packed-refs`), puis
`v0.20.0` … **`v0.20.4`** (`.git/refs/tags/`). **Huit tags, le dernier remontant au 2026-08-04**
(release `v0.20.4`, `published_at: 2026-08-04T10:19:11Z`). Pendant ce temps :

- `cli/package.json:3` = **0.39.0** ;
- `specs/etat-des-lieux.md:10` = **v0.39.0**, et son journal porte les clôtures intermédiaires
  (v0.22.0, v0.23.0, v0.24.0, v0.29.0, v0.35.0, v0.36.0, v0.39.0…) ;
- l'unique asset de la dernière release est **`naonedge-iakaframe-0.20.4.tgz`** (310 643 octets).

Le travail a donc bien eu lieu et la version interne a bien monté — **c'est la publication qui
s'est arrêtée**. Nuance importante, et elle change le remède : la ligne de version interne
d'`iakaframe` **n'est pas cassée**, elle est saine depuis le lot `dette-version-source-unique.md`
(autorité = `cli/package.json`, garde `cli/test/guard-version-source-unique.test.js`). Ce qui
manque, c'est **le lien entre la version d'autorité et l'acte de publication** : rien, nulle part,
ne rougit quand le dépôt bumpe dix-neuf fois sans jamais taguer.

### F5 — La vitrine promet des fichiers qui n'existent pas, et tait ceux qui existent (défaut **H-4**, *neuf*)

Ce défaut n'était pas au relevé reçu. Il est **le plus grave pour l'audience visée**, parce qu'il
survit à la correction de H-1 : corriger le numéro de version ne corrige **pas** les lignes du
tableau de téléchargement.

**Assets réellement présents** (noms exacts, lus en anonyme) :

| Release | Assets mesurés |
|---|---|
| `IakaCockpit` **v0.32.1** *(celle que GitHub présente comme « Latest »)* | `IakaCockpit-0.32.1-1.x86_64.rpm(.sig)`, `IakaCockpit_0.32.1_amd64.AppImage(.sig)`, `IakaCockpit_0.32.1_amd64.deb(.sig)`, `IakaCockpit_0.32.1_x64-setup.exe(.sig)`, `IakaCockpit_0.32.1_x64_en-US.msi(.sig)`, `IakaCockpit_aarch64.app.tar.gz(.sig)`, `IakaCockpit_x64.app.tar.gz(.sig)`, `latest.json` — **16 assets, AUCUN `.dmg`** |
| `IakaCockpit` v0.31.2 *(celle qu'annonce le README)* | contient bien `IakaCockpit_0.31.2_aarch64.dmg` et `IakaCockpit_0.31.2_x64.dmg` — **et aucun `.sig`** |
| `iakaFrameGUI` **v0.1.7** | `iakaFrameGUI_0.1.7_aarch64.dmg`, `iakaFrameGUI_0.1.7_x64.dmg`, `…_x64-setup.exe(.sig)`, `…_x64_en-US.msi(.sig)`, `…_amd64.deb(.sig)`, `…-0.1.7-1.x86_64.rpm(.sig)`, `…_amd64.AppImage(.sig)`, `iakaFrameGUI_{aarch64,x64}.app.tar.gz(.sig)`, `latest.json` |

**Trois mensonges qui en découlent, et un silence :**

1. **Un visiteur macOS du Cockpit ne peut rien télécharger.** Le README promet
   `IakaCockpit_0.31.2_aarch64.dmg` et `IakaCockpit_0.31.2_x64.dmg` sous le titre *« Tous les
   systèmes sont couverts »* ; la release que GitHub lui présente (`v0.32.1`) **ne porte aucun
   `.dmg`**. La cause de cette absence n'est **pas** établie par ce cadrage (le CI a bien une
   matrice macOS) — elle est **déclarée**, pas comblée : cf. § Exclu et R3.
2. **Le nom du DMG du GUI est faux dans sa forme, pas seulement dans sa version.** README :
   `iakaFrameGUI_v0.1.4_macos-arm64.dmg` (`README.md:30`). Réel : `iakaFrameGUI_0.1.7_aarch64.dmg`
   — ni `v`, ni `macos-arm64`. Corriger « 0.1.4 → 0.1.7 » laisserait la ligne fausse.
3. **Le GUI produit un DMG macOS Intel que son README n'annonce pas** (`iakaFrameGUI_0.1.7_x64.dmg`,
   aucune ligne « macOS Intel » dans le tableau, là où le Cockpit en a une).
4. **La CLI ignore l'artefact que sa propre chaîne produit.** `iakaframe/.github/workflows/release.yml`
   fabrique `naonedge-iakaframe-<v>.tgz` en écrivant en commentaire *« installable par
   `npm install -g <fichier>.tgz` sur les trois OS »* — et le README (`:21-38`) n'en dit **rien** :
   il envoie le visiteur chercher l'archive *source*, la décompresser, et faire
   `npm install -g ./cli`. Le chemin le plus court et le plus sûr est produit puis tu.

### F6 — L'asset `latest.json` concurrent est encore là

Mesuré : `latest.json` figure toujours dans les assets de `iakaFrameGUI v0.1.7` (13/08) et de
`IakaCockpit v0.32.1` (publiée le **2026-08-28 17:05**). C'est **cohérent** avec L40/L41 : ces deux
releases précèdent le correctif `includeUpdaterJson: false`
(`iakaFrameGUI/.github/workflows/release.yml:127`). La **première release passée par le workflow
corrigé** doit en être dépourvue — ce lot le mesure au passage (CA-13), il ne le corrige pas.

---

## Rectifications au relevé reçu

1. **« GitHub classe par date de publication » — vrai en effet, faux en mécanisme, et le remède
   change.** Le classement observé ne suit ni le numéro de version ni `created_at` (F2) ; il suit un
   **drapeau explicite `make_latest`, de défaut `true`**, réécrit à chaque publication (F3). Il ne
   faut donc **pas** « s'en remettre à la discipline des dates » : il faut **piloter le champ**. Le
   point 3 du brief est répondu : **oui, GitHub expose un moyen de désigner explicitement le
   `latest`** — `make_latest` (API, et input de `softprops`), `gh release edit --latest` (CLI).
2. **Les comptes d'assets du relevé sont inexacts.** Mesuré : `iakaFrameGUI` `latest` = v0.1.6 (et
   non « v0.1.6, 17 assets » : 17 est le compte de **v0.1.7**) ; `IakaCockpit v0.32.1` porte **16**
   assets et non 15, et surtout **zéro `.dmg`** là où le relevé annonçait « 2 mac ». Ces deux
   `.app.tar.gz` mac sont des **artefacts d'updater**, pas des installeurs : ils ne se
   double-cliquent pas.
3. **Il n'y a pas trois défauts mais quatre**, et le quatrième (**H-4**, F5) est celui qui touche le
   plus durement l'audience : *un visiteur macOS du Cockpit repart les mains vides*. Il survit
   intégralement à la correction de H-1 et de H-2.
4. **La convention d'accueil ne touche pas trois dépôts mais au moins quatre.**
   `iakaTokenCounter/README.md:22` porte la **même** section *« La version scellée courante est
   … »*, pointant `https://github.com/iakasju/iakaTokenCounter/releases/tag/v0.1.0` — et
   `api.github.com/repos/iakasju/iakaTokenCounter` rend **404 en anonyme**. Sa vitrine promet donc à
   un inconnu une page qui n'existe pas. Ce dépôt est **hors périmètre** (cf. Exclu), mais il change
   la **nature** du lot : on ne répare pas trois README, on répare **une convention de portefeuille**
   appliquée à N dépôts. C'est ce qui commande l'arbitrage **AR-5** (où vit l'instruction).
5. **Sur H-3, le diagnostic « la chaîne de publication s'est tue » est exact ; « la ligne de version
   est portée par les tags » ne l'est plus.** Depuis `dette-version-source-unique.md`, l'autorité
   d'`iakaframe` est **`cli/package.json`** ; les tags en sont un **miroir** (D1/D4 de ce lot), et une
   garde vivante (`cli/test/guard-version-source-unique.test.js`) tient déjà l'alignement
   `package.json` ↔ `-v` ↔ état des lieux. Le trou n'est donc **pas** dans la convention de version :
   il est dans le fait que **rien ne relie l'autorité à l'acte de publier**. Ça retire une option de
   la table (« changer la convention » est déjà fait) et en ajoute une (« garder l'écart
   autorité ↔ publié »).

---

## Où ce lot se situe par rapport au bundle complet — la question de périmètre, tranchée

Référence : `iakaframe/specs/instructions/bundle-complet-install-4-composants.md` (lot **0** livré le
2026-08-28 ; lots **A/B/C** à faire ; total réévalué **≈ 12,5 j** (9–18)).

**Ce lot n'est pas un morceau du lot A, et il ne rend pas le bundle inutile. Il le précède, et il en
retire l'urgence.** Trois raisons, dans cet ordre :

1. **Ce ne sont pas les mêmes objets.** Le bundle construit un **verbe `install`** (qui n'existe pas :
   `iakaframe --help` n'expose aucun `install`), un **enchaînement à quatre étapes**, un **rollback**
   et une **façade graphique**. Ce lot-ci ne construit **aucun installeur** : il rend **vraie** la
   page qu'on montre à un inconnu. On peut livrer l'un sans l'autre dans les deux sens.
2. **Ce ne sont pas les mêmes audiences ni les mêmes canaux.** Le **lot 0** du bundle traite le
   **triple canal LAN + GitHub** — iakabox, NAS, GitHub — pour un usage **interne** (checkpoint, npm
   privé, updater). L'audience d'ici ne voit **que GitHub** : les deux forges LAN lui sont
   inaccessibles par construction. Les deux lots ne se recouvrent donc pas, même là où ils parlent
   tous deux de « canal ».
3. **Mais l'ordre n'est pas indifférent.** Le bundle promet une installation en un geste ; ce lot
   garantit qu'une installation **à la main, en quatre gestes exacts**, aboutit. **Un installeur bâti
   au-dessus d'une vitrine qui ment ne fait qu'automatiser le mensonge** — il téléchargerait, lui
   aussi, la version que `latest` désigne. CA-3 et CA-8 de ce lot sont des **prérequis de fait** des
   lots A et B.

**Ce que le décideur ouvre en validant ceci : ≈ 3 j, pas 12.** Et il en tire une information utile
avant d'engager les 12 : une fois ce lot livré, la question « le bundle vaut-il 12 jours ? » se pose
sur un produit **déjà installable depuis rien, manuellement**. Le bundle devient un gain de
**confort et d'enchaînement**, plus une condition d'existence. C'est une réévaluation que je
**recommande de faire à la clôture de ce lot**, pas maintenant.

---

## Décision retenue

Une règle unique, appliquée aux trois dépôts, et **deux faces de garde** — la forme éprouvée par
L40/L41 :

> **La version annoncée est DÉRIVÉE, jamais recopiée. Et ce qu'on annonce doit exister.**

- **Face locale (dans le gate, hors réseau, déterministe).** La section *Installation* du README est
  **produite par un script versionné** à partir de (a) la **version d'autorité** du dépôt et (b) une
  **table de motifs de noms d'artefacts** versionnée. Le gate rejoue la génération **en mémoire** et
  compare **au fichier sur disque** : toute dérive est rouge, au commit qui l'introduit. Aucune
  comparaison à la sortie d'une autre commande — la discipline de L41 s'applique telle quelle.
- **Face en ligne (hors gate, anonyme, `SKIP` propre sans réseau).** Une commande interroge l'API
  GitHub **sans jeton** — comme le ferait le visiteur — et vérifie **trois égalités** :
  la version annoncée par le README **=** le plus haut tag publié **=** la release marquée
  `latest` ; **et** chaque fichier annoncé par le README **existe** comme asset de cette release ;
  **et** aucun asset installable n'est **passé sous silence**.

C'est le **cliquet README ↔ dernier tag ↔ `latest`** que le brief appelle : il n'est pas
décoratif, il est **la seule chose de ce lot qui empêche le défaut de revenir**. Un README qui se
périme en silence est un défaut ; un README qui se périme **en rougissant** est une dette visible.

**Le `latest` cesse d'être subi** : il est **désigné explicitement** à la publication (F3), et la
désignation est **conditionnée au plus haut semver** du dépôt, pour qu'une republication d'un tag
ancien ne puisse plus le voler.

---

## Périmètre

### Inclus

- **V1 — README dérivé, dans les trois dépôts.** Un générateur + une table de motifs par famille ;
  la section *Installation* devient une zone **entre marqueurs**, régénérée, jamais éditée à la main.
- **V2 — Le cliquet, deux faces**, dans les trois dépôts : locale dans la suite du gate, en ligne
  hors gate avec `SKIP` sans réseau.
- **V3 — Maîtrise du `latest`** : désignation explicite à la publication, conditionnée au plus haut
  semver ; **et** re-désignation immédiate de `iakaFrameGUI v0.1.7` (acte du décideur, § Gate humain).
- **V4 — Reprise de la ligne de publication de la CLI** (H-3) : selon **AR-4**, une release neuve
  d'`iakaframe` depuis la version d'autorité, et un README qui pointe **le `.tgz`** produit par le CI.
- **V5 — L'inventaire honnête** (H-4) : ce que le README annonce est **dérivé de ce que la release
  porte réellement** ; une plateforme non produite est **déclarée manquante**, jamais promise.
- **Entrée de backlog** dans les **trois** dépôts, pointant l'instruction par chemin absolu
  (conséquence d'AR-5, quel que soit le verdict).

### Exclu — explicitement, et sans « tant qu'on y est »

- **Produire le `.dmg` manquant du Cockpit.** C'est un défaut de **build/CI** dont ce cadrage
  n'établit pas la cause. Ce lot le **déclare** (le README cesse de le promettre, la face en ligne le
  compte comme trou) ; il ne touche **ni la matrice du CI, ni le bundler**. Lot successeur nommé :
  « le Cockpit ne produit plus de DMG ».
- **L'étape 5.1 de L40** (bump + tag + run CI sur les deux apps) et les **deux recettes réelles**
  Windows MSI / Linux `.deb` : actes du décideur, toujours dus. **Ce lot les croise sans les
  absorber** — articulation en § Articulation avec L40.
- **Les 5 défauts au registre de L41** (fermeture de `version` côté Cockpit ; `notes` et `pub_date`
  reculée non couverts ; échange de lignes du registre ; résolution du frère par énumération ; le
  rouge observé une fois et non reproduit en 11 passes). Aucun n'est prérequis d'ici.
- **La rotation du jeton iakabox** et la suppression de `feat/L0-CONTIENT-UN-JETON-NE-PAS-POUSSER`.
- **L'absence d'eslint et de tsconfig sur `iakaframe`**.
- **Le défaut d'`iakaframe jalon`** (`allowPositionals: true` accepte un positionnel et le jette en
  silence) — lot propre, à cadrer sur pièce.
- **`iakaTokenCounter`** (F5/rectification 4) : même défaut de classe, mais dépôt **absent de
  GitHub**. Le régler suppose d'abord de décider s'il doit y être — décision de portefeuille, pas de
  cadrage technique. Nommé, exclu.
- **Généraliser la garde à tout le portefeuille** (par ex. un verbe `iakaframe vitrine --check`
  utilisable par n'importe quel projet). Tentant, et prématuré : trois implantations d'abord, la
  généralisation quand on saura ce qui se répète. Successeur nommé.
- **Le triple canal LAN** (lot 0 du bundle) : hors sujet ici, l'audience ne voit que GitHub.
- **Toute traduction anglaise du README**, toute refonte de son contenu hors section *Installation*.

---

## Étapes d'implémentation

### Étape 0 — Re-mesurer avant de générer quoi que ce soit

0.1 Pour **chacun** des trois dépôts, en **anonyme, sans jeton** (c'est le point de vue de
l'audience), relever : la release `latest`, la liste **complète et exacte** des noms d'assets de la
release la plus haute, et le plus haut tag publié. Écrire le relevé brut dans le rapport
d'exécution. **C'est ce relevé — et rien d'autre — qui détermine les tables de motifs de l'étape 1.**

```bash
gh api repos/iakasju/<repo>/releases/latest --jq '.tag_name'
gh api repos/iakasju/<repo>/releases --jq '.[] | "\(.tag_name)\t\(.created_at)\t\(.published_at)\t\(.assets|length)"'
gh api repos/iakasju/<repo>/releases/tags/<tag> --jq '.assets[].name'
```

0.2 **Confronter au présent document.** Les noms d'assets cités en F5 ont été relevés le 2026-08-29 ;
s'ils ont bougé, c'est **la mesure du jour** qui fait foi, et l'écart est consigné.

### Étape 1 — La table de motifs (versionnée, partagée entre les deux apps)

1.1 Créer `fixtures/vitrine-assets.json` dans **chaque** app, **byte-identique** entre les deux —
même dispositif que `fixtures/updater-cles.json` (AR-6 de L40), même entrée au registre de
convergence. Il énumère, pour chaque plateforme annoncée : le **motif de nom** (`{APP}` et `{V}`
substitués), le **libellé** affiché au visiteur, et sa **raison d'être** dans la vitrine.

Motifs mesurés à reprendre (les deux apps ne diffèrent que par `{APP}`) :

| Plateforme | Motif |
|---|---|
| Windows (installeur) | `{APP}_{V}_x64-setup.exe` |
| Windows (MSI) | `{APP}_{V}_x64_en-US.msi` |
| macOS Apple Silicon | `{APP}_{V}_aarch64.dmg` |
| macOS Intel | `{APP}_{V}_x64.dmg` |
| Linux Debian/Ubuntu | `{APP}_{V}_amd64.deb` |
| Linux Fedora/RHEL | `{APP}-{V}-1.x86_64.rpm` |
| Linux portable | `{APP}_{V}_amd64.AppImage` |

> ⚠️ `{APP}_aarch64.app.tar.gz` et `{APP}_x64.app.tar.gz` **ne sont pas des installeurs** : ce sont
> les charges de l'updater, **sans numéro de version dans le nom**. Ils **n'entrent pas** dans la
> vitrine, et la face en ligne doit les **exclure explicitement** de son contrôle « asset installable
> non annoncé », faute de quoi elle rougira à tort à chaque passage.

1.2 Côté `iakaframe`, la table est triviale et vit à part (une seule ligne utile) :
`naonedge-iakaframe-{V}.tgz`, plus le chemin « archive source » déjà documenté.

### Étape 2 — Le générateur, et la zone entre marqueurs

2.1 Encadrer la section *Installation* de chaque README par deux marqueurs HTML stables
(`<!-- vitrine:debut -->` / `<!-- vitrine:fin -->`). **Tout ce qui est entre les marqueurs est
généré ; tout ce qui est en dehors reste de la prose humaine** (les avertissements macOS non signé,
Linux `chmod +x`, la section « construire depuis les sources » — qui, elle, contient aussi la
version : la traiter par le même geste de substitution, pas par une seconde mécanique).

2.2 Écrire le générateur — **fonction pure** d'un côté, appelant mince de l'autre, précédent explicite
du dépôt (`scripts/lib/update-manifest.mjs`, `scripts/lib/verifier-mesures.mjs`) :
`rendreVitrine({ app, version, table, absents })` → le texte de la section. Aucune I/O, aucun réseau.
Deux modes en ligne de commande : `--write` (réécrit le README) et `--check` (compare et rend un
code de sortie).

2.3 `absents` est le champ qui **empêche de mentir** : une plateforme de la table dont l'artefact
n'existe pas sur la release **n'est pas affichée comme téléchargeable** ; elle apparaît en clair
comme **non fournie pour cette version**, avec sa raison. C'est ainsi que le DMG manquant du Cockpit
devient **visible** au lieu d'être promis.

### Étape 3 — Face locale du cliquet (dans le gate, hors réseau) — rouge d'abord

3.1 **Écrire l'exploit avant le correctif**, sur fixture : un README dont la version annoncée diverge
de la version d'autorité **passe** aujourd'hui. Capturer le vert. C'est la preuve que la garde
n'existait pas.

3.2 Poser la garde : re-générer en mémoire, comparer **au README versionné**, échouer en **nommant la
ligne fautive** et en **dictant la commande de sortie** (`node scripts/vitrine.mjs --write`) — même
forme que le message d'`assertVersionsAligned` (`iakaFrameGUI/scripts/publish-update.mjs:190-195`).

3.3 **Rattacher la garde à ce qui existe déjà, ne pas créer un troisième mécanisme :**
- `iakaFrameGUI` — le README devient un **porteur de version** de plein droit : entrée dans
  `VERSION_CARRIERS` (`scripts/publish-update.mjs:121-147`) **avec sa raison**, câblage dans
  `readRepoVersions`, et le **cliquet existant** (clés lues ≡ clés déclarées) le vérifie sans une
  ligne de plus.
- `IakaCockpit` — la garde équivalente est `checkVersionAlignment`
  (`scripts/lib/update-manifest.mjs:110-122`), qui couvre **quatre** sources (tag, `package.json`,
  `tauri.conf.json`, `Cargo.toml`) et **n'a ni registre de raisons, ni `VERSION_NON_CARRIERS`, ni
  cliquet**. ⚠️ **Divergence préexistante** : ce lot y ajoute le README **sans** importer tout le
  dispositif du GUI (ce serait un autre lot). Le dire, ne pas le masquer.
- `iakaframe` — étendre `cli/test/guard-version-source-unique.test.js` d'un **G5** :
  `README.md` annonce **exactement** `v` + `cli/package.json.version`.

3.4 **Contrefactuel obligatoire** dans les trois : altérer la version dans une **fixture** (jamais
dans le vrai README) et constater le rouge, avec le nom du fichier fautif dans le message.

### Étape 4 — Face en ligne du cliquet (hors gate, anonyme)

4.1 Un script versionné par dépôt, **sans jeton**, qui rend un verdict sur quatre points et **nomme
chaque écart** :
- E-1 : `latest` **=** le plus haut tag publié (sinon : « `latest` désigne vX alors que vY existe ») ;
- E-2 : la version du README **=** `latest` ;
- E-3 : **chaque** fichier annoncé existe comme asset de cette release ;
- E-4 : **aucun** asset installable de la release n'est absent du README (à l'exclusion des
  `.app.tar.gz`, des `.sig` et de `latest.json`).

4.2 **`SKIP` propre sans réseau** — sortie explicite « non mesuré, réseau indisponible », **jamais un
vert**. Un contrôle qui verdit quand il n'a rien mesuré est le pire des faux verts (précédent
`test:convergence`).

4.3 **Un `200` ne suffit pas** : E-3 vérifie l'**existence de l'asset par son nom**, pas la
joignabilité d'une URL de page.

### Étape 5 — Maîtrise du `latest`

5.1 **`iakaframe`** — `.github/workflows/release.yml:40`, `softprops/action-gh-release@v2` : poser
`make_latest` explicitement, **calculé** (vrai si et seulement si le tag publié est le plus haut
semver du dépôt), jamais laissé au défaut.

5.2 **Les deux apps** — le SHA de `tauri-action` épinglé par L41 **n'expose aucune entrée** (F3). Le
`latest` se règle donc dans une **étape distincte du workflow, après** l'action, par
`gh release edit "$TAG" --latest` (ou `--latest=false` si le tag publié n'est pas le plus haut).
⚠️ **Ne pas dé-épingler ni bouger le SHA** : `fixtures/tauri-action-pin.json` et
`scripts/__tests__/pin-tauri-action.test.mjs` sont au registre de convergence et rougiraient — à
raison.

5.3 🛑 **RECTIFIÉE LE 2026-08-30 (L43) — CETTE ÉTAPE PRESCRIVAIT UNE PHRASE FAUSSE, ET ORDONNAIT DE
LA RECOPIER DANS LES TROIS `CLAUDE.md`.** Il était écrit : *« Documenter, dans les trois
`CLAUDE.md`, la règle en une phrase : republier un tag ancien vole le `latest` ; l'étape 5.2 est ce
qui l'en empêche. »* **Ses deux moitiés sont réfutées par L43** :
- **(a) Republier ne vole rien** au SHA épinglé : `getOrCreateRelease` rend la release existante
  **sans aucun `updateRelease`** (F3, lu dans la source du SHA). C'est la **CRÉATION** d'une
  release qui prend le drapeau — `createRelease` est appelé **sans** `make_latest`, donc au défaut
  `true`. C'est R-1 de L43.
- **(b) L'étape 5.2 n'empêche rien** : elle s'exécute **après** l'action, donc **après** la
  création. Et elle ne répare pas davantage **sous la seule règle de repli survivante** au
  contrefactuel du 2026-08-30 — huit des neuf règles énumérées y sont réfutées, le NO-OP survit
  seul, **et une règle non énumérée reste possible**.

**Ce qui est à documenter, et qui l'EST DÉJÀ** dans les trois `CLAUDE.md` rectifiés par ce lot :
*créer une release prend le drapeau ; l'étape 5.2 ne l'empêche pas et, dans les limites énumérées,
ne le répare pas — elle **détecte**, **rougit** et **dicte** le rattrapage.* Cette étape n'ordonne
donc plus rien : elle **enregistre** ce que les trois fichiers portent, et **interdit** de
réintroduire la phrase d'origine.

### Étape 6 — La CLI reprend sa ligne de publication (sous réserve d'AR-4)

6.1 Taguer et publier depuis la **version d'autorité** (`cli/package.json` = 0.39.0 au jour du
cadrage), avec des **notes de release qui assument l'agrégat** : cette version regroupe les lots
v0.21.0 … v0.39.0, non publiés individuellement, dont le détail vit dans le journal de
`specs/etat-des-lieux.md`. **Le trou de tags est déclaré, pas maquillé.**

6.2 Réécrire la section *Installation* du README par le générateur : la voie **recommandée** devient
`npm install -g naonedge-iakaframe-<v>.tgz` depuis l'asset de la release (le chemin que le CI
produit déjà) ; la voie « archive source + `npm install -g ./cli` » est **conservée en second**,
et la ligne sur le registre npm privé `@naonedge` est **explicitement marquée comme réservée au
réseau interne** — elle ne sert pas l'audience de ce lot.

### Étape 7 — Republier, re-mesurer, et seulement alors déclarer

7.1 Publier une version neuve de chaque app **par la chaîne existante** (cf. § Articulation avec L40 :
c'est **la même publication** que l'étape 5.1 de L40, pas une seconde).

7.2 Rejouer **les deux faces** du cliquet dans les trois dépôts, et **citer les chiffres**.

7.3 Toute promesse encore invérifiable **rougit** : soit on retire la ligne du README, soit on
l'inscrit comme **absente déclarée** (motif, date, condition de levée) — jamais on ne la laisse
verte par commodité.

---

## Fichiers concernés

**`iakaframe`**
- `README.md:13-46` — section *Installation* entre marqueurs, générée ; le `.tgz` promu voie
  recommandée ; la mention du registre `@naonedge` bornée au réseau interne.
- `cli/test/guard-version-source-unique.test.js` — **G5** : README ≡ `v` + autorité, + contrefactuel.
- `.github/workflows/release.yml:39-45` — `make_latest` explicite sur `softprops/action-gh-release`.
- `specs/instructions/installer-depuis-rien.md` — **ce fichier**.
- `CLAUDE.md` — backlog + la commande de vitrine documentée.
- **NOUVEAU** — le générateur et son appelant (emplacement à choisir en cohérence avec
  `cli/scripts/bundle.js` ; le README visé est celui de la **racine**, pas celui de `cli/`).

**`IakaCockpit`**
- `README.md:16-38` — section générée ; **les deux lignes `.dmg` cessent d'être promises** tant que
  la release ne les porte pas.
- `scripts/lib/update-manifest.mjs:110-122` — `checkVersionAlignment` accueille le README.
- `fixtures/vitrine-assets.json` — **NOUVEAU**, byte-identique avec le GUI.
- `fixtures/convergence.sha256` — deux à quatre entrées de plus (table, générateur, garde, et la
  copie d'instruction si **AR-5 = (a)**).
- `.github/workflows/release.yml` — étape `gh release edit` après `tauri-action`.
- `scripts/__tests__/` — garde locale + son contrefactuel ; `package.json` — le script de la face en
  ligne, et son branchement dans `scripts/quality.sh`.

**`iakaFrameGUI`** — mêmes fichiers, plus :
- `README.md:17-38` — **trois** lignes fausses à reprendre, pas une : le nom du DMG arm64
  (`:30`), l'absence de ligne macOS Intel, et la version.
- `scripts/publish-update.mjs:121-147` — `VERSION_CARRIERS` accueille le README **avec sa raison** ;
  câblage dans `readRepoVersions` (le cliquet existant fait le reste).

**Ne pas toucher** : `updater/latest.json` et le manifeste (sortie de publication, il retarde
légitimement — c'est écrit dans `VERSION_NON_CARRIERS`) · `src-tauri/tauri.conf.json` (endpoints,
pubkey) · `fixtures/tauri-action-pin.json` et le SHA épinglé · `FORGEJO_BASE` / `ARTEFACT_BASE` ·
la matrice de build du CI · `packages/core/package.json`.

---

## Risques

- **R1 — Le générateur devient lui-même une source de mensonge.** S'il tire ses noms d'une table
  figée et que le bundler change de convention de nommage, le README ment de nouveau — en silence
  cette fois, puisque la face locale sera verte (elle compare deux dérivés du même faux).
  *Mitigation* : c'est **précisément** le rôle de la face **en ligne** (E-3/E-4). Elle est la seule
  qui confronte la table au monde réel ; sans elle, ce lot ne livre qu'un joli mensonge cohérent.
  À dire tel quel dans le code.
- **R2 — La face en ligne rougit en permanence à cause du DMG manquant du Cockpit.** Une garde
  toujours rouge devient un bruit qu'on cesse de lire — le contraire du but.
  *Mitigation* : le mécanisme d'**absent déclaré** (7.3) rend le trou **vert-avec-mention** tant
  qu'il est inscrit, et **rouge** dès qu'un artefact déclaré absent réapparaît. Cliquet
  auto-destructeur, calqué sur `HORS_COUVERTURE` de L41.
- **R3 — La cause de l'absence de DMG n'est pas connue.** Ce lot la contourne (on cesse de promettre)
  sans la comprendre. Si la cause est un échec silencieux du job macOS, elle frappera aussi le GUI
  au prochain build. *Mitigation* : successeur nommé et **estimé séparément** ; le rapport
  d'exécution consigne l'observation, pas un diagnostic.
- **R4 — Fenêtre entre le bump et la publication.** Si le README est un **porteur** (AR-1 reco), il
  annonce une version dont la release n'existe pas encore pendant les minutes du CI. *Mitigation* :
  le geste est atomique côté dépôt (`npm version` bump + README + commit + tag), et la fenêtre se
  ferme à la fin du run. **À déclarer** ; c'est le prix assumé de l'option, pas un oubli.
- **R5 — Trois implantations pour une seule règle.** Deux gardes de version déjà divergentes (GUI
  riche, Cockpit pauvre) plus la garde `node:test` de la CLI : la règle sera écrite **trois fois**.
  *Mitigation* : la **table** est partagée entre les deux apps (registre de convergence) ; la CLI
  reste à part **par nature** (autre artefact, autre harnais). Ne pas chercher à unifier les trois
  dans ce lot — c'est le successeur « verbe de portefeuille », explicitement exclu.
- **R6 — `gh` indisponible ou sans droit sur le runner.** L'étape 5.2 échouerait après une
  publication réussie, laissant un `latest` faux **et** un workflow rouge. *Mitigation* : l'étape est
  **non bloquante pour les artefacts** (elle vient après) et son échec doit **nommer la commande
  manuelle de rattrapage** (`gh release edit <tag> --latest`).
- **R7 — Chaque validation coûte une publication réelle** sur trois dépôts. Le lot ne se termine pas
  sans elle. Mutualisée avec L40 §5.1 pour les deux apps ; la CLI en ajoute une.

---

## Critères d'acceptation

> Discipline reprise de L40/L41 : une garde s'écrit **rouge d'abord** ; une preuve se compare à un
> **fichier versionné**, jamais à la sortie d'une autre commande ; un `200` ne suffit pas ; une
> exception ne survit pas à sa raison d'être ; **un « OK » sans chiffre vaut FAIL**.
> Commandes par dépôt : Cockpit → `npm run test`, `bash scripts/quality.sh` ;
> GUI → `npm run test:all`, `npm run lint:all` ; CLI → `npm test` dans `cli/`.
> Les mesures en ligne se font **en anonyme, sans jeton** — c'est le point de vue de l'audience.

### Le README dit vrai (H-1)

- [ ] **CA-1** — Dans **chacun** des trois dépôts, la version annoncée par le README est **égale** à
      la version d'autorité du dépôt. *Vérif* : la garde locale du dépôt (Cockpit `npm run test` ;
      GUI `npm run test:all` ; CLI `npm test` dans `cli/`), test **nommé**, pas un compte.
- [ ] **CA-2** — **Rouge d'abord** : la fixture d'un README désaligné **passait** avant correctif
      (vert capturé et joint au rapport) et **échoue** après, avec un message **nommant le fichier et
      la ligne** et **dictant la commande** de régénération. *Vérif* : même commande + les deux
      captures.
- [ ] **CA-3** — Après régénération réelle, la version annoncée par le README **=** la release que
      GitHub présente comme `latest`, dans les trois dépôts.
      *Vérif* : `gh api repos/iakasju/<repo>/releases/latest --jq .tag_name`, confronté au README.

### Le `latest` ne ment plus (H-2)

- [ ] **CA-4** — `gh api repos/iakasju/iakaFrameGUI/releases/latest --jq .tag_name` rend le **plus
      haut** tag publié (v0.1.7 au jour du cadrage, ou la version publiée à l'étape 7).
- [ ] **CA-5** — **Contrefactuel du vol de `latest`** — **REQUALIFIÉ le 2026-08-29 (lot L43)**,
      sur les arbitrages **AR-1** (prouver sur `IakaCockpit`, pas sur le GUI) et **AR-2**.
      *Rédaction d'origine, conservée pour mémoire* : « republier un tag **antérieur** ne change
      **pas** le `latest` ; *Vérif* : relancer le workflow en `workflow_dispatch` sur un tag ancien,
      puis re-mesurer CA-4 ». **Cette rédaction est fausse sur deux points**, mesurés le 2026-08-29 :
      (i) elle nomme `iakaFrameGUI` (sa *Vérif* renvoie à CA-4) alors que la preuve se fait **sur le
      dépôt où elle a été faite**, ici `IakaCockpit` ; (ii) **republier** un tag dont la release
      existe ne vole rien au SHA épinglé — c'est la **création** qui vole.
      **État : PARTIELLEMENT PROUVÉ, sur banc seulement.** Prouvé (dépôt `iakasju/latest-contrefactuel`,
      run `33277643229`) : une **création** sans `make_latest` **vole** le `latest` ; le tri
      `sort -V` + filtre `^v…$` désigne bien `v0.10.0` face à `v0.9.0` et `archive/feat/x` ; et le
      transport de preuve tient (`sha256` du bloc `latest:` identique au `raw` d'`IakaCockpit@main`).
      **Prouvé aussi, et c'est ce qui fait tomber CA-5 tel qu'écrit** : après que le job a posé
      `--latest=false` sur la release voleuse, `GET /releases/latest` rendait **encore** cette
      release, pas le plus haut semver — ligne `VERIFICATION : latest effectif = v0.2.0
      (attendu : v0.10.0)`, job **rouge**. **Sur la topologie de ce banc** — où la voleuse était
      **aussi** la plus récente par `created_at` — **la branche `--latest=false` n'a pas rendu** le
      `latest` au plus haut semver. **Donc : on ne peut pas compter sur V3 pour réparer.**
      ⚠️ **BORNAGE DU 2026-08-30 (second passage du gate) — DATÉ, PUIS RÉFUTÉ LE MÊME JOUR.** Ce
      qui figurait ici au premier jet — « **V3 n'est donc pas une garde mais un détecteur** » —
      dépassait la preuve du run seul. Le bornage écrit ensuite la dépassait **dans l'autre sens** :
      il affirmait que sur la topologie réelle d'`IakaCockpit`, la voleuse étant créée sur un **tag
      ancien** donc au `created_at` le plus **vieux**, un « repli par date » aurait fait retomber le
      `latest` sur `v0.32.2` et **V3 aurait réparé**. 🛑 **La règle qui portait cet argument est
      réfutée** par le contrefactuel du décideur (ci-dessous). **Sous la seule règle survivante, V3
      ne répare pas** — il **détecte, rougit et dicte le geste**.
      ✅ **LE MÉCANISME — le contrefactuel a été JOUÉ le 2026-08-30 par le décideur.**
      `gh release edit v0.10.0 --latest=false` sur le banc, puis lecture : **sortie `v0.10.0`,
      inchangée**. ⚠️ **Cette sortie ne conclut RIEN à elle seule** — c'est son **croisement** avec
      le run `33277643229` qui élimine. Croisées, les deux mesures **réfutent huit des neuf règles
      de repli énumérées** (`created_at` et `published_at`, chacune avec et sans exclusion de la
      démarquée · semver · plus grand `id` · ordre lexicographique · repli différé) ; **seul le
      NO-OP survit**, et lui **ne dépend d'aucune topologie**.
      🛑 **LE RÉSIDU, à porter avec la conclusion** : la phrase juste n'est **pas** « GitHub ne
      replie jamais », c'est **« parmi les règles énumérées, huit sont réfutées ; seule le NO-OP
      survit »** — **une règle non énumérée reste possible**, et le NO-OP survivant est
      **observationnel** (il ne dit pas *où* il se produit : `gh`, écriture API, ou lecture ;
      `make_latest` n'est pas relisible). Table complète des neuf règles, avec les six valeurs
      mesurées du banc et le résidu : encart **« LE CONTREFACTUEL A ÉTÉ JOUÉ »** du § 1 de
      `contrefactuel-ca5-procedure-decideur.md`.
      **Non fait** : la transposition au dépôt réel (voie V-C) — **acte du décideur**, procédure
      écrite et **NON EXÉCUTÉE** dans `contrefactuel-ca5-procedure-decideur.md`. **Décision du
      2026-08-30 : (γ)** — re-cadrer la garde d'abord, **aucun geste de release sur `IakaCockpit`**.
      *(Et V-C ne discriminerait rien de plus : son tag contrefactuel pointerait le commit de
      `v0.32.2`, donc **même `created_at`** — sous l'hypothèse « repli par date », une **égalité**,
      comportement indéfini.)*
      **Condition de levée — mise à jour du 2026-08-30** : le volet **mécanisme** est **levé par
      élimination, dans les limites énumérées** (contrefactuel joué, sortie citée ci-dessus). Reste
      dû pour **CA-5** : la **transposition au dépôt réel** — dépôt, acteur (`tauri-action`) et
      droits différents —, qui demeure un **acte du décideur** et que **(γ)** a écartée de ce lot.
- [ ] **CA-6** — Le workflow **dit** ce qu'il a fait du `latest` (ligne de log citée), y compris
      quand il a décidé de **ne pas** le poser.

### La ligne de publication de la CLI (H-3)

- [ ] **CA-7** — `gh api repos/iakasju/iakaframe/releases/latest --jq .tag_name` rend `v` +
      `cli/package.json.version`. *Vérif* : les deux valeurs citées côte à côte.
- [ ] **CA-8** — Les notes de la release **nomment l'agrégat** : elles disent que cette version
      regroupe les lots non publiés depuis v0.20.4 et renvoient au journal de l'état des lieux.
      *Vérif* : `gh api repos/iakasju/iakaframe/releases/latest --jq .body`.
- [ ] **CA-9** — Le README de la CLI **annonce l'asset `.tgz`** produit par le CI, avec son nom
      exact, et la commande d'installation qui va avec.
      *Vérif* : `gh api repos/iakasju/iakaframe/releases/latest --jq '.assets[].name'`, confronté au
      README.

### La vitrine correspond à l'étagère (H-4)

- [ ] **CA-10** — **Chaque** fichier annoncé par chaque README **existe** comme asset de la release
      annoncée. *Vérif* : la face en ligne du dépôt ; **et**, à la main,
      `gh api repos/iakasju/<repo>/releases/tags/<tag> --jq '.assets[].name'` comparé au tableau.
- [ ] **CA-11** — **Aucun** asset installable de la release n'est absent du README (hors
      `.app.tar.gz`, `.sig` et `latest.json`, exclus **nommément**). *Vérif* : même commande. Ce
      critère est celui qui aurait rattrapé le DMG Intel du GUI, jamais annoncé.
- [ ] **CA-12** — Le README d'`IakaCockpit` **ne promet plus de `.dmg`** tant que la release n'en
      porte pas ; l'absence est **déclarée** (motif, date, condition de levée) et non silencieuse.
      *Vérif* : lecture du README + l'entrée d'absence déclarée ; **contrefactuel** : inscrire une
      plateforme **réellement présente** dans les absents doit faire **rougir**.
- [ ] **CA-13** — *(constat, pas correctif)* La première release publiée par le workflow corrigé de
      L41 **ne porte plus** d'asset `latest.json` concurrent.
      *Vérif* : `gh api repos/iakasju/<repo>/releases/latest --jq '.assets[].name' | grep -c latest.json`
      → `0`. Un résultat non nul **remonte à L41**, il ne se corrige pas ici.

### Le cliquet et sa durabilité

- [ ] **CA-14** — La face en ligne, **privée de réseau**, rend un **`SKIP` explicite** et non un
      vert. *Vérif* : la lancer hors ligne et citer la sortie ; le code de sortie **et** le texte
      doivent dire « non mesuré ».
- [ ] **CA-15** — La table de motifs est **byte-identique** entre les deux apps et **gardée**.
      *Vérif* : `diff IakaCockpit/fixtures/vitrine-assets.json iakaFrameGUI/fixtures/vitrine-assets.json`
      → vide ; **et** l'entrée présente dans `fixtures/convergence.sha256` des deux côtés, `npm run
      test:convergence` vert **des deux côtés**.
- [ ] **CA-16** — Le registre de convergence **n'a pas perdu d'entrées** : son plancher de complétude
      est **relevé** du nombre de fichiers ajoutés. *Vérif* : la face locale de la garde de
      convergence, chiffre cité (12 avant ce lot).
- [ ] **CA-17** — Côté GUI, le **cliquet existant** des porteurs de version (clés lues ≡ clés
      déclarées) **mord** sur la nouvelle entrée README. *Vérif* : retirer le câblage de lecture dans
      une fixture et constater le rouge.
- [ ] **CA-18** — Les suites complètes sont vertes dans les **trois** dépôts, **chiffres cités**.
      *Vérif* : Cockpit `bash scripts/quality.sh` ; GUI `npm run lint:all` **et** `npm run test:all` ;
      CLI `npm test` dans `cli/`.

---

## Arbitrages — TRANCHES par le decideur le 2026-08-29

> **Les six arbitrages sont TRANCHES : le decideur a valide l'instruction sur ses recommandations.**
> Le tableau ci-dessous se lit comme la **decision**, plus comme une proposition. Si l'execution
> rencontre un cas qu'un arbitrage ne couvre pas, elle **s'arrete et remonte** — elle ne tranche pas
> a la place du decideur.
>
> **UN GESTE D'AR-3 EST DEJA FAIT, avant meme cette validation** : `gh release edit v0.1.7 --latest`
> sur `iakaFrameGUI`, execute par le decideur lui-meme (les actes de publication sont refuses aux
> agents). Mesure en anonyme juste apres : `latest = v0.1.7`, 17 assets, **les trois systemes couverts**
> (Windows `.exe`+`.msi`, Linux `rpm`+`AppImage`+`deb`, macOS 2 `.dmg`). H-2 est donc **refeme sur ce
> depot** ; l'execution doit livrer le **cliquet** qui l'empeche de revenir, pas refaire le geste.
>
> Etat au moment de la validation, mesure : `iakaFrameGUI latest=v0.1.7` (macOS installable OUI) ·
> `IakaCockpit latest=v0.32.1` (macOS installable **NON** — H-4) · `iakaframe latest=v0.20.4`.
>
> Relaye par [PORTEFEUILLE][Odin].


> Gandalf propose, le décideur tranche. Aucune de ces lignes n'est décidée ici. Si l'exécution
> rencontre un cas qu'un arbitrage ne couvre pas, elle **s'arrête et remonte** — elle ne tranche pas
> à sa place.

| # | Question | Options | Recommandation |
|---|---|---|---|
| **AR-1** | Le README décrit-il **le dépôt** ou **la dernière publication** ? | (a) **porteur** : il annonce la version que le dépôt porte — vérifiable **hors ligne**, au prix d'une fenêtre de quelques minutes où la release n'a pas encore ses binaires (R4) · (b) **sortie** : il annonce la dernière version publiée — toujours vrai, mais **invérifiable hors ligne**, donc dérive silencieuse : c'est **exactement l'état actuel** · (c) il ne nomme aucune version et ne pointe que `/releases/latest` — jamais faux, jamais utile, et incompatible avec un tableau de noms de fichiers versionnés | **(a)**. C'est la seule option qui rende le défaut **détectable dans le gate**, et elle réutilise deux gardes existantes sans en créer une troisième. (b) est le défaut qu'on répare. |
| **AR-2** | **Générer** la section, ou seulement la **garder** ? | (a) générateur + `--check` au gate · (b) prose à la main + garde qui refuse la dérive · (c) rien : discipline | **(a)**. (b) impose de corriger la version **à la main en ~8 endroits** à chaque release : la corvée sera sautée, la garde bloquera la publication, et on aura échangé un mensonge contre un blocage. (c) est ce qui a déjà échoué. |
| **AR-3** | Comment maîtriser le `latest` ? | (a) discipline des dates (ne jamais republier un tag ancien) · (b) **désignation explicite** en fin de workflow, conditionnée au plus haut semver · (c) `make_latest: false` sur toute republication | **(b)**, qui **contient** (c). (a) est une règle qu'aucune mécanique ne porte — donc pas une garde. ⚠️ Le SHA de `tauri-action` **n'expose rien** : côté apps, (b) passe par une **étape `gh` distincte**, jamais par un dé-épinglage. |
| **AR-4** | **H-3** : que faire des dix-neuf versions non taguées d'`iakaframe` ? | (a) **rétro-taguer** v0.21.0 … v0.38.0 · (b) **repartir de la version courante** : une release v0.39.0 assumée comme agrégat · (c) **changer la convention** | **(b) + le cliquet CA-7**. Détail des coûts et des mensonges résiduels ci-dessous — c'est l'arbitrage le plus chargé du lot. |
| **AR-5** | **Où vit cette instruction ?** | (a) **verbatim dans les trois dépôts** (précédent L40/L41) · (b) **une seule copie dans `iakaframe`** + une entrée de backlog pointant le chemin absolu dans les trois · (c) **deux instructions** : une pour les apps jumelles (verbatim ×2, registre de convergence), une pour la CLI | **(b)**. Motif : L40 dupliquait parce que le défaut vivait dans **deux implémentations jumelles** ; ici il vit dans **une convention de portefeuille** appliquée à **au moins quatre** dépôts (F5), dont un absent de GitHub. Et le registre de convergence **ne connaît que deux frères** : une troisième copie serait la seule **non gardée**, donc la première à diverger — on installerait le défaut qu'on répare. ⚠️ **Risque assumé et dit** : un agent d'exécution lancé dans `IakaCockpit` ne trouvera pas l'instruction chez lui ; c'est pourquoi l'entrée de backlog par **chemin absolu** dans les trois dépôts est une **étape du lot**, pas une politesse. Si le décideur préfère (a), le coût **supplémentaire** est d'apprendre un **troisième frère** au dispositif de convergence — travail réel, **non chiffré** dans l'estimation ci-dessous. |
| **AR-6** | Quand publier la CLI par rapport aux deux apps ? | (a) les trois dans la même passe · (b) les apps d'abord (mutualisées avec L40 §5.1), la CLI ensuite | **(b)**. Les apps ont une publication **déjà due** ; la CLI en ajoute une **neuve**, dont les notes demandent une relecture humaine (CA-8). Les séparer permet d'arrêter après les apps si le résultat déçoit. |

### AR-4 en détail — les trois voies, leur coût, et leur **mensonge résiduel**

- **(a) Rétro-taguer v0.21.0 … v0.38.0.**
  *Coût* : retrouver dix-huit commits ; le journal de `specs/etat-des-lieux.md` donne date, version et
  branche, la correspondance est donc **faisable mais pas certaine**. ⚠️ **Effet de bord aggravant** :
  créer les releases GitHub correspondantes **écraserait le `latest` à chaque création** (F3, défaut
  `make_latest: true`) — il faudrait finir par la plus haute et le vérifier. On rejouerait H-2
  volontairement, dix-huit fois.
  *Mensonge résiduel* : **un tag posé aujourd'hui prétend qu'une version est sortie le 12 août.**
  Elle n'est pas sortie. On fabriquerait un historique de publication qui n'a pas eu lieu.
  *Précédent* : `dette-version-source-unique.md` § D3 a **déjà tranché non** aux rétro-tags — « ne pas
  poser de tags historiques sur des commits incertains ». Revenir dessus demanderait un motif neuf ;
  je n'en vois pas.
- **(b) Repartir de la version courante.** ← **recommandé**
  *Coût* : un tag, un run CI, des notes de release à écrire.
  *Mensonge résiduel* : **le trou v0.21.0 → v0.38.0 reste béant dans la liste des tags**, et suggère
  que rien n'est sorti pendant vingt-cinq jours. C'est **vrai du point de vue de la publication** —
  rien **n'est** sorti — et faux du point de vue du travail. Le remède est de le **dire** : notes de
  release qui assument l'agrégat (CA-8) et renvoi au journal, qui, lui, porte l'historique complet.
  **C'est le mensonge le moins cher, et le seul qui puisse être annulé par une phrase.**
- **(c) Changer la convention.**
  *À rectifier* : **elle a déjà changé.** Depuis `dette-version-source-unique.md`, l'autorité est
  `cli/package.json` et les tags en sont un miroir. Il n'y a donc rien à décider ici — ce qui
  manquait n'était pas la convention mais **son cliquet**. C'est **CA-7** qui le pose, et il est
  **inclus dans (b)** : dès que le dépôt bumpe sans publier, la face en ligne rougit. Cette rougeur
  est **voulue** — c'est une dette de publication rendue **visible**, et elle est **hors gate** : elle
  informe, elle ne bloque aucun lot.

---

## Articulation avec l'étape 5.1 de L40 — elles se croisent, elles ne se doublent pas

L40 §5.1 (« bump de version, publication d'une version neuve sur **chaque** app par la chaîne
existante ») est **toujours due**, et reste un **acte du décideur**. Ce lot **recommande de taguer et
publier** : les deux gestes se rencontrent donc, et il faut le dire plutôt que l'ignorer.

**L'articulation retenue — le code d'ici passe AVANT la publication de L40 :**

1. Livrer les étapes **1 à 6** de ce lot (générateurs, gardes, `latest`, README régénérés) — **aucune
   publication**.
2. Le décideur exécute **L40 §5.1**, une seule fois par app. **Cette publication sert les deux lots** :
   elle porte les clés d'installeur de L40 **et** un README déjà vrai, un `latest` déjà maîtrisé.
3. Étape **7** d'ici : re-mesure, deux faces du cliquet, chiffres cités.
4. La CLI publie **ensuite**, séparément (AR-6).

**Ce que cet ordre évite** : publier d'abord (L40 seul), puis découvrir que la release fraîche est
annoncée par un README périmé — et devoir **republier** pour le corriger, ce qui, au passage,
**volerait le `latest`** (F3). L'inverse de l'ordre proposé coûte donc une publication de plus **et**
rejoue le défaut H-2.

**Ce que cet ordre ne change pas** : les **deux recettes réelles** (Windows par MSI, Linux par
`.deb`) restent des actes humains dus à L40, hors de ce lot. Ce lot ne les rapproche ni ne les
remplace.

---

## Gate humain — ce que ce lot ne peut PAS prouver, et ce qu'il demande au décideur

**Trois actes qui n'appartiennent pas à l'exécution :**

1. **Re-désigner `iakaFrameGUI v0.1.7` comme `latest`** — `gh release edit v0.1.7 --latest`. Une
   commande, un effet immédiat sur ce que voit un inconnu **aujourd'hui**, sans attendre le reste du
   lot. C'est le geste au meilleur rapport effet/coût de tout le cadrage ; il peut être fait avant
   même la validation de cette instruction.
2. **La publication de L40 §5.1** (bump + tag + run CI sur les deux apps).
3. **La vérification par un vrai visiteur** : ouvrir les trois pages GitHub depuis une session **non
   connectée**, suivre le README à la lettre, et constater qu'on obtient un logiciel qui démarre.
   **Aucune garde de ce lot ne remplace ce geste** — elles mesurent des noms de fichiers, pas une
   installation.

Tant que 3 n'est pas fait, le lot se déclare **« vérifié, non recetté »** — jamais « installable ».

---

## Estimation — obligatoire au jalon P1→P2

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **≈ 3 j** (fourchette **2,5 – 4,5**) |
| **Complexité / risque** | **Moyenne.** Peu d'algorithmique, mais **trois dépôts**, **trois harnais de garde différents** (deux déjà divergents entre eux), une face réseau à rendre honnêtement `SKIP`-able, et un contrefactuel (CA-5) qui exige de **republier un tag ancien pour prouver qu'on ne perd plus le `latest`**. |

Décomposition : étape 0 (re-mesure anonyme ×3) ≈ 0,25 j · étape 1 (table partagée + convergence)
≈ 0,25 j · étape 2 (générateur, fonction pure + `--write`/`--check`, ×2 familles) ≈ 0,75 j ·
étape 3 (face locale, rouge d'abord + contrefactuels, ×3 dépôts) ≈ 0,75 j · étape 4 (face en ligne +
`SKIP`) ≈ 0,4 j · étape 5 (`latest` : yaml ×3 + contrefactuel CA-5) ≈ 0,3 j · étape 6 (CLI : notes,
README, tag) ≈ 0,2 j · étape 7 + backlog + doc ≈ 0,2 j.

**Inconnues susceptibles de faire glisser :**

- **U1 — le DMG manquant du Cockpit.** Si le décideur veut le **produire** plutôt que le déclarer
  absent, ce n'est plus ce lot : ouverture d'un chantier CI/bundler macOS, ordre de grandeur
  **+0,5 à +1,5 j**, et une cause encore inconnue. En l'état, le lot **déclare** — coût nul.
- **U2 — AR-5 = (a)** (verbatim ×3) : apprendre un **troisième frère** au dispositif de convergence
  (`scripts/test-convergence.mjs`, résolution du frère, plancher de complétude). **+0,5 à +1 j**, non
  compté ci-dessus.
- **U3 — CA-5 coûte une republication délibérée** d'un tag ancien pour prouver le contrefactuel. Si
  le décideur refuse ce geste sur un dépôt public, V3 reste **espéré et non prouvé** — et il faut le
  déclarer tel quel, jamais l'annoncer comme couvert.
- **U4 — la fenêtre d'AR-1(a)** : si la fenêtre bump→release s'avère gênante en usage, le remède est
  un changement d'option (a)→(b), donc une **reprise du générateur et des deux gardes** : **+0,5 j**.
- **U5 — les droits `gh` sur les runners.** Non vérifiés par ce cadrage (R6). Si l'étape `gh release
  edit` ne peut pas s'exécuter en CI, V3 retombe sur un geste manuel post-publication, et le cliquet
  en ligne devient le seul filet : **+0,2 j** et une garantie plus faible, à dire.
- **U6 — les noms d'assets bougent.** Les motifs de l'étape 1 sont **mesurés le 2026-08-29** ; un
  changement du bundler entre-temps invalide la table (R1) et la re-mesure de l'étape 0 la
  rattraperait — c'est sa raison d'être.

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## Sources — vérifiées sur le web le 2026-08-29

- [REST API — Releases (GitHub Docs)](https://docs.github.com/en/rest/releases/releases) —
  « Get the latest release » (formulation `created_at`) et le paramètre **`make_latest`**
  (`true`/`false`/`legacy`, défaut `true`).
- [`gh release edit` — manuel GitHub CLI](https://cli.github.com/manual/gh_release_edit) —
  `--latest` : *« Explicitly mark the release as 'Latest' »*.
- [`tauri-action` — `action.yml` au SHA épinglé `84b9d35b…`](https://raw.githubusercontent.com/tauri-apps/tauri-action/84b9d35b5fc46c1e45415bdb6144030364f7ebc5/action.yml)
  — inventaire des inputs : **aucun** ne pilote le `latest`.
- [`softprops/action-gh-release` — `action.yml`](https://raw.githubusercontent.com/softprops/action-gh-release/master/action.yml)
  — input **`make_latest`** déclaré.
- API GitHub publique, appels **anonymes** : `/repos/iakasju/{iakaframe,IakaCockpit,iakaFrameGUI}`,
  `/releases`, `/releases/latest`, `/releases/tags/<tag>` — et `/repos/iakasju/iakaTokenCounter`
  → **404**.
