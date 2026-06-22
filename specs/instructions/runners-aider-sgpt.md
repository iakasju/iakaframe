# Runners aider & sgpt (exécuteurs alternatifs)

## Problème
iakaframe est la couche **méthode/orchestration** ; l'exécuteur (qui code) est
interchangeable. Aujourd'hui `iakaframe go <projet> --runner <r>` dispatche vers
`ps`(claude) / `codex` / `iakaide`. On veut pouvoir piloter la méthode avec
**aider** (et offrir **sgpt** comme utilitaire d'appoint), sans rien changer au
cycle cadrage → exécution → validation.

## Faits vérifiés (web, juin 2026)
- **aider** : `aider --message "…" [fichiers]` ou `--message-file <f>` applique les
  edits puis **sort** (un seul passage, scriptable) ; `--yes` auto-confirme ;
  `--no-auto-commits` désactive son commit auto (il commite sinon tout seul) ;
  modèle via `--model`/env, compatible **Ollama**/litellm. Git-aware. (aider.chat)
- **sgpt** : génère commandes/snippets (`--shell`, `--code`, `--repl <nom>`, rôles).
  N'édite **pas** un repo multi-fichiers → ce n'est pas un exécuteur de la boucle.

## Décision retenue (à valider)
- **aider = runner « plein »** (porte Gimli) :
  - **interactif par défaut** (comme `claude`) : `iakaframe go p --runner aider` lance
    `aider` dans le dossier projet ;
  - **one-shot** si `--do "…"` ou une instruction est fournie : on passe
    `--message`/`--message-file specs/instructions/<feature>.md`, aider applique et sort.
  - **`--no-auto-commits`** par défaut → la **discipline de commit reste à iakaframe**
    (commits atomiques Gimli + rituel de clôture), pas à aider. *(arbitrage 1 : décidé OUI)*
  - **modèle par défaut = Ollama local** (self-hosted d'abord), cloud en fallback
    justifié ; surchargé via `iakaframe.json` (`aiderModel`) ou env. *(arbitrage 2 : décidé Ollama, pour l'instant)*
- **sgpt : ANNULÉ** *(arbitrage 3)* — hors périmètre. Cette instruction ne traite QUE le runner **aider**.
- **Détection & repli** : si le binaire est absent (`hasCmd`), avertir et retomber sur
  Claude (même schéma que `codex`/`iakaide` aujourd'hui).

## Périmètre
- **Inclus** :
  - `go.js` : branche `aider` dans le `switch` runner (build des args, one-shot vs
    interactif, `--no-auto-commits`, modèle).
  - `config.js` : accepter `aider` comme valeur de `runner` ; clé optionnelle
    `aiderModel` dans `iakaframe.json`.
  - Mise à jour HELP (`index.js`) et de la doc runner.
  - Bannière de passage de main : `printBanner('aider')` au dispatch (déjà le
    mécanisme des autres runners).
- **Exclu** :
  - **sgpt** (annulé — arbitrage 3).
  - Gérer l'installation/les clés API d'aider (responsabilité de l'utilisateur ;
    on documente, on n'installe pas).
  - Toute dépendance npm runtime (zéro-dep conservé : on **lance** des binaires externes).

## Étapes d'implémentation
1. `go.js` : ajouter `if (runner === 'aider') { … }` — résoudre le binaire (`hasCmd('aider')`),
   construire les args : interactif si pas de tâche, sinon `--message`/`--message-file`,
   toujours `--no-auto-commits`, `--model <aiderModel>` si défini ; `printBanner('aider')`.
2. `config.js` : étendre l'enum runner (`ps|codex|iakaide|aider`) + lecture `aiderModel`.
3. `index.js` : HELP (mentionner aider dans `go --runner`).
4. Doc : note d'usage (prérequis : `pip install aider-install`/`aider`).
5. Tests : un test sur la **construction des args** d'aider (fonction pure extraite),
   sans lancer le binaire (pas de réseau/clé en CI).

## Fichiers concernés
- `cli/src/commands/go.js` — branche `aider` + helper de build d'args.
- `cli/src/commands/config.js` — enum runner + `aiderModel`.
- `cli/src/index.js` — HELP.
- `cli/test/go-args.test.js` — **nouveau** : test de la construction d'args aider.

## Risques
- **aider auto-commit** : s'il commite seul, conflit avec le rituel iakaframe →
  mitigé par `--no-auto-commits` par défaut. *(dépend de l'arbitrage 1)*
- **Modèles/clés** : aider exige un backend (Ollama local ou clé cloud) — non géré par
  iakaframe ; documenté. Sans backend, le runner échoue → message clair.
- **Interactif vs one-shot** : bien router selon présence de `--do`/instruction.
- **Multi-OS** : `aider` est un script console Python sur le PATH → `hasCmd` OK.
- **Zéro-dep** : on n'ajoute rien à `package.json` ; on orchestre des binaires externes.

## Critères d'acceptation
- [ ] `iakaframe go <projet> --runner aider` (sans `--do`) lance aider en interactif dans le projet, banner `AIDER` au dispatch.
- [ ] `iakaframe go <projet> --runner aider --do "applique specs/instructions/X.md"` passe en one-shot (`--message`), avec `--no-auto-commits`.
- [ ] `iakaframe.json` `{ "runner": "aider", "aiderModel": "ollama/…" }` est respecté.
- [ ] Binaire `aider` absent → avertissement + repli Claude (comme codex/iakaide).
- [ ] Test de construction d'args aider vert ; suite globale verte ; `dependencies` runtime toujours vide.
