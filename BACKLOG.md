# Backlog — iakaframe

Items de backlog du projet (tenus au fil de l'eau ; convertis en instruction cadrée avant tout dev).

## Ouverts

- [ ] **Anonymiser les 2 `CLAUDE.md` gelés (§4) — ARBITRAGE DÉCIDEUR REQUIS** — le compte git perso `sjupin` subsiste dans `kits/iakaframe-claude/CLAUDE.md:60` et `kits/iakaframe-claude/global/CLAUDE.md:73` (`http://192.168.2.11:3001/sjupin/<repo>.git`). Ces deux fichiers sont classés **LAISSER-DIVERGER « valeurs réelles »** par `reconcilier-kit-source-frame.md` §4 → conflit frontal avec l'anonymisation. **Non traité en marche forcée** : renverser une décision de cadrage documentée relève du décideur. À trancher : lever §4 (fuite d'identifiant perso) ou maintenir le gel ; + question host/IP `192.168.2.11` (conservé par défaut). *(cadré dans `specs/instructions/anonymisation-url-forgejo-kits.md`.)*

## Fait

- [x] **Réconcilier la forme de `services.json` (CLI ↔ ps1)** — direction retenue : aligner le retardataire sur la cible, `iakaframe-services.ps1` émet désormais l'enveloppe C-JSON `{ ok, generated, count, services }` (`[ordered]@{}`). Verrous Node V1 (forme fichier CLI `--out`) + V2 (garde statique du source ps1). Commit `515fe05`, gate Legolas **PASS**. *Runtime ps1 réel = gate humain différé (pas de `pwsh` sur la machine).* *(instruction `specs/instructions/reconciliation-services-json.md`.)*
- [x] **Anonymiser l'`author_url` Forgejo du kit OpenWebUI (occurrence #3)** — `kits/iakaframe-openwebui/functions/iakaframe_identity_filter.py:4` : `sjupin`→`<user>` (docstring non-exécuté, `py_compile` OK, `test_identity_filter.py` 15/15). Host/IP conservé. Commit `82c7fec`, gate Legolas **PASS**. Les occurrences #1/#2 restent ouvertes (voir §4 ci-dessus). *(instruction `specs/instructions/anonymisation-url-forgejo-kits.md`.)*
- [x] **Travailler la structure API & commandes du CLI** — surface `--json` harmonisée autour de la convention **C-JSON** (racine objet, `ok` en tête, collections pluriel + `count`, erreurs `{ok:false,error}` sur stdout + exit 1). Source unique `cli/src/lib/output.js`, extraction inline `portfolio`/`list` vers `lib/`, garde anti-dérive. 3 ruptures assumées (`list`, `assemble`, `services`). Commits `1356c2e`/`a8ec920`/`938ff91`, gate Legolas **PASS**. *(instruction `specs/instructions/cli-api-surface-harmonisation.md`.)*
- [x] **Nettoyer un chemin machine en dur** — `perimeter-guard.mjs` L186 + `README.md` L4 généralisés en formes génériques (`$HOME/...`, `/Users/<user>/...`, `C:\Users\<user>\...`), iso-comportement. Commit `01fa061`, gate Legolas **PASS**. *(instruction `specs/instructions/nettoyage-chemin-machine-perimeter-guard.md`.)*
