# Brancher un projet sur votre serveur git (self-hosted, HTTP + token)

> Mini-guide générique de la méthode iakaframe. Objectif : versionner un projet sur **votre
> propre serveur git auto-hébergé** en **HTTP + token**, sans jamais exposer de secret.
> Tout ce qui est propre à votre infra apparaît en **placeholder `<...>`** — remplacez-le
> par votre valeur.

## Placeholders à renseigner

| Placeholder | Ce que vous mettez à la place |
|---|---|
| `<GIT_HOST>` | La base HTTP de votre serveur git, ex. `https://git.exemple.local` |
| `<GIT_REMOTE_URL>` | L'URL complète du dépôt distant, ex. `<GIT_HOST>/<vous>/<repo>.git` |
| `<GIT_TOKEN>` | Un jeton d'accès personnel (Personal Access Token) de votre serveur git |
| `<vous>` | Votre nom d'utilisateur sur le serveur git |
| `<repo>` | Le nom du dépôt (par convention = nom du dossier du projet) |

> **Le jeton ne doit JAMAIS être écrit en dur ni commité.** Sources acceptées : une variable
> d'environnement, ou le `.git/config` **local** (hors suivi git).

## 1. Vérifier / créer le dépôt distant

Beaucoup de serveurs git self-hosted exposent une API HTTP. Détecter l'existence du dépôt :

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token <GIT_TOKEN>" \
  <GIT_HOST>/api/v1/repos/<vous>/<repo>
```

- `200` → le dépôt existe déjà : passez à l'étape 2 (branchement du remote).
- `404` → le dépôt n'existe pas : créez-le, puis passez à l'étape 2.

Créer le dépôt (adaptez le chemin d'API à votre serveur ; certaines API exigent une
**description en ASCII pur**, sinon une erreur `HTTP 422`) :

```bash
curl -s -X POST \
  -H "Authorization: token <GIT_TOKEN>" \
  -H "Content-Type: application/json" \
  <GIT_HOST>/api/v1/user/repos \
  -d '{"name":"<repo>","description":"<description ASCII>","private":true,"auto_init":false}'
```

> Si votre serveur n'a pas d'API, créez simplement le dépôt via son interface web, puis
> continuez à l'étape 2.

## 2. Brancher le remote (sans écraser un `origin` existant)

```bash
git remote get-url origin 2>/dev/null \
  || git remote add origin <GIT_REMOTE_URL>
```

## 3. Premier push

```bash
git push -u origin HEAD
```

Si une authentification est demandée : utilisateur = `<vous>`, mot de passe = votre
`<GIT_TOKEN>`. Préférez un jeton injecté par l'environnement plutôt qu'écrit dans l'URL du
remote (le token ne doit pas se retrouver dans un remote committé).

## Garde-fous

- **Jeton : zéro fuite.** Jamais dans un commit, un fichier suivi, un log, ni l'URL d'un
  remote committé. En cas de doute : `git config --get remote.origin.url`.
- **Ne jamais écraser un `origin` existant** : s'il est déjà là, on le conserve.
- **Jamais de `git push --force`** côté agent (filet de sécurité git).
- Si le jeton est absent → s'arrêter et le demander, ne pas inventer de credential.

## Transport

- **HTTP + token** par défaut (portable, marche partout).
- Le **SSH** peut être indisponible selon la configuration de votre serveur ; en cas de doute,
  restez en HTTP + token.
