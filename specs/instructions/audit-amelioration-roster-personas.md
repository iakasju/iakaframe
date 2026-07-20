# Audit de complétude — les 7 personas du roster (hors Aragorn)

> Instruction de cadrage (Gandalf, P1). **Lecture seule** sur tout le dépôt ; ce fichier est le seul
> artefact produit. Même grille à **7 dimensions** que `audit-amelioration-aragorn.md`, appliquée à
> **Odin, Gandalf, Gimli, Legolas, Helm, Loki, Nathalie**. Aucun code : spec fermée pour un futur
> lot d'exécution.

## 0. Deux rectifications factuelles au préalable

Le backlog (`BACKLOG.md:9`) et l'ordre proposé par Odin reposent sur un relevé ciblé que l'audit
**infirme partiellement**. Deux corrections, vérifiables :

**Rectification 1 — le geste jalon a bien irrigué Helm et Legolas.** Le constat « 1 seule mention
chez Gandalf/Legolas/Helm, alors que Helm tient le gate prod et Legolas le verdict d'entrée en
stage » est **inexact**. Les deux portent un paragraphe **« Jalon (obligatoire) »** complet et
adapté à leur gate :

- `library/personas/helm.md:42-44` — jalon du gate prod, récepteur = l'utilisateur, « JALON VALIDÉ »
  + la suite (bascule / surveillance).
- `library/personas/legolas.md:50-52` — jalon du verdict qualité, échecs en `chemin:ligne` si `FAIL`.
- `library/personas/gandalf.md` et `library/personas/aragorn.md:93` — également pourvus.

> **Conséquence sur l'ordonnancement** : la 3ᵉ priorité proposée par Odin (« jalon chez
> Helm/Legolas ») est **déjà faite**. Le vrai déficit jalon porte sur **Gimli, Loki, Nathalie et
> Odin** (0 mention), et il n'est **pas** de même nature (cf. § 4, dimension 3).

**Rectification 2 — l'audit fait apparaître un défaut plus grave, non listé au backlog.** Le champ
`roleKey` des personas canon **diverge de la table `ROLE_OF`** du CLI pour **6 personas sur 8**
(§ 3). Ce défaut est **systémique**, **invisible aux goldens**, et de mon point de vue **prioritaire
sur l'arbitrage `Task` d'Odin**. Il devient CH-A.

## 1. Portée & sources auditées

| Couche | Fichier | Rôle |
|---|---|---|
| Canon | `library/personas/<id>.md` | frontmatter + corps |
| Binding | `bindings/iakaframe-claude-default.md:8-15` | `runner/model/tools` par persona |
| Golden | `cli/test/fixtures/agents-golden/<id>.md` | parité (sha256 verrouillé) |
| Skills | `library/skills/<skill>/SKILL.md` | savoir-faire |
| Table CLI | `cli/src/lib/agents.js:17-44` | `ROLE_OF`, `SKILL_OF`, `SKILL_OVERRIDE_OF` |
| Générateur | `cli/src/lib/generate-agents.js:54-65` | champs projetés au contrat |
| Cœur GUI | `~/work/iakaFrameGUI/packages/core/src/roster.ts:16-35` | rôles/skills par défaut |
| Méthode | `methode-de-travail.md` | phases, gates, jalons, badges |

## 2. Tableau de synthèse — verdict par persona × dimension

Légende : ✅ complet · ⚠️ à améliorer · ❌ lacunaire

| Persona | 1 Charte | 2 Expert MoE | 3 Jalons | 4 Tools | 5 Skills | 6 Hooks | 7 Cohérence 3 couches |
|---|---|---|---|---|---|---|---|
| **Odin** | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ |
| **Gandalf** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Gimli** | ✅ | ✅ | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |
| **Legolas** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Helm** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |
| **Loki** | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| **Nathalie** | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |

> La colonne 7 est ⚠️ **pour tout le monde** : c'est CH-A (`roleKey`), défaut transverse.
> **Aucune persona n'est ❌ sur la dimension 2** : le découpage MoE du roster est sain — c'est le
> point fort de l'ensemble et il ne demande aucun travail.

## 3. CH-A — `roleKey` canon vs `ROLE_OF` CLI : divergence sur 6/8 (dimension 7)

Fait vérifié, persona par persona :

| Persona | `roleKey` canon | `ROLE_OF` (`cli/src/lib/agents.js:17-26`) | Cœur GUI (`roster.ts:16-24`) | Accord |
|---|---|---|---|---|
| odin | `portefeuille` (`odin.md:5`) | `portefeuille` | `portefeuille` | ✅ |
| aragorn | `coordination` (`aragorn.md:5`) | `coordination` | `coordination` | ✅ |
| gandalf | `cadrage` (`gandalf.md:5`) | `architecture` | `architecture` | ❌ |
| gimli | `dev` (`gimli.md:5`) | `fabrication` | `fabrication` | ❌ |
| legolas | `qualite` (`legolas.md:5`) | `tests` | `tests` | ❌ |
| helm | `deploiement` (`helm.md:5`) | `coordination` | *(absent du roster GUI)* | ❌ |
| loki | `design` (`loki.md:5`) | `graphisme` | `graphisme` | ❌ |
| nathalie | `documentation` (`nathalie.md:5`) | `doc` | `doc` | ❌ |

**Trois observations qui donnent sa gravité au défaut :**

1. **Le canon est le seul à être en désaccord.** Le CLI et le cœur GUI utilisent le **même**
   vocabulaire (`architecture`, `fabrication`, `tests`, `graphisme`, `doc`). C'est
   `library/personas/*.md` — la **source de vérité** — qui porte un vocabulaire **divergent**.
2. **Le cas `helm` est le plus grave** : `ROLE_OF.helm = 'coordination'`, soit **le même rôle
   qu'Aragorn**, avec un commentaire assumant le rattachement (`agents.js:23`), corrigé par un
   `SKILL_OVERRIDE_OF` (`:42-44`). Le canon dit `deploiement`. Deux personas partagent donc un
   rôle canonique **par accident de table**, et le déploiement n'est correct que grâce à une
   **exception codée en dur**.
3. **Aucune garde ne peut voir ce défaut.** `renderAgentContract`
   (`cli/src/lib/generate-agents.js:54-65`) projette `name`, `description`, `tools`, `guardrails` —
   **pas `roleKey`**. Le champ est donc absent des 8 goldens, absent des contrats déployés, et
   **hors de portée de tout test de parité**, présent ou à venir. `roleKey` est aujourd'hui un champ
   **mort dans le canon et vivant dans une table codée** : la configuration exacte qui garantit une
   dérive silencieuse — le même schéma de cause racine que celui déjà corrigé pour les contrats
   (`cli/src/lib/generate-agents.js:3-5`).

> **C'est pourquoi je place CH-A devant l'arbitrage `Task` d'Odin.** L'incohérence d'Odin est une
> **instance** connue, déjà tranchée une fois pour Aragorn, au risque borné. CH-A est une **cause
> racine active**, non détectée, qui touche les 8 personas et le cœur GUI.

## 4. Verdicts par dimension

### Dimension 1 — Charte précise

**Complet pour 6/7.** Missions, périmètres *fait / ne fait pas*, entrées→sorties nets partout. Points
saillants positifs : Loki (`loki.md:66-87`, boucle de rendu « voir puis juger », règle d'or *un
visuel non rendu = non livré*) et Legolas (`legolas.md:42-48`, profondeur de gate graduée) sont les
chartes les mieux fermées du roster.

**⚠️ Nathalie — obligation asymétrique non réciproque.** `legolas.md:54-60` institue la **Revue
Qualité de Version (RQV)** comme gate **humain** à chaque version mineure et engage nommément
Nathalie : *« Legolas produit — **avec 📖 Nathalie** — le document d'évaluation complète »*. Or
`library/personas/nathalie.md` **ne mentionne ni la RQV ni ce livrable** (vérifié : `RQV` n'apparaît
dans `library/` que dans `legolas.md` et `iakaframe-init/SKILL.md`). Une persona est donc engagée
dans un gate qu'elle ignore. *(Les deux références de `legolas.md:59-60` — `specs/equipe-agents.md`
et `specs/instructions/revue-qualite-version.md` — existent bien : le défaut est l'absence côté
Nathalie, pas une référence morte.)*

### Dimension 2 — Expert MoE identifiable

**Complet pour 7/7.** Aucune frontière floue détectée :

- **Odin ↔ Aragorn** : portefeuille vs intra-projet, explicitement borné (`odin.md:90-94`).
- **Gimli ↔ Legolas** : séparation juge/partie, verrouillée des deux côtés (`gimli.md:42-46`,
  `legolas.md:25-26,37-40`).
- **Gimli ↔ Helm** : staging vs prod, borne nette (`gimli.md:27`, `helm.md:17-18`).
- **Nathalie ↔ Loki** : fond vs forme, avec passation par brief structuré (`nathalie.md:38-43`).
- **Nathalie ↔ Gandalf** : garde-fou explicite *« elle vérifie et cite, elle ne cadre pas »*
  (`nathalie.md:54-55`) — clause de non-débordement exemplaire.

C'est la dimension la plus saine du roster. **Aucune action.**

### Dimension 3 — Jalons

Après rectification 1 (§ 0), l'état réel :

| Persona | État | Analyse |
|---|---|---|
| Gandalf | ✅ | jalon P1→P2 + estimation dev |
| Legolas | ✅ | `legolas.md:50-52` |
| Helm | ✅ | `helm.md:42-44` |
| **Odin** | ❌ | **il ouvre et ferme des gates portefeuille** (switch de projet, démarrage, chantiers transverses) sans aucun geste de jalon |
| **Gimli** | ❌ | `gimli.md:38-46` : « Aucun gate propre » **mais** interdiction d'auto-validation et remise obligatoire à Legolas → il y a bien une **transition** P2→gate qualité à matérialiser |
| Loki | ⚠️ | pas de gate au sens méthode ; livre un visuel validé par l'humain (`loki.md:85-87`) → jalon de **recette visuelle** défendable, non obligatoire |
| Nathalie | ⚠️ | aucun gate bloquant (`nathalie.md:61-63`) → mais la **RQV** (dim. 1) est un gate humain qui, lui, appelle un jalon |

> **Nuance de cadrage importante.** Il ne faut **pas** injecter mécaniquement un paragraphe jalon
> chez les 4 manquants : un jalon n'a de sens **qu'à une transition réelle**. Priorité franche à
> **Odin** (transitions portefeuille non matérialisées) et **Gimli** (remise à Legolas). Loki et
> Nathalie relèvent d'un jalon **optionnel** ; les charger d'une obligation vide dévaluerait le
> geste — exactement ce que la skill met en garde (`library/skills/iakaframe-jalon/SKILL.md:16-18` :
> *« un jalon non posé = une transition invisible »*, ce qui suppose une transition).

> ⚠️ **Dépendance dure** : tant que `parite-skills-generateur-deploiement.md` n'est pas livrée,
> `iakaframe-jalon` **n'est pas active en runtime** (skill absente du déployé + non préchargée).
> Enrichir les chartes en prose reste utile, mais **le geste ne sera pas outillé**. → **ordonnancer
> le lot skills AVANT tout travail jalon sur le roster.**

### Dimension 4 — Tools (least-privilege)

| Persona | `tools` (binding) | Verdict |
|---|---|---|
| Odin | `Read, Grep, Glob, Bash` (`:8`) | ❌ voir CH-B |
| Gandalf | `Read, Grep, Glob, Write, Edit, WebSearch, WebFetch` (`:10`) | ✅ `Write/Edit` pour `specs/instructions/`, web obligatoire par charte |
| Gimli | `Read, Edit, Write, Bash, Grep, Glob` (`:11`) | ✅ exactement le nécessaire ; pas de `Task` = correct |
| Legolas | `Read, Grep, Glob, Bash` (`:12`) | ✅ **exemplaire** — pas de `Write/Edit`, ce qui **mécanise** « ne corrige jamais le code » (`legolas.md:25-26`). Le tools **applique** la charte. |
| Helm | `Read, Grep, Glob, Bash` (`:13`) | ⚠️ voir ci-dessous |
| Loki | `Read, Write, Edit, Grep, Glob, Bash, WebFetch, WebSearch` (`:14`) | ✅ `Bash` requis par la boucle de rastérisation (`loki.md:72-74`), `Read` pour regarder le PNG (`:75`), web pour la veille (`:30-31`) — parfaitement aligné |
| Nathalie | `Read, Write, Edit, Grep, Glob, Bash, WebSearch, WebFetch` (`:15`) | ✅ conforme à l'élargissement du 2026-07-05 (`nathalie.md:45-49`) |

**❌ CH-B — Odin : jumeau exact de CH-1 (Aragorn).** `odin.md:9` déclare
`guardrails: [identity, perimeter, delegation]` et sa charte décrit le relais d'*« un subagent
(dispatché via l'outil Agent) »* (`odin.md:108-110`), avec un protocole de restitution détaillé
(`:111-122`). Or `bindings/iakaframe-claude-default.md:8` ne lui accorde **pas `Task`**. Le
`delegation-guard` (PreToolUse/PostToolUse sur **`Task`**) est donc **inerte** pour lui — même
diagnostic que la dimension 6 de l'audit Aragorn.

> **Nuance qui rend le cas d'Odin moins urgent qu'Aragorn** : Odin tourne **majoritairement en
> thread principal**, où il dispose de `Task` **nativement** — le contrat de subagent ne s'y applique
> pas. L'incohérence est donc **latente** : elle ne se manifeste que si Odin est dispatché **comme
> subagent**. Réelle, mais au risque opérationnel bien plus faible. **Arbitrage décideur (§ 7).**

**⚠️ Helm : `Bash` sans `Write/Edit` pour un rôle de production.** Sa charte prévoit bascule d'alias,
configuration de proxy inversé, SSO et **rollback documenté** (`helm.md:25-27,34-35`). Produire une
« procédure de rollback documentée » et modifier une configuration de proxy sont des **écritures**.
Il n'a que `Bash` — même schéma que CH-3 chez Aragorn, tranché par le décideur en faveur d'un
`Write` **borné**. Le parallèle est direct.

### Dimension 5 — Skills

| Persona | `skills:` | Verdict |
|---|---|---|
| Odin | `[iakaframe-odin, iakastart]` | ⚠️ **`iakastart` n'est jamais déployée** par `affectPersona` : `SKILL_OF.portefeuille` ne rend qu'`iakaframe-odin` (`agents.js:29-37`). Cause traitée dans le lot skills. |
| Gandalf | `[iakaframe-cadrage]` | ✅ + `subskills: [iakaframe-jalon]` |
| **Gimli** | `[]` | ⚠️ **seul agent sans skill** — voir ci-dessous |
| Legolas | `[iakaframe-qualite]` | ✅ |
| Helm | `[iakaframe-deploiement]` | ✅ (via `SKILL_OVERRIDE_OF`, `agents.js:42-44`) |
| Loki | `[iakaframe-naonedge]` | ✅ |
| Nathalie | `[iakaframe-nathalie, iakaframe-memoire-humaine]` | ✅ canon — mais 2ᵉ skill non déployée (même cause qu'Odin) |

**Gimli `skills: []` — défaut ou choix ?** C'est un **choix assumé et documenté** :
`gimli.md:16` (« Pas de skill dédiée : porté par le `CLAUDE.md` du projet »), `agents.js:33`
(`fabrication: ''`), `agents.js:105-106` (message dédié), et le cœur GUI le confirme
(`roster.ts:31` : `fabrication: []`). Les **quatre couches sont cohérentes** — ce n'est donc **pas
une dérive**.

La vraie question est de **conception** : la logique « le `CLAUDE.md` du projet porte le savoir-faire
dev » tenait quand le `CLAUDE.md` était le seul véhicule. Depuis, la doc officielle Claude Code
recommande explicitement de sortir en skill *« une section de CLAUDE.md devenue une procédure plutôt
qu'un fait »*, la skill n'étant chargée qu'à l'usage. Or Gimli **a** des procédures stables et
transverses aux projets : commits conventionnels atomiques, interdiction de `reset --hard` /
`push --force`, worktrees parallèles, remise obligatoire à Legolas. Ce sont des **procédures de
méthode**, pas des faits de projet — donc de bons candidats à une skill `iakaframe-fabrication`.

> **Reco Gandalf : ouvrir la question, ne pas la trancher ici** — c'est un choix d'architecture
> (§ 7). Noter qu'un `skills: []` restera **parfaitement valide** après le lot skills : le contrat
> omet simplement la ligne (critère B7 de l'instruction skills).

### Dimension 6 — Hooks

- **identity-guard** (Stop/SubagentStop) : actif pour les 7. ✅
- **perimeter-guard** (PreToolUse `Edit|Write|Bash|NotebookEdit`) : actif pour les 7 (tous ont au
  moins `Bash`). ✅
- **delegation-guard** (PreToolUse/PostToolUse **`Task`**) : **inerte pour Odin** (CH-B) — seule
  persona à déclarer `delegation` sans posséder `Task`. Les 6 autres ne déclarent pas `delegation` :
  cohérent. ❌ *(Aragorn est désormais correct : `Task` lui a été accordé, `binding:9`.)*
- **⚠️ Point d'attention transverse — pastille dynamique.** Quatre personas ont une pastille
  **variable** : Gimli (`🔴` P2 / `🟢` P3, `gimli.md:55-56`), Legolas (idem, `legolas.md:69-70`),
  Loki et Nathalie (« phase servie », `🟠` par défaut). Leur frontmatter ne déclare **qu'une seule**
  valeur (`pastille: "🔴"` / `"🟠"`). Si l'`identity-guard` valide la pastille **contre le
  frontmatter**, il produira des **faux positifs** en P3 pour Gimli/Legolas. **À vérifier en
  exécution** — je n'ai pas audité le code du hook, cette instruction ne l'affirme pas.

### Dimension 7 — Cohérence des 3 couches

- **Canon ↔ déployé ↔ golden** : garanti par le générateur + les goldens **pour les champs
  projetés** (`description`, `tools`, `guardrails`, corps). ✅
- **❌ Champs canon NON projetés, donc non gardés** : `roleKey` (CH-A), `royaume`, `pastille`,
  `vignette`, **et `skills`**. Le générateur les ignore tous
  (`cli/src/lib/generate-agents.js:54-65`). `roleKey` est le plus grave car une **table concurrente**
  existe et diverge (§ 3). *(Le cas de `skills` est traité par
  `parite-skills-generateur-deploiement.md` § 5.2.)*
- **⚠️ Cœur GUI incomplet** : `roster.ts` ne connaît que **7 rôles** — **Helm est absent** des
  `DEFAULT_NAMES` et `DEFAULT_SKILLS` (`roster.ts:16-35`), conséquence de son rattachement à
  `coordination`. Le roster canonique GUI ne peut donc pas représenter le squad prod.

## 5. Améliorations proposées (priorisées)

### Quick wins

| Id | Amélioration | Fichiers | Critère d'acceptation |
|---|---|---|---|
| QW-1 | **Réciproquer la RQV chez Nathalie** | `library/personas/nathalie.md` (§ Périmètre ou § Gate) | Nathalie décrit sa part du document d'évaluation de version, en miroir de `legolas.md:54-60` ; `RQV` présent des deux côtés |
| QW-2 | **Jalon chez Gimli** | `library/personas/gimli.md` (§ Gate) | la remise à Legolas est matérialisée par `iakaframe jalon` (émetteur Gimli / récepteur Legolas), cohérent avec l'interdiction d'auto-validation `:42-46` |
| QW-3 | **Jalon chez Odin** | `library/personas/odin.md` (§ Périmètre / Gate) | les transitions portefeuille (switch, démarrage, chantier transverse) sont posées en jalon ; récepteur = l'utilisateur |
| QW-4 | **Déployer `iakastart`** (Odin) et `iakaframe-memoire-humaine` (Nathalie) | — | **traité par le lot skills** ; noté ici pour traçabilité, **pas de double implémentation** |

> ⚠️ **QW-1/2/3 modifient des personas → critère de « fini » § 6 déclenché.**
> QW-2/QW-3 **dépendent** du lot skills (sinon le jalon reste non outillé, cf. dim. 3).

### Chantiers

| Id | Chantier | Enjeu | Critère d'acceptation |
|---|---|---|---|
| **CH-A** | **Réconcilier `roleKey` canon ↔ `ROLE_OF` ↔ cœur GUI** (6/8 divergents) | cause racine active, invisible à toute garde (§ 3) | un **vocabulaire unique** de rôles ; `ROLE_OF` **dérivé du canon** ou garde de parité `roleKey`↔`ROLE_OF` ; test rouge en cas de divergence ; `SKILL_OVERRIDE_OF` pour Helm devenu inutile |
| **CH-B** | **Trancher `Task` chez Odin** | jumeau de CH-1 ; `delegation` déclaré mais garde inerte (dim. 4+6) | soit `Task` au binding et garde active ; soit `guardrails` et charte `:108-110` corrigés |
| CH-C | **Helm : `Write` borné ?** | procédure de rollback + configs sont des écritures (dim. 4) | soit `Write` borné aux artefacts d'exploitation (parallèle CH-3 Aragorn), soit charte précisant le canal |
| CH-D | **Skill `iakaframe-fabrication` pour Gimli ?** | procédures de méthode stables aujourd'hui dans le `CLAUDE.md` (dim. 5) | décision explicite : skill créée **ou** `skills: []` confirmé comme choix documenté |
| CH-E | **Helm dans le roster GUI** | `roster.ts:16-35` ignore le rôle déploiement (dim. 7) | le roster canonique GUI représente le squad prod, ou le décideur acte l'exclusion |
| CH-F | *(à vérifier)* **Pastille dynamique vs identity-guard** | faux positifs possibles en P3 (dim. 6) | vérifier le hook ; si validation stricte contre frontmatter → tolérer le jeu de pastilles déclaré en charte |

## 6. Critère de « fini » (celui qui a coûté un cycle au lot précédent)

> **Rappel non négociable.** Tout changement touchant **une persona** (`library/personas/*.md`) ou
> **le binding** (`bindings/iakaframe-claude-default.md`) impose, **dans le même lot** :
> 1. `node cli/scripts/gen-agents-golden.mjs` — régénérer les **8** goldens ;
> 2. `iakaframe agents generate --global` puis `--check` (sortie 0) — régénérer le déployé ;
> 3. **re-vendorer côté GUI** les personas / binding / goldens modifiés vers
>    `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/` ;
> 4. rejouer **les deux** suites (CLI `node --test` **et** GUI `npm run test`).
>
> **Spécifique à ce lot — CH-B touche le binding d'Odin** : il faut **en plus** mettre à jour
> `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:153`, qui assert **en dur**
> `toolsForPersona(binding, "odin") == ["Read","Grep","Glob","Bash"]`. **Sans cette mise à jour, la
> GUI casse.** C'est précisément le type d'oubli qui a coûté un cycle au lot précédent.
>
> **CH-A est le cas piège** : `roleKey` **n'étant pas projeté** dans le contrat, le modifier
> **ne changera aucun golden** — les suites resteront vertes. Ne pas en conclure que rien n'est
> cassé : la vérification de CH-A passe par une **garde dédiée** (à créer), pas par les goldens.

## 7. Points que SEUL le décideur tranche

1. **CH-A — quel vocabulaire de rôles fait foi ?** Aligner le **canon** sur le CLI/GUI
   (`cadrage→architecture`, `dev→fabrication`, `qualite→tests`, `design→graphisme`,
   `documentation→doc`, `deploiement→…`), ou aligner **CLI+GUI** sur le canon ? *Reco Gandalf :
   aligner sur le **canon**, qui est la source de vérité et dont les termes sont plus proches du
   vocabulaire de la méthode — mais c'est le sens le plus coûteux (touche CLI + cœur GUI + tests).*
   **Sous-question bloquante** : quel `roleKey` pour **Helm** ? `deploiement` (canon) créerait un
   8ᵉ rôle canonique, absent du cœur GUI (CH-E).
2. **CH-B — `Task` pour Odin ?** (A) l'accorder, cohérent avec l'arbitrage rendu pour Aragorn et
   avec sa charte `:108-122` ; ou (B) retirer `delegation` de ses `guardrails` et corriger la charte,
   au motif qu'il dispatche depuis le thread principal où il a `Task` nativement. *Reco Gandalf :
   (A)*, par symétrie avec CH-1 et parce que sa charte **décrit déjà** la capacité.
3. **CH-C — `Write` borné pour Helm ?** *Reco Gandalf : oui, borné aux artefacts d'exploitation*
   (procédure de rollback, configs de bascule), **exclu** du code applicatif — décalque de
   l'arbitrage CH-3 rendu pour Aragorn.
4. **CH-D — skill pour Gimli ?** Créer `iakaframe-fabrication`, ou confirmer `skills: []` ?
   *Reco Gandalf : ouvrir* — les procédures existent et sont transverses aux projets ; mais le choix
   actuel est cohérent sur 4 couches, donc **rien ne presse**.
5. **CH-E — Helm au roster canonique GUI ?** Dépend de la réponse au point 1.
6. **Ordre d'exécution.** Odin propose *Odin → Gimli → jalon Helm/Legolas*. **L'audit propose un
   autre ordre** (§ 8) : le 3ᵉ item est déjà fait (§ 0) et CH-A prime. **Arbitrage décideur.**

## 8. ~~Ordre d'exécution recommandé~~ — ⛔ **SUPERSÉDÉ par la série de phase 1** (2026-07-20)

> ⛔ **CE § NE DOIT PLUS ÊTRE APPLIQUÉ TEL QUEL. Canon périmé, conservé pour trace.**
>
> **Ce qui l'a supersédé** : la stratégie a changé — l'amélioration des personas se fait désormais
> **une persona à la fois**, dans la **série de phase 1** (7 instructions `persona-*-amelioration.md`),
> dont **l'ordre a une source unique** : **`phase1-inventaire-bibliotheque.md` § 0.1 et § 0.2**.
>
> **Trois contradictions actives à neutraliser** si ce § était suivi :
> 1. La ligne « rang 3 » **groupe** QW-1 (RQV Nathalie) et QW-2/3 (jalon Gimli, Odin) en **un seul
>    lot** — cela contredit **« un commit par persona »**.
> 2. Ce groupage **annulerait les trois dépendances** établies en phase 1
>    (**Gimli→Legolas**, **Loki→Nathalie**, **Legolas→Nathalie**) : mettre Nathalie et Gimli dans le
>    même commit rend l'ordre canon→citation **inexprimable**.
> 3. Le **« principe de groupage »** énoncé plus bas (économiser des cycles de régénération) est
>    **explicitement écarté** en phase 1, au profit de la traçabilité par persona.
>
> **Ce qui reste valide dans ce fichier** : l'**audit** (§§ 1-7) et les **arbitrages** (§ 13). Seul
> **l'ordonnancement du § 8** est périmé.
>
> *(Mention ajoutée au gate 7 : un canon périmé resté lisible comme actif est précisément ce que le
> principe `canon-avant-citation` interdit — une citation doit pouvoir être résolue vers un canon
> **en vigueur**.)*

| Rang | Lot | Justification |
|---|---|---|
| **0** | *(préalable)* `parite-skills-generateur-deploiement.md` | sans lui, `iakaframe-jalon` est inerte → tout travail jalon est de la prose non outillée |
| **1** | **CH-A** (`roleKey`) | seule **cause racine active** ; touche les 8 personas ; aucune garde ne la voit |
| **2** | **CH-B** (`Task` Odin) + **CH-C** (`Write` Helm) | même nature, mêmes fichiers (binding + 1 persona), même rituel de régénération → **un seul lot**, un seul cycle golden/vendorage |
| **3** | **QW-1** (RQV Nathalie) + **QW-2/3** (jalon Gimli, Odin) | purement rédactionnel sur personas ; groupé pour n'imposer **qu'une** régénération |
| **4** | CH-D, CH-E, CH-F | dépendent des arbitrages 1 et 4 ; aucun risque opérationnel immédiat |

> **Principe de groupage** : chaque lot touchant une persona ou le binding coûte un cycle complet
> (golden + déployé + vendorage + 2 suites). Regrouper les changements de même nature **divise le
> nombre de cycles** — c'est exactement le coût qui a été payé au lot précédent.

## 9. Critères d'acceptation (testables)

| # | Critère | Vérification |
|---|---|---|
| C1 | **CH-A** : un seul vocabulaire de rôles entre `library/personas/*.md`, `agents.js:17-26`, `roster.ts` | table de correspondance 8/8 en accord |
| C2 | **CH-A** : une garde rend la divergence `roleKey`↔`ROLE_OF` **rouge** | modifier un `roleKey` sans la table ⇒ test rouge |
| C3 | **CH-A** : `SKILL_OVERRIDE_OF` (`agents.js:42-44`) supprimé ou justifié | Helm résout `iakaframe-deploiement` **sans exception codée** |
| C4 | **CH-B** : cohérence Odin `guardrails`↔`tools` | soit `Task` au binding `:8`, soit `delegation` retiré de `odin.md:9` — jamais l'état actuel |
| C5 | **CH-B** : test GUI mis à jour | `parite-generateurs.test.ts:153` reflète les tools réels d'Odin ; suite GUI verte |
| C6 | **QW-1** : `RQV` présent dans `nathalie.md`, cohérent avec `legolas.md:54-60` | grep + relecture croisée |
| C7 | **QW-2/3** : Gimli et Odin décrivent un jalon **à une transition réelle** | pas de paragraphe générique copié-collé |
| C8 | **CH-C** : le canal d'écriture de Helm est explicite | `Write` borné au binding **ou** charte précisant le canal |
| C9 | Après **chaque** lot : `agents generate --check` sort **0** | exit code |
| C10 | Après **chaque** lot : suites CLI **et** GUI vertes | § 6 |
| C11 | `vendor-check` (si livré) sort **0** après re-vendorage | croisement avec le lot 1 |
| C12 | Aucune régression sur les dimensions ✅ (notamment MoE) | relecture ciblée |

## 10. Estimation (jalon P1→P2)

Par lot, selon l'ordonnancement § 8 :

| Lot | Charge | Complexité | Risque |
|---|---|---|---|
| **1 — CH-A** (`roleKey`) | **1,5 à 2 j-h** | **moyenne-haute** — touche 8 personas + CLI + **cœur GUI** + tests des deux dépôts ; renommage de vocabulaire à effet large | **moyen-haut** : `roleKey` n'étant pas dans les goldens, **les suites peuvent rester vertes tout en laissant une incohérence** → exige la garde C2, écrite **avant** le renommage |
| **2 — CH-B + CH-C** | **0,5 j-h** | faible — 1 ligne de binding, 1 charte, + test GUI `:153` | faible, **à condition** de ne pas oublier § 6 |
| **3 — QW-1/2/3** | **0,5 j-h** | faible — rédactionnel pur | faible |
| **4 — CH-D/E/F** | **0,5 à 2 j-h** *(non chiffrable avant arbitrage)* | variable | CH-D = création de skill (≈1 j) ; CH-F = vérification (≈0,25 j) |

- **Total hors lot 4 : ~2,5 à 3 jours-homme.**
- **Inconnues** :
  - **le sens de réconciliation de CH-A** (point décideur n°1) fait varier la charge du simple au
    double : aligner le canon = 8 fichiers ; aligner CLI+GUI = 2 dépôts, table + cœur + tests ;
  - **le rôle de Helm** (7 rôles canoniques + 1, ou rattachement conservé) conditionne CH-E et
    l'ampleur du toucher au cœur GUI ;
  - **comportement réel de l'`identity-guard` sur pastille dynamique** (CH-F) — non audité ici,
    à vérifier avant de conclure ;
  - **effet de bord du renommage `roleKey`** sur des consommateurs non audités (kits `kits/*`,
    `teams/iakaframe-8.md`, marqueurs `.claude/iakaframe-kit.json` déjà écrits sur disque) : à
    inventorier en ouverture du lot 1.

## 11. Fichiers de référence

- `library/personas/{odin,gandalf,gimli,legolas,helm,loki,nathalie}.md` — les 7 chartes auditées
- `library/personas/odin.md:9,108-122` — `delegation` déclaré + dispatch décrit (CH-B)
- `library/personas/gimli.md:8,16,38-46` — `skills: []` + absence de jalon (CH-D, QW-2)
- `library/personas/legolas.md:50-52,54-60` — jalon présent + RQV engageant Nathalie (QW-1)
- `library/personas/helm.md:25-27,34-35,42-44` — écritures implicites (CH-C), jalon présent
- `library/personas/nathalie.md` — RQV absente (QW-1)
- `bindings/iakaframe-claude-default.md:8-15` — allowlists
- `cli/src/lib/agents.js:17-26,29-44` — `ROLE_OF` divergent + `SKILL_OVERRIDE_OF` (CH-A)
- `cli/src/lib/generate-agents.js:54-65` — champs projetés : `roleKey` absent (CH-A)
- `~/work/iakaFrameGUI/packages/core/src/roster.ts:16-35` — 7 rôles, Helm absent (CH-E)
- `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:153` — tools d'Odin en dur (C5)
- `specs/instructions/audit-amelioration-aragorn.md` — grille de référence + arbitrages CH-1/CH-3

## 12. Sources (fait externe vérifié — load-bearing pour CH-D)

- Claude Code — Extend Claude with skills (« créer une skill quand une section de CLAUDE.md est
  devenue une procédure plutôt qu'un fait » ; le corps n'est chargé qu'à l'usage) :
  https://code.claude.com/docs/en/skills
- Claude Code — Create custom subagents (champ `skills` de préchargement ; `Task`/`Agent` pour la
  délégation) : https://code.claude.com/docs/en/sub-agents

---

## 13. Note additive — arbitrages du décideur (2026-07-19)

> Ajout **postérieur** à l'analyse ci-dessus, qui reste inchangée. Cette note consigne les décisions
> prises sur les points « que SEUL le décideur tranche » (§ 7).

### 13.1 CH-B — `Task` pour Odin : **ACCORDÉ** (option A)

Par **symétrie avec CH-1** (arbitrage rendu pour Aragorn, cf.
`audit-amelioration-aragorn.md` § Note additive). `Task` est **accordé** à Odin dans
`bindings/iakaframe-claude-default.md:8`. Conséquences :

- le **`delegation-guard`** (PreToolUse/PostToolUse sur `Task`) devient **actif** pour Odin, ce qui
  lève l'incohérence dimension 4 + dimension 6 relevée au § 4 ;
- **la charte n'a pas à être corrigée** : `odin.md:9` (`guardrails: [… delegation]`) et
  `odin.md:108-122` (relais d'un subagent « dispatché via l'outil Agent ») **décrivaient déjà** la
  capacité désormais réelle. C'est le binding qui rattrape la charte, pas l'inverse ;
- le verdict dimension 4 d'Odin passe de ❌ à ✅ une fois le lot exécuté ; la dimension 6 également.

**Piège à ne pas redécouvrir en cours de route — c'est un critère de « fini », pas un effet de bord.**
Le test GUI `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:153` assert
**en dur** :

```
expect(toolsForPersona(binding, "odin")).toEqual(["Read", "Grep", "Glob", "Bash"]);
```

**Modifier le binding d'Odin sans mettre à jour cette ligne casse la suite GUI.** C'est exactement le
type d'oubli qui a coûté un cycle au lot précédent. La séquence complète du § 6 s'applique
intégralement (goldens → déployé → re-vendorage → 2 suites), **plus** cette mise à jour d'assert.

> ⚠️ **Recoupement avec le lot skills.** L'arbitrage « `Skill` dans les `tools` » (accordé le même
> jour, cf. `parite-skills-generateur-deploiement.md` § 13.1) modifie **également** ce binding et
> **également** ces assertions GUI (4 endroits, dont `:153`). Si les deux lots sont exécutés
> séparément, `:153` sera touchée **deux fois**. L'exécutant du second lot doit partir de l'état
> **réel** du fichier, jamais de l'état décrit dans l'analyse d'origine.

### 13.2 CH-A — `roleKey` : **TRANCHÉ — aligner le canon sur CLI+GUI**

Direction retenue par le décideur. Le **canon cède** et adopte le vocabulaire déjà partagé par le CLI
et le cœur GUI :

| Fichier | Changement |
|---|---|
| `library/personas/gandalf.md:5` | `cadrage` → `architecture` |
| `library/personas/gimli.md:5` | `dev` → `fabrication` |
| `library/personas/legolas.md:5` | `qualite` → `tests` |
| `library/personas/loki.md:5` | `design` → `graphisme` |
| `library/personas/nathalie.md:5` | `documentation` → `doc` |
| `library/personas/helm.md:5` | **inchangé** (`deploiement`) — cf. ci-dessous |

**Motif et réserve assumée** : le canon étant le seul des trois en désaccord, la présomption est
qu'il a dérivé ; et la direction coûte moitié moins. **Cette direction plie néanmoins la source de
vérité à son implémentation, à rebours du sens habituel de la méthode.** Choix **assumé**, non
généralisable — le détail du motif, de la réserve et du coût sémantique accepté est consigné en
`specs/instructions/decision-rolekey-reconciliation.md` § 9.1-9.2. *(Ma recommandation d'origine
— § 7 de cette même note — était la direction inverse ; elle n'a pas été suivie.)*

**Cas Helm — recommandation Gandalf, sous-question encore à valider.** Helm **conserve
`deploiement`**, promu **rôle canonique de plein droit** dans le CLI (`agents.js:17-37`) et le cœur
GUI (`roles.ts:26-34`, `roster.ts:16-35`). Motif : les 6 autres cas sont une dérive **lexicale**
(même concept, deux mots) tandis que Helm est une **lacune de modélisation** (CLI et GUI n'ont
**aucun** rôle de déploiement) — appliquer la direction à Helm ne serait pas aligner un mot mais
**supprimer un rôle**, dégradant la dimension MoE (✅ 7/7, § 4). Conséquences : `SKILL_OVERRIDE_OF`
(`agents.js:42-44`) **disparaît** (critère C3) ; **CH-E est absorbé** par ce changement au lieu de
rester un arbitrage distinct ; et une **8ᵉ vignette** devient nécessaire (`roleIndex: 7`,
`roles.ts:21-22`) — **dépendance design (Loki), à trancher**. Argumentaire complet :
`decision-rolekey-reconciliation.md` § 9.4.

**Contrainte d'ordre — critère de « fini »** : `roleKey` n'étant projeté dans **aucun golden**, les
suites **resteront vertes même si l'incohérence persiste**, et après un renommage **partiel ou raté**.
La garde de parité `roleKey` ↔ `ROLE_OF` **s'écrit AVANT le renommage** et doit être **vue rouge sur
l'état actuel** (6/8 divergents) avant toute modification. Sans cela, le lot n'est pas fini quelle
que soit la couleur des suites.

### 13.3 Récapitulatif des 4 arbitrages bloquants — tous rendus (2026-07-19)

| # | Arbitrage | Décision | Lot |
|---|---|---|---|
| 1 | **CH-B — `Task` pour Odin** | **ACCORDÉ** (§ 13.1) | 3 |
| 2 | **`Skill` dans les `tools`** | **ACCORDÉ**, aux **8** personas | 2 |
| 3 | **`switch.js:79`** | **INTÉGRÉ au lot skills** (pas de backlog séparé) | 2 |
| 4 | **CH-A — `roleKey`** | **Canon aligné sur CLI+GUI** (§ 13.2) | 3 |

### 13.4 Estimation consolidée révisée (jalon P1→P2)

| Lot | Contenu | Avant | **Après arbitrages** | Écart |
|---|---|---|---|---|
| **1** | `vendor-check` cross-repo | ~1 j-h | **~1 j-h** | — |
| **2** | Skills + `switch.js:79` | ~2,5-3 j-h | **~2,75-3,25 j-h** | **+0,25** |
| **3** | Roster (CH-A + CH-B + CH-C + QW-1/2/3) | ~2,5-3 j-h | **~2,25-2,5 j-h** | **−0,25 à −0,5** |
| | **Total** | **~6-7 j-h** | **~6 à 6,75 j-h** | **≈ −0,25** |

Détail du lot 3 révisé : CH-A ~1,25-1,5 j-h *(5 lignes de canon + promotion de `deploiement` côté
CLI/GUI + garde de parité écrite en premier)* · CH-B + CH-C ~0,5 j-h *(binding + charte + 4 assertions
GUI)* · QW-1/2/3 ~0,5 j-h *(rédactionnel groupé, une seule régénération)*.

**Lecture** : le total **atterrit en bas de la fourchette annoncée**, autour de **~6,5 j-h**. La
direction la moins coûteuse sur CH-A (−0,75 j-h environ face à la direction inverse) **absorbe** le
surcoût de `switch.js` (+0,25 j-h) et une part du surcoût `Skill`.

**Non compris dans ce chiffrage — deux points à provisionner à part :**
- **8ᵉ vignette** pour le rôle `deploiement` : dépendance **design (Loki)**, pas du dev.
- **CH-D / CH-F** (skill Gimli, pastille dynamique) : ~0,5 à 1,25 j-h, **toujours ouverts**.

### 13.5 Helm — **ARBITRÉ : `deploiement` promu rôle canonique**

La recommandation Gandalf (§ 13.2) est **retenue**. `deploiement` devient un **rôle canonique de plein
droit** dans `cli/src/lib/agents.js:17-37` et dans le cœur GUI (`roles.ts:26-34`, `roster.ts:16-35`),
avec `roleIndex: 7`. **`library/personas/helm.md:5` reste inchangé.**

**La distinction qui fonde l'arbitrage — à conserver, car elle explique pourquoi CH-A s'applique à 6
cas et pas à 7 sans que ce soit une exception de complaisance :**

| | Les 6 autres cas | **Helm** |
|---|---|---|
| Nature | dérive **lexicale** | lacune de **modélisation** |
| Situation | `cadrage` et `architecture` désignent **le même rôle** | `deploiement` et `coordination` sont **deux concepts distincts** |
| Côté CLI/GUI | la case existe, sous un autre nom | **la case n'existe pas** — `roles.ts:26-34` ignore le déploiement |
| Aligner le canon reviendrait à | **changer un mot** | **supprimer un rôle** |

> CH-A tranche une question de **vocabulaire**. Il ne peut donc pas trancher, par effet de bord, la
> **suppression d'un rôle**. Le rattachement de Helm à `coordination` (`cli/src/lib/agents.js:23`)
> n'a jamais été un choix de vocabulaire : c'est un rangement par défaut faute de case disponible,
> immédiatement rattrapé par l'exception codée `SKILL_OVERRIDE_OF` (`:42-44`). La règle générale
> reste donc appliquée **sans exception** : elle ne rencontre simplement pas son objet ici.

**Conséquences actées** : `SKILL_OVERRIDE_OF` **supprimée** (critère C3) · **CH-E absorbé** dans le
lot 3 · `roleIndex: 7` → cf. § 13.6.

### 13.6 Vignette du rôle `deploiement` — **DIFFÉRÉ LEVÉ : dans le périmètre du lot 3**

> ⚠️ **Arbitrage révisé (2026-07-19, postérieur au différé).** Le différé initialement acté est
> **levé** : la 8ᵉ paire de `CASTING_GRADIENTS` est **livrée dans le lot 3**. Les §§ 13.6.1 et 13.6.2
> restent **inchangés et valides** (ils établissent les faits) ; les §§ 13.6.3 à 13.6.5 sont
> **réécrits** en conséquence. Motif du revirement en § 13.6.3.

> Exigence du coordinateur : le différé ne doit pas produire un lot qui livre **un rôle à moitié**.
> Les trois points ci-dessous sont **vérifiés dans le code**, pas supposés.

#### 13.6.1 Constat préalable — une vignette n'est pas un asset

`casting.ts:2-4` : les helpers de casting produisent **« dégradés + initiales »**, consommés par
`Vignette.tsx`. **Il n'existe aucune image à produire** : une vignette = **un couple de couleurs**
(`CASTING_GRADIENTS`, `casting.ts:8-16`) + les **initiales** du nom (`initialsOf`, `:25-31`).

> **Le différé est donc beaucoup moins coûteux qu'il n'y paraît** : lever la dette = **ajouter une
> 8ᵉ paire hexadécimale** dans un tableau, soit **~0,1 j-h de dev**. Ce qui relève réellement de
> Loki n'est pas une production graphique, c'est **le choix des deux valeurs** — une décision de
> charte, pas un livrable design. À prendre en compte dans l'arbitrage du différé : il est presque
> gratuit à lever.

#### 13.6.2 Comportement de repli — **dégradation gracieuse confirmée, avec une collision**

Code vérifié, `casting.ts:19-22` :

```js
export function vignetteGradient(roleIndex: number): [string, string] {
  const i = Number.isFinite(roleIndex) ? Math.abs(Math.trunc(roleIndex)) : 0;
  return CASTING_GRADIENTS[i % CASTING_GRADIENTS.length];
}
```

| Question | Réponse vérifiée |
|---|---|
| Est-ce que ça casse ? | **Non.** La fonction est **bornée par construction** (`% length`) et documentée « repli sur le premier » (`casting.ts:7`). Jamais d'exception, jamais `undefined`, jamais `NaN`. |
| Que rend l'affichage ? | `7 % 7 = 0` → **le dégradé or de `portefeuille`** (`casting.ts:9`). Helm s'affiche **dans les couleurs d'Odin**. |
| Le tri est-il affecté ? | **Non.** `claudeCode.ts:36` et `agentsMd.ts:36` trient par `roleIndex` puis `id` : `7` trie **en dernier**, de façon déterministe. **Aucune perte de déterminisme des adaptateurs.** |
| `roleIndexOf` ? | `roles.ts:62-63` renvoie `7` dès que `deploiement` est dans `CANONICAL_ROLES` ; sinon `?? 0` — même repli borné. |

**Le seul défaut est donc cosmétique et borné : une collision de couleur entre Helm et Odin.** Il est
de surcroît **peu exposé en pratique** : Odin est une persona de **portefeuille**
(`PORTFOLIO_PERSONAS = ['odin']`, `cli/src/lib/agents.js:55`) et `fullteam` **l'exclut** des équipes
projet (`:137`) — les deux ne co-apparaissent quasiment jamais dans un même rail.

> **Réserve à documenter** : la collision reste une **incohérence interne** de la GUI, puisque la
> pastille de Helm est **🟣** (`helm.md:7`) tandis que sa vignette serait **or**.

#### 13.6.3 Différé levé — la 8ᵉ paire est livrée dans le lot 3

**Décision** : ajout de la **8ᵉ entrée** à `CASTING_GRADIENTS` (`casting.ts:8-16`) **dans le
périmètre du lot 3**. La collision `7 % 7 = 0` est **supprimée à la livraison**.

**Motif du revirement**, en deux points :

1. **Le différé avait été acté en croyant différer un travail de design.** Le § 13.6.1 établit qu'il
   n'en est rien : une vignette est un **couple hexadécimal**, pas un asset. Le coût réel est
   **~0,1 j-h de dev**. Différer un travail de cette taille coûte plus cher en suivi qu'en exécution.
2. **La collision n'est pas un défaut cosmétique anodin dans *cette* méthode.** Le repli ferait
   s'afficher **le squad prod (Helm) aux couleurs or du portefeuille (Odin)**. Or iakaframe est une
   méthode où **la couleur porte le sens** — la pastille est un invariant d'identité, au point
   d'être vérifiée par un hook. Laisser deux rôles partager une identité visuelle contredirait le
   principe même qui fonde le dispositif de badges. Ce qui serait une broutille ailleurs est ici une
   **incohérence de fond**.

**Ce qui reste à Loki** : le **choix des deux valeurs** (décision de charte), cf. § 13.6.5 — et cela
**ne bloque pas le lot**.

#### 13.6.4 Le rôle existe proprement même sans vignette — invariant conservé

Le fait qu'on livre la vignette **cette fois-ci** ne dispense pas de prouver la dégradation
gracieuse : c'est le **principe iaka**, il vaut indépendamment de cette livraison. Les critères
C13-C18 restent donc **obligatoires**.

**Critères d'acceptation (révisés) :**

> ⚠️ **Emplacement des tests — corrigé (gate Legolas).** Ces critères ne vivent **pas tous** dans
> `packages/core`. `roleIndexOf`/`CANONICAL_ROLES` sont dans le **cœur** (`packages/core/src/roles.ts`)
> mais `vignetteGradient`/`CASTING_GRADIENTS` sont dans l'**app** (`src/forge/casting.ts`) et
> `Vignette` dans ses composants. La colonne ci-dessous indique le **paquet réel**.

| # | Critère | Statut | Paquet & vérification |
|---|---|---|---|
| C13 | `roleIndexOf('deploiement') === 7` | **obligatoire** | **core** — `packages/core/__tests__/roles.test.ts` |
| C14 | `vignetteGradient(7)` renvoie un **tuple valide de 2 chaînes**, sans exception ni `undefined` | **obligatoire** | **app** — test unitaire `src/forge/` |
| C15 | `vignetteGradient(n)` reste borné pour tout `n` (0, 7, 99, −1, `NaN`) | **obligatoire** | **app** — test de robustesse |
| C16 | Le rendu d'une persona `roleIndex: 7` **n'émet ni erreur ni warning** | **obligatoire** | **app** — test de composant `Vignette` |
| C17 | Adaptateurs **déterministes** avec 8 rôles ; Helm trie **en dernier** | **obligatoire** | **core** — goldens `claudeCode` / `agentsMd` |
| C18 | `CANONICAL_ROLES` compte **8** entrées, `roleIndex` **0..7 sans trou ni doublon** | **obligatoire** | **core** — test d'invariant |
| C19 | `vignetteGradient(7) !== vignetteGradient(0)` — **aucune collision Helm ↔ Odin** | **obligatoire** *(requalifié)* | **app** — test unitaire |
| **C20** | **`CASTING_GRADIENTS.length >= CANONICAL_ROLES.length`** | **obligatoire** *(nouveau)* | **app**, **import inter-paquets** — cf. C20-bis |
| **C20-bis** | **`CASTING_GRADIENTS` est `export`é** depuis `src/forge/casting.ts:8` | **obligatoire** *(nouveau)* | prérequis de C20 — cf. encadré |

> ⚠️ **C20 exige un changement de code, à inscrire au périmètre du lot (gate Legolas).**
> `CASTING_GRADIENTS` (`src/forge/casting.ts:8`) est aujourd'hui une **const privée du module**, non
> exportée : **C20 n'est pas testable en l'état**. Le lot **doit** donc inclure l'ajout du mot-clé
> `export` — modification triviale et sans effet de bord (aucun consommateur externe existant), mais
> qui doit être **spécifiée** et non improvisée par l'exécutant.
>
> C20 confronte une donnée de l'**app** à une donnée du **cœur** : l'import
> `@iakaframe/core → CANONICAL_ROLES` depuis un test de `src/forge/` doit être **validé** (il est
> déjà pratiqué ailleurs dans l'app, mais à confirmer en ouverture de lot). **Repli acceptable si
> l'import inter-paquets pose problème** : dupliquer l'attendu en constante littérale (`>= 8`) dans
> le test, avec un commentaire pointant `roles.ts` — le critère perd sa généricité pour un 9ᵉ rôle
> mais reste une garde ; **à n'utiliser qu'en dernier recours**, la version générique étant le legs.

**Sort de C19 — tranché : il reste, requalifié.** Il ne devient pas sans objet, il **change de
nature** : de *garde du repli* il devient **preuve que la 8ᵉ paire a bien été ajoutée**. Sans lui,
un oubli d'ajout repasserait silencieusement par le modulo — exactement le défaut qu'on corrige.

**Mais C19 seul ne protège pas un 9ᵉ rôle**, d'où **C20**. C'est la vraie garde de non-régression :
le `% length` de `casting.ts:21` fait qu'un rôle surnuméraire **collisionne silencieusement** au lieu
d'échouer. C20 transforme ce silence en **test rouge** dès qu'un rôle est ajouté sans sa teinte.
C19 verrouille *ce* lot ; **C20 verrouille tous les suivants** — c'est lui le legs durable.

#### 13.6.5 Dépendance Loki — bornée, non bloquante

> **Aucun item de dette n'est à inscrire au backlog.** L'item qui figurait ici a été **supprimé** :
> la vignette est dans le périmètre du lot 3. *(Note à l'attention du coordinateur : rien à coller
> au backlog depuis ce paragraphe.)*

**Décision demandée à Loki — exactement une, et de petite taille :**

> Les **deux valeurs hexadécimales** du dégradé de casting du rôle `deploiement` (Helm), au format
> des sept existantes (`["#xxxxxx", "#xxxxxx"]` — ton principal + ton foncé), pour insertion en
> **index 7** de `CASTING_GRADIENTS` (`~/work/iakaFrameGUI/src/forge/casting.ts:8-16`).
>
> **Contraintes de charte** : cohérent avec la **pastille 🟣** de Helm (`helm.md:7`) ; **distinct**
> du violet `graphisme` `#7a3b86` (index 5) et de l'or `portefeuille` `#b8862b` (index 0) ;
> lisibilité des initiales blanches conservée sur le dégradé.

**Quand** : à l'**ouverture du lot 3**, en même temps que l'inventaire des consommateurs de `roleKey`
(§ 8, contrainte 3) — pas plus tôt, la demande n'a de sens qu'avec le rôle acté.

**Si la réponse n'arrive pas à temps — le lot n'est JAMAIS suspendu :**

1. L'exécutant pose une **valeur provisoire** respectant les contraintes ci-dessus (suggestion :
   violet/ardoise, ex. `["#5b5f8a", "#3a3d5c"]`), **marquée en commentaire** `// index 7 —
   deploiement : teinte provisoire, arbitrage de charte Loki en attente`.
2. **Tous les critères C13-C20 passent** avec cette valeur : le lot est **livrable et gate-able**.
3. La substitution ultérieure par la teinte définitive est un **changement de deux chaînes**, sans
   impact sur les tests (C19/C20 portent sur la **distinction** et le **compte**, jamais sur les
   valeurs elles-mêmes — c'est délibéré, pour que la charte puisse évoluer sans casser la suite).

> **Principe appliqué** : une décision de charte ne doit jamais **bloquer** une livraison technique.
> La valeur provisoire est le repli gracieux ; le commentaire garantit qu'elle ne se fossilise pas.

### 13.7 Points encore ouverts

CH-C (`Write` borné pour Helm — *inclus au chiffrage lot 3, mais non formellement arbitré*), CH-D
(skill `iakaframe-fabrication`) et CH-F (pastille dynamique vs identity-guard). **Aucun n'est
bloquant** pour engager la réalisation.

**Ne sont plus ouverts** : CH-E et le cas Helm (§ 13.5) ; la vignette du rôle `deploiement`
(§ 13.6, différé levé — dans le lot 3, avec dépendance Loki bornée et non bloquante).

**Aucun item de dette n'est issu de cette instruction.**

### 13.8 Critère de « fini » du lot 3 — **COMPLÉTÉ** (levée B-2 du gate Legolas)

> **Le § 6 et le § 13.5 étaient incomplets.** Ils n'énuméraient pas les points de rupture réels de la
> promotion de `deploiement` en 8ᵉ rôle. C'est **exactement la classe d'oubli qui a coûté un cycle en
> v0.17.14** : un changement structurel dont on ne liste pas les consommateurs. La liste ci-dessous
> **complète** le § 6 pour le lot 3 ; elle ne le remplace pas.

**(a) Tests qui CASSENT mécaniquement — à mettre à jour, non négociable**

| Fichier:ligne | Assertion | Action |
|---|---|---|
| `packages/core/__tests__/roster.test.ts:12` | `toHaveLength(7)` sur le roster canonique | → **8** |
| `packages/core/__tests__/roster.test.ts:33` | `t.personas` `toHaveLength(7)` | → **8** |
| `packages/core/__tests__/parite-generateurs.test.ts:147-156` | tools en dur (gandalf/gimli/odin) | cf. § 13.1 / lot 2 |

**(b) Commentaires et doc affirmant « 7 rôles » — deviennent faux**

`packages/core/src/roles.ts:2,6,26,37` · `packages/core/src/roster.ts:5,38,65` ·
`packages/core/src/method.ts:55`.

> Ce ne sont « que » des commentaires, mais `roles.ts:2` et `:26` **définissent le contrat de lecture**
> du module (« LISTE CANONIQUE FERMÉE des 7 rôles », « Les 7 rôles canoniques »). Les laisser
> produirait une doc qui **ment sur le code** — le défaut déjà relevé au backlog pour
> `docs/commandes.md`. **À traiter dans le lot**, pas après.

**(c) Consommateurs de `CANONICAL_ROLES` — inventaire à faire en ouverture de lot**

`src/components/PersonaEditor.tsx` · `src/forge/llm/prompt.ts` ·
`src/forge/ateliers/MethodeAtelier.tsx` · `src/forge/ateliers/WorkflowAtelier.tsx`.

> **Aucun n'est présumé cassé** : ils itèrent probablement sur la liste et absorberont une 8ᵉ entrée
> sans modification. Mais **aucun n'a été audité**, et l'absence de filet de compilation sur les clés
> de rôle (§ 3 de la note `decision-rolekey-reconciliation.md`) interdit de le supposer. **Vérification
> explicite exigée**, verdict consigné — y compris si le verdict est « rien à faire ».

**(d) Rappel — le rituel du § 6 s'applique intégralement en plus** : goldens → déployé → re-vendorage
GUI → les deux suites.

### 13.9 Estimation révisée — **~7 à 7,5 j-h** (levée du gate Legolas)

Le chiffrage précédent (**~6 à 6,75 j-h**) était **sous-estimé** : il ne provisionnait ni les points
de rupture du § 13.8, ni la recette réelle du critère A5 du lot 1.

| Lot | Avant | **Révisé** | Motif |
|---|---|---|---|
| **1** — `vendor-check` | ~1 j-h | **~1,25 j-h** | **+0,25** — volet de recette manuelle du drift réel (cf. `garde-vendor-check-cross-repo.md` § A5 révisé) |
| **2** — Skills + `switch.js` | ~2,75-3,25 j-h | **~2,75-3,25 j-h** | inchangé — le périmètre « union des 11 » **réduit** le déploiement mais ajoute le traitement de `DEFAULT_SKILLS` : compensation |
| **3** — Roster | ~2,25-2,5 j-h | **~2,75-3 j-h** | **+0,5** — tests `roster.test.ts`, 8 commentaires, inventaire des 4 consommateurs, `export` de `CASTING_GRADIENTS` |
| | ~6-6,75 | **~6,75 à 7,5 j-h** | |

**Total retenu : ~7 à 7,5 j-h**, en accord avec le chiffrage de Legolas. J'assume la sous-estimation
initiale : elle venait de n'avoir pas inventorié les consommateurs GUI du roster avant de chiffrer —
la même omission que celle qui fonde la levée B-2.

**Hors chiffrage** : CH-D et CH-F (~0,5 à 1,25 j-h, toujours ouverts) et la **teinte définitive** de
Loki (décision de charte, ~0 j-h de dev, non bloquante — § 13.6.5).

---

## Note additive — clôture de CH-F (2026-07-20)

**CH-F est CLOS — sans travail, par vérification.** Le chantier posait la question d'un
conflit entre une **pastille dynamique** (une persona employant une couleur variable selon la
phase) et l'`identity-guard`, avec le risque de **faux positifs en P3**. La question était
marquée « *(à vérifier)* » au tableau `:269` et « non audité ici » au `:383` : elle n'a jamais
été instruite, seulement soupçonnée.

**Le fait, établi au gate de fin de série de phase 1 puis revérifié à la source avant cette
clôture** (`preuve-avant-declaration`) :

- `kits/iakaframe-claude/global/hooks/guard-core.mjs:30` déclare une **liste blanche de six
  pastilles** (`PASTILLES`), et le verdict d'identité travaille sur cette liste ;
- le module ne référence **jamais** la persona ni son frontmatter — `grep -cE "roleKey|persona|frontmatter"`
  sur le fichier rend **0** ;
- ce que le garde contrôle est la **POSITION** de la pastille, qui porte le sens (avant le bloc =
  ouverture, après = clôture), documenté en toutes lettres à `guard-core.mjs:25-27` — **pas sa
  valeur** comparée à une couleur déclarée en charte.

**Conséquence** : une persona qui déclare une pastille et en emploie une autre selon la phase
**ne peut pas** déclencher de faux positif, puisque aucune comparaison au déclaré n'a lieu. La
prémisse du chantier — « si validation stricte contre frontmatter » (`:269`) — est **fausse**.
CH-F est sans objet, il n'appelle aucune modification de code ni de charte.

**Réserve à connaître, pour ne pas relire cette clôture comme un blanc-seing** : l'absence de
validation est ce qui *ferme* CH-F, mais c'est aussi une **garde plus faible qu'on ne le croyait**
— rien n'empêche une persona d'employer une pastille hors de son royaume, tant qu'elle appartient
à la liste blanche des six et qu'elle est bien positionnée. Ce n'est pas CH-F, ce n'est pas un
défaut ouvert ici, et ce n'est pas chiffré : c'est une propriété du dispositif, à connaître si
l'on venait un jour à vouloir un contrôle de cohérence pastille↔royaume.

*Arbitrage du décideur, 2026-07-20 : fermer. Coût réel : nul.*

---

## Note additive — clôture de CH-C et CH-D (2026-07-20)

Les deux derniers chantiers ouverts de cet audit sont **CLOS par la série de phase 1**. Constat
revérifié sur le disque avant consignation (`preuve-avant-declaration`), pas repris des rapports
de lot.

**CH-C — canal d'écriture de `specs/PROJET.md` / `Write` borné : CLOS** *(lot Helm, `3d12e39`,
gate Legolas PASS)*. Arbitrage du décideur : accorder `Write`. Livré en **deux volets
indissociables dans le même commit**, conformément à la doctrine que cette instruction pose
elle-même — accorder un droit d'écriture sans inscrire son bornage est un défaut :
- `bindings/iakaframe-claude-default.md:13` — `tools: [Read, Grep, Glob, Write, Bash]` ;
- `library/personas/helm.md:37` — section `## Obligation — bornage de l'écriture`, **dans le
  corps** de la charte et non dans la `description` frontmatter (champ de routage). C'était
  précisément le défaut relevé chez Gandalf (GD-3).
Le gate a jugé le bornage « substantiel et restrictif » : artefacts autorisés nommés (rollback,
config de bascule/alias, notes d'exploitation), exclusions nommées (code, tests, configs
applicatives, scripts de build → Gimli), clause de doute → abstention. Le gate de production
reste intact : écrire une procédure de rollback est une **préparation**, pas une bascule.

**CH-D — skill pour Gimli : CLOS** *(lot Gimli, `c3d8ca4`, gate Legolas PASS)*. Arbitrage du
décideur : **créer**, et structurer le savoir-faire dev **par fonction**. Livré :
- `library/personas/gimli.md:8` — `skills: [iakaframe-fabrication]` (il était le seul agent du
  roster avec `skills: []`) ;
- `library/skills/iakaframe-fabrication/SKILL.md` — skill **composée**, `layer: capacity`,
  `subskills: [iakaframe-gestion-de-source, iakaframe-conteneurisation, iakaframe-jalon]`.
La demande « par fonction » a été honorée **sur le fond, pas seulement au frontmatter** : le gate
a porté le critère anti-monolithe G-A5d en vérifiant que la coiffante **ne redécrit pas** ce que
portent ses briques (aucune procédure de commit, de build d'image ni d'anatomie de jalon dans son
corps). Ce qui reste en propre — conduite d'une exécution fermée, incrémentalité, hors-périmètre
signalé sans être traité, escalade de l'ambiguïté, isolation par worktree, borne staging — n'est
décrit dans aucune sous-skill.
**Réserve connue, non imputable au lot** : cette skill **n'est pas active au runtime**. Le champ
`skills:` n'est pas projeté au contrat, aucun binding n'accorde l'outil `Skill`, et `subskills`
n'est résolu par aucun chemin. Le canon est juste, la mécanique se branche en phase 2
(`parite-skills-generateur-deploiement.md`).

**Les trois chantiers ouverts de cet audit (CH-C, CH-D, CH-F) sont donc soldés.** CH-A (`roleKey`)
et CH-B (`Task` pour Odin) l'étaient déjà — CH-B au lot Odin (`a71c2dd`), CH-A restant un chantier
de **phase 2** par la ligne de partage contenu/structure. CH-E a été **absorbé** par la promotion
de `deploiement` en rôle canonique, également renvoyée en phase 2.

*Arbitrage du décideur, 2026-07-20 : fermer.*
