# Instruction — Rituel d'identité des agents (auto-annonce + restitution du badge en relais)

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2). Cible : `C:\work\iakaframe` (la méthode elle-même).
> Statut : **à valider par Stéphane** avant exécution. Doc en français, identifiants/code en anglais.

---

## 1. Problème

L'identité de l'agent qui parle **n'est pas garantie visible** par Stéphane. Deux cas concrets :

1. **Auto-annonce non tenue** — un agent répond sans préfixer son badge `<pastille> [ROYAUME][Nom]`,
   alors que sa définition l'exige déjà. La règle existe mais reste « molle » : elle ne couvre que
   les « questions / prises de parole », pas **toute** réponse, et n'impose pas le badge **en
   première ligne**.
2. **Perte du badge en relais (cause racine)** — quand un orchestrateur (🦅 Odin / 🛡️ Aragorn /
   Claude principal) dispatche un **subagent** via l'outil Agent, le travail du subagent lui revient
   comme **résultat d'outil**, et l'orchestrateur le **restitue dans SA voix**, fondu, sans le badge
   de l'émetteur. Stéphane ne sait plus **qui** a parlé (ex. il aurait dû voir un bloc
   `🔴 [PORTEFEUILLE][Gimli]` ou `🔴 [ROYAUME][Gimli]`, pas la prose d'Odin).

**Fait technique vérifié** (état de l'art Claude Code, juin 2026) : un subagent travaille dans un
**contexte séparé** ; **seul son message final** revient au parent via le résultat de l'outil Agent,
et le parent **peut le résumer dans sa propre réponse**. La perte d'attribution n'est donc pas un
bug isolé mais le **comportement par défaut** du relais — il faut une **règle explicite** qui oblige
l'orchestrateur à restituer sous le badge de l'émetteur.
Sources : [Subagents in the SDK — Claude Code Docs](https://code.claude.com/docs/en/agent-sdk/subagents),
[Claude Code Subagents: A Practical 2026 Guide — Nimbalyst](https://nimbalyst.com/blog/claude-code-subagents-guide/).

---

## 2. Constat sur l'existant (lecture seule — déjà en place)

- **Format des badges déjà défini** : `methode-de-travail.md` § « Identité des agents » (lignes ~194-234) —
  gabarit `<pastille> [ROYAUME][Agent]`, table des pastilles par **phase** (🔵 cadrage / 🔴 dev /
  🟢 staging / 🟣 prod / 🟡 portefeuille ; ⬜ transverse par défaut), périmètre STRICT (jamais sur
  logs / traces / sortie d'outils). **Aucune** règle sur le relais d'un subagent.
- **Les 8 agents définissent déjà leur badge** dans leur section `## Identité (parole adressée à
  l'utilisateur)` (source = image dans `C:\work\iakaframe\agents\*.md`) :
  - `odin.md:42-45` → `🟡 [PORTEFEUILLE][Odin]`
  - `aragorn.md:69-73` → `<pastille> [ROYAUME][Aragorn]`, phase servie, ⬜ défaut
  - `gandalf.md:48-51` → `🔵 [ROYAUME][Gandalf]`
  - `gimli.md:45-48` → `<pastille> [ROYAUME][Gimli]`, 🔴 dev / 🟢 staging
  - `legolas.md:51-55` → `<pastille> [ROYAUME][Legolas]`, 🔴 / 🟢
  - `helm.md:44-47` → `🟣 [ROYAUME][Helm]`
  - `loki.md:40-43` → `<pastille> [ROYAUME][Loki]`, phase servie, ⬜ défaut
  - `nathalie.md:33-36` → `<pastille> [ROYAUME][Nathalie]`, phase servie, ⬜ défaut
  - `_TEMPLATE.md:31-36` → gabarit générique.
- **Écart précis** : la couverture badge est **complète** pour l'auto-annonce (cas 1), mais la
  formulation est « molle » (« question / prise de parole », pas « toute réponse / première ligne »).
  Et **aucun fichier** (ni `methode-de-travail.md`, ni `CLAUDE.md` global, ni skill
  `iakaframe-aragorn`, ni `odin`) ne traite la **restitution en relais** (cas 2). Recherche
  `relais|restitu|sous le badge|émetteur` : zéro occurrence pertinente côté règle.
- **Déploiement** : la team vit **en global** (`C:\Users\sjupi\.claude\agents\` + `skills\`). La
  **source = image** est `C:\work\iakaframe\agents\*.md` et `C:\work\iakaframe\skills\*`. Le
  redéploiement = **copie** image → global (réf. `team-globale-niveau-claude.md`).

---

## 3. Décision retenue (MVP — réutiliser le format § Identité existant)

### Décision 3.1 — Auto-annonce généralisée et durcie (cas 1)
Conserver le gabarit existant `<pastille> [ROYAUME][Nom]`, mais **durcir** la formulation dans les
8 définitions `agents/*.md` + `_TEMPLATE.md` ET dans le § Identité de `methode-de-travail.md` :
> Le badge **DOIT** apparaître **en première ligne de TOUTE réponse adressée à Stéphane** (pas
> seulement les questions) — jamais sur les logs, traces de réflexion, sortie d'outils.

Aucune nouvelle pastille, aucun nouveau format : on **harmonise** la phrase, on ne réinvente rien.

### Décision 3.2 — Restitution du badge en relais (cas 2)
Quand un orchestrateur (Odin / Aragorn / Claude principal) **relaie** le résultat d'un subagent, il
**DOIT restituer ce travail dans un bloc identifié SOUS le badge de l'agent émetteur**, sans le
fondre dans sa propre voix :
> 🔴 `[ROYAUME][Gimli]` — restitué par Aragorn
> {le message du subagent, tel quel ou cité, pas reformulé en « je »}
>
> 🛡️ `[ROYAUME][Aragorn]` {commentaire d'orchestration de l'orchestrateur, séparé}

Règle : l'orchestrateur **ne reformule jamais à la première personne** le travail d'un subagent ;
il **cite/encadre** sous le badge de l'émetteur, puis ajoute **son propre badge** s'il commente.

### Décision 3.3 — Emplacement de la règle de restitution (3.2) — **CHOIX**
**Inscrire la règle dans `methode-de-travail.md` § Identité (source de vérité du format)**, **ET**
la **répercuter** dans : le skill `iakaframe-aragorn` (orchestrateur intra-équipe), la définition
`agents/odin.md` + skill `iakaframe-odin` (orchestrateur portefeuille), et le `CLAUDE.md` global
(pour couvrir « Claude principal » qui n'est ni Odin ni Aragorn mais peut dispatcher).

**Justification du choix** (les 3 emplacements possibles, tranchés) :
- `methode-de-travail.md` § Identité = **canon du format d'identité**. C'est là que vit déjà la
  règle d'auto-annonce et la table des pastilles → la restitution est **le même sujet** (qui parle).
  C'est l'emplacement **principal et obligatoire**.
- skill `iakaframe-aragorn` (+ `agents/aragorn.md`) = Aragorn est l'orchestrateur **opérationnel**
  qui dispatche le plus souvent via l'outil Agent → la règle doit être **dans sa procédure** pour
  être appliquée, pas seulement référencée. Idem **Odin** (dispatch portefeuille).
- `CLAUDE.md` global = capte le cas « **Claude principal** / orchestrateur non personnifié » qui
  dispatche un subagent hors persona. Sans ça, le cas 2 signalé par Stéphane (« Odin / Claude
  principal ») resterait **non couvert** quand aucun agent nommé n'est actif.

Donc : **règle canonique dans `methode-de-travail.md`**, **répercutée** (renvoi + résumé court)
dans `iakaframe-aragorn`, `iakaframe-odin`, `agents/aragorn.md`, `agents/odin.md`, et `CLAUDE.md`
global. C'est cohérent avec l'architecture « source = image, déploiement global ».

---

## 4. Périmètre

### Inclus
- Durcissement de la phrase d'auto-annonce (cas 1) dans les 9 fichiers `agents/` + § Identité de
  `methode-de-travail.md`.
- Ajout de la règle de restitution en relais (cas 2) dans `methode-de-travail.md` § Identité +
  répercussion dans `iakaframe-aragorn`, `iakaframe-odin`, `agents/aragorn.md`, `agents/odin.md`,
  `CLAUDE.md` global.
- **Redéploiement global** : copie image (`C:\work\iakaframe\agents\*` + `skills\iakaframe-aragorn`,
  `skills\iakaframe-odin`) vers `C:\Users\sjupi\.claude\agents\` + `skills\`.
- Mise à jour de l'état des lieux + commit (`iakaframe update`).

### Exclu
- Toute modification du **format** des badges, des pastilles, ou de la table des phases (inchangés).
- Tout mécanisme automatique (hook, script de réécriture de réponse) : le respect des badges reste
  **comportemental** (instruction dans les définitions), conforme au MVP « pas de plomberie ».
- La coloration ANSI « vraie couleur » (`iaka-say`) : reste optionnelle, hors périmètre.
- Le contenu métier des autres skills (init, docker, forgejo, etc.).

---

## 5. Fichiers touchés (chemins précis + action)

> **Règle d'or** : on édite **la source = image** (`C:\work\iakaframe\…`), **puis** on redéploie
> vers le global (`C:\Users\sjupi\.claude\…`). On **n'édite jamais** la copie déployée à la main.

| # | Fichier (source = image) | Action | Contenu |
|---|---|---|---|
| 1 | `C:\work\iakaframe\methode-de-travail.md` | **éditer** | § Identité : durcir l'auto-annonce (« première ligne de TOUTE réponse ») + **ajouter** un sous-bloc « Restitution en relais » (règle 3.2 + exemple bloc Gimli/Aragorn). |
| 2 | `C:\work\iakaframe\agents\odin.md` | **éditer** | § Identité : durcir + ajouter règle de restitution (Odin = orchestrateur portefeuille). |
| 3 | `C:\work\iakaframe\agents\aragorn.md` | **éditer** | § Identité : durcir + ajouter règle de restitution (Aragorn = orchestrateur intra-équipe). |
| 4 | `C:\work\iakaframe\agents\gandalf.md` | **éditer** | § Identité : durcir la phrase d'auto-annonce. |
| 5 | `C:\work\iakaframe\agents\gimli.md` | **éditer** | § Identité : durcir la phrase d'auto-annonce. |
| 6 | `C:\work\iakaframe\agents\legolas.md` | **éditer** | § Identité : durcir la phrase d'auto-annonce. |
| 7 | `C:\work\iakaframe\agents\helm.md` | **éditer** | § Identité : durcir la phrase d'auto-annonce. |
| 8 | `C:\work\iakaframe\agents\loki.md` | **éditer** | § Identité : durcir la phrase d'auto-annonce. |
| 9 | `C:\work\iakaframe\agents\nathalie.md` | **éditer** | § Identité : durcir la phrase d'auto-annonce. |
| 10 | `C:\work\iakaframe\agents\_TEMPLATE.md` | **éditer** | § Identité : durcir le gabarit (futurs agents). |
| 11 | `C:\work\iakaframe\skills\iakaframe-aragorn\SKILL.md` | **éditer** | § Identité (l.100-103) : ajouter règle de restitution en relais + renvoi méthode. |
| 12 | `C:\work\iakaframe\skills\iakaframe-odin\SKILL.md` | **éditer** | § Identité : ajouter règle de restitution en relais + renvoi méthode. |
| 13 | `C:\Users\sjupi\.claude\CLAUDE.md` | **éditer** | Ajouter, sous « Conventions permanentes », une puce : tout orchestrateur (y.c. Claude principal) qui relaie un subagent restitue sous le badge de l'émetteur. |
| 14 | `C:\Users\sjupi\.claude\agents\*.md` (8) + `C:\Users\sjupi\.claude\skills\iakaframe-aragorn\SKILL.md` + `...\iakaframe-odin\SKILL.md` | **redéployer (copie)** | Copier les sources modifiées (1-12) vers le global. **Pas d'édition manuelle.** |
| 15 | `C:\work\iakaframe\specs\etat-des-lieux.md` | **régénéré** | Via `iakaframe update` (snapshot + commit + push). |

> Note : `_TEMPLATE.md` (#10) n'est pas déployé comme agent actif ; il sert de gabarit aux futurs
> agents → pas de copie dans le global, mais à maintenir cohérent.

---

## 6. Critères d'acceptation (vérifiables)

### Auto-annonce durcie (cas 1)
- [ ] Dans `methode-de-travail.md` § Identité, la règle d'auto-annonce mentionne explicitement
      « **première ligne de TOUTE réponse adressée à l'utilisateur** » (pas seulement « question / prise de parole »).
- [ ] Les 9 fichiers `C:\work\iakaframe\agents\*.md` (8 agents + `_TEMPLATE.md`) ont une section
      `## Identité` dont la phrase est **harmonisée** sur cette formulation durcie.
- [ ] Aucune pastille, aucun `[ROYAUME]`, aucune table de phases n'a été modifié (format inchangé) :
      `grep` des pastilles 🔵🔴🟢🟣🟡⬜ donne le **même** mapping qu'avant.
- [ ] Le périmètre STRICT est conservé : la règle dit toujours « **jamais** sur les logs / traces /
      sortie d'outils ».

### Restitution en relais (cas 2)
- [ ] `methode-de-travail.md` § Identité contient un **sous-bloc nommé** (ex. « Restitution en
      relais ») énonçant : un orchestrateur qui relaie un subagent **restitue sous le badge de
      l'agent émetteur**, **sans reformuler à la première personne**, et ajoute **son propre badge**
      s'il commente.
- [ ] Ce sous-bloc contient un **exemple concret** montrant un bloc `🔴 [ROYAUME][Gimli]` restitué,
      distinct du badge `🛡️ [ROYAUME][Aragorn]` de l'orchestrateur.
- [ ] La règle de restitution est présente dans `agents/odin.md`, `agents/aragorn.md`,
      `skills/iakaframe-aragorn/SKILL.md` et `skills/iakaframe-odin/SKILL.md` (résumé + renvoi à
      `methode-de-travail.md` § Identité).
- [ ] `C:\Users\sjupi\.claude\CLAUDE.md` contient une puce « Conventions permanentes » imposant la
      restitution sous le badge de l'émetteur pour **tout orchestrateur, y compris Claude principal**.

### Déploiement & clôture
- [ ] Les 8 `agents/*.md` modifiés sont **copiés** dans `C:\Users\sjupi\.claude\agents\` et sont
      **identiques** à la source (diff vide).
- [ ] `iakaframe-aragorn/SKILL.md` et `iakaframe-odin/SKILL.md` modifiés sont copiés dans
      `C:\Users\sjupi\.claude\skills\…` (diff vide avec la source).
- [ ] `specs/etat-des-lieux.md` régénéré + commit conventional (`docs:` ou `feat:`) poussé sur
      Forgejo via `iakaframe update`.

### Validation comportementale (test réel par Stéphane)
- [ ] Test cas 1 : invoquer un agent (ex. Gandalf) → sa réponse **commence** par
      `🔵 [ROYAUME][Gandalf]`.
- [ ] Test cas 2 : demander à un orchestrateur (Aragorn/Odin) de dispatcher un subagent (ex. Gimli)
      → le retour montre un **bloc badgé `[…][Gimli]`** distinct, et non la prose de l'orchestrateur.

---

## 7. Notes pour Gimli (exécution)
- Ne **pas** toucher au format ni aux pastilles : c'est une **harmonisation de phrase** + **ajout**
  d'une règle, pas une refonte.
- Éditer **uniquement la source = image** (`C:\work\iakaframe\…`), puis **copier** vers le global.
  Ne jamais éditer les copies déployées directement (elles seraient écrasées au prochain redéploiement).
- Vérifier après coup : `grep "## Identité"` sur les 9 fichiers source + diff source ↔ global vide.
- Clôture : `iakaframe update -Reason version -Note "rituel identite agents : auto-annonce durcie + restitution en relais"`.
