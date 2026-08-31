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

---

## Décision retenue — recommandation, non arbitrage

**Recommandation : mesurer d'abord, renforcer ensuite, et ne renforcer que ce que la mesure
autorise.** Trois volets, dans cet ordre, le second conditionné au premier.

### (1) La mesure du banc — trois écritures, zéro produit, ~15 min du décideur

Le banc `iakasju/latest-contrefactuel` est **privé, conservé, et fabriqué pour ça** (AR-4 de L43).
Son état est connu à six valeurs près : `latest = v0.10.0` (`id 379113276`, plus haut semver) et
`v0.9.0` (`id 379113280`, plus récente sur les deux dates, plus grand `id`). Trois écritures, chacune
suivie d'une lecture :

| # | Écriture | Ce qu'elle tranche | Si le `latest` bouge | Si non |
|---|---|---|---|---|
| **M1** | `gh release edit v0.9.0 --latest` | **l'écriture `true` a-t-elle un effet ?** | le rattrapage imprimé par le job **fonctionne** — et l'asymétrie `true` ≠ `false` est établie | **le rattrapage que le job dicte est un mensonge** — défaut majeur, remède à re-cadrer |
| **M2** | `gh api -X PATCH repos/iakasju/latest-contrefactuel/releases/379113276 -f make_latest=false` | **où siège le NO-OP** (E-2) | le NO-OP est **dans `gh`**, pas dans l'API — résidu (2) refermé | le NO-OP est dans l'API ou la lecture — résidu (2) réduit d'un cran |
| **M3** | `gh release edit v0.9.0 --latest=legacy` puis lecture | **le régime `legacy` de E-1** | les règles date/semver **existent**, sous un drapeau qu'on n'emploie pas — résidu (1) nommé | `legacy` non plus ne bouge rien : à consigner tel quel |

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
   recommandation.
2. **(2a)** correction du référent `PLUS_HAUT` dans les **deux** `release.yml`, et dans la copie du
   banc.
3. **(2b)** ré-affirmation inconditionnelle `--latest` sur `PLUS_HAUT`, **si et seulement si M1
   l'autorise**.
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

### 1. Les mesures du banc — l'agent prépare, 👤 le décideur exécute

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
conséquence — points (1) et (2) — ou **écrire qu'il est inchangé, avec le motif**.

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

### 3. La ré-affirmation (2b) — **seulement si M1 est verte**

3.1 Remplacer la branche `--latest=false` par `gh release edit "$PLUS_HAUT" --latest`, dans les
deux dépôts au même commit logique. **Ne pas toucher la ligne `VERIFICATION`.**

3.2 Rejouer sur le banc la **séquence complète** : vol réel (`gh release create` sans `--latest`)
→ job → lecture. **Attendu** : `VERIFICATION` **verte**, `latest` rendu à `PLUS_HAUT` **dans le
même run**. Log cité.

3.3 **Si M1 est rouge** : ne rien changer au programme, écrire dans les quatre cartouches que le
rattrapage dicté **est mesuré sans effet**, et **nommer un successeur** — le job dicterait alors un
geste inutile, ce qui est un défaut de plein droit.

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

---

## Risques

- **R1 — M1 réfute (2b).** L'écriture `true` est elle aussi inerte. *Détection* : étape 1.2.
  *Conséquence* : (2b) tombe, le lot gagne un volet **non estimé** (que dicter, si le geste dicté ne
  marche pas ?). **C'est le risque principal**, et il est détecté au premier geste du lot — avant
  toute écriture de code. *Mitigation* : l'ordre des étapes est fait pour ça.
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

- [ ] **CA-1** — **M1 est mesurée.** Trois valeurs citées : lecture avant, commande, lecture après.
      *Vérif* : `gh release edit v0.9.0 --latest --repo iakasju/latest-contrefactuel` puis
      `gh api repos/iakasju/latest-contrefactuel/releases/latest --jq .tag_name`. **Le verdict est
      écrit dans les deux sens** : « l'écriture `true` a un effet » ou « elle n'en a pas ».
- [ ] **CA-2** — **M2 est mesurée**, et le rapport **nomme où siège le NO-OP** parmi : transport
      `gh` · écriture API · lecture. *Vérif* : `gh api -X PATCH repos/…/releases/<id> -f
      make_latest=false` + lecture, `<id>` relu en 1.1 et cité.
- [ ] **CA-3** — **M3 est mesurée, ou déclarée non mesurée avec son motif.** Si `legacy` est
      accepté, le rapport dit si les règles date/semver s'appliquent alors — c'est le candidat E-1.
- [ ] **CA-4** — Le **résidu** (1) et (2) est **réécrit et daté** en fonction de CA-1/2/3, dans les
      trois `CLAUDE.md` **et** dans les quatre cartouches — ou **déclaré inchangé avec motif**.
      *Vérif* : `git diff` des sept emplacements.

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

### La ré-affirmation — posée seulement si elle est autorisée

- [ ] **CA-8** — **Si CA-1 est verte** : la branche du vol émet `gh release edit "$PLUS_HAUT"
      --latest`. **Si CA-1 est rouge** : le programme est **inchangé** et les quatre cartouches
      **écrivent** que le rattrapage dicté est mesuré sans effet, avec un successeur nommé.
      *Vérif* : `git diff` du bloc + lecture des cartouches. **Les deux issues sont des PASS ; poser
      (2b) sans CA-1 est un FAIL.**
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

---

## Estimation — jalon P1→P2

**Équivalent jour-homme : ≈ 2 j** *(fourchette 1,5 à 3 j)*, dont **~15 min de gestes du décideur**
(les cinq 👤 de l'étape 1).

| Étape | Charge |
|---|---|
| 1. Mesures du banc (préparation, lectures, consignation, réécriture du résidu) | 0,15 j *(+ 15 min décideur)* |
| 2. Référent (2a) : deux dépôts + banc + contrefactuel A/B | 0,3 j |
| 3. Ré-affirmation (2b) + preuve de bout en bout sur le banc | 0,2 j *(0 si M1 rouge)* |
| 4. Fixture + extracteur + gardes locales + convergence 17 → 18 + deux faces × deux dépôts | 0,45 j |
| 5. Registre : phrases datées, D-8, ancrage des 13, déclarations, triage de cette instruction | 0,5 j |
| 6. Contrefactuels de chaque garde touchée (CA-11, 12, 16, 17) + révocations prouvées | 0,25 j |
| 7. Consignation : 4 cartouches, 3 `CLAUDE.md`, 3 états des lieux, 3 backlogs | 0,25 j |

**Complexité / risque : moyenne-haute.** Peu de code — l'essentiel est de la **mesure disciplinée**
et de l'édition coordonnée **dans deux dépôts au même commit logique**, sous un instrument qui
rougit à raison. Le risque n'est pas technique : c'est de **poser (2b) sur un espoir** au lieu d'une
mesure, ce que six passages de gate ont sanctionné sur ce chantier.

**Inconnues susceptibles de faire glisser l'estimation**

1. **M1 — l'écriture `true` a-t-elle un effet ?** *(inconnue de fond)* Si non, (2b) tombe **et** le
   rattrapage imprimé est révélé faux : le lot gagne un volet **non estimé** — que doit dire un
   détecteur qui n'a plus aucun geste correct à dicter ? **Détectée au premier geste**, avant toute
   ligne de code : c'est ce qui borne le risque.
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
3. **Que le résidu est clos.** Même si M2 localise le NO-OP et M3 éclaire `legacy`, **une règle non
   énumérée reste possible** : l'énumération est une liste, jamais une preuve d'exhaustivité.
4. **Que le badge « Latest » de l'interface web suit `GET /releases/latest`.** Rien n'est mesuré
   là-dessus, ici pas plus qu'avant.
5. **Que le comportement vaut pour une autre version de l'API**, ou pour un autre SHA de
   `tauri-action` : tout est établi **au SHA `84b9d35b…`**, et `fixtures/tauri-action-pin.json`
   est ce qui force à re-prouver au suivant.
6. **Que H-1 est fermé.** R-2 — le défaut central de ce lot — vit sur une ligne **sans un mot du
   motif**. Il a été trouvé **à la lecture**. *La complétude est celle du MOTIF, jamais celle du
   SENS.* **La lecture reste dans la boucle.**
