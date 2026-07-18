# Instruction — Parité d'enforcement de la méthode hors Claude (4 runners cibles)

> **Auteur** : Gandalf (P1 — Cadrage). **Statut** : socle validé à cadrer + lots à arbitrer.
> **Cible** : `frames/releases/StefFrame2/kits/iakaframe-{codex,ollama,openwebui,anythingllm}/`
> **Référentiel de parité** : `frames/releases/StefFrame2/kits/iakaframe-claude/global/hooks/*.mjs`
> **Nature** : chantier exploratoire — cette instruction ferme la **stratégie** et un **pilote**,
> pas la totalité de l'implémentation (les lots 2→4 seront ré-arbitrés après le pilote).

---

## 1. Contexte (décision décideur + audit B5)

L'enforcement de la méthode iakaframe est aujourd'hui **CLAUDE-ONLY**. Chez Claude Code, trois
gardes **mécaniques** (hooks `.mjs`, câblés dans `settings.example.json`) forcent la règle :

- **garde d'identité** (badges d'ouverture/clôture) — `identity-guard.mjs` sur `Stop`/`SubagentStop` ;
- **garde de périmètre** (chemins hors projet) — `perimeter-guard.mjs` sur `PreToolUse` (Edit/Write/Bash/NotebookEdit) ;
- **garde de délégation** (roster + audit verbatim) — `delegation-guard.mjs` sur `PreToolUse`/`PostToolUse` (Task) ;
- + un rappel doux `identity-remind.mjs` (`UserPromptSubmit`) et `plan-courante.mjs` (`PostToolUse`).

Les **4 autres kits** sont purement **DÉCLARATIFS** : un contrat (`AGENTS.md`, system-prompt de
Model/workspace) décrit le rituel, mais **aucun mécanisme ne le force**. Les READMEs l'assument
explicitement (« Pas de hook garde d'identité : le rituel est **comportemental** »).

Le décideur veut viser une **vraie parité d'enforcement** hors Claude — sans faux-semblant :
dire honnêtement, runner par runner, ce qui est **réellement forçable** vs ce qui reste
**déclaratif** faute de mécanisme.

---

## 2. Ce qui existe (lecture réelle)

### 2.1 Le référentiel Claude — ce que chaque garde enforce et COMMENT

| Garde | Événement(s) | Canal observé | Verdict | Mode |
|---|---|---|---|---|
| `identity-guard.mjs` | `Stop`, `SubagentStop` | transcript (blocs `type:"text"` du tour) | badge ouverture + clôture présents ? sinon **exit 2** | bloquant, fail-open, anti-course (3× relecture) |
| `perimeter-guard.mjs` | `PreToolUse` (Edit\|Write\|Bash\|NotebookEdit) | `tool_input.file_path` / cmd shell | chemin sous `$CLAUDE_PROJECT_DIR` ? sinon **exit 2** (deny) ou warn | panachage deny/warn par outil, journal |
| `delegation-guard.mjs` | `PreToolUse`+`PostToolUse` (Task) | `tool_input.subagent_type`, `tool_response` | agent ∈ roster ? sinon **exit 2** ; journalise ALLER/RETOUR verbatim | audit + refus hors-roster |

**Invariants d'architecture communs aux 3 gardes** (à préserver dans tout portage) :
- lisent un **payload JSON sur stdin**, rendent un verdict par **code de sortie** (`0` = allow,
  `2` = block + message sur stderr) ;
- **fail-open total** : tout bug interne ⇒ `exit 0` (un garde ne fige jamais une session) ;
- **ancrage stable** (`$CLAUDE_PROJECT_DIR`, jamais le cwd dérivant) ;
- **journal** append-only (`~/.claude/iakaframe-*.log`).

**Constat clé** : chaque garde **mélange** aujourd'hui (a) le **parsing du payload Claude** (forme
du transcript, noms de champs) et (b) la **logique de décision** (regex des badges, appartenance
d'un chemin à un périmètre, appartenance d'un agent au roster). Cette logique (b) est
**intrinsèquement runner-agnostique** — c'est le levier de la parité (cf. §5, Lot 0).

### 2.2 Les 4 kits cibles — état actuel (déclaratif)

| Kit | Porte le rôle via | Mécanisme d'enforcement présent | Écrit dans un repo ? |
|---|---|---|---|
| `kit-codex` | `AGENTS.md` + `MODELES.md` (personas) | **aucun** (déclaratif) | **oui** (CLI de code) |
| `kit-ollama` | `AGENTS.md` + `MODELES.md` (Modelfile `SYSTEM`) | **aucun** (déclaratif) | non (front de chat) |
| `kit-openwebui` | 8 `models/*.json` (`params.system`) | **aucun** (déclaratif) | non (front de chat) |
| `kit-anythingllm` | 8 `prompts/*.md` (system prompt workspace) | **aucun** (déclaratif) | non (front de chat) |

### 2.3 Le vocabulaire runner/node (`cli/src/lib/vocab.js`)

- `RUNNER_KINDS = ['claude-code', 'ollama', 'litellm', 'codex']`
- `NODE_KINDS = ['claude', 'codex', 'ollama-localhost', 'ollama-lan', 'openwebui']`
- **Gap à signaler** : `anythingllm` **n'existe dans aucune enum** (ni runner, ni node, ni
  `KIT_NAME_BY_NODE`). Le kit `kit-anythingllm/` vit sur disque **sans citoyenneté dans le
  vocab canonique**. `litellm` est un *runner* sans node dédié (il sert de façade OpenAI-compatible
  vers Ollama). ⇒ pré-requis §7 : réconcilier vocab ↔ kits avant de câbler un déploiement.

---

## 3. Le problème (posé avant la solution)

**Peut-on forcer mécaniquement le rituel iakaframe sur un runner qui n'est pas Claude Code ?**
La réponse dépend de deux facteurs, distincts, qu'on confond souvent :

1. **Le runner offre-t-il un point d'interception ?** (hook natif ? middleware ? rien ?)
2. **Le garde a-t-il un sens sur ce runner ?** — un garde de **périmètre** (chemins hors repo) et
   un garde de **délégation** (routage sous-agents) n'ont de sens que pour un **agent qui écrit
   dans un repo et délègue**. Les fronts de chat (Open WebUI, AnythingLLM, Ollama-nu) **n'écrivent
   pas dans un repo** (leurs propres READMEs le disent) et **n'ont pas de dispatch multi-agents
   natif**. Pour eux, périmètre & délégation sont **structurellement hors-sujet** — ce n'est **pas
   un échec de parité**, c'est la nature de l'outil.

La cible réaliste n'est donc **pas** « les 3 gardes partout », mais :
- **CLIs de code** (Claude, Codex) → **parité forte des 3 gardes** atteignable ;
- **fronts de chat** (Open WebUI, AnythingLLM, Ollama) → **seul le garde d'identité** est
  pertinent, à granularité « une réponse » (pas de tour multi-message, pas de sous-agent).

---

## 4. Faits vérifiés sur le web (capacités réelles des runners)

> Faits datés (recherche 2026-07). Sources en §11.

### 4.1 Codex CLI — **il a de vrais hooks** (le plus proche de Claude)
- Système de **hooks lifecycle** introduit (expérimental) en **v0.114 (mars 2026)** ; événements
  **`SessionStart`, `SubagentStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`,
  `PostToolUse`, `PreCompact`, `PostCompact`, `SubagentStop`, `Stop`** — **vocabulaire quasi
  identique** à Claude Code.
- Un hook **reçoit le contexte en JSON sur stdin**, lance un **script**, exactement comme Claude.
- Configurable via **`hooks.json`** ou tables **`[hooks]` inline dans `config.toml`**.
- ⚠️ **Limites** : expérimental, **désactivé par défaut**, **indisponible sur Windows**. La forme
  exacte du payload (noms de champs du transcript/tool) **peut différer** de Claude → à **capturer
  sur une vraie session** avant de figer l'adaptateur.
- **Conséquence** : les 3 gardes `.mjs` sont **portables quasi-directement** vers Codex via un
  adaptateur de payload. → **Codex = runner pilote.**

### 4.2 Open WebUI — **Filter Functions** (middleware réel, pas de hook « exit 2 »)
- Fonctions Python à classe `Filter` avec **`inlet()`** (avant modèle : injecter du contexte,
  assainir), **`stream()`** (chunks temps réel), **`outlet()`** (après réponse complète : logguer,
  formater, **inspecter/annoter la réponse**).
- Middleware **bidirectionnel**, applicable **global** ou **par Model**, **priorité** ordonnable,
  **toggle par chat**. Installation **admin-only**.
- **Enforcement possible** : `outlet()` peut **vérifier la présence des badges** dans la réponse et
  la **réparer/annoter** ; `inlet()` peut **ré-injecter le rappel** (équivalent `identity-remind`).
  Sémantique **différente** d'un `exit 2` : un Filter **modifie/annote/peut lever une exception**,
  il ne « refuse » pas un tour au sens hook. Granularité = **une réponse** (pas de tour, pas de
  sous-agent). ⇒ parité **partielle→forte** sur l'**identité seulement**.

### 4.3 Ollama — **aucun hook natif** (enforcement = proxy externe uniquement)
- Ollama n'offre que le **Modelfile** (`SYSTEM`, `PARAMETER`, `TEMPLATE`) — **déclaratif**. Pas de
  cycle de vie, pas de middleware intégré.
- Le **seul** point d'enforcement est un **reverse-proxy/middleware devant l'API** (`/api/chat`,
  `/api/generate`) qui inspecte requête/réponse. C'est un **composant d'infra à construire**
  (nouvelle stack Docker par projet, cf. convention d'isolation).
- ⇒ **prompt-only nativement** ; parité d'identité **forte seulement au prix d'un proxy dédié**.

### 4.4 AnythingLLM — **skills = outils, pas gardes** (pas de hook de tour)
- Les **custom agent skills** (`plugin.json` + `handler.js`) sont des **outils que l'agent
  appelle** (`@agent`), **pas des hooks de cycle de vie** qui s'exécutent autour de chaque tour.
  Aucun point pre/post-réponse natif.
- Le **system prompt de workspace** reste **déclaratif** (variables `{date}`… en bonus).
- ⇒ **prompt-only** pour l'identité ; périmètre/délégation **hors-sujet** (front de chat). Un proxy
  externe (AnythingLLM tape un fournisseur LLM) reste une option de repli, **partagée avec Ollama**.

---

## 5. Stratégie retenue (à valider)

### 5.1 Trois archétypes d'enforcement (au lieu de « 5 portages »)

| Archétype | Runners | Point d'interception | Parité visée |
|---|---|---|---|
| **A. Hooks natifs** | Claude *(existant)*, **Codex** | stdin JSON → exit code | **forte** (3 gardes) |
| **B. Middleware/filter** | Open WebUI | Filter `inlet`/`outlet` (Python) | **partielle→forte** (identité) |
| **C. Proxy externe** | Ollama, *(AnythingLLM en repli)* | reverse-proxy devant l'API | **partielle** (identité) sinon **prompt-only** |

### 5.2 Le levier : un **guard-core runner-agnostique** (Lot 0)

Extraire des `.mjs` la **logique de décision pure** (sans I/O, sans forme de payload) dans un
module partagé `guard-core` :
- `verdictIdentity(turnTexts) → { startOk, stopOk }` (regex badges, aujourd'hui dans `identity-guard`) ;
- `verdictPerimeter(absPath, projectDir) → ALLOW_PROJECT | ALLOW_PORTFOLIO | DENY_HARNESS | HORS` ;
- `verdictDelegation(agent, roster) → known | refused`.

Chaque runner ne fournit alors qu'un **adaptateur** mince (parse son payload → appelle le core →
traduit le verdict dans sa sémantique) :
- **Claude** : adaptateur = les `.mjs` actuels, refactorés pour consommer `guard-core` (**zéro
  changement de comportement**, garanti par test de non-régression) ;
- **Codex** : adaptateur lisant le payload Codex (Stop/SubagentStop/PreToolUse…) → mêmes verdicts ;
- **Open WebUI** : Filter Python — soit **réimplémente** `verdictIdentity` en Python, soit
  **shell-out** vers le core node (arbitrage Lot 3) ;
- **Ollama/AnythingLLM** : adaptateur proxy (Lot 4, arbitrage).

**Bénéfice** : la règle des badges (et son évolution) vit **à un seul endroit**, testée par
**fixtures** ; la re-divergence (celle qu'a déjà connue le vocab, cf. en-tête `vocab.js`) est
neutralisée par un **test de parité** analogue à `vocab-parity.test.js`.

### 5.3 Ce qui reste honnêtement déclaratif (assumé, pas caché)

- **Périmètre & délégation** sur Open WebUI / AnythingLLM / Ollama : **hors-sujet** (pas de repo,
  pas de dispatch natif) — restent **prompt-only** dans `AGENTS.md`, sans prétendre les forcer.
- **AnythingLLM identité** : **prompt-only** (aucun point d'interception) — sauf proxy externe.
- **Fronts de chat** : le garde d'identité y opère à la maille « **une réponse** », pas « un tour
  multi-message avec sous-agents » (limite intrinsèque, à documenter dans chaque README).

---

## 6. Matrice de parité par runner × garde (synthèse fermée)

| | **Identité** | **Périmètre** | **Délégation** |
|---|---|---|---|
| **Claude Code** | hook Stop/SubagentStop — **FORT** *(existant)* | hook PreToolUse — **FORT** *(existant)* | hook Pre/PostToolUse Task — **FORT/audit** *(existant)* |
| **Codex CLI** | hook Stop/SubagentStop — **FORT** *(port quasi-direct)* | hook PreToolUse — **FORT** *(port)* | hook Pre/Post + SubagentStart/Stop — **FORT/audit** *(port)* |
| **Open WebUI** | Filter `outlet`/`inlet` — **PARTIEL→FORT** *(maille réponse)* | **N/A** *(pas de repo)* — prompt-only | **N/A** *(pas de multi-agent)* — prompt-only |
| **Ollama** | proxy externe — **PARTIEL** *(sinon prompt-only)* | **N/A** — prompt-only | **N/A** — prompt-only |
| **AnythingLLM** | **prompt-only** *(pas de hook ; proxy en repli)* | **N/A** — prompt-only | **N/A** — prompt-only |

Légende : **FORT** = refus mécanique possible ; **PARTIEL** = interception réelle mais sémantique/
maille réduite ; **prompt-only** = contrat déclaratif, non forcé ; **N/A** = garde sans objet.

---

## 7. Découpage en lots priorisés

| Lot | Contenu | Dépend de | Priorité | Statut |
|---|---|---|---|---|
| **Lot 0 — Socle** | Extraire `guard-core` (3 verdicts purs) + fixtures + refactor des `.mjs` Claude pour le consommer (**non-régression**) + test de parité core↔Claude | — | **P0** | à faire (fondation) |
| **Lot 1 — PILOTE** | **Codex × identité** : adaptateur payload Codex → `guard-core` sur `Stop`/`SubagentStop` ; snippet `hooks.json`/`config.toml` ; doc kit-codex | Lot 0 | **P0** | **pilote de cette instruction** |
| **Lot 2 — Codex complet** | Codex × **périmètre** + **délégation** (PreToolUse/PostToolUse, SubagentStart/Stop) | Lot 1 | P1 | à arbitrer après pilote |
| **Lot 3 — Open WebUI** | Filter Python `outlet`/`inlet` (identité) ; arbitrage **réimpl. Python vs shell-out node** | Lot 0 | P2 | à arbitrer |
| **Lot 4 — Proxy chat** | Proxy externe identité mutualisé **Ollama (+ AnythingLLM)** ; ou statu quo prompt-only assumé | Lot 0 | P3 | **arbitrage décideur** (coût infra vs valeur) |
| **Lot X — Vocab** | Réconcilier `vocab.js` ↔ kits : statut de `anythingllm` (l'ajouter aux enums, ou acter qu'il reste hors-vocab) | — | P1 | pré-requis déploiement |

**Ordre imposé** : Lot 0 **avant tout** (sans core partagé, chaque portage re-diverge). Puis Lot 1
(pilote, valide l'archétype A hors Claude à moindre risque : un seul garde, mécanisme le plus proche).

---

## 8. Le pilote (Lot 1) — premiers pas concrets

**Runner pilote** : **Codex CLI** (archétype A, mécanisme le plus proche de Claude).
**Garde pilote** : **identité** (le plus universel, sémantique la plus simple, déjà bien testable).

### 8.1 Étapes
1. **Capturer un payload réel** de hook Codex `Stop` **et** `SubagentStop` (session Codex
   v0.114+, hooks activés) → figer la forme exacte des champs (transcript / messages / rôle).
   *Sans ce fait, l'adaptateur repose sur une supposition — ne pas le sauter.*
2. **Lot 0 minimal d'abord** : extraire `verdictIdentity(turnTexts)` de `identity-guard.mjs` dans
   `guard-core` ; refactorer `identity-guard.mjs` (Claude) pour l'appeler ; prouver **zéro
   changement** par fixtures.
3. Écrire l'**adaptateur Codex** `codex-identity-guard.mjs` : lit le payload Codex sur stdin →
   reconstruit `turnTexts` → appelle `guard-core.verdictIdentity` → `exit 0/2` + message stderr,
   **fail-open** identique.
4. **Câbler** : fournir le snippet `[hooks]`/`hooks.json` dans `kit-codex/` (équivalent du
   `settings.example.json` Claude) et documenter l'activation (flag expérimental, non-Windows).
5. **Documenter** dans `kit-codex/README.md` : « garde d'identité **forcé** (parité Claude) » +
   limites (expérimental, macOS/Linux).

### 8.2 Critères d'acceptation (vérifiables) du pilote
- [ ] Payload Codex `Stop` **conforme** (ouverture + clôture badge) → l'adaptateur `exit 0`.
- [ ] Payload Codex `Stop` **sans badge de clôture** → `exit 2` + message stderr nommant le badge manquant.
- [ ] Payload Codex `Stop` **sans badge d'ouverture** → `exit 2`.
- [ ] Payload **malformé / vide / illisible** → `exit 0` (fail-open prouvé).
- [ ] `guard-core.verdictIdentity` renvoie un verdict **identique** pour un même `turnTexts`, qu'il
      soit appelé par l'adaptateur Claude ou Codex (**test de parité**).
- [ ] La suite de fixtures de `identity-guard.mjs` (Claude) **passe toujours** après refactor
      (non-régression du référentiel).
- [ ] `kit-codex/` contient le snippet de câblage + la doc d'activation ; un `codex` réel, hooks
      activés, **refuse** effectivement une réponse sans badge (**test manuel de bout en bout** au gate).

---

## 9. Périmètre

### DANS
- Extraction du `guard-core` runner-agnostique (3 verdicts) + fixtures + refactor non-régressif Claude.
- Portage **pilote** : Codex × identité (adaptateur + câblage + doc kit).
- La **matrice** et la **stratégie** par archétype (référence pour les lots suivants).
- Signalement du **gap vocab** `anythingllm` (Lot X, pré-requis).

### HORS (de cette instruction — relèvent des lots ultérieurs, à ré-arbitrer)
- Lots 2/3/4 (Codex complet, Open WebUI Filter, proxy Ollama/AnythingLLM) : **cadrés ici en
  intention**, **implémentés plus tard** après validation du pilote.
- Le **dispatch multi-agents natif** sur Open WebUI/AnythingLLM (déjà « itération 2 » de leurs kits).
- Support **Windows** des hooks Codex (limite upstream).
- **Policing sémantique** des frontières de rôle (déjà assumé hors-scope par `delegation-guard` :
  audit verbatim, pas jugement de contenu).

---

## 10. Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Payload Codex ≠ Claude (champs différents) | adaptateur faux | **capturer un payload réel** avant de figer (étape 8.1.1) |
| Hooks Codex expérimentaux / off par défaut / non-Windows | parité fragile / non portable | pin version (≥ v0.114) ; documenter l'activation ; acter macOS/Linux |
| Re-divergence de la règle des badges entre runners | parité illusoire | `guard-core` **unique** + **test de parité** (calqué sur `vocab-parity.test.js`) |
| Sémantique middleware ≠ hook (Filter modifie, ne « refuse » pas) | fausse promesse de parité forte OWUI | libeller **PARTIEL** honnêtement dans README + matrice |
| Proxy Ollama = nouvelle stack Docker/ports par projet | coût infra, collision ports | traiter en **arbitrage décideur** (Lot 4), pas dans le MVP |
| `anythingllm` hors vocab | déploiement CLI incohérent | Lot X avant tout câblage de déploiement |
| Sur-ingénierie (viser 3 gardes partout) | effort gaspillé sur du N/A | matrice §6 borne le périmètre au **pertinent** par runner |

---

## 11. Faits vérifiés — sources

- Codex CLI — hooks (événements, stdin JSON, `hooks.json`/`config.toml`, v0.114, expérimental,
  non-Windows) :
  - https://developers.openai.com/codex/hooks
  - https://developers.openai.com/codex/config-reference
  - https://github.com/openai/codex/blob/main/docs/config.md
- Open WebUI — Filter Functions (`inlet`/`stream`/`outlet`, middleware, priorité, toggle, admin-only) :
  - https://docs.openwebui.com/features/extensibility/plugin/functions/filter/
  - https://docs.openwebui.com/features/extensibility/pipelines/filters/
- Ollama — Modelfile (`SYSTEM`), pas de hook natif, enforcement via reverse-proxy :
  - https://docs.ollama.com/faq
  - https://deepwiki.com/ollama/ollama/4.1-modelfiles
- AnythingLLM — custom agent skills = outils appelés (`plugin.json`/`handler.js`), pas hooks de tour :
  - https://docs.anythingllm.com/agent/custom/introduction
  - https://docs.anythingllm.com/agent/custom/handler-js

---

## 12. Statut final

**Socle + pilote validables ; lots 2→4 à arbitrer.** Cette instruction ferme :
1. le **constat honnête** (qui peut être forcé, qui reste déclaratif, pourquoi) ;
2. la **stratégie** (3 archétypes + `guard-core` partagé) ;
3. la **matrice** de parité runner × garde ;
4. le **découpage en lots** priorisés ;
5. le **pilote** (Codex × identité) avec critères d'acceptation vérifiables.

Restent en **arbitrage décideur** avant lancement des lots suivants : l'effort **proxy chat**
(Lot 4 — coût infra vs valeur d'identité forcée sur des fronts de chat), le sort de
**`anythingllm`** dans le vocab (Lot X), et le choix **réimpl. Python vs shell-out** pour le Filter
Open WebUI (Lot 3).
