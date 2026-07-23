# Instruction — `vendor-check` au vert par le vrai canon : golden kit + famille workflow

> Phase P1 (cadrage). Rôle : `cadrage` (Gandalf). Lot **canon-side** de clôture de l'objectif
> « charger le frame dans le GUI ». Dépôt : `iakaframe` (canon), branche `main`.
> **Doctrine non négociable : GUI ← frame.** Le canon est autoritaire. On corrige la **garde** et le
> **golden** pour qu'ils reflètent le vrai canon — **jamais** l'inverse. Aucune copie GUI fidèle,
> aucun canon, n'est déformé par ce lot.

## 0. Contexte et déclencheur

À la clôture de l'étape 4 (côté GUI, mergée v0.1.3, gate Legolas PASS), `vendor-check` (garde de
parité cross-repo du CLI `iakaframe`) sort **drift:2**. Legolas a confirmé sur pièces : ce sont
**deux vices CÔTÉ CANON `iakaframe`**, pas des défauts du GUI. Le GUI est **byte-fidèle au canon**
sur les deux fixtures qui driftent :

- `packages/core/__tests__/fixtures/kit.iakaframe-claude.md` (GUI) == `kits/iakaframe-claude.md`
  (canon) — byte pour byte, corps « Manifeste… » compris ;
- `packages/core/__tests__/fixtures/workflow.iakaframe-3phases.md` (GUI) ==
  `library/workflows/iakaframe-3phases.md` (canon) — byte pour byte.

Ce lot ramène `vendor-check` au **vert (drift:0)** en corrigeant le canon (golden + garde), sans
toucher une seule fixture GUI ni un seul artefact canon fidèle, **et en gardant la garde mordante**.

---

## 1. Vice 1 — GOLDEN CLI DU KIT PÉRIMÉ

### 1.1 Établi sur pièces

| Artefact | Corps (après frontmatter) | Constat |
|---|---|---|
| **Canon** `kits/iakaframe-claude.md:9-16` | `# Kit iakaframe-claude` **+ paragraphe « Manifeste du livrable généré… » + ligne « Runner de référence au MVP… »** | corps riche, authored |
| **Fixture GUI** `.../fixtures/kit.iakaframe-claude.md:9-15` | idem canon, byte pour byte | **fidèle au canon** |
| **Golden CLI** `cli/test/fixtures/kit.iakaframe-claude.golden.md:18-19` | `# Kit iakaframe-claude` **et rien d'autre** (stub) | **périmé : corps absent** |

`vendor-check` compare la fixture GUI (avec corps) au **golden dépouillé de son en-tête**
(`stripHeader`, `cli/src/lib/vendor.js:198-207`, ligne golden `strip: true`,
`vendor.js:107-112`). Corps présent d'un côté, absent de l'autre →
**`contenu-different-vs-golden-depouille`**. Confirmé.

### 1.2 D'où vient le golden — et pourquoi il est stub

Il n'existe **aucun** script `gen-fixtures`/`generate` qui produise ce golden dans le dépôt CLI
(`cli/scripts/` ne contient que `gen-agents-golden.mjs` et `bundle.js`). Le golden est un fichier
**maintenu à la main**, verrouillé byte-à-byte contre la sortie de **`serializeKit`** par
`cli/test/parity-kit.test.js:25-30`.

Or `serializeKit` (`cli/src/lib/library.js:318-328`) code le corps **en dur** :
`buildDocument(fields, \`# Kit ${d.id}\n\`)` — un **stub**. Il **jette** tout corps authored. Le
golden reflète donc fidèlement ce stub : golden-stub == serializeKit-stub, `parity-kit` passe.

**Le côté GUI, lui, ne jette pas le corps.** `serializeKitMd(k, body = "")`
(`iakaFrameGUI/packages/core/src/frontmatter.ts:677`) **fait passer le corps à travers** ; son test
byte-parité (`kitMd.test.ts:37-41`) lui injecte le corps parsé de la fixture. La fixture GUI porte
donc le corps « Manifeste… » (vendoré depuis `kits/iakaframe-claude.md`).

**Racine du vice 1 : régression de parité CLI ↔ cœur.** Le sérialiseur du cœur (`serializeKitMd`)
thread le corps ; le sérialiseur CLI (`serializeKit`) l'a perdu et rend un stub. Le golden CLI a
figé ce stub. **Le vrai canon du corps du kit est authored dans `kits/iakaframe-claude.md`**, et le
GUI le reflète correctement. Le golden — et le sérialiseur CLI — sont les périmés.

> **Effet de bord latent, corrigé par ce lot :** `iakaframe assemble … --write --force` réécrit
> `kits/<id>.md` avec `serializeKit(res.descriptor)` (`cli/src/commands/assemble.js:59`) → il
> **écraserait le corps Manifeste par le stub**, détruisant le canon. Danger déjà signalé en
> commentaire (`cli/src/commands/vendor-check.js:26-27`). Le remède ci-dessous le neutralise.

### 1.3 Recoupement avec la dette connue « Remède kit du §4.5 inopérant »

Oui, ce chantier **recoupe** cette dette. Le §4.5 de `garde-vendor-check-cross-repo.md:245` prescrit,
pour re-vendorer la fixture kit, de **copier le golden dépouillé** (`kitEntry`,
`cli/src/commands/vendor-check.js:80-89`). Tant que le golden est **stub**, appliquer ce remède
**écraserait la fixture GUI correcte (avec corps) par le stub périmé** → il **propage le périmé**,
donc « inopérant ». En corrigeant le golden (1.4), le remède `kitEntry` redevient **opérant** :
copier le golden dépouillé == recopier le canon == no-op sur une fixture déjà fidèle. **Aucune
retouche de `kitEntry` n'est requise** ; il suffit de rendre le golden vrai.

### 1.4 Remède (vice 1)

**Principe : rétablir la parité CLI ↔ cœur — le corps du kit est une donnée authored threadée, pas
un stub généré — puis régénérer le golden depuis le canon.** En quatre gestes.

1. **`serializeKit` thread le corps** (`cli/src/lib/library.js:318-328`). Signature :
   `serializeKit(d, body = \`# Kit ${d.id}\n\`)`. Le corps par défaut reste le stub actuel (pas de
   régression sur un kit assemblé sans source) ; le corps passé explicitement est rendu tel quel via
   `buildDocument(fields, body)`. **Miroir exact** de `serializeKitMd(k, body = "")` du cœur.
   *Aucune autre ligne de `serializeKit` ne change — l'ordre des champs et le quoting restent
   identiques (le frontmatter du golden est déjà byte-correct, seul le corps manquait).*

2. **`assemble --write` préserve le corps authored** (`cli/src/commands/assemble.js:50-60`). Avant
   d'écrire `kits/<id>.md`, si la cible **existe déjà**, lire son corps
   (`parseFrontmatter(existant).body`) et le passer : `serializeKit(res.descriptor, corpsExistant)`.
   Cible absente → corps par défaut (stub). Ceci **neutralise le bug destructif du `--force`**
   (§ 1.2) et fait que `--write --force` sur `kits/iakaframe-claude.md` est un **no-op byte-exact**.

3. **Régénérer le golden depuis le canon** — `cli/test/fixtures/kit.iakaframe-claude.golden.md`.
   Le golden = **en-tête de provenance** (bloc `<!-- … -->`, conservé, actualisé : mentionner que le
   corps est désormais **threadé** depuis `kits/iakaframe-claude.md`, plus « stub ») **+ contenu
   verbatim de `kits/iakaframe-claude.md`** (frontmatter + corps Manifeste). Résultat attendu :
   `stripHeader(golden)` == contenu de `kits/iakaframe-claude.md` == fixture GUI, **byte pour byte**.
   *Régénération depuis le canon, jamais retapée à la main.* Comme il n'existe pas de script dédié,
   ce geste est manuel/scripté ponctuel ; il n'introduit pas de nouveau générateur permanent.

4. **`cli/test/parity-kit.test.js:25-30`** : le test lit désormais le corps du canon et le passe.
   Remplacer `serializeKit(res.descriptor)` par
   `serializeKit(res.descriptor, parseFrontmatter(lire('kits/iakaframe-claude.md')).body)`, puis
   assertion inchangée `=== expectedFromGolden()`. **Miroir exact** de `kitMd.test.ts:37-41` (le test
   cœur injecte déjà le corps parsé). La parité byte-à-byte serialiseur ↔ golden reste verrouillée,
   et le second test (`emitsForNode`) est intact.

### 1.5 Conséquence FORCÉE sur A21 — reframe, pas neutralisation

Le test **A21** (`cli/test/vendor-check.test.js:199-210`) affirme aujourd'hui que la référence du
kit est le golden dépouillé, **jamais** `kits/iakaframe-claude.md`, en prouvant que pointer la
fixture sur `kits/` la rend **rouge** (« les deux ne sont PAS en relation d'égalité »).

**Cette assertion devient mathématiquement fausse après le remède, et c'est inévitable — pas un
choix.** On a établi sur pièces : fixture GUI == `kits/iakaframe-claude.md` (byte). Le vert exige
golden-dépouillé == fixture GUI. Donc golden-dépouillé == `kits/iakaframe-claude.md`. La prémisse
d'A21 (« golden ≠ kits/ ») ne peut **pas** coexister avec le vert. A21 encode l'**ancien état
périmé** (golden stub ≠ canon riche).

**Reframe obligatoire d'A21 (garde toujours mordante) :**
- Conserver l'ancrage : la référence de vendorage du kit **reste le golden dépouillé** (via
  `fixtureTable`, `strip: true`) — le golden demeure l'ancre de parité cœur↔CLI.
- Documenter le nouvel invariant : golden-dépouillé == `kits/iakaframe-claude.md` **parce que le
  sérialiseur thread désormais le corps authored**. Pointer la fixture sur `kits/` est donc
  **vert** (cohérent), non plus rouge.
- **Garder la morsure** par une assertion qui reste vraie et discriminante : une **altération d'un
  octet** du golden **ou** de la fixture kit → **rouge** (`family === 'kit'`,
  `contenu-different-vs-golden-depouille`). C'est déjà couvert par les scénarios `kit` de
  `C-3`/`C-5` (`vendor-check.test.js:383,434`) ; A21 reformulé doit vérifier explicitement ce
  rouge-sur-drift, pas l'égalité fortuite avec `kits/`.

> Ce reframe **ne fait pas taire** la garde : il remplace une assertion devenue fausse par la
> propriété mordante qu'elle était censée protéger (drift kit → rouge). Neutraliser = supprimer A21
> sans remplacement ; c'est **interdit**.

---

## 2. Vice 2 — `fixtureTable()` IGNORE LA FAMILLE WORKFLOW

### 2.1 Établi sur pièces

`fixtureTable()` (`cli/src/lib/vendor.js:76-114`) énumère **21 fixtures** : 8 personas + 8 goldens +
1 binding (`kind:'copy'`) + méthode + méthode-wrapped + team + kit (`kind:'derived'`). **Aucune
ligne `workflow`.**

Inventaire réel du dossier scanné `packages/core/__tests__/fixtures/` (GUI) : **22 fichiers `.md`**
(scan Glob). Les 21 attendus **+** `workflow.iakaframe-3phases.md`. Ce 22ᵉ fichier, non attendu par
la table, tombe dans le filet surnuméraire (`vendor.js:228-237`) → **`fixture-surnumeraire`** à
tort. La fixture est une **copie conforme** du canon `library/workflows/iakaframe-3phases.md`
(ajoutée à l'étape 3bis), byte-fidèle (établi : GUI `workflow.iakaframe-3phases.md` == canon
`library/workflows/iakaframe-3phases.md`).

### 2.2 Aucune autre famille ne manque — tranché sur pièces

Croisement des 22 fixtures GUI avec `fixtureTable` :

- 8 personas, 8 goldens, 1 binding, méthode, méthode-wrapped, **team**, kit → **couverts** (21).
- `team.iakaframe-8.md` est **dans** le dossier scanné (`.../fixtures/team.iakaframe-8.md`) **et**
  couvert (`fixtureTable`, famille `team`, `vendor.js:104-106`). **Pas de fixture team hors-scan** :
  la mention d'une « team co-localisée hors dossier scanné » est **infirmée sur pièces**.
- Seul **`workflow.iakaframe-3phases.md`** manque à la table.

**Conclusion : une seule famille à ajouter — `workflow`.** Rien d'autre.

### 2.3 Remède (vice 2)

1. **Ajouter la ligne workflow** dans `fixtureTable()` (`cli/src/lib/vendor.js`), famille de
   **copie byte-à-byte** (comme personas/binding — le corps n'est pas exempté, c'est une copie
   conforme, pas une dérivée sérialisée) :
   ```
   rows.push({
     family: 'workflow', kind: 'copy',
     fixture: 'workflow.iakaframe-3phases.md',
     source: path.join('library', 'workflows', 'iakaframe-3phases.md'),
   });
   ```
2. **Bumper l'inventaire attendu** : `EXPECTED_COPIES` **17 → 18** (`vendor.js:30`) ; commentaire
   `vendor.js:15` « 17 COPIES (8 personas + 8 goldens + 1 binding) » → « 18 COPIES (… + 1 workflow) » ;
   commentaire `vendor.js:73` « Table des 21 fixtures » → « 22 fixtures ». L'invariant
   `ok ⇒ checked == EXPECTED_COPIES` (`vendor.js:266`) reste **exact**, jamais un minimum.
3. **Remédiation** : la famille `workflow` en `kind:'copy'` émet `contenu-different` /
   `fixture-manquante`, déjà couvertes par `entriesForReason` (branche `copy` → `copyEntry`,
   `vendor-check.js:116-126`). **Aucune entrée nouvelle requise.** Ajouter `'workflow'` à la liste
   `familles` de **C-7** (`vendor-check.test.js:510`) pour l'exhaustivité raison × famille.
4. **Harnais de test** `cli/test/vendor-check.test.js` :
   - `makeCleanMirror()` (`:39-64`) : copier `library/workflows/iakaframe-3phases.md` →
     `fx/workflow.iakaframe-3phases.md` (le miroir conforme doit contenir les 18 copies) ;
   - **A2** (`:69-77`) : `assert.equal(res.checked, 18)` (au lieu de 17) ;
   - **A7** (`:165-172`) : `assert.equal(res.checked, 17)` (18 − 1 fixture supprimée, au lieu de 16) ;
   - **A19** (`:174`) : commentaire « checked == 17 » → « 18 » (l'assertion porte sur `derived`,
     inchangée).

---

## 3. Critères d'acceptation (testables)

> Exécution depuis la racine `iakaframe`, dépôt frère GUI présent à côté (`../iakaFrameGUI`).

| # | Critère | Vérification |
|---|---|---|
| **AC-1 — CENTRAL** | `vendor-check` sort **drift:0 / vert** sur le vrai vendorage | `node cli/src/index.js vendor-check --json` → `ok:true`, `status:"clean"`, `drift:0`, `checked:18`, `derived:4`, exit 0 |
| **AC-2** | Suite CLIvendor verte, garde toujours mordante | `node --test cli/test/vendor-check.test.js` : tous verts, A21 reformulé passe, C-3/C-5 kit passent |
| **AC-3** | Parité sérialiseur ↔ golden préservée | `node --test cli/test/parity-kit.test.js` : les 2 tests verts (serializeKit threadé == golden dépouillé) |
| **AC-4** | Suite CLI complète non régressée | `node --test cli/test/` : 0 échec (baseline v0.6.1 = 476) — **aucun** test dépendant du golden ou de `serializeKit` cassé |
| **AC-5** | Golden = canon, byte pour byte | `stripHeader(kit.iakaframe-claude.golden.md)` == contenu de `kits/iakaframe-claude.md` == fixture GUI kit |
| **AC-6** | Aucune fixture GUI ni canon déformé | `git -C ../iakaFrameGUI status --porcelain` inchangé après exécution ; `kits/iakaframe-claude.md`, `library/workflows/iakaframe-3phases.md` **non modifiés** par le lot (`git diff` = 0 sur ces deux) |
| **AC-7** | `--force` non destructif | `iakaframe assemble iakaframe iakaframe-8 --write --force` sur `kits/iakaframe-claude.md` → fichier **byte-inchangé** (`git diff` = 0) |

**Garde mordante — non-régression explicite (borne l'anti-pattern « faire taire ») :**
- altérer 1 octet du golden kit → `vendor-check` **rouge** (`contenu-different-vs-golden-depouille`) ;
- altérer 1 octet de la fixture workflow → **rouge** (`contenu-different`, famille `workflow`) ;
- supprimer la fixture workflow → **rouge** (`fixture-manquante`), `checked:17`.

---

## 4. Périmètre — fichiers touchés (récap)

**Écrits par le lot (code, Gimli) :**
- `cli/src/lib/library.js` — `serializeKit` gagne le paramètre `body` (parité cœur).
- `cli/src/lib/vendor.js` — ligne `workflow` dans `fixtureTable`, `EXPECTED_COPIES` 17→18, commentaires.
- `cli/src/commands/assemble.js` — `--write` thread le corps existant (anti-`--force` destructif).
- `cli/test/fixtures/kit.iakaframe-claude.golden.md` — régénéré depuis le canon (corps ajouté).
- `cli/test/parity-kit.test.js` — passe le corps canon à `serializeKit`.
- `cli/test/vendor-check.test.js` — A21 reformulé, `makeCleanMirror` + workflow, comptes 17→18 / 16→17, C-7 famille.

**Interdits (lecture seule / hors lot) :** toute fixture sous `../iakaFrameGUI/…` ; le canon
`kits/iakaframe-claude.md` ; le canon `library/workflows/iakaframe-3phases.md` ; toute autre
persona/binding/méthode/team.

**À remonter (hors code, sync doc → 📖 Nathalie) :** `docs/commandes.md:165` fige « les 17 copies
(8 goldens + 8 personas + 1 binding) » → devient « 18 copies (… + 1 workflow) ». Sync
documentaire, **hors périmètre code de ce lot** (Gandalf ne documente pas ; Gimli n'écrit pas la
doc utilisateur).

---

## 5. Estimation dev (Gimli)

| Poste | Charge | Note |
|---|---|---|
| Vice 2 (famille workflow : 1 ligne table + comptes + harnais) | **0,2 j-h** | mécanique, patron `copy` existant |
| Vice 1 — `serializeKit` threadé + `assemble --write` corps | 0,25 j-h | miroir de `serializeKitMd`, petit |
| Vice 1 — régénération golden depuis canon | 0,05 j-h | copie header + canon, vérifiée par AC-3/AC-5 |
| Vice 1 — reframe A21 (garde mordante) + `parity-kit` | 0,2 j-h | le vrai point de soin (doctrine) |
| Recette AC-1…AC-7 + morsure + suite complète | 0,15 j-h | commandes fournies |
| **Total** | **~0,85 j-h** (≈ 1 j-h) | spec fermée |

**Complexité / risque : FAIBLE-MODÉRÉ.** Le code est petit et localisé ; le risque est
**doctrinal**, concentré sur le reframe d'A21 — ne pas neutraliser la garde en la faisant taire.

**Inconnues susceptibles de faire glisser :**
1. **Un test CLI non identifié** dépendant du corps stub du golden ou de `serializeKit` (au-delà de
   `parity-kit`) → borné par AC-4 (suite complète). Faible : `serializeKit` n'a qu'un caller.
2. **Byte-identité résiduelle** fixture GUI ↔ canon (kit ou workflow) : si un octet diffère
   (newline final), AC-1 le révélerait ; ce serait alors un **défaut GUI** contredisant le mandat →
   **remonter, ne pas corriger côté canon**. Legolas a confirmé la fidélité ; risque résiduel faible.
3. **Ratification du reframe A21** par le décideur (gate P1→P2 humain) : le changement de doctrine
   de vendorage du kit (golden == canon désormais) est **forcé** par la fidélité GUI, mais mérite un
   feu vert conscient.

---

## 6. Point remonté à l'arbitrage (gate humain P1→P2)

Le remède du vice 1 **dépasse « golden + garde »** au sens strict : il touche le **sérialiseur de
production** (`serializeKit`) et **inverse l'assertion A21**. Ce n'est pas discrétionnaire — c'est
la **conséquence forcée** de la doctrine GUI ← frame (fixture GUI fidèle au canon `kits/`,
non déformable) combinée à l'exigence « ne pas casser `parity-kit` ». Deux voies avaient été pesées :

- **Voie retenue (Option A) :** `serializeKit` thread le corps (parité cœur restaurée) + golden
  régénéré + A21 reformulé. Corrige la **racine** (régression de parité) et neutralise le bug
  `--force` destructif.
- **Voie écartée (Option C) :** garder `serializeKit` stub, découpler `parity-kit` du corps. Laisse
  la régression de parité et le bug `--force` en place ; affaiblit l'ancre byte-à-byte. **Non
  recommandée.**

Décision demandée au décideur : **ratifier l'Option A** (incluant le reframe A21). Le reste du lot
(famille workflow) est sans enjeu doctrinal.
