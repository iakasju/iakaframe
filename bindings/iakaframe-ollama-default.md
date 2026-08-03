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
  - { personaId: nathalie, runner: ollama-distant, model: "qwen3.5:9b" }
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
| documentation | Nathalie | `qwen3.5:9b` | **corrigé après mesure** (cf. ci-dessous) |

## Trois faits d'usage, pas des détails

- **Le poste documentation a été corrigé APRÈS MESURE (2026-08-03), pas au jugé.** Il portait
  `mistral:7b-instruct-q4_K_M`, choisi pour sa légèreté. Test réel — même tâche de rédaction,
  même chemin, même consigne (« 150 mots maximum, ne recopie pas les options ») : **qwen3.5 rend
  163 mots en 6 s** ; **mistral rend 279 mots en 19 s et recopie la liste des options malgré
  l'interdiction**. *Le plus léger n'était ni le plus rapide ni le plus docile.* mistral reste en
  alternative — c'est le seul modèle **sans raisonnement** du parc, donc le seul directement
  exploitable **via la passerelle** (cf. point suivant).
- **`gemma4` et `qwen3.5` sont des modèles *thinking*, et augmenter le budget ne suffit pas.**
  Mesuré : 4000 tokens accordés, **2193 mots de raisonnement, zéro mot de réponse**. La parade est
  **`think: false`**, à envoyer **explicitement**. *Rectification du 2026-08-03 : une version
  antérieure de cette note accusait la passerelle de ne pas transmettre le paramètre — c'est
  **faux**, test de contrôle à l'appui (avec : 1,9 s / 37 mots ; sans : 0 mot). Le facteur est le
  paramètre, pas le chemin.* Ce binding cible `ollama-distant` par simple proximité du parc, **pas**
  parce que la passerelle serait déficiente : les deux voies conviennent.
- **Un seul GPU, partagé.** Ces neuf affectations ne s'exécutent pas en parallèle : les modèles
  se chargent et se déchargent (~30-50 s à froid, ~10 s à chaud), et le GPU peut servir ailleurs.
  *Une équipe de 9 personas en local, c'est de la sérialisation, pas du parallélisme.*

## `tools` : ce qui n'a pas été recopié

Le binding défaut porte des allowlists d'outils **Claude Code** (`Read`, `Grep`, `Bash`…). Ces
ids **n'ont aucun sens hors de ce runner** : les recopier ici aurait produit un contrat faux mais
d'apparence complète. `tools` est donc **omis**, sauf pour Loki (`comfyui-local`, seul id du
registre canonique et pertinent pour un poste de design). *Un champ absent est plus honnête qu'un
champ plausible.*
