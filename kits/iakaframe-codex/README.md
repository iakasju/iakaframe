# kit-codex — iakaframe pour Codex (OpenAI)

> Incarnation **Codex** de la méthode iakaframe **v0.6.0**. À transmettre à quelqu'un qui code
> avec **ChatGPT/Codex** plutôt qu'avec Claude Code. La méthode est identique ; seuls le
> **contrat** change (`AGENTS.md` au lieu de `CLAUDE.md`) et le roster devient des **personas**.

## Contenu

```
kit-codex/
├── AGENTS.md                       ← contrat lu par Codex (à copier à la racine du repo)
├── MODELES.md                      ← modèle par persona (cloud abo / local Ollama) + multi-modèle
└── specs/
    ├── PROJET.md                   ← gabarit vision/specs
    └── instructions/_TEMPLATE.md   ← gabarit d'instruction (cadrage avant code)
```

## Installation (chez ton ami)

1. **Copier le contenu de `kit-codex/` à la racine du repo** : `AGENTS.md` + `MODELES.md` +
   `specs/`. Codex lit `AGENTS.md` automatiquement à chaque session.
2. Remplir `specs/PROJET.md` (vision) ; pour chaque feature, écrire
   `specs/instructions/<feature>.md` **avant** de coder (gabarit `_TEMPLATE.md`).
3. (Optionnel) configurer le **multi-modèle** : un profil Codex par persona pointé sur la box
   (LiteLLM → Ollama), cf. `MODELES.md`.
4. (Optionnel) récupérer **`methode-de-travail.md`** pour la référence complète, et les
   la **CLI** iakaframe (`iakaframe snapshot` / `iakaframe update` / `iakaframe onboard`)
   — **agnostique de l'agent** : elle gère git/Forgejo/états des
   lieux quel que soit l'outil IA.

## Déploiement par l'onboard

`iakaframe init --path <projet> --node codex`
(ou via `iakaframe onboard --node codex`). Copie ce kit (hors README) et pose le marqueur
`.iakaframe` (version + cible).

## Différences vs autres incarnations

| | Claude Code | **Codex (ce kit)** | Ollama |
|---|---|---|---|
| Contrat projet | `CLAUDE.md` | **`AGENTS.md` + `MODELES.md`** | `AGENTS.md` + `MODELES.md` |
| Agents | subagents + skills dispatchables | **personas** (un rôle à la fois) | personas + modèle par rôle |
| Moteur | Anthropic | **abo ChatGPT / API OpenAI** (+ local optionnel) | modèles locaux Ollama |
| Méthode (3 phases, cadrage, états des lieux, Forgejo) | identique | **identique** | identique |

## Multi-modèle (optionnel mais recommandé)

Tu peux faire tourner **certains personas en local** : Codex vise un fournisseur compatible
OpenAI (LiteLLM → Ollama) et tu crées **un profil par persona** (`codex --profile gimli`). Idée
directrice : **local pour le volume de code, cloud pour le raisonnement critique**. Détail et
exemple de `~/.codex/config.toml` dans `MODELES.md`.

## iakaIDE — à venir pour Codex

**iakaIDE** (l'app desktop portefeuille) est pour l'instant **orientée Claude** (elle lit
`.claude/agents`, etc.). Une incarnation **Codex** est **annoncée pour plus tard** : avec ce kit,
ton ami a déjà la **méthode complète** ; iakaIDE viendra ensuite.

## Prérequis côté infra (à vérifier)

- **Service git** (Forgejo recommandé, self-hosted) — sinon git local + remote plus tard.
- **(Optionnel) Ollama + LiteLLM** locaux si on veut du multi-modèle / de l'IA self-hosted.
- L'**onboarding versionné** d'iakaframe détecte ces services et propose des options à
  l'installation.
