---
id: iakaframe-log-conversation
name: iakaframe-log-conversation
description: Logger un message de conversation dans la main courante iakaboxlogs (publie sur MQTT, persiste dans CouchDB, consultable via Fauxton/dashboards). À utiliser quand un agent doit tracer un échange utilisateur↔agent ou agent↔agent — "logguer la conversation", "tracer cet échange", "alimenter la main courante".
layer: product
---

# iakaframe — log-conversation

Brique transverse : **n'importe quel agent** peut pousser un message dans la main
courante centralisée `iakaboxlogs` (stack déployée sur la VM2 d'iakabox). Le message part
en MQTT, un pont le persiste dans CouchDB (base `conversations`).

Le publisher `iakalog.mjs` est **Node pur, zéro dépendance** (MQTT 3.1.1 sur TCP) : pas de
`npm install`, fonctionne tel quel partout où Node est présent.

## Pré-requis (variables d'env — jamais commitées)

| Variable | Rôle | Défaut |
|---|---|---|
| `IAKALOG_MQTT_URL` | broker MQTT | `mqtt://192.168.2.11:1883` |
| `IAKALOG_USER` / `IAKALOG_PASS` | identifiants MQTT | — (requis) |
| `IAKALOG_ROYAUME` | royaume de l'agent | `unknown` |
| `IAKALOG_AGENT` | nom de l'agent | `unknown` |
| `IAKALOG_CONV` | id de conversation | `default` |
| `IAKALOG_PREFIX` | préfixe de topic | `iakaboxlogs` |

## Utilisation

```bash
node iakalog.mjs --role user --content "question de l'utilisateur"
node iakalog.mjs --role assistant --content "réponse de l'agent" --tokens 128
node iakalog.mjs --role user --content "..." --royaume iakacockpit --agent Aragorn --conv conv-2026-06-21-001
```

`--royaume`, `--agent`, `--conv` retombent sur les variables `IAKALOG_*` si omis.
Le script est dans le dossier de cette skill (`iakalog.mjs`).

## Convention

- **Topic** : `<prefix>/<royaume>/<agent>/<conv_id>` (défaut `iakaboxlogs/...`)
- **Document** : `{ ts, royaume, agent, conv_id, role, content, tokens, meta }`

## Échec propre

Sans `IAKALOG_USER`/`IAKALOG_PASS`, ou si le broker est injoignable, le script sort en
code 1 avec un message clair — **sans bloquer** le travail de l'agent.

## Notes

- Détails d'archi et déploiement de la stack : projet **iakaboxlogs** (Mosquitto + CouchDB
  + pont) sur la VM2 d'iakabox.
- Automatisation possible : un hook Claude Code (`Stop` / `UserPromptSubmit`) peut appeler
  ce script pour logger chaque tour sans intervention du modèle.
