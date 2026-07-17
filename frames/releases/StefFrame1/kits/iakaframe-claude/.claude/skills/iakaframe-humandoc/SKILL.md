---
id: iakaframe-humandoc
name: iakaframe-humandoc
description: Publier/rafraîchir la mémoire humaine d'un projet dans <DOC_TOOL> auto-hébergé — un espace par projet, une vue d'ensemble + une sous-page par doc structurant (CLAUDE.md, specs/PROJET.md, specs/instructions/*, specs/etat-des-lieux.md, docs/qualite/*). À utiliser quand il faut "documenter le projet dans <DOC_TOOL>", "mettre à jour la mémoire humaine", "publier les specs dans <DOC_TOOL>". Idempotent et non destructif.
---

# iakaframe — doc-doc

Exécuteur machine de la **mémoire humaine** <DOC_TOOL> (cf. `methode-de-travail.md` →
« Cycle de documentation → Mémoire humaine »). Publie/rafraîchit les **docs structurants**
d'un projet dans une instance <DOC_TOOL> auto-hébergée, par instrumentation, sans geste manuel.

> **Action récurrente portée par 📖 Nathalie** (gardienne de la mémoire humaine du projet).
> C'est sa skill-outil ; elle la déclenche aux moments de documentation (version, pause/reprise).

Le CLI `humandoc.mjs` est **Node pur, zéro dépendance** (`fetch` natif) : pas de
`npm install`, fonctionne tel quel partout où Node ≥ 18 est présent.

## Modèle de données (tranché avec le décideur)

- **Un espace <DOC_TOOL> par projet** (nommé d'après le projet).
- Dans cet espace : **une page « Vue d'ensemble »** (synthèse + inventaire des sous-pages).
- **Une sous-page par doc structurant**, nommée d'après le **chemin relatif** du fichier.
- **Docs structurants** : `CLAUDE.md`, `specs/PROJET.md`, `specs/instructions/*.md`,
  `specs/etat-des-lieux.md`, `docs/qualite/*.md`. **Jamais le code ni les fichiers générés.**

## Identifiants (résolution en cascade — jamais commités)

Les trois identifiants sont résolus dans cet ordre, **l'env ayant toujours priorité** :

1. **Variables d'env** : `DOC_URL`, `DOC_EMAIL`, `DOC_PASSWORD`.
2. **Repli fichier** : pour toute variable **encore absente** de l'env, lecture d'un fichier
   dotenv local — `$IAKAFRAME_DOC_ENV` s'il est défini, sinon
   `~/.config/iakaframe/doc.env`. Fichier absent/illisible → ignoré silencieusement.

Ce repli permet de fonctionner dans une session fraîche (ex. Claude Desktop) où les variables
d'env ne sont pas exportées, sans jamais mettre de secret dans le code.

| Variable | Rôle |
|---|---|
| `DOC_URL` | base de l'instance <DOC_TOOL> (ex. `<DOC_URL>`) |
| `DOC_EMAIL` | compte <DOC_TOOL> |
| `DOC_PASSWORD` | mot de passe |

**Format du fichier** (`KEY=VALUE`, un par ligne ; `#` = commentaire ; quotes entourantes
optionnelles) :

```
DOC_URL=http://host:port
DOC_EMAIL=email
DOC_PASSWORD=motdepasse
```

> **Sécurité** : `chmod 600 ~/.config/iakaframe/doc.env`, **jamais commité** (ni le
> fichier, ni son contenu). Si après la cascade une valeur manque encore, message net citant
> **et** les variables d'env **et** le chemin du fichier attendu, code de sortie non nul.

## Utilisation

```bash
node humandoc.mjs --project <votre-projet> --root <PROJECT_ROOT>
```

Résout les docs structurants présents sous `--root`, garantit l'espace `--project`,
crée/met à jour la vue d'ensemble + une sous-page par fichier. Le script est dans le
dossier de cette skill (`humandoc.mjs`).

## Idempotence & non-destructivité

- **Espace** : réutilisé par nom s'il existe, créé sinon (jamais de doublon).
- **Pages** : la mise à jour = mise en corbeille de l'ancienne page + recréation du contenu
  frais (l'API n'expose pas de remplacement in-place ; les pages en corbeille disparaissent
  de l'arbre, donc la recherche par nom reste propre). **Relancer deux fois = même état.**
- Ne touche jamais aux espaces/pages hors périmètre du projet.

## Mécanismes API (vérifiés en réel, spike 2026-07-01)

1. Auth : `POST {base}/gotrue/token?grant_type=password` → `access_token` (~2 h).
2. Provision idempotente : `GET {base}/api/user/verify/{token}`.
3. Workspace : `GET {base}/api/workspace` → `data[0].workspace_id`.
4. Arbre : `GET {base}/api/workspace/{wid}/folder?depth=N`.
5. Créer un **espace** : `POST {base}/api/workspace/{wid}/space`
   `{name, space_permission, space_icon, space_icon_color}` → `view_id` (`is_space:true`).
6. Créer une page : `POST {base}/api/workspace/{wid}/page-view`
   `{parent_view_id, layout:0, name}`.
7. Écrire le contenu : `POST {base}/api/workspace/{wid}/page-view/{vid}/append-block`
   `{"blocks":[{"type":"paragraph","data":{"delta":[{"insert":"texte"}]}}]}`.
8. Mise à jour : `POST {base}/api/workspace/{wid}/page-view/{vid}/move-to-trash`
   (pas de `DELETE` : renvoie 405).

## Mise en forme

MVP = **paragraphes texte fidèles** (un paragraphe par ligne). Titres/listes/blocs de code
Markdown fidèles = **différé** (cf. instruction).

## Échec propre

Config absente, instance injoignable, auth refusée → **message net + code de sortie non nul**,
sans stacktrace et **sans bloquer** le flux appelant. Token expiré → ré-auth automatique.
Fichier illisible → ignoré proprement.

## Tests

`node test.mjs` — tests unitaires des fonctions **pures** (résolution des docs, mapping
fichier → blocs, parsing d'arguments, **parseur dotenv** `parseDotenv`) ; le HTTP et l'I/O
fichier d'identifiants sont mockés/évités (fixtures bidon, **aucun secret réel**). La recette réelle se fait
manuellement contre l'instance avec un projet de test, puis nettoyage.

## Hors périmètre (différé tracé)

- Branchement auto dans `iakaframe-update.ps1` / snapshot (la skill est appelable ; le câblage
  aux moments version/pause/reprise est un lot suivant).
- Rendu riche Markdown (titres, listes, code) au-delà du paragraphe.
- Liens cliquables vue d'ensemble → sous-pages (MVP = inventaire texte).
- Secret au keychain (MVP = env, repli fichier dotenv local).
