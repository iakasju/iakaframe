# Persona Odin — amélioration de contenu (phase 1)

> **Rang : non déclaré ici.** L'ordre de la série a une **source unique** —
> `phase1-inventaire-bibliotheque.md` **§ 0.1** (dépendances) et **§ 0.2** (ordre dérivé).
> Cette instruction déclare ses **dépendances**, jamais sa position.
>
> **Dépendance : APRÈS le lot 0** (comme tout lot de la série). **Aucune autre.**

> Instruction de cadrage (Gandalf, P1). Branche `feat/amelioration-personas`.
> **Périmètre CONTENU uniquement.** Dérivée de `audit-amelioration-roster-personas.md` (analyse
> non refaite ici). Un commit dédié à cette persona.

## 1. Cadre de la phase — ligne de partage

**DANS le périmètre** : mission, périmètre *fait / ne fait pas*, obligations opérationnelles, gestes,
`guardrails` déclarés, `tools` du binding, `skills` déclarées au frontmatter, richesse et routabilité
de la `description`, présence du geste **jalon** dans la charte.

**HORS périmètre — phase 2 (réconciliation d'équipe)** : `roleKey`, `library/roles/`,
`methods/iakaframe.md` `roleKeys`, promotion de `deploiement`, `roleIndex`, `DEFAULT_SKILLS`,
`CANONICAL_ROLES`, vignette / 8ᵉ paire, `assemble`, **re-vendorage GUI**, `roster.test.ts`,
ajout de `Skill` au binding.

## 2. Trois faits qui valent pour toute cette phase

1. **Golden + déployé régénérés à chaque persona.** `node cli/scripts/gen-agents-golden.mjs` puis
   `iakaframe agents generate --global` (vérif `--check` = 0). Sans cela la parité **interne** casse
   dès le premier pas. **C'est un critère de fini, pas une option.**
2. **Le re-vendorage GUI n'est PAS fait dans cette phase.** ⚠️ *Formulation corrigée au gate :
   **rien n'est rompu à ce jour** — Legolas l'a vérifié par diff, les fixtures sont identiques. La
   rupture **surviendra au premier commit** de la phase.* La parité cross-repo **sera donc
   volontairement rompue**, et **rien ne la détectera** (`vendor-check` n'existe pas encore).
   **Dette assumée, ouverte au premier commit**, à résorber en phase 2 — ni oubli ni négligence. *Corollaire à ne pas découvrir en route : toute modification du
   binding fait diverger les fixtures GUI vendorées et les assertions de tools en dur de
   `parite-generateurs.test.ts:147-156`. **La suite GUI n'est pas jouée dans cette phase.***
3. **Ajouter des `skills:` au frontmatter n'a AUCUN effet runtime** tant que le générateur ne les
   projette pas (lot 2, phase 2). On écrit **le canon juste** ; l'activation viendra après.

## 3. État audité — Odin (portefeuille, 🟡)

| Dim. | Verdict | Preuve |
|---|---|---|
| 1 Charte | ✅ | mission/posture CTO nettes (`odin.md:27-57`), périmètre borné (`:59-69`) |
| 2 Expert MoE | ✅ | frontière Odin↔Aragorn explicite (`:90-94`) |
| 3 Jalons | ❌ | **0 mention** alors qu'il ouvre/ferme des transitions portefeuille |
| 4 Tools | ❌ | `delegation` déclaré (`:9`) + dispatch décrit (`:108-110`) mais **pas de `Task`** au binding (`bindings/iakaframe-claude-default.md:8`) |
| 5 Skills | ⚠️ | `[iakaframe-odin, iakastart]` — **canon correct**, non déployé (structure, phase 2) |
| 6 Hooks | ❌ | `delegation-guard` **inerte** faute de `Task` |
| 7 Cohérence | *(hors périmètre)* | — |

## 4. Changements demandés

| Id | Changement | Fichier | Statut |
|---|---|---|---|
| **O-1** | **Accorder `Task`** à Odin | `bindings/iakaframe-claude-default.md:8` | **arbitré** (CH-B, 2026-07-19) |
| **O-2** | **Décrire le geste jalon** dans la charte | `library/personas/odin.md` (§ Périmètre ou nouveau § Gate) | à faire |
| O-3 | *(optionnel)* Purger « Slack » du canon de sa skill | `library/skills/iakaframe-odin/SKILL.md:55,64` | à trancher — cf. § 6 |

### O-1 — `Task` (arbitré)

`tools: [Read, Grep, Glob, Bash]` → **`+ Task`**. La charte **n'est pas corrigée** : `:9` et
`:108-122` décrivaient déjà la capacité ; c'est le binding qui rattrape la charte. Le
`delegation-guard` devient **actif** pour Odin.

### O-2 — geste jalon

Odin **pose et ferme des transitions** aujourd'hui invisibles : bascule de focus d'un projet à
l'autre, démarrage de projet, ouverture/clôture d'un **chantier transverse**. La charte doit énoncer
qu'il les **matérialise via `iakaframe jalon`** (titre FIGlet `Standard` + tableau
émetteur/contenu/récepteur, **récepteur = l'utilisateur**), fichiers en `chemin:ligne` dans son
message, « JALON VALIDÉ » + la suite à la validation.

> ⚠️ **Ne pas plaquer un paragraphe générique.** Un jalon n'a de sens qu'à une **transition réelle** ;
> la rédaction doit nommer **ses** transitions (portefeuille), pas recopier celle d'un autre agent.

## 5. Ce qui est laissé à la phase 2 (bloqué par la structure)

- **`iakastart` n'est pas déployée** : `SKILL_OF` ne rend qu'une skill par rôle. Le frontmatter
  d'Odin est **déjà correct** → **rien à faire ici**, l'activation relève du lot 2.
- **Le geste jalon ne sera pas outillé** : la skill `iakaframe-jalon` n'est pas déployée en runtime.
  O-2 écrit **la charte juste** ; le geste s'activera au lot 2. **Assumé, pas contourné.**
- `Skill` au binding, re-vendorage GUI, `roleKey`.

## 6. Point à trancher (décideur)

**O-3 — purge « Slack » dans `library/skills/iakaframe-odin/SKILL.md:55,64`.** Le canon d'Odin
contredit le canal iakaHub ↔ Discord. C'est du **contenu**, donc éligible ; mais cela **recoupe**
l'item `BACKLOG.md:10` (« Scories Slack résiduelles »), qui couvre aussi `README.md`,
`library/skills/README.md` et la vitrine HTML. *Reco Gandalf : **laisser à l'item backlog*** — le
traiter ici purgerait 2 occurrences sur 5+ et donnerait l'illusion que le sujet est clos.

## 7. Critères d'acceptation

| # | Critère | Vérification |
|---|---|---|
| O-A1 | `Task` figure dans les `tools` d'Odin | `bindings/…:8` ; contrat déployé porte `tools: …, Task` |
| O-A2 | La charte décrit le geste jalon **sur ses propres transitions** | relecture : au moins une transition portefeuille nommée |
| O-A3 | Le jalon décrit inclut FIGlet + tableau 3 zones + `chemin:ligne` + « JALON VALIDÉ » | relecture |
| O-A4 | `guardrails` inchangés (`identity, perimeter, delegation`) | `odin.md:9` |
| O-A5 | Aucun champ hors périmètre modifié (`roleKey`, `royaume`, `pastille`, `vignette`) | diff |
| O-A6 | Golden régénéré + déployé régénéré | `agents generate --check` sort **0** |
| O-A7 | Suite CLI verte | `node --test` |
| O-A8 | La `description` reste inchangée ou enrichie sans perte de routabilité | diff + relecture |

## 8. Critère de « fini »

1. `node cli/scripts/gen-agents-golden.mjs`
2. `iakaframe agents generate --global` puis `--check` = 0
3. `node --test` vert (CLI)
4. **PAS de re-vendorage GUI** (§ 2 pt 2) — dette assumée, datée 2026-07-19
5. Commit dédié à Odin

## 9. Estimation

**~0,5 j-h.** Complexité **faible** (1 ligne de binding + 1 paragraphe de charte). Risque **faible**.
*Inconnue* : formulation des transitions portefeuille — Odin n'a pas de gate formalisé dans la
méthode, la liste de **ses** transitions est à arrêter à la rédaction (switch / démarrage / chantier
transverse : suffisant ?).
