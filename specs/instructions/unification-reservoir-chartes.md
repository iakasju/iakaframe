# Unification des réservoirs de chartes — canon `iakacharte` + resynchronisation

> **Phase** : P1 — Cadrage · **Cadreur** : l'architecte-cadreur (Gandalf) · **Exécutant** : le
> développeur-devops (Gimli), avec le studio (Loki) sur la conformité de Cinabre · **Gate** :
> Legolas puis validation de Stéphane.
> **Statut** : **cadré, non démarré** — en attente de validation du décideur.
> **Date de cadrage** : 2026-07-30. Mesures faites **le jour même**, par `Read`/`Glob`/`Grep` sur
> l'arbre de travail réel (`~/work/`). Doc en français ; identifiants, noms de fichiers et de
> variables en anglais.
>
> **Arbitrages déjà tranchés par le décideur — NON rouverts ici** :
> 1. **le canon est `~/work/iakacharte`** — les chartes y vivent, point ;
> 2. **Loki produit les chartes** : il crée, il maintient, il garde une copie de travail, il livre
>    dans le canon ;
> 3. **un script de resynchronisation** distribue les chartes du canon vers les consommateurs ; les
>    copies chez les consommateurs deviennent des **artefacts générés**, pas des sources.
>
> **⚠️ Cette instruction REND CADUQUE le § 5 de `chartes-en-bibliotheque.md`** (rapatriement dans
> `library/designs/` — recommandation jamais implémentée : **vérifié, `library/designs/` n'existe
> pas**). Le fichier reste pour sa trace d'arbitrages ; son § 5 est **superseded** par D1 ci-dessous.
> Ses § 4.1/4.2 (paramètre `designId` porté par le frame) restent **valides et hors périmètre**.

---

## 0. Outillage du cadreur — déclaration

Session sans `Bash` : aucune commande n'a été **exécutée**. Toutes les mesures viennent de lectures
de fichiers et de globs. Conséquences assumées :

- **Les empreintes md5/sha ne sont pas recalculées** : quand je dis « identique », je m'appuie sur
  l'inventaire du décideur **ou** sur une comparaison de contenu lue à l'écran (explicitement dite).
- **Les volumes (148 Mo) ne sont pas remesurés** : ils sont reconstruits par comptage de fichiers.
- Aucun script n'a été rejoué. Les contrats de `sync-chartes.sh` / `sync-vignettes.sh` /
  `agents.js` / `bundle.js` sont **lus dans le source**, pas observés à l'exécution.
- **La Phase 0 (§ 8) reconfirme tout** ; l'exécutant ne recopie aucun de mes chiffres sans mesure.

---

## 1. Problème

Trois emplacements se déclarent ou se comportent en réservoir de chartes, avec **deux conventions de
nommage incompatibles** :

| Emplacement | Ce qu'il porte | Convention |
|---|---|---|
| `~/work/iakagraph/theme/` | **10 chartes complètes** + ~2 880 rendus PNG/WebP | `theme/<famille>/<variante>/` |
| `~/work/iakacharte/` | **1 charte** (`design-cinabre/`), se déclare réservoir | `design-<nom>/` |
| `design-naonedge/` dans **4 dépôts** | 1 charte, 8 fichiers, **même contenu** | `design-<nom>/` |

Conséquence observée : la skill de Loki scanne `design-*/`, `iakagraph`/`iakacockpit` lisent
`theme/<famille>/<variante>/`. **Loki a affirmé de bonne foi « il n'y a qu'une charte au catalogue »
alors qu'il y en a dix** — la convention qu'on lui a donnée ne désigne pas le réservoir réel.
Cinabre est le symptôme : bonne charte, invisible des deux côtés.

**Ce que ce lot n'est pas** : ni une refonte de charte, ni un renommage du contrat de tokens, ni le
paramètre `designId` du frame (déjà cadré ailleurs), ni un déménagement de la fabrique de vignettes.

---

## 2. Faits mesurés le 2026-07-30 — six découvertes qui changent la forme du chantier

### 2.1 F1 — **La duplication n'est pas accidentelle : le CLI la produit** *(fait le plus structurant)*

`~/work/iakaframe/cli/src/lib/agents.js:112-120` :

```js
  // Loki : embarque les chartes design-* a la racine du projet.
  if (name === 'loki' && !global) {
    for (const c of fs.readdirSync(root, { withFileTypes: true })) {
      if (c.isDirectory() && c.name.startsWith('design-')) {
        copyDir(path.join(root, c.name), path.join(path.resolve(project), c.name));
```

Quand la persona `loki` est déployée **sur un projet** (jamais en `--global`), le CLI **copie tout
dossier `design-*/` de la racine du framework vers la racine du projet**. `copyDir`
(`agents.js:60-66`) **écrase sans condition** (`fs.copyFileSync`), **sans `--force`, sans détection
de dérive, sans en-tête de provenance**.

**C'est déjà un mécanisme de distribution push, destructif et silencieux.** Il explique exactement
l'état observé :

| Dépôt | `design-naonedge/` | Skill `iakaframe-naonedge` déployée |
|---|---|---|
| `~/work/iakaframe` | **source** (racine du framework) | non déployée |
| `~/work/iakaFreeVision` | copie poussée | oui (`.claude/skills/`) |
| `~/work/iakagraph` | copie poussée | oui |
| `~/work/iakaIDE` | copie poussée | oui |
| `~/.claude` (global) | *aucune* (loop `!global`) | **oui** |

> **Deux conséquences qu'aucun plan ne peut ignorer.**
> **(a)** Supprimer `iakaframe/design-naonedge/` sans toucher `agents.js` fait distribuer **zéro
> charte** → catalogue invisible, c'est-à-dire **le bug d'aujourd'hui en pire**.
> **(b)** Le garder tel quel fait re-pousser indéfiniment une copie qui divergera du canon, en
> **écrasant** sans le dire ce que le resync aurait écrit. Les deux gestes doivent être **coordonnés
> dans le même lot**.
> **(c)** La skill globale (`~/.claude/skills/iakaframe-naonedge/`) prescrit de lister `design-*/`
> **là où le CLI n'en dépose jamais** : en session globale, le catalogue est structurellement vide.

### 2.2 F2 — `~/work/iakacharte` **n'est pas un dépôt git**

Vérifié : `~/work/iakacharte/` contient `design-cinabre/`, `README.md`, `doc/index.html`, `.env` —
et **aucun `.git`** (glob sur `.git/HEAD` et sur `.*` : seul `.env` remonte). Son propre `README.md:29`
l'écrit : « Pas de dépôt git initialisé dans ce dossier ».

> **Le canon désigné n'existe pas encore comme dépôt.** La première étape n'est pas un déplacement,
> c'est une **création de dépôt** (+ remote Forgejo). Corollaire : **il n'y a aucun historique
> d'arrivée** à préserver côté canon, ce qui simplifie la question de l'historique (§ 4 D5).
> Corollaire 2 : `.env` est présent → vérifier `.gitignore` **avant** le premier commit (F2-bis,
> critère C2).

### 2.3 F3 — Les 148 Mo ne sont **pas** des chartes : ce sont des **rendus produits par iakagraph**

Structure mesurée d'une variante (`theme/naonedge/dark/`) :

| Contenu | Nature | Volume |
|---|---|---|
| `charte.md`, `tokens.css`, `components.css`, `preview.html`, `logos/`, `slides/` | **source de charte** | ~6 fichiers |
| `vignettes/`, `vignettes-256/`, `vignettes-256-webp/` | **rendus** : 11 teams × 8 rôles + 8 racine, en 3 résolutions | ~288 fichiers |

Ces rendus sont **produits par iakagraph** : `THEMES.md:50-52` documente
`python build_portraits_comfy.py` (ComfyUI `192.168.2.12:8190`, Juggernaut XL / DreamShaper XL
Turbo), et `iakacockpit/scripts/sync-vignettes.sh:34,115` les indexe par **`iakagraph/teams.json`**.

Arithmétique : 10 chartes × ~288 rendus ≈ **2 880 fichiers**, sur les 2 926 suivis. **Les sources de
charte représentent ~60 fichiers, moins de 1 Mo.**

> **Le « déplacement de 148 Mo » est un faux problème, et le poser ainsi ferait déménager la
> fabrique de vignettes avec sa dépendance ComfyUI + `teams.json`.** Un rendu paramétré par une
> charte n'est pas la charte : c'est un **produit d'iakagraph**. Il reste chez son producteur.
> **Rien de lourd ne bouge** (§ 4 D4).

### 2.4 F4 — Le réservoir iakagraph n'est **pas complet** : 4 assets de marque n'existent que dans `design-naonedge/`

| Asset | `iakaframe/design-naonedge/` | `iakagraph/theme/naonedge/dark/` |
|---|---|---|
| `naonedge-grue.svg` | ✅ | **❌ absent** |
| `naonedge-grue-glyph.svg` | ✅ | **❌ absent** |
| `template-doc.html` | ✅ | **❌ absent** |
| `template-flyer.svg` | ✅ | **❌ absent** |
| `naonedge-logo.svg` | ✅ | ✅ (`logos/`) |
| `template-slides.html` | ✅ | ✅ (`slides/`) |

Aucune des 10 variantes du réservoir ne porte de gabarit **doc** ni **flyer** (glob : seuls
`preview.html` et `slides/template-slides.html`).

> **Régénérer `design-naonedge/` depuis le réservoir en l'état DÉTRUIRAIT la grue (signature de
> marque), le gabarit de doc et le gabarit de flyer.** C'est le point de rupture n°1 du chantier :
> l'import de ces 4 assets dans le canon est un **préalable bloquant** à toute régénération (§ 9 P3,
> critère C6).

### 2.5 F5 — `design-naonedge/naonedge.css` est un **ancêtre périmé**, pas un jumeau

Comparaison de contenu (lue) entre `iakaframe/design-naonedge/naonedge.css:13-46` (`:root`) et
`iakagraph/theme/naonedge/dark/tokens.css:10-50` :

- le réservoir déclare **4 tokens de plus**, explicitement commentés « promus depuis des valeurs
  codées en dur » : `--on-accent`, `--bg-overlay`, `--row-hover`, `--code-text` ;
- le réservoir corrige une coquille de marque (`NaoEdge` → `NaonEdge`).

> Les 4 copies de `design-naonedge/` sont donc **en retard de 4 tokens** sur le canon réel. La
> question n'est pas « laquelle fait foi » : **le réservoir fait foi**, et les copies sont à
> régénérer, pas à fusionner.

### 2.6 F6 — Le contrat de tokens est un **contrat de rôles**, et l'extension a déjà un précédent

`theme/studio/clair/tokens.css:25` : `/* — Accent (rôle « gold » conservé) = INDIGO PRODUIT — */`
avec `--accent-gold:#5b5bd6`.

> **`--accent-gold` est un SLOT, pas une couleur.** Une charte non-or remplit le slot — c'est déjà
> fait, validé et commenté dans le canon. Cela **tranche seul** la question Cinabre (§ 4 D6) : la
> 11ᵉ charte se conforme au contrat des 10, elle ne le réécrit pas.
> Et l'extension du contrat a elle aussi son précédent documenté : la **promotion** des 4 tokens de
> F5. C'est la procédure à réemployer, pas à inventer.

### 2.7 Contrats des consommateurs (lus dans le source)

| Consommateur | Ce qu'il lit | Ce qu'il écrit | Point de vigilance |
|---|---|---|---|
| `~/work/iakacockpit/scripts/sync-chartes.sh` | `${IAKAGRAPH_ROOT}/theme/<f>/<v>/tokens.css` (10 chartes, l. 40-51) | `src/assets/chartes/chartes.css` + `manifest.ts`, **commités**, servis en `self` | l. 118 `[ -n "$val" ] && echo` → **une variable manquante est silencieusement omise** (défaut à ne pas propager). `naonedge-dark/light` sont **hand-written** dans `theme/tokens.css` et **NON régénérées** (l. 105-110) — à ne pas casser |
| `~/work/iakacockpit/scripts/sync-vignettes.sh` | `${IAKAGRAPH_ROOT}/theme/<f>/<v>/vignettes-256-webp/` + `teams.json` | `src/assets/vignettes/` + 2 manifests | dépend de `jq` et de `teams.json` → **reste sur iakagraph** (F3) |
| `cli/src/lib/agents.js:112-120` | tout `design-*/` de la racine framework | racine du projet, **écrasement muet** | F1 |
| `cli/scripts/bundle.js:15` | `ASSETS = [… , 'design-naonedge']` | `cli/_bundled/` (gitignoré, prepack) | **c'est la self-suffisance hors ligne du tarball publié** |
| `library/skills/iakaframe-naonedge/SKILL.md:4,15-25` | `design-*/` | — | déployée en 4 endroits |
| `library/personas/loki.md:40-58` | `design-*/`, table contextuelle citant `design-studio-clair/` | — | **`design-studio-clair/` n'existe nulle part** : la table pointe dans le vide depuis le début |
| `~/work/.portefeuille/docgen.mjs` | rien | `<projet>/doc/index.html` | **inline 21 occurrences de tokens NaonEdge en dur** — 6ᵉ porteur, hors périmètre, à tracer |
| `~/work/iakaArtists/docs/index.html` | rien | — | **inline ~50 occurrences** ; travail en cours (bascule 2 chartes) — **ne rien y toucher** |
| `~/work/iakaFrameGUI/src/themes/naonedge.css`, `~/work/naonedge-dashboard/assets/naonedge.css` | — | — | 2 porteurs supplémentaires **non inventoriés jusqu'ici** ; hors périmètre, à tracer (§ 12) |
| `~/work/iakaframe/frames/releases/StefFrame2/` | — | — | miroir généré : contient `design-starter/` **et** une skill `iakaframe-design` scrubbée. **Ne jamais éditer à la main** |

### 2.8 Chaîne de dérivés impactée par une modification du corps de la skill / de la persona

Mesuré : `cli/src/lib/vendor.js:60-73` — `SKILL_IDS` contient `iakaframe-naonedge`,
`EXPECTED_COPIES = 78`, `EXPECTED_DERIVED = 4` ;
`cli/test/fixtures/skills-golden/manifest.json:146-149` porte le **sha256** du `SKILL.md` ;
`cli/test/fixtures/agents-golden/loki.md` et `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/`
{`skills/iakaframe-naonedge/SKILL.md`, `personas/loki.md`, `agents-golden/loki.md`} sont vendorés.

> **Aucune skill n'est ajoutée ni renommée par ce lot** → `SKILL_IDS` et `EXPECTED_COPIES`
> **restent inchangés** (78). Seuls des **contenus** changent : 3 goldens + 3 fixtures GUI + la zone
> `CODE_BLOCKS` de la vitrine. C'est la chaîne du § 9 P7, et elle est **entièrement mécanique**.

---

## 3. Faits externes vérifiés le 2026-07-30 (+ sources)

- **`git filter-repo` est l'outil recommandé ; `git filter-branch` est déconseillé par Git
  lui-même.** `filter-repo` exige par défaut un **clone frais** (garde-fou anti-perte), permet
  `--path <sous-dossier>` pour extraire un sous-arbre avec son historique, et `--invert-paths` pour
  en retirer des chemins. → fonde D5 (historique du canon) et sa procédure en deux passes.
- **Pratique de l'état de l'art pour des design tokens partagés** : le **dépôt git est la source de
  vérité**, et la distribution se fait soit par **artefacts générés / paquet versionné**, soit par
  **submodule** ; les deux sont considérés viables, le paquet/artefact étant le plus répandu car il
  laisse le consommateur **autonome** (pas besoin de la source pour builder). → fonde D8 (modèle
  **pull + artefacts générés commités**, celui déjà en place dans `sync-chartes.sh`), et écarte le
  submodule qui rendrait chaque consommateur dépendant d'un checkout du canon.

Sources :
- [git filter-repo (git-tower)](https://www.git-tower.com/learn/git/faq/git-filter-repo) ·
  [Migrating a sub-directory while preserving git history](https://jboylantoomey.com/post/migrating-subfolder-while-preserving-git-history) ·
  [Move a subdirectory into its own repo, with history](https://grantwinney.com/how-to-move-a-subdirectory-of-one-repo-into-its-own-repository/)
- [Design Token-Based UI Architecture (Fowler)](https://martinfowler.com/articles/design-token-based-ui-architecture.html) ·
  [Building a Design Token Ecosystem: from source of truth to automated distribution](https://dev.to/timges/building-a-design-token-ecosystem-from-source-of-truth-to-automated-distribution-gpg) ·
  [Design tokens architecture — sync & distribute](https://medium.com/@jdposada/design-tokens-architecture-7544c9a8f33a) ·
  [Où doivent vivre les design tokens ? (Wikimedia T292255)](https://phabricator.wikimedia.org/T292255)

---

## 4. Décisions tranchées

| # | Décision | Raison |
|---|---|---|
| **D1** | **Le canon est `~/work/iakacharte`, structuré en `theme/<famille>/<variante>/`.** Le § 5 de `chartes-en-bibliotheque.md` (`library/designs/`) est **superseded**. | Arbitrage du décideur pour le dépôt ; la **structure interne** est tranchée par la mesure : `theme/<f>/<v>/` est déjà le contrat lu par **deux** consommateurs (`sync-chartes.sh:30,102`, `sync-vignettes.sh:99`), documenté (`THEMES.md:33-44`), et respecté par 10 chartes sur 11. Repointer un consommateur devient alors **le changement d'une variable de racine**, pas une réécriture de logique de chemins — donc une sortie **byte-identique** vérifiable (C9). Toute autre disposition impose de réécrire ces deux scripts et les liens relatifs des 10 `preview.html`, sans rien acheter d'observable. |
| **D2** | **On conserve le nom de répertoire `theme/`** (anglais), et **« charte » reste le mot d'usage** dans la prose française. Le dépôt s'appelle `iakacharte`, son répertoire s'appelle `theme/`. | Convention déjà arbitrée (`chartes-en-bibliotheque.md` § 2 : répertoire en anglais, prose en charte). Renommer `theme/`→`chartes/` casserait `THEMES.md`, `build-portfolio.ps1` (auto-découverte) et les deux scripts du cockpit **pour un gain nul**. `reutilisation-existant` + MVP. |
| **D3** | **La convention `design-*/` n'est pas supprimée : elle devient la FORME DISTRIBUÉE (générée).** `theme/<f>/<v>/` = **forme source** (canon) ; `<projet>/design-<id>/` = **forme distribuée**, artefact généré. Le resync est le **compilateur** entre les deux. | C'est la réconciliation la moins risquée qui existe : **on ne change pas le chemin que scanne la skill déployée**. Une skill qui scanne le mauvais chemin rend le catalogue invisible — c'est le bug d'aujourd'hui ; on ne le rejoue pas. On change **ce que la distribution dépose là**, pas là où l'agent regarde. |
| **D4** | **Les vignettes ne bougent pas. Rien de lourd ne bouge.** Le canon reçoit **~60 fichiers de source** (< 1 Mo) ; `iakagraph/theme/` **garde exactement sa forme actuelle**, ses ~2 880 rendus **et son générateur**. Ce qui change chez lui : les 6 items de source par variante deviennent **générés depuis le canon**. | F3 : un rendu paramétré par une charte est un **produit d'iakagraph** (ComfyUI + `teams.json`), pas une charte. Bénéfice décisif : **aucun chemin de consommateur ne change** → `sync-chartes.sh` et `sync-vignettes.sh` produisent une sortie **byte-identique avant/après** (C9), et les 148 Mo ne traversent jamais rien. |
| **D5** | **Historique conservé, par `git filter-repo` en deux passes sur un clone frais d'`iakagraph`** : passe 1 `--path theme/`, passe 2 `--path-glob 'theme/*/*/vignettes*' --invert-paths`. **Repli documenté** : si `git filter-repo` n'est pas installable, seeder le canon par **copie + un commit de provenance citant le sha exact d'iakagraph** — traçabilité sans historique. Ce repli **n'est pas un échec** et ne rouvre pas le cadrage. | L'historique des chartes est du travail de Loki (itérations de tokens) : il a de la valeur. `filter-repo` est l'outil recommandé (§ 3) et travaille sur clone frais, donc **sans risque pour `iakagraph`**. Le repli existe parce que la valeur de l'historique ne justifie pas de bloquer le lot sur une dépendance d'outil. |
| **D6** | **Cinabre est admise au canon par CONFORMANCE : elle est découpée `tokens.css` + `components.css`, et ses tokens d'accent sont renommés sur le contrat existant** (`--accent`→`--accent-gold`, `--accent-2`→`--accent-gold-light`), + ajout des 4 tokens promus qui lui manquent. | (a) **Le découpage est obligatoire** : sans `tokens.css` isolé, `sync-chartes.sh:102` ne peut pas la lire et `sync-vignettes.sh` non plus — Cinabre resterait invisible du cockpit, c'est-à-dire le symptôme qu'on répare. (b) **Le renommage est légitime, pas une trahison** : `--accent-gold` est un **slot de rôle**, `studio/clair` le remplit déjà d'indigo avec ce commentaire exact (F6). (c) **Une entrante ne réécrit pas le contrat de 10 incumbents** (`reutilisation-existant`, MVP). Le renommage du slot en `--accent` est un **lot séparé** (§ 12). |
| **D7** | **Le contrat de tokens passe de 28 à 30 variables, par PROMOTION appliquée aux 11 chartes** : `--accent-ink` (accent utilisable comme **texte** sur le fond de la charte) et `--shadow-soft`. Pour les 10 incumbents : `--accent-ink:var(--accent-gold)` et `--shadow-soft:var(--shadow-glow)` → **aucun changement de rendu**. | Cinabre les utilise dans ses composants (`cinabre.css:58,67`) avec une valeur d'encre distincte « AA garanti » (`:29-32`). Les supprimer **dégraderait le contraste d'une charte validée** ; les laisser hors contrat **casserait l'invariant** « même liste de variables, seules les valeurs changent » dont dépend l'échangeabilité de `tokens.css`. La **promotion** est la procédure déjà employée et commentée dans le canon (F5). *Les chiffres 28→30 sont indicatifs : la liste normative est établie en Phase 0 sur les 10 fichiers réels.* |
| **D8** | **Sens du resync : PULL, déclenché par le consommateur, artefacts GÉNÉRÉS et COMMITÉS.** On garde le modèle de `sync-chartes.sh`. **Un seul outil**, qui vit **dans le canon** (`bin/iakacharte-sync`), invoqué **avec la cible en paramètre** — pas un script recopié dans chaque consommateur. | (a) Un **push** obligerait le canon à tenir un **registre de ses consommateurs** : dépendance inversée, N arbres sales en une commande, N commits non atomiques, revue impossible. (b) Le **pull + artefact commité** est ce qui donne au consommateur son **autonomie hors ligne** — propriété que `sync-chartes.sh:19-21` revendique explicitement, et la pratique dominante de l'état de l'art (§ 3). (c) L'outil unique dans le canon évite de dupliquer le compilateur (le défaut « N scripts qui divergent »). |
| **D9** | **`bin/iakacharte-sync` est en bash, sans dépendance** : pas de `jq`, pas de `pwsh`, pas de `node`, compatible **bash 3.2 (macOS)**. | Aligné sur `sync-chartes.sh` (bash pur, aucune dépendance) et non sur `sync-vignettes.sh` (qui exige `jq`) ; `pwsh` est retiré du canon (`retrait-scripts-powershell.md`) ; `iakacharte` n'a ni `package.json` ni runtime Node. |
| **D10** | **La copie de travail de Loki est le canon lui-même** — son **arbre de travail git** de `~/work/iakacharte`, où il crée, maintient et livre (commit + push Forgejo). Les 4 `design-naonedge/` deviennent **tous** des artefacts générés ; **aucun** n'est une copie de travail. Les **explorations** de Loki continuent d'aller dans `iakagraph/etudes/<projet>/` — **règle inchangée, hors périmètre**. | Lecture littérale de l'arbitrage 2 : « garde une copie de travail **et** livre dans le canon » = *working copy* git du canon. C'est la seule lecture qui donne **un seul sens de flux**. Faire de `iakagraph/theme/` à la fois une source (Loki écrit) et une cible (le resync écrit) créerait exactement l'ambiguïté qui produit la divergence silencieuse. Et la règle `etudes/` (canon `loki.md:120-130`, contrôlée par Aragorn) couvre déjà le besoin d'atelier. |
| **D11** | **Anti-divergence : (i)** en-tête `GENERE par iakacharte-sync depuis <canon>@<sha> — NE PAS EDITER A LA MAIN.` dans **chaque** fichier généré ; **(ii)** un marqueur `.iakacharte-sync.json` par cible (sha du canon, ids, date) ; **(iii)** `--check` qui **compare le contenu** (jamais le marqueur) et sort non-zéro sur `drift`/`absent`. | Les 4 copies sont identiques **aujourd'hui** et rien ne le garantit demain. Le triptyque en-tête + marqueur + `--check` est exactement le dispositif déjà éprouvé pour les contrats d'agents et les skills (`agents generate --check`, `skills deploy --check`) : on réemploie un patron dont on connaît le comportement. |
| **D12** | **`--check` ne sort JAMAIS non-zéro sur un `orphan`** (un `design-*/` présent chez le consommateur et inconnu du canon) : statut signalé, dossier **conservé**, jamais supprimé d'office. Aucun `--prune` au MVP. | Reconduction de la décision D4 de `deploiement-skills-runtime.md` (orphelines signalées, jamais supprimées). Un `--prune` sur des dossiers de charte pourrait effacer un travail non encore promu au canon. |

---

## 5. Structure canonique de `~/work/iakacharte` (fermée)

```
iakacharte/
├── README.md                     ← réécrit : le canon, les 11 chartes, le contrat, l'outil
├── CONTRAT-TOKENS.md             ← LISTE NORMATIVE des variables (source unique, ordre gravé)
├── CHARTES.md                    ← index (famille · variante · id · registre · chemin tokens)
├── bin/
│   └── iakacharte-sync           ← l'outil unique (§ 6)
├── theme/
│   ├── naonedge/{dark,light}/
│   ├── studio/clair/
│   ├── grimoire/dark-fantasy/
│   ├── cartoon/std/
│   ├── photoreal/modern/
│   ├── os/{windows,ubuntu,android,macos}/
│   └── cinabre/clair/            ← 11ᵉ, admise par conformance (D6)
├── specs/                        ← structure iakaframe (PROJET.md, instructions/, etat-des-lieux)
└── doc/index.html                ← existant, inchangé par ce lot
```

**Contenu normatif d'une variante** — union exacte des deux dispositions existantes, **zéro
renommage** :

```
theme/<famille>/<variante>/
├── charte.md                     OBLIGATOIRE — identité, palette, typo, usages
├── tokens.css                    OBLIGATOIRE — :root, EXACTEMENT les variables du CONTRAT
├── components.css                OBLIGATOIRE — @import url("tokens.css") ; zéro couleur en dur
├── preview.html                  OBLIGATOIRE — recette visuelle
├── logos/                        OBLIGATOIRE — >= 1 SVG
├── slides/template-slides.html   OBLIGATOIRE
├── template-doc.html             OPTIONNEL
└── template-flyer.svg            OPTIONNEL
```

> **Pourquoi cette union et pas un rangement « propre »** : `logos/` et `slides/` sont
> auto-découverts par `iakagraph/build-portfolio.ps1` (onglets Logos / Slides de son `index.html`) ;
> `template-doc.html` et `template-flyer.svg` sont **à la racine** dans `design-naonedge/` et dans
> `design-cinabre/`. Déplacer l'un ou l'autre casse un consommateur pour un gain esthétique. **On
> prend l'union.**

**`CONTRAT-TOKENS.md`** est **normatif** : liste ordonnée des variables, avec pour chacune son
**rôle** (pas sa couleur), et la mention explicite que `--accent-gold` est le **slot d'accent
signature** (F6). Il est établi **par mesure** sur les 10 `tokens.css` en Phase 0, + les 2
promotions de D7. C'est le fichier que `bin/iakacharte-sync` fait respecter.

---

## 6. Contrat de `bin/iakacharte-sync` (fermé)

### 6.1 Invocation

```
iakacharte-sync --form source|design --target <dir> [--charte <id> …] [--check] [--json]
```

- **Racine du canon** résolue dans cet ordre : `$IAKACHARTE_ROOT` → `~/work/iakacharte` → le dépôt
  contenant le script. Échec explicite si aucun `theme/` n'y est trouvé.
- `--charte <id>` répétable ; **absent = toutes les chartes du canon**.
- **`id` d'une charte = `<famille>-<variante>`** (`naonedge-dark`, `studio-clair`, `cinabre-clair`).
  **C'est déjà l'id du cockpit** (`sync-chartes.sh:41-51`, valeur de `data-theme`) : un seul
  vocabulaire d'id du canon jusqu'à l'app.

### 6.2 `--form source` — copie fidèle (cible : `iakagraph`, tout consommateur de tokens)

Écrit `<target>/theme/<famille>/<variante>/` avec les **6 items obligatoires + 2 optionnels** du § 5,
**verbatim**, en-tête de provenance ajouté aux fichiers texte (D11).

> **INTERDIT ABSOLU : l'outil ne lit, n'écrit, ne déplace et ne supprime JAMAIS un chemin
> `vignettes*`.** Garde à écrire en dur, vérifiée par C8. C'est la frontière source/rendu de D4.

### 6.3 `--form design` — compilation de la forme distribuée (cible : racine d'un projet)

Écrit `<target>/design-<id>/` :

| Fichier produit | Depuis |
|---|---|
| `<id>.css` | `tokens.css` **puis** `components.css` concaténés, **la ligne `@import url("tokens.css")` retirée** |
| `<id>-charte.md` | `charte.md` |
| `template-doc.html`, `template-slides.html`, `template-flyer.svg` | gabarits de la variante, avec `href="<ancien>.css"` **réécrit en `href="<id>.css"`** |
| `*.svg` | contenu de `logos/`, **à plat** |

> **Deux pièges à ne pas manquer.** (1) `components.css` **importe** `tokens.css` en relatif
> (`:7`/`:9`) : concaténer sans retirer l'`@import` produit un CSS où un `@import` suit des règles →
> **ignoré par les navigateurs**, tokens perdus. (2) `template-doc.html:12` porte
> `<link rel="stylesheet" href="naonedge.css">` : sans réécriture du `href`, le gabarit distribué
> pointe sur un fichier absent.

### 6.4 Idempotence, non-destructivité, `--check`

- **Idempotent** : deux exécutions consécutives sans changement de canon ⇒ **second `git diff`
  vide** dans la cible.
- **Écriture conditionnelle** : un fichier n'est réécrit que si son contenu diffère (mtime stable).
- **Que fait-il des copies existantes** : il les **écrase** dans le périmètre qu'il possède (les
  items du § 5 / § 6.3) et **rien d'autre**. Il ne supprime aucun dossier, ne touche aucun fichier
  hors périmètre, et **ne supprime jamais un `design-*/` orphelin** (D12).
- **`--check`** : n'écrit rien ; statut par charte `ok` | `drift` | `absent` | `orphan` ; exit **≠0**
  sur `drift`/`absent`, exit **0** sur `orphan` seul (D12) ; `--json` pour l'automatisation.
- **Validation du contrat, bloquante** : si un `tokens.css` du canon ne déclare pas **exactement**
  la liste de `CONTRAT-TOKENS.md` (manquante **ou** en trop), l'outil **échoue et n'écrit rien**, en
  nommant la charte et la variable.
  > C'est la correction du défaut mesuré de `sync-chartes.sh:118` (`[ -n "$val" ] && echo`), qui
  > **omet silencieusement** une variable absente. Concrètement : une Cinabre non conformée y
  > produirait une charte **sans accent**, sans un mot d'erreur.
- **Hors ligne** : le consommateur n'a **jamais** besoin du canon pour builder ni tourner — les
  artefacts sont commités. Il n'a besoin du canon **que pour resynchroniser**. Canon absent →
  message explicite, exit ≠0, **aucune écriture partielle**.

---

## 7. Réconciliation vue de Loki — ordre de résolution du catalogue (gravé)

La skill **conserve** son scan `design-*/`, en **dernier recours**. Nouvelle résolution, du plus
autoritaire au repli :

1. **`$IAKACHARTE_ROOT/theme/`** s'il est posé et contient des chartes → **catalogue complet (11)**.
2. sinon **`~/work/iakacharte/theme/`** s'il existe → **catalogue complet (11)**.
3. sinon **`design-*/` à la racine du projet** → **catalogue PARTIEL**, et Loki **le signale**
   (« catalogue partiel : N chartes locales, canon injoignable »).
4. sinon **aucune charte** → rendu neutre lisible, **signalé**, et **jamais bloquant**.

> **C'est la propriété de sûreté du lot** : la nouvelle résolution est un **sur-ensemble strict** de
> l'ancienne. Un projet non encore resynchronisé, ou une machine sans le canon, se comporte
> **exactement comme aujourd'hui**. Aucune régression possible par construction (critère C13).
> Règle « **signal, jamais gate** » — reconduite de `chartes-en-bibliotheque.md` § 4.4 : « charte non
> déclarée » ne doit jamais empêcher de produire un document.

**Ce que la forme distribuée contient au MVP** : `design-naonedge-dark/` (ce que les 3 projets ont
déjà) **et** `design-studio-clair/` (le défaut documenté du contexte « dev logiciel », qui
**aujourd'hui pointe dans le vide** — `loki.md:56` cite `design-studio-clair/`, inexistant partout).
**On ne copie PAS les 11 chartes dans chaque racine de projet** : ce serait remplacer une
duplication par onze.

---

## 8. Phase 0 — GATE (constat avant toute écriture)

**Aucune ligne n'est écrite avant que ce constat soit rendu par écrit.** Mon inventaire est daté du
**2026-07-30** et doit être **reconfirmé**. **Si un point diverge de ce cadrage, l'exécutant REVIENT
AU CADRAGE** — il n'improvise aucun écart.

1. **Compte et identité des chartes.** Lister `~/work/iakagraph/theme/*/*/` : **10** attendues,
   exactement les ids du § 6.1. Écart (charte ajoutée/retirée/renommée) → **retour cadrage**.
2. **Contrat de tokens réel — le point le plus important.** Extraire la liste des variables des
   **10** `tokens.css` et la **comparer deux à deux**. Attendu : **liste strictement identique**,
   **28** variables. Toute divergence, même d'une variable, → **retour cadrage** (elle invalide D7 et
   le § 6.4).
3. **Cinabre — écart mesuré.** Lister les variables de `~/work/iakacharte/design-cinabre/cinabre.css`
   (`:root`). Attendu : `--accent`, `--accent-2`, `--accent-ink`, `--shadow-soft` présents ;
   `--accent-gold`, `--accent-gold-light`, `--on-accent`, `--bg-overlay`, `--row-hover`,
   `--code-text` absents. Écart → **retour cadrage** (le plan de conformance D6/D7 en dépend).
4. **F4 — les 4 assets orphelins.** Confirmer que `naonedge-grue.svg`, `naonedge-grue-glyph.svg`,
   `template-doc.html`, `template-flyer.svg` sont **présents** dans `design-naonedge/` et **absents**
   de `theme/naonedge/dark/`. Confirmer qu'**aucune** des 10 variantes n'a de `template-doc.html`.
   **Bloquant** : si l'inverse, P3 change.
5. **F1 — le producteur.** Relire `cli/src/lib/agents.js:112-120` et confirmer la boucle `design-*`
   + l'écrasement inconditionnel de `copyDir`. Confirmer `cli/scripts/bundle.js:15`
   (`'design-naonedge'` dans `ASSETS`). Écart → **retour cadrage** : tout le § 9 en dépend.
6. **F2 — état de `iakacharte`.** Confirmer l'**absence de `.git`**. Inventorier ce qui ne doit
   **jamais** être commité : `.env` **présent**. Si un `.git` existe déjà → **retour cadrage**
   (P1 change de nature).
7. **Empreintes des 4 copies.** `md5`/`shasum` des 4 `design-naonedge/naonedge.css` : identiques
   attendu. **Et** confirmer F5 : ce fichier est **en retard de 4 tokens** sur
   `theme/naonedge/dark/tokens.css`. Si une copie a divergé → **retour cadrage** : elle porte peut-être
   un travail non promu.
8. **Consommateurs — état de référence AVANT toute modification.** Dans `~/work/iakacockpit` :
   arbre **propre**, puis jouer `scripts/sync-chartes.sh` **et** `scripts/sync-vignettes.sh` →
   `git diff` doit être **VIDE**. C'est l'**état de référence** de C9. S'il n'est pas vide, le
   cockpit est déjà désynchronisé → **s'arrêter et rendre compte** (ne pas mêler deux dérives).
9. **Chaîne de dérivés au vert AVANT modification.** Dans `~/work/iakaframe` : `node --test cli/test/`
   **vert**, `iakaframe vendor-check --strict` **propre** (`checked == 78`), présence du dépôt frère
   `~/work/iakaFrameGUI`. Déjà rouge, ou frère absent → **s'arrêter et rendre compte**.
10. **Porteurs supplémentaires.** Confirmer l'existence de `~/work/iakaFrameGUI/src/themes/naonedge.css`,
    `~/work/naonedge-dashboard/assets/naonedge.css`, `~/work/.portefeuille/docgen.mjs` (tokens en
    dur), `~/work/iakaArtists/docs/index.html` (tokens inlinés). **Aucun n'est modifié par ce lot** :
    on les inventorie pour le § 12.
11. **Outillage.** `git filter-repo` disponible ? Si non et non installable → **appliquer le repli
    D5**, et le **dire dans le constat**.

---

## 9. Étapes d'implémentation — ordre d'exécution **impératif**

Plusieurs dépôts sont en jeu : **chaque étape est un commit atomique dans UN seul dépôt**
(*conventional commits*). **Aucune suppression avant P8.** Chemins **absolus**.

### P1 — Faire exister le canon *(dépôt : `~/work/iakacharte`)*
1. `.gitignore` **d'abord** (`.env`, `.DS_Store`, `_bundled/`), **puis** `git init`, **puis** premier
   commit. Structure iakaframe autour de l'existant (non destructif) + remote Forgejo
   `http://192.168.2.11:3001/sjupin/iakacharte.git` (HTTP + token, description **ASCII**).
2. Vérifier que `.env` **n'est pas** dans le premier commit.
*Rien d'autre n'est touché.*

### P2 — Seeder le canon avec les 10 sources *(canon uniquement)*
3. Clone **frais** d'`iakagraph` dans un dossier temporaire. `git filter-repo --path theme/` puis
   `git filter-repo --path-glob 'theme/*/*/vignettes*' --invert-paths`. Importer le résultat dans le
   canon (branche dédiée puis merge `--allow-unrelated-histories`). **Repli D5** si `filter-repo`
   indisponible.
4. Vérifier : `~/work/iakagraph` **intact** (arbre propre, aucun fichier modifié) — le clone frais
   garantit qu'on n'y a pas touché.
5. `CONTRAT-TOKENS.md` rédigé **depuis les mesures de la Phase 0** (§ 8 pt 2).

### P3 — Compléter et conformer le canon → 11 chartes *(canon uniquement)* — **préalable bloquant**
6. **Importer les 4 assets orphelins de F4** depuis `~/work/iakaframe/design-naonedge/` :
   `naonedge-grue.svg` et `naonedge-grue-glyph.svg` → `theme/naonedge/dark/logos/` ;
   `template-doc.html` et `template-flyer.svg` → `theme/naonedge/dark/`. **Décider avec Loki** si
   `naonedge/light` reçoit des variantes clair de ces gabarits (sinon : héritage documenté).
7. **Promotion D7** : ajouter `--accent-ink` et `--shadow-soft` aux **10** `tokens.css`
   (`var(--accent-gold)` / `var(--shadow-glow)`) → **aucun changement de rendu attendu**.
8. **Cinabre (Loki)** : créer `theme/cinabre/clair/` — `tokens.css` (`:root` de `cinabre.css`,
   accents renommés + 4 tokens promus ajoutés), `components.css` (le reste, avec
   `@import url("tokens.css")` en tête), `charte.md` (= `cinabre-charte.md`), `template-doc.html`,
   `logos/`, `slides/template-slides.html`, `preview.html`.
9. **Recette visuelle Loki** : ouvrir les **11** `preview.html` et **regarder** (boucle
   `preuve-avant-declaration` de `loki.md:75-102`). Cinabre doit rendre **à l'identique** de
   `design-cinabre/template-doc.html` avant découpe.
10. `CHARTES.md` + `README.md` du canon réécrits (retirer l'aveu « NaonEdge manque » du
    `README.md:15`).

### P4 — L'outil *(canon uniquement)*
11. Écrire `bin/iakacharte-sync` selon le § 6 (bash, sans dépendance, bash 3.2). Aucun consommateur
    n'est touché à cette étape.

### P5 — **Prouver l'équivalence AVANT de recâbler quoi que ce soit** — *gate technique*
12. `iakacharte-sync --form source --target ~/work/iakagraph --check` → attendu **`ok` sur les 10**,
    **zéro drift** : le canon est byte-équivalent à ce qu'iakagraph porte aujourd'hui. **Drift
    inattendu ⇒ le seed est faux ⇒ retour cadrage.**
13. Exécuter sans `--check` → dans `~/work/iakagraph`, `git diff` ne montre **que** l'ajout des
    en-têtes de provenance + les 2 tokens promus + les 4 assets rapatriés. **`vignettes*` : zéro
    fichier au diff.** Commit dans `iakagraph`.
14. Dans `~/work/iakacockpit` : rejouer `scripts/sync-chartes.sh` et `scripts/sync-vignettes.sh` →
    **`git diff` VIDE** (C9). Non vide ⇒ **s'arrêter et rendre compte**.

### P6 — Forme distribuée *(dépôts : `iakaframe`, puis les 3 projets)*
15. `iakacharte-sync --form design --target ~/work/iakaframe --charte naonedge-dark studio-clair` →
    crée `design-naonedge-dark/` et `design-studio-clair/`. **`design-naonedge/` reste en place**
    (retiré en P8 seulement).
16. `cli/scripts/bundle.js:15` : remplacer `'design-naonedge'` par l'énumération des `design-*/`
    présents à la racine (le bundle reste **self-suffisant hors ligne**). `agents.js:112-120`
    **inchangé** : sa boucle voit désormais les nouveaux dossiers.
17. Idem `--form design` sur `~/work/iakaFreeVision`, `~/work/iakagraph`, `~/work/iakaIDE`, **un
    commit par dépôt**.

### P7 — Skill, persona, chaîne de dérivés *(dépôt : `iakaframe`, puis `iakaFrameGUI`)* — **ordre impératif**
18. `library/skills/iakaframe-naonedge/SKILL.md` : remplacer « le catalogue = tous les dossiers
    `design-*/` » par l'**ordre de résolution du § 7** ; ids en `<famille>-<variante>` ; mentionner
    le canon, `IAKACHARTE_ROOT` et la dégradation gracieuse. **Ne PAS renommer la skill.**
19. `library/personas/loki.md:39-58` : même correction ; la table contextuelle cite désormais
    `studio-clair`, `naonedge-dark`, `naonedge-dark` (règle nommée `charte-defaut-conseil-pro`
    **conservée telle quelle** — remplacement **localisé** de la seule cellule de dossier).
20. `node ~/work/iakaframe/cli/scripts/gen-skills-golden.mjs` (sha256 de `iakaframe-naonedge` change ;
    `counts` inchangés).
21. `node ~/work/iakaframe/cli/scripts/gen-agents-golden.mjs` (le corps de `loki.md` est recopié
    verbatim dans le contrat → `agents-golden/loki.md` change).
22. `node ~/work/iakaframe/cli/scripts/gen-methode-vitrine.mjs` (zone `CODE_BLOCKS`).
23. **Vendorer** dans `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/` :
    `skills/iakaframe-naonedge/SKILL.md`, `personas/loki.md`, `agents-golden/loki.md`.
    **`SKILL_IDS` et `EXPECTED_COPIES` (78) restent INCHANGÉS** — aucune skill ajoutée.
24. Vérifier : `node --test cli/test/` **vert** ; `iakaframe vendor-check --strict` → **drift 0**,
    `checked == 78` ; suite GUI verte.
25. **Redéployer** : `iakaframe agents generate --global` puis `iakaframe skills deploy --global`,
    puis par projet (`iakaFreeVision`, `iakagraph`, `iakaIDE`) ; `--check` **exit 0** partout.
    ⚠️ `agents.js:112-120` **écrase** les `design-*/` du projet au passage : vérifier après coup que
    les dossiers distribués sont **identiques** à la sortie de P6 (C11).

### P8 — Retrait des dossiers légataires — **DESTRUCTIF, une étape par dépôt, CONFIRMATION HUMAINE**
26. **Demander confirmation par message texte** en listant précisément ce qui sera supprimé.
27. Puis, **un commit par dépôt**, dans cet ordre : `~/work/iakaIDE/design-naonedge/` →
    `~/work/iakaFreeVision/design-naonedge/` → `~/work/iakagraph/design-naonedge/` →
    `~/work/iakaframe/design-naonedge/` → `~/work/iakacharte/design-cinabre/`.
28. **Avant chaque suppression** : `iakacharte-sync --form design --check` sur la cible → **`ok`**
    (la forme régénérée existe et est conforme). **Après** : ouvrir un support produit avec cette
    charte et **le regarder** (Loki).

### P9 — Recâbler le cockpit sur le canon *(dépôt : `iakacockpit`)*
29. `scripts/sync-chartes.sh` : `IAKAGRAPH_ROOT` → `IAKACHARTE_ROOT` (défaut `$HOME/work/iakacharte`),
    ajouter l'entrée `cinabre/clair|cinabre-clair|Cinabre clair` à `CHARTES`. **Ne PAS toucher** au
    traitement spécial `naonedge-*` (l. 105-110, hand-written, volontairement non régénérées).
30. **`scripts/sync-vignettes.sh` reste sur `IAKAGRAPH_ROOT`** (vignettes + `teams.json` : D4).
    Ajouter un commentaire d'en-tête disant **pourquoi** les deux scripts ne pointent plus au même
    endroit — sans quoi un futur lecteur « corrigera » l'incohérence apparente.
31. Rejouer les deux scripts : `chartes.css` doit être **identique à P5** **plus** le seul bloc
    `html[data-theme="cinabre-clair"]`, et `manifest.ts` **plus** la seule entrée `cinabre-clair`.
    `sync-vignettes.sh` : `git diff` **vide**.

### P10 — Mémoires, doc, clôture
32. Mettre à jour la **mémoire portefeuille** `iakagraph-reservoir-themes` : le réservoir **canon**
    est `iakacharte/theme/` ; `iakagraph/theme/` est **généré, sauf `vignettes*`**. Sans quoi le
    portefeuille porte deux règles contradictoires.
33. Marquer `chartes-en-bibliotheque.md` § 5 **superseded** (renvoi vers ce fichier) ; corriger
    `docs-charte-naonedge.md` (références `design-naonedge/`) ; `THEMES.md` d'iakagraph : dire que
    les sources sont générées depuis le canon.
34. `iakaframe update` dans chaque dépôt touché (état des lieux + commit + push).

---

## 10. Plan de repli — étape par étape

**Invariant** : jusqu'à **P8**, **rien n'est supprimé** ; tout fichier écrasé est dans git et
restaurable. **Jamais** de `git reset --hard`, **jamais** de `push --force` (CLAUDE.md).

| Étape | Comment on revient en arrière | Coût |
|---|---|---|
| **P1** | `rm -rf ~/work/iakacharte/.git` + suppression du dépôt Forgejo. Les fichiers d'origine n'ont pas bougé. | nul |
| **P2** | `git reset --keep` sur le commit P1 **dans le canon uniquement** ; le clone frais est jeté ; `iakagraph` n'a jamais été touché. | nul |
| **P3** | `git revert` des commits du canon. Aucun consommateur touché. | nul |
| **P4** | `git revert`. L'outil n'a encore rien écrit ailleurs. | nul |
| **P5** | **Le drift `--check` EST le filet** : il refuse d'écrire si le canon n'est pas équivalent. Après écriture : `cd ~/work/iakagraph && git checkout -- theme/` restaure les 6 items ; **`vignettes*` n'ayant jamais été touché, aucun rendu n'est en jeu**. Cockpit : `git checkout -- src/assets/`. | minutes |
| **P6** | Les `design-<id>/` sont des dossiers **neufs** : `git rm -r --cached` + suppression. `design-naonedge/` est toujours là → **comportement d'avant restauré intégralement**. `bundle.js` : `git checkout --`. | minutes |
| **P7** | `git revert` du commit skill/persona, **puis rejouer les 3 générateurs et re-vendorer** (l'inverse de la chaîne, même ordre). `vendor-check --strict` prouve le retour à l'état d'avant. Redéployer (`agents generate` + `skills deploy`) pour purger les copies runtime. | ~30 min |
| **P8** | `git revert` du commit de suppression, **dépôt par dépôt** — c'est pourquoi c'est **un commit par dépôt**. Un `revert` groupé serait impossible à défaire partiellement. | minutes |
| **P9** | `git checkout -- scripts/ src/assets/` dans `iakacockpit`. Le script d'avant lisait `iakagraph`, qui **n'a pas changé de forme** (D4) → il refonctionne immédiatement. | minutes |
| **Abandon total** | P8 non fait ⇒ **revenir en arrière est mécanique** : `revert` dans les 4-5 consommateurs + suppression du dépôt canon. **C'est la raison pour laquelle P8 est la dernière étape et la seule destructive.** | ~1 h |

---

## 11. Critères d'acceptation (observables)

Le lot est **PASS** si **tous** les points sont constatables.

| # | Critère | Vérification |
|---|---|---|
| **C1** | Le canon existe : `~/work/iakacharte/.git` présent, remote Forgejo joignable, `theme/` porte **11** variantes aux ids du § 6.1. | `git remote -v` + listage |
| **C2** | `.env` **absent** de tout commit du canon. | `git log --all --name-only \| grep -c '\.env'` = 0 |
| **C3** | **Contrat respecté par les 11** : chaque `tokens.css` déclare **exactement** la liste de `CONTRAT-TOKENS.md` — ni manquante, ni en trop. | `iakacharte-sync --check` exit 0 ; retirer une variable d'un `tokens.css` ⇒ **exit ≠0 nommant la charte ET la variable** (à démontrer une fois) |
| **C4** | **Cinabre est au catalogue et visible partout** : présente dans `CHARTES.md`, dans `iakacockpit/src/assets/chartes/manifest.ts` (id `cinabre-clair`) et dans `chartes.css` (un bloc `html[data-theme="cinabre-clair"]` **avec une valeur `--accent` non vide**). | grep sur les 3 artefacts |
| **C5** | **Loki liste les 11 chartes.** En session, « quelles chartes as-tu ? » ⇒ **11** ids, dont `cinabre-clair`, sans qu'on lui souffle un chemin. | **recette humaine** |
| **C6** | **Aucun asset de marque perdu (F4)** : `naonedge-grue.svg`, `naonedge-grue-glyph.svg`, `template-doc.html`, `template-flyer.svg` présents dans le canon **et** dans `design-naonedge-dark/` généré. Inventaire de fichiers **avant/après** P8 : **aucune perte** hors les dossiers légataires retirés. | diff d'inventaire |
| **C7** | **Idempotence** : deux `iakacharte-sync` consécutifs ⇒ `git diff` **vide** à la seconde, dans **chaque** cible. | `git diff` |
| **C8** | **Frontière source/rendu tenue** : après resync d'`iakagraph`, **zéro** fichier `vignettes*` au diff, et le **compte** de rendus est inchangé. | `git diff --name-only \| grep -c vignettes` = 0 |
| **C9** | **Sortie des consommateurs byte-identique avant/après** : `iakacockpit/scripts/sync-chartes.sh` (état P5) et `sync-vignettes.sh` (à la fin) produisent un `git diff` **vide**, **hors** l'ajout unique de `cinabre-clair` en P9. | `git diff` |
| **C10** | **`--check` mord** : altérer un fichier généré chez un consommateur ⇒ `drift`, exit ≠0 ; en supprimer un ⇒ `absent`, exit ≠0 ; un `design-*/` inconnu du canon ⇒ `orphan`, **conservé**, exit **0**. | exit codes + FS |
| **C11** | **Le producteur historique ne réintroduit plus de dérive** : après `iakaframe agents ... loki --project <p>`, les `design-*/` du projet sont **identiques** à la sortie de `iakacharte-sync --form design`. | diff de dossiers |
| **C12** | **CSS distribué valide** : `design-<id>/<id>.css` **ne contient aucun `@import`** ; ouvrir `design-<id>/template-doc.html` rend la charte (tokens appliqués), son `href` pointe `<id>.css`. | grep + rendu regardé (Loki) |
| **C13** | **Non-régression du repli** : sur un projet **sans** canon accessible (`IAKACHARTE_ROOT` pointé sur un dossier vide), Loki **produit quand même** un support on-brand depuis les `design-*/` locaux et **signale** le catalogue partiel — **sans erreur bloquante**. | **recette humaine** |
| **C14** | **Chaîne de dérivés au vert** : `node --test cli/test/` vert ; `iakaframe vendor-check --strict` **drift 0**, `checked == 78` ; suite GUI verte ; `agents generate --check` et `skills deploy --check` **exit 0** en global et sur les 3 projets. | commandes |
| **C15** | **Aucune prose ne prescrit plus le mauvais chemin** : `grep -rn "catalogue design-\*" library/ ~/.claude/skills/` ne renvoie plus la formule « le catalogue = tous les dossiers `design-*/` » ; `design-studio-clair` cité dans `loki.md` **existe** désormais. | grep + FS |
| **C16** | **Rendu inchangé sur les 10 incumbents** (promotion D7 neutre) : les 11 `preview.html` ouverts et **regardés** ; les 10 anciennes identiques à avant, Cinabre identique à `design-cinabre/template-doc.html` d'avant découpe. | **gate humain (Loki)** |
| **C17** | **Mémoire portefeuille cohérente** : `iakagraph-reservoir-themes` dit que le canon est `iakacharte/theme/`. Aucune règle contradictoire ne subsiste. | relecture |
| **C18** | **Rien touché hors périmètre** : `~/work/iakaArtists/`, `~/work/.portefeuille/`, `~/work/naonedge-dashboard/`, `~/work/iakaFrameGUI/src/themes/`, `frames/releases/StefFrame2/` **inchangés**. | `git status` des dépôts |

> **C5, C13 et C16 sont la recette réelle.** C1-C12 et C14-C18 prouvent la mécanique ; seuls C5
> (Loki voit les 11), C13 (le repli marche) et C16 (le rendu n'a pas bougé) prouvent que le but est
> atteint.

---

## 12. Périmètre

**Inclus** : les 10 étapes du § 9 — création du canon, seed, conformance de Cinabre, promotion des 2
tokens, `bin/iakacharte-sync` (2 formes + `--check`), forme distribuée dans 4 dépôts, mise à jour
skill + persona + chaîne de dérivés + vendor, retrait des légataires, recâblage du cockpit, mémoires.

**Exclu — explicitement, et c'est un choix** :

- **Déplacer les vignettes ou la fabrique de portraits** (D4). `build_portraits_comfy.py`,
  `teams.json`, `build-portfolio.ps1` : **non touchés**.
- **Renommer la skill** `iakaframe-naonedge` → `iakaframe-design` : changerait `SKILL_IDS`,
  `EXPECTED_COPIES`, le **nom du dossier déployé** (donc la commande `/id` du runner) et le miroir de
  frame. **Lot séparé.**
- **Renommer le slot `--accent-gold` → `--accent`** (sémantiquement juste, cf. D6) : 11 × 2 fichiers
  + le `BRIDGE` du cockpit + les pages d'iakagraph. **Lot séparé.**
- **Le paramètre `designId` du frame** (`chartes-en-bibliotheque.md` § 4.1/4.2) : reste valide,
  **hors ce lot**. Ce lot rend seulement le catalogue **résoluble** ; il ne statue pas sur la
  précédence entre paramètre de frame et défaut contextuel (question 🔒 retirée le 2026-07-19).
- **`~/work/.portefeuille/docgen.mjs`** (21 tokens en dur) et **`~/work/iakaArtists/docs/index.html`**
  (~50 tokens inlinés, **travail en cours**) : **ne pas toucher**. Tracés ci-dessous.
- **`~/work/iakaFrameGUI/src/themes/naonedge.css`** et **`~/work/naonedge-dashboard/assets/naonedge.css`** :
  porteurs découverts au cadrage, **hors périmètre**.
- **`frames/releases/StefFrame2/`** (dont `design-starter/` et la skill `iakaframe-design` scrubbée) :
  **miroir généré**, jamais édité à la main.
- **`iakagraph/etudes/`** : règle de rangement des études de Loki, **intouchée** (`loki.md:120-130`).
- **`--prune`** des `design-*/` orphelins (D12).

**Différés tracés** : brancher `docgen.mjs` sur le canon (supprimerait le 6ᵉ porteur) · aligner
`iakaFrameGUI/src/themes/` et `naonedge-dashboard/assets/` · une garde cross-dépôts qui joue
`--check` partout (aujourd'hui manuel ; `vendor-check` ne couvre que iakaframe↔GUI) · renommage du
slot d'accent · renommage de la skill · gabarits doc/flyer pour les 9 chartes qui n'en ont pas.

---

## 13. Risques et points de rupture — les plus dangereux d'abord

| # | Point de rupture | Pourquoi c'est dangereux | Mitigation |
|---|---|---|---|
| **R1** | **F4 — les 4 assets orphelins.** Régénérer `design-naonedge/` depuis le réservoir **détruirait** la grue, le gabarit de doc et le gabarit de flyer. | Perte silencieuse d'un **actif de marque**. Personne ne s'en aperçoit avant de produire un flyer. | P3 étape 6 est un **préalable bloquant** ; C6 compare les inventaires avant/après ; P8 est postérieur et confirmé |
| **R2** | **F1 — `agents.js:112-120` écrase sans le dire.** Un déploiement de Loki **après** un resync réécrit les `design-*/` depuis la racine du framework. | Une dérive **réintroduite par l'outillage**, invisible, juste après avoir été corrigée. | P6 étape 16 (bundle) + P7 étape 25 (vérification post-déploiement) + **C11** |
| **R3** | **La skill déployée en 4 endroits.** Une prose qui prescrit le mauvais chemin rend le catalogue invisible — c'est **le bug d'aujourd'hui**. | Rejouer le bug en croyant le corriger. | **Le scan `design-*/` est CONSERVÉ en dernier recours** (§ 7) : la nouvelle résolution est un **sur-ensemble strict** de l'ancienne ⇒ non-régression **par construction**. C13 le prouve |
| **R4** | **Concaténation CSS naïve.** `components.css` commence par `@import url("tokens.css")` : concaténer sans le retirer produit un `@import` **après** des règles ⇒ **ignoré**, tokens perdus, page sans couleurs. | Casse **muette** de tous les supports distribués. | § 6.3 grave le retrait ; **C12** (`grep @import` = 0 + rendu regardé) |
| **R5** | **Omission silencieuse de token.** `sync-chartes.sh:118` **omet** une variable absente au lieu d'échouer. Une Cinabre non conformée y produit une charte **sans accent**, sans un mot. | Un livrable hors marque qui passe la CI. | § 6.4 : validation du contrat **bloquante** dans le nouvel outil ; **C3** à démontrer en rouge ; **C4** exige une valeur `--accent` **non vide** |
| **R6** | **Les `naonedge-dark/light` hand-written du cockpit.** Volontairement **non régénérées** (`sync-chartes.sh:105-110`) : le défaut byte-stable de l'app. | Les « régénérer proprement » casserait le thème par défaut d'iakacockpit. | P9 étape 29 l'interdit explicitement ; **C9** (diff vide) le détecte |
| **R7** | **Chaîne de dérivés cross-dépôts** (3 goldens + 3 fixtures GUI + vitrine). Mécanique mais **facile à laisser à moitié faite**. | `vendor-check` rouge dans **deux** dépôts, blocage des lots suivants. | P7 ordonnée, commandes exactes, `SKILL_IDS`/`EXPECTED_COPIES` **inchangés** (78) ; **C14** chiffré ; arrêt si le frère est absent |
| **R8** | **Autonomie hors ligne du tarball.** Le canon n'est **pas** dans le paquet publié ; `_bundled/` est la seule self-suffisance. | `iakaframe init` sur une machine neuve **sans** `~/work/iakacharte` distribuerait **zéro** charte. | La forme distribuée est **commitée dans `iakaframe`** et `bundle.js` l'embarque (P6 étape 16) ; le repli § 7 pt 3-4 garantit une production même sans canon |
| **R9** | **Deux racines dans le cockpit** après P9 (chartes ← canon, vignettes ← iakagraph). | Un futur lecteur « corrige » l'incohérence apparente et casse les vignettes. | P9 étape 30 : commentaire d'en-tête expliquant **pourquoi** ; documenté dans `CHARTES.md` |
| **R10** | **`git filter-repo` absent**, ou historique d'iakagraph plus lourd que prévu. | Blocage en P2. | **Repli D5** décidé d'avance (seed + commit de provenance citant le sha) : **ne rouvre pas le cadrage** |
| **R11** | **Travail en cours sur `iakaArtists/docs/index.html`** (bascule 2 chartes). | Deux chantiers qui se marchent dessus sur le même fichier. | Hors périmètre **explicite** ; **C18** vérifie qu'il est inchangé ; les tokens du canon ne changent pas de valeur (D7 neutre) ⇒ l'alignement reste vrai |

---

## 14. Estimation (jalon P1→P2)

| Poste | j-h |
|---|---|
| Phase 0 (11 points, dont le relevé des 10 contrats de tokens) | 0,25 |
| P1-P2 — dépôt canon + Forgejo + seed `filter-repo` + `CONTRAT-TOKENS.md` | 0,40 |
| P3 — 4 assets orphelins + promotion D7 sur 10 chartes + **conformance Cinabre (Loki)** + recette visuelle 11 previews | 0,60 |
| P4 — `bin/iakacharte-sync` : 2 formes, `--check`, validation de contrat, `--json` | 0,75 |
| P5 — preuve d'équivalence (canon ↔ iakagraph ↔ cockpit) | 0,20 |
| P6 — forme distribuée sur 4 dépôts + `bundle.js` | 0,30 |
| P7 — skill + persona + 3 générateurs + vendor GUI + redéploiement | 0,45 |
| P8 — retrait des légataires (5 commits, confirmations, vérifs) | 0,20 |
| P9 — recâblage cockpit + ajout `cinabre-clair` | 0,15 |
| P10 — mémoires, doc, `superseded`, `iakaframe update` × N | 0,20 |
| **Total** | **≈ 3,5 j-h** |

**Complexité : moyenne.** Aucun algorithme : de la copie, de la concaténation, de la comparaison.
Le coût réel est le **nombre de dépôts** (canon + iakaframe + iakaFrameGUI + iakagraph +
iakaFreeVision + iakaIDE + iakacockpit = **7**) et l'**ordre** entre eux.

**Risque : moyen-haut**, concentré sur **R1** (perte d'assets), **R2** (dérive réintroduite par
`agents.js`) et **R7** (chaîne cross-dépôts). **Atténuation structurelle** : rien n'est supprimé
avant P8, et P5 **prouve l'équivalence avant tout recâblage**.

**Inconnues susceptibles de faire glisser** :

| Inconnue | Effet | Probabilité |
|---|---|---|
| Les 10 `tokens.css` **ne partagent pas** exactement la même liste (2 vérifiés sur 10 seulement) | invalide D7 et § 6.4 ⇒ **retour cadrage**, +0,5 j-h | moyenne — **inconnue principale** |
| `git filter-repo` indisponible | repli D5, −0,2 j-h (moins d'historique, moins de travail) | moyenne |
| `components.css` de Cinabre nécessite plus que 2 promotions (autres tokens propres) | +0,2 j-h par token promu | moyenne |
| Les 4 `naonedge.css` **ont divergé** (empreintes non recalculées au cadrage) | l'une porte du travail non promu ⇒ arbitrage Loki, +0,3 j-h | faible |
| Un 5ᵉ consommateur des chemins `theme/` non repéré | +0,3 j-h par consommateur | faible |

---

## 15. Points que SEUL le décideur tranche

1. **Le reframing des 148 Mo (D4).** Ma mesure dit que les 2 880 rendus **ne sont pas des chartes**
   mais le **produit d'iakagraph** (ComfyUI + `teams.json`), et qu'ils **ne doivent pas déménager**.
   Cela **s'écarte de la formulation** du besoin (« 2 926 fichiers changent de dépôt ») tout en
   servant son intention. *Reco Gandalf : **valider le reframing*** — il annule le risque principal
   (déplacement de masse) et rend la sortie des consommateurs **byte-identique**. Alternative : tout
   déménager, ce qui oblige à emmener `build_portraits_comfy.py`, `teams.json` et la dépendance
   ComfyUI dans un dépôt de chartes.
2. **La lecture de « copie de travail de Loki » (D10).** Je lis *working copy git du canon*. Si
   l'intention était **un atelier séparé** où Loki itère avant de promouvoir, il faut alors trancher
   **le sens du flux** entre atelier et canon, et j'ajoute un geste `--promote` (+0,4 j-h). *Reco :
   ma lecture* — `iakagraph/etudes/<projet>/` couvre déjà le besoin d'atelier, et un dossier à la
   fois source et cible est la fabrique à divergence silencieuse.
3. **`naonedge/light` reçoit-elle ses propres gabarits doc/flyer**, ou hérite-t-elle de `dark` (F4,
   P3 étape 6) ? **Connaissance de Loki**, pas déductible d'un nom de dossier.
4. **Le nom de famille de Cinabre** : `cinabre/clair` (reco — registre clair, symétrique de
   `studio/clair`) ou `cinabre/std` (symétrique de `cartoon/std`) ? Change l'id public
   (`cinabre-clair` vs `cinabre-std`) et donc `data-theme` dans iakacockpit.

> Tous les autres points (canon, structure `theme/<f>/<v>/`, `design-*/` en forme distribuée, pull +
> artefacts commités, outil unique dans le canon, conformance de Cinabre, promotion à 30 variables,
> ordre de résolution de Loki, orphelines conservées) sont **tranchés ici** et **ne se rouvrent pas**.

---

## 16. Journal de décision

- **2026-07-30** — Cadrage Gandalf de l'unification des réservoirs de chartes. **Arbitrages reçus du
  décideur, non rouverts** : canon `iakacharte`, Loki producteur, un script de resync.
  **Tranché ici** : structure canonique `theme/<famille>/<variante>/` — **parce que c'est déjà le
  contrat lu par deux consommateurs**, ce qui rend leur sortie byte-identique (D1/D2) ; `design-*/`
  **conservé comme forme distribuée générée**, la skill gardant son scan en dernier recours pour une
  non-régression par construction (D3, § 7) ; **les vignettes ne bougent pas** — ce sont des rendus
  produits par iakagraph, pas des chartes, donc « les 148 Mo » deviennent ~60 fichiers (D4) ;
  historique conservé par `git filter-repo` en deux passes, **avec repli décidé d'avance** (D5) ;
  **Cinabre admise par conformance** au contrat des 10, découpée tokens/composants, ses accents
  renommés sur le slot `--accent-gold` — dont le canon documente déjà qu'il est un **rôle** et non
  une couleur (D6, F6) ; **contrat étendu de 28 à 30 variables par promotion**, procédure déjà
  employée et commentée dans le canon, à rendu inchangé pour les 10 (D7) ; **resync en pull, artefacts
  générés commités, outil unique vivant dans le canon** (D8), en bash sans dépendance (D9) ; la
  **copie de travail de Loki est l'arbre git du canon** (D10) ; anti-divergence par en-tête +
  marqueur + `--check` mordant (D11) ; orphelines conservées (D12).
  **Découvertes de cadrage décisives** : le CLI **produit** la duplication (`agents.js:112-120`,
  écrasement muet) ; `iakacharte` **n'est pas un dépôt git** ; le réservoir iakagraph **n'est pas
  complet** (4 assets de marque n'existent que dans `design-naonedge/`) ; `naonedge.css` est un
  **ancêtre en retard de 4 tokens** ; deux porteurs de tokens supplémentaires non inventoriés
  (`iakaFrameGUI/src/themes/`, `naonedge-dashboard/assets/`) ; `sync-chartes.sh` **omet
  silencieusement** une variable manquante. Faits externes vérifiés le jour même (`filter-repo`
  recommandé vs `filter-branch` déconseillé ; git comme source de vérité + distribution par
  artefacts générés en pratique dominante) — § 3 avec sources. **Cadrage seul, aucun code de
  production, aucun fichier déplacé.**

> **Statut : cadré, non démarré.** L'exécution démarre après validation de Stéphane, selon P1..P10
> (§ 9), **Phase 0 en gate**, et **P8 (seule étape destructive) sous confirmation humaine explicite**.
