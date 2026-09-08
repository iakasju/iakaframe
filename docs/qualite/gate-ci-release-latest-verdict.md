# Gate qualité — CI-RELEASE-LATEST-NON-MAITRISE — verdict Legolas

Branche : `fix/ci-release-latest` (6 commits au-dessus de `main` @ `a1e0072`) — mesuré le 2026-09-08.
Base : `specs/instructions/ci-release-latest-non-maitrise.md`. Note distincte de Gimli (mesures,
pas verdict) : `docs/qualite/gate-ci-release-latest.md` — non réécrite ici.

## Verdict : **PASS** (automatique dev→stage) — avec **un écart signalé, hors gate, pour le décideur**

Tous les critères automatisables (CA-L1 → CA-L10) sont **re-mesurés indépendamment** par moi-même
(jamais repris tel quel du rapport de Gimli) et concordent. CA-L11/L12/L13 sont des **gates
humains**, non couverts par construction (§ 8 de l'instruction) — ils **restent dus**, ce n'est
**pas** un FAIL, c'est l'état attendu à ce stade. **Un écart réel est trouvé** au point 10 de
l'ordre de mission : les commandes `git push origin ...` écrites par Gimli au `BACKLOG.md` pour
CA-L11/CA-L12 ciblent le **mauvais remote** — voir § « Écart trouvé » ci-dessous.

## Mesures — CA-L1 à CA-L10 (re-mesurées, pas reprises)

| # | Mesure | Commande | Résultat cité |
|---|---|---|---|
| CA-L1 | Log verbatim run `34001818646` | `gh run view 34001818646 --repo iakasju/iakaframe --log \| grep -E "DECISION\|make_latest"` | `DECISION : v0.41.0 n'est PAS le plus haut (v0.40.0) -> make_latest=false.` / `make_latest: false` |
| CA-L1 | Log verbatim run `33959443438` | idem | `DECISION : v0.40.0 n'est PAS le plus haut (v0.39.0) -> make_latest=false.` / `make_latest: false` |
| CA-L1 (contrefactuel) | Log verbatim run `33635520511` (avant fix R-2) | idem | `DECISION : v0.39.0 EST le plus haut -> make_latest=true` / `make_latest: true` — la régression est bien **datée**, pas générale |
| CA-L2/L3 | `node --test cli/test/release-latest-shell.test.js` (HEAD) | `node --test test/release-latest-shell.test.js` | `tests 29 / pass 29 / fail 0` |
| CA-L2 (contrefactuel de classe) | même jambe rejouée contre le texte d'`a1e0072` (release.yml non corrigé), dans un `git worktree` isolé | même commande, worktree détaché sur `a1e0072` avec les 3 fichiers de test/lib/fixture de HEAD copiés par-dessus | `tests 29 / pass 21 / fail 8` — **exactement** les 8 échecs cités par l'ordre de mission : `CA-L2 nominal`, `CA-L4 filet`, et les 3×2 tests d'épinglage (`checkout`/`setup-node`/`softprops` non SHA-40) |
| CA-L5 | absence de `gh api ... --jq --arg` | `grep -n "gh api.*--jq.*--arg" .github/workflows/release.yml` | aucune occurrence (exit 1 du grep) |
| CA-L6 | `true` en dur absent | `grep -n "make_latest: true\|make_latest=true\"" .github/workflows/release.yml` | seule occurrence : ligne 193-194, dans la **branche bash calculée** (`echo "make_latest=true"`), jamais un littéral YAML inconditionnel |
| CA-L6 | 3 SHA de 40 hex + tag lisible | `grep -n "uses:" .github/workflows/release.yml` + longueur des SHA | `actions/checkout@11d5960a...677262 # v4`, `actions/setup-node@49933ea5...820020 # v4`, `softprops/action-gh-release@3bb12739...b0e65 # v2` — 40 caractères chacun |
| CA-L6 | re-vérification indépendante des 3 SHA | `gh api repos/<org>/<repo>/git/ref/tags/<tag>` sur les 3 actions | les 3 SHA rendus par l'API **coïncident exactement** avec ceux du YAML ; `"type":"commit"` dans les 3 cas — **aucune déréférence de tag annoté nécessaire** |
| CA-L7 | contrat `make_latest`/`prerelease` de `softprops` lu au SHA épinglé | `gh api .../contents/action.yml?ref=<sha>` puis `grep -A5 "make_latest:\|prerelease:"` | description mot pour mot identique à `cli/fixtures/actions-pin.json` : *« Can be `true`, `false`, or `legacy`. Uses GitHub api default if not provided »* / *« Identify the release as a prerelease. Defaults to false »* |
| CA-L7 | `sha256` de l'`action.yml` (3 actions) | téléchargement au SHA + `shasum -a 256` | les 3 empreintes recalculées sont **identiques** à `cli/fixtures/actions-pin.json` |
| CA-L8 | registre à `0` sur les fichiers du lot | `node cli/scripts/registre-repli-latest.js` filtré (`grep`) sur `.github/workflows/release.yml`, `BACKLOG.md`, `cli/scripts/vitrine-en-ligne.js`, `cli/fixtures/registre-repli-latest.json`, `cli/fixtures/actions-pin.json`, `cli/scripts/lib/release-shell.js`, `cli/test/release-latest-shell.test.js` (hors `.claude/worktrees/`) | **0 ligne** — les 5+2 fichiers du lot sont à dérive nulle |
| CA-L8 | échantillon d'ancres du registre | 3 ancres tirées au hasard dans `entrees[].chemin==".github/workflows/release.yml"` + `sed -n '<ligne>p'` | ligne 83 (`--latest=false ... inerte`), ligne 167 (`select(.draft\|not)/select(.prerelease\|not)`), ligne 222 (`gh release edit <tag> --latest AGIT`) — **les 3 correspondent** au contenu réel |
| CA-L8 | motifs des exclusions neuves | `git diff a1e0072..HEAD -- cli/fixtures/registre-repli-latest.json \| grep motif` | chaque motif neuf est **spécifique et non vide** (câblage de sortie de step nommé, citation verbatim du témoin historique, câblage de test) — aucun motif générique/fourre-tout |
| CA-L8 | l'échec global n'est pas causé par ce lot | `registre-repli-latest.js` rejoué sur un **`git worktree` isolé de `main`** (racine symlinkée pour restaurer la résolution des dépôts frères) vs sur la branche `fix/ci-release-latest` | **main : 474 dérives** (dont **16** rien que sur `iakaframe/BACKLOG.md`) → **branche : 473 dérives**, et **0** dérive `iakaframe/BACKLOG.md`. Le lot **réduit** la dette globale, il ne l'aggrave pas. Le léger différentiel restant (+15 `D-3` côté branche) vient de **worktrees Claude Code actifs sur mon poste** (`.claude/worktrees/…`, `.worktrees/…`), pas du code du lot |
| CA-L9 | E-1 rectifié, daté, pas effacé | lecture `cli/scripts/vitrine-en-ligne.js:120-152` | bloc `⚠️ RECTIFIE A NOUVEAU LE 2026-09-08` ajouté **après** le bloc du 2026-09-02, texte antérieur **conservé** ; message E-1 ne dit plus « jamais rejouée » |
| CA-L9 | BACKLOG.md — cause + solde + successeur | lecture `BACKLOG.md:13-63` et `:655-682` | titre corrigé (« CALCULE A `false` », plus « inerte ») ; `CI-RELEASE-AUCUN-EPINGLAGE` déplacé en *Fait*, soldé avec preuve (SHA + cliquet), texte d'origine conservé ; successeur `REGISTRE-REPLI-LATEST-DETTE-CROISEE` nommé (`BACKLOG.md:65-89`) avec ses 3 causes propres |
| CA-L10 | `node --test` complet | `cd cli && node --test` | `tests 1191 / pass 1190 / fail 0 / cancelled 0 / skipped 1 / todo 0`, exit 0 — **conforme à l'attendu 1191/1190/0/1** |
| CA-L10 | `npm run vitrine:check` | `node scripts/vitrine.js --check` | `vitrine : OK — README aligne sur v0.41.0.`, exit 0 |
| CA-L10 (hors gate, informatif) | `npm run vitrine:en-ligne` | `node scripts/vitrine-en-ligne.js` | `vitrine:en-ligne : OK — la vitrine et l'etagere concordent.`, exit 0 — **rapporté, pas compté** dans le vert de lot |
| CA-M8 (témoin non-régression) | prose humaine `install --dry-run` inchangée | présent dans le run `node --test` complet | `✔ CA-M8 — LA PROSE HUMAINE NE BOUGE PAS D'UN OCTET` + `✔ CA-M8, non-régression croisée` — les deux verts |
| Périmètre `cli/src/` | aucune logique produit touchée | `git diff --stat a1e0072..HEAD -- cli/src` | **vide** — confirmé |

## CA-L11 / CA-L12 / CA-L13 — 👤 gates humains, non couverts (rappel, pas un défaut)

- **CA-L11** — pousser `v0.41.1-rc.1` (contrefactuel gratuit, ne doit pas voler `latest`) : **dû**.
- **CA-L12** — LA preuve du lot, au prochain tag réel : **dû**. Tant qu'il n'est pas joué, le lot
  est **livré mais NON PROUVÉ** en conditions réelles — exactement ce que dit déjà l'instruction.
- **CA-L13** — sort de la `rc` (suppression éventuelle) : acte de release réservé au décideur.

## Écart trouvé (à traiter par le décideur, pas par un agent) — le remote des commandes CA-L11/CA-L12

`BACKLOG.md:52-53` et `:56-57` écrivent, mot pour mot :

```
git tag v0.41.1-rc.1 && git push origin v0.41.1-rc.1
git tag v0.42.0 && git push origin v0.42.0
```

Mesure des remotes (`git remote -v`) sur ce dépôt :

```
github  https://github.com/iakasju/iakaframe.git   (fetch/push)
iakabox http://.../192.168.2.11:3001/sjupin/iakaframe.git (fetch/push)
origin  http://.../192.168.1.139:3001/sjupin/iakaframe.git (fetch/push)
```

`origin` pointe vers le **Forgejo du NAS** (192.168.1.139) — pas vers GitHub. Or
`.github/workflows/release.yml` est un workflow **GitHub Actions** : il ne peut se déclencher que
sur un push de tag **reçu par github.com**. Les tags précédents (`v0.39.0`, `v0.40.0`, `v0.41.0`)
existent bien sur `github.com/iakasju/iakaframe` (vérifié par `gh api repos/iakasju/iakaframe/tags`)
mais **rien dans la configuration git locale ne prouve qu'un `git push origin` suffirait à les y
faire apparaître** : aucun push-mirror n'est visible depuis `.git/config` de ce poste. **La commande
correcte pour déclencher réellement CA-L11 et CA-L12 est `git push github v0.41.1-rc.1` /
`git push github v0.42.0`, pas `git push origin ...`.** Si un push-mirror Forgejo→GitHub existe
côté serveur (hors visibilité de ce poste), l'écart est sans conséquence pratique — mais tel
qu'écrit, littéralement, le texte de `BACKLOG.md` désigne le mauvais remote pour un lecteur qui
l'exécute à la lettre depuis ce poste. **Je signale, je ne corrige pas** (le fichier n'est pas dans
mon périmètre de commit).

## Point 8 — les sœurs n'ont pas la régression (Gimli a raison, vérifié par lecture)

Lecture seule de `IakaCockpit/.github/workflows/release.yml` et `iakaFrameGUI/.github/workflows/release.yml`
(identiques sur ce point) : leur job `latest` porte `needs: publier` (`IakaCockpit/.github/workflows/release.yml:338-339`)
et tourne donc **après** que la release du tag courant a déjà été publiée par le job `publier`. Sa
population `$RELEASES` (lue à ce moment-là) **contient déjà** le tag courant, donc
`[ "$TAG" = "$PLUS_HAUT" ]` **peut** être vrai sur le chemin nominal. C'est structurellement
différent d'`iakaframe`, où l'étape `rang` tourne **avant** la création de la release par
`softprops`, dans le **même job**. **Confirmé : les sœurs n'ont pas cette régression**, pour la
raison exacte que Gimli avance (job `latest` après `build`/`publier`).

## Registre — dette globale préexistante, non aggravée (détail du CA-L8 ci-dessus)

`npm run registre:repli-latest` (sans filtre) rend `1` avec **473 dérives** sur la branche du lot.
Rejoué sur un `git worktree` isolé de `main` (racine reconstituée par symlinks pour que le script
retrouve les dépôts frères `IakaCockpit`/`iakaFrameGUI` réels, inchangés entre les deux mesures) :
**474 dérives** sur `main`. Décomposition par catégorie :

| Catégorie | `main` | branche `fix/...` |
|---|---|---|
| D-1 (énoncé disparu) | 95 | 95 |
| D-2 (migration de ligne) | 177 | 172 |
| D-3 (fichier neuf hors registre) | 10 | 25 (dont **15** sont des worktrees Claude Code actifs sur mon poste, artefact de mesure, pas du lot) |
| D-4 (nombre d'occurrences changé) | 8 | 7 |
| D-5 (ligne du motif non tenue) | 163 | 153 |
| D-7 (déclaration hors couverture périmée) | 21 | 21 |

Le lot **résorbe entièrement** la dette de `iakaframe/BACKLOG.md` (16 entrées D-2/D-4/D-5 sur
`main`, **0** sur la branche) et ne touche à rien d'autre côté `iakaframe/`. La dette restante
(`specs/etat-des-lieux.md`, `D-3`/`D-7` chez les dépôts sœurs) est **identique des deux côtés** ou
antérieure au lot — **le lot n'aggrave pas l'état global**, il l'améliore légèrement sur son propre
périmètre. `BACKLOG.md` nomme correctement ce reliquat comme successeur
`REGISTRE-REPLI-LATEST-DETTE-CROISEE`, hors périmètre de ce lot.

## Ce qui reste au décideur

1. **CA-L11** — `git tag v0.41.1-rc.1 && git push github v0.41.1-rc.1` (remote **corrigé**, voir
   écart ci-dessus) ; vérifier que `releases/latest` ne bouge pas et que l'étape `rang` imprime
   `make_latest=false`.
2. **CA-L12** — au prochain tag réel `v0.42.0` : `git tag v0.42.0 && git push github v0.42.0` ;
   vérifier `releases/latest = v0.42.0` **sans rattrapage manuel**, `latest maitrise : v0.42.0` dans
   les logs, et `npm run vitrine:en-ligne` sans écart E-1. **C'est la seule preuve qui ferme
   réellement le lot** — non jouée à ce jour.
3. **CA-L13** — sort de `v0.41.1-rc.1` après (a) : suppression ou conservation, acte de release.
4. Trancher si un push-mirror serveur existe déjà (auquel cas corriger juste le texte de
   `BACKLOG.md` pour éviter la confusion) ou si les commandes doivent explicitement cibler `github`.

