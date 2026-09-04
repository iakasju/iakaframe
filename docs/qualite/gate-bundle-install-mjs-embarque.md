# Gate qualité — Lot `BUNDLE-INSTALL-MJS-ABSENT` (le paquet publié embarque `install.mjs`)

- **Branche** : `feat/bundle-install-mjs-embarque` (10 commits au-dessus de `main` @ `eb335fa`, arbre propre au moment du gate)
- **Date** : 2026-09-04
- **Vérificateur** : 🏹 Legolas, contexte séparé (jamais l'agent qui a codé)
- **Base** : `specs/instructions/bundle-install-mjs-embarque.md`, lue intégralement. Verdicts du décideur : AR-I → (a), AR-J → (a).
- **Profondeur** : version mineure (feature) → campagne qualité complète. **Aucun lint ni typecheck configuré** dans `cli/` (pas de `eslint`/`tsconfig`, ni de script `lint`/`typecheck` dans `cli/package.json`) — substitué par `node --check` sur l'ensemble des sources, conformément à la convention déjà pratiquée sur ce dépôt.

## Verdict global : **PASS**

Les 13 critères CA-B1..CA-B13 sont **re-mesurés indépendamment** (jamais repris des preuves de Gimli) et **confirmés PASS**. Trois contrefactuels que Gimli n'avait fait rougir que par script ont été **rejoués manuellement par moi, en isolation**, pour prouver que la garde répare un défaut réel et pas un défaut fictif : le `TypeError` de R-B/N5 (ancien `install.js` + nouveau `reservoir.js`), le crash `ENOTDIR` + répertoire parasite de N3 (ancien `copyDir` sur un fichier), et le refus du prepack sur asset manquant (CA-B1). Un **écart non bloquant** est documenté (point ouvert ii, `docs/qualite/gate-lot-C1-moteur-chaine.md` laissé intact) et jugé **recevable**.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `find cli/src cli/scripts -name '*.js' \| xargs -n1 node --check` (+ `node --check install.mjs`) | `0` pour chaque fichier | aucune sortie d'erreur — syntaxe propre sur toutes les sources touchées et non touchées |
| `cd cli && node --test` (`_bundled/` **présent**, régénéré par moi via `node scripts/bundle.js`) | `0` | `tests 1056` · `pass 1055` · `fail 0` · `cancelled 0` · `skipped 1` · `duration_ms 81262` |
| `cd cli && rm -rf _bundled && node --test` (`_bundled/` **absent**) | `0` | `tests 1055` · `pass 1054` · `fail 0` · `cancelled 0` · `skipped 1` · `duration_ms 87801` |
| Idem, rejoué sur `main` (worktree isolé `eb335fa`), présent puis absent | `0` / `0` | `1049`→`1042 pass, 7 skip` (présent) et `1048`→`1041 pass, 7 skip` (absent) — **même écart de +1 test**, confirmant que l'angle mort est préexistant |
| `node --test test/reservoir-ar-f.test.js test/install-verbe.test.js test/bundle-assets.test.js test/bundle-tarball.test.js test/install-paquet-publie.test.js` | `0` | `tests 30` (ciblé) + `tests 3` (les 2 tests `npm pack` réels, exécutés séparément) → `pass` intégral, aucun `fail`, `CA-B5`/`CA-B6` exécutés en ~1,1-1,3 s chacun (empaquetage réel, pas un témoin vide) |
| `npm pack` manuel sur copie isolée `/private/tmp/.../scratchpad/manual-b5` + `tar -xzf` + `diff` | `0` | tarball `naonedge-iakaframe-0.39.0.tgz`, 551 entrées ; `_bundled/install.mjs` extrait **identique octet pour octet** à `install.mjs` racine (`diff` vide) ; `_bundled/kits/**` présent |
| `node <extrait>/_bundled/install.mjs --kits-dir <extrait>/_bundled/kits --hosts claude --target-claude <tmp> --yes` (étape 2 réelle depuis le paquet extrait) | `0` | `CLAUDE.md` (bloc `<!-- iakaframe:start -->` présent), `settings.json`, **6/6** `hooks/*.mjs`, **35/35** `commands/*.md` — comptés contre le kit source de l'extraction, aucun nombre en dur |
| `git diff main..HEAD -- cli/package.json` | — | sortie **vide** (CA-B3) |

## Tableau des critères (re-mesurés indépendamment)

| Critère | Verdict | Preuve (re-mesurée par moi) |
|---|---|---|
| **CA-B1** | **PASS** | `cli/scripts/bundle.js:28-38` (`ASSETS`, `install.mjs` `required:true`) ; `cli/test/bundle-assets.test.js` étendu. **Contrefactuel rejoué manuellement** sur dépôt isolé (`/private/.../scratchpad/ca-b1-sans-install`, vrai `bundle.js` copié, `install.mjs` absent) → `EXIT=1`, message exact `bundle REFUSE : asset(s) requis manquant(s) : install.mjs.` |
| **CA-B2** | **PASS** | `diff cli/_bundled/install.mjs install.mjs` → vide (identique). **N3 rejoué** : reproduction de l'ANCIEN `copyDir` (mkdirSync(dst) puis readdirSync(src)) sur le fichier réel `install.mjs` → `Error ENOTDIR: not a directory, scandir '.../install.mjs'` **et** répertoire parasite créé (`fs.statSync(dst).isDirectory() === true`) — confirme que la branche fichier de `copyEntry` (`bundle.js:53-60`) répare un défaut réel |
| **CA-B3** | **PASS** | `git diff main..HEAD -- cli/package.json` → sortie vide |
| **CA-B4** | **PASS** | `resoudreReservoir({root: <vivant v0.1.0>})` (root fabriqué en isolation) → `source:"embarque"`, `installMjsPath` pointe `_bundled/install.mjs` (jamais le vivant plus ancien), `provenance:"réservoir : embarqué (v0.39.0) — vivant v0.1.0, plus ancien"`. **Contrefactuel R-B rejoué** : l'ANCIEN calcul `path.join(reservoir.vivantRoot,'kits')` appliqué au NOUVEAU `reservoir.js` (vivant absent, `vivantRoot:null`) → `TypeError: The "path" argument must be of type string. Received null` reproduit ; le NOUVEAU calcul (`path.dirname(installMjsPath)`) ne plante pas. Suite ciblée verte : `cli/test/install-verbe.test.js` (« CA-B4 : vivant PLUS ANCIEN... ») et `cli/test/reservoir-ar-f.test.js` (« AR-F(a)+AR-I(a)... ») |
| **CA-B5** | **PASS — LA PREUVE, rejouée manuellement de bout en bout** | `npm pack` réel sur copie isolée hors du dépôt de travail → extraction → `_bundled/install.mjs` identique octet pour octet à la source → **exécution réelle** d'`install.mjs` depuis l'extrait (CLI direct, pas seulement `etape2Methode`) sur cible temporaire vide → `CLAUDE.md` avec bloc `iakaframe:start`, `settings.json`, hooks 6/6, commands 35/35 (comptés contre le kit **de l'extraction**, jamais un chiffre écrit en dur). Test automatisé `cli/test/install-paquet-publie.test.js` rejoué : PASS |
| **CA-B6** | **PASS** | `cli/test/bundle-tarball.test.js` rejoué : `npm pack` réel + `tar -tzf` confirment `package/_bundled/install.mjs` et `package/_bundled/kits/**` dans le tarball ; contrefactuel (dépôt sans `install.mjs`) → prepack refuse en le nommant |
| **CA-B7** | **PASS** | Suite complète rejouée par moi deux fois : `_bundled/` absent → `1055/1054/0/1` ; présent → `1056/1055/0/1`. **Diff = exactement +1**, identifié et confirmé indépendamment comme l'angle mort `library/skills/iakaframe-appflowy-doc/test.mjs` (point ouvert i, ci-dessous) |
| **CA-B8** | **PASS** | `grep -rn` sur le vocabulaire des 6 énoncés faux → seules occurrences vivantes : `install.mjs:51` (citation datée, E-6, légitime) et `docs/qualite/gate-lot-C1-moteur-chaine.md` (rapport historique clos, point ouvert ii, jugé recevable ci-dessous). **Aucune occurrence dans du code `.js` live.** Message imprimé à l'utilisateur (E-3) relu en `install.js:233-238` : aucune affirmation fausse |
| **CA-B9** | **PASS** | Rejoué avec un embarqué **injecté et réellement vide** (répertoire créé sans `install.mjs`) + vivant absent → `etape2Methode` : `REFUS` nommant les DEUX chemins cherchés, `r.ok === false`, **rien écrit** (`fs.existsSync(targetClaude) === false`) |
| **CA-B10** | **PASS** | `git diff main..HEAD -- install.mjs` limité au bloc de commentaire `:47-57` ; décision (`pas d'import de vocab.js`) inchangée |
| **CA-B11** | **PASS** | `docs/commandes.md:248` réécrit — décrit AR-I(a) exactement (réservoir désigné, deux chemins nommés en cas de refus), aucune trace de l'ancien énoncé faux |
| **CA-B12** | **PASS** | `specs/instructions/chaine-complete-install-amorcage-dmg-msi.md` : R10 marqué **SOLDÉ** (§ 8, texte original conservé), CA-21 → CA-21′ avec case cochée (§ 9, texte d'origine conservé, amendement daté), inconnue 4 fermée (§ 11) — toutes les rectifications sont **datées, jamais effacées** |
| **CA-B13** | **PASS** | `node --test` rejoué deux fois : `1056/1055/0/1` stable. Le seul skip identifié nommément : `recall : moteur ripgrep si rg est installe (sinon test saute)` — préexistant, `rg` absent de ce poste, hors périmètre du lot |

## Contrefactuels rejoués manuellement (en isolation, jamais dans l'arbre de travail)

1. **CA-B1** — dépôt fabriqué sans `install.mjs`, vrai `bundle.js` copié → `exit 1`, message exact.
2. **N3/CA-B2** — reproduction de l'ancien `copyDir` (avant ce lot) appliquée au vrai fichier `install.mjs` → `ENOTDIR` + répertoire parasite. Prouve que la branche fichier de `copyEntry` n'est pas cosmétique.
3. **R-B/CA-B4** — reproduction de l'ancien calcul `path.join(reservoir.vivantRoot, 'kits')` appliqué à la sortie du **nouveau** `reservoir.js` (embarqué porteur, `vivantRoot: null`) → `TypeError`. Prouve que la dérivation par `path.dirname(installMjsPath)` répare un crash réel, pas hypothétique.
4. **CA-B9** — embarqué injecté et vide + vivant absent → refus explicite, exit non nul (`r.ok:false`), rien écrit.

Aucun de ces quatre contrefactuels n'a été mené dans l'arbre de travail réel : trois en `/private/tmp/.../scratchpad/`, un via l'injection interne `embarqueDir` prévue par le point d'injection du lot lui-même.

## Écarts non bloquants

- **Aucun écart bloquant nouveau détecté.** Le seul écart antérieur documenté (`docs/qualite/gate-lot-C1-moteur-chaine.md` § Écart non bloquant, message trompeur en cas de vivant plus ancien) est précisément celui que ce lot **répare** — confirmé par CA-B4 ci-dessus.

## Les trois points ouverts de Gimli — verdicts de Legolas

### (i) Angle mort `node --test` — `cli/_bundled/library/skills/iakaframe-appflowy-doc/test.mjs`

**Confirmé PRÉEXISTANT, sans rapport avec ce lot.** Rejoué sur un worktree isolé de `main` (`eb335fa`, avant tout commit de ce lot) : `node scripts/bundle.js` puis `node --test` avec `_bundled/` présent → `1049` tests ; sans `_bundled/` → `1048` tests. **Même écart de +1** que sur la branche du lot. La cause est la découverte récursive de `node --test` (tout fichier nommé `test.mjs` sous le CWD) combinée à `library/skills/iakaframe-appflowy-doc/test.mjs`, commité en `4636881` — antérieur et sans lien avec `install.mjs`/`reservoir.js`/`install.js`. **Verdict : angle mort réel, correctement déclaré, hors périmètre de ce lot. Non bloquant.**

### (ii) `docs/qualite/gate-lot-C1-moteur-chaine.md` laissé intact malgré CA-B8

**Recevable.** Ce fichier est un **procès-verbal daté et clos** : gate d'une **autre branche** (`feat/lot-C1-moteur-chaine`), verdict **PASS** déjà rendu le 2026-09-04, dont la section « Écart non bloquant » décrit **fidèlement l'état du code à cette date-là** — état que ce lot-ci corrige. Le réécrire reviendrait à falsifier un audit historique après coup ; la discipline correcte est celle appliquée : dater/référencer l'amendement dans les documents **vivants** (l'instruction parente, `docs/commandes.md`), jamais retoucher un rapport de gate archivé. **Verdict : ne pas réécrire. Correct de laisser intact.**

### (iii) Le parcours de bout en bout réel déclaré gate humain § 11

**Confirmé — c'est un gate humain légitime, pas une esquive.** § 11 de l'instruction déclare noir sur blanc ce qui est prouvable sur ce poste (CA-B1..B4, B6..B13, et CA-B5 rejouable en local via `npm pack`+extraction+installation sous préfixe temporaire — ce que j'ai fait moi-même) versus ce qui ne l'est pas : le téléchargement d'un vrai tarball de **release GitHub publiée** + `npm install -g` réel + réseau réel. Cela exige un acte du décideur (publier une release) et exerce le réseau vivant (risque R-C, déjà mitigé dans les tests par l'appel direct à `etape2Methode`/`install.mjs` plutôt qu'à la chaîne complète). **Verdict : gate humain correctement délégué, non simulable en gate automatique sans re-publier une release à chaque vérification.**

## Nettoyage

`cli/_bundled/` régénéré pendant la vérification est **gitignoré** (`cli/.gitignore:3`) et n'apparaît pas dans `git status`. Tous les répertoires temporaires de contrefactuels ont été supprimés du scratchpad. Aucun fichier résiduel dans l'arbre de travail suivi par git.
