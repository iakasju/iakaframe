# Instruction — Modèle de composition : tools dans le binding + sous-skills (+ audit des imbrications)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (méthode `library/` + binding) et
> **Gimli/GUI** (`packages/core` + réservoir). Statut en fin de doc.
> Ordre d'Odin : compléter le triplet `{runner, model, tools}` du binding, introduire la
> décomposabilité des skills (**sous-skills**), et **auditer le graphe complet de composition** du
> réservoir (les 11 types + atomes).
> Deux dépôts : `~/work/iakaframe` (méthode canon) et `~/work/iakaFrameGUI` (cœur `@iakaframe/core`
> + forge GUI qui reflète le modèle).
> Réf. code méthode : `methods/iakaframe.md`, `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md`,
> `library/personas/*.md`, `library/skills/*/SKILL.md`, `library/workflows/iakaframe-3phases.md`.
> Réf. code GUI : `packages/core/src/{frame,reservoir,binding,persona,skill,connector}.ts`,
> `packages/core/src/adapters/claudeCode.ts`, `packages/core/src/vocab.json`,
> `src/forge/{ReservoirPanel.tsx,useForgeReservoir.ts}`.
> Réf. cadrage antérieur : `specs/instructions/lot1-rafraichissement-contrats-agents.md` (dérive
> host-only des contrats), `specs/instructions/reconcilier-kit-source-frame.md`.

---

## 0. Besoin (reformulé)

Le **modèle de composition** iakaframe (le « réservoir » : 11 types d'éléments qui s'imbriquent)
est **réalisé à moitié** sur deux facettes :

1. Le triplet du **modèle persona** `{runner, model, tools}` (I3 : facettes d'exécution vivant
   **uniquement** dans le binding) n'existe qu'aux deux tiers : le binding markdown porte `runner`
   et `model`, **jamais `tools`**. Les tools réels ne vivent QUE dans les contrats déployés
   `~/.claude/agents/*.md` (frontmatter `tools:`), **édités à la main** → **même piège de dérive
   host-only que le Lot 1**.
2. Les **skills** sont **atomiques** : une skill ne peut pas en composer d'autres. Or plusieurs
   skills sont **déjà des orchestrateurs en prose** (`iakaframe-init` « pilote » onboard + forgejo
   + docker + snapshot ; `iakaframe-update` appelle snapshot + forgejo ; `iakaframe-odin` inclut
   iakastart) sans que cette **composition** soit structurée ni vérifiable.

Objectif (MVP, **modèle** — on ne code aucun moteur) : (A) **câbler `tools` dans le binding** pour
fermer le triplet ; (B) **introduire les sous-skills** (décomposabilité) ; et d'abord (0) **cartographier
le graphe réel** pour situer précisément les deux ajouts et lister les autres trous d'intégrité.
On **ne construit PAS** le générateur persona→contrat (lot cause-racine séparé, §6) — mais on
**spécifie l'articulation** : ce générateur DEVRA consommer `tools`.

---

## 1. AUDIT DES IMBRICATIONS — le graphe complet de composition

### 1.1 Graphe des références sortantes (les 11 types → quoi → cible)

Lu sur les frontmatters/corps RÉELS. `∈` = appartenance à un pool, `⊆` = sous-ensemble.

| # | Type (fichier réel) | Champ porteur | → Cible (type) | Vérifié par `checkFrameRefs` ? |
|---|---|---|---|---|
| 1 | **methods** (`methods/iakaframe.md`) | `workflowId` | ∈ workflows (ou catalogue cœur) | ✅ oui (`frame.ts:277-280`) |
| | | `principleIds` | ⊆ principles | ✅ oui |
| | | `ritualIds` | ⊆ rituals | ✅ oui |
| | | `guardrailIds` | ⊆ guardrails | ✅ oui |
| | | `roleKeys` | ⊆ roles (par `key`) | ✅ oui |
| | | `scaffoldIds` | ⊆ scaffolds | ✅ oui |
| | | *(ne nomme AUCUNE persona — E2)* | — | n/a (voulu) |
| 2 | **teams** (`teams/iakaframe-8.md`) | `personas[]` | ⊆ personas | ✅ oui |
| | | `coordinator` | ∈ personas | ✅ oui |
| | | `guardrails[]` (frontmatter, `[]` ici) | ⊆ guardrails | ❌ **NON vérifié** |
| 3 | **bindings** (`bindings/iakaframe-claude-default.md`) | `methodId` | ∈ methods | ✅ oui |
| | | `teamId` | ∈ teams | ✅ oui |
| | | `assignments[].personaId` | ⊆ personas | ✅ oui |
| | | `assignments[].runner` | ∈ runnerKinds (vocab) | ⚠️ **hors modèle** (SF2 jette le champ) |
| | | `assignments[].model` | libre | ⚠️ **hors modèle** (SF2 jette le champ) |
| | | `assignments[].tools` | **N'EXISTE PAS** | 🕳️ **TROU A** (cadré §2) |
| | | `node` | ∈ nodeKinds (vocab) | partiel |
| 4 | **personas** (`personas/<p>.md`) | `roleKey` | ∈ roles | ❌ **NON vérifié** |
| | | `skills[]` | ⊆ skills | ❌ **NON vérifié** |
| | | `guardrails[]` | ⊆ guardrails | ❌ **NON vérifié** |
| 5 | **skills** (`skills/<s>/SKILL.md`) | `id, name, description` **seulement** | **AUCUNE réf. sortante** | — |
| | | *(sous-skills, tools, roleKey)* | **N'EXISTENT PAS** | 🕳️ **TROU B** (cadré §3) |
| 6 | **roles** (`roles/<r>.md`) | `id, key, label, roleIndex, scope` | feuille (aucune réf.) | — |
| 7 | **principles** (`principles/<p>.md`) | `id, name` + corps | feuille | — |
| 8 | **rituals** (`rituals/<r>.md`) | `id, name` + corps | feuille | — |
| 9 | **guardrails** (`guardrails/<g>.md`) | `hook` (events CC), corps→scripts | feuille (réf. **scripts** hors-modèle) | — |
| 10 | **scaffolds** (`scaffolds/<s>.md`) | `level`, `entries[].path` | feuille (chemins, pas d'ids) | — |
| 11 | **workflows** (`workflows/iakaframe-3phases.md`) | `phases[].agentsRoleKeys` | ⊆ roles | ❌ **NON vérifié** |

### 1.2 (a) Imbrications RÉELLES et résolues

La colonne « ✅ » ci-dessus : **method → {workflow, principles, rituals, guardrails, roles, scaffolds}**
et **team → {personas, coordinator}** et **binding → {method, team, personaId}** sont **réellement
câblées ET vérifiées** par `checkFrameRefs` (`packages/core/src/frame.ts:253-303`). C'est le **noyau
résolu** du graphe — l'assemblage `binding → method + team → personas` fonctionne de bout en bout.

### 1.3 (b) Les TROUS (niveaux qui devraient référencer / vérifier et ne le font pas)

- **T1 — persona → {roleKey, skills, guardrails} non vérifiés.** Les personas référencent 3 cibles
  (`roleKey`∈roles, `skills`⊆skills, `guardrails`⊆guardrails) mais `checkFrameRefs` **ne couvre que
  method/team/binding**. Une persona pointant une skill inexistante **passe l'intégrité**. Trou
  d'intégrité **existant, indépendant** des deux ajouts — à combler (bas coût, même patron `needEach`).
- **T2 — binding → tools inexistant** (le cœur de l'ajout A). Le champ n'existe pas au markdown ;
  et le triplet est **amputé** au parse (voir T4).
- **T3 — skill → sous-skills inexistant** (le cœur de l'ajout B). Aucune skill ne peut en composer
  une autre en structure ; la composition n'existe **qu'en prose**.
- **T4 — SF2 `FrameBinding` ampute le triplet.** `parseFrameBinding` (`frame.ts:213-227`) ne
  conserve que `personaIds[]` : il **jette `runner`, `model` ET (a fortiori) `tools`**. Le modèle de
  frame ne « voit » donc jamais les facettes d'exécution pourtant présentes au markdown.
- **T5 — workflow → roles (`agentsRoleKeys`) non vérifié.** Trou d'intégrité mineur, même patron.
- **T6 — team.guardrails non vérifié.** Mineur (vide au canon actuel), à combler avec T1.

### 1.4 (c) Incohérences MÉTHODE (`library/`) ↔ RÉSERVOIR GUI (`reservoir.ts`/`frame.ts`)

- **INC1 — le cœur est EN AVANCE sur la donnée.** `PersonaBinding` (`packages/core/src/binding.ts:31-40`)
  porte **déjà** `tools: string[]` (+ `parseTools` défensif `:88-94`), mais **aucun binding markdown**
  ne le renseigne et le **parseur SF2 qui lit réellement les `.md`** (`parseFrameBinding`) l'ignore.
  Le type est prêt, la donnée et le chemin de lecture ne le sont pas. → **INC de câblage**, pas de type.
- **INC2 — namespace `tools` ambigu.** `binding.ts:26` documente `tools` comme « ids de `toolKinds`
  (ex. `comfyui-local`) » et `vocab.json:8` fixe `toolKinds: ["comfyui-local"]` — un espace de noms
  **externe (type MCP/serveur d'outils)**, DIFFÉRENT des **outils built-in Claude Code** (`Read, Grep,
  Glob, Bash, Write, Edit, WebSearch, WebFetch`) que portent réellement les contrats déployés. Le
  champ existe mais sa **sémantique ne correspond pas** à ce que la cible (le contrat) exige. → point
  à trancher (§8).
- **INC3 — le réservoir GUI ne modélise ni tools ni sous-skills.** `RESERVOIR_COMPOSITION`
  (`reservoir.ts:32-37`) ne connaît que 4 éléments (`team/method/kit/frame`) et 11 types de pool.
  Il **n'a pas** d'élément `skill` (donc pas de réservoir de sous-skills) ni de projection des tools.
  La composition GUI **ne reflète donc PAS fidèlement** le graphe réel une fois A et B ajoutés. → à étendre.
- **INC4 — intégrité GUI incomplète.** `checkFrameRefs` ne couvre pas T1/T5/T6 : le **rapport
  d'intégrité de la forge est partiel** au regard du graphe réel de références.
- **INC5 — générateur host-only (rappel Lot 1).** `renderAgent` (`adapters/claudeCode.ts:52-78`)
  consomme `model` du binding (`modelForPersona`) mais **PAS `tools`** (« tools absent au MVP →
  hérite des outils courants », `:44-46`). Les tools réels ne sont donc **pas dérivés du modèle** →
  ils dérivent à la main dans `~/.claude/agents/`. C'est **exactement** le piège du Lot 1, sur l'axe tools.

> **Synthèse audit** : le noyau `binding→method+team→personas` est **solide et vérifié**. Tout le
> reste du graphe (persona→ses cibles, skill→sous-skills, binding→tools, workflow→roles) est soit
> **non structuré** (tools, sous-skills), soit **non vérifié** (persona/*, workflow/*), soit
> **amputé au parse** (SF2 triplet). Le cœur GUI porte déjà le TYPE `tools` mais ni la donnée, ni le
> parseur SF2, ni le réservoir, ni le générateur ne le traversent.

---

## 2. CADRAGE A — `tools` dans le binding (fermer le triplet `{runner, model, tools}`)

### 2.1 Principe (I3 respecté)

`tools` est une **facette d'exécution** → elle vit **dans le binding**, jamais dans la persona (qui
reste pure, `persona.ts:19-34` inchangé). Un id d'outil **n'est pas un credential** (invariant secret
inchangé : `binding.ts:88-94`). `tools` (par persona) ≠ `connectors` (par team, MCP) : **deux axes
distincts**, sans couplage au MVP (`binding.ts:28-29`).

### 2.2 Schéma — markdown binding (méthode canon)

Chaque `assignments[]` gagne un champ `tools:` (liste). `bindings/iakaframe-claude-default.md` :

```yaml
assignments:
  - { personaId: odin,     runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Bash] }
  - { personaId: aragorn,  runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Bash] }
  - { personaId: gandalf,  runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit, WebSearch, WebFetch] }
  - { personaId: gimli,    runner: claude-code, model: "sonnet", tools: [Read, Edit, Write, Bash, Grep, Glob] }
  - { personaId: legolas,  runner: claude-code, model: "sonnet", tools: [Read, Grep, Glob, Bash] }
  - { personaId: helm,     runner: claude-code, model: "sonnet", tools: [Read, Grep, Glob, Bash] }
  - { personaId: loki,     runner: claude-code, model: "sonnet", tools: [Read, Write, Edit, Grep, Glob, Bash, WebFetch, WebSearch] }
  - { personaId: nathalie, runner: claude-code, model: "sonnet", tools: [Read, Write, Edit, Grep, Glob, Bash, WebSearch, WebFetch] }
```

**Valeurs par défaut = les tools RÉELS des contrats déployés** (`~/.claude/agents/*.md`, vérifiés
2026-07-19) — pour que le binding **encode l'existant** (least-privilege déjà en place), et non
« inherit all ». Rappel Nathalie : `tools` inclut `WebSearch, WebFetch` (aligné Lot 1 §Axe 3).

### 2.3 Sémantique retenue (recommandation Gandalf — à confirmer §8)

`tools` = **allowlist d'outils, dans le vocabulaire du `runner` de l'assignment**. Pour
`runner: claude-code`, ce sont les **noms d'outils built-in Claude Code** (émis verbatim dans le
`tools:` du contrat). C'est **runner-scoped**, ce qui est cohérent : un binding est **par nœud**, et
le runner est par persona. → On **réutilise** le champ `PersonaBinding.tools` existant (on **élargit
sa doc** de « toolKinds MCP » à « allowlist runner-scoped » ; l'axe MCP externe reste porté par
`connectors` côté team, et par `vocab.toolKinds` si un jour on attache des serveurs par persona).

### 2.4 Parseur (`packages/core`) — combler T2 + T4

- `PersonaBinding` (`binding.ts`) : **inchangé** — `tools: string[]` + `parseTools` existent déjà.
  Mettre à jour **le commentaire** de doctype (§2.3) pour lever l'ambiguïté INC2.
- `FrameBinding` (`frame.ts:107-112`) : **enrichir** pour **cesser d'amputer le triplet**. Remplacer
  `personaIds: string[]` par des **assignments typés** portant le triplet, tout en gardant `personaIds`
  **dérivable** (pour l'intégrité existante `frame.ts:299`). Schéma cible MVP :

  ```ts
  export interface FrameAssignment {
    personaId: string;
    runner: string;   // conservé (T4), non validé ici — vocab au host
    model: string;    // conservé (T4)
    tools: string[];  // NOUVEAU (T2) — via parseTools
  }
  export interface FrameBinding {
    id: string; methodId: string; teamId: string;
    assignments: FrameAssignment[];        // remplace personaIds[]
    personaIds: string[];                  // dérivé = assignments.map(a => a.personaId)
  }
  ```
  `parseFrameBinding` (`frame.ts:213-227`) : lire chaque assignment (réutiliser `parseTools` pour
  `tools` ; `runner`/`model` en `str()` défensif), dériver `personaIds`. **Défensif** (jamais
  d'exception, calqué sur l'existant). L'intégrité `binding→personaId` reste inchangée.

### 2.5 Réservoir GUI — exposer les tools (INC3)

Les tools ne sont **pas** un 12ᵉ type de pool : ce sont une **facette de l'assignment** (persona × binding).
MVP recommandé (à confirmer §8) : les exposer **en projection de l'assemblage du binding**, pas en
groupe `buildReservoir`. Concrètement : le `FrameBinding.assignments` (désormais porteur de `tools`)
est déjà dans `frame.assembly.binding` → l'UI du binding (là où runner/model s'affichent) **liste les
`tools` par persona**. Aucun nouvel I/O, aucune extension des 11 types.

### 2.6 Générateur persona→contrat — l'articulation (HORS lot, mais spécifiée)

`renderAgent` (`adapters/claudeCode.ts`) **devra** consommer `tools` **exactement comme il consomme
déjà `model`** : ajouter un `toolsForPersona(binding, personaId)` (miroir de `modelForPersona`,
`binding.ts:194-201`) et émettre une ligne `tools: <liste jointe par ", ">` **si et seulement si** la
liste est non vide (sinon **ligne omise** → `tools` absent → **héritage de tous les outils**, cf.
docs CC). Ce câblage est le **lot cause-racine** (§6) : tant qu'il n'est pas fait, les tools restent
host-only et **redérivent**. Ici on **garantit que la donnée existe et est lisible** pour lui.

---

## 3. CADRAGE B — sous-skills (décomposabilité des skills)

### 3.1 Principe

Une skill peut **composer** d'autres skills (relation skill→skill). C'est le miroir, au niveau skill,
de « method→ids » et « team→personas » : **que des ids**, aucun corps recopié (I1). MVP = on décrit
**la relation**, pas un moteur d'exécution/chaînage.

### 3.2 Schéma — SKILL.md (méthode canon)

Champ **`subskills: []`** dans le frontmatter du `SKILL.md` (nom retenu : `subskills`, plus explicite
que `composes`). Exemples **alignés sur la prose existante** :

```yaml
# library/skills/iakaframe-init/SKILL.md
subskills: [iakaframe-forgejo, iakaframe-docker, iakaframe-etat-des-lieux]
# library/skills/iakaframe-update/SKILL.md
subskills: [iakaframe-etat-des-lieux, iakaframe-forgejo]
# library/skills/iakaframe-odin/SKILL.md
subskills: [iakastart]
```

Champ **optionnel** (absent = skill atomique, cas par défaut). Le corps `SKILL.md` reste la référence
narrative (I5) ; `subskills` **structure** ce que la prose disait déjà. **Où vivent les sous-skills** :
dans le frontmatter de la skill parente (colocalisé, source de vérité unique) — **pas** de registre
central (à confirmer §8).

### 3.3 Intégrité — les sous-skills référencés existent (et pas de cycle trivial)

Étendre `checkFrameRefs` (`frame.ts`) : pour chaque skill, `subskills ⊆ skills` (même patron
`needEach`, source `skill:<id>`, field `subskills`). **Garde-fou minimal** : une skill ne se référence
pas elle-même (`id ∉ subskills`). La détection de cycle profond (A→B→A) est **hors MVP** (signalée §6).
Ceci suppose que `poolIds.skills` soit peuplé — il l'est déjà (`frame.ts:203-204`, `poolAtomId` lit
`str(data.id)` pour `skills`). Il faut donc **parser `subskills`** : soit un mini-parseur skill
(`str(data.id)` + `toStringArray(data.subskills)`), soit lire à la volée dans `checkFrameRefs`.
Recommandation : petit helper `parseSkillRefs(md) → { id, subskills }` réutilisant `parseFrontmatter`.

### 3.4 Réservoir GUI — miroir des sous-skills (INC3)

Ajouter un **élément de réservoir `skill`** : `RESERVOIR_COMPOSITION.skill = ["skills"]` (le stock de
sous-skills candidates d'une skill = le pool `skills`). C'est le **miroir exact** de `team: ["personas"]` :
un élément expose son réservoir de sous-éléments **de même type**. `buildReservoir("skill", frame)` est
alors obtenu **sans nouveau code** (la fonction est générique). `ReservoirElement` gagne `"skill"` ;
`ReservoirPanel`/`useForgeReservoir` en héritent (le hook recharge déjà sur changement d'`element`).

> Les sous-skills **effectivement choisies** vivent dans `SKILL.md.subskills` (la composition) ; le
> réservoir montre le **stock disponible** (toutes les skills), exactement comme `team.personas`
> (choix) vs réservoir `team` (stock personas). Cohérence totale avec le modèle existant.

---

## 4. Périmètre exact des fichiers

### Inclus — méthode `~/work/iakaframe`
| Fichier | Action |
|---|---|
| `bindings/iakaframe-claude-default.md` | Ajouter `tools:` aux 8 `assignments` (valeurs §2.2). |
| `library/skills/iakaframe-init/SKILL.md` | Ajouter `subskills:` (§3.2). |
| `library/skills/iakaframe-update/SKILL.md` | Ajouter `subskills:`. |
| `library/skills/iakaframe-odin/SKILL.md` | Ajouter `subskills: [iakastart]`. |
| *(autres skills orchestratrices, si le décideur les liste)* | `subskills:` selon prose (§8). |
| `library/skills/README.md` | Documenter la relation `subskills` (1 §). |

### Inclus — cœur `~/work/iakaFrameGUI/packages/core`
| Fichier | Action |
|---|---|
| `src/binding.ts` | Doc `tools` élargie (§2.3) ; **code inchangé** (type + `parseTools` déjà là). |
| `src/frame.ts` | `FrameBinding` → assignments typés (T2/T4) ; `parseFrameBinding` conserve triplet ; `checkFrameRefs` : + `subskills⊆skills`, + persona→{roleKey,skills,guardrails} (T1), + workflow→roles (T5), + team.guardrails (T6) ; helper `parseSkillRefs`. |
| `src/reservoir.ts` | `ReservoirElement` += `"skill"` ; `RESERVOIR_COMPOSITION.skill = ["skills"]`. |
| `__tests__/{frame,reservoir,binding}.test.ts` | Cas : tools préservés au parse ; intégrité subskills/persona/workflow ; réservoir `skill`. |

### Inclus — forge GUI `~/work/iakaFrameGUI/src`
| Fichier | Action |
|---|---|
| `src/forge/ReservoirPanel.tsx` + `useForgeReservoir.ts` | Accepter l'élément `skill` (affichage stock sous-skills). Projection `tools` par persona dans la vue binding. |

### Exclu (hors périmètre — voir §6)
- **Générateur persona→contrat** (`adapters/claudeCode.ts` `renderAgent`) : n'émet PAS encore
  `tools:`. **Lot cause-racine séparé** — mais il DOIT consommer `tools` (articulation §2.6).
- Persona **multi-skills** (reste **une** skill-rôle) : non touché sauf arbitrage §8.
- Détection de **cycles profonds** de sous-skills ; **moteur** de chaînage/exécution des sous-skills.
- `vocab.json toolKinds` (axe MCP externe) : non modifié au MVP.
- `frames/releases/**` (gelées) : **aucune** écriture.

---

## 5. Critères d'acceptation (testables)

**Binding / tools**
- [ ] `grep -c 'tools:' bindings/iakaframe-claude-default.md` = 8 (un par assignment).
- [ ] Chaque `tools:` du binding **= exactement** le `tools:` du contrat déployé homonyme
      (`~/.claude/agents/<persona>.md`) — égalité ensembliste des 8.
- [ ] `parseFrameBinding` conserve le triplet : un test charge un binding avec
      `{personaId, runner, model, tools}` et vérifie `assignments[i].tools` non vide, `runner`/`model`
      préservés, `personaIds` toujours dérivé (non-régression de l'intégrité `binding→personaId`).
- [ ] **Non-régression** : `PersonaBinding`/`parseTools`/`defaultBindingForNode` inchangés
      fonctionnellement ; `cd packages/core && npm test` vert.

**Sous-skills**
- [ ] `grep -l 'subskills:' library/skills/iakaframe-init/SKILL.md library/skills/iakaframe-update/SKILL.md library/skills/iakaframe-odin/SKILL.md` = les 3.
- [ ] **Intégrité résout** : tout id de `subskills` ∈ pool `skills` (test frame avec un `subskills`
      pointant une skill absente → `integrity.ok === false` avec `source: "skill:<id>", field: "subskills"`).
- [ ] **Anti-self-ref** : une skill listant son propre id en `subskills` est signalée (ou refusée au parse).

**Réservoir GUI (miroir)**
- [ ] `buildReservoir("skill", frame).groups.map(g => g.type)` = `["skills"]` ; `ids` = tout le pool skills.
- [ ] `ReservoirElement` accepte `"skill"` ; `ReservoirPanel` l'affiche sans exception (frame vide → total 0).
- [ ] La vue binding **liste les `tools`** par persona (projection depuis `assembly.binding.assignments`).

**Intégrité élargie (trous audit)**
- [ ] `checkFrameRefs` signale désormais : persona→roleKey/skills/guardrails absents (T1),
      workflow→agentsRoleKeys absents (T5), team.guardrails absents (T6) — un test par trou.
- [ ] **Le canon réel passe l'intégrité** : `buildFrame` sur `~/work/iakaframe` (8 personas, skills,
      workflow, binding+tools) → `integrity.ok === true` (aucune régression sur des données saines).

**Global**
- [ ] `git status` ne montre **rien** sous `frames/releases/`.
- [ ] Aucune persona ne gagne `tools`/`runner`/`model` (pureté I3 préservée : `grep -rn 'runner\|model\|tools:' library/personas/*.md` = 0 hors corps narratif).

---

## 6. Hors périmètre — articulation avec le lot cause-racine

- **Générateur persona→contrat (lot séparé, recommandé juste après).** Il DOIT consommer `tools`
  (§2.6) : `toolsForPersona(binding, id)` miroir de `modelForPersona`, émission `tools:` conditionnelle
  (liste vide → ligne omise → héritage de tous les outils). **Tant qu'il n'est pas câblé, les tools du
  binding sont une donnée dormante** et les contrats continuent de dériver à la main (Lot 1, INC5).
  La présente instruction **prépare le terrain** (donnée + parseur + lisibilité) ; elle **ne clôt pas**
  la dérive à elle seule.
- Détection de **cycles profonds** de sous-skills ; **exécution/chaînage** effectif des sous-skills.
- Attache de **serveurs MCP par persona** (`toolKinds`/`connectors`), si un jour distincte de `tools`.

---

## 7. Faits vérifiés (traçabilité — chemin:ligne / URL)

- Binding markdown = `assignments{personaId,runner,model}` **sans tools** : `bindings/iakaframe-claude-default.md:7-15`.
- `PersonaBinding.tools` **déjà** dans le cœur + `parseTools` défensif : `packages/core/src/binding.ts:31-40,88-94,102-119`.
- SF2 `FrameBinding` **ampute** le triplet (garde `personaIds` seul) : `packages/core/src/frame.ts:107-112,213-227`.
- `checkFrameRefs` couvre **method/team/binding uniquement** (pas persona/*, pas workflow/*) : `packages/core/src/frame.ts:253-303`.
- `renderAgent` consomme `model` mais **pas `tools`** (« tools absent au MVP → hérite ») : `packages/core/src/adapters/claudeCode.ts:44-46,52-63,167-174`.
- Réservoir = 4 éléments / 11 types, **ni skill ni tools** : `packages/core/src/reservoir.ts:26-37`.
- SKILL.md = `id,name,description` **seulement**, **aucun** subskills/tools : `library/skills/iakaframe-cadrage/SKILL.md:1-5` ; skill.ts cœur = catalogue déclaratif, corps riche différé : `packages/core/src/skill.ts:6-18`.
- Composition **en prose** existante : `iakaframe-init` orchestre onboard+forgejo+docker+snapshot (`library/skills/iakaframe-init/SKILL.md:16-31`) ; forgejo « composant de l'orchestrateur d'amorçage » (`library/skills/iakaframe-forgejo/SKILL.md:4,68-72`) ; update appelle snapshot+forgejo (`library/skills/iakaframe-update/SKILL.md:30-39,52`).
- Namespace incohérent : `toolKinds:["comfyui-local"]` (`packages/core/src/vocab.json:8`) vs built-ins des contrats déployés (`~/.claude/agents/gandalf.md` `tools: Read, Grep, Glob, Write, Edit, WebSearch, WebFetch`).
- Tools réels des 8 contrats déployés (défauts §2.2), vérifiés `~/.claude/agents/*.md:` (frontmatter `tools:`), 2026-07-19.
- Persona pure (aucun runner/model) : `packages/core/src/persona.ts:19-34,90-99` ; template `library/personas/_TEMPLATE.md:12-14`.
- **Claude Code — champ `tools`** : allowlist de noms d'outils séparés par virgule ; **omis → hérite de tous les outils** ; si aucune entrée ne résout à un outil → l'agent **échoue au lancement** ; denylist via `disallowedTools`. Source docs officielles (vérifié 2026-07-19).

---

## 8. Points que SEUL le décideur tranche

1. **Persona multi-skills ?** Recommandation Gandalf : **NON** — une persona reste **une** skill-rôle ;
   la richesse vient des **sous-skills de la skill**, pas d'un persona multi-skills. Le champ
   `persona.skills[]` (array) reste, mais la convention « une skill-rôle » tient. → confirmer.
2. **Où vivent les sous-skills ?** Recommandation : **`SKILL.md.subskills`** (colocalisé, source unique),
   **pas** de registre central. → confirmer.
3. **Sémantique / namespace de `tools`** : **allowlist runner-scoped** (built-ins Claude pour
   `claude-code`), en **réutilisant** `PersonaBinding.tools` — OU champ séparé pour distinguer des
   `toolKinds` MCP. Recommandation : réutiliser `tools`, garder `connectors` pour le MCP. → trancher.
4. **Défaut des tools** : **encoder l'existant least-privilege** (valeurs déployées §2.2) plutôt que
   « liste vide = hérite tout ». Recommandation : least-privilege par défaut. → confirmer.
5. **Projection des tools dans le réservoir** : **facette du binding** (recommandé) vs 12ᵉ groupe de
   `buildReservoir`. Recommandation : facette du binding (ne pas polluer les 11 types). → confirmer.
6. **Périmètre des skills à décomposer maintenant** : les **3** citées (init/update/odin) au MVP, ou
   étendre (ex. forgejo→? , log-conversation→?). → lister.
7. **Combler T1/T5/T6 (intégrité persona/workflow/team.guardrails) dans CE lot** ou en lot d'hygiène
   séparé ? Recommandation : **dans ce lot** (bas coût, cohérent avec l'audit). → confirmer.

Sources externes : [Claude Code — Create custom subagents](https://code.claude.com/docs/en/sub-agents)
(champ `tools`, héritage si omis, `disallowedTools`).

---

## 9. Jalon (gate humain)

```
      _   _    _     ___  _   _
     | | / \  | |   / _ \| \ | |
  _  | |/ _ \ | |  | | | |  \| |
 | |_| / ___ \| |__| |_| | |\  |
  \___/_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `modele-composition-tools-sousskills.md` : **audit du graphe** (noyau résolu + 6 trous T1–T6 + 5 incohérences méthode↔GUI) ; **cadrage A** (tools dans binding : schéma markdown, défaut = contrats déployés, `FrameBinding` dé-amputé, projection GUI, articulation générateur) ; **cadrage B** (sous-skills : `SKILL.md.subskills`, intégrité `⊆skills`, réservoir `skill←skills` miroir) ; critères testables ; **7 arbitrages décideur** | 🟢 Le décideur (Stéphane) → tranche §8 → valide → dispatch **Gimli** (méthode + cœur + GUI) |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Triplet amputé : `packages/core/src/frame.ts:107-112,213-227` (SF2) ; type prêt `packages/core/src/binding.ts:31-40,88-94`.
- Générateur host-only : `packages/core/src/adapters/claudeCode.ts:44-46,167-174`.
- Intégrité partielle : `packages/core/src/frame.ts:253-303`.
- Réservoir 4 éléments : `packages/core/src/reservoir.ts:26-37`.
- Binding markdown : `bindings/iakaframe-claude-default.md:7-15`.
- Composition en prose (sous-skills) : `library/skills/iakaframe-init/SKILL.md:16-31`, `iakaframe-update/SKILL.md:30-39`.
- Namespace : `packages/core/src/vocab.json:8` vs `~/.claude/agents/gandalf.md` (frontmatter `tools:`).

**Points à trancher au gate (délégués au décideur)** : les **7** de §8 (persona mono/multi-skill ;
lieu des sous-skills ; sémantique `tools` ; défaut least-privilege ; projection réservoir ; skills à
décomposer ; intégrité T1/T5/T6 dans ce lot).

---

## Statut

**EN ATTENTE DE VALIDATION** — 7 arbitrages §8. À « JALON VALIDÉ » (+ arbitrages tranchés) → dispatch
**Gimli** pour appliquer §4 en passant tous les critères §5, sans toucher `frames/releases/**`, sans
altérer la pureté des personas (I3), et **sans** construire le générateur persona→contrat (lot séparé
§6, qui devra consommer `tools`).
</content>
</invoke>
