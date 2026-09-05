# Gate qualité — bump 0.40.0 (`chore/bump-0.40.0`) — 2026-09-05

## Verdict : PASS

Branche `chore/bump-0.40.0` (6 commits Gimli au-dessus de `main` @ `403971e` : `4de10c8`,
`1aae447`, `eebd075`, `5c7ed64`, `12da3e1`, `fed4b8f`). Suite verte, source de version unique
alignée, tarball conforme, notes de release exactes, aucun tag posé, `main` intacte.

Un seul écart signalé, **non bloquant** (§ Écarts).

## Mesures

| # | Commande | Code de sortie | Résumé cité |
|---|---|---|---|
| 1 | `cd cli && node --test` | `0` | `tests 1098 / pass 1097 / fail 0 / cancelled 0 / skipped 1 / todo 0` |
| 1b | `cd cli && node --test test/guard-version-source-unique.test.js` | `0` | `tests 18 / pass 18 / fail 0` — G1, G3, G4, G5 toutes vertes |
| 2a | `cat cli/package.json` (ligne 3) | — | `"version": "0.40.0"` |
| 2b | `node cli/scripts/vitrine.js --write` (rejoué sur copie isolée) + `diff README.md` | `0` | `vitrine : README deja a jour (v0.40.0).` puis `diff` vide (README commité **identique** à la régénération) |
| 2c | `grep "Version CLI documentée" docs/commandes.md` (ligne 12) | — | `` `@naonedge/iakaframe` **v0.40.0** (source : `cli/package.json`) `` |
| 2d | `node cli/src/index.js -v` | `0` | `0.40.0` |
| 2e | `grep "^| Version" specs/etat-des-lieux.md` (source de `frameworkVersion()`) | — | `| Version | v0.40.0 |` |
| 3 | `git grep -n "0\.39\.0" -- . ':!*_bundled*' ':!*node_modules*'` | — | 43 occurrences balayées ligne à ligne — **toutes** datées/historiques (journal append-only, gates figés, instructions closes) ou arbitraires de scénario de test (fixtures d'anciennes versions). **Aucune** n'annonce 0.39.0 comme version courante. |
| 4a | `npm pack --pack-destination …` (copie isolée du dépôt complet, hors `cli/` seul) | `0` | `filename: naonedge-iakaframe-0.40.0.tgz`, `total files: 552` |
| 4b | `tar -tzf naonedge-iakaframe-0.40.0.tgz \| grep _bundled` | — | `package/_bundled/install.mjs` présent, `package/_bundled/kits/**` présent (110 entrées), `package/_bundled/VERSION` présent |
| 4c | `tar -xzOf … package/_bundled/VERSION` | — | `v0.40.0` |
| 4d | `node package/src/index.js -v` (depuis l'extraction) | `0` | `0.40.0` |
| 5a | `git cat-file -t e9bfdc0 f2395f0 efe195c 403971e` + `git merge-base --is-ancestor <h> main` | `0` | les 4 hashes existent (`commit`) et sont tous ancêtres de `main` |
| 5b | `grep "'install'" cli/src/lib/verbes.js` (options du verbe `install`) | — | `--dry-run`, `--json`, `--events`, `--feu-vert refus\|stdin` tous présents |
| 5c | `node cli/src/index.js install --dry-run --json --root <repo> --target-claude /tmp/nowhere-claude` | `0` | 1 seul objet JSON racine (`ok:true, count:74, evenements[…], etatAtteint, reprise`), stderr **vide** (0 octet), `etatAtteint.etapesFaites: []` |
| 6 | `node cli/scripts/vitrine-en-ligne.js` | `1` | `2 ecart(s)` — `E-2 : le README annonce v0.40.0, GitHub presente v0.39.0 … Ce rouge est VOULU — il informe, il est HORS gate et ne bloque aucun lot.` / `E-3 : la release v0.40.0 … N'EXISTE PAS …` — mécanisme L42 attendu, pas un défaut |
| 7 | `cd cli && node --test test/install-contrat-machine.test.js` | `0` | `tests 24 / pass 24 / fail 0` |
| 8a | `git tag -l v0.40.0` | — | (vide) |
| 8b | `git rev-parse main` | — | `403971ea7051a8ce39497e36fad0fe6715634314` (inchangé) |
| 8c | `git status --short` (avant clôture, hors ce rapport) | — | (vide, arbre propre) |

## Témoin CA-M8 — diff cité intégralement

`git diff 403971e..HEAD -- cli/test/fixtures/install-prose-dry-run.txt` :

```diff
-[1/4] CLI — mise à jour (poste déjà équipé, AR-G) : version courante v0.39.0
-  réservoir : vivant <VIVANT> (v0.39.0) — embarqué v0.39.0, égalité, le vivant l'emporte
+[1/4] CLI — mise à jour (poste déjà équipé, AR-G) : version courante v0.40.0
+  réservoir : vivant <VIVANT> (v0.40.0) — embarqué v0.40.0, égalité, le vivant l'emporte
   sources réseau (AR-H) consultées :
     - DOUBLE-TEST (cli/test/fixtures/install-network-double.mjs) : sonde toujours injoignable : injoignable
-  déjà à jour (v0.39.0) — rien à installer.
+  déjà à jour (v0.40.0) — rien à installer.

   [garde AR-1/AR-4] AR-1 désarmé pour la durée de la chaîne (corollaire AR-1/AR-4, § 5.5) : le kit hôte reste absent jusqu'à validation explicite de l'étape 2

 [2/4] méthode — délégation à install.mjs (M4, non réimplémenté)
   quoi : kit(s) hôte(s) [claude] depuis <VIVANT>/kits
   où : <CLAUDE>
-  quelle version : v0.39.0
+  quelle version : v0.40.0
   ce qui sera fusionné : --merge par défaut (rien d'existant n'est écrasé sans --overwrite)
```

Constat : le diff se réduit **exactement** à 5 substitutions `0.39.0` → `0.40.0`, toutes situées
aux points où le verbe imprime la version courante (« version courante », provenance du
réservoir vivant/embarqué, « déjà à jour », « quelle version »). Aucune ligne ajoutée, retirée
ou reformulée ; aucun octet de prose modifié en dehors du numéro de version. **Conforme** à la
condition posée : le toucher du témoin CA-M8 est légitime.

## Écarts

### Non bloquant — littéraux `'0.39.0'` figés dans les fixtures de test (au lieu d'une dérivation depuis `package.json`)

- **Où** : `cli/test/install-verbe.test.js:46` (`function faireReservoirVivant({ version = '0.39.0' } = {})` → `'0.40.0'`, et ses 5 appels explicites lignes 108, 118, 130, 142, 154, 167) ; `cli/test/install-prose-non-regression.test.js:29` (même fonction, même défaut) et ses appels lignes 54, 75, 111.
- **Constat** : Gimli a bien fait le même remplacement mécanique `'0.39.0'` → `'0.40.0'` partout, sans autre changement — pas de FAIL sur ce point précis du mandat.
- **Réserve** : ce sont des littéraux figés, non dérivés de l'autorité `cli/package.json`. Au prochain bump mineur (0.41.0), ces valeurs par défaut redeviendront silencieusement obsolètes et il faudra refaire le même geste manuel — c'est exactement le genre de dérive que la source unique de version (G1/G3/G5) cherche à éliminer ailleurs. Ne bloque pas ce gate : la suite est verte, le témoin CA-M8 est intact, le contrat de ces tests (comparer une version "vivante" à une version "embarquée") reste rempli quelle que soit la valeur du littéral. Signalé pour un futur lot de dérivation (successeur nommé possible : `LITTERAUX-VERSION-TEST-DERIVES`).

Aucun autre écart. Pas de FAIL.

## Reproduction (en cas de contestation)

```bash
git checkout chore/bump-0.40.0
cd cli && node --test                      # 1098/1097/0/1
node --test test/guard-version-source-unique.test.js   # 18/18
node --test test/install-contrat-machine.test.js       # 24/24
cd .. && node cli/src/index.js -v          # 0.40.0
node cli/scripts/vitrine-en-ligne.js       # exit 1, E-2/E-3 attendus (L42)
git diff 403971e..HEAD -- cli/test/fixtures/install-prose-dry-run.txt
```
