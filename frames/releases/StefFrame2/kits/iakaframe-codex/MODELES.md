# MODELES.md — modèles IA par agent (incarnation Codex)

> Quel modèle pour quel agent, en cible **codex**. Deux pistes par rôle : **cloud** (ton
> abonnement ChatGPT, via Codex) et **local** (Ollama servi par une box/LiteLLM, branché en
> fournisseur compatible OpenAI). Tu joues **un persona à la fois** → tu choisis le modèle
> **à l'invocation** (profil Codex). Tags/tailles à adapter à ta VRAM.

| Agent | Rôle / phase | Cloud (abo ChatGPT) | Local (Ollama via box) | Note |
|---|---|---|---|---|
| 🧙 Gandalf | 🔵 cadrage / archi | **conseillé** : meilleur modèle de raisonnement de l'abo | `qwen2.5:14b` | Le cadrage conditionne tout : privilégier la finesse. |
| ⚒️ Gimli | 🔴🟢 dev / devops | Codex / GPT pour les passages durs | **idéal** : `qwen2.5-coder:7b` (`:14b` si VRAM) | Gros volume de code : le local fait très bien le job. |
| 🏹 Legolas | 🔴 qualité / revue / tests | modèle de raisonnement si revue sensible | `qwen2.5-coder:14b` (**≠ Gimli**) | Gate indépendant : ne jamais réutiliser le modèle qui a écrit le code. |
| 🌉 Helm | 🟣 déploiement prod | **conseillé** : modèle fiable | `qwen2.5:14b` | Risque élevé (rollback, prod) : priorité à la fiabilité. |
| 🦅 Odin | 🟡 portefeuille | **conseillé** : meilleur raisonnement | `qwen2.5:14b` | Vue d'ensemble multi-projets : cloud recommandé. |
| 🎭 Loki | 🟠 design on-brand | GPT multimodal (visuel) | `qwen2.5:7b` (ou `qwen2.5-vl`) | Cohérence de charte ; le multimodal aide sur l'UI. |
| 📖 Nathalie | 🟠 guides / docs | optionnel | **suffit** : `qwen2.5:7b` | Tâche surtout linguistique (FR) : le local est assez bon. |

## Principe

- **Local pour le volume, cloud pour le raisonnement critique.** Cadrage et revue (Gandalf,
  Legolas) là où le raisonnement compte → cloud ou gros modèle. Écriture de code en volume
  (Gimli) → local, gratuit et privé.
- **Repère VRAM** (ex. RTX 3060, 12 Go) : un **7B** q4 tourne confortablement ; un **14B** q4
  passe mais serré (un seul à la fois) ; au-delà → cloud. Tâches triviales (renommer,
  reformater) : garder un petit rapide, `llama3.2:3b`.
- **Changer de modèle selon la tâche fait partie du rôle.**

## Multi-modèle dans Codex — profil par persona

Codex sait viser un **fournisseur compatible OpenAI** : on pointe sur un **LiteLLM** (qui
traduit vers Ollama), puis on crée **un profil par persona**. Adapte la syntaxe à ta version de
Codex (`codex --help`) ; le principe ne change pas : *fournisseur = la box, profil = persona*.

```toml
# ~/.codex/config.toml

# 1) Déclarer la box comme fournisseur "façon OpenAI" (via LiteLLM)
[model_providers.local]
name = "votre serveur git (LiteLLM -> Ollama)"
base_url = "http://<box>:<port>/v1"
env_key = "<LLM_API_KEY>"   # clé bidon en local, mais exigée par le protocole

# 2) Un profil par persona : modèle + fournisseur
[profiles.gandalf]            # cadrage/archi : raisonnement -> cloud (ton abo)
model = "gpt-5"               # mets l'id exact dispo dans ton Codex

[profiles.gimli]              # dev : code -> LOCAL sur la box
model = "qwen2.5-coder:7b"
model_provider = "votre serveur git"

[profiles.legolas]           # revue/qualité : un AUTRE modèle que Gimli
model = "qwen2.5-coder:14b"
model_provider = "votre serveur git"
```

```bash
export <LLM_API_KEY>=sk-local-peu-importe   # PowerShell : $env:<LLM_API_KEY>="..."
codex --profile gimli      # je joue Gimli, sur le modèle LOCAL de la box
codex --profile gandalf    # je joue Gandalf, sur le cloud de ton abo
```

## Note

- **Pas de box / pas de modèles locaux ?** Tout peut tourner en **cloud** via ton abo ChatGPT
  (un seul profil suffit). Le multi-modèle est une optimisation, pas une obligation.
- **Abonnement ChatGPT ≠ clé API** : les apps tierces se branchent sur l'**API** (facturée au
  token), pas sur l'abo grand public. Voir le guide de prise en main pour le détail.
