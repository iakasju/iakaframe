# Mode guidé — propositions sélectionnables, sur DEUX surfaces

> Cadrage : 🔵 Gandalf, 2026-09-02/03. **Instruction neuve.** Aucun code écrit à ce stade.
>
> Demande initiale du décideur, mot pour mot : « je veux que les commandes de iakaframe soient
> **guidées dans le CLI** : avec les **propositions sélectionnables** ».
>
> Précision du décideur (intégrée) : « **il faut commencer par "/iaka " comme déclencheur de choix
> guidé** » — et, sur la question « où tapez-vous cela ? », la réponse est **LES DEUX** : dans
> **Claude Code** (menu natif filtré) **et** dans le **terminal** (menu écrit par nous, Node pur).

## Problème

Le CLI porte **38 verbes distincts** et une quarantaine de couples `verbe [sous-verbe]`, dont
beaucoup exigent des valeurs qu'on ne peut pas deviner (`<personaId>`, `<methodId>`, `<teamId>`,
`<frameId>`, `<type>`, `<kind>`, valeur de modèle). Aujourd'hui on les découvre en **lançant une
autre commande** puis en recopiant à la main.

Le besoin porte en réalité sur **deux inventaires distincts**, et c'est ce qui structure tout le
lot :

| | Surface 1 — **Claude Code** | Surface 2 — **Terminal** |
|---|---|---|
| Déclencheur | préfixe `/iaka…` | binaire `iakaframe` |
| Ce qu'on choisit | **quelle commande** lancer | **quelle valeur** passer à un paramètre |
| Qui dessine le menu | **Claude Code, nativement** | **nous**, en Node pur zéro-dép |
| Ce qu'on écrit | des fichiers de commande | un moteur de sélection |

Et une exigence commune, qui est le vrai cœur : **même source de propositions, deux rendus**. Une
liste recopiée d'une surface à l'autre serait exactement la seconde source de vérité que ce dépôt
combat — et cela vaut désormais **aussi pour l'inventaire des commandes lui-même**.

Le piège de fond reste que ce CLI a **trois publics** : un humain au terminal, des scripts/CI, et
des **agents**. Deux d'entre eux ne peuvent **rien** répondre à une question. Un prompt qui s'ouvre
au mauvais moment ne dégrade pas l'expérience : il **fait pendre un job** ou **casse un appelant
machine**.

---

## Mesures préalables

Prises **en lecture** sur l'arbre, 2026-09-02/03.

### M1 — Zéro-dépendance : confirmé, plus strictement qu'annoncé

`cli/package.json` ne porte **ni `dependencies` ni `devDependencies`** — les clés sont **absentes**,
pas vides. C'est ce qui rend le `.tgz` installable partout, et c'est ce que `v0.39.0` publie.
Aucune dépendance de prompt (`inquirer`, `prompts`, `enquirer`, `@clack/prompts`) n'est
envisageable. ✅ **Contrainte confirmée, non négociable.**

### M2 — Le CLI sait DÉJÀ prompter en zéro-dépendance (prior art, à réemployer)

| Où | Module | Forme |
|---|---|---|
| `cli/src/commands/models.js:461` | `node:readline/promises` | questions + **listes numérotées**, récapitulatif, gate `[o/N]` |
| `cli/src/commands/onboard.js:40` | `node:readline` | confirmation `o/N`, défaut = non |

La question « sait-on prompter sans dépendance ? » est **déjà tranchée par le code,
positivement**. Ce lot ne crée pas la capacité : il l'**unifie et l'étend**.

### M3 — Il y a DÉJÀ deux règles de non-interactivité, et elles divergent 🛑

```
cli/src/commands/models.js:1019    if (!process.stdin.isTTY) { ... état des lieux seul ... }
cli/src/commands/onboard.js:105    const interactive = Boolean(process.stdout.isTTY)
                                     && !process.env.CI && !process.env.IAKA_NON_INTERACTIF;
```

Deux définitions de « suis-je interactif ? » : l'un regarde **stdin**, l'autre **stdout + `CI` + une
variable d'échappement**. `models` **ne regarde pas `CI`** : sur un runner qui alloue un
pseudo-terminal, il prompterait. C'est le défaut que ce dépôt combat, appliqué à la garde la plus
critique du lot.

### M4 — « Un verbe nu affiche l'aide » : ❌ REFUTÉ par la mesure

`cli/src/index.js:194` ne rend l'aide que si `argv` est **vide**. Un verbe nu est dispatché à sa
commande. Trois comportements coexistent :

| Classe | Verbe nu | Exemples mesurés |
|---|---|---|
| **A — sortie utile** | produit un résultat légitime | `list` (`list.js:45`), `portfolio`, `services`, `canaux`, `open`, `close`, `endpoints`, `snapshot`, `jalon`, `frame` (défaut `verify`, `frame.js:81`) |
| **B — erreur d'usage** | `fail(...)` → usage + **exit 1** | `show` (`show.js:33`), `add` (`add.js:44`), `assemble`, `switch/use`, `remove`, `attach`/`detach`, `banner`, `memory`, `produit`, `review`, `range` |
| **C — déjà interactif** | ouvre un dialogue | `models` (`models.js:1023`) |

⚠️ Le verbe nu **n'est pas un emplacement libre**. L'ouvrir sur la classe A casserait une commande
qui marche (`iakaframe list` en pipe, en script, en doc).

### M5 — Le périmètre « toutes les commandes » est mal découpé

Mesuré : **39 `case` dans `index.js`** (dont `use`, alias de `switch`) = **38 verbes distincts**,
**36 fichiers** dans `cli/src/commands/`. L'unité réelle n'est pas le verbe mais le couple
`verbe [sous-verbe]` : `memory` et `produit` portent **7 actions** chacun, `review` **5**, `agents`
**4**, `frame` **4**, `models` **3**, `add` **12 `kind`**. Le « 43 » de l'aide compte des lignes
d'aide.

Surtout : **beaucoup de cibles n'ont rien à proposer.** `banner <texte>`, `snapshot --note`,
`observe "note"`, `recall <requête>` prennent du **texte libre**. Le guidage **de valeur** n'a de
sens que là où le paramètre a un vocabulaire fermé. *(Le guidage **de commande** — surface 1 —
concerne en revanche bien les 38 verbes : choisir `banner` reste utile même si son argument est
libre.)*

### M6 — Les échappatoires non-interactives existent déjà

`IAKA_NON_INTERACTIF` (`onboard.js:105`, gravée dans
`specs/instructions/correctif-bascule-update-onboard-drapeaux.md:314`) · `--yes` (`remove.js`) ·
`--force` (`models set`). **À réemployer tels quels** : en inventer d'autres recréerait M3.

### M7 — Les autorités de VALEURS sont déjà exportées

| Ce qu'on propose | Autorité (source unique) | Symbole |
|---|---|---|
| personas de la team active | `cli/src/lib/generate-agents.js` | `personasForTarget({ root, project })` |
| valeurs de modèle | `cli/src/lib/project-models.js:137` | `ACCEPTED_VOCABULARY` + `validateModelValue()` |
| types de collection | `cli/src/lib/library.js` | `COLLECTION_TYPES`, `collectionOf()` |
| ids d'atomes/assemblages | `cli/src/lib/library.js` | `scan(type, root)` |
| `kind` de `add` | `add.js:14`, `cli/src/lib/scaffold.js:102` | `ASSEMBLY_KINDS`, `POOL_KINDS` |
| runners / nœuds | `cli/src/lib/vocab.js:21-23` | `HOST_KINDS`, `RUNNER_KINDS`, `NODE_KINDS` |
| cibles de mise à disposition | `cli/src/commands/models.js:54` | `TARGETS` |
| projets du chapeau | `cli/src/lib/portfolio.js` | scan du chapeau (`resolveRoot`) |

`models set` refuse déjà une persona hors team en la nommant (`models.js:818-821`) et une valeur
hors vocabulaire (`models.js:834-842`).

### M8 — Ce que Node offre nativement (vérifié sur la doc)

| Capacité | Faisable zéro-dép ? | Fait |
|---|---|---|
| Question / réponse ligne | ✅ **déjà fait 2×** | `node:readline/promises` |
| Liste numérotée | ✅ **déjà fait** | `models.js:487-512` |
| **Flèches** | ✅ oui | `readline.emitKeypressEvents(stream)` : « causes the given Readable stream to begin emitting `'keypress'` events » |
| **Surbrillance** | ✅ oui | séquences ANSI écrites à la main — aucun `chalk` |
| **Filtre à la frappe** | ✅ oui | même flux `keypress`, re-render par touche |
| Restauration du terminal | ⚠️ à la charge du code | `setRawMode(false)` en `finally` |
| **Ctrl-C en mode flèches** | 🛑 **piège dur** | doc `tty` : « **Ctrl+C will no longer cause a `SIGINT` when in this mode** » |

**Rien de ce qui est demandé n'est infaisable sans dépendance.** Mais le mode brut a un coût nommé :
Ctrl-C n'émet plus SIGINT, c'est au code d'intercepter `` **et** de rétablir le mode ; sinon un
plantage laisse le terminal muet, sans écho. La doc `tty` désigne par ailleurs `process.stdout.isTTY`
comme « the preferred method of determining whether Node.js is being run within a TTY context » —
ce qui donne raison à `onboard` contre `models` (M3). Enfin : **Node n'embarque pas de pty**, et
`node-pty` est une dépendance native → **le mode flèches n'est pas testable de bout en bout**
(traité par la couture d'injection, § Preuve).

### M9 — 🛑 `/iaka` est DÉJÀ PRIS, et **verrouillé par un test**

C'est la mesure la plus importante de cet amendement.

- `~/.claude/commands/iaka.md` et `kits/iakaframe-claude/.claude/commands/iaka.md` **existent**.
- `/iaka` est l'**alias de `/learning`** : il pilote `iakaframe review` (list/show/apply/reject),
  c'est-à-dire la **boucle de consentement** du réservoir d'apprentissage.
- Ce n'est pas une convention molle : `cli/test/learning-skill.test.js:54-60` **assert** que
  `kits/iakaframe-claude/.claude/commands/iaka.md` cite `iakaframe review list`, `review apply` et
  `review reject`. Le test `:29-33` assert en outre que la description de la skill
  `iakaframe-learning` **déclenche sur `/learning` ET `/iaka`**.

⚠️ **Conséquence : réaffecter `/iaka` au choix guidé ferait rougir un test existant et
détournerait le déclencheur de la garde de consentement.** C'est exactement la collision que le
dépôt a déjà payée avec `iakapage` (ex-`iakastart`). Elle est ici **prouvée, pas supposée**.

Précision de lecture, qui compte : dans Claude Code, `/iaka ` **avec l'espace final** ne filtre
pas — c'est l'**invocation** de la commande `iaka`, donc de la revue d'apprentissage, avec
arguments. C'est `/iaka` **sans espace** qui filtre le menu.

### M10 — Le menu natif filtré EXISTE DÉJÀ ; ce qui manque, c'est la COUVERTURE

Mesuré dans `~/.claude/commands/` : **11 fichiers** `iaka*.md` (`iaka`, `iaka-brief`, `iaka-cadre`,
`iaka-deploie`, `iaka-etat`, `iaka-help`, `iaka-list`, `iaka-qualite`, `iaka-recap`,
`iaka-services`, `iaka-update`), plus la skill `iakastart`. Taper `/iaka` dans Claude Code **filtre
déjà nativement ces ~12 entrées**, avec leur `description`.

⚠️ **Le mécanisme demandé sur la surface 1 est donc déjà là — il est produit par la convention de
nommage elle-même.** Ce qui manque n'est pas un menu, c'est que **10 verbes sur 38** seulement ont
une commande. Le travail de la surface 1 n'est pas « construire un sélecteur » mais « **décider
quels verbes méritent une entrée, et les produire depuis l'autorité plutôt que les écrire à la
main** ».

Et le pattern « la commande appelle le CLI » est **déjà éprouvé** : `iaka-list.md` dit *« Exécute
`iakaframe list $ARGUMENTS` et restitue la sortie VERBATIM »*. `iaka-help.md` va plus loin — il
interdit déjà d'énumérer de mémoire : *« N'énumère RIEN de mémoire — à chaque appel, interroge les
sources autoritatives »*, à savoir `.claude/commands/*.md`, `iakaframe --help`, `iakaframe list
skills`. **La doctrine visée est déjà écrite dans le dépôt ; elle manque juste d'un support
machine.** → M11.

### M11 — 🛑 Le chaînon manquant : il n'existe AUCUN inventaire lisible par machine

`iakaframe --help` est une **constante de prose écrite à la main** (`cli/src/index.js:51-189`), et
`--help` **n'a pas de `--json`**. Conséquence directe : les deux surfaces ne **peuvent pas**
aujourd'hui partager une source — chacune doit ré-énumérer, l'une en parsant de la prose (fragile),
l'autre à la main (dérive garantie).

C'est le **pivot du lot** : sans inventaire machine, « même source, deux rendus » est un vœu. Et le
dépôt connaît déjà ce raisonnement, écrit **dans le fichier même** (`index.js:46-49`) : *« Même
principe pour le compte de fixtures : dérivé du manifeste de vendorage, jamais recopié. L'aide
avait figé "21 fixtures (17 copies)" alors que la garde en vérifiait 82 — **un nombre dupliqué à la
main finit toujours par mentir**. »* Un **inventaire** dupliqué à la main ment de la même façon.

Note de déploiement : les commandes existent en **trois exemplaires** — `~/.claude/commands/`
(déployé), `kits/iakaframe-claude/.claude/commands/` (source), `cli/_bundled/kits/…` (généré par
`cli/scripts/bundle.js`). Toute génération doit viser **le kit**, le bundle suit.

---

## Ce que je conteste dans la demande (obligation de le dire)

1. **Le déclencheur littéral `/iaka ` n'est pas disponible** (M9) — et le prendre casserait la
   boucle de consentement. Un **nom voisin** est nécessaire. Ce n'est pas un détail cosmétique :
   c'est la seule partie de la demande que la mesure **contredit frontalement**.
2. **Sur la surface 1, l'essentiel du mécanisme est déjà acquis** (M10). Facturer un « menu
   sélectionnable pour Claude Code » serait facturer ce que Claude Code fait nativement. Le vrai
   travail y est la **couverture** et la **non-duplication**.
3. **« Toutes les commandes » reste le mauvais périmètre pour le guidage de VALEUR** (M5), même
   s'il devient le bon pour le guidage de COMMANDE (surface 1). Les deux surfaces n'ont pas le
   même périmètre naturel — les confondre est le risque n°1 de ce lot.
4. **Les verbes destructifs ou réseau ne doivent pas être guidés en premier** : `onboard`,
   `update`, `range`, `repo --create`, `remove --cascade`. Un sélecteur y transforme une faute de
   frappe (qui échouait) en **sélection valide d'une mauvaise cible** (qui réussit).

---

## Arbitrages — Gandalf propose, le décideur tranche

> ### ✅ TRANCHÉS PAR LE DÉCIDEUR — 2026-09-03
>
> **Énoncé : « 0+B d'abord, lance Gimli ».** Le phasage est décidé ; les arbitrages qui **bloquent**
> les lots 0 et B sont tranchés **sur la recommandation de cadrage**, sans réserve.
>
> | # | Décision | Portée |
> |---|---|---|
> | **A8** | **LOT 0 puis LOT B** — la surface Claude Code d'abord (~2 j-h). **Le LOT A (terminal) n'est PAS lancé.** | phasage |
> | **A9** | **UNE instruction, trois lots gatés séparément** — la scission est réfutée : les surfaces partagent un **artefact** (le registre), deux instructions le décriraient deux fois | forme |
> | **A6** 🔑 | **`/iaka-guide`, et `/iaka` LAISSÉ INTACT.** Réaffecter `/iaka` ferait rougir `learning-skill.test.js:54-60` et **détournerait la garde de consentement du réservoir** | lot B |
> | **A7** | **La commande Claude Code DÉLÈGUE au CLI — aiguilleur, jamais backend.** Doubler la logique créerait deux inventaires, le défaut même que ce lot combat | lot B |
> | **A3** | **OUI, obligatoire et non désactivable, sur les DEUX surfaces** : le guidage imprime la commande non interactive équivalente | les deux |
> | **A5** | **Critère = « le paramètre a-t-il une autorité énumérable en place ? »** — et non « les plus utilisées » (non mesuré, donc invérifiable) | sélection |
>
> **RESTENT OUVERTS, et c'est volontaire — ils ne concernent que le LOT A (terminal), non lancé :**
> **A1** (ampleur / paliers du mode brut), **A2** (déclenchement terminal), **A4** (traitement du
> refus en mode guidé). ⚠️ **L'exécution ne les tranche pas** : si un geste des lots 0 ou B en
> dépend, **elle s'arrête et remonte.**
>
> ⚠️ **CE QUE LA MESURE A RETIRÉ DU LOT, et qui vaut d'être relu** : le menu sélectionnable demandé
> côté Claude Code **existe déjà** — taper `/iaka` filtre nativement les 11 commandes `iaka*`
> déployées, avec leurs descriptions. **Ce qui manque n'est pas un sélecteur, c'est la COUVERTURE**
> (10 verbes sur 38). Le lot ne construit donc pas un menu : **il remplit celui que Claude Code
> dessine**, depuis une source unique.

> *(Rédaction d'origine, conservée : « Aucune de ces décisions n'est prise. »)*

### A1 — Ampleur du guidage de valeur (terminal)

Le décideur a **explicitement demandé** « flèches, surbrillance, filtre à la frappe ». Le mode brut
passe donc de « plus tard » à **dans le périmètre**. Je maintiens néanmoins un jalon interne :

| Palier | Contenu | Coût | Risque |
|---|---|---|---|
| **0 — refus loquaces** | aucun prompt ; chaque `fail()` sur vocabulaire fermé **liste les valeurs dérivées** | ~0,5 j-h | quasi nul |
| **1 — listes numérotées** | moteur réemployant le pattern `models` (M2) | ~1 j-h | modéré |
| **2 — flèches + surbrillance + filtre** | mode brut sur la **même couture** que 1 | +1,5 à 2,5 j-h | **élevé** (Ctrl-C, restauration, Windows, non testable sans pty) |

**Recommandé : livrer 0 et 1 comme jalon interne, puis 2 dans le même lot**, le palier 1 restant le
**repli automatique** quand le mode brut n'est pas disponible (terminal exotique, Windows ancien).
Motif : le palier 1 est un chemin **déjà éprouvé deux fois en production ici**, et il devient le
filet du palier 2 au lieu d'être un travail jeté.

### A2 — Déclenchement côté **terminal** (la question reste entière ici)

| Option | Verdict |
|---|---|
| verbe nu ouvre le guidage | ❌ **à écarter** : casse la classe A (M4) |
| **drapeau explicite `--guide`** | ✅ **recommandé** — opt-in, invisible des appelants existants, aucun déclenchement accidentel |
| alias court `-i` | ⚠️ déconseillé : ce CLI n'a que `-v`/`-h` en formes courtes |
| **`iakaframe` nu (sans aucun verbe)** ouvre le menu des commandes | 🟠 **défendable et cohérent avec la surface 1** — c'est aujourd'hui l'aide (`index.js:194`). **Recommandé : NON en lot 1** (des scripts et des docs affichent l'aide ainsi), à rouvrir après mesure des appelants. |
| verbe nu de **classe B** seulement | 🟠 changerait un `exit 1` en `exit 0` → casse un script qui teste le code retour. **Non.** |

### A3 — Le guidage imprime-t-il la commande équivalente ?

**Recommandé : OUI, obligatoire, non désactivable**, sur **les deux surfaces** :

```
  → iakaframe models set gandalf opus[1m] --path /Users/sjupin/work/iakaframe
```

Motif : c'est ce qui empêche le guidage de **remplacer** l'apprentissage du CLI par une dépendance
au menu — l'utilisateur repart avec une commande réutilisable et transmissible à un agent. C'est
aussi le **meilleur témoin de test** : une sortie déterministe et rejouable (§ Preuve).

### A4 — Face à un refus (`models set` hors grammaire)

**Recommandé** — trois règles à graver :

1. Le guidage propose **d'abord** les valeurs de l'autorité, **et** une entrée « saisir une valeur
   libre ».
2. En valeur libre, il **assemble l'argv et appelle le chemin normal** : c'est `validateModelValue()`
   qui tranche, jamais le moteur.
3. Si la commande **refuse**, le guidage **affiche le refus tel quel** et s'arrête. Il **peut**
   afficher la commande `--force` équivalente **en texte** ; il ne l'exécute jamais et ne la
   propose jamais comme une entrée de menu. 🛑 **`--force`, `--yes`, `--cascade`,
   `--autoriser-creation-depot` ne sont JAMAIS ajoutés par le guidage.**

### A5 — Critère de sélection des cibles guidées (valeur)

**Recommandé** : « **le paramètre a-t-il une autorité énumérable en place ?** » (M7) — et non « les
plus utilisées » (non mesuré, donc invérifiable) ni « les plus paramétrées » (qui désignerait
`onboard`, précisément le verbe à ne pas guider).

### A6 — 🔑 Nom du déclencheur côté Claude Code (arbitrage **rendu obligatoire** par M9)

| Option | Verdict |
|---|---|
| **`/iaka` réaffecté** au choix guidé | ❌ **à écarter** : fait rougir `learning-skill.test.js:54-60` et détourne le déclencheur de la garde de consentement |
| Renommer l'alias d'apprentissage pour libérer `/iaka` | ❌ le dépôt a déjà payé ce prix (`iakapage`) ; casse un alias documenté et testé |
| **Ne rien créer** : `/iaka` (sans espace) filtre déjà nativement les ~12 entrées (M10) | 🟠 **honnête et gratuit**, mais ne couvre que 10 verbes sur 38 et ne règle pas la dérive |
| **`/iaka-guide`** — commande neuve, zéro collision | ✅ **recommandé** : apparaît dans le filtre `/iaka`, se nomme par son geste, ne touche à rien d'existant |

**Recommandé : `/iaka-guide`, `/iaka` laissé intact.** Le décideur obtient bien son geste — il tape
`/iaka`, voit la liste filtrée (native), et y trouve `/iaka-guide` s'il veut le parcours assisté.

### A7 — La commande Claude Code délègue-t-elle au CLI ?

**Recommandé : OUI — la skill est un aiguilleur, jamais un backend.** Je rejoins la recommandation
du coordinateur, et la mesure la renforce : c'est le pattern **déjà en place** (`iaka-list.md`
exécute `iakaframe list` et restitue verbatim ; `iaka-help.md` s'interdit d'énumérer de mémoire).
Doubler la logique créerait deux inventaires — le défaut même que ce lot combat.

### A8 — Phasage : quelle surface d'abord ?

**Recommandé : Lot 0 (le pivot) → Lot B (Claude Code) → Lot A (terminal).**

Motif : (a) **Lot 0 est un pré-requis des deux** — sans inventaire machine, les deux surfaces
divergent dès le premier jour (M11) ; (b) **Lot B rend service le plus vite pour le moins cher** :
le menu est natif, il ne reste qu'à générer des entrées depuis l'inventaire ; (c) **Lot A porte
tout le risque technique** (mode brut, Ctrl-C, Windows, pty). Livrer B avant A donne un bénéfice
mesurable pendant que A se construit.

### A9 — Une instruction ou deux ?

**Recommandé : UNE seule instruction, trois lots à gates indépendants.** Le coordinateur m'invite à
scinder ; je le **réfute**, et voici pourquoi : ce qui unit les deux surfaces n'est pas un thème,
c'est un **artefact partagé** — l'inventaire machine du Lot 0. Deux instructions séparées auraient
chacune besoin de le décrire, donc le décriraient deux fois : **on reproduirait au niveau des specs
la duplication qu'on corrige au niveau du code.** Les lots restent **livrables et gatés
séparément** — le décideur peut n'en prendre qu'un.

---

## Décision retenue

> **⏸️ EN ATTENTE D'ARBITRAGE.** Ce qui suit décrit l'implémentation **sous réserve** de
> A1=0+1+2, A2=`--guide`, A3=oui, A4=les 3 règles, A5=autorité énumérable, A6=`/iaka-guide`,
> A7=délégation, A8=0→B→A, A9=une instruction. Tout arbitrage contraire impose de reprendre le
> § Périmètre **avant** tout code.

Sous cette réserve : **un inventaire des commandes lisible par machine** comme source unique, dont
**dérivent** l'aide humaine, le menu du terminal et les commandes Claude Code ; **un module unique
de règle d'interactivité** ; **un moteur de sélection zéro-dépendance**.

---

## Périmètre

### LOT 0 — Le pivot : inventaire machine (pré-requis des deux surfaces)

**Inclus**
- `cli/src/lib/verbes.js` — **neuf, source unique** : registre déclaratif des verbes et
  sous-verbes (`id`, `resume`, `sousVerbes`, `options`, et pour chaque paramètre son
  **autorité** — nom du symbole de M7, jamais des valeurs).
- `iakaframe commands --json` — verbe neuf, **lecture seule**, rendant l'inventaire sous
  l'enveloppe C-JSON existante (`collection('commands', …)`, `cli/src/lib/output.js`).
- `cli/src/index.js` — la constante `HELP` (`:51-189`) est **dérivée du registre**, plus écrite à
  la main, conformément à la doctrine déjà inscrite au même endroit (`:46-49`).

**Exclu** — toute modification de `lib/output.js` ou du contrat `--json`.

### LOT A — Surface terminal : guidage de valeur

**Inclus — noyau**
- `cli/src/lib/interactif.js` — **source unique** de la règle. `peutDemander({ json, guide })`
  rend `true` **si et seulement si** : `process.stdin.isTTY` **ET** `process.stdout.isTTY` **ET**
  `CI` absent/neutre **ET** `IAKA_NON_INTERACTIF` absent/neutre **ET** `json !== true` **ET**
  `guide === true`. *(« absent/neutre » = non défini, vide, `0` ou `false` — à graver : certains
  runners exportent `CI=false`.)*
- `cli/src/lib/guidage.js` — moteur de sélection. Rend un **plan** `{ argv, ligne }`, n'exécute
  rien. `ask`/`yes` **injectés**, sur le modèle déjà éprouvé de `models.js:521`. Deux rendus : liste
  numérotée (palier 1) et mode brut flèches/surbrillance/filtre (palier 2), **derrière la même
  interface**, avec **repli automatique** sur le palier 1.
- **Conversion des deux appelants existants** (M3) : `models.js:1019` et `onboard.js:105` appellent
  `peutDemander()`. Comportement observable de chacun **inchangé**.

**Inclus — cibles guidées** (A5 ; symétrie `+`/`−` par construction)

| Cible | Ce qui est proposé | Autorité | Symétrie |
|---|---|---|---|
| `models set --guide` | persona, puis valeur | `personasForTarget`, `ACCEPTED_VOCABULARY` | ↔ `models unset` |
| `models unset --guide` | surcharges **posées** | `readModelOverrides` | le `−` |
| `show --guide` | collection, puis id | `COLLECTION_TYPES`, `scan()` | lecture seule |
| `list --guide` | collection | `COLLECTION_TYPES` | lecture seule |
| `add --guide` | `kind`, puis id/fichier | `ASSEMBLY_KINDS`, `POOL_KINDS` | ↔ `remove` |
| `remove --guide` | `kind`, puis id **existant** | `scan()` | le `−` (jamais `--cascade`) |
| `attach --guide` | skill, puis persona | `scan('skills')`, `scan('personas')` | ↔ `detach` |
| `detach --guide` | skills **attachés** | frontmatter du persona | le `−` |
| `frame use --guide` | frames | `scan('frames')` | `""` retire déjà la clé |
| `switch`/`use --guide` | méthode, puis team | `scan('methods')`, `scan('teams')` | ↔ `--rollback` |

### LOT B — Surface Claude Code : guidage de commande

**Inclus**
- `kits/iakaframe-claude/.claude/commands/iaka-guide.md` — **neuf** (A6). Aiguilleur (A7) :
  interroge `iakaframe commands --json`, propose, puis **exécute la commande retenue via le CLI** et
  restitue **verbatim** — sur le modèle de `iaka-list.md`. **N'énumère rien de mémoire.**
- **Génération** des entrées `iaka-*.md` manquantes **depuis le registre** (Lot 0), dans
  `kits/iakaframe-claude/.claude/commands/`. Chaque entrée porte une `description` **dérivée** du
  `resume` du registre. Le bundle (`cli/scripts/bundle.js`) suit mécaniquement.
- `docs/commandes.md` — mise à jour dans le **même lot** (convention établie, mémoire
  `iakaframe-doc-commandes-a-jour`).

**Exclu, explicitement — ce qui n'est pas ici n'est pas à faire**
- 🛑 **Toute dépendance npm.** `dependencies` et `devDependencies` restent **absentes**.
- 🛑 **Toute réaffectation de `/iaka`**, et toute modification de `iaka.md`, de la skill
  `iakaframe-learning` ou de `learning-skill.test.js` (M9).
- 🛑 **Toute modification du comportement d'un verbe nu**, y compris `iakaframe` nu (M4, A2).
- 🛑 **Guidage de `onboard`, `update`, `range`, `repo`, `go`, `services`, `canaux`, `endpoints`,
  `snapshot`** (destructifs, réseau, ou texte libre).
- 🛑 **Ajout de `--force`/`--yes`/`--cascade` par le guidage** (A4.3).
- 🛑 **Toute liste de valeurs OU de commandes écrite en dur** dans `guidage.js` ou dans
  `iaka-guide.md` (gardes G3/G5).
- 🛑 **Écriture directe dans `~/.claude/commands/`** : on écrit le **kit**, le déploiement est un
  geste existant.
- 🛑 **Commit / push.** D'autres sessions travaillent dans ce dépôt.

---

## Étapes d'implémentation

**Lot 0**
1. `lib/verbes.js` : registre des 38 verbes + sous-verbes, chaque paramètre pointant son **autorité**.
2. `iakaframe commands --json` (C-JSON, lecture seule) + son `--help`.
3. Dériver `HELP` du registre ; vérifier que `iakaframe --help` reste lisible et **non régressif**.

**Lot A**
4. `lib/interactif.js` + tests unitaires (les 6 conditions, une par une — G4).
5. Convertir `models.js:1019` et `onboard.js:105` ; vérifier la non-régression (CA-2).
6. Palier 0 : refus loquaces sur les 10 cibles (aucun prompt introduit).
7. `lib/guidage.js` palier 1 (listes numérotées), `ask`/`yes` injectés.
8. `lib/guidage.js` palier 2 (flèches/surbrillance/filtre) **derrière la même interface**, avec
   `setRawMode(false)` en `finally`, interception de `` et **repli** sur le palier 1.
9. Câblage `--guide` sur les 10 cibles + **écho A3** + exécution par le **chemin normal**.

**Lot B**
10. `iaka-guide.md` (aiguilleur, consomme `commands --json`).
11. Génération des `iaka-*.md` manquantes depuis le registre.
12. `docs/commandes.md`, `HELP`, `USAGE` des cibles.

**Transverse** — gardes G1→G6 (§ Preuve).

---

## Fichiers concernés

- `cli/src/lib/verbes.js` — **neuf** : registre, source unique de l'inventaire.
- `cli/src/commands/commands.js` — **neuf** : verbe `commands`.
- `cli/src/lib/interactif.js` — **neuf** : règle unique de non-interactivité.
- `cli/src/lib/guidage.js` — **neuf** : moteur de sélection (paliers 1 et 2).
- `cli/src/index.js` — `HELP` dérivé du registre ; `case 'commands'` ; `--guide` documenté.
- `cli/src/commands/models.js` — `--guide` sur `set`/`unset` ; `:1019` → `peutDemander()`.
- `cli/src/commands/onboard.js` — `:105` → `peutDemander()` (comportement inchangé).
- `cli/src/commands/{show,list,add,remove,attach,frame,switch}.js` — `--guide` + refus loquaces.
- `kits/iakaframe-claude/.claude/commands/iaka-guide.md` — **neuf**, + entrées générées.
- `cli/test/guidage-non-interactif.test.js` — **neuf** (G1/G2).
- `cli/test/guard-guidage-autorite.test.js` — **neuf** (G3/G5/G6).
- `cli/test/interactif.test.js` — **neuf** (G4).
- `docs/commandes.md` — `--guide`, `commands`, `/iaka-guide`, règle de non-interactivité.

---

## Preuve — comment chaque critère se mesure

> ⚠️ **Le piège nommé par le décideur : un test d'interactivité est notoirement facile à écrire
> vide.** « En non-TTY, aucun prompt » est **satisfait par un CLI où rien n'est branché** : vert le
> jour de la livraison, vert pour toujours, il ne peut pas rougir — donc il ne prouve rien. Parade :
> **six gardes, dont deux contrôles positifs.**

### G1 — Contrôle NÉGATIF : en non-TTY, rien ne change

`spawnSync` (stdin = pipe ⇒ `isTTY` faux), idiome déjà en place
(`cli/test/guard-json-output.test.js:23`). Pour chacune des 10 cibles, **deux exécutions de la
session courante** comparées : avec `--guide` et sans.

**Mesure** : `stdout` **octet pour octet identique**, `stderr` identique, `status` identique.
🛑 **Comparaison contre l'exécution de référence, jamais contre une chaîne écrite dans le test** —
une chaîne figée se périme et devient un mensonge ; deux exécutions comparées entre elles restent
vraies quand la sortie évolue. Variantes exercées **une par une** : `--json`, `CI=1`,
`IAKA_NON_INTERACTIF=1`.

### G2 — Contrôle POSITIF : le guidage existe et produit quelque chose 🔑

**C'est la garde qui empêche G1 d'être un témoin vide.** Sans pty (M8), on teste le moteur par sa
**couture d'injection**, exactement comme le dépôt le fait déjà pour `pickAndAct` (`models.js:519-521` :
*« `ask`/`yes` sont INJECTÉS […] ce qui la rend jouable dans un test en lui passant des réponses
scriptées »*).

**Mesure**, pour chaque cible :
1. la liste proposée **est exactement** celle rendue par l'autorité — comparée à l'appel de
   `scan()`/`personasForTarget()` **fait dans le test**, jamais à une liste écrite dans le test ;
2. le plan rendu porte la **ligne équivalente A3** attendue ;
3. l'argv assemblé, **rejoué en non interactif** via `spawnSync`, produit **le même effet** que la
   sélection — ce qui prouve l'absence de second chemin d'écriture.

**Ce que G2 fait rougir** : `--guide` non branché, moteur muet, liste divergente de l'autorité,
écho A3 absent ou faux.

### G3 — Verrou statique « pas de seconde source de vérité » (valeurs)

Sur le modèle **déjà en place** de `guard-json-output.test.js:30` (interdiction textuelle d'un motif
dans `commands/`) :
- **G3a** : `lib/guidage.js` et les fournisseurs ne contiennent **aucun littéral de valeur métier**
  (aucun tableau de personas, modèles, collections, `kind`). Rougit dès qu'on recopie une liste.
- **G3b** : `readline` n'est importé, et `process.stdin` n'est lu, **que** dans `lib/interactif.js`
  et `lib/guidage.js`. Rougit dès qu'une commande re-crée son prompt — c'est-à-dire dès qu'on
  **recommence M3**.

### G4 — Garde de mutation : la règle peut rougir condition par condition

Test unitaire sur `peutDemander()` : **six cas ne faisant basculer qu'UNE condition** (`stdin.isTTY`,
`stdout.isTTY`, `CI`, `IAKA_NON_INTERACTIF`, `json`, `guide`), chacun devant rendre `false` — **plus**
un cas nominal rendant `true`.

**Mesure de la garde elle-même** : si l'on supprime `&& !process.env.CI`, **un et un seul** cas
rougit, **et il nomme la condition perdue**. C'est ce qui distingue une garde d'un témoin : elle est
construite pour avoir un **mode d'échec identifiable**.

### G5 — Verrou « une seule source d'inventaire » (commandes) 🔑 *(contrôle positif n°2)*

- **G5a** : pour **chaque** `case` de `index.js`, le registre `lib/verbes.js` porte une entrée — et
  réciproquement. *Mesure* : le test **lit `index.js`**, en extrait les `case`, et compare à
  `commands --json`. Rougit si un verbe est ajouté sans entrée, **ou** si le registre décrit un
  verbe mort.
- **G5b** : `iakaframe --help` est **dérivé** du registre. *Mesure* : chaque `id` du registre
  apparaît dans la sortie de `--help` ; le test **échoue si `HELP` redevient une constante
  littérale** contenant une liste de verbes.
- **G5c** : chaque fichier `kits/iakaframe-claude/.claude/commands/iaka-*.md` correspond à une
  entrée du registre (ou est explicitement déclaré hors couverture avec son motif), et sa
  `description` **dérive** du `resume`. Rougit sur la dérive kit ↔ CLI.

### G6 — Non-régression du déclencheur d'apprentissage (garde anti-collision M9)

*Mesure* : `cli/test/learning-skill.test.js` passe **inchangé** ; `iaka.md` (kit et déployé) est
**identique** avant/après le lot ; aucun fichier neuf ne s'appelle `iaka.md`. Rougit si quelqu'un
« libère » `/iaka` en cours de route.

---

## Risques

| # | Risque | Mitigation |
|---|---|---|
| R1 | 🛑 **Un prompt s'ouvre en CI/agent** → job pendu | Règle unique `peutDemander()` (M3 résolu), `--guide` **opt-in** (A2), G1 + G4. Le défaut est le non-guidé : ne rien faire, c'est ne pas prompter. |
| R2 | 🛑 **`--json` cassé** par un prompt sur stdout | `json === true` est l'une des six conditions de refus ; G1 exerce `--json` sur les 10 cibles ; `lib/output.js` non touché ; `guard-json-output` reste en place. |
| R3 | **Témoin vide** : G1 vert alors que rien n'est branché | **G2 et G5** (contrôles positifs) — leur seule raison d'être. G1 seul est explicitement insuffisant. |
| R4 | **Régression des 2 appelants convertis** | CA-2, avec comparaison à l'exécution de référence. `onboard` a une instruction gravée (`correctif-bascule-update-onboard-drapeaux.md:314`) qui **fait foi**. |
| R5 | Le guidage **décide à la place** de l'utilisateur | A4 : aucun `--force`/`--yes`/`--cascade` ajouté ; refus **affiché**, jamais sauté ; valeur libre toujours offerte. |
| R6 | Liste **divergente** de l'autorité (2ᵉ source, valeurs) | G3a + G2.1. |
| R7 | **Autorité vide** (pas de team active, biblio absente) → menu vide | Le guidage **le dit** et rend la main **sans repli** en dur. Cas couvert par G2. |
| R8 | 🛑 **Terminal laissé en mode brut** ; Ctrl-C n'émet plus SIGINT (M8) | `setRawMode(false)` en `finally`, interception explicite de ``, **repli palier 1**. ⚠️ **C'est le risque le plus élevé du lot** et il n'est **pas entièrement couvrable par un test automatique** (pas de pty) → **recette manuelle au gate humain**, cf. CA-13. |
| R9 | **Windows** : TTY différent (CLI multi-OS) | Palier 1 déjà éprouvé cross-OS (M2) et servant de repli. Le risque est **concentré sur le palier 2** → recette manuelle sur les deux OS. |
| R10 | 🛑 **Collision `/iaka`** — casser la boucle de consentement | A6 (`/iaka-guide`) + **G6**. Collision **prouvée** par `learning-skill.test.js:54-60`, pas supposée. |
| R11 | **Dérive kit ↔ déployé ↔ bundle** (3 copies, M11) | On écrit **le kit** ; le bundle est généré ; **G5c** verrouille la correspondance registre ↔ kit. |
| R12 | Le **registre** (Lot 0) devient lui-même une copie manuelle de `index.js` | **G5a** est bidirectionnel : il lit `index.js` et le registre, et rougit dans les deux sens. |
| R13 | **Vérificateur `registre:repli-latest` en D-3** — cette instruction ajoute des lignes portant le motif | ⚠️ **Attendu et correct** : D-3 rougit quand un fichier **neuf** entre dans le vocabulaire. **Tri manuel au lot suivant, JAMAIS un `--ecrire`** (« une ligne neuve du motif se trie à la main », `cli/package.json:24`). |

---

## Critères d'acceptation

- [ ] **CA-1 — Zéro-dépendance intacte.** *Mesure* : test asserant l'**absence** des clés
      `dependencies` **et** `devDependencies` dans `cli/package.json` (pas leur vacuité) ;
      `npm pack --dry-run` liste les mêmes fichiers qu'avant le lot.
- [ ] **CA-2 — Non-régression des deux appelants convertis.** *Mesure* : `models --json`, `models`
      en pipe, et le refus de bascule `onboard --from-update` en non-interactif produisent **la même
      sortie et le même exit** qu'avant conversion (comparaison à l'exécution de référence).
- [ ] **CA-3 — Invariant de non-interactivité.** 10 cibles × 4 variantes (non-TTY, `--json`, `CI=1`,
      `IAKA_NON_INTERACTIF=1`) : `--guide` **ne change rien**. *Mesure* : **G1**, octet pour octet.
- [ ] **CA-4 — Le guidage de valeur existe et fonctionne.** *Mesure* : **G2**.
- [ ] **CA-5 — Aucune seconde source de vérité (valeurs).** *Mesure* : **G3a** + **G3b**.
- [ ] **CA-6 — La garde peut rougir.** *Mesure* : **G4** — 6 cas à une condition + le nominal ;
      retirer une condition fait rougir **exactement un** cas.
- [ ] **CA-7 — Le refus est présenté, jamais sauté.** *Mesure* : en guidage scripté, une valeur hors
      grammaire pour `models set` → message de `validateModelValue` **verbatim**, rien écrit
      (`iakaframe.json` inchangé, `.claude/agents/<persona>.md` non créé), **aucun `--force`** dans
      l'argv assemblé.
- [ ] **CA-8 — Commande équivalente imprimée (A3).** *Mesure* : la ligne `→ iakaframe …` précède
      l'exécution **et**, rejouée telle quelle en non interactif, produit le même effet (G2.3). Un
      écho non rejouable est un échec.
- [ ] **CA-9 — Symétrie `+`/`−`.** `add`↔`remove`, `attach`↔`detach`, `models set`↔`models unset`
      guidés **dans le même lot**. *Mesure* : `--guide` accepté (exit 0 sur `--help`) sur les 6 verbes.
- [ ] **CA-10 — Autorité vide gérée.** *Mesure* : sur un projet sans team active, `models set --guide`
      **le dit** et rend la main, sans proposer de liste ni de repli en dur.
- [ ] **CA-11 — Un seul inventaire de commandes.** *Mesure* : **G5a** (registre ↔ `index.js`,
      bidirectionnel), **G5b** (`--help` dérivé, rougit si `HELP` redevient littéral), **G5c**
      (kit ↔ registre).
- [ ] **CA-12 — `/iaka` intact.** *Mesure* : **G6** — `learning-skill.test.js` passe inchangé,
      `iaka.md` identique avant/après.
- [ ] **CA-13 — Recette manuelle du mode brut (gate humain, non automatisable).** *Mesure* : sur
      **macOS et Windows**, après un parcours guidé au palier 2 **et** après un `Ctrl-C` en plein
      menu, le terminal **rend l'écho** et accepte une commande suivante (`stty` non cassé). ⚠️ **Ce
      critère ne peut pas être couvert par un test automatique** (pas de pty, M8) : il est **coché
      par l'humain**, ou le palier 2 n'est pas livré.
- [ ] **CA-14 — Documentation à jour dans le même lot.** *Mesure* : `docs/commandes.md` porte
      `--guide` pour les 10 cibles, le verbe `commands`, la commande `/iaka-guide` et la règle de
      non-interactivité + `IAKA_NON_INTERACTIF` ; `iakaframe --help` et les `USAGE` le mentionnent.
      Idiome de garde déjà en place : `cli/test/branches-locales.test.js:461`.
- [ ] **CA-15 — Suite verte.** *Mesure* : `npm test` dans `cli/` — **aucun test préexistant modifié
      pour passer** (un test amendé se justifie ligne à ligne au gate).

---

## Estimation (jalon P1→P2)

**Par lot, pour que le décideur puisse n'en prendre qu'un.**

| Lot | Contenu | j-h |
|---|---|---|
| **LOT 0 — pivot** | `lib/verbes.js` (38 verbes + sous-verbes), `commands --json`, `HELP` dérivé, G5 | **~1,25 j-h** |
| **LOT B — Claude Code** | `iaka-guide.md`, génération des entrées, doc, G5c | **~0,75 j-h** |
| *Sous-total 0+B (surface Claude Code utilisable)* | | **≈ 2 j-h** |
| **LOT A — terminal, noyau** | `interactif.js` + conversion des 2 appelants + G4 | ~0,75 j-h |
| **LOT A — palier 0+1** | refus loquaces + moteur listes numérotées + câblage 10 cibles + écho A3 | ~1,5 j-h |
| **LOT A — palier 2** | flèches, surbrillance, filtre, repli, restauration terminal | ~2 j-h |
| **LOT A — gardes** | G1, G2, G3 + recette manuelle CA-13 | ~1 j-h |
| *Sous-total A* | | **≈ 5,25 j-h** |
| **TOTAL 0 + A + B** | | **≈ 7,25 j-h — fourchette 6 à 9 j-h** |

**Complexité / risque : MOYENNE pour 0 et B, HAUTE pour le palier 2 du lot A.** Les lots 0 et B ne
contiennent aucune nouveauté technique : du registre, de la dérivation, de la génération, et un
menu que **Claude Code dessine lui-même**. Tout le risque est concentré dans le mode brut.

**Inconnues susceptibles de faire glisser l'estimation :**

1. **Le mode brut n'est pas testable de bout en bout (inconnue n°1).** Sans pty — et un pty est une
   dépendance, donc **interdit par CA-1** — la seule preuve du palier 2 est une **recette manuelle
   sur deux OS** (CA-13). Si le décideur exige une preuve automatique, le palier 2 **doit être
   retiré** du périmètre. *Impact : ±2 j-h, ou re-cadrage.*
2. **La taille réelle du registre (Lot 0).** J'ai mesuré 38 verbes, mais le registre doit aussi
   décrire les **sous-verbes** (7+7+5+4+4+3) et les `kind` (12+4). Si le décideur veut les
   **options** de chaque verbe décrites elles aussi, le Lot 0 **double**. *Impact : +1 à 1,25 j-h.*
3. **La conversion de `models.js:1019` change une règle observable** : `models` ne regarde pas `CI`
   aujourd'hui. Après unification, il ne promptera plus sur un runner qui alloue un TTY. C'est **le
   correctif voulu**, mais c'est un changement de comportement — à arbitrer explicitement, pas à
   glisser.
4. **`CI=false`.** Certains environnements exportent la variable à une valeur fausse. La règle
   « absent/neutre » doit être tranchée dans le module ; mal interprétée, elle **fait prompter en
   CI**. *Faible en coût, élevé en conséquence.*
5. **Le nombre d'entrées Claude Code à créer (Lot B).** 10 verbes sur 38 sont couverts. Couvrir les
   38 produirait **38 entrées dans le menu `/iaka`** — au risque de le rendre illisible. **Un
   arbitrage de couverture sera nécessaire au moment du Lot B** ; je recommande de ne générer que
   les verbes à valeur d'usage direct, pas les verbes de garde.
6. **État de l'arbre partagé.** D'autres sessions travaillent dans ce dépôt ; un conflit sur
   `index.js` ou `docs/commandes.md` coûte du temps de reprise.

---

## Sources (obligation de sourcing)

**Internes (mesurées en lecture, 2026-09-02/03)** — `cli/package.json` (dont `:24`),
`cli/src/index.js:43-49,51-189,194`,
`cli/src/commands/models.js:54,461,519-521,818-842,1019,1023`,
`cli/src/commands/onboard.js:40,105`, `cli/src/commands/list.js:45`, `cli/src/commands/show.js:33`,
`cli/src/commands/add.js:14-17,44`, `cli/src/commands/frame.js:81`, `cli/src/lib/output.js`,
`cli/src/lib/vocab.js:21-23`, `cli/src/lib/project-models.js:137`, `cli/src/lib/scaffold.js:102`,
`cli/test/guard-json-output.test.js:23,30`, `cli/test/learning-skill.test.js:29-33,54-60`,
`cli/test/help-systemique.test.js`, `cli/test/branches-locales.test.js:461`,
`~/.claude/commands/iaka.md`, `~/.claude/commands/iaka-help.md`, `~/.claude/commands/iaka-list.md`,
`kits/iakaframe-claude/.claude/commands/`, `cli/scripts/bundle.js`,
`specs/instructions/correctif-bascule-update-onboard-drapeaux.md:314`.

**Externes (web, vérifiées ce jour)**
- Node.js — *Readline* : `readline.emitKeypressEvents(stream)` ; « If the `stream` is a TTY, then it
  must be in raw mode ». <https://nodejs.org/api/readline.html>
- Node.js — *TTY* : « **Ctrl+C will no longer cause a `SIGINT` when in this mode** » ; « The
  preferred method of determining whether Node.js is being run within a TTY context is to check that
  the value of the `process.stdout.isTTY` property is `true` » ; `readStream.isRaw` « is always
  `false` when a process starts ». <https://nodejs.org/api/tty.html>
- État de l'art « ne rien demander hors TTY » : `gh` (désactivation des prompts,
  cli/cli#1739) <https://github.com/cli/cli/issues/1739> ; Terragrunt, « Don't prompt for yes/no
  answer if input is not a TTY » <https://github.com/gruntwork-io/terragrunt/issues/317> ;
  Terraform `-input=false` / `TF_INPUT` et `-auto-approve`
  <https://oneuptime.com/blog/post/2026-02-23-how-to-run-terraform-without-interactive-prompts-using-auto-approve/view>.

Convergence des trois : **détecter le contexte non interactif, puis échouer ou continuer sans
demander — jamais attendre une entrée.** Le motif dominant est le drapeau explicite + la variable
d'environnement (`TF_INPUT`, `prompt disabled`) : c'est celui recommandé en A2, et il est **déjà
amorcé ici** par `IAKA_NON_INTERACTIF`.
