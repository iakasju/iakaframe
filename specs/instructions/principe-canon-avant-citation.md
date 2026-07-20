# Principe `canon-avant-citation` — création et câblage

> Instruction de cadrage (Gandalf, P1, 2026-07-20). Décision du décideur : « canon avant citation »
> devient un **principe de bibliothèque**, au même titre que `preuve-avant-declaration`.
> **Ce fichier spécifie le principe ; il ne le crée pas** — cf. § 8.

## 1. Origine — un défaut réel, daté et vérifiable

**Ne pas créer ce principe dans le vide.** Il naît d'un défaut de **cette série**, comme
`preuve-avant-declaration` naît de mon propre manquement au 3ᵉ gate.

**Le cas d'espèce** : `library/personas/nathalie.md:41` **cite** le tableau des chartes par défaut,
que `library/personas/loki.md:53-57` **détient comme canon** (et que
`library/skills/iakaframe-naonedge/SKILL.md:35` duplique). L'arbitrage Cinabre → **NaonEdge dark**
devait donc être écrit **des deux côtés**.

**Ce qui serait arrivé sans la règle** : dans l'ordre initial (**Nathalie avant Loki**), la
**citation** aurait été corrigée **deux commits avant le canon**. Entre les deux, le dépôt aurait
porté :

| Fichier | Affirmation |
|---|---|
| `nathalie.md:41` | conseil/pro → **NaonEdge dark** |
| `loki.md:57` | conseil/pro → **Cinabre**, *à confirmer* |

**Deux vérités opposées, lisibles par un humain comme par un agent**, dans un dépôt dont les suites
seraient restées vertes — aucun test ne compare une charte à une autre.

**Ce qui a évité le défaut** : la permutation **Loki avant Nathalie**. Mais cette protection
ne vivait que dans un **rang d'exécution** — un réordonnancement l'aurait effacée sans que personne
ne le voie. **C'est cette fragilité qui justifie d'en faire un principe** : une règle qui ne vit que
dans un ordre disparaît avec l'ordre.

## 2. Point 1 — Portée : **les deux**, et l'ordre découle de la structure

**Tranché : le principe est d'abord STRUCTUREL ; sa conséquence temporelle est l'ordre d'écriture.**
Je rejoins la lecture du décideur et je l'explicite, car les deux facettes ne se contrôlent pas au
même moment.

**Règle structurelle (permanente)** — *une citation doit toujours pouvoir être résolue vers son
canon* :

1. **Existence** — ce qui est cité **existe** dans le dépôt ;
2. **Unicité** — le canon a **un seul détenteur** (une citation ne désigne pas deux sources) ;
3. **Direction** — la citation **pointe vers** le canon, jamais l'inverse : **le canon ne dépend pas
   de ses citations**, il doit rester compréhensible seul.

**Règle temporelle (au moment d'écrire)** — *conséquence directe de la précédente* : si un même
changement touche le canon **et** ses citations, **le canon est écrit d'abord**. Un canon écrit après
sa citation viole la règle structurelle pendant tout l'intervalle : la citation y est
**irrésolvable** ou **contradictoire**.

> **Pourquoi ne pas se limiter à l'ordre** — c'est le cœur de l'arbitrage : réduit à une règle de
> commits, le principe ne dirait rien du cas où **aucun ordre n'est en jeu** (une citation qui
> désigne un canon inexistant, ou deux canons concurrents). Or c'est **la même faute** : le lot 2
> l'a rencontrée en interdisant de « déclarer une skill inexistante — un frontmatter pointant dans
> le vide ». **L'ordre n'est que le cas où la faute est temporaire.**

## 3. Point 2 — Ce qu'il ajoute aux principes voisins : **direction et ordre**, pas unicité

Vérification faite sur les 16 principes existants. Trois voisins possibles :

| Principe | Ce qu'il dit | Recouvrement ? |
|---|---|---|
| `reutilisation-existant:4` | « Réutiliser l'infra, les services et les MCP **avant de réimplémenter** une capacité » | **Non** — il parle de **ne pas reconstruire une capacité**. Il ne dit rien de deux fichiers en relation de citation |
| `cadrage-avant-code` | l'instruction précède l'implémentation | **Non** — même forme « X avant Y », mais entre **phases**, pas entre **fichiers** |
| `documentation` | tenir la doc à jour | **Non** — fraîcheur, pas direction |

**Le fil « seconde source de vérité »** qui traverse tout ce projet — `SKILL_OF` vs frontmatter,
`ROLE_OF` vs `roleKey`, `DEFAULT_SKILLS`, le tableau des chartes dupliqué — porte sur l'**unicité**
du détenteur. **Ce fil n'est écrit dans aucun principe** ; il vit dans les instructions, au cas par cas.

> **Distinction nette, à conserver dans la rédaction :**
> - l'**unicité** est **présupposée** par ce principe (elle est sa condition n°2), elle n'est pas
>   son apport ;
> - son **apport propre** est la **DIRECTION** (qui pointe vers qui) et l'**ORDRE** (qui est écrit
>   d'abord).
>
> Autrement dit : *« il n'y a qu'un détenteur »* est une chose ; *« et tout le reste pointe vers lui,
> et il est écrit en premier »* en est une autre. Le principe dit **la seconde**.

**Il ne recouvre donc aucun principe existant**, et ne les rend pas redondants.

## 4. Point 3 — Vérifiabilité : **discipline de revue aujourd'hui**, mécanisable partiellement plus tard

**Réponse franche, dans la même posture que les critères non automatisables de la phase 1 et que la
doctrine CH-4** (une contrainte non mécanisable est **contractuelle**, et on le dit).

**Aujourd'hui : NON mécanisable.** Motif technique précis — **les citations ne sont pas marquées**.
`nathalie.md:41` cite le tableau de Loki **en prose libre** ; rien ne distingue, pour une machine,
une citation d'une reformulation ou d'une affirmation autonome. Sans marquage, **aucun linter ne peut
savoir qu'il regarde une citation**.

**Ce qui SE CONSTATE, en revue** (le principe n'est donc pas un vœu) — quatre contrôles :

| # | Contrôle | Comment |
|---|---|---|
| V1 | Le canon cité **existe** | ouvrir la référence |
| V2 | Il a **un seul** détenteur | chercher les duplicats du contenu cité |
| V3 | La citation **ne contredit pas** le canon | lecture croisée |
| V4 | Dans un changement touchant les deux, le **canon précède** | ordre des commits |

**Partiellement mécanisable plus tard, à une condition** : introduire une **convention de marquage**
des citations (référence explicite `fichier:ligne`, ou un champ de frontmatter). Alors V1 devient
automatisable (la cible existe-t-elle ?) et V4 aussi (ordre des commits touchant la paire).
**V2 et V3 resteraient humains** — détecter une reformulation contradictoire est un jugement de sens.

> **À écrire dans le principe lui-même** : qu'il est **contrôlé en revue**, pas par une garde. Un
> principe qui promettrait une mécanique inexistante serait exactement le défaut relevé au gate à
> propos de mon bornage — *« ne pas présenter comme mécanisé ce qui est contractuel »*.
> **Chantier de marquage : hors périmètre**, à noter au backlog si le décideur veut l'ouvrir.

## 5. Contenu proposé du fichier

`library/principles/canon-avant-citation.md` — frontmatter aligné sur ses voisins
(`id`, `label`, `policy`, `trigger` — cf. `reutilisation-existant.md:1-6`) :

```markdown
---
id: canon-avant-citation
label: Canon avant citation
policy: "Toute citation désigne un canon unique, existant et identifiable, et pointe vers lui sans qu'il dépende d'elle ; quand un même changement touche le canon et ses citations, le canon est écrit AVANT. Sinon le dépôt porte, entre deux commits, deux fichiers qui affirment deux vérités contradictoires."
trigger: "un fichier reprend une information qu'un autre détient comme référence"
---
# Canon avant citation

Principe transverse iakaframe **né d'un défaut constaté** (série « amélioration des personas »,
2026-07-19) — et non extrait du narratif, contrairement à ses voisins.

**Politique.** Toute citation désigne un canon unique, existant et identifiable, et pointe vers lui
sans qu'il dépende d'elle ; quand un même changement touche le canon et ses citations, le canon est
écrit AVANT.

**Déclencheur.** un fichier reprend une information qu'un autre détient comme référence.

**Trois conditions structurelles.** *Existence* : ce qui est cité existe. *Unicité* : un seul
détenteur. *Direction* : la citation pointe vers le canon ; le canon reste compréhensible seul.

**Conséquence temporelle.** Le canon est écrit d'abord. Un canon écrit après sa citation rend
celle-ci irrésolvable ou contradictoire pendant tout l'intervalle.

**Origine.** `library/personas/nathalie.md` cite le tableau des chartes par défaut détenu par
`library/personas/loki.md`. Dans l'ordre initial, la citation aurait été corrigée deux commits avant
le canon : le dépôt aurait affirmé « conseil/pro → NaonEdge dark » d'un côté et « Cinabre, à
confirmer » de l'autre — sans qu'aucun test ne rougisse, aucun ne comparant deux chartes. D'où la
permutation Loki avant Nathalie.

**Contrôle.** En **revue**, pas par une garde : le canon existe (V1), il est unique (V2), la citation
ne le contredit pas (V3), et le canon précède dans l'ordre des commits (V4). Les citations n'étant
pas marquées, aucune mécanique ne peut le vérifier aujourd'hui.
```

## 5bis. Tension assumée — la phase 1 violera la condition n°2 (Unicité)

> **À lire avant d'engager le lot 0.** Ce n'est pas un défaut caché : c'est un écart **connu, borné
> et daté**, que le décideur doit avoir en tête au moment d'engager.

**Le fait.** LK-1 et N-3 écrivent la valeur « conseil/pro → **NaonEdge dark** » **en dur dans 4
emplacements** : `loki.md:57`, `iakaframe-naonedge/SKILL.md:4` et `:35`, `nathalie.md:41`. Or la
condition n°2 du principe exige **un seul détenteur** du canon. **La série qui crée le principe
laissera donc quatre copies de la même vérité.**

**Pourquoi ce n'est pas une incohérence, mais un choix :**

- le § 3 pose l'unicité comme **condition présupposée**, pas comme apport du principe — l'apport
  propre est la **direction** et l'**ordre**, tous deux **respectés** ici (le canon de Loki est écrit
  avant la citation de Nathalie) ;
- la **déduplication** (factoriser le tableau charte↔skill, remplacer les valeurs en dur par une
  référence au paramètre de frame) relève de la **phase 2** et du **lot designs** —
  `chartes-en-bibliotheque.md` § 7 l'a instruit : *écrire le canon juste avec les moyens du moment,
  l'outillage suit* ;
- écrire une **référence à un paramètre inexistant** serait le défaut qu'on s'interdit chez Gimli
  — « un frontmatter pointant dans le vide ».

> **Formulation honnête** : la phase 1 **améliore la direction et l'ordre** sans **encore** rétablir
> l'unicité. Les 4 emplacements sont **inventoriés ligne à ligne** (LK-1) et deviennent la **liste de
> travail** du lot designs. **La dette est nommée, localisée et affectée** — pas subie.

## 6. Point 4 — Câblage `methods/iakaframe.md` : deux vigilances

`methods/iakaframe.md:5-8` porte `principleIds` — **16 ids, wrappés sur 4 lignes**. L'ajout de
`canon-avant-citation` **et** `preuve-avant-declaration` porte la liste à **18**.

**Vigilance 1 — édition manuelle, wrapping préservé.** `serializeMethodMd` (GUI) **reflow les listes
wrappées sur une seule ligne** (dette ouverte, `BACKLOG.md`). Le parsing est correct et aucune
sémantique n'est perdue, mais une réécriture par la GUI produirait un **diff parasite**.
→ **Éditer à la main**, en conservant le wrap sur 4-5 lignes. **Ne pas laisser la GUI réécrire ce
fichier.** *(Ce lot ne corrige pas la dette : il en augmente l'exposition — liste plus longue, donc
plus de wrapping.)*

**Vigilance 2 — `methods/iakaframe.md` est un artefact VENDORÉ, et la copie GUI est DÉJÀ en retard.**

Il a une copie côté GUI (`packages/core/__tests__/fixtures/method.iakaframe.md`) — le **18ᵉ artefact
vendoré** relevé au 3ᵉ gate.

> **Baseline mesurée (gate 6) — à connaître avant d'engager le lot 0.** La copie GUI porte
> **14** `principleIds` contre **16** au canon : `interruption-minimale-odin` et `merge-versionnement`
> y **manquent**, la liste n'y est **pas wrappée** et le **corps est absent**. **Écart pré-existant,
> non imputable à ce lot.**
>
> **Correction de mon énoncé** : j'annonçais une rupture « élargie de 2 ». C'est faux. Le canon
> passant de 16 à 18, l'écart réel après le lot 0 sera de **4 ids**, dont **2 préexistants**.
> Le lot **ajoute 2** à un écart qui en comptait **déjà 2**.

→ **À inscrire dans le lot** au même titre que pour les personas. Rupture **assumée**, pas subie —
et **résorbée en phase 2** avec l'ensemble du re-vendorage.

**Câblage attendu :**

| Fichier | Changement |
|---|---|
| `methods/iakaframe.md:5-8` | `principleIds` : 16 → **18** (`canon-avant-citation`, `preuve-avant-declaration`), wrap préservé |
| `library/principles/canon-avant-citation.md` | **créé** (§ 5) |
| `library/principles/preuve-avant-declaration.md` | **créé** (spécifié dans `persona-loki-amelioration.md` § 5) |

## 7. Point 5 — Rangement : **LOT 0 — bibliothèque**, avant les 7

**Ce principe n'appartient à aucune persona** : il naît de la **série elle-même**. Le glisser dans le
lot d'un persona romprait la règle « un commit = un persona » et ferait porter à cet agent une
création sans rapport avec lui. Et il **doit exister avant le lot Loki**, puisque Loki et Nathalie
doivent y renvoyer (point 6).

> **Reco : créer un LOT 0 — bibliothèque**, avant Odin, portant **les deux principes** et le câblage
> `methods/iakaframe.md`.

**Bénéfice non évident, et c'est l'argument décisif** : y déplacer aussi `preuve-avant-declaration`
(aujourd'hui créé par le lot Loki) **supprime la dépendance Loki → Gandalf**. Mon instruction Gandalf
référence ce principe ; avec un lot 0, il existe dès le départ et **plus aucun lot de persona ne
dépend d'un autre pour une création de bibliothèque**.

**Effet sur l'ordre :**

> ⛔ **La séquence n'est PAS recopiée ici.** Elle vit dans sa source unique :
> **`phase1-inventaire-bibliotheque.md` § 0.2**. *(Levée LG-7 : ce fichier recopiait la séquence
> numérotée complète — un **canon dupliqué**, donc une violation de la condition n°2 (Unicité) posée
> par ce principe même, et un second fichier à toucher lors d'une renumérotation.)*

Seuls les **effets sur les dépendances** sont énoncés ici — la source des dépendances restant
`phase1-inventaire-bibliotheque.md` § 0.1 :

- dépendance **Loki → Gandalf** : **supprimée** (le principe préexiste au lot 0) ;
- dépendance **Loki → Nathalie** : **maintenue** — canon avant citation. Elle devient la **première
  application du principe**, ce qui est cohérent : le lot 0 crée la règle, la série la respecte.

**Effet sur l'estimation :**

| | Avant | Après |
|---|---|---|
| **Lot 0** (2 principes + câblage + doc) | — | **+0,5 j-h** |
| Lot Loki | 0,5 *(dont 0,25 de principe)* | **0,25** *(−0,25)* |
| **Total série** | ~4,25 j-h | **~4,5 j-h** |

*(Base 3,75 + 0,5 de levées du gate = 4,25 ; +0,5 lot 0 −0,25 Loki = **~4,5 j-h**.)*

## 8. Point 6 — Application immédiate : **spécifiée, non appliquée maintenant**

Une fois le principe créé, les deux instructions doivent **renvoyer explicitement** au principe au
lieu de laisser la dépendance implicite dans un rang. Texte à insérer, identique de part et d'autre :

> **Dépendance — `canon-avant-citation`.** Le lot **Loki** détient le tableau canon des chartes
> (`loki.md:53-57`) ; le lot **Nathalie** le **cite** (`nathalie.md:41`). Le canon est donc écrit
> **avant** la citation. Réf. : `library/principles/canon-avant-citation.md`. **Cette dépendance ne
> doit pas être déduite du rang : elle est portée par le principe.**

> ⚠️ **Je ne modifie PAS ces deux instructions maintenant.** Le gate de phase 1 **tourne dessus**.
> Les éditer sous évaluation ferait juger un état différent de celui rendu — c'est précisément le
> coût payé trois fois aujourd'hui : *un état modifié sans que le lecteur le sache*.
> **À appliquer au verdict** : si le gate rouvre les instructions, cet insert s'y intègre ; sinon il
> constitue le premier geste du lot 0.

## 9. Ce que cette instruction ne fait pas — et pourquoi

**Je ne crée pas `library/principles/canon-avant-citation.md`.** Le contenu est intégralement
spécifié (§ 5), prêt à poser.

Motif — le même que celui que j'ai instruit toute la série : **le cadrage produit des instructions,
l'exécution produit des artefacts**. `preuve-avant-declaration` est créé par l'exécutant du lot qui
le porte, pas par moi ; le traiter autrement ici casserait la symétrie et contredirait **GD-3**, le
bornage `Write`/`Edit` à `specs/instructions/` que je viens d'inscrire dans ma propre charte sur
constat de Legolas.

**Raison opérationnelle, indépendante de la doctrine** : écrire dans `library/` maintenant
**mutera le canon pendant que le gate de phase 1 l'évalue**, et déclencherait le critère de
régénération golden + déployé **hors de tout lot**.

**Point à trancher par le décideur** : si l'intention est bien que la création se fasse dans un
**lot 0 exécuté après le gate** (ma reco), rien à changer. Si l'intention était que je pose le
fichier **immédiatement**, c'est un arbitrage de périmètre qui appartient au décideur — je le
signale plutôt que de le prendre.

## 10. Estimation

**~0,5 j-h** pour le lot 0 complet : deux principes rédigés (~0,25), câblage `methods/iakaframe.md`
avec wrap préservé (~0,1), inserts de renvoi dans les deux instructions (~0,05), doc et vérification
(**`iakaframe list principles`** → 18) (~0,1). *(Syntaxe corrigée au gate LG-5.)*

- **Complexité : faible.** Aucune mécanique, deux fichiers de bibliothèque et une liste d'ids.
- **Risque : faible**, avec un point de vigilance réel : **le wrap de `principleIds`**, qu'une
  édition automatique aplatirait.
- **Inconnues** : *(a)* le lot 0 est-il gaté séparément ou avec la série ? *(b)* le chantier de
  **marquage des citations** (§ 4) est-il ouvert au backlog, ou le principe reste-t-il en contrôle
  de revue — *reco : contrôle de revue, marquage au backlog sans échéance*.
