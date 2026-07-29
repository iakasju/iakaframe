---
id: iakaframe-memoire-humaine
name: iakaframe-memoire-humaine
description: Publier et rafraîchir la mémoire humaine d'un projet — un espace par projet, structuré selon le modèle iakadoc (00 Vue d'ensemble, 10 Le projet, 20 Où on en est, 30 Décisions & cadrage, 40 Qualité, 50 Recette, 60 Guide utilisateur, 90 Notes), alimenté par les docs structurants (CLAUDE.md, specs/PROJET.md, specs/instructions/*, specs/etat-des-lieux.md, docs/qualite/*, specs/recettes/* en statut seul, docs/**.md hors qualite/), de façon idempotente et non destructive. Utiliser cette skill quand l'utilisateur veut "publier la mémoire humaine", "documenter le projet hors du dépôt", "mettre à jour la mémoire humaine", "publier les specs dans l'espace du projet". Capacité agnostique du produit : l'outil de publication concret est porté par le sous-skill sélectionné à l'install.
layer: capacity
subskills: [iakaframe-appflowy-doc]
---

# iakaframe — Mémoire humaine (capacité)

Tu agis ici comme la **capacité de mémoire humaine** de la méthode iakaframe : tenir, hors
du dépôt, une trace **lisible et durable** des décisions et des docs structurants d'un
projet. C'est **ce qu'on veut faire** — pas **avec quel outil**. Le *comment* concret
(l'outil de publication, ses endpoints, ses identifiants) est **délégué au sous-skill
sélectionné à l'install**, jamais gravé ici.

> **Agnosticisme, règle cardinale.** Cette skill ne nomme **aucun** produit, aucun serveur,
> aucun endpoint, aucune IP, aucune variable d'identifiant. Elle décrit la capacité et ses
> garde-fous ; le concret descend dans la couche produit.

## Ce que porte la capacité

- **Un espace par projet** (nommé d'après le projet).
- Dans cet espace : le **modèle `iakadoc`** (ci-dessous) — une **vue d'ensemble**, puis des
  sections numérotées et **ordonnées**, et une **zone d'écriture humaine** isolée.
- **Une page par doc structurant**, nommée d'après le **titre lisible** du document — jamais
  d'après le chemin brut, qui figure dans l'avertissement en tête de page.
- **Miroir humain** de l'état des lieux du dépôt, pas son remplaçant : c'est la trace
  destinée à être **lue par des humains**.

### Le modèle `iakadoc` — il appartient à la CAPACITÉ

Le **modèle** est ici ; sa **mécanique** (endpoints, format de blocs, cache) appartient au
produit. Un autre outil de publication devrait rendre **ce** modèle-là.

```
[ESPACE]  <Projet>
├── 00 · Vue d'ensemble ....... GÉNÉRÉE (version, sections présentes/absentes, compteurs,
│                               pages non gérées)
├── 10 · Le projet ............ [conteneur] 11 Cadre de travail · 12 Vision & décisions
├── 20 · Où on en est ......... miroir de l'état des lieux
├── 30 · Décisions & cadrage .. [conteneur] index + une page par instruction
├── 40 · Qualité .............. [conteneur] index + une page par version
├── 50 · Recette .............. STATUT seul · TOUJOURS présente (« aucune recette » si vide)
├── 60 · Guide utilisateur .... [conteneur] index + une page par doc · ABSENT si vide
└── 90 · Notes ................ HUMAINE · create-if-missing · JAMAIS écrasée, JAMAIS balayée
```

Les préfixes `70` et `80` sont **réservés**. Une section **vide n'est pas créée** ; son absence
est **listée** dans la vue d'ensemble — sauf `50`, qui affiche explicitement son vide.

### Le périmètre de collecte — **le contrat de corpus**

| Entrée du dépôt | Traitement | Section |
|---|---|---|
| `CLAUDE.md` | miroir | `11` |
| `specs/PROJET.md` | miroir | `12` |
| `specs/etat-des-lieux.md` | miroir | `20` |
| `specs/instructions/*` | miroir | `30` |
| `docs/qualite/*` | miroir | `40` |
| `specs/recettes/*` | **statut seulement** — le document n'est **jamais** reproduit | `50` |
| `docs/**` **hors** `qualite/` | miroir, collecte **récursive** | `60` |

**Jamais le code**, jamais les fichiers générés, jamais les données de simulation. **Tout
fichier dont le nom de base commence par `_` est un gabarit et n'est JAMAIS publié** — règle
sans exception : un projet qui voudrait en publier un doit le **renommer**.

> **Ce contrat est dupliqué en cinq endroits** — le produit (code + sa fiche), la présente
> capacité, la méthode (§ « Mémoire humaine », le *quoi* et le *comment*) et le rôle de
> documentation. Toute évolution du périmètre se propage aux cinq **dans le même lot**.

## Délégation au concret

Le **quoi** est ici ; le **comment** est dans le sous-skill produit :

- Le **produit** (feuille de la chaîne, sélectionné à l'install) porte la **mécanique
  concrète** : outil de publication, base et endpoints, résolution des identifiants, CLI.

Autrement dit : pour *publier/rafraîchir la mémoire humaine*, cette capacité **renvoie au
produit installé** ; l'outil réel est celui **présent chez l'utilisateur** (présence =
sélection).

## Garde-fous (principes, sans nommer de produit)

- **Idempotent** : relancer deux fois laisse le **même état** (espace réutilisé par nom,
  pages rafraîchies sans doublon).
- **Non destructif** : ne toucher **jamais** aux espaces/pages hors du périmètre du projet.
- **Ne retirer QUE ce qu'on a écrit.** Une page que la publication ne reconnaît pas — parce
  qu'elle ne l'a jamais créée — est **laissée en place** et **signalée** dans la vue
  d'ensemble. On garde le miroir propre **sans jamais détruire ce qu'on n'a pas écrit**.
- **La zone d'écriture humaine est inviolable** : jamais réécrite, jamais retirée, jamais
  visitée — elle et **tous** ses descendants, quels que soient leur nombre et leur nom.
- **Secret jamais commité** : les identifiants d'accès sont fournis par **variables
  d'environnement** (jamais en clair, jamais dans un fichier suivi). Le concret (noms des
  variables, transport) vit dans le produit.
- **Échec propre non bloquant** : configuration absente, service injoignable ou auth
  refusée → **message net + code de sortie non nul**, **sans bloquer** le flux appelant.

## Place dans le cycle

Capacité invoquée aux **moments de documentation** (changement de version, pause/reprise),
typiquement par la gardienne de la mémoire humaine du projet. Les rôles qui l'appellent
réfèrent **cette capacité**, pas un outil particulier ; le produit effectif est celui
**installé chez l'utilisateur**. La même capacité sert tous les environnements sans
réécriture.
