# kit-claude/global — artefacts de déploiement niveau-utilisateur

Sources **versionnées** des fichiers qui vivent au runtime dans `~/.claude/`
(p.ex. `C:\Users\<user>\.claude\` sous Windows).

Copier dans `~/.claude/` :
- `CLAUDE.md` → `~/.claude/CLAUDE.md` (instructions globales de la méthode).
- `hooks/*.mjs` → `~/.claude/hooks/` (gardes Node, cross-OS : `identity-guard`,
  `identity-remind`, `perimeter-guard`, `delegation-guard`, `guard-core`, `plan-courante`).
  `identity-remind` est **contextuel** (voix par lieu, § P-5 de
  `prise-de-parole-odin-aragorn.md`) : il dépend de `chantier-state.mjs` (même dossier,
  importé dynamiquement) et retombe sur le rappel générique historique en son absence.

À **distinguer** du `kit-claude/CLAUDE.md` (template **par projet**, à copier à la racine
d'un nouveau repo).

Sens de déploiement : **`kit-claude/global/` (source versionnée) → `~/.claude/` (runtime)**.
On édite la source ici, puis on déploie vers le global ; on n'édite jamais la copie runtime
à la main.
