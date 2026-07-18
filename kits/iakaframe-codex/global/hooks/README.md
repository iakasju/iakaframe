# kit-codex/global/hooks — garde d'identité **forcée** (parité Claude, pilote)

> Incarnation **Codex** de la garde d'identité iakaframe (Lot 1, pilote de l'instruction
> `parite-enforcement-multirunner.md`). Même **verdict** que Claude : l'adaptateur appelle le
> cœur partagé `guard-core.mjs` (identique byte-pour-byte entre kits, verrouillé par un test de
> parité). Là où les autres runners restent **déclaratifs**, Codex **force** mécaniquement le
> badge d'ouverture/clôture — comme Claude.

## Ce que ça fait

Sur les événements Codex **`Stop`** et **`SubagentStop`**, le hook lit le payload, reconstruit le
tour de parole, et vérifie qu'il **ouvre** (pastille AVANT le bloc) et **clôt** (pastille APRÈS le
bloc) par un badge `[ROYAUME][Agent]`. Badge manquant → **refus (exit 2)** avec un message stderr
nommant le badge manquant. Tout bug interne / payload illisible → **exit 0** (fail-open : un garde
ne fige jamais une session).

## Contenu

```
kit-codex/global/hooks/
├── codex-identity-guard.mjs      ← adaptateur Codex (lit le payload → guard-core → exit code)
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

1. Copier **les deux** scripts dans `~/.codex/hooks/` :
   `codex-identity-guard.mjs` **et** `guard-core.mjs` (l'adaptateur importe le cœur).
2. Câbler les hooks, au choix :
   - **inline** : fusionner `config.hooks.example.toml` dans `~/.codex/config.toml` ; ou
   - **fichier dédié** : déposer `hooks.example.json` en `~/.codex/hooks.json`.
3. Activer les hooks expérimentaux de ta version de Codex, puis démarrer une session.

## Limites (parité honnête)

- **Maille = une réponse / un tour** tel que Codex le délimite. Comme chez Claude, le garde lit le
  **canal adressé** (texte), pas les gestes d'outil.
- **Payload Codex à confirmer** : la forme exacte du transcript des hooks Codex n'est pas figée
  upstream. L'adaptateur est **tolérant** (plusieurs formes plausibles : `transcript`/`messages`
  inline, ou `transcript_path` JSONL). ⚠️ **Avant de figer le pilote**, capturer un payload
  `Stop`/`SubagentStop` **réel** (session Codex v0.114+, hooks activés) et ajuster
  `codex-identity-guard.mjs` → `messagesFromPayload`/`textOf` si nécessaire (critère 8.1.1 de
  l'instruction). Les fixtures `cli/test/fixtures/guard/codex-*.json` reflètent la forme
  **présumée**, à valider.
- **Périmètre & délégation** : non couverts par ce pilote (Lot 2, à arbitrer). Ce hook ne force
  que l'**identité**.
