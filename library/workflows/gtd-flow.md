---
id: gtd-flow
name: GTD — flux en cinq étapes (Capture → Clarify → Organize → Reflect → Engage)
kind: flow
container: none
phases:
  - { id: capture,  label: "Capture (collecte)",        ritual: gtd-capture,        actorsRoleKeys: [gtd-collector],  input: "tout ce qui accroche l'attention", output: "items bruts dans les inbox" }
  - { id: clarify,  label: "Clarify (traitement)",       ritual: gtd-clarify,        actorsRoleKeys: [gtd-clarifier],  input: "items bruts dans les inbox", output: "décisions : jetable / référence / someday / prochaine action / projet" }
  - { id: organize, label: "Organize (rangement)",       ritual: gtd-organize,       actorsRoleKeys: [gtd-organizer],  input: "items clarifiés", output: "système à jour : listes par contexte, projets, calendrier, waiting-for, someday, référence" }
  - { id: reflect,  label: "Reflect (revue)",            ritual: gtd-weekly-review,  actorsRoleKeys: [gtd-reflector],  input: "système + horizons de focus", output: "système actuel et digne de confiance (chaque projet a une prochaine action)" }
  - { id: engage,   label: "Engage (faire)",             ritual: gtd-engage,         actorsRoleKeys: [gtd-engager],    input: "listes de prochaines actions (par contexte/temps/énergie/priorité)", output: "actions accomplies + nouveaux items re-capturés" }
soleActor: lee
loop: "flux continu : Engage re-alimente Capture (ce qui émerge est re-capturé) ; Reflect (revue hebdomadaire) restaure périodiquement la confiance du système entier"
---
# Workflow GTD — flux en cinq étapes

Le flux de travail GTD (*Getting Things Done*, David Allen) : **Capture → Clarify → Organize →
Reflect → Engage**. Le narratif de référence est le livre.

Ce n'est **ni un pipeline à gates hiérarchiques** (aucune autorité n'autorise le passage d'une
étape à l'autre — il n'y a qu'**un seul acteur**), **ni un cycle d'équipe** (pas de rôles distincts
se passant le relais). C'est un **flux personnel continu** : une **même personne** (`soleActor: lee`)
traverse les cinq étapes, en **changeant de mode** (`gtd-collector`, `gtd-clarifier`, `gtd-organizer`,
`gtd-reflector`, `gtd-engager` — tous `scope: mode`), pas en passant la main à quelqu'un d'autre.

- **Capture** : sortir de la tête vers les inbox (réflexe continu).
- **Clarify** : décider ce que chaque item est (actionnable ? prochaine action ? 2 minutes ?).
- **Organize** : ranger chaque décision à sa place dans le système de confiance.
- **Reflect** : revoir (pilier = **revue hebdomadaire**) pour garder le système à jour.
- **Engage** : faire, la tête libre, selon contexte / temps / énergie / priorité.

> **Où le format frotte.** Le champ `actorsRoleKeys` de chaque phase désigne, dans un frame
> d'équipe, **qui** agit — impliquant des **acteurs distincts** se relayant. Ici, les cinq clés
> pointent des **modes du même acteur** : `soleActor: lee` le dit explicitement. Le workflow reste
> exprimable dans la grammaire, mais le sous-entendu « une phase = un intervenant distinct » ne
> tient pas pour une méthode **mono-acteur**. La boucle n'est pas rythmée par des **événements
> d'équipe** mais par deux **cadences personnelles** : le re-capture **continu** (Engage → Capture)
> et la **revue hebdomadaire** qui restaure la confiance du système entier.
