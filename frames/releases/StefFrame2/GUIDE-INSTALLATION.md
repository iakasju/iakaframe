# Guide d'installation — iakaframe (StefFrame2)

Installation fonctionnelle du frame **exécutable**. Pour la prise en main pas-à-pas (usage
au quotidien), c'est un guide utilisateur séparé (rôle de Nathalie), hors de ce document.

## 1. Prérequis

- **Claude Code** installé.
- **Node.js ≥ 20** (le CLI et les hooks sont en Node pur, zéro dépendance).

## 2. Poser la conf globale `~/.claude` (installeur collision-aware)

**N'utilisez PAS de `cp` bruts** : ils écraseraient un `~/.claude` existant (skills, agents,
CLAUDE.md, settings, mémoire). L'installeur détecte l'existant, **fusionne par défaut**,
**sauvegarde avant toute écriture** et **ne touche jamais** à vos données
(`projects/`, `todos/`, `history`, `plugins/`…).

```bash
# 1) Voir le plan SANS rien écrire (détection + actions par catégorie)
node install.mjs --dry-run

# 2) Poser en fusion sûre (défaut : garde l'existant sur conflit, backup automatique)
node install.mjs            # ou : node install.mjs --yes   (non-interactif)
```

Ce que l'installeur gère (et rien d'autre) : `CLAUDE.md` (bloc `iakaframe:start…end`),
`settings.json` (fusion des hooks), `hooks/*.mjs` (5), `skills/*` (16), `agents/*` (8).

Options :

| Flag | Effet |
|---|---|
| `--dry-run` | Affiche le plan, n'écrit rien, aucun backup. |
| `--merge` | (défaut) Fusion sûre ; sur conflit, garde l'existant. |
| `--overwrite` | Sur collision : écrase (après backup). |
| `--keep` | Sur collision : garde l'existant (skip). |
| `--backup-dir <p>` | Dossier de backup explicite (défaut `~/.claude/.iakaframe-backup-<ts>/`). |
| `--yes` | Non-interactif. |
| `--target <dir>` | Cible alternative (défaut `~/.claude`). |

Wrappers équivalents : `./install.sh [options]` (POSIX) · `./install.ps1 [options]` (Windows).

### Repli manuel (si vous préférez à la main)

1. **Backup** : `cp -R ~/.claude ~/.claude.bak-<date>` (ou zip).
2. **CLAUDE.md** : collez le bloc `iakaframe:start…end` (contenu de
   `kits/iakaframe-claude/global/CLAUDE.md`) **s'il manque** ; ne supprimez rien d'autre.
3. **settings.json** : ajoutez à la main les entrées `hooks` manquantes
   (event + matcher + command) depuis `kits/iakaframe-claude/global/settings.example.json` ;
   gardez vos valeurs. Déposez les hooks dans `~/.claude/hooks/`.
4. **skills / agents / hooks** : copiez **seulement** les éléments **absents** ; n'écrasez
   pas les vôtres.

## 3. Installer le CLI

```bash
cd cli && npm install -g .     # expose la commande `iakaframe` (zéro dépendance, offline)
```

Alternative sans installation globale : `node cli/src/index.js <commande>`.

## 4. Pointer le foyer de la méthode

Le CLI lit les atomes dans le `library/` embarqué du frame. Depuis la racine décompressée :

```bash
export IAKAFRAME_ROOT="$(pwd)"     # dossier chapeau (projets)
# ou passez --root <frame> aux commandes de bibliothèque (list, show, assemble…)
```

Renseignez au besoin les placeholders `<…>` (git : `<GIT_HOST>`, `<GIT_TOKEN>` ; chartes :
`<CHARTES_DIR>`, `<charte-defaut>` → `design-starter`/`starter`).

## 5. Vérifier

```bash
iakaframe banner IAKAFRAME             # titre FIGlet (ANSI Shadow, repli Standard)
iakaframe list personas --root .       # 8 personas
node install.mjs --dry-run             # plan d'installation, sans écrire
```
