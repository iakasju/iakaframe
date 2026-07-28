# Purge des scories Slack orphelines (slack = dead)

## Problème
Slack est **mort** dans la méthode iakaframe : le canal de communication des agents est
désormais **iakaHub ↔ Discord** (avec repli terminal gracieux), migration déjà faite dans les
personas et la doc source. Il reste des **scories Slack orphelines** dispersées dans le canon
vendoré, la doc de référence, le kit Ollama, les vitrines HTML et une zone générée figée. Le
décideur veut les **purger toutes**, proprement et de façon vérifiable, sans casser la parité
cross-repo (vendor-check) ni les tests.

## Décision retenue
**Purger toutes les occurrences « slack » (insensible casse) du dépôt**, en **reformulant** vers
le canal vivant (**Discord / iakaHub**) partout où « Slack » servait de nom de canal, et en
**alignant** les copies figées sur le canon actuel. Aucune zone n'est gelée : la zone générée
orpheline est purgée en **édition directe** (band-aid assumé) faute de générateur, la dette
« régénérateur de vitrine » restant au backlog. Séquence **canon → miroir** pour le seul artefact
vendoré touché, avec `vendor-check --strict` à **drift 0**.

**Arbitrage demandé au décideur (Zone 3 — kit Ollama)** : « canal Slack » y sert de **critère de
choix d'outil/harnais** (capacités de canal d'un outil tiers : OpenClaw, n8n). Deux options —
- **(a) Reformuler vers Discord** (recommandé) : on **ré-ancre** le critère sur le canal vivant de
  la méthode (« l'outil couvre-t-il nativement le canal Discord d'Aragorn ? »). Reste un critère
  utile, débarrassé de Slack.
- **(b) Neutraliser** : retirer toute mention de canal. On perd le critère.
**Reco : (a)**. Le reste de l'instruction suppose (a) ; si le décideur tranche (b), seuls les
traitements de la Zone 3 changent (suppression au lieu de substitution).

## Périmètre
- **Inclus** : purge de **toutes** les occurrences « slack » listées ci-dessous (canon vendoré,
  specs, kit Ollama, vitrines HTML, zone générée figée) ; re-vendorisation de la fixture GUI
  concernée ; redéploiement des skills vers `~/.claude/skills/` ; vérif `grep = 0`,
  `vendor-check --strict` drift 0, tests CLI verts.
- **Exclu** :
  - Écriture ou réécriture d'un **générateur de vitrine `.md → .html`** (backlog séparé) — la zone
    générée figée de `methode-de-travail.html` est purgée **en édition directe**, pas régénérée.
  - Toute retouche de **fond** des fichiers au-delà du remplacement « Slack → Discord » (pas de
    « tant qu'on y est » sur des formulations voisines).
  - Les mentions **Mattermost** (canal self-hosted alternatif légitime, hors sujet « slack »).

## Occurrences mesurées (recompte sur pièces) + traitement

> Recompte effectué en lecture directe (ripgrep absent de l'environnement de cadrage). Les comptes
> ci-dessous sont **confirmés fichier par fichier**, sauf la zone générée figée (~16, **à confirmer
> par `grep` à l'exécution** — voir Zone 5). Le vrai filet reste le critère `grep -ri slack = 0`.

### Zone 1 — Canon vendoré (⚠️ CROSS-REPO)
- `library/skills/iakaframe-odin/SKILL.md` — **2 occ** (L55 « voix / Slack / texte », L64 « même
  canal : voix / Slack »). **Traitement : reformuler** → « voix / Discord / texte » et « même
  canal : voix / Discord » (cohérent avec la persona `library/personas/odin.md`, déjà migrée :
  « `#odin` iakaHub→Discord … ou terminal »).
  - **Cross-repo** : ce fichier est **vendoré byte-à-byte** dans iakaFrameGUI
    (`packages/core/__tests__/fixtures/skills/iakaframe-odin/SKILL.md`, cf. `cli/src/lib/vendor.js`
    `SKILL_IDS`). Après édition du canon, **re-synchroniser la fixture** (copie conforme) →
    `vendor-check --strict` drift 0.

> **Vérification faite au cadrage** : les autres fixtures vendorées susceptibles de porter « slack »
> ont été inspectées et sont **propres** — personas `odin.md` et `aragorn.md`, skill
> `iakaframe-aragorn/SKILL.md`, rôles `coordination.md` / `portefeuille.md` : toutes en iakaHub ↔
> Discord, zéro « slack ». **`iakaframe-odin/SKILL.md` est le seul artefact vendoré à purger.** La
> golden d'agent `cli/test/fixtures/agents-golden/odin.md` est générée depuis la persona (déjà
> propre) + le binding, pas depuis le corps du SKILL : elle n'est **pas** impactée. L'exécutant
> **doit** confirmer par `grep -ri slack` sur `library/` et `cli/test/fixtures/`.

### Zone 2 — Specs / doc de référence
- `specs/equipe-agents.md` — **3 occ** (L52 « joignable par voix / Slack », L72 « terminal / Slack
  / HTML », L81 « joignable par **voix / Slack** »). **Traitement : reformuler** → « voix /
  Discord » (L52, L81) et « terminal / Discord / HTML » (L72). Non vendoré (pas de cross-repo).

### Zone 3 — Kit Ollama (reformulation — cf. arbitrage, option (a) supposée)
- `kits/iakaframe-ollama/AGENTS.md` — **1 occ** (L15, capacités OpenClaw « … + canal Slack + skills »).
  **Traitement** → « … + canal Discord + skills ».
- `kits/iakaframe-ollama/MODELES.md` — **3 occ** :
  - L32 (n8n « Triggers, dispatch entre rôles, canal Slack, … ») → « canal Discord ».
  - L44 (OpenClaw « multi-chat **Slack/Telegram/Discord/Signal…** ») → « multi-chat
    **Discord/Telegram/Signal…** » (Discord en tête, Slack retiré).
  - L48 (« Le **canal Slack** d'Aragorn est nativement couvert ») → « Le **canal Discord**
    d'Aragorn est nativement couvert » — **impératif** : le canal d'Aragorn est Discord, plus Slack.

### Zone 4 — Vitrines HTML (édition directe)
- `iakaframe-chapeau.html` — **2 occ** : L294 (table « Interchangeable » : « Le canal (terminal,
  Slack, Mattermost) ») → « Le canal (terminal, Discord, Mattermost) » ; L478 (« skill coordination
  (canal Slack / Mattermost) ») → « (canal Discord / Mattermost) ».
- `iakaframe-methode.html` — **1 occ** : L438 (titre de carte « Aragorn ↔ toi sur Slack ») →
  « Aragorn ↔ toi sur Discord ».
- `doc/index.html` — **1 occ** (contenu rendu, puce Aragorn « … canal **Slack** (via n8n) ») →
  « canal **Discord** (via n8n) ». **⚠️ Nuance** : cette page est **générée** par
  `.portefeuille/docgen.mjs` (footer daté, générateur vivant). L'édition directe est un **band-aid**
  susceptible d'être écrasé au prochain rendu. **À faire** : localiser la **source markdown** que
  docgen rend (README rendu, contenu « Cowork / Claude Code / .ps1 » — visiblement daté) et y purger
  la même mention si présente ; si la source n'est pas localisable rapidement, éditer le HTML en
  band-aid et **noter la dette** (page générée obsolète).

### Zone 5 — Zone générée orpheline (band-aid + dette signalée)
- `methode-de-travail.html` — **~16 occ** dans la zone `<!--CODE_BLOCKS_START-->` … 
  `<!--CODE_BLOCKS_END-->` (à partir de L825). Ce sont des **copies figées** d'anciennes versions
  d'agents/skills (ex. L869 : `aragorn.md` description « … via **Slack** (bidirectionnel, par
  n8n) »). Le **générateur `.md → .html` n'existe plus** (backlog séparé). La partie **vivante** du
  fichier (roster L755) est déjà en iakaHub ↔ Discord : **seule la zone gelée** porte « slack ».
  **Traitement : édition directe** de la zone — remplacer chaque « Slack » par la formulation canon
  actuelle (**iakaHub ↔ Discord**, alignée sur les personas/skills à jour) — **+ noter la dette
  « régénérateur de vitrine »** au backlog (« slack = dead » ne doit pas attendre un générateur).
  Le **compte exact (~16) est à confirmer par `grep`** au début de l'exécution.

## Étapes d'implémentation
1. **Mesurer** d'abord : `grep -rni slack .` (racine dépôt) — figer la liste réelle et confirmer les
   comptes ci-dessus (notamment la zone générée de `methode-de-travail.html`).
2. **Zone 1 (canon)** : éditer `library/skills/iakaframe-odin/SKILL.md` (2 occ → Discord).
3. **Cross-repo** : re-synchroniser la fixture GUI
   `packages/core/__tests__/fixtures/skills/iakaframe-odin/SKILL.md` (copie **byte-à-byte** du canon
   fraîchement édité), dans le dépôt frère iakaFrameGUI.
4. **Zone 2** : éditer `specs/equipe-agents.md` (3 occ → Discord).
5. **Zone 3** : éditer `kits/iakaframe-ollama/AGENTS.md` (1) + `MODELES.md` (3) selon l'arbitrage
   retenu (défaut : reformulation Discord).
6. **Zone 4** : éditer `iakaframe-chapeau.html` (2), `iakaframe-methode.html` (1), `doc/index.html`
   (1) ; pour `doc/index.html`, traiter la source docgen si localisable (sinon band-aid + dette).
7. **Zone 5** : purger la zone `CODE_BLOCKS` de `methode-de-travail.html` (~16, édition directe) +
   ajouter la dette « régénérateur vitrine » au `BACKLOG.md`.
8. **Redéployer les skills** vers `~/.claude/skills/` (purge du canon Odin déployé) pour satisfaire
   B17 — via le geste de déploiement des skills de la méthode (`iakaframe agents … generate/affect`
   ou l'équivalent skills-deploy en place).
9. **Vérifier** (critères ci-dessous) : `grep = 0`, `vendor-check --strict` drift 0, tests CLI verts.
10. **Committer** en commits atomiques (`chore(slack): …` par zone) ; après merge → `update iakaframe`
    (état des lieux + versionnement) conformément à la règle merge ⇒ versionnement.

## Fichiers concernés
- `library/skills/iakaframe-odin/SKILL.md` — 2 occ → Discord (**canon vendoré**).
- `packages/core/__tests__/fixtures/skills/iakaframe-odin/SKILL.md` (dépôt **iakaFrameGUI**) —
  re-vendorisation byte-à-byte (**cross-repo**).
- `specs/equipe-agents.md` — 3 occ → Discord.
- `kits/iakaframe-ollama/AGENTS.md` — 1 occ → Discord.
- `kits/iakaframe-ollama/MODELES.md` — 3 occ → Discord.
- `iakaframe-chapeau.html` — 2 occ → Discord.
- `iakaframe-methode.html` — 1 occ → Discord.
- `doc/index.html` — 1 occ → Discord (+ source docgen à traiter/noter).
- `methode-de-travail.html` — ~16 occ (zone `CODE_BLOCKS`, band-aid).
- `BACKLOG.md` — retirer l'item « 13 scories Slack orphelines » une fois clos ; y **noter la dette**
  « régénérateur vitrine `.md → .html` » (si pas déjà présent).
- `~/.claude/skills/iakaframe-odin/SKILL.md` — via **redéploiement** (pas d'édition manuelle de la
  copie déployée : on édite la source puis on redéploie).

## Risques
- **Cross-repo drift** : éditer le canon Odin **sans** re-synchroniser la fixture GUI fait passer
  `vendor-check --strict` en drift. Mitigation : séquence **canon → miroir** (étapes 2 puis 3), puis
  `vendor-check --strict` = drift 0 **avant** de clore.
- **Dépôt frère absent** : si iakaFrameGUI n'est pas cloné à côté, `vendor-check` **SKIP**
  (`ok:false`, exit 0) — il ne bloque pas mais **ne prouve rien**. Mitigation : effectuer la
  re-sync dans un environnement où le frère est présent, et exiger un `vendor-check` **non-skipped**
  à drift 0.
- **Éditions HTML à la main** (zones 4 et 5) : risque de **résidu** ou de remplacement partiel.
  Mitigation : re-`grep` après chaque zone ; ne clore que sur `grep = 0`.
- **`doc/index.html` régénéré** : band-aid potentiellement écrasé par `docgen.mjs`. Mitigation :
  purger la source si localisable, sinon acter la dette explicitement.
- **B17 non satisfait** si on oublie le **redéploiement** : `~/.claude/skills/` garde l'ancien canon
  Odin. Mitigation : étape 8 obligatoire, puis `grep -ri slack ~/.claude/skills/`.
- **Occurrence oubliée hors liste** : le cadrage n'a pu grep exhaustivement. Mitigation : le critère
  `grep -ri slack = 0` sur **tout le dépôt** est le filet final, prioritaire sur la liste.

## Critères d'acceptation
- [ ] `grep -rli slack .` (racine du dépôt, insensible casse) = **0** — **aucune** zone gelée
      conservée (la zone générée est purgée en band-aid).
- [ ] `grep -ri slack ~/.claude/skills/` = **0** (critère **B17**) après purge canon +
      redéploiement des skills.
- [ ] `vendor-check --strict` = **drift 0**, **non-skipped** (fixture GUI `iakaframe-odin/SKILL.md`
      re-synchronisée ; dépôt frère présent).
- [ ] Vitrines HTML (`iakaframe-chapeau.html`, `iakaframe-methode.html`, `doc/index.html`,
      `methode-de-travail.html`) : plus aucune occurrence « slack ».
- [ ] Kit Ollama reformulé (Discord) : `AGENTS.md` + `MODELES.md` sans « slack », critère de choix
      d'outil ré-ancré sur Discord (option (a)) ou neutralisé (option (b) selon arbitrage).
- [ ] Tests CLI verts (parité générateurs / vendor) — aucune régression.
- [ ] `BACKLOG.md` : item « 13 scories Slack » clos ; dette « régénérateur vitrine » notée.
