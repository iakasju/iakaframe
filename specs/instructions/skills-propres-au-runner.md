# Skills propres au runner — séparer le réservoir de ce que seul Claude Code apporte

> Cadrage : Gandalf, 27/09/2026. Décision de Stéphane du 27/09 : « go option 1 ».
> Statut : **à valider** (questions fermées Q1-Q6 en fin de document, avec recommandation).
> **VALIDÉE (Stéphane, 27/09/2026, question par question)** : Q1 = runnerSkills · Q2 = claude · Q3 = oui (outils Artifact et Claude Docs ajoutés au binding Claude) · Q4 = oui (côté iakaFrameGUI dans ce lot si son dépôt est propre) · **Q5 = avertissements, NON bloquants** (frame lint signale moteur inconnu, mauvais type, skill du réservoir mal rangée, sans échouer) · Q6 = oui (guillemets YAML acceptés).

## Problème

Les fiches de `library/personas/loki.md:9` et `library/personas/nathalie.md:9` citent, dans `skills:`,
**8 skills qui n'existent pas dans le réservoir** `library/skills/` : ce sont des skills fournies par
Claude Code lui-même ou par ses plugins (`anthropic-skills:docs`, `artifact-design`,
`artifact-diagramming`, `dataviz`, `design:accessibility-review`, `design:design-critique`,
`design:design-system`, `design:ux-copy`). Le résolveur exige que toute skill citée existe
(`cli/src/lib/resolve-skills.js:36`, « skill referencee introuvable ») : il lève une erreur, et tout
ce qui passe par lui tombe — les 3 générateurs (`gen-skills-golden.mjs`, `gen-agents-golden.mjs`,
`gen-methode-vitrine.mjs`), `frame lint`, `vendor-check` (niveau 2), le déploiement des skills et
environ 52 tests (53 après le lot « durée estimée », mesure de Legolas).

Il faut ranger ces 8 skills **à part** : elles restent sur les agents Claude Code générés (rien ne
doit changer pour l'utilisateur sous Claude Code), mais le cœur neutre de la méthode ne les voit plus.

## Décision retenue

**Option 1 (Stéphane, 27/09).** Une fiche de persona porte désormais deux listes :

- `skills:` — les skills **du réservoir**, obligatoires, présentes dans `library/skills/`. Seules
  celles-ci sont lues par le résolveur, déployées par `skills deploy`, vendorées vers la GUI.
- `runnerSkills:` — les skills **propres à un runner**, facultatives, rangées par runner. Le résolveur
  ne les lit pas. Seul le générateur du runner concerné (pour Claude Code :
  `cli/src/lib/generate-agents.js`, qui produit les `.claude/agents/<id>.md` du kit
  `kits/iakaframe-claude`) les ajoute au contrat qu'il écrit.

### Format exact (sous réserve de Q1, Q2)

Une ligne, placée **juste après** `skills:` dans le frontmatter :

```yaml
skills: [iakaframe-naonedge]
runnerSkills: { claude: [anthropic-skills:docs, design:design-critique, design:design-system, design:accessibility-review, design:ux-copy, artifact-design, artifact-diagramming, dataviz] }
```

- **Nom du champ** : `runnerSkills` (camelCase, comme `roleKey`, `subskills`, `methodId`, `personaId`).
- **Clé** : un runner **canonique** de `RUNNER_KINDS` (`cli/src/lib/vocab.js:22` : `claude`,
  `chatgpt`, `ollama-local`, `ollama-distant`, `litellm`). Pour Claude Code, c'est `claude`
  (`claude-code` en est l'ancien nom, simple alias, `vocab.js:41`).
- **Valeur** : une liste de noms de skills (chaînes non vides), dans l'ordre voulu.
- **Lecture** : le mini-parseur maison lit déjà cette forme (map sur une ligne contenant une liste,
  `cli/src/lib/frontmatter.js:74-80` et `:158-165`) ; les noms à deux-points (`design:ux-copy`) sont
  rendus comme chaînes. Aucun changement du parseur.
- **Validation** (sous réserve de Q5), dans `frame lint` :
  - clé qui n'est pas un runner canonique → **bloquant** (`runnerSkills`, `unknown-runner`) ;
  - valeur qui n'est pas une liste de chaînes non vides → **bloquant** (`bad-type`) ;
  - nom qui **existe** dans `library/skills/` → **bloquant** (`runnerSkills`, `belongs-to-skills`) :
    une skill du réservoir se déclare dans `skills:`, jamais ici. C'est la garde qui empêche les deux
    listes de se recouvrir.
- **Schéma** : `library/_schema/frontmatter.json`, type `personas`, ajouter
  `"runnerSkills": "map"` dans `optional`. Le type `map` est **nouveau** dans le vocabulaire
  (aujourd'hui `scalar | bool | list | map-list | enum`) : un objet simple, non tableau.

### Lecture par chaque consommateur

| Consommateur | Comportement |
|---|---|
| `resolve-skills.js` | **Ignore** `runnerSkills` (il ne lit que `persona.data.skills`, `:50`). Aucun changement de code : un commentaire d'en-tête qui le dit, et un test qui le verrouille. |
| `skills-deploy.js` (`skills deploy`) | Inchangé : l'union ne porte que les skills résolues. Les skills du runner ne sont **jamais** copiées (elles ne sont pas dans le réservoir ; c'est le runner qui les fournit). Commentaire à ajouter : l'invariant « contrat déployé ⇒ skills déployées » vaut pour les skills du réservoir ; celles du runner sont hors de son champ. |
| `generate-agents.js` (`generateAgent`) | **Seul point d'injection.** Liste écrite dans `skills:` du contrat = `resolveSkills(id)` **puis** `runnerSkills.claude` dans l'ordre déclaré, doublons retirés (1re occurrence). Injection **seulement si** le runner de l'assignment, normalisé par `RUNNER_ALIASES`, vaut `claude` — même règle d'abstention que pour `model` (`:155`). Runner autre ou absent → rien n'est ajouté. |
| `agents.js` (`affectPersona`), `switch.js` | Inchangés : ils passent par `generateAgent` pour le contrat (donc héritent de l'injection) et par `resolveSkills` pour la copie des skills (donc ne copient rien de plus). |
| `frame-lint.js` | `missing-ref` reste réservé à `skills:` (`:145`). Nouvelles règles ci-dessus pour `runnerSkills`. |
| `vendor.js` / `vendor-check` | Aucun changement de code. `SKILL_IDS` (`:60`) reste l'union des skills **du réservoir** ; les 8 skills du runner n'y entrent pas. Le niveau 2 (`:352-372`) redevient jouable. |
| Kits non Claude (Ollama, Open WebUI, AnythingLLM, Codex) | Inchangés. Ils ne lisent pas `runnerSkills`. |
| iakaFrameGUI | Voir Q4. La GUI conserve déjà à l'octet les champs qu'elle ne modélise pas (`packages/core/src/persona.ts:126-134`). Son test de parité des contrats (`packages/core/__tests__/parite-generateurs.test.ts:147-160`) doit ajouter `runnerSkills.claude` à la liste résolue, comme le CLI. |

### Faits vérifiés sur le web (Claude Code)

- Le champ `skills` d'un sous-agent Claude Code est une **liste YAML** ; le contenu complet de chaque
  skill est préchargé. Une skill **absente ou désactivée est sautée** avec un avertissement dans le
  journal de débogage, sans erreur — donc un poste qui n'a pas un plugin ne casse pas l'agent.
  Les skills des plugins restent aussi invocables via l'outil `Skill`. Source : documentation
  officielle des sous-agents.
- Des tickets signalent que ce préchargement ne marche pas toujours (ticket #67251, juin 2026, fermé
  « not planned » ; ticket #25834 pour les skills de plugins). Ce lot **ne corrige ni ne vérifie**
  ce comportement du runner : il garantit que le contrat **déclare** la même chose qu'aujourd'hui.

## Périmètre

- **Inclus**
  - Champ `runnerSkills` : schéma, type `map`, règles de `frame lint`, injection par `generateAgent`.
  - Migration des personas concernées. **Balayage fait sur les 34 fiches de `library/personas/`** :
    seules `loki` et `nathalie` citent des skills hors réservoir. Toutes les autres (iakaframe, scrum,
    kanban, gtd, lean startup, shape up, waterfall, design thinking) ne citent que des skills présentes.
  - Outils Claude Code de `loki` et `nathalie` dans le binding (Q3) : les contrats actuellement
    déployés portent `Artifact` et 7 outils `mcp__claude_ai_Claude_Docs__*` que le binding n'a pas.
  - Régénération des 3 dérivés (goldens des skills, goldens des contrats, vitrine), qui résorbe les
    écarts laissés par le lot « durée estimée » sur les `SKILL.md` d'Aragorn et d'Odin.
  - Mesure, classement et traitement des échecs de `npm test` (§ Plan pour les échecs).
  - Côté GUI : selon Q4.
- **Exclu**
  - Tout déploiement vers `~/.claude` (`agents generate --global`, `skills deploy --global`) :
    **à Stéphane**. Lecture seule de `~/.claude/agents/` autorisée pour comparaison, **aucune écriture**.
  - Montée de version, tag, push : **à Stéphane**.
  - `library/personas/_TEMPLATE.md` (des tests le copient tel quel ; on n'y touche pas).
  - Kits non Claude, `frames/releases/**`, `.claude/worktrees/**`.
  - Toute correction du préchargement des skills côté Claude Code (tickets ci-dessus).
  - Les échecs de `npm test` classés « autre sujet » : documentés et reportés, pas corrigés ici.
  - Afficher `runnerSkills` dans `agents list` / `show` (non demandé).

## Étapes d'implémentation

0. **Mesure de départ (avant toute modification).** Sur `main` propre :
   `cd cli && node --test 2>&1 | tee <scratchpad>/avant.tap`. Relever le nombre d'échecs et la liste
   des tests en échec (fichier + nom). Relancer **deux fois de plus** : un test qui n'échoue pas les
   trois fois est classé « instable ». Conserver les trois comptes.
1. **Schéma.** `library/_schema/frontmatter.json` : `personas.optional.runnerSkills = "map"`.
   `cli/src/lib/frontmatter-schema.js` : ajouter le cas `map` à `matchesType` (objet non nul, non
   tableau). `cli/test/frontmatter-schema-parity.test.js:20` : ajouter `map` à `VALID_TYPES`.
2. **Frame lint.** `cli/src/lib/frame-lint.js`, dans la boucle des personas (`:137-147`) : les trois
   règles `runnerSkills` du § Format. Importer `RUNNER_KINDS` depuis `vocab.js`.
3. **Générateur.** `cli/src/lib/generate-agents.js`, `generateAgent` : calculer une seule fois la
   liste `skills` = résolues + `runnerSkills.claude` (si runner normalisé = `claude`), dédoublonnée,
   puis la passer à `renderAgentContract` (inchangé). Mettre à jour le commentaire d'en-tête
   (`:111-113`) : la liste n'est plus seulement « résolue ».
4. **Résolveur et déploiement.** Commentaires seulement : `resolve-skills.js` (en-tête : `runnerSkills`
   ignoré par construction) et `skills-deploy.js` (portée de l'invariant).
5. **Migration des fiches.**
   - `library/personas/loki.md` : `skills: [iakaframe-naonedge]` + ligne `runnerSkills` avec les 8
     skills, **dans l'ordre actuel** : `anthropic-skills:docs, design:design-critique,
     design:design-system, design:accessibility-review, design:ux-copy, artifact-design,
     artifact-diagramming, dataviz`.
   - `library/personas/nathalie.md` : `skills: [iakaframe-nathalie, iakaframe-memoire-humaine]` +
     `runnerSkills: { claude: [anthropic-skills:docs, design:ux-copy, artifact-design] }`.
   - Aucune autre ligne des fiches ne change (le corps reste à l'octet).
6. **Binding (si Q3 = A).** `bindings/iakaframe-claude-default.md:15-16` : ajouter à la fin des
   `tools` de `loki` et de `nathalie`, dans cet ordre : `Artifact, mcp__claude_ai_Claude_Docs__batch,
   mcp__claude_ai_Claude_Docs__guide, mcp__claude_ai_Claude_Docs__update,
   mcp__claude_ai_Claude_Docs__create, mcp__claude_ai_Claude_Docs__read,
   mcp__claude_ai_Claude_Docs__query, mcp__claude_ai_Claude_Docs__export` (l'ordre relevé dans les
   contrats déployés). Le binding est déjà l'endroit des facettes propres au runner (principe I3).
7. **Tests neufs** (`cli/test/runner-skills.test.js`) :
   - le résolveur ignore `runnerSkills` (fixture de réservoir temporaire, comme
     `resolve-skills.test.js:60-113`) ;
   - `generateAgent` ajoute les skills du runner après les résolues, sans doublon, dans l'ordre ;
   - runner non Claude ou absent → aucun ajout ; champ absent → contrat inchangé ;
   - `frame lint` : clé inconnue, valeur mal typée, nom présent dans le réservoir → bloquant ;
   - **garde du cœur neutre** : pour **toutes** les fiches de `library/personas/` (hors `_TEMPLATE`),
     chaque entrée de `skills:` a son `library/skills/<id>/SKILL.md` ; aucun dossier de
     `library/skills/` ne porte un nom à deux-points ni un des 8 noms du runner.
8. **Régénération, dans cet ordre** : `node cli/scripts/gen-skills-golden.mjs`,
   `node cli/scripts/gen-agents-golden.mjs`, `node cli/scripts/gen-methode-vitrine.mjs`. Puis relancer
   les trois une seconde fois : `git status` ne doit rien montrer de plus (idempotence).
9. **Mesure d'arrivée et classement** (§ Plan pour les échecs). Écrire le tableau dans
   `docs/qualite/remise-skills-propres-au-runner.md` (remise au gate de Legolas).
10. **Côté GUI** selon Q4.
11. **Commits atomiques** (conventional commits), par exemple : `feat(schema): champ runnerSkills`,
    `feat(agents): injection des skills du runner claude`, `refactor(personas): loki et nathalie`,
    `feat(binding): outils Claude Docs de loki et nathalie`, `test: skills propres au runner`,
    `chore(golden): regeneration apres runnerSkills`, `docs(qualite): remise`.

## Plan pour les échecs de `npm test`

**Limite de ce cadrage.** Je n'ai pas pu lancer `npm test` : mon rôle n'a pas d'accès au shell
(lecture et web seulement). Le classement ci-dessous est une **prévision par lecture du code** ; la
mesure réelle est l'étape 0, et c'est elle qui fait foi.

### Règle de classement (à appliquer à chaque test en échec)

| Classe | Critère | Traitement |
|---|---|---|
| **A — résolveur** | Le message ou la pile contient `skill referencee introuvable`, `niveau2-injouable`, ou le test appelle `resolveSkills` / `generateAgent` / `generateAll` / `unionSkills` / `buildManifest` / `buildZone` / `checkVendor` / `frame lint` sur le vrai dépôt | **Corrigé dans ce lot** (étapes 1-5). |
| **B — dérivé périmé** | Échoue encore après les étapes 1-7 mais passe après l'étape 8 (golden, manifeste, vitrine) | **Corrigé dans ce lot** (étape 8). |
| **C — autre sujet** | Échoue encore après l'étape 8, sur les trois passes, sans lien avec les skills | **Documenté et reporté** : une ligne par test dans la remise (fichier:nom, cause constatée, **lot cible nommé**). Pas de correction ici. |
| **D — instable** | N'échoue pas sur les trois passes de l'étape 0 ou de l'étape 9 | **Documenté**, lot cible « fiabilisation des tests » ; pas de correction ici. |

Un test **nouvellement** rouge après le lot (absent de la liste de l'étape 0) n'est **jamais** classé
C ou D : c'est une régression de ce lot, à corriger avant la remise.

### Prévision (lecture du code)

- **Classe A, la grande majorité.** Tout ce qui fait passer le vrai dépôt par le résolveur :
  `resolve-skills.test.js` (C4 et la ligne `loki`), `agents.test.js` (lignes 56-57),
  `generate-agents.test.js` (tests `generateAll`), `parite-generateurs.test.js`,
  `parite-skills.test.js`, `vitrine-methode.test.js`, `skills-deploy.test.js`,
  `project-models.test.js`, `verbs-args.test.js`, `switch-anomaly-c.test.js`, et **toute** la recette
  de `vendor-check.test.js` qui attend un miroir propre (le niveau 2 lève sur `loki`, donc aucun
  miroir n'est plus « clean » : A2, C-1, C-2, les 7 scénarios C-5…), plus les tests de `frame lint`
  sur la frame par défaut. Point notable : les tests qui fixent la résolution attendue de `loki`
  (`['iakaframe-naonedge']`) et de `nathalie` (3 skills) **décrivent déjà le comportement voulu** ; ils
  repasseront sans être modifiés.
- **A14 et C-6** (`vendor-check.test.js:343` et `:546`) : leur cause probable n'est pas les `SKILL.md`
  d'Aragorn et d'Odin eux-mêmes, mais le niveau 2 devenu injouable (il ajoute une entrée au remède :
  A14 voit alors une mention en trop, C-6 compte deux entrées « run » au lieu d'une). Ils relèvent de
  la classe A. Les écarts réels laissés sur ces deux `SKILL.md` touchent le manifeste des skills et la
  vitrine (classe B) et disparaissent à l'étape 8. **À confirmer par la mesure.**
- **Classe B.** `cli/test/fixtures/skills-golden/manifest.json` (sha256 des `SKILL.md` d'Aragorn et
  d'Odin), la zone de code de `methode-de-travail.html`, et les goldens de contrat de `loki` et
  `nathalie` (nouvelles skills et nouveaux outils).
- **Classe C probable** : `frontmatter-schema-parity.test.js` « parité » (la copie du schéma dans la
  GUI diverge dès l'étape 1) **si Q4 = B** ; il se referme dans le lot GUI. `route-prod.test.js`
  G-ROUTE-3 lit `~/.claude/agents/` : son résultat dépend du poste, à classer selon la mesure.
- **Classe D** : aucune prévue ; la mesure tranche.

## Fichiers concernés

- `library/_schema/frontmatter.json` — `personas.optional.runnerSkills: "map"`.
- `cli/src/lib/frontmatter-schema.js` — type `map` dans `matchesType`.
- `cli/src/lib/frame-lint.js` — 3 règles `runnerSkills`.
- `cli/src/lib/generate-agents.js` — injection des skills du runner `claude` dans `generateAgent`.
- `cli/src/lib/resolve-skills.js` — commentaire d'en-tête seulement.
- `cli/src/lib/skills-deploy.js` — commentaire seulement.
- `library/personas/loki.md`, `library/personas/nathalie.md` — `skills:` réduit au réservoir +
  ligne `runnerSkills`.
- `bindings/iakaframe-claude-default.md` — outils de `loki` et `nathalie` (si Q3 = A).
- `cli/test/frontmatter-schema-parity.test.js` — `map` dans `VALID_TYPES`.
- `cli/test/runner-skills.test.js` — nouveau.
- Régénérés : `cli/test/fixtures/skills-golden/manifest.json`, `cli/test/fixtures/agents-golden/*.md`,
  `methode-de-travail.html` (zone `CODE_BLOCKS` seulement).
- `docs/qualite/remise-skills-propres-au-runner.md` — nouveau (mesures avant/après, classement).
- Si Q4 = A, dans `../iakaFrameGUI` : `packages/core/src/frontmatter-schema.json`,
  `packages/core/__tests__/fixtures/{personas/loki.md, personas/nathalie.md, agents-golden/*.md,
  binding/iakaframe-claude-default.md, skills/iakaframe-aragorn/SKILL.md, skills/iakaframe-odin/SKILL.md}`
  (copies), `packages/core/__tests__/parite-generateurs.test.ts` (`loadCanon` ajoute
  `runnerSkills.claude`).

## Risques

- **Guillemets dans le contrat généré.** Le sérialiseur met entre guillemets tout élément de liste qui
  n'est pas un « mot plein » (`frontmatter.js:198-221`) : le contrat écrira
  `"anthropic-skills:docs"` là où le contrat déployé aujourd'hui écrit `anthropic-skills:docs`. En YAML,
  c'est la même valeur. → Q6 ; le critère de comparaison porte sur la valeur lue, pas sur les octets.
- **Le préchargement des skills peut ne pas marcher côté Claude Code** (tickets #67251, #25834). Hors
  de ce lot : on garantit la même déclaration, pas un meilleur comportement du runner.
- **Écart de corps entre les contrats déployés et le canon.** Les contrats de `~/.claude/agents/` ont
  été retouchés à la main (outils et skills en plus). Si leur **corps** diffère aussi du canon, ce
  lot ne le corrige pas : l'écart est constaté et reporté dans la remise.
- **Deux dépôts.** Toute modification du schéma ou des fiches vendorées fait diverger la GUI tant
  qu'elle n'est pas re-vendorée (→ Q4). Ne jamais « réparer » `vendor-check` en baissant ses
  constantes (`vendor.js:79-88`).
- **Échecs « autre sujet » plus nombreux que prévu.** Ils sont documentés, pas corrigés : le lot ne
  s'étend pas.

## Critères d'acceptation

- [ ] **CA-1** `node cli/scripts/gen-skills-golden.mjs`, `gen-agents-golden.mjs` et
      `gen-methode-vitrine.mjs` sortent en code 0.
- [ ] **CA-2** Idempotence : les relancer tous les trois une seconde fois ne change aucun fichier
      (`git status --porcelain` identique avant et après la seconde passe).
- [ ] **CA-3** Cœur neutre : pour toute fiche de `library/personas/` (hors `_TEMPLATE`), chaque entrée
      de `skills:` a son `library/skills/<id>/SKILL.md` ; `grep -rn "anthropic-skills\|design:\|artifact-design\|artifact-diagramming\|dataviz" library/skills library/_schema`
      ne rend rien ; `grep -n "^skills:" library/personas/{loki,nathalie}.md` ne cite aucune des 8
      skills du runner. Vérifié aussi par le test de l'étape 7.
- [ ] **CA-4** `resolveSkills('loki')` = `['iakaframe-naonedge']` ;
      `resolveSkills('nathalie')` = `['iakaframe-nathalie', 'iakaframe-memoire-humaine', 'iakaframe-appflowy-doc']`.
- [ ] **CA-5** Contrats Claude identiques au comportement actuel : pour `loki` et `nathalie`, le
      frontmatter du contrat produit par `generateAgent` (binding par défaut), lu par
      `parseFrontmatter`, est **égal champ par champ** à celui de `~/.claude/agents/<id>.md` (lecture
      seule) pour `name`, `description`, `tools`, `model`, `skills`, `guardrails` — en particulier
      `skills` = `[iakaframe-naonedge, anthropic-skills:docs, design:design-critique, design:design-system, design:accessibility-review, design:ux-copy, artifact-design, artifact-diagramming, dataviz]`
      pour Loki et `[iakaframe-nathalie, iakaframe-memoire-humaine, iakaframe-appflowy-doc, anthropic-skills:docs, design:ux-copy, artifact-design]`
      pour Nathalie. Tout écart de **corps** est noté dans la remise (non bloquant, cf. Risques).
- [ ] **CA-6** Les 8 autres contrats générés sont **identiques à l'octet** à leurs goldens d'avant le
      lot (seuls `loki.md` et `nathalie.md` changent dans `cli/test/fixtures/agents-golden/`).
- [ ] **CA-7** Un assignment dont le runner n'est pas `claude` (ou `claude-code`) ne reçoit **aucune**
      skill du runner (test de l'étape 7).
- [ ] **CA-8** `iakaframe skills deploy --project <tmp>` sur un projet temporaire ne copie aucune des
      8 skills du runner et ne signale aucune erreur.
- [ ] **CA-9** `iakaframe frame lint iakaframe` : aucun bloquant, et aucun avertissement
      `unknown-field` sur `runnerSkills`. Les trois règles `runnerSkills` sont couvertes par un test.
- [ ] **CA-10** `npm test` (dans `cli/`) : **vert**, ou chaque échec restant figure dans
      `docs/qualite/remise-skills-propres-au-runner.md` avec sa classe (C ou D), sa cause constatée et
      son lot cible. Aucun test ne figure en échec après le lot s'il passait à l'étape 0.
- [ ] **CA-11** La remise porte les comptes avant/après (trois passes chacun) et le tableau de
      classement de tous les échecs de l'étape 0.
- [ ] **CA-12** `iakaframe vendor-check` : le niveau 2 est de nouveau **jouable** (plus aucune raison
      `niveau2-injouable`). Si Q4 = A, il repasse à `clean` ; si Q4 = B, les dérives restantes sont
      exactement les fichiers listés pour le lot GUI.
- [ ] **CA-13** Aucune écriture sous `~/.claude`, aucun tag, aucun push.

## Ce qui appartient à Stéphane

- Déployer les contrats et les skills sur son poste : `iakaframe agents generate --global` et
  `iakaframe skills deploy --global`. Après ce lot, les contrats de Loki et Nathalie doivent sortir
  équivalents à ceux déjà en place (CA-5) : le déploiement est sans effet attendu, mais c'est son geste.
- La montée de version, le tag et le push.
- Le choix Q4 (travail dans le dépôt de la GUI dans ce lot, ou lot séparé).

## Questions fermées (avec recommandation)

- **Q1 — Nom du champ.** A : `runnerSkills` (camelCase, comme tous les champs du canon). B :
  `skills_runner` (la forme de l'exemple du 27/09). **Recommandé : A.**
- **Q2 — Clé du runner.** A : `claude`, nom canonique de `RUNNER_KINDS` ; le générateur normalise
  `claude-code` du binding vers `claude`. B : `claude-code`, la valeur écrite dans le binding.
  **Recommandé : A.**
- **Q3 — Outils de Loki et Nathalie.** Les contrats déployés portent `Artifact` et 7 outils
  `mcp__claude_ai_Claude_Docs__*` absents du binding. A : les ajouter au binding dans ce lot (sinon le
  critère « comportement identique » ne peut pas tenir). B : hors lot, et accepter qu'un
  redéploiement retire ces outils. **Recommandé : A.**
- **Q4 — Côté GUI.** A : inclure dans ce lot les copies vers `../iakaFrameGUI` et l'ajout de
  `runnerSkills.claude` dans son test de parité, dans un commit séparé de ce dépôt-là (≈ +0,25 j-h ;
  seulement si l'arbre de la GUI est propre, sinon repli sur B). B : lot successeur
  « GUI-RUNNER-SKILLS » ; en attendant, `vendor-check` et le test de parité du schéma restent rouges,
  documentés. **Recommandé : A.**
- **Q5 — Sévérité des règles de `frame lint`.** A : bloquantes (runner inconnu, mauvais type, skill du
  réservoir rangée dans `runnerSkills`). B : simples avertissements. **Recommandé : A.**
- **Q6 — Guillemets.** A : accepter `"anthropic-skills:docs"` entre guillemets dans le contrat généré
  (même valeur YAML, sérialiseur commun au CLI et à la GUI inchangé). B : écrire ces noms sans
  guillemets (toucher au sérialiseur des deux dépôts). **Recommandé : A.**

## Estimation

- **Équivalent jour-homme** : **1 j-h** (fourchette 0,75 – 1,5), dont 0,25 j-h côté GUI si Q4 = A.
  - 0,25 — schéma, type `map`, règles de `frame lint` ;
  - 0,25 — injection dans `generateAgent`, migration des 2 fiches, binding ;
  - 0,25 — tests neufs + régénération des 3 dérivés ;
  - 0,25 — mesure avant/après et classement des échecs.
- **Complexité / risque** : **faible à moyen.** Le code touché est petit et bien isolé ; le risque
  tient au nombre de gardes de parité entre les deux dépôts.
- **Inconnues qui peuvent faire glisser** : le nombre réel d'échecs « autre sujet » une fois le
  résolveur réparé (non mesuré ici) ; un écart de corps entre contrats déployés et canon ; l'état de
  l'arbre de la GUI.

## Sources

- Documentation Claude Code, sous-agents (champ `skills`) : https://code.claude.com/docs/en/sub-agents
- Ticket #67251, `skills:` ne précharge pas le contenu : https://github.com/anthropics/claude-code/issues/67251
- Ticket #25834, skills de plugins non injectées : https://github.com/anthropics/claude-code/issues/25834
