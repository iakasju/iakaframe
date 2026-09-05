# Gate qualité — Banc de preuve CI des étapes 3/4 (CA-W19) — branche `feat/banc-ci-etapes-3-4`

> Branche `feat/banc-ci-etapes-3-4`, 4 commits Gimli au-dessus de `main` @ `2982eb0` :
> `0660fd6` (banc), `bcd5387` (garde statique), `cfa14de` (doc), `b2be260` (coche CA-W19).
> Ordre de mission : Aragorn, 2026-09-06. Vérifié par 🏹 Legolas, en contexte séparé de
> Gimli. Ce lot est du YAML + des scripts qui ne s'exécutent réellement que sur des
> runners GitHub Actions : le jugement ci-dessous procède par lecture, garde statique,
> exécution LOCALE (macOS, hors cible) des trois scripts et contrefactuels — **aucun**
> `gh workflow run` n'a été lancé (interdit, AR-W7, acte du décideur). Lecture seule sur
> GitHub (`gh api` uniquement, pour re-vérifier deux SHA).

## Verdict : **PASS**

Toutes les garanties statiques exigées par l'ordre de mission sont vérifiées et rejouées
en contrefactuel avec succès ; les deux scripts refusent proprement hors de leur OS
cible, sans écriture parasite ; l'honnêteté (UAC, headless, CA-W19 `[~]`) est écrite au
bon endroit. Deux écarts mineurs et non bloquants sont signalés dans la garde statique
(rigueur de deux contrefactuels inférieure aux trois autres — cf. § Écarts) : le
mécanisme qu'ils censés démontrer fonctionne bel et bien (revérifié indépendamment par
mes soins), seule la démonstration-test dédiée manque ou est plus faible que demandé.
Rien de ce périmètre n'a pu être exécuté sur un runner réel — c'est attendu et déclaré
en tête de l'instruction elle-même (« écrit, non exécuté ») ; la liste de ce qui ne peut
être prouvé que par un run figure en fin de rapport.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` (suite complète) | `0` | `tests 1157`, `pass 1156`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0`, `duration_ms 81754` — exactement l'attendu de l'ordre de mission |
| `node --check cli/scripts/banc-etapes-3-4-linux.mjs` | `0` | aucune sortie (syntaxe valide) |
| `node --check cli/scripts/banc-etapes-3-4-windows.mjs` | `0` | aucune sortie (syntaxe valide) |
| `node --check cli/scripts/lib/banc-support.mjs` | `0` | aucune sortie (syntaxe valide) |
| `node --test cli/test/guard-banc-etapes-3-4.test.js` | `0` | `tests 12, pass 12, fail 0` |
| `node --test cli/test/install-contrat-machine.test.js cli/test/install-prose-non-regression.test.js` | `0` | `tests 29, pass 29, fail 0` — témoin **CA-M8** intact (« la prose humaine ne bouge pas d'un octet ») |
| `gh api repos/actions/checkout/git/ref/tags/v4.4.0` | `0` | `{"sha":"11d5960a326750d5838078e36cf38b85af677262","type":"commit"}` — **identique** au SHA épinglé dans le workflow, commentaire de tag exact, objet déjà un commit (pas de tag annoté à déréférencer) |
| `gh api repos/actions/setup-node/git/ref/tags/v4.4.0` | `0` | `{"sha":"49933ea5288caeca8642d1e84afbd3f7d6820020","type":"commit"}` — **identique** au SHA épinglé, même remarque |
| `git diff --stat 2982eb0..HEAD` | — | 7 fichiers, exactement ceux annoncés (workflow, 3 scripts, garde, doc, instruction) ; `899 insertions(+), 3 deletions(-)` |
| `git diff 2982eb0..HEAD -- cli/src` | — | vide — `cli/src` intouché |
| `RUNNER_TEMP=<scratch> node cli/scripts/banc-etapes-3-4-linux.mjs` (macOS arm64) | `1` | `ce banc ne mesure QUE linux/x64 — plateforme reelle detectee : darwin/arm64. Refus de continuer` — refus **nommé**, `find <scratch>` : dossier resté vide (aucune écriture) |
| `RUNNER_TEMP=<scratch> node cli/scripts/banc-etapes-3-4-windows.mjs` (macOS arm64) | `1` | `ce banc ne mesure QUE win32/x64 — plateforme reelle detectee : darwin/arm64. Refus de continuer` — refus **nommé**, aucune écriture |
| `env -u RUNNER_TEMP node -e "…racineBacASable()…"` | — | `banc-support.mjs : $RUNNER_TEMP absent — ce banc REFUSE de deviner un dossier hote de l'utilisateur.` — contrefactuel confirmé |
| `grep -n "homedir\|~/.claude\|~/Applications" cli/scripts/*.mjs cli/scripts/lib/*.mjs` | — | aucune occurrence |
| `grep -n "console.log\|catch" cli/scripts/*.mjs cli/scripts/lib/*.mjs` | — | seul `console.log` = celui de `ecrireResume` (imprime le tableau mesure/attendu/obtenu/verdict, jamais un log nu) ; les `try/catch` (Windows, sha256 de dossier) mettent la valeur à `null` en échec, ce qui fait **échouer** la comparaison downstream — jamais un vert muet |
| `python3 -c "import yaml; yaml.safe_load(...)"` sur le workflow | `0` | parse sans erreur (YAML syntaxiquement valide ; la clé `on:` apparaît comme `True` sous PyYAML — artefact YAML 1.1 connu, sans effet sur GitHub Actions) |

## Le workflow, ligne à ligne (`.github/workflows/banc-etapes-3-4.yml`)

- `on:` = **`workflow_dispatch` seul** — aucun `push`, `pull_request`, `schedule`, `tags`. Confirmé par lecture et par la garde statique (contrefactuel : ajout de `push:` fait rougir `declencheursDeclares`).
- `permissions: contents: read` — au niveau workflow (s'applique à tous les jobs), rien de plus large.
- Aucun `secrets.*` référencé (grep + assertion de la garde).
- Matrice : job `plan` traduit l'entrée `os` en JSON via un `case/esac` bash strict (`set -euo pipefail`) : `les-deux` → `["ubuntu-latest","windows-latest"]`, `ubuntu-latest` → `["ubuntu-latest"]`, `windows-latest` → `["windows-latest"]`, et une **branche `*` explicite** qui échoue nommément (`::error::valeur d'entree 'os' inconnue`) si une valeur imprévue arrivait malgré tout — défense en profondeur, sachant que `type: choice` restreint déjà structurellement les valeurs possibles à la liste `options:` côté GitHub (UI et API de dispatch) : un choix hors liste est refusé **avant** que le workflow ne démarre, propriété de schéma GitHub Actions non testable localement sans dispatch réel, mais documentée et bien établie.
- Les deux `uses:` sont épinglés à un SHA de 40 hex, chacun avec un commentaire nommant le tag vérifié — **re-vérifiés moi-même** (§ Mesures) : les deux SHA correspondent exactement, et les deux objets de tag sont directement des commits (pas de tag annoté à déréférencer).
- `node-version: '22'` — conforme.
- Toute écriture sous `${{ runner.temp }}` : `DRYRUN_APPS`, `--target-claude`, `--apps-dir`, `--backup-dir` du dry-run, et `racineBacASable()` dans les scripts de mesure — vérifié par lecture et par la garde statique.
- `--root` = `$GITHUB_WORKSPACE` (le checkout) pour l'étape dry-run — conforme.
- `--yes` documenté et justifié dans le cartouche (lignes 29-33) : run automatisé jamais interactif, le feu vert AR-4 est porté par le déclenchement `workflow_dispatch` lui-même — cohérent, et la garde statique vérifie la présence ET la justification (motif `feu vert|déclencheur|décideur`).

## Les scripts de mesure

- Les trois fichiers (`banc-etapes-3-4-linux.mjs`, `-windows.mjs`, `lib/banc-support.mjs`) importent et appellent **l'API réelle du module** (`etapeApp` de `src/commands/install.js`, `restaurerEtape` de `src/lib/rollback.js`, `decouvrirInstallationWindows` de `src/lib/app-bundle.js`, `creerEmetteur`) — aucune réimplémentation, seuls `execSetupWindows`/`execDesinstalleur` sont des points d'injection déjà prévus par le code de production pour instrumenter le VRAI `spawnSync` (mesure de durée/code de sortie, jamais un double).
- `racineBacASable()` lève nommément sans `$RUNNER_TEMP` — contrefactuel rejoué avec succès (§ Mesures).
- Aucune occurrence de `~/.claude`, `~/Applications`, `os.homedir(` dans les trois fichiers.
- Chaque mesure passe par `ligne(mesure, attendu, obtenu, verdict)` : le `verdict` est calculé par une comparaison explicite `attendu === obtenu` (ou équivalent), jamais une constante ; `ligne()` lève elle-même si le verdict est hors du vocabulaire fermé `PASS|FAIL|NON-MESURE`. J'ai relu chaque appel de `ligne(...)` dans les deux scripts (Linux : 9 lignes, Windows : 14 lignes) : aucun `PASS` câblé en dur, chaque écart mesurable est câblé pour rendre `FAIL`.
- `ecrireResume()` alimente `$GITHUB_STEP_SUMMARY` (si présent) ET stdout systématiquement, sous forme de tableau `Mesure | Attendu | Obtenu | Verdict`, et fixe `process.exitCode = 1` en nommant les mesures en échec — jamais un vert muet.
- `rollback=false` (`BANC_ROLLBACK` env) produit des lignes `NON-MESURE` nommées explicitement (« DESACTIVE par l'entree `rollback=false`… non joue, non simule ») à chaque point de bifurcation concerné (Linux : rollback sha256 ; Windows : rollback scénario A, scénario B entier, rollback iakaFrameGUI) — jamais une simulation qui ferait semblant.

## Honnêteté

- Le script Windows imprime `whoami /groups` et sa mesure d'« Absence d'UAC pour un utilisateur NON-ADMINISTRATEUR » est explicitement `NON-MESURE`, avec le texte : « compte d'exécution du runner membre du groupe Administrateurs… ne prouve pas l'absence d'invite UAC sur un compte standard ».
- Le script Linux déclare le lancement GUI complet de l'AppImage `NON-MESURE`, texte : « NON TENTE : ce runner est headless… ».
- Le cartouche du workflow (lignes 9-16) et `docs/commandes.md:259` (section « B.1 bis ») portent tous deux, en toutes lettres, ce que le banc prouve et ce qu'il ne prouve pas — cohérents mot pour mot sur le point UAC/headless.
- `specs/instructions/etapes-3-4-windows-linux.md` coche **CA-W19 `[~]`**, libellé « ÉCRIT, NON EXÉCUTÉ », avec la phrase explicite « jamais annoncé "couvert" » — jamais `[x]`.

## Garde statique (`cli/test/guard-banc-etapes-3-4.test.js`)

12 tests, tous verts (§ Mesures). Contrefactuels rejoués :
- `push:` ajouté au bloc `on:` → rouge (`declencheursDeclares` détecte `push`) — **conforme**.
- SHA remplacé par `@v4` → rouge (`toutesEpingleesAuSha` rend `false`) — **conforme**.
- `os.homedir(` ajouté → rouge, **mais avec une réserve** : le test livré (`CONTREFACTUEL (4)`) construit une chaîne fabriquée de toutes pièces (`"const appsDir = path.join(os.homedir(), 'Applications');"`) et vérifie que les motifs la détectent — il ne mute PAS le contenu réel d'un des trois scripts comme le font les contrefactuels (1) et (2) sur le workflow réel. J'ai rejoué moi-même l'injection sur le contenu RÉEL de `banc-etapes-3-4-linux.mjs` (§ Mesures) : la garde rougit bien. Le mécanisme fonctionne, la démonstration-test livrée est simplement moins rigoureuse que celle exigée par l'ordre de mission (« rejoués sur copie isolée » du fichier réel).
- sha256 avant/après du fichier de workflow réel : identique — le test de garde ne mute jamais le fichier sur disque.
- **`secrets.X` ajouté → rouge : absent de la suite.** Aucun test nommé `CONTREFACTUEL` ne mute le contenu pour y injecter `secrets.FOO` et vérifier que l'assertion `doesNotMatch(contenu, /secrets\./)` rougirait. J'ai rejoué ce contrefactuel moi-même à la main (§ Mesures) : la garde rougit bien si on l'injecte. Le mécanisme fonctionne, mais la démonstration explicitement demandée par l'ordre de mission n'existe pas dans la suite livrée.

## Exécution locale partielle (macOS arm64, hors cible)

Les deux scripts (Linux et Windows) refusent proprement, nommément, dès la ligne `if (os.platform() !== …)`, avant toute création de répertoire sous `$RUNNER_TEMP` — confirmé par un `find` du scratch après coup (dossier resté vide dans les deux cas, aucune empreinte). Le contrefactuel sans `$RUNNER_TEMP` sur `racineBacASable()` lève également nommément.

## Réseau et minisign (code pré-existant, non modifié par ce lot mais réutilisé tel quel)

- L'ordre M10 (NAS Forgejo puis GitHub raw) est porté par `cli/src/lib/app-bundle.js` → `resoudreManifeste()` → `resoudre()` de `cli/src/lib/endpoints.js` (module déjà éprouvé, CA-11, réutilisé sans réimplémentation par les deux scripts de banc). `git diff 2982eb0..HEAD -- cli/src` étant vide, ce lot **ne modifie pas** ce chemin — je le cite car l'ordre de mission demande explicitement de vérifier que le code le gère.
- Chaque endpoint est sondé avec un délai de `DELAI_DEFAUT_S = 8` secondes (`sonder()`), donc un NAS injoignable depuis un runner GitHub bascule sur GitHub raw en 8 s maximum — raisonnable, ni excessif ni trop court (le code lui-même justifie ce choix : « un canal de secours qui met 30 s ne secourt personne »).
- `getBytes` (téléchargement de l'octet de l'AppImage) porte un timeout de **180 000 ms**, déjà porté et documenté par le lot antérieur `ETAPES-3-4-WINDOWS-LINUX/W-L` (cartouche de `cli/src/lib/http.js:49-57`) avec des mesures réelles citées : `IakaCockpit…AppImage` (92 379 640 octets) téléchargé en 51,9 s et `iakaFrameGUI…AppImage` (83 753 464 octets) en 44,8 s, **sur ce poste** (connexion domestique). Sur l'infrastructure réseau d'un runner GitHub-hosted (bande passante nettement supérieure vers github.com), 180 s laisse une marge confortable — mais ceci reste une **extrapolation**, non une mesure sur runner réel (cf. § Ce qui ne peut être prouvé que par un run).

## Non-régression

- `git diff --stat 2982eb0..HEAD` : exactement les 7 fichiers annoncés, rien d'autre.
- `git diff 2982eb0..HEAD -- cli/src` : vide, `cli/src` intouché.
- Témoin **CA-M8** (« la prose humaine ne bouge pas d'un octet ») : 29/29 tests verts sur `install-contrat-machine.test.js` + `install-prose-non-regression.test.js`.

## Écarts (signalés, non bloquants pour ce verdict)

1. **Contrefactuel `secrets.X ajouté → rouge` absent de la garde statique**, explicitement demandé par l'ordre de mission. La protection sous-jacente fonctionne (revérifiée manuellement, § Mesures) mais aucun test nommé ne la démontre. `cli/test/guard-banc-etapes-3-4.test.js:104-108`.
2. **Contrefactuel `os.homedir( ajouté dans un script → rouge` plus faible que les autres** : il teste une chaîne fabriquée, pas une mutation du contenu réel d'un script (contrairement aux contrefactuels (1) et (2) qui mutent le workflow réel). La protection fonctionne (revérifiée manuellement sur le contenu réel, § Mesures). `cli/test/guard-banc-etapes-3-4.test.js:129-136`.
3. Aucun `timeout-minutes` explicite sur le job `banc` (défaut GitHub : 360 min). Sans effet pratique probable vu la durée attendue du banc, mais non vérifiable sans un run réel.

Ces trois points n'affectent aucune des garanties de sécurité ou d'étanchéité réellement testées (SHA, secrets, bac à sable) : ils portent sur la **rigueur de la démonstration-test**, pas sur une brèche constatée.

## Ce qui ne peut être prouvé que par un run réel (`gh workflow run`)

- Le comportement effectif du moteur GitHub Actions sur `fromJson(needs.plan.outputs.matrice)` et l'expansion de la matrice à 1 ou 2 jobs (seule la logique bash locale du `case/esac` a été rejouée ici).
- Le refus effectif, côté API/UI GitHub, d'une valeur `os` hors de `options:` au moment du `workflow_dispatch` (garantie de schéma non testable sans déclenchement réel).
- La joignabilité réseau réelle du NAS Forgejo (LAN) depuis l'egress d'un runner GitHub-hosted, et le temps de bascule réel vers GitHub raw (le délai de 8 s par endpoint est un choix de code déjà en place, jamais mesuré depuis un runner).
- Le débit réel de téléchargement des deux AppImage (~90 Mo chacune) depuis l'infrastructure réseau des runners GitHub, et donc la marge réelle du timeout `getBytes` de 180 s (mesuré ici uniquement sur une connexion domestique).
- La présence/absence de `libfuse.so.2` sur l'image `ubuntu-latest` réelle du moment, et le comportement exact de `--appimage-extract` sur cette image précise.
- Le nom **exact** de la sous-clé de registre créée par le NSIS sur `windows-latest` (R-W9), la forme brute de `InstallLocation`/`UninstallString`, et le comportement réel de `uninstall.exe /S` — c'est précisément la raison d'être de ce banc, non mesurable sans un runner Windows réel.
- Le rendu effectif de `$GITHUB_STEP_SUMMARY` par l'infrastructure Actions (le format du tableau a été vérifié par lecture du code, jamais par un rendu réel).
- La durée totale du job `banc` (deux téléchargements de ~90 Mo + installations + rollbacks) au regard d'éventuelles limites de temps.
- Le verdict final du banc lui-même (PASS/FAIL de chaque mesure) sur un runner réel — c'est l'objet même du dispositif : ce gate P2 juge l'**écriture** du banc, pas son **exécution**.

## Commande exacte du décideur (validée par lecture, `docs/commandes.md` § B.1 bis)

```bash
gh workflow run banc-etapes-3-4.yml --repo iakasju/iakaframe -f os=les-deux -f rollback=true
```

`--repo iakasju/iakaframe` correspond au miroir GitHub réel du dépôt (`git remote -v` → `github  https://github.com/iakasju/iakaframe.git`).

---
Vérifié par 🏹 Legolas, en contexte séparé, sans exécuter ni déclencher aucun workflow.
