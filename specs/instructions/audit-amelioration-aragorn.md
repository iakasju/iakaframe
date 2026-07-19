# Audit de complétude — l'agent Aragorn (coordinateur, P-coordination, 🟠)

> Instruction de cadrage (Gandalf, P1). **Lecture seule** sur tout le dépôt ; ce fichier est
> le seul artefact produit. Objectif : statuer si la définition d'Aragorn est **précise et
> complète** sur toutes les dimensions, et **proposer des améliorations** priorisées.
> Aucun code ici — c'est une spec fermée pour un futur lot d'exécution.

## Portée & sources auditées (3 couches + méthode + hooks + cœur GUI)

| Couche | Fichier | Rôle dans la déf. d'Aragorn |
|---|---|---|
| Canon | `library/personas/aragorn.md` | frontmatter (id, description, roleKey, skills, guardrails) + corps |
| Déployé | `~/.claude/agents/aragorn.md` | contrat Claude Code (régénéré par le générateur) |
| Golden | `cli/test/fixtures/agents-golden/aragorn.md` | référence de parité (sha256 verrouillé, L5) |
| Skill | `library/skills/iakaframe-aragorn/SKILL.md` | savoir-faire de coordination |
| Binding | `bindings/iakaframe-claude-default.md:9` | `runner/model/tools` |
| Team | `teams/iakaframe-8.md:6` | `coordinator: aragorn` |
| Méthode | `methode-de-travail.md` | place dans phases/gates, pastille 🟠, verbatim, jalons |
| Hooks | `kits/iakaframe-claude/global/hooks/*` | identity / perimeter / delegation / guard-core |
| Cœur GUI | `~/work/iakaFrameGUI/packages/core/src/{roster,guardrail}.ts` | modèle du rôle `coordination` |

## Fait de contexte vérifié sur le web (load-bearing pour la dimension Tools)

La recommandation « faut-il ajouter l'outil `Task`/`Agent` à Aragorn ? » dépend d'un fait
externe sur Claude Code : **un subagent peut-il en dispatcher un autre ?**

- **Historiquement : non** — « subagents cannot spawn other subagents », limite *by design*.
- **Depuis Claude Code v2.1.172 (10 juin 2026)** : la nidification est **autorisée jusqu'à
  5 niveaux** ; un subagent qui veut déléguer doit disposer de l'outil `Agent`/`Task`. La
  syntaxe d'allowlist `Agent(name1,…)` n'est honorée qu'en thread principal ; ignorée en
  définition de sous-agent imbriqué.

**Conséquence** : le blocage technique qui justifiait l'absence de `Task` chez Aragorn n'existe
plus. Son omission est désormais un **choix d'architecture/least-privilege à trancher**, pas une
contrainte de la plateforme. (Sources en bas de fiche.)

---

## Verdict par dimension

| # | Dimension | Verdict | Preuve |
|---|---|---|---|
| 1 | Charte précise | **À améliorer** | mission/périmètre nets (`aragorn.md:19-34`) mais **scorie Slack** résiduelle (skill + méthode) |
| 2 | Expert MoE identifiable | **Complet** (léger tassement) | spécialité tranchée + clause anti-auto-cast (`aragorn.md:29-34`), frontières nettes vs Odin/Gandalf |
| 3 | Jalons | **Lacunaire** | mécanisme `iakaframe jalon` non décrit dans sa charte ; obligation d'estimation dev absente |
| 4 | Tools | **À améliorer** | charte promet un dispatch `Task`/`Agent` que le binding n'accorde pas (`binding:9` vs `aragorn.md:48-49`) |
| 5 | Skills + sous-skills | **Complet au MVP** (chantier possible) | `skills:[iakaframe-aragorn]` atomique ; jalon = candidat sous-skill partagé |
| 6 | Hooks | **À améliorer** | identity+perimeter câblés ; delegation **inerte** faute de `Task` ; pas de garde anti-auto-cast |
| 7 | Cohérence des 3 couches | **Complet (canon↔déployé)** / **Lacunaire (skill)** | générateur + golden garantissent canon==déployé ; **skill diverge** (Slack) |

---

## Dimension 1 — Charte précise ?

**Positif.** Mission (`aragorn.md:19-21`), périmètre *fait/ne fait pas* (`:23-28`), entrées→sorties
(`:66-70`), place dans la chaîne de badges (`:114-135`) sont **nets et fermés**. La clause
**« N'absorbe pas un rôle non casté »** (`:29-34`) — rapatriée au Lot 1 — est présente à
l'**identique** dans le canon, le déployé et le golden : il ordonne mais ne code pas, il ne
s'auto-caste pas.

**Scorie (canal de com Slack → iakaHub non propagée partout).** Le persona a migré vers
**iakaHub ↔ Discord** (`aragorn.md:52-64`), mais l'ancien **canal Slack/n8n** subsiste :

- `library/skills/iakaframe-aragorn/SKILL.md:70-82` — section entière **« Communication via
  Slack (bidirectionnel, via n8n) »** (contredit le persona).
- `methode-de-travail.md:189-193` — **« Canal de communication — Slack (bidirectionnel, via
  n8n) »** dans le roster, alors que la même méthode décrit iakaHub↔Discord plus bas (`:576-640`).

Point secondaire à décider (pas une scorie franche) : le persona **mélange** deux
infrastructures dans son identité — `iakaHub↔Discord` (canal de com) et `n8n/Hermes` (chaîne de
dispatch auto, `description` L4 + corps `:26,:49`). C'est défendable (deux objets distincts)
mais l'énoncé gagnerait à distinguer explicitement **canal de parole** vs **outil de dispatch**.

## Dimension 2 — Expert MoE identifiable ? (angle clé)

**Verdict : expert net et discriminable.** Spécialité tranchée = **coordination/orchestration
intra-projet**. Frontières étanches :

- **vs Odin (portefeuille)** : Aragorn est **une instance par projet** (`aragorn.md:98-99`) ;
  Odin est inter-projets, hors dispatch (`teams/iakaframe-8.md:11-18`). Aucun recouvrement.
- **vs Gandalf (cadrage)** : « ne fait pas le cadrage fin (→ Gandalf) » (`aragorn.md:27`).
- **Routabilité** : la `description` (`aragorn.md:4`) est riche et discriminante (« répartir un
  besoin », « suivre les phases », « qui doit intervenir »).
- **Étanchéité renforcée** par la clause anti-auto-cast (`:29-34`) : une lacune de casting est
  **escaladée**, jamais absorbée — ce qui empêche précisément la dilution redoutée.

**Léger tassement (pas une lacune d'identité).** La charte est **dense** : elle porte des
obligations opérationnelles nombreuses (`PROJET.md` `:36-41`, gate Legolas `:76-79`,
merge⇒versionnement `:81-86`, contrôle rangement Loki `:88-91`, clôture snapshot `:93-96`).
Toutes sont coordination-adjacentes, mais certaines relèvent de la **gestion de session
générique** plus que de l'orchestration pure. L'identité d'expert reste claire ; c'est un signal
pour envisager une **factorisation en sous-skills** (cf. dimension 5), pas une refonte.

## Dimension 3 — Jalons

**Lacunaire — deux manques, alors qu'Aragorn est l'orchestrateur des transitions/gates.**

1. **Mécanisme `iakaframe jalon` non décrit dans sa charte.** La méthode définit le jalon
   obligatoire (titre FIGlet `Standard` + **tableau émetteur/contenu/récepteur** + fichiers en
   `chemin:ligne`, `methode-de-travail.md:308-318`). Gandalf le porte explicitement dans sa
   charte ; **Aragorn ne le décrit pas** — il ne cite que « Réf. § Jalons & clôture »
   (`aragorn.md:95`). Or c'est lui qui **pose les gates entre agents** (cadrage→dev→qualité→prod).
   Sa charte énumère les gates (Legolas `:76-79`, prod `:72-73`, clôture `:93-96`) mais **pas le
   geste de jalon** qui les rend visibles.
2. **Obligation d'estimation dev absente.** La méthode charge nommément Aragorn :
   « l'estimation est posée par l'agent qui ouvre le jalon de dev (**Aragorn en coordination**,
   ou Gandalf en clôture de cadrage) » (`methode-de-travail.md:320-328`, jalon P1→P2 :
   équivalent jour-homme + complexité/risque + inconnues). **Rien** dans `aragorn.md` ne reprend
   cette obligation.

**Chaîne des jalons couverte ?** Gate humain P1 (délégué à Gandalf), gate auto P2, gate humain
prod (`aragorn.md:72-73`) sont présents. Le **jalon d'entrée de dev** (P1→P2 avec estimation) et
la **matérialisation FIGlet/tableau** sont les maillons manquants côté Aragorn.

## Dimension 4 — Tools (least-privilege)

Binding : `tools: [Read, Grep, Glob, Bash]` (`bindings/iakaframe-claude-default.md:9`).

- **Read/Grep/Glob** : justes (lire l'état, suivre les phases).
- **Bash** : justifié (il lance `iakaframe update/snapshot/recap`, `:83,:93-95`).
- **Pas de Write/Edit** : **correct** — il ne produit pas d'artefact de code. *Nuance* : il
  « maintient la ligne de `specs/PROJET.md` » (`:36-41`), écriture qu'il fait via Bash ou en
  déléguant ; sans Write, la mise à jour de `PROJET.md` passe forcément par un canal indirect —
  à clarifier (voir points à trancher).
- **Manque structurant — `Task`/`Agent`** : la charte affirme qu'il **« dispatche le subagent
  cible via l'outil Agent en session Claude Code »** (`aragorn.md:48-49`, `SKILL.md:58-59`) et
  déclare le garde-fou `delegation` (`aragorn.md:9`). **Or `Task` n'est pas dans son allowlist.**
  Deux lectures cohérentes possibles, **à trancher par le décideur** (le blocage technique a
  disparu depuis v2.1.172, cf. fait web) :
  - **(A) Aragorn dispatche réellement** → ajouter `Task` (ou `Agent`) à son binding.
  - **(B) Le dispatch réel est fait par le thread principal (Odin/Claude), Aragorn ne fait que
    produire l'ordre de mission** → alors corriger la charte/skill (« il émet l'ordre de mission,
    le routage est exécuté au niveau appelant ») pour ne pas promettre une capacité qu'il n'a pas.

## Dimension 5 — Skills + sous-skills

- `skills: [iakaframe-aragorn]` (`aragorn.md:8`) cohérent avec le défaut du cœur GUI
  (`roster.ts:29` → `coordination: ["iakaframe-aragorn"]`). Complet au MVP.
- **Sous-skills : atomique aujourd'hui, chantier défendable.** La coordination compose des
  capacités plus fines et **réutilisables** : *dispatch/ordre de mission*, *tenue des gates &
  jalons*, *reporting/état des phases*, *clôture-versionnement*. Le socle supporte déjà la
  composition (`specs/instructions/modele-composition-tools-sousskills.md`).
  - Candidat le plus net : un **sous-skill `iakaframe-jalon` partagé** (Aragorn **et** Gandalf
    posent des jalons — cf. dimension 3) pour **DRY** le mécanisme FIGlet+tableau
    émetteur/contenu/récepteur au lieu de le redécrire par persona.
  - Verdict : rester **atomique au MVP** est acceptable ; la factorisation jalon est le premier
    incrément à considérer si on ouvre le chantier sous-skills.

## Dimension 6 — Hooks

Garde-fous déclarés : `guardrails: [identity, perimeter, delegation]` (`aragorn.md:9`, rendus au
déployé). Mapping réel des hooks globaux :

- **identity-guard.mjs** (Stop/SubagentStop, `guard-core.mjs:46-75`) → **actif** pour Aragorn
  (badge ouverture/clôture vérifié). ✓
- **perimeter-guard.mjs** (PreToolUse `Edit|Write|Bash|NotebookEdit`) → **actif** sur ses gestes
  **Bash** (seul outil mutateur qu'il possède). ✓
- **delegation-guard.mjs** (PreToolUse/PostToolUse **`Task`**, `guardrail.ts:156`) → **INERTE
  pour Aragorn** : il n'a pas `Task`, le garde ne se déclenche jamais pour lui. Le garde-fou
  `delegation` déclaré sur sa persona n'a d'effet **que** s'il tourne en thread principal — ce
  qui **contredit** la dimension 4. Incohérence à résoudre en même temps que le point `Task`.
- **Garde anti-auto-cast : absente (contractuelle seulement).** La clause `:29-34` n'est portée
  par **aucun hook** ; elle repose sur la discipline. Une garde mécanique est difficile (payload
  sans persona, philosophie fail-open) — à documenter comme **différé assumé**, pas comme bug.

## Dimension 7 — Cohérence des 3 couches

- **Canon ↔ Déployé : cohérent et garanti.** Le générateur `cli/src/lib/generate-agents.js`
  projette persona+binding→contrat (corps **verbatim**, `renderAgentContract:54-65`) ; le golden
  `agents-golden/aragorn.md:5` verrouille le sha256 ; le déployé lu est **byte-identique** au
  corps canon. Le champ `guardrails` vient de la persona, `tools` du binding (I3). ✓
- **Skill ↔ Persona : divergence.** `SKILL.md:70-82` (Slack/n8n) **contredit** le persona
  (iakaHub↔Discord). Même intention de fond, canal obsolète. À réaligner.
- **Cœur GUI ↔ Aragorn : fidèle.** `roster.ts:17,29` mappe `coordination → Aragorn` +
  `iakaframe-aragorn` ; `guardrail.ts:119-163` catalogue identity/perimeter/delegation avec leurs
  deux rendus (hook / prose). Le modèle reflète l'agent. ✓ *(Vérifier que la copie vendorée GUI
  du golden est re-synchronisée après tout changement — étape manuelle notée dans l'en-tête
  golden `:4`.)*

---

## Améliorations proposées (priorisées)

### Quick wins (faible risque, fort alignement)

| Id | Amélioration | Fichiers | Critère d'acceptation |
|---|---|---|---|
| QW-1 | **Purger la scorie Slack** : réécrire la section com de la skill en iakaHub↔Discord (miroir du persona) | `SKILL.md:70-82` | plus aucune occurrence « Slack »/« via n8n » comme *canal de com* dans la skill ; texte aligné sur `aragorn.md:52-64` |
| QW-2 | **Corriger le roster méthode** | `methode-de-travail.md:189-193` | la ligne canal = iakaHub↔Discord, cohérente avec `:576-640` ; « Slack » supprimé |
| QW-3 | **Injecter l'obligation d'estimation dev** dans la charte | `library/personas/aragorn.md` (§ Gate) | la charte énonce que sur le jalon P1→P2, Aragorn (ou Gandalf) pose l'estimation jour-homme + complexité/risque + inconnues ; réf. `methode:320-328` |
| QW-4 | **Décrire le geste `iakaframe jalon`** dans la charte (émetteur/contenu/récepteur + fichiers `chemin:ligne`) | `library/personas/aragorn.md` (§ Gate) | Aragorn décrit comment il **pose** un jalon aux transitions, comme Gandalf le fait dans sa charte |

> Tout QW touchant `library/personas/aragorn.md` **doit** être suivi d'une **régénération** du
> déployé + golden (`node cli/scripts/gen-agents-golden.mjs`) et d'un **re-vendorage GUI** —
> sinon la parité (dimension 7) casse. C'est le critère de « fini » de QW-3/QW-4.

### Chantiers (décision structurante requise)

| Id | Chantier | Enjeu | Critère d'acceptation |
|---|---|---|---|
| CH-1 | **Trancher `Task`/`Agent` chez Aragorn** (option A ajout d'outil, ou B correction du discours) | lève l'incohérence charte↔tools↔delegation-guard (dim. 4+6) | soit `Task` figure au binding et le delegation-guard devient actif ; soit charte+skill n'affirment plus qu'il dispatche lui-même |
| CH-2 | **Sous-skill `iakaframe-jalon` partagé** (Aragorn + Gandalf) | DRY du mécanisme de jalon, allège la charte dense (dim. 5) | un sous-skill unique décrit le jalon ; Aragorn et Gandalf le référencent au lieu de le redécrire |
| CH-3 | **Clarifier l'écriture de `specs/PROJET.md`** (Bash indirect vs délégation vs Write ciblé) | cohérence tools ↔ obligation `:36-41` | la charte précise par quel canal la ligne PROJET.md est écrite, compatible avec l'allowlist retenue |
| CH-4 | *(différé assumé)* garde mécanique anti-auto-cast | aujourd'hui contractuel seul (dim. 6) | décision explicite : implémenter un garde ou acter le différé documenté |

---

## Points que SEUL le décideur tranche

1. **Architecture de dispatch (CH-1)** : Aragorn dispatche-t-il **réellement** les subagents
   (→ lui donner `Task`, désormais techniquement possible en nidification ≤5 niveaux depuis
   v2.1.172), ou reste-t-il un **planificateur** dont l'ordre de mission est exécuté par le
   thread principal (→ corriger le discours) ? Ce choix conditionne dim. 4 **et** dim. 6.
2. **Ouvre-t-on le chantier sous-skills** (CH-2) au-delà du MVP, ou garde-t-on la skill atomique ?
3. **Canal d'écriture de `PROJET.md`** (CH-3) : accepte-t-on un `Write` ciblé pour le coordinateur,
   ou reste-t-on strictement lecture+Bash ?
4. **Garde anti-auto-cast** (CH-4) : différé documenté ou objet d'un lot dédié ?

---

## Sources (fait externe vérifié)

- Claude Code — Create custom subagents : https://code.claude.com/docs/en/sub-agents
- Issue #60763 — Subagents have no Agent/Task tool (historique) : https://github.com/anthropics/claude-code/issues/60763
- Nested sub-agents 5 levels deep, v2.1.172 (juin 2026) : https://ofox.ai/blog/claude-code-nested-subagents-2026/

---

## Note additive — arbitrages du décideur (2026-07-19)

> Ajout **postérieur** à l'analyse ci-dessus, qui reste inchangée. Cette note consigne les
> décisions prises par le décideur sur les points « que SEUL le décideur tranche ».

- **CH-1 — `Task`/`Agent` chez Aragorn : option (A) retenue.** Aragorn **dispatche réellement** ;
  `Task` est **accordé** dans `bindings/iakaframe-claude-default.md` (assignation `aragorn`). Le
  `delegation-guard` devient **actif** pour lui, ce qui lève l'incohérence charte↔tools↔hook
  (dim. 4 + 6). La charte n'a pas à être corrigée : elle décrivait déjà la capacité désormais réelle.
- **CH-3 — écriture de `specs/PROJET.md` : option `Write` ciblé retenue.** `Write` est **accordé**
  au coordinateur, **borné aux artefacts de pilotage** (`specs/PROJET.md`, état/reporting) et
  **exclu** de tout artefact de réalisation (code, tests, configs applicatives) — qui restent à
  Gimli. Le canal indirect (Bash/délégation) est **abandonné**. Bornage inscrit dans
  `library/personas/aragorn.md` (§ « Obligation — ligne de définition du projet »).
- **CH-4 — garde mécanique anti-auto-cast : DIFFÉRÉE (différé assumé).** Par arbitrage du décideur,
  aucun hook anti-auto-cast n'est implémenté à ce lot. Le garde-fou reste **contractuel seul** —
  porté par la clause « N'absorbe pas un rôle non casté » (`library/personas/aragorn.md`), rendue à
  l'identique dans le contrat déployé et le golden. Ce n'est **pas un bug ouvert** mais une
  **décision documentée** : la mécanisation reste possible dans un lot dédié ultérieur, sans
  échéance engagée.
