# Remise ⚒️ Gimli → 🏹 Legolas — `REGISTRE-OPTIONS-ROOT-PATH-PROJET`

> Branche `feat/registre-options` (worktree `/Users/sjupin/work/.wt/iakaframe-registre-options`,
> isolé de l'arbre racine `iakaframe`). Cadrage : `specs/instructions/registre-options-root-path-projet.md`.
> **Livré, PAS soldé** — ce document remet le travail au gate qualité ; il ne le valide pas.

## Étape 0 — verdict

Rejouée intégralement le 2026-09-10 (bac à sable, exécution réelle — voir
`docs/qualite/mesures-etape-0-registre-options.md`). **Aucune divergence** avec le § 0.3 du
cadrage. Deux compléments factuels non déductibles par lecture statique :
1. Plancher de suite mesuré dans ce worktree isolé : `1263/1256/0/7` (pas `1263/1262/0/1`) —
   fait d'environnement (dépôt frère `iakaFrameGUI` absent à cet emplacement), pas une régression.
2. Sémantique de `--project` sur `jalon`/`observe` tranchée : famille « nom », jamais `<dir>`.

Piège outillage consigné : sous Node v24.18.0, `node --test test/` (forme littérale de
l'instruction § 5) échoue en `MODULE_NOT_FOUND` — `node --test` sans argument est la forme qui
fonctionne (utilisée pour toutes les mesures de ce rapport).

## Commits (conventional commits, atomiques)

| Commit | Contenu |
|---|---|
| `6e9ff25` | Témoins de prose des 7 verbes (étape 1, avant tout code) |
| `c0da329` | Déclare `--root` sur `config`/`go`/`brief`/`recap`/`assemble` (registre + doc + avertissement) |
| `89ad496` | Déclare `--project` sur `go`/`brief`/`recap`/`observe` + ligne `repo` neuve (5 options) |
| `c6305a9` | `docs/qualite/mesures-etape-0-registre-options.md` |
| `95cebba` | Ouvre la boucle de balayage aux 4 options + exception nommée `root` |
| `875cf32` | 8 contrefactuels (4 options × 2 sens) + registre `couverture-options.json` (AR-R4) |
| `bfd7bad` | Redit les 2 angles morts (CA-R8) dans l'en-tête de la garde |
| `15487c7` | `BACKLOG.md` : entrée « livré, en attente du gate Legolas » (PAS soldé) |
| `8857872` | Coche CA-R1..CA-R10 dans l'instruction, preuve en regard |

## Tableau CA-R1 … CA-R10, preuve en regard

| CA | Verdict | Preuve |
|---|---|---|
| CA-R1 | PASS | `docs/qualite/mesures-etape-0-registre-options.md` (commit `c6305a9`) : tables A/B/C mesurées, aucune divergence de fond avec § 0.3 |
| CA-R2 | PASS | Commits `c0da329`/`89ad496`. **Contrefactuel joué et révoqué** le 2026-09-10 : suppression de `--root <chapeau>` (et de la prose qui le nomme) sur la ligne `config` de `docs/commandes.md` → rouge exact `config(déclaré=true,parsé=true,documenté=false)` (texte identique à la prédiction de l'instruction) ; restauration vérifiée par `diff` (vide) puis `git status --porcelain` (vide) |
| CA-R3 | PASS | AR-R1 = (a) retenu, aucune option retirée. 9 témoins de prose byte-identiques avant/après (`temoins-prose.test.js`, commit `6e9ff25`, tous verts après `c0da329`/`89ad496`). Diff git limité à `verbes.js`/`docs/commandes.md`/`index.js:110-111`/`cli/test/**` — aucune ligne de `cli/src/commands/*.js` touchée |
| CA-R4 | PASS | 9 témoins de prose verts. Diff `--help`/`commands --json` (AVANT § 0.7 → FINAL) énuméré ci-dessous : exactement 5 `--root` + 4 `--project` + le commentaire d'aide, rien d'autre |
| CA-R10 | PASS | Commit `c0da329`, diff `index.js:110-111` cité ci-dessous |
| CA-R5 | PASS | Commit `875cf32`. 8 tests (4 options × 2 sens), tous verts, sondes synthétiques (jamais écrites au registre réel) |
| CA-R6 | PASS | `EXCEPTIONS_PARSE_INLINE` (commit `95cebba`). **Contrefactuel joué et révoqué** : retrait de `'--root'` de `index.js:166` → rouge `root(déclaré=true,parsé=false,documenté=true)` ; restauration vérifiée (`diff` vide, `git status --porcelain` vide) |
| CA-R7 | PASS | `couverture-options.json` (commit `875cf32`), 6 écarts hors-balayage motivés + successeur nommé, `horsBalayageCount: 6`. 2 contrefactuels joués en mémoire (jamais le fichier réel) |
| CA-R8 | PASS | Commit `bfd7bad`, commentaires (a)/(b) au-dessus de `parseOptionDansFichier`/`docMentionneOption` |
| CA-R9 | PASS | `node --test` → **1287 tests, 1280 pass, 0 fail, 7 skipped** (rejoué 2× à l'identique). `git status --porcelain` vide après chaque run |

## Diff énuméré des deux surfaces publiques (CA-R4) — AVANT (§ 0.7) → FINAL

### `iakaframe --help`

```
33c33
<                         --aider-model <m>  --json
---
>                         --aider-model <m>  --root <chapeau>  --json
46c46,47
<                         --path <dir>  --runner <r>  --do "tache"
---
>                         --path <dir>  --project <nom>  --runner <r>  --do "tache"  --root
>                         <chapeau>
50c51
<                         --path <dir>  --font <nom>
---
>                         --path <dir>  --project <nom>  --root <chapeau>  --font <nom>
52c53
<                         --path <dir>  --n <nb commits>
---
>                         --path <dir>  --project <nom>  --root <chapeau>  --n <nb commits>
69c70
<                         --write  --binding <id>  --json
---
>                         --write  --binding <id>  --root <dir>  --json
92c93
<                         --home <dir>  --root <dir>  --json
---
>                         --home <dir>  --root <dir>  --project <nom>  --json
114,115c115,117
< ⚠ --root a DEUX sens selon la commande : dossier chapeau ~/work (portfolio, observe) vs
<   racine de bibliotheque (list, show, add, assemble, switch). Voir IAKAFRAME_ROOT / IAKAFRAME_HOME.
---
> ⚠ --root a DEUX sens selon la commande : dossier chapeau ~/work (portfolio, observe, config, go,
>   brief, recap) vs racine de bibliotheque (list, show, add, assemble, switch). Voir IAKAFRAME_ROOT /
>   IAKAFRAME_HOME.
```

### `iakaframe commands --json`

```
176a177
>         "--root <chapeau>",
351a353
>         "--project <nom>",
353c355,356
<         "--do \"tache\""
---
>         "--do \"tache\"",
>         "--root <chapeau>"
378a382,383
>         "--project <nom>",
>         "--root <chapeau>",
392a398,399
>         "--project <nom>",
>         "--root <chapeau>",
588a596
>         "--root <dir>",
1035a1044
>         "--project <nom>",
```

**Lecture** : exactement les 5 `--root` (`config`, `go`, `brief`, `recap`, `assemble`) et les 4
`--project` (`go`, `brief`, `recap`, `observe`) déclarés par ce lot, plus les 2 lignes de
commentaire d'aide (`index.js:110-111`). Rien d'autre n'a bougé sur ces deux surfaces.

## Écarts de l'étape 0

Aucun. Toutes les cellules du § 0.3 du cadrage sont confirmées par exécution (détail complet dans
`docs/qualite/mesures-etape-0-registre-options.md`).

## Résultat de la suite

```
node --test  (cli/, sans argument — cf. piège outillage § 0.1)
tests 1287
pass 1280
fail 0
cancelled 0
skipped 7
```

Rejoué deux fois à l'identique. `git status --porcelain` vide après chaque run (aucune écriture
hors bac à sable). Plancher hérité `1263/1262/0/1` dépassé en nombre de tests (1287 > 1263) et en
`fail` (0) ; le `skipped` (7 au lieu de 1) est un fait de ce worktree isolé, documenté et attribué
dans `docs/qualite/mesures-etape-0-registre-options.md` — pas une régression.

## Déviations et pourquoi

1. **`node --test test/` échoue sous Node v24.18.0** (§ 0.1) — outillage, pas le dépôt. Contourné
   par `node --test` (sans argument), qui redécouvre `test/` via `package.json`.
2. **Plancher de `skipped`** différent du chiffre hérité (7 vs 1) à cause de l'isolement du
   worktree (dépôt frère `iakaFrameGUI` absent) — documenté, pas corrigé (hors périmètre).
3. **Reformulation de la ligne de doc `repo`** (§ AR-R2, commit `95cebba`) : la première rédaction
   citait littéralement la sous-chaîne `--root` dans sa prose explicative (« pas... `--root` »),
   ce qui faisait mordre l'angle mort connu (b) de `docMentionneOption` (`includes` nu) et
   produisait un **faux positif** sur le balayage `--root` pour `repo`. Reformulée sans la
   sous-chaîne littérale dans le même commit qui a ouvert la boucle — aucun changement de sens,
   seulement de forme.
4. **Registre `couverture-options.json`** : structure neuve (pas de précédent exact dans le dépôt
   pour ce fichier précis), calquée sur `couverture-json.json` (mêmes principes : options
   balayées avec motif, hors-balayage motivé + successeur, cliquet de compte).

## Registre motivé — hors-balayage (AR-R4, `cli/test/fixtures/couverture-options.json`)

| Verbe | Option | Motif | Successeur |
|---|---|---|---|
| `assemble` | `--node` | parse sans être au registre, mesuré au cadrage | `REGISTRE-OPTIONS-BALAYAGE-COMPLET` |
| `assemble` | `--force` | parse sans être au registre | `REGISTRE-OPTIONS-BALAYAGE-COMPLET` |
| `assemble` | `--ascii` | parse sans être au registre | `REGISTRE-OPTIONS-BALAYAGE-COMPLET` |
| `observe` | `--portfolio` | parse ET documenté sans être au registre | `REGISTRE-OPTIONS-BALAYAGE-COMPLET` |
| `commands` | `--ascii` | parse ET documenté sans être au registre | `REGISTRE-OPTIONS-BALAYAGE-COMPLET` |
| `models` | `--binding` | parse ET documenté sans être au registre du sous-verbe | `REGISTRE-OPTIONS-BALAYAGE-COMPLET` |

`horsBalayageCount: 6`, cliquet gardé par `CA-R7` (2 contrefactuels en mémoire, jamais le fichier
réel).

## Angles morts redits (CA-R8, jamais levés)

(a) **Dérivation textuelle** : une ligne `parseArgs` neutralisée par `//` compte encore comme
« parsée » (hérité de `gate-c-json-j3.md:260-264`). Successeur : `GARDES-DERIVATION-PAR-AST`.
(b) **`docMentionneOption` fait un `includes` nu** : `--project` matcherait une ligne qui ne porte
que `--projects`. Non levé — la reformulation de la ligne `repo` (déviation 3 ci-dessus) contourne
un cas rencontré, elle ne répare pas le mécanisme.

## Aucune retouche hors périmètre

Vérifié par git diff : `cli/src/lib/verbes.js`, `docs/commandes.md`, `cli/src/index.js`
(uniquement lignes 110-111), `cli/test/temoins-prose.test.js` + fixtures, `cli/test/guard-json-couverture.test.js`,
`cli/test/fixtures/couverture-options.json`, `docs/qualite/mesures-etape-0-registre-options.md`,
`BACKLOG.md`, `specs/instructions/registre-options-root-path-projet.md` (cases à cocher). Aucune
ligne de `cli/src/commands/*.js` modifiée. Aucun guidage ne propose `--force`/`--yes`/`--cascade`.
`CLI-SEMANTIQUE-PROJECT-ET-ROOT`, `REGISTRE-OPTIONS-BALAYAGE-COMPLET`, `REGISTRE-GRAIN-SOUS-VERBE`
non traités (successeurs déjà nommés au cadrage).

## BACKLOG.md

Entrée ajoutée sous **« Ouverts »** (pas « Fait ») : « livré, en attente du gate Legolas ». Le
verdict PASS/FAIL solde, pas cette remise.
