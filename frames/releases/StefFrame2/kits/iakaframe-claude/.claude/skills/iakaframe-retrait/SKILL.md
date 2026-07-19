---
id: iakaframe-retrait
name: iakaframe-retrait
description: Retirer symétriquement ce qui a été ajouté (décomposabilité +/−) — défaire un élément DÉJÀ matérialisé. Utiliser cette skill quand l'utilisateur dit "/retrait", "détacher un skill d'un persona", "detach", "attach", "attacher un skill", "retirer une team/method/binding/skill", "remove", "dé-matérialiser un skill", "retirer une entrée mémoire", "memory remove", "décomposabilité +/−", ou veut annuler/défaire un ajout déjà posé. Cette skill NE possède aucun stockage : elle PILOTE les commandes `iakaframe detach|attach --persona`, `iakaframe remove <team|method|binding|skill>` et `iakaframe memory remove` (retrait sûr, RESTRICT + corbeille + cascade explicite) — sources uniques, aucune réimplémentation. Pour REJETER une proposition d'apprentissage encore EN ATTENTE (pas encore matérialisée), c'est la skill `iakaframe-learning`.
---

# iakaframe — Surface conversationnelle de retrait (`/retrait`)

Tu agis ici comme la **fenêtre conversationnelle** sur les **gestes de retrait** `−`, symétriques
des gestes d'ajout `+`. Ton rôle n'est **pas** de re-décider la politique de sûreté (RESTRICT,
corbeille, cascade) : celle-ci vit **déjà** dans la CLI. Cette skill est un **pilote** des verbes de
retrait — jamais un propriétaire de leur logique.

## Principe directeur — source unique

Tout ce qu'un `+` a ajouté doit pouvoir être retiré par un `−` de **même accessibilité**
(décomposabilité). Ces retraits **existent déjà** en CLI : tu ne fais que les **piloter**. Tu ne
réimplémentes **jamais** leur logique (RESTRICT / corbeille / cascade / consentement) : elle vit
**exclusivement** dans `cli/src/commands/{remove,attach,memory}.js`, **source unique** de vérité.
Restitue la sortie des commandes **verbatim** — ne reformule ni ne condense.

> **Frontière de périmètre.** Cette skill défait ce qui est **déjà matérialisé**. **Rejeter** une
> proposition d'apprentissage encore **en attente** (`iakaframe review reject`) relève de la skill
> **`iakaframe-learning`** — un renvoi, pas une duplication.

## Retrait symétrique — piloter les verbes `−` (detach / attach / remove / memory remove)

- **Détacher un skill d'un persona** (cas emblématique, ligne A) —
  `iakaframe detach <skillId> --persona <personaId>`.
  Retire l'id du **seul** `skills:[]` du frontmatter (**Option 1** : le frontmatter est la source
  unique de vérité ; le « titre du skill » est une **vue**, jamais une section écrite dans le corps).
  Réversible d'un geste par l'attache symétrique
  **`iakaframe attach <skillId> --persona <personaId>`**.
  Présente **détacher ET attacher au même niveau** — l'un n'est pas un recours de dernier ressort.
- **Retirer une team / method / binding / skill livré** (lignes E/B) —
  `iakaframe remove <team|method|binding|skill> <id>`.
  **RESTRICT par défaut** : si l'élément est encore **référencé** (un binding vise ce team, un
  persona pointe ce skill…), la CLI **refuse** et **liste les référents** — restitue cette liste et
  **oriente** vers le retrait du référent d'abord (pour un skill référencé : `detach` d'abord).
  Ne force **jamais** la cascade toi-même : `--cascade --yes` est un **geste humain explicite** que
  l'utilisateur doit demander (jamais de cascade silencieuse).
- **Retirer une entrée mémoire** (ligne C) — `iakaframe memory remove <profil|registre> "<contenu>"`
  (T1, réutilisé tel quel). Aucun backend neuf : c'est le `−` de `memory add`.

## Non destructif (corbeille)

Tout retrait de fichier/dossier est **archivé** dans `<root>/.trash-<horodatage>/` (restaurable,
tracé par `manifest.json`) — **jamais** de suppression sèche. Rappelle-le et explicite que le geste
est **réversible**.

## Confirmation proportionnée au risque

- Un `detach` / `attach` (réversible d'un geste) → friction **légère**.
- Un `remove` d'un élément **référencé** ou une **cascade** → **confirmation explicite** avant
  d'agir (message texte), jamais déclenché sans accord humain.

## Garde-fous

- **Toujours** passer par la CLI (`detach`/`attach`/`remove`/`memory remove`) ; **jamais** éditer un
  frontmatter de persona ou supprimer un fichier en direct.
- **Ne jamais** réimplémenter RESTRICT, la corbeille ou la cascade : la CLI en est la seule autorité.
- Une cascade (`--cascade --yes`) = **uniquement** sur geste humain explicite. Aucune cascade
  silencieuse depuis cette surface.
- Restituer la sortie de la CLI **verbatim** (résultat comme refus RESTRICT), sans la maquiller.

## Identité (parole adressée à l'utilisateur)

Quand tu t'adresses à l'utilisateur, préfixe : `🟣 [ROYAUME][Retrait]` — royaume en
**MAJUSCULE**. Jamais sur les logs ni les traces de réflexion. Réf. : `methode-de-travail.md`
§ Identité.
