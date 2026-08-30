# CA-5 — procédure du décideur, et pourquoi elle est **suspendue**

> Compagnon d'exécution de `contrefactuel-du-vol-de-latest.md` (lot **L43**). Rédigé par
> ⚒️ **Gimli** le **2026-08-29**, après la **répétition en dépôt jetable** (V-D) exigée par
> **AR-3**. **Corrigé le 2026-08-30** après le FAIL du gate — voir l'encart ci-dessous.
>
> ## 🛑 STATUT : NON EXÉCUTÉE — le décideur a tranché **(γ)**, aucun geste sur `IakaCockpit`
>
> **AR-3 est tranché « V-D puis V-C », avec une clause d'arrêt explicite** : *« si la répétition
> révèle que le risque n'est pas borné comme prévu, s'arrêter et remonter »*. **La répétition l'a
> révélé.** La fenêtre de vol décrite au cadrage — quelques minutes, refermée par le job lui-même
> (F2) — **n'existe pas**. Le job **ne referme rien**. La fenêtre court **de la création de la
> release jusqu'au moment où le décideur tape lui-même la commande de rattrapage**.
>
> **Décision du 2026-08-30 : (γ) — re-cadrer la garde d'abord.** La séquence des § 3-4 reste
> **écrite et exécutable**, elle **n'est pas exécutée** : aucun tag, aucune release, aucun
> `workflow_dispatch` sur `IakaCockpit`. **CA-5 n'est pas prouvé par ce lot.**
>
> ## ⚠️ CE DOCUMENT A ÉTÉ CORRIGÉ — il affirmait un MÉCANISME que ses traces n'établissent pas
>
> Version du 2026-08-29 : *« `make_latest=false` est un NO-OP… il n'y a pas de repli du tout »*,
> donné comme **mesuré**, sur une table de **neuf** gestes. **Un seul de ces gestes a une trace**
> (le run `33277643229`), et **cette mesure ne discrimine rien** : la release voleuse était, au
> moment où on l'a prise, **aussi la plus récente par `created_at`**. Ce qui est vrai et le reste :
> **la branche `--latest=false` ne rend pas le `latest` au plus haut semver**. Ce qui est
> rétrogradé au rang de **déduction déclarée** : le **pourquoi**. Détail et contrefactuel à coût
> nul au § 1.

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

> ⚠️ **Ce qui suit n'est PAS un journal.** Corrigé au gate du 2026-08-30 : la table qui figurait
> ici donnait **neuf** gestes avec un « avant » et un « après », comme s'ils avaient tous été
> relevés. **Un seul l'a été.** Les autres étaient une **reconstruction de mémoire** — et elle ne
> chaînait même pas (une ligne ouvrait sur un état que la précédente venait de quitter, une autre
> appelait `v0.9.0` « le `created_at` le plus récent » quand la table de topologie ci-dessus dit
> `v0.2.0`). La table est donc scindée en deux, et la seconde moitié n'appuie plus aucune
> conclusion.

**GESTE TRACÉ — un seul, et c'est le pivot du lot**

| # | Geste | Trace | `releases/latest` observé **après** |
|---|---|---|---|
| **c** | job `latest`, `TAG=v0.2.0` → `gh release edit v0.2.0 --latest=false` | **run `33277643229`**, verbatim ci-dessous, job **rouge** | **`v0.2.0`** — alors que le plus haut semver est `v0.10.0`. **Le `latest` n'est pas rendu.** |

**GESTES SANS TRACE — ni run, ni log. Écrits pour mémoire, ils ne prouvent RIEN**

| # | Geste, tel que joué au clavier le 2026-08-29 | Statut |
|---|---|---|
| a | `gh release edit v0.10.0 --latest` — état de référence | **non tracé** |
| a′ | `git push origin v0.2.0` — le tag seul | **non tracé** |
| b | `gh release create v0.2.0` — **sans** `--latest` : le vol | **non tracé** ; l'état d'**après** l'est, lui, par le log de (c) |
| d | re-mesure 90 s plus tard *(hypothèse « propagation »)* | **non tracé** |
| e | `gh release edit v0.10.0 --latest` — le rattrapage | **non tracé** |
| f | `gh release edit v0.10.0 --latest=false` *(`created_at` le plus **ancien**)* | **non tracé** — et c'est le geste **discriminant** ; à rejouer, cf. § contrefactuel |
| g | `PATCH /releases/379113276 -f make_latest=false` *(REST brut)* | **non tracé** |
| h | `gh release edit v0.9.0 --latest` puis `--latest=false` | **non tracé**, et **incohérent** avec la topologie ci-dessus |
| i | `gh release delete v0.2.0` | **non tracé** ; son effet est confondu avec celui de (e) |

**ÉTAT DU BANC RE-MESURÉ LE 2026-08-30** *(lecture seule, `gh api`)* — c'est **ça**, le fait :
deux releases seulement, `v0.10.0` (`created_at 2026-08-29T22:01:35Z`, id `379113276`) et `v0.9.0`
(`22:10:00Z`, id `379113280`) ; `releases/latest` rend **`v0.10.0`** ; le tag `v0.2.0` subsiste
**sans** release. Les `created_at` sont bien ceux des **dates de commit** forgées, re-vérifiés un
à un ce jour.

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

### Ce que ça prouve — et ce que ça ne prouve que par déduction

> **Relu au gate le 2026-08-30.** La distinction ci-dessous n'existait pas : tout était donné
> comme mesuré. Elle est la correction principale de ce document.

**A. ÉTABLI PAR LA TRACE** (run `33277643229`, verbatim ci-dessus) :

1. **Le tri du job est juste sur le cas de bord** : `plus haut semver: v0.10.0`, avec `v0.9.0`
   présent et `archive/feat/x` filtré. `sort -V` ne se laisse pas prendre à `0.9` > `0.10`.
2. **Le job a posé `--latest=false` sur `v0.2.0`**, et **juste après**, `GET /releases/latest`
   rendait **`v0.2.0`** — pas `v0.10.0`, le plus haut semver. Donc : **la branche `--latest=false`
   ne rend pas le `latest` au plus haut semver.** C'est la conclusion centrale, et elle tient.
3. **Le job se mesure lui-même et rougit** : ligne `VERIFICATION`, deux `::error::`, `exit 1`,
   commande de rattrapage imprimée. Le filet fonctionne.
4. **Le transport de preuve tient** (CA-5.8) : le banc a téléchargé `release.yml` d'
   `IakaCockpit@main` et comparé le bloc `latest:` à sa copie — `sha256` identiques des deux côtés,
   `3547f66746fae90721879ad0115cb84764ff5a2da5c07fd251b75c2634457173`, ligne
   `TRANSPORT DE PREUVE : le banc execute le meme bloc que IakaCockpit@main.` Ce n'est pas un texte
   ressemblant qui a tourné : c'est **celui-là**. Contrefactuel joué et révoqué (runs
   `33278026605` rouge nommé, `33278079380` vert).

**B. ÉTABLI PAR CONJONCTION trace + lecture de source** — plus faible, mais dit comme tel :

5. **Le VOL est réel.** Le log montre l'**état d'après** (`latest = v0.2.0` alors que `v0.10.0`
   est le plus haut) ; l'état d'**avant** la création n'a pas de trace propre. Ce qui comble
   l'écart est une **lecture**, pas une mesure : `createRelease` de `tauri-action@84b9d35b` et
   `gh release create` (`cli/pkg/cmd/release/create/create.go:462`) **omettent** `make_latest`,
   donc partent au défaut `true`. Conclusion **solide**, mais pas de même nature que A.

**C. DÉDUIT, PAS MESURÉ — rétrogradé le 2026-08-30** :

6. **« `make_latest=false` est un NO-OP », « il n'y a aucun repli ».** C'était écrit ici, et dans
   quatre autres emplacements, comme un **fait mesuré**. Ça ne l'est pas. La **seule** mesure
   tracée est le point 2 — et **elle ne discrimine pas** : au moment où elle a été prise, la
   release voleuse `v0.2.0` était **aussi la plus récente par `created_at`** (`22:20:00Z`, contre
   `22:10:00Z` et `22:01:35Z`). « Le drapeau ne se retire pas » et « le drapeau se retire, et
   GitHub replie par date » prédisent **exactement la même observation**. Les gestes qui
   trancheraient — sur le `created_at` le plus **ancien**, et le `PATCH` REST brut — **n'ont ni
   run ni log**.
7. **« `gh release edit <PLUS_HAUT> --latest` répare, en moins de 3 s ».** Pas de trace non plus.
   Le banc porte aujourd'hui `latest = v0.10.0` (**re-mesuré le 2026-08-30**), mais la
   **suppression** de `v0.2.0` suffit à l'expliquer : les deux gestes sont confondus. Le chiffre
   « < 3 s » est **retiré** de tous les emplacements canoniques.

### 🔬 Le contrefactuel qui trancherait — à coût nul, et il appartient au décideur

```bash
gh release edit v0.10.0 --latest=false --repo iakasju/latest-contrefactuel
gh api repos/iakasju/latest-contrefactuel/releases/latest --jq .tag_name
```

Le banc ne porte plus que **deux** releases (mesure du 2026-08-30) : `v0.10.0` — plus haut semver,
`created_at` le plus **ancien**, porteuse du `latest` — et `v0.9.0`, plus **récente** par date.
Les deux hypothèses divergent donc enfin :

| Hypothèse | Sortie attendue |
|---|---|
| **Le drapeau ne se retire pas** (« NO-OP ») | **`v0.10.0`** |
| **Le drapeau se retire, GitHub replie par date** | **`v0.9.0`** |

C'est un **acte de release**, donc **refusé aux agents** : il n'a pas été joué. **Condition de
levée de la réserve** : ce geste joué par le décideur, et sa sortie citée ici. Jusque-là, la prose
des cinq emplacements canoniques est écrite pour rester **vraie dans les deux cas**.

### Ce que ça ne prouve pas, quoi qu'il arrive

- **Rien sur `IakaCockpit` lui-même.** Autres droits, autre topologie, autre acteur créant la
  release (`tauri-action` et non `gh release create`). Le banc établit le comportement de **l'API**
  sur un dépôt du même compte, pas celui du dépôt réel.
- **Le `gh release create` du banc est un substitut**, pas l'acteur. Il omet `make_latest` de la
  même façon, mais ce n'est pas `createRelease` de `tauri-action`.
- **Rien sur le badge « Latest » de l'interface web**, non mesuré. Tout ce qui est écrit ici porte
  sur `GET /repos/.../releases/latest`, la seule vue qu'un script consomme.

---

## 2. Ce qui change dans les attendus de CA-5

| Critère | Attendu au cadrage | Attendu **après la répétition** |
|---|---|---|
| **CA-5.1** — ligne `DECISION : … --latest=false` | présente | **inchangé** — elle sera là |
| **CA-5.2** — job `latest` **vert**, `VERIFICATION … (attendu : v0.32.2)` | vert | **le job sera ROUGE**, et sa ligne dira `latest effectif = contrefactuel-ca5-… (attendu : v0.32.2)` |
| **CA-5.3** — `latest` identique en 4.1 / 4.6 / 4.7 | identique **sans intervention** | identique **seulement après le rattrapage manuel** |
| **CA-5.4** — vol observé puis réparé | réparé **par le job** | vol observé ✅ ; réparation **attendue du décideur**, pas du job — et **elle-même à mesurer**, cf. § 1 C-7 |
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
SHA=$(git rev-list -n1 v0.32.2)          # eceb49847b7f025e8a32484d87f18c836f1c1c22
git tag contrefactuel-ca5-2026-08-29 "$SHA"
git push github contrefactuel-ca5-2026-08-29
```

> 🪤 **Corrigé le 2026-08-30 — la ligne d'origine était inexécutable telle quelle.** Elle lisait
> `SHA=$(gh api repos/iakasju/IakaCockpit/git/ref/tags/v0.32.2 --jq .object.sha)`. Or `v0.32.2`
> est un tag **annoté** : `.object.type` vaut **`tag`**, et `.object.sha` rend **`3c354604…`**,
> l'objet *tag*, **pas** le commit. Taguer ce SHA aurait posé un tag sur un objet tag. Le commit
> est **`eceb4984…`** — vérifié des deux côtés le 2026-08-30, par
> `git rev-list -n1 v0.32.2` en local **et** par déréférencement
> `gh api repos/iakasju/IakaCockpit/git/tags/3c354604…  --jq .object.sha` côté API. Si l'on tient
> à passer par l'API : `gh api …/git/tags/$(gh api …/git/ref/tags/v0.32.2 --jq .object.sha)
> --jq .object.sha`. La forme locale d'une ligne est plus sûre.

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

C'est la commande que le workflow imprime lui-même. ⚠️ **Qu'elle fonctionne n'est PAS tracé** —
aucun run, aucun log ; le « < 3 s » qui figurait ici est retiré (gate du 2026-08-30). C'est la
voie la plus plausible et le workflow la dicte, mais **le jour J elle se mesure**, elle ne se
suppose pas : relever l'horodatage avant/après et coller la sortie de la ligne suivante.

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
| **Le `latest` est volé** *(certain, pas hypothétique)* | sonde 3.4, ou ligne `VERIFICATION` du log | `gh release edit v0.32.2 --latest --repo iakasju/IakaCockpit` | **non tracé — à mesurer le jour J** |
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

## 5. La question posée au décideur — **TRANCHÉE : (γ)**

> **Décision du 2026-08-30 : (γ).** Re-cadrer la garde d'abord. **Aucun geste de release sur
> `IakaCockpit`**, et **CA-5 ne sera pas prouvé par ce lot**. La section reste écrite pour dire
> **ce qui a été mis en balance**, pas pour rouvrir la question.

La répétition a déplacé le curseur. Le risque **reste borné** — un seul geste le referme — mais
**il ne se referme plus tout seul** : la fenêtre dure tant que personne ne tape la commande. Et
**ce que V-C prouverait a rétréci**.

| Option | Ce qu'on gagne | Ce qu'on paie |
|---|---|---|
| **(α)** Lancer V-C tel quel, avec le rattrapage prêt en 3.5 | la preuve sur le dépôt réel, avec le vrai acteur | une fenêtre de vol **surveillée**, refermée à la main |
| **(β)** Clore CA-5 en **« partiellement prouvé »**, déclaré et daté | zéro risque ; l'espéré est **écrit**, pas subi | la transposition n'est pas prouvée |
| **(γ)** ✅ **RETENUE** — traiter d'abord le défaut découvert et re-cadrer la garde avant de la prouver | on cesse de prouver une garde qui ne garde pas | un lot de plus avant CA-5 |

> 🪤 **Et V-C ne trancherait rien de plus que le banc.** Le tag contrefactuel de 3.2 pointerait le
> commit de `v0.32.2` : la release neuve aurait donc le **même `created_at`** que `v0.32.2`. Sous
> l'hypothèse « repli par date », le repli serait une **égalité** — comportement **indéfini**, donc
> non concluant. La cible de V-C est **mal choisie pour discriminer** ; le contrefactuel à coût nul
> du § 1 le fait mieux, et sans rien risquer. *(Relevé du gate le 2026-08-30, consigné.)*

---

## 6. Les deux réserves, à porter quoi qu'il arrive

1. **La garde répare le vol, elle ne l'empêche pas** — et la répétition va plus loin : **elle ne le
   répare pas non plus**. `tauri-action` crée la release (donc vole) **avant** que le job `latest`
   démarre (`src/index.ts` : `buildProject` → `getOrCreateRelease` → `uploadReleaseAssets`), et la
   branche `--latest=false` **ne rend pas** le `latest` au plus haut semver (mesuré, § 1 A-2). Ce
   qui subsiste du job : **un détecteur qui rougit et dicte le geste**. C'est utile, ce n'est pas
   une garde.
2. **Ce que fait GitHub après `make_latest=false` n'est pas documenté** — c'était l'inconnue F4.
   **Elle N'EST PAS levée.** Ce document a écrit, du 2026-08-29 au 2026-08-30, « elle est désormais
   mesurée : rien » ; c'était une **déduction déguisée en mesure**, et c'est le motif principal du
   FAIL du gate. Ce qu'on sait : **le `latest` n'est pas revenu au plus haut semver**. Ce qu'on ne
   sait pas : **pourquoi**. Le geste qui trancherait est écrit au § 1, il coûte zéro, et il
   appartient au décideur. Ce qui **tient** en attendant : le job **mesure son propre résultat**
   (ligne `VERIFICATION`) et **rougit en dictant le rattrapage** — **rien de tout cela n'est
   garanti pour une autre version de l'API**, et seule la ligne `VERIFICATION` le dira.
