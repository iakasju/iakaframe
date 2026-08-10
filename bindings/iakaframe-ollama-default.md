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
  - { personaId: gimli,    runner: ollama-distant, model: "qwen2.5-coder:14b" }
  - { personaId: legolas,  runner: ollama-distant, model: "qwen2.5-coder:14b" }
  - { personaId: charon,   runner: ollama-distant, model: "qwen3.5:9b" }
  - { personaId: helm,     runner: ollama-distant, model: "qwen3.5:9b" }
  - { personaId: loki,     runner: ollama-distant, model: "qwen3.5:9b", tools: [comfyui-local] }
  - { personaId: nathalie, runner: ollama-distant, model: "gemma4:e4b" }
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
| portefeuille · coordination · deploiement · **surveillance** · design | Odin · Aragorn · **Charon** · **Helm** · Loki | `qwen3.5:9b` | outils + raisonnement, et **vision** pour le design |
| cadrage · frame · documentation | Gandalf · Fëanor · Nathalie | `gemma4:e4b` | **le meilleur du parc au banc d'essai** (cf. ci-dessous) |
| dev · qualite | Gimli · Legolas | `qwen2.5-coder:14b` | **le plus régulier au banc semver** : 11/12 sur 3 runs, contre 9-10 pour le 7B |

> ⚠️ **`surveillance` est le seul rôle de cette table dont la suggestion n'est pas MESURÉE.** Elle
> est **héritée** de `deploiement` à la scission du squad prod du 2026-08-08, sans banc d'essai sur
> une tâche de veille. La mention vit à la source (`models/suggestions.json`, champ `why`) ; elle
> est reprise ici pour qu'aucun lecteur de ce seul tableau ne la prenne pour un résultat.

## Trois faits d'usage, pas des détails

- **Le poste documentation a été corrigé DEUX FOIS le même jour (2026-08-03)** — et la seconde
  fois parce que la première mesure était **trop étroite**. Il portait `mistral`, choisi sur sa
  taille sans aucune observation ; un duel mistral/qwen3.5 l'a fait basculer sur `qwen3.5`
  — mais gemma4 n'avait pas été testé sur cette tâche. **Banc complet sur les 7 modèles du parc**,
  même consigne (« 150 mots maximum, ne recopie pas les options ») :

  | modèle | durée | mots | limite | recopie les options |
  |---|---|---|---|---|
  | **gemma4:e4b** | **4,7 s** | 138 | tenue | non |
  | qwen3.5:9b | 25 s | 182 | dépassée | non |
  | mistral:7b | 39 s | 321 | dépassée | **oui** |

  *Le plus gros modèle du parc est aussi le plus rapide et le plus docile.* **Bonus opérationnel** :
  il sert déjà `cadrage` et `frame`, donc **un seul modèle reste chargé** dans une VRAM partagée
  au lieu de deux. **Leçon de méthode** : corriger une intuition par une mesure partielle ne
  produit pas une conclusion, mais une autre intuition.
- **`gemma4` et `qwen3.5` sont des modèles *thinking*, et augmenter le budget ne suffit pas.**
  Mesuré : 4000 tokens accordés, **2193 mots de raisonnement, zéro mot de réponse**. La parade est
  **`think: false`**, à envoyer **explicitement**. *Rectification du 2026-08-03 : une version
  antérieure de cette note accusait la passerelle de ne pas transmettre le paramètre — c'est
  **faux**, test de contrôle à l'appui (avec : 1,9 s / 37 mots ; sans : 0 mot). Le facteur est le
  paramètre, pas le chemin.* Ce binding cible `ollama-distant` par simple proximité du parc, **pas**
  parce que la passerelle serait déficiente : les deux voies conviennent.
- **Un seul GPU, partagé.** Ces dix affectations ne s'exécutent pas en parallèle : les modèles
  se chargent et se déchargent (~30-50 s à froid, ~10 s à chaud), et le GPU peut servir ailleurs.
  *Une équipe de 10 personas en local, c'est de la sérialisation, pas du parallélisme.*

## `tools` : ce qui n'a pas été recopié

Le binding défaut porte des allowlists d'outils **Claude Code** (`Read`, `Grep`, `Bash`…). Ces
ids **n'ont aucun sens hors de ce runner** : les recopier ici aurait produit un contrat faux mais
d'apparence complète. `tools` est donc **omis**, sauf pour Loki (`comfyui-local`, seul id du
registre canonique et pertinent pour un poste de design). *Un champ absent est plus honnête qu'un
champ plausible.*
