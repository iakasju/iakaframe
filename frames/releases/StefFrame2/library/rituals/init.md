---
id: init
label: Démarrer / reprendre un projet (init iakaframe)
triggers: [init iakaframe, initialise iakaframe, update iakaframe]
actions:
  - "Auto-détecter init vs update via l'API votre serveur git (dépôt présent ⇒ update ; absent ⇒ init)"
  - "Répertoire vide : créer le dépôt votre serveur git, déployer la structure, 1er commit + état des lieux v0.1.0 + push"
  - "Répertoire avec du dev : déployer la structure autour du code (non destructif), brancher votre serveur git si absent, snapshot de reprise"
  - "Faire la synthèse de l'état des lieux et proposer la prochaine étape concrète"
side: forge
---
# Démarrer / reprendre un projet (init iakaframe)

Rituel iakaframe (geste outillé) extrait de `methode-de-travail.md` et du CLAUDE.md global
(le narratif reste la référence, I5). Côté `forge`.

Amorce la méthode sur un projet neuf comme existant. Orchestrateur : `iakaframe-onboard.ps1` (init + votre serveur git + commit + snapshot). Un `CLAUDE.md` projet déjà présent prime. C'est le geste de **forge** (création/onboarding d'un dépôt).
