# Lot — verbe CLI d'hébergement (agnostique) + adaptateur Forgejo + correctif de doc `methode-de-travail.md`

> Cadrage P1 (🧙 Gandalf), **révisé après recadrage du décideur** (architecture en deux étages,
> agnosticisme du fournisseur). **Un seul lot, deux dettes disjointes** : (1) une correction de doc
> triviale ; (2) le dernier geste CLI manquant — brancher/créer le dépôt distant d'un projet — qui
> touche **exactement** l'opération mise sous garde le 2026-07-21 (`POST /api/v1/user/repos`). Le cœur
> du cadrage : la **frontière geste non-destructif / geste créateur** (inchangée, confirmée par le
> décideur) **et** la **frontière geste-neutre / adaptateur-fournisseur** (nouvelle). Cohérence stricte
> avec `specs/instructions/correctif-bascule-update-onboard-drapeaux.md` (merge `cb2a9b9`).

## Outillage du cadreur (déclaration)

**`Bash` INDISPONIBLE.** Cadrage mené avec `Read` / `Grep` / `Glob` uniquement. En conséquence :

- **aucune commande n'a été exécutée** — ni `git`, ni `node --test`, ni `iakaframe` ;
- les baselines du brief (**suite CLI 464 / 463 pass / 0 fail / 1 skip**, `vendor-check clean`,
  `principleIds = 18`) sont **reprises telles quelles, non revérifiées** par moi — à la charge du gate ;
- toutes les affirmations ci-dessous sont des **constats de lecture**, traçables au `chemin:ligne`.

**Web.** Aucune décision de ce lot ne repose sur un fait externe (version / compatibilité / état de
l'art) : l'endpoint Forgejo `POST /api/v1/user/repos` est **déjà** utilisé par le code
(`cli/src/lib/forgejo.js:48`), on ne choisit aucune techno nouvelle. Pas de vérification web requise —
tous les faits sont internes au dépôt et mesurés par lecture.

---

## 0. Faits vérifiés — dont une correction à la prémisse du recadrage

### 0.1 Faits du brief initial — confirmés (aucune correction)

- **DETTE 1.** `methode-de-travail.md:144` prescrit bien `pwsh C:\work\naonedge-dashboard\scan.ps1`.
  `cli/src/commands/onboard.js:182-192` **préfère déjà `scan.js`** (`process.execPath [scanJs …]`) et
  ne retombe sur `scan.ps1` qu'en `else if`. `scan.js` **existe** :
  `/Users/sjupin/work/naonedge-dashboard/scan.js`. `methode-de-travail.md:49` affirme « Travaille sur
  **Windows + Docker Desktop + PowerShell** » — la machine courante est **macOS** (`darwin`). Faux confirmé.
- **DETTE 2.** `cli/src/index.js` (dispatch `switch`, l. 141-183) n'a **aucun** `case` pour ce geste.
  La logique métier existe et est complète dans `cli/src/lib/forgejo.js` : `token()`, `cfg(opts)`,
  `testRepo(repo,opts) → true|false|null`, `createRepo(repo, description, isPrivate, opts) →
  'created'|'exists'|throw`, `remoteUrl(repo,opts)`.
- **Vendorage NUL.** `methode-de-travail.md` **n'est pas** dans la table des fixtures
  (`cli/src/lib/vendor.js:76-114`) ; aucun `.js` non plus. Le corriger et ajouter un fichier CLI est
  **sans impact** sur `vendor-check` (reste `OK - 17 copies + 4 derivees`).

### 0.2 ⚠️ Correction à la prémisse du recadrage — l'architecture à deux étages EXISTE DÉJÀ (dans la couche skill)

Le recadrage demande de faire refléter les deux étages « à la couche SKILL » et évoque un principe de
backlog « renommer `iakaframe-forgejo` → `iakaframe-commit` ». **Mesuré : c'est déjà fait, et en mieux
(trois étages, pas un renommage plat) :**

| Étage | Skill | `layer:` | Rôle | `subskills:` |
|---|---|---|---|---|
| Capacité (geste agnostique) | `library/skills/iakaframe-gestion-de-source/SKILL.md` | `capacity` | « versionner / committer / historiser / brancher / pousser » — **ne nomme aucun produit** | `[iakaframe-git]` |
| Famille (protocole) | `library/skills/iakaframe-git/SKILL.md` | `family` | nomme **git** (le protocole), **jamais un serveur** | `[iakaframe-forgejo]` |
| Produit (adaptateur) | `library/skills/iakaframe-forgejo/SKILL.md` | `product` | l'**adaptateur Forgejo** concret (URL iakabox, API, token) | — |

`gitlab` / `github` seraient des **skills frères** de `iakaframe-forgejo` sous la famille `git`
(`subskills` de `iakaframe-git`). **La hiérarchie geste-agnostique → fournisseur voulue par le décideur
est donc déjà en place au niveau skill.** Le note de backlog « renommer → commit » est **caduque** :
l'agnosticisme y est porté par la **capacité** `gestion-de-source`, pas par un renommage.

**Ce qui manque réellement**, et que ce lot ferme, est **au seul niveau CLI** :
`iakaframe-forgejo/SKILL.md:74-76` le dit noir sur blanc — *« Il n'existe pas de verbe `iakaframe
forgejo` : la logique n'est atteignable qu'à travers `onboard` / `init` / `update` (dette inscrite au
backlog) »*. Le geste « brancher/créer le dépôt distant **hors onboarding complet** » n'a **pas** de
point d'entrée CLI. **C'est le seul trou.** Et il doit être percé **en respectant les deux étages**,
pas en gravant un `case 'forgejo'` nu (point du recadrage).

`cli/src/lib/forgejo.js` **est déjà l'adaptateur fournisseur** (l'équivalent code du skill produit) :
on ne le renomme pas, on ne le modifie pas — il est correct à sa place. Le travail est **au-dessus**.

---

## DETTE 1 — correction de doc `methode-de-travail.md`

### 1.1 Problème

Deux affirmations factuellement fausses (le **code a déjà raison contre la doc**) :

1. `methode-de-travail.md:49` — « Travaille sur **Windows + Docker Desktop + PowerShell** » : faux,
   le décideur est sur **macOS** ; le CLI est explicitement **multi-OS** (`cli/src/index.js:2`).
2. `methode-de-travail.md:142-147` — le réveil d'Odin prescrit `pwsh C:\work\naonedge-dashboard\scan.ps1`
   et des chemins `C:\work\…`, alors que `onboard.js:182-192` **préfère `scan.js` (cross-OS)** et que
   le dossier chapeau est **résolu** par le CLI (`~/work | C:\work`, cf. `index.js:117`).

### 1.2 Correctif prescrit (Gimli édite `methode-de-travail.md` — Gandalf ne touche pas ce fichier)

- **L. 49** : reformuler **multi-OS**, p. ex. « Travaille indifféremment sur **macOS / Linux /
  Windows** (Docker + le runner de son choix) ; le CLI `iakaframe` et les scripts sont **cross-OS**. »
- **L. 142-147** : rendre le geste de réveil **OS-agnostique**, aligné sur `onboard.js:182-192` :
  `node <chapeau>/naonedge-dashboard/scan.js --root <chapeau>` (cross-OS), `.ps1` **repli power-path
  Windows** ; remplacer les `C:\work\…` en dur par le **dossier chapeau résolu**.

**Non-régression vendorage** : la correction ne touche **que le corps** de `methode-de-travail.md`,
non vendoré (§ 0.1). `vendor-check` reste `OK - 17 copies + 4 derivees` (à re-constater au gate).

---

## DETTE 2 — le geste CLI d'hébergement de dépôt (le vrai travail)

### 2.1 Problème posé (avant toute solution)

Deux frontières se superposent, et il faut respecter **les deux** :

- **Frontière sûreté (confirmée par le décideur, inchangée)** : « brancher un remote » (non-destructif)
  vs « créer le dépôt distant » (`POST`, effet externe irréversible). La création n'a lieu **que** sur
  geste explicite `--create`. C'est la protection issue de l'incident `cb2a9b9`.
- **Frontière agnosticisme (nouvelle)** : le geste est **provider-neutre** (« branche/crée le dépôt
  distant de ce projet »), le **fournisseur** (Forgejo aujourd'hui ; GitLab/GitHub demain) est **un
  détail d'implémentation interchangeable**. Le verbe CLI **ne doit pas s'appeler `forgejo`** ni
  supposer partout l'API Forgejo (point du recadrage : « un `case 'forgejo'` nu trahit l'agnosticisme »).

Le principe de sûreté à respecter (issu de `cb2a9b9`) :

> **La création d'un dépôt distant est un acte qui dépasse ce que l'humain a demandé quand elle
> survient par effet de bord. Défaut sûr = refus. En headless = refus, jamais passage.**

### 2.2 Choix (a) vs (b) — **RETENU : (b), un verbe agnostique + `--provider`**

Le brief propose deux options. **Je recommande (b)**, et j'argumente.

- **(a) — verbe `forgejo` (l'adaptateur exposé directement) + geste agnostique ailleurs.** Rejetée :
  c'est précisément le `case 'forgejo'` nu que le recadrage proscrit. Elle grave le nom du fournisseur
  à l'étage geste (là où l'agent invoque), en contradiction avec le point 4 (« ce qui l'appelle ne doit
  pas s'appeler *le geste forgejo* ») et avec la hiérarchie skill déjà en place (§ 0.2), où le geste est
  la **capacité** agnostique.
- **(b) — verbe agnostique portant `--provider` (défaut `forgejo`), l'adaptateur `forgejo` en
  dessous.** ✅ **Retenue.** Elle **calque exactement** la chaîne skill : le verbe = l'étage
  capacité/famille (geste + protocole neutres) ; `--provider forgejo` sélectionne l'**adaptateur**
  (`lib/forgejo.js`), équivalent code du skill produit. Ajouter GitLab demain = un adaptateur au
  **même contrat** (§ 2.3) — **lib, shell ou serveur MCP**, peu importe le substrat — + une entrée de
  registre + `--provider gitlab` : un `+` **symétrique** (règle de décomposabilité `+/−`), **jamais une
  réécriture**. Le point d'extension est **nommé et non hacké**, ce qu'exige le décideur.

**Nom du verbe** — décision laissée au décideur (§ 5 q.1). Je recommande **`repo`** (un mot, agnostique,
au style des verbes existants : `onboard`, `snapshot`, `config`…). Alternative : `git-host`
(plus auto-documenté, mais hyphéné — aucun verbe hyphéné n'existe aujourd'hui). Dans la suite du
document, `<verbe>` désigne ce nom (provisoirement `repo`).

### 2.3 Ce qui est GESTE NEUTRE vs ce qui est ADAPTATEUR (réponse au point 3 du recadrage)

| Relève du **geste neutre** (le verbe `<verbe>`, provider-independent) | Relève de l'**adaptateur** (`--provider`, ex. `lib/forgejo.js`) |
|---|---|
| La **politique de sûreté** : « sans `--create` → jamais de création ; avec `--create` → créer ». **La garde vit ici** → elle protège **tout** fournisseur futur (GitLab/GitHub), gratuitement. | Le **`POST` de création** concret (endpoint, corps JSON, code 409→`exists`) : `createRepo`. |
| La **précondition** « `--path` doit être un dépôt git » ; le refus vers `onboard` ; la sémantique des sorties (exit ≠ 0, messages). | Le **test d'existence** concret (quel endpoint API) : `testRepo → true\|false\|null`. |
| La **sélection du fournisseur** (`--provider`, résolution via le registre) et la décision « brancher vs créer ». | Le **pattern d'URL** du remote + l'injection du **credential** sans le persister : `remoteUrl`. |
| Le branchement du remote **git** (`git remote add/set-url origin <url>`) — mécanique git commune. | La **description ASCII** exigée par le serveur (422 sinon) et le nom de la variable de token. |

**Point clé de sûreté** : placer la garde `--create` **au geste neutre** (et non dans l'adaptateur)
est un choix de conception fort — la protection de l'incident `cb2a9b9` devient **structurelle** et
couvre d'avance chaque provider qu'on branchera. L'adaptateur n'expose que des mécaniques ; il
**n'a pas le droit de créer** sans que le geste neutre le lui demande.

**Contrat d'adaptateur — l'interface, PAS le substrat (précision du décideur).** Le geste neutre
dispatche vers un adaptateur **par contrat**, une **interface** que tout fournisseur doit remplir,
**sans présumer comment il est implémenté**. Le substrat est libre :

- **(a) une lib locale** — `lib/forgejo.js` aujourd'hui ;
- **(b) une commande shell** wrappant un CLI tiers ;
- **(c) un serveur MCP** (Model Context Protocol) — certaines skills / *type tools* pointent déjà
  vers des MCP.

**L'interface `HostAdapter`** (trois capacités, contractuelles, indépendantes du substrat) :

| Capacité | Sémantique de retour | Aujourd'hui (`lib/forgejo.js`) |
|---|---|---|
| **existe ?** | `true` \| `false` \| `null` (inconnu) | `testRepo(repo,opts)` |
| **créer** | `'created'` \| `'exists'` \| lève | `createRepo(repo,description,isPrivate,opts)` |
| **URL de remote** | chaîne (credential injecté, jamais persisté en clair) | `remoteUrl(repo,opts)` |

Le geste neutre **ne connaît que ces trois capacités**. Que l'adaptateur les serve depuis une lib, un
shell ou un MCP lui est **invisible**. C'est ce qui rend l'ajout d'un fournisseur MCP-backed un `+`
**symétrique** (fournir l'interface, l'enregistrer) et **jamais une réécriture du geste**.

**MVP : on ne code qu'un adaptateur — Forgejo, substrat lib** — dont la signature *est déjà* cette
interface (aucune modification de `lib/forgejo.js`). Un futur GitLab pourra être une lib, un shell **ou
un MCP** : le geste neutre s'en moque, il appelle l'interface.

### 2.4 Le contrat du verbe — surface & comportement (frontière sûreté inchangée)

**Surface :** `iakaframe <verbe> [<repo>] [--path <dir>] [--provider <nom>] [--create] [--description "ascii"]`

- `<repo>` (positionnel) ou `--repo <nom>` ; défaut = `basename(--path || cwd)` — mirroir `onboard.js:52`.
- `--path <dir>` : le dépôt **local** à brancher ; défaut = `cwd`.
- `--provider <nom>` : sélectionne l'adaptateur ; **défaut `forgejo`** (seul disponible en MVP).
  Un provider inconnu → **erreur claire** (« fournisseur inconnu : '<x>' ; disponible : forgejo »),
  exit ≠ 0. **C'est le point d'extension non hacké.**
- `--create` : **le seul drapeau qui autorise la création distante** (voir table).
- `--description "ascii"` : passée à `createRepo` (n'a de sens qu'avec `--create`).
- Visibilité : **privé par défaut** (`isPrivate = true`), mirroir `onboard.js:105`. Pas de drapeau de
  visibilité en MVP.

**Préconditions :** `--path` **doit** être un dépôt git (`isRepo(root)`). Sinon → **REFUS**, exit ≠ 0,
message vers `iakaframe onboard`. Le verbe **n'initialise jamais** de dépôt git (c'est l'onboarding).

**Comportement — la coupe de sûreté (identique à la version validée) :**

| `provider.testRepo(repo)` | Sans `--create` | Avec `--create` |
|---|---|---|
| `true` (existe) | Configure `origin` → `provider.remoteUrl(repo)` ; **aucune création**. Succès. | Idem (rapporte « existe déjà », configure le remote). |
| `false` (404) | 🛑 **REFUS** : exit ≠ 0, « le dépôt distant '<repo>' n'existe pas ; pour le créer : `iakaframe <verbe> <repo> --create`. **Aucun dépôt créé.** » | `provider.createRepo(repo, description, true)` (**POST**) puis configure le remote. |
| `null` (inconnu) | 🛑 **REFUS** : exit ≠ 0, « état inconnu (token absent ou serveur injoignable) ; aucune action. » | `createRepo` lèvera (token/réseau) → exit ≠ 0. Aucun dépôt créé. |

**Configuration du remote (geste git local, non-destructif)** : mirroir `onboard.js:108-110` — `origin`
présent → `git remote set-url origin <url>` ; sinon `git remote add origin <url>`.

### 2.5 La garde `--create` — pourquoi explicite SUFFIT (confirmé par le décideur)

**Propriété centrale, non négociable :**

> **`iakaframe <verbe> <repo>` SANS `--create` n'émet JAMAIS de `POST` de création** (quel que soit le
> provider). Il se limite à un test d'existence (lecture seule) + une configuration de remote **locale**.

Application directe du § 4.2 de `cb2a9b9` : *l'intention est portée par le verbe/drapeau tapé.* Sans
`--create`, la création serait un **effet de bord** → refusée (headless ou non). Avec `--create`, elle
**est** la demande — analogue à `onboard` direct (test C8), qui crée sans invite même headless.
**Pas de double-verrou headless** (confirmé par le décideur) : ce serait incohérent avec `onboard`
direct et de la sur-ingénierie. `--create` (anglais, comme `--skip-forgejo`/`--no-push`/`--force`),
distinct de `--autoriser-creation-depot` (échappatoire à un effet de bord — sémantique différente).

### 2.6 Câblage — SANS `case 'forgejo'` (point 2/4 du recadrage)

- **Nouveau** `cli/src/commands/<verbe>.js` exportant `run<Verbe>(argv)` : porte la **politique neutre**
  (garde, précondition, sélection provider, branchement du remote).
- **Registre de fournisseurs minimal** (dans ce fichier ou `cli/src/lib/providers.js`) : mappe un nom
  de provider → un **résolveur d'adaptateur** qui rend l'interface `HostAdapter` (§ 2.3). En MVP,
  **une seule entrée**, substrat lib : `{ forgejo: () => import('./forgejo.js') }`. Le registre ne doit
  **pas coder en dur « adaptateur = import de module Node »** : sa valeur est un résolveur qui *produit
  l'interface*, quel que soit le substrat — demain un adaptateur **shell** ou **MCP** s'y enregistre par
  le même mécanisme, sans que le geste neutre change. C'est le point d'extension : ajouter un provider
  (lib, shell ou MCP) = une entrée + un objet qui remplit l'interface.
- `cli/src/index.js` : `import { run<Verbe> }` + `case '<verbe>': await run<Verbe>(rest); break;` +
  une entrée `HELP` **nommant** le geste comme provider-neutre (`--provider` défaut `forgejo`,
  `--create` requis pour créer).
- **Interdit** : un `case 'forgejo'` au dispatch, ou un verbe important `lib/forgejo.js` en dur sans
  passer par le registre. Le nom `forgejo` **n'apparaît qu'à l'étage adaptateur** (valeur de
  `--provider`, clé de registre, nom de fichier `lib/forgejo.js`), **jamais** comme nom de geste.

### 2.7 Cohérence avec l'existant (ne pas contredire)

`<verbe> --create` réalise **exactement le sous-ensemble** de l'étape `[2/5]` d'`onboard`
(`onboard.js:103-111` : create + branchement du remote), **amputé** du reste (structure, `.env`,
commit, snapshot, push). Le verbe **n'écrit pas** le `.env`, **ne commite pas**, **ne pousse pas**,
**ne snapshot pas**. Périmètre étroit voulu (« sans dérouler un onboarding complet »).

**`onboard`/`update` restent forgejo-hardcodés** pour l'instant (ils importent `lib/forgejo.js`
nommément). Les rendre provider-agnostiques est un **lot futur** (le `+` quand GitLab arrivera), **hors
périmètre ici**. Ce lot plante le motif propre sur le **nouveau** verbe ; il ne réécrit pas l'existant.

**Mise à jour doc du skill** : `iakaframe-forgejo/SKILL.md:74-76` affirme « Il n'existe pas de verbe » —
faux une fois ce lot livré. **À rectifier** (nommer le nouveau verbe neutre + `--provider forgejo`).
Touche `library/` → **arbitrage** (§ 5 q.4) : inclure dans ce lot ou lot doc séparé.

---

## 3. Contrainte de test — ne JAMAIS toucher une vraie forge

**Non négociable — l'incident du 2026-07-21 vient d'un test qui a touché la forge réelle.**
**Réutiliser le motif** de `cli/test/switch-flags-guard.test.js` :

1. faux serveur `node:http` local sur port éphémère `127.0.0.1`, **journalisant chaque requête** →
   preuve positive d'absence de `POST /api/v1/user/repos` ;
2. `FORGEJO_URL=http://127.0.0.1:<port>`, `FORGEJO_TOKEN=<factice>`, `FORGEJO_USER=sjupin`,
   `GIT_TERMINAL_PROMPT=0` ;
3. **GARDE de fichier obligatoire** : avant chaque spawn, si `FORGEJO_URL` ne matche pas
   `^http://127\.0\.0\.1:\d+$` → **throw immédiat** ;
4. réponses scriptées (`404`/`200`/`500`), `POST /api/v1/user/repos` → `201` ;
5. `origin` peut pointer sur un **bare local** pour rendre le branchement inoffensif et observable
   (`git remote get-url origin`).

**Aucun test ne doit lire `FORGEJO_URL` par défaut.**

---

## 4. Critères d'acceptation

`<verbe>` = le nom retenu au § 5 q.1 (provisoirement `repo`).

### DETTE 1 — doc

- **D1.** `methode-de-travail.md` ne contient plus « Windows + Docker Desktop + PowerShell » comme
  environnement du décideur ; ligne reformulée **multi-OS**.
- **D2.** Le réveil d'Odin (§ 142-147) prescrit `node <chapeau>/…/scan.js --root <chapeau>` (cross-OS),
  `.ps1` en repli Windows ; les `C:\work\…` en dur sont remplacés par le chapeau résolu.
- **D3.** `vendor-check` reste `OK - 17 copies + 4 derivees` — inchangé (§ 0.1).

### DETTE 2 — le geste & ses deux frontières

**Frontière sûreté (le cœur) :**

- **F1 — CAS DE DÉFAUT CENTRAL.** Dépôt git local présent, fausse forge `404` : `iakaframe <verbe>
  <repo>` (**sans `--create`**) → (a) **aucun** `POST /api/v1/user/repos` reçu (journal) ; (b) exit ≠ 0 ;
  (c) la sortie nomme `--create`. *Doit ÉCHOUER si la garde est retirée.*
- **F5 — pas un dépôt git.** `--path` sans `.git` : REFUS, exit ≠ 0, message vers `onboard`, aucun `POST`.
- **F6 — état inconnu.** Fausse forge `500` (→ `testRepo` `null`) : REFUS, exit ≠ 0, aucun `POST`, aucun remote.

**Cas nominal (sûreté) :**

- **F2 — branchement non-destructif.** Fausse forge `200`, dépôt git présent : `<verbe> <repo>` →
  `origin` configuré vers l'URL de la fausse forge (`git remote get-url origin`), **aucun `POST`**, exit `0`.
- **F3 — création explicite.** Fausse forge `404` : `<verbe> <repo> --create` → un `POST` **reçu**,
  remote configuré, exit `0`, **aucun** message de refus.
- **F4 — création idempotente.** `--create` quand la création répond `409` (→ `'exists'`) : rapporte
  « existe déjà », configure le remote, pas d'erreur.
- **F7 — `--create` explicite passe en headless.** `<verbe> <repo> --create` non interactif : crée
  (POST reçu), **sans invite ni refus** (analogue C8). Pendant de F1.

**Frontière agnosticisme (la révision) :**

- **F8 — provider par défaut.** `<verbe> <repo>` sans `--provider` se comporte comme `--provider
  forgejo` (l'adaptateur Forgejo est appelé). Vérifie que le défaut est bien `forgejo`.
- **F9 — point d'extension non hacké.** `<verbe> <repo> --provider gitlab` (non enregistré en MVP) →
  **erreur claire** « fournisseur inconnu : gitlab ; disponible : forgejo », exit ≠ 0, **aucun `POST`**,
  aucun crash non géré. *Prouve que l'ajout d'un provider est un `+` propre, pas un patch.*
- **F10 — pas de `case 'forgejo'`.** Le dispatch (`cli/src/index.js`) route un verbe **agnostique**,
  pas `forgejo` ; `grep "case 'forgejo'"` sur `cli/src/index.js` ne renvoie **rien**. (Vérif de revue.)

**Non-régression / surface :**

- **F11 — dispatch & HELP.** `iakaframe <verbe> …` routé ; le `HELP` liste le verbe, `--provider`
  (défaut `forgejo`) et `--create` (requis pour créer).
- **F12 — suite CLI.** `node --test` sous `cli/` : **0 fail**, total **≥ 464**, `skipped` = **1**.
- **F13 — `vendor-check` clean** : `OK - 17 copies + 4 derivees`, `--root` sur le canon.
- **F14 — invariants.** `principleIds` = **18** ; `memory.js`, `TARGETS`, `cadence.close_on =
  ['pause','version']` inchangés ; `library/principles/` **non ouvert** ; `cli/src/lib/forgejo.js`
  **non modifié** (l'adaptateur est correct, on l'appelle).

---

## 5. Questions laissées au décideur (à trancher avant P2)

1. **Nom du verbe agnostique (§ 2.2)** : `repo` (recommandé) ou `git-host` / autre ?
2. **Approche `--provider` (§ 2.2)** : confirmer l'option **(b)** — verbe agnostique + `--provider forgejo`
   par défaut + registre extensible — plutôt qu'un verbe `forgejo` direct ? *Recommandation : oui.*
3. **Registre de fournisseurs** : dans le fichier de commande (MVP suffisant) ou un `cli/src/lib/providers.js`
   dédié dès maintenant (plus lisible pour l'ajout futur) ? *Recommandation : `providers.js` léger — le point
   d'extension est alors explicitement nommé.*
4. **Ligne stale du skill (§ 2.7)** : rectifier `iakaframe-forgejo/SKILL.md:74-76` **dans ce lot**
   (touche `library/`) ou lot doc séparé ?
5. **Confirmés, ne pas rouvrir** : pas de double-verrou (`--create` suffit) ; anglais (`--create`) ;
   un lot / deux commits ; le verbe n'initialise jamais ; `lib/forgejo.js` = adaptateur, non renommé ;
   `--json` / visibilité hors MVP ; `build-methode-code.ps1` hors périmètre.

---

## 6. Un lot ou deux ? — **UN lot, gate clair, deux commits atomiques**

Dettes disjointes par fichiers, aucun recouvrement :

- DETTE 1 → `methode-de-travail.md` (corps, non vendoré) ;
- DETTE 2 → `cli/src/commands/<verbe>.js` (**nouveau**), `cli/src/lib/providers.js` (**nouveau**, si
  § 5 q.3), `cli/src/index.js` (dispatch + HELP), `cli/test/<verbe>-guard.test.js` (**nouveau**),
  et — si § 5 q.4 « oui » — `library/skills/iakaframe-forgejo/SKILL.md` (une ligne).

Chaque dette a ses critères indépendants (D1-D3 vs F1-F14) → un `git diff --stat` sépare proprement.
**Deux commits atomiques** : `docs: aligner methode-de-travail sur la réalité multi-OS (scan.js,
chapeau résolu)` et `feat(cli): verbe d'hébergement agnostique (--provider forgejo, --create requis)`.
Un lot, une instruction, **un gate P1→P2**.

### Périmètre fermé — dans le périmètre

- `methode-de-travail.md` (corps, l. 49 et 142-147) — **édité par Gimli**, pas par Gandalf.
- `cli/src/commands/<verbe>.js` — **nouveau** : politique neutre + garde + sélection provider.
- `cli/src/lib/providers.js` — **nouveau** (si § 5 q.3) : registre `{ forgejo }`.
- `cli/src/index.js` — `import` + `case '<verbe>'` (agnostique) + entrée `HELP`.
- `cli/test/<verbe>-guard.test.js` — **nouveau** : faux serveur local + F1-F11.
- `library/skills/iakaframe-forgejo/SKILL.md:74-76` — **seulement si** § 5 q.4 « oui ».

### Hors périmètre — explicitement

- `cli/src/lib/forgejo.js` : **ne pas modifier** — c'est l'adaptateur fournisseur, correct ; on
  l'appelle via le registre.
- **Agnosticisation d'`onboard`/`update`** vers `--provider` : **lot futur**, pas ici (§ 2.7).
- Coder un provider `gitlab`/`github` (quel que soit son substrat : lib, shell ou MCP) : **pas
  maintenant** (MVP = Forgejo seul, substrat lib) ; on laisse la **place** via l'interface `HostAdapter`.
- Les skills `iakaframe-gestion-de-source` / `iakaframe-git` : **déjà corrects** (§ 0.2), on n'y touche pas.
- `memory.js`, `TARGETS`, `principleIds`, `cadence.close_on`, `library/principles/`, `vendor-check` et
  ses fixtures ; `build-methode-code.ps1` et les `.ps1`.
- `.env`, commit, snapshot, push depuis le verbe (onboarding, pas ce verbe).
- Toute **suppression** de dépôt sur la forge : **geste humain**, jamais outillé.

---

## 7. Délégable / geste humain

| Geste | Nature |
|---|---|
| Correctif de doc `methode-de-travail.md` (D1-D2) | **Délégable** (Gimli) |
| `cli/src/commands/<verbe>.js` + registre providers + dispatch + HELP | **Délégable** (Gimli) |
| Faux serveur + tests F1-F11 (motif `switch-flags-guard.test.js`) | **Délégable** (Gimli) |
| Rectif ligne stale `iakaframe-forgejo/SKILL.md` | **Délégable** (Gimli), **si** § 5 q.4 « oui » |
| Nom du verbe ; option (b) ; emplacement du registre ; skill dans ce lot ? (§ 5 q.1-4) | **Décideur** |
| **Interdiction** d'exécuter un `iakaframe <verbe>` / `onboard` / `update` **réel** (tests via faux serveur uniquement) | **Contrainte dure — délégable ET humain** |
| Toute suppression de dépôt sur la forge | **Humain exclusivement** |
| Vérifier la forge réelle indemne après le lot | **Humain** (décideur ou Odin) |

---

## 8. Estimation (obligatoire au jalon P1→P2)

| Périmètre | j-h |
|---|---|
| DETTE 1 — correctif doc | **0,1** |
| DETTE 2 — verbe neutre + garde + **registre `--provider`** + dispatch + HELP (~30-40 lignes) | **0,35** |
| DETTE 2 — faux serveur + tests F1-F11 (dont F9/F10 agnosticisme) | **0,55** ← *le plus lourd* |
| Rectif ligne stale skill (si § 5 q.4) | **0,05** |
| Exécution du gate (suite CLI + vendor-check) | **0,15** |
| **Total recommandé** | **≈ 1,2 j-h** |

**Complexité / risque : FAIBLE à MOYEN.** Le surcoût vs la version pré-recadrage (~1,0 j-h) est le
**registre `--provider` + ses tests** (F8-F10) : ~+0,2 j-h. Faible, parce que l'agnosticisme est **déjà
porté par la couche skill** (§ 0.2) — le CLI ne fait que refléter une structure existante, et le contrat
d'adaptateur est **déjà** la signature de `lib/forgejo.js` (rien à réusiner). Le poste de test domine et
**empêche la récidive** de l'incident du 2026-07-21 **pour tout provider futur**.

**Inconnues :**

1. **Emplacement/forme du registre** (§ 5 q.3) : fichier dédié vs inline. **± 0,05 j-h.**
2. **Ligne stale du skill** dans ce lot ou séparé (§ 5 q.4) : **± 0,05 j-h.**
3. **Traitement de l'état `null`** (refuser vs configurer) : ergonomie mineure, **± 0,05 j-h.**

**Ce n'est pas un engagement ferme** : ordre de grandeur assumé et révisable, confronté au temps réel
à la clôture du lot.
