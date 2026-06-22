# Cycle de session iakaframe : titres, tableaux ASCII, identité, reprise & commit

## Problème
On veut que l'usage d'iakaframe « se voie » et soit ritualisé de bout en bout :
au démarrage, à l'entrée d'un projet, pendant le travail (qui parle), et à la
fermeture (reprise + sauvegarde). Aujourd'hui seul le titre de royaume existe
(commande `banner`, livrée en `0dcb545`). On ajoute les rituels manquants.

## Décision retenue
Cinq briques. Réutilisation maximale de l'existant (`banner`, `snapshot`, `update`,
`agents`). Les déclencheurs « système » (démarrage / fermeture) passent par des
**hooks Claude Code** posés au **niveau portefeuille** `C:\work\.claude\settings.json`
(et **pas** dans `~/.claude` — ça cible iakaframe sans toucher les autres usages, et
évite le blocage auto-mode sur le settings global). L'interaction « propose de
commiter » est **conversationnelle** (l'agent demande, l'utilisateur valide) — un hook ne
peut pas prompter à la fermeture ; le hook ne sert que de **filet** (snapshot silencieux).

## Périmètre
### Brique A — Titre `IAKAFRAME` au démarrage
- **Inclus** : hook **`SessionStart`** dans `C:\work\.claude\settings.json` exécutant
  `iakaframe banner IAKAFRAME`. Couvre « odin ? » comme toute autre entrée de session
  sous le portefeuille.
- **Exclu** : l'afficher dans les sessions hors portefeuille.

### Brique B — Entrée dans un projet : titre + tableau + agents
- **Inclus** : nouvelle commande **`iakaframe brief <projet>`**, appelée aussi par `go`
  juste après le titre du projet. Elle affiche :
  1. le **titre ASCII** du nom de projet (déjà fait par `go`/`banner`) ;
  2. un **tableau ASCII** : **dernière étape** (lue dans `specs/etat-des-lieux.md`) +
     **backlog restant** (lu dans `CLAUDE.md`, section backlog) ;
  3. la **liste des agents assignés** — par **défaut la team complète**
     (`listAgents()` moins les agents portefeuille), ou ceux réellement présents dans
     `<projet>/.claude/agents/` s'il y en a.
- **Exclu** : éditer l'état des lieux ou le backlog (lecture seule ici).

### Brique C — Identité quand un agent parle (anti-dérive)
- **Inclus** : **durcir** dans **toutes** les chartes `agents/*.md` et dans
  `methode-de-travail.md` que **chaque** prise de parole adressée à l'utilisateur est
  préfixée `<puce de phase> [PROJET][Agent]` (PROJET en MAJUSCULE), **obligatoire**
  (formulation « DOIT », pas « peut »), jamais sur logs/traces. But : éviter les
  dérives hors méthode.
- **Exclu** : tout mécanisme technique d'injection automatique du préfixe (ça reste une
  règle de comportement des agents).

### Brique D — Fermeture (exit/pause/stop) : reprise + recap
- **Inclus** :
  - Nouvelle commande **`iakaframe recap [--project <p>]`** : **tableau ASCII** récap de
    session — ce qui a été fait (commits de la session via `git log`), **agents
    mobilisés**, **nom du projet**.
  - Comportement d'agent : sur intention de stop/pause/exit exprimée par l'utilisateur,
    l'agent actif lance `iakaframe snapshot --reason pause` (prépare la reprise dans
    `specs/etat-des-lieux.md`) puis affiche `iakaframe recap`.
  - Filet : hook **`SessionEnd`** (portefeuille) lançant `iakaframe snapshot --reason pause`
    en silencieux, pour ne jamais perdre l'état même sans interaction.
- **Exclu** : recap multi-projets agrégé (un projet à la fois pour le MVP).

### Brique E — Proposer de commiter à la fermeture
- **Inclus** : comportement d'agent — avant de clore, l'agent **propose** de sauvegarder
  l'état via `iakaframe update` (snapshot + commit global) et **attend la validation**
  de l'utilisateur. **Jamais** de commit automatique silencieux.
- **Exclu** : push automatique (séparé ; reste sur décision explicite).

### Brique F — Jalons (gates) très visibles
Un « jalon » = un gate de la méthode (instruction prête, dev à vérifier, qualité, prod).
- **Inclus** : nouvelle commande **`iakaframe jalon`** rendant le **cadre** d'un jalon :
  1. **titre ASCII en FIGlet `Standard`** (police *distincte* d'ANSI Shadow, réservée aux
     jalons pour les différencier des titres de royaume) : `<PROJET> - JALON : <nom>` ;
  2. un **tableau ASCII à 3 zones** : **gauche = émetteur** (agent qui pose le jalon),
     **milieu = contenu** du jalon, **droite = récepteur** (qui doit valider — souvent
     l'utilisateur).
  - Options : `--project --name --from --to --content --files a:1,b:2`.
  - **Liens cliquables** : le CLI imprime les chemins tels quels ; c'est **l'agent** qui,
    dans son message, liste les fichiers/dev à vérifier en `chemin:ligne` (cliquables côté
    Claude Code). Le tableau référence « voir message » pour ces liens.
- **Validation** : quand l'utilisateur valide, le **récepteur** (agent ou l'utilisateur→agent suivant)
  affiche **« JALON VALIDÉ »** (bandeau court) puis **explique la suite** (étape/agent
  suivant). C'est un comportement d'agent, déclenché par l'accord de l'utilisateur.
- **Exclu** : machine à états persistante des jalons (suivi en base) — MVP = affichage.

## Étapes d'implémentation
1. `cli/src/lib/table.js` — rendu d'un **tableau ASCII** (bordures box-drawing, colonnes
   auto-dimensionnées, UTF-8 + repli ASCII). Zéro dépendance.
2. `cli/src/lib/etat.js` — lecture/parsing de `specs/etat-des-lieux.md` (dernière étape)
   et du backlog dans `CLAUDE.md`.
3. `cli/src/commands/brief.js` — commande `brief` (titre + table état/backlog + agents) ;
   branchement dans `go` après le titre projet ; enregistrement dans `index.js` + HELP.
4. `cli/src/commands/recap.js` — commande `recap` (table session : commits + agents +
   projet) ; enregistrement `index.js` + HELP.
4b. `cli/src/commands/jalon.js` — commande `jalon` : titre FIGlet `Standard`
   (`<PROJET> - JALON : <nom>`) + tableau 3 zones (émetteur / contenu / récepteur) via
   `table.js` ; enregistrement `index.js` + HELP. Durcir dans les chartes le rituel de
   jalon (afficher le cadre + lister les fichiers en `chemin:ligne` ; à la validation,
   « JALON VALIDÉ » + explication de la suite).
5. `C:\work\.claude\settings.json` — hooks `SessionStart` (banner IAKAFRAME) et
   `SessionEnd` (snapshot pause). Créer le fichier s'il n'existe pas. **À appliquer par
   l'utilisateur** si l'auto-mode bloque l'écriture (lui fournir le bloc JSON).
6. `agents/*.md` + `methode-de-travail.md` — durcir la règle d'identité (brique C).
7. Tests : `table.js` (rendu déterministe vs fixture), `etat.js` (parsing sur exemples),
   `recap`/`brief` (sortie non vide + colonnes attendues sur un projet bidon).

## Fichiers concernés
- `cli/src/lib/table.js`, `cli/src/lib/etat.js` — **nouveaux** (libs).
- `cli/src/commands/brief.js`, `cli/src/commands/recap.js`, `cli/src/commands/jalon.js` — **nouveaux** (commandes).
- `cli/src/commands/go.js` — appeler `brief` après le titre projet.
- `cli/src/index.js` — enregistrer `brief` et `recap` + HELP.
- `C:\work\.claude\settings.json` — hooks `SessionStart` / `SessionEnd`.
- `agents/*.md`, `methode-de-travail.md` — règle d'identité obligatoire.
- `cli/test/table.test.js`, `cli/test/etat.test.js` — **nouveaux**.

## Risques
- **Hooks system** : `SessionStart`/`SessionEnd` ne peuvent pas prompter → l'interactif
  (brique E) reste conversationnel ; le hook ne fait que snapshot silencieux. Documenté.
- **Auto-mode** peut bloquer l'écriture de `C:\work\.claude\settings.json` → fournir le
  bloc à coller à l'utilisateur (comme pour `defaultMode`).
- **Parsing fragile** de `etat-des-lieux.md` / `CLAUDE.md` (formats variables) → parser
  défensif + repli « (section introuvable) », jamais de crash.
- **Largeur terminal** : tableaux longs → adapter à `process.stdout.columns`, repli largeur fixe.
- **`iakaframe` doit être sur le PATH** pour les hooks → sinon invoquer via `node <chemin>`.
- **Bruit** : ne pas réafficher IAKAFRAME à chaque sous-commande ; uniquement au SessionStart.

## Critères d'acceptation
- [ ] Au démarrage d'une session sous `C:\work`, le titre `IAKAFRAME` s'affiche (hook SessionStart).
- [ ] `iakaframe brief <projet>` (et `go`) affiche : titre projet + tableau (dernière étape + backlog) + liste des agents (team complète par défaut).
- [ ] `iakaframe recap` affiche un tableau : commits de la session + agents mobilisés + nom du projet.
- [ ] À l'expression d'un stop/pause/exit, l'agent lance le snapshot de reprise, affiche le recap, et **propose** le commit (`iakaframe update`) sans jamais committer en silence.
- [ ] Hook `SessionEnd` : snapshot `pause` exécuté comme filet (état jamais perdu).
- [ ] Toutes les chartes `agents/*.md` imposent (formulation « DOIT ») le préfixe `<puce> [PROJET][Agent]`.
- [ ] `cli/package.json` : toujours **zéro dépendance runtime**.
- [ ] Parsing défensif : un `etat-des-lieux.md`/`CLAUDE.md` non conforme ne fait pas planter (repli lisible).
- [ ] `iakaframe jalon --project P --name "..." --from Gandalf --to l'utilisateur --content "..." --files a.js:1` affiche le titre FIGlet **Standard** `P - JALON : ...` + le tableau 3 zones (émetteur / contenu / récepteur).
- [ ] Le titre de jalon utilise bien **Standard** (et non ANSI Shadow), pour le distinguer d'un titre de royaume.
- [ ] À la validation d'un jalon par l'utilisateur, le récepteur affiche « JALON VALIDÉ » puis explique l'étape/agent suivant.
- [ ] Les chartes imposent le rituel de jalon (cadre + fichiers en `chemin:ligne` dans le message + message de validation).
- [ ] Tests `table`/`etat` verts ; suite globale verte.
