# Instruction — Surface « Apprentissage » : deux vues sur le réservoir de propositions

> **Phase** : P1 — Cadrage · **Cadreur** : l'architecte-cadreur (Gandalf) · **Exécutant** : le développeur-devops (Gimli).
> **Statut** : **VALIDÉ — prêt pour Gimli** (jalon de cadrage franchi ; les 5 questions d'arbitrage ont été
> tranchées par le décideur le 2026-07-16, cf. § 14). L'implémentation peut démarrer selon le découpage
> U1..U5 (§ 11).
> **Date de cadrage** : 2026-07-16 · **Date de validation** : 2026-07-16. Français ; code et identifiants en anglais.
>
> **Références**
> - Boucle d'apprentissage (backend, VALIDÉ) : `./boucle-apprentissage-incrementale.md` (T1–T8 faits).
>   Réservoir de propositions § 4.2 ; garde de consentement § 8 / Q-4 ; T10 « panneau propositions » (que
>   la présente instruction **précise et relocalise**, cf. § 12).
> - Commande **`review`** (T5, backend réutilisé tel quel) : `../../cli/src/commands/review.js` +
>   `../../cli/src/lib/review.js` (list/show/apply/reject/auto, `classify()`, matérialisation, `--json`).
> - GUI cible : `~/work/iakaFrameGUI` — Tauri 2 + React 18 + Vite, monorepo `@iakaframe/core` ;
>   backend Rust = **passe-plat de texte** pathguardé sous `IAKAFRAME_HOME` (`src-tauri/src/library_store.rs`),
>   façade unique front `src/api/backend.ts`, coquille `src/forge/ForgeShell.tsx` + `Rail.tsx` + ateliers.
> - Skills iaka* (cible/format de la surface conversationnelle) : `../../library/skills/*/SKILL.md`.
> - État de l'art vérifié le 2026-07-16 (§ 13) : mécanisme skills/slash-commands Claude Code ;
>   allow-list d'exécution Tauri 2 `plugin-shell`.

---

## 1. Objectif — une surface de revue, deux fenêtres sur le même réservoir

Donner au décideur une **surface « Apprentissage »** pour piloter la **boucle de revue** de la boucle
d'apprentissage : voir ce que l'agent a **appris et proposé** (les propositions du réservoir), **valider**
(insérer la proposition à l'endroit légitime : skill, mémoire…) ou **rejeter/retirer**. Cette surface se
décline en **DEUX VUES sur le MÊME réservoir neutre** :

1. **Onglet « Apprentissage » dans iakaFrameGUI** — vue graphique (lister / voir / valider / rejeter).
2. **Surface conversationnelle `/iaka` / `/learning`** — même parcours en CLI/conversation.

**Ce n'est PAS** un nouveau backend : le réservoir (`~/.iaka/memory/proposals/`) et la logique de
revue (`review`, T5) **existent déjà**. Les deux vues sont des **pilotes / fenêtres** de `review` — jamais
des propriétaires du réservoir. C'est la mise en œuvre de l'invariant tranché Q-2 : « le réservoir **EST**
la file d'attente, consultable via des vues **interchangeables et optionnelles**, aucune propriétaire ».

---

## 2. Problème (avant la solution)

La boucle d'apprentissage produit des propositions typées dans un réservoir neutre, et la commande
`iakaframe review` sait déjà **lister / montrer / appliquer / rejeter** en respectant le garde de
consentement (structurels toujours gated). Mais **aujourd'hui la revue n'a qu'une seule porte : la CLI
`review` brute**. Deux manques :

1. **Pas de vue graphique.** Rien dans iakaFrameGUI (la forge) ne montre les propositions ni n'offre les
   gestes valider/rejeter. La T10 de la boucle prévoyait un panneau, mais ciblait *IakaCockpit* et restait
   **différée/optionnelle** — jamais relocalisée ni cadrée dans une stack réelle.
2. **Pas de parcours conversationnel packagé.** Un agent (ou le décideur en conversation) ne dispose
   d'aucune **skill** qui présente le parcours de revue (list → show → décider) avec le garde de
   consentement explicité ; il faut connaître les verbes `review` par cœur.

**Besoin (formulé par le décideur)** : deux fenêtres ergonomiques sur le réservoir — un **onglet
Apprentissage** dans iakaFrameGUI et une **surface conversationnelle `/iaka` / `/learning`** — qui
**réutilisent** `review` (aucune réimplémentation de la logique de revue ni des plafonds), honorent le garde
de consentement, et respectent la **symétrie +/−** (rejeter aussi accessible que valider).

---

## 3. Frontière à honorer — le réservoir reste le substrat neutre

| Élément | Nature | Où | Propriété |
|---|---|---|---|
| **Réservoir de propositions** | Donnée (fichiers plats) | `$IAKA_MEMORY_HOME/proposals/` (défaut `~/.iaka/memory/`) | **de personne** (substrat neutre) |
| **Logique de revue** (list/show/apply/reject/classify/matérialisation/plafonds) | Code, **déjà livré** | `cli/src/{commands,lib}/review.js` (T5) | la CLI `iakaframe` |
| **Onglet Apprentissage** (vue A) | Fenêtre optionnelle | iakaFrameGUI | ne possède rien — **pilote** `review` |
| **Surface `/iaka` `/learning`** (vue B) | Fenêtre optionnelle | skill Claude Code | ne possède rien — **pilote** `review` |

> **Invariant** : ni la GUI ni la skill ne **lisent/écrivent le réservoir en réimplémentant** la politique
> de consentement ou les plafonds. La **source unique de vérité de la revue = `review` (T5)**. Les deux vues
> sont des **pilotes** : elles appellent `review` (idéalement en `--json`) et affichent/relaient son résultat.
> Corollaire : `review` **résout lui-même** le canon (`--home` > `IAKA_MEMORY_HOME` > `~/.iaka/memory/`) — les
> vues n'ont **pas** à connaître le chemin du réservoir.

---

## 4. Vue A — Onglet « Apprentissage » dans iakaFrameGUI

### 4.1 Contrainte de stack (constatée, non supposée)
Le backend Rust d'iakaFrameGUI est un **passe-plat de texte** : il lit/écrit des `.md` sous `IAKAFRAME_HOME`
via un **pathguard** (`library_store.rs`), **sans exécuter aucun sous-processus**, sans réseau, sans secret
(invariant AR-1/AR-6). Tout `invoke` passe par la **façade unique** `src/api/backend.ts`. Le front porte le
schéma (`@iakaframe/core`, qui a déjà un parseur de frontmatter). Un onglet = un **atelier** monté dans
`ForgeShell` + une entrée de `Rail` + un chemin d'accès backend.

Deux faits imposent une **décision d'architecture** (arbitrage Q-1) :
- le réservoir vit sous `$IAKA_MEMORY_HOME`, **hors** du pathguard `IAKAFRAME_HOME` actuel ;
- **valider** (apply) n'est pas un simple write : c'est matérialiser un artefact avec **contrôle de plafond
  dur / consolidation** (T1) et **politique de consentement** (`classify`, T5). Réimplémenter cela en Rust
  **dupliquerait** T5+T1 (dérive garantie) — proscrit.

### 4.2 Décision tranchée (Q-1) — **piloter la CLI `review --json`** (source unique)
**TRANCHÉ (Q-1)** : la GUI est un **pilote de `iakaframe review … --json`** pour les quatre verbes
(list/show/apply/reject). La GUI ne touche **jamais** aux fichiers du réservoir : elle exécute la CLI, qui
possède déjà la revue **et** la résolution du canon. On **NE réimplémente PAS** la logique de consentement ni
les plafonds côté Rust — sinon un `skill` pourrait devenir auto-applicable, ce que `classify()` interdit par
nature (§ 7). **Source unique = le réservoir vu par `review`.**

- **Mécanisme (vérifié § 13)** : ajouter **`@tauri-apps/plugin-shell`** avec une **allow-list STRICTE** dans
  `src-tauri/capabilities/` — **un seul programme/commande autorisé** (`iakaframe`, ou le point d'entrée Node
  de la CLI), **forme d'arguments figée** (`review`, `<verb>`, `<id?>`, `--json`, `--library <IAKAFRAME_HOME>`).
  Aucune exécution de shell arbitraire. Le nouvel `invoke` passe par la **façade unique** `backend.ts`
  (ex. `reviewList()`, `reviewShow(id)`, `reviewApply(id)`, `reviewReject(id)`), jamais ailleurs.
- **Localisation de la CLI** : `iakaframe` sur le `PATH` (cf. onboarding multiplateforme) **d'abord**, **repli**
  point d'entrée résolu relativement à `IAKAFRAME_HOME`.

### 4.2bis — Dérogation d'invariant assumée et bornée (à documenter dans le code)
Piloter la CLI introduit l'**exécution d'un sous-processus** dans un backend iakaFrameGUI qui, par invariant
AR-1/AR-6, **n'en avait aucun** (« passe-plat de texte, aucun appel runner, aucun réseau »). Le décideur
**tranche d'assumer ce franchissement, proprement et de façon bornée** :
- **Ce n'est PAS un « appel runner » au sens AR-1** : un runner = un **moteur LLM** (Claude Code, codex,
  ollama). Ici on appelle l'**outil frère déterministe** d'iakaframe (`review`), pas un modèle, pas le réseau.
- **Justification** : c'est **le seul moyen** de garder **une source unique** du garde de consentement et des
  plafonds (le réservoir + `review`). L'alternative — réimplémenter apply/reject en Rust — **dupliquerait**
  T5+T1 et **risquerait** de rendre un amendement structurel (`skill`/`hook`/`config`) auto-applicable :
  danger explicitement refusé.
- **Bornage** : allow-list `plugin-shell` **stricte** (un binaire, une sous-commande `review`, argv figé, pas
  de shell) ; tout appel hors allow-list est refusé par Tauri (bloqué par défaut).
- **Traçabilité** : cette dérogation à AR-1/AR-6 doit être **documentée en tête du module de façade et de la
  capability** (commentaire + renvoi à la présente instruction § 4.2/4.2bis), pour qu'aucune revue future ne
  la prenne pour une régression.

> **Note** : l'hybride « lecture-directe du réservoir + exec minimal » (pathguard étendu à `$IAKA_MEMORY_HOME`
> pour list/show, exec pour apply/reject) a été **écarté** par Q-1 : il crée **deux chemins de lecture** et
> oblige la GUI à connaître `$IAKA_MEMORY_HOME`, sans supprimer la dérogation d'exec (nécessaire pour
> apply/reject). Réimplémenter apply/reject en Rust reste **proscrit** (duplication T5+T1).

### 4.4 Comportement de l'onglet (fermé, indépendant de Q-1)
- **Lister** : les propositions du réservoir, par **type** (`memory` / `skill` / `hook` / `config`), avec pour
  chaque `en-attente` sa **politique** (`auto` / `file`) telle que renvoyée par `review list --json`. **TRANCHÉ
  (Q-4)** : affichage **`en-attente` par défaut** + un **filtre de statut** pour consulter l'**historique**
  (`applique` / `rejete`).
- **Voir** : le détail d'une proposition (`proposal.md` complet : quoi / où / **pourquoi** + aperçu de
  l'artefact) via `review show <id> --json`.
- **Valider** : `review apply <id>` → matérialisation par la CLI ; l'onglet affiche le résultat (où c'est allé :
  skill en bibliothèque, ou `PROFIL`/`REGISTRE` avec le compte de caractères / plafond) ou le **refus explicite**
  (plafond dépassé, skill déjà existant…), **sans jamais** re-décider côté GUI.
- **Rejeter/retirer** : `review reject <id>` → statut `rejete`, rien matérialisé. Bouton **d'égale
  proéminence** que Valider (symétrie, § 6).
- **Garde de consentement rendu visible** : une proposition **structurelle** (`skill`/`hook`/`config`) et une
  proposition `PROFIL` s'affichent comme **« geste humain requis »** ; l'onglet **n'expose aucun bouton**
  d'auto-application pour elles (il ne fait que `apply` sur clic humain explicite — le refus structurel-jamais-auto
  vit déjà dans `classify()`, la GUI ne le contourne pas).
- **Dégradation propre** : hors contexte Tauri / CLI introuvable / réservoir vide → état vide lisible, jamais
  de crash (calque du comportement `iakaframeHome() → null` existant).

---

## 5. Vue B — Surface conversationnelle `/iaka` / `/learning`

### 5.1 Forme (fermé) — une **skill** iaka* qui pilote `review`
La surface conversationnelle est une **skill Claude Code** `iakaframe-learning` (dossier
`library/skills/iakaframe-learning/SKILL.md`, format identique aux skills existantes), qui **package le
parcours de revue** : elle apprend à l'agent à exécuter `iakaframe review list|show|apply|reject [--json]`,
explicite le **garde de consentement** (structurel toujours gated, PROFIL en file, REGISTRE auto) et la
**symétrie +/−** (rejeter est un geste de premier plan, pas un recours). **Zéro nouveau backend** : la skill
est de la doc + des invocations de la CLI existante.

- **Déclencheurs** (vérifié § 13 — en 2026, skills et slash-commands sont la **même** fonctionnalité :
  un `SKILL.md` est invocable par `/<nom>` **et** découvert automatiquement par description) :
  - invocation autonome par **description** (frontmatter `description` : « revoir ce que l'agent a appris »,
    « valider/rejeter une proposition d'apprentissage », « /learning », « /iaka »…) ;
  - **alias explicites `/learning` ET `/iaka`** (**TRANCHÉ Q-2 : on garde les deux**) : deux fins fichiers de
    commande (`.claude/commands/learning.md` et `.claude/commands/iaka.md`, livrés dans le kit / la
    bibliothèque) qui **routent vers le même parcours**.
- **Rappel du CLAUDE.md global** : l'interdiction de commande slash custom vise **uniquement le déclenchement
  d'`iakastart`** ; `/learning` et `/iaka` sont donc autorisés.

### 5.2 Parcours (miroir de `review`, fermé)
1. **Lister** — `review list [--status …]` : présenter les propositions en attente (type, cible, politique).
2. **Voir** — `review show <id>` : quoi / où / **pourquoi** + artefact.
3. **Valider** — `review apply <id>` : la skill **rappelle** que c'est un geste humain (surtout structurel),
   exécute, restitue le résultat/refus **verbatim**.
4. **Rejeter/retirer** — `review reject <id>` : présenté **au même niveau** que valider.

### 5.3 Placement / livraison
Skill ajoutée à la bibliothèque `library/skills/` (atome iaka*, via le verbe `add` de
`./cli-bibliotheque-verbes.md` ou écrite directement) ; les alias de commande vivent dans le kit Claude Code
déployé. La skill **n'accède jamais** au réservoir en direct : elle passe **toujours** par `review`.

---

## 6. Symétrie +/− (décomposabilité) — critère transverse

Tout ce qui se valide/insère doit pouvoir se **retirer**, avec la **même accessibilité** :

- **Réservoir (propositions `en-attente`)** — au MVP, la symétrie est **pleine et de premier plan** dans les
  deux vues : **rejeter** une proposition est un geste d'égale proéminence que **valider** (bouton jumeau côté
  GUI ; étape jumelle côté skill). `review reject` est déjà livré (T5).
- **Élément déjà inséré** — retirer un élément **déjà matérialisé** (une entrée de `REGISTRE`/`PROFIL`, un
  skill promu) n'est **pas** un `reject` (la proposition appliquée est terminale). C'est la **décomposabilité** :
  - mémoire : émettre/appliquer une op `remove` (la couche T1 `memoryRemove` existe) ;
  - skill : retrait en bibliothèque (geste humain / verbe CLI).
  **TRANCHÉ (Q-3) : DIFFÉRÉ.** Au MVP, la symétrie +/− est tenue par le **rejet d'une proposition en attente**
  (de premier plan dans les deux vues). Le **retrait d'un élément déjà posé** (ex. un skill matérialisé) relève
  d'un **chantier « symétrie » distinct, à cadrer à part** — il n'est **pas** dans ce lot. Renvoi : à ouvrir
  comme instruction dédiée quand le décideur le priorisera (décomposabilité des éléments insérés).

---

## 7. Insertion « à l'endroit légitime » = `review apply` (rappel du contrat)

« Valider » **=** `review apply <id>`, qui matérialise l'artefact **selon son `type`**, via les couches
existantes, **sans** que les vues re-décident quoi que ce soit :
- `type: skill` → écrit `library/skills/<id>/SKILL.md` (non destructif : n'écrase pas un skill existant) ;
- `type: memory` / `target: registre|profil` → op `add|replace|remove` via la couche mémoire T1, **plafond dur
  appliqué** (refus si dépassement → message « consolidation requise ») ;
- `type: hook` / `config` → **non matérialisables au MVP** (close ne les produit pas encore) : la vue affiche
  la proposition et son refus propre (`type-non-materialisable-mvp`) — pas d'invention.
Le **garde structurel-jamais-auto** (`classify()`) est **hors de portée** des vues : elles n'appellent `apply`
que sur **clic/geste humain explicite**, jamais une passe automatique (`auto` reste réservé à la cadence T6).

---

## 8. Rapport à l'existant — réutilisé tel quel vs ajouté

**Réutilisé TEL QUEL (aucune réimplémentation) :**
- **`review` (T5)** : list/show/apply/reject, `classify()` (politique de consentement), matérialisation
  (mémoire T1, skill bibliothèque), résolution du canon, sortie `--json`.
- **iakaFrameGUI** : coquille `ForgeShell`/`Rail`/atelier, façade unique `backend.ts`, parseur frontmatter
  `@iakaframe/core`, pattern de dégradation hors-Tauri.
- **Format des skills** iaka* (frontmatter `id`/`name`/`description` + corps) pour la surface conversationnelle.

**AJOUTÉ (ce lot) :**
- Un **onglet « Apprentissage »** (atelier + entrée de rail) pilotant `review --json` via la façade.
- Le **pont d'exécution borné** GUI→CLI (allow-list `plugin-shell`, un binaire, argv fixe) — **ou** l'hybride
  lecture-directe (§ 4.3) selon Q-1.
- La **skill `iakaframe-learning`** + alias `/learning` / `/iaka` (doc + invocations `review`).
- Rien d'autre : **aucun** nouveau stockage, **aucune** logique de consentement/plafond dupliquée.

---

## 9. Périmètre — MVP / différé (fermé)

**[MVP] :**
- Onglet Apprentissage : lister (filtre statut/type) + voir + valider + rejeter, garde de consentement rendu
  visible, symétrie du rejet, dégradation propre. Accès = pilote `review --json` (Q-1).
- Skill `iakaframe-learning` + alias `/learning` / `/iaka` : parcours list/show/apply/reject, garde explicité.
- Réutilisation intégrale de `review` (T5) ; zéro duplication.

**[différé — hors lot] :**
- **Retrait d'un élément déjà inséré** (Q-3, tranché DIFFÉRÉ) — **chantier « symétrie » distinct**, à cadrer à
  part ; au MVP, symétrie tenue par le rejet d'une proposition en attente.
- **Éditeur d'artefact avant validation** (Q-5, tranché EXCLU au MVP) — on valide/rejette **tel quel** ;
  éditer une proposition avant `apply` est différé.
- Matérialisation `hook`/`config` (dépend de `close` T4 qui ne les produit pas encore).
- Toute passe **automatique** depuis les vues (réservé à la cadence T6, hors surface humaine).
- Vue dans d'autres runners que Claude Code (le canon/`review` restent agnostiques ; autres bindings plus tard).

---

## 10. Critères d'acceptation — numérotés et vérifiables

Le lot est **PASS** si **tous** les points suivants sont constatables :

1. **[Deux vues, un réservoir]** L'onglet Apprentissage **et** la skill `/learning` listent **les mêmes**
   propositions que `iakaframe review list` sur le même canon. *Test : une proposition fixture apparaît à
   l'identique dans les deux vues et en CLI.*
2. **[GUI = pilote de `review`, zéro duplication]** Le code de l'onglet **n'implémente ni** la politique de
   consentement **ni** les plafonds : il appelle `review … --json`. *Test : `grep` — aucune ré-implémentation
   de `classify`/plafond côté GUI ; `apply`/`reject` transitent par `review`.*
3. **[Façade unique respectée]** Tout appel backend de l'onglet passe par `src/api/backend.ts` (nouvelles
   fonctions `reviewList/reviewShow/reviewApply/reviewReject`). *Test : `grep 'invoke('` hors `backend.ts` = 0 ;
   `grep` de l'exécution CLI hors façade = 0.*
4. **[Exec borné + dérogation documentée]** L'exécution est **allow-listée** à un seul programme/commande avec
   argv figé ; aucun shell arbitraire ; la **dérogation AR-1/AR-6** (§ 4.2bis) est **documentée** en tête de
   façade + capability. *Test : `capabilities/*` liste `iakaframe`/point d'entrée + formes d'args ; commande hors
   allow-list refusée ; commentaire de dérogation présent.*
5. **[Valider = matérialisation par type]** Valider une proposition `memory/registre` écrit dans `REGISTRE.md`
   sous plafond ; valider une proposition `skill` crée `library/skills/<id>/SKILL.md` ; une proposition
   dépassant le plafond est **refusée** avec message clair — **le tout via `review apply`**. *Test : effets
   constatés + refus plafond.*
6. **[Garde de consentement visible et non contournable]** Une proposition `skill`/`hook`/`config` ou `PROFIL`
   s'affiche « geste humain requis » ; **aucune** vue ne l'applique sans geste humain explicite ; aucune passe
   automatique n'est offerte dans les vues. *Test : structurel reste `en-attente` sauf `apply` explicite ;
   aucun bouton/commande « auto » dans les surfaces humaines.*
7. **[Symétrie +/−]** Dans les **deux** vues, **rejeter** une proposition en attente est aussi accessible que
   **valider** (bouton jumeau GUI ; étape jumelle skill) ; `reject` passe le statut à `rejete` sans matérialiser.
   *Test : rejet praticable en un geste dans chaque vue ; statut/effet constatés.*
8. **[Skill = pilote, pas de backend]** `iakaframe-learning` n'accède au réservoir **que** via `review` ;
   `/learning` et `/iaka` déclenchent le parcours ; frontmatter conforme aux skills iaka*. *Test : invocation +
   parcours list→show→apply/reject ; aucune I/O réservoir hors `review`.*
9. **[Dégradation propre]** Hors Tauri / CLI absente / réservoir vide → état vide lisible, aucun crash.
   *Test : lancement sans canon/CLI.*
10. **[Non-régression GUI]** typecheck + lint + tests (vitest + cargo) **verts** ; sortie des kits/teams
    **inchangée** (l'onglet est additif). *Test : suites existantes au vert ; golden inchangé.*

**Conventions :** doc/échanges en français, code/identifiants en anglais ; commits atomiques (conventional
commits) ; MVP d'abord ; self-hosted / zéro dépendance nouvelle côté CLI (la skill est de la doc ; côté GUI,
`plugin-shell` est un plugin Tauri officiel, pas une dépendance métier).

---

## 11. Découpage en tâches pour Gimli (avec dépendances)

> Commits atomiques ; typecheck+lint+tests avant clôture de chaque tâche.

| Tâche | Intitulé | Dépôt | Dépend de |
|---|---|---|---|
| **U1** | **Pont d'accès `review` depuis la GUI** (Q-1) : allow-list stricte `@tauri-apps/plugin-shell` (un binaire `iakaframe`, sous-commande `review`, argv figé) + fonctions de façade `reviewList/Show/Apply/Reject` dans `backend.ts`. **Passe-plat, aucune logique de revue en Rust.** **Documenter la dérogation AR-1/AR-6** (§ 4.2bis) en tête de façade + capability. | iakaFrameGUI | — |
| **U2** | **Onglet « Apprentissage »** : atelier monté dans `ForgeShell` + entrée `Rail` ; liste (**défaut `en-attente` + filtre historique**, par type, + politique), vue détail (sans éditeur d'artefact), boutons **Valider** / **Rejeter** (jumeaux), garde de consentement visible, dégradation propre. Parse le `--json` de `review`. | iakaFrameGUI | U1 |
| **U3** | **Skill `iakaframe-learning`** : `SKILL.md` (frontmatter + parcours list/show/apply/reject, garde de consentement, symétrie) ajoutée à `library/skills/`. | iakaframe | — |
| **U4** | **Alias `/learning` ET `/iaka`** (Q-2) : deux fichiers de commande routant vers le parcours de U3 (livrés dans le kit Claude Code). | iakaframe | U3 |
| **U5** | **Tests + non-régression** : tests d'onglet (mock de façade), test de la skill (parcours), vérif `grep` façade/duplication ; suites GUI (vitest+cargo) et CLI au vert. | les deux | U2, U3, U4 |

**Ordre conseillé** : (U1→U2 en GUI // U3→U4 en iakaframe) → U5.

---

## 12. Rapport à la T10 de la boucle d'apprentissage (précision + relocalisation)

L'instruction `boucle-apprentissage-incrementale.md` prévoyait **T10 — « panneau propositions »** comme vue
**différée/optionnelle** du réservoir, ciblant **IakaCockpit**. La **présente instruction la précise et la
relocalise** : la vue graphique du réservoir vit désormais dans **iakaFrameGUI** (la forge), pas IakaCockpit,
et est **cadrée dans sa stack réelle** (Tauri passe-plat + façade). Elle **supersede** T10 côté cible et
lui ajoute une **seconde vue** (surface conversationnelle `/iaka` `/learning`) non prévue par T10. Le principe
« vues interchangeables, aucune propriétaire » (Q-2 de la boucle) est **conservé** : la CLI `review` reste la
baseline, la GUI et la skill sont des fenêtres optionnelles.

---

## 13. Faits vérifiés sur le web (2026-07-16) + sources

- **Claude Code — skills = slash-commands (2026)** : un `SKILL.md` (`.claude/skills/<nom>/`) est invocable par
  `/<nom>` **et** découvert automatiquement par sa `description` ; le legacy `.claude/commands/<nom>.md`
  produit aussi `/<nom>` ; à nom égal, la skill prime. → conforte § 5 (une skill + alias de commande couvrent
  découverte auto **et** `/learning` / `/iaka`).
- **Tauri 2 — exécution allow-listée** : `@tauri-apps/plugin-shell` autorise l'exécution d'un programme via
  une **allow-list** dans `capabilities/` (`ScopeAllowedCommand` : nom, commande, **arguments autorisés**,
  flag sidecar ; `shell:allow-execute`/`allow-spawn`) ; tout est **bloqué par défaut**. → conforte § 4.2
  (pont GUI→CLI borné à un binaire et à une forme d'arguments figée, sans shell arbitraire).

Sources :
- [Claude Code — Slash Commands (docs)](https://code.claude.com/docs/en/agent-sdk/slash-commands)
- [Claude Code Hooks vs Slash Commands vs Skills (2026)](https://blog.laozhang.ai/en/posts/claude-code-hooks-slash-commands-skills)
- [Tauri v2 — Shell plugin](https://v2.tauri.app/plugin/shell/)
- [Tauri v2 — Embedding External Binaries / capabilities](https://v2.tauri.app/develop/sidecar/)

---

## 14. Décisions tranchées par le décideur (2026-07-16)

Les 5 questions d'arbitrage ont été **tranchées**. Elles sont gravées ci-dessous et propagées dans tout le
document.

- **Q-1 — Accès de la GUI au réservoir → EXEC BORNÉ de `review --json`. TRANCHÉ.** La GUI est un **pilote** de
  `iakaframe review … --json` (allow-list `plugin-shell` **stricte** : un seul binaire/commande, argv figé, pas
  de shell). On **NE réimplémente PAS** la logique de consentement/plafond côté Rust (sinon un `skill` pourrait
  devenir auto-applicable — refusé). **Source unique = le réservoir vu par `review`.** L'invariant AR-1/AR-6
  d'iakaFrameGUI (« backend sans sous-processus/appel runner ») est **franchi proprement et de façon bornée** :
  ce **n'est pas** un appel runner (LLM), c'est l'outil frère déterministe d'iakaframe. **La dérogation doit
  être documentée dans le code** (tête de façade + capability, renvoi § 4.2/4.2bis). Localisation CLI : `PATH`
  d'abord, repli `IAKAFRAME_HOME`. (Propagé : § 3, § 4.2, § 4.2bis, critères 2/3/4, U1.)
- **Q-2 — Déclencheurs conversationnels → GARDER LES DEUX alias `/learning` ET `/iaka`. TRANCHÉ.** (+ découverte
  autonome par `description`.) (Propagé : § 5.1, U4.)
- **Q-3 — Retrait d'un élément déjà inséré → DIFFÉRÉ (chantier « symétrie » distinct, à cadrer à part). TRANCHÉ.**
  Au MVP, la symétrie +/− est tenue par le **rejet d'une proposition en attente** ; le retrait d'un élément déjà
  posé (ex. skill matérialisé) fera l'objet d'une **instruction dédiée** ultérieure. (Propagé : § 6, § 9.)
- **Q-4 — Périmètre d'affichage → `en-attente` PAR DÉFAUT + FILTRE d'historique (`applique`/`rejete`). TRANCHÉ.**
  (Propagé : § 4.4.)
- **Q-5 — Édition avant validation → EXCLUE au MVP (valider/rejeter tel quel). TRANCHÉ.** L'éditeur d'artefact
  avant `apply` est différé. (Propagé : § 9.)

---

## 15. Journal de décision

- **2026-07-16** — Gandalf cadre la **surface « Apprentissage »** en **deux vues** (onglet iakaFrameGUI +
  surface conversationnelle `/iaka` / `/learning`) sur le **réservoir neutre** de propositions. **Constat de
  stack** : iakaFrameGUI = Tauri 2 passe-plat pathguardé sous `IAKAFRAME_HOME`, façade unique, invariant
  « aucun appel runner » ; réservoir sous `$IAKA_MEMORY_HOME` (séparé). **Frontière tenue** : les deux vues
  sont des **pilotes de `review` (T5)** — aucune réimplémentation de la politique de consentement ni des
  plafonds ; `review` reste la source unique et résout le canon. **Reco** : piloter `review --json` via une
  allow-list `plugin-shell` étroite (Q-1), skill iaka* + alias `/learning`/`/iaka` (Q-2), symétrie du rejet
  d'attente de premier plan dans les deux vues (Q-3). **Relocalise T10** de la boucle (IakaCockpit → iakaFrameGUI)
  et lui ajoute la surface conversationnelle. Faits web vérifiés (skills=slash-commands 2026 ; exec allow-listé
  Tauri 2). **Cadrage seul, aucun code de production.** 5 questions d'arbitrage ouvertes (§ 14).
- **2026-07-16 (validation)** — Le décideur **valide le jalon** (« JALON VALIDÉ ») et **tranche les 5 questions**
  (§ 14). **Q-1** : **exec borné de `review --json`** (allow-list `plugin-shell` stricte) — la GUI est un pilote,
  **aucune** logique de consentement/plafond réimplémentée côté Rust (risque qu'un `skill` devienne
  auto-applicable, refusé) ; l'invariant AR-1/AR-6 d'iakaFrameGUI est **franchi proprement et borné**, et la
  **dérogation est documentée** dans l'instruction (§ 4.2bis) **et à documenter dans le code**. **Q-2** : garder
  **les deux** alias `/learning` **et** `/iaka`. **Q-3** : **différer** le retrait d'un élément déjà inséré
  (chantier « symétrie » distinct, à cadrer à part) ; symétrie MVP = rejet d'attente. **Q-4** : onglet
  **`en-attente` par défaut + filtre** d'historique. **Q-5** : **exclure** l'éditeur d'artefact avant validation
  au MVP. Décisions propagées (§ 3, § 4, § 5, § 6, § 9, critères, U1..U5). L'implémentation (Gimli) peut démarrer.

> **Statut : VALIDÉ — prêt pour Gimli.** L'implémentation (Gimli) suit le découpage U1..U5 (§ 11).
