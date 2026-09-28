# Synchronisation multi-dépôts après les chantiers `declaration-chantier-session` et `prise-de-parole-odin-aragorn`

> **Statut : proposé, à valider par Stéphane.** Cadrage 🔵 Gandalf du 2026-09-28, depuis
> `C:\work\iakaframe` (HEAD `fa8685e`). Relevé fait **en lecture seule** sur les autres dépôts :
> rien n'y a été écrit. Chaque lot par dépôt s'exécute **dans une session Aragorn de ce dépôt**
> (règle « une session = un dépôt »). Le Lot 7 / Lot P4 reste un **geste humain**.

## 0. Outillage du relevé (à lire avant les chiffres)

- Mon poste de cadrage n'a **pas de shell** : je n'ai pu lancer ni `iakaframe vendor-check`, ni
  `git`, ni les suites de test. Les constats ci-dessous viennent de **lectures de fichiers**
  (`Read`/`Grep`/`Glob`) et du journal `.git/logs/HEAD` des dépôts.
- Le chiffre « 19 gestes `[copy]` » de `vendor-check` vient de l'**ordre de mission** (mesure
  d'Aragorn), pas de moi. Je n'en ai vérifié qu'un sous-ensemble, en comparant les empreintes
  (§ 1.2).
- Période couverte : commits `c862a14..fa8685e` (`.git/logs/HEAD:10-33`).
- Dépôts git trouvés sous `C:\work` : `iakaframe`, `iakaframegui`, `iakacockpit`,
  `iakaagentsmonitor`, `iakatokencounter`, `naonedge`, `naonedge-clients`, `robotimmo`, `iakavod`.
  **`iakaos` n'existe pas** sous `C:\work` (aucun dossier) : il est hors relevé.

## 1. Constats

### 1.1 Ce que les chantiers ont changé et qui peut se propager

| Famille | Fichiers iakaframe | Canal de propagation |
|---|---|---|
| Hooks runtime | `kits/iakaframe-claude/global/hooks/{guard-core,chantier-state,chantier-remind,perimeter-guard,delegation-guard,plan-courante,identity-remind}.mjs`, `settings.example.json` | copie **humaine** vers `~/.claude/hooks/` (Lot 7 / P4) ; **copies embarquées** dans des dépôts (§ 1.3, § 1.5) |
| Contrats | `library/personas/{odin,aragorn}.md`, `library/skills/{iakastart,iakaframe-odin,iakaframe-aragorn}/SKILL.md`, `library/guardrails/perimeter.md` | **vendorisation** vers `iakaframegui` (fixtures) ; déploiement runtime `~/.claude/agents`, `~/.claude/skills` |
| Goldens | `cli/test/fixtures/agents-golden/{odin,aragorn}.md`, goldens de skills | vendorisation vers `iakaframegui` |
| Méthode et kit | `methode-de-travail.md`, `kits/iakaframe-claude/global/CLAUDE.md` | `~/.claude/CLAUDE.md` (humain) ; copies `global/CLAUDE.md` déposées par `iakaframe init` |
| Journal émis | `delegation-guard.mjs:117-126` et `plan-courante.mjs:106-141` : le `royaume` émis devient le **nom du dépôt en MAJUSCULE** (D-12), plus des champs `meta.repo/segment/aragorn/main_role` | consommateurs de la main courante (`iakacockpit`) |

Mécanisme d'amorçage : `iakaframe init` copie **tout** le kit (`cli/src/commands/init.js:60`,
`cli/src/lib/kit.js:96-112`), y compris le sous-dossier `global/` (hooks + `CLAUDE.md` global). Chaque
projet initialisé porte donc une **copie figée** de `global/`, datée de son `init`.

### 1.2 `iakaframegui` — consommateur principal (vendorisation active)

**Ce qu'il consomme :**
- **82 copies + 4 dérivées** sous `packages/core/__tests__/fixtures/` (table
  `cli/src/lib/vendor.js:134-222`, attendus `:88-89`). L'inventaire est **complet** côté GUI (86 `.md`
  présents, Charon/Helm/`surveillance` compris). La dérive est donc du **contenu**, pas des fichiers
  manquants.
- Mécanisme : copie **manuelle** guidée par `vendor-check` (remède dérivé, `cli/src/commands/vendor-check.js:108-170`) ;
  dérivées sérialisées régénérées par `packages/core/scripts/gen-fixtures.mjs` (`:1-22`, canon résolu
  `:61-76`) ; garde déclenchable côté GUI par `npm run test:vendor` (`scripts/test-vendor.mjs:17-40`,
  shell-out vers le CLI du frère, hors gate).
- **Couplage fort** : `packages/core/__tests__/parite-generateurs.test.ts:2-12,47-56,113` régénère les
  contrats depuis les **personas + skills + binding** vendorés et les compare aux **goldens** vendorés.
  Une copie partielle (persona sans golden, ou golden sans skill) **rougit** la suite GUI.
- Schéma de frontmatter vendoré : `packages/core/src/frontmatter-schema.json`, garde
  `cli/test/frontmatter-schema-parity.test.js:58-78` côté iakaframe.
- **Hooks embarqués (actifs, non gardés)** : `global/hooks/{identity-guard,identity-remind,perimeter-guard,delegation-guard}.mjs`
  recopiés **verbatim** dans `packages/core/src/adapters/guardScripts.generated.ts:2-14`. La Forge
  les **déploie** dans les projets qu'elle génère (`packages/core/src/adapters/claudeCode.ts:247-250` :
  `.claude/settings.json` + `.claude/hooks/*`). Cette génération n'a **ni `guard-core.mjs`, ni
  `chantier-state.mjs`, ni `chantier-remind.mjs`, ni `plan-courante.mjs`** (grep : 0 import de
  `guard-core`). `vendor-check` **ne couvre pas** ces fichiers.
- `global/CLAUDE.md:119` porte encore « Claude principal (Odin) » ; `global/hooks/identity-remind.mjs:10`
  cite `[PORTEFEUILLE][Odin]` comme exemple universel. Aucun code ne lit `global/CLAUDE.md` (grep).
- Pointeur `.iakaframe:1` : `iakaframe=v0.1.0` (init du 2026-07-05), sans `frame=`.

**Divergence constatée :**
- Goldens : sur les 10, **seuls `aragorn` et `odin` diffèrent** (empreintes d'en-tête : iakaframe
  `b63044c3…`/`581cef28…` contre GUI `17594584…`/`2d8364c6…`) ; les 8 autres ont une empreinte
  identique.
- Marqueurs du chantier (« Voix dans le dépôt », « Chaîne de délégation visible », « Chantier
  déclaré », « chantier de session ») : **0 occurrence** dans les fixtures GUI, 11 dans 6 fichiers
  canon (`library/personas/{aragorn,odin}.md`, `library/skills/iakaframe-aragorn/SKILL.md`,
  `library/guardrails/perimeter.md`, les 2 goldens).
- **8 gestes de copie sont imputables aux chantiers** : personas `aragorn`, `odin` ; goldens `aragorn`,
  `odin` ; skills `iakastart`, `iakaframe-odin`, `iakaframe-aragorn` ; guardrail `perimeter`. Les
  **11 autres** (sur 19) sont **antérieurs** : je ne les ai pas identifiés sans shell. Le lot les
  liste par `--json`.
- Parité `frontmatter-schema` : les deux fichiers sont **identiques à la lecture intégrale**
  (`library/_schema/frontmatter.json` et `packages/core/src/frontmatter-schema.json`, 93 lignes, avec
  `runnerSkills` à `:7` des deux côtés). Or la GUI a été avancée en fast-forward depuis `vps/main` le
  2026-09-28 (`.git/logs/HEAD:2`, HEAD `96ea5bf`). L'échec signalé est donc **probablement résorbé**.
  **À re-mesurer**, pas à croire.

### 1.3 `iakacockpit` — consommateur en lecture vive (pas de copie des contrats)

- **Réservoir lu en direct** (pas de copie) : `src-tauri/src/reservoir.rs:1-29` lit
  `library/personas` + `teams` (id, `roleKey`, roster). Garde `scripts/test-reservoir-parity.mjs:94-173`
  (noms du roster + valeurs `pastille:`). Les chantiers n'ont modifié ni `roleKey` ni `pastille` ni
  le roster : **pas de dérive attendue**.
- Contrat de handoff avec le cœur GUI : `npm run test:handoff-parity` (`CLAUDE.md:120-123`). Il dépend
  du dépôt GUI, pas d'iakaframe directement.
- **Chef-runner** : `claude` lancé **sans `--agent`** dans le dossier du projet
  (`src-tauri/src/terminal.rs:312-357`), avec sa propre obligation de coordinateur (`:324-327`). Avec
  les nouveaux hooks : `sessionRole = odin` (`guard-core.mjs:596-599`), lancement = le dépôt, pas de
  régime Odin tant qu'il reste chez lui (`:605-614`). Les gestes et délégations dans le projet sont
  donc **autorisés**. La voix rappelée par `identity-remind` y devient **Aragorn** (`voiceOf`, `:743-749`).
- Main courante : `src-tauri/src/maincourante.rs:83-84,262-263` filtre par `royaume` en
  **égalité exacte** (Mango). Les nouveaux hooks émettent `royaume = NOM_DU_DEPOT` en MAJUSCULE
  (`delegation-guard.mjs:119-126`). Un filtre en minuscules (`"iakacockpit"`, cf. test `:648-652`)
  **ne verrait plus** ces documents. Je n'ai pas trouvé d'appelant UI qui pose ce filtre : c'est un
  risque **à mesurer**, pas une panne constatée.
- Attribution analytics : `src/App.tsx:670-679` attribue à « Odin » un projet **non lié** à une team.
  La voix par lieu dit « Aragorn dans tout dépôt ». C'est un écart de **vocabulaire**, sans effet sur
  les gardes.
- `global/` : copie **inerte** (`global/CLAUDE.md:113` « Claude principal (Odin) », 2 hooks anciens).
  Aucune référence dans le code (grep).
- Pointeur `.iakaframe:1` : `iakaframe=v0.6.1`, sans `frame=`.
- Aucun `CLAUDE.md` **projet** ne contient « Claude principal (Odin) » (grep sur tous les
  `*/CLAUDE.md` : 0).

### 1.4 `iakaagentsmonitor` — lecture vive + publieur global

- Roster lu en direct via le pointeur (`src-tauri/src/roster.rs:2-8,42-46`) : chantiers **sans effet**.
- Publieur `publishers/claude-code/iaka-agents-publish.mjs`, déployé en
  `~/.claude/iaka-agents-publish.mjs` et câblé sur **tous** les évènements de `~/.claude/settings.json`
  (entrées `"matcher": "*"`, lignes 20-24, 40-44, 60-64, 110-150). Il est **absent** de
  `kits/iakaframe-claude/global/settings.example.json`. **Risque d'écrasement au Lot 7** si l'exemple
  est copié au lieu d'être fusionné.
- `global/` : copie **inerte** de l'`init` du 2026-09-26 (avant les chantiers). `guard-core.mjs` n'y
  a aucune fonction chantier ; `global/CLAUDE.md:128,141` porte « Claude principal (Odin) ». Non
  câblée (aucun `.claude/settings*` dans le dépôt).
- `.claude/commands/*.md` (palette déposée par `init`) : 0 mention d'Odin ; non touchés par les
  chantiers.
- Pointeur `.iakaframe:1-7` : `iakaframe=v0.41.0`, `frame=iakaframe`. La version du CLI est
  **inchangée** (`cli/package.json:3` = `0.41.0`), bien que son contenu ait bougé.

### 1.5 Dépôts sans lien d'artefact

- `iakatokencounter` : aucune dépendance de code aux hooks ni à la main courante (grep :
  seulement des specs). L'attribution par chantier y est **exclue** et renvoyée à un lot ultérieur
  (`declaration-chantier-session.md:358,659`, Q-E).
- `naonedge`, `robotimmo`, `iakavod` : un `CLAUDE.md` projet sans copie d'artefact iakaframe, ni
  `.claude/`, ni `global/`, ni pointeur. Seuls les effets **runtime** du Lot 7 les touchent. `naonedge`
  est le lieu de recette de CA-P11/CA-P15. Écart préexistant, hors chantier : `naonedge/CLAUDE.md:105-107`
  cite le script PowerShell retiré.
- `naonedge-clients` : dépôt documentaire (réunions, une instruction Odoo), sans `CLAUDE.md` : aucun
  lien.

### 1.6 Runtime du poste (déploiement humain pas encore fait)

- `~/.claude/hooks/` contient `identity-guard`, `identity-remind`, `perimeter-guard`,
  `delegation-guard`, `plan-courante`, `guard-core` (+ `.bak`). **Absents : `chantier-state.mjs`,
  `chantier-remind.mjs`.** Le `guard-core.mjs` déployé ne contient ni `isOdinSolicitation`, ni
  `isAnchoredKey`, ni `verdictDispatch`, ni `mainRoleOf` (grep : 0).
- `~/.claude/settings.json:81` : matcher `Edit|Write|Bash|NotebookEdit` (sans `PowerShell`) ; aucune
  entrée `chantier-remind`.
- `~/.claude/agents/aragorn.md` (et les 7 autres) : **0 occurrence** des sections nouvelles. Les
  skills déployées sont les anciennes : la description d'`iakastart` présente encore `odin` comme
  déclencheur inconditionnel.
- `~/.claude/CLAUDE.md` : ancienne version (« Claude principal (Odin) », remote `vps`), alors que
  `kits/iakaframe-claude/global/CLAUDE.md` est à jour.
- **Piège d'ordre** : `delegation-guard.mjs:48` importe `chantier-state.mjs` **statiquement**. Copier
  le nouveau `delegation-guard` sans `chantier-state` casse le garde à l'import.
- Les changements de hooks prennent effet **sans redémarrer** : le *file watcher* recharge
  `settings.json`, et un script modifié s'applique dès l'appel suivant (doc Claude Code, Sources). Un
  déploiement touche donc **toutes les sessions en cours**, y compris un gate Legolas en cours.

### 1.7 Friction du nouveau garde sur les copies inter-dépôts

`classifyShell` relève **tous** les chemins absolus d'une commande (`guard-core.mjs:367,470-472`). Une
commande `cp C:\work\iakaframe\library\… C:\work\iakaframegui\…` est donc un geste mutateur qui
touche **deux** dépôts : `CHANTIER_MISMATCH` (`:659-662`) sous les nouveaux hooks. Sous les hooks
actuels, le même `cp` n'est qu'un **avertissement** (runtime `perimeter-guard.mjs:44` : Bash = `warn`).
Les copies de `vendor-check` sont justement de cette forme (`vendor-check.js:69-75`).

## Problème

Les deux chantiers ont changé le canon (contrats, skills, garde-fou), les hooks et la méthode. Ces
changements n'existent aujourd'hui **que dans iakaframe**. Il reste trois choses à faire :
1. aligner le **miroir vendoré** de la GUI ;
2. vérifier que les **consommateurs en lecture vive** (Cockpit, moniteur d'agents) tiennent face au
   nouveau runtime ;
3. poser le **déploiement humain** au bon moment.

Il faut aussi identifier ce qui **ne se synchronise pas**, pour ne pas ouvrir de travail inutile.

## Décision retenue (proposée, à arbitrer)

- **D-S1** — Un lot **par dépôt**, exécuté par la session Aragorn **de ce dépôt**. Aucun lot n'écrit
  dans un autre dépôt que le sien. Tout besoin de modifier le canon (golden périmé, générateur) **remonte**
  à une session iakaframe.
- **D-S2** — Ordre recommandé (justifié en § Risques et Q-S3) :
  **(0)** gate Legolas iakaframe PASS et commit → **(1)** `iakaframegui` G1 (re-vendorisation) →
  **(2)** Lot 7 / P4 humain, hooks et contrats **dans la même séance**, sans session active → **(3)**
  recette (dans `naonedge`) → **(4)** `iakacockpit` C1 et `iakaagentsmonitor` A1 (vérifications
  runtime) → **(5)** successeurs cadrés à part (Q-S1, Q-S2).
- **D-S3** — La re-vendorisation GUI est **atomique** (un seul commit) : personas, goldens et skills
  vont ensemble (couplage de `parite-generateurs.test.ts`).
- **D-S4** — Les copies `global/` des projets **ne sont pas** rafraîchies dans ce lot (Q-S2). Les
  hooks embarqués de la GUI **ne sont pas** re-vendorés dans ce lot (Q-S1).
- **D-S5** — Aucune ré-exécution d'`iakaframe init --force` dans un projet existant : elle écraserait
  le `CLAUDE.md` projet (`init.js:54-60`).

## Périmètre

- **Inclus** :
  - G1 : re-vendorisation des fixtures de `iakaframegui` jusqu'à `vendor-check` propre, plus une
    entrée de backlog GUI qui déclare la dette « hooks embarqués » ;
  - Lot 7 / P4 : liste de gestes humains ordonnée et vérifiable (§ Étapes) ;
  - C1 et A1 : vérifications (tests existants et recette runtime), **sans modification de code**
    sauf arbitrage contraire (Q-S4) ;
  - dans iakaframe, un renvoi vers la présente instruction en tête de
    `declaration-chantier-session.md` et `prise-de-parole-odin-aragorn.md`, **à la validation**
    (Gandalf).
- **Exclu** :
  - re-vendorisation des hooks embarqués de la GUI (`global/hooks`, `guardScripts.generated.ts`) :
    successeur (Q-S1) ;
  - nettoyage ou rafraîchissement des copies `global/` des projets, et changement de `copyKit` :
    successeur iakaframe (Q-S2) ;
  - toute modification des gardes, contrats ou générateurs d'iakaframe ;
  - le correctif « générateurs no-op sous Windows » (préexistant, iakaframe) ;
  - iakaTokenCounter (Q-E, lot ultérieur) ; `naonedge`, `robotimmo`, `iakavod`, `naonedge-clients` :
    rien à écrire ;
  - rafraîchissement des pointeurs `.iakaframe` (Q-S5) ;
  - `iakaos` (absent du disque).

## Étapes d'implémentation

### Étape 0 — iakaframe (pré-requis, session Aragorn iakaframe)
1. Gate 🏹 Legolas du chantier **PASS** et commité. Canon **gelé** jusqu'à la fin de G1 : toute
   modification ultérieure du canon relance G1.
2. Gandalf, à la validation : note de renvoi vers `synchro-multi-depots.md` en tête des deux
   instructions mères (commit `docs(specs)` par l'orchestrateur).

### Lot G1 — `iakaframegui` (session Aragorn lancée dans `C:\work\iakaframegui`)
1. `git pull` (branche suivie : `vps/main`, `.git/config`). Mesurer la baseline :
   `npm run lint:all`, `npm run test:all`, puis tableau de verdict au format du dépôt
   (`CLAUDE.md:330-353`).
2. `node C:\work\iakaframe\cli\src\index.js vendor-check --gui C:\work\iakaframegui --json` (verbe
   en lecture). Consigner la liste `remediation` en tête de PR. Les 8 gestes imputables (§ 1.2) doivent
   y figurer. Les 11 autres sont **identifiés** et consignés.
3. **Arrêt** si `remediation` contient `run … gen-agents-golden.mjs (depuis iakaframe)` ou un
   `investigate` : le canon est en cause. Remonter à la session iakaframe, sans rien copier.
4. Appliquer **dans l'ordre rendu** : `run` (`node packages/core/scripts/gen-fixtures.mjs`) avant
   `copy`, `delete` en dernier. Copie **nommée, jamais de joker**. Le kit est **dépouillé de son
   en-tête** (`vendor-check.js:77-89`).
   - Si l'étape (2) du § D-S2 est déjà faite (nouveaux hooks actifs), ne pas taper
     `cp <abs iakaframe> <abs GUI>` : il est refusé (§ 1.7). Utiliser `Read` (source) puis `Write`
     (cible dans la GUI), l'égalité octet étant **prouvée** par l'étape 5, ou faire faire la copie
     par Stéphane.
5. Re-mesurer `vendor-check --json` jusqu'à `ok:true`, `status:"clean"`, `checked:82`,
   `derived:4`, `drift:0`.
6. `npm run test:vendor` ; `npm run lint:all` ; `npm run test:all`. `npm run test:rust` est
   **non concerné** si `git diff --stat -- '*.rs'` est vide : le déclarer tel quel sur sa ligne.
7. Backlog GUI (`CLAUDE.md` § Backlog) : une entrée **« Ouvert »** qui déclare la dette « hooks
   embarqués d'ancienne génération » (`guardScripts.generated.ts`, `global/`), en renvoyant à Q-S1.
   Aucun changement de code.
8. Un commit `chore(vendor): resync fixtures sur iakaframe <sha>` (fixtures seules), plus un commit
   `docs(backlog)` ; gate Legolas GUI ; push.

### Lot 7 / P4 — déploiement humain (Stéphane), **aucune session Claude ouverte**
9. Fermer les sessions Claude en cours (G1 et gate compris) : les scripts s'appliquent dès l'appel
   suivant (§ 1.6).
10. Copier **les 8** `kits/iakaframe-claude/global/hooks/*.mjs` vers `~/.claude/hooks/`, **en un
    seul geste** : `identity-guard`, `identity-remind`, `perimeter-guard`, `delegation-guard`,
    `plan-courante`, `guard-core`, `chantier-state`, `chantier-remind`.
11. **Fusionner** (ne jamais remplacer) `settings.example.json` dans `~/.claude/settings.json` :
    ajouter l'entrée `UserPromptSubmit` → `chantier-remind.mjs` et passer le matcher à
    `Edit|Write|Bash|NotebookEdit|PowerShell`. **Conserver** toutes les entrées
    `iaka-agents-publish.mjs`. Le matcher `Task` reste valide pour l'outil `Agent` (Sources).
12. Copier `kits/iakaframe-claude/global/CLAUDE.md` → `~/.claude/CLAUDE.md`.
13. `iakaframe agents --action generate --global`, puis `--check` ; `iakaframe skills deploy --global`,
    puis `iakaframe skills deploy --global --check`.
14. Ouvrir une session neuve et faire la recette : CA-29 à CA-33 et le constat CA-42
    (`declaration-chantier-session.md`) ; CA-P11 à CA-P15 (`prise-de-parole-odin-aragorn.md`, dans
    `C:\work\naonedge`).

### Lot C1 — `iakacockpit` (session Aragorn dans `C:\work\iakacockpit`, après Lot 7 et G1)
15. `npm run test:reservoir-parity` ; `npm run test:handoff-parity` (après G1) ; `npm run test`.
16. Recette runtime : ouvrir la conversation du projet `iakacockpit` dans le Cockpit. Vérifier que
    la première réponse du chef-runner s'ouvre sous `🟠 [IAKACOCKPIT][Aragorn]`, et qu'une
    délégation (ex. Gandalf) n'est **pas** refusée par `[chantier-guard]`.
17. Mesurer la main courante : les documents de délégation portent-ils `royaume = "IAKACOCKPIT"` ?
    Un filtre royaume de l'UI les retrouve-t-il ? Consigner le résultat. Si écart, **ne pas corriger
    ici** : ouvrir une instruction Cockpit (Q-S4).

### Lot A1 — `iakaagentsmonitor` (session Aragorn dans `C:\work\iakaagentsmonitor`, après Lot 7)
18. `npm run test:publisher` ; vérifier que `~/.claude/settings.json` porte toujours les entrées
    `iaka-agents-publish.mjs` (même nombre qu'avant le Lot 7) et que l'app affiche une session vivante.

## Fichiers concernés

- `C:\work\iakaframegui\packages\core\__tests__\fixtures\**` : re-vendorisation (G1).
- `C:\work\iakaframegui\CLAUDE.md` : une entrée de backlog (G1, étape 7).
- `~/.claude/hooks/*.mjs`, `~/.claude/settings.json`, `~/.claude/CLAUDE.md`, `~/.claude/agents/*.md`,
  `~/.claude/skills/**` : Lot 7 humain.
- `C:\work\iakaframe\specs\instructions\{declaration-chantier-session,prise-de-parole-odin-aragorn}.md` :
  note de renvoi (étape 0).
- **Non touchés** : `iakacockpit`, `iakaagentsmonitor` (vérification seule), `iakatokencounter`,
  `naonedge`, `robotimmo`, `iakavod`, `naonedge-clients`, toute copie `global/`,
  `guardScripts.generated.ts`.

## Risques

- **Copie partielle dans la GUI** : `parite-generateurs.test.ts` rougit. → D-S3, un seul commit, et
  `test:all` avant commit.
- **Golden CLI périmé** (générateurs no-op sous Windows, préexistant) : `vendor-check` niveau 2 le
  détecte (`niveau2-contrat-vivant-different`). → étape 3 : arrêt et remontée. Aucune copie d'un
  golden périmé.
- **Déploiement pendant qu'une session tourne** : un gate ou une session G1 bascule de garde en plein
  travail. → étape 9.
- **`delegation-guard` sans `chantier-state`** : le garde échoue à l'import. → étape 10, 8 fichiers
  ensemble.
- **Écrasement du publieur du moniteur** au Lot 7. → étape 11 (fusion) et critère A1.
- **Copie inter-dépôts refusée après Lot 7** (§ 1.7). → ordre D-S2 (G1 avant), et repli
  `Read`/`Write` prouvé par `vendor-check`. Contourner le garde en passant la source en chemin
  **relatif** exploiterait la limite acceptée LS : **interdit**.
- **Filtre royaume de la main courante Cockpit** (casse). → mesure C1, correction hors lot.
- **Hooks d'ancienne génération déployés par la Forge** dans les projets qu'elle génère : ils
  s'**ajoutent** aux hooks globaux, sans chantier. → dette déclarée (G1 étape 7), Q-S1.
- **Copies `global/CLAUDE.md` périmées** : Claude Code charge les `CLAUDE.md` des sous-dossiers qu'il
  consulte, donc un agent qui ouvre `global/` peut lire « Claude principal (Odin) ». → faible, Q-S2.

## Critères d'acceptation

**G1 — iakaframegui**
- [ ] `vendor-check --gui C:\work\iakaframegui --json` → `ok:true`, `status:"clean"`, `checked:82`,
      `derived:4`, `drift:0`, `remediation:[]`.
- [ ] `npm run test:vendor` exit 0 ; `npm run lint:all` exit 0 ; `npm run test:all` exit 0, nombre de
      tests ≥ baseline de l'étape 1 ; ligne `test:rust` présente (mesurée, ou « non concerné » avec
      `git diff --stat -- '*.rs'` vide).
- [ ] Le commit de vendorisation ne touche que `packages/core/__tests__/fixtures/**`.
- [ ] `grep -c "Voix dans le dépôt" packages/core/__tests__/fixtures/personas/aragorn.md` ≥ 1 ;
      l'empreinte d'en-tête des goldens `aragorn`/`odin` est égale à celle d'iakaframe.
- [ ] Depuis iakaframe, `node --test cli/test/frontmatter-schema-parity.test.js` passe (non SKIP).
- [ ] Le backlog GUI porte l'entrée « hooks embarqués » renvoyant à Q-S1.

**Lot 7 / P4 — humain**
- [ ] `~/.claude/hooks/` contient les 8 `.mjs`, chacun à la même empreinte (`Get-FileHash`) que sa
      source `kits/iakaframe-claude/global/hooks/`.
- [ ] `~/.claude/settings.json` contient `chantier-remind.mjs` et un matcher avec `PowerShell`, avec
      autant d'entrées `iaka-agents-publish.mjs` qu'avant.
- [ ] `~/.claude/CLAUDE.md` est identique à `kits/iakaframe-claude/global/CLAUDE.md`.
- [ ] `iakaframe agents --action generate --global --check` → aucune dérive ;
      `iakaframe skills deploy --global --check` → aucune dérive.
- [ ] Recette CA-29 à CA-33, CA-42 (constat), CA-P11 à CA-P15 cochée par Stéphane.

**C1 — iakacockpit**
- [ ] `npm run test:reservoir-parity`, `npm run test:handoff-parity`, `npm run test` : exit 0, chiffres
      cités.
- [ ] Recette : ouverture sous `[IAKACOCKPIT][Aragorn]`, délégation non refusée.
- [ ] Mesure du `royaume` émis et du filtre de main courante consignée (écart éventuel = instruction
      séparée).

**A1 — iakaagentsmonitor**
- [ ] `npm run test:publisher` exit 0 ; une session vivante apparaît dans l'app après le Lot 7.

**Non-synchronisation**
- [ ] Aucun commit issu de ce lot dans `iakatokencounter`, `naonedge`, `robotimmo`, `iakavod`,
      `naonedge-clients`.

## Estimation (jalon P1→P2)

| Lot | Équivalent j-h | Complexité / risque |
|---|---|---|
| Étape 0 — renvois | 0,02 | faible |
| G1 — iakaframegui | 0,3 (0,5 avec les 11 dérives préexistantes à comprendre) | faible-moyenne : copie atomique, dérives préexistantes inconnues |
| Lot 7 / P4 — humain | 0,1 + 0,15 de recette | faible, sensible à l'ordre |
| C1 — iakacockpit | 0,1 | faible (vérifications) |
| A1 — iakaagentsmonitor | 0,05 | faible |
| Autres dépôts | 0 | — |
| **Total** | **≈ 0,6 à 0,8 j-h** + 0,15 de recette | **faible-moyenne** |

**Inconnues qui peuvent faire glisser l'estimation :**
1. **Nature des 11 dérives préexistantes** : si l'une est `niveau2`, il faut remonter dans iakaframe
   et régénérer un golden, avec le problème des générateurs no-op sous Windows (**+0,25 à 0,5 j-h**,
   côté iakaframe).
2. **Mesure royaume du Cockpit** : un écart réel ouvre une instruction Cockpit (≈ 0,25 j-h, hors
   total).
3. **Successeurs Q-S1 et Q-S2**, hors total : hooks embarqués de la Forge ≈ 1 à 1,5 j-h (à cadrer
   dans la GUI) ; `copyKit` sans `global/` ≈ 0,25 j-h (iakaframe).

## Questions ouvertes à Stéphane (avec recommandation)

- **Q-S1 — Hooks embarqués de la GUI** (`guardScripts.generated.ts`, 4 hooks sans chantier, déployés
  par la Forge dans les projets générés). (a) Déclarer la dette maintenant et cadrer un successeur
  dans la GUI. (b) Re-vendorer tout le nouveau jeu dans ce lot : 8 fichiers liés par imports, et un
  générateur qui écrit plusieurs fichiers plus un nouveau câblage `settings`. (c) Ne plus déployer
  de hooks au niveau projet et s'en remettre aux hooks globaux.
  **Recommandation : (a) maintenant**, avec un successeur qui **évalue (c)**. Les hooks globaux
  portent déjà la garde, et un doublon de génération différente est source de refus incohérents.
- **Q-S2 — Copies `global/` des projets** (`iakacockpit`, `iakaagentsmonitor` inertes ; `iakaframegui`
  source de Q-S1). (a) Les laisser, et un successeur iakaframe fait que `copyKit` ne dépose plus
  `global/` dans un projet. (b) Les supprimer dépôt par dépôt. (c) Les rafraîchir.
  **Recommandation : (a)**. Rafraîchir recrée la même dette au prochain chantier ; supprimer sans
  corriger `copyKit` la recrée au prochain `init`.
- **Q-S3 — Ordre G1 / Lot 7.** Recommandation : **G1 avant le Lot 7**, pour trois raisons :
  1. les copies de `vendor-check` sont des `cp` inter-dépôts, que le garde actuel laisse passer avec
     un avertissement et que le nouveau refuse (§ 1.7) ;
  2. vendorer des fixtures ne change **aucun** comportement runtime, donc c'est sans risque ;
  3. la recette du Lot 7 part ainsi d'un portefeuille où `vendor-check` est propre.

  Dans le Lot 7, hooks et contrats vont **dans la même séance**. Des hooks sans contrats refusent
  des gestes que les contrats n'expliquent pas encore. Des contrats sans hooks promettent une garde
  absente.
- **Q-S4 — Alignements Cockpit facultatifs** : attribution « Odin » d'un projet non lié
  (`App.tsx:670-679`), obligation du chef-runner (`terminal.rs:324-327`) face à la « chaîne de
  délégation visible », casse du `royaume`.
  **Recommandation : rien avant la mesure C1**. N'ouvrir une instruction Cockpit que sur un écart
  mesuré.
- **Q-S5 — Pointeurs `.iakaframe` périmés** (`v0.1.0`, `v0.6.1`). Aucun consommateur fonctionnel ne lit
  `iakaframe=` ; le moniteur lit `frame=` et se replie sur `iakaframe`. Le seul geste qui les réécrit
  (`init --force`) écrase `CLAUDE.md`.
  **Recommandation : ne rien faire.**

## Sources

- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) : les modifications de
  hooks dans les fichiers de settings sont prises en compte par le *file watcher* ; un script modifié
  s'applique à l'invocation suivante.
- [Issue #29677 — Task→Agent tool rename (anthropics/claude-code)](https://github.com/anthropics/claude-code/issues/29677) :
  le payload porte `tool_name: "Agent"` ; un matcher `Task` continue de s'appliquer à l'outil `Agent`.
