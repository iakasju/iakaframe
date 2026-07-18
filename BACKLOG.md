# Backlog — iakaframe

Items de backlog du projet (tenus au fil de l'eau ; convertis en instruction cadrée avant tout dev).

## Ouverts

- [ ] **Réconcilier la forme de `services.json` entre le CLI et `iakaframe-services.ps1`** — depuis l'harmonisation C-JSON, le CLI écrit `{ ok, generated, count, services }` alors que le producteur PowerShell `iakaframe-services.ps1` écrit encore l'ancien `{ generated, services }`. Deux producteurs, deux formes pour un fichier de même vocation. Aucun consommateur cassé aujourd'hui — dette à porter. *(signalé par Legolas au gate C-JSON.)*
- [ ] **Anonymiser les URL Forgejo dans les kits sources** — le compte git perso `sjupin` subsiste dans des URL de remote `http://192.168.2.11:3001/sjupin/<repo>.git` (`kits/iakaframe-claude/CLAUDE.md`, `kits/iakaframe-claude/global/CLAUDE.md`, `kits/iakaframe-openwebui/functions/iakaframe_identity_filter.py`). Hors périmètre du nettoyage des chemins machine (`/Users/`, `C:\Users\`) déjà fait. *(signalé par Legolas au gate du commit 01fa061.)*

## Fait

- [x] **Travailler la structure API & commandes du CLI** — surface `--json` harmonisée autour de la convention **C-JSON** (racine objet, `ok` en tête, collections pluriel + `count`, erreurs `{ok:false,error}` sur stdout + exit 1). Source unique `cli/src/lib/output.js`, extraction inline `portfolio`/`list` vers `lib/`, garde anti-dérive. 3 ruptures assumées (`list`, `assemble`, `services`). Commits `1356c2e`/`a8ec920`/`938ff91`, gate Legolas **PASS**. *(instruction `specs/instructions/cli-api-surface-harmonisation.md`.)*
- [x] **Nettoyer un chemin machine en dur** — `perimeter-guard.mjs` L186 + `README.md` L4 généralisés en formes génériques (`$HOME/...`, `/Users/<user>/...`, `C:\Users\<user>\...`), iso-comportement. Commit `01fa061`, gate Legolas **PASS**. *(instruction `specs/instructions/nettoyage-chemin-machine-perimeter-guard.md`.)*
