# kit-codex — iakaframe pour Codex (OpenAI)

> Incarnation **Codex** de la méthode iakaframe **v0.5.2**. À transmettre à quelqu'un qui code
> avec **ChatGPT/Codex** plutôt qu'avec Claude Code. La méthode est identique ; seul le
> **contrat** change (`AGENTS.md` au lieu de `CLAUDE.md`) et le roster devient des **personas**.

## Contenu

```
kit-codex/
├── AGENTS.md                       ← contrat lu par Codex (à copier à la racine du repo)
└── specs/
    ├── PROJET.md                   ← gabarit vision/specs
    └── instructions/_TEMPLATE.md   ← gabarit d'instruction (cadrage avant code)
```

## Installation (chez ton ami)

1. **Copier le contenu de `kit-codex/` à la racine du repo** : `AGENTS.md` + `specs/`.
   Codex lit `AGENTS.md` automatiquement à chaque session.
2. Remplir `specs/PROJET.md` (vision) ; pour chaque feature, écrire
   `specs/instructions/<feature>.md` **avant** de coder (gabarit `_TEMPLATE.md`).
3. (Optionnel) récupérer **`methode-de-travail.md`** pour la référence complète, et les
   **scripts PowerShell** iakaframe (`iakaframe-snapshot.ps1` / `iakaframe-update.ps1` /
   `iakaframe-forgejo.ps1`) — **agnostiques de l'agent** : ils gèrent git/Forgejo/états des
   lieux quel que soit l'outil IA.

## Différences vs incarnation Claude

| | Claude Code | Codex (ce kit) |
|---|---|---|
| Contrat projet | `CLAUDE.md` | **`AGENTS.md`** |
| Agents | subagents + skills dispatchables | **personas** décrits dans `AGENTS.md` (un rôle à la fois) |
| Coût | abonnement/auth Anthropic | abonnement ChatGPT / API OpenAI |
| Méthode (3 phases, cadrage, états des lieux, Forgejo) | identique | **identique** |

## Prérequis côté infra (à vérifier)

- **Service git** (Forgejo recommandé, self-hosted) — sinon git local + remote plus tard.
- **(Optionnel) Ollama / ComfyUI** locaux si on veut de l'IA / des images self-hosted.
- L'**onboarding versionné** d'iakaframe (à venir) détectera ces services et proposera des
  options à l'installation.
