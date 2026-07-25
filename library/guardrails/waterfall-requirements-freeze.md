---
id: waterfall-requirements-freeze
label: Gel des exigences (baseline gelée)
kind: baseline
hook: "gouvernance:après la revue des exigences (change control obligatoire pour toute modification)"
policy: "Une fois le SRS baseliné, les exigences sont gelées : aucune modification silencieuse. Tout changement passe par un change control formel (demande, analyse d'impact coût/délai, décision du Project Manager, re-baseline). Le périmètre ne dérive pas en cours de route."
---
# Gel des exigences (baseline gelée)

Garde-fou Waterfall (baseline management / change control). Le narratif de référence est le cycle de
vie en cascade.

**Politique.** Une fois le **SRS baseliné** (revue des exigences signée), les exigences sont
**gelées** : **aucune modification silencieuse**. Tout changement passe par un **change control
formel** — demande écrite, **analyse d'impact** (coût, délai, risque), décision du **Project
Manager**, puis **re-baseline** documentée. Le **périmètre ne dérive pas** en cours de route
(*anti scope-creep*) : c'est le prix de la prédictibilité.

> **Enforcement** — garant : le **Project Manager**, via le processus de change control. Le gel est
> **opposable** (baseline datée et signée) : c'est une donnée, pas une simple bonne intention. Un
> outil peut verrouiller le document baseliné en écriture et n'autoriser une nouvelle version que
> par un ticket de change control tracé. Contrepartie assumée : faible tolérance au changement
> tardif. Portée : le SRS (et, par extension, toute baseline gelée — SDD compris).
