---
id: iakaframe-learning
name: iakaframe-learning
description: Revoir ce que l'agent a appris et proposé — la boucle de revue du réservoir de propositions d'apprentissage. Utiliser cette skill quand l'utilisateur veut voir/valider/rejeter une proposition apprise, dit "/learning", "/iaka", "revoir mes apprentissages", "valider une proposition", "rejeter une proposition", "qu'as-tu appris", "propositions d'apprentissage", ou pilote la boucle d'apprentissage. Cette skill NE possède aucun stockage : elle PILOTE la commande `iakaframe review` (source unique de la revue et du garde de consentement).
---

# iakaframe — Surface conversationnelle d'apprentissage (`/learning` · `/iaka`)

Tu agis ici comme la **fenêtre conversationnelle** sur le **réservoir de propositions**
d'apprentissage. Ton rôle n'est **pas** de re-décider la politique de consentement ni les
plafonds : ceux-ci vivent **déjà** dans la commande `iakaframe review` (T5). Cette skill est un
**pilote** de `review` — jamais un propriétaire du réservoir.

## Principe directeur — source unique

Le réservoir (`~/.iaka/memory/proposals/`) et toute la logique de revue (lister / montrer /
appliquer / rejeter, `classify()`, matérialisation, plafonds, résolution du canon) **existent
déjà** dans `iakaframe review`. Tu **n'accèdes jamais** au réservoir en direct : tu **passes
toujours** par `review`. Aucune réimplémentation, aucune duplication.

## Parcours (miroir de `review`)

Suis ces étapes, dans l'ordre. Restitue le résultat des commandes **verbatim** — ne reformule ni
ne condense la sortie de `review`.

1. **Lister** — `iakaframe review list`
   Présente les propositions **en attente** (type, cible, politique `auto`/`file`). Ajoute
   `--json` si tu as besoin de parser (`iakaframe review list --json`). Chaque proposition porte un
   `status` (`en-attente` / `applique` / `rejete`) : par défaut, concentre-toi sur `en-attente` ;
   pour consulter l'historique, filtre `--status applique` ou `--status rejete`.

2. **Voir** — `iakaframe review show <id>`
   Montre le détail (quoi / où / **pourquoi** + aperçu de l'artefact). `<id>` = nom du dossier de
   proposition (horodatage--type--slug) ou un préfixe non ambigu.

3. **Valider** — `iakaframe review apply <id>`
   Matérialise l'artefact **à l'endroit légitime**, via `review` :
   - `memory`/`registre`|`profil` → écrit sous **plafond dur** (refus clair si dépassé :
     « consolidation requise ») ;
   - `skill` → crée `library/skills/<id>/SKILL.md` (non destructif) ;
   - `hook`/`config` → **non matérialisables au MVP** (refus propre `type-non-materialisable-mvp`).
   Restitue le résultat (où c'est allé) **ou** le refus, tel quel. Ne re-décide **rien**.

4. **Rejeter / retirer** — `iakaframe review reject <id>`
   Passe le statut à `rejete`, **sans rien matérialiser**. Présente ce geste **au même niveau** que
   valider (voir « Symétrie » ci-dessous) — ce n'est pas un recours de dernier ressort.

## Garde de consentement — à expliciter, jamais à contourner

Le garde vit dans `classify()` (côté `review`), pas ici. Rappelle-le à l'utilisateur mais ne le
contourne jamais :

- **Amendements structurels** (`skill` / `hook` / `config`) → **toujours geste humain requis**,
  **jamais** auto-appliqués, quel que soit le réglage. Tu n'exécutes `apply` que sur **demande
  humaine explicite**.
- **`memory` / `profil`** → **en file** : exige une approbation explicite.
- **`memory` / `registre`** → auto-applicable **seulement** si `write_approval: auto` (sinon en
  file). La passe automatique (`iakaframe review auto`) relève de la **cadence**, pas de cette
  surface humaine : ne la propose pas comme raccourci de revue.

## Symétrie +/− (décomposabilité)

**Rejeter est un geste de premier plan**, aussi accessible que valider — jamais un simple recours.
À chaque proposition présentée, offre **les deux** issues (valider *ou* rejeter) au même niveau.

> Le retrait d'un élément **déjà matérialisé** (une entrée de REGISTRE/PROFIL, un skill promu)
> n'est **pas** un `reject` (la proposition appliquée est terminale) — c'est un chantier de
> décomposabilité **distinct**, hors périmètre de cette skill au MVP.

## Garde-fous

- **Toujours** passer par `iakaframe review` ; **jamais** lire/écrire le réservoir en direct.
- **Ne jamais** réimplémenter la politique de consentement ou les plafonds : `review` en est la
  seule autorité.
- `apply` sur un structurel = **uniquement** sur geste humain explicite. Aucune passe automatique
  depuis cette surface.
- Restituer la sortie de `review` **verbatim** (résultat comme refus), sans la maquiller.

## Identité (parole adressée à l'utilisateur)

Quand tu t'adresses à l'utilisateur, préfixe : `🟣 [ROYAUME][Apprentissage]` — royaume en
**MAJUSCULE**. Jamais sur les logs ni les traces de réflexion. Réf. : `methode-de-travail.md`
§ Identité.
