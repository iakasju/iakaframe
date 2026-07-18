# Instruction — Scinder `iakaframe-learning` en DEUX skills à périmètre net

> Cadrage (P1 — Gandalf). Statut : **à valider par le décideur** avant exécution (Gimli).
> Réf. décision : décideur + audit A3.4 (skill surchargée, deux casquettes).
> Réf. amont : `specs/instructions/surface-apprentissage.md` (U3/U4),
> `specs/instructions/symetrie-ajout-suppression.md` (S1→S6), `specs/instructions/audit-frame.md`.

---

## 1. Problème (avant la solution)

La skill `iakaframe-learning` cumule **deux domaines fonctionnels distincts** dans une seule
`description` et un seul corps :

- **(a) REVUE** du réservoir de propositions d'apprentissage — pilote `iakaframe review`
  (`list` / `show` / `apply` / `reject`), la garde de consentement et la cadence.
- **(b) RETRAIT symétrique +/−** — pilote `iakaframe detach|attach --persona`,
  `iakaframe remove <team|method|binding|skill>` et `iakaframe memory remove`
  (RESTRICT + corbeille + cascade explicite).

Ces deux domaines n'ont **ni le même déclencheur, ni le même CLI cible, ni le même risque**.
L'audit A3.4 juge la skill **surchargée** : une seule `description` doit couvrir ~12 triggers
hétérogènes, ce qui dilue la sélection par le modèle.

**Pourquoi c'est un vrai problème (fait vérifié).** Le mécanisme de découverte des skills de
Claude Code repose **entièrement sur le champ `description`** : au démarrage, l'agent ne pré-charge
que `name` + `description` de chaque skill (~100 tokens/skill, *progressive disclosure*) et **décide
seul** d'activer une skill selon la correspondance entre la tâche et cette description
([Claude Code Docs — Skills](https://code.claude.com/docs/en/skills),
[Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)).
Une description **mono-domaine et à triggers nets** est donc sélectionnée plus fiablement qu'une
description fourre-tout : la scission **améliore mécaniquement** le routage. C'est l'argument
technique qui fonde la décision du décideur.

---

## 2. Constat de l'existant (lecture réelle)

### 2.1 Skill source
`library/skills/iakaframe-learning/SKILL.md` — **source unique de vérité** (frontmatter
`id`/`name`/`description` + corps). Le corps mélange aujourd'hui :
- lignes 21→59 : parcours `review` + garde de consentement (domaine **REVUE**) ;
- lignes 61→98 : symétrie +/− + retrait `detach/attach/remove/memory remove` (domaine **RETRAIT**) ;
- ligne 111 : badge `🟣 [ROYAUME][Apprentissage]`.

### 2.2 CLI cible — les deux périmètres sont déjà nettement séparés côté code
| Domaine | Commande CLI | Fichier source | Registre (`cli/src/index.js`) |
|---|---|---|---|
| REVUE | `iakaframe review list\|show\|apply\|reject\|auto` | `cli/src/commands/review.js` (`runReview`) | l.137 |
| RETRAIT | `iakaframe remove <team\|method\|binding\|skill> <id>` | `cli/src/commands/remove.js` (`runRemove`) | l.127 |
| RETRAIT | `iakaframe attach\|detach <skillId> --persona <id>` | `cli/src/commands/attach.js` (`runAttach`/`runDetach`) | l.128-129 |
| RETRAIT | `iakaframe memory remove <profil\|registre> "<contenu>"` | `cli/src/commands/memory.js` (`runMemory`) | l.133 |

> Note : il n'existe **pas** de `detach.js` ; `attach.js` exporte **`runAttach` ET `runDetach`**
> (idempotents, Option 1 : mutent le seul `skills:[]` du frontmatter du persona).

**La frontière métier est déjà propre côté CLI** — la scission de la skill ne fait que **refléter**
cette séparation existante. Aucune logique CLI n'est touchée.

### 2.3 Alias (slash-commands) existants
- `kits/iakaframe-claude/.claude/commands/learning.md` → `/learning`
- `kits/iakaframe-claude/.claude/commands/iaka.md` → `/iaka` (alias de `/learning`)

Les **deux** exposent aujourd'hui le parcours `review` **ET** la section « Retrait symétrique »
(cf. lignes 22→39 de chaque fichier). Le kit source ne matérialise **que des commandes** — il n'y a
**pas** de `kits/iakaframe-claude/.claude/skills/` dans le dépôt de travail (vérifié) ; les skills
sont matérialisées à partir de `library/skills/` lors de l'onboarding / la génération de frame.

### 2.4 Verrou de test
`cli/test/learning-skill.test.js` verrouille : frontmatter conforme, triggers `/learning` + `/iaka`,
les 4 verbes de `review`, posture « pilote / source unique », **puis (bloc S6)** les verbes de
retrait + RESTRICT + corbeille + cascade + Option 1, dans la skill **et** dans les deux alias.
→ Ce test devra être **scindé** en même temps que la skill (sinon il échoue).

### 2.5 Frames (releases figées)
`frames/releases/StefFrame1/` et `StefFrame2/` contiennent des **copies** de la skill et des alias.
Ce sont des **releases figées** (snapshots versionnés) : **on ne les régénère pas** dans le cadre de
cette instruction (cf. §6).

---

## 3. Décision structurante & options

La décision « scinder en 2 » est **prise par le décideur**. Restent trois arbitrages de mise en
œuvre. Gandalf recommande, le décideur tranche.

### Arbitrage A — Nom des deux skills
| Option | Skill REVUE | Skill RETRAIT | Coût de churn |
|---|---|---|---|
| **A1 (recommandée)** | garde `iakaframe-learning` | **crée** `iakaframe-retrait` | **minimal** : alias `/learning`+`/iaka` et test revue quasi inchangés |
| A2 | renomme `iakaframe-apprentissage` | crée `iakaframe-retrait` | fort : casse ids, alias, test, doc, frames |

**Recommandation : A1.** « learning » désigne historiquement la **boucle d'apprentissage** (revue du
réservoir) ; le garder sur la skill REVUE minimise la surface de changement et préserve les alias
établis. Le nouveau nom `iakaframe-retrait` suit la convention kebab-case FR du dépôt
(`iakaframe-cadrage`, `iakaframe-deploiement`, `iakaframe-qualite`, `iakaframe-etat-des-lieux`…).

### Arbitrage B — Alias slash-command de la skill RETRAIT
| Option | Alias créés | Remarque |
|---|---|---|
| **B1 (recommandée)** | `/retrait` (un seul) | symétrique de `/learning` ; MVP, pas de prolifération |
| B2 | `/retrait` + `/detach` + `/attach` | prolifération d'alias ; la sélection par `description` suffit |

**Recommandation : B1.** Un seul alias explicite `/retrait` ; les verbes fins (`detach`/`attach`/
`remove`) sont couverts par la **`description`** de la skill (déclenchement par le modèle), pas par
des slash-commands dédiées.

### Arbitrage C — Sort de l'alias générique `/iaka`
`/iaka` est aujourd'hui l'alias générique de la boucle d'apprentissage (revue).
**Recommandation : `/iaka` reste sur la skill REVUE** (`iakaframe-learning`), pour ne pas rendre
l'alias ambigu entre deux domaines.

> ⚠️ **Point d'arbitrage décideur** : identité (badge) de la skill RETRAIT. La skill REVUE conserve
> `🟣 [ROYAUME][Apprentissage]`. Pour RETRAIT, Gandalf recommande `🟣 [ROYAUME][Retrait]` (même
> famille de surfaces conversationnelles, pastille violette 🟣 inchangée). À confirmer.

---

## 4. Périmètre fermé — les deux skills cibles

### 4.1 Skill REVUE — `iakaframe-learning` (conservée, allégée)
- **`id` / `name`** : `iakaframe-learning` (inchangés).
- **`description`** (réécrite, **domaine REVUE uniquement**) — doit contenir les triggers :
  `/learning`, `/iaka`, « revoir mes apprentissages », « valider une proposition »,
  « rejeter une proposition », « qu'as-tu appris », « propositions d'apprentissage »,
  « boucle d'apprentissage ». Doit rappeler : **pilote `iakaframe review`** (source unique),
  **aucun stockage propre**.
- **Corps** : conserver §« Principe directeur — source unique », §« Parcours (miroir de review) »
  (list/show/apply/reject), §« Garde de consentement », §« Garde-fous », §« Identité »
  (`🟣 [ROYAUME][Apprentissage]`).
- **Retirer du corps** : toute la section « Retrait symétrique — piloter les verbes − » et la
  sous-section « Symétrie +/− » **au sens retrait** (lignes ~61→98 de la version actuelle).
- **Conserver un pointeur (1 ligne, pas de recouvrement)** : préciser que `reject` retire une
  proposition **en attente** et que défaire un ajout **déjà matérialisé** relève de la skill
  **`iakaframe-retrait`** (renvoi, jamais duplication du contenu).
- **CLI piloté** : `iakaframe review list|show|apply|reject` (mention de `review auto` = cadence,
  pas surface humaine).

### 4.2 Skill RETRAIT — `iakaframe-retrait` (nouvelle)
- **`id` / `name`** : `iakaframe-retrait`.
- **`description`** (**domaine RETRAIT uniquement**) — doit contenir les triggers :
  « détacher un skill d'un persona », `detach`, `attach`, « attacher un skill »,
  « retirer une team/method/binding/skill », `remove`, « dé-matérialiser un skill »,
  « retirer une entrée mémoire », `memory remove`, « décomposabilité +/− », `/retrait`.
  Doit rappeler : **pilote la CLI de retrait** (source unique), **aucune réimplémentation** de
  RESTRICT / corbeille / cascade.
- **Corps** (extrait de l'actuelle skill, §« Retrait symétrique » + « Non destructif » +
  « Confirmation proportionnée ») :
  - `iakaframe detach <skillId> --persona <personaId>` ↔ `iakaframe attach <skillId> --persona <personaId>`
    (Option 1 : mute le **seul** `skills:[]` ; « titre du skill » = vue) — **détacher ET attacher au
    même niveau** ;
  - `iakaframe remove <team|method|binding|skill> <id>` — **RESTRICT par défaut** (refus + **liste
    des référents** ; oriente vers `detach` d'abord pour un skill référencé) ; **cascade =
    `--cascade --yes` = geste humain explicite**, jamais silencieuse ;
  - `iakaframe memory remove <profil|registre> "<contenu>"` (le `−` de `memory add`) ;
  - **Non destructif** : corbeille `<root>/.trash-<horodatage>/` (restaurable, `manifest.json`) ;
  - **Confirmation proportionnée** : légère pour `detach`/`attach` ; explicite pour `remove`
    référencé ou cascade.
  - **Restitution verbatim** de la sortie CLI ; posture **pilote**, jamais propriétaire.
- **Pointeur (1 ligne)** : préciser que **rejeter une proposition en attente** relève de
  `iakaframe-learning` (renvoi).
- **Identité** : `🟣 [ROYAUME][Retrait]` (cf. arbitrage C, à confirmer).

### 4.3 Table de répartition des triggers (zéro recouvrement, zéro orphelin)
| Trigger (ancien périmètre unique) | → Skill cible |
|---|---|
| `/learning`, `/iaka` | `iakaframe-learning` |
| « revoir mes apprentissages », « qu'as-tu appris », « propositions d'apprentissage » | `iakaframe-learning` |
| « valider une proposition », « rejeter une proposition » (proposition **en attente**) | `iakaframe-learning` |
| « boucle d'apprentissage », `review list/show/apply/reject` | `iakaframe-learning` |
| `/retrait` | `iakaframe-retrait` |
| « détacher/attacher un skill d'un persona », `detach`, `attach` | `iakaframe-retrait` |
| « retirer une team/method/binding/skill », `remove`, « dé-matérialiser un skill » | `iakaframe-retrait` |
| « retirer une entrée mémoire », `memory remove` | `iakaframe-retrait` |
| « décomposabilité +/− » (défaire un ajout **déjà posé**) | `iakaframe-retrait` |

> **Frontière anti-recouvrement** : `reject` (proposition en attente) reste **REVUE** ; défaire un
> élément **déjà matérialisé** est **RETRAIT**. Chaque skill porte **un pointeur d'une ligne** vers
> l'autre — un renvoi, jamais une duplication de contenu.

---

## 5. Principe SOURCE UNIQUE préservé (non négociable)

Les deux skills restent des **pilotes** : elles **appellent** le CLI et **restituent sa sortie
verbatim**. Aucune ne réimplémente `classify()`, les plafonds, RESTRICT, la corbeille ou la cascade
— ces logiques vivent **exclusivement** dans `cli/src/commands/{review,remove,attach,memory}.js` et
`cli/src/lib/`. La scission est une **réorganisation de surface conversationnelle**, **aucune
touche au CLI**.

---

## 6. Fichiers à créer / éditer

**À créer**
- `library/skills/iakaframe-retrait/SKILL.md` — nouvelle skill RETRAIT (§4.2).
- `kits/iakaframe-claude/.claude/commands/retrait.md` — alias `/retrait` (miroir de `learning.md`,
  domaine retrait uniquement).
- `cli/test/retrait-skill.test.js` — verrou de la skill RETRAIT (§7).

**À éditer**
- `library/skills/iakaframe-learning/SKILL.md` — alléger : `description` domaine REVUE, retirer les
  sections retrait, ajouter le pointeur d'une ligne (§4.1).
- `kits/iakaframe-claude/.claude/commands/learning.md` — retirer la section « Retrait symétrique »
  (lignes 22→39) ; garder le parcours `review`.
- `kits/iakaframe-claude/.claude/commands/iaka.md` — idem (`/iaka` reste alias REVUE).
- `cli/test/learning-skill.test.js` — **retirer** le bloc S6 (retrait) ; conserver les tests REVUE ;
  ajouter un test **négatif** (la skill learning **ne cite plus** `detach`/`remove`/`RESTRICT`).

**À NE PAS toucher (releases figées)**
- `frames/releases/StefFrame1/**`, `frames/releases/StefFrame2/**` — copies **figées** ; la scission
  ne les régénère pas. Elles seront reflétées **à la prochaine génération de frame** (release
  ultérieure), pas rétroactivement. Documenter ce choix dans le commit / l'état des lieux.
- `cli/src/**` — **aucune** modification CLI (source unique intacte).

---

## 7. Critères d'acceptation (testables)

1. **Deux skills séparées** : `library/skills/iakaframe-learning/SKILL.md` (REVUE) et
   `library/skills/iakaframe-retrait/SKILL.md` (RETRAIT) existent, frontmatter conforme
   (`id`/`name`/`description` non vide, id == name).
2. **REVUE mono-domaine** : la `description` de `iakaframe-learning` déclenche sur `/learning` et
   `/iaka` ; son corps cite les 4 verbes `review list|show|apply|reject` ; il **ne cite plus** aucun
   verbe de retrait (`detach`/`attach`/`remove`/`memory remove`) ni `RESTRICT`/`--cascade`
   (test **négatif**).
3. **RETRAIT mono-domaine** : la `description` de `iakaframe-retrait` déclenche sur `detach`,
   `attach`, `remove`, « détacher un skill d'un persona », « retirer une entrée mémoire » et
   `/retrait` ; son corps cite `iakaframe detach <skillId> --persona <personaId>`,
   `iakaframe attach <skillId> --persona <personaId>`,
   `iakaframe remove <team|method|binding|skill> <id>`, `iakaframe memory remove`, et explicite
   `RESTRICT`, `.trash-`, `--cascade --yes`, `Option 1`.
4. **Posture pilote préservée** (les deux skills) : chaque corps contient « pilote » + « source
   unique » + « réimplément… » (négation) — aucune logique CLI dupliquée.
5. **Couverture 100 % sans doublon** : chaque trigger de la table §4.3 est présent dans **une seule**
   des deux skills ; aucun trigger de l'ancien périmètre n'est orphelin (vérifiable par la table).
6. **Alias cohérents** : `/learning` et `/iaka` ne parlent plus que de `review` (revue) ; `/retrait`
   existe et ne parle que des verbes de retrait.
7. **Frontière de renvoi** : `iakaframe-learning` mentionne `iakaframe-retrait` pour « défaire un
   ajout déjà posé » ; `iakaframe-retrait` mentionne `iakaframe-learning` pour « rejeter une
   proposition en attente » — **un pointeur**, pas une duplication.
8. **CLI intact** : `git diff cli/src/` est vide.
9. **Tests verts** : `cli/test/learning-skill.test.js` (REVUE) et `cli/test/retrait-skill.test.js`
   (RETRAIT) passent ; suite complète des tests CLI verte.
10. **Frames non modifiées** : `git diff frames/releases/` est vide.

---

## 8. Hors périmètre

- Toute modification du CLI (`review`/`remove`/`attach`/`memory`) ou de `cli/src/lib/`.
- La régénération des frames figées StefFrame1/StefFrame2.
- L'ajout de nouveaux verbes de retrait ou de revue (le périmètre fonctionnel est **inchangé** —
  on **réorganise**, on n'ajoute pas de capacité).
- La création d'alias `/detach` `/attach` (arbitrage B2 écarté au MVP).

---

## 9. Statut final

**Instruction prête — en attente de validation décideur** sur les arbitrages A (nom → A1 : garder
`iakaframe-learning` + créer `iakaframe-retrait`), B (alias → B1 : `/retrait` seul), C (`/iaka` reste
REVUE) et le badge `[Retrait]`. À « JALON VALIDÉ », l'exécution (Gimli) applique le §6 et vérifie le
§7.
