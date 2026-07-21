# Binding Claude Code — `open` au `SessionStart` (mince & optionnel)

> Greffon de la **boucle d'apprentissage incrémentale** (T3, § 5.1 de
> `specs/instructions/boucle-apprentissage-incrementale.md`, décision **Q-6**).

Ce dossier contient le **seul** morceau qui connaît Claude Code : un hook `SessionStart`
qui invoque le geste **agnostique** `iakaframe open` et injecte le **canon portefeuille**
(`PROFIL.md` + `REGISTRE.md`) dans le contexte de session — **quel que soit le répertoire
courant**, **en plus** de la mémoire par scope de Claude Code (jamais en remplacement).

Il transmet aussi à `open` le **répertoire de projet déclaré par le runner** (`--project`),
ce qui (a) ajoute le **canon projet** (`specs/canon/PRODUIT.md`) au contexte quand il existe
et (b) **arme le marqueur de session** — le mécanisme qui permet de **rattraper la clôture**
à la reprise si une session se ferme sans rituel.

## Propriétés (à garder telles quelles)

- **Mince** — *au sens précis, et vérifiable* : le hook **fournit le CONTEXTE, le cœur porte
  le JUGEMENT**. Il relaie ce que le runner **déclare** de lui-même et appelle `iakaframe
  open` ; il n'a le droit d'implémenter **aucune heuristique de projet** (pas de remontée
  d'arborescence, pas de sonde de dépôt, aucune connaissance du layout du canon). Le jugement
  « ce répertoire est-il un projet à canon ? » reste **entièrement** dans le cœur agnostique
  (`projectCanonExists`). **Cette interdiction est verrouillée par un test** (C-8) : « mince »
  est un **critère de recette**, pas une déclaration d'intention.
- **Dégradation vers `open` nu, jamais vers le silence** : si le contexte projet est
  indisponible ou inutilisable, le hook appelle `open` **sans** `--project`. On ne perd
  **jamais** le canon portefeuille à cause du canon projet. Et un répertoire **sans** canon
  projet ne se voit **rien** créer ni armer.
- **Optionnel** : le canon fonctionne **sans** ce binding. On peut charger le canon **à la
  main** : `iakaframe open`. C'est un simple greffon de confort.
- **En parallèle** : il **ajoute** du contexte, il ne remplace pas la mémoire par scope.
- **Non bloquant** : toute défaillance (CLI absente, canon vide) → sortie vide, `exit 0` ;
  jamais de session bloquée.
- **Aucun privilège** : chaque runner apporte son propre binding mince ; aucun n'est
  privilégié (Q-6). Claude Code au MVP car c'est le runner réel.

## Installation — geste **humain** (l'agent ne modifie pas `settings.json`)

> ⚠️ L'**activation** est un **geste humain**. Le mode auto d'un agent **bloque** l'édition
> de `~/.claude/settings.json` : ce fichier ne doit **pas** être modifié par un agent. Les
> instructions ci-dessous sont à appliquer **par Stéphane**.

1. S'assurer que la CLI est appelable. Deux options :
   - **CLI installée** (`iakaframe` dans le PATH) → rien à faire, le hook la trouve seul.
   - **Dépôt en dev** → renseigner l'env `IAKAFRAME_BIN` avec l'invocation locale, ex. :
     `IAKAFRAME_BIN="node /Users/<toi>/work/iakaframe/cli/src/index.js"`.

2. Déclarer le hook dans `~/.claude/settings.json` (ou `.claude/settings.json` du projet),
   sous `hooks.SessionStart` :

   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "node /Users/<toi>/work/iakaframe/cli/bindings/claude-code/session-start.mjs"
             }
           ]
         }
       ]
     }
   }
   ```

   Adapter le chemin absolu du script. Le canon suit sa résolution native
   (`IAKA_MEMORY_HOME`, sinon `~/.iaka/memory/`).

3. (Optionnel) Vérifier à la main, hors Claude Code :
   ```bash
   node cli/bindings/claude-code/session-start.mjs
   # -> JSON { "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": "..." } }
   # (rien du tout si le canon est vide/absent — c'est normal, non bloquant)
   ```
   La commande **rend la main immédiatement** : en terminal interactif, le hook **ne lit pas**
   stdin (garde `isTTY`), sans quoi il attendrait un payload qui ne viendrait jamais.

## Comment le répertoire de projet est résolu

Le hook **ne devine rien** : il prend la **première valeur non vide** parmi trois sources
**déclarées par le runner**, puis la passe en chemin **absolu** à `open --project`.

| Ordre | Source | Pourquoi |
|---|---|---|
| 1 | `CLAUDE_PROJECT_DIR` | Sémantique = **racine du projet**, là où vit `specs/canon/`. |
| 2 | `cwd` du payload JSON `SessionStart` (stdin) | Le runner déclare son répertoire de session. |
| 3 | Répertoire courant du processus | Dernier repli — **non contractuel** pour un hook. |

**Pourquoi trois sources et pas une seule** : un défaut connu de Claude Code rend les variables
d'environnement de hook vides dans certaines versions. Une source unique redeviendrait
**inerte** à la première régression du runner — précisément le défaut que ce mécanisme corrige.

**Limite connue** : si la session est lancée depuis un **sous-répertoire** du projet et que
`CLAUDE_PROJECT_DIR` est absent, le canon projet n'est pas trouvé. La remontée d'arborescence
est **volontairement exclue** du binding (elle violerait « mince ») ; si le cas se présente
réellement, elle relève du **cœur**, pas d'ici.

## Désactivation

Retirer l'entrée `SessionStart` de `settings.json`. Le canon reste intact et chargeable à
la main (`iakaframe open`) : le binding n'est qu'un greffon.
