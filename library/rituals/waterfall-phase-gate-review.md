---
id: waterfall-phase-gate-review
label: Revue de fin de phase (phase gate / tollgate)
triggers: [revue de phase, phase gate, tollgate, franchir le gate, clore la phase]
cadence: "à chaque frontière de phase (entre deux phases consécutives)"
timebox: "aucune (revue conduite jusqu'à décision de gate ; pas de time-box)"
actions:
  - "Vérifier les critères de sortie de la phase qui se clôt (checklist du gate)"
  - "Revoir le livrable documentaire de la phase (SRS, SDD, build, rapport de test) pour complétude et cohérence"
  - "Contrôler la traçabilité amont/aval (aucun maillon manquant)"
  - "Décision de gate présidée par le Project Manager : signer le passage, ou renvoyer en correction (pas de passage partiel)"
  - "Baseliner (geler) le livrable accepté ; consigner la signature d'acceptation comme jalon"
side: team
---
# Revue de fin de phase (phase gate / tollgate)

Rituel Waterfall générique — la **cérémonie de gate** appliquée à **chaque** frontière de phase. Le
narratif de référence est le cycle de vie en cascade (stage-gate). Côté `team`.

C'est le **verrou** du modèle : une phase ne se clôt et la suivante ne s'ouvre qu'après une revue
formelle **présidée par le Project Manager**. On vérifie les critères de sortie, la complétude du
livrable et la traçabilité, puis on **décide** : **signature d'acceptation** (le livrable est
baseliné/gelé, la phase suivante est autorisée) ou **renvoi en correction** (pas de passage partiel,
pas de contournement). Contrairement à une inspection empirique collective, la décision est
**hiérarchique et unique** ; contrairement à une itération, le passage est **à sens unique**.
