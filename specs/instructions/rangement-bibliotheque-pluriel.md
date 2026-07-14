# Rangement — bibliothèque au pluriel : pool d'atomes + assemblages

> **Nature** : réorganisation STRUCTURELLE du dépôt `iakaframe` (rangement de contenu, non
> destructif) — **cadrage seul, aucun code de production**. · **Cadreur** : l'architecte-cadreur.
> **Statut : CADRÉ — À VALIDER par le décideur** (jalon humain de cadrage).
> **Date** : 2026-07-15. Français ; identifiants en anglais.
>
> **Références**
> - Modèle de concepts gravé (source du vocabulaire) :
>   `../../../iakaframegui/specs/instructions/E2-separation-methode-team-principes.md`
>   (strate Méthode à 6 composants ; Team = casting pur ; catalogues par id ; Binding ; Kit).
> - Existant faisant autorité (référentiel de rôles / méthode) :
>   `../equipe-agents.md`, `../glossaire-iakaframe.md`, `../../methode-de-travail.md`,
>   `../../agents/*.md`, `../../skills/iakaframe-*`, `../../kit-*`.
> - État de l'art vérifié le 2026-07-15 (§ 9) : BMAD v6 (namespace `bmad:module:type:name`,
>   un fichier `.md`+frontmatter par artefact, index par **scan de motif**).

---

## 1. Problème (avant la solution)

Le dépôt `iakaframe` range aujourd'hui la **vraie** team et la **vraie** méthode au **singulier**
et **par type de fichier runtime** : `agents/` (8 contrats mixtes qui fondent casting + savoir +
identité), `skills/`, `kit-*` (un dossier par runner), `methode-de-travail.md` (narratif
monolithique), `specs/equipe-agents.md`, `specs/glossaire-iakaframe.md`. Conséquences :

1. **On ne peut pas réutiliser** un atome (une persona, un principe, un rituel) d'un assemblage à
   l'autre : tout est soudé. Le modèle E2 (Méthode ≠ Team, catalogues référencés par id) n'a **pas
   de logement** dans le dépôt.
2. Les `agents/*.md` **mélangent trois natures** : casting (nom·rôle·royaume·skills), savoir-faire
   (renvoyé à la skill) et discipline (identité, gardes, périmètre) — impossible de caster une
   persona sur une autre méthode.
3. La méthode n'existe que comme **prose** : ses **faits** (workflow, principes, rituels, gardes,
   rôles, scaffold) ne sont pas des **données** adressables par id, donc ni la forge ni le cockpit
   ne peuvent les assembler.

**Besoin (formulé par le décideur)** : ranger la **vraie** team + la **vraie** méthode + **tout le
reste**, **au PLURIEL**, selon le modèle **« pool + assemblages »** — un atome vit **une fois** dans
un pool, les assemblages le **référencent par id**, zéro duplication.

**Ce lot ne fait que RANGER le contenu** (créer / déplacer des fichiers `.md` à frontmatter, de
façon non destructive). Le **branchement code** (parseurs, chargement du pool par la forge) est
**hors périmètre** — voir § 6 [différé].

---

## 2. Structure cible (à graver)

```
iakaframe/
├── library/                    ← POOL d'atomes réutilisables (indexés par id via SCAN)
│   ├── personas/               casting pur (1 fichier / persona)         — ex. gandalf.md
│   ├── skills/                 savoir-faire (1 dossier / skill)          — ex. iakaframe-cadrage/
│   ├── principles/             politiques composables (1 / principe)     — ex. qualite.md
│   ├── rituals/                gestes outillés (1 / rituel)              — ex. iakastart.md
│   ├── guardrails/             gardes-fous (1 / garde)                   — ex. identity.md
│   ├── roles/                  référentiel de rôles (1 / rôle)           — ex. cadrage.md
│   ├── workflows/              workflows phases+gates (1 / workflow)     — ex. iakaframe-3phases.md
│   └── scaffolds/              échafaudages de folders (1 / scaffold)    — ex. projet.md
├── teams/                      ← N teams (assemblages de CASTING, par id)  — ex. iakaframe-8.md
├── methods/                    ← N méthodes (assemblages de DISCIPLINE)    — ex. iakaframe.md
├── bindings/                   ← N bindings (méthode↔team + persona→runner+modèle)
└── kits/                       ← N kits générés (méthode+team+binding → déployable par runner)
```

**Invariants de la structure** :

- **I1 — Zéro duplication par référence.** Un atome existe **une seule fois** dans `library/<type>/`.
  Toute team/méthode/binding/kit le **désigne par son id** (jamais une copie de son corps). Une
  persona sert N teams ; un principe sert N méthodes.
- **I2 — Index par SCAN, pas d'`index.md`.** L'inventaire d'un dossier = **le contenu du dossier**
  (le `id` d'un atome = **nom de fichier sans extension**, ou le champ `id` du frontmatter — les deux
  coïncident, invariant). Ajouter un fichier = il apparaît. **Aucun manifeste à maintenir à la main.**
  (Aligné BMAD v6 : détection par motif, cf. § 9.)
- **I3 — Pureté du casting.** `library/personas/` restent **PURES** : **aucun runner, aucun modèle**.
  Le couple runner+modèle **et** l'appariement méthode↔team vivent **uniquement** dans `bindings/`.
- **I4 — Un fichier par atome/assemblage**, format **`.md` à frontmatter** (bloc YAML de **données**
  en tête, **corps lisible** en dessous — § 3).
- **I5 — Le narratif RESTE.** `methode-de-travail.md`, `specs/equipe-agents.md`,
  `specs/glossaire-iakaframe.md` **ne sont pas supprimés** : ils restent la **couche récit**. Le lot
  en **extrait les faits** vers `library/` (données) — il ne remplace pas la prose.

---

## 3. Schéma de frontmatter par type (+ exemple court, données réelles)

> **Règle commune** : le frontmatter est un bloc `---` YAML **de données** ; le corps `.md` est la
> **surface lisible**. Le champ `id` est **obligatoire** et **égal au nom de fichier** (I2). Tout
> champ de type `*Ids`/`*Keys` est un **tableau d'ids** vers un autre atome (I1).

### 3.1 `persona` — `library/personas/<id>.md`  (CASTING PUR — I3)
Champs : `id`, `name`, `roleKey` (réf. `roles/`), `royaume` (par défaut, MAJUSCULE),
`pastille` (emoji de phase par défaut), `skills[]` (réf. `skills/`), `guardrails[]` (réf.
`guardrails/`), `vignette` (chemin ou `none`). **Interdits** : `runner`, `model` (→ bindings).
Corps = la charte lisible (mission, périmètre fait/ne-fait-pas, entrées→sorties, gate, étanchéité,
identité) — **le savoir-faire n'est PAS recopié**, il est pointé par `skills[]`.

```yaml
---
id: gandalf
name: Gandalf
roleKey: cadrage
royaume: IAKAFRAME
pastille: "🔵"
skills: [iakaframe-cadrage]
guardrails: [identity, perimeter]
vignette: none
---
# 🧙 Gandalf — Architecte-cadreur (l'inventeur)
Mission : besoin → instruction fermée et vérifiable dans specs/instructions/…
(corps de charte inchangé, cité depuis agents/gandalf.md)
```

### 3.2 `skill` — `library/skills/<id>/SKILL.md`  (savoir-faire, 1 dossier / skill)
Frontmatter **existant conservé** (`name`, `description`) ; on **ajoute** `id` (= `name`). Le
**corps de la skill n'est jamais copié ailleurs** (I1) : personas/méthodes la référencent par id.

```yaml
---
id: iakaframe-cadrage
name: iakaframe-cadrage
description: Transforme un besoin en instruction fermée et vérifiable… (inchangé)
---
```

### 3.3 `principle` — `library/principles/<id>.md`
Champs : `id`, `label`, `policy` (texte), `trigger` (texte). Corps = explication + exemples.

```yaml
---
id: qualite
label: Rapport qualité sur version mineure
policy: "Version mineure ⇒ rapport qualité complet (typecheck + lint + tests + revue)."
trigger: "bump SemVer x.Y.z"
---
```

### 3.4 `ritual` — `library/rituals/<id>.md`
Champs : `id`, `label`, `triggers[]` (mots-clés), `actions[]` (étapes), `side` (`forge` | `cockpit`).

```yaml
---
id: iakastart
label: Bootstrap team
triggers: [iakastart, iakaframe, odin]
actions:
  - "Afficher le banner ASCII IAKAFRAME"
  - "Afficher le roster des rôles"
  - "Rendre la team prête au dispatch (n'en spawner aucune)"
side: cockpit
---
```

### 3.5 `guardrail` — `library/guardrails/<id>.md`
Champs : `id`, `label`, `kind` (`identity` | `perimeter` | `delegation` | `permission` | `custom`),
`hook` (événement du runner, ex. `Stop`/`PreToolUse`, ou `none`), `policy`. Corps = la règle.

```yaml
---
id: identity
label: Double badge ouverture/clôture
kind: identity
hook: "Stop;SubagentStop;UserPromptSubmit"
policy: "Position de la pastille = sens ; « START/STOP » bannis ; badge en 1re ligne."
---
```

### 3.6 `role` — `library/roles/<id>.md`  (référentiel de rôles)
Champs : `key` (= `id` = nom de fichier), `label`, `roleIndex` (ordre canonique), `scope`
(`team` | `portfolio`). Corps = ce que le rôle couvre (à charge d'une persona de le caster).

```yaml
---
id: cadrage
key: cadrage
label: Architecte-cadreur
roleIndex: 1
scope: team
---
```

### 3.7 `workflow` — `library/workflows/<id>.md`
Champs : `id`, `name`, `phases[]` (`{ id, label, agentsRoleKeys[], input, output }`),
`gates[]` (`{ afterPhase, kind: human|auto, criteria }`). Corps = le récit du flux.

```yaml
---
id: iakaframe-3phases
name: iakaframe — cadrage → réalisation → staging
phases:
  - { id: p1, label: Cadrage, agentsRoleKeys: [cadrage], input: besoin, output: "specs/instructions/{feature}.md" }
  - { id: p2, label: Réalisation, agentsRoleKeys: [dev, qualite], input: instruction, output: "branche + commits + verdict PASS" }
  - { id: p3, label: Staging, agentsRoleKeys: [dev, qualite], input: PASS, output: "build en staging vX.Y.Z-rc" }
gates:
  - { afterPhase: p1, kind: human, criteria: "l'utilisateur valide l'instruction" }
  - { afterPhase: p2, kind: auto,  criteria: "typecheck + lint + tests verts" }
  - { afterPhase: p3, kind: auto,  criteria: "build/déploiement staging OK" }
---
```
> Le **squad prod** (Helm, hors les 3 phases, gate humain) est modélisé en donnée de fin de
> workflow (`side: prod`) ou en workflow séparé — **arbitrage Q-3**.

### 3.8 `scaffold` — `library/scaffolds/<id>.md`
Champs : `id`, `level` (`portfolio` | `project`), `entries[]` (`{ path, role, createIfAbsent }`),
`nonDestructive: true`.

```yaml
---
id: projet
level: project
nonDestructive: true
entries:
  - { path: "specs/", role: "espace cadrage", createIfAbsent: true }
  - { path: "specs/instructions/", role: "coeur du workflow", createIfAbsent: true }
  - { path: "CLAUDE.md", role: "contrat de rôle runner", createIfAbsent: true }
  - { path: ".iakaframe", role: "marqueur méthode", createIfAbsent: true }
---
```

### 3.9 `team` — `teams/<id>.md`  (assemblage de CASTING, que des ids)
Champs : `id`, `name`, `personas[]` (réf. `personas/`), `coordinator` (id de persona),
`guardrails[]` (réf., appliqués team-wide), `vignetteTeam`. **PAS** de `methodId`, **PAS** de
`workflowId` (E2). Corps = présentation du casting.

```yaml
---
id: iakaframe-8
name: La compagnie iakaframe
personas: [odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie]
coordinator: aragorn
guardrails: [identity, perimeter, delegation]
vignetteTeam: none
---
```

### 3.10 `method` — `methods/<id>.md`  (assemblage de DISCIPLINE, que des ids)
Champs : `id`, `name`, `workflowId`, `principleIds[]`, `ritualIds[]`, `guardrailIds[]`,
`roleKeys[]`, `scaffoldIds[]`. **Ne nomme aucune persona** (E2). Corps = le récit de la discipline
(renvoie à `methode-de-travail.md`).

```yaml
---
id: iakaframe
name: Méthode iakaframe
workflowId: iakaframe-3phases
scaffoldIds: [portefeuille, projet]
principleIds: [qualite, gestion-backlog, documentation, commits-versionnement, isolation-docker,
  self-hosted-first, reutilisation-existant, mvp-first, identite-badges, perimetres-etanches,
  langue, mock-en-dev, cadrage-avant-code, confirmation-actes-destructifs]
ritualIds: [iakastart, init, update, snapshot, log-conversation]
guardrailIds: [identity, perimeter, delegation]
roleKeys: [portefeuille, coordination, cadrage, dev, qualite, deploiement, design, documentation]
---
```

### 3.11 `binding` — `bindings/<id>.md`  (méthode↔team + runner+modèle — I3)
Champs : `id`, `methodId` (réf.), `teamId` (réf.), `assignments[]`
(`{ personaId, runner, model }` — le **SEUL** endroit où vivent runner+modèle). Corps = notes.

```yaml
---
id: iakaframe-claude-default
methodId: iakaframe
teamId: iakaframe-8
assignments:
  - { personaId: gandalf, runner: claude-code, model: "opus" }
  - { personaId: gimli,   runner: claude-code, model: "sonnet" }
  # … défaut suggéré, override au cockpit
---
```

### 3.12 `kit` — `kits/<id>.md`  (livrable généré par runner)
Champs : `id`, `methodId`, `teamId`, `bindingId?`, `node` (runner cible, ex. `claude`, `codex`,
`ollama`, `openwebui`, `anythingllm`), `emits[]` (arbre livré). Corps = manifeste de livraison.
Les **arborescences runner existantes** (`kit-*`) déménagent ici comme kits générés (§ 4).

```yaml
---
id: iakaframe-claude
methodId: iakaframe
teamId: iakaframe-8
bindingId: iakaframe-claude-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", ".claude/hooks/*", "CLAUDE.md"]
---
```

---

## 4. Plan de migration NON DESTRUCTIF (source → cible)

> **Règles de migration** : (M1) **traçabilité git** — tout déplacement se fait par **`git mv`**
> (jamais copier+supprimer), pour préserver l'historique. (M2) **aucune perte** — rien n'est
> supprimé sans **équivalent** créé ; la couche narrative reste en place (I5). (M3) les
> assemblages ne contiennent **que des ids** (I1). (M4) les personas restent **pures** (I3).
> ⚠️ **Ce dépôt n'est pas un repo git au moment du cadrage** (cf. env) : si `git` n'est pas
> initialisé au moment de l'exécution, `git mv` se dégrade en `mv` **tracé dans l'instruction**
> — le développeur le signale (arbitrage Q-5).

| Source (existant) | Cible | Geste | Nature |
|---|---|---|---|
| `agents/odin.md` … `agents/nathalie.md` (8) | `library/personas/<nom>.md` | `git mv` **+ scission** : extraire le frontmatter casting (`id·name·roleKey·royaume·pastille·skills[]·guardrails[]·vignette`), garder le corps de charte, **retirer** tout savoir-faire recopié (→ pointé par `skills[]`) | scindé |
| `agents/_TEMPLATE.md` | `library/personas/_TEMPLATE.md` | `git mv` + aligner sur le schéma § 3.1 | déplacé |
| `skills/iakaframe-*/` (15) | `library/skills/iakaframe-*/` | `git mv` du dossier **entier** (corps conservé **une fois**) ; ajouter `id` au frontmatter | déplacé |
| `skills/iakastart/`, `skills/README.md` | `library/skills/iakastart/`, `library/skills/README.md` | `git mv` | déplacé |
| **Faits** de `methode-de-travail.md` → workflow 3 phases + gates | `library/workflows/iakaframe-3phases.md` | **extraire en donnée** (§ 3.7) ; **le narratif reste** dans `methode-de-travail.md` (I5) | extrait (copie de fait) |
| **Faits** → 14 principes (E2 § 3.3) | `library/principles/<id>.md` ×14 | extraire en donnée (§ 3.3) depuis `methode-de-travail.md` + `CLAUDE.md` global | extrait |
| **Faits** → 5 rituels (E2 § 3.4) | `library/rituals/<id>.md` ×5 (`iakastart·init·update·snapshot·log-conversation`) | extraire ; `side=forge` pour `init`, `cockpit` pour les 4 autres | extrait |
| **Faits** → gardes identité/périmètre/délégation | `library/guardrails/<id>.md` ×3 (`identity·perimeter·delegation`) | extraire ; `hook` renseigné d'après `kit-claude/global/hooks/*` | extrait |
| **Faits** → référentiel de rôles (`equipe-agents.md` roster) | `library/roles/<key>.md` ×8 | extraire (`portefeuille·coordination·cadrage·dev·qualite·deploiement·design·documentation`) ; narratif reste | extrait |
| **Faits** → scaffold portefeuille + projet | `library/scaffolds/{portefeuille,projet}.md` | extraire (§ 3.8) | extrait |
| **Assemblage** — casting des 8 | `teams/iakaframe-8.md` | **créer** (que des ids, § 3.9) | créé |
| **Assemblage** — discipline iakaframe | `methods/iakaframe.md` | **créer** (que des ids, § 3.10) | créé |
| **Assemblage** — appariement + runner défaut | `bindings/iakaframe-claude-default.md` | **créer** (§ 3.11) ; source runner+modèle : `kit-*/MODELES.md`, `kit-openwebui/models/*.json` | créé |
| `kit-claude/` | `kits/iakaframe-claude/` (+ `kits/iakaframe-claude.md` manifeste) | `git mv` de l'arbre ; ajouter le manifeste (§ 3.12) | déplacé + manifeste |
| `kit-codex/` `kit-ollama/` `kit-openwebui/` `kit-anythingllm/` | `kits/iakaframe-{codex,ollama,openwebui,anythingllm}/` (+ manifeste chacun) | `git mv` + manifeste | déplacé + manifeste |
| `methode-de-travail.md` | **inchangé (en place)** | — | narratif conservé (I5) |
| `specs/equipe-agents.md`, `specs/glossaire-iakaframe.md` | **inchangés (en place)** | — | narratif conservé (I5) |
| `specs/instructions/*`, `README.md`, `cli/`, `stack-qualite/`, `design-naonedge/` | **inchangés** | — | hors périmètre du rangement |

> **Note sur les kits** : dans le modèle E2, `kits/` = **livrables générés** (méthode+team+binding →
> arbre par runner). Les `kit-*` actuels sont exactement cela (des gabarits de déploiement par
> runner) : ils y trouvent leur place. La **génération automatique** depuis un binding est [différé]
> (§ 6) — au MVP, ils sont **rangés tels quels** + un manifeste qui les relie method/team/binding.

---

## 5. Ce que ce lot fait / ne fait pas

**FAIT (MVP — structuration de contenu, non destructif)**
- Créer l'arborescence `library/ · teams/ · methods/ · bindings/ · kits/`.
- **Scinder** les 8 `agents/*.md` en personas pures ; **déplacer** `skills/` → `library/skills/`.
- **Extraire en données** (md-frontmatter) : 1 workflow, 14 principes, 5 rituels, 3 gardes, 8 rôles,
  2 scaffolds — **le narratif reste**.
- **Créer** les 3 assemblages seed (team `iakaframe-8`, méthode `iakaframe`, binding
  `iakaframe-claude-default`) + **déplacer** les 5 `kit-*` en `kits/` avec leur manifeste.
- Respecter I1–I5 et M1–M4 ; **vérifier zéro perte** (§ 7).

**NE FAIT PAS (hors périmètre / [différé])**
- **[différé] Branchement code** : parseur de frontmatter dans `@iakaframe/core`, chargement du
  `library/` par la forge, génération d'un kit depuis un binding, validation de schéma runtime.
  → objet d'une instruction **séparée** côté `iakaframegui` (aligne sur E2a).
- **[différé] Renommage des skills par geste** (`iakaframe-forgejo→commit`,
  `-appflowy-doc→memoire-humaine`, `-naonedge→design`) : chantier distinct (mémoire portefeuille) —
  **ici on déplace les ids tels quels** pour ne pas mêler deux refactors.
- **[différé] Édition riche / vignettes persistantes / copilote de forge** (E2b/E2c).
- **[différé] N teams / N méthodes réelles** au-delà des seeds iakaframe (la structure est prête au
  pluriel, mais un seul jeu est seedé au MVP).
- **Ne touche pas** au code de production, ni à `cli/`, `stack-qualite/`, `specs/instructions/*`.

---

## 6. Estimation (entrée de gate dev)

- **Charge** : ~**0,5 à 1 j-homme** (spec fermée) — l'essentiel est du `git mv` + rédaction de
  frontmatter à partir de faits déjà écrits.
- **Complexité / risque** : **faible** (aucune logique, aucun runtime). Risque principal =
  **fidélité de l'extraction** (ne pas déformer un principe/rituel) et **exactitude des ids**.
- **Inconnues** : (a) dépôt non-git au moment T (M1 → Q-5) ; (b) découpage exact des rôles (8 vs 7,
  Odin portefeuille — Q-2) ; (c) place du squad prod dans le workflow (Q-3).

---

## 7. Critères d'acceptation (vérifiables)

1. **Arborescence** : les 8 sous-dossiers `library/*` + `teams/ methods/ bindings/ kits/` existent.
2. **Schéma respecté** : chaque type possède **exactement** les champs de frontmatter de § 3 ;
   pour chaque type, **au moins un fichier réel** valide le schéma.
3. **Couverture des atomes** : 8 personas, 15 skills, 14 principes, 5 rituels, 3 gardes, 8 rôles,
   1 workflow, 2 scaffolds, 1 team, 1 méthode, 1 binding, 5 kits — **chacun avec son fichier**.
4. **Personas pures (I3)** : `grep -ri "runner\|model" library/personas/` ne renvoie **aucun** champ
   de frontmatter runner/modèle (le mot peut apparaître en prose, jamais en donnée de casting).
5. **Références seules dans les assemblages (I1)** : `teams/*.md`, `methods/*.md`, `bindings/*.md`
   ne contiennent **que des ids** dans leurs champs `*Ids`/`*Keys`/`personas` — **aucun corps
   d'atome recopié** ; chaque id référencé **existe** comme fichier dans le pool.
6. **id = nom de fichier (I2)** : pour tout atome, `frontmatter.id == basename(fichier)`.
7. **Zéro perte (M2)** : tout `agents/*.md`, `skills/*`, `kit-*` d'origine a une **cible** (tableau
   § 4) ; le narratif (`methode-de-travail.md`, `equipe-agents.md`, `glossaire-iakaframe.md`) est
   **toujours présent et inchangé**.
8. **Traçabilité git (M1)** : les déplacements apparaissent comme **renommages** dans
   `git status`/`git log --follow` (ou, si non-git, la dégradation `mv` est **signalée** — Q-5).
9. **Index par scan (I2)** : **aucun** `index.md`/manifeste manuel n'est introduit dans `library/`.

---

## 8. Questions d'arbitrage résiduelles (à trancher au jalon)

- **Q-1 — Nom des assemblages seed.** Reco : `teams/iakaframe-8.md`, `methods/iakaframe.md`,
  `bindings/iakaframe-claude-default.md`, `kits/iakaframe-<runner>.md`. → *Confirmer les ids.*
- **Q-2 — 8 rôles ou 7 + portefeuille à part ?** Odin est **portefeuille** (au-dessus des teams).
  Reco : le modéliser comme `role` avec `scope: portfolio` (donc 8 rôles, dont 1 hors-équipe), et
  le garder dans `personas` + `team` (la compagnie compte Odin). → *Trancher scope.*
- **Q-3 — Squad prod (Helm) dans le workflow ?** Reco : phases `p1·p2·p3` + une **étape prod
  séparée** (`side: prod`, gate humain) dans le même `workflow`, pas un workflow distinct. →
  *Confirmer.*
- **Q-4 — Un binding, ou un par runner ?** Reco MVP : **un** binding défaut (`claude`) ; les autres
  runners restent des **kits** rangés. → *Confirmer.*
- **Q-5 — Dépôt non-git au moment T.** Si `git` n'est pas initialisé, faut-il l'**initialiser
  d'abord** (pour tenir M1/traçabilité) ou accepter `mv` tracé dans l'instruction ? → *Trancher.*
- **Q-6 — Skills : ids conservés ou renommés par geste dès ce lot ?** Reco : **conserver** (le
  renommage est un lot séparé, § 5 [différé]). → *Confirmer.*

---

## 9. Faits vérifiés sur le web (2026-07-15) + sources

- **BMAD v6** (framework multi-agents mature) organise son contenu en **pool de fichiers `.md` à
  frontmatter YAML**, **un artefact par fichier**, dans un **namespace** `bmad:module:type:name` ;
  l'**installeur détecte les artefacts par MOTIF** (ex. `workflow-*.md`) — soit un **index par
  scan**, sans manifeste manuel. **Corrobore** les choix I2 (scan), I4 (md-frontmatter, 1 fichier /
  atome) et le classement **par type** dans `library/`. *(On ne copie pas BMAD ; on note la
  convergence d'architecture.)*
- Le champ `description` du frontmatter y **informe l'agent quand suggérer** l'artefact — cohérent
  avec nos `skill.description`/`persona` (routage), conservés tels quels.

Sources :
- [BMAD-METHOD — dépôt officiel](https://github.com/bmad-code-org/BMAD-METHOD)
- [Workflow Architecture (DeepWiki)](https://deepwiki.com/bmad-code-org/BMAD-METHOD/8.1-workflow-architecture)
- [What's New in v6 — Module Ecosystem (DeepWiki)](https://deepwiki.com/bmad-code-org/BMAD-METHOD/1.4-what's-new-in-v6)

---

## 10. Journal de décision

- **2026-07-15** — Le décideur tranche le **rangement au PLURIEL** du dépôt `iakaframe` selon
  **« pool + assemblages »** : `library/` (8 types d'atomes indexés par **scan**) + `teams/` +
  `methods/` + `bindings/` + `kits/`. **Zéro duplication par référence** (I1) ; **personas pures**
  (I3, runner+modèle uniquement dans `bindings/`) ; format **`.md` à frontmatter** (I4) ; **narratif
  conservé** (I5). Migration **non destructive** (`git mv`, aucune perte). **Branchement code
  [différé]** (parseurs / chargement forge → instruction séparée côté iakaframegui). Convergence
  état de l'art vérifiée (BMAD v6). **Cadrage seul, aucun code.**

> Tant que ce jalon n'est pas validé, **aucun déplacement** n'est exécuté. Ce lot ne produit que du
> **cadrage** ; le rangement suit la validation du décideur.
