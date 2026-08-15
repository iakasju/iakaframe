# MODELES.md — modèles locaux (Ollama) par agent

> ⚠️ **Ce tableau n'est plus une source (2026-08-03).** La **source unique** des suggestions est
> **`models/suggestions.json`** à la racine du réservoir, indexée par **`roleKey`** (portable
> d'une méthode à l'autre) — lue par le verbe **`iakaframe models`**, qui confronte les
> suggestions au parc réellement disponible et propose l'installation sur gate humain.
>
> **Le tableau ci-dessous est conservé à titre indicatif et il est périmé** : les modèles qu'il
> recommande (`qwen3`, `deepseek-r1`, `llama3.1`, `qwen2.5-vl`) n'étaient **pas présents** sur le
> parc au 2026-08-03. Ne pas l'éditer pour « le remettre à jour » : corriger la source unique.
>
> Quel modèle pour quel agent, en cible **ollama**. État réel (installés vs à installer) :
> `iakaframe models`. Tags exacts (taille/quantization) à choisir selon ta VRAM/RAM.

| Agent | Rôle | Recommandé | Alternatives | `ollama pull` (exemple) |
|---|---|---|---|---|
| 🦅 Odin | portefeuille/raisonnement | `qwen3` | gpt-oss, mistral | `ollama pull qwen3` |
| 🛡️ Aragorn | coordination | `qwen3` | mistral, gpt-oss | `ollama pull qwen3` |
| 🧙 Gandalf | cadrage/raisonnement | `deepseek-r1` | qwen3, gpt-oss, kimi | `ollama pull deepseek-r1` |
| ⚒️ Gimli | dev/code | `qwen2.5-coder` | deepseek-coder, codestral | `ollama pull qwen2.5-coder` |
| 🏹 Legolas | qualité/tests | `qwen2.5-coder` | deepseek-coder | `ollama pull qwen2.5-coder` |
| ⛴️ Charon | prod/bascule (**sur ordre**) | `llama3.1` | qwen3, mistral | `ollama pull llama3.1` |
| 🌉 Helm | prod/veille (**sans ordre**) | `llama3.1` | qwen3, mistral | `ollama pull llama3.1` |
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
  **Activepieces**). Triggers, dispatch entre rôles, canal Discord, enchaînement, **appels Ollama**,
  gates. Parfait pour piloter le cycle — **mais ne modifie pas le code**.
- **Harnais de code (exécution)** — un agent qui **édite le repo, build, commit**, sur Ollama :
  **Aider** (`aider --model ollama/qwen2.5-coder`), **OpenHands**, **Cline / Continue** (VS Code,
  provider Ollama), **opencode**… Les harnais « purs Ollama » sont **moins mainstream** que
  Claude Code/Codex — c'est le maillon à choisir.

> Combo typique : **n8n** orchestre (rôle Aragorn) + un **harnais de code** exécute (rôle Gimli).
> iakaframe ne fournit pas l'outil — il fournit la **méthode, le contrat et la table modèle↔agent**.

### OpenClaw (openclaw.ai) — candidat all-in-one (recommandé pour ollama)

**Open-source, local-first**, il couvre **les deux couches** : exécution système (shell,
fichiers, navigateur, sandbox/full) **et** orchestration/canal (multi-chat **Discord/Telegram/
Signal…**, **cron**, tâches de fond, **bibliothèque de skills** + skills auto-générées),
sur **modèles locaux (Ollama)** — **sans Claude ni ChatGPT**.
- Les **skills OpenClaw** mappent bien sur les **personas iakaframe** (Odin/Aragorn/Gandalf…).
- Le **canal Discord** d'Aragorn est nativement couvert.
- Pour du **dev lourd** (boucles code/build/test), le compléter d'un harnais code-focused
  (Aider/OpenHands) — OpenClaw peut le piloter.
- CLI + desktop, install npm/git ; données chez l'utilisateur.
