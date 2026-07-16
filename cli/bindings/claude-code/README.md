# Binding Claude Code — `open` au `SessionStart` (mince & optionnel)

> Greffon de la **boucle d'apprentissage incrémentale** (T3, § 5.1 de
> `specs/instructions/boucle-apprentissage-incrementale.md`, décision **Q-6**).

Ce dossier contient le **seul** morceau qui connaît Claude Code : un hook `SessionStart`
qui invoque le geste **agnostique** `iakaframe open` et injecte le **canon portefeuille**
(`PROFIL.md` + `REGISTRE.md`) dans le contexte de session — **quel que soit le répertoire
courant**, **en plus** de la mémoire par scope de Claude Code (jamais en remplacement).

## Propriétés (à garder telles quelles)

- **Mince** : le hook ne fait qu'appeler `iakaframe open` et relayer sa sortie. Toute la
  logique du canon vit dans le cœur agnostique (`cli/src/lib/open.js`) ; **le canon ignore
  les runners**.
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

## Désactivation

Retirer l'entrée `SessionStart` de `settings.json`. Le canon reste intact et chargeable à
la main (`iakaframe open`) : le binding n'est qu'un greffon.
