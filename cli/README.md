# @naonedge/iakaframe — CLI multi-OS

CLI de la methode **iakaframe**, portable **Windows / macOS / Linux**. **Zero dependance
runtime** (Node 20+ : `fetch` et `util.parseArgs` natifs). Voir le cadrage :
`../specs/instructions/iakaframe-multiplateforme-cli.md`.

## Installation

```bash
# depuis les sources (dev)
cd cli && npm link            # expose la commande `iakaframe`

# ou via le registre prive Forgejo (a configurer)
npm i -g @naonedge/iakaframe
```

> Distribution visee : **registre npm prive Forgejo** (`.npmrc` : scope `@naonedge` ->
> registry Forgejo). Ouverture npm public ulterieure possible.

## Commandes (v0.1.0)

13 commandes, plus les options globales `-h, --help` et `-v, --version`.

```bash
iakaframe --version
iakaframe --help
```

### Cycle de vie du projet

```bash
# onboard : structure + Forgejo + 1er commit + etat des lieux + push
iakaframe onboard --path /chemin/projet --target claude --description "ASCII description"
iakaframe onboard --umbrella --path /chemin/chapeau --init-projects   # mode portefeuille

# init : deploie le kit + marqueur .iakaframe (non destructif)
iakaframe init --path /chemin/projet --target claude

# snapshot : etat des lieux (journal + MD + HTML)
iakaframe snapshot --reason version --version v0.2.0 --note "feature X livree"
iakaframe snapshot --reason reprise

# update : checkpoint (snapshot + commit global + push FAN-OUT sur tous les remotes)
iakaframe update --reason pause --note "WIP : reprendre par les tests" --no-push
iakaframe update --remotes origin,github --timeout 10   # cibles et delai explicites
```

Le push d'`update` (et d'`onboard`) va vers **toutes** les cibles configurees, chacune
reussissant ou echouant **independamment** et **nommee** dans la sortie. Une cible injoignable
n'est pas une erreur : c'est un etat. Et rien n'est jamais annonce comme sauvegarde sans dire
**qui** a recu.

### Canaux synchrones

```bash
iakaframe canaux                      # etat MESURE EN DIRECT des depots, avec la date
iakaframe canaux --branch main --json
iakaframe canaux --rattraper          # pousse ce qui est une AVANCE RAPIDE, refuse le reste
```

Etats rendus : `a-jour`, `en-retard` de N, `en-avance` de M, `divergent`, `branche-absente`,
`injoignable`, `inconnu`. Le dernier etat lu dans une **ref locale** est rendu **a part**
(`dernierConnu` + date du dernier fetch) : un souvenir ne se confond jamais avec une mesure.
`--rattraper` **refuse** tout ce qui n'est pas une avance rapide et **le dit** ; **jamais** de
`--force`.

### Diagnostic & configuration

```bash
iakaframe root                                   # dossier chapeau resolu (~/work | C:\work)
iakaframe services                               # sonde Forgejo / Ollama / ComfyUI
iakaframe services --json ./specs/services.json
iakaframe services --hosts a,b,c --timeout 5

# config : ecrit/maj <projet>/iakaframe.json (runner du bouton Go + cible d'incarnation)
iakaframe config --runner ps --target claude            # cwd
iakaframe config --path /chemin/projet --runner codex
iakaframe config --runner aider --aider-model ollama/llama3   # runner aider + son modele
```

`config` accepte `--runner ps|codex|iakaide|aider`, `--target claude|codex|ollama` et
`--aider-model <m>` (modele du runner `aider`, ex. `ollama/llama3`). Il diagnostique les
runners disponibles et avertit si le runner choisi basculera sur Claude au runtime.

### Lancer un projet

```bash
# go : entre dans un projet (titre ASCII + brief) puis lance son runner
iakaframe go mon-projet                          # runner lu dans iakaframe.json (defaut ps -> Claude)
iakaframe go mon-projet --runner codex
iakaframe go mon-projet --do "ajoute un test sur le parseur"
iakaframe go --path /chemin/projet
```

`go <projet>` resout le projet (positionnel, `--project` ou `--path`), affiche le titre
ASCII + le **brief** d'entree, puis lance le runner du projet :

- **ps** (defaut) -> **Claude Code** (`claude`) ;
- **codex** -> CLI `codex` (repli Claude si absent) ;
- **iakaide** -> binaire iakaIDE buildé (repli Claude si non build) ;
- **aider** -> **interactif** par defaut, **one-shot** si `--do` (`--yes --message`),
  **toujours** `--no-auto-commits` (iakaframe garde la main sur git) ; modele via
  `iakaframe.json` -> `aiderModel` (defaut : modele Ollama configure).

Tout runner indisponible bascule proprement sur Claude (`ps`).

### Rituels de session (titres ASCII & gates)

```bash
# banner : titre ASCII FIGlet embarque (zero dep)
iakaframe banner "IAKAFRAME"
iakaframe banner "MON PROJET" --font Standard

# brief : entree projet (titre + derniere etape + backlog + agents assignes)
iakaframe brief mon-projet
iakaframe brief --path /chemin/projet --font "ANSI Shadow"

# recap : fermeture de session (commits + agents mobilises + projet)
iakaframe recap mon-projet
iakaframe recap mon-projet --n 20

# jalon : cadre d'un gate (emetteur / contenu / recepteur)
iakaframe jalon --project mon-projet --name "Cadrage valide" \
  --from Gandalf --to Gimli --content "Instruction prete" \
  --files specs/instructions/feature.md:1 --next "implementation"
iakaframe jalon --project mon-projet --name "Cadrage valide" --validated --next "implementation"
```

- **banner `<texte>`** : titre ASCII via le moteur FIGlet embarque (zero dep). `--font`
  choisit la police ; defaut **ANSI Shadow**, repli automatique sur **Standard** (ASCII
  pur) si la police est inconnue ou le terminal non-UTF8. La police d'un projet peut etre
  fixee dans `iakaframe.json` -> `bannerFont`.
- **brief `<projet>`** : a l'entree d'un projet, affiche le titre + un tableau (derniere
  etape + backlog) + les agents assignes.
- **recap `<projet>`** : a la fermeture, tableau de session (`--n` derniers commits +
  agents mobilises + projet).
- **jalon** : rend le cadre d'un gate — titre FIGlet **Standard** + tableau
  emetteur / contenu / recepteur. Options : `--project --name --from --to --content
  --files a:1,b:2 --next --validated` (`--validated` affiche l'ecran « JALON VALIDE »).

### Equipe d'agents

```bash
iakaframe agents list
iakaframe agents fullteam --project /chemin/projet     # deploie l'equipe complete
iakaframe agents affect --agent odin --global
iakaframe agents status --project /chemin/projet
```

## Dossier chapeau

Resolu par : `--root` > `IAKAFRAME_ROOT` (env) > defaut OS (`~/work`, ou `C:\work` sur Windows).

## Feuille de route

Le portage depuis les `.ps1` (gardes en power-path Windows) est **livre** pour les 13
commandes : `services` ✅, `config` ✅, `snapshot`/`update` ✅, `onboard`/`init` ✅,
`agents` ✅, `go` ✅ (cross-OS, runners ps/codex/iakaide/aider), ainsi que les rituels de
session `banner` / `brief` / `recap` / `jalon` ✅ et `root` ✅.

À venir : enrichissement des rituels et des runners, ouverture npm publique eventuelle.
iakaIDE embarquera cette CLI en **sidecar** (source de verite unique).
