---
id: iakaframe-forgejo
name: iakaframe-forgejo
description: Crée ou rebranche le dépôt git d'un projet sur le Forgejo auto-hébergé du VPS NaonEdge (git.naonedge.com, HTTPS + token), avec auto-détection de l'existence du dépôt et repli sur le Forgejo LAN (NAS, iakabox) en miroir. Utiliser cette skill quand l'utilisateur veut "créer le dépôt", "brancher Forgejo", "pousser sur le VPS", "pousser sur iakabox", "mettre le projet sur le git", "ajouter le remote", ou quand une commande init/update iakaframe a besoin de versionner un projet. C'est la brique git par défaut de la méthode iakaframe (composant de l'orchestrateur d'amorçage).
layer: product
---

# iakaframe — Forgejo (git par défaut, VPS git.naonedge.com)

Tu agis ici comme la **brique de versionnement** de la méthode iakaframe. Tout projet
est versionné sur le **Forgejo auto-hébergé du VPS NaonEdge** — cohérent avec la
préférence *self-hosted d'abord*, et joignable de partout, hors du LAN comme dedans.
Cette skill crée le dépôt distant, branche le remote et fait le premier push, **sans
jamais exposer le token**.

## Le pattern — NON NÉGOCIABLE

- **URL** : `https://git.naonedge.com/sjupin/<repo>.git` (le `<repo>` = nom du dossier).
- **Transport** : **HTTPS + token**. Pas de remote `git@…` : le SSH n'est pas le canal
  de la méthode.
- **Token** : jamais écrit en dur, jamais commité. Source = `$env:FORGEJO_TOKEN`, ou
  intégré dans le `.git/config` **local** (hors suivi git).
- **Création de dépôt via l'API Forgejo**, dépôt **privé** par défaut, avec une
  **description ASCII uniquement** (un caractère non-ASCII → **HTTP 422**).
- **Canaux de secours** (miroirs, jamais en tête) : le NAS `http://192.168.1.139:3001`
  puis l'ancienne iakabox `http://192.168.2.11:3001`, HTTP + token, SSH inutilisable.
  Ils ne servent que si le LAN répond ; on les réaligne par `git push <remote> main --tags`.

## Procédure

1. **Détecter l'existence** du dépôt côté Forgejo (API) :
   ```bash
   curl -s -o /dev/null -w "%{http_code}" \
     -H "Authorization: token $FORGEJO_TOKEN" \
     https://git.naonedge.com/api/v1/repos/sjupin/<repo>
   ```
   - `200` → le dépôt **existe déjà** : ne pas recréer. Brancher/vérifier le remote, puis
     basculer en logique **update** (cf. skill `iakaframe-update`).
   - `404` → le dépôt **n'existe pas** : passer à l'étape 2.
2. **Créer le dépôt** (description ASCII !) :
   ```bash
   curl -s -X POST \
     -H "Authorization: token $FORGEJO_TOKEN" \
     -H "Content-Type: application/json" \
     https://git.naonedge.com/api/v1/user/repos \
     -d '{"name":"<repo>","description":"<ASCII only>","private":true,"auto_init":false}'
   ```
3. **Brancher le remote**. Sur un projet neuf, c'est `origin`. Si un `origin` existe déjà
   et pointe ailleurs (GitHub, LAN…), on le **garde** et on ajoute le VPS sous le nom `vps` :
   ```bash
   git remote get-url origin 2>/dev/null \
     && git remote add vps https://git.naonedge.com/sjupin/<repo>.git \
     || git remote add origin https://git.naonedge.com/sjupin/<repo>.git
   ```
4. **Premier push** avec le token injecté à la volée (et non persisté en clair), branche
   **et tags** :
   ```bash
   git push -u origin HEAD && git push origin --tags
   ```
   Si une auth est demandée : utilisateur `sjupin`, mot de passe = le token. Préférer une
   credential injectée par l'environnement plutôt qu'écrite dans l'URL du remote.

> Le CLI `iakaframe` est cross-OS (Node) : la même commande vaut sous Windows, macOS et
> Linux. Seule change la façon de fournir le token (`$env:FORGEJO_TOKEN` sous PowerShell,
> `$FORGEJO_TOKEN` sous bash/zsh). La logique (détecter → créer → brancher → push) est
> identique. Les canaux sont pilotés par `FORGEJO_URL` / `FORGEJO_TOKEN` dans
> `<chapeau>/.env`, au format CSV ordonné (VPS en tête, secours ensuite) ; les constantes
> de `cli/src/lib/forgejo.js` ne sont qu'un filet de dernier recours, dans le même ordre.

## Garde-fous

- **Token : zéro fuite.** Jamais dans un commit, un fichier suivi, un log ou l'URL d'un
  remote committé. En cas de doute, vérifier `git config --get remote.origin.url`.
- **Description ASCII stricte** à la création (sinon 422). Accents/emoji interdits.
- **Ne jamais écraser un `origin` existant.** S'il est déjà là, on le conserve.
- **Jamais de `git push --force`** côté IA (filet de sécurité git).
- Si `$FORGEJO_TOKEN` est absent → s'arrêter et demander à l'humain de le fournir, ne pas
  inventer de credential.
- **Un token par forge** : le token du VPS n'est pas celui du NAS. En CSV, l'ordre des
  tokens suit l'ordre des URL.

## Place dans le cycle

Brique appelée par l'amorçage (`iakaframe onboard` = `iakaframe init` + branchement
Forgejo (lib `cli/src/lib/forgejo.js`) + commit + `iakaframe snapshot`). Le geste
« brancher/créer le dépôt distant **hors onboarding complet** » a son propre verbe CLI
**provider-neutre** : `iakaframe repo [<nom>] --provider forgejo` (défaut) — `--create`
**requis** pour créer, sinon test d'existence + remote **local** seulement (garde de sûreté).
Forgejo n'est **jamais** un nom de geste : c'est la valeur par défaut de `--provider`, servie
par l'adaptateur `cli/src/lib/forgejo.js` via le registre `cli/src/lib/providers.js` (point
d'extension : gitlab/github demain = un `+`). L'auto-détection init ↔ update repose sur
l'étape 1 (présence du dépôt côté API). Guide du miroir LAN : `iakabox-usage.html`.
