# Instruction — Parité des deux générateurs de contrat d'agent (golden de parité CLI ↔ GUI)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (CLI `iakaframe/cli/` + cœur `iakaFrameGUI/packages/core/`).
> Décision décideur (Odin) : **garder les DEUX générateurs**, un **test golden de parité** garantit
> qu'ils produisent le **même contrat déployé** pour une persona donnée. Aujourd'hui indépendants → dérive garantie.
> MVP, ne code rien dans cette phase : ceci ferme le périmètre + les critères d'acceptation.
>
> **Réf. code CLI** : `iakaframe/cli/src/lib/generate-agents.js:54-65` (`renderAgentContract`),
> `:42-48` (`toolsForPersona`), `:26-36` (`verbatimBody`), `:68-80` (`generateAgent`) ;
> `iakaframe/cli/src/lib/frontmatter.js:226-233` (`buildDocument`), `:212-222` (`renderScalar`/`renderFlowList`) ;
> `iakaframe/bindings/iakaframe-claude-default.md:7-15` (assignments + `tools`) ;
> `iakaframe/library/personas/gandalf.md:1-11` (canon : `description`, `guardrails`, corps verbatim) ;
> test existant `iakaframe/cli/test/generate-agents.test.js` (golden CLI déjà posé).
> **Réf. code GUI** : `iakaFrameGUI/packages/core/src/adapters/claudeCode.ts:52-78` (`renderAgent`),
> `:162-199` (`generateClaudeCodeKit`) ; `iakaFrameGUI/packages/core/src/persona.ts:19-34` (modèle `Persona`) ;
> `iakaFrameGUI/packages/core/src/binding.ts:30-45,199-206` (`PersonaBinding.tools`, `modelForPersona`) ;
> test existant `iakaFrameGUI/packages/core/__tests__/adapters.test.ts:77-85` (frontmatter GUI actuel).
> **Réf. précédent de parité** : `iakaframe/cli/test/parity-kit.test.js:1-30` (golden dupliqué CLI↔cœur DÉJÀ en place pour le kit).
> **Réf. cadrage antérieur** : `specs/instructions/generateur-persona-contrat.md`, `specs/instructions/parite-enforcement-multirunner.md`.

---

## 0. Besoin (reformulé)

Deux fonctions rendent un contrat d'agent Claude Code, dans deux dépôts, **sans aucun lien** :

- **CLI** — `renderAgentContract` (`generate-agents.js:54`) : **projette le canon** `library/personas/<id>.md`
  (couche 1) + `tools` du binding (couche 2) → le contrat **réellement déployé** `~/.claude/agents/<id>.md`.
  Vient d'être **gaté** (v0.17.10, test golden + anti-régression Lot 1).
- **GUI** — `renderAgent` (`claudeCode.ts:52`) : **synthétise** un contrat depuis une **Team PURE** en mémoire
  (personas fines, sans corps ni description), pour la forge iakaFrameGUI.

Ils **ne produisent PAS le même fichier** (cf. §1). Sans garde, la forge GUI déploierait un contrat **différent** de
celui du CLI pour la **même persona** → régression silencieuse des agents live. Objectif : un **golden de parité** qui
**casse le build des deux côtés** dès qu'un rendu s'écarte du contrat de référence, pour les **8 personas**.

---

## 1. Constat de divergence (vérifié, fichier:ligne)

Les deux générateurs divergent **radicalement** — ce n'est pas un écart de formatage, ce sont deux philosophies de rendu.

### 1.1 Frontmatter — champ par champ

| Champ | CLI `renderAgentContract` (`generate-agents.js`) | GUI `renderAgent` (`claudeCode.ts`) | Divergence |
|---|---|---|---|
| **ordre** | `name, description, tools?, guardrails` (`:56-63`) | `name, description, model?` (`:61-64`) | **Ordre + jeu de champs différents** |
| **`name`** | **id** slug (`{ value: id }`, `:57`) → `name: gandalf` | **nom d'affichage** (`name: ${p.name}`, `:62`) → `name: Gandalf` | **Valeur différente** (slug vs display) |
| **`description`** | **canon verbatim** (`data.description`, `:73-76`) — phrase riche du persona | **gabarit synthétisé** (`Persona incarnant le rôle « … ». À solliciter pour…`, `:63`) | **Contenu entièrement différent** |
| **`tools`** | **émis** depuis le binding, scalaire-virgule, **omis si vide** (`:59-61`) | **absent** (jamais émis) | **Présent CLI / absent GUI** |
| **`guardrails`** | **émis** en flow-list (`[identity, perimeter]`, `:62`) | **absent** (jamais émis) | **Présent CLI / absent GUI** |
| **`model`** | **jamais émis** (hors périmètre du contrat) | **émis si binding non vide** (`modelLine`, `:60`) | **Absent CLI / conditionnel GUI** |

### 1.2 Corps

| | CLI | GUI |
|---|---|---|
| Source | **corps VERBATIM du canon** (`verbatimBody(raw)`, `generate-agents.js:26-36,78`) — rôle complet, ligne blanche de tête préservée | **stub synthétisé** (`claudeCode.ts:65-77`) : `# {name} — rôle {role}` + Pastille + Périmètre générique + « Skills attachées » |

Le corps CLI d'un agent fait ~60 lignes (mission, périmètre, gate, identité…) ; le corps GUI fait ~12 lignes de gabarit. **Aucune parité possible sans aligner la source du corps.**

### 1.3 Cause racine : les deux générateurs n'ont pas le même INTRANT

| | CLI | GUI |
|---|---|---|
| Intrant persona | lit le **fichier canon `library/personas/<id>.md`** (frontmatter riche + corps) | travaille sur une **`Persona` pure** en mémoire (`persona.ts:19-34`) : `id, name, roleKey, royaume, roleIndex, skills, guardrails` — **NI `description`, NI `tools`, NI corps** |
| Intrant binding | `.md` frontmatter `assignments:` avec `tools` (`bindingRows` converge `assignments\|bindings`) | JSON `bindings[]` (`binding.ts:131-155`) ; `PersonaBinding.tools` **existe** (`:44`) mais **`renderAgent` ne lit que `model`** (`:52,60`), jamais `tools` |

> **Point dur** : le modèle `Persona` de la GUI est **plus pauvre que le canon** — il ne porte ni la
> `description`, ni le corps de rôle. En l'état, la GUI **ne PEUT PAS** reproduire le contrat CLI. La
> parité exige donc que la GUI **charge / porte** la `description` + le corps verbatim du canon (voir §4).
> C'est le vrai coût du chantier, à assumer explicitement.

---

## 2. Référence retenue : **le CLI**

Le contrat produit par le **CLI** est la **référence** (le golden), pour trois raisons vérifiables :

1. **Il produit le fichier réellement déployé** `~/.claude/agents/<id>.md` (le CLI est le chemin de déploiement live).
2. **Il vient d'être gaté et prouvé anti-régression** (`cli/test/generate-agents.test.js` : golden pur + `name==id`, `description` non vide, `guardrails==persona`, `tools==binding`, corps verbatim, idempotence).
3. **Il projette le canon sans rien inventer** (`description`/`guardrails` viennent de la persona, `tools` du binding — least-privilege réel), là où le stub GUI est **lossy** (perd la description réelle, les tools, les guardrails et le corps).

→ **Le golden = la sortie du CLI `renderAgentContract` pour les 8 personas + le binding défaut.** La GUI **converge vers ce golden**.

---

## 3. Conception du golden de parité

### 3.1 Décision structurante — golden **dupliqué** (MVP), pas source partagée

Deux options ont été pesées :

| Option | Description | Verdict |
|---|---|---|
| **A. Golden dupliqué** (retenu) | Une copie du golden (8 contrats attendus) **committée dans chaque dépôt** ; chaque dépôt teste `son_rendu == son_golden` ; un en-tête de provenance + hash garde les copies alignées. | **Retenu — MVP.** Suit **exactement le précédent déjà en place** (`cli/test/parity-kit.test.js:1-5` : golden `kit.iakaframe-claude.golden.md` « calqué sur » la fixture du cœur GUI). Zéro outillage cross-repo, zéro submodule. |
| B. Source partagée | Un paquet/submodule de fixtures consommé par les deux dépôts. | **Rejeté au MVP** : les deux dépôts sont indépendants (pas de monorepo) ; submodule/publish = lourd, hors « MVP d'abord ». Réévaluable si la dérive réapparaît malgré A. |

### 3.2 Les fixtures d'entrée PARTAGÉES (mêmes octets des deux côtés)

Le golden n'a de valeur que si **les deux dépôts partent des mêmes intrants**. Fixtures partagées, committées à l'identique dans les deux dépôts :

1. **Les 8 personas canon** = `iakaframe/library/personas/{aragorn,gandalf,gimli,helm,legolas,loki,nathalie,odin}.md` **verbatim** (frontmatter riche + corps).
2. **Le binding défaut** = `iakaframe/bindings/iakaframe-claude-default.md` (assignments + `tools` + `model`).

Côté CLI, ces fichiers **sont déjà** la bibliothèque réelle du dépôt (le test consomme `REPO`). Côté GUI, ils doivent être **vendorés en fixtures** (`packages/core/__tests__/fixtures/personas/*.md` + `binding` équivalent) — **copie verbatim**, avec en-tête de provenance.

### 3.3 Le golden ATTENDU

Le golden = **8 fichiers** `<id>.md` = sortie de `renderAgentContract` du CLI pour chaque persona (id) + `toolsForPersona(bindingDéfaut, id)`. Produit **canoniquement par le CLI** (référence §2). Committé :

- côté CLI : `cli/test/fixtures/agents-golden/<id>.md` (8 fichiers) — produits par le CLI, donc auto-cohérents ;
- côté GUI : `packages/core/__tests__/fixtures/agents-golden/<id>.md` (8 fichiers) — **copie byte-à-byte** des précédents.

Chaque golden porte un **en-tête de provenance** (commentaire hors frontmatter, retiré au comparatif comme le fait déjà `parity-kit.test.js:17-23`) : dépôt source, version CLI, `sha256` du contenu utile. La copie GUI déclare le **même** hash.

### 3.4 Les tests

| Dépôt | Test | Assertion |
|---|---|---|
| CLI | `cli/test/parite-generateurs.test.js` (ou extension de `generate-agents.test.js`) | Pour les 8 ids : `generateAgent(id, {root: REPO, binding: défaut})` **==** `agents-golden/<id>.md` (byte-à-byte). |
| GUI | `packages/core/__tests__/parite-generateurs.test.ts` | Pour les 8 ids : le rendu de contrat GUI (à partir des personas canon vendorées + binding) **==** `agents-golden/<id>.md` (byte-à-byte). |
| GUI (garde de sync) | même fichier | `sha256(contenu golden GUI) === hash déclaré dans l'en-tête` (détecte une altération locale de la copie vendorée). |

### 3.5 Garder le golden synchronisé quand le format évolue

- **Producteur unique** : seul le CLI (référence) **régénère** le golden (script `iakaframe` / commande de génération dédiée, ou `--write` du test). La copie GUI est **re-vendorée** depuis la sortie CLI, jamais éditée à la main.
- **Rituel documenté** (dans les deux `CLAUDE.md` de dépôt) : « format de contrat modifié → régénérer le golden CLI → re-vendorer les 8 fichiers + hash dans la GUI → les deux tests doivent repasser ». La byte-identité cross-repo est **garantie au moment du vendoring**.
- **Effet cliquet** : un changement de format cassant fait **échouer le golden des DEUX côtés** (le rendu s'écarte de la copie figée), ce qui **force** la resynchronisation consciente — exactement l'objectif.

---

## 4. Ce que chaque dépôt doit changer pour converger

### 4.1 CLI (référence) — quasi rien

- **Producteur du golden** : exposer un moyen reproductible d'émettre `agents-golden/<id>.md` (réutiliser `generateAll`/`generateAgent`). Le rendu **ne change pas** (il EST la référence).
- Ajouter/étendre le test de parité (§3.4) pointant sur le golden figé (aujourd'hui `generate-agents.test.js` teste un golden **inline**, pas un fichier partagé re-vendorable).

### 4.2 GUI (cœur) — converge vers le CLI

Pour que `renderAgent` produise le contrat de référence, la GUI doit :

1. **`name`** : émettre l'**id** (`p.id`) et non le nom d'affichage (`claudeCode.ts:62`). Donnée déjà présente.
2. **`description`** : émettre la **description canon** → le modèle GUI doit **porter/charger** la `description` (absente de `Persona`, `persona.ts:19-34`). Enrichir le modèle **ou** charger le persona `.md` canon en fixture (un « persona-contract loader » qui, contrairement à `parsePersona`, conserve `description` + corps).
3. **`tools`** : émettre depuis le binding en **scalaire-virgule, omis si vide** — miroir de `toolsForPersona` + `renderScalar` du CLI. La donnée `PersonaBinding.tools` **existe déjà** (`binding.ts:44`), il faut **la câbler** dans le rendu (aujourd'hui ignorée).
4. **`guardrails`** : émettre en **flow-list**. `Persona.guardrails` existe (`persona.ts:33`) mais **le vocabulaire diffère** : canon = `[identity, perimeter]` (`gandalf.md:9`) vs adapters.test = `identity-guard` (`adapters.test.ts:24-26`). **Réconcilier le vocabulaire des ids de garde** (point à trancher §6).
5. **Corps** : émettre le **corps VERBATIM du canon** (pas le stub `claudeCode.ts:65-77`) → suppose l'accès au corps canon (cf. §1.3, coût principal).
6. **`model`** : **ne PAS émettre** `model` dans le contrat d'agent pour rester byte-parité avec le CLI. **Tension P7** (standalone-runnable) → point à trancher §6.
7. **Ordre des champs** : `name, description, tools?, guardrails`.

> Note : `generateClaudeCodeKit` produit **aussi** `CLAUDE.md`, `SKILL.md`, `settings.json`, `.mcp.json`
> (`claudeCode.ts:162-199`). Le golden de parité vise **uniquement** `.claude/agents/<id>.md` (le contrat
> d'agent) — le reste de l'arbre est **hors périmètre** (§5).

---

## 5. Hors-périmètre (fermé)

- **Le reste de l'arbre GUI** (`CLAUDE.md`, `SKILL.md`, `settings.json`, `.mcp.json`, hooks) : non couvert par ce golden.
- **Le format d'entrée du binding** (`.md` assignments CLI vs JSON GUI) : non unifié ici ; seules les **valeurs** (`tools`, ordre des personas) doivent coïncider dans les fixtures.
- **Fusion des deux générateurs en un seul** : explicitement rejeté (décision décideur = garder les deux + golden).
- **Émission de `model` dans le contrat** : tranché en §6, pas ré-ouvert ailleurs.
- **Génération multi-nœud** (codex/ollama/openwebui) : ce golden vise le nœud **claude** uniquement.
- **Refonte du modèle `Persona` GUI** au-delà du strict nécessaire pour porter `description` + corps.

---

## 6. Points à trancher (décideur)

1. **`model` dans le contrat d'agent** — la référence CLI **ne l'émet pas** (model = run-time cockpit). La GUI l'émet si-bindé (P7 « standalone-runnable »). Le golden **force un choix**.
   → **Reco Gandalf** : le contrat `.claude/agents/<id>.md` **ne porte PAS `model`** (aligne sur le live + non-régression) ; le `model` vit dans un artefact séparé déployé à côté (binding.json / cockpit). À confirmer.
2. **Vocabulaire des ids de garde** — canon `identity`/`perimeter` (`gandalf.md:9`) vs GUI `identity-guard`/`perimeter-guard` (`adapters.test.ts:24-26`). La flow-list `guardrails` diffère selon la convention.
   → **Reco** : les fixtures partagées adoptent le **vocabulaire canon** (`identity`, `perimeter`), la GUI mappe vers lui au rendu.
3. **Source du corps + description côté GUI** — enrichir le modèle `Persona` (porter `description`+corps) **ou** charger le persona `.md` canon en fixture au rendu ?
   → **Reco MVP** : **loader de fixture canon** au moment du golden (ne pas alourdir le modèle pur `Persona` de la forge tant que l'UI n'en a pas besoin).

---

## 7. Critères d'acceptation (testables)

1. **Golden dupliqué en place** : `agents-golden/<id>.md` (8) committé dans les **deux** dépôts, byte-identiques, avec en-tête de provenance + `sha256`.
2. **Parité CLI** : pour les 8 personas, `generateAgent(id)` (binding défaut) **== golden** byte-à-byte.
3. **Parité GUI** : pour les 8 personas, le rendu de contrat GUI (fixtures canon + binding) **== golden** byte-à-byte.
4. **Cliquet cassant bilatéral** : un changement de format du contrat (ex. réordonner les champs, requoter `tools`, réintroduire `model`) **fait échouer** le test de parité **des DEUX côtés** tant que le golden n'est pas re-vendoré consciemment.
5. **Garde de sync GUI** : le hash déclaré dans l'en-tête du golden GUI **== sha256** de son contenu utile (une copie altérée localement échoue).
6. **Non-régression** : les tests existants passent (`cli/test/generate-agents.test.js`, `packages/core/__tests__/adapters.test.ts` — ce dernier **ajusté** pour le nouveau frontmatter `name(id)/description/tools?/guardrails` sans `model`, cf. `adapters.test.ts:77-85`).
7. **Idempotence** : deux générations successives, dans chaque dépôt, donnent le même octet.

---

## 8. Jalon (gate humain)

```
  ____                _
 / ___| __ _ _ __ ___| |
| |  _ / _` | '_ / _ \ |
| |_| | (_| | | |  __/_|
 \____|\__,_|_|  \___(_)
```

| | |
|---|---|
| **Émetteur** | 🔵 Gandalf (cadrage) |
| **Contenu** | Instruction `specs/instructions/parite-generateurs-contrat.md` — golden de parité CLI↔GUI, référence = CLI, GUI converge |
| **Récepteur** | Odin (décideur) → validation → dispatch Gimli (exécution) |

**Fichiers à vérifier** :
- `iakaframe/cli/src/lib/generate-agents.js:54-65` (référence à figer)
- `iakaFrameGUI/packages/core/src/adapters/claudeCode.ts:52-78` (à faire converger)
- `iakaFrameGUI/packages/core/src/persona.ts:19-34` (modèle à enrichir/contourner)
- `iakaframe/bindings/iakaframe-claude-default.md:7-15` (intrant tools/model partagé)
- `iakaframe/cli/test/parity-kit.test.js:1-30` (précédent de golden dupliqué à répliquer)

**Points à trancher avant exécution** : les 3 de la §6 (émission `model`, vocabulaire guardrails, source du corps GUI).

À validation → « JALON VALIDÉ » + dispatch Gimli.

---

## 9. Statut

- **2026-07-19** — Rédigée par Gandalf. **En attente de validation décideur** (gate humain, §8).
