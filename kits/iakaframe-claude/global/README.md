# kit-claude/global — artefacts de déploiement niveau-utilisateur

Sources **versionnées** des fichiers qui vivent au runtime dans `~/.claude/`
(p.ex. `C:\Users\<user>\.claude\` sous Windows).

Copier dans `~/.claude/` :
- `CLAUDE.md` → `~/.claude/CLAUDE.md` (instructions globales de la méthode).
- `hooks/*.mjs` → `~/.claude/hooks/` (gardes Node, cross-OS : `identity-guard`,
  `identity-remind`, `perimeter-guard`, `delegation-guard`, `guard-core`, `plan-courante`,
  **`chantier-state`** et **`chantier-remind`** — couche « chantier déclaré », une session par
  dépôt, `specs/instructions/declaration-chantier-session.md`).
  `identity-remind` est **contextuel** (voix par lieu, § P-5 de
  `prise-de-parole-odin-aragorn.md`) : il dépend de `chantier-state.mjs` (même dossier,
  importé dynamiquement) et retombe sur le rappel générique historique en son absence.
  `chantier-remind.mjs` (hook `UserPromptSubmit`) rappelle le chantier actif à chaque prompt et
  traite les directives `chantier <repo>` / `odin-direct <repo>` (sessions `odin` seulement).
  Interrupteur : `IAKAFRAME_CHANTIER_MODE=off` replie sur le périmètre historique (par défaut,
  la couche est active). L'**installeur** (`install.mjs`, `iakaframe install`) et toute
  **auto-invocation** de `claude` par un agent sont **refusés** aux agents (hors-limite D-9) :
  déployer ces fichiers reste un **geste humain**.

À **distinguer** du `kit-claude/CLAUDE.md` (template **par projet**, à copier à la racine
d'un nouveau repo).

Sens de déploiement : **`kit-claude/global/` (source versionnée) → `~/.claude/` (runtime)**.
On édite la source ici, puis on déploie vers le global ; on n'édite jamais la copie runtime
à la main.
