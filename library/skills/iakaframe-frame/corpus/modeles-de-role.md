# Modèles de rôle/agent — comparatif sourcé

> Socle écrit (§ 2.4 de `role-frame-builder.md`). Structuré par l'axe unique : **(a)** forme du
> modèle · **(b)** surface d'extension · **(c)** rapport à iakaframe. Sources : `sources.md`.
> Passages `[WEB-À-VÉRIFIER]` = à re-vérifier/horodater par un agent web (Gimli n'a pas d'outils web).

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

- **(a) forme** — agents **markdown + YAML**. Roster de **livraison** (`analyst`, `pm`, `architect`,
  `sm`, `dev`, `qa`, `ux-expert`) distinct d'agents **hors chaîne** (`bmad-orchestrator`,
  `bmad-master`). [WEB-À-VÉRIFIER : composition exacte du roster à la version courante]
- **(b) surface d'extension** — les **expansion packs** : dossiers modulaires portant leurs propres
  agents et tâches, avec un **outillage de création dédié**. L'extension est une surface **séparée**.
- **(c)** — **parent direct** du rôle `frame` : BMAD confirme, dans l'état de l'art, que « construire/
  étendre le framework » est une surface distincte de l'équipe de livraison, avec son outillage.
- **Sources** : docs `expansion-packs.md` + architecture (voir `sources.md`). [WEB-À-VÉRIFIER : horodatage]

---

## 2. MetaGPT — *rôles = classes de code*

- **(a) forme** — rôles **matérialisés en classes** ; SOP (Standard Operating Procedures) ;
  slogan **« Code = SOP(Team) »**. Modifier le framework = **écrire du code**.
- **(b) surface d'extension** — dans le **code** (sous-classer un `Role`), hors périmètre des « rôles
  de projet » déclaratifs.
- **(c)** — **contraste** avec iakaframe : chez iakaframe le rôle est une **donnée** (markdown), pas
  une classe. Utile pour expliquer à un tiers pourquoi iakaframe n'exige pas de coder pour ajouter un
  rôle.
- **Sources** : dépôt MetaGPT (voir `sources.md`). [WEB-À-VÉRIFIER : horodatage]

---

## 3. CrewAI — *modèle déclaratif léger*

- **(a) forme** — agent = **role + goal + backstory + tools**, assemblé en **crew** de **tasks** ;
  process **hiérarchique** ou séquentiel. Modèle déclaratif, orienté rôle.
- **(b) surface d'extension** — composition déclarative de crews/tasks ; pas de « surface de forge »
  séparée aussi nette que BMAD. [WEB-À-VÉRIFIER : outillage d'extension actuel]
- **(c)** — proche d'iakaframe par le **déclaratif orienté rôle** ; le triplet CrewAI
  (role/goal/backstory/tools) est un bon point de comparaison avec (roleKey + persona + binding.tools).
- **Sources** : comparatif CrewAI/LangGraph/AutoGen (voir `sources.md`). [WEB-À-VÉRIFIER : horodatage]

---

## 4. AutoGen / Microsoft Agent Framework — *conversationnel*

- **(a) forme** — **`ConversableAgent` → GroupChat → messages → termination**. Modèle
  **conversationnel**, **pas** déclaratif-rôle : l'intervenant est un agent qui parle, pas un rôle
  typé dans un référentiel.
- **(b) surface d'extension** — sous-classer des agents conversationnels / configurer des GroupChats.
- **(c)** — **contraste fort** : montre qu'un framework peut ne PAS être orienté-rôle-déclaratif.
  Fëanor doit le savoir pour **ne pas plaquer le modèle iakaframe** sur un besoin conversationnel.
- **Note d'actualité** — AutoGen est en **maintenance**, **absorbé par Microsoft Agent Framework**.
  [WEB-À-VÉRIFIER : statut et nom exact du framework absorbant à jour — évolue vite]
- **Sources** : voir `sources.md`. [WEB-À-VÉRIFIER : horodatage]

---

## 5. ChatDev — *entreprise virtuelle par phases*

- **(a) forme** — simule une **entreprise logicielle virtuelle** (CEO, CTO, CPO, programmer, designer,
  tester, reviewer) partitionnée en **phases waterfall** (design, coding, testing, documenting),
  reliée par une **chat-chain**.
- **(b) surface d'extension** — configuration des rôles/phases de l'entreprise virtuelle.
- **(c)** — **proche d'iakaframe par la phase**, distinct par le casting (métaphore d'entreprise vs
  compagnie). Bon exemple pour un tiers qui veut un pipeline surplombant à phases.
- **Sources** : voir `sources.md`. [WEB-À-VÉRIFIER : horodatage]

---

## Contrastes — frameworks NON orientés-rôle (à connaître pour ne pas sur-plaquer)

### LangGraph — *graphe d'états*
- **(a) forme** — **graphe** de nœuds/arêtes (états + transitions), **non orienté-rôle**. L'unité
  n'est pas un rôle mais un **nœud** de graphe.
- **(c)** — contraste : un besoin qui est fondamentalement un **workflow d'états** ne se modélise pas
  bien en rôles ; Fëanor doit savoir orienter hors iakaframe le cas échéant. [WEB-À-VÉRIFIER]

### OpenAI Agents SDK — *handoffs*
- **(a) forme** — agents + **handoffs** (passages de main explicites), tools, guardrails. Orienté
  délégation, pas référentiel de rôles typés.
- **(c)** — contraste : le « handoff » ressemble à la chaîne de badges iakaframe, mais sans référentiel
  de rôles ni méthode déclarative. [WEB-À-VÉRIFIER]

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
