# Instruction — Commande `/iaka` (entrée méthode) — CLOSE SANS SUITE

> Cadrée puis **close par Gandalf** (P1 — Cadrage). **Décision décideur** : `/iaka` **reste**
> l'alias de `/learning` — la réaffectation de `/iaka` vers l'entrée du parcours est **abandonnée**.
> Suite reprise dans → **`specs/instructions/palette-slash-commands.md`**.

---

## Ce qui avait été proposé

Réaffecter la slash-command `/iaka` (aujourd'hui **alias de `/learning`** dans
`kits/iakaframe-claude/.claude/commands/iaka.md`) vers l'**entrée de la méthode** (skill
`iakastart`), et dédupliquer le fichier ad-hoc `~/.claude/commands/iaka.md`.

## Décision (gate décideur)

- **`/iaka` reste `/learning`.** L'alias d'apprentissage est **conservé** ; aucune réaffectation.
- **L'entrée du parcours reste `/iakastart`** (déjà existant) — pas de nouvelle commande d'entrée.
- Le fichier ad-hoc `~/.claude/commands/iaka.md` a été **restauré sur le contenu canonique du kit**
  (alias de `/learning`) → **plus aucune divergence** ; `iaka.md` (source) est **intact**.

→ Cette instruction est donc **sans objet** et **close**. Ne rien exécuter ici.

## Acquis conservés (réutilisés par l'instruction suivante)

Le cadrage a **établi et vérifié** deux faits réutilisés par
`specs/instructions/palette-slash-commands.md` :
1. Le **déploiement des slash-commands existe déjà, sans code neuf** : `install.mjs:346` (planner
   `Commands` → `~/.claude/commands/`, **global**) et `cli/src/lib/kit.js:72` (`copyKit`,
   **projet**) lisent tous deux `kits/iakaframe-claude/.claude/commands/`. Preuve :
   `cli/test/install-multihost.test.js:74`.
2. **Conventions Claude Code** vérifiées (frontmatter `description` + corps-prompt + `$ARGUMENTS`,
   portées projet vs `~/.claude/commands/`) — cf. sources ci-dessous.

Sources (état de l'art, juillet 2026) :
- https://code.claude.com/docs/en/agent-sdk/slash-commands
- https://www.datacamp.com/tutorial/claude-code-slash-commands

## Statut

| | |
|---|---|
| **Émetteur** | 🔵 Gandalf (Cadrage, P1) |
| **Contenu** | Instruction **close sans suite** (décision : `/iaka` reste `/learning`). Acquis de déploiement + conventions repris dans `palette-slash-commands.md`. |
| **Récepteur** | 🟢 Le décideur (Stéphane) — décision actée. Suite → `palette-slash-commands.md`. |
