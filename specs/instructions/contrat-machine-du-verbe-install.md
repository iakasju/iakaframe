# Le contrat machine du verbe `install`

> Cadré par 🔵 **Gandalf**, le **2026-09-04**, sur ordre de mission de 🟠 Aragorn.
> **Lecture seule** sur tout le code pendant le cadrage.
>
> **Ce lot est le prérequis nommé** par le cadrage de la façade
> (`~/work/iakaInstall/specs/instructions/facade-installeur-tauri-ossature-release.md`, § 3 AR-I1,
> verdict **(b)** du décideur : C.2 scindé, le prérequis CLI joué en parallèle). Il détaille les
> **six manques** que ce cadrage-là énumère sans les résoudre — et **il les résout ici**.
>
> **Cadrages de référence, qui font foi et ne sont pas rediscutés** :
> `specs/instructions/chaine-complete-install-amorcage-dmg-msi.md` — **AR-3** (façade, jamais une
> seconde implémentation) · **AR-4** (une validation par étape, `--yes` les saute toutes) ·
> **AR-5** (rollback, trois gardes) · **AR-F** (provenance) · **§ 5.5** (garde AR-1/AR-4) ·
> **CA-04, CA-05, CA-07, CA-09, CA-10, CA-13**.
> `specs/instructions/cli-api-surface-harmonisation.md` — le contrat **C-JSON** (`lib/output.js`).
> `specs/instructions/cli-mode-guide-selections.md` — **A4** (le guidage n'ajoute jamais
> `--force`/`--yes`), **G3b** (un seul lecteur de `readline`/`stdin`).
>
> ⚠️ **Ce lot touche un verbe déjà gaté PASS** (`docs/qualite/gate-lot-C1-moteur-chaine.md`).
> La contrainte la plus dure n'est pas d'ajouter la sortie machine : c'est de **ne rien changer
> au mode terminal humain**. Cette contrainte est portée par **CA-M8**, un témoin **octet pour
> octet**, et par rien d'autre.

---

## 0. Ce qui a été mesuré le 2026-09-04

### 0.1 — Instruments, et leur limite déclarée

- **Lecture de fichiers** (`Read`, `Grep`, `Glob`) sur `~/work/iakaframe` : `cli/src/`,
  `cli/test/`, `docs/`, `specs/instructions/`, `install.mjs`.
- **Vérification web** pour les deux faits externes qui commandent une décision de forme (NDJSON,
  `node:readline` hors TTY) — sources datées en § 10.
- ❌ **Aucun shell dans cette session.** L'ordre de mission annonçait « tu as un shell » : **je
  n'en ai pas** — mon jeu d'outils est `Read`/`Grep`/`Glob`/`Write`/`Edit`/`WebSearch`/`WebFetch`,
  sans `Bash`. **Je le déclare plutôt que de citer des sorties que je n'ai pas produites.**
  Conséquence exacte, et elle est bornée : les faits M-1 à M-9 ci-dessous sont établis **par
  lecture du code sur le disque** (chaque fait porte son `fichier:ligne`), **plus** un fait
  **d'exécution** que je n'ai pas joué mais qui m'est transmis attribué — M-0. Les commandes qui
  transformeraient toute cette section en mesures d'exécution sont données à l'**étape 0** du § 5 :
  c'est le premier geste demandé à ⚒️ Gimli, avant d'écrire une ligne.

### 0.2 — Le fait d'exécution, attribué

- **M-0 — `install --json` imprime de la prose et sort en 0.** Exécution jouée par 🟠 **Aragorn**
  le 2026-09-04 :
  `node cli/src/index.js install --dry-run --json --yes --root /Users/sjupin/work/iakaframe`
  → sortie : `==== iakaframe install ====` / `4 étapes / 3 téléchargements` / … ; **code de
  sortie 0**. **Attribué, non re-joué par moi.** Ce fait est **cohérent** avec M-1/M-2 ci-dessous,
  qui l'expliquent ligne à ligne — mais il ne les remplace pas, et l'inverse est vrai aussi.

### 0.3 — Le verbe, tel qu'il est réellement

- 🛑 **M-1 — `install.js` n'a AUCUN canal de sortie machine.** Balayage du fichier entier
  (`cli/src/commands/install.js`, **475 lignes**) sur `output\.js|JSON\.stringify|printJson` :
  **aucune occurrence**. Le fichier **n'importe pas** `lib/output.js` (imports :30-43). Toute la
  sortie est faite de `console.log` de prose française. **`values.json` n'est lu qu'à un seul
  endroit** — `confirmerEtape` (`install.js:65-70`), qui le passe à `peutDemander`.
- 🛑 **M-2 — Et le registre promet pourtant une sortie machine.** `cli/src/lib/verbes.js:84`
  déclare `--json` parmi les options du verbe — et le registre est la **source unique** de
  `--help` et de `commands --json` (`cli/test/guard-verbes-registre.test.js:74-84`).
  `install.js:59` l'annonce verbatim : *« `--json` Sortie machine (desactive les confirmations
  interactives) »*. **La première moitié de cette phrase est fausse ; seule la seconde est vraie.**
  `docs/commandes.md:248` ne la contredit pas. Un drapeau qui promet ce qu'il ne fait pas est un
  défaut, même quand il ne casse rien.
- 🛑 **M-3 — Le verbe est hors du contrat C-JSON, et personne ne le mesure.** La convention est
  portée par `cli/src/lib/output.js:1-11` (**5 règles**, dont la **1** : « racine = toujours un
  objet JSON […] 2-indentée sur stdout », et la **4** : erreur `{ok:false,error}` **sur stdout**,
  `exitCode = 1`, **rien d'humain sur stderr**). Elle est gardée par
  `cli/test/guard-json-output.test.js`, dont la liste `NOMINAL` (`:70-90`) balaye **19
  invocations** — `list`, `list <type>`, `portfolio`, `assemble`, `agents list`, `agents status`,
  `config`, `show`, `memory init|path|config|list`, `open`, `recall`, `observe list`,
  `review list`, `close`, `services`, `canaux`. **`install` n'y figure pas.**
- 🛑 **M-4 — Il n'existe aucun canal de consentement non-TTY, et `--json` refuse tout.**
  `peutDemander` (`cli/src/lib/interactif.js:36-50`) rend `true` **si et seulement si** six
  conditions tiennent : `stdin.isTTY`, `stdout.isTTY`, `CI` neutre, `IAKA_NON_INTERACTIF` neutre,
  **`json !== true`**, `guide === true`. `confirmerEtape` (`install.js:65-70`) : `--yes` ⇒ `true` ;
  sinon non-interactif ⇒ **`false`, refus**. Le prompt lui-même, `askYesNo`
  (`interactif.js:58-63`), lit `process.stdin` par `readline`.
  **Conséquence dure, et c'est le cœur du lot** : un programme qui lance `install --json` obtient
  un **refus à la première étape qui demande quelque chose** ; le seul moyen de faire avancer la
  chaîne depuis un programme est **`--yes`, qui saute TOUTES les validations** — AR-4 nié.
- 🛑 **M-5 — DEUX sous-processus écrivent leur prose DANS le flux du parent, et l'un partage son
  `stdin`.** C'est le fait que le cadrage de la façade n'avait pas relevé, et il commande la forme
  du canal (AR-M3) :
  - étape 1 : `spawnSync('npm', ['install','-g',…], { stdio: 'inherit' })` — `install.js:200`
    (commande construite `:152`, `:171-173`) ;
  - étape 2 : `spawnSync(process.execPath, [install.mjs, …], { stdio: 'inherit' })` —
    `install.js:271`.
  `stdio:'inherit'` signifie **trois** descripteurs partagés : la prose de `npm` et celle
  d'`install.mjs` **tombent dans le stdout du parent**, et le **`stdin` du parent est offert à
  l'enfant**. Un flux d'événements ligne-par-ligne serait donc **pollué par construction**, et le
  canal de consentement **exposé au vol de sa propre ligne**.
- ✅ **M-6 — Mais l'enfant de l'étape 2 ne lira jamais ce `stdin`, et c'est mesurable.**
  `install.mjs:380` : `const interactive = !opts.dryRun && !opts.yes && process.stdin.isTTY;` — et
  `install.js:269` lui passe **toujours** `--yes` (le feu vert AR-4 vient d'avoir lieu au-dessus).
  Donc `opts.yes` est vrai, `interactive` est faux, et `readline` (`install.mjs:382`) **n'est
  jamais ouvert**. **Capturer sa sortie ne change pas son comportement** — le seul risque est celui
  de M-5, et il se ferme en donnant `stdin: 'ignore'` aux enfants en mode machine.
- ✅ **M-7 — Le rapport de rollback est DÉJÀ structuré ; il ne manque que la sortie.**
  `orchestrerRollback` (`cli/src/lib/rollback.js:106-120`) rend
  `{ rapports, resume, defaits, nonDefaits }`, chaque rapport portant `{ etape, cible, ok, defait,
  raison }` (`:108`). Il est **imprimé en texte** par `install.js:466-467`. Point 4 du prérequis :
  **zéro logique nouvelle**, seulement un canal.
- ✅ **M-8 — La provenance est DÉJÀ en champs ; c'est la phrase qui est imposée, pas l'inverse.**
  `resoudreReservoir` (`cli/src/lib/reservoir.js:141-186`) rend `source`, `vivantRoot`,
  `vivantRootCandidat`, `vivantPresent`, `vivantVersion`, `embarqueDir`, `embarqueVersion`,
  `installMjsPath`, `installMjsCandidatVivant`, `installMjsCandidatEmbarque`, **plus** `provenance`
  — la phrase au **format imposé** par AR-F (`formatProvenance`, `:120-132`), imprimée par
  `install.js:146`. Point 3 : **exposer les champs sans perdre la phrase** (CA-05 porte sur la
  phrase).
- ✅ **M-9 — Le verbe est déjà tissé de points d'injection, et c'est l'idiome du dépôt.**
  `etape1Cli({ …, execNpmInstall, sondes })` (`install.js:143`), `etapeApp({ …,
  resoudreEndpointsApp, telechargerApp, plateforme })` (`:298-302`), `choisirDansListe({ ask, … })`
  (`lib/guidage.js:66-68`), `peutDemander({ env, stdin, stdout })` (`interactif.js:36-42`). **Le
  patron « le comportement de production par défaut, la couture injectée pour le test » est
  établi** — c'est celui que ce lot réutilise pour les deux ports neufs (émission, feu vert),
  jamais un second idiome.
- 🟠 **M-10 — L'ampleur réelle du trou C-JSON dépasse `install`.** `cli/src/lib/verbes.js` porte
  **40** entrées de premier niveau (`^    id: '`) et **57** occurrences de `'--json'` (verbes +
  sous-verbes) ; `NOMINAL` en couvre **19**. **Ce lot ne referme pas cet écart** — il refermerait
  un lot entier à lui seul. Il le **déclare** et le nomme (§ 4, successeur
  `C-JSON-COUVERTURE-COMPLETE`), parce qu'une garde qui tairait son hors-couverture serait une
  garde muette.

### 0.4 — Le harnais de test disponible, relevé

Ce lot n'a **aucun** harnais à inventer : tout ce dont il a besoin existe et est éprouvé.

| Outil | Où | Ce qu'il donne |
|---|---|---|
| **Double réseau à deux signaux** | `cli/src/lib/network-double.js:32-34` (`IAKAFRAME_INSTALL_TEST_DOUBLE=1` **et** `NODE_TEST_CONTEXT`), fixture `cli/test/fixtures/install-network-double.mjs` | un sous-processus `install` qui **n'atteint jamais le réseau réel** |
| **Réservoir vivant contrôlé** | `cli/test/install-verbe.test.js:46-52` (`faireReservoirVivant`) | un `install.mjs` réel + `cli/package.json` à version choisie |
| **CLI sans `_bundled/`** | `install-verbe.test.js:35-44` (`cliSansBundled`) | un embarqué **garanti amputé**, indépendant de l'état ambiant du poste |
| **Empreinte disque avant/après** | `install-verbe.test.js:56-70` (`empreinte`) | la preuve de CA-03 (« `--dry-run` n'écrit rien »), **par contenu**, pas par comptage |
| **Runner avec `input`** | `install-verbe.test.js:77-80` (`run(args, { input })`) | de quoi **scripter des réponses sur stdin** — la couture exacte dont le canal de consentement a besoin |

### 0.5 — Les faits externes, vérifiés le 2026-09-04

- **NDJSON, spécification `1.0.0` du 2014-10-19** (`ndjson/ndjson-spec`) : *« Each JSON text MUST
  be written to the stream followed by the newline character `\n` »* ; *« The newline character MAY
  be preceded by a carriage return `\r` »* ; *« All serialized data MUST use the UTF8 encoding »* ;
  *« The parser MAY silently ignore empty lines […] This behavior MUST be documented »* ; MediaType
  **SHOULD** be `application/x-ndjson`. **Conséquence directe** : chaque ligne doit être **un JSON
  compact** — donc `printJson` (2-indenté, `output.js:27-29`) **ne peut pas** servir de sortie
  d'événement, et un `JSON.stringify` compact ne doit pas non plus être écrit en direct dans
  `commands/` (le verrou statique `guard-json-output.test.js:30-39` l'interdit). Il faut **un
  second point d'émission dans `lib/`**, sous le même verrou. → AR-M3.
- **`node:readline` hors TTY** (doc Node) : l'option `terminal` a pour **défaut** *« checking
  `isTTY` on the `output` stream upon instantiation »* — donc `false` sur un tube, sans rien à
  configurer ; et la doc dit explicitement *« If not using a TTY stream for input, use the `'line'`
  event »*. `readlinePromises`, `rl.question()` rend *« A promise that is fulfilled with the user's
  input »*, annulable par `AbortSignal`. **Conséquence** : lire **une ligne de consentement sur un
  `stdin` non-TTY est un chemin documenté et sans dépendance** — c'est le fait qui rend AR-M1(a)
  jouable en Node pur (CA-1 du Lot A : zéro dépendance).

---

## 1. Problème

Le moteur d'installation **ne parle qu'aux humains**. Ses quatre étapes s'annoncent, demandent un
feu vert, nomment leur source et rendent compte de leur rollback — **en prose française sur
stdout**. Aucun de ces quatre états n'est atteignable par un programme (M-1, M-4, M-5).

La façade d'installation (lot C.2-b, `iakaInstall`) doit **afficher** ces états et **recueillir**
les feux verts. Elle n'a aujourd'hui que deux voies, et les deux sont fermées :

1. **parser la prose** — c'est **R3 réalisé** : la façade porterait une seconde lecture, donc une
   seconde implémentation, de la logique d'étape ; et une prose n'est pas un contrat, elle change
   au premier lot qui reformule un message ;
2. **`--yes`** — qui saute **toutes** les validations (`install.js:66`), c'est-à-dire **AR-4 nié**,
   emballé dans une interface.

Ce lot ouvre la troisième voie : **un contrat machine**, en sortie **et en entrée**. Il ne change
**aucune** logique d'installation — il expose celle qui existe.

**Et il solde une dette d'honnêteté** : `--json` est déclaré au registre, documenté, annoncé par
`--help`, et **n'émet rien** (M-0, M-1, M-2).

---

## 2. Décision retenue

> **Un seul moteur, deux rendus, deux ports injectés. La prose ne bouge pas d'un octet.**

Concrètement — **sous réserve des trois arbitrages du § 3**, dont deux changent un comportement
observable et sont donc **soumis au décideur** :

1. **Un vocabulaire d'événements fermé**, déclaré dans un module neuf `cli/src/lib/evenements.js`,
   couvrant les six manques : annonce d'étape (quoi / où / version / ce qui sera fusionné /
   source retenue et pourquoi), demande et octroi de feu vert, provenance en champs, rapport de
   rollback, état atteint et commande de reprise.
2. **Un port d'émission injecté.** Chaque `console.log` de `install.js` devient un appel
   `dire(<prose EXACTEMENT inchangée>, <événement ou null>)`. En mode humain, `dire` fait
   `console.log(prose)` — **rien d'autre ne se produit**. En mode machine, `dire` **n'imprime
   aucune prose** et émet l'événement. **Les chaînes de prose ne sont ni réécrites, ni déplacées
   dans un module de rendu, ni reformulées** — les toucher est précisément ce que CA-M8 fait
   rougir.
3. **Un port de feu vert injecté.** `confirmerEtape` gagne **une seule branche**, **avant**
   `peutDemander` : si un canal machine est armé, il émet `demande-feu-vert` puis **lit une ligne**
   sur `stdin`. Sinon, le chemin existant est atteint **inchangé**.
4. **Le défaut est le refus, partout.** Pas de réponse, EOF, ligne illisible, numéro d'étape qui ne
   correspond pas ⇒ **refus**. Jamais un feu vert supposé. C'est la même doctrine que
   `peutDemander` (`interactif.js:43-49`, six `return false` avant le seul `return true`).
5. **`--yes` reste ce qu'il est** — le raccourci humain qui saute tout — et **aucun chemin** ne
   permet au canal machine de le positionner. Garde statique + garde comportementale (CA-M13).
6. **Les sous-processus cessent de polluer le flux en mode machine** : `stdio` piped, `stdin:
   'ignore'`, sortie ré-émise en événements typés. En mode humain, `stdio: 'inherit'` **inchangé**.

**Ce qui est écarté, avec son motif :**

| Écarté | Motif |
|---|---|
| **Réécrire la prose « pendant qu'on y est »** (uniformiser, traduire, corriger une coquille) | Le verbe est **gaté PASS** ; sa prose est le comportement observable de tous les utilisateurs actuels. Toute retouche est un **autre lot**. CA-M8 la protège **octet pour octet**. |
| **Déporter la prose dans un module de rendu** | Un déplacement est une réécriture qui s'ignore : indentation, interpolation, ordre des lignes. Le gain (symétrie) ne vaut pas le risque (régression silencieuse d'un verbe gaté). |
| **Faire de `--json` le flux NDJSON** | Viole la règle 1 de C-JSON (`output.js:1-11`) **pour tout le CLI** : la garde devrait alors porter une exception nommée pour `install`, et le contrat cesserait d'être un contrat. |
| **Un timeout sur l'attente du feu vert** | Le client est une **interface graphique où un humain clique**. Un délai transformerait une hésitation en refus silencieux. **EOF** est le signal de fin, pas l'horloge. |
| **Un état persistant entre invocations** (une étape par appel) | Écarté en AR-M1 ; motif complet là-bas. |
| **Refermer le trou C-JSON des 20 autres verbes** | M-10 : c'est un lot entier. Déclaré, jamais tu — successeur `C-JSON-COUVERTURE-COMPLETE`. |
| **Toucher `iakaInstall`** | Autre dépôt, autre lot (C.2-b). ⚒️ Gimli y travaille **en parallèle** : ce lot n'y écrit **rien**. |
| **Étendre le contrat aux étapes 3/4 Windows/Linux** | Elles refusent explicitement hors macOS (`install.js:317-327`, CA-15). Le contrat **rend ce refus en champs** ; il ne l'ouvre pas. Successeur déjà nommé : `ETAPES-3-4-WINDOWS-LINUX`. |

---

## 3. Arbitrages — ce que je ne peux pas trancher seul

*Chacun porte ma recommandation. Aucun n'est tranché ici.*

### AR-M1 — Par quel canal un programme donne-t-il un feu vert PAR étape ?

C'est le manque n° 2 du prérequis, et le seul qui n'a **aucune** amorce dans le code (M-4).
Quatre voies, pesées contre **AR-3** (une seule implémentation) et contre le fait que la façade
**embarque Node** (AR-I2(b), tranché par le décideur).

- **(a) Protocole ligne-par-ligne sur `stdin`.** Le CLI émet `{"evt":"demande-feu-vert","etape":2,
  …}` puis **lit une ligne**. Le client répond une ligne : `{"etape":2,"reponse":"oui"}`.
  **Pour** : une seule invocation, un seul processus, un seul état en mémoire — donc **le rollback
  inter-étapes reste possible** (c'est la seule voie où il le reste, cf. (b)) ; le feu vert arrive
  **après** l'annonce, ce qu'AR-4 exige littéralement (« s'annonce […] puis attend ») ; Node lit
  une ligne sur un `stdin` non-TTY **sans dépendance** (§ 0.5) ; la façade tient déjà un tube vers
  le processus enfant. **Contre** : c'est un protocole, donc une **désynchronisation possible** —
  fermée par l'obligation, pour la réponse, de **nommer l'étape** qu'elle vise (CA-M6) ; et il faut
  que **rien d'autre** ne lise ce `stdin` (M-5 → `stdin: 'ignore'` aux enfants).
- **(b) Sélection d'étape (`--step N` / `--from N`).** La façade appelle le verbe **quatre fois**.
  **Pour** : aucun protocole. **Contre, et c'est dirimant** : (1) le consentement deviendrait **le
  fait d'invoquer**, c'est-à-dire un `--yes` par étape — l'annonce ne précéderait plus le feu vert,
  sauf à faire une passe `--dry-run` préalable, donc **deux lectures de la vérité, donc R3** ;
  (2) le **rollback AR-5 se perd** : `install.js:456-468` déclenche le rollback de l'étape 3 quand
  l'étape 4 échoue, à partir de `r3.preuve` **tenue en mémoire** — entre deux processus, cette
  preuve n'existe plus dans le processus qui échoue. *(`rollback.js:64-97` relit bien `preuve.json`
  sur disque, mais c'est `orchestrerRollback` qui sait **quelles** preuves rejouer, et il ne le
  sait que du déroulé en cours.)*
- **(c) Une étape par invocation avec état persistant sur disque.** = (b) + un fichier d'état.
  **Contre** : reconstruit le rollback à travers un fichier qu'il faut versionner, invalider et
  garder cohérent avec le disque réel ; et **ne corrige pas** le défaut de consentement de (b).
  Sur-ingénierie caractérisée pour un MVP.
- **(d) API programmatique (la façade importe le module).** `runInstall({ confirmer, emettre })`.
  **Pour** : la forme la plus pure. **Contre** : la façade est **Tauri/Rust** — elle *spawn* Node,
  elle n'importe rien. « Importer le module » veut donc dire **écrire un script adaptateur Node**
  que la façade lance… et qui devra parler à Rust par un protocole. **(d) retombe sur (a), avec un
  fichier de plus** — et ce fichier serait la seconde implémentation qu'AR-3 interdit.

> **Recommandation : (a)** — et **(d) est obtenu gratuitement, sans le fichier de plus**, parce que
> l'émission et le feu vert sont des **ports injectés** (M-9) : tout appelant Node peut passer son
> propre `confirmer`/`emettre` sans passer par `stdin`. Une seule implémentation, deux façons de
> l'atteindre. **Ce que (a) coûte, dit franchement** : un protocole se désynchronise ; c'est
> pourquoi CA-M5 (défaut = refus) et CA-M6 (la réponse nomme son étape) ne sont pas négociables —
> sans eux, (a) devient un `--yes` déguisé.
>
> **Nom du drapeau proposé, à ne pas re-litiger en cours de dev** : `--feu-vert <mode>`, modes
> `refus` (**défaut**) et `stdin`. Vocabulaire français assumé, aligné sur `--rattraper`,
> `--premier`, `--artefacts` déjà au registre — et sur le vocabulaire d'AR-4 lui-même.

### AR-M2 — Que devient `--json` ? *(change un comportement observable → soumis au décideur)*

Aujourd'hui `install --json` **imprime de la prose et sort en 0** (M-0). Trois issues :

- **(a) `install` entre au contrat C-JSON.** `--json` **bufferise** les événements et imprime, à la
  fin, **une seule racine objet** : `{ ok, count, evenements:[…], etatAtteint, reprise }` — et en
  échec `{ ok:false, error, evenements:[…], etatAtteint, reprise }` sur **stdout**, `exit 1`, rien
  sur stderr (règle 4). Le verbe **entre dans `NOMINAL`** (`guard-json-output.test.js:70-90`).
  **Pour** : le drapeau cesse de mentir ; un script de CI obtient enfin un rapport ; coût marginal
  **quasi nul** (les événements existent déjà, il n'y a qu'à les accumuler). **Contre** : **change
  un comportement observable** — ce qui sortait en prose sort désormais en JSON ; et `--json` étant
  bufferisé, il est **incompatible avec le feu vert par étape** (un client ne peut pas répondre à
  une demande qu'il ne verra qu'à la fin) → la combinaison doit être **refusée explicitement**.
- **(b) `--json` est RETIRÉ du registre pour ce verbe.** `verbes.js:84`, `install.js:59`,
  `docs/commandes.md:248`. **Pour** : le mensonge cesse pour **zéro** ligne de logique. **Contre** :
  supprime un drapeau public (rupture pour quiconque le passe aujourd'hui — même s'il n'obtient
  rien) ; et laisse le CLI **sans rapport machine** pour les usages qui n'ont pas besoin de flux
  (CI, `--dry-run`, diagnostic).
- **(c) `--json` devient le flux NDJSON.** Écarté au § 2 : viole la règle 1 pour tout le CLI.

> **Recommandation : (a)**, avec le flux d'événements porté par un **drapeau distinct** (AR-M3) et
> les combinaisons incohérentes **refusées, jamais silencieusement dégradées** :
> `--json --events` ⇒ refus ; `--json --feu-vert stdin` ⇒ refus. Motifs : **(1)** c'est la seule
> issue qui **solde** le point 6 du prérequis sans rien retirer ; **(2)** le coût est marginal
> parce qu'**un seul émetteur** alimente les deux rendus — pas deux implémentations, un émetteur et
> deux façons de le vider (immédiate / différée) ; **(3)** l'entrée dans `NOMINAL` donne au verbe
> **la garde qui lui manque** (M-3) : aujourd'hui son `--json` est vide *et personne ne le mesure*.
>
> ⚠️ **Ce que je soumets, précisément** : (a) **change ce que voit** quiconque tape
> `install --json` aujourd'hui. C'est un changement voulu et documenté — mais c'est un changement
> observable, et il n'est pas à moi de le décider.

### AR-M3 — Où sort le flux d'événements ? *(change un comportement observable → soumis au décideur)*

M-5 est le fait qui commande : **deux sous-processus écrivent leur prose dans le stdout du parent**.

- **(a) NDJSON sur `stdout`, sous `--events`, avec CAPTURE des sous-processus.** En mode `--events`
  **et seulement là**, `install.js:200` et `install.js:271` passent de `stdio:'inherit'` à
  `stdio: ['ignore','pipe','pipe']`, et chaque ligne de l'enfant est **ré-émise en événement typé**
  (`{"evt":"log-delegue","etape":2,"flux":"stdout","ligne":"…"}`). **Pour** : streaming immédiat par
  le tube que la façade tient déjà ; la sortie déléguée n'est **pas perdue**, elle est **typée** —
  strictement plus utile qu'entrelacée ; `stdin:'ignore'` ferme au passage le vol de la ligne de
  consentement. **Contre** : le mode `--events` **modifie l'appel `spawnSync`**, donc un chemin de
  code de plus à éprouver (des deux côtés — CA-M1 et CA-M8).
- **(b) Un fichier dédié, `--events-file <chemin>`.** stdout reste la prose, intacte **par
  construction**. **Pour** : zéro risque de pollution, zéro modification des `spawnSync`.
  **Contre** : le suivi devient du **tailing** (polling côté façade) ; il faut choisir, créer,
  nettoyer, et gérer les droits d'un fichier — et `--dry-run` devrait alors **écrire** un fichier,
  ce qui heurte frontalement CA-03 (« n'écrit rien ») ou impose une exception à déclarer.
- **(c) Un descripteur dédié (fd 3).** **Écarté sur un fait** : les descripteurs supplémentaires ne
  sont pas portables sous Windows — et le `.msi` (AR-C) est précisément une cible de la chaîne.

> **Recommandation : (a).** Motifs : **(1)** c'est la seule voie qui donne du **live** sans que la
> façade invente une boucle de polling ; **(2)** (b) forcerait `--dry-run` à écrire, c'est-à-dire à
> mettre une **exception dans le critère le mieux gardé du verbe** ; **(3)** le « contre » de (a) —
> un chemin `spawnSync` de plus — est exactement ce que CA-M1 (chaque ligne de stdout parse en
> JSON) et CA-M8 (la prose ne bouge pas) mesurent, chacune avec son contrefactuel.
>
> **Nom du drapeau proposé** : `--events`, aligné sur `--json` (les deux drapeaux de **sortie
> machine** portent un nom anglais ; le drapeau d'**entrée** porte un nom français, `--feu-vert`,
> parce qu'il nomme un geste de la méthode, pas un format). Contrat nommé **C-EVT**, distinct de
> C-JSON et déclaré tel dans l'en-tête du module.

---

## 4. Périmètre

### Inclus

1. **`cli/src/lib/evenements.js`** — module neuf, **zéro dépendance runtime** : le **vocabulaire
   fermé** (`evt`, `etat`), la **fabrique d'émetteur** (`humain` / `events` / `json`), l'impression
   NDJSON **compacte** (un seul point, sous le verrou statique de `guard-json-output.test.js`), et
   l'accumulation pour le rendu `--json`.
2. **Le port de feu vert**, dans **`cli/src/lib/interactif.js`** — et **nulle part ailleurs** : G3b
   impose que `readline`/`process.stdin` ne soient lus que dans `interactif.js` et `guidage.js`.
   Une lecture de `stdin` créée dans `commands/install.js` serait exactement la re-divergence que
   ce module existe pour empêcher.
3. **`cli/src/commands/install.js`** — routage de **chaque** sortie par `dire(prose, evenement)`,
   branche machine de `confirmerEtape`, `spawnSync` conditionnés (M-5/M-6), refus explicite des
   combinaisons incohérentes.
4. **Les trois drapeaux** : `--events` (bool), `--feu-vert refus|stdin`, et le sens **enfin
   véridique** de `--json` — au **registre** (`verbes.js`), dans **`USAGE`** (`install.js:45-59`)
   et dans **`docs/commandes.md:248`**, **dans le même lot** (CA-09 hérité).
5. **L'entrée d'`install` dans `NOMINAL`** (`guard-json-output.test.js`).
6. **Le registre de couverture C-JSON** — `cli/test/fixtures/couverture-json.json` : chaque verbe
   déclarant `--json` au registre y porte `couverture: 'c-json' | 'evenements' | 'hors-couverture'`
   **et un motif**. Hors-couverture **déclaré**, jamais tu (M-10), avec **cliquet** : le nombre de
   `hors-couverture` ne **descend** que dans le commit qui le décide.
7. **Les gardes du lot** (§ 8), **chacune avec son contrefactuel**.

### Exclu — décisions, pas oublis

| Exclu | Motif | Successeur |
|---|---|---|
| **Toute retouche de la prose humaine** | Verbe gaté PASS ; CA-M8 la protège octet pour octet | — |
| **Toute modification de la logique d'installation** (ordre des étapes, comparaison de versions, résolution du réservoir, minisign, rollback) | Ce lot **expose**, il ne **change** pas. `reservoir.js`, `rollback.js`, `app-bundle.js`, `autodeploi.js` sont **lus**, pas réécrits | — |
| **Refermer le trou C-JSON des ~20 autres verbes** (M-10) | Un lot entier ; le registre du § 4.6 le **déclare** au lieu de le taire | `C-JSON-COUVERTURE-COMPLETE` |
| **Toute écriture dans `iakaInstall`** | Autre dépôt ; ⚒️ Gimli y travaille **en parallèle** sur C.2-a | C.2-b |
| **La consommation du contrat par la façade** | C'est **C.2-b**, et il commence quand ce lot est gaté | C.2-b |
| **Ouvrir les étapes 3/4 à Windows/Linux** | Le contrat **rend le refus en champs** ; il ne l'ouvre pas | `ETAPES-3-4-WINDOWS-LINUX` |
| **Un verbe `uninstall` / une mise à jour en une passe** | Cadrage parent § 5.3 | — |
| **Une bibliothèque NDJSON** | CA-1 du Lot A : **zéro dépendance**. `JSON.stringify` + `\n` suffit | — |
| **Un timeout d'attente du feu vert** | § 2 | — |
| **`--events` sur un autre verbe** | `install` est le seul verbe **long et par étapes**. Généraliser sans besoin mesuré = sur-ingénierie | — |

---

## 5. Étapes d'implémentation, ordonnées

**Étape 0 — Re-mesurer les cinq faits qui commandent le lot (AVANT d'écrire une ligne).**
Je n'avais pas de shell (§ 0.1). Ces mesures sont **dues**, et leurs sorties sont à **citer** dans
le rapport de remise :

```bash
cd ~/work/iakaframe
# M-0/M-1 : --json n'emet aucun JSON (attendu : 0)
node cli/src/index.js install --dry-run --json --yes --root . 2>&1 | grep -c '^[{[]'
# M-3 : install absent de la liste NOMINAL (attendu : aucune ligne)
grep -n "'install'" cli/test/guard-json-output.test.js
# M-1 : aucun canal machine dans le verbe (attendu : aucune ligne)
grep -nE "output\.js|JSON\.stringify|printJson" cli/src/commands/install.js
# M-5 : les deux spawnSync en stdio inherit (attendu : 2 lignes, :200 et :271)
grep -n "stdio: 'inherit'" cli/src/commands/install.js
# M-10 : l'ampleur du trou (attendu : 40 verbes, 57 '--json', 19 NOMINAL)
grep -c "^    id: '" cli/src/lib/verbes.js ; grep -c "'--json'" cli/src/lib/verbes.js
# Le verbe est vert AVANT toute modification (le point de comparaison)
cd cli && node --test test/
```

**Si l'une de ces mesures contredit M-1..M-5 ou M-10, ARRÊTER et remonter à 🔵 Gandalf** : le § 2 et
les trois arbitrages reposent dessus, et une instruction qui repose sur un fait faux se re-cadre,
elle ne s'exécute pas.

**Étape 1 — Enregistrer le témoin de prose AVANT toute modification.** C'est le premier geste
d'écriture du lot, et il vient **avant** la première ligne de production : rejouer
`install --dry-run` sur le harnais contrôlé du § 0.4 (réservoir vivant + double réseau + `--root`
et `--target-claude` en tmp), **normaliser** les seuls éléments non déterministes — chemins
temporaires et horodatages — et figer le résultat en fixture. Un témoin enregistré **après** la
refonte ne prouverait rien : il enregistrerait la régression.

**Étape 2 — `lib/evenements.js`.** Le vocabulaire fermé, exporté et **gardé** :

| `evt` | Champs (au minimum) | Solde le manque |
|---|---|---|
| `debut` | `versionCli`, `totalEtapes: 4`, `telechargements: 3`, `dryRun`, `plateforme`, `mode` | AR-A, CA-19 |
| `reservoir` | `source`, `vivantRoot`, `vivantVersion`, `embarqueDir`, `embarqueVersion`, `installMjsPath`, **`provenance`** *(la phrase au format imposé, conservée telle quelle)* | **n° 3**, CA-05/CA-06 |
| `etape-annoncee` | `etape`, `nom`, `quoi`, `ou`, `version`, `ceQuiSeraFusionne`, `sourceRetenue:{nom,url?,pourquoi}`, `sourcesConsultees:[{nom,repond,exploitable,version?,motif?}]` | **n° 1**, CA-04 |
| `demande-feu-vert` | `etape`, `question` | **n° 2**, AR-4 |
| `feu-vert` | `etape`, `accorde`, `canal: 'yes'\|'tty'\|'stdin'\|'refus-par-defaut'`, `motif` | **n° 2**, AR-4 |
| `etape-terminee` | `etape`, `etat: 'faite'\|'refusee'\|'echouee'\|'sautee'\|'dry-run'`, `detail` | **n° 1**, CA-07 |
| `log-delegue` | `etape`, `flux: 'stdout'\|'stderr'`, `ligne` | M-5, AR-M3(a) |
| `garde-ar1` | `desarme`, `raison` | CA-08, § 5.5 |
| `rollback` | `resume`, `defaits[]`, `nonDefaits[]`, `rapports:[{etape,cible,ok,defait,raison}]` — **repris tels quels de `orchestrerRollback`** | **n° 4**, CA-13 |
| `fin` | `ok`, `error?`, `etatAtteint:{derniereEtapeTentee,etapesFaites[],etapesNonTentees[]}`, `reprise: '<commande exacte>'` | **n° 5**, CA-07 |

Enveloppe commune, sur **chaque** ligne : `evt`, `ts` (ISO 8601), `etape` (ou `null`).
**NDJSON compact** (§ 0.5) : `JSON.stringify(o)` **sans indentation**, `+ '\n'`, UTF-8, **jamais**
`printJson`. L'émission vit **ici**, jamais dans `commands/` — sinon le verrou statique
`guard-json-output.test.js:30-39` rougit, et il aura raison.

**Étape 3 — Le port de feu vert, dans `lib/interactif.js`.** Une fonction qui lit **une seule
ligne** sur un `stdin` fourni (`terminal` ne s'active pas hors TTY, § 0.5), tolère les deux formes
de réponse — objet `{"etape":n,"reponse":"oui"|"non"}` **ou** ligne nue `oui`/`non` — et rend
**`false`** sur : EOF, ligne vide, JSON illisible, réponse non reconnue, **et `etape` qui ne
correspond pas à la demande en cours**. `askYesNo` (`:58-63`) **n'est pas touché**.

**Étape 4 — `install.js`, le routage.** Chaque `console.log` devient `dire(<la même chaîne>, …)`.
**Aucune chaîne n'est réécrite.** Ajouter le parsing des trois drapeaux (`parseArgs`, `:395-408`),
le refus explicite des combinaisons incohérentes **avant tout effet**, et la branche machine de
`confirmerEtape` **avant** l'appel à `peutDemander` — sans modifier `peutDemander` lui-même.

**Étape 5 — Les deux `spawnSync` (M-5/M-6).** En mode machine **seulement** :
`stdio: ['ignore','pipe','pipe']`, lignes ré-émises en `log-delegue`. En mode humain :
`stdio: 'inherit'`, **inchangé**. Le `stdin: 'ignore'` n'est pas un détail de confort — c'est ce
qui empêche un enfant d'avaler la ligne de consentement du parent.

**Étape 6 — Le rendu `--json`** (si AR-M2 → (a)) : accumuler, puis **une seule** impression via
`collection('evenements', …)` + `emit`/`fail` de `lib/output.js` — **le point de passage existant**,
jamais un second.

**Étape 7 — Les tests** (§ 8), chacun **éprouvé par une mutation qui le fait rougir nommément**, la
mutation portant sur **le programme** (jamais sur l'attendu) et **révoquée avec preuve au
`sha256`**.

**Étape 8 — Le registre de couverture** et son cliquet (§ 4.6).

**Étape 9 — Registre, `USAGE`, `docs/commandes.md:248`** — dans **ce** lot, pas dans le suivant.

**Étape 10 — Remise au gate 🏹 Legolas.** Jamais d'auto-validation. Le tableau de verdict porte
**une ligne par commande**, avec son code de sortie et son chiffre. **Y faire figurer explicitement
le re-jeu de la suite complète** (`node --test test/`) et la comparaison au point de départ de
l'étape 0.

---

## 6. Fichiers concernés

**Dépôt `iakaframe` — tout ce que ce lot écrit y est :**

| Chemin | Ce qui change |
|---|---|
| `cli/src/lib/evenements.js` | **neuf** — vocabulaire fermé, émetteur, NDJSON compact, accumulation `--json` |
| `cli/src/lib/interactif.js` | **+ le port de feu vert non-TTY** (G3b : le seul endroit légitime). `peutDemander` et `askYesNo` **inchangés** |
| `cli/src/commands/install.js` | routage par `dire()`, 3 drapeaux, branche machine de `confirmerEtape`, `spawnSync` conditionnés, refus des combinaisons incohérentes. **Aucune chaîne de prose modifiée** |
| `cli/src/lib/verbes.js` | ligne `install` (`:84`) — `--events`, `--feu-vert`, `guideClaudeCode` **motivé** |
| `cli/test/guard-json-output.test.js` | `install` **entre** dans `NOMINAL` (`:70-90`) |
| `cli/test/fixtures/couverture-json.json` | **neuf** — registre de couverture + hors-couverture **motivé** (M-10) |
| `cli/test/fixtures/install-prose-dry-run.txt` | **neuf** — le témoin de prose (**enregistré à l'étape 1**, avant toute modification) |
| `cli/test/install-contrat-machine.test.js` | **neuf** — CA-M1..M7, M10..M12, M15 |
| `cli/test/install-prose-non-regression.test.js` | **neuf** — CA-M8, CA-M9 |
| `cli/test/guard-json-couverture.test.js` | **neuf** — CA-M16 et son cliquet |
| `cli/test/interactif.test.js` | **+** les cas du port de feu vert (défaut refus, EOF, désynchronisation) |
| `docs/commandes.md` | ligne `install` (`:248`) — les trois drapeaux et le contrat C-EVT |

**Ce qui est LU et jamais écrit** : `cli/src/lib/output.js`, `rollback.js`, `reservoir.js`,
`app-bundle.js`, `autodeploi.js`, `network-double.js`, `guidage.js`, `install.mjs`.

**Dépôt `iakaInstall`** — **rien.** ⚒️ Gimli y travaille en parallèle sur C.2-a ; ce lot n'y touche
pas, et la consommation du contrat est **C.2-b**.

---

## 7. Risques

| # | Risque | Mitigation |
|---|---|---|
| **R-M1** *(en tête)* | **Régression silencieuse de la prose.** Le verbe est gaté PASS ; router 60+ `console.log` par un helper est **exactement** le geste qui déplace une espace, perd une ligne vide ou ré-indente une interpolation. Personne ne le verra en relecture. | **CA-M8** : témoin **octet pour octet**, **enregistré AVANT** la refonte (étape 1 — un témoin postérieur enregistrerait la régression), seuls chemins tmp et horodatages normalisés. **Contrefactuel** : changer **un** mot ⇒ rouge **en nommant la ligne divergente**. |
| **R-M2** | **Le flux NDJSON est pollué** par la prose de `npm` et d'`install.mjs` (M-5). Une seule ligne non-JSON casse tout parseur client — et la façade retomberait à… parser de la prose. **R3 par la petite porte.** | **CA-M1** : sur une chaîne réelle en `--events`, **chaque** ligne de stdout parse en JSON. **Contrefactuel** : remettre `stdio:'inherit'` sur la délégation étape 2 ⇒ rouge **en citant la ligne fautive**. |
| **R-M3** | **Vol de la ligne de consentement.** Un enfant en `stdio:'inherit'` partage le `stdin` du parent (M-5) et peut consommer la réponse destinée à l'étape suivante. Aujourd'hui inoffensif (M-6 : `install.mjs` ne lit pas, `--yes` lui est passé) — **une seule évolution d'`install.mjs` suffirait à le rendre nuisible**. | `stdin: 'ignore'` aux enfants en mode machine (étape 5), **et** CA-M6 : la réponse **nomme son étape**, une réponse hors séquence est un **refus**. Deux verrous, pas un. |
| **R-M4** | **Le feu vert par étape devient un `--yes` déguisé** — un client qui répond `oui` sans jamais montrer l'annonce à l'humain. Le CLI **ne peut pas** l'empêcher : il ne voit pas l'écran. | **Nommé, pas prétendu résolu.** Le CLI garantit que le feu vert est **demandé par étape, après l'annonce, et refusé par défaut**. Que l'humain le **voie** est un critère de **C.2-b** — à inscrire à son cadrage, jamais à supposer tenu ici. |
| **R-M5** | **Attente infinie.** Le CLI bloque sur `stdin` si le client n'écrit rien et ne ferme pas. | **EOF ⇒ refus** (CA-M5), et **aucun timeout** (§ 2 : le client est une UI où un humain clique). Un tube fermé est un signal ; une horloge serait un piège. |
| **R-M6** | **Faux vert du témoin de prose** : si la normalisation efface trop (tous les chemins, tous les nombres), le témoin devient une passoire — le témoin vide déjà payé deux fois dans ce portefeuille. | **Cliquet de normalisation** : la liste des motifs normalisés est **écrite et courte** (chemins tmp, horodatages) ; le **contrefactuel** de CA-M8 mute un mot **hors** de ces motifs, et doit rougir. Une normalisation qui grandit se justifie **dans le commit qui la décide**. |
| **R-M7** | **`--json` bufferisé + feu vert = piège logique** : un client attend une demande qu'il ne verra qu'à la fin, et pend. | **CA-M12** : la combinaison est **refusée explicitement**, `exit 1`, rien d'écrit. Jamais une dégradation silencieuse. |
| **R-M8** | **Le registre de couverture devient une liste muette** — 20 verbes marqués `hors-couverture` sans motif, et le trou C-JSON s'installe comme un décor. | Chaque entrée porte **un motif écrit** ; le **cliquet** interdit que le compte descende hors du commit qui le décide (CA-M16). |
| **R-M9** | **`install.js` grossit** (475 l. + 3 drapeaux + 2 branches) et devient illisible — la prochaine correction s'y perdra. | L'émission et le feu vert vivent dans **`lib/`**, pas dans `commands/`. `install.js` **route**, il n'implémente ni format ni lecture. |
| **R-M10** | **Perte du flux live de `npm`** en mode machine : `npm install -g` peut durer, et sa progression n'arrive plus en direct (elle arrive par lignes ré-émises). | **Déclaré.** `log-delegue` est émis **ligne à ligne**, pas en bloc de fin — la façade voit la progression. Si l'expérience réelle contredit ce point, c'est un constat de **C.2-b**, pas une raison d'ouvrir ici. |

---

## 8. Critères d'acceptation

> **Règle du lot, non négociable** : chaque critère se vérifie **par une commande ou un
> `fichier:ligne`**, jamais par une lecture d'intention. Chaque **garde** porte son
> **contrefactuel** — une mutation du **programme** (jamais de l'attendu) qui la fait **rougir
> nommément**, puis est **révoquée avec preuve au `sha256`**.
> ***Une garde qui ne peut pas rougir n'est pas une garde.***
>
> **Correspondance avec le cadrage parent** : ce lot **rend en machine** ce que CA-04, CA-05,
> CA-07 et CA-13 exigent en humain. Il **ne rouvre aucun** de ces critères : ils restent tenus par
> le mode terminal, que **CA-M8** protège.

- [ ] **CA-M1 — En `--events`, chaque ligne de stdout est du JSON. Sans exception.**
      **Vérif** : jouer la chaîne en `--dry-run --events` sur le harnais contrôlé (§ 0.4) ; chaque
      ligne non vide de stdout passe `JSON.parse` ; la **dernière** porte `evt:"fin"` ; **aucune**
      prose n'est imprimée.
      **Contrefactuel** : remettre `stdio: 'inherit'` sur la délégation de l'étape 2
      (`install.js:271`) ⇒ le test rougit **en citant la ligne non-JSON**.

- [ ] **CA-M2 — L'annonce d'étape porte les six champs exigés.**
      Chaque `evt:"etape-annoncee"` porte `quoi`, `ou`, `version`, `ceQuiSeraFusionne`,
      `sourceRetenue`, `sourcesConsultees` — pour **chacune** des étapes atteintes.
      **Contrefactuel** : retirer `ceQuiSeraFusionne` de l'émission de l'étape 2 ⇒ rouge **en
      nommant le champ et l'étape**. *(= CA-04, rendu en machine.)*

- [ ] **CA-M3 — La provenance est en champs ET la phrase imposée est conservée.**
      `evt:"reservoir"` porte `source`, `vivantVersion`, `embarqueVersion` **et** `provenance`
      **égale** à `formatProvenance(...)` (`reservoir.js:120-132`) — comparée **à l'appel de
      l'autorité**, jamais à une chaîne réécrite dans le test.
      **Contrefactuel** : retirer le champ `source` ⇒ rouge nommé. *(= CA-05.)*

- [ ] **CA-M4 — Le feu vert par étape fonctionne sur `stdin`, et il DISCRIMINE.**
      **Vérif** : `--events --feu-vert stdin` avec, en entrée, `oui` pour l'étape 1 puis `non` pour
      l'étape 2 ⇒ `feu-vert{etape:1,accorde:true,canal:"stdin"}`,
      `feu-vert{etape:2,accorde:false}`, `etape-terminee{etape:2,etat:"refusee"}`, la chaîne
      **s'arrête**, `exit 1`, et `evt:"fin"` porte `etatAtteint` **et** `reprise`.
      **Contrefactuel** : faire que `non` accorde ⇒ rouge. *(= AR-4 + CA-07.)*

- [ ] **CA-M5 — Le défaut est le refus, sur les quatre chemins.**
      **Vérif** : (1) `--events` **sans** `--feu-vert stdin` ⇒ refus à la première demande, `canal:
      "refus-par-defaut"`, `exit 1` ; (2) `--feu-vert stdin` avec `stdin` **fermé d'emblée** (EOF)
      ⇒ refus ; (3) ligne vide ⇒ refus ; (4) JSON illisible ⇒ refus. **Aucun** de ces chemins
      n'écrit quoi que ce soit.
      **Contrefactuel** : faire rendre `true` par défaut au port de feu vert ⇒ les **quatre**
      rougissent.

- [ ] **CA-M6 — Une réponse hors séquence est un refus, jamais un feu vert.**
      **Vérif** : à la demande de l'étape 2, répondre `{"etape":4,"reponse":"oui"}` ⇒ **refus** de
      l'étape 2, motif nommé dans l'événement `feu-vert`.
      **Contrefactuel** : ignorer le champ `etape` dans la comparaison ⇒ rouge. *(Ferme R-M3.)*

- [ ] **CA-M7 — Le rapport de rollback sort en champs, avec ses trois gardes intactes.**
      **Vérif** : forcer l'échec de l'étape 4 après écriture de l'étape 3 (harnais `install-etapes-
      3-4.test.js`) ⇒ `evt:"rollback"` portant `resume`, `defaits[]`, `nonDefaits[]` et
      `rapports[]` — chaque rapport avec `etape`, `cible`, `ok`, `defait`, `raison`, **identiques**
      à ce que rend `orchestrerRollback` (`rollback.js:106-120`), comparés à l'appel de l'autorité.
      **Contrefactuel** : retirer `nonDefaits` ⇒ rouge nommé. *(= CA-13 : jamais un « restauré »
      global.)*

- [ ] **CA-M8 — LA PROSE HUMAINE NE BOUGE PAS D'UN OCTET.** *(le critère central du lot)*
      **Vérif** : `install --dry-run` **sans aucun drapeau neuf**, sur le harnais contrôlé, rend
      **exactement** le témoin `cli/test/fixtures/install-prose-dry-run.txt` **enregistré à
      l'étape 1, avant toute modification** — seuls les chemins temporaires et les horodatages sont
      normalisés, et **la liste des motifs de normalisation est écrite dans le test**.
      **Contrefactuel** : changer **un** mot d'un message (hors motifs normalisés) ⇒ rouge **en
      nommant la ligne divergente et les deux versions**. *(Ferme R-M1 et R-M6.)*

- [ ] **CA-M9 — `--dry-run` n'écrit toujours rien, avec les drapeaux neufs.**
      **Vérif** : `empreinte()` (`install-verbe.test.js:56-70`) avant/après, **identique**, pour
      les **trois** invocations : `--dry-run`, `--dry-run --events`, `--dry-run --json`.
      **Contrefactuel** : faire écrire un fichier d'état par le mode `--events` ⇒ rouge. *(= CA-03,
      étendu — prouvé par empreinte, jamais par lecture de code.)*

- [ ] **CA-M10 — `install --json` entre au contrat C-JSON et y est MESURÉ.** *(si AR-M2 → (a))*
      **Vérif** : `install` figure dans `NOMINAL` (`guard-json-output.test.js:70-90`) ; la sortie
      est **une racine objet**, `ok:true` en **première clé**, `count === evenements.length`, une
      **seule** impression.
      **Contrefactuel** : imprimer un tableau nu ⇒ rouge. *(Solde M-2 et M-3.)*

- [ ] **CA-M11 — L'erreur machine suit la règle 4, à la lettre.**
      **Vérif** : provoquer l'échec d'une étape en `--json` ⇒ `{ok:false, error, etatAtteint,
      reprise}` **sur stdout**, `exit 1`, **stderr strictement vide**.
      **Contrefactuel** : écrire le message d'erreur sur stderr ⇒ rouge. *(= `output.js:6-8`.)*

- [ ] **CA-M12 — Les combinaisons incohérentes sont refusées, jamais dégradées.**
      **Vérif** : `--json --events` ⇒ refus explicite, `exit 1`, **rien d'écrit** ; `--json
      --feu-vert stdin` ⇒ idem. Le refus **nomme les deux drapeaux et la raison**.
      **Contrefactuel** : laisser passer `--json --events` ⇒ rouge. *(Ferme R-M7.)*

- [ ] **CA-M13 — A4 tient : rien ne transforme le canal machine en `--yes`.**
      **Vérif** : (1) garde **statique** — aucun endroit du programme n'affecte `values.yes` en
      dehors du parsing de `--yes` ; (2) `ECHAPPATOIRES_INTERDITES` (`guidage.js:36`) **inchangé**
      et `assemblerArgv` refuse toujours ; (3) **comportemental** — `--feu-vert stdin` répondant
      `non` à l'étape 1 ⇒ `exit 1`, empreinte disque **inchangée**.
      **Contrefactuel** : poser `values.yes = true` dans la branche machine ⇒ **les trois**
      rougissent.

- [ ] **CA-M14 — Registre, aide et doc à jour DANS CE LOT.**
      **Vérif** : `verbes.js` (ligne `install`) déclare `--events` et `--feu-vert` avec un
      `guideClaudeCode` **motivé** ; `USAGE` (`install.js:45-59`) les décrit **et corrige la phrase
      fausse de `:59`** ; `docs/commandes.md:248` porte les trois drapeaux et le contrat C-EVT ;
      `guard-verbes-registre.test.js` et le test d'actualité de la doc **passent**.
      **Contrefactuel** : retirer `--events` du registre en le laissant dans `USAGE` ⇒ rouge.
      *(= CA-09 hérité.)*

- [ ] **CA-M15 — Le vocabulaire d'événements est FERMÉ, et gardé.**
      **Vérif** : tout `evt` et tout `etat` émis sur une chaîne réelle appartiennent aux ensembles
      exportés par `lib/evenements.js` — comparaison **à l'appel de l'autorité**, jamais à une
      liste réécrite dans le test (idiome de `refus-loquaces.test.js:30-35`).
      **Contrefactuel** : émettre `evt:"bidule"` ⇒ rouge **en nommant la valeur hors vocabulaire**.

- [ ] **CA-M16 — Le hors-couverture C-JSON est DÉCLARÉ, motivé, et cliqueté.**
      **Vérif** : `cli/test/fixtures/couverture-json.json` porte **une entrée par verbe déclarant
      `--json`** au registre (M-10 : le compte est dérivé de `verbes.js`, jamais écrit en dur) ;
      `install` y est `c-json` **et** `evenements` ; chaque `hors-couverture` porte **un motif** ;
      le nombre de `hors-couverture` ne **descend** que dans le commit qui le décide.
      **Contrefactuel** : ajouter au registre un verbe **sans motif**, et retirer un verbe présent
      dans `verbes.js` ⇒ **deux** rouges distincts, chacun nommant l'entrée. *(Ferme R-M8 ; le
      reste de l'écart est le successeur `C-JSON-COUVERTURE-COMPLETE`.)*

### Ce qui n'est PAS prouvable dans ce lot — et qui doit donc être dit

- **Que la façade affiche réellement l'annonce avant de répondre `oui`** (R-M4). Le CLI ne voit pas
  l'écran. **Critère de C.2-b**, à inscrire à son cadrage — jamais supposé tenu ici.
- **Que le contrat suffit à piloter la chaîne de bout en bout sur une machine neuve.** Ce lot livre
  le contrat et ses gardes ; la **recette réelle** appartient à C.2-b, puis à C.3.
- **Le comportement du canal sous Windows.** Les étapes 3/4 y refusent déjà (`install.js:317-327`,
  CA-15) : le contrat **rend ce refus en champs**, et c'est tout ce qui est mesurable ici.

---

## 9. Estimation — au jalon P1→P2

> **Ordre de grandeur assumé et révisable, pas un engagement ferme.** À **rappeler et confronter au
> temps réel à la clôture du lot**, pour affiner les suivantes.

| Composante | Chiffre |
|---|---|
| **Équivalent jour-homme** (spec fermée, arbitrages tranchés) | **2,5 à 3 j-h** |
| **Complexité** | **Élevée** — pas par la difficulté des mécanismes (NDJSON et une lecture de ligne sont simples), mais par le **volume de points de sortie à router** (60+ `console.log` sur 475 lignes) et par la **contrainte de non-régression stricte** d'un verbe déjà gaté PASS. |
| **Risque** | **Moyen-élevé**, et il est **concentré sur R-M1** : la régression de prose est invisible en relecture et ne se voit qu'au témoin. Le reste du lot est gardé par des critères directement rougissables. |

**Décomposition** : émetteur + vocabulaire **0,5 j** · routage d'`install.js` **0,75 j** · port de
feu vert **0,5 j** · capture des sous-processus **0,25 j** · tests, contrefactuels et révocations
`sha256` **1 j** · registre, doc, remise **0,25 j**. *(Le poste de test est le plus gros du lot ;
c'est normal et c'est voulu — il porte les seize critères.)*

**Inconnues susceptibles de faire glisser** :

1. **Le témoin de prose est-il stabilisable ?** Si la sortie porte plus de non-déterminisme que les
   chemins tmp et les horodatages (versions résolues, ordre des sondes réseau), la normalisation
   grandit — et une normalisation qui grandit **affaiblit le témoin** (R-M6). *Impact : +0,25 à
   +0,5 j, ou une renégociation de la forme de CA-M8.*
2. **Le verdict AR-M2.** Si le décideur tranche **(b) — retirer `--json`**, l'étape 6 et **CA-M10/
   CA-M11 disparaissent** : **−0,3 j**, mais le CLI reste sans rapport machine pour la CI.
3. **Le verdict AR-M3.** Si le décideur tranche **(b) — fichier dédié**, l'étape 5 disparaît
   (**−0,25 j**) mais il faut arbitrer l'écriture d'un fichier **en `--dry-run`**, ce qui touche
   CA-03/CA-M9 : *impact net probablement nul, avec un critère de plus à négocier.*
4. **Le nombre réel de points de sortie.** Estimé à 60+ par lecture ; non compté par exécution
   (§ 0.1). Un écart significatif joue directement sur les 0,75 j de routage.
5. **La suite de tests est-elle verte au départ ?** L'étape 0 le mesure. Si elle ne l'est pas, le
   point de comparaison de CA-M8 n'existe pas, et le lot **ne commence pas**.

---

## 10. Sources

**Internes** *(lues sur le disque le 2026-09-04, `fichier:ligne` cités en § 0)* :
`cli/src/commands/install.js` · `cli/src/lib/{output,interactif,guidage,reservoir,rollback,
app-bundle,network-double,verbes}.js` · `cli/test/{guard-json-output,guard-verbes-registre,
install-verbe,refus-loquaces}.test.js` · `install.mjs` · `docs/commandes.md` ·
`specs/instructions/chaine-complete-install-amorcage-dmg-msi.md` ·
`~/work/iakaInstall/specs/instructions/facade-installeur-tauri-ossature-release.md`.

**Externes** *(vérifiées le 2026-09-04)* :

- **NDJSON Specification, version 1.0.0 (2014-10-19)** — `https://github.com/ndjson/ndjson-spec`
  (règles de séparateur, encodage UTF-8, lignes vides, MediaType `application/x-ndjson`).
- **Node.js — `readline`** — `https://nodejs.org/api/readline.html` (option `terminal`, défaut
  « checking `isTTY` on the `output` stream » ; « If not using a TTY stream for input, use the
  `'line'` event » ; `readlinePromises` `rl.question()` et son `AbortSignal`).
