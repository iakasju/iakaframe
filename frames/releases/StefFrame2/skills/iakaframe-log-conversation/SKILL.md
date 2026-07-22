---
id: iakaframe-log-conversation
name: iakaframe-log-conversation
description: Logger un message de conversation dans la main courante <LOG_PREFIX> (publie sur broker, persiste dans une base de documents, consultable via l'interface d'admin de la base/dashboards). À utiliser quand un agent doit tracer un échange utilisateur↔agent ou agent↔agent — "logguer la conversation", "tracer cet échange", "alimenter la main courante".
---

# iakaframe — log-conversation

Brique transverse : **n'importe quel agent** peut pousser un message dans la main
courante centralisée `<LOG_PREFIX>` (stack déployée sur votre serveur de logs). Le message part
en broker, un pont le persiste dans une base de documents (base `conversations`).

Le publisher `iakalog.mjs` est **Node pur, zéro dépendance** (le protocole broker 3.1.1 sur TCP) : pas de
`npm install`, fonctionne tel quel partout où Node est présent.

## Pré-requis (variables d'env — jamais commitées)

| Variable | Rôle | Défaut |
|---|---|---|
| `IAKALOG_BROKER_URL` | broker broker | `<LOG_BROKER_URL>` |
| `IAKALOG_USER` / `IAKALOG_PASS` | identifiants broker | — (requis) |
| `IAKALOG_ROYAUME` | royaume de l'agent | `unknown` |
| `IAKALOG_AGENT` | nom de l'agent | `unknown` |
| `IAKALOG_CONV` | id de conversation | `default` |
| `IAKALOG_PREFIX` | préfixe de topic | `<LOG_PREFIX>` |

## Utilisation

```bash
node iakalog.mjs --role user --content "question de l'utilisateur"
node iakalog.mjs --role assistant --content "réponse de l'agent" --tokens 128
node iakalog.mjs --role user --content "..." --royaume <ide> --agent Aragorn --conv conv-2026-06-21-001
```

`--royaume`, `--agent`, `--conv` retombent sur les variables `IAKALOG_*` si omis.
Le script est dans le dossier de cette skill (`iakalog.mjs`).

## Convention

- **Topic** : `<prefix>/<royaume>/<agent>/<conv_id>` (défaut `<LOG_PREFIX>/...`)
- **Document** : `{ ts, royaume, agent, conv_id, role, content, tokens, meta }`

## Échec propre

Sans `IAKALOG_USER`/`IAKALOG_PASS`, ou si le broker est injoignable, le script sort en
code 1 avec un message clair — **sans bloquer** le travail de l'agent.

## Notes

- Détails d'archi et déploiement de la stack : projet **<LOG_PREFIX>** (un broker + une base de documents
  + pont) sur votre serveur de logs.
- Automatisation possible : un hook Claude Code (`Stop` / `UserPromptSubmit`) peut appeler
  ce script pour logger chaque tour sans intervention du modèle.
