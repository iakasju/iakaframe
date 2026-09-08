# Gate qualité — C-JSON-COUVERTURE-COMPLETE — lot J2 — branche `feat/c-json-j2`

Vérificateur : 🏹 Legolas. Date : 2026-09-08. Commits gatés : `44b77bb`, `1ff6063`, `57a61de`,
`17608be`, `6d064a0` (base `main` = `b64f1e8`). Cadrage : `specs/instructions/c-json-couverture-complete.md`
§ 5 étape 6, CA-J9..J11.

## Verdict : PASS

- **Intégrité de `main` : PASS, aucun écart.** `main` = `origin/main` = `github/main` = `b64f1e8` ;
  `git log origin/main..main` vide ; `git merge-base main feat/c-json-j2` = `b64f1e8` = `main`. Le
  reflog (`git reflog main -5`) montre l'incident et sa réparation :
  `main@{1}: commit 44b77bb` (commit égaré sur `main`) puis `main@{0}: branch: Reset to b64f1e8`
  (retour propre à l'état des remotes). `44b77bb` est confirmé comme le **premier commit** de
  `feat/c-json-j2` (`git log --oneline --reverse b64f1e8..feat/c-json-j2` le place en tête).
- **Verdict qualité J2 : PASS.** Aucun test rouge, aucune régression, cliquet fermé, non-régression
  `cli/src` vérifiée. Une réserve documentée (registre `verbes.js` incomplet sur `--root`
  attach/detach) est signalée en Écarts, hors périmètre de blocage de ce lot.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `node --test` (suite complète) | `0` | `tests 1245`, `pass 1244`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0` |
| `node --test cli/test/guard-json-output.test.js` | `0` | `tests 59`, `pass 59`, `fail 0` |
| `node --test cli/test/guard-json-couverture.test.js` | `0` | `tests 11`, `pass 11`, `fail 0` |
| `node --test cli/test/temoins-prose.test.js` | `0` | `tests 15`, `pass 15`, `fail 0` |
| `node --test cli/test/install-contrat-machine.test.js` | `0` | `tests 24`, `pass 24`, `fail 0` |
| `node --test cli/test/install-prose-non-regression.test.js` (CA-M8) | `0` | `tests 5`, `pass 5`, `fail 0` |
| `node --test cli/test/guide-doc-a-jour.test.js` | `0` | `tests 6`, `pass 6`, `fail 0` |
| `node --test cli/test/guard-verbes-registre.test.js` | `0` | `tests 18`, `pass 18`, `fail 0` |

**Écart d'annonce (non bloquant) :** la mission annonçait `1244/1243/0/1` pour la suite complète ;
mesuré : `1245/1244/0/1` (+1 test/+1 pass, 0 fail). Écart sans impact sur le verdict (aucun rouge).

### Témoins de prose J2 (CA-J8 § 5 étape 6)

9 fixtures J2 confirmées : `skills.txt`, `models-set.txt`, `add.txt`, `remove.txt`, `attach.txt`,
`detach.txt`, `switch.txt`, `consolidate.txt`, `range-list.txt`. Toutes créées **exclusivement**
au commit `44b77bb` (`git log --follow` sur chaque fichier : un seul commit, aucune retouche
ultérieure).

**Comparaison octet pour octet, worktree isolé sur `main`** : les 9 verbes rejoués dans un
`git worktree add --detach <tmp> main` (donc `cli/src` de `main`, jamais celui de `feat/c-json-j2` —
sans conséquence puisque J2 ne touche pas `cli/src`), avec la même normalisation que
`temoins-prose.test.js` (jetons `<PROJ>`/`<LIB>`/`<TRASH>`/`<ROOT>`) → **9/9 identiques** aux
fixtures committées. Worktree supprimé après usage (`git worktree remove --force`).

**Contrefactuel de mutation (joué et révoqué)** : mutation d'un mot du message humain de `add`
(`scaffolde` → `MUTE-scaffolde`) → `assert.equal` échoue, nommant explicitement le verbe
(`« add »`) et affichant le diff complet (`+ actual - expected`). Le témoin fait ce qu'il promet.

### Bac à sable réel (hors harnais), 5 invocations rejouées

| Invocation | Résultat |
|---|---|
| `add skill demo-sandbox-legolas --root <tmp> --json` | JSON racine unique, `ok:true`, stderr vide, exit 0, fichier `SKILL.md` matérialisé sous `<tmp>` |
| `attach demo-skill-attach-legolas --persona p-legolas-test --root <tmp> --json` | idem, `changed:true`, `skills:[]` du persona muté sous `<tmp>` uniquement |
| `switch iakaframe iakaframe-8 --path <tmp> --json` | idem, contrat + `.claude/iakaframe-kit.json` déployés sous `<tmp>` |
| `skills --project <tmp> --json` | idem, `count:20`, collection `skills` cohérente |
| `range --list --root <tmp> --json` | idem, `count:1`, `projets:["demo-projet-legolas"]` |

**Empreinte du dépôt réel identique avant/après** : `git status --porcelain` vide (avant et
après), `find cli library -newer <marqueur>` vide (avant et après) — aucune des 5 invocations n'a
laissé de trace dans le dépôt de travail.

**`range demo-projet-j2 --dry-run --root <tmp> --password-command false --json`** (invocation
exacte du scénario ERRORS, avec cible — ma première tentative sans cible produisait un message
d'usage différent, corrigée) : `{ ok:false, error: "restic a echoue (code 1) : ... Fatal:
Resolving password failed" }`, exit `1`, durée mesurée `320ms` process complet / `202ms` internes
(`dureeMs`), stderr vide, **rien écrit** sous `<tmp>` (`ls` inchangé : seul `demo-projet-j2`
préexistant). **Sur le réseau** : vérification indirecte seulement — l'échec porte sur la
*résolution du mot de passe* (`Resolving password failed`), qui dans restic précède
structurellement toute tentative de connexion au dépôt distant ; `bigserver` ne résout d'ailleurs
pas sur ce réseau (`NXDOMAIN` constaté). Je n'ai pas pu instrumenter un traceur réseau
(`dtrace`/`opensnoop` indisponibles sans `sudo` interactif dans ce bac à sable) : ce point est
**corroboré par les traces disponibles**, pas mesuré par instrumentation directe — à noter comme
limite de preuve, non comme un doute sur le résultat.

### Garde d'empreinte disque (contrefactuel joué en copie isolée)

Copie du test dans un **second worktree détaché** (`feat/c-json-j2`, jamais le dépôt de travail),
verbe `add` rejoué **sans** `--root` (retiré de la ligne `NOMINAL`). Résultat : le skill
`demo-skill-add-j2` est matérialisé dans la **vraie** `library/skills/` du worktree copié, et le
test `C-JSON empreinte (J2) : add a materialise le skill scaffolde sous ADD_LIB (jamais dans la
vraie library/)` **rougit** (`✖`), nommant précisément l'anomalie. La garde fait ce qu'elle
promet. Worktree et fichiers de copie supprimés après usage ; dépôt de travail non affecté
(`git status --porcelain` vide après nettoyage).

### Cliquet `couverture-json.json`

`horsCouvertureCount: 0`, aucune entrée `hors-couverture` restante. Diff du commit `57a61de` :
les 9 sorties (`skills`, `models`, `add`, `remove`, `attach`, `detach`, `switch`, `consolidate`,
`range`) portent chacune, avant leur clôture, un motif nommé et un successeur explicite
(« Successeur : C-JSON-COUVERTURE-COMPLETE (lot J2) »), conformément à la garde `guard-verbes-registre`
(témoin négatif : une exclusion sans motif est détectée et nommée — vérifié vert, 18/18). CA-M16
(inclus dans `guard-json-couverture.test.js`) reste vert. La **garde de complétude G-J1** n'existe
**pas encore** dans le code — confirmé par grep (`grep -rn "G-J1"` ne touche que
`BACKLOG.md`, `specs/instructions/c-json-couverture-complete.md`,
`docs/qualite/gate-c-json-j0-j1.md`, jamais un fichier `.test.js`) : c'est un état conforme,
G-J1 est explicitement de portée J3.

### `docs/commandes.md:349-352`, `verbes.js`, doc

Doc confirmée : `--root` figure aux lignes 349-352 sur `add`, `remove`, `attach`, `detach`.
`guide-doc-a-jour.test.js` (6/6) et `guard-verbes-registre.test.js` (18/18) verts.
`BACKLOG.md:656-665` : J2 consigné (« fermé par ⚒️ Gimli le 2026-09-08 ... non encore gaté »), J3
nommé (« refus explicite `--json`/`--guide` ... et la garde de complétude G-J1 ... Attend le gate
Legolas de J2 avant d'être engagé »).

**Écart signalé (recommandation, non bloquant pour J2) :** `cli/src/lib/verbes.js` déclare
`options: ['--root <dir>', ...]` pour `add` et `remove`, mais **PAS** pour `attach`
(`['--persona <id>', '--force', '--guide', '--json']`) ni `detach`
(`['--persona <id>', '--guide', '--json']`) — alors que `cli/src/commands/attach.js` parse et
utilise réellement `--root` (vérifié fonctionnellement dans le bac à sable ci-dessus) et que
`docs/commandes.md` le documente désormais (commit `17608be`). Le commit `17608be` corrige la
doc pour refléter le **comportement réel du code**, mais ne touche pas au **registre**
`verbes.js` — qui reste la source dérivée pour `commands --json` et pour les gardes
`guard-verbes-registre`/G-J2. Résultat : `commands --json` continuera de sous-déclarer `--root`
pour `attach`/`detach`, en écart silencieux avec la doc et la réalité, **sans qu'aucune garde
actuelle ne le détecte** (aucune des deux ne compare `--root` doc↔registre). Ce gap est
**pré-existant** (confirmé par `git log -p -S "attach" -- cli/src/lib/verbes.js` : l'absence de
`--root` dans les options d'`attach`/`detach` date d'avant ce lot) et **hors périmètre de J2**
(`cli/src` intact, cf. Non-régression ci-dessous) — je le signale pour arbitrage, candidat naturel
à J3 ou à un ticket dédié de cohérence registre↔doc↔code.

### Non-régression

- `git diff --stat main..feat/c-json-j2 -- cli/src` : **vide**. J2 ne touche que
  `cli/test/**`, `docs/commandes.md`, `BACKLOG.md`.
- Fichiers modifiés par le lot (stat complet) : `BACKLOG.md`, `cli/test/fixtures/couverture-json.json`,
  9 fixtures `cli/test/fixtures/temoins-prose/*.txt`, `cli/test/guard-json-output.test.js`,
  `cli/test/temoins-prose.test.js`, `docs/commandes.md`.
- CA-M8 (`install-prose-non-regression.test.js`) intact : 5/5.
- Les 20 invocations `NOMINAL` J0/J1 + les 9 nouvelles J2 dans `guard-json-output.test.js` sont en
  **ajout pur** : le seul retrait de ligne (`git diff`) est l'extension de la liste de nettoyage
  `test.after` (toutes les variables préexistantes conservées, nouvelles ajoutées) — pas une
  suppression de test. Idem `temoins-prose.test.js` : seul le commentaire d'en-tête est réécrit,
  aucun test J1 retouché (vérifié vert individuellement : 15/15).

## Recommandation sur J3

Le lot J3 (interactifs & verrou, AR-J4(c) : refus explicite `--json`/`--guide` sur 9 sites de
production / 10 cibles guidées ; garde de complétude G-J1 ; `horsCouvertureCount: 0` verrouillé) peut
être engagé. Je recommande d'y adjoindre — ou d'ouvrir un ticket séparé si le périmètre J3 est
jugé fermé — la **réconciliation du registre `verbes.js`** pour `attach`/`detach` avec `--root`
(déclaration manquante identifiée ci-dessus), afin que `commands --json` et les gardes de
dérivation (G-J2/`guard-verbes-registre`) redeviennent la source de vérité complète que le
cadrage leur assigne.
