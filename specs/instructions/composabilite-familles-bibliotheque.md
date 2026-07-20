# Composabilité des familles de la bibliothèque — note de modèle

> Note de cadrage (Gandalf, P1, 2026-07-19). **Livrable de modèle, pas une restructuration.**
> Origine : le décideur a énoncé deux fois le même principe — « une **skill** peut être un assemblage
> de skills », puis « un **workflow** peut aussi être un assemblage ». La composabilité n'est donc
> pas une propriété des skills : c'est une **propriété du modèle**. Cette note l'écrit une fois pour
> toutes, famille par famille, plutôt que de la redécouvrir au cas par cas.
> **Base de travail pour le cadrage de phase 2 et le chantier workflow. Rien n'est modifié ici.**

## 1. Distinction préalable — trois choses qu'on appelle « composition »

L'essentiel des ambiguïtés vient de ce que **trois mécanismes différents** portent le même mot. Les
séparer répond à presque toutes les questions.

| # | Mécanisme | Définition | Exemple vérifié | Outillé ? |
|---|---|---|---|---|
| **A** | **Composition intra-famille** | un élément de la famille F **contient** d'autres éléments de F | `iakaframe-init:5` → `gestion-de-source:6` → `git:6` → `forgejo` | **oui, pour `skills` seulement** (`subskills`) |
| **B** | **Référence inter-famille** | un élément de F **désigne** des éléments d'une autre famille | `persona.skills:[]`, `persona.guardrails:[]`, `workflow.phases[].agentsRoleKeys` | oui, partout |
| **C** | **Factorisation d'implémentation** | plusieurs éléments **partagent du code** | `guard-core.mjs` factorise les verdicts des 3 hooks | oui, hors modèle |

> **Le principe du décideur porte sur A.** B existe déjà partout et n'a jamais posé question.
> **C n'est pas une propriété du modèle** : que deux garde-fous partagent une implémentation ne dit
> rien de leur composabilité — c'est du génie logiciel, pas de la modélisation. Confondre C avec A
> ferait conclure à tort que les `guardrails` sont « déjà composables ».

**Question de référence pour toute la grille** : *un élément de la famille F peut-il être composé
d'autres éléments de F (A) ?* — et non « référence-t-il d'autres familles » (B, toujours vrai).

## 2. Grille famille par famille

| Famille | Composable (A) ? | Outillé ? | Verdict |
|---|---|---|---|
| `skills` (24) | **OUI** | **oui** (`subskills`) | acté ; chaîne à 3 niveaux existante |
| `workflows` (1) | **OUI** | **non** | acté par le décideur ; **assemblage inline, non réutilisable** |
| `principles` (16) | **OUI** | **non** | composition **déjà pratiquée en prose** |
| `rituals` (5) | **OUI** | **non** | composition **déjà déportée** d'un cran, dans les skills |
| `scaffolds` (2) | **OUI** | **non** | une structure contient des structures |
| `guardrails` (3) | **oui, mais sans besoin établi** | non (C ≠ A) | composabilité théorique, aucun cas d'usage |
| **`designs`** *(9ᵉ famille, à créer)* | **OUI** | non | **spécialisation**, pas agrégation — cf. § 2.9 |
| `personas` (**8** au roster) | **NON** | — | **briserait l'étanchéité** |
| `roles` (8) | **NON** | — | **fondement de l'étanchéité** |

*(Comptes corrigés au gate : **23** skills — `library/skills/README.md` n'en est pas une — et
**8** personas au roster, `_TEMPLATE` inclus ; « 9 » valait pour un `ls`, pas pour le roster.)*

### 2.1 `skills` — composable, outillé (acté)

`subskills` porte A. La bibliothèque contient déjà une chaîne de **profondeur 3** :
`iakaframe-init` → `iakaframe-gestion-de-source` → `iakaframe-git` → `iakaframe-forgejo`, avec
`layer: capacity` distinguant capacité et produit. **Le modèle porte donc déjà l'assemblage
profond** — ce n'est pas une extension à inventer. Cf. § 3 pour la conséquence sur le résolveur.

### 2.2 `workflows` — composable, **pas outillé** : le cas le plus net

L'unique workflow **est déjà un assemblage** — mais **d'éléments anonymes**. `iakaframe-3phases.md:4-13`
déclare `phases[]` et `gates[]` en **littéraux inline** :

```yaml
phases: [ {id: p1, label: Cadrage, agentsRoleKeys: [cadrage], …}, … ]
gates:  [ {afterPhase: p1, kind: human, criteria: "…"}, … ]
```

Ces phases et gates sont **structurés** mais **non réutilisables** : aucun autre workflow ne pourrait
les référencer. C'est **exactement** la situation que l'extraction d'`iakaframe-jalon` a corrigée
côté skills — un geste décrit **dans** deux chartes plutôt que référencé par les deux.

> **Nuance importante à ne pas écraser** : le workflow unique n'est **pas** un oubli. `:31-32`
> consigne un **arbitrage explicite (Q-3)** : *« étape prod + gate humain **dans le même workflow**,
> pas un workflow distinct »*. La décision de ne pas **découper en deux workflows** est prise et
> reste valable. Ce qui est en cause est différent : les **briques internes** (phases, gates, boucles)
> ne sont pas des **éléments nommés réutilisables**. On peut parfaitement garder **un** workflow
> iakaframe **et** rendre ses briques composables — les deux sujets sont orthogonaux.

### 2.3 `principles` — composable, composition **déjà pratiquée en prose**

Preuve directe, `library/principles/commits-versionnement.md:16-17` :

> « Cas particulier du **merge** : voir le principe dédié `merge-versionnement`. »

C'est une **relation de composition** (un principe en spécialise/agrège un autre), exprimée en
**prose**, sans champ dédié. Le modèle la pratique sans la porter. Un champ (`subprinciples`, ou
`refines`) la rendrait exploitable — **à cadrer en phase 2**, pas ici.

### 2.4 `rituals` — composable, composition **déportée d'un cran**

Les 5 rituels (`iakastart`, `init`, `log-conversation`, `snapshot`, `update`) correspondent à des
skills homonymes. Or c'est la **skill** `iakaframe-init` qui porte `subskills:
[gestion-de-source, etat-des-lieux]` — **pas le rituel**. La composition existe donc, mais **une
couche plus bas**.

> **Question ouverte pour la phase 2** : le rituel est-il une **façade** de la skill (auquel cas sa
> composabilité est celle de la skill, et le doublon `rituals`/`skills` mérite examen), ou un objet
> de plein droit qui devrait porter sa propre composition ? **Je ne tranche pas ici** — cela touche
> à la raison d'être de la famille.

### 2.5 `scaffolds` — composable, cas d'usage immédiat

Deux scaffolds : `projet` et `portefeuille`. Un **portefeuille contient des projets** : la
composition est dans la nature même de l'objet. Non outillée aujourd'hui. Deux candidats relevés en
phase 1 mais **non créés** (réutiliser avant créer) : la structure `iakagraph/etudes/<projet>/` de
Loki, et le squelette d'instruction de cadrage.

### 2.6 `guardrails` — composable en théorie, **aucun besoin établi**

**Renversement de l'hypothèse du coordinateur.** `guard-core` **n'est pas** de la composition de
modèle : c'est du **mécanisme C** — trois hooks partagent une implémentation de verdict. Cela ne
rend pas un garde-fou « composé d'autres garde-fous ».

La composition réelle des garde-fous se fait **par référence inter-famille (B)** : c'est la persona
qui les assemble (`guardrails: [identity, perimeter, delegation]`). Un « profil » de garde-fous
composé serait concevable, mais **aucun cas d'usage ne l'appelle** avec seulement 3 éléments.

> **Reco** : ne rien outiller. Et maintenir la doctrine **CH-4** — une contrainte non mécanisable
> reste **contractuelle** (précédent anti-auto-cast d'Aragorn), plutôt que de multiplier les
> garde-fous pour couvrir des règles de prose.

### 2.9 `designs` — **9ᵉ famille, composable par SPÉCIALISATION** *(à créer — cf. instruction dédiée)*

Décision du décideur (2026-07-19) : les chartes graphiques entrent en bibliothèque, et le
**frame** porte le paramètre de charte par défaut. Cadrage complet :
`specs/instructions/chartes-en-bibliotheque.md`.

**Composable : OUI**, et c'est la famille dont le besoin de composition est le plus **immédiatement
attesté** — l'arbitrage Cinabre a produit la valeur **« NaonEdge dark »**, soit une **variante d'un
design existant**.

**Côté composable de l'invariant** : un design décrit un **habillage**, pas un **périmètre**.

> ⚠️ **Nuance de modélisation — cette famille compose autrement que les autres.**
> Les composables actuelles font de l'**agrégation** (une skill *contient* des sous-skills →
> résolution par **union**). Un design fait de la **spécialisation** (une variante *hérite* d'une
> base et **surcharge** → résolution par **override**).
>
> Les deux relèvent bien du **mécanisme A** (composition intra-famille), mais leur **sémantique de
> résolution diffère**. Forcer l'agrégation produirait des unions de CSS incohérentes.
> **Reco : `extends` + surcharge.** La grille du § 2 doit donc distinguer désormais **deux
> sémantiques de composition**, et non plus une seule.

**Première famille non purement textuelle** (assets CSS, tokens, gabarits) : absorbée sans mécanisme
nouveau, sur le **patron dossier + manifeste** déjà utilisé par `library/skills/`.

### 2.7 `personas` et `roles` — **RÈGLE FERMÉE DU MODÈLE** (arbitrage décideur, 2026-07-19)

> ## ⛔ INVARIANT — ce qui se compose, ce qui ne se compose pas
>
> **Les `personas` et les `roles` ne sont PAS composables.** Règle **arrêtée par le décideur**, non
> rouvrable par commodité.
>
> **Se composent : les CAPACITÉS** — `skills`, `workflows`, `principles`, `rituals`, `scaffolds`.
> **Ne se composent pas : les IDENTITÉS et les PÉRIMÈTRES** — `personas`, `roles`.
>
> **Un persona acquiert des capacités par composition de skills — c'est sa SEULE voie
> d'enrichissement. Il n'absorbe jamais un autre persona, ni un autre rôle.**

**Motif — c'est lui qui rend la règle défendable dans six mois.**

Composer un périmètre, **c'est le dissoudre**. L'étanchéité des périmètres est le fondement de la
méthode : elle est ce qui rend les experts **discriminables** (modèle MoE), validé ✅ **7/7** en
dimension 2 de l'audit — le seul point où le roster est irréprochable.

- **Pour les `personas`** : un persona qui en assemblerait un autre **rouvrirait exactement la dérive
  que la clause anti-auto-cast d'Aragorn interdit** — « il ordonne mais ne code pas, il ne s'auto-caste
  pas ». Une lacune de casting s'**escalade**, elle ne s'**absorbe** pas. La mémoire
  `iakaframe-team-collapse-gimli-solo` documente la dérive **réellement survenue** quand les
  périmètres se sont fondus. Et le gate qualité **indépendant** repose entièrement sur le fait que
  Legolas n'est **pas** un sous-composant de Gimli : rendre les personas composables rendrait
  « Gimli compose Legolas » **exprimable** — donc, un jour, écrit.
- **Pour les `roles`** : plus fondamental encore. Le rôle est **l'atome de l'étanchéité** — c'est lui
  qui définit qu'un intervenant fait *ceci* et pas *cela*. Un rôle composable **dissoudrait la notion
  même de périmètre étanche**, et avec elle le modèle d'experts discriminables.

**Confirmation empirique — l'unique approximation existante est aussi le pire défaut du dépôt.** Le
seul cas approchant un rôle « rattaché » à un autre est **Helm → `coordination`**
(`cli/src/lib/agents.js:23`), rattrapé par l'exception `SKILL_OVERRIDE_OF`. Ce rattachement a
produit : une exception codée, l'absence de Helm du roster GUI, et un rôle `deploiement` invisible.
Argument empirique, pas théorique.

**Deux nuances à ne pas perdre** (elles évitent de sur-appliquer la règle) :

- **Un persona compose déjà — mais des skills (B), pas des personas (A).** C'est la **bonne réponse**
  au besoin réel « mutualiser un savoir-faire entre agents » : on extrait une skill partagée
  (`iakaframe-jalon`), on ne fait pas hériter une persona d'une autre. Le besoin est légitime ; la
  famille de réponse n'est pas `personas`.
- **Ordonner ≠ contenir.** Les rôles peuvent être **ordonnés** (`roleIndex`) et **groupés** en vues
  sans être composés. La règle n'interdit pas la structuration, elle interdit l'**absorption**.

## 3. Conséquence pour le résolveur — la profondeur (à arbitrer en phase 2)

**C'est l'implication la plus opérationnelle de cette note.**

J'avais proposé une résolution des `subskills` à **profondeur 1**, justifiée par : *« aucune chaîne
atteignable depuis une persona ne dépasse 1 niveau »*. Deux faits invalident cette base :

1. **Elle devient fausse en phase 1** : la skill `iakaframe-fabrication` proposée pour Gimli est
   **composée**, ce qui rend atteignable
   `gimli → fabrication → gestion-de-source → git → forgejo` — **profondeur 3**.
2. **Elle inverse la responsabilité** : si l'assemblage est un **principe du modèle**, alors une
   limite de profondeur est une **contrainte du résolveur**, pas une propriété du canon. Le critère
   **B28** que j'avais proposé (*erreur explicite au-delà de la profondeur 1*) **interdirait au
   modèle de s'exprimer** pour protéger l'implémentation. C'est à l'envers.

**Ce que la phase 2 doit trancher :**

| Point | Enjeu |
|---|---|
| **Profondeur** | bornée (et à combien) ou **illimitée** ? Reco : illimitée — c'est la position cohérente avec le principe |
| **Cycles** | dès que la profondeur est non bornée, la **détection de cycle devient obligatoire** (A → B → A). Aujourd'hui rien ne l'assure |
| **Ordre & dédoublonnage** | à spécifier pour un **arbre**, pas une liste : reco **DFS pré-ordre, première occurrence gagnante** — déterministe et golden-able |
| **Sort de B28** | **à rouvrir** : de « erreur au-delà de 1 » vers « erreur sur cycle ou profondeur aberrante » |
| **Composition des autres familles** | faut-il un mécanisme **générique** (un `sub<famille>` uniforme) ou des champs ad hoc ? Reco : générique, une fois le besoin confirmé sur ≥ 2 familles |

## 3bis. Vérifications imposées par l'invariant (§ 2.7)

> Deux contrôles demandés par le décideur. **Constat uniquement — aucune correction en phase 1.**

### 3bis.1 Existe-t-il un chemin détourné de composition de personas / rôles ? — **OUI, deux**

**Aucun mécanisme direct.** Le frontmatter persona (`id`, `name`, `description`, `roleKey`,
`royaume`, `pastille`, `skills`, `guardrails`, `vignette`) ne porte **ni `extends`, ni `parent`, ni
référence à une autre persona** ; le modèle GUI (`Persona`) non plus. `library/roles/*.md` (8
fichiers) ne porte aucune référence croisée. **Le modèle ne permet pas la composition explicite.**

**Mais deux chemins détournés produisent l'effet d'une absorption :**

| # | Chemin | Mécanisme | Effet |
|---|---|---|---|
| **D-1** | **Rôle partagé par deux personas** | `ROLE_OF.helm = 'coordination'` (`cli/src/lib/agents.js:23`) — Helm et Aragorn portent **le même rôle** | La capacité du rôle (`SKILL_OF.coordination` = `iakaframe-aragorn`) est **héritée par Helm**. Corrigée **uniquement** par l'exception ad hoc `SKILL_OVERRIDE_OF` (`:42-44`). **Sans cette exception, Helm porterait la skill du coordinateur** — une absorption de fait. |
| **D-2** | **Repli coordinateur** | règle du 2026-07-16 (cf. 3bis.2) | Un rôle absent/incomplet est déclaré « couvert par le coordinateur » — **absorption à l'exécution**, sans trace |

> **Défauts inscrits, non corrigés** (phase 1 = constat). D-1 est déjà au périmètre de la phase 2
> (promotion de `deploiement`, suppression de `SKILL_OVERRIDE_OF`) : **le traitement prévu le referme**
> mécaniquement. D-2 est un sujet neuf — cf. ci-dessous.

### 3bis.2 La règle de repli coordinateur est-elle compatible avec l'invariant ? — **OUI ; c'est son SILENCE qui ne l'est pas**

> ⚠️ **Section rectifiée après arbitrage (2026-07-19) — cf. § 7.** La version initiale concluait
> « NON, en l'état » et proposait de *requalifier* la règle. **Ce verdict visait la mauvaise cible.**
> La règle est **conservée** et **compatible** avec l'invariant ; ce qui pose problème est sa
> **silenciosité**. L'analyse ci-dessous est conservée parce qu'elle établit la distinction utile —
> **sa conclusion est celle du § 3bis.3**, pas celle de la version initiale.

**La règle** (mémoire `iakaframe-role-fallback-coordinateur`, 2026-07-16) : *un rôle incomplet ou
absent est pris par le coordinateur par défaut ; `assemble` ne doit pas le traiter en orphelin
bloquant.*

**Analyse à la lumière de l'invariant.** Tout dépend de ce que « pris par » veut dire — et deux
lectures très différentes cohabitent sous les mêmes mots :

| Lecture | Ce que fait le coordinateur | Compatible avec l'invariant ? |
|---|---|---|
| **(i) Absorption du périmètre** | il **exécute** le rôle manquant | **NON** — c'est une composition de rôles (`coordination ⊃ rôle X`), interdite |
| **(ii) Portage de la lacune** | il **assume la responsabilité du manque** : le signale, l'escalade, tient la place vide | **OUI** — il ne fait qu'exercer son propre rôle de coordination |

**Ce que le comportement observé indique.** Legolas a montré au 3ᵉ gate que la règle transforme
**silencieusement 5 rôles découverts en « couverts par le coordinateur »**, *« sans que rien ne
rougisse »*. Un rôle non pourvu devient donc **indistinguable** d'un rôle pourvu. C'est la
**lecture (i)** — l'absorption — et elle est **incompatible avec l'invariant**.

> **Plus grave : elle contredit la charte du coordinateur lui-même.** La clause anti-auto-cast
> d'Aragorn énonce qu'une lacune de casting est **escaladée, jamais absorbée**. La règle de repli,
> telle qu'elle opère, fait **exactement l'inverse** — et c'est un mécanisme automatique, donc plus
> difficile à repérer qu'une dérive d'agent. **Le système contredit la charte qu'il est censé
> appliquer.**

### 3bis.3 Conclusion — **conserver la règle en l'instrumentant**

**La règle est conservée** (arbitrage § 7). Ce qui est à traiter en phase 2 n'est **pas la règle**
mais son **absence de trace** :

- le coordinateur **porte** la lacune — **le travail continue, rien ne bloque** : c'est exactement
  ce que l'arbitrage préserve, et cela ne change pas ;
- **et** le rôle reste **marqué manquant**, avec une **escalade identifiée**.

> **Ce n'est pas un affaiblissement de la règle : c'est son instrumentation.** La continuité est
> intégralement conservée. On ajoute une **trace**, on ne retire aucune capacité.

**Distinction à retenir en un mot** : **porter une lacune ≠ absorber un périmètre.** Le repli relève
du premier ; c'est le **silence** qui le faisait glisser vers le second.

**Une seule condition de compatibilité, à tenir à l'implémentation (phase 2) :**

> ⚠️ **La visibilité doit être un SIGNAL, jamais un GATE.** Marquer un rôle manquant ne doit
> **jamais** faire échouer `assemble` ni bloquer un déploiement d'équipe. Le jour où « marqué
> manquant » deviendrait « sortie non-zéro », la règle serait contredite et une configuration
> d'équipe redeviendrait une **impossibilité de faire**. **C'est le seul point où l'instrumentation
> pourrait trahir l'arbitrage — donc le seul à surveiller.**

Sous cette condition, **je ne vois aucune raison** pour laquelle la visibilité contredirait
l'intention du décideur : elle n'enlève rien à la continuité, elle empêche seulement un roster
incomplet de **passer pour complet**.

## 4. Ce que la phase 1 fait — et ne fait pas

**Fait** : elle **constate** (cette note) et **écrit le canon juste** — une skill créée en phase 1
l'est **composée** si c'est sa forme juste (cas `iakaframe-fabrication`).

**Ne fait pas** : aucune restructuration de la bibliothèque, aucun nouveau champ de composition,
**aucun découpage du workflow**. Le chantier workflow est un lot en soi.

> **Règle opératoire de la phase 1** : *ne rien graver qui interdise la composition profonde.* Les 7
> instructions de persona ne posent aucune limite de profondeur ; là où j'avais été tenté de le faire
> (B28), c'est explicitement signalé comme **rouvert** —
> cf. `persona-gimli-amelioration.md` § 6.3.

## 5. Chantiers que cette note ouvre (phase 2 ou lots dédiés)

| # | Chantier | Priorité suggérée |
|---|---|---|
| 1 | **Résolveur** : profondeur, cycles, ordre (§ 3) | **haute** — bloque le lot 2 skills |
| 2 | **Briques de workflow** nommées et réutilisables (phases, gates, boucles) | moyenne — chantier en soi |
| 3 | Champ de composition pour `principles` (§ 2.3) | basse |
| 4 | Clarifier `rituals` : façade de skill ou objet de plein droit (§ 2.4) | basse — question de fond |
| 5 | Composition des `scaffolds` (portefeuille ⊃ projet) | basse |

## 7. Note additive — arbitrages du décideur (2026-07-19)

> Ajout **postérieur** à l'analyse ci-dessus. Les §§ 3bis.2 et 3bis.3 ont été **rectifiés** en
> conséquence ; le reste est inchangé.

### 7.1 Repli coordinateur : **RÈGLE CONSERVÉE** — arbitrage fermé

**Motif du décideur** : la règle **garantit qu'aucune configuration d'équipe ne devient une
impossibilité de faire**. Un rôle absent ou incomplet ne doit **jamais** bloquer le travail.

**Arbitrage fermé.** Cette règle n'est **ni provisoire, ni un pis-aller, ni un compromis** : c'est
une **garantie de continuité**, propriété voulue du système. Ma proposition initiale de la
*requalifier* est **retirée** ; elle reposait sur une lecture qui confondait la règle avec son
défaut d'instrumentation.

**Ce qui reste ouvert en phase 2 — et qui n'est pas la règle** : sa **silenciosité**. Le défaut
démontré au 3ᵉ gate n'est pas que le coordinateur reprenne une lacune, c'est que **5 rôles sur 8**
basculent en « couverts » avec `orphans == []` et **les 4 suites au vert**. La règle assure la
continuité ; **le silence masquait une régression**. Traitement : § 3bis.3.

### 7.2 Réconciliation invariant ↔ repli — **la lecture proposée TIENT**, avec une correction

J'avais conclu à une incompatibilité. **Cette conclusion était erronée** : elle traitait un défaut
d'observabilité comme un défaut de modèle. La lecture proposée par le coordinateur — *« porter »
n'est pas « absorber »* — **tient**. Voici ce qui la fonde, et le point où sa formulation doit être
corrigée.

**Pourquoi elle tient — deux critères porteurs :**

| Critère | Composition (interdite) | Repli coordinateur |
|---|---|---|
| **Niveau** | relation du **modèle** — un rôle *contient* un rôle dans le canon | fait d'**exécution** — aucun fichier de `library/roles/` ne change |
| **Identité** | le rôle absorbé **cesse d'exister** comme élément distinct | le rôle **continue d'exister**, distinct et nommé ; seule son **exécution** est déportée |

Le périmètre du rôle ne **fusionne** pas avec celui du coordinateur : il reste défini, attribuable, et
récupérable dès qu'un intervenant est casté. **Rien n'est composé** — une exécution est déportée.

**Correction à apporter à la formulation :** le mot **« temporairement »** est le maillon faible et
**ne doit pas porter l'argument**. Une équipe peut ne jamais caster un rôle : le repli devient alors
*de facto* permanent, et un critère fondé sur la temporalité s'effondrerait. **Ce qui est porteur,
c'est la distinction, pas la durée** — un rôle jamais casté mais **toujours identifié comme non
casté** n'est toujours pas absorbé. Formulation retenue :

> **Le coordinateur exerce une lacune sans que le rôle cesse d'exister ni que son périmètre fusionne
> avec le sien. L'identité et le périmètre restent distincts ; seule l'exécution est déportée, de
> façon traçable.** *(La durée n'entre pas dans le critère.)*

**Où elle casserait — et c'est la charnière :** si le système **efface la distinction**. Un rôle
« couvert » indiscernable d'un rôle « pourvu » (`orphans == []`, rien qui rougisse) n'est plus
identifié comme distinct **dans l'état observable** — et une distinction que rien ne peut observer
n'en est opérationnellement plus une. **C'est là, et seulement là, que « porter » glisserait vers
« absorber ».**

> **D'où la synthèse : l'instrumentation du § 3bis.3 n'est pas une concession arrachée à la règle,
> c'est la CONDITION DE COHÉRENCE des deux arbitrages.** La visibilité est ce qui permet à
> l'invariant et au repli de coexister **sans aucune exception à écrire dans le modèle**. Les deux
> règles sont conservées telles quelles ; c'est leur observabilité qui les réconcilie.

**Tension résiduelle signalée (contenu, phase 2 — non résolue ici).** La clause anti-auto-cast
d'Aragorn énonce qu'une lacune de casting est *« escaladée, jamais absorbée »*. Lue au pied de la
lettre, elle peut sembler contredire le repli. Elle ne le contredit pas — elle vise l'**auto-casting
silencieux** d'un rôle appartenant à un intervenant **casté**, alors que le repli est une **règle
système déclarée** pour un rôle **non casté**, gap visible. Mais **la charte ne fait pas cette
distinction explicitement** : à préciser dans `library/personas/aragorn.md` en phase 2, pour que
charte et règle ne se lisent pas comme contradictoires. **Signalé, pas traité.**

### 7.3 Auto-audit de Gandalf — relecture confiée au gate

Le critère **GD-A10** de `persona-gandalf-amelioration.md` — relecture par un tiers, que je ne peux
pas satisfaire seul — sera porté par **Legolas**, avec mandat d'**auditer ma charte lui-même**, et
pas seulement de vérifier mon texte.

> C'est le dispositif correct et je l'ai demandé. Les deux défauts que j'ai inscrits (GD-1
> estimation, GD-2 preuve avant déclaration) sont ceux que **j'ai su voir** ; l'objet de ce mandat
> est ce que **je n'ai pas vu**. Des défauts remontés par Legolas sur ma propre charte sont un
> **résultat attendu du dispositif**, pas un échec de l'instruction.

### 7.4 Les trois arbitrages forment un ensemble cohérent — **fermé**

| # | Règle arrêtée |
|---|---|
| **1** | Les **capacités se composent** — `skills`, `workflows`, `principles`, `rituals`, `scaffolds` (grille § 2) |
| **2** | Les **identités et périmètres ne se composent pas** — `personas`, `roles` (invariant § 2.7) |
| **3** | Le **repli coordinateur est conservé** — aucune configuration ne doit devenir une impossibilité de faire — et s'exprime : **« le coordinateur PORTE la lacune »**, jamais « absorbe le périmètre » |

**Formulation retenue (arbitrage fermé) :**

> Le rôle **continue d'exister** et reste **marqué manquant** ; son périmètre **ne fusionne pas**
> avec celui du coordinateur ; seule l'**exécution** est déportée, temporairement et de façon
> **traçable**, avec une **escalade identifiée**.

> **Le point important : aucune exception n'est écrite dans le modèle.** On n'introduit pas de
> dérogation à l'invariant — on **nomme correctement** ce qui se passe. « Porter » et « absorber »
> décrivent deux opérations différentes ; seule la seconde est une composition.

*Précision de robustesse (n'affecte pas l'arbitrage) : le caractère **temporaire** décrit le cas
courant, mais ce n'est pas lui qui porte la démonstration — une équipe pourrait ne jamais caster un
rôle. Ce qui porte, c'est que **le rôle reste identifié comme non casté**. Un repli durable mais
tracé reste un portage ; un repli bref mais invisible serait une absorption.*

### 7.5 Conséquence 1 — la clause anti-auto-cast d'Aragorn : **compatible telle quelle**

Texte réel vérifié, `library/personas/aragorn.md:29-31` :

> « **N'absorbe pas un rôle non casté** : Aragorn coordonne, mais ne **reprend jamais en douce**
> […] **signalée et escaladée** au décideur (via Odin) pour **castage explicite** — jamais […] »

**Verdict : compatible, sans contradiction.** Deux éléments l'établissent :

- la clause vise **« en douce »** — c'est-à-dire le **silence**, pas la reprise ;
- elle **exige** signalement + escalade : exactement ce que produit l'instrumentation du § 3bis.3.

> **La clause ne contredit donc pas le repli : elle en énonce la condition de légitimité.** Avec
> « porter », le système fait **précisément** ce qu'elle demande — signaler et escalader au lieu
> d'absorber. **Aragorn n'a pas à être modifié pour être cohérent.**

**Ajustement recommandé (phase 2 — Aragorn hors périmètre phase 1) :** la clause **interdit le
mauvais cas** mais **ne nomme pas le bon**. Elle est muette sur le fait que, la lacune étant signalée
et escaladée, le coordinateur **peut la porter** en attendant le castage. Une phrase suffirait, pour
que charte et système ne se lisent pas comme en tension :

> *esquisse* — « Une lacune signalée et escaladée peut être **portée** par le coordinateur le temps
> du castage : il en assure l'exécution **sans** que le rôle cesse d'exister ni que son périmètre
> rejoigne le sien. Porter n'est pas absorber. »

**Signalé, non fait** — *motif corrigé au gate : ce n'est **pas** « parce que modifier une charte
relève de la phase 2 » (modifier une charte **EST** la phase 1). Le motif réel est qu'**Aragorn ne
fait pas partie des 7 personas de cette phase**.*

### 7.6 Conséquence 2 — inventaire du vocabulaire à aligner (**ne pas toucher**)

Partout où le modèle, le code ou la doc parlent d'**absorption**, de **couverture** ou de rôle
« **couvert par** le coordinateur », c'est **« porté »** qu'il faut lire. Inventaire pour rendre le
lot de phase 2 chiffrable :

| Emplacement | Occurrence | Nature |
|---|---|---|
| `cli/src/lib/library.js:254` | `const coveredByCoordinator = …` | **identifiant** exporté |
| `cli/src/lib/library.js:257-258` | warning « role(s) sans persona dedie, **pris en charge par** le coordinateur » | **message** utilisateur |
| `cli/src/lib/library.js:296` | `coveredByCoordinator` dans le retour (surface **C-JSON**) | **contrat de sortie** — cf. § 7.7 |
| `cli/test/library.test.js:114,125,132,184` | assertions sur `coveredByCoordinator` *(réf. corrigée au gate : ce n'est pas `:154-160`)* | tests |
| `cli/test/library.test.js:109,165` + **nom de test `:167`** (« aragorn **absorbe** deploiement ») | le mot **« absorbe »** en dur — vocabulaire le plus visible, **omis de la version initiale** | tests |
| Mémoire `iakaframe-role-fallback-coordinateur` | « **pris par** le coordinateur » | principe de repli |
| `docs/commandes.md`, doc d'`assemble` | formulation de la couverture | doc |

> ⚠️ **`coveredByCoordinator` est une clé de sortie `--json` : la renommer est une rupture de
> contrat d'API**, à traiter avec la convention C-JSON (transition ou rupture assumée, comme les
> 3 ruptures déjà actées au lot « surface CLI »). **À chiffrer en phase 2** — ce n'est pas un
> simple rechercher/remplacer.

**Rien n'est modifié ici.** Inventaire seul, conformément au périmètre.

### 7.7 Conséquence 3 — esquisse du critère qui manquait à Legolas

**Le besoin** : *« un critère qui rende ROUGE la dégradation d'`assemble` »*. Il était informulable
tant que la couverture s'exprimait en `orphans == []`.

> ⚠️ **Section CORRIGÉE au gate — je mésestimais le correctif, et dans le sens coûteux.**
> J'affirmais qu'il fallait un nouveau contrat JSON et évoquais une rupture C-JSON. **C'est faux, et
> ça alourdissait la phase 2 pour rien.**

**Ce qui existe déjà** : `coveredByCoordinator` est **exporté** (`library.js:296`) **et déjà
asserté avec l'ensemble exact attendu** — `cli/test/library.test.js:114` → `['dev']`, `:184` →
`['deploiement']`. La surface **et** le mécanisme d'assertion sont **en place**.

**Le trou réel, et il est étroit** : le test « vraie bibliothèque » (`library.test.js:154-160`) **ne
porte aucune assertion** `coveredByCoordinator == []`. C'est **exactement là** que la bascule
silencieuse des 5 rôles est passée.

> **Correctif réel : UNE LIGNE** — ajouter cette assertion au test « vraie bibliothèque ».
> **Aucun nouveau contrat JSON, aucune rupture C-JSON, aucun renommage nécessaire.**
> *(Ma revendication d'une rupture de contrat reste vraie pour un **renommage** de la clé — § 7.6 —
> mais **le renommage n'est pas nécessaire à la détection**. Les deux sujets sont indépendants :
> la détection coûte une ligne, le renommage est un confort de vocabulaire.)*

**Forme cible (déjà disponible, à asserter) :**

```
coveredByCoordinator: []        // team complète → assertion à AJOUTER (test "vraie bibliotheque")
coveredByCoordinator: ['dev']   // déjà asserté :114
```

**Enrichissement facultatif** (confort, **non requis** pour la détection) :

```
roles: { total: 8, filled: N, ported: M, portedRoles: [<ids>] }
invariant : filled + ported == total
```

**Ce qui rend rouge**, et c'est le point clé : **ce n'est pas `ok:false`**, c'est un **test qui
assert l'ensemble attendu** —

| Situation | Attendu | Effet |
|---|---|---|
| Team complète nominale | `ported: 0`, `portedRoles: []` | vert |
| Une régression fait basculer un rôle pourvu en porté | `portedRoles` contient un id **inattendu** | **ROUGE** |
| Team volontairement incomplète | `portedRoles` == l'ensemble **déclaré attendu** | vert |

> ✅ **Compatibilité avec l'arbitrage — vérifiée.** `ok` **reste `true`** quand `ported > 0` :
> `assemble` **ne bloque pas**, la continuité est intégralement préservée. La rougeur vient du
> **test**, pas du verbe. C'est exactement la condition du § 3bis.3 : **signal, jamais gate.**

**Bénéfice** : la dégradation silencieuse démontrée au 3ᵉ gate (5 rôles bascules, 4 suites vertes)
devient **détectable**, sans qu'aucune configuration d'équipe ne devienne impossible.

## 8. Synthèse en une phrase

**La composabilité est une propriété du modèle pour tout ce qui décrit un *savoir-faire* ou un
*enchaînement* — `skills`, `workflows`, `principles`, `rituals`, `scaffolds` — et doit rester
interdite pour tout ce qui décrit un *périmètre* — `personas`, `roles` — parce que composer un
périmètre, c'est le dissoudre.**
