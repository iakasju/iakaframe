# Audit COMPLET du frame (méthode + `library/` + assemblages + StefFrame2)

> Audit portefeuille conduit par **Gandalf** (P1), **lecture réelle** des fichiers (pas de mémoire).
> Note d'audit (constats + recommandations priorisées) — pas une instruction fermée. Chaque reco :
> **impact / effort / priorité** (P0 quick-win → P2 structurel).
> Base lue : `library/{personas,roles,principles,rituals,guardrails,scaffolds,workflows,skills}`,
> `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md`, `methode-de-travail.md`,
> `cli/src/commands/`, `frames/releases/StefFrame2/`, + cœur GUI `packages/core/*` pour la réconciliation.
> Cadre : **A1-A9** (par type d'élément) · **B1-B8** (transverses).

---

# Partie A — par type d'élément

## A1 — Personas (pouvoirs, frontières, ce qu'ils ne font pas)

**A1.1 — Odin dans un casting d'équipe contredit sa définition.** `odin.md:51` : « Odin est
**transverse** (le seul)… **jamais scopé à un projet** » ; or `teams/iakaframe-8.md:4` le **liste
dans le casting**. Incohérence portefeuille↔équipe. → **Reco** : sortir `odin` du casting et le
modéliser au niveau portefeuille (cf. A7 + super-étage `Portfolio`). Impact **élevé** / effort **XS** / **P1**.

**A1.2 — Gimli : deux chapeaux (P2 dev + P3 devops/staging) sous une persona sans skill.**
`gimli.md:18-20` cumule code (P2) et déploiement staging (P3, `rc`) ; `skills: []` (`gimli.md:7`).
Le P2 est porté par le `CLAUDE.md` projet ; le **P3 devops n'a ni cadre explicite ni outil**. →
**Reco** : séparer visiblement les 2 chapeaux dans `gimli.md` (gates distincts) + outiller le P3
(cf. A3/A5). Impact **moyen** / effort **M** / **P2**.

**A1.3 — Odin : double posture bootstrap (`iakastart`) vs portefeuille (`iakaframe-odin`) non
explicitée dans la persona.** Le `CLAUDE.md` global relie les deux par alias, mais `odin.md`
n'indique pas que `iakastart` est un **rituel qu'il invoque** (transverse, sans spawn), distinct de
sa **posture portefeuille**. → **Reco** : une phrase de désambiguïsation dans `odin.md`. Impact
**faible** / effort **S** / **P2**.

**A1.4 — Aragorn : périmètre exposé au « fourre-tout ».** `aragorn.md` coordonne/dispatche ; rien
n'interdit qu'un **rôle non casté** (ex. `deploiement`, cf. A2) **retombe sur lui**. → **Reco** :
ajouter à « Ne fait pas » → « exécuter un rôle non casté » (il **escalade** la lacune au décideur
via Odin). Impact **moyen** / effort **S** / **P1**.

## A2 — Roles & casting (câblage role↔persona↔skill)

**A2.1 — INCOHÉRENCE DE CASTING MAJEURE : `iakaframe-8` liste 7 personas, Helm absent.**
`teams/iakaframe-8.md:4` = `[odin, aragorn, gandalf, gimli, legolas, loki, nathalie]` (**7**, sans
`helm`). Or : `library/personas/helm.md` existe (roleKey `deploiement`), `library/roles/deploiement.md`
existe, le **binding inclut helm** (8 assignations), et le `CLAUDE.md` global annonce **8 agents dont
helm**. Le roleKey `deploiement` de la méthode (`methods/iakaframe.md`) est donc **non couvert par le
casting** → « 7/8 rôles » d'`assemble`. Preuve croisée : `roster.ts` (GUI) ne liste que **7 rôles**
sans `deploiement`. → **Reco (arbitrage décideur)** : **A)** ajouter `helm` (team = 8, aligne
binding/CLAUDE.md) **ou B)** acter Helm = **squad prod séparé** hors chaîne → renommer la team
(`iakaframe-7`/« compagnie de dev ») + documenter le déploiement hors-casting. Impact **élevé** /
effort **XS** (mais arbitrage) / **P0-P1**.

**A2.2 — Rôles = coquilles minces (une ligne de corps).** `roles/*.md` sont des stubs (label +
roleIndex + 1 phrase). Le câblage role→persona se fait par `persona.roleKey` ; role→skill n'existe
pas comme donnée (les skills sont sur la persona). Cohérent au MVP mais **peu porteur**. → **Reco** :
laisser tel quel (les personas portent la substance) ; documenter que `roles/` = référentiel
d'ancrage, pas de contenu. Impact **faible** / effort **XS** / **P2**.

## A3 — Skills (créer / améliorer)

**Créer :**
- **A3.1 — `iakaframe-frame` (cycle de vie d'un frame : open/verify/release).** Geste **le plus
  récurrent et non outillé** de la session (fait ~4× à la main : comptages + grep-gates + intégrité +
  scrub + zip). Impact **élevé** / effort **M** / **P1**.
- **A3.2 — `iakaframe-dev` MINCE (chapeau P3 devops/staging de Gimli).** Le README écarte à raison
  une skill dev pour le **P2** (portée par CLAUDE.md), mais le **P3** (build image, stage `rc`,
  worktree) n'est ni cadré ni outillé. Impact **moyen** / effort **M** / **P2**.
- **A3.3 — (option) `iakaframe-recette-visuelle`** (revue d'un livrable design vs charte).
  Impact **faible-moyen** / effort **M** / **P2**.

**Améliorer :**
- **A3.4 — `iakaframe-learning` cumule DEUX préoccupations.** Sa `description` couvre revue du
  réservoir (`review`) **et** retrait symétrique (`attach/detach/remove/memory remove`) — double
  casquette. → **Reco** : scinder en `iakaframe-learning` (revue) + `iakaframe-retrait` (+/−), ou au
  moins clarifier. Impact **moyen** / effort **S-M** / **P1**.
- **A3.5 — Les 4 skills « infra déparamétrées » restent couplées à un service externe.** `git`,
  `humandoc`, `design`, `log-conversation` sont portables via placeholders mais **inutilisables clé
  en main** sans infra. → **Reco** : marquer « avancé / nécessite un service externe » + chemin
  dégradé (ex. `humandoc` → export Markdown local). Impact **moyen** / effort **S** / **P2**.
- **A3.6 — Résidu `grue` dans `iakaframe-design`.** `<charte-defaut>-grue*.svg` (héritage naonedge)
  survit dans **les 3 exemplaires** de StefFrame2 (flat + `library/` + kit). → **Reco** :
  `→ <charte-defaut>-logo*.svg`. Impact **moyen** (grep-clean) / effort **XS** / **P0**.

## A4 — Principles (14)

**A4.1 — Le principe `qualite` est PLUS ÉTROIT que le gate réel de la méthode.** `principles/qualite.md`
= « **version mineure** ⇒ rapport qualité » (trigger `bump SemVer x.Y.z`). Mais le vrai invariant de
la méthode est le **gate Legolas indépendant après CHAQUE livraison Gimli** (personas + workflow) —
bien plus fréquent. Le principe **ne nomme pas** ce gate par-livraison. → **Reco** : ajouter un
principe **`gate-independant`** (auto-validation interdite, verdict PASS par contexte séparé) ou
élargir `qualite`. Impact **moyen** / effort **S** / **P1**.
**A4.2 — Pas de contradiction interne détectée** ; les 14 sont cohérents (extraits des conventions
CLAUDE.md). Redondance mineure : `cadrage-avant-code` recoupe le gate P1 du workflow (complémentaire,
pas conflictuel). **Manque** candidat : un principe **« vérification des faits / non-fabrication »**
(cf. A6.2). → **Reco** : ajouter `verification-faits`. Impact **moyen** / effort **S** / **P1**.

## A5 — Rituals (5 : iakastart / init / log-conversation / snapshot / update)

**A5.1 — Gestes récurrents NON ritualisés.** Manquent : **`frame verify`**, **`frame release`/merge**,
**`open frame`**, **recette visuelle**, **boucle d'audit/review** comme rituel. Le cycle de vie du
**frame** (produire/vérifier/livrer) n'a aucun rituel, alors que c'est l'activité portefeuille du
moment. → **Reco** : ritualiser `frame` (adossé A3.1) et `review-loop` (adossé B4). Impact **élevé** /
effort **M** / **P1**.
**A5.2 — `log-conversation` est un rituel couplé infra** (broker/base de documents). Correct comme
rituel, mais **non universel** (comme A3.5). → **Reco** : le marquer optionnel. Impact **faible** / effort **XS** / **P2**.

## A6 — Guardrails (3 : delegation / identity / perimeter)

**A6.1 — Bonne couverture des canaux, MAIS pas de garde d'ACTES DESTRUCTIFS.** Les 3 gardes sont
**hook-enforced** (identity=Stop/SubagentStop/UserPromptSubmit ; perimeter=PreToolUse Edit|Write|Bash ;
delegation=PreToolUse/PostToolUse Task). Le principe `confirmation-actes-destructifs` existe **mais
n'a AUCUN garde-fou hook** : rien n'intercepte `git reset --hard`, `push --force`, `rm -rf` **dans le
périmètre** (le perimeter-guard ne bloque que **hors** périmètre). La méthode **interdit** ces gestes
(`gimli.md:38`, CLAUDE.md) sans les **faire respecter mécaniquement**. → **Reco** : garde
**`destructive`** (PreToolUse Bash, matcher `reset --hard|push --force|rm -rf|drop`), confirmation
requise. Impact **élevé** / effort **M** / **P1**.
**A6.2 — Pas de garde anti-fabrication** (faits inventés). Difficile à enforcer mécaniquement ; mieux
traité en **principe** (A4.2) + revue. → **Reco** : principe plutôt que hook. Impact **moyen** / effort **S** / **P2**.
**A6.3 — Anti-ventriloquie** : bien couverte, intégrée au garde `delegation`. **OK.**

## A7 — Scaffolds (2) + le super-étage portefeuille

**A7.1 — Le scaffold `portefeuille` porte encore du SPÉCIFIQUE.** `scaffolds/portefeuille.md:9-10` :
`.env` (« token Forgejo ») et `naonedge-dashboard/` — **perso** dans la source. Le frame déparamètre,
mais la source reste couplée. → **Reco** : généraliser les entrées (`<dashboard>/`, `.env` générique).
Impact **faible-moyen** / effort **S** / **P2**.
**A7.2 — Le super-étage portefeuille est SOUS-MODÉLISÉ dans le frame lui-même** (comme il l'était
côté GUI). Odin a un **foyer fragmenté** : un scaffold `level:portfolio`, un rôle `portefeuille`, une
persona `odin` — **mais aucune entité assemblée « Portefeuille »** qui les réunit et représente le
niveau au-dessus des équipes. C'est le pendant côté frame du **G6** de `open-frame-gui-stefframe2.md`.
→ **Reco** : modéliser un assemblage **portefeuille** (rattache scaffold portfolio + odin + backlog
transverse + liste de teams/projets). Impact **élevé** / effort **M-L** / **P1**.

## A8 — Workflows (1 : iakaframe-3phases)

**A8.1 — Un seul workflow, dev-centré.** `iakaframe-3phases` couvre P1/P2/P3 + étape prod (squad).
**Non couverts** par un workflow : le **niveau portefeuille** (switch/start/create d'Odin), la
**boucle d'apprentissage/audit** (review→consolidate), le **cycle de frame** (build/verify/release).
Le modèle Method supporte une **collection** de workflows (cf. GUI `workflows/`). → **Reco** : ajouter
`iakaframe-portfolio` et `iakaframe-learning-loop` comme workflows de 1re classe. Impact **moyen** /
effort **M** / **P2**.

## A9 — Assemblage (methods / teams / bindings)

**A9.1 — DIVERGENCE DE MODÈLE `binding` frame ↔ cœur GUI (à réconcilier).** `bindings/iakaframe-claude-default.md`
(frontmatter) utilise **`assignments: [{personaId, runner, model}]`** + **`methodId`** + `teamId` +
`node`. Le cœur `packages/core/src/binding.ts` attend **`bindings: PersonaBinding[]`** (champ
**différent**), **sans `methodId`** (la méthode est séparée), en **`binding.json`** (JSON, pas
frontmatter), id = `${teamId}@${node}`. → `parseBinding` du cœur lirait le binding du frame avec
**`bindings: []`** (champ `assignments` ignoré) → binding **vide**. C'est un **écart réel** qui
casserait le chargement du binding dans la GUI (recoupe É3 d'`open-frame-gui-stefframe2.md`). →
**Reco** : réconcilier le contrat (aligner le nom de champ `bindings` **ou** ajouter un adaptateur
`assignments→bindings` + décider où vit `methodId`). Impact **élevé** / effort **M** / **P1**.
**A9.2 — `methods`/`teams` cohérents** (methods référence des ids existants ; team casting = le seul
point cassé, cf. A2.1). **OK** hors A2.1.

---

# Partie B — transverses

## B1 — Intégrité référentielle

**B1.1 — Dans StefFrame2, les personas→skills sont SAINES** (renommées avec les skills :
`loki→iakaframe-design`, `nathalie→[…, iakaframe-humandoc]` — vérifié). **Mais** : le **mapping de
renommage** source↔frame (naonedge→design, forgejo→git, appflowy-doc→humandoc) **n'est documenté
nulle part** ; la source `library/personas/loki.md:7` pointe encore `iakaframe-naonedge` et
`roster.ts` (GUI) aussi. → **Risque** : une régénération future ré-introduit les anciens ids ou crée
un **dangling ref**. → **Reco** : documenter/outiller le mapping (table de scrub) + `frame verify`
qui teste « chaque `skills:[]` de persona existe dans `skills/` ». Impact **moyen** / effort **S** / **P1**.
**B1.2 — Aucune vérif d'intégrité automatisée sur le frame source** (`checkRefs` vit côté GUI/CLI,
pas comme gate de build de frame). → **Reco** : cf. A3.1/`frame verify`. Impact **élevé** / effort **M** / **P1**.

## B2 — Performance / efficacité

**B2.1 — Triple duplication des atomes dans StefFrame2** (flat + `library/` + `kit/.claude/skills`)
→ chaque correctif ×3 (preuve : `grue` dans les 3, A3.6). **B2.2 — Aucun invariant testé « flat ==
library/ »** (~110 fichiers, dérive libre). **B2.3 — Outillage CLI de frame absent** (verify/release).
**B2.4 — Chaîne de badges** = fluidité coûteuse (le hook `delegation-guard` trace déjà, l'humain
refait à la main). → **Recos** : R1.1 dédup+miroir généré (**P1/M**), R1.2 `frame verify` (**P1/M**),
R1.3 `frame release` (**P2/M**), R1.4 relais léger interne (**P2/S**). Impact **élevé** global.

## B3 — Identité / badges

**B3.1 — Discipline UTILE et BIEN gardée** (hooks identity, exit 2). **B3.2 — Poids : le boilerplate
badge (~15 lignes) est DUPLIQUÉ verbatim dans les 8 personas + le guardrail + le CLAUDE.md** (viol
DRY). → **Reco** : factoriser la règle dans le guardrail `identity` et **référencer** depuis les
personas (corps court). Réduit la maintenance sans affaiblir l'enforcement. Impact **moyen** / effort
**S-M** / **P2**.

## B4 — Boucle d'apprentissage (méta)

**B4.1 — La boucle EXISTE (bon point)** : `review`/`close`/`consolidate`/`memory` → réservoir de
propositions → `apply` matérialise **skill** (`library/skills/<id>/SKILL.md`) ou **mémoire**, sous
garde de consentement (structurel = toujours humain). **B4.2 — Limite : la boucle n'améliore que
skills+mémoire**, pas les **personas/roles/principes/guardrails** ; et les **frames sont des
snapshots statiques** → une amélioration de `library/` ne se propage pas aux frames livrés sans
rebuild (lié B2.1). → **Reco** : étendre les types matérialisables (persona/principe en file
humaine) + rituel de **re-génération de frame** post-apprentissage. Impact **moyen** / effort **M** / **P2**.

## B5 — Portabilité multi-runner

**B5.1 — Fidélité DÉGRADÉE hors Claude.** Les 5 kits existent, mais toute la **machinerie
d'enforcement** (hooks identity/perimeter/delegation, format SKILL.md, `.claude/`) est **Claude-Code-
only**. Les kits codex/ollama/openwebui/anythingllm portent les personas comme **prompts/modèles**
mais **sans les gardes** → la méthode y est **déclarative, pas enforced**. → **Reco** : soit assumer/
documenter « Claude = runner de référence, autres = best-effort déclaratif », soit porter un sous-
ensemble de gardes (au moins identité) par runner. Impact **moyen** / effort **L** / **P2**.

## B6 — Doc & onboarding (le fils)

**B6.1 — Auto-doc partielle.** `methode-de-travail.md` (canon) + README de skills + GUIDE-INSTALLATION
(StefFrame2) existent, mais **pas de « carte » unique** des 11 types pour un nouveau venu (où commencer,
quoi lit quoi). → **Reco** : un `INDEX.md`/`README` de frame qui présente la ventilation + un
« start here » (adossé au README déjà prévu pour StefFrame1/2). Impact **moyen** / effort **S** / **P1**.

## B7 — Sécurité / déparamétrage

**B7.1 — Scrub grep-based PROUVÉ LEAKY** (`grue` a survécu, A3.6). Robustesse insuffisante sans gate
automatisé. **B7.2 — Secrets** : `.env`/`SECRETS.env` bien exclus, `.env` scaffold `createIfAbsent:false`
+ jamais commité — **OK**. **B7.3 — Actes destructifs** : principe présent, **enforcement hook absent**
(A6.1). → **Recos** : `frame verify` avec grep-gate durci (B7.1) + garde `destructive` (A6.1). Impact
**élevé** / effort **M** / **P1**.

## B8 — Versionnement & décomposabilité (+/−)

**B8.1 — SOLIDE.** État des lieux (`snapshot`), jalons (`jalon`), symétrie +/− (`attach/detach/remove`
+ corbeille `.trash-<ts>` restaurable), recomposition (`assemble`/`switch`). Le frame est
**recomposable**. **B8.2 — Manque** : pas de `frame verify` pour **prouver** la recomposition intègre
après un +/−. → **Reco** : cf. A3.1. Impact **moyen** / effort **M** / **P1** (mutualisé).

---

# Synthèse

## TOP chantiers prioritaires (plus fort levier)

1. **Trancher le casting `deploiement`/Helm** (A2.1) + **remonter Odin au portefeuille** (A1.1) —
   aligne team ↔ binding ↔ CLAUDE.md ↔ GUI. *(fort levier, effort faible, mais arbitrage requis.)*
2. **`iakaframe frame verify` + dédup source-unique/miroir-généré** (A3.1, B1.2, B2.1-2, B7.1) —
   supprime la triple maintenance, l'audit manuel et le scrub leaky ; un seul geste garde le frame sain.
3. **Réconcilier le modèle `binding`** frame ↔ cœur (`assignments`+`methodId` vs `bindings`) (A9.1) —
   sinon le binding ne charge pas dans la GUI (recoupe open-frame É3).
4. **Modéliser le super-étage portefeuille** dans le frame (A7.2) — foyer clair d'Odin ; pendant du G6 GUI.
5. **Garde d'actes destructifs** (A6.1/B7.3) — rendre exécutable l'interdiction déjà écrite
   (`reset --hard`/`push --force`/`rm -rf`).
6. **Scinder `iakaframe-learning`** en learning + retrait (A3.4) + **skill `iakaframe-frame`** (A3.1).
7. **Aragorn n'absorbe pas un rôle non casté** (A1.4) + **nommer le gate indépendant** en principe (A4.1).

## Quick wins (P0, effort XS-S)

- **QW1** — Corriger le résidu **`grue`** → `<charte-defaut>-logo*.svg` (A3.6) dans les 3 exemplaires.
- **QW2** — **Trancher + éditer le casting** `iakaframe-8` (ajouter Helm **ou** renommer + sortir Odin) (A2.1/A1.1).
- **QW3** — **Désambiguïser `odin.md`** (rituel iakastart vs posture portefeuille) (A1.3) et ajouter la
  frontière « rôle non casté » à `aragorn.md` (A1.4).

## Points à arbitrer par le décideur
1. **A2.1** — Helm **dans** la team (option A) ou **squad séparé + renommage** (option B) ?
2. **A9.1** — Réconciliation binding : aligner le champ (`bindings`) **ou** adaptateur `assignments→bindings` ; où vit `methodId` ?
3. **A3.4** — Scinder `learning`/`retrait` ou clarifier sans scinder ?
4. **B5.1** — Multi-runner : assumer « Claude de référence, autres best-effort » ou porter les gardes ?

> Statut : **AUDIT COMPLET RENDU** (A1-A9 · B1-B8). Recommandations prêtes à devenir des instructions
> fermées (une par chantier retenu) sur décision du portefeuille.
