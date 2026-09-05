# Re-gate qualité — ETAPES-3-4-WINDOWS-LINUX, lot W-W (Windows) — reprise post-FAIL

> Branche `feat/etapes-3-4-windows` (tête `d006f9e`), base du gate précédent `c49a5fc`
> (FAIL, `docs/qualite/gate-etapes-3-4-windows.md`).
> Ordre de mission : Aragorn, 2026-09-06 — RE-GATE après correctif Gimli (3 commits :
> `f63eb58` tests rouges, `783ec27` fix, `d006f9e` docs).
> Vérifié par 🏹 Legolas, en contexte séparé de Gimli (poste macOS arm64, sans shell
> Windows — tout ce qui touche `reg`/`setup.exe` est jugé sur les ports injectés, jamais
> exécuté réellement). Périmètre inchangé : lot W-W (Windows) uniquement. CA-W19 (banc CI)
> reste hors périmètre.

## Verdict : **PASS**

Le défaut trouvé au premier gate est corrigé et je l'ai revérifié moi-même, à trois
niveaux indépendants : (1) le rouge existait bel et bien avant le fix (rejoué sur
`f63eb58` isolé), (2) le vert existe après (suite complète + reproduction personnelle
hors harnais des deux scénarios, avec les vrais ports Windows injectés), (3) aucune
régression macOS/Linux (diff source + rejeu runtime byte-identique). Le contrat machine
(`--events`) est tenu : la ligne NDJSON parse, ne contient jamais `TypeError`, et la
`raison` ne contient jamais le mot `null`.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` (HEAD `d006f9e`, suite complète) | `0` | `tests 1145`, `pass 1144`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0`, `duration_ms 80807` — **exactement l'attendu de l'ordre de mission** |
| `git log --oneline -3` | — | `d006f9e` docs, `783ec27` fix, `f63eb58` test — **ordre confirmé : le rouge précède le fix** |
| Worktree isolé sur `f63eb58` (avant le fix), `node --test test/rollback.test.js` | `1` | `tests 16, pass 14, fail 2` — les 2 tests neufs échouent, les 14 pré-existants restent verts |
| Même worktree, `node --test test/install-etapes-3-4.test.js` | `1` | `tests 22, pass 21, fail 1` — le test chaîné neuf échoue, les 21 autres verts |
| `node -e "fs.rmSync(null)"` | — | `TypeError ERR_INVALID_ARG_TYPE` — confirme que le message capturé (`Received null`) est bien une `TypeError`, pas une autre classe d'erreur |
| Message rouge relevé sur le worktree isolé | — | `actual: 'ECHEC du rollback de null : The "path" argument must be of type string or an instance of Buffer or URL. Received null (garde 3 : enonce, jamais un "restaure" global)'` — signature identique, mot pour mot, à celle citée dans le premier gate |
| `git worktree remove --force <worktree f63eb58>` | `0` | worktree temporaire supprimé après usage, seuls les worktrees pré-existants (hors mission) subsistent |
| Reproduction personnelle hors harnais, script indépendant (`/private/tmp/.../repro/repro-legolas.mjs`), scénario (a) pose échouée avant complétion | — | `ok:false`, `defait:false`, raison nommant fichiers/clé de registre/raccourcis + reprise manuelle, aucun `rmSync` supplémentaire tenté sur la branche de garde, `execSetupWindows` appelé 1 fois avec `/S` seul |
| Même script, scénario (b) pose réussie sans `InstallLocation` après coup | — | `etapeApp` rend `ok:true`, `preuve.cible===null`, `preuve.windowsUninstall={chemin:null}` ; `orchestrerRollback([r3.preuve], {execDesinstalleur: <espion qui lève si appelé>})` rend `ok:false`, `defaits:[]`, `execDesinstalleur` **jamais appelé** |
| Même script, contrat machine `--events` (`creerEmetteur({mode:'events'})`), `platform:'win32'` injecté en amont | — | 1 ligne NDJSON, `JSON.parse` réussit, `evt==='rollback'`, `rapports[0].raison` ne matche ni `/TypeError/i` ni `/\bnull\b/i`, matche `/residu Windows non identifiable/i` |
| `node --test test/rollback.test.js` (HEAD, isolé) | `0` | `tests 16, pass 16` — 14 pré-existants + les 2 nouveaux, tous verts |
| `node --test test/install-etapes-3-4.test.js` (HEAD, isolé) | `0` | `tests 22, pass 22` |
| `node --test test/install-prose-non-regression.test.js` | `0` | `tests 5, pass 5` — CA-M8/CA-M9 verts, fichier non touché par le diff |
| Script indépendant de non-régression (`non-regression-macos.mjs`), module HEAD vs module `main@c34fe75` copié à part, 3 gardes rejouées runtime | — | `garde1 IDENTIQUE`, `garde2 IDENTIQUE` (+ contenu restauré identique), `garde3 IDENTIQUE` — chaînes `raison`/`resume` byte-identiques hors chemins temporaires et horodatages |
| `git diff c34fe75..HEAD -- cli/src/lib/rollback.js` vs `git diff c34fe75..HEAD` (lu ligne à ligne, diff textuel complet en annexe de raisonnement) | — | toutes les branches macOS/Linux pré-existantes (texte des 5 `raison` historiques) restent **caractère pour caractère identiques** ; seul ajout : paramètre optionnel `plateforme=null` (inerte hors Windows), 2 fonctions neuves, 1 branche neuve conditionnée à `preuveDisque.plateforme==='windows'` |
| `git diff --stat c49a5fc..HEAD` | — | `rollback.js` (+21), `install-etapes-3-4.test.js` (+82), `rollback.test.js` (+51), `docs/commandes.md` (+2/-1), `specs/instructions/etapes-3-4-windows-linux.md` (+19) — **exactement le périmètre attendu**, rien d'autre n'a bougé |
| `git diff c49a5fc..HEAD -- cli/src/lib/evenements.js` | — | **vide** — AR-W8 tenu, aucun `evt`/`etat` neuf |
| `git diff c49a5fc..HEAD -- docs/qualite/gate-etapes-3-4-windows.md` | — | **vide** — le premier rapport n'a pas été réécrit |

## Reproduction personnelle du rouge (avant le fix)

Pour ne dépendre d'aucune affirmation de Gimli, j'ai isolé `f63eb58` (le commit de tests,
juste avant `783ec27`) dans un `git worktree` séparé, supprimé ensuite :

```
git worktree add <scratch>/wt-f63eb58 f63eb58
cd <scratch>/wt-f63eb58/cli && node --test test/rollback.test.js
```

Résultat : les 2 tests neufs (`AR-W5, cas (a)…` et `AR-W5, cas (b)…`) échouent avec
`actual: 'ECHEC du rollback de null : The "path" argument must be of type string or an
instance of Buffer or URL. Received null (garde 3 : enonce, jamais un "restaure"
global)'` — même chose pour le test chaîné d'`install-etapes-3-4.test.js` (cas (b) réel,
ports `execReg`/`execSetupWindows` injectés). J'ai vérifié indépendamment que
`fs.rmSync(null)` lève bien un objet dont `e.constructor.name === 'TypeError'` et
`e.code === 'ERR_INVALID_ARG_TYPE'` — la signature citée dans mon premier gate n'était
donc pas approximative : c'est la même exception, au mot près, avant le fix.

## Reproduction personnelle du vert (après le fix, ports injectés, hors harnais)

Script écrit par moi (pas une relecture du fichier de test de Gimli), avec mes propres
fixtures (manifeste + signature minisign fabriqués indépendamment), appelant directement
`etapeApp`/`orchestrerRollback` — le même code que `runInstall` — avec espionnage de
`fs.rmSync` et des ports `execReg`/`execSetupWindows`/`execDesinstalleur` :

- **Scénario (a)** — pose Windows dont l'installeur échoue (code 1603) **avant** toute
  cible connue : `etapeApp` rend `ok:false`, `preuve:null` (le rollback immédiat a déjà
  tourné à l'intérieur, `install.js:663`) ; j'ai rejoué la même branche directement via
  `ouvrirPreuveWindowsSansExistant` + `restaurerEtape` : `ok:false`, `defait:false`,
  raison = `"REFUS : residu Windows non identifiable, aucune action de rollback possible
  sans emplacement connu (garde 3, AR-W5) — la pose a echoue avant meme qu'un emplacement
  d'installation ne soit connu. NON DEFAIT : les fichiers eventuellement poses par
  l'installeur, la cle de registre de desinstallation, les raccourcis du menu Demarrer.
  Reprise manuelle : chercher l'application dans « Applications et fonctionnalites »
  (parametres Windows) ou son uninstall.exe sous %LOCALAPPDATA%."` — ni `TypeError`, ni
  le mot `null`, et **aucun appel `fs.rmSync` supplémentaire** sur cette branche (espion
  posé sur `fs.rmSync` global, delta = 0 pour cette branche précise ; les 2 appels
  observés au global viennent du nettoyage du fichier temporaire de `poserBundleWindows`,
  sans rapport avec la cible).
- **Scénario (b)** — pose Windows qui **réussit** (`execSetupWindows` rend `status:0`)
  mais dont la relecture du registre après coup (`execReg` avec `/v` en argument) ne rend
  aucun `InstallLocation` exploitable : `etapeApp` rend `ok:true`,
  `preuve.cible===null`, `preuve.windowsUninstall={chemin:null}`. J'ai ensuite injecté un
  `execDesinstalleur` **espion qui lève une exception s'il est appelé** dans
  `orchestrerRollback([r3.preuve], {execDesinstalleur})` : aucune exception levée, donc
  **aucune tentative d'exécuter un désinstalleur** ; rapport `ok:false`, `defaits:[]`,
  raison identique au scénario (a) sauf la clause d'état (« l'installeur a tourne… »).

Fichiers du script : `/private/tmp/claude-501/-Users-sjupin-work/491bc970-2cd2-4bfd-8669-ae053380e4f6/scratchpad/repro/repro-legolas.mjs`.

## Contrat machine (`--events`), `platform:'win32'` injecté

Dans le scénario (b), j'ai construit la ligne NDJSON exactement comme le fait le tail de
`runInstall` (`install.js:826-830`) via `creerEmetteur({mode:'events'})` :

```json
{"evt":"rollback","ts":"...","etape":4,"resume":"rollback PARTIEL — defait : [aucune] — PAS defait : [3] (garde 3 : enonce, jamais un \"restaure\" global)","defaits":[],"nonDefaits":[3],"rapports":[{"etape":3,"cible":null,"ok":false,"defait":false,"raison":"REFUS : residu Windows non identifiable, ... Reprise manuelle : ..."}]}
```

- La ligne **parse** en JSON (`JSON.parse` sans exception).
- La ligne entière ne contient **jamais** `TypeError`.
- `rapports[0].raison` (le champ prose du contrat) ne contient **jamais** le mot `null`
  — seul le champ structurel `rapports[0].cible` porte la valeur JSON `null`, ce qui est
  une donnée légitime (l'emplacement est réellement inconnu), pas une fuite d'exception ;
  c'est le même critère que celui posé par le test de Gimli lui-même
  (`assert.doesNotMatch(ligne, /TypeError/)` sur la ligne entière, puis
  `assert.doesNotMatch(parsed.rapports[0].raison, /\bnull\b/i)` sur la seule `raison`).
- `git diff c49a5fc..HEAD -- cli/src/lib/evenements.js` est vide : aucun `evt`/`etat`
  nouveau, AR-W8 tenu.

## Non-régression AR-5 macOS/Linux — démontrée deux fois

1. **Diff source, lu ligne à ligne** (`c34fe75`→HEAD, isolé sur `rollback.js`) : les 5
   gabarits de `raison` pré-existants (refus preuve absente, refus fichier introuvable,
   refus sauvegarde absente, restauré, retiré, échec générique) sont recopiés **caractère
   pour caractère**, sans aucune modification. Le seul ajout de comportement observable
   est le suffixe résidu Windows, conditionné à `preuveDisque.plateforme === 'windows'`
   (jamais posé par les appelants macOS/Linux), et la branche neuve de garde 3, elle-même
   conditionnée à la même valeur.
2. **Rejeu runtime indépendant** (script `non-regression-macos.mjs`) : import du module
   HEAD et d'une copie du module `main@c34fe75` sous deux URLs distinctes, exécution des
   trois gardes AR-5 (sauvegarde manquante → refus ; app déjà présente → restaurée,
   contenu relu identique ; rollback partiel → résumé énuméré) sur des fixtures
   identiques. Résultat : `garde1 IDENTIQUE`, `garde2 IDENTIQUE` (+ contenu de fichier
   restauré identique), `garde3 IDENTIQUE`, à la normalisation près des chemins
   temporaires et horodatages (seules variables entre deux exécutions distinctes).
3. `node --test test/install-prose-non-regression.test.js` : `tests 5, pass 5` — témoin
   macOS figé (CA-M8/CA-M9), fichier non touché par le diff (`git diff --stat` vide sur
   ce fichier).

## `docs/commandes.md:249` — la phrase ajoutée dit-elle exactement ce cas ?

Phrase ajoutée : *« Si le rollback ne peut même pas identifier la cible (pose jamais
complétée, ou `InstallLocation` introuvable après une pose pourtant réussie), il ne tente
**ni** suppression **ni** désinstallation à l'aveugle : il **énonce nommément** ce résidu
(fichiers éventuellement posés, clé de registre, raccourcis) et la reprise manuelle
(rechercher l'application dans « Applications et fonctionnalités », ou son
`uninstall.exe` sous `%LOCALAPPDATA%`) — jamais une exception brute (garde 3, reprise
post-gate du 2026-09-06). »*

Comparaison avec le code et mes deux reproductions : la phrase nomme les **deux** cas
exacts (pose jamais complétée / pose réussie mais `InstallLocation` introuvable),
l'absence de `rmSync`/`exec` à l'aveugle (vérifiée par espionnage), le contenu exact de
l'énoncé (fichiers, clé de registre, raccourcis, reprise manuelle) et la garantie
« jamais une exception brute » (vérifiée sur la `raison` et sur la ligne NDJSON). **CA-W11
est coché avec preuve** — le cas « cible indéterminée », laissé explicitement non couvert
par le premier gate, est désormais couvert et documenté au bon endroit.

## Écarts

Aucun écart nouveau. L'écart déjà signalé au premier gate (1 ligne modifiée dans
`rollback.test.js` pour l'import des deux fonctions neuves, 1 ligne dans
`install-etapes-3-4.test.js` et `app-bundle.test.js` pour `CA-15`/`win32-arm64`) reste ce
qu'il était — disclosé, daté, non touché par cette reprise (aucun de ces trois fichiers
n'a de ligne modifiée en plus dans `d006f9e`, seul du contenu **ajouté**).

## Gate humain, par critère — inchangé depuis le premier rapport

| Critère / zone | Prouvé sur ce poste (macOS arm64, ports injectés) | **Ce qui reste un gate humain** |
|---|---|---|
| CA-W8 (table de clés, non-repli msi) | ✅ | — |
| CA-W9 (`--apps-dir` sans effet, annoncé) | ✅ prose + événement + empreinte | l'utilisateur Windows voit-il réellement ce message avant toute confusion |
| CA-W10 (refus d'écrire, cible indéterminable) | ✅ sur registre simulé | le nom exact de la sous-clé de registre n'a jamais été mesuré sur un vrai NSIS Tauri (étape 0.4 non faite, CA-W19 hors périmètre) — R-W9 reste un risque ouvert |
| CA-W11 (garde 3, résidu énoncé) | ✅ **désormais dans les trois cas** : dossier restauré, désinstallé, **et cible indéterminée** (corrigé par cette reprise) | — |
| CA-W12 (code de sortie non nul) | ✅ événement `etape-terminee` **et** rollback immédiat (scénario (a) rejoué) | — |
| CA-W13 (dry-run) | ✅ | — |
| Installation réelle Windows, absence d'UAC, `%LOCALAPPDATA%`, `uninstall.exe` réel, **rollback réel sur un vrai NSIS** | non prouvable sur ce poste | **entièrement dû** — run réel sur machine/CI `windows-latest` |
| CA-W19 (banc CI) | non fait | **entièrement dû**, hors périmètre de cet ordre de mission |

## Ce qui reste (hors du PASS, à ne pas refaire)

- **CA-W19 (banc CI)** reste hors périmètre — ne pas le créer ni le déclencher tant qu'il
  n'est pas explicitement commandé.
- La recette réelle sur machine Windows (installation, absence d'UAC, nom exact de la clé
  de registre, comportement de `uninstall.exe /S`, **et maintenant le comportement réel du
  rollback sur une cible indéterminée**) reste un gate humain quel que soit ce verdict —
  l'étape 0.4 de l'instruction (mesure bloquante sur banc réel) n'a toujours pas eu lieu.

## Jalon

```
 ██╗ █████╗ ██╗  ██╗ █████╗ ███████╗██████╗  █████╗ ███╗   ███╗███████╗
 ██║██╔══██╗██║ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔════╝
 ██║███████║█████╔╝ ███████║█████╗  ██████╔╝███████║██╔████╔██║█████╗
 ██║██╔══██║██╔═██╗ ██╔══██║██╔══╝  ██╔══██╗██╔══██║██║╚██╔╝██║██╔══╝
 ██║██║  ██║██║  ██╗██║  ██║██║     ██║  ██║██║  ██║██║ ╚═╝ ██║███████╗
 ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═══════╝
        J A L O N   :   R E - G A T E   L O T   W - W  ( P A S S )
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🏹 Legolas | Verdict **PASS** sur le lot W-W (Windows), reprise post-FAIL. Défaut du premier gate (`rollback.js:164`, `fs.rmSync(null)` → `TypeError` fuitée jusque dans l'événement `rollback`) corrigé et re-vérifié par moi-même à trois niveaux : rouge reproduit isolément avant le fix (`f63eb58` en worktree), vert reproduit hors harnais avec ports Windows injectés après le fix, non-régression macOS/Linux démontrée par diff source ET rejeu runtime byte-identique. Contrat machine tenu (ligne `--events` parse, sans `TypeError` ni `null` dans la raison). Suite complète : `tests 1145, pass 1144, fail 0, skipped 1`. Restent des gates humains inchangés : run réel `windows-latest`, absence d'UAC, rollback réel sur machine Windows ; CA-W19 (banc CI) hors périmètre. | 🚢 Charon — version candidate prête pour stage, bascule sur feu vert humain. |
