---
id: lean-startup
name: Méthode Lean Startup
workflowId: leanstartup-loop
principleIds: [leanstartup-validated-learning, leanstartup-leap-of-faith-assumptions, leanstartup-innovation-accounting,
  leanstartup-get-out-of-the-building, leanstartup-minimize-time-through-the-loop, leanstartup-small-batches, mvp-first]
ritualIds: [leanstartup-build-measure-learn, leanstartup-hypothesis-experiment, leanstartup-learning-review, leanstartup-pivot-or-persevere-review, leanstartup-learning-sprint]
guardrailIds: [leanstartup-mvp-minimal, leanstartup-actionable-metrics, leanstartup-evidence-based-pivot, leanstartup-five-whys]
roleKeys: [leanstartup-founder, leanstartup-customer-developer, leanstartup-builder, leanstartup-early-adopter]
scaffoldIds: [leanstartup-artifacts]
---
# Méthode Lean Startup (assemblage de discipline)

Assemblage de **discipline** au format réservoir : **que des ids** vers `library/*` partagée — aucun
corps recopié. Ne nomme **aucune persona** (le casting est apparié à la méthode dans `bindings/` via
la `team`). Le narratif de référence est *The Lean Startup* (Eric Ries, 2011).

Le Lean Startup est un cadre de **management de l'incertitude extrême** : une petite équipe qui
transforme l'incertitude en **apprentissage validé** via la boucle **build-measure-learn**
(`workflowId: leanstartup-loop`). Ses tenets — apprentissage validé (l'unité de progrès),
hypothèses de foi (value & growth), comptabilité de l'innovation, get-out-of-the-building,
minimisation du temps de boucle, petits lots, MVP — sont éprouvés par des **expériences** et
arbitrés par une **décision pivot-or-persevere** fondée sur la donnée. Les garde-fous protègent le
**minimum** (`leanstartup-mvp-minimal`), l'**honnêteté de la mesure** (`leanstartup-actionable-metrics`),
la **lucidité du cap** (`leanstartup-evidence-based-pivot`) et la **qualité construite dedans**
(`leanstartup-five-whys`).

> **Rangement réservoir.** Les 4 rôles, 6 principes, 5 rituels et 4 garde-fous propres au Lean
> Startup sont **qualifiés** (`leanstartup-*`) dans la library partagée. Deux gestes de dédup
> notables :
> - **`mvp` → RÉFÉRENCE le canon `mvp-first`** (A11). Le principe MVP du brouillon recouvre
>   **exactement** le principe canon `mvp-first` déjà présent (même type, même intention) : la
>   méthode **référence l'id canon**, **aucun `mvp.md` neuf n'est créé**, le canon n'est **pas muté**.
> - **`leanstartup-mvp-minimal` reste QUALIFIÉ** (garde-fou) : c'est un atome de **type différent**
>   (guardrail) de `mvp-first` (principe) — le test d'identité §3.1 (même type) échoue, pas de fusion.
> - Les personas **Ohno** et **Shingo** sont des **homonymes** de personas déjà rangées par Kanban
>   (même figure historique, casting DIFFÉRENT) : elles sont donc **qualifiées** `leanstartup-ohno`
>   et `leanstartup-shingo` pour coexister sans écrasement (règle §3.1 : casting différent = brique
>   différente → QUALIFIER).
>
> **Contraste de gouvernance avec iakaframe.** Là où iakaframe pose un **décideur au-dessus** d'une
> équipe d'experts et une chaîne en **3 phases avec gates**, le Lean Startup **fait gouverner la
> boucle et la donnée** : le fondateur porte la vision et **convoque** la décision de cap, mais ne
> peut pas trancher **contre les faits** (l'apprentissage validé gouverne). Ce n'est ni la hiérarchie
> surplombante d'iakaframe, ni l'auto-gestion sans décideur de Scrum : c'est une **gouvernance par
> l'expérimentation** — le pouvoir appartient à ce que le marché prouve. C'est le même **modèle
> d'assemblage** (méthode = ids vers un réservoir d'atomes agnostiques) au service d'une **quatrième
> gouvernance** — preuve supplémentaire que le frame est neutre vis-à-vis de la gouvernance qu'il
> outille.
