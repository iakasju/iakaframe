# Phase 1 — index de la série : ordre, dépendances, inventaire de bibliothèque

> Note de cadrage (Gandalf, P1). Complément transverse aux **7 instructions de persona**.
> Modèle de composition : cf. `composabilite-familles-bibliotheque.md`.

## 0. SOURCE UNIQUE DE L'ORDRE

> ⛔ **Ce fichier est le SEUL endroit où l'ordre de la série est écrit.** Aucune instruction de
> persona ne déclare son rang — ni dans son titre, ni dans ses références croisées. Elles se
> désignent par leur **identité** (le persona) et déclarent leurs **dépendances**.
>
> **Origine de la règle (gate 5)** : neuf fichiers se citaient par des rangs écrits en dur ; une
> permutation arbitrée n'a été propagée que dans un fichier sur trois, produisant les rangs
> **1, 2, 3, 5, 5, 6, 7** — aucun 4, deux 5. On reproduisait dans les specs le défaut des **4 tables
> de rôles** qu'on corrige dans le code, et le principe `canon-avant-citation` que ces mêmes specs
> portent était violé par elles.
>
> **Critère tenu : une renumérotation ne touche plus que CE fichier.**

### 0.1 Dépendances déclarées (la source réelle — l'ordre s'en dérive)

| Lot | Doit passer après | Motif |
|---|---|---|
| **Lot 0 — bibliothèque** | — | crée les 2 principes ; **tout lot qui en cite un** en dépend |
| Odin | lot 0 | — |
| Gimli | lot 0 | — |
| Helm | lot 0 | — |
| **Loki** | lot 0 | — |
| **Legolas** | **Gimli** | **`canon-avant-citation`** *(gate 6 — LG-8)* — G-1 écrit dans `gimli.md` le **canon** du jalon de remise (« émetteur Gimli · récepteur Legolas ») ; L-3 écrit dans `legolas.md` qu'il **reçoit** ce jalon : **citation** |
| **Nathalie** | **Loki** | **`canon-avant-citation`** — `nathalie.md:41` **cite** le tableau canon des chartes détenu par `loki.md:53-57` |
| **Nathalie** | **Legolas** | **`canon-avant-citation`** *(gate 7 — F4, **sens inversé**)* — l'**émetteur de la RQV est Legolas** (arbitrage) : le canon de la RQV est `legolas.md:54-60`, complété par L-1 ; N-2 fait écrire dans `nathalie.md` que « le verdict et le jalon reviennent à Legolas » : **citation** |
| Gandalf | lot 0 | cite `preuve-avant-declaration`, créé au lot 0 |

> **Trois dépendances contraignent la série** : **Gimli→Legolas**, **Loki→Nathalie** et
> **Legolas→Nathalie**. Les autres lots sont **librement ordonnançables** après le lot 0.
> *(La dépendance « Loki → Gandalf » a **disparu** : le lot 0 crée le principe.)*

> ⚠️ **F4 — la dépendance RQV était déclarée dans le MAUVAIS SENS.** Elle disait
> « Legolas après Nathalie », motivée par la « réciprocité ». Or **l'émetteur de la RQV est
> Legolas** : le canon est `legolas.md`, et `nathalie.md` le **cite**. Sous l'ancien ordre,
> `nathalie.md` aurait nommé un canon d'émission que `legolas.md` n'avait pas encore écrit —
> **exactement la faute que LG-8 venait de faire lever**, dans l'autre paire.
>
> **Les deux paires reçoivent désormais le même traitement.** C'est ce que le texte de justification
> de LG-8 affirmait — « structurellement identiques » — sans que j'en tire la conséquence pour la
> paire dont je venais de parler. « Réciprocité » décrivait le **contenu** (deux textes qui se
> répondent) ; ce n'est pas un **sens de dépendance**. Un lien canon→citation a toujours un sens.

> 🔁 **Risque de CYCLE à neutraliser à la rédaction — Legolas↔Nathalie.**
> L-1 fait nommer dans `legolas.md` la **part documentaire de Nathalie**. Si cette mention était
> traitée comme une **citation** d'un canon détenu par `nathalie.md`, on obtiendrait
> Nathalie→Legolas **et** Legolas→Nathalie : un **cycle**, impossible à ordonner.
>
> **Résolution — le canon de la RQV est UN SEUL objet, détenu par `legolas.md`.** Il pré-existe
> (`legolas.md:54-60` institue déjà la RQV et engage nommément Nathalie). **L-1 COMPLÈTE ce canon**
> (émission du jalon + co-production), il ne **cite** pas Nathalie. `nathalie.md` (N-1/N-2) est
> **uniquement citant**.
> **Conséquence pour l'exécutant** : rédiger L-1 comme un **complément de canon**, jamais comme un
> renvoi à `nathalie.md` — sinon le cycle réapparaît. **Aucune dépendance Nathalie→Legolas ne doit
> être créée.**

### 0.2 Ordre d'exécution retenu (dérivé de 0.1)

```
LOT 0 — bibliothèque
  → Odin → Helm → Loki → Gimli → Legolas → Nathalie → Gandalf
```

**Dérivation vérifiée** (aucun cycle, les 3 contraintes satisfaites) :

| Contrainte | Positions | ✓ |
|---|---|---|
| Gimli **avant** Legolas | 4ᵉ / 5ᵉ | ✓ |
| Loki **avant** Nathalie | 3ᵉ / 6ᵉ | ✓ |
| Legolas **avant** Nathalie | 5ᵉ / 6ᵉ | ✓ |

> **Nathalie est le seul lot doublement contraint** (après Loki **et** après Legolas) : c'est le
> **dernier** lot citant, ce qui est cohérent — son instruction est la seule à ne rien détenir en
> canon (§ 0.3). Odin, Helm et Gandalf ne portent aucune contrainte de série et pourraient occuper
> toute position après le lot 0 ; leur placement est de confort.

Un commit par lot. **Toute renumérotation se fait ici, et nulle part ailleurs.**

### 0.3 Carte canon ↔ citation (qui détient quoi)

| Lot | Détient en canon | Cité par |
|---|---|---|
| **Gimli** | jalon de remise au gate qualité (G-1) | **Legolas** (L-3) |
| **Loki** | tableau des chartes par défaut (LK-1) | **Nathalie** (N-3) |
| **Legolas** | **RQV** — verdict, émission du jalon, co-production (L-1, complétant `legolas.md:54-60`) | **Nathalie** (N-2) |
| Odin · Helm · Gandalf · Nathalie | *(rien — lots purement citants ou autonomes)* | — |

> **Les lots qui détiennent un canon portent un marqueur explicite en en-tête** (« ce lot est CANON
> pour un autre »), afin qu'on ne puisse pas les déplacer sans voir la dépendance : **Gimli**,
> **Loki**, **Legolas**. **Nathalie n'en porte pas** : elle ne détient aucun canon cité par un autre
> lot *(vérifié au gate 7 — F5 : le marqueur lui aurait été ajouté à tort)*.

## 0.4 Convention de vérification — ce que « relecture » veut dire

> **Vaut pour les 7 instructions de la série et pour le lot 0.** Énoncée **une fois ici**, plutôt
> que répétée — ou pire, suggérée à contre-sens par une étiquette isolée.

| Mention dans une colonne « Vérification » | Nature |
|---|---|
| `--check` = 0 · `node --test` · `grep` · `iakaframe list …` · `diff` | **MÉCANISABLE** — automatisable, verdict binaire |
| **« relecture »**, « relecture croisée », « lecture ciblée » | **NON MÉCANISABLE — contrôle humain en revue** |

> **Tout critère vérifié par « relecture » est un jugement de sens** : constater qu'un texte est
> cohérent avec un autre, qu'il ne redécrit pas ce qu'il compose, ou qu'il nomme une transition
> réelle, **ne s'automatise pas**. Ces critères sont **contractuels**, au même titre que la doctrine
> **CH-4** (une contrainte non mécanisable est portée par le contrat, pas par une garde).
>
> *(Levée F8 du gate 7 : un seul critère — **G-A5d** — portait l'étiquette « non mécanisable »,
> alors que **24 autres** relèvent de la même nature. L'étiquette isolée **suggérait localement
> l'inverse** pour tous les autres. Le défaut n'était pas dans G-A5d mais dans l'absence de
> convention générale.)*
>
> **Conséquence à assumer** : un lot peut sortir « vert » sur ses critères mécanisables **sans que
> les critères de relecture aient été honorés**. C'est pourquoi le **gate humain** reste requis à
> chaque lot — il n'est pas une formalité, il est le seul contrôle de cette moitié-là.

## 1. Règle appliquée — réutiliser avant de créer

Convention permanente. **Deux créations seulement** sur 7 personas, dont **une seule skill**. Le
tableau § 4 documente, pour chaque non-création, **ce qui a été vérifié** — c'est la partie utile :
un inventaire qui ne dirait que ce qu'on crée cacherait le travail de recherche.

## 2. Ce qui est créé — 2 éléments

| Élément | Famille | Persona | Forme | Estimation |
|---|---|---|---|---|
| `iakaframe-fabrication` | `skills` | **lot Gimli** | **COMPOSÉE** | +0,5 j-h |
| `preuve-avant-declaration` | `principles` | **LOT 0** *(déplacé depuis Loki)* — cité par **Loki** et **Gandalf** | **ATOMIQUE** | +0,25 j-h |
| `canon-avant-citation` | `principles` | **LOT 0** | **ATOMIQUE** | +0,25 j-h |

### 2.1 `iakaframe-fabrication` — skill **COMPOSÉE**

```
iakaframe-fabrication                        (layer: capacity)
  ├─ iakaframe-gestion-de-source   (commiter)
  ├─ iakaframe-conteneurisation    (builder / mettre en stage)
  └─ iakaframe-jalon               (remise à Legolas)
```

**Motif** : Gimli est le **seul agent du roster sans skill** (`gimli.md:8`). Déclarer une skill
inexistante laisserait un frontmatter pointant dans le vide.

**Vérifié avant de conclure qu'elle n'existe pas** : balayage des **23** skills *(corrigé au gate :
`library/skills/README.md` était compté à tort comme une skill)*. `iakaframe-qualite`
(→ Legolas, briserait juge/partie) et `iakaframe-deploiement` (→ Helm, squad prod) sont **exclus par
étanchéité**. `iakaframe-gestion-de-source` et `iakaframe-conteneurisation` couvrent **chacune une
partie** — d'où la composition plutôt qu'un monolithe.

**Porte en propre** (n'existe nulle part) : lire l'instruction avant de coder · implémenter étape par
étape · worktrees parallèles · interdiction d'auto-validation · borne staging.
**Ne redécrit pas** : mécanique de commit, build d'image, anatomie du jalon.

> ⚠️ **Rend atteignable une chaîne de profondeur 3** :
> `gimli → fabrication → gestion-de-source → git → forgejo`. **Signalé, non tranché** — cf.
> `composabilite-familles-bibliotheque.md` § 3. **Rien dans ce lot ne grave de limite de profondeur.**

### 2.2 `preuve-avant-declaration` — principe **ATOMIQUE**

**Motif** : la règle « on ne déclare pas fait ce qu'on n'a pas constaté » est aujourd'hui **enfermée
dans la charte de Loki**, en termes graphiques (« un visuel non rendu = non livré », `loki.md:85`).
Elle est **transverse**. Deux faits l'attestent, dont un dans ce projet : au 3ᵉ gate, j'ai confirmé
une suppression non vérifiée, et un item mort serait parti au backlog.

**Vérifié** : les **16** principes listés. `qualite.md:4` porte sur le **gate de version mineure**,
pas sur le geste individuel ; `confirmation-actes-destructifs` porte sur le **risque avant action**,
pas sur la **preuve après action**. **Aucun ne couvre.**

**Atomique** : un principe n'a pas de mécanisme de composition, et l'énoncé est irréductible.
**Réutilisé par deux personas** (Loki : déclinaison graphique ; Gandalf : relecture après édition) —
c'est précisément « un élément à part que l'on compose, pas un paragraphe interne ».

> **Créé au LOT 0**, avant la série — ce qui **supprime** l'ancienne dépendance « Loki avant
> Gandalf » : le principe préexiste à tous les lots de persona. Cf. § 0.1.

## 3. Candidats identifiés mais **NON créés** (réutiliser avant créer)

| Candidat | Famille | Pourquoi pas maintenant |
|---|---|---|
| Scaffold `iakagraph/etudes/<projet>/` | `scaffolds` | La règle est **déjà écrite et opérante** (`loki.md:98-108`) et **vérifiée par Aragorn** (`:107-108`). Créer un scaffold dupliquerait une règle qui fonctionne. Candidat pour plus tard. |
| Scaffold « instruction de cadrage » | `scaffolds` | Structure portée par l'exemple (`audit-amelioration-aragorn.md`) + la skill `iakaframe-cadrage`. **Le candidat le plus sérieux du roster** — à reprendre hors phase 1. |
| Garde-fou « anti-auto-validation » (Gimli) | `guardrails` | **Écarté par doctrine** : précédent **CH-4** (anti-auto-cast d'Aragorn) acté **contractuel seul**. Traiter Gimli autrement créerait une incohérence. |
| Renommage `iakaframe-naonedge` → nom par geste | `skills` | Le nom désigne une **marque**, contraire à la convention. Mais renommer touche `SKILL_OF`, `DEFAULT_SKILLS` et le `skills:` de la persona → **structurel, phase 2**. |
| Rituel de fabrication / de jalon | `rituals` | **Doublonnerait** la skill. Les 5 rituels existants correspondent déjà à des skills homonymes. |
| 2ᵉ workflow (prod) | `workflows` | **Arbitrage Q-3 déjà rendu** : `iakaframe-3phases.md:31-32` — étape prod **dans le même workflow**, pas un workflow distinct. |

## 4. Balayage des 8 familles — synthèse par persona

Légende : **C** = création · **R** = réutilisation d'un existant · **–** = sans objet ·
**P2** = renvoyé en phase 2

| Persona | skills | principles | guardrails | rituals | workflows | scaffolds | roles | personas |
|---|---|---|---|---|---|---|---|---|
| **LOT 0** | – | **C** ×2 (`preuve-avant-declaration`, `canon-avant-citation`) + câblage `methods` | – | – | – | – | – | – |
| **Odin** | R | – | R | – | – | – | P2 | – |
| **Gimli** | **C** *(composée)* | R `commits-versionnement:4`, `cadrage-avant-code` | R *(doctrine CH-4)* | – | R | – | P2 | – |
| **Helm** | R | – | R | – | R | – | P2 | – |
| **Loki** | R *(renommage → P2)* | R *(principe du lot 0)* | R | – | – | candidat noté | P2 | – |
| **Nathalie** | R | – | R | – | – | – | P2 | – |
| **Legolas** | R | R **partielle** `qualite.md:4` | R *(étanchéité déjà mécanisée par l'absence de `Write`)* | – | R | – | P2 | – |
| **Gandalf** | R *(`subskills:[jalon]` existe)* | R *(principe du lot 0)* | R *(doctrine CH-4)* | – | R `3phases:5` | candidat noté | P2 | – |

**Réutilisations les plus notables** — le cas d'école de la règle
*(formulations corrigées au gate : j'avais surévalué les deux)* :

- `commits-versionnement.md:4` porte l'interdit `reset --hard` / `push --force` de `gimli.md:39` en
  **équivalence sémantique**, **pas** « mot pour mot » : le principe dit « côté **IA** », la charte
  « côté **agent** ». La charte doit **citer** plutôt que réécrire — mais l'alignement lexical est à
  faire à la rédaction, il n'est pas acquis.
- `qualite.md:4` porte « verdict PASS/FAIL rendu par un **gate indépendant** » — mais son `trigger`
  est « bump SemVer x.Y.z ». Il couvre donc la **campagne de version mineure et la RQV**, **pas** le
  **gate automatique par livraison** (`legolas.md:37-40`). **Réutilisation partielle**, pas totale.
  *(Cette correction lève la contradiction entre `persona-legolas-amelioration.md` et
  `persona-loki-amelioration.md:87`, qui affirmaient l'inverse l'une de l'autre.)*

## 5. Effet sur l'estimation

| Lot | Base | Création | Total |
|---|---|---|---|
| **LOT 0** | — | +0,5 (2 principes + câblage `methods/iakaframe.md` 16→18) | **0,5** |
| Odin | 0,5 | — | **0,5** |
| Gimli | 0,5 | +0,5 (skill composée) | **1,0** |
| Helm | 0,5 | — | **0,5** |
| Loki | 0,25 | — *(principe → lot 0)* | **0,25** |
| Nathalie | 0,5 | — | **0,5** |
| Legolas | 0,25 | — | **0,25** |
| Gandalf | 0,5 | — | **0,5** |
| **Sous-total série** | | | **~4,0 j-h** |
| **+ levées des gates** (B-1, B-2 · LG-1→LG-12 · F1→F8) | | | **+0,5 j-h** |
| **TOTAL** | | | **~4,5 j-h** |

*(Hors phase 2 : réconciliation structurelle, lot skills, entrée GUI.)*

## 6. Ce qu'aucune création ne résout en phase 1

**Aucun élément créé ici ne sera actif au runtime.** `iakaframe-fabrication` ne sera ni résolue ni
déployée tant que le générateur ne projette pas `skills:` (lot 2, phase 2) ; sa composition ne sera
pleinement résolue qu'après l'arbitrage sur la **profondeur** du résolveur. On écrit **le canon
juste** ; l'outillage suit. C'est assumé, pas subi.
