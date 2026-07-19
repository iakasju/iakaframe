# Instruction — Généralisation du modèle agnostique en couches aux axes restants

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (méthode `library/` + README).
> Ordre d'Odin (mode autonome) : le MVP source-control est **déjà livré** (v0.17.9,
> `iakaframe-{gestion-de-source,git,forgejo}` avec champ `layer:`). Ce lot **généralise** le
> même patron capacité→(famille)→produit aux **3 axes leaf-swap restants** — conteneurisation,
> mémoire-humaine, journal-conversation — et **documente** le cas design (patron B, hors leaf-swap).
> Réf. du modèle posé : `specs/instructions/modele-skills-agnostique-couches.md` ;
> chaîne livrée : `library/skills/iakaframe-{gestion-de-source,git,forgejo}/SKILL.md` ;
> mécanisme (véhicule inchangé) : `specs/instructions/modele-composition-tools-sousskills.md`.
> Mémoire canon : `skills-agnostiques-layered`.
> **Zéro nouveau moteur** : on réutilise `subskills:` + le champ `layer:` **à l'identique**.

---

## 0. Besoin (reformulé) + périmètre

**Besoin.** Rendre *first-class* (couche capacité au-dessus d'un produit, comme source-control)
les trois axes leaf-swap encore mono-produit — **conteneurisation**, **mémoire-humaine**,
**journal-conversation** — sans casser les skills orchestratrices / personas qui les référencent,
et **documenter** que l'axe **design** relève du **patron B** (catalogue de données runtime) et
**ne se transforme PAS** en capacité→produit.

**Ce que ce lot FAIT** : pour chaque axe leaf-swap, poser la **capacité agnostique** (corps sans
produit), garder/renommer le **produit** existant (concret préservé), tisser la **chaîne
`subskills`**, repointer les **références orchestratrices/personas** vers la **capacité**, et
donner une **migration ordonnée qui ne casse rien**. Trancher l'arbitrage **`init`→conteneurisation**.

**Ce que ce lot NE FAIT PAS** : coder un moteur, toucher `@iakaframe/core` (intégrité/réservoir
inchangés), réécrire le corps concret des produits (comme forgejo : le produit garde sa mécanique),
migrer le design en capacité→produit, toucher `frames/releases/**`.

---

## 1. Rappel du modèle (déjà posé) — ce que ce lot ajoute

Le modèle en 3 couches est **déjà en production** sur source-control et **documenté** dans
`library/skills/README.md:66-121` :

| Couche | Rôle | Nomme un produit ? | `layer:` | Installée chez l'utilisateur |
|---|---|---|---|---|
| **Capacité** | ce qu'on veut faire (verbe métier) | **jamais** | `capacity` | **toujours** |
| **Famille** | le protocole/standard | le **protocole**, pas le serveur | `family` | toujours (si choisie) |
| **Produit** | l'implémentation concrète | **oui** | `product` | **1, choisi à l'install** |

**Règles cardinales (inchangées)** : (1) une capacité ne nomme **aucun** produit/endpoint/IP/token ;
(2) un produit **doit** nommer son produit et porter la mécanique concrète (c'est sa raison d'être) ;
(3) le choix du produit est une **opération d'install** (« présence = sélection »), pas une propriété
gravée dans la capacité.

**Confirmation mécanisme (aucun code) :** l'intégrité `subskills ⊆ skills` est **library-scoped** —
tous les produits vivent dans la library, donc toute nouvelle chaîne reste **verte**. Anti-self-ref
et réservoir `skill ← skills` **inchangés**. Fait externe revérifié 2026-07-19 : Claude Code n'a
**toujours pas** de champ natif de composition déclarative de skills (composition = découverte par
dossier/description ; le `skills:` d'un subagent **précharge** du contenu, il ne **compose** pas) →
notre `subskills:`/`layer:` (modélisation méthode `@iakaframe/core`) reste **orthogonal et additif**,
**aucune collision** runtime (sources §8).

**Ce que ce lot ajoute** = **trois nouvelles chaînes** bâties sur ce mécanisme, plus la mise au
propre des références. **Rien d'autre.**

---

## 2. Axe CONTENEURISATION

### 2.1 Le modèle

```
iakaframe-conteneurisation    (CAPACITÉ — agnostique : isolation d'environnement par projet)
  └─ subskills: [iakaframe-docker]     (+ iakaframe-podman futur)
       iakaframe-docker         (PRODUIT — nomme Docker/compose ; id CONSERVÉ, corps inchangé)
```

- **Famille** : **aucune au MVP** (2 couches). L'« OCI/compose » comme famille est **différée** :
  fait vérifié (§8) — Podman est **OCI-compliant** mais **pas** un drop-in 100 % (podman-compose
  ≈ 85-90 % du spec compose, `depends_on: condition` non couvert). Donc un futur `iakaframe-podman`
  portera **sa propre** mécanique concrète (leaf-swap classique) ; extraire une famille OCI commune
  n'a de valeur **que** quand le 2ᵉ produit existe → différé, pas au MVP.
- **Capacité `iakaframe-conteneurisation`** (nouveau `SKILL.md`, corps agnostique) : décrit la
  **capacité d'isolation** — « chaque projet tourne dans **sa propre** stack : réseau/volumes/
  containers **préfixés par projet**, **ports hôte distincts** sans collision entre projets ». Elle
  porte les **garde-fous de principe** (aucun partage de stack/réseau/volume/port ; ne jamais
  supprimer le volume d'un autre projet ; MVP = ne conteneuriser que le nécessaire) **sans nommer**
  Docker, compose, Docker Desktop, ni podman. Le mot **« conteneur »** est toléré (c'est la
  capacité) ; les **noms de moteur** ne le sont pas. `layer: capacity`, `subskills: [iakaframe-docker]`.
- **Produit `iakaframe-docker`** : **id conservé** (précédent forgejo : on ne renomme pas un produit
  déjà bien nommé), **corps inchangé** (Docker Desktop, compose, préfixes, ports — sa mécanique
  reste). **Seul ajout** : `layer: product` au frontmatter.

### 2.2 Arbitrage tranché — `init` DOIT-il inclure la stack Docker isolée ?

**VERDICT (recommandation Gandalf) : NON — `init` n'inclut PAS la conteneurisation comme
sous-skill obligatoire.** La capacité `iakaframe-conteneurisation` reste une **étape distincte,
conditionnelle**, invoquée **après l'amorçage, avant le dev**, uniquement quand le projet a un
**runtime** à isoler. La prose de `init` gagne un **renvoi conditionnel** (cross-référence) vers
la capacité — **pas** une entrée dans `subskills`.

**Justification (5 points) :**
1. **Tous les projets n'ont pas de runtime.** Une library, un dépôt de docs, un CLI, le dépôt de la
   méthode iakaframe lui-même n'ont **aucun** service à conteneuriser. Poser un `docker-compose`
   d'office à l'onboard produirait des **stacks vides/du bruit** — violation directe de « MVP
   d'abord, pas de sur-ingénierie ».
2. **La convention « isolation Docker par projet » contraint le COMMENT, pas le QUAND.** Elle dit :
   *lorsqu'*on conteneurise, c'est **par projet**, sans partage. Ce n'est **pas** un mandat que
   *chaque* projet livre une stack à t0. La capacité matérialise l'isolation quand elle a lieu.
3. **La skill produit se positionne déjà ainsi** : `iakaframe-docker/SKILL.md:65,69` — « MVP
   d'abord : ne conteneuriser que les services réellement nécessaires » et « Posée tôt (**après
   l'amorçage, avant le dev**) ». La conteneurisation est **conditionnelle et post-onboard** par
   construction.
4. **`init` délègue au CLI `iakaframe onboard`** (source de vérité, `iakaframe-init/SKILL.md:20`),
   qui **ne scaffolde pas** de Docker. Faire piloter Docker par la **prose** de `init` créerait une
   **dérive** entre la prose et le CLI. On garde les deux alignés.
5. **Couches propres** : `init` = structure **méthode** (specs/CLAUDE/scripts/remote/snapshot) ;
   `conteneurisation` = environnement **runtime** — deux préoccupations distinctes, chacune son
   déclencheur. Un sous-skill obligatoire mélangerait les deux.

**Ce que `init` gagne quand même (pour honorer la convention forte)** : dans sa **procédure**, une
étape **conditionnelle** — *« Si le projet a un runtime (services, base, web) → poser la stack
isolée via la **capacité `iakaframe-conteneurisation`** (réseau/volumes/ports distincts par projet).
Sinon, sauter. »* C'est une **cross-référence en prose vers la CAPACITÉ** (jamais vers `iakaframe-docker`
en direct), **hors `subskills`** (car `subskills` = composition **toujours-incluse**, ce qui n'est pas
le cas d'une étape conditionnelle).

> **Pourquoi pas dans `subskills` même « conditionnel »** : `subskills` n'a **aucun** bit
> « optionnel/conditionnel ». Le contrat sémantique est « composé = toujours inclus » (cf.
> `modele-skills-agnostique-couches.md:189-191`). Y mettre une capacité conditionnelle mentirait sur
> le contrat. La prose porte la condition ; `subskills` porte l'obligatoire. `init.subskills` reste
> donc `[iakaframe-gestion-de-source, iakaframe-etat-des-lieux]` — **inchangé**.

### 2.3 Migration (conteneurisation)

1. Créer `library/skills/iakaframe-conteneurisation/SKILL.md` — corps agnostique, `layer: capacity`,
   `subskills: [iakaframe-docker]`.
2. Ajouter `layer: product` au frontmatter de `iakaframe-docker/SKILL.md` (corps **inchangé**).
3. Ajouter à la **prose** de `iakaframe-init/SKILL.md` (procédure) l'étape conditionnelle 2.2 —
   renvoi vers la **capacité** `iakaframe-conteneurisation`. **Ne pas** modifier `init.subskills`.
4. Mettre à jour `library/skills/README.md` : passer la ligne conteneurisation de « esquisse, non
   migré » à **livré** (chaîne capacité→produit).

**Rayon d'impact** : aucune persona ne référence `iakaframe-docker` ; supports générés
(`iakaframe-skills.html`, `iakaframe-chapeau.html`, `methode-de-travail.html`, `docs/*`) se
régénèrent au `snapshot` (hors périmètre code). Impact live minimal.

---

## 3. Axe MÉMOIRE-HUMAINE

### 3.1 Le modèle

```
iakaframe-memoire-humaine     (CAPACITÉ — agnostique : tenir la mémoire humaine du projet)
  └─ subskills: [iakaframe-appflowy]
       iakaframe-appflowy       (PRODUIT — nomme AppFlowy ; renommé depuis iakaframe-appflowy-doc)
```

- **Famille** : **aucune** (rien de réutilisable entre produits — un « doc-store humain » n'a pas de
  protocole standard partagé façon git/MQTT). 2 couches.
- **Capacité `iakaframe-memoire-humaine`** (nouveau) : décrit le **quoi** — « publier/rafraîchir la
  mémoire humaine d'un projet : **un espace par projet → une vue d'ensemble → une sous-page par doc
  structurant**, **idempotent et non destructif** ; périmètre = docs structurants (`CLAUDE.md`,
  `specs/PROJET.md`, `specs/instructions/*`, `specs/etat-des-lieux.md`, `docs/qualite/*`), **jamais
  le code** ». Garde-fous de principe : **jamais de secret en clair ni commité**, config par
  variables d'environnement (**sans nommer** lesquelles). **Zéro** mention d'AppFlowy/endpoint/IP.
  `layer: capacity`, `subskills: [iakaframe-appflowy]`.
- **Produit `iakaframe-appflowy`** : le corps concret d'`iakaframe-appflowy-doc` **inchangé**
  (AppFlowy, `192.168.2.14:3008`, endpoints `/api/workspace/…`, cascade d'identifiants, `appflowy-doc.mjs`),
  `layer: product` ajouté.

### 3.2 Nathalie — référence-t-elle la capacité ou le produit ? (préservation)

**Constat.** Aujourd'hui **Nathalie référence le PRODUIT** à **deux** endroits :
- `library/personas/nathalie.md:8` — `skills: [iakaframe-nathalie, iakaframe-appflowy-doc]` (champ
  persona multi-skills) ;
- `library/skills/iakaframe-nathalie/SKILL.md:54,59,65` — prose + **chemin de script**
  `~/.claude/skills/iakaframe-appflowy-doc/appflowy-doc.mjs`.

**Principe du modèle.** Une persona/un orchestrateur référence une **CAPACITÉ**, jamais un produit
(exactement comme `init`/`update` réfèrent `iakaframe-gestion-de-source`, pas `iakaframe-forgejo`).
Donc **Nathalie doit référencer `iakaframe-memoire-humaine`** ; la chaîne résout vers le produit
installé (présence = sélection).

**Préservation — le point clé : repointer Nathalie vers la CAPACITÉ la DÉCOUPLE du produit.**
Une fois `nathalie.md:8` passé à `[iakaframe-nathalie, iakaframe-memoire-humaine]`, Nathalie **ne
nomme plus aucun produit** — donc un éventuel renommage `appflowy-doc → appflowy` lui est **invisible**.
C'est ce découplage qui « ne casse pas la référence de Nathalie » : elle monte d'un cran, au niveau
agnostique.

**Le corps du rôle `iakaframe-nathalie`** garde l'**exemple d'invocation concret** (`appflowy-doc.mjs`) —
c'est légitime pour une skill de rôle de montrer l'outil réel — mais **encadré** : « via la capacité
**mémoire-humaine** → le produit installé (ici AppFlowy) porte le CLI ». Le **chemin de script** suit
le nom de dossier du produit (voir arbitrage rename ci-dessous).

### 3.3 Rename du produit — arbitrage

**Recommandation Gandalf : RENOMMER `iakaframe-appflowy-doc → iakaframe-appflowy`.** Raison : le
suffixe `-doc` est un **résidu de capacité** (documenter = la mémoire humaine, désormais hissée dans
`iakaframe-memoire-humaine`) ; le produit pur est **AppFlowy**. C'est **plus justifié** que pour
forgejo (dont l'id était déjà un nom de produit pur, donc conservé).

**Rayon d'impact du rename (à traiter atomiquement, même commit)** : dossier + id/name du `SKILL.md` ;
chemin de script dans `iakaframe-nathalie/SKILL.md:59` (`…/iakaframe-appflowy/appflowy-doc.mjs`, le
**nom** de script `appflowy-doc.mjs` **reste** — seul le dossier change) ; `README.md` ; supports
générés (régénérés au snapshot, hors code). Le champ persona `nathalie.md:8` pointe **la capacité**
(pas le produit) — donc le rename ne le touche pas.

**Fallback zéro-risque (si le décideur préfère)** : **conserver l'id `iakaframe-appflowy-doc`**
(précédent forgejo, churn minimal — le chemin de script et les supports restent valides). Dans ce
cas, seuls **deux** changements suffisent : créer la capacité + repointer `nathalie.md:8` vers la
capacité. La capacité s'appelle quand même `iakaframe-memoire-humaine` ; le produit garde son id.

### 3.4 Migration (mémoire-humaine) — ordre atomique

1. Créer `library/skills/iakaframe-memoire-humaine/SKILL.md` — corps agnostique, `layer: capacity`,
   `subskills: [iakaframe-appflowy]` (ou `[iakaframe-appflowy-doc]` en fallback 3.3).
2. (Si rename) `git mv library/skills/iakaframe-appflowy-doc → …/iakaframe-appflowy` ; MAJ
   `id`/`name` du `SKILL.md` ; `layer: product`. Corps **inchangé**. Script `appflowy-doc.mjs` **gardé**.
3. Repointer `library/personas/nathalie.md:8` → `[iakaframe-nathalie, iakaframe-memoire-humaine]`.
4. MAJ prose `iakaframe-nathalie/SKILL.md:54,59,65` : encadrer l'invocation par la **capacité** +
   corriger le chemin de dossier (si rename).
5. MAJ `README.md` (ligne mémoire humaine → livré).

> **Atomicité obligatoire** : les étapes 2+3 dans le **même commit** — sinon, entre les deux,
> `nathalie.skills` pointerait un id disparu → intégrité **rouge**. En livrant capacité+repoint
> ensemble, l'intégrité reste **verte** à chaque commit.

---

## 4. Axe JOURNAL-CONVERSATION

### 4.1 Le modèle

```
iakaframe-journal-conversation  (CAPACITÉ — agnostique : tracer un échange en main courante)
  └─ subskills: [iakaframe-mqtt-couchdb]
       iakaframe-mqtt-couchdb     (PRODUIT composite — nomme MQTT+CouchDB ; renommé de log-conversation)
```

### 4.2 Décision — 1 skill produit composite OU 2 (pub-sub + store) ?

**Recommandation Gandalf : UN produit composite `iakaframe-mqtt-couchdb` au MVP.** Justification :

1. **Le chemin d'écriture de l'agent est MQTT-seul.** L'outil `iakalog.mjs` **publie sur MQTT** ;
   la persistance CouchDB est faite par un **pont côté serveur** (infra iakaboxlogs), que l'agent
   **n'invoque jamais**. Un `iakaframe-couchdb` produit séparé serait une **feuille fantôme** —
   jamais appelée au write-path. Splitter maintenant crée une couche morte.
2. **Un seul outil, une seule famille de config.** `iakalog.mjs` (Node zéro-dép) + les variables
   `IAKALOG_*` forment **un** produit cohérent = **la stack déployée « iakaboxlogs »** (Mosquitto +
   CouchDB + pont). Du point de vue **méthode**, c'est **un** produit.
3. **MVP, pas de sur-ingénierie.** La combinatoire broker×store (MQTT+Postgres, NATS+CouchDB…) est
   précisément ce qu'on **n'anticipe pas** tant qu'un 2ᵉ backend n'existe pas.

**Le split en 2 (famille pub-sub + famille doc-store) est la bonne évolution — DIFFÉRÉE.** Fait
vérifié (§8) : **MQTT est un standard ISO (ISO/IEC 20922), vendor-neutral**, brokers interchangeables
au niveau protocole (Mosquitto↔EMQX). Donc **le jour où** un 2ᵉ broker/store apparaît, la refonte
propre est : **famille `iakaframe-mqtt`** (protocole pub-sub) coiffant des **produits broker**
(`iakaframe-mosquitto`, `iakaframe-emqx`), et symétriquement une **famille doc-store**. Au MVP,
**aucune famille** : capacité → produit composite (2 couches), comme mémoire-humaine.

- **Capacité `iakaframe-journal-conversation`** (nouveau) : « tracer un **message de conversation**
  (utilisateur↔agent, agent↔agent) dans une **main courante centralisée** : publier l'échange, le
  **persister**, le rendre **consultable** ; **échec propre non bloquant** si l'infra est absente ;
  **secret jamais commité** (config par env) ». **Zéro** mention de MQTT/CouchDB/Mosquitto/topic/port.
  `layer: capacity`, `subskills: [iakaframe-mqtt-couchdb]`.
- **Produit `iakaframe-mqtt-couchdb`** : corps concret d'`iakaframe-log-conversation` **inchangé**
  (MQTT `mqtt://192.168.2.11:1883`, CouchDB, topics, `IAKALOG_*`, `iakalog.mjs` **gardé**),
  `layer: product` ajouté.

### 4.3 Migration (journal-conversation)

1. Créer `library/skills/iakaframe-journal-conversation/SKILL.md` — corps agnostique, `layer: capacity`,
   `subskills: [iakaframe-mqtt-couchdb]`.
2. `git mv library/skills/iakaframe-log-conversation → …/iakaframe-mqtt-couchdb` ; MAJ `id`/`name` ;
   `layer: product`. Corps **inchangé**. Script `iakalog.mjs` **gardé**.
3. MAJ `README.md` (ligne journal → livré).

**Rayon d'impact** : **aucune persona** ne référence `iakaframe-log-conversation` (brique transverse,
appelée éventuellement par un hook `Stop`/`UserPromptSubmit`, pas listée dans un `skills:` de
persona) → rename **à faible risque**. Les instructions historiques (`appflowy-doc-skill.md:13,101`,
`lot1-*:99`, `nathalie-expertise-analyse.md`) citent l'ancien id comme **calque de référence** : ce
sont des **docs d'archive**, **non modifiées** (elles décrivent un état passé). Supports générés :
régénérés au snapshot.

> **Renommage optionnel** ici aussi : si le décideur préfère le churn minimal, conserver
> `iakaframe-log-conversation` comme id produit et ne créer que la capacité au-dessus (fallback
> identique à 3.3). Recommandation = rename (nomme le concret ; le résidu de capacité `-log-…` monte
> dans la capacité `journal-conversation`).

---

## 5. Axe DESIGN — patron B (documenté, NON migré)

**Rappel cadré, à ne PAS traiter comme un leaf-swap.** `iakaframe-naonedge` (agent Loki) est **déjà**
agnostique — mais par **patron B (catalogue de données au runtime)**, pas par chaîne de sous-skills :

- La **charte est de la DONNÉE** (`design-*/` : `<nom>-charte.md`, `<nom>.css`, gabarits), **pas un
  skill**. Le « produit » (une charte) se **résout au runtime** selon le contexte
  (`iakaframe-naonedge/SKILL.md:26-38` — dev logiciel → Studio clair ; NaonEdge → NaonEdge ;
  conseil → Cinabre). Une nouvelle charte = un nouveau dossier `design-*/`, connu **automatiquement**,
  **sans** toucher la skill.
- **Conséquence** : le design **n'a PAS besoin** de la chaîne capacité→produit ni du champ `layer:`.
  On **NE crée PAS** de capacité `iakaframe-design`, on **NE renomme PAS** `iakaframe-naonedge`, on
  **NE le migre PAS**. Il reste **hors** de ce modèle.
- **Action de ce lot sur le design = documentaire uniquement** : réaffirmer dans `README.md` (déjà en
  place, `README.md:104-121`) que design = **patron B**, **non migré, hors leaf-swap**. Aucune
  modification de `iakaframe-naonedge/SKILL.md`.

> **Pourquoi le rappeler** : le réflexe « tout axe devient capacité→produit » est le piège. Le design
> prouve que l'agnosticisme a **deux** patrons (A = leaf-swap de skill ; B = catalogue de données) et
> que forcer B dans A serait une **régression** (on transformerait de la donnée en skills figés).

---

## 6. Impact récapitulatif sur orchestrateurs & personas

| Référence | Avant | Après | Passe par |
|---|---|---|---|
| `iakaframe-init.subskills` | `[gestion-de-source, etat-des-lieux]` | **inchangé** | — (conteneurisation = prose conditionnelle, §2.2) |
| `iakaframe-init` (prose) | pas de Docker | + étape conditionnelle → **capacité** `iakaframe-conteneurisation` | capacité |
| `iakaframe-update.subskills` | `[etat-des-lieux, gestion-de-source]` | **inchangé** | capacité (déjà) |
| `nathalie.md:8` (persona `skills:`) | `[…, iakaframe-appflowy-doc]` (**produit**) | `[…, iakaframe-memoire-humaine]` (**capacité**) | capacité |
| `iakaframe-nathalie/SKILL.md` (prose) | invoque `appflowy-doc` en direct | encadré « via capacité mémoire-humaine → produit installé » | capacité |
| journal (aucune persona) | — | — | capacité (via hook éventuel) |

**Invariant** : **aucune** persona ni skill orchestratrice ne nomme plus un **produit** — toutes
réfèrent une **capacité**. Les produits ne sont nommés que par eux-mêmes (couche 3).

---

## 7. Migration globale — ordre (ne rien casser)

Chaque axe est **indépendant** (aucune dépendance croisée) ; on peut les livrer en **3 commits
atomiques** distincts, chacun laissant l'intégrité **verte**. Ordre recommandé (du moins au plus
« à rayon d'impact ») :

1. **Conteneurisation** (aucune persona touchée) : capacité + `layer:` docker + prose init. Commit.
2. **Journal** (aucune persona touchée) : capacité + rename produit. Commit.
3. **Mémoire-humaine** (touche Nathalie — **atomique** capacité+repoint+rename+prose rôle). Commit.
4. **README** : bascule des 3 lignes « esquisse » → « livré » + réaffirmer design = patron B
   (peut être fusionné dans chaque commit d'axe, ou en clôture).
5. **Vérifier §10** (agnosticisme, chaînes, intégrité verte, références montées en capacité).

**Règles de non-casse** : (a) créer la **capacité AVANT** de repointer une référence ; (b) rename
produit + repoint persona **dans le même commit** ; (c) **corps des produits inchangés** ; (d)
**ne pas** toucher `frames/releases/**` ni `@iakaframe/core` ; (e) `subskills` d'init/update
**inchangés**.

---

## 8. Faits vérifiés (traçabilité — chemin:ligne / URL)

**Internes (chemin:ligne) :**
- Modèle posé + règles cardinales : `specs/instructions/modele-skills-agnostique-couches.md:29-52,86-97`.
- Chaîne source-control livrée (patron à imiter) : `library/skills/iakaframe-gestion-de-source/SKILL.md:1-7`,
  `library/skills/iakaframe-git/SKILL.md:1-7`, `library/skills/iakaframe-forgejo/SKILL.md:1-6`.
- Champ `layer:` + « présence = sélection » documentés : `library/skills/README.md:66-121`.
- Produit conteneurisation (positionné post-onboard, conditionnel) : `library/skills/iakaframe-docker/SKILL.md:65,69`.
- `init` délègue au CLI (pas de Docker scaffoldé) : `library/skills/iakaframe-init/SKILL.md:20`, `subskills:5`.
- Nathalie référence le **produit** (2 endroits) : `library/personas/nathalie.md:8`,
  `library/skills/iakaframe-nathalie/SKILL.md:54,59,65`.
- Produit mémoire-humaine (concret à préserver) : `library/skills/iakaframe-appflowy-doc/SKILL.md:4,41-52,76-89`.
- Produit journal (concret à préserver ; write-path MQTT, CouchDB via pont) :
  `library/skills/iakaframe-log-conversation/SKILL.md:4,9-11,20-26`.
- Design = patron B (charte = donnée, résolue runtime) : `library/skills/iakaframe-naonedge/SKILL.md:13-38`,
  `library/skills/README.md:104-121`.
- Mécanisme inchangé (véhicule) : `specs/instructions/modele-composition-tools-sousskills.md:225-263`.

**Externes (URL, vérifiés 2026-07-19) :**
- **Claude Code — pas de composition déclarative native** (skills = découverte par dossier/description ;
  le `skills:` d'un subagent **précharge**, ne **compose** pas) → `subskills:`/`layer:` restent
  orthogonaux/additifs : [Extend Claude with skills](https://code.claude.com/docs/en/skills),
  [Agent Skills — Claude Platform](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview),
  [Claude Code Skills Complete Guide 2026](https://duet.so/guides/claude-code-skills-complete-guide).
- **Podman OCI-compliant mais pas drop-in 100 %** (podman-compose ≈ 85-90 % du spec ; `depends_on:
  condition` non couvert) → un futur produit conteneurisation porte son propre concret ; famille OCI
  différée : [OCI Explained: Docker & Podman](https://medium.com/@sampras343/oci-explained-how-docker-and-podman-speak-the-same-container-language-with-examples-5d997515c14d),
  [Docker vs Podman 2026 migration](https://dev.to/pockit_tools/docker-vs-podman-in-2026-the-complete-migration-guide-nobody-asked-for-but-everyone-needs-1bpa),
  [Podman: Not a Drop-In Replacement](https://tangentsoft.com/podman/wiki?name=Not+a+Drop-In+Replacement).
- **MQTT = standard ISO (ISO/IEC 20922), vendor-neutral, brokers interchangeables au protocole** →
  famille `iakaframe-mqtt` future justifiée mais différée ; composite au MVP :
  [Comparison of MQTT implementations — Wikipedia](https://en.wikipedia.org/wiki/Comparison_of_MQTT_implementations),
  [EMQX vs Mosquitto — MQTT broker comparison](https://www.emqx.com/en/blog/emqx-vs-mosquitto-2023-mqtt-broker-comparison).

---

## 9. Points que SEUL le décideur tranche

1. **`init`→conteneurisation** — recommandation **NON** (pas de sous-skill ; cross-référence prose
   conditionnelle, §2.2). Confirmer.
2. **Rename produit mémoire-humaine** — recommandation **`appflowy-doc → appflowy`** (§3.3) vs
   **fallback keep-id**. Trancher.
3. **Rename produit journal** — recommandation **`log-conversation → mqtt-couchdb`** (§4.3) vs
   **fallback keep-id**. Trancher.
4. **Journal : composite vs split** — recommandation **1 produit composite `iakaframe-mqtt-couchdb`**
   au MVP (split famille pub-sub / doc-store différé, §4.2). Confirmer.
5. **Familles au MVP** — recommandation **aucune** pour les 3 axes (2 couches capacité→produit ;
   familles OCI/MQTT différées jusqu'au 2ᵉ produit). Confirmer.
6. **Design** — confirmer qu'il reste **patron B, NON migré**, documentaire seulement (§5).

---

## 10. Critères d'acceptation (testables)

**Aucune capacité ne nomme un produit**
- [ ] `grep -riE 'docker|compose|podman|\bOCI\b' library/skills/iakaframe-conteneurisation/` = **0**
      (le mot « conteneur » toléré).
- [ ] `grep -riE 'appflowy|192\.168|:3008|APPFLOWY' library/skills/iakaframe-memoire-humaine/` = **0**.
- [ ] `grep -riE 'mqtt|couchdb|mosquitto|:1883|IAKALOG|topic' library/skills/iakaframe-journal-conversation/` = **0**.
- [ ] Chaque capacité a `layer: capacity` ; sa `description` décrit la **capacité** sans nom de produit.

**Les chaînes résolvent (fermeture transitive via `subskills`)**
- [ ] `iakaframe-conteneurisation.subskills == [iakaframe-docker]` ; docker = feuille `layer: product`.
- [ ] `iakaframe-memoire-humaine.subskills == [iakaframe-appflowy]` (ou `[…-appflowy-doc]` fallback) ;
      produit = feuille `layer: product`.
- [ ] `iakaframe-journal-conversation.subskills == [iakaframe-mqtt-couchdb]` (ou `[…-log-conversation]`
      fallback) ; produit = feuille `layer: product`.
- [ ] Partant de chaque capacité, la fermeture transitive atteint son produit (capacité→produit résout).

**Les références orchestratrices/personas passent par la CAPACITÉ**
- [ ] `library/personas/nathalie.md` — `skills:` contient **`iakaframe-memoire-humaine`** et **plus
      aucun** id produit ; `grep -iE 'appflowy' library/personas/nathalie.md` ne cite plus le produit
      dans `skills:`.
- [ ] **Aucune persona** ne nomme un produit dans son `skills:` :
      `grep -rE 'skills:.*(forgejo|docker|appflowy|mqtt|couchdb|log-conversation)' library/personas/` = **0**.
- [ ] `iakaframe-init.subskills` et `iakaframe-update.subskills` **inchangés** ; la prose d'`init`
      renvoie à la **capacité** `iakaframe-conteneurisation` (pas à `iakaframe-docker`) :
      `grep -i 'iakaframe-docker' library/skills/iakaframe-init/SKILL.md` = **0**.

**Intégrité verte / mécanisme inchangé**
- [ ] `buildFrame` sur `~/work/iakaframe` → `integrity.ok === true` (tout id de chaîne ∈ pool `skills` ;
      anti-self-ref ; aucun cycle).
- [ ] `git diff` de `@iakaframe/core` (`frame.ts`/`reservoir.ts`) **vide** pour ce lot.

**Produits préservés (concret intact)**
- [ ] Corps de `iakaframe-docker`, du produit mémoire-humaine et du produit journal **inchangés**
      hors ajout `layer: product` + (si rename) `id`/`name`/dossier : `git diff` limité à ces lignes.
- [ ] Scripts `appflowy-doc.mjs` et `iakalog.mjs` **présents et inchangés** dans leur dossier produit.

**Design non migré (patron B)**
- [ ] **Aucune** capacité `iakaframe-design` créée ; `iakaframe-naonedge/SKILL.md` **inchangé**
      (`git diff` vide).
- [ ] `README.md` documente design = **patron B, hors leaf-swap, non migré**.

**README & global**
- [ ] `README.md` : les 3 lignes conteneurisation/mémoire/journal passent de « esquisse, non migré » à
      **livré** (chaîne capacité→produit).
- [ ] `git status` ne montre **rien** sous `frames/releases/` ; `git diff library/personas/` limité à
      `nathalie.md` (repoint).

---

## 11. Hors périmètre

- **Familles OCI/compose et pub-sub/doc-store** : différées jusqu'au 2ᵉ produit (podman ; 2ᵉ
  broker/store). Cadrées (§2.1, §4.2), non créées ici.
- **2ᵉ produit de chaque axe** (`iakaframe-podman`, `iakaframe-github`/`gitlab`, `iakaframe-emqx`,
  autre doc-store humain) : lots ultérieurs.
- **Champ `products:` / moteur de résolution d'install** au-delà de « présence = sélection » :
  incrément ultérieur (déjà hors périmètre du lot modèle).
- **Câblage automatique** de la mémoire-humaine / du journal dans `snapshot`/`update` ou via hook :
  reste tel quel (déjà différé, `iakaframe-appflowy-doc/SKILL.md:109-114`).
- **Régénération des supports HTML/docs** (`iakaframe-skills.html`, `iakaframe-chapeau.html`,
  `methode-de-travail.*`, `docs/*`) : se fait au `snapshot`/`update`, hors ce lot code.
- **Instructions d'archive** citant les anciens ids comme calque (`appflowy-doc-skill.md`,
  `lot1-*`, `nathalie-expertise-analyse.md`, `frame-stefframe1.md`, `resync-stefframe2-miroir-live.md`) :
  **non modifiées** (elles décrivent un état passé).
- **Design** : patron B, **non migré** (§5).
- **`@iakaframe/core`** : intégrité/réservoir **inchangés**.

---

## 12. Jalon (gate humain)

```
      _   _    _     ___  _   _
     | | / \  | |   / _ \| \ | |
  _  | |/ _ \ | |  | | | |  \| |
 | |_| / ___ \| |__| |_| | |\  |
  \___/_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `generalisation-agnostique-axes.md` : généralise le patron capacité→produit aux **3 axes leaf-swap restants** — **conteneurisation** (`iakaframe-conteneurisation → iakaframe-docker`), **mémoire-humaine** (`iakaframe-memoire-humaine → iakaframe-appflowy`, Nathalie repointée sur la **capacité**), **journal** (`iakaframe-journal-conversation → iakaframe-mqtt-couchdb` composite) ; **design documenté patron B (non migré)** ; arbitrage **`init`→conteneurisation = NON (prose conditionnelle, hors subskills)** ; migration ordonnée non-cassante ; critères testables ; **6 arbitrages décideur** | 🟢 Le décideur (Stéphane) → tranche §9 → valide → dispatch **Gimli** (méthode `library/`) |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Nathalie (référence produit à monter en capacité) : `library/personas/nathalie.md:8`,
  `library/skills/iakaframe-nathalie/SKILL.md:54,59,65`.
- Produits à préserver (concret) + `layer:` à ajouter : `library/skills/iakaframe-docker/SKILL.md:1-5`,
  `library/skills/iakaframe-appflowy-doc/SKILL.md:1-6`, `library/skills/iakaframe-log-conversation/SKILL.md:1-5`.
- Orchestrateur init (prose conditionnelle, subskills inchangés) : `library/skills/iakaframe-init/SKILL.md:5,49-60`.
- Design intact (patron B) : `library/skills/iakaframe-naonedge/SKILL.md:1-38`, `library/skills/README.md:104-121`.
- Patron à imiter (chaîne source-control livrée) : `library/skills/iakaframe-gestion-de-source/SKILL.md`,
  `library/skills/iakaframe-git/SKILL.md`.

**Points à trancher au gate** : les **6** de §9 (init→conteneurisation NON ; rename appflowy ;
rename log-conversation ; journal composite vs split ; aucune famille au MVP ; design patron B non migré).

---

## Statut

**EN ATTENTE DE VALIDATION** — cadrage fermé. **6 arbitrages §9.** Réutilise `subskills`/`layer:`
**à l'identique** (zéro nouveau moteur, `@iakaframe/core` intact). À « JALON VALIDÉ » (+ arbitrages
tranchés) → dispatch **Gimli** pour appliquer §7 en passant tous les critères §10, **sans** toucher
`frames/releases/**` ni `@iakaframe/core`, **sans** réécrire le corps des produits, et **sans**
migrer le design (patron B).
