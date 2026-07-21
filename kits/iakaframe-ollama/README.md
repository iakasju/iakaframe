# kit-ollama — iakaframe sur modèles locaux (Ollama)

> Incarnation **ollama** de iakaframe **v0.6.0**, pour qui n'a **ni Claude ni ChatGPT**. Les
> agents tournent sur des **modèles locaux (Ollama)** via un **outil agentique open** (Aider,
> Continue, Cline, opencode…) pointé sur Ollama. Même méthode ; le contrat est `AGENTS.md` et
> les rôles sont des **personas** servis par le modèle adapté.

## Contenu

```
kit-ollama/
├── AGENTS.md                       ← contrat (rôles + phases + table modèle↔agent)
├── MODELES.md                      ← quel modèle pour quel agent + `ollama pull`
└── specs/
    ├── PROJET.md
    └── instructions/_TEMPLATE.md
```

## Installation

1. Avoir **Ollama** lancé (`iakaframe services` pour vérifier) et un **outil agentique**
   pointé dessus.
2. Copier `AGENTS.md` + `MODELES.md` + `specs/` à la racine du repo.
3. `ollama pull` les modèles voulus (cf. `MODELES.md` ; état réel via
   `ollama list`).
4. Remplir `specs/PROJET.md` ; cadrer chaque feature dans `specs/instructions/` **avant** de coder.

## Déploiement par l'onboard

`iakaframe init --path <projet> --node ollama-localhost`
(ou via `iakaframe onboard --node ollama-localhost`). Marqueur `.iakaframe` (version + cible) posé.

## Différences

| | Claude | Codex | **Ollama (ce kit)** |
|---|---|---|---|
| Contrat | `CLAUDE.md` | `AGENTS.md` | **`AGENTS.md` + `MODELES.md`** |
| Moteur | Anthropic | OpenAI | **modèles locaux Ollama** |
| Agents | subagents + skills | personas | **personas + modèle par rôle** |
| Coût | abo Anthropic | abo/API OpenAI | **gratuit/local** (matériel) |

## iakaIDE

Comme pour Codex : **annoncé pour plus tard** (orienté Claude aujourd'hui). Le kit donne la
méthode complète tout de suite.
