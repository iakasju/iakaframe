# Affectation du modèle d'IA par acteur — projeter le binding dans le contrat déployé

> Cadrage 🔵 Gandalf, 2026-09-02. Dépôt : `iakaframe` (CLI Node + bindings).
> Déclencheur de l'étape suivante : validation de cette instruction par le décideur.

## Problème

La couche **binding** décide le modèle par persona (invariant **I3** : `{runner, model, tools}`
vivent là, et nulle part ailleurs). **Rien ne projette cette décision.** Trois constats mesurés
avant rédaction :

1. `renderAgentContract` (`cli/src/lib/generate-agents.js:59-72`) assemble un frontmatter d'ordre
   fixe `name, description, tools?, skills?, guardrails` — **`model` n'y figure pas**.
2. `modelForPersona` **n'existe nulle part** dans le CLI, alors que le commentaire de sa jumelle
   la cite comme référence : *« --- tools : resolution DEPUIS LE BINDING (miroir de
   modelForPersona) »* (`generate-agents.js:40`). La fonction a été prévue, jamais écrite.
3. Aucun des **10** contrats déployés `~/.claude/agents/*.md` ne porte de ligne `model:`
   (vérifié : `grep '^model:'` ne rend rien ; chaque fichier porte `name`, `description`, `tools`,
   `skills`, `guardrails`, dans cet ordre).

Conséquence : **les dix sous-agents héritent tous du modèle de la session**. L'affectation
opus/sonnet écrite dans `bindings/iakaframe-claude-default.md` est décorative — un `sonnet` inscrit
au binding ne coûte rien de moins qu'un `opus`, et un cadrage lancé sous une session `sonnet` tourne
sous `sonnet` quoi qu'en dise le canon.

## Faits vérifiés sur le web (obligation de sourcing — mesuré le 2026-09-02)

Le comportement du champ `model:` d'un sous-agent Claude Code **n'a pas été deviné**. Source :
documentation officielle, page *Subagents* (`code.claude.com/docs/en/sub-agents`) et page
*Model configuration* (`code.claude.com/docs/en/model-config`).

**F1 — valeurs acceptées.** Table « Supported frontmatter fields », verbatim :

> `model` | No | Model to use: `sonnet`, `opus`, `haiku`, `fable`, a full model ID such as
> `claude-opus-5`, or `inherit`. When you omit it, Claude Code picks the model in the subagent
> model order

et section « Choose a model », verbatim :

> * **Model alias**: use one of the available aliases: `sonnet`, `opus`, `haiku`, or `fable`
> * **Full model ID**: use a full model ID such as `claude-opus-5` or `claude-sonnet-5`. Accepts
>   the same values as the `--model` flag
> * **inherit**: use the same model as the main conversation

**F2 — `fable` EST une valeur valide.** L'arbitrage du décideur (« Fable 5 n'entre pas dans le
binding par défaut ») est donc une **politique**, pas une contrainte technique. Rien dans le runner
ne l'interdit ; c'est le canon qui s'en abstient. Une surcharge ponctuelle écrite à la main dans un
assignment produira un contrat valide.

**F3 — omettre la ligne n'est PAS `inherit`.** Distinction sourcée, et le brief de dispatch
l'assimilait à tort : `inherit` = *« use the same model as the main conversation »* ; **omettre** =
*« Claude Code picks the model in the subagent model order »*, ordre piloté par
`CLAUDE_CODE_SUBAGENT_MODEL` — la page *model-config* précise : *« The default model for subagents
[…] that aren't assigned a model another way. […] A per-invocation model or a definition's `model`
field, including `inherit`, takes precedence. »* Ligne omise = **exactement le comportement
d'aujourd'hui**, ce qui en fait le bon repli, mais on n'écrira nulle part que c'est « l'héritage du
modèle de session ».

**F4 — ordre officiel des champs.** La table les énumère dans l'ordre :
`name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers,
hooks, memory, background, effort, isolation, color, initialPrompt, experimental`. L'exemple
canonique de la page écrit :

> ```
> name: code-reviewer
> description: Reviews code for quality and best practices
> tools: Read, Glob, Grep
> model: sonnet
> ```

**`model` se place donc APRÈS `tools` et AVANT `skills`.** C'est un fait externe, pas un goût.

## Décision retenue

**D1 — `modelForPersona(binding, personaId)`, strictement symétrique de `toolsForPersona`.** Pure
(sans I/O), lit `bindingRows(binding.data)` (schéma convergé `assignments|bindings`), rend le
`model` de l'assignment homonyme, **`''`** si la persona est absente, si le champ manque, ou si le
binding est `null`. Elle ne filtre rien et ne connaît aucun runner : elle **lit**.

**D2 — position de `model` dans l'ordre fixe : entre `tools` et `skills`.**
Nouvel ordre : `name, description, tools?, model?, skills?, guardrails`.
Justification, dans cet ordre de force : (a) c'est l'ordre de la table officielle et de l'exemple
canonique (F4) — un lecteur humain retrouve la forme qu'il connaît ; (b) `model` rejoint `tools`
dans le **bloc des facettes d'exécution issues du binding**, avant `skills` (résolues depuis la
persona) et `guardrails` (persona) — la lecture du fichier suit alors les couches : identité →
exécution → canon ; (c) le placer en fin de frontmatter l'aurait isolé derrière `guardrails`, qui
n'est **pas** un champ Claude Code et reste volontairement en queue.

**D3 — modèle absent de l'assignment ⇒ ligne OMISE.** Symétrie exacte avec `tools` : liste vide →
ligne omise. Conséquence sourcée par F3 : le sous-agent retombe sur l'ordre de résolution du runner
— c'est-à-dire **le comportement actuel, inchangé**. Aucune valeur n'est inventée, et surtout on
n'écrit **pas** `inherit` en repli : ce serait poser une décision (« calque-toi sur la session »)
là où le canon n'en a pris aucune. `inherit` reste disponible comme **valeur explicite** du binding
si le décideur veut un jour ce comportement-là ; il ne sera jamais un défaut implicite.

**D4 — `runner !== 'claude-code'` ⇒ ligne OMISE, et le filtre vit dans `generateAgent`.**
`bindings/iakaframe-ollama-default.md` porte `qwen3.5:9b`, `gemma4:e4b`, `qwen2.5-coder:14b` :
aucune n'est une valeur valide au sens de F1. Les projeter fabriquerait *un contrat faux mais
d'apparence complète* — le binding Ollama a déjà tranché ce cas pour `tools`, et sa raison est
reprise telle quelle : **« Un champ absent est plus honnête qu'un champ plausible. »**
Le filtre **ne descend pas dans `modelForPersona`** (qui resterait mal nommée et cesserait d'être
le miroir de `toolsForPersona`) et **ne monte pas dans `renderAgentContract`** (qui doit rester bête
et pur). Il vit dans `generateAgent`, seule fonction qui **projette** un canon vers un contrat
Claude Code. Concrètement : `generateAgent` lit `runnerForPersona`/le champ `runner` de
l'assignment, et ne transmet `model` que s'il vaut `claude-code`.

**D5 — aucune allowlist de valeurs.** Le rendu projette la chaîne du binding verbatim. Motif :
(a) la liste des alias bouge côté runner (`fable`, `best`, `opusplan`, `sonnet[1m]`… sont apparus
au fil de l'eau) — une table codée serait périmée par construction et redeviendrait le
`kits/*/MODELES.md` qu'on a déjà démonté ; (b) une allowlist **interdirait** mécaniquement ce que
l'arbitrage veut seulement **ne pas poser par défaut**. `fable` doit rester **écrivable à la main**
sur un assignment, pour un travail lourd et rare, sans qu'aucune ligne de code ne le bénisse. Le
prix assumé — une faute de frappe dans le binding produit un contrat au modèle inconnu — est couvert
par CA-9 (relecture des dix fichiers déployés) et par `agents generate --check`.

**D6 — quoting.** Le binding écrit `model: "opus"` ; `parseScalar` retire les guillemets et
`renderScalar` ne re-quote pas un mot plein. Le contrat déployé portera donc **`model: opus`**, sans
guillemets, comme `tools`. Attendu, pas une dérive.

## Arbitrage remonté au décideur — à trancher AVANT le dev

**A-1 — la parité cross-repo avec `iakaFrameGUI`.** Ce point n'était pas dans le brief de dispatch
et il est structurant ; il n'est **pas** tranché ici.

Ce qui est mesuré : les 10 goldens `cli/test/fixtures/agents-golden/*.md` sont **vendorés
byte-à-byte** dans `iakaFrameGUI/packages/core/__tests__/fixtures/agents-golden/`, et la GUI compare
ce golden au rendu de **son** sérialiseur, `serializeAgentContract`
(`packages/core/src/frontmatter.ts:475-498`) — qui n'émet **pas** `model`. Et ce n'est pas un oubli :
la GUI porte l'invariant **G-5**, écrit en tête de son adaptateur
(`packages/core/src/adapters/claudeCode.ts:11-12`) — *« Team PURE en entrée : aucun `runner`/`model`
n'est lu ni émis (G-5). Le `model` du frontmatter subagent est OMIS (liaison run-time = Cockpit). »*
Elle possède d'ailleurs déjà son `modelForPersona` (`packages/core/src/binding.ts:199`) : c'est de
là que vient le commentaire orphelin du CLI. **La GUI a délibérément choisi de ne pas projeter le
modèle ; le CLI s'apprête à faire l'inverse.**

Trois postures :

- **P-A — livrer côté CLI, déclarer la dérive, nommer le successeur *(recommandée)*.** Régénérer les
  10 goldens, **ne pas re-vendorer**, et inscrire au backlog un lot GUI qui rouvrira G-5 devant le
  décideur (« la forge doit-elle émettre le modèle, ou reste-t-il une liaison run-time du
  Cockpit ? »). Coût réel et borné : `iakaframe vendor-check` gagne **10 lignes de dérive**. Ce coût
  est petit parce que le vendorage réel **est déjà en dérive massive** — la recette de la garde le
  déclare noir sur blanc (`cli/test/vendor-check.test.js:8-10` : *« le vendorage reel est massivement
  en derive, § 12.2 »*) et travaille sur un **miroir synthétique**, si bien que la suite de tests du
  CLI **reste verte** quoi qu'il arrive au vendorage réel. Aucune barrière n'est franchie en douce.
- **P-B — lot élargi aux deux dépôts au même commit logique.** Honnête sur la parité, mais il rouvre
  G-5 « en passant », ce qui est précisément le *tant qu'on y est* que la méthode interdit ; et il
  double le lot.
- **P-C — porter le modèle hors du frontmatter.** Ne répond pas au besoin : Claude Code ne lit
  l'affectation d'un sous-agent que là.

> Le dev **ne démarre pas** sans le choix du décideur sur A-1. Les étapes ci-dessous sont écrites
> pour **P-A** ; sous P-B, l'étape 6 devient un volet GUI complet.

## Périmètre

- **Inclus** :
  - `modelForPersona` dans `cli/src/lib/generate-agents.js` (D1) ;
  - le champ `model` dans `renderAgentContract`, à la position D2, omis si vide (D3) ;
  - le filtre de runner dans `generateAgent` (D4) ;
  - les tests unitaires correspondants + la mise à jour du golden **inline** de
    `cli/test/generate-agents.test.js` ;
  - la régénération des 10 goldens figés + de leur `sha256` ;
  - le redéploiement des contrats et sa vérification.
- **Exclu — et la liste est fermée** :
  - **I3 n'est pas rouvert** : le binding reste le seul endroit où le modèle est décidé ; aucune
    persona ne gagne de champ `model`.
  - `models/suggestions.json` : **intouché**. C'est l'étage des *suggestions par `roleKey`*, distinct
    de l'étage *affectation par `personaId`* (D3 du canon). Ne pas confondre les deux.
  - **Les affectations opus/sonnet elles-mêmes** ne sont pas rebattues. Ce lot rend effectif ce qui
    est écrit ; le décideur arbitrera **ensuite**, sur un lot séparé, s'il faut changer le casting.
  - **Le corps des bindings n'est pas amendé.** `bindings/iakaframe-claude-default.md` est **vendoré
    en copie** vers la GUI : toucher sa prose ajouterait une 11ᵉ ligne de dérive pour un texte qui
    n'est pas devenu faux. Si le décideur veut y ajouter une note, c'est un geste séparé et assumé.
  - **`cli/src/commands/models.js` n'est pas refactoré** — voir Risques R-3.
  - Aucun fichier du dépôt `iakaFrameGUI` (sous P-A).

## Étapes d'implémentation

1. **Écrire `modelForPersona`** dans `cli/src/lib/generate-agents.js`, immédiatement sous
   `toolsForPersona`, et **corriger le commentaire orphelin de la ligne 40** : il annonce un miroir
   qui n'existait pas — après ce lot, il dit vrai. Rendre `''` pour binding absent, persona absente,
   ou champ manquant.
2. **Ajouter le champ `model`** dans `renderAgentContract`, **entre** l'entrée `tools` et l'entrée
   `skills` du tableau `fields` : `model` non vide → `{ key: 'model', kind: 'scalar', value }` ;
   vide ou absent → `undefined` (ignoré par `buildDocument`, donc **ligne omise**). La signature
   devient `renderAgentContract({ id, description, tools, model, skills, guardrails, body })`.
3. **Câbler le filtre de runner dans `generateAgent`** (D4) : résoudre le `runner` de l'assignment et
   ne passer `model` à `renderAgentContract` que si `runner === 'claude-code'`. Un assignment sans
   `runner` déclaré est traité comme **non-claude** (abstention plutôt que supposition).
4. **Tests unitaires** dans `cli/test/generate-agents.test.js` — au minimum :
   - `modelForPersona` rend `opus` pour `gandalf`, `sonnet` pour `gimli` sur le binding défaut ;
   - `modelForPersona` rend `''` pour une persona inconnue et pour `binding = null` ;
   - `renderAgentContract` place `model` **entre** `tools` et `skills` (assertion sur
     l'enchaînement `tools: …\nmodel: …\nskills: […]`) ;
   - `model` vide/absent ⇒ **aucune ligne** `^model:`, et enchaînement direct `tools` → `skills` ;
   - `model` sans `tools` ⇒ enchaînement `description` → `model` (pas de trou) ;
   - sur le binding **Ollama**, `generateAgent` n'émet **aucune** ligne `model` (D4) ;
   - mise à jour du **golden inline** du premier test (l'attendu littéral gagne sa ligne `model`).
5. **Régénérer les goldens figés** : `node cli/scripts/gen-agents-golden.mjs` — 10 fichiers réécrits,
   `sha256` de l'en-tête recalculé. `cli/test/parite-generateurs.test.js` doit repasser **sans être
   modifié** ; s'il faut le toucher, c'est que le rendu a dérivé au-delà de l'attendu.
6. **Déclarer la dérive de vendorage** (P-A) : inscrire au `BACKLOG.md` du dépôt un successeur nommé
   — *« G-5 : la forge émet-elle le modèle ? »* — citant `claudeCode.ts:11-12` et
   `frontmatter.ts:475-498`, et le nombre de lignes de dérive constaté par `vendor-check`.
7. **Redéployer et vérifier** (recette pinnée, § Recette).

## Recette — commandes PINNÉES (piège de la racine périmée)

**`iakaframe <verbe>` sur le `PATH` exécute la racine publiée, pas ce checkout** ; `libraryRoot()`
remonte depuis le **`cwd`** et peut retomber sur un autre arbre. Toute mesure de ce lot **doit**
désigner explicitement le checkout, sinon elle teste du code mort. Le pin se fait par
`IAKAFRAME_HOME` (première priorité après `--root`, `library.js:47-49`) **et** par le chemin absolu
du script :

```sh
CK=/Users/sjupin/work/iakaframe          # le checkout mesuré, nommé une fois

cd "$CK/cli" && npm test                  # node --test — la suite du CLI
node "$CK/cli/scripts/gen-agents-golden.mjs"          # script-relatif : déjà pinné par son chemin
IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" agents generate --global
IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" agents generate --global --check --json
IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" vendor-check --root "$CK" --json
grep -c '^model:' ~/.claude/agents/*.md
```

Si le lot est vérifié depuis un checkout extrait (`git archive`), remplacer `CK` par le chemin de
l'extraction — **les cinq commandes suivent alors la même racine**, ce qui est tout l'objet du pin.

## Fichiers concernés

- `cli/src/lib/generate-agents.js` — **cœur du lot** : ajout de `modelForPersona` (sous
  `toolsForPersona`), correction du commentaire l.40, champ `model` dans `renderAgentContract`
  (entre `tools` et `skills`), filtre de runner dans `generateAgent`.
- `cli/test/generate-agents.test.js` — golden inline mis à jour + ~7 tests neufs.
- `cli/test/fixtures/agents-golden/*.md` — **10 fichiers régénérés** (jamais édités à la main :
  l'en-tête le dit, et le `sha256` le prouve).
- `BACKLOG.md` — inscription du successeur G-5 (étape 6, posture P-A).
- **Non modifiés, et c'est le sujet** : `bindings/*.md`, `library/personas/*.md`,
  `models/suggestions.json`, `cli/test/parite-generateurs.test.js`,
  `cli/test/fixtures/kit.iakaframe-claude.golden.md` (vérifié : ce golden **n'embarque aucun contrat
  d'agent**, il n'est donc pas touché).

## Risques

- **R-1 — le golden est un cliquet bilatéral, et il va mordre.** C'est sa fonction. *Mitigation* :
  régénérer par le script, jamais à la main ; ne pas re-vendorer sous P-A ; nommer la dérive
  (étape 6) au lieu de la laisser s'ajouter en silence à une dérive déjà massive.
- **R-2 — une valeur fausse dans le binding passe sans bruit** (D5, pas d'allowlist). Un
  `model: sonnnet` produirait un contrat syntaxiquement valide et fonctionnellement cassé.
  *Mitigation* : CA-9 exige la **relecture des dix valeurs déployées**, pas un simple compte ; et
  `agents generate --check` rend la dérive détectable après coup.
- **R-3 — un second lecteur du modèle subsiste.** `cli/src/commands/models.js:124-131` lit déjà
  `binding.data.assignments` **en ligne**, et — nuance mesurée — via `toRows(...assignments)` et non
  `bindingRows`, donc **il ignore le schéma alternatif `bindings:`**. Ce lot crée le résolveur
  unique sans l'y brancher : deux chemins de lecture du même fait coexisteront.
  *Mitigation* : ne **pas** le refactorer ici (hors périmètre, et ce serait un lot de convergence à
  part entière), mais l'**inscrire nommément** au backlog dans le même geste que l'étape 6 —
  *« `models.js` lit le modèle sans passer par `modelForPersona` »*. Un défaut nommé n'est pas un
  défaut caché.
- **R-4 — la recette mesure le mauvais arbre.** *Mitigation* : § Recette, `IAKAFRAME_HOME` + chemins
  absolus, sur **toutes** les commandes, y compris celles qui « ont l'air » locales.
- **R-5 — le corps des contrats est altéré au redéploiement.** *Mitigation* : `verbatimBody` n'est
  pas touché par ce lot, et CA-10 le prouve par comparaison au canon.

## Critères d'acceptation

Rendu, résolveur, format :

- [ ] **CA-1** — `modelForPersona(loadDefaultBinding(REPO), 'gandalf') === 'opus'` et
      `… 'gimli') === 'sonnet'`.
- [ ] **CA-2** — `modelForPersona(binding, 'inconnu') === ''` **et** `modelForPersona(null, 'gandalf') === ''`.
- [ ] **CA-3** — `renderAgentContract` avec `tools`, `model`, `skills` non vides produit
      l'enchaînement **exact** `tools: …\nmodel: …\nskills: […]\nguardrails: […]`.
- [ ] **CA-4** — `model` vide, `''`, ou absent ⇒ **aucune** ligne `^model:` dans la sortie, et
      enchaînement direct `tools:` → `skills:`.
- [ ] **CA-5** — `model` fourni **sans** `tools` ⇒ enchaînement `description:` → `model:`.
- [ ] **CA-6** — `generateAgent` sur `bindings/iakaframe-ollama-default.md` n'émet **aucune** ligne
      `^model:` pour les 10 personas (D4). Aucun `qwen`, `gemma` ou `coder` n'apparaît dans un
      contrat rendu.
- [ ] **CA-7** — `cd cli && npm test` sort en **0** ; le compte de tests est **strictement supérieur**
      à celui d'avant le lot, **aucun test supprimé**.
- [ ] **CA-8** — après `node cli/scripts/gen-agents-golden.mjs`,
      `cli/test/parite-generateurs.test.js` passe **sans qu'une seule de ses lignes ait été
      modifiée** (parité + garde `sha256`).

Contrats déployés — la preuve du besoin, **persona par persona** :

- [ ] **CA-9** — après `agents generate --global` pinné, `grep '^model:' ~/.claude/agents/*.md` rend
      **10 lignes**, et leurs valeurs sont **relues une à une** :
      `odin: opus` · `aragorn: opus` · `gandalf: opus` · `feanor: opus` ·
      `gimli: sonnet` · `legolas: sonnet` · `charon: sonnet` · `helm: sonnet` · `loki: sonnet` ·
      `nathalie: sonnet`. Un compte de 10 **sans** relecture des valeurs ne vaut pas CA-9.
- [ ] **CA-10** — dans **chacun** des 10 fichiers, la ligne `model:` est en **position 5**,
      immédiatement **après** `tools:` (l.4) et **avant** `skills:` (l.6) — les dix contrats portent
      aujourd'hui `tools` **et** `skills`, la position est donc déterminée pour tous.
- [ ] **CA-11** — **aucun** des 10 contrats ne porte `fable` (arbitrage du décideur), ni `inherit`
      (D3), ni de valeur hors de F1.
- [ ] **CA-12** — le **corps** des 10 contrats est inchangé : pour chaque persona, le contrat
      déployé se termine par `verbatimBody(library/personas/<id>.md)`. Le lot ne transforme que le
      frontmatter.
- [ ] **CA-13** — `agents generate --global --check --json` rend `ok:true, drift:0` **après**
      redéploiement (et rendait `drift:10` juste avant : le filet anti-dérive a bien vu passer le
      changement).

Déclaration honnête de ce que le lot casse :

- [ ] **CA-14** — `vendor-check --root <CK> --json` est exécuté **et sa sortie citée** dans le
      rapport de remise : nombre de lignes de dérive **avant** et **après** le lot. L'écart attendu
      est de **+10** (famille `goldens`). Un écart différent est un fait à expliquer, pas à arrondir.
- [ ] **CA-15** — le successeur **G-5** et le successeur **`models.js`** (R-3) sont inscrits au
      `BACKLOG.md`, chacun avec ses références en `fichier:ligne`.

## Estimation (jalon P1→P2)

- **Équivalent jour-homme : 0,5 j** (≈ 3 à 4 h). Décomposition : code ~30 min (trois gestes courts
  dans un seul fichier) ; tests ~1 h ; régénération + vérification des goldens ~30 min ;
  redéploiement + relecture des 10 contrats + `vendor-check` avant/après ~45 min ; backlog et
  remise ~30 min.
- **Complexité : faible. Risque : moyen.** Le code est trivial — quatre lignes utiles. Ce qui porte
  le risque est ailleurs : le rendu est **verrouillé par un golden à cliquet bilatéral cross-repo**,
  et le lot le fait mordre **volontairement**. La difficulté n'est pas d'écrire, c'est de **ne pas
  réparer en passant** ce que le cliquet révèle côté GUI.
- **Inconnues susceptibles de faire glisser l'estimation** :
  1. **A-1.** Si le décideur choisit **P-B** au lieu de P-A, le lot passe à **1,5 – 2 j** : il faut
     rouvrir G-5, modifier `serializeAgentContract`, l'adaptateur, les tests GUI, re-vendorer les 82
     fixtures et rejouer deux suites dans deux dépôts.
  2. **Champ `runner` absent d'un assignment.** Le binding défaut le porte partout ; un binding tiers
     pourrait l'omettre. D4 tranche par l'abstention, mais si le décideur veut l'inverse (défaut
     `claude-code`), c'est un aller-retour de cadrage — sans impact sur la charge de dev.
  3. **Compte de dérive du vendorage.** Le « +10 » attendu suppose que les 10 lignes `goldens` sont
     aujourd'hui **conformes**. Le fichier de recette déclare le vendorage réel « massivement en
     dérive » : si elles l'étaient déjà, l'écart mesuré sera plus petit — CA-14 le dira, et ce sera
     un **constat**, pas un échec.
