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

**Comparaison LITTÉRALE, et c'est un choix — pas un oubli** *(noté le 2026-09-02, à la réalisation)*.
Le filtre compare `runner === 'claude-code'` **à la lettre**, sans passer par `normalizeRunner`
(`cli/src/lib/vocab.js`, employé par `go.js`). Conséquence : un binding tiers qui écrirait l'alias
`runner: claude` tomberait en **abstention** — aucune ligne `model`. C'est **la direction de repli
que D4 choisit déjà** (« un assignment sans `runner` déclaré est traité comme non-claude »), donc le
comportement est cohérent, pas surprenant. On l'écrit pour que ce soit **su** : le jour où un binding
tiers emploie l'alias, le remède est de brancher `normalizeRunner`, pas de chercher un bug.

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

**D7 — une seule couture de résolution.** `generateAgent` résout le modèle en **un point unique et
nommé**. Ce lot n'y met que le défaut du binding ; le lot suivant y branche la surcharge projet
**sans rouvrir la fonction**. Détail à l'étape 3.

> **Suite cadrée** : `specs/instructions/surcharge-modele-par-projet.md` (surcharge explicite par
> commande, persistée dans `iakaframe.json`, reprise à la session suivante). Ce lot-ci en est le
> **prérequis** : il pose le défaut de frame, l'autre pose la surcharge par-dessus.

## Arbitrage A-1 — TRANCHÉ par le décideur le 2026-09-02

> ### ✅ DÉCISION : **P-D**
> **Décideur : Stéphane. Date : 2026-09-02. Énoncé : « P-D […] ok ».** Décision prise **avant** la
> réalisation, et **confirmée par elle** : le lot a été livré sous P-D (`iakaframe` 2e93881,
> `iakaFrameGUI` 7ee3d57), suites vertes des deux côtés, `vendor-check` à `drift: 0` avant **comme**
> après.
>
> **Ce lot n'attend donc plus rien.** Les options P-A, P-B et P-C ci-dessous sont conservées
> **comme trace** — elles disent ce qui a été pesé et pourquoi ça a été écarté, ce qui reste utile
> le jour où quelqu'un voudra rouvrir la question. Elles ne sont **plus des propositions**.

**A-1 — la parité cross-repo avec `iakaFrameGUI`.** Ce point n'était pas dans le brief de dispatch
et il est structurant. *(Rédaction d'origine : « il n'est pas tranché ici » — il l'est depuis, voir
l'encart ci-dessus.)*

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

**⚠️ A-1 A ÉTÉ REFORMULÉ le 2026-09-02**, après deux mesures faites au cadrage du lot 2
(`surcharge-modele-par-projet.md`). La première rédaction opposait deux doctrines ; la mesure montre
qu'elles ne s'opposent pas. Les postures P-A/P-B/P-C sont **conservées et datées** ci-dessous, mais
une quatrième, **moins chère et sans conflit doctrinal**, est désormais recommandée.

**Mesure 1 — G-5 contraint l'ADAPTATEUR, pas le SÉRIALISEUR.** L'invariant est écrit en tête de
`claudeCode.ts`, l'adaptateur qui fabrique un kit **depuis une team pure**. Il dit : cette
fabrication-là n'émet pas de modèle. Il **ne dit pas** que `serializeAgentContract`
(`frontmatter.ts:475`) serait interdit d'en **savoir écrire un**. Une **capacité** n'est pas une
**politique** : donner au sérialiseur un champ `model?` optionnel, que l'adaptateur continue de ne
jamais renseigner, laisse G-5 **intact et vérifiable**.

**Mesure 2 — le test de parité GUI construit le contrat, il ne le recopie pas.**
`__tests__/parite-generateurs.test.ts:20` importe `renderAgentContract` **et** `toolsForPersona`, et
recompose les 10 contrats depuis les fixtures (personas + binding) avant de comparer au golden. Or
la GUI **possède déjà `modelForPersona`** (`binding.ts:199`), écrite et non branchée — exactement la
jumelle que le CLI n'a jamais écrite. Restaurer la parité, c'est donc **brancher une fonction qui
existe déjà** dans un test qui appelle déjà sa sœur, pas porter une fonctionnalité.

- **P-D — capacité optionnelle côté GUI, G-5 non rouvert, parité rétablie — ✅ RETENUE
  (décideur, 2026-09-02) et LIVRÉE.**

  > **🛑 RECTIFICATION DU 2026-09-02 — cette posture s'est contredite elle-même, et c'est réparé
  > ici.** La première rédaction disait « `serializeAgentContract` **et `renderAgentContract`**
  > gagnent un `model?` » **et** « `claudeCode.ts` n'est pas touché ». Les deux ne peuvent pas être
  > vrais : `renderAgentContract` **est défini dans `claudeCode.ts`**. J'avais désigné le fichier
  > là où je voulais désigner **la fonction de forge**. Défaut relevé à la réalisation ; la règle
  > exacte suit.

  **Ce qui PEUT être touché** — `serializeAgentContract` (`frontmatter.ts`), `AgentContractInput`
  et `renderAgentContract` (`claudeCode.ts`) gagnent un `model?` optionnel, émis entre `tools` et
  `skills`, **omis si vide**, mêmes règles qu'ici. Dans `renderAgentContract`, `model` est un
  **passe-plat** : la fonction ne le résout pas et n'en invente aucun.

  **Ce qui ne DOIT PAS l'être** — **`renderAgent`** (`claudeCode.ts`), la fonction de **forge**,
  celle qui part d'une **team pure**. **C'est là que G-5 se tient**, et nulle part ailleurs :
  `renderAgentContract` *sait* désormais écrire un `model`, `renderAgent` **ne lui en passe
  aucun**, donc l'arbre `.claude/` fabriqué depuis une team pure reste **sans `model`**. La preuve
  attendue est celle-là, et elle est mesurable : les tests G-5 d'`adapters.test.ts` passent **sans
  avoir été modifiés**.

  L'alternative — faire appeler `serializeAgentContract` directement par le test de parité pour
  laisser `claudeCode.ts` byte-intact — est **écartée** : elle sauve la lettre et perd le fond, en
  cessant de tester la fonction que la forge emploie réellement. Une parité qui ne mesure plus le
  chemin de production n'est plus une parité.

  Le test de parité passe `modelForPersona(binding, id)`, les 10 goldens régénérés sont
  re-vendorés, **les deux suites repassent au vert**. Coût estimé : **+2 h**, dans le dépôt frère.
  Ce que ça achète : aucune dérive de vendorage ajoutée, aucun successeur doctrinal à traîner, et
  le cliquet bilatéral **continue de protéger** au lieu d'être contourné.
- **P-A — livrer côté CLI seul, déclarer la dérive, nommer le successeur** *(recommandée au premier
  cadrage ; conservée)*. Régénérer les 10 goldens, **ne pas re-vendorer**, inscrire un successeur
  G-5 au backlog. Coût : `vendor-check` gagnerait **10 lignes de dérive** — et, **mesure du
  2026-09-02**, ces 10 lignes partiraient de **zéro**, pas d'un fond déjà dégradé (voir R-1). La
  suite CLI resterait verte (elle mesure un miroir synthétique). *Pourquoi elle n'est plus
  recommandée* : elle paie une dette pour éviter un conflit **qui n'existe pas** (mesure 1), elle
  laisse le cliquet cross-repo aveugle sur le champ le plus neuf du contrat — et le coût réel est
  **plus élevé** qu'annoncé au premier cadrage, puisqu'elle salirait un vendorage **propre**.
- **P-B — lot élargi aux deux dépôts, en rouvrant G-5.** Écartée : la mesure 1 montre qu'il n'y a
  **rien à rouvrir**. P-D en est la version qui ne touche pas à la doctrine.
- **P-C — porter le modèle hors du frontmatter.** Écartée : Claude Code ne lit l'affectation d'un
  sous-agent que là (F1).

> **Lecture des étapes sous P-D (la posture retenue).** Les étapes ci-dessous ont été rédigées
> pour P-A et **restent valides telles quelles**, à une substitution près : **l'étape 6** (déclarer
> la dérive, inscrire un successeur doctrinal G-5) est **remplacée** par le volet GUI décrit
> ci-dessus — `model?` en passe-plat, `renderAgent` intact, goldens re-vendorés. Et **CA-14 se lit
> en conséquence : zéro ligne de dérive ajoutée**, `drift: 0` avant comme après.
>
> *Il n'y a plus de successeur doctrinal à inscrire au backlog pour G-5 : P-D ne l'a pas rouvert.
> Les deux successeurs qui subsistent sont `models.js` (R-3) et le commentaire trompeur de
> `vendor-check.test.js` (R-1).*

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
   **Couture obligatoire (D7)** : `generateAgent` résout le modèle en **un seul endroit**, dans une
   variable locale nommée (`const model = …`), et **n'inline pas** l'appel dans l'objet passé au
   rendu. Ce n'est pas un goût de style : le lot 2 (`surcharge-modele-par-projet.md`) **substitue le
   résolveur à ce point-là et à aucun autre**. Un appel inliné, ou deux appels, obligeraient à
   ré-ouvrir cette fonction — c'est-à-dire à écrire deux fois la même résolution.
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
5bis. **Régénérer la vitrine — TROISIÈME cliquet, oublié au premier cadrage.**
   `methode-de-travail.html` porte une zone `CODE_BLOCKS` qui **contient les contrats rendus**, et
   `cli/test/vitrine-methode.test.js` la **régénère en mémoire pour la comparer au disque** — « la
   ZONE **EST** le golden » (`vitrine-methode.test.js:4-7`). Elle rougit donc à **tout** changement
   de format de contrat, exactement comme les deux autres. Remède : **le script prescrit**,
   `node cli/scripts/gen-methode-vitrine.mjs`, **jamais une édition à la main** — la zone est
   générée, l'éditer serait recopier une dérivée. Attendu : **+10 lignes**, une par persona.
   *Sans cette étape, CA-7 (`npm test` vert) est inatteignable.*
6. **Volet GUI — sous P-D, la posture retenue** *(remplace l'étape 6 d'origine)* : `model?`
   optionnel dans `serializeAgentContract`, `AgentContractInput` et `renderAgentContract` (passe-plat)
   ; **`renderAgent` intact** ; test de parité branché sur `modelForPersona(binding, id)` (déjà
   écrite, `binding.ts:199`) ; **re-vendorer les 10 goldens**. Preuve attendue : CA-8ter.
   > *Étape 6 d'origine, conservée comme trace — inapplicable sous P-D* : « Déclarer la dérive de
   > vendorage (P-A) : inscrire au `BACKLOG.md` un successeur nommé — *G-5 : la forge émet-elle le
   > modèle ?* — et le nombre de lignes de dérive constaté. » **P-D n'ayant pas rouvert G-5, ce
   > successeur n'a pas lieu d'être** ; ne subsistent que ceux de R-1 et R-3.
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
- `methode-de-travail.html` — **ajouté le 2026-09-02, manquant au premier cadrage.** Zone
  `CODE_BLOCKS` régénérée par `cli/scripts/gen-methode-vitrine.mjs` (+10 lignes). C'est le
  **troisième cliquet** sur le format de contrat, aux côtés du golden de parité et du golden
  cross-repo : `cli/test/vitrine-methode.test.js` compare la zone **régénérée en mémoire** à celle
  **lue sur disque**. Je l'avais manqué en ne cherchant que les fixtures ; un golden **peut vivre
  dans une zone balisée d'un fichier de doc**, pas seulement dans `test/fixtures/`.
- `BACKLOG.md` — inscription du successeur `models.js` (R-3) et du successeur « commentaire
  trompeur de `vendor-check.test.js` » (R-1). **Plus de successeur G-5** : P-D, retenue par le
  décideur le 2026-09-02, ne l'a pas rouvert.
- **Dépôt frère `iakaFrameGUI` (volet P-D, étape 6)** — `packages/core/src/frontmatter.ts`
  (`serializeAgentContract`), `packages/core/src/adapters/claudeCode.ts` (`AgentContractInput` +
  `renderAgentContract` **seulement** — `renderAgent` intact),
  `packages/core/__tests__/parite-generateurs.test.ts`, et les 10 goldens vendorés.
- **Non modifiés, et c'est le sujet** : `bindings/*.md`, `library/personas/*.md`,
  `models/suggestions.json`, `cli/test/parite-generateurs.test.js`,
  `cli/test/fixtures/kit.iakaframe-claude.golden.md` (vérifié : ce golden **n'embarque aucun contrat
  d'agent**, il n'est donc pas touché).

## Risques

- **R-1 — le format de contrat est tenu par TROIS cliquets, et ils vont tous mordre.** C'est leur
  fonction : le golden de parité CLI, le golden **vendoré** cross-repo, et la zone `CODE_BLOCKS` de
  `methode-de-travail.html` (étape 5bis). *Mitigation* : régénérer chacun **par son script**, jamais
  à la main.

  > **🛑 PRÉMISSE CORRIGÉE LE 2026-09-02 — le vendorage N'EST PAS « massivement en dérive ».**
  > Cette instruction affirmait le contraire, ici et dans son estimation, sur la foi du commentaire
  > de `cli/test/vendor-check.test.js:8-10` (*« le vendorage reel est massivement en derive,
  > § 12.2 »*). **Mesure du 2026-09-02, avant le lot : `vendor-check` → `drift: 0`, `clean`,
  > 82 copies + 4 dérivées. Après le lot : `drift: 0` également.** Corroboration indépendante que
  > j'ai faite moi-même : les goldens `gandalf.md` des **deux** dépôts portent le même
  > `sha256 329ab353…` et la même ligne `model: opus`.
  >
  > Ce que ça change : le coût de P-A était **sous-estimé** (salir un vendorage propre coûte plus
  > que d'en salir un sale), et l'inconnue 3 de l'estimation tombe — la ligne de base est connue et
  > vaut **0**.
  >
  > Ce que ça révèle : **j'ai pris un commentaire de code pour une mesure.** Un commentaire décrit
  > l'état du monde **au jour où il a été écrit** ; il ne se re-mesure pas tout seul. C'est
  > exactement le défaut que ce dépôt traque ailleurs sous le nom de « gardes muettes ».
  > **Successeur à inscrire au backlog** (et oui, il le mérite) : *« le commentaire de
  > `cli/test/vendor-check.test.js:8-10` déclare un vendorage massivement en dérive, alors qu'il est
  > propre — une phrase fausse dans le fichier même de la garde »*. Il mérite le backlog pour la
  > raison qui rend ce genre de phrase coûteux : **elle a induit un cadrage en erreur**, et elle
  > continuera tant qu'elle sera lue. Sa correction est une ligne de commentaire ; son absence de
  > correction est un piège renouvelable.
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
- [ ] **CA-6** *(réécrit le 2026-09-02 — la première rédaction était intenable, voir l'encart)* —
      `generateAgent` sur `bindings/iakaframe-ollama-default.md` n'émet **aucune** ligne `^model:`
      pour les 10 personas (D4). Et **aucune des trois valeurs exactes** de ce binding —
      `qwen3.5:9b`, `gemma4:e4b`, `qwen2.5-coder:14b` — n'apparaît dans un contrat rendu.

      > **🛑 CA-6 A ÉTÉ RÉÉCRIT.** Il interdisait la présence des **fragments** `qwen`, `gemma` ou
      > **`coder`** dans un contrat rendu. Or **`coder` est un verbe français**, présent deux fois
      > dans le canon de Gimli — dont sa `description`, donc **dans le frontmatter même** du contrat
      > (`library/personas/gimli.md:4` : « lit l'instruction AVANT de coder », et `:48`). Le critère
      > était **inatteignable à la lettre**, quel que soit le code. Leçon de rédaction, et elle vaut
      > au-delà de ce lot : **un critère qui cherche un fragment de mot dans de la prose française
      > produira des faux positifs** ; on vérifie des **valeurs exactes**, pas des sous-chaînes.
      > Défaut relevé à la réalisation, où l'intention a été tenue en testant les trois valeurs.
- [ ] **CA-7** — `cd cli && npm test` sort en **0** ; le compte de tests est **strictement supérieur**
      à celui d'avant le lot, **aucun test supprimé**.
- [ ] **CA-8** — après `node cli/scripts/gen-agents-golden.mjs`,
      `cli/test/parite-generateurs.test.js` passe **sans qu'une seule de ses lignes ait été
      modifiée** (parité + garde `sha256`).
- [ ] **CA-8bis** *(ajouté le 2026-09-02 — troisième cliquet)* — après
      `node cli/scripts/gen-methode-vitrine.mjs`, `cli/test/vitrine-methode.test.js` passe **sans
      modification**, et le diff de `methode-de-travail.html` est de **+10 lignes exactement** (une
      par persona), **toutes dans la zone `CODE_BLOCKS`**. Une ligne hors zone = édition à la main,
      donc échec.
- [ ] **CA-8ter** *(sous P-D)* — les tests **G-5** d'`adapters.test.ts` (dépôt frère) passent **sans
      qu'une seule de leurs lignes ait été modifiée**, et l'arbre `.claude/` produit par la forge
      depuis une team pure ne porte **aucune** ligne `model:`. C'est **la** preuve que
      `renderAgent` n'a pas été touché.

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

- [ ] **CA-14** *(chiffres corrigés le 2026-09-02 sur mesure)* — `vendor-check --root <CK> --json`
      est exécuté **et sa sortie citée** dans le rapport de remise : dérive **avant** et **après** le
      lot. Ligne de base **mesurée : `drift: 0`** (82 copies + 4 dérivées, `clean`). Attendu **sous
      P-D : `drift: 0` après le lot** — la parité est rétablie, pas contournée. Sous P-A : `drift:
      10`. Un écart différent est un fait à expliquer, pas à arrondir.
- [ ] **CA-15** *(mis à jour le 2026-09-02 — A-1 tranché sur P-D)* — les successeurs **`models.js`**
      (R-3) et **« commentaire trompeur de `vendor-check.test.js` »** (R-1) sont inscrits au
      `BACKLOG.md`, chacun avec ses références en `fichier:ligne`. **Aucun successeur G-5** n'est
      inscrit : P-D ne l'a pas rouvert, et inscrire une question déjà close encombrerait le backlog
      d'une fausse dette.

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
  1. **A-1.** Sous **P-D** (recommandée), ajouter **+0,25 j** (≈ 2 h) : `model?` optionnel dans les
     deux rendus du cœur GUI, branchement de `modelForPersona` (déjà écrite) dans le test de parité,
     re-vendorage des 10 goldens, deux suites rejouées. Sous **P-B** (écartée), le lot passerait à
     **1,5 – 2 j** — c'est le coût de rouvrir G-5, et la mesure 1 montre qu'on n'a pas à le payer.
  2. **Champ `runner` absent d'un assignment.** Le binding défaut le porte partout ; un binding tiers
     pourrait l'omettre. D4 tranche par l'abstention, mais si le décideur veut l'inverse (défaut
     `claude-code`), c'est un aller-retour de cadrage — sans impact sur la charge de dev.
  3. ~~**Compte de dérive du vendorage.**~~ **INCONNUE LEVÉE le 2026-09-02** : la ligne de base est
     **mesurée**, `drift: 0` (cf. R-1). Il n'y a plus rien à supposer. *Ce que cette inconnue avait
     de mauvais : elle reposait sur un **commentaire de code** lu comme une mesure. Une inconnue
     honnête se lève en mesurant, pas en relisant.*
  4. **Le troisième cliquet** (`methode-de-travail.html`, étape 5bis) n'était pas au premier
     cadrage : **+15 min**, déjà intégrés au chiffre ci-dessus.
