# Re-cadrage de la garde du `latest` — écrire ce que le job fait, puis le prouver

> Cadré par 🔵 **Gandalf** le **2026-08-30**. Successeur nommé et **explicitement dû** par la
> décision **(γ)** du décideur (`contrefactuel-ca5-procedure-decideur.md` § 5, ligne 507) :
> *« traiter d'abord le défaut découvert et re-cadrer la garde avant de la prouver »*. La décision
> attendait que la mesure existe ; **elle existe** (lot L43, gaté PASS au sixième passage).
>
> **Ce lot ne prouve pas CA-5.** Il re-cadre ce que CA-5 devrait prouver. Il n'y a **aucun geste de
> release sur `IakaCockpit` ni sur `iakaFrameGUI`** : les seuls actes de publication demandés le
> sont sur le **banc privé** `iakasju/latest-contrefactuel` (AR-4 de L43, conservé pour ça).
>
> **Tout ce qui suit a été lu sur le disque le 2026-08-30**, ou repris de L43 **en le nommant comme
> tel**. Ce que la vérification a **corrigé ou affiné** dans le relevé reçu est en § Rectifications
> — **quatre points, dont deux changent le périmètre**. Deux faits **externes** ont été vérifiés sur
> le web ; ils ouvrent une mesure que personne n'avait proposée, et sont en § Faits externes.

> ⚠️ **AMENDÉ le 2026-09-01 par 🔵 Gandalf — le décideur a joué M1, M2 et M3, et M3 renverse une
> prémisse de ce cadrage.** Les trois mesures d'**AR-2** sont **faites**, sur le banc privé
> uniquement, et **aucune ligne de code n'a été écrite**. Ce qui tombe : ce cadrage raisonnait sur
> **`false` comme seul levier de relâchement** du pointeur. C'est faux — **`legacy` en est un, et il
> AGIT**. Le relevé, ce qu'il prouve, ce qu'il ne prouve pas, la correction que j'apporte à sa
> lecture et les **deux arbitrages qu'il ouvre** (**AR-7** remède, **AR-8** quatrième mesure) sont en
> § **Mesures du banc — jouées**. **Rien n'est effacé** : les prévisions du 2026-08-30 restent
> écrites telles quelles et sont **confrontées** au mesuré. *On date, on n'efface pas.*
>
> ⚠️ **Cet amendement ajoute des lignes du motif** au corpus (le tableau des écritures, le relevé
> M1/M2/M3, AR-7/AR-8). Le fichier était **déjà** en attente de tri (D-3, note d'exécution du
> 2026-08-31) ; le volume à trier à l'étape **5.5 augmente**, il ne change pas de nature. Le
> vérificateur continue de **rougir à raison**, et cela **ne se règle jamais par `--ecrire`**.

---

## Problème

Le job `latest` de `.github/workflows/release.yml` a été documenté, dans quatre cartouches et trois
`CLAUDE.md`, comme **empêchant** puis comme **réparant** le vol du `latest`. **Il ne fait ni l'un ni
l'autre.** L43 l'a établi : la release est créée **avant** que le job démarre, donc il n'empêche
pas ; et sa branche `--latest=false` est un **NO-OP** parmi les neuf règles de repli énumérées
(huit réfutées par mesure croisée), donc il ne répare pas. **Il détecte, rougit, et dicte un geste
dont l'efficacité n'a jamais été mesurée.**

L43 a rectifié la **prose**. Ce lot doit trancher le **programme** : que devient un job dont on a
prouvé que la seule branche non triviale est inerte ? Et il doit refermer les trois trous que
l'instrument de L43 a **déclarés** en se livrant — dont deux phrases d'ancrage fausses qui vivent
**dans l'instrument lui-même**.

---

## Rectifications du relevé reçu

> Le brief demande explicitement de dire si un fait est faux ou mal décrit. Quatre points. Aucun
> n'invalide la décision **(γ)** ; deux changent le périmètre, un change la recommandation.

### R-1 ⚠️ — « rien ne garde le bloc `latest:` » est **trop fort**, et l'inexactitude porte

Le relevé écrit : *« Le bloc `latest:` seul l'est (`3547f667…`), **mais rien ne le garde**. »*
Trois choses le gardent déjà, partiellement — et savoir **lesquelles** décide de ce qu'il reste à
construire :

1. **Le banc garde le bloc du Cockpit.** L'étape 3.3 de L43 télécharge
   `raw.githubusercontent.com/iakasju/IakaCockpit/main/.github/workflows/release.yml`, en extrait le
   bloc `latest:` et le compare octet à octet. **Contrefactuel joué et prouvé** (run `33278026605`
   rouge sur un octet muté, `33278079380` vert après `git revert`). Ce n'est pas rien.
2. **Le registre tient 12 lignes de chaque `release.yml`**, dont les lignes 173, 176 et 192 des
   **deux** dépôts, par empreinte, avec leur motif d'exclusion (lu : `lignesHorsCouverture` du JSON,
   entrées `IakaCockpit` et `iakaFrameGUI`). Muter l'une d'elles **fait rougir D-6**, y compris
   côté GUI.
3. Ce qui est **exact** dans le relevé, et qui reste le défaut : **aucune face de convergence** ne
   garde le fichier du GUI, et le banc ne regarde **que** le Cockpit — et seulement quand quelqu'un
   déclenche son workflow à la main.

**Ce qui n'est donc gardé par personne** : les lignes du bloc `latest:` **qui ne portent pas le
motif**, dans les deux dépôts. Et c'est précisément là que vit le défaut du § R-3 ci-dessous.

### R-2 ⚠️ — **le référent du job est le mauvais ensemble**, et c'est un « chiffre qui ne décrit pas ce qu'il prétend décrire »

Lu à `release.yml:167-168` (les deux dépôts, lignes identiques) :

```
PLUS_HAUT=$(gh api "repos/$DEPOT/tags" --paginate --jq '.[].name' \
  | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)
```

`PLUS_HAUT` est le plus haut **tag**. Or `GET /releases/latest` ne peut **jamais** rendre autre
chose qu'un tag qui **porte une release**. Les deux populations ne coïncident pas : F1 de L43 mesure
**4 tags sur 29** porteurs d'une release sur `IakaCockpit`. L'invariant que le job exige —
`latest == PLUS_HAUT` — n'est donc **pas bien formé en général**. Il se trouve vrai aujourd'hui
parce que le plus haut tag porte une release ; c'est une **coïncidence de topologie**, pas une
propriété.

**Conséquence mesurable, et elle est double** :

- **Faux rouge.** Qu'un tag de version plus haut que la plus haute release existe — le cas normal
  après un **build rouge**, où `tauri-action` ne crée aucune release — et la ligne `VERIFICATION`
  rougit alors que le `latest` est **correct**.
- **Dictée impossible.** Le rattrapage imprimé, `gh release edit $PLUS_HAUT --latest`, s'adresse
  alors à une release **qui n'existe pas** : la commande **ne peut pas réussir**. Un opérateur qui
  suit le message à la lettre boucle.

Ce chemin est **structurel, pas accidentel** : `if: always()` fait tourner le job **précisément**
quand le build est rouge, donc quand la release n'existe pas. C'est le chemin V-E que L43 décrit
comme *« jamais tourné »*.

⚠️ **Et la ligne 167 n'est tenue par aucune empreinte** : elle ne porte aucun mot du motif
(`repos/$DEPOT/tags` ne matche ni `releases/latest` ni les autres alternatives). **Le défaut est
exactement dans l'angle mort H-1 que l'instrument déclare.** C'est la meilleure illustration
disponible de sa borne, et elle n'est pas théorique.

### R-3 — « `iakaFrameGUI` est le point faible » : vrai, mais **le Cockpit porte le même défaut**

Le relevé range le GUI comme le point faible (garde absente). C'est exact **sur la garde**. Mais le
défaut R-2 est dans le bloc **byte-identique** : il est **dans les deux dépôts**, avec la même
gravité. Traiter le GUI comme « le maillon faible à rattraper » ferait manquer que **le programme
lui-même est à corriger des deux côtés**, garde ou pas.

### R-4 — « les extensions non balayées » est un trou d'**exactement un fichier**, et c'est le registre lui-même

Le relevé énumère `.json`, `.toml`, `.html`, `.txt` comme extensions non balayées. **Mesuré le
2026-08-30**, motif du registre appliqué à ces quatre extensions sur les trois dépôts :

| Dépôt | Fichiers touchés | Lignes |
|---|---|---|
| `IakaCockpit` | **0** | 0 |
| `iakaFrameGUI` | **0** | 0 |
| `iakaframe` | **1** — `cli/fixtures/registre-repli-latest.json` | **372** |

⚠️ **Cette mesure est un indice, pas un verdict** : elle a été prise avec `ripgrep`, qui honore
`.gitignore` (donc exclut `node_modules`, `dist`, `target`, `coverage` — la liste `exclus` du
registre, à `.next` près), et **non avec le balayeur du registre**. Elle **doit être refaite par
l'instrument** (CA-18) avant d'être inscrite.

**Ce que ça change** : ajouter `.json` au balayage n'ouvrirait pas une classe, ça importerait
**372 déclarations hors couverture** pour un seul fichier dont les lignes sont, **par
construction**, des **extraits** des lignes déjà inscrites ailleurs. Le remède proportionné n'est
pas une extension de plus, c'est de **tenir par empreinte les clés de prose du registre** — un
ensemble **clos et petit**. Voir AR-5. *(Le relevé n'est pas faux ; il décrit la forme du trou et
pas sa taille, et la taille renverse le remède.)*

---

## Faits externes — vérifiés sur le web le 2026-08-30

> Le cadrage ne se fait pas hors ligne. Deux faits externes ouvrent une mesure que ni L43 ni le
> brief ne proposent, et qui **rétrécit le résidu**.

### E-1 — `make_latest` a **trois** valeurs, et les règles réfutées décrivent la troisième

La doc REST de GitHub donne `make_latest ∈ {"true", "false", "legacy"}`, défaut `"true"`, et dit
explicitement que sous **`legacy`** *« the latest release should be determined based on the release
creation date and higher semantic version »*.

**C'est mot pour mot la famille de règles que le contrefactuel du décideur a réfutée** — repli par
`created_at`, par semver. Autrement dit : **les huit règles éliminées décrivent le régime `legacy`,
qui n'est pas celui du dépôt.** Hors `legacy`, la doc ne décrit **aucun** repli calculé — ce qui est
cohérent avec un `latest` qui est un **pointeur stocké**, et non un ordre dérivé.

⚠️ **Ce n'est pas une preuve, et ce n'est pas « la règle non énumérée trouvée ».** C'est un
**candidat sourcé** pour le résidu (1), qui reste ouvert : la doc ne dit **pas** ce qu'il advient du
pointeur quand on pose `false` sur la release qui le porte. Elle rend seulement l'hypothèse
« pointeur, pas ordre » beaucoup plus plausible que « règle exotique non énumérée ». **À écrire
comme candidat, jamais comme conclusion.**

> ✅ **STATUT AU 2026-09-01 — le candidat est CONFIRMÉ, et il fait mieux que ce qui était espéré.**
> M3b mesure que `legacy` **écrit** : le régime existe, il est atteignable, il **déplace** le
> pointeur. E-1 avait raison sur l'existence du régime — **et tort par omission sur son effet** : ce
> cadrage le rangeait parmi les explications possibles du **passé**, jamais parmi les **leviers**
> disponibles. C'est cette omission qui a rendu (2b) incomplet, et c'est elle que l'amendement
> répare. ⚠️ **Reste faux de dire « les huit règles éliminées décrivent le régime `legacy` »** :
> M3b en réfute **trois** (date la plus récente, ordre d'enregistrement, tri lexicographique) **sous
> `legacy` lui-même**. Le régime existe ; **la famille de règles qu'on lui prêtait, non.**

### E-2 — `--latest=false` a une famille documentée de non-effets, **et ils portent sur `create`, pas sur `edit`**

Le traqueur de `cli/cli` porte au moins deux rapports de `gh release create --latest=false` sans
effet (n° 8201, n° 10695), avec une cause identifiée : `create` avec assets crée un **brouillon**,
téléverse, **puis publie** — et l'étape de publication **ne reporte pas** le drapeau. Un rapport
note aussi que le drapeau est sans effet **s'il n'existe aucune release préalable**.

**Ce que ça apporte, et ce que ça n'apporte pas** :

- Ça rend l'hypothèse « le NO-OP est **dans le client `gh`** » **concrète** plutôt qu'abstraite —
  c'est le point (2) du résidu, qui dit ne pas savoir **où** le NO-OP se produit.
- Mais **F3 de L43 l'a déjà exclue pour `edit`**, par lecture de source : `pkg/cmd/release/edit/
  edit.go` déclare le drapeau en `NilBoolFlag` et envoie `params["make_latest"] = "false"`. Le bug
  documenté est sur un **autre chemin de code**.
- **Donc** : le « où » se réduit à **écriture acceptée sans effet** ou **lecture**. Et il existe une
  mesure qui tranche, **que le corpus nomme déjà comme non faite** — *« Le `PATCH` REST **brut**
  reste **sans run ni log** »* — : émettre l'intention **sans passer par `gh release edit`**, par
  `gh api -X PATCH`. Si le PATCH brut a un effet là où `edit` n'en a pas, le NO-OP est **dans le
  transport**. Sinon, il est dans l'API ou la lecture, et le résidu (2) se réduit d'un cran.

**Cette mesure coûte deux commandes sur un banc privé.** C'est l'étape 1 de ce lot.

> ✅ **STATUT AU 2026-09-01 — mesure faite, et le raisonnement ci-dessus a tenu.** Le `PATCH` brut est
> **inerte** comme `gh` (M2) : le NO-OP n'est donc pas dans le transport. Et la disjonction que E-2
> laissait ouverte — *« il est dans l'API ou la lecture »* — **est tranchée** par recoupement avec
> M3b, qui rend le **même** chemin efficace avec une **autre valeur** : **c'est la valeur `false`
> qui est inerte, pas le chemin.** Détail et échappatoire : § Mesures du banc.

---

## Mesures du banc — JOUÉES le 2026-09-01 (M1, M2, M3)

> Jouées **par le décideur** sur `iakasju/latest-contrefactuel`, banc **privé**, conformément à
> AR-2. Aucun geste sur les produits — vérifié après coup : `IakaCockpit latest = v0.32.2`,
> `iakaFrameGUI latest = v0.1.8`, trois arbres propres, **3 runs sur le banc, aucun neuf**. Banc
> **restauré et relu** : `gh release edit v0.10.0 --latest` → `latest = v0.10.0`, 2 releases, aucune
> draft ni préversion. Relevé transmis par [PORTEFEUILLE][Odin].

### Topologie du banc au moment des mesures

| Tag | `id` | `created_at` | `published_at` |
|---|---|---|---|
| `v0.10.0` | `379113276` | `22:01:35Z` | `22:03:11Z` |
| `v0.9.0` | `379113280` | `22:10:00Z` | `22:03:13Z` |

`v0.10.0` : **plus haut semver**, **plus ancienne sur les deux dates**, **plus petit `id`**.
`v0.9.0` : **plus récente sur les deux dates**, **plus grand `id`**. Deux remarques qui portent :

- ⚠️ **`created_at` n'est PAS la date de création de la release.** La doc REST le dit :
  *« The `created_at` attribute is the date of the commit used for the release, and not the date when
  the release was drafted or published. »* C'est une **date de commit**. Le relevé dit *« plus
  récente sur les deux dates »* — et **c'est exactement ce qui sauve sa conclusion** : quel que soit
  le champ que la règle regarde, `v0.9.0` était devant. Sans cette double lecture, l'ambiguïté du
  champ suffirait à ruiner l'inférence.
- **Anomalie à relire, pas à croire** : `v0.9.0` porte un `created_at` (22:10:00) **postérieur** à son
  `published_at` (22:03:13). C'est possible (tag reciblé après publication) et sans conséquence ici,
  mais c'est un rappel que ces valeurs se **re-mesurent** à l'étape 1.1, jamais ne se recopient.

### Ce que chaque écriture a rendu

| # | Écriture | Lecture après | Verdict |
|---|---|---|---|
| **M1** | `gh release edit v0.9.0 --latest` | `latest = v0.9.0` | ✅ **l'écriture `true` AGIT** |
| **M2** | `gh api -X PATCH …/releases/379113280 -f make_latest=false` | `latest = v0.9.0`, **inchangé** | ⚪ requête **acceptée** (objet complet rendu), **effet nul** |
| **M3a** | `gh release edit … --latest=legacy` | — | ⛔ **refus du client** : `invalid argument "legacy" for "--latest" flag: strconv.ParseBool` |
| **M3b** | `gh api -X PATCH …/releases/379113280 -f make_latest=legacy` | `latest` **passe de `v0.9.0` à `v0.10.0`** | ✅ **`legacy` AGIT** |

**Le tableau des écritures, complet et daté** — *à recopier tel quel dans les cartouches (CA-22)* :

| Écriture | Effet | Mesuré par |
|---|---|---|
| `--latest` (`true`) via `gh release edit` | **agit** | M1, 2026-09-01 |
| `--latest=false` via `gh release edit` | **inerte** | mesure du 2026-08-29 (L43) |
| `make_latest=false` via `PATCH` brut | **inerte** | M2, 2026-09-01 |
| `make_latest=legacy` via `PATCH` brut | **AGIT** | M3b, 2026-09-01 |
| `--latest=legacy` via `gh release edit` | **inatteignable** — drapeau **booléen** | M3a, 2026-09-01 |

⚠️ **M3a mérite sa ligne, et pas en note de bas de page** : `gh release edit --latest` est un
**drapeau booléen**. Le régime `legacy` est **hors d'atteinte du client**. Quiconque lira « il existe
trois valeurs » et essaiera de les poser par `gh` se heurtera au même mur. **C'est un fait à écrire,
pas à contourner en silence** — l'étape 1.4 l'exigeait, le décideur l'a fait.

### Ce que j'ajoute au relevé — l'inférence qu'il n'a pas tirée, et qui referme le résidu (2)

Le relevé conclut de M2 : *« Le NO-OP n'est PAS dans `gh` : il siège dans l'API ou dans la
lecture. »* **C'est exact au vu de M2 seule.** Mais M2 et M3b portent sur la **MÊME release**
(`id 379113280`), le **MÊME endpoint**, le **MÊME champ** — **deux valeurs seulement les séparent**.
Or M3b **a bougé le pointeur**. Donc, par ce chemin exact : le transport achemine, l'endpoint
applique, et **la lecture reflète fidèlement** ce que l'écriture installe.

> **Le NO-OP n'est donc ni dans le client, ni dans le transport, ni dans la lecture : il est dans la
> sémantique de la VALEUR `false` côté API.** `true` promeut · `legacy` recalcule · `false` **ne
> demande rien**, et rien n'advient. **Le résidu (2) est refermé.**

⚠️ **Une échappatoire subsiste, et je la nomme plutôt que de la taire** : si `false` installait un
état « pas latest » dont la lecture retomberait sur un **calcul de repli**, et si ce calcul
**différait** de celui qu'installe `legacy`, l'observation tiendrait aussi. Aucune mesure ne soutient
cette distinction ; **aucune ne la réfute non plus**. Elle s'écrit, elle ne se joue pas.

### Ce que M3 prouve sur la règle de repli — et ce qu'elle ne prouve pas

**Prouvé.** `legacy` a posé le `latest` sur **`v0.10.0`** : plus haut semver, **plus ancienne sur les
deux dates**, plus petit `id`. Trois règles tombent d'un coup :

- ❌ **« la plus récente gagne »** — sur `created_at` **et** sur `published_at`. `v0.9.0` l'était sur
  les deux ; elle a perdu.
- ❌ **« la dernière enregistrée gagne »** — `v0.9.0` avait le **plus grand `id`**.
- ❌ **« tri lexicographique du tag »** — en lexicographique `v0.9.0` **>** `v0.10.0` (`9` > `1`) ;
  c'est `v0.10.0` qui a gagné. **La comparaison est bien sémantique, pas textuelle.** *(Le couple
  `v0.9.0`/`v0.10.0` est précisément celui qui sépare les deux : c'est un acquis **gratuit** de la
  mesure, que personne n'avait demandé.)*

**⚠️ NON prouvé — et c'est ici que je corrige le relevé.** Il demande d'écrire *« elle n'est pas
dirigée par la date »*. **C'est un cran trop fort**, pour une raison qui n'est pas théorique : **les
deux releases du banc sont du MÊME JOUR** — 8 min d'écart sur `created_at`, **2 secondes** sur
`published_at`. Or la doc dit *« based on the release creation **date** and higher semantic
version »* : **une date, pas un instant**. Si la règle compare **au grain du jour**, les deux sont
**à égalité** et **le semver tranche** — cette hypothèse produit **exactement** l'observation.

> La mesure sépare **« le semver domine »** de **« la date la plus récente domine, à la seconde »**.
> Elle **ne sépare pas** « le semver domine » de **« la date au grain du jour domine, le semver
> départage »**.

C'est le successeur direct de la réserve n°1 du relevé, et c'est **plus précis** qu'elle : le trou
n'est pas *« on n'a que deux releases »*, c'est **« les deux releases sont du même jour »**. Et cette
formulation-là **dit comment le fermer** — voir **M4**.

**Également non mesuré**, à ne pas combler par hypothèse :

- **`legacy` est-il un ÉTAT ou un coup unique ?** On a mesuré que le pointeur **bouge**. On n'a pas
  mesuré si la release reste ensuite « en calcul » — donc si une release créée plus tard rebasculerait
  le pointeur d'elle-même — ou si le calcul a été fait une fois puis figé. Le relevé écrit *« il rend
  le drapeau au calcul automatique »* : **lecture plausible, pas fait mesuré.** Cette distinction
  devient **décisive** si AR-7 est tranché sur `legacy`.
- **Le comportement de `legacy` à la CRÉATION**, par `tauri-action` ou par tout autre acteur.
- **La stabilité par version de l'API.**

### Un fait externe de plus, vérifié le 2026-09-01 — et il est gênant pour la doc

`GET /repos/{o}/{r}/releases/latest` est décrit par `docs.github.com` comme rendant *« the most recent
non-prerelease, non-draft release, sorted by the `created_at` attribute »*. **Cette phrase est
réfutée deux fois par le banc** :

1. **Avant M1**, le `latest` était `v0.10.0` — le `created_at` le **plus ancien** des deux.
2. **Après M3b**, le `latest` est **revenu** sur ce même `created_at` le plus ancien.

**La documentation de l'endpoint décrit une règle que l'endpoint ne suit pas** — c'est,
littéralement, la classe de défaut que ce lot re-cadre. C'est aussi **l'explication rétrospective du
chantier entier** : les neuf règles de repli énumérées par L43 poursuivaient une règle que **la doc
elle-même énonce à tort**. À consigner (CA-24), avec sa morale : *une doc ne se réfute pas en la
relisant, elle se réfute en mesurant.*

*Source : [REST API endpoints for releases — docs.github.com](https://docs.github.com/en/rest/releases/releases).*

### Le résidu, réécrit — daté 2026-09-01

**Résidu (1) — la règle de repli.** Rédaction du 2026-08-30, **conservée pour mémoire** : *« une
règle non énumérée reste possible ; l'énumération est une liste, jamais une preuve
d'exhaustivité »*. **Rédaction du 2026-09-01** :

> **La règle de repli EXISTE. Elle vit sous `make_latest=legacy`, elle n'est atteignable que par
> `PATCH`, et elle n'est PAS dirigée par la date la plus récente** — ni sur `created_at`, ni sur
> `published_at`, ni sur l'ordre d'enregistrement : le plus haut semver l'a emporté sur les trois.
> **La formule reste inconnue** : les deux releases mesurées étant **du même jour**, une règle au
> grain du jour avec départage au semver produirait la même observation.

**Résidu (2) — où siège le NO-OP.** **REFERMÉ** : dans la **sémantique de la valeur `false`** côté
API. Établi par M2 et M3b sur la **même** release, le **même** endpoint, le **même** champ. Une
échappatoire nommée subsiste (§ ci-dessus) ; elle n'est soutenue par aucune mesure.

**Ouvert et ne l'était pas** : `legacy` est-il persistant ? que fait-il à la création ? → **AR-8**.

### M4 — la mesure qui reste possible, et ce qu'elle vaut

Ce que le banc ne peut pas dire aujourd'hui tient en une phrase : **la date compte-t-elle au grain du
jour ?** Une seule release de plus le dit — pourvu qu'elle soit **d'un autre jour**. *(Les deux
releases du banc datent du 2026-08-31 ; nous sommes le 2026-09-01 : la fenêtre est ouverte
gratuitement.)*

- **Geste** : sur le banc, créer un commit **daté d'aujourd'hui**, le taguer **`v0.8.0`** — le semver
  **le plus BAS des trois** — et en faire une release **non-draft, non-préversion**. Puis, sur la
  release qui **porte alors** le pointeur, `gh api -X PATCH …/releases/<id> -f make_latest=legacy`,
  puis **lire**.
- **Attendu si le semver domine** : `latest = v0.10.0`.
- **Attendu si la date au grain du jour domine** : `latest = v0.8.0` — seule du jour le plus récent,
  **malgré le semver le plus bas**.
- **Ce que ça prouve** : que la date **a** ou **n'a pas** de poids au-dessus du semver **quand les
  jours diffèrent**. C'est **la** question que M1-M3 laissent ouverte, et **la seule** qu'une
  troisième release tranche.
- **Ce que ça NE prouve PAS** : la formule. Ni fenêtre de récence (« les N derniers jours »), ni
  pondération, ni traitement des préversions et brouillons, ni **persistance** de `legacy`, ni son
  comportement **à la création**, ni la stabilité par version d'API. **Une mesure de plus rétrécit le
  résidu d'un cran ; elle ne le clôt pas.**
- **Restauration** : `gh release edit v0.10.0 --latest`, suppression de la release **et** du tag
  `v0.8.0`, puis relecture contre l'état de 1.1. **C'est le geste déjà joué et vérifié** — le
  contrôle et la restauration restent confondus.
- **Coût** : ~5 min du décideur, banc privé, aucun produit touché, aucun run de CI.
- ⚠️ **M4 ne débloque RIEN sous (2b-i)** : si AR-7 est tranché sur (a), la formule de `legacy`
  n'entre dans **aucune ligne de code** — elle n'entre que dans **une phrase de cartouche**, et cette
  phrase s'écrit très bien à la précision que M1-M3 autorisent. **M4 est de la connaissance, pas un
  déblocage.** Sous **(2b-ii) elle devient un prérequis** : on ne délègue pas la réparation à une
  formule qu'on n'a pas caractérisée.

---

## Décision retenue — recommandation, non arbitrage

**Recommandation : mesurer d'abord, renforcer ensuite, et ne renforcer que ce que la mesure
autorise.** Trois volets, dans cet ordre, le second conditionné au premier.

### (1) La mesure du banc — trois écritures, zéro produit, ~15 min du décideur

> ✅ **JOUÉE le 2026-09-01. Le relevé et les verdicts sont en § Mesures du banc.** Ce qui suit est la
> **prévision du 2026-08-30**, conservée pour être confrontée : la colonne « Ce qu'elle tranche » a
> tenu pour M1 et M2 ; **elle était fausse pour M3**, qui n'anticipait pas que `legacy` **écrive**.

Le banc `iakasju/latest-contrefactuel` est **privé, conservé, et fabriqué pour ça** (AR-4 de L43).
Son état est connu à six valeurs près : `latest = v0.10.0` (`id 379113276`, plus haut semver) et
`v0.9.0` (`id 379113280`, plus récente sur les deux dates, plus grand `id`). Trois écritures, chacune
suivie d'une lecture :

| # | Écriture | Ce qu'elle tranche | Si le `latest` bouge | Si non |
|---|---|---|---|---|
| **M1** | `gh release edit v0.9.0 --latest` | **l'écriture `true` a-t-elle un effet ?** | le rattrapage imprimé par le job **fonctionne** — et l'asymétrie `true` ≠ `false` est établie | **le rattrapage que le job dicte est un mensonge** — défaut majeur, remède à re-cadrer |
| **M2** | `gh api -X PATCH repos/iakasju/latest-contrefactuel/releases/379113276 -f make_latest=false` | **où siège le NO-OP** (E-2) | le NO-OP est **dans `gh`**, pas dans l'API — résidu (2) refermé | le NO-OP est dans l'API ou la lecture — résidu (2) réduit d'un cran |
| **M3** | `gh release edit v0.9.0 --latest=legacy` puis lecture | **le régime `legacy` de E-1** | les règles date/semver **existent**, sous un drapeau qu'on n'emploie pas — résidu (1) nommé | `legacy` non plus ne bouge rien : à consigner tel quel |

> ⚠️ **Un détail qui a servi** : la ligne M2 ci-dessus cite `…/releases/379113276`. L'étape **1.3**
> corrigeait déjà ce tableau — *« id de la **porteuse** »* — et la mesure a bien été jouée sur
> **`379113280`**, la release qui portait le pointeur après M1. **C'est cette correction qui rend
> l'inférence du § Mesures possible** : M2 et M3b ont visé la **même** release. Sur `…276`, le
> recoupement n'aurait rien donné.

**M1 est la mesure qui décide du lot.** Elle est aussi celle qui **restaure le banc** : `M1` pose le
`latest` sur `v0.9.0`, et la commande de restauration est exactement le geste qu'on veut prouver —
`gh release edit v0.10.0 --latest`, puis relecture. **Le contrôle et la restauration sont le même
geste**, ce qui rend la séquence sûre.

> ⚠️ **Les trois écritures sont des actes de release, refusés aux agents.** L'agent prépare les
> commandes, mesure les lectures, rédige. **Le décideur exécute.** Aucune ne touche un produit.

### (2) Le programme du job — deux correctifs, l'un inconditionnel, l'autre non

**(2a) — INCONDITIONNEL : corriger le référent.** `PLUS_HAUT` doit être le plus haut semver
**qui porte une release**, dérivé de `repos/$DEPOT/releases`, pas de `repos/$DEPOT/tags` (R-2). Ce
correctif ne dépend d'**aucune** hypothèse sur le repli : il rend seulement la mesure comparable à
ce qu'elle mesure. *Un chiffre qui ne décrit pas ce qu'il prétend décrire est un défaut* — et
celui-ci produit un faux rouge **et** une dictée impossible.

**(2b) — CONDITIONNÉ À M1 : ré-affirmer inconditionnellement `--latest`.** Remplacer la branche
`--latest=false` (**mesurée inerte**) par `gh release edit "$PLUS_HAUT" --latest` — c'est-à-dire
**exécuter** le rattrapage que le job se contente aujourd'hui d'imprimer.

Trois précisions, parce que c'est là qu'on peut se mentir :

- **Sur le chemin nominal, (2b) ne change rien** : quand `TAG = PLUS_HAUT`, la commande émise est
  déjà `gh release edit "$TAG" --latest`. (2b) ne modifie que la branche du vol.
- **La ligne `VERIFICATION` n'est pas touchée.** Elle reste la mesure — la seule — de ce qui s'est
  réellement passé. Un job qui écrirait puis se déclarerait satisfait sans relire serait
  auto-certifiant ; ce n'est pas ce qui est demandé.
- **(2b) ne peut pas être posé sur un espoir.** Si M1 montre que l'écriture `true` est elle aussi
  inerte, **(2b) tombe** et le lot doit dire ce qu'il reste : un détecteur honnête qui dicte un
  geste dont on aura alors prouvé qu'il ne marche pas — c'est-à-dire un **défaut à re-cadrer**, pas
  un lot à finir.

> 🪤 **Le gate avait noté que « sous les deux hypothèses le correctif est le même ». Cela tient
> encore — mais l'argument a changé de nature, et le dire évite une fausse confiance.** À l'époque,
> deux hypothèses vivantes (repli par date · NO-OP) **convergeaient** vers le même remède : c'était
> un argument de **robustesse** — on n'avait pas besoin de savoir laquelle était vraie. Aujourd'hui
> il n'en reste **qu'une**. La convergence est devenue **dégénérée** : « les deux hypothèses
> s'accordent » ne dit plus rien quand il n'y en a qu'une. Ce qui reste est plus maigre et doit être
> écrit comme tel : **(2b) est la seule chose qu'il reste à essayer, et M1 est ce qui dira si elle
> vaut quelque chose.**

#### (2a) et (2b) — AMENDÉS le 2026-09-01

**(2a) reste INCONDITIONNEL, et rien ne l'a touché.** R-2 est un **défaut de code** — un référent
dérivé de `repos/$DEPOT/tags` là où `GET /releases/latest` ne peut rendre qu'un tag **porteur d'une
release**. Il ne dépend d'**aucune** hypothèse sur la sémantique du pointeur : ni M1, ni M2, ni M3
ne le confirment ni ne l'infirment, parce qu'il n'est pas de cet ordre. **Le faux rouge sur build
rouge et la dictée sur une release inexistante subsistent intacts.** *(Il gagne même en poids : M1
prouve que le geste dicté **fonctionne** — donc la seule raison pour laquelle il échouerait
désormais est **la mauvaise cible** que R-2 lui donne. Le défaut passe de « geste peut-être vain »
à « geste efficace, adressé à une release qui n'existe pas ».)*

**(2b) : la condition est LEVÉE, et une seconde option apparaît.** M1 est verte — l'écriture `true`
agit. Mieux : elle a posé le pointeur sur **`v0.9.0`, le plus BAS semver**, ce qui établit que **le
pointeur explicite prime sur tout calcul**. Conséquences : le risque **R1 est éteint**, et la seconde
branche de **CA-8** est **morte** — conservée datée, pas effacée.

Mais M3 met sur la table un remède que ce cadrage ne connaissait pas :

| | Geste du job dans la branche du vol | Intention |
|---|---|---|
| **(2b-i)** *(cadré le 2026-08-30)* | `gh release edit "$PLUS_HAUT" --latest` | **imposer** la réponse que le job a déjà calculée |
| **(2b-ii)** *(ouvert par M3)* | `gh api -X PATCH repos/$DEPOT/releases/<id> -f make_latest=legacy` | **rendre** le pointeur au calcul de GitHub |

⚠️ **Ce ne sont pas deux variantes d'un même geste : ce sont deux intentions opposées.** (2b-i)
affirme ; (2b-ii) **renonce** à ce que le job a calculé et délègue à une formule inconnue.
**Recommandation : (2b-i)** — quatre motifs, en **AR-7**. `legacy` gagne sa place **dans les
cartouches**, pas dans le programme.

### (3) La garde du bloc `latest:` — inscrire l'**empreinte**, pas le fichier

Les deux `release.yml` **ne sont pas** byte-identiques : **vérifié moi-même à la lecture**, les deux
écarts du relevé sont exacts et ce sont les seuls dans la zone lue — ligne 72 (le Cockpit ajoute
`libasound2-dev cmake pkg-config`) et lignes 96-99 (commentaire minisign, rédaction différente).

Aligner le fichier entier coûterait de trancher, **en passant**, si le GUI doit gagner trois
dépendances de build — une modification de build, pas de prose, dont la preuve exigerait un run de
CI. **C'est exactement le « tant qu'on y est » que le décideur a proscrit.**

**Le contournement propre existe, et il ne triche pas** : ce qui doit converger n'est pas le
fichier, c'est **le bloc**. On peut donc inscrire au registre de convergence, non pas `release.yml`,
mais une **fixture qui porte l'empreinte du bloc** — `fixtures/bloc-latest.sha256`, byte-identique
entre les deux dépôts **par construction**, donc alignée **délibérément** et non « en passant ». La
chaîne devient :

```
bloc(Cockpit) ── garde locale ──> fixture ══ convergence ══ fixture <── garde locale ── bloc(GUI)
```

- **garde locale** : un test du gate de chaque dépôt extrait le bloc de son propre `release.yml` et
  compare son `sha256` à la fixture. Hors réseau, déterministe, **dans le gate des deux côtés** —
  ce qui ferme le trou mesuré du GUI.
- **convergence** : la fixture entre à `fixtures/convergence.sha256`, **plancher 17 → 18**.
- **le banc** : son étape 3.3 compare au **même** référent, ce qui fait de la fixture la source
  unique.

⚠️ **Extraction par marqueur, jamais par numéro de ligne** — c'est toute la leçon de D-2. Le bloc
s'extrait de la ligne qui matche exactement `^  latest:$` jusqu'à la fin du fichier, **avec
assertion que cette ligne est unique**. Si un jour un job suit `latest:`, la garde doit **rougir**,
pas deviner.

### (4) Le registre — refermer ce qu'il a déclaré en se livrant

L'instrument de L43 a fait ce qu'on demande à un instrument : il a **déclaré ses trous**. Trois
sont nommés, et ils ne se valent pas.

**(4a) — les deux phrases d'ancrage fausses : ici, pas dans un successeur.** Vérifiées toutes deux
sur le disque :

| Où | Ce qui est écrit | Pourquoi c'est faux | Pourquoi aucune empreinte ne le tient |
|---|---|---|---|
| `cli/fixtures/registre-repli-latest.json:2` | la clé `"//"` décrit un outil qui rougit *« quand un enonce derive, migre, disparait, ou quand un fichier NEUF entre dans le vocabulaire »* — **quatre** détections | l'outil en porte **sept** (D-5, D-6, D-7 ajoutés au 6ᵉ passage) et un **cliquet** ; rien de tout ça n'est mentionné | `.json` n'est pas balayé (R-4) |
| `cli/scripts/registre-repli-latest.js:5` | *« TROIS PASSAGES DE GATE ONT ECHOUE »* | **contredit 26 lignes plus bas** par la ligne 32 : *« Cinq passages ont inscrit… »* | le script **s'auto-exclut au niveau fichier** (`horsCouverture`, entrée `iakaframe`) |

Les traiter ailleurs serait incohérent avec ce lot : on ne peut pas re-cadrer *« la chose doit dire
ce qu'elle fait »* en laissant l'instrument mentir sur ce qu'il fait, **dans son propre en-tête**,
et **dans le fichier même que le lot réécrit**. Correction **en datant, jamais en effaçant**.

**(4b) — l'exclusion en masse survivante.** Les 13 fichiers hors couverture le sont **au niveau
FICHIER** : un motif, aucune empreinte. Un tel fichier peut **gagner un énoncé** sans que rien ne
bouge — et c'est **précisément par là** que la phrase de `registre-repli-latest.js:5` a survécu à
six passages. Remède proportionné : **garder l'exclusion de fichier, mais l'ancrer ligne à ligne** —
chaque ligne du motif d'un fichier exclu porte son empreinte, donc D-6 (réécrite) et D-7 (périmée)
s'y appliquent. Même pouvoir de détection qu'une abolition, sans refonte de l'instrument.

**(4c) — les extensions.** Voir R-4 : le trou vaut **un fichier**, et c'est le registre lui-même.
Remède : **D-8** — les **clés de prose** du registre (`"//"` racine, `balayage.//`,
`completude.//`, `regleDeTri`, `ecrireNeFabriqueAucuneExclusion`, `mesureDEntree`,
`ceQueDD5NeCouvrePas`) sont tenues par empreinte, comme n'importe quel énoncé. Ensemble **clos**,
coût nul, et ça ferme (4a) définitivement. `.toml`, `.html`, `.txt` sont **déclarés hors couverture
avec leur motif et leur condition de levée** (mesure : zéro ligne sur les trois dépôts) — déclarés,
pas oubliés.

---

## Périmètre

**Inclus**

1. Les **trois mesures du banc** (M1, M2, M3) et leur consignation, y compris si elles réfutent la
   recommandation. — ✅ **mesures jouées le 2026-09-01** ; **la consignation reste due** (CA-4,
   CA-22, CA-23, CA-24). **Elles ont réfuté une prémisse, et c'est écrit.**
2. **(2a)** correction du référent `PLUS_HAUT` dans les **deux** `release.yml`, et dans la copie du
   banc. — **inconditionnel, inchangé.**
3. **(2b)** ré-affirmation inconditionnelle `--latest` sur `PLUS_HAUT`, **si et seulement si M1
   l'autorise**. — ✅ **M1 l'autorise (2026-09-01)** ; **la FORME du remède est rouverte par
   AR-7** : (2b-i) `--latest` *(recommandé)* ou (2b-ii) `make_latest=legacy`.
3bis. **M4** — quatrième mesure sur le banc, **hors périmètre par défaut** ; **entre au périmètre en
   prérequis** si AR-7 est tranché sur (2b-ii). Voir **AR-8**.
4. **(3)** `fixtures/bloc-latest.sha256` + garde locale dans le gate des **deux** dépôts +
   inscription au registre de convergence (plancher 17 → 18) + les deux faces rejouées des deux
   côtés.
5. **(4)** les deux phrases fausses corrigées-datées ; ancrage ligne à ligne des 13 exclusions de
   fichier ; **D-8** sur les clés de prose ; déclaration motivée de `.toml/.html/.txt`.
6. **Triage à la main** des lignes du motif que **cette instruction** ajoute au corpus, et son
   entrée au registre.
7. Consignation : les **quatre** cartouches, les **trois** `CLAUDE.md`, les **trois** états des
   lieux — ce que le job fait **après** ce lot, daté.

**Exclu — nommément**

- **CA-5 lui-même.** Ce lot ne le prouve pas et ne prétend pas le prouver. Il rend prouvable
  quelque chose qui vaille la peine de l'être.
- **Tout geste de release sur `IakaCockpit` ou `iakaFrameGUI`** : la décision **(γ)** tient.
- **L'alignement des deux `release.yml`** (dépendances Linux l. 72, commentaire minisign l. 96-99)
  → successeur nommé `CONVERGENCE-RELEASE-YML-ALIGNEMENT`, à cadrer, **pas en passant**.
- **La dette de canal à deux étages** : NAS injoignable (`000`) **et** `publish-update.mjs:418` qui
  ne pousse que vers `origin` alors que l'endpoint réellement lu par les clients est
  `raw.githubusercontent.com` — un `git push github main` qu'aucun script n'exécute. **Défaut réel,
  autre lot.**
- **`iakaframe`** : première publication de son CI (`actions/runs` → `total_count: 0`) et
  `CI-RELEASE-AUCUN-EPINGLAGE` (trois tags flottants). Son **cartouche** est dans le périmètre
  (point 7) ; son **workflow** ne l'est pas.
- Les **cinq successeurs de L42** (F-2, F-3, couverture asymétrique,
  `D3-OBSERVABLE-ENREGISTREMENT`, `CI-RELEASE-AUCUN-EPINGLAGE`), les **deux porteurs de version non
  gardés** du Cockpit (`Cargo.lock`, `package-lock.json`), le constat d'absence macOS du GUI daté
  sur `v0.1.7`.
- **Le dé-épinglage de `tauri-action`** : l'acquis de L41 n'est pas rouvert.
- **H-1**, l'angle mort lexical. Il ne se ferme pas, et ce lot ne prétend pas le fermer : *la
  complétude est celle du MOTIF, jamais celle du SENS*. R-2 en est la démonstration la plus nette
  (le défaut vit sur une ligne sans motif) ; il est traité **parce qu'un lecteur l'a vu**, pas parce
  qu'un balayage l'a signalé. **La lecture reste dans la boucle.**

---

## Étapes d'implémentation

### 1. Les mesures du banc — l'agent prépare, 👤 le décideur exécute — ✅ **FAITE le 2026-09-01**

> **1.1 à 1.5 sont jouées et le banc est restauré et relu.** Le texte des sous-étapes est conservé
> tel quel (il documente le geste, et **M4 le rejoue à l'identique** si AR-8 l'ouvre). **1.6 reste
> due** en tant que consignation, et **1.7 s'y ajoute.**

1.1 **Figer l'état d'entrée** (lecture, agent) : `gh api repos/iakasju/latest-contrefactuel/releases
--jq '[.[]|{tag:.tag_name,id:.id,created:.created_at,published:.published_at}]'` et
`gh api repos/iakasju/latest-contrefactuel/releases/latest --jq .tag_name`. **Ces valeurs sont
l'état de référence de la restauration** — pas celles recopiées de L43.

1.2 👤 **M1** — `gh release edit v0.9.0 --latest --repo iakasju/latest-contrefactuel`, puis lecture.

1.3 👤 **M2** — `gh api -X PATCH repos/iakasju/latest-contrefactuel/releases/<id de la porteuse>
-f make_latest=false`, puis lecture. *(L'`id` se relit en 1.1 ; ne pas reprendre `379113276` d'un
rapport.)*

1.4 👤 **M3** — `gh release edit <cible> --latest=legacy --repo …`, puis lecture. Si `gh` refuse la
valeur, la passer par `gh api -X PATCH … -f make_latest=legacy` et **le dire**.

1.5 👤 **Restaurer** : `gh release edit v0.10.0 --latest --repo …`, puis **relire**. La lecture
finale doit rendre l'état de 1.1.

1.6 **Consigner les trois mesures avec leurs lectures avant/après**, et **réécrire le résidu** en
conséquence — points (1) et (2) — ou **écrire qu'il est inchangé, avec le motif**. — **Fait dans
cette instruction (§ Mesures du banc). Reste à propager** aux quatre cartouches et aux trois
`CLAUDE.md` : c'est CA-4, traité à l'étape 6.

1.7 **(neuf, 2026-09-01)** Porter dans les cartouches **le tableau des cinq écritures** — y compris
la ligne **`--latest=legacy` inatteignable par `gh`** (M3a) — et la **réfutation mesurée** de la
phrase de la doc GitHub sur `GET /releases/latest`. CA-22 et CA-24.

### 1bis. M4 — 👤 décideur, **seulement si AR-8 l'ouvre**

> ⚠️ **Ne pas jouer M4 par défaut.** Sous **AR-7 = (2b-i)**, elle ne débloque rien : elle enrichit le
> résidu, elle ne conditionne aucune ligne de code. Sous **AR-7 = (2b-ii)**, elle est un
> **prérequis**. Protocole complet, attendus et bornes : § **M4** ci-dessus.

1bis.1 Re-figer l'état d'entrée (comme 1.1). 1bis.2 👤 Créer commit du jour + tag `v0.8.0` + release
non-draft non-préversion. 1bis.3 👤 `PATCH … -f make_latest=legacy` sur la **porteuse du moment**,
puis lire. 1bis.4 👤 Restaurer : `gh release edit v0.10.0 --latest`, supprimer release **et** tag
`v0.8.0`, **relire contre 1bis.1**. 1bis.5 Consigner, **et réécrire le résidu (1) une seconde fois**,
daté — ou écrire qu'il est inchangé, avec le motif.

### 2. Le référent (2a) — agent, hors ligne pour l'écriture, banc pour la preuve

2.1 Remplacer, dans les **deux** `release.yml`, la dérivation de `PLUS_HAUT` par une dérivation sur
`repos/$DEPOT/releases` (champ `tag_name`, hors brouillons et préversions), même filtre
`^v[0-9]+\.[0-9]+\.[0-9]+$`, même `sort -V | tail -1`. **Modification dans les deux dépôts au même
commit logique.**

2.2 Écrire, dans le cartouche, **pourquoi** : la population lue doit être celle que
`GET /releases/latest` peut rendre. Citer le chiffre : **4 tags sur 29** portent une release sur le
Cockpit (F1, L43).

2.3 **Prouver le défaut A/B sur le banc** : y créer un tag de version **plus haut que la plus haute
release, sans release** (p. ex. `v0.11.0`), puis lancer le job du banc **avant** et **après** 2.1.
**Attendu** : avant → `plus haut semver: v0.11.0`, `VERIFICATION` **rouge à tort**, rattrapage
dicté sur une release inexistante ; après → `plus haut semver: v0.10.0`, pas de faux rouge. Les
deux logs cités.

2.4 Nettoyer le tag de banc.

### 3. La ré-affirmation (2b) — ✅ **M1 est verte (2026-09-01) : l'étape est DUE**, sous réserve d'AR-7

> **La condition est levée.** Reste à trancher **la forme** (AR-7). 3.1 écrit ci-dessous est la forme
> **(2b-i)**, celle que je recommande. Si AR-7 est tranché sur **(2b-ii)**, 3.1 change de contenu
> **et** de coût : il faudrait résoudre `tag → id` de release avant de pouvoir `PATCH` — le job ne
> manipule que des **tags** — donc un appel de plus et un mode d'échec de plus, dans un job qui
> tourne `if: always()`. **L'exécution ne choisit pas : elle s'arrête et remonte** si AR-7 n'est pas
> tranché.

3.1 Remplacer la branche `--latest=false` par `gh release edit "$PLUS_HAUT" --latest`, dans les
deux dépôts au même commit logique. **Ne pas toucher la ligne `VERIFICATION`.**

3.2 Rejouer sur le banc la **séquence complète** : vol réel (`gh release create` sans `--latest`)
→ job → lecture. **Attendu** : `VERIFICATION` **verte**, `latest` rendu à `PLUS_HAUT` **dans le
même run**. Log cité.

3.3 **Si M1 est rouge** : ne rien changer au programme, écrire dans les quatre cartouches que le
rattrapage dicté **est mesuré sans effet**, et **nommer un successeur** — le job dicterait alors un
geste inutile, ce qui est un défaut de plein droit. — ⚪ **BRANCHE MORTE au 2026-09-01 : M1 est
verte.** Conservée datée : elle documente ce que le lot aurait dû devenir, et **la mesure qui l'a
écartée**. *On date, on n'efface pas.*

### 4. La garde du bloc (3) — agent, hors ligne

4.1 Extracteur par marqueur (`^  latest:$` → EOF, unicité assertée), partagé, byte-identique entre
les deux dépôts.

4.2 `fixtures/bloc-latest.sha256` : l'empreinte **re-mesurée**, jamais recopiée. *(L43 rapporte
`3547f66746fae90721879ad0115cb84764ff5a2da5c07fd251b75c2634457173` ; après les étapes 2 et 3 elle
**aura changé** — c'est attendu.)*

4.3 Garde locale dans le gate des deux dépôts.

4.4 Inscription de la fixture (et de l'extracteur) à `fixtures/convergence.sha256`, **plancher
17 → 18**, régénération par la commande en tête du registre, **les deux faces rejouées des deux
côtés**.

4.5 Aligner le référent du banc (étape 3.3 de L43) sur la même fixture.

### 5. Le registre (4) — agent, hors ligne

5.1 Corriger les deux phrases fausses **en les datant** : le `"//"` du JSON énumère les **sept**
détections et le cliquet ; l'en-tête du `.js` dit **cinq** passages, et **date** la mention
antérieure au lieu de l'effacer.

5.2 **D-8** : les clés de prose du registre tenues par empreinte. Le vérificateur les lit dans le
JSON — pas de liste en dur : *le défaut d'une garde n'est jamais la liste, c'est son mutisme*.

5.3 Ancrer **ligne à ligne** les 13 exclusions de fichier (4b) : pour chaque ligne du motif, motif
d'exclusion + empreinte. **À la main** — le cliquet interdit à `--ecrire` de fabriquer une
exclusion.

5.4 Déclarer `.toml`, `.html`, `.txt` hors couverture, **avec la mesure** (zéro ligne, trois
dépôts) et une condition de levée.

5.5 **Trier à la main les lignes du motif de cette instruction** et l'inscrire au registre.
⚠️ **Volume revu à la hausse le 2026-09-01** : l'amendement ajoute des lignes du motif (le tableau
des cinq écritures, le relevé M1/M2/M3, AR-7, AR-8, le résidu réécrit). **Même nature, plus de
lignes.** D-3 rougit toujours à raison ; **cela ne se règle pas par `--ecrire`.**

### 6. Consignation — agent

6.1 Les **quatre** cartouches, les **trois** `CLAUDE.md`, les **trois** états des lieux : ce que le
job fait **après** ce lot. Dater, ne pas effacer.

6.2 Mettre à jour les trois backlogs et l'entrée L43.

---

## Fichiers concernés

- `iakaframe/specs/instructions/re-cadrage-garde-latest.md` — **ce fichier** (copie unique, AR-5=(b)
  de L42).
- `IakaCockpit/.github/workflows/release.yml` et `iakaFrameGUI/.github/workflows/release.yml` —
  **le job `latest` cette fois, délibérément** : ligne 167-168 (référent), branche 175-180 si (2b),
  cartouche 130-146. **La ligne `VERIFICATION` (190-199) n'est pas touchée.**
- `IakaCockpit/fixtures/bloc-latest.sha256` + jumeau GUI — **neuf**, byte-identiques.
- L'extracteur de bloc (`scripts/lib/…`) + son test, dans les deux dépôts — **neufs**,
  byte-identiques.
- `IakaCockpit/fixtures/convergence.sha256` + jumeau — deux lignes ajoutées, plancher 17 → 18.
- `iakaframe/cli/fixtures/registre-repli-latest.json` — clé `"//"`, `lignesHorsCouverture` des 13
  exclus, entrées de cette instruction, déclaration des extensions.
- `iakaframe/cli/scripts/registre-repli-latest.js` — en-tête (5.1), **D-8** (5.2), ancrage des
  exclusions de fichier (5.3).
- `iakaframe/.github/workflows/release.yml` — **cartouche seul**.
- Les trois `CLAUDE.md`, les trois `specs/etat-des-lieux.md`, `iakaframe/BACKLOG.md`.
- **Banc** (hors portefeuille) : copie du job, référent de l'étape 3.3.

**Ne pas toucher** : la ligne `VERIFICATION` · `fixtures/tauri-action-pin.json` et le SHA épinglé ·
`updater/latest.json` · la matrice du CI · `scripts/publish-update.mjs` · les `README.md` ·
`fixtures/vitrine-*.json` · les dépendances Linux (l. 72) et le commentaire minisign (l. 96-99).

> ⚠️ **Plusieurs fichiers de ce périmètre sont tenus par empreinte, et les toucher fera rougir —
> c'est voulu.** Les lignes 173, 176, 192 des deux `release.yml` sont déclarées hors couverture
> avec empreinte ; les cartouches et les `CLAUDE.md` portent des énoncés **inscrits**. **La marche
> à suivre est de trier puis re-inscrire à la main, jamais de contourner** : `--ecrire` ne
> fabrique aucune exclusion, et une correction qui passerait par lui serait précisément le défaut
> que le cliquet existe pour empêcher. Toute dérive rencontrée se **cite** dans le rapport.

> 📏 **RÈGLE — QUAND ON SORT DE CETTE LISTE.** Posée le **2026-09-01**, au second passage du gate,
> **parce qu'elle manquait**. Le lot était sorti de la liste pour corriger `cli/package.json`
> (« SEPT » détections annoncées, **huit** réelles) — et s'était arrêté devant un cas **strictement
> plus grave** : le message **E-1**, imprimé à l'opérateur, qui affirmait le contraire de ce que le
> **même lot** mesurait. **Deux affirmations fausses hors liste, deux traitements opposés, aucune
> règle énoncée.** Le défaut n'était pas « un pointeur oublié » : c'était **l'absence de critère**.
> La règle porte sur les **énoncés**, jamais sur les fichiers :
>
> 1. **ON SORT — obligatoirement — quand un texte du corpus AFFIRME, sur l'objet du lot, quelque
>    chose que le lot lui-même RÉFUTE.** Un lot qui mesure et laisse debout la phrase que sa mesure
>    abat livre un corpus qui **se contredit**, et la moitié fausse est celle qui reste. **Priorité
>    au texte qui s'imprime à un opérateur au moment où il décide** : c'est le seul qui agisse.
> 2. **ON NE SORT PAS pour « améliorer », « renforcer », « tant qu'on y est ».** Un défaut constaté
>    hors liste que le lot ne **réfute** pas se **signale** ; il ne se traite pas.
> 3. **LA SORTIE SE BALAYE, elle ne s'échantillonne pas.** On énumère les candidats par un critère
>    **auto-vérifiable** (ici : `entrees[].extrait` du registre), on **relit chacun**, et on
>    **déclare** ceux qu'on maintient **avec leur motif**. Un candidat maintenu **en silence** est le
>    défaut — pas le candidat maintenu. *Un pointeur de gate est un exemple, jamais une énumération.*
> 4. **LA RECTIFICATION EST DATÉE, jamais effacée**, et les empreintes se ré-inscrivent **à la main**.
>
> 🔍 **ÉLARGI À LA CASSE ET AUX ACCENTS, ET RENDU REJOUABLE — 2026-09-02, écart 3 du gate PASS de
> L44.** Le balayage F2 du 2026-09-01 (candidats portant l'un des quatre motifs « NON ÉPROUVÉ »,
> « ni run ni log », « sans run ni log », « n'a pas de trace ») était **sensible à la casse et aux
> variantes accentuées**. **Le motif, insensible à la casse et aux accents, rejouable par un tiers** :
> ```
> node -e "const fs=require('fs');const r=JSON.parse(fs.readFileSync('cli/fixtures/registre-repli-latest.json','utf8'));const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();const M=/non eprouve|ni run ni log|sans run ni log|n'a pas de trace/;console.log(r.entrees.filter(e=>M.test(norm(e.extrait))).length)"
> ```
> **Mesuré, pas recopié** : sur l'état d'avant la rectification (`dbf8b57`), ce motif élargi rend
> **14** candidats (le motif sensible à la casse n'en rendait que **9**) ; sur l'état courant, il en
> rend **7** (contre **2** au motif strict). **Résultat matériel inchangé** — les cinq candidats que
> la casse et les accents seuls ajoutent se répartissent en deux classes, **aucune ne cache un
> énoncé faux** :
> - **TROIS** logent dans le **bloc daté du 2026-08-30**, conservé par la règle 4 ci-dessus et
>   explicitement suivi de sa propre rectification, datée, dans le même fichier : le message **E-1**
>   des trois dépôts (`IakaCockpit/scripts/vitrine-en-ligne.mjs:125`, `iakaFrameGUI/…:125`,
>   `iakaframe/cli/scripts/vitrine-en-ligne.js:106`).
> - **DEUX** portent sur le **même objet que le survivant n°1** (`iakaframe/cli/scripts/lib/
>   vitrine.js:50`) et sont **couvertes par l'entrée 15** du registre des énoncés
>   (`iakaframe/BACKLOG.md:73`, `specs/instructions/contrefactuel-du-vol-de-latest.md:555`).
>
> **CLAUSE 3 VÉRIFIÉE, PAS SEULEMENT SUPPOSÉE** — les deux survivants au sens strict nomment chacun
> leur condition de chute, et les deux sont **inscrits au registre avec leur motif, tenus par une
> empreinte** (`entrees[]`, un id par ligne, vérifiable en cherchant `chemin` et `ligne` dans
> `cli/fixtures/registre-repli-latest.json`) :
> - **Survivant n°1** — `vitrine.js:50` — porte sa condition **quatre lignes plus bas**
>   (`vitrine.js:54`) : elle tombe à la première publication réelle par le workflow.
> - **Survivant n°2** — l'entrée 16 du registre des énoncés
>   (`specs/instructions/contrefactuel-du-vol-de-latest.md:556`) — a son **successeur écrit juste en
>   dessous, entrée 17, ligne 557** : celui-ci nomme EXPLICITEMENT ce qui l'a fait tomber (la mesure
>   du décideur du 2026-09-01) et le date. *(Ligne 557 elle-même ne porte aucun des quatre motifs :
>   ce n'est pas un énoncé manqué, c'est la correction déjà écrite — rien à y sortir.)*
>
> 📏 **FORME CLOSE — LA SORTIE SE BALAYE, TROIS CLAUSES.** Arrêtée par le gate ; elle **précise** la
> clause 3 ci-dessus pour tout balayage d'énoncés de ce lot, écrite ici parce que c'est la clause
> qu'elle referme :
> 1. **Le balayage est complet et rejouable** — le motif d'énumération est **écrit dans le corpus**
>    (ci-dessus), **insensible à la casse et aux variantes accentuées**, et son compte se rejoue à
>    l'identique par un tiers.
> 2. **Aucun survivant n'est muet** — chaque candidat maintenu est **inscrit au registre avec son
>    motif**, et ce motif est **tenu par une empreinte** : une réécriture silencieuse rougit (D-8).
> 3. **Chaque motif nomme sa condition de chute** — il dit ce qui, **s'il était mesuré**, le
>    rendrait faux. Un motif sans condition de chute est une exclusion de confort et compte comme
>    **non déclaré**.

---

## Risques

- ✅ **R1 — ÉTEINT le 2026-09-01.** ~~**M1 réfute (2b).** L'écriture `true` est elle aussi inerte.~~
  *Rédaction d'origine conservée : « Détection : étape 1.2. Conséquence : (2b) tombe, le lot gagne un
  volet non estimé (que dicter, si le geste dicté ne marche pas ?). C'est le risque principal, et il
  est détecté au premier geste du lot — avant toute écriture de code. Mitigation : l'ordre des étapes
  est fait pour ça. »* **La mitigation a fonctionné exactement comme écrite** : le risque a été
  éprouvé au premier geste, avant toute ligne de code. Il ne s'est pas réalisé.
- ⚠️ **R8 — NEUF : (2b-ii) fait écrire au job une désignation qu'il n'a pas calculée.** Si AR-7 est
  tranché sur `legacy`, le job **abandonne** sa propre réponse à une formule **non caractérisée** (§
  Mesures, « non prouvé »). *Conséquences* : (i) `VERIFICATION` peut rougir **après** l'écriture du
  job — la garde se contredirait elle-même ; (ii) le job doit résoudre `tag → id`, alors qu'il ne
  manipule que des tags, dans un chemin qui tourne `if: always()` **y compris quand la release
  n'existe pas** ; (iii) si `legacy` installe un **état**, le pointeur reste « en calcul », donc
  **re-volable**. *Détection* : impossible sans M4 **et** sans une mesure de persistance. *Mitigation
  unique* : **ne pas poser (2b-ii)** — c'est le fond de la recommandation AR-7.
- **R2 — (2a) casse le chemin nominal.** Une dérivation sur `/releases` peut rendre vide sur un
  dépôt sans release, là où `/tags` rendait quelque chose. *Mitigation* : traiter le cas vide
  explicitement (aucune release ⇒ rien à désigner ⇒ **sortir en succès en le disant**, jamais en
  silence) et l'éprouver sur le banc.
- **R3 — le bloc extrait par marqueur devient ambigu.** Un second `latest:` au même niveau, ou un
  job ajouté après. *Mitigation* : unicité **assertée**, rouge sinon — CA-11.
- **R4 — plancher de convergence.** Passer 17 → 18 sans régénérer les deux côtés au même commit
  logique casse la face croisée. *Mitigation* : la règle opératoire est écrite en tête du registre ;
  CA-12 exige les deux faces des deux côtés.
- **R5 — le banc n'est pas le produit.** Tout ce que M1/M2/M3 et l'étape 3.2 établissent l'est **sur
  un dépôt du même compte**, pas sur `IakaCockpit`. *Ce lot ne prétend pas le contraire* : la
  transposition reste l'objet de CA-5, et reste due. À **écrire** dans le rapport, pas à sous-
  entendre.
- **R6 — 372 lignes.** Si la re-mesure de CA-18 par l'instrument contredit ma mesure `ripgrep` et
  ramène d'autres fichiers, AR-5 change de coût. *Détection* : CA-18 est mesuré **avant** 5.4.
- **R7 — ce document redevient faux.** Il porte des faits datés qu'un lot suivant peut réfuter,
  comme L43 l'a fait six fois. *Mitigation* : il entre au registre (5.5), donc **une réécriture
  silencieuse rougira**.

---

## Critères d'acceptation

> Discipline héritée de L40/L41/L42/L43, **non négociable** : un « OK » sans chiffre vaut **FAIL** ·
> une preuve se compare à une **valeur figée avant l'expérience**, jamais à la sortie d'une autre
> commande · une valeur **reprise d'un rapport** n'est pas une mesure, on **re-mesure** · un critère
> **non mesuré** se déclare *non mesuré*, **jamais** *PASS* · *une garde qui ne peut pas rougir
> n'est pas une garde* : toute garde touchée est éprouvée par une **mutation nommée**, **révoquée
> avec preuve au `sha256`** · *on date, on n'efface pas*.

### Les mesures du banc

> ⚠️ **CA-1, CA-2 et CA-3 sont cochés sur des mesures du DÉCIDEUR, et il faut le dire.** La
> discipline de ce chantier veut qu'*« une valeur reprise d'un rapport n'est pas une mesure »*. Ici
> l'agent **ne peut pas re-mesurer** : ce sont des **actes de release**, qui lui sont refusés. Le
> statut exact de ces trois cases est donc : **mesuré par le décideur le 2026-09-01, valeurs citées,
> non re-mesurable par l'agent**. Le gate les vérifie **en relisant les sorties du décideur**, pas en
> les rejouant. *L'écrire est le seul moyen de ne pas transformer une contrainte en approximation.*

- [x] **CA-1** — **M1 est mesurée.** ✅ **2026-09-01** : avant `latest = v0.10.0` · commande
      `gh release edit v0.9.0 --latest` · après `latest = v0.9.0`. **Verdict écrit :
      l'écriture `true` A un effet** — et elle prime sur le semver, puisqu'elle a posé le pointeur
      sur le plus **bas**.
- [x] **CA-2** — **M2 est mesurée**, et le NO-OP **est nommé**. ✅ **2026-09-01** :
      `gh api -X PATCH …/releases/379113280 -f make_latest=false` → accepté, `latest = v0.9.0`
      **inchangé**. **Le NO-OP siège dans la sémantique de la valeur `false` côté API** — établi par
      recoupement avec M3b sur la **même** release, le **même** endpoint, le **même** champ (donc ni
      transport, ni client, ni lecture). L'échappatoire nommée est écrite au § Mesures.
- [x] **CA-3** — **M3 est mesurée.** ✅ **2026-09-01**, en **deux** temps : `gh` **refuse** la valeur
      (drapeau booléen, `strconv.ParseBool`) ; le `PATCH` **l'accepte et le pointeur bouge** de
      `v0.9.0` à `v0.10.0`. **Les règles date/semver existent bien, sous `legacy` — et la date la
      plus récente n'y gagne pas.** ⚠️ **La formule n'est pas établie** : les deux releases étant du
      même jour, une règle au grain du jour départagée par le semver donnerait la même sortie.
- [ ] **CA-4** — Le **résidu** (1) et (2) est **réécrit et daté** en fonction de CA-1/2/3, dans les
      trois `CLAUDE.md` **et** dans les quatre cartouches — ou **déclaré inchangé avec motif**.
      *Vérif* : `git diff` des sept emplacements. **Reste DÛ** : la réécriture existe dans cette
      instruction, **elle n'est pas propagée**. Le texte de référence à propager est le § « Le
      résidu, réécrit — daté 2026-09-01 », **mot pour mot, réserve du grain du jour incluse**.

### Le référent — le chiffre décrit ce qu'il prétend décrire

- [ ] **CA-5** — Dans les **deux** `release.yml`, `PLUS_HAUT` est dérivé de `repos/$DEPOT/releases`.
      *Vérif* : `grep -n 'repos/\$DEPOT/tags' .github/workflows/release.yml` → **vide** dans les
      deux dépôts.
- [ ] **CA-6** — **Contrefactuel A/B sur le banc, les deux logs cités.** Avec un tag de version sans
      release plus haut que la plus haute release : **avant** 2.1, le job imprime ce tag en
      `plus haut semver:` et rougit ; **après**, il imprime la plus haute **release** et ne rougit
      pas. *Vérif* : `gh run view <id> --log --repo iakasju/latest-contrefactuel`, deux n° de run.
- [ ] **CA-7** — Le cas « aucune release » est traité **explicitement** et éprouvé : le job sort en
      succès **en le disant**, jamais en silence, jamais sur une comparaison à la chaîne vide.
      *Vérif* : ligne de log citée.

> 🛑 **DÉCLARATION DURCIE — 2026-09-01, second passage du gate, sur CA-6, CA-7 et CA-10.**
> Ces trois critères exigent une **ligne de log citée**. **Il n'y en a aucune d'opposable.**
> Le premier état de cette déclaration disait : *« le banc a été joué avec un stub `gh` hors ligne,
> ce n'est pas CA-6/CA-10 »*. C'était **juste, mais pas assez fort** — il y manquait le point qui
> compte : **rien de ce banc n'est reproductible.** Les six scénarios du stub **n'ont laissé aucune
> trace** — ni artefact versionné, ni fixture, ni script rejouable. Ils ne peuvent donc être ni
> **rejoués** ni **contredits**, pas même par qui les a joués.
> **Ce qui est mesuré, et qui fonde la déclaration** *(2026-09-01)* : `grep -rl "AUCUNE release
> non-brouillon"` ne ramène que les **deux `release.yml` eux-mêmes** ; `PLUS_HAUT` n'apparaît, dans
> les trois dépôts, que comme **extrait du registre** — **aucun test n'exerce `PLUS_HAUT`, ni la
> branche du vol, ni la sortie « aucune release »**. **Aucun artefact versionné ne reproduit la
> logique shell du job.** La seule garde qui pèse sur ce code est la **fixture d'octets** du bloc
> `latest:` : elle atteste qu'il **n'a pas changé** — **jamais** qu'il **fonctionne**.
>
> ⚠️ **RECTIFIÉE LE 2026-09-02 — LA PRÉMISSE ÉTAIT FAUSSE, LA CONCLUSION TIENT.** *(écart 1
> consigné au gate PASS de L44.)* La proposition *« `PLUS_HAUT` n'apparaît, dans les trois dépôts,
> que comme **extrait du registre** »* est **datée, pas effacée** — et elle est **réfutée par la
> mesure**. Une phrase fausse **dans une déclaration de durcissement** est de la classe exacte que
> ce lot corrige : elle se rectifie ici, elle ne disparaît pas.
> **RE-MESURE DU 2026-09-02**, refaite et non recopiée — `git grep -o 'PLUS_HAUT' | wc -l`, en
> **occurrences** (le compte par lignes est plus bas d'une unité dans cette instruction) :
> **IakaCockpit** — `.github/workflows/release.yml` **19**, `CLAUDE.md` **6**,
> `specs/etat-des-lieux.md` **3** · **iakaFrameGUI** — **les mêmes trois fichiers aux mêmes
> comptes** (19 / 6 / 3) · **iakaframe** — `.github/workflows/release.yml` **11**,
> `cli/fixtures/registre-repli-latest.json` **41**, cette instruction **22**,
> `specs/instructions/contrefactuel-du-vol-de-latest.md` **5**, `specs/etat-des-lieux.md` **3**,
> `specs/instructions/contrefactuel-ca5-procedure-decideur.md` **1**, `BACKLOG.md` **1**.
> ⚠️ **Le compte de cette instruction est celui de l'état qui portait la phrase fausse** (`27253a0`,
> **22**). **Écrire la rectification le fait monter à 26**, le présent paragraphe citant le symbole
> quatre fois de plus. On le dit plutôt que de laisser un chiffre se périmer en silence : un
> instrument qui se compte lui-même doit **dater l'état sur lequel il compte**.
> **Le symbole est massivement présent dans le corpus, à commencer par LE CODE LUI-MÊME** — les
> trois `release.yml`. **Seul le `.json` est un extrait du registre.**
> **CE QUI EST VRAI, ET QUE LA MESURE PORTE : aucun chemin de test n'exerce `PLUS_HAUT`.**
> *Vérif rejouable* : `git grep -l 'PLUS_HAUT' -- '*test*' '*spec*'` ne ramène, sur les trois
> dépôts, **aucun fichier de test** — rien que des `specs/**.md`, le registre et le code du job.
> **C'était l'incise qui suivait le tiret** qui portait la mesure ; la proposition qui la précédait
> la **sur-généralisait** en absence du corpus ce qui n'était qu'une absence des tests.
> **LA CONCLUSION EST VÉRIFIÉE INCHANGÉE, et elle n'est pas sauvée : elle est re-fondée.** Toutes
> les occurrences relevées sont du **code** (`release.yml`) ou de la **prose** (`CLAUDE.md`,
> `specs/`, `BACKLOG.md`, registre) ; **aucune n'est un test, ni un harnais, ni une fixture qui
> l'exercerait**. Donc **aucun artefact versionné ne reproduit la logique shell du job**, et la
> seule garde qui pèse sur ce code reste la **fixture d'octets** du bloc `latest:`. La prémisse
> corrigée **soutient toujours** la conclusion — mieux, même, puisqu'elle cesse de la faire reposer
> sur une absence inexistante.
>
> ⚠️ **Ceci n'ouvre PAS un chantier de tests du shell** : c'est une déclaration à durcir, pas un
> périmètre à élargir. Si un artefact reproductible paraît faisable **dans ce lot**, il **remonte
> au décideur** ; il ne se décide pas ici.
>
> ⚠️ **PORTÉE CORRIGÉE — 2026-09-02, écart 4 du gate PASS de L44, même famille que l'écart 1.** La
> remise de ce lot annonçait *« 6 assertions, toutes dans `bloc-latest.test.mjs` »*. **Exacte pour ce
> fichier** — au moment de la remise, six appels `toThrow*` y vivaient (cinq `toThrowError` restés
> depuis, plus le `not.toThrow()` que l'écart 2 a retiré) — **et exacte pour le mot littéral
> `toThrow` dans `iakaframe`**, qui ne l'emploie pas (suite `node:test`, motif `assert.throws`/
> `assert.rejects`). **Mais sa portée n'était pas celle qu'elle laissait entendre.**
> **RE-MESURÉ, PAS RECOPIÉ** (2026-09-02, `git grep -coE 'toThrow|assert\.throws|assert\.rejects|
> \.rejects|t\.throws|throws\('` sur `*.mjs *.js *.ts *.tsx`, état courant de la branche) :
> - **IakaCockpit** — `bloc-latest.test.mjs` (9 occurrences du mot, dont **cinq assertions réelles**
>   `toThrowError`, le reste en commentaire), `canal-mesure.test.mjs` (1), `vitrine.test.mjs` (2),
>   `TreemapPanel.test.tsx` (1), `useSettings.test.ts` (1).
> - **iakaFrameGUI** — les **cinq mêmes fichiers** que Cockpit (fichiers convergents ou parallèles)
>   **plus** `discovery.test.ts` (2), `frame.test.ts` (1), `kit.test.ts` (1), `method.test.ts` (3),
>   `principle.test.ts` (1), `ritual.test.ts` (1), `scaffold.test.ts` (1), `workflow.test.ts` (1),
>   `publish-update.test.mjs` (**12**), `transport.test.ts` (**6**).
> - **iakaframe** — **24** `assert.throws`/`assert.rejects` (`node:test`), sur neuf fichiers de
>   `cli/test/` plus `library/skills/iakaframe-appflowy-doc/test.mjs`.
> **LA CONCLUSION EST VÉRIFIÉE INCHANGÉE SUR LE PÉRIMÈTRE ÉLARGI, ET NON SAUVÉE** : **zéro assertion
> positive non ancrée** dans les trois dépôts — chaque occurrence relevée porte soit un message
> nommé (`toThrowError(/…/)`, un second argument de message, ou l'équivalent `assert.throws`), soit
> une assertion négative dont le rôle a déjà été jugé par le gate (§ écart 2 ci-dessus). Aucune
> n'atteste qu'un appel réussit sans dire quoi. **La correction porte sur la portée de la phrase,
> pas sur son verdict** — même défaut de précision que l'écart 1.

### La ré-affirmation — posée seulement si elle est autorisée

- [ ] **CA-8** — **Si CA-1 est verte** : la branche du vol émet `gh release edit "$PLUS_HAUT"
      --latest`. **Si CA-1 est rouge** : le programme est **inchangé** et les quatre cartouches
      **écrivent** que le rattrapage dicté est mesuré sans effet, avec un successeur nommé.
      *Vérif* : `git diff` du bloc + lecture des cartouches. **Les deux issues sont des PASS ; poser
      (2b) sans CA-1 est un FAIL.**
      → ⚠️ **AMENDÉ 2026-09-01 : CA-1 est VERTE, la seconde branche est morte** (conservée datée).
      **Et le critère se dédouble sur AR-7** : si AR-7 = **(2b-i)**, le critère est celui écrit
      ci-dessus, inchangé. Si AR-7 = **(2b-ii)**, la branche émet un `PATCH … make_latest=legacy`,
      **et le critère exige alors en plus** : (α) la résolution `tag → id` **explicite et testée**,
      (β) une preuve de bout en bout que `VERIFICATION` **reste verte après** l'écriture — ce qui
      n'est **pas** garanti par construction, à la différence de (2b-i). **Poser (2b-ii) sans (α) et
      (β) est un FAIL.**
- [ ] **CA-9** — **La ligne `VERIFICATION` est inchangée à l'octet**, dans les deux dépôts.
      *Vérif* : `git diff` restreint à ce bloc → vide. *Une garde qui écrit puis se déclare
      satisfaite sans relire ne mesure plus rien.*
- [ ] **CA-10** — **Si CA-8 pose (2b)** : sur le banc, vol réel puis job, `VERIFICATION` **verte**
      et `latest` rendu à `PLUS_HAUT` **dans le même run**. *Vérif* : n° de run + les deux lignes de
      log citées. Si le job reste rouge, **le dire** — et CA-8 bascule sur sa seconde branche.

### La garde du bloc `latest:`

- [ ] **CA-11** — L'extracteur est **par marqueur**, et **rougit** si `^  latest:$` n'apparaît pas
      exactement une fois. *Vérif* : mutation (dupliquer la ligne) → rouge **nommé** ; révocation
      prouvée au `sha256`.
- [ ] **CA-12** — La garde locale rougit **dans les deux dépôts** sur un octet muté du bloc.
      *Vérif* : mutation jouée **des deux côtés séparément**, deux rouges nommés, deux révocations
      prouvées au `sha256`. **Côté GUI, c'est le trou mesuré de L43 qui se ferme** — la mutation qui
      laissait *« les deux faces vertes »* doit désormais rougir.
- [ ] **CA-13** — Registre de convergence : **plancher 17 → 18**, deux faces rejouées **des deux
      côtés**, chiffres cités ligne par ligne (`npm run test` et `npm run test:convergence` côté
      Cockpit ; `npm run test:all` et `npm run test:convergence` côté GUI).
- [ ] **CA-14** — `.github/workflows/release.yml` **n'est pas** au registre de convergence, et les
      **deux écarts** (l. 72, l. 96-99) sont **nommés** dans le rapport avec le successeur
      `CONVERGENCE-RELEASE-YML-ALIGNEMENT`. *Vérif* : `grep -c release.yml
      fixtures/convergence.sha256` → `0`.

### Le registre — l'instrument dit ce qu'il fait

- [ ] **CA-15** — Les **deux phrases fausses** sont corrigées **en les datant**. La clé `"//"` du
      JSON énumère **sept** détections + le cliquet ; l'en-tête du `.js` dit **cinq** passages et
      **date** la mention « TROIS ». *Vérif* : lecture des deux lignes + `git diff`.
- [ ] **CA-16** — **D-8** : retourner une clé de prose du registre fait **rougir nommément**.
      *Vérif* : mutation sur `"//"`, rouge cité, révocation prouvée au `sha256` de la fixture.
- [ ] **CA-17** — **Exclusion en masse fermée** : réécrire une ligne du motif dans un fichier
      auparavant exclu au niveau fichier fait rougir **D-6**. *Vérif* : mutation sur
      `cli/scripts/registre-repli-latest.js` — **le fichier même par lequel la phrase fausse a
      survécu** — rouge nommé, révocation prouvée.
- [ ] **CA-18** — La mesure des extensions est **refaite par l'instrument** (pas par `ripgrep`) et
      citée : nombre de fichiers et de lignes pour `.json`, `.toml`, `.html`, `.txt`, par dépôt. Les
      trois dernières sont **déclarées hors couverture** avec motif et condition de levée. *Si le
      chiffre contredit la mesure du § R-4, c'est le chiffre de l'instrument qui fait foi, et
      l'écart s'écrit.*
- [ ] **CA-19** — `node cli/scripts/registre-repli-latest.js` rend **`0` CONFORME** à la fin du lot,
      **cette instruction incluse** au registre, ses lignes du motif **triées à la main**. *Vérif* :
      sortie citée + compte d'entrées avant/après.

### Consignation

- [ ] **CA-20** — Les **quatre** cartouches, **trois** `CLAUDE.md` et **trois** états des lieux
      décrivent le job **tel qu'il est après ce lot**, avec la date, sans effacer l'antérieur.
      *Vérif* : les dix emplacements listés en `chemin:ligne` dans le rapport.
- [ ] **CA-21** — Suites vertes, **chaque commande sur sa ligne, avec son code de sortie et son
      chiffre** : Cockpit `npm run test` puis `bash scripts/quality.sh` ; GUI `npm run lint:all`,
      `npm run test:all`, `npm run test:rust`. **Une formule d'ensemble vaut FAIL.**

### Consignation des mesures — **neufs, 2026-09-01**

- [ ] **CA-22** — **Le tableau des cinq écritures** (`true` via `gh` : agit · `false` via `gh` :
      inerte · `false` via `PATCH` : inerte · `legacy` via `PATCH` : **agit** · `legacy` via `gh` :
      **inatteignable**, drapeau booléen) figure dans les **quatre** cartouches **et** les **trois**
      `CLAUDE.md`, avec la date de chaque mesure et l'`id` de release du banc. *Vérif* : les sept
      emplacements en `chemin:ligne`. **Omettre la ligne « inatteignable » vaut FAIL** : c'est le
      piège que le prochain lecteur rencontrera en premier.
- [ ] **CA-23** — Le résidu consigné dit **exactement** ce que la mesure autorise :
      *« la règle de repli existe, elle vit sous `legacy`, elle n'est pas dirigée par la date la plus
      récente, **et sa formule reste inconnue — les deux releases mesurées étant du même jour** »*.
      ⚠️ **Écrire « elle n'est pas dirigée par la date » SANS la réserve du grain du jour vaut
      FAIL** — c'est un « OK sans chiffre » déguisé en conclusion.
- [ ] **CA-24** — La phrase de la doc GitHub sur `GET /releases/latest` (*« sorted by the `created_at`
      attribute »*) est consignée comme **réfutée par mesure**, avec **les deux** observations qui la
      réfutent (le `latest` avant M1, et après M3b, tous deux sur le `created_at` le plus **ancien**),
      et avec la note que **`created_at` est une date de commit**. *Vérif* : cartouche cité en
      `chemin:ligne`.

---

## Arbitrages — TRANCHES par le decideur le 2026-08-31

> **Les six arbitrages sont TRANCHES : le decideur a valide l'instruction sur ses recommandations.**
> Le tableau se lit comme la **decision**. Si l'execution rencontre un cas qu'aucun arbitrage ne
> couvre, elle **s'arrete et remonte** — elle ne tranche pas a la place du decideur.
>
> **AR-2 en particulier est tranche sur la voie prudente** : les trois ecritures de mesure sur le banc
> prive sont **jouees AVANT toute ligne de code**, et **(2b) ne sera entrepris que si la mesure le
> justifie**. Ce sont des actes du decideur — les actes de release sont refuses aux agents.
>
> ⚠️ **Ce que cette mesure peut renverser, et c'est pourquoi elle passe en premier** : le NO-OP est
> etabli sur l'ecriture **`false`**. **Personne n'a jamais verifie que `--latest` tout court fasse
> quelque chose.** Si l'ecriture `true` est inerte elle aussi, **le rattrapage que le job imprime est
> un mensonge** — et le lot change de nature au premier geste, avant tout code.
>
> **Note d'execution** : cette instruction entre dans le corpus et porte des lignes du motif. Le
> verificateur `registre:repli-latest` **rougira en D-3** (fichier neuf dans le vocabulaire) tant que
> le tri a la main n'aura pas ete fait — c'est **correct et voulu**, c'est une etape du lot, jamais un
> `--ecrire`.
>
> Relaye par [PORTEFEUILLE][Odin].
>
> ✅ **AR-2 est CONSOMMÉ le 2026-09-01** : les trois écritures sont jouées, le banc est restauré et
> relu, **aucune ligne de code n'a été écrite entre-temps** — la voie prudente a été tenue à la
> lettre. Et elle a payé : **la mesure a renversé une prémisse avant qu'un seul octet de code ne soit
> posé dessus.** ⚠️ **Mais elle n'a pas renversé celle qu'on attendait.** L'avertissement ci-dessus
> guettait M1 (*« personne n'a vérifié que `--latest` tout court fasse quelque chose »*) : **M1 est
> verte**. C'est **M3** qui a renversé, sur un point que ce cadrage ne surveillait pas — `false`
> n'était pas le seul levier de relâchement. **La leçon est à écrire telle quelle : la mesure qui
> sert n'est pas toujours celle qu'on redoutait.**


> Recommandation donnée, **décision non prise**. Si l'exécution rencontre un cas qu'aucun arbitrage
> ne couvre, elle **s'arrête et remonte**.

| # | Question | Options | Recommandation |
|---|---|---|---|
| **AR-1** | **Que devient le job `latest` ?** | (a) statu quo, documenté honnêtement · (b) **(2a)** seul — corriger le référent · (c) **(2a) + (2b)** conditionnée à M1 · (d) le retirer | **(c)**. (a) laisse en place un faux rouge **et** une dictée impossible (R-2) : documenter un défaut n'est pas le traiter. (b) est le minimum honnête et **suffit si M1 est rouge**. (d) est à écarter : c'est le **seul détecteur**, et un détecteur qui rougit vaut mieux qu'un silence. **La condition sur M1 est le cœur de la reco** : on ne remplace pas une branche prouvée inerte par une branche non mesurée. |
| **AR-2** | **Le décideur joue-t-il M1/M2/M3 sur le banc ?** | (a) les trois · (b) M1 seule · (c) aucune — le lot se limite à (2a) | **(a)**. Coût : trois écritures et quatre lectures sur un dépôt **privé, jetable, fabriqué pour ça**, restauré par le geste même qu'on veut prouver. **M1 décide du lot** ; M2 et M3 **rétrécissent le résidu** que six passages de gate ont laissé ouvert, pour ~5 min de plus. (c) est cohérente mais laisse le lot borné à la moitié de son objet. |
| **AR-3** | **Comment couvrir le bloc `latest:` des deux dépôts ?** | (a) aligner `release.yml` en entier et l'inscrire (17 → 18) · (b) **fixture `bloc-latest.sha256`** + garde locale des deux côtés + inscrire la fixture · (c) ne rien faire, déclarer | **(b)**. (a) obligerait à trancher **en passant** si le GUI gagne trois dépendances de build — une décision de build, dont la preuve exige un run de CI : exactement le « tant qu'on y est » proscrit. (b) aligne **délibérément** un artefact **créé pour être aligné**, ferme le trou du GUI **dans son gate**, hors réseau, et fait de la fixture le référent unique **y compris pour le banc**. (c) laisse le défaut mesuré ouvert. |
| **AR-4** | **L'exclusion en masse des 13 fichiers.** | (a) abolir `horsCouverture` — tout fichier touché devient couvert · (b) **la garder, mais l'ancrer ligne à ligne** (empreinte + motif par ligne) · (c) successeur | **(b)**. Même pouvoir de détection que (a) — D-6 et D-7 s'appliquent — pour une fraction de la chirurgie sur l'instrument. **MVP d'abord.** (c) est à écarter : c'est **par ce trou précis** que la phrase fausse de `registre-repli-latest.js:5` a survécu à six passages ; le renvoyer plus loin serait reconduire la cause. |
| **AR-5** | **Les extensions non balayées.** | (a) ajouter `.json` au balayage · (b) **D-8** — tenir les clés de prose du registre + **déclarer** `.toml/.html/.txt` avec la mesure · (c) successeur | **(b)**, **et c'est la mesure qui tranche** : `.json` ne ramène **qu'un fichier** sur les trois dépôts — le registre lui-même — pour **372 lignes** qui sont, par construction, des **extraits** de lignes déjà inscrites ailleurs. (a) importerait 372 déclarations pour fermer un trou qui en vaut sept. (b) ferme la phrase fausse **et** tout futur mensonge de l'en-tête, pour un ensemble **clos**. |
| **AR-6** | **Les deux phrases d'ancrage fausses : ici ou successeur ?** | (a) **ici** · (b) successeur | **(a)**. Elles sont **la classe même** de ce lot — une chose qui ne dit pas ce qu'elle fait —, elles vivent **dans l'instrument**, et l'une d'elles est **dans le fichier que ce lot réécrit de toute façon**. Coût : deux corrections de prose. Les différer serait re-cadrer l'honnêteté d'un job en laissant l'instrument mentir sur lui-même. |

> **Effet des mesures sur les six arbitrages tranchés — 2026-09-01.** **AR-3, AR-4, AR-5, AR-6 sont
> intacts** : rien de ce qui a été mesuré ne les touche. **AR-2 est consommé** (ci-dessus). **AR-1
> se résout** : sa branche (c) était *« (2a) + (2b) **conditionnée à M1** »*, **la condition est
> satisfaite** — donc (2a) **et** (2b) sont dus, et sa réserve *« (b) suffit si M1 est rouge »*
> devient **sans objet**. ⚠️ **Mais AR-1 ne dit rien de la FORME de (2b)** : il opposait « le
> corriger » à « ne pas le corriger », pas `--latest` à `legacy`. **C'est le vide qu'AR-7 comble**, et
> c'est pourquoi il est **neuf** et non une relecture d'AR-1.

### Arbitrages OUVERTS par les mesures — 2026-09-01 — recommandation donnée, **décision NON prise**

> Les six arbitrages du 2026-08-31 **tiennent**. Les deux suivants étaient **neufs** : ils n'existaient
> pas quand le décideur a tranché, parce que **la mesure les a créés**.
>
> ✅ **TRANCHÉS PAR LE DÉCIDEUR le 2026-09-01 — les deux sur la recommandation :**
>
> - **AR-7 = (a) — (2b-i), ré-affirmer `--latest` sur `PLUS_HAUT`.** `legacy` **n'entre pas dans le
>   programme** ; il entre dans les **cartouches** (CA-22) comme une connaissance mesurée. Le motif
>   retenu est le premier de la recommandation : `--latest` rend `latest` et `PLUS_HAUT` égaux **par
>   construction**, donc la garde ne peut pas rougir après sa propre écriture. **R8 est sans objet.**
> - **AR-8 = (a) — pas de quatrième mesure avant de coder.** Le résidu s'écrit **à la précision de
>   M1-M3**, réserve du « même jour » incluse (CA-23). **M4 n'est PAS un gate du lot** ; si elle est
>   jouée un jour, ce sera **hors du chemin critique** et par le décideur seul.
>
> **P2 est donc OUVERT.** L'exécution ne tranche toujours rien : ces deux lignes sont la décision, pas
> une lecture de l'exécution.

| # | Question | Options | Recommandation |
|---|---|---|---|
| **AR-7** | **Quel remède, dans la branche du vol ?** | (a) **(2b-i)** ré-affirmer `--latest` sur `PLUS_HAUT` · (b) **(2b-ii)** écrire `make_latest=legacy` par `PATCH` · (c) les deux | **(a)**, et fermement. Quatre motifs, du plus fort au plus faible. **1. (2b-ii) ne peut pas satisfaire l'invariant du job.** `VERIFICATION` compare `latest` à `PLUS_HAUT` : `--latest` les rend égaux **par construction**, `legacy` seulement **par coïncidence** — et **précisément pas dans le cas que le job traite**, puisque après un build rouge le plus haut semver **porteur d'une release** n'est pas forcément ce que la formule choisit. **Un remède qui peut faire rougir la garde APRÈS sa propre écriture n'est pas un remède.** **2. La formule est inconnue** (§ Mesures) : déléguer à une règle non caractérisée dans le seul chemin de réparation, c'est remplacer un NO-OP **mesuré** par une écriture **non déterministe**. **3. Coût de surface** : `legacy` est **inatteignable par `gh`** (M3a) ; l'employer impose `gh api -X PATCH` **et** un `id` de release — que le job **n'a pas**, il manipule des **tags**. Donc une résolution `tag → id` de plus, un appel de plus, un mode d'échec de plus, dans un job en `if: always()` qui tourne **aussi quand la release n'existe pas**. **4. Persistance non mesurée** : si `legacy` installe un **état**, le job laisserait le pointeur « en calcul », donc **re-volable** par la création suivante. Non mesuré ⇒ non posable. **(c) est à écarter** : deux écritures dont la seconde peut défaire la première. **`legacy` a gagné sa place dans les CARTOUCHES (CA-22), pas dans le programme** — c'est une **connaissance**, pas un remède. |
| **AR-8** | **Faut-il une quatrième mesure avant de coder ?** | (a) **non** — écrire le résidu à la précision mesurée et coder · (b) **M4** : une troisième release, **d'un autre jour** · (c) M4 **+** une mesure de persistance de `legacy` | **(a) si AR-7 = (a) — et c'est ma reco d'ensemble.** Sous (2b-i), la formule de `legacy` n'entre dans **aucune ligne de code** : elle n'entre que dans **une phrase**, et cette phrase s'écrit **honnêtement** à la précision de M1-M3 (CA-23). **Attendre M4 pour coder serait retarder le lot au nom d'une connaissance dont le lot n'a pas besoin.** ⚠️ **(b) devient OBLIGATOIRE si AR-7 = (b)** : on ne délègue pas la réparation à une formule qu'on n'a pas caractérisée. **(c) est à écarter ici** : la persistance de `legacy` n'a de conséquence que sous (2b-ii) — sous (2b-i), c'est un successeur, pas un prérequis. **Si le décideur veut M4 pour elle-même** — elle coûte ~5 min, elle est sans risque, le banc est en état et **la fenêtre « autre jour » est ouverte aujourd'hui** — la jouer **hors du chemin critique**, en parallèle du code, **jamais comme un gate du lot**. Ce qu'elle prouve et **ce qu'elle ne prouve pas** est écrit en § M4 : elle tranche **date-au-grain-du-jour vs semver**, et **rien d'autre**. |

---

## Estimation — jalon P1→P2

**Équivalent jour-homme : ≈ 2 j** *(fourchette 1,5 à 3 j)*, dont **~15 min de gestes du décideur**
(les cinq 👤 de l'étape 1). → ⚠️ **Chiffres du 2026-08-30. Lire la ré-estimation encadrée
ci-dessous** : au 2026-09-01 la fourchette est **1,5 → 2,5 j**, le **reste à faire ≈ 1,85 j**, et les
**15 min du décideur sont DÉPENSÉES**.

| Étape | Charge |
|---|---|
| 1. Mesures du banc (préparation, lectures, consignation, réécriture du résidu) | 0,15 j *(+ 15 min décideur)* |
| 2. Référent (2a) : deux dépôts + banc + contrefactuel A/B | 0,3 j |
| 3. Ré-affirmation (2b) + preuve de bout en bout sur le banc | 0,2 j *(0 si M1 rouge)* |
| 4. Fixture + extracteur + gardes locales + convergence 17 → 18 + deux faces × deux dépôts | 0,45 j |
| 5. Registre : phrases datées, D-8, ancrage des 13, déclarations, triage de cette instruction | 0,5 j |
| 6. Contrefactuels de chaque garde touchée (CA-11, 12, 16, 17) + révocations prouvées | 0,25 j |
| 7. Consignation : 4 cartouches, 3 `CLAUDE.md`, 3 états des lieux, 3 backlogs | 0,25 j |

> ⚠️ **RÉ-ESTIMÉ le 2026-09-01.** L'enveloppe **ne bouge pas ; la fourchette se resserre**, et la
> répartition change.
>
> | | 2026-08-30 | 2026-09-01 |
> |---|---|---|
> | **Enveloppe** | ≈ **2 j** (1,5 → **3 j**) | ≈ **2 j** (1,5 → **2,5 j**) |
> | **Reste à faire** | 2 j | ≈ **1,85 j** — l'étape 1 est **dépensée** (0,15 j + les 15 min du décideur) |
> | **Étape 3** | 0,2 j *ou 0 si M1 rouge* | **0,2 j, ferme** — M1 est verte, l'étape est due |
> | **Étape 7 (consignation)** | 0,25 j | **0,35 j** — +0,1 j : le tableau des cinq écritures × **sept** emplacements, la réfutation de la doc, le résidu réécrit (CA-22/23/24) |
>
> **Pourquoi le haut de fourchette tombe de 3 j à 2,5 j** : l'inconnue n°1 — *l'écriture `true`
> a-t-elle un effet ?* — **est éteinte**. C'était **la** branche qui pouvait ajouter au lot un volet
> non estimé (« que dicter, si le geste dicté ne marche pas ? »). Elle ne peut plus s'ouvrir. **C'est
> le rendement exact d'AR-2 : 15 min de mesure ont retiré une demi-journée de queue de risque.**
>
> **Ce qui peut encore faire glisser, et n'existait pas** : **AR-7 = (2b-ii)** ⇒ **+0,3 à 0,4 j**
> (résolution `tag → id`, un mode d'échec de plus à éprouver, **M4 en prérequis**, et une preuve de
> bout en bout qui n'est plus acquise par construction). **AR-8 = (b) joué hors chemin critique**
> ⇒ +0,05 j d'agent et ~5 min du décideur.

**Complexité / risque : moyenne-haute.** Peu de code — l'essentiel est de la **mesure disciplinée**
et de l'édition coordonnée **dans deux dépôts au même commit logique**, sous un instrument qui
rougit à raison. Le risque n'est pas technique : c'est de **poser (2b) sur un espoir** au lieu d'une
mesure, ce que six passages de gate ont sanctionné sur ce chantier.

**Inconnues susceptibles de faire glisser l'estimation**

1. ✅ **ÉTEINTE le 2026-09-01.** ~~**M1 — l'écriture `true` a-t-elle un effet ?**~~ *Elle en a un.*
   *(Rédaction d'origine, conservée : « Si non, (2b) tombe **et** le rattrapage imprimé est révélé
   faux : le lot gagne un volet **non estimé** — que doit dire un détecteur qui n'a plus aucun geste
   correct à dicter ? **Détectée au premier geste**, avant toute ligne de code : c'est ce qui borne
   le risque. »)* **Le pari a été tenu : détectée au premier geste, avant toute ligne de code.**
1bis. **NEUVE — la forme du remède (AR-7), et sous (2b-ii) la formule de `legacy`.** Si le décideur
   tranche sur `legacy`, le lot acquiert **M4 en prérequis**, une résolution `tag → id`, un mode
   d'échec supplémentaire, et **perd la garantie par construction** que `VERIFICATION` reste verte
   après l'écriture du job. **C'est la seule inconnue qui puisse encore déplacer l'enveloppe.**
2. **Le nombre de lignes du motif dans les 13 fichiers exclus** n'est **pas mesuré** — l'étape 5.3
   se fait à la main, et son volume est inconnu. Fourchette assumée : de quelques lignes à quelques
   dizaines.
3. **La stabilité de l'extraction par marqueur** : le bloc `latest:` est aujourd'hui **le dernier**
   du fichier. Si un lot futur en ajoute un après, la règle « jusqu'à EOF » devient fausse. CA-11 la
   fait rougir plutôt que deviner, mais la re-spécifier coûterait un incrément.
4. **La copie du banc est une troisième copie** du bloc. La maintenir alignée suppose un commit de
   banc **et** un `gh workflow run` — un acte refusé aux agents. Chaque itération de l'étape 2 ou 3
   coûte donc un aller-retour avec le décideur.
5. **Ma mesure des extensions** (R-4) a été prise avec `ripgrep`, pas avec l'instrument. Si CA-18
   la contredit, AR-5 change de coût.
6. **Les gardes existantes vont rougir pendant le lot**, à raison (empreintes des cartouches, des
   `CLAUDE.md`, des lignes 173/176/192). Le temps de tri et de re-inscription **à la main** est
   compté en 5.5, mais il dépend du nombre d'énoncés que les rectifications de l'étape 6 déplacent.
7. **La dette de canal et le CI d'`iakaframe`** sont exclus — mais si le décideur y touche pendant
   ce lot, l'estimation ne vaut plus.

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## Ce que ce lot ne prouvera pas, quoi qu'il arrive

À écrire dans le rapport final, **avant** de cocher quoi que ce soit :

1. **Que la garde empêche le vol.** Elle ne l'empêchera toujours pas : la release est créée avant
   que le job démarre (F2, L43). Au mieux, ce lot la fait **réparer** — ce qu'elle ne fait pas
   aujourd'hui. La fenêtre passe de « jusqu'au geste manuel du décideur » à « la durée du job », et
   **c'est tout ce qu'il y a à gagner**.
2. **Que quoi que ce soit vaut sur `IakaCockpit`.** Tout ce qui est mesuré ici l'est sur un **banc
   privé du même compte**, avec un acteur substitut (`gh release create`) et non `tauri-action`.
   La transposition reste l'objet de **CA-5**, et **CA-5 reste dû**.
3. **Que le résidu est clos.** ~~Même si M2 localise le NO-OP et M3 éclaire `legacy`, **une règle non
   énumérée reste possible** : l'énumération est une liste, jamais une preuve d'exhaustivité.~~
   → **RÉÉCRIT le 2026-09-01, mesures faites.** Le résidu **(2) est refermé** — le NO-OP est dans la
   **sémantique de la valeur `false`** côté API — à une **échappatoire nommée** près. Le résidu
   **(1) a changé de nature** : ce n'est plus *« une règle non énumérée reste possible »*, c'est
   **« la règle existe, elle vit sous `legacy`, elle n'est pas dirigée par la date la plus récente,
   et sa FORMULE reste inconnue »**. ⚠️ **Ce que le lot ne prouvera toujours pas** : cette formule.
   Même M4 ne la rendrait pas — elle trancherait *un* facteur (le grain du jour) et laisserait
   entières la fenêtre de récence, la pondération, le traitement des préversions, la **persistance**
   de `legacy` et son comportement **à la création**. *L'énumération reste une liste, jamais une
   preuve d'exhaustivité — elle est simplement plus courte.*
3bis. **Que la DOC de GitHub décrive le comportement de son propre endpoint.** Mesuré le
   2026-09-01 : la phrase *« sorted by the `created_at` attribute »* de `GET /releases/latest` est
   **réfutée deux fois par le banc** (§ Mesures du banc). Ce lot **constate** cet écart et le
   consigne (CA-24) ; il ne prétend ni l'expliquer, ni le voir corrigé, ni savoir depuis quand il
   dure. *(À ne pas confondre avec le point 4 : celui-ci porte sur la **doc de l'API**, celui-là sur
   le **badge de l'interface web**. Ni l'un ni l'autre n'est établi.)*
4. **Que le badge « Latest » de l'interface web suit `GET /releases/latest`.** Rien n'est mesuré
   là-dessus, ici pas plus qu'avant.
5. **Que le comportement vaut pour une autre version de l'API**, ou pour un autre SHA de
   `tauri-action` : tout est établi **au SHA `84b9d35b…`**, et `fixtures/tauri-action-pin.json`
   est ce qui force à re-prouver au suivant.
6. **Que H-1 est fermé.** R-2 — le défaut central de ce lot — vit sur une ligne **sans un mot du
   motif**. Il a été trouvé **à la lecture**. *La complétude est celle du MOTIF, jamais celle du
   SENS.* **La lecture reste dans la boucle.**
