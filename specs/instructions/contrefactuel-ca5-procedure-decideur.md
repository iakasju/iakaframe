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
> **sur la topologie du banc, la branche `--latest=false` n'a pas rendu le `latest` au plus haut
> semver** — donc **on ne peut pas compter dessus**. Ce qui est rétrogradé au rang de **déduction
> déclarée** : le **pourquoi**. Détail et contrefactuel à coût nul au § 1.
>
> ## ⚠️ CORRIGÉ UNE SECONDE FOIS LE 2026-08-30 — la PORTÉE, pas le mécanisme
>
> Le premier passage a borné le **mécanisme** et a laissé la **portée** intacte : la conclusion du
> banc restait écrite comme une **propriété générale de la branche**, puis comme un **verdict
> opérationnel** (« inutile comme réparation », « un détecteur, pas une garde »). **Elle ne l'est
> pas**, et ce qui la falsifie est **dans ce lot même** — **F4** de
> `contrefactuel-du-vol-de-latest.md:171-173`. Voir l'encart **« Ce que la mesure ne permet PAS de
> dire »** au § 1.
>
> ## ✅ TROISIÈME PASSAGE, 2026-08-30 — **le contrefactuel à coût nul A ÉTÉ JOUÉ par le décideur**
>
> Le geste que ce document réclamait **a eu lieu**, et sa sortie est **`v0.10.0`, inchangé**.
> Croisée avec le run `33277643229`, elle **réfute huit des neuf règles de repli énumérées** ;
> **seul le NO-OP survit**. Conséquence immédiate : l'encart **⛔** ci-dessous faisait reposer tout
> son argument sur *« sous repli par `created_at`, le job réparerait sur `IakaCockpit` »* —
> **cette hypothèse est réfutée**, et sous la seule règle survivante le job **ne répare pas**.
> Détail, table et résidu : § 1, encart **« LE CONTREFACTUEL A ÉTÉ JOUÉ »**.
>
> ⚠️ **La limite, et elle se tient.** La phrase juste n'est **pas** « GitHub ne replie jamais ».
> C'est : **« parmi les règles de repli énumérées, huit sont réfutées par mesure ; seule le NO-OP
> survit — et rien n'exclut une règle non énumérée. »** Toute formulation qui laisse tomber la
> liste ou le résidu **dépasse la preuve**, pour la quatrième fois.
>
> **Registre.** Les énoncés des trois dépôts qui affirment quoi que ce soit sur ce repli sont
> désormais **énumérés une fois**, en `chemin:ligne`, dans
> `contrefactuel-du-vol-de-latest.md` § « Registre des énoncés sur le repli du `latest` » — avec
> une commande de balayage reproductible et un **vérificateur qui rougit** quand ils dérivent.

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
| d | re-mesure 90 s plus tard *(hypothèse « propagation »)* | **non tracé** — mais l'hypothèse qu'il visait est **close** depuis le 2026-08-30 : la sortie du contrefactuel du décideur a été **re-lue bien après** le geste et n'a pas bougé (§ 1, règle **9**) |
| e | `gh release edit v0.10.0 --latest` — le rattrapage | **non tracé** |
| f | `gh release edit v0.10.0 --latest=false` *(`created_at` le plus **ancien**)* | ✅ **REJOUÉ PAR LE DÉCIDEUR le 2026-08-30**, et c'est le geste **discriminant** : sortie `v0.10.0`, inchangée. Détail, table des règles et résidu à l'encart « LE CONTREFACTUEL A ÉTÉ JOUÉ » |
| g | `PATCH /releases/379113276 -f make_latest=false` *(REST brut)* | ✅ **JOUÉ LE 2026-09-01** *(M2, lot L44, banc privé)* : **inerte**, comme `gh`. La mention « non tracé » valait au 2026-08-30 — **datée, pas effacée** |
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
   rendait **`v0.2.0`** — pas `v0.10.0`, le plus haut semver. Donc, **et borné à la topologie de ce
   banc, où la release voleuse était AUSSI la plus récente par `created_at`** : **la branche
   `--latest=false` n'a pas rendu le `latest` au plus haut semver.** C'est la conclusion centrale,
   elle tient, et elle **suffit** à savoir qu'**on ne peut pas compter dessus**. Ce qu'elle n'est
   **pas** — une propriété générale de la branche — est écrit dans l'encart qui suit le point 7.
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

6. **« `make_latest=false` est un NO-OP », « il n'y a aucun repli ».** C'était écrit comme un
   **fait mesuré** dans **six fichiers — huit occurrences**, celui-ci compris : les deux `CLAUDE.md`
   (**deux fois chacun** : bloc `latest` **et** entrée de backlog), les deux `release.yml`, ce
   document, et `installer-depuis-rien.md`.
   🪤 **Reproduction du compte — CORRIGÉE le 2026-08-30 (troisième passage du gate).** Elle citait
   `IakaCockpit@895e74f` et `iakaFrameGUI@2b09615` : **ces commits-là ne rendent que six
   occurrences**, l'entrée de backlog n'y étant pas encore écrite. Les commits qui reproduisent
   bien **huit occurrences sur six fichiers** sont **`IakaCockpit@58f4e6f`**,
   **`iakaFrameGUI@589c4d6`** et **`iakaframe@26d096d`** — vérifiés un à un par
   `git grep -c "NO-OP" <commit> -- '*.md' '*.yml'`, qui rend `release.yml:1` + `CLAUDE.md:2` de
   chaque côté de la paire, et `contrefactuel-ca5-procedure-decideur.md:1` +
   `installer-depuis-rien.md:1` pour `iakaframe`.
   **La rétrogradation reste juste pour ce qui était écrit alors** : la **seule** mesure
   tracée était le point 2 — et **elle ne discriminait pas**, la release voleuse `v0.2.0` étant
   **aussi la plus récente par `created_at`** (`22:20:00Z`, contre `22:10:00Z` et `22:01:35Z`).
   « Le drapeau ne se retire pas » et « le drapeau se retire, et GitHub replie par date »
   prédisaient **exactement la même observation**.
   ✅ **CE QUI A CHANGÉ LE MÊME JOUR** : le geste discriminant — `--latest=false` sur le
   `created_at` le plus **ancien** — **a été joué par le décideur**. Croisé avec le run, il
   **réfute huit des neuf règles de repli énumérées** et **laisse le NO-OP seul debout** (encart
   « LE CONTREFACTUEL A ÉTÉ JOUÉ »). Le NO-OP cesse d'être une **déduction** ; il devient **la
   seule règle survivante d'une énumération** — ce qui n'est **pas** la même chose qu'un fait
   mesuré sans reste, et **le résidu est écrit**. Le `PATCH` REST **brut**, lui, n'en avait alors
   **aucune trace**. ⚠️ **DEPUIS, IL EN A** — joué le **2026-09-01** *(M2, lot L44)*, il s'est
   révélé **inerte** comme `gh` ; et **M3b**, même chemin avec `legacy`, **a bougé** le pointeur.
   La phrase qui précède est **datée au 2026-08-30, pas effacée**.
7. **« `gh release edit <PLUS_HAUT> --latest` répare, en moins de 3 s ».** Pas de trace non plus,
   **et le contrefactuel du 2026-08-30 n'y change rien**. Le banc porte aujourd'hui
   `latest = v0.10.0` (**re-mesuré le 2026-08-30**), mais la **suppression** de `v0.2.0` suffit à
   l'expliquer : les deux gestes sont confondus. Le chiffre « < 3 s » est **retiré** de tous les
   emplacements canoniques.
   ⚠️ **Et il ne se déduit pas de M2** : M2 ne mesure que l'écriture **`false`**. Que l'écriture
   **`true`** — le rattrapage — produise, elle, un effet **reste sans trace**, et le NO-OP observé
   sur `false` **ne se transpose pas d'office** à `true`, ni dans un sens ni dans l'autre. À
   mesurer le jour où le geste est joué, pas à supposer.
   ✅ **LE JOUR EST VENU — 2026-09-01, M1, lot L44.** `gh release edit v0.9.0 --latest`, sur le banc
   privé, a fait passer `releases/latest` de `v0.10.0` à `v0.9.0` : **l'écriture `true` AGIT**, et
   elle **prime sur tout calcul** puisqu'elle a posé le pointeur sur le **plus bas** semver. Les
   deux alinéas ci-dessus sont **datés au 2026-08-30, pas effacés**. Ce qui **reste** sans mesure :
   le **chiffre** « < 3 s », et le rejeu **sur les dépôts de production**.

### ⛔ Ce que la mesure ne permettait PAS de dire — bornage du 2026-08-30, **puis levé le même jour**

> 🪤 **CET ENCART EST DATÉ, PAS EFFACÉ — et son argument est RÉFUTÉ.** Écrit au second passage du
> gate, il faisait reposer tout son raisonnement sur la règle *« GitHub recalcule par `created_at`,
> sans exclure la démarquée »*. **Le contrefactuel du décideur l'a réfutée** (encart suivant,
> règle **2**). Ce qu'il conserve de juste : le run **seul** ne suffisait pas, et une conclusion
> ne se transpose pas d'une topologie à l'autre sans qu'on le dise. Ce qu'il a de **faux** : sa
> conclusion opérationnelle, qui reposait sur une hypothèse aujourd'hui morte.

Le point 2 a été écrit, jusqu'au 2026-08-30, comme une **propriété de la branche** (« elle ne rend
pas le `latest` »), puis promu en **verdict opérationnel** (« inutile comme réparation », « un
détecteur, pas une garde »). **Les deux dépassaient la preuve du run seul.** Ce qui était opposé
alors : `contrefactuel-du-vol-de-latest.md:171-173` (**F4**) mesure que sur `IakaCockpit` **les
deux règles de repli plausibles désignent la même release, `v0.32.2`**.

**Le déroulé, tel qu'il était écrit — et où il casse.** Le run avait **réfuté** une variante du
repli — « GitHub recalcule en **excluant** la release démarquée » : elle prédisait `v0.9.0`, on a
observé `v0.2.0`. Restaient « le drapeau ne se retire pas » (NO-OP) **et** « GitHub recalcule par
`created_at`, **sans** exclure la démarquée » — indiscernables **sur le banc**, où la voleuse était
aussi la plus récente par date. Sur `IakaCockpit` elles divergeaient : la voleuse y serait une
release **créée sur un tag ancien** — le risque nommé dans les deux `CLAUDE.md`, *« 25 tags sur 29
ne portent aucune release »* — donc au `created_at` le plus **vieux**, puisque **F4** mesure que le
`created_at` suit la date du **commit** du tag et non la publication (`v0.32.1` : `created_at
2026-08-10` pour un `published_at 2026-08-28`). Sous « repli par date », le recalcul aurait désigné
**`v0.32.2`** — **aussi le plus haut semver** —, la ligne `VERIFICATION` aurait été **verte**, et
le job aurait **réparé**. 🛑 **Cette branche du raisonnement est morte** : la règle qui la portait
est réfutée par la mesure du décideur.

| | Formule — **révisée le 2026-08-30, après le contrefactuel** |
|---|---|
| **Ce que la mesure établit** | *Sur la topologie du banc, la branche n'a pas rendu le `latest` au plus haut semver.* **Et, par croisement avec le contrefactuel : parmi neuf règles de repli énumérées, huit sont réfutées ; seul le NO-OP survit — et le NO-OP ne dépend d'aucune topologie.** |
| **Ce qui s'en déduit sans risque** | **On ne peut pas compter dessus.** Vrai sous la règle survivante comme sous toute règle non énumérée qui expliquerait les deux mesures. |
| **Ce qui s'en déduit désormais, DANS LES LIMITES ÉNUMÉRÉES** | *Sous la seule règle survivante, la branche **ne répare pas** ; le job **détecte, rougit et dicte le geste**.* |
| **Ce qui ne s'en déduit TOUJOURS PAS** | « GitHub ne replie jamais » (une règle **non énumérée** reste possible) · quoi que ce soit sur **`IakaCockpit`** (autre dépôt, autre acteur, autres droits) · quoi que ce soit sur le **badge web** ou sur une **autre version de l'API**. |

### 🔬 LE CONTREFACTUEL A ÉTÉ JOUÉ — 2026-08-30, par le décideur

> ⚠️ **AVERTISSEMENTS — ILS PRÉCÈDENT LES COMMANDES, ET C'EST DÉLIBÉRÉ.** *(Au passage précédent
> ils étaient placés **après** le bloc `bash` : un lecteur pouvait jouer le geste avant de lire ce
> qu'il vaut. Relevé du gate, corrigé ici.)*
>
> 1. **Ce geste ne tranchait, SEUL, que dans UN sens.** Une sortie `v0.9.0` aurait été concluante à
>    elle seule ; une sortie `v0.10.0` — celle qui a été observée — **ne conclut rien par
>    elle-même**. Ce qui élimine, c'est le **croisement** avec le run `33277643229`. **Aucune
>    conclusion ne se lit sur une seule des deux mesures.**
> 2. **La première ligne est un ACTE DE RELEASE** (`gh release edit`), **refusé aux agents**. Elle
>    a été jouée **par le décideur**. La seconde (`gh api … --jq`) est une **lecture**, sans effet,
>    rejouable par quiconque — et c'est ce qui permet de la re-mesurer.
> 3. **Il n'y a rien à restaurer** : le drapeau n'a pas bougé, et c'est **précisément le constat**.

```bash
gh release edit v0.10.0 --latest=false --repo iakasju/latest-contrefactuel
gh api  repos/iakasju/latest-contrefactuel/releases/latest --jq .tag_name
```

**Sortie observée : `v0.10.0` — INCHANGÉ.**

**L'état du banc, re-mesuré en LECTURE SEULE le 2026-08-30** (`gh api …/releases`) — six valeurs
relevées une à une, aucune déduite :

| Release | `id` | `created_at` | `published_at` | rang semver | `draft` / `prerelease` |
|---|---|---|---|---|---|
| `v0.10.0` | `379113276` | `2026-08-29T22:01:35Z` | `2026-08-29T22:03:11Z` | le plus **haut** | `false` / `false` |
| `v0.9.0` | `379113280` | `2026-08-29T22:10:00Z` | `2026-08-29T22:03:13Z` | inférieur | `false` / `false` |

**`v0.9.0` est plus récente sur les DEUX dates, et porte le plus grand `id`.** Les deux sont
`draft: false` et `prerelease: false`, donc **toutes deux éligibles** au `latest` selon la doc REST.
Le tag `v0.2.0` **subsiste sans release** ; son commit `368395f7…` porte la date
`2026-08-29T22:20:00Z` — **mesurée ce jour sur le tag survivant**, ce qui fixe le `created_at`
qu'avait sa release au moment du run.

#### La table qui élimine — chaque règle confrontée aux DEUX mesures

- **M1** = run `33277643229` : `--latest=false` posé sur `v0.2.0` → observé **`v0.2.0`**. L'`edit`
  réussit (exit 0, URL imprimée à `22:04:24.85Z`) ; la lecture est faite à `22:04:25.50Z`, soit
  **0,65 s plus tard**.
- **M2** = le geste ci-dessus : `--latest=false` posé sur `v0.10.0` → observé **`v0.10.0`**,
  **re-lu bien plus tard** et toujours `v0.10.0`.

| # | Règle candidate | M1 prédit *(observé `v0.2.0`)* | M2 prédit *(observé `v0.10.0`)* | Verdict |
|---|---|---|---|---|
| **1** | **NO-OP** — le drapeau ne se retire pas | `v0.2.0` ✅ | `v0.10.0` ✅ | **SURVIT** |
| 2 | repli par `created_at`, **sans** exclure la démarquée | `v0.2.0` ✅ | **`v0.9.0`** ❌ | **RÉFUTÉE** (M2) |
| 3 | repli par `created_at`, **en excluant** la démarquée | **`v0.9.0`** ❌ | **`v0.9.0`** ❌ | **RÉFUTÉE** (M1 **et** M2) |
| 4 | repli par `published_at`, **sans** exclure | `v0.2.0` ✅ ⁽**⁾ | **`v0.9.0`** ❌ | **RÉFUTÉE** (M2) |
| 5 | repli par `published_at`, **en excluant** | **`v0.9.0`** ❌ | **`v0.9.0`** ❌ | **RÉFUTÉE** (M1 **et** M2) |
| 6 | repli par **semver** *(avec ou sans exclusion)* | **`v0.10.0`** ❌ | `v0.10.0` ✅ / `v0.9.0` ❌ | **RÉFUTÉE** (M1) |
| 7 | repli par **plus grand `id`** | `v0.2.0` ✅ ⁽*⁾ | **`v0.9.0`** ❌ | **RÉFUTÉE** (M2) |
| 8 | repli par **ordre lexicographique** du tag | **`v0.9.0`** ❌ | **`v0.9.0`** ❌ | **RÉFUTÉE** (M1 **et** M2) |
| 9 | **repli différé** — le recalcul par date arrive après la lecture | `v0.2.0` ✅ | **`v0.9.0`** à terme ❌ | **RÉFUTÉE** (re-lecture tardive) |

⁽*⁾ Pour M1, la règle 7 prédit `v0.2.0` **sous l'hypothèse non mesurée** que les `id` croissent
avec la création : l'`id` de `v0.2.0` n'a jamais été relevé et sa release est supprimée. **Sans
importance pour le verdict** : M2 la réfute à elle seule.

⁽**⁾ **Même lacune, relevée le 2026-08-30 (cinquième passage du gate) : elle manquait à la règle
4 alors qu'elle était portée par la 7.** Pour M1, la règle 4 prédit `v0.2.0` **sous une hypothèse
non mesurée** : le `published_at` de `v0.2.0` **n'a jamais été relevé**, et sa release est
supprimée (`404`) — la seule date qu'on ait d'elle est un `created_at` **reconstitué** depuis le
commit du tag survivant (`22:20:00Z`). Cette case est donc une **prédiction sous hypothèse**, pas
une mesure, dans un tableau dont c'est tout le régime. **Sans importance pour le verdict** : M2 la
réfute à elle seule. *(La règle 5 n'en a pas besoin : en excluant la démarquée, elle ne compare que
`v0.10.0` et `v0.9.0`, dont les deux `published_at` sont relevés.)*

**Pourquoi la règle 9 tombe, et pourquoi elle méritait d'être énumérée.** M1 lisait
`releases/latest` **0,65 s** après l'`edit` : une consistance différée suffisait à expliquer son
observation — c'est l'hypothèse « propagation », restée sans trace depuis le 2026-08-29 (geste
**d** de la table sans trace). **M2 la ferme** : sa sortie a été **re-lue en lecture seule bien
après** le geste, et rend encore `v0.10.0`. Un repli différé par date aurait eu tout le temps de
désigner `v0.9.0`.

#### Ce qui se conclut — et la limite, écrite avec

Parmi les **neuf** règles énumérées ci-dessus, **huit sont réfutées par mesure ; seul le NO-OP
survit.** Et cette règle-là, **contrairement à toutes les autres, ne dépend d'aucune topologie** :
la conclusion cesse donc d'être bornée à l'**agencement** du banc. Elle reste bornée **au banc**
(ce dépôt, cet acteur, ces droits, cette version de l'API) et **à l'énumération**.

> 🛑 **La phrase juste n'est PAS « GitHub ne replie jamais ».** C'est : **« parmi les règles de
> repli énumérées, huit sont réfutées par mesure ; seule le NO-OP survit. »** Écrire moins que la
> liste, ou omettre le résidu ci-dessous, c'est refaire une quatrième fois la faute que ce lot a
> commise trois fois — dans l'autre sens.

#### LE RÉSIDU — ce que rien n'exclut

1. **Une règle non énumérée reste possible.** Toute règle prédisant `v0.2.0` en M1 **et**
   `v0.10.0` en M2 serait compatible avec les deux mesures. On n'en connaît pas ; **on n'a pas
   montré qu'il n'en existe pas.** Les neuf éprouvées sont celles de la table, pas « toutes ».
2. **Le NO-OP survivant est OBSERVATIONNEL, pas mécanique.** Il dit que `GET /releases/latest` ne
   bouge pas. Il ne dit **pas où** le no-op se produit — client `gh`, écriture côté API, ou
   lecture. **F3** a *lu* que `gh` envoie bien `make_latest: "false"` (`edit.go`) ; le `PATCH` REST
   **brut** n'en avait alors **aucune trace** (geste **g**). Et `make_latest` **n'est pas
   relisible** : aucune mesure ne distingue « écriture acceptée sans effet » de « écriture ignorée ».
   ✅ **REFERMÉ LE 2026-09-01 (M2 + M3b, lot L44) — daté, pas effacé.** Le geste **g** a été joué.
   M2 et M3b portent sur la **même** release, le **même** endpoint et le **même** champ : seule la
   **valeur** les sépare, et M3b, lui, **a bougé** le pointeur. Le no-op ne siège donc **ni** dans
   le client, **ni** dans le transport, **ni** dans la lecture, mais dans la **sémantique de la
   valeur `false`** côté API. ⚠️ Une **échappatoire nommée** subsiste, et aucune mesure ne la
   tranche : si `false` installait un état « pas latest » dont la lecture retomberait sur un calcul
   différent de celui de `legacy`, l'observation tiendrait aussi.
3. **Rien sur `IakaCockpit`** — autre dépôt, autre acteur (`tauri-action`, pas `gh release
   create`), autres droits. **Inchangé.**
4. **Rien sur le badge « Latest » de l'interface web** : jamais mesuré. Tout ce qui précède porte
   sur `GET /repos/.../releases/latest`.
5. **Rien pour une autre version de l'API.** Seule la ligne `VERIFICATION` du job le dira.

#### Ce que ça retourne dans ce document

L'encart **⛔** ci-dessus faisait reposer **tout** son argument sur la règle **2**. Elle est
**réfutée**. **Sous la seule règle survivante, le job ne répare pas** — il **détecte, rougit et
dicte le geste**. Ce qui **ne change pas** : « on ne peut pas compter dessus » reste vrai, et l'est
désormais pour une raison **plus forte**, pas plus faible.

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

> 🛑 **CE TABLEAU EST CONDITIONNEL — V-C N'A PAS EU LIEU ET N'AURA PAS LIEU DANS CE LOT.** La
> décision **(γ)** du § 5 est ferme : aucun tag, aucune release, aucun `workflow_dispatch` sur
> `IakaCockpit`. Ce tableau se lit donc **« ce que CA-5 exigerait SI le décideur rouvrait V-C »**,
> jamais « ce qui va se passer ». *(Corrigé le 2026-08-30, troisième passage : il était rédigé au
> **futur de l'indicatif** — « le job **sera** rouge », « vol observé ✅ » — c'est-à-dire qu'il
> annonçait comme acquis le résultat d'une expérience **non exécutée**, contre le § 5.)*

| Critère | Attendu au cadrage | Attendu **si V-C était rejouée**, après la répétition |
|---|---|---|
| **CA-5.1** — ligne `DECISION : … --latest=false` | présente | **inchangé** — elle serait là |
| **CA-5.2** — job `latest` **vert**, `VERIFICATION … (attendu : v0.32.2)` | vert | **le job serait ROUGE**, et sa ligne dirait `latest effectif = contrefactuel-ca5-… (attendu : v0.32.2)` — **prédiction, non mesurée** |
| **CA-5.3** — `latest` identique en 4.1 / 4.6 / 4.7 | identique **sans intervention** | identique **seulement après le rattrapage manuel** |
| **CA-5.4** — vol observé puis réparé | réparé **par le job** | vol **attendu** (non observé sur ce dépôt) ; réparation **attendue du décideur**, pas du job — et **elle-même à mesurer**, cf. § 1 C-7 |
| **CA-5.5 / 5.6 / 5.7** — rien d'abîmé | inchangé | **inchangé** |

Autrement dit : **V-C ne pourrait plus valider CA-5 tel qu'il est écrit.** Elle validerait autre
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

**Attendu — PRÉDICTION, pas mesure ; et cette séquence N'A PAS ÉTÉ EXÉCUTÉE (§ 5, décision γ)** :
`v0.32.2`, puis **`contrefactuel-ca5-2026-08-29`** dès que `tauri-action` crée la release, et
**ça n'en bougerait plus** — le job passerait, dirait `--latest=false`, et **le `latest`
resterait volé**. *(Prédiction faite **sous la seule règle survivante** de l'énumération du § 1, le
NO-OP ; une règle **non énumérée** la rendrait fausse. Corrigé le 2026-08-30, troisième passage :
c'était écrit au futur de l'indicatif, comme si l'expérience allait avoir lieu.)*

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

> 🪤 **Et V-C ne trancherait rien de plus que le banc — l'argument a changé, la conclusion non.**
> *Rédaction du 2026-08-30, second passage, **datée et réfutée*** : « le tag contrefactuel de 3.2
> pointerait le commit de `v0.32.2`, la release neuve aurait donc le même `created_at`, et sous
> l'hypothèse *repli par date* le repli serait une **égalité**, comportement indéfini ».
> **Cette hypothèse est réfutée** (§ 1, règles 2 à 5) : l'argument de l'égalité de `created_at`
> **ne tient plus**, puisque plus aucune règle survivante ne regarde les dates.
> **Ce qui reste vrai, pour une autre raison** : l'énumération des règles de repli est **déjà
> close sur le banc**, et V-C n'en éprouverait aucune de plus. Ce qu'elle ajouterait — et c'est
> **réel mais mince** — est la **transposition** : même comportement, sur le dépôt réel, avec le
> vrai acteur (`tauri-action`) et les vrais droits. Le contrefactuel à coût nul du § 1 a fait le
> travail de discrimination, **sans rien risquer**.

---

## 6. Les deux réserves, à porter quoi qu'il arrive

1. **La garde n'empêche pas le vol — et on ne peut pas compter sur elle pour le réparer.**
   Qu'elle ne l'**empêche** pas est acquis : `tauri-action` crée la release (donc vole) **avant**
   que le job `latest` démarre (`src/index.ts` : `buildProject` → `getOrCreateRelease` →
   `uploadReleaseAssets`). Pour la **réparation** : le run seul n'avait mesuré **qu'une
   topologie** — celle où la voleuse était **aussi** la plus récente par `created_at` — et **là**,
   la branche `--latest=false` n'a pas rendu le `latest` au plus haut semver (§ 1 A-2).
   ✅ **Le contrefactuel du 2026-08-30 a levé l'indétermination, dans les limites énumérées** :
   croisé avec le run, il **réfute huit des neuf règles de repli** de la table du § 1 — **dont
   celle du « repli par date » qui portait, au second passage, l'argument inverse**. **Seul le
   NO-OP survit**, et lui ne dépend d'**aucune** topologie : sous cette règle, **le job ne répare
   pas**. Ce qui tient donc, et se dit sans réserve nouvelle : le job **détecte, rougit et dicte
   le geste**, et **on ne peut pas compter sur lui pour réparer**.
   🛑 **Ce qui ne se dit toujours pas** : « GitHub ne replie jamais » — **une règle non énumérée
   reste possible** (résidu, § 1). Et *« ce n'est pas une garde »* reste hors de portée pour une
   **autre** raison, inchangée : rien de tout cela n'a été mesuré **sur `IakaCockpit`**, avec son
   acteur et ses droits. *(Bornage du 2026-08-30, second passage ; levée partielle le même jour,
   troisième passage.)*
2. **Ce que fait GitHub après `make_latest=false` n'est pas documenté** — c'était l'inconnue F4.
   **Elle est levée PAR ÉLIMINATION, pas par la doc, et pas sans reste.** Ce document a écrit, du
   2026-08-29 au 2026-08-30, « elle est désormais mesurée : rien » ; c'était alors une **déduction
   déguisée en mesure**, et c'est le motif principal du premier FAIL du gate. Depuis le
   contrefactuel du décideur (§ 1) : **huit des neuf règles énumérées sont réfutées par mesure, et
   seul le NO-OP survit**. On sait donc, **dans ces limites**, que le `latest` ne revient pas au
   plus haut semver et **qu'aucune des huit règles éliminées n'explique pourquoi**.
   🛑 **Le reste, écrit comme tel** : (a) **une règle non énumérée reste possible** ; (b) le NO-OP
   survivant est **observationnel** — il ne dit pas **où** il se produit (`gh`, écriture API, ou
   lecture), et `make_latest` **n'est pas relisible** ; (c) rien de tout cela n'est **garanti pour
   une autre version de l'API**. Ce qui **tient** quoi qu'il arrive : le job **mesure son propre
   résultat** (ligne `VERIFICATION`) et **rougit en dictant le rattrapage** — et **seule cette
   ligne** dira que l'API a changé.
