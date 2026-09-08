# Gate qualité — C-JSON-COUVERTURE-COMPLETE — lots J0 + J1

> Vérificateur : 🏹 Legolas. Branche `feat/c-json-j0-j1` (6 commits au-dessus de `main`
> `50bc0e4` : `7532d2a`, `53f487e`, `cfd9de9`, `833fa67`, `36abbd7`, `2d5f37c`), remise par
> ⚒️ Gimli. Base : `specs/instructions/c-json-couverture-complete.md` (§ 3 AR-J1(b)/AR-J2(b)/
> AR-J3(b)/AR-J5(a) ; § 8 CA-J1..J8). Toutes les mesures ci-dessous sont **re-jouées** par moi,
> aucune n'est reprise du rapport de Gimli sans exécution propre.

## Verdict : **PASS**

Le dépôt est vert (1214/1213/0/1, conforme à l'attendu), le périmètre de production tenu
(`cli/src/lib/verbes.js:130` + en-tête `output.js` seulement, `release.yml` intact), les témoins
de prose intacts et rejoués sur `main` isolé, la garde de dérivation G-J2 et la règle 6 tiennent
avec leurs contrefactuels, le cliquet est descendu 14→9 dans le commit motivé attendu, et
**l'inconnue n°1 est levée** : aucun verbe « accepté-et-ignoré » n'existe, confirmé par exécution
indépendante (pas seulement relu dans le rapport de Gimli).

Un écart préexistant et un point d'attention sont signalés ci-dessous (§ Écarts) ; aucun des deux
n'est un motif de FAIL au regard du périmètre J0/J1.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` (suite complète) | `0` | `tests 1214` / `pass 1213` / `fail 0` / `skipped 1` |
| `node --test test/guard-json-output.test.js` | `0` | `tests 37` / `pass 37` / `fail 0` |
| `node --test test/guard-json-couverture.test.js` | `0` | `tests 11` / `pass 11` / `fail 0` |
| `node --test test/temoins-prose.test.js` | `0` | `tests 7` / `pass 7` / `fail 0` |
| `node --test test/install-contrat-machine.test.js` | `0` | `tests 24` / `pass 24` / `fail 0` |
| `node --test test/install-prose-non-regression.test.js` (témoin CA-M8) | `0` | `tests 5` / `pass 5` / `fail 0` |
| `node --test test/guide-doc-a-jour.test.js test/guard-verbes-registre.test.js` | `0` | `tests 24` / `pass 24` / `fail 0` |
| `git diff 50bc0e4..HEAD -- cli/src/` (grain production) | — | 2 fichiers seulement : `lib/output.js` (en-tête), `lib/verbes.js` (1 ligne, `config`) |
| `git diff 50bc0e4..HEAD -- .github/workflows/release.yml` | — | diff vide — `release.yml` intact |
| `git diff 50bc0e4..HEAD -- cli/test/guard-json-output.test.js` | — | ajouts seulement ; les 20 lignes `NOMINAL`/`ERRORS` d'origine ne bougent pas une ligne |

## Inconnue n°1 — rejeu indépendant de la table de Gimli

Invocations rejouées à la main (hors suite de tests), en bac à sable :

| Invocation | JSON valide | `ok` 1ʳᵉ clé | stderr vide | exit | Verdict |
|---|---|---|---|---|---|
| `config --path <tmp> --runner claude-code --json` | oui | oui | oui | 0 | conforme |
| `agents list --json` | oui | oui | oui | 0 | conforme |
| `skills --json` (bare, **sans** `--project`) | oui | oui | oui | 0 | conforme au JSON — **mais écrivain : a déployé pour de vrai `.claude/skills/*` dans le cwd** (incident, cf. § Incident) |
| `vendor-check --json` + `IAKAFRAME_GUI_ROOT=<absent>` | oui | oui (`ok:false`) | oui | 0 | abstention légale (règle 6), `status:"skipped"` présent |
| `vendor-check --strict --json` + `IAKAFRAME_GUI_ROOT=<absent>` | oui | oui (`ok:false`) | oui | 1 | abstention promue en erreur, conforme |
| `vendor-check --json --gui /tmp/absent` (chemin explicite, inexistant) | oui | oui (`ok:false`) | oui | 1 | **DRIFT, pas SKIPPED** — confirme le point 3 déjà nommé par Gimli (§ Écarts constatés) : seule l'absence du **paramètre** `--gui`, pas un `--gui` pointant vers du vide/inexistant, déclenche l'abstention |
| `frame verify --json` | oui | oui | oui | 0 | conforme au contrat sauf `count` absent — écart déjà déclaré (§ Écarts) |
| `endpoints --url http://127.0.0.1:1/x --timeout 1 --json` | oui | oui | oui | 0 | conforme, `count` juste, aucune dépendance réseau réelle |
| `commands --json` | oui | oui | oui | 0 | conforme, 40 verbes |
| `add --json` (usage, sans args) | oui | oui (`ok:false`) | oui | 1 | conforme |
| `snapshot --json` (non-déclarant) | — (trace Node, stdout vide) | — | non (trace sur stderr) | 1 | **rejette** `--json` — pas de promesse, pas de trahison |
| `root --json` (non-déclarant, cas particulier) | non (prose) | — | oui | 0 | **ignore silencieusement** `--json`, mais ne le **déclare** nulle part (registre/`--help`/doc) : absence de promesse, catégorie explicitement protégée par le § 4 « Exclu » de l'instruction (`root` y est nommément cité). Confirme le constat de Gimli, rien de nouveau. |

**Verdict sur l'inconnue n°1 : confirmée levée.** Aucun verbe déclarant `--json` ne l'accepte en
silence sans l'honorer. Le rapport de Gimli (`docs/qualite/mesures-etape-0-lot-C-JSON.md`) est
fidèle à l'exécution réelle sur tous les points que j'ai reproduits.

## CA-J1 → CA-J8

| Critère | Verdict | Contrefactuel joué |
|---|---|---|
| **CA-J1** — la mesure existe et fait autorité | PASS | n/a (artefact) — `docs/qualite/mesures-etape-0-lot-C-JSON.md` existe, daté 2026-09-08, cite la méthode et les 29 verbes |
| **CA-J2** — `config` déclaré partout | PASS | non rejoué (modifier `verbes.js` en direct est hors mandat de vérification non-destructive) ; vérifié statiquement que `verbes.js:130`, `docs/commandes.md:256`, `couverture-json.json` portent tous les trois `config`/`--json`/`c-json` ; test 1 de `guard-json-couverture.test.js` vert avec 29 entrées |
| **CA-J3** — garde de dérivation G-J2 | PASS | les deux témoins négatifs **existent déjà comme tests** dans `guard-json-couverture.test.js` (`banner` sonde, `list` doc amputée en mémoire) et sont verts, donc rejoués à chaque `node --test` — confirmé exécuté (37/37, 11/11) |
| **CA-J4** — règle 6 écrite + gardée | PASS | témoin négatif « `{ok:false}` sans `status` en exit 0 » déjà en test, vert ; rejoué en direct : abstention réelle de `vendor-check` porte bien `status:"skipped"` (cf. tableau ci-dessus) |
| **CA-J5** — 9 lecteurs mesurés | PASS | contrefactuel non rejoué en écriture (retirer une entrée `NOMINAL` modifierait le code testé, hors mandat) ; les 9 invocations rejouées à la main (tableau ci-dessus + `frame lint --all`, `produit path/config/list` via la suite) sont toutes conformes |
| **CA-J6** — aucune dépendance réseau réelle | PASS | `endpoints --url http://127.0.0.1:1/x --timeout 1` rejoué : `ok:true`, `count` juste, aucune attente réseau perceptible |
| **CA-J7** — cliquet 14→9 dans le même commit | PASS | vérifié sur `couverture-json.json` : `horsCouvertureCount: 9`, 9 entrées `hors-couverture` restantes (toutes des écrivains, motif à jour) ; test CA-M16 du cliquet vert |
| **CA-J8** — prose humaine inchangée octet pour octet | PASS | **rejoué en entier sur un worktree `main` (`50bc0e4`) isolé** : les 9 fixtures (`commands`, `endpoints`, `frame-verify`, `frame-lint`, `review-show`, `produit-path/config/list`, `vendor-check`) sont **identiques** à la prose de `main`, normalisation comprise (horodatage/latence/racine/chemins jetables). Contrefactuel joué : un mot muté dans `commands.txt` fait rougir `CA-J8 : commands (prose) inchangée` en nommant `commands` ; restauré, suite revenue à 7/7 vert. Worktree supprimé après usage. |

## Garde de dérivation G-J2 (détail)

Testée sur un verbe fictif ajouté à `verbes.js` dans un **worktree jetable** (`git worktree`,
jamais le dépôt réel) : un verbe déclarant `--json` sans fichier de commande qui le parse ⇒
`G-J2 : derivation registre <-> parse <-> doc` rougit en nommant l'id (`déclaré=true, parsé=false,
documenté=false`), et la garde de fidélité du registre (CA-M16, test 1) rougit aussi (liste des
ids en écart). Les deux témoins déjà écrits dans le fichier (`banner` : déclaré sans parse ;
`list` : doc amputée en mémoire) couvrent en test permanent les deux sens exigés. Témoin positif
(`list` réel, cohérent) : aucun rouge. Worktree supprimé après usage.

## Règle 6 — abstention légale (détail)

Citation, `cli/src/lib/output.js:10-15` :
> « ABSTENTION LEGALE (AR-J3, lot C-JSON-COUVERTURE-COMPLETE) : `ok:false` avec exit 0 est admis
> SI ET SEULEMENT SI la charge porte un champ `status` non vide qui NOMME l'abstention (« je n'ai
> rien pu mesurer » — ex. `vendor-check` quand le frere GUI est absent, status:"skipped"). Reservee
> strictement a ce cas : JAMAIS a « j'ai mesure et c'est mauvais » (qui reste regle 4, exit 1). »

Rejoué sur le **vrai** `vendor-check` (pas une simulation) :
- `vendor-check --json` avec `IAKAFRAME_GUI_ROOT=<absent>` → `{ok:false, status:"skipped", ...}`,
  exit 0, stderr vide. Conforme.
- `vendor-check --strict --json` (même env) → `{ok:false, error, status:"skipped", ...}`, exit 1,
  stderr vide — dans `ERRORS` de `guard-json-output.test.js`, confirmé (37/37 vert, dont ce cas).
- Témoin négatif « `ok:false` sans `status`, exit 0 » — déjà écrit en test (fonction pure
  `guard-json-couverture.test.js`), vert.
- Prose humaine de `vendor-check` (mode humain, sans `--json`) : identique au témoin CA-J8
  (confirmé ci-dessus).

## NOMINAL / grain sous-verbe (AR-J1(b))

Les 9 nouvelles invocations J1 rejouées à la main (§ Inconnue n°1) donnent chacune une racine
unique et un stderr vide. `git diff 50bc0e4..HEAD -- cli/test/guard-json-output.test.js` confirme
que les 20 invocations `NOMINAL`/`ERRORS` d'origine ne sont pas touchées (diff = ajouts uniquement,
y compris la ligne `test.after()` qui étend la liste de nettoyage sans retirer aucun dossier
existant).

## Cliquet `couverture-json.json` — 14 → 9

Confirmé sur le fichier réel : `horsCouvertureCount: 9`, 29 verbes au total (config inclus). Les 5
sorties (`endpoints`, `frame`, `produit`, `commands`, `vendor-check`) sont motivées et **datées
par le commit** `36abbd7` (message détaillé nommant chaque verbe sorti et sa raison — pas de champ
de date par entrée dans le JSON, mais le geste est bien atomique : cliquet + motifs retirés dans
le même commit, ce que CA-M16 impose et vérifie).

**Contrefactuel CA-J13 — joué sur worktree jetable, jamais sur le dépôt réel.** J'ai ajouté un
verbe fictif (`bidon-fictif-caj13`) **entièrement conforme** : déclaré (`--json` dans `verbes.js`),
parsé (fichier de commande avec `json: { type: 'boolean' }`), documenté (`docs/commandes.md`), et
inscrit au registre en `hors-couverture` avec un motif non vide et `horsCouvertureCount` incrémenté
en conséquence. **Résultat : suite verte, 11/11, aucun rouge.**

**Réponse à la question posée : ce contrefactuel n'est gardé qu'en J3, pas en J1.** La garde de
complétude G-J1 (« toute invocation attendue — verbe + sous-verbe déclarant `--json` — a au moins
une entrée `NOMINAL` ou `ERRORS` ») n'existe pas encore dans `guard-json-couverture.test.js` — elle
est explicitement prévue à l'Étape 8 (J3) de l'instruction, avec son propre contrefactuel nommé.
En J0/J1, l'échappatoire `hors-couverture` reste **légale et non bornée** tant que le motif est
non vide et le cliquet à jour (CA-M16) : un verbe peut y entrer indéfiniment sans jamais être
mesuré, et rien ne rougit. Ce n'est pas un défaut du lot livré — c'est exactement la portée
qu'AR-J5(a) annonce (« 0 strict **puis** garde de complétude » : la garde arrive **après** que le
cliquet ait atteint 0, en J3). Aucun FAIL n'en découle pour J0/J1.

## Écarts

### 1. `frame verify` sans `count` frère de `findings` (préexistant, hors périmètre)
Confirmé par exécution directe (`frame verify --json` → `{ok, checked, findings}`, pas de `count`).
Déjà déclaré par Gimli (`docs/qualite/mesures-etape-0-lot-C-JSON.md` § Écarts constatés, point 2)
comme imperfection **préexistante** à ce lot, non corrigée à dessein (§ 2 de l'instruction interdit
les retouches de confort hors non-conformité prouvée par ce lot ; § 4 exclut l'harmonisation de
vocabulaire). Un successeur est nommé (`C-JSON-VOCABULAIRE` ou un lot dédié à `frame verify`) mais
reste conditionnel (« ou »), pas fermement engagé — à noter pour ne pas se perdre.

### 2. `vendor-check --gui <chemin explicite inexistant>` rend DRIFT, pas SKIPPED
Confirmé par exécution directe (tableau § Inconnue n°1). Déjà nommé par Gimli (§ Écarts constatés,
point 3) : seule l'**absence du paramètre** `--gui` (résolution implicite vide) déclenche
l'abstention réelle — un `--gui` explicite pointant vers du vide est traité comme une comparaison
(DRIFT total, tout en `fixture-manquante`). Le harnais de test utilise bien le vrai chemin
d'abstention (`IAKAFRAME_GUI_ROOT`, sans `--gui`), donc la garde CA-J4 mesure le bon cas. Pas un
défaut de ce lot — une précision de lecture pour qui rejouerait l'abstention à la main.

### 3. Incident sans conséquence : `skills --json` (bare) a réellement écrit dans le dépôt pendant ma vérification manuelle
En rejouant l'inconnue n°1 « à la main » (hors bac à sable de test), j'ai invoqué
`node src/index.js skills --json` **sans `--project`**, depuis `cli/` du dépôt réel. `skills`
(sans sous-verbe) est un **écrivain** (§ 0.3 : « écrivain (`deploy`, `--check`) ») qui, sans cible
explicite, résout la cible sur le `cwd` — il a donc déployé pour de vrai
`cli/.claude/skills/*` (22 skills) dans le dépôt sous vérification. **Ce n'est pas un défaut du
code** (le comportement est documenté et conforme à sa classe), c'est une négligence de ma
procédure de vérification manuelle. **Corrigé immédiatement** : le dossier écrit a été déplacé
(jamais supprimé) vers le bac à sable
(`/private/tmp/.../scratchpad/stray-cli-dotclaude-from-skills-cmd`), et `git status` sur le dépôt
réel a été reconfirmé propre avant de poursuivre. Aucune trace ne subsiste dans `feat/c-json-j0-j1`
ni dans `main`. Signalé pour la transparence du geste, sans impact sur le verdict.

## Non-régression

- Témoin CA-M8 (`install-prose-non-regression.test.js`) : 5/5 vert, intact.
- `git diff 50bc0e4..HEAD -- cli/src/` : limité à `lib/verbes.js:130` (ajout `'--json'` sur
  `config`) et l'en-tête de `lib/output.js` (règle 6). Aucun fichier de `cli/src/commands/`
  touché.
- `.github/workflows/release.yml` : diff vide, intact.
- `docs/commandes.md` : `config`, `agents`, `skills` documentés avec `--json` ; règle 6 écrite en
  toutes lettres ; aucune trace prématurée de la précédence `--json`/`--guide` (AR-J4/J3, hors
  périmètre) — conforme.
- `guide-doc-a-jour.test.js` + `guard-verbes-registre.test.js` : 24/24 vert.

## Recommandation sur J2/J3

**L'inconnue n°1 est levée, par exécution indépendante — pas seulement par lecture du rapport de
Gimli.** Aucun verbe déclarant `--json` ne l'accepte-et-ignore ; les 28 (29 avec `config`) le
parsent et l'émettent tous par `lib/output.js`. Conséquence directe pour l'estimation du § 9 de
l'instruction : **l'estimation de J2 (1,5 à 2 j) devient un chiffre ferme, plus une fourchette** —
la provision « +1 à +1,5 j » liée au risque R-J1 (un verbe accepté-et-ignoré forçant un
re-cadrage) ne s'applique plus, ce risque étant maintenant éteint par la mesure. Les deux
inconnues restantes du § 9 (coût réel de la bibliothèque jetable pour `add`/`attach`/`switch`/
`frame`, et durée du fichier de test une fois ~55 invocations montées) restent des inconnues
**d'ingénierie**, pas des inconnues de **nature du lot** — elles ne remettent pas en cause le
périmètre « garde seule » du § 2.

Recommandation : **engager J2** tel que cadré (AR-J2(b), bacs à sable via drapeaux de redirection
existants, zéro code de production hors la correction déjà actée). Le contrefactuel CA-J13
(§ Cliquet ci-dessus) montre que **G-J1 (complétude) doit impérativement arriver en J3** — sans
elle, l'échappatoire `hors-couverture` reste ouverte indéfiniment. Ce n'est pas un motif pour
avancer G-J1 plus tôt (l'instruction le prévoit ainsi, § 5 étape 8), mais un rappel à ne pas
clore le lot sans J3.

