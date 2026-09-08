# Gate qualité — CI-RELEASE-LATEST-NON-MAITRISE (`fix/ci-release-latest`) — 2026-09-08

## Statut : REMIS AU GATE — ⚒️ Gimli ne s'auto-valide pas

Ce document consigne les **mesures faites** par ⚒️ Gimli pendant l'implémentation (§ 5.0 de
`specs/instructions/ci-release-latest-non-maitrise.md`) et l'état de la chaîne qualité au moment
de la remise. **Le verdict PASS/FAIL appartient à 🏹 Legolas**, jamais à l'agent qui a codé.

Branche `fix/ci-release-latest` au-dessus de `main` @ `a1e0072`. Commits : `c6c9ae9` (`test(ci):`,
rouge volontaire), `2392bd9` (`fix(ci):`, AR-1/AR-2/AR-4), puis commits de récit/registre/backlog.

## Étape 0 — mesures dues avant tout correctif (§ 5.0)

| # | Mesure | Résultat cité |
|---|---|---|
| CA-L1 (cliquet) | `gh run view --job 101401920072 --repo iakasju/iakaframe --log` (run `34001818646`, v0.41.0) | `DECISION : v0.41.0 n'est PAS le plus haut (v0.40.0) -> make_latest=false.` puis `make_latest: false` — **confirme § 2.1, cliquet levé** |
| 0.2 | même étape, run `33959443438` (v0.40.0) | `DECISION : v0.40.0 n'est PAS le plus haut (v0.39.0) -> make_latest=false.` — même mécanisme |
| Contrefactuel § 2.2 | run `33635520511` (v0.39.0, avant fix R-2) | `DECISION : v0.39.0 EST le plus haut -> make_latest=true` — la régression est datée, pas générale |
| 0.4 | `gh api repos/iakasju/iakaframe/releases` + `.../releases/latest` | 4 releases (v0.41.0, v0.40.0, v0.39.0, v0.20.4), `latest` = `v0.41.0` (déjà rattrapé manuellement par Aragorn avant ce lot) |
| 0.5 | `gh api repos/<action>/git/ref/tags/<tag>` ×3 | `actions/checkout@11d5960a…` (40c), `actions/setup-node@49933ea5…` (40c), `softprops/action-gh-release@3bb12739…` (40c) — les trois objets sont de type `commit`, aucun tag annoté à déréférencer |
| 0.6 | lecture `action.yml` de `softprops` au SHA retenu | `make_latest` : « Can be `true`, `false`, or `legacy`… », pas de `default:` YAML — type **chaîne** ; `prerelease` : « Defaults to false », non fourni par ce workflow |
| 0.7 | lecture seule `IakaCockpit`/`iakaFrameGUI` `.github/workflows/release.yml` | architecture 3 jobs (`prepare`/`build`/`latest`) : le job `latest` tourne **après** `build`, donc la population de releases contient déjà le tag courant — **la régression du § 2.1 n'y est PAS présente** ; aucun successeur à nommer pour elles |
| 0.8 | `bash --version` / `jq --version` / `node --version` | bash 3.2.57(1), jq-1.7.1-apple, node v24.18.0 — jambe d'exécution AR-5 jouable, aucun SKIP nécessaire sur ce poste |

## Rouge puis vert (§ 5.1/5.5)

- Commit `c6c9ae9` : jambe d'exécution posée **contre le texte non corrigé** → `node --test
  cli/test/release-latest-shell.test.js` : `tests 29 / pass 21 / fail 8`. Les 8 échecs :
  CA-L2 nominal, CA-L4 nominal, et CA-L6 ×6 (3 actions × {SHA40, cliquet}) — exactement ce qui
  n'était pas encore corrigé.
- Commit `2392bd9` : correctif AR-1(a)/AR-2(a)/AR-4(a) → même commande : `tests 29 / pass 29 /
  fail 0`.

## Chaîne qualité (§ 5.9)

| Commande | Code | Résumé |
|---|---|---|
| `node --test` (depuis `cli/`) | `0` | `tests 1191 / pass 1190 / fail 0 / cancelled 0 / skipped 1 / todo 0` (entrée : 1162/1161/0/1 — **+29 tests, aucun supprimé**) |
| `npm run vitrine:check` | `0` | `vitrine : OK — README aligne sur v0.41.0.` |
| `npm run vitrine:en-ligne` (hors gate, informatif) | `0` | `vitrine:en-ligne : OK — la vitrine et l'etagere concordent.` (latest anon = v0.41.0, cohérent avec le rattrapage déjà appliqué avant ce lot) |
| `npm run registre:repli-latest` | `1` | **voir § Écart ci-dessous — non imputable à ce lot** |

## Écart signalé — `registre:repli-latest` ne peut PAS atteindre `0` globalement

Le registre était **déjà rouge avant tout commit de ce lot** (vérifié sur `main` @ `a1e0072`,
avant `git checkout -b`), pour trois causes **hors périmètre de ce lot** :

1. **Pollution de balayage** : un `git worktree` réel mais orphelin,
   `iakaframe/.claude/worktrees/agent-ad0d5f08878d103e5/` (`git worktree list` le confirme),
   contient une copie ancienne des fichiers du dépôt ; le balayeur du registre ne l'exclut pas
   (`balayage.exclus` ne connaît pas `.claude`), donc ses fichiers sont comptés comme des
   « fichiers neufs » du dépôt `iakaframe`.
2. **Dette pré-existante non triée**, présente sur `main` avant ce lot : `specs/etat-des-lieux.md`,
   les documents de cadrage de `specs/instructions/` (dont `ci-release-latest-non-maitrise.md`
   lui-même — un document de cadrage, hors écriture pour ⚒️ Gimli), `cli/src/commands/install.js`,
   `docs/releases/v0.41.0.md`.
3. **Dérive dans les dépôts jumeaux** (`IakaCockpit`, `iakaFrameGUI`) : `--ecrire` échoue même sur
   ses propres re-ancrages avec **« RIEN N'A ETE ECRIT »**, car il refuse tout écriture tant que
   38 ancres de `scripts/vitrine-en-ligne.mjs` (les deux dépôts) pointent au-delà de la fin d'un
   fichier qui a raccourci à 113 lignes — un défaut **de ces deux dépôts**, hors étanchéité (« Gimli
   n'écrit que dans le repo courant », § 4 Exclu de l'instruction : « Toute modification des deux
   dépôts jumeaux … hors périmètre »).

**Ce qui EST du ressort de ce lot, et qui EST fait** : les **cinq fichiers touchés ou créés**
(`.github/workflows/release.yml`, `BACKLOG.md`, `cli/scripts/vitrine-en-ligne.js`,
`cli/scripts/lib/release-shell.js`, `cli/test/release-latest-shell.test.js`) sont **tous tenus à
`0` dérive** dans le registre — vérifié en filtrant la sortie du script sur ces cinq chemins
(aucune ligne). Le reste (points 1-3 ci-dessus) est un **successeur nommé au `BACKLOG.md`**
(§ Récit), pas traité ici.

## Fichiers livrés

- `.github/workflows/release.yml` — AR-1(a)/AR-2(a)/AR-4(a), cartouche daté (6e écriture).
- `cli/scripts/lib/release-shell.js` — extracteur + faux `gh` + patron d'épinglage (module pur).
- `cli/test/release-latest-shell.test.js` — jambe d'exécution, 29 tests.
- `cli/fixtures/actions-pin.json` — cliquet d'épinglage (SHA + sha256 + contrat `make_latest`).
- `cli/fixtures/registre-repli-latest.json` — re-ancré et trié pour les 5 fichiers ci-dessus.
- `cli/scripts/vitrine-en-ligne.js` — E-1 rectifié, daté.
- `BACKLOG.md` — cause mesurée, `CI-RELEASE-AUCUN-EPINGLAGE` soldé, gates humains nommés.

## Gates humains restants (non couverts, § 8 de l'instruction)

CA-L11 (pousser `v0.41.1-rc.1`), CA-L12 (pousser le prochain tag réel, LA preuve du lot),
CA-L13 (sort de la `rc`) — commandes exactes dans `BACKLOG.md`, section
`CI-RELEASE-LATEST-NON-MAITRISE`. **Aucun agent ne pousse de tag.**
