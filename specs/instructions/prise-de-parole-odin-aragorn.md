# Prise de parole Odin / Aragorn — dans un dépôt, c'est Aragorn qui parle

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2), gate 🏹 Legolas.
> Cible : dépôt `iakaframe` — hook `identity-remind.mjs` (kit Claude global), cœur pur
> `guard-core.mjs`, personas `odin.md` / `aragorn.md`, skills `iakastart` / `iakaframe-odin` /
> `iakaframe-aragorn`, `methode-de-travail.md` § Identité, `kits/iakaframe-claude/global/CLAUDE.md`.
> Statut : **validé le 2026-09-27 par Stéphane** (créé le 2026-09-27) — questions tranchées :
> **Q-P1 = A** (contrat seul, garde inchangé), **Q-P2 = oui** (restitution sur demande explicite,
> verbatim), **Q-P3 = Odin par défaut** au portefeuille et hors dépôt (§ « Décisions du décideur »).
> **Complétée le 2026-09-28** par la décision **P-9** (chaîne de délégation visible d'Aragorn),
> **décidée par Stéphane le 2026-09-27** : étape 13 bis du Lot P3, CA-P15, estimation +0,1 j-h.
> **Nature : amendement** de deux instructions validées :
> - `specs/instructions/lancement-session-aragorn.md` (instruction sœur) — D-L9, D-L10, étape 8 ;
> - `specs/instructions/declaration-chantier-session.md` (instruction mère) — décision 4 (« secours »),
>   étapes 11-12 du Lot 6, § Messages ; et son Exclu `identity-remind.mjs` (`:447`), levé ici.
> Doc en français, code en anglais.

## 0. Pourquoi un fichier dédié plutôt qu'une section « Amendement » dans l'instruction sœur

1. L'amendement touche **trois** territoires : l'instruction sœur (D-L9, D-L10), l'instruction mère
   (secours par sous-agent, Lot 6, § Messages, et **son** Exclu sur `identity-remind.mjs`), et un
   sujet qu'aucune des deux ne traite (la voix du thread principal, le rappel d'identité, la 1ʳᵉ
   personne). L'écrire dans l'une laisserait l'autre muette ; une section « Amendement » dans la sœur
   amenderait la mère depuis sa fille.
2. Il a ses **propres lots, critères et estimation** : les fondre dans la sœur (validée, lots L1-L4)
   brouillerait le suivi des deux.
3. La traçabilité est assurée par une **note de renvoi** ajoutée en tête de chacune des deux
   instructions (§ Étapes, Lot P0). Les décisions validées des deux instructions ne sont **pas**
   réécrites ici : le § 4 « Lectures amendées » dit, point par point, ce qui change.

## 1. Outillage du cadrage

- Cadrage en lecture seule, sans `Bash` ; mesures par `Read`/`Grep`/`Glob` sur l'arbre de travail
  (HEAD `c862a14`, fichiers non suivis `chantier-state.mjs`, `chantier-remind.mjs`,
  `chantier-bind.mjs` présents : Lot 2/3 de la mère **en cours**). Aucune suite de tests exécutée.
- Fait externe vérifié sur la doc officielle des hooks (sources en fin).

## 2. Mesures

| # | Fait mesuré | Où |
|---|---|---|
| P-M1 | Le rappel d'identité injecté à **chaque** prompt est **fixe** et donne **Odin** en exemple (« pastille jaune puis [PORTEFEUILLE][Odin] ») ; il ne lit pas son entrée (`stdin`) et ignore le lieu de la session. Source et runtime sont identiques. | `kits/iakaframe-claude/global/hooks/identity-remind.mjs:6-13` ; `~/.claude/hooks/identity-remind.mjs:6-13` |
| P-M2 | Le garde bloquant d'identité ne vérifie que la **présence** d'un badge d'ouverture et de clôture, **pas** quel agent parle ; son exemple de commentaire est Odin. | `kits/iakaframe-claude/global/hooks/identity-guard.mjs:5-6`, `:101-107` ; `guard-core.mjs:46` (`verdictIdentity`) |
| P-M3 | La règle globale dit « vaut pour les agents personnifiés ET pour Claude principal (**Odin**) » : le thread principal est Odin **par défaut, partout**. | `kits/iakaframe-claude/global/CLAUDE.md:119-130` ; runtime `~/.claude/CLAUDE.md:118-129` |
| P-M4 | `iakastart` : déclenchée par `iakastart`, `iakaframe` **ou `odin`** ; aucune règle sur **qui** parle (badge) ; « `odin` conserve en plus sa posture portefeuille ». | `library/skills/iakastart/SKILL.md:4`, `:21-23`, `:114-117` ; `kits/iakaframe-claude/global/CLAUDE.md:56-72` |
| P-M5 | Odin « **délègue** la suite à l'Aragorn de l'équipe concernée » (sous-agent) et, pour switcher, « **va dans** `C:\work\<projet>`, briefe l'Aragorn cible ». | `library/skills/iakaframe-odin/SKILL.md:56-65` ; `library/personas/odin.md:62`, `:81-86` |
| P-M6 | Mère, décision 4 : « en **secours**, il délègue à un **sous-agent `aragorn`** après désignation `chantier <repo>` » ; D-6 règle 4 autorise la cible `aragorn` en régime Odin ; Lot 6 étapes 11-12 écrivent ce secours dans `odin.md` / `aragorn.md` ; § Messages propose « puis deleguer a aragorn ». | `declaration-chantier-session.md:118-122`, `:267-270`, `:511-523`, `:565-568` |
| P-M7 | Mère D-5 : une session lancée **sans** `--agent` dans un dépôt R garde le **rôle technique `odin`** (chez soi, gestes directs autorisés dans R) ; `mainRoleOf` ne regarde que `agent_type`. | `declaration-chantier-session.md:254-257` ; `guard-core.mjs:588-591` |
| P-M8 | `keyOf(abs)` rend `{kind: repo\|dir\|portefeuille\|hors, root, name}` (remontée `.git`, worktree → dépôt principal, racine `IAKAFRAME_ROOT` → `C:\work`). Fichier **non suivi** (Lot 2 de la mère en cours). | `kits/iakaframe-claude/global/hooks/chantier-state.mjs:89-92`, `:147-201` |
| P-M9 | Sœur D-L10 : `iakastart` ne change de comportement que « quand l'agent principal de la session est `aragorn` (et plus généralement ≠ Odin) » ; « l'alias `odin` est **sans effet** dans cette session ». D-L9.4 : Odin peut demander un point à Aragorn par `SendMessage` et le **restituer verbatim sous le badge d'Aragorn**. | `lancement-session-aragorn.md:146-172` |
| P-M10 | Personas : `aragorn.md` royaume figé `IAKAFRAME` en frontmatter ; son § Identité dit « royaume en MAJUSCULE » (= projet courant, méthode `:235-236`). Aucun texte ne dit qu'un agent parle **de lui-même** à la 1ʳᵉ personne ; la méthode ne le dit que pour le délégué d'une chaîne (étape 3). | `library/personas/aragorn.md:7`, `:170-175` ; `methode-de-travail.md:235-236`, `:306-313` |
| P-M11 | Dépôt réservoir `C:\work\iakaframe` : **pas** de pointeur `.iakaframe` (seuls `iakacockpit` et `iakaframegui` en portent un) → `iakastart` y retombe sur la frame default. `C:\work` n'est pas un dépôt git. | Glob `C:\work\*\.iakaframe` ; `library/skills/iakastart/SKILL.md:43-44` |
| P-M12 | `iakaframe go <projet>` lance `claude` avec pour répertoire de travail le dossier du projet (inline). | `cli/src/commands/go.js:101-103` |
| P-M13 | Aucun test ne lit le texte d'`identity-remind` ; les fixtures d'identité (`cli/test/fixtures/guard/*`, `guard-core.test.js:34-56`) utilisent un badge Odin comme **exemple de forme**, sans lien avec le lieu. | Grep `PORTEFEUILLE\]\[Odin` sur `cli/test/` |

**Faits externes vérifiés (doc officielle des hooks, sept. 2026)** :
- `CLAUDE_PROJECT_DIR` est posé dans l'environnement des hooks = « the project root where the session
  started » ; il **reste** à sa valeur si Claude entre dans une worktree en cours de session.
- Entrées communes : `session_id`, `cwd`, `transcript_path`, `hook_event_name`… ; `agent_type` est
  présent « when the session uses `--agent` or the hook fires inside a subagent ».
- `UserPromptSubmit` : le stdout texte (exit 0) est **ajouté comme contexte** visible par Claude ; un
  code de sortie ≠ 0 et ≠ 2 sans JSON valide = **erreur non bloquante** (le prompt passe, un avis
  d'erreur s'affiche).

## Problème

Le décideur veut que, **dans un dépôt**, son interlocuteur soit **Aragorn**, en direct, et qu'Odin
n'intervienne que **quand on l'appelle**. Aujourd'hui tout pousse dans l'autre sens : le thread
principal est Odin par défaut partout (P-M3), le rappel injecté à chaque prompt montre un badge Odin
(P-M1), et Odin passe par un **sous-agent** Aragorn, ce qui produit des chaînes Odin → Aragorn →
Odin (P-M5, P-M6). Enfin, rien n'oblige un agent à parler **de lui-même** à la première personne
(P-M10) : « Aragorn fait… » au lieu de « je ».

## Décision retenue

### Règles du décideur (2026-09-27 — décisions, non discutées ici)

| # | Règle |
|---|---|
| R1 | Une fois **volontairement entré** dans un dépôt, Aragorn répond directement, sans Odin. |
| R2 | Odin ne répond que sur **sollicitation directe** (« odin, … ») ou sur un `iakastart` **au portefeuille** (`C:\work`). |
| R3 | Après un `iakastart` **dans un dépôt**, c'est Aragorn qui répond en direct (banner + roster sous `🟠 [ROYAUME][Aragorn]`). |
| R4 | Quand Odin appelle un Aragorn sur un dépôt, il **cède sa place**, il ne délègue pas : pas de chaîne Odin → Aragorn → Odin, pas de sous-agent Aragorn ; le thread principal endosse Aragorn. |
| R5 | Donc, dans un dépôt, Aragorn est **toujours** celui qui parle sous son badge. |
| R6 | Tout Aragorn parle de lui-même à la **première personne** (« je », « ma mission »), jamais « Aragorn fait… ». Coexiste avec la restitution en relais (on ne reformule jamais **le travail d'un autre agent** en « je »). |
| — | Aragorn continue de **déléguer** aux autres agents (Gandalf, Gimli, Legolas…) avec chaîne de badges et restitution verbatim. |

### Décisions du décideur sur les questions de cadrage (2026-09-27)

| # | Décision | Effet dans cette instruction |
|---|---|---|
| Q-P1 | **A — contrat seul.** Le garde n'applique pas R4/R5 mécaniquement ; aucun code de garde rouvert ; **pas** de 3ᵉ amendement de la mère. | Le contrat interdit le sous-agent `aragorn` (P-6) ; le garde commité (mère D-5, D-6 règle 4) reste tel quel ; les messages du garde et le rappel `chantier-remind` perdent l'option « déléguer à aragorn » (L-5). L'écart rôle technique `odin` / voix Aragorn est **toléré** (P-2, § Risques). |
| Q-P2 | **Oui** : Odin peut restituer un point d'Aragorn d'une autre session, **sur demande explicite du décideur seulement** (ex. « odin, où en est naonedge ? »), cité **verbatim** sous le badge d'Aragorn. | Compte rendu entre sessions, pas une délégation (P-6, L-1) ; jamais d'initiative d'Odin, jamais de reformulation ; contrat porté par `odin.md` / `iakaframe-odin` (étapes 8-9) ; recette CA-P14. |
| Q-P3 | **Odin par défaut** au portefeuille (`C:\work`) et hors dépôt : la voix du thread principal y est Odin même sans « odin, … » ni `iakastart`. R2 ne contraint Odin **que dans les dépôts**. | Lignes `portefeuille` / `hors` de la table P-1 ; règle 4 de `voiceOf` (P-5) ; aucun badge neutre à définir. |

Contexte de conduite (même jour, hors contenu à implémenter) : le chantier se poursuit dans la session
courante lancée dans `C:\work\iakaframe` **sans `--agent`** — cas P-2 (rôle technique `odin`, voix
Aragorn une fois le Lot P4 déployé).

### Décisions de cadrage

**P-1 — « Entré volontairement dans un dépôt » = le lieu de lancement de la session.** Le lieu est
le **répertoire de lancement** de la session (`CLAUDE_PROJECT_DIR`, immuable ; à défaut le `cwd` du
payload), résolu par `keyOf` (P-M8, règle D-4 de la mère) :

| `kind` du lieu | Exemples de lancement | Entré dans un dépôt ? | Voix du thread principal |
|---|---|---|---|
| `repo` | `cd C:\work\naonedge ; claude` ; `claude --agent aragorn` dans le dépôt ; `iakaframe go naonedge` (P-M12) ; `iakaframe launch naonedge` (sœur) ; lancement dans un sous-dossier ou une **worktree** (→ dépôt principal) ; clone hors racine portant `.git` | **oui** | **Aragorn**, royaume = nom du dépôt en MAJUSCULE |
| `dir` | dossier de projet sous la racine, pas encore git (ex. `init iakaframe` dans un dossier vide) | **oui** (projet en création) | **Aragorn**, royaume = nom du dossier en MAJUSCULE |
| `portefeuille` | session lancée dans `C:\work` (ou un fichier / dossier `.xxx` de 1ᵉʳ niveau) | non | **Odin** (`🟡 [PORTEFEUILLE][Odin]`), par défaut, sans interpellation requise (décision **Q-P3**) |
| `hors` | hors racine et hors dépôt (ex. `C:\Users\Utilisateur`) | non | **Odin** (`🟡 [PORTEFEUILLE][Odin]`), par défaut (décision **Q-P3**) |

**Ne constituent PAS une entrée dans un dépôt** : mentionner un dépôt dans un prompt ; un `cd` dans
l'outil shell en cours de session ; la directive `chantier <repo>` ou `odin-direct <repo>` tapée dans
une session du portefeuille (elles gouvernent le **garde**, pas la voix — cf. P-6). Le lieu ne change
**jamais** en cours de session : la voix de base est fixée au lancement (comme le chantier implicite
de lancement, mère Q1), et seule une interpellation « odin, … » la suspend pour un tour (P-3).

**Cas du dépôt réservoir `C:\work\iakaframe`.** C'est un dépôt git (`kind:"repo"`, `name:"iakaframe"`)
: une session lancée dedans a pour voix **Aragorn, royaume `IAKAFRAME`** — y compris quand le sujet
est la méthode elle-même. L'absence du pointeur `.iakaframe` (P-M11) ne joue **que** sur le roster
affiché par `iakastart` (repli sur la frame default, règle existante), **jamais** sur la voix.
Conséquence assumée : les sessions de travail sur la méthode ouvertes dans ce dépôt ne parlent plus
sous le badge d'Odin ; un sujet réellement portefeuille s'y traite par « odin, … » (P-3) ou dans une
session lancée dans `C:\work`.

**P-2 — Voix de base par lieu, indépendante du rôle technique du garde.** La voix est une notion de
**contrat** (qui parle), distincte du `sessionRole` du garde (qui peut écrire où, mère D-5). Une
session lancée sans `--agent` dans un dépôt a le rôle **technique** `odin` (P-M7) **et** la voix
**Aragorn** : les deux coexistent sans contradiction (au lancement, le chantier est le dépôt, tout geste
y est « chez soi »). Le garde n'est **pas** aligné mécaniquement sur la voix (décision **Q-P1 = A**).
`--agent odin` lancé **dans un dépôt** : la voix reste Aragorn (R5) — lancement non pris en charge,
signalé par le rappel (P-5). `--agent <x>` avec `x` ∉ {`odin`, `aragorn`} : lancement non pris en
charge, le rappel reste **générique** (aucune voix affirmée).

**P-3 — Sollicitation directe d'Odin dans un dépôt (R2).** Est une sollicitation directe un prompt
dont la **première ligne non vide**, après `trim()`, commence par le mot `odin` (casse ignorée), non
suivi d'une lettre, d'un chiffre, de `_` ou de `-` : « odin, où en sont mes projets ? », « Odin : … »,
« odin » seul. **N'en sont pas** : `odin-direct naonedge` (directive de la mère), « odinson… », « je
pense qu'odin… », une mention d'Odin plus loin dans le prompt.
Effet : **ce tour entier** est dans la voix d'Odin (`🟡 [PORTEFEUILLE][Odin]`, ouverture et clôture),
**en lecture seule** — vue portefeuille, conseil, alerte stratégique. Tout **geste** portefeuille
(`iakaframe launch`, `onboard`, `agents fullteam`) est **renvoyé à la session du portefeuille** (le
garde le refuse de toute façon hors portefeuille : mère D-5 règle 3). Au tour suivant sans
interpellation, Aragorn reprend la parole. Un tour = **une seule voix** au niveau du thread principal
(pas de bloc Odin puis bloc Aragorn dans le même tour).
Au portefeuille, `odin` seul ou « odin, … » garde son comportement actuel (`iakastart` + posture
portefeuille, P-M4).

**P-4 — `iakastart` : la voix suit le lieu (R2, R3).** Mêmes étapes (banner, frame active, roster,
rappel de dispatch, aucun spawn) ; seul le **badge** change :
- lieu `repo` / `dir` → ouverture `🟠 [<DÉPÔT>][Aragorn] — …`, clôture `… [<DÉPÔT>][Aragorn] 🟠` ;
  la ligne `Session Aragorn — chantier : <dépôt> (fixé au lancement)` de la sœur (D-L10) s'affiche
  **quand la session a été lancée par Odin** (ordre de mission reçu) — elle n'est plus conditionnée à
  « agent principal ≠ Odin » ;
- lieu `portefeuille` / `hors` → `🟡 [PORTEFEUILLE][Odin]` (inchangé).
Déclencheurs : `iakastart` et `iakaframe` (seuls) → cette skill **partout** ; `odin` → cette skill
**au portefeuille seulement** ; dans un dépôt, `odin` relève de P-3 (pas de bootstrap).

**P-5 — Rappel d'identité contextuel (`identity-remind.mjs`).** Le hook `UserPromptSubmit` lit son
payload et calcule la voix par une fonction **pure** ajoutée à `guard-core.mjs` :
- `isOdinSolicitation(prompt)` → booléen (règle P-3) ;
- `voiceOf({ launchKey, agentType, prompt })` → `{ voice: "aragorn"|"odin"|"generic", royaume,
  turnVoice: "aragorn"|"odin"|"generic" }`, règles **dans l'ordre** :
  1. `agentType` non vide et, en minuscules, ∉ {`odin`, `aragorn`} → tout `generic` ;
  2. `launchKey` absent → tout `generic` ;
  3. `launchKey.kind` ∈ {`repo`, `dir`} → `voice:"aragorn"`, `royaume = launchKey.name.toUpperCase()` ;
     `turnVoice = "odin"` si `isOdinSolicitation(prompt)`, sinon `"aragorn"` ;
  4. sinon (`portefeuille`, `hors`) → `voice = turnVoice = "odin"`, `royaume:"PORTEFEUILLE"`.
L'adaptateur (le hook) : lit `stdin` (JSON ; illisible → `{}`), prend
`CLAUDE_PROJECT_DIR || payload.cwd`, obtient la clé par `keyOf` importé **dynamiquement** de
`./chantier-state.mjs`, appelle `voiceOf`, écrit **un** texte parmi quatre (ASCII, structure à tenir) :
- **REPO** (`turnVoice:"aragorn"`) : « [Garde d'identite iakaframe] Session lancee dans le depot
  `<name>` : tu parles en Aragorn, a la premiere personne (je), jamais "Aragorn fait...". Ouverture en
  TOUTE PREMIERE ligne -> `<pastille> [<ROYAUME>][Aragorn]` - courte annonce (pastille = phase servie,
  orange par defaut, jamais jaune) ; cloture en derniere ligne -> `[<ROYAUME>][Aragorn] <pastille>`.
  Odin ne parle ici que si le decideur l'interpelle ("odin, ..."). Tu delegues aux autres agents :
  chaine de badges, restitution verbatim sous le badge de l'emetteur. » — **aucune** occurrence de
  `[PORTEFEUILLE][Odin]` ;
- **ODIN-DANS-DEPOT** (`voice:"aragorn"`, `turnVoice:"odin"`) : « [Garde d'identite iakaframe] Le
  decideur interpelle Odin dans le depot `<name>` : CE tour est dans la voix d'Odin (pastille jaune puis
  [PORTEFEUILLE][Odin]), ouverture et cloture, en lecture seule ; tout geste portefeuille se fait dans
  la session du portefeuille. Au tour suivant, Aragorn reprend la parole. » ;
- **PORTEFEUILLE** (`voice:"odin"`) : le texte **actuel** (P-M1), suivi de « Dans un depot, c'est
  Aragorn qui parle (session lancee dans le depot). » ;
- **GENERIC** (`generic`, ou toute exception interne, import de `chantier-state.mjs` compris) : le texte
  **actuel octet pour octet** (P-M1).
Le hook **sort toujours en 0** et n'écrit jamais rien sur disque. `--agent odin` dans un dépôt → texte
REPO (P-2).

**P-6 — Odin cède sa place, il ne délègue pas (R4).** Au portefeuille, « appeler un Aragorn sur un
dépôt » = **proposer puis lancer une session Aragorn dans ce dépôt** (sœur D-L1 à D-L8, inchangées) :
le thread principal de **cette** session est Aragorn. Après le lancement, Odin **rend la main** :
il dit au décideur que la suite se passe dans la fenêtre `Aragorn <nom>` et il **ne parle jamais pour
Aragorn**. Hors Windows (sœur D-L11), il donne la commande manuelle. Conséquences contractuelles :
- **le secours « sous-agent `aragorn` »** (mère, décision 4) est **abandonné** : Odin ne dispatche
  **jamais** de sous-agent `aragorn` (ni aucun autre agent d'équipe, déjà interdit en régime Odin) ;
  la directive `chantier <repo>` en session portefeuille reste un mécanisme **du garde**
  (attribution, mère D-3), sans changer la voix ; le garde qui l'accompagne (mère D-6 règle 4) reste
  **inchangé** (décision **Q-P1 = A**) : l'interdiction du sous-agent `aragorn` est **contractuelle** ;
- « **switcher** » (P-M5) = proposer la session Aragorn du dépôt, plus « aller dans `C:\work\<projet>` » ;
- le suivi inter-sessions (sœur D-L9) est conservé ; Odin **peut restituer** un point d'Aragorn d'une
  autre session (décision **Q-P2**) **seulement sur demande explicite** du décideur, cité **verbatim**
  sous le badge d'Aragorn (sœur D-L9.4) — compte rendu entre sessions, pas une délégation ; jamais
  d'initiative, jamais de reformulation, jamais de parole d'Aragorn produite par Odin.
Dans un dépôt, il n'y a **rien à céder** : Aragorn parle déjà (P-1).

**P-7 — Première personne (R6), articulée avec le relais.** Règle ajoutée : **tout agent parle de
lui-même à la première personne** (« je lance Gimli », « ma mission ») ; il ne se désigne **jamais** à
la 3ᵉ personne (« Aragorn fait… », « Odin propose… »). La restitution en relais est **inchangée** : le
travail d'un **autre** agent est cité verbatim sous **son** badge, jamais reformulé en « je » par
l'orchestrateur. Les deux se lisent ensemble : « je » = moi ; les mots d'un autre = son badge. Portée
contractuelle : `aragorn.md` (R6 vise les Aragorn), `iakaframe-aragorn`, et une phrase générale dans
`methode-de-travail.md` § Identité (déjà implicite pour le délégué d'une chaîne, `:306-313`).

**P-8 — Réciprocité (garde de la skill de cadrage).** Odin et Aragorn se partagent la parole : chacun
se définit par l'autre. `odin.md` et `iakaframe-odin` **nomment** Aragorn comme la voix du dépôt ;
`aragorn.md` et `iakaframe-aragorn` **nomment** Odin comme la voix du portefeuille, interpellable par
« odin, … ». Invariant binaire vérifié par CA-P9.

**P-9 — Chaîne de délégation visible d'Aragorn** (décidée par Stéphane le 2026-09-27). Mots du
décideur : « je ne vois pas les délégations logiques : aragorn missionne gandalf, explique le rendu,
aragorn missionne gimli, gimli start, gimli stop, legolas start, legolas stop en expliquant fail ou
pass, aragorn rend compte résumé. Bref aragorn doit se comporter comme odin le faisait avant. »
C'est l'**héritage** de la posture d'orchestrateur visible qu'avait Odin (conventions globales
« chaîne de badges » et « restitution en relais », `kits/iakaframe-claude/global/CLAUDE.md` § Identité)
**transposé à Aragorn**, puisque dans un dépôt c'est lui le thread principal (R5). Dans un dépôt,
Aragorn rend **chaque** délégation visible, **en séquence** :
1. **Mission** — j'ouvre (`🟠 [<DÉPÔT>][Aragorn] — …`), j'annonce « je missionne <Agent> pour
   <objet> » (mission en 1 à 3 lignes) et je clos (`… [<DÉPÔT>][Aragorn] 🟠`).
2. **Bloc de l'agent** — cité **VERBATIM** sous **son** badge (son ouverture … sa clôture), sans
   **aucune** interjection de ma part entre les deux.
3. **Relais entre agents enchaînés** (ex. Gimli → Legolas) — j'ouvre, je dis en **une ligne** ce que
   je retiens du rendu précédent et la mission suivante, je clos ; puis étape 2 pour l'agent suivant
   (pour Legolas : son verdict **pass/fail** expliqué, dans son bloc).
4. **Rendu final** — je rouvre en dernier : j'explique le rendu et je **résume** (fait, verdict,
   décisions attendues du décideur, suite), je clos.
**Trois interdits** : (a) lancer un agent **en silence** (sans bloc de mission) ; (b) relayer un
rendu **après coup** sans le bloc de mission qui le précède ; (c) livrer un rendu **sans** le résumé
final. P-9 **précise** R6/P-7 (1ʳᵉ personne pour mes blocs, verbatim pour ceux des autres) et la
ligne « Aragorn continue de déléguer… » des règles du décideur ; elle ne change **ni** le gabarit
d'ordre de mission d'`iakaframe-aragorn`, **ni** le garde (contrat seul, comme Q-P1 = A).

## Périmètre

- **Inclus** :
  - `guard-core.mjs` : `isOdinSolicitation`, `voiceOf` (purs) + copie octet pour octet dans le kit Codex ;
  - `identity-remind.mjs` (kit Claude global) : lecture du payload, texte contextuel P-5, repli
    générique ;
  - tests : unités `guard-core`, bout-en-bout du hook par `spawnSync` ;
  - contrats : `library/personas/aragorn.md`, `library/personas/odin.md`,
    `library/skills/iakastart/SKILL.md` (corps **et** `description`),
    `library/skills/iakaframe-odin/SKILL.md`, `library/skills/iakaframe-aragorn/SKILL.md`,
    `methode-de-travail.md` § Identité, `kits/iakaframe-claude/global/CLAUDE.md` (§ iakastart,
    conventions Identité) ;
  - notes de renvoi en tête de `lancement-session-aragorn.md` et `declaration-chantier-session.md` ;
  - régénérations (goldens d'agents et de skills, vitrine, contrats déployés).
- **Exclu** :
  - **toute logique de garde** (`verdictChantier`, `verdictDispatch`, `mainRoleOf`, `perimeter-guard`,
    `delegation-guard`) — décision **Q-P1 = A** : pas de 3ᵉ amendement de la mère ;
  - `identity-guard.mjs` (il contrôle la **forme** du badge, pas l'agent : P-M2) ; ses baselines et
    fixtures ;
  - les autres runners (`kits/iakaframe-codex` hors copie de `guard-core`, `kits/iakaframe-openwebui`,
    `kits/iakaframe-anythingllm`) : pas de notion de session par dépôt ; lot ultérieur ;
  - `frames/releases/**` (instantanés gelés) ; re-vendorisation `iakaframegui` (autre dépôt) ;
  - la **copie runtime** (`~/.claude/hooks/`, `~/.claude/CLAUDE.md`) : **geste humain** (Lot P4) ;
  - le frontmatter `royaume: IAKAFRAME` d'`aragorn.md` (P-M10) : valeur de la frame, le royaume
    réel est le dépôt courant (méthode `:235`) ; le rappel le calcule ;
  - les personas autres qu'Odin et Aragorn (leur 1ʳᵉ personne est déjà la règle de chaîne).

## Étapes d'implémentation

Un lot = un commit atomique (conventional commits), tests verts avant chaque commit. Première étape :
`git pull origin main` puis re-vérifier chaque référence `fichier:ligne` du § 2 ; divergence sur un
fichier listé → la noter en tête de PR ; si elle touche `chantier-state.mjs` (`keyOf`), remonter.

**Lot P0 — Renvois** (`docs(specs)`) — fait par Gandalf **à la validation** de cette instruction, pas par
Gimli : une note « Amendée par `prise-de-parole-odin-aragorn.md` (voir § 4) » en tête des deux
instructions amendées. ✅ **Fait le 2026-09-27** (non commité ; commit par l'orchestrateur).

**Lot P1 — Cœur pur** (`feat(guard-core)`) — pré-requis : Lot 1bis de la mère (✅ `28c4723`).
1. `kits/iakaframe-claude/global/hooks/guard-core.mjs` : ajouter `isOdinSolicitation(prompt)` et
   `voiceOf({ launchKey, agentType, prompt })` (P-3, P-5), sans E/S, sans toucher aux fonctions
   existantes.
2. Copier le fichier à l'identique dans `kits/iakaframe-codex/global/hooks/guard-core.mjs`.
3. `cli/test/guard-core.test.js` : CA-P1, CA-P2.

**Lot P2 — Rappel contextuel** (`feat(hooks)`) — pré-requis : Lot 2 de la mère **commité**
(`chantier-state.mjs` suivi, `keyOf` exporté).
4. `kits/iakaframe-claude/global/hooks/identity-remind.mjs` : adaptateur P-5 (lecture `stdin`,
   `CLAUDE_PROJECT_DIR || cwd`, `await import("./chantier-state.mjs")` sous `try`, `voiceOf`, 4 textes,
   exit 0 inconditionnel). En-tête : rappeler que la voix est une règle de contrat, que le hook ne
   bloque jamais, et que le repli est le texte historique.
5. `cli/test/identity-remind.test.js` (**créé**) : CA-P3 à CA-P5 (`HOME`/`USERPROFILE` et
   `IAKAFRAME_ROOT` redirigés vers un tmpdir ; dépôts fixtures = dossiers portant `.git`).
6. `kits/iakaframe-claude/global/README.md` : une ligne — `identity-remind` devient contextuel (voix par
   lieu), dépend de `chantier-state.mjs` (même dossier), repli générique.

**Lot P3 — Contrats et méthode** (`docs`) — indépendant de P2. Si le Lot 6 de la mère ou le Lot L3 de
la sœur n'est pas encore passé, il s'exécutera plus tard **avec les lectures amendées du § 4** ; celui
des deux lots qui passe en second réconcilie le texte (aucune section en double : CA-P8).
7. `library/personas/aragorn.md` : nouvelle section **« Voix dans le dépôt »** après § Étanchéité
   (`:167-168`) : R1, R5 (je suis la voix de toute session lancée dans mon dépôt, y compris pour
   `iakastart`) ; Odin ne parle ici que sur « odin, … » (P-3), et je reprends au tour suivant ;
   je ne reçois pas le relais d'Odin, je parle en direct (R4) ; je délègue aux autres agents avec
   chaîne de badges. § Identité (`:170-175`) : ajouter la règle **1ʳᵉ personne** (P-7) et sa
   distinction avec le relais ; royaume = **nom du dépôt de la session** en MAJUSCULE.
8. `library/personas/odin.md` :
   - § Identité (`:116-121`) : Odin parle **au portefeuille** ; dans un dépôt, **seulement** sur « odin,
     … », pour un tour, en lecture seule (P-3) ; restitution d'un point d'Aragorn d'une autre session
     **seulement sur demande explicite**, verbatim sous le badge d'Aragorn (Q-P2, P-6) ;
   - § Périmètre « Switcher » (`:62`) et § Entrées → Sorties « passe la main » (`:83-84`) : « cède sa
     place » = proposer puis lancer la session Aragorn du dépôt (P-6) ; **jamais** de sous-agent
     `aragorn`. ⚠️ Ne pas toucher la ligne de durée (`:85-86`, `duree-estimee-delegation.md` CA-3).
9. `library/skills/iakaframe-odin/SKILL.md` : procédure (`:56-65`) — « Switcher » et « Délègue la
   suite » → P-6 ; § Identité (`:86-90`) → P-3 et restitution sur demande explicite (Q-P2). ⚠️ Ligne de durée : ne pas la recopier (CA-3).
10. `library/skills/iakaframe-aragorn/SKILL.md` : § Identité (`:111-115`) → voix dans le dépôt (R1/R5),
    1ʳᵉ personne (P-7), Odin interpellable (P-8). Gabarit d'ordre de mission (`:63-70`) **intact**.
11. `library/skills/iakastart/SKILL.md` : `description` (`:4`) — « "odin" au portefeuille » ; nouvelle
    étape **« 0. Déterminer la voix »** (lieu de lancement → Aragorn ou Odin, P-1/P-4) avant l'étape 1 ;
    § 5 Note alias (`:114-117`) → P-4 (déclencheurs). La section « Session d'équipe » prévue par la
    sœur (étape 8) est **fusionnée** dans cette étape 0 (§ 4, L-2).
12. `methode-de-travail.md` § Identité : nouveau paragraphe **« Qui parle — le lieu désigne la voix »**
    après les exemples de rendu (`:272-285`) : table P-1, P-3, R4/P-6 ; et une phrase P-7 en tête de
    « Restitution en relais » (`:287-294`). Ajouter un exemple `🟠 [IAKABOX][Aragorn] je lance Gimli
    sur…` aux exemples (`:275-280`).
13. `kits/iakaframe-claude/global/CLAUDE.md` : § iakastart (`:56-72`) → P-4 (alias `odin` au
    portefeuille) ; convention Identité (`:119-130`) → remplacer « Claude principal (Odin) » par
    « Claude principal (Aragorn dans un dépôt, Odin au portefeuille) » + une puce **« Voix par lieu »**
    (R1-R6, P-3, P-6).
13 bis. **Chaîne de délégation visible (P-9)** — ajoutée le 2026-09-28. Si les étapes 7-13 sont déjà
    commitées, P-9 fait l'objet d'un commit `docs` complémentaire (même lot, réconcilier sans doublon).
    Écrire la séquence en 4 temps **et** les trois interdits de P-9, dans la voix de chaque texte :
    - `library/personas/aragorn.md` : sous-section **« Chaîne de délégation visible »** dans § Identité,
      **juste avant** « Restitution en relais (deux invariants) » (`:189`), à la 1ʳᵉ personne ; renvoi
      à la règle de relais existante, sans la réécrire ;
    - `library/skills/iakaframe-aragorn/SKILL.md` : même sous-section dans § Identité, avant
      « Restitution en relais » (`:122`) ; une ligne dans § Dispatch à la demande (`:48`) : « chaque
      dispatch suit la chaîne de délégation visible (§ Identité) » ;
    - `methode-de-travail.md` § Identité : un paragraphe **« Chaîne de délégation visible (Aragorn dans
      un dépôt) »** juste après « Restitution en relais » (`:287`), avec un exemple de rendu Aragorn →
      Gimli → Legolas → résumé (chaque agent sous sa pastille de phase telle que la table des pastilles
      existante la définit — ne pas en inventer) ;
    - `kits/iakaframe-claude/global/CLAUDE.md` : dans la puce « Voix par lieu » (étape 13), une phrase :
      « dans un dépôt, Aragorn tient la chaîne de délégation visible (mission → bloc verbatim de
      l'agent → relais d'une ligne → résumé final) : jamais d'agent lancé en silence, jamais de relais
      sans mission, jamais de rendu sans résumé ».
14. Régénérations (jamais d'édition à la main) : `node cli/scripts/gen-agents-golden.mjs`,
    `node cli/scripts/gen-skills-golden.mjs`, `node cli/scripts/gen-methode-vitrine.mjs`, puis
    `iakaframe agents --action generate` et `--check` ; dérive `vendor-check` vers `iakaframegui`
    **consignée** en tête de PR.

**Lot P4 — Déploiement et recette (gestes HUMAINS, décideur)** — après P2 et P3.
15. Copier `identity-remind.mjs` **et** `chantier-state.mjs` (+ `guard-core.mjs`) vers
    `~/.claude/hooks/` ; copier `kits/iakaframe-claude/global/CLAUDE.md` vers `~/.claude/CLAUDE.md`
    (ou lancer soi-même l'installeur). Recette CA-P11 à CA-P14.

## 4. Lectures amendées des instructions existantes

**Instruction sœur `lancement-session-aragorn.md`**
- **L-1 (D-L9)** : après le lancement, Odin **cède la place** (P-6) : l'étape 1 (annonce) dit que la
  suite se passe dans la fenêtre `Aragorn <nom>`. Étape 4 (restitution d'un point d'Aragorn) :
  **conservée**, mais **seulement sur demande explicite** du décideur, verbatim sous le badge d'Aragorn
  (décision **Q-P2**).
- **L-2 (D-L10, étape 8)** : la condition « agent principal ≠ Odin » devient « **session lancée dans un
  dépôt** » (P-1) ; la section `iakastart` s'appelle « 0. Déterminer la voix » (P-4) ; « l'alias `odin`
  est sans effet dans cette session » devient « `odin, …` y ouvre un tour d'Odin en lecture seule (P-3) ;
  `odin` n'y déclenche pas `iakastart` ».
- CA-L13 (recette) : le premier tour s'affiche **sous le badge `🟠 [NAONEDGE][Aragorn]`**.

**Instruction mère `declaration-chantier-session.md`**
- **L-3 (décision 4, `:118-122`)** : « en secours, il délègue à un sous-agent `aragorn` » est **retiré
  du contrat** (R4). Le garde (D-6 règle 4) reste tel quel (décision **Q-P1 = A**).
- **L-4 (Lot 6, étape 11)** : la section « Obligation — chantier déclaré » d'`odin.md` ne décrit **plus**
  le secours `chantier <repo>` + sous-agent ; elle dit : pour tout travail dans un dépôt, proposer une
  session Aragorn (P-6). **Étape 12** : `aragorn.md` répond du **dépôt de lancement de sa session** —
  la branche « ou le chantier de session désigné par le décideur (secours, sous-agent) » est retirée.
- **L-5 (§ Messages, `:565-568`, et rappel de `chantier-remind`)** : l'option 2 « faire designer le
  depot… puis deleguer a aragorn » est **retirée** des messages du garde et du rappel `chantier-remind`
  (seule reste la proposition de session Aragorn ; décision **Q-P1 = A**). Portée : ces textes sont
  écrits par les **lots de la mère** (Lot 3 `chantier-remind.mjs`, Lot 4 messages de refus de
  `perimeter-guard.mjs`), qui s'exécutent avec cette lecture ; au 2026-09-27, aucune occurrence de
  « deleguer a aragorn » / « designer le depot » sous `kits/` (rien à défaire).
- **L-6 (Exclu `:447`)** : `identity-remind.mjs` n'est plus exclu : il est traité **ici** (Lot P2).

## Fichiers concernés

- `kits/iakaframe-claude/global/hooks/guard-core.mjs` — `isOdinSolicitation`, `voiceOf`.
- `kits/iakaframe-codex/global/hooks/guard-core.mjs` — copie octet pour octet.
- `kits/iakaframe-claude/global/hooks/identity-remind.mjs` — rappel contextuel.
- `kits/iakaframe-claude/global/README.md` — une ligne.
- `cli/test/guard-core.test.js` — CA-P1, CA-P2.
- `cli/test/identity-remind.test.js` — **créé** (CA-P3 à CA-P5).
- `library/personas/aragorn.md`, `library/personas/odin.md` — étapes 7-8 (+ 13 bis pour `aragorn.md`).
- `library/skills/iakastart/SKILL.md`, `library/skills/iakaframe-odin/SKILL.md`,
  `library/skills/iakaframe-aragorn/SKILL.md` — étapes 9-11 (+ 13 bis pour `iakaframe-aragorn`).
- `methode-de-travail.md` — § Identité (étapes 12 et 13 bis).
- `kits/iakaframe-claude/global/CLAUDE.md` — étapes 13 et 13 bis.
- `specs/instructions/lancement-session-aragorn.md`, `specs/instructions/declaration-chantier-session.md`
  — note de renvoi (Lot P0, Gandalf).
- Régénérés, jamais édités à la main : `cli/test/fixtures/agents-golden/{odin,aragorn}.md`, goldens de
  skills (`cli/test/fixtures/skills-golden/`), zone `CODE_BLOCKS` de `methode-de-travail.html`,
  contrats déployés.
- **Inchangés** (doivent passer tels quels) : `identity-guard.mjs`, `cli/test/guard-identity-regression.test.js`,
  `cli/test/guard-core-parity.test.js` (après copie), `cli/baselines/guard/*`, fixtures `cli/test/fixtures/guard/*`.

## Risques

- **La voix reste contractuelle** : le garde d'identité ne sait pas qui parle (P-M2) ; un modèle peut
  encore ouvrir en Odin dans un dépôt → mitigation : rappel contextuel à **chaque** prompt (P-5), texte
  qui nomme le badge attendu ; recette CA-P11. Un contrôle bloquant « badge attendu = voix du lieu »
  serait un lot ultérieur (il faudrait aussi autoriser les badges des délégués relayés).
- **Dépendance du hook à `chantier-state.mjs`** (non suivi aujourd'hui) → import dynamique sous `try`,
  repli sur le texte historique ; Lot P2 après le Lot 2 de la mère ; déploiement des **deux** fichiers
  (P4).
- **Déclenchement de la skill par le mot `odin`** : la `description` d'`iakastart` change (P-4) ; le
  modèle pourrait continuer à la déclencher dans un dépôt → le rappel ODIN-DANS-DEPOT dit « pas de
  bootstrap » ; recette CA-P12.
- **Rôle technique `odin` vs voix Aragorn** (session sans `--agent` dans un dépôt, P-2) : si le décideur
  y tape `chantier <autre>`, le garde passe en régime Odin alors que la voix est Aragorn → incohérence
  **tolérée** (décision **Q-P1 = A** : pas d'alignement du garde) ; cas hors mode principal.
- **Sessions de méthode dans `C:\work\iakaframe`** : l'habitude « Odin parle ici » disparaît ; attendu
  (R5). Documenté (P-1).
- **Collision d'édition** avec le Lot 6 de la mère et le Lot L3 de la sœur (mêmes fichiers) → § 4 +
  CA-P8 (pas de section en double).
- **Copie Codex** oubliée → le test de parité échoue (garde existante).

## Critères d'acceptation

**Cœur pur (`guard-core.test.js`)**
- [ ] **CA-P1** `isOdinSolicitation` : vrai pour `"odin, où en sont mes projets ?"`, `"Odin : point"`,
      `"odin"`, `"\n\n  ODIN, x"` ; faux pour `"odin-direct naonedge"`, `"odinson"`, `"je pense qu'odin
      a raison"`, `"regarde ça\nodin, x"` (pas en 1ʳᵉ ligne non vide), `""`, `null`.
- [ ] **CA-P2** `voiceOf` : clé `{kind:"repo",name:"naonedge"}` sans `agentType` → `aragorn`,
      `NAONEDGE`, `turnVoice:"aragorn"` ; même clé + prompt `"odin, x"` → `turnVoice:"odin"` ;
      `agentType:"aragorn"` et `"Odin"` sur repo → `aragorn` ; `agentType:"gimli"` → `generic` ;
      `{kind:"dir",name:"nouveau"}` → `aragorn`, `NOUVEAU` ; `portefeuille` et `hors` → `odin`,
      `PORTEFEUILLE` (prompt `"odin, x"` ou non) ; `launchKey:null` → `generic`.
      `kits/iakaframe-codex/global/hooks/guard-core.mjs` identique octet pour octet (parité verte).

**Hook (`identity-remind.test.js`, `spawnSync`, racine et `HOME` redirigés)**
- [ ] **CA-P3** `CLAUDE_PROJECT_DIR=<tmp>/root/repoA` (portant `.git`), prompt `"fais le point"` →
      exit 0, stdout contient `[REPOA][Aragorn]` et `premiere personne`, ne contient **pas**
      `[PORTEFEUILLE][Odin]` ; lancé dans `<tmp>/root/repoA/sub/dir` → même résultat ; worktree
      fixture (`.git` fichier `gitdir: …/repoA/.git/worktrees/w1`) → `[REPOA][Aragorn]`.
- [ ] **CA-P4** Même dépôt, prompt `"odin, où en sont mes projets ?"` → stdout contient
      `[PORTEFEUILLE][Odin]` et `Aragorn reprend` ; prompt `"odin-direct repoA"` → texte REPO.
      `CLAUDE_PROJECT_DIR=<tmp>/root` → texte actuel + `Dans un depot, c'est Aragorn qui parle` ;
      dossier hors racine sans `.git` → même texte PORTEFEUILLE.
- [ ] **CA-P5** Payload `{"agent_type":"gimli"}` dans repoA → texte GENERIC **identique octet pour
      octet** au texte historique (P-M1) ; `stdin` vide ou JSON invalide sans `CLAUDE_PROJECT_DIR` →
      exit 0 et texte GENERIC ; `chantier-state.mjs` absent (copie du hook seul dans un dossier tmp) →
      exit 0 et texte GENERIC ; aucun fichier créé sous `<tmp>/home/.claude/`.

**Contrats**
- [ ] **CA-P6** `grep -c "Voix dans le dépôt" library/personas/aragorn.md` = 1 ; `aragorn.md` et
      `iakaframe-aragorn/SKILL.md` contiennent « première personne » hors du paragraphe de relais ;
      `grep -c "Qui parle — le lieu désigne la voix" methode-de-travail.md` = 1 ;
      `kits/iakaframe-claude/global/CLAUDE.md` ne contient plus la chaîne `Claude principal (Odin)`.
- [ ] **CA-P7** Plus **aucune** occurrence, dans `library/personas/odin.md` et
      `library/skills/iakaframe-odin/SKILL.md`, d'une consigne de déléguer à un sous-agent `aragorn`
      ni de « va dans `C:\work\<projet>` » (grep `sous-agent .aragorn`, `va dans`) ;
      `duree-estimee-delegation.md` CA-2 et CA-3 restent vrais.
- [ ] **CA-P8** `library/skills/iakastart/SKILL.md` : la `description` ne présente plus `odin` comme
      déclencheur inconditionnel (mention « au portefeuille ») ; une seule étape « Déterminer la voix »
      (`grep -c` = 1), et **pas** de section « Session d'équipe » séparée qui la double.
- [ ] **CA-P9** Réciprocité : `odin.md` et `iakaframe-odin/SKILL.md` contiennent chacun « Aragorn » dans
      leur § Identité ; `aragorn.md` et `iakaframe-aragorn/SKILL.md` contiennent chacun « odin, » (la
      forme d'interpellation) dans leur § Identité ou « Voix dans le dépôt ».
- [ ] **CA-P10 (non-régression)** `npm test` dans `cli/` : 100 % vert après régénérations ;
      `iakaframe agents --action generate --check` propre ; tests inchangés listés au § Fichiers
      passent sans modification.
- [ ] **CA-P15 (P-9, chaîne de délégation visible)** `grep -c "Chaîne de délégation visible"` = 1
      dans chacun de `library/personas/aragorn.md`, `library/skills/iakaframe-aragorn/SKILL.md`,
      `methode-de-travail.md` ; dans `aragorn.md` et `iakaframe-aragorn/SKILL.md`, cette section
      contient les **4 temps** (« je missionne », bloc « VERBATIM » sous le badge de l'agent, relais
      d'« une ligne » entre agents enchaînés, résumé final « fait, verdict, décisions attendues,
      suite ») **et** les **3 interdits** (« en silence », relais « après coup » sans mission, rendu
      « sans le résumé ») ; `kits/iakaframe-claude/global/CLAUDE.md` contient « chaîne de délégation
      visible » ; golden `cli/test/fixtures/agents-golden/aragorn.md` et golden de skill
      `iakaframe-aragorn` **régénérés** (jamais édités à la main) et contenant la section ; `npm test`
      vert (CA-P10). Recette (Lot P4, avec CA-P11) : dans `C:\work\naonedge`, une demande qui fait
      intervenir Gimli puis Legolas s'affiche en mission Aragorn → bloc Gimli → relais Aragorn d'une
      ligne → bloc Legolas (pass/fail expliqué) → résumé Aragorn ; aucun agent lancé sans bloc de
      mission.

**Recette réelle (décideur, Lot P4)**
- [ ] **CA-P11** Session `claude` (sans `--agent`) lancée dans `C:\work\naonedge`, prompt « où en est
      le projet ? » → réponse ouverte par `🟠 [NAONEDGE][Aragorn]`, à la 1ʳᵉ personne, close par
      `[NAONEDGE][Aragorn] 🟠` ; aucun bloc Odin.
- [ ] **CA-P12** Même session : « odin, où en sont mes projets ? » → tour entier sous
      `🟡 [PORTEFEUILLE][Odin]`, sans geste d'écriture ; prompt suivant sans interpellation → de nouveau
      Aragorn.
- [ ] **CA-P13** `iakastart` dans `C:\work\iakaframe` → banner + roster (frame default) sous
      `🟠 [IAKAFRAME][Aragorn]` ; `iakastart` dans `C:\work` → sous `🟡 [PORTEFEUILLE][Odin]`.
- [ ] **CA-P14** Session au portefeuille, « lance Aragorn sur naonedge » → Odin **propose** la session
      (sœur D-L1) ; aucun sous-agent `aragorn` n'est dispatché (journal `delegation-guard` : pas de
      cible `aragorn` pour cette session) ; après lancement, Odin ne parle pas sous le badge d'Aragorn
      de lui-même. Puis « odin, où en est naonedge ? » → Odin restitue le dernier point d'Aragorn
      **verbatim** sous `🟠 [NAONEDGE][Aragorn]`, puis reprend sous son badge (Q-P2) ; sans cette
      demande, aucune restitution.

## Estimation (jalon P1→P2)

| | Équivalent j-h | Complexité / risque |
|---|---|---|
| Lot P1 — cœur pur + tests + copie Codex | 0,2 | faible |
| Lot P2 — hook contextuel + tests bout-en-bout | 0,3 | faible-moyenne (import dynamique, fixtures worktree) |
| Lot P3 — 7 contrats/docs + régénérations | 0,5 | faible (volume, réconciliation avec mère L6 / sœur L3) |
| Lot P3, étape 13 bis — P-9 (4 textes + régénérations) | 0,1 | faible (texte seul ; commit complémentaire si P3 déjà commité) |
| **Total dev** | **≈ 1,1 j-h** + 0,15 recette humaine | **faible-moyenne** |

**Inconnues susceptibles de faire glisser :**
1. **Ordre avec le Lot 6 de la mère et le Lot L3 de la sœur** (mêmes fichiers) — **+0,15 j-h** de
   réconciliation si P3 passe avant eux.
2. **Adhérence du modèle** à une voix contractuelle (le hook rappelle, ne bloque pas) — sans impact de
   code ; peut appeler un lot « contrôle bloquant de la voix ».

Effet des décisions sur l'estimation : **Q-P1 = A** retire l'inconnue « alignement du garde »
(+0,5 j-h, 3ᵉ amendement de la mère) — elle n'existe plus ; **Q-P2 = oui** et **Q-P3 = Odin par
défaut** sont les options déjà chiffrées (quelques lignes de contrat en étapes 8-9, un volet de
recette CA-P14) : **total inchangé ≈ 1,0 j-h** + 0,15 recette. **P-9** (2026-09-28) ajoute
**+0,1 j-h** (texte seul, aucune inconnue nouvelle) : **total ≈ 1,1 j-h** + 0,15 recette.

## Questions au décideur — tranchées le 2026-09-27

Toutes fermées ; décisions et effets au § « Décisions du décideur sur les questions de cadrage ».
- **Q-P1** (le garde applique-t-il R4/R5 mécaniquement ?) → **A, contrat seul**.
- **Q-P2** (Odin peut-il restituer un point d'Aragorn d'une autre session ?) → **oui, sur demande
  explicite seulement, verbatim**.
- **Q-P3** (qui parle au portefeuille sans « odin, … » ni `iakastart` ?) → **Odin par défaut**
  au portefeuille et hors dépôt.

## Sources

- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) (`CLAUDE_PROJECT_DIR` =
  racine où la session a démarré, conservée en worktree ; `agent_type` en session `--agent` ; stdout de
  `UserPromptSubmit` ajouté au contexte ; code ≠ 0/2 = erreur non bloquante)
