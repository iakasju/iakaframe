# Persona Legolas — amélioration de contenu (phase 1)

> **Rang : non déclaré ici.** L'ordre de la série a une **source unique** —
> `phase1-inventaire-bibliotheque.md` **§ 0.1** (dépendances) et **§ 0.2** (ordre dérivé).
> Cette instruction déclare ses **dépendances**, jamais sa position.
>
> **Dépendances** *(source : `phase1-inventaire-bibliotheque.md` § 0.1)* :
> - **APRÈS le lot 0** ;
> - **APRÈS le lot Gimli** — motif : **`canon-avant-citation`**. G-1 écrit dans `gimli.md` le
>   **canon** du jalon de remise (« émetteur Gimli · récepteur Legolas ») ; L-3 écrit ici qu'il
>   **reçoit** ce jalon — c'est une **citation** de ce canon.
>
> ⚠️ **Ce lot est CANON pour un autre — il doit passer AVANT le lot Nathalie.** Motif :
> **`canon-avant-citation`** — l'**émetteur de la RQV est Legolas** (arbitrage) : le canon de la RQV
> est `legolas.md:54-60`, **complété par L-1** ; `nathalie.md` le **cite** (N-2).
> **Ne pas déplacer ce lot après Nathalie.**
> *(Sens **inversé au gate 7 — F4** : la dépendance était déclarée « Legolas après Nathalie », au
> motif de « réciprocité ». La réciprocité décrit le **contenu** — deux textes qui se répondent —
> pas un **sens de dépendance**.)*

> Instruction de cadrage (Gandalf, P1). Branche `feat/amelioration-personas`.
> **Périmètre CONTENU uniquement.** Un commit dédié.

## 1. Cadre — ligne de partage

**DANS** : mission, périmètre, obligations, gestes, `guardrails` déclarés, `tools` du binding,
`skills` du frontmatter, `description`, geste **jalon**, **création d'éléments de bibliothèque**.

**HORS — phase 2** : `roleKey`, `library/roles/`, `methods/iakaframe.md`, promotion de `deploiement`,
`roleIndex`, `DEFAULT_SKILLS`, `CANONICAL_ROLES`, vignette, `assemble`, **re-vendorage GUI**,
`roster.test.ts`, `Skill` au binding.

## 2. Trois faits de la phase

1. **Golden + déployé régénérés** (`gen-agents-golden.mjs` puis `agents generate --global`,
   `--check` = 0). **Critère de fini.**
2. **Re-vendorage GUI NON fait.** ⚠️ *Corrigé au gate : **rien n'est rompu à ce jour** (vérifié par
   diff) ; la rupture **surviendra au premier commit**.* La parité cross-repo **sera volontairement
   rompue** et **rien ne la détectera** (`vendor-check` inexistant). **Dette assumée, ouverte au
   premier commit.**
3. **Ajouter des `skills:` n'a aucun effet runtime** avant le lot 2.

## 3. État audité — Legolas (qualité, 🔴)

| Dim. | Verdict | Preuve |
|---|---|---|
| 1 Charte | ✅ | mission (`legolas.md:19-20`), profondeur graduée (`:42-48`), gate indépendant (`:37-40`) |
| 2 Expert MoE | ✅ | « ne corrige pas » / juge et partie (`:25-26`) |
| 3 Jalons | ✅ | **déjà pourvu** (`:50-52`) |
| 4 Tools | ✅ | **exemplaire** — `Read, Grep, Glob, Bash` : l'absence de `Write/Edit` **mécanise** « ne corrige jamais le code » |
| 5 Skills | ✅ | `[iakaframe-qualite]` |
| 6 Hooks | ✅ | `identity` + `perimeter` |

> **Charte la plus saine du roster avec celle de Loki. Peu à faire — c'est un constat, pas une
> complaisance** : les deux seuls points ci-dessous sont des **précisions**, pas des correctifs.

## 4. Changements demandés

| Id | Changement | Fichier |
|---|---|---|
| **L-1** | **Compléter le canon RQV** : co-production avec Nathalie **et émission du jalon par Legolas** | `library/personas/legolas.md:54-60` |
| **L-2** | Expliciter la **pastille dynamique** comme intentionnelle | `legolas.md:69-70` |
| **L-3** | **Inscrire la réception du jalon de remise de Gimli** *(indexé au gate 7 — F3 : il vivait en prose, hors tableau et sans critère)* | `legolas.md:28-31` (§ Entrées → Sorties) |

### L-1 — **compléter le CANON de la RQV** (émetteur du jalon : Legolas)

> ⚠️ **Requalifié au gate 7 (F4).** Cette section s'intitulait « réciprocité RQV ». Le mot
> **« réciprocité »** décrit le **contenu** — deux textes qui se répondent — et **ne dit rien du sens
> de la dépendance**. C'est lui qui avait fait déclarer l'ordre à l'envers.

**`legolas.md:54-60` EST le canon de la RQV** : il l'institue déjà et engage nommément Nathalie.
**L-1 le COMPLÈTE ; il ne cite rien.**

**Arbitrage du décideur (2026-07-19)** : Nathalie **co-produit** le document ; **Legolas rend le
verdict et pose le jalon** (récepteur = le **décideur**, qui tranche le go/no-go).

**Changement** : `:54-60` nomme explicitement *(a)* la **co-production** avec Nathalie et sa part
documentaire, *(b)* le fait que **Legolas émet le jalon** de la RQV.

> 🔁 **Contrainte de rédaction — anti-cycle (critère L-A5d).** Écrire ce passage comme un
> **complément de canon**, jamais comme un **renvoi à `nathalie.md`**. `legolas.md` doit rester
> **compréhensible seul** : il définit la RQV, y compris la part de Nathalie. Si L-1 déléguait cette
> définition à `nathalie.md`, on créerait **Nathalie→Legolas** en plus de **Legolas→Nathalie** —
> un **cycle**, impossible à ordonner. Cf. `phase1-inventaire-bibliotheque.md` § 0.1.
>
> `nathalie.md` (N-2), lui, **cite** ce canon. Le livrable reste la cohérence des deux textes — mais
> **la direction est fixée** : Legolas détient, Nathalie cite.

### L-3 — récepteur du jalon de remise de Gimli (asymétrie créée par G-1)

L'instruction Gimli (G-1) crée un jalon **« émetteur Gimli · récepteur Legolas »** pour la remise au
gate qualité. **Rien côté Legolas ne le mentionne** — c'est la même asymétrie que N-1, créée par
notre propre lot.

**Changement** : la charte de Legolas indique qu'il **reçoit** ce jalon de remise, en entrée de son
gate (`:28-31`, § Entrées → Sorties). Une phrase suffit.

> **À rédiger en cohérence avec `gimli.md`** (**lot Gimli** — dépendance déclarée en en-tête, source
> `phase1-inventaire-bibliotheque.md` § 0.1) : Gimli remet et ne
> s'auto-valide pas ; Legolas reçoit et rend le verdict.

### L-2 — pastille dynamique

`:69-70` déclare une pastille **variable** (🔴 en P2, 🟢 en P3) alors que le frontmatter n'en porte
**qu'une** (`legolas.md:7` = `"🔴"`). C'est **intentionnel** et documenté dans le corps, mais la
tension frontmatter ↔ corps n'est **pas explicitée**.

**Changement minimal** : une phrase indiquant que la valeur du frontmatter est la **pastille par
défaut (P2)** et que le corps fait foi pour la variation par phase.

> ⚠️ **Ce qui n'est PAS dans ce lot** : savoir si l'`identity-guard` valide la pastille **contre le
> frontmatter** (ce qui produirait des faux positifs en P3). C'est un comportement de **hook** →
> **phase 2**. L-2 clarifie le **texte**, il ne corrige pas un hook non audité.

## 5. Éléments de bibliothèque à créer — **AUCUN**

Balayage des 8 familles, avec ce qui a été vérifié :

| Famille | Besoin ? | Vérification faite |
|---|---|---|
| `skills` | non | `iakaframe-qualite` existe et couvre le rôle |
| `principles` | **non — réutilisation PARTIELLE** | `library/principles/qualite.md:4` couvre le **gate indépendant + verdict avant scellement**, mais **PAS toute** la politique de Legolas — cf. encadré. Rien à créer pour autant. |
| `guardrails` | non | `identity` + `perimeter` suffisent ; son étanchéité « ne corrige pas » est **déjà mécanisée par l'absence de `Write/Edit`** — meilleur qu'un garde-fou |
| `rituals` | non | les 5 existants (iakastart, init, log-conversation, snapshot, update) ne concernent pas le gate qualité ; en créer un doublonnerait la skill |
| `workflows` | non | `iakaframe-3phases` couvre le placement de son gate |
| `scaffolds` | non | il ne produit pas de structure type (le rapport qualité est un livrable, pas un squelette) |
| `roles` | **phase 2** | `library/roles/qualite.md` existe — toute question de rôle est **structurelle** |
| `personas` | n/a | la persona existe |

> ⚠️ **Correction après gate — j'écrivais « exactement la politique de Legolas ». C'est FAUX.**
> `qualite.md` porte `trigger: "bump SemVer x.Y.z (version mineure)"` : il couvre la **campagne
> qualité de version mineure** et la **RQV**, **pas** le **gate automatique par livraison**
> (`legolas.md:37-40`), qui se déclenche à **chaque remise de Gimli**.
>
> **Deux instructions du même lot se contredisaient sur le même fichier** :
> `persona-loki-amelioration.md:87` écrivait correctement que `qualite.md:4` **ne couvre pas** le
> besoin visé, tandis que cette instruction affirmait l'inverse. **La version de Loki était la
> bonne** ; celle-ci est corrigée.
>
> **Conséquence pratique** : la charte **peut citer** `qualite.md` pour la **campagne de version
> mineure et la RQV**, mais **doit conserver en propre** la description du **gate par livraison** et
> de la **profondeur graduée** (`:42-48`) — que le principe ne porte pas. **Ne pas remplacer `:42-48`
> par un renvoi.**

## 6. Laissé à la phase 2

- Comportement de l'`identity-guard` sur pastille dynamique (hooks).
- Re-vendorage GUI, `Skill` au binding, `roleKey`, `library/roles/`.
- Le jalon de L-1 **ne sera pas outillé** (`iakaframe-jalon` non déployée) : on écrit la charte juste.

## 7. Critères d'acceptation

| # | Critère | Vérification |
|---|---|---|
| L-A1 | La RQV est décrite comme **co-produite**, avec l'émetteur du jalon tranché | relecture |
| L-A2 | Le texte **concorde** avec `nathalie.md` (aucune contradiction sur qui fait quoi) | relecture **croisée obligatoire** |
| L-A3 | Le go/no-go reste au **décideur** | relecture |
| L-A4 | La distinction RQV (version mineure, gate humain) ↔ gate auto (livraison) est **conservée** (`:56-59`) | diff |
| L-A5 | La pastille dynamique est explicitée (défaut frontmatter vs variation par phase) | relecture |
| **L-A5b** | **L-3** : `legolas.md` (§ Entrées → Sorties) énonce qu'il **reçoit** le jalon de remise de Gimli en entrée de son gate | relecture — *(critère ajouté au gate 7 : sans lui, le lot sortait 9/9 sans que L-3 soit écrit)* |
| **L-A5c** | **L-3** : la formulation est **cohérente avec `gimli.md`** (G-1) — Gimli **émet**, Legolas **reçoit** ; aucune contradiction sur l'émetteur/récepteur | relecture **croisée** avec `gimli.md` (lot déjà committé) |
| **L-A5d** | **L-1** : le canon RQV est **complété**, non délégué — `legolas.md` reste compréhensible **seul** et ne renvoie pas à `nathalie.md` pour définir la RQV | relecture — **c'est le contrôle anti-cycle** (cf. § 0.1 de l'index) |
| L-A6 | `tools`, `skills`, `guardrails`, `pastille` **inchangés** | diff |
| L-A7 | Aucun champ hors périmètre modifié | diff |
| L-A8 | Golden + déployé régénérés | `agents generate --check` = **0** |
| L-A9 | Suite CLI verte | `node --test` |

## 8. Critère de « fini »

1. `gen-agents-golden.mjs` · 2. `agents generate --global` + `--check` = 0 · 3. `node --test` vert ·
4. **PAS de re-vendorage GUI** (dette assumée, 2026-07-19) · 5. Commit dédié.

> **Dépendances** *(source unique : `phase1-inventaire-bibliotheque.md` § 0.1)* : **APRÈS le lot 0**
> et **APRÈS le lot Gimli** ; **AVANT le lot Nathalie** (ce lot est **canon** pour elle).
> *(Corrigé au gate 7 — F6 : cette seconde déclaration ne nommait que Nathalie, dans le mauvais sens,
> et était périmée depuis LG-8. **Une instruction ne déclare ses dépendances qu'à un seul endroit** —
> son en-tête ; ce rappel y renvoie au lieu de les redéclarer.)*

## 9. Estimation

**~0,25 j-h.** Complexité **très faible** (trois précisions rédactionnelles, aucune création).
Risque **faible**.
*Inconnues* : *(a)* lire `specs/instructions/revue-qualite-version.md` avant L-1 pour ne pas
contredire une spec RQV déjà écrite ; *(b)* **rédiger L-1 comme un COMPLÉMENT de canon** — s'il
renvoyait à `nathalie.md` pour définir la RQV, on créerait un **cycle** Legolas↔Nathalie (cf. L-A5d
et § 0.1 de l'index).
