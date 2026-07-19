# Skills iakaframe — Le savoir-faire de l'équipe d'agents

**Vingt-deux skills Claude** qui rendent la méthode iakaframe exécutable. Depuis la formalisation
de l'**équipe d'agents**, une skill = le **savoir-faire d'un agent** (sa méthode détaillée),
ou une **brique de cycle de vie** transverse. Le subagent (`agents/<nom>.md`) est le
*contrat* ; la skill est la *méthode*.

> Vue d'ensemble de l'équipe : `../specs/equipe-agents.md` · présentation : `../iakaframe-methode.html`.

## Installation

Dépose chaque dossier `iakaframe-*` dans ton répertoire de skills :
- **Claude Code** : `~/.claude/skills/` (global) ou `.claude/skills/` (projet)
- **Cowork** : via le panneau des skills

Le plus simple : `iakaframe-agents.ps1 -Action fullteam -Project <chemin>` dépose agents +
skills dans un projet. Chaque skill se déclenche quand le contexte correspond à sa description.

## Skills de rôle — les agents (7)

| Skill | Agent | Rôle |
|---|---|---|
| `iakaframe-odin` | 🦅 Odin | Super-agent **portefeuille** : switch d'équipe, démarrage projet, création d'équipe (seul à `C:\work`) |
| `iakaframe-aragorn` | 🛡️ Aragorn | Coordination entre agents, 3 phases + squad prod, dispatch à la demande, canal Slack |
| `iakaframe-cadrage` | 🧙 Gandalf | P1 — cadrage : besoin → instruction fermée |
| `iakaframe-qualite` | 🏹 Legolas | P2 / P3 — qualité / test, gate auto |
| `iakaframe-deploiement` | 🌉 Helm | Squad prod — déploiement, accès, rollback, surveillance, alertes |
| `iakaframe-naonedge` | 🎭 Loki | Design : supports on-brand (catalogue de chartes `design-*/`) |
| `iakaframe-nathalie` | 📖 Nathalie | Guides utilisateurs / documentation |

> ⚒️ **Gimli** (développement + devops, P2 → P3) n'a **pas** de skill dédiée : il est porté par le
> `CLAUDE.md` du projet et l'outillage.

## Skills méthode & briques (15)

| Skill | Couche | Rôle / brique | Se déclenche quand… |
|---|---|---|---|
| `iakaframe-init` | — | Amorçage | démarrer / mettre en place la méthode sur un projet |
| `iakaframe-etat-des-lieux` | — | Cycle de doc (lecture) | « où en est le projet », « fais le point », reprise |
| `iakaframe-update` | — | Cycle de doc (écriture) | « update iakaframe », « checkpoint », « commit global », « pousse tout » |
| `iakastart` | — | Bootstrap team (banner + roster, sans spawn) | « iakastart », « iakaframe », « odin » |
| `iakaframe-learning` | — | Surface `/learning` (revue du réservoir d'apprentissage) | « /learning », revoir les apprentissages |
| `iakaframe-retrait` | — | Surface `/retrait` (détacher/retirer un élément matérialisé) | « /retrait », retirer un élément |
| `iakaframe-gestion-de-source` | capacité | Source-control (agnostique du serveur) | « versionner le projet », « committer », init/update |
| `iakaframe-git` | famille | Protocole git (nomme git, pas le serveur) | « committer », « brancher le remote », « pousser » |
| `iakaframe-forgejo` | produit | Git par défaut (iakabox) | « créer le dépôt », « brancher Forgejo », « pousser sur iakabox » |
| `iakaframe-conteneurisation` | capacité | Isolation d'environnement (agnostique du moteur) | « isoler la stack », « cloisonner l'environnement », « allouer les ports » |
| `iakaframe-docker` | produit | Stack isolée par projet | « dockeriser », « docker-compose », « allouer les ports » |
| `iakaframe-memoire-humaine` | capacité | Mémoire humaine (agnostique du produit) | « publier la mémoire humaine », « documenter le projet hors dépôt » |
| `iakaframe-appflowy-doc` | produit | Mémoire humaine (AppFlowy) | « documenter dans AppFlowy », « mettre à jour la mémoire humaine » |
| `iakaframe-journal-conversation` | capacité | Main courante des IA (agnostique du transport) | « logguer la conversation », « tracer cet échange » |
| `iakaframe-log-conversation` | produit | Main courante des IA (push MQTT→CouchDB) | « logguer la conversation », « tracer cet échange », « alimenter la main courante » |

> Référence visuelle : `../iakaframe-skills.html` (style NaonEdge).

## Sous-skills — une skill peut en composer d'autres (`subskills`)

Certaines skills sont des **orchestratrices** : elles pilotent d'autres skills plutôt que de tout
refaire. Cette composition est structurée par le champ **`subskills:`** du frontmatter `SKILL.md`
(liste d'**ids** de skills existantes — que des ids, aucun corps recopié). Champ **optionnel** :
absent = skill **atomique** (le cas par défaut). Miroir, au niveau skill, de « method → ids » et
« team → personas ».

| Skill orchestratrice | `subskills` | Ce qu'elle pilote |
|---|---|---|
| `iakaframe-init` | `iakaframe-gestion-de-source`, `iakaframe-etat-des-lieux` | amorçage : mise sous gestion de source (capacité), premier état des lieux |
| `iakaframe-update` | `iakaframe-etat-des-lieux`, `iakaframe-gestion-de-source` | checkpoint : snapshot + versionnement via la capacité source-control |
| `iakaframe-odin` | `iakastart` | le portefeuille lève d'abord la team (bootstrap) |
| `iakaframe-gestion-de-source` | `iakaframe-git` | capacité source-control → famille protocole git |
| `iakaframe-git` | `iakaframe-forgejo` | famille git → produit hébergeur (Forgejo par défaut) |
| `iakaframe-conteneurisation` | `iakaframe-docker` | capacité isolation → produit moteur de conteneurs (Docker par défaut) |
| `iakaframe-memoire-humaine` | `iakaframe-appflowy-doc` | capacité mémoire humaine → produit de publication (AppFlowy par défaut) |
| `iakaframe-journal-conversation` | `iakaframe-log-conversation` | capacité main courante → produit transport+stockage (MQTT→CouchDB par défaut) |

**Intégrité** (vérifiée côté forge, `@iakaframe/core` `checkFrameRefs`) : chaque id de `subskills`
doit résoudre dans le pool `skills` (`subskills ⊆ skills`), et une skill ne se référence **pas
elle-même** (anti-self-ref). Le corps `SKILL.md` reste la référence narrative ; `subskills`
**structure** ce que la prose disait déjà. La détection de cycles profonds (A→B→A) est hors MVP.

## Le modèle agnostique en couches (capacité → famille → produit)

Les orchestrateurs de méthode ne référencent **jamais un produit** (un serveur, un logiciel
particulier) : ils réfèrent une **capacité** — *ce qu'on veut faire*. Le concret (le *avec quoi*)
descend dans une **chaîne de sous-skills à trois couches** :

| Couche | Rôle | Nomme un produit ? | Champ `layer:` | Installée chez l'utilisateur |
|---|---|---|---|---|
| **Capacité** | ce qu'on veut faire (verbe métier) | **jamais** | `capacity` | **toujours** |
| **Famille** | le protocole / standard | le **protocole** (git), pas le serveur | `family` | toujours (si la famille est choisie) |
| **Produit** | l'implémentation concrète | **oui** (Forgejo, AppFlowy…) | `product` | **1 par famille, choisi à l'install** |

**Champ `layer:`** (frontmatter `SKILL.md`, optionnel — absent = brique méthode/capacité) : marque
explicitement la couche d'une skill (`capacity` \| `family` \| `product`). Il aide le GUI et l'install
à distinguer une **feuille produit** (alternative sélectionnable) d'un sous-skill composé.

**Résolution à l'install = « présence = sélection »** (MVP, zéro nouveau schéma) : **tous** les
produits vivent dans la library (source de vérité), donc l'intégrité `subskills ⊆ skills` reste
**verte** (library-scoped) ; l'install **déploie** dans `.claude/skills/` de l'utilisateur les couches
capacité + famille **toujours**, plus le **produit sélectionné** pour son environnement. Le
produit-skill présent **est** le produit actif. Les produits non choisis restent dans la library sans
être déployés chez cet utilisateur. Le champ `products:` dans le kit/binding est l'incrément propre
ultérieur.

**Exemplaire de bout en bout — l'axe source-control :**

```
iakaframe-gestion-de-source   (capacité — 100 % agnostique, ne nomme aucun produit)
  └─ subskills: [iakaframe-git]
       iakaframe-git          (famille — protocole git, nomme git, pas le serveur)
         └─ subskills: [iakaframe-forgejo]   (+ github, gitlab… candidats futurs)
              iakaframe-forgejo (produit — nomme et opère Forgejo ; feuille, choisi à l'install)
```

Ainsi `iakaframe-init` et `iakaframe-update` réfèrent la **capacité** `iakaframe-gestion-de-source`
(pas un serveur) ; le serveur concret (Forgejo, ou un autre) est le **produit installé**. La même
capacité sert tous les environnements sans réécriture.

### Autres axes — trois chaînes livrées + le design (patron B)

Le modèle est général. Outre l'axe **source-control**, **trois axes leaf-swap** sont désormais
**livrés** de bout en bout (capacité agnostique → produit concret, ids produits **conservés**) ;
l'axe **design** reste **patron B** (catalogue de données), **non migré** :

| Axe | Capacité (couche 1) | Famille (couche 2) | Produit (couche 3) | Patron | Statut |
|---|---|---|---|---|---|
| Conteneurisation | `iakaframe-conteneurisation` | *(OCI/compose — différée)* | `iakaframe-docker` (+ podman futur) | A (leaf-swap) | **livré** |
| Mémoire humaine | `iakaframe-memoire-humaine` | *(aucune utile)* | `iakaframe-appflowy-doc` | A (leaf-swap) | **livré** |
| Journal conversation | `iakaframe-journal-conversation` | *(pub-sub + doc-store, différées)* | `iakaframe-log-conversation` (composite MQTT→CouchDB) | A (leaf-swap) | **livré** |
| Design on-brand | *(pas de capacité — patron B)* | — | chartes = **données** (`design-*/`) | **B (catalogue de données)** | **hors leaf-swap, non migré** |

> **Design = patron B, non migré.** L'axe design (`iakaframe-naonedge`, agent Loki) est **déjà**
> agnostique par **catalogue de données au runtime** : la charte est **de la donnée** (`design-*/`),
> résolue selon le contexte — **pas** un skill. Il **n'a donc pas besoin** de la chaîne
> capacité→produit ni du champ `layer:`. On **ne crée pas** de capacité `iakaframe-design`, on **ne
> renomme pas** `iakaframe-naonedge`. Forcer B dans A serait une régression (transformer de la donnée
> en skills figés).

> **Familles différées.** Aucune famille au MVP pour ces trois axes : elles n'ont de valeur qu'au
> **2ᵉ produit** (podman ; 2ᵉ broker/store). La conteneurisation et le journal sont livrés en **2
> couches** (capacité → produit) ; la mémoire humaine aussi. Les produits gardent leur **id
> existant** (keep-id) — comme `iakaframe-forgejo` en son temps.

> **Patron A vs B.** *Patron A — remplacement de feuille* : la capacité délègue à un produit-skill
> interchangeable choisi à l'install (source-control, conteneurisation, mémoire humaine, journal).
> *Patron B — catalogue de données au runtime* : `iakaframe-naonedge`/design est **déjà** agnostique
> par catalogue dynamique (la charte est **de la donnée**, `design-*/`, pas un skill) — il **n'a pas
> besoin** de la chaîne de sous-skills et reste **hors** de ce modèle.

## Pourquoi une skill par agent (et pas seulement par étape)

Une skill se déclenche sur des tâches **complexes et multi-étapes**. Depuis l'équipe d'agents,
chaque rôle au périmètre fermé mérite sa skill — c'est le **savoir-faire** que charge le
subagent. **Gimli (dev)** reste l'exception : son cadre vit déjà dans le `CLAUDE.md` du projet,
en faire une skill la ferait sous-déclencher.

Restent **écartés volontairement** : le cycle de correction d'erreur (variante de `cadrage`,
instruction `fix-*.md`) et le mock des API (`specs/mock/`, convention de dev).

## Le principe qui traverse tout

L'IA prépare et propose à l'intérieur d'un périmètre borné ; **l'humain décide aux gates**.
`qualite` (gate automatique) et `deploiement` (gate humain) matérialisent cette règle. Aucune
skill ne franchit seule un gate de mise en production. Et **tout agent peut solliciter
l'utilisateur directement** ; Aragorn (par projet) et Odin (portefeuille) sont les interlocuteurs
par défaut, joignables par voix / Slack.
