---
name: iakaframe-update
description: Exécute le checkpoint « update iakaframe » — régénère l'état des lieux, fait un commit global atomique et pousse sur Forgejo. Utiliser cette skill quand l'utilisateur dit "update iakaframe", "update", "checkpoint", "sauvegarde le projet", "commit global", "pousse tout", "change de version", ou marque une pause de dev qui doit être versionnée. C'est la contrepartie en écriture de l'état des lieux (lecture seule) dans la méthode iakaframe.
---

# iakaframe — Update / checkpoint (commit global + push)

Tu agis ici comme l'**orchestrateur en mode écriture**. Là où la skill
`iakaframe-etat-des-lieux` *constate* sans rien modifier, celle-ci **grave un point de
sauvegarde** : elle régénère l'état des lieux, commite **tout** le travail en cours et
pousse sur Forgejo. C'est le geste réflexe à chaque changement de version et à chaque
pause/reprise.

## Quand l'exécuter

- À **chaque changement de version** (`-Reason version -Version vX.Y.Z`).
- À **chaque pause de dev / reprise** (`-Reason pause` / `-Reason reprise`).
- Comme simple **point de sauvegarde** intermédiaire (filet de sécurité git).

## Procédure

1. **Lancer le script** dans le répertoire du projet (il enchaîne snapshot + commit
   global + push) :
   ```powershell
   pwsh C:\iakaframe\iakaframe-update.ps1 -Reason version -Version v0.4.0 -Note "..."
   ```
   Options : `-Reason version|pause|reprise`, `-Version vX.Y.Z`, `-Note "..."`, `-NoPush`.
   > `pwsh` peut être absent du PATH d'un shell Bash : lancer via PowerShell.
2. **Si le script n'est pas disponible**, reproduire sa séquence à la main :
   ```bash
   # a) régénérer l'état des lieux (faits git)
   pwsh C:\iakaframe\iakaframe-snapshot.ps1 -Reason version -Version v0.4.0
   # b) commit global atomique
   git add -A
   git commit -m "chore(<projet>): update etat des lieux + commit global (version v0.4.0)"
   # c) push (sauf -NoPush)
   git push
   ```
3. **Compléter le récit de reprise** dans `specs/etat-des-lieux.md` (rôle Cowork) si la
   raison est `pause`/`reprise` : ce qui vient d'être fait, ce qui reste, la prochaine
   étape — avant le commit, pour qu'il soit inclus.
4. **Confirmer** à l'humain : version, hash du commit, push OK/KO, arbre propre.

## Garde-fous

- **Commit global = `git add -A`** : tout est pris. Vérifier qu'aucun secret ni artefact
  lourd indésirable n'est embarqué (token, dumps, binaires) — sinon ajuster `.gitignore`
  avant de commiter.
- **Conventional commits** (`chore:`, `feat:`, `fix:`…) pour rester lisible.
- **Jamais de `git reset --hard` ni de `git push --force`** côté IA.
- Si le remote n'existe pas encore → brancher d'abord via la skill `iakaframe-forgejo`.
- `update` sur un projet absent de Forgejo **bascule en `init`** (auto-détection).

## Place dans le cycle

Symétrique de `iakaframe-etat-des-lieux` : l'une lit, l'autre grave. C'est le checkpoint
qui rend la reprise possible — reprendre un projet = lire `etat-des-lieux.md`, pas
fouiller sa mémoire.
