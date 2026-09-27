# Déclaration de chantier par session — attribution au dépôt réel + blocage direct

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2), gate 🏹 Legolas.
> Cible : dépôt `iakaframe` — gardes du kit Claude (`kits/iakaframe-claude/global/hooks/`),
> cœur pur `guard-core.mjs`, contrats `odin.md` / `aragorn.md`, skills `iakaframe-odin` /
> `iakaframe-aragorn`, `methode-de-travail.md`.
> Statut : **amendée le 2026-09-27** après relecture critique (arbitrages Q1–Q7 puis Q-A–Q-E du
> décideur intégrés) — **validée par Stéphane le 2026-09-27** (jalon P1→P2 franchi).
> Doc en français, code en anglais.
> Filiation : prolonge `garde-perimetre-gestes-directs.md` (garde de chemins),
> `gardes-fous-canal-gestes-hooks.md` (un garde n'a d'autorité que sur son canal),
> `parite-enforcement-multirunner.md` (verdicts purs dans `guard-core`),
> `nettoyage-chemin-machine-perimeter-guard.md` (aucun chemin perso dans un kit source).

## 0. Outillage du cadrage — à lire avant les chiffres

- **Cadrage en lecture seule, sans `Bash`** : mesures faites par `Read` / `Grep` / `Glob` et
  vérification web du contrat des hooks. **Aucune suite de tests n'a été exécutée.**
- Mesures initiales prises au commit `2a5bfb1` ; **re-vérifiées à la relecture sur `8c12e94`**
  (`C:\work\iakaframe`) pour les références **de source du dépôt** du § 1 et des étapes 14–16
  (les références **runtime** M-2 journal et M-4 `~/.claude/settings.json:45` n'ont pas été
  re-mesurées ; M-5 runtime re-lue).
  Deux dérives constatées et corrigées ici : § Étanchéité de `odin.md` = **`:105-114`**, § Étanchéité
  de `aragorn.md` = **`:167-168`** (insertion des lignes « Durée estimée » entre-temps).
- **Remote** : `origin` = **Forgejo VPS** `https://git.naonedge.com/sjupin/iakaframe.git` ; GitHub
  (`github.com/iakasju/iakaframe`) est le remote secondaire `github`. Un autre agent peut travailler
  sur le dépôt en parallèle.
  **Première étape obligatoire de l'exécutant : `git pull origin main`, puis re-vérifier chaque
  référence `fichier:ligne` du § 1 ; toute divergence → la noter en tête de PR, et si elle touche un
  fichier listé au § « Fichiers concernés », remonter à Gandalf avant de coder.**
- Les copies **runtime** vivent dans `~/.claude/hooks/` ; la **source versionnée** est
  `kits/iakaframe-claude/global/hooks/` (sens de déploiement : kit → runtime, README du kit).

---

## 1. Mesures (état constaté sur `2a5bfb1`, re-vérifié sur `8c12e94` + runtime de cette machine)

| # | Fait mesuré | Où |
|---|---|---|
| M-1 | Le garde de périmètre **s'ancre sur `$CLAUDE_PROJECT_DIR`**, immuable pour la session. Une session lancée dans `C:\work` (portefeuille) classe **tous les dépôts** en `ALLOW_PROJECT`. | `perimeter-guard.mjs:72-82`, `guard-core.mjs:97-105` |
| M-2 | **Preuve au journal** : 39 gestes `Edit` avec `project_dir:"C:\\work"` passés en `ALLOW_PROJECT`, dont `C:\work\iakaos\Makefile` (session `8c203e87…`, 2026-09-16). | `~/.claude/iakaframe-perimeter.log:24-26` |
| M-3 | **Bash quasi aveugle** : 2 680 / 3 055 gestes Bash journalisés (**87,7 %**) sont `BASH_UNRESOLVED`. L'extracteur ne capte que des chemins **sous `homedir()` avec séparateur `/`** : sous Windows, **rien** sous `C:\work\…` n'est jamais capté. | `perimeter-guard.mjs:188-206` |
| M-4 | **Outil `PowerShell` non gardé** : absent du matcher ; **0** évènement PowerShell au journal alors que c'est le shell primaire de la machine. | `settings.example.json:33`, `~/.claude/settings.json:45` |
| M-5 | **Dérive runtime ≠ source** : le `perimeter-guard.mjs` runtime porte les racines `ALLOW_EXTRA` (lues dans `~/.claude/iakaframe-perimeter-allow.txt` ; la logique ne contient **aucun chemin en dur**, les racines sont dans le fichier) **absentes du kit**. Quelqu'un a édité la copie runtime à la main. | runtime `~/.claude/hooks/perimeter-guard.mjs:49-72` vs kit `:47-54` |
| M-6 | **`plan-courante` a une branche morte** : elle teste `tool === "Task"`, or depuis Claude Code **v2.1.63** le payload porte `tool_name:"Agent"` (le matcher `"Task"` reste honoré dans `settings.json`). Son attribution est `conv = basename(cwd)`. | `plan-courante.mjs:42`, `:84-85` |
| M-7 | `delegation-guard` attribue `royaume`/`agent` **depuis l'env** (`IAKALOG_ROYAUME`, constant sur la session) et `conv = session`. Rien ne dit **quel dépôt** est travaillé. | `delegation-guard.mjs:186-197` |
| M-8 | Aucun registre de session n'existe. `guard-core` est **dupliqué octet pour octet** dans le kit Codex (test de parité). | `guard-core.mjs:17-20`, `cli/test/guard-core-parity.test.js:16-28` |
| M-9 | Les tests de non-régression du périmètre (et de parité Claude↔Codex) envoient des payloads **sans `session_id`**. | `cli/test/guard-perimeter-regression.test.js:27-37`, `cli/test/guard-codex-complet.test.js:36-45` |
| M-10 | Racine portefeuille : `--root` > `IAKAFRAME_ROOT` > `C:\work` (win32) / `~/work`. Dépôts git sous `C:\work` : `iakaframe`, `iakacockpit`, `iakaframegui`, `naonedge`, `naonedge-clients`, `robotimmo`. **Un 2ᵉ clone `naonedge` existe hors racine** (`C:\Users\Utilisateur\work\naonedge`) : un **nom** de dépôt peut être ambigu. | `cli/src/lib/root.js:6-11` |
| M-11 | Personas, guardrails et skills sont **vendorisés** dans les fixtures du dépôt **`iakaframegui`** (`packages/core/__tests__/fixtures`) : modifier `odin.md` / `aragorn.md` / `perimeter.md` / `iakaframe-{odin,aragorn}/SKILL.md` crée une dette de re-vendorisation **dans un autre dépôt**. | `cli/src/lib/vendor.js:91`, `:209-219` |
| M-12 | **Le scratchpad de session est refusé aujourd'hui** : l'écriture d'un cadrage dans `payload.scratchpad_dir` (`C:\Users\UTILIS~1\AppData\Local\Temp\claude\…\scratchpad\`) a été bloquée `HORS` (session lancée dans `naonedge`). Le chemin arrive en **forme courte 8.3** (`UTILIS~1`) : toute comparaison de chemins doit **normaliser** (`fs.realpathSync.native`) avant `relative()`. | constat de session, 2026-09-27 |
| M-13 | **L'installeur écrit dans le harnais** : `install.mjs` dépose `~/.claude/hooks/*.mjs` et fusionne `~/.claude/settings.json` (`--overwrite --yes` écrase) ; `iakaframe install` le lance. Sous macOS/Linux, `--link` pose des **liens symboliques** runtime → kit : après `realpath`, `~/.claude/hooks/x.mjs` devient un chemin du dépôt. | `install.mjs:80`, `:260`, `:275`, `:347-351` ; `cli/src/commands/install.js:330-396` |
| M-14 | **Odin exécute lui-même des commandes portefeuille** qui écrivent dans un dépôt : `iakaframe onboard --path <projet>`, `iakaframe agents --action fullteam --project <p>` ; il pose la ligne de définition de `specs/PROJET.md`. | `library/personas/odin.md:63-64`, `:72-78` ; `library/skills/iakaframe-odin/SKILL.md:57-60` |
| M-15 | **Consigne de délégation déjà normée** : toute consigne à un sous-agent commence par `Durée estimée : ~<valeur>` (1ʳᵉ ligne). | `library/personas/odin.md:85-86`, `library/skills/iakaframe-odin/SKILL.md:63-64`, `library/skills/iakaframe-aragorn/SKILL.md:64` |
| M-16 | **Goldens d'agents** dérivés des personas, vérifiés par test ; régénération par script. | `cli/test/fixtures/agents-golden/*.md:4`, `cli/test/parite-generateurs.test.js:21`, `cli/scripts/gen-agents-golden.mjs` |

**Contrat des hooks vérifié (doc officielle, sept. 2026)** :
- **Toujours présents** : `session_id`, `cwd`, `transcript_path`, `hook_event_name`.
  **Conditionnels** : `scratchpad_dir` (« absent when the session has no scratchpad or the temp
  directory is unavailable ») ; `prompt_id` (absent avant la 1ʳᵉ saisie) ; `agent_id` (**seulement**
  dans un sous-agent) ; `agent_type` (dans un sous-agent **ou** sur le thread principal lancé avec
  `--agent`). → **L'acteur se déduit UNIQUEMENT de la présence d'`agent_id`**, jamais d'`agent_type`.
  Dans un sous-agent, le `session_id` est **celui de la session parente**.
- `PreToolUse` et `PostToolUse` **se déclenchent dans les sous-agents** (« fire the same configured
  hooks as in the main conversation »), avec `agent_id`/`agent_type`. `PreToolUse` porte `tool_use_id`.
- **Outil `PowerShell`** : existe, `tool_input.command` (même forme que Bash) ; matcher `Bash|PowerShell`.
- **Outil de délégation** : `Agent` (ex-`Task`). Imbrication **jusqu'à 3 niveaux** sous la
  conversation principale (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`) ; à la limite, seul un **fork**
  garde l'outil `Agent`. `agent_type` = `name` du frontmatter du sous-agent.
- **`SubagentStart`** : matcher = type d'agent ; entrée = champs communs + `agent_id`, `agent_type` ;
  peut **injecter du contexte** au sous-agent (`hookSpecificOutput.additionalContext`). **Ne reçoit
  PAS le prompt de la tâche** (demande ouverte #87411) ni, documenté, le `tool_use_id` de l'appel
  `Agent` qui l'a engendré. → la corrélation dispatch → sous-agent est **heuristique** (D-13).
- `UserPromptSubmit` : champ `prompt` ; le stdout texte (ou `additionalContext`) est **injecté comme
  contexte visible du modèle** ; exit 2 **efface** le prompt (on ne s'en sert pas).
- `PreToolUse` : exit 2 **bloque** l'outil, le stderr est renvoyé au modèle. Un champ JSON
  `systemMessage` (exit 0) est affiché à l'utilisateur.
- **Non documenté** : conservation du `session_id` à `/clear` et `--resume` (traité en D-10).
- ⚠️ Historique : l'issue #34692 (v2.1.76, mars 2026, fermée « not planned ») constatait que
  `PreToolUse` ne se déclenchait pas dans les sous-agents ; la doc actuelle affirme le contraire.
  → vérifié en recette réelle (CA-32), inconnue n° 1.
- Aucune variable d'environnement de session n'est garantie dans le shell de l'outil `Bash` : **seuls
  les hooks connaissent `session_id` de façon fiable.** C'est ce qui fixe « le hook est le seul
  écrivain du registre » (D-2).

---

## Problème

Une session Claude Code est rattachée à `$CLAUDE_PROJECT_DIR`, immuable. Quand la conversation
glisse vers un autre dépôt, **tout** reste attribué au répertoire de lancement : les stats natives,
la main courante iakaframe (`plan-courante`, `delegation-guard`, journal de périmètre), **et le
périmètre lui-même** — une session lancée au portefeuille peut écrire dans n'importe quel dépôt
(M-1, M-2). Aucun artefact ne déclare **quel dépôt est réellement travaillé**, ni **quel Aragorn**
en répond.

## Décision retenue

### Décisions du décideur (non négociables, rappel)
1. Deux décomptes : **stats natives** (non déplaçables → le mécanisme **propose** d'ouvrir une
   session dans le bon dépôt) et **main courante** iakaframe (**réattribuée** au dépôt déclaré,
   segment par segment).
2. Déclaration de chantier **obligatoire**, registre par session, historique en append ; tout
   travail sur un dépôt est lié à l'Aragorn de ce dépôt.
3. **Blocage direct** (pas de période warn) : sans chantier, ou geste mutateur sur un dépôt ≠
   déclaré → **DENY (exit 2)** avec message actionnable. **Lecture toujours libre.**
4. Odin (thread principal) n'exécute pas le travail d'un dépôt : il délègue à `aragorn` avec le
   dépôt nommé.
5. Exception : **`odin-direct <repo>`** tapé par le décideur dans **son** prompt, détecté par
   `UserPromptSubmit`, portée session, journalisé. **Aucun chemin CLI/Bash** ne permet à l'agent
   d'écrire un grant.
6. Détection : (a) chemin touché ; (b) nom de dépôt dans le prompt → rappel ; (c) règle de
   comportement dans les contrats d'Odin et d'Aragorn.

### Arbitrages du décideur (2026-09-27) — intégrés dans les D-x ci-dessous

| # | Question | Arbitrage | Porté par |
|---|---|---|---|
| Q1 | Chantier implicite au lancement | **Oui** (`by:"launch"`) | D-3, D-4 |
| Q2 | Déclaration par dispatch Aragorn sur un dépôt nommé par le décideur | **Oui** | D-3, D-6, D-13 |
| Q3 | Commande shell inconnue = mutatrice | **Oui** (fermée par défaut) | D-7 |
| Q4 | `~/.claude/hooks/` hors-limite, déploiement = geste humain | **Oui** | D-9 |
| Q5 | Interrupteur `IAKAFRAME_CHANTIER_MODE=off`, pas de `warn` | **Oui** | D-10 |
| Q6 | Panne interne : ouverte-mais-visible | **Oui** | D-10 |
| Q7 | Vérification du grant dans `transcript_path` | **Non dans ce lot** | Exclu |
| Q-A | Un chantier **par sous-agent** (liaison `agent_id` → dépôt via `SubagentStart`) | **Oui** (+1 j-h) | D-1, D-5, D-6, D-13 |
| Q-B | Liste fermée de **commandes portefeuille** autorisées d'office au thread principal, clé = chemin | **Oui** : `onboard`, `init`, `agents fullteam` | D-7, D-14, étape 13 |
| Q-C | `install.mjs` / `iakaframe install` refusés aux agents ; hors-limite comparé avant **et** après `realpath` | **Oui** | D-7, D-9, CA-20 (ex-CA-19, renuméroté) |
| Q-D | En régime Odin, toute délégation hors `aragorn` refusée (`general-purpose`, `claude`, fork, `subagent_type` absent) | **Oui** | D-6 |
| Q-E | iakaTokenCounter (autre logiciel, `docs/architecture/iakatokencounter.html`) | **Exclu** (autre dépôt, lot ultérieur) | Périmètre |

### Mécanique retenue (D-1 … D-14)

**D-1 — Registre.** Un fichier **JSONL append-only** par session :
`~/.claude/iakaframe-sessions/<session_id>.jsonl` (`session_id` filtré sur `[A-Za-z0-9-]`,
sinon couche chantier ignorée). JSONL plutôt que JSON : chaque évènement est **une ligne ajoutée**
(pas de lecture-modification-écriture, pas de course entre hooks parallèles), et l'historique
**est** le fichier. Évènements (`v:1`, `at`, `type` communs) :

| `type` | Champs | Écrit par |
|---|---|---|
| `launch` | `project_dir`, `key` | 1ᵉʳ hook qui voit la session (init paresseuse) |
| `declare` | `key`, `by` ∈ `launch`\|`user`\|`odin-direct`, `aragorn` (`"aragorn@<nom>"`), `team_source` (= `CLAUDE_PROJECT_DIR`), `prompt_id?` | `UserPromptSubmit` **uniquement** (chantier **de session**, celui du thread principal) |
| `grant` | `key`, `by:"user"`, `prompt_id?` | `UserPromptSubmit` **uniquement** |
| `named` | `keys[]`, `prompt_id?` | `UserPromptSubmit` |
| `dispatch` | `tool_use_id`, `target` (`subagent_type` normalisé), `key`, `from_agent_id?`, `aragorn?` | `delegation-guard` (PreToolUse `Agent`/`Task`, **avant** `allow`) |
| `bind` | `agent_id`, `agent_type`, `key`, `tool_use_id` (du `dispatch` consommé) \| `null` si ambigu | `chantier-bind.mjs` (`SubagentStart`) |
| `fail_open` | `hook`, `error` (tronqué 300 c.) | tout hook en panne interne |

`key` = `{ kind: "repo"|"dir"|"portefeuille"|"hors", root, name }`.
**Segments de session** = dérivés par un **fold pur** (`foldChantier`) : chaque `declare` d'une
`key` ≠ active ouvre le segment `n+1` et clôt le précédent (`until`). Correspondance avec la forme
demandée : `repo` = `key.name` (+ `key.root`), `aragorn`, `since`, `grantedBy` = `by`. Le fold rend
aussi `bindings` : `agent_id → { key, since, tool_use_id }` et la file des `dispatch` non consommés.
Lignes illisibles ignorées ; premier `launch` gagnant ; `declare` sur la `key` déjà active = sans
effet ; `bind` répété pour un même `agent_id` = le premier gagne.
**Chantier effectif** d'un geste (`effectiveKey`) : `bindings[agent_id].key` si `agent_id` est lié,
sinon le chantier actif de session.

**D-2 — Qui écrit le registre : les hooks, et eux seuls.** Aucun verbe CLI n'écrit le registre
(le CLI ne connaît pas `session_id`, cf. § 1). Le garde traite le dossier du registre comme
**hors-limite** pour tout geste d'agent (D-9), et refuse l'installeur (D-9). Il n'existe donc
**aucune commande outillée** à détourner.

**D-3 — Comment se déclare un chantier (quatre voies, et seulement quatre).**

| Voie | Geste | Qui | Portée | Garde-fou |
|---|---|---|---|---|
| **Lancement** (implicite, Q1) | ouverture de session | décideur (choix du répertoire) | session | `key` du répertoire de lancement. Session hors racine et hors dépôt → `kind:"hors"` → **aucun chantier**. |
| **Mot-clé décideur** | une **ligne seule** du prompt : `chantier <repo>` | décideur | session | détecté par `UserPromptSubmit` → `declare(by:"user")` |
| **Grant** | une **ligne seule** : `odin-direct <repo>` | décideur | session | `declare(by:"odin-direct")` + `grant` |
| **Dispatch** (Q2, Q-A) | `Agent`/`Task` dont le prompt porte la ligne `Chantier: <repo>` | agent | **le sous-agent engendré** (et sa descendance), jamais la session | autorisé **seulement si** `<repo>` = chantier effectif du dispatcheur **ou** a été **nommé par le décideur** dans un prompt de la session (`named`) → `dispatch` puis `bind` (D-13) |

**Pourquoi l'agent peut déclarer — et pourquoi il ne peut pas accorder.** Déclarer n'élargit
aucun droit : ça **déplace l'attribution** et le périmètre **d'un sous-agent** vers un dépôt que
**le décideur a lui-même désigné** (`named`). Un agent qui dérive seul vers un dépôt jamais nommé est
bloqué. Le **grant** élargit un droit (Odin agit en direct) : il ne naît **que** d'une ligne tapée
par le décideur. **Confirmation** : si l'agent propose un dépôt, la réponse du décideur doit
**nommer** le dépôt (« oui, naonedge » ou `chantier naonedge`) ; un simple « oui » ne vaut pas
désignation.

**Ligne seule, syntaxe fermée** (regex dans `guard-core`, par ligne `trim()`, sensible à la
casse) :
- prompt du décideur : `^chantier\s+(\S+)$` et `^odin-direct\s+(\S+)$` ;
- ordre de mission (dispatch) : `^Chantier:\s*(\S+)$`, **en 2ᵉ ligne**, juste après la ligne
  `Durée estimée : ~<valeur>` (M-15). Le garde accepte la ligne **à n'importe quelle position**
  (tolérance), mais les contrats et skills prescrivent la 2ᵉ ligne ; plusieurs lignes `Chantier:`
  divergentes → **DENY `DISPATCH_AMBIGUOUS`**.
Une mention **dans une phrase** (« on pourrait faire odin-direct naonedge ») **n'accorde rien**.
`<repo>` = nom de dépôt connu, chemin absolu, ou `portefeuille`. Nom ambigu (M-10) ou inconnu →
**refus** + rappel demandant le chemin absolu. `chantier <nom>` sur un dossier **inexistant** sous la
racine est accepté (`kind:"dir"`, cas de création de projet) ; `odin-direct` exige un dossier existant.

**D-4 — Résolution « chemin → clé » (adaptateur, I/O).** Chemin d'abord **normalisé**
(`fs.realpathSync.native` sur le plus proche ancêtre existant — formes 8.3, casse, M-12), puis :
1. remonter jusqu'à un `.git` → `kind:"repo"`, `root` = dossier qui le porte. Si `.git` est un
   **fichier** dont le `gitdir:` contient `/worktrees/` → `root` = dépôt principal (worktrees de
   Gimli) ; sinon (sous-module) → le dossier lui-même ;
2. sinon, sous la racine (`IAKAFRAME_ROOT` → `C:\work` / `~/work`, même règle que `root.js`) :
   fichier **directement** dans la racine ou dossier `.xxx` de 1ᵉʳ niveau → `kind:"portefeuille"`,
   `name:"@portefeuille"` ; sinon 1ᵉʳ segment → `kind:"dir"` ;
3. sinon → `kind:"hors"`, `name:"@hors"`.
**Dépôts connus** (détection dans les prompts) = dossiers de 1ᵉʳ niveau de la racine portant
`.git` ∪ dépôt de lancement ∪ clés déjà présentes au registre. Cache par invocation.

**D-5 — Verdict des gestes directs** (`verdictChantier`, pur). Entrées : `gesture`
(`EDIT` = outils `Edit` | `Write` | `NotebookEdit` ; `SHELL_READ` | `SHELL_MUTATE` = outils `Bash` |
`PowerShell`), `actor` (`MAIN` | `SUB`, **selon la seule présence d'`agent_id`**), `agentId?`,
`launch`, état replié (`active`, `grants`, `bindings`), `keys` touchées (après exclusions D-8),
drapeaux de `classifyShell` (`portfolioVerb`, `segments`). Le hors-limite D-9 est jugé **avant**
cette fonction. Règles, dans l'ordre :
1. `SHELL_READ` → **ALLOW** (lecture libre). `Read`/`Grep`/`Glob` ne sont pas interceptés.
2. `keys` vide (tout est exclu) → **ALLOW**.
3. **Commande portefeuille** (D-14) : `actor = MAIN` **et** `launch.kind = "portefeuille"` **et**
   `portfolioVerb` **et** commande à **un seul segment** **et** chaque `key` ∈ {`repo`, `dir`}
   sous la racine → **ALLOW `PORTFOLIO_VERB`**.
4. `effective` = `bindings[agentId].key` si `actor = SUB` et lié, sinon `active`. Pas d'`effective`
   → **DENY `NO_CHANTIER`**.
5. une `key` ≠ `effective` → **DENY `CHANTIER_MISMATCH`** (`@hors` compris).
6. **Régime Odin** — `actor = MAIN` **et** (`launch.kind = "portefeuille"` **ou**
   `active ≠ launch`) **et** `active.kind ≠ "portefeuille"` **et** `active ∉ grants` →
   **DENY `ODIN_DIRECT`** (« le thread principal n'exécute pas hors de chez lui : délègue »).
7. sinon → **ALLOW**.
« Chez soi » = le dépôt de lancement. La règle 6 couvre **à la fois** Odin au portefeuille et une
session de dépôt R qui a basculé sur S : dans les deux cas, le thread principal délègue. Un
sous-agent **lié** (D-13) travaille sur **son** dépôt, indépendamment du chantier de session : deux
Aragorn lancés en parallèle sur A et B ne se coupent pas l'un l'autre.

**D-6 — Verdict des délégations** (`verdictDispatch`, pur, appelé par `delegation-guard` **après**
le contrôle de roster existant, inchangé). Entrées : `actor`, `agentId?`, `target` (`subagent_type`,
`AGENT_UNSET` si absent), `chantierLines` (lignes `Chantier:` du prompt), état replié, `launch`.
Cibles **lecture seule** tolérées sans condition : **`Explore`, `Plan`, `claude-code-guide`**
(`statusline-setup` n'y figure **pas** : il écrit `settings.json`).
- **Clé demandée** `req` : la ligne `Chantier: <repo>` résolue (D-3) ; plusieurs lignes divergentes
  → **DENY `DISPATCH_AMBIGUOUS`** ; absente → `req` = chantier effectif du dispatcheur.
- **Désignation** : `req` = effectif du dispatcheur → ok ; `req` ∈ `named` → ok ; sinon → **DENY
  `NOT_DESIGNATED`** (« le décideur n'a pas nommé ce dépôt »). Pas d'effectif et pas de ligne →
  **DENY `NO_CHANTIER`**.
- **Régime Odin** (`actor = MAIN`, mêmes conditions que D-5 règle 6, évaluées sur `active`) — Q-D :
  cible ∉ {`aragorn`} ∪ lecture seule **et** `active ∉ grants` → **DENY `ODIN_DISPATCH`** ; cela
  vaut **explicitement** pour `general-purpose`, `claude`, `statusline-setup`, un **fork**, et
  `AGENT_UNSET` (`subagent_type` absent). Cible `aragorn` **sans** ligne `Chantier:` → **DENY
  `DISPATCH_UNNAMED`**.
- `actor = MAIN` hors régime Odin, ou `actor = SUB` : règles de clé/désignation ci-dessus, toute
  cible du roster.
- **ALLOW** ⇒ le verdict rend `dispatch: { key: req, target }` ; l'adaptateur écrit l'évènement
  `dispatch` **avant** `allow`. Une cible lecture seule n'écrit **pas** de `dispatch`.
Le dispatch **ne change jamais** le chantier de session : il prépare la liaison du sous-agent (D-13).

**D-7 — Classification shell** (`classifyShell(command, dialect)`, pur ; `dialect` =
`bash`|`powershell`). Découpe sur `&&`, `||`, `;`, `|`, retours ligne. **`MUTATE` si** une
redirection d'écriture (`>`, `>>`, `Out-File`, `Set-Content`, `Add-Content`, `Tee-Object`) hors
`2>&1`, `>/dev/null`, `2>/dev/null`, `>$null`, `2>nul`, `>nul` ; **sinon `READ` seulement si chaque
segment** commence (après affectations `X=y`) par une commande **neutre** ou de la **liste de lecture** :
- **neutres** (déplacement de répertoire, jamais mutateurs) : `cd`, `pushd`, `popd`, `Set-Location`,
  `Push-Location`, `Pop-Location` — leur **cible** est rendue (voir plus bas) ;
- **liste de lecture** : `ls dir cat head tail less more wc grep rg find(sans -delete/-exec) echo pwd
  which where type file stat du df tree diff cmp sort uniq cut jq sed(sans -i) awk`,
  `git {status,log,diff,show,branch(sans arg ou -a/-r/--list),remote -v,rev-parse,ls-files,blame,describe,config --get}`
  — **les options globales de git** (`-C <p>`, `-c <k=v>`, `--git-dir=<p>`/`--git-dir <p>`,
  `--work-tree…`, `--no-pager`, `-P`) **sont sautées** avant d'identifier la sous-commande,
  `node|npm|python --version`, `iakaframe {list,show,recap,brief,banner,jalon,vendor-check}`,
  PowerShell `Get-ChildItem Get-Content Get-Item Get-Location Test-Path Resolve-Path Select-String
  Measure-Object Select-Object Sort-Object Where-Object Format-* Write-Output Write-Host`.
**Tout le reste est `MUTATE`** (Q3 : fail-closed sur la classification — la lecture reste libre via
`Read`/`Grep`/`Glob`).
`classifyShell` rend aussi :
- `paths` : chemins absolus (formes `C:\…`, `C:/…`, `/c/…`, `/…`, `~/…`) ; cibles des commandes
  neutres et de `git -C`/`--git-dir`/`--work-tree` (brutes ; l'adaptateur les résout contre
  `payload.cwd`) ;
- `registryRef` : la chaîne contient `iakaframe-sessions` ;
- `selfInvoke` : `claude` / `claude.exe` avec `-p`, `--print`, `-r`, `--resume`, `-c`, `--continue` ;
- `installerInvoke` (Q-C) : un segment invoque `install.mjs` (quel que soit le préfixe : `node`,
  chemin relatif ou absolu) **ou** `iakaframe install` ;
- `portfolioVerb` (Q-B) : un segment `iakaframe onboard …`, `iakaframe init …`,
  `iakaframe agents fullteam …` ou `iakaframe agents --action fullteam …` ; ses chemins
  (`--path`, `--project`, sinon `cwd`) entrent dans `paths` ;
- `segments` : nombre de segments.
Pour un `SHELL_MUTATE`, `keys` = clés de {`payload.cwd`} ∪ `paths` (le `cwd` compte : c'est là
qu'opère un `git commit` relatif — c'est le correctif de M-3). Exception : pour une commande
`portfolioVerb` à un segment **avec** `--path`/`--project`, le `cwd` n'est pas compté (clé = chemin).

**D-8 — Exclusions** (retirées de `keys`, jamais attribuées, jamais bloquées ; comparaison **après
normalisation** D-4) : sous-arbre de `payload.scratchpad_dir` **s'il est présent** (champ
conditionnel, § 1) ; sous-arbre de `os.tmpdir()` ; `~/.claude/**` **sauf** les chemins D-9 ; racines
`ALLOW_EXTRA` (fichier d'autorisation existant, M-5, **reversé dans la source**) ; `/dev/null`,
`NUL`, `$null`.

**D-9 — Hors-limite absolu** (DENY quel que soit l'acteur, grant compris, **avant tout autre
verdict**). La comparaison se fait sur le chemin **brut résolu ET** sur le chemin **normalisé**
(`realpath`) : un chemin est hors-limite si **l'une ou l'autre** forme tombe dans la zone (Q-C —
ferme le cas `--link` de M-13).
- `~/.claude/settings.json` (existant, `DENY_HARNESS`) **+** `~/.claude/hooks/**`,
  `~/.claude/iakaframe-perimeter-allow.txt` (`DENY_HARNESS`) ;
- `~/.claude/iakaframe-sessions/**` (`DENY_REGISTRY`) ;
- commande shell `installerInvoke` → **`DENY_HARNESS`** (Q-C : le déploiement est un geste humain) ;
- commande shell `selfInvoke` → **`DENY_SELF_INVOKE`** (un `claude --resume <id> -p "odin-direct X"`
  lancé par l'agent déclencherait le `UserPromptSubmit` de la session) ;
- commande shell `registryRef` **classée `MUTATE`** → `DENY_REGISTRY`. Une commande `registryRef`
  classée `READ` (ex. `cat ~/.claude/iakaframe-sessions/<sid>.jsonl`) **passe** : la lecture reste
  libre (décision 3).

**D-10 — Pannes vs états (le tranchage fail-open / fail-closed).**
- **État** (registre lu, aucun chantier, clé ≠ effective) → **fermé** : DENY. C'est la décision 3.
- **Panne interne** (exception, payload illisible, erreur d'E/S autre que `ENOENT`) → **ouvert
  mais visible** (Q6) : exit 0 + `{"systemMessage":"[chantier-guard] FAIL-OPEN : <hook> — <erreur>"}`
  (vu par le décideur) + évènement `fail_open` au registre (si écrivable) + ligne `FAIL_OPEN` au
  journal ; le prochain `UserPromptSubmit` rappelle le compte. Raison : un garde qui ferme sur
  **son propre bug** paralyse **toutes** les sessions, y compris celle qui doit le corriger, et
  son redéploiement est un geste humain (D-9).
- Pas de `session_id` exploitable → **couche chantier ignorée**, comportement **historique**
  intact (garantit M-9 : la non-régression passe sans modification).
- **Changement de `session_id`** (`/clear` ; `--resume` si la version de Claude Code en attribue un
  neuf — non documenté) → **nouveau registre** : chantier de session = celui du lancement (Q1),
  **grants, `named` et liaisons perdus**. Comportement assumé (un grant ne survit pas à sa session).
  `chantier-remind` le signale : quand il crée le registre (init paresseuse) et que la conversation
  n'en est pas au 1ᵉʳ prompt (`prompt_id` présent), il ajoute « Registre neuf pour cette session :
  chantier = lancement ; les désignations et `odin-direct` antérieurs ne valent plus. »
- **Interrupteur humain** (Q5) : `IAKAFRAME_CHANTIER_MODE` = `deny` (défaut, absent = `deny`) | `off`
  (couche chantier désactivée → comportement historique). **Pas de valeur `warn`** : toute autre
  valeur est traitée comme `deny`. Posée dans l'env de lancement ou dans `settings.json`
  (hors-limite pour l'agent, D-9 ; installeur refusé, D-9) : l'agent ne peut pas désarmer le garde.

**D-11 — Couche chantier = remplacement de l'ancrage, pas un 2ᵉ garde.** Quand la couche est
active, le chantier effectif **remplace** `$CLAUDE_PROJECT_DIR` comme périmètre, dans le **même**
`perimeter-guard.mjs` (un seul verdict par geste, un seul journal). Sinon, deux gardes
contradictoires sur le même geste (l'ancien refuserait S, le nouveau l'autoriserait). En couche
active, **Bash/PowerShell sont en DENY** comme Edit (décision 3) ; `IAKAFRAME_PERIMETER_MODE`
ne gouverne plus que la couche historique. L'en-tête de `perimeter-guard.mjs` documente la
**divergence assumée avec Codex** (couche chantier côté Claude seulement), par symétrie avec la
divergence déjà documentée dans `cli/test/guard-codex-complet.test.js:64-67`.

**D-12 — Réattribution de la main courante** (à l'émission, jamais rétroactive) :
- `perimeter-guard` : chaque ligne de journal porte `agent_id` et `agent_type` (ou `null`) et
  `chantier: {name, root, segment, by, scope}` avec `scope` ∈ `session`|`agent` ;
- `delegation-guard` : journal + document émis portent `meta.repo`, `meta.repo_root`,
  `meta.segment`, `meta.aragorn`, `meta.agent_id?` ; `royaume` = `key.name` en MAJUSCULE si
  chantier `kind:"repo"|"dir"`, `PORTEFEUILLE` si `@portefeuille`, sinon l'env (inchangé) ;
- `plan-courante` : `conv_id` = `key.name` du chantier effectif (repli : `basename(cwd)` actuel),
  mêmes `meta.*`, même règle de `royaume` ; accepter `tool_name` **`"Agent"` et `"Task"`** (M-6).
**Stats natives** : non déplaçables. Chaque message de refus `NO_CHANTIER` / `CHANTIER_MISMATCH` /
`ODIN_DIRECT` et chaque rappel de détection **propose** en tête :
`Ouvrir une session dans le dépôt : Set-Location <root> ; claude` (win32) / `cd <root> && claude`.

**D-13 — Chantier par sous-agent (Q-A) : liaison `agent_id` → dépôt.** Hook neuf
`chantier-bind.mjs` sur **`SubagentStart`** (sans matcher : tous types).
1. À l'entrée : `agent_id`, `agent_type`. Il lit la file des `dispatch` **non consommés** de la
   session dont `target` = `agent_type` (comparaison insensible à la casse).
2. **Un seul** candidat, **ou** plusieurs candidats portant **tous la même `key`** → consomme le plus
   ancien (FIFO) et écrit `bind { agent_id, agent_type, key, tool_use_id }`.
3. Plusieurs candidats de **clés différentes** (dispatchs parallèles du même type vers des dépôts
   différents, non départageables faute de `tool_use_id`/prompt dans `SubagentStart`, § 1) →
   `bind { key: null }` (**ambigu**) : le sous-agent retombe sur le chantier de session, et ses gestes
   hors de ce chantier sont refusés `CHANTIER_MISMATCH` avec un message « dispatchs parallèles
   ambigus : relancer séquentiellement ». Fail-closed, jamais d'attribution devinée.
4. Aucun candidat (sous-agent lecture seule, sous-agent d'un outil qui ne passe pas par `Agent`) →
   pas de `bind` : chantier de session.
5. Stdout JSON `hookSpecificOutput.additionalContext` : « Chantier : <nom> (<root>) — tu ne modifies
   rien hors de ce dépôt ; hors chantier, arrête-toi et remonte. » (injecté au sous-agent). Exit 0
   inconditionnel (le hook ne bloque jamais ; le verrou reste `PreToolUse`).
6. **Descendance** : un sous-agent lié qui dispatche (Aragorn → Gimli) produit un `dispatch` dont la
   `key` par défaut est **son** chantier effectif (D-6) ; le petit-enfant est lié à son tour par la
   même règle.
7. Un dispatch non consommé n'expire pas ; il est ignoré dès qu'un `bind` l'a consommé. Le fold
   tolère un `dispatch` refusé en aval par le runtime (jamais lié : sans effet).

**D-14 — Commandes portefeuille d'Odin (Q-B).** Liste fermée, constante `PORTFOLIO_VERBS` dans
`guard-core` : `iakaframe onboard`, `iakaframe init`, `iakaframe agents fullteam` (et sa forme
`iakaframe agents --action fullteam`). Autorisées d'office **au thread principal d'une session lancée
au portefeuille** (D-5 règle 3), **clé = chemin** passé (`--path` / `--project`, à défaut `cwd`),
**commande à un seul segment** (aucun chaînage `&&`/`;`/`|` : sinon classification normale), et
**jamais** au-delà du hors-limite D-9. Elles ne déclarent **pas** de chantier et n'ouvrent pas de
segment ; le journal les marque `verdict: "PORTFOLIO_VERB"`. Tout autre geste d'Odin dans un dépôt
suit D-5/D-6 (délégation à Aragorn, ou `odin-direct`).

**Détection (b) — `UserPromptSubmit` (`chantier-remind.mjs`, nouveau).** À chaque prompt :
(1) init paresseuse ; (2) directives ligne seule (D-3) → `declare`/`grant` ; (3) mentions de dépôts
connus : mot entier `(?<![\w.-])nom(?![\w.-])` (donc `naonedge` ≠ `naonedge-clients`), noms les
plus longs d'abord, **après retrait** des lignes-directives et des **phrases réservées**
(`init iakaframe`, `update iakaframe`, `iakaframe <verbe CLI>`, `iakastart`) → `named` ; (4) stdout :
**toujours** une ligne `Chantier actif : <nom> (<root>) — segment n, depuis <at>, Aragorn <nom>` et,
s'il y en a, `Sous-agents liés : <agent_type>→<nom>, …` ; **plus**, si besoin, un rappel ≤ 6 lignes :
aucun chantier / dépôt mentionné ≠ actif (« demande confirmation au décideur avant tout geste ;
propose une session dans ce dépôt, ou la désignation `chantier <nom>` ») / directive refusée (nom
ambigu) / `fail_open` depuis le dernier prompt / registre neuf (D-10).
**Ne bloque jamais** (exit 0), ne recopie jamais le texte du prompt dans le contexte.

**Détection (c) — contrats.** Odin et Aragorn vérifient, **à chaque demande**, l'appartenance au
chantier (de session pour Odin, **lié** pour Aragorn) ; ils ne tapent ni ne suggèrent `odin-direct`
comme s'ils pouvaient l'accorder ; ils peuvent **informer** le décideur que l'exception existe.

## Périmètre

- **Inclus** :
  - cœur pur `guard-core.mjs` : `foldChantier` (segments, `bindings`, file de `dispatch`),
    `parsePromptDirectives`, `parseChantierLines`, `detectRepoMentions`, `classifyShell`,
    `verdictChantier`, `verdictDispatch`, `pickBinding` (règle D-13 2–4), constantes
    (`READONLY_BUILTINS` = `Explore`/`Plan`/`claude-code-guide`, `PORTFOLIO_VERBS`, phrases
    réservées, liste de lecture, commandes neutres, options globales git) ; copie octet pour octet
    dans le kit Codex ;
  - adaptateur I/O neuf `chantier-state.mjs` (registre, init paresseuse, append, résolution D-4,
    dépôts connus, exclusions D-8, hors-limite D-9 double comparaison, `systemMessage` de panne) ;
  - `perimeter-guard.mjs` : couche chantier (D-5, D-7…D-11, D-14), outil `PowerShell`, extraction
    Windows, reprise de `ALLOW_EXTRA` depuis le runtime (M-5), journal enrichi (`agent_id`,
    `agent_type`, `chantier`) ;
  - `delegation-guard.mjs` : `verdictDispatch`, évènement `dispatch`, attribution (D-12) ;
  - `plan-courante.mjs` : attribution + `"Agent"` (D-12, M-6) ;
  - hooks neufs `chantier-remind.mjs` (`UserPromptSubmit`) et `chantier-bind.mjs` (`SubagentStart`) ;
  - `settings.example.json`, README du kit global, `kits/iakaframe-claude/global/CLAUDE.md` ;
  - contrats `odin.md`, `aragorn.md`, skills `iakaframe-odin/SKILL.md`, `iakaframe-aragorn/SKILL.md`,
    `methode-de-travail.md`, garde-fou `perimeter.md` ; régénération des goldens
    (`node cli/scripts/gen-agents-golden.mjs`) et des contrats déployés
    (`iakaframe agents --action generate`) ;
  - tests : unités `guard-core`, fixtures JSONL, bout-en-bout par `spawnSync` des hooks.
- **Exclu** :
  - **tout verbe CLI** qui écrit le registre (déclaration ou grant) — y compris un
    `iakaframe chantier` ; un `status` en lecture seule est un **lot ultérieur** si besoin ;
  - **réécriture rétroactive** des documents déjà émis en main courante, ou des journaux existants ;
  - déplacement des **stats natives** Claude Code (impossible : on **propose** une session) ;
  - **plusieurs chantiers de session** simultanés (un seul chantier **de session** ; le parallèle
    passe par des **sous-agents liés**, D-13) ;
  - corrélation exacte dispatch → sous-agent au-delà de l'heuristique D-13 (dépend d'une évolution de
    `SubagentStart`, #87411) ;
  - câblage des adaptateurs **Codex** (seul le cœur est copié, parité octet) ;
  - `frames/releases/StefFrame2/**` (instantané de release, intouché) ;
  - la **re-vendorisation** dans `iakaframegui` (M-11) : autre dépôt, donc **autre chantier** —
    à mener dans une session ouverte dans `iakaframegui` (cf. `garde-vendor-check-cross-repo.md`) ;
  - **iakaTokenCounter** (Q-E ; `docs/architecture/iakatokencounter.html`) : autre logiciel, autre
    dépôt ; consommer le registre de chantier pour son axe projet × agent est un **lot ultérieur** ;
  - vérification croisée du grant dans le `transcript_path` (Q7 : non dans ce lot) ;
  - purge / rétention de `~/.claude/iakaframe-sessions/` (lot ultérieur : purge au-delà de N jours) ;
  - édition de `~/.claude/settings.json`, copie vers `~/.claude/hooks/`, lancement de l'installeur :
    **gestes humains** (§ Lot 7) ;
  - `identity-guard.mjs`, `identity-remind.mjs` : inchangés.

## Étapes d'implémentation

Un lot = un commit atomique (conventional commits), tests verts avant chaque commit.

**Lot 0 — Remise à niveau et mesure** (`chore`)
1. `git pull origin main` ; re-vérifier les références du § 1 (cf. § 0).
2. Mesurer la baseline : suite CLI (`node --test` via le script du dépôt), `vendor-check --root
   <canon>`, et noter les chiffres en tête de PR (le `vendor-check` peut déjà être rouge : noter
   l'état, ne pas le corriger).
3. Reverser dans le kit la logique `ALLOW_EXTRA` du runtime (M-5), **sans autre changement** et
   **sans aucun chemin machine** (les racines restent dans le fichier d'autorisation de l'utilisateur).
   Commit : `fix(hooks): reintegrate ALLOW_EXTRA roots into kit perimeter-guard source`.

**Lot 1 — Cœur pur** (`feat(guard-core)`)
4. Ajouter à `guard-core.mjs` les fonctions de D-1, D-3, D-5, D-6, D-7, D-13 (`pickBinding`) et les
   constantes de D-14. **Aucune E/S**, fonctions de chemin injectées (`relativeFn`, `isAbsoluteFn`)
   comme `verdictPerimeter`. `verdictChantier`/`verdictDispatch` rendent
   `{ decision: "ALLOW"|"DENY", code, key?, dispatch? }`.
5. Copier le fichier à l'identique dans `kits/iakaframe-codex/global/hooks/guard-core.mjs`.
6. Tests d'unité + fixtures `cli/test/fixtures/chantier/*.jsonl`.

**Lot 2 — Adaptateur d'état** (`feat(hooks)`)
7. Créer `chantier-state.mjs` : `registryPath(sid)`, `loadState(sid)` (lecture + fold ; `ENOENT`
   → `null`), `appendEvent(sid, ev)` (`appendFileSync`, une ligne, création du dossier),
   `ensureLaunch(payload)`, `normalize(abs)` (M-12), `keyOf(absPath)` (D-4), `knownRepos()`,
   `isExcluded(abs, payload)` (D-8, `scratchpad_dir` optionnel), `hardDeny(abs)` (D-9, forme brute
   **et** normalisée), `failOpen(hook, err)` (D-10), `sessionShellHint(root)`.
8. Tests avec `HOME`/`USERPROFILE` et `IAKAFRAME_ROOT` redirigés vers un tmpdir, dépôts fixtures
   = dossiers portant un `.git` (dossier, et fichier `gitdir:` de worktree), lien symbolique
   (POSIX) pour le cas D-9 après `realpath`.

**Lot 3 — Prompt** (`feat(hooks)`)
9. Créer `chantier-remind.mjs` (détection b, directives, `named`, rappel, registre neuf, exit 0
   inconditionnel).

**Lot 3bis — Liaison des sous-agents** (`feat(hooks)`)
10. Créer `chantier-bind.mjs` (`SubagentStart`, D-13) : `bind`, `additionalContext`, exit 0
    inconditionnel, fail-open visible (D-10).

**Lot 4 — Gestes directs** (`feat(hooks)`)
11. `perimeter-guard.mjs` : si `IAKAFRAME_CHANTIER_MODE ≠ off` et `session_id` valide → couche
    chantier (D-11), hors-limite D-9 d'abord, puis `verdictChantier` ; sinon chemin historique
    **inchangé**. Gérer `tool_name` `PowerShell` (`tool_input.command`, dialecte `powershell`).
    Journal enrichi (D-12). Messages de refus actionnables (modèle au § « Messages »). Commentaire
    d'en-tête : divergence Codex assumée (D-11).

**Lot 5 — Délégation et plan** (`feat(hooks)`)
12. `delegation-guard.mjs` PreToolUse : après le roster, `verdictDispatch` ; si `dispatch` →
    `appendEvent` **avant** `allow`. Attribution D-12 en PreToolUse et PostToolUse.
13. `plan-courante.mjs` : attribution D-12 ; accepter `"Agent"`.

**Lot 6 — Contrats, skills et méthode** (`docs`)
14. `library/personas/odin.md` :
    - § **Posture** (`:33-46`) : « prend en charge les chantiers transverses » → il les orchestre
      **par des Aragorn liés chacun à un dépôt** (un ordre de mission par dépôt, ligne `Chantier:`),
      jamais par un geste direct ;
    - § **Périmètre** (`:60-70`) : « Démarrer un projet » / « Créer une équipe » restent **à lui**,
      via les seules commandes portefeuille autorisées (D-14) ; « n'écrit pas dans le code des
      projets » → renvoi au garde (« le garde le refuse : délègue, ou demande `odin-direct` ») ;
    - § **Obligation — ligne de définition** (`:72-78`) : la ligne est **posée au démarrage** via
      `iakaframe onboard` ; toute **évolution** ultérieure de `specs/PROJET.md` est **déléguée à
      l'Aragorn** du dépôt (ou faite sous `odin-direct` tapé par le décideur) ;
    - § **Entrées → Sorties / Délègue** (`:85-86`) : 2ᵉ ligne obligatoire `Chantier: <repo>` après
      `Durée estimée`, dans tout ordre de mission à Aragorn ;
    - nouvelle section **« Obligation — chantier déclaré »** après § Étanchéité (`:105-114`) : règles
      D-5/D-6 en prose, vérification d'appartenance à chaque demande, proposition de session dans le
      bon dépôt, interdiction de s'auto-accorder `odin-direct`, délégation hors `aragorn` refusée en
      régime Odin. **Réciprocité** : nomme Aragorn.
15. `library/personas/aragorn.md` : section **« Obligation — chantier déclaré »** après
    § Étanchéité (`:167-168`) : un Aragorn répond d'**un** dépôt (son chantier **lié**, D-13) ; il
    vérifie à chaque demande que le travail appartient à ce chantier ; hors chantier → il s'arrête et
    remonte (session dans le bon dépôt, ou désignation par le décideur) ; il ne déclare jamais un
    dépôt non nommé ; ses ordres de mission portent `Chantier: <repo>` en 2ᵉ ligne. **Réciprocité** :
    nomme Odin.
16. `library/skills/iakaframe-odin/SKILL.md` — **amendée** : étape « Démarrer / Créer » (`:57-60`)
    → commandes portefeuille D-14 ; étape « Délègue » (`:63-64`) → ligne `Chantier:` en 2ᵉ ligne.
    `library/skills/iakaframe-aragorn/SKILL.md` — **amendée** : gabarit de consigne (`:64`) → ajouter
    `Chantier: {repo}` en 2ᵉ ligne ; § Étanchéité (`:98`) → « chantier lié, hors chantier on s'arrête ».
    Les autres skills (`iakaframe-cadrage`, `-qualite`, …) restent **intactes** : elles ne délèguent
    pas hors de leur dépôt et ne décrivent pas le périmètre d'Odin.
17. `methode-de-travail.md` : sous-section **« Chantier déclaré — une session, un dépôt par agent »**
    après § Étanchéité (`:374-385`) : les quatre voies, le régime Odin, `odin-direct`, les
    sous-agents liés, les commandes portefeuille, la proposition de session, l'interrupteur humain.
18. `library/guardrails/perimeter.md` : `policy` et corps → ancrage « chantier effectif (lié au
    sous-agent, sinon de session), à défaut `CLAUDE_PROJECT_DIR` ».
19. `kits/iakaframe-claude/global/CLAUDE.md` : un paragraphe dans les conventions permanentes
    (mots-clés `chantier <repo>` / `odin-direct <repo>`, ligne seule ; `Chantier:` en 2ᵉ ligne des
    délégations).
20. `settings.example.json` : matcher `Edit|Write|Bash|NotebookEdit|PowerShell` ; 2ᵉ entrée
    `UserPromptSubmit` → `chantier-remind.mjs` ; entrée `SubagentStart` → `chantier-bind.mjs`.
    README du kit : fichiers ajoutés (`chantier-state`, `chantier-remind`, `chantier-bind`),
    interrupteur, installeur refusé aux agents.
21. `node cli/scripts/gen-agents-golden.mjs` (goldens `odin`, `aragorn`), puis
    `iakaframe agents --action generate` et `--check` ; `vendor-check` : **la dérive vers
    `iakaframegui` est attendue** (M-11 : personas, guardrail, skills, goldens) et **consignée** en
    tête de PR, pas corrigée ici.

**Lot 7 — Déploiement et recette (gestes HUMAINS, décideur)**
22. Copier `kits/iakaframe-claude/global/hooks/*.mjs` → `~/.claude/hooks/` (ou lancer soi-même
    l'installeur) ; fusionner les trois changements de `settings.example.json` dans
    `~/.claude/settings.json` (sans écraser).
23. Recette en session réelle : CA-30 à CA-33.
24. Clôture : `iakaframe update` (état des lieux + commit + push), gate Legolas avant.

### Messages (modèle, à tenir mot pour mot sur la structure)

```
[chantier-guard] REFUSE (<CODE>) : <Outil> vise <nom> (<root>).
  Chantier actif : <nom actif | aucun> (<session | lie a l'agent <agent_type>>) — session <sid 8 c.>.
  Pour continuer :
   1. (recommande, stats natives) ouvrir une session dans le depot : <Set-Location <root> ; claude>
   2. faire designer le depot par le decideur : une ligne seule `chantier <nom>`
   3. [regime Odin] deleguer a aragorn avec la ligne `Chantier: <nom>` (2e ligne de l'ordre de mission)
  L'exception `odin-direct <nom>` ne peut etre tapee QUE par le decideur. La lecture reste libre.
```

## Fichiers concernés

- `kits/iakaframe-claude/global/hooks/guard-core.mjs` — fonctions pures D-1, D-3, D-5, D-6, D-7,
  D-13, constantes D-14.
- `kits/iakaframe-codex/global/hooks/guard-core.mjs` — copie octet pour octet.
- `kits/iakaframe-claude/global/hooks/chantier-state.mjs` — **créé** (adaptateur I/O).
- `kits/iakaframe-claude/global/hooks/chantier-remind.mjs` — **créé** (`UserPromptSubmit`).
- `kits/iakaframe-claude/global/hooks/chantier-bind.mjs` — **créé** (`SubagentStart`).
- `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` — couche chantier, PowerShell,
  extraction Windows, `ALLOW_EXTRA` reversé, journal enrichi, en-tête divergence Codex.
- `kits/iakaframe-claude/global/hooks/delegation-guard.mjs` — `verdictDispatch`, évènement
  `dispatch`, attribution.
- `kits/iakaframe-claude/global/hooks/plan-courante.mjs` — attribution, `"Agent"`.
- `kits/iakaframe-claude/global/settings.example.json` — matcher + `UserPromptSubmit` + `SubagentStart`.
- `kits/iakaframe-claude/global/README.md`, `kits/iakaframe-claude/global/CLAUDE.md` — doc.
- `library/personas/odin.md`, `library/personas/aragorn.md` — posture/périmètre/obligations (étapes 14–15).
- `library/skills/iakaframe-odin/SKILL.md`, `library/skills/iakaframe-aragorn/SKILL.md` — amendées (étape 16).
- `library/guardrails/perimeter.md` — politique d'ancrage.
- `methode-de-travail.md` — sous-section « Chantier déclaré ».
- `cli/test/fixtures/agents-golden/odin.md`, `cli/test/fixtures/agents-golden/aragorn.md` —
  **régénérés** par `node cli/scripts/gen-agents-golden.mjs`, jamais édités à la main.
- contrats générés par `iakaframe agents --action generate` — régénérés, pas édités à la main.
- `cli/test/guard-core.test.js` — nouveaux cas.
- `cli/test/guard-chantier.test.js` — **créé** (bout-en-bout `spawnSync`).
- `cli/test/fixtures/chantier/` — **créé** (registres JSONL, arbres de dépôts fixtures).
- `cli/test/guard-perimeter-regression.test.js`, `cli/test/guard-core-parity.test.js`,
  `cli/test/guard-codex-complet.test.js`, `cli/test/guard-identity-regression.test.js`,
  `cli/baselines/guard/*` — **inchangés** (doivent passer tels quels).

## Risques

- **Paralysie par blocage direct** (friction élevée : `npm test` sans chantier est refusé, D-7).
  → lecture toujours libre (commandes neutres `cd`/`Set-Location`, options git sautées), lancement =
  chantier implicite (Q1), messages actionnables, interrupteur humain `off` (Q5). Recette réelle
  avant de considérer le lot fini.
- **Bug du garde** → fail-open **visible** (D-10) ; jamais silencieux.
- **Corrélation dispatch → sous-agent heuristique** (`SubagentStart` sans prompt ni `tool_use_id`) :
  dispatchs parallèles du même type vers des dépôts différents → liaison **ambiguë**, fail-closed
  (D-13 §3). Mitigation : message « relancer séquentiellement » ; CA-32 en recette.
- **Hooks non déclenchés dans les sous-agents** (issue #34692 vs doc) → le contrôle au dispatch
  (D-6) reste le seul verrou ; CA-32 le tranche en session réelle.
- **Sous-agents hors outil `Agent`** (ex. outil `Workflow`) : si `SubagentStart` ne se déclenche pas
  ou si aucun `dispatch` n'est posé, ils retombent sur le chantier de session → un workflow lancé du
  portefeuille sur un dépôt exige `chantier <repo>` du décideur. CA-33 le constate.
- **Falsification par un agent adversarial** : un agent qui fabrique une commande shell opaque (par
  ex. chemin reconstruit dynamiquement) peut encore écrire au registre ou au harnais. **La garde vise
  la dérive, pas l'attaque** : elle ferme **tous les chemins outillés** (aucun verbe, fichiers
  hors-limite en forme brute et normalisée, installeur et auto-invocation refusés) et journalise.
  Durcissement : Q7, lot ultérieur.
- **Commandes portefeuille** (D-14) : une liste trop large rouvrirait la faille M-1 → liste fermée
  à trois commandes, un seul segment, thread principal au portefeuille uniquement.
- **Chemins Windows non normalisés** (8.3, casse, M-12) → faux `HORS`/faux `MISMATCH` ;
  normalisation obligatoire (D-4) et cas de test dédié (CA-19).
- **Bruit de détection** : `iakaframe` est à la fois un dépôt et le nom de la méthode. → phrases
  réservées ; si le bruit persiste, ajouter une liste d'exclusion (lot ultérieur).
- **Nom ambigu** (deux clones `naonedge`, M-10) → refus + chemin absolu demandé ; la clé est le
  `root`, jamais le nom seul.
- **Concurrence d'écriture** (hooks parallèles) → append d'une ligne < 4 Ko ; fold tolérant aux
  doublons ; premier `launch` gagnant ; premier `bind` par `agent_id` gagnant.
- **Changement de `session_id`** (`/clear`, éventuellement `--resume`) → grants et liaisons perdus
  (D-10), signalé au prompt suivant.
- **Dette cross-repo** (M-11 : personas, guardrail, skills, goldens) → consignée, traitée dans une
  session `iakaframegui`.
- **Déploiement humain devenu obligatoire** pour `~/.claude/hooks/` et l'installeur (D-9, Q4, Q-C)
  → changement de pratique assumé ; documenté dans le README du kit.

## Critères d'acceptation

Tests `node:test`. **Aucun nouveau test** n'écrit dans le vrai `~/.claude` : `HOME`/`USERPROFILE` et
`IAKAFRAME_ROOT` redirigés vers un tmpdir (les tests de non-régression existants, inchangés, gardent
leur comportement actuel).

**Cœur pur (`guard-core.test.js`)**
- [ ] **CA-1** `foldChantier` : `launch`(repo A) → actif A, segment 1, `by:"launch"` ; + `declare`
      B → actif B, segment 2, segment 1 clos (`until` = `at` du declare) ; `declare` B répété →
      toujours segment 2 ; ligne corrompue ignorée ; deux `launch` → le premier gagne ; `dispatch`
      puis `bind` → `bindings[agent_id].key` = clé du dispatch, dispatch consommé ; deux `bind` pour
      le même `agent_id` → le premier gagne.
- [ ] **CA-2** `parsePromptDirectives` : `"odin-direct naonedge"` seul sur sa ligne → grant ;
      `"on pourrait faire odin-direct naonedge"` → **rien** ; `"Odin-Direct naonedge"` → rien ;
      `"chantier portefeuille"` → declare `@portefeuille`. `parseChantierLines` : prompt
      `"Durée estimée : ~10 min\nChantier: repoA\n…"` → `repoA` ; deux lignes `Chantier:` différentes
      → ambiguïté.
- [ ] **CA-3** `detectRepoMentions` : `naonedge-clients` ne déclenche pas `naonedge` ;
      `"update iakaframe"` ne nomme pas `iakaframe` ; `"regarde iakacockpit"` nomme `iakacockpit`.
- [ ] **CA-4** `classifyShell` : `git status && git log -3` → READ ; `git -C C:/work/x log` → READ,
      cible `C:/work/x` ; `cd C:/work/x && git log` → READ ; `Set-Location C:\work\x; Get-ChildItem`
      → READ ; `git commit -m x` → MUTATE ; `cat a > b` → MUTATE ; `ls 2>&1` → READ ; `npm test` →
      MUTATE ; `Get-ChildItem C:\work | Select-String x` → READ ; `Set-Content C:\x y` → MUTATE ;
      `cd C:/work/naonedge && git commit` → MUTATE, cible `C:/work/naonedge` ;
      `claude --resume abc -p "odin-direct x"` → `selfInvoke` ;
      `echo > ~/.claude/iakaframe-sessions/s.jsonl` → MUTATE + `registryRef` ;
      `cat ~/.claude/iakaframe-sessions/s.jsonl` → READ + `registryRef` ;
      `node install.mjs --overwrite --yes`, `node C:\work\iakaframe\install.mjs`, `iakaframe install`
      → `installerInvoke` ; `iakaframe onboard --path C:\work\neuf` → `portfolioVerb`, un segment,
      chemin `C:\work\neuf` ; `iakaframe agents --action fullteam --project C:\work\x` → `portfolioVerb`.
- [ ] **CA-5** `verdictChantier` couvre les sept règles de D-5 (une fixture par règle, chaque code,
      dont `PORTFOLIO_VERB`, et un sous-agent lié sur B ALLOW alors que le chantier de session est A).
- [ ] **CA-6** `verdictDispatch` couvre D-6 : `Explore` sans chantier → ALLOW sans `dispatch` ;
      régime Odin → `gimli` → `ODIN_DISPATCH` ; régime Odin → `general-purpose`, `claude`,
      `statusline-setup`, `AGENT_UNSET` → `ODIN_DISPATCH` ; Odin → `aragorn` sans ligne `Chantier:`
      → `DISPATCH_UNNAMED` ; ligne `Chantier: X` avec X ∈ `named` → ALLOW + `dispatch{key:X}` ;
      X ∉ `named` → `NOT_DESIGNATED` ; deux lignes divergentes → `DISPATCH_AMBIGUOUS` ; avec grant sur
      l'actif → `gimli` ALLOW ; sous-agent `aragorn` lié à A → `gimli` sans ligne ALLOW +
      `dispatch{key:A}`.
- [ ] **CA-7** `guard-core.mjs` ne contient aucun `import` de `node:fs`/`node:os`/`node:child_process`
      ni `process.` (test de source).
- [ ] **CA-8** `guard-core-parity.test.js` passe **sans modification** (copie Codex identique).

**Bout-en-bout (`guard-chantier.test.js`, hooks lancés par `spawnSync`)**
- [ ] **CA-9** Session lancée au portefeuille (`CLAUDE_PROJECT_DIR` = racine fixture) : le 1ᵉʳ
      hook crée `<sid>.jsonl` avec `launch` `@portefeuille` ; un `Write` sur `<racine>/notes.md` →
      exit 0.
- [ ] **CA-10** Même session : `Edit` sur `<racine>/repoA/x.js` par le thread principal → **exit 2**,
      stderr contient `CHANTIER_MISMATCH`, `Set-Location` (ou `cd`) vers `repoA`, et `chantier repoA`.
- [ ] **CA-11** Prompt `"bosse sur repoA"` puis dispatch `aragorn` (prompt
      `"Durée estimée : ~10 min\nChantier: repoA\n…"`) → exit 0 ; registre : `named` puis `dispatch`
      (`key` repoA) ; **le chantier de session reste `@portefeuille`**.
- [ ] **CA-12** Puis `SubagentStart` (`agent_id` s1, `agent_type:"aragorn"`) → `bind` s1→repoA, stdout
      `additionalContext` contenant `repoA` ; `Edit` repoA **par le thread principal** → exit 2
      `CHANTIER_MISMATCH` ; même `Edit` avec `agent_id:"s1"` → exit 0 ; `Edit` repoB avec
      `agent_id:"s1"` → exit 2.
- [ ] **CA-13** Descendance : `s1` dispatche `gimli` sans ligne → `dispatch{key:repoA}` ;
      `SubagentStart` (`s2`, `gimli`) → `bind` s2→repoA ; `Edit` repoA avec `agent_id:"s2"` → exit 0.
- [ ] **CA-14** Parallèle : prompts nommant repoA et repoB ; deux dispatchs `aragorn` (A puis B),
      deux `SubagentStart` `aragorn` → `bind` avec `key:null` (ambigu) pour les deux ; `Edit` repoA
      par l'un d'eux → exit 2, stderr mentionne « séquentiellement ». Dispatch A, `SubagentStart`, puis
      dispatch B, `SubagentStart` → liaisons A et B correctes, chacun édite son dépôt (exit 0).
- [ ] **CA-15** Prompt contenant la ligne `odin-direct repoA` → `grant` au registre ; ensuite `Edit`
      repoA par le thread principal → exit 0 ; dispatch `gimli` par le thread principal → exit 0.
- [ ] **CA-16** Aucun prompt : dispatch `aragorn` `Chantier: repoB` → exit 2 `NOT_DESIGNATED`,
      **registre inchangé**.
- [ ] **CA-17** Session lancée dans `repoA` : `Edit` repoA → exit 0 (implicite) ; `Edit` repoB →
      exit 2 ; `Bash` `git commit -am x` avec `cwd` = repoB → exit 2 (le `cwd` compte) ; même
      commande `cwd` = repoA → exit 0.
- [ ] **CA-18** Lecture libre : sans chantier (session lancée dans un dossier `@hors`), `Bash`
      `git -C <repoB> log`, `Bash` `cd <repoB> && git status` et `PowerShell` `Get-Content <repoB>\x`
      → exit 0 ; `Bash npm test` (cwd repoB) → exit 2 `NO_CHANTIER`.
- [ ] **CA-19** Exclusions : `Write` dans `payload.scratchpad_dir` et dans `os.tmpdir()` → exit 0
      même sans chantier, **aucune** clé attribuée au journal ; idem quand `scratchpad_dir` est
      fourni en **forme courte 8.3** (win32) et la cible en forme longue, ou l'inverse (M-12) ; payload
      **sans** `scratchpad_dir` → pas d'erreur (tmpdir toujours exclu).
- [ ] **CA-20** Hors-limite : `Write` sur `~/.claude/iakaframe-sessions/<sid>.jsonl` → exit 2
      `DENY_REGISTRY`, y compris avec grant et depuis un sous-agent lié ; `Edit` sur
      `~/.claude/hooks/perimeter-guard.mjs` → exit 2 `DENY_HARNESS` ; (POSIX) `~/.claude/hooks/x.mjs`
      **lien symbolique** vers `<repoA>/kit/x.mjs`, chantier repoA : `Edit` sur le chemin runtime →
      exit 2 `DENY_HARNESS` ; `Bash` `node install.mjs --overwrite --yes` (cwd = dépôt du chantier) et
      `Bash` `iakaframe install` → exit 2 `DENY_HARNESS` ; `Bash` `claude -p "…"` → exit 2
      `DENY_SELF_INVOKE` ; `Bash` `cat ~/.claude/iakaframe-sessions/<sid>.jsonl` → exit 0.
- [ ] **CA-21** **Aucun chemin d'auto-grant** : (a) `grep` sur `cli/src/**` et `install.mjs` : aucune
      écriture vers `iakaframe-sessions` ; (b) un évènement `grant` ou `declare` n'apparaît au
      registre **que** suite à un payload `UserPromptSubmit` ; `delegation-guard`, `perimeter-guard`
      et `chantier-bind` n'émettent jamais `grant` ni `declare` (test de source + test comportemental).
- [ ] **CA-22** Worktree : `Edit` sous `repoA/.claude/worktrees/w1/` (portant un `.git` fichier
      `gitdir: …/repoA/.git/worktrees/w1`) est attribué à `repoA`.
- [ ] **CA-23** Nom ambigu : deux dépôts fixtures de même nom sous deux racines connues ;
      `chantier <nom>` → pas de `declare`, rappel demandant le chemin absolu ; `chantier <chemin>`
      → `declare`.
- [ ] **CA-24** `UserPromptSubmit` : exit 0 dans tous les cas (stdin vide, JSON invalide, registre
      illisible) ; stdout contient toujours la ligne `Chantier actif :` quand un registre existe ;
      le texte du prompt n'est **jamais** recopié dans le stdout ; registre créé alors que `prompt_id`
      est présent → mention « Registre neuf ».
- [ ] **CA-25** Panne : exception forcée dans l'adaptateur → exit 0, stdout JSON avec
      `systemMessage` contenant `FAIL-OPEN`, ligne `FAIL_OPEN` au journal ; le prompt suivant
      rappelle le compte. `chantier-bind` en panne → exit 0, `fail_open` au registre.
- [ ] **CA-26** Interrupteur : `IAKAFRAME_CHANTIER_MODE=off` → CA-10 repasse au comportement
      historique ; valeur `warn` traitée comme `deny`.
- [ ] **CA-27** Commandes portefeuille : session au portefeuille, thread principal,
      `Bash iakaframe onboard --path <racine>/neuf` → exit 0, journal `PORTFOLIO_VERB` ; même commande
      suivie de `&& git commit -am x` → exit 2 ; même commande depuis un sous-agent non lié → exit 2 ;
      même commande dans une session lancée dans `repoA` → règles normales (exit 2 si `neuf` ≠ repoA) ;
      `iakaframe onboard --path C:\Windows\x` (clé `@hors`) → exit 2.
- [ ] **CA-28** Attribution : documents émis par `delegation-guard` et `plan-courante` (transport
      `docdb` vers un serveur HTTP local de test) portent `meta.repo`, `meta.segment`,
      `meta.aragorn` du chantier effectif ; `plan-courante` traite `tool_name:"Agent"` ; chaque ligne
      du journal de périmètre porte `agent_id`, `agent_type` et `chantier.scope`.
- [ ] **CA-29** Non-régression : `guard-perimeter-regression.test.js`, `guard-core.test.js`
      (cas existants), `guard-identity-regression.test.js`, `guard-codex-complet.test.js`,
      `parite-generateurs.test.js` (après régénération des goldens) passent ; les quatre premiers
      **sans modification** ; suite CLI = baseline du Lot 0 + nouveaux tests, **0 fail** (hors
      `vendor-check`, dont la dérive attendue est consignée).

**Recette réelle (Lot 7, décideur)**
- [ ] **CA-30** Session lancée dans `C:\work` : demander une modification de `naonedge` → le
      rappel apparaît, Odin propose une session `naonedge` ; un `Edit` direct est refusé.
- [ ] **CA-31** Taper `odin-direct naonedge` sur une ligne seule → le geste passe ; le registre
      montre `grant` + segment.
- [ ] **CA-32** Dispatch `aragorn` (`Chantier: naonedge` en 2ᵉ ligne) → Aragorn dispatche `gimli` ;
      les `Edit` de Gimli apparaissent au journal **avec `agent_type:"gimli"`** et
      `chantier.scope:"agent"` (preuve que `PreToolUse` et `SubagentStart` se déclenchent dans les
      sous-agents). S'ils sont absents : le noter et remonter.
- [ ] **CA-33** Un `PowerShell` mutateur vers un dépôt ≠ actif est refusé et journalisé ; constater
      (sans exiger) le comportement d'un agent lancé via l'outil `Workflow` et le consigner.

## Estimation (jalon P1→P2)

| | Équivalent j-h | Complexité / risque |
|---|---|---|
| Lot 0 | 0,25 | faible |
| Lot 1 — cœur pur + tests (dont D-13, D-14) | 1,5 | moyenne-élevée (classification shell, fold) |
| Lot 2 — adaptateur d'état | 0,75 | moyenne (worktrees, Windows, 8.3, double comparaison D-9) |
| Lot 3 — `UserPromptSubmit` | 0,5 | faible |
| Lot 3bis — `SubagentStart` (liaison) | 1,0 | **élevée** (corrélation heuristique) |
| Lot 4 — gestes directs | 1,0 | **élevée** (garde bloquant sur chaque geste) |
| Lot 5 — délégation + plan | 0,75 | moyenne |
| Lot 6 — contrats, skills, goldens, méthode | 0,75 | faible |
| **Total dev** | **≈ 6,5 j-h** (fourchette 6–7) + 0,25 recette humaine | **élevée** globalement |

**Inconnues susceptibles de faire glisser :**
1. **Hooks dans les sous-agents** (CA-32) : documentés comme déclenchés ; s'ils ne le sont pas,
   re-cadrage — **+0,5 j-h**.
2. **Forme réelle de l'entrée `SubagentStart`** (documentée partiellement) : si elle porte le
   `tool_use_id` ou le prompt, D-13 devient exact (gain) ; si `SubagentStart` ne se déclenche pas pour
   un type d'agent, liaison impossible pour lui — **+0,25 j-h**.
3. **Friction de la liste de lecture** (D-7) : la première semaine révélera des commandes de
   lecture manquantes — **+0,25 j-h** d'ajustements.
4. **Comportement de `session_id` à `--resume`** : sans impact de code (D-10), impact de doc.

## Questions ouvertes au décideur

Aucune question structurante ouverte : Q1–Q7 et Q-A–Q-E sont arbitrées (tableau « Arbitrages du
décideur »). Instruction amendée **validée** par le décideur le 2026-09-27.

## Sources

- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) (champs communs
  toujours présents / conditionnels, `scratchpad_dir` conditionnel, `agent_id`/`agent_type` en
  sous-agent avec le même `session_id`, hooks déclenchés dans les sous-agents, outil `PowerShell`,
  `UserPromptSubmit`, `PreToolUse` exit 2 / `tool_use_id`, `systemMessage`, `SubagentStart`)
- [Subagents — Claude Code Docs](https://code.claude.com/docs/en/sub-agents) (outil `Agent`,
  imbrication jusqu'à 3 niveaux, fork à la limite, `agent_type` = `name` du frontmatter)
- [Intercept and control agent behavior with hooks — Agent SDK](https://code.claude.com/docs/en/agent-sdk/hooks)
  (entrée `SubagentStart` : `agent_id`, `agent_type` ; `additionalContext`)
- [anthropics/claude-code#87411](https://github.com/anthropics/claude-code/issues/87411) (le prompt
  de la tâche n'est pas fourni à `SubagentStart` — demande ouverte)
- [anthropics/claude-code#29677](https://github.com/anthropics/claude-code/issues/29677) (renommage
  `Task` → `Agent` en v2.1.63 ; matcher `"Task"` toujours honoré)
- [anthropics/claude-code#34692](https://github.com/anthropics/claude-code/issues/34692) (hooks
  non déclenchés dans les sous-agents en v2.1.76 — historique, CA-32)
- [anthropics/claude-code#47018](https://github.com/anthropics/claude-code/issues/47018) (pas de
  `session_id` garanti dans l'environnement de l'outil `Bash`)
