---
id: iakaframe-ollama-default
methodId: iakaframe
teamId: iakaframe-8
node: ollama-lan
origin: forge-ollama
assignments:
  - { personaId: odin,     runner: ollama-distant, model: "qwen3.5:9b" }
  - { personaId: aragorn,  runner: ollama-distant, model: "qwen3.5:9b" }
  - { personaId: gandalf,  runner: ollama-distant, model: "gemma4:e4b" }
  - { personaId: gimli,    runner: ollama-distant, model: "qwen2.5-coder:7b" }
  - { personaId: legolas,  runner: ollama-distant, model: "qwen2.5-coder:7b" }
  - { personaId: helm,     runner: ollama-distant, model: "qwen3.5:9b" }
  - { personaId: loki,     runner: ollama-distant, model: "qwen3.5:9b", tools: [comfyui-local] }
  - { personaId: nathalie, runner: ollama-distant, model: "mistral:7b-instruct-q4_K_M" }
  - { personaId: feanor,   runner: ollama-distant, model: "gemma4:e4b" }
---
# Binding iakaframe — cible Ollama (modèles locaux)

Appariement **méthode ↔ team** sur des **modèles locaux**, en regard du binding défaut
`iakaframe-claude-default`. Même méthode, même casting : **seul le triplet
`{runner, model, tools}` change** (I3 : le binding est le SEUL endroit où ces trois valeurs
vivent ; les personas de `library/personas/` restent pures).

**Ce binding n'est PAS actif par défaut.** Il existe pour être choisi — `iakaframe models
--binding iakaframe-ollama-default` le lit, et le pointeur de frame reste une propriété du
projet. Le binding par défaut (`origin: forge-default`) demeure `iakaframe-claude-default`.

## D'où viennent ces modèles

Les affectations **dérivent de la source unique** `models/suggestions.json` (suggestions par
`roleKey`), projetée sur le casting `iakaframe-8` (`roleKey` → persona). Toute mise à jour se
fait **dans la source**, puis se rejoue ici — jamais l'inverse.

| roleKey | persona | modèle | pourquoi |
|---|---|---|---|
| portefeuille · coordination · deploiement · design | Odin · Aragorn · Helm · Loki | `qwen3.5:9b` | outils + raisonnement, et **vision** pour le design |
| cadrage · frame | Gandalf · Fëanor | `gemma4:e4b` | le plus gros du parc : le raisonnement paie le plus à ces postes |
| dev · qualite | Gimli · Legolas | `qwen2.5-coder:7b` | seul modèle de code dédié du parc (complétion `insert`) |
| documentation | Nathalie | `mistral:7b-instruct-q4_K_M` | rédaction suivie, sans outils : le plus léger suffit et libère le GPU |

## Trois faits d'usage, pas des détails

- **Nathalie est le seul poste sans tool-calling.** `mistral:7b-instruct-q4_K_M` ne porte que la
  complétion. C'est **délibéré** (rédaction pure) : ne pas lui confier un geste qui appelle des
  outils, et ne pas « corriger » ce choix sans changer aussi le modèle.
- **`gemma4` et `qwen3.5` sont des modèles *thinking*.** Avec un budget de tokens serré, la
  réponse revient **vide** — tout part dans `reasoning_content`. Prévoir **≥ 300 tokens**, sinon
  un modèle sain se lit comme une panne.
- **Un seul GPU, partagé.** Ces neuf affectations ne s'exécutent pas en parallèle : les modèles
  se chargent et se déchargent (~30-50 s à froid, ~10 s à chaud), et le GPU peut servir ailleurs.
  *Une équipe de 9 personas en local, c'est de la sérialisation, pas du parallélisme.*

## `tools` : ce qui n'a pas été recopié

Le binding défaut porte des allowlists d'outils **Claude Code** (`Read`, `Grep`, `Bash`…). Ces
ids **n'ont aucun sens hors de ce runner** : les recopier ici aurait produit un contrat faux mais
d'apparence complète. `tools` est donc **omis**, sauf pour Loki (`comfyui-local`, seul id du
registre canonique et pertinent pour un poste de design). *Un champ absent est plus honnête qu'un
champ plausible.*
