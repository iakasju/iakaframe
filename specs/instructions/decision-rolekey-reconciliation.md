# Décision — réconciliation `roleKey` (CH-A)

> ⚠️ **DÉCISION RENDUE le 2026-07-19 — direction retenue : § 2 (aligner le canon sur CLI+GUI).**
> Ce document n'est **plus** une question ouverte. Il est conservé comme **trace du raisonnement**
> ayant précédé l'arbitrage. **Aller directement au § 9** (note additive) pour la décision, sa
> réserve assumée, et la résolution du cas Helm. Les §§ 1-8 sont l'analyse d'origine, **inchangée**.
>
> *Note de méthode : la décision a été rendue pendant la rédaction de ce comparatif. Le chiffrage de
> la direction écartée (§ 3) n'a donc plus d'usage décisionnel ; il est laissé en l'état, sans y
> consacrer de travail supplémentaire.*

> **Aide à la décision** (Gandalf, P1, 2026-07-19), produite à la demande du coordinateur pour être
> lue **avec le décideur**. Ce n'est pas un exposé : c'est de quoi trancher. L'analyse complète du
> défaut est en `audit-amelioration-roster-personas.md` § 3. **Lecture seule** sur le code.

## 0. À lire avant de choisir — la contrainte d'ordre

`roleKey` **n'est projeté dans aucun contrat** : `renderAgentContract`
(`cli/src/lib/generate-agents.js:54-65`) ne rend que `name`, `description`, `tools`, `guardrails`.
Le champ est donc **absent des 8 goldens** et **absent des contrats déployés**.

> **Conséquence directe : les suites CLI et GUI resteront VERTES même si l'incohérence persiste, et
> resteront VERTES pendant et après un renommage partiel ou raté.** Aucun filet n'existe aujourd'hui.

C'est ce qui rend ce défaut différent de tous les autres traités jusqu'ici : il n'a **aucun symptôme
observable**. D'où l'exigence, quelle que soit la direction retenue :

> **La garde de parité `roleKey` ↔ table de rôles doit être écrite ET rouge AVANT le renommage.**
> On écrit d'abord le test qui constate la divergence actuelle, on le voit échouer, puis on renomme
> jusqu'à ce qu'il passe. Renommer d'abord et « vérifier ensuite » revient à naviguer sans instrument.

Cette contrainte est **identique dans les deux directions** et ne doit pas peser dans le choix — mais
elle doit être visible **au moment** du choix, car elle conditionne l'exécution.

## 1. Rappel du défaut en une table

| Persona | `roleKey` canon | `ROLE_OF` CLI | Cœur GUI | Accord |
|---|---|---|---|---|
| odin | `portefeuille` | `portefeuille` | `portefeuille` | ✅ |
| aragorn | `coordination` | `coordination` | `coordination` | ✅ |
| gandalf | `cadrage` | `architecture` | `architecture` | ❌ |
| gimli | `dev` | `fabrication` | `fabrication` | ❌ |
| legolas | `qualite` | `tests` | `tests` | ❌ |
| loki | `design` | `graphisme` | `graphisme` | ❌ |
| nathalie | `documentation` | `doc` | `doc` | ❌ |
| **helm** | **`deploiement`** | **`coordination`** *(= rôle d'Aragorn)* | **absent** | ❌❌ |

Sources : `library/personas/*.md:5` · `cli/src/lib/agents.js:17-26` ·
`~/work/iakaFrameGUI/packages/core/src/roles.ts:26-34` et `roster.ts:16-35`.

**Le canon est le seul en désaccord** : CLI et GUI partagent déjà le même vocabulaire.

## 2. Direction 1 — aligner le CANON sur CLI+GUI

*« Le canon adopte `architecture`, `fabrication`, `tests`, `graphisme`, `doc`. »*

**Ce qui bouge**, concrètement :

| Fichier | Changement |
|---|---|
| `library/personas/gandalf.md:5` | `cadrage` → `architecture` |
| `library/personas/gimli.md:5` | `dev` → `fabrication` |
| `library/personas/legolas.md:5` | `qualite` → `tests` |
| `library/personas/loki.md:5` | `design` → `graphisme` |
| `library/personas/nathalie.md:5` | `documentation` → `doc` |
| `library/personas/helm.md:5` | **`deploiement` → ??? — non résolu, cf. § 4** |
| Fixtures GUI (8 personas vendorées) | re-vendorage |
| `cli/src/lib/agents.js`, cœur GUI | **inchangés** |

**Charge : ~0,5 j-h** (5 lignes + garde de parité + re-vendorage + doc), **hors Helm**.

**Ce qui ne casse pas** : `roleKey` n'entrant pas dans le contrat, **les 8 goldens sont inchangés**
et leurs `sha256` aussi. Le test GUI (`parite-generateurs.test.ts:89-99`) ne lit que
`description`/`guardrails`/corps : **il reste vert**. Seules les **fixtures personas vendorées**
changent (contenu du fichier), ce que `vendor-check` (lot 1) détectera correctement.

**Risque : faible sur le plan technique. Élevé sur le plan sémantique.** Le canon adopterait un
vocabulaire qui **décrit mal les rôles réels** :

- `architecture` pour Gandalf, dont la phase méthode s'appelle **P1 — Cadrage** et dont la skill
  s'appelle `iakaframe-cadrage` : le canon dirait `architecture` pendant que la méthode, la skill et
  la charte disent *cadrage*. On créerait un **troisième** vocabulaire à la place d'en supprimer un.
- `tests` pour Legolas, dont le rôle est plus large (lint, typage, couverture, verdict, RQV).
- Rappel : par la mémoire `iakaframe-doc-roles-pas-noms`, **la doc publique désigne les intervenants
  par leur rôle** — ces mots sont donc **destinés à l'utilisateur**, pas internes.

**Et surtout : cette direction ne résout pas Helm** (§ 4), c'est-à-dire **le pire des huit cas**.

## 3. Direction 2 — aligner CLI+GUI sur le CANON

*« Le CLI et le cœur GUI adoptent `cadrage`, `dev`, `qualite`, `design`, `documentation`,
`deploiement`. »*

**Ce qui bouge :**

| Fichier | Changement |
|---|---|
| `cli/src/lib/agents.js:17-26` | valeurs de `ROLE_OF` (6 lignes) |
| `cli/src/lib/agents.js:29-37` | **clés** de `SKILL_OF` (5 clés) |
| `cli/src/lib/agents.js:42-44` | `SKILL_OVERRIDE_OF` → **supprimable** (§ 4) |
| `~/work/iakaFrameGUI/packages/core/src/roles.ts:26-34` | `CANONICAL_ROLES` : 5 clés + 1 rôle ajouté |
| `~/work/iakaFrameGUI/packages/core/src/roster.ts:16-35` | clés de `DEFAULT_NAMES` / `DEFAULT_SKILLS` |
| Consommateurs GUI | **~41 fichiers** portent l'un de ces libellés (mesuré) |
| `library/personas/*.md` | **inchangés** — le canon est déjà correct |

**Charge : ~2 à 2,5 j-h**, dont l'essentiel côté GUI et **réparti sur deux dépôts**.

**Risque : moyen-haut, et pour une raison précise qu'il faut nommer.**

> **Aucun filet de compilation.** `roles.ts:18` déclare `key: string` — **pas** un type union
> littéral. `roster.ts:16` et `:27` utilisent `Record<string, string>`. Les clés de rôle sont donc
> des **chaînes libres** : un renommage incomplet **compile parfaitement** et ne sera pas signalé par
> `tsc`. La détection reposera entièrement sur les **tests** — les 41 fichiers concernés ne sont pas
> tous couverts, et les termes `tests` et `doc` sont **quasi impossibles à greper proprement**
> (faux positifs massifs). *(Le comptage de 144 occurrences inclut `portefeuille`/`coordination`,
> qui ne changent pas : le volume net réel est à établir en ouverture de lot — c'est une inconnue
> assumée, pas un chiffre ferme.)*

**Effet de bord à provisionner : `roleIndex`.** `roles.ts:21-22` définit `roleIndex` (0..6) comme
« position dans la liste = **clé de vignette** ». Promouvoir `deploiement` en 8ᵉ rôle crée un
`roleIndex: 7` → **une 8ᵉ vignette à produire** (dépendance design/Loki, `src/forge/casting.ts`).
À traiter, ou à acter comme différé.

**Argument de fond en sa faveur** : `roles.ts:7-9` énonce que la liste est *« fermée pour iakaframe
mais paramétrable par méthode (agnosticisme AR-9) »*. La liste canonique **est donc celle
d'iakaframe** — il est cohérent qu'elle porte le vocabulaire d'iakaframe.

**Contre-argument honnête, qui relève du produit :** `architecture`/`fabrication`/`tests` sont des
termes **génériques**, plus portables vers d'autres méthodes (north-star « import multi-méthodes
BMAD/MetaGPT/SPARC », `iakaFrameGUI/CLAUDE.md`). `cadrage`/`dev`/`qualite` sont **iakaframe-spécifiques**.
Si l'intention est que le cœur GUI porte un vocabulaire **neutre** commun à toutes les méthodes, la
Direction 1 devient défendable. **C'est le seul vrai point de désaccord possible, et il est produit,
pas technique.**

## 4. Le cas Helm — traité à part, et c'est lui qui discrimine

**État actuel.** `ROLE_OF.helm = 'coordination'` (`cli/src/lib/agents.js:23`) — **le rôle d'Aragorn**.
Le commentaire assume le rattachement. La conséquence (Helm hériterait de `iakaframe-aragorn`) est
rattrapée par une **exception codée en dur** : `SKILL_OVERRIDE_OF = { helm: 'iakaframe-deploiement' }`
(`:42-44`). Le canon, lui, dit `deploiement` (`helm.md:5`). Et le cœur GUI **ne connaît pas Helm du
tout** (`roster.ts:16-35` : 7 rôles, pas de déploiement).

**Quel rôle doit-il porter ?** `deploiement`, sans hésitation. C'est ce que dit le canon, ce que dit
sa charte (`helm.md:13-18`, squad prod séparé), et l'audit a noté la dimension MoE ✅ précisément
parce que sa frontière avec Aragorn est nette. Le faire partager le rôle `coordination` **dans le
canon** dégraderait la seule dimension que le roster réussit parfaitement.

**L'exception disparaît-elle dans les deux directions ?** **Non — et c'est le discriminant.**

| Direction | Rôle de Helm | `SKILL_OVERRIDE_OF` | Helm au roster GUI |
|---|---|---|---|
| **1 pure** | resterait `coordination` | **subsiste** | toujours absent |
| **2** | `deploiement` (8ᵉ rôle) | **supprimée** | représentable |
| **Hybride** (§ 5) | `deploiement` (8ᵉ rôle) | **supprimée** | représentable |

> **La Direction 1 pure ne peut pas résoudre Helm.** Soit elle laisse le canon dire `coordination`
> (deux personas, un rôle — régression sémantique), soit elle doit **quand même** promouvoir
> `deploiement` en rôle de plein droit côté CLI+GUI — et devient alors l'hybride du § 5.
> Autrement dit : **on ne peut pas régler CH-A à 0,5 j-h.** Le cas Helm impose de toucher CLI+GUI
> dans toutes les issues acceptables.

## 5. Direction hybride (à considérer si le coût est le critère)

Renommer les **5** personas vers le vocabulaire CLI/GUI (Direction 1) **et** promouvoir `deploiement`
en 8ᵉ rôle canonique pour Helm (fragment de Direction 2).

- **Charge : ~1 à 1,25 j-h.** Résout Helm, supprime `SKILL_OVERRIDE_OF`, ouvre CH-E.
- **Défaut** : produit un vocabulaire **mixte** — 5 termes génériques (`architecture`, `fabrication`,
  `tests`, `graphisme`, `doc`) + 1 terme métier iakaframe (`deploiement`) — soit exactement
  l'incohérence de registre qu'on cherche à supprimer, en plus petit.

## 6. Comparatif de synthèse

| Critère | Direction 1 (pure) | **Direction 2** | Hybride |
|---|---|---|---|
| Charge | ~0,5 j-h | **~2 à 2,5 j-h** | ~1 à 1,25 j-h |
| Dépôts touchés | 1 | **2** | 2 |
| Résout les 6 divergences | oui | **oui** | oui |
| **Résout Helm** | **non** | **oui** | oui |
| Supprime `SKILL_OVERRIDE_OF` | non | **oui** | oui |
| Débloque CH-E (Helm au roster GUI) | non | **oui** | oui |
| Vocabulaire cohérent avec la méthode | non | **oui** | mixte |
| Filet de compilation | s/o | **aucun** (risque) | partiel |
| 8ᵉ vignette à produire | non | **oui** | oui |
| Risque technique | faible | **moyen-haut** | moyen |

## 7. Recommandation — **Direction 2**

**Je recommande d'aligner CLI + cœur GUI sur le canon.** Trois motifs, par ordre de poids :

1. **Le canon doit gagner, sinon « source de vérité » est une fiction.** Toute l'architecture repose
   sur `library/personas/` comme couche 1 (principe I3 : personas pures, facettes d'exécution dans le
   binding). Faire plier le canon devant deux consommateurs installerait le précédent inverse — et
   c'est précisément le schéma de cause racine déjà corrigé une fois pour les contrats
   (`cli/src/lib/generate-agents.js:3-5` : les contrats étaient entretenus à la main, donc dérive
   garantie). On ne corrige pas une dérive en promouvant le dérivé.
2. **Seule cette direction (ou l'hybride) règle Helm**, qui est le cas le plus grave, et elle est la
   seule à supprimer l'exception codée `SKILL_OVERRIDE_OF` — une exception codée est une dette qui
   re-dérivera.
3. **Ces mots sont vus par l'utilisateur.** La doc publique désigne les intervenants par leur rôle
   (mémoire `iakaframe-doc-roles-pas-noms`) : autant qu'ils disent *cadrage* comme la méthode, la
   phase P1 et la skill `iakaframe-cadrage`, plutôt qu'*architecture*, mot que **rien d'autre**
   n'emploie dans iakaframe.

**Ce qui pourrait me faire changer d'avis, et que seul le décideur peut trancher** : si la priorité
produit est le **north-star multi-méthodes**, alors un cœur GUI à vocabulaire **neutre** vaut mieux
qu'un cœur à vocabulaire iakaframe, et la **Direction 1 + promotion de `deploiement`** (= hybride)
devient le bon choix. C'est un arbitrage de **direction produit**, pas de qualité de code — je le
signale sans le trancher.

**Repli assumé si le coût est jugé prohibitif** : l'hybride (§ 5), qui capture l'essentiel du bénéfice
(Helm résolu, exception supprimée) pour la moitié du coût, au prix d'un vocabulaire mixte.

**Ce que je déconseille formellement** : la **Direction 1 pure**. C'est la seule option qui laisse le
défaut le plus grave — Helm partageant le rôle d'Aragorn — **non résolu**, tout en donnant le
sentiment que CH-A est traité.

## 8. Contraintes d'exécution communes aux trois options

1. **Garde d'abord** (§ 0) : test de parité `roleKey` ↔ table, **rouge avant**, vert après.
2. **Critère de « fini »** : tout changement de persona impose goldens → déployé → **re-vendorage
   GUI** → **les deux suites**. Ici, `roleKey` n'étant pas projeté, **les goldens ne bougeront pas** :
   ne pas en conclure que rien n'est cassé (c'est le piège du § 0).
3. **Inventaire préalable des consommateurs non audités** : `kits/*`, `teams/iakaframe-8.md`, et les
   marqueurs `.claude/iakaframe-kit.json` **déjà écrits sur disque** dans les projets — un renommage
   de rôle peut les rendre incohérents sans aucun test rouge.
4. **Ordonnancement** : à exécuter **après** le lot 1 (`vendor-check`), qui rendra le re-vendorage des
   fixtures personas mécaniquement vérifiable.

---

## 9. Note additive — arbitrage du décideur (2026-07-19)

> Ajout **postérieur** à l'analyse §§ 1-8, qui reste inchangée.

### 9.1 Direction retenue : **§ 2 — aligner le canon sur CLI+GUI**

Le canon adopte le vocabulaire déjà partagé par le CLI et le cœur GUI :
`cadrage`→`architecture`, `dev`→`fabrication`, `qualite`→`tests`, `design`→`graphisme`,
`documentation`→`doc`. **La recommandation Gandalf (§ 7, Direction 2) n'a pas été suivie.**

**Motif de la décision :**

1. **Le canon est le seul des trois en désaccord** (§ 1) — CLI et GUI concordent déjà. La lecture la
   plus probable est donc que **c'est le canon qui a dérivé**, et non ses deux consommateurs qui
   auraient dérivé de concert.
2. **Coût moitié moindre**, sur un dépôt au lieu de deux, sans toucher un cœur GUI dépourvu de filet
   de compilation (§ 3).

### 9.2 Réserve assumée — à ne pas relire comme une négligence

> **Cette direction plie la source de vérité à son implémentation.** C'est **l'inverse du sens
> habituel de la méthode**, où la couche canon (`library/personas/`) fait autorité sur ses
> consommateurs (principe I3). Le § 7 le formulait ainsi : *« on ne corrige pas une dérive en
> promouvant le dérivé »*.
>
> **Elle est retenue en connaissance de cause**, sur le motif factuel du § 9.1 : ici, l'indice
> converge vers un canon dérivé plutôt que vers des consommateurs dérivés — ce qui **renverse
> légitimement la présomption d'autorité** dans ce cas précis. Ce n'est pas une règle générale et
> **ne crée pas de précédent** : hors preuve que le canon a dérivé, le canon reste l'autorité.
>
> **Coût sémantique accepté** : le canon dira `architecture` là où la méthode, la phase P1 et la
> skill `iakaframe-cadrage` disent *cadrage* ; ces libellés sont vus par l'utilisateur en doc
> publique (mémoire `iakaframe-doc-roles-pas-noms`). **Point rouvrable** si le vocabulaire de rôle
> devient un sujet produit.

### 9.3 Contrainte d'ordre — devient un **critère de « fini »**

> `roleKey` n'étant projeté dans **aucun golden** (§ 0), **les suites resteront vertes même si
> l'incohérence persiste** — et resteront vertes après un renommage **partiel ou raté**.
>
> **La garde de parité `roleKey` ↔ `ROLE_OF` s'écrit AVANT le renommage** : on écrit d'abord le test,
> **on le voit ROUGE sur l'état actuel** (6/8 divergents), puis on renomme jusqu'au vert. Un lot qui
> livrerait le renommage sans avoir vu la garde échouer d'abord **n'est pas fini**, quelle que soit
> la couleur des suites.

### 9.4 Cas Helm — recommandation Gandalf (sous-question restée ouverte)

**Rôle recommandé : `deploiement`, promu rôle canonique de plein droit dans le CLI et le cœur GUI.**
Le canon **ne change pas** pour Helm.

**Pourquoi ce n'est pas contredire l'arbitrage du § 9.1.** La distinction est nette et c'est elle qui
fonde la recommandation :

- Les **6 autres cas sont une dérive LEXICALE** : même concept, deux étiquettes (`cadrage` et
  `architecture` désignent le rôle de Gandalf). Aligner le canon = **changer un mot**. L'arbitrage
  s'applique pleinement.
- **Helm est une lacune de MODÉLISATION**, pas un synonyme : `deploiement` et `coordination` sont
  **deux concepts différents**. Le CLI et le cœur GUI **n'ont aucun rôle de déploiement** —
  `roster.ts:26-34` ne connaît que 7 rôles et **Helm y est absent**. Le rattachement à `coordination`
  n'est pas un choix de vocabulaire : c'est un **rangement par défaut faute de case disponible**,
  d'ailleurs immédiatement rattrapé par une exception codée (`cli/src/lib/agents.js:42-44`).

> Appliquer mécaniquement la direction à Helm ne serait donc **pas** « aligner un mot » : ce serait
> **supprimer un rôle** et faire dire au canon que Helm partage le rôle d'Aragorn. Cela dégraderait
> la **seule dimension que le roster réussit parfaitement** (MoE, ✅ 7/7 —
> `audit-amelioration-roster-personas.md` § 4) et contredirait sa charte de squad prod séparé
> (`library/personas/helm.md:13-18`). **L'arbitrage tranche une question de vocabulaire ; il ne peut
> pas trancher, par effet de bord, la suppression d'un rôle.**

**L'exception codée disparaît-elle ?** **Oui.** Dès que `deploiement` existe comme rôle,
`SKILL_OF.deploiement = 'iakaframe-deploiement'` résout Helm nativement et
`SKILL_OVERRIDE_OF` (`cli/src/lib/agents.js:42-44`) **devient inutile et doit être supprimé**
(critère C3 de l'instruction roster). Elle **survivrait** dans la seule variante où Helm resterait
`coordination`.

**Effet sur le roster GUI — oui, les deux se croisent : CH-E est absorbé, pas séparé.** Promouvoir
`deploiement` = l'ajouter à `CANONICAL_ROLES` (`roles.ts:26-34`) et à `DEFAULT_NAMES`/`DEFAULT_SKILLS`
(`roster.ts:16-35`) — c'est **exactement** le contenu de CH-E. **CH-E n'est donc plus un arbitrage
non bloquant distinct : il est résolu par la résolution de Helm.** Deux conséquences :

1. Le lot **touche le cœur GUI**, contrairement à ce que laissait espérer la direction retenue —
   dans une **mesure très réduite** (ajout d'une entrée, sans renommage des clés existantes, donc
   **sans le risque « aucun filet de compilation »** du § 3, qui portait sur le renommage de masse).
2. **`roleIndex: 7` → une 8ᵉ vignette est nécessaire** (`roles.ts:21-22`, l'index est la clé de
   vignette ; cf. `src/forge/casting.ts`). C'est une **dépendance design (Loki)**, pas du dev. À
   produire, ou à acter comme différé avec un repli visuel — **point à trancher par le décideur.**

**Si le décideur refuse la promotion de `deploiement`**, alors la seule issue cohérente est de
**laisser Helm en l'état** (canon `deploiement`, exception codée conservée) et de **documenter CH-A
comme partiellement résolu** — 5 cas sur 6. Ce serait un moindre mal ; ce qu'il ne faut pas faire,
c'est écrire `coordination` dans `helm.md:5`.

### 9.5 Clôture — Helm arbitré (2026-07-19)

**La recommandation du § 9.4 est retenue par le décideur.** `deploiement` est promu **rôle canonique
de plein droit** (`roleIndex: 7`) dans le CLI et le cœur GUI ; `library/personas/helm.md:5` reste
inchangé ; `SKILL_OVERRIDE_OF` est supprimée ; CH-E est absorbé dans le lot 3.

**La 8ᵉ vignette est DIFFÉRÉE**, avec repli spécifié et critères d'acceptation testables — voir
`audit-amelioration-roster-personas.md` § 13.6. Point saillant relevé à cette occasion : une vignette
est un **couple de couleurs**, pas un asset graphique (`casting.ts:2-4,8-16`) — la dette se lève pour
**~0,1 j-h**, l'essentiel étant la décision de charte (Loki).

> **CH-A est intégralement tranché.** Les 6 dérives lexicales alignent le canon sur CLI+GUI ; la
> lacune de modélisation (Helm) est comblée côté CLI+GUI. Ce document est **clos** — il ne reste
> aucune question ouverte en son sein.
