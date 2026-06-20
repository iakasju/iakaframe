# Instruction : Onboarding iakaframe v2 — versionné, multi-cible, détection de services

> Phase cadrage (🧙 Gandalf). Statut : 🟡 **à valider / à planifier**.
> Fait suite à la livraison du `kit-codex/` (incarnation Codex de la méthode).

## Besoin (décideur)

Disposer d'un **process d'installation / onboarding** d'iakaframe qui :
1. porte une **version** (celle d'iakaframe déployée) ;
2. offre **des options à choisir** (à terme) + des **explications how-to** ;
3. garantit un **dossier chapeau** (umbrella) pour tous les projets ;
4. **détecte les services dispo** : un **git** (Forgejo) — et **où** ; un **Ollama** ; un **ComfyUI** ;
5. s'accompagne d'une **doc d'install/utilisation PDF versionnée**.

## Décisions / pistes

- **Cible (`-Target`)** : `claude` (défaut, `CLAUDE.md` + `.claude/agents`+`skills`) ou `codex`
  (`AGENTS.md` + personas, cf. `kit-codex/`). L'onboard déploie le bon contrat selon la cible.
- **Version** : l'onboard **estampille** la version iakaframe déployée (ex. v0.5.2) dans le
  projet (au moins dans l'état des lieux / un `.iakaframe`), pour tracer ce qui a été posé.
- **Dossier chapeau** : vérifier/instaurer l'umbrella (chez nous `C:\work` ; pour un nouvel
  utilisateur, la racine de ses projets) — y poser Odin (portefeuille) + le dashboard.
- **Détection de services** (sondes réseau, non bloquantes) :
  - **git/Forgejo** : tester l'API Forgejo (host:port connus ou saisis) → dispo + URL ; sinon
    proposer git local.
  - **Ollama** : tester `:11434/api/tags` (host à confirmer) → dispo + modèles.
  - **ComfyUI** : tester `:8188` → dispo.
  Résultat consigné (ex. `specs/etat-des-lieux` ou un `services.json`) et utilisé pour
  pré-remplir les options.
- **Options à choisir (à terme)** : cible (claude/codex), brancher Forgejo ou git local,
  activer le moteur IA (provider), thème, etc. — d'abord un onboarding guidé, options plus tard.
- **How-to** : messages d'explication à chaque étape + un récap final « voici ce qui a été posé,
  voici la suite ».
- **PDF versionné** : doc d'install/usage (à partir de `methode-de-travail.html` / un HTML
  dédié) exportée en **PDF tagué de la version** (rôle 📖 Nathalie / 🎭 Loki). Export = print
  HTML→PDF (à outiller).

## Étapes (proposées, à découper)

1. `iakaframe-onboard.ps1 -Target <claude|codex>` : déploie le bon contrat + structure + version.
2. Module de **détection de services** (PowerShell) : Forgejo / Ollama / ComfyUI → rapport.
3. **Umbrella** : garantir le dossier chapeau + Odin + dashboard.
4. **Doc PDF versionnée** : pipeline HTML→PDF + tag de version.
5. (plus tard) **options interactives** + how-to enrichi.

## Hors scope (pour l'instant)

Incarnation Codex *complète* (prompts/commands Codex en miroir des skills) ; auto-install des
services manquants (git/ollama/comfyui) ; multi-OS (cible Windows/PowerShell d'abord).
