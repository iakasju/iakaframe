# Gate qualité P2 — `REGISTRE-OPTIONS-ROOT-PATH-PROJET` (lots R1 + R2)

> 🏹 Legolas — branche `feat/registre-options` (worktree `/Users/sjupin/work/.wt/iakaframe-registre-options`),
> HEAD `8cabc94`, merge-base `main` = `18bcec0` (confirmé égal à `origin/main` et `github/main`).
> Cadrage : `specs/instructions/registre-options-root-path-projet.md`. Remise reçue :
> `docs/qualite/remise-registre-options.md`. Mesures Gimli : `docs/qualite/mesures-etape-0-registre-options.md`.
> Toutes les vérifications ci-dessous sont des **re-mesures indépendantes**, jamais une reprise du
> rapport de Gimli.

## Verdict : PASS

Les 10 critères d'acceptation (CA-R1…CA-R10) sont vérifiés par re-mesure indépendante. Le
périmètre de production est exactement celui annoncé. Les contrefactuels rejoués rougissent comme
prédit et nomment le verbe/l'option fautif. Les 7 skips sont nommés, expliqués et confirmés :
6 sont un fait d'isolement du worktree (dépôt frère `iakaFrameGUI` absent du chemin relatif
attendu), rejouables verts (1287/1286/0/1) en rendant le frère joignable par variable
d'environnement ; le 7ᵉ (`ripgrep` absent du PATH) est indépendant du lot.

## Suite de tests — re-mesure

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` (worktree isolé, PATH normal) | `0` | `tests 1287 / pass 1280 / fail 0 / cancelled 0 / skipped 7` |
| `git status --porcelain` après la suite | `0` (vide) | aucune écriture hors bac à sable |
| `cd cli && IAKAFRAME_GUI_ROOT=/Users/sjupin/work/iakaFrameGUI IAKAFRAME_CORE_VOCAB=.../vocab.json node --test` (frère GUI rendu joignable) | `0` | `tests 1287 / pass 1286 / fail 0 / cancelled 0 / skipped 1` |
| `git status --porcelain` (dépôt CLI et dépôt `iakaFrameGUI`) après ce rejeu | `0` (vide, les deux) | aucune mutation du dépôt frère (conforme au commentaire « Aucune mutation du depot GUI ») |

Chiffre `1287/1280/0/7` **confirmé identique** à la remise de Gimli. Rejeu avec le frère joignable
**confirme la prédiction de la mission** : la preuve finale des « 1 skip » est atteignable dès
maintenant depuis ce worktree (pas seulement promise pour un rejeu ultérieur en arbre racine),
puisque `/Users/sjupin/work/iakaFrameGUI` existe sur cette machine et que les 3 tests concernés
acceptent une variable d'environnement d'override.

### Les 7 skips, nommés un par un

| # | Test | Motif du skip (cité dans le code) | Cause | Rejoué joignable ? |
|---|---|---|---|---|
| 1 | `AC1.11 : les cles du catalogue de workflows CLI == celles du coeur GUI (verrou anti-derive)` | `frere iakaFrameGUI absent` (`frame-lint-parity.test.js:30`) | worktree isolé (`resolveGuiRoot` cherche `<repo>/../iakaFrameGUI`, absent sous `.wt/`) | oui — vert avec `IAKAFRAME_GUI_ROOT` |
| 2 | `AC1.11 : COUVERTURE - toute ref manquante du coeur GUI a un finding BLOQUANT cote CLI` | idem | idem | oui |
| 3 | `AC1.11 : SEVERITE COMMUNE ARB-2 …` | idem | idem | oui |
| 4 | `AC1.11 : parite du VERT - fixture saine …` | idem | idem | oui |
| 5 | `parite : la copie vendoree du GUI == la source iakaframe (source unique 5a, D-3)` | `copie vendoree GUI introuvable (depot iakaFrameGUI absent - CI isolee)` (`frontmatter-schema-parity.test.js:71`) | idem, résolution `path.resolve(REPO, '..', 'iakaFrameGUI')` | oui — vert avec `IAKAFRAME_GUI_ROOT` |
| 6 | `parite miroir CLI <-> core vocab.json (enums + alias)` | `core vocab.json introuvable (depot iakaFrameGUI absent - CI isolee)` (`vocab-parity.test.js:29`) | idem, résolution `here/../../../iakaFrameGUI` | oui — vert avec `IAKAFRAME_CORE_VOCAB` |
| 7 | `recall : moteur ripgrep si rg est installe (sinon test saute)` | `# SKIP` | **indépendant du lot** — pas de binaire `rg` dans le PATH de cette machine (`command -v rg` ne résout qu'une fonction shell zsh, aucun binaire réel sous `/opt/homebrew/bin` ni `/usr/local/bin`) | non concerné (n'est pas un skip GUI) |

Vérification de la condition de skip lue directement dans les 3 fichiers concernés
(`frame-lint-parity.test.js:30`, `frontmatter-schema-parity.test.js:70-71`,
`vocab-parity.test.js:28-29`) : chacune ne teste que l'existence du chemin candidat vers le dépôt
frère (ou une variable d'env d'override) — **rien d'autre**. Aucun skip inattendu ; les 6
« GUI-absent » sont bien 6 (pas 5, pas 7) et le 7ᵉ est bien étranger au lot, comme l'exige la
mission.

## Périmètre de production — `git diff --stat main..HEAD -- cli/src`

```
cli/src/index.js      |  5 +++--
cli/src/lib/verbes.js | 12 ++++++------
```

Diff complet relu ligne à ligne : `verbes.js` ne porte que des ajouts d'entrées `options` sur 6
verbes (`config`, `go`, `brief`, `recap`, `assemble` → `--root` ; `go`, `brief`, `recap`,
`observe` → `--project`, soit 5 `--root` + 4 `--project`) ; `index.js` ne porte que la réécriture
du commentaire d'aide `--root a DEUX sens…` (lignes 110-111, citant les nouveaux déclarants).
**Rien d'autre** dans `cli/src`. Aucune ligne de `cli/src/commands/*.js` touchée — confirmé par
lecture du diff complet (`git diff --stat main..HEAD`, 19 fichiers, aucun sous
`cli/src/commands/`).

## Tableau CA-R1 … CA-R10 — vérifié par re-mesure indépendante

| CA | Verdict | Re-mesure Legolas |
|---|---|---|
| CA-R1 | **PASS** | `mesures-etape-0-registre-options.md` relu intégralement ; tables A/B/C cohérentes avec le § 0.3 du cadrage ; deux compléments factuels (plancher `7 skips` dans ce worktree, sémantique `--project` de `jalon`/`observe`) vérifiés indépendamment ci-dessous (lecture directe `jalon.js:41`, `observe.js:27-52`, `observation.js:43,80-92`). |
| CA-R2 | **PASS** | Diff `cli/src` confirmé exact (ci-dessus). `docs/commandes.md` relu : les 6 lignes `config`/`go`/`brief`/`recap`/`assemble`/`switch` portent la sémantique juste (« chapeau » vs « bibliothèque » nommés en toutes lettres), la ligne `repo` neuve (§ B.1, `docs/commandes.md:263`) contient les 5 options du verbe. Contrefactuel rejoué moi-même sur `config`/`--root` (registre synthétique en mémoire, jamais le fichier réel) : rouge exact `config(déclaré=false,parsé=true,documenté=true)` — cohérent avec la prédiction de l'instruction. |
| CA-R3 | **PASS** | AR-R1=(a) confirmé (aucune option retirée). `cd cli && node --test test/temoins-prose.test.js` : 0 fail. Prose et `--json` rejoués moi-même contre un worktree `main`@`18bcec0` isolé (`config`, `go`) : identiques octet pour octet (voir § « Rejeu contre `main` isolé »). Aucune ligne de `cli/src/commands/*.js` modifiée (confirmé). |
| CA-R4 | **PASS** | `iakaframe --help` et `iakaframe commands --json` rejoués et diffés MAIN→HEAD par mes soins (worktree `main`@`18bcec0` créé dans le scratchpad, retiré après usage) : diff **identique ligne par ligne** à celui cité dans la remise — exactement 5 `--root` (config, go×2 lignes wrap, brief, recap, assemble) + 4 `--project` (go, brief, recap, observe) + les 2 lignes de commentaire d'aide. Rien d'autre. |
| CA-R10 | **PASS** | `index.js:110-111` relu : cite `config`, `go`, `brief`, `recap` en famille « chapeau » (aux côtés de `portfolio`, `observe` déjà présents) — cohérent avec le résolveur réellement appelé (`resolveRoot` dans `config.js:73`, `go.js:58`, `brief.js:37`, `recap.js:27`, vérifié par lecture directe). `assemble` reste en famille « bibliothèque » (`libraryRoot`, `assemble.js:46`), inchangé. |
| CA-R5 | **PASS** | `guard-json-couverture.test.js` relu intégralement (boucle `for (const option of ['--json','--root','--path','--project'])`, l.213-219 ; 8 contrefactuels dédiés + 6 table-driven, l.221-291). Les 8 contrefactuels **rejoués moi-même hors du fichier de test**, sur la fonction extraite (`verbesEnDeriveOption`) : `add`/`--root` retiré, `onboard`/`--path` retiré, `agents`/`--project` retiré, `config`/`--root` retiré → 4/4 rouges nommant le verbe+option exact ; `banner`/`--json`,`--root`,`--path`,`--project` ajoutés → 4/4 rouges nommant `banner`+option. |
| CA-R6 | **PASS** | `EXCEPTIONS_PARSE_INLINE.root` relu (`guard-json-couverture.test.js:~232-240`) : motif nommé, preuve positive = présence littérale de `'--root'` dans `cli/src/index.js`. Vérifié par lecture directe : `index.js:166` porte bien `rest.indexOf('--root')`. Contrefactuel simulé moi-même (chaîne `'--root'` remplacée en mémoire) : preuve retombe à `false`, ce qui ferait rougir la garde en nommant `root` — conforme à la prédiction. |
| CA-R7 | **PASS** | `cli/test/fixtures/couverture-options.json` relu : 6 entrées `horsBalayage`, chacune motif non vide + successeur nommé (`REGISTRE-OPTIONS-BALAYAGE-COMPLET`), `horsBalayageCount: 6` = `horsBalayage.length`. Les 4 lignes sources citées vérifiées par lecture directe (`assemble.js:34-36` porte bien `node`/`force`/`ascii` ; `observe.js:28` porte `portfolio` ; `commands.js:39` porte `ascii` ; `models.js:1055` porte `binding`). Contrefactuels rejoués moi-même sur copie en mémoire : entrée sans motif ajoutée → détectée ; `horsBalayageCount` désaccordé → détecté faux. |
| CA-R8 | **PASS** | Commentaires (a)/(b) relus au-dessus de `parseOptionDansFichier` et `docMentionneOption` (`guard-json-couverture.test.js`) : énoncent honnêtement la dérivation textuelle et le `includes` nu, sans survendre la garde. Vérifié : la ligne `repo` de `docs/commandes.md:263` **ne contient aucune sous-chaîne `--root`** (`grep -c -- '--root'` → 0), donc aucun faux positif résiduel sur l'angle mort (b) pour ce verbe. |
| CA-R9 | **PASS** | `node --test` rejoué deux fois par mes soins : `1287/1280/0/7` (identique à la remise), `git status --porcelain` vide après chaque run. Plancher hérité (`≥1263/0 fail`) largement dépassé. |

## Contrefactuels — rejoués indépendamment (synthèse)

Tous joués sur **sondes synthétiques en mémoire**, jamais en écrivant le registre réel ni les
fixtures réelles ; tous **rougissent en nommant précisément le verbe et l'option fautifs**, comme
l'exige la mission :

- `add` / `--root` retiré → `{id:"add", option:"--root", declare:false, parse:true, doc:true}`
- `onboard` / `--path` retiré → `{id:"onboard", ..., declare:false, parse:true, doc:true}`
- `agents` / `--project` retiré → `{id:"agents", ..., declare:false, parse:true, doc:true}`
- `config` / `--root` retiré (rejeu supplémentaire, hors patron déjà écrit dans le test) →
  `{id:"config", ..., declare:false, parse:true, doc:true}`
- `banner` / `--json`,`--root`,`--path`,`--project` ajoutés (4 sondes) → 4×
  `{id:"banner", ..., declare:true, parse:false, doc:false}`
- `root` : retrait simulé de la preuve littérale `'--root'` dans une copie en mémoire de
  `index.js` → la fonction de preuve retombe à `false` (ferait rougir CA-R6, nommant `root`)
- `couverture-options.json` : entrée hors-balayage sans motif ajoutée en mémoire → détectée
  nommément ; `horsBalayageCount` désaccordé en mémoire → détecté faux

## Rejeu contre `main` isolé (CA-R3/CA-R4)

Worktree `18bcec0` créé dans le scratchpad (`git worktree add`, retiré après usage par
`git worktree remove`). Rejeu manuel, comparé octet pour octet à HEAD :

- `config --path <tmp>` (prose) : identique.
- `config --path <tmp> --json` : identique.
- `go --project inexistant --root <tmp>` (stderr, `Dossier introuvable : …`) : identique — confirme
  que l'alias `--project` fonctionnait **déjà** sur `main`, silencieusement, exactement le défaut
  nommé par le cadrage.
- `repo --help` : identique (verbe non touché en code, seule sa ligne de doc a changé).
- `config --help` / `go --help` : comportement **identique** MAIN↔HEAD (exception brute
  `ERR_PARSE_ARGS_UNKNOWN_OPTION`, ces verbes n'ont pas de `--help` local) — non affecté par le
  lot, chemins de fichiers seuls différents entre les deux worktrees (attendu).
- `iakaframe --help` / `iakaframe commands --json` : diff MAIN→HEAD **identique** à celui cité
  dans la remise, vérifié ligne par ligne (voir CA-R4 ci-dessus).

## Sémantique `--project`/`--root` (point 7 de la mission)

Vérifiée par lecture directe du code, indépendamment de la remise :

- `jalon.js:41` : `const project = (values.project || 'PROJET').toUpperCase()` — un **nom/titre**,
  jamais un chemin lu sur disque.
- `observe.js:27,52` + `observation.js:80-92,43` : `observeList(home, { project: values.project })`
  → `projectPath(home, project) = path.join(home, \`${slug(project)}.md\`)` — un **nom de fichier**
  (slug), pas un dossier.
- Confirmé : ni `jalon` ni `observe` ne relèvent de la famille `<dir>` (`agents`, `skills`,
  `produit`, `open`) — la distinction posée par le cadrage et la mesure d'étape 0 est correcte.
- `docs/commandes.md` relu sur les 4 lignes touchées (`go:337`, `brief:351`, `recap:351`) : chacune
  nomme explicitement « un **nom**, pas un dossier » et distingue le sens du `--project <dir>`
  d'`agents`/`skills`/`produit`/`open`. Conforme à AR-R1(a)/§2(c) du cadrage.

## Guides individuels — re-mesure isolée

```
node --test test/guide-doc-a-jour.test.js test/guard-verbes-registre.test.js \
  test/temoins-prose.test.js test/guard-json-output.test.js test/guard-guidage-autorite.test.js
tests 123 / pass 123 / fail 0 / skipped 0
```

Les 5 fichiers passent **individuellement**, isolément de la suite complète. Vérification
« aucun guidage ne propose `--force`/`--yes`/`--cascade` » : aucun des 7 verbes touchés par ce lot
(`config`, `go`, `brief`, `recap`, `assemble`, `switch`, `observe`, `repo`) ne déclare `--guide`
dans `verbes.js` (grep confirmé : les seules occurrences de `--guide` sont sur `models
set/unset`, `list`, `show`, `add`, `remove`, `attach`, `detach`, `frame use`, `switch` — `switch`
la portait déjà avant ce lot, dont le seul changement pour ce verbe est une ligne de doc, pas le
registre). Les occurrences textuelles de « --force »/« --yes »/« --cascade » dans
`docs/commandes.md` (verbes `remove`, `models set`, `canaux`, `switch`) sont **pré-existantes**,
hors diff de ce lot, et déjà explicitement encadrées (« jamais de --force », « ne propose jamais
--cascade/--yes »).

## BACKLOG.md

Entrée `REGISTRE-OPTIONS-ROOT-PATH-PROJET` sous **« Ouverts »** (`BACKLOG.md:13`), intitulée
« livré, en attente du gate 🏹 Legolas (2026-09-10) » — **pas** sous « Fait ». Conforme : ce
verdict est ce qui solde, pas la remise de Gimli.

## Écarts constatés

**Aucun.** Toutes les preuves de la remise sont reproduites à l'identique par re-mesure
indépendante. Aucune ligne de `cli/src/commands/*.js` touchée, aucun guidage proposant une option
dangereuse, aucun skip inexpliqué, aucune divergence entre le diff annoncé et le diff réel.

## Verdict final

**PASS** — les lots R1 et R2 de `REGISTRE-OPTIONS-ROOT-PATH-PROJET` sont acceptés. Version
candidate prête pour stage. Jalon ouvert vers l'étape suivante (bascule par ⛴️ Charon sur feu vert
humain, gate stage→prod inchangé).

🤖 Gate posé par 🏹 Legolas, worktree isolé `/Users/sjupin/work/.wt/iakaframe-registre-options`.
