# Gate qualité — fix `etapesFaites` en `--dry-run`

> Branche `fix/etapes-faites-dry-run` (tête `e15c051`), base `main` (`02c5f0b`).
> Commits : `748e4f7` (test rouge) → `6499d96` (fix) → `e15c051` (docs).
> Verdict tranché à vérifier : `specs/instructions/contrat-machine-du-verbe-install.md` § 3,
> « Verdict complémentaire du 2026-09-05 » — en `--dry-run`, **aucune** étape ne compte comme
> faite, `etatAtteint.etapesFaites` vide pour les quatre étapes, symétriquement.
> Vérifié par 🏹 Legolas le 2026-09-05, en contexte séparé de Gimli. Profondeur : correctif
> (validation de tests), pas une version mineure — pas de campagne complète.

## Verdict : **PASS**

L'ordre des commits est conforme (test rouge avant fix). La suite complète est verte
(1098 tests, 1097 pass, 0 fail, 1 skip). Le correctif est exactement symétrique aux
gardes préexistantes des étapes 3/4 (`if (!r3.dryRun)` / `if (!r4.dryRun)`) appliquée
aux étapes 1/2 (`if (!values['dry-run'])`). Le contrefactuel (retrait de la garde sur
l'étape 1) fait rougir nommément les deux tests neufs, puis a été révoqué avec preuve
sha256 identique avant/après. Le mode réel (non-dry) continue de compter les étapes
faites sans régression. CA-M8 (témoin de prose) reste vert, fixture inchangée depuis son
unique commit. La phrase de `docs/commandes.md:248` correspond mot pour mot à la règle
tranchée.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `git log --oneline main..fix/etapes-faites-dry-run` | — | `e15c051 docs… / 6499d96 fix… / 748e4f7 test…` — **test précède le fix** (ordre correct, TDD respecté) |
| `cd cli && npm test` (= `node --test`, suite complète) | `0` | `tests 1098`, `pass 1097`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0` — **conforme à l'attendu 1098/1097/0/1** |
| Piège `_bundled` | — | **Observé** : `cli/_bundled/` présent sur le disque (généré par un lot précédent, ignoré par git, `cli/.gitignore:3`) — c'est lui qui explique l'écart entre un `node --test test/*.test.js` glob (1096/1095/0/1, sans le contexte des fixtures liées au bundle) et le `npm test` canonique (1098/1097/0/1) ; piège préexistant et déjà documenté par le gate précédent (`gate-contrat-machine-install.md:25`), pas introduit par ce lot |
| `install --dry-run --json --yes --root /Users/sjupin/work/iakaframe` | `0` | `etatAtteint.etapesFaites: []` — vide |
| `install --dry-run --events --yes --root /Users/sjupin/work/iakaframe` | `0` | `etape-terminee` : étape 1 `"sautee"`, étapes 2/3/4 `"dry-run"` — **aucune** ne porte `"faite"` |
| Contrefactuel : retrait de `if (!values['dry-run'])` sur l'étape 1 (édition isolée, révoquée ensuite) | `1` (2 tests) | `AssertionError` sur les deux tests « Écart gate » : `+ [1]` reçu au lieu de `- []` attendu — **nomme l'étape 1** |
| `shasum -a 256 src/commands/install.js` avant/après contrefactuel | — | `5a91105928d8…8db838a` identique avant et après (fichier restauré à l'identique, `.bak` supprimé) |
| Run réel (non-dry) avec réservoir vivant contrôlé + double réseau désactivé par erreur de manip (réseau réel atteint, corrigé ensuite) | `0` | `etatAtteint.etapesFaites: [1,2,3,4]` — les 4 étapes comptées en mode réel ; **incident méthodologique noté** : ce premier essai a réellement téléchargé IakaCockpit/iakaFrameGUI (44 Mo) dans un répertoire temporaire système, faute d'avoir positionné `NODE_TEST_CONTEXT` en plus d'`IAKAFRAME_INSTALL_TEST_DOUBLE=1` (les deux signaux sont requis, `network-double.js:29-30`) ; répertoire temporaire supprimé immédiatement après constat, **rien écrit dans le dépôt ni dans `iakaInstall`** |
| Rejeu correct, mêmes deux signaux (`IAKAFRAME_INSTALL_TEST_DOUBLE=1 NODE_TEST_CONTEXT=1`), réservoir vivant + `--json`, non-dry | `1` (chaîne stoppée loyalement à l'étape 3, double réseau injoignable par construction) | `etatAtteint: {derniereEtapeTentee:3, etapesFaites:[1,2], etapesNonTentees:[4]}` — comportement identique à celui déjà couvert par `install-verbe.test.js:160` (prose), confirmé ici en `--json` : les étapes réellement faites (1 sautée-mais-comptée, 2 faite) restent comptées en mode réel, seul le dry-run les vide |
| `node --test test/install-prose-non-regression.test.js` | `0` | `tests 5`, `pass 5`, `fail 0` — CA-M8/CA-M9 verts |
| `git log --oneline -- cli/test/fixtures/install-prose-dry-run.txt` | — | **un seul commit** (`811247c`), jamais modifié depuis |
| `shasum -a 256 cli/test/fixtures/install-prose-dry-run.txt` | — | `fba129cb951fa52e52e441a9754955987e41e81f08fb95881bb59a4499fa72f9` — identique au sha256 annoncé au gate précédent |
| `grep -n "etatAtteint.etapesFaites" docs/commandes.md` | — | ligne 248, phrase ajoutée : « reste vide pour les quatre étapes, symétriquement — une étape décrite en dry-run n'a rien écrit, elle ne compte donc jamais comme faite, quel que soit son état d'étape-terminée (`'dry-run'` ou `'sautee'`), distinct de `'faite'` » — **correspond mot pour mot** à la règle tranchée (§ 3 du contrat) |
| `git status --porcelain` avant/après toute la session | vide/vide | arbre rendu exactement comme trouvé, aucun résidu, seul ce rapport ajouté |

## Contrefactuel (détail)

- **Mutation** : `src/commands/install.js:638`, `if (!values['dry-run']) etapesFaites.push(1);`
  → `etapesFaites.push(1);` (garde retirée sur l'étape 1 seulement).
- **Effet** : les deux tests neufs (`Écart gate — install --dry-run --json`, `Écart gate —
  install --dry-run --events`) rougissent, l'un et l'autre nommant `+ [1]` reçu contre `- []`
  attendu — la mutation est détectée précisément sur l'étape mutée.
- **Révocation** : fichier restauré depuis la copie `.bak` faite avant mutation ; sha256
  identique avant/après (`5a91105928d87149a836ad6cc0e9bc840147d554fb989c84dd33b51598db838a`).
  Aucune trace laissée dans l'arbre (`git status --porcelain` vide après restauration).

## Symétrie des quatre étapes

| Étape | Garde | Portée |
|---|---|---|
| 1 (CLI) | `if (!values['dry-run']) etapesFaites.push(1);` — **ce correctif** | `install.js:638` |
| 2 (méthode) | `if (!values['dry-run']) etapesFaites.push(2);` — **ce correctif** | `install.js:666` |
| 3 (IakaCockpit) | `if (!r3.dryRun) etapesFaites.push(3);` — préexistant | `install.js:679` |
| 4 (iakaFrameGUI) | `if (!r4.dryRun) etapesFaites.push(4);` — préexistant | `install.js:700` |

Les quatre étapes appliquent maintenant la même doctrine (`dryRun` ⇒ jamais comptée),
avec deux formulations différentes (`values['dry-run']` global vs `rN.dryRun` par étape)
qui restent équivalentes puisque `dryRun` de `etapeApp` est dérivé de `values['dry-run']`
(même source, jamais divergente sur une même invocation).

## Écarts

Aucun écart bloquant. Un seul point méthodologique à consigner : mon premier essai de
rejeu du mode réel a, par erreur de manipulation (oubli du second signal
`NODE_TEST_CONTEXT` exigé par `network-double.js:29-30` en plus d'`IAKAFRAME_INSTALL_TEST_DOUBLE=1`),
atteint le réseau réel et téléchargé de vrais bundles d'IakaCockpit/iakaFrameGUI dans un
répertoire temporaire système (~44 Mo, hors dépôt) — repéré et nettoyé immédiatement,
sans écriture dans `iakaframe` ni dans `iakaInstall`. Signalé par transparence, sans
impact sur le verdict.

## Symétrie recette

- **Ajout** : le correctif ajoute une condition (`if (!values['dry-run'])`) miroir de
  celles déjà présentes sur les étapes 3/4 — geste symétrique par construction.
- **Retrait/contrefactuel** : la garde retirée en contrefactuel (§ ci-dessus) a été
  restaurée à l'identique, prouvé par sha256, avant de conclure.

---

🏹 Legolas — gate automatique (profondeur : validation de tests, correctif non mineur).
