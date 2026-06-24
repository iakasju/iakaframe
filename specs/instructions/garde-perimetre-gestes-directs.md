# Instruction — Garde de PÉRIMÈTRE sur le canal des GESTES DIRECTS (Edit / Write / Bash)

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2). Cible : la méthode iakaframe elle-même (artefacts niveau-utilisateur `~/.claude/`).
> Statut : **à valider par Stéphane** avant exécution. Doc en français, identifiants/code en anglais.
> Filiation : prolonge `specs/instructions/gardes-fous-canal-gestes-hooks.md`. Même règle d'or : **un garde-fou n'a d'autorité que sur le canal où il est posé** (ici `PreToolUse` sur `Edit|Write|Bash`, et `NotebookEdit`). Le câblage `settings.json` est une **auto-modification du harnais → réservée à l'humain** (§7).

---

## 1. Objectif

Fermer une **deuxième faille de périmètre**, démontrée en session le 2026-06-24 : les **gestes
mutateurs DIRECTS** (`Edit`, `Write`, `Bash`, `NotebookEdit`) **ne sont gardés par aucun hook**.
Le seul garde de gestes existant, `delegation-guard.mjs`, n'écoute **que** l'outil `Task`
(délégation) et ne valide qu'un `subagent_type` contre un roster — il **ignore totalement** où
un geste direct écrit.

Conséquence concrète (faille démontrée) : Odin (Claude principal, posture **portefeuille**) a pu
**éditer** `~/.claude/identity-guard.mjs` **puis committer** dans le dépôt
`/Users/sjupin/work/iakaframe` — des gestes **intra-projet** qui auraient dû être délégués à
Aragorn — **sans qu'aucun hook ne bronche**. La règle « un agent n'agit que dans son périmètre »
ne vit aujourd'hui que dans la **prose** (CLAUDE.md + badges), imposée par **aucun garde**.

**Objectif** : poser un garde **`PreToolUse`** neuf — `~/.claude/perimeter-guard.mjs` (parité
`.ps1`/`.mjs`) — qui **journalise** chaque geste mutateur direct, **détecte** le ou les chemins
qu'il touche, et **selon le mode retenu** signale ou **bloque (exit 2)** quand un geste sort du
**périmètre autorisé**, en **FAIL-OPEN** sur tout bug interne.

**Principe ajouté à tracer dans la méthode** :
> Le **canal des gestes directs** (`Edit`/`Write`/`Bash`/`NotebookEdit`) est un **canal distinct**
> de celui de la délégation (`Task`). Le garder exige son **propre matcher `PreToolUse`** ; sans lui,
> tout geste mutateur direct passe non contrôlé.

---

## 2. Contexte / Diagnostic

### 2.1 La faille démontrée
- Geste fautif observé : `Edit` sur `~/.claude/identity-guard.mjs` + `Bash git commit` dans
  `/Users/sjupin/work/iakaframe`, **par Odin (portefeuille)**, sans délégation à Aragorn.
- **Aucun hook n'a réagi** : il n'existe **aucun matcher `PreToolUse` sur `Edit|Write|Bash`**.

### 2.2 État des gardes au moment du cadrage (vérifié par lecture du code)
- `~/.claude/delegation-guard.mjs` : câblé **uniquement** sur l'outil `Task`
  (`PreToolUse`/`PostToolUse`, matcher `"Task"`). Valide `tool_input.subagent_type` contre un
  ROSTER + BUILTINS. **Aucune notion de chemin ni de périmètre projet.**
- `~/.claude/identity-guard.mjs` : câblé sur `Stop`/`SubagentStop`, lit **uniquement** le canal
  **adresse** (blocs `type:"text"`). Les gestes lui sont invisibles.
- **Gestes mutateurs directs (`Edit`, `Write`, `Bash`, `NotebookEdit`) : AUCUN matcher
  `PreToolUse` → ils passent non gardés.**

### 2.3 Faits techniques vérifiés (état de l'art Claude Code hooks, juin 2026)
Le payload `PreToolUse` reçu sur **stdin** (JSON) contient, **sur tout évènement** :
`session_id`, `transcript_path`, **`cwd`**, `permission_mode`, `hook_event_name`, et — pour les
outils — `tool_name` + `tool_input`.
- **`tool_input.file_path`** pour `Edit`/`Write` ; **`tool_input.command`** (chaîne shell) pour
  `Bash` ; `NotebookEdit` porte aussi un `notebook_path`/`file_path`.
- **Exit 2 en `PreToolUse` BLOQUE l'appel d'outil** ; le **stderr est renvoyé à Claude** comme
  message d'erreur (stdout ignoré). Exit 0 = laisse passer.
- **`agent_id` / `agent_type` ne sont présents QUE lorsque le hook se déclenche DANS un
  sous-agent** (ou avec `--agent`) ; `agent_type` y vaut le **nom du sous-agent natif** (ex.
  `"Explore"`), **pas** la persona comportementale iakaframe. Quand c'est le **thread principal
  (Odin)** qui agit, **aucun champ d'agent n'existe** dans le payload. → la persona iakaframe est
  **absente du payload** : le garde **ne peut PAS** raisonner « qui agit » (cf. Décision 3.2).
- **`cwd` du payload n'est PAS un ancrage fiable de la racine projet** : Claude Code **persiste le
  cwd du Bash entre appels**, donc un `cd` en début de session — ou la dérive après activité
  sous-agent (cwd qui glisse vers `.claude/...`) — **déplace durablement** le `cwd` vu par les
  hooks. La variable d'environnement officielle **`$CLAUDE_PROJECT_DIR`** pointe **stablement** la
  racine projet et est **le** bon ancrage (cf. Décision 3.1).

Sources :
- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [Claude Code Hooks (2026) — Block Claude Reading .env + Exit Codes — morphllm](https://www.morphllm.com/claude-code-hooks)
- [CLI hooks: process CWD drifts away from project root mid-session — issue #50960](https://github.com/anthropics/claude-code/issues/50960)
- [Hooks Non-Functional in Subdirectories — issue #10367](https://github.com/anthropics/claude-code/issues/10367)

---

## 3. Spécification détaillée

### Décision 3.1 — Ancrage du périmètre : `$CLAUDE_PROJECT_DIR`, pas `cwd`
Le **périmètre autorisé par défaut** est la **racine du projet courant**, lue dans la variable
d'environnement **`$CLAUDE_PROJECT_DIR`** (fait 2.3 : ancrage **stable**, contrairement au `cwd`
du payload qui dérive). Le garde résout les chemins cibles en **absolu** (relatifs résolus contre
le `cwd` du payload, faute de mieux) puis vérifie l'**appartenance** au périmètre :
- un geste est **DANS le périmètre** si le chemin touché est **sous** `$CLAUDE_PROJECT_DIR` ;
- il est **HORS périmètre** s'il en sort (ex. autre projet `/Users/sjupin/work/<autre>`).

**Si `$CLAUDE_PROJECT_DIR` est absent/illisible → FAIL-OPEN** (exit 0, journalisé `event:"SKIP"`,
raison `no_project_dir`) : sans périmètre fiable, le garde **ne bloque pas** (il ne doit jamais
deviner un périmètre).

### Décision 3.2 — Le garde raisonne sur les CHEMINS, jamais sur la persona (limite assumée, MVP honnête)
Fait vérifié (2.3) : la persona iakaframe (Odin/Aragorn/Gimli) est **absente** du payload —
`agent_type` n'existe que pour les sous-agents natifs et **ne porte pas** la persona ; pour Odin
(thread principal) il n'y a **aucun** champ d'agent. **Donc le garde NE PEUT PAS** statuer « Odin
n'a pas le droit ici ». Il statue sur **OÙ le geste écrit** (chemin vs périmètre), **pas sur QUI
écrit**. C'est une **limite assumée** (même esprit que `delegation-guard.mjs` §portée MVP) :
le garde transforme la règle de rôle en **règle de chemin** — il bloque « un geste qui sort du
périmètre projet », ce qui **couvre la faille démontrée** (un commit/édition hors de
`/Users/sjupin/work/iakaframe` quand on travaille ce projet) sans prétendre lire les intentions.

### Décision 3.3 — Liste blanche : un seul périmètre « portefeuille » + harnais hors-limite (curseur étanchéité serré)
Au-delà de la racine projet, deux chemins reçoivent un traitement spécial (**curseur étanchéité
serré**, tranché par Stéphane) :
- **ALLOW « portefeuille » (toléré, journalisé `verdict:"ALLOW_PORTFOLIO"`, non bloqué)** :
  **uniquement** la **méthode globale** `~/.claude/` (hors `settings.json`, cf. ci-dessous). C'est
  le **seul** chemin autorisé hors du projet courant ancré sur `$CLAUDE_PROJECT_DIR`.
  → **La racine famille `/Users/sjupin/work` N'EST PAS en liste blanche** (curseur d'étanchéité
  voulu). Un geste touchant **directement** la racine `work/` (ou un **autre** sous-projet
  `work/<autre>`) est traité comme **HORS périmètre** : il faudra **passer par délégation** plutôt
  que d'agir en direct. Conséquence actée en §8.
- **DENY « harnais » (toujours signalé/bloqué selon le mode, même pour Odin)** :
  **`~/.claude/settings.json`** — **auto-modification du runtime, réservée à l'humain**. Le garde
  le traite comme **hors-limite** quel que soit le contexte (journalisé `verdict:"DENY_HARNESS"`).
  `settings.json` est **sous** `~/.claude/` mais **exclu** de l'ALLOW portefeuille : la règle DENY
  harnais **prime** sur l'ALLOW portefeuille.

> Note de conception : l'ALLOW portefeuille **assume** la limite 3.2 — comme on ne sait pas que
> c'est Odin, on autorise `~/.claude/` **pour tout le monde**. Le curseur serré (pas de `work/`)
> reflète le choix de Stéphane : protéger strictement le **périmètre projet**, et router tout
> geste portefeuille inter-projets par la **délégation** plutôt que par un geste direct toléré.

### Décision 3.4 — Cas `Edit` / `Write` / `NotebookEdit` (chemin explicite, FIABLE)
Pour ces outils, le chemin cible est **explicite** (`tool_input.file_path`, et pour les notebooks
`tool_input.notebook_path` à défaut `file_path`). Logique :
1. Résoudre le chemin en absolu.
2. Si `settings.json` du harnais → **DENY_HARNESS** (verdict bloquant selon mode).
3. Sinon, si sous `$CLAUDE_PROJECT_DIR` → **ALLOW_PROJECT** (journalisé, exit 0).
4. Sinon, si sous l'ALLOW portefeuille `~/.claude/` (hors settings.json) → **ALLOW_PORTFOLIO**
   (toléré, journalisé, exit 0).
5. Sinon → **HORS périmètre** → décision selon le **mode effectif de l'outil** (3.6).

> Pour ces trois outils, le **mode effectif par défaut est DENY** (chemin fiable, sans
> heuristique) : un verdict HORS ou DENY_HARNESS ⇒ **exit 2** dès la mise en service (cf. 3.6).

### Décision 3.5 — Cas DUR `Bash` : périmètre MVP honnête (heuristique, pas de parsing shell complet)
`tool_input.command` est une **chaîne shell arbitraire** (`cd`, `git`, `rm`, redirections,
pipes, sous-shells…). **Parser fiablement tout shell est hors de portée** et serait fragile. On
assume un **MVP honnête** explicite :

- **Ce qu'on TENTE de détecter (heuristiques sur la chaîne)** :
  - **chemins absolus** apparaissant dans la commande qui pointent **hors** périmètre et **hors**
    ALLOW (motif `/Users/sjupin/work/<autre>/…`, ou `~/.claude/settings.json`) ;
  - motifs **évidents de mutation hors périmètre** : `git -C <path>`, `cd <path absolu hors
    périmètre> && …`, écritures/redirections (`> /chemin/abs/…`) vers un chemin hors périmètre,
    `rm`/`mv`/`cp` ciblant un chemin absolu hors périmètre.
- **Ce qu'on ASSUME de LAISSER PASSER (non bloqué, au plus journalisé `verdict:"BASH_UNRESOLVED"`)** :
  - commandes **sans chemin absolu identifiable** (chemins relatifs purs, variables shell non
    résolues, globs, here-docs, commandes chaînées complexes). Le garde **ne devine pas** où elles
    écrivent → **FAIL-OPEN sur le doute** (cohérent avec le fail-open général : ne jamais bloquer
    sur une heuristique incertaine). `BASH_UNRESOLVED` est **toujours exit 0**, quel que soit le mode.
- **Mode effectif par défaut pour `Bash` = WARN** : un verdict HORS ou DENY_HARNESS détecté par
  l'heuristique **journalise + écrit sur stderr** mais **exit 0** (ne bloque pas), **tant que les
  heuristiques ne sont pas éprouvées** (cf. 3.6). On pourra basculer Bash en DENY par la variable
  d'environnement (3.6) une fois la confiance acquise.
- **Limite explicitement assumée** : un geste `Bash` mutateur hors périmètre **exprimé en chemins
  relatifs** (après un `cd` qu'on n'a pas tracé) **peut passer**. Le garde **réduit** la surface
  (il aurait attrapé le `git commit`/`git -C` et les chemins absolus du cas démontré) sans
  **prétendre** la fermer totalement. La **journalisation** rend ces gestes **auditables a
  posteriori** même quand le garde choisit de ne pas bloquer.

### Décision 3.6 — Mode PANACHÉ par outil, piloté par `IAKAFRAME_PERIMETER_MODE` (tranché par Stéphane)
Le comportement **par défaut** est **panaché par outil**, parce que la fiabilité de la détection
diffère selon l'outil (chemin explicite vs heuristique shell) :

| Outil | Détection | **Mode effectif par défaut** | HORS / DENY_HARNESS |
|---|---|---|---|
| `Edit`, `Write`, `NotebookEdit` | chemin explicite **fiable** | **DENY** | **exit 2** (bloque) |
| `Bash` | **heuristique** non éprouvée | **WARN** | exit 0 + stderr (journalise, ne bloque pas) |

**Pilotage par la variable d'environnement `IAKAFRAME_PERIMETER_MODE`** :
- **Valeurs acceptées** : `default`, `deny`, `warn`. Toute autre valeur (ou variable
  **absente/vide**) est traitée comme **`default`** (et la valeur brute reçue est journalisée).
- **`default` (= variable NON définie, vide, ou littéralement `default`) ⇒ LE PANACHAGE du tableau
  ci-dessus** : Edit/Write/NotebookEdit en **DENY**, Bash en **WARN**. **Le comportement voulu est
  obtenu sans qu'aucune variable ne soit posée** — c'est le défaut « hors de la boîte ».
- **`deny` (durcir)** : **tous** les outils — **y compris `Bash`** — passent en **DENY** (exit 2 sur
  HORS / DENY_HARNESS). À activer **après** que les heuristiques Bash aient été éprouvées en WARN.
- **`warn` (assouplir globalement)** : **tous** les outils — **y compris Edit/Write/NotebookEdit** —
  repassent en **WARN** (journal + stderr, exit 0). Filet de sécurité pour **désamorcer** le garde
  sans toucher au `settings.json` ni rééditer les scripts (si un faux positif gêne un travail réel).

Ainsi, **durcir** (Bash → DENY) comme **assouplir** (tout → WARN) se fait **uniquement** par la
variable d'environnement, **sans rééditer** ni `.mjs` ni `.ps1`. Le **mode effectif appliqué** est
journalisé par évènement (`mode:"deny"|"warn"` + `mode_env:"default|deny|warn|<brut>"` pour tracer
la valeur reçue). `BASH_UNRESOLVED` reste **exit 0 dans tous les cas**. Le **FAIL-OPEN** reste vrai
**quel que soit le mode** (un bug interne ⇒ exit 0).

### Décision 3.7 — Journalisation auditable (réemploi du pattern `delegation-guard.mjs`)
Journal **append-only**, **une ligne JSON par évènement**, dans
`~/.claude/iakaframe-perimeter.log` (fichier **distinct** du journal de délégation). Champs :
`at` (ISO), `event`, `session`, `tool` (`Edit|Write|Bash|NotebookEdit`), `path` (résolu, ou
`null`/`command` tronquée pour Bash), `project_dir`, `verdict` (`ALLOW_PROJECT|ALLOW_PORTFOLIO|
HORS|DENY_HARNESS|BASH_UNRESOLVED|SKIP`), `mode` (**mode effectif appliqué à CE geste** :
`warn|deny`), `mode_env` (valeur **brute** reçue de `IAKAFRAME_PERIMETER_MODE` : `default|deny|warn`
ou la chaîne inconnue). Verbatim, jamais reformulé. Écriture en `try/catch` silencieux (fail-open du
log lui-même).

### Décision 3.8 — Parité `.ps1` / `.mjs`
Conformément à `gardes-fous-canal-gestes-hooks.md` §8 (parité multiplateforme) : livrer
**`~/.claude/perimeter-guard.mjs`** (macOS/Node) **et** **`~/.claude/perimeter-guard.ps1`**
(Windows), **miroirs** l'un de l'autre : mêmes verdicts, même **panachage par outil** (Edit/Write/
NotebookEdit → DENY, Bash → WARN par défaut), même liste blanche `~/.claude/`, même lecture de
`IAKAFRAME_PERIMETER_MODE` (`default|deny|warn`), même format de log. Toute évolution future doit
être **répliquée dans les deux**.

### Décision 3.9 — Câblage `settings.json` (étape HUMAINE)
Ajouter au bloc `hooks` un matcher `PreToolUse` sur **`Edit|Write|Bash|NotebookEdit`** invoquant
le garde. **Auto-modification du harnais → posée/validée par Stéphane** (§7). Ne touche pas aux
matchers `Task` existants (délégation) ni aux hooks d'identité.

---

## 4. Périmètre

### Inclus
- `~/.claude/perimeter-guard.mjs` (+ miroir `.ps1`) au comportement décrit en §3.
- Le journal runtime `~/.claude/iakaframe-perimeter.log`.
- Le bloc `PreToolUse[matcher:"Edit|Write|Bash|NotebookEdit"]` de `~/.claude/settings.json`
  (rédigé/posé par l'humain — §7).
- Les **critères d'acceptation** par tests stdin (§6).

### Exclu
- **Toute prétention à parser exhaustivement le shell** (`Bash`) : MVP heuristique assumé (3.5).
- **Tout raisonnement sur la persona/identité de l'agent** : impossible (payload sans persona,
  3.2). Le garde est un garde de **chemins**, pas de **rôles**.
- Toute modification de `delegation-guard.mjs` / `identity-guard.mjs` (gardes voisins inchangés).
- L'édition de `~/.claude/settings.json` elle-même (étape **humaine**, §7).

---

## 5. Fichiers concernés (chemins précis + action)

| # | Fichier | Action | Contenu |
|---|---|---|---|
| 1 | `/Users/sjupin/.claude/perimeter-guard.mjs` | **créer** | Garde `PreToolUse` du canal gestes directs : matcher `Edit|Write|Bash|NotebookEdit` ; ancrage `$CLAUDE_PROJECT_DIR` ; listes blanches portefeuille + DENY harnais ; mode WARN/DENY ; fail-open ; journal JSON (3.1–3.7). |
| 2 | `/Users/sjupin/.claude/perimeter-guard.ps1` | **créer** | Miroir Windows de #1 (parité, 3.8). |
| 3 | `/Users/sjupin/.claude/iakaframe-perimeter.log` | **généré (runtime)** | Journal append-only, une ligne JSON par évènement. Créé au premier passage. |
| 4 | `/Users/sjupin/.claude/settings.json` | **éditer (HUMAIN — §7)** | Ajouter `PreToolUse[matcher:"Edit|Write|Bash|NotebookEdit"]` → `perimeter-guard.mjs` (3.9). **Auto-modif harnais.** |

---

## 6. Critères d'acceptation (vérifiables par tests stdin)

> `echo '<payload>' | CLAUDE_PROJECT_DIR=/Users/sjupin/work/iakaframe node /Users/sjupin/.claude/perimeter-guard.mjs ; echo "exit=$?"`
> **Défaut panaché** : tester **sans** `IAKAFRAME_PERIMETER_MODE` (= `default`) reflète le comportement
> hors-boîte (Edit/Write/NotebookEdit en DENY, Bash en WARN). Tester `deny`/`warn` pour le durcissement
> et l'assouplissement globaux (3.6).

### Fail-open & garde-fous de base
- [ ] **stdin vide / JSON invalide → exit 0**, aucun blocage, aucune exception.
- [ ] **`$CLAUDE_PROJECT_DIR` absent → exit 0** (`verdict:"SKIP"`, raison `no_project_dir`),
      quel que soit le chemin touché et le mode.
- [ ] **FAIL-OPEN même en deny** : `IAKAFRAME_PERIMETER_MODE=deny` + erreur interne simulée
      (payload malformé inattendu) ⇒ exit 0.

### Edit / Write / NotebookEdit — DENY par défaut (chemin fiable — 3.4, 3.6)
- [ ] **DANS le périmètre → exit 0** : `Edit` sur `/Users/sjupin/work/iakaframe/src/x.ts`
      (CLAUDE_PROJECT_DIR=…/iakaframe), **sans** variable de mode → exit 0, `verdict:"ALLOW_PROJECT"`.
- [ ] **HORS périmètre, DÉFAUT (pas de variable) → exit 2** : `Write` sur
      `/Users/sjupin/work/autre-projet/y.ts` → **exit 2** (DENY par défaut pour cet outil),
      **stderr** explicite (chemin hors périmètre + périmètre attendu), `verdict:"HORS"`,
      `mode:"deny"`, `mode_env:"default"`.
- [ ] **HORS périmètre, `IAKAFRAME_PERIMETER_MODE=warn` → exit 0** : même payload en `warn` →
      **exit 0** + stderr d'avertissement, `verdict:"HORS"`, `mode:"warn"`.
- [ ] **ALLOW portefeuille `~/.claude/` (hors settings.json) → exit 0** : `Edit` sur
      `/Users/sjupin/.claude/identity-guard.mjs` → exit 0 même en `deny`, `verdict:"ALLOW_PORTFOLIO"`.
- [ ] **DENY harnais `settings.json`** : `Edit` sur `/Users/sjupin/.claude/settings.json` →
      **défaut → exit 2** ; `warn` → exit 0 + stderr ; `verdict:"DENY_HARNESS"`.
- [ ] **NotebookEdit hors périmètre** : `tool_input.notebook_path` hors périmètre → **défaut exit 2**
      (comme un Write), `verdict:"HORS"`.
- [ ] **Racine `work/` N'EST PLUS tolérée** : `Write` sur `/Users/sjupin/work/note.txt`
      (directement sous la racine famille, hors d'un projet) → **défaut → exit 2**, `verdict:"HORS"`
      (curseur étanchéité 3.3 — il faut déléguer).

### Bash — WARN par défaut (heuristique non éprouvée — 3.5, 3.6)
- [ ] **`git commit` hors périmètre par chemin absolu, DÉFAUT → exit 0 + stderr** :
      `command:"git -C /Users/sjupin/work/autre commit -m x"` → **exit 0**, stderr non vide,
      `verdict:"HORS"`, `mode:"warn"`, `mode_env:"default"`.
- [ ] **même payload, `IAKAFRAME_PERIMETER_MODE=deny` → exit 2** (durcissement global de Bash) :
      → **exit 2**, `verdict:"HORS"`, `mode:"deny"`.
- [ ] **redirection vers chemin absolu hors périmètre** :
      `command:"echo z > /Users/sjupin/work/autre/f"` → défaut exit 0 + stderr (`HORS`) ; `deny` exit 2.
- [ ] **commande sans chemin absolu (relatif/glob) → JAMAIS bloquée** :
      `command:"npm test && git commit -am wip"` → **exit 0 en défaut ET en `deny`**,
      `verdict:"BASH_UNRESOLVED"` (auditable, non bloqué — limite assumée).
- [ ] **commande dans le périmètre** : `command:"echo ok > /Users/sjupin/work/iakaframe/out.txt"`
      → exit 0, `verdict:"ALLOW_PROJECT"`.
- [ ] **`settings.json` cité dans une commande Bash** :
      `command:"vim /Users/sjupin/.claude/settings.json"` → `verdict:"DENY_HARNESS"`
      (défaut exit 0 + stderr car outil Bash en WARN ; `deny` exit 2).

### Pilotage global par la variable (3.6)
- [ ] **`warn` assouplit Edit/Write/NotebookEdit** : un `Write` HORS périmètre passe de exit 2
      (défaut) à **exit 0** quand `IAKAFRAME_PERIMETER_MODE=warn`.
- [ ] **`deny` durcit Bash** : un `git -C <hors>` passe de exit 0 (défaut) à **exit 2** en `deny`.
- [ ] **valeur inconnue traitée comme `default`** : `IAKAFRAME_PERIMETER_MODE=bidon` ⇒ panachage par
      défaut (Edit HORS → exit 2, Bash HORS → exit 0), log `mode_env:"bidon"`.

### Journalisation (3.7)
- [ ] Après chaque test, `~/.claude/iakaframe-perimeter.log` contient **une ligne JSON** avec
      `at`, `event`, `session`, `tool`, `verdict`, `mode` cohérents, **sans reformulation**.
- [ ] Le journal est **distinct** de `iakaframe-delegations.log` (pas de pollution croisée).

### Parité & câblage
- [ ] `perimeter-guard.ps1` produit les **mêmes verdicts** que `.mjs` sur les payloads ci-dessus.
- [ ] (Après pose humaine) `settings.json` porte
      `PreToolUse[matcher:"Edit|Write|Bash|NotebookEdit"]` → `perimeter-guard.mjs`, **JSON valide**,
      clés préexistantes (hooks `Task`/identité, `theme`, `permissions`) **préservées**.
- [ ] **Bout-en-bout** (session réelle) : en `mode=deny`, un `Edit` vers un autre projet est
      **refusé** ; un `Edit` dans le projet courant passe ; les deux apparaissent au log.

---

## 7. Étape humaine — pose du bloc dans `settings.json`

> **Auto-modification du harnais.** L'écriture de `~/.claude/settings.json` modifie le runtime
> Claude Code. Gimli **prépare** le bloc ; **Stéphane** (ou Gimli sur GO explicite) **le pose**.

Bloc à **fusionner** dans le `hooks.PreToolUse` existant (qui contient déjà le matcher `Task`) —
**ne pas écraser** l'entrée `Task` ni les autres événements :

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Task", "hooks": [ { "type": "command", "command": "node /Users/sjupin/.claude/delegation-guard.mjs" } ] },
      { "matcher": "Edit|Write|Bash|NotebookEdit", "hooks": [ { "type": "command", "command": "node /Users/sjupin/.claude/perimeter-guard.mjs" } ] }
    ]
  }
}
```

> Vérifier que `node` est dans le `PATH` du runtime au déclenchement du hook. **Aucune variable
> `IAKAFRAME_PERIMETER_MODE` à poser au départ** : le **défaut panaché** (Edit/Write/NotebookEdit
> en DENY, Bash en WARN) est déjà le comportement voulu (3.6). N'exporter la variable que pour
> **durcir Bash** (`deny`) après l'avoir éprouvé, ou pour **désamorcer globalement** (`warn`) en cas
> de faux positif gênant.

---

## 8. Risques & limites (assumés)

- **FAIL-OPEN partout** (les deux modes) : un bug du garde **ne fige jamais** une session (exit 0).
  Contrepartie : un contrôle peut être **manqué silencieusement** ; le garde ne doit **jamais** être
  la cause d'un blocage de travail réel.
- **Garde de CHEMINS, pas de RÔLES** (3.2) : la persona iakaframe étant **absente du payload**, le
  garde **ne peut pas** dire « c'est Odin, il n'a pas le droit ». Il protège le **périmètre
  projet** et **trace** les sorties tolérées. La règle de rôle reste **comportementale** ; le garde
  la **réduit** à une garantie de chemin, il ne la **remplace** pas.
- **Curseur étanchéité serré : la racine `work/` n'est PAS tolérée** (3.3) : un **vrai geste
  portefeuille** touchant **directement** la racine `/Users/sjupin/work` (ou un autre sous-projet)
  sera traité comme **HORS périmètre** — donc **bloqué (exit 2)** pour Edit/Write/NotebookEdit
  (défaut DENY) et **signalé (exit 0 + stderr)** pour Bash (défaut WARN). **Conséquence voulue** :
  ces gestes inter-projets devront **passer par délégation** (Aragorn/l'agent du bon royaume)
  plutôt que d'être exécutés en direct. Si ce curseur se révèle trop serré à l'usage, deux soupapes
  existent **sans rééditer le périmètre** : `IAKAFRAME_PERIMETER_MODE=warn` (désamorçage global) ou,
  en dernier recours, rouvrir la liste blanche 3.3 (décision Stéphane).
- **Panachage par outil = garanties inégales** (3.6) : Edit/Write/NotebookEdit sont **réellement
  bloqués** dès la mise en service (chemin fiable) ; `Bash` n'est **que signalé** par défaut tant
  qu'il n'est pas durci en `deny`. Pendant cette fenêtre, un geste Bash mutateur hors périmètre
  **passe** (journalisé). C'est un choix assumé : ne pas bloquer sur une heuristique non éprouvée.
- **`Bash` partiellement couvert** (3.5) : seuls les **chemins absolus** hors périmètre et motifs
  évidents sont attrapés ; les gestes en **chemins relatifs** (après un `cd` non tracé) **peuvent
  passer**. Le journal les rend **auditables a posteriori**.
- **`cwd` du payload non fiable** (2.3) : c'est pourquoi l'ancrage est `$CLAUDE_PROJECT_DIR`. Si
  cette variable est **absente** au déclenchement du hook, le garde **ne bloque pas** (SKIP).
- **Parité `.ps1`/`.mjs` à maintenir** : deux implémentations miroir ; toute évolution
  (listes blanches, heuristiques Bash, format de log, mode) **doit** être répliquée.
- **Auto-modification du harnais** (`settings.json`) : risque de casser le JSON ou de poser un hook
  bloquant mal réglé → étape **humaine**, à tester en session réelle juste après la pose.

---

## 9. Notes pour Gimli (exécution)
- **Réutiliser les patterns** de `delegation-guard.mjs` : lecture stdin `readFileSync(0)`,
  `JSON.parse` sous `try/catch` global, `allow = () => process.exit(0)`, `appendFileSync` du log
  en `try/catch` silencieux, `extractText` si besoin. **Même esprit, fichier distinct.**
- **Ancrer sur `process.env.CLAUDE_PROJECT_DIR`** (pas sur `payload.cwd`) ; résoudre les chemins
  avec `node:path` (`resolve`, `relative`) ; appartenance = `relative(projectDir, target)` ne
  commençant **pas** par `..` et non absolu.
- **Mode** piloté **uniquement** par `process.env.IAKAFRAME_PERIMETER_MODE` (3.6, tranché — pas de
  constante). Calculer un **mode effectif PAR OUTIL** : si la variable vaut `deny` → tous DENY ; si
  `warn` → tous WARN ; **sinon (absente/vide/`default`/inconnue) → panachage** : `Edit`/`Write`/
  `NotebookEdit` = DENY, `Bash` = WARN. `BASH_UNRESOLVED` reste exit 0 **dans tous les cas**.
  Journaliser `mode` (effectif) **et** `mode_env` (valeur brute reçue).
- **Liste blanche 3.3 (curseur serré)** : **seul** `~/.claude/` (hors `settings.json`) est en
  ALLOW_PORTFOLIO. **NE PAS** mettre `/Users/sjupin/work` en liste blanche. `settings.json` →
  DENY_HARNESS (prime sur l'ALLOW). Utiliser le chemin réel de `homedir()` pour `~/.claude/`.
- **Heuristique Bash** : extraire les **chemins absolus** de `tool_input.command` (regex sur
  `/Users/sjupin/...` et `~/.claude/settings.json`), classer chacun ; **au moindre doute, ne pas
  bloquer** (`BASH_UNRESOLVED`).
- **Tests stdin d'abord** (§6) avant tout câblage ; **ne pas poser** `settings.json` sans GO
  explicite de Stéphane (§7).
- **Ne pas supprimer** ni modifier les autres gardes ; **livrer le miroir `.ps1`** (3.8).
- Clôture : régénérer l'état des lieux + commit conventional (`feat:` garde de périmètre des gestes
  directs) via la procédure `update`.
```
