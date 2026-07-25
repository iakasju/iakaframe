---
id: shapeup-no-scope-creep
label: Pas de dérive de périmètre hors des scopes définis
kind: scope
hook: "build:pendant le cycle (équipe garante) ; shaping:no-gos déclarés en amont (Shaper garant)"
policy: "On ne laisse pas le périmètre gonfler hors des scopes définis. Les no-gos déclarés au shaping restent hors périmètre ; les nouvelles envies (nice-to-have, could-have) ne s'invitent pas dans le cycle — elles vont sur une liste « plus tard », jamais dans le travail en cours. Un nice-to-have ne devient pas un must-have par glissement."
---
# Pas de dérive de périmètre hors des scopes définis

Garde-fou Shape Up (*Shape Up*, Ryan Singer, Basecamp, 2019 — part I « No-gos », part III « Scopes »).
Le narratif de référence est le livre *Shape Up*.

**Politique.** Le périmètre **ne gonfle pas** hors des **scopes définis**. Deux verrous : (1) les
**no-gos** déclarés au **shaping** restent explicitement **hors périmètre** — on ne les rouvre pas en
cours de cycle ; (2) les envies nouvelles (nice-to-have, could-have) **ne s'invitent pas** dans le
travail en cours — elles vont sur une liste **« plus tard »** (candidates à un futur façonnage), jamais
dans le cycle. Un **nice-to-have ne devient pas un must-have** par glissement silencieux.

> **Enforcement** — double comptabilité : le **Shaper** borne en **amont** (no-gos dans la pitch), et
> l'**équipe de build** tient la ligne **pendant** le cycle par le **scope hammering**. Ce n'est pas
> un gel du périmètre (Shape Up assume qu'on **découvre** en construisant et qu'on **taille**) mais un
> refus de la **dérive** : on **réduit** volontiers, on **n'ajoute pas** furtivement. Aucun *hook*
> runtime ne le force ; c'est une discipline. Le **circuit breaker** sanctionne le non-respect en aval.
> Portée : Shaper (amont) et équipe de build (pendant).
