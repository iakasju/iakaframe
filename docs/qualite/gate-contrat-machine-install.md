# Gate qualité — CONTRAT-MACHINE-DU-VERBE-INSTALL

> Branche `feat/contrat-machine-install` (tête `7292651`), base `main` (`e8c9f90`).
> Instruction : `specs/instructions/contrat-machine-du-verbe-install.md`.
> Vérifié par 🏹 Legolas le 2026-09-05, en contexte séparé de Gimli. Aucune coche du § 8
> n'est reprise comme acquise : chaque critère est re-mesuré ci-dessous.

## Verdict : **PASS**

La prose humaine du verbe `install` (critère central, CA-M8) est identique octet pour
octet avant/après le lot — vérifié indépendamment par worktree isolé sur `main`, par
rejeu manuel hors harnais de test, et par contrefactuel joué et révoqué. Les seize
critères d'acceptation sont mesurés et tiennent. La suite de tests passe intégralement
(1096 tests, 1095 pass, 1 skip non lié, 0 fail). Cinq écarts assumés par Gimli sont
tranchés ci-dessous : quatre recevables, un point mérite d'être noté au décideur (voir
§ Simplifications, point 3).

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `find cli/src -name '*.js' \| xargs -n1 node --check` | `0` | `SYNTAX_OK` sur l'ensemble de `cli/src` |
| `cd cli && node --test` (suite complète, sans filtre) | `0` | `tests 1096`, `pass 1095`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0` |
| idem, comparaison au départ annoncé par Gimli | — | Gimli annonçait 1056 → 1096 ; je mesure **1096** au total, cohérent. Le skip (`recall : moteur ripgrep si rg est installe (sinon test saute)`) est **sans rapport** avec ce lot — dépend de la présence de `rg` sur le poste, pas une régression. |
| Piège `_bundled/**/test.mjs` | — | **Observé** : `✔ _bundled/library/skills/iakaframe-appflowy-doc/test.mjs (121ms)` apparaît comme UN test dans le décompte (le bundle généré par `CA-B6` embarque et rejoue un test tiers) — piège préexistant connu, pas introduit par ce lot. |
| `node --test test/install-contrat-machine.test.js test/install-prose-non-regression.test.js test/guard-json-output.test.js test/guard-json-couverture.test.js test/install-verbe.test.js test/interactif.test.js` | `0` | `tests 87`, `pass 87`, `fail 0` |
| `node --test test/guard-verbes-registre.test.js` | `0` | `tests 18`, `pass 18`, `fail 0` |
| Rejeu manuel `install --dry-run` (réservoir vivant + double réseau, hors harnais de test) sur la **branche** | `0` | sortie normalisée **identique octet pour octet** au témoin `cli/test/fixtures/install-prose-dry-run.txt` (`diff` : aucune différence) |
| Rejeu identique sur `main` (`e8c9f90`, worktree isolé, supprimé après usage) | `0` | sortie **identique octet pour octet** au même témoin — la prose n'a pas bougé entre `main` et la branche |
| Contrefactuel CA-M8 (mutation `déjà à jour` → `a jour` sur copie isolée, supprimée après usage) | `1` | `AssertionError` nommant la ligne divergente (`+ 'a jour…'` / `- 'déjà à jour…'`) |
| `install --dry-run --events --root /Users/sjupin/work/iakaframe` (invocation réelle demandée) | `0` | **74 lignes**, **0** non-JSON, dernière ligne `evt:"fin"` |
| `install --dry-run --json --yes` (réservoir contrôlé) | `0` | racine unique, clés `['ok','count','evenements','etatAtteint','reprise']`, `ok` en 1ʳᵉ clé, `count === evenements.length` (35) |
| `install --json` en échec forcé (double réseau actif, racine vide) | `1` | stdout = racine `{ok:false, error:"étape 3 (IakaCockpit) refusée ou échouée", etatAtteint, reprise}`, **stderr strictement vide** |
| `install --json --events` | `1` | `{ok:false, error:"…--json et --events…"}`, nomme les deux drapeaux |
| `install --json --feu-vert stdin` | `1` | `{ok:false, error:"…--json et --feu-vert stdin…"}`, nomme les deux drapeaux |
| Feu vert stdin, réponse `oui` étape 1 puis `non` étape 2 (réservoir sans mise à jour dispo) | `0` (rien à confirmer à l'étape 1) | pas de `demande-feu-vert` (étape 1 "sautee" faute de mise à jour dispo dans ce réservoir) — voir § Simplifications (1) |
| Feu vert stdin sur réservoir avec mise à jour disponible (vivant v99.0.0), réponse `oui` étape 1 | `—` | `demande-feu-vert{etape:1}` puis `feu-vert{etape:1, accorde:true, canal:"stdin"}` — **la discrimination fonctionne aussi sur l'étape 1**, ce n'est qu'un effet du réservoir figé (v0.39.0=courante) dans le harnais standard |
| `grep -n "values.yes\s*=" install.js` | — | **0 occurrence** (CA-M13(1)) |
| `assemblerArgv(['install','--yes'])` | lève | `/echappatoire interdite/` — `ECHAPPATOIRES_INTERDITES = ['--force','--yes','--cascade','--autoriser-creation-depot']` inchangé |
| CA-M9, 3 invocations, script indépendant (empreinte disque avant/après) | `0` / `0` / `0` | `--dry-run`, `--dry-run --events`, `--dry-run --json` : **identique=true** sur les 4 zones (vivant/claude/apps/backups) |
| `git log --oneline -- cli/test/fixtures/install-prose-dry-run.txt` | — | **un seul commit** (`811247c`), jamais modifié depuis |
| Ordre des commits `811247c` (témoin) vs `4c142f9`/`46da8cd` (production) | — | `811247c` **précède** les deux — témoin enregistré avant toute modification, conforme à l'étape 1 de l'instruction |
| `shasum -a 256 cli/test/fixtures/install-prose-dry-run.txt` | — | `fba129cb951fa52e52e441a9754955987e41e81f08fb95881bb59a4499fa72f9` — identique au sha256 annoncé dans le message du commit `811247c` |
| `git status --porcelain` avant/après toute la session | vide/vide | arbre rendu exactement comme trouvé ; `cli/_bundled/` présent mais **ignoré** (`cli/.gitignore:3`), aucun résidu non ignoré |

## Tableau CA-M1..CA-M16

| Critère | Verdict | Preuve |
|---|---|---|
| **CA-M1** | **PASS** | 74/74 lignes JSON valides sur `--events`, dernière `fin`, 0 prose — vérifié par script indépendant, pas seulement le test |
| **CA-M2** | **PASS** | `etape-annoncee` de l'étape 2 porte les 6 champs (`quoi,ou,version,ceQuiSeraFusionne,sourceRetenue,sourcesConsultees`) — test direct sur l'autorité |
| **CA-M3** | **PASS** | `evt:"reservoir"` compare `provenance` à l'appel direct de `formatProvenance(...)`, jamais une chaîne réécrite |
| **CA-M4** | **PASS, avec réserve de couverture** | Le mécanisme discrimine correctement — vérifié moi-même sur l'étape 1 (réservoir v99.0.0) ET sur l'étape 2 (harnais standard). Voir Simplification (1) : la suite automatisée n'exerce la discrimination QUE sur les étapes 2/3/4, jamais 1, à cause du réservoir figé à la version courante |
| **CA-M5** | **PASS** | 4 chemins de refus par défaut (`--events` sans `--feu-vert`, EOF, ligne vide, JSON illisible) tous testés et verts |
| **CA-M6** | **PASS** | réponse `{"etape":4,...}` à une demande d'étape 2 → refus nommé `"reponse hors sequence"`, rien écrit |
| **CA-M7** | **PASS, avec réserve de couverture** | `evt:"rollback"` comparé champ à champ à `orchestrerRollback([preuve])` réel (préventeuve réelle, pas fabriquée). Voir Simplification (2) : la construction est **rejouée directement** (même code que le tail de `install.js`), pas via un aller-retour E2E complet par le binaire, faute d'un double réseau capable de faire réussir l'étape 3 puis échouer l'étape 4 |
| **CA-M8** | **PASS — critère central, mesuré indépendamment** | Témoin enregistré au commit `811247c`, jamais modifié ; `main` et la branche produisent le **même octet** que le témoin (vérifié par moi, worktree isolé) ; contrefactuel joué (mutation d'un mot) → rouge nommant la ligne |
| **CA-M9** | **PASS** | empreinte disque avant/après identique sur les 3 invocations `--dry-run`/`--dry-run --events`/`--dry-run --json`, script indépendant du harnais de test |
| **CA-M10** | **PASS** | racine unique, `ok` en 1ʳᵉ clé, `count === evenements.length`, une seule impression |
| **CA-M11** | **PASS** | échec réel forcé (double réseau actif + racine vide) → `{ok:false,error,etatAtteint,reprise}` sur stdout, exit 1, **stderr vide** |
| **CA-M12** | **PASS** | `--json --events` et `--json --feu-vert stdin` refusés explicitement, nommant les deux drapeaux, `exit 1`, rien écrit |
| **CA-M13** | **PASS** | (1) 0 affectation de `values.yes` ; (2) `ECHAPPATOIRES_INTERDITES` inchangé + `assemblerArgv` refuse toujours ; (3) `--feu-vert stdin` répondant `non` → exit 1, empreinte inchangée |
| **CA-M14** | **PASS** | `verbes.js:82-95` porte `--events`/`--feu-vert` avec motif de non-guidage ; `USAGE` corrige la phrase M-2 (vérifié par `install --help`, plus de "Sortie machine (desactive les confirmations interactives)" isolé) ; `docs/commandes.md:248` à jour ; `guard-verbes-registre.test.js` : 18/18 |
| **CA-M15** | **PASS** | `construireEvenement` rejette `bidule-hors-vocabulaire` ; sur une chaîne réelle, tout `evt`/`etat` appartient au vocabulaire exporté (comparaison à l'autorité) |
| **CA-M16** | **PASS** | registre `couverture-json.json` dérivé mécaniquement de `verbes.js` (aucun oubli/fantôme), `install` doublement couvert (`c-json`+`evenements`), chaque `hors-couverture` motivé, cliquet `horsCouvertureCount:14` cohérent avec le compte réel |

## Écarts / observations (non bloquants)

- **Asymétrie `etatAtteint.etapesFaites` en dry-run** (`install.js:638,666,679,700`) : les étapes 1 et 2 sont poussées dans `etapesFaites` **sans condition** de `dryRun` (y compris quand une mise à jour était *décrite* mais pas appliquée, cf. `install.js:285` qui retourne `dryRun:true` sans que l'appelant le lise), alors que les étapes 3 et 4 sont explicitement gardées par `if (!r3.dryRun)`/`if (!r4.dryRun)`. Aucun CA du lot ne teste ce champ pour ce cas précis (pas de FAIL formel), mais c'est une incohérence de sémantique : un client qui lirait `etapesFaites` pour décider une reprise pourrait croire les étapes 1/2 "faites" (écrites) en dry-run alors que rien ne l'a été. Signalé pour tri par le décideur — c'est le champ que la Simplification (3) ci-dessous documente partiellement, sans en couvrir toute l'ampleur.

## Simplifications assumées par Gimli — tranchées

1. **CA-M4 discriminé sur les étapes 2/3-4 au lieu de 1/2** → **recevable**. J'ai vérifié moi-même, hors du harnais de test, que le mécanisme fonctionne identiquement sur l'étape 1 dès qu'un réservoir force une mise à jour disponible (vivant v99.0.0 > courante v0.39.0) : `demande-feu-vert{etape:1}` puis `feu-vert{etape:1,accorde:true,canal:"stdin"}`. La limite est celle du **réservoir figé à la version courante** dans le harnais standard (`faireReservoirVivant({version:'0.39.0'})`), pas du code. C'est un trou de **couverture de test**, pas un défaut fonctionnel — recevable en l'état, mais je note qu'un jeu de test avec `version` différente de la courante aurait fermé complètement CA-M4 sur les 4 étapes au lieu de 3.

2. **CA-M7 sans aller-retour E2E complet (double réseau volontairement injoignable)** → **recevable**. Le double réseau du dépôt (`install-network-double.mjs`) répond `injoignable` de façon inconditionnelle pour les étapes 3/4 — aucune configuration ne permet de faire réussir l'étape 3 puis échouer l'étape 4 via une invocation réelle du binaire. C'est une limite du harnais **préexistante** au lot (le fichier `install-etapes-3-4.test.js` d'avant ce lot contourne déjà le binaire pour la même raison, cf. son propre commentaire d'en-tête). La preuve retenue — comparaison champ à champ à l'appel direct de l'autorité `orchestrerRollback`, sur une preuve réelle (pas fabriquée) — est une mitigation solide et proportionnée ; construire un double réseau à échec sélectif par étape serait un lot de plus, hors périmètre.

3. **`etatAtteint.etapesFaites` en dry-run ne compte pas 3/4 comme faites** → **à arbitrer par le décideur**. Ma mesure va au-delà de la formulation : ce n'est pas seulement que 3/4 sont exclues en dry-run, c'est que **1/2 sont incluses sans condition** (même quand une action était *décrite* et non appliquée), créant une asymétrie que ni l'instruction ni aucun CA ne spécifie explicitement. Le comportement actuel est défendable (lecture : "l'étape a été traitée sans erreur", pas "quelque chose a été écrit"), mais il n'est écrit nulle part et un consommateur (façade C.2-b) pourrait s'y tromper en construisant une logique de reprise. Recommandation : documenter explicitement la sémantique de `etapesFaites` dans `evenements.js` (§ champs de `fin`) avant que C.2-b ne s'appuie dessus — sans quoi ce sera un défaut découvert en aval, plus coûteux à corriger.

4. **Combinaisons incohérentes toujours rendues en JSON même quand seul `--events` est en cause** → **recevable**. Vérifié dans le code (`install.js:575,579`) : les deux seules combinaisons gardées (`--json`+`--events`, `--json`+`--feu-vert stdin`) impliquent **toutes deux** `--json` — il n'existe pas de combinaison incohérente qui n'implique QUE `--events`. Rendre le refus via `fail(true,...)` (format C-JSON, 2-indenté) plutôt qu'en NDJSON est cohérent : c'est `--json` qui est la contrainte dominante dans les deux cas (bufferisation), et un appelant qui a tapé `--json` s'attend à du C-JSON même en échec de validation d'arguments. Pas de défaut trouvé ici.

5. **Trou C-JSON des 14 verbes hors couverture, laissé au successeur `C-JSON-COUVERTURE-COMPLETE`** → **recevable, et ce n'est pas une simplification de Gimli** : c'est une décision **déjà actée dans l'instruction elle-même** (§ 4 « Exclu », M-10), pas un raccourci pris en cours de dev. Le registre est motivé et cliqueté (CA-M16, vérifié PASS), le successeur est nommé. Rien à trancher ici.

## Ce qui reste au décideur

- Le point 3 ci-dessus (sémantique de `etapesFaites` en dry-run) — je ne corrige pas, je signale : documentation à ajouter avant que C.2-b (façade) ne consomme ce champ pour bâtir une logique de reprise.
- Les trois points « non prouvables dans ce lot » déjà déclarés à l'instruction (§ 8, fin) restent hors de portée de ce gate : l'affichage réel par la façade (R-M4), la conduite bout-en-bout sur machine neuve, et le comportement Windows — tous explicitement renvoyés à C.2-b / C.3, non rouverts ici.

## Reproductions clés

```bash
# CA-M8 — rejeu manuel indépendant, hors harnais de test (résumé, script complet dans le rapport de session)
IAKAFRAME_INSTALL_TEST_DOUBLE=1 NODE_TEST_CONTEXT=child-v8 \
  node cli/src/index.js install --dry-run --root <reservoir-vivant> \
  --target-claude <tmp>/claude --apps-dir <tmp>/apps --backup-dir <tmp>/backups --yes
# -> normaliser <VIVANT>/<CLAUDE>/<APPS>/<BACKUPS>, diff avec cli/test/fixtures/install-prose-dry-run.txt => aucune différence

# CA-M1 — invocation réelle demandée par le mandat
node cli/src/index.js install --dry-run --events --root /Users/sjupin/work/iakaframe
# -> 74 lignes, 0 non-JSON, dernière evt:"fin"

# Suite complète
cd cli && node --test
# -> tests 1096, pass 1095, fail 0, skipped 1
```

