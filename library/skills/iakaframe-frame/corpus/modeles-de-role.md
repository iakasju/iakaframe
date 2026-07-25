# Modèles de rôle/agent — comparatif sourcé

> Socle écrit (§ 2.4 de `role-frame-builder.md`). Structuré par l'axe unique : **(a)** forme du
> modèle · **(b)** surface d'extension · **(c)** rapport à iakaframe. Sources : `sources.md`.
> Chaque affirmation notable porte sa source datée (**vérifié le 2026-07-25** contre la doc/dépôt
> officiel). Les marqueurs `[WEB-À-VÉRIFIER]` du squelette Gimli ont tous été levés ; les évolutions
> majeures repérées (BMAD v6 modules, AutoGen → Microsoft Agent Framework, ChatDev 2.0) sont
> signalées en « Note d'actualité » ou « Correction du squelette ».

---

## 0. iakaframe *(corpus interne, référence)*

- **(a) forme** — rôle = **donnée de méthode** (`methods/*.roleKeys`) ; **persona pure** (casting,
  I3 : aucun `runner`/`model`/`tools`) ; **binding** = triplet runner/model/tools ; **frame** =
  assemblage nommé (méthode + team) piochant dans la library partagée. Pipeline **3 phases + squad
  prod**, rôles hors chaîne possibles (portefeuille, design, documentation, **frame**).
- **(b) surface d'extension** — la **forge** : `iakaframe assemble`/`add`/`frame new`/`frame lint`
  côté CLI, `iakaFrameGUI` côté auteur. L'extension est une **surface séparée** de l'équipe de
  livraison — c'est précisément ce que le rôle `frame` (Fëanor) incarne.
- **(c)** — le point d'ancrage : tout le comparatif sert à orienter un tiers **vers** ou **hors** du
  modèle iakaframe selon ce qu'il veut forger.
- **Sources** : `methode-de-travail.md`, `library/`, `methods/`, `reservoir-de-frames.md`.

---

## 1. BMAD-METHOD — *le plus proche parent de Fëanor*

- **(a) forme** — agents **markdown + YAML**, chacun incarné par une **persona nommée**. À la
  version courante **v6** (v6.8/v6.9, ~49k étoiles, MIT), le roster de **livraison** est composé de
  personas nommées : **Mary (Analyst)**, **John (PM)**, **Sally (UX)**, **Winston (Architect)**,
  **Amelia (Dev)**, **Paige (Tech Writer)** ; la QA est portée par un module dédié (**TEA**, Test
  Architect) et le flux autonome par un worker **`bmad-dev-auto`** piloté par machine à états
  (*draft → ready-for-dev → in-progress → in-review → done*). *Vérifié le 2026-07-25 (DeepWiki
  architecture overview).*
- **(b) surface d'extension** — un **système de modules** (déclaré dans `bmad-modules.yaml`) :
  **BMM** (BMad Method Module, workflows cœur), **BMB** (BMad Builder, *« Create custom BMad agents
  and workflows »*), **TEA** (Test Architect), **BMGD** (Game Dev Studio), **CIS** (Creative
  Intelligence Suite). **BMB est la surface de forge dédiée** — c'est le module qui sert à créer de
  nouveaux agents et workflows, séparé de l'équipe de livraison. *Vérifié le 2026-07-25 (README du
  dépôt).*
- **(c)** — **parent direct** du rôle `frame` : BMAD confirme, dans l'état de l'art, que « construire/
  étendre le framework » est une surface distincte de l'équipe de livraison, avec son outillage —
  exactement ce que le module **BMB** incarne et ce que Fëanor porte côté iakaframe.
- **⚠️ Correction du squelette** — le squelette Gimli décrivait le modèle **v4/v5** : roster
  `analyst/pm/architect/sm/dev/qa/ux-expert`, agents hors chaîne `bmad-orchestrator`/`bmad-master`,
  et **expansion packs** comme surface d'extension. **La v6 (2026) a réorganisé cela** : les
  personas sont nommées, la surface d'extension est le **module BMB** (les *expansion packs*
  v4/v5 ont été généralisés en modules), et l'architecture v6 ne décrit plus d'agents
  `bmad-orchestrator`/`bmad-master` séparés (remplacés par `bmad-dev-auto` + « Party Mode »).
  **L'invariant retenu par Fëanor tient malgré la refonte** : chez BMAD, forger le framework est
  une surface distincte de l'équipe de livraison. *Vérifié le 2026-07-25.*
- **Sources** : README du dépôt + DeepWiki architecture (voir `sources.md`). *Vérifié le 2026-07-25.*

---

## 2. MetaGPT — *rôles = classes de code*

- **(a) forme** — rôles **matérialisés en classes** ; SOP (Standard Operating Procedures) ;
  slogan **« Code = SOP(Team) »**. Modifier le framework = **écrire du code**.
- **(b) surface d'extension** — dans le **code** (sous-classer un `Role`), hors périmètre des « rôles
  de projet » déclaratifs.
- **(c)** — **contraste** avec iakaframe : chez iakaframe le rôle est une **donnée** (markdown), pas
  une classe. Utile pour expliquer à un tiers pourquoi iakaframe n'exige pas de coder pour ajouter un
  rôle.
- **Note d'actualité** — les rôles simulés au README sont *« product managers / architects / project
  managers / engineers »*, avec le slogan exact **« Code = SOP(Team) »** (les SOP — Standard
  Operating Procedures — sont matérialisées et appliquées à une équipe de LLM). Le dépôt canonique
  a migré vers l'organisation **`FoundationAgents/MetaGPT`** (ex-`geekan/MetaGPT`). *Vérifié le
  2026-07-25 (README du dépôt).*
- **Sources** : dépôt MetaGPT (voir `sources.md`). *Vérifié le 2026-07-25.*

---

## 3. CrewAI — *modèle déclaratif léger*

- **(a) forme** — un `Agent` a pour attributs déclarés **`role` + `goal` + `backstory` + `tools`**
  (+ `llm`, `max_iter`, `allow_delegation`, `verbose`), assemblé en **crew** de **tasks** ; process
  **hiérarchique** ou **séquentiel**. Modèle déclaratif, orienté rôle. *Vérifié le 2026-07-25 (doc
  officielle « Agents »).*
- **(b) surface d'extension** — composition déclarative de crews/tasks (agents référencés puis
  tâches assignées) ; **pas de « surface de forge » séparée aussi nette que le module BMB de BMAD**.
  L'extension se fait en composant de nouveaux crews/agents/tasks dans le même plan, pas via un
  outillage de construction distinct. *Vérifié le 2026-07-25.*
- **(c)** — proche d'iakaframe par le **déclaratif orienté rôle** ; le quadruplet CrewAI
  (role/goal/backstory/tools) est un bon point de comparaison avec (roleKey + persona + binding.tools).
- **Sources** : doc CrewAI officielle « Agents » (voir `sources.md`). *Vérifié le 2026-07-25.*

---

## 4. AutoGen / Microsoft Agent Framework — *conversationnel*

- **(a) forme** — **`ConversableAgent` → GroupChat → messages → termination**. Modèle
  **conversationnel**, **pas** déclaratif-rôle : l'intervenant est un agent qui parle, pas un rôle
  typé dans un référentiel.
- **(b) surface d'extension** — sous-classer des agents conversationnels / configurer des GroupChats.
- **(c)** — **contraste fort** : montre qu'un framework peut ne PAS être orienté-rôle-déclaratif.
  Fëanor doit le savoir pour **ne pas plaquer le modèle iakaframe** sur un besoin conversationnel.
- **Note d'actualité** — le nom exact est **Microsoft Agent Framework** (packages `agent-framework`
  Python / `Microsoft.Agents.AI` .NET, + un runtime Go en public preview). La doc officielle le
  présente comme *« the direct successor, created by the same teams »* et *« the next generation of
  both Semantic Kernel and AutoGen »* : il **fusionne les abstractions d'agents d'AutoGen** avec les
  fonctionnalités entreprise de **Semantic Kernel**, et **ajoute des workflows orientés graphe**
  (type-safe, checkpointing, human-in-the-loop). Une **migration guide from AutoGen** existe. AutoGen
  n'est donc plus le framework actif — c'est bien Microsoft Agent Framework qui prend la relève.
  *Vérifié le 2026-07-25 (Microsoft Learn, doc datée du 2026-07-08).*
- **Sources** : Microsoft Learn — Agent Framework Overview (voir `sources.md`). *Vérifié le 2026-07-25.*

---

## 5. ChatDev — *entreprise virtuelle par phases*

- **(a) forme** — simule une **entreprise logicielle virtuelle** dont les rôles sont **CEO, CPO, CTO,
  programmer, reviewer, tester, art designer**, partitionnée en **phases waterfall** (*designing,
  coding, testing, documenting*). Chaque phase est décomposée en sous-tâches atomiques traitées par
  une **dyade d'agents** en dialogue multi-tours ; la **chat chain** est une **séquence dirigée
  d'échanges d'agents**, complétée d'un **memory stream** qui archive l'historique cumulé. *Vérifié le
  2026-07-25 (dépôt OpenBMB/ChatDev + article de revue du papier « Communicative Agents for Software
  Development »).*
- **(b) surface d'extension** — configuration des rôles/phases de l'entreprise virtuelle.
- **(c)** — **proche d'iakaframe par la phase**, distinct par le casting (métaphore d'entreprise vs
  compagnie). Bon exemple pour un tiers qui veut un pipeline surplombant à phases.
- **Note d'actualité** — une **ChatDev 2.0 (« DevAll »)** existe désormais, décrite comme une
  *« zero-code multi-agent orchestration platform »* débordant le seul dev logiciel (dataviz, 3D,
  recherche). Le modèle « entreprise virtuelle à phases » décrit ici est celui de **ChatDev 1.0**
  (legacy), qui reste la référence pour le contraste par phases. *Vérifié le 2026-07-25.*
- **Sources** : dépôt OpenBMB/ChatDev (voir `sources.md`). *Vérifié le 2026-07-25.*

---

## Contrastes — frameworks NON orientés-rôle (à connaître pour ne pas sur-plaquer)

### LangGraph — *graphe d'états*
- **(a) forme** — un **`StateGraph`** de **nodes** (fonctions qui reçoivent l'état, calculent, et
  renvoient un état mis à jour) et d'**edges** (fixes ou **conditionnels**, qui déterminent le nœud
  suivant selon l'état), autour d'un **state** partagé (schéma + `reducer`). Modèle **état/graphe,
  non orienté-rôle** : *« nodes do the work, edges tell what to do next »*, et *« nodes and edges are
  nothing more than functions »* (message-passing à la Pregel, super-steps). L'unité n'est pas un
  rôle mais un **nœud** de graphe. *Vérifié le 2026-07-25 (doc LangChain/LangGraph « Graph API »).*
- **(c)** — contraste : un besoin qui est fondamentalement un **workflow d'états** ne se modélise pas
  bien en rôles ; Fëanor doit savoir orienter hors iakaframe le cas échéant.

### OpenAI Agents SDK — *handoffs*
- **(a) forme** — **Agents** (*« LLMs equipped with instructions and tools »*), **Handoffs**
  (*« allow agents to delegate to other agents for specific tasks »*) et **Guardrails**
  (*« validation of agent inputs and outputs »*). Orienté **délégation/handoff** (approche
  « Python-first »), **pas** un référentiel de rôles typés. *Vérifié le 2026-07-25 (doc officielle
  openai-agents-python).*
- **(c)** — contraste : le « handoff » ressemble à la chaîne de badges iakaframe, mais sans référentiel
  de rôles ni méthode déclarative.

---

## Synthèse — les 5 modèles du socle sont INCOMPATIBLES entre eux

Déclaratif-rôle (CrewAI, iakaframe) vs conversationnel (AutoGen) vs classe de code (MetaGPT) vs phase
waterfall (ChatDev, iakaframe partiellement) vs graphe (LangGraph). **Orienter un tiers vers le bon
modèle suppose de les connaître et de les comparer** — c'est l'érudition qui fonde le rôle `frame`
(§ 2.3 de l'instruction). iakaframe combine **déclaratif-rôle + phases + squad prod** ; ce n'est pas
un universel : Fëanor doit reconnaître quand un autre modèle sert mieux le besoin du tiers.

## Findings du modèle de frame iakaframe (démo catalogue 7 frames, à porter — cf. § 9.8 instruction)
- **Finding 1** — biais de gouvernance/pipeline : `workflow` (`phases` + `gates`) présuppose un
  pipeline surplombant ; Scrum/Design Thinking ont dû le détourner (`kind: cycle`, `loop`).
- **Finding 2** — biais de cardinalité N≥2 : le format présuppose une équipe ; une méthode **solo**
  (N=1) fait dégénérer `team.personas`/`coordinator`/casting.
- **Finding 3** — pas de schéma ni de linter de frontmatter au moment de la démo ; `frame lint` (v0.22)
  répond en partie. Fëanor porte ces biais comme **contexte d'érudition** (ne bloquent pas le lot).
