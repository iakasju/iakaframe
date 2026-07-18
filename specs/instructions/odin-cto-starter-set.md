# Instruction — Starter set d'Odin (CTO du portefeuille)

> Cadrée par **Gandalf** (P1). Exécution : **Gimli**. Read-only sur le code pour ce cadrage.
> Réf. faisant foi : `library/personas/odin.md` (charte CTO gravée) ; infra lue :
> `cli/src/lib/memory.js`, `cli/src/commands/memory.js`, `cli/src/lib/etat.js`, `cli/src/lib/git.js`,
> `cli/src/commands/snapshot.js`, `library/scaffolds/portefeuille.md`, `library/skills/iakaframe-odin/SKILL.md`.

---

## 1. Besoin (reformulé)

Équiper **Odin** dans sa charte de **CTO du portefeuille** (stratégie logicielle transverse,
technique + produit) avec un **starter set de 4 briques** qui matérialisent une posture
**non négociable** (gravée dans `odin.md`) :
- apprentissage **de fond, silencieux, sans validation permanente** (l'autonomie EST l'expertise) ;
- **question SEULEMENT face à une impasse insoluble** — jamais pour valider un apprentissage courant ;
- **stratégie d'entreprise STABLE** : une décision projet ne l'infléchit pas ; **seul l'utilisateur**
  l'infléchit (validation explicite) ; Odin la **maintient/reflète**, ne la **réécrit jamais** seul ;
- **alerte RARE, à seuil haut** (contradiction sérieuse seulement) ;
- **étanchéité métier intacte** : oriente / arbitre / priorise, **délègue l'exécution**.

---

## 2. Périmètre — DANS / HORS

**DANS**
- **FE1** — `STRATEGIE.md` (portefeuille) : nouvelle entrée du scaffold `portefeuille`, gouvernée par l'utilisateur.
- **FE2** — **Mémoire d'observation SILENCIEUSE** : substrat **distinct** du canon review-gaté, écrit sans consentement.
- **T1** — commande CLI **`iakaframe portfolio`** (scan agrégé, lecture seule) + verbe d'écriture **`iakaframe observe`** (FE2).
- **SK1** — enrichir `library/skills/iakaframe-odin/SKILL.md` (posture CTO + pilotage des nouveaux gestes).
- **(option)** principe **`interruption-minimale-odin`** encodant l'invariant comportemental.

**HORS**
- Écrire du code de production (Gimli exécute) ; rouvrir la charte d'`odin.md` (elle fait foi).
- **Régénérer StefFrame1/StefFrame2** : ce sont des **releases figées** — on **ne les touche pas** (§9).
- Toute réimplémentation de logique existante : les skills **pilotent** le CLI ; le CLI reste **zéro-dépendance**.
- Faire d'Odin un exécutant métier (code/test/déploiement) ou un membre de casting d'équipe.

---

## 3. Découpage en lots

| Lot | Contenu | Nature |
|---|---|---|
| **A — Méthode/doc** | FE1 `STRATEGIE.md` (entrée scaffold + structure) · SK1 (skill Odin) · principe `interruption-minimale-odin` | édition `library/` |
| **B — CLI lecture** | T1 `iakaframe portfolio` (scan agrégé read-only) | `cli/` |
| **C — CLI écriture + store** | `iakaframe observe` + lib `observation.js` (substrat silencieux non-gaté) | `cli/` |

> Dépendances : **A** rédige la skill en **référençant les contrats** de **B** et **C** ; **B** et **C**
> sont **indépendants** (parallélisables). Ordre conseillé : B + C, puis A (ou A en parallèle sur contrats figés).

---

## 4. Arborescence des fichiers à créer / éditer

```
library/
  scaffolds/portefeuille.md          # ÉDIT : + entrée STRATEGIE.md (FE1)
  skills/iakaframe-odin/SKILL.md      # ÉDIT : posture CTO + pilotage portfolio/observe (SK1)
  principles/interruption-minimale-odin.md   # CRÉE (option, Lot A)
methods/iakaframe.md                  # ÉDIT (si principe créé) : + id dans principleIds
cli/
  src/commands/portfolio.js           # CRÉE (T1, Lot B)
  src/commands/observe.js             # CRÉE (FE2 write, Lot C)
  src/lib/observation.js              # CRÉE (substrat observation, Lot C)
  src/index.js                        # ÉDIT : registre des commandes `portfolio` + `observe`
```

> **Réutilisations obligatoires** (ne rien réimplémenter) : `cli/src/lib/etat.js` (`readEtat`),
> `cli/src/lib/git.js` (`isRepo`/`out`), `cli/src/lib/root.js` (`resolveRoot`), et pour Lot C le
> **garde de frontière** `isUnderClaudeHome` de `cli/src/lib/memory.js` + la **primitive de puce datée
> idempotente** (à **factoriser** depuis `memory.js` si possible — cf. §6.3).

---

## 5. FE1 — `STRATEGIE.md` (portefeuille, gouverné par l'utilisateur)

### 5.1 Entrée de scaffold (Lot A)
Ajouter dans `library/scaffolds/portefeuille.md` (à côté de `BACKLOG.md`) :
```yaml
- { path: "STRATEGIE.md", role: "stratégie logicielle transverse (technique+produit), source de vérité ; infléchie par l'UTILISATEUR SEUL", createIfAbsent: true }
```
`createIfAbsent: true` + `nonDestructive` déjà porté par le scaffold → **jamais d'écrasement**.

### 5.2 Structure imposée (sections)
`STRATEGIE.md` (au niveau chapeau, `~/work`) contient, dans cet ordre :
1. **En-tête de gouvernance** (bloc figé) : « Source de vérité de la stratégie transverse. **Infléchie
   par l'utilisateur SEUL** (validation explicite). Odin la **maintient/reflète**, ne la **réécrit
   jamais** de lui-même — il propose un DIFF, l'utilisateur valide. »
2. **Vision produit transverse** — ce qui relie les projets, la direction.
3. **Piliers techniques** — stack de référence, choix structurants transverses.
4. **Priorités inter-projets** — ordre de marche entre projets/chantiers (proposé par Odin, validé user).
5. **Chantiers transverses** — ceux qui dépassent une équipe (cadrés/orchestrés par Odin).
6. **Principes d'arbitrage** — règles de tranche transverses.
7. **Décisions gravées** — puces **datées** (append), trace des inflexions **validées par l'utilisateur**.

### 5.3 Principe de mise à jour (gouvernance)
Calqué sur la **ligne de définition de `PROJET.md`** (déjà dans `odin.md` § Obligation) :
- Odin **pose** `STRATEGIE.md` au besoin, puis **propose** toute évolution sous forme de **DIFF**.
- **Toute évolution est validée par l'utilisateur** (validation explicite) — **jamais** de réécriture
  silencieuse. Une **décision projet n'infléchit pas** `STRATEGIE.md` ; **seul l'utilisateur** l'infléchit.

---

## 6. FE2 — Mémoire d'observation SILENCIEUSE (le point délicat, tranché)

### 6.1 Décision d'architecture (tranchée)
Le canon `~/.iaka/memory/` est **par définition le canon d'apprentissage REVIEW-GATÉ** :
`PROFIL.md`/`REGISTRE.md` + réservoir `proposals/` (consentement via `iakaframe review`), home
**qui refuse `~/.claude`** (`memory.js:20-42`, `TARGETS = ['profil','registre']`). Y ajouter une cible
« observation » non-gatée **polluerait l'invariant « le canon est review-gaté »**.

→ **Tranche : un SUBSTRAT DÉDIÉ, DISTINCT du canon**, non-gaté :
- **Emplacement** : niveau **chapeau/portefeuille** — `<IAKAFRAME_ROOT>/.iaka/observation/` (résolu par
  `resolveRoot` : `$IAKAFRAME_ROOT` sinon `~/work`), **surchargeable `--home <dir>`** (tests).
  **Assertions dures** : ce chemin **n'est JAMAIS** `~/.iaka/memory/` **ni** sous `~/.claude/`
  (réutiliser `isUnderClaudeHome`). Aucun `proposals/`, aucun passage par `review`.
- **Layout** : **un fichier par projet** `observation/<project>.md` + un **agrégat portefeuille**
  `observation/_portefeuille.md`. Entrées = **puces datées** (`- YYYY-MM-DD — <note>`), **idempotentes**.
- **Étanchéité** : l'observation d'Odin vit **hors des dépôts projet** (Odin **n'écrit pas** dans les
  working trees — seule exception documentée : la ligne de def de `PROJET.md`). Un fichier par projet
  préserve l'étanchéité ; l'agrégat sert la vue transverse.

### 6.2 Écriture silencieuse (comment Odin y écrit)
Nouveau verbe CLI **`iakaframe observe`** (Lot C) — écrit **directement**, **sans aucun prompt de
consentement**, **sans réservoir**, idempotent :
```
iakaframe observe --project <nom> "<note produit/stratégie>"     # → observation/<nom>.md
iakaframe observe --portfolio "<note transverse>"                # → observation/_portefeuille.md
iakaframe observe list [--project <nom>|--portfolio]             # lecture
  options : --home <dir> (défaut <IAKAFRAME_ROOT>/.iaka/observation) · --json
```
- Append d'une puce datée si le contenu n'existe pas déjà (idempotent) ; **pas de garde de plafond
  bloquant au MVP** (option : plafond souple avec avertissement non bloquant, cf. §6.4).
- **Zéro dépendance**, cross-OS, calqué sur le style de `memory`/`snapshot`.

### 6.3 Alimentation de `STRATEGIE.md`
Le flux **sépare accumulation silencieuse et stratégie de record** :
1. Odin **observe** en fond → `observe` (non-gaté).
2. À la demande de l'utilisateur (ou quand une **synthèse** est mûre), Odin **synthétise** l'observation
   en un **DIFF proposé** de `STRATEGIE.md` → **l'utilisateur valide** (seul gate) → écriture.
   Odin **ne réécrit jamais** `STRATEGIE.md` silencieusement. L'observation nourrit la proposition ;
   l'utilisateur reste la seule autorité d'inflexion.

### 6.4 Source-unique / réutilisation
Pour honorer « ne réimplémente rien / zéro-dép » : **factoriser** la primitive commune de `memory.js`
(puce datée `- YYYY-MM-DD — …`, appariement idempotent sur le contenu, mesure, écriture d'un saut de
ligne final) en un helper partagé, consommé **et** par `memory.js` (canon gaté) **et** par
`observation.js` (store non-gaté). Les **deux stores restent physiquement distincts** ; seule la
mécanique bas niveau est mutualisée. `observation.js` **n'importe jamais** `proposals/`/`review`.

> **Arbitrage signalé (non bloquant)** : (a) emplacement chapeau vs `~/.iaka/observation/` home-level ;
> (b) factoriser la primitive vs dupliquer un mini-helper local. Reco Gandalf = **chapeau-level +
> factorisation**. Le décideur peut trancher autrement au jalon sans changer le contrat des commandes.

---

## 7. T1 — commande `iakaframe portfolio` (scan agrégé, LECTURE SEULE)

### 7.1 Contrat
```
iakaframe portfolio [--root <chapeau>] [--json]
```
- **Racine** : `--root` sinon `resolveRoot()` (`$IAKAFRAME_ROOT` sinon `~/work`) — même résolution que la commande `root` existante.
- **Détection projet** : chaque sous-dossier de 1er niveau qui est un **projet iakaframe** — présence
  d'un des marqueurs `.iakaframe` **ou** `specs/PROJET.md` **ou** `.git/`.
- **Agrégation par projet** :
  | Colonne | Source | Lib réutilisée |
  |---|---|---|
  | Projet | nom du dossier | — |
  | Ligne de def | **1ʳᵉ ligne significative** de `specs/PROJET.md` (non vide, non titre `#`) | (lecture défensive) |
  | Version | table « ## Etat courant » → `Version` de `specs/etat-des-lieux.md` | `etat.js:readEtat` |
  | Arbre | `Arbre` (propre / modifs) de l'état des lieux **ou** `git status --porcelain` | `etat.js` / `git.js` |
  | Dernier commit | `Dernier commit` de l'état des lieux **ou** `git log -1` | `etat.js` / `git.js` |
  | Jalons ouverts | **[optionnel]** heuristique : nb d'instructions `specs/instructions/*.md` **sans** « JALON VALIDÉ » | (best-effort) |
- **Sortie** : tableau **humain** (une ligne par projet) **+** `--json` (tableau d'objets).
- **Lecture seule / aucun effet de bord** : la commande **n'écrit RIEN** (ni fichier, ni journal, ni
  snapshot). Défensive : source absente/non conforme → valeur de repli, **jamais d'exception**
  (mêmes garanties que `etat.js`).

### 7.2 Câblage
Enregistrer `portfolio` dans `cli/src/index.js` (switch + import) et l'ajouter au HELP.

---

## 8. SK1 — enrichir `library/skills/iakaframe-odin/SKILL.md`

Intégrer, **sans rien réimplémenter** (la skill **pilote** le CLI) :
- **Posture CTO** : apprentissage de **fond silencieux** ; **maintien de `STRATEGIE.md`** (propose un
  DIFF, l'utilisateur valide, jamais de réécriture silencieuse) ; **propose des priorités** ; **porte
  les chantiers transverses**.
- **Interruption minimale (encodé explicitement, grep-vérifiable)** :
  - « **Question SEULEMENT en impasse insoluble** — jamais pour valider un apprentissage courant. »
  - « **Alerte RARE, à seuil haut** — contradiction sérieuse seulement ; une décision projet
    n'infléchit pas la stratégie. »
  - « La **stratégie est infléchie par l'utilisateur SEUL**. »
- **Pilotage des nouveaux gestes** :
  - **Vue** : `iakaframe portfolio` (scan agrégé, lecture seule).
  - **Observation silencieuse** : `iakaframe observe --project <p> "…"` / `--portfolio "…"` (écrit sans
    consentement, hors canon review-gaté).
  - **Stratégie** : lecture de `STRATEGIE.md` ; proposition de DIFF validée par l'utilisateur.
- Conserver l'identité/badges existants (inchangés).

---

## 9. Note — releases figées

**StefFrame1 et StefFrame2 ne sont PAS régénérés par cette instruction.** Ce sont des **releases
figées** ; le starter set modifie la **source vivante** (`library/`, `cli/`, `methods/`). Une éventuelle
propagation vers un futur frame relèvera d'un **rebuild explicite**, hors périmètre ici.

---

## 10. Critères d'acceptation VÉRIFIABLES

**FE1 (STRATEGIE.md)**
- `library/scaffolds/portefeuille.md` **liste** l'entrée `STRATEGIE.md` (`createIfAbsent: true`).
- Sur un chapeau vierge, la matérialisation du scaffold **crée** `STRATEGIE.md` avec les **7 sections**
  (§5.2) + l'en-tête de gouvernance ; **re-run non destructif** (fichier existant **non écrasé**).

**FE2 / observe (Lot C)**
- `iakaframe observe --project X "note" --home <tmp>` **ajoute une puce datée** dans
  `<tmp>/X.md` **sans aucun prompt de consentement** ; re-run identique = **no-op idempotent**.
- **Aucune** écriture dans `~/.iaka/memory/`, **aucun** `proposals/`, **aucun** passage par `review`
  (assertion de chemin : le store est sous `<IAKAFRAME_ROOT>/.iaka/observation` ou `--home`, **jamais**
  `~/.iaka/memory` ni sous `~/.claude`).
- `node --check cli/src/commands/observe.js` et `cli/src/lib/observation.js` → exit 0.

**T1 / portfolio (Lot B)**
- Sur une **fixture** de chapeau à N projets, `iakaframe portfolio --root <fixture>` **liste N projets**,
  chacun avec sa **ligne de def** + version + état d'arbre ; `--json` = **JSON valide** (tableau d'objets).
- **Aucun effet de bord** : après exécution, **aucun fichier créé/modifié** dans la fixture (vérifiable
  par comparaison d'empreinte/mtimes). Sources manquantes → repli, **pas d'exception**.
- `node --check cli/src/commands/portfolio.js` → exit 0 ; `portfolio` apparaît dans le HELP + le switch d'`index.js`.

**SK1 (skill Odin)**
- Le `SKILL.md` **encode explicitement** (grep) : « question … impasse », « seuil haut »,
  « l'utilisateur seul » (inflexion stratégie), et **cite** les gestes `iakaframe portfolio` /
  `iakaframe observe` / `STRATEGIE.md`.

**Principe (option)**
- `library/principles/interruption-minimale-odin.md` existe (policy : apprentissage de fond silencieux ;
  question en impasse seulement ; alerte seuil haut ; stratégie infléchie par l'utilisateur seul) ; si
  créé, son id est **ajouté** à `methods/iakaframe.md` `principleIds` (intégrité référentielle).

**Transverse**
- CLI toujours **zéro-dépendance** (aucun ajout à `package.json`) ; StefFrame1/2 **inchangés** (§9).

---

## 11. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction `odin-cto-starter-set.md` : FE1 STRATEGIE.md · FE2 observation silencieuse (store distinct non-gaté) · T1 `portfolio` (read-only) + `observe` · SK1 skill Odin · principe interruption-minimale · lots A/B/C · critères | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation** (chemin:ligne) :
- Charte : `library/personas/odin.md:44` (apprentissage de fond silencieux), `:49` (question en impasse), `:53` (inflexion user seul).
- Infra memory (à NE PAS gater) : `cli/src/lib/memory.js:20` (`isUnderClaudeHome`), `:32` (`resolveMemoryHome`), `:121` (`TARGETS`=profil/registre) ; `cli/src/commands/memory.js:1` (canon review-gaté).
- Réutilisations : `cli/src/lib/etat.js:9` (`readEtat`), `cli/src/lib/git.js`, `cli/src/lib/root.js` (`resolveRoot`), `cli/src/index.js:139` (commande `root`).
- Cibles : `library/scaffolds/portefeuille.md:5-10` (entrées), `library/skills/iakaframe-odin/SKILL.md`.

**Points à arbitrer par le décideur** (non bloquants, reco Gandalf indiquée) :
1. **Emplacement du store d'observation** : chapeau `<IAKAFRAME_ROOT>/.iaka/observation/` (**reco**) vs home `~/.iaka/observation/`.
2. **Factorisation de la primitive** puce-datée (partage `memory.js`↔`observation.js`, **reco**) vs mini-helper dupliqué.
3. **Créer le principe** `interruption-minimale-odin` (**reco : oui**) ou laisser la posture dans persona + skill seulement.
4. **Colonne « jalons ouverts »** de `portfolio` : incluse en best-effort (**reco**) ou différée.

---

## Statut

**VALIDÉ — prêt pour Gimli**, sous réserve des **4 arbitrages non bloquants** du §11 (le contrat des
commandes et la séparation des stores ne changent pas selon leur issue). À « JALON VALIDÉ » → dispatch
**Gimli** pour Lots A/B/C selon les critères §10, CLI zéro-dépendance, StefFrame1/2 intouchés.
