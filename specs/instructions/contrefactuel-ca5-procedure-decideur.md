# CA-5 — procédure du décideur, et pourquoi elle est **suspendue**

> Compagnon d'exécution de `contrefactuel-du-vol-de-latest.md` (lot **L43**). Rédigé par
> ⚒️ **Gimli** le **2026-08-29**, après la **répétition en dépôt jetable** (V-D) exigée par
> **AR-3**.
>
> ## 🛑 STATUT : SUSPENDU — arbitrage requis avant tout geste sur `IakaCockpit`
>
> **AR-3 est tranché « V-D puis V-C », avec une clause d'arrêt explicite** : *« si la répétition
> révèle que le risque n'est pas borné comme prévu, s'arrêter et remonter »*. **La répétition l'a
> révélé.** La fenêtre de vol décrite au cadrage — quelques minutes, refermée par le job lui-même
> (F2) — **n'existe pas**. Le job **ne referme rien**. La fenêtre court **de la création de la
> release jusqu'au moment où le décideur tape lui-même la commande de rattrapage**.
>
> La séquence ci-dessous est **écrite, complète et exécutable**. Elle **n'est pas à exécuter**
> avant que le décideur ait tranché la question posée en § 5.

---

## 1. Ce que la répétition a mesuré — dépôt `iakasju/latest-contrefactuel` (privé)

Topologie fabriquée sur **trois commits distincts**, pour que les deux règles de repli candidates
ne soient **pas** à égalité :

| Release | `created_at` | rang semver |
|---|---|---|
| `v0.10.0` | `2026-08-29T22:01:35Z` — le plus **ancien** | le plus **haut** |
| `v0.9.0` | `2026-08-29T22:10:00Z` | intermédiaire |
| `v0.2.0` | `2026-08-29T22:20:00Z` — le plus **récent** | le plus **bas** |

Plus un tag `archive/feat/x`, **sans** release.

| # | Geste | `releases/latest` avant | après |
|---|---|---|---|
| a | état de référence (`gh release edit v0.10.0 --latest`) | — | **`v0.10.0`** |
| a′ | `git push origin v0.2.0` — **le tag seul** | `v0.10.0` | **`v0.10.0`** *(un tag ne vole rien)* |
| b | `gh release create v0.2.0` — **sans** `--latest` | `v0.10.0` | **`v0.2.0`** — **VOL** |
| c | run `33277643229`, job `latest`, `TAG=v0.2.0` → `gh release edit v0.2.0 --latest=false` | `v0.2.0` | **`v0.2.0`** — **rien rendu** |
| d | re-mesure 90 s plus tard *(hypothèse « propagation »)* | `v0.2.0` | **`v0.2.0`** |
| e | `gh release edit v0.10.0 --latest` — **le rattrapage** | `v0.2.0` | **`v0.10.0`** en < 3 s |
| f | `gh release edit v0.10.0 --latest=false` *(le `created_at` le plus **ancien**)* | `v0.10.0` | **`v0.10.0`** |
| g | `PATCH /releases/379113276 -f make_latest=false` *(REST brut, hors `gh`)* | `v0.10.0` | **`v0.10.0`** |
| h | `gh release edit v0.9.0 --latest` puis `--latest=false` *(`created_at` le plus **récent**)* | `v0.9.0` | **`v0.9.0`** |
| i | `gh release delete v0.2.0` alors qu'elle **portait** le `latest` | `v0.2.0` | **`v0.10.0`** |

**Verbatim du run `33277643229`, job `latest`** :

```
tag publie      : v0.2.0
plus haut semver: v0.10.0
DECISION : v0.2.0 n'est PAS le plus haut (v0.10.0) -> on pose explicitement
           --latest=false. Sans cette ligne, le defaut make_latest=true de
           l'API aurait VOLE le latest a v0.10.0.
https://github.com/iakasju/latest-contrefactuel/releases/tag/v0.2.0
VERIFICATION : latest effectif = v0.2.0 (attendu : v0.10.0)
##[error]le latest effectif (v0.2.0) n'est pas le plus haut semver (v0.10.0).
##[error]RATTRAPAGE MANUEL : gh release edit v0.10.0 --latest --repo iakasju/latest-contrefactuel
```

### Ce que ça prouve

1. **La création d'une release sans `make_latest` VOLE le `latest`** — (b). Le mécanisme rectifié
   du cartouche est confirmé par l'expérience, pas seulement par la lecture.
2. **`make_latest=false` est un NO-OP** sur `GET /releases/latest` — (c), (f), (g), (h). Testé sur
   la release au `created_at` le plus **ancien** **et** sur celle au plus **récent**, par `gh`
   **et** par un `PATCH` REST brut : aucune règle de repli ne s'applique, **le drapeau ne se retire
   pas**. Les deux hypothèses du cadrage (repli par date · repli par semver) sont **toutes les deux
   fausses** : il n'y a **pas de repli du tout**.
3. **`make_latest=true` sur une autre release, si** — (e), (i). C'est le **seul** geste qui déplace
   le `latest`, et il opère en quelques secondes. **La procédure de restauration est validée.**
4. **Le tri du job est juste sur le cas de bord** : `plus haut semver: v0.10.0`, avec `v0.9.0`
   présent et `archive/feat/x` filtré. `sort -V` ne se laisse pas prendre à `0.9` > `0.10`.
5. **Supprimer la release qui porte le `latest` le déplace** — (i), vers `v0.10.0` et **non** vers
   `v0.9.0` (au `created_at` pourtant plus récent). Le geste de nettoyage **n'est pas neutre** ; ici
   il répare, mais on ne peut pas s'y fier comme mécanisme.
6. **Le transport de preuve tient** : le banc a téléchargé `release.yml` d'`IakaCockpit@main` et
   comparé le bloc `latest:` à sa copie — `sha256` identiques des deux côtés,
   `3547f66746fae90721879ad0115cb84764ff5a2da5c07fd251b75c2634457173`. Ce n'est pas un texte
   ressemblant qui a tourné : c'est **celui-là**.

### Ce que ça ne prouve pas

- **Rien sur `IakaCockpit` lui-même.** Autres droits, autre topologie, autre acteur créant la
  release (`tauri-action` et non `gh release create`). Le banc établit le comportement de **l'API**
  sur un dépôt du même compte, pas celui du dépôt réel.
- **Le `gh release create` du banc est un substitut**, pas l'acteur. Il omet `make_latest` de la
  même façon (`cli/pkg/cmd/release/create/create.go:462` — `params["make_latest"]` n'est posé que
  si `--latest` est passé), mais ce n'est pas `createRelease` de `tauri-action`.
- **Rien sur le badge « Latest » de l'interface web**, non mesuré. Tout ce qui est écrit ici porte
  sur `GET /repos/.../releases/latest`, la seule vue qu'un script consomme.

---

## 2. Ce qui change dans les attendus de CA-5

| Critère | Attendu au cadrage | Attendu **après la répétition** |
|---|---|---|
| **CA-5.1** — ligne `DECISION : … --latest=false` | présente | **inchangé** — elle sera là |
| **CA-5.2** — job `latest` **vert**, `VERIFICATION … (attendu : v0.32.2)` | vert | **le job sera ROUGE**, et sa ligne dira `latest effectif = contrefactuel-ca5-… (attendu : v0.32.2)` |
| **CA-5.3** — `latest` identique en 4.1 / 4.6 / 4.7 | identique **sans intervention** | identique **seulement après le rattrapage manuel** |
| **CA-5.4** — vol observé puis réparé | réparé **par le job** | vol observé ✅, réparé **par le décideur**, pas par le job |
| **CA-5.5 / 5.6 / 5.7** — rien d'abîmé | inchangé | **inchangé** |

Autrement dit : **V-C ne peut plus valider CA-5 tel qu'il est écrit.** Elle validerait autre
chose — que la répétition a déjà établi. Ce qu'elle ajouterait est **réel mais mince** : que le
même comportement vaut sur le dépôt réel, avec le vrai acteur et les vrais droits.

---

## 3. Séquence exacte — si et seulement si le décideur la débloque

> 👤 = geste humain, refusé aux agents. Les mesures de **verdict** se font **en anonyme**
> (point de vue de l'audience) ; les **sondes** se font **authentifiées** (quota 60/h par IP).

### 3.1 — Figer l'état d'avant (quatre valeurs de référence)

```bash
cd ~/work/IakaCockpit
env -u GITHUB_TOKEN -u GH_TOKEN gh api repos/iakasju/IakaCockpit/releases/latest --jq .tag_name
env -u GITHUB_TOKEN -u GH_TOKEN gh api repos/iakasju/IakaCockpit/releases/tags/v0.32.2 --jq '.assets|length'
env -u GITHUB_TOKEN -u GH_TOKEN gh api repos/iakasju/IakaCockpit/releases/tags/v0.32.1 --jq '[.assets[].name]|sort'
shasum -a 256 updater/latest.json
```

**Valeurs mesurées le 2026-08-29 à 22:00 UTC**, à re-confirmer le jour J :
`v0.32.2` · `16` · *(la liste doit contenir nommément `IakaCockpit_aarch64.app.tar.gz`,
`IakaCockpit_aarch64.app.tar.gz.sig`, `IakaCockpit_x64.app.tar.gz`,
`IakaCockpit_x64.app.tar.gz.sig`)* · *(empreinte à relever)*.

### 3.2 👤 — Poser le tag hors semver sur le commit de `v0.32.2`

```bash
SHA=$(gh api repos/iakasju/IakaCockpit/git/ref/tags/v0.32.2 --jq .object.sha)
git tag contrefactuel-ca5-2026-08-29 "$SHA"
git push github contrefactuel-ca5-2026-08-29
```

**Premier attendu mesurable** : *aucun run ne démarre* — le nom ne matche pas `push: tags: v*`.

```bash
sleep 30 && gh run list --repo iakasju/IakaCockpit --limit 3
```

### 3.3 👤 — Dispatcher **depuis `main`**, `platforms: linux`

```bash
gh workflow run release.yml --ref main \
  -f tag=contrefactuel-ca5-2026-08-29 -f platforms=linux \
  --repo iakasju/IakaCockpit
```

> ⚠️ **Depuis `main`, jamais depuis le tag** : `workflow_dispatch` exécute le `release.yml` de la
> référence choisie. Depuis le tag, ce serait celui de `v0.32.2`… qui est le même fichier, mais la
> règle reste : la référence, c'est `main`.

### 3.4 — Sonder la fenêtre, **authentifié**, toutes les 30 s, horodaté

```bash
while true; do
  printf '%s  latest=%s\n' "$(date -u +%H:%M:%SZ)" \
    "$(gh api repos/iakasju/IakaCockpit/releases/latest --jq .tag_name)"
  sleep 30
done | tee /tmp/sonde-ca5.log
```

**Attendu, corrigé par la répétition** : `v0.32.2`, puis **`contrefactuel-ca5-2026-08-29`** dès que
`tauri-action` crée la release — **et ça n'en bouge plus**. Le job `latest` passera, dira
`--latest=false`, et **le `latest` restera volé**.

### 3.5 👤 — **Rattraper immédiatement** (ne pas attendre la fin du run)

```bash
gh release edit v0.32.2 --latest --repo iakasju/IakaCockpit
gh api repos/iakasju/IakaCockpit/releases/latest --jq .tag_name   # doit rendre v0.32.2
```

C'est la commande que le workflow imprime lui-même. **Mesurée : elle fonctionne en < 3 s.**

### 3.6 — Citer le log

```bash
gh run view <id> --repo iakasju/IakaCockpit --log | grep -E "DECISION|VERIFICATION|RATTRAPAGE"
```

### 3.7 — Re-mesurer **en anonyme** les quatre valeurs de 3.1 et les comparer

### 3.8 👤 — Nettoyer, puis re-mesurer une dernière fois

```bash
gh release delete contrefactuel-ca5-2026-08-29 --cleanup-tag --yes --repo iakasju/IakaCockpit
gh api repos/iakasju/IakaCockpit/releases/latest --jq .tag_name
```

**Supprimer une release qui porte le `latest` le déplace** — mesuré (i). Ici la release aura déjà
été dépossédée en 3.5, mais la mesure reste due.

---

## 4. Procédure de restauration

| Symptôme | Détection | Restauration | Coût |
|---|---|---|---|
| **Le `latest` est volé** *(certain, pas hypothétique)* | sonde 3.4, ou ligne `VERIFICATION` du log | `gh release edit v0.32.2 --latest --repo iakasju/IakaCockpit` | **< 3 s, mesuré** |
| **Le job `latest` n'a pas tourné** (run annulé, panne, quota) | mesure 3.7 | idem | idem |
| **Un asset a été écrasé** | comparaison 3.7 à 3.1 | **impossible sur cette voie** : la release est neuve, aucun nom en collision. *(Si le décideur bascule sur V-B : un asset CI se restaure en relançant le dispatch ; les 4 assets posés à la main sur `v0.32.1` **ne se restaurent pas** — d'où l'interdit.)* | — |
| **`npm run vitrine:en-ligne` rougit** pendant la fenêtre | exit 1 sur E-1 | **ne rien corriger** — c'est le comportement juste. Ne pas mesurer la vitrine pendant la fenêtre. | — |
| **Le build linux échoue** | run rouge | aucune release créée, aucun vol ; relancer ou abandonner | — |

**Interdit absolu** : `v0.32.1` comme cible, **sur toutes les plateformes**. Les neuf clés du
manifeste servi pointent ses assets **avec leurs signatures minisign**, et l'action **supprime
l'asset de même nom avant de téléverser**. Rebâtir quoi que ce soit dessus rend la charge utile
servie **invérifiable**, et la réparation passe par le NAS **mort**.

**Ne rien publier d'autre pendant l'expérience** : le workflow n'a aucun `concurrency:`.

---

## 5. La question posée au décideur

La répétition a déplacé le curseur. **Le risque reste borné** — un seul geste le referme, en
quelques secondes, et il est mesuré. Mais **il ne se referme plus tout seul** : la fenêtre dure
tant que personne ne tape la commande. Et **ce que V-C prouverait a rétréci** : la répétition a
déjà établi le mécanisme ; il ne resterait à prouver que sa transposition au dépôt réel.

| Option | Ce qu'on gagne | Ce qu'on paie |
|---|---|---|
| **(α)** Lancer V-C tel quel, avec le rattrapage prêt en 3.5 | la preuve sur le dépôt réel, avec le vrai acteur | une fenêtre de vol **surveillée**, refermée à la main |
| **(β)** Clore CA-5 en **« partiellement prouvé »** : le mécanisme est prouvé sur banc, la transposition reste **espérée**, déclarée et datée | zéro risque ; l'espéré est **écrit**, pas subi | la transposition n'est pas prouvée |
| **(γ)** Traiter d'abord le **défaut découvert** — la branche `--latest=false` est inerte — et re-cadrer la garde avant de la prouver | on cesse de prouver une garde qui ne garde pas | un lot de plus avant CA-5 |

**Recommandation de l'exécution : (γ) puis (β) ou (α).** Prouver au prix d'un vol réel une branche
dont on vient de mesurer qu'elle **ne fait rien** est un mauvais échange. Ce n'est pas une décision
d'exécution : **elle appartient au décideur.**

---

## 6. Les deux réserves, à porter quoi qu'il arrive

1. **La garde répare le vol, elle ne l'empêche pas** — et la répétition va plus loin : **elle ne le
   répare pas non plus**. `tauri-action` crée la release (donc vole) **avant** que le job `latest`
   démarre (`src/index.ts` : `buildProject` → `getOrCreateRelease` → `uploadReleaseAssets`), et la
   branche `--latest=false` est inerte. Ce qui subsiste du job : **un détecteur qui rougit et dicte
   le geste**. C'est utile, ce n'est pas une garde.
2. **Ce que fait GitHub après `make_latest=false` n'est pas documenté** — c'était l'inconnue F4.
   **Elle est désormais mesurée : rien.** Le job **mesure son propre résultat** (ligne
   `VERIFICATION`) et **rougit en dictant le rattrapage** : c'est exactement ce filet qui a rendu
   l'expérience lisible. La réserve tombe sur le fait, elle reste sur la méthode — **rien de tout
   cela n'est garanti pour une autre version de l'API**, et seule la ligne `VERIFICATION` le dira.
