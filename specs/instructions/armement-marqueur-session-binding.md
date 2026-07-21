# Armement du marqueur de session sur le chemin réel (binding `SessionStart`)

> **Lot correctif** — referme un **trou de périmètre** de `canon-projet-connaissance-produit.md`
> (Lot A, mergé `48828a1`). Le mécanisme de rattrapage livré est **correct mais inerte** : rien ne
> l'arme jamais sur le câblage par défaut.

## 0. Outillage du cadrage — à savoir pour lire les chiffres

**`Bash` INDISPONIBLE pour ce cadrage.** Mesures faites en **lecture de source** (`Read`, `Grep`,
`Glob`) et en **vérification web** pour le contrat de hook. **Aucun chiffre de suite de tests ni de
`vendor-check` n'a été exécuté ici** : les valeurs de non-régression du § 6 sont **reprises du gate
Legolas du jour** et sont un **état de départ à re-mesurer** par l'exécutant, qui a `Bash`.

---

## 1. Le défaut, en une phrase

`open --project` **arme** le marqueur de dette de clôture ; le **seul appelant automatique** d'`open`
ne passe **jamais** `--project`. Donc aucune dette n'est jamais armée, donc **le rattrapage n'a
jamais lieu** — alors que la règle 3 du décideur (*« si une session se ferme sans rituel, on reprend
le rituel à la reprise »*) est **réputée tenue** et **écrite dans le contrat du coordinateur**
(`library/personas/aragorn.md:65` : « rattrapage automatique de la clôture différée. Aragorn n'a rien
à déclencher à la main. »). **Cette phrase est aujourd'hui fausse.** Ce lot la rend vraie.

Chaîne vérifiée en source :

| Maillon | Fichier | État |
|---|---|---|
| Armement | `cli/src/commands/open.js:54-60` | ✅ correct — mais **conditionné à `values.project`** |
| Rattrapage | `cli/src/lib/cadence.js:118-127` | ✅ correct — **conditionné à un marqueur `pending`** |
| Déclencheur réel | `cli/bindings/claude-code/session-start.mjs:28` | ❌ `['open']` — **`--project` absent** |

---

## 2. Ce qui a été mesuré (et ce que ça corrige dans le brief)

**M-1 — Le cwd d'un hook n'est PAS garanti.** La doc officielle ne garantit **aucun** répertoire
courant pour un hook `command` ; elle documente en revanche (a) le champ **`cwd` du payload JSON sur
stdin** et (b) la variable **`CLAUDE_PROJECT_DIR`** = racine du projet, posée par Claude Code pour
chaque hook. Payload `SessionStart` : `session_id`, `transcript_path`, `cwd`, `hook_event_name`,
`source` (+ `model`, `agent_type`, `session_title` optionnels).
**Conséquence directe : `--project .` (qui s'appuierait sur `process.cwd()`) est ÉCARTÉ.**

**M-2 — Un défaut connu existe sur les variables d'env de hooks** (env vides/`unknown` dans certaines
versions). → **jamais une source unique** : un empilement de sources, première non vide gagnante.

**M-3 — Le binding ne lit pas stdin du tout** aujourd'hui (41 lignes, `spawnSync` sec). Il **jette**
le seul canal où le runner déclare son contexte.

**M-4 — FAIT DU BRIEF INFIRMÉ : le binding n'est ni vendoré ni copié.**
- `vendor-check` compte « **1 binding** » = `bindings/iakaframe-claude-default.md` (le **markdown**
  de binding des personas, `cli/src/lib/vendor.js:90-94`) — **pas** `session-start.mjs`.
- Aucune copie de `session-start.mjs` nulle part : les seules occurrences sont un test, son README et
  `docs/commandes.md`. `frames/releases/StefFrame2/` ne contient **pas** `cli/bindings/`.
- `~/.claude/hooks/` est **vide** sur cette machine ; le README prescrit un **chemin absolu** dans
  `settings.json` (`cli/bindings/claude-code/README.md:46`).
→ **Impact vendorage du lot : NUL.** Et **aucun redéploiement** : le correctif est actif à la
prochaine session, le hook pointant sur le fichier du dépôt.

**M-5 — Aucun autre appelant d'`open`** que ce binding (confirmé : `cli/src/index.js:160` = dispatch,
le reste = tests/doc). Legolas a raison.

**M-6 — Le cœur a DÉJÀ la notion de « projet = répertoire courant »** : `snapshot` fait
`projectPath: values.path || process.cwd()` (`cli/src/commands/snapshot.js:186`). Ce n'est donc pas
une notion neuve — mais elle vit dans une commande **qui écrit**, pas dans `open`.

**M-7 — Le dépôt `iakaframe` n'a PAS de `specs/canon/`.** Le test bout-en-bout exige donc un **projet
fixture** ; et sur ce dépôt même, le comportement attendu est le **saut gracieux**.

**M-8 — Incohérence de doc constatée** : `open.js:19` annonce « Lecture seule : n'écrit ni ne crée
rien » alors que `open.js:21-23` décrit l'armement du marqueur. À corriger dans le lot.

---

## 3. Arbitrage de doctrine — « mince » survit-il à `--project` ? (AR-1)

C'est **le** point du lot. Trois options réellement distinctes :

| | Où vit la connaissance du répertoire | Diff | Verdict |
|---|---|---|---|
| **A** | Le **cœur** : `open` déduit le projet de son `process.cwd()` | binding : 0 ligne | **ÉCARTÉE** |
| **B** | Le **binding** lit le contexte déclaré par le runner et le passe en `--project <dir>` | binding : ~20 lignes ; cœur : 0 | **RECOMMANDÉE** |
| **C** | `--project auto` : mot-clé passé par le binding, résolution dans le cœur | binding : 1 token ; cœur : + résolution cwd | Écartée |

**Pourquoi A est écartée — et c'est M-1 qui tranche, pas une préférence esthétique.** Sous Claude
Code, le `process.cwd()` du hook **n'est pas contractuel** : le cœur déduirait le projet d'une valeur
que le runner ne promet pas. On échangerait un mécanisme *inerte* contre un mécanisme *qui vise
parfois à côté* — pire, car silencieux. S'ajoute qu'un `open` nu, lancé de n'importe où, acquerrait
un **effet de bord d'écriture** (armement) sur une commande annoncée en lecture seule.

**Pourquoi C est écartée.** Elle déplace la résolution dans le cœur sans résoudre M-1 (même
`process.cwd()` non garanti) et fait entrer dans le cœur un vocabulaire (`auto`) qui n'existe que
pour un runner.

**La ligne de doctrine, à graver dans l'en-tête du binding :**

> **Le binding fournit le CONTEXTE ; le cœur porte le JUGEMENT.**

Passer `cwd` **n'est pas de la détection** : c'est **relayer ce que le runner déclare de lui-même** —
exactement ce que « le SEUL endroit qui connaît Claude Code » a pour raison d'être. Le **jugement**
(« ce répertoire est-il un projet à canon ? ») **reste dans le cœur** et **n'y bouge pas d'une
ligne** : `projectCanonExists` (`open.js:56`) reste le seul juge. Le binding **n'a le droit
d'implémenter aucune heuristique de projet** — ni remontée d'arborescence, ni recherche de `.git`, ni
lecture de `specs/`. **Cette interdiction est un critère de recette (C-8), pas un conseil.** Tant
qu'elle tient, « mince » tient : le binding reste un **relais**, il gagne un **canal d'entrée**, pas
une logique.

Les trois autres propriétés sont **inchangées et opposables** : optionnel (le canon marche sans lui),
non bloquant (`exit 0` inconditionnel), en parallèle (ajoute, ne remplace pas).

---

## 4. Ce qu'il faut faire

**Un seul fichier de production : `cli/bindings/claude-code/session-start.mjs`.**

1. **Lire le payload `SessionStart` sur stdin**, en **strictement non bloquant** :
   `if (process.stdin.isTTY) → sauter` (sinon la vérification manuelle du README **pendrait**) ;
   `readFileSync(0, 'utf8')` sous `try/catch` ; `JSON.parse` sous `try/catch`. Toute anomalie → objet
   vide, jamais d'exception.
2. **Résoudre le répertoire de projet**, première valeur non vide gagnante (M-2) :
   `process.env.CLAUDE_PROJECT_DIR` → `payload.cwd` → `process.cwd()`.
   **`CLAUDE_PROJECT_DIR` en premier est délibéré** : sa sémantique est *racine du projet*, or le
   canon vit en `<racine>/specs/canon/` ; `payload.cwd` peut être un **sous-répertoire** de session,
   où `projectCanonHome` ne trouverait rien. Passer un **chemin absolu résolu**, jamais `.`.
3. **Invoquer `['open', '--project', dir]`** au lieu de `['open']`.
4. **Dégradation : `open` NU, pas le silence.** Si la résolution échoue ou rend une valeur inutile,
   le binding invoque `open` **sans** `--project` et injecte quand même le canon portefeuille. On ne
   perd **jamais** le canon global à cause du canon projet.
5. **Corriger l'en-tête du binding** : y inscrire la ligne de doctrine du § 3 et l'interdiction
   d'heuristique, pour que le prochain lecteur ne re-pose pas la question.

**Documentation (même lot)** : `cli/bindings/claude-code/README.md` (le hook arme aussi le marqueur ;
la propriété « mince » telle que redéfinie), `docs/commandes.md:258-261`, et la correction du `USAGE`
de `cli/src/commands/open.js:19` (M-8) — « lecture seule **sauf armement du marqueur sous
`--project`** ».

---

## 5. Critères d'acceptation

Tests dans `cli/test/open.test.js`. Aucun n'écrit dans le vrai `~/.iaka/` : `IAKA_MEMORY_HOME` sur
tmpdir, projet fixture sous tmpdir.

**Nominal**

- **C-1** — Hook lancé avec `CLAUDE_PROJECT_DIR = P` (P portant `specs/canon/PRODUIT.md`) :
  `additionalContext` contient le canon **portefeuille** ET le contenu de `PRODUIT.md`.
- **C-2** — Après C-1, `sessionPath(memoryHome, P)` **existe** et porte `pending: true`.
  *(« marqueur armé -> 1 fichier(s) » sur le chemin **binding**, plus seulement manuel.)*
- **C-3 — LE CRITÈRE CENTRAL, BOUT-EN-BOUT.** Enchaîner, **sans jamais appeler `open --project` à la
  main** : (1) exécuter le **hook** dans P ; (2) `runProjectCadence({ projectPath: P, reason:
  'reprise' })`. Attendu : `triggered: true`, `mode: 'rattrapage'`, et `formatProjectCadence` rend
  « rattrapage : clôture différée exécutée ». **Ce test échoue sur `48828a1` et passe après le
  correctif** — c'est la définition du lot.
- **C-4** — Sans `CLAUDE_PROJECT_DIR`, avec payload stdin `{"cwd": P, ...}` : même résultat que C-1
  et C-2 (la 2ᵉ source fonctionne seule).

**Défaut / dégradation**

- **C-5 — cwd hors projet** (tmpdir nu, sans `specs/canon/`) : le canon **portefeuille** est bien
  injecté ; **aucun** `specs/canon/` n'est créé dans ce répertoire ; **aucun** fichier de marqueur.
  *(Tient C-11 du lot A sur le chemin câblé — sinon on sèmerait des `specs/canon/` partout.)*
- **C-6 — Reprise sans dette** : `runProjectCadence(reason:'reprise')` sur un projet sans marqueur
  pendant rend `skipped: 'aucune-dette'` — **inchangé**.
- **C-7 — Non-blocage, quoi qu'il arrive** : `exit 0` et jamais de pendaison, avec (a) stdin fermé,
  (b) `stdio: 'ignore'`, (c) stdin non-JSON, (d) payload JSON sans `cwd`, (e) `CLAUDE_PROJECT_DIR`
  vide, (f) `CLAUDE_PROJECT_DIR` pointant sur un chemin inexistant, (g) CLI absente. Dans (a)–(f), le
  canon portefeuille reste injecté (§ 4.4).
- **C-8 — Garde de doctrine (test de source).** Le source du binding ne contient **aucune** remontée
  d'arborescence ni sonde de projet : interdits `..`, `readdirSync`, `.git`, `specs`. Le seul juge du
  « est-ce un projet » reste le cœur.
- **C-9 — Le cœur reste agnostique** : le test existant `open.test.js:183-190` (aucun symbole runner
  dans `lib/open.js` / `commands/open.js`) **passe sans modification**. Si le lot oblige à l'assouplir,
  **c'est que l'arbitrage du § 3 a été trahi** — arrêter et remonter.

---

## 6. Non-régression (re-mesurer AVANT de commencer, puis après)

- `node cli/src/index.js vendor-check --root /Users/sjupin/work/iakaframe` → `OK - 17 copies + 4
  derivees`. **`--root` désigne le canon, pas le miroir.** Impact attendu du lot : **nul** (M-4).
- Suite CLI : baseline `417 / 416 pass / 0 fail / 1 skipped`, **+ les tests ci-dessus**, 0 fail.
- `principleIds` **reste à 18** — aucun principe ajouté.
- `cli/src/lib/memory.js` **non modifié** ; `TARGETS` **non élargi** ;
  `cadence.close_on` **reste `['pause','version']`** — `reprise` n'y entre **jamais** (le rattrapage
  est un geste distinct, `cadence.js:75-81`).
- `cli/src/commands/open.js`, `lib/open.js`, `lib/projectSession.js`, `lib/cadence.js` :
  **aucun changement de comportement** (seul le `USAGE` de `open.js` est corrigé).
- **Hors périmètre** : Lot B (détection de contradiction) et Lot C.

---

## 7. Délégable / geste humain

| Geste | Nature |
|---|---|
| Binding + tests C-1..C-9 + doc (README, `docs/commandes.md`, `USAGE`) | **Délégable** (⚒️ Gimli) |
| Re-mesure `vendor-check` + suite CLI | **Délégable**, vérification humaine attendue |
| **Arbitrage AR-1 (§ 3) et ordre des sources (§ 4.2)** | **Geste humain — décideur** |
| Vérification **en session réelle** (ouvrir une session Claude Code dans un projet à canon et constater le marqueur armé) | **Geste humain** — aucun test ne remplace le vrai runner |
| Activation/édition de `~/.claude/settings.json` | **Geste humain** (un agent n'y touche pas) |

---

## 8. Estimation

| | Équivalent j-h | Complexité / risque |
|---|---|---|
| **Ce lot** | **0,5 j-h** (0,25 code, 0,25 tests + doc) | **Faible.** ~20 lignes dans un fichier de 41, cœur intact, zéro impact vendorage. |

**Le lot est bien petit — la mesure le confirme, il n'est pas plus gros qu'annoncé.** Le coût réel
est dans l'**arbitrage** (§ 3), pas dans le code.

**Inconnues susceptibles de le faire glisser :**
1. **Le comportement réel du runner** — le contrat de hook est vérifié en doc, pas sur cette machine
   (pas de `Bash` au cadrage). Si `CLAUDE_PROJECT_DIR` **et** le payload sont vides dans la version
   installée, le repli `process.cwd()` devient le chemin nominal : **+0,25 j-h** de diagnostic.
2. **Sous-répertoire de session** : si le décideur travaille couramment depuis un sous-dossier et que
   `CLAUDE_PROJECT_DIR` manque, le canon n'est pas trouvé. La remontée d'arborescence est **exclue du
   binding** (C-8) ; la mettre **dans le cœur** serait un **lot séparé, ~0,5 j-h**.

---

## 9. Ce que je laisse au décideur

1. **AR-1 — l'arbitrage de doctrine (§ 3).** Je recommande **B** : le binding relaie le contexte, le
   cœur garde le jugement. C'est ta décision, pas la mienne.
2. **L'ordre des sources (§ 4.2)** : `CLAUDE_PROJECT_DIR` avant `payload.cwd`. Si tu préfères
   *« exactement le répertoire de la session »* à *« la racine du projet »*, l'ordre s'inverse.
3. **La remontée d'arborescence** (inconnue 2) : hors périmètre ici. Lot séparé si le cas se présente
   réellement.

## Sources

- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) (payload `SessionStart`,
  absence de garantie sur le cwd d'un hook `command`, `${CLAUDE_PROJECT_DIR}`)
- [Environment variables — Claude Code Docs](https://code.claude.com/docs/en/env-vars)
- [anthropics/claude-code#9567 — hook env vars empty](https://github.com/anthropics/claude-code/issues/9567)
  (motif de l'empilement de sources)
