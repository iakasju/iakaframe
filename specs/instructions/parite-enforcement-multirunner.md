# Instruction — Enforcement au host + exécution par persona (modèle « persona »)

> **v2 — recadré modèle persona.** Cette version **remplace** le cadrage précédent (« porter
> l'enforcement sur chaque runner » + proxy Docker Ollama), **invalidé** par la clarification du
> décideur. Voir § 0 pour ce qui change et ce qui est abandonné.
>
> **Auteur** : Gandalf (P1 — Cadrage). **Statut** : modèle fermé, deux briques cadrées, lots
> ré-implémentables. **Dépôts concernés** : `iakaframe` (kits + hooks + CLI) et `iakaFrameGUI`
> (`packages/core` : modèle Binding + vocab).

---

## 0. Ce qui change (v1 → v2) — lire d'abord

**Le modèle précédent est INVALIDÉ.** Il raisonnait « 5 runners cibles, porter les 3 gardes sur
chacun, + un proxy Docker devant Ollama ». Le décideur a tranché un **autre** découpage, qui fait
foi et **ne se rediscute pas** :

- **La granularité, c'est le persona.** Chaque persona d'une équipe s'exécute sur un **runner +
  un model + (optionnellement) des tools**. Ce triplet est porté par le **Binding**.
- **Les points d'entrée = HOSTS = {claude, codex, openwebui} UNIQUEMENT.** C'est là que le
  décideur saisit `odin` (ou un `aragorn`, …). **L'enforcement vit AU HOST**, pas sur les cibles
  d'exécution des personas.
- **Ollama et ChatGPT ne sont PAS des hosts** — ce sont des **cibles d'exécution de persona**. Un
  persona sur Ollama est **dispatché par un host qui enforce**. → **le proxy Docker Ollama est
  ABANDONNÉ** (l'ancien « Lot 4 » n'existe plus).
- **AnythingLLM est ABANDONNÉ du modèle** — ni host, ni cible, **pas de citoyenneté vocab**. Le
  kit `iakaframe-anythingllm` existant devient **hors-scope** (à retirer un jour ? cf. § 10).

**Ce qui SURVIT de la v1** (acquis, à ne pas re-cadrer) : le socle `guard-core` runner-agnostique
(Lot 0, **livré en v0.10.0**) et l'adaptateur **Codex × identité** (ex-Lot 1, **livré**). On
**réutilise** ces briques ; on ne les refait pas.

---

## 1. Le modèle (schéma host vs persona — fait foi)

### 1.1 Deux plans orthogonaux

```
                ┌──────────────────────────────────────────────────────────┐
                │  PLAN HOST — point d'entrée (le décideur tape « odin »)   │
                │  {claude, codex, openwebui}                               │
                │  → L'ENFORCEMENT vit ICI (identité / périmètre / déléga-  │
                │    tion, via guard-core). Un host reçoit la demande,      │
                │    incarne la team, ENFORCE le rituel, et DISPATCHE       │
                │    chaque persona vers sa cible d'exécution.              │
                │  → Un host est AUSSI une CIBLE D'INSTALLATION : installer │
                │    la frame (bundle multi-host) déploie le kit de CHAQUE  │
                │    host présent dans le dir de config de ce host (§5bis). │
                └───────────────┬──────────────────────────────────────────┘
                                │ dispatch (par persona, selon le Binding)
                                ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  PLAN PERSONA — exécution (le triplet du Binding, PAR persona)            │
   │  assignments : personaId → { runner, model, tools[] }                    │
   │                                                                          │
   │   runner ∈ {claude, chatgpt, ollama-local, ollama-distant, litellm}      │
   │   model  = alias libre selon le runner (fable, haiku, qwen 3.6, gpt-*…)  │
   │   tools  = liste (ex. ["comfyui-local"]) — nouveau, optionnel            │
   └──────────────────────────────────────────────────────────────────────────┘
```

**Invariant du modèle** : un persona sur `ollama-distant` ou `chatgpt` n'a **pas besoin** que sa
cible sache enforcer — c'est le **host** qui a déjà enforcé avant/autour du dispatch. On ne
cherche donc **jamais** à « mettre un garde sur Ollama » : Ollama/ChatGPT n'ont pas à être gardés,
ils exécutent.

### 1.2 Le triplet du Binding (plan persona)

| Axe | Valeurs | Rôle | Aujourd'hui ? |
|---|---|---|---|
| `runner` | claude · chatgpt · ollama-local · ollama-distant · litellm | quel harnais exécute le persona | **partiel** (enum actuelle = `claude-code`/`ollama`/`litellm`/`codex`, à réconcilier — § 6) |
| `model` | alias libre selon le runner | quel modèle (fable, haiku, qwen 3.6, gpt-4o…) | **oui** (`PersonaBinding.model`) |
| `tools` | liste d'ids (ex. `comfyui-local`) | outils attachés à ce persona | **NON** (à ajouter) |

---

## 2. Ce qui existe (lecture réelle des deux dépôts)

### 2.1 Brique enforcement — `iakaframe`

- **`guard-core.mjs`** (socle runner-agnostique, **livré**) : trois verdicts **purs**, sans I/O,
  testés par fixtures, **dupliqués byte-identique** entre kits et verrouillés par un test de
  parité (`cli/test/guard-core-parity.test.js`). Réf. :
  `kits/iakaframe-claude/global/hooks/guard-core.mjs:1`.
  - `verdictIdentity(turn) → { skip | startOk, stopOk }` — badges ouverture/clôture ;
  - `verdictPerimeter(absPath, projectDir, opts) → ALLOW_PROJECT | ALLOW_PORTFOLIO | DENY_HARNESS | HORS` ;
  - `verdictDelegation(agent, opts) → { known, refused }` — roster iakaframe + builtins.
- **Host Claude** — **complet** : `identity-guard.mjs`, `perimeter-guard.mjs`,
  `delegation-guard.mjs` (+ `identity-remind.mjs`, `plan-courante.mjs`) sous
  `kits/iakaframe-claude/global/hooks/`.
- **Host Codex** — **identité seulement** : `kits/iakaframe-codex/global/hooks/` contient
  `codex-identity-guard.mjs` + `guard-core.mjs` + câblage (`config.hooks.example.toml:14`,
  `hooks.example.json`) + `README.md`. **Manquent** : adaptateurs **périmètre** et **délégation**.
- **Host OpenWebUI** — **inexistant** côté hooks : `kits/iakaframe-openwebui.md` est un kit
  **déclaratif** (system-prompts). Aucun middleware/Filter d'enforcement.
- **AnythingLLM** : `kits/iakaframe-anythingllm.md` existe encore — **hors modèle désormais**.

### 2.2 Brique binding/vocab — `iakaFrameGUI/packages/core`

- **`binding.ts`** (`src/binding.ts:26`) : `PersonaBinding = { personaId, runner, model }`. La clé
  `assignments` porte **runner + model** par persona. **Pas de `tools`.** Parseurs défensifs
  (record invalide ignoré, jamais d'exception) ; invariant « aucun credential dans un Binding ».
  Le Binding est **par (team, node)** — c'est ce `node` qui devient le **host** du nouveau modèle.
  (Branche `feat/align-binding-format-frame` déjà poussée : format aligné `bindings/<id>.md`.)
- **`vocab.json`** (source de vérité, `src/vocab.json:1`) :
  - `runnerKinds = [claude-code, ollama, litellm, codex]` ;
  - `nodeKinds = [claude, codex, ollama-localhost, ollama-lan, openwebui]` ;
  - `runner.ts` / `node.ts` en dérivent ; **anythingllm absent de toute enum** (déjà le cas).
- **Miroir CLI** `iakaframe/cli/src/lib/vocab.js` — **doit rester byte-aligné** au core, verrouillé
  par `cli/test/vocab-parity.test.js`. Toute évolution vocab **touche les deux fichiers ensemble**.
- **Connecteurs MCP existants** : `Team.connectors: string[]` (ids de serveurs MCP, niveau
  **team**) — voir `src/connector.ts:4`. ⚠️ À **ne pas confondre** avec les `tools` **par persona**
  du Binding : ce sont deux axes distincts (cf. § 6.3 pour l'arbitrage de réconciliation).

---

## 3. Faits vérifiés sur le web (2026-07) — capacités réelles des hosts

### 3.1 Host **Codex** — vrais hooks, périmètre + délégation faisables
- Événements **turn-scope** : `PreToolUse`, `PermissionRequest`, `PostToolUse`, `UserPromptSubmit`,
  `SubagentStop`, `Stop` ; **`SessionStart`/`SubagentStart`** au démarrage. Vocabulaire quasi
  identique à Claude.
- **`PreToolUse` peut BLOQUER** un appel d'outil (commande, écriture fichier, appel MCP) → support
  direct du **garde de périmètre** (refus d'écriture hors projet), sémantique équivalente à
  `exit 2` Claude.
- **`PostToolUse`** (revue de sortie/fichiers) → support de l'**audit de délégation**.
- Câblage : `hooks.json` **ou** tables `[hooks]` inline dans `config.toml` (fusion + warning si les
  deux) ; hook = **command** reçoit le contexte JSON. Handlers `prompt`/`agent` parsés mais
  **ignorés** → n'utiliser que le type **command**.
- **Conséquence** : **compléter Codex** (périmètre + délégation) est faisable via `PreToolUse`
  (bloquant) + `PostToolUse` (audit), en réutilisant `guard-core` — comme l'identité l'a fait.

### 3.2 Host **OpenWebUI** — Filter Functions (middleware Python), parité honnête à borner
- Une **Filter Function** (classe Python) expose **`inlet()`** (avant modèle : injecter/assainir
  l'entrée), **`stream()`** (chunks temps réel, depuis OWUI **0.5.17**), **`outlet()`** (après
  réponse complète : inspecter/annoter/logguer).
- **Enforcement d'identité faisable** : `outlet()` vérifie la présence des badges dans la réponse
  et **annote/répare** ; `inlet()` **ré-injecte le rappel** (équivalent `identity-remind`). Les
  Filters servent déjà à la **modération de contenu / détection d'injection** → ils peuvent **lever
  une exception** pour refuser une réponse (sémantique de blocage réelle, différente d'`exit 2`
  mais effective).
- **Limites à assumer honnêtement** :
  - **Maille = une réponse** (pas de tour multi-message, pas de sous-agent natif) ;
  - **périmètre & délégation = HORS-SUJET** sur OpenWebUI (pas d'écriture repo, pas de dispatch
    multi-agents natif) → **identité seulement** ;
  - installation **admin-only** ; un Filter s'applique **global ou par Model**, priorité ordonnable ;
  - ⚠️ **piège connu** : les Filters ne s'appliquent **pas** systématiquement sur l'endpoint
    OpenAI-compatible `/api/chat/completions` (rapports upstream) → **valider** que l'enforcement
    couvre bien le **chemin d'usage réel** du décideur avant de le déclarer « fort ».

**Parité atteignable par host (synthèse honnête)** :

| Host | Identité | Périmètre | Délégation |
|---|---|---|---|
| **claude** | FORT *(livré)* | FORT *(livré)* | FORT/audit *(livré)* |
| **codex** | FORT *(livré)* | **FORT** *(à faire, `PreToolUse` bloquant)* | **FORT/audit** *(à faire, `PostToolUse`)* |
| **openwebui** | **PARTIEL→FORT** *(Filter `outlet`/`inlet`, maille réponse)* | **N/A** *(pas de repo)* | **N/A** *(pas de multi-agent natif)* |

---

## 4. Brique A — ENFORCEMENT AU HOST (dépôt `iakaframe`)

Réutilise `guard-core` (livré). Chaque host = un **adaptateur mince** : parse SON payload →
reconstruit l'entrée canonique → appelle un verdict `guard-core` → traduit dans SA sémantique
(exit code / exception Filter / annotation). **Aucune re-implémentation de la règle** ; la parité
byte-identique de `guard-core` reste verrouillée par le test de parité.

- **Claude** : fait. Ne pas retoucher.
- **Codex** : identité faite ; **compléter périmètre + délégation** (Lot A1).
- **OpenWebUI** : nouveau **Filter** d'identité (Lot A2).

---

## 5. Brique B — EXÉCUTION PAR PERSONA (dépôt `iakaFrameGUI/packages/core`)

### 5.1 Étendre `PersonaBinding` avec `tools`
- `PersonaBinding = { personaId, runner, model, tools: string[] }` (`tools` optionnel, défaut `[]`).
- `parsePersonaBinding` : `tools` **défensif** — non-tableau → `[]` ; items non-string filtrés ;
  trim ; jamais d'exception (même contrat que `runner`/`model`). Invariant credential **inchangé**
  (un id de tool n'est pas un secret).
- `serializeBinding` / `parseBindingMd` : porter `tools` sans casser la rétro-compat (binding sans
  `tools` ≡ `tools: []` ≡ kit pur — **byte-identique** à l'existant si vide, non-régression P3).

### 5.2 Réconcilier le vocab : host ↔ runner ↔ tools
Distinguer explicitement dans `vocab.json` (+ miroir `vocab.js`) :
- **hosts / points d'entrée** = `{claude, codex, openwebui}` (là où l'enforcement vit) ;
- **runners d'exécution de persona** = `{claude, chatgpt, ollama-local, ollama-distant, litellm}`
  (litellm = gateway OpenAI-compatible routant vers n'importe quel backend → cible légitime) ;
- **notion de tools** (au moins un registre/validation d'ids ; ampleur à arbitrer, § 6.3) ;
- **retirer anythingllm** du raisonnement (déjà absent des enums — acter le statut).

⚠️ **Parité mirror obligatoire** : toute valeur touchée dans `vocab.json` l'est **aussi** dans
`cli/src/lib/vocab.js`, sinon `vocab-parity.test.js` casse (garde-fou anti-divergence).

---

## 5bis. Brique C — INSTALLATION MULTI-HOST (fan-out) — dépôt `iakaframe`

### 5bis.1 Principe (décision décideur)
La frame est un **bundle multi-host**. **Installer la frame doit se déployer sur TOUS les
runners-hosts présents** sur la machine — pas seulement Claude. Le host n'est donc pas seulement le
lieu de l'enforcement (Brique A) : c'est aussi une **cible d'installation**.

### 5bis.2 Ce qui existe (lecture réelle)
`frames/releases/StefFrame2/install.mjs` est un installeur **collision-aware** **claude-only**
(Node pur, zéro dépendance, `install.mjs:19` `KIT = kits/iakaframe-claude`, `install.mjs:221`
`target = ~/.claude`). Il sait déjà : **planners par catégorie** (`CLAUDE.md`, `settings.json`,
`hooks/`, `skills/`, `agents/`), **merge/keep/overwrite**, **backup lazy** (`install.mjs:98`),
**dry-run** (`install.mjs:264`), **idempotence** (noop si déjà à jour). ⇒ **On ÉTEND cet
installeur, on n'en crée pas un nouveau.**

### 5bis.3 Ce que le lot ajoute
- **Détection des hosts présents** parmi `{claude, codex, openwebui}** : binaire/CLI présent OU
  dossier de config existant (ex. `~/.claude` ; dir de config Codex — typiquement `~/.codex` ; dir
  de config OpenWebUI — à confirmer, souvent conteneurisé → **fournir un `--target-<host>`
  explicite** en repli).
- **Mapping `host → kit → dir-de-config`** :
  `claude → kit-claude → ~/.claude` ; `codex → kit-codex → <dir Codex>` ;
  `openwebui → kit-openwebui → <dir OpenWebUI>`. Réutilise `kitNameForNode`/vocab côté source.
- **Fan-out** : pour **chaque host présent**, dérouler les planners collision-aware **dans le dir de
  ce host** (les planners deviennent paramétrés par `{kitDir, targetDir, catégories}` — les
  catégories diffèrent par host : Claude = `CLAUDE.md`+`settings.json`+`hooks`+`skills`+`agents` ;
  Codex = `AGENTS.md`+`config.toml`/`hooks.json`+`hooks/*.mjs` ; OpenWebUI = Filter Function +
  Models).
- **Backup par host**, **dry-run par host**, **idempotence par host** (chaque host a sa propre
  racine de backup + son propre plan affiché).
- **`ollama`/`anythingllm` ne sont JAMAIS des cibles d'installation** : `ollama` = cible
  d'exécution de persona (dispatché, pas installé) ; `anythingllm` = **abandonné**. L'installeur ne
  possède **aucun mapping** vers eux et ne les pose jamais comme hosts.

### 5bis.4 Fork de conception — COPIE fan-out vs CANONIQUE+liens (évalué + tranché)

Le décideur propose une alternative à la copie : installer la frame **une seule fois** dans une zone
canonique (`~/.iakaframe/current/`) puis **lier** chaque host vers elle (source de vérité unique,
update-once, upgrade-friendly). On l'évalue **factuellement** (le suivi des liens dépend de chaque
host — vérifié sur le web, 2026-07, sources § 12).

**Faisabilité réelle du suivi de liens, par host :**

| Host | Suivi des liens | Verdict factuel |
|---|---|---|
| **Claude** | symlink **par skill** : la cible est **chargée et utilisable**, MAIS `/skills` **ne découvre pas** un dir de skill symlinké (« No skills found ») ; symlink du **dossier `.claude` entier** casse l'autocomplete | **PARTIEL** — le lien par élément *fonctionne pour l'exécution* mais la **découverte/UX est buggée** en amont |
| **Codex** | Codex **ne suit PAS** les symlinks : prompts symlinkés **ignorés**, dirs de skills symlinkés **non parcourus**, agents TOML symlinkés non reconnus ; pire, **`config.toml` symlinké est réécrit en fichier réel au démarrage** (≥ v0.58.0) ; symlinks/junctions **KO sur Windows** | **CASSÉ** — le lien n'est pas une option fiable aujourd'hui |
| **OpenWebUI** | les **Functions/Filters vivent dans la base `webui.db`** (`/app/backend/data`), **pas** dans des fichiers liables ; conteneurisé → un symlink hôte **ne traverse pas** le conteneur ; monter un fichier en read-only casse (OWUI **renomme** au démarrage) | **INADAPTÉ au lien** — installation par **admin/API** (import de Function), pas par lien ni mount de script |
| **Windows** | privilège symlink requis (dev-mode/admin) ; junctions ; **Codex Windows KO** | **repli COPIE obligatoire** |

**Conclusion factuelle** : la stratégie **(2) canonique+liens n'est PAS fiable aujourd'hui** —
Claude est partiel (découverte buggée), **Codex la casse** (non-suivi + réécriture de config),
**OWUI ne se lie pas** (Functions en base, conteneur). Le lien introduirait de la fragilité là où la
**copie est déterministe et déjà maîtrisée** (installeur collision-aware existant).

**Contraintes de conception (validées + complétées)** — à respecter *quelle que soit* la stratégie :
- **Liens (le jour où) uniquement PAR ÉLÉMENT** (un lien par skill/agent/hook), **jamais** par
  dossier entier — sinon on masque/écrase le contenu perso de l'utilisateur et on **casse le merge
  collision-aware**. (Confirmé côté Claude : lier `.claude` entier casse l'autocomplete.)
- **`CLAUDE.md`/`AGENTS.md` et `settings.json`/`config.toml` = cibles de MERGE** (bloc
  `iakaframe:start/end`, deepMerge des hooks) → **restent en COPIE/merge, JAMAIS liés**. (Confirmé
  côté Codex : `config.toml` symlinké est réécrit → lien inutile et trompeur.)
- **OWUI** : **jamais de lien ni de mount de script** ; la Function s'installe par **import
  admin/API** dans `webui.db` (cf. Lot A2). L'« install multi-host » d'OWUI = **pousser/importer**
  la Function, pas poser un fichier.
- **Repli COPIE** systématique là où le lien n'est pas suivi/permis (Windows, Codex, host ne
  résolvant pas les symlinks) — la copie est le **comportement par défaut**, le lien une **option**.

**Recommandation Gandalf (tranchée)** : **stratégie (1) COPIE fan-out en MVP.** Elle est
déterministe, cross-OS, réutilise l'installeur collision-aware livré, et **fonctionne sur les trois
hosts** tels qu'ils se comportent réellement en 2026-07. La stratégie **(2) canonique+liens est
reléguée en ÉVOLUTION**, **conditionnée** à : (a) correctif Claude de la découverte `/skills` sur
dirs symlinkés ; (b) suivi fiable des symlinks côté Codex (aujourd'hui absent) ; (c) elle ne
concernera **jamais** OWUI (Functions en base) ni les **fichiers-merge** (toujours copie). Prévoir
dès le MVP un **flag `--link` opt-in expérimental** (par élément, avec repli copie) pour préparer le
terrain sans en dépendre.

### 5bis.5 Critères d'acceptation (Lot C1)
- [ ] Sur une machine avec **2 hosts présents + 1 absent** (fixture : 2 dirs de config factices
      existants, 1 manquant), l'installeur **pose 2 kits** (un par host présent) et **ignore
      l'absent** (aucune écriture pour lui).
- [ ] **Stratégie par défaut = COPIE** : un skill/hook copié dans le dir d'un host est **découvert
      et utilisable** par ce host (test de bout en bout au gate).
- [ ] **Fichiers-merge en copie/merge** : `CLAUDE.md`/`AGENTS.md` (bloc `iakaframe:start/end`) et
      `settings.json`/`config.toml` sont **mergés, jamais liés** (vérifié même si `--link` actif).
- [ ] **OWUI** : la Function d'identité est **importée** (admin/API) et active — **aucun** lien ni
      mount de fichier (cf. Lot A2).
- [ ] **`--link` (opt-in)** : lie **par élément** (jamais un dossier entier) ; sur host/OS ne
      suivant pas les liens (Codex, Windows) → **repli COPIE automatique** prouvé par test ; un
      élément lié est **découvert** par le host (ou, si découverte buggée en amont p. ex. Claude
      `/skills`, la limite est **documentée** et le repli copie proposé).
- [ ] **Backup par host** : chaque host modifié a **sa propre** racine de backup avant écriture.
- [ ] **`--dry-run` n'écrit RIEN** (ni copie ni lien) et n'ouvre **aucun** backup, tout en affichant
      le **plan par host** (copie/lien/merge annoncé par élément).
- [ ] **Idempotence** : deuxième passe sans changement = **noop** par host (aucun backup, aucune
      écriture, aucun relien).
- [ ] Aucun mapping `ollama`/`anythingllm` : demander à les installer comme host = **refus/skip
      documenté** (ce ne sont pas des hosts).
- [ ] **Collision** dans un dir de host (fichier existant) : comportement `merge`/`keep`/`overwrite`
      identique à l'installeur claude actuel (non-régression du comportement collision-aware).
- [ ] Le mode **claude-only historique** reste disponible (`--target` explicite) — non-régression.

### 5bis.6 Point ouvert (à confirmer avant implémentation)
Les **dirs de config réels** de Codex et OpenWebUI (et leur détectabilité : OpenWebUI est souvent
en conteneur → **pas de dir local** ; l'install passe par l'**API/admin**, pas le FS hôte). À
**capturer sur les installations réelles** du décideur avant de figer la table de détection ;
prévoir un **override explicite par host** (`--target-codex`, `--target-openwebui`) en repli, comme
`--target` existe déjà. **Réévaluer la stratégie (2)** si/quand Claude corrige la découverte
`/skills` symlinkée et Codex se met à suivre les symlinks (suivre les issues upstream — § 12).

---

## 6. Décisions de mapping (TRANCHÉES par le portefeuille — DÉCIDÉ)

Le **modèle** est acté ; les trois choix de mapping ci-dessous ont été **tranchés par le
portefeuille** (défauts recommandés retenus). Ils sont **DÉCIDÉS**, plus en arbitrage.

### 6.1 Renommage runner + alias legacy — **DÉCIDÉ**
**Renommer** les runners vers le modèle persona, **avec table d'alias legacy** (rétro-compat,
parité mirror maintenue) :
- `claude-code` → **`claude`** ; `ollama-localhost` → **`ollama-local`** ;
  `ollama-lan` → **`ollama-distant`** ; **ajouts de `chatgpt`** (runner ChatGPT) **et `litellm`**
  (gateway, promu runner de plein droit — cf. dernier point).
- Enum runner cible = **`{claude, chatgpt, ollama-local, ollama-distant, litellm}`**.
- ⚠️ **Le runner s'appelle `chatgpt`, PAS `openai`** : « openai » désigne la **norme API
  OpenAI-compatible** (qu'implémentent Ollama, OpenWebUI, LiteLLM, vLLM…) ; on ne nomme pas un
  runner du même mot que le standard d'API. Le **host `codex`** (point d'entrée CLI côté OpenAI)
  reste **distinct** du **runner `chatgpt`** (cible d'exécution) — deux plans séparés.
- **Alias legacy** conservés (`claude-code`, `ollama-localhost`, `ollama-lan`, + `ps`/`iakaide`
  déjà présents) → résolus vers la valeur canonique ; **aucun binding existant ne casse**.
- `litellm` : **runner d'exécution de PLEIN DROIT** (décision décideur) — c'est une **gateway
  OpenAI-compatible** qui route vers n'importe quel backend, donc une **cible d'exécution
  légitime** pour un persona. Il entre dans l'enum runner (5e valeur). ⚠️ `litellm` **n'est PAS un
  host** (pas de point d'entrée, pas d'enforcement, pas d'install multi-host) — les hosts restent
  `{claude, codex, openwebui}`. Alias legacy conservés (si `litellm` était déjà une valeur, aucune
  casse).

### 6.2 Concept `host` de 1er ordre — **DÉCIDÉ**
**Introduire un concept `host`** de 1er ordre = **point d'entrée** `{claude, codex, openwebui}` (là
où le décideur tape `odin`, **où vit l'enforcement**, **où pointe le Binding**, ET **cible
d'installation** — cf. § 5bis). Il est **distinct** du `node`/runner d'exécution de persona.
`ollama-*` et `chatgpt` **sortent** du plan host (ce ne sont que des **runners**). `NodeKind` peut
rester en **alias transitoire** le temps de la migration.

### 6.3 `tools` (persona) vs `connectors` (team) — **DÉCIDÉ : deux axes distincts**
**`tools` (par persona, Binding) et `connectors` (par team, MCP) restent deux axes distincts au
MVP, sans couplage.** `tools` = **liste d'ids libres** (comme `connectors`), **sans** génération
`.mcp.json` par persona (différé). La question « fusionner tools/connectors un jour ? » est
**signalée, non traitée** ici (MVP d'abord).

---

## 7. Découpage en lots ré-implémentables

> **Marquage** : ✅ livré · ▶ à faire. **Ordre suggéré** : A1 → A2 → (B2+B1). Les lots A et B sont
> **indépendants entre briques** (dépôts différents) ; à l'intérieur de B, **B2 (vocab) précède
> B1 (runner du binding)** car `PersonaBinding.runner` référence l'enum — l'axe `tools`, lui, est
> indépendant du vocab et peut avancer en parallèle.

| Lot | Brique | Dépôt | Contenu | Statut |
|---|---|---|---|---|
| **Lot 0 — Socle** | A | `iakaframe` | `guard-core` (3 verdicts purs) + fixtures + parité byte-identique | ✅ **livré** (v0.10.0) |
| **Lot A0 — Codex identité** | A | `iakaframe` | adaptateur `codex-identity-guard.mjs` + câblage + doc | ✅ **livré** |
| **Lot A1 — Codex complet** | A | `iakaframe` | adaptateurs **périmètre** (`PreToolUse`, bloquant) + **délégation** (`PostToolUse`, audit) → `guard-core` ; câblage `config.toml`/`hooks.json` ; doc kit-codex | ▶ à faire |
| **Lot A2 — OpenWebUI Filter** | A | `iakaframe` | **Filter Function** Python (`inlet` rappel + `outlet` vérif badges → exception si absent) réimplémentant `verdictIdentity` ; kit `iakaframe-openwebui` (install admin, portée global/par-Model) ; doc parité **honnête** (identité seule, maille réponse, piège `/api/chat/completions`) | ▶ à faire |
| **Lot B1 — Binding runner/model/tools** | B | `iakaFrameGUI` | `PersonaBinding.tools: string[]` (parse défensif) ; runner aligné sur `{claude, chatgpt, ollama-local, ollama-distant, litellm}` ; sérialisation + non-régression (binding vide ≡ kit pur) | ▶ à faire |
| **Lot B2 — Vocab host↔runner + tools** | B | `iakaFrameGUI` (+ miroir `iakaframe/cli`) | split **host** `{claude,codex,openwebui}` vs **runner** `{claude,chatgpt,ollama-local,ollama-distant,litellm}` + notion tools + retrait anythingllm ; **parité mirror** CLI↔core | ▶ à faire |
| **Lot C1 — Installeur multi-host (COPIE fan-out)** | C | `iakaframe` | étendre `install.mjs` (claude-only → multi-host) : détection hosts présents `{claude,codex,openwebui}`, mapping host→kit→dir-config, planners paramétrés, backup/dry-run/idempotence **par host** ; **stratégie COPIE** (liens = évolution opt-in `--link` + repli copie, § 5bis.4) ; OWUI par import admin/API ; jamais `ollama`/`anythingllm` | ▶ à faire |

**Ordre imposé** : `guard-core` étant livré, A1 et A2 peuvent démarrer immédiatement. B2 avant B1
(dépendance d'enum). **C1 dépend des kits par host** : idéalement après A1 (kit-codex complet) et
A2 (kit-openwebui) — sinon il fan-out des kits partiels. Aucune dépendance A↔B.

---

## 8. Critères d'acceptation (vérifiables) par lot

### Lot A1 — Codex complet
- [ ] Écriture Codex **hors** projet (via `PreToolUse`) → **refus** (exit 2 + message stderr nommant le chemin), verdict identique à `verdictPerimeter`.
- [ ] Écriture Codex **dans** le projet → **allow** (exit 0).
- [ ] Fichier de config du harnais Codex (réservé humain) → **DENY_HARNESS**.
- [ ] Délégation Codex vers un agent **hors roster** → journalisée + **refusée** ; agent du roster → allow (parité `verdictDelegation`).
- [ ] Payload malformé / illisible → **exit 0** (fail-open prouvé).
- [ ] `guard-core.mjs` du kit-codex **byte-identique** au kit-claude (`guard-core-parity.test.js` vert).
- [ ] Câblage (`config.toml`/`hooks.json`) + doc kit-codex mis à jour (limites : expérimental, non-Windows).

### Lot A2 — OpenWebUI Filter
- [ ] Réponse OWUI **sans badge d'ouverture ou de clôture** → le Filter **annote/refuse** (exception) et le signale.
- [ ] Réponse **conforme** (ouverture + clôture) → passe sans altération.
- [ ] Le verdict d'identité du Filter **coïncide** avec `verdictIdentity` sur un jeu de fixtures partagé (parité de règle, même si réimplémentée en Python).
- [ ] Doc kit-openwebui **honnête** : identité seule ; périmètre/délégation **N/A** ; maille réponse ; **avertissement** sur `/api/chat/completions`.
- [ ] Installation documentée (admin, portée global/par-Model, priorité).

### Lot B1 — Binding tools
- [ ] `PersonaBinding` accepte `tools: string[]` ; `parsePersonaBinding` **défensif** (non-tableau→`[]`, items non-string filtrés, jamais d'exception).
- [ ] Binding **sans** `tools` → sortie **byte-identique** à l'existant (non-régression).
- [ ] `serializeBinding` **n'émet aucun credential** (invariant préservé) et round-trip `parse∘serialize` stable avec `tools`.
- [ ] `runner` accepte les 5 valeurs du modèle (`claude`/`chatgpt`/`ollama-local`/`ollama-distant`/`litellm`) + alias legacy (§ 6.1) ; valeur inconnue → liaison **jetée** (contrat actuel).
- [ ] Un persona assigné à `litellm` + un `model` produit un binding valide (litellm = runner, pas host).

### Lot B2 — Vocab host↔runner + tools
- [ ] `vocab.json` distingue **hosts** `{claude,codex,openwebui}` et **runners** `{claude,chatgpt,ollama-local,ollama-distant,litellm}` (litellm dans l'enum **runner**, **jamais** dans hosts/node) ; + table d'alias legacy (§ 6.1).
- [ ] `anythingllm` **absent** de toute enum (statut « hors modèle » acté en commentaire).
- [ ] Notion de `tools` présente (registre/validation d'ids, ampleur MVP).
- [ ] `cli/src/lib/vocab.js` **aligné** ; `vocab-parity.test.js` **vert**.
- [ ] Renommage `claude-code→claude` / `ollama-localhost→ollama-local` / `ollama-lan→ollama-distant` + `chatgpt` ; anciennes valeurs conservées en **alias legacy** (aucun binding cassé).

### Lot C1 — Installeur multi-host
→ Critères détaillés en **§ 5bis.5** (fan-out 2 hosts présents + 1 absent, backup/dry-run/idempotence
par host, jamais `ollama`/`anythingllm`, non-régression du mode claude-only).

---

## 9. Illustration d'acceptation — la team iakaframe

Le modèle doit exprimer, **sur le host `claude`**, un Binding `iakaframe@claude` où :

```jsonc
{
  "id": "iakaframe@claude", "teamId": "iakaframe", "node": "claude", // node = HOST
  "assignments": [
    { "personaId": "odin",    "runner": "claude",         "model": "fable",    "tools": [] },
    { "personaId": "legolas", "runner": "claude",         "model": "haiku",    "tools": [] },
    { "personaId": "gimli",   "runner": "ollama-distant", "model": "qwen 3.6", "tools": [] },
    { "personaId": "loki",    "runner": "chatgpt",        "model": "gpt-*",    "tools": ["comfyui-local"] }
  ]
}
```

**Ce que l'acceptation prouve** :
1. le Binding **exprime** runner + model + tools **par persona** (gimli sur Ollama distant, loki sur
   ChatGPT avec ComfyUI local) — **Lot B1/B2** ;
2. l'**enforcement reste au host `claude`** : identité/périmètre/délégation s'appliquent au tour du
   décideur, **quel que soit** le runner de chaque persona — **Brique A, déjà livrée pour claude** ;
3. **aucun garde n'est requis** sur `ollama-distant` ni `chatgpt` (ce sont des cibles, pas des hosts).

Un persona pourrait tout aussi bien être assigné à **`litellm`** (ex. `{ "runner": "litellm",
"model": "…" }`) — 5e runner de plein droit, cible d'exécution comme les autres, **jamais un host**.

Le même Binding, pointé sur `node: "codex"` ou `node: "openwebui"`, doit rester valide — l'host
change, le plan persona non.

---

## 10. Périmètre

### DANS
- **Brique A — enforcement au host** (`iakaframe`) : compléter **Codex** (périmètre + délégation) ;
  créer le **Filter OpenWebUI** (identité). Réutilisation de `guard-core` (livré).
- **Brique B — exécution par persona** (`iakaFrameGUI/packages/core` + miroir CLI) : `tools` par
  persona dans le Binding ; split vocab **host ↔ runner** + notion tools ; renommage runner +
  alias ; retrait d'anythingllm du raisonnement.
- **Brique C — installation multi-host** (`iakaframe`) : étendre `install.mjs` en **fan-out** sur
  tous les hosts présents ; jamais `ollama`/`anythingllm`.
- L'**illustration d'acceptation** (team iakaframe) comme test de bout en bout du modèle.

### HORS (explicitement abandonné ou différé)
- **ABANDONNÉ** : **proxy Docker Ollama** (ex-Lot 4 v1) — Ollama est une cible, pas un host.
- **ABANDONNÉ** : **AnythingLLM** dans le modèle (ni host, ni runner, ni vocab). Le kit
  `iakaframe-anythingllm.md` reste sur disque **hors-scope** → **question ouverte** : le retirer un
  jour ? (à trancher hors de cette instruction).
- **DIFFÉRÉ** : génération `.mcp.json` **par persona** à partir des `tools` (comme les connecteurs
  au niveau team, différés) ; fusion `tools`/`connectors` ; override cockpit du Binding.
- **HORS-SUJET par nature** : périmètre & délégation sur OpenWebUI (pas de repo, pas de dispatch
  natif) ; support **Windows** des hooks Codex (limite upstream) ; policing sémantique des rôles.

### Répartition par dépôt
- `iakaframe` : Lots A1, A2 (kits + hooks + fixtures + doc + parité `guard-core`) ; **Lot C1**
  (installeur multi-host `install.mjs`) ; miroir CLI vocab (`cli/src/lib/vocab.js`).
- `iakaFrameGUI` : Lots B1, B2 (`packages/core` : `binding.ts`, `vocab.json`, `runner.ts`/`node.ts`).

---

## 11. Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Payload Codex `PreToolUse`/`PostToolUse` ≠ supposé | adaptateur périmètre/délégation faux | **capturer un payload réel** (session Codex hooks activés) avant de figer, comme pour l'identité |
| Filters OWUI inactifs sur `/api/chat/completions` | enforcement contourné selon le chemin d'usage | **valider le chemin réel** du décideur ; documenter la limite ; ne pas sur-vendre « fort » |
| Réimpl. Python de `verdictIdentity` diverge du core | parité illusoire OWUI | **fixtures partagées** + test comparant Python ↔ `guard-core` sur les mêmes cas |
| Renommage runner casse des bindings existants | régression déploiement | table d'**alias legacy** + parse défensif (liaison inconnue jetée, jamais d'exception) |
| Divergence `vocab.json` ↔ `vocab.js` | vocab incohérent CLI/Cockpit | **parité mirror** verrouillée par `vocab-parity.test.js` (toute édition sur les deux) |
| Confusion `tools` (persona) vs `connectors` (team) | modèle ambigu | garder **deux axes distincts** au MVP ; ne pas coupler (§ 6.3) |
| Runner `openai` confondu avec la norme API OpenAI-compatible | vocab ambigu | runner **nommé `chatgpt`** (jamais `openai`) ; host `codex` ≠ runner `chatgpt` (§ 6.1) |
| Dir de config Codex/OpenWebUI non détectable (OWUI conteneurisé) | fan-out rate un host présent | **capturer les dirs réels** ; override explicite `--target-<host>` en repli (§ 5bis.6) |
| Fan-out pose un kit host **partiel** (avant A1/A2) | enforcement incomplet installé | ordonner **C1 après A1/A2** ; sinon documenter le niveau posé |
| Stratégie liens (canonique+symlink) fragile : Codex ne suit pas, Claude `/skills` buggé, OWUI en base | install cassée/non découverte | **COPIE fan-out en MVP** (déterministe) ; liens en **évolution opt-in** `--link` par élément + **repli copie** (§ 5bis.4) |
| Sur-ingénierie (garder anythingllm / proxy Ollama) | effort gaspillé | **abandons actés** en § 0/§ 10 |

---

## 12. Faits vérifiés — sources

- **Codex CLI — hooks** (événements turn-scope `PreToolUse`/`PostToolUse`/`Stop`/`SubagentStop`,
  `PreToolUse` bloque tool/écriture/MCP, `config.toml`/`hooks.json`, handlers `command` seuls
  actifs) :
  - https://developers.openai.com/codex/hooks
  - https://developers.openai.com/codex/config-reference
  - https://deepwiki.com/openai/codex/3.11-hooks-system
- **Open WebUI — Filter Functions** (`inlet`/`stream` (0.5.17)/`outlet`, modération/injection →
  blocage possible, global/par-Model, admin) :
  - https://docs.openwebui.com/features/extensibility/plugin/functions/filter/
  - https://docs.openwebui.com/features/extensibility/plugin/functions/
  - https://github.com/open-webui/open-webui/discussions/8722 (piège : Filters vs `/api/chat/completions`)
- **Suivi des symlinks par host** (fork install § 5bis.4) :
  - Claude — skill symlinké chargé mais `/skills` ne le découvre pas ; `.claude` entier symlinké casse l'autocomplete :
    - https://github.com/anthropics/claude-code/issues/14836
    - https://github.com/anthropics/claude-code/issues/36659
  - Codex — ne suit pas les symlinks (prompts/skills/agents ignorés) ; `config.toml` symlinké réécrit ; Windows KO :
    - https://github.com/openai/codex/issues/4383
    - https://github.com/openai/codex/issues/8943
    - https://github.com/openai/codex/issues/6646
    - https://github.com/openai/codex/issues/8400
  - OpenWebUI — Functions/Filters en base `webui.db` sous `/app/backend/data` (Docker volume), pas de fichier liable ; renommage au démarrage casse les mounts read-only :
    - https://docs.openwebui.com/tutorials/maintenance/backups/
    - https://docs.openwebui.com/reference/env-configuration/

---

## 13. Statut final

**Modèle fermé, TROIS briques cadrées, cinq lots ré-implémentables** (dont deux **déjà livrés** :
`guard-core` + Codex identité). Cette instruction ferme :
1. le **modèle persona** (host = point d'entrée **ET** cible d'installation ; vs runner d'exécution ;
   triplet runner/model/tools) ;
2. la **répartition** : enforcement AU host + **installation multi-host** (`iakaframe`) vs exécution
   PAR persona (`iakaFrameGUI`) ;
3. le **découpage en lots** (A1, A2, **C1**, B1, B2) avec périmètre, dépôt et critères vérifiables ;
4. l'**illustration d'acceptation** (team iakaframe : odin/fable, legolas/haiku, gimli/qwen-distant,
   loki/chatgpt+comfyui) ;
5. les **abandons explicites** (proxy Ollama, AnythingLLM) ;
6. le **fork d'installation TRANCHÉ** (§ 5bis.4) : **COPIE fan-out en MVP** (déterministe,
   cross-OS), canonique+liens **relégué en évolution opt-in `--link`** (par élément + repli copie),
   sur faits vérifiés (Codex ne suit pas les symlinks, Claude `/skills` buggé, OWUI Functions en
   base) ; fichiers-merge **toujours en copie**, OWUI **toujours par import admin/API**.

**Décisions de mapping TRANCHÉES** (§ 6, plus en arbitrage) : (#1) renommage runner
`{claude, chatgpt, ollama-local, ollama-distant, litellm}` + alias legacy — le runner ChatGPT
s'appelle **`chatgpt`, pas `openai`**, et **`litellm` est un runner de plein droit** (gateway
OpenAI-compatible), **jamais un host** ; (#2) concept **`host`** `{claude, codex, openwebui}` de
1er ordre distinct du runner ; (#3) **`tools` (persona) ≠ `connectors` (team)**, deux axes sans
couplage.

**Points ouverts non bloquants** : dirs de config réels Codex/OpenWebUI pour le fan-out (§ 5bis.6),
la **réévaluation de la stratégie liens** si Claude/Codex corrigent le suivi des symlinks (§ 5bis.4),
et le sort à terme du kit **anythingllm** hors-scope (le retirer un jour ?).
