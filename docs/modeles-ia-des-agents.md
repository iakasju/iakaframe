# Quels modèles d'IA font tourner les agents

> **Fichier généré — ne pas modifier à la main.**
> Source : `models/suggestions.json` + `bindings/*.md` + `library/personas/*.md`.
> Régénérer : `node cli/scripts/gen-models-doc.mjs`. Un test vérifie qu'il est à jour.

Chaque agent de l'équipe travaille avec **un modèle d'IA**. Ce document dit lequel, pourquoi,
et comment en changer. Il ne parle pas de code : uniquement de ce que vous voyez et décidez.

## L'équipe et ses modèles

Deux configurations coexistent. Elles portent **la même équipe** et **les mêmes rôles** —
seul le moteur change. Aucune n'est imposée : on choisit celle qu'on veut utiliser.

| Agent | Rôle | Sur Claude *(par défaut)* | En local *(Ollama)* |
|---|---|---|---|
| 🟡 Odin | `portefeuille` | `opus` | `qwen3.5:9b` |
| 🟠 Aragorn | `coordination` | `opus` | `qwen3.5:9b` |
| 🔵 Gandalf | `cadrage` | `opus` | `gemma4:e4b` |
| 🔴 Gimli | `dev` | `sonnet` | `qwen2.5-coder:14b` |
| 🔴 Legolas | `qualite` | `sonnet` | `qwen2.5-coder:14b` |
| 🟣 Helm | `deploiement` | `sonnet` | `qwen3.5:9b` |
| 🟠 Loki | `design` | `sonnet` | `qwen3.5:9b` |
| 🟠 Nathalie | `documentation` | `sonnet` | `gemma4:e4b` |
| 🟠 Fëanor | `frame` | `opus` | `gemma4:e4b` |

## Pourquoi ces modèles-là

Ces choix ne sont pas des préférences : ils viennent de **mesures faites sur nos propres
tâches**. Un modèle plus gros s'est révélé plus rapide et plus docile qu'un plus petit ;
une suggestion a dû être corrigée deux fois le même jour parce que la première mesure était
trop étroite.

| Rôle | Modèle local retenu | Motif |
|---|---|---|
| `portefeuille` | `qwen3.5:9b` *(~6.6 Go)* | Arbitrage transverse : a besoin d'outils et de raisonnement, pas de vision. |
| `coordination` | `qwen3.5:9b` *(~6.6 Go)* | Dispatch et suivi : appelle des outils, doit tenir un fil long. |
| `cadrage` | `gemma4:e4b` *(~9.6 Go)* | Le plus gros modele du parc. EPROUVE le 2026-08-03 sur une vraie tache de cadrage (epingler une image sur son digest) : structure tenue, AUCUN fait invente (digest repris exactement), et de […] |
| `dev` | `qwen2.5-coder:14b` *(~9 Go)* | Modele de code dedie, le seul du parc a porter la completion de code (insert). CORRIGE LE 2026-08-05 APRES MESURE DE VARIANCE — et cette correction annule celle de la veille, qui reposait […] |
| `qualite` | `qwen2.5-coder:14b` *(~9 Go)* | Lit du code et des traces de test : meme profil que dev, jamais la meme instance. CORRIGE LE 2026-08-05 APRES MESURE DE VARIANCE — et cette correction annule celle de la veille, qui reposait […] |
| `deploiement` | `qwen3.5:9b` *(~6.6 Go)* | Ops : enchaine des appels d'outils. mistral:7b est ECARTE ici — il ne porte PAS le tool-calling. |
| `design` | `qwen3.5:9b` *(~6.6 Go)* | Seul poste ou la vision est requise (lecture de maquettes). qwen3-vl-4b = repli leger 3,3 Go. |
| `documentation` | `gemma4:e4b` *(~9.6 Go)* | CORRIGE DEUX FOIS LE MEME JOUR (2026-08-03), et la seconde fois parce que la premiere mesure etait TROP ETROITE. (1) Suggestion d'origine : mistral, choisi sur sa taille, sans aucune […] |
| `frame` | `gemma4:e4b` *(~9.6 Go)* | Erudition du modele de frame : meme profil de raisonnement que le cadrage. |

**Embedding** : `nomic-embed-text` (768 dimensions) — Seul modele d'embedding du parc ; expose aussi sous les alias OpenAI de la passerelle.

## Quelles familles de modèles la passerelle sait servir

*Vérifié le 2026-08-04 — Chaque famille servie a ete verifiee par un APPEL REEL a travers la passerelle, pas par la presence d'une ligne au catalogue.*

| Famille | Servie ? | Ce qu'il faut savoir |
|---|---|---|
| **Gemma** | ✅ | gemma4:e4b (9,6 Go) — tools + thinking. Meilleur du parc au banc d'essai. |
| **Qwen** | ✅ | qwen3.5:9b (6,6 Go, vision+tools+thinking) et qwen2.5-coder:7b (4,7 Go, code). |
| **DeepSeek** | ✅ | deepseek-r1:8b (5,2 Go) — distill Llama 8B. PAS de tool-calling. Emet son raisonnement MEME avec `think: false` (c'est son template) : prevoir un budget large. Ajoute et eprouve le 2026-08-04. |
| **GLM** | ✅ | glm4:9b (5,5 Go, contexte 128K) — PAS de tool-calling, PAS de raisonnement. Le plus rapide des quatre a repondre. POURQUOI PAS GLM-5.x : verifie au registre Ollama le 2026-08-04, manifeste par manifeste, pas suppose. `glm-5.1` -> MANIFEST_UNKNOWN (aucun poids local, cloud-only) ; `glm-5.2` -> cloud-only aussi (MoE 744B, ~223 Go meme en 1-bit, aucun GPU seul ne le fait tourner) ; `glm-4.7-flash` -> local mais 19,0 Go de poids, soit au-dessus des 12 Go de la carte : il ne tiendrait qu'en debordant sur le CPU (-70 a -80 % de vitesse). `glm4:9b` n'est donc pas un choix par defaut, c'est LE SEUL GLM executable sur ce materiel. |
| **Kimi** | ❌ | IMPOSSIBLE EN LOCAL, et ce n'est pas une question de reglage : Kimi K2 est un MoE de 1000 milliards de parametres (~600 Go en Q4, ~250 Go meme en 1-bit). Ollama ne le distribue QU'EN TAG `:cloud` (kimi-k2.6:cloud) — il n'existe aucun poids local a tirer, quelle que soit la carte. Deux voies possibles, TOUTES DEUX distantes et payantes, a arbitrer par le decideur : (a) API Moonshot via LiteLLM (`moonshot/...` + cle), (b) Ollama Cloud (`:cloud` + compte). Servir Kimi signifie donc sortir du self-hosted — arbitrage, pas detail technique. |
| **GLM-5.x** | ❌ | Meme mur que Kimi, pour la meme raison : les flagships recents sont des MoE que le registre Ollama ne distribue qu'en `:cloud`. Servir GLM-5.x demanderait la voie distante (Ollama Cloud ou API Z.ai) — arbitrage du decideur, pas tache d'execution. La famille GLM reste servie en local par `glm4:9b`. |

## Voir où en est votre installation

```
iakaframe models
```

La commande affiche, rôle par rôle : le modèle **affecté**, le modèle **suggéré**, et un statut.

| Statut | Ce que ça veut dire |
|---|---|
| `en-place` | le modèle suggéré est affecté **et** réellement disponible |
| `disponible` | le modèle est là, mais un autre est affecté |
| `a-installer` | le modèle suggéré n'est présent sur aucune cible |
| `indetermine` | aucune cible n'a répondu : la disponibilité est **inconnue**, pas supposée |
| `non-couvert` | ce rôle n'a aucun agent |
| `sans-suggestion` | ce rôle n'a pas de modèle recommandé dans la source |

Elle propose ensuite d'installer, de remplacer ou de retirer. **Rien n'est téléchargé ni écrit
sans une confirmation explicite** : vous pouvez la lancer par simple curiosité.

Cinq cibles sont mesurées : `ollama-local`, `ollama-distant`, `litellm`, `claude`, `codex`.
Pour les deux dernières, « installer » signifie **vérifier** — il n'y a rien à télécharger.

## Trois pièges mesurés, à connaître avant de conclure à une panne

- Modeles *thinking* (gemma4, qwen3.5) : avec un budget de tokens serre, `content` revient VIDE (tout part dans `reasoning_content`). Prevoir >= 300 tokens pour toute verification, sinon un modele sain se lit comme un echec.
- MESURE DU 2026-08-03, plus dure que la note ci-dessus : augmenter le budget NE SUFFIT PAS. Sur une tache de redaction, qwen3.5 a consomme 4000 tokens (2193 mots de raisonnement) et rendu ZERO mot de reponse. La vraie parade est `think: false` — avec elle, le MEME modele rend un guide complet en 6 s.
- LE RAISONNEMENT N'A PAS PROUVE SA VALEUR SUR NOS TACHES (mesure du 2026-08-03, meme modele, meme prompt, meme tache de cadrage) : AVEC raisonnement = 64 s, 485 mots de reflexion, reponse en depassement (511 mots pour 400 demandes) ; SANS raisonnement (`think: false`) = 13 s et 380 mots, limite RESPECTEE, meme qualite de fond. 5x plus rapide et plus docile. Par defaut, appeler `think: false` — y compris sur les postes de raisonnement — et ne rallumer le thinking que si une tache prouve qu'elle y gagne.
- CORRIGE LE 2026-08-03 (une note precedente affirmait le contraire, a tort) : la passerelle LiteLLM 1.82.6 TRANSMET BIEN `think: false`. Test de controle, meme modele, meme prompt, meme voie : AVEC le parametre = 1,9 s et 37 mots ; SANS = 13,2 s, 366 mots de raisonnement et ZERO mot de reponse. Le facteur n'est donc PAS le chemin (passerelle vs direct) mais le PARAMETRE : il faut l'envoyer, explicitement, quelle que soit la voie. La conclusion pratique ne change pas — `think: false` par defaut — mais son motif si : ne pas eviter la passerelle pour cette raison.
- mistral:7b-instruct-q4_K_M ne porte PAS le tool-calling (capabilities: completion seule) : ne jamais le suggerer pour un roleKey qui appelle des outils.
- Cout de chargement : ~30-50 s a froid (VRAM), ~10 s a chaud. Le GPU peut etre partage avec un service d'image : ne pas eprouver plusieurs modeles en parallele.

## La contrainte matérielle

- **Carte** : NVIDIA GeForce RTX 3060, 12 Go de VRAM (mesure du 2026-08-03)
- **Partage** : GPU PARTAGE avec un service de generation d'image (idle a ~0,1 Go, mais plusieurs Go en generation).
- **Plafond** : Q4_K_M jusqu'a ~14B tient sur cette carte ; au-dela, quantization plus agressive ou deport CPU (-70 a -80 % de vitesse). Le parc actuel (3,3 a 9,6 Go) est DEJA a l'optimum de cette carte : les modeles superieurs recommandes par la veille (qwen3-coder:30b ~19 Go) NE TIENNENT PAS.
- **Arbitrage** : gemma4:e4b (9,6 Go) tient seul, mais ne laisse presque rien au service d'image. Faire tourner un agent PENDANT une generation impose de choisir : `ollama stop` avant generation, ou un modele plus petit.

## Veille — état de l'art au 2026-08-03

*Méthode : Recherche web (etat de l'art 2026) CONFRONTEE a nos propres mesures. En cas de desaccord, nos mesures priment : elles portent sur NOS taches et NOTRE materiel.*

- CONFIRME — qwen2.5-coder:7b est le consensus 2026 pour le code en 7B (Ollama). Notre choix pour `dev` et `qualite` est aligne sur l'etat de l'art, sans changement.
- EXPLIQUE NOTRE MESURE — Qwen3.5 est meilleur QUE SUR LE PAPIER : il mene SWE-bench / Terminal-Bench / TAU2 a PLEINE PRECISION, mais il est decrit comme 'flaky under quantization', la ou Gemma 4 reste consistant. Notre parc est en Q4_K_M : les classements pleine precision NE S'APPLIQUENT PAS a notre installation. C'est la cause probable de ce que nous avons mesure (gemma4 plus rapide ET plus docile que qwen3.5 sur nos deux taches).
- A ARBITRER — l'etat de l'art place BGE-M3 et Qwen3-Embedding devant nomic-embed-text pour la recherche multilingue/hybride, mais nomic reste juge solide sur materiel modeste (contexte 8192). Aucun changement propose sans un besoin RAG reel : on ne tire pas un modele pour un usage qui n'existe pas encore.
- SANS OBJET POUR NOUS — les meilleurs modeles de code 2026 (qwen3-coder:30b, gemma4 26B-A4B) depassent la VRAM disponible. La veille est lue a travers la contrainte materielle, sinon elle recommande l'inaccessible.
- CLASSEMENT DE L'ARENE, CONFRONTE (2026-08-04, objectif coding) — le sommet est hors de portee : Kimi K3 mene le Frontend Code Arena (1679 Elo) avec 2 800 milliards de parametres ; GLM-5 mene chez les open-weights ; le meilleur open-weight n'est plus qu'a ~55 points Elo du meilleur modele proprietaire. Seule la categorie « sous 14B » nous concerne, et elle designait qwen2.5-coder:14b et phi-4:14b. VERDICT APRES MESURE : notre qwen2.5-coder:7b les egale ou les bat, deux fois plus vite. Un classement Elo mesure des preferences humaines sur des conversations, souvent sur des modeles qu'on ne peut pas faire tourner : il oriente la recherche, il ne decide pas a la place d'un banc execute.
- gemma4:e4b ECARTE des alternatives de `dev` et `qualite` (il y figurait sans mesure) : 7/10 au banc 1, contre 10/10 pour les modeles de code. Il domine notre banc de REDACTION, il n'est pas un modele de code — les deux ne se deduisent pas l'un de l'autre.
- PROTOCOLE — un run par modele NE CLASSE PAS. Ces modeles sont non deterministes meme a temperature 0.1 : sur le banc semver, le meme modele rate des cas differents d'une execution a l'autre. Constate a mes depens : une conclusion publiee le 2026-08-04 a du etre annulee le lendemain. Regle desormais : au moins 3 runs, et on regarde la DISPERSION autant que le score. Un modele regulier a 11/12 vaut mieux qu'un modele qui oscille entre 9 et 12.

---

*Suggestions v1, mises à jour le 2026-08-03. La fraîcheur est affichée à
chaque lancement de `iakaframe models` ; au-delà de 90 jours, elle est signalée `A RAFRAICHIR`.*
