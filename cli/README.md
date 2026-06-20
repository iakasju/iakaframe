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

```bash
iakaframe --version
iakaframe --help
iakaframe root                       # dossier chapeau resolu (~/work | C:\work)
iakaframe services                   # sonde Forgejo / Ollama / ComfyUI
iakaframe services --json ./specs/services.json
iakaframe config --runner ps --target claude    # ecrit iakaframe.json (cwd)
iakaframe config --path /chemin/projet --runner codex
```

## Dossier chapeau

Resolu par : `--root` > `IAKAFRAME_ROOT` (env) > defaut OS (`~/work`, ou `C:\work` sur Windows).

## Feuille de route

Portage incremental depuis les `.ps1` (gardes en power-path Windows jusqu'a parite) :
`services` ✅, `config` ✅ → `snapshot`/`update` → `onboard`/`init` → `go` (cross-OS).
iakaIDE embarquera cette CLI en **sidecar** (source de verite unique).
