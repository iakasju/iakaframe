# Instruction — 9ᵉ rôle du référentiel : le **constructeur de frame** (persona **Fëanor**)

> Instruction de cadrage (Gandalf, P1, 2026-07-23), sur demande du décideur portée au
> `BACKLOG.md` § Ouverts / Chantiers (premier item). **Lecture seule** sur les deux dépôts pendant
> le cadrage ; ce fichier est le seul artefact produit.
>
> **Citations par nom de section / de symbole, jamais par `chemin:ligne`** (correctif générique
> acté en phase 1 ; tolérables T2/T3/T6). Tous les constats du § 0 et du § 5 ont été **mesurés sur
> le disque** le 2026-07-23, dans `~/work/iakaframe` et `~/work/iakaFrameGUI`
> (`preuve-avant-declaration`).
>
> ✅ **Arbitrages du décideur rendus le 2026-07-23 (fermes), intégrés ci-dessous** :
> 1. **Degré D3** — une **persona neuve** ; le roster passe de **8 à 9**. D0/D1/D2 écartés.
> 2. **Rôle** : clé `frame`, libellé « Constructeur de frame » (reco retenue ; `frame-builder`
>    abandonné).
> 3. **Persona** : **Fëanor** (le plus grand artisan des Elfes, forgeur des Silmarils).
> 4. **Finalité** *(déplace la frontière (d), cf. § 1 et § 2)* : Fëanor **assiste un utilisateur
>    tiers à forger un frame NEUF, from scratch**. Il **ne maintient pas** et **ne fait pas
>    évoluer** le frame iakaframe lui-même — cela reste à Gandalf (cadrage) et Gimli (dev). Son
>    objet n'est **pas** « le frame de ce dépôt », c'est **« un frame cible neuf appartenant à
>    l'utilisateur assisté »**.
> 5. **Activation explicite SEULEMENT** *(invariant gravé, cf. § 3 D-G et § 7 A23)* : Fëanor
>    n'est **jamais** spawné d'office ; il ne s'active **que sur demande explicite** de
>    l'utilisateur (CLI, terminal, ou iakaFrameGUI), **hors du dispatch automatique de l'équipe** —
>    posture « hors dispatch » d'Odin, portée par le **même mécanisme**, pour une **raison
>    différente** (§ 3 D-G).

---

## 0. État de référence — mesuré, pas présumé

### 0.1 Le référentiel de rôles

`library/roles/` porte **8 fiches** : `portefeuille`, `coordination`, `cadrage`, `dev`, `qualite`,
`deploiement`, `design`, `documentation`. Frontmatter : `id`, `key`, `label`, `roleIndex`, `scope`
+ un corps narratif court. Les `roleIndex` sont **1..8, sans trou ni doublon**, et leur ordre est
**exactement** celui de la ligne `roleKeys` de `methods/iakaframe.md`.

`library/personas/` porte **8 personas** (+ `_TEMPLATE.md`), castées **1↔1** sur ces 8 rôles.

### 0.2 Les porteurs du vocabulaire de rôles — l'inventaire a changé depuis le dernier cadrage

`vocabulaire-roles-agnostique.md` § 0 mesurait, sur `main` au 2026-07-20, que le cœur GUI portait
**7 rôles au vocabulaire CLI** (`architecture`, `fabrication`, `tests`, `graphisme`, `doc`, sans
`deploiement`). **Ce n'est plus vrai.**

| Porteur | Mesuré le 2026-07-23 | Accord avec `library/roles/` |
|---|---|---|
| `library/personas/*.md` (`roleKey`) | les 8 clés canon | ✅ |
| `methods/iakaframe.md` (`roleKeys`) | les 8 clés canon, même ordre | ✅ |
| `packages/core/src/roles.ts` (`CANONICAL_ROLES`) | **les 8 clés canon**, `roleIndex` **0..7**, commentaire « alignées sur le canon (VOLET B2) » | ✅ **sur les clés** — ❌ sur la **base** d'index (0 vs 1) |
| `packages/core/src/roster.ts` (`DEFAULT_NAMES`, `DEFAULT_SKILLS`) | les 8 clés canon → noms Tolkien / skills `iakaframe-*` | ✅ |
| `cli/src/lib/agents.js` (`ROLE_OF`, `SKILL_OF`) | **toujours** `architecture`, `fabrication`, `tests`, `graphisme`, `doc` ; `helm → coordination` ; `SKILL_OVERRIDE_OF` **présente** | ❌ **6/8 divergents** |

> **Conséquence directe, et elle est neuve** : le CLI est aujourd'hui le **seul et dernier**
> porteur en divergence lexicale. La table `ROLE_OF` mélangerait deux vocabulaires dès qu'on y
> inscrirait une 9ᵉ clé au vocabulaire canon. → dépendance déclarée au § 9.

### 0.3 Ce qui n'a pas bougé — la liste du cœur GUI est restée **fermée**

`roles.ts` s'annonce toujours « **LISTE CANONIQUE FERMÉE** ». Le lot d'agnosticisme cadré par
`vocabulaire-roles-agnostique.md` (`parseRole`, `SEED_ROLES`, référentiel résolu, palette totale)
**n'a pas été exécuté** : `CANONICAL_ROLES` reste consultée comme **autorité** par
`PersonaEditor`, `WorkflowAtelier`, `MethodeAtelier`, `prompt.ts`, `method.ts`, `roster.ts`.

C'est le fait le plus structurant de ce cadrage : **le compte de 8 est encore gravé dans le cœur**,
et un 9ᵉ rôle vient buter dessus.

### 0.4 Le champ `scope` n'est lu par personne

Vérifié sur les deux dépôts : côté CLI, la collection `roles` de `library.js` n'expose que `id` et
`label` ; côté GUI, `poolAtomId` n'extrait que `key ?? id` (et **jette** `label` et `roleIndex`,
défaut déjà relevé au § 2.1 de `vocabulaire-roles-agnostique.md`). **Aucun code, aucun test, aucun
rendu ne lit `scope`.**

> **Effet sur la question (a) du backlog** : elle est **sémantique, pas mécanique**. Choisir
> `team`, `portfolio` ou une troisième valeur ne change **rien** au comportement du système
> aujourd'hui. Elle doit donc être tranchée pour la **lisibilité de la méthode**, sans consommer de
> budget de décision — et elle est **révisable à coût nul**.

### 0.5 Les gardes qui rougiront

Trois assertions existantes, nommées, tomberont dès qu'un compte bouge :

| Garde | Ce qu'elle assère | Rougit si |
|---|---|---|
| `cli/test/library.test.js` — test *« vraie bibliothèque : list personas = 8, assemble iakaframe/iakaframe-8 = 8/8 »* | `scan('personas', REPO).length === 8` **et** `r.methodRoleKeys.length === 8` | **une persona** ou **un `roleKey` de méthode** est ajouté |
| `cli/test/library.test.js` — test *« team 7 personas (helm retiré) »* | `coveredByCoordinator` vaut exactement `['deploiement']` | un rôle de méthode **non casté** s'ajoute (deviendrait `['deploiement', '<clé>']`) |
| `iakaframe vendor-check` | `18 copies + 4 dérivées`, drift **0** | `methods/iakaframe.md` change (2 dérivées) ; une persona s'ajoute (`IDS`, `EXPECTED_COPIES`) |

C'est une **bonne** nouvelle : le lot n'est pas silencieux. Contrairement à CH-A, il a des
instruments qui mordent. Ils doivent être **vus rouges avant** d'être remis au vert (§ 7, A0).

---

## 1. Le problème, posé avant la solution *(reformulé selon l'arbitrage 4)*

> ⚠️ **Le backlog et ma première rédaction posaient le problème comme « personne ne possède le
> modèle du frame iakaframe ».** L'arbitrage 4 le corrige : posséder et faire évoluer le frame
> iakaframe **reste** à Gandalf (cadrage) et Gimli (dev). Le problème réel est ailleurs, et il est
> plus net.

**iakaframe sait produire des projets ; il ne sait pas ACCOMPAGNER la naissance d'un frame neuf.**
La chaîne 3 phases + squad prod couvre le cycle d'un **projet** (cadrer → coder → tester →
déployer). L'outillage de forge existe — `iakaframe assemble`/`add` côté CLI, la GUI `iakaFrameGUI`
côté auteur — mais **aucun rôle n'incarne l'accompagnement d'un utilisateur tiers qui veut forger
son propre frame from scratch** : choisir une méthode, composer une team, apparier des bindings,
assembler des kits, et obtenir un frame **cohérent avec le modèle**. Ce travail est aujourd'hui
sans propriétaire nommé — c'est le seul geste du produit qui n'a pas de rôle à son nom, alors que
**c'est la promesse même d'une forge de frames**.

**Pourquoi ce geste exige un expert dédié, et non un membre de plus de l'équipe de livraison.**
Forger un frame conforme au modèle est **difficile et silencieusement piégeux** — et nous en avons
la preuve sur notre propre frame. Trois symptômes, tous documentés dans `specs/instructions/`, tous
de la même classe :

1. **Un porteur de vocabulaire jamais inventorié.** `decision-rolekey-reconciliation.md` § 10.1
   constate qu'un arbitrage a été rendu sur un inventaire à **trois** porteurs quand il y en avait
   **quatre**, puis `vocabulaire-roles-agnostique.md` § 2 en compte **huit**. Le motif factuel n° 1
   de la décision s'est révélé **faux**.
2. **Une rupture d'intégrité produite *pendant* le lot qui devait la corriger**, sous **370 tests
   verts** (`vocabulaire-roles-agnostique.md` § 0.2) : 5 références mortes, invisibles.
3. **Une garde inventée après coup** — `vendor-check` — pour rattraper une classe de dérive
   (canon ↔ copies vendorées) que **personne ne possédait**.

> **Le raisonnement se retourne, et c'est ce qui fonde le rôle.** Si *nous* — auteurs du frame,
> outillés, aguerris au modèle — avons produit ces défauts sur *notre propre* frame, alors un
> **utilisateur tiers** qui forge un frame neuf **sans assistance** en produira bien davantage, et
> sans les instruments qui nous ont permis de les rattraper. Le besoin n'est donc pas « un
> propriétaire du modèle iakaframe » (Gandalf/Gimli le sont) : c'est **un compagnon expert du
> MODÈLE de frame, qui guide un tiers à en forger un neuf et vérifie qu'il est cohérent**.

**L'item de backlog qui a produit cette instruction illustre la difficulté du geste** : recenser
les conséquences (e) a demandé de lire deux dépôts, et le recensement — pourtant écrit avec soin —
omettait `cli/src/lib/vendor.js` (`IDS`, `EXPECTED_COPIES`), `cli/test/library.test.js` (les deux
assertions de compte), `packages/core/src/method.ts` (le rapport de résolution) et le **double
miroir** `frames/releases/StefFrame2/roles/` + `.../library/roles/`. C'est très exactement le genre
de clôture qu'un tiers, seul, ne saurait pas tenir — et que Fëanor a pour charge de porter **pour
le frame qu'il aide à construire**.

---

## 2. Ce que le rôle EST — définition *(reformulée selon les arbitrages 4, 6, 7)*

> **Fëanor est un COMPAGNON DE FORGE : un érudit du modèle de frame et des méthodes d'agents, qui
> assiste un utilisateur tiers à concevoir ET à matérialiser un frame NEUF, from scratch.**

Il tient quatre choses, et rien d'autre :

1. **Une érudition des méthodes de personas/agents d'IA** *(exigence de fond du décideur)* —
   Fëanor **connaît deux corpus** et sait orienter le tiers vers le bon modèle selon ce qu'il veut
   forger :
   - **le corpus interne** = **la méthode du décideur, iakaframe elle-même** (`methode-de-travail.md`,
     `library/`, `methods/`, le modèle méthode/team/binding) ;
   - **le corpus mondial** = l'**état de l'art public** des frameworks multi-agents à rôles et de
     leurs modèles respectifs de « rôle / agent / persona / expansion pack » — liste au § 2.4.
2. **Les invariants du modèle de frame** — I1 (assemblages = ids seulement, aucun corps recopié),
   I3 (personas pures ; `runner`/`model`/`tools` uniquement dans `bindings/`), E2 (la méthode ne
   nomme aucune persona), le rangement pluriel de la bibliothèque, « le canon est l'autorité, ses
   copies sont dérivées ». Il les applique **au frame cible qu'il aide à construire**.
3. **La conception ET la génération du frame cible** *(arbitrage 7 : conseil + fichiers)* — Fëanor
   ne se limite pas au conseil : il va jusqu'à **scaffolder** `library/`, `bindings/`, `methods/`,
   `teams/`, `kits/`… **du frame neuf du tiers**, en réutilisant l'outillage de forge existant
   (`iakaframe assemble`/`add`/`onboard`) et sa connaissance du modèle.
4. **Un verdict de conformité de modèle SUR LE FRAME CIBLE** — PASS/FAIL sur *« ce frame neuf est-il
   cohérent avec le modèle (invariants tenus, clôture complète, casting couvrant les rôles) ? »*,
   assorti d'une **matrice de clôture** transposable au frame du tiers.

**Deux sources de savoir, gravées comme un couple** *(arbitrage 6 : LES DEUX)* — le **corpus écrit
et versionné** (§ 2.4) donne le **socle stable, daté, relu, citable** ; la **capacité web live**
(WebSearch/WebFetch à son binding, § 5.1) **comble l'actualité** au moment où Fëanor assiste. Le
corpus sans le web périme ; le web sans corpus dérive. Les deux, jamais l'un seul.

**Une obligation de fond, qui empêche le rôle de devenir une checklist** : chaque verdict de
conformité rendu **analytiquement** doit produire une **garde candidate** (un test, une commande,
une assertion) portée dans le frame cible. `vendor-check` est le prototype de ce geste — produit,
sur *notre* frame, sans propriétaire ; Fëanor le porte **pour le frame qu'il aide à construire**.

### 2.1 La frontière étanche — (d) : elle tient par la CIBLE, jamais par le type de fichier

> **Arbitrage 7, gravé net.** Fëanor **génère des fichiers** — `library/roles/*.md`, `bindings/`,
> `methods/`… — exactement comme Gimli. La frontière **ne peut donc pas** être « qui écrit quel
> type de fichier ». Elle est, et elle seule : **QUEL FRAME**.

| Rôle | Objet (le frame) | Ce qu'il produit sur cet objet |
|---|---|---|
| `cadrage` (Gandalf) | **le frame iakaframe (CE dépôt)** + les projets | `specs/instructions/<feature>.md` — cadre le besoin |
| `dev` (Gimli) | **le frame iakaframe (CE dépôt)** + les projets | les fichiers : code, atomes de `library/`, tests |
| `qualite` (Legolas) | **le frame iakaframe (CE dépôt)** + les projets | verdict PASS/FAIL exécutable |
| **`frame` (Fëanor)** | **un frame NEUF, ailleurs, appartenant au tiers assisté** | conseil de modèle **+** génération des fichiers de CE frame cible **+** verdict de conformité |

**Trois tests de non-recouvrement, refondés sur la CIBLE :**

- **N1 — Fëanor n'agit jamais sur le frame iakaframe (CE dépôt) ni sur un projet iakaframe.** Il ne
  cadre pas, ne code pas, ne teste pas iakaframe : cela reste Gandalf/Gimli/Legolas. Son terrain est
  **le frame du tiers**. *Vérifiable : la cible de tout geste d'écriture de Fëanor est un dépôt de
  frame tiers, jamais `~/work/iakaframe` ni un `<projet>/` iakaframe.*
- **N2 — Gimli n'agit jamais sur le frame d'un tiers.** Gimli construit et maintient **iakaframe** ;
  il ne scaffolde pas le frame neuf d'un utilisateur. *Vérifiable : la cible de tout geste de Gimli
  est le dépôt iakaframe ou un projet iakaframe, jamais un frame tiers.*
- **N3 — le recouvrement APPARENT (tous deux écrivent des `library/roles/*.md`) est levé par la
  seule question « dans QUEL dépôt ? ».** Même geste, même type de fichier, **cibles disjointes**.
  C'est la ligne étanche, et c'est la seule qui tienne une fois l'arbitrage 7 posé.

> **Test de non-recouvrement Gimli ↔ Fëanor, fondé sur la cible (à graver comme critère, cf. A27) :**
> aucun frame ne peut être écrit par les **deux**. Pour tout dépôt de frame, exactement un des deux
> a la main — **Gimli si c'est iakaframe, Fëanor si c'est le frame d'un tiers**. La cible (le dépôt),
> pas le chemin interne ni le type de fichier, décide qui écrit.

**Pourquoi la découpe par CHEMIN interne ne pouvait pas marcher** *(et pourquoi l'arbitrage 7 la
tue)* : elle prétendrait que « `library/` appartient à Fëanor, `cli/` à Gimli ». Mais Fëanor écrit
`library/` **du frame tiers** et Gimli écrit `library/` **d'iakaframe** — même sous-chemin, dépôts
opposés. De plus, le garde-fou `perimeter` est une **garde de chemins ancrée sur le projet, aveugle
aux personas** (`library/guardrails/perimeter.md`) : il **ne saurait pas** distinguer deux personas
écrivant le même sous-chemin. La seule frontière opposable est **le dépôt cible**.

> **Cette frontière est CONTRACTUELLE, et c'est l'état FINAL retenu** *(arbitrage 9 du décideur,
> 2026-07-23)*. Aucun garde-fou **exécutable** n'est exigé sur la cible : la ligne étanche vit dans
> les chartes de Fëanor et de Gimli, exactement comme le bornage de Gandalf à `specs/instructions/`
> vit dans sa charte sans qu'aucune mécanique ne le porte. **Ce n'est pas une dette à combler plus
> tard : c'est une décision assumée.** Un garde-fou exécutable n'est **pas** un chantier ouvert.

> **L'objection honnête, et sa réponse.** *« Pourquoi ce ne serait pas simplement Gimli qui, sur
> demande, scaffolde le frame d'un tiers ? »* Parce que scaffolder un frame neuf **exige l'érudition
> des méthodes** (§ 2, point 1) — savoir quel modèle de rôle convient à ce que le tiers veut forger,
> orienter entre un modèle façon BMAD, MetaGPT ou iakaframe. C'est une **expertise de conception de
> méthode**, pas une exécution d'instruction fermée. Gimli exécute une instruction ; Fëanor **conçoit
> avec le tiers** puis matérialise. Ce sont deux gestes de nature différente sur deux cibles
> différentes.

### 2.2 Le rôle n'appartient à aucune phase du workflow

`library/workflows/iakaframe-3phases.md` répartit les phases sur `cadrage`, `dev`, `qualite`,
`deploiement`. **Trois rôles sur huit n'y figurent déjà pas** : `portefeuille`, `design`,
`documentation`. Un rôle hors chaîne est donc un **cas établi**, pas une exception à inventer.

Le constructeur de frame est de ceux-là : la construction du frame n'est ni P1, ni P2, ni P3 — elle
est le travail qui **produit l'outil** dans lequel P1/P2/P3 s'exécutent. `iakaframe-3phases.md`
reste donc **inchangé** (et, étant une **copie vendorée byte-à-byte**, ne pas y toucher évite un
re-vendorage — bénéfice non négligeable).

### 2.3 État de l'art — « forger la méthode » est un périmètre séparé, et les modèles diffèrent

Vérifié sur le web le 2026-07-23 (sources § 12) : dans l'état de l'art, **construire/étendre le
framework est une surface distincte de l'équipe de livraison**, et chaque framework porte un
**modèle de rôle différent** — ce qui est précisément l'objet de l'érudition de Fëanor.

- **BMAD-METHOD** distingue son roster de livraison (`analyst`, `pm`, `architect`, `sm`, `dev`,
  `qa`, `ux-expert`) d'agents **hors chaîne** (`bmad-orchestrator`, `bmad-master`), et fait de
  l'extension une surface **séparée** : les *expansion packs*, dossiers modulaires portant leurs
  propres agents et tâches, avec un **outillage de création dédié**. C'est le plus proche parent de
  Fëanor.
- **MetaGPT** matérialise ses rôles en **classes de code** (SOP, « Code = SOP(Team) ») — modifier
  le framework est du code, hors périmètre des rôles de projet.
- **CrewAI** modèle l'agent par le triplet **role + goal + backstory + tools**, assemblé en *crew*
  de *tasks* — modèle déclaratif, léger, orienté rôle.
- **AutoGen** (désormais en maintenance, absorbé par Microsoft Agent Framework) modèle par
  **`ConversableAgent` → GroupChat → messages → termination** — modèle conversationnel, pas
  déclaratif-rôle.
- **ChatDev** simule une **entreprise logicielle virtuelle** (CEO, CTO, CPO, programmer, designer,
  tester, reviewer) partitionnée en **phases waterfall** (design, coding, testing, documenting) —
  modèle proche d'iakaframe par la phase, distinct par le casting.

> **Ce que cela fonde.** (1) Placer Fëanor **hors de la chaîne 3 phases** est conforme à l'état de
> l'art (la surface de forge y est toujours séparée de la livraison). (2) L'**érudition** exigée par
> le décideur est réelle et non triviale : ces cinq modèles de « rôle/agent » sont **incompatibles
> entre eux** (déclaratif vs conversationnel vs classe de code vs phase), et orienter un tiers vers
> le bon suppose de les connaître et de les comparer — d'où le corpus écrit du § 2.4.

### 2.4 Le corpus de référence écrit — périmètre du savoir gravé *(arbitrage 6, volet écrit)*

Le corpus versionné dans le dépôt (emplacement au § 5.1) est un **comparatif sourcé, daté et relu**
des modèles de rôle/agent/persona/expansion-pack. **Frameworks retenus au socle** (ceux nommés par
le décideur + iakaframe comme référence interne) :

| # | Framework | Modèle porté (axe de comparaison) | Source de rattachement |
|---|---|---|---|
| 0 | **iakaframe** *(corpus interne)* | rôle = donnée de méthode ; persona pure ; binding = runner/model/tools ; phases + squad prod | `methode-de-travail.md`, `library/`, `methods/` |
| 1 | **BMAD-METHOD** | agents markdown+YAML ; roster livraison vs orchestrator/master ; **expansion packs** | § 12 |
| 2 | **MetaGPT** | rôles = **classes**, SOP, « Code = SOP(Team) » | § 12 |
| 3 | **CrewAI** | agent = **role + goal + backstory + tools** ; crew/tasks ; process hiérarchique | § 12 |
| 4 | **AutoGen** / Microsoft Agent Framework | **ConversableAgent** / GroupChat, conversationnel | § 12 |
| 5 | **ChatDev** | entreprise virtuelle, **rôles par phase waterfall**, chat-chain | § 12 |

> **Extensible, non figé.** La liste est le **socle** demandé, pas une clôture : le corpus déclare
> son axe de comparaison (comment chaque framework modélise « un intervenant ») pour qu'un 6ᵉ
> framework s'y range sans refonte. **LangGraph** (graphe, non orienté-rôle) et l'**Agents SDK
> OpenAI** (handoffs) sont cités **en contraste** — ils montrent qu'un framework peut *ne pas* être
> orienté rôle, ce que Fëanor doit savoir pour ne pas plaquer le modèle iakaframe partout.

---

## 3. Décisions de cadrage — ce que je tranche

> Ce § tranche (a), (c) et (d). **(b) est au § 4, et il revient au décideur.**

### D-A — `scope` : **`portfolio`**, et la question est de faible enjeu *(question (a))*

Le rôle n'est pas un 9ᵉ rôle d'équipe. Il ne s'insère dans aucune phase (§ 2.2), il ne se dispatche
pas dans un projet, et il sert **tous** les projets — comme `portefeuille`. Retenir la valeur
existante `portfolio` évite d'inventer une troisième valeur d'énumération pour un champ que
**personne ne lit** (§ 0.4).

*Alternative écartée* : `scope: frame`, plus juste sémantiquement (le frame n'est pas le
portefeuille de projets), mais qui crée une valeur d'énumération pour un champ inerte. **Réviser
vers `frame` coûtera une ligne** le jour où `scope` deviendra signifiant. C'est acté comme tel.

### D-B — clé et libellé : **`key: frame`**, `label: Constructeur de frame`

Les 8 clés existantes sont des **mots simples, ASCII, en minuscules, sans tiret**, désignant soit
une fonction (`cadrage`, `coordination`), soit un objet (`portefeuille`, `design`,
`documentation`). `frame` suit exactement le patron de `portefeuille` : l'objet possédé.

*Alternatives écartées* : `frame-builder` (formulation du backlog) — seul id à tiret et seul
anglicisme du référentiel, et ces libellés sont **vus par l'utilisateur** en doc publique ;
`forge` — nomme l'outil (`iakaFrameGUI`, `src/forge/`), pas la fonction.

> ⚠️ **Point signalé, non tranché par moi** : la clé est **user-visible**. Si le décideur préfère
> `frame-builder`, le changement est mécaniquement neutre (un nom de fichier + une valeur de clé)
> **à condition d'être fait avant le lot** — après, il coûte un renommage cross-repo.

### D-C — `roleIndex: 9`, en **ajout**, sans renumérotation *(question (c), 1/2)*

`library/roles/` est en base 1 et l'ordre suit `methods/iakaframe.md`. Le 9ᵉ rôle prend **9**, en
queue.

**Interdit : insérer le rôle au milieu et renuméroter.** Le `roleIndex` est la **clé de vignette**
côté GUI (`roles.ts`, `casting.ts`) : renuméroter **déplacerait la couleur de tous les rôles
suivants**, régression visuelle sans rapport avec le besoin. La contrainte est un **ajout en
queue**, pas un classement.

> **Divergence de base à ne pas confondre avec un défaut à corriger ici** : `library/roles/` est en
> base **1**, `CANONICAL_ROLES` en base **0**. Le mapping actuel est `GUI = library − 1`, cohérent
> et sans trou. Le 9ᵉ rôle prend donc `roleIndex: 9` dans la bibliothèque et `roleIndex: 8` dans le
> cœur GUI. **Ne pas unifier les bases dans ce lot** : `vocabulaire-roles-agnostique.md` § 4.3
> montre que la base devient un non-sujet quand la teinte dérive du **rang dans le référentiel
> résolu**. Unifier maintenant serait payer un travail que le lot d'agnosticisme supprime.

### D-D — pastille : **🟠** *(question (c), 2/2)*

**La pastille est un champ de PERSONA, pas de rôle** : aucune fiche de `library/roles/` n'en porte.
Le décideur ayant tranché **D3 (persona Fëanor)**, la question se pose — et le canon la résout : la
pastille **porte la phase**, et la palette documentée (`library/personas/_TEMPLATE.md`) prévoit
**🟠 par défaut pour un transverse**. Fëanor, hors chaîne 3 phases, prend donc **🟠**, comme Loki.
**Aucune couleur neuve, aucune collision à arbitrer.** Royaume : **`FRAME`** (roleKey `frame` en
MAJUSCULE, cohérent avec `royaume = roleKey.toUpperCase()` du cœur GUI).

### D-E — 9ᵉ dégradé de casting : **obligatoire**, pas optionnel

`src/forge/casting.ts` porte **8** dégradés et `vignetteGradient` fait `i % CASTING_GRADIENTS.length`.
Un 9ᵉ rôle (`roleIndex` GUI = 8) reçoit donc `8 % 8 = 0` → **l'or du portefeuille**, sans erreur,
sans warning, sans test rouge. C'est très exactement le mode de défaillance décrit au § 4.3 de
`vocabulaire-roles-agnostique.md`, appliqué pour la première fois à un cas réel.

Le lot **doit** livrer soit un 9ᵉ couple explicite, soit la **palette dérivée** recommandée par ce
même § 4.3 (calibrée pour reproduire les 8 teintes actuelles à `n = 8`). Le choix entre les deux
est un **arbitrage technique de l'exécutant** (§ 6, hors périmètre décideur).

### D-F — `teams/iakaframe-8.md` : **ne pas renommer**

Le backlog note justement que *« le nom même de la team encode le compte »*. Mesuré : cet id est
référencé par `bindings/iakaframe-claude-default.md` (`teamId`), par la fixture vendorée
`team.iakaframe-8.md` (nom de fichier **et** table `fixtureTable()` de `vendor.js`), par
`docs/guide-stefframe2.md` et son `.html`, et par le miroir `frames/releases/StefFrame2/`.

**Renommer coûte plus que le bénéfice et n'appartient pas à ce lot.** Le lot doit en revanche
**écrire noir sur blanc**, dans le corps de `teams/iakaframe-8.md`, que **`-8` est un identifiant
opaque et non un compteur** — sans quoi le prochain lecteur en tirera une inférence fausse. Un item
de dette « id de team porteur d'un compte » est inscrit au backlog, non traité ici.

### D-G — activation explicite : **marqueur « hors dispatch automatique », sur le mécanisme d'Odin** *(arbitrage 5)*

Fëanor n'est **jamais** spawné d'office ; il ne s'active **que sur demande explicite** de
l'utilisateur (CLI, terminal, iakaFrameGUI). C'est un **invariant à graver**, porté — comme le
marqueur « niveau portefeuille » d'Odin — à **trois niveaux vérifiés sur pièces le 2026-07-23** :

| Niveau | Comment Odin le porte (mesuré) | Comment Fëanor le portera |
|---|---|---|
| **Code CLI** | `PORTFOLIO_PERSONAS = ['odin']` dans `agents.js` ; `fullteam` et `assignedPersonas` font `continue`/`filter` dessus → **exclu du déploiement d'équipe** | une **liste d'exclusion** inclut `feanor`, consommée par le **même** `fullteam` |
| **Team** | note « niveau portefeuille » de `teams/iakaframe-8.md` (« hors dispatch projet… exclu du déploiement `fullteam` ») | une note analogue « **activation explicite** » pour Fëanor |
| **Persona** | § Étanchéité de `odin.md` (« pas dispatché comme un agent d'équipe ») | § Étanchéité de `feanor.md` (« activé sur demande explicite seulement ») |
| **Test** | `cli/test/agents.test.js` : `assert.deepEqual(PORTFOLIO_PERSONAS, ['odin'])` | une assertion **symétrique** sur la liste d'exclusion de Fëanor |

> **Même mécanisme, RAISON DIFFÉRENTE — à ne pas conflater** (même précaution que pour Helm dans
> `decision-rolekey-reconciliation.md` § 9.4). Odin est hors dispatch **parce qu'il est
> portefeuille, au-dessus des équipes**. Fëanor est hors dispatch **parce qu'il ne s'active que sur
> demande explicite** — il *est* un membre du roster d'équipe (roleKey `frame`), pas un super-agent
> portefeuille. Ranger `feanor` dans `PORTFOLIO_PERSONAS` **mentirait sur la raison**.
>
> **Reco à l'exécutant (arbitrage technique, pas décideur)** : introduire une constante **distincte**
> — p. ex. `EXPLICIT_ACTIVATION_PERSONAS = ['feanor']` — et faire que `fullteam`/`assignedPersonas`
> excluent **l'union** des deux listes. On garde deux **raisons** lisibles derrière un seul
> **comportement** (exclusion du dispatch auto). Surcharger `PORTFOLIO_PERSONAS` serait le raccourci
> qui recrée une dette de conflation.

### D-H — forme du savoir : **corpus écrit versionné ET web live** *(arbitrage 6)*

Les deux, jamais l'un seul (§ 2, « Deux sources de savoir ») :

- **Web live** — le binding de Fëanor porte **`WebSearch` + `WebFetch`**, comme Gandalf, Loki et
  Nathalie (vérifié : ces trois personas les portent déjà dans `bindings/iakaframe-claude-default.md`).
- **Corpus écrit** — un référentiel sourcé (§ 2.4), rangé comme **savoir-faire de la skill-rôle** de
  Fëanor (`library/skills/iakaframe-frame/`). Le corpus est le **socle de référence**, le web comble
  l'**actu**. Il est livré **complet dans ce lot unique** (arbitrage 8, § 11.1).

---

## 4. Le degré d'incarnation (b) — **tranché : D3 (persona Fëanor)**

> ✅ **Décidé par le décideur le 2026-07-23 : D3.** Une persona neuve, roster 8 → 9. D0/D1 écartés
> (ils gravent le problème au lieu de le résoudre, § 4.3) ; **D2 écarté** (il rompt le 1↔1 et coûte
> le plus cher, § 4.1). Cette section est conservée comme **trace du raisonnement** ayant fondé la
> recommandation D3 que le décideur a suivie.

### 4.1 Pourquoi D2 était le piège — le backlog inversait les coûts

Le backlog propose deux branches : *« une persona neuve (le roster passe de 8 à 9) ou un second
rôle porté par une persona existante, ce qui poserait la première entorse au 1↔1 »* — la seconde
se lisant comme la **variante légère**.

**Mesuré, c'est l'inverse.** `packages/core/src/persona.ts` déclare `roleKey: string` — **un
scalaire**. Une persona à deux rôles impose un **changement de schéma cross-repo** : le type
`Persona` du cœur, `parsePersona`, les adaptateurs (`claudeCode.ts`, `agentsMd.ts`,
`openwebui.ts`), `PersonaEditor.tsx`, plus `assemble` côté CLI (qui fait
`teamRoleKeys.add(p.data.roleKey)`, un seul rôle par persona) et les 8 fixtures personas vendorées.
**C'est la branche la plus coûteuse et la seule qui casse un invariant de modèle** — celui-là même
que le rôle qu'on crée aurait pour charge de défendre.

Et la branche réellement légère — **ne caster aucune persona** — n'est pas dans la liste du
backlog, alors qu'elle est un état **légal** de la méthode (règle décideur du 2026-07-16 : un rôle
non couvert est pris en charge par le coordinateur).

### 4.2 L'échelle réelle : quatre degrés d'incarnation

| Degré | Ce qui existe | Effet | Charge |
|---|---|---|---|
| **D0** | la fiche `library/roles/frame.md` seule, non référencée par la méthode | **aucun** — rôle orphelin du référentiel, invisible partout | ~0,1 j-h |
| **D1** | D0 + la clé dans `methods/iakaframe.md` `roleKeys` | le rôle **existe** pour la méthode ; **absorbé par le coordinateur** (Aragorn) faute de casting ; cross-repo obligatoire | ~1 à 1,5 j-h |
| **D2** | D1 + second rôle sur une persona existante (**1↔1 rompu**) | rôle casté ; **changement de schéma cross-repo** | D1 **+ 2 à 3 j-h**, risque haut |
| **D3** | D1 + **persona neuve** (roster 8 → 9) | rôle **casté et activable** (sur demande explicite, D-G ; **hors dispatch auto**), périmètre porté par un contrat d'agent | D1 **+ 2 à 2,5 j-h** |

### 4.3 Le fondement de D3 — pourquoi D1 seul ne résolvait pas le besoin

> **D1 sans casting recrée exactement le défaut qu'il nomme.** Un rôle de méthode non couvert est,
> par la règle du 2026-07-16, **absorbé par le coordinateur**. La méthode déclarerait donc
> qu'**Aragorn** porte la construction du frame — c'est-à-dire précisément la répartition
> implicite « entre Gandalf, Gimli et Aragorn » que l'item de backlog veut faire cesser, mais
> écrite noir sur blanc cette fois. On aurait payé un lot cross-repo pour **graver le problème**.

**D2 est déconseillé formellement.** Il coûte le plus cher, il rompt un invariant du modèle, et il
le rompt dans le lot dont l'objet est de créer le gardien des invariants. Si le 1↔1 doit tomber un
jour, que ce soit dans un lot qui le traite pour lui-même — pas en effet de bord.

**D3 est le seul degré où le rôle produit ce qu'on attend de lui** : un périmètre étanche, porté
par un contrat d'agent déployé, avec ses outils bornés par le binding et son badge d'identité. Il
coûte ~3 à 4 j-h au total et touche les deux dépôts.

**Repli assumé si le coût est jugé prohibitif** : **D1 explicitement étiqueté « incarnation
différée »**, avec la mention, dans le corps de la fiche de rôle, que l'absorption par le
coordinateur est **temporaire et non désirée**, et un item de backlog qui porte D3. C'est un moindre
mal ; ce qu'il ne faut pas faire, c'est livrer D1 en le **présentant** comme la résolution de l'item.

> **Tranché par le décideur** : **D3**, persona **Fëanor**, royaume **`FRAME`**. Le nommage du
> roster étant sa prérogative, il l'a exercée. Le reste de l'instruction est écrit **pour D3** ;
> les degrés inférieurs ne subsistent qu'en trace de raisonnement (§ 4.2).

---

## 5. Recensement mécanique (e) — sur pièces, dépôt par dépôt

Colonne **Degré** = degré d'incarnation à partir duquel l'entrée devient obligatoire.

### 5.1 Dépôt `iakaframe`

| # | Fichier / symbole | Ce qui bouge | Degré |
|---|---|---|---|
| 1 | `library/roles/frame.md` | la 9ᵉ fiche (`id`, `key`, `label`, `roleIndex: 9`, `scope: portfolio`) + corps court, sur le patron de `cadrage.md` | **D0** |
| 2 | `methods/iakaframe.md` — `roleKeys` | 8 → 9 clés. `checkRefs` reste vert (la fiche existe) | **D1** |
| 3 | `cli/test/library.test.js` — test « vraie bibliothèque … 8/8 » | `methodRoleKeys.length` 8 → 9 (et `personas.length` 8 → 9 en D3) | **D1** |
| 4 | `cli/test/library.test.js` — test « team 7 personas (helm retiré) » | `coveredByCoordinator` devient `['deploiement', 'frame']` en D1 (**non casté**) ; **inchangé** en D3 | **D1** |
| 5 | `library/personas/feanor.md` | la 9ᵉ persona : `id: feanor`, `roleKey: frame`, `royaume: FRAME`, `pastille: "🟠"`, `skills: [iakaframe-frame]`, `guardrails: [identity, perimeter]`, `description` seedée ; **§ Étanchéité portant l'activation explicite** (D-G) et la **frontière par cible** (§ 2.1) | **D3** |
| 6 | `bindings/iakaframe-claude-default.md` — `assignments` | 1 ligne `{ personaId: feanor, runner: claude-code, model, tools }`. **`tools` inclut `WebSearch` + `WebFetch`** (D-H) **et** `Write`/`Edit`/`Bash` (génération du frame cible, arbitrage 7). **Copie vendorée byte-à-byte** → re-vendorage | **D3** |
| 6b | `cli/src/lib/agents.js` — **liste d'exclusion du dispatch** | nouvelle constante `EXPLICIT_ACTIVATION_PERSONAS = ['feanor']` ; `fullteam`/`assignedPersonas` excluent **l'union** avec `PORTFOLIO_PERSONAS` (D-G). **Ne PAS surcharger `PORTFOLIO_PERSONAS`** | **D3** |
| 6c | `cli/test/agents.test.js` | assertion symétrique à celle d'Odin : `EXPLICIT_ACTIVATION_PERSONAS === ['feanor']` **et** `fullteam` ne déploie pas `feanor` | **D3** |
| 6d | `library/personas/gimli.md` — § Périmètre | **réciproque de N2** (A27) : une phrase « Gimli n'agit jamais sur le frame d'un tiers (→ Fëanor) ». **Modifie une persona existante** → regénère le golden `gimli.md` + re-vendore sa fixture. Seul point où le lot touche une autre charte | **D3** |
| 7 | `teams/iakaframe-8.md` — `personas` + note | +1 id `feanor`. **Note « activation explicite »** sur le modèle de la note « niveau portefeuille » d'Odin (D-G). **Id de team non renommé** (D-F) + mention « `-8` = id opaque » | **D3** |
| 8 | `cli/src/lib/vendor.js` — `IDS`, `EXPECTED_COPIES` | `IDS` 8 → 9 ; `EXPECTED_COPIES` **18 → 20** (9 personas + 9 goldens + 1 binding + 1 workflow) | **D3** |
| 9 | `cli/test/fixtures/agents-golden/feanor.md` | nouveau golden, produit par `generateAgent` (jamais à la main) | **D3** |
| 10 | `cli/test/parite-generateurs.test.js` | inventaire des ids (même liste, même ordre que `vendor.js`) | **D3** |
| 11 | `cli/src/lib/agents.js` — `ROLE_OF`, `SKILL_OF` | +1 entrée `frame → iakaframe-frame` dans `ROLE_OF`/`SKILL_OF`. ⚠️ **Table en divergence lexicale** (§ 0.2) : y écrire une clé canon crée une table **à deux vocabulaires** → commentaire obligatoire | **D3** |
| 12 | `library/skills/iakaframe-frame/SKILL.md` (+ corpus) | **skill-rôle de Fëanor**, qui **porte l'érudition** (D-H) : geste + discipline web + **corpus mondial sourcé complet** (§ 2.4), livré dans **ce lot unique** (arbitrage 8). `SKILL_OF.frame` la pointe | **D3** |
| 13 | `library/skills/iakastart/SKILL.md` + `library/rituals/iakastart.md` | « roster des 8 agents » → 9 (2 occurrences au moins), avec **marqueur « activation explicite »** sur la ligne Fëanor. Renforce la règle existante « ne jamais spawner » : Fëanor est **doublement** hors spawn auto | **D3** |
| 14 | `kits/iakaframe-anythingllm/prompts/`, `kits/iakaframe-openwebui/models/` | 8 fichiers chacun ; +1 chacun | **D3** |
| 15 | `docs/commandes.md` | « les 18 copies (8 goldens + 8 personas + 1 binding + 1 workflow) » → 20 (9+9+1+1) | **D3** |
| 16 | `docs/guide-stefframe2.md` + `.html` | « 8 personas », « 9 fichiers dans `personas/` », « 8 agents réels », « 7 skills de rôle pour 8 agents », `teams/iakaframe-8.md` | **D3** |
| 17 | `frames/releases/StefFrame2/` | **double miroir** : `roles/` (8 fiches) **et** `library/roles/` (8 fiches), plus `personas/`, `library/personas/`, `methods/`, `teams/`, `kits/`, `.claude/agents/` | **D1** (rôles) / **D3** (personas) |
| 18 | `BACKLOG.md` | item soldé + items de dette ouverts par le lot (§ 10) | **D0** |

> **Sur l'entrée 17 — un angle mort à nommer.** `iakaframe frame verify` **ne vérifie que
> l'anonymisation** du miroir (tokens privés, IP, noms propres) : **aucune commande, aucun test ne
> compare le miroir au canon**. Le miroir peut donc rester à 8 rôles indéfiniment sans qu'une seule
> assertion rougisse — c'est la même classe de défaut que `vendor-check` a fermée côté GUI, restée
> ouverte côté frame release. Le lot **doit trancher explicitement** : rafraîchir le miroir, ou
> l'acter figé — et dans les deux cas **l'écrire**, jamais le laisser implicite.

### 5.2 Dépôt `iakaFrameGUI`

| # | Fichier / symbole | Ce qui bouge | Degré |
|---|---|---|---|
| 19 | `packages/core/src/roles.ts` — `CANONICAL_ROLES` | +1 entrée (`key: "frame"`, label, `roleIndex: 8`) ; commentaires « les 8 rôles » (3 occurrences) ; en-tête « LISTE CANONIQUE FERMÉE des 8 rôles » | **D1** |
| 20 | `packages/core/src/method.ts` — `IAKAFRAME_CANONICAL_METHOD`, rapport de résolution | `roleKeys: [...CANONICAL_ROLE_KEYS]` suit ; **`scan("roleKeys", id => CANONICAL_ROLE_KEYS.includes(id))`** signale la 9ᵉ clé **non résolue** tant que 19 n'est pas fait | **D1** |
| 21 | `src/forge/casting.ts` — `CASTING_GRADIENTS` | 9ᵉ couple, **ou** palette dérivée (D-E). **Sans ça : vignette or du portefeuille, en silence** | **D1** |
| 22 | `packages/core/src/roster.ts` — `DEFAULT_NAMES`, `DEFAULT_SKILLS` | 8 entrées chacune ; `CANONICAL_ROSTER` est **dérivé de `CANONICAL_ROLES`** → une entrée manquante produit une persona nommée d'après le `label` et **sans skill** | **D1** |
| 23 | `packages/core/__tests__/roster.test.ts`, `method.test.ts` | comptes et clés attendus | **D1** |
| 24 | `src/forge/casting.test.tsx` | garde C20 (`CASTING_GRADIENTS.length >= CANONICAL_ROLES.length`) — à mettre à jour **ou** à retirer si D-E retient la palette dérivée | **D1** |
| 25 | Consommateurs de `CANONICAL_ROLES` / `CANONICAL_ROLE_KEYS` | **19 fichiers de code mesurés**, dont `PersonaEditor.tsx` (défaut `CANONICAL_ROLES[0]` + menu), `WorkflowAtelier.tsx` (3 menus), `MethodeAtelier.tsx` (rail « Référentiel de rôles » + `count`), `TeamAtelier.tsx`, `KitAtelier.tsx`, `RosterList.tsx`, `LiaisonPanel.tsx`, `WorkflowPanel.tsx`, `prompt.ts` (`"method-role"`), `persona.ts`, `workflow.ts`, adaptateurs `claudeCode.ts`/`agentsMd.ts`/`openwebui.ts` | **D1** — inventaire un par un **exigé en ouverture** |
| 26 | `packages/core/__tests__/fixtures/` | `method.iakaframe.md` + `method.iakaframe-wrapped.md` (dérivées, frontmatter) en **D1** ; `personas/feanor.md`, `agents-golden/feanor.md`, `binding/…`, `team.iakaframe-8.md` en **D3** | **D1 / D3** |
| 27 | `src-tauri/src/library_store.rs` | `roles` déjà dans l'allow-list de lecture — **rien à faire** | — |
| 28 | `src/forge/refs.ts` | I1 côté GUI, contre la collection **chargée** — résout dès que la fiche est dans le frame chargé — **rien à faire** | — |

### 5.3 Hors dépôts — à signaler, jamais à écrire

`~/.claude/CLAUDE.md` (instructions globales) énonce le **roster des 8 agents** et
`~/.claude/agents/` porte les contrats déployés. **Aucun agent n'écrit dans ces fichiers** : le lot
les **signale** au décideur, qui décide de la mise à jour. À rapprocher de la dette ouverte
« skills déployées : 25 au canon, 15 déployées » (backlog) : le déploiement d'une 9ᵉ persona
tomberait dans la même zone non outillée.

---

## 6. Périmètre — **un seul lot** (arbitrage 8, § 11.1)

### Dans le périmètre

- La **fiche de rôle** `library/roles/frame.md` (D-A/B/C) et son insertion dans le référentiel.
- La **persona `feanor.md`** (D3), le **binding** (avec `WebSearch`/`WebFetch`, D-H, et les outils
  de génération), la **team** (avec la note d'activation explicite, D-G).
- Le **marqueur d'activation explicite** aux trois niveaux + son test (D-G, § 5.1 entrées 6b/6c/7).
- La **skill-rôle `iakaframe-frame`** : le geste d'assistance, la discipline web live, la frontière
  par cible, **et le corpus mondial sourcé complet** (§ 2.4) — comparatif des 6 frameworks + les
  2 contrastes, daté et relu. **Pas de version socle intermédiaire** (arbitrage 8).
- **Toutes** les conséquences mécaniques du § 5 (cross-repo), la **remise au vert** des gardes du
  § 0.5 après les avoir vues rouges, le **9ᵉ dégradé de casting** (D-E), le rafraîchissement **ou**
  le gel explicite du miroir `frames/releases/StefFrame2/` (§ 5.1, 17).
- La **matrice de clôture** (§ 2, point 4) **restreinte au type `role`**, comme patron.

### Hors périmètre — explicitement

- **Le lot d'agnosticisme** `vocabulaire-roles-agnostique.md` (`parseRole`, `SEED_ROLES`,
  référentiel résolu, F-1..F-10, fixture MetaGPT). Ce lot **subit** la liste fermée, il ne la
  supprime pas.
- **La réconciliation `ROLE_OF`** (les 6 divergences lexicales + `SKILL_OVERRIDE_OF`) : on **ajoute
  une entrée** à une table divergente, on ne la répare pas. → § 9.
- **L'unification des bases d'index** 0 / 1 entre bibliothèque et cœur GUI (D-C).
- **Le renommage de `teams/iakaframe-8.md`** (D-F).
- **La matrice de clôture des 11 autres types d'atomes.**
- **La mise à jour de `~/.claude/`** (§ 5.3) et le **déploiement runtime** de la skill (dette des
  skills déployées, § 9).
- **L'outillage net-neuf de scaffolding d'un frame vierge**, si les verbes de forge existants
  (`assemble`/`add`/`onboard`) ne suffisent pas : c'est une **inconnue** (§ 11, R14) qui, si elle se
  matérialise, fait l'objet d'un cadrage propre — le lot **réutilise l'existant**.
- **Toute documentation utilisateur** au-delà de la mise en cohérence des comptes (§ 5.1, entrées
  15, 16) → 📖 Nathalie.

---

## 7. Critères d'acceptation — numérotés, mesurables

> **A0 est une condition d'ordre, pas un critère de contenu.** Un lot qui remettrait les gardes au
> vert sans les avoir vues rouges d'abord **n'est pas fini**, quelle que soit la couleur finale des
> suites (même exigence qu'au § 9.3 de `decision-rolekey-reconciliation.md`).

**Communs à tous les degrés**

- **A0** — Les trois gardes du § 0.5 sont **exécutées et constatées ROUGES** après le premier
  changement de compte, et la trace de cette exécution rouge figure au gate. Puis vertes.
- **A1** — `library/roles/frame.md` existe, avec `id: frame`, `key: frame`,
  `label: Constructeur de frame`, `roleIndex: 9`, `scope: portfolio`, et un corps qui énonce les
  trois possessions du § 2 (invariants, matrice de clôture, verdict de conformité) **et** les trois
  tests de non-recouvrement N1/N2/N3 du § 2.1.
- **A2** — Les `roleIndex` de `library/roles/` restent **1..9, sans trou ni doublon** ; **aucun
  index existant n'a changé de valeur** (vérifiable par diff : une seule fiche ajoutée, zéro fiche
  modifiée sur ce champ).
- **A3** — `iakaframe list roles` affiche **9** entrées.
- **A4** — `iakaframe vendor-check` rend **OK, drift 0**, avec l'inventaire **exact attendu**
  (`18 + 4` en D1 ; `20 + 4` en D3), jamais un minimum.
- **A5** — Les deux suites (`iakaframe` et `iakaFrameGUI`) sont vertes, et le **compte de tests
  n'a pas diminué**.
- **A6** — `BACKLOG.md` : l'item « rôle frame builder » est soldé **avec sa preuve de clôture** ;
  les dettes ouvertes par le lot (§ 10) y sont inscrites.

**À partir de D1**

- **A7** — `methods/iakaframe.md` déclare **9** `roleKeys`, la 9ᵉ étant `frame`, en **queue** ;
  `iakaframe assemble iakaframe iakaframe-8` rend `ok: true` sans **aucun** rôle en `orphans`.
- **A8** — `packages/core/src/roles.ts` : `CANONICAL_ROLES` compte **9** entrées, `roleIndex`
  **0..8 sans trou ni doublon**, et **aucun commentaire du fichier n'annonce encore « 8 rôles »**
  (grep `8 rôles` dans `packages/core/src/` ⇒ **0**).
- **A9** — `roleByKey("frame")` ≠ `null` ; `roleLabel("frame")` rend le **libellé**, pas la clé ;
  `roleIndexOf("frame") === 8`.
- **A10** — `vignetteGradient(8)` rend un couple **distinct de `vignetteGradient(0)`** — critère
  qui échoue aujourd'hui et qui est la preuve exécutable de D-E.
- **A11** — Le **rapport de résolution de méthode** (`method.ts`) ne signale **aucune** `roleKey`
  non résolue pour la méthode iakaframe.
- **A12** — Le rôle `frame` **apparaît** dans les menus déroulants de `PersonaEditor` et de
  `WorkflowAtelier`, et le rail « Référentiel de rôles » de `MethodeAtelier` affiche `count = 9`
  (test de composant).
- **A13** — `buildTeamFromRoster` produit **9** personas, dont une portant `roleKey: "frame"`, avec
  un `name` non vide et un `roleIndex` égal à `8`.
- **A14** — Le sort du miroir `frames/releases/StefFrame2/` est **tranché et écrit** : soit ses
  **deux** dossiers de rôles portent 9 fiches, soit un item de dette nommé « miroir StefFrame2
  figé à 8 rôles » est inscrit au backlog. **L'implicite est un échec de critère.**
- **A15** — `teams/iakaframe-8.md` porte, dans son corps, la mention explicite que **`-8` est un
  identifiant opaque et non un compteur**.

**D3 — la persona Fëanor**

- **A16** — `iakaframe list personas` affiche **9** entrées ; `iakaframe agents list` associe
  `feanor` au rôle `frame`.
- **A17** — Le golden `cli/test/fixtures/agents-golden/feanor.md` est **produit par `generateAgent`**
  (pas écrit à la main) et `iakaframe agents generate --check` passe **sans dérive**.
- **A18** — `cli/src/lib/vendor.js` : `IDS.length === 9`, `EXPECTED_COPIES === 20`, et
  `fixtureTable()` rend **24** lignes (20 copies + 4 dérivées).
- **A19** — `bindings/iakaframe-claude-default.md` porte **9** assignments ; la ligne `feanor`
  porte un `tools` **explicitement borné** incluant **`WebSearch` + `WebFetch`** (D-H) **et** les
  outils de génération du frame cible (`Write`/`Edit`/`Bash`) — jamais « hérite tout ».
- **A20** — Le contrat déployé et la fixture GUI de `feanor` sont **byte-à-byte** égaux au canon
  (constaté par `vendor-check`, cf. A4).
- **A21** — `grep -r "roster des 8 agents"` dans `library/` et `docs/` ⇒ **0** ; les comptes de
  `docs/commandes.md` et `docs/guide-stefframe2.{md,html}` sont à jour (§ 5.1, 15-16).
- **A22** — La charte de `feanor.md` porte le **double badge** (ouverture/clôture, position de la
  pastille) avec **🟠**, royaume **`FRAME`**, et déclare son périmètre par les **trois
  non-recouvrements refondés sur la CIBLE** N1/N2/N3 (§ 2.1) — dont **N1 : Fëanor n'agit jamais
  sur le frame iakaframe ni sur un projet iakaframe**.

**D3 — activation explicite (D-G, arbitrage 5)**

- **A23** — Le marqueur « hors dispatch automatique / activation explicite » est porté et
  **vérifiable** aux trois niveaux, sur le modèle d'Odin : (i) `cli/src/lib/agents.js` déclare
  `EXPLICIT_ACTIVATION_PERSONAS` contenant `feanor`, **distincte** de `PORTFOLIO_PERSONAS` ;
  (ii) `fullteam` **ne déploie pas** `feanor` (test dédié) ; (iii) `teams/iakaframe-8.md` et
  `library/personas/feanor.md` portent la note d'activation explicite en clair. `cli/test/agents.test.js`
  assère `EXPLICIT_ACTIVATION_PERSONAS === ['feanor']`.

**Érudition, web, génération (arbitrages 6, 7 et 8 — corpus complet dans CE lot)**

- **A24** — La skill-rôle `library/skills/iakaframe-frame/SKILL.md` existe, `SKILL_OF.frame` la
  pointe, et elle déclare **les deux corpus** (interne iakaframe + mondial) et **l'axe de
  comparaison** des modèles de rôle. Le corpus mondial est **complet dès ce lot** (arbitrage 8, pas
  de version socle intermédiaire) : comparatif **sourcé** (chaque affirmation renvoie à une source
  datée), **relu**, couvrant les **6 frameworks du socle** (§ 2.4) + les 2 contrastes, structuré par
  l'axe de comparaison déclaré. Chaque source est **horodatée** de sa date de vérification.
- **A25** — Le binding de `feanor` porte `WebSearch` **et** `WebFetch` (A19) — la capacité web live
  est effective.
- **A26** — La charte de Fëanor décrit explicitement qu'il **conçoit ET génère** les fichiers d'un
  **frame cible tiers** (`library/`, `bindings/`, `methods/`…) en réutilisant l'outillage de forge
  existant, et qu'il rend un **verdict de conformité de modèle** sur ce frame cible (§ 2, point 4).
- **A27** *(non-recouvrement Gimli ↔ Fëanor, fondé sur la CIBLE)* — Les chartes de **Gimli** et de
  **Fëanor** énoncent la même ligne étanche : pour tout dépôt de frame, **un seul** des deux a la
  main — **Gimli si c'est iakaframe / un projet iakaframe, Fëanor si c'est le frame d'un tiers**.
  La distinction est **la cible (le dépôt)**, jamais le type de fichier ni le sous-chemin (§ 2.1).
  Cette frontière est **contractuelle et suffisante** (arbitrage 9, § 2.1) : aucun garde-fou
  exécutable n'est exigé. *(La réciproque doit être ajoutée à `library/personas/gimli.md` — cf.
  § 5.1 entrée 6d : seul point où le lot touche une autre charte ; il déclenche golden +
  re-vendorage de Gimli.)*

---

## 8. Invariants — à ne pas casser

- **I1** — Les assemblages (`methods/`, `teams/`, `bindings/`) ne portent **que des ids** ; aucun
  corps de rôle n'y est recopié.
- **I3** — La persona reste **pure** : ni `runner`, ni `model`, ni `tools` dans
  `library/personas/` ; le triplet vit **uniquement** dans le binding.
- **E2** — `methods/iakaframe.md` ne nomme **aucune persona** : il déclare `roleKeys`, rien d'autre.
- **1↔1 persona ↔ rôle** — **CONSERVÉ** : D3 crée une persona neuve (Fëanor) pour un rôle neuf
  (`frame`) → 9 personas ↔ 9 rôles. D2 (qui l'aurait rompu) a été écarté par le décideur.
- **Activation explicite / hors dispatch automatique** *(nouvel invariant, D-G)* — Fëanor n'est
  **jamais** spawné par le dispatch d'équipe ; il ne s'active que sur demande explicite. Porté aux
  trois niveaux + testé (A23), par un mécanisme **distinct** de celui d'Odin (raisons différentes).
- **Frontière par la CIBLE** *(nouvel invariant, arbitrage 7)* — Fëanor n'écrit **jamais** dans le
  frame iakaframe (ce dépôt) ni dans un projet iakaframe ; Gimli n'écrit **jamais** dans le frame
  d'un tiers. La ligne étanche est le **dépôt cible**, jamais le type de fichier (A27).
- **Le canon est l'autorité** — `library/roles/` est la source ; `CANONICAL_ROLES` et `ROLE_OF` en
  sont des consommateurs. Aucune valeur n'est écrite d'abord dans une table codée.
- **Aucun `roleIndex` existant ne change** (A2).
- **Aucune teinte de casting existante ne change** — si D-E retient la palette dérivée, elle est
  calibrée pour **reproduire** les 8 teintes actuelles à `n = 8`.
- **Auto-validation interdite** — chaque lot passe le **gate Legolas** ; le degré et les noms ont
  passé le **gate décideur**.

---

## 9. Dépendances — déclarées, sans rang

> Aucune de ces dépendances n'est un **prérequis bloquant** au sens strict : le lot est exécutable
> sans elles. Elles décrivent des **interactions à connaître avant d'engager**, pas un ordre imposé.

1. **`vocabulaire-roles-agnostique.md` — cadré, non exécuté.** Son critère **F-4** dit que *« le
   compte de rôles n'est jamais présumé »* et son **F-5** qu'*« aucune collision de casting »* ne
   doit survenir quel que soit le cardinal. **Le présent lot est le premier cas réel qui viole les
   deux** : il paie une fois de plus la taxe du compte gravé dans le cœur (§ 5.2, entrées 19-25).
   Trois ordonnancements possibles, **à arbitrer** :
   - *(i)* faire ce lot **après** l'agnosticisme : les entrées 19, 21, 22, 24, 25 s'effondrent —
     ajouter une fiche suffirait. Économie réelle, mais subordonne une demande du décideur à un lot
     de ~4,25 j-h non engagé ;
   - *(ii)* faire ce lot **maintenant**, en payant la taxe (chiffrage du § 11) ;
   - *(iii)* **recommandé** — faire ce lot maintenant **et** y intégrer les seuls **B1** (casting
     dérivé du rang) et le retrait de C20, que le 9ᵉ rôle rend de toute façon obligatoires. Le lot
     livre alors un **fragment durable** de l'agnosticisme au lieu d'une rustine.
2. **`ROLE_OF` (CLI) — divergence lexicale non résorbée.** En D3, le lot **ajoute une clé au
   vocabulaire canon dans une table qui porte l'ancien vocabulaire**. C'est acceptable et
   documenté, mais **doit être écrit dans le code** (commentaire) pour ne pas être relu comme une
   incohérence accidentelle. Le poste **B3** de `vocabulaire-roles-agnostique.md` (~0,25 j-h) le
   résorberait ; il n'est pas dans ce périmètre.
3. **`garde-vendor-check-cross-repo.md`** — le mécanisme de re-vendorage est **en place et au vert**
   (drift 0 au 2026-07-23). Le lot s'appuie dessus ; il ne le modifie pas, hormis `IDS` /
   `EXPECTED_COPIES` en D3.
4. **Dette des skills déployées** (10 skills du canon absentes de `~/.claude/skills/`) — n'affecte
   pas le lot, **sauf** si le décideur veut une skill-rôle : elle serait inerte au déploiement.
   D'où son exclusion du périmètre (§ 6).
5. **Item de backlog « `iakaframe jalon --help` plante »** — le gate P1→P2 et le jalon de remise
   passent par ce verbe. Correctif quasi nul, hors périmètre, mais à connaître avant le gate.
6. **Lot unique — pas de phasage interne.** Le décideur a écarté le découpage (arbitrage 8, § 11.1) :
   le corpus mondial sourcé complet est livré **dans ce lot**, sous **un seul gate Legolas**. Seule
   contrainte d'ordre interne à l'exécution : **le corpus (part éditoriale) n'a aucune dépendance
   vers l'agnosticisme** ni vers le reste du lot — il peut être mené en parallèle du structurel.

---

## 10. Risques et défauts relevés

| # | Risque / défaut | Portée | Traitement |
|---|---|---|---|
| R1 | **Le 9ᵉ rôle prend la vignette or du portefeuille**, en silence (`i % 8`) | GUI, visible | **D-E, obligatoire** ; A10 en est la preuve exécutable |
| R2 | **Le miroir `frames/releases/StefFrame2/` reste à 8 rôles** sans qu'aucun test ne rougisse — `frame verify` ne contrôle que l'anonymisation, et le miroir **duplique** les rôles à deux endroits | `iakaframe` | A14 : trancher **et écrire** ; item de dette « pas de garde de parité miroir ↔ canon » |
| R3 | **La formulation (b) du backlog inversait les coûts** (D2 = branche la plus chère) | décision | ✅ **résolu** — décideur a écarté D2, retenu D3 (§ 4) |
| R4 | **D1 seul aurait gravé le problème** (absorption par le coordinateur) | méthode | ✅ **résolu** — décideur a retenu D3 (§ 4.3) |
| R11 | **Confusion d'OBJET** : lire Fëanor comme « celui qui maintient le frame iakaframe » — c'est Gandalf/Gimli. Le risque est réel car son type d'artefact (`library/roles/*.md`) est identique au leur | méthode, doc | § 2.1 + A22/A27 : frontière **par cible** gravée dans les chartes des **deux** (Fëanor **et** Gimli) |
| R12 | **Le garde-fou `perimeter` ne porte pas la frontière par cible** (ancré sur `$CLAUDE_PROJECT_DIR`, aveugle aux personas) | runtime | ✅ **état FINAL assumé** (arbitrage 9, § 2.1) : frontière **contractuelle suffisante**, comme le bornage de Gandalf à `specs/instructions/`. **Pas une dette, pas un chantier ouvert** — un garde-fou exécutable n'est **pas** demandé |
| R13 | **Mécanisme d'activation explicite surchargé** si on range `feanor` dans `PORTFOLIO_PERSONAS` : on perdrait la **raison** (portefeuille vs activation explicite) | CLI | D-G : constante **distincte** `EXPLICIT_ACTIVATION_PERSONAS`, union à l'exclusion `fullteam` ; A23 |
| R14 | **Le scaffolding d'un frame VIERGE peut dépasser les verbes de forge existants** (`assemble`/`add`/`onboard` visent des projets/kits, pas un frame from scratch) — outillage net-neuf possible | dev | **inconnue RÉELLE, restée ouverte** (arbitrage 9 ne la referme pas) ; le lot **réutilise l'existant** et **borne** au conseil+génération sur structure connue ; à **éprouver tôt en exécution** ; tout outillage neuf est hors périmètre (§ 6) |
| R5 | **Table `ROLE_OF` à deux vocabulaires** après D3 | CLI | § 9.2 — commentaire obligatoire dans le code |
| R6 | **Le lot paie une taxe que l'agnosticisme supprimerait** (entrées 19, 21, 22, 24, 25) | ordonnancement | § 9.1 — trois options, reco *(iii)* |
| R7 | **19 consommateurs de `CANONICAL_ROLES` jamais audités un par un** — c'est l'inconnue n° 1 de `vocabulaire-roles-agnostique.md`, toujours non levée | GUI | **Inventaire exigé en ouverture de lot** ; peut faire glisser le chiffre |
| R8 | **`~/.claude/` hors dépôt** : le roster déployé restera à 8 agents après le lot | runtime | § 5.3 — signalé, jamais écrit par un agent |
| R9 | **Le rôle peut se dégrader en décoration** s'il ne produit qu'une fiche | méthode | § 2 — obligation « chaque verdict analytique produit une garde candidate » ; A1 l'exige dans le corps de la fiche |
| R10 | **Divergence de base d'index 0/1** entre bibliothèque et cœur GUI, cohérente aujourd'hui, fragile en soi | cross-repo | D-C — **ne pas** unifier ici ; l'agnosticisme la dissout |

---

## 11. Estimation — **un seul lot** (jalon P1→P2)

> **Ordre de grandeur assumé et révisable, jamais un engagement ferme.** Réévalué après les
> arbitrages 6, 7 et 8 : le chiffre initial de ~3,7 j-h **ne tient plus** — l'érudition écrite est
> un chantier de contenu à part entière, et la génération de frame cible ajoute un poste de charte
> substantiel.

### 11.1 Un lot unique — **arbitrage 8 du décideur (2026-07-23), tracé**

> ⚠️ **Le découpage en deux lots a été proposé par Gandalf, puis EXPLICITEMENT ÉCARTÉ par le
> décideur le 2026-07-23.** Ce n'est **pas** un oubli : c'est un choix. La persona Fëanor, la
> mécanique cross-repo, le web live, la génération de frame cible **et le corpus mondial sourcé
> complet** sont livrés **ensemble**, sous **un seul gate Legolas**.
>
> Ma recommandation était de scinder (structure + web live d'abord ; corpus écrit ensuite), au motif
> que les deux moitiés ont des natures et des relecteurs différents. **Le décideur a préféré une
> livraison d'un bloc** — Fëanor n'entre en service qu'une fois **pleinement érudit**, corpus relu
> inclus, sans état intermédiaire où il conseillerait sur le seul web live. C'est cohérent avec le
> risque « conseil à la légère » que je signalais moi-même comme le seul argument sérieux contre le
> découpage. **L'arbitrage est retenu et fait foi ; cette trace existe pour qu'un futur lecteur
> sache que le lot unique fut délibéré.**

### 11.2 Postes du lot

| Poste | Charge |
|---|---|
| Fiche de rôle `frame` + corps + matrice de clôture du type `role` | 0,25 |
| `methods/iakaframe.md` + gardes CLI (§ 0.5) vues rouges puis vertes | 0,25 |
| Cœur GUI : `roles.ts`, `method.ts`, `roster.ts` + tests core | 0,4 |
| Casting : 9ᵉ teinte **ou** palette dérivée + C20 + tests (D-E) | 0,3 |
| Raccordement / audit des 19 consommateurs GUI (R7) | 0,3 |
| Persona `feanor` + binding (web + génération) + golden + `agents generate --check` | 0,5 |
| **Activation explicite** : `EXPLICIT_ACTIVATION_PERSONAS` + `fullteam` + test + notes team/persona (D-G) | 0,25 |
| **Frontière par cible** : chartes Fëanor **et** Gimli (A27) + golden/vendorage Gimli (6d) | 0,3 |
| Skill-rôle `iakaframe-frame` : geste, discipline web, structure du corpus (A24) | 0,4 |
| **Corpus mondial sourcé complet** : cadre d'analyse + étude des 6 frameworks (~0,4 chacun) + 2 contrastes + rédaction/synthèse/relecture/horodatage (A24) | 3,25 |
| `vendor.js` (`IDS`, `EXPECTED_COPIES` 18→20) + fixtures GUI persona/golden | 0,4 |
| `ROLE_OF`/`SKILL_OF` + commentaire de divergence lexicale | 0,15 |
| Kits (anythingllm, openwebui) + `iakastart` (roster 9 + marqueur) + docs/comptes | 0,5 |
| Miroir `StefFrame2` (rafraîchi ou gelé + dette écrite) | 0,25 |
| Rituel de « fini » : goldens → déployé → re-vendorage → 2 suites | 0,25 |
| **Total** | **~8,5 j-h** *(fourchette 7,5 – 10,5)* |

*Option (iii) du § 9.1 (fragment d'agnosticisme intégré) : **+0,4 j-h**, le poste « casting »
devenant un acquis durable au lieu d'une rustine.*

### 11.3 Complexité, risque, gate

**Complexité : moyenne-haute. Risque : moyen. Gate : Legolas** (typecheck/lint/tests +
`vendor-check`, en une fois pour tout le lot).

- *Ce qui abaisse le risque* : la partie structurelle **a des instruments qui mordent** (§ 0.5) —
  elle ne peut pas échouer en silence ; le geste est additif (aucune valeur existante ne change).
- *Ce qui le maintient à moyen* : le lot est **cross-repo obligatoire**, touche un cœur GUI **sans
  filet de compilation** sur les clés de rôle, **et** porte une part **éditoriale** (le corpus
  sourcé) qu'aucun test ne vérifie — sa qualité repose sur la **relecture au gate**, pas sur une
  suite verte. C'est le point d'attention que le lot unique concentre en un seul passage.

**Ce qui a alourdi le chiffre depuis le premier cadrage (~3,7 → ~8,5 j-h) :** l'érudition écrite
(entièrement neuve, ~3,25 j-h à elle seule), la génération de frame cible (charte + tools élargis),
le marqueur d'activation explicite (+ son test), la frontière par cible (qui touche **aussi**
Gimli), et la skill-rôle (là où le premier cadrage la mettait *hors* périmètre).

**Inconnues susceptibles de faire glisser le chiffre**

1. **Le scaffolding d'un frame VIERGE** (R14) : si les verbes de forge existants
   (`assemble`/`add`/`onboard`, qui visent projets/kits) ne suffisent pas à matérialiser un frame
   from scratch, un outillage net-neuf s'ajoute — **hors périmètre**, mais **à éprouver tôt en
   exécution** pour savoir si la charte de Fëanor promet plus que l'outillage ne tient. **Inconnue la
   plus structurante — elle reste ouverte** (arbitrage 9 ne la referme pas).
2. **Les 19 consommateurs de `CANONICAL_ROLES`** (R7) : à inventorier en premier.
3. **Le miroir `StefFrame2`** : ampleur réelle non mesurée au fichier près si rafraîchi.
4. **La suite GUI complète n'est pas re-mesurable** sur machine chargée : le gate final peut
   demander une passe CI.
5. **Neutralité et fraîcheur du corpus** : les frameworks évoluent (AutoGen en maintenance,
   Microsoft Agent Framework qui l'absorbe) — le corpus devra porter sa **date de péremption
   implicite**, et le web live est ce qui la compense entre deux relectures.

---

## 12. Sources externes (vérifiées le 2026-07-23)

Load-bearing pour le § 2.3 (périmètre séparé) **et** pour le corpus § 2.4 — elles fondent la
comparaison des modèles de rôle/agent des frameworks retenus. **Le lot devra re-vérifier et
horodater chaque source** (A24) : celles-ci en fixent le point de départ.

- BMAD-METHOD — *expansion packs* (dossiers modulaires portant leurs propres agents et tâches) :
  https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/expansion-packs.md
- BMAD-METHOD — architecture et composants (`bmad-orchestrator`, `bmad-master` hors roster de
  livraison) : https://deepwiki.com/bmad-code-org/BMAD-METHOD/1.1-architecture-overview
- MetaGPT — rôles matérialisés en classes, « Code = SOP(Team) » :
  https://github.com/FoundationAgents/MetaGPT
- CrewAI — agent = **role + goal + backstory + tools**, crew/tasks, process hiérarchique :
  https://www.groovyweb.co/blog/crewai-vs-langgraph-vs-autogen-framework-comparison-2026
- AutoGen — **ConversableAgent → GroupChat → messages → termination** ; maintenance / absorption
  par Microsoft Agent Framework : https://agent.nexus/blog/autogen-vs-crewai
- ChatDev — **entreprise virtuelle**, rôles (CEO/CTO/CPO/programmer/designer/tester/reviewer) par
  **phases waterfall**, chat-chain : https://www.ibm.com/think/topics/chatdev

*(BMAD/MetaGPT avaient déjà été vérifiés au § 9 de `vocabulaire-roles-agnostique.md`. CrewAI,
AutoGen et ChatDev sont **neufs à ce cadrage** — ils fondent l'élargissement du corpus demandé par
le décideur.)*

---

## 13. Fichiers de référence

*(Par **nom de section / de symbole**, jamais par `chemin:ligne`.)*

**Dépôt `iakaframe`**
- `library/roles/*.md` — le référentiel, 8 fiches ; `cadrage.md` sert de gabarit de forme
- `library/personas/*.md` + `_TEMPLATE.md` — `roleKey`, `pastille`, palette des pastilles
- `methods/iakaframe.md` — `roleKeys`
- `teams/iakaframe-8.md` — `personas`, `coordinator`, note « niveau portefeuille »
- `bindings/iakaframe-claude-default.md` — `assignments`
- `library/workflows/iakaframe-3phases.md` — `phases[].agentsRoleKeys` (**inchangé**, § 2.2)
- `library/guardrails/perimeter.md` — « garde de CHEMINS, jamais de personas » (§ 2.1)
- `cli/src/lib/library.js` — collection `roles`, `checkRefs` (`needEach('roleKeys', …, 'roles')`),
  `assemble` (`coveredByCoordinator`, `orphans`)
- `cli/src/lib/agents.js` — `ROLE_OF`, `SKILL_OF`, `SKILL_OVERRIDE_OF`, **`PORTFOLIO_PERSONAS`**
  (modèle du marqueur, D-G) et **`fullteam`/`assignedPersonas`** (l'exclusion à généraliser)
- `cli/src/lib/generate-agents.js` — `generateAgent`, `toolsForPersona`, `renderAgentContract`
- `cli/src/lib/vendor.js` — `IDS`, `EXPECTED_COPIES`, `EXPECTED_DERIVED`, `fixtureTable()`
- `cli/src/commands/frame.js` — `frame verify` (**anonymisation seule**, § 5.1 note)
- `cli/test/library.test.js` — les deux assertions de compte (§ 0.5)
- `cli/test/agents.test.js` — `assert.deepEqual(PORTFOLIO_PERSONAS, ['odin'])` : le **patron** du
  test d'activation explicite à reproduire pour Fëanor (A23)
- `library/personas/odin.md` — § Étanchéité : le **modèle narratif** du marqueur « hors dispatch »
- `library/personas/gimli.md` — § Périmètre : à **compléter** de la réciproque de N2 (A27, 6d)
- `library/skills/iakaframe-frame/` — **à créer** : skill-rôle de Fëanor (geste + corpus mondial
  sourcé complet, livrés dans ce lot unique)
- `specs/instructions/place-odin-roster-portefeuille.md` — précédent du marqueur « hors dispatch »
- `docs/commandes.md`, `docs/guide-stefframe2.{md,html}` — comptes publiés
- `frames/releases/StefFrame2/roles/` **et** `frames/releases/StefFrame2/library/roles/`

**Dépôt `iakaFrameGUI`**
- `packages/core/src/roles.ts` — `CANONICAL_ROLES`, `CANONICAL_ROLE_KEYS`, `roleByKey`,
  `roleLabel`, `roleIndexOf`
- `packages/core/src/roster.ts` — `DEFAULT_NAMES`, `DEFAULT_SKILLS`, `CANONICAL_ROSTER`,
  `buildTeamFromRoster`
- `packages/core/src/persona.ts` — `Persona.roleKey` (**scalaire**, § 4.1), `parsePersona`
- `packages/core/src/method.ts` — `IAKAFRAME_CANONICAL_METHOD`, rapport de résolution `roleKeys`
- `packages/core/src/frame.ts` — `POOL_FRAME_TYPES`, `poolAtomId` (jette `label`/`roleIndex`)
- `src/forge/casting.ts` + `casting.test.tsx` — `CASTING_GRADIENTS`, `vignetteGradient`, C20
- `src/components/PersonaEditor.tsx`, `src/forge/ateliers/{Workflow,Methode,Team,Kit}Atelier.tsx`,
  `src/components/{RosterList,LiaisonPanel,WorkflowPanel}.tsx`, `src/forge/llm/prompt.ts`
- `packages/core/__tests__/fixtures/` — les 18 copies + 4 dérivées
- `src/forge/refs.ts`, `src-tauri/src/library_store.rs` — **rien à faire**

**Instructions liées**
- `specs/instructions/vocabulaire-roles-agnostique.md` — le lot qui supprime le compte gravé ;
  **cadré, non exécuté** (§ 0.3, § 9.1)
- `specs/instructions/decision-rolekey-reconciliation.md` — trace de CH-A ; **son § 0 est périmé**
  quant à l'état du cœur GUI (§ 0.2)
- `specs/instructions/audit-amelioration-roster-personas.md` — C1 abrogé, C2/C21/C22/C23 conservés
- `specs/instructions/garde-vendor-check-cross-repo.md` — mécanisme de re-vendorage
