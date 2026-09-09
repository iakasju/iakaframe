# Gate qualité — C-JSON-COUVERTURE-COMPLETE — lot J3 (dernier) — branche `feat/c-json-j3`

Vérificateur : 🏹 Legolas. Date : 2026-09-09. Commits gatés (remis par ⚒️ Gimli) : `30a5629`,
`347deb5`, `335cb78`, `7221989`, `1678e92`, `c1b8417`, `ee23630` (base `main` = `20dd4306`).
Cadrage : `specs/instructions/c-json-couverture-complete.md` (AR-J4(c), AR-J5(a), CA-J12/CA-J13,
§ 5 étapes 7-8). Toutes les mesures ci-dessous sont **re-jouées** par moi ; aucune n'est reprise
du rapport de Gimli sans exécution propre.

## Verdict : **PASS**

- **Intégrité de `main` : PASS, aucun écart.** `main` = `origin/main` = `github/main` =
  `20dd43061f0e78be46844a6f91adf7c5e8ab1f65`. `git merge-base main feat/c-json-j3` = `main` (pas de
  divergence, la branche est un empilement propre de 7 commits au-dessus de `main`).
- **Verdict qualité J3 : PASS.** Suite complète verte, périmètre de production exactement tenu
  (9 sites AR-J4(c), 1 ligne `frame.js` count, 2 lignes `verbes.js` --root), non-régression du
  lot A prouvée par contrefactuel, garde de complétude G-J1 vérifiée y compris son angle mort,
  cliquet C-JSON verrouillé à 0. **Une réserve process (non bloquante pour le code)** est signalée
  en Écarts : le BACKLOG a été marqué « Soldé » avant l'émission de ce verdict.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` (suite complète) | `0` | `tests 1263`, `pass 1262`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0` — conforme à l'annonce |
| `node --test test/guard-json-output.test.js` | `0` | `tests 63`, `pass 63`, `fail 0` |
| `node --test test/guard-json-couverture.test.js` | `0` | `tests 18`, `pass 18`, `fail 0` |
| `node --test test/temoins-prose.test.js` | `0` | `tests 23`, `pass 23`, `fail 0` |
| `node --test test/guidage-non-interactif.test.js` | `0` | `tests 49`, `pass 49`, `fail 0` — conforme à l'annonce |
| `node --test test/guidage.test.js` | `0` | `tests 19`, `pass 19`, `fail 0` |
| `node --test test/guard-guidage-autorite.test.js` | `0` | `tests 4`, `pass 4`, `fail 0` |
| `node --test test/interactif.test.js` | `0` | `tests 17`, `pass 17`, `fail 0` |
| `node --test test/install-contrat-machine.test.js` | `0` | `tests 24`, `pass 24`, `fail 0` — conforme à l'annonce |
| `node --test test/install-prose-non-regression.test.js` | `0` | `tests 5`, `pass 5`, `fail 0` |
| `node --test test/guide-doc-a-jour.test.js` | `0` | `tests 6`, `pass 6`, `fail 0` |
| `node --test test/guard-verbes-registre.test.js` | `0` | `tests 18`, `pass 18`, `fail 0` |

Pas de lint/typecheck dans ce dépôt (JS pur, aucun `.eslintrc*`/`tsconfig*`) : sans objet, non un
critère non mesuré.

## Périmètre de production (AR-J4(c)) — la seule écriture de ce lot

`git diff --stat main..feat/c-json-j3 -- cli/src` :

```
cli/src/commands/add.js    |  5 ++++-
cli/src/commands/attach.js |  6 +++++-
cli/src/commands/frame.js  |  6 +++++-
cli/src/commands/list.js   |  6 +++++-
cli/src/commands/models.js |  9 ++++++++-
cli/src/commands/remove.js |  5 ++++-
cli/src/commands/show.js   |  5 ++++-
cli/src/commands/switch.js |  6 +++++-
cli/src/lib/interactif.js  | 30 ++++++++++++++++++++++++++++++
cli/src/lib/verbes.js      |  4 ++--
```

**Exactement le périmètre annoncé, rien d'autre** :
- `interactif.js` : ajout du seul helper `refuserJsonEtGuide(values)` (30 lignes, `import { fail }`
  compris) — `peutDemander()` byte-identique (diff vérifié ligne à ligne : aucune ligne retirée
  hors le déplacement de l'accolade de fin par l'insertion du nouveau bloc).
- 9 sites `if (refuserJsonEtGuide(values)) return;` insérés AVANT `peutDemander()`, sur `list`,
  `show`, `add`, `remove`, `switch`, `frame` (`runUse`), `attach` (partagé attach/detach),
  `models` ×2 (`runModelsSet`, `runModelsUnset`) — 10 cibles guidées couvertes.
- `frame.js:120` : `count: res.findings.length,` ajouté au payload de `frame verify` (bugfix
  335cb78, règle 3 du contrat).
- `verbes.js:293` et `verbes.js:306` : `'--root <dir>'` ajouté aux options d'`attach`/`detach`.

### (a) `--json --guide` tapés ensemble → refus explicite, 3 cibles rejouées

```
$ node src/index.js list --json --guide
$ node src/index.js show aragorn --json --guide
$ node src/index.js models set --path <sandbox vide> --json --guide
```
Sur les 3 : exit 1, stderr **vide** (0 octet), stdout = un unique objet JSON `{ ok:false, error, flags:["--json","--guide"] }` — le message nomme `--json`, `--guide` **et** la précédence. Le
répertoire sandbox de `models set` reste **vide** après l'appel (rien écrit).

### (b) `--json` seul → identique à `main`, octet pour octet

Comparaison sur un `git worktree add --detach <tmp> main` isolé (chemins absolus normalisés) :
`list --json` et `show aragorn --json` → stdout/stderr/exit **identiques**. `models set --json`
(sandbox vide) → exit 1, sortie **identique**.

### (c) `--guide` seul, non-TTY → identique à `main`

`list --guide`, `show aragorn --guide`, `models set --guide` (sandbox), `attach --guide`,
`frame use --guide` → tous **identiques** à `main` (stdout+stderr+exit), chemins normalisés.

### (d) `--guide` seul, TTY simulé (palier 1/2)

Aucun test du lot A n'utilise `script -q`/pty réel : le harnais du lot A simule le TTY par
injection d'objets (`{ isTTY: true }`) directement sur `peutDemander()` (`test/interactif.test.js`,
`test/guidage.test.js`). Le corps de `peutDemander()` étant byte-identique à `main` (seul un
`import` et une nouvelle fonction ont été ajoutés au fichier, rien retiré de la fonction
existante), le palier 1/2 est structurellement inchangé — confirmé par les 19+17 tests verts de
`guidage.test.js`/`interactif.test.js`.

### (e) A4 : gardes statiques + absence d'échappatoires

`guard-guidage-autorite.test.js` (G3a/G3b) : 4/4 vert. Recherche de `force`/`yes`/`cascade` dans
`interactif.js`/`guidage.js` : seule occurrence = la liste pré-existante
`ECHAPPATOIRES_INTERDITES` (`guidage.js:36`) ; aucun guidage n'en propose.

## Non-régression du lot A (G1) — la seule modification d'un test du lot A

`347deb5` est le **seul** commit à toucher un fichier de test du lot A
(`guidage-non-interactif.test.js`), **dans le même commit** que la production qu'il vérifie :
- Retrait de la variante `--json` de la boucle d'égalité `avecGuide === sansGuide` (elle figeait le
  défaut corrigé), remplacée par une boucle **dédiée** AR-J4(c) de 10 tests de **divergence**
  (exit 1, stderr vide, JSON nommant les deux drapeaux). Les 3 autres variantes (non-TTY, CI=1,
  IAKA_NON_INTERACTIF=1) restent inchangées dans la boucle d'égalité.
- Lot A n'a **pas** de cliquet numérique séparé (pas de `horsCouvertureCount`-like) sur ses gardes
  G1-G6 : sa garantie est le vert/rouge direct de sa suite paramétrée (30 tests d'égalité + 10 de
  divergence + 9 tests G2 = 49, conforme à la mesure). Rien n'a donc « rougi puis été refixé » au
  sens d'un cliquet — la seule preuve de non-dérive est le contrefactuel ci-dessous.
- **Contrefactuel joué** (script jetable en bac à sable, jamais un test committé) : rejeu de
  l'ANCIENNE assertion d'égalité (`avecGuide+--json === sansGuide+--json`) sur la production
  **actuelle**, sur les 10 cibles → **10 rouges sur 10**, aucun vert. Preuve que le changement de
  comportement est total sur l'ensemble des cibles annoncées, et seulement là (les 3 autres
  variantes restent vertes, mesuré ci-dessus en (c)).

## Témoins de prose J3 (CA-J8)

4 fixtures neuves (`30a5629`, seul commit à les créer) : `frame-use.txt`, `list.txt`,
`models-unset.txt`, `show.txt`. Rejouées sur `main` isolé (`--guide` seul, non-TTY) → **identiques
octet pour octet** aux fixtures committées (confirmé en (c) ci-dessus, prose générée par
l'analyseur d'arguments, non affectée par `refuserJsonEtGuide`).

Les 9 témoins J2 et les 9 de J0 restent verts : les 23 tests de `temoins-prose.test.js` (tous
labellisés `CA-J8`, couvrant J0 à J3) passent intégralement, `0` échec.

**Contrefactuel de mutation joué et révoqué** : ajout d'une ligne à `show.txt` (fixture) →
2 tests rougissent nommément (`CA-J8 : show (prose d'erreur, stderr) inchangée` et sa variante
`--guide`), diff `actual`/`expected` affiché avec le texte muté visible. Fichier restauré,
`git status` propre après.

## G-J1 / G-J2 (grain option) — `guard-json-couverture.test.js`

**Précision de localisation** : la garde de complétude « G-J1 » à comptage de crochets équilibrés
(commit `7221989`) vit en réalité aux lignes **283-385** du fichier actuel, dérivant le texte de
`guard-json-output.test.js` sans jamais l'importer. Les lignes **145-243** citées dans la mission
correspondent à l'**extension G-J2 au grain option** (`--json`/`--root`/`--path`/`--project`,
commit `1678e92`) — les deux gardes sont dans le périmètre J3 et sont traitées ci-dessous.

### Angle mort constaté sur G-J1 (comptage textuel, pas de parsing JS)

**Contrefactuel joué et révoqué** : commenté (`//`) la ligne `['frame new', …]` dans une copie de
travail de `guard-json-output.test.js`, puis lancé `guard-json-couverture.test.js` seul. **Résultat :
la garde reste VERTE** — `CA-J13 : toute invocation attendue … a au moins une entrée NOMINAL ou
ERRORS` passe malgré l'entrée morte. Vérifié en isolant `invocationsCouvertesReelles()` : la regex
d'extraction (`,\s*\[\s*'([a-zA-Z][\w-]*)'…`) matche le texte de la ligne commentée elle-même,
puisqu'elle continue de porter littéralement `['frame new', …]` précédée d'une virgule au sein du
tableau borné par crochets — **elle ne sait pas distinguer du code mort d'un vrai test**. C'est un
angle mort réel de la garde (elle protège contre une entrée **absente du texte**, pas contre une
entrée **présente mais neutralisée**) — non couvert par le contrefactuel documenté du lot
(« verbe fictif SANS entrée » — jamais « entrée présente mais commentée »). Fichier restauré
immédiatement après mesure (`cp` de sauvegarde), `git status` propre, `node --test
test/guard-json-output.test.js` revérifié vert (63/63) après restauration.

Ce point n'est **pas un motif de FAIL** (la garde couvre son contrat annoncé — dérivation
texte-fidèle, jamais parsing sémantique — et le trou réel qu'elle a trouvé en J3, `frame new`/
`frame use`, est bien fermé) mais **doit être nommé** : un futur `//`-commenting accidentel d'une
entrée `NOMINAL`/`ERRORS` passerait inaperçu de G-J1.

### Contrefactuel CA-J13 documenté, rejoué

`CA-J13 (contrefactuel) : un verbe fictif portant --json SANS entrée NOMINAL/ERRORS est détecté,
nommant son id` → vert (le test committé le prouve déjà en exécution normale : ajout d'un verbe
`verbe-fictif-cjson-j3` synthétique → `manquantes` le nomme exactement).

### `frame new`/`frame use` en NOMINAL, rejoués en bac à sable

- `frame new demo-frame-legolas --root <lib jetable> --json` → `ok:true`, `count:5`, 5 fichiers
  écrits **sous le bac à sable uniquement** (`frames/`, `methods/`, `teams/`, `bindings/`,
  `kits/`), rien dans la vraie `library/` du dépôt.
- `frame use iakaframe --path <projet jetable> --json` → `ok:true`, pointeur `iakaframe.json`
  (`{"frame":"iakaframe"}`) écrit **sous le projet jetable uniquement** ; `git status` du dépôt
  réel resté propre après coup.

### `couverture-json.json` : cliquet verrouillé

`horsCouvertureCount: 0`, aucune entrée `hors-couverture` (0/29 verbes). **Contrefactuel joué et
révoqué** : ajout d'une entrée `hors-couverture` synthétique sans incrémenter le compteur →
**2 tests rougissent** (`CA-M16 : la liste des verbes… correspond EXACTEMENT` **et** `CA-M16 : le
CLIQUET (horsCouvertureCount) reflète le compte RÉEL`, `actual:0 / expected:1`). Fichier restauré,
`git status` propre, 18/18 verts après restauration.

## `--root` sur `attach`/`detach` + G-J2 au grain option

`verbes.js:293` (`attach`) et `:306` (`detach`) portent désormais `'--root <dir>'`. Contrefactuels
rejoués (déjà committés, vérifiés en exécution) :
- Témoin négatif 1 : `--root` retiré du registre d'`add` (réellement parsé+documenté) → détecté,
  nommant `add`.
- Témoin négatif 2 : `--project` ajouté au registre de `banner` (non parsé) → détecté, nommant
  `banner`.
- Témoin positif : `attach`/`detach` clean sur `--root` **et** `--json`.

**Successeur `REGISTRE-OPTIONS-ROOT-PATH-PROJET` (dette sur 8 verbes) confirmé par lecture directe**,
2 vérifiés :
- `config` : `config.js:45` parse `root: { type: 'string' }` — `verbes.js:130` (options de
  `config`) ne déclare **pas** `--root` — `docs/commandes.md:266` (ligne `config`) ne le documente
  pas non plus. Écart confirmé.
- `repo` : `verbes.js:98` déclare `'--path <dir>'` et `repo.js:41` le parse
  (`path: { type: 'string' }`) — mais `docs/commandes.md` ne porte **aucune ligne de tableau**
  `` `repo` `` (grep vide) : verbe non documenté du tout. Écart confirmé.

## `frame verify --json` en bac à sable

`ok:true`, `checked:288`, `count:21`, `findings.length:21` → `count === findings.length` vérifié
programmatiquement.

## Documentation

- `docs/commandes.md:216-224` : la règle de précédence `--json`/`--guide` est écrite précisément
  et correspond mot pour mot au comportement mesuré en (a)/(b)/(c) ci-dessus (refus nommé
  seulement si les deux drapeaux sont **tapés**, `--json` seul et `--guide` seul inchangés, les
  flux interactifs par construction non concernés).
- `guide-doc-a-jour.test.js` : 6/6 vert. `guard-verbes-registre.test.js` : 18/18 vert.

## CA-J14 (registre des invocations d'origine) — une exception documentée

`git diff main..feat/c-json-j3 -- cli/test/guard-json-output.test.js` : **une seule** ligne
`NOMINAL` pré-existante est altérée (pas seulement ajoutée) — l'entrée `frame verify` voit son
`collKey` passer de `null` à `'findings'` (commit `335cb78`), **motivée** dans le même commit que
le bugfix `count` de `frame.js` (elle exerce la nouvelle garde `count === findings.length`).
Toutes les autres lignes ajoutées par J3 (`frame new`, `frame use`, empreintes associées) sont des
**ajouts purs**. CA-J14 tient donc au sens de son intention (« pas de retouche silencieuse des 20
invocations d'origine ») mais littéralement, **une** ligne est modifiée — à documenter comme telle
plutôt que déclarer une conformité absolue.

## Bilan du lot `C-JSON-COUVERTURE-COMPLETE` (J0 → J3)

| Lot | Gate | Verdict | Cliquet `horsCouvertureCount` |
|---|---|---|---|
| J0 + J1 | `docs/qualite/gate-c-json-j0-j1.md` | PASS | 14 → 9 |
| J2 | `docs/qualite/gate-c-json-j2.md` | PASS | 9 → 0 |
| J3 (ce rapport) | ci-dessus | **PASS** | **0, verrouillé** |

Le lot complet ferme la promesse annoncée : les 29 verbes du registre déclarant `--json` ont
chacun au moins une invocation `NOMINAL`/`ERRORS` exercée, `--json`/`--guide` ne s'ignorent plus
en silence, `frame verify` respecte la règle 3 du contrat, et `attach`/`detach` sont désormais
clean sur `--root`. Successeurs explicitement nommés et non traités ici (hors périmètre, § 2 du
cadrage) : `REGISTRE-GRAIN-SOUS-VERBE`, `REGISTRE-OPTIONS-ROOT-PATH-PROJET`,
`C-JSON-EXTENSION`, `C-JSON-VOCABULAIRE`.

## Écarts

1. **(non bloquant, process) BACKLOG marqué « Soldé » avant le verdict de gate.** Le commit
   `ee23630` (dernier commit de la branche, écrit par Gimli) déplace l'entrée
   `C-JSON-COUVERTURE-COMPLETE` de `## Ouverts` vers `## Fait`, sous un titre de section
   `### Soldé le 2026-09-09 (…) — dernier lot, C-JSON-COUVERTURE-COMPLETE ENTIÈREMENT livré`,
   case cochée `[x]` — alors que le corps du même item écrit noir sur blanc : « J3 remis par
   ⚒️ Gimli le 2026-09-09 … **en attente du gate 🏹 Legolas** ». Un lot ne peut pas être à la fois
   « soldé »/« entièrement livré » et « en attente du gate » — c'est précisément la distinction
   que le canon du geste (Gimli émet, ne s'auto-valide pas ; le jalon **ouvre** le gate, ne le
   **franchit** pas) protège. Ce rapport corrige l'état de fait : **le lot n'était pas soldé tant
   que ce verdict n'était pas rendu**, il l'est **maintenant**, avec ce PASS. Recommandation :
   à l'avenir, la mention « Soldé »/`[x]` ne devrait être écrite par Gimli qu'**après** réception
   du jalon PASS de Legolas, jamais en anticipation.
2. **(non bloquant, garde) Angle mort de G-J1 sur le code mort/commenté** — détaillé ci-dessus :
   une entrée `NOMINAL`/`ERRORS` neutralisée par `//` reste comptée comme couvrante par la garde de
   complétude (dérivation textuelle, pas de parsing JS). Sans impact sur ce lot (rien n'est
   commenté dans le code livré, vérifié par lecture complète du diff `cli/src`), mais un risque
   latent pour un futur commit qui commenterait accidentellement une ligne.
3. **(non bloquant, littéral) CA-J14** — une ligne pré-existante (`frame verify`, `collKey`) est
   modifiée, pas seulement ajoutée ; motivé et documenté dans le même commit que le bugfix qu'elle
   exerce (335cb78).
4. **(hors périmètre de blocage, déjà nommé par Gimli)** `REGISTRE-OPTIONS-ROOT-PATH-PROJET` :
   dette pré-existante sur 8 verbes (`config`, `go`, `brief`, `recap`, `assemble`, `switch`,
   `observe`, `repo`) sur `--root`/`--path`/`--project`, confirmée par lecture directe sur 2
   d'entre eux (`config`, `repo`) ci-dessus.

## Jalon

`FAIL` : n/a. **`PASS`** — le récepteur du jalon est l'étape suivante (stage), gate franchi sans
humain (gate qualité automatique) ; la bascule production reste un geste humain distinct (⛴️ Charon).
