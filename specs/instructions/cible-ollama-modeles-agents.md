# Instruction : cible « ollama » (agents sur modèles locaux) + alternatives par agent

> Phase cadrage (🧙 Gandalf). Statut partiel : le **rapport d'alternatives est livré**, la
> **cible `ollama`** complète reste à planifier.

## Besoin (décideur)

1. **3e cible** : un utilisateur **sans Claude ni ChatGPT** → on lui propose des **modèles
   locaux (Ollama)** comme « moteurs » des agents, avec une **table modèle↔agent**.
2. Proposer ces alternatives **aussi en cible claude/codex** quand un modèle **local plus
   performant** existe (ou pour tester) : gpt-oss, mistral, deepseek, kimi, qwen, llama, etc.
3. **Odin** peut lancer **à la demande** un **état des lieux des alternatives agents**.
4. **Au premier onboard** : lancer **dashboard + état des lieux global**.

## Livré

- ✅ **`iakaframe-alternatives.ps1`** — table **modèle local recommandé par agent** confrontée
  aux modèles **réellement installés** sur Ollama (`/api/tags`) ; statut dispo / alt / à
  installer ; propose les `ollama pull` manquants (gate humain). **Lançable par Odin.**
- ✅ **dashboard + état des lieux global** au premier onboard : déjà fait par
  `iakaframe-onboard.ps1 -Umbrella` (Odin + dashboard + `scan`).

## Table modèle↔agent (référence, cf. le script)

| Agent | Rôle | Recommandé (local) | Alternatives |
|---|---|---|---|
| 🦅 Odin | portefeuille/raisonnement | `qwen3` | gpt-oss, mistral |
| 🛡️ Aragorn | coordination | `qwen3` | mistral, gpt-oss |
| 🧙 Gandalf | cadrage/raisonnement | `deepseek-r1` | qwen3, gpt-oss, kimi |
| ⚒️ Gimli | dev/code | `qwen2.5-coder` | deepseek-coder, codestral |
| 🏹 Legolas | qualité/tests | `qwen2.5-coder` | deepseek-coder, codestral |
| 🌉 Helm | prod/ops | `llama3.1` | qwen3, mistral |
| 🎭 Loki | design/vision | `qwen2.5-vl` | llava |
| 📖 Nathalie | guides/rédaction | `mistral` | qwen3, llama3.1 |

> Les tags exacts (taille/quant) sont laissés au `ollama pull`. Tableau à ajuster selon l'état
> de l'art (Gandalf vérifie le web avant de figer).

## Cible `ollama` — ✅ kit livré

- **Constat** : Ollama est un **serveur de modèles**, pas un harnais. Deux couches sont
  nécessaires : **orchestration** (n8n / Activepieces — déjà l'outil d'Aragorn : dispatch,
  Slack, gates, appels Ollama) **+ harnais de code** qui édite le repo (Aider, OpenHands,
  Cline/Continue, opencode…). La cible `ollama` = **méthode + contrat + table modèle↔agent**,
  pas un harnais maison.
- **Candidat all-in-one recommandé : OpenClaw** (openclaw.ai) — open-source, local-first ;
  couvre **exécution (shell/fichiers) + orchestration (multi-chat dont Slack, cron, skills)**
  sur **Ollama**, sans Claude/ChatGPT. Ses **skills** mappent sur les **personas iakaframe** ;
  compléter d'un harnais code-focused (Aider/OpenHands) pour le dev lourd.
- ✅ **`kit-ollama/`** livré : `AGENTS.md` (rôles + phases + table) + `MODELES.md` (modèle↔agent
  + `ollama pull` + outils : n8n orchestration / harnais code) + templates `specs/`.
- ✅ **Onboard** : `iakaframe-init.ps1 -Target ollama` (et `-onboard`) déploie `kit-ollama/`
  (contrat `AGENTS.md`, marqueur `.iakaframe`). Testé.
- **Aragorn** : quand un modèle plus adapté existe en local (ou à tester), le **suggère** (via le
  rapport d'alternatives) et propose l'install — gate humain (cf. `modeles-suggestion-install.md`).

## Hors scope

Choix/installation de l'outil agentique tiers ; benchmark automatique des modèles ; fine-tuning.
