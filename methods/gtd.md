---
id: gtd
name: Méthode GTD (Getting Things Done)
workflowId: gtd-flow
principleIds: [gtd-mind-like-water, gtd-capture-everything, gtd-next-action, gtd-two-minute-rule, gtd-separate-clarify-from-do, gtd-contexts, gtd-outcome-thinking]
ritualIds: [gtd-capture, gtd-clarify, gtd-organize, gtd-weekly-review, gtd-engage]
guardrailIds: [gtd-inbox-zero, gtd-next-action-defined, gtd-no-unclarified-stuff, gtd-trusted-system]
roleKeys: [gtd-practitioner]
scaffoldIds: [gtd-lists]
---
# Méthode GTD (assemblage de discipline)

Assemblage de **discipline** au format réservoir : **que des ids** vers `library/*` partagée — aucun
corps recopié. Ne nomme **aucune persona** (le casting est apparié à la méthode dans `bindings/` via
la `team`). Le narratif de référence est *Getting Things Done: The Art of Stress-Free Productivity*
(David Allen, éd. 2015).

GTD est une méthode de **productivité personnelle** : un **flux en cinq étapes**
(`workflowId: gtd-flow` — Capture → Clarify → Organize → Reflect → Engage) qui vide l'esprit dans un
**système de confiance** régulièrement révisé, pour atteindre l'état « **mind like water** ». Sept
**principes**, cinq **rituels/cadences** (un par étape, pivot = la **revue hebdomadaire**) et quatre
**garde-fous** (inbox à zéro, prochaine action définie, pas de stuff non clarifié, système de
confiance).

> **Rangement réservoir — et la DETTE DÉCLARÉE de cardinalité (N = 1).** Les 7 principes, 5 rituels,
> 4 garde-fous, les 6 rôles (dont 5 **modes**) sont **qualifiés** (`gtd-*`) dans la library partagée.
> **Aucune promotion neutre** : bien que le brouillon liste `weekly-review`, `next-action`,
> `two-minute-rule`, `capture-everything`, `inbox-zero` comme candidats, la posture **CONSERVATRICE**
> (§3.4) interdit de promouvoir sur **une seule frame** — ces atomes n'apparaissent qu'en GTD, donc
> **QUALIFIER** (promotion possible plus tard si une 2ᵉ frame les partage et passe la neutralité).
>
> **GTD est une méthode SOLO — et c'est là que le format frotte (biais de cardinalité, à remonter).**
> Le format présuppose une **équipe** : `roleKeys` castés par des personas distinctes, un
> `coordinator` qui répartit. GTD n'a qu'**un acteur**. Choix de modélisation **assumé** : `roleKeys`
> ne contient qu'**une** clé — `gtd-practitioner`, l'unique siège castable. Les **cinq étapes** sont
> des **rôles-modes** (`gtd-collector|gtd-clarifier|gtd-organizer|gtd-reflector|gtd-engager`, tous
> `scope: mode`) qu'une **même personne** adopte tour à tour ; ils sont référencés par le **workflow**
> (`actorsRoleKeys`), **jamais castés**. Le frame **accueille** la méthode mono-acteur (elle lint à
> exit 0), mais plusieurs champs **dégénèrent** (coordinateur sans coordonnés, périmètres sans
> frontière). C'est le **biais de cardinalité d'équipe** (N ≥ 2 présupposé), à remonter au réservoir
> — dette déclarée assumée (arbitrage 8-2), à solder avec la correction du modèle, pas ici.
