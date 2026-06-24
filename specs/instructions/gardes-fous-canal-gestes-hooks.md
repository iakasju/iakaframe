# Instruction — Garde-fous sur le canal des GESTES (délégation) + portage macOS des hooks d'identité

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2). Cible : la méthode iakaframe elle-même (artefacts niveau-utilisateur `~/.claude/`).
> Statut : **à valider par Stéphane** avant exécution. Doc en français, identifiants/code en anglais.
> Règle d'or de la méthode : on édite la **source = image** puis on déploie ; ici, l'étape de câblage `settings.json` est une **auto-modification du harnais → réservée à l'humain** (voir §7).

---

## 1. Objectif

Fermer une **faille de périmètre** des garde-fous d'identité iakaframe : aujourd'hui les gardes
n'ont d'autorité que sur le **canal d'adresse** (le texte qu'un agent adresse à l'humain), pas sur
le **canal des gestes** (les appels d'outil, notamment la délégation `Task` d'un agent à un autre).
Concrètement :

1. **Porter sur macOS** les gardes d'identité existants (aujourd'hui en PowerShell, Windows-only)
   sous forme Node `.mjs`, à comportement identique.
2. **Poser un garde neuf sur le canal des gestes** (`delegation-guard.mjs`) qui rend la délégation
   **auditable** (journal verbatim aller/retour) et **bloque** toute délégation vers un agent **hors
   roster**.
3. **Câbler** ces gardes dans `~/.claude/settings.json` (étape humaine).
4. **Lever une ambiguïté** du `CLAUDE.md` global : l'interdiction « aucun hook » y est **scopée**
   au seul déclenchement d'`iakastart`, pas une interdiction globale des hooks.

**Règle d'or retenue (à tracer comme principe de la méthode)** :
> **Un garde-fou n'a d'autorité que sur le canal où il est posé.**
> Les gardes de *parole* (Stop/SubagentStop, blocs `type:"text"`) ne voient pas les *gestes*
> (blocs `tool_use`). Pour contrôler un geste, il faut un garde sur le canal des gestes (`PreToolUse`/`PostToolUse`).

---

## 2. Contexte / Motivation — le diagnostic des deux canaux

### 2.1 Le problème
La méthode iakaframe impose un **double badge** d'identité (ouverture = pastille AVANT le bloc /
clôture = pastille APRÈS) à chaque prise de parole d'un agent. Ce rituel était gardé **uniquement
sur le canal d'adresse**, aux **frontières de parole** (hooks `Stop` / `SubagentStop`, qui n'inspectent
que les blocs `type:"text"` du transcript).

Or **la délégation d'un agent à un autre n'est pas une parole : c'est un GESTE** — un appel de
l'outil `Task` (bloc `tool_use`). Le payload de ce geste (agent ciblé, prompt envoyé, réponse reçue)
**échappe totalement** aux gardes de parole. Conséquence : le **périmètre de rôle peut être franchi
sans aucun contrôle** (un agent peut déléguer à un agent inexistant ou hors méthode, la restitution
verbatim n'est pas vérifiable, etc.).

### 2.2 Constat technique au moment du cadrage
- Le garde existant **`identity-guard.ps1`** (Windows) est câblé sur `Stop` et `SubagentStop`, et ne
  lit **que** les blocs `type:"text"` du transcript (canal adresse). Les blocs `tool_use` (gestes)
  lui sont **invisibles**.
- **`identity-remind.ps1`** est câblé sur `UserPromptSubmit` (nudge doux).
- **Aucun `PreToolUse` nulle part** : le canal des gestes **n'était pas gardé**.
- Sur **macOS**, les hooks Windows **ne tournent pas** : `~/.claude/settings.json` est actif mais
  **sans bloc `hooks`** ; les commandes pointaient `powershell.exe` + chemins `C:\Users\sjupi\…`.

### 2.3 Fait technique vérifié (état de l'art Claude Code hooks, juin 2026)
- **Exit 0** = succès (stdout parsé) ; **exit 2** = **erreur bloquante** sur un événement bloquant
  (stderr **renvoyé à Claude**, action bloquée) ; tout autre code = erreur **non bloquante**.
- **`PreToolUse`** s'exécute **avant** l'outil et **peut le bloquer** (exit 2) ; **`PostToolUse`**
  s'exécute **après** et **ne peut pas annuler** l'action (bon pour journaliser/nettoyer).
- **Matcher** : un nom exact (lettres/chiffres/`_`) ou liste `A|B` ; donc `"Task"` est un matcher
  valide ciblant l'outil de délégation à un sous-agent.
- **stdin** reçoit un JSON dont la forme dépend de l'événement : `PreToolUse` porte `tool_input` ;
  `PostToolUse` porte en plus la réponse de l'outil (`tool_response` / `tool_output`).

Sources :
- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [Claude Code Hooks Guide — PreToolUse, PostToolUse & More (2026)](https://www.claudebuddy.art/blog/claude-code-hooks-complete-guide)
- [Claude Code Hook Control Flow — Steve Kinney](https://stevekinney.com/courses/ai-development/claude-code-hook-control-flow)

### 2.4 État de l'implémentation au moment du cadrage
Les trois scripts cibles **existent déjà** dans `~/.claude/` et sont conformes aux décisions ci-dessous
(`identity-guard.mjs`, `identity-remind.mjs`, `delegation-guard.mjs`). **`settings.json` ne porte
encore aucun bloc `hooks`** (§7). Cette instruction **trace la décision** et fixe les critères de
vérification ; l'exécution restante est principalement le **câblage `settings.json`** (humain) + la
**clarification du `CLAUDE.md` global**.

---

## 3. Spécification détaillée

### Décision 3.1 — Portage macOS des gardes d'identité en Node
- **`~/.claude/identity-guard.mjs`**, câblé sur **`Stop`** + **`SubagentStop`**. Comportement
  **identique** au `.ps1` :
  - lit le dernier message **assistant texte** du transcript JSONL (canal **adresse** uniquement) ;
  - vérifie que ce texte **OUVRE** (pastille **AVANT** le bloc, en **première** ligne) **et CLÔT**
    (pastille **APRÈS** le bloc, en **dernière** ligne) — la **position** de la pastille porte le sens ;
  - **badge manquant → exit 2** (refus, stderr renvoyé à l'agent) ;
  - **FAIL-OPEN** : tout bug interne → exit 0 (ne jamais figer une session) ;
  - respecte **`stop_hook_active`** (anti-boucle).
- **`~/.claude/identity-remind.mjs`**, câblé sur **`UserPromptSubmit`** : nudge doux (stdout injecté
  comme contexte additionnel), complément non bloquant du garde.
- **Limite assumée** (à conserver en commentaire d'en-tête) : ce garde ne lit **que** le canal
  adresse ; les gestes (`tool_use`) lui restent invisibles → c'est précisément le rôle de 3.2.

### Décision 3.2 — Garde NEUF sur le canal des gestes : `~/.claude/delegation-guard.mjs`
Câblé sur **`PreToolUse`** ET **`PostToolUse`**, **matcher `Task`** (outil de délégation à un sous-agent).

- **`PreToolUse` (l'ALLER)** :
  1. **Journalise verbatim** l'aller dans `~/.claude/iakaframe-delegations.log` (**une ligne JSON par
     évènement**) : agent ciblé (`tool_input.subagent_type`), `description`, `prompt` — **jamais
     reformulés**.
  2. **PUIS valide** l'agent ciblé contre un **ROSTER**.
     - **Roster iakaframe autorisé** : `odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie`.
     - **Sous-agents natifs Claude Code tolérés** : `Explore, Plan, general-purpose, claude,
       claude-code-guide, statusline-setup`.
  3. **Si l'agent ciblé est hors roster → REFUS, exit 2** (décision : on **bloque**, on ne se contente
     plus de signaler), avec un **message stderr** listant le roster autorisé. **L'ALLER reste
     journalisé** même en cas de refus (+ une ligne `event:"REFUS"`).
- **`PostToolUse` (le RETOUR)** : **journalise verbatim** la réponse de l'outil (`tool_response`) →
  rend la **« restitution verbatim »** *vérifiable* au lieu de reposer sur la seule bonne foi de
  l'orchestrateur.
- **FAIL-OPEN** sur tout bug interne (exit 0) — ne jamais figer une session pour un bug du garde.
- **PORTÉE ASSUMÉE (MVP honnête)** : ce garde rend les gestes **auditables** et **bloque** les agents
  hors roster ; il **ne prétend PAS** policer **sémantiquement** la fidélité des rôles (qui a
  « vraiment » fait le travail) — non fiable, donc hors périmètre.

### Décision 3.3 — Câblage des hooks dans `~/.claude/settings.json`
Déclarer :
- `Stop`, `SubagentStop` → `identity-guard.mjs` ;
- `UserPromptSubmit` → `identity-remind.mjs` ;
- `PreToolUse` `[matcher:"Task"]` → `delegation-guard.mjs` ;
- `PostToolUse` `[matcher:"Task"]` → `delegation-guard.mjs`.

Commandes appelant **`node`** sur les chemins **macOS** (`/Users/sjupin/.claude/*.mjs`), **pas**
`powershell.exe`. **NOTE** : l'écriture de `settings.json` est une **auto-modification du harnais**
→ **étape à valider/exécuter par l'humain** (Stéphane l'a autorisée). Voir §7 pour le bloc proposé.

### Décision 3.4 — Clarification du `CLAUDE.md` global (lever l'ambiguïté « aucun hook »)
La phrase actuelle « *Aucun hook, watcher, daemon ni commande slash custom* » est **scopée** au
**mécanisme de déclenchement d'`iakastart`** (qui repose sur la `description` de la skill + la règle
du `CLAUDE.md`), et **ne doit pas** être lue comme une **interdiction GLOBALE** des hooks. Les **hooks
d'identité et de garde des gestes sont explicitement AUTORISÉS**. Préciser ce scope dans le `CLAUDE.md`
global pour lever toute ambiguïté.

---

## 4. Périmètre

### Inclus
- Les trois scripts `.mjs` (`identity-guard.mjs`, `identity-remind.mjs`, `delegation-guard.mjs`) au
  comportement décrit en §3.
- Le **bloc `hooks`** de `~/.claude/settings.json` (rédigé/posé par l'humain — §7).
- La **clarification du scope** « aucun hook » dans le `CLAUDE.md` global (3.4).

### Exclu
- Toute prétention à **policer sémantiquement** la fidélité des rôles (portée assumée 3.2).
- Toute refonte du **format des badges / pastilles / table des phases** (inchangés).
- Toute suppression des scripts **Windows** `.ps1` : ils **restent** la version Windows (cf. §6 Risques —
  parité multiplateforme). Cette instruction **ajoute** la version macOS, elle ne retire rien.

---

## 5. Fichiers concernés (chemins précis + action)

| # | Fichier | Action | Contenu |
|---|---|---|---|
| 1 | `/Users/sjupin/.claude/identity-guard.mjs` | **vérifier/maintenir** | Garde d'identité macOS, `Stop`+`SubagentStop`, canal adresse, exit 2 si badge manquant, fail-open, respect `stop_hook_active` (3.1). |
| 2 | `/Users/sjupin/.claude/identity-remind.mjs` | **vérifier/maintenir** | Nudge `UserPromptSubmit` (3.1). |
| 3 | `/Users/sjupin/.claude/delegation-guard.mjs` | **vérifier/maintenir** | Garde du canal gestes, `PreToolUse`+`PostToolUse` matcher `Task` : journal verbatim aller/retour + REFUS exit 2 hors roster + fail-open (3.2). |
| 4 | `/Users/sjupin/.claude/iakaframe-delegations.log` | **généré (runtime)** | Journal append-only, **une ligne JSON par évènement** (`ALLER` / `REFUS` / `RETOUR`). Créé au premier passage du garde. |
| 5 | `/Users/sjupin/.claude/settings.json` | **éditer (HUMAIN — §7)** | Ajouter le bloc `hooks` câblant 1/2/3 sur leurs événements (3.3). **Auto-modification du harnais.** |
| 6 | `~/.claude/CLAUDE.md` (global) | **éditer** | Scoper la phrase « aucun hook… » au seul déclenchement d'`iakastart` ; acter que les hooks d'identité + garde des gestes sont autorisés (3.4). |

> Les scripts `.ps1` Windows (`identity-guard.ps1`, `identity-remind.ps1`) restent en place côté
> Windows ; **ne pas** les supprimer. Toute évolution de comportement doit être **répliquée dans les
> deux familles** pour garder la parité (cf. §6).

---

## 6. Critères d'acceptation (vérifiables)

> Tests par **stdin JSON** : `echo '<payload>' | node /Users/sjupin/.claude/<script>.mjs ; echo "exit=$?"`.

### Garde d'identité — `identity-guard.mjs` (3.1)
- [ ] **Badge OK → exit 0** : payload `Stop` dont le transcript a un dernier message assistant qui
      ouvre (pastille en 1re ligne) **et** clôt (pastille en dernière ligne) → `exit=0`.
- [ ] **Badge manquant → exit 2** : même payload mais dernier message assistant **sans** pastille
      d'ouverture et/ou de clôture → `exit=2`, **stderr** explicite ce qui manque (ouverture/clôture).
- [ ] **Anti-boucle** : payload avec `stop_hook_active:true` → `exit=0` (allow).
- [ ] **Fail-open** : stdin vide / JSON invalide / `transcript_path` absent → `exit=0`.
- [ ] **Canal respecté** : un transcript dont le dernier bloc assistant est un `tool_use` (geste)
      sans bloc texte → le garde **ne bloque pas** (il ne lit que le canal adresse) → `exit=0`.

### Rappel d'identité — `identity-remind.mjs` (3.1)
- [ ] `UserPromptSubmit` quelconque → `exit=0` et **stdout non vide** (message de rappel injecté).

### Garde des gestes — `delegation-guard.mjs` (3.2)
- [ ] **Délégation agent du roster → exit 0** : `PreToolUse` avec
      `tool_input.subagent_type:"gimli"` → `exit=0`.
- [ ] **Sous-agent natif toléré → exit 0** : `subagent_type:"Explore"` (ou `general-purpose`) →
      `exit=0`.
- [ ] **Agent hors roster → exit 2** : `subagent_type:"hacker"` → `exit=2`, **stderr** liste le
      **roster autorisé** + les sous-agents natifs tolérés.
- [ ] **ALLER journalisé** : après un `PreToolUse`, `iakaframe-delegations.log` contient **une ligne
      JSON** `event:"ALLER"` avec `agent`, `description`, `prompt` **verbatim**.
- [ ] **REFUS journalisé** : après un `PreToolUse` hors roster, le log contient **aussi** une ligne
      `event:"REFUS"` (l'ALLER **précède** le refus dans le log).
- [ ] **RETOUR journalisé** : après un `PostToolUse`, le log contient **une ligne** `event:"RETOUR"`
      avec la réponse (`tool_response`) **verbatim**.
- [ ] **Aller ET retour présents** : pour un même `session_id`, le log présente l'`ALLER` puis le
      `RETOUR` (chaîne auditable).
- [ ] **Fail-open** : stdin vide / JSON invalide → `exit=0`, **aucun blocage**.
- [ ] **`subagent_type` non précisé** → **pas** de blocage (`exit=0`), l'ALLER reste journalisé.

### Câblage `settings.json` (3.3 — vérif après pose humaine)
- [ ] `~/.claude/settings.json` contient un bloc `hooks` avec : `Stop` + `SubagentStop` →
      `identity-guard.mjs` ; `UserPromptSubmit` → `identity-remind.mjs` ;
      `PreToolUse[matcher:"Task"]` **et** `PostToolUse[matcher:"Task"]` → `delegation-guard.mjs`.
- [ ] Les commandes invoquent **`node`** sur des chemins **macOS** (`/Users/sjupin/.claude/…`),
      **aucune** trace de `powershell.exe` ni de chemin `C:\…`.
- [ ] Le fichier reste un **JSON valide** (les clés préexistantes — `theme`, `permissions`, etc. —
      sont **préservées**).
- [ ] **Test bout-en-bout** : en session réelle, une délégation vers un agent **hors roster** est
      **refusée** et le message d'erreur s'affiche ; une délégation vers un agent du roster passe et
      apparaît dans le log (aller + retour).

### Clarification `CLAUDE.md` global (3.4)
- [ ] La phrase « aucun hook… » est **explicitement scopée** au déclenchement d'`iakastart` (pas une
      interdiction globale).
- [ ] Le `CLAUDE.md` global mentionne que les **hooks d'identité** et le **garde des gestes** sont
      **autorisés**.

---

## 7. Étape humaine — pose du bloc `hooks` dans `settings.json`

> **Auto-modification du harnais** : l'écriture de `~/.claude/settings.json` modifie le comportement
> du runtime Claude Code lui-même. Conformément aux conventions iakaframe, cette étape est
> **validée/exécutée par Stéphane** (qui l'a autorisée). Gimli **prépare** le bloc ; Stéphane (ou
> Gimli sur GO explicite de Stéphane) **le pose**.

Bloc proposé à fusionner dans le `settings.json` existant (sans écraser `theme`/`permissions`/… ) :

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "node /Users/sjupin/.claude/identity-remind.mjs" } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "node /Users/sjupin/.claude/identity-guard.mjs" } ] }
    ],
    "SubagentStop": [
      { "hooks": [ { "type": "command", "command": "node /Users/sjupin/.claude/identity-guard.mjs" } ] }
    ],
    "PreToolUse": [
      { "matcher": "Task", "hooks": [ { "type": "command", "command": "node /Users/sjupin/.claude/delegation-guard.mjs" } ] }
    ],
    "PostToolUse": [
      { "matcher": "Task", "hooks": [ { "type": "command", "command": "node /Users/sjupin/.claude/delegation-guard.mjs" } ] }
    ]
  }
}
```

> À adapter si Stéphane préfère un chemin via `$HOME`/`~` selon ce que le runtime accepte ; vérifier
> que `node` est dans le `PATH` du runtime au moment du hook.

---

## 8. Risques & limites (assumés)

- **FAIL-OPEN partout** : un bug d'un garde **n'interrompt jamais** une session (exit 0). Contrepartie
  assumée : en cas de bug du garde, **un contrôle peut être manqué silencieusement** (le garde ne
  doit jamais être la cause d'un blocage de travail réel).
- **Portée assumée du garde des gestes** : il rend les gestes **auditables** et **bloque le hors
  roster** ; il **ne valide pas sémantiquement** qui a réellement fait le travail ni la fidélité de
  la restitution. La **restitution verbatim** reste une **règle comportementale** (cf.
  `rituel-identite-agents.md`) ; le log la rend **vérifiable a posteriori**, pas **imposable** a priori.
- **Parité multiplateforme Windows/macOS à garder en phase** : il existe désormais **deux familles**
  de gardes (`.ps1` Windows, `.mjs` macOS). Toute évolution de comportement (roster, règle de badge,
  format de log) **doit être répliquée dans les deux** sous peine de divergence. Recommandation :
  considérer le roster + la logique de détection comme une **spec commune** dont les deux
  implémentations sont des miroirs.
- **Auto-modification du harnais (`settings.json`)** : risque de casser le JSON ou d'introduire un
  hook bloquant mal configuré → étape **humaine**, à tester en session réelle juste après la pose
  (cf. critère bout-en-bout §6).
- **`node` requis dans le `PATH`** du runtime au déclenchement du hook : si absent, le hook échoue ;
  grâce au fail-open des scripts, l'échec d'invocation ne doit pas figer la session, mais le contrôle
  serait inopérant — à vérifier au test bout-en-bout.

---

## 9. Notes pour Gimli (exécution)
- Les trois `.mjs` **existent déjà** dans `/Users/sjupin/.claude/` ; commencer par **vérifier** leur
  conformité aux critères §6 (tests stdin) **avant** toute modification — ne ré-écrire que si un
  critère échoue.
- **Ne pas supprimer** les `.ps1` Windows (parité).
- **Ne pas poser** `settings.json` sans GO explicite de Stéphane (§7, auto-modification du harnais).
- Clôture : régénérer l'état des lieux + commit conventional (`feat:` garde des gestes + portage
  macOS) via la procédure `update` de la méthode.
```
