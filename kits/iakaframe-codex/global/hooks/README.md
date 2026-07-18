# kit-codex/global/hooks — gardes **forcées** identité + périmètre + délégation (parité Claude)

> Incarnation **Codex** des gardes d'enforcement iakaframe (Lots A0 + A1 de l'instruction
> `parite-enforcement-multirunner.md`). Même **verdict** que Claude : chaque adaptateur appelle le
> cœur partagé `guard-core.mjs` (identique byte-pour-byte entre kits, verrouillé par un test de
> parité). Là où les autres runners restent **déclaratifs**, Codex **force** mécaniquement les
> trois rituels — **identité**, **périmètre** et **délégation** — comme Claude.

## Ce que ça fait

- **Identité** — sur les événements **`Stop`** et **`SubagentStop`**, le hook reconstruit le tour de
  parole et vérifie qu'il **ouvre** (pastille AVANT le bloc) et **clôt** (pastille APRÈS le bloc)
  par un badge `[ROYAUME][Agent]`. Badge manquant → **refus (exit 2)**.
- **Périmètre** — sur **`PreToolUse`** (événement **bloquant** chez Codex, comme chez Claude), le
  hook classe le(s) chemin(s) d'un geste (écriture fichier ou commande shell) via
  `guard-core.verdictPerimeter`. Écriture **hors projet** → **refus (exit 2)** ; écriture **dans**
  le projet → allow ; config du harnais Codex (`~/.codex/config.toml`, réservée humain) →
  **DENY_HARNESS**. Panachage de mode via `IAKAFRAME_PERIMETER_MODE` (`deny`/`warn`).
- **Délégation** — sur **`PreToolUse`** le hook vérifie que l'agent cible appartient au **roster**
  iakaframe (`guard-core.verdictDelegation`) : hors roster → **refus (exit 2)** ; sur
  **`PostToolUse`** il **audite** (journalise le retour verbatim).

Tout bug interne / payload illisible → **exit 0** (fail-open : un garde ne fige jamais une session).
Journaux : `~/.codex/iakaframe-perimeter.log` et `~/.codex/iakaframe-delegations.log`.

## Contenu

```
kit-codex/global/hooks/
├── codex-identity-guard.mjs      ← adaptateur IDENTITE (Stop/SubagentStop → guard-core → exit code)
├── codex-perimeter-guard.mjs     ← adaptateur PERIMETRE (PreToolUse bloquant → guard-core)
├── codex-delegation-guard.mjs    ← adaptateur DELEGATION (PreToolUse refus + PostToolUse audit)
├── guard-core.mjs                ← cœur PUR partagé (mêmes verdicts que Claude ; NE PAS diverger)
├── config.hooks.example.toml     ← câblage via [hooks] inline dans ~/.codex/config.toml
├── hooks.example.json            ← câblage via ~/.codex/hooks.json (variante)
└── README.md                     ← ce fichier
```

## Pré-requis (limites upstream assumées)

- **Codex CLI ≥ v0.114** — le système de **hooks lifecycle** est **expérimental**.
- Hooks **désactivés par défaut** → à **activer** (flag expérimental de ta version).
- **Indisponible sur Windows** — macOS / Linux uniquement.
- **Node** disponible dans le PATH (les scripts sont des `.mjs` Node, sans dépendance externe).

## Installation

1. Copier **les quatre** scripts dans `~/.codex/hooks/` : les trois adaptateurs
   (`codex-identity-guard.mjs`, `codex-perimeter-guard.mjs`, `codex-delegation-guard.mjs`)
   **et** `guard-core.mjs` (chaque adaptateur importe le cœur).
2. Câbler les hooks, au choix :
   - **inline** : fusionner `config.hooks.example.toml` dans `~/.codex/config.toml` ; ou
   - **fichier dédié** : déposer `hooks.example.json` en `~/.codex/hooks.json`.
3. Activer les hooks expérimentaux de ta version de Codex, puis démarrer une session.

## Limites (parité honnête)

- **Maille = une réponse / un tour** tel que Codex le délimite. Comme chez Claude, le garde lit le
  **canal adressé** (texte), pas les gestes d'outil.
- **Payload Codex à confirmer** : la forme exacte des payloads de hooks Codex n'est pas figée
  upstream. Les adaptateurs sont **tolérants** — identité : `transcript`/`messages` inline ou
  `transcript_path` JSONL ; périmètre/délégation : noms de champs plausibles pour l'outil
  (`tool_name`/`tool`/`name`), l'entrée (`tool_input`/`input`/`arguments`), le chemin
  (`file_path`/`path`/…), la commande (`command`/`cmd`/`script`) et l'agent cible
  (`subagent_type`/`agent`/`persona`/…). ⚠️ **Avant de figer**, capturer des payloads
  `Stop`/`PreToolUse`/`PostToolUse` **réels** (session Codex, hooks activés) et ajuster
  l'extraction si nécessaire (critère §11 de l'instruction). Les fixtures
  `cli/test/fixtures/guard/codex-*.json` reflètent la forme **présumée**, à valider.
- **Ancrage périmètre** : Codex n'expose pas (encore) d'équivalent stable de `$CLAUDE_PROJECT_DIR`.
  L'adaptateur privilégie l'env **`CODEX_PROJECT_DIR`** s'il existe, sinon retombe **honnêtement**
  sur le `cwd`/`workspace_root` du payload ; **aucun ancrage** exploitable → SKIP (fail-open).
  C'est la seule **divergence assumée** avec Claude (qui skippe faute d'env, sans regarder le cwd).
- **Délégation — MVP** : les adaptateurs rendent la délégation **auditable** (journal) et **refusent**
  un agent hors roster. L'**émission MACHINE L5** (broker/DocDB) de l'adaptateur Claude n'est **pas
  encore portée** côté Codex (infra runner-agnostique différée) — le **verdict**, lui, est identique.
- **e2e sur un vrai Codex** : reste un **gate humain différé** (pas de Codex dans l'environnement de
  CI). La parité de verdict Claude↔Codex est prouvée par tests ; le comportement bloquant réel des
  hooks Codex doit être **validé sur une session réelle** (limites : expérimental, non-Windows).
