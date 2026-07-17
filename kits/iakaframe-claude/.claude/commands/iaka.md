---
description: Revoir ce que l'agent a appris — alias de /learning (pilote la boucle de revue du réservoir, skill iakaframe-learning).
---

Alias de `/learning` : active le parcours de **revue d'apprentissage** (skill
`iakaframe-learning`), la fenêtre conversationnelle sur le **réservoir de propositions**, qui
**pilote** la commande `iakaframe review` (source unique — aucune logique de consentement/plafond
réimplémentée ici).

Déroule le parcours, en offrant **valider ET rejeter au même niveau** (symétrie +/−) et en
explicitant le **garde de consentement** (structurel = geste humain requis, jamais auto) :

1. **Lister** — `iakaframe review list` (par défaut les `en-attente` ; `--status applique|rejete`
   pour l'historique ; `--json` pour parser).
2. **Voir** — `iakaframe review show <id>` (quoi / où / **pourquoi** + artefact).
3. **Valider** — `iakaframe review apply <id>` (matérialise via `review`, restitue le résultat ou
   le refus **verbatim** — ne re-décide rien).
4. **Rejeter** — `iakaframe review reject <id>` (statut `rejete`, rien matérialisé) — **geste de
   premier plan**, aussi accessible que valider.

Ne lis/écris **jamais** le réservoir en direct : passe **toujours** par `iakaframe review`.

## Retrait symétrique (décomposabilité +/−) — pilote les verbes `−`

Défaire un ajout **déjà posé** ≠ `reject`. Pilote les verbes de retrait de la CLI (source unique ;
RESTRICT / corbeille / cascade y vivent — **rien** de réimplémenté ici), sortie **verbatim** :

- **Détacher / attacher un skill ↔ persona** (cas emblématique) —
  `iakaframe detach <skillId> --persona <id>` et `iakaframe attach <skillId> --persona <id>` :
  mute le **seul** `skills:[]` (Option 1, le « titre du skill » est une vue, jamais une section du
  corps). Offre **détacher ET attacher au même niveau** ; réversible d'un geste.
- **Retirer team/method/binding/skill** — `iakaframe remove <team|method|binding|skill> <id>` :
  **RESTRICT par défaut** (refus + **liste des référents** si encore référencé ; oriente vers le
  `detach` d'un skill référencé) ; **cascade = geste humain explicite** (`--cascade --yes`), jamais
  silencieuse.
- **Retirer une entrée mémoire** — `iakaframe memory remove <profil|registre> "<contenu>"` (réutilisé).

**Non destructif** : tout retrait de fichier/dossier va en **corbeille** `<root>/.trash-<ts>/`
(restaurable). **Confirmation** proportionnée : legère pour `detach`/`attach`, **explicite** pour un
`remove` référencé ou une cascade.

$ARGUMENTS
