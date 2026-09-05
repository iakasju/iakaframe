# Gate qualité — fix rollback Windows `uninstall.exe` synchrone (`_?=`) — AR-W20

**Branche** : `fix/rollback-windows-uninstall-synchrone` (4 commits au-dessus de `main` @ `e34c1af`)
**Date** : 2026-09-06
**Vérificateur** : 🏹 Legolas (contexte séparé, n'a pas codé la branche)

## Verdict : **PASS**

Profondeur appliquée : **validation de tests** (fix, pas une version mineure) + vérification
manuelle ciblée de la source NSIS et de la construction de l'appel `spawnSync` (le point précis
que le fix touche), conformément à la profondeur graduée du gate. Un écart de méthode est
néanmoins signalé en fin de rapport (AR-W20 non arbitré) — il ne renverse pas le verdict PASS.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `cd cli && node --test` (HEAD = `efaf242`) | `0` | `tests 1160 / pass 1159 / fail 0 / cancelled 0 / skipped 1 / todo 0` |
| `cd cli && node --test test/rollback.test.js` (worktree isolé, commit rouge `1499b4e`) | `1` | `tests 19 / pass 14 / fail 5 / skipped 0` — 5 échecs nommés (liste ci-dessous) |
| `cd cli && node --test test/rollback.test.js test/install-etapes-3-4.test.js` (worktree isolé, commit fix `fdebbd8`) | `0` | `tests 41 / pass 41 / fail 0` |
| `cd cli && node --test test/rollback.test.js` (contrefactuel `_?=` retiré du code, worktree HEAD patché) | `1` | `tests 19 / pass 17 / fail 2` |
| `cd cli && node --test test/guard-banc-etapes-3-4.test.js` | `0` | `tests 12 / pass 12 / fail 0` |
| `cd cli && node --test` (fichiers portant `CA-M8`) | `0` | `tests 5 / pass 5 / fail 0` (dont témoin CA-M8 littéral) |
| `git diff e34c1af..HEAD -- .github/workflows/banc-etapes-3-4.yml` | `0` (diff vide) | aucune ligne — YAML inchangé |
| `git diff main..HEAD -- cli/src/lib/evenements.js` | `0` (diff vide) | aucune ligne — `evenements.js` inchangé |

### Rejeu du rouge `1499b4e` (isolé, `git worktree add --detach <sandbox> 1499b4e`) — signature exacte

```
✖ AR-W5, cas "rien n'existait avant" (§2.3 point 3) : ... RELIT le registre, JAMAIS un rmSync du dossier avant confirmation
✖ AR-W5, chaîné via orchestrerRollback : execDesinstalleur ET execReg se propagent à CHAQUE preuve Windows, comptage exact
✖ AR-W20 (reprise post-mesure-réelle du 2026-09-06, run CI 33997947501) : `uninstall.exe /S` rend code 0 IMMÉDIATEMENT ... REFUSE, ne déclare JAMAIS `defait:true`
✖ AR-W20, l'appel au désinstalleur porte `_?=<InstallLocation>` ...
✖ AR-W20, résidu du désinstalleur EN PLACE ... le rollback NOMME le résidu si le nettoyage best-effort échoue ...
tests 19, pass 14, fail 5
```

Le commit fix (`fdebbd8`), rejoué seul dans un second worktree isolé, fait passer **exactement**
ces 5 tests au vert (`test/rollback.test.js` + `test/install-etapes-3-4.test.js` → `41/41`).
L'ordre rouge→vert annoncé par Gimli est donc **vérifié**, pas supposé.

## Vérification de la source NSIS (faite par Legolas, pas reprise de la doc de Gimli)

Tentative de re-fetch en direct : `curl https://nsis.sourceforge.io/Docs/Chapter3.html` et
`.../Chapter4.html` → **HTTP 403** (challenge Cloudflare, page "Just a moment..."), consigné
honnêtement — **non-mesuré en direct** sur ce poste au moment du gate. Vérification faite sur une
copie déjà présente dans le bac à sable (`nsis-chapter3.html` / `nsis-chapter4.html`,
`/private/tmp/.../scratchpad/`), dont la structure (table des matières, ancres, sections)
correspond à la documentation NSIS officielle connue :

- **Chapter3.html, ancre `installerusageuninstaller`, § « 3.2.2 Uninstaller Specific Options »**,
  citation exacte trouvée dans le fichier :
  > « `_?=` sets `$INSTDIR`. It also stops the uninstaller from copying itself to the temporary
  > directory and running from there. It can be used along with `ExecWait` to wait for the
  > uninstaller to finish. **It must be the last parameter used in the command line and must not
  > contain any quotes, even if the path contains spaces.** »

  Cette dernière phrase (non citée par Gimli dans son commentaire, mais présente dans la même
  entrée de doc) **confirme directement** le point 3(a) de la mission : `_?=<InstallLocation>`
  doit être le **dernier** paramètre, **sans guillemets ajoutés même si le chemin contient des
  espaces** — exactement ce que fait le code (`args = ['/S', \`_?=${installLocation}\`]`,
  `spawnSync` sans `shell:true`, aucun guillemet injecté par le module).

- **Chapter4.html, ancre `UninstallSection`, § « 4.6.2 Uninstall Section »** (numérotation
  vérifiée : l'ancre HTML porte littéralement `<h3>4.6.2 Uninstall Section</h3>`), citation
  exacte :
  > « The first `Delete` instruction works (deleting the uninstaller), because **the uninstaller
  > is transparently copied to the system temporary directory for the uninstall.** »

Les deux citations verbatim de Gimli (docs/instructions et commentaires de `rollback.js`)
correspondent mot pour mot à ces extraits. **Confirmation du mécanisme Node** : `_?=` empêche
l'installeur de se recopier et de se relancer dans `%TEMP%` en processus détaché — sans lui, le
process NSIS lancé rend la main (exit 0) dès que le lancement de la copie a réussi, alors que la
désinstallation continue dans le processus copié. Avec `_?=`, l'exécution reste **dans le même
processus**, donc **le même PID** que celui que `spawnSync` (bloquant, attend la fin du process)
surveille réellement — c'est bien la sémantique `spawnSync` qui devient significative ici, pas
seulement `ExecWait` côté NSIS. La note de vérification "HTTP 403 en direct, vérifié sur cache
existant" est déclarée telle quelle — critère jugé **suffisamment mesuré** (structure + ancres +
citations exactes concordantes) mais pas au niveau d'un fetch live du jour du gate.

## `rollback.js`, branche Windows — vérification point par point

- **(a) Appel exact** : `args = ['/S', \`_?=${installLocation}\`]`, `execDesinstalleur(chemin,
  args)` → `spawnSync(cmd, args, {encoding:'utf8'})` **sans** `shell:true`. Confirmé : ni guillemet
  ajouté autour du chemin, ni interpolation shell — conforme à l'exigence NSIS ("must not contain
  any quotes, even if the path contains spaces") et sans risque d'injection shell. Test dédié
  (`AR-W20, l'appel au désinstalleur porte _?=<InstallLocation>...`) vérifie littéralement
  `deepEqual(argsRecus, ['/S', '_?=' + cible])`.
- **(b) Relecture du registre avant verdict** : après code 0, `cleDeDesinstallationDisparue(execReg,
  installLocation, attendre)` interroge `HKCU\...\Uninstall\<basename(installLocation)>` — même
  idiome que `decouvrirInstallationWindows` (`app-bundle.js`), **aucun import croisé** vers ce
  fichier (`rollback.js` n'importe que `node:fs`/`node:path`/`node:child_process` — isolation
  tenue). `defait:true` **seulement** si la clé a disparu ; sinon `ok:false` avec la raison
  conçue verbatim : « desinstalleur lance, code 0, mais la cle de desinstallation est toujours
  presente : desinstallation NON confirmee ; reprise manuelle : ... » — jamais un « restauré ».
- **(c) Résidu** : après confirmation, nettoyage best-effort (`fs.rmSync(installLocation, {
  recursive:true, force:true })`, `try/catch`) ; un échec est **énoncé** dans la raison
  (`RESIDU NON NETTOYE (garde 3) : ...`) et **ne fait pas échouer** le verdict de désinstallation
  déjà confirmée par le registre. Testé (`AR-W20, résidu du désinstalleur EN PLACE...`,
  contrefactuel : dossier parent en lecture seule → nettoyage impossible → `ok:true` quand même,
  raison porte `RESIDU NON NETTOYE`).
- **(d) Attente bornée** : `NB_RELECTURES_REGISTRE_MAX = 10`, boucle `for` de 0 à 10 inclus (11
  lectures registre max), `attendre(300ms)` entre chaque tentative sauf la dernière — **borné à
  ~3 s max**, jamais une attente indéfinie. Port `attendre` injectable (les tests passent une
  fonction vide, jamais un vrai sleep dans la suite).

## Contrefactuels (ports injectés, copie isolée)

| Scénario | Attendu | Constaté |
|---|---|---|
| code 0 + clé toujours présente (rejoue le défaut mesuré en CI) | `ok:false`, raison conçue, jamais `defait` | ✅ test `AR-W20 (reprise post-mesure-réelle...)` vert |
| code 2 (abandon NSIS) | `ok:false`, raison nomme le code, registre jamais interrogé | ✅ test `AR-W5, CONTREFACTUEL : ... code NON NUL ...` — `appelsReg === 0` vérifié |
| clé disparue | `defait:true` | ✅ tests nominal et chaîné (`orchestrerRollback`) verts |
| `_?=` retiré du code (patch appliqué par Legolas sur un worktree HEAD isolé) | le test rougit **nommément** | ✅ confirmé — `test/rollback.test.js` : `pass 17 / fail 2`, les 2 échecs nommant exactement `_?=<InstallLocation>` manquant |

**Sha256 `cli/src/lib/rollback.js`** (worktree isolé, jamais le dépôt de travail) :
- avant patch (code HEAD réel) : `9a03f9b34f75bfd16e4bb3adf1b7aedc7ac2c31c50e8cf99e8b0f10d44add160`
- après patch contrefactuel (`_?=` retiré) : `ec2a5c2301107e10c26133e50732ef902eb46284ec2f21495ecb007609ebcc60`

## Non-régression

- **macOS/Linux, gardes AR-5** rejouées en bac à sable (`test/rollback.test.js`, suite complète) :
  toutes vertes. Comparaison **à l'octet** des chaînes `raison` entre `main` (`e34c1af`) et `HEAD`
  pour les branches **non touchées** par le fix — identiques pour : les 3 `REFUS` (garde 1), le
  `restaure : ...` (garde 2, app déjà présente), le `REFUS : residu Windows non identifiable ...`
  (garde 3 résidu Windows sans cible), le `retire : ...` (garde 2 macOS/Linux), et le
  `ECHEC du rollback de ...` (catch générique). Seule la ligne `ECHEC de la desinstallation (...)`
  et le succès `desinstalle via ...` diffèrent — **attendu**, c'est exactement le périmètre du fix.
- **`evenements.js`** : `git diff main..HEAD -- cli/src/lib/evenements.js` → vide, inchangé.
- **Témoin CA-M8** : `CA-M8 — LA PROSE HUMAINE NE BOUGE PAS D'UN OCTET` et son pendant
  non-régression croisée, verts (`5/5`).
- **Scénario B Windows** (restauration de dossier, `AR-W5, cas "une version existait"`) : test
  vert, code de cette branche non modifié par le diff.
- **Workflow CI** (`.github/workflows/banc-etapes-3-4.yml`) : `git diff e34c1af..HEAD` vide —
  aucune modification, jamais déclenché par cet agent.

## Le banc (`banc-etapes-3-4-windows.mjs`, commit `a1bb520`)

- `execRegInstrumente` (même idiome que `execDesinstalleurInstrumente` : le vrai `spawnSync` est
  appelé, pas réimplémenté) est bien **threadé** dans les deux appels `restaurerEtape(...,
  {execDesinstalleur: execDesinstalleurInstrumente, execReg: execRegInstrumente})` (scénario A
  IakaCockpit et iakaFrameGUI).
- Les deux lignes de mesure portent un **attendu vérifiable** modifié en conséquence : « clé
  DISPARUE ET confirmée par relecture du module » (au lieu de « clé DISPARUE ensuite », qui
  laissait entendre une coïncidence entre deux mesures indépendantes) — verdict `PASS`/`FAIL`
  calculé sur `rbA.ok && rbA.defait && apresRollbackA.sousCles.length === 0`, donc toujours
  indépendant de la mesure du module (double vérification, pas une confiance aveugle dans le
  retour de `restaurerEtape`).
- `guard-banc-etapes-3-4.test.js` : `12/12` verts, y compris le test nommant explicitement
  l'interdit « jamais déclenché par un agent ».
- `.github/workflows/banc-etapes-3-4.yml` inchangé (diff vide, cf. ci-dessus).

## `docs/commandes.md:249` et l'arbitrage AR-W20

La ligne 249 (paragraphe « Chaîne complète ») a bien été complétée : elle nomme désormais `_?=`
comme **obligatoire**, cite le mécanisme NSIS (copie async vers `%TEMP%` sans lui), la relecture
du registre avant tout `defait:true`, et le nettoyage best-effort avec énoncé de résidu en cas
d'échec. Le texte ajouté est cohérent avec le code lu ligne à ligne ci-dessus — aucun écart trouvé
entre la prose et l'implémentation.

**Sur « AR-W20 » lui-même** — vérification demandée : est-ce un arbitrage nouveau ou une
précision d'AR-W5 ?

`specs/instructions/etapes-3-4-windows-linux.md` contient une section `## 3. Arbitrages` formelle
qui numérote **AR-W1 à AR-W8**, chacun avec un titre, des options tranchées et une recommandation
— c'est le format des décisions de cadrage, normalement arbitrées via Gandalf/le décideur. **Il
n'existe aucune entrée `### AR-W20` dans cette section.** Le sigle « AR-W20 » n'apparaît que dans
des noms de commit, des noms de test et des commentaires de code — jamais comme un point
d'arbitrage formalisé et tranché en amont. C'est Gimli qui l'a inventé, en aval, pendant la
fabrication (reprise post-mesure CI), pas Gandalf en cadrage.

**Tranché** : sur le fond, ce n'est **pas** un nouvel arbitrage mais une **précision d'AR-W5(a)**.
AR-W5(a) a déjà décidé : « rollback = `uninstall.exe /S` si rien n'existait, [...] résidu de
registre énoncé ». L'intention actée était « le rollback désinstalle réellement via son propre
désinstalleur ». Le bug corrigé ici est que l'implémentation ne **tenait pas** cette promesse : un
code de sortie 0 était déclaré `defait:true` alors que la clé de registre restait présente — c'est
une violation de la garde 1/3 déjà actée (ne jamais affirmer un « restauré » qu'on n'a pas
prouvé), pas un changement de ce qui est décidé. Le correctif ne fait que **faire tenir**
la promesse d'AR-W5(a), et le fait de façon **transparente** (résidu énoncé, jamais masqué,
esprit de la garde 3 déjà actée). Le comportement observable nouveau — `uninstall.exe`/dossier
pouvant rester sur le disque même après désinstallation confirmée — est un **effet de bord
documenté et énoncé**, pas une régression fonctionnelle silencieuse : avant le fix, le résidu
**pire** (la clé de registre elle-même) était **caché** derrière un faux `ok:true`.

**Écart de méthode signalé, sans bloquer le gate** : un agent de fabrication ne mint pas
lui-même un sigle `AR-*` — c'est le vocabulaire du cadrage (Gandalf/décideur). Utiliser ce
sigle sans entrée formelle dans `## 3. Arbitrages` brouille la traçabilité (un lecteur qui
cherche « AR-W20 » dans la table des arbitrages ne le trouve pas). Recommandation : soit
renommer les références en « précision AR-W5 » dans un futur commit doc, soit faire ajouter
rétroactivement une entrée `### AR-W20` par le cadrage — dans les deux cas, ceci est un
**nettoyage de nommage**, pas une reprise de code, et ne remet pas en cause le verdict PASS de ce
gate (le fix, lui, est correct, testé et transparent).

## Ce que seul le second run réel du banc CI prouve

Ce poste ne peut prouver que la **mécanique en isolation** (ports injectés, doubles rejouant
fidèlement le format de `reg.exe`/`uninstall.exe`) : que l'appel porte bien `_?=`, que le verdict
dépend bien de la relecture, que le résidu est énoncé. Il ne peut **pas** prouver que, sur un vrai
runner Windows, `uninstall.exe /S _?=<InstallLocation>` exécuté en place rend effectivement la
main **après** la fin réelle de la désinstallation (le point précis que le run `33997947501` avait
pris en défaut) — cela suppose un comportement réel de `spawnSync` face à un process NSIS qui ne
se recopie plus. **Seul un second run réel du banc CI Windows** (déclenché par le décideur,
jamais par un agent, AR-W7) peut faire tomber `sousClesRestantes` à `0` et transformer les deux
lignes `FAIL` mesurées le 2026-09-06 en `PASS` mesuré — ce gate ne peut que constater que le code
est **prêt** à être remesuré, pas que la mesure a déjà réussi une seconde fois.
