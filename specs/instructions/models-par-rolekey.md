# Instruction — `iakaframe models` : suggestions de modèles d'IA par `roleKey` et mise à disposition interactive

> **Phase cadrage (P1). Statut : 🟡 à valider.** Cadrage pur — **zéro code produit ici**.
> Rédigée le **2026-08-03** par 🦅 Odin (portefeuille) **faute de pouvoir déléguer au cadreur dans
> la session** : entorse assumée à la séparation des périmètres, **signalée au décideur**. À faire
> **relire par le cadreur** et **gater** avant exécution — l'auteur ne valide pas son propre cadrage.
>
> **Remplace** (et ne s'ajoute pas à) : `modeles-suggestion-install.md` et
> `cible-ollama-modeles-agents.md` (tous deux du 2026-06-24). Ces deux fichiers passent en
> **archive** : leur besoin est repris ici, leurs déclarations de livraison sont corrigées (cf. C1).
>
> **Faux ami de vocabulaire** : dans CETTE instruction, « model(s) » désigne **un modèle d'IA**
> (LLM, vision, embedding) — arbitrage explicite du décideur, 2026-08-03. Le mot désigne **aussi**,
> ailleurs dans le canon, un **modèle de frame** (cf. `galerie-models-actionnable.md`). Dette de
> vocabulaire **consignée, non traitée ici** (cf. D1).

---

## Constats mesurés le 2026-08-03 (preuve avant déclaration)

- **C1 — un livrable déclaré ✅ a disparu.** `cible-ollama-modeles-agents.md` déclare livré
  `iakaframe-alternatives.ps1` (état des lieux + suggestions + proposition de `pull`, « lançable
  par Odin »). **Ce fichier n'existe plus dans le dépôt** (recherche sur tout l'arbre, hors
  `node_modules`, sans résultat) — emporté par la bascule PowerShell → CLI Node, sans réouverture
  d'item. *Le présent lot est la reprise cross-OS de ce script perdu, enrichie.*
- **C2 — la table de suggestions existe en trois exemplaires, tous périmés.**
  `kits/iakaframe-ollama/MODELES.md`, `specs/instructions/cible-ollama-modeles-agents.md`, et par
  ricochet le binding `bindings/iakaframe-claude-default.md` (qui cite `kits/*/MODELES.md` comme
  source d'inspiration). Les trois recommandent `qwen3`, `deepseek-r1`, `llama3.1`, `qwen2.5-vl` :
  **aucun n'est présent** sur le parc réel. Seuls `qwen2.5-coder` et `mistral` tombent juste.
- **C3 — parc réel (Ollama de la VM GPU `192.168.2.12:11434`)** : `gemma4:e4b` (9,6 Go, tools +
  thinking), `qwen3.5:9b` (6,6 Go, **vision** + tools + thinking), `qwen2.5-coder:7b` (4,7 Go),
  `mistral:7b-instruct-q4_K_M` (4,4 Go, **completion seule**), `haervwe/qwen3-vl-4b-heretic`
  (3,3 Go, vision), `nomic-embed-text` (0,3 Go, embedding), + 2 variantes *uncensored*.
- **C4 — `roleKey` est canonique et obligatoire.** `library/_schema/frontmatter.json` : type
  `personas` → `required: [id, name, roleKey]` ; type `methods` → `required: [id, workflowId,
  roleKeys]`. Neuf clés côté iakaframe (`cadrage`, `coordination`, `dev`, `qualite`,
  `deploiement`, `design`, `documentation`, `portefeuille`, `frame`) ; les méthodes étrangères
  portent les leurs (`scrum-developers`, `shapeup-programmer`…).
- **C5 — l'affectation effective a déjà un unique porteur.** Le **binding** (I3 : « le SEUL
  endroit où vivent `runner`, `model` et `tools` »), avec des `assignments` indexés par
  **`personaId`**, pas par `roleKey`. Les personas de `library/personas/` restent **pures**.
- **C6 — la sonde d'inventaire existe déjà.** `cli/src/commands/services.js` interroge
  `Ollama /api/tags` sur une liste d'hôtes (`--hosts` CSV, `--json`, `--out`, `--timeout`).
  **À réutiliser, pas à réécrire.** LiteLLM n'y est pas encore sondé.
- **C7 — le schéma de frontmatter est vendoré et verrouillé.** `library/_schema/frontmatter.json`
  est **source unique**, copiée vers le GUI (`packages/core/src/frontmatter-schema.json`) et
  **verrouillée par un test de parité**. Y ajouter un type fait rougir la parité et **ouvre un lot
  GUI**. *Conséquence portée en D2.*
- **C8 — le disque de `.12` n'est pas celui qu'on croit.** `/dev/sda1` = **679 Go, dont 615 Go
  libres** (10 % utilisés) — et **non 8 To**. La politique de rétention du décideur reste
  parfaitement tenable (615 Go ≈ 60 modèles de 10 Go), mais **le chiffre de référence est faux**
  et ne doit pas être propagé.
- **C9 — la passerelle est live et son catalogue vient d'être refait.** LiteLLM `1.82.6` sur
  `http://192.168.2.12:4001/`, **13 entrées** recettées une par une le 2026-08-03, préfixe
  `ollama_chat/` sur les chats, `ollama/` sur l'embedding. Elle devient la **source de vérité du
  parc exposé** pour la cible `litellm lan`.

---

## Besoin (décideur, 2026-08-03)

1. **Tenir à jour périodiquement** un tableau de **suggestions de modèles par `roleKey`**.
2. **`iakaframe models`** = un **process terminal interactif** qui déroule, dans cet ordre :
   (a) **état des lieux** des modèles proposés par `roleKey`, (b) demande si l'utilisateur veut
   **voir les nouvelles suggestions**, (c) choix d'**installer / remplacer** par `roleKey`.
3. **Sur validation de l'utilisateur**, on **installe la mise à disposition** pour la cible
   choisie parmi cinq : **ollama local**, **ollama lan**, **litellm lan**, **claude local**,
   **codex local**.

---

## Décisions d'architecture

### D1 — Nom du verbe : `models`, au sens « modèles d'IA »
Le verbe est **`iakaframe models`** (arbitrage décideur : *« models IA ici »*). Il s'ajoute aux
verbes existants (`services`, `agents`, `skills`, `frame`, `memory`…).
**Dette consignée, hors périmètre de ce lot** : le mot « models » désigne aussi les **modèles de
frame** (galerie GUI). Deux sens coexistent désormais, comme pour « binding ». *À trancher dans un
lot de vocabulaire dédié — ne pas le résoudre ici, et ne pas renommer la galerie en douce.*

### D2 — Une source unique pour les suggestions, hors schéma vendoré
Les suggestions vivent dans **un seul fichier de données** du réservoir :
`models/suggestions.json` (à la racine de `iakaframe`), indexé par `roleKey`, **daté**.
- Il **remplace** les trois copies de C2, qui deviennent des **lecteurs**, jamais des sources.
- **Il n'est PAS un type de `library/`** : ajouter un type au schéma frontmatter ouvrirait un lot
  GUI (C7). *MVP-first ; la promotion en type de bibliothèque reste une évolution possible,
  explicitement différée.*
- Le fichier porte, par `roleKey` : un modèle **recommandé**, des **alternatives**, les
  **capacités requises** (`tools`, `vision`, `thinking`, `embedding`), un **ordre de grandeur**
  de taille, et la **date** + **source** de la dernière veille.

### D3 — Suggérer par `roleKey`, affecter par persona
Deux étages, jamais confondus :
- **Suggestion** = générique et portable, indexée par **`roleKey`** (un tableau qui parle de
  « Gimli » ne sert qu'à iakaframe ; un tableau qui parle de `dev` sert à toutes les frames).
- **Affectation** = écrite dans le **binding**, par **`personaId`** — **I3 n'est pas rouvert**.
`models` lit en haut et écrit en bas, via la projection `roleKey → personas de la team active`.
**Si un `roleKey` porte plusieurs personas**, l'écriture est proposée **pour chacune,
individuellement** (jamais un lot silencieux). **Si un `roleKey` n'a aucune persona**, il est
affiché comme **non couvert** et la règle du canon s'applique (rôle non couvert → coordinateur).

### D4 — Cinq cibles, cinq adaptateurs sous une capacité commune
« Installer la mise à disposition » **n'est pas un geste unique**. Une capacité commune
(`inventorier` / `mettre à disposition` / `retirer`) et **un adaptateur par cible** :

| Cible | Inventaire | « Mettre à disposition » | Retrait |
|---|---|---|---|
| `ollama-local` | `GET /api/tags` sur `localhost:11434` | `POST /api/pull` | `DELETE /api/delete` |
| `ollama-lan` | idem sur l'hôte LAN (`.12`) | idem | idem |
| `litellm-lan` | `GET /v1/models` sur `:4001` | `pull` **puis** entrée dans le catalogue de la passerelle **puis** `restart` | retrait de l'entrée (+ `pull` inverse optionnel) |
| `claude-local` | présence + authentification du CLI | **rien à télécharger** — vérifier la dispo et lister les modèles accessibles | *sans objet* |
| `codex-local` | présence + authentification du CLI | idem | *sans objet* |

**Deux conséquences à ne pas rater** : (a) pour `claude-local`/`codex-local`, l'« install » est une
**vérification**, pas un téléchargement — l'écran doit le dire, sinon l'utilisateur attend un
`pull` qui ne viendra jamais ; (b) `litellm-lan` est le seul cas à **effet de bord sur un service
partagé** (édition de config + redémarrage) → **sauvegarde datée avant écriture obligatoire**, et
périmètre limité au `model_list` (ni ports, ni clé, ni reste de la stack).

### D5 — La veille est un geste explicite, jamais un effet de bord
`iakaframe models` **n'interroge JAMAIS le web** : il lirait un réseau absent et deviendrait non
déterministe (le CLI est zéro-dépendance et doit tourner hors ligne). La table de D2 fait foi,
avec sa **date de fraîcheur affichée à chaque lancement** et un marquage **`À RAFRAÎCHIR`**
au-delà de 90 jours.

**Répartition assumée** — deux gestes distincts, deux porteurs :
- **Le CLI** montre l'écart entre ce qui est **suggéré** et ce qui est **affecté** (le « diff »
  de l'étape 3), et propose d'agir. C'est déterministe, hors ligne, testable.
- **La veille elle-même** (l'état de l'art des modèles évolue vite) est un **geste d'agent**, pas
  une fonction du CLI : un rôle de cadrage s'appuie sur le web, met à jour `models/suggestions.json`
  et le commite. C'est ce geste-là qui est **périodique**.

*Le « périodiquement » du besoin est donc **piloté par un humain et un agent**, pas par un cron
invisible — et le CLI le rend visible en affichant la péremption.*

### D5-bis — Le binding `ollama` (ajout du 2026-08-03, même lot)
La demande d'origine — *mettre des modèles locaux à disposition des équipes* — exige un artefact
que le canon n'avait pas : **un binding qui apparie la méthode et la team sur des modèles
locaux**. Il est livré : `bindings/iakaframe-ollama-default.md` (`node: ollama-lan`,
`runner: ollama-distant`, 9 personas), **dérivé de la source unique** (D2) par projection
`roleKey → persona`.

Trois décisions le cadrent :
- **Il n'est pas actif par défaut.** `origin: forge-ollama` (et non `forge-default`) : le binding
  du défaut reste celui de Claude. Une équipe bascule **sur décision**, jamais par effet de bord.
- **Le choix est explicite, jamais deviné.** Une team peut désormais porter plusieurs bindings ;
  `models --binding <id>` désigne celui qu'on lit et écrit. Un binding **rattaché à une autre
  team est refusé** (exit 1) — écrire dans le binding d'une team étrangère est précisément le
  défaut que le récapitulatif d'avant-gate cherche à empêcher (R5).
- **`tools` n'est pas recopié.** Les allowlists du binding défaut sont des ids d'outils **Claude
  Code** : sans valeur hors de ce runner. Le champ est **omis** (sauf `comfyui-local` pour le
  design). *Un champ absent est plus honnête qu'un champ plausible.*

### D6 — Symétrie et rétention
Tout ce qu'un ajout installe, un retrait doit pouvoir l'enlever (règle de symétrie `+`/`-` du
canon) : `models` expose donc **retirer** dès ce lot, pas dans un second temps.
**Politique de rétention (décideur)** : on **conserve une à deux versions antérieures** d'un
modèle en stock plutôt que de purger agressivement — la place le permet (C8 : 615 Go libres).
Le retrait est donc **proposé, jamais automatique**, et un remplacement **ne supprime pas**
l'ancien modèle par défaut.

---

## Le process interactif (déroulé imposé)

**Étape 1 — État des lieux par `roleKey`.** Pour la frame active : un tableau `roleKey` →
persona(s) → modèle **actuellement affecté** (lu au binding) → modèle **suggéré** (lu à D2) →
**disponibilité réelle par cible** (mesurée, cf. C6). Trois états lisibles : **en place**,
**disponible mais non affecté**, **à installer**. La **date de fraîcheur** des suggestions est
affichée ici.

**Étape 2 — Proposition.** « Voulez-vous voir les nouvelles suggestions ? » — si non, le process
s'arrête proprement **sans rien écrire**.

**Étape 3 — Diff des suggestions.** Ce qui a changé depuis la dernière veille, par `roleKey`,
avec le **motif** du changement. Écriture de la table **seulement sur feu vert** (D5).

**Étape 4 — Installer / remplacer / retirer, par `roleKey`.** Sélection par l'utilisateur, choix
de la **cible** (D4), **récapitulatif avant action** — modèle, taille à télécharger, cible,
effets de bord (redémarrage de passerelle le cas échéant) — puis **gate humain explicite**, puis
exécution par l'adaptateur, puis **écriture de l'affectation dans le binding** (D3).
**Aucun téléchargement ni aucune écriture avant le gate.**

---

## Critères de vérification (gate qualité)

1. `iakaframe models` existe, s'exécute **sans réseau** et affiche l'état des lieux (les cibles
   injoignables sont marquées telles, **le process ne plante pas**).
2. L'état des lieux affiche **les 9 `roleKey`** de la frame active, un `roleKey` sans persona
   étant marqué **non couvert**.
3. **Aucun** `pull`, **aucune** écriture de binding, **aucune** modification de la passerelle
   n'a lieu sans gate humain — vérifié par une passe où l'utilisateur répond « non » à tout :
   `git status` propre et parc de modèles inchangé.
4. Les suggestions proviennent **d'un seul fichier** ; `grep` des anciennes tables (C2) ne renvoie
   plus de valeurs concurrentes, mais des renvois vers la source unique.
5. Le **faux ✅** de `cible-ollama-modeles-agents.md` (C1) est corrigé dans le canon.
6. Les **5 adaptateurs** sont couverts par des tests, `claude-local`/`codex-local` compris
   (chemin « vérification, pas téléchargement »).
7. **Symétrie** : un modèle installé par le process peut être retiré par le process (D6).
8. `litellm-lan` : une sauvegarde datée de la config existe **avant** toute écriture, et la
   modification est limitée au `model_list`.
9. **`docs/commandes.md` est mis à jour dans le même lot** (règle de canon : toute commande
   ajoutée y est répercutée).
10. Le lot **ne touche pas** `library/_schema/frontmatter.json` (C7) — la parité GUI reste verte.

---

## Hors périmètre (explicite)

Résolution de la dette de vocabulaire « models » (D1) · promotion des suggestions en type de
`library/` (D2) · benchmark ou évaluation automatique de la qualité des modèles · fine-tuning ·
gestion de quotas disque · modèles **image** ComfyUI (le besoin de 2026-06-24 existe toujours,
il est **différé**, pas annulé) · installation ou choix d'un harnais agentique tiers ·
montée de version de LiteLLM (dossier L32/Phase D, séparé).

---

## Risques

| # | Risque | Parade |
|---|---|---|
| R1 | **La table redevient périmée** en silence, comme ses trois ancêtres. | Date de fraîcheur **affichée à chaque lancement** (étape 1) ; la péremption devient visible sans avoir à y penser. |
| R2 | `litellm-lan` touche un **service partagé** : une erreur casse Open-WebUI, AnythingLLM et Obot d'un coup. | Sauvegarde datée avant écriture, périmètre `model_list` seul, recette par appel réel après redémarrage. |
| R3 | Le GPU est **partagé avec ComfyUI** : installer et éprouver plusieurs modèles peut saturer la VRAM. | Ne charger qu'un modèle à la fois lors des vérifications ; ne pas éprouver en masse pendant une génération d'image. |
| R4 | **Modèles *thinking*** : une vérification avec un budget de tokens serré rend un `content` **vide** et se lit à tort comme un échec. | Budget **≥ 300 tokens** dans tout appel de vérification, et le dire dans le message d'erreur. |
| R5 | La projection `roleKey → personas` **écrit dans le mauvais binding** si la frame active n'est pas celle qu'on croit. | Afficher la frame active **et le fichier binding cible** dans le récapitulatif d'avant-gate. |
| R6 | Reconfiguration opportuniste (« tant qu'on y est, on change le port / la clé »). | Interdit — reprise de la règle R6-bis de L32. |

---

## Estimation

**~1 à 1,5 j-homme** (unité de complexité, pas de délai) : source unique + verbe interactif
(~0,5 j) · 5 adaptateurs dont 2 triviaux (~0,5 j) · tests + `docs/commandes.md` + correction du
faux ✅ (~0,25 j). *La veille elle-même (rafraîchir la table) est un geste récurrent, hors
estimation de construction.*
