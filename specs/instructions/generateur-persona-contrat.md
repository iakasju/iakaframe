# Instruction — Générateur persona→contrat (fix de cause racine de la dérive déployé↔source)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (CLI `cli/` + méthode `library/`).
> Statut en fin de doc. Chantier « critique des agents » — **lot cause-racine** (suite du Lot 1).
> Réf. code : `cli/src/lib/agents.js:67-90` (`listPersonas`/`affectPersona`), `cli/src/lib/library.js:15,84,134`
> (`COLLECTIONS`/`scan`/`readEntry`), `cli/src/lib/frontmatter.js:186,217,226` (`parseFrontmatter`/
> `renderFlowList`/`buildDocument`), `cli/src/commands/agents.js:29-72`, `install.mjs:348` (planner
> `Agents`), `bindings/iakaframe-claude-default.md:7-15`.
> Réf. cadrage antérieur : `specs/instructions/lot1-rafraichissement-contrats-agents.md` (§1 topologie
> 4 couches, §9.1 « lot suivant recommandé »), `specs/instructions/modele-composition-tools-sousskills.md`
> (§2.2/§2.6 `tools` dans le binding + `toolsForPersona`), `specs/instructions/reconcilier-kit-source-frame.md`.
> **Dépendance d'ordonnancement** : ce lot vient **APRÈS** le merge de `modele-composition-tools-sousskills.md`
> (voir §7).

---

## 0. Besoin (reformulé)

Il n'existe **aucun générateur** qui produise les contrats déployés `~/.claude/agents/<id>.md` à
partir de la source canon `library/personas/<id>.md`. Les 8 contrats déployés sont **entretenus à la
main** (c'est ce que le Lot 1 vient de resynchroniser manuellement). **Sans générateur câblé, la dérive
reviendra** dès la prochaine évolution d'une persona.

Objectif (MVP) : un **générateur pur** qui, pour chaque persona, **émet un contrat Claude Code valide**
= **frontmatter transformé** (persona → `name`/`description`/`tools`/`guardrails`) + **corps de rôle
copié verbatim**, et qui **remplace la copie brute cassée** de `affectPersona`. Régénérer devient
**idempotent** et **reproduit** (ne défait pas) le resync du Lot 1.

---

## 1. Cartographie vérifiée (cause racine confirmée)

### 1.1 Les deux fonctions de `agents.js` lisent un dossier MORT

| Fonction | Ligne | Lit | État |
|---|---|---|---|
| `listPersonas()` | `cli/src/lib/agents.js:67-72` | `path.join(root, 'agents')` | **dossier inexistant** → renvoie `[]`. Le rangement pluriel a migré les personas vers `library/personas/` ; `agents.js` **n'a pas suivi**. |
| `affectPersona()` | `cli/src/lib/agents.js:80-90` | `path.join(root, 'agents', '<name>.md')` puis `fs.copyFileSync` (ligne 90) | **dossier inexistant** + **copie brute** : recopie le frontmatter persona (`id,roleKey,royaume,pastille,skills,guardrails,vignette`), alors que Claude Code attend `name,description,tools`. |

> **Confirmé empiriquement** : `agents/` **n'existe pas** à la racine (glob `agents/*.md` = ∅) ; la
> source de vérité est `library/personas/*.md` (8 fichiers), déclarée par `cli/src/lib/library.js:15`
> (`COLLECTIONS`, `dir: 'library/personas'`).

### 1.2 Les 4 couches (rappel Lot 1 §1) et les voies de déploiement

| # | Couche | Chemin | Frontmatter | Qui écrit |
|---|---|---|---|---|
| 1 | **Canon source** | `library/personas/*.md` (8) | riche (`id,name,roleKey,royaume,pastille,skills,guardrails,vignette`) — **pas de `description`** | l'humain / le cadrage |
| 2 | **Déployé (live)** | `~/.claude/agents/*.md` (8) | Claude Code (`name,description,tools,guardrails`) | **à la main** (aucun générateur) |
| 3 | **Kit (live)** | `kits/iakaframe-claude/.claude/` | `commands/` + `settings.local.json`, **PAS** de `agents/` | vide **par design** (`reconcilier-kit-source-frame.md:103`) |
| 4 | **Frame (gelée)** | `frames/releases/StefFrame{1,2}/…/.claude/agents/*.md` | Claude Code déparamétré (`<IAKAFRAME_HOME>`) | build de frame **uniquement** — **NE PAS toucher** |

**Voies de déploiement, toutes cassées ou vides pour les agents :**
- `install.mjs:348` a un planner `Agents` (`planNamedSet(state,'Agents','.claude/agents','agents',…)`)
  mais il lit `kits/iakaframe-claude/.claude/agents/` qui **n'existe pas** → **0 agent posé**.
- `affectPersona`/`fullteam` (`cli/src/lib/agents.js:80,125`) est la voie « live » historique, mais elle
  lit le dossier mort **et** fait une copie brute → **contrat invalide** si elle trouvait quoi que ce soit.

> **Cause racine confirmée** (hypothèse du décideur validée) : le **seul** rendu correct (transform
> frontmatter) vit dans le **build de frame** (couche 4, gelée) ; **aucun** rendu ne s'exécute au
> déploiement live. Le déployé ne peut donc que **dériver à la main**.

### 1.3 Ce que le générateur doit produire (transform vérifiée, ex. gandalf)

| Champ contrat déployé | Source | Transformation |
|---|---|---|
| `name: gandalf` | `persona.id` | tel quel (lowercase, `[a-z-]` — conforme CC, vérifié §6) |
| `description: Architecte-cadreur…` | **absente de la persona** — n'existe QUE dans le déployé | **point structurant** → voir §2.3 |
| `tools: Read, Grep, Glob, Write, Edit, WebSearch, WebFetch` | `binding.assignments[].tools` | `toolsForPersona(binding,id)` joint par `", "` (voir §2.4) |
| `guardrails: [identity, perimeter]` | `persona.guardrails` | passthrough **flow-list** (vérifié : odin = `[identity, perimeter, delegation]` des deux côtés) |
| **corps** (`# 🧙 Gandalf …` → fin) | `persona.body` | **copié VERBATIM** — vérifié byte-à-byte identique persona↔déployé (gandalf, loki, odin) |

---

## 2. Conception du générateur

### 2.1 Où il vit (recommandation)

Un **nouveau module pur** `cli/src/lib/generate-agents.js`, exposant :

- `renderAgentContract({ id, description, tools, guardrails, body }) → string` — **PUR**, sans I/O :
  assemble le contrat Claude Code (frontmatter + corps). Testable en isolation, verrouillable par golden.
- `toolsForPersona(binding, personaId) → string[]` — miroir de `modelForPersona` (lot composition,
  cf. `modele-composition-tools-sousskills.md:208`) : lit `bindingRows(binding.data)` (`library.js:203`),
  renvoie le `tools` de l'assignment homonyme, `[]` si absent.
- `generateAgent(id, { root, binding }) → string` — lit `readEntry('personas', id, root)` (`library.js:134`),
  résout `description`/`guardrails` (persona) + `tools` (binding), délègue à `renderAgentContract`.
- `generateAll({ root, binding }) → Map<id,string>` — sur `scan('personas', root)` (`library.js:84`).

**Rewiring (le fix durable)** — deux gestes couplés :
1. **`listPersonas()`** (`agents.js:67-72`) : lire `scan('personas', libraryRoot())` au lieu du dossier mort.
2. **`affectPersona()`** (`agents.js:80-90`) : **remplacer `fs.copyFileSync`** par
   `fs.writeFileSync(dst, generateAgent(name, {root, binding}))`. La cible de déploiement (`<target>/.claude/agents/`)
   et la mécanique de scope (`--global` / `--project`) **restent inchangées** — on ne change QUE le
   *rendu* (copie brute → génération). C'est le point qui **réutilise l'existant** au maximum.

### 2.2 Verbe CLI dédié (recommandé, en plus du rewiring)

Ajouter une action `generate` à `cli/src/commands/agents.js` (switch ligne 29) :
`iakaframe agents generate [--project <p> | --global] [--check]`.
- sans `--check` : **écrit** les 8 contrats (rendu = même moteur que `affectPersona`).
- `--check` : **n'écrit rien**, compare le rendu à l'existant, sort **non-zéro** si divergence — c'est
  le **filet anti-dérive** exécutable en CI/`node --test` (garantit que déployé == source).

### 2.3 `description` : d'où vient-elle ? (LE point structurant)

La `description` (riche, orientée « quand déléguer », ex. « Odin est le CTO du portefeuille… »)
**n'est ni dans la persona ni identique à la skill** (la skill `iakaframe-cadrage` dit « Transforme un
besoin… » ; le déployé gandalf dit « Architecte-cadreur… À déclencher dès qu'un besoin… »). Elle a été
**écrite à la main** dans le déployé et **préservée** au Lot 1 (`lot1:64` « préservant leur frontmatter
Claude Code »).

**Recommandation : ajouter un champ `description:` au frontmatter des personas** (`library/personas/*.md`),
**amorcé verbatim** depuis les descriptions déployées actuelles (post-Lot 1). Justification :
- la `description` est une **métadonnée d'identité de la persona** (ce que fait l'agent / quand le
  déclencher), **pas** une facette d'exécution → **I3 préservé** (on n'ajoute PAS `runner`/`model`/`tools`
  à la persona ; ceux-là restent dans le binding).
- c'est la **seule** voie qui rend la génération **idempotente ET fidèle au Lot 1** (§5).

> Cet amorçage est une **migration ponctuelle** (8 champs ajoutés une fois), **pas** un geste du
> générateur au runtime. Le générateur **lit** `persona.description` ; il n'écrit jamais dans les personas.

**Alternatives écartées** : (a) *dériver de la skill* → produit un texte **différent** du déployé →
**casse l'anti-régression** ; (b) *table codée en dur dans le code CLI* → **dédouble** la source de
vérité et redérive. → champ persona retenu.

### 2.4 `tools` : résolution depuis le BINDING (dépendance forte, pureté I3)

`tools` est une **facette d'exécution** → elle vit **dans le binding**, jamais dans la persona
(`modele-composition-tools-sousskills.md:136-141`). Le générateur résout via
`toolsForPersona(binding, id)` (§2.1) et **émet la ligne `tools:` SSI la liste est non vide** :

- liste non vide → `tools: <items joints par ", ">` — **scalaire virgule**, PAS une flow-list `[…]`
  (forme réelle des déployés + de l'exemple docs CC `tools: Read, Grep, Glob`). ⚠️ **ne pas** passer
  `tools` par `renderFlowList` (`frontmatter.js:217`) qui produirait `[Read, Grep]`.
- liste vide → **ligne omise** → `tools` absent → **héritage de TOUS les outils** (docs CC, vérifié §6).

**Défaut du binding = les tools réels déployés** (least-privilege déjà en place ;
`modele-composition-tools-sousskills.md:159-161`). Le générateur **consomme** cette donnée ; il ne la
choisit pas.

### 2.5 Assemblage & idempotence

- **Frontmatter** émis dans un **ordre fixe** : `name`, `description`, `tools` (si présent), `guardrails`.
  Réutiliser `buildDocument`/`renderScalar`/`renderFlowList` (`frontmatter.js:226,212,217`) pour
  `name`/`description`/`guardrails` ; émettre `tools` **à la main** (§2.4).
- **Corps** : `persona.body` **copié verbatim**, sans reformatage (déjà identique au déployé).
- **Déterminisme** : même (persona, binding) → **même octet**. Régénérer deux fois → `git diff` **vide**.
- `guardrails` inerte (non listé par CC) mais **toléré** (frontmatter hors-liste ignoré, vérifié §6) —
  posé pour l'enforcement par hook (lot séparé).

---

## 3. Frontière (ce que le générateur écrit / ne touche pas)

- **Écrit** : la couche **2** (déployé) via `affectPersona`/`agents generate` → `<target>/.claude/agents/<id>.md`
  (`~/.claude` en `--global` pour odin/chapeau ; `<projet>/.claude` sinon). Scope inchangé.
- **Ne régénère PAS** : la couche **4** (frames gelées `frames/releases/**`) — snapshot figé, build de frame only.
- **Ne touche PAS** les **personas source** : il les **LIT** (`readEntry`). Seule exception : la migration
  **ponctuelle** d'amorçage de `description` (§2.3), hors runtime du générateur.
- **Couche 3 (kit-live)** : reste **vide par design** dans la voie recommandée (§4). Décision alternative
  ci-dessous.

---

## 4. Cible d'écriture — décision (deux voies)

- **Voie A (recommandée, MVP) — rendu direct au déploiement.** `affectPersona` **génère** vers
  `<target>/.claude/agents/` (comme aujourd'hui, mais rendu au lieu de copie). **Respecte** la couche 3
  vide par design ; **réutilise** toute la mécanique de scope existante ; zéro nouveau chemin. `install.mjs`
  reste orthogonal (il pose commands/hooks/skills ; les agents passent par `affectPersona`/`fullteam`).
- **Voie B (alternative) — générer dans le kit.** Écrire `kits/iakaframe-claude/.claude/agents/<id>.md`
  (remplit le slot que `install.mjs:348` lit déjà) → déploiement par `install.mjs`. **Change** la décision
  « kit lean par design » (couche 3) et fait du kit un **artefact généré** versionné (diffs visibles en git).
  Plus lourd ; à retenir seulement si le décideur veut que `install.mjs` (multi-host) porte aussi les agents.

→ **Recommandation : Voie A.** (Décision décideur, §8.)

---

## 5. Anti-régression du resync Lot 1 (critère clé)

Régénérer depuis les personas **actuelles** (post-Lot 1) doit **redonner** des contrats **équivalents**
aux déployés qu'on vient de poser à la main — sinon la génération **perdrait** le rapatriement Loki
(Expertise + Atelier), la posture CTO d'Odin, la RQV de Legolas, etc.

C'est **garanti par construction** car :
- le **corps** est copié verbatim de la persona, et les personas **contiennent déjà** ces sections
  (Lot 1 a rapatrié Loki **dans la persona** et corrigé les 8 personas) ;
- `guardrails` et (après §2.3) `description` sont **lus de la persona** ;
- `tools` est **lu du binding**, dont le défaut **encode l'existant déployé** (`modele-composition:159`).

→ La génération est donc une **projection fidèle** de la couche 1 (+ binding), pas une réécriture.

---

## 6. Faits vérifiés (traçabilité — chemin:ligne / URL)

- Source de vérité personas = `library/personas/` (8) : `cli/src/lib/library.js:15` ; `agents/*.md` **inexistant** (glob = ∅).
- `listPersonas`/`affectPersona` lisent `<root>/agents/` (mort) + copie brute : `cli/src/lib/agents.js:67-72,83,90`.
- Kit-live sans `.claude/agents/` (design) : glob `kits/iakaframe-claude/.claude/**` (commands + settings seuls) ; `reconcilier-kit-source-frame.md:103`.
- `install.mjs` planner `Agents` lit `kits/iakaframe-claude/.claude/agents/` (vide) : `install.mjs:348`.
- Persona **sans** `description` ; déployé **avec** `description/tools/guardrails` : `library/personas/gandalf.md:1-10` vs `~/.claude/agents/gandalf.md:1-6`.
- Corps **verbatim** persona↔déployé : `library/personas/gandalf.md:12-66` ≡ `~/.claude/agents/gandalf.md:8-62` (idem loki, odin).
- `guardrails` passthrough : odin `[identity, perimeter, delegation]` des deux côtés (`library/personas/odin.md:8`, `~/.claude/agents/odin.md:5`).
- `tools` déployé = **scalaire virgule**, pas flow-list : `~/.claude/agents/gandalf.md:4`.
- Binding porte `runner`+`model`, **`tools` en cours d'ajout** : `bindings/iakaframe-claude-default.md:7-15` ; `toolsForPersona` = miroir de `modelForPersona` planifié : `modele-composition-tools-sousskills.md:208,340`.
- Sérialiseur canonique réutilisable : `cli/src/lib/frontmatter.js:186,217,226`.
- **Claude Code — frontmatter subagent** (vérifié 2026-07-19, docs officielles) :
  - **seuls `name` et `description` sont requis** ; `name` = identifiant lowercase + tirets.
  - `tools` **omis → hérite de TOUS les outils** ; si **aucune** entrée ne résout à un outil → l'agent
    **échoue au lancement** ; format **liste séparée par virgules** (ex. `tools: Read, Grep, Glob`).
  - `model` supporté (`opus`/`sonnet`/`haiku`/… ; défaut `inherit`) — **non émis** au MVP (voir §8).
  - champs **hors-liste tolérés** (frontmatter non reconnu ignoré) → `guardrails` inerte accepté.

---

## 7. Ordonnancement (IMPÉRATIF)

1. **APRÈS** le merge de `modele-composition-tools-sousskills.md` — le binding porte alors `tools` par
   persona et le parseur les lit (prérequis de `toolsForPersona`). **Tant que ce merge n'est pas fait**,
   `toolsForPersona` renverrait `[]` pour tous → le générateur **omettrait** `tools` → les contrats
   **perdraient** leur least-privilege (régression vs déployé). → **ne pas implémenter avant.**
2. **Migration ponctuelle** : amorcer `description:` dans les 8 `library/personas/*.md` (verbatim déployé
   post-Lot 1). Vérifier I3 : aucune persona ne gagne `runner`/`model`/`tools`.
3. **Générateur** : `cli/src/lib/generate-agents.js` + rewiring `agents.js` (`listPersonas`/`affectPersona`)
   + verbe `agents generate [--check]`.
4. **Vérifier §9** : `agents generate --check` == déployé actuel (diff sémantique nul), `node --test` vert,
   frames intactes.

---

## 8. Points que SEUL le décideur tranche

1. **Verbe CLI dédié vs rewiring seul** : recommandation = **les deux** (rewiring de `affectPersona` pour
   le fix durable + `agents generate --check` pour le filet anti-dérive CI). → confirmer.
2. **Cible d'écriture** : **Voie A** (rendu direct au déploiement, kit lean préservé — recommandé) **vs
   Voie B** (générer dans le kit, `install.mjs` déploie). → trancher (§4).
3. **`description` = nouveau champ persona** (recommandé, amorcé verbatim du déployé) vs dérivée de la
   skill vs table codée. → confirmer.
4. **Émettre `model:` aussi ?** Le binding porte `model` par persona (`modelForPersona`) et CC supporte
   `model:`. Les déployés actuels **n'ont pas** de ligne `model` (héritent). Recommandation MVP : **ne pas
   l'émettre** (anti-régression + simplicité) ; l'ajouter serait un incrément trivial ultérieur. → confirmer.
5. **Unification avec le cœur GUI** : `renderAgent` (`packages/core/src/adapters/claudeCode.ts`, dépôt
   `~/work/iakaFrameGUI`) est un **générateur parallèle** (TS, pour le build de frame) qui consomme déjà
   `modelForPersona`. Recommandation : garder le générateur CLI **miroir fidèle** (mêmes règles) et le
   **verrouiller par un golden partagé** (même patron que `cli/test/parity-kit.test.js` / `frontmatter.js`
   ↔ `frontmatter.ts`) ; **unification complète hors périmètre**. → confirmer.

---

## 9. Critères d'acceptation (testables)

- [ ] **Un contrat par persona** : `agents generate` produit **8** fichiers `<id>.md` (odin…nathalie),
      un par `scan('personas', root)`.
- [ ] **Frontmatter valide** : chaque contrat a `name` (== id, lowercase `[a-z-]+`), `description`
      **non vide**, `guardrails` == valeur de la persona homonyme ; `tools` présent **ssi** non vide.
- [ ] **`tools` == binding** : pour chaque persona, `tools` généré (ensemble) == `toolsForPersona(binding,id)`
      == `tools:` du déployé homonyme (les 3 coïncident). Émis **scalaire virgule** (pas `[…]`).
- [ ] **`tools` vide → ligne omise** : un binding sans `tools` pour une persona ⇒ contrat **sans** ligne
      `tools:` (héritage de tous les outils) — test unitaire de `renderAgentContract`.
- [ ] **Corps verbatim** : `body` du contrat == `body` de la persona (aucune reformulation).
- [ ] **Anti-régression Lot 1** : régénérer les **8** == **équivalent** au déployé actuel post-Lot 1
      (`agents generate --check` ⇒ **diff sémantique nul** : mêmes champs/valeurs + même corps ; en
      particulier Loki Expertise+Atelier, Odin CTO, Legolas RQV présents).
- [ ] **Idempotence** : lancer `agents generate` deux fois de suite ⇒ **aucun** changement (`git diff`
      des cibles = vide).
- [ ] **Personas intactes** : `git diff library/personas/` **vide** après `agents generate` (le générateur
      lit, n'écrit jamais les personas).
- [ ] **Frames intactes** : `git status` ne montre **rien** sous `frames/releases/`.
- [ ] **`listPersonas` réparé** : renvoie les 8 personas (plus `[]`) ; `agents list`/`fullteam` fonctionnent.
- [ ] **Pureté I3** : `grep -rnE 'runner:|model:|tools:' library/personas/*.md` = **0** (hors corps narratif) —
      seul `description:` a été ajouté au frontmatter.
- [ ] **Suite verte** : `cd cli && node --test` (npm test) vert, incluant les nouveaux tests
      (`renderAgentContract`, `toolsForPersona`, `agents generate --check`).

---

## 10. Hors périmètre

- **Enforcement réel des `guardrails`** par hook (le champ reste inerte) — lot séparé (Lot 1 §9.2).
- **Régénération des frames gelées** `StefFrame1/2` — au prochain build de frame uniquement.
- **Unification** du générateur CLI avec le cœur GUI `renderAgent` (au-delà d'un golden de parité).
- **Émission `model:`** / autres champs CC (`skills`, `color`, `permissionMode`) — incréments ultérieurs.
- **`install.mjs`** portant les agents (sauf si Voie B tranchée §8.2).

---

## 11. Jalon (gate humain)

```
   ___    _    _     ___  _   _
  |_ _|  / \  | |   / _ \| \ | |
   | |  / _ \ | |  | | | |  \| |
   | | / ___ \| |__| |_| | |\  |
  |___/_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `generateur-persona-contrat.md` : cause racine confirmée (`agents.js:67-90` lit un dossier mort + copie brute) ; générateur pur `renderAgentContract` + `toolsForPersona` + rewiring `affectPersona`/`listPersonas` + verbe `agents generate --check` ; `description` = nouveau champ persona (amorcé verbatim) ; `tools` résolu du **binding** (dépendance lot composition) ; **Voie A** (rendu direct, kit lean) recommandée ; idempotence + anti-régression Lot 1 ; critères testables ; **5 arbitrages** ; **ordonnancement APRÈS le lot composition** | 🟢 Le décideur (Stéphane) → tranche §8 → valide → dispatch **Gimli** (après merge composition) |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Cause racine : `cli/src/lib/agents.js:67-72` (`listPersonas` dossier mort), `:80-90` (`affectPersona` copie brute), `install.mjs:348` (planner agents lit un kit vide).
- Cible de rendu : `cli/src/lib/library.js:84,134` (`scan`/`readEntry`), `cli/src/lib/frontmatter.js:217,226` (`renderFlowList`/`buildDocument`).
- Transform à reproduire : `library/personas/gandalf.md:1-10` (source) → `~/.claude/agents/gandalf.md:1-6` (cible) ; corps verbatim `library/personas/gandalf.md:12-66`.
- Dépendance tools : `bindings/iakaframe-claude-default.md:7-15` ; `modele-composition-tools-sousskills.md:159-161,205-212`.

**Points à trancher au gate (délégués au décideur)** : §8.1 (verbe + rewiring), §8.2 (Voie A vs B),
§8.3 (`description` = champ persona), §8.4 (émettre `model:`), §8.5 (unification core GUI).

Sources externes : [Claude Code — Create custom subagents](https://code.claude.com/docs/en/sub-agents)
(frontmatter : `name`/`description` requis ; `tools` omis → hérite de tous ; format virgule ; champs
hors-liste tolérés) — vérifié 2026-07-19.

---

## Statut

**EN ATTENTE DE VALIDATION** — cadrage fermé. **Bloqué en ordonnancement** derrière le merge de
`modele-composition-tools-sousskills.md` (§7). À « JALON VALIDÉ » (+ arbitrages §8 tranchés, + lot
composition mergé) → dispatch **Gimli** pour implémenter §2 en passant tous les critères §9, sans
toucher `frames/releases/**` ni écrire dans les personas (hors migration §2.3).
