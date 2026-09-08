# Mesures d'exécution — Étape 0 du lot `C-JSON-COUVERTURE-COMPLETE`

> Réalisé par ⚒️ Gimli le 2026-09-08, sur `specs/instructions/c-json-couverture-complete.md`.
> **Ceci est une mesure d'EXÉCUTION** (Node lancé en bac à sable), pas une lecture statique — elle
> **remplace** le § 0.3 du cadrage (fait par Gandalf sans shell, cf. § 0.1 de l'instruction) comme
> autorité. Là où les deux divergent, cette mesure fait foi et la divergence est nommée ci-dessous.

## Méthode

Dépôt vert AVANT toute modification (`cd cli && node --test` → **1191 tests, 1190 pass, 1 skip,
0 fail**, cf. § « Non-régression »). Chaque verbe déclarant `--json` (+ `config`, l'écart connu) a
été exécuté en bac à sable
(`/private/tmp/.../scratchpad/gimli-cjson/{home,proj,root,empty,library,gui}`), `--dry-run` quand
le verbe écrit, réseau réputé injoignable (`127.0.0.1:1`, `--timeout 1`). Les 11 verbes qui ne
déclarent PAS `--json` ont aussi été exécutés avec `--json` en argument, pour confirmer (ou
infirmer) qu'ils le **rejettent** plutôt que de l'**accepter en silence**.

## Table des 29 verbes mesurés (28 déclarants + `config`)

| Verbe (invocation) | JSON valide | Racine objet | `ok` 1ʳᵉ clé | `count` juste | stderr vide | exit |
|---|---|---|---|---|---|---|
| `install --dry-run --json --yes` | oui | oui | oui | oui (`evenements`) | oui | 0 |
| `services --hosts 127.0.0.1 --timeout 1` | oui | oui | oui | oui (`services`) | oui | 0 |
| `canaux --path <vide> --timeout 1` (erreur : pas un dépôt git) | oui | oui | oui | — | oui | 1 |
| `endpoints --url http://127.0.0.1:1/x --timeout 1` | oui | oui | oui | oui (`essais`) | oui | 0 |
| `config --path <proj>` | oui | oui | oui | — (ressource) | oui | 0 |
| `agents list` | oui | oui | oui | oui (`personas`) | oui | 0 |
| `agents status --project <proj>` | oui | oui | oui | oui (`personas`, 0) | oui | 0 |
| `skills --project <proj>` | oui | oui | oui | oui (`skills`) | oui | 0 |
| `models` (top-level) | oui | oui | oui | oui (`targets`) | oui | 0 |
| `list` | oui | oui | oui | oui (`collections`) | oui | 0 |
| `list personas` | oui | oui | oui | oui (`items`) | oui | 0 |
| `show gandalf` | oui | oui | oui | — (ressource) | oui | 0 |
| `add` (usage, sans args) | oui | oui | oui | — (erreur) | oui | 1 |
| `remove` (usage) | oui | oui | oui | — (erreur) | oui | 1 |
| `attach` (usage) | oui | oui | oui | — (erreur) | oui | 1 |
| `detach` (usage) | oui | oui | oui | — (erreur) | oui | 1 |
| `assemble iakaframe iakaframe-8` | oui | oui | oui | — (ressource) | oui | 0 |
| `vendor-check --gui <vide existant>` (DRIFT) | oui | oui | oui | oui (`count`=`files.length`) | oui | **1** |
| `vendor-check --strict --gui <vide existant>` (DRIFT) | oui | oui | oui | oui | oui | 1 |
| `vendor-check` avec `IAKAFRAME_GUI_ROOT=<absent>` (**ABSTENTION**) | oui | oui | oui | oui (0) | oui | **0** |
| `vendor-check --strict` avec `IAKAFRAME_GUI_ROOT=<absent>` (abstention promue) | oui | oui | oui | — | oui | 1 |
| `frame verify` | oui | oui | oui | **non** — pas de `count` (voir Écart 2) | oui | 0 |
| `frame lint --all` | oui | oui | oui | oui (`count`=`findings.length`) | oui | 0 |
| `frame new --root <jetable>` (usage, sans id) | oui | oui | oui | — (erreur) | oui | 1 |
| `frame use --path <proj> --root <jetable>` (usage, sans id) | oui | oui | oui | — (erreur) | oui | 1 |
| `switch` (usage, sans args) | oui | oui | oui | — (erreur) | oui | 1 |
| `memory init/path/config/list --home <jetable>` | oui | oui | oui | oui (`entries`/`created`) | oui | 0 |
| `produit init/path/config/list --project <proj>` | oui | oui | oui | oui (`entries`) | oui | 0 |
| `open --home <jetable>` | oui | oui | oui | — (ressource) | oui | 0 |
| `recall requete-absente --home <jetable>` | oui | oui | oui | oui (`results`, 0) | oui | 0 |
| `close --home <jetable>` | oui | oui | oui | — (ressource) | oui | 0 |
| `review list --home <jetable>` | oui | oui | oui | oui (`proposals`, 0) | oui | 0 |
| `review show --home <jetable>` (sans id, erreur) | oui | oui | oui | — (erreur) | oui | 1 |
| `consolidate --home <jetable>` | oui | oui | oui | — (ressource) | oui | 0 |
| `observe list --home <jetable>` | oui | oui | oui | oui (`files`) | oui | 0 |
| `portfolio --root <vide>` | oui | oui | oui | oui (`projects`, 0) | oui | 0 |
| `range all --dry-run --root <vide>` (erreur : réseau restic injoignable, attendu hors LAN) | oui | oui | oui | — (erreur) | oui | 1 |
| `commands` | oui | oui | oui | oui (`verbes`) | oui | 0 |

## Les 11 verbes NE déclarant PAS `--json` — confirmation de non-parse

`onboard`, `init`, `snapshot`, `update`, `repo`, `go`, `banner`, `brief`, `recap`, `jalon` : chacun
**rejette** `--json` par une exception `ERR_PARSE_ARGS_UNKNOWN_OPTION` (stderr = trace Node, stdout
vide, exit 1) — confirmé non déclaré, non parsé, comme prévu au § 0.3.

`root` fait exception : il n'appelle **aucun** `parseArgs` (implémentation inline dans `index.js`,
scan manuel de `--root <valeur>`) et **ignore silencieusement** tout argument qu'il ne reconnaît
pas, dont `--json` — il imprime sa prose habituelle (`/Users/…`), exit 0. **Ce n'est PAS le cas
« accepté-et-ignoré » que l'étape 0 devait guetter** : `root` ne **déclare** `--json` nulle part
(ni registre, ni `--help`, ni doc), donc aucune promesse n'est faite puis trahie — c'est une
absence de promesse, exactement la catégorie que le § 4 « Exclu » de l'instruction protège
explicitement (`root` y est nommément cité). Signalé pour mémoire, aucune action.

## Verdict sur l'inconnue n°1 (§ 0.1, § 5 étape 0)

**Aucun verbe accepté-et-ignoré trouvé.** Les 28 verbes déclarant `--json` au registre le parsent
tous et l'émettent tous par `lib/output.js` — confirmé par exécution, pas seulement par lecture.
**Le § 2 du cadrage tient : ce lot est un lot de PREUVE, pas de comportement.** Aucun retour à
Gandalf n'est nécessaire.

## Écarts constatés par l'exécution (au-delà de la lecture § 0.3)

1. **`config`** — confirmé exactement comme lu : parse + émet + déjà testé, mais absent du
   registre et de la doc avant ce lot. **Corrigé** (commit `fix(json): config declare`).
2. **`frame verify` ne porte pas de `count` frère de `findings`** (règle 3 du contrat, lecture
   stricte). `frame lint --all`, lui, le fait correctement (`count = findings.length`, commentaire
   explicite dans le code). C'est une **imperfection mineure et PRÉEXISTANTE** à ce lot (le verbe
   date d'un autre lot déjà livré) : la corriger changerait un comportement observable d'un verbe
   déjà en production hors du périmètre de ce lot (§ 2 : « toute modification de production est une
   exception... limitée à la non-conformité prouvée » — et le § 4 exclut explicitement
   l'harmonisation de vocabulaire/forme entre verbes). **Non corrigé, signalé pour un successeur**
   (`C-JSON-VOCABULAIRE` ou un lot dédié à `frame verify`). L'entrée `NOMINAL` de ce lot enregistre
   `frame verify` avec `collKey: null` (rapport à plat), fidèle à ce qui existe réellement.
3. **`vendor-check --gui <répertoire vide existant>` rend `DRIFT`, jamais `SKIPPED`, même sans
   `--strict`** — `checkVendor` ne teste que la **vérité** de la chaîne `gui` passée par `--gui`,
   jamais son existence sur disque ; seule l'absence du **paramètre** `--gui` (résolution par
   `IAKAFRAME_GUI_ROOT`/candidats implicites) peut produire `SKIPPED`. Ceci affine — sans le
   contredire — le § 0.3 point 4 : l'abstention existe bel et bien et porte déjà `status`
   (`vendor.js:255-262`), mais son déclenchement exact (absence de `--gui` ET résolution vide) est
   plus étroit que ce qu'une lecture rapide de `--gui <tmp>` suggère. Vérifié : la garde de la
   règle 6 (`CA-J4`) invoque le VRAI chemin d'abstention (`IAKAFRAME_GUI_ROOT` pointant vers un
   répertoire absent, sans `--gui`).
4. **`agents` et `skills` honorent et (pour `agents`) testent déjà `--json`, mais n'étaient PAS
   documentés dans `docs/commandes.md`** — trouvé par la garde de dérivation G-J2 (pas par la
   lecture du § 0.3, qui n'avait examiné que `config`). Même défaut que `config`, à la même échelle
   (documentation manquante, zéro changement de comportement) : **corrigé dans le même commit que
   G-J2** pour que la garde parte verte (`agents` gagne `--json` sur sa ligne, `skills` gagne une
   ligne qui n'existait pas du tout).

## Comptes qui commandent le lot (confirmés)

```
$ grep -c "^    id: '" cli/src/lib/verbes.js       → 40
$ grep -c "'--json'" cli/src/lib/verbes.js         → 57 (58 après l'ajout de config)
$ node -e "…couverture-json.json…"                 → horsCouvertureCount=14, verbes.length=28
                                                      (29 après l'ajout de config)
```

## Non-régression (avant toute modification)

```
$ cd cli && node --test test/
ℹ tests 1191
ℹ pass 1190
ℹ fail 0
ℹ skipped 1
```

Dépôt vert, arbre propre, avant la première ligne de ce lot.
