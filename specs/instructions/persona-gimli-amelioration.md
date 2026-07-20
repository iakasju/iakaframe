# Persona Gimli — amélioration de contenu (phase 1)

> **Rang : non déclaré ici.** L'ordre de la série a une **source unique** —
> `phase1-inventaire-bibliotheque.md` **§ 0.1** (dépendances) et **§ 0.2** (ordre dérivé).
> Cette instruction déclare ses **dépendances**, jamais sa position.
>
> **Dépendance : APRÈS le lot 0** (comme tout lot de la série). **Aucune autre.**
> ⚠️ **Mais ce lot est CANON pour un autre** : G-1 écrit le canon du jalon de remise que le **lot
> Legolas cite** (L-3) — d'où la dépendance **Legolas APRÈS Gimli** (§ 0.1). **Ne pas déplacer ce
> lot après Legolas.**

> Instruction de cadrage (Gandalf, P1). Branche `feat/amelioration-personas`.
> **Périmètre CONTENU uniquement.** Dérivée de `audit-amelioration-roster-personas.md`.
> Un commit dédié à cette persona.

## 1. Cadre de la phase — ligne de partage

**DANS** : mission, périmètre *fait / ne fait pas*, obligations, gestes, `guardrails` déclarés,
`tools` du binding, `skills` du frontmatter, `description`, geste **jalon**.

**HORS — phase 2** : `roleKey`, `library/roles/`, `methods/iakaframe.md`, promotion de `deploiement`,
`roleIndex`, `DEFAULT_SKILLS`, `CANONICAL_ROLES`, vignette, `assemble`, **re-vendorage GUI**,
`roster.test.ts`, `Skill` au binding.

## 2. Trois faits qui valent pour toute cette phase

1. **Golden + déployé régénérés à chaque persona** (`gen-agents-golden.mjs` puis
   `agents generate --global`, `--check` = 0). **Critère de fini.**
2. **Le re-vendorage GUI n'est PAS fait.** ⚠️ *Corrigé au gate : **rien n'est rompu à ce jour**
   (vérifié par diff) ; la rupture **surviendra au premier commit**.* La parité cross-repo **sera
   volontairement rompue** et **rien ne la détectera** (`vendor-check` inexistant). **Dette assumée,
   ouverte au premier commit.** La suite GUI n'est pas jouée dans cette phase.
3. **Ajouter des `skills:` n'a AUCUN effet runtime** tant que le générateur ne les projette pas
   (lot 2, phase 2). On écrit le canon juste ; l'activation vient après. **Directement structurant
   pour cette persona** — cf. § 4.

## 3. État audité — Gimli (dev, 🔴)

| Dim. | Verdict | Preuve |
|---|---|---|
| 1 Charte | ✅ | mission P2/P3 nette (`gimli.md:19-22`), périmètre borné (`:24-27`) |
| 2 Expert MoE | ✅ | frontières Gimli↔Legolas (juge/partie) et Gimli↔Helm (stage/prod) verrouillées des deux côtés |
| 3 Jalons | ❌ | **0 mention** — « Aucun gate propre » (`:39`) alors qu'une **remise à Legolas** est obligatoire (`:42-46`) |
| 4 Tools | ✅ | `Read, Edit, Write, Bash, Grep, Glob` — exactement le nécessaire ; **pas de `Task`** = correct |
| 5 Skills | ⚠️ | **`skills: []` (`:8`) — seul agent du roster sans skill** |
| 6 Hooks | ✅ | `identity` + `perimeter` actifs (il possède Write/Edit/Bash) |
| 7 Cohérence | *(hors périmètre)* | — |

## 4. Changements demandés

| Id | Changement | Fichier | Statut |
|---|---|---|---|
| **G-1** | **Décrire le geste jalon** à la remise à Legolas | `library/personas/gimli.md` (§ Gate) | à faire |
| **G-2** | **Trancher `skills: []`** : créer `iakaframe-fabrication` ou confirmer le vide | `gimli.md:8` (+ `library/skills/`) | **décideur** — § 6 |

### G-1 — geste jalon (transition réelle, pas décorative)

La charte dit « **Aucun gate propre** » (`:39`), ce qui est **exact au sens des gates de la méthode**
— mais elle impose deux lignes plus bas que **toute livraison passe le gate Legolas** et interdit
l'auto-validation (`:42-46`). Il y a donc bien une **transition** : *Gimli remet, Legolas juge*.

La charte doit énoncer que Gimli **matérialise cette remise** via `iakaframe jalon` —
**émetteur : Gimli · récepteur : Legolas** (et **non** l'utilisateur : c'est un gate **automatique**,
pas humain) — avec les fichiers livrés en `chemin:ligne` dans son message.

> **Nuance à respecter** : ce jalon ne **franchit rien** et ne vaut **pas** auto-validation. Il rend
> la remise **visible**. La rédaction doit s'articuler avec `:42-46`, pas le contredire : le jalon
> est le geste **par lequel** Gimli passe la main, précisément parce qu'il ne se certifie pas.

### G-2 — `skills: []`

**Ce n'est pas une dérive** : les quatre couches concordent (`gimli.md:16` « porté par le `CLAUDE.md`
du projet », `cli/src/lib/agents.js:33` `fabrication: ''`, `:105-106` message dédié, et le défaut GUI).
C'est une **question de conception**, pas un défaut à corriger.

Le motif d'origine — « le `CLAUDE.md` du projet porte le savoir-faire dev » — tenait quand le
`CLAUDE.md` était le seul véhicule. Or Gimli porte des **procédures stables et transverses aux
projets** : commits conventionnels atomiques, interdiction de `reset --hard` / `push --force`,
worktrees parallèles, remise obligatoire à Legolas. Ce sont des **procédures de méthode**, pas des
faits de projet.

> ⚠️ **Fait à intégrer à la décision : créer la skill maintenant n'aura AUCUN effet runtime** (§ 2
> pt 3). On écrirait un canon juste, inerte jusqu'au lot 2. Cela ne disqualifie pas la création —
> mais interdit de la présenter comme « activant » quoi que ce soit.

## 5. Ce qui est laissé à la phase 2 (bloqué par la structure)

- **Le geste jalon ne sera pas outillé** : `iakaframe-jalon` n'est pas déployée. G-1 écrit la charte
  juste ; l'activation vient au lot 2.
- **Si G-2 crée `iakaframe-fabrication`** : elle ne sera **ni résolue ni déployée** avant le lot 2 ;
  `SKILL_OF.fabrication = ''` et `DEFAULT_SKILLS.fabrication = []` restent à traiter en phase 2.
- `Skill` au binding, re-vendorage GUI, `roleKey`.

## 6. G-2 — création de `iakaframe-fabrication` : **skill COMPOSÉE**

> **La création fait partie de ce lot** (arbitrage décideur) : déclarer une skill inexistante
> laisserait un frontmatter pointant dans le vide.

### 6.1 Réutiliser avant de créer — ce qui a été cherché

*(Ordre des sous-sections corrigé au gate LG-12 : § 6.1 « ce qui a été cherché » précède
délibérément § 6.2 « arbitrage et décomposition » — la recherche vient avant la décision. L'ancien
§ 6.0 est renuméroté **§ 6.2** ci-dessous.)*

Balayage des **23 skills** de `library/skills/` *(corrigé au gate LG-9 : 24 entrées dont
`README.md`, qui n'est pas une skill)* pour savoir si une existante couvre le besoin :

| Candidat examiné | Verdict |
|---|---|
| `iakaframe-qualite` | **non** — c'est le gate de Legolas ; l'attribuer à Gimli briserait juge/partie |
| `iakaframe-deploiement` | **non** — squad prod (Helm) ; Gimli s'arrête au staging |
| `iakaframe-gestion-de-source` | **partiellement** — couvre les commits, **pas** le reste du geste dev |
| `iakaframe-conteneurisation` | **partiellement** — couvre le build d'image, **pas** le reste |
| `iakaframe-git` / `-forgejo` / `-docker` | **non** — couches produit, déjà composées sous les capacités ci-dessus |

→ **Aucune ne couvre le rôle.** Mais **deux le couvrent en partie** : c'est précisément le cas
d'usage d'une **skill composée**.

### 6.2 Arbitrage du décideur (2026-07-19) — **CRÉER**, structuré **par fonction**

Deux points tranchés : *(1)* Gimli **a** un savoir-faire dev propre — le motif d'origine (« le
`CLAUDE.md` du projet le porte ») **ne tient plus** pour des procédures **transverses aux projets** ;
*(2)* ce savoir-faire se décline **par fonction**, donc en **briques fonctionnelles composées**, pas
en skill monolithique. Le repli « confirmer `skills: []` » (§ 6.5) est **caduc**.

**Décomposition fonctionnelle du geste dev** — les 5 fonctions, et leur couverture :

| # | Fonction | Couverte par | Brique neuve ? |
|---|---|---|---|
| 1 | **Commiter** (atomique, conventionnel, worktrees) | `iakaframe-gestion-de-source` → `git` → `forgejo` | **non — réutilisée** |
| 2 | **Builder / conteneuriser** | `iakaframe-conteneurisation` → `docker` | **non — réutilisée** |
| 3 | **Remettre au gate** (jalon vers Legolas) | `iakaframe-jalon` | **non — réutilisée** |
| 4 | **Conduire l'exécution d'une instruction fermée** | *rien* | **non — c'est le cœur de la coiffante** (§ 6.3) |
| 5 | **Mettre en stage** (P3 : `vX.Y.Z-rc` sur l'environnement de stage) | *rien* | **non — examinée et écartée**, cf. ci-dessous |

**Réponse à « quelles fonctions ne sont couvertes par rien et méritent leur propre brique » :
aucune ne la mérite aujourd'hui.** Les deux non couvertes ont été examinées, pas éludées :

- **Fonction 4** — la conduite d'exécution (lire l'instruction **avant** de coder, procéder étape par
  étape, ne pas sortir du périmètre, escalader l'ambiguïté) **est** ce que la coiffante porte en
  propre. En faire une sous-brique produirait une brique **égale à son parent** — la définition même
  d'une brique « pour faire joli ».
- **Fonction 5** — la mise en stage est un **vrai manque** : `iakaframe-deploiement` est **prod**
  (Helm), `conteneurisation` s'arrête à l'image. **Mais sa frontière n'est pas nette** : en contexte
  self-hosted, « mettre en stage » ≈ lancer la stack conteneurisée + poser le tag `rc` — soit
  `conteneurisation` **+ configuration de stack propre au projet** (donc `CLAUDE.md`). La créer
  maintenant produirait un recouvrement avec **deux** skills existantes. **Écartée au MVP, à
  ré-examiner en phase 2 quand le périmètre de `iakaframe-deploiement` sera instruit** (stage
  y appartient-il, avec un marqueur d'environnement ?). **Signalée, non fabriquée.**

> **Le « par fonction » est donc satisfait par la structure de la composition, pas par un nombre de
> briques.** Les 3 sous-skills réutilisées **sont** les fonctions ; en ajouter une 4ᵉ redondante
> contredirait « réutiliser avant de créer », que l'arbitrage rappelle explicitement.

### 6.3 Conception — coiffante, pas monolithique

**`iakaframe-fabrication` est une skill COMPOSÉE**, pas un pavé qui redécrit des gestes existants :

```
iakaframe-fabrication            (layer: capacity — le geste de fabriquer)
  ├─ subskills: iakaframe-gestion-de-source   (commiter — existe déjà)
  ├─ subskills: iakaframe-conteneurisation    (builder/mettre en stage — existe déjà)
  └─ subskills: iakaframe-jalon               (remise à Legolas, cf. G-1 — existe déjà)
```

**Ce que la skill porte en propre** (et qui n'existe nulle part ailleurs) : lire l'instruction
**avant** de coder · implémenter **étape par étape** · discipline des **worktrees** en parallèle ·
**interdiction d'auto-validation** et remise à Legolas · borne staging (jamais la prod).

**Ce qu'elle ne redécrit PAS** : la mécanique de commit (→ `gestion-de-source`), le build d'image
(→ `conteneurisation`), l'anatomie du jalon (→ `jalon`). C'est le même raisonnement qui a fait
extraire `iakaframe-jalon` en sous-skill partagé plutôt que de le dupliquer dans deux chartes.

**Nommage** : `fabrication` est un **geste**, pas un outil ni un produit — conforme à la convention.

### 6.4 ⚠️ Conséquence structurelle à signaler (ne pas trancher ici)

Cette composition rend **atteignable depuis une persona** une chaîne de **profondeur 3** :

```
gimli → iakaframe-fabrication → iakaframe-gestion-de-source → iakaframe-git → iakaframe-forgejo
```

**Cela invalide la justification que j'avais donnée** à la résolution en profondeur 1 (« aucune
chaîne atteignable depuis une persona ne dépasse 1 niveau ») : après ce lot, **ce ne sera plus
vrai**. Et le critère **B28** que j'avais proposé — *erreur explicite au-delà de la profondeur 1* —
**bloquerait cette skill**.

> **À signaler, pas à résoudre en phase 1.** Si l'assemblage est un **principe assumé du modèle**,
> alors la limite de profondeur est une **contrainte du résolveur**, pas une propriété du modèle :
> c'est le résolveur qui doit apprendre à descendre, pas le canon qui doit rester plat.
> **Rien dans ce lot ne grave la limite.** On écrit le canon **juste** (composé), et l'arbitrage
> profondeur + B28 est **rouvert en phase 2**, avec ce cas comme pièce au dossier.

### 6.5 ~~Repli si le décideur veut limiter le lot~~ — **SUPPRIMÉ**

> 🔒 **Caduc (levée LG-3).** L'arbitrage **G-2 = CRÉER** est **rendu** (§ 6.2). Le repli « confirmer
> `skills: []` » **n'est plus une option** et ne doit plus figurer comme telle : *une instruction
> fermée ne rouvre pas une décision rendue.* Le § 6.2 le déclarait caduc pendant que trois passages
> l'offraient encore — c'est le raté de propagation que le gate a relevé.

### 6.6 Autres familles — aucune création

| Famille | Besoin ? | Vérification |
|---|---|---|
| `principles` | **non — réutilisation** | L'interdit `reset --hard` / `push --force` de `gimli.md:39` est **déjà** dans `library/principles/commits-versionnement.md:4` — en **équivalence sémantique**, **pas** « mot pour mot » : le principe dit « côté **IA** », la charte « côté **agent** » *(corrigé au gate LG-2 ; l'inventaire avait raison)*. La charte **cite**, elle ne réécrit pas — l'alignement lexical est **à faire à la rédaction**, il n'est pas acquis. `cadrage-avant-code` couvre « lire l'instruction avant de coder ». |
| `guardrails` | **non** | Tentation réelle : un 4ᵉ garde-fou « anti-auto-validation ». **Écarté** — précédent **CH-4** (anti-auto-cast d'Aragorn), acté comme **contractuel seul**. Traiter Gimli autrement créerait une incohérence de doctrine. |
| `rituals` | non | les 5 existants ne couvrent pas la fabrication ; en créer un doublonnerait la skill |
| `workflows` | non | `iakaframe-3phases:6-7` place déjà `dev` en P2 et P3 |
| `scaffolds` | non | il produit du code, pas une structure type |
| `roles` | phase 2 | `library/roles/dev.md` existe |

## 7. Critères d'acceptation

| # | Critère | Vérification |
|---|---|---|
| G-A1 | La charte décrit le jalon de **remise à Legolas** (émetteur Gimli, récepteur **Legolas**) | relecture |
| G-A2 | Le jalon **ne contredit pas** l'interdiction d'auto-validation (`:42-46`) ; les deux passages se répondent | relecture croisée |
| G-A3 | Le jalon inclut FIGlet + tableau 3 zones + fichiers `chemin:ligne` | relecture |
| G-A4 | `library/skills/iakaframe-fabrication/SKILL.md` **existe** ; `name` == nom du dossier ; `skills: [iakaframe-fabrication]` en `gimli.md:8` | lecture *(conditionnel « si créer » **retiré** — LG-3)* |
| **G-A5** | **REMPLACÉ (levée LG-4)** — la skill est **COMPOSÉE** : son frontmatter porte **exactement** `subskills: [iakaframe-gestion-de-source, iakaframe-conteneurisation, iakaframe-jalon]` | assertion sur l'**ensemble exact** — ni vide, ni partiel, ni surnuméraire |
| **G-A5b** | `layer: capacity` est déclaré | lecture du frontmatter |
| **G-A5c** | Les **3 sous-skills référencées existent** dans `library/skills/` | résolution des 3 ids |
| **G-A5d** | La skill **ne redécrit pas** ce que portent ses sous-skills : aucune procédure de commit, de build d'image ni d'anatomie de jalon dans son corps | **NON MÉCANISABLE — contrôle humain en revue.** C'est le contrôle **anti-monolithe** : G-A5/b/c sont automatisables (assertions sur le frontmatter), **G-A5d ne l'est pas** — juger qu'un texte « redécrit » un autre est un jugement de sens, comme V2/V3 du principe `canon-avant-citation` (§ 4). **Dit franchement plutôt que promis à demi.** |
| G-A6 | `tools` et `guardrails` **inchangés** | diff `bindings/…:11`, `gimli.md:9` |
| G-A7 | Aucun champ hors périmètre modifié | diff |
| G-A8 | Golden + déployé régénérés | `agents generate --check` = **0** |
| G-A9 | Suite CLI verte | `node --test` |

## 8. Critère de « fini »

1. `node cli/scripts/gen-agents-golden.mjs` · 2. `agents generate --global` + `--check` = 0 ·
3. `node --test` vert · 4. **PAS de re-vendorage GUI** (dette assumée, 2026-07-19) ·
5. Commit dédié à Gimli.

## 9. Estimation

**~1 j-h** — G-1 (jalon de remise) **+ G-2 (création de la skill composée, arbitrée)**.
*(Le chiffrage conditionnel « 0,5 si G-1 seul » est **caduc** — levée LG-3.)*
Complexité **faible**. Risque **faible**.
*Inconnue* : le contenu exact de `iakaframe-fabrication` si elle est créée — quelles procédures
migrent depuis le `CLAUDE.md` projet, et lesquelles y restent (faits de projet). À arrêter à la
rédaction, avec une règle simple : **procédure de méthode → skill ; fait de projet → `CLAUDE.md`**.
