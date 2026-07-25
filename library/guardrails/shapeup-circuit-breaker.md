---
id: shapeup-circuit-breaker
label: Circuit breaker (pas d'extension automatique)
kind: timebox
hook: "gouvernance:à la fin de chaque cycle de 6 semaines (Betting Table garante)"
policy: "Un projet non fini à la fin du cycle de 6 semaines n'est PAS prolongé par défaut. Il retombe. Pour continuer, il doit être re-façonné puis re-parié EXPLICITEMENT à la table des paris suivante — sur pièces neuves, jamais par inertie. Aucune extension automatique."
---
# Circuit breaker (pas d'extension automatique)

Garde-fou Shape Up (*Shape Up*, Ryan Singer, Basecamp, 2019 — part II, « The Circuit Breaker »). Le
narratif de référence est le livre *Shape Up*.

**Politique.** À la fin des 6 semaines, un projet **non fini n'est PAS prolongé par défaut** : il
**retombe**. Pour qu'il continue, quelqu'un doit le **re-façonner** (avec ce qu'on a appris) puis le
**re-parier explicitement** à la Betting Table suivante — il **repart au même rang** que les autres
pitchs, jamais par simple inertie. C'est le **disjoncteur** de Shape Up : il coupe le courant aux
**projets fuyards** avant qu'ils ne consomment cycle sur cycle.

> **Enforcement** — garde-fou de **gouvernance**, pas *hook* runtime : c'est une **décision de la
> Betting Table**, tenue en cool-down. La règle par défaut est **« ne pas prolonger »** ; prolonger
> exige un **acte positif** (un nouveau pari), l'inverse d'un renouvellement tacite. C'est aussi le
> **contrepoids** de l'autonomie totale de l'équipe : le temps, fixe et **défendu par une décision**,
> est ce qui borne le build en l'absence de tout chef qui surveille. Sans lui, « temps fixe, périmètre
> variable » s'effondrerait à la première échéance manquée. Portée : tout cycle, tout projet.
