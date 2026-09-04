# Gate qualité — Lot C.1 (le moteur de la chaîne d'installation)

- **Branche** : `feat/lot-C1-moteur-chaine` (5 commits au-dessus de `main`, arbre propre au moment du gate)
- **Date** : 2026-09-04
- **Vérificateur** : 🏹 Legolas, contexte séparé
- **Base** : `specs/instructions/chaine-complete-install-amorcage-dmg-msi.md` § 5.4, § 6.1 (étapes 9-10), § 9

## Verdict global : **PASS**

Toutes les mesures effectuées passent. Un **écart non bloquant** est documenté en fin de rapport
(message d'étape 2 imprécis dans un cas non couvert par un critère d'acceptation nommé) — il ne
renverse pas le verdict mais doit être porté à Gimli.

## Périmètre jugé

Jugés ici : **CA-03 à CA-15, CA-21** (lot C.1 : moteur des 4 étapes chaînées, rollback à trois
gardes, minisign, pose de bundle, double réseau étendu aux étapes 3/4).

**Hors périmètre, non jugés** (conformément à l'ordre de mission) :
- **CA-01, CA-02** — lot 0 (solde `publishConfig` + amendement du cadrage parent).
- **CA-16 à CA-20** — lots C.2 (façade Tauri) / C.3 (amorçage DMG/MSI), pas encore livrés sur cette
  branche (`ls` confirme l'absence d'un second dépôt d'installeur ; § 6.0 de l'instruction place
  ces lots *après* C.1).

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `for f in $(find src -name '*.js'); do node --check "$f"; done` (cli/) | `0` (aucune ligne `FAIL:`) | `syntax check done` — 0 erreur de syntaxe sur l'ensemble de `cli/src` |
| `node --test` (dans `cli/`, suite complète) | `0` | `tests 1049 / pass 1048 / fail 0 / cancelled 0 / skipped 1 / todo 0` (`duration_ms 81939` à `85983` selon passage) |
| `node --test test/rollback.test.js test/minisign.test.js test/app-bundle.test.js test/install-etapes-3-4.test.js test/reservoir-ar-f.test.js test/network-double.test.js test/autodeploi-ar1-ar4.test.js test/install-verbe.test.js test/sources-ordonnees-ar-h.test.js test/guard-verbes-registre.test.js test/guide-doc-a-jour.test.js` | `0` | `tests 91 / pass 91 / fail 0 / skipped 0` |
| `node --test test/vendor-check.test.js test/guard-perimeter-regression.test.js test/guard-json-output.test.js` (non-régression périmètre/JSON) | `0` | `tests 63 / pass 63 / fail 0` |

**Le 1 test `skipped`** est `frame-lint-parity`/`frontmatter-schema-parity`/`vocab-parity`-like : dépend de la
présence du dépôt frère `iakaFrameGUI` ou d'un binaire externe (`rg`), **sans rapport avec le lot
C.1** — comportement inchangé, préexistant.

Il n'existe **ni typecheck** (Node pur, zéro TypeScript) **ni lint outillé** (`eslint` absent du
poste, aucun script `lint` dans `cli/package.json`) sur ce projet : `node --check` (syntaxe) +
`node --test` (comportement) sont les seuls instruments disponibles, conformément à la profondeur
« campagne complète » demandée. Ni seuil ni test n'a été baissé ou masqué pour produire ce PASS.

## Tableau des critères (CA-03 à CA-15, CA-21)

| CA | Verdict | Preuve |
|---|---|---|
| CA-03 | **PASS** | `cli/test/install-verbe.test.js:94-116` (empreinte disque avant/après identique, dry-run) ; **re-mesuré en direct par moi** : `node src/index.js install --dry-run --root <arbre vivant réel> ...` décrit les 4 étapes (réseau réel consulté, GitHub + raw.githubusercontent.com) et l'empreinte du dossier scratch est restée byte-identique avant/après (`diff` vide) |
| CA-04 | **PASS** | `cli/test/install-verbe.test.js:118-129` : chaque étape annonce quoi/où/version/fusion et refuse sans confirmation en non-interactif (défaut sûr, `cli/src/lib/interactif.js:36-50`) |
| CA-05 | **PASS** | `cli/test/reservoir-ar-f.test.js` (« cas nominal, égalité ») + `cli/test/install-verbe.test.js:88-93` (provenance affichée à l'étape 1) ; re-mesuré en direct : `réservoir : vivant .../iakaframe (v0.39.0) — embarqué v0.39.0, égalité, le vivant l'emporte` |
| CA-06 | **PASS** | `cli/test/reservoir-ar-f.test.js` (« vivant SANS version… vivant l'emporte quand même ») ; `cli/src/lib/reservoir.js:73-82` ne lève jamais, rend `null` = indéterminée |
| CA-07 | **PASS avec réserve documentée** | `cli/test/install-verbe.test.js:130-141` : refus d'étape ⇒ arrêt (exit≠0) + commande de reprise énoncée. **Réserve** (non-bloquante, hors énumération stricte de CA-07) : voir « Écart non bloquant » ci-dessous — un cas précis rend la reprise proposée inopérante |
| CA-08 | **PASS** | `cli/test/autodeploi-ar1-ar4.test.js` : 3 tests dont le contrefactuel exigé (« garde DÉSARMÉE => AR-1 SE DÉCLENCHE RÉELLEMENT et pose le kit », `cli/src/lib/autodeploi.js:44-67`) — la garde rougit bien quand elle est désarmée |
| CA-09 | **PASS** | `cli/src/lib/verbes.js:82-89` (entrée `install`, `ecriture:true`, `guideClaudeCode.generer:false` motivé) ; `docs/commandes.md:248` documente le verbe dans le même lot ; `cli/test/guard-verbes-registre.test.js` (parité registre↔dispatch↔aide↔doc, verte) |
| CA-10 | **PASS** | `cli/test/install-verbe.test.js` (`run()` spawn le **vrai binaire CLI** en sous-processus, `test/install-verbe.test.js:59-64`) ; **re-mesuré en direct par moi** (hors suite de tests) : `node src/index.js install --dry-run --root /Users/sjupin/work/iakaframe --target-claude <scratch> --apps-dir <scratch> --backup-dir <scratch> --yes` a décrit les 4 étapes de bout en bout, réseau réel compris (manifestes IakaCockpit v0.32.2 et iakaFrameGUI v0.1.8 résolus depuis GitHub raw), **sans aucune interface**, exit 0, empreinte disque avant/après identique |
| CA-11 | **PASS** | `cli/test/rollback.test.js:14-49` (positif + 2 contrefactuels : sauvegarde manquante, `preuve.json` introuvable → refus explicite, rien supprimé) + `cli/test/install-etapes-3-4.test.js:213-239` (contrefactuel bout-en-bout via `etapeApp` réel) |
| CA-12 | **PASS** | `cli/test/rollback.test.js` (garde 2, isolation) + `cli/test/install-etapes-3-4.test.js:188-211` (app **déjà présente** avant la chaîne réellement restaurée après rollback réel, contenu vérifié par lecture disque) |
| CA-13 | **PASS** | `cli/test/rollback.test.js` (garde 3, complet + partiel) : jamais de « restauré » global, `cli/src/lib/rollback.js:106-120` énumère toujours |
| CA-14 | **PASS** | `cli/test/minisign.test.js` (signature valide/invalide/keyid différent/formats tronqués, clés Ed25519 fabriquées en mémoire) + `cli/test/install-etapes-3-4.test.js:129-148` (signature invalide **wiré dans `etapeApp` réel** → rien n'est écrit dans `--apps-dir`, vérifié par `fs.existsSync`) |
| CA-15 | **PASS** | `cli/test/install-etapes-3-4.test.js:91-106` : plateforme non couverte (`win32/x64` injecté) → refus explicite, **zéro appel réseau** (compteur d'appels = 0) |
| CA-21 | **PASS** | `cli/test/install-verbe.test.js:165-176` (chaîne complète en sous-processus, `--root` vide) + `cli/test/install-verbe.test.js:183-193` (étape 2 isolée) ; **re-mesuré en direct par moi** : `--root <dossier vide sans install.mjs>` ⇒ étape 2 refuse en nommant la cause exacte (« L'embarqué (\_bundled/) ne porte PAS d'install.mjs… »), étapes 3/4 jamais atteintes, exit 1, aucune écriture |

## Contrefactuels AR-5 (obligation explicite de la mission)

Les trois contrefactuels demandés sont couverts par des tests qui **écrivent réellement sur
disque** (pas de témoin vide) :

1. **Sauvegarde absente ⇒ refus** — `cli/test/rollback.test.js:31-49` et
   `cli/test/install-etapes-3-4.test.js:213-239` (contrefactuel bout-en-bout : la sauvegarde de
   l'étape 3 est supprimée du disque après coup ; le rollback refuse, ne touche rien, le résumé dit
   `PARTIEL`).
2. **App préexistante ⇒ restaurée** — `cli/test/install-etapes-3-4.test.js:188-211` : contenu
   pré-existant écrit sur disque, la chaîne le remplace, le rollback le restitue **au caractère
   près** (comparaison de contenu de fichier, pas juste de présence).
3. **Rollback partiel ⇒ énoncé de ce qui n'a pas été défait** — `cli/src/lib/rollback.js:106-120`
   (`orchestrerRollback` ne rend jamais de phrase d'ensemble) + test contrefactuel dédié
   (`rollback.test.js`, garde 3) : aucun `restauré` global n'apparaît nulle part dans le code ou
   dans les sorties observées.

Recherche active de contournement (`--force`/`--yes` glissé) : `--yes` (grep sur `install.js`) ne
saute **que** les confirmations (`confirmerEtape`) — jamais la vérification de plateforme (CA-15,
faite **avant** toute confirmation), ni la vérification de signature (CA-14, faite **après** la
confirmation mais **jamais** conditionnée à `--yes`). Aucun drapeau caché de type `--force` n'existe
dans `runInstall`/`etapeApp`/`etape2Methode`.

## Vérification manuelle CA-21 additionnelle (frontière du R10)

En plus du cas nominal (aucun réservoir vivant du tout), j'ai testé un cas **voisin, non couvert
par un test nommé** : un réservoir vivant **présent** (`install.mjs` existe) mais **plus ancien**
que la version embarquée (ex. `cli/package.json` en `0.1.0` face à un CLI `v0.39.0`).

Reproduction :
```
mkdir -p /tmp/legolas-c1-old/cli
echo '{"name":"@naonedge/iakaframe","version":"0.1.0"}' > /tmp/legolas-c1-old/cli/package.json
touch /tmp/legolas-c1-old/install.mjs
node cli/src/index.js install --dry-run --root /tmp/legolas-c1-old --target-claude /tmp/claude --yes
```
Sortie obtenue :
```
[2/4] méthode — délégation à install.mjs (M4, non réimplémenté)
  REFUS : aucun réservoir vivant avec install.mjs (réservoir : embarqué (v0.39.0) — vivant v0.1.0, plus ancien).
  L'embarqué (_bundled/) ne porte PAS d'install.mjs (cli/scripts/bundle.js ne le copie pas) —
  impossible de déléguer sans un arbre vivant. Reprise : iakaframe install --root <chemin-vers-un-clone-iakaframe>
```

Ceci est décrit en détail dans « Écart non bloquant » ci-dessous ; **ce n'est pas un FAIL de
CA-21** (le cas de CA-21 est « aucun réservoir vivant à proximité », qui est un cas distinct et
correctement couvert), mais une frontière adjacente que le cadrage ne nomme pas explicitement.

## Écart non bloquant

**Message trompeur et reprise inopérante quand un réservoir vivant existe mais est plus ancien
que l'embarqué** (`cli/src/lib/reservoir.js:142-155`, `cli/src/commands/install.js:223-228`).

- **Cause** : `resoudreReservoir` ne renseigne `installMjsPath` que lorsque `source === 'vivant'`
  (§ AR-F). Quand un vivant existe mais perd la comparaison de version (`source === 'embarque'`),
  `installMjsPath` devient `null` **même si `install.mjs` existe bel et bien sur le disque
  désigné par `--root`**.
- **Conséquence observée** : `etape2Methode` (`install.js:223-228`) affiche *« REFUS : aucun
  réservoir vivant avec install.mjs »* et *« L'embarqué (\_bundled/) ne porte PAS d'install.mjs…
  impossible de déléguer sans un arbre vivant »* — **énoncé factuellement inexact** dans ce cas
  précis : un arbre vivant *existe*, avec son `install.mjs`, à l'endroit même que l'utilisateur a
  donné en `--root`. La **commande de reprise proposée** (`iakaframe install --root
  <chemin-vers-un-clone-iakaframe>`) est **la commande que l'utilisateur vient déjà de jouer** :
  elle ne répare rien et rejouera l'échec à l'identique.
- **Pourquoi ce n'est pas un FAIL** : aucun critère d'acceptation (CA-03 à CA-15, CA-21) ne nomme
  ce cas précis ; CA-07 exige une « commande de reprise » sans en garantir l'efficacité, et CA-21
  couvre explicitement le cas *distinct* « aucun réservoir vivant » (ici un vivant existe). La
  ligne de provenance de l'étape 1, juste au-dessus dans la même sortie, dit la vérité (`vivant
  v0.1.0, plus ancien`) — l'information correcte est présente ailleurs dans la même sortie, elle
  n'est simplement pas reprise dans le message de refus de l'étape 2.
- **Élément aggravant, à consigner** : les auteurs du lot avaient déjà nommé cette distinction
  exacte (« vivant présent mais plus ancien » ≠ « aucun vivant ») pour l'étape 1 —
  `cli/test/etape1-reseau-ecarte.test.js:105` : *« le vivant EXISTE (juste plus ancien) — ce n'est
  PAS le cas "aucun vivant" »* — mais ne l'ont pas reportée sur le message de l'étape 2.
- **Scénario réel plausible** : quiconque invoque `iakaframe install --root ~/work/iakaframe` avec
  un CLI global plus récent que son checkout local (checkout pas encore mis à jour) tombe sur ce
  message et sa fausse piste de reprise.
- **Recommandation à Gimli** (signalée, non corrigée par moi) : distinguer, dans le message de
  refus de l'étape 2, les deux causes (« aucun install.mjs trouvé sous \<chemin\> » vs « un
  install.mjs existe sous \<chemin\> mais son `cli/package.json` (v0.1.0) est plus ancien que le
  CLI courant (v0.39.0) — mettez à jour ce dépôt ou passez `--root` vers un arbre plus récent »),
  et proposer une reprise qui corresponde réellement à la cause.

## Fichiers concernés (§ 7 de l'instruction) — conformité de périmètre

- `install.mjs` : **non modifié** (`git diff main...feat/lot-C1-moteur-chaine -- install.mjs` ne
  ramène rien) — conforme à « appelé, non modifié ».
- `IakaCockpit`, `iakaFrameGUI` : **non touchés** par cette branche (seul le dépôt `iakaframe` a
  des commits) — conforme à AR-E.
- Les clés publiques minisign et endpoints codés en dur dans `cli/src/lib/app-bundle.js:25-42`
  sont **byte-identiques** à ce que publient réellement `IakaCockpit/src-tauri/tauri.conf.json` et
  `iakaFrameGUI/src-tauri/tauri.conf.json` sur ce poste (vérifié par comparaison directe des deux
  `pubkey` et des deux listes `endpoints`).
- `docs/commandes.md:248` et `cli/src/lib/verbes.js:82-89` : à jour dans le même lot (CA-09).

## Conclusion

Le lot C.1 est **PASS**. Le moteur des 4 étapes, le rollback à trois gardes, la vérification
minisign et le double réseau étendu aux étapes 3/4 sont couverts par des tests réels (écriture
disque effective, fabrication de clés/signatures en mémoire, sous-processus réel du binaire CLI)
et confirmés par une exécution manuelle indépendante en dry-run consultant le réseau réel. Un seul
écart — non bloquant, hors énumération des critères d'acceptation — est signalé pour correction
dans un prochain lot touchant `install.js`/`reservoir.js`.
