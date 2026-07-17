---
id: iakaframe-learning
name: iakaframe-learning
description: Revoir ce que l'agent a appris et proposé, ET retirer symétriquement ce qui a été ajouté (décomposabilité +/−) — la boucle de revue du réservoir de propositions d'apprentissage plus les gestes de retrait. Utiliser cette skill quand l'utilisateur veut voir/valider/rejeter une proposition apprise, dit "/learning", "/iaka", "revoir mes apprentissages", "valider une proposition", "rejeter une proposition", "qu'as-tu appris", "propositions d'apprentissage", OU veut RETIRER ce qui a été ajouté : "détacher un skill d'un persona", "detach", "attach", "attacher un skill", "retirer une team/method/binding", "remove", "dé-matérialiser un skill", "retirer une entrée mémoire", ou pilote la boucle d'apprentissage. Cette skill NE possède aucun stockage : elle PILOTE les commandes `iakaframe review` (revue + garde de consentement) et `iakaframe remove|attach|detach|memory remove` (retrait sûr, RESTRICT + corbeille) — sources uniques.
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

> `reject` retire une proposition **en attente** (T5) ; il ne défait **pas** un élément **déjà
> matérialisé**. Défaire un ajout déjà posé est le rôle des **verbes de retrait** ci-dessous.

## Retrait symétrique — piloter les verbes `−` (detach / attach / remove / memory remove)

Tout ce qu'un `+` a ajouté doit pouvoir être retiré par un `−` de **même accessibilité**
(décomposabilité). Ces retraits **existent déjà** en CLI (1ʳᵉ tranche du chantier symétrie) : tu ne
fais que les **piloter**. Tu ne réimplémentes **jamais** leur logique (RESTRICT / corbeille /
cascade / consentement) : elle vit dans la CLI, **source unique**. Restitue la sortie **verbatim**.

- **Détacher un skill d'un persona** (cas emblématique, ligne A) —
  `iakaframe detach <skillId> --persona <personaId>`.
  Retire l'id du **seul** `skills:[]` du frontmatter (Option 1 : le frontmatter est la source unique
  de vérité ; le « titre du skill » est une **vue**, jamais une section écrite dans le corps).
  Réversible d'un geste par l'attache symétrique **`iakaframe attach <skillId> --persona <personaId>`**.
  Présente **détacher ET attacher au même niveau**.
- **Retirer une team / method / binding / skill livré** (lignes E/B) —
  `iakaframe remove <team|method|binding|skill> <id>`.
  **RESTRICT par défaut** : si l'élément est encore **référencé** (un binding vise ce team, un
  persona pointe ce skill…), la CLI **refuse** et **liste les référents** — restitue cette liste et
  **oriente** vers le retrait du référent d'abord (pour un skill référencé : `detach` d'abord).
  Ne force **jamais** la cascade toi-même : `--cascade --yes` est un **geste humain explicite** que
  l'utilisateur doit demander (jamais de cascade silencieuse).
- **Retirer une entrée mémoire** (ligne C) — `iakaframe memory remove <profil|registre> "<contenu>"`
  (T1, réutilisé tel quel). Aucun backend neuf : c'est le `−` de `memory add`.

**Non destructif (corbeille).** Tout retrait de fichier/dossier est **archivé** dans
`<root>/.trash-<horodatage>/` (restaurable, tracé par `manifest.json`) — **jamais** de suppression
sèche. Rappelle-le et explicite que le geste est **réversible**.

**Confirmation proportionnée au risque.** Un `detach`/`attach` (réversible d'un geste) → friction
légère. Un `remove` d'un élément **référencé** ou une **cascade** → **confirmation explicite** avant
d'agir (message texte), jamais déclenché sans accord humain.

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
