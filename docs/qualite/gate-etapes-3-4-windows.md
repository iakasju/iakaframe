# Gate qualité — ETAPES-3-4-WINDOWS-LINUX, lot W-W (Windows)

> Branche `feat/etapes-3-4-windows` (tête `a529e4a`), base `main` (`c34fe75`, merge du lot
> W-L déjà gaté PASS par Legolas le 2026-09-05).
> Instruction : `specs/instructions/etapes-3-4-windows-linux.md`, § 3 AR-W1(a)/AR-W5(a)/AR-W8(a),
> § 8 CA-W8..CA-W19.
> Vérifié par 🏹 Legolas le 2026-09-05/06, en contexte séparé de Gimli (poste macOS arm64, sans
> shell Windows — tout ce qui touche `reg`/`setup.exe` est jugé sur les ports injectés, jamais
> exécuté réellement). Aucune coche du § 8 n'est reprise comme acquise : chaque critère est
> re-mesuré ci-dessous. **Périmètre : lot W-W (Windows) uniquement.** CA-W19 (banc CI) est
> explicitement hors périmètre de cet ordre de mission — déclaré non couvert, jamais évalué
> comme s'il l'était.

## Verdict : **FAIL**

Le refus n'est pas dû à la façade (contrat machine tenu, non-régression macOS/Linux
démontrée, table de clés et `poserBundleWindows` conformes à la lettre). Il porte sur le
**point central annoncé par l'ordre de mission lui-même : `rollback.js` étendu**. J'ai
trouvé et **reproduit deux fois, en dehors du harnais de test**, un défaut réel dans le
code neuf de ce lot (jamais dans le code macOS/Linux, intégralement préservé) :

**Quand la cible Windows reste `null`** (aucune installation connue avant la pose, ou
`InstallLocation` introuvable **après** une pose pourtant réussie — le cas que le
commentaire même d'`install.js:679-680` nomme et pour lequel il **promet** : *« un
rollback ultérieur échouera **nommément**, garde 3 »*), le rollback ne tient **pas** cette
promesse : `restaurerEtape` retombe sur la branche générique pré-existante
`fs.rmSync(preuveDisque.cible, …)` (`rollback.js:164`), avec `cible === null`. Node lève
`TypeError: The "path" argument must be of type string or an instance of Buffer or URL.
Received null`, capturée par le `catch` générique (`rollback.js:166-168`), et rendue comme
`raison: "ECHEC du rollback de null : <message TypeError> (garde 3 : enonce, jamais un
"restaure" global)"`. Ce n'est **pas** un énoncé conçu — c'est une fuite d'exception brute
qui contredit la doctrine même de la garde 3 (§ 2.3 point 3 de l'instruction : *« la garde 3
énonce le résidu… cette raison doit apparaître dans la `raison` rendue »*). Dans le second
cas (pose réussie, cible indéterminable après coup, puis échec d'une étape suivante), ce
message **fuit jusqu'à l'événement structuré `rollback`** consommé par `--events`/`--json`
(`install.js:826-830`, `champs.rapports[].raison`) — donc **jusqu'au contrat machine**, pas
seulement en prose humaine.

Ce trou touche directement **R-W9**, que l'instruction elle-même déclare non résolu tant
que l'étape 0.4 (mesure sur banc Windows réel du nom exact de la sous-clé de registre)
n'a pas eu lieu — et CA-W19 (le seul instrument capable de la fournir) est hors périmètre
de ce lot. Le code documente ce risque dans son propre commentaire mais ne l'a pas
implémenté jusqu'au bout : aucun test, ni unitaire (`rollback.test.js`) ni chaîné
(`install-etapes-3-4.test.js`), n'exerce le cas « `cible` encore `null` au moment du
rollback » — ni via l'auto-rollback immédiat de l'étape (CA-W12 : le test existant ne
vérifie que `etat`/`detail` de `etape-terminee`, jamais la ligne `[rollback immédiat…]`),
ni via `orchestrerRollback` sur une preuve Windows dont `windowsUninstall.chemin` est
`null` (aucun test ne fabrique ce cas, alors que le code lui-même l'anticipe et le nomme
en toutes lettres dans son commentaire).

**Le reste du lot est solide** (§ Mesures et § Points vérifiés) : je le documente en
détail ci-dessous pour que la reprise de Gimli soit ciblée et ne remette pas en cause ce
qui tient.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `find cli/src -name '*.js' \| xargs -n1 node --check` | `0` | aucune sortie = syntaxe OK sur tout `cli/src` |
| `cd cli && node --test` (suite complète HEAD, sans filtre) | `0` | `tests 1142`, `pass 1141`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0`, `duration_ms 81080` — **exactement l'attendu de l'ordre de mission** |
| Baseline `main`@`c34fe75`, worktree isolé (`git worktree add --detach`, supprimé après usage) | `0` | `tests 1118`, `pass 1111`, `fail 0`, `skipped 7`, `duration_ms 81699` — **exactement le chiffre annoncé** ; l'écart de skips (1 sur HEAD vs 7 sur le worktree isolé) est **environnemental** (dépôts sœurs `IakaCockpit`/`iakaFrameGUI` absents à côté du worktree temporaire), vérifié en listant les lignes `﹣` des deux runs |
| `git diff c34fe75..HEAD --stat` | — | 8 fichiers, +907/-51 : `install.js` (+135/-16), `app-bundle.js` (+106/-1 ligne touchée, reste en append), `rollback.js` (+89/-1), 3 fichiers de test, `docs/commandes.md` (+1/-1), l'instruction elle-même |
| `git diff c34fe75..HEAD -- cli/src/lib/evenements.js` | — | **vide** — AR-W8(a)/CA-W17 tenu, aucun `evt`/`etat` neuf |
| `node --test test/rollback.test.js` (isolé) | `0` | `tests 14`, `pass 14`, `fail 0` — les 4 tests AR-5 pré-existants (CA-11/12/13 + `orchestrerRollback([])`) verts, assertions **inchangées** |
| `node --test test/install-prose-non-regression.test.js` (isolé) | `0` | `tests 5`, `pass 5` — CA-M8 (prose macOS octet pour octet contre témoin figé) et CA-M9 verts, fichier **non touché** par ce diff (`git diff --stat` vide) |
| `node --test test/guide-doc-a-jour.test.js test/guard-verbes-registre.test.js` | `0` | `tests 24`, `pass 24` |
| Rejeu manuel des 3 gardes AR-5 sur macOS (script hors harnais, bac à sable) | — | garde 1 (backup absent → refus), garde 2 (app préexistante → restaurée, contenu identique), garde 3 (rollback partiel → énoncé) : chaînes `raison` **identiques** à celles produites par le code, **aucun** suffixe résidu Windows (plateforme=null) |
| Reproduction hors harnais — pose Windows échoue avant toute cible connue (scénario CA-W12) | — | `[rollback immédiat de l'étape 3] ECHEC du rollback de null : The "path" argument must be of type string or an instance of Buffer or URL. Received null (garde 3 : enonce, jamais un "restaure" global)` — **non couvert par CA-W12**, qui ne vérifie que l'événement `etape-terminee` |
| Reproduction hors harnais — pose Windows réussit mais `InstallLocation` reste introuvable après coup, puis `orchestrerRollback` | — | `rapports[0].raison = "ECHEC du rollback de null : <TypeError> …"`, **fuit dans l'événement structuré `rollback`** (`--events`/`--json`) ; **aucun test** ne fabrique ce cas |
| `python3` lecture directe des manifestes réels | — | `IakaCockpit/updater/latest.json` et `iakaFrameGUI/updater/latest.json` portent bien **les deux clés** `windows-x86_64-nsis` et `windows-x86_64`, **toutes deux pointant sur le même `.exe`** (jamais le `.msi`) — **re-mesuré indépendamment**, le risque signalé dans l'ordre de mission (sœurs sans clé `-nsis`) ne se matérialise pas |
| `grep -n msi cli/src/lib/app-bundle.js` | — | aucune référence fonctionnelle, seulement des commentaires expliquant l'exclusion — `.msi` **jamais lu** |
| `node --test test/app-bundle.test.js` (poserBundleWindows, decouvrirInstallationWindows) | `0` | 4 tests unitaires des 3 cas du registre (absent / présent+lisible / présent+illisible-vide-disparu) + contrefactuel guillemets, 4 tests `poserBundleWindows` (code 0/2/1603/nettoyage temporaire) — tous verts, format réel Windows rejoué (guillemets littéraux, CRLF) |
| `git diff c34fe75..HEAD --stat -- .github/` | — | vide — aucun banc CI ajouté, cohérent avec CA-W19 non coché et hors périmètre |
| `git worktree list` (avant/après) | — | worktree de baseline supprimé, seuls les worktrees pré-existants (hors mission) subsistent |

## Points vérifiés — solides

- **AR-W1(a)** — `cleManifestePlateforme({platform:'win32',arch:'x64'})` rend
  `{installeur:'windows-x86_64-nsis', generique:'windows-x86_64'}`. Le `.msi` n'apparaît
  nulle part dans `app-bundle.js`. Vérification indépendante des manifestes réels des deux
  applications sœurs (lecture directe, pas la parole de Gimli) : les deux clés existent et
  pointent sur le même `.exe` — aucun risque de repli vers le `.msi` même dans l'hypothèse
  où le repli générique jouerait.
- **`poserBundleWindows`** — `spawn`/`spawnSync` sans shell, `['/S']` exact, jamais `/R` ni
  `/D=` (asserté explicitement par le test), code 0 = succès, 2 = abandon nommé
  (`ABANDONNE… code de sortie 2`), tout autre code = échec nommé avec le code exact, fichier
  temporaire toujours supprimé (succès, échec, exception).
- **Les trois cas de la sauvegarde par registre** (`decouvrirInstallationWindows`) — deux
  `reg query` distincts, format réel rejoué (guillemets littéraux, CRLF), retrait des
  guillemets fait à la lecture (jamais à la source), dossier disparu traité comme
  indéterminable (`fs.existsSync`), valeur vide traitée comme indéterminable. Les 4 tests
  unitaires couvrent : absente / présente-lisible-existante / présente-illisible /
  présente-vide-ou-disparue. Contrefactuel « retirer le retrait des guillemets » : je
  l'ai désactivé mentalement et vérifié que sans lui, `valeur` resterait `"C:\...\` avec
  guillemets → `fs.existsSync` rendrait `false` sur ce chemin fautif → `installLocation`
  resterait `null` par accident, pas par la bonne cause ; le test réel isole ce point
  correctement (assertion sur `res.installLocation === dossier`, valeur exacte sans
  guillemets).
- **CA-W10** — refus d'écrire avant tout feu vert quand `InstallLocation` est illisible :
  compteur `execSetupWindows = 0` vérifié, empreinte disque identique, **aucun appel
  réseau ni sous-processus**. Contrefactuel implicite (même registre mais
  `InstallLocation` exploitable) fait bien lancer l'installeur (compteur = 1) — la garde
  ne rougit que sur l'indétermination, pas systématiquement.
- **CA-W9** — l'annonce d'étape sur Windows dit explicitement que `--apps-dir` est sans
  effet, en prose (`note :`) **et** dans l'événement structuré (`appsDirSansEffet:true`).
  Empreinte de `--apps-dir` identique avant/après dans le test chaîné réel, y compris en
  dry-run (CA-W13, compteur `execSetupWindows=0`).
- **AR-W8/CA-M8/CA-W17** — `evenements.js` : diff vide. `install-prose-non-regression.test.js`
  (témoin macOS figé) : fichier non touché, tests verts, prose macOS rejouée octet pour
  octet par la suite elle-même.
- **`win32/arm64`** — reste refusé, message nomme la plateforme exacte
  (`plateforme "win32-arm64" non couverte…`), test de contrat mis à jour de façon
  **disclosée et minimale** (voir écarts CA-W14/15 ci-dessous).
- **`docs/commandes.md:249`** — paragraphe Windows présent et cohérent avec le code lu
  (`--apps-dir` sans effet, non-repli msi/deb/rpm, découverte registre + trois cas,
  résidu énoncé, gate humain nommé par OS). `guide-doc-a-jour` et
  `guard-verbes-registre` : 24/24 verts.
- **CA-W19** — non fait, non simulé, correctement hors périmètre et non compté comme
  couvert. Aucun fichier `.github/workflows` ajouté.

## Écart signalé, non bloquant en soi (transparence CA-W14/CA-W15)

Le mandat de l'ordre de mission demandait de vérifier que `rollback.test.js` et
`install-etapes-3-4.test.js` sont « inchangés en append pur (`git diff` : 0
suppression) ». Mesuré précisément :

- `rollback.test.js` : **1 ligne modifiée** (l'import, étendu pour inclure
  `ouvrirPreuveWindowsSansExistant`/`completerPreuveWindowsApresPose`) — mécanique, aucune
  assertion existante touchée. Les 4 tests AR-5 pré-existants sont restés identiques et
  verts (vérifié en isolant leur exécution).
- `install-etapes-3-4.test.js` : **1 ligne modifiée** (le test `CA-15`, qui utilisait
  `win32/x64` comme exemple de plateforme non couverte — désormais couverte par ce lot —
  remplacé par `win32/arm64`), avec un commentaire daté expliquant le changement.
- `app-bundle.test.js` : **2 lignes modifiées**, même cause exacte (le test `CA-W15`,
  ex-`CA-15`).

Ce n'est donc pas littéralement « zéro suppression » au sens strict de `git diff`, mais
chaque ligne touchée est **disclosée, datée, minimale, et documentée par CA-W14/CA-W15
eux-mêmes** dans le cadrage (même précédent déjà accepté pour le lot W-L). Aucune
assertion de garde AR-5 n'a été affaiblie ou retirée. Je signale l'écart pour l'exactitude
du gate, mais il n'est **pas** la cause du FAIL.

## Non-régression AR-5 macOS/Linux — démontrée

- `git diff c34fe75..HEAD -- cli/src/lib/rollback.js` lu ligne à ligne : toute branche
  neuve est conditionnée soit à un paramètre optionnel par défaut inerte (`plateforme =
  null` sur `sauvegarderAvantEtape`, jamais lu ailleurs que dans le nouveau suffixe), soit
  à la présence de `preuveDisque.windowsUninstall.chemin` (jamais posé par les appelants
  macOS/Linux). Le suffixe « RÉSIDU NON RÉTABLI » n'apparaît que si
  `preuveDisque.plateforme === 'windows'` — vérifié absent dans mon rejeu macOS en bac à
  sable, chaînes `raison` identiques à l'octet aux formats historiques.
- Les tests AR-5 existants de `rollback.test.js` (CA-11/CA-12/CA-13) et
  `install-etapes-3-4.test.js` sont verts, avec les seules 2 lignes d'écart déjà signalées
  ci-dessus (toutes deux hors du périmètre AR-5, sur CA-15/CA-W15).
- Rejeu indépendant, hors harnais, des trois gardes sur macOS : sauvegarde absente → refus
  identique ; app préexistante → restaurée, contenu relu identique ; rollback partiel →
  résumé énuméré identique. Aucun suffixe Windows n'apparaît.

## Contrefactuels rejoués

| Critère | Contrefactuel | Résultat |
|---|---|---|
| CA-W8 | manifeste ne portant que `windows-x86_64-msi` (signé) | refus, `appelsTelechargement = 0`, `reprise` nomme « publie » — **vert** |
| CA-W10 | registre avec `InstallLocation` exploitable au lieu d'illisible | installeur lancé (compteur=1) — **vert**, la garde ne rougit que sur l'indétermination |
| CA-W12 | code 2 vs code 1603 vs code 0 | messages distincts (« ABANDONNE » / « code 1603 » / succès) — **vert** sur le contrat visible ; **mais** la ligne de rollback immédiat sous-jacente n'est pas couverte (voir Verdict) |
| Retrait des guillemets dans `decouvrirInstallationWindows` (mental, non appliqué au code) | chemin resterait entre guillemets | `fs.existsSync` rendrait `false` sur un chemin fautif, masquant la vraie cause — la logique actuelle l'évite correctement |
| CA-W15/win32-arm64 | — | message nomme la plateforme exacte, refus avant tout réseau — **vert** |
| **Nouveau, trouvé par Legolas** : pose échoue avant cible connue (rien avant) | — | `restaurerEtape` tente `fs.rmSync(null, …)`, lève, message générique fuité — **rouge**, non couvert par aucun test existant |
| **Nouveau, trouvé par Legolas** : pose réussit mais `InstallLocation` introuvable après coup, puis étape suivante échoue | — | même défaut, message fuité **jusque dans l'événement structuré `rollback`** — **rouge**, non couvert |

## Gate humain, par critère — jamais compté comme couvert

| Critère / zone | Prouvé sur ce poste (macOS arm64, ports injectés) | **Ce qui reste un gate humain** |
|---|---|---|
| CA-W8 (table de clés, non-repli msi) | ✅ logique et fixtures, manifestes réels re-mesurés | — |
| CA-W9 (`--apps-dir` sans effet, annoncé) | ✅ prose + événement + empreinte | l'utilisateur Windows voit-il réellement ce message avant toute confusion |
| CA-W10 (refus d'écrire, cible indéterminable) | ✅ sur registre simulé (format réel rejoué) | **le nom exact de la sous-clé de registre n'a jamais été mesuré sur un vrai NSIS Tauri** (étape 0.4 non faite, CA-W19 hors périmètre) — R-W9 reste un risque ouvert et non chiffré |
| CA-W11 (garde 3, résidu énoncé) | ✅ dans les deux cas nominaux (dossier restauré / désinstallé) | ❌ **cas `cible` indéterminée : le résidu n'est PAS énoncé proprement, une exception brute fuit** — trouvé par ce gate, non couvert par Gimli |
| CA-W12 (code de sortie non nul) | ✅ sur l'événement `etape-terminee` (etat/detail) | ❌ **le rollback immédiat de l'étape courante, dans le cas « rien avant », produit un message cassé** — non testé |
| CA-W13 (dry-run) | ✅ compteur + empreinte | — |
| Installation réelle Windows, absence d'UAC, `%LOCALAPPDATA%`, `uninstall.exe` réel | non prouvable sur ce poste | **entièrement dû** — machine Windows réelle |
| CA-W19 (banc CI) | non fait | **entièrement dû**, hors périmètre de cet ordre de mission |

## Ce qui reste (hors du FAIL, à ne pas refaire à la reprise)

- Le banc CI (CA-W19) reste hors périmètre — ne pas le créer ni le déclencher tant qu'il
  n'est pas explicitement commandé.
- La recette réelle sur machine Windows (installation, absence d'UAC, nom exact de la clé
  de registre, comportement de `uninstall.exe /S`) reste un gate humain quel que soit le
  verdict de ce rapport — l'étape 0.4 de l'instruction (mesure bloquante) n'a jamais été
  faite et conditionne la validité même de § 2.3.

## Reprise demandée à Gimli

1. Couvrir le cas où `restaurerEtape`/`orchestrerRollback` reçoit une preuve Windows dont
   `cible` est encore `null` (pose jamais complétée, ou `InstallLocation` introuvable
   après une pose réussie) : rendre un énoncé nommé (« résidu Windows non identifiable,
   aucune action de rollback possible sans emplacement connu ») au lieu de tomber dans la
   branche `fs.rmSync` générique héritée de macOS/Linux — `cli/src/lib/rollback.js:164`
   (branche finale de `restaurerEtape`), atteinte quand `preuveDisque.cible === null` et
   `windowsUninstall` absent ou sans `chemin`.
2. Ajouter au moins deux tests qui manquent aujourd'hui : (a) pose Windows qui échoue
   avant toute complétion de preuve (`ouvrirPreuveWindowsSansExistant` jamais complétée),
   vérifiant la ligne de rollback immédiat elle-même (pas seulement `etape-terminee`) ;
   (b) pose Windows réussie mais redécouverte du registre après coup sans
   `InstallLocation`, suivie d'un échec d'étape suivante via `orchestrerRollback`,
   vérifiant que `rapports[].raison` ne contient jamais de message d'exception brute.

## Jalon

```
 ██╗ █████╗ ██╗  ██╗ █████╗ ███████╗██████╗  █████╗ ███╗   ███╗███████╗
 ██║██╔══██╗██║ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔════╝
 ██║███████║█████╔╝ ███████║█████╗  ██████╔╝███████║██╔████╔██║█████╗
 ██║██╔══██║██╔═██╗ ██╔══██║██╔══╝  ██╔══██╗██╔══██║██║╚██╔╝██║██╔══╝
 ██║██║  ██║██║  ██╗██║  ██║██║     ██║  ██║██║  ██║██║ ╚═╝ ██║███████╗
 ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═══════╝
              J A L O N   :   G A T E   L O T   W - W  ( F A I L )
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🏹 Legolas | Verdict **FAIL** sur le lot W-W (Windows). Non-régression macOS/Linux démontrée, contrat machine tenu, table de clés et pose Windows conformes. Défaut trouvé et reproduit (hors harnais, deux fois) dans `cli/src/lib/rollback.js:164` : quand la cible Windows reste indéterminée (avant complétion de la preuve, ou après une pose réussie sans `InstallLocation` relisible), le rollback lève une exception interne capturée et rend un message d'erreur brut au lieu de l'énoncé nommé que la garde 3 doit produire — fuite jusque dans l'événement structuré `rollback` en mode `--events`/`--json`. Chemins : `cli/src/lib/rollback.js:164`, `cli/src/commands/install.js:663` (rollback immédiat non couvert par CA-W12), `cli/src/commands/install.js:826-830` (fuite dans l'événement structuré). | ⚒️ Gimli — reprise ciblée sur `rollback.js`/tests associés, le reste du lot n'est pas à refaire. |
