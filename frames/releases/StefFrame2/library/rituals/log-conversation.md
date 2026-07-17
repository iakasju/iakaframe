---
id: log-conversation
label: Journal de conversation (main courante)
triggers: [log-conversation, logguer la conversation, tracer cet échange]
actions:
  - "Pousser un message (utilisateur↔agent ou agent↔agent) dans la main courante <LOG_PREFIX>"
  - "Publication broker ; persistance une base de documents (base conversations) via un pont"
  - "Consultable via l'interface d'admin de la base / dashboards"
side: cockpit
---
# Journal de conversation (main courante)

Rituel iakaframe (geste outillé) extrait de `methode-de-travail.md` et du CLAUDE.md global
(le narratif reste la référence, I5). Côté `cockpit`.

Brique transverse : n'importe quel agent peut tracer un échange dans la main courante centralisée `<LOG_PREFIX>` (stack votre serveur git). Geste machine, config par env, aucun secret en dépôt.
