---
name: iakaframe-appflowy-doc
description: Publier/rafraîchir la mémoire humaine d'un projet dans AppFlowy auto-hébergé — un espace par projet, une vue d'ensemble + une sous-page par doc structurant (CLAUDE.md, specs/PROJET.md, specs/instructions/*, specs/etat-des-lieux.md, docs/qualite/*). À utiliser quand il faut "documenter le projet dans AppFlowy", "mettre à jour la mémoire humaine", "publier les specs dans AppFlowy". Idempotent et non destructif.
---

# iakaframe — appflowy-doc

Exécuteur machine de la **mémoire humaine** AppFlowy (cf. `methode-de-travail.md` →
« Cycle de documentation → Mémoire humaine »). Publie/rafraîchit les **docs structurants**
d'un projet dans une instance AppFlowy auto-hébergée, par instrumentation, sans geste manuel.

Le CLI `appflowy-doc.mjs` est **Node pur, zéro dépendance** (`fetch` natif) : pas de
`npm install`, fonctionne tel quel partout où Node ≥ 18 est présent.

## Modèle de données (tranché avec Stéphane)

- **Un espace AppFlowy par projet** (nommé d'après le projet).
- Dans cet espace : **une page « Vue d'ensemble »** (synthèse + inventaire des sous-pages).
- **Une sous-page par doc structurant**, nommée d'après le **chemin relatif** du fichier.
- **Docs structurants** : `CLAUDE.md`, `specs/PROJET.md`, `specs/instructions/*.md`,
  `specs/etat-des-lieux.md`, `docs/qualite/*.md`. **Jamais le code ni les fichiers générés.**

## Pré-requis (variables d'env — jamais commitées)

| Variable | Rôle | Défaut |
|---|---|---|
| `APPFLOWY_URL` | base de l'instance AppFlowy | — (requis) |
| `APPFLOWY_EMAIL` | compte AppFlowy | — (requis) |
| `APPFLOWY_PASSWORD` | mot de passe | — (requis) |

## Utilisation

```bash
node appflowy-doc.mjs --project iakacockpit --root ~/work/IakaCockpit
```

Résout les docs structurants présents sous `--root`, garantit l'espace `--project`,
crée/met à jour la vue d'ensemble + une sous-page par fichier. Le script est dans le
dossier de cette skill (`appflowy-doc.mjs`).

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
fichier → blocs, parsing d'arguments) ; le HTTP est mocké/évité. La recette réelle se fait
manuellement contre l'instance avec un projet de test, puis nettoyage.

## Hors périmètre (différé tracé)

- Branchement auto dans `iakaframe-update.ps1` / snapshot (la skill est appelable ; le câblage
  aux moments version/pause/reprise est un lot suivant).
- Rendu riche Markdown (titres, listes, code) au-delà du paragraphe.
- Liens cliquables vue d'ensemble → sous-pages (MVP = inventaire texte).
- Secret au keychain (MVP = env).
