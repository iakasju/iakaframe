# Étapes 3 et 4 sur Windows et Linux — la chaîne pose les deux apps ailleurs que sur macOS

> Cadré par 🔵 **Gandalf**, le **2026-09-05**, sur ordre de mission de 🟠 Aragorn.
> **Lot** : `ETAPES-3-4-WINDOWS-LINUX`.
> **Cadrage parent, non rediscuté** : `specs/instructions/chaine-complete-install-amorcage-dmg-msi.md`
> (AR-4 une validation par étape · **AR-5 rollback et ses trois gardes** · AR-B/AR-C le véhicule
> amorce et n'enchaîne pas · AR-E les deux apps sœurs ne sont pas à modifier · § 10 macOS seule
> plateforme couverte par C.1 · R8 « buildé ne vaut pas recetté »).
> Contrat machine, non rediscuté : `specs/instructions/contrat-machine-du-verbe-install.md`
> (AR-M1/M2/M3, vocabulaire d'événements **fermé**).

---

## 0. Ce qui a été mesuré, et avec quoi

### 0.1 — Instruments, et la limite qui les borne

**Je n'ai pas de shell dans cette session.** Aucune commande n'a été exécutée : ni test, ni build,
ni `reg query`, ni `msiexec`, ni téléchargement. **Tout fait interne ci-dessous vient d'une lecture
de fichier** (chemin:ligne cité) ; **tout fait externe vient d'une vérification web du
2026-09-05** (source citée). Je ne cite **aucune sortie de commande**, parce que je n'en ai produit
aucune.

**Conséquence portée dans le lot** : les mesures d'exécution — durées, codes de sortie, chemins
réels sur Windows, comportement d'un AppImage lancé — sont **l'étape 0 de ⚒️ Gimli** (§ 5), pas des
prémisses de ce cadrage. Là où ce document a besoin d'un fait que je ne peux pas établir, il le
**nomme comme une mesure à faire**, jamais comme un acquis.

### 0.2 — Faits attribués à 🟠 Aragorn *(re-mesurés par moi là où c'était possible)*

| # | Fait, tel que transmis | Ce que j'en confirme par lecture |
|---|---|---|
| A-1 | `iakaInstall` v0.1.1 publiée sur 4 plateformes (`.msi`, `.exe` NSIS, `.deb`, `.rpm`, AppImage, 2 `.dmg`, 2 `.app.tar.gz`), CLI 0.40.0 embarqué | **non re-mesuré** — dépôt hors de ma lecture ; attribué à Aragorn, jamais présenté comme mien |
| A-2 | Sur Windows/Linux la façade lance la chaîne, étapes 1 et 2 passent, **3 et 4 sont refusées** avec `etape-terminee{etat, detail:'plateforme "x" non couverte'}` | ✅ **cohérent avec le code lu** : `install.js:446-456` produit exactement ce `detail` ; l'`etat` est `echouee` hors dry-run, `dry-run` sinon |
| A-3 | Personne n'a joué la chaîne sur un Windows ou un Linux réel | **gate humain**, § 8 |
| A-4 | CLI 0.40.0 publié (`naonedge-iakaframe-0.40.0.tgz`) | **non re-mesuré** |

### 0.3 — Faits internes relevés par moi (chemin:ligne)

- **M-1 — Le refus CA-15 est une fonction de trois lignes, et c'est tout.**
  `cleManifestePlateforme()` (`cli/src/lib/app-bundle.js:52-58`) rend `darwin-aarch64` /
  `darwin-x86_64`, et **`null` pour tout le reste**. Le motif est écrit au-dessus
  (`:44-51`) : « le format `.app.tar.gz` est la SEULE forme installable SANS assistant interactif
  ni privilège élevé sur AUCUNE des quatre plateformes ». **Ce motif est en partie faux, et c'est
  la découverte de ce cadrage — voir M-7.**
- **M-2 — Tout le reste de la chaîne est déjà agnostique de la plateforme.**
  `telechargerEtVerifier()` (`app-bundle.js:76-100`) prend une **clé** en paramètre et vérifie la
  signature minisign **avant** de rendre quoi que ce soit (CA-14) : rien à y changer.
  `sauvegarderAvantEtape` / `restaurerEtape` / `orchestrerRollback` (`cli/src/lib/rollback.js:35`,
  `:64`, `:106`) travaillent sur une **cible remplaçable dans son entier**, via `fs.cpSync(...,
  {recursive:true})` — **ce qui vaut pour un fichier autant que pour un dossier**.
  **Seules deux choses sont macOS-spécifiques** : la table de clés (M-1) et `poserBundleDarwin`
  (`app-bundle.js:108-131`, `tar -xzf` + un `.app` + `cpSync`).
- **M-3 — La cible est calculée en dur au format macOS.** `install.js:483` :
  `path.join(appsDir, `${app.nom}.app`)`, avec `appsDir` = `--apps-dir`, défaut `~/Applications`
  (`install.js:407-409`). **Le suffixe `.app` est écrit en dur** — il n'a de sens sur aucune des
  deux autres plateformes.
- **M-4 — Le vocabulaire d'événements est FERMÉ et gardé.** `EVENEMENTS` et **`ETATS_ETAPE`**
  (`cli/src/lib/evenements.js:21-35`) sont `Object.freeze`, et `construireEvenement` **lève** sur
  un `evt` hors vocabulaire (`:50-55`). `ETATS_ETAPE` vaut `['faite','refusee','echouee','sautee',
  'dry-run']`. En revanche **`detail` est du texte libre** : c'est déjà par lui que passe
  `plateforme "x" non couverte`. **Ce fait commande AR-W8.**
- **M-5 — Les deux manifestes réels portent 9 clés chacun, et les 9 sont signées.**
  `IakaCockpit/updater/latest.json` (v0.32.2) et `iakaFrameGUI/updater/latest.json` (v0.1.8) :
  `darwin-aarch64`, `darwin-x86_64`, `linux-x86_64`, `linux-x86_64-appimage`, `linux-x86_64-deb`,
  `linux-x86_64-rpm`, `windows-x86_64`, `windows-x86_64-msi`, `windows-x86_64-nsis`.
  **Aucune entrée sans `signature`.** Toutes les URL sont sur les releases GitHub.
  ⚠️ **Fait contraire à l'attendu de l'ordre de mission** : `.deb` et `.rpm` **sont** signés
  minisign ici — le manifeste de ces deux apps ne se limite pas au bundle updater de Tauri. Le
  registre `IakaCockpit/fixtures/updater-cles.json:16` l'explique : « aucune clé n'est émise pour
  un artefact sans `.sig` apparié » — donc leur présence **prouve** que les `.sig` existent.
- **M-6 — La convention de résolution des clés est écrite, mesurée et versionnée.**
  `fixtures/updater-cles.json:6` : `tauri-plugin-updater` **2.10.1** essaie
  `{os}-{arch}-{installer}` **PUIS** `{os}-{arch}`, dans cet ordre (`src/updater.rs:568-598`), et
  `Installer::name()` rend exactement `appimage, deb, rpm, app, msi, nsis`. La règle du porteur
  générique est écrite (`:15`) : **Windows → NSIS, Linux → AppImage, macOS → l'unique
  `.app.tar.gz`**. **Ce fait commande AR-W1 et la règle de sélection du § 2.**
- **M-7 — Ni `IakaCockpit` ni `iakaFrameGUI` ne déclarent la moindre section `bundle.windows`.**
  `IakaCockpit/src-tauri/tauri.conf.json:26-51` et `iakaFrameGUI/src-tauri/tauri.conf.json:26-51`
  portent `bundle: { active, targets:"all", createUpdaterArtifacts:true, icon }` — **aucun `wix`,
  aucun `nsis`, aucun `installMode` de bundle**. Le seul `installMode` présent est
  `plugins.updater.windows.installMode: "passive"` (`:46-48` des deux fichiers), qui est **une
  autre chose** : il dit comment le *plugin updater* lance l'installeur, pas la portée
  d'installation du paquet. ⇒ **Les deux MSI et les deux NSIS sont aux défauts de Tauri.**
  **La conséquence est en M-9, et c'est le fait qui tranche AR-W1.**
- **M-8 — La table de vitrine affirme déjà la réponse, sans l'avoir prouvée.**
  `IakaCockpit/fixtures/vitrine-assets.json:30` qualifie le NSIS de « **le seul qui ne demande
  aucun droit d'administration** ». C'est une **raison écrite dans une fixture**, pas une mesure —
  je ne la reprends pas comme telle. Elle se trouve **corroborée** par M-9.
- **M-9 — `getBytes` suit les redirections et coupe à 30 s.**
  `cli/src/lib/http.js:48-61` : `fetch(url, { redirect: 'follow' })`, `AbortController` armé à
  **30 000 ms par défaut**, avortement qui couvre **aussi la lecture du corps** (`res.arrayBuffer()`
  est dans la portée du signal). **Ce fait ouvre R-W1** : l'AppImage et le MSI pèsent bien plus que
  le `.app.tar.gz`.
- **M-10 — Ce qui existe déjà comme couture de test.** `etapeApp` expose `resoudreEndpointsApp`,
  `telechargerApp` et **`plateforme`** comme points d'injection (`install.js:425-429`), ce dernier
  « réservé aux tests DIRECTS de CA-15, jamais exposé par un drapeau CLI » (`:421-424`).
  `cli/test/app-bundle.test.js:60-68` et `cli/test/install-etapes-3-4.test.js:91-106` couvrent
  déjà le refus. **La couture nécessaire au lot existe donc ; il ne faut pas en inventer une
  seconde.**

### 0.4 — Faits externes, vérifiés le 2026-09-05

- **E-1 — Le MSI de Tauri est `perMachine`, en dur, sans option.** Le gabarit WiX du bundler
  (`crates/tauri-bundler/src/bundle/windows/msi/main.wxs`) pose `InstallScope="perMachine"` ; il
  n'existe **aucun paramètre de configuration** pour le passer en `perUser` — c'est une demande de
  fonctionnalité ouverte (`tauri#13792`). `perMachine` installe dans *Program Files* et
  **exige un accès administrateur**.
- **E-2 — Le NSIS de Tauri est `currentUser` par défaut.** Doc Tauri v2, verbatim : « By default
  the installer will install your application for the current user only. The advantage of this
  option is that the installer does not require Administrator privileges to run, but the app is
  installed in the `%LOCALAPPDATA%` folder instead of `C:/Program Files`. »
- **E-3 — Les drapeaux silencieux employés par le plugin updater lui-même.** NSIS : `passive` =
  `/P /R`, `quiet` = `/S /R` (`/R` = relancer l'app). MSI : `msiexec` reçoit `/passive`, `/quiet`
  ou `/silent`. ⚠️ **La doc Tauri ne documente pas `/S` ni `/P` côté distribution** — ils ne sont
  attestés que par la source du plugin. **Non mesuré par moi → R-W2.**
- **E-4 — On ne maîtrise pas le répertoire d'installation en mode silencieux.** L'écrasement du
  chemin par `/D=` pour les installeurs NSIS de Tauri **ne fonctionne pas** en installation
  silencieuse (`tauri#6928`, demande ouverte). ⇒ **`--apps-dir` ne peut pas s'appliquer à
  Windows**, et le dire est un critère (CA-W9), pas un détail.
- **E-5 — Désinstallation.** MSI : `msiexec /x {ProductCode} /qn`. NSIS : l'installeur pose son
  propre `uninstall.exe`, qui accepte `/S`.
- **E-6 — Ce que l'updater Tauri signe et sait installer, par plateforme.** macOS
  `myapp.app.tar.gz` (+`.sig`) · Windows `myapp-setup.exe` **et** `myapp.msi` (+`.sig` chacun) ·
  Linux `myapp.AppImage` (+`.sig`), doc verbatim : « The standard app bundle. It will be re-used
  by the updater. » ⇒ **sur Linux, l'AppImage est remplacée en place** ; il n'y a pas
  d'installation système.
  ⚠️ **Ce que la doc dit ne décrit PAS entièrement nos manifestes** : les nôtres portent en plus
  `linux-x86_64-deb` et `-rpm` signés (M-5), parce que ces dépôts émettent leurs propres clés
  (lot L40). La doc borne l'updater ; **elle ne borne pas ce que notre CLI peut lire**.
- **E-7 — Un AppImage n'est pas exécutable par le seul `chmod +x` sur les Ubuntu récentes.**
  Depuis Ubuntu 22.10, seul FUSE 3 est livré ; les AppImages exigent **FUSE 2** (`libfuse2` /
  `libfuse2t64`), sans quoi le lancement échoue sur `dlopen(): error loading libfuse.so.2`. Le
  contournement sans dépendance est `--appimage-extract-and-run`. ⇒ **R-W5** : la pose peut
  réussir et le lancement échouer, pour une cause **hors de notre portée**.
- **E-8 — Convention d'emplacement Linux.** L'usage documenté est de garder l'AppImage dans un
  dossier utilisateur stable — **`~/Applications`** est le plus cité —, `chmod +x`, puis, si l'on
  veut un lanceur, un `.desktop` dans `~/.local/share/applications/`. `~/.local/bin` est un
  dossier de **commandes du `PATH`**, pas d'applications.
- **E-9 — `.deb` et `.rpm` exigent root.** `dpkg -i` / `rpm -i` écrivent dans l'arbre système et
  enregistrent le paquet auprès du gestionnaire — geste privilégié par construction.

---

## 1. Problème

La chaîne d'installation `iakaframe install` joue quatre étapes. Sur macOS elle les joue toutes.
**Sur Windows et sur Linux, elle en joue deux** : les étapes 3 et 4 — poser IakaCockpit puis
iakaFrameGUI — refusent avec `plateforme "x" non couverte` (M-1, A-2).

Ce refus était **juste** au moment où il a été écrit : c'était le seul comportement honnête d'un lot
dont la seule plateforme prouvable était macOS (§ 10 du cadrage parent). Il n'est plus tenable
maintenant qu'`iakaInstall` est publiée sur quatre plateformes (A-1) : un utilisateur Windows
double-clique un `.msi`, voit une chaîne s'annoncer en **quatre étapes**, et n'en obtient que
deux — avec, à la place des applications, un message qui lui dit que sa plateforme n'est pas
couverte.

**Reformulé en une phrase** : *faire que les étapes 3 et 4 posent réellement les deux applications
sur Windows et sur Linux, avec la même doctrine de sauvegarde et de rollback qu'AR-5 impose sur
macOS, sans jamais élever de privilège ni ajouter de dépendance.*

**Et le motif écrit dans le code est en partie faux**, ce qui change ce qu'il y a à faire. `app-bundle.js:47-51`
affirme que le `.app.tar.gz` est *« la SEULE forme installable SANS assistant interactif ni privilège
élevé sur AUCUNE des quatre plateformes »*. **Sur Linux, c'est faux** : une AppImage se pose par une
copie et un bit d'exécution — strictement le même geste que macOS, sans installeur tiers (E-6, E-8).
**Sur Windows, c'est vrai du `.msi` et faux du `.exe` NSIS** : le premier est `perMachine` en dur
donc élève (E-1), le second est `currentUser` par défaut donc n'élève pas (E-2). Ce commentaire est
à **rectifier en le datant**, pas à effacer.

---

## 2. Décision retenue

**Sous réserve des arbitrages du § 3**, la forme retenue est la suivante.

### 2.1 — Une table de clés, pas trois chemins de code

`cleManifestePlateforme()` cesse de rendre une clé unique et rend un **couple ordonné**
`{ installeur, generique }`, lu **dans l'ordre du plugin** : `{os}-{arch}-{installer}` puis
`{os}-{arch}` (M-6). C'est la convention que les deux applications **publient déjà** et que leur
propre client consomme : on la **réutilise**, on n'en invente pas une seconde.

| `platform`/`arch` de Node | clé d'installeur | clé générique | forme de pose |
|---|---|---|---|
| `darwin`/`arm64` | *(aucune, AR-3 de L40)* | `darwin-aarch64` | **inchangée** : `tar -xzf` + copie du `.app` |
| `darwin`/`x64` | *(aucune)* | `darwin-x86_64` | **inchangée** |
| `linux`/`x64` | `linux-x86_64-appimage` | `linux-x86_64` | **copie de l'octet + `chmod 0o755`** |
| `win32`/`x64` | `windows-x86_64-nsis` | `windows-x86_64` | **exécution de l'installeur NSIS en silencieux** |
| tout le reste | — | — | **refus nommé, inchangé** |

**« Tout le reste » n'est pas vide, et c'est important** : `linux/arm64`, `win32/arm64` et
`darwin/ia32` restent **non couverts**, parce que les manifestes réels ne portent **que**
`x86_64` hors macOS (M-5). Le refus CA-15 survit à ce lot ; il rétrécit, il ne disparaît pas.

### 2.2 — Trois formes de pose, une seule doctrine de sauvegarde

`poserBundleDarwin` devient une famille : `poserBundleDarwin` (inchangé), `poserBundleLinux`,
`poserBundleWindows`. **Le contrat de chacune est identique** — recevoir des octets **déjà
vérifiés** (CA-14 est en amont, `app-bundle.js:76-100`, aucune ligne à y toucher), écrire, rendre
`{ok, cible}` ou `{ok:false, raison}`. **Aucune ne gère sa propre sauvegarde** : c'est l'appelant
qui l'a prise avant (`install.js:531-538`), et ce partage-là ne bouge pas.

- **Linux** — écrire les octets dans `<apps-dir>/<Nom>.AppImage`, puis `fs.chmodSync(cible, 0o755)`.
  Rien d'autre. Pas d'archive à ouvrir, pas de sous-processus, pas de dépendance.
  **La cible est un fichier remplaçable dans son entier** : `sauvegarderAvantEtape` et
  `restaurerEtape` fonctionnent **sans modification** (M-2).
- **Windows** — écrire les octets dans un fichier temporaire `<tmp>/<Nom>-setup.exe`, puis
  **exécuter** l'installeur en silencieux via `spawnSync` (Node pur, aucun module natif), puis
  supprimer le temporaire. Le code de sortie de l'installeur **est** le verdict de l'étape : non
  nul ⇒ échec nommé avec le code, jamais un succès supposé.
- **macOS** — **strictement inchangé**, y compris ses tests. Une régression ici serait le plus
  grave défaut possible de ce lot : c'est la seule plateforme aujourd'hui prouvée.

### 2.3 — La sauvegarde AR-5 sur Windows : ce qu'on sauvegarde, et ce qu'on ne sait pas défaire

C'est le point dur du lot, et il ne se résout pas par analogie avec macOS. Sur macOS la cible **est**
ce qu'on écrit. Sur Windows, **on n'écrit pas la cible : on lance un programme qui l'écrit** — et
on ne choisit même pas où (E-4).

**La règle retenue, en trois temps :**

1. **Avant toute écriture, on cherche si une version est déjà installée** : lecture de la clé de
   désinstallation par `reg query` (sous-processus, Node pur), sous
   `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall`, et lecture de sa valeur
   `InstallLocation`. ⚠️ **Le nom exact de la sous-clé posée par le NSIS de Tauri n'est PAS
   établi par ce cadrage** — c'est une mesure de l'étape 0 (§ 5), pas une supposition à coder.
2. **Trois cas, et un seul refus :**
   - **aucune clé trouvée** ⇒ `existaitAvant = false`, rien à sauvegarder — c'est **une mesure, pas
     une absence de mesure**, exactement comme `rollback.js:26-29` le dit déjà.
   - **clé trouvée et `InstallLocation` lisible et existant sur le disque** ⇒ sauvegarde du dossier
     par le moteur existant (`sauvegarderAvantEtape`, `cpSync` récursif).
   - **clé trouvée mais `InstallLocation` absent, illisible, ou pointant sur un dossier
     inexistant** ⇒ **REFUS D'ÉCRIRE**. Une version est là, on ne sait pas la sauvegarder, donc on
     n'écrit pas par-dessus. C'est la moitié « avant » de la garde 1, appliquée à la lettre :
     *« l'appelant doit REFUSER de poursuivre l'écriture plutôt qu'écrire sans filet »*
     (`rollback.js:31-34`). **Une garde qui ne peut pas rougir n'est pas une garde ; une sauvegarde
     qu'on ne peut pas prendre n'autorise pas à écrire quand même.**
3. **Le rollback, et ce qu'il énonce ne pas savoir défaire :**
   - `existaitAvant === false` ⇒ **désinstaller ce que CETTE chaîne a posé**, par l'`uninstall.exe`
     que la pose vient de créer, en silencieux (E-5). C'est la garde 2 dans sa lettre : *« retirer
     ce que cette chaîne a posé, rien d'autre »*. **Préférer cela à un `rmSync` du dossier** :
     supprimer le dossier laisserait l'enregistrement de désinstallation, les raccourcis et les
     associations derrière lui — un demi-rollback qui se croit entier.
   - `existaitAvant === true` ⇒ **restaurer le dossier sauvegardé**, comme sur macOS.
   - **Dans les deux cas, la garde 3 énonce le résidu** : la restauration d'un dossier ne rétablit
     **pas** les valeurs de registre (`DisplayVersion` porte désormais la version neuve), ni les
     raccourcis du menu Démarrer réécrits par l'installeur. `orchestrerRollback` **ne rend jamais
     une phrase d'ensemble** (`rollback.js:99-105`) — ce lot lui donne une **seconde raison** de ne
     pas le faire, et cette raison doit apparaître dans la `raison` rendue, pas seulement dans un
     commentaire.

### 2.4 — Écarts assumés, et pourquoi

| Écart | Motif |
|---|---|
| **`--apps-dir` n'a aucun effet sur Windows** | E-4 : le chemin n'est pas pilotable en silencieux. Le CLI **le dit** au lieu de laisser croire (CA-W9). Le taire serait la « vitrine qui ment » que ce portefeuille a payé cher. |
| **Le `.msi`, le `.deb` et le `.rpm` ne sont jamais lus**, alors que le manifeste porte leurs clés signées (M-5) | E-1 et E-9 : les trois exigent une élévation. Un refus **nommé** vaut mieux qu'un `sudo` demandé au milieu d'une chaîne. |
| **Aucun `.desktop` n'est écrit sur Linux** | Une troisième cible d'écriture (`~/.local/share/applications/`) sortirait du feu vert donné pour `--apps-dir`, et AR-5 ne sauvegarde qu'**une** cible par étape. → AR-W4, successeur nommé. |
| **Le vocabulaire d'événements n'est pas touché** | M-4 + AR-W8 : `detail` est libre, les cinq états suffisent. Toucher `evenements.js` obligerait à re-livrer `iakaInstall`. |

---

## 3. Arbitrages

*Présentés avec recommandation. **Le décideur tranche ; je ne tranche pas à sa place.***

### AR-W1 — Sur Windows, quel artefact pose-t-on ?

- **(a) Le `.exe` NSIS** (`windows-x86_64-nsis`, qui est aussi le porteur de la clé générique
  `windows-x86_64` — M-6), lancé en silencieux. Installation **par utilisateur**, dans
  `%LOCALAPPDATA%`, **sans UAC**.
- **(b) Le `.msi`** (`windows-x86_64-msi`), lancé par `msiexec /i … /passive`. Installation
  **par machine**, dans *Program Files*, **avec UAC obligatoire**.
- **(c) Les deux**, au choix de l'utilisateur par un drapeau.

**Recommandation : (a)**, sur un fait externe et un fait interne.
**Le fait externe (E-1)** : le MSI de Tauri est `InstallScope="perMachine"` **écrit en dur dans le
gabarit du bundler**, sans aucun paramètre pour le changer. Ce n'est pas un réglage que nos deux
apps auraient oublié de poser — **il n'existe pas**. Choisir (b), c'est choisir l'élévation, sans
recours.
**Le fait interne (M-7)** : les deux `tauri.conf.json` ne déclarent **aucune** section
`bundle.windows`. Le NSIS est donc à son défaut `currentUser` (E-2) — **il n'élève pas**, et il
n'y a rien à modifier chez les sœurs pour que ce soit vrai (AR-E est respecté : on ne touche pas à
ces dépôts).
**Ce que (b) coûterait en plus, et qui n'est pas qu'une invite** : une invite UAC est un dialogue
**modal**, hors du terminal. En mode `--events` ou `--json`, le programme qui pilote la chaîne
verrait `msiexec` rendre `1602` (annulé par l'utilisateur) **sans savoir pourquoi** — le contrat
machine perdrait sa lisibilité au moment précis où elle sert. (c) double la surface pour un gain
que personne n'a demandé.
**Ce que (a) coûte, dit** : l'installation est **par utilisateur**. Un poste multi-utilisateurs
devra la refaire par compte. C'est le prix, il est faible, et c'est déjà ce que la table de vitrine
annonce au visiteur (M-8).

### AR-W2 — `.deb` et `.rpm` : au périmètre ou exclus ?

- **(a) Exclus, avec motif écrit.**
- **(b) Au périmètre**, en demandant une élévation (`sudo dpkg -i`).

**Recommandation : (a).** E-9 : les deux écrivent dans l'arbre système et **enregistrent le paquet
auprès du gestionnaire**. Deux conséquences, dont la seconde est la plus grave : (1) il faut root,
que ce CLI n'a pas et ne doit pas demander ; (2) **le rollback AR-5 deviendrait malhonnête** — une
copie inverse ne défait pas un enregistrement APT ou DNF, et prétendre restaurer en effaçant des
fichiers gérés par un gestionnaire de paquets laisserait la base de paquets en désaccord avec le
disque. **AR-5 exige de ne défaire que ce qu'on peut prouver avoir changé** ; ici, on ne le peut
pas. L'exclusion est donc **doctrinale**, pas seulement pratique.
**Forme du refus** : le CLI ne lit **jamais** ces clés. S'il ne trouve pas la clé AppImage, il
**refuse en nommant l'AppImage manquante** — il ne se rabat **pas** sur `-deb` ou `-rpm`. Ce
non-repli est un critère (CA-W6), avec son contrefactuel.

### AR-W3 — Où pose-t-on l'AppImage ?

- **(a) `--apps-dir`, défaut `~/Applications`** — le drapeau et le défaut **déjà existants**
  (`install.js:407-409`).
- **(b) `~/.local/bin`.**
- **(c) Un nouveau défaut spécifique à Linux.**

**Recommandation : (a).** E-8 : `~/Applications` est l'emplacement conventionnel d'une AppImage ;
`~/.local/bin` est un dossier de **commandes du `PATH`**, où un binaire graphique de ~90 Mo n'a rien
à faire. Et surtout : **(a) ne crée aucune divergence** — le même drapeau, le même défaut, le même
message qu'aujourd'hui sur macOS. Chaque défaut par plateforme est une chose de plus à documenter,
à tester et à se rappeler.

### AR-W4 — Écrit-on un lanceur `.desktop` ?

- **(a) Non** (MVP), successeur nommé.
- **(b) Oui**, dans `~/.local/share/applications/`.

**Recommandation : (a).** Trois motifs. **(1)** C'est une **seconde cible d'écriture** sur une étape
dont le feu vert AR-4 a annoncé `--apps-dir` : écrire ailleurs que ce qu'on a annoncé est
exactement le glissement qu'AR-4 interdit. **(2)** `sauvegarderAvantEtape` prend **une** cible
(`rollback.js:35`) ; deux cibles demanderaient soit deux preuves, soit une preuve qui ment sur ce
qu'elle couvre. **(3)** Sans lanceur, l'application reste **lançable** — c'est le propre d'une
AppImage. On perd du confort, jamais une capacité.
**Successeur nommé, non cadré ici** : `LANCEUR-DESKTOP-LINUX`.

### AR-W5 — Que sauvegarde-t-on avant de lancer l'installeur Windows ?

- **(a) Le dossier d'installation existant**, découvert par le registre, avec **refus d'écrire** si
  une version est installée mais que son emplacement n'est pas déterminable ; rollback =
  `uninstall.exe /S` si rien n'existait, restauration du dossier sinon, **résidu de registre
  énoncé** (§ 2.3).
- **(b) L'ancien installeur**, re-téléchargé depuis la release de la version installée ; rollback =
  le rejouer.
- **(c) Rien** : refuser d'écrire dès qu'une version est présente.

**Recommandation : (a).** **Contre (b)** : il fait dépendre le rollback **du réseau et d'un tiers**,
au moment précis où quelque chose vient d'échouer — et rien ne garantit que la release de l'ancienne
version soit encore en ligne, ni même qu'on sache laquelle c'était. Un filet qui a besoin d'Internet
pour se déployer n'est pas un filet. **Contre (c)** : il transforme toute mise à jour en refus, donc
rend la chaîne inutilisable sur tout poste déjà équipé — c'est-à-dire le cas nominal après le
premier passage.
**Ce que (a) ne sait pas faire, et qui doit être ÉCRIT dans la sortie, pas seulement dans un
commentaire** : rétablir les valeurs de registre et les raccourcis. La garde 3 est faite pour ça
(`rollback.js:99-105`) ; ce lot lui donne son second usage.

### AR-W6 — Un lot ou deux ? Dans quel ordre ?

- **(a) Deux lots successifs : Linux d'abord, Windows ensuite.**
- **(b) Un seul lot, les deux plateformes ensemble.**
- **(c) Windows d'abord** (la plateforme la plus demandée).

**Recommandation : (a).** Linux est **structurellement le même geste que macOS** : un octet, une
cible remplaçable dans son entier, `sauvegarderAvantEtape` et `restaurerEtape` **inchangés**
(M-2). Il apporte une seule nouveauté — le bit d'exécution. Windows en apporte **trois d'un coup** :
un sous-processus installeur dont on ne contrôle ni le chemin ni les effets de bord, une cible qu'il
faut **découvrir** avant de la sauvegarder, et un rollback qui laisse des résidus à énoncer.
Les fondre, c'est perdre la capacité de fusionner la moitié sûre pendant que l'autre est encore en
mesure. **(c)** part de la plus dure sans avoir d'abord généralisé la table de clés et la famille
`poserBundle*` — le refactor et le risque arriveraient dans le même lot.

### AR-W7 — Faut-il un banc CI pour prouver Windows et Linux ?

- **(a) Oui** : un workflow `workflow_dispatch` dans `iakaframe`, sur `windows-latest` et
  `ubuntu-latest`, **écrit par ce lot et jamais lancé par un agent** (le déclenchement est un acte
  de CI, réservé au décideur).
- **(b) Non** : s'en tenir au gate humain sur machine réelle.

**Recommandation : (a).** C'est le **seul instrument de preuve** accessible pour des faits que ce
poste ne peut pas produire (E-3, la découverte du chemin d'installation, le comportement réel de
`chmod` + lancement). (b) laisserait le lot fusionner sur de la lecture de code seule.
⚠️ **Une exigence attachée, sans laquelle (a) installe une dette connue** : le
`.github/workflows/release.yml` d'`iakaframe` **n'est épinglé sur aucun SHA** — dette inscrite au
backlog du dépôt et rappelée par CA-20 du cadrage parent. **Le banc neuf épingle ses actions au SHA
dès sa création.** On ne recopie pas un défaut qu'on a nommé.
⚠️ **Et une limite à écrire dans le fichier de banc lui-même** : un runner GitHub n'est pas un poste
d'utilisateur. Il n'a ni session interactive, ni profil chargé, ni UAC dans les mêmes conditions.
**Le banc prouve que la mécanique s'exécute ; il ne prouve pas la recette.** Le gate humain reste dû
(§ 8).

### AR-W8 — Faut-il un état ou un `detail` nouveau au contrat machine ?

- **(a) Non** : les cinq états de `ETATS_ETAPE` suffisent, le motif vit dans `detail` (texte libre).
- **(b) Oui** : ajouter un état `necessite-elevation` (ou équivalent).

**Recommandation : (a).** M-4 : `ETATS_ETAPE` est **gelé** et gardé par CA-M15 ; `detail` est déjà
le canal des motifs — c'est par lui que passe `plateforme "x" non couverte` aujourd'hui
(`install.js:451`). Et sous **AR-W1(a)**, l'élévation **ne se produit jamais** : un état pour un cas
qui n'arrive pas serait un vocabulaire mort.
**Conditionnel écrit, pour que le successeur soit nommé et non improvisé** : **si** le décideur
tranche AR-W1 en **(b)** ou **(c)**, alors un état neuf devient justifiable, et il faut **toucher
`iakaInstall`** — la façade consomme ces états. Le lot successeur s'appellerait alors
**`IAKAINSTALL-ETAT-ELEVATION`** ; il n'est **pas** cadré ici et **pas** chiffré au § 9.

---

## 4. Périmètre

### Inclus

- `cleManifestePlateforme()` étendu à une **table** `{installeur, generique}` couvrant
  `linux/x64` et `win32/x64`, refus **conservé** pour tout le reste (§ 2.1).
- Sélection de l'entrée de manifeste **clé d'installeur d'abord, générique en repli** (M-6).
- `poserBundleLinux` : écriture de l'octet + `chmod 0o755` dans `--apps-dir`.
- `poserBundleWindows` : écriture d'un temporaire + exécution silencieuse de l'installeur NSIS +
  nettoyage du temporaire, **port d'exécution injectable** pour les tests (même idiome que
  `telechargerApp`, M-10).
- **Découverte de la cible Windows** par le registre, et le **refus d'écrire** quand elle est
  indéterminable alors qu'une version est présente (§ 2.3).
- **Rollback Windows** : `uninstall.exe /S` quand rien n'existait, restauration du dossier sinon,
  **résidu énoncé** dans la `raison` rendue.
- Messages, `etape-annoncee` et `etape-terminee` **par plateforme** : la cible annoncée est la vraie
  cible, y compris quand `--apps-dir` ne s'applique pas (CA-W9).
- **Rectification datée** du commentaire `app-bundle.js:44-51`, dont le motif est en partie faux
  (§ 1). **Dater, ne pas effacer.**
- `docs/commandes.md`, ligne `install`, **dans le même lot** — convention permanente du portefeuille.
- Le **banc CI** `workflow_dispatch`, actions **épinglées au SHA**, jamais déclenché par un agent.
- Les tests, avec leurs **contrefactuels** (§ 8).

### Exclus — et chaque exclusion porte son motif

- **Le `.msi`, le `.deb`, le `.rpm`** — AR-W1(a) et AR-W2(a).
- **Le lanceur `.desktop`** — AR-W4(a), successeur `LANCEUR-DESKTOP-LINUX`.
- **Toute modification d'`IakaCockpit` et d'`iakaFrameGUI`** — AR-E du cadrage parent : « ces deux
  dépôts ne sont pas à modifier par ce lot ». Ils sont lus, jamais écrits.
- **Toute modification d'`iakaInstall`** — la façade n'a rien à apprendre : sous AR-W8(a), aucun
  événement, aucun état, aucun champ ne change. Si un jour elle doit changer, c'est un lot nommé.
- **`cli/src/lib/evenements.js`** — AR-W8(a).
- **`cli/src/lib/minisign.js`** et `telechargerEtVerifier` — CA-14 est déjà générique (M-2). Y
  toucher serait rouvrir une garde qui tient.
- **Le chemin macOS** — inchangé, y compris ses tests. Le contrefactuel de non-régression est un
  critère (CA-W14).
- **Toute installation avec élévation**, sur les trois systèmes.
- **La désinstallation** comme verbe utilisateur — le `uninstall.exe` n'est employé **que** par le
  rollback, jamais exposé.
- **Le déclenchement du banc CI** — acte réservé au décideur.

---

## 5. Étapes pour ⚒️ Gimli

### Étape 0 — **Mesurer**, avant d'écrire une ligne

*Ce cadrage a été fait sans shell (§ 0.1). Ces mesures sont les prémisses qui me manquent ;
elles se font **avant** le code, et chacune est citée avec sa sortie.*

0.1 **Ligne de base** : la suite complète du CLI, verte, avec son chiffre. C'est le référent de
   toute non-régression annoncée ensuite.
0.2 **Taille réelle des artefacts** : peser, en anonyme, `IakaCockpit_0.32.2_amd64.AppImage`,
   `IakaCockpit_0.32.2_x64-setup.exe` et leurs jumeaux du GUI, aux URL exactes des manifestes
   (M-5). Comparer au `.app.tar.gz`. **Croiser avec le timeout de 30 s de `getBytes`**
   (M-9) → alimente R-W1 et l'arbitrage implicite « faut-il porter ce timeout ? ».
0.3 **Sur le banc `ubuntu-latest`** : poser l'AppImage, `chmod +x`, tenter `--appimage-version` ou
   `--appimage-extract` ; **noter si FUSE manque** (E-7). Citer la sortie, même en échec — surtout
   en échec.
0.4 **Sur le banc `windows-latest`**, et c'est la mesure la plus importante du lot :
   - lancer le `-setup.exe` avec `/S`, relever **le code de sortie et la durée** ;
   - relever **le chemin réel d'installation** ;
   - `reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall" /s` et **relever le nom
     exact de la sous-clé**, ses valeurs `DisplayName`, `DisplayVersion`, `InstallLocation`,
     `UninstallString` ;
   - vérifier la **présence et le nom** de l'exécutable de désinstallation, et son comportement
     sous `/S`.
   **Aucune de ces quatre valeurs n'est supposée par ce cadrage.** Si l'une d'elles contredit
   § 2.3, **remonter avant de coder** : c'est un point d'arbitrage, pas un détail à trancher au
   clavier.

### Étape 1 — Lot **W-L**, Linux

1. Étendre `cleManifestePlateforme()` à la table du § 2.1 (les deux plateformes d'un coup : la
   table est une donnée, la scinder n'aurait pas de sens) ; **les refus existants restent verts**.
2. Sélection installeur→générique, en fonction **pure** et testée à part.
3. `poserBundleLinux` + cible `<apps-dir>/<Nom>.AppImage` dans `etapeApp` (M-3 : le `.app` en dur
   disparaît au profit d'une dérivation par plateforme).
4. Tests + contrefactuels du § 8, dont le **non-repli sur `-deb`/`-rpm`** (CA-W6).
5. `docs/commandes.md` mis à jour dans ce lot.
6. **Remise au gate 🏹 Legolas.** Ne pas enchaîner sur Windows avant le verdict (AR-W6).

### Étape 2 — Lot **W-W**, Windows

7. Découverte de la cible par le registre + les trois cas du § 2.3, dont le **refus**.
8. `poserBundleWindows`, avec son **port d'exécution injectable**.
9. Rollback Windows et l'**énoncé du résidu** dans `orchestrerRollback`.
10. `--apps-dir` sans effet : le **dire** (CA-W9).
11. Tests + contrefactuels.
12. Remise au gate.

### Étape 3 — Banc CI

13. `.github/workflows/…` `workflow_dispatch`, matrice `windows-latest` / `ubuntu-latest`, actions
    **épinglées au SHA**, limite du banc **écrite dans le fichier**. **Ne pas le déclencher.**

---

## 6. Fichiers concernés

**`iakaframe` — écrits**
- `cli/src/lib/app-bundle.js` — table de clés, sélection installeur→générique, `poserBundleLinux`,
  `poserBundleWindows`, découverte de la cible Windows, **rectification datée** du commentaire
  `:44-51`.
- `cli/src/commands/install.js` — `etapeApp` : cible dérivée par plateforme (le `.app` en dur de
  `:483` tombe), messages et `champs` des événements, câblage du refus d'écrire.
- `cli/src/lib/rollback.js` — **cas Windows** (désinstalleur) et **énoncé du résidu**. ⚠️ Les trois
  gardes existantes ne se réécrivent pas : elles s'**étendent**.
- `cli/src/lib/http.js` — timeout de `getBytes` **si et seulement si** la mesure 0.2 le justifie.
- `docs/commandes.md` — ligne `install`.
- `cli/test/app-bundle.test.js`, `cli/test/install-etapes-3-4.test.js`, `cli/test/rollback.test.js`
  + fichiers neufs.
- `.github/workflows/<banc>.yml` — **neuf**.

**Lus, jamais écrits**
- `IakaCockpit/updater/latest.json`, `iakaFrameGUI/updater/latest.json`,
  `IakaCockpit/fixtures/updater-cles.json`, les deux `tauri.conf.json`, `iakaInstall`.

**Explicitement non touchés**
- `cli/src/lib/evenements.js` · `cli/src/lib/minisign.js` · le chemin macOS de `poserBundleDarwin`.

---

## 7. Risques

| # | Risque | Mitigation |
|---|---|---|
| **R-W1** | **Le timeout de 30 s de `getBytes` (M-9) coupe le téléchargement** d'un AppImage ou d'un `-setup.exe`, bien plus lourds que le `.app.tar.gz`. Le symptôme serait un `ECHEC telechargement … (statut 0)` **indiscernable d'un réseau mort**. | Mesure 0.2 **avant** de coder. Si le fait est établi : porter le timeout et **distinguer l'avortement du refus** dans le message. Ne pas augmenter « au cas où » sans chiffre. |
| **R-W2** | **`/S` n'est attesté que par la source du plugin updater** (E-3), pas par la doc de distribution. Rien ne garantit son comportement hors du contexte de l'updater. | Mesure 0.4. Le code de sortie **est** le verdict ; jamais un succès supposé. Si `/S` se révèle inadapté, `/P` (passif, avec barre de progression) est le repli — à remonter, pas à choisir seul. |
| **R-W3** | **`--apps-dir` ne s'applique pas à Windows** (E-4) et l'utilisateur croit le contraire. | CA-W9 : le CLI **le dit** à l'annonce de l'étape. |
| **R-W4** | **L'application cible est en cours d'exécution** : Windows verrouille les binaires ouverts, l'installeur échoue ou remplace partiellement. Ni macOS ni Linux n'ont ce mode de défaillance. | Le code de sortie non nul **arrête l'étape** ; le rollback joue sur la preuve prise avant. **Ne pas tuer de processus** — ce serait un geste destructif hors périmètre. |
| **R-W5** | **La pose Linux réussit et le lancement échoue**, faute de FUSE 2 (E-7). Le CLI dirait « posé », l'utilisateur verrait une erreur. | Mesure 0.3. Le CLI **ne promet que ce qu'il fait** : « posé à `<chemin>` », jamais « installé et prêt ». La dépendance FUSE se **déclare** dans la doc de la vitrine, pas dans un message d'étape. |
| **R-W6** | **Le rollback Windows laisse un résidu** (registre, raccourcis) et se croit entier. | § 2.3, garde 3 : le résidu est **énoncé dans la sortie**, jamais un « restauré » global. Contrefactuel CA-W11. |
| **R-W7** | **On déclare « couvert » ce qui n'est que « codé »** — le faux vert que R8 du cadrage parent nomme déjà. | § 8 : gate humain **par OS**, jamais compté. Le banc CI **ne vaut pas recette** et le dit dans son propre fichier. |
| **R-W8** | **Le refactor de la table de clés casse macOS**, la seule plateforme prouvée. | CA-W14 : non-régression **mesurée**, pas affirmée — les tests macOS existants passent **sans être modifiés**. Un test qu'on doit retoucher pour qu'il passe est un signal, pas une formalité. |
| **R-W9** | **Le nom de la sous-clé de registre est deviné** au lieu d'être mesuré, et le refus du § 2.3 ne se déclenche jamais (garde morte) ou se déclenche toujours (chaîne inutilisable). | Mesure 0.4, **bloquante** : si elle contredit § 2.3, remonter avant de coder. Et CA-W10 exerce le refus sur un registre **simulé**, pour qu'il ne puisse pas être vide. |

---

## 8. Critères d'acceptation

*Chacun porte son **contrefactuel** : une mutation du **programme** (jamais de l'attendu) qui doit
faire rougir **ce critère-là, nommément**, et qui est **révoquée avec preuve**.*

### Lot W-L — Linux

- [ ] **CA-W1** — `cleManifestePlateforme({platform:'linux',arch:'x64'})` rend le couple
      `{installeur:'linux-x86_64-appimage', generique:'linux-x86_64'}`.
      **Contrefactuel** : inverser l'ordre du couple ⇒ le test de sélection (CA-W2) rougit.
- [ ] **CA-W2** — La sélection lit **la clé d'installeur d'abord**, la générique **en repli**, sur
      un manifeste de fixture portant les deux **avec des URL différentes**.
      **Contrefactuel** : retirer le repli ⇒ un manifeste sans clé d'installeur fait rougir
      nommément. ⚠️ **Verrou anti-témoin-vide** : les deux clés doivent porter des URL
      **distinctes**, sinon le test serait satisfait quelle que soit celle qui gagne.
- [ ] **CA-W3** — Pose neuve : l'AppImage est écrite à `<apps-dir>/<Nom>.AppImage`, **octet pour
      octet** identique à ce qui a été vérifié, et son mode porte le bit d'exécution
      (`fs.statSync(cible).mode & 0o111` non nul). *Mesurable sur ce poste.*
      **Contrefactuel** : retirer le `chmod` ⇒ rougit.
- [ ] **CA-W4** — **AR-5 garde 1** : la sauvegarde est prise **avant** l'écriture, et
      `preuve.existaitAvant` vaut `false` sur une pose neuve, `true` sur un remplacement — **sur un
      fichier**, pas seulement un dossier.
- [ ] **CA-W5** — **AR-5 garde 2** : une AppImage **déjà présente** est **restaurée** à l'octet
      quand l'étape 4 échoue après que l'étape 3 a écrit. **Jamais effacée.**
      **Contrefactuel** : forcer la branche « retirer » ⇒ rougit.
- [ ] **CA-W6** — **Non-repli sur `-deb`/`-rpm`** : sur un manifeste où
      `linux-x86_64-appimage` **et** `linux-x86_64` sont absents mais `linux-x86_64-deb` et
      `-rpm` sont présents **et signés**, l'étape **REFUSE en nommant l'AppImage manquante** et
      **n'écrit rien**.
      **Contrefactuel** : ajouter un repli sur `-deb` ⇒ rougit nommément.
      ⚠️ **C'est le critère le plus facile à rendre vide** : la fixture doit contenir des entrées
      `-deb`/`-rpm` **valides**, sinon le refus s'expliquerait par leur invalidité et non par le
      non-repli.
- [ ] **CA-W7** — `--dry-run` sur Linux **n'écrit rien**, prouvé par **empreinte du répertoire
      cible avant/après**, pas par lecture de code — et la chaîne **continue** à décrire les étapes
      suivantes, comme aujourd'hui (`install.js:438-441`).

### Lot W-W — Windows

- [ ] **CA-W8** — `cleManifestePlateforme({platform:'win32',arch:'x64'})` rend
      `{installeur:'windows-x86_64-nsis', generique:'windows-x86_64'}`, et **le `.msi` n'est
      jamais lu** — même exigence de fixture non vide que CA-W6.
- [ ] **CA-W9** — L'annonce d'étape sur Windows **dit que `--apps-dir` ne s'applique pas** et
      nomme la cible réelle (ou son indétermination). Aucun message ne prétend poser dans
      `--apps-dir`.
      **Contrefactuel** : rétablir l'annonce macOS ⇒ rougit.
- [ ] **CA-W10** — **Refus d'écrire (§ 2.3)** : registre simulé indiquant une version installée
      **sans `InstallLocation` exploitable** ⇒ l'étape **refuse**, **aucun sous-processus
      d'installation n'est lancé** (compteur d'appels sur le port injecté = 0), rien n'est écrit.
      **Contrefactuel** : supprimer le refus ⇒ l'installeur est lancé et le compteur rougit.
- [ ] **CA-W11** — **AR-5 garde 3, résidu énoncé** : le rapport de rollback Windows **nomme** ce
      qu'il n'a pas su défaire (registre, raccourcis). Aucun « restauré » global n'est imprimé.
      **Contrefactuel** : remplacer l'énoncé par une phrase d'ensemble ⇒ rougit.
- [ ] **CA-W12** — **Code de sortie non nul de l'installeur** ⇒ étape `echouee`, **le code est dans
      le `detail`**, la chaîne s'arrête (CA-07 hérité), et le rollback des étapes précédentes joue.
- [ ] **CA-W13** — `--dry-run` sur Windows **n'écrit rien et ne lance aucun sous-processus**
      (compteur = 0).

### Transverses

- [ ] **CA-W14** — **Non-régression macOS** : tous les tests macOS existants
      (`app-bundle.test.js`, `install-etapes-3-4.test.js`) passent **sans qu'une seule de leurs
      lignes soit modifiée**. *Un test qu'il faut retoucher pour qu'il passe est un signal.*
- [ ] **CA-W15** — Le refus CA-15 **survit** : `linux/arm64`, `win32/arm64`, `darwin/ia32` rendent
      toujours un refus nommé, sans consulter le réseau (le compteur de `resoudreEndpointsApp`
      reste à 0, comme `install-etapes-3-4.test.js:105` le prouve déjà pour `win32/x64`).
- [ ] **CA-W16** — **CA-14 tenu sur les trois plateformes** : un bundle dont l'octet servi ne
      correspond pas à la signature annoncée est **refusé** et **rien n'est écrit**, sur Linux et
      sur Windows comme sur macOS.
- [ ] **CA-W17** — **Le contrat machine est inchangé** : aucun `evt` ni `etat` nouveau ;
      `cli/src/lib/evenements.js` a un `git diff` **vide**. Les motifs nouveaux passent par
      `detail`.
- [ ] **CA-W18** — `docs/commandes.md` décrit le comportement des trois plateformes, **dans le même
      lot**.
- [ ] **CA-W19** — Le banc CI existe, ses actions sont **épinglées au SHA**, et sa limite (« un
      runner n'est pas un poste ») est **écrite dans le fichier**.

### 🛑 Gate humain, déclaré par OS — jamais compté comme couvert

*Précédent R8 du cadrage parent, tenu à la lettre : « buildé et signé ne vaut pas recetté ».*

| OS | Ce qui est prouvable sur ce poste (macOS arm64) | Ce que le banc CI peut montrer | **Ce qui reste un gate humain** |
|---|---|---|---|
| **macOS** | tout le chemin existant | — | *(déjà couvert par le lot C.1)* |
| **Linux** | table de clés · sélection · **copie de l'octet** · **`chmod`** · sauvegarde/rollback sur fichier · refus · dry-run | la copie et le `chmod` sur un vrai `ubuntu-latest` | **l'AppImage se LANCE** sur une distribution réelle, avec ou sans FUSE 2 (E-7) — et **elle est utilisable** |
| **Windows** | table de clés · sélection · refus · dry-run · **rollback sur port injecté** | code de sortie de `/S` · chemin réel · clé de registre · `uninstall.exe` | **l'installation réelle**, l'absence d'UAC, l'app **qui démarre**, et le **rollback réel** sur une machine déjà équipée |

**Aucun critère ci-dessus ne suppose une de ces trois lignes.** Un critère non mesuré se déclare
*non mesuré*, jamais *PASS* — et une formule d'ensemble (« tout est vert ») vaut FAIL.

**Actes refusés aux agents** : déclencher le banc CI, pousser un tag, créer une release.

---

## 9. Estimation

*Ordre de grandeur assumé et révisable — **pas un engagement ferme**.*

| Lot | j-homme | Complexité / risque | Inconnues qui peuvent le faire glisser |
|---|---|---|---|
| **Étape 0** — mesures | **0,5** | faible, mais **bloquante** | l'accès au banc dépend d'un déclenchement du décideur (AR-W7) : sans lui, 0.3 et 0.4 sont **indisponibles** et le lot W-W ne peut pas commencer honnêtement |
| **W-L** — Linux | **1,5** | **moyenne-basse** | aucune structurelle : le geste est celui de macOS. Le seul aléa est R-W1 (timeout) |
| **W-W** — Windows | **2,5** | **forte** | **R-W9** (le nom de la clé de registre n'est pas établi) · **R-W2** (`/S` non documenté) · le rollback partiel, qui est au lot W-W ce que le rollback était au lot C.1 |
| **Banc CI** | **0,5** | faible | épinglage SHA à faire proprement dès la création |
| **Total** | **≈ 5** *(fourchette **3,5 – 9**)* | | |

**Ce qui explique la fourchette haute.** Trois choses, dans l'ordre de force :
1. **Windows est cadré sur des faits que je n'ai pas pu mesurer** (§ 0.1). Si l'étape 0 contredit
   § 2.3 — clé de registre différente, `InstallLocation` absent du NSIS de Tauri, `/S` inopérant —
   la forme de la sauvegarde AR-5 est **à re-arbitrer**, et c'est un aller-retour au décideur, pas
   une correction au clavier.
2. **Le rollback Windows est le morceau dont je ne peux pas borner le coût** par comparaison avec
   de l'existant — exactement ce que le cadrage parent disait du rollback de C.1, qui portait « à
   lui seul la moitié du risque du lot ».
3. **Rien de tout cela ne se recette ici.** Le lot peut être livré, gaté, vert, et rester **non
   recetté** sur ses deux plateformes cibles. Ce n'est pas une dette de code : c'est la nature du
   travail, et c'est pourquoi le gate humain du § 8 est écrit **par OS**.

**Ce qui n'est PAS compté** : le successeur `LANCEUR-DESKTOP-LINUX` (AR-W4) et, sous AR-W1(b)/(c)
seulement, `IAKAINSTALL-ETAT-ELEVATION` (AR-W8). Les compter d'office reviendrait à trancher à la
place du décideur.
