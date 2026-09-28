---
id: perimeter
label: Périmètre des gestes directs
kind: perimeter
hook: "PreToolUse (Edit|Write|Bash|NotebookEdit|PowerShell)"
policy: "Un geste mutateur direct qui SORT du chantier attribué (ancré sur le chantier de session — lancement, ou désignation du décideur en session Odin ; à défaut CLAUDE_PROJECT_DIR) est bloqué (DENY) ; jamais d'écriture/commit hors du chantier courant."
---
# Périmètre des gestes directs

Garde-fou iakaframe extrait de `methode-de-travail.md` et de `kit-claude/global/hooks/*`
(le narratif reste la référence, I5).

**Politique.** Un geste mutateur direct qui SORT du chantier attribué (ancré sur le **chantier de
session** — le dépôt/dossier du **lancement**, ou une désignation explicite du **décideur** en
session Odin : `chantier <repo>` / `odin-direct <repo>` ; à défaut `CLAUDE_PROJECT_DIR`) est
**bloqué (DENY)** ; jamais d'écriture/commit hors du chantier courant. La lecture reste toujours
libre. Réf. : `specs/instructions/declaration-chantier-session.md`.

Garde du canal des gestes DIRECTS (hook `perimeter-guard` sur PreToolUse, matcher
Edit|Write|Bash|NotebookEdit|PowerShell) : détecte les chemins touchés, ancre sur le **chantier de
session** (couche `chantier-state.mjs`, active si un `session_id` est exploitable), à défaut sur
`$CLAUDE_PROJECT_DIR` (couche historique), fail-open **visible** en cas de panne interne. Garde de
CHEMINS, jamais de personas.
