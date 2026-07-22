# PROJET — iakaframe

> Ligne de définition (source de vérité cockpit) :
> iakaframe — la méthode de travail IA-augmentée (décideur + équipe de personas,
> 3 phases + squad prod), formalisée, outillée (CLI + kits multi-runner) et réutilisable.

> Espace de réflexion. Document de vision et de specs.
> **Aucun code n'est écrit ici** — seulement des décisions et des spécifications.

---

## Vision

Transformer une façon de collaborer efficace (éprouvée sur `IAKA Vod`, `robotimmo`,
`iakaAFstorage`, `iakabox`, `iakaJarvis`) en un **cadre réutilisable** : pouvoir démarrer
n'importe quel projet avec la méthode déjà en place, au lieu de la réinventer.
Postulat fondateur : **c'est le workflow qui produit la qualité, pas l'IA.**

## Problème résolu

Une IA sans cadre génère du code plausible mais non fiable, et chaque projet réinvente
son organisation. iakaframe fournit des **rôles étanches** (personas), des **instructions
écrites avant tout code**, des **gates de qualité**, et l'outillage (CLI + kits) pour
appliquer tout ça de façon **portable d'un runner à l'autre**.

## Périmètre

**Dans le scope :**
- La méthode canonique (`methode-de-travail.md`) et son équipe d'agents.
- La bibliothèque : personas + skills (`library/`), agnostiques et composables.
- Le CLI multi-OS `@naonedge/iakaframe` (`onboard`/`init`/`snapshot`/`update`/`jalon`…).
- Les kits de démarrage multi-runner (claude, codex, anythingllm, ollama, openwebui).
- Le **design NaonEdge** (`design-naonedge/`) : charte canon des supports de la méthode.

**Hors scope (pour l'instant) :**
- Les projets consommateurs eux-mêmes (iakaframe **outille**, ne les héberge pas).
- **iakaFrameGUI** : dépôt **miroir**, hors de ce dépôt. La **parité** source↔miroir est
  contrôlée par `vendor-check` — les défauts de miroir se traitent côté GUI.

---

## Décisions structurantes

- **3 phases** (cadrage → réalisation → staging) + **squad prod** séparé ; gates humains.
- La **réflexion** produit l'**instruction écrite** (`specs/instructions/`), **jamais de
  code** ; l'**exécution** lit l'instruction avant chaque tâche.
- **Skills agnostiques en couches** (capacité → famille → produit) ; les produits concrets
  sont des **collections de skills** choisies à l'install.
- **Multi-runner = granularité persona** (runner + model + tools) ; 3 hosts d'entrée
  (claude / codex / openwebui), enforcement au host.
- Dépôt par défaut : **Forgejo LAN** (iakabox), HTTP + token.
- **Parité source↔miroir** (iakaframe ↔ iakaFrameGUI) contrôlée par `vendor-check`.

---

## Stack technique — décision

| Couche | Choix | Raison |
|---|---|---|
| CLI | Node multi-OS, zéro dépendance runtime | portabilité Windows / macOS / Linux |
| Runners | Claude Code, Codex, AnythingLLM, OpenWebUI, Ollama | multi-host, persona portable |
| Doc / supports | Markdown → HTML, charte NaonEdge | supports on-brand |
| Hébergement source | Forgejo LAN (iakabox) | self-hosted / open-source d'abord |

> Rappel méthode : self-hosted/open-source d'abord ; cloud en fallback justifié.

---

## Backlog (renvoi)

Le backlog est tenu dans [`BACKLOG.md`](../BACKLOG.md) (**source unique**, dette technique
dense) — pas de duplication ici. Chantiers ouverts prioritaires : `vendor-check` cross-repo,
dette des skills déployées (`~/.claude/skills/`), chantier personas (roster au-delà
d'Aragorn), portage Node du générateur HTML, CH-A (reprise ASAP).

Chaque feature reçoit son fichier dans `specs/instructions/` **avant** implémentation.

---

## Décisions structurantes (journal)

> Trace courte des arbitrages importants — le « pourquoi » qui se perd sinon.

- **2026-07-22** — Pose de la ligne de définition du projet dans `specs/PROJET.md`
  (source de vérité de la tuile cockpit). Périmètre arbitré : NaonEdge **dans** le scope,
  iakaFrameGUI **miroir hors** scope (parité via `vendor-check`).
- **2026-07-22** — **Dette de version à résoudre** : divergence entre l'état des lieux
  (`specs/etat-des-lieux.md` → **v0.6.1**) et `cli/package.json` (**v0.1.0**). Source de
  vérité de version à réconcilier ; à cadrer (Gandalf) avant prochain versionnement.
