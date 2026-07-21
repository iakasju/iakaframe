# Le remède de `vendor-check` doit être dérivé de l'état observé

> **Lot** : Q-2 de D-9. **Phase** : P1 (cadrage) → P2 (dev).
> **Amende** : `specs/instructions/garde-vendor-check-cross-repo.md` § 4.4 et A14/A24 — dont la
> doctrine des « DEUX gestes » et la commande de remède du kit sont **infirmées ici sur pièces**.
> **N'entre pas en collision** avec `specs/instructions/verdict-de-gate-opposable.md` (Q-3 de D-8) :
> aucun fichier commun. Ce lot ne touche ni `library/principles/` ni `library/skills/`.

## 0. Outillage du cadreur — déclaration

Ce cadrage a été produit **sans `Bash`**. Outils disponibles : `Read`, `Grep`, `Glob`, `Write`,
`Edit`, `WebSearch`, `WebFetch`. Conséquences, assumées et déclarées :

- **Aucune commande n'a été exécutée.** Les comportements décrits ci-dessous sont établis par
  **lecture du code**, pas par observation d'une sortie. Chaque affirmation porte sa référence
  `chemin:ligne` ; toute conclusion est rejouable par qui dispose de `Bash`.
- **Un fait du brief n'a pas pu être vérifié** : « corps de `kits/iakaframe-claude.md` dernier
  touché le 2026-07-15 par `42818e7` » relève de `git log`. Il est **repris sans confirmation** et
  n'est **charge d'aucun critère** de ce lot.
- Les **inventaires de fichiers** (personas, goldens, fixtures du dépôt frère) ont été établis par
  `Glob`, qui est une mesure réelle, non une supposition.

**Web.** Un seul fait de ce lot dépend d'un référentiel externe : la portabilité du verbe `cp`
prescrit à l'opérateur. Vérifié : `cp` est un **alias PowerShell de `Copy-Item`**, et la
combinaison **joker + destination inexistante** y a un comportement piégeux (le type de la
destination est décidé par le premier élément découvert ; plusieurs fichiers peuvent s'écraser
l'un l'autre en une seule cible). Cela **renforce** la recommandation de copie **nommée, à
destination explicite** (§ 3.2). Aucune autre décision de ce lot ne dépend d'un fait externe :
tout le reste est interne au dépôt. Sources en fin de document.

---

## 1. Le problème, posé avant toute solution

`vendor-check` est un **outil de diagnostic**. Il fait autorité : l'opérateur — humain ou agent —
qui lit « voici le remède » l'applique. Or `cli/src/commands/vendor-check.js:20-28` expose **deux
listes statiques**, imprimées **à l'identique quelle que soit la dérive constatée**
(`cli/src/commands/vendor-check.js:60-65`, dans la branche `DERIVE` de `humanReport`).

Le défaut n'est pas « deux lignes fausses ». Il est **structurel** : le remède est produit **sans
regarder ce que la mesure vient de dire**. La commande mesure finement (elle sait, par fixture, la
famille, la nature et la raison exacte — `cli/src/lib/vendor.js:163-173`), puis **jette cette
information** au moment de conseiller. C'est la même famille que D-7 (perte silencieuse) et D-8
(verdict non sourcé) : **quelque chose qui affiche une certitude qu'il n'a pas mesurée.**

Un outil de diagnostic qui imprime un remède fautif est **pire qu'un outil muet** : le muet fait
chercher, celui-là fait obéir.

## 2. Ce qui est mesuré (état des lieux sur pièces)

### 2.1 Le glob des personas fabrique la panne suivante — **CONFIRMÉ**

`cli/src/commands/vendor-check.js:22` prescrit :

    cp library/personas/*.md   <GUI>/packages/core/__tests__/fixtures/personas/

Mesure `Glob` sur `library/personas/*.md` → **9 fichiers** : les 8 personas **plus
`library/personas/_TEMPLATE.md`**. Mesure `Glob` sur le miroir → le dossier
`packages/core/__tests__/fixtures/personas/` du dépôt frère contient **exactement 8** fichiers.

`_TEMPLATE.md` n'est pas dans la table des fixtures (`cli/src/lib/vendor.js:76-114`) ; il tombe donc
dans la détection de surnuméraire (`cli/src/lib/vendor.js:228-237`) et produit
`fixture-surnumeraire`, donc `ok:false`, donc `exit 1`
(`cli/src/commands/vendor-check.js:96`). **Le remède fabrique la panne suivante.** Confirmé.

### 2.2 `assemble --write` : bien plus grave qu'« inutile » — **CONFIRMÉ ET AGGRAVÉ**

`cli/src/commands/vendor-check.js:27` prescrit `iakaframe assemble iakaframe iakaframe-8 --write`.

Le brief le qualifie d'« inutile parce que la fixture kit était déjà conforme » — c'est-à-dire
**inutile par contingence**. La lecture du code établit plus fort : **il est inutile par
construction, et le restera dans tous les états du monde.**

- `assemble --write` écrit **`kits/<id>.md`** — `cli/src/commands/assemble.js:51,59`.
- La fixture kit se compare au **golden CLI dépouillé de son en-tête**, source
  `cli/test/fixtures/kit.iakaframe-claude.golden.md` — `cli/src/lib/vendor.js:107-112`.
- **`kits/iakaframe-claude.md` n'apparaît dans aucune ligne de la table des fixtures.**
  `vendor-check` **ne lit jamais ce fichier**. L'écrire ne peut donc **jamais** modifier le verdict.
- Ce n'est pas une lecture incidente : le test **A21** (`cli/test/vendor-check.test.js:198-209`)
  **prouve délibérément** que `kits/iakaframe-claude.md` n'est **jamais** la référence du kit — y
  pointer la fixture rend la garde **rouge**. Le code prescrit donc à l'opérateur d'aller écrire
  précisément le fichier que sa propre suite de tests désigne comme hors-référence.

**Et le geste est destructeur.** `serializeKit` (`cli/src/lib/library.js:318-327`) rend un corps
réduit à `# Kit iakaframe-claude\n`. Le fichier réel (`kits/iakaframe-claude.md:9-15`) porte un
manifeste rédigé à la main. Avec `--force`, le frontmatter — identique par ailleurs — survivrait,
et **le corps rédigé serait remplacé par le stub**. Régression silencieuse dans le canon, au prix
d'un geste qui **ne pouvait rien réparer**.

### 2.3 Découverte non prévue au brief : **le kit n'a aucun remède correct, nulle part**

`cli/src/commands/vendor-check.js:63-64` annonce « les **4** DÉRIVÉES (methode, methode wrapped,
team, kit) → RÉGÉNÉRATION PAR LE SÉRIALISEUR ». Or le script prescrit,
`iakaFrameGUI/packages/core/scripts/gen-fixtures.mjs`, ne traite que **3** cibles
(`:108-124`) et **écrit noir sur blanc** (`:148-149`) :

> `Rappel : le kit (kit.iakaframe-claude.md) ne passe PAS par ce script, et les 17 copies se
> re-vendorent par cp.`

Donc : le script exclut le kit, et la commande censée le couvrir vise un fichier jamais lu. **Une
dérive de la fixture kit n'a aujourd'hui aucun geste de réparation juste dans tout le dispositif.**
Ce n'est pas une ligne fausse à corriger, c'est un **trou à combler** — cf. § 3.3.

### 2.4 Deuxième instance du même défaut, dans la même commande — non repérée au brief

La garde a un **niveau 2** (`cli/src/lib/vendor.js:239-263`) qui compare le golden vendoré au
contrat **régénéré depuis le canon vivant**, et émet `niveau2-contrat-vivant-different`. Cette
dérive signifie que **le golden CLI lui-même est périmé** par rapport au canon.

Le seul geste imprimé pour la famille `goldens` est `cp cli/test/fixtures/agents-golden/*.md …`
(`cli/src/commands/vendor-check.js:21`). **Copier un golden périmé ne peut pas éteindre le
niveau 2** : on propagerait le périmé dans le miroir. Le geste juste est d'abord
`node cli/scripts/gen-agents-golden.mjs` (script présent, vérifié), **puis** la copie — c'est
d'ailleurs exactement ce que prescrit l'en-tête des goldens eux-mêmes, cité dans
`cli/test/vendor-check.test.js:131`. Le remède imprimé **ignore cette étape**.

Même cause que § 2.1 et § 2.2 : le remède est indexé sur la **famille**, jamais sur la **raison**.

### 2.5 Le défaut est **verrouillé par un test** — contrainte forte de périmètre

`cli/test/vendor-check.test.js:268` :

    assert.match(out, /iakaframe assemble iakaframe iakaframe-8 --write/, 'commande du kit absente');

Le test **A14 exige la présence de la commande fautive**. Le lot ne peut donc pas se contenter de
corriger le code : il **doit** amender ce test, et l'amendement doit **préserver l'invariant réel**
qu'A14 protégeait (§ 3.4).

### 2.6 Les autres commandes : **mesuré, et négatif**

Le brief demande de mesurer, pas de supposer. Recherche des remèdes imprimés sur l'ensemble de
`cli/src/commands/` (motifs `REMEDIATION|remède|relancer|exécutez`, et impressions contenant une
commande `iakaframe|node|npm|cp|git`) → 28 fichiers balayés. Résultat :

| Commande | Conseil imprimé | Dérivé de l'état ? | Verdict |
|---|---|---|---|
| `vendor-check.js:20-28` | 2 listes constantes | **Non** — imprimées à l'identique | **Défaut** |
| `agents.js:89-91` (`--check`) | « Régénérer via `agents generate` » | **Oui** — branche sur `drift`, et `agents generate` est bien le geste qui écrit ces fichiers (`:81`) | Conforme |
| `review.js:143-152` | messages de refus | **Oui** — `switch` sur `r.reason` mesuré | Conforme |
| `remove.js:53` | « détache d'abord : … » | **Oui** — conditionné à `kind === 'skill'`, id interpolé | Conforme |
| `switch.js:100` | commande de rollback | **Oui** — conditionné à `backup`, chemin interpolé | Conforme |
| `init.js:54`, `onboard.js:99,167` | prochaines étapes | Sans objet — narration de fin, pas un remède à une dérive constatée | Hors sujet |

**Conclusion : `vendor-check` est le seul porteur du défaut.** Le périmètre du lot **se referme sur
un seul fichier de production**. C'est une mesure, et elle **réduit** le périmètre — pas une
hypothèse commode.

---

## 3. Périmètre fermé

### 3.1 Le remède devient une **donnée dérivée**, non un texte constant — **RETENU**

Le brief demande d'arbitrer : dérivé de l'état, ou statique corrigé ? **Dérivé.** Motif : les trois
défauts (§ 2.1, § 2.2, § 2.4) sont **trois symptômes d'une seule cause**. Corriger les chaînes
laisserait la cause en place, et le prochain ajout de fixture la ferait ressortir. L'élargissement
est **contenu** : toute l'information nécessaire est **déjà** produite par `checkVendor`.

`checkVendor` rend, par fixture en dérive : `family`, `kind`, `source`, et une liste de `reasons`
(`cli/src/lib/vendor.js:163-173`). Le lot ajoute une fonction **pure**, sans E/S :

    remediationFor(res) -> Array<{ action, reason, fixture, source?, dest?, command, note? }>

`action ∈ { 'copy', 'delete', 'run', 'investigate' }`. Table de dérivation **exhaustive** — toutes
les raisons émises par `cli/src/lib/vendor.js` y figurent, aucune n'est laissée sans geste :

| `reason` émise | Famille | `action` | Geste |
|---|---|---|---|
| `contenu-different` | personas, binding | `copy` | copie **nommée** `<source>` → `<fixture>` |
| `contenu-different` | goldens | `copy` | copie **nommée** du golden concerné |
| `niveau2-contrat-vivant-different` | goldens | `run` **puis** `copy` | `node cli/scripts/gen-agents-golden.mjs`, **puis** copie du golden (§ 2.4) |
| `frontmatter-different` | methode, methode-wrapped, team | `run` | `node packages/core/scripts/gen-fixtures.mjs` (depuis `<GUI>`) — **jamais** `cp` |
| `contenu-different-vs-golden-depouille` | kit | `copy` | golden **dépouillé** → fixture (§ 3.3) |
| `fixture-manquante` | toutes | idem sa famille | le geste de sa famille |
| `fixture-surnumeraire` | — | `delete` | supprimer le fichier — **aucune copie** |
| `source-introuvable` | toutes | `investigate` | anomalie **côté `iakaframe`**, pas côté miroir : aucun geste de copie ne s'applique |
| `en-tete-golden-illisible` | kit | `investigate` | golden corrompu côté `iakaframe` |
| `golden-vendore-sans-frontmatter` | goldens | `copy` | re-copie du golden (le vendoré a perdu son en-tête) |
| `niveau2-injouable` | — | `investigate` | canon illisible : le détail porté par `reasons[].detail` est restitué |

**Invariant, à tenir explicitement** : aucune ligne ne peut produire `action: 'copy'` pour une
dérivée `mode: 'frontmatter'` (methode, methode-wrapped, team). C'est le fond de ce que le
commentaire `cli/src/commands/vendor-check.js:17-19` protégeait, et il reste vrai.

**Conséquence pour l'opérateur** : sur une dérive d'une persona, il ne lit plus 5 lignes dont 3 hors
sujet et 1 nuisible ; il lit **le geste qui répare ce qui est cassé**.

### 3.2 Copies **nommées**, jamais de joker — **RETENU**

Le joker des personas est prouvé faux (§ 2.1). Celui des goldens est **exact aujourd'hui** (8
attendus, 8 présents — mesuré) mais **fragile par nature** : tout `.md` ajouté un jour dans
`cli/test/fixtures/agents-golden/` le casserait **de la même façon**, et par le même mécanisme.
Corriger l'un en laissant l'autre, ce serait traiter le symptôme mesuré et laisser la mine armée.

La copie nommée ne coûte rien : `fixtureTable()` (`cli/src/lib/vendor.js:76-114`) connaît **déjà**
`source` et `fixture` pour chaque ligne. La destination devient **explicite** (fichier, pas
dossier), ce qui neutralise en outre le piège `Copy-Item` relevé au § 0.

**Corollaire** : le nombre de lignes imprimées est **proportionnel à la dérive**, non à
l'inventaire. Trois personas dérivées → trois lignes. Zéro dérive sur les goldens → **aucune ligne**
sur les goldens.

### 3.3 `assemble --write` : **retirée**, et remplacée — **RETENU**

Le brief laisse le choix entre retirer et conditionner. **Retirer.** La conditionner supposerait
qu'elle soit juste dans *au moins un* cas ; § 2.2 établit qu'elle n'en a **aucun** : elle vise un
fichier que la garde ne lit jamais. La conditionner ne ferait qu'**imprimer moins souvent un geste
toujours faux** — et toujours destructeur quand il serait imprimé.

Elle est remplacée par le geste **réellement** réparateur, qui comble le trou du § 2.3 :

    copie de  cli/test/fixtures/kit.iakaframe-claude.golden.md  DÉPOUILLÉ de son en-tête
    vers      <GUI>/packages/core/__tests__/fixtures/kit.iakaframe-claude.md

C'est, littéralement, la relation d'égalité que `checkVendor` évalue (`cli/src/lib/vendor.js:198-207`,
via `stripHeader`) et que le miroir de test construit (`cli/test/vendor-check.test.js:59-60`).

**Le dépouillement interdit un `cp` nu** : ce n'est pas une copie de fichier, c'est une copie de
*contenu utile*. Le remède doit donc porter, pour cette ligne seule, une **note explicite** disant
que l'en-tête `<!-- … -->` doit être retiré — sans quoi on retomberait, une fois de plus, sur un
geste qui fabrique sa propre panne. **Point d'attention pour l'implémentation.**

*Note de portée, hors périmètre* : si le golden lui-même diverge de `assemble`, ce n'est **pas**
`vendor-check` qui le dit — c'est `cli/test/parity-kit.test.js:25-30`. Séparation saine ; on ne la
touche pas.

### 3.4 Amendement du test A14 — **RETENU, périmètre le plus délicat**

A14 (`cli/test/vendor-check.test.js:256-269`) doit être amendé, puisqu'il exige la chaîne fautive.
**Il ne doit pas être affaibli** : ce qu'il protégeait vraiment reste vrai et doit rester testé.

- **Conservé** — jamais de `cp` prescrit sur une dérivée `frontmatter` ; la commande
  `gen-fixtures.mjs` reste nommée **quand une telle dérivée est en cause**.
- **Retiré** — l'exigence de `iakaframe assemble … --write` (§ 2.2).
- **Ajouté** — le remède ne contient **que** les gestes des dérives constatées (§ 4, C-3).

La doctrine « DEUX gestes » cède la place à « **un geste par dérive constatée** ». Le nombre 2 était
déjà faux à la lecture : le dispositif compte quatre natures de gestes (copie, régénération de
dérivée, régénération de golden **puis** copie, suppression d'un surnuméraire).

### 3.5 Remède dans la sortie `--json` — **RECOMMANDÉ, arbitrage au décideur** (§ 6, A-1)

Aujourd'hui `--json` ne porte **aucun** remède : un agent qui consomme la sortie machine n'a
**rien**, et l'humain a du faux. Une fois `remediationFor()` écrite, l'exposer en
`payload.remediation` coûte une ligne — et c'est ce qui rend le **critère de bouclage** (C-5)
mécanisable sans passer par un `spawn` de shell.

Ajout **purement additif** : aucune clé existante n'est modifiée, `ok` reste en première clé (C-JSON,
`cli/test/vendor-check.test.js:253`).

### 3.6 Hors périmètre — explicitement

- **`cli/src/lib/vendor.js`** — la **mesure** est juste ; seule la **restitution** est fautive. Ne
  pas y toucher, sauf pour exposer une donnée déjà calculée si l'implémentation le requiert.
- **`kits/iakaframe-claude.md`** — n'est modifié par rien ici. Ce lot **empêche** sa destruction ;
  il ne le réécrit pas.
- **`library/principles/`, `library/skills/iakaframe-qualite/`** — couverts par
  `specs/instructions/verdict-de-gate-opposable.md`. **Deux écrivains sur un fichier : jamais.**
- **`cli/test/fixtures/agents-golden/*.md`** — **vendorés**. Intouchés (§ 5).
- La **généralisation** du principe « un conseil s'infère de la mesure » aux autres commandes :
  sans objet, § 2.6 mesure qu'aucune autre n'est concernée.

---

## 4. Critères d'acceptation

Vérifiables, numérotés, cas nominal **et** cas de défaut. `<GUI>` = racine du dépôt frère.

**Correction du remède**

- **C-1** — Sur un miroir **conforme**, `vendor-check` reste `ok:true`, `exit 0`, et **n'imprime
  aucun remède**. *(Non-régression : A2, `cli/test/vendor-check.test.js:68`.)*
- **C-2** — Sur un miroir où **une seule persona** est altérée, le remède imprimé contient
  **exactement une** ligne de copie, nommant **cette persona**. Il **ne contient ni**
  `_TEMPLATE.md`, **ni** de joker `*`, **ni** de ligne concernant les goldens, le binding, les
  dérivées ou le kit.
- **C-3** — *(cas de défaut, cœur du lot)* Pour **toute** dérive injectée, la sortie ne contient
  **jamais** la chaîne `iakaframe assemble` **ni** le caractère `*` dans une ligne de copie.
- **C-4** — Sur une dérive de `frontmatter` d'une dérivée (`team.iakaframe-8.md`), le remède
  prescrit `gen-fixtures.mjs` et **aucun `copy`** ciblant cette fixture. *(Invariant historique
  d'A14, § 3.4.)*

**Bouclage — le critère décisif**

- **C-5** — *(cas de défaut évident du brief : appliquer le remède doit mener à `clean`)* Pour
  **chacun** des scénarios ci-dessous, pris isolément : construire un miroir, injecter la dérive,
  lancer `vendor-check`, **appliquer mécaniquement** les entrées `action ∈ {copy, delete}` du remède
  produit (via `fs`, **sans shell**), relancer `vendor-check` → **`ok:true`, `drift: 0`,
  `exit 0`**.
  1. une persona altérée ; 2. le binding altéré ; 3. un golden altéré ; 4. une fixture **supprimée** ;
  5. une fixture **surnuméraire** ajoutée (le cas `_TEMPLATE.md` de § 2.1, celui qui a fabriqué la
     panne) ; 6. la fixture **kit** altérée (§ 3.3 — le trou du § 2.3, avec dépouillement de
     l'en-tête) ; 7. **combinaison** de 1 + 3 + 5 en une seule passe.
  **Un remède qui laisse une dérive, ou qui en crée une nouvelle, fait échouer ce critère.** C'est
  précisément ce qu'aurait attrapé le défaut d'origine.
- **C-6** — Les entrées `action: 'run'` **ne sont pas exécutées** par les tests (elles supposent le
  dépôt frère ou une régénération du canon) : elles sont vérifiées **structurellement** — commande
  exacte attendue, présence du script cible sur disque. **Limite déclarée, non contournée**
  (§ 7, I-2).

**Exhaustivité et non-régression**

- **C-7** — Toute `reason` émise par `cli/src/lib/vendor.js` produit **au moins une** entrée de
  remède : aucune dérive ne laisse l'opérateur sans geste. Test d'exhaustivité **piloté par la liste
  des raisons**, de sorte qu'une raison **ajoutée plus tard sans remède** fasse **rougir la suite**.
- **C-8** — La suite `cli/test/` passe **intégralement**, y compris A21
  (`cli/test/vendor-check.test.js:198`) et la garde de **non-mutation** du dépôt frère réel
  (`:271-280`). **`vendor-check` reste strictement en lecture seule.**
- **C-9** — `--json` : `ok` demeure la **première clé** ; aucune clé existante n'est renommée ni
  supprimée. Si A-1 est retenue, `remediation` s'ajoute ; sinon la dérivation reste interne.
- **C-10** — *(vendorage, § 5)* Après le lot, `iakaframe vendor-check --strict` contre le **vrai**
  dépôt frère rend **le même verdict qu'avant** le lot. Aucun re-vendorage n'est requis, et le
  constat doit être **mesuré**, pas supposé.

---

## 5. Impact vendorage — **nul, et c'est vérifié**

Le brief alerte : `cli/test/fixtures/agents-golden/*.md` est vendoré vers `iakaFrameGUI`, et la
dette vient d'être payée par D-9. Mesure :

| Fichier touché par ce lot | Vendoré ? | Preuve |
|---|---|---|
| `cli/src/commands/vendor-check.js` | **Non** | absent de `fixtureTable()`, `cli/src/lib/vendor.js:76-114` |
| `cli/test/vendor-check.test.js` | **Non** | idem — c'est la **suite** de la garde, pas une fixture |

Les 21 fixtures vendorées sont : 8 personas, 8 goldens, 1 binding, 4 dérivées
(`cli/src/lib/vendor.js:30-31, 76-114`). **Aucun fichier de ce lot n'en fait partie.** Le lot
n'entraîne **aucun re-vendorage** — et **C-10** le fait constater plutôt que le supposer.

**Point de vigilance à transmettre à l'exécution.** Une **rectification du golden** (§ 2.4,
`gen-agents-golden.mjs`) toucherait, elle, des fichiers **vendorés**. Ce lot **prescrit** ce geste à
l'opérateur ; il ne l'exécute **pas**. Si l'exécution était tentée de régénérer les goldens « tant
qu'on y est », **elle sortirait du périmètre et rouvrirait la dette D-9** : c'est explicitement
interdit ici.

**Corrigé du brief** : le brief annonce « 7 goldens ». `Glob` en mesure **8**
(`aragorn, gandalf, gimli, helm, legolas, loki, nathalie, odin`), cohérent avec `IDS`
(`cli/src/lib/vendor.js:28`) et avec `EXPECTED_COPIES = 17 = 8 + 8 + 1` (`:30`). **Fait infirmé,
sans effet sur le périmètre.**

---

## 6. Arbitrages laissés au décideur

- **A-1 — Exposer `remediation` dans `--json` ?** *(§ 3.5)* — **Recommandé : oui.** Additif, coût
  marginal, et c'est ce qui rend **C-5** mécanisable sans shell. Le refuser laisse la sortie machine
  **muette** sur le remède, alors même que l'information est calculée : un agent consommateur reste
  sans geste. **Coût si retenu : ≈ 0.05 j-h.**
- **A-2 — Amender la ligne 125 de `garde-vendor-check-cross-repo.md` ?** Cette instruction **déjà
  livrée** porte le remède fautif du kit, et son A24 l'exigeait. **Recommandé : ne pas réécrire**
  l'instruction livrée (elle est la trace de ce qui a été décidé alors), mais y **ajouter un renvoi**
  d'une ligne vers le présent document. **Geste de cadrage — Gandalf, pas Gimli.** Sur accord, je le
  pose ; sinon la traçabilité repose sur l'en-tête du présent document, qui déclare déjà l'amendement.
- **A-3 — Faut-il un `vendor-check --fix` ?** Une fois le remède structuré, l'exécuter
  automatiquement devient tentable. **Recommandé : NON, pas dans ce lot.** Motif : `gen-fixtures.mjs`
  documente que le geste doit rester « **CONSCIENT et EXPLICITE — jamais de synchronisation
  automatique** » (`iakaFrameGUI/packages/core/scripts/gen-fixtures.mjs:4-5`) ; et `vendor-check` est
  aujourd'hui **strictement en lecture seule**, propriété testée (`cli/test/vendor-check.test.js:279`)
  qu'un `--fix` ferait sauter. À rouvrir séparément, jamais en passager clandestin de celui-ci.

---

## 7. Estimation

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** (spec fermée) | **0.75 j-h** — fourchette **0.5 à 1.0** |
| **Complexité** | **Faible à moyenne** — logique **pure**, sans E/S, sans réseau, sans concurrence |
| **Risque** | **Faible** — 1 fichier de production, 1 fichier de test, **aucun fichier vendoré** |

Décomposition : `remediationFor()` + table de dérivation ≈ 0.25 ; refonte de `humanReport` ≈ 0.1 ;
amendement d'A14 + tests C-2/C-3/C-4 ≈ 0.15 ; **bouclage C-5 (7 scénarios) ≈ 0.25** — le plus gros
poste, et le plus utile ; exhaustivité C-7 ≈ 0.1. `+0.05` si **A-1** est retenue.

**Inconnues susceptibles de faire glisser l'estimation**

- **I-1 — le kit dépouillé (§ 3.3).** Seul geste de copie qui **transforme** son contenu. Si
  l'implémentation veut le rendre applicable mécaniquement par C-5, la structure du remède doit
  porter un champ de transformation (ex. `strip: true`). **Risque de glissement : +0.1 j-h.** C'est
  le point le plus susceptible d'être sous-estimé.
- **I-2 — bouclage des `action: 'run'` (C-6).** Volontairement **exclu** du bouclage automatique. Si
  le décideur veut que `gen-fixtures.mjs` soit **réellement exécuté** en test, il faut un dépôt frère
  disponible et mutable — le rendant **dépendant de l'environnement**, ce que la suite évite
  aujourd'hui par construction (miroirs synthétiques, `cli/test/vendor-check.test.js:3-6`).
  **+0.3 j-h et une fragilité de CI** — **non recommandé**.
- **I-3 — mesure de C-10 sans `Bash` côté cadrage.** L'état de dérive du **vrai** miroir n'a pas été
  mesuré ici. L'instruction source signale un vendorage « massivement en dérive » (§ 12.2, cité
  `cli/test/vendor-check.test.js:5`) — **si c'était encore vrai**, C-10 constaterait un rouge
  **préexistant** et **étranger** au lot. **Ce n'est pas un échec du lot** ; il faut alors relever le
  verdict **avant** et **après**, et constater qu'ils sont **identiques**. Zéro j-h, mais **source de
  faux FAIL au gate** si le point n'est pas anticipé.

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## 8. Délégable / geste humain

**Délégable à ⚒️ Gimli** — l'intégralité du § 3 et du § 4 : `remediationFor()`, refonte de
`humanReport`, amendement d'A14, tests C-1 à C-9. Spec fermée, critères mécanisables.

**Geste humain (décideur)** — les arbitrages **A-1**, **A-2**, **A-3** (§ 6) ; la validation du
présent cadrage.

**Geste humain (cadrage — Gandalf)** — le renvoi d'A-2, si retenu : `specs/instructions/` n'est pas
le canal d'écriture de l'exécution.

**Vérification indépendante (🏹 Legolas, gate P3)** — mesure de C-5 et de **C-10**, avec relevé
**avant/après** du verdict `--strict` (cf. I-3). Conformément à la règle en vigueur : une mesure
reprise du rapport d'un autre agent **n'est pas une mesure**.

---

## 9. Fichiers concernés

**En écriture (exécution)**
- `cli/src/commands/vendor-check.js` — remplacement de `REMEDIATION_COPIES` / `REMEDIATION_DERIVED`
  (`:20-28`) par `remediationFor()` ; refonte du bloc de remède de `humanReport` (`:60-65`).
  *Les deux constantes sont `export`ées ; recherche effectuée : **aucun autre importateur** dans le
  dépôt. Leur retrait est sans effet de bord interne.*
- `cli/test/vendor-check.test.js` — amendement d'A14 (`:256-269`) ; ajout de C-2 à C-7.

**En lecture seule (référence, à ne pas modifier)**
- `cli/src/lib/vendor.js` — table des fixtures (`:76-114`), raisons (`:163-173`), kit (`:198-211`),
  surnuméraires (`:228-237`), niveau 2 (`:239-263`).
- `cli/src/commands/assemble.js:51,59` — preuve de la cible réelle d'`assemble --write`.
- `cli/src/lib/library.js:318-327` — `serializeKit`, preuve du corps-stub.
- `kits/iakaframe-claude.md:9-15` — le corps rédigé que le remède fautif détruisait.
- `iakaFrameGUI/packages/core/scripts/gen-fixtures.mjs:108-124,148-149` — preuve de l'exclusion du kit.
- `cli/scripts/gen-agents-golden.mjs` — geste juste pour `niveau2-contrat-vivant-different`.

---

## 10. Sources externes

- [Copy-Item (Microsoft.PowerShell.Management) — Microsoft Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/copy-item?view=powershell-7.6)
- [Document `Copy-Item`'s behavior when wildcard matching is performed and `-Destination` doesn't exist — MicrosoftDocs/PowerShell-Docs #12621](https://github.com/MicrosoftDocs/PowerShell-Docs/issues/12621)
