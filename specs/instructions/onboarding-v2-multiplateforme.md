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
  activer le moteur IA (provider), thème, **installer iakaIDE (optionnel)** — l'app desktop
  portefeuille (Tauri) qui pilote les projets ; etc. D'abord un onboarding guidé, options plus tard.
- **How-to** : messages d'explication à chaque étape + un récap final « voici ce qui a été posé,
  voici la suite ».
- **PDF versionné** : doc d'install/usage (à partir de `methode-de-travail.html` / un HTML
  dédié) exportée en **PDF tagué de la version** (rôle 📖 Nathalie / 🎭 Loki). Export = print
  HTML→PDF (à outiller).

## Étapes (proposées, à découper)

1. ✅ **LIVRÉ** — `iakaframe-init.ps1 -Target <claude|codex>` (contrat + structure + marqueur
   `.iakaframe` versionné) **ET** `iakaframe-onboard.ps1 -Target <claude|codex>` (threadé →
   transmet à init, message final adapté au contrat).
2. ✅ **LIVRÉ** — Module de **détection de services** : `iakaframe-services.ps1` (sonde
   Forgejo / Ollama / ComfyUI sur hôtes candidats, rapport + `-Json services.json`).
2bis. **Conf GPU** (🌉 Helm) : vérifier driver NVIDIA / runtime / CUDA (`nvidia-smi`) sur l'hôte
   IA ; **conseiller** une modif si nécessaire (ex. driver < 580 → Ollama récent échoue, cf.
   crash Whisper) ; **proposer de l'appliquer via SSH** si accès + **autorisation explicite**
   (gate humain, jamais sans feu vert ; les MAJ de driver sont lourdes/risquées).
3. ✅ **LIVRÉ** — **Umbrella** : `iakaframe-onboard.ps1 -Umbrella -Path <chapeau>` installe le
   niveau portefeuille — **Odin** (chapeau `.claude/` + global `~/.claude/`), **dashboard
   NaonEdge** copié (hors `data`/`.git`) + **scan initial** (`data/projects.js`). Option
   `-DashboardSource`. **Propose d'amorcer les projets** du chapeau non onboardés : par défaut
   il les **liste** ; avec **`-InitProjects`** il les **amorce** (init structure seule, `-Target`,
   **sans Forgejo**, non destructif, idempotent — saute ceux ayant déjà `.iakaframe`/contrat).
   Testé OK.
4. **Doc PDF versionnée** : pipeline HTML→PDF + tag de version.
5. **Modèles** (cf. `modeles-suggestion-install.md`) : à l'onboarding, 🎭 Loki vérifie les
   modèles image/design (ComfyUI) et propose l'install ; 🛡️ Aragorn suggère un modèle Ollama
   plus adapté au besoin. Gate humain avant tout pull.
6. **iakaIDE (optionnel)** : proposer son installation (clone + build Tauri, ou binaire) au
   niveau du **dossier chapeau** — l'app desktop qui pilote le portefeuille. Décliné par cible si
   pertinent.
7. (plus tard) **options interactives** + how-to enrichi.

## Hors scope (pour l'instant)

Incarnation Codex *complète* (prompts/commands Codex en miroir des skills) ; auto-install des
services manquants (git/ollama/comfyui) ; multi-OS (cible Windows/PowerShell d'abord).
