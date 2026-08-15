# kit-openwebui — iakaframe pour Open WebUI

> Incarnation **Open WebUI** de la méthode iakaframe. Cible vérifiée : **Open WebUI 0.9.6**
> (image `ghcr.io/open-webui/open-webui:main`, tag roulant). La méthode est identique aux autres
> kits ; seul le support change : **un persona = un Model** importable, dont le system prompt
> porte le rôle et le rituel d'identité.

## Contenu

```
kit-openwebui/
├── AGENTS.md                       ← contrat + rituel comportemental d'identité (3.4/3.5/3.6)
├── MODELES.md                      ← base model par persona (Ollama/LiteLLM) + branchement
├── README.md                       ← ce fichier (install pas-à-pas)
├── models/                         ← 9 Models, un par persona, IMPORTABLES dans Open WebUI 0.9.6
│   ├── odin.json      aragorn.json    gandalf.json    gimli.json
│   ├── legolas.json   charon.json     helm.json       loki.json
│   └── nathalie.json
└── specs/
    ├── PROJET.md                   ← gabarit vision / décisions
    └── instructions/_TEMPLATE.md   ← gabarit d'instruction (cadrage avant code)
```

> **Slash-commands `prompts/`** (`/cadrage`, `/revue`…) et **Tools / Functions / Pipelines** →
> **itération 2**, hors MVP.

## Installation pas-à-pas

> Pré-requis : une instance Open WebUI **0.9.6** accessible (ex. la box LAN
> `http://192.168.2.12:8099`), et au moins une **connexion** vers un fournisseur de base models
> (*Admin Settings > Connections* → Ollama et/ou OpenAI-compatible ; cf. `MODELES.md`).

Pour **chacun** des 9 personas (`odin`, `aragorn`, `gandalf`, `gimli`, `legolas`, `charon`,
`helm`, `loki`, `nathalie`) :

1. **Ouvrir l'atelier des Models** : barre latérale → **Workspace** → onglet **Models**.
2. **Importer le JSON** : bouton **Import Models** (icône d'import en haut à droite) → choisir
   `models/<persona>.json` (ex. `models/gimli.json`). Le Model « Gimli » apparaît dans la liste.
3. **Vérifier / choisir le base model** : ouvrir le Model importé (crayon **Edit**) → champ
   **Base Model** → confirmer qu'il pointe le modèle recommandé (cf. `MODELES.md`). Si le tag
   exact n'existe pas chez toi, sélectionner l'équivalent disponible dans la liste.
4. **Vérifier le system prompt** : dans le même écran d'édition, le champ **System Prompt** doit
   contenir le rôle du persona (badge, phase, conventions). Ne pas le vider.
5. **Enregistrer** (**Save & Update**).
6. **Vérifier le comportement** : nouveau chat → sélectionner le Model `<Persona>` dans le
   sélecteur de modèle → envoyer un message simple (ex. « présente-toi »). La réponse **doit** :
   - ouvrir par le badge `<pastille> [ROYAUME][<Persona>] — …` en **première ligne** ;
   - clôturer par `… [ROYAUME][<Persona>] <pastille>` en **dernière ligne** (rien après la pastille) ;
   - ne **jamais** écrire « START »/« STOP ».
   Remplacer `ROYAUME` par le nom du projet en MAJUSCULE (pour Odin : `PORTEFEUILLE`).

Répéter pour les 8 personas → 8 Models opérationnels. Les **prompt suggestions** (puces de
démarrage) apparaissent sous le champ de saisie quand le Model est sélectionné.

> **Note schéma — à valider au gate.** Les `models/*.json` sont calés sur le **schéma d'export
> Model d'Open WebUI 0.9.x** (champs `id`, `name`, `base_model_id`, `params.system`,
> `meta.{description,profile_image_url,capabilities,suggestion_prompts,tags}`, `access_control`,
> `is_active`, `created_at`/`updated_at`). L'accès à l'API `/api/v1/models` de l'instance vivante
> **0.9.6** exige un token (non inclus dans le kit) ; un **import de validation réel** sur
> l'instance reste donc **à faire au gate qualité** pour confirmer l'absence de divergence.

## Méthode dans le repo de travail

Open WebUI est un **front de conversation**, pas un IDE qui écrit dans un repo. La discipline
iakaframe (cadrage-avant-code, états des lieux, git/Forgejo) reste portée par le dossier `specs/`
de ton projet réel et par la **CLI** iakaframe (agnostique de l'agent) :

1. Copier `specs/PROJET.md` et `specs/instructions/_TEMPLATE.md` à la racine de **ton** repo.
2. Remplir `specs/PROJET.md` (vision) ; pour chaque feature, écrire
   `specs/instructions/<feature>.md` **avant** de coder (Model Gandalf), la faire **valider**,
   puis la donner au Model **Gimli**.
3. Après chaque livraison Gimli → **Model Legolas** (gate qualité indépendant) avant toute
   annonce de complétion.

## Limites assumées (MVP)

- **Pas de dispatch multi-agents natif** : on change de **Model** dans le sélecteur pour changer
  de persona ; la chaîne de délégation est **narrative**, pas un routage automatique.
- **Pas de hook garde d'identité** : le rituel (double badge, position de pastille) est
  **comportemental**, porté par le system prompt (cf. `AGENTS.md`).
- **Slash-commands / Tools / Functions / Pipelines** Open WebUI → **itération 2**.
