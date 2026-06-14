# iakaframe — L'équipe virtuelle d'agents

> Référence canonique de l'**équipe d'agents** de la méthode iakaframe (vision
> « Yakaframe Avancé » : un écosystème de développement piloté par des agents pour
> une chaîne CI/CD au fil de l'eau — cf. `docs/…-Resume.pdf`).
>
> Chaque agent porte une **incarnation** (un nom, une référence) pour le rendre
> mémorisable, et un **rôle fermé** : zéro chevauchement, comme les trois acteurs
> d'origine. Ce fichier sert de source de vérité pour créer les skills associées.

---

## Principes transverses

- **L'humain (Stéphane) décide aux gates.** Les agents préparent et proposent dans un
  périmètre borné ; ils ne franchissent jamais seuls un gate de mise en production.
- **Aragorn est l'interlocuteur par défaut** (coordination + jalons + reporting), mais
  **tout agent peut solliciter Stéphane directement** en cas de besoin. Le gate humain
  est accessible depuis n'importe quel point de la chaîne.
- **n8n / Hermes sont des outils, pas des agents.** Ce sont les montures d'orchestration
  qu'Aragorn pilote ; le raisonnement reste à l'agent, pas au câblage.
- **Mémoires déportées + instructions écrites** : la coordination passe par des artefacts
  permanents (`specs/instructions/`, état des lieux), pas par la mémoire volatile.

---

## Roster

| Agent | Réf. / clin d'œil | Rôle | Étape / brique | Skill |
|---|---|---|---|---|
| 🛡️ **Aragorn** | le roi sur le seuil | **Coordination entre agents** : répartit, suit les jalons, rend compte à Stéphane | transverse (orchestration) | ❌ à créer |
| 🧙 **Gandalf** | Da Vinci — l'inventeur | **Création & cadrage amont** : invente la solution, écrit l'instruction fermée | 0 — cadrage | ✅ `iakaframe-cadrage` |
| ⚒️ **Gimli** | le nain forgeron | **Développement** : code, build, commits atomiques | 1 — dev | (porté par Claude Code) |
| 🏹 **Legolas** | l'archer à l'œil sûr | **Qualité / test** : typecheck, lint, tests unitaires + intégration | 2-3 — qualité/intég. | ✅ `iakaframe-qualite` |
| 🌉 **Helm** | Heimdall, gardien du Bifröst (+ barre / Helm) | **Production** : déploiement, **gardien des accès** (proxy, SSO, alias, rollback) **+ surveillance prod** | 4-5 — déploiement & surveillance | ✅ `iakaframe-deploiement` *(à étendre)* |
| 🎭 **Loki** | l'illusionniste, maître des apparences | **Graphisme / design** (charte NaonEdge) | brique design | ✅ `iakaframe-naonedge` |
| 📖 **Nathalie** | — | **Guides utilisateurs / documentation** | brique doc | ❌ à créer |

---

## Fiches détaillées

### 🛡️ Aragorn — Coordinateur (le roi sur le seuil)
- **Rôle** : coordination **entre agents**. Reçoit le besoin/vision de Stéphane, le découpe,
  déclenche le bon agent au bon moment, **surveille les jalons** et **communique** l'avancement.
- **Outils** : n8n / Hermes (orchestration — sous ses ordres, jamais l'inverse).
- **Entrées** → **sorties** : besoin de Stéphane → plan de répartition, statut des jalons, alertes.
- **Ne fait pas** : ni le cadrage fin (→ Gandalf), ni le code (→ Gimli), ni le déploiement (→ Helm).
- **Gate** : tient Stéphane informé ; remonte tout blocage ou décision structurante.

### 🧙 Gandalf — Architecte-cadreur (l'inventeur, Da Vinci)
- **Rôle** : étape 0. Transforme un besoin en **instruction fermée et vérifiable** dans
  `specs/instructions/`. Invente la solution **et** ferme le périmètre + critères d'acceptation.
- **Lecture seule** : ne touche jamais au code de production.
- **Gate** : l'instruction validée par Stéphane **déclenche** le développement.
- **Skill** : `iakaframe-cadrage`.

### ⚒️ Gimli — Développeur (le forgeron)
- **Rôle** : étape 1. Lit l'instruction, implémente étape par étape, build, **commits atomiques**.
- **Parallélisme** (vision PDF) : *N* Gimli possibles en parallèle (worktrees / sous-agents)
  — à cadrer côté orchestration (Aragorn).
- **Skill** : aucune dédiée — porté par **Claude Code** via `CLAUDE.md` (contrat de travail).

### 🏹 Legolas — Qualité / testeur (l'archer)
- **Rôle** : étapes 2-3. typecheck + lint + tests unitaires et d'**intégration** en environnements
  dédiés (dev, stage). **Gate automatique** avant promotion.
- **Entrées** → **sorties** : code de Gimli → rapport qualité (pass/fail) + blocage si régression.
- **Skill** : `iakaframe-qualite`.

### 🌉 Helm — Production & accès (Heimdall)
- **Rôle** : étapes 4-5. **Déploie** une version validée depuis le staging ; **garde les accès**
  (proxy inversé type Proxy Manager, SSO, routage par **alias de version**, **rollback**) ; et
  **surveille la prod** (health-checks, disponibilité des endpoints, charge, dashboard).
- **Gate** : mise en production = **gate humain**. Helm ne promeut jamais seul.
- **Skill** : `iakaframe-deploiement` — **à étendre** au volet surveillance.

### 🎭 Loki — Graphisme / design (l'illusionniste)
- **Rôle** : produit l'habillage visuel (docs HTML, decks, flyers, logos) selon la **charte NaonEdge**.
- **Skill** : `iakaframe-naonedge`.

### 📖 Nathalie — Guides utilisateurs
- **Rôle** : rédige la **documentation destinée aux utilisateurs** (guides, prise en main, FAQ) —
  à distinguer de la doc d'état du projet (`update` / `état-des-lieux`).
- **Skill** : ❌ à créer.

---

## Recoupement avec le PDF « Yakaframe Avancé »

| Agent PDF | Incarnation iakaframe |
|---|---|
| Interface conversationnelle / cadrage (§1) | 🧙 Gandalf |
| Agents de Développement — *N* parallèles (§2) | ⚒️ Gimli (×N) |
| Agent Testeur & Qualité (§2) | 🏹 Legolas |
| Agent de Gestion de Production (§2) | 🌉 Helm |
| Agent de Surveillance de Production (§2) | 🌉 Helm *(fusionné)* |
| Orchestration n8n / Hermes (§4) | outil piloté par 🛡️ Aragorn |
| *(hors PDF)* design | 🎭 Loki |
| *(hors PDF)* guides utilisateurs | 📖 Nathalie |

---

## Incarnation technique (décidé)

- **Subagents dispatchables + skills.** Chaque agent = un subagent Claude Code
  (`agents/<agent>.md` → `<projet>/.claude/agents/`), à contexte isolé et dispatchable par
  Aragorn (parallélisme : N Gimli en worktrees). Le savoir-faire vit dans la skill
  (`skills/iakaframe-*`) que l'agent charge. Le subagent = le *contrat* ; la skill = la *méthode*.
- **Étanchéité = image mutualisée / conteneur étanche.** Définitions uniques (source
  iakaframe), mais chaque projet reçoit **sa** copie scopée. Aucun agent ne mélange deux
  projets. La répartition entre projets est un choix **portefeuille** (Stéphane), pas un
  comportement d'agent.
- **Multi-plateformes** (vision PDF, à venir) : même équipe déclinable Claude / ChatGPT / IA
  locale. Aujourd'hui : incarnation **Claude**.

## État de l'outillage

- ✅ **Définitions de subagents** : `agents/` (aragorn, gandalf, gimli, legolas, helm, loki,
  nathalie) + `agents/_TEMPLATE.md`.
- ✅ **Skills** : `iakaframe-aragorn`, `iakaframe-cadrage`, `iakaframe-qualite`,
  `iakaframe-deploiement` (étendu surveillance), `iakaframe-naonedge` (catalogue de chartes),
  `iakaframe-nathalie`. Gimli reste porté par le `CLAUDE.md` du projet.
- ✅ **Commande** : `iakaframe-agents.ps1` (`list` / `create` / `affect` / `fullteam` /
  `status`, option `-Global`). Voir `methode-de-travail.md` § « L'équipe d'agents ».
