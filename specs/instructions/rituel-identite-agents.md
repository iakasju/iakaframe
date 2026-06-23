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

### Décision 3.4 — La POSITION de la pastille encode l'ouverture/la clôture (jamais les mots « START »/« STOP »)
Le « double badge » d'une intervention s'exprime **par la position de la pastille**, pas par un mot-clé :
- **Ouverture** = pastille **AVANT** le bloc : `🟡 [PORTEFEUILLE][Odin] — <annonce de ce qui va être fait>`.
- **Clôture** = pastille **APRÈS** le bloc : `<texte final> [PORTEFEUILLE][Odin] 🟡`.

Les mots « START » / « STOP » (et toutes leurs variantes : `(START)`, `— START :`, `(start + stop)`, etc.) sont **bannis du texte des badges et des messages d'identité** : ils sont **redondants** avec la position. La **logique** du hook `identity-guard.ps1` encode déjà cette convention (pastille avant = ouvrant, pastille après = fermant) et **reste inchangée** ; seul le **wording** des commentaires/messages de `identity-guard.ps1` et `identity-remind.ps1` est reformulé (« ouverture / pastille avant » et « clôture / pastille après »).

### Décision 3.5 — Délégation : chaîne de badges ininterrompue, sans interjection de l'orchestrateur
Sur une délégation A→B, la séquence est **strictement** :
1. **A ouvre** (pastille avant) et **annonce qu'il délègue à B** ;
2. **A clôt** (pastille après) ;
3. **immédiatement B ouvre** (pastille avant) et parle **à la première personne** ;
4. **B travaille puis restitue** ;
5. **B clôt** (pastille après) ;
6. **A rouvre** pour restituer en relais (sous le badge de B) et/ou commenter.

**Interdit** : entre l'ouverture de B (étape 3) et la clôture de B (étape 5), l'orchestrateur A **ne place AUCUNE phrase dans SA voix** (pas de « je le dispatche », « règle enregistrée », « voilà le retour », etc.). A ne reprend la parole **qu'après** la clôture de B. Cette décision **complète** la règle « Restitution en relais » (Décision 3.2 / § Identité) sans la remplacer : la restitution dit *comment* citer B ; cette décision dit *quand* A a le droit de reparler. Portée : **orchestrateurs uniquement** (🦅 Odin / 🛡️ Aragorn / Claude principal).

### Décision 3.6 — Aucun agent ne parle sous le badge d'un autre (citation verbatim)
Un badge `[ROYAUME][Agent]` n'introduit **QUE les mots propres de l'agent qu'il nomme**. Lors d'une restitution en relais, l'orchestrateur **cite VERBATIM** la sortie de l'agent émetteur sous le badge de celui-ci — **jamais** une reformulation, condensation ou synthèse. Toute reformulation/condensation/sélection/commentaire est la **voix de l'orchestrateur** et doit apparaître **sous SON propre badge**, pas sous celui de l'émetteur. **Interdiction de ventriloquie** : on n'écrit jamais le badge d'un agent pour lui faire dire des mots qu'il n'a pas produits. Cette décision **durcit** la « Restitution en relais » (Décision 3.2) : 3.2 dit *présenter sous le badge de l'émetteur*, 3.6 précise *uniquement ses mots réels, verbatim*. Portée : **orchestrateurs uniquement** (🦅 Odin / 🛡️ Aragorn / Claude principal).

### Décision 3.7 — La pastille transverse / par défaut passe du carré blanc ⬜ au rond orange 🟠
La pastille des rôles **sans phase fixe** (transverses : 🛡️ Aragorn, Loki, Nathalie, et le « par défaut » du gabarit) était le **carré blanc ⬜ (U+2B1C)** ; elle devient le **rond orange 🟠 (U+1F7E0)**. **Remplacement total** : ⬜ n'apparaît plus dans aucun badge, table ou exemple ; 🟠 le remplace partout. Le reste du mapping de phases est **inchangé** (🔵 cadrage · 🔴 dev · 🟢 staging · 🟣 prod · 🟡 portefeuille). **Impact technique** : la liste blanche des pastilles du garde `identity-guard.ps1` (variable `$pastilles`, définie par code points) doit **remplacer `0x2B1C` par `0x1F7E0`** — c'est un changement de la **liste autorisée** (donnée), la mécanique de détection ouvrant/fermant restant inchangée. Après ce changement, le garde **accepte 🟠** et **n'accepte plus ⬜**.

### Décision 3.8 — Propagation du rituel d'identité aux kits Codex & Ollama
Les kits portables `kit-codex/AGENTS.md` (§ Identité, l.78-83) et `kit-ollama/AGENTS.md`
(§ Identité, l.60-63) portent **déjà** le mapping de pastilles à jour (🔵 cadrage · 🔴 dev ·
🟢 staging · 🟣 prod · 🟡 portefeuille + **🟠 transverse**), mais **pas** les règles récentes
3.4/3.5/3.6. Mettre à niveau **leur § Identité** pour qu'il porte **en plus** du mapping :
- **3.4** — le double badge s'exprime par la **POSITION** de la pastille : pastille **AVANT** le
  bloc = ouverture, pastille **APRÈS** = clôture ; les mots « START » / « STOP » (et variantes)
  sont **bannis** des badges et messages d'identité.
- **3.5** (orchestrateurs Odin / Aragorn uniquement) — une délégation A→B est une **chaîne de
  badges sans interjection** : A ouvre + annonce qu'il délègue, A clôt, **immédiatement** B ouvre
  et parle à la 1ʳᵉ personne, B travaille puis clôt, **ensuite seulement** A rouvre ; A ne place
  **aucune phrase dans sa voix** entre l'ouverture et la clôture de B.
- **3.6** (orchestrateurs uniquement) — restitution **VERBATIM** sous le badge de l'agent émetteur ;
  **anti-ventriloquie** : on n'écrit jamais le badge d'un agent pour lui faire dire des mots qu'il
  n'a pas produits ; toute reformulation/synthèse est la voix de l'orchestrateur, sous **son** badge.

**Contraintes d'adaptation (ton « kit portable »)** : formulation **concise et autonome**, **sans
renvoi** à des fichiers internes du dépôt méthode (`methode-de-travail.md`, hooks, etc.). Important :
les kits **n'ont aucun hook garde** → la règle y est **purement comportementale** (aucune mention
d'`identity-guard.ps1` / `identity-remind.ps1`, qui n'existent pas dans ces kits). Aucune autre
section des `AGENTS.md` n'est modifiée ; le mapping de pastilles déjà à jour est **conservé tel quel**.

### Décision 3.9 — Kit Claude versionné (`kit/` → `kit-claude/`) + versement des 3 fichiers globaux
Aujourd'hui `C:\work\iakaframe\kit\` est le **starter Claude** (à copier dans un nouveau projet) ;
il contient notamment un `CLAUDE.md` **template PAR PROJET** (~3,5 Ko, ≠ du `CLAUDE.md` global de
méthode), `.claude/` et `specs/`. Par ailleurs, **3 artefacts niveau-utilisateur** vivent
**uniquement** en global (`C:\Users\sjupi\.claude\`) sans aucune source-image versionnée :
`CLAUDE.md` (global méthode), `identity-guard.ps1`, `identity-remind.ps1`. Cette décision :

1. **Renomme** le dossier `kit/` → **`kit-claude/`** (cohérence avec `kit-codex/` et `kit-ollama/` ;
   nom de dossier **avec tiret**, sans espace), via `git mv` (préserve l'historique). **[À CONFIRMER
   PAR STÉPHANE : nom `kit-claude`]**
2. **Met à jour toutes les références** à `kit/` → `kit-claude/`. Occurrences connues : `README.md`
   (l.24, 36, 39, 48) et `specs/instructions/iakaframe-multiplateforme-cli.md` (l.21). **Balayer en
   plus** `methode-de-travail.md` et le `CLAUDE.md` global (qui mentionnent « kit/ ») + tout autre
   hit via `rg "kit/"` sur `C:\work\iakaframe\`.
3. **Verse les 3 fichiers globaux comme sources versionnées** dans le kit, **SANS écraser** le
   `CLAUDE.md` **template par projet** déjà présent à la racine du kit. Emplacement **RECOMMANDÉ**
   **[À CONFIRMER PAR STÉPHANE : sous-dossier `kit-claude/global/`]** :
   - `kit-claude/global/CLAUDE.md` ← copie de `C:\Users\sjupi\.claude\CLAUDE.md` (instructions
     globales méthode, niveau utilisateur) ;
   - `kit-claude/global/hooks/identity-guard.ps1` ← copie de `C:\Users\sjupi\.claude\identity-guard.ps1` ;
   - `kit-claude/global/hooks/identity-remind.ps1` ← copie de `C:\Users\sjupi\.claude\identity-remind.ps1` ;
   - `kit-claude/global/README.md` (court, **nouveau**) : explique que ces fichiers sont les
     **artefacts de déploiement niveau-utilisateur** à copier dans `~/.claude/`
     (`C:\Users\sjupi\.claude\`), à **distinguer** du `kit-claude/CLAUDE.md` (template **par projet**).
4. **Conséquence à acter (corrige le §5)** : ces 3 fichiers ont **désormais une source-image** dans
   le dépôt → la note « exception sans source-image » du §5 devient **caduque pour ces 3 fichiers**.
   Sens de déploiement explicite : **`kit-claude/global/` (source versionnée) → `~/.claude/`
   (runtime déployé)**. Ils restent **édités/déployés vers le global**, mais leur **source de vérité
   vit maintenant dans `kit-claude/global/`**. La règle d'or « éditer la source-image, puis déployer »
   s'applique désormais aussi à eux (au lieu de « édités directement en global »).

**Hors périmètre de cette décision** : la mise à jour du **contenu** des 3 fichiers globaux par les
décisions 3.4/3.5/3.6 (déjà traitée en §5 #13/#14/#15) reste valable ; 3.9 ne fait que **leur donner
une source versionnée** et **renommer le kit**, sans rejouer leur contenu.

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

> **Colonne « Décisions »** : indique, pour chaque fichier, lesquelles des décisions **3.4** (position
> de la pastille = ouverture/clôture, bannir « START »/« STOP »), **3.5** (chaîne de badges sans
> interjection de l'orchestrateur) et **3.6** (citation verbatim, anti-ventriloquie) s'y appliquent —
> **en plus** des décisions 3.1/3.2/3.3 déjà portées par le « Contenu ». Rappel de portée : **3.5 et
> 3.6 ne concernent QUE les orchestrateurs** (🦅 Odin / 🛡️ Aragorn / Claude principal) ; les 6 contrats
> non-orchestrateurs et `_TEMPLATE.md` ne reçoivent que **3.4**.

| # | Fichier (source = image) | Action | Décisions | Contenu |
|---|---|---|---|---|
| 1 | `C:\work\iakaframe\methode-de-travail.md` | **éditer** | **3.4 + 3.5 + 3.6** | § Identité : durcir l'auto-annonce (« première ligne de TOUTE réponse ») + **ajouter** un sous-bloc « Restitution en relais » (règle 3.2 + exemple bloc Gimli/Aragorn). Énoncer la convention « pastille avant = ouverture / pastille après = clôture » (3.4), la séquence A→B sans interjection (3.5), la citation verbatim anti-ventriloquie (3.6). |
| 2 | `C:\work\iakaframe\agents\odin.md` | **éditer** | **3.4 + 3.5 + 3.6** | § Identité : durcir + ajouter règle de restitution (Odin = orchestrateur portefeuille) + 3.4/3.5/3.6. |
| 3 | `C:\work\iakaframe\agents\aragorn.md` | **éditer** | **3.4 + 3.5 + 3.6** | § Identité : durcir + ajouter règle de restitution (Aragorn = orchestrateur intra-équipe) + 3.4/3.5/3.6. |
| 4 | `C:\work\iakaframe\agents\gandalf.md` | **éditer** | **3.4 seul** | § Identité : durcir la phrase d'auto-annonce + convention pastille avant/après (3.4). |
| 5 | `C:\work\iakaframe\agents\gimli.md` | **éditer** | **3.4 seul** | § Identité : durcir la phrase d'auto-annonce + convention pastille avant/après (3.4). |
| 6 | `C:\work\iakaframe\agents\legolas.md` | **éditer** | **3.4 seul** | § Identité : durcir la phrase d'auto-annonce + convention pastille avant/après (3.4). |
| 7 | `C:\work\iakaframe\agents\helm.md` | **éditer** | **3.4 seul** | § Identité : durcir la phrase d'auto-annonce + convention pastille avant/après (3.4). |
| 8 | `C:\work\iakaframe\agents\loki.md` | **éditer** | **3.4 seul** | § Identité : durcir la phrase d'auto-annonce + convention pastille avant/après (3.4). |
| 9 | `C:\work\iakaframe\agents\nathalie.md` | **éditer** | **3.4 seul** | § Identité : durcir la phrase d'auto-annonce + convention pastille avant/après (3.4). |
| 10 | `C:\work\iakaframe\agents\_TEMPLATE.md` | **éditer** | **3.4 seul** | § Identité : durcir le gabarit (futurs agents) + convention pastille avant/après (3.4). |
| 11 | `C:\work\iakaframe\skills\iakaframe-aragorn\SKILL.md` | **éditer** | **3.4 + 3.5 + 3.6** | § Identité (l.100-103) : ajouter règle de restitution en relais + renvoi méthode + séquence A→B sans interjection (3.5) + verbatim anti-ventriloquie (3.6) + convention pastille (3.4). |
| 12 | `C:\work\iakaframe\skills\iakaframe-odin\SKILL.md` | **éditer** | **3.4 + 3.5 + 3.6** | § Identité : ajouter règle de restitution en relais + renvoi méthode + séquence A→B sans interjection (3.5) + verbatim anti-ventriloquie (3.6) + convention pastille (3.4). |
| 13 | `C:\Users\sjupi\.claude\CLAUDE.md` | **éditer** | **3.4 + 3.5 + 3.6** | Ajouter, sous « Conventions permanentes », une puce : tout orchestrateur (y.c. Claude principal) qui relaie un subagent restitue sous le badge de l'émetteur (3.2), **verbatim** (3.6), sans interjection entre ouverture et clôture de l'émetteur (3.5), pastille avant = ouverture / après = clôture sans « START »/« STOP » (3.4). **Exception sans source-image** : édité **directement en global** (pas de copie image → global). |
| 14 | `C:\Users\sjupi\.claude\identity-remind.ps1` | **éditer (global, direct)** | **3.4 seul (wording)** | Reformuler **uniquement** commentaires + messages : « ouverture / pastille avant », « clôture / pastille après » ; supprimer les mots « START »/« STOP » et variantes. **Logique intacte.** |
| 15 | `C:\Users\sjupi\.claude\identity-guard.ps1` | **éditer (global, direct)** | **3.4 seul (wording)** | Reformuler **uniquement** commentaires + messages (cf. l.61-68) ; supprimer « START »/« STOP » et variantes. **Logique de détection ouvrant/fermant inchangée (diff de logique vide).** |
| 16 | `C:\Users\sjupi\.claude\agents\*.md` (8) + `C:\Users\sjupi\.claude\skills\iakaframe-aragorn\SKILL.md` + `...\iakaframe-odin\SKILL.md` | **redéployer (copie)** | Copier les sources modifiées (1-12) vers le global. **Pas d'édition manuelle.** Les hooks (#14-15) et le `CLAUDE.md` global (#13) ne sont **pas** redéployés ici : ils sont édités directement en global. |
| 17 | `C:\work\iakaframe\specs\etat-des-lieux.md` | **régénéré** | — | Via `iakaframe update` (snapshot + commit + push). |

### 5 ter — Fichiers concernés par la Décision 3.8 (propagation kits Codex & Ollama)

> **Kits portables** : règle **purement comportementale** (pas de hook garde). On porte 3.4 + 3.5 +
> 3.6 dans la **seule § Identité**, ton concis et **sans renvoi** aux fichiers internes du dépôt
> méthode. Le mapping de pastilles (déjà à jour, 🟠 transverse compris) est **conservé tel quel**.

| Réf. | Fichier (source = image) | Action | Décisions | Contenu |
|---|---|---|---|---|
| 3.8-a | `C:\work\iakaframe\kit-codex\AGENTS.md` | **éditer** | **3.4 + 3.5 + 3.6** | § Identité (l.78-83) : ajouter, **en plus** du mapping existant, la convention pastille avant/après (3.4, « START »/« STOP » bannis), la chaîne A→B sans interjection (3.5, orchestrateurs), la citation verbatim anti-ventriloquie (3.6, orchestrateurs). Ton kit portable, autonome. |
| 3.8-b | `C:\work\iakaframe\kit-ollama\AGENTS.md` | **éditer** | **3.4 + 3.5 + 3.6** | § Identité (l.60-63) : idem 3.8-a (même contenu, même ton portable). |

### 5 quater — Fichiers concernés par la Décision 3.9 (renommage kit → kit-claude + versement global)

> **Renommage + versement.** `git mv` du dossier (préserve l'historique), mise à jour des références,
> création des sources versionnées des 3 artefacts globaux. **À CONFIRMER PAR STÉPHANE** : (a) le nom
> `kit-claude` (tiret) ; (b) l'emplacement `kit-claude/global/`.

| Réf. | Fichier / dossier | Action | Contenu |
|---|---|---|---|
| 3.9-a | `C:\work\iakaframe\kit\` → `C:\work\iakaframe\kit-claude\` | **renommer (`git mv`)** | Renommage du dossier (historique préservé). **N'écrase pas** le `CLAUDE.md` template par projet à la racine du kit. |
| 3.9-b | `C:\work\iakaframe\README.md` (l.24, 36, 39, 48) | **éditer** | Remplacer chaque référence `kit/` → `kit-claude/`. |
| 3.9-c | `C:\work\iakaframe\specs\instructions\iakaframe-multiplateforme-cli.md` (l.21) | **éditer** | Remplacer `kit/` → `kit-claude/`. |
| 3.9-d | `C:\work\iakaframe\methode-de-travail.md` | **éditer (si occurrence)** | Remplacer toute mention `kit/` → `kit-claude/`. |
| 3.9-e | `C:\Users\sjupi\.claude\CLAUDE.md` (global) | **éditer (si occurrence)** | Remplacer toute mention `kit/` → `kit-claude/`. |
| 3.9-f | *(balayage)* `rg "kit/"` sur `C:\work\iakaframe\` | **éditer** | Convertir **tout autre** hit `kit/` (hors `kit-codex/`, `kit-ollama/`) → `kit-claude/`. |
| 3.9-g | `C:\work\iakaframe\kit-claude\global\CLAUDE.md` | **créer (copie)** | Copie de `C:\Users\sjupi\.claude\CLAUDE.md` (global méthode). **Nouvelle source-image.** |
| 3.9-h | `C:\work\iakaframe\kit-claude\global\hooks\identity-guard.ps1` | **créer (copie)** | Copie de `C:\Users\sjupi\.claude\identity-guard.ps1`. **Nouvelle source-image.** |
| 3.9-i | `C:\work\iakaframe\kit-claude\global\hooks\identity-remind.ps1` | **créer (copie)** | Copie de `C:\Users\sjupi\.claude\identity-remind.ps1`. **Nouvelle source-image.** |
| 3.9-j | `C:\work\iakaframe\kit-claude\global\README.md` | **créer (nouveau)** | Court : ces fichiers = artefacts de déploiement **niveau-utilisateur** à copier dans `~/.claude/` ; à distinguer du `kit-claude/CLAUDE.md` (template **par projet**). Sens : `kit-claude/global/` (source) → `~/.claude/` (runtime). |

> **Ordre recommandé pour Gimli (3.9)** : (1) `git mv kit kit-claude` **avant** d'éditer les
> références ; (2) mettre à jour les références ; (3) créer `kit-claude/global/` et y **copier** les
> 3 fichiers globaux **dans leur état déjà mis à jour** par 3.4/3.5/3.6 (§5 #13/#14/#15), pour que
> source-image et runtime soient identiques d'emblée.

> Notes :
> - `_TEMPLATE.md` (#10) n'est pas déployé comme agent actif ; il sert de gabarit aux futurs
>   agents → pas de copie dans le global, mais à maintenir cohérent. **3.4 seul.**
> - **Source-image des 3 artefacts globaux — corrigé par la Décision 3.9** : les **deux hooks**
>   (#14-15 : `identity-remind.ps1`, `identity-guard.ps1`) et le **`CLAUDE.md` global** (#13)
>   **n'avaient** historiquement **aucune source-image** (édités directement en global). **La
>   Décision 3.9 lève cette exception** : ils reçoivent désormais une **source versionnée** dans
>   `kit-claude/global/` (cf. §5 quater, 3.9-g/h/i). Le sens de déploiement devient
>   **`kit-claude/global/` (source) → `~/.claude/` (runtime)**. **Ordre d'exécution** : appliquer
>   d'abord leurs modifications de contenu (#13/#14/#15 : 3.4/3.5/3.6, wording des hooks, ⬜→🟠 du
>   garde), **puis** copier ces fichiers à jour dans `kit-claude/global/` pour que source et runtime
>   soient identiques. Pour les hooks, ne reformuler que leur **wording**, **jamais** leur logique.
>   Ces 3 fichiers ne passent **pas** par le redéploiement #16 (qui ne concerne que `agents/*` et les
>   skills) : leur déploiement va de `kit-claude/global/` vers `~/.claude/`.

### 5 bis — Fichiers concernés par la Décision 3.7 (⬜ → 🟠)

> **Transversal aux lignes ci-dessus.** La Décision 3.7 (remplacement total ⬜ → 🟠 pour les rôles
> **sans phase fixe**) touche **tous** les fichiers qui mentionnent le carré blanc ⬜ (U+2B1C) dans
> un badge, une table de pastilles ou un exemple. Action systématique : remplacer **chaque** ⬜
> par 🟠 (U+1F7E0). Le reste du mapping de phases (🔵🔴🟢🟣🟡) **n'est pas touché**.

| Réf. §5 | Fichier | Nature de l'occurrence ⬜ | Action 3.7 |
|---|---|---|---|
| #1 | `C:\work\iakaframe\methode-de-travail.md` | Table des pastilles, § Identité (la ligne « ⬜ transverse par défaut ») | Remplacer ⬜ → 🟠 dans la table + tout exemple de badge transverse |
| #3 | `C:\work\iakaframe\agents\aragorn.md` | § Identité : « ⬜ défaut » (pastille servie selon phase) | Remplacer ⬜ → 🟠 |
| #8 | `C:\work\iakaframe\agents\loki.md` | § Identité : « ⬜ défaut » | Remplacer ⬜ → 🟠 |
| #9 | `C:\work\iakaframe\agents\nathalie.md` | § Identité : « ⬜ défaut » | Remplacer ⬜ → 🟠 |
| #10 | `C:\work\iakaframe\agents\_TEMPLATE.md` | Gabarit : pastille « par défaut » | Remplacer ⬜ → 🟠 |
| #11 | `C:\work\iakaframe\skills\iakaframe-aragorn\SKILL.md` | § Identité / badge transverse Aragorn | Remplacer ⬜ → 🟠 si présent |
| #12 | `C:\work\iakaframe\skills\iakaframe-odin\SKILL.md` | Mention table/badge transverse | Remplacer ⬜ → 🟠 si présent |
| #13 | `C:\Users\sjupi\.claude\CLAUDE.md` | Édité **directement en global** (sans source-image) | Remplacer ⬜ → 🟠 **si ⬜ y figure** |
| #15 | `C:\Users\sjupi\.claude\identity-guard.ps1` | **Liste blanche `$pastilles` (l.53)** : code point `0x2B1C` | Remplacer **`0x2B1C` → `0x1F7E0`** dans `$pastilles` |

> **Cas particulier du garde (#15)** : pour `identity-guard.ps1`, 3.7 modifie **uniquement la donnée
> de liste blanche** (`$pastilles`), **pas la logique de détection** ouvrant/fermant
> (`Test-BadgeOpen` / `Test-BadgeClose`, regex `$pastAlt`). C'est cohérent avec la Décision 3.4
> (logique du garde inchangée) : 3.4 ne touche que le **wording**, 3.7 ne touche que la **liste
> autorisée des code points**. Aucun des deux ne réécrit la mécanique.
>
> **Méthode de balayage recommandée pour Gimli** : `grep`/`rg` du code point `U+2B1C` (et du glyphe
> ⬜) sur l'arbre `C:\work\iakaframe\` **et** sur `C:\Users\sjupi\.claude\` pour ne manquer aucune
> occurrence ; tout hit dans un badge/table/exemple est à convertir en 🟠.

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

### Position de pastille, chaîne de badges, anti-ventriloquie (décisions 3.4 / 3.5 / 3.6)
- [ ] **Décision 3.4** : aucune occurrence des mots « START »/« STOP » (ni variantes) dans un badge,
      une règle ou un message d'identité, dans tous les fichiers du §5. La convention « pastille avant
      = ouverture / après = clôture » est énoncée dans `methode-de-travail.md` § Identité.
- [ ] **Décision 3.4** : la logique de `identity-guard.ps1` (l.61-68) est inchangée (diff de logique
      vide) ; seuls commentaires et messages sont reformulés.
- [ ] **Décision 3.5** : `methode-de-travail.md` § Identité, `agents/odin.md`, `agents/aragorn.md`,
      `skills/iakaframe-aragorn`, `skills/iakaframe-odin`, `CLAUDE.md` global énoncent la séquence
      A→B et l'interdit d'interjection de l'orchestrateur entre ouverture et clôture de B.
- [ ] **Décision 3.6** : ces mêmes 6 emplacements imposent la citation verbatim de l'émetteur et
      l'interdiction de ventriloquie.
- [ ] **Portée respectée** : les 6 contrats non-orchestrateurs (`gandalf, gimli, legolas, helm, loki,
      nathalie`) et `_TEMPLATE.md` ne reçoivent que 3.4 (ni 3.5 ni 3.6).
- [ ] **Format/pastilles/table des phases inchangés** (grep des pastilles = même mapping qu'avant).

### Pastille transverse / par défaut ⬜ → 🟠 (décision 3.7)
- [ ] **Décision 3.7** : aucune occurrence de ⬜ (U+2B1C) dans un badge, une table ou un exemple des
      fichiers du §5 (cf. §5 bis) ; 🟠 (U+1F7E0) la remplace pour les rôles transverses (Aragorn, Loki,
      Nathalie, « par défaut » de `_TEMPLATE.md`).
- [ ] **Décision 3.7** : `identity-guard.ps1` liste `0x1F7E0` et **plus** `0x2B1C` dans `$pastilles` ;
      la mécanique de détection (`Test-BadgeOpen` / `Test-BadgeClose`, regex `$pastAlt`) reste
      **inchangée** ; le garde **accepte** un badge 🟠 et **refuse** un badge ⬜.
- [ ] **Décision 3.7** : le **mapping des autres pastilles est inchangé** (🔵 cadrage · 🔴 dev ·
      🟢 staging · 🟣 prod · 🟡 portefeuille) — seul le transverse change.

### Propagation aux kits Codex & Ollama (décision 3.8)
- [ ] `kit-codex/AGENTS.md` § Identité et `kit-ollama/AGENTS.md` § Identité portent la convention
      **3.4** (pastille avant = ouverture / après = clôture) et **aucune** occurrence des mots
      « START »/« STOP » (ni variantes) n'y figure.
- [ ] Ces deux § Identité portent **3.5** (chaîne A→B sans interjection de l'orchestrateur) et
      **3.6** (citation verbatim + anti-ventriloquie), **avec la portée orchestrateurs explicitée**.
- [ ] Le **mapping de pastilles** des deux kits reste à jour et **inchangé** (🔵🔴🟢🟣🟡 + 🟠
      transverse) ; aucune autre section des `AGENTS.md` n'a été modifiée.
- [ ] **Ton portable respecté** : aucun renvoi à `methode-de-travail.md`, ni mention d'un hook garde
      / d'`identity-guard.ps1` / `identity-remind.ps1` (inexistants dans ces kits).

### Kit Claude versionné `kit-claude/` + sources globales (décision 3.9)
- [ ] Le dossier `C:\work\iakaframe\kit\` **n'existe plus** ; `C:\work\iakaframe\kit-claude\` existe
      (renommage via `git mv`, historique préservé).
- [ ] `rg "kit/"` sur `C:\work\iakaframe\` ne renvoie **plus aucune** référence au dossier `kit/`
      (hors `kit-codex/` et `kit-ollama/`) ; `README.md`, `iakaframe-multiplateforme-cli.md`,
      `methode-de-travail.md` et le `CLAUDE.md` global pointent vers `kit-claude/`.
- [ ] Le `CLAUDE.md` **template par projet** à la racine de `kit-claude/` est **intact** (non écrasé
      par le versement du `CLAUDE.md` global).
- [ ] Les 3 fichiers globaux existent dans `kit-claude/global/` : `global/CLAUDE.md`,
      `global/hooks/identity-guard.ps1`, `global/hooks/identity-remind.ps1`, et sont **identiques**
      (diff vide) à leurs versions runtime dans `C:\Users\sjupi\.claude\`.
- [ ] `kit-claude/global/README.md` existe et explique que ce sont les **artefacts niveau-utilisateur**
      à copier dans `~/.claude/`, **distincts** du `kit-claude/CLAUDE.md` (template par projet).
- [ ] La note « exceptions sans source-image » du §5 est **corrigée** : elle acte que les 3 fichiers
      ont désormais une source dans `kit-claude/global/` et le sens `kit-claude/global/` → `~/.claude/`.

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
