# Packaging AUR de la suite iaka pour Omarchy — dépôt dédié `iakarchy`

> **Statut** : cadrage remis au décideur — non lancé.
> **Phase** : P1 (cadrage). Auteur : 🔵 Gandalf. Date : 2026-09-10.
> **Décisions amont, non rediscutables** (transmises par Odin) :
> 1. **Nouveau dépôt dédié `iakarchy`** — le packaging Arch ne pollue pas le cœur de la méthode.
> 2. **Deux paquets AUR distincts** : `iakaframe` (CLI Node) et `iakacockpit-bin` (app Tauri).
> 3. **Cible** : `yay -S iakaframe`, `yay -S iakacockpit-bin`, mises à jour incluses.
> 4. **MVP d'abord**, pas de sur-ingénierie.
>
> Ce lot **organise** ce packaging ; il ne rediscute aucun des quatre points. Il **rectifie en
> revanche deux faits** du brief (§ 2.2 et § 2.3) : un fait n'est pas un arbitrage.

---

## 0. Outillage du cadreur — déclaration

**`Bash` n'est pas disponible dans ma session.** Conséquences à assumer par le lecteur :

- Je n'ai **rien exécuté** : ni `makepkg`, ni `namcap`, ni `bsdtar`, ni `curl`. Toutes les mesures
  locales viennent de `Read`/`Glob` sur l'arbre de travail ; toutes les mesures distantes viennent
  de `WebFetch` sur des API publiques (§ 12).
- **Je n'ai pas téléchargé le `.deb` d'IakaCockpit.** Sa **structure interne** (chemins réels dans
  `data.tar.gz`, nom exact du binaire, présence du `.desktop` et des icônes) est donc **déduite de
  la convention du bundler Tauri, PAS MESURÉE**. C'est l'**angle mort déclaré** de ce document ;
  l'étape 3.2 impose de la mesurer **avant** d'écrire le `package()`, et le critère **A11** le rend
  vérifiable.
- Je ne dispose **d'aucune machine Arch**. Tout ce qui relève de « ça build » est écrit comme
  **critère à exécuter en P2**, jamais comme constat.
- **`aur.archlinux.org/rpc` m'a été refusé** (page Anubis). **La disponibilité des deux noms
  `iakaframe` et `iakacockpit-bin` sur l'AUR n'est donc PAS vérifiée** — critère **A12**.

---

## 1. Problème

Installer la suite iaka sur **Omarchy** (Arch + Hyprland, AUR helper par défaut **yay**) demande
aujourd'hui une suite de gestes manuels hétérogènes : récupérer un tarball npm sur une release
GitHub, l'installer globalement, puis aller chercher séparément un bundle Tauri. Rien de tout cela
n'est **découvrable**, rien n'est **mis à jour** par le gestionnaire de paquets du système.

Le besoin : que `yay -S iakaframe` et `yay -S iakacockpit-bin` suffisent, et que `yay -Syu` tienne
les deux à jour — c'est-à-dire poser la **brique 1 : le packaging AUR**.

**Pourquoi l'AUR et pas un plugin de shell Omarchy** (rappel du contexte, la conclusion est déjà
prise) : le système de plugins Omarchy (`~/.config/omarchy/plugins/<id>/`, `manifest.json` +
QML, `omarchy plugin add|enable|validate|update`) **ne porte aucun champ de dépendances ni aucun
hook d'installation**. Un plugin **ne peut pas installer de logiciel** — il peut seulement en
piloter un déjà présent. Le packaging système est donc le **préalable** au plugin, pas son
concurrent.

---

## 2. Faits mesurés — dont deux qui rectifient le brief

### 2.1 CONFIRMÉ — le CLI et l'installeur

| Fait | Mesure |
|---|---|
| Nom npm | `@naonedge/iakaframe` — `cli/package.json:2` |
| Version de l'arbre | **0.41.0** — `cli/package.json:3` |
| Node requis | `>=20` — `cli/package.json:9-11` |
| Binaire | `iakaframe` → `src/index.js` (shebang `#!/usr/bin/env node`, `cli/src/index.js:1`) |
| Dépendances runtime | **AUCUNE** — pas de bloc `dependencies` ; en-tête `cli/src/index.js:2` : « Zero dependance runtime » |
| Contenu publié | `files: ["src", "_bundled", "README.md"]` — `cli/package.json:12-16` |
| `install.mjs` | présent à la racine (`install.mjs:1-38`), Node pur, zéro dépendance, cibles `~/.claude`, `~/.codex`, bundle d'import OpenWebUI (`install.mjs:61-65`) |

**Point décisif, mesuré : le tarball npm est AUTOSUFFISANT.** `cli/scripts/bundle.js:28-38` copie
dans `cli/_bundled/` — donc **dans le tarball publié** — les assets `library`, `methods`, `teams`,
`bindings`, `kits` **et `install.mjs`**, tous en `required: true`. Combiné à zéro dépendance
runtime, cela signifie qu'**une installation depuis le seul `.tgz` ne nécessite AUCUN accès
réseau**. C'est ce qui rend un PKGBUILD npm propre et **hermétique** possible ici — la difficulté
habituelle des paquets npm (résolution de dépendances au `build()`, interdite en pratique) **ne se
présente pas**.

### 2.2 RECTIFIÉ — `@naonedge/iakaframe` n'est **PAS** sur npmjs.org

Le brief dit « Publié sous le nom npm `@naonedge/iakaframe` ». **Mesuré le 2026-09-10** :
`GET https://registry.npmjs.org/@naonedge/iakaframe` → **HTTP 404**.

`cli/package.json:30-32` explique pourquoi : `publishConfig` pointe le registre **npm privé de
Forgejo sur le LAN** (`http://192.168.1.139:3001/api/packages/sjupin/npm/`).

> **Conséquence directe, et c'est le fait le plus structurant du lot** : un PKGBUILD ne peut
> **pas** faire `npm install -g @naonedge/iakaframe`. Ni depuis npmjs (404), ni depuis le LAN
> (inatteignable pour quiconque hors du réseau). **La seule source publique et stable est le
> tarball attaché à la release GitHub.**

**Cette source existe et elle est publique.** `GET api.github.com/repos/iakasju/iakaframe/releases`
(anonyme, 2026-09-10) :

| Tag | draft | prerelease | Asset |
|---|---|---|---|
| **v0.41.0** | false | false | `naonedge-iakaframe-0.41.0.tgz` |
| v0.40.0 | false | false | `naonedge-iakaframe-0.40.0.tgz` |
| v0.39.0 | false | false | `naonedge-iakaframe-0.39.0.tgz` |
| v0.20.4 | false | false | `naonedge-iakaframe-0.20.4.tgz` |

Nom d'asset **stable et prédictible** : `naonedge-iakaframe-$pkgver.tgz` sous le tag `v$pkgver`
(forme canonique d'un `npm pack` sur un paquet scopé). Le workflow qui le produit est
`.github/workflows/release.yml:40-42` (`npm pack`) + `:201-211` (attachement à la release).

### 2.3 RECTIFIÉ — la source d'IakaCockpit est **IakaCockpit**, pas `iakaInstall`

Le brief avance : « `iakaInstall` publie déjà des artefacts Linux … c'est **probablement** la
source des artefacts pour le PKGBUILD `-bin` ». Le mot « probablement » est honnête, et **la
mesure l'infirme**.

`iakaInstall` est un **autre produit** — la **façade GUI d'installation** (`productName:
"iakaInstall"`, `iakaInstall/src-tauri/tauri.conf.json:4`, v0.1.2). Empaqueter son `.deb` sous le
nom `iakacockpit-bin` livrerait **la mauvaise application**.

**IakaCockpit publie ses propres artefacts Linux, et la mesure le prouve.** Son
`.github/workflows/release.yml:62-67` porte une matrice à 4 plateformes dont
`{"key":"linux","platform":"ubuntu-22.04"}`, et `src-tauri/tauri.conf.json:26-29` déclare
`"targets": "all"`. Résultat, `GET api.github.com/repos/iakasju/IakaCockpit/releases/latest`
(anonyme, 2026-09-10) — **release `v0.32.2`**, 16 assets, dont les **trois** artefacts Linux :

| Asset Linux | Taille |
|---|---:|
| `IakaCockpit_0.32.2_amd64.deb` | **15 200 458 o** (~14,5 Mio) |
| `IakaCockpit-0.32.2-1.x86_64.rpm` | 15 200 636 o |
| `IakaCockpit_0.32.2_amd64.AppImage` | **92 379 640 o** (~88 Mio) |

**Deux faits qui commandent des décisions plus bas** :
- **`amd64` / `x86_64` uniquement.** Aucun artefact Linux `aarch64` (l'aarch64 publié est un
  `.dmg`/`.app.tar.gz` macOS). ⇒ `arch=('x86_64')`, sans hésitation.
- **La dernière release est `v0.32.2`, l'arbre de travail est en `0.33.0`**
  (`src-tauri/tauri.conf.json:4`). **Le premier paquet cible donc `0.32.2`**, pas `0.33.0` : on
  empaquette ce qui est **publié**, jamais ce qui est en cours.

### 2.4 Dépendances runtime réelles d'IakaCockpit sur Linux

Lues dans `src-tauri/Cargo.toml` et `.github/deps-linux.txt` (dépendances **de build** Debian, dont
on déduit les runtimes) :

| Source | Besoin | Paquet Arch attendu |
|---|---|---|
| `libwebkit2gtk-4.1-dev` (deps-linux.txt:12) | moteur de rendu Tauri v2 | **`webkit2gtk-4.1`** (extra, **2.52.6-1** au 2026-08-19, mesuré) |
| `libgtk-3-dev` (:16) | toolkit | `gtk3` |
| `libappindicator3-dev` (:13) | indicateur/tray | `libappindicator-gtk3` **ou** `libayatana-appindicator` — **à trancher par mesure** |
| `librsvg2-dev` (:14) | icônes SVG | `librsvg` |
| `cpal = "0.15"` (Cargo.toml:45) | capture micro ALSA | `alsa-lib` |
| `keyring` + `sync-secret-service` (Cargo.toml:35) | secrets | `libsecret` + un **fournisseur** de `org.freedesktop.secrets` → **`optdepends`** (`gnome-keyring`) |
| `rusqlite` *features `bundled`* (:29), `whisper-rs` (:46) | SQLite, whisper.cpp | **statiques — aucune dépendance système** |

Cette liste est un **point de départ à vérifier par `ldd` + `namcap`**, jamais une déclaration
finale (critères **A5** et **A6**).

### 2.5 Contexte Omarchy (hors périmètre, pour mémoire)

Omarchy est un Arch + Hyprland dont l'**AUR helper par défaut est `yay`** — la cible `yay -S` du
décideur est donc la bonne porte, sans installer quoi que ce soit de plus chez l'utilisateur. Les
**shell plugins** (bar-widget, menu) vivent sur la branche **`quattro`**, API jeune : **réserve
maintenue, brique 2 hors périmètre** (§ 6.2).

---

## 3. Décision retenue

Créer le dépôt **`iakarchy`**, portant **deux PKGBUILD** et l'outillage minimal pour les vérifier
et les tenir à jour. **Aucune publication réelle sur `aur.archlinux.org` dans ce lot** (§ 6.2).

### 3.1 `iakaframe` — le CLI Node

**Nom** : `iakaframe`, **sans préfixe `nodejs-`**. Conforme à la règle Arch : le préfixe
`nodejs-` est réservé aux **bibliothèques** ; une **application autonome** porte le nom du
programme. **Sans suffixe `-bin` non plus** : le `.tgz` npm est la forme *source* distribuable
d'un projet Node pur, pas un binaire précompilé.

**Source** : le tarball de la release GitHub (§ 2.2), **jamais** un registre npm.

```bash
pkgname=iakaframe
pkgver=0.41.0
pkgrel=1
pkgdesc="iakaframe - methode de travail outillee, CLI multi-OS"
arch=('any')                      # Node pur : aucun binaire natif
url="https://github.com/iakasju/iakaframe"
license=('LicenseRef-proprietary')   # cli/package.json:33 -> "UNLICENSED" (cf. § 7, question 2)
depends=('nodejs')                 # Arch fournit nodejs >= 20 ; cf. § 9, risque 4
makedepends=('npm')
optdepends=('git: verbes onboard/update/snapshot'
            'npm: installation de la methode vers d autres hotes')
source=("$pkgname-$pkgver.tgz::https://github.com/iakasju/iakaframe/releases/download/v$pkgver/naonedge-iakaframe-$pkgver.tgz")
noextract=("$pkgname-$pkgver.tgz")   # OBLIGATOIRE : makepkg extrairait le .tgz sinon
sha256sums=('...')                   # pose par `updpkgsums`, jamais a la main
```

**`package()` — le patron de l'ArchWiki, et pourquoi il est SÛR ici** :

```bash
package() {
  npm install -g \
    --prefix "$pkgdir/usr" \
    --cache "$srcdir/npm-cache" \
    --no-audit --no-fund --offline \
    "$srcdir/$pkgname-$pkgver.tgz"

  # npm attribue les fichiers a l'utilisateur de build.
  chown -R root:root "$pkgdir"
  # Course connue de npm : des repertoires peuvent recevoir 777.
  find "$pkgdir" -type d -exec chmod 755 {} +
  # npm inscrit des chemins de build (`_where`, proprietes soulignees) dans package.json.
  # -> les retirer (voir Etapes, 3.4).
}
```

`--offline` n'est pas décoratif : c'est **la garde qui prouve** le fait mesuré du § 2.1. Zéro
dépendance ⇒ npm n'a **rien** à résoudre ⇒ si le build échoue en `--offline`, c'est qu'une
dépendance a été introduite en amont, et **on veut le savoir au build, pas chez l'utilisateur**.

**Arborescence produite** (patron `npm -g --prefix`) :
`/usr/lib/node_modules/@naonedge/iakaframe/{src,_bundled}` + `/usr/bin/iakaframe`.

**Ce que devient `install.mjs` — DÉCIDÉ : il est POSÉ, JAMAIS EXÉCUTÉ.**

Il est déjà embarqué dans le tarball (`_bundled/install.mjs`, § 2.1) et atterrit donc dans
`/usr/lib/node_modules/…/_bundled/install.mjs` sans geste supplémentaire.

**Aucun `.install` scriptlet, aucun post-install.** Trois raisons, dans l'ordre de force :

1. **C'est impossible à faire correctement.** Un scriptlet pacman tourne **en root, sans
   utilisateur**. `install.mjs` écrit dans `~/.claude` et `~/.codex` (`install.mjs:61-65`) : il
   écrirait dans `/root/.claude`. Sur une machine multi-utilisateurs, il n'existe **aucun** « le »
   home à cibler.
2. **C'est contraire à la politique Arch** : un paquet ne possède que des fichiers sous son
   `pkgdir` ; il ne dépose rien dans un `$HOME`.
3. **C'est contraire au consentement porté par le code lui-même.** `cli/src/commands/install.js:17-20`
   pose explicitement (AR-4) qu'« un consentement donné pour `/usr/local/lib` **ne couvre pas** une
   écriture dans `~/.claude` ». Un post-install ferait exactement ce que ce garde-fou interdit.

⇒ **L'utilisateur déclenche lui-même la pose de la méthode**, après `yay -S`, par le verbe existant
`iakaframe install` (ou `node /usr/lib/node_modules/@naonedge/iakaframe/_bundled/install.mjs`).
Le paquet livre un **`README.Arch`** dans `/usr/share/doc/iakaframe/` qui dit cette phrase et
seulement elle. **Aucun code nouveau n'est écrit dans ce lot** — le verbe existe déjà.

### 3.2 `iakacockpit-bin` — l'app Tauri

**Artefact retenu : le `.deb`, repacké. Pas l'AppImage.** Justification en quatre points, du plus
fort au plus faible :

| Critère | `.deb` (15,2 Mo) | `.AppImage` (92,4 Mo) |
|---|---|---|
| **Bibliothèques** | **utilise celles du système** (webkit2gtk-4.1 d'Arch, mis à jour par pacman) | **embarque ses propres copies** — un webkit figé, jamais patché par les MàJ de sécurité d'Arch |
| **Disposition** | **déjà FHS** : `/usr/bin`, `/usr/share/applications`, `/usr/share/icons` — le repack est une simple extraction | `squashfs-root` à réorganiser, `.desktop` à réécrire (`Exec=AppRun` → chemin réel) |
| **Poids** | ~14,5 Mio | ~88 Mio, **6×** plus, pour le même logiciel |
| **Runtime** | rien de plus | `fuse2` (ou extraction), dépendance supplémentaire |

Le point 1 est décisif et pas seulement esthétique : empaqueter un moteur web figé dans un paquet
système d'une distribution *rolling release* est précisément ce que la politique Arch cherche à
éviter. Le prix à payer du `.deb` est **assumé et borné** : les `Depends` Debian ne se transposent
pas mécaniquement en `depends` Arch — d'où le § 2.4 et les critères **A5**/**A6**.

```bash
pkgname=iakacockpit-bin
pkgver=0.32.2                      # DERNIERE RELEASE PUBLIEE (§ 2.3), pas 0.33.0
pkgrel=1
pkgdesc="IakaCockpit - cockpit de l ecosysteme iakaProject"
arch=('x86_64')                    # aucun artefact Linux aarch64 (§ 2.3)
url="https://github.com/iakasju/IakaCockpit"
license=('LicenseRef-proprietary')
depends=('webkit2gtk-4.1' 'gtk3' 'librsvg' 'alsa-lib' 'libsecret')  # + indicateur, cf. § 2.4
optdepends=('gnome-keyring: fournisseur org.freedesktop.secrets pour le trousseau')
provides=('iakacockpit')
conflicts=('iakacockpit')
options=('!strip' '!debug')        # binaire deja produit en amont : ne pas y toucher
source=("$pkgname-$pkgver.deb::https://github.com/iakasju/IakaCockpit/releases/download/v$pkgver/IakaCockpit_${pkgver}_amd64.deb")
noextract=("$pkgname-$pkgver.deb")
sha256sums=('...')

package() {
  bsdtar -xf "$srcdir/$pkgname-$pkgver.deb" -C "$srcdir" data.tar.gz   # nom a MESURER (etape 3.2)
  bsdtar -xf "$srcdir/data.tar.gz" -C "$pkgdir"
  # Commodite ligne de commande : le binaire Tauri porte le productName "IakaCockpit".
  ln -s /usr/bin/IakaCockpit "$pkgdir/usr/bin/iakacockpit"
}
```

> ⚠️ **Le `package()` ci-dessus est un SQUELETTE, pas une vérité.** Le nom du membre interne
> (`data.tar.gz` vs `data.tar.xz` vs `data.tar.zst`) et le nom exact du binaire sont **déduits, pas
> mesurés** (§ 0). L'étape 3.2 impose `bsdtar -tf` **avant** d'écrire quoi que ce soit ; **A11**
> exige que le PKGBUILD livré reflète la mesure et non ce squelette.

Le lien symbolique `iakacockpit` **n'est pas un « tant qu'on y est »** : sans lui, un utilisateur
qui vient de taper `yay -S iakacockpit-bin` n'a **aucun** moyen de deviner que la commande
s'appelle `IakaCockpit`. C'est le minimum de cohérence entre le nom du paquet et le nom de la
commande.

### 3.3 Structure du dépôt `iakarchy`

```
iakarchy/
├── CLAUDE.md                    # + structure iakaframe standard (specs/, BACKLOG.md), via `iakaframe onboard`
├── README.md                    # comment verifier, comment mettre a jour, ce qui est EXCLU
├── packages/
│   ├── iakaframe/
│   │   ├── PKGBUILD
│   │   ├── .SRCINFO             # genere : makepkg --printsrcinfo > .SRCINFO
│   │   └── README.Arch          # « la methode ne s installe pas toute seule » (§ 3.1)
│   └── iakacockpit-bin/
│       ├── PKGBUILD
│       └── .SRCINFO
├── scripts/
│   ├── maj-pkgver.mjs           # release GitHub -> pkgver + sha256sums + .SRCINFO (§ 3.4)
│   └── verifier.sh              # makepkg -s + namcap, DANS le conteneur (§ 5)
└── docker/
    └── Dockerfile.arch          # archlinux:base-devel + namcap + utilisateur non-root `builder`
```

**Un dossier par paquet** : c'est la forme qu'attend l'AUR (un dépôt git par paquet, `PKGBUILD` +
`.SRCINFO` à la racine). Chaque dossier de `packages/` est donc **directement poussable** le jour
où la publication aura lieu, sans réorganisation.

**Remote** : Forgejo iakabox, convention globale — `iakaframe onboard` s'en charge.

### 3.4 Stratégie de version — « on suit l'amont, on ne le devance jamais »

- `pkgver` = **version de la release amont**, sans le `v` du tag. Les deux produits ont des
  cadences **indépendantes** (CLI 0.41.0 / Cockpit 0.32.2) : **jamais de version commune**.
- `pkgrel` = 1 à chaque nouveau `pkgver` ; incrémenté **seulement** si le PKGBUILD change à
  `pkgver` constant.
- Pas d'`epoch` (les deux versions sont monotones).
- **Aucun paquet `-git`** : on n'empaquette que du **publié**.
- `scripts/maj-pkgver.mjs` (Node pur, zéro dépendance — cohérent avec le reste de la maison) :
  interroge `api.github.com/repos/<depot>/releases/latest`, lit `tag_name`, écrit `pkgver`, remet
  `pkgrel=1`, appelle `updpkgsums` puis `makepkg --printsrcinfo > .SRCINFO`. **Il ne pousse rien,
  il ne publie rien** : il prépare un diff que l'humain relit.

### 3.5 CI/CD de publication AUR — **PAS dans ce lot**

Publier sur l'AUR exige un **compte** `aur.archlinux.org` et une **clé SSH privée** enregistrée
sur ce compte (`git push ssh://aur@aur.archlinux.org/<pkgname>.git`). **Manipuler une clé SSH
personnelle, ou la déposer en secret CI, est un acte du décideur — refusé à l'agent.** Le lot
s'arrête donc au bord : les deux dossiers de `packages/` sont **prêts à pousser**, la poussée est
un geste humain (§ 6.2, § 7 question 1).

---

## 4. Périmètre

### 4.1 Inclus

1. Créer le dépôt `iakarchy` (structure iakaframe + remote Forgejo) — § 3.3.
2. `packages/iakaframe/PKGBUILD` + `.SRCINFO` + `README.Arch` — § 3.1.
3. `packages/iakacockpit-bin/PKGBUILD` + `.SRCINFO` — § 3.2, **après mesure du `.deb`**.
4. `docker/Dockerfile.arch` + `scripts/verifier.sh` — le banc de vérification, § 5.
5. `scripts/maj-pkgver.mjs` — § 3.4.
6. `README.md` du dépôt : comment vérifier, comment mettre à jour, **ce qui n'est pas fait**.

### 4.2 Exclu — explicitement

| Exclu | Raison |
|---|---|
| **Brique 2 — plugin QML Omarchy** (bar-widget + menu) | Hors périmètre décidé. API `quattro` jeune. → § 6.2 |
| **Publication réelle sur `aur.archlinux.org`** | Compte + clé SSH = acte humain (§ 3.5) |
| **CI/CD de publication AUR** | Corollaire du précédent : pas de secret SSH à câbler |
| **Tout paquet `iakainstall*` ou `iakaframegui*`** | Deux paquets décidés, pas trois |
| **Un paquet `-git`** | On n'empaquette que du publié (§ 3.4) |
| **Toute modification des dépôts `iakaframe`, `IakaCockpit`, `iakaInstall`** | `iakarchy` **consomme** leurs releases ; il ne les change pas |
| **Neutraliser l'auto-updater Tauri d'IakaCockpit** | Risque **réel** et **documenté** (§ 9, risque 1), mais patcher un binaire amont n'est pas du MVP |
| **`aarch64`** | Aucun artefact Linux aarch64 publié (§ 2.3) |
| **Un dépôt pacman auto-hébergé** | Alternative à l'AUR ; le décideur a tranché AUR (§ 7, question 3) |

---

## 5. Comment on prouve que ça marche

**Rien ne se vérifie sur macOS.** Le banc est un **conteneur Arch**, et il est **dans le
périmètre** — sans lui, aucun critère d'acceptation n'est exécutable.

`docker/Dockerfile.arch` : `archlinux:base-devel`, + `namcap`, + un utilisateur non-root `builder`
(`makepkg` **refuse** de tourner en root — c'est la première chose qui casse quand on essaie).

`scripts/verifier.sh <paquet>`, exécuté dans ce conteneur, enchaîne :

1. `namcap PKGBUILD` — lint de la recette **avant** tout build ;
2. `makepkg -s --noconfirm` — build + résolution des dépendances déclarées ;
3. `namcap *.pkg.tar.zst` — lint du **paquet construit** : c'est **cette** passe, et elle seule,
   qui détecte les **dépendances manquantes ou superflues** en lisant les liens ELF réels ;
4. `pacman -U` du paquet produit, puis un **lancement effectif** :
   - `iakaframe --help` → doit rendre 0 ;
   - `IakaCockpit` → ne peut **pas** se lancer sans serveur graphique dans le conteneur ; on
     vérifie ce qui est vérifiable sans X/Wayland : `ldd /usr/bin/IakaCockpit` **sans aucun
     `not found`**, et présence du `.desktop` + des icônes. **Le lancement réel de la fenêtre est un
     geste humain sur la machine Omarchy** (critère **A9**, non délégable).

> **Ce que le conteneur ne prouve PAS, et il faut le dire** : il tourne sur l'Arch **du jour du
> build**, pas sur l'Omarchy du décideur, et il n'a **ni GPU, ni Wayland, ni Hyprland**. Un
> `namcap` vert et un `ldd` complet ne garantissent **pas** qu'une fenêtre s'ouvre sous Hyprland.
> C'est exactement pourquoi **A9 existe et n'est pas délégable**.

---

## 6. Étapes d'implémentation

**0.** Lire cette instruction en entier avant d'écrire une ligne.

**1. Le dépôt.**
   1.1 `iakaframe onboard` dans `~/work/iakarchy` (structure + Forgejo + 1er commit).
   1.2 Remplir `CLAUDE.md` : stack = Bash/PKGBUILD + Node pour l'outillage ; commandes = celles du
       § 5 ; backlog = brique 2 et publication AUR.

**2. Le banc AVANT les recettes.** Écrire `docker/Dockerfile.arch` + `scripts/verifier.sh`, et
   **prouver que le banc tourne à vide** (le conteneur démarre, `makepkg --version` et
   `namcap --version` répondent). Écrire un PKGBUILD qu'on ne peut pas tester est le meilleur moyen
   d'en écrire deux faux.

**3. `iakacockpit-bin` — la MESURE d'abord.** *(Ce paquet passe en premier parce que c'est le seul
   dont le contenu est inconnu ; le plus incertain se traite en tête, pas en queue.)*
   3.1 Télécharger `IakaCockpit_0.32.2_amd64.deb`, noter son **sha256**.
   3.2 `bsdtar -tf` sur le `.deb` **puis** sur son membre de données : relever le **nom exact du
       membre**, la **liste réelle des chemins**, le **nom exact du binaire**, la présence du
       `.desktop` et des icônes. **Relever aussi le champ `Depends` du `control`.** Consigner tout
       cela dans le dépôt (`packages/iakacockpit-bin/MESURES.md`) — la mesure se garde, elle ne se
       refait pas à chaque doute.
   3.3 Écrire le PKGBUILD **d'après 3.2**, pas d'après le squelette du § 3.2.
   3.4 `verifier.sh iakacockpit-bin`. Boucler sur `depends` jusqu'à `namcap` propre.
   3.5 `makepkg --printsrcinfo > .SRCINFO`.

**4. `iakaframe`.**
   4.1 PKGBUILD selon § 3.1 ; `updpkgsums`.
   4.2 Retirer les chemins de build inscrits par npm dans les `package.json` posés (propriétés
       soulignées, `_where`) — sinon `namcap` signale des références à `$srcdir`.
   4.3 `verifier.sh iakaframe`, puis `pacman -U` + `iakaframe --help`.
   4.4 `README.Arch` : la phrase du § 3.1 et rien d'autre.
   4.5 `.SRCINFO`.

**5. `scripts/maj-pkgver.mjs`** (§ 3.4) + **`README.md`** du dépôt.

**6. Gate humain** : sur la machine Omarchy réelle, `makepkg -si` depuis chaque dossier, puis
   lancement de l'app **sous Hyprland** (A9).

---

## 7. Ce que je laisse au décideur

Quatre points. **Je ne les tranche pas** : ils engagent une exposition publique ou une posture, pas
une technique.

1. **Qui pousse sur l'AUR, et quand ?** Le lot livre deux dossiers prêts. La création des deux
   paquets sur `aur.archlinux.org` (compte + clé SSH) est **votre geste**. Voulez-vous que ce soit
   la suite immédiate, ou que les recettes vivent d'abord en local ?

2. **La licence.** `cli/package.json:33` porte `"UNLICENSED"` — propriétaire, tous droits
   réservés. L'AUR **n'héberge pas de binaires** (seulement des recettes), donc rien n'y est
   redistribué. Mais un paquet AUR est **public** : il annonce publiquement le produit et l'URL de
   ses artefacts. **Est-ce voulu ?** Si oui, faut-il en profiter pour poser une vraie licence
   plutôt que `LicenseRef-proprietary` ?

3. **Publier publiquement une app qui pointe des adresses de LAN.**
   `IakaCockpit/src-tauri/tauri.conf.json:42-45` déclare comme endpoint d'update
   `http://192.168.1.139:3001/…` (Forgejo iakabox), avec
   `dangerousInsecureTransportProtocol: true`. Sur l'AUR, n'importe qui installe ce binaire ; il
   tentera de joindre une IP privée qui, chez lui, appartient à quelqu'un d'autre. Ce n'est **pas**
   une fuite de secret, mais c'est une **divulgation de topologie interne** et un comportement
   surprenant pour un tiers. **Assumé, ou faut-il d'abord retirer cet endpoint de la version
   publiée ?** *(Corollaire, si la réponse gêne : un dépôt pacman auto-hébergé donnerait le même
   `pacman -S` sans exposition publique — mais l'AUR est déjà tranché, donc je ne rouvre pas, je
   signale.)*

4. **L'auto-updater vs pacman** (§ 9, risque 1). Documenter seulement (MVP), ou traiter dès ce
   lot ?

---

## 8. Fichiers concernés

**Tous dans le dépôt NEUF `iakarchy`** — aucun fichier des dépôts `iakaframe`, `IakaCockpit` ou
`iakaInstall` n'est modifié par ce lot (critère **A10**).

- `iakarchy/packages/iakaframe/{PKGBUILD,.SRCINFO,README.Arch}` — **créés**
- `iakarchy/packages/iakacockpit-bin/{PKGBUILD,.SRCINFO,MESURES.md}` — **créés**
- `iakarchy/docker/Dockerfile.arch`, `iakarchy/scripts/{verifier.sh,maj-pkgver.mjs}` — **créés**
- `iakarchy/{CLAUDE.md,README.md,BACKLOG.md,specs/**}` — **créés** (onboard)
- *(lecture seule)* `iakaframe/cli/package.json`, `iakaframe/cli/scripts/bundle.js`,
  `iakaframe/install.mjs`, `IakaCockpit/src-tauri/{tauri.conf.json,Cargo.toml}`,
  `IakaCockpit/.github/{workflows/release.yml,deps-linux.txt}`

**Cette instruction elle-même** vit dans le dépôt de la méthode
(`iakaframe/specs/instructions/packaging-aur-iakarchy.md`) parce que `iakarchy` n'existe pas
encore. Elle **migrera** vers `iakarchy/specs/instructions/` à la première mise à jour du paquet.

---

## 9. Risques

1. **L'auto-updater Tauri contre pacman — le risque le plus concret.**
   `IakaCockpit/src-tauri/tauri.conf.json:38-49` active le plugin `updater`. Installée par pacman,
   l'app vit sous `/usr/bin` : elle **détectera** une mise à jour, la **téléchargera**, et
   **échouera à l'écrire** (utilisateur sans droit sur `/usr`). Au mieux une erreur incompréhensible,
   au pire deux versions concurrentes. *Mitigation MVP* : le dire dans `README.Arch` — « sur Arch,
   les mises à jour passent par `yay`, pas par le bouton de l'application ». *Traitement complet*
   (hors lot) : neutraliser l'updater dans les builds Linux amont. → § 7, question 4.

2. **La structure du `.deb` n'est pas mesurée** (§ 0). Un nom de membre ou de binaire faux ⇒
   `package()` vide, ou paquet sans exécutable. *Mitigation* : étape 3.2 **obligatoire avant
   écriture**, consignée dans `MESURES.md`, contrôlée par **A11**.

3. **Les `depends` d'un repack sont toujours faux au premier essai.** Les `Depends` Debian ne se
   transposent pas nom pour nom. *Mitigation* : `namcap` sur le **paquet construit** (§ 5, passe 3)
   lit les liens ELF réels — c'est l'outil qui a le dernier mot, pas le § 2.4.

4. **`nodejs` en `depends` non borné.** Le CLI exige `>=20` ; Arch (rolling) est **au-delà**, donc
   la contrainte est satisfaite aujourd'hui. Le risque **inverse** est réel : une version Node
   **trop récente** peut casser du code Node pur. *Mitigation* : `iakaframe --help` **dans le
   conteneur Arch** (A3) est exactement ce test. *Non mitigé* : une régression Node future — c'est
   le prix du rolling, et il n'y a rien de mieux à faire en MVP.

5. **Un `.tgz` amont peut changer sans changer de version.** Le `sha256sums` du PKGBUILD casserait.
   *Mitigation* : c'est le **comportement voulu** — l'échec de somme est une **alarme**, pas une
   panne. On ne met **jamais** `SKIP`.

6. **`bsdtar` disponible ?** Fourni par `libarchive`, dépendance de `pacman` : présent partout sur
   Arch. Aucun `makedepends` requis. *Réserve* : à confirmer par le run réel (A2).

7. **Les deux noms peuvent être pris sur l'AUR** (§ 0, non vérifié). *Mitigation* : **A12**, à
   exécuter **avant** tout travail de nommage aval.

---

## 10. Critères d'acceptation

- [ ] **A1 — Le banc existe et tourne à vide.** Le conteneur `docker/Dockerfile.arch` démarre ;
      `makepkg --version` et `namcap --version` répondent ; `makepkg` tourne en utilisateur
      **non-root**.
- [ ] **A2 — `iakacockpit-bin` se construit.** `verifier.sh iakacockpit-bin` : `makepkg -s` réussit,
      produit **un** `.pkg.tar.zst` d'architecture `x86_64`.
- [ ] **A3 — `iakaframe` se construit ET démarre.** `makepkg -s` réussit ; après `pacman -U`,
      `iakaframe --help` sort en **0**. Le paquet est `arch=('any')`.
- [ ] **A4 — Build hermétique du CLI.** Le `npm install` du `package()` porte `--offline` et
      **réussit** — preuve exécutée du fait « zéro dépendance runtime » (§ 2.1). S'il échoue, une
      dépendance a été introduite en amont : **remonter, ne pas retirer `--offline`**.
- [ ] **A5 — `namcap` sur les deux PKGBUILD** : aucun message `E:`. Les `W:` sont **listés et
      justifiés** dans le `README.md` du dépôt, jamais tus.
- [ ] **A6 — `namcap` sur les deux paquets construits** : **aucune dépendance manquante**. Les
      dépendances superflues sont retirées.
- [ ] **A7 — Aucun `not found`.** `ldd /usr/bin/<binaire IakaCockpit>` après `pacman -U` : zéro
      ligne `not found`.
- [ ] **A8 — Intégration de bureau.** Le paquet installe un `.desktop` sous
      `/usr/share/applications/` et au moins une icône sous `/usr/share/icons/`. Le lien
      `/usr/bin/iakacockpit` existe et pointe le binaire réel.
- [ ] **A9 — Gate humain, non délégable.** Sur la **machine Omarchy** : `makepkg -si` depuis chaque
      dossier, puis `yay -S` une fois publié le cas échéant ; **la fenêtre d'IakaCockpit s'ouvre
      sous Hyprland**, et l'entrée apparaît au lanceur. **Aucun conteneur ne remplace ce test.**
- [ ] **A10 — Aucun débordement de périmètre.** Le diff ne touche **que** `iakarchy/` (+ cette
      instruction). Un fichier modifié dans `iakaframe/`, `IakaCockpit/` ou `iakaInstall/` est un
      **défaut**.
- [ ] **A11 — Le `.deb` a été MESURÉ avant d'être empaqueté.** `packages/iakacockpit-bin/MESURES.md`
      existe et porte : nom du membre de données, liste des chemins, nom du binaire, champ
      `Depends` du `control`, sha256 de l'artefact. **Un PKGBUILD écrit d'après le squelette du
      § 3.2 sans cette mesure est un défaut**, même s'il build.
- [ ] **A12 — Disponibilité des noms sur l'AUR vérifiée.** Recherche sur `aur.archlinux.org` :
      `iakaframe` et `iakacockpit-bin` sont **libres**. Résultat consigné dans le `README.md`. Si
      l'un est pris → **remonter au décideur**, ne pas renommer seul.
- [ ] **A13 — `.SRCINFO` en accord avec son `PKGBUILD`.** Régénérer et constater un **diff vide**
      (garde anti-dérive : un `.SRCINFO` périmé est la première cause de rejet AUR).
- [ ] **A14 — `maj-pkgver.mjs` est idempotent et inoffensif.** Lancé deux fois sans nouvelle
      release amont ⇒ **diff vide**. Il n'exécute **ni `git push`, ni `git commit`**.
- [ ] **A15 — Aucun `sha256sums=('SKIP')`** dans aucun des deux PKGBUILD.
- [ ] **A16 — La limite est écrite.** Le `README.md` du dépôt énonce noir sur blanc que la
      **publication AUR n'a pas eu lieu** et **pourquoi** (clé SSH = geste humain), et que le
      **plugin QML Omarchy est hors périmètre**.

---

## 11. Délégable / geste humain

| Geste | Nature | Qui |
|---|---|---|
| Création du dépôt + onboard | Mécanique | **Délégable** (⚒️ Gimli) |
| Banc conteneur (Dockerfile + verifier.sh) | Mécanique | **Délégable** |
| **Mesure du `.deb` (étape 3.2)** | Mesure, à consigner | **Délégable**, mais **A11** l'exige |
| Écriture des deux PKGBUILD | Technique, patron connu | **Délégable** |
| Boucle `namcap`/`depends` | Itératif | **Délégable** |
| `maj-pkgver.mjs` | Node pur | **Délégable** |
| **A9 — lancement sous Hyprland** | Jugement, matériel réel | **HUMAIN, non délégable** |
| **A12 → si un nom est pris** | Décision de nommage | **Décideur** |
| **Compte AUR + clé SSH + push** | Acte de publication | **DÉCIDEUR — refusé à l'agent** |
| Questions § 7 | Décision | **Décideur** |

---

## 12. Estimation

### Équivalent jour-homme — spec fermée

| Poste | j-h |
|---|---:|
| Dépôt `iakarchy` + onboard + `CLAUDE.md`/`README.md` | 0,15 |
| Banc conteneur Arch (Dockerfile + `verifier.sh`) | 0,25 |
| **`iakacockpit-bin` : mesure du `.deb` + PKGBUILD + boucle `namcap`/`depends`** | **0,50** |
| `iakaframe` : PKGBUILD + nettoyage `_where` + vérifs | 0,30 |
| `maj-pkgver.mjs` + `.SRCINFO` des deux paquets | 0,25 |
| Vérifications A1-A8, A10-A16 | 0,20 |
| **A9 — test réel sous Omarchy/Hyprland** | 0,15 |
| **Total** | **≈ 1,80 j-h** |

**Le poids est sur `iakacockpit-bin` (28 %)**, et c'est normal : c'est le seul des deux dont le
contenu est **inconnu au moment du cadrage**. Le PKGBUILD npm, lui, est un patron documenté appliqué
à un tarball autosuffisant — le travail y est prévisible.

### Complexité / risque : **FAIBLE en complexité, MOYEN en risque**

**Faible en complexité** : aucun algorithme, aucune API à concevoir. Deux recettes déclaratives et
un banc. Rien n'est inventé — les deux patrons (npm `.tgz`, repack `.deb`) sont des classiques
documentés.

**Moyen en risque**, pour trois raisons non réductibles :

1. **Le premier `depends` est faux par construction** (risque 3). Rattrapé par `namcap`, donc
   **détecté, pas silencieux** — mais il faut boucler, et le nombre d'itérations est inconnu.
2. **La structure du `.deb` n'est pas mesurée** (§ 0). C'est le seul endroit où le cadrage écrit un
   squelette au lieu d'un fait, et il le dit.
3. **La vérification finale exige du matériel** que ni le cadreur ni le conteneur ne possèdent
   (A9). Aucun automatisme ne remplace l'écran.

Aucun risque d'effet externe : **rien n'est publié**, rien n'est poussé sur l'AUR, aucun dépôt
amont n'est modifié.

### Inconnues susceptibles de faire glisser

| Inconnue | Effet | Probabilité |
|---|---|---|
| Structure du `.deb` différente de la convention supposée | +0,2 j-h | Faible |
| `depends` : indicateur Ayatana vs GTK3, `libsecret` implicite… | +0,2 j-h | **Moyenne** |
| IakaCockpit ne démarre pas sous Hyprland (Wayland/webkit) | +0,5 à +1,0 j-h, **et le lot n'est pas clos** | Faible-moyenne |
| Un des deux noms est pris sur l'AUR (A12) | renommage + reprise du § 3 | Faible |
| npm inscrit plus de résidus de build que prévu (étape 4.2) | +0,1 j-h | Faible |
| Le décideur veut la publication AUR **dans** ce lot | +0,3 j-h, **et change la nature du lot** (acte humain) | Ouverte (§ 7) |
| Le décideur veut neutraliser l'updater (§ 7 q.4) | +0,5 j-h, **et sort du dépôt `iakarchy`** | Ouverte |

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## 13. Sources

### Internes — `Read`/`Glob` sur l'arbre de travail, 2026-09-10

`iakaframe/cli/package.json` · `iakaframe/cli/src/index.js:1-40` ·
`iakaframe/cli/scripts/bundle.js:1-70` · `iakaframe/cli/src/commands/install.js:1-80` ·
`iakaframe/install.mjs:1-120` · `iakaframe/.github/workflows/release.yml` ·
`IakaCockpit/src-tauri/tauri.conf.json` · `IakaCockpit/src-tauri/Cargo.toml` ·
`IakaCockpit/package.json` · `IakaCockpit/.github/workflows/release.yml` ·
`IakaCockpit/.github/deps-linux.txt` · `iakaInstall/src-tauri/tauri.conf.json` ·
`iakaframe/specs/instructions/{retrait-scripts-powershell,generateur-vitrine-methode-md-html}.md`
(alignement de format).

### Externes — vérifiées le 2026-09-10

| Fait vérifié | Source |
|---|---|
| `@naonedge/iakaframe` **absent de npmjs** (404) | `https://registry.npmjs.org/@naonedge/iakaframe` |
| 4 releases publiques + noms d'assets `.tgz` | `https://api.github.com/repos/iakasju/iakaframe/releases` |
| Release `v0.32.2` + 16 assets, dont `.deb` / `.rpm` / `.AppImage` **amd64 seuls** | `https://api.github.com/repos/iakasju/IakaCockpit/releases/latest` |
| `webkit2gtk-4.1` **2.52.6-1** présent dans `extra` | `https://archlinux.org/packages/extra/x86_64/webkit2gtk-4.1/` |
| Patron PKGBUILD npm : `npm install -g --prefix "$pkgdir/usr"`, `--cache "$srcdir/npm-cache"`, `noextract`, `makedepends=('npm')`, nettoyage `_where`, préfixe `nodejs-` **réservé aux bibliothèques** | ArchWiki *Node.js package guidelines* (via `https://manual.archlinux.page/package-guidelines/nodejs/` — le wiki direct est derrière Anubis) |
| Suffixe **`-bin` obligatoire** pour un livrable précompilé quand les sources sont disponibles | ArchWiki *Arch package guidelines* / *AUR submission guidelines* |
| `namcap` : lint **du PKGBUILD ET du paquet construit**, détecte dépendances manquantes/superflues ; `E:` à corriger, `W:` à justifier | ArchWiki *Namcap*, `man.archlinux.org/man/namcap.1` |
| Patron AppImage (`--appimage-extract`, `squashfs-root`, réécriture `Exec=AppRun`, `fuse2`, `options=(!strip)`) — **comparatif du § 3.2** | ArchWiki *User:SergeyK/AppImage package guidelines*, PKGBUILD AUR `rustdesk-appimage` / `via-appimage` |
| **Omarchy** = Arch + Hyprland (DHH), **AUR helper par défaut `yay`** | `omarchy.org`, revues Omarchy 2026 |

**Non vérifié — angle mort déclaré** : disponibilité des noms sur `aur.archlinux.org` (RPC refusé
par Anubis, § 0 → **A12**) ; structure interne du `.deb` d'IakaCockpit (non téléchargé, § 0 →
**A11**).
