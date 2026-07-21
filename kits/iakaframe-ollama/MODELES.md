# MODELES.md — modèles locaux (Ollama) par agent

> Quel modèle pour quel agent, en cible **ollama**. État réel (installés vs à installer) :
> `ollama list`. Tags exacts (taille/quantization) à choisir selon ta VRAM/RAM.

| Agent | Rôle | Recommandé | Alternatives | `ollama pull` (exemple) |
|---|---|---|---|---|
| 🦅 Odin | portefeuille/raisonnement | `qwen3` | gpt-oss, mistral | `ollama pull qwen3` |
| 🛡️ Aragorn | coordination | `qwen3` | mistral, gpt-oss | `ollama pull qwen3` |
| 🧙 Gandalf | cadrage/raisonnement | `deepseek-r1` | qwen3, gpt-oss, kimi | `ollama pull deepseek-r1` |
| ⚒️ Gimli | dev/code | `qwen2.5-coder` | deepseek-coder, codestral | `ollama pull qwen2.5-coder` |
| 🏹 Legolas | qualité/tests | `qwen2.5-coder` | deepseek-coder | `ollama pull qwen2.5-coder` |
| 🌉 Helm | prod/ops | `llama3.1` | qwen3, mistral | `ollama pull llama3.1` |
| 🎭 Loki | design/vision | `qwen2.5-vl` | llava | `ollama pull qwen2.5-vl` |
| 📖 Nathalie | guides/rédaction | `mistral` | qwen3, llama3.1 | `ollama pull mistral` |

## Notes

- **Choisir la taille** selon le matériel : ex. `qwen2.5-coder:7b` (léger) → `:32b` (gros).
- **Vérifier l'état de l'art** avant de figer (Gandalf s'appuie sur le web) ; ces familles
  évoluent vite (gpt-oss, deepseek, kimi, qwen, mistral, llama…).
- **Install = gate humain** (taille disque, bande passante). Aragorn peut **suggérer** un
  modèle plus adapté ; il ne pull jamais sans feu vert (cf.
  `specs/instructions/modeles-suggestion-install.md` côté iakaframe).

## Outils (pointés sur Ollama) — deux couches

iakaframe distingue **orchestration** et **exécution de code** :

- **Orchestration / wiring** — déjà l'outil d'Aragorn dans iakaframe : **n8n** (ou
  **Activepieces**). Triggers, dispatch entre rôles, canal Slack, enchaînement, **appels Ollama**,
  gates. Parfait pour piloter le cycle — **mais ne modifie pas le code**.
- **Harnais de code (exécution)** — un agent qui **édite le repo, build, commit**, sur Ollama :
  **Aider** (`aider --model ollama/qwen2.5-coder`), **OpenHands**, **Cline / Continue** (VS Code,
  provider Ollama), **opencode**… Les harnais « purs Ollama » sont **moins mainstream** que
  Claude Code/Codex — c'est le maillon à choisir.

> Combo typique : **n8n** orchestre (rôle Aragorn) + un **harnais de code** exécute (rôle Gimli).
> iakaframe ne fournit pas l'outil — il fournit la **méthode, le contrat et la table modèle↔agent**.

### OpenClaw (openclaw.ai) — candidat all-in-one (recommandé pour ollama)

**Open-source, local-first**, il couvre **les deux couches** : exécution système (shell,
fichiers, navigateur, sandbox/full) **et** orchestration/canal (multi-chat **Slack/Telegram/
Discord/Signal…**, **cron**, tâches de fond, **bibliothèque de skills** + skills auto-générées),
sur **modèles locaux (Ollama)** — **sans Claude ni ChatGPT**.
- Les **skills OpenClaw** mappent bien sur les **personas iakaframe** (Odin/Aragorn/Gandalf…).
- Le **canal Slack** d'Aragorn est nativement couvert.
- Pour du **dev lourd** (boucles code/build/test), le compléter d'un harnais code-focused
  (Aider/OpenHands) — OpenClaw peut le piloter.
- CLI + desktop, install npm/git ; données chez l'utilisateur.
