# Couche de commandes CLI sur la bibliothèque (pool + assemblages)

> **Nature** : ajout d'une **couche de commandes** au CLI existant `@naonedge/iakaframe`
> (`iakaframe/cli/`) pour **lire, livrer et déployer** la bibliothèque `pool + assemblages`
> rangée à la racine du dépôt (`library/ teams/ methods/ bindings/ kits/`). · **Cadreur** :
> l'architecte-cadreur. · **Statut : CADRÉ — À VALIDER par le décideur** (jalon humain de cadrage).
> **Date** : 2026-07-15. Français ; code et identifiants en anglais.
>
> **Références**
> - Rangement bibliothèque (contrat de la structure, invariants I1–I5, schémas de frontmatter
>   § 3) : `./rangement-bibliotheque-pluriel.md`.
> - CLI existant : `../../cli/src/index.js` (dispatch), `../../cli/package.json`
>   (Node ≥20, **zéro-dep runtime**, `bin: iakaframe`, tests `node --test`).
> - Style d'une commande : `../../cli/src/commands/agents.js`, `../../cli/src/commands/jalon.js`
>   (`parseArgs` de `node:util` ; un module `commands/<verbe>.js` exporte `run<Verbe>(rest)`).
> - Utilitaires réutilisables : `../../cli/src/lib/table.js` (`table()`, `wrap()`),
>   `../../cli/src/lib/kit.js` (`frameworkRoot()`), `../../cli/src/lib/root.js` (`resolveRoot()`).
> - Vocabulaire runner/nœud : `../../cli/src/lib/vocab.js` (`RUNNER_KINDS`, `NODE_KINDS`).
> - État de l'art vérifié le 2026-07-15 (§ 10).

---

## 1. Problème (avant la solution)

Le rangement « pool + assemblages » a **rangé du contenu** (`library/{personas,skills,principles,
rituals,guardrails,roles,workflows,scaffolds}/` + `teams/ methods/ bindings/ kits/`, fichiers `.md`
à frontmatter, index par **scan**) mais **aucun outil ne sait le lire ni s'en servir** :

1. **Personne ne peut inventorier** le pool sans ouvrir les dossiers à la main — l'invariant
   « index par scan » (I2) n'est **pas outillé**.
2. **Aucun geste de livraison** : quand la forge (ou quelqu'un) produit une nouvelle team / méthode /
   binding, rien ne la **dépose en vérifiant son intégrité référentielle** (I1). On peut casser une
   référence par id sans s'en apercevoir.
3. **Aucun geste de composition ni de bascule** : on ne peut pas **assembler** un kit (méthode + team
   + binding) ni **basculer** la team/méthode active d'un projet — le lien bibliothèque → projet
   déployé est manuel.

**Besoin (formulé par le décideur)** : une **couche de commandes CLI** sur la bibliothèque, dans le
CLI existant, qui **lit** (`list`, `show`), **livre en enrichissant** (`add`), **compose**
(`assemble`) et **bascule un projet** (`switch`/`use`) — en respectant les invariants du rangement
(zéro duplication, index par scan, personas pures) et **sans régression** des commandes existantes.

**Ce lot ajoute du code CLI de lecture/validation/composition**, pas de la logique métier lourde :
il **branche** la structure déjà rangée. Il **ne réimplémente pas** un moteur de déploiement
multi-runner complet (→ § 6 [différé]).

---

## 2. Frontière à graver : fabrication vs exécution

| Geste | Verbe | Côté | Touche | Écrit dans |
|---|---|---|---|---|
| Inventorier le pool | `list` | lecture | rien | — (stdout) |
| Afficher un contrat | `show` | lecture | rien | — (stdout) |
| **Livrer un artefact** (enrichir la définition) | `add` | **fabrication** | la **bibliothèque** | `teams/` `methods/` `bindings/` |
| **Composer un déployable** | `assemble` | **exécution/run** | le **binding** (runner+modèle) | `kits/` (ou dry-run) |
| **Basculer un projet** | `switch` / `use` | **exécution/run** | un **projet** | `<projet>/.claude/` |

> **Invariant de frontière à graver** : `add` **enrichit la bibliothèque** (fabrication d'une
> définition, sans runner) ; `assemble`/`switch` **manipulent un binding** (runner+modèle) et
> **produisent/déploient** — côté **exécution**, proche cockpit. **`switch` écrit dans un projet,
> JAMAIS dans la bibliothèque.** Cette ligne est la même que la séparation forge (crée+livre) /
> cockpit (réceptionne+run) déjà actée au portefeuille.

---

## 3. Contrat de chaque verbe (entrée → sortie)

> Convention commune : chaque verbe est un module `cli/src/commands/<verbe>.js` exportant
> `run<Verbe>(rest)`, branché dans le `switch` de `src/index.js` (§ 5). Options via `parseArgs`
> (`node:util`). Option globale `--root <dir>` (alias de la résolution § 4.2) et `--ascii` (repli
> table ASCII, cohérent avec l'existant). Sortie humaine par défaut ; `--json` émet la donnée brute
> (utile forge/cockpit).

### 3.1 `list [type]` — inventaire par scan **[MVP]**
- **Entrée** : `iakaframe list` (résumé) ou `iakaframe list <type>` avec
  `type ∈ {teams, methods, personas, skills, principles, rituals, guardrails, roles, workflows,
  scaffolds, bindings, kits}`.
- **Traitement** : scanne le dossier de la collection (§ 4.1) ; pour chaque fichier, lit le
  frontmatter (parseur § 4.3) et en extrait `id` + un **libellé** (`name` | `label` | `id` selon le
  type).
- **Sortie sans type** : un tableau `Collection | Nb | Aperçu d'ids` (12 lignes, une par collection).
- **Sortie avec type** : un tableau `id | libellé` trié par id ; pied de page = total.
- **Erreurs** : type inconnu → message + liste des types valides, `exitCode=1`. Collection absente →
  ligne à 0 (pas une erreur : la structure peut être partielle).
- **Acceptation** : `iakaframe list personas` liste **8** ids (odin…nathalie) hors `_TEMPLATE` ;
  `iakaframe list skills` liste les dossiers de `library/skills/` ayant un `SKILL.md` ;
  `iakaframe list` affiche les 12 collections avec leurs comptes réels.

### 3.2 `show <id>` — contrat d'un atome/assemblage **[MVP]**
- **Entrée** : `iakaframe show <id>` (ex. `gandalf`, `iakaframe-8`, `qualite`).
- **Traitement** : résout `<id>` par scan **sur toutes les collections** (§ 4.1) ; l'id = nom de
  fichier sans extension (invariant I2). Si collision d'id entre collections → lister les candidats
  `<collection>/<id>` et demander `--type` pour lever l'ambiguïté.
- **Sortie** : en-tête `<collection> · <id>` ; **frontmatter rendu** (paires clé/valeur, listes et
  maps inline mises en forme lisible) ; puis le **corps `.md`** tel quel. `--json` → objet
  `{ collection, id, path, data, body }`.
- **Erreurs** : id introuvable → message + suggestion (`list <type>`), `exitCode=1`.
- **Acceptation** : `iakaframe show gandalf` affiche `roleKey: cadrage`, `skills: [iakaframe-cadrage]`
  puis le corps de charte ; `iakaframe show iakaframe-8` affiche `personas: [...]` (8) +
  `coordinator: aragorn`.

### 3.3 `add team|method|binding <fichier>` — **geste de livraison** **[MVP-2]**
- **Entrée** : `iakaframe add <kind> <fichier.md>` avec `kind ∈ {team, method, binding}`.
- **Traitement** :
  1. Lit et **parse le frontmatter** du fichier source (§ 4.3).
  2. **Valide le schéma** du `kind` (champs requis présents et bien typés, cf. `rangement` § 3.9–3.11) ;
     vérifie `id == basename(fichier)` (I2).
  3. **Vérifie l'intégrité référentielle (I1)** : tout champ `*Ids`/`*Keys`/`personas`/`personaId`/
     `methodId`/`teamId` pointe vers un atome/assemblage **qui existe** dans le pool (§ 4.4).
     **Refuse** (aucune écriture, `exitCode=1`) si une référence est cassée, en listant les ids
     manquants et leur collection attendue.
  4. Si valide : **dépose** le fichier dans `teams/` | `methods/` | `bindings/` (nom = `<id>.md`).
     Non-destructif : si la cible existe et `--force` absent → refus (`exitCode=1`, message
     « existe déjà, --force pour remplacer »).
- **Sortie** : `+ <kind> <id> livré dans <chemin>` + rappel des références vérifiées (comptes).
  Sur refus : rapport de validation (champ manquant / réf. cassée).
- **Acceptation** : un binding fixture référençant une `teamId` inexistante est **refusé** sans
  écrire ; un team fixture valide est **déposé** et devient visible par `list teams`.

### 3.4 `assemble <method> <team> [binding]` — composer un kit **[MVP]**
- **Entrée** : `iakaframe assemble <methodId> <teamId> [bindingId]`.
- **Traitement** :
  1. Résout et parse la méthode, la team et (option) le binding.
  2. **Contrôle de compatibilité (casting ⊇ rôles)** : rassemble les `roleKey` de chaque persona de
     `team.personas` (lecture des personas) ; vérifie que **`method.roleKeys ⊆` ensemble des roleKeys
     de la team**. Tout `roleKey` de la méthode non couvert par le casting → **échec** (`exitCode=1`,
     liste des rôles orphelins).
  3. Si un binding est fourni : vérifie `binding.methodId == method.id` **et** `binding.teamId ==
     team.id` (sinon échec) ; sinon, propose le binding par défaut disponible (ou `--binding`).
  4. Produit un **descripteur de kit** `{ id, methodId, teamId, bindingId?, node, emits[] }`
     (schéma `rangement` § 3.12). Par défaut **dry-run** (affiche le descripteur, n'écrit rien) ;
     `--write` écrit `kits/<id>.md` (non-destructif, `--force` pour remplacer).
- **Sortie** : tableau récap (méthode, team, binding, rôles couverts N/N, node) + descripteur. En
  cas d'incompatibilité : rapport des rôles non couverts.
- **Acceptation** : `assemble iakaframe iakaframe-8` **passe** (les 8 rôles de la méthode sont
  couverts par le casting) ; une team amputée d'un rôle de la méthode **échoue** avec la liste des
  rôles manquants.

### 3.5 `switch` / `use <method> <team>` — basculer un projet **[MVP-2]**
- **Entrée** : `iakaframe use <methodId> <teamId> [--binding <id>] [--path <projet>] [--node <n>]`
  (`switch` = alias exact de `use`). `--path` défaut = `process.cwd()`.
- **Traitement** :
  1. **Assemble** en interne (réutilise § 3.4) : refuse la bascule si incompatible.
  2. **Sauvegarde non destructive** : si `<projet>/.claude/` existe, le copie en
     `<projet>/.claude.bak-<horodatage>/` **avant** toute écriture (rollback possible).
  3. Écrit le kit assemblé dans `<projet>/.claude/` pour le `--node` cible (défaut `claude`).
     **MVP-2** : réutilise le chemin de déploiement existant (`lib/agents.js` `fullteam()` /
     `lib/kit.js` `copyKit()`) en **le pilotant depuis le binding** (personas de la team + skills de
     leurs rôles). Le **rendu multi-runner complet** (générer tout l'arbre `emits[]` d'un kit non-Claude
     depuis un binding) est **[différé]** (§ 6).
  4. Écrit un **marqueur d'état** `<projet>/.claude/iakaframe-kit.json`
     (`{ methodId, teamId, bindingId, node, assembledAt }`) — trace de la bascule.
- **Sortie** : `bascule <projet> → méthode <m> / team <t> (node <n>)` + chemin de la sauvegarde +
  rappel du rollback (`--rollback` restaure la dernière `.claude.bak-*`).
- **Erreurs** : incompatibilité (via assemble) → aucune écriture. Projet introuvable → `exitCode=1`.
- **Acceptation** : après `use iakaframe iakaframe-8 --path <tmp>`, `<tmp>/.claude/agents/` contient
  les personas de la team et un `.claude.bak-*` est créé si un `.claude/` préexistait ; `--rollback`
  restaure l'état antérieur.

---

## 4. Points d'architecture tranchés (à graver)

### 4.1 Mapping collection → dossier
Une table unique `lib/library.js` `COLLECTIONS` fait autorité :

| type | dossier | fichier | libellé (champ) |
|---|---|---|---|
| `personas` | `library/personas/` | `<id>.md` | `name` |
| `skills` | `library/skills/` | `<id>/SKILL.md` | `name`/`description` |
| `principles` | `library/principles/` | `<id>.md` | `label` |
| `rituals` | `library/rituals/` | `<id>.md` | `label` |
| `guardrails` | `library/guardrails/` | `<id>.md` | `label` |
| `roles` | `library/roles/` | `<id>.md` | `label` |
| `workflows` | `library/workflows/` | `<id>.md` | `name` |
| `scaffolds` | `library/scaffolds/` | `<id>.md` | `id` |
| `teams` | `teams/` | `<id>.md` | `name` |
| `methods` | `methods/` | `<id>.md` | `name` |
| `bindings` | `bindings/` | `<id>.md` | `id` |
| `kits` | `kits/` | `<id>.md` | `id` |

Règles : `_TEMPLATE.md` et `README.md` sont **exclus** du scan (déjà le cas dans
`lib/agents.js` `listPersonas()`). `skills` est le seul type **par dossier** (fichier `SKILL.md`).

### 4.2 Résolution de la racine bibliothèque — **TRANCHÉ**
Nouveau `lib/library.js` `libraryRoot(opt)`, priorité :
1. `opt` (`--root <dir>`) si fourni ;
2. **`IAKAFRAME_HOME`** (variable d'env dédiée à la **racine de la bibliothèque**) ;
3. **remontée depuis `cwd`** jusqu'au 1er dossier contenant un marqueur `library/` **et** `methods/`
   (double marqueur = racine du dépôt bibliothèque, robuste aux faux positifs) ;
4. repli sur `frameworkRoot()` de `lib/kit.js` (assets embarqués `_bundled/` ou remontée in-repo).

> **Motivation du choix** : (a) `IAKAFRAME_ROOT` existant (`lib/root.js`) désigne le **dossier
> chapeau des projets** (`~/work`), **pas** la bibliothèque — d'où une **variable distincte
> `IAKAFRAME_HOME`** pour ne pas confondre les deux racines. (b) Le marqueur historique de
> `frameworkRoot()` est le dossier **`kit-claude`** ; or le rangement **déménage `kit-*` → `kits/`**,
> ce qui **cassera** ce marqueur → on **détecte `library/`** en priorité. **À faire dans ce lot** :
> conserver `frameworkRoot()` en repli mais **basculer son marqueur** sur `library/` (ou ajouter
> `library/` à sa liste de marqueurs) pour rester cohérent après rangement — **note d'implémentation
> Q-1**.

### 4.3 Parseur de frontmatter — **TRANCHÉ : mini-parseur maison, zéro-dep**
- **Fait vérifié (§ 10)** : Node (jusqu'à la LTS courante) **n'embarque aucun parseur YAML** ;
  tout support passe par une **dépendance tierce** (`js-yaml`, `yaml`, `gray-matter`). Or le CLI est
  **zéro-dep runtime** (contrainte `package.json`, cross-OS, publiable sur le registre Forgejo).
- **Décision** : nouveau module `cli/src/lib/frontmatter.js`, **mini-parseur maison** couvrant le
  **sous-ensemble réellement utilisé** par la bibliothèque (constaté sur les fichiers réels) :
  1. délimiteurs `---` … `---` en tête ; corps rendu tel quel ;
  2. **scalaires** : `clé: valeur`, valeurs entre guillemets (`"opus"`), non quotées, emoji (`"🔵"`) ;
  3. **listes flow** `clé: [a, b, c]`, **pouvant s'étendre sur plusieurs lignes** (cf.
     `methods/iakaframe.md` `principleIds`) ;
  4. **séquences de blocs** `- { k: v, k: v }` (maps inline, cf. `bindings/*` `assignments`,
     `workflows/*` `phases`/`gates`, `scaffolds/*` `entries`).
- **On ne réutilise PAS `@iakaframe/core`** pour le parsing : son cœur parse du **JSON**, pas du
  frontmatter (`lib/vocab.js` est déjà un **miroir** de `core` justement pour éviter d'importer
  `core` et rester zéro-dep). Le mini-parseur vit **dans le CLI**.
- **Garde de robustesse** : le parseur est **tolérant** (ignore les champs qu'il ne sait pas lire
  sans planter) mais **strict sur les champs requis** validés par `add` (§ 3.3). Toute construction
  YAML **hors sous-ensemble** rencontrée déclenche un **avertissement** (pas un crash) — la
  couverture réelle est verrouillée par les tests (§ 8) sur les fichiers de la bibliothèque.

### 4.4 Intégrité référentielle (I1) — **TRANCHÉ**
`lib/library.js` expose `resolveId(id)` (scan multi-collections) et `checkRefs(kind, data)` :
- `team` → `personas[]` ∈ `personas`, `coordinator` ∈ `personas`, `guardrails[]` ∈ `guardrails` ;
- `method` → `workflowId` ∈ `workflows`, `principleIds[]` ∈ `principles`, `ritualIds[]` ∈ `rituals`,
  `guardrailIds[]` ∈ `guardrails`, `roleKeys[]` ∈ `roles`, `scaffoldIds[]` ∈ `scaffolds` ;
- `binding` → `methodId` ∈ `methods`, `teamId` ∈ `teams`, chaque `assignments[].personaId` ∈
  `personas`, `assignments[].runner` ∈ `RUNNER_KINDS` (`lib/vocab.js`).
Toute réf. cassée = **rejet** de l'`add` (aucune écriture). C'est l'outillage de l'invariant I1.

### 4.5 Non-destructivité de `switch` — **TRANCHÉ**
Sauvegarde **systématique** de `<projet>/.claude/` en `<projet>/.claude.bak-<horodatage>/` avant
écriture ; `--rollback` restaure la **dernière** sauvegarde ; marqueur `iakaframe-kit.json` écrit
pour tracer méthode/team/binding/node actifs. Aucune suppression : la bascule **superpose** puis
laisse le `.bak-*` comme filet.

### 4.6 Réutilisation de l'existant — **TRANCHÉ**
- Affichage : `lib/table.js` (`table()`, `wrap()`) pour toutes les sorties tabulaires.
- Déploiement projet (`switch`) : `lib/agents.js` (`fullteam`, `affectPersona`, `copyDir`),
  `lib/kit.js` (`copyKit`, `frameworkRoot`).
- Nœuds/runners : `lib/vocab.js` (`NODE_KINDS`, `RUNNER_KINDS`, `normalizeNode`).
- Résolution chapeau : `lib/root.js` (inchangé — la **bibliothèque** a sa propre résolution § 4.2).
- **Nouveaux modules** : `lib/frontmatter.js` (parseur), `lib/library.js` (collections, scan,
  résolution, refs, assemble), et 5 commandes `commands/{list,show,add,assemble,switch}.js`.

---

## 5. Branchement dans le dispatch (non-régression)
Dans `cli/src/index.js` : ajouter les `import` des 5 `run<Verbe>` et 6 `case`
(`list`, `show`, `add`, `assemble`, `switch`, `use` → `runSwitch`). Ajouter les lignes d'aide dans
`HELP`. **Aucune commande existante n'est modifiée** ; le `default` (commande inconnue) reste. Les
verbes `list`/`show`/`add`/`assemble`/`switch`/`use` **n'entrent pas en collision** avec l'existant
(`onboard init snapshot update services config agents go banner brief recap jalon root`).

---

## 6. MVP / différé (marquage explicite)

**[MVP] — lecture + composition** (cœur, livrable d'abord)
- `list`, `show` (scan + parse + affichage), `assemble` (compose + contrôle de compatibilité,
  **dry-run** par défaut). Fondations `lib/frontmatter.js` + `lib/library.js`.

**[MVP-2] — écriture** (deuxième tranche du **même** lot, juste derrière)
- `add` (livraison + intégrité référentielle), `switch`/`use` (bascule projet non destructive avec
  sauvegarde/rollback, déploiement via le chemin `agents/kit` existant).

**[différé] — hors de ce lot**
- **Génération multi-runner complète** : rendre tout l'arbre `emits[]` d'un kit non-Claude (codex,
  ollama, openwebui, anythingllm) depuis un binding, via des **adaptateurs par nœud**. Au MVP-2,
  `switch` s'appuie sur le déploiement Claude existant ; le vrai moteur de rendu par runner est une
  instruction séparée (aligne sur les adaptateurs `lib/kit.js`/`vocab.js` déjà en place).
- **`assemble --write` industrialisé** (génération et versionnement systématiques des kits) au-delà
  du descripteur MVP.
- **Édition/validation de schéma runtime dans `@iakaframe/core`** (partage forge↔cockpit du
  parseur) : reste côté `iakaframegui` (cf. `rangement` § 5 [différé]).

---

## 7. Critères d'acceptation (vérifiables)

1. **Non-régression** : `node --test` vert ; `iakaframe --help` liste les 6 nouveaux verbes ;
   toutes les commandes existantes dispatchent comme avant (test de dispatch).
2. **`list`** : `iakaframe list` affiche 12 collections avec comptes réels ; `list personas` = 8 ids
   (hors `_TEMPLATE`) ; `list skills` = les dossiers `library/skills/*` avec `SKILL.md` ; type
   inconnu → `exitCode=1` + liste des types.
3. **`show`** : `show gandalf` rend le frontmatter (`roleKey: cadrage`, `skills: [iakaframe-cadrage]`)
   + le corps ; `show <inconnu>` → `exitCode=1` ; collision d'id → demande `--type`.
4. **Parseur (§ 4.3)** : lit correctement les 4 formes (scalaire quoté/emoji, liste flow multi-ligne
   `methods/iakaframe.md`, map inline `bindings/*` `assignments`) — testé sur fichiers réels.
5. **`add`** : fixture avec réf. cassée → **refus sans écriture** (`exitCode=1`, ids manquants
   listés) ; fixture valide → **déposée** dans `teams|methods|bindings/` et visible par `list` ;
   `id != basename` → refus.
6. **`assemble`** : `assemble iakaframe iakaframe-8` → **compatible** (8/8 rôles couverts) et émet un
   descripteur de kit ; team amputée d'un rôle → **échec** avec rôles orphelins listés ; binding
   incohérent (`methodId`/`teamId` ≠) → échec.
7. **`switch`/`use`** : sur projet temporaire, crée `.claude/agents/*` (personas de la team) + marqueur
   `iakaframe-kit.json` ; si `.claude/` préexistait, une `.claude.bak-*` est créée ; `--rollback`
   restaure ; incompatibilité → **aucune écriture**.
8. **Frontière (§ 2)** : aucun verbe autre que `add` n'écrit dans `library|teams|methods|bindings/` ;
   `switch` n'écrit **que** dans `<projet>/.claude/`.
9. **Zéro-dep** : `package.json` **inchangé** côté `dependencies` (aucune dépendance runtime
   ajoutée) ; le parseur est maison.
10. **Tests `node --test`** présents pour : parseur (`frontmatter.test.js`), scan/refs/assemble
    (`library.test.js`), et dispatch/args des verbes.

---

## 8. Plan de tests attendu (`node --test`)
- `test/frontmatter.test.js` — scalaires quotés/emoji, liste flow multi-ligne, séquence de maps
  inline, corps préservé, tolérance aux champs inconnus.
- `test/library.test.js` — `COLLECTIONS` complet ; `scan(type)` compte correct ; `resolveId` ;
  `checkRefs` détecte une réf. cassée (fixtures dans `test/fixtures/`) ; `assemble` compat OK / KO.
- `test/verbs-args.test.js` — parsing des options de chaque verbe, alias `use`→`switch`, `--json`.
- Non-régression : un test vérifie que le `switch`/`case` de `index.js` mappe bien les 6 verbes.
- Fixtures : `test/fixtures/library/` (mini-pool) pour isoler des cas de refs cassées sans toucher la
  vraie bibliothèque.

---

## 9. Questions d'arbitrage résiduelles (à trancher au jalon)

- **Q-1 — Marqueur de `frameworkRoot()` après rangement.** Le rangement déménage `kit-*` → `kits/`,
  ce qui **casse** le marqueur `kit-claude` de `frameworkRoot()` (`lib/kit.js`). Reco : dans ce lot,
  **basculer le marqueur sur `library/`** (repli). → *Confirmer qu'on corrige `frameworkRoot()` ici
  plutôt que dans le lot rangement.*
- **Q-2 — Variable d'env : `IAKAFRAME_HOME` (bibliothèque) distincte de `IAKAFRAME_ROOT` (chapeau).**
  Reco : oui, deux variables (deux racines différentes). → *Confirmer le nom `IAKAFRAME_HOME`.*
- **Q-3 — `assemble` : dry-run par défaut, `--write` pour matérialiser un kit ?** Reco : oui
  (composition = lecture par défaut, écriture explicite). → *Confirmer.*
- **Q-4 — `switch` au MVP-2 : déploiement Claude uniquement (via `agents`/`kit` existants), reste
  multi-runner [différé] ?** Reco : oui. → *Confirmer le périmètre du déploiement.*
- **Q-5 — `add` accepte-t-il aussi les atomes du pool** (`persona`, `principle`, …) ou **uniquement
  les 3 assemblages** (`team|method|binding`, comme demandé) ? Reco MVP : **les 3 assemblages
  seulement** (le pool s'édite à la main / par la forge). → *Confirmer.*
- **Q-6 — Marqueur d'état projet.** Reco : `<projet>/.claude/iakaframe-kit.json`. → *Confirmer le nom
  et l'emplacement (dans `.claude/` vs racine projet).*
- **Q-7 — Sortie `--json` sur tous les verbes** (pour brancher la forge/cockpit plus tard) ? Reco :
  oui, peu coûteux et utile. → *Confirmer.*

---

## 10. Faits vérifiés sur le web (2026-07-15) + sources

- **Node.js n'embarque aucun parseur YAML natif** (jusqu'à la LTS courante) : le support YAML passe
  **exclusivement** par une dépendance tierce (`js-yaml`, `yaml` d'eemeli, ou `gray-matter` pour le
  frontmatter). **Conséquence tranchée** : ajouter l'une de ces libs **violerait** la contrainte
  **zéro-dep runtime** du CLI (`package.json`, cross-OS, publiable Forgejo) → **mini-parseur maison**
  sur le sous-ensemble réellement utilisé (§ 4.3). *(Convergence avec `lib/vocab.js`, déjà écrit en
  miroir maison pour éviter d'importer `@iakaframe/core`.)*
- **BMAD v6** (rappel du lot rangement) indexe son pool `.md`+frontmatter **par scan de motif** — ce
  lot **outille** exactement ce scan (`list`/`show`), pas un manifeste : cohérent avec l'invariant I2.

Sources :
- [js-yaml — parser YAML JavaScript](https://github.com/nodeca/js-yaml)
- [yaml (eemeli) — parser/serialiseur YAML](https://github.com/eemeli/yaml)
- [yaml — page npm](https://www.npmjs.com/package/yaml)

---

## 11. Journal de décision
- **2026-07-15** — Le décideur cadre une **couche de commandes CLI** sur la bibliothèque
  (`list`/`show`/`add`/`assemble`/`switch`) dans `@naonedge/iakaframe`. **Tranché** : mini-parseur
  frontmatter **maison** (zéro-dep, Node sans YAML natif) ; résolution de racine par
  **`IAKAFRAME_HOME` > double marqueur `library/`+`methods/` > `frameworkRoot()`** ; **intégrité
  référentielle** obligatoire à l'`add` (I1) ; **non-destructivité** de `switch` (sauvegarde+rollback,
  écrit dans le projet, jamais la bibliothèque) ; **frontière fabrication (`add`) / exécution
  (`assemble`,`switch`)** gravée. **MVP** = `list`/`show`/`assemble` (lecture+compose) ; **MVP-2** =
  `add`/`switch` (écriture) ; **[différé]** = rendu multi-runner complet depuis un binding. Réutilise
  `table`/`agents`/`kit`/`vocab`. **Cadrage seul, aucun code de production.**

> Tant que ce jalon n'est pas validé, **aucun code n'est écrit**. Ce lot ne produit que du
> **cadrage** ; l'implémentation (Gimli) suit la validation du décideur.
