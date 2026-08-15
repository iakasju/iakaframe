# MODELES.md — modèle par persona (incarnation AnythingLLM)

> **Un workspace = un LLM.** Sous AnythingLLM, chaque workspace peut pointer **son propre
> fournisseur/modèle** (réglage *Workspace Settings > Chat Settings > Workspace Chat model*),
> différent du défaut global. On affecte donc **un modèle par persona**. Principe iakaframe :
> **local pour le volume, cloud pour le raisonnement critique**. Tags/tailles à adapter à ta
> VRAM/RAM. Cohérent avec `kit-ollama/MODELES.md`.

| Persona | Rôle / phase | Recommandé (local Ollama) | Alternatives / cloud | Note |
|---|---|---|---|---|
| 🦅 Odin | portefeuille / raisonnement | `qwen3` | meilleur modèle de raisonnement de l'abo cloud | Vue d'ensemble multi-projets : raisonnement soigné. |
| 🛡️ Aragorn | coordination | `qwen3` | mistral, gpt-oss | Découpe et séquence : raisonnement correct suffit. |
| 🧙 Gandalf | cadrage / archi | `deepseek-r1` | qwen3, gpt-oss, kimi / cloud raisonnement | Le cadrage conditionne tout : privilégier la finesse. |
| ⚒️ Gimli | dev / devops | `qwen2.5-coder` (`:7b`→`:14b` selon VRAM) | deepseek-coder, codestral / Codex-GPT | Gros volume de code : le local fait très bien le job. |
| 🏹 Legolas | qualité / tests | `qwen2.5-coder` (**≠ modèle de Gimli**) | deepseek-coder / cloud si revue sensible | Gate indépendant : ne jamais réutiliser le modèle qui a écrit le code. |
| ⛴️ Charon | prod / bascule (**sur ordre**) | `llama3.1` | qwen3, mistral / cloud fiable | Risque élevé (rollback, prod) : priorité à la fiabilité. |
| 🌉 Helm | prod / veille (**sans ordre**) | `llama3.1` | qwen3, mistral / cloud fiable | Hérité de la bascule à la scission — **NON MESURÉ** sur une tâche de veille. |
| 🎭 Loki | design / vision | `qwen2.5-vl` | llava / GPT multimodal | Le multimodal aide sur l'UI et la charte. |
| 📖 Nathalie | guides / rédaction | `mistral` | qwen3, llama3.1 | Tâche surtout linguistique (FR) : le local suffit. |

## Brancher un fournisseur LLM dans AnythingLLM

1. **Réglage global** : *Settings > AI Providers > LLM* → choisir le provider (Ollama,
   OpenAI-compatible/LiteLLM, OpenAI, etc.) et l'URL de base (ex. `http://<box>:11434` pour
   Ollama, `http://<box>:<port>/v1` pour LiteLLM). C'est le **défaut** appliqué aux nouveaux
   workspaces.
2. **Par workspace** : ouvrir le workspace du persona → *Settings (engrenage) > Chat Settings* →
   **Workspace Chat Provider / Model** → sélectionner le modèle voulu pour **ce** persona. C'est
   ce réglage qui réalise « un workspace = un LLM ».

## Principe

- **Local pour le volume, cloud pour le raisonnement critique.** Cadrage et revue (Gandalf,
  Legolas) là où le raisonnement compte → cloud ou gros modèle. Écriture de code en volume
  (Gimli) → local, gratuit et privé.
- **Repère VRAM** (ex. RTX 3060, 12 Go) : un **7B** q4 tourne confortablement ; un **14B** q4
  passe mais serré (un seul à la fois) ; au-delà → cloud.
- **Legolas ≠ Gimli** : la revue ne réutilise jamais le modèle qui a écrit le code (gate
  indépendant).
- **Changer de modèle selon la tâche fait partie du rôle.**

## Note

- **Pas de box / pas de modèles locaux ?** Tout peut tourner en **cloud** (un seul provider
  global suffit) ; le multi-modèle par workspace est une **optimisation**, pas une obligation.
- **Abonnement grand public ≠ clé API** : AnythingLLM se branche sur l'**API** (facturée au
  token) ou sur un fournisseur **local** (Ollama/LiteLLM), pas sur un abo chat grand public.
