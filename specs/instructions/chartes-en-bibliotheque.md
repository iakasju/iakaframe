# Chartes graphiques en bibliothèque + paramètre de charte par défaut

> Instruction de cadrage (Gandalf, P1, 2026-07-19). **Lecture seule** ; ce fichier est le seul
> artefact produit. **Aucune charte n'est touchée, aucun fichier déplacé.**
> Origine : décision du décideur — *« La charte utilisée pour les docs par défaut doit être déclarée
> en paramètre du frame. Les chartes sont mises dans la library. Ainsi la library rassemble tous les
> éléments utiles de frame. »*

## 1. Problème posé — un éparpillement réel sur 3 dépôts

| Emplacement | Contenu | Dépôt |
|---|---|---|
| `iakaframe/design-naonedge/` | 1 charte, **à la racine du dépôt méthode** | `iakaframe` |
| `~/work/iakagraph/theme/` | **6 thèmes** — cartoon, grimoire, naonedge, os, photoreal, studio | `iakagraph` |
| `~/work/iakacharte/design-cinabre/` | 1 charte | `iakacharte` |

**Trois dépôts, trois conventions, et au moins une duplication apparente** (`naonedge` existe des
deux côtés). La décision règle donc **un désordre constaté**, pas une commodité de rangement.

**Symptôme déjà rencontré** : Loki « découvre le catalogue en listant les dossiers `design-*/` »
(`library/personas/loki.md:39`) — un **scan de système de fichiers local**, qui ne peut voir ni
`iakagraph/theme/` ni `iakacharte/`. Le canon de Loki décrit donc un catalogue **qu'il ne peut pas
atteindre**. C'est la même classe de défaut que les skills non déployées : un canon juste, un
runtime aveugle.

## 2. Décision 1 — nom de la famille : **`library/designs/`**

Trois candidats pesés selon la règle « nommer par le geste, pas par l'outil » :

| Candidat | Analyse |
|---|---|
| `chartes` | **Français** au milieu de familles anglaises (`personas`, `skills`, `principles`, `rituals`, `guardrails`, `workflows`, `scaffolds`, `roles`) — rupture de convention. Et « charte » est notre jargon interne. |
| `themes` | Aligné sur `iakagraph/theme/`, mais **« thème » est un mot d'outil** (Hugo, VS Code…) et désigne le rendu, pas l'intention. |
| **`designs`** | **Anglais** comme ses voisines, **désigne le geste** (concevoir l'apparence), couvre charte **et** thème sans trancher le vocabulaire d'usage. |

> **Reco : `library/designs/`**, avec `roleKey: design` déjà existant (`loki.md:5`) et
> `library/roles/design.md` — **le vocabulaire est déjà posé côté rôle**. `designs` est la famille
> homonyme du rôle qui la consomme, exactement comme `skills` l'est des personas.
>
> *(Conserver « charte » comme mot d'usage dans la prose française : on nomme le **répertoire** en
> anglais, on parle **charte** aux humains — la convention `library/` ↔ prose est déjà celle-là.)*

## 3. Décision 2 — comment le modèle absorbe une famille **non textuelle**

**C'est le vrai point de modélisation.** Les 8 familles actuelles sont **un fichier = un élément**.
Une charte porte des **assets** : CSS, tokens, polices, gabarits, logos, exemples HTML.

**Mais le précédent existe déjà, et il est dans la maison** : `library/skills/` est **la seule
famille en dossiers** — `library/skills/<id>/SKILL.md` **+ fichiers annexes** (le lot 2 spécifie
d'ailleurs une « copie **récursive et fidèle** du dossier », les skills pouvant porter des annexes).

> **Le modèle absorbe la famille sans invention : `library/designs/<id>/DESIGN.md` + assets**, sur
> le **patron exact des skills**. Aucune nouvelle mécanique — on réutilise la forme « dossier avec
> manifeste », déjà scannée par `lib/library.js` pour les skills.

**Forme d'un élément :**

```
library/designs/naonedge/
├── DESIGN.md          ← manifeste : frontmatter (id, name, description, …) + prose de charte
├── naonedge.css       ← asset
├── tokens.json        ← asset (optionnel)
└── exemples/…         ← assets (optionnel)
```

**Frontmatter aligné sur ses voisins** (`id`, `name`, `description`) **plus** ce qui est propre au
design : `entry` (fichier CSS principal), `mode` (`dark`/`light`), `extends` (§ 6), et éventuellement
`contexts` (les contextes d'usage : dev logiciel, NaonEdge, conseil/pro).

> ⚠️ **Point de vigilance à instruire au lot** : `library/skills/README.md` est aujourd'hui compté à
> tort comme une skill par certains balayages (défaut relevé au gate phase 1). Le scan de
> `library/designs/` doit **exiger le manifeste** (`DESIGN.md`) pour reconnaître un élément —
> et non « tout dossier ». Ne pas reproduire le défaut.

## 4. Décision 3 — **le FRAME porte le paramètre** (arbitrage fermé, 2026-07-19)

**Tranché par le décideur.** Le paramètre de charte vit dans le **frame**. **`methods/iakaframe.md`
reste un pur assemblage de discipline** (`principleIds`, `ritualIds`, `guardrailIds`, `roleKeys`,
`scaffoldIds`, `workflowId`) : **on ne lui ajoute pas de `designId`**.

**Motif, qui éclaire le modèle** : la charte est un **réglage de livraison**, pas une propriété de la
discipline. Une même méthode livrée en deux frames peut sortir sous **deux identités visuelles** —
c'est la situation réelle du portefeuille, où le même corpus produit des documents pour le **dev
logiciel**, pour **NaonEdge** et pour le **conseil/pro**. **La discipline ne change pas, l'habillage
si.**

> *Ma recommandation initiale (méthode par défaut + surcharge frame) n'est pas retenue et n'est plus
> instruite. L'arbitrage est plus net que ma proposition : mettre un défaut dans la méthode aurait
> réintroduit une propriété d'habillage dans la couche discipline — exactement la confusion que
> l'arbitrage évite.*

### 4.1 ⚠️ Le vrai sujet du lot : **le frame n'a aucune surface de paramétrage**

**Fait vérifié — et il est plus structurant que la famille `library/designs/` elle-même.**

`frames/releases/StefFrame1/` et `StefFrame2/` sont des **copies à plat de la bibliothèque** :
`personas/`, `roles/`, `skills/`, `principles/`, `rituals/`, `guardrails/`, `workflows/`,
`scaffolds/`, `methods/`, `teams/`, `bindings/`, `kits/`, plus `README.md` et
`methode-de-travail.md`. **Il n'existe AUCUN manifeste de frame** — ni `FRAME.md`, ni `frame.json`,
ni équivalent (vérifié : aucun fichier de manifeste à la racine des releases).

**Conséquences immédiates :**

- un frame **n'a pas d'identité déclarée** : `StefFrame1` et `StefFrame2` ne se distinguent que par
  leur **nom de dossier** ;
- un frame **ne porte ni version, ni date de génération, ni trace de ce qui l'a produit** ;
- **il n'existe nulle part où écrire `designId`.**

> **Le lot doit donc CRÉER la surface de paramétrage du frame.** Ce n'est pas un préalable technique
> mineur : c'est **le cœur structurant du chantier**. La famille `library/designs/` est, en
> comparaison, une application du patron des skills déjà connu.

**Forme proposée — `FRAME.md` à la racine de chaque release**, manifeste à frontmatter, sur le patron
de tous les autres éléments du modèle :

```yaml
---
id: StefFrame2
name: Stef Frame 2
version: 0.17.14
methodId: iakaframe          # discipline assemblée (inchangée)
teamId: iakaframe-8
bindingId: iakaframe-claude-default
kitIds: [iakaframe-claude, iakaframe-openwebui, …]
designId: naonedge-dark      # ← LE PARAMÈTRE DE CHARTE (réglage de livraison)
generatedAt: 2026-07-19T…
---
```

> **Bénéfice au-delà des chartes** : le frame gagne une **identité**, une **version** et une
> **traçabilité** qu'il n'a pas aujourd'hui, et **un endroit où déclarer les futurs réglages de
> livraison**. `designId` devient le **premier** de ces réglages, pas une exception.

**⚠️ Inconnue majeure à lever en ouverture de lot** : un frame est un **artefact de build** (une
copie). Le manifeste doit donc être **produit par ce qui construit le frame**, pas écrit à la main —
sinon il dérivera, exactement comme les contrats d'agents dérivaient avant leur générateur.
**Je n'ai pas identifié le producteur des frames** : à inventorier **avant** de spécifier le
manifeste. Si aucun générateur n'existe, le lot en crée un — et sa charge augmente sensiblement.

### 4.2 Chaîne de résolution — par où le paramètre atteint Loki

**Qui lit, et quand ?** Le paramètre est déclaré au **frame** (livraison) et consommé au **geste**
(Loki produit un support). Il faut donc un porteur entre les deux.

**Fait utile : ce porteur existe déjà.** Le déploiement d'une méthode dans un projet écrit un
**marqueur d'état** — `.claude/iakaframe-kit.json` (`cli/src/commands/switch.js:87-93`), qui contient
déjà `methodId`, `teamId`, `bindingId`, `node`, `assembledAt`.

> **Reco : `designId` transite par le marqueur déjà en place.**
>
> ```
> FRAME.md (designId)  →  déploiement  →  .claude/iakaframe-kit.json (designId)  →  Loki lit au geste
> ```
>
> **Aucun mécanisme nouveau, aucune variable d'environnement, aucun fichier de plus.** Le marqueur
> est déjà la surface qui dit « quelle méthode/team/binding ce projet utilise » ; « quelle charte »
> y appartient de plein droit.

**Lecture au moment du geste** (et non au démarrage) : Loki lit le marqueur quand il produit un
support — c'est ce qui permet de changer de charte sans redéployer.

### 4.3 Effet sur la logique contextuelle de Loki — **QUESTION RETIRÉE DU PÉRIMÈTRE**

> 🔒 **Retirée de ce cadrage par le décideur (2026-07-19). Volontairement NON instruite ici.**
> Consignée pour qu'elle ne se perde pas — **elle sera cadrée à part, plus tard**.

**Énoncé de la question renvoyée** :

> Le `designId` du frame **remplace-t-il** la logique de **charte contextuelle** de Loki
> (`library/personas/loki.md:49-59` : dev logiciel → Studio clair · NaonEdge → NaonEdge ·
> conseil/pro → NaonEdge dark), ou lui sert-il de **valeur par défaut** lorsque le contexte ne
> tranche pas ?

**Ce qui est acquis et n'a pas besoin de ce cadrage** : la **demande explicite** (« en style X »)
prime dans tous les cas — c'est déjà le canon (`loki.md:59`) et rien ici ne le remet en cause.

**Ce que ce lot fait donc, en attendant** : il **rend le paramètre disponible** (§ 4.1, § 4.2) sans
statuer sur sa **précédence** vis-à-vis de la résolution contextuelle. Les deux peuvent coexister
temporairement ; le cadrage ultérieur tranchera la hiérarchie.

> ⚠️ **Point à porter au cadrage ultérieur** (une phrase, pour ne rien perdre de l'analyse) :
> faire coexister durablement le tableau contextuel **et** le paramètre reviendrait à entretenir
> **deux sources de vérité** pour une même décision — la classe de défaut que ce projet corrige en
> boucle (`SKILL_OF` vs frontmatter, `ROLE_OF` vs `roleKey`, `DEFAULT_SKILLS`). **Ce n'est pas un
> arbitrage rendu ici**, c'est le risque à instruire là-bas.

**Sans effet sur le lot Loki de phase 1**, dont le périmètre reste : fermer le
point ouvert Cinabre en **NaonEdge dark** sur les 4 emplacements (levée B-1) et créer le principe
`preuve-avant-declaration`. **Ce lot n'est pas mis en attente de ce cadrage.**

### 4.4 Frame livré **sans charte** — dégradation gracieuse obligatoire

**Principe iaka : pas de dépendance dure.** Un frame sans `designId` — ou un projet sans marqueur,
ou un `designId` pointant sur un design absent — **ne doit jamais empêcher la production de
documents**.

| Situation | Comportement attendu |
|---|---|
| `designId` absent du frame | Loki **produit quand même**, en **rendu neutre minimal** (lisible, sans identité de marque), et **signale** que la charte n'est pas déclarée |
| `designId` déclaré mais design introuvable | **signalement explicite** (l'id est nommé) + même repli neutre — **jamais** un repli silencieux sur une charte arbitraire |
| Aucun marqueur (projet hors frame) | idem — le geste reste possible |

> ⚠️ **Signal, jamais gate** — même règle que celle établie pour `assemble`
> (`composabilite-familles-bibliotheque.md` § 3bis.3). Un avertissement ne doit **jamais** devenir
> une sortie non-zéro : le jour où « charte non déclarée » bloquerait une production, on aurait
> introduit exactement la dépendance dure que le principe interdit.
>
> **Ce qu'il ne faut PAS faire** : replier silencieusement sur « la première charte trouvée » ou sur
> un id codé en dur. Un repli **invisible** sur une charte de marque produirait des documents
> faussement on-brand — plus dangereux qu'un rendu neutre assumé.

## 5. Décision 4 — migration des 3 emplacements

| Source | Devenir proposé | Motif |
|---|---|---|
| `iakaframe/design-naonedge/` | **Rapatrié** → `library/designs/naonedge/` | Il est **déjà dans ce dépôt**, à la racine — c'est exactement l'anomalie que la décision corrige |
| `~/work/iakacharte/design-cinabre/` | **Rapatrié** → `library/designs/cinabre/` | Dépôt mono-charte ; le rapatriement le vide de sa raison d'être (à acter) |
| `~/work/iakagraph/theme/` (6) | **À DÉCIDER** — cf. ci-dessous | **Convention de portefeuille documentée** |

> ⚠️ **Ne pas casser les conventions du portefeuille par effet de bord.** Deux mémoires sont en jeu :
> - `iakagraph/theme/` est documenté comme **le réservoir de chartes** (mémoire
>   `iakagraph-reservoir-themes` : « les thèmes vivent dans `iakagraph/theme/`, pas `design-*/` ») —
>   la décision **inverse cette convention**. Ce n'est pas un problème (une décision postérieure
>   prime), mais **la mémoire doit être mise à jour**, sinon le portefeuille porte deux règles
>   contradictoires.
> - `iakagraph/etudes/<projet>/` est le **rangement des études de Loki** (mémoire
>   `loki-etudes-iakagraph`, inscrite dans son rôle et vérifiée par Aragorn). **Ce chantier n'y
>   touche pas** — études ≠ chartes. **À écrire explicitement dans le lot** pour qu'aucun
>   déplacement ne l'emporte.

**Trois voies pour `iakagraph/theme/` :**

| Voie | Analyse |
|---|---|
| **1 — Rapatrier les 6** dans `library/designs/` | Applique la décision à la lettre : « la library rassemble tous les éléments utiles ». Mais `iakagraph` est **mutualisé entre projets** — rapatrier dans `iakaframe` rend les 6 thèmes captifs d'un dépôt de méthode |
| **2 — Rapatrier les chartes *de méthode*, laisser les thèmes d'étude** | Distingue **charte livrable** (élément de frame) et **thème exploratoire** (matière d'étude, avec `etudes/`). Cohérent avec la coupure déjà faite chez Loki entre **étude** et **livrable final** |
| **3 — Référencer sans déplacer** | Contredit la décision (« mises **dans** la library ») et réinstalle la dépendance à un dépôt frère — le problème que `vendor-check` traite ailleurs |

> **Reco Gandalf : voie 2**, et je la crois fidèle à l'intention. La décision dit « les chartes »,
> pas « tous les thèmes ». Un **thème d'exploration** (cartoon, photoreal…) n'est pas un **élément
> utile de frame** : c'est de la **matière d'étude**, dont `iakagraph/etudes/` est déjà le lieu.
> Rapatrier `naonedge` (+ `studio`, `os` s'ils sont des chartes de production) et **laisser les
> thèmes purement exploratoires** dans `iakagraph`.
>
> **Ce que je ne peux pas trancher seul** : lesquels des 6 sont des **chartes de production** et
> lesquels sont des **explorations**. C'est une **connaissance de Loki** (§ 9, point 4) — un tri à
> faire avec lui, pas depuis les noms de dossiers.

**Duplication `naonedge`** (`iakaframe/design-naonedge/` **et** `iakagraph/theme/naonedge/`) : à
**diffé avant tout déplacement**. Si divergence, arbitrer laquelle fait foi — **ne pas fusionner à
l'aveugle**.

## 6. Décision 5 — composabilité : **OUI**, et le besoin est immédiat

**Réponse à la grille : une charte EST composable.** C'est même le premier cas où la composition a un
usage **déjà attesté** — l'arbitrage Cinabre a produit la valeur **« NaonEdge dark »**, c'est-à-dire
**une variante d'un design existant**.

Cadre selon `composabilite-familles-bibliotheque.md` : un design décrit un **habillage**, pas un
**périmètre** — il tombe donc du côté **composable** de l'invariant, avec `skills`, `workflows`,
`principles`, `rituals`, `scaffolds`.

**Forme proposée** — une **dérivation**, pas un assemblage :

```yaml
id: naonedge-dark
extends: naonedge     # hérite tokens/CSS ; ne redéfinit que les écarts
mode: dark
```

> **Nuance de modélisation à instruire** : les autres familles composables font de l'**agrégation**
> (une skill *contient* des sous-skills). Un design fait plutôt de la **spécialisation** (une variante
> *hérite* d'une base et **surcharge**). Les deux sont de la composition intra-famille (mécanisme A),
> mais la **sémantique de résolution diffère** : agréger = **union**, dériver = **override**.
> **À trancher au lot** : réutiliser le vocabulaire `subskills`-like, ou introduire `extends` avec
> une résolution par surcharge. *Reco : `extends` + surcharge* — c'est la sémantique réelle, et
> forcer l'agrégation produirait des unions de CSS incohérentes.

**Profondeur** : même question qu'ailleurs (`composabilite… § 3`) — une chaîne
`base → dark → dark-compact` est concevable. **Ne rien graver** : la profondeur est arbitrée
globalement en phase 2.

## 7. Effet sur la décision Cinabre déjà rendue (LK-1)

**Je valide la recommandation du coordinateur, et je n'ai pas trouvé mieux.**

Phase 1 (LK-1 / N-3) écrit **« conseil/pro → NaonEdge dark » en dur** dans `loki.md:57`,
`iakaframe-naonedge/SKILL.md:4` et `:35`, et `nathalie.md:41`. Le lot « designs » remplacera ensuite
la valeur en dur par une **référence au paramètre**.

**Pourquoi ne pas écrire la référence tout de suite** — j'ai cherché une écriture « non défaisable » :

- Référencer un `designId` qui n'existe pas serait **exactement** le défaut qu'on s'interdit chez
  Gimli (« déclarer une skill inexistante laisserait un frontmatter pointant dans le vide »).
- Écrire « la charte par défaut est celle du frame » **sans paramètre** rendrait la charte de Loki
  **inapplicable** : il n'aurait aucun moyen de résoudre le défaut, alors qu'aujourd'hui le tableau
  lui donne une réponse.
- Une formulation intermédiaire (« NaonEdge dark, jusqu'à ce que le paramètre existe ») réintroduirait
  un **point ouvert dans le canon** — précisément le défaut que LK-1 corrige.

> **C'est la même logique que pour les skills** : on écrit **le canon juste** avec les moyens du
> moment, l'outillage suit. Le coût de la reprise est **faible et borné** : 4 occurrences déjà
> inventoriées ligne à ligne (LK-1), qui deviennent une **liste de travail** pour le lot designs.
>
> **Une seule atténuation réellement utile**, que je retiens : que LK-1 écrive la valeur **sous forme
> de règle nommée** (« charte par défaut du contexte conseil/pro : **NaonEdge dark** ») plutôt que
> noyée dans une cellule de tableau — pour que la substitution ultérieure soit un
> **remplacement localisé** et non une réécriture du tableau. **Aucun coût en phase 1.**

## 8. Décision 6 — **où ce chantier se range : LOT DÉDIÉ, après la phase 1**

**Ni phase 1, ni phase 2 telle qu'elle est définie.**

- **Pas phase 1** : la phase 1 est « améliorer le **contenu d'une charte de persona** ». Ce chantier
  crée une **famille**, touche le **modèle de méthode/frame** et **3 dépôts**. Hors périmètre, sans
  ambiguïté.
- **Pas dans la phase 2 telle que définie** : la phase 2 est la **réconciliation d'équipe** (`roleKey`,
  `library/roles/`, `assemble`, promotion de `deploiement`, re-vendorage, entrée GUI). Y greffer les
  designs **dilaterait un lot déjà lourd**, dont le gate a déjà FAIL trois fois.
- **Lot dédié**, **après la phase 1**, **parallélisable avec la phase 2** : les deux ne se recouvrent
  pas (designs ↔ rôles/roster). Deux points de contact seulement, à surveiller : *(a)* la reprise des
  4 occurrences de LK-1 ; *(b)* l'arbitrage global de **profondeur de composition**, commun aux deux.

> **Reco d'ordonnancement : phase 1 → lot designs → phase 2**, ou **phase 1 → (designs ∥ phase 2)**.
> Le lot designs est **moins risqué** que la phase 2 (il n'a pas de régression silencieuse connue) et
> **débloque une gêne réelle** : Loki ne peut pas voir son propre catalogue.

## 9. Points que SEUL le décideur tranche

1. **Nom de la famille** : `designs` (reco) · `chartes` · `themes`.
2. ~~Où vit le paramètre~~ — **TRANCHÉ : le frame** (§ 4). Plus d'arbitrage.
3. **Le manifeste de frame `FRAME.md`** (§ 4.1) : sa création est-elle **dans ce lot**, ou fait-elle
   l'objet d'un **lot préalable** ? Il dépasse les chartes — il donne au frame identité, version et
   traçabilité. *Reco : **dans ce lot**, car `designId` n'a nulle part où vivre sans lui ; mais le
   décideur peut vouloir le sortir, auquel cas ce lot en dépend.*
4. ~~Le paramètre remplace-t-il le tableau contextuel de Loki~~ — 🔒 **RETIRÉE de ce cadrage**
   (§ 4.3). Sera cadrée à part, plus tard. **Ne pas la trancher ici.**
5. **Sort de `~/work/iakagraph/theme/`** : rapatrier les 6 · **rapatrier les chartes de production et
   laisser les thèmes d'étude** (reco) · référencer sans déplacer.
6. **Tri production ↔ exploration** parmi les 6 thèmes — **nécessite Loki**, ne peut se faire depuis
   les noms de dossiers.
7. **Sort du dépôt `iakacharte`** : vidé de sa raison d'être par le rapatriement — archivé, ou
   conservé pour autre chose ?
8. **Sémantique de composition** : `extends` + surcharge (reco) · agrégation à la `subskills`.
9. **Duplication `naonedge`** : quelle version fait foi, après diff.

## 10. Estimation

| Poste | Charge |
|---|---|
| **Manifeste de frame `FRAME.md`** : forme + **générateur** (§ 4.1) | **~1 j-h** |
| Famille `library/designs/` : scan exigeant le manifeste, intégration `lib/library.js` + `list`/`show` | **~0,75 j-h** |
| `designId` : du `FRAME.md` au marqueur `.claude/iakaframe-kit.json` + résolution au geste (§ 4.2) | **~0,5 j-h** |
| Repli gracieux quand aucune charte n'est déclarée (§ 4.4) | **~0,25 j-h** |
| Migration des chartes rapatriées (+ diff `naonedge`, mise à jour des références) | **~0,5 j-h** |
| Composition `extends` + surcharge (§ 6) | **~0,5 j-h** |
| Reprise des 4 occurrences en dur de LK-1 → référence au paramètre | **~0,25 j-h** |
| Mise à jour des mémoires portefeuille + doc (`docs/commandes.md`) | **~0,25 j-h** |
| **Total** | **~4 j-h** |

> **Solde de deux mouvements opposés.** *(+1,5 j-h)* l'arbitrage « le frame porte le paramètre » a
> fait apparaître que **le frame n'a aucune surface de paramétrage** (§ 4.1) : créer le manifeste et
> surtout son **générateur** est un poste entier, absent de mon chiffrage initial (~2,75) — découverte
> de cadrage, pas dépassement. *(−0,25 j-h)* le **retrait** de la question de précédence (§ 4.3)
> allège le poste Loki, qui se réduit au **repli gracieux**.

- **Complexité : moyenne-haute.** La partie designs réutilise des patrons connus (dossier+manifeste
  des skills, marqueur d'état existant). **La partie manifeste de frame est neuve** : rien n'existe.
- **Risque : moyen-haut**, sur deux foyers : *(a)* **la migration multi-dépôts** — déplacer des
  chartes utilisées par des livrables existants peut casser des chemins CSS ; *(b)* **le générateur
  de frame**, si le producteur actuel des releases s'avère être un geste manuel.
  **Mitigation** : diffé avant déplacement, inventaire des références `design-*/` **avant** tout
  mouvement, et **identification du producteur de frames en tout premier**.
- **Inconnues** :
  - **(a) le producteur des frames n'est pas identifié** (§ 4.1) — **inconnue principale** : si
    aucun générateur n'existe, ce poste peut doubler ;
  - (b) le tri production/exploration des 6 thèmes (§ 9 point 6) fait varier la migration du simple
    au triple ;
  - (c) le contenu réel de `~/work/iakagraph/theme/` **n'a pas été audité** — je me fie à
    l'inventaire fourni ;
  - (d) l'existence d'autres consommateurs des chemins `design-*/` hors des 3 dépôts cités
    **n'est pas vérifiée**.

## 11. Ce que cette instruction ne fait pas

Aucune charte modifiée, aucun fichier déplacé, aucune famille créée. **Cadrage seul.**
