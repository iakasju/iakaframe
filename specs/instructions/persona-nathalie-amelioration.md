# Persona Nathalie — amélioration de contenu (phase 1)

> **Rang : non déclaré ici.** L'ordre de la série a une **source unique** —
> `phase1-inventaire-bibliotheque.md` **§ 0.1** (dépendances) et **§ 0.2** (ordre dérivé).
> Cette instruction déclare ses **dépendances**, jamais sa position.
>
> **Dépendances — ce lot est le plus contraint de la série** *(source : § 0.1)* :
> - **APRÈS le lot 0** ;
> - **APRÈS le lot Legolas** — motif : **`canon-avant-citation`**. L'émetteur de la RQV est
>   **Legolas** ; le canon de la RQV est `library/personas/legolas.md` § Revue Qualité de Version (RQV) complété par L-1. N-2 écrit ici que
>   « le verdict et le jalon reviennent à Legolas » : c'est une **citation**.
>   *(Dépendance **ajoutée au gate 7 — F4**, en remplacement de « Legolas après Nathalie », qui
>   était dans le mauvais sens.)*
> - **APRÈS le lot Loki** — motif :
> **`canon-avant-citation`** —
> `nathalie.md:41` **cite** le tableau canon des chartes que Loki **détient** (`loki.md:53-57`).
> Corriger la citation avant le canon laisserait le dépôt, entre deux commits, avec deux fichiers
> qui affirment deux vérités contradictoires.
> Réf. : `specs/instructions/principe-canon-avant-citation.md`.

> Instruction de cadrage (Gandalf, P1). Branche `feat/amelioration-personas`.
> **Périmètre CONTENU uniquement.** Dérivée de `audit-amelioration-roster-personas.md`.
> Un commit dédié à cette persona.

## 1. Cadre de la phase — ligne de partage

**DANS** : mission, périmètre, obligations, gestes, `guardrails` déclarés, `tools` du binding,
`skills` du frontmatter, `description`, geste **jalon**.

**HORS — phase 2** : `roleKey`, `library/roles/`, `methods/iakaframe.md`, promotion de `deploiement`,
`roleIndex`, `DEFAULT_SKILLS`, `CANONICAL_ROLES`, vignette, `assemble`, **re-vendorage GUI**,
`roster.test.ts`, `Skill` au binding.

## 2. Trois faits qui valent pour toute cette phase

1. **Golden + déployé régénérés** (`gen-agents-golden.mjs` puis `agents generate --global`,
   `--check` = 0). **Critère de fini.**
2. **Le re-vendorage GUI n'est PAS fait.** ⚠️ *Corrigé au gate : **rien n'est rompu à ce jour**
   (vérifié par diff) ; la rupture **surviendra au premier commit**.* La parité cross-repo **sera
   volontairement rompue** et **rien ne la détectera**. **Dette assumée, ouverte au premier commit.**
   La suite GUI n'est pas jouée dans cette phase.
3. **Ajouter des `skills:` n'a aucun effet runtime** avant le lot 2. *(Le frontmatter de Nathalie est
   déjà correct — mais deux de ses skills ne sont pas déployées, cf. § 5.)*

## 3. État audité — Nathalie (documentation, 🟠)

| Dim. | Verdict | Preuve |
|---|---|---|
| 1 Charte | ⚠️ | mission et périmètre nets (`nathalie.md:19-43`) **mais obligation RQV absente** — cf. N-1 |
| 2 Expert MoE | ✅ | frontières exemplaires : fond/forme vs Loki (`:38-43`), **« elle vérifie et cite, elle ne cadre pas »** vs Gandalf (`:54-55`) |
| 3 Jalons | ⚠️ | « Aucun gate bloquant » (`:61-63`) — exact pour les guides, **mais la RQV est un gate humain** |
| 4 Tools | ✅ | `Read, Write, Edit, Grep, Glob, Bash, WebSearch, WebFetch` — conforme à l'élargissement du 2026-07-05 (`:45-49`) |
| 5 Skills | ✅ | `[iakaframe-nathalie, iakaframe-memoire-humaine]` — **canon correct** |
| 6 Hooks | ✅ | `identity` + `perimeter` actifs |
| 7 Cohérence | *(hors périmètre)* | — |

## 4. Changements demandés

| Id | Changement | Fichier | Statut |
|---|---|---|---|
| **N-1** | **Réciproquer l'obligation RQV** | `library/personas/nathalie.md` (§ Périmètre ou § Gate) | à faire |
| **N-2** | *(dépend de N-1)* Mentionner le **jalon** de la RQV | `nathalie.md` (§ Gate) | à faire si N-1 |

### N-1 — obligation asymétrique : une persona engagée dans un gate qu'elle ignore

**Le défaut, vérifié.** `library/personas/legolas.md` § Revue Qualité de Version (RQV) institue la **Revue Qualité de Version (RQV)** comme gate
**HUMAIN** à chaque version mineure, et engage **nommément** Nathalie :

> « À chaque version mineure, Legolas produit — **avec 📖 Nathalie** — le document d'évaluation
> complète de la version (qualité consolidée, couverture, risques, écarts). »

Or `library/personas/nathalie.md` **ne mentionne ni la RQV ni ce livrable**. Vérification :
`RQV` n'apparaît dans `library/` que dans `legolas.md` et `iakaframe-init/SKILL.md`.

> **C'est le défaut de contenu le plus net du roster** : un agent est engagé par la charte d'un
> **autre** agent dans un **gate humain**, sans le savoir. Si Nathalie est dispatchée seule, rien
> dans son contrat ne lui indique qu'elle a une part dans la RQV.

**Le changement** : inscrire **sa part** de la RQV — ce qu'**elle** produit (le volet rédactionnel /
lisibilité / trace des écarts du document d'évaluation), **quand** (à chaque version mineure, pas à
chaque livraison), **avec qui** (Legolas, qui porte le volet qualité consolidée), et **pour qui**
(le décideur, qui rend le go/no-go).

**Deux garde-fous de rédaction :**
- **Miroir, pas copie.** La formulation doit **répondre** à `library/personas/legolas.md` § Revue Qualité de Version (RQV) sans la dupliquer :
  Legolas porte le **verdict qualité**, Nathalie porte la **mise en forme et la lisibilité de
  l'évaluation**. Le go/no-go **reste au décideur** — Nathalie ne le rend pas.
- **Ne pas étendre son périmètre.** Elle documente ; elle ne **juge** pas la qualité (ce serait
  empiéter sur Legolas) et elle ne **cadre** pas (`:54-55`). La RQV est pour elle un **livrable
  documentaire**, pas un rôle d'évaluation.

### N-2 — jalon de la RQV

Si N-1 est fait, la charte doit indiquer que la RQV — étant un **gate humain** — est **matérialisée
par un jalon** (`iakaframe jalon`), **récepteur = le décideur**. *À poser conjointement avec
Legolas ; à la rédaction, préciser lequel des deux émet* — cf. § 6.

> **Ne pas ajouter de jalon ailleurs.** Pour les guides utilisateurs, `:61-63` (« aucun gate
> bloquant ») est **correct** et doit rester : y plaquer un jalon dévaluerait le geste.

## 5. Ce qui est laissé à la phase 2 (bloqué par la structure)

- **`iakaframe-memoire-humaine` et `iakaframe-appflowy-doc` ne sont pas déployées.** Le frontmatter
  est correct ; c'est `SKILL_OF` (mono-skill) qui ne rend qu'`iakaframe-nathalie`, et la résolution
  de `subskills` qui n'existe pas. **Rien à faire ici** — lot 2.
- Le **jalon de N-2 ne sera pas outillé** (`iakaframe-jalon` non déployée) : on écrit la charte
  juste, l'activation vient au lot 2.
- `DEFAULT_SKILLS.doc` côté GUI est divergent (1 skill au lieu de 2) → **structure, phase 2**.
- Re-vendorage GUI, `Skill` au binding, `roleKey`.

### N-3 — fermer la citation Cinabre (levée B-1)

`nathalie.md:41` **cite** le canon de Loki : « **conseil/pro → Cinabre** _à confirmer_ ».
**Arbitrage rendu (2026-07-19) : conseil/pro → NaonEdge dark.** La citation doit être alignée.

> **C'est une citation, pas le canon.** Le tableau de référence vit chez Loki (`loki.md:53-57`) et
> dans sa skill ; il est corrigé au **lot Loki**. Ce lot ne corrige **que la citation** — d'où
> l'ordre canon→citation (§ en-tête). **Ne pas dupliquer le tableau ici** : citer la règle, comme
> `:38-43` le fait déjà.

## 6. Arbitrage rendu — l'émetteur du jalon RQV est **LEGOLAS**

**Tranché par le décideur (2026-07-19)** : Nathalie **co-produit** le document d'évaluation ;
**Legolas rend le verdict et pose le jalon**.

Conséquences pour la rédaction de N-1 / N-2 :

- `nathalie.md` porte **son engagement** dans la RQV — sa **part documentaire** — et indique
  explicitement que **le verdict et le jalon reviennent à Legolas** ;
- elle **n'émet pas** le jalon et **ne rend pas** le go/no-go ;
- `legolas.md` nomme, en miroir, **l'émission du jalon** et la **co-production** avec Nathalie
  (cf. `persona-legolas-amelioration.md` L-1).

> **Les deux chartes s'écrivent en miroir sur cette base.** Le livrable est la **cohérence des deux
> textes** — c'est ce qui referme l'asymétrie N-1, sans en créer une en sens inverse.

> 🔁 **Direction fixée (gate 7 — F4) : `legolas.md` DÉTIENT, `nathalie.md` CITE.**
> Le canon de la RQV est `library/personas/legolas.md` § Revue Qualité de Version (RQV), complété par L-1 — **ce lot passe donc APRÈS le lot
> Legolas** (cf. en-tête). N-2 **cite** ce canon en indiquant que le verdict et le jalon reviennent
> à Legolas.
>
> **Ne pas écrire ici une définition autonome de la RQV** : `nathalie.md` décrit **sa part** et
> **renvoie** au canon. Y redéfinir la RQV en ferait un second détenteur — la condition n°2
> (**Unicité**) de `canon-avant-citation` — et pourrait créer un **cycle** avec L-1.

## 7. Critères d'acceptation

| # | Critère | Vérification |
|---|---|---|
| N-A1 | `RQV` apparaît dans `library/personas/nathalie.md` | `grep -c RQV` ≥ 1 |
| N-A2 | Sa **part** est décrite (livrable documentaire), **distincte** du verdict qualité de Legolas | relecture croisée avec `library/personas/legolas.md` § Revue Qualité de Version (RQV) |
| N-A3 | La charte **ne lui attribue pas** le go/no-go (qui reste au décideur) | relecture |
| N-A4 | La granularité est **la version mineure**, pas la livraison | relecture |
| N-A5 | `:61-63` (« aucun gate bloquant » pour les guides) est **conservé** et non contredit | diff + relecture |
| N-A6 | *(si N-2)* Le jalon RQV est décrit avec **récepteur = le décideur** et l'émetteur tranché (§ 6) | relecture |
| N-A7 | `tools`, `skills`, `guardrails` **inchangés** | diff |
| N-A8 | Aucun champ hors périmètre modifié | diff |
| N-A9 | Golden + déployé régénérés | `agents generate --check` = **0** |
| N-A10 | Suite CLI verte | `node --test` |

## 8. Critère de « fini »

1. `node cli/scripts/gen-agents-golden.mjs` · 2. `agents generate --global` + `--check` = 0 ·
3. `node --test` vert · 4. **PAS de re-vendorage GUI** (dette assumée, 2026-07-19) ·
5. Commit dédié à Nathalie.

> **Dépendance de lecture** : rédiger N-1 **en ayant `library/personas/legolas.md` § Revue Qualité de Version (RQV) sous les yeux**. C'est un
> travail de **réciprocité** : la cohérence des deux textes est le livrable, pas le texte seul.

## 9. Estimation

**~0,5 j-h.** Complexité **faible** ; risque **rédactionnel modéré** — le piège est de laisser
Nathalie déborder sur le jugement qualité (périmètre de Legolas) en décrivant sa part de la RQV.
*Inconnue* : le contenu exact du « document d'évaluation complète » — `library/personas/legolas.md`
§ Revue Qualité de Version (RQV) renvoie à
`specs/equipe-agents.md:123-126` et `specs/instructions/revue-qualite-version.md` (**les deux
existent**, vérifié) ; **les lire avant de rédiger** pour ne pas inventer un livrable déjà spécifié.
