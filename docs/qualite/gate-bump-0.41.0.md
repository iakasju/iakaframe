# Gate qualité — bump 0.41.0 (`chore/bump-0.41.0`) — 2026-09-06

## Verdict : PASS

Branche `chore/bump-0.41.0` (6 commits Gimli au-dessus de `main` @ `3baf20e` : `0557613`,
`3af849e`, `0272527`, `7f98b2c`, `2a320d2`, `a61e475`). Suite verte, source de version unique
alignée, témoin CA-M8 conforme au périmètre annoncé, dérivation des fixtures vérifiée par
contrefactuel, renommage AR-W20 sans effet de bord, tarball conforme, notes/tagmsg exactes et
jouables, aucun tag posé, `main` intacte.

Deux écarts signalés, **non bloquants** (§ Écarts).

## Mesures

| # | Commande | Code de sortie | Résumé cité |
|---|---|---|---|
| 1 | `node --test` (racine du dépôt) | `0` | `tests 1161 / pass 1160 / fail 0 / cancelled 0 / skipped 1 / todo 0` |
| 1b | `node --test cli/test/guard-version-source-unique.test.js` | `0` | `tests 18 / pass 18 / fail 0` — G1, G3, G4, G5 toutes vertes |
| 2a | `cat cli/package.json` (ligne 3) | — | `"version": "0.41.0"` |
| 2b | `node cli/scripts/vitrine.js --write` (rejoué sur copie isolée `scratchpad/readme-check`) + `diff` | `0` | `vitrine : README deja a jour (v0.41.0).` puis `diff` vide (README identique à la régénération) |
| 2c | `grep "Version CLI documentée" docs/commandes.md` (ligne 12) | — | `` `@naonedge/iakaframe` **v0.41.0** (source : `cli/package.json`) `` |
| 2d | `node cli/src/index.js -v` | `0` | `0.41.0` |
| 3 | `git diff 3baf20e..HEAD -- cli/test/fixtures/install-prose-dry-run.txt` | — | exactement 5 substitutions `0.40.0`→`0.41.0`, voir § Témoin CA-M8 |
| 3b | Contrefactuel `_bundled/VERSION` stale à `0.40.0` (copie isolée `scratchpad/stale-bundled`), `node --test cli/test/install-prose-non-regression.test.js` | `1` | mot **« égalité »** devient **« plus récent »** — `réservoir : vivant <VIVANT> (v0.41.0) — embarqué v0.40.0, plus récent, le vivant l'emporte` ; le test CA-M8 rougit nommément |
| 3c | Clone frais SANS `_bundled/` du tout (copie isolée `scratchpad/no-bundled`), même test | `0` | `tests 5 / pass 5 / fail 0` — fallback sur `packageVersion()`, égalité rétablie |
| 4 | Contrefactuel `cli/package.json` muté à `9.9.9` (copie isolée `scratchpad/mutate999`), `node cli/src/index.js -v` | `0` | `9.9.9` — `-v` suit l'autorité |
| 4b | même copie, `node --test cli/test/install-prose-non-regression.test.js` | `1` | `tests 5 / pass 4 / fail 1` — seul CA-M8 (témoin figé) rougit ; CA-M9 (×3) et le test croisé restent verts |
| 5 | `git grep -n "AR-W20" -- . ':!docs/qualite' ':!specs/etat-des-lieux.md'` | `0` | 5 occurrences, **toutes** historiques : `specs/.iakaframe-journal.json` (journal append-only) + `specs/etat-des-lieux.html` (citation verbatim de 4 anciens messages de commit) — aucune dans le code, les tests ou la doc vivante |
| 5b | `git diff 3af849e..7f98b2c -- cli/src` | — | limité à des commentaires + une chaîne de message `raison` (rollback.js) ; voir § Renommage AR-W20 |
| 5c | `node --test` rejoué à `0272527` (avant renommage) et `7f98b2c` (après), worktree isolé | `0`/`0` | `1161/1154/0/7` aux deux commits (identique ; les 6 skips supplémentaires vs HEAD sont un artefact de localisation du worktree — sibling `iakaFrameGUI` absent — pas une régression) |
| 6 | `git grep -n "0\.40\.0"` (hors `docs/qualite`, journal, `docs/releases`) | — | 10 occurrences balayées — toutes datées/historiques (`BACKLOG.md`, réf. à un gate figé) ou littéraux arbitraires de test (`reservoir-ar-f.test.js`, `sources-ordonnees-ar-h.test.js` : données de scénario, pas une version courante annoncée) ; **aucune** n'annonce 0.40.0 comme version courante |
| 7a | `git cat-file -t c34fe75 69bc68e e34c1af 610c2bd` + `git merge-base --is-ancestor` | `0`×4 | les 4 hashes existent (`commit`) et sont tous ancêtres de `main` |
| 7b | `gh run view 33997947501 --repo iakasju/iakaframe --json …` | — | `conclusion:"failure"` global, `banc (ubuntu-latest)` `success`, `banc (windows-latest)` `failure` sur le seul step `Mesures reelles Windows (etapes 3/4)` — conforme au récit (« Linux 100 % vert, Windows vert sauf les rollbacks ») |
| 7c | `gh run view 33999564308 --repo iakasju/iakaframe --json …` + `--log \| grep PASS\|NON-MESURE` | — | `conclusion:"success"`, 2 jobs verts ; log : **15 lignes `✅ PASS`** + **1 ligne `⚪ NON-MESURE`** (UAC compte non-admin) = 16 mesures, exactement ce qu'annoncent les notes |
| 7d | `git tag -a legolas-test-tagmsg-check -F docs/releases/v0.41.0.tagmsg` puis `git tag -v` puis `git tag -d` | `0` | tag jouable sans erreur, message lu intégralement, tag jetable supprimé aussitôt |
| 7e | `git tag -l v0.41.0` | — | (vide) |
| 8 | `npm pack --pack-destination …` (copie isolée `scratchpad/npm-pack-check`) | `0` | `filename: naonedge-iakaframe-0.41.0.tgz`, `total files: 552` |
| 8b | extraction + vérifs | — | `package/_bundled/install.mjs` présent, `package/_bundled/kits/**` présent, `package/_bundled/VERSION` = `v0.41.0`, `node package/src/index.js -v` = `0.41.0` |
| 8c | `node cli/scripts/vitrine-en-ligne.js` | `1` | `2 ecart(s)` — `E-2 : le README annonce v0.41.0, GitHub presente v0.40.0 … Ce rouge est VOULU — il informe, il est HORS gate et ne bloque aucun lot.` / `E-3 : la release v0.41.0 … N'EXISTE PAS …` — mécanisme L42 attendu |
| 9a | `node --test cli/test/install-contrat-machine.test.js` | `0` | `tests 24 / pass 24 / fail 0` |
| 9b | `node --test cli/test/install-etapes-3-4.test.js cli/test/app-bundle.test.js cli/test/rollback.test.js cli/test/install-contrat-machine.test.js` | `0` | `tests 97 / pass 97 / fail 0` (combiné) |
| 9c | `git tag -l v0.41.0` | — | (vide) |
| 9d | `git log --oneline -1 main` | — | `3baf20e` (inchangé) |
| 9e | `git status --porcelain` (avant clôture, hors ce rapport) | — | (vide, arbre propre ; `cli/_bundled/` correctement ignoré) |

## Témoin CA-M8 — diff cité intégralement

`git diff 3baf20e..HEAD -- cli/test/fixtures/install-prose-dry-run.txt` :

```diff
-[1/4] CLI — mise à jour (poste déjà équipé, AR-G) : version courante v0.40.0
-  réservoir : vivant <VIVANT> (v0.40.0) — embarqué v0.40.0, égalité, le vivant l'emporte
+[1/4] CLI — mise à jour (poste déjà équipé, AR-G) : version courante v0.41.0
+  réservoir : vivant <VIVANT> (v0.41.0) — embarqué v0.41.0, égalité, le vivant l'emporte
   sources réseau (AR-H) consultées :
     - DOUBLE-TEST (cli/test/fixtures/install-network-double.mjs) : sonde toujours injoignable : injoignable
-  déjà à jour (v0.40.0) — rien à installer.
+  déjà à jour (v0.41.0) — rien à installer.

   [garde AR-1/AR-4] AR-1 désarmé pour la durée de la chaîne (corollaire AR-1/AR-4, § 5.5) : le kit hôte reste absent jusqu'à validation explicite de l'étape 2

 [2/4] méthode — délégation à install.mjs (M4, non réimplémenté)
   quoi : kit(s) hôte(s) [claude] depuis <VIVANT>/kits
   où : <CLAUDE>
-  quelle version : v0.40.0
+  quelle version : v0.41.0
   ce qui sera fusionné : --merge par défaut (rien d'existant n'est écrasé sans --overwrite)
```

Constat : le diff se réduit **exactement** à 5 substitutions `0.40.0` → `0.41.0`, toutes situées
aux points où le verbe imprime la version courante. Aucune ligne ajoutée, retirée ou reformulée.
**Conforme** à l'annonce de Gimli.

### Affirmation « sans rebundle, le mot « égalité » devient « plus récent » » — VÉRIFIÉE VRAIE

Rejoué sur copie isolée avec `cli/_bundled/VERSION` figé à `v0.40.0` (stale, non rebundlé après le
bump de `cli/package.json` à `0.41.0`) : la ligne de provenance devient littéralement
`réservoir : vivant <VIVANT> (v0.41.0) — embarqué v0.40.0, plus récent, le vivant l'emporte` — le
mot **« égalité »** a bien été remplacé par **« plus récent »**, et le test CA-M8 rougit en
citant la ligne exacte. Après rebundle (VERSION réalignée à `0.41.0`), le mot « égalité » revient
et le test repasse vert.

**Dépendance à un état non versionné de `_bundled/` — le témoin en dépend, mais le cas couvert par
la mission (clone frais) reste sûr.** `cli/_bundled/` est gitignoré (`cli/.gitignore:3`) : sur un
clone frais il est **totalement absent**, et `embarqueInfo()` (`cli/src/lib/reservoir.js:47-55`)
bascule alors sur `packageVersion()` — j'ai vérifié ce cas isolément (`scratchpad/no-bundled`) :
`install-prose-non-regression.test.js` reste **vert** (5/5), fallback conforme. Le risque réel
n'est donc pas le clone frais mais la **machine de développement locale** : si un développeur a
bundlé une fois (ex. avant un précédent `npm pack`) puis bumpé `package.json` sans relancer
`bundle.js`, `cli/_bundled/VERSION` reste stale et **CA-M8 rougit sans rapport avec une régression
réelle du code** — un faux négatif de gate. `install-prose-non-regression.test.js` ne se prémunit
pas de ce cas : il n'appelle jamais `bundle.js` ni n'utilise le point d'injection
`embarqueDir`/`embarqueDirParam` déjà prévu dans `resoudreReservoir()` (AR-J, `reservoir.js:141`
et suivants) pour contrôler l'embarque de façon déterministe — il laisse `embarqueDir()` résoudre
l'ambiant réel du dépôt. **Écart nommé en § Écarts** (non bloquant : CI tourne toujours depuis un
clone frais, donc reproductible en pratique pour ce gate).

## Dérivation des fixtures (`3af849e`) — couple de comportements vérifié

Contrefactuel : `cli/package.json` muté à `9.9.9` sur copie isolée (`scratchpad/mutate999`).

- `node cli/src/index.js -v` → `9.9.9` (suit l'autorité, comme attendu).
- `node --test cli/test/install-prose-non-regression.test.js` → `tests 5 / pass 4 / fail 1` :
  - **Vert, sans intervention** : les 3 tests CA-M9 (empreinte disque avant/après, `--dry-run` /
    `--events` / `--json`) et le test croisé CA-M8 (absence de fuite NDJSON) — parce que
    `faireReservoirVivant()` dérive désormais `version = packageVersion()` (c'est tout l'objet de
    `3af849e`) au lieu d'un littéral figé ; ils suivent l'autorité sans qu'aucun code ne soit
    retouché.
  - **Rouge, nommément** : le seul test CA-M8 qui compare au **témoin figé**
    (`install-prose-dry-run.txt`) — attendu, puisque ce témoin gèle intentionnellement le texte
    exact d'une version particulière (`0.41.0`) ; muter l'autorité sans re-figer le témoin est
    précisément le cas que ce test existe pour détecter. Le diff cité nomme la ligne
    (`quelle version : v9.9.9` vs `v0.41.0`).

C'est le comportement décrit par la mission : la dérivation évite la dérive silencieuse des
fixtures « suiveuses », sans désarmer le témoin figé qui doit, lui, continuer à réagir à tout
changement de version non accompagné d'un re-enregistrement volontaire.

## Renommage AR-W20 → AR-W5(a) (`7f98b2c`)

- `git grep -n "AR-W20"` hors `docs/qualite/`, `specs/etat-des-lieux.md` → 5 occurrences restantes,
  **toutes historiques** : `specs/.iakaframe-journal.json:950` (entrée de journal append-only,
  narrant l'écart de méthode lui-même — ne doit pas être réécrite) et 4 lignes de
  `specs/etat-des-lieux.html` qui **citent verbatim d'anciens messages de commit** déjà mergés
  avant le renommage (`efaf242`, `a1bb520`, `fdebbd8`, `1499b4e`) — réécrire ces citations
  reviendrait à falsifier l'historique affiché, ce que je ne recommande pas. Le grep hors code/
  tests/doc vivante est donc **net**.
- `git diff 3af849e..7f98b2c -- cli/src` : limité à des commentaires **sauf une ligne** —
  `cli/src/lib/rollback.js`, le message `raison` retourné par `restaurerEtape` en cas d'échec de
  confirmation (`"... garde 3, AR-W20"` → `"... garde 3, AR-W5(a), précision uninstall synchrone"`).
  C'est une chaîne de **production**, pas un simple commentaire. J'ai vérifié qu'aucun test ne
  l'exerce par égalité ou correspondance sur ce fragment précis (`cli/test/rollback.test.js`,
  `cli/test/install-etapes-3-4.test.js` : les `assert.match` portent sur
  `/cle de desinstallation confirmee disparue/` et `/RESIDU NON RETABLI/`, jamais sur le sigle) —
  donc aucun changement de comportement testé, mais le message qu'un opérateur verrait réellement
  à l'écran en cas d'échec de rollback Windows a changé de texte. Noté en § Écarts (cosmétique).
- Suite complète rejouée aux deux bornes (worktree isolé) : `0272527` (avant) → `1161/1154/0/7` ;
  `7f98b2c` (après) → `1161/1154/0/7`. Identique, `fail:0` aux deux points.

## Écarts

### Non bloquant — témoin CA-M8 non hermétique face à un `_bundled/` local stale

- **Où** : `cli/test/install-prose-non-regression.test.js` (fonction `run()`, invoque le CLI réel
  sans contrôler `embarqueDir`).
- **Constat** : sur un clone strictement frais (`_bundled/` absent, cas réel de CI), le témoin est
  reproductible — vérifié. Sur une machine de développement où `cli/_bundled/` existe mais est
  stale (bundlé avant un bump de version non suivi d'un rebundle), le test rougit pour une raison
  sans rapport avec une régression de code, en confondant « prose changée » et « artefact de build
  périmé ».
- **Recommandation** (non bloquante pour ce gate) : faire porter à ce test un `embarqueDir`
  contrôlé via le point d'injection déjà existant (AR-J, `resoudreReservoir({ embarqueDir })`) ou
  appeler `bundle.js` en amont, pour rendre le témoin insensible à l'état ambiant de `_bundled/`.

### Non bloquant — message `raison` de rollback Windows changé de texte (sigle) sans couverture de test dédiée

- **Où** : `cli/src/lib/rollback.js`, ligne du message d'échec de confirmation (« garde 3,
  AR-W20 » → « garde 3, AR-W5(a), précision uninstall synchrone »), introduit par `7f98b2c`.
- **Constat** : changement de contenu d'un message que verrait un opérateur en cas d'échec réel de
  rollback Windows. Aucun test n'assertait sur le sigle avant ni après — le geste ne casse rien,
  mais un renommage de sigle dans une chaîne de production (pas un commentaire) mériterait d'être
  nommé comme tel dans le message de commit plutôt que sous « aucun changement de comportement ».
  Effet cosmétique uniquement, confirmé sans impact sur la suite.

Aucun autre écart. Pas de FAIL.

## Non-régression

- Contrat machine : `24/24`.
- Étapes 3/4 + app-bundle + rollback (combiné) : `97/97`.
- `main` intacte à `3baf20e`.
- Aucun tag `v0.41.0` posé.
- Arbre de travail propre à la clôture (`git status --porcelain` vide, `cli/_bundled/` correctement
  ignoré, aucun résidu de copie isolée dans le dépôt — toutes les manipulations contrefactuelles
  ont eu lieu sous `scratchpad/`).

## Reproduction (en cas de contestation)

```bash
git checkout chore/bump-0.41.0
node --test                                             # 1161/1160/0/1
node --test cli/test/guard-version-source-unique.test.js  # 18/18
node --test cli/test/install-contrat-machine.test.js       # 24/24
node cli/src/index.js -v                                # 0.41.0
node cli/scripts/vitrine-en-ligne.js                    # exit 1, E-2/E-3 attendus (L42)
git diff 3baf20e..HEAD -- cli/test/fixtures/install-prose-dry-run.txt
git grep -n "AR-W20" -- . ':!docs/qualite' ':!specs/etat-des-lieux.md'   # historique seul
gh run view 33997947501 --repo iakasju/iakaframe --json status,conclusion,jobs
gh run view 33999564308 --repo iakasju/iakaframe --json status,conclusion,jobs
```
