# Instruction (cadrage) : iakaframe multi-OS — CLI Node + iakaIDE GUI

> Phase cadrage (🧙 Gandalf). Statut : 🟢 **VALIDÉ** (2026-06-21) — décisions tranchées, prêt pour réalisation.
> Fait suite à la question : « sous quelle forme livrer iakaframe avec des cibles multi-OS ? »
> Decision de principe retenue avec l'utilisateur : **CLI Node (npm) comme socle multi-OS**,
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
| Kits (`kit-claude/`, `kit-codex/`, `kit-ollama/`) | **Deja OS-agnostiques** (markdown/templates). |
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

1. ✅ **Squelette CLI** (`cli/`, paquet `@naonedge/iakaframe`) : `--version/--help/root`,
   resolution chapeau, **zero dependance** (Node 20 `parseArgs`+`fetch`, commander ecarte).
2. ✅ **`services`** : sondes Forgejo/Ollama/ComfyUI (`--hosts/--json/--timeout`), iso PS.
   Teste en reel (Forgejo v1.26.2, Ollama, ComfyUI).
3. ✅ **`config`** : ecrit `iakaframe.json` (runner/target) + diagnostic dispo. Teste.
4. ✅ **`snapshot` / `update`** : journal append-only + MD + HTML (iso PS) ; update =
   snapshot + commit global + push, avec routage update<->onboard.
5. ✅ **`init` / `onboard`** (+ `--umbrella`) : init (kit + `.iakaframe`) ; onboard =
   structure + Forgejo + 1er commit + etat des lieux + push, routage update-si-existe ;
   **umbrella** = Odin local+global + dashboard + scan (PS si dispo) + projets en attente.
   `agents` (list/affect/fullteam/status) porte aussi.
6. ✅ **`go <projet>`** : lance le runner (ps/codex/iakaide) inline, cross-OS, fallback
   gracieux ; runner lu dans `iakaframe.json` (surcharge `--runner`).
7. ✅ **Distribution** : **publie sur le registre npm prive Forgejo** -> `@naonedge/iakaframe@0.1.0`
   (`latest`). Assets embarques via `scripts/bundle.js` (`_bundled/`, prepack). CI **matrice
   Win/macOS/Linux** (`.forgejo/workflows/cli-ci.yml`).
8. ✅ **Scan dashboard porte en Node** (`naonedge-dashboard/scan.js`, cross-OS, iso scan.ps1 :
   git/tokens/LdC/langages/versions/agents/quality, lookups insensibles a la casse, BOM strippe).
   L'umbrella lance `node scan.js` en priorite (fallback scan.ps1).
9. ✅ **iakaIDE en sidecar** : iakaIDE delegue a la CLI (commande Rust `iakaframe` -> binaire
   bundle ou fallback `node`), cf. iakaIDE `specs/instructions/sidecar-iakaframe.md`. typecheck +
   cargo check OK. **Reste** : compiler le binaire (bun) + `externalBin` pour la prod ; formules
   scoop/brew optionnelles ; bundler le dashboard pour l'umbrella en paquet publie.

## Hors scope (pour l'instant)

Reecriture big-bang ; suppression des `.ps1` (gardes en parallele sur Windows jusqu'a
**parite verifiee**) ; portage du dashboard `scan.ps1` (porte apres la CLI, ou absorbe par
iakaIDE).

## Decisions retenues (reco par defaut, 2026-06-21)

1. **Distribution** : **registre npm prive Forgejo** d'abord (self-hosted / souverainete,
   coherent iakaframe) ; `npm publish` pointe sur le registre Forgejo (`.npmrc` scope ->
   registry). Ouverture **npm public** plus tard si besoin.
2. **Nom du paquet** : **`@naonedge/iakaframe`** (scope = colle au registre prive, evite la
   collision npm public, marque l'atelier). **Binaire** expose : `iakaframe`.
3. **Dossier chapeau** : **`~/work`** par defaut hors Windows, **`C:\work`** sur Windows ;
   surcharge par **`IAKAFRAME_ROOT`** ou `--root`. Resolution via `os.homedir()`.
4. **iakaIDE** : **sidecar de la CLI** (Tauri sidecar) — source de verite unique, zero double
   maintenance. (Reimplementation Rust ecartee.)
5. **Node** : plancher **Node 20 LTS**. Devs : **fnm** (leger, cross-OS) recommande. Non-devs :
   **iakaIDE embarque le Node sidecar** -> rien a installer cote GUI ; CLI seule = fnm/volta.

## Critere de fin (cadrage) — ATTEINT

Decisions tranchees (ci-dessus). **La realisation (🔵 Gimli) peut demarrer** par :
**(1)** squelette CLI `@naonedge/iakaframe` (commander, `--version/--help`, resolution chapeau
`~/work`/`C:\work`) ; **(2)** commande **`services`** (sondes HTTP Forgejo/Ollama/ComfyUI,
`--json`) ; **(3)** commande **`config`** (`iakaframe.json` + diagnostic). Puis snapshot/update,
puis onboard/init.
