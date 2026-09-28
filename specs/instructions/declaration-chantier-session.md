# Déclaration de chantier par session — attribution au dépôt réel + blocage direct

> **Amendée par `specs/instructions/prise-de-parole-odin-aragorn.md` (validé le 2026-09-27 — voir son
> § 4 « Lectures amendées »).** Lire cette instruction avec : **L-3** (décision 4 : le secours
> « sous-agent `aragorn` » est retiré du contrat ; garde D-6 règle 4 inchangé, Q-P1 = A) ; **L-4**
> (Lot 6 étapes 11-12 : `odin.md` propose une session Aragorn, `aragorn.md` répond du dépôt de
> lancement de sa session) ; **L-5** (§ Messages et rappel `chantier-remind` : option 2 « faire
> designer le depot… puis deleguer a aragorn » retirée) ; **L-6** (Exclu `identity-remind.mjs` levé,
> traité par l'amendement). Le corps ci-dessous n'est pas réécrit.

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2), gate 🏹 Legolas.
> Cible : dépôt `iakaframe` — gardes du kit Claude (`kits/iakaframe-claude/global/hooks/`),
> cœur pur `guard-core.mjs`, contrats `odin.md` / `aragorn.md`, skills `iakaframe-odin` /
> `iakaframe-aragorn`, `methode-de-travail.md`.
> Statut : **amendée (2ᵉ amendement, 2026-09-27) — validée par Stéphane le 2026-09-27 (Q-L1 accepté, Q-L2 oui).**
> Historique : validée le 2026-09-27 (arbitrages Q1–Q7, Q-A–Q-E) ; **repasse « amendée »** suite au
> nouvel arbitrage du décideur (Q-A révisé : **une session Claude par dépôt**, Aragorn en agent
> principal ; régime du thread principal selon `agent_type` ; lancement de session Aragorn par Odin).
> **Implémentation en pause** : Lot 0 et Lot 1 déjà commités (§ « Étapes », Lot 1bis correctif).
> Doc en français, code en anglais.
> **Instruction sœur** : `specs/instructions/lancement-session-aragorn.md` (Odin propose puis lance
> une session `claude --agent aragorn` dans le dépôt). Elle **dépend** de celle-ci (régime Équipe
> D-5, verbe portefeuille D-14, `selfInvoke` D-9) ; celle-ci ne dépend pas d'elle.
> Filiation : prolonge `garde-perimetre-gestes-directs.md` (garde de chemins),
> `gardes-fous-canal-gestes-hooks.md` (un garde n'a d'autorité que sur son canal),
> `parite-enforcement-multirunner.md` (verdicts purs dans `guard-core`),
> `nettoyage-chemin-machine-perimeter-guard.md` (aucun chemin perso dans un kit source).

## 0. Outillage du cadrage — à lire avant les chiffres

- **Cadrage en lecture seule, sans `Bash`** : mesures faites par `Read` / `Grep` / `Glob` et
  vérification web du contrat des hooks. **Aucune suite de tests n'a été exécutée.**
- Mesures initiales prises au commit `2a5bfb1` ; **re-vérifiées sur `8c12e94`** pour les références
  **de source du dépôt** du § 1 et des étapes du Lot 6 (les références **runtime** M-2 journal et M-4
  `~/.claude/settings.json:45` n'ont pas été re-mesurées ; M-5 runtime re-lue).
- **Commits déjà présents** (lus dans `.git/logs/HEAD`, `577f81e..HEAD`) :
  `68da136` `fix(hooks): reintegrate ALLOW_EXTRA roots into kit perimeter-guard source` (Lot 0) ;
  `8b5f014` `feat(guard-core): coeur pur chantier (D-1, D-3, D-5, D-6, D-7, D-13, D-14)` (Lot 1).
  Le cœur commité porte encore la liaison par sous-agent (`bindings`, `dispatch`/`bind`,
  `pickBinding`, `effectiveChantierKey`) et un acteur déduit du seul `agent_id`
  (`guard-core.mjs:555-575`, `:580`) : le **Lot 1bis** les corrige.
- **Remote** : `origin` = **Forgejo VPS** `https://git.naonedge.com/sjupin/iakaframe.git` ; GitHub
  (`github.com/iakasju/iakaframe`) est le remote secondaire `github`.
  **Première étape de l'exécutant à la reprise : `git pull origin main`, puis re-vérifier chaque
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
| M-5 | **Dérive runtime ≠ source** (corrigée par `68da136`) : le `perimeter-guard.mjs` runtime portait les racines `ALLOW_EXTRA` (lues dans `~/.claude/iakaframe-perimeter-allow.txt`, aucun chemin en dur) absentes du kit. | runtime `~/.claude/hooks/perimeter-guard.mjs:49-72` |
| M-6 | **`plan-courante` a une branche morte** : elle teste `tool === "Task"`, or depuis Claude Code **v2.1.63** le payload porte `tool_name:"Agent"` (le matcher `"Task"` reste honoré dans `settings.json`). Son attribution est `conv = basename(cwd)`. | `plan-courante.mjs:42`, `:84-85` |
| M-7 | `delegation-guard` attribue `royaume`/`agent` **depuis l'env** (`IAKALOG_ROYAUME`, constant sur la session) et `conv = session`. Rien ne dit **quel dépôt** est travaillé. | `delegation-guard.mjs:186-197` |
| M-8 | `guard-core` est **dupliqué octet pour octet** dans le kit Codex (test de parité). | `guard-core.mjs:17-20`, `cli/test/guard-core-parity.test.js:16-28` |
| M-9 | Les tests de non-régression du périmètre (et de parité Claude↔Codex) envoient des payloads **sans `session_id`**. | `cli/test/guard-perimeter-regression.test.js:27-37`, `cli/test/guard-codex-complet.test.js:36-45` |
| M-10 | Racine portefeuille : `--root` > `IAKAFRAME_ROOT` > `C:\work` (win32) / `~/work`. Dépôts git sous `C:\work` : `iakaframe`, `iakacockpit`, `iakaframegui`, `naonedge`, `naonedge-clients`, `robotimmo`. **Un 2ᵉ clone `naonedge` existe hors racine** (`C:\Users\Utilisateur\work\naonedge`) : un **nom** de dépôt peut être ambigu. | `cli/src/lib/root.js:6-11` |
| M-11 | Personas, guardrails et skills sont **vendorisés** dans les fixtures du dépôt **`iakaframegui`** (`packages/core/__tests__/fixtures`) : modifier `odin.md` / `aragorn.md` / `perimeter.md` / skills crée une dette de re-vendorisation **dans un autre dépôt**. | `cli/src/lib/vendor.js:91`, `:209-219` |
| M-12 | **Le scratchpad de session est refusé aujourd'hui** (bloqué `HORS` depuis une session `naonedge`). Le chemin arrive en **forme courte 8.3** (`UTILIS~1`) : toute comparaison de chemins doit **normaliser** (`fs.realpathSync.native`) avant `relative()`. | constat de session, 2026-09-27 |
| M-13 | **L'installeur écrit dans le harnais** : `install.mjs` dépose `~/.claude/hooks/*.mjs` et fusionne `~/.claude/settings.json` (`--overwrite --yes` écrase) ; `iakaframe install` le lance. Sous macOS/Linux, `--link` pose des **liens symboliques** runtime → kit. | `install.mjs:80`, `:260`, `:275`, `:347-351` ; `cli/src/commands/install.js:330-396` |
| M-14 | **Odin exécute lui-même des commandes portefeuille** qui écrivent dans un dépôt : `iakaframe onboard --path <projet>`, `iakaframe agents --action fullteam --project <p>` ; il pose la ligne de définition de `specs/PROJET.md`. | `library/personas/odin.md:63-64`, `:72-78` ; `library/skills/iakaframe-odin/SKILL.md:57-60` |
| M-15 | **Consigne de délégation déjà normée** : toute consigne à un sous-agent commence par `Durée estimée : ~<valeur>` (1ʳᵉ ligne). | `library/personas/odin.md:85-86`, `library/skills/iakaframe-odin/SKILL.md:63-64`, `library/skills/iakaframe-aragorn/SKILL.md:64` |
| M-16 | **Goldens d'agents** dérivés des personas, vérifiés par test ; régénération par script. | `cli/test/fixtures/agents-golden/*.md:4`, `cli/test/parite-generateurs.test.js:21`, `cli/scripts/gen-agents-golden.mjs` |
| M-17 | **Deux lanceurs de `claude` existent déjà côté CLI** : `iakaframe go <projet> --do "<tâche>"` lance `claude "<tâche>"` **dans le dossier du projet** (inline) ; la skill `iakastart` appelle le CLI par chemin (`node C:\work\iakaframe\cli\src\index.js banner IAKAFRAME`) et lit `iakaframe models --path <projet> --json`. | `cli/src/commands/go.js:14-21`, `:101-103` ; `library/skills/iakastart/SKILL.md:32`, `:55` |

**Contrat des hooks vérifié (doc officielle, sept. 2026)** :
- **Toujours présents** : `session_id`, `cwd`, `transcript_path`, `hook_event_name`.
  **Conditionnels** : `scratchpad_dir` (« absent when the session has no scratchpad or the temp
  directory is unavailable ») ; `prompt_id` (absent avant la 1ʳᵉ saisie).
- **`agent_id`** : « Present **only** when the hook fires inside a subagent call. Use this to
  distinguish subagent hook calls from main-thread calls. » → **absent** sur le thread principal,
  **y compris** d'une session lancée par `claude --agent <nom>`.
- **`agent_type`** : « Present when the session uses `--agent` or the hook fires inside a subagent.
  For subagents, the subagent's type takes precedence over the session's `--agent` value. » → sur le
  **thread principal** d'une session `claude --agent aragorn`, `agent_type = "aragorn"` **sans**
  `agent_id`. Conséquence : l'**acteur** (`MAIN`/`SUB`) se déduit de `agent_id` ; le **rôle du thread
  principal** se déduit de `agent_type` (D-5). La doc ne dit pas explicitement que `SessionStart`
  reçoit `agent_type` ; on ne s'appuie **pas** sur `SessionStart` (recette CA-31).
- Dans un sous-agent, le `session_id` est **celui de la session parente**. `PreToolUse`/`PostToolUse`
  **se déclenchent dans les sous-agents**. `PreToolUse` porte `tool_use_id`.
- **Outil `PowerShell`** : existe, `tool_input.command` (même forme que Bash) ; matcher `Bash|PowerShell`.
- **Outil de délégation** : `Agent` (ex-`Task`). Imbrication **jusqu'à 3 niveaux** ; à la limite,
  seul un **fork** garde l'outil `Agent`. `agent_type` = `name` du frontmatter du sous-agent.
- **CLI** : `claude --agent <nom>` fixe l'agent de la session ; `claude "<prompt>"` démarre une
  session **interactive** avec un prompt initial ; `--name/-n` nomme la session (titre du terminal,
  cible de messagerie inter-sessions).
- `UserPromptSubmit` : champ `prompt` ; le stdout texte est **injecté comme contexte** ; exit 2
  **efface** le prompt (on ne s'en sert pas). `PreToolUse` : exit 2 **bloque**, le stderr revient au
  modèle ; `systemMessage` (exit 0) est affiché à l'utilisateur.
- **Messagerie inter-sessions** (`ListAgents` / `SendMessage`, `notify_when_idle`) : un message d'une
  autre session **ne vaut jamais consentement** et **n'exécute aucune commande** ; la doc ne dit pas
  s'il déclenche `UserPromptSubmit` dans la session réceptrice (inconnue, CA-33).
- **Non documenté** : conservation du `session_id` à `/clear` et `--resume` (D-10).
- Aucune variable d'environnement de session n'est garantie dans le shell de l'outil `Bash` : **seuls
  les hooks connaissent `session_id` de façon fiable** (D-2).

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
4. **Mode principal : une session Claude par dépôt**, lancée **dans** le dépôt avec **Aragorn en
   agent principal** (`claude --agent aragorn`) ; le chantier est fixé au lancement. Odin (thread
   principal au portefeuille) ne travaille pas dans un dépôt : il **propose** puis, sur
   confirmation, **lance** cette session (instruction sœur) ; en **secours**, il délègue à un
   sous-agent `aragorn` après désignation `chantier <repo>` par le décideur.
5. Exception : **`odin-direct <repo>`** tapé par le décideur dans **son** prompt, détecté par
   `UserPromptSubmit`, portée session, journalisé. **Aucun chemin CLI/Bash** ne permet à l'agent
   d'écrire un grant.
6. Détection : (a) chemin touché ; (b) nom de dépôt dans le prompt → rappel ; (c) règle de
   comportement dans les contrats d'Odin et d'Aragorn.

### Arbitrages du décideur (2026-09-27)

| # | Question | Arbitrage | Porté par |
|---|---|---|---|
| Q1 | Chantier implicite au lancement | **Oui** (`by:"launch"`) | D-3, D-4 |
| Q2 | Déclaration par dispatch Aragorn sur un dépôt nommé par le décideur | ~~Oui~~ → **caduque** (2ᵉ amendement) : le dispatch **ne déclare plus** ; la ligne `Chantier:` est **vérifiée** contre le chantier actif | D-3, D-6 |
| Q3 | Commande shell inconnue = mutatrice | **Oui** (fermée par défaut) | D-7 |
| Q4 | `~/.claude/hooks/` hors-limite, déploiement = geste humain | **Oui** | D-9 |
| Q5 | Interrupteur `IAKAFRAME_CHANTIER_MODE=off`, pas de `warn` | **Oui** | D-10 |
| Q6 | Panne interne : ouverte-mais-visible | **Oui** | D-10 |
| Q7 | Vérification du grant dans `transcript_path` | **Non dans ce lot** | Exclu |
| Q-A | ~~Un chantier par sous-agent via `SubagentStart`~~ | **Révisé** : **une session Claude par dépôt**, Aragorn agent principal ; la liaison par sous-agent (ex-D-13) passe en **Exclu** (justification ci-dessous) | D-3, D-5, Exclu |
| Q-B | Liste fermée de **commandes portefeuille** au thread principal d'Odin, clé = chemin | **Oui** : `onboard`, `init`, `agents fullteam` **+ `launch`** (lanceur de session, instruction sœur) | D-7, D-14 |
| Q-C | `install.mjs` / `iakaframe install` refusés aux agents ; hors-limite comparé avant **et** après `realpath` | **Oui** | D-7, D-9, CA-19 |
| Q-D | En régime Odin, toute délégation hors `aragorn` refusée (`general-purpose`, `claude`, fork, `subagent_type` absent) | **Oui** | D-6 |
| Q-E | iakaTokenCounter | **Exclu** (autre dépôt, lot ultérieur) | Périmètre |
| Q-F | Régime du thread principal selon `agent_type` | **Tranché par le cadrage** (demande du décideur) : absent ou `odin` → **Odin** ; **toute autre valeur** (`aragorn`, `gimli`…) → **Équipe** | D-5 |
| Q-G | Capacité d'Odin : lancer une session Aragorn | **Instruction sœur** `lancement-session-aragorn.md` ; ici seulement le verbe portefeuille (D-14) et le durcissement `selfInvoke` (D-9) | D-9, D-14 |

**Pourquoi la liaison par sous-agent (ex-D-13) passe en Exclu et non en secours.** (1) Le mode
principal (une session par dépôt) couvre le besoin qui la motivait — plusieurs dépôts en parallèle =
plusieurs sessions, chacune avec son chantier fixé. (2) Elle reposait sur une corrélation
**heuristique** (`SubagentStart` ne reçoit ni le prompt ni le `tool_use_id`), ambiguë dès deux
délégations parallèles. (3) Le secours n'en a pas besoin : dans une session Odin, le décideur tape
`chantier <repo>`, le chantier **de session** bascule, et **tous** les sous-agents en héritent — sans
hook `SubagentStart`, sans évènement `dispatch`/`bind`. (4) Gain : −1 j-h, un hook de moins, un risque
élevé de moins (MVP). Coût assumé : dans une session Odin, un seul dépôt à la fois.

**Pourquoi « toute autre valeur » → Équipe (Q-F).** Une session lancée avec `--agent X` (X ≠ odin)
est une session d'**équipe** : elle travaille **dans son répertoire de lancement** et nulle part
ailleurs. Distinguer Aragorn de Gimli au niveau du garde n'apporterait rien (le garde est de
**chemins**, pas de personas) ; les rôles restent portés par les contrats.

### Mécanique retenue (D-1 … D-12, D-14)

**D-1 — Registre.** Un fichier **JSONL append-only** par session :
`~/.claude/iakaframe-sessions/<session_id>.jsonl` (`session_id` filtré sur `[A-Za-z0-9-]`,
sinon couche chantier ignorée). Chaque évènement est **une ligne ajoutée** ; l'historique **est** le
fichier. Évènements (`v:1`, `at`, `type` communs) :

| `type` | Champs | Écrit par |
|---|---|---|
| `launch` | `project_dir`, `key`, `main_role` ∈ `odin`\|`team`, `main_agent_type` (ou `null`) | 1ᵉʳ hook qui voit la session (init paresseuse) |
| `declare` | `key`, `by` ∈ `user`\|`odin-direct`, `aragorn` (`"aragorn@<nom>"`), `team_source` (= `CLAUDE_PROJECT_DIR`), `prompt_id?` | `UserPromptSubmit` **uniquement**, **sessions `odin` uniquement** |
| `grant` | `key`, `by:"user"`, `prompt_id?` | `UserPromptSubmit` **uniquement**, **sessions `odin` uniquement** |
| `named` | `keys[]`, `prompt_id?` | `UserPromptSubmit` |
| `fail_open` | `hook`, `error` (tronqué 300 c.) | tout hook en panne interne |

`main_role` = `mainRoleOf(agent_type)` (pur, D-5) calculé sur le payload qui crée le registre **s'il
n'a pas d'`agent_id`** ; si le tout premier hook est un sous-agent (cas théorique : un prompt précède
toujours un outil), `main_role:"odin"`, `main_agent_type:null`.
`key` = `{ kind: "repo"|"dir"|"portefeuille"|"hors", root, name }`.
**Segments** = dérivés par un **fold pur** (`foldChantier`) : `launch` ouvre le segment 1 ; chaque
`declare` d'une `key` ≠ active ouvre le segment `n+1` et clôt le précédent (`until`). Lignes
illisibles **et types inconnus** (dont d'anciens `dispatch`/`bind`) ignorés ; premier `launch`
gagnant ; `declare` sur la `key` déjà active = sans effet. Dans une session `team`, aucun `declare`
n'existe : le chantier **est** le lancement pour toute la session.

**D-2 — Qui écrit le registre : les hooks, et eux seuls.** Aucun verbe CLI n'écrit le registre
(le CLI ne connaît pas `session_id`). Le garde traite le dossier du registre comme **hors-limite**
(D-9), refuse l'installeur et toute auto-invocation de `claude` par un agent (D-9). Il n'existe donc
**aucune commande outillée** à détourner.

**D-3 — Comment se déclare un chantier (trois voies, et seulement trois).**

| Voie | Geste | Qui | Sessions | Garde-fou |
|---|---|---|---|---|
| **Lancement** (implicite, Q1) — **mode principal** | ouverture de session dans un répertoire, avec ou sans `--agent` (la session Aragorn lancée par Odin est ce cas) | décideur (choix du répertoire, ou confirmation du lancement, instruction sœur) | toutes | `key` du répertoire de lancement. Hors racine et hors dépôt → `kind:"hors"` → **aucun chantier**. |
| **Mot-clé décideur** — **secours** | une **ligne seule** du prompt : `chantier <repo>` | décideur | `odin` seulement | `UserPromptSubmit` → `declare(by:"user")` ; **ignorée** en session `team` (rappel explicatif) |
| **Grant** | une **ligne seule** : `odin-direct <repo>` | décideur | `odin` seulement | `declare(by:"odin-direct")` + `grant` ; **ignorée** en session `team` |

**La délégation ne déclare rien.** Un ordre de mission porte la ligne `Chantier: <repo>` ; le garde la
**vérifie** contre le chantier actif (D-6). Un agent qui voudrait travailler ailleurs doit faire
**changer le chantier par le décideur**, jamais le changer lui-même.
**Confirmation** : si l'agent propose un dépôt, c'est le décideur qui déclare (`chantier <repo>`) ou
qui confirme le lancement d'une session (instruction sœur) ; un agent n'écrit jamais ces lignes.

**Ligne seule, syntaxe fermée** (regex dans `guard-core`, par ligne `trim()`, sensible à la casse) :
- prompt du décideur : `^chantier\s+(\S+)$` et `^odin-direct\s+(\S+)$` ;
- ordre de mission : `^Chantier:\s*(\S+)$`, **en 2ᵉ ligne**, juste après `Durée estimée : ~<valeur>`
  (M-15). Le garde accepte la ligne **à n'importe quelle position** (tolérance) ; plusieurs lignes
  `Chantier:` divergentes → **DENY `DISPATCH_AMBIGUOUS`**.
Une mention **dans une phrase** (« on pourrait faire odin-direct naonedge ») **n'accorde rien**.
`<repo>` = nom de dépôt connu, chemin absolu, ou `portefeuille`. Nom ambigu (M-10) ou inconnu →
**refus** + rappel demandant le chemin absolu. `chantier <nom>` sur un dossier **inexistant** sous la
racine est accepté (`kind:"dir"`, création de projet) ; `odin-direct` exige un dossier existant.

**D-4 — Résolution « chemin → clé » (adaptateur, I/O).** Chemin d'abord **normalisé**
(`fs.realpathSync.native` sur le plus proche ancêtre existant — formes 8.3, casse, M-12), puis :
1. remonter jusqu'à un `.git` → `kind:"repo"`, `root` = dossier qui le porte. Si `.git` est un
   **fichier** dont le `gitdir:` contient `/worktrees/` → `root` = dépôt principal (worktrees de
   Gimli) ; sinon (sous-module) → le dossier lui-même ;
2. sinon, sous la racine (`IAKAFRAME_ROOT` → `C:\work` / `~/work`, même règle que `root.js`) :
   fichier **directement** dans la racine ou dossier `.xxx` de 1ᵉʳ niveau → `kind:"portefeuille"`,
   `name:"@portefeuille"` ; sinon 1ᵉʳ segment → `kind:"dir"` ;
3. sinon → `kind:"hors"`, `name:"@hors"`.
**Dépôts connus** (détection dans les prompts, résolution des noms) = dossiers de 1ᵉʳ niveau de la
racine portant `.git` ∪ dépôt de lancement ∪ clés déjà présentes au registre. Cache par invocation.

**D-5 — Verdict des gestes directs** (`verdictChantier`, pur).
**Acteur et rôle** (fonctions pures) :
- `actor` = `SUB` si le payload porte `agent_id`, sinon `MAIN` ;
- `mainRoleOf(agentType)` = `"odin"` si `agent_type` **absent** ou égal à `odin` (insensible à la
  casse), sinon `"team"` ;
- **rôle de session** `sessionRole` = `launch.main_role` du registre (vaut pour **tous** les acteurs
  de la session, sous-agents compris : leur `agent_type` est celui du sous-agent, pas de la session).
Entrées : `gesture` (`EDIT` = `Edit` | `Write` | `NotebookEdit` ; `SHELL_READ` | `SHELL_MUTATE` =
`Bash` | `PowerShell`), `actor`, `sessionRole`, `launch`, état replié (`active`, `grants`), `keys`
touchées (après exclusions D-8), drapeaux de `classifyShell` (`portfolioVerb`, `segments`). Le
hors-limite D-9 est jugé **avant** cette fonction. Règles, dans l'ordre :
1. `SHELL_READ` → **ALLOW** (lecture libre). `Read`/`Grep`/`Glob` ne sont pas interceptés.
2. `keys` vide (tout est exclu) → **ALLOW**.
3. **Commande portefeuille** (D-14) : `actor = MAIN` **et** `sessionRole = odin` **et**
   `launch.kind = "portefeuille"` **et** `portfolioVerb` **et** **un seul segment** **et** chaque
   `key` ∈ {`repo`, `dir`} sous la racine → **ALLOW `PORTFOLIO_VERB`**.
4. **Session d'équipe hors dépôt** : `sessionRole = team` **et** `launch.kind` ∉ {`repo`, `dir`} →
   **DENY `TEAM_NEEDS_REPO`** (« une session d'équipe se lance dans un dépôt »).
5. `effective` = `active` (dans une session `team`, `active` = lancement, toujours). Pas
   d'`effective` → **DENY `NO_CHANTIER`**.
6. une `key` ≠ `effective` → **DENY `CHANTIER_MISMATCH`** (`@hors` compris).
7. **Régime Odin** — `actor = MAIN` **et** `sessionRole = odin` **et** (`launch.kind =
   "portefeuille"` **ou** `active ≠ launch`) **et** `active.kind ≠ "portefeuille"` **et**
   `active ∉ grants` → **DENY `ODIN_DIRECT`** (« le thread principal n'exécute pas hors de chez lui :
   propose une session Aragorn, ou délègue »).
8. sinon → **ALLOW**.
« Chez soi » = le répertoire de lancement. **Régime Équipe** (`sessionRole = team`) : le thread
principal (Aragorn) et ses sous-agents travaillent **dans le dépôt de lancement**, sans `ODIN_DIRECT`
ni `ODIN_DISPATCH` ; tout autre dépôt est `CHANTIER_MISMATCH`. Une session lancée **sans** `--agent`
dans un dépôt R garde le comportement déjà validé (rôle `odin`, chez soi, geste direct autorisé dans R).

**D-6 — Verdict des délégations** (`verdictDispatch`, pur, appelé par `delegation-guard` **après**
le contrôle de roster existant, inchangé). Entrées : `actor`, `sessionRole`, `target`
(`subagent_type`, `AGENT_UNSET` si absent), lignes `Chantier:` du prompt (résolues par
l'adaptateur), état replié, `launch`. **Aucune écriture au registre.** Règles, dans l'ordre :
1. Cible **lecture seule** (`Explore`, `Plan`, `claude-code-guide` ; **pas** `statusline-setup`, qui
   écrit `settings.json`) → **ALLOW**.
2. Plusieurs lignes `Chantier:` divergentes → **DENY `DISPATCH_AMBIGUOUS`**.
3. Pas de chantier actif → **DENY `NO_CHANTIER`**.
4. **Régime Odin** (mêmes conditions que D-5 règle 7) — Q-D : cible ≠ `aragorn` **et**
   `active ∉ grants` → **DENY `ODIN_DISPATCH`** (vaut **explicitement** pour `general-purpose`,
   `claude`, `statusline-setup`, un **fork**, `AGENT_UNSET`) ; cible `aragorn` **sans** ligne
   `Chantier:` → **DENY `DISPATCH_UNNAMED`**.
5. Ligne `Chantier: <repo>` présente et résolue ≠ `active` → **DENY `CHANTIER_MISMATCH`**
   (« le décideur n'a pas désigné ce dépôt pour cette session : `chantier <repo>`, ou une session
   Aragorn dans ce dépôt »).
6. sinon → **ALLOW** (en régime Équipe, toute cible du roster, avec ou sans ligne).

**D-7 — Classification shell** (`classifyShell(command, dialect)`, pur ; `dialect` =
`bash`|`powershell`). Découpe sur `&&`, `||`, `;`, `|`, retours ligne. **`MUTATE` si** une
redirection d'écriture (`>`, `>>`, `Out-File`, `Set-Content`, `Add-Content`, `Tee-Object`) hors
`2>&1`, `>/dev/null`, `2>/dev/null`, `>$null`, `2>nul`, `>nul` ; **sinon `READ` seulement si chaque
segment** commence (après affectations `X=y`) par une commande **neutre** ou de la **liste de lecture** :
- **neutres** : `cd`, `pushd`, `popd`, `Set-Location`, `Push-Location`, `Pop-Location` — leur
  **cible** est rendue ;
- **liste de lecture** : `ls dir cat head tail less more wc grep rg find(sans -delete/-exec) echo pwd
  which where type file stat du df tree diff cmp sort uniq cut jq sed(sans -i) awk`,
  `git {status,log,diff,show,branch(sans arg ou -a/-r/--list),remote -v,rev-parse,ls-files,blame,describe,config --get}`
  — **options globales de git** (`-C <p>`, `-c <k=v>`, `--git-dir…`, `--work-tree…`, `--no-pager`,
  `-P`) **sautées** avant la sous-commande —, `node|npm|python|claude --version`,
  `iakaframe {list,show,recap,brief,banner,jalon,vendor-check,models(sans set/unset)}`,
  PowerShell `Get-ChildItem Get-Content Get-Item Get-Location Test-Path Resolve-Path Select-String
  Measure-Object Select-Object Sort-Object Where-Object Format-* Write-Output Write-Host`.
- **Forme par chemin du CLI** : `node <…>/cli/src/index.js <verbe> …` (séparateurs `/` ou `\`) est
  traité **exactement** comme `iakaframe <verbe> …` pour les règles de lecture, `portfolioVerb`,
  `installerInvoke` et `selfInvoke` — c'est la forme qu'utilise `iakastart` (M-17) — **sauf pour
  `launch`** : seul le littéral `iakaframe launch …` est un `portfolioVerb` (la forme par chemin reste
  `MUTATE` ordinaire), afin que la règle de permission `ask` du lanceur (instruction sœur) couvre
  **tout** lancement autorisé.
**Tout le reste est `MUTATE`** (Q3).
`classifyShell` rend aussi :
- `paths` : chemins absolus (formes `C:\…`, `C:/…`, `/c/…`, `/…`, `~/…`) ; cibles des commandes
  neutres et de `git -C`/`--git-dir`/`--work-tree` (brutes ; l'adaptateur les résout contre
  `payload.cwd`) ;
- `registryRef` : la chaîne contient `iakaframe-sessions` ;
- `selfInvoke` (**élargi**, D-9) : un segment dont la **commande** est `claude`/`claude.exe`/`claude.cmd`
  (hors `--version`/`-v`/`--help`) ; **ou** un segment dont la commande est un lanceur de processus
  (`wt`, `wt.exe`, `start`, `cmd`, `Start-Process`, `powershell`, `pwsh`) **et** qui contient le mot
  `claude` (non précédé de `.`) ; **ou** `iakaframe go …` (qui lance `claude`, M-17). Un texte qui
  contient « claude » comme simple argument d'une autre commande (`git commit -m "fix claude"`) n'est
  **pas** `selfInvoke` ;
- `installerInvoke` (Q-C) : un segment invoque `install.mjs` (quel que soit le préfixe) **ou**
  `iakaframe install` ;
- `portfolioVerb` (Q-B) : un segment `iakaframe onboard …`, `iakaframe init …`,
  `iakaframe agents fullteam …`, `iakaframe agents --action fullteam …` **ou**
  `iakaframe launch <repo> …` (instruction sœur) ; ses chemins (`--path`, `--project`, le `<repo>`
  résolu du lanceur, sinon `cwd`) entrent dans `paths` ;
- `segments` : nombre de segments.
Pour un `SHELL_MUTATE`, `keys` = clés de {`payload.cwd`} ∪ `paths`. Exception : commande
`portfolioVerb` à un segment **avec** chemin explicite (`--path`/`--project`/`<repo>`) → le `cwd`
n'est pas compté (clé = chemin). Le `<repo>` du lanceur est passé par nom ou chemin ; la résolution
nom → clé est faite par l'adaptateur (D-4, dépôts connus).

**D-8 — Exclusions** (retirées de `keys`, jamais attribuées, jamais bloquées ; comparaison **après
normalisation** D-4) : sous-arbre de `payload.scratchpad_dir` **s'il est présent** ; sous-arbre de
`os.tmpdir()` ; `~/.claude/**` **sauf** les chemins D-9 ; racines `ALLOW_EXTRA` ; `/dev/null`,
`NUL`, `$null`.

**D-9 — Hors-limite absolu** (DENY quel que soit l'acteur ou le rôle, grant compris, **avant tout
autre verdict**). Comparaison sur le chemin **brut résolu ET** sur le chemin **normalisé**
(`realpath`) : hors-limite si **l'une ou l'autre** forme tombe dans la zone (Q-C).
- `~/.claude/settings.json`, `~/.claude/hooks/**`, `~/.claude/iakaframe-perimeter-allow.txt` →
  `DENY_HARNESS` ;
- `~/.claude/iakaframe-sessions/**` → `DENY_REGISTRY` ;
- commande `installerInvoke` → **`DENY_HARNESS`** (le déploiement est un geste humain) ;
- commande `selfInvoke` → **`DENY_SELF_INVOKE`**. Raison : une session `claude` lancée par un agent
  avec un prompt `odin-direct X` déclencherait le `UserPromptSubmit` d'une session **de rôle odin**
  (grant auto-accordé) ; et `claude --resume <id> -p …` viserait la session courante. **Seul** le
  verbe portefeuille `iakaframe launch` (D-14, instruction sœur) lance une session, et **toujours**
  avec `--agent aragorn` (rôle `team` : directives ignorées, D-3) ;
- commande `registryRef` **classée `MUTATE`** → `DENY_REGISTRY` ; classée `READ` → passe (lecture
  libre).

**D-10 — Pannes vs états.**
- **État** (registre lu, aucun chantier, clé ≠ effective, session d'équipe hors dépôt) → **fermé** :
  DENY (décision 3).
- **Panne interne** (exception, payload illisible, erreur d'E/S autre que `ENOENT`) → **ouvert
  mais visible** (Q6) : exit 0 + `{"systemMessage":"[chantier-guard] FAIL-OPEN : <hook> — <erreur>"}`
  + évènement `fail_open` au registre (si écrivable) + ligne `FAIL_OPEN` au journal ; le prochain
  `UserPromptSubmit` rappelle le compte.
- Pas de `session_id` exploitable → **couche chantier ignorée**, comportement **historique** intact
  (M-9).
- **Changement de `session_id`** (`/clear` ; `--resume` si un id neuf est attribué — non documenté)
  → **nouveau registre** : chantier = lancement (Q1), rôle recalculé, **grants et `named` perdus** ;
  `chantier-remind` le signale (« Registre neuf pour cette session… ») quand il crée le registre
  alors que `prompt_id` est présent.
- **Interrupteur humain** (Q5) : `IAKAFRAME_CHANTIER_MODE` = `deny` (défaut) | `off` ; toute autre
  valeur = `deny`. Posé dans l'env de lancement ou `settings.json` (hors-limite, D-9).

**D-11 — Couche chantier = remplacement de l'ancrage, pas un 2ᵉ garde.** Couche active → le chantier
effectif **remplace** `$CLAUDE_PROJECT_DIR` comme périmètre, dans le **même** `perimeter-guard.mjs`
(un verdict par geste, un journal). **Bash/PowerShell en DENY** comme Edit ; `IAKAFRAME_PERIMETER_MODE`
ne gouverne plus que la couche historique. L'en-tête de `perimeter-guard.mjs` documente la
**divergence assumée avec Codex** (couche chantier côté Claude seulement), par symétrie avec
`cli/test/guard-codex-complet.test.js:64-67`.

**D-12 — Réattribution de la main courante** (à l'émission, jamais rétroactive) :
- `perimeter-guard` : chaque ligne de journal porte `agent_id` et `agent_type` (ou `null`) et
  `chantier: {name, root, segment, by, main_role}` ;
- `delegation-guard` : journal + document émis portent `meta.repo`, `meta.repo_root`,
  `meta.segment`, `meta.aragorn`, `meta.main_role`, `meta.agent_id?` ; `royaume` = `key.name` en
  MAJUSCULE si `kind:"repo"|"dir"`, `PORTEFEUILLE` si `@portefeuille`, sinon l'env (inchangé) ;
- `plan-courante` : `conv_id` = `key.name` du chantier (repli : `basename(cwd)`), mêmes `meta.*`,
  même règle de `royaume` ; accepter `tool_name` **`"Agent"` et `"Task"`** (M-6).
**Stats natives** : non déplaçables. Chaque refus `NO_CHANTIER` / `CHANTIER_MISMATCH` / `ODIN_DIRECT`
/ `TEAM_NEEDS_REPO` et chaque rappel **propose** en tête : en session `odin`, « demander à Odin de
lancer une session Aragorn dans <root> » ; sinon `Set-Location <root> ; claude --agent aragorn`
(win32) / `cd <root> && claude --agent aragorn`.

**D-14 — Commandes portefeuille d'Odin (Q-B).** Liste fermée, constante `PORTFOLIO_VERBS` dans
`guard-core` : `iakaframe onboard`, `iakaframe init`, `iakaframe agents fullteam` (et
`iakaframe agents --action fullteam`), **`iakaframe launch`** (lanceur de session Aragorn, instruction
sœur). Autorisées d'office **au thread principal d'une session de rôle `odin` lancée au portefeuille**
(D-5 règle 3), **clé = chemin/dépôt passé**, **un seul segment**, **jamais** au-delà du hors-limite
D-9. Elles ne déclarent pas de chantier ; le journal les marque `verdict: "PORTFOLIO_VERB"`. Tout
autre geste d'Odin dans un dépôt suit D-5/D-6.

**Détection (b) — `UserPromptSubmit` (`chantier-remind.mjs`, nouveau).** À chaque prompt :
(1) init paresseuse (D-1, dont `main_role`) ; (2) directives ligne seule (D-3) → `declare`/`grant`
**en session `odin`** ; **en session `team`**, aucune écriture et un rappel « Session <agent_type> :
chantier fixé au lancement (<nom>). Pour un autre dépôt, demande à Odin de lancer une session dans ce
dépôt. » ; (3) mentions de dépôts connus : mot entier `(?<![\w.-])nom(?![\w.-])`, noms les plus longs
d'abord, **après retrait** des lignes-directives et des **phrases réservées** (`init iakaframe`,
`update iakaframe`, `iakaframe <verbe CLI>`, `iakastart`) → `named` ; (4) stdout : **toujours** une
ligne `Chantier actif : <nom> (<root>) — segment n, depuis <at>, rôle <odin|team:<agent_type>>` ;
**plus**, si besoin, un rappel ≤ 6 lignes : aucun chantier / dépôt mentionné ≠ actif (en session
`odin` : « propose au décideur de lancer une session Aragorn dans ce dépôt, ou la désignation
`chantier <nom>` ») / directive refusée ou ignorée / `fail_open` depuis le dernier prompt / registre
neuf (D-10). **Ne bloque jamais** (exit 0), ne recopie jamais le texte du prompt.

**Détection (c) — contrats.** Odin vérifie à chaque demande l'appartenance au chantier de sa session
et, pour tout travail dans un dépôt, **propose une session Aragorn** (instruction sœur) ; Aragorn
vérifie que chaque demande appartient au dépôt de sa session. Ni l'un ni l'autre ne tape ni ne
suggère `odin-direct` / `chantier` comme s'il pouvait l'accorder ; ils peuvent **informer** le
décideur que ces lignes existent.

## Périmètre

- **Inclus** :
  - **Lot 1bis — correctif du cœur commité** (`8b5f014`) : retrait de la liaison par sous-agent
    (`bindings`, évènements `dispatch`/`bind`, `pickBinding`, branche `SUB` de
    `effectiveChantierKey`) ; ajout de `mainRoleOf`, du rôle de session et des règles D-5/D-6
    révisées (`TEAM_NEEDS_REPO`, `CHANTIER_MISMATCH` au dispatch, suppression de `NOT_DESIGNATED`) ;
    `classifyShell` étendu (`selfInvoke` élargi, forme `node …/cli/src/index.js`, `models` en
    lecture, `claude --version`, `iakaframe launch` en `portfolioVerb`) ; `PORTFOLIO_VERBS` +
    `iakaframe launch` ; tests du Lot 1 adaptés ; copie octet pour octet dans le kit Codex ;
  - adaptateur I/O neuf `chantier-state.mjs` (registre, init paresseuse avec `main_role`, append,
    résolution D-4, dépôts connus, exclusions D-8, hors-limite D-9 double comparaison,
    `systemMessage` de panne) ;
  - `perimeter-guard.mjs` : couche chantier (D-5, D-7…D-11, D-14), outil `PowerShell`, extraction
    Windows, journal enrichi ;
  - `delegation-guard.mjs` : `verdictDispatch` (sans écriture au registre), attribution (D-12) ;
  - `plan-courante.mjs` : attribution + `"Agent"` (D-12, M-6) ;
  - hook neuf `chantier-remind.mjs` (`UserPromptSubmit`) ;
  - `settings.example.json`, README du kit global, `kits/iakaframe-claude/global/CLAUDE.md` ;
  - contrats `odin.md`, `aragorn.md`, skills `iakaframe-odin`, `iakaframe-aragorn`,
    `methode-de-travail.md`, garde-fou `perimeter.md` ; goldens régénérés ; contrats déployés
    régénérés ;
  - tests : unités `guard-core`, fixtures JSONL, bout-en-bout par `spawnSync` des hooks.
- **Exclu** :
  - **liaison du chantier par sous-agent** (ex-D-13 : hook `SubagentStart`, `chantier-bind.mjs`,
    évènements `dispatch`/`bind`) — remplacée par une session par dépôt (Q-A révisé) ;
  - le **lanceur de session** lui-même (verbe `iakaframe launch`, ouverture du terminal, ordre de
    mission, suivi `ListAgents`/`SendMessage`), l'adaptation d'`iakastart` : **instruction sœur**
    `lancement-session-aragorn.md` ;
  - **tout verbe CLI** qui écrit le registre (déclaration ou grant), y compris un
    `iakaframe chantier` ; un `status` en lecture seule est un lot ultérieur ;
  - **réécriture rétroactive** des documents déjà émis ou des journaux existants ;
  - déplacement des **stats natives** Claude Code (on **propose** une session) ;
  - **plusieurs chantiers** dans une même session (une session = un chantier à la fois ; le parallèle
    = plusieurs sessions) ;
  - câblage des adaptateurs **Codex** (seul le cœur est copié, parité octet) ;
  - `frames/releases/StefFrame2/**` (instantané de release, intouché) ;
  - la **re-vendorisation** dans `iakaframegui` (M-11) : autre dépôt, autre session ;
  - **iakaTokenCounter** (Q-E) : autre logiciel, autre dépôt, lot ultérieur ;
  - vérification croisée du grant dans le `transcript_path` (Q7) ;
  - purge / rétention de `~/.claude/iakaframe-sessions/` (lot ultérieur) ;
  - édition de `~/.claude/settings.json`, copie vers `~/.claude/hooks/`, lancement de l'installeur :
    **gestes humains** (Lot 7) ;
  - `identity-guard.mjs`, `identity-remind.mjs`, `iakaframe go` (comportement du verbe inchangé ;
    seul son usage **par un agent** est refusé, D-9).

## Étapes d'implémentation

Un lot = un commit atomique (conventional commits), tests verts avant chaque commit.

**Lot 0 — Remise à niveau et mesure** — ✅ **commité** (`68da136`).

**Lot 1 — Cœur pur** — ✅ **commité** (`8b5f014`), **à corriger par le Lot 1bis**.

**Lot 1bis — Correctif du cœur** (`refactor(guard-core)`)
1. `git pull origin main` ; re-mesurer la suite CLI (baseline de reprise) et la noter en tête de PR.
2. `guard-core.mjs` : retirer `pickBinding`, le suivi `bindings`/`dispatches` et les cas
   `dispatch`/`bind` de `foldChantier` (types désormais ignorés), la branche `SUB` de
   `effectiveChantierKey` ; ajouter `mainRoleOf(agentType)` ; porter `main_role` dans l'état replié
   (`launch.main_role`) ; réécrire `verdictChantier` (8 règles D-5) et `verdictDispatch` (6 règles
   D-6, sans `dispatch` rendu, sans `NOT_DESIGNATED`) ; étendre `classifyShell` (D-7, D-9) et
   `PORTFOLIO_VERBS` (D-14). **Aucune E/S.**
3. Copier le fichier à l'identique dans `kits/iakaframe-codex/global/hooks/guard-core.mjs`.
4. Adapter les tests du Lot 1 (`cli/test/guard-core.test.js`, fixtures `cli/test/fixtures/chantier/`)
   aux CA-1 à CA-9.

**Lot 2 — Adaptateur d'état** (`feat(hooks)`)
5. Créer `chantier-state.mjs` : `registryPath(sid)`, `loadState(sid)` (lecture + fold ; `ENOENT`
   → `null`), `appendEvent(sid, ev)`, `ensureLaunch(payload)` (avec `main_role`/`main_agent_type`,
   D-1), `normalize(abs)` (M-12), `keyOf(absPath, opts)` (D-4 ; `opts.fileTarget` ajouté au Lot 4,
   cf. note de réalisation Lot 4), `knownRepos(state)`
   (`state` facultatif : union des dépôts scannés et des clés de l'état replié, D-4 §3),
   `resolveRepoArg(token, opts)` (nom ou chemin → clé, pour `Chantier:` et `iakaframe launch` ;
   `opts.requireExisting` exige un dossier existant — `odin-direct`, D-3 ; `opts.state` = état replié
   servant à détecter un nom ambigu — D-4/M-10/CA-22), `isExcluded(abs, payload)` (D-8),
   `hardDeny(abs)` (D-9, forme brute **et** normalisée), `failOpen(hook, err)` (D-10),
   `sessionShellHint(root, role)`.
6. Tests avec `HOME`/`USERPROFILE` et `IAKAFRAME_ROOT` redirigés vers un tmpdir, dépôts fixtures
   = dossiers portant un `.git` (dossier, et fichier `gitdir:` de worktree), lien symbolique (POSIX).

> **Note de réalisation (2026-09-27, Lot 2, `08ebd02`)** — Écart de signature tracé a posteriori :
> le récapitulatif annonçait `resolveRepoArg(arg)` ; le livré est `resolveRepoArg(token, opts)`
> (`kits/iakaframe-claude/global/hooks/chantier-state.mjs:257-265`). Justification : `opts.requireExisting`
> distingue la **création** de projet (dossier absent admis) de la directive **`odin-direct`** qui exige
> un dossier existant (D-3) ; `opts.state` permet de repérer un **nom homonyme** sous des racines
> différentes et de rendre `{ ambiguous: true }` (D-4, M-10, CA-22). Écart relevé au gate 🏹 Legolas
> (Lot 2 PASS), jugé **fonctionnellement conforme** ; le récapitulatif ci-dessus est aligné sur le livré.
> Même nature d'écart pour `knownRepos()` → livré `knownRepos(state)` (`chantier-state.mjs:240`) :
> `state` facultatif ajoute aux dépôts scannés sous la racine les clés déjà présentes dans l'état replié
> de la session, dont le dépôt de lancement (D-4 §3) ; aligné sur demande d'Aragorn le 2026-09-27.

**Lot 3 — Prompt** (`feat(hooks)`)
7. Créer `chantier-remind.mjs` (détection b, directives en session `odin` seulement, rappel en
   session `team`, `named`, registre neuf, exit 0 inconditionnel).

**Lot 4 — Gestes directs** (`feat(hooks)`)
8. `perimeter-guard.mjs` : si `IAKAFRAME_CHANTIER_MODE ≠ off` et `session_id` valide → couche
   chantier (D-11), hors-limite D-9 d'abord, puis `verdictChantier` (acteur par `agent_id`, rôle par
   le registre) ; sinon chemin historique **inchangé**. `tool_name` `PowerShell`
   (`tool_input.command`, dialecte `powershell`). Journal enrichi (D-12). Messages de refus
   actionnables (modèle au § « Messages »). En-tête : divergence Codex assumée (D-11).

> **Note de réalisation (2026-09-28, Lot 4, `f414d2f`)** — Écarts déclarés par ⚒️ Gimli, vérifiés
> sur le code livré :
> 1. **`chantier-state.mjs` retouché au Lot 4** (hors fichier du lot) : `keyOf(absPath)` devient
>    `keyOf(absPath, opts)` (`kits/iakaframe-claude/global/hooks/chantier-state.mjs:155-221`).
>    `opts.fileTarget` (facultatif) signale que le chemin est la cible d'un `Edit`/`Write`/
>    `NotebookEdit`, donc **un fichier**, jamais un dossier : un chemin **inexistant** à un seul
>    segment sous la racine est alors classé `portefeuille` au lieu de `dir` (`:207-215`). Sans ce
>    hint, `Write <racine>/notes.md` (fichier neuf) était attribué à un dossier de projet `notes.md`
>    et CA-10 échouait. Sans le hint (appelants du Lot 2/3 : `chantier-remind.mjs`,
>    `resolveRepoArg`, chemins `--path`/`--project` du shell), comportement **inchangé** (création de
>    projet, D-3). Seul appelant du hint : `perimeter-guard.mjs:287`. Le récapitulatif du Lot 2
>    (étape 5) est aligné.
> 2. **Nom du fichier de test** : `cli/test/guard-chantier-perimeter.test.js` au lieu de
>    `guard-chantier.test.js`, par cohérence avec la convention `guard-chantier-<composant>` des
>    Lots 2 (`guard-chantier-state.test.js`) et 3 (`guard-chantier-remind.test.js`). Les mentions
>    de `guard-chantier.test.js` (§ Fichiers concernés, § Critères « Bout-en-bout ») sont alignées ;
>    le Lot 5 suit la même convention.
> 3. **Messages de refus** : modèle du § « Messages » appliqué **avec la lecture L-5** de
>    `specs/instructions/prise-de-parole-odin-aragorn.md` (§ 4) — l'option 2 « faire designer le
>    depot… puis deleguer a aragorn » est absente ; seule reste la proposition d'une session Aragorn
>    (`perimeter-guard.mjs:37-40`, `:159-183`). Aucun verdict n'est modifié par cette lecture.
> 4. **CA-17, dernier cas — NON tranché ici, en attente d'arbitrage du décideur.** Le livré rend
>    `CHANTIER_MISMATCH` (`cli/test/guard-chantier-perimeter.test.js:341-349`) là où CA-17 attend
>    `NO_CHANTIER`. Le libellé de CA-17 est **conservé** : D-3 (« Hors racine et hors dépôt →
>    `kind:"hors"` → **aucun chantier** ») et la décision 3 (« sans chantier → DENY ») fondent
>    `NO_CHANTIER` ; l'écart vient de `foldChantier`, qui ouvre un segment actif pour un `launch`
>    `@hors` (`guard-core.mjs:228-237`). Constat remis à Aragorn pour décision de Stéphane.

**Lot 5 — Délégation et plan** (`feat(hooks)`)
9. `delegation-guard.mjs` PreToolUse : après le roster, `verdictDispatch` (aucune écriture au
   registre). Attribution D-12 en PreToolUse et PostToolUse.
10. `plan-courante.mjs` : attribution D-12 ; accepter `"Agent"`.

**Lot 6 — Contrats, skills et méthode** (`docs`)
11. `library/personas/odin.md` :
    - § **Posture** (`:33-46`) : les chantiers transverses sont orchestrés **par des sessions Aragorn,
      une par dépôt** (lancées sur confirmation, instruction sœur), jamais par un geste direct ;
    - § **Périmètre** (`:60-70`) : « Démarrer un projet » / « Créer une équipe » restent **à lui**
      via les commandes portefeuille (D-14) ; ajout « **Lancer une session Aragorn** dans un dépôt,
      sur confirmation du décideur » (renvoi à l'instruction sœur) ; « n'écrit pas dans le code des
      projets » → renvoi au garde ;
    - § **Obligation — ligne de définition** (`:72-78`) : posée au démarrage via `iakaframe onboard` ;
      toute **évolution** de `specs/PROJET.md` passe par la **session Aragorn** du dépôt (ou
      `odin-direct` tapé par le décideur) ;
    - § **Entrées → Sorties / Délègue** (`:85-86`) : 2ᵉ ligne `Chantier: <repo>` après la ligne de
      durée, dans tout ordre de mission (sous-agent en secours, ou session lancée). ⚠️ Ne **pas**
      recopier le littéral de la ligne de durée : `duree-estimee-delegation.md` CA-3 exige qu'il
      n'apparaisse qu'**une** fois dans `odin.md` et dans `iakaframe-odin/SKILL.md` ;
    - nouvelle section **« Obligation — chantier déclaré »** après § Étanchéité (`:105-114`) : mode
      principal (proposer une session Aragorn), secours (`chantier <repo>` par le décideur puis
      sous-agent `aragorn`), vérification d'appartenance à chaque demande, interdiction de
      s'auto-accorder `odin-direct`/`chantier`, délégation hors `aragorn` refusée en régime Odin.
      **Réciprocité** : nomme Aragorn et la session Aragorn.
12. `library/personas/aragorn.md` : section **« Obligation — chantier déclaré »** après
    § Étanchéité (`:167-168`) : un Aragorn répond d'**un** dépôt — **le dépôt de lancement de sa
    session** (mode principal, agent principal `--agent aragorn`) ou le chantier de session désigné
    par le décideur (secours, sous-agent) ; il vérifie à chaque demande que le travail appartient à ce
    dépôt ; hors chantier → il s'arrête et remonte à Odin / au décideur (session dans le bon dépôt) ;
    il ne tape jamais `chantier`/`odin-direct` ; ses ordres de mission portent `Chantier: <repo>` en
    2ᵉ ligne ; en session lancée par Odin, il lit et exécute l'ordre de mission reçu (instruction
    sœur). **Réciprocité** : nomme Odin.
13. `library/skills/iakaframe-odin/SKILL.md` — **amendée** : étape « Démarrer / Créer » (`:57-60`)
    → commandes portefeuille D-14 ; étape « Délègue » (`:63-64`) → mode principal = proposer puis
    lancer une session Aragorn (renvoi instruction sœur), ligne `Chantier:` en 2ᵉ ligne.
    `library/skills/iakaframe-aragorn/SKILL.md` — **amendée au seul § Étanchéité** (`:98`) → « un
    dépôt : celui de la session ; hors chantier on s'arrête et on remonte ». Le **gabarit de consigne
    (`:63-70`) reste intact** : en régime Équipe la ligne `Chantier:` est facultative (D-6 règle 6),
    et `duree-estimee-delegation.md` CA-2 exige que la ligne de durée soit **immédiatement** suivie de
    `# Ordre de mission — {agent} — {date}`. Les autres skills restent **intactes** (elles ne
    délèguent pas hors de leur dépôt ni ne décrivent le périmètre d'Odin) ; `iakastart` est traitée
    par l'instruction sœur.
14. `methode-de-travail.md` : sous-section **« Chantier déclaré — une session, un dépôt »** après
    § Étanchéité (`:374-385`) : mode principal (session Aragorn par dépôt), régimes Odin / Équipe,
    secours `chantier <repo>`, `odin-direct`, commandes portefeuille, proposition de session,
    interrupteur humain.
15. `library/guardrails/perimeter.md` : `policy` et corps → ancrage « chantier de session (lancement,
    ou désignation du décideur en session Odin), à défaut `CLAUDE_PROJECT_DIR` ».
16. `kits/iakaframe-claude/global/CLAUDE.md` : un paragraphe dans les conventions permanentes
    (une session par dépôt, Aragorn principal ; mots-clés `chantier <repo>` / `odin-direct <repo>`,
    ligne seule ; `Chantier:` en 2ᵉ ligne des délégations).
17. `settings.example.json` : matcher `Edit|Write|Bash|NotebookEdit|PowerShell` ; 2ᵉ entrée
    `UserPromptSubmit` → `chantier-remind.mjs`. README du kit : fichiers ajoutés (`chantier-state`,
    `chantier-remind`), interrupteur, installeur et auto-invocation refusés aux agents.
18. Régénérations (jamais d'édition à la main) : `node cli/scripts/gen-agents-golden.mjs` (goldens
    `odin`, `aragorn`) ; `node cli/scripts/gen-skills-golden.mjs` (skills `iakaframe-odin`,
    `iakaframe-aragorn`) ; `node cli/scripts/gen-methode-vitrine.mjs` (la vitrine
    `methode-de-travail.html` embarque contrats et SKILL.md, garde `cli/test/vitrine-methode.test.js`) ;
    puis `iakaframe agents --action generate` et `--check` ; `vendor-check` : dérive vers
    `iakaframegui` **attendue**, **consignée** en tête de PR, pas corrigée ici.

**Lot 7 — Déploiement et recette (gestes HUMAINS, décideur)**
19. Copier `kits/iakaframe-claude/global/hooks/*.mjs` → `~/.claude/hooks/` (ou lancer soi-même
    l'installeur) ; fusionner les changements de `settings.example.json` dans `~/.claude/settings.json`.
20. Recette en session réelle : CA-29 à CA-33.
21. Clôture : `iakaframe update` (état des lieux + commit + push), gate Legolas avant.

### Messages (modèle, à tenir mot pour mot sur la structure)

```
[chantier-guard] REFUSE (<CODE>) : <Outil> vise <nom> (<root>).
  Chantier actif : <nom actif | aucun> (role <odin | team:<agent_type>>) — session <sid 8 c.>.
  Pour continuer :
   1. (recommande) une session Aragorn dans le depot : [role odin] demande a Odin de la lancer ;
      sinon : Set-Location <root> ; claude --agent aragorn
   2. [role odin] faire designer le depot par le decideur : une ligne seule `chantier <nom>`,
      puis deleguer a aragorn avec la ligne `Chantier: <nom>` (2e ligne de l'ordre de mission)
  L'exception `odin-direct <nom>` ne peut etre tapee QUE par le decideur. La lecture reste libre.
```

## Fichiers concernés

- `kits/iakaframe-claude/global/hooks/guard-core.mjs` — correctif Lot 1bis (D-1, D-3, D-5, D-6, D-7,
  D-9, D-14).
- `kits/iakaframe-codex/global/hooks/guard-core.mjs` — copie octet pour octet.
- `kits/iakaframe-claude/global/hooks/chantier-state.mjs` — **créé** (adaptateur I/O).
- `kits/iakaframe-claude/global/hooks/chantier-remind.mjs` — **créé** (`UserPromptSubmit`).
- `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` — couche chantier, PowerShell,
  extraction Windows, journal enrichi, en-tête divergence Codex.
- `kits/iakaframe-claude/global/hooks/delegation-guard.mjs` — `verdictDispatch`, attribution.
- `kits/iakaframe-claude/global/hooks/plan-courante.mjs` — attribution, `"Agent"`.
- `kits/iakaframe-claude/global/settings.example.json` — matcher + `UserPromptSubmit`.
- `kits/iakaframe-claude/global/README.md`, `kits/iakaframe-claude/global/CLAUDE.md` — doc.
- `library/personas/odin.md`, `library/personas/aragorn.md` — étapes 11–12.
- `library/skills/iakaframe-odin/SKILL.md`, `library/skills/iakaframe-aragorn/SKILL.md` — étape 13.
- `library/guardrails/perimeter.md` — politique d'ancrage.
- `methode-de-travail.md` — sous-section « Chantier déclaré ».
- `cli/test/fixtures/agents-golden/odin.md`, `cli/test/fixtures/agents-golden/aragorn.md`, goldens
  de skills (`gen-skills-golden.mjs`) et zone `CODE_BLOCKS` de `methode-de-travail.html`
  (`gen-methode-vitrine.mjs`) — **régénérés**, jamais édités à la main (étape 18).
- contrats générés par `iakaframe agents --action generate` — régénérés.
- `cli/test/guard-core.test.js`, `cli/test/fixtures/chantier/` — adaptés (Lot 1bis) puis complétés.
- `cli/test/guard-chantier-<composant>.test.js` — **créés** (bout-en-bout `spawnSync`, un fichier par
  composant, convention fixée au Lot 4) : `guard-chantier-state.test.js` (Lot 2),
  `guard-chantier-remind.test.js` (Lot 3), `guard-chantier-perimeter.test.js` (Lot 4),
  `guard-chantier-delegation.test.js` et `guard-chantier-plan.test.js` (Lot 5).
- `cli/test/guard-perimeter-regression.test.js`, `cli/test/guard-core-parity.test.js`,
  `cli/test/guard-codex-complet.test.js`, `cli/test/guard-identity-regression.test.js`,
  `cli/baselines/guard/*` — **inchangés** (doivent passer tels quels).

## Risques

- **Paralysie par blocage direct** (`npm test` sans chantier refusé, D-7) → lecture libre (neutres,
  options git sautées, forme `node …/cli/src/index.js`), lancement = chantier implicite (Q1),
  messages actionnables, interrupteur `off` (Q5). Recette réelle avant de clore.
- **Bug du garde** → fail-open **visible** (D-10).
- **`agent_type` absent sur le thread principal d'une session `--agent`** (contraire à la doc) → la
  session serait jugée `odin` : chez soi dans son dépôt → gestes directs **autorisés** quand même (D-5
  règle 7 ne s'applique pas chez soi), mais délégations hors `aragorn` refusées si le chantier a
  dérivé. Recette CA-31 ; en cas d'écart, remonter.
- **Messages inter-sessions et `UserPromptSubmit`** : si un message d'une autre session déclenche
  `UserPromptSubmit` dans une session `odin` et contient une ligne `odin-direct X`, il accorderait un
  grant. Mitigations : en session `team` les directives sont ignorées ; les contrats interdisent aux
  agents d'écrire ces lignes ; **CA-33** le vérifie en recette — si le grant apparaît, **arrêt** et
  réouverture de Q7 (vérification dans `transcript_path`) avant d'activer le suivi inter-sessions.
- **`selfInvoke` élargi** : faux positifs possibles (un lanceur de processus dont un argument contient
  le mot `claude`) → refus explicite `DENY_SELF_INVOKE`, contournable par le décideur ; faux négatifs
  (lancement opaque) → la garde vise la dérive, pas l'attaque.
- **Hooks non déclenchés dans les sous-agents** (issue #34692 vs doc) → le contrôle au dispatch (D-6)
  reste le seul verrou ; CA-31 le tranche.
- **Sous-agents hors outil `Agent`** (ex. `Workflow`) : ils héritent du chantier de session (sans
  liaison propre) ; CA-32 le constate.
- **Falsification par un agent adversarial** (commande opaque) → hors cible : la garde ferme les
  chemins outillés et journalise ; durcissement Q7 ultérieur.
- **Commandes portefeuille** (D-14) : liste fermée à cinq formes, un seul segment, thread principal
  `odin` au portefeuille uniquement.
- **Chemins Windows non normalisés** (8.3, casse, M-12) → normalisation obligatoire (D-4), CA-18.
- **Bruit de détection** (`iakaframe` = dépôt et méthode) → phrases réservées.
- **Nom ambigu** (deux clones `naonedge`, M-10) → refus + chemin absolu demandé ; la clé est le `root`.
- **Concurrence d'écriture** → append d'une ligne < 4 Ko ; fold tolérant ; premier `launch` gagnant.
- **Changement de `session_id`** → grants et `named` perdus (D-10), signalé.
- **Code du Lot 1 à défaire** (`8b5f014`) → Lot 1bis dédié, commit séparé, tests adaptés.
- **Dette cross-repo** (M-11) → consignée, traitée dans une session `iakaframegui`.
- **Déploiement humain obligatoire** pour `~/.claude/hooks/` et l'installeur (D-9) → documenté.

## Critères d'acceptation

Tests `node:test`. **Aucun nouveau test** n'écrit dans le vrai `~/.claude` : `HOME`/`USERPROFILE` et
`IAKAFRAME_ROOT` redirigés vers un tmpdir (les tests de non-régression existants, inchangés, gardent
leur comportement actuel).

**Cœur pur (`guard-core.test.js`)**
- [ ] **CA-1** `foldChantier` : `launch`(repo A, `main_role:"odin"`) → actif A, segment 1,
      `by:"launch"`, `launch.main_role:"odin"` ; + `declare` B → actif B, segment 2, segment 1 clos ;
      `declare` B répété → toujours segment 2 ; ligne corrompue ignorée ; lignes `dispatch`/`bind`
      (anciens types) ignorées ; deux `launch` → le premier gagne.
- [ ] **CA-2** `parsePromptDirectives` : `"odin-direct naonedge"` seul sur sa ligne → grant ;
      `"on pourrait faire odin-direct naonedge"` → **rien** ; `"Odin-Direct naonedge"` → rien ;
      `"chantier portefeuille"` → declare `@portefeuille`. `parseChantierLines` : prompt
      `"Durée estimée : ~10 min\nChantier: repoA\n…"` → `repoA` ; deux lignes différentes → ambiguïté.
- [ ] **CA-3** `detectRepoMentions` : `naonedge-clients` ne déclenche pas `naonedge` ;
      `"update iakaframe"` ne nomme pas `iakaframe` ; `"regarde iakacockpit"` nomme `iakacockpit`.
- [ ] **CA-4** `classifyShell` : `git status && git log -3` → READ ; `git -C C:/work/x log` → READ,
      cible `C:/work/x` ; `cd C:/work/x && git log` → READ ; `Set-Location C:\work\x; Get-ChildItem`
      → READ ; `git commit -m x` → MUTATE ; `cat a > b` → MUTATE ; `ls 2>&1` → READ ; `npm test` →
      MUTATE ; `Set-Content C:\x y` → MUTATE ; `cd C:/work/naonedge && git commit` → MUTATE, cible ;
      `echo > ~/.claude/iakaframe-sessions/s.jsonl` → MUTATE + `registryRef` ;
      `cat ~/.claude/iakaframe-sessions/s.jsonl` → READ + `registryRef` ;
      `node install.mjs --overwrite --yes`, `iakaframe install` → `installerInvoke` ;
      **`selfInvoke`** : `claude --resume abc -p "x"`, `claude --agent aragorn "x"`, `claude "x"`,
      `wt -d C:\work\x claude`, `Start-Process claude -ArgumentList x`,
      `iakaframe go naonedge --do x` → vrai ; `claude --version` → READ, pas `selfInvoke` ;
      `git commit -m "fix claude"` → pas `selfInvoke` ;
      **forme CLI par chemin** : `node C:\work\iakaframe\cli\src\index.js banner IAKAFRAME` → READ ;
      `iakaframe models --path C:\work\x --json` → READ ; `iakaframe models set x y` → MUTATE ;
      **`portfolioVerb`** : `iakaframe onboard --path C:\work\neuf`, `iakaframe agents --action
      fullteam --project C:\work\x`, `iakaframe launch naonedge --mission-file f.md` → vrai, un
      segment, chemin/dépôt rendu.
- [ ] **CA-5** `verdictChantier` couvre les huit règles de D-5 (une fixture par règle et par code,
      dont `PORTFOLIO_VERB` et `TEAM_NEEDS_REPO`) ; en rôle `team` lancé dans A, le thread principal
      `Edit` A → ALLOW (jamais `ODIN_DIRECT`) et `Edit` B → `CHANTIER_MISMATCH`.
- [ ] **CA-6** `verdictDispatch` couvre D-6 : `Explore` sans chantier → ALLOW ; régime Odin →
      `gimli`, `general-purpose`, `claude`, `statusline-setup`, `AGENT_UNSET` → `ODIN_DISPATCH` ;
      régime Odin → `aragorn` sans ligne → `DISPATCH_UNNAMED` ; ligne = actif → ALLOW ; ligne ≠ actif
      → `CHANTIER_MISMATCH` ; deux lignes divergentes → `DISPATCH_AMBIGUOUS` ; grant sur l'actif →
      `gimli` ALLOW ; rôle `team` : thread principal → `gimli` sans ligne → ALLOW, ligne ≠ lancement →
      `CHANTIER_MISMATCH` ; aucun chantier → `NO_CHANTIER`. Aucun résultat ne porte d'évènement à
      écrire.
- [ ] **CA-7** `guard-core.mjs` ne contient aucun `import` de `node:fs`/`node:os`/`node:child_process`
      ni `process.` (test de source) ; ne contient plus `pickBinding` ni `bindings`.
- [ ] **CA-8** `guard-core-parity.test.js` passe **sans modification** (copie Codex identique).
- [ ] **CA-9** `mainRoleOf` : `undefined`/`null`/`""` → `odin` ; `"odin"`, `"Odin"` → `odin` ;
      `"aragorn"`, `"gimli"`, `"Explore"` → `team`.

**Bout-en-bout (`guard-chantier-<composant>.test.js`, hooks lancés par `spawnSync`)**
- [ ] **CA-10** Session lancée au portefeuille (`CLAUDE_PROJECT_DIR` = racine fixture, payloads sans
      `agent_type`) : le 1ᵉʳ hook crée `<sid>.jsonl` avec `launch` `@portefeuille`, `main_role:"odin"` ;
      `Write` sur `<racine>/notes.md` → exit 0.
- [ ] **CA-11** Même session : `Edit` sur `<racine>/repoA/x.js` par le thread principal → **exit 2**,
      stderr contient `CHANTIER_MISMATCH`, « session Aragorn » et `chantier repoA`.
- [ ] **CA-12** Secours : prompt avec la ligne `chantier repoA` → `declare(by:"user")`, segment 2 ;
      `Edit` repoA par le thread principal → exit 2 `ODIN_DIRECT` ; dispatch `aragorn` (prompt
      `"Durée estimée : ~10 min\nChantier: repoA\n…"`) → exit 0, **registre inchangé** ; `Edit` repoA
      avec `agent_id:"s1"`, `agent_type:"aragorn"` → exit 0 ; `Edit` repoB avec `agent_id:"s1"` →
      exit 2 ; dispatch `aragorn` `Chantier: repoB` → exit 2 `CHANTIER_MISMATCH` ; dispatch `gimli`
      par le thread principal → exit 2 `ODIN_DISPATCH`.
- [ ] **CA-13** Prompt contenant la ligne `odin-direct repoA` → `grant` ; `Edit` repoA par le thread
      principal → exit 0 ; dispatch `gimli` par le thread principal → exit 0.
- [ ] **CA-14** **Session d'équipe** : `CLAUDE_PROJECT_DIR` = repoA, payloads du thread principal
      avec `agent_type:"aragorn"` **sans** `agent_id` → `launch` `main_role:"team"`,
      `main_agent_type:"aragorn"` ; `Edit` repoA → exit 0 ; dispatch `gimli` sans ligne → exit 0 ;
      `Edit` repoA avec `agent_id:"s2"`, `agent_type:"gimli"` → exit 0 ; `Edit` repoB (principal ou
      sous-agent) → exit 2 `CHANTIER_MISMATCH` ; prompt `chantier repoB` → **aucun** `declare`,
      stdout mentionne « chantier fixé au lancement » ; prompt `odin-direct repoB` → **aucun** `grant`.
- [ ] **CA-15** Session d'équipe lancée au portefeuille (`--agent aragorn` dans la racine) : `Write`
      `<racine>/notes.md` → exit 2 `TEAM_NEEDS_REPO` ; `Bash iakaframe launch repoA …` → exit 2.
- [ ] **CA-16** Session lancée dans `repoA` sans `--agent` : `Edit` repoA → exit 0 ; `Edit` repoB →
      exit 2 ; `Bash` `git commit -am x` avec `cwd` = repoB → exit 2 ; même commande `cwd` = repoA →
      exit 0.
- [ ] **CA-17** Lecture libre : sans chantier (session lancée dans un dossier `@hors`), `Bash`
      `git -C <repoB> log`, `Bash` `cd <repoB> && git status`, `PowerShell` `Get-Content <repoB>\x`,
      `Bash node <racine>/iakaframe/cli/src/index.js banner X` → exit 0 ; `Bash npm test` (cwd repoB)
      → exit 2 `NO_CHANTIER`.
- [ ] **CA-18** Exclusions : `Write` dans `payload.scratchpad_dir` et dans `os.tmpdir()` → exit 0
      même sans chantier, **aucune** clé attribuée ; idem en **forme courte 8.3** (win32) contre forme
      longue, ou l'inverse (M-12) ; payload **sans** `scratchpad_dir` → pas d'erreur.
- [ ] **CA-19** Hors-limite : `Write` sur `~/.claude/iakaframe-sessions/<sid>.jsonl` → exit 2
      `DENY_REGISTRY`, y compris avec grant, depuis un sous-agent, et en session d'équipe ; `Edit`
      sur `~/.claude/hooks/perimeter-guard.mjs` → exit 2 `DENY_HARNESS` ; (POSIX) lien symbolique
      `~/.claude/hooks/x.mjs` → `<repoA>/kit/x.mjs`, chantier repoA : `Edit` sur le chemin runtime →
      exit 2 `DENY_HARNESS` ; `Bash` `node install.mjs --overwrite --yes` et `Bash`
      `iakaframe install` → exit 2 `DENY_HARNESS` ; `Bash` `claude -p "…"`, `Bash`
      `claude --agent aragorn "odin-direct x"`, `PowerShell` `Start-Process claude -ArgumentList x`,
      `Bash` `iakaframe go repoA --do x` → exit 2 `DENY_SELF_INVOKE` ; `Bash`
      `cat ~/.claude/iakaframe-sessions/<sid>.jsonl` → exit 0.
- [ ] **CA-20** **Aucun chemin d'auto-grant** : (a) `grep` sur `cli/src/**` et `install.mjs` : aucune
      écriture vers `iakaframe-sessions` ; (b) un `grant` ou `declare` n'apparaît au registre **que**
      suite à un payload `UserPromptSubmit` **d'une session `odin`** ; `delegation-guard` et
      `perimeter-guard` n'écrivent que `launch` et `fail_open` (test de source + comportemental).
- [ ] **CA-21** Worktree : `Edit` sous `repoA/.claude/worktrees/w1/` (fichier `.git` `gitdir:
      …/repoA/.git/worktrees/w1`) est attribué à `repoA`.
- [ ] **CA-22** Nom ambigu : deux dépôts fixtures de même nom sous deux racines connues ;
      `chantier <nom>` → pas de `declare`, rappel demandant le chemin absolu ; `chantier <chemin>` →
      `declare`.
- [ ] **CA-23** `UserPromptSubmit` : exit 0 dans tous les cas (stdin vide, JSON invalide, registre
      illisible) ; stdout contient toujours `Chantier actif :` et le rôle quand un registre existe ;
      le texte du prompt n'est **jamais** recopié ; registre créé alors que `prompt_id` est présent →
      « Registre neuf ».
- [ ] **CA-24** Panne : exception forcée dans l'adaptateur → exit 0, stdout JSON avec `systemMessage`
      contenant `FAIL-OPEN`, ligne `FAIL_OPEN` au journal ; le prompt suivant rappelle le compte.
- [ ] **CA-25** Interrupteur : `IAKAFRAME_CHANTIER_MODE=off` → CA-11 repasse au comportement
      historique ; valeur `warn` traitée comme `deny`.
- [ ] **CA-26** Commandes portefeuille : session `odin` au portefeuille, thread principal,
      `Bash iakaframe onboard --path <racine>/neuf` et `Bash iakaframe launch repoA --mission-file
      <tmp>/m.md` → exit 0, journal `PORTFOLIO_VERB` ; la même suivie de `&& git commit -am x` →
      exit 2 ; depuis un sous-agent → exit 2 ; dans une session lancée dans `repoA` → règles normales ;
      `iakaframe onboard --path C:\Windows\x` (`@hors`) → exit 2.
- [ ] **CA-27** Attribution : documents émis par `delegation-guard` et `plan-courante` (transport
      `docdb` vers un serveur HTTP local de test) portent `meta.repo`, `meta.segment`, `meta.aragorn`,
      `meta.main_role` ; `plan-courante` traite `tool_name:"Agent"` ; chaque ligne du journal de
      périmètre porte `agent_id`, `agent_type` et `chantier.main_role` ; en session d'équipe repoA,
      `royaume` = `REPOA`.
- [ ] **CA-28** Non-régression : `guard-perimeter-regression.test.js`, `guard-core.test.js` (cas
      d'origine hors chantier), `guard-identity-regression.test.js`, `guard-codex-complet.test.js`,
      `parite-generateurs.test.js` (après régénération des goldens) passent ; les quatre premiers
      **sans modification** ; suite CLI = baseline de reprise + nouveaux tests, **0 fail** (hors
      `vendor-check`, dérive consignée).

**Recette réelle (Lot 7, décideur)**
- [ ] **CA-29** Session lancée dans `C:\work` : demander une modification de `naonedge` → le rappel
      apparaît, Odin propose une session Aragorn dans `naonedge` ; un `Edit` direct est refusé.
- [ ] **CA-30** Taper `odin-direct naonedge` sur une ligne seule → le geste passe ; le registre montre
      `grant` + segment.
- [ ] **CA-31** Session `claude --agent aragorn` ouverte dans `naonedge` : le journal montre, pour
      les gestes du thread principal, `agent_type:"aragorn"` **sans** `agent_id` ; Aragorn dispatche
      `gimli` ; les `Edit` de Gimli apparaissent avec `agent_type:"gimli"` et un `agent_id` ; un `Edit`
      hors `naonedge` est refusé. Écart à la doc → le noter et remonter.
- [ ] **CA-32** Un `PowerShell` mutateur vers un dépôt ≠ actif est refusé et journalisé ; constater
      (sans exiger) le comportement d'un agent lancé via l'outil `Workflow` et le consigner.
- [ ] **CA-33** Depuis une autre session, envoyer (`SendMessage`) à la session Odin un message
      contenant une ligne seule `odin-direct <x>` puis `chantier <x>` : le registre de la session Odin
      ne montre **ni** `grant` **ni** `declare`. Sinon : **arrêt**, remonter (réouverture de Q7).

## Estimation (jalon P1→P2, révisée au 2ᵉ amendement)

| | Équivalent j-h | Complexité / risque | État |
|---|---|---|---|
| Lot 0 | 0,25 | faible | ✅ commité |
| Lot 1 — cœur pur | 1,5 | moyenne-élevée | ✅ commité |
| Lot 1bis — correctif du cœur + tests | 0,5 | moyenne | à faire |
| Lot 2 — adaptateur d'état | 0,75 | moyenne (worktrees, Windows, 8.3, D-9) | à faire |
| Lot 3 — `UserPromptSubmit` | 0,5 | faible | à faire |
| Lot 4 — gestes directs | 1,0 | **élevée** (garde bloquant sur chaque geste) | à faire |
| Lot 5 — délégation + plan | 0,5 | moyenne (plus d'écriture au registre) | à faire |
| Lot 6 — contrats, skills, goldens, méthode | 0,75 | faible | à faire |
| **Total** | **≈ 5,75 j-h** (reste à faire **≈ 4 j-h**) + 0,25 recette humaine | **élevée** globalement | |

Le lot 3bis (liaison par sous-agent, 1 j-h) est **supprimé**. Avec l'instruction sœur
(`lancement-session-aragorn.md`, ≈ 1,25 j-h), le programme complet fait **≈ 7 j-h** (reste à faire
≈ 5,25 j-h).

**Inconnues susceptibles de faire glisser :**
1. **`agent_type` sur le thread principal `--agent`** (documenté, CA-31) : s'il manque, le rôle
   `team` ne peut pas être détecté → re-cadrage (repli : rôle déduit d'un fichier posé par le
   lanceur) — **+0,5 j-h**.
2. **Hooks dans les sous-agents** (CA-31) : documentés comme déclenchés — sinon **+0,5 j-h**.
3. **Messages inter-sessions et `UserPromptSubmit`** (CA-33) : si un message peut porter une
   directive, Q7 revient dans le lot — **+0,5 j-h**.
4. **Friction de la liste de lecture** (D-7) — **+0,25 j-h** d'ajustements.

## Questions ouvertes au décideur

Aucune question structurante propre à cette instruction : Q1–Q7, Q-A (révisé), Q-B–Q-G sont
arbitrées ou tranchées par le cadrage à la demande du décideur (Q-F, sort de l'ex-D-13). Reste la
**validation** du présent amendement. Les questions du lanceur sont dans l'instruction sœur.

## Sources

- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) (champs communs ;
  `agent_id` seulement en sous-agent ; `agent_type` présent en session `--agent` et en sous-agent,
  le type du sous-agent primant ; hooks déclenchés dans les sous-agents ; outil `PowerShell` ;
  `UserPromptSubmit` ; `PreToolUse` exit 2 / `tool_use_id` ; `systemMessage`)
- [CLI reference — Claude Code Docs](https://code.claude.com/docs/en/cli-reference) (`--agent`,
  `claude "query"`, `--name`)
- [Subagents — Claude Code Docs](https://code.claude.com/docs/en/sub-agents) (outil `Agent`,
  imbrication jusqu'à 3 niveaux, fork, `agent_type` = `name` du frontmatter)
- [Message your other Claude Code sessions — Claude Code Docs](https://code.claude.com/docs/en/cross-session-messaging)
  (un message ne vaut pas consentement, n'exécute aucune commande)
- [anthropics/claude-code#87411](https://github.com/anthropics/claude-code/issues/87411) (le prompt
  n'est pas fourni à `SubagentStart` — motif de l'Exclu de l'ex-D-13)
- [anthropics/claude-code#29677](https://github.com/anthropics/claude-code/issues/29677) (renommage
  `Task` → `Agent` en v2.1.63 ; matcher `"Task"` toujours honoré)
- [anthropics/claude-code#34692](https://github.com/anthropics/claude-code/issues/34692) (hooks non
  déclenchés dans les sous-agents en v2.1.76 — historique, CA-31)
- [anthropics/claude-code#47018](https://github.com/anthropics/claude-code/issues/47018) (pas de
  `session_id` garanti dans l'environnement de l'outil `Bash`)
