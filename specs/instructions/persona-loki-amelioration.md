# Persona Loki — amélioration de contenu (phase 1)

> **Rang : non déclaré ici.** L'ordre de la série a une **source unique** —
> `phase1-inventaire-bibliotheque.md` **§ 0.1** (dépendances) et **§ 0.2** (ordre dérivé).
> Cette instruction déclare ses **dépendances**, jamais sa position.
>
> **Dépendance : APRÈS le lot 0.**
>
> **Ce lot est CANON pour un autre — il doit passer AVANT le lot Nathalie.** Motif :
> **`canon-avant-citation`** — Loki
> **détient** le tableau canon des chartes (`loki.md:53-57`), Nathalie le **cite**
> (`nathalie.md:41`). Le canon s'écrit avant la citation.
> Réf. : `specs/instructions/principe-canon-avant-citation.md`.

> Instruction de cadrage (Gandalf, P1). Branche `feat/amelioration-personas`.
> **Périmètre CONTENU uniquement.** Un commit dédié.

## 1. Cadre — ligne de partage

**DANS** : mission, périmètre, obligations, gestes, `guardrails`, `tools` du binding, `skills` du
frontmatter, `description`, geste **jalon**, **création d'éléments de bibliothèque**.

**HORS — phase 2** : `roleKey`, `library/roles/`, `methods/iakaframe.md`, promotion de `deploiement`,
`roleIndex`, `DEFAULT_SKILLS`, `CANONICAL_ROLES`, vignette, `assemble`, **re-vendorage GUI**,
`roster.test.ts`, `Skill` au binding, **renommage de skill** (cf. § 6).

## 2. Trois faits de la phase

1. **Golden + déployé régénérés** (`--check` = 0). **Critère de fini.**
2. **Re-vendorage GUI NON fait.** ⚠️ *Corrigé au gate : **rien n'est rompu à ce jour** (vérifié par
   diff) ; la rupture **surviendra au premier commit**.* La parité cross-repo **sera volontairement
   rompue** et **rien ne la détectera**. **Dette assumée, ouverte au premier commit.**
3. **Ajouter des `skills:` n'a aucun effet runtime** avant le lot 2.

## 3. État audité — Loki (design, 🟠)

| Dim. | Verdict | Preuve |
|---|---|---|
| 1 Charte | ✅ | la **plus riche du roster** : expertise DA (`loki.md:22-36`), catalogue dynamique (`:38-59`), boucle de rendu (`:66-87`), rangement `iakagraph` (`:98-108`) |
| 2 Expert MoE | ✅ | fond/forme vs Nathalie ; « ne décide pas du fond » (`:63-64`) |
| 3 Jalons | ⚠️ | 0 mention — **et c'est défendable** (cf. LK-2) |
| 4 Tools | ✅ | `Bash` requis par la rastérisation (`:72-74`), `Read` pour **regarder** le PNG (`:75`), web pour la veille (`:30-31`) — alignement exemplaire charte↔tools |
| 5 Skills | ✅ | `[iakaframe-naonedge]` — *nom à revoir, cf. § 6* |
| 6 Hooks | ✅ | `identity` + `perimeter` |

## 4. Changements demandés

| Id | Changement | Fichier |
|---|---|---|
| **LK-1** | **Fermer le point ouvert « Cinabre à confirmer »** | `library/personas/loki.md:57` |
| **LK-2** | *(décision)* Jalon de recette visuelle — **recommandé : NE PAS ajouter** | `loki.md` |

### LK-1 — **TRANCHÉ : conseil/pro → NaonEdge dark** — et le point ouvert vit dans 4 fichiers

**Arbitrage du décideur (2026-07-19)** : la charte par défaut du contexte **conseil / pro** est
**NaonEdge dark** (`design-naonedge/`). Cinabre n'est plus un défaut ; le point ouvert est **fermé**.

> ⚠️ **Périmètre ÉLARGI après gate (levée B-1).** La version initiale ne visait que `loki.md:57`, et
> son critère LK-A4 grepait **ce seul fichier** — il serait **sorti VERT sur un défaut vivant**. Le
> même point ouvert vit dans **4 emplacements** éligibles phase 1 :

| # | Fichier:ligne | Nature | Lot |
|---|---|---|---|
| 1 | `library/personas/loki.md:57` | ligne du **tableau canon** | **ce lot** |
| 2 | `library/skills/iakaframe-naonedge/SKILL.md:4` | **`description`** — donc **surface de routage** | **ce lot** |
| 3 | `library/skills/iakaframe-naonedge/SKILL.md:35` | tableau canon **dupliqué** dans la skill | **ce lot** |
| 4 | `library/personas/nathalie.md:41` | **citation** du canon de Loki | **lot Nathalie** (N-3) |

**Reproduction** : `grep -rn "à confirmer\|Cinabre" library/` → 4 occurrences pertinentes.
*(Une 5ᵉ occurrence, `library/skills/iakaframe-etat-des-lieux/SKILL.md:17`, est un « à confirmer »
**sans rapport** — consigne de rédaction sur les faits non vérifiables. **Ne pas y toucher.**)*

**Ce lot traite les 3 premières** ; la 4ᵉ appartient à Nathalie, qui **cite** le canon (une charte
ne modifie pas celle d'un autre agent — un commit par persona).

> **L'occurrence n°2 est la plus grave** : elle est dans la `description` de la skill, c'est-à-dire
> dans **ce que le runner lit pour décider d'activer la skill**. Un point ouvert y est un défaut de
> **routage**, pas de prose.

**Note de cohérence** : le tableau canon est **dupliqué** entre `loki.md:53-57` et
`iakaframe-naonedge/SKILL.md:35`. C'est la duplication qui a permis au défaut de survivre à un
correctif partiel. **Signalé, non déduplicaté ici** — la factorisation charte↔skill est un sujet de
structure (phase 2).

### LK-2 — jalon : ne pas en ajouter (recommandation motivée)

Loki n'a **pas de gate au sens de la méthode** : il livre un visuel, validé par l'humain
(`:85-87`). Sa boucle **VOIR puis juger** (`:66-77`) est une **discipline de production**, pas une
transition entre phases.

> Y plaquer un jalon **dévaluerait le geste** — exactement ce que met en garde
> `library/skills/iakaframe-jalon/SKILL.md:16-18` (« un jalon non posé = une transition invisible »,
> ce qui **suppose** une transition). **Reco : aucun jalon pour Loki.** À acter explicitement pour
> que l'absence soit lue comme un **choix**, pas comme un oubli.

## 5. Élément de bibliothèque — **RÉUTILISÉ, plus créé ici** (le principe vient du **lot 0**)

> 🔄 **Changement de rattachement (gate 5, lot 0 accepté).** `preuve-avant-declaration` était créé
> **par ce lot** ; il est désormais créé par le **LOT 0 — bibliothèque**, exécuté **avant la série**,
> avec `canon-avant-citation`. Réf. : `specs/instructions/principe-canon-avant-citation.md` § 7.
>
> **Ce lot ne crée donc plus aucun élément de bibliothèque** : il **cite** un principe préexistant.
> **Conséquence : la dépendance « Loki avant Gandalf » DISPARAÎT** — le principe existe dès le lot 0.
> La seule dépendance qui subsiste pour Loki est **Loki avant Nathalie** (canon avant citation).
>
> **L'analyse ci-dessous reste valide et sert de motivation au lot 0** — c'est elle qui justifie la
> création du principe. Elle est conservée ici parce que la charte de Loki en est la **source
> mûre**, mais elle ne décrit plus un geste de ce lot.

### `library/principles/preuve-avant-declaration.md` — **ATOMIQUE** *(créé au lot 0)*

**Motif.** La charte de Loki porte la formulation la plus mûre d'une règle qui, en réalité, est
**transverse à toute l'équipe** :

> « **un visuel non rendu = non livré** » (`loki.md:85`) · « il **ne livre jamais** un visuel sans
> l'avoir **rendu et regardé** » (`:67`) · « **Livrer seulement après s'être vu.** » (`:77`)

Cette règle est aujourd'hui **enfermée dans une charte**, en termes graphiques. Or elle vaut pour
tout agent : **on ne déclare pas fait ce qu'on n'a pas constaté**. Deux faits récents l'attestent —
l'un dans ce projet même : au gate n°3, j'ai **confirmé une suppression que je n'avais pas
vérifiée** (§ B-4), et l'item mort serait parti au backlog. C'est **le même défaut** que livrer un
SVG sans l'avoir regardé.

**Ce qui a été vérifié avant de conclure qu'il n'existe pas** — les **16** principes de
`library/principles/` ont été listés :
`cadrage-avant-code`, `commits-versionnement`, `confirmation-actes-destructifs`, `documentation`,
`gestion-backlog`, `identite-badges`, `interruption-minimale-odin`, `isolation-docker`, `langue`,
`merge-versionnement`, `mock-en-dev`, `mvp-first`, `perimetres-etanches`, `qualite`,
`reutilisation-existant`, `self-hosted-first`.

- `qualite.md:4` est le plus proche — mais il porte sur le **gate de version mineure** (rapport
  complet, verdict PASS/FAIL), **pas** sur le geste individuel de constater son propre artefact.
- `confirmation-actes-destructifs` porte sur le **risque avant action**, pas sur la **preuve après
  action**.

→ **Aucun ne couvre le besoin. Création justifiée.**

**Forme** : fichier de bibliothèque en bonne et due forme, frontmatter aligné sur ses voisins
(`id`, `label`, `policy`, `trigger` — cf. `qualite.md:1-6`), **pas un paragraphe de charte**.

- `id: preuve-avant-declaration`
- `label` : Preuve avant déclaration
- `policy` (esquisse) : « Un agent ne déclare **fait**, **livré** ou **supprimé** que ce qu'il a
  **constaté** sur l'artefact produit : rendre et regarder un visuel, relire le fichier après
  écriture, exécuter la vérification. Une intention d'action ne vaut pas constat. »
- `trigger` : « toute déclaration de complétion / livraison / suppression »

**Atomique ou composé ?** **Atomique.** C'est un principe (famille `principles`), qui n'a pas de
mécanisme de composition ; et son énoncé est **irréductible** — il ne se décompose pas en gestes
plus fins.

**Réutilisation attendue** : cité par `loki.md` (qui garde sa **déclinaison graphique** concrète —
la boucle `qlmanage`/`Read` reste spécifique) **et** par `gandalf.md` (cf. instruction **Gandalf**). C'est
précisément le geste « élément à part que l'on compose plutôt qu'un paragraphe interne ».

### Autres familles — aucune création

| Famille | Besoin ? | Vérification |
|---|---|---|
| `skills` | non | `iakaframe-naonedge` couvre le rôle (nom à revoir → § 6, **phase 2**) |
| `guardrails` | non | `identity` + `perimeter` suffisent |
| `rituals` | non | les 5 existants ne touchent pas le design ; en créer un doublonnerait la skill |
| `workflows` | non | cf. inventaire § « workflow » (`phase1-inventaire-bibliotheque.md`) |
| `scaffolds` | **non, mais candidat noté** | Loki produit une **structure type** : `iakagraph/etudes/<projet>/` (`:98-108`). Un scaffold serait défendable — mais la règle est **déjà écrite et opérante** dans la charte + vérifiée par Aragorn (`:107-108`). **Réutiliser avant créer → on ne crée pas** au MVP. Candidat pour plus tard. |
| `roles` | phase 2 | `library/roles/design.md` existe |

## 6. Laissé à la phase 2

- **Renommage `iakaframe-naonedge` → nom par geste** (ex. `iakaframe-design`). Le nom actuel désigne
  une **marque**, ce que la convention de nommage par geste proscrit. **Mais renommer une skill
  touche `SKILL_OF`, `DEFAULT_SKILLS` et le `skills:` de la persona → structurel.** Gelé.
- Re-vendorage GUI, `Skill` au binding, `roleKey`, `library/roles/`.

## 7. Critères d'acceptation

| # | Critère | Vérification |
|---|---|---|
| LK-A1 | *(déplacé au **lot 0**)* — `library/principles/preuve-avant-declaration.md` existe et son frontmatter est conforme | **contrôlé au lot 0**, plus ici |
| LK-A2 | Le principe est énoncé en termes **transverses** (pas graphiques) | relecture |
| LK-A3 | `loki.md` **cite** le principe et conserve sa déclinaison graphique concrète | relecture — la boucle `:66-87` **n'est pas supprimée** |
| **LK-A4** | **RÉVISÉ (levée B-1)** — les **3 occurrences de ce lot** portent **NaonEdge dark** ; plus aucune mention de Cinabre comme **défaut** ni de « à confirmer » | `grep -rn "Cinabre\|à confirmer" library/personas/loki.md library/skills/iakaframe-naonedge/` = **0** |
| **LK-A4b** | La `description` de la skill (`SKILL.md:4`) est **exempte de point ouvert** — surface de routage saine | lecture ciblée de la ligne 4 |
| **LK-A4c** | La 4ᵉ occurrence (`nathalie.md:41`) est **hors de ce lot** et traitée par N-3 | vérifier qu'elle n'est **pas** modifiée ici |
| LK-A5 | **Aucun jalon** ajouté à Loki ; l'absence est **actée comme choix** | relecture |
| LK-A6 | `tools`, `skills`, `guardrails` **inchangés** | diff |
| LK-A7 | Aucun champ hors périmètre modifié ; **aucun renommage de skill** | diff |
| LK-A8 | Golden + déployé régénérés | `agents generate --check` = **0** |
| LK-A9 | Suite CLI verte | `node --test` ; le principe est listé par **`iakaframe list principles`** *(syntaxe corrigée au gate LG-5 : `list --type principles` n'existe pas — `ERR_PARSE_ARGS_UNKNOWN_OPTION`)* |

## 8. Critère de « fini »

1. `gen-agents-golden.mjs` · 2. `agents generate --global` + `--check` = 0 · 3. `node --test` vert ·
4. **PAS de re-vendorage GUI** (dette assumée, 2026-07-19) · 5. Commit dédié.

## 9. Estimation

**~0,25 j-h** — LK-1 (Cinabre sur 3 emplacements) + LK-2 (acter l'absence de jalon).
*(Était ~0,5 : **−0,25**, le principe passant au **lot 0**.)* Complexité **faible**. Risque **faible**.

*Inconnues* : l'issue Cinabre est **tranchée** (NaonEdge dark) ; il ne reste que la **duplication du
tableau canon** entre `loki.md:53-57` et `iakaframe-naonedge/SKILL.md:35`, à corriger aux deux
endroits sans les dédupliquer (dédup = structure, phase 2).

> **Dépendances de ce lot** *(rappel — la source de l'ordre est
> `phase1-inventaire-bibliotheque.md` **§ 0.1**)* : **APRÈS le lot 0** ; **AVANT le lot Nathalie**
> (canon avant citation).
> La dépendance « Loki avant Gandalf » **n'existe plus** : le principe vient du lot 0.
