# Instruction : kits iakaframe pour AnythingLLM & Open WebUI

> **Statut : VALIDÉE par Stéphane (2026-06-23).**
> Rédigé en phase **cadrage** (🔵 Gandalf). Consommé après validation par la phase
> **réalisation** (⚒️ Gimli). Réf. méthode : `methode-de-travail.md` (§ Identité, rôles,
> phases). Motif réutilisé : `kit-codex/`, `kit-ollama/`, `kit-claude/`.

---

## Contexte / Besoin

Stéphane veut **installer iakaframe pour s'en servir dans AnythingLLM et dans Open WebUI**,
deux front-ends LLM **self-hosted**. Autrement dit : rendre la **méthode iakaframe** (roster
des 8 agents Odin / Aragorn / Gandalf / Gimli / Legolas / Helm / Loki / Nathalie, rituel
d'identité, conventions permanentes, cadrage-avant-code) **utilisable** dans ces deux UIs.

iakaframe possède déjà un **motif de kits portables par runtime** :
- `kit-claude/` — `CLAUDE.md` + hooks `identity-guard.ps1` / `identity-remind.ps1` + `global/` ;
- `kit-codex/` — `AGENTS.md` + `MODELES.md` + `README.md` + `specs/` (templates) ;
- `kit-ollama/` — idem `kit-codex/`, ciblé modèles locaux.

Sous Codex et Ollama, le roster n'est **pas** un ensemble de sous-agents dispatchables : c'est
une **galerie de personas** (un rôle à la fois, annoncé explicitement), et le rituel d'identité
y est **purement comportemental** (porté par le contrat, sans hook garde). AnythingLLM et Open
WebUI tombent dans **la même famille** que Codex/Ollama : pas de dispatch multi-agents natif,
pas de hook. Ce cadrage produit donc deux nouveaux kits **par symétrie** : `kit-anythingllm/`
et `kit-openwebui/`.

## Ce qui existe

| Élément | Où | État |
|---|---|---|
| Motif kit par runtime | `kit-codex/`, `kit-ollama/`, `kit-claude/` | implémenté — à imiter |
| Contrat persona + § Identité comportementale | `kit-codex/AGENTS.md` | implémenté — gabarit de référence |
| Table modèle↔persona | `kit-codex/MODELES.md`, `kit-ollama/MODELES.md` | implémenté — à adapter |
| README d'install par kit | `kit-codex/README.md` | implémenté — gabarit de référence |
| Méthode canonique (Identité, rôles, phases) | `methode-de-travail.md` | source de vérité |
| Contrats d'agents (personas) | `agents/*.md` (8 agents) | source des system prompts |
| Rituel d'identité (Décisions 3.1→3.9) | `specs/instructions/rituel-identite-agents.md` | source du § Identité |
| Kits AnythingLLM / Open WebUI | — | **absents** (objet de ce chantier) |

## Recherche & faits vérifiés (juin 2026)

### Versions cibles vérifiées sur la box (live, VM3 — 2026-06-23)

| UI | Version | URL (LAN) | Image Docker | Tag |
|---|---|---|---|---|
| Open WebUI | **0.9.6** | `http://192.168.2.12:8099` | `ghcr.io/open-webui/open-webui:main` | roulant `:main` |
| AnythingLLM | **1.13.0** | `http://192.168.2.12:3005` | `mintplexlabs/anythingllm:latest` | roulant `:latest` |

- Les deux images sont sur **tags roulants** (`:main` / `:latest`). Le kit **cible ces
  versions** mais reste **tolérant au versionnage** : pas de dépendance à un numéro de schéma
  figé, le JSON Open WebUI est calé sur l'export réel de l'instance vivante (cf. note Gimli).
- **Accès docker** : rebond SSH `local → root@192.168.2.20 → root@192.168.2.12`, stack dans
  `/root/docker-stack-ai`. Réf. inventaire : `C:\work\iakabox\v032\services-iakabox.txt`.

### AnythingLLM
- **Workspaces multiples, isolés** : chaque workspace a **son propre system prompt**, sa
  propre collection de documents/vecteurs, et **peut pointer un LLM (et un agent LLM)
  différent** du défaut global.
  Sources : [Configuration](https://docs.anythingllm.com/configuration),
  [System Prompt Variables](https://docs.anythingllm.com/features/system-prompt-variables).
- **System prompt par workspace** avec **variables** dynamiques (`{date}`, `{time}`,
  `{user.name}`, variables custom). Source : [System Prompt Variables](https://docs.anythingllm.com/features/system-prompt-variables).
- **`@agent`** : déclenche une session à capacités d'agent ; le système détecte si le modèle
  sait utiliser des outils. Source : [AI Agents overview](https://docs.anythingllm.com/agent/overview).
- **Custom Agent Skills** (extension de `@agent`) : dossier avec **`plugin.json`** (UI) +
  **`handler.js`** (logique NodeJS, doit retourner une string) ; **hot-load** ; **non
  disponibles en Cloud**, OK en **Docker (v1.2.2+)** et **Desktop (v1.6.5+)**. Distribution
  possible via **Community Hub**.
  Sources : [Custom skills — intro](https://docs.anythingllm.com/agent/custom/introduction),
  [Developer guide](https://docs.anythingllm.com/agent/custom/developer-guide),
  [handler.js](https://docs.anythingllm.com/agent/custom/handler-js),
  [plugin.json](https://docs.anythingllm.com/agent/custom/plugin-json).
- **Limite** : pas d'**import/export documenté d'une config de workspace** « clé en main » (le
  Community Hub importe des items, pas un snapshot de workspace). Le system prompt d'un agent
  se **colle à la main** dans le champ System Prompt du workspace.

### Open WebUI
- **Models (Workspace > Models)** : un **Model** = preset au-dessus d'un base model, auquel on
  **lie un system prompt**, des **knowledge bases**, des **tools/skills/filters/actions**, des
  **paramètres** (température, top_p, stop…) et des **prompt suggestions** (puces de démarrage),
  plus avatar / nom / id / description / tags / visibilité.
  Source : [Models](https://docs.openwebui.com/features/workspace/models/).
- **Export / Import natif** : un Model s'exporte en **`.json`** et se réimporte depuis un
  `.json` ou un lien **communautaire** ; bouton **Share** vers la communauté openwebui.com.
  Source : [Models](https://docs.openwebui.com/features/workspace/models/).
- **System prompt** à trois niveaux (chat > user > model), le plus spécifique l'emporte.
  Source : [SUSE AI — default system prompt](https://documentation.suse.com/suse-ai/1.0/html/openwebui-configuring/openwebui-setting-default-prompt.html).
- **Prompts** : bibliothèque de prompts réutilisables en **slash commands** (`/cadrage`…).
  Source : [Prompts](https://docs.openwebui.com/features/workspace/prompts/).
- **Tools / Functions / Pipelines** : extensions Python pour outils, filtres et pipelines —
  voie d'itération avancée. Source : [Features](https://docs.openwebui.com/features/).

### Conclusion transverse
Les deux UIs offrent **nativement** le strict nécessaire au MVP : **un persona = un system
prompt** (un **workspace** côté AnythingLLM, un **Model** côté Open WebUI). **Aucune** des deux
n'a de **dispatch multi-agents** façon Claude Code, ni de **hook garde d'identité**. Le rituel
(double badge par position de pastille, chaîne de délégation, restitution verbatim) y est donc
**purement comportemental**, exactement comme dans `kit-codex/` / `kit-ollama/`.

## Décision (approche retenue)

**Un agent = un persona = un Model (Open WebUI) / un workspace (AnythingLLM)** = un system
prompt importable, packagé dans deux nouveaux kits **`kit-anythingllm/`** et **`kit-openwebui/`**,
calqués sur `kit-codex/`. **8 personas** au total : **Odin** (porte d'entrée / orchestrateur
d'accueil) + Aragorn + Gandalf + Gimli + Legolas + Helm + Loki + Nathalie.

- **Open WebUI** : on livre **8 fichiers `models/*.json`** prêts à **importer** (un Model par
  agent), chacun portant le system prompt du persona + pastille de phase + prompt suggestions.
  L'import/export JSON natif rend l'install **quasi mécanique** (le point fort d'Open WebUI).
- **AnythingLLM** : pas d'import de workspace clé en main → on livre **8 fichiers
  `prompts/*.md`** (le system prompt de chaque agent, à coller dans le champ *System Prompt*
  d'un workspace dédié), + un **README pas-à-pas** « créer 8 workspaces, coller, choisir le LLM ».

Chaque kit contient en plus : un **contrat `AGENTS.md`** (le § Identité comportemental + les
conventions, comme Codex), un **`MODELES.md`** (mapping modèle↔persona adapté à la cible), un
**`README.md`** d'installation, et le dossier `specs/` (templates `PROJET.md` + `_TEMPLATE.md`)
pour que la méthode (cadrage-avant-code, états des lieux) reste portée dans le repo de travail.

> Note : ces UIs sont des **fronts de conversation**, pas des IDE agentiques qui écrivent dans
> un repo. Les system prompts y reproduisent les **personas et le rituel** (la « voix » et la
> discipline) ; la mécanique git/instructions/états des lieux reste portée par les **scripts
> PowerShell agnostiques** et le `specs/` du projet réel, comme pour tous les kits.

### Alternatives écartées

1. **Un seul assistant « méthode » polyvalent** (un seul Model / workspace qui joue tous les
   rôles via mention `@gandalf` dans le prompt). *Écartée* : moins lisible, on perd le « qui
   me parle » que la méthode valorise ; et côté Open WebUI on n'exploiterait pas le mécanisme
   natif « un Model par agent » (le plus simple et le plus propre).
   → **Retenu : un persona = un Model/workspace.** (Un Model « Odin » d'entrée, orchestrateur,
   reste utile comme porte d'entrée, mais ne remplace pas les 7 autres.)

2. **Skills natives dès le MVP** (AnythingLLM custom agent skills `handler.js` ; Open WebUI
   Tools/Functions/Pipelines en Python). *Écartée du MVP* (sur-ingénierie) : exige Docker/Desktop
   en version mini, du code par plateforme, et n'apporte **rien au cœur du besoin** (avoir les
   personas + la méthode). → **Backlog itération 2.**

3. **Émuler le dispatch multi-agents** (faire qu'un agent en « appelle » un autre). *Écartée* :
   non supporté nativement, faux-semblant fragile. On **acte la limite** plutôt que de la
   contourner : la chaîne de délégation reste **narrative** (l'humain change de workspace/Model,
   ou un orchestrateur cite verbatim), jamais un vrai routage.

## Périmètre

### Inclus (MVP)
- Création de `kit-anythingllm/` et `kit-openwebui/` (fichiers listés ci-dessous).
- Les **8 system prompts** par agent, dérivés de `agents/*.md` + du § Identité de
  `rituel-identite-agents.md`, portant la pastille de phase et le rituel comportemental.
- README d'install **pas-à-pas vérifiable** pour chaque UI.
- `MODELES.md` (mapping modèle↔persona) et `AGENTS.md` (contrat/conventions) par kit.

### Exclus (→ backlog / autres phases)
- Toute **custom agent skill** AnythingLLM (`plugin.json`/`handler.js`) — itération 2.
- Tout **Tool/Function/Pipeline** Open WebUI (Python) — itération 2.
- Branchement réel des modèles, déploiement Docker des UIs, et **l'écriture des kits**
  elle-même (= travail de Gimli **après** validation de cette instruction).
- Modification de la méthode canonique ou des `agents/*.md` (lecture seule ici).

## Fichiers à créer (par Gimli, après validation)

### `kit-openwebui/`  (cible Open WebUI **0.9.6**)
```
kit-openwebui/
├── AGENTS.md                     ← rituel comportemental (3.4 / 3.5 / 3.6 + 🟠 transverse),
│                                    ton portable, mention explicite « pas de hook garde »
├── MODELES.md                    ← mapping persona → modèle Ollama/LiteLLM recommandé
├── README.md                     ← install pas-à-pas : import JSON, base model, system prompt
├── models/                       ← 8 fichiers, un par persona, IMPORTABLES dans OpenWebUI 0.9.6
│   ├── odin.json   aragorn.json   gandalf.json   gimli.json
│   └── legolas.json   helm.json   loki.json   nathalie.json
└── specs/
    ├── PROJET.md
    └── instructions/_TEMPLATE.md
```
> **Slash-commands `prompts/` (`/cadrage`, `/revue`…) → itération 2** (hors MVP).

> **Note d'exécution pour Gimli — schéma JSON.** Le schéma d'un Model Open WebUI doit coller à
> l'**export réel de la v0.9.6**. Gimli récupère un export de référence depuis l'instance vivante
> (`http://192.168.2.12:8099`, accès LAN) ou via son API pour caler les champs exacts (`id`,
> `name`, `base_model_id`, `params`, `meta.system`, etc.). **Ne pas inventer un schéma divergent.**

### `kit-anythingllm/`  (cible AnythingLLM **1.13.0**)
```
kit-anythingllm/
├── AGENTS.md                     ← rituel comportemental (3.4 / 3.5 / 3.6 + 🟠 transverse),
│                                    ton portable, mention explicite « pas de hook garde »
├── MODELES.md                    ← mapping persona → modèle (un workspace = un LLM)
├── README.md                     ← install pas-à-pas : créer 8 workspaces, coller le
│                                    System Prompt, choisir le LLM par workspace
├── prompts/                      ← 8 fichiers, un par persona, à coller dans le System Prompt
│   ├── odin.md   aragorn.md   gandalf.md   gimli.md
│   └── legolas.md   helm.md   loki.md   nathalie.md
└── specs/
    ├── PROJET.md
    └── instructions/_TEMPLATE.md
```
> AnythingLLM **n'a pas d'import de workspace clé en main** → le MVP reste un **copier-coller
> guidé** (le README détaille le parcours, prompt par prompt).

### Symétrie & bundling CLI
- Les deux kits suivent la **symétrie** de `kit-codex/` / `kit-ollama/` (même structure :
  `AGENTS.md` + `MODELES.md` + `README.md` + payload persona + `specs/`), pour cohérence.
- **Point d'exécution pour Gimli** : ajouter `kit-anythingllm/` et `kit-openwebui/` à la **liste
  d'assets bundlés du CLI** si pertinent, comme cela a été fait pour `kit-claude`.

## Comportement attendu

- **Open WebUI** : importer `models/gandalf.json` crée un Model « Gandalf » qui, dès la 1ʳᵉ
  réponse, ouvre par `🔵 [ROYAUME][Gandalf] — …` et clôt par `… [ROYAUME][Gandalf] 🔵`
  (rien après la pastille), et applique le cadrage-avant-code. Idem pour les 8 personas.
- **AnythingLLM** : coller `prompts/gimli.md` dans le System Prompt d'un workspace « gimli »
  produit le même comportement (pastille de phase, conventions FR/code-en-anglais, gates).
- Le rituel (double badge par position, chaîne de délégation **narrative**, restitution
  **verbatim**) est décrit dans `AGENTS.md` de chaque kit comme **règle comportementale**, en
  assumant explicitement l'absence de hook garde.
- Le `README.md` permet à un tiers d'installer **sans connaissance préalable** d'iakaframe.

## Critères d'acceptation vérifiables

- [ ] `kit-anythingllm/` et `kit-openwebui/` existent avec l'arborescence ci-dessus.
- [ ] **Exactement 8 fichiers persona par kit** : `kit-openwebui/models/*.json` (8) et
      `kit-anythingllm/prompts/*.md` (8), nommés `odin`, `aragorn`, `gandalf`, `gimli`,
      `legolas`, `helm`, `loki`, `nathalie`.
- [ ] Chaque system prompt porte : rôle, phase, **pastille de phase**, règle de **position de
      pastille** (ouverture avant / clôture après), bannissement de « START »/« STOP »,
      conventions (FR pour la doc, anglais pour le code, MVP-d'abord, cadrage-avant-code).
- [ ] **`AGENTS.md` de chaque kit** porte le rituel comportemental **3.4 / 3.5 / 3.6** + la
      pastille **🟠 transverse**, un ton **portable** (non lié à un runtime précis), et la
      mention explicite **« pas de hook garde »** (rituel purement comportemental).
- [ ] Les `models/*.json` Open WebUI **s'importent sans erreur** dans l'instance **0.9.6**
      (`http://192.168.2.12:8099`) — schéma **conforme à un export réel de la 0.9.6**, aucun
      champ inventé.
- [ ] Chaque `README.md` décrit un parcours d'install **numéroté et testable** (Open WebUI :
      Workspace > Models > Import du JSON, base model, system prompt ; AnythingLLM : créer 8
      workspaces > coller le System Prompt > choisir le LLM par workspace).
- [ ] Chaque kit assume **par écrit** les limites : **aucune dépendance à un dispatch
      multi-agents natif**, pas de hook garde → rituel **comportemental** ; chaîne de
      délégation **narrative**.
- [ ] `MODELES.md` de chaque kit propose un mapping **persona → modèle** cohérent avec
      `kit-ollama/MODELES.md` (local d'abord, cloud en fallback justifié).
- [ ] Doc en **français**, identifiants / chemins / ids de modèles en **anglais**.

## Décisions actées (VALIDÉES par Stéphane — 2026-06-23)

1. **Granularité** : **un agent = un persona = un Model (Open WebUI) / un workspace
   (AnythingLLM)**. 8 entrées par UI, pas d'assistant méthode unique. **VALIDÉ.**
2. **Périmètre MVP** : **system prompts + README d'install** ; skills / tools / functions
   natifs renvoyés en **itération 2**. **VALIDÉ.**
3. **Versions cibles** (vérifiées live sur la box, VM3) : Open WebUI **0.9.6**
   (`http://192.168.2.12:8099`, `ghcr.io/open-webui/open-webui:main`) et AnythingLLM **1.13.0**
   (`http://192.168.2.12:3005`, `mintplexlabs/anythingllm:latest`). Tags roulants `:main` /
   `:latest` → kit **tolérant au versionnage**. Accès docker par rebond SSH
   `local → root@192.168.2.20 → root@192.168.2.12`, stack `/root/docker-stack-ai`. **VALIDÉ.**
4. **Open WebUI — slash-commands `prompts/`** : **itération 2** (hors MVP). **VALIDÉ.**
5. **Persona « Odin » d'accueil** en plus des 7 → **8 personas** (Odin + Aragorn + Gandalf +
   Gimli + Legolas + Helm + Loki + Nathalie). **VALIDÉ.**
6. **AnythingLLM multi-modèle** : « **un workspace = un LLM** » (un modèle par agent possible),
   fonctionnement natif acté. **VALIDÉ.**

## Hors scope

- Écriture des kits et des system prompts (→ Gimli, après validation).
- Custom agent skills AnythingLLM (`plugin.json`/`handler.js`) et Tools/Functions/Pipelines
  Open WebUI (Python) — backlog itération 2.
- Déploiement / configuration Docker des deux UIs, branchement des fournisseurs LLM.
- Toute modification de `methode-de-travail.md`, des `agents/*.md` ou des kits existants.
- iakaIDE (lecture `.claude/agents`) : hors de ces deux fronts conversationnels.
