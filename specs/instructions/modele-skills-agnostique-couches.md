# Instruction — Modèle de skills AGNOSTIQUE EN COUCHES (capacité → famille → produit)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (méthode `library/` + README) et
> **Gimli/GUI** (`@iakaframe/core` intégrité/réservoir — inchangé, cf. §3.2). Statut en fin de doc.
> Ordre d'Odin (arbitrage d'architecture du décideur) : les skills génériques sont **agnostiques de
> la disponibilité d'un logiciel** ; les produits concrets forment une **collection de skills choisis
> comme sous-skills à l'install**. Hiérarchie à 3 niveaux **via le mécanisme de sous-skills existant**.
> Réf. canon : mémoire projet `skills-agnostiques-layered` (gravée 2026-07-19).
> Réf. mécanisme (le véhicule) : `specs/instructions/modele-composition-tools-sousskills.md` (§3 :
> `subskills:[]` dans `SKILL.md` + intégrité `subskills ⊆ skills` + réservoir `skill ← skills`).
> Réf. anonymisation (déjà produit→agnostique, mais **gelée et manuelle**) :
> `specs/instructions/frame-stefframe1.md §9`, `frame-stefframe2.md`,
> `frames/releases/StefFrame2/library/skills/{iakaframe-git,iakaframe-humandoc,iakaframe-design}/`.
> Réf. générateur (en file, orthogonal) : `specs/instructions/generateur-persona-contrat.md`.
> **Dépendance d'ordonnancement** : ce lot vient **APRÈS** le merge de
> `modele-composition-tools-sousskills.md` (le mécanisme `subskills` doit être en place — voir §6).

---

## 0. Besoin (reformulé) + le canon à formaliser

**Canon (arbitrage décideur, verbatim reformulé)** : « On retire les références aux logiciels
particuliers : nous sommes agnostiques de la disponibilité d'un type de logiciel. *Committer sur un
gestionnaire de source* est agnostique. Proposition : inclure dans la library une collection de skills
logiciel-spécifiques, choisis comme sous-skills à l'instanciation dans un contexte d'install pour un
user. Donc skill `forgejo` dans la library, référencé par le skill `git`, lui-même dans le skill
`gestion de source`. »

**Traduction en modèle — hiérarchie à 3 niveaux portée par les sous-skills :**

```
iakaframe-gestion-de-source   (CAPACITÉ — agnostique, ne nomme AUCUN produit ni protocole)
  └─ subskills: [iakaframe-git]
       iakaframe-git          (FAMILLE / protocole — nomme le protocole, pas le serveur)
         └─ subskills: [iakaframe-forgejo]   (+ github, gitlab… candidats futurs)
              iakaframe-forgejo (PRODUIT concret — nomme et opère Forgejo ; choisi à l'install)
```

**Trois règles cardinales du modèle :**
1. Une skill **capacité** décrit **ce qu'on veut faire** (une capacité) — jamais **avec quoi** (aucun
   nom de produit, aucun endpoint, aucune IP, aucun token). Corps 100 % agnostique.
2. Une skill **produit** **doit** nommer son produit et porter sa mécanique concrète (API Forgejo,
   pattern d'URL, `$FORGEJO_TOKEN`). Un produit qui nomme son produit est **correct** — c'est sa raison
   d'être. `iakaframe-forgejo` **n'est pas un bug à corriger**, c'est **la couche 3 qui existe déjà**.
3. Le **choix du produit** est une **opération d'install** (instanciation pour un user/environnement),
   pas une propriété gravée dans la capacité.

**Objectif MVP (modèle — on ne code aucun moteur)** : (A) poser la taxonomie des couches ; (B)
concevoir capacité/famille/produit + la **collection produit** + la **résolution à l'install** ; (C)
livrer **de bout en bout l'exemplaire `gestion-de-source → git → forgejo`** ; (D) **réécrire** le
contenu des sous-skills du lot composition ; (E) esquisser les autres axes. On **réutilise** le
mécanisme `subskills` (ne rien réinventer) et on **confirme** qu'il reste valable tel quel.

---

## 1. Cartographie de l'existant — quelles skills nomment un produit

Recensement sur les 16 `library/skills/iakaframe-*/SKILL.md` (frontmatter + corps).

| Skill actuelle | Nomme un produit ? | Produit(s) nommé(s) | Couche réelle aujourd'hui | Capacité agnostique visée |
|---|---|---|---|---|
| `iakaframe-forgejo` | **OUI** | Forgejo, iakabox, `192.168.2.11:3001`, `$FORGEJO_TOKEN` | **produit** (déjà) | gestion-de-source |
| `iakaframe-init` | **OUI (par réf.)** | Forgejo (via corps + `subskills:[iakaframe-forgejo…]`) | orchestrateur (capacité) | amorçage (capacité) — doit référencer des **capacités** |
| `iakaframe-update` | **OUI (par réf.)** | Forgejo (corps + `subskills:[…iakaframe-forgejo]`) | orchestrateur (capacité) | checkpoint (capacité) — idem |
| `iakaframe-log-conversation` | **OUI** | MQTT/Mosquitto, CouchDB, iakaboxlogs, `mqtt://192.168.2.11:1883` | **produit(s)** (composite) | journal-conversation (capacité) |
| `iakaframe-appflowy-doc` | **OUI** | AppFlowy, `192.168.2.14:3008`, endpoints `/api/workspace/…` | **produit** | mémoire-humaine (capacité) |
| `iakaframe-naonedge` | **OUI** | NaonEdge, Cinabre, Studio clair, `design-*/` | **produit(s) = chartes** (cas à part, §2.4) | design-on-brand (capacité) |
| `iakaframe-docker` | **OUI** | Docker, Docker Desktop, docker-compose | **produit** | conteneurisation (capacité) |
| `iakaframe-etat-des-lieux` | non (méthode) | — (invoque `git log` : dépendance famille) | **capacité** (méthode) | — (déjà agnostique ; §2.3) |
| `iakaframe-odin`/`aragorn`/`cadrage`/`qualite`/`deploiement`/`nathalie`/`learning`/`retrait` | non | — | **capacité / rôle** (méthode) | — (déjà agnostiques) |

**Deux patrons d'agnosticisme distincts** (à ne pas confondre) :
- **Patron A — remplacement de feuille (leaf swap)** : la capacité délègue à un **produit-skill**
  interchangeable, choisi à l'install. Concerne : **source-control (git/forgejo)**, doc-externe
  (appflowy), conteneurisation (docker), journal (mqtt+couchdb). **C'est le cœur de ce lot.**
- **Patron B — catalogue de données au runtime** : `iakaframe-naonedge` est **déjà** agnostique par
  **catalogue dynamique** (`design-*/`, la charte est **de la donnée**, pas un skill). Le produit
  (une charte) se résout au runtime selon le contexte (cf. mémoire `charte-defaut-contextuelle`). Ce
  patron **n'a pas besoin** de la chaîne de sous-skills. → **hors périmètre de la migration** (§10),
  cité pour ne pas le traiter par erreur comme un leaf swap.

---

## 2. Taxonomie des couches proposée

### 2.1 Les trois couches (définitions fermées)

| Couche | Rôle | Nomme un produit ? | Où le concret vit | Installé chez le user |
|---|---|---|---|---|
| **Capacité** | ce qu'on veut faire (verbe métier) | **JAMAIS** | nulle part (agnostique) | **toujours** |
| **Famille** | le protocole/standard | le **protocole** (git), pas le serveur | mécanique de protocole (`git commit`…) | **toujours** (si la famille est choisie) |
| **Produit** | l'implémentation concrète | **OUI** (Forgejo, AppFlowy…) | API/URL/token réels | **1 par famille, choisi à l'install** |

> La **famille est optionnelle** : certains axes n'ont pas de couche protocole distincte utile au MVP
> et se réduisent à **capacité → produit** (2 niveaux). On n'introduit une famille que quand elle
> **porte une mécanique réutilisable entre produits** (le cas de git : `commit/remote/push` communs à
> Forgejo/GitHub/GitLab).

### 2.2 Les axes réels (l'exemplaire complet + esquisses)

| Axe | Capacité (couche 1) | Famille (couche 2) | Produit(s) (couche 3) | Niveaux MVP | Statut |
|---|---|---|---|---|---|
| **Source-control** | `iakaframe-gestion-de-source` | `iakaframe-git` | `iakaframe-forgejo` (+ github, gitlab futurs) | **3** | **DE BOUT EN BOUT (ce lot)** |
| Conteneurisation | `iakaframe-conteneurisation` | *(OCI/compose — différée)* | `iakaframe-docker` (+ podman futur) | 2 | esquisse (§6, option) |
| Mémoire humaine | `iakaframe-memoire-humaine` (= `humandoc`) | *(aucune utile)* | `iakaframe-appflowy` | 2 | esquisse |
| Journal conversation | `iakaframe-journal-conversation` | *(pub-sub + doc-store)* | `iakaframe-mqtt-couchdb` (composite) | 2 | esquisse (composite — §8.5) |
| Design on-brand | `iakaframe-design` | — | chartes = **données** (`design-*/`) | patron **B** | **hors leaf-swap** (§1, §10) |

**Justification de l'ordre de traitement** : source-control est l'axe **le plus universel** (tout
projet versionne), le **plus cité** dans le canon (l'exemple `forgejo`/`git`/`gestion-de-source` est
le verbatim du décideur), et celui dont **le produit-skill existe déjà** (`iakaframe-forgejo`). C'est
donc l'exemplaire à poser **de bout en bout**. Les autres sont esquissés pour prouver la généralité
du modèle sans élargir le MVP.

### 2.3 Cas `etat-des-lieux` (tranché ici : reste capacité)

`iakaframe-etat-des-lieux` invoque `git log/status/branch/tag` — dépendance à la **famille git**.
**Décision de cadrage** : il **reste une capacité méthode** (il ne nomme aucun **serveur**, seulement
le binaire `git` universellement présent partout où on versionne). Il **n'est pas** un produit et
**ne devient pas** un sous-skill de la chaîne source-control. Rendre sa lecture git déléguée à la
famille est **hors MVP** (raffinement, §10). Il **reste** sous-skill de init/update tel quel.

### 2.4 Nommage des skills des trois couches

- **Capacité** : `iakaframe-<capacité-en-français-kebab>` — ex. `iakaframe-gestion-de-source`.
- **Famille** : `iakaframe-<protocole>` — ex. `iakaframe-git`.
- **Produit** : `iakaframe-<produit>` — ex. `iakaframe-forgejo` (**id inchangé** : on ne renomme pas
  l'existant).

> **Réconciliation de nommage avec l'anonymisation** (important) : la frame gelée a produit un skill
> **nommé `iakaframe-git`** qui est en réalité, dans sa prose, une **capacité agnostique bardée de
> placeholders** (`<GIT_HOST>`). Dans le **modèle vivant**, `iakaframe-git` est la **famille** (git,
> propre, sans placeholder) et la **capacité** au-dessus s'appelle `iakaframe-gestion-de-source`. La
> frame collapsait capacité+famille en un seul skill à placeholders ; le modèle vivant les **sépare**
> et rend le placeholder **inutile** (le produit porte le concret). Voir §5.

---

## 3. Conception du modèle

### 3.1 (a) Comment une skill capacité reste agnostique — corps sans produit

Une skill **capacité** :
- **Frontmatter** : `id`, `name`, `description` **agnostiques** (la `description` décrit la capacité,
  pas le produit : « versionner le travail sur un gestionnaire de source », pas « pousser sur
  Forgejo »), **`subskills:` = [la/les famille(s) ou produit(s) de l'axe]**.
- **Corps** : décrit le **quoi/pourquoi/garde-fous** de la capacité (commits atomiques, jamais de
  `push --force`, token jamais commité **en tant que principe** — sans nommer *quel* token). Zéro
  endpoint, zéro IP, zéro nom de produit. **Renvoie explicitement à ses sous-skills** pour le concret :
  « le *comment* concret (serveur, API, credentials) est porté par le sous-skill produit
  sélectionné à l'install ».

**Patron de référence déjà écrit** : `frames/releases/StefFrame2/library/skills/iakaframe-humandoc/`
et `.../iakaframe-git/` sont des **corps agnostiques prêts à l'emploi** (produits de l'anonymisation).
Gimli s'en **inspire** pour rédiger `iakaframe-gestion-de-source` — mais **sans placeholder** (le
concret n'est pas un `<GIT_HOST>` à trou, il est **délégué au produit**).

**Test d'agnosticisme (mécanisable, §9)** : sur toute skill capacité/famille,
`grep -iE 'forgejo|iakabox|appflowy|mqtt|couchdb|192\.168|:3001|:1883|:3008|\$?FORGEJO|<[A-Z_]+>'`
= **0** (ni produit, ni placeholder). La famille `git` a droit au mot **git** (protocole), pas à un
serveur.

### 3.2 (b) Comment `subskills` exprime capacité → famille → produit

**On réutilise `subskills` À L'IDENTIQUE.** La hiérarchie est une **chaîne de `subskills`** :

```yaml
# library/skills/iakaframe-gestion-de-source/SKILL.md
subskills: [iakaframe-git]
# library/skills/iakaframe-git/SKILL.md
subskills: [iakaframe-forgejo]        # (demain : [iakaframe-forgejo, iakaframe-github, iakaframe-gitlab])
# library/skills/iakaframe-forgejo/SKILL.md
# (feuille — pas de subskills, ou subskills absent)
```

**Le MÉCANISME reste valable tel quel — confirmation explicite (rien à re-coder côté cœur) :**
- **Intégrité** `subskills ⊆ skills` (`checkFrameRefs`) : **inchangée**. Tous les ids de la chaîne
  (`iakaframe-git`, `iakaframe-forgejo`, futurs `github`/`gitlab`) **existent dans le pool `skills`
  de la library** → intégrité **verte**. C'est la clé : **tous les produits vivent dans la library**
  (collection §3.3) ; l'install *sélectionne* mais ne *supprime* rien du pool. L'intégrité est
  **library-scoped**, donc la sélection d'install ne la casse jamais.
- **Anti-self-ref** (`id ∉ subskills`) : inchangé, toujours respecté (chaîne acyclique par
  construction : capacité→famille→produit est un DAG descendant).
- **Réservoir** `skill ← skills` : inchangé — le stock de sous-skills candidates d'une skill reste
  « tout le pool skills ». Le GUI affiche donc naturellement la chaîne (choix = `subskills`, stock =
  pool). **Aucune extension de type, aucun nouvel I/O.**

> **Ce que subskills seul ne dit PAS** : que `[forgejo, github]` sous `git` sont des **alternatives**
> (install en choisit une), alors que `[gestion-de-source, docker, etat]` sous `init` sont toutes
> **composées** (toutes incluses). Cette distinction est **le seul bit d'information nouveau** requis
> pour la résolution à l'install → §3.4 + arbitrage §8.1.

### 3.3 (c) La collection de skills produit dans la library

- **Où** : dans `library/skills/`, **au même niveau** que les autres (pas de sous-dossier spécial au
  MVP — un produit-skill est un skill comme un autre, forme dossier + `SKILL.md`, installable à chaud).
- **Nommage** : `iakaframe-<produit>` (`iakaframe-forgejo` existe ; futurs `iakaframe-github`,
  `iakaframe-gitlab`, `iakaframe-podman`, `iakaframe-appflowy`).
- **Frontmatter** : `id`/`name`/`description` (la description **peut** nommer le produit — c'est une
  couche 3), pas de `subskills` (feuille). **Discriminant de couche** : voir §8.1 (recommandation :
  champ optionnel `layer: product`).
- **Contenu** : la mécanique concrète (API, URL, token env, garde-fous produit). `iakaframe-forgejo`
  **est déjà exactement cela** — il **devient** officiellement la feuille de la chaîne, **sans
  réécriture de son corps**.

### 3.4 (d) La résolution à l'install (choix du produit disponible)

**Principe** : les couches capacité + famille sont **toujours** installées (agnostiques,
universelles) ; le **produit** est **sélectionné à l'instanciation** pour l'environnement du user.

**Le véhicule = le KIT d'install** (déjà « manifeste de livrable » dans la taxonomie, cf.
`frame-stefframe1.md §3`). Recommandation MVP, **la plus légère** :

- L'install (kit / `install.mjs`) **déploie dans `.claude/skills/` du user** : **toutes** les skills
  capacité + famille **+ le(s) produit(s) sélectionné(s)** pour cet environnement. Les produits **non
  choisis restent dans la library** (source de vérité) mais **ne sont pas déployés** chez ce user.
- **La sélection** = une liste de produits-skills choisis, portée par le **kit/binding d'install**
  (ex. un champ `products: [iakaframe-forgejo]` ou, plus simple encore MVP, « le produit-skill présent
  dans le `.claude/skills/` déployé **est** le produit actif » — la présence vaut sélection).
- **Aucune modification de l'intégrité** : elle reste library-scoped (tous les produits présents dans
  la library → toujours verte). La sélection est une **couche de déploiement**, distincte de la
  vérification référentielle.

**Articulation avec l'instanciation d'un projet** : `iakaframe onboard`/`init` amorce un projet ; le
choix du produit source-control se fait **au moment de l'install du user** (ou du projet), **pas** dans
la capacité. Un user « Forgejo/homelab » installe `iakaframe-forgejo` ; un user « GitHub » installera
`iakaframe-github` (skill produit future) — **la même capacité `gestion-de-source` sert les deux**,
sans réécriture.

> **Ce qui reste à trancher pour la résolution** : « nouveau champ `products:` dans le kit/binding »
> **vs** « présence = sélection » **vs** « champ sur la famille ». Recommandation MVP =
> **présence = sélection** (zéro nouveau schéma) ; le champ `products:` est l'incrément propre
> ultérieur. → §8.2.

---

## 4. Réécriture du contenu sous-skills du lot composition

Le lot `modele-composition-tools-sousskills.md` a posé (Gimli, en cours, non commité) :

```yaml
iakaframe-init   → subskills: [iakaframe-forgejo, iakaframe-docker, iakaframe-etat-des-lieux]
iakaframe-update → subskills: [iakaframe-etat-des-lieux, iakaframe-forgejo]
iakaframe-odin   → subskills: [iakastart]
```

**Diagnostic** : le **MÉCANISME est bon et reste tel quel** (§3.2). C'est le **CONTENU** qui nomme des
**produits** (`iakaframe-forgejo`, `iakaframe-docker`) là où un orchestrateur de méthode devrait
référencer des **capacités**. C'est **exactement** la raison du FAIL de gate sur le CONTENU signalé
par Odin.

**Réécriture MVP (source-control seul migré ; docker = option §6/§8.3) :**

| Skill | Avant (produit en direct) | Après (capacité) | Raison |
|---|---|---|---|
| `iakaframe-init` | `[iakaframe-forgejo, iakaframe-docker, iakaframe-etat-des-lieux]` | `[iakaframe-gestion-de-source, iakaframe-docker, iakaframe-etat-des-lieux]` | init réfère la **capacité** source-control, pas le serveur Forgejo. `docker`/`etat` inchangés au MVP (docker = option). |
| `iakaframe-update` | `[iakaframe-etat-des-lieux, iakaframe-forgejo]` | `[iakaframe-etat-des-lieux, iakaframe-gestion-de-source]` | idem. |
| `iakaframe-odin` | `[iakastart]` | `[iakastart]` **inchangé** | `iakastart` est une brique méthode, pas un produit. |

**Chaîne à créer (les nouveaux maillons) :**

```yaml
iakaframe-gestion-de-source → subskills: [iakaframe-git]     # NOUVEAU skill capacité
iakaframe-git               → subskills: [iakaframe-forgejo] # NOUVEAU skill famille
iakaframe-forgejo           → (feuille, inchangé)            # EXISTANT, devient couche 3 officielle
```

**Corps des skills init/update** : retirer les **mentions Forgejo en dur** du corps (procédure) et
renvoyer à la **capacité** (« versionne via `iakaframe-gestion-de-source` — le serveur concret est le
produit sélectionné à l'install »). Le concret Forgejo **descend** dans `iakaframe-forgejo`.

**Confirmation demandée à Gimli/GUI** : **aucun changement** dans `@iakaframe/core`
(`frame.ts`/`reservoir.ts`) n'est requis par ce lot — intégrité, anti-self-ref et réservoir
fonctionnent **inchangés** sur la nouvelle chaîne (§3.2). Le lot composition **re-gate au vert** avec
ce nouveau CONTENU (§9).

---

## 5. Réconciliation — anonymisation du frame + générateur persona→contrat

### 5.1 Anonymisation (frame) ↔ modèle vivant (library)

L'anonymisation a **déjà** fait produit→agnostique, mais **manuellement, une fois, dans une frame
gelée** : `iakaframe-forgejo → iakaframe-git` (`<GIT_HOST>`), `iakaframe-appflowy-doc →
iakaframe-humandoc` (`<DOC_TOOL>`), `iakaframe-naonedge → iakaframe-design`. C'était une
**approximation** : (a) elle **collapsait** capacité + famille en un seul skill à **placeholders** ;
(b) elle **perdait** le produit (le concret Forgejo/AppFlowy disparaissait derrière `<…>`).

Le **modèle en couches rend cette généralisation *first-class* dans le live** :
- La capacité (`gestion-de-source`) est agnostique **sans placeholder** (le concret n'est pas troué,
  il est **délégué**).
- Le produit (`forgejo`) est **conservé** (il n'est plus effacé — il devient la feuille sélectionnable).
- **Impact futur sur le build de frame** (hors ce lot, §10) : au lieu de *renommer+scrubber* un skill,
  le build de frame **émettra la chaîne** — capacité+famille **toujours**, et les produits comme
  **collection optionnelle** que le destinataire (le fils) **sélectionne pour son environnement**. Le
  `<GIT_HOST>` disparaît : le fils installe un produit-skill (Forgejo, ou le sien) au lieu de remplir un
  trou. La règle de déparamétrage (`frame-stefframe1.md §9`) **se simplifie** en conséquence — à
  recadrer au prochain build de frame, **pas ici**.

### 5.2 Générateur persona→contrat (orthogonal — aucun couplage)

Le générateur (`generateur-persona-contrat.md`) produit `~/.claude/agents/<id>.md` depuis
`library/personas/*.md`. Les **personas référencent des skills de rôle/capacité**, **jamais des
produits**. Le modèle en couches **n'affecte pas** le générateur :
- Le produit sélectionné à l'install vit dans la couche **skills** (déploiement `.claude/skills/`),
  **pas** dans le contrat d'agent (`.claude/agents/`).
- `tools`/`description`/`guardrails` du contrat sont inchangés par ce lot.
→ **Aucun réordonnancement** entre les deux : le générateur reste derrière le lot composition ; ce
lot-ci est **parallèle** au générateur (les deux dépendent du mécanisme `subskills`/binding, sans se
dépendre l'un l'autre).

---

## 6. Migration — ordre des opérations (MVP)

**MVP = source-control complet + esquisse des autres. On ne migre PAS tout d'un coup.**

1. **Prérequis** : merge de `modele-composition-tools-sousskills.md` (mécanisme `subskills` en place).
2. **Créer la capacité** `library/skills/iakaframe-gestion-de-source/SKILL.md` — corps agnostique
   (§3.1), `subskills: [iakaframe-git]`.
3. **Créer la famille** `library/skills/iakaframe-git/SKILL.md` — protocole git (commit/remote/push),
   **serveur-agnostique**, `subskills: [iakaframe-forgejo]`. (S'inspirer de la prose de
   `frames/releases/StefFrame2/library/skills/iakaframe-git/` **sans les placeholders**.)
4. **Confirmer** que `iakaframe-forgejo` **reste la feuille inchangée** (couche 3) ; y ajouter
   éventuellement le discriminant `layer: product` (§8.1).
5. **Réécrire** les `subskills` de `iakaframe-init` et `iakaframe-update` (produit → capacité, §4) +
   nettoyer leur corps des mentions Forgejo en dur.
6. **Mettre à jour** `library/skills/README.md` : documenter les 3 couches + tableau capacité→famille→
   produit + la note « le produit se choisit à l'install ».
7. **Vérifier** §9 (agnosticisme, intégrité verte, chaîne résout, lot composition re-gate au vert).

**Ce que la migration NE fait PAS au MVP** (esquisse only) : créer `iakaframe-conteneurisation`,
`iakaframe-memoire-humaine`+`iakaframe-appflowy`, `iakaframe-journal-conversation`+
`iakaframe-mqtt-couchdb`. Ces axes sont **cadrés** (§2.2) mais **implémentés dans des lots suivants**.
`iakaframe-docker`/`appflowy-doc`/`log-conversation`/`naonedge` **restent inchangés** ce coup-ci.

---

## 7. Faits vérifiés (traçabilité — chemin:ligne / URL)

- **Canon** : mémoire projet `skills-agnostiques-layered` (hiérarchie capacité→famille→produit ;
  produits = collection choisie à l'install) — `~/.claude/projects/…/memory/skills-agnostiques-layered.md`.
- **Mécanisme sous-skills** (le véhicule) : `specs/instructions/modele-composition-tools-sousskills.md:225-263`
  (`subskills:[]`, intégrité `⊆skills`, réservoir `skill←skills`, anti-self-ref).
- **Contenu à réécrire** (produits en direct) : `library/skills/iakaframe-init/SKILL.md:5`
  (`subskills: [iakaframe-forgejo, iakaframe-docker, iakaframe-etat-des-lieux]`),
  `library/skills/iakaframe-update/SKILL.md:5` (`[iakaframe-etat-des-lieux, iakaframe-forgejo]`),
  `library/skills/iakaframe-odin/SKILL.md:5` (`[iakastart]` — à garder).
- **Produit existant (couche 3 déjà écrite)** : `library/skills/iakaframe-forgejo/SKILL.md:1-72`
  (Forgejo, iakabox, `192.168.2.11:3001`, `$FORGEJO_TOKEN`, API).
- **Autres produits nommés** : `iakaframe-log-conversation/SKILL.md:4,20-26` (MQTT/CouchDB),
  `iakaframe-appflowy-doc/SKILL.md:4,41-52` (AppFlowy), `iakaframe-docker/SKILL.md:4,14-49` (Docker),
  `iakaframe-naonedge/SKILL.md:4,40-60` (chartes = **patron B**, hors leaf-swap).
- **Patron capacité déjà écrit (anonymisation gelée)** :
  `frames/releases/StefFrame2/library/skills/iakaframe-git/SKILL.md`,
  `.../iakaframe-humandoc/SKILL.md:1-11` (corps agnostique + placeholders `<DOC_TOOL>` à **ne pas**
  reproduire dans le live — le concret se délègue au produit).
- **`etat-des-lieux` agnostique** (invoque `git log`, ne nomme aucun serveur) :
  `library/skills/iakaframe-etat-des-lieux/SKILL.md:20-28`.
- **Générateur orthogonal** (personas → skills de rôle, jamais produits) :
  `specs/instructions/generateur-persona-contrat.md:44-51,154-164`.
- **Fait externe (web, vérifié 2026-07-19)** : Claude Code n'a **pas** de champ natif de composition
  déclarative de skills ; sa « nested skills » est un mécanisme de **découverte par répertoire**
  (monorepo) et « a skill can reference other skills it composes with » reste **informel** (prose /
  fichiers référencés). → notre `subskills:` (modélisation méthode, intégrité `@iakaframe/core`) est
  **orthogonal et additif**, **aucune collision** avec le runtime Claude Code. Sources ci-dessous.

---

## 8. Points que SEUL le décideur tranche

1. **Discriminant de couche** — comment distinguer une feuille produit (alternative sélectionnable)
   d'un sous-skill composé ? **Recommandation** : champ **optionnel** `layer: capacity|family|product`
   au frontmatter `SKILL.md` (absent = `capacity`/brique méthode). Léger, aide GUI + install.
   **Alternative** : inférer de la position (une feuille sous une famille = produit). → trancher.
2. **Résolution à l'install** — **« présence = sélection »** (MVP, zéro schéma : le produit-skill
   déployé dans `.claude/skills/` est l'actif ; recommandé) **vs** champ `products: []` dans le
   kit/binding **vs** champ sur la famille. → trancher.
3. **Périmètre de migration MVP** — **source-control seul** (recommandé, tient l'exemplaire de bout en
   bout) **vs** source-control **+ conteneurisation** (`iakaframe-conteneurisation → docker`, cheap
   2-niveaux, ferait de init un double exemplaire). → choisir.
4. **`iakaframe-git` = famille** (protocole, sans placeholder) confirmé, distinct du `iakaframe-git`
   **gelé** de la frame (qui est une capacité à placeholders) ? **Recommandation** : oui, le live
   sépare `gestion-de-source` (capacité) / `git` (famille) ; la frame se réalignera au prochain build.
   → confirmer.
5. **Journal-conversation composite** — le produit `mqtt+couchdb` est **deux** logiciels (broker +
   store). Un seul skill produit `iakaframe-mqtt-couchdb`, ou deux (`iakaframe-mqtt`,
   `iakaframe-couchdb`) sous une famille « pub-sub + doc-store » ? (esquisse — à trancher au lot dédié).
6. **Renommage `iakaframe-forgejo`** — le garder tel quel (recommandé : id stable, c'est déjà la
   couche 3) ou l'harmoniser. → confirmer.

---

## 9. Critères d'acceptation (testables)

**Agnosticisme des capacités/familles**
- [ ] `iakaframe-gestion-de-source/SKILL.md` et `iakaframe-git/SKILL.md` existent (dossier + `SKILL.md`).
- [ ] **Aucune skill capacité/famille ne nomme un produit ni un placeholder** :
      `grep -riE 'forgejo|iakabox|appflowy|mqtt|couchdb|192\.168|:3001|:1883|:3008|FORGEJO|<[A-Z_]+>' library/skills/iakaframe-gestion-de-source/ library/skills/iakaframe-git/`
      = **0** (le mot **git** — protocole — est toléré dans la famille uniquement).
- [ ] La `description` de `iakaframe-gestion-de-source` décrit la **capacité** (« versionner sur un
      gestionnaire de source »), **sans** nom de serveur.

**La chaîne résout via subskills**
- [ ] `iakaframe-gestion-de-source.subskills == [iakaframe-git]` ;
      `iakaframe-git.subskills == [iakaframe-forgejo]` ; `iakaframe-forgejo` = feuille.
- [ ] **Intégrité verte** : `buildFrame` sur `~/work/iakaframe` → `integrity.ok === true` ; tout id de
      la chaîne ∈ pool `skills` ; anti-self-ref respecté (aucun cycle).
- [ ] Un test « chaîne » : partant de `gestion-de-source`, la fermeture transitive des `subskills`
      atteint `iakaframe-forgejo` (capacité→famille→produit résout de bout en bout).

**Réécriture du lot composition (re-gate au vert)**
- [ ] `iakaframe-init.subskills` **ne contient plus `iakaframe-forgejo`** et contient
      `iakaframe-gestion-de-source` ; idem `iakaframe-update`. `iakaframe-odin` inchangé (`[iakastart]`).
- [ ] Le **corps** de init/update ne mentionne plus « Forgejo » en dur (délégué à la capacité) :
      `grep -i forgejo library/skills/iakaframe-{init,update}/SKILL.md` = **0**.
- [ ] **Mécanisme inchangé confirmé** : `git diff` de `~/work/iakaFrameGUI/packages/core/` **vide**
      pour ce lot (intégrité/réservoir non modifiés) ; la suite `packages/core && npm test` reste verte.

**Produit préservé**
- [ ] `iakaframe-forgejo/SKILL.md` **inchangé dans son corps** (Forgejo/API/token conservés) — le
      produit **garde** sa mécanique concrète (`git diff` limité au seul ajout éventuel `layer:`).

**README**
- [ ] `library/skills/README.md` documente les 3 couches + le tableau capacité→famille→produit + « le
      produit se choisit à l'install ».

**Global**
- [ ] `git status` ne montre **rien** sous `frames/releases/` (frames gelées intactes).
- [ ] Aucune persona modifiée (`git diff library/personas/` vide) — modèle orthogonal au générateur.

---

## 10. Hors périmètre

- **Migration des axes non source-control** : conteneurisation, mémoire-humaine, journal-conversation
  — **cadrés** (§2.2) mais implémentés en **lots suivants**. `docker`/`appflowy-doc`/`log-conversation`
  restent inchangés ce coup-ci.
- **Design (`iakaframe-naonedge`)** : **patron B** (catalogue de données au runtime), **pas** un
  leaf-swap — **hors** ce modèle de sous-skills (§1). Non touché.
- **Recadrage du build de frame** (règle de déparamétrage `frame-stefframe1.md §9` simplifiée par le
  modèle vivant, §5.1) : **au prochain build de frame**, pas ici. Frames gelées **intactes**.
- **Champ `products:` / moteur de résolution d'install** au-delà de « présence = sélection » : incrément
  ultérieur (§8.2).
- **Détection de cycles profonds** de sous-skills, **moteur** de chaînage/exécution : hors MVP (déjà
  hors périmètre du lot composition).
- **Générateur persona→contrat** : orthogonal (§5.2), non touché.

---

## 11. Jalon (gate humain)

```
      _   _    _     ___  _   _
     | | / \  | |   / _ \| \ | |
  _  | |/ _ \ | |  | | | |  \| |
 | |_| / ___ \| |__| |_| | |\  |
  \___/_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `modele-skills-agnostique-couches.md` : **canon** (agnostique du logiciel, produits = collection choisie à l'install) ; **cartographie** (skills nommant un produit + 2 patrons A/B) ; **taxonomie 3 couches** (capacité/famille/produit) + 5 axes (source-control de bout en bout, autres esquissés) ; **conception** (capacité agnostique sans placeholder, `subskills` inchangé exprime la chaîne, collection produit dans la library, résolution à l'install = « présence = sélection ») ; **réécriture du lot composition** (init/update : produit→capacité ; mécanisme cœur inchangé) ; **réconciliation** anonymisation (first-class dans le live) + générateur (orthogonal) ; **migration MVP** ordonnée ; critères testables ; **6 arbitrages décideur** | 🟢 Le décideur (Stéphane) → tranche §8 → valide → dispatch **Gimli** (méthode `library/`) |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Contenu à réécrire : `library/skills/iakaframe-init/SKILL.md:5`, `library/skills/iakaframe-update/SKILL.md:5`, `library/skills/iakaframe-odin/SKILL.md:5`.
- Produit couche 3 (déjà écrit) : `library/skills/iakaframe-forgejo/SKILL.md:1-72`.
- Patron capacité (anonymisation gelée, à imiter SANS placeholder) : `frames/releases/StefFrame2/library/skills/iakaframe-git/SKILL.md`, `.../iakaframe-humandoc/SKILL.md:1-11`.
- Mécanisme (véhicule, inchangé) : `specs/instructions/modele-composition-tools-sousskills.md:225-263`.
- README à mettre à jour : `library/skills/README.md:47-64`.

**Points à trancher au gate (délégués au décideur)** : les **6** de §8 (discriminant `layer:` ;
résolution install « présence = sélection » vs `products:` ; périmètre MVP source-control seul vs +
conteneurisation ; `git` = famille confirmé ; composite journal ; renommage forgejo).

Sources externes : [Extend Claude with skills — Claude Code Docs](https://code.claude.com/docs/en/skills),
[Agent Skills — Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
(pas de composition déclarative native ; « nested skills » = découverte par répertoire ; référence
inter-skills informelle) — vérifié 2026-07-19.

---

## Statut

**EN ATTENTE DE VALIDATION** — cadrage fermé. **6 arbitrages §8.** Dépend du merge de
`modele-composition-tools-sousskills.md` (mécanisme `subskills`). À « JALON VALIDÉ » (+ arbitrages
tranchés + lot composition mergé) → dispatch **Gimli** pour appliquer §6 en passant tous les critères
§9, **sans** toucher `frames/releases/**`, **sans** modifier `@iakaframe/core` (mécanisme inchangé),
et **sans** réécrire le corps de `iakaframe-forgejo` (le produit garde sa mécanique).
