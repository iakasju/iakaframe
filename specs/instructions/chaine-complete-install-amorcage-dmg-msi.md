# La chaîne complète d'installation, et ses deux véhicules d'amorçage (DMG, MSI)

> Cadrée par 🔵 **Gandalf**, le **2026-09-03**, sur **directive du décideur** relayée par 🟡 Odin.
> **Lecture seule** sur le code pendant le cadrage : **tout fait chiffré ci-dessous a été relevé sur
> le disque ou vérifié sur le web ce jour**, jamais repris d'un brief ni d'une mémoire de session.
> Les allégations qui m'ont été transmises ont été **re-mesurées** ; **quatre d'entre elles sont
> corrigées** en § 0.2, et cette correction **change le périmètre du lot**.
> ⚠️ **Cette promesse a connu UNE exception, et elle est nommée plutôt que tue** : l'illustration
> d'AR-F, conséquence 2, était tirée d'un **commentaire du code** (`install.mjs:50`) et non du
> disque. Elle était **fausse**. Rectifiée datée en § 4.0 ; risque **R11** ouvert pour que la
> classe de défaut ne se reproduise pas. **Une promesse d'exhaustivité qui a été démentie une fois
> se corrige ; elle ne se réaffirme pas.**
>
> **Portée portefeuille** : le lot traverse `iakaframe`, `IakaCockpit`, `iakaFrameGUI`, plus un
> **dépôt neuf** — **AR-E tranché (a)** le 2026-09-03.
>
> **Cadrage parent, non rediscuté** :
> `specs/instructions/bundle-complet-install-4-composants.md` (7 arbitrages tranchés le 2026-08-28).
> AR-3(c) installeur **graphique**, façade au-dessus d'un moteur CLI, jamais une seconde
> implémentation · AR-4(a) une validation par étape, `--yes` les saute · AR-5(c) rollback
> automatique + ses trois gardes · AR-6 les 4 plateformes d'emblée.
> **Ce cadrage-ci ne rouvre aucun des sept.** Il ferme le périmètre des lots **A** et **C**, et
> **acte l'état mesuré** des lots **0** et **B**.
>
> ~~⚠️ **EN ATTENTE D'ARBITRAGE**~~ → **ARBITRÉ le 2026-09-03.** Les **huit** arbitrages
> (AR-A..AR-H) ont été posés un par un et **tranchés par Stéphane** — verdict verbatim : « je
> valide toutes les recos, lance l'exécution ». **Les huit recommandations sont retenues telles
> quelles**, y compris les sous-questions et les exigences attachées à chacune. Verdicts et
> **conséquences inscrites** en **§ 4.0** ; découpage d'exécution en **§ 6.0**.
>
> **AMENDÉ le 2026-09-04**, après le **gate 🏹 Legolas du lot A** (verdict FAIL, sur un défaut
> d'implémentation **hors cadrage**). **Deux points de cette instruction étaient en cause, et un
> seul était une faute :**
> 1. **Une illustration FAUSSE** — l'exemple `StefFrame2` d'AR-F, conséquence 2. **Rectifié daté**
>    en § 4.0, avec **l'origine de l'erreur établie**. **Le verdict AR-F(a) et CA-06 tiennent** ;
>    seule l'illustration tombe.
> 2. **Un angle mort** — `install.mjs` ne part dans aucun artefact publié, donc la chaîne serait
>    amputée **pour l'utilisateur nominal**. Inscrit en **prérequis d'entrée du lot C** (§ 5.4),
>    **R10** (§ 8) et **CA-21** (§ 9), avec son successeur nommé et sa condition d'arbitrage.
>
> **Aucun verdict n'est déplacé. Aucun chiffre ne bouge** (total ≈ 8,75 j). **Un critère est
> ajouté** : CA-21. Deux risques neufs : **R10**, **R11**.

---

## 0. Ce qui a été mesuré le 2026-09-03

### 0.1 — Instruments

Mesures faites par **lecture de fichiers** (aucun shell disponible dans cette session de cadrage) et
par **vérification web** pour les faits externes. Cette limite est déclarée : elle borne ce que je
peux affirmer, et elle est signalée à chaque fait concerné.

### 0.2 — Les quatre corrections aux allégations reçues

| # | Allégation reçue | Verdict après mesure |
|---|---|---|
| F-a | « le verbe `install` est absent du CLI 0.39.0 » | ✅ **CONFIRMÉ**, et par deux voies indépendantes : `cli/src/lib/verbes.js` — le **registre déclaratif** qui est la source unique de l'aide — porte **38 verbes**, aucun nommé `install` ; et `grep install cli/src/index.js` ne ramène **rien**. |
| F-c | « les MSI existent déjà, par app » | ✅ **CONFIRMÉ et élargi** : `iakaFrameGUI/updater/latest.json` (v0.1.8) et `IakaCockpit/updater/latest.json` (v0.32.2) portent **9 clés chacun**, dont `windows-x86_64-msi`, sur **4 plateformes**, toutes **signées** minisign, **toutes les URL sur les releases GitHub**. |
| **Lot 0** | *(non mesuré par le brief)* | ⚠️ **LIVRÉ, contrairement à ce que le cadrage parent laisse croire.** Voir § 5.1. |
| **Lot B** | *(non mesuré par le brief)* | ⚠️ **LIVRÉ pour les deux apps.** Voir § 5.2. |
| F-d | « défaut de signature macOS » | 🟠 **CAUSE CONFIRMÉE PAR LECTURE, SYMPTÔME NON RE-MESURÉ PAR MOI.** Voir § 0.4 — et lire la nuance, elle compte. |
| F-b | « faux ami : "LOT A livre" des commits de tête » | ✅ **CONFIRMÉ** : les backlogs des deux apps numérotent L40..L45 (clés d'installeur, gardes tièdes, garde du `latest`, dette de canal). **Aucun de ces lots n'est le lot A du bundle.** |

**Conséquence directe sur le périmètre** : le décideur demande « la chaîne complète ». La bonne
nouvelle mesurée est que **deux des quatre lots du cadrage parent sont déjà là**. Le travail réel est
**A** et **C**, plus une **extension** de la convention du lot B à une troisième application.

### 0.3 — Faits internes relevés (chemin:ligne)

- **M1 — Le CLI est en `0.39.0`** (`cli/package.json:3`), Node **≥ 20** requis (`cli/package.json:9-11`).
- **M2 — La méthode voyage bien dans le tarball du CLI** : `files: ["src", "_bundled", "README.md"]`
  (`cli/package.json:12-16`), et `cli/_bundled/` contient **447+ fichiers** de bibliothèque
  (personas, principles, guardrails, methods, teams, bindings).
- **M3 — La source unique de version est `cli/package.json`** (`cli/src/lib/version.js:1`,
  `:17`). `cli/_bundled/VERSION` vaut **`v0.39.0`** et est **dérivé de cette même autorité**
  (`cli/scripts/bundle.js:98-110`). **Ce fait commande AR-F — voir § 4.6, c'est le plus important
  du cadrage.**
- **M4 — L'installeur de la méthode existe déjà** : `install.mjs` à la racine, Node pur zéro
  dépendance, **fan-out multi-hôte** `{claude, codex, openwebui}`, avec
  `--merge` (défaut) `--overwrite` `--keep` `--dry-run` `--backup-dir` `--yes` `--hosts`
  (`install.mjs:28-33`). **L'étape 2 de la chaîne n'a donc pas de plomberie à écrire.**
- **M5 — Le fan-out de push est livré** : `pousserFanout` (`cli/src/lib/canaux.js:75-85`), câblé
  dans le checkpoint (`cli/src/commands/update.js:7`, `:132-133`), chaque cible réussissant ou
  échouant **indépendamment** et **nommée** à l'écran (`formaterFanout`, `:108-122`).
- **M6 — Le verbe de synchronisation est livré** : `canaux` (`cli/src/lib/verbes.js:99-105`),
  7 états dont `injoignable` et `inconnu` (`cli/src/lib/canaux.js:136`), mesure **datée**
  (`mesurerCanaux`, `:198-202`), séparation stricte **mesuré en direct / dernier fetch connu**
  (`:128-133`, `dernierConnu` `:153-164`), et `rattraper` (`:215-239`) qui **refuse** tout ce qui
  n'est pas une avance rapide, en le disant, **sans jamais `--force`**.
- **M7 — `lib/forgejo.js` porte bien une LISTE** : `DEF_URLS = ['http://192.168.1.139:3001',
  'http://192.168.2.11:3001']` (`cli/src/lib/forgejo.js:18`).
- **M8 — Le `publishConfig` du CLI est resté MONO-VALEUR** : un seul registre, le NAS
  (`cli/package.json:30-32`). **Seul reliquat mesuré du lot 0.**
- **M9 — La voie publique réelle du CLI n'est pas npm, c'est le tarball de la release GitHub.**
  Le README le dit noir sur blanc : le registre `@naonedge` « n'est **pas accessible depuis
  Internet** » (`README.md:65-67`) ; la voie recommandée est
  `npm install -g naonedge-iakaframe-0.39.0.tgz` (`README.md:28`) ; et le workflow qui produit ce
  tarball **a tourné pour de vrai** — run `33635520511`, asset porté par `github-actions[bot]`
  (`\.github/workflows/release.yml:64-73`). **Ce fait déplace AR-7 du cadrage parent — voir AR-H.**
- **M10 — Les endpoints d'auto-update sont DEUX, pas trois, et c'est une décision**, pas un oubli :
  `iakaFrameGUI/src-tauri/tauri.conf.json:42-45` et
  `IakaCockpit/src-tauri/tauri.conf.json:42-45` portent le NAS puis `raw.githubusercontent.com`.
  L'iakabox a été **retirée délibérément le 2026-09-03**, avec **motif et condition de levée
  écrits** (`IakaCockpit/fixtures/canaux-publication.json:24-30`). Le « triple canal » du § 0 du
  cadrage parent est donc **superséde par une décision plus récente et mieux motivée**.
- **M11 — Les deux manifestes updater sont à jour et complets** : 9 clés, 4 plateformes, signées,
  URLs GitHub (`iakaFrameGUI/updater/latest.json`, `IakaCockpit/updater/latest.json`).
- **M12 — La matrice de build à 4 plateformes existe et tourne** :
  `iakaFrameGUI/.github/workflows/release.yml:39-44` (`macos-arm64`, `macos-x64`, `linux`,
  `windows`), action **épinglée au SHA** `84b9d35b…` (`:93`). Structure identique côté Cockpit.
- **M13 — La table de vitrine est mono-application par construction** :
  `fixtures/vitrine-assets.json` substitue **un seul** `{APP}`, tiré du `productName` de
  `tauri.conf.json`. **Ce fait commande AR-E — une seconde app dans un dépôt existant casserait
  cette table.**

### 0.4 — F-d : ce que je peux affirmer, et ce que je ne peux pas

**Ce que j'affirme, par lecture — la CAUSE.** Ni `iakaFrameGUI/src-tauri/tauri.conf.json:26-37`
ni `IakaCockpit/src-tauri/tauri.conf.json:26-37` ne portent de section `bundle.macOS`, donc **aucun
`signingIdentity`**. Et les deux `release.yml` ne portent **aucun secret Apple** : les seuls secrets
de signature sont `TAURI_SIGNING_PRIVATE_KEY` / `…_PASSWORD`
(`iakaFrameGUI/.github/workflows/release.yml:100-101`, idem Cockpit), qui sont les clés **minisign
de l'updater** — une signature qui **n'a rien à voir avec Gatekeeper**. Aucune étape `notarytool`,
aucun `staple`, dans aucun des deux workflows. ⇒ **Les bundles publiés ne peuvent structurellement
porter qu'une signature ad-hoc, sans TeamIdentifier et sans ticket de notarisation.**

**Ce que je n'affirme pas.** Je n'ai **pas** rejoué `codesign -v --deep --strict` ni `spctl` :
aucun shell dans cette session. Le symptôme rapporté est **cohérent avec la cause que je viens
d'établir**, mais je ne le re-signe pas comme ma mesure. À re-mesurer par l'exécution, avec sa
sortie citée.

**Ce que dit le monde extérieur, vérifié ce jour.** Distribuer hors App Store sans avertissement
Gatekeeper exige un **certificat Developer ID** et une **notarisation**, donc une adhésion
**Apple Developer Program à 99 $/an** — il n'y a pas de voie gratuite. Et depuis **macOS 15
Sequoia**, le contournement historique par **Control-clic a été retiré** : l'utilisateur doit
passer par *Réglages Système > Confidentialité et sécurité*, cliquer, puis saisir un mot de passe
administrateur. **Un installeur qui impose ce parcours à un utilisateur qui vient de
double-cliquer un DMG est un installeur qui a déjà échoué à sa première seconde.**

**La nuance qui décide du périmètre** : ce défaut **n'est pas créé par ce lot**. Il frappe déjà les
deux applications publiées. Ce lot ne fait que le **tripler et le rendre visible au premier
contact** — parce que le DMG demandé est, par construction, la **toute première** chose qu'un
utilisateur touche. → **AR-D.**

### 0.5 — Les faits externes, vérifiés le 2026-09-03

- **Un DMG n'exécute rien.** C'est une image disque : on la monte, on copie. Elle peut **porter**
  ce qui enchaîne ; elle ne peut pas enchaîner.
- **Sur macOS, la forme native d'un installeur multi-composants est le `.pkg` de distribution**
  (`pkgbuild` pour chaque composant, `productbuild` pour l'assemblage), qui sait poser plusieurs
  charges et exécuter des scripts `preinstall`/`postinstall`. Il se signe avec un certificat
  **Developer ID Installer** — distinct du Developer ID Application — et se notarise.
- **Tauri ne sait pas produire de `.pkg`.** Les cibles de bundle supportées sont
  `deb`, `rpm`, `appimage`, `nsis`, `msi`, `app`, `dmg`, `all`. **Aucun `pkg`.** Un `.pkg`
  serait donc une chaîne de build **entièrement neuve**, hors de tout ce qui est éprouvé ici.
- **Un MSI ne peut pas en enchaîner d'autres.** Les *concurrent / nested installations* sont une
  fonctionnalité **dépréciée** de Windows Installer, dont la documentation Microsoft dit
  explicitement de **ne pas s'en servir pour un produit destiné au public** ; Windows Installer
  n'exécute **qu'un seul MSI à la fois**.
- **La forme canonique d'un chaînage Windows est un bundle WiX Burn**, qui produit un
  **`.exe`** — pas un `.msi`.
- **On ne peut pas produire de MSI sur ce poste** (macOS). Seul le runner `windows-latest` de la
  matrice CI (M12) le peut.

---

## 1. Problème

Le décideur demande : « **fabrique une install DMG et MSI enchaînant l'install des trois** ».

Reformulé : *il veut un point de départ unique par système — un fichier qu'on double-clique et qui
mène à un poste équipé*, au lieu des trois téléchargements manuels qu'il a dû faire ce jour.

Puis, en cours de cadrage : « **cadre aussi le lot A, on fait la chaîne complète** ». Donc le moteur
qui enchaîne entre dans le périmètre, pas seulement le véhicule qui l'amorce.

**Trois obstacles se dressent entre cette demande et sa lettre**, et ils sont mesurés :

1. **Le moteur n'existe pas** (F-a/M1). Le verbe `install` est absent. Sans lui, un installeur
   graphique n'aurait rien à mettre en façade — ou serait la seconde implémentation qu'AR-3 interdit.
2. **Ni un DMG ni un MSI ne peuvent « enchaîner »** (§ 0.5). Le premier n'exécute rien ; le second
   ne peut pas en lancer d'autres. Les deux véhicules ne peuvent qu'**amorcer** ce qui enchaîne.
3. **Le DMG produit sera bloqué par Gatekeeper** chez tout utilisateur qui le télécharge par
   navigateur (§ 0.4), tant qu'aucune notarisation Apple n'existe.

Le cadrage ci-dessous ne masque aucun des trois.

---

## 2. Le décalage de comptage : trois ou quatre ?

Le décideur dit **trois** ; le cadrage parent dit **quatre**. **Les deux ont raison, et ils ne
comptent pas la même chose.** Tranché ici plutôt que laissé flotter :

| Axe | Compte | Détail |
|---|---|---|
| **Artefacts à obtenir** | **3** | le tarball du CLI, le bundle du Cockpit, le bundle du FrameGUI |
| **Étapes d'installation** | **4** | CLI · **méthode** · Cockpit · FrameGUI |

**La méthode n'a pas d'artefact propre** — elle voyage dans le tarball du CLI (M2), et c'est déjà
vrai aujourd'hui. **Mais elle a sa propre étape** : sa charge est posée par `install.mjs` (M4), dans
`~/.claude` et `~/.codex`, avec ses propres drapeaux et son propre mode d'échec. **Une charge, deux
gestes.**

**Fusionner les étapes 1 et 2 est interdit par AR-4.** Un consentement donné pour écrire dans
`/usr/local/lib` ne couvre pas une écriture dans `~/.claude` : ce sont deux endroits, deux risques,
deux décisions. C'est exactement ce que le cadrage parent motive en AR-4 — « les quatre composants
écrivent à des endroits **très différents** ; un consentement global masquerait ce que chacun
fait ».

→ **La chaîne a QUATRE étapes et TROIS téléchargements.** Les deux comptes sont conservés, chacun
sur son axe, et l'interface doit dire les deux : *« 4 étapes, 3 téléchargements »*.

---

## 3. Décision retenue — la forme réelle des deux véhicules

**Sous réserve d'AR-B et AR-C**, la décision recommandée est la suivante, et elle **nomme son écart
avec la lettre de la demande** :

> **Ce qu'on livre** : un `.dmg` et un `.msi` qui **posent l'application d'installation**. C'est
> **cette application** qui enchaîne les quatre étapes, avec une validation par étape (AR-4) et le
> rollback à trois gardes (AR-5).
>
> **L'écart, dit** : le DMG et le MSI **n'enchaînent pas** — ils **amorcent**. Aucun des deux ne le
> peut : un DMG n'exécute rien, un MSI ne peut pas lancer d'autres MSI (§ 0.5). Ce n'est pas un
> renoncement, c'est la seule forme que ces deux conteneurs admettent.

**Pourquoi c'est très probablement la lecture juste de la demande.** Le décideur a dû, ce jour,
faire **trois** téléchargements et **trois** installations séparées. Ce qu'il demande, c'est **un
seul point de départ par système**. Un DMG qui pose un installeur, lequel fait le reste, **répond
exactement à cela** : un fichier, un double-clic, une chaîne. La lettre parlait de mécanique ; le
besoin porte sur le nombre de gestes.

**Pourquoi cette forme est aussi la moins chère, et de loin.** L'application d'installation est
**elle-même une app Tauri**. Elle hérite donc **sans un jour de travail** de tout ce qui est déjà
éprouvé et mesuré : la matrice de build à 4 plateformes épinglée (M12), qui produit **de front** le
`.dmg` arm64, le `.dmg` Intel, le `.msi`, le `.exe` NSIS, le `.deb`, le `.rpm` et l'AppImage (M11,
F-c). **Les deux véhicules demandés tombent de la chaîne existante.** Choisir un `.pkg` (AR-B) ou un
bundle Burn (AR-C) reviendrait au contraire à **ouvrir deux chaînes de build neuves** — et, pour le
Burn, à réimplémenter la logique de chaînage en WiX, ce qu'AR-3 interdit nommément.

**Corollaire à écrire dans l'interface** : les deux véhicules servent aussi de **repli**. Un
utilisateur qui refuse la chaîne peut n'installer que le CLI ; l'invariant du § 3 du cadrage parent
(« on doit pouvoir n'installer que le CLI ») **survit** à ce lot.

---

## 4. Arbitrages

### 4.0 — Verdicts du 2026-09-03

*Tranchés par Stéphane. **Cette section est celle que ⚒️ Gimli lit.** Ce qui n'y figure pas sera
tranché en silence par le premier qui code — c'est la raison d'être des « conséquences inscrites ».*

| # | Question | Verdict | vs reco |
|---|---|---|---|
| AR-A | Le comptage affiché | **(a)** **4 étapes / 3 téléchargements**, les deux comptes visibles | = reco |
| AR-B | Forme du véhicule macOS | **(a)** un **`.dmg` portant l'application d'installation** | = reco |
| AR-C | Forme du véhicule Windows | **(a)** un **`.msi` posant l'application d'installation** | = reco |
| AR-D | Notarisation macOS | **(b)** **dépendance déclarée** — CI prêt à notariser, absence déclarée | = reco |
| AR-E | Où vit l'app d'installation | **(a)** un **dépôt neuf**, 3ᵉ app Tauri du portefeuille | = reco |
| AR-F | Règle d'égalité de version | **(a)** *« le plus récent gagne ; à égalité, le vivant »* | = reco |
| AR-G | L'étape 1 de la chaîne | **(a)** **deux sens assumés et dits** (vraie install / mise à jour) | = reco |
| AR-H | Redondance npm | **(a)** **tarball des forges = voie publique**, registre NAS = voie LAN | = reco |

**Les huit verdicts suivent la recommandation.** Ce n'est pas une formalité : cela veut dire que
**les motifs écrits sous chaque arbitrage en § 4.1-4.8 font désormais partie de la décision**, et
qu'on ne peut pas les contredire à l'implémentation sans rouvrir l'arbitrage.

#### Conséquences inscrites, par verdict

- **AR-A (a)** — L'interface annonce **4 étapes / 3 téléchargements**. Corollaire dur : **fusionner
  les étapes 1 et 2 est interdit** (§ 2) — un consentement donné pour `/usr/local/lib` ne couvre pas
  une écriture dans `~/.claude`. Aucun écran, aucun message, aucun README ne parle de « trois
  installations ». → CA-19.

- **AR-B (a)** — Le `.dmg` **porte** l'app d'installation ; il n'enchaîne pas. Deux conséquences
  qui ferment des portes : (1) **le `.pkg` est écarté définitivement pour ce lot** — il poserait sa
  logique dans des scripts `postinstall`, soit la **seconde implémentation** qu'AR-3 interdit, et
  son assistant n'expose pas la validation par étape d'AR-4 ; (2) **aucune chaîne de build neuve
  n'est ouverte** : Tauri ne produit pas de `.pkg`, le `.dmg` tombe de la matrice existante (M12).

- **AR-C (a)** — Le `.msi` **pose** l'app d'installation. **L'écart avec la lettre de la demande
  est acté et doit être écrit dans la vitrine de l'installeur** : *le MSI n'enchaîne pas, il amorce
  ce qui enchaîne*. Le bundle WiX Burn est **écarté** — il livrerait un `.exe`, pas un `.msi`, et
  rouvrirait la seconde implémentation. Ne pas y revenir « en passant ».

- **AR-D (b)** — **Deux exigences non négociables**, sans lesquelles (b) redevient (c) — « hors
  d'atteinte » déguisé :
  1. **L'absence de notarisation se DÉCLARE dans `fixtures/vitrine-locale.json`**, mécanisme
     **existant, à réutiliser et non à réinventer** : **motif**, **date** et **condition de levée**.
     Sa contrepartie est la face en ligne, qui **rougit dès que la déclaration devient fausse** —
     c'est ce cliquet auto-destructeur, et lui seul, qui empêche une déclaration d'absence de
     survivre à sa propre péremption.
  2. **Le README de l'installeur porte la procédure Sequoia EXACTE** — *Réglages Système >
     Confidentialité et sécurité*, cliquer, mot de passe administrateur — **jamais** un
     « autorisez l'application » vague. Le contournement par Control-clic **n'existe plus** depuis
     macOS 15 ; une doc qui le mentionnerait enverrait l'utilisateur dans un mur.
  3. L'étape CI de notarisation **existe et se saute EN LE DISANT** quand les secrets Apple sont
     absents — modèle exact des secrets minisign (`release.yml:96-101`, où l'absence est commentée
     comme un **gate humain**). Jamais un saut silencieux.
  → CA-18.

- **AR-E (a)** — **Dépôt neuf.** Conséquence inscrite : la mécanique de distribution du portefeuille
  est **mono-application par construction** (M13) — `vitrine-assets.json` substitue **un seul**
  `{APP}`, `updater/latest.json` décrit **une** app, `VERSION_CARRIERS` garde les porteurs **d'une**
  version. **Les dépôts `IakaCockpit` et `iakaFrameGUI` ne sont pas à modifier par ce lot**, à la
  **seule** exception du cliquet `fixtures/convergence.sha256` s'ils gagnent un troisième frère. Les
  toucher « en passant » serait le défaut que leur propre corpus interdit.

- **AR-F (a)** — **La règle, en une phrase, à recopier telle quelle dans le code :**
  > **« Le plus récent gagne ; à égalité, le vivant. »**

  Trois conséquences inscrites, aucune n'est cosmétique :
  1. **L'égalité est le cas NOMINAL, pas un cas de bord.** La seule version du système est
     `cli/package.json` (`version.js:1`) et `_bundled/VERSION` en est **dérivé**
     (`bundle.js:98-110`). Quand le réservoir vivant est le dépôt source du CLI qui tourne — le cas
     du poste du décideur — **les deux versions sont égales par construction**. Un implémenteur qui
     traiterait cette branche comme un `else` marginal se tromperait sur **presque toutes** les
     exécutions. → CA-05.
  2. **Version indéterminée du vivant.** Verdict : **le vivant l'emporte quand même**, et la
     provenance **le dit** (`version indéterminée`). **Aucun repli silencieux sur l'embarqué.**
     → CA-06.

     > 🛑 **RECTIFICATION DATÉE (2026-09-04, gate 🏹 Legolas du lot A) — L'ILLUSTRATION ÉTAIT
     > FAUSSE.**
     > Cette conséquence portait, jusqu'à ce commit : *« le cas est **réel et mesuré** —
     > `frames/releases/StefFrame2/` embarque `install.mjs` **sans `cli/`**, donc sans
     > `package.json`, donc sans version »*. **C'est faux.** Mesure du gate, re-mesurée
     > indépendamment par 🔵 Gandalf : `frames/releases/StefFrame2/cli/package.json` **existe** et
     > porte `"version": "0.1.0"` ; git le trace depuis `3a610c9` (2026-07-18). Conservé daté, pas
     > effacé — convention de rectification du corpus.
     >
     > **D'OÙ VENAIT L'ERREUR, puisqu'une correction muette ne vaccine personne.** De
     > `install.mjs:50`, qui affirme en commentaire : *« la frame embarque install.mjs **SANS
     > cli/** »*. **J'ai cité un COMMENTAIRE comme une MESURE**, sans ouvrir le répertoire qu'il
     > décrivait. C'est exactement `canon-avant-citation` : un commentaire est une **prétention**,
     > jamais un constat. La leçon est plus large que ce lot — dans une instruction, tout fait
     > présenté comme « mesuré » doit l'avoir été **sur l'objet**, pas sur ce qu'on dit de lui.
     >
     > **CE QUI N'EST PAS REMIS EN CAUSE, et qu'il ne faut pas sur-corriger** : le **verdict AR-F(a)
     > tient**, la **branche « version indéterminée » reste nécessaire**, et le **code est sain** —
     > l'implémentation s'appuie sur une fixture disque **synthétique** (`install.mjs` seul, sans
     > `cli/`) qui reproduit la condition structurelle **sans dépendre de StefFrame2**. C'est la
     > **justification écrite** qui était fausse, pas la règle ni le test. **CA-06 est inchangé.**
     >
     > **LE MOTIF JUSTE, qui remplace le faux.** Aucun arbre du dépôt n'illustre le cas aujourd'hui :
     > les **deux seuls** `install.mjs` (racine et `frames/releases/StefFrame2/`) portent **tous
     > deux** un `cli/package.json` versionné — vérifié par balayage de `frames/releases/*/cli/
     > package.json`, qui ne ramène **qu'une** entrée. Le cas est donc **structurellement possible
     > et sans occurrence connue à ce jour**. **Cela reste un motif suffisant** : une frame est un
     > **snapshot de la racine**, sa composition n'est garantie par aucune garde, et une résolution
     > qui plante ou replie en silence sur un arbre sans version serait un défaut le jour où il
     > s'en présente un. On code la branche pour la **forme** de l'entrée, pas pour un exemplaire.
     >
     > **Successeur nommé, HORS périmètre de ce lot** : `COMMENTAIRE-FAUX-INSTALL-MJS-50` — la
     > ligne `install.mjs:50` est un **énoncé faux vivant dans le code**, qui a déjà contaminé un
     > cadrage et contaminera le prochain lecteur. À corriger dans un lot qui touche `install.mjs`
     > ; **surtout pas ici**, où `install.mjs` est déclaré « appelé, non modifié » (§ 7).
  3. **Format de la ligne de provenance — elle dit *quoi* ET *pourquoi*.** Une provenance qui nomme
     la source sans nommer la raison du choix ne permet pas de diagnostiquer une bascule. Forme
     imposée :
     ```
     réservoir : vivant <chemin> (v0.39.0) — embarqué v0.39.0, égalité, le vivant l'emporte
     réservoir : vivant <chemin> (version indéterminée) — embarqué v0.39.0, le vivant l'emporte
     réservoir : embarqué (v0.39.0) — vivant v0.33.0, plus ancien
     ```
  4. **Le drapeau `--reservoir bundled` est HORS PÉRIMÈTRE du lot A — décidé, pas oublié.** Il
     avait été proposé comme la forme juste du contre-argument (b) : forcer l'embarqué pour rendre
     une sortie reproductible en CI. **Verdict : exclu.** Motif : AR-F(a) rend le vivant gagnant
     partout, ce qui est le comportement voulu **par tous les consommateurs actuels** ; **aucune
     garde ne réclame aujourd'hui l'inverse**, et plusieurs verbes portent déjà `--root <dir>`, qui
     couvre le besoin d'épingler un arbre. L'ajouter maintenant serait un « tant qu'on y est ».
     **Successeur nommé** : `RESERVOIR-FORCAGE-EMBARQUE`. **Condition de levée** : le jour où une
     garde CI a besoin d'une résolution déterministe **et** que `--root` ne suffit pas — alors, et
     seulement alors, le drapeau s'ajoute **sans** inverser le défaut.

- **AR-G (a)** — **L'étape 1 a deux sens, et le message DOIT dire lequel s'applique.** Ce n'est pas
  un confort de rédaction : les deux gestes n'ont ni le même effet ni le même risque.
  | Qui joue l'étape 1 | Ce que c'est | Ce que le message doit dire |
  |---|---|---|
  | **L'app d'installation** (chemin nominal du bundle) | une **vraie première installation** — l'app obtient le tarball et le pose | qu'elle **installe** le CLI, et depuis quelle source (AR-H) |
  | **Le CLI lui-même** (`iakaframe install`, poste déjà équipé) | une **mise à jour du CLI** — il ne peut pas s'installer lui-même, il faut déjà l'avoir pour l'appeler | qu'elle **met à jour** le CLI, de la version X vers la version Y |

  **Interdit** : un message unique qui vaudrait pour les deux. Il mentirait dans l'un des deux cas.

- **AR-H (a)** — **La voie publique est le tarball des forges** (`npm install -g <fichier>.tgz`),
  **ordonnée**, et le verbe `install` **dit quelle source a répondu** (calque d'AR-2). Le registre
  npm `@naonedge` du NAS reste la **voie LAN**, et le README ne doit **jamais** confondre les deux —
  il dit déjà que ce registre « n'est pas accessible depuis Internet » (`README.md:65-67`), cette
  phrase est à conserver. **Conséquence** : l'inconnue laissée ouverte par AR-7 — « désigner un
  troisième registre npm » — **est fermée sans objet**. Et le reliquat M8 (`publishConfig`
  mono-valeur) devient **un détail de cohérence, pas un blocage**. → CA-01.

#### Obligation d'implémentation issue du corollaire AR-1 / AR-4 — relevée par le décideur

**Ce n'est pas un arbitrage : c'est une obligation.** Elle ne se discute pas, elle se prouve.

Pendant la chaîne, l'étape 1 installe le CLI. Si ce CLI fraîchement posé est invoqué avant l'étape
2, **son auto-déploiement AR-1 se déclenche** et pose le kit **avant** que l'utilisateur ait validé
l'étape 2. **AR-1 aurait court-circuité AR-4 dans son dos** — un consentement contourné par une
règle qui, prise isolément, est parfaitement correcte.

→ **Le moteur DÉSARME AR-1 pour toute la durée de la chaîne.** La forme est libre (variable
d'environnement, drapeau interne) ; **l'effet ne l'est pas**. Et la garde est **éprouvée par un
contrefactuel** : garde désarmée, l'auto-déploiement **doit** se produire et le test **doit rougir
nommément**. Une garde qui ne peut pas rougir n'est pas une garde. → **CA-08**, critère
d'acceptation de plein droit, pas une note de prose.

---

*Ce qui suit est le texte des arbitrages tel qu'il a été soumis au décideur — **conservé intégral**,
puisque c'est sur ces motifs que les verdicts ont été rendus.*

### AR-A — Le comptage affiché : 3 ou 4 ?

- **(a)** L'interface annonce **4 étapes / 3 téléchargements**, les deux comptes visibles.
- **(b)** Elle n'annonce que **4 étapes**, le nombre de téléchargements restant interne.
- **(c)** Elle fusionne CLI+méthode en une étape et annonce **3 / 3**.

**Recommandation : (a).** (c) est **écarté par AR-4** (§ 2) : il masquerait l'écriture dans
`~/.claude` derrière un consentement donné pour `/usr/local/lib`. (b) prive l'utilisateur de
l'information qui explique pourquoi il attend — une étape ne télécharge rien, trois téléchargent.

### AR-B — La forme du véhicule macOS

- **(a) Un `.dmg` portant l'application d'installation.** L'utilisateur monte, glisse dans
  `/Applications`, lance. L'app enchaîne.
- **(b) Un `.pkg` de distribution** (`pkgbuild` + `productbuild`), qui pose les composants
  lui-même via des scripts.
- **(c) Les deux**, au choix du visiteur.

**Recommandation : (a).** Trois motifs, dans l'ordre de force. **(1) AR-3 l'impose** : le `.pkg`
poserait sa logique dans des scripts `postinstall`, c'est-à-dire une **seconde implémentation** de
la chaîne — précisément ce qu'AR-3 interdit, et sans même la possibilité d'une validation par étape
(AR-4), puisque l'assistant `Installer.app` n'expose pas ce dialogue. **(2) Tauri ne sait pas
produire de `.pkg`** (§ 0.5) : ce serait une chaîne de build neuve, non éprouvée, à côté d'une
chaîne qui tourne. **(3)** Le `.dmg` tombe gratuitement de la matrice existante.
**Coût du (a), dit** : deux gestes au lieu d'un (copier, puis lancer). C'est le prix, il est faible,
et c'est la convention macOS que tout utilisateur connaît.

### AR-C — La forme du véhicule Windows

- **(a) Un `.msi` posant l'application d'installation** — symétrique du (a) macOS.
- **(b) Un bundle WiX Burn** (`.exe`) enchaînant les trois MSI.
- **(c) Un `.exe` NSIS** faisant la même chose.

**Recommandation : (a).** C'est **le seul des trois qui reste un `.msi`**, donc qui tienne la lettre
de la demande. (b) et (c) livreraient un **`.exe`**, ce qu'il faudrait dire — et (b) rouvrirait la
seconde implémentation qu'AR-3 ferme. Rappel du fait dur : **il n'existe aucune forme de `.msi` qui
en enchaîne d'autres** ; les installations imbriquées sont dépréciées et déconseillées pour le
public par Microsoft elle-même (§ 0.5). **Si le décideur veut malgré tout le chaînage natif
Windows, c'est (b), et le livrable s'appelle un `.exe`.**

### AR-D — La notarisation macOS

- **(a) Au périmètre** : adhésion Apple Developer Program (99 $/an), certificat Developer ID
  Application, étape `notarytool` + `staple` dans la matrice CI, pour **les trois** applications.
- **(b) Dépendance déclarée** : le lot livre un CI **prêt à notariser** — l'étape existe et se
  **saute en le disant** quand les secrets Apple sont absents, sur le modèle exact déjà en place
  pour les secrets minisign (`release.yml:96-101`, où l'absence de secret est **commentée comme un
  gate humain**) —, et la vitrine **déclare** l'app non notarisée avec la procédure Sequoia.
- **(c) Hors d'atteinte**, déclaré tel, sans rien livrer.

**Recommandation : (b), et je la défends contre elle-même.** L'objection est juste : *un installeur
que Gatekeeper bloque est un installeur qui n'installe pas*. Mais (a) **ne dépend pas de nous** —
c'est un achat et un compte, pas du code : aucun agent ne peut l'exécuter, et l'inscrire au
périmètre rendrait le lot **non livrable** pour une raison étrangère au lot. (c) est malhonnête :
il laisserait un DMG partir en promettant ce qu'il ne tient pas.
**(b) est la seule forme qui dise le vrai et prépare le geste** : le jour où le décideur achète
l'adhésion, il pose deux secrets et la notarisation s'allume, sans re-cadrage.
**Deux exigences non négociables si (b) est retenu**, sans lesquelles (b) redevient (c) :
1. Le mécanisme de déclaration d'absence **existe déjà et doit être réutilisé**, pas réinventé :
   `fixtures/vitrine-locale.json` — une plateforme non servie s'y déclare **avec motif, date et
   condition de levée**, et la face en ligne **rougit** dès que l'absence devient fausse.
2. Le README de l'installeur doit porter la **procédure Sequoia exacte** (Réglages Système >
   Confidentialité et sécurité), pas un « autorisez l'application » vague. La procédure a changé ;
   une doc périmée ici est pire que rien.

### AR-E — Où vit l'application d'installation ?

- **(a) Un dépôt neuf** (`iakaInstall` ou équivalent), 3ᵉ app Tauri du portefeuille.
- **(b) Dans `iakaFrameGUI`**, comme seconde application du même dépôt.
- **(c) Dans `IakaCockpit`**, idem.

**Recommandation : (a), sur un fait mesuré.** Toute la mécanique de distribution de ces dépôts est
**mono-application par construction** : `fixtures/vitrine-assets.json` substitue **un seul** `{APP}`
tiré du `productName` unique de `tauri.conf.json` (M13) ; `updater/latest.json` décrit **une** app ;
`VERSION_CARRIERS` garde **les porteurs d'une** version. Loger une seconde app dans un dépôt
existant ferait **diverger les trois d'un coup**, et le premier symptôme serait une vitrine qui ment
— exactement le défaut que L42 a coûté cher à fermer. **(a) duplique une convention éprouvée ; (b)
et (c) la cassent.**
**Coût du (a), dit** : un dépôt de plus à tenir (release.yml, vitrine, convergence, manifeste). Le
registre de convergence passerait de **deux frères à trois** — ce qui est un vrai travail, et il est
chiffré au § 11 sous « lot B′ ».

### AR-F — La règle d'égalité de version *(point ouvert d'AR-2, et le plus important du cadrage)*

**Le fait mesuré qui reformule la question.** AR-2(c) dit « le plus récent gagne, par comparaison de
version ». Or **la seule version du système est `cli/package.json`** (M3), et `_bundled/VERSION` en
est **dérivé** (`cli/scripts/bundle.js:98-110`, valeur mesurée `v0.39.0`). **Donc quand le réservoir
vivant est le dépôt source du CLI qui tourne — le cas dominant sur le poste du décideur — les deux
versions sont égales PAR CONSTRUCTION.** ⇒ **La règle d'égalité n'est pas un cas de bord : c'est le
cas nominal.** Le cadrage parent avait raison de dire « à ne pas laisser au hasard de
l'implémentation » ; il sous-estimait de combien.

- **(a) À égalité, le réservoir VIVANT gagne.** Règle énonçable en une phrase : *« le plus récent
  gagne ; à égalité, le vivant. »*
- **(b) À égalité, l'embarqué gagne** (déterminisme maximal : la même version donne toujours le même
  contenu).
- **(c) À égalité, le CLI refuse et demande** (`--reservoir vivant|bundled` obligatoire).

**Recommandation : (a).** **(1)** Le vivant est **ce que le décideur édite** : à égalité, choisir
l'embarqué ignorerait en silence une modification non encore versionnée — et l'ignorerait **dans le
cas nominal**, donc quasiment toujours. **(2)** C'est le comportement d'**avant** AR-2 : une égalité
ne change rien à ce qui se passe aujourd'hui, donc aucune surprise n'est introduite. **(3)** (c)
transformerait chaque commande en une question, ce qui est intenable pour le cas nominal.
**Contre-argument à (b), à peser** : (b) rendrait la sortie **reproductible** à version égale, ce
qui a de la valeur en CI. Si le décideur y tient, la forme juste serait (a) **avec** un drapeau
`--reservoir bundled` explicite pour le CI — pas une inversion du défaut.

**Sous-question à trancher avec, elle n'est pas cosmétique** : **que faire quand le réservoir vivant
ne porte AUCUNE version ?** Le cas est réel et mesuré : une **frame** (`frames/releases/StefFrame2/`)
embarque `install.mjs` **sans `cli/`**, donc sans `package.json`, donc sans version. Une comparaison
« le plus récent gagne » n'a alors **rien à comparer**. Recommandation : **version indéterminée ⇒ le
vivant l'emporte quand même, et la ligne de provenance le DIT** (`réservoir vivant (version
indéterminée)`) — jamais un repli silencieux sur l'embarqué.

> 🛑 **CE PARAGRAPHE PORTE UN FAIT FAUX** — l'exemple `StefFrame2` : ce répertoire **porte** un
> `cli/package.json` en `0.1.0`. **Conservé tel quel** parce que c'est le texte sur lequel le
> verdict a été rendu, mais **jamais laissé sans drapeau**. Rectification complète, origine de
> l'erreur et motif de remplacement : **§ 4.0, AR-F conséquence 2**. **Le verdict (a) et CA-06
> tiennent** — seule l'illustration tombe.

**Et dans tous les cas, la ligne de provenance est OBLIGATOIRE** (conséquence inscrite d'AR-2(c)) :
elle nomme la source **et la raison du choix**. `réservoir : vivant <chemin> (v0.39.0) — embarqué
v0.39.0, égalité, le vivant l'emporte`. Une provenance qui dit *quoi* sans dire *pourquoi* ne permet
pas de diagnostiquer une bascule.

### AR-G — L'étape 1 de la chaîne : le CLI ne peut pas s'installer lui-même

**Le problème structurel, que le cadrage parent ne nomme pas.** Le verbe `install` est un **verbe du
CLI**. Il ne peut donc pas exécuter la **première** installation du CLI : pour l'appeler, il faut
déjà l'avoir. L'étape 1 n'a pas le même sens selon qui la joue.

- **(a) L'étape 1 a deux sens, tous deux assumés et dits.** Jouée par **l'app d'installation**
  (chemin nominal du bundle) : c'est une **vraie première install** — l'app obtient le tarball et le
  pose. Jouée par **le CLI lui-même** (`iakaframe install`, poste déjà équipé) : c'est une **mise à
  jour du CLI**, et le message doit le dire.
- **(b) L'étape 1 sort du moteur** et devient un pré-requis déclaré : le moteur ne chaîne que 2, 3,
  4.
- **(c) Le moteur devient un script autonome** hors CLI.

**Recommandation : (a).** (c) rouvre AR-3(b), déjà écarté par le décideur. (b) est plus honnête que
de faire semblant, mais **casse la promesse du bundle** : l'utilisateur devrait installer le CLI à
la main avant que « la chaîne complète » ne démarre — soit exactement le geste qu'on lui retire.
**(a) est la seule qui tienne la promesse, à condition de ne pas mentir sur le sens de l'étape.**

### AR-H — La redondance npm, au vu de M9 *(reprise d'AR-7)*

AR-7 a été tranché (a)+(b) : bascule dans le verbe `install`, publication en trois passes, le
troisième registre restant « la seule inconnue du lot 0 ». **La mesure M9 déplace la question** : la
voie publique **réelle et éprouvée** du CLI n'est **pas** un registre npm — c'est le **tarball de la
release GitHub**, produit par un workflow qui a effectivement tourné, et le README dit que le
registre `@naonedge` est **inaccessible depuis Internet**.

- **(a) Acter l'option (c) d'AR-7 comme voie PUBLIQUE** (tarball depuis les forges, ordonné), le
  registre npm du NAS restant la **voie LAN** ; le verbe `install` essaie les sources **dans
  l'ordre** et **dit laquelle a répondu**.
- **(b) Tenir les trois registres npm** comme AR-7 le prévoyait, et désigner le troisième.

**Recommandation : (a).** AR-7 recommandait (c) « à ne prendre que si les droits de publication
manquent sur une forge ». **La mesure montre que le cas s'est produit sans qu'on le décide** : la
seule voie publique qui fonctionne aujourd'hui est le tarball. Acter ce qui marche coûte zéro et
supprime l'inconnue ; (b) fait dépendre le lot d'un troisième registre encore à trouver. **Ce
verdict rend M8 (`publishConfig` mono-valeur) sans conséquence pour la voie publique** — et donc le
reliquat du lot 0 devient un détail, pas un blocage.

---

## 5. Périmètre, par lot

### 5.1 — Lot 0 : **LIVRÉ**, à un reliquat près. Ne rien recoder.

| Morceau | État mesuré | Preuve |
|---|---|---|
| 0.a — fan-out d'écriture | ✅ **livré** | `cli/src/lib/canaux.js:75-85` + `cli/src/commands/update.js:132-133` ; chaque cible nommée (`:108-122`), aucune cible injoignable ne casse le checkpoint |
| 0.b — failover de lecture | ✅ **livré, à DEUX endpoints** | `tauri.conf.json:42-45` des deux apps ; l'iakabox **retirée délibérément** le 2026-09-03 avec motif + condition de levée (`IakaCockpit/fixtures/canaux-publication.json:24-30`) |
| 0.c — verbe de synchronisation | ✅ **livré** | verbe `canaux` (`verbes.js:99-105`), 7 états, mesure datée, séparation direct/souvenir, `rattraper` FF-only sans `--force` (`canaux.js:215-239`) |
| 0.d — `FORGEJO_URL` multi-valeurs | ✅ **livré** | `cli/src/lib/forgejo.js:18` (liste, plus de `DEF_URL`) |
| 0.d — `publishConfig` du CLI | 🟠 **reliquat** | `cli/package.json:30-32`, toujours mono-valeur NAS — **sans conséquence si AR-H = (a)** |

**Inclus au lot 0 :** **acter** dans le cadrage parent que le triple canal de son § 0 est
**superséde** par la décision à deux endpoints du 2026-09-03 — en la **datant, pas en l'effaçant**,
conformément à la discipline de rectification du corpus. Et trancher AR-H, qui solde `publishConfig`.
**Exclu du lot 0 :** tout recodage de 0.a, 0.b, 0.c.

### 5.2 — Lot B : **LIVRÉ pour les deux apps**. Reste à **étendre**, pas à construire.

**Livré et mesuré** : 9 clés de manifeste, 4 plateformes, signatures minisign appariées, toutes les
URL sur les releases GitHub, pour `iakaFrameGUI` **v0.1.8** et `IakaCockpit` **v0.32.2** (M11) ;
matrice de build à 4 plateformes, action épinglée au SHA (M12).

**Reste dû, et c'est nommé :**
- **La recette réelle Windows / Linux / macOS Intel.** Aucune machine de ces trois familles n'est
  disponible ici. **Gate humain déclaré, jamais présenté comme couvert** — précédent AR-6, tenu.
- **F-d** (§ 0.4) → **AR-D, tranché (b)** : dépendance déclarée, CI prêt, absence en vitrine,
  procédure Sequoia au README (§ 4.0).

**Lot B′ — l'extension, qui est le vrai travail** *(AR-E tranché (a) : dépôt neuf)* : porter la
convention de distribution sur la **troisième** application, et faire passer le **registre de
convergence de deux frères à trois**.

⚠️ **B′ se scinde en deux, et les deux moitiés ne se jouent pas au même moment** — dépendance
corrigée en **§ 6.0**, à lire avant de commencer :

- **B′-a — l'ossature** : `release.yml` à matrice épinglée. Se pose **avec** le squelette de l'app
  (C.2), avant toute release.
- **B′-b — la vitrine, `vitrine-locale`, `updater/latest.json`, le registre de canaux, la
  convergence à trois frères** : **après la première release réelle** (C.3). Avant elle, la face en
  ligne n'a **rien à mesurer** et ne peut rendre qu'un `SKIP` — c'est-à-dire aucune preuve.

### 5.3 — Lot A : le verbe `install`, étapes 1 et 2 — **À FAIRE**

**Inclus :**
- **Le verbe `install`**, avec son entrée au **registre déclaratif** `cli/src/lib/verbes.js` —
  c'est la source unique de l'aide et du guidage, un verbe qui n'y figure pas n'existe pour
  personne. Champs obligatoires : `ecriture: true`, et un `guideClaudeCode` **motivé**
  (`generer:false` **exige** un motif explicite, discipline du fichier).
- **Étape 1 — le CLI**, au sens tranché par AR-G, depuis les sources ordonnées d'AR-H, en **disant
  laquelle a répondu**.
- **Étape 2 — la méthode**, par **délégation à `install.mjs`** (M4), qui existe déjà. **Ne pas
  réimplémenter** : `--merge` reste le défaut, `--backup-dir` alimente la sauvegarde horodatée
  qu'AR-5 exige.
- **`--dry-run`** : décrit sans **rien** écrire. Prouvé par **empreinte du système de fichiers
  avant/après**, pas par lecture de code.
- **`--yes`** : saute **toutes** les validations, jamais une seule.
- **La ligne de provenance** (AR-2(c) + AR-F), obligatoire, avec sa **raison**.
- **La distinction AR-1 / AR-4, ÉCRITE** — § 5.5 ci-dessous.

**Exclu :** les étapes 3 et 4 (lot C.1) · la désinstallation · la mise à jour des quatre composants
en une passe (autre verbe, à cadrer séparément) · toute réécriture de `install.mjs` · **le drapeau
`--reservoir bundled`** — exclusion **décidée, pas oubliée** (AR-F, conséquence 4), successeur nommé
`RESERVOIR-FORCAGE-EMBARQUE` avec sa condition de levée écrite.

### 5.4 — Lot C : le moteur, la façade, l'amorçage — **À FAIRE**

> 🛑 **RISQUE D'ENTRÉE, à lire AVANT de commencer le lot C — inscrit le 2026-09-04, relevé par
> l'exécution du lot A, confirmé par le gate 🏹 Legolas, et re-mesuré par 🔵 Gandalf.**
>
> **`install.mjs` ne part dans AUCUN artefact publié.** Mesuré : la liste `ASSETS` de
> `cli/scripts/bundle.js:22-31` porte **huit** entrées — `library`, `methods`, `teams`, `bindings`,
> `kits`, `design-naonedge`, `agents`, `skills` — et **jamais `install.mjs`** ; et
> `cli/package.json:12-16` (`files`) ne liste que `src`, `_bundled`, `README.md`, donc pas
> davantage à la racine du tarball.
>
> **Conséquence, et elle vise l'utilisateur nominal.** Un CLI installé **purement par
> npm/tarball** — c'est-à-dire **exactement la voie publique qu'AR-H(a) vient d'acter** — ne peut
> **structurellement pas** jouer l'**étape 2**. Le moteur C.1 réutilisera la même
> `resoudreReservoir` et la même étape 2 : **il héritera de l'impasse**. Autrement dit, la « chaîne
> complète » serait complète pour quiconque a déjà un réservoir vivant sous la main — et **amputée
> pour celui à qui elle s'adresse**.
>
> **Portée, tranchée par le gate et non rediscutée ici** : ce **n'est pas** un critère du lot A non
> tenu. Le § 7 liste `install.mjs` comme « **appelé, non modifié** » et **`bundle.js` n'y figure
> pas** ; l'implémentation **le dit** au lieu de le masquer, ce qui est le comportement attendu.
>
> **Ce qui est exigé ici, et rien de plus** : que l'impasse soit **inscrite comme prérequis
> d'entrée du lot C**, jamais laissée en angle mort silencieux. → **R10** (§ 8) et **CA-21** (§ 9).
>
> **Successeur nommé, HORS périmètre de ce lot et NON cadré ici** :
> **`BUNDLE-INSTALL-MJS-ABSENT`** — amender `cli/scripts/bundle.js` (`ASSETS`) et
> `cli/package.json` (`files`) pour que la charge de l'étape 2 voyage avec le paquet.
> **Condition d'entrée : un arbitrage du décideur**, parce que le geste n'est pas neutre — il
> change ce que le tarball publié contient, donc ce que `npm install -g` écrit sur la machine, et
> il touche une garde (`required: true`) posée par un lot antérieur pour refuser un bundle amputé.
> Ordre de grandeur indicatif **≈ 0,5 j**, **non compté** à l'estimation du § 11 tant qu'il n'est
> pas arbitré.
>
> **Ce que le lot C DOIT faire en attendant** : ne pas prétendre. Voir **CA-21** — sur un poste sans
> réservoir vivant, l'étape 2 **refuse en nommant la cause**. Un refus lisible est tenable ; un
> succès silencieux ou une erreur obscure ne le sont pas.
>
> **AMENDEMENT DATÉ le 2026-09-04, après exécution du lot successeur.** Le décideur a arbitré
> l'amendement de `bundle.js` **au périmètre** (verdict verbatim relayé par 🟠 Aragorn : *« a, a »*,
> AR-I(a) et AR-J(a)) — cadré par 🔵 Gandalf dans `specs/instructions/bundle-install-mjs-embarque.md`
> et exécuté par ⚒️ Gimli sur la branche `feat/bundle-install-mjs-embarque` (commits `20ab476` à
> `27ebcef`). **R10 est SOLDÉ** : `install.mjs` voyage désormais avec le paquet publié
> (`cli/_bundled/install.mjs`, asset `required: true`), et le réservoir **DÉSIGNÉ par AR-F** porte
> aussi la charge de l'étape 2 (AR-I(a)) — l'utilisateur nominal de la voie publique n'est plus
> amputé. **CA-21 devient CA-21′** (§ 9, rectification datée sur place, texte d'origine conservé) :
> le déclencheur du refus n'est plus « aucun réservoir vivant » mais « ni vivant ni embarqué
> porteur » (bundle amputé). **La rédaction ci-dessus est conservée telle quelle** — datée, jamais
> effacée : ce qu'elle décrivait comme un angle mort assumé est désormais un cas fermé.

- **C.1 — Le moteur.** Les **quatre** étapes enchaînées comme verbes du CLI, validation par étape
  (AR-4), **rollback automatique + ses trois gardes** (AR-5) : ne défaire que ce qu'on peut
  **prouver** avoir changé et **refuser de dérouler** si la sauvegarde manque · ne **jamais** retirer
  ce qu'on n'a pas posé (une app déjà présente est **restaurée**, pas effacée) · énoncer ce qu'on n'a
  **pas su** défaire. **Testable sans interface** — c'est la condition qui garde la GUI en façade.
- **C.2 — La façade graphique.** App Tauri (AR-E). Elle **n'implémente rien** de la logique : elle
  affiche les annonces d'étape, recueille les feux verts, rend l'échec et le rollback lisibles.
  **Critère structurel** : tout ce qu'elle montre doit être obtenable en ligne de commande. Si un
  état n'existe que dans la GUI, la façade a commencé à devenir une implémentation.
- **C.3 — L'amorçage : les deux véhicules demandés.** Le `.dmg` (arm64 et Intel) et le `.msi`,
  produits par la matrice existante (M12), **plus** le `.exe` NSIS, le `.deb`, le `.rpm` et
  l'AppImage qui tombent de la même matrice — refuser de les publier serait un travail **en plus**,
  pas en moins. Vitrine générée, absences déclarées, `latest` maîtrisé : **conventions du
  portefeuille, dupliquées telles quelles**.

### 5.5 — AR-1 / AR-4 : la distinction, écrite

*Le cadrage parent réclame nommément que le lot A écrive ceci, « faute de quoi ce sera lu comme une
incohérence ». Voici le texte à porter dans le code et dans la doc.*

> **AR-1 régit le CLI SEUL.** Au premier lancement, si le kit hôte est **absent**, le CLI le
> **pose sans demander**. Ce n'est pas un rouleau compresseur : `install.mjs` reste **`--merge` par
> défaut** et **énonce** ce qu'il pose.
>
> **AR-4 régit la CHAÎNE du bundle.** Chaque étape **s'annonce** — quoi, où, quelle version, ce qui
> existe déjà et sera fusionné — puis **attend** un feu vert. `--yes` les saute toutes.
>
> **Les deux ne se contredisent pas : ils ne parlent pas du même chemin.** L'un est le geste d'un
> outil qui s'auto-équipe ; l'autre est un protocole de consentement.

**Et le corollaire que le cadrage parent ne tire pas, qui est un défaut en attente.** Pendant la
chaîne, l'étape 1 **installe le CLI**. Si ce CLI fraîchement posé est invoqué avant l'étape 2, son
**auto-déploiement AR-1 se déclenchera** — et posera le kit **avant** que l'utilisateur ait validé
l'étape 2. **AR-1 aurait alors court-circuité AR-4 dans son dos.**
→ **Exigence non négociable du lot A** : le moteur **désarme AR-1** pour toute la durée de la chaîne
(variable d'environnement, ou drapeau interne — la forme est libre, l'effet ne l'est pas), et cette
garde est **éprouvée par un contrefactuel** : désarmée, l'auto-déploiement doit se produire et le
test doit **rougir**.

> 📌 **NOTE FACTUELLE (2026-09-04) — AR-1 est une DÉCISION, pas encore un MÉCANISME. Ce n'est pas
> un défaut, et il ne faut pas le traiter comme tel.**
>
> Mesuré par le gate 🏹 Legolas et **re-mesuré par 🔵 Gandalf** : **AR-1 n'est câblé nulle part**
> dans le dispatch réel. Aucun hook « premier lancement » sur les 40 entrées de dispatch, et
> `cli/src/index.js#main()` (l. 118) n'en porte aucun — un balayage de `index.js` sur
> `premier lancement|deployKit|autoDeploy|_bundled` ne ramène **rien**. Le paragraphe ci-dessus
> **suppose** l'existence de ce câblage ; à ce jour il décrit un **contrat**, pas un chemin de code.
>
> **Conséquence sur CA-08 : aucune.** Le critère est **jugé rempli** par une garde confinée à la
> transition **étape 1 → étape 2**, cohérente avec la liste de fichiers du § 7. C'est le seul
> chemin qui existe, donc le seul qu'on puisse garder — et le garder est juste.
>
> **Ce qu'il faut inscrire, et c'est tout** : **le jour où AR-1 sera réellement câblé** — hook de
> premier lancement, `postinstall`, ou n'importe quelle autre forme —, **le lot qui le câble DEVRA
> reprendre cette garde et l'étendre au chemin qu'il ouvre**. Sans quoi la garde protégera la
> transition 1→2 et **laissera passer tous les autres points d'entrée** : elle serait alors verte,
> partielle, et muette sur ce qu'elle ne couvre pas — c'est-à-dire le pire des états pour une garde.
> **Condition attachée au futur lot de câblage d'AR-1, pas au lot A.**

---

## 6. Étapes d'implémentation

### 6.0 — Découpage d'exécution : où commence et où finit chaque lot

**Ordre imposé par les dépendances, pas par le confort.**

> 🛑 **UNE CORRECTION D'ORDRE, relevée au moment d'inscrire les verdicts.** Le découpage proposé
> par la coordination était *reliquat 0 → A → B′ → C*. **Il est faux sur un point de dépendance, et
> le lot s'arrêterait dessus.**
>
> **B′ ne peut pas précéder C.2.** Toute la convention de distribution **dérive du `productName` de
> `tauri.conf.json`** (M13) — la table de vitrine y substitue son `{APP}`, le manifeste updater
> nomme l'app, la vitrine nomme ses artefacts. **Ce fichier n'existe qu'une fois l'application
> créée.** Placer B′ avant C.2 reviendrait à écrire une vitrine pour une application qui n'a pas
> encore de nom.
>
> **Et B′ se scinde en deux**, parce que ses deux moitiés n'ont pas la même dépendance :
> - **B′-a — l'ossature** (`release.yml` à matrice épinglée) : posable **avec** le squelette de
>   l'app, avant toute release.
> - **B′-b — la vitrine, le manifeste updater, le registre de canaux, la convergence à trois
>   frères** : **mesurables seulement après une première release réelle**. La face en ligne de la
>   vitrine confronte la table **au monde réel** ; sans release, elle n'a rien à mesurer et ne peut
>   rendre qu'un `SKIP` — c'est-à-dire aucune preuve.

**Séquence corrigée, et c'est celle-ci qu'il faut suivre :**

| # | Lot | Contenu | Peut démarrer quand |
|---|---|---|---|
| 1 | **0 (solde)** | `publishConfig` + amendement daté du cadrage parent | **immédiatement** |
| 2 | **A** | le verbe `install`, étapes 1 et 2, la garde AR-1/AR-4 | après 1 (AR-H alimente l'étape 1) |
| 3 | **C.1** | le moteur : 4 étapes chaînées, validation par étape, rollback + 3 gardes | après 2 (il chaîne les étapes du lot A) |
| 4 | **C.2 + B′-a** | l'app d'installation (dépôt neuf, AR-E) **et son ossature de release** | après 3 (la façade a besoin d'un moteur à mettre en façade) |
| 5 | **C.3** | l'amorçage : la première release, `.dmg` et `.msi` publiés | après 4 |
| 6 | **B′-b** | vitrine + manifeste + canaux + convergence à trois frères, **mesurés sur cette release** | après 5 |

**Le premier lot à coder est donc le reliquat du lot 0, puis le lot A** — ce point-là du découpage
proposé était juste, et il ne bouge pas.

### 6.1 — Le détail, étape par étape

**Lot 0 (solde)** — *AR-H tranché (a)*
1. Aligner `cli/package.json` `publishConfig` sur AR-H(a) : le tarball des forges est la voie
   publique, le registre NAS reste la voie LAN, et le README ne confond pas les deux.
2. Amender `bundle-complet-install-4-composants.md` § 0 : le triple canal est **superséde** par la
   décision à deux endpoints du 2026-09-03. **Dater, ne pas effacer.**

**Lot A** — *AR-F(a), AR-G(a), AR-H(a) tranchés*
3. Écrire la règle d'égalité **dans le code**, verbatim : *« le plus récent gagne ; à égalité, le
   vivant »*, **avec sa raison** — et en traitant l'égalité comme le **cas nominal**, pas comme un
   `else` (§ 4.0, AR-F conséquence 1).
4. Poser la résolution de réservoir : comparaison de version, règle d'égalité, **branche « version
   indéterminée »** (AR-F conséquence 2), et la **ligne de provenance au format imposé** (AR-F
   conséquence 3) — elle dit *quoi* **et** *pourquoi*.
5. Poser le verbe `install`, son entrée au registre `cli/src/lib/verbes.js` (`ecriture: true`,
   `guideClaudeCode` **motivé**), ses drapeaux `--dry-run` / `--yes`.
6. Étape 1 selon **AR-G(a)** : les **deux sens**, et un message **distinct** pour chacun — jamais
   un message unique qui vaudrait pour les deux, il mentirait dans l'un des cas. Sources ordonnées
   (AR-H), source retenue **nommée**.
7. Étape 2 : **délégation** à `install.mjs`, `--merge` + `--backup-dir` alimentés. **Ne pas
   réécrire `install.mjs`.**
8. Écrire la distinction AR-1/AR-4 (§ 5.5) **et poser la garde de désarmement**, **avec son
   contrefactuel** (§ 4.0, obligation d'implémentation → CA-08).

**Lot C.1** — *le moteur*
9. Les 4 étapes chaînées, validation par étape (AR-4), rollback + ses **trois** gardes (AR-5),
   **avec le contrefactuel de chacune** : sauvegarde manquante → **refus de dérouler** ; app
   préexistante → **restaurée**, jamais effacée ; rollback partiel → **énoncé de ce qu'il n'a pas su
   défaire**, jamais un « restauré » global.
10. Prouver que la chaîne est jouable **sans interface** (CA-10) — c'est la condition qui garde la
    GUI en façade.

**Lot C.2 + B′-a** — *AR-E(a) tranché : dépôt neuf*
11. Monter le dépôt de l'installeur et l'app Tauri : `productName`, `tauri.conf.json`.
12. **B′-a** : `release.yml` à matrice 4 plateformes, **épinglé au SHA** (CA-20), copie de la
    convention éprouvée — jamais un tag flottant.
13. La façade, **sans une ligne de logique d'installation**. Critère structurel : tout état affiché
    doit être obtenable en CLI.

**Lot C.3** — *l'amorçage, AR-B(a) et AR-C(a) tranchés*
14. Première release : le `.dmg` arm64 et Intel, le `.msi`, plus le `.exe` NSIS, le `.deb`, le
    `.rpm` et l'AppImage — **ils tombent de la même matrice**, les refuser serait du travail en plus.
15. **Notarisation selon AR-D(b)** : étape CI présente et **sautée en le disant** sans secrets ;
    absence **déclarée** dans `fixtures/vitrine-locale.json` (motif, date, condition de levée) ;
    **procédure Sequoia exacte** au README.
16. Écrire, dans la vitrine de l'installeur, **l'écart acté par AR-C(a)** : le MSI n'enchaîne pas,
    il amorce ce qui enchaîne.

**Lot B′-b** — *après la première release, et pas avant*
17. Vitrine générée + face en ligne, manifeste updater, registre de canaux de publication.
18. Faire passer `fixtures/convergence.sha256` de **deux frères à trois**, cliquet relevé **dans le
    commit qui le décide**.

**Ce qui n'est PAS une étape ici** : produire le MSI. Il n'est produisible que par le runner
`windows-latest` (§ 0.5, M12). Sa **recette** est un gate humain (§ 10).

---

## 7. Fichiers concernés

**`iakaframe` (canon)**
- `cli/src/lib/verbes.js` — **entrée `install`** au registre déclaratif (source unique de l'aide).
- `cli/src/commands/install.js` — **neuf** : le verbe et son moteur.
- `cli/src/lib/reservoir.js` *(nom indicatif)* — **neuf** : résolution vivant/embarqué, règle
  d'égalité (AR-F), branche « version indéterminée », ligne de provenance.
- `cli/src/index.js` — dispatch du verbe.
- `cli/package.json:30-32` — `publishConfig` selon AR-H.
- `install.mjs` — **appelé, non modifié** (M4). Toute modification ici serait hors périmètre.
- `docs/commandes.md` — **obligatoire** : convention permanente du portefeuille, toute commande
  ajoutée y est répercutée **dans le même lot**.
- `specs/instructions/bundle-complet-install-4-composants.md` — amendement daté (§ 0, endpoints).
- `cli/test/` — gardes du verbe, de la règle d'égalité, du désarmement AR-1.

**Dépôt de l'installeur** *(AR-E ; chemins donnés pour (a))*
- `src-tauri/tauri.conf.json`, `.github/workflows/release.yml` (matrice 4 plateformes, SHA épinglé),
  `fixtures/vitrine-assets.json`, `fixtures/vitrine-locale.json`,
  `fixtures/canaux-publication.json`, `updater/latest.json`, `README.md` (vitrine générée +
  procédure Sequoia).

**`IakaCockpit` / `iakaFrameGUI`**
- `fixtures/convergence.sha256` — **cliquet à relever** si le troisième frère entre au registre.
- Rien d'autre. **Ces deux dépôts ne sont pas à modifier par ce lot** ; les toucher « en passant »
  serait le défaut que leur propre corpus interdit.

---

## 8. Risques

| # | Risque | Mitigation |
|---|---|---|
| R1 | **Le DMG est bloqué par Gatekeeper** chez tout utilisateur qui le télécharge par navigateur — et depuis Sequoia le contournement Control-clic n'existe plus. **Le premier contact avec le produit est un refus.** | **AR-D tranché (b)** : absence **déclarée** dans `vitrine-locale.json` avec motif, date et condition de levée ; procédure **Sequoia exacte** au README ; étape CI prête et **sautée en le disant**. **Ne jamais laisser la vitrine promettre une installation lisse.** → CA-18. |
| R2 | **« MSI enchaînant » est promis, un MSI d'amorçage est livré.** L'écart passe inaperçu et le décideur découvre autre chose que ce qu'il a demandé. | § 3 : l'écart est **nommé dans l'instruction**, et AR-C le remet au décideur avec l'alternative (bundle Burn = un `.exe`). |
| R3 | **La façade devient une seconde implémentation** — un état, une décision, un message n'existent que dans la GUI. C'est le glissement qu'AR-3 nomme et que rien n'empêche mécaniquement. | Critère structurel C.2 : **tout état affiché doit être obtenable en CLI**. Éprouvé par un test qui rejoue la chaîne **sans interface** et compare. |
| R4 | **AR-1 court-circuite AR-4** : le CLI fraîchement posé à l'étape 1 auto-déploie le kit avant que l'étape 2 ne soit validée. | § 5.5 : garde de désarmement **obligatoire**, éprouvée par contrefactuel. |
| R5 | **La règle d'égalité de version est le cas NOMINAL** (M3), pas un cas de bord — la traiter comme un détail d'implémentation la fera trancher au hasard, et ce hasard s'appliquera **presque toujours**. | AR-F, tranché **avant** de coder, écrit **dans le code** avec sa raison, et **dit** dans la ligne de provenance. |
| R6 | **Le rollback de 4 installations hétérogènes fait plus de mal que l'échec.** Le morceau le plus délicat du lot, et le cadrage parent le dit déjà. | AR-5 et ses **trois** gardes, **chacune avec son contrefactuel** (étape 10). Une garde qui ne peut pas rougir n'est pas une garde. |
| R7 | **Une troisième app fait diverger les conventions du portefeuille** (vitrine, convergence, porteurs de version) et le premier symptôme est une vitrine qui ment. | AR-E(a) : **dupliquer** la convention, cliquet de convergence relevé à trois frères, face en ligne active dès la première release. |
| R8 | **On déclare « livré » ce qui n'est que « buildé »** sur Windows, Linux et macOS Intel. Le précédent AR-6 a déjà coûté ce faux vert. | § 10 : gate humain **déclaré**, jamais compté comme couvert. Aucun critère d'acceptation ne le suppose. |
| R9 | **Le lot recode ce qui existe déjà** (lots 0 et B) parce que le cadrage parent le décrit comme à faire. | § 5.1 et § 5.2 : état mesuré, avec chemins et lignes. **Ces morceaux sont explicitement exclus.** |
| **R10** *(inscrit le 2026-09-04, SOLDÉ le 2026-09-04)* | **La chaîne est amputée pour l'utilisateur nominal.** `install.mjs` ne part dans **aucun** artefact publié (`bundle.js:22-31`, `cli/package.json:12-16`) : un CLI installé par la **voie publique actée par AR-H(a)** ne peut **structurellement pas** jouer l'étape 2, et le moteur C.1 **héritera** de l'impasse. Le risque n'est pas qu'elle existe — c'est qu'elle reste **muette** et se découvre chez l'utilisateur. | **Prérequis d'entrée du lot C, écrit** (§ 5.4). **CA-21** : le refus est **explicite et nomme la cause**, jamais un succès silencieux. Le remède de fond est le successeur **`BUNDLE-INSTALL-MJS-ABSENT`**, **hors périmètre, soumis à arbitrage** — l'inscrire ici sans arbitrage serait décider à la place du décideur ce que le tarball publié contient. ⇒ **SOLDÉ** : arbitré AR-I(a)/AR-J(a) et livré (commits `20ab476`..`27ebcef`, branche `feat/bundle-install-mjs-embarque`) — `install.mjs` embarqué, résolu, délégué ; CA-21 devenu **CA-21′** (§ 9). |
| **R11** *(inscrit le 2026-09-04)* | **Un commentaire du code est pris pour une mesure.** C'est arrivé **dans ce cadrage même** : `install.mjs:50` affirme « la frame embarque install.mjs SANS cli/ », c'est **faux**, et cette phrase a produit une illustration fausse en § 4.0 (AR-F). Le commentaire est toujours là et contaminera le prochain lecteur. | Discipline `canon-avant-citation` : **un fait annoncé comme mesuré doit l'avoir été sur l'objet**, pas sur ce qu'on en dit. Successeur nommé **`COMMENTAIRE-FAUX-INSTALL-MJS-50`**, hors périmètre (§ 4.0). |

---

## 9. Critères d'acceptation

*Testables. Ceux qui ne le sont pas ici sont au § 10, déclarés non couverts.*

**Lot 0 (solde)**
- [ ] **CA-01** — `publishConfig` est conforme au verdict d'AR-H, et le README dit la voie publique
      réelle sans la confondre avec la voie LAN.
- [ ] **CA-02** — `bundle-complet-install-4-composants.md` porte l'amendement daté sur les
      endpoints. **La mention d'origine est conservée, pas effacée.**

**Lot A**
- [ ] **CA-03** — `iakaframe install --dry-run` décrit les **quatre** étapes et **n'écrit rien** —
      prouvé par **empreinte du système de fichiers avant/après**, pas par lecture de code.
- [ ] **CA-04** — Chaque étape demande un feu vert et annonce **quoi, où, quelle version, ce qui
      sera fusionné**. `--yes` les saute **toutes** ; il n'existe aucun chemin où `--yes` en saute
      une partie.
- [ ] **CA-05** — Le CLI **dit quelle source de réservoir** il a retenue **et pourquoi**. À
      versions égales — **cas nominal, M3** — la ligne nomme l'égalité et le verdict d'AR-F.
- [ ] **CA-06** — Réservoir vivant **sans version** : le verdict est celui d'AR-F, la provenance
      porte `version indéterminée`, et **aucun repli silencieux** ne se produit.
- [ ] **CA-07** — Une étape en échec **arrête** la chaîne, énonce l'état atteint et la commande de
      reprise.
- [ ] **CA-08** — **Garde AR-1/AR-4** : pendant la chaîne, le CLI posé à l'étape 1 **ne déploie
      pas** le kit avant validation de l'étape 2. **Contrefactuel obligatoire** : garde désarmée, le
      déploiement se produit et le test **rougit nommément**.
- [ ] **CA-09** — Le verbe figure au registre `cli/src/lib/verbes.js` avec `ecriture: true` et un
      `guideClaudeCode` **motivé**. `docs/commandes.md` est à jour **dans le même lot**.

**Lot C**
- [ ] **CA-10** — La chaîne complète est jouable **sans aucune interface**, et produit le même état
      final que par la façade.
- [ ] **CA-11** — **Rollback, garde 1** : sauvegarde absente ⇒ le rollback **refuse de dérouler** et
      le dit. Il ne supprime **rien** à l'aveugle.
- [ ] **CA-12** — **Rollback, garde 2** : une application **déjà présente** avant la chaîne est
      **restaurée**, jamais effacée.
- [ ] **CA-13** — **Rollback, garde 3** : un rollback partiel énonce ce qu'il **a su** défaire **et
      ce qu'il n'a pas su**. Aucun « restauré » global n'est jamais imprimé.
- [ ] **CA-14** — Un bundle d'application **sans signature minisign valide** est **refusé**.
- [ ] **CA-15** — Hors plateforme couverte, les étapes 3-4 **refusent avec un message explicite** —
      jamais une simulation, jamais un silence.
- [ ] **CA-16** — Le `.dmg` **arm64** de l'installeur, **buildé sur ce poste**, se monte et l'app
      qu'il porte se lance. *(Le seul véhicule prouvable ici — § 10.)*
- [ ] **CA-17** — La release de l'installeur porte les **sept** artefacts de la table de vitrine, ou
      chaque absence est **déclarée** dans `vitrine-locale.json` avec motif, date et condition de
      levée — et la face en ligne **rougit** dès qu'une déclaration devient fausse.
- [ ] **CA-18** — **Notarisation, selon AR-D(b)** : sans secrets Apple, l'étape CI est **sautée en
      le disant** ; la vitrine **déclare** l'app non notarisée ; le README porte la procédure
      **Sequoia** (Réglages Système > Confidentialité et sécurité), pas une formule vague.
- [ ] **CA-19** — L'interface annonce le comptage tranché en AR-A. Aucun écran ne parle de « trois
      installations ».
- [ ] **CA-20** — Le `release.yml` de l'installeur est **épinglé au SHA**, comme celui des deux
      apps. *(Le `release.yml` d'`iakaframe` ne l'est toujours pas — dette **connue et inscrite** à
      son backlog, **hors périmètre de ce lot**.)*
- [x] **CA-21** *(ajouté le 2026-09-04, réponse à R10 — RECTIFIÉ EN CA-21′ le 2026-09-04, texte
      d'origine conservé, jamais effacé)* — Sur un poste **sans réservoir vivant à proximité** —
      cas de l'utilisateur nominal installé par la voie publique (AR-H(a)) —, l'**étape 2 REFUSE en
      nommant la cause** : la charge de la méthode est introuvable, et le message dit **quoi**
      manque et **où** elle était cherchée. **Ni succès silencieux, ni erreur obscure, ni étape
      sautée sans le dire.** Éprouvé par un test qui place le CLI hors de portée de tout réservoir
      vivant. *(Ce critère ne répare pas l'impasse — il interdit qu'elle soit muette. Le remède est
      le successeur `BUNDLE-INSTALL-MJS-ABSENT`, § 5.4.)*
      ⇒ **CA-21′** (successeur livré, `specs/instructions/bundle-install-mjs-embarque.md` § 4/CA-B9) :
      la lettre de CA-21 exigeait un refus **dès qu'aucun réservoir vivant n'existe** — cette lettre
      tombe, car la charge n'est plus introuvable dans ce seul cas (elle voyage avec le paquet,
      AR-I(a)). **La forme survit** : *aucune charge de méthode n'est résoluble ⇒ refus explicite
      qui nomme quoi manque et où c'était cherché*. **Déclencheur neuf** : ni le vivant ni
      l'embarqué ne portent `install.mjs` (bundle amputé). Éprouvé, déterministe (embarqué injecté,
      jamais l'ambiant), sur `cli/test/install-verbe.test.js` et `cli/test/reservoir-ar-f.test.js`.

---

## 10. Ce qui n'est PAS prouvable ici — gate humain, déclaré

*Précédent AR-6, tenu à la lettre : « buildé et signé ne vaut pas recetté ».*

| Ce qui est prouvable sur ce poste (macOS arm64) | Ce qui ne l'est qu'en CI | Ce qui exige une machine absente |
|---|---|---|
| build local de l'app installeur, `.dmg` arm64, montage, lancement (CA-16) · toute la chaîne C.1 **en CLI** · toutes les gardes du lot A | production du `.msi`, du `.exe` NSIS, du `.deb`, du `.rpm`, de l'AppImage et du `.dmg` **Intel** (M12) · publication des artefacts · maîtrise du `latest` | **recette réelle** Windows · **recette réelle** Linux · **recette réelle** macOS Intel · comportement **réel de Gatekeeper** sur un DMG téléchargé par navigateur |

**Non re-mesuré par moi, à re-mesurer par l'exécution avec sa sortie citée** : le symptôme F-d
(`codesign`, `spctl`, quarantaine reposée). J'en ai établi la **cause** par lecture (§ 0.4) ; je
n'en signe pas le **constat**.

**Actes refusés aux agents, appartenant au décideur** : pousser un tag, créer une release, acheter
l'adhésion Apple Developer Program, poser un secret dans les réglages d'un dépôt.

---

## 11. Estimation *(ordre de grandeur assumé et révisable — pas un engagement ferme)*

| Lot | j-homme | Complexité / risque | Inconnues |
|---|---|---|---|
| **0** — solde | **0,25** | faible | aucune ; AR-H supprime la dernière |
| **A** — verbe `install` (étapes 1+2) | **2,5** | **moyenne** | AR-F (la règle d'égalité est le cas nominal, M3) ; AR-G (le CLI ne s'installe pas lui-même) ; la garde de désarmement AR-1 et son contrefactuel |
| **C** — moteur + façade + amorçage | **5** | **forte** | **le rollback de 4 installations hétérogènes** — le morceau le plus délicat, il porte à lui seul la moitié du risque du lot ; monter un dépôt neuf complet ; garder la façade sans logique |
| **B′-a** — ossature de release de la 3ᵉ app | **0,25** | faible | *(jouée avec C.2, § 6.0)* |
| **B′-b** — vitrine + manifeste + convergence | **0,75** | faible | *(jouée après la 1ʳᵉ release, § 6.0)* ; cliquet de convergence à trois frères |
| **Total** | **≈ 8,75** *(fourchette 6 – 13)* | | |
| *(successeur, si le décideur achète l'adhésion Apple)* | *+1* | | notarisation **effective** : `notarytool` + `staple` + recette. **Hors achat**, qui n'est pas du travail d'exécution. **Non compté au total** : AR-D est tranché **(b)**, donc ce lot livre le CI **prêt**, pas la notarisation elle-même |

**Écart avec l'estimation parente (12,5 j) et sa raison** : le parent chiffrait les lots 0 (2 j) et
B (3,5 j) comme **à faire**. La mesure du 2026-09-03 montre qu'ils sont **livrés** (§ 5.1, § 5.2).
**Le lot est donc environ 4 jours moins cher que ce que le cadrage parent annonçait**, et le risque
s'est **concentré** sur C.1 (le rollback) au lieu d'être dilué sur quatre lots.

**Les quatre inconnues qui peuvent faire glisser cette estimation**, nommées *(la 4ᵉ ajoutée le
2026-09-04)* :
1. **Le rollback** (AR-5). Défaire proprement quatre installations hétérogènes est le seul morceau
   dont je ne peux pas borner le coût par comparaison avec de l'existant.
2. **AR-E(a), tranché** : monter un dépôt neuf, c'est répliquer **toute** la convention du
   portefeuille (vitrine à deux faces, convergence, manifeste, canaux, `latest`). C'est duplicable,
   mais ce n'est pas gratuit, et le corpus montre que chacune de ces gardes a coûté un lot à poser.
3. **AR-D(b), tranché** : l'inconnue **n'est plus le coût**, elle est le **temps de vie de la
   déclaration d'absence**. Tant que l'adhésion Apple n'est pas achetée, chaque utilisateur macOS
   qui télécharge le DMG passe par le parcours Sequoia. Le lot livre le CI prêt et l'aveu écrit ;
   il ne livre pas une installation lisse, et **ne doit jamais laisser croire le contraire**.
4. **R10 / `BUNDLE-INSTALL-MJS-ABSENT`** *(2026-09-04, FERMÉE le 2026-09-04)* : si le décideur
   arbitre l'amendement de `bundle.js` **au périmètre** du lot C, compter **+0,5 j**. **Non compté
   au total ci-dessus**, parce qu'il n'est pas arbitré — et **l'y compter d'office reviendrait à
   décider à sa place** ce que le tarball publié contient. **Le total reste donc ≈ 8,75 j** : les
   rectifications du 2026-09-04 ne déplacent **aucun** chiffre.
   ⇒ **Inconnue fermée** : le décideur a arbitré AR-I(a)/AR-J(a) et le successeur a été livré
   (`specs/instructions/bundle-install-mjs-embarque.md`, chiffré **≈ 1 j** avec la garde de tarball,
   contre l'estimation indicative de 0,5 j) — comme lot **autonome**, **ajouté à côté** du total
   parent (≈ 8,75 j), jamais fondu dedans.

---

## 12. Vérification (gate de chaque lot)

Suite complète du CLI verte · `--dry-run` prouvé **sans écriture** par empreinte du système de
fichiers · **contrefactuel sur chaque garde** — canal mort, signature absente, plateforme non
couverte, sauvegarde de rollback manquante, désarmement d'AR-1 —, chacun **révoqué avec preuve** ·
**recette réelle sur une machine nue**, le seul contrôle qui compte pour un installeur.

**Garde d'honnêteté, héritée et non négociable** : un critère **non mesuré** se déclare *non
mesuré*, **jamais** *PASS*. Une formule d'ensemble (« tout est vert », « les suites complètes »)
vaut **FAIL** : chaque commande a **sa** ligne, avec **son** code de sortie et **son** chiffre.
