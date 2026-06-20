# Instruction (cadrage) : iakaframe multi-OS — CLI Node + iakaIDE GUI

> Phase cadrage (🧙 Gandalf). Statut : 🔵 **à valider / à planifier**.
> Fait suite à la question : « sous quelle forme livrer iakaframe avec des cibles multi-OS ? »
> Decision de principe retenue avec Stephane : **CLI Node (npm) comme socle multi-OS**,
> **iakaIDE (Tauri) comme GUI cross-platform** au-dessus, **scripts `.ps1` gardes en
> power-path Windows** le temps d'atteindre la parite.

## Besoin (decideur)

Permettre a un utilisateur **hors Windows** (ex. l'ami sous Codex/macOS) d'installer et
d'utiliser iakaframe aussi simplement que nous sous Windows : onboarding, structure,
etat des lieux, services, conf projet (runner), qualite — **sans dependre de PowerShell
ni des specificites Windows**.

## Etat actuel (ce qui bloque / ce qui est deja portable)

| Brique | Etat multi-OS |
|---|---|
| Scripts `*.ps1` (onboard/init/snapshot/update/agents/services/alternatives/config) | **Windows-centric** : `C:\work`, registre `HKCU` (protocole `naonwork://`), `wt.exe`, chemins. **= le verrou.** |
| Kits (`kit/`, `kit-codex/`, `kit-ollama/`) | **Deja OS-agnostiques** (markdown/templates). |
| Stack qualite (`stack-qualite/`, SonarQube+Allure) | **OS-agnostique** (Docker). Inchangee. |
| Acces Forgejo / Sonar | HTTP + token = **portable**. |
| Dashboard NaonEdge (`scan.ps1`, bouton Go) | PowerShell + protocole Windows = **a porter / deleguer a iakaIDE**. |

## Architecture cible

- **Paquet npm `iakaframe`** exposant un binaire : `npx iakaframe <commande>` ou
  `npm i -g iakaframe`. Node LTS (>=20). Lib de commandes (commander/yargs).
- **Templates embarques** : les kits sont packages dans le module (copies a l'onboarding
  selon `--target claude|codex|ollama`).
- **Config & chapeau portables** : dossier chapeau via `$HOME` (`~/work` hors Windows,
  `C:\work` sur Windows par defaut, surchargable `--root`/`IAKAFRAME_ROOT`). Conf projet =
  `iakaframe.json` (deja en place, lu par le dashboard).
- **iakaIDE = GUI cross-platform** : Tauri builde Win/macOS/Linux. iakaIDE **embarque la CLI
  Node en sidecar** (Tauri sidecar) -> **source de verite unique** (pas de double
  implementation de la logique). La CLI reste utilisable seule (CI / sans GUI).
- **Source de verite** : la logique vit dans la **CLI**, consommee par iakaIDE et le shell.

## Mapping commandes PS -> CLI (parite visee)

| Aujourd'hui (PS) | Demain (CLI) |
|---|---|
| `iakaframe-onboard.ps1 -Target -Umbrella -InitProjects` | `iakaframe onboard [--target] [--umbrella] [--init-projects]` |
| `iakaframe-init.ps1 -Target` | `iakaframe init [--target]` |
| `iakaframe-snapshot.ps1 -Reason -Version -Note` | `iakaframe snapshot --reason --version --note` |
| `iakaframe-update.ps1 -Reason -Version -NoPush` | `iakaframe update [--reason] [--no-push]` |
| `iakaframe-services.ps1 -Json` | `iakaframe services [--json]` |
| `iakaframe-alternatives.ps1` | `iakaframe alternatives` |
| `iakaframe-config.ps1 -Runner -Target` | `iakaframe config [--runner] [--target]` |
| `iakaframe-agents.ps1 -Action fullteam` | `iakaframe agents <action>` |

## Abstractions OS (a traiter une fois)

- **Chemins** : `path.join`, `os.homedir()` ; jamais de litteral `C:\...`.
- **Git / HTTP** : `simple-git` (ou git CLI) + `fetch` natif Node ; deja portable.
- **Bouton « Go » / protocole** : pas de registre hors Windows. Trois options a trancher :
  (a) handler de protocole par OS (`xdg`, `LSSetDefaultHandler`, `HKCU`), (b) **deleguer a
  iakaIDE** (l'app gere l'action), (c) lien `iakaframe go <projet>` invoque par le terminal.
  *Reco : (b) a terme, (a)/(c) en attendant.*
- **Terminal** : remplacer `wt.exe` par un lanceur par OS (Windows Terminal / `open -a
  Terminal` / `x-terminal-emulator`) — ou laisser iakaIDE ouvrir son terminal integre.
- **Encodage / fins de ligne** : UTF-8, LF ; `.gitattributes` pour neutraliser CRLF.

## Plan de migration (incremental, non destructif)

1. **Squelette CLI** : `iakaframe --version`, `--help`, arbo commandes (commander). Publiable.
2. **`services`** (le plus simple : sondes HTTP pures) -> 1re commande portee, valeur immediate.
3. **`config`** (ecrit `iakaframe.json` + diagnostic) -> rapide, utile au bouton Go.
4. **`snapshot` / `update`** (git + generation MD/HTML de l'etat des lieux).
5. **`onboard` / `init`** (FS + git + API Forgejo + templates) -> le gros morceau.
6. **Go / protocole** cross-platform (ou delegation iakaIDE).
7. **Distribution** : `npm publish` (public) **ou** registre **npm prive Forgejo** ; formules
   optionnelles **scoop** (Win) / **brew** (macOS). CI **matrice Win/macOS/Linux** (parite).

## Hors scope (pour l'instant)

Reecriture big-bang ; suppression des `.ps1` (gardes en parallele sur Windows jusqu'a
**parite verifiee**) ; portage du dashboard `scan.ps1` (porte apres la CLI, ou absorbe par
iakaIDE).

## Decisions a confirmer (Stephane)

1. **Distribution** : npm **public** (visibilite, simplicite) vs registre **prive Forgejo**
   (souverainete) ? *(reco : prive Forgejo d'abord, public ensuite si ouverture.)*
2. **Nom du paquet** : `iakaframe` (verifier dispo npm) / scope `@naonedge/iakaframe`.
3. **Dossier chapeau hors Windows** : `~/work` par defaut ? (`IAKAFRAME_ROOT` pour surcharge.)
4. **iakaIDE** : sidecar de la CLI (reco) vs reimplementation Rust ?
5. **Node** : version plancher (>=20 LTS) et gestion d'install pour non-devs (volta/fnm ?).

## Critere de fin (cadrage)

Instruction validee + ordre des commandes a porter fige + decisions ci-dessus tranchees.
La realisation (🔵 Gimli) demarre alors par le **squelette CLI + `services`**.
