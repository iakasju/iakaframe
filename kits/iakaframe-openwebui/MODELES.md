# MODELES.md — modèle par persona (incarnation Open WebUI)

> Chaque persona est un **Model** Open WebUI posé **au-dessus d'un base model** (champ
> `base_model_id`). On choisit le base model adapté au rôle. Principe iakaframe : **local pour le
> volume, cloud pour le raisonnement critique**. Les `base_model_id` ci-dessous supposent des
> modèles **Ollama** servis à Open WebUI (ou un fournisseur OpenAI-compatible/LiteLLM). Tags à
> adapter à ta VRAM. Cohérent avec `kit-ollama/MODELES.md`.

| Persona | Rôle / phase | `base_model_id` recommandé (Ollama) | Alternatives / cloud | Note |
|---|---|---|---|---|
| 🦅 Odin | portefeuille / raisonnement | `qwen3:latest` | meilleur raisonnement de l'abo cloud | Vue d'ensemble multi-projets. |
| 🛡️ Aragorn | coordination | `qwen3:latest` | mistral, gpt-oss | Découpe et séquence. |
| 🧙 Gandalf | cadrage / archi | `deepseek-r1:latest` | qwen3, gpt-oss, kimi / cloud raisonnement | Le cadrage conditionne tout. |
| ⚒️ Gimli | dev / devops | `qwen2.5-coder:latest` | deepseek-coder, codestral / Codex-GPT | Gros volume de code : local OK. |
| 🏹 Legolas | qualité / tests | `qwen2.5-coder:latest` (**≠ celui de Gimli**) | deepseek-coder / cloud si revue sensible | Gate indépendant. |
| ⛴️ Charon | prod / bascule (**sur ordre**) | `llama3.1:latest` | qwen3, mistral / cloud fiable | Priorité fiabilité. |
| 🌉 Helm | prod / veille (**sans ordre**) | `llama3.1:latest` | qwen3, mistral / cloud fiable | Hérité de la bascule à la scission — **NON MESURÉ** sur une tâche de veille. |
| 🎭 Loki | design / vision | `qwen2.5-vl:latest` | llava / GPT multimodal | Le multimodal aide sur l'UI. |
| 📖 Nathalie | guides / rédaction | `mistral:latest` | qwen3, llama3.1 | Tâche linguistique (FR). |

> Les `models/*.json` du kit portent déjà ces `base_model_id` par défaut. **Au moment de
> l'import**, si le tag exact n'existe pas dans ton Open WebUI (modèle non `pull`é, ou nommé
> autrement par ton fournisseur), choisis le base model équivalent dans le sélecteur de l'écran
> d'édition du Model (cf. `README.md`, étape 3).

## Brancher les base models dans Open WebUI

1. **Connexion fournisseur** : *Admin Settings > Connections* → ajouter **Ollama**
   (`http://<box>:11434`) et/ou une connexion **OpenAI-compatible** (LiteLLM,
   `http://<box>:<port>/v1`). Les modèles `pull`és apparaissent alors comme **base models**.
2. **Vérifier les ids** : *Admin Settings > Models* liste les base models disponibles avec leur
   id exact (c'est cet id qui doit figurer dans `base_model_id`).

## Principe

- **Local pour le volume, cloud pour le raisonnement critique.** Cadrage et revue (Gandalf,
  Legolas) là où le raisonnement compte → cloud ou gros modèle. Écriture de code en volume
  (Gimli) → local, gratuit et privé.
- **Repère VRAM** (ex. RTX 3060, 12 Go) : un **7B** q4 tourne confortablement ; un **14B** q4
  passe mais serré ; au-delà → cloud.
- **Legolas ≠ Gimli** : la revue ne réutilise jamais le base model qui a écrit le code (gate
  indépendant).
- **Changer de base model selon la tâche fait partie du rôle.**

## Note

- **Pas de box / pas de modèles locaux ?** Pointe le `base_model_id` sur un modèle cloud
  disponible via ta connexion OpenAI-compatible ; le multi-modèle est une **optimisation**, pas
  une obligation.
- **Abonnement grand public ≠ clé API** : Open WebUI se branche sur l'**API** (facturée au token)
  ou sur un fournisseur **local** (Ollama/LiteLLM), pas sur un abo chat grand public.
