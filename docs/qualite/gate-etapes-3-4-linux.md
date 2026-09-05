# Gate qualité — ETAPES-3-4-WINDOWS-LINUX, lot W-L (Linux)

> Branche `feat/etapes-3-4-linux` (tête `a05f6f5`), base `main` (`acc02e3`).
> Instruction : `specs/instructions/etapes-3-4-windows-linux.md`.
> Vérifié par 🏹 Legolas le 2026-09-05, en contexte séparé de Gimli. Aucune coche du § 8
> n'est reprise comme acquise : chaque critère du lot W-L est re-mesuré ci-dessous.
> **Périmètre de ce gate : lot W-L (Linux) uniquement.** CA-W8..CA-W13 (Windows) et
> CA-W19 (banc CI) appartiennent au lot **W-W** et à l'**Étape 3**, non demandés dans
> cet ordre de mission — déclarés **non couverts**, jamais évalués comme s'ils l'étaient.

## Verdict : **PASS**

Les quatre commits de Gimli (`84632f4`, `020d518`, `9af2274`, `a05f6f5`) livrent
exactement le lot W-L annoncé, sans déborder sur Windows ni toucher au chemin macOS.
La suite complète est verte à l'exact chiffre annoncé (1118/1117/0/1). Le fichier de
transport `rollback.js`, le vocabulaire d'événements `evenements.js` et le module de
vérification `minisign.js` sont **inchangés à l'octet** (diff vide, vérifié). La
signature minisign a été vérifiée **indépendamment**, contre une AppImage réelle
retéléchargée depuis la release GitHub d'iakaFrameGUI, avec un contrefactuel
(octet corrompu → refus) rejoué hors du harnais de test. La prose macOS a été rejouée
**moi-même**, hors harnais, et comparée octet pour octet au témoin — identique. Le
timeout `getBytes` (30s→180s) est borné au seul appelant `telechargerEtVerifier` ;
les sondes réseau (`network-double`, `etape1-reseau-ecarte`) restent vertes et
rapides (0,9 s). Aucun écart bloquant trouvé sur le périmètre W-L.

## Mesures

| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `find cli/src -name '*.js' \| xargs -n1 node --check` | `0` | `SYNTAX_OK` sur l'ensemble de `cli/src` |
| `cd cli && node --test` (suite complète, sans filtre) | `0` | `tests 1118`, `pass 1117`, `fail 0`, `cancelled 0`, `skipped 1`, `todo 0`, `duration_ms 81060` |
| Baseline `main`@`acc02e3`, worktree isolé (supprimé après usage) | `0` | `tests 1098`, `pass 1091`, `fail 0`, `skipped 7` — cohérent avec le delta de +20 tests neufs annoncé (le nombre de skips diffère car le worktree isolé n'a pas les dépôts sœurs ni `rg` sur le PATH de test — environnement, pas régression) |
| `git diff --numstat acc02e3..HEAD` | — | `install.js` +46/-7 · `app-bundle.js` +92/-10 · `http.js` +18/-5 · `app-bundle.test.js` +117/-7 · `http.test.js` +58/-0 (neuf) · `install-etapes-3-4.test.js` +195/-0 (append pur) · `docs/commandes.md` +1/-1 · l'instruction elle-même +62/-14 |
| `git diff acc02e3..HEAD -- cli/src/lib/rollback.js` | — | **vide** — AR-5, ses trois gardes, non réécrites (M2 tenu) |
| `git diff acc02e3..HEAD -- cli/src/lib/evenements.js` | — | **vide** — AR-W8(a) tenu, aucun evt/état neuf |
| `git diff acc02e3..HEAD -- cli/src/lib/minisign.js` | — | **vide** — CA-14 non rouvert |
| `grep -n getBytes cli/src cli/test -r` | — | **seul appelant** : `telechargerEtVerifier` (`app-bundle.js`) ; sondes réseau et manifestes passent par `getJson` (`endpoints.js`), jamais `getBytes` |
| `time node --test test/network-double.test.js test/etape1-reseau-ecarte.test.js` | `0` | `tests 11`, `pass 11`, **`0,946s` total** — aucune dérive de délai |
| Contrefactuel indépendant `getBytes(url, 1)` vs `getBytes('http://127.0.0.1:1/', 2000)` | — | `expire:true` (timeout) **distinct** de `expire:false` (port fermé) — rejoué hors du test de Gimli, script séparé |
| Téléchargement réel `iakaFrameGUI_0.1.8_amd64.AppImage` (release GitHub) | `HTTP:200` | `83 753 464` octets — **identique** à la mesure de Gimli (M-9 de l'instruction) |
| Vérification minisign indépendante (`cli/src/lib/minisign.js`, script séparé) | — | `{valide:true, globaleValide:true, keyIdConcorde:true, motif:"ok"}` contre `IakaFrameGUI/updater/latest.json`, entrée `linux-x86_64-appimage` |
| Contrefactuel : 1 octet corrompu dans l'AppImage téléchargée | — | `{valide:false, motif:"verification en echec"}` — refus correct |
| `grep bundle.windows` dans les deux `tauri.conf.json` | — | **0 occurrence** dans l'un et l'autre — seul `plugins.updater.windows.installMode:"passive"` existe (M7 confirmé) |
| Manifestes réels `IakaCockpit/updater/latest.json`, `iakaFrameGUI/updater/latest.json` | — | **9 clés chacun**, `linux-x86_64` et `linux-x86_64-appimage` pointent la même AppImage, `-deb`/`-rpm`/`-msi`/`-nsis` **signés** avec des URL **distinctes** (M5 confirmé, fixtures CA-W2/CA-W6 non vacuous) |
| Rejeu manuel `install --dry-run` (réservoir vivant + double réseau, hors harnais) | `0` | sortie normalisée **identique octet pour octet** au témoin `cli/test/fixtures/install-prose-dry-run.txt` |
| `git diff acc02e3..HEAD -- cli/test/fixtures/install-prose-dry-run.txt` | — | **vide** — témoin CA-M8 non retouché |
| `node --test test/install-prose-non-regression.test.js` | `0` | `tests 5`, `pass 5` |
| `node --test test/guide-doc-a-jour.test.js test/guard-verbes-registre.test.js` | `0` | `tests 24`, `pass 24` |
| `git log acc02e3..HEAD --format="%H %s"` + `git show --stat` par commit | — | 4 commits, diffs internes cohérents avec le cumulé (aucun hunk orphelin) ; symboles importés dans les tests neufs (`resoudreCleManifeste`, `familleDePose`, `nomFichierCible`, `poserBundleLinux`) tous **exportés et résolus** — la suite complète chargerait en erreur sinon |
| `grep -rn '\.desktop' cli/src/` | — | **0 occurrence** — AR-W4(a) tenu, aucun lanceur `.desktop` écrit |
| `git diff --stat acc02e3..HEAD -- .github/` | — | vide — aucun banc CI ajouté (CA-W19 déclaré hors périmètre, pas simulé) |
| `git status --short` avant/après toute la session | vide/vide | arbre rendu exactement comme trouvé ; `cli/_bundled/` (généré par un test `npm pack --dry-run`, gitignoré) supprimé en fin de session |
| `git worktree list` avant/après | identique | worktree de mesure de la baseline `main` créé puis retiré (`git worktree remove --force`) |

## Tableau des critères d'acceptation — lot W-L

| Critère | Verdict | Preuve re-mesurée |
|---|---|---|
| **CA-W1** | **PASS** | `cleManifestePlateforme({platform:'linux',arch:'x64'})` → `{installeur:'linux-x86_64-appimage', generique:'linux-x86_64'}`, vérifié par lecture + test vert |
| **CA-W2** | **PASS** | `resoudreCleManifeste` lit l'installeur d'abord, générique en repli ; fixture à URL **distinctes** (`appimage-url` ≠ `generique-url`), pas de témoin vide ; contrefactuel repli manquant testé |
| **CA-W3** | **PASS** | `poserBundleLinux` écrit l'octet exact + `chmod 0o755` ; vérifié par test ET par lecture directe du mode fichier (`fs.statSync(cible).mode & 0o111`) |
| **CA-W4** | **PASS** | `existaitAvant` mesuré `false`/`true` selon pose neuve/remplacement, sur un **fichier** (pas un dossier) ; `rollback.js` réutilisé sans une ligne modifiée (confirmé au diff) |
| **CA-W5** | **PASS** | AppImage préexistante restaurée par `orchestrerRollback`, jamais effacée — testé sur un vrai fichier avec contenu distinct avant/pendant/après |
| **CA-W6** | **PASS** | Manifeste ne portant que `-deb`/`-rpm` **signés et valides** (URL distinctes) → refus nommant l'AppImage manquante, **0 appel de téléchargement**, rien écrit ; verrou anti-témoin-vide respecté (les entrées deb/rpm sont réellement valides, pas juste absentes) |
| **CA-W7** | **PASS** | `--dry-run` sur Linux : empreinte disque récursive avant/après **identique**, prouvé par test ET par la nature de la garde (comparaison de contenu, pas de lecture de code) |
| **CA-W14 (transverse, non-régression macOS)** | **PASS avec écart assumé et motivé** | `install-etapes-3-4.test.js`, `rollback.test.js` : **0 ligne modifiée** (confirmé au `git diff --numstat`, +195/-0 et fichier absent du diff respectivement). `app-bundle.test.js` : 2 tests CA-15 **mis à jour pour le nouveau contrat** de `cleManifestePlateforme` (chaîne → couple), mandaté par le §2.1 lui-même — CA-14, `resoudreManifesteApp`, `poserBundleDarwin` : lignes identiques (vérifié à la lecture, ces blocs ne sont touchés par aucun hunk du diff). La lettre stricte de CA-W14 (« deux fichiers, zéro ligne ») ne peut pas être tenue sans contredire le mandat du §2.1 ; l'esprit (comportement macOS inchangé) est tenu et mesuré par la suite verte |
| **CA-W15** | **PASS** | `win32/x64`, `linux/arm64`, `darwin/ia32` → `null`, refus **avant** tout réseau (compteur à 0, test `install-etapes-3-4.test.js:92-107` inchangé) |
| **CA-W16** | **PASS sur le périmètre du lot (macOS + Linux)** | Signature invalide sur AppImage → refus, **rien écrit dans `--apps-dir`** — testé, ET rejoué indépendamment par moi (AppImage réelle téléchargée, 1 octet corrompu, `verifierMinisign` refuse). Windows explicitement dû au lot W-W |
| **CA-W17** | **PASS** | `evenements.js` diff vide ; test dédié vérifie que tout `evt`/`etat` émis sur le chemin Linux appartient au vocabulaire fermé |
| **CA-W18** | **PASS** | `docs/commandes.md:249` réécrit : macOS + Linux couverts, Windows refusé jusqu'à W-W, non-repli deb/rpm explicite, gate humain AppImage nommé — vérifié par lecture du diff exact |
| **CA-W8..CA-W13 (Windows)** | **NON COUVERTS, hors périmètre W-L** | Appartiennent au lot W-W (§5 Étape 2), non demandé dans cet ordre de mission. Confirmé : `cleManifestePlateforme` n'ajoute pas `win32` à sa table dans ce lot (AR-W6) |
| **CA-W19 (banc CI)** | **NON COUVERT, hors périmètre W-L** | Appartient à l'Étape 3 (§5), non demandée. `.github/workflows/` non touché par ce lot (vérifié au diff) — honnêtement non fait, pas simulé |

## Contrefactuels rejoués indépendamment (hors ceux déjà dans les tests de Gimli)

1. **Timeout `getBytes`** : `getBytes(url, 1)` sur un serveur qui répond à 500 ms → `expire:true` ; `getBytes('http://127.0.0.1:1/', 2000)` (port fermé) → `expire:false`. Les deux sont bien discriminés par un script indépendant du test de Gimli.
2. **Signature minisign** : AppImage réelle (83 753 464 octets, `iakaFrameGUI_0.1.8_amd64.AppImage`) téléchargée depuis GitHub → `verifierMinisign` rend `valide:true`. Un seul octet corrompu (offset 1000) → `valide:false, motif:"verification en echec"`. Vérifié avec le module de production, pas une reconstruction.
3. **Prose macOS (CA-M8)** : rejeu manuel complet (réservoir vivant fabriqué, double réseau activé par les deux signaux requis `IAKAFRAME_INSTALL_TEST_DOUBLE=1` + `NODE_TEST_CONTEXT=child-v8`), sortie normalisée comparée octet pour octet au témoin `install-prose-dry-run.txt` → **identique**. Un premier essai sans `NODE_TEST_CONTEXT` a bien divergé (réseau réel sollicité) — confirmant que le double-signal de garde (`doitActiverDouble`) fonctionne comme conçu, pas un défaut.

## Point 9 — l'incident « git checkout » signalé par Gimli

Aucune trace directe n'est observable : un `git checkout -- <fichier>` (restauration d'un
fichier dans l'arbre de travail) ne laisse pas d'entrée dans le reflog, qui ne trace que
les mouvements de `HEAD`/refs. Le reflog local ne montre que les 4 commits attendus,
sans anomalie. À défaut d'observation directe, j'ai vérifié les conséquences possibles
d'une reconstruction imparfaite :
- `git show --stat` sur chacun des 4 commits : diffs internes cohérents, aucun hunk
  orphelin, la somme égale le diff cumulé (`git diff --numstat acc02e3..HEAD`).
- Tous les symboles importés par les tests neufs (`resoudreCleManifeste`, `familleDePose`,
  `nomFichierCible`, `poserBundleLinux`) sont **exportés et résolus** par `app-bundle.js`
  — une erreur d'import aurait fait échouer le chargement de `node --test` en bloc,
  ce qui n'est pas le cas (1118/1117/0/1).
- Aucune fonction référencée-mais-absente, aucun test import-cassé trouvé.

**Conclusion** : rien ne contredit la déclaration de Gimli ; la reconstruction, si elle a
eu lieu, n'a laissé aucune trace de dégât mesurable. Non confirmable indépendamment
faute d'instrument (le geste lui-même n'est pas tracé par git), mais non infirmée non
plus.

## Point 10 — commentaire rectifié et doc

- `app-bundle.js:44-58` : rectification **datée** (2026-09-05, lot W-L), l'ancien texte
  (« la SEULE forme installable... ») est **conservé au-dessus**, jamais effacé — vérifié
  à la lecture du diff complet.
- `docs/commandes.md:249` : réécrit dans ce lot, décrit macOS + Linux, Windows refusé
  jusqu'à W-W, non-repli deb/rpm, gate humain AppImage — vérifié exact par diff.
- Les 2 tests modifiés de `cleManifestePlateforme` (CA-W14) : changement de contrat
  strictement celui mandaté par §2.1 (chaîne unique → couple `{installeur, generique}`),
  rien de plus — vérifié : les valeurs attendues des deux tests changent de forme
  (`'darwin-aarch64'` → `{installeur:null, generique:'darwin-aarch64'}'`), aucune autre
  assertion n'est touchée.

## Ce qui reste (hors périmètre de ce gate, rappelé)

- **Lot W-W (Windows)** : CA-W8..CA-W13, AR-W1/AR-W2/AR-W5 côté Windows — non
  implémentés, non attendus dans cet ordre de mission.
- **Étape 3, banc CI** (CA-W19) — non fait, `.github/workflows/` intact, jamais simulé.
- **Gate humain, déclaré par l'instruction elle-même (§8)** : l'AppImage **se lance**
  réellement sur une distribution Linux, avec ou sans FUSE 2 (E-7) — non prouvable sur
  ce poste macOS. Le lot ne prétend prouver que : table de clés, sélection, copie de
  l'octet, `chmod`, sauvegarde/rollback sur fichier, refus, dry-run — tout ce qui est
  listé ci-dessus comme mesuré l'est réellement ; le lancement effectif de l'AppImage
  reste dû au décideur.

## Reproductions clés

```bash
# Suite complète
cd cli && node --test
# -> tests 1118, pass 1117, fail 0, skipped 1

# CA-M8 — rejeu manuel indépendant de la prose macOS
IAKAFRAME_INSTALL_TEST_DOUBLE=1 NODE_TEST_CONTEXT=child-v8 \
  node cli/src/index.js install --dry-run --root <reservoir-vivant> \
  --target-claude <tmp>/claude --apps-dir <tmp>/apps --backup-dir <tmp>/backups --yes
# -> normaliser <VIVANT>/<CLAUDE>/<APPS>/<BACKUPS>, diff avec cli/test/fixtures/install-prose-dry-run.txt => aucune différence

# Contrefactuel timeout getBytes, hors harnais de test
node -e "
import('./cli/src/lib/http.js').then(async ({getBytes}) => {
  const http = await import('node:http');
  const srv = http.createServer((q,r)=>setTimeout(()=>{r.writeHead(200);r.end('x')},500));
  await new Promise(res=>srv.listen(0,'127.0.0.1',res));
  const {port} = srv.address();
  console.log(await getBytes('http://127.0.0.1:'+port+'/', 1));   // expire:true
  srv.close();
  console.log(await getBytes('http://127.0.0.1:1/', 2000));       // expire:false
});
"
```
