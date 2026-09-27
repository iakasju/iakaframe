# Lancement d'une session Aragorn par Odin — une session Claude par dépôt

> **Amendée par `specs/instructions/prise-de-parole-odin-aragorn.md` (validé le 2026-09-27 — voir son
> § 4 « Lectures amendées »).** Lire cette instruction avec : **L-1** (D-L9 : après le lancement, Odin
> cède la place ; restitution d'un point d'Aragorn seulement sur demande explicite, verbatim, Q-P2) ;
> **L-2** (D-L10, étape 8 : la condition devient « session lancée dans un dépôt » ; section `iakastart`
> « 0. Déterminer la voix » ; « odin, … » ouvre un tour d'Odin en lecture seule, `odin` n'y déclenche
> pas `iakastart`) ; CA-L13 : premier tour sous `🟠 [NAONEDGE][Aragorn]`. Les lectures L-3 à L-6
> visent l'instruction mère. Le corps ci-dessous n'est pas réécrit.

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2), gate 🏹 Legolas.
> Cible : dépôt `iakaframe` — CLI (`cli/src/`), skills `iakaframe-odin`, `iakaframe-aragorn`,
> `iakastart`, persona `odin.md`, kit global Claude (`settings.example.json`, README).
> Statut : **créée le 2026-09-27 — validée par Stéphane le 2026-09-27 (Q-L1 accepté, Q-L2 oui).**
> **Instruction mère** : `specs/instructions/declaration-chantier-session.md` (chantier de session,
> régimes Odin / Équipe D-5, verbe portefeuille D-14, `selfInvoke` D-9). Celle-ci en **dépend** :
> à implémenter **après le Lot 1bis** de l'instruction mère ; recette **après son Lot 7**.
> Doc en français, code en anglais.

## 0. Outillage du cadrage

- Cadrage en lecture seule, sans `Bash` ; mesures par `Read`/`Grep`/`Glob` ; faits externes vérifiés
  sur la doc officielle Claude Code (sources en fin). Aucune suite de tests exécutée.
- Références mesurées sur le clone local (`HEAD` = `8b5f014`, après `577f81e`).

## 1. Mesures

| # | Fait mesuré | Où |
|---|---|---|
| L-M1 | **Un lanceur existe déjà** : `iakaframe go <projet> [--do "<tâche>"]` résout le projet sous la racine, puis lance `claude "<tâche>"` **inline** (même terminal, bloquant) ; le texte libre est assaini par remplacement de ``"`$;|&<>`` et des retours ligne. Il n'a ni `--agent`, ni nouveau terminal. | `cli/src/commands/go.js:14-21`, `:52-66`, `:101-103` |
| L-M2 | Résolution de la racine : `--root` > `IAKAFRAME_ROOT` > `C:\work` / `~/work` ; détection d'exécutable : `hasCmd`. | `cli/src/lib/root.js:6-11`, `cli/src/lib/which.js` |
| L-M3 | **Registre des verbes = source unique** : chaque `case` de `index.js` a une entrée dans `lib/verbes.js` et inversement ; un test fige **40** verbes distincts ; tout verbe `guideClaudeCode.generer:false` porte un motif ; les sorties `--json` passent par `lib/output.js` (enveloppe `ok`). | `cli/test/guard-verbes-registre.test.js:33-48`, `:91-94` ; `cli/test/guard-json-output.test.js:1-9` ; `cli/test/guard-json-couverture.test.js` |
| L-M4 | `iakastart` affiche le banner par `node C:\work\iakaframe\cli\src\index.js banner IAKAFRAME`, lit `iakaframe models --path <projet> --json`, et **ne spawne jamais** d'agent. Aucune règle pour une session dont l'agent principal n'est pas Odin. | `library/skills/iakastart/SKILL.md:27-33`, `:55`, `:114-124` |
| L-M5 | Gabarit d'ordre de mission d'Aragorn : ligne de durée **immédiatement** suivie de `# Ordre de mission — {agent} — {date}` (verrouillé par `duree-estimee-delegation.md` CA-2) ; le littéral de la ligne de durée apparaît **une** fois dans `odin.md` et `iakaframe-odin/SKILL.md` (CA-3). | `library/skills/iakaframe-aragorn/SKILL.md:63-70`, `specs/instructions/duree-estimee-delegation.md:320-325` |
| L-M6 | Les SKILL.md du domaine iakaframe (dont `iakastart`) sont reproduits dans la vitrine `methode-de-travail.html` et dans des goldens de skills : toute modification exige `gen-methode-vitrine.mjs` et `gen-skills-golden.mjs`. | `cli/scripts/gen-methode-vitrine.mjs:1-22`, `cli/scripts/gen-skills-golden.mjs` |

**Faits externes vérifiés (doc officielle, sept. 2026)** :
- `claude --agent <nom>` fixe l'agent **principal** de la session ; `claude "<prompt>"` démarre une
  session **interactive** avec un prompt initial ; `--name/-n` nomme la session (affiché dans le
  titre du terminal et `/resume` ; si le nom est pris par une autre session vivante, Claude Code
  applique une variante). Aucun drapeau de répertoire de travail : la session s'ouvre dans le
  **répertoire courant** du processus.
- Hooks : sur le thread principal d'une session `--agent aragorn`, `agent_type = "aragorn"` et **pas
  d'`agent_id`** (instruction mère, § 1).
- **Messagerie inter-sessions** : `ListAgents` liste les sessions locales joignables (dont celles
  d'autres terminaux) ; `SendMessage` envoie du texte par nom ; `notify_when_idle` (abonnement seul,
  sans message) demande **une** notification quand la session cible termine son tour ou se ferme ;
  **seul le thread principal** peut s'abonner, **même machine**, expiration **12 h**. Windows natif :
  messagerie ≥ **v2.1.234**, `notify_when_idle` ≥ **v2.1.236** des deux côtés. Un message d'une autre
  session **ne vaut jamais consentement**, ne peut répondre à aucune demande de permission et
  n'exécute aucune commande.
- **Permissions** : les règles sont évaluées `deny` → `ask` → `allow` ; syntaxe `Bash(iakaframe launch *)`
  et `PowerShell(iakaframe launch *)` (même forme que Bash). Le mode `bypassPermissions` **saute** les
  demandes ; `dontAsk` **refuse** ce qui demanderait ; en `auto`, un classifieur décide. Une règle
  `ask` n'impose donc une confirmation humaine qu'en modes **Manual (`default`)** et `acceptEdits`.

## Problème

Le décideur veut qu'un chantier dans un dépôt se mène dans **une session Claude dédiée à ce dépôt**,
Aragorn en agent principal (instruction mère, décision 4). Aujourd'hui, ouvrir cette session est un
geste manuel (ouvrir un terminal, se placer dans le dépôt, lancer `claude --agent aragorn`, recopier
la demande). Odin, au portefeuille, voit passer la demande mais ne peut que la décrire. Il faut
qu'Odin **propose** la session, et sur **confirmation humaine**, la **lance** avec l'ordre de mission,
puis en **suive** l'avancement.

## Décision retenue

**D-L1 — Qui déclenche, qui décide.** Odin (thread principal d'une session de rôle `odin` lancée au
portefeuille) identifie qu'une demande relève d'un dépôt — **demande explicite** (« lance une session
sur naonedge ») ou **interprétation** (le besoin exprimé est un chantier d'un dépôt donné). Il
**propose** alors, mot pour mot sur la structure :
« Je lance une session Aragorn dans `<dépôt>` pour prendre en charge ce chantier ? » suivi du résumé
de l'ordre de mission (durée estimée, demande). Si le dépôt est incertain, il **demande lequel**
avant de proposer. **Confirmation humaine obligatoire à chaque lancement** : une réponse affirmative
du décideur **à cette proposition précise** ; pas de confirmation générale, pas de lancement sur
simple interprétation. Refus ou silence → rien n'est lancé.

**D-L2 — Le lanceur : un verbe CLI dédié `iakaframe launch`** (plutôt qu'étendre `iakaframe go`).
Raisons : `go` lance `claude` **inline** avec un texte libre assaini par destruction de caractères
(L-M1), porte la sélection de runner et un brief, et devient **refusé aux agents** par l'instruction
mère (D-9 `selfInvoke`) ; un verbe dédié donne une surface **fermée** (pas de texte libre en ligne de
commande), une seule forme à reconnaître par le garde (D-14 mère) et par la règle `ask`, et se teste
en `--dry-run` sans ouvrir de terminal. `go` reste **inchangé**.

Syntaxe : `iakaframe launch <repo> --mission-file <fichier> [--root <chapeau>] [--dry-run] [--json]`.
L'agent lancé est **toujours** `aragorn` (pas d'option `--agent` : surface minimale).

**D-L3 — Résolution du dépôt.** `<repo>` = nom de dossier de 1ᵉʳ niveau sous la racine (L-M2) ou
chemin absolu. Nom contenant un séparateur ou `..` → `REPO_INVALID`. Dossier inexistant →
`REPO_UNKNOWN` ; dossier sans `.git` → `REPO_NOT_GIT` : dans les deux cas, **rien n'est lancé** et
l'indice propose `iakaframe onboard --path <chemin>` — Odin le **propose** au décideur (confirmation
**distincte**), jamais d'enchaînement automatique. Agent `aragorn` introuvable (ni
`<repo>/.claude/agents/aragorn.md`, ni `~/.claude/agents/aragorn.md`) → `AGENT_MISSING`, indice
`iakaframe agents --action fullteam --project <repo>`.

**D-L4 — L'ordre de mission : un fichier, référencé par le prompt initial.** Odin écrit l'ordre de
mission avec `Write` dans son scratchpad de session (à défaut, sous le répertoire temporaire), puis
le passe par `--mission-file`. Format **fermé**, validé par le CLI :
1. ligne 1 : la ligne de durée (`Durée estimée : ~<valeur>`, format de `methode-de-travail.md`
   § « Toute délégation annonce sa durée estimée » ; regex `^Durée estimée : ~\d{1,3}(?: ?- ?\d{1,3})? ?(?:s|min|h)$`)
   → sinon `MISSION_DURATION` ;
2. ligne 2 : `Chantier: <repo>`, résolue vers **le même** dépôt que `<repo>` → sinon
   `MISSION_CHANTIER` ;
3. puis la demande : un bloc `Demande du décideur (verbatim) :` suivi de ses mots **exacts**, et, le
   cas échéant, un bloc `Lecture d'Odin :` (son interprétation, **séparée** et signée — pas de
   ventriloquie) ; au moins une ligne non vide → sinon `MISSION_EMPTY` ;
4. **aucune** ligne (après `trim()`, casse ignorée) de la forme `chantier <x>` ou `odin-direct <x>`
   → sinon `MISSION_DIRECTIVE` ; taille ≤ 20 000 caractères → sinon `MISSION_TOO_LARGE`.
Le CLI **copie** le fichier validé vers `<os.tmpdir()>/iakaframe-missions/<AAAAMMJJ-HHMMSS>-<nom>.md`
(le scratchpad peut être purgé) ; chemin contenant autre chose que `[A-Za-z0-9_.:\\/~-]` →
`MISSION_PATH_UNSAFE`.
**Pourquoi un fichier et pas le texte dans la ligne de commande** : un texte multiligne libre traverse
mal `wt` (le `;` y sépare des sous-commandes), `Start-Process` et les règles de guillemets Windows ; le
fichier transmet l'ordre **octet pour octet**, sans assainissement destructeur (L-M1). Le prompt
initial reste conforme à la demande du décideur : il commence par `iakastart` puis désigne l'ordre de
mission (durée, chantier, demande).

**D-L5 — Prompt initial et nom de session.**
- Nom : `aragorn-<nom>` (`<nom>` = nom du dépôt en minuscules, tout caractère hors `[a-z0-9-]`
  remplacé par `-`).
- Prompt (une ligne, ASCII, jeu `[A-Za-z0-9 _.,:\\/~-]`, passé comme **un seul** argument) :
  `iakastart -- session Aragorn, chantier <nom>. Lis et execute l ordre de mission : <chemin copié>`.

**D-L6 — Ouverture du terminal (Windows, MVP).** Le CLI lance un **processus détaché** (`detached`,
`stdio: "ignore"`, `unref()`), avec des **tableaux d'arguments** (jamais `shell: true`) :
- **Windows Terminal présent** (`hasCmd("wt")`) : `wt -w new new-tab --title "Aragorn <nom>" -d <root>
  claude --agent aragorn --name aragorn-<nom> "<prompt>"` — **nouvelle fenêtre**, titre explicite,
  répertoire = racine du dépôt ;
- **repli** (pas de `wt`) : `powershell.exe -NoProfile -NonInteractive -Command Start-Process
  -FilePath claude -WorkingDirectory '<root>' -ArgumentList <args>` — nouvelle fenêtre console ; le
  prompt doit arriver comme **un** argument (guillemets gérés par le CLI, vérifiés en `--dry-run` et
  en recette) ;
- `claude` absent → `CLAUDE_MISSING` ;
- version de `claude` < 2.1.236 → **avertissement** `TRACKING_UNAVAILABLE` (le lancement a lieu ; le
  suivi par notification ne sera pas possible).
`--dry-run` : toutes les validations, la copie **non** effectuée, **aucun** processus lancé ; affiche
la commande exacte. Sortie humaine lisible ; `--json` via `lib/output.js` :
`{ ok:true, repo:{name,root}, session_name, launcher:"wt"|"powershell", mission_file, command, dry_run }`
ou `{ ok:false, error:{ code, message, hint } }` (exit 1, rien sur stderr).

**D-L7 — Garde de périmètre (renvoi à l'instruction mère).** `iakaframe launch` est un **verbe
portefeuille** (mère D-14) : autorisé au **thread principal de rôle `odin` d'une session lancée au
portefeuille**, un seul segment, clé = dépôt visé ; refusé partout ailleurs (sous-agent, session
d'équipe, session lancée dans un dépôt). Toute autre façon de lancer `claude` par un agent est
`DENY_SELF_INVOKE` (mère D-9). La session lancée est de rôle `team` : les lignes `chantier` /
`odin-direct` y sont **ignorées** (mère D-3), son chantier est fixé au lancement.

**D-L8 — Confirmation mécanique en plus du contrat.** `settings.example.json` ajoute
`permissions.ask` : `Bash(iakaframe launch *)` et `PowerShell(iakaframe launch *)` — le harnais
redemande au décideur, commande exacte sous les yeux, à chaque lancement. **Limite** : en
`bypassPermissions`, `auto` ou `dontAsk`, cette demande n'a pas lieu (fait externe, § 1) ; la
confirmation reste alors **contractuelle** (D-L1) — **→ Q-L1**.

**D-L9 — Suivi par Odin.** Après le lancement :
1. Odin annonce au décideur le nom de session `aragorn-<nom>` et la fenêtre ouverte ;
2. `ListAgents` jusqu'à voir la session (elle apparaît quand elle a lié sa boîte de réception ; si
   absente après quelques secondes, Odin le dit et réessaie **une** fois plus tard, sans boucle) ;
3. `SendMessage` vers `aragorn-<nom>` avec `notify_when_idle: true` **sans** message (abonnement
   seul, sans coût dans la session cible) ;
4. à la notification (fin de tour ou fermeture), Odin informe le décideur ; s'il demande un point à
   Aragorn par `SendMessage`, il **restitue la réponse verbatim sous le badge d'Aragorn** (règle de
   restitution en relais) ;
5. **Odin ne transmet jamais de validation** : un gate (instruction, jalon) se valide **dans le
   terminal de la session Aragorn**, par le décideur (un message inter-sessions ne vaut pas
   consentement) ;
6. messagerie indisponible (version) → Odin le signale et invite le décideur à suivre la fenêtre.

**D-L10 — Côté session Aragorn.** Le prompt initial déclenche `iakastart`, qui, **quand l'agent
principal de la session est `aragorn`** (et plus généralement ≠ Odin) :
- affiche le banner et le roster comme d'habitude ;
- ajoute la ligne `Session Aragorn — chantier : <dépôt> (fixé au lancement)` ;
- **n'applique pas** la posture portefeuille d'Odin (l'alias `odin` est sans effet dans cette
  session : le portefeuille vit dans la session Odin) ;
- **ne spawne toujours aucun agent** ; puis rend la main à Aragorn, qui lit le fichier de mission,
  **vérifie** que `Chantier:` désigne le dépôt de la session (sinon il s'arrête et le dit), et mène
  la demande **selon la méthode** (cadrage par Gandalf, validation par le décideur dans ce terminal,
  réalisation, qualité). Le lancement confirmé par le décideur **est** l'acte explicite qui démarre le
  travail (garde-fou d'`iakastart`).
Aragorn répond aux messages d'Odin (point d'avancement) et ne tape jamais `chantier` /
`odin-direct`.

**D-L11 — Plateformes.** MVP **Windows natif**. Sur macOS/Linux/WSL, `iakaframe launch` rend
`PLATFORM_UNSUPPORTED` (exit 1) **avec** la commande manuelle prête à coller dans `command` /
`hint` : `cd <root> && claude --agent aragorn --name aragorn-<nom> "<prompt>"` ; Odin la montre au
décideur. Le lancement automatique hors Windows est **exclu** (lot ultérieur).

## Périmètre

- **Inclus** :
  - verbe `iakaframe launch` : `cli/src/commands/launch.js` (E/S, spawn) + cœur pur
    `cli/src/lib/launch-plan.js` (`buildLaunchPlan` : résolution, validation de mission, nom,
    prompt, commande, erreurs) ; déclaration dans `cli/src/lib/verbes.js` (`ecriture: true`,
    `guideClaudeCode: { generer: false, motif: "lance un processus interactif dans un nouveau terminal ; reserve a Odin, sur confirmation" }`)
    et `case 'launch'` dans `cli/src/index.js` ;
  - tests `cli/test/launch.test.js` ; mise à jour **explicite** de l'assertion de compte de
    `cli/test/guard-verbes-registre.test.js:46-48` (40 → **41** verbes, libellé cité) et de la
    fixture `cli/test/fixtures/couverture-json.json` si la couverture `--json` l'exige ;
  - skills : `iakaframe-odin` (section « Lancer une session Aragorn »), `iakaframe-aragorn` (section
    « Session lancée par Odin »), `iakastart` (section « Session d'équipe ») ; persona `odin.md`
    (une puce d'obligation : confirmation à chaque lancement) ;
  - `kits/iakaframe-claude/global/settings.example.json` (`permissions.ask`, D-L8) et README du kit ;
  - régénérations : `gen-skills-golden.mjs`, `gen-agents-golden.mjs` (goldens `odin`),
    `gen-methode-vitrine.mjs`, `iakaframe agents --action generate` / `--check`.
- **Exclu** :
  - lancement automatique hors Windows (D-L11) ; onglet plutôt que fenêtre ; choix d'un autre agent
    que `aragorn` ;
  - enchaînement automatique `onboard` → `launch` (deux confirmations distinctes) ;
  - toute modification de `iakaframe go` ;
  - toute logique de garde (elle vit dans l'instruction mère : D-9, D-14) ;
  - suivi au-delà de `ListAgents`/`SendMessage`/`notify_when_idle` (tableau de bord, relance
    automatique, sessions sur d'autres machines) ;
  - le cadrage **métier** des chantiers lancés (ex. « publier les rapports des agents sur un topic » :
    un exemple de déclenchement, pas un sujet de ce lot) ;
  - re-vendorisation dans `iakaframegui` (autre dépôt).

## Étapes d'implémentation

Pré-requis : Lot 1bis de l'instruction mère commité (`PORTFOLIO_VERBS` contient `iakaframe launch`).

**Lot L1 — Cœur pur** (`feat(cli)`)
1. `cli/src/lib/launch-plan.js` : `buildLaunchPlan({ repoArg, missionText, root, platform, hasWt,
   hasClaude, claudeVersion, agentFiles, tmpdir, now })` → `{ ok, plan | error }` ; aucune E/S (les
   faits du disque et de l'environnement sont injectés). Codes d'erreur : `REPO_INVALID`,
   `REPO_UNKNOWN`, `REPO_NOT_GIT`, `AGENT_MISSING`, `MISSION_DURATION`, `MISSION_CHANTIER`,
   `MISSION_EMPTY`, `MISSION_DIRECTIVE`, `MISSION_TOO_LARGE`, `MISSION_PATH_UNSAFE`,
   `CLAUDE_MISSING`, `PLATFORM_UNSUPPORTED` ; avertissement `TRACKING_UNAVAILABLE`.
2. Tests unitaires (CA-L1 à CA-L5).

**Lot L2 — Verbe** (`feat(cli)`)
3. `cli/src/commands/launch.js` : lit le fichier de mission, collecte les faits, appelle
   `buildLaunchPlan`, copie la mission (sauf `--dry-run`), lance le processus détaché (D-L6),
   sort en texte ou `--json` via `lib/output.js`.
4. `verbes.js` + `index.js` ; tests `launch.test.js` bout-en-bout (CA-L6 à CA-L9) ; assertion de
   compte et fixture de couverture mises à jour.

**Lot L3 — Contrats, skills, kit** (`docs`)
5. `library/skills/iakaframe-odin/SKILL.md` : nouvelle section **« Lancer une session Aragorn »** :
   quand proposer (D-L1), phrase de proposition, confirmation à chaque lancement, écriture de l'ordre
   de mission (D-L4 : ligne de durée, `Chantier:`, demande verbatim + lecture d'Odin séparée),
   commande `iakaframe launch`, dépôt inconnu → proposer `onboard`, suivi (D-L9). ⚠️ Ne pas recopier
   le littéral de la ligne de durée (`duree-estimee-delegation.md` CA-3) : y renvoyer.
6. `library/personas/odin.md` : dans la section « Obligation — chantier déclaré » créée par
   l'instruction mère (étape 11), une puce : « chaque lancement de session Aragorn exige la
   confirmation explicite du décideur ; Odin ne transmet jamais de validation d'une session à
   l'autre ». (Ordre : cette étape **après** l'étape 11 de la mère ; si la mère n'est pas encore
   passée, remonter.)
7. `library/skills/iakaframe-aragorn/SKILL.md` : nouvelle section **« Session lancée par Odin »**
   (D-L10) : lire le fichier de mission, vérifier `Chantier:`, mener selon la méthode, gates
   validés dans ce terminal, répondre aux messages d'Odin. **Le gabarit d'ordre de mission
   (`:63-70`) reste intact** (L-M5).
8. `library/skills/iakastart/SKILL.md` : nouvelle section **« Session d'équipe (agent principal
   ≠ Odin) »** avant § Garde-fou (`:119`) (D-L10) ; § 5 Note alias (`:114-117`) : préciser que
   l'alias `odin` n'apporte la posture portefeuille **que** dans une session Odin.
9. `settings.example.json` : `permissions.ask` (D-L8) ; README du kit : le verbe, la règle `ask` et
   sa limite par mode.
10. Régénérations (L-M6) : `node cli/scripts/gen-skills-golden.mjs`,
    `node cli/scripts/gen-agents-golden.mjs`, `node cli/scripts/gen-methode-vitrine.mjs`, puis
    `iakaframe agents --action generate` et `--check` ; dérive `vendor-check` consignée.

**Lot L4 — Recette (décideur)** : CA-L12 à CA-L16, après le Lot 7 de l'instruction mère.

## Fichiers concernés

- `cli/src/lib/launch-plan.js` — **créé** (cœur pur).
- `cli/src/commands/launch.js` — **créé** (verbe).
- `cli/src/lib/verbes.js`, `cli/src/index.js` — déclaration et dispatch du verbe.
- `cli/test/launch.test.js` — **créé**.
- `cli/test/guard-verbes-registre.test.js` — assertion de compte 40 → 41 (seule modification).
- `cli/test/fixtures/couverture-json.json` — entrée `launch` si requise par la couverture `--json`.
- `library/skills/iakaframe-odin/SKILL.md`, `library/skills/iakaframe-aragorn/SKILL.md`,
  `library/skills/iakastart/SKILL.md` — sections neuves.
- `library/personas/odin.md` — une puce (après l'étape 11 de la mère).
- `kits/iakaframe-claude/global/settings.example.json`, `kits/iakaframe-claude/global/README.md`.
- Régénérés, jamais édités à la main : goldens de skills et d'agents, zone `CODE_BLOCKS` de
  `methode-de-travail.html`, contrats déployés.

## Risques

- **Guillemets Windows** (`wt` / `Start-Process`) : le prompt arrive coupé ou mal cité → jeu de
  caractères fermé (D-L5), tableaux d'arguments, `--dry-run` qui montre la commande, recette CA-L13
  et CA-L15 (repli).
- **`wt` lancé depuis l'outil `Bash`/`PowerShell` de Claude Code** ne rend pas la main ou n'ouvre pas
  de fenêtre → processus détaché + `unref()` ; recette CA-L13.
- **Confirmation humaine seulement contractuelle** en `bypassPermissions`/`auto`/`dontAsk` (D-L8)
  → Q-L1.
- **Session non visible par `ListAgents`** (version, démarrage lent) → Odin le dit, une seule
  nouvelle tentative, suivi manuel.
- **Directive injectée par l'ordre de mission** → refusée par le CLI (`MISSION_DIRECTIVE`) **et**
  ignorée par la session de rôle `team` (mère D-3).
- **Mission purgée** (répertoire temporaire nettoyé) avant lecture → Aragorn le signale ; Odin
  relance sur confirmation.
- **Prolifération de fenêtres** → une confirmation par lancement ; nom de session unique (variante
  automatique si déjà pris).
- **Compte de verbes figé dans un test** (L-M3) → modification d'assertion **explicite et citée**,
  pas de contournement.

## Critères d'acceptation

**Cœur pur (`launch.test.js`, `buildLaunchPlan`)**
- [ ] **CA-L1** Résolution : `naonedge` sous une racine fixture portant `naonedge/.git` → `root`
      correct ; chemin absolu valide → accepté ; `foo` absent → `REPO_UNKNOWN` avec indice
      `iakaframe onboard --path` ; dossier sans `.git` → `REPO_NOT_GIT` ; `../x` ou `a/b` →
      `REPO_INVALID`.
- [ ] **CA-L2** Mission : fichier conforme → `ok` ; ligne 1 absente ou `Durée estimée : 10 min`
      (sans `~`) → `MISSION_DURATION` ; ligne 2 absente ou `Chantier: autre` → `MISSION_CHANTIER` ;
      rien après la ligne 2 → `MISSION_EMPTY` ; une ligne seule `odin-direct naonedge`,
      `chantier naonedge` ou `CHANTIER naonedge` → `MISSION_DIRECTIVE` (la ligne 2
      `Chantier: naonedge`, avec deux-points, n'est **pas** une directive) ; 20 001 caractères →
      `MISSION_TOO_LARGE`.
- [ ] **CA-L3** Agent : ni `<repo>/.claude/agents/aragorn.md` ni `~/.claude/agents/aragorn.md` →
      `AGENT_MISSING` avec indice `iakaframe agents --action fullteam --project` ; l'un des deux
      présent → `ok`.
- [ ] **CA-L4** Commande (win32, `hasWt:true`) : argv exact `["-w","new","new-tab","--title",
      "Aragorn naonedge","-d",<root>,"claude","--agent","aragorn","--name","aragorn-naonedge",<prompt>]` ;
      `<prompt>` commence par `iakastart`, contient le chemin copié, respecte le jeu de caractères
      D-L5 ; `hasWt:false` → plan `powershell.exe` avec `Start-Process`, `-WorkingDirectory <root>`,
      `--agent aragorn` ; `hasClaude:false` → `CLAUDE_MISSING` ; `claudeVersion:"2.1.230"` →
      `ok` + avertissement `TRACKING_UNAVAILABLE` ; nom `Naonedge_Clients` → session
      `aragorn-naonedge-clients`.
- [ ] **CA-L5** Plateforme `linux`/`darwin` → `PLATFORM_UNSUPPORTED` avec la commande manuelle
      `cd <root> && claude --agent aragorn --name aragorn-<nom> "<prompt>"` ; chemin de copie hors
      jeu de caractères → `MISSION_PATH_UNSAFE`.

**Verbe (`launch.test.js`, `spawnSync` du CLI, `IAKAFRAME_ROOT` et `TMP`/`TEMP` redirigés)**
- [ ] **CA-L6** `iakaframe launch repoA --mission-file m.md --dry-run --json` → exit 0,
      `{ ok:true, repo, session_name:"aragorn-repoa", launcher, mission_file, command, dry_run:true }` ;
      **aucun** processus lancé (un faux `wt` placé en tête de `PATH`, qui écrirait un marqueur, n'est
      pas appelé) ; **aucune** copie écrite.
- [ ] **CA-L7** Chaque code d'erreur de CA-L1/L2/L3 via le CLI → exit 1, `{ ok:false, error:{code} }`
      sur stdout, **rien** sur stderr (règle C-JSON).
- [ ] **CA-L8** (win32, faux `wt` en tête de `PATH` qui enregistre son argv) sans `--dry-run` : le
      faux `wt` reçoit l'argv de CA-L4 ; la copie de mission existe sous
      `<tmp>/iakaframe-missions/` et son contenu est **identique** au fichier source. Même test sans
      `wt` avec un faux `powershell.exe` → argv `Start-Process` attendu.
- [ ] **CA-L9** Registre : `iakaframe --help` et `iakaframe commands --json` citent `launch` ; la
      garde G5a passe avec **41** verbes ; `guideClaudeCode.generer:false` porte un motif ; la source
      `cli/src/commands/launch.js` + `cli/src/lib/launch-plan.js` ne contient ni `iakaframe-sessions`,
      ni `-p`/`--print`/`--resume`/`--continue`, et contient `"--agent"` suivi de `"aragorn"` (test de
      source).

**Contrats et non-régression**
- [ ] **CA-L10** Les sections neuves existent : `grep -c 'Lancer une session Aragorn'
      library/skills/iakaframe-odin/SKILL.md` = 1 ; `grep -c 'Session lancée par Odin'
      library/skills/iakaframe-aragorn/SKILL.md` = 1 ; `grep -c "Session d'équipe"
      library/skills/iakastart/SKILL.md` ≥ 1 ; `duree-estimee-delegation.md` CA-2 et CA-3 restent
      vrais ; `settings.example.json` contient les deux règles `ask` de D-L8.
- [ ] **CA-L11** `npm test` dans `cli/` : 100 % vert après régénérations (goldens de skills et
      d'agents, vitrine), seule assertion modifiée = le compte de verbes G5a.

**Recette réelle (décideur, après le Lot 7 de la mère)**
- [ ] **CA-L12** Session Odin au portefeuille : « il faut que `naonedge` … » → Odin propose
      « Je lance une session Aragorn dans `naonedge` pour prendre en charge ce chantier ? » avec le
      résumé ; réponse « non » → **aucun** lancement.
- [ ] **CA-L13** Réponse « oui » → (mode Manual) le harnais demande l'autorisation pour
      `iakaframe launch naonedge …` ; accepter → une **nouvelle fenêtre** Windows Terminal titrée
      `Aragorn naonedge` s'ouvre dans `C:\work\naonedge` ; le premier tour affiche le banner, le
      roster, la ligne `Session Aragorn — chantier : naonedge`, puis Aragorn lit la mission et la
      mène selon la méthode ; le journal du garde montre `agent_type:"aragorn"` sans `agent_id`.
- [ ] **CA-L14** Odin voit `aragorn-naonedge` dans `ListAgents`, s'abonne (`notify_when_idle`), et
      reçoit la notification quand la session Aragorn termine son tour ; il en informe le décideur ;
      tout propos d'Aragorn relayé l'est verbatim sous le badge d'Aragorn.
- [ ] **CA-L15** `wt` masqué du `PATH` → le repli `Start-Process` ouvre une fenêtre console avec le
      même résultat que CA-L13.
- [ ] **CA-L16** Demande sur un dépôt inexistant `foo` → Odin propose `iakaframe onboard` (et rien
      d'autre) ; aucune fenêtre ne s'ouvre.

## Estimation (jalon P1→P2)

| | Équivalent j-h | Complexité / risque |
|---|---|---|
| Lot L1 — cœur pur + tests | 0,4 | moyenne (validation, guillemets) |
| Lot L2 — verbe + tests bout-en-bout + registre | 0,4 | moyenne (spawn détaché Windows) |
| Lot L3 — skills, persona, kit, régénérations | 0,45 | faible |
| **Total dev** | **≈ 1,25 j-h** + 0,25 recette humaine | **moyenne** |

**Inconnues susceptibles de faire glisser :**
1. **Citation du prompt par `wt` / `Start-Process`** — **+0,25 j-h** si un contournement est requis.
2. **Détachement du processus depuis l'outil shell de Claude Code** — **+0,25 j-h**.
3. **Visibilité de la session dans `ListAgents`** (versions installées) — sans impact de code.

## Questions ouvertes au décideur

- **Q-L1 — Mode de permission de ta session Odin.** La confirmation **mécanique** (règle `ask`,
  D-L8) n'a lieu qu'en mode Manual ou `acceptEdits`. En `bypassPermissions`/`auto`, elle
  devient **contractuelle seule** (Odin demande, tu réponds). Recommandé : **accepter** cette limite
  et garder la règle `ask` (elle protège dès que le mode le permet). Alternative : lancer la session
  Odin en mode Manual.
- **Q-L2 — Ordre de mission par fichier référencé** (D-L4) plutôt que le texte complet dans la ligne
  de commande. Recommandé : **oui** (fidélité octet pour octet, pas d'assainissement destructeur).
  Alternative : texte inline sur une seule ligne, assaini comme `iakaframe go` (perte de mise en
  forme et de caractères).

## Sources

- [CLI reference — Claude Code Docs](https://code.claude.com/docs/en/cli-reference) (`--agent`,
  `claude "query"`, `--name`)
- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) (`agent_type` en
  session `--agent`, `agent_id` seulement en sous-agent)
- [Message your other Claude Code sessions — Claude Code Docs](https://code.claude.com/docs/en/cross-session-messaging)
  (`ListAgents`, `SendMessage`, `notify_when_idle`, versions Windows, un message ne vaut pas
  consentement)
- [Configure permissions — Claude Code Docs](https://code.claude.com/docs/en/permissions) (ordre
  `deny`/`ask`/`allow`, règles `Bash(...)`/`PowerShell(...)`, effet des modes)
