# kit-anythingllm — iakaframe pour AnythingLLM

> Incarnation **AnythingLLM** de la méthode iakaframe. Cible vérifiée : **AnythingLLM 1.13.0**
> (image `mintplexlabs/anythingllm:latest`, tag roulant). La méthode est identique aux autres
> kits ; seul le support change : **un persona = un workspace** dont le *System Prompt* porte le
> rôle et le rituel d'identité.

## Contenu

```
kit-anythingllm/
├── AGENTS.md                       ← contrat + rituel comportemental d'identité (3.4/3.5/3.6)
├── MODELES.md                      ← modèle par persona (un workspace = un LLM)
├── README.md                       ← ce fichier (install pas-à-pas)
├── prompts/                        ← 9 System Prompts, un par persona (à coller dans un workspace)
│   ├── odin.md      aragorn.md    gandalf.md    gimli.md
│   ├── legolas.md   charon.md     helm.md       loki.md
│   └── nathalie.md
└── specs/
    ├── PROJET.md                   ← gabarit vision / décisions
    └── instructions/_TEMPLATE.md   ← gabarit d'instruction (cadrage avant code)
```

> AnythingLLM **n'a pas d'import de workspace clé en main** → le MVP est un **copier-coller
> guidé**, workspace par workspace. (Custom agent skills `plugin.json`/`handler.js` → itération 2.)

## Installation pas-à-pas

> Pré-requis : une instance AnythingLLM **1.13.0** accessible (ex. la box LAN
> `http://192.168.2.12:3005`), et au moins un **fournisseur LLM** branché (cf. `MODELES.md`,
> *Settings > AI Providers > LLM*).

Pour **chacun** des 9 personas (`odin`, `aragorn`, `gandalf`, `gimli`, `legolas`, `charon`,
`helm`, `loki`, `nathalie`) :

1. **Créer un workspace** : barre latérale → **+ New Workspace** → le nommer du persona
   (ex. `gimli`).
2. **Ouvrir ses réglages** : survoler le workspace → icône **engrenage (Settings)**.
3. **Coller le System Prompt** : onglet **Chat Settings** → champ **System Prompt** → coller
   **tout le contenu** de `prompts/<persona>.md` (ex. `prompts/gimli.md`).
4. **Choisir le LLM du workspace** : même onglet → **Workspace Chat Provider / Model** →
   sélectionner le modèle recommandé pour ce persona (cf. tableau de `MODELES.md`). C'est ce qui
   réalise « un workspace = un LLM ».
5. **Enregistrer** (*Update workspace* / *Save*).
6. **Vérifier le comportement** : ouvrir le chat du workspace, envoyer un message simple
   (ex. « présente-toi »). La réponse **doit** :
   - ouvrir par le badge `<pastille> [ROYAUME][<Persona>] — …` en **première ligne** ;
   - clôturer par `… [ROYAUME][<Persona>] <pastille>` en **dernière ligne** (rien après la pastille) ;
   - ne **jamais** écrire « START »/« STOP ».
   Remplacer `ROYAUME` par le nom du projet en MAJUSCULE (pour Odin : `PORTEFEUILLE`).

Répéter pour les 8 personas → 8 workspaces opérationnels.

### Astuce — variables de System Prompt (optionnel)

AnythingLLM supporte des **variables dynamiques** dans le System Prompt (`{date}`, `{time}`,
`{user.name}`, variables custom). Tu peux en ajouter en fin de prompt si tu veux dater les
échanges ; ce n'est pas requis pour le MVP.

## Méthode dans le repo de travail

AnythingLLM est un **front de conversation**, pas un IDE qui écrit dans un repo. La discipline
iakaframe (cadrage-avant-code, états des lieux, git/Forgejo) reste portée par le dossier
`specs/` de ton projet réel et par la **CLI** iakaframe (agnostique de l'agent) :

1. Copier `specs/PROJET.md` et `specs/instructions/_TEMPLATE.md` à la racine de **ton** repo.
2. Remplir `specs/PROJET.md` (vision) ; pour chaque feature, écrire
   `specs/instructions/<feature>.md` **avant** de coder (persona Gandalf), la faire **valider**,
   puis la donner au workspace **Gimli**.
3. Après chaque livraison Gimli → **workspace Legolas** (gate qualité indépendant) avant toute
   annonce de complétion.

## Limites assumées (MVP)

- **Pas de dispatch multi-agents natif** : on change de **workspace** pour changer de persona ;
  la chaîne de délégation est **narrative**, pas un routage automatique.
- **Pas de hook garde d'identité** : le rituel (double badge, position de pastille) est
  **comportemental**, porté par le System Prompt (cf. `AGENTS.md`).
- **Custom agent skills** (AnythingLLM `@agent` + `handler.js`) et tout outillage natif →
  **itération 2**.
