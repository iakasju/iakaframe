# Instruction — Canon PROJET : la connaissance incrémentale du produit

> **Phase** : P1 — Cadrage · **Cadreur** : l'architecte-cadreur (Gandalf) · **Exécutant** : le développeur-devops (Gimli).
> **Statut** : **PROPOSÉ — en attente d'arbitrage du décideur** (gate P1→P2 humain).
> **Date de cadrage** : 2026-07-21. Français ; code et identifiants en anglais.
>
> **Outillage du cadreur** : `Read` / `Grep` / `Glob` / `WebSearch` / `WebFetch` / `Write` / `Edit`.
> **`Bash` INDISPONIBLE** dans cette session de cadrage. Conséquence directe et assumée : **aucun
> chiffre de ce document n'est issu d'une exécution** (ni `npm test`, ni `vendor-check`, ni `git`).
> Les faits ci-dessous sont établis par **lecture de fichiers et comptage de fichiers** ; les
> chiffres d'exécution repris du brief d'Odin sont **cités comme tels, non revérifiés** et
> **explicitement marqués** (§ 10).
>
> **Références lues** (lecture seule) :
> - `cli/src/lib/memory.js`, `close.js`, `cadence.js`, `open.js`, `review.js`, `recall.js`,
>   `cli/src/commands/snapshot.js`
> - `specs/instructions/boucle-apprentissage-incrementale.md` (le lot dont celui-ci est le second axe)
> - `specs/PROJET.md` de 35 projets du portefeuille (échantillon mesuré, § 3.2)

---

## 1. Le besoin, dans les mots du décideur

Verbatim (à ne pas déformer) :

> « La mémoire d'apprentissage globale permet de développer une connaissance **du user et de ses
> pratiques**. La mémoire projet, sous le même principe (**incrémentale modifiée et pas juste une
> main courante**), développe une connaissance **du projet/produit**. »

Et sur le fonctionnement :

> « Il vit **dans le projet**. Il est écrit / modifié **en conclusion d'une session**. Si une session
> se ferme **sans rituel**, on **reprend le rituel à la reprise** sur le projet. Si le rituel de
> clôture **détecte une contradiction entre specs et mémoire**, on **synchronise au besoin avec le
> user**. »

**Deux axes du même moteur** : le canon global apprend *qui est le décideur*, le canon projet apprend
*ce qu'est le produit*. **Ce n'est pas un moteur neuf.**

---

## 2. Problème (avant la solution) — ce que « incrémentale modifiée » veut dire

Le critère qui sépare cette demande de tout l'existant est **« incrémentale modifiée et pas juste une
main courante »**. Il faut le prendre au mot, parce qu'il élimine les deux artefacts qu'on aurait
spontanément proposés :

| Artefact existant | Nature | Ce qu'il fait d'une connaissance qui s'affine |
|---|---|---|
| `specs/etat-des-lieux.md` | **Instantané** — régénéré, écrase le précédent | **il l'oublie** |
| `~/work/BACKLOG.md` (journal) | **Main courante** — empile, n'efface pas | **il la noie** |
| `specs/PROJET.md` | **Intention** — décidée en amont, révisée à la main | il la porte mal (§ 3.2) |

**Aucun des trois ne RÉVISE.** Or une connaissance produit vit précisément par révision : *« on croyait
que X suffisait, en fait Y »*. Cette phrase ne peut naître ni d'un instantané (qui l'écrase au
prochain passage) ni d'un journal (où elle coexiste pour toujours avec le X périmé, sans que rien ne
dise lequel fait foi).

La mécanique qui manque est exactement celle du canon d'apprentissage déjà bâtie : **entrées corrigées
en place** (`memoryReplace`), **plafond dur** qui force la consolidation, **garde de consentement**,
**cadence de clôture**. Le lot consiste à porter cette mécanique sur l'**axe produit**.

### 2.1 État de l'art — vérifié le 2026-07-21

Vérification faite parce que la question « quelqu'un a-t-il résolu ça ? » conditionne l'ambition du lot.

- Les mémoires d'agents de 2026 (`AGENTS.md` et l'écosystème `agentmemory`) sont **massivement
  append-only** : « running notebook », « daily logs » `2026-02-15.md`, « after each task, append key
  learnings ». C'est **la main courante** — exactement ce que le décideur écarte.
- Les approches plus structurées (graphes de connaissance incrémentaux, extraction hiérarchique
  multi-signal d'avril 2026) vont vers l'index et la récupération, **pas vers la révision arbitrée**
  d'un corpus court et plafonné.
- **Sur la brique la plus délicate — la contradiction — la littérature est muette.** La revue des
  agents auto-améliorants d'Addy Osmani décrit bien des agents qui mettent à jour `AGENTS.md`, mais
  **n'aborde ni les faux positifs d'extraction de règles, ni les contradictions entre documentation
  et règles apprises, ni les gates d'approbation humaine** avant modification.

**Conclusion pour le cadrage** : l'exigence du décideur est **en avance sur l'état de l'art**, et la
détection de contradiction est un **terrain non défriché**. Ce n'est pas une raison de renoncer ; c'est
une raison de la traiter avec une **méthode déterministe et conservatrice** (§ 7), et surtout **pas**
en empilant des heuristiques de langage.

---

## 3. Vérification des faits du brief — dont trois corrections

### 3.1 L'objection apparente est bien levée — le raisonnement d'Odin tient

`cli/src/lib/memory.js:17-18` porte : *« un seul canon quel que soit le projet : fin de la
fragmentation par scope »*. Lu seul, ça semble interdire ce lot.

`specs/instructions/boucle-apprentissage-incrementale.md:30-36` et `:55` disent ce qui a réellement été
écarté : *« aujourd'hui la connaissance **du décideur** est fragmentée par scope de répertoire […]
travailler dans un projet rend **aveugle** à la connaissance portefeuille »*, et *« Il n'y a pas de
canon unique toujours chargé. → C'est le manque structurant. »*

**Le raisonnement d'Odin est juste, et je le confirme sans réserve.** Le défaut corrigé était la
**cécité par scope sur l'axe UTILISATEUR** — et la correction était fondée : le décideur est le même
partout, sa connaissance ne doit pas dépendre du répertoire courant. **Cette décision ne dit rien de
l'axe PRODUIT**, qui n'était pas la question posée.

Le test discriminant est simple : **un canon projet est-il un silo ?** Un silo, c'est un corpus qui
*remplace* et *aveugle*. Ici le canon global reste chargé partout (`open.js` est inconditionnel du
répertoire courant et le restera) ; le canon projet **s'ajoute**. Les deux se **superposent**. Le
`§ 3` de l'instruction fondatrice écrit d'ailleurs déjà le canon comme chargé *« en PLUS de la mémoire
par scope du runner (jamais en remplacement) »* — la superposition est **déjà le modèle admis**.

> **Garde-fou à graver, qui rend l'argument opposable** : le canon projet ne devient un silo que si on
> le laisse porter de la connaissance **du décideur**. D'où l'invariant § 4.3 : **le canon projet ne
> parle QUE du produit**. Un fait sur Stéphane observé dans un projet va au canon **global**, jamais au
> canon projet. C'est ce qui garantit qu'entrer dans un projet n'aveugle jamais.

### 3.2 FAIT CORRIGÉ — la frontière avec `PROJET.md` n'est pas celle qu'on croit

Le brief demande de « mesurer ce que `PROJET.md` porte réellement ». Mesuré sur les 35 `specs/PROJET.md`
du portefeuille :

- **`iakaframe` — le projet même de ce lot — n'a AUCUN `specs/PROJET.md`.** (`Read` échoue ; absent du
  glob.) Le fichier que le brief pose comme pôle de la frontière **n'existe pas ici**.
- **19 fichiers `PROJET.md` contiennent encore le gabarit non rempli** (`<!-- objectif mesurable 1 -->`),
  dont des projets vivants : `iakaHub`, `robotimmo`, `iakaFreeVision`. Le reste des occurrences sont
  des gabarits de kits (`kits/`, `frames/releases/`).
- À l'inverse `IakaCockpit/specs/PROJET.md` fait **717 lignes**, avec un § 13 « Décisions structurantes
  (journal) » nourri sur un mois.

**Conséquence, et c'est structurant :** `PROJET.md` n'est **pas** un pôle fiable. Il est soit absent,
soit vide, soit une somme de vision. **Le canon projet ne doit donc PAS être défini par différence
avec `PROJET.md`, ni dépendre de son existence.** Le définir par différence reviendrait à l'ancrer sur
un fichier absent une fois sur trois.

La frontière juste n'est pas topologique (« quel fichier ? ») mais **modale** :

| | `specs/PROJET.md` | **Canon projet** | `etat-des-lieux.md` |
|---|---|---|---|
| Mode | **INTENTION** — ce qu'on a **décidé** de construire | **CONSTAT** — ce qu'on a **appris** en construisant | **SITUATION** — où on en est **maintenant** |
| Origine | Un humain / un cadrage, **en amont** | Le **rituel de clôture**, en aval | Le **script**, automatique |
| Vie | Révisé à la main, rarement | **Révisé en place, à chaque clôture** | **Écrasé** à chaque passage |
| Autorité | Fait foi sur **la cible** | Fait foi sur **le terrain** | Ne fait foi sur rien (dérivé) |
| Si absent | fréquent (19/35) | le canon fonctionne quand même | régénérable |

**Règle d'arbitrage à graver, pour qu'il n'y ait jamais deux endroits sans autorité** (le risque que le
brief pointe à raison) : *en cas de désaccord entre `PROJET.md` et le canon, **`PROJET.md` fait foi sur
l'intention, le canon fait foi sur le constat** — et un désaccord persistant n'est pas tranché par la
machine : il est **remonté au décideur** (§ 7). Le canon **ne réécrit jamais `PROJET.md`.*

### 3.3 FAIT CORRIGÉ — « le moteur est déjà paramétrable par `home` » est à moitié vrai

Le brief affirme : *« Un second canon ne demande pas de réécrire le moteur, mais de lui passer une
autre racine. Confirme et dis ce qui manque réellement. »* **Je confirme la première moitié et
j'infirme la seconde.**

Vrai : toutes les fonctions prennent `home` (`configPath(home)`, `loadConfig(home)`,
`statePath(home, target)`, `close(home, opts)`, `loadCanon(home)`), et `defaultMemoryHome()` n'est
qu'un défaut de résolution. Aucun chemin n'est figé dans la logique.

**Mais `home` n'est pas le seul couplage. Le moteur code en dur le VOCABULAIRE du canon global :**

- `memory.js:127` — `const TARGETS = ['profil', 'registre'];` et `isTarget()` **rejette** toute autre
  cible (`memoryAdd` lève « Cible invalide »).
- `memory.js:92-93,104-106` — noms de fichiers `PROFIL.md` / `REGISTRE.md` en dur dans `statePath`.
- `memory.js:95-102` — en-têtes `HEAD` en dur (« qui est le décideur », « ce que l'agent a appris »).
- `memory.js:54-55` — `caps: { profil, registre }` ; `evalCap` lit `cfg.caps[target]`, donc **une cible
  inconnue donne `cap === undefined`** et le plafond dur — le garde-fou central — **cesse
  silencieusement de s'appliquer**.
- `memory.js:108-121` — `ensureLayout` crée `transcripts/`, `transcripts/odin/`, `proposals/`,
  `PROFIL.md`, `REGISTRE.md`. Appliqué à un dossier de projet **versionné**, il y déverse une structure
  qui n'a pas lieu d'y être.

**Ce qui manque réellement** — et c'est peu cher, mais ce n'est pas rien :

1. La couche **vraiment** réutilisable telle quelle est **`cli/src/lib/bullet.js`** (`today`,
   `isEntryLine`, `entryContent`, `appendBullet`, `measure`, `serializeLines`) : elle est générique,
   sans notion de cible, et `memory.js` la consomme déjà (`memory.js:10`). C'est **elle** la primitive
   « puce datée idempotente », et c'est **elle** qu'on réutilise.
2. Il faut un module mince **`cli/src/lib/projectCanon.js`** qui refait sur `bullet.js` ce que
   `memory.js` fait pour le global, avec **son** vocabulaire (une cible : `produit`), **son** plafond,
   **son** layout minimal. ~120 lignes, calquées, zéro dépendance.

**Pourquoi ne PAS élargir `TARGETS` dans `memory.js`** (option écartée, motif tracé) : cela rendrait
`memoryAdd(home, 'produit', …)` légal sur le canon **global**, donc rendrait possible d'écrire de la
connaissance produit dans `~/.iaka/memory/` — l'exact inverse de l'étanchéité qu'on grave en § 4.3.
La séparation des modules **est** le garde-fou.

### 3.4 FAIT CONFIRMÉ, et arbitré — « capturer à la reprise » ≠ « rattraper une clôture manquée »

`cadence.js:3-4` : la cadence se déclenche sur `pause|version` et **jamais** sur `reprise`, au motif que
*« la reprise charge le canon, elle ne capture pas »*. Le décideur demande qu'une clôture manquée soit
rattrapée à la reprise. Le brief demande d'arbitrer si c'est une contradiction.

**Ce n'en est pas une, et la distinction est nette** :

- **Capturer à la reprise** = analyser la session *qui commence*. C'est absurde (elle n'a rien produit)
  et la conception a raison de le refuser. **On ne touche pas à cette règle.**
- **Rattraper une clôture manquée** = exécuter, au moment de la reprise, **la clôture de la session
  PRÉCÉDENTE**, restée ouverte. L'objet analysé n'est pas la session qui s'ouvre : c'est **une session
  passée**, close en retard.

Ce sont deux gestes différents sur deux objets différents. `cadence.close_on` reste **`['pause','version']`
et n'accueille jamais `reprise`** ; le rattrapage est un **geste distinct**, `catchUp`, déclenché sur
`reprise`, qui **ne s'exécute que si un marqueur de session non close existe** — sinon il ne fait
strictement rien. Un `reprise` sans dette de clôture reste donc exactement ce qu'il est aujourd'hui.

`cadence.js:8` — *« la cadence ne doit JAMAIS casser le rituel »* — s'applique **à l'identique** au
rattrapage : dégradation gracieuse, erreur ravalée dans le rapport, jamais propagée.

Le marqueur n'existe pas : **confirmé**, `close()` (`close.js:309-313`) retourne
`{ ok, home, proposalsDir, analyzed, emitted, skipped }` — ni `lastClose`, ni `pending`, ni `since`.
Il est à créer (§ 6).

### 3.5 FAIT CONFIRMÉ — la détection de contradiction n'a aucun équivalent

`rulesAnalyzer` (`close.js:108-144`) compte des **occurrences répétées** dans un corpus **unique** (les
transcripts), par appariement de clé normalisée. Rien n'y compare **deux corpus**. La brique est
neuve. Le risque de bruit est traité frontalement en § 7.

### 3.6 FAIT INFIRMÉ — une des deux instructions en attente n'existe pas

Le brief annonce deux instructions en attente d'arbitrage : `outillage-scrub-miroir-frame.md` et
`resorption-porteurs-gabarit-verdict-perime.md`.

- `specs/instructions/outillage-scrub-miroir-frame.md` — **existe**, confirmé.
- `specs/instructions/resorption-porteurs-gabarit-verdict-perime.md` — **N'EXISTE PAS.** Absent du glob
  des 70 instructions ; `Glob` sur `*resorption*` ne renvoie rien ; `Grep` sur `resorption|verdict-perime`
  dans tout le dépôt ne renvoie **aucun fichier**.

Soit elle n'a jamais été écrite, soit elle porte un autre nom. **À signaler au décideur** : si ce
cadrage était attendu, il est manquant. **Aucun recouvrement** de ma part avec l'un ou l'autre : mon
périmètre ne touche ni le scrub de miroir de frame, ni les porteurs de gabarit.

---

## 4. Solution — architecture (options structurantes + recommandation)

### 4.1 Où vit le canon projet ? — **arbitrage AR-1**

Le décideur a dit « dans le projet », donc **versionné**, revu en diff, suivant le produit. Trois
options :

| | Chemin | Pour | Contre |
|---|---|---|---|
| **A** | `specs/canon/PRODUIT.md` | Sous `specs/` = déjà l'espace de réflexion versionné ; voisin de `PROJET.md`/`etat-des-lieux.md` ; précédent d'un fichier machine sous `specs/` (`specs/.iakaframe-journal.json`) | Un dossier de plus |
| **B** | `specs/CANON.md` (fichier nu) | Le plus simple | Aucune place pour la config/le futur ; renommage garanti au premier ajout |
| **C** | `.iaka/canon/` à la racine | Symétrie avec `~/.iaka/memory/` | Dossier caché **versionné** = invisible en revue, contraire à « revu en diff » |

**Recommandation : A** — `specs/canon/PRODUIT.md`, + `specs/canon/config.yaml` (plafond) si besoin.
Le dossier, plutôt que le fichier nu, parce que le plafond dur **impose** une consolidation, laquelle
finira par vouloir un fichier d'archive : autant ne pas renommer plus tard.

> **Le problème que ça pose, et il est réel — à dire au décideur, pas à masquer.** Une connaissance
> produit apprise sur le terrain contient volontiers des **observations rugueuses** (« cette API rend
> n'importe quoi », « ce module a été fait à l'arrache »). Versionné = **poussé sur Forgejo**, lisible
> par quiconque clone. Deux mitigations, cumulables :
> 1. **Invariant de contenu (§ 4.3)** : le canon projet ne parle **que du produit**, jamais des
>    personnes. « Le module X n'est pas couvert par les tests » est un fait produit ; « Y a bâclé X »
>    n'a rien à y faire.
> 2. **La garde de consentement (§ 8) est ce qui rend ça tenable** : rien n'entre sans le décideur.
>    C'est précisément parce que le canon est **poussé** que l'écriture automatique y est plus
>    dangereuse que dans le canon global local — d'où la recommandation AR-4.

### 4.2 Réutilisation — ce qu'on écrit, ce qu'on ne réécrit pas

| Brique | Réutilisée ? |
|---|---|
| `lib/bullet.js` (puce datée idempotente, `measure`, `serializeLines`) | **Telle quelle** |
| `lib/memory.js` | **Non réutilisée, non modifiée** (§ 3.3) — le vocabulaire global y reste borné |
| `lib/close.js` — `readEntries`, `normalizeKey`, `slugify`, `writeProposalDir`, `renderProposal` | **Réutilisées** |
| `lib/close.js` — `rulesAnalyzer`, `looksLikeCorrection` | **NON réutilisées** (§ 7 — c'est le piège) |
| `lib/review.js` (garde de consentement, `proposals/`) | **Réutilisée** — le réservoir global accueille les propositions produit |
| `lib/cadence.js` | **Étendue** (rattrapage), `close_on` inchangé |
| `commands/snapshot.js` | **Point de greffe** — `doSnapshot({ projectPath, reason })` a déjà les deux entrées nécessaires |

> **Point d'appui décisif, à ne pas rater** : `doSnapshot` (`snapshot.js:43`) reçoit **déjà**
> `projectPath` **et** `reason`, et appelle la cadence en fin de rituel (`snapshot.js:156-158`). Le
> canon projet se résout donc **sans nouvelle plomberie** : `projectCanonHome(projectPath)`. C'est ce
> qui rend le lot petit.

### 4.3 Invariants à graver

1. **Le canon projet ne parle QUE du produit.** Un fait sur le décideur va au canon **global**. C'est
   ce qui empêche le canon projet d'être un silo (§ 3.1) et limite l'exposition sur Forgejo (§ 4.1).
2. **Le canon global reste chargé partout, inconditionnellement.** `open.js` n'est pas modifié dans son
   principe : le canon projet **s'ajoute**, il ne remplace **jamais**.
3. **Le canon projet ne réécrit jamais `PROJET.md` ni `etat-des-lieux.md`.** Il constate, il ne
   documente pas (frontière avec la mémoire humaine / 📖 Nathalie).
4. **Substrat neutre.** Markdown plat, zéro dépendance, aucun couplage runner. L'interdit
   `~/.claude/` (`memory.js:19,41-46`) est **hors sujet ici** (on écrit dans le dépôt), mais l'esprit
   vaut : rien de spécifique à un runner dans le canon projet.
5. **Plafond dur.** Le canon projet est **plafonné** comme le global. C'est le plafond qui **force** la
   révision : sans lui, on retombe mécaniquement sur la main courante que le décideur refuse.

---

## 5. Découpage — le cœur irréductible et le reste

**MVP d'abord.** Le décideur a décrit un mécanisme complet ; ça ne veut pas dire tout livrer d'un coup.

| Lot | Contenu | Statut |
|---|---|---|
| **A — cœur irréductible** | Canon projet + révision en place + plafond + cadence de clôture + marqueur + rattrapage à la reprise + garde de consentement | **À engager** |
| **B — contradiction par ancrage** | Détection **déterministe** de divergence specs↔canon (§ 7), interaction, mode headless | **À engager après A**, séparément |
| **C — contradiction sémantique** | Analyse de langage / LLM sur le contrat `analyze()` | **NON RECOMMANDÉ au MVP** (§ 7.4) |

**Le lot A se suffit à lui-même et tient la promesse centrale** (« incrémentale modifiée, pas une main
courante », écrite en clôture, rattrapée à la reprise). Le lot B est la troisième phrase du décideur ;
il est réel mais **séparable**, et le séparer protège A du risque de bruit.

---

## 6. Lot A — spécification

### 6.1 Le marqueur de session non close — **arbitrage AR-2**

Le rattrapage exige de savoir qu'une session s'est fermée sans rituel. Où vit ce marqueur ?

| | Emplacement | Pour | Contre |
|---|---|---|---|
| **A** | `specs/canon/.session.json` (dans le projet, **versionné**) | Voyage avec le projet | **Bruit de diff à chaque session** ; **conflits de merge** garantis ; état machine dans l'historique produit |
| **B** | `~/.iaka/memory/sessions/<clé-projet>.json` (**local, non versionné**) | Zéro bruit git, zéro conflit ; état machine à sa place ; réutilise le canon global comme espace machine | Ne voyage pas de machine en machine (une dette de clôture ne suit pas un `git clone`) |

**Recommandation : B.** Le contre de B est **bénin** : une dette de clôture est un fait **local à une
machine et à une session**. Le contre de A est **structurel** : un fichier d'état muté à chaque
ouverture, versionné et poussé, produit du conflit de merge et du bruit de revue **à perpétuité** — et
contredit « revu en diff », qui suppose que le diff ait un sens.

**Clé de projet** : chemin absolu du projet, normalisé et haché — jamais le nom nu (deux `iakaHub` sur
deux chemins existent, cf. `/Users/sjupin/work/IakaProject/projects/iakaHub/`).

**Contenu** : `{ projectPath, openedAt, lastCloseAt, lastCloseReason, pending: bool }`.

**Plusieurs sessions enchaînées sans rituel** — le brief demande ce qu'on en fait. **Le marqueur ne
s'empile pas** : `openedAt` est écrasé, `pending` reste `true`. Motif : `close` **rejoue les
transcripts** (`close.js:265-267`), qui sont cumulatifs — un rattrapage couvre donc **toute la période
non close** en une passe, quel que soit le nombre de sessions. Empiler N marqueurs produirait N
rattrapages redondants sur le même corpus, et `pendingExists` (`close.js:197-209`) les dédupliquerait
de toute façon. **Un seul marqueur, une seule dette.**

### 6.2 Écriture du canon — **arbitrage AR-3 : qui écrit ?**

Le brief a raison : sans trancher, personne ne le fera.

| | Porteur | Pour | Contre |
|---|---|---|---|
| **A** | **Le coordinateur projet** (🟠 Aragorn) | Il voit passer toute la matière de la session ; le canon **global** est déjà tenu par le coordinateur portefeuille (Odin) → **symétrie exacte** ; conforme à la règle « rôle non couvert → coordinateur » | **Touche `library/personas/aragorn.md` → vendoré → re-vendorage (§ 9)** |
| **B** | Le cadreur (Gandalf) | Il tient déjà les specs | **Faux** : le cadreur cadre en amont, il n'assiste pas à la clôture ; et son bornage d'écriture est `specs/instructions/` **seul** |
| **C** | La CLI seule, sans porteur nommé | Zéro impact vendorage | **C'est exactement le défaut d'aujourd'hui** : un geste que personne ne porte n'est pas exécuté |

**Recommandation : A** — le **coordinateur projet**, en symétrie stricte avec Odin sur le canon global.
C'est la seule option qui répond à « il faut trancher, sinon personne ne le fera ». **L'impact
vendorage est réel et assumé** (§ 9) — je le signale plutôt que de choisir C pour l'éviter, parce que
choisir C reviendrait à livrer un mécanisme que rien ne déclenche.

### 6.3 Critères d'acceptation — Lot A

**Nominal**

1. `projectCanonHome(projectPath)` résout `<projectPath>/specs/canon/` ; **aucun** chemin en dur ;
   fonctionne sur un projet **sans** `specs/PROJET.md` (cas `iakaframe`, § 3.2).
2. `ensureProjectCanon(home)` crée `specs/canon/PRODUIT.md` avec son en-tête, **et rien d'autre** —
   en particulier **ni `transcripts/`, ni `proposals/`, ni `PROFIL.md`, ni `REGISTRE.md`** dans le
   projet. Idempotent : **n'écrase jamais** un fichier existant.
3. `produitAdd` / `produitReplace` / `produitRemove` sont **idempotents** et **keyés sur le contenu**
   (préfixe de date ignoré à l'appariement), à la parité stricte de `memoryAdd/Replace/Remove`.
4. **`produitReplace` est la fonction qui porte la promesse du lot** : elle **corrige une entrée en
   place** et **re-date** la ligne. Un test vérifie qu'après révision, **la formulation antérieure
   n'est plus présente dans le fichier** — c'est la différence testable d'avec une main courante.
5. Plafond **dur** appliqué : une croissance au-delà du plafond est **refusée** avec
   `reason: 'cap-exceeded'` ; le plafond est lu depuis la config, **jamais `undefined`** (cf. le piège
   `evalCap` § 3.3).
6. `reason=pause|version` sur un projet → la clôture traite **aussi** le canon projet ; le marqueur
   passe à `pending: false` et `lastCloseAt` est renseigné.
7. `reason=reprise` **avec** marqueur `pending: true` → le rattrapage s'exécute, journalise
   `rattrapage : clôture différée exécutée (session ouverte le <date>)`, et remet `pending: false`.
8. `reason=reprise` **sans** marqueur pendant → **aucun effet**, aucune écriture, aucune proposition.
   Comportement **identique à aujourd'hui**. Un test le verrouille explicitement.
9. `cadence.close_on` **reste `['pause','version']`** et **n'accueille jamais `reprise`**. Un test
   vérifie que la valeur par défaut est inchangée (§ 3.4).
10. Le canon **global** reste chargé quel que soit le répertoire ; le canon projet **s'ajoute** au
    rendu. Un test vérifie qu'en présence d'un canon projet, le contenu global est **toujours** rendu.

**Défaut**

11. **Projet sans canon** → la clôture le **saute gracieusement**, sans créer le canon par effet de
    bord (parité `canonExists`, `cadence.js:26-28`). Le rituel réussit.
12. **`specs/` absent / non inscriptible / dépôt en lecture seule** → incident **journalisé**, rituel
    **réussi**. Aucune exception propagée (`cadence.js:8`).
13. **Marqueur illisible ou corrompu** → traité comme **absent** ; aucun crash ; le rituel réussit.
14. **N sessions enchaînées sans rituel** → **un seul** rattrapage, couvrant toute la période (§ 6.1).
15. Le canon projet est **plafonné indépendamment** du canon global ; saturer l'un n'affecte pas
    l'autre.
16. **Aucune écriture hors `<projet>/specs/canon/`** et du marqueur local. En particulier : `PROJET.md`
    et `etat-des-lieux.md` sont **inchangés** (invariant § 4.3-3), vérifié par test.

---

## 7. Lot B — la détection de contradiction, et le piège à éviter

### 7.1 L'avertissement du brief est fondé — et il faut en tirer la conséquence

`~/work/BACKLOG.md` documente un défaut **constaté sur données réelles** le 17/07 : *« `close` mine
aussi les réponses de l'agent (pas que les messages de Stéphane) → quand Odin recopie le backlog, ces
lignes sont minées ; `CORRECTION_CUES` trop laxiste — "non codé" matche le motif `non\s` et passe pour
une correction. Résultat : 2 propositions parasites. »*

Le défaut est **visible dans le code** : `close.js:90-94`, `CORRECTION_CUES` contient `/\bnon[,\s]/i` —
qui matche « non codé », « non planifié », « non bloquant »… ; et `close.js:138-141` applique
l'heuristique à **toute** entrée, sans distinguer l'émetteur.

**La conséquence à en tirer est structurante** : une détection de contradiction bâtie sur des
heuristiques de langage produira le même bruit **en pire**, parce qu'elle compare **deux** corpus au
lieu d'en miner un. Et un gate bruyant **finit désactivé** — c'est-à-dire que le mécanisme entier
meurt. Le risque n'est pas « quelques faux positifs » : c'est **la perte du lot**.

### 7.2 La méthode retenue — l'ANCRAGE, pas le langage

**Ne pas chercher la contradiction dans le sens des phrases. La chercher dans l'ancrage.**

Une entrée du canon projet peut porter une **ancre explicite** vers ce qu'elle constate :

```
- 2026-07-21 — [ancre: specs/PROJET.md#stack] le front est en React 18, pas 19 : le passage
  a été tenté puis annulé (incompatibilité react-grid-layout).
```

Le détecteur ne lit **pas** le français. Il fait un travail **déterministe** :

1. Pour chaque entrée **ancrée**, résoudre la cible (fichier, éventuellement section).
2. **La cible a-t-elle changé depuis la date de l'entrée ?** (horodatage git / mtime de la section).
3. Si oui → **signaler**, avec les deux extraits, et **demander**. Si non → **rien**.

**Ce que ça achète** : zéro heuristique de langage, donc **zéro faux positif du type « non codé »**.
Le signal est **binaire et vérifiable** : soit la spec ancrée a bougé après l'écriture de l'entrée,
soit non. Le décideur n'est sollicité que sur des couples **réellement** désynchronisés.

**Ce que ça coûte** : la détection **ne voit que les entrées ancrées**. C'est un coût **assumé et
recommandé** — mieux vaut un détecteur qui voit peu et ne ment jamais qu'un détecteur qui voit tout et
dérange à chaque clôture. L'ancre est posée au moment de la revue de consentement (§ 8), donc par un
geste déjà humain : **elle ne coûte rien de plus**.

### 7.3 Sur quoi porte la détection ? — **arbitrage AR-5**

**Recommandation : `specs/PROJET.md` UNIQUEMENT au lot B.** Motifs : c'est le seul document
d'**intention** stable ; les **instructions** (`specs/instructions/`) sont par nature **datées et
dépassées une fois livrées** — une instruction close **doit** diverger du terrain, ce n'est pas une
contradiction mais l'ordre normal des choses. Les inclure produirait du bruit **par construction**.

Corollaire mesuré (§ 3.2) : `PROJET.md` étant absent ou vide dans une bonne part des projets, la
détection sera **souvent sans objet** — et c'est **acceptable** : sans intention écrite, il n'y a rien
à contredire. Le détecteur se tait.

### 7.4 Que fait-elle quand elle doute ? Et en headless ? — **arbitrage AR-6**

**Elle ne tranche jamais.** Une divergence détectée **n'écrit rien** : elle **dépose une proposition
typée** dans le réservoir existant (`proposals/`, `review.js`), avec les deux extraits et leurs
`chemin:ligne`.

- **En interactif** : le rituel affiche `contradiction : N point(s) à synchroniser -> iakaframe review list`.
  Le décideur tranche **quand il veut** — la revue est déjà le geste prévu pour ça.
- **En headless / non interactif** : **rien ne bloque, rien ne s'écrit, rien ne s'affiche en bloquant.**
  La proposition est déposée ; `loadCanon` (`open.js:31-36`) **rappelle déjà** les propositions en
  attente à l'ouverture suivante. **Le mécanisme de report existe donc déjà** : on n'invente pas
  d'interaction, on se branche dessus.

C'est la lecture stricte de « synchroniser au besoin avec le user » : **la machine signale, l'humain
synchronise.** Elle ne « synchronise » jamais d'elle-même.

### 7.5 Ce que la détection ne saura PAS voir — limites à assumer devant le décideur

À dire explicitement, parce qu'un détecteur dont on croit qu'il voit tout est plus dangereux qu'un
détecteur dont on connaît les angles morts :

1. **La contradiction sémantique non ancrée.** Deux textes qui se contredisent **dans des mots
   différents**, sans ancre, sont **invisibles**. C'est la limite principale et elle est structurelle.
2. **La contradiction par omission.** La spec dit X, le canon est **muet** sur X. Rien à comparer :
   invisible. (Et c'est heureux — sinon tout silence serait une alerte.)
3. **Le sens de la divergence.** Le détecteur dit *« ces deux-là ont divergé »*, **jamais** *« c'est le
   canon qui a tort »*. Il **ne peut pas** arbitrer, et ne doit pas essayer : c'est précisément le
   `PROJET.md`-fait-foi-sur-l'intention / canon-fait-foi-sur-le-terrain du § 3.2, qui n'est
   **décidable que par le décideur**.
4. **Une spec fausse dès l'origine.** Si `PROJET.md` n'a **jamais** changé, aucune divergence n'est
   signalée — même si l'intention était erronée depuis le début. Le détecteur mesure du **mouvement**,
   pas de la **vérité**.
5. **Les entrées non ancrées** (§ 7.2) — invisibles par construction.
6. **Ce qui est hors `PROJET.md`** (§ 7.3) : contradiction avec le code réel, les tests, une décision
   orale, un autre projet. Hors périmètre.
7. **Une ancre qui pourrit.** Section renommée, fichier déplacé → l'ancre ne résout plus. Traité comme
   **« ancre non résolue »**, signalé une fois, **jamais** comme contradiction — sinon tout
   refactoring de `PROJET.md` déclencherait une alerte de masse.

### 7.6 Critères d'acceptation — Lot B

17. Une entrée ancrée dont la cible **n'a pas changé** depuis sa date → **aucune** proposition.
18. Une entrée ancrée dont la cible **a changé** après sa date → **une** proposition `contradiction`,
    portant les deux extraits en `chemin:ligne`.
19. **Aucune proposition n'est générée par analyse de langage.** Test de non-régression du défaut du
    17/07 : un canon et un `PROJET.md` contenant « non codé », « non planifié », « pas comme prévu »
    **sans ancre** → **zéro** proposition. `looksLikeCorrection` / `CORRECTION_CUES` ne sont **pas**
    dans le chemin d'exécution du lot B.
20. Une **ancre non résolvable** (fichier ou section absent) → signalée **une seule fois**, jamais
    comme contradiction ; jamais de crash.
21. **`PROJET.md` absent** (cas mesuré, § 3.2) → détecteur **silencieux**, rituel réussi.
22. **Mode headless** : dépôt de proposition, **aucun blocage**, aucune attente d'entrée, code de
    sortie inchangé. Rappel à l'ouverture suivante via `loadCanon`.
23. La détection **n'écrit jamais** dans `PRODUIT.md` ni dans `PROJET.md` — **uniquement** dans
    `proposals/`.

---

## 8. Garde de consentement — **arbitrage AR-4**

Le brief demande si la garde du canon global s'applique à l'identique. Politique actuelle
(`review.js:8-13`) : `profil` **toujours en file**, `registre` **auto** si `write_approval: auto`,
structurels (`skill`/`hook`/`config`) **toujours en file, jamais auto**.

| | Politique pour le canon projet | Analyse |
|---|---|---|
| **A** | Calquer `registre` → **auto-applicable** | **Écrit automatiquement dans un fichier versionné, qui sera poussé.** Un faux positif devient un **commit** |
| **B** | Calquer `profil` → **toujours en file** | Rien n'entre sans le décideur. Coût : une revue par clôture |

**Recommandation : B — toujours en file, sans exception.** La différence avec le canon global est
matérielle et décisive : le canon global est un fichier **local** dans `~/.iaka/` ; le canon projet est
**versionné et poussé sur Forgejo**. Une entrée erronée n'y est pas une ligne à corriger, c'est une
**ligne d'historique public**. La garde y est donc **plus stricte**, pas identique.

C'est aussi ce qui rend l'exposition du § 4.1 tenable : **rien n'atteint le dépôt sans que le décideur
l'ait lu.** Et c'est au moment de cette revue qu'il **pose l'ancre** (§ 7.2) — le geste est déjà là,
on n'en ajoute pas.

> **Symétrie ajout/suppression.** Tout ce qui s'ajoute par `produitAdd` doit se retirer par
> `produitRemove` ; toute commande CLI d'ajout a son pendant de retrait.

---

## 9. Impact vendorage — à traiter dans le lot, pas après

**`vendor-check` doit rester `clean`.**

- **Lot A/B — code CLI (`cli/src/lib/`, `cli/src/commands/`, `cli/test/`) : AUCUN impact vendorage.**
  Ces chemins ne sont pas vendorés.
- **AR-3 recommandation A (le coordinateur porte le geste) → IMPACT RÉEL.** Cela amende
  `library/personas/aragorn.md`, qui **est vendoré** (17 copies + 4 dérivées). **Le re-vendorage est à
  prévoir DANS le lot**, pas après : l'exécutant amende le persona **puis** re-vendore **puis** vérifie
  que `vendor-check` revient `clean`. C'est un **critère de sortie du lot**.
- **AUCUN nouveau principe.** Le lot **n'ajoute pas** de fichier dans `library/principles/` — j'ai
  compté **18 fichiers**, conforme au brief. Ajouter le 19ᵉ porterait `principleIds` de 18 à 19 et
  **casserait les 2 fixtures de méthode**, ce qui a fait écarter cette option au lot Q-3 le même jour.
  **La règle du canon projet ne devient PAS un principe** : elle vit dans le contrat du coordinateur et
  dans l'instruction. Si le décideur veut malgré tout un principe, **c'est un lot séparé** avec sa
  cascade de fixtures assumée.
- **Aucun autre chemin vendoré touché** : ni `bindings/`, ni goldens, ni `methods/`, ni `teams/`.
- **Doc des commandes** : toute commande CLI ajoutée est à répercuter dans `docs/commandes.md` **dans le
  même lot**.

---

## 10. Ce que je n'ai PAS pu vérifier — `Bash` indisponible

Repris du brief d'Odin, **non revérifié**, à confirmer par l'exécutant qui, lui, a `Bash` :

- `vendor-check` = `clean` (`OK - 17 copies + 4 derivees`).
- Suite CLI : `tests 377 / pass 376 / fail 0 / skipped 1`.
- Le contenu de `~/work/BACKLOG.md` cité en § 7.1 (le **défaut de code correspondant**, lui, est
  **vérifié directement** dans `close.js:90-94` et `:138-141`).
- L'état git du dépôt (dette de commits, etc.).

**Ces chiffres sont un état de départ à re-mesurer avant de commencer**, pas un acquis.

---

## 11. Délégable / geste humain

| Geste | Nature |
|---|---|
| `projectCanon.js`, extension `cadence.js`, marqueur, greffe `snapshot.js`, tests | **Délégable** (⚒️ Gimli) |
| Détecteur d'ancrage + tests de non-régression du bruit (§ 7.6-19) | **Délégable** |
| Amendement `library/personas/aragorn.md` + **re-vendorage** + `vendor-check` clean | **Délégable**, mais **vérification humaine** attendue |
| **Arbitrages AR-1..AR-6** | **Geste humain — décideur** |
| **Revue des propositions** du canon projet à chaque clôture (§ 8) | **Geste humain — récurrent, par conception** |
| Commit / push du canon projet | **Geste humain** |

---

## 12. Estimation

| | Équivalent j-h | Complexité / risque |
|---|---|---|
| **Lot A** — cœur irréductible | **2,5 – 3 j-h** | **Modérée.** Calque d'un moteur existant, greffe déjà en place (`doSnapshot` a `projectPath` + `reason`). Le point délicat est le **marqueur** (cycle de vie, cas dégradés), pas le canon. |
| **Lot B** — contradiction par ancrage | **1,5 – 2 j-h** | **Élevée** — pas techniquement, mais en **conception** : c'est une brique sans équivalent (§ 3.5) et sans état de l'art (§ 2.1). Le risque est de **glisser vers l'heuristique** sous prétexte de « voir plus ». |
| **Lot A+B** | **4 – 5 j-h** | + re-vendorage AR-3 : **+0,5 j-h** si le décideur retient A. |

**Inconnues susceptibles de faire glisser l'estimation**

1. **AR-3 (porteur)** : si le décideur veut le geste **dans les personas de toutes les teams** et pas
   du seul coordinateur, la cascade de vendorage s'élargit → **+1 j-h**.
2. **Résolution d'ancre par section** (`#stack`) plus coûteuse que par fichier : parsing de titres +
   suivi des renommages. Repli MVP = **ancre au fichier seul** → borne le risque.
3. **Détection du changement** : si l'exécutant s'appuie sur git plutôt que sur `mtime`, il faut gérer
   dépôt absent, arbre sale, fichier non suivi → **+0,5 j-h**.
4. **Le format d'ancre** est une **convention** : s'il change après coup, les entrées déjà écrites sont
   à reprendre. À figer **avant** le lot B.
5. **Le plafond du canon projet** n'est pas mesurable a priori — un projet de 700 lignes de `PROJET.md`
   (IakaCockpit) n'a pas le même volume qu'`iakaHub`. Le premier réglage sera **empirique** et la
   consolidation pourrait demander un passage supplémentaire.
6. Les chiffres du § 10, non vérifiés, peuvent révéler un état de départ différent.

> **Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au temps
> réel à la clôture du lot.

---

## 13. Arbitrages laissés au décideur

| # | Question | Recommandation |
|---|---|---|
| **AR-1** | Emplacement du canon projet | **`specs/canon/PRODUIT.md`** (§ 4.1) — avec l'exposition Forgejo assumée et mitigée |
| **AR-2** | Emplacement du marqueur de session non close | **Local non versionné**, `~/.iaka/memory/sessions/` (§ 6.1) |
| **AR-3** | Qui porte le geste d'écriture | **Le coordinateur projet**, symétrie avec Odin — **avec re-vendorage** (§ 6.2, § 9) |
| **AR-4** | Garde de consentement | **Toujours en file**, plus stricte que le canon global, parce que versionné+poussé (§ 8) |
| **AR-5** | Périmètre de la détection | **`PROJET.md` seul** ; **pas** les instructions (§ 7.3) |
| **AR-6** | Comportement en doute / headless | **Ne tranche jamais** ; dépose au réservoir ; rappel à l'ouverture (§ 7.4) |
| **AR-7** | Découpage | **A d'abord, B ensuite** ; **C non recommandé** (§ 5) |

---

## 14. Hors périmètre

- Toute **documentation utilisateur** ou **mémoire humaine** (→ 📖 Nathalie).
- Toute modification de `specs/PROJET.md` par la machine.
- Tout **nouveau principe** dans `library/principles/` (§ 9).
- Toute modification du **comportement du canon global** au-delà de l'accueil des propositions produit.
- `outillage-scrub-miroir-frame.md` : **non touché**, aucun recouvrement.
