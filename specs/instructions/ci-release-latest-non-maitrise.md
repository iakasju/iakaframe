# CI-RELEASE-LATEST-NON-MAITRISE — le `make_latest` n'est pas inerte : il est calculé à `false`

> ⚠️ **Le titre de l'item de backlog dit « n'a PAS agi » / « inerte ».** Ce cadrage **réfute**
> cette lecture au § 2 : le drapeau **agit parfaitement** — il est **calculé à `false`** par une
> comparaison devenue impossible à satisfaire. Le titre d'origine est **conservé comme
> identifiant du lot**, il n'est **pas** repris comme diagnostic.

> Cadrage 🔵 Gandalf, 2026-09-08. Ordre de mission d'Aragorn (REPRISE : un premier cadreur
> s'est figé avant d'écrire une ligne — cause harnais, pas sujet).
> Lot successeur légitime : `CI-RELEASE-AUCUN-EPINGLAGE` (traité **dans ce lot**, même fichier).

---

## § 0 — Conditions de ce cadrage (à lire avant tout le reste)

### 0.1 — Le cadreur n'a PAS de shell. Déclaré, pas contourné.

Ce cadrage a été produit **sans aucun accès à un terminal** : pas de `gh`, pas de `git`, pas de
`npm`, pas de `curl`, aucun accès réseau non plus (pas de `WebSearch`/`WebFetch` sur ce lot —
tout ce qu'il fallait était sur le disque). **Tout ce qui suit est établi par LECTURE de fichiers
du disque**, jamais par exécution.

Conséquence, écrite une fois pour toutes et jamais contournée ailleurs dans ce document :

- Ce qui est **lu** est présenté comme lu, avec `chemin:ligne`.
- Ce qui **exige une exécution ou un appel réseau** (log d'un run, contenu d'une API, valeur
  effective d'une expression GitHub Actions au moment du run) est présenté comme **NON MESURÉ**
  et renvoyé à l'**étape 0 de ⚒️ Gimli** (§ 5.0). Un cadrage ne devine pas une mesure : il la
  commande.
- Aucune affirmation de ce document ne doit être lue comme « vérifié en CI ». Ce lot **commence**
  par une mesure, et la voie retenue peut être révisée par elle (§ 5.0, cliquet **CA-L1**).

### 0.2 — Ce que le cadreur a effectivement lu

| Source | Ce qui en est tiré |
|---|---|
| `iakaframe/.github/workflows/release.yml` (216 l., lu en entier) | forme du job unique `package`, étape `rang`, étape `softprops`, étape « Vérifier », les trois `uses:` flottants |
| `iakaframe/BACKLOG.md` § Ouverts | l'item `CI-RELEASE-LATEST-NON-MAITRISE` (l. 13-31), `CI-RELEASE-AUCUN-EPINGLAGE` (l. 270-288), `M-4` (l. 33-58) |
| `iakaInstall/.github/workflows/release.yml` (375 l., lu en entier) | le patron `publier` par **id** (`gh api -X PATCH … -F draft=false`), le job `latest` qui **exécute** le rattrapage |
| `iakaInstall/CLAUDE.md` § Backlog | le récit du run `34026373514` (fail-safe prouvé, `publier` corrigé) |

### 0.3 — Faits attribués (Aragorn, 2026-09-08), repris tels quels

Deux publications, **deux fois le même défaut** :

- **`v0.40.0`** — run `33959443438`, 2026-09-05. Release + asset créés en **16 s**
  (tag poussé 09:59:39Z → release 09:59:55Z). À 09:59:56Z, `releases/latest` répondait encore
  **`v0.39.0`**. L'étape « Vérifier ce qu'est devenu le latest » du job unique `package` a
  **rougi** (`exit 1`) et nommé le rattrapage. Rattrapage manuel appliqué :
  `gh release edit v0.40.0 --latest` → OK.
- **`v0.41.0`** — run `34001818646`, 2026-09-06. **Identique** : `latest` resté sur `v0.40.0`,
  même rougeur, même rattrapage manuel.

**Lecture d'Aragorn, reprise telle quelle** : la garde fait exactement son travail (elle détecte,
elle rougit, elle dicte) ; le `make_latest` **calculé** passé à `softprops` est **inerte**. Ce
n'est plus une hypothèse : c'est un défaut **reproduit deux fois de suite**, sur deux tags
consécutifs.

⚠️ **Ce cadrage retient le CONSTAT et réfute le QUALIFICATIF.** « Reproduit deux fois » est
confirmé et central. « Inerte », en revanche, ne résiste pas à la lecture du fichier : le
drapeau **agit**, et c'est **la valeur qu'on lui donne** qui est fausse (§ 2.1). La nuance n'est
pas de style — elle **change la voie** : on ne répare pas de la même façon un drapeau ignoré et
un drapeau bien transmis mais mal calculé.

### 0.4 — Corpus antérieur mobilisé (cartouches `release.yml` l. 39-140, backlog)

Le tableau des **cinq écritures** (banc privé `iakasju/latest-contrefactuel`, mesures des
2026-08-29 et 2026-09-01), lu à `.github/workflows/release.yml:77-81` :

| Geste | Effet | Réf. |
|---|---|---|
| `gh release edit <tag> --latest` (true) | **AGIT** | M1, 2026-09-01 |
| `gh release edit <tag> --latest=false` | inerte | 2026-08-29 (L43) |
| `PATCH` brut `make_latest=false` | inerte | M2, 2026-09-01 |
| `PATCH` brut `make_latest=legacy` | **AGIT** | M3b, 2026-09-01 |
| `gh release edit --latest=legacy` | **INATTEIGNABLE** (`--latest` est un booléen `strconv.ParseBool`) | M3a, 2026-09-01 |

Trois autres acquis du corpus, tous cités parce qu'ils **contraignent** la voie retenue :

1. L'acteur qui crée la release ici est **`softprops/action-gh-release`** — **pas** `tauri-action`.
   Il **DÉCLARE** `make_latest` (`release.yml:182`).
2. Ce que `softprops` fait d'une release **EXISTANTE** n'a **jamais** été mesuré
   (`release.yml:69-73`) — et c'est précisément la question ouverte ici.
3. Une **« course de douze minutes »** est notée au cartouche entre l'upload de l'asset et
   l'édition (`release.yml:56-59`). ⚠️ **Attention** : le backlog lui-même signale que cet
   observable est **imprécis** (item `D3-OBSERVABLE-ENREGISTREMENT`, `BACKLOG.md:257-268` — la
   preuve dure est « douze **jours** », pas douze minutes). Cette « course » ne doit donc **pas**
   servir d'explication au défaut présent sans mesure : elle est citée, elle n'est pas invoquée.

### 0.5 — Ce que la sœur `iakaInstall` a résolu, et pourquoi ce n'est PAS transposable tel quel

`iakaInstall` a fermé son propre problème de `latest` par une architecture en **trois jobs** :
`prepare` (crée un **brouillon** par `gh api -X POST … -F draft=true`, sort un `release_id`) →
`build` (matrice 4 plateformes, dépose sur l'`id`) → `publier` (`gh api -X PATCH
repos/<dépôt>/releases/<id> -F draft=false`) → `latest` (désigne, **exécute** `gh release edit
--latest`, re-mesure). Premier run réel le 2026-09-06 : le **fail-safe est prouvé**, `publier`
avait une erreur de syntaxe (`gh api --jq --arg`), corrigée depuis.

**`iakaframe` diffère structurellement** :

- **un seul job** (`package`), pas quatre ;
- **un seul asset** (le tarball npm), pas neuf bundles sur quatre OS ;
- donc **aucune course de matrice** à fermer, **aucune raison** de créer un brouillon puis de le
  publier : le motif du brouillon chez la sœur est *« qu'une release incomplète ne devienne jamais
  visible »*, et avec **un seul artefact produit par un seul job**, ce motif **n'existe pas ici**.

**Ce qu'on emprunte à la sœur** : la **jambe d'exécution** de la garde (faux `gh`, vrai `jq`),
son job `latest` qui **exécute** le rattrapage au lieu de l'imprimer, et la **leçon**
`gh api ... --jq --arg`. **Ce qu'on n'emprunte pas** : la tri-partition en jobs **ni**
l'adressage par `id` — celui-ci n'existe chez elle que parce qu'elle manipule des **brouillons**
(AR-2, raison 3). Transposer l'architecture entière serait une sur-ingénierie — un défaut au sens
de la méthode.

### 0.6 — Ce que ce cadrage NE prétend PAS savoir

- La **valeur effective** imprimée dans le log du run `34001818646` (étapes `rang` et `softprops`).
  → **NON MESURÉ**, § 5.0.
- Ce que `softprops` fait exactement d'une release **existante** vs **créée** au SHA courant de
  `@v2`. → **NON MESURÉ** (et non mesurable hors ligne : le tag `@v2` est **flottant**, il n'y a
  pas de source figée à lire — d'où la mesure **0.6** du § 5.0).
- Si l'API GitHub applique `make_latest` de façon **asynchrone** (16 s d'écart mesuré à
  `v0.40.0`). → **NON MESURÉ**.

---

## § 1 — Problème

Depuis deux publications consécutives, `iakaframe` **ne maîtrise pas** le pointeur
`releases/latest` : le tag publié est créé, son asset est attaché, mais `releases/latest`
reste sur la version **précédente**. Chaque publication exige donc un **rattrapage manuel**
(`gh release edit <tag> --latest`) par Aragorn, sous feu vert du décideur.

Ce qui est en jeu n'est pas cosmétique : `releases/latest` est **l'adresse d'installation**.
`cli/scripts/lib/vitrine.js` dérive le README de la version d'autorité, et
`cli/scripts/vitrine-en-ligne.js` mesure en **E-1** que « `latest` désigne le plus haut tag
publié ». Tant que le pointeur est en retard, **un visiteur qui installe « la dernière version »
installe la précédente** — silencieusement.

La garde, elle, **n'est pas en cause** : elle détecte, elle rougit, elle nomme le rattrapage
exact. Deux fois sur deux. Le lot ne la répare pas — il **ferme la cause qu'elle signale**, et
lui donne le droit de réparer elle-même.

---

## § 2 — Cause probable, établie PAR LECTURE

### 2.1 — La cause : le `make_latest` n'est pas inerte, il est calculé à `false`

L'étape `rang` de `.github/workflows/release.yml:141-173` calcule ainsi :

```sh
RELEASES=$(gh api "repos/<dépôt>/releases" --paginate \
  --jq '.[] | select(.draft|not) | select(.prerelease|not) | .tag_name')     # l. 156-157
PLUS_HAUT=$(printf '%s\n' "$RELEASES" \
  | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1 || true)          # l. 158-159
...
elif [ "$TAG" = "$PLUS_HAUT" ]; then   # l. 166  ← LE POINT DE RUPTURE
```

**Le référent est la population des RELEASES.** L'étape `rang` tourne **AVANT** l'étape
`softprops` (`release.yml:175-184`), donc **avant que la release du tag courant existe**.

Conséquence, et elle est structurelle : **`$TAG` ne peut JAMAIS être égal à `$PLUS_HAUT`
lors d'une publication normale.** Le tag qu'on publie n'a pas encore de release, il n'est donc
pas dans la population lue. La branche `elif` (l. 166-168) est **morte** sur un `push` de tag.
Le flot tombe systématiquement dans le `else` (l. 169-172) et écrit :

```
make_latest=false
```

que `softprops` transmet fidèlement (`release.yml:182`). **Le workflow dit lui-même à GitHub de
ne PAS faire de cette release la `latest`.** Le pointeur ne bouge pas. C'est exactement ce que
la mesure montre, deux fois.

Le script **avoue** d'ailleurs le décalage, à `release.yml:161` :

```
echo "plus haut semver publie (hors le tag courant, pas encore cree) : ${PLUS_HAUT:-(aucun)}"
```

*« hors le tag courant, pas encore créé »* — la parenthèse est juste ; c'est la **comparaison**
d'en dessous qui n'en a pas tenu compte.

### 2.2 — C'est une RÉGRESSION du fix R-2 (2026-09-02), et le corpus le corrobore

Avant le fix R-2, `PLUS_HAUT` dérivait de la population des **TAGS**
(`release.yml:148-150`, qui décrit le changement). Or le tag qu'on pousse **EST** dans la
population des tags. La comparaison `[ "$TAG" = "$PLUS_HAUT" ]` était donc **satisfiable**, et
elle rendait `true` quand le tag était le plus haut. En basculant le référent des tags vers les
releases — **pour de bonnes raisons**, celles écrites au cartouche (faux rouge + dictée
impossible) — le lot a **cassé la comparaison sans la déplacer**.

La chronologie recoupe exactement les trois runs connus :

| Run | Tag | Référent en vigueur | `TAG = PLUS_HAUT` ? | `make_latest` écrit | `latest` observé |
|---|---|---|---|---|---|
| `33635520511` (2026-09-02) | `v0.39.0` | **TAGS** (avant fix R-2) | oui (v0.39.0 est le plus haut tag) | `true` | `v0.39.0` ✅ |
| `33959443438` (2026-09-05) | `v0.40.0` | **RELEASES** (après fix R-2) | **non** (PLUS_HAUT = v0.39.0) | `false` | `v0.39.0` ❌ |
| `34001818646` (2026-09-06) | `v0.41.0` | **RELEASES** | **non** (PLUS_HAUT = v0.40.0) | `false` | `v0.40.0` ❌ |

Le cartouche du fix R-2 écrit lui-même (`release.yml:108-109`) : *« CE DÉFAUT N'A PAS MORDU au
run réel du 2026-09-02 »*. C'est exact — et pour cause : **ce run-là a tourné avec l'ancien
référent**. Le défaut a mordu au **premier** run qui a exécuté le texte corrigé, puis au second.
Ce n'est pas une coïncidence : **c'est la signature de la régression**.

### 2.3 — Ce que cette lecture DÉCLASSE, et ce qu'elle ne déclasse pas

- **Déclassé — la piste « type de `make_latest` ».** L'ordre de mission demande d'examiner si
  `softprops` ignore une expression booléenne ou vide, `make_latest` attendant une **chaîne**
  `"true"|"false"|"legacy"`. Cette piste **n'explique pas la mesure** : si la valeur était
  ignorée, `softprops` omettrait le champ et l'API appliquerait son **défaut `true`** — le tag
  publié **serait devenu** `latest`. Or il ne l'est pas. La valeur transmise **n'est donc pas
  ignorée** : elle vaut `false`, et elle agit. ⚠️ Le durcissement reste **recommandé** (AR-1,
  § « Durcissement joint »), mais comme **ceinture**, jamais présenté comme la cause.
- **Déclassé — la piste « course de douze minutes » / asynchronisme.** Elle ne survit pas au
  fait que le défaut se reproduit **à l'identique**, deux tags de suite, à des heures
  différentes ; et l'observable lui-même est signalé imprécis au backlog
  (`BACKLOG.md:257-268`, item `D3-OBSERVABLE-ENREGISTREMENT`). Citée, non invoquée (§ 0.4).
- **Déclassé — la piste « création vs mise à jour d'une release existante ».** Les deux runs
  fautifs ont **CRÉÉ** la release (aucune release ne portait ces tags avant). La question
  ouverte de `release.yml:69-73` reste ouverte, mais **elle n'est pas la cause ici**.
- **PAS déclassé — `make_latest=false` à la CRÉATION agit, alors que `make_latest=false` par
  `PATCH` sur une release EXISTANTE est inerte (M2).** Ce n'est pas contradictoire : *poser*
  un drapeau à la création et *retirer* le pointeur d'une release qui le détient sont deux
  opérations différentes. Le corpus mesure la seconde ; ce lot **observe** la première. **Cette
  observation est neuve et doit être inscrite** (§ 5.7).

### 2.4 — Ce qui reste à MESURER avant d'écrire une ligne de correctif

Une seule mesure ferme le dossier, et elle tient en une ligne de log. Dans le run
`34001818646`, étape « Le tag publie est-il le plus haut semver ? », la sortie **attendue** par
cette lecture est, mot pour mot :

```
DECISION : v0.41.0 n'est PAS le plus haut (v0.40.0) -> make_latest=false.
```

**Si le log dit cela**, § 2.1 est prouvé et le lot suit § 5. **Si le log dit autre chose** (par
exemple `make_latest=true`), alors la cause est ailleurs — et **le cadrage doit être rouvert
avant tout code** (cliquet CA-L1). Un correctif écrit contre une cause non confirmée serait
exactement le défaut que ce dépôt corrige depuis trois lots.

---

## § 3 — Arbitrages (Gandalf propose, le décideur tranche)

> **Verdicts rendus le 2026-09-08** — autonomie maximale accordée par Stéphane le 2026-09-06 (*« continue au
> max en autonomie »*), recommandations appliquées à la lettre par 🔴 Aragorn : **AR-1 → (a)** corriger la
> comparaison de l'étape `rang` (le tag courant entre dans la population avant le tri), `true` en dur refusé.
> **AR-2 → (a)** l'étape « Vérifier » exécute `gh release edit "$PLUS_HAUT" --latest` puis re-mesure.
> **AR-3 → (a)** job unique. **AR-4 → (a)** les trois `uses:` épinglés au SHA dans ce lot. **AR-5 → (a)** jambe
> d'exécution shell en Node pur. **AR-6 → (c)** pré-release `v0.41.1-rc.1` puis prochain tag réel — les deux
> tags restent des actes du décideur.

> Autonomie maximale accordée par le décideur : 🟠 Aragorn **applique les recommandations**
> ci-dessous et pose le jalon. Chaque arbitrage porte donc une **recommandation ferme**, pas un
> menu ouvert.

### AR-1 — la correction de la cause

| Voie | Contenu | Verdict |
|---|---|---|
| **(a)** | **Corriger la COMPARAISON** : faire entrer le tag courant dans la population **avant** le tri, puis tester si le sommet **est** le tag courant. | ✅ **RECOMMANDÉE** |
| (b) | Poser `make_latest: "true"` **en dur**. | ❌ **REFUSÉE** |
| (c) | Ne rien changer au calcul, tout confier au rattrapage (AR-2 seul). | ❌ refusée |

**Pourquoi (a).** C'est la correction **minimale** qui remet la ligne 166 en accord avec la
ligne 161. Elle **conserve intégralement** l'acquis du fix R-2 (le référent reste la population
des **releases**, donc pas de faux rouge ni de dictée impossible) et ne fait que réparer ce que
le changement de référent avait cassé. Forme attendue, en une phrase : *le référent devient
`{releases publiées} ∪ {tag courant}`, et la décision est « le sommet de ce tri est-il le tag
courant ? »*.

**Pourquoi (b) est refusée** : le cartouche du fichier l'interdit nommément
(`release.yml:180-181` — *« Ne JAMAIS remplacer par une constante : ce serait réintroduire le
défaut sous une autre forme »*). Poser `true` en dur ferait **voler** le `latest` à chaque
republication d'un tag ancien : c'est le défaut d'origine, retourné.

**Pourquoi (c) est refusée** : réparer après coup un drapeau qu'on a soi-même posé à `false`,
c'est écrire un workflow qui se contredit dans le même run. On corrige la cause **et** on pose
le filet — pas le filet seul.

**Durcissement joint, déclaré comme ceinture et non comme cause (§ 2.3)** : citer la valeur
dans le YAML — `make_latest: "${{ steps.rang.outputs.make_latest }}"` — pour qu'aucune lecture
YAML ne puisse transformer la chaîne en autre chose. Coût nul, doute levé.

### AR-2 — le filet : que fait l'étape « Vérifier » quand le pointeur est faux ?

| Voie | Contenu | Verdict |
|---|---|---|
| **(a)** | L'étape **RATTRAPE elle-même** — `gh release edit "$PLUS_HAUT" --latest` — **puis re-mesure**, et ne rougit que si la re-mesure échoue. | ✅ **RECOMMANDÉE** |
| (b) | `gh api -X PATCH repos/<dépôt>/releases/<id> -F make_latest=true`, puis re-mesure. | ⚠️ repli |
| (c) | Détection seule (état actuel). | ❌ refusée |

**Pourquoi (a).** Trois raisons, dans cet ordre :

1. **C'est le geste MESURÉ.** M1 (2026-09-01) : `gh release edit --latest` (true) **AGIT**
   (`release.yml:77`). Le `PATCH make_latest=true`, lui, **n'a jamais été mesuré** — le banc n'a
   mesuré que `false` (inerte) et `legacy` (agit). Choisir (b) reviendrait à parier sur une
   écriture non éprouvée alors qu'une écriture éprouvée existe.
2. **C'est un arbitrage DÉJÀ TRANCHÉ dans la famille.** Le lot L44 a tranché **AR-7 = (a)** —
   *« la branche du vol EXÉCUTE `gh release edit "$PLUS_HAUT" --latest` au lieu de l'imprimer »*
   — et l'a livré dans `IakaCockpit` et `iakaFrameGUI` (`BACKLOG.md:198-203`). **Ce dépôt-ci ne
   l'a jamais reçu** : `release.yml:91-96` déclare explicitement le rattrapage **hors périmètre**
   au motif que *« ce workflow n'a jamais tourné »*. Ce motif est **périmé depuis trois runs**.
   Le patron cible existe, lisible : `iakaInstall/.github/workflows/release.yml:331-374`.
3. **`gh release edit <tag>` est sûr ici.** Les réserves connues (`cli/cli#10140`, `#11589`)
   portent sur les **brouillons** ; `softprops` crée ici une release **publiée**. Adressage par
   tag acceptable — contrairement à la sœur, qui manipule des brouillons et doit passer par `id`.

**La rougeur reste possible, et c'est essentiel** : si le rattrapage échoue **ou** si la
re-mesure ne concorde toujours pas, l'étape sort **rouge** en nommant la commande. On remplace
« rougir sans agir » par « agir, vérifier, et rougir si ça n'a pas suffi » — jamais par « agir
et se taire ».

### AR-3 — l'architecture : une étape, ou la tri-partition de la sœur ?

| Voie | Contenu | Verdict |
|---|---|---|
| **(a)** | **Garder le job unique `package`** ; le rattrapage vit dans l'étape « Vérifier ». | ✅ **RECOMMANDÉE** |
| (b) | Transposer `iakaInstall` : brouillon + `publier` par `id` + job `latest` séparé. | ❌ refusée |

**Pourquoi (a).** Motif complet en § 0.5 : le brouillon de la sœur existe pour qu'une release
**incomplète** (matrice 4 OS partiellement rouge, 9 assets attendus) ne devienne jamais visible.
Ici : **un job, un asset**. Le motif n'existe pas, la course n'existe pas. Transposer
l'architecture serait une **sur-ingénierie** — un défaut au sens de la méthode — et ferait
entrer dans ce dépôt trois jobs, un `release_id` à faire circuler et un `if: always()` dont
aucun n'a de cause ici.

**Ce qu'on emprunte quand même à la sœur** : la **jambe d'exécution** de la garde (AR-5) et la
leçon `gh api ... --jq --arg` (CA-L5). L'outillage voyage ; l'architecture, non.

### AR-4 — épingler les trois `uses:` dans CE lot, ou dans un lot séparé ?

| Voie | Contenu | Verdict |
|---|---|---|
| **(a)** | **Oui, même lot, même fichier** : `actions/checkout`, `actions/setup-node`, `softprops/action-gh-release` épinglés au **SHA de 40 caractères** + fixture cliquet à l'image de L41. | ✅ **RECOMMANDÉE** |
| (b) | Lot séparé, plus tard. | ❌ refusée |

**Pourquoi (a) — et ce n'est pas un « tant qu'on y est ».** Trois raisons, dont la deuxième est
décisive :

1. **Même fichier, coût du registre payé UNE fois.** Toute modification de
   `.github/workflows/release.yml` décale les lignes et fait rougir `registre:repli-latest`
   (D-2 sur les **26** occurrences couvertes + les **6** lignes déclarées hors couverture,
   ancrées une par une — chiffres relevés au § 7.1, pas estimés). Faire
   deux lots, c'est payer **deux fois** ce ré-ancrage, et prendre **deux fois** le risque de
   tri.
2. **L'épinglage EXIGE de lire l'`action.yml` au SHA retenu — et c'est EXACTEMENT la lecture
   qui établit le contrat de `make_latest`** (valeurs acceptées, comportement sur valeur vide
   ou invalide, valeur par défaut de `prerelease`). C'est **une seule mesure** qui sert **les
   deux** objets. Les séparer, c'est faire la même lecture deux fois — ou, pire, ne pas la
   faire.
3. **La leçon D-4 de L41 s'applique mot pour mot ici** : `uploadUpdaterJson` y était **ignoré
   en silence** par l'action, faute d'avoir relu l'`action.yml` au SHA. Ce lot repose sur le
   comportement d'une **entrée déclarée** de `softprops` : ne pas relire cette déclaration
   serait rejouer D-4 sur `make_latest`.

L'item `CI-RELEASE-AUCUN-EPINGLAGE` (`BACKLOG.md:270-288`) se **solde** donc dans ce lot, avec
sa preuve, et non « en passant ».

### AR-5 — la garde : quelle jambe ?

| Voie | Contenu | Verdict |
|---|---|---|
| **(a)** | **Jambe d'EXÉCUTION** transposée d'`iakaInstall` : extraction par marqueur du `run:` des étapes, exécution en `bash` avec un **faux `gh`** en tête de `PATH` et le **vrai `jq`**, en **Node pur** (`node --test`) dans `cli/test/`. | ✅ **RECOMMANDÉE** |
| (b) | Garde de **texte** seule (présence de `make_latest`, forme des étapes). | ❌ insuffisante |
| (c) | Aucune garde nouvelle. | ❌ refusée |

**Pourquoi (a), et pourquoi (b) ne suffit PAS.** Le défaut de ce lot est **invisible à une garde
de texte** : `make_latest: ${{ steps.rang.outputs.make_latest }}` est **parfaitement correct**
en texte — il est même exactement ce que le cartouche exige. Ce qui est faux, c'est la **valeur
calculée** trois lignes plus haut. Seule une garde qui **exécute** l'étape `rang` et **lit ce
qu'elle écrit dans `$GITHUB_OUTPUT`** peut voir la différence. C'est précisément la limite que
la sœur a déclarée dans son propre fichier de garde
(`iakaInstall/scripts/__tests__/release-publier-shell.test.mjs:18-25`) après que le run réel
`34026373514` l'ait démontrée à ses dépens.

**Adaptation obligatoire, pas une transposition littérale** : la sœur utilise **vitest** et
`.mjs` ; ce dépôt utilise **`node --test`** (`cli/package.json:19`) et des `.js` ESM dans
`cli/test/`. La logique voyage, le harnais **doit** être réécrit. `extraireJobs` n'existe pas
ici : il faut un petit extracteur local (par **marqueur**, jamais par numéro de ligne).

**Limites à DÉCLARER dans le fichier de garde lui-même** (discipline du dépôt, pas une option) :
le faux `gh` ne reproduit **pas** le vrai `gh` sur tous ses détails ; il reproduit **la règle
d'arité** et **un petit monde de releases**. Si `jq` ou `bash` manquent du poste, les tests sont
**SKIP explicitement nommés** — jamais un vert silencieux.

### AR-6 — l'instrument de preuve : quel tag ?

| Voie | Contenu | Verdict |
|---|---|---|
| (a) | Une **pré-release `v0.41.1-rc.1`** comme instrument — elle **ne doit PAS** devenir `latest`. | partie 1 |
| (b) | Attendre le **prochain tag réel** (`v0.42.0`) — il **doit** devenir `latest` sans rattrapage. | partie 2 |
| **(c)** | **Les DEUX, dans cet ordre : (a) puis (b).** | ✅ **RECOMMANDÉE** |

**Pourquoi (c), et pourquoi (a) seule ne suffirait pas.** La `rc` est un **contrefactuel
gratuit** : son tag ne matche pas `^v[0-9]+\.[0-9]+\.[0-9]+$`, elle est donc exclue du référent,
et la décision attendue est `make_latest=false` — le pointeur **ne doit pas bouger**. Elle
prouve la branche **« ne vole pas »** sans rien risquer sur une version réelle. Mais, pour la
même raison, **elle ne prouve PAS la branche nominale** « le tag le plus haut devient `latest` »
— celle qui a échoué deux fois. Présenter la `rc` comme la preuve du lot serait donc **prouver
le mauvais côté**. Les deux sont dus ; l'ordre importe ; et **seul le décideur pousse un tag**.

⚠️ **Effet de bord de la `rc`, déclaré et non tu** : au SHA courant, `softprops` ne reçoit
**aucune** entrée `prerelease` (`release.yml:175-184`) — la release `v0.41.1-rc.1` sera donc
créée **non-préversion**, quoique son tag le suggère. C'est **sans conséquence** sur le pointeur
(le `grep` l'exclut du référent), mais elle **apparaîtra dans la liste des releases**. Sa
suppression éventuelle est un **acte de release, réservé au décideur**. Le comportement exact de
`prerelease` non fourni est **à confirmer à l'étape 0** lors de la lecture de l'`action.yml` au
SHA retenu (AR-4, raison 2) — non vérifiable hors ligne.

---

## § 4 — Périmètre

### Inclus

1. **La cause** — corriger la comparaison de l'étape `rang` (AR-1(a)) + citer la valeur dans le
   YAML.
2. **Le filet** — l'étape « Vérifier ce qu'est devenu le latest » **exécute** le rattrapage
   mesuré puis **re-mesure** (AR-2(a)).
3. **L'épinglage** — les **trois** `uses:` au SHA de 40 caractères + fixture cliquet + garde,
   à l'image de L41 (AR-4(a)) ; solde de `CI-RELEASE-AUCUN-EPINGLAGE`.
4. **La garde** — jambe d'**exécution** shell en Node pur dans `cli/test/` (AR-5(a)), avec
   contrefactuels et limites déclarées **dans le fichier**.
5. **La dette d'énoncés** — re-ancrage du registre `registre:repli-latest`, tri **à la main**
   des lignes neuves, rectification de l'énoncé périmé de `cli/scripts/vitrine-en-ligne.js`,
   inscription de l'observation neuve du § 2.3.
6. **Le récit** — cartouche du workflow **daté, pas effacé** ; `BACKLOG.md` ; note de gate.

### Exclu — explicitement, et ce qui n'est pas ici n'est pas à faire

- **Pousser un tag.** Acte de release, **réservé au décideur** (AR-6). Aucun agent ne pousse
  `v0.41.1-rc.1` ni `v0.42.0`, ne publie, n'édite ni ne supprime une release de ce dépôt.
- **La tri-partition en jobs** de la sœur (brouillon / `publier` / `latest`) — AR-3(b), refusée.
- **`prerelease`** : le workflow continue de ne rien passer à `softprops` sur cette entrée. Son
  comportement est **mesuré et écrit** (étape **0.6**), il n'est pas **changé**.
- **Le contenu de la release** (notes, agrégat de versions non publiées) — lot L42, ailleurs.
- **`M-4-MANIFESTE-PERIME` / `M-1-COUT-HORS-LAN`** (`BACKLOG.md:33-65`) : reportées par le
  décideur, **sans rapport** avec ce lot. Ce lot porte sur le **pointeur `latest`**, pas sur la
  **fraîcheur d'un manifeste servi** — la confusion est nommée dans l'item de backlog lui-même
  (`BACKLOG.md:20-21`), on ne la refait pas.
- **`README-REMOTE-IAKABOX-MORTE`** et **`D3-OBSERVABLE-ENREGISTREMENT`** : items voisins,
  **hors périmètre**. Le second est *cité* (§ 0.4) parce qu'il disqualifie une piste ; il n'est
  pas traité.
- **`TAURI-ACTION-V1-POUR-LES-TROIS`**, `CONVERGENCE-RELEASE-YML-ALIGNEMENT` : autres dépôts.
- **Toute modification des deux dépôts jumeaux** (`IakaCockpit`, `iakaFrameGUI`). Ils ont déjà
  l'acquis AR-7(a) de L44 ; ce lot ne fait que le **rattraper ici**. ⚠️ **À vérifier tout de
  même, en LECTURE SEULE, à l'étape 0.7** : la régression du § 2.1 est-elle présente **chez
  elles** ? Si oui → **successeur nommé**, jamais un geste dans ce lot (canal d'écriture borné).

---

## § 5 — Étapes d'implémentation

### 5.0 — ÉTAPE 0 : MESURER. Avant toute ligne de code.

> Le cadreur n'avait pas de shell (§ 0.1). Ces mesures sont **dues** et **datées** dans le
> rapport de lot. Aucune n'est facultative.

| # | Mesure | Ce qu'on en attend |
|---|---|---|
| 0.1 | Log du run **`34001818646`**, étape « Le tag publie est-il le plus haut semver ? » | la ligne `DECISION : …` **verbatim**, et la valeur de `PLUS_HAUT` |
| 0.2 | Log du run **`33959443438`**, même étape | la **même** ligne, avec `PLUS_HAUT = v0.39.0` — deux fois le même mécanisme |
| 0.3 | Log de l'étape `softprops` des deux runs | trace éventuelle de l'entrée `make_latest` reçue |
| 0.4 | `gh api repos/iakasju/iakaframe/releases --paginate` + `…/releases/latest` | état de départ réel (tags, `draft`, `prerelease`, pointeur courant) |
| 0.5 | SHA de commit des trois actions (`actions/checkout@v4`, `actions/setup-node@v4`, `softprops/action-gh-release@v2`) | 40 caractères chacun, + le tag lisible correspondant |
| 0.6 | **Lecture de l'`action.yml` de `softprops` AU SHA retenu** | valeurs acceptées de `make_latest`, défaut, comportement sur valeur **vide/invalide** ; défaut de `prerelease` — **leçon D-4 de L41** |
| 0.7 | Lecture seule des `release.yml` de `IakaCockpit` et `iakaFrameGUI` | la régression du § 2.1 y est-elle présente ? → successeur nommé si oui |
| 0.8 | `bash --version`, `jq --version`, `node --version` sur le poste de gate | la jambe d'exécution (AR-5) en dépend ; sinon **SKIP nommé** |

**CLIQUET DE CADRAGE (CA-L1)** : si 0.1 **ne montre pas** `make_latest=false`, **STOP** — le
§ 2 est réfuté, l'instruction doit être **rouverte** avec 🔵 Gandalf avant tout correctif.

### 5.1 — Le test D'ABORD, en rouge volontaire

Créer la jambe d'exécution (AR-5(a)) **contre le texte actuel**, et **capturer l'état rouge**
dans un commit `test(ci):` dédié :

- un extracteur **par marqueur** (jamais par numéro de ligne) du corps `run: |` d'une étape
  nommée du workflow ;
- un **faux `gh`** en tête de `PATH` : règle d'arité de `gh api` (un seul positionnel), petit
  monde de releases en JSON local, journal de chaque invocation, mode `EDIT_NOOP` pour simuler
  une écriture qui réussit **sans rien changer** ;
- le **vrai `jq`** du poste (jamais un faux) ; **SKIP explicitement nommé** s'il est absent ;
- cas nominal : tag neuf, le plus haut → **attendu `make_latest=true`** → **ROUGE** contre le
  texte actuel, qui écrit `false`. **C'est la reproduction locale du défaut mesuré en CI.**

### 5.2 — Corriger la cause (AR-1(a))

Étape `rang` : faire entrer `$TAG` dans la population **avant** le tri, puis décider selon que
le sommet **est** ou **n'est pas** le tag courant. Conserver : le référent « releases »
(brouillons et préversions exclus), le filtre `^v[0-9]+\.[0-9]+\.[0-9]+$`, l'appel et le tri
**séparés**, le `|| true` sur le tri seul, le cas « aucune release ». Citer la valeur dans le
YAML : `make_latest: "${{ steps.rang.outputs.make_latest }}"`.

**Les `echo` doivent rester vrais** : le message de la branche `else` continue de dire pourquoi
on refuse le `latest` à un tag ancien ; le message de la branche nominale doit dire que le tag
courant **est** le sommet **une fois lui-même compté** — pas « hors le tag courant ».

### 5.3 — Poser le filet (AR-2(a))

Étape « Vérifier ce qu'est devenu le latest » : quand `EFFECTIF != PLUS_HAUT`, **exécuter**
`gh release edit "$PLUS_HAUT" --latest --repo "<dépôt>"`, **re-mesurer**, et ne sortir vert que
si la re-mesure concorde. Sinon : `::error::` nommé, commande de rattrapage manuel imprimée,
`exit 1`. Patron lisible : `iakaInstall/.github/workflows/release.yml:361-374`.

⚠️ **Ne PAS écrire `gh api ... --jq --arg`** — c'est la classe de défaut qui a fait rougir le
run `34026373514` de la sœur (`iakaInstall/CLAUDE.md`, § Backlog). `--arg` appartient à `jq`,
jamais à `gh api`. Assertion de garde dédiée (CA-L5).

### 5.4 — Épingler (AR-4(a))

Les trois `uses:` au **SHA de 40 caractères**, tag lisible en commentaire de fin de ligne.
Fixture cliquet à l'image de L41 (`cli/fixtures/actions-pin.json` ou nom équivalent) portant,
par action : **SHA**, **`sha256` de l'`action.yml`** lu à ce SHA, **entrées déclarées**,
**entrées vérifiées absentes**, et — spécifiquement pour `softprops` — **le contrat de
`make_latest` et le défaut de `prerelease`** mesurés en 0.6. Garde : un test qui rougit si un
`uses:` redevient flottant (contrefactuel : réintroduire `@v2` sur une copie).

### 5.5 — Re-jouer la garde

Les cas nominaux passent au vert ; **chaque contrefactuel est joué puis révoqué**, et l'état
rouge du 5.1 est cité dans le rapport de lot (il ne se raconte pas, il se montre).

### 5.6 — Payer la dette du registre (le poste le plus coûteux — § 7.1)

1. `node cli/scripts/registre-repli-latest.js` → **rouge attendu** (D-2 : les lignes ont
   glissé ; D-5 : le correctif introduit des lignes neuves portant le motif).
2. `--ecrire` **re-ancre les positions** de ce qui a glissé **sans changer**. Il **ne fabrique
   aucune exclusion** (cliquet `ecrireNeFabriqueAucuneExclusion`).
3. **Trier À LA MAIN** chaque ligne neuve du motif : *inscrite* si elle **affirme** quelque
   chose sur le repli ou la réparation, *hors couverture avec son motif propre* si elle ne fait
   que **porter le vocabulaire** (câblage, appel d'API, chemin REST) — règle de tri à
   `cli/fixtures/registre-repli-latest.json`, clé `balayage.completude.regleDeTri`.
4. Relancer → **`0`**.

### 5.7 — Rectifier ce qui est devenu faux (daté, jamais effacé)

- **`cli/scripts/vitrine-en-ligne.js:136`** dit aujourd'hui, dans le message **E-1 qui s'imprime
  à l'opérateur au moment où il décide quoi faire** : *« Jamais rejouee sur CE depot-ci »* — à
  propos de `gh release edit <tag> --latest`. **C'est devenu FAUX** : Aragorn l'a joué **deux
  fois sur ce dépôt-ci** (2026-09-05 sur `v0.40.0`, 2026-09-06 sur `v0.41.0`), et **il a agi les
  deux fois**. Rectifier **en datant, sans effacer** la rédaction antérieure, exactement comme
  les trois rectifications qui précèdent dans ce même bloc de commentaire. Reporter l'empreinte
  **à la main** au registre (D-1).
- **Inscrire l'observation neuve du § 2.3** — *`make_latest=false` posé à la CRÉATION **agit**,
  là où `make_latest=false` posé par `PATCH` sur une release **existante** est inerte (M2)* —
  au cartouche du workflow, **dans le tableau des écritures ou juste après**, avec sa source :
  runs `33959443438` et `34001818646`, mesure du 2026-09-05/06, **sur ce dépôt-ci**, pas sur le
  banc. C'est une **sixième écriture** connue, et la première mesurée **hors banc**.

### 5.8 — Le récit

- **Cartouche `release.yml`** : ajouter un bloc daté qui écrit la **régression du fix R-2** et
  son remède. Le paragraphe `FIX R-2` existant reste **tel quel** — il disait vrai sur le
  référent ; c'est la **comparaison** qui n'avait pas suivi. *Daté, pas effacé.*
- **`BACKLOG.md`** : `CI-RELEASE-LATEST-NON-MAITRISE` reçoit sa **cause mesurée** et son
  correctif ; `CI-RELEASE-AUCUN-EPINGLAGE` est **soldé** avec sa preuve (déplacé en *Fait*,
  texte conservé) ; le **successeur** est nommé : *le tag de preuve, acte du décideur*.
- **`docs/qualite/`** : note de gate du lot, à l'image de `gate-bump-0.41.0.md`.

### 5.9 — Chaîne qualité, puis REMISE AU GATE

`node --test` depuis `cli/` (vert, nombre de tests **en hausse**, **aucun supprimé**),
`npm run vitrine:check` → `0`, `npm run registre:repli-latest` → `0`.
`npm run vitrine:en-ligne` **reste hors gate** : son code est **informatif**, jamais un vert de
lot. ⚒️ Gimli **remet à 🏹 Legolas** — **jamais d'auto-validation**.

---

## § 6 — Fichiers concernés

| Chemin | Ce qui change |
|---|---|
| `/Users/sjupin/work/iakaframe/.github/workflows/release.yml` | étape `rang` (comparaison, § 5.2) ; étape `softprops` (`make_latest` cité, trois `uses:` épinglés) ; étape « Vérifier » (rattrapage + re-mesure) ; cartouche daté |
| `/Users/sjupin/work/iakaframe/cli/test/release-latest-shell.test.js` | **NEUF** — jambe d'exécution (`node --test`), faux `gh`, vrai `jq`, contrefactuels, limites déclarées |
| `/Users/sjupin/work/iakaframe/cli/scripts/lib/release-shell.js` | **NEUF** — extracteur par marqueur + source du faux `gh` (module pur, testable) |
| `/Users/sjupin/work/iakaframe/cli/fixtures/actions-pin.json` | **NEUF** — cliquet d'épinglage (SHA, `sha256` de l'`action.yml`, entrées déclarées/absentes, contrat de `make_latest`) |
| `/Users/sjupin/work/iakaframe/cli/fixtures/registre-repli-latest.json` | re-ancrage (D-2) + lignes neuves triées à la main (D-5) + empreintes rectifiées (D-1) |
| `/Users/sjupin/work/iakaframe/cli/scripts/vitrine-en-ligne.js` | énoncé E-1 périmé rectifié, **daté** (§ 5.7) |
| `/Users/sjupin/work/iakaframe/BACKLOG.md` | cause mesurée ; solde de `CI-RELEASE-AUCUN-EPINGLAGE` ; successeur nommé |
| `/Users/sjupin/work/iakaframe/docs/qualite/` | note de gate du lot |

**Intouchés, et c'est un critère** : `cli/src/**` (aucune logique produit ne change), les deux
dépôts jumeaux, `cli/fixtures/vitrine-locale.json`, `README.md`.

---

## § 7 — Risques

### 7.1 — Le registre d'énoncés rougit sur TOUT le fichier (risque n°1, coût certain)

`cli/fixtures/registre-repli-latest.json` inscrit **26 occurrences** pour
`.github/workflows/release.yml` (clé `depots.iakaframe.couverts`) et **6 lignes déclarées hors
couverture, ancrées une par une** (l. 164, 165, 168, 172, 182, 208). **Toute** modification du
workflow décale ces lignes → **D-2 en série**. Et le correctif **ajoute** des lignes portant le
motif (`make_latest`, `--latest`, `releases/latest`) → **D-5**.

**Ce n'est pas un accident, c'est le prix connu du dispositif**, et il est **non négociable** :
`--ecrire` re-ancre les positions mais **ne fabrique aucune exclusion** — chaque ligne neuve se
**trie à la main**. **Mitigation** : (i) traiter l'épinglage **dans le même lot** (AR-4(a)),
pour ne payer qu'une fois ; (ii) faire le tri **en dernier**, quand le texte du workflow est
définitif ; (iii) inscrire ce poste dans l'estimation (§ 9) plutôt que le découvrir.

### 7.2 — Le correctif pourrait perdre la protection contre le VOL du `latest`

En rendant la branche nominale atteignable, on risque de rendre **toutes** les branches
`true`. Ce serait remplacer un défaut par son symétrique — celui-là même que le cartouche
interdit (`release.yml:180-181`). **Mitigation** : **CA-L3** exige qu'un tag **ancien** rejoué
produise toujours `make_latest=false`. Ce critère n'est pas décoratif : c'est **le contrefactuel
du correctif**.

### 7.3 — Le faux `gh` n'est pas le vrai `gh`

La jambe d'exécution prouve **une** chose : ce que l'étape **calcule et écrit**, sous une règle
d'arité et un monde simulés. Elle ne prouve **ni** le comportement réel de l'API GitHub, **ni**
la sémantique de `make_latest` côté serveur. **Mitigation** : limite **écrite dans le fichier de
garde** (discipline du dépôt), et **gate humain** conservé (CA-L11/CA-L12) — jamais présenté
comme couvert.

### 7.4 — L'épinglage peut casser le workflow

Un SHA mal résolu (tag annoté vs commit) fait échouer **tout** le run, y compris la production
du tarball. **Mitigation** : résoudre le SHA **du commit** (déréférencer le tag annoté),
consigner le tag lisible en commentaire, **relire l'`action.yml` à ce SHA** (0.6), et **ne pas
monter de version majeure** au passage — on épingle **ce qui tourne aujourd'hui**, on ne met pas
à jour (`TAURI-ACTION-V1-POUR-LES-TROIS` est un autre lot).

### 7.5 — La pré-release de preuve laisse une trace

`v0.41.1-rc.1` sera créée **non-préversion** (§ AR-6) et restera visible dans la liste des
releases. **Mitigation** : le dire **avant** de la pousser ; sa suppression est un **acte de
release réservé au décideur** ; elle est **exclue du référent** par le filtre semver, donc sans
effet sur le pointeur.

### 7.6 — Le lot ne peut pas se prouver lui-même

Aucun agent ne pousse de tag. Le lot livre du texte, des gardes et des mesures locales ; **la
preuve nominale appartient au décideur** et arrive **après** la remise. **Mitigation** :
CA-L11/CA-L12 sont **déclarés non couverts** et **nommés gate humain** — jamais comptés dans le
vert du lot. C'est exactement la discipline de la sœur au run `34026373514`.

### 7.7 — `jq` ou `bash` absents du poste de gate

La jambe d'exécution serait **SKIP**. **Mitigation** : SKIP **explicitement nommé** (jamais un
vert silencieux), et mesure 0.8 faite **avant** d'écrire la garde.

---

## § 8 — Critères d'acceptation

> Règle du royaume : **chaque critère porte son contrefactuel**. Un test qui ne peut pas rougir
> ne prouve rien. Les critères marqués 👤 sont **déclarés non couverts** et **ne comptent pas**
> dans le vert du lot.

- [ ] **CA-L1 — la cause est MESURÉE, pas supposée.** Le log du run `34001818646` (étape
      « rang ») est cité **verbatim** dans le rapport de lot et montre `make_latest=false` sur
      un tag qui **était** le plus haut. Le run `33959443438` montre la **même** ligne.
      **Cliquet** : si le log dit autre chose, le lot **s'arrête** et l'instruction est rouverte
      (§ 5.0). *Contrefactuel* : le run `33635520511` (v0.39.0, **avant** fix R-2) ne porte
      **pas** ce message — la régression est datée, pas générale.

- [ ] **CA-L2 — le nominal est réparé.** Jambe d'exécution : monde = `{v0.39.0, v0.40.0}`
      publiées, `TAG=v0.41.0` → l'étape `rang` écrit **`make_latest=true`** dans
      `$GITHUB_OUTPUT`. *Contrefactuel* : le **texte d'AVANT correctif**, figé **en dur** dans le
      fichier de test (jamais ré-extrait), rejoué sur le **même monde** → **`make_latest=false`**.
      Le défaut mesuré en CI est ainsi **reproductible hors ligne, à perpétuité**.

- [ ] **CA-L3 — la protection contre le VOL n'est PAS perdue.** Même monde, `TAG=v0.39.0`
      (rejeu d'un tag ancien, `workflow_dispatch`) → **`make_latest=false`**. *Contrefactuel* :
      un correctif qui poserait `true` en dur fait **rougir** ce test — vérifié en mutant la
      valeur sur une copie.

- [ ] **CA-L4 — le filet AGIT, puis vérifie.** Étape « Vérifier », monde où `latest` est en
      retard → un appel `gh release edit <plus haut> --latest` est **journalisé**, la re-mesure
      concorde, sortie **`0`**. *Contrefactuel* : faux `gh` en mode **no-op** (l'édition réussit
      sans rien changer) → l'étape sort **`1`** en nommant `latest effectif … n'est pas le plus
      haut semver …` et **imprime** la commande de rattrapage manuel. Jumeau exact de
      `iakaInstall/scripts/__tests__/release-publier-shell.test.mjs:442-453`.

- [ ] **CA-L5 — la leçon de la sœur est tenue.** Aucune occurrence de `gh api ... --jq --arg`
      dans `.github/workflows/release.yml`. *Contrefactuel* : réintroduire le motif sur une
      copie → la garde le **détecte** ; et le rejeu shell de l'étape mutée rougit sur
      `accepts 1 arg(s), received 4`.

- [ ] **CA-L6 — les trois `uses:` sont épinglés.** `actions/checkout`, `actions/setup-node`,
      `softprops/action-gh-release` portent chacun un **SHA de 40 caractères** + le tag lisible
      en commentaire ; le cliquet `cli/fixtures/actions-pin.json` porte SHA + `sha256` de
      l'`action.yml`. *Contrefactuel* : remettre `@v2` sur une copie → la garde **rougit**,
      nommément. **`CI-RELEASE-AUCUN-EPINGLAGE` est soldé** au `BACKLOG.md` avec cette preuve.

- [ ] **CA-L7 — le contrat de `softprops` est LU au SHA retenu, pas supposé.** La fixture porte,
      **mesurés** : les valeurs acceptées de `make_latest`, son défaut, son comportement sur
      valeur vide/invalide, et le défaut de `prerelease`. **Cliquet** : si cette lecture
      **contredit** le § 2.3, l'arbitrage AR-1 est rouvert avant d'aller plus loin (leçon D-4 de
      L41).

- [ ] **CA-L8 — le registre est à jour et n'a rien avalé.** `node cli/scripts/registre-repli-latest.js`
      → **`0`**. Le diff de `cli/fixtures/registre-repli-latest.json` montre : des **re-ancrages
      de position** (D-2), et **chaque** entrée `lignesHorsCouverture` neuve accompagnée d'un
      **motif écrit à la main**. *Contrefactuel* : aucune exclusion fabriquée par `--ecrire`
      (cliquet `ecrireNeFabriqueAucuneExclusion`) — vérifié en relisant le diff, pas en le
      supposant.

- [ ] **CA-L9 — ce qui est devenu faux est rectifié, DATÉ, non effacé.** Le message E-1 de
      `cli/scripts/vitrine-en-ligne.js` ne dit plus *« Jamais rejouee sur CE depot-ci »* ; la
      rédaction antérieure est **conservée et datée** ; l'empreinte est reportée **à la main** au
      registre. L'observation neuve du § 2.3 (`make_latest=false` **à la création** agit) est
      **inscrite au cartouche** avec sa source (runs `33959443438`, `34001818646`).

- [ ] **CA-L10 — la chaîne qualité est verte et le compte de tests MONTE.** Depuis `cli/` :
      `node --test` **`0`**, nombre de tests **strictement supérieur** à l'état d'entrée,
      **aucun test supprimé** (diff à l'appui) ; `npm run vitrine:check` **`0`**.
      `npm run vitrine:en-ligne` est **hors gate** : son code est **rapporté**, jamais présenté
      comme un vert de lot (et un **`3` = NON MESURÉ** n'est **jamais** lu comme un succès).

- [ ] 👤 **CA-L11 — GATE HUMAIN, non couvert : la pré-release instrument.** Le décideur pousse
      `v0.41.1-rc.1`. Attendu : le run est **vert** ; `releases/latest` **N'A PAS BOUGÉ** (reste
      sur le plus haut semver plein) ; l'étape « rang » imprime `make_latest=false`. *C'est un
      contrefactuel gratuit* : il prouve la branche **« ne vole pas »**, et **rien d'autre** —
      la branche nominale reste due (CA-L12).

- [ ] 👤 **CA-L12 — GATE HUMAIN, non couvert : LA preuve du lot.** Au **prochain tag réel**
      (`v0.42.0`), `releases/latest` **=** ce tag **sans aucun rattrapage manuel** ; l'étape
      « Vérifier » sort **verte** en disant `latest maitrise : v0.42.0` ; `npm run vitrine:en-ligne`
      ne remonte **pas** d'écart **E-1**. **Tant que ce critère n'est pas joué, le lot est livré
      mais NON PROUVÉ** — et cela doit être écrit tel quel à la remise, comme la sœur l'a écrit
      pour son propre `publier`.

- [ ] 👤 **CA-L13 — GATE HUMAIN, non couvert : le sort de la `rc`.** Suppression éventuelle de
      `v0.41.1-rc.1` — **acte de release, réservé au décideur**, jamais un agent.

---

## § 9 — Estimation (obligatoire au jalon P1→P2)

### 9.1 — Équivalent jour-homme, spec fermée

| Poste | Charge | Commentaire |
|---|---|---|
| Étape 0 — mesures (§ 5.0, 8 mesures) | **0,25 j** | logs de deux runs, résolution de trois SHA, lecture d'un `action.yml`, deux lectures croisées |
| Correctif `rang` + filet « Vérifier » (§ 5.2-5.3) | **0,25 j** | ~20 lignes de shell ; la difficulté est le **raisonnement**, déjà fait ici |
| Épinglage + fixture cliquet + garde (§ 5.4) | **0,25 j** | patron L41 existant chez les jumelles |
| Jambe d'exécution en Node pur (§ 5.1, 5.5) | **0,5 j** | **réécriture**, pas copie : `vitest` → `node --test`, extracteur local à écrire |
| **Registre d'énoncés** (§ 5.6) | **0,5 j** | **le poste le plus sous-estimé** : re-ancrage + tri **à la main** des lignes neuves |
| Rectifications datées + récit (§ 5.7-5.8) | **0,25 j** | cartouche, `vitrine-en-ligne.js`, `BACKLOG.md`, note de gate |
| **Total** | **≈ 2 j-h** | fourchette assumée **1,75 → 2,25 j** |

### 9.2 — Complexité / risque

**Complexité : MOYENNE.** Le correctif fonctionnel tient en quelques lignes et la cause est
**établie par lecture**, avec une chronologie qui recoupe **trois runs sur trois** (§ 2.2). Ce
n'est pas une exploration : c'est une réparation.

**Risque : MOYEN-HAUT**, et il ne vient **pas** du correctif :

- 🔴 **le registre d'énoncés** (§ 7.1) — coût **certain**, tri manuel, seul poste capable de
  doubler s'il est découvert au lieu d'être prévu ;
- 🟠 **la preuve** (§ 7.6) — le lot **ne peut pas se prouver lui-même** ; le vert final dépend
  d'un **acte du décideur**, après la remise ;
- 🟠 **l'épinglage** (§ 7.4) — un SHA mal résolu casse **tout** le run de release ;
- 🟢 le reste (faux `gh`, `rc`, `jq` absent) est **borné et déclaré**.

### 9.3 — Inconnues susceptibles de faire glisser l'estimation

1. **Si l'étape 0.1 réfute le § 2** → le cadrage est rouvert : **+0,5 à +1 j**, et la voie
   change. C'est l'inconnue **la plus lourde**, et c'est pourquoi elle est un **cliquet**
   (CA-L1) et non une note.
2. **Nombre de lignes neuves à trier au registre** — non estimable hors ligne : il dépend du
   texte final du correctif et du cartouche. Entre **3 et 20** lignes plausibles. **+0 à +0,5 j**.
3. **Le contrat de `make_latest` lu au SHA (0.6)** pourrait imposer une forme d'écriture
   différente (ex. valeur devant être **strictement** minuscule, ou champ omis si vide) →
   **+0,25 j** de durcissement.
4. **Si 0.7 montre la même régression chez les deux jumelles** → **successeur nommé**, ordre de
   grandeur **≈ 0,5 j par dépôt**, **hors de ce lot** (canal d'écriture borné).
5. **Délai du gate humain** : CA-L12 dépend du **prochain tag**, donc d'un rythme de
   publication, pas d'une charge. **Non chiffrable** — à ne pas confondre avec du travail
   restant.

### 9.4 — Ce que cette estimation n'est pas

Ce n'est **pas un engagement ferme** : un **ordre de grandeur assumé et révisable**. Il sera
**rappelé à la clôture du lot** et **confronté au temps réel**, pour affiner les suivants.

---

> **Fin d'instruction.** Rédigée sans shell et sans réseau (§ 0.1) ; toute affirmation est soit
> ancrée en `chemin:ligne`, soit **déclarée NON MESURÉE** et renvoyée à l'étape 0.
> 🔵 Gandalf — IAKAFRAME — 2026-09-08.
