---
name: iakaframe-forgejo
description: Crée ou rebranche le dépôt git d'un projet sur le Forgejo auto-hébergé du homelab iakabox (HTTP + token), avec auto-détection de l'existence du dépôt. Utiliser cette skill quand l'utilisateur veut "créer le dépôt", "brancher Forgejo", "pousser sur iakabox", "mettre le projet sur le git", "ajouter le remote", ou quand une commande init/update iakaframe a besoin de versionner un projet. C'est la brique git par défaut de la méthode iakaframe (composant de l'orchestrateur d'amorçage).
---

# iakaframe — Forgejo (git par défaut, iakabox)

Tu agis ici comme la **brique de versionnement** de la méthode iakaframe. Tout projet
est versionné sur le **Forgejo auto-hébergé du homelab iakabox** — cohérent avec la
préférence *self-hosted d'abord*. Cette skill crée le dépôt distant, branche le remote
et fait le premier push, **sans jamais exposer le token**.

## Le pattern iakabox — NON NÉGOCIABLE

- **URL** : `http://192.168.2.11:3001/sjupin/<repo>.git` (le `<repo>` = nom du dossier).
- **Transport** : **HTTP + token**. Le **SSH de cette box est inutilisable** — ne jamais
  tenter une remote `git@…`.
- **Token** : jamais écrit en dur, jamais commité. Source = `$env:FORGEJO_TOKEN`, ou
  intégré dans le `.git/config` **local** (hors suivi git).
- **Création de dépôt via l'API Forgejo**, avec une **description ASCII uniquement**
  (un caractère non-ASCII → **HTTP 422**).

## Procédure

1. **Détecter l'existence** du dépôt côté Forgejo (API) :
   ```bash
   curl -s -o /dev/null -w "%{http_code}" \
     -H "Authorization: token $FORGEJO_TOKEN" \
     http://192.168.2.11:3001/api/v1/repos/sjupin/<repo>
   ```
   - `200` → le dépôt **existe déjà** : ne pas recréer. Brancher/vérifier le remote, puis
     basculer en logique **update** (cf. skill `iakaframe-update`).
   - `404` → le dépôt **n'existe pas** : passer à l'étape 2.
2. **Créer le dépôt** (description ASCII !) :
   ```bash
   curl -s -X POST \
     -H "Authorization: token $FORGEJO_TOKEN" \
     -H "Content-Type: application/json" \
     http://192.168.2.11:3001/api/v1/user/repos \
     -d '{"name":"<repo>","description":"<ASCII only>","private":true,"auto_init":false}'
   ```
3. **Brancher le remote** s'il n'existe pas déjà (si un `origin` existe, le **garder**) :
   ```bash
   git remote get-url origin 2>/dev/null \
     || git remote add origin http://192.168.2.11:3001/sjupin/<repo>.git
   ```
4. **Premier push** avec le token injecté à la volée (et non persisté en clair) :
   ```bash
   git push -u origin HEAD
   ```
   Si une auth est demandée : utilisateur `sjupin`, mot de passe = le token. Préférer une
   credential injectée par l'environnement plutôt qu'écrite dans l'URL du remote.

> Sous Windows/PowerShell, l'équivalent passe par `Invoke-RestMethod` et
> `$env:FORGEJO_TOKEN`. La logique (détecter → créer → brancher → push) est identique.

## Garde-fous

- **Token : zéro fuite.** Jamais dans un commit, un fichier suivi, un log ou l'URL d'un
  remote committé. En cas de doute, vérifier `git config --get remote.origin.url`.
- **Description ASCII stricte** à la création (sinon 422). Accents/emoji interdits.
- **Ne jamais écraser un `origin` existant.** S'il est déjà là, on le conserve.
- **Jamais de `git push --force`** côté IA (filet de sécurité git).
- Si `$FORGEJO_TOKEN` est absent → s'arrêter et demander à l'humain de le fournir, ne pas
  inventer de credential.

## Place dans le cycle

Brique appelée par l'amorçage (`iakaframe-onboard.ps1` = `iakaframe-init` +
**`iakaframe-forgejo`** + commit + `iakaframe-snapshot`). L'auto-détection init ↔ update
repose sur l'étape 1 (présence du dépôt côté API). Guide complet : `iakabox-usage.html`.
