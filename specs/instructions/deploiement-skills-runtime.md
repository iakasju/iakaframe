# Déploiement des skills du canon vers le runtime — parité, activation, garde (R8)

> Instruction de cadrage (Gandalf, P1). **Lecture seule** sur le code ; ce fichier est le seul
> artefact produit. Aucun code ici : spec fermée pour un lot d'exécution.
>
> **Cette instruction REMPLACE `parite-skills-generateur-deploiement.md`** (gelée : 3 FAIL, jamais
> gatée PASS, périmée par deux évolutions du canon — lot Gimli `fabrication`, lot Fëanor). Le fichier
> gelé est marqué *superseded* et conservé pour sa **trace d'arbitrages décideur**, tous reconduits
> ici par référence (§ 4). **Rien n'est repris sans re-mesure sur le disque** (`preuve-avant-declaration`).
>
> **État mesuré le 2026-07-27** (Gandalf) directement sur `library/`, `~/.claude/` et `cli/`.

## 0. Le problème (R8) — la couche skills est inerte au runtime, et le canon a grossi

Le besoin R8 : que le **canon des skills** (`library/skills/`) soit **réellement actif** dans le
runtime `~/.claude/`. L'audit de la gelée avait établi trois faits structurels ; **je les ai
revérifiés le 2026-07-27, ils tiennent tous les trois** :

- **Fait 1 — le contrat déployé ne porte pas `skills:`.** `renderAgentContract`
  (`cli/src/lib/generate-agents.js:55-66`) n'émet que `name`, `description`, `tools?`, `guardrails`.
  Le `skills:` de la persona canon est **lu nulle part**. Vérifié en direct : le contrat déployé
  `~/.claude/agents/gandalf.md:4` = `tools: Read, Grep, Glob, Write, Edit, WebSearch, WebFetch`,
  **sans ligne `skills:`** ; idem le golden `cli/test/fixtures/agents-golden/gandalf.md`.
- **Fait 2 — le runner Claude Code supporte pourtant ce champ.** Vérifié sur le web le 2026-07-27
  (§ 9) : le champ `skills:` du frontmatter d'un subagent **précharge le contenu intégral** des
  skills dans le contexte au démarrage (« full skill content is injected »). Le canon déclare
  l'information correcte, le générateur la **jette**.
- **Fait 3 — les personas ne peuvent pas non plus invoquer une skill.** **Aucune** des 9
  assignations du binding (`bindings/iakaframe-claude-default.md:8-16`) ne porte `Skill`, et chacune
  a une allowlist explicite (donc n'hérite pas de l'outil).

> **Conclusion (inchangée) :** un lot qui ne ferait que rafraîchir les copies déposées dans
> `~/.claude/skills/` **livrerait une dette réglée sur le papier et un runtime toujours muet** — les
> subagents ne préchargeraient (Fait 1) ni n'invoqueraient (Fait 3) aucune skill. R8 exige de traiter
> **projection + accès + déploiement + parité**, ensemble.

**Ce que la gelée ignorait, et que la mesure du 27/07 impose d'ajouter** : le canon a gagné **une 9ᵉ
persona (Fëanor)** et **trois skills** (`iakaframe-fabrication`, `iakaframe-frame`,
`iakaframe-lecture-maquettes`) — dont **la skill maquettes de Gandalf** et **la skill de forge de
Fëanor**, explicitement visées par R8. Le lot doit donc réveiller **quatre** gestes, pas un :
`iakaframe-jalon`, `iakaframe-fabrication` (+ sa chaîne), `iakaframe-frame`, `iakaframe-lecture-maquettes`.

## 1. État mesuré le 2026-07-27 (sur pièces)

### 1.1 Roster : canon 9 ↔ runtime 8

| | Canon `library/personas/` | Runtime `~/.claude/agents/` |
|---|---|---|
| Personas | **9** (odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie, **feanor**) | **8** — **`feanor.md` ABSENT** (odin/aragorn/gimli/gandalf/nathalie vérifiés présents ; legolas/helm/loki présumés présents) |
| Golden `cli/test/fixtures/agents-golden/` | **9** (`feanor.md` présent, sha `d2f9491…`) | — |

> **La chaîne de parité connaît Fëanor (golden 9), le runtime live non (8).** Cause mécanique :
> `fullteam` **exclut** Fëanor (`cli/src/lib/agents.js:75` `EXPLICIT_ACTIVATION_PERSONAS = ['feanor']`,
> filtré `:194`) et `agents generate --global` — qui, lui, itère la team 9 (`generateAll`,
> `generate-agents.js:98-108`) **incluant** Fëanor — n'a pas été rejoué globalement depuis l'ajout.

### 1.2 Skills : canon 26, README périmé à 23

- **Canon = 26 skills.** `library/skills/README.md:3` annonce « Vingt-trois skills » et affirme
  encore « **Gimli n'a pas de skill** » (`:31`) — **doublement faux** : Gimli porte
  `iakaframe-fabrication`, et le canon compte les 23 énumérées **+ `iakaframe-fabrication` +
  `iakaframe-frame` + `iakaframe-lecture-maquettes`** = **26** (les trois nouvelles vérifiées
  existantes sur disque).
  > ⚠️ Le nombre **26** est reconstruit (23 énumérées au README + 3 mesurées), faute d'outil de
  > listage de répertoire dans la session de cadrage (ripgrep indisponible → ni `ls`, ni Glob, ni
  > Grep). L'exécutant **confirmera le compte exact** par un listage de `library/skills/` avant de
  > figer le golden ; c'est précisément ce que la garde de parité fixera ensuite.
- **Absences au runtime confirmées par sonde directe** (`File does not exist`) :
  `~/.claude/skills/iakaframe-jalon/`, `-frame/`, `-fabrication/`, `-lecture-maquettes/`,
  `-memoire-humaine/`, `-gestion-de-source/` — **toutes absentes**.
- **Dérive d'une copie présente** : `~/.claude/skills/iakaframe-aragorn/SKILL.md` est déployée mais
  son frontmatter **ne porte pas** le `subskills: [iakaframe-jalon]` que le canon déclare
  (`library/skills/iakaframe-aragorn/SKILL.md:5`) → copie **périmée**.
- **Résidus « slack »** : la gelée les localisait dans les copies déployées d'`iakaframe-aragorn`
  (5 occ.) et `iakaframe-odin` (2 occ.). Le redéploiement depuis le canon **purge Aragorn** (canon
  propre) ; le **canon d'Odin porte encore Slack** (`BACKLOG.md` item « 13 scories Slack »,
  `library/skills/iakaframe-odin/SKILL.md`, 2 occ.) → traité en § 6, **hors ce lot**.

### 1.3 L'union déployable (recalculée sur le canon 9-personas)

Règle (reconduite, § 4) : **ensemble à déployer sur une cible = union des `resolveSkills(p)` pour
toute persona `p` dont le contrat est déployé sur cette cible.** Résolution **transitive**.

Entrées mesurées (`skills:` des personas + `subskills:` des skills, relevés le 27/07) :

| Persona | `skills:` canon | subskills traversés |
|---|---|---|
| odin | `[iakaframe-odin, iakastart]` | odin→iakastart |
| aragorn | `[iakaframe-aragorn]` | aragorn→jalon |
| gandalf | `[iakaframe-cadrage, iakaframe-lecture-maquettes]` | cadrage→jalon ; lecture-maquettes→(∅) |
| gimli | `[iakaframe-fabrication]` | fabrication→{gestion-de-source, conteneurisation, jalon} ; gestion-de-source→git ; git→forgejo ; conteneurisation→docker |
| legolas | `[iakaframe-qualite]` | ∅ |
| helm | `[iakaframe-deploiement]` | ∅ |
| loki | `[iakaframe-naonedge]` | ∅ |
| nathalie | `[iakaframe-nathalie, iakaframe-memoire-humaine]` | memoire-humaine→appflowy-doc |
| feanor | `[iakaframe-frame]` | frame→jalon |

**Union transitive sur les 9 = 19 skills :**

`iakaframe-odin` · `iakastart` · `iakaframe-aragorn` · `iakaframe-jalon` · `iakaframe-cadrage` ·
`iakaframe-lecture-maquettes` · `iakaframe-fabrication` · `iakaframe-gestion-de-source` ·
`iakaframe-git` · `iakaframe-forgejo` · `iakaframe-conteneurisation` · `iakaframe-docker` ·
`iakaframe-qualite` · `iakaframe-deploiement` · `iakaframe-naonedge` · `iakaframe-nathalie` ·
`iakaframe-memoire-humaine` · `iakaframe-appflowy-doc` · `iakaframe-frame`

**Hors union = 7** (au canon, accessibles au CLI, **jamais projetées** dans le runtime, aucune
persona ne les déclare) : `iakaframe-etat-des-lieux`, `-learning`, `-retrait`, `-update`, `-init`,
`-journal-conversation`, `-log-conversation`. 19 + 7 = **26** (cohérent avec le compte canon).

> **Contre la gelée** (« union = 17 »), l'union vaut **19** : + `iakaframe-frame` (Fëanor) +
> `iakaframe-lecture-maquettes` (Gandalf). Le compte exact des **manquantes** / **orphelines** au
> runtime est le **produit du premier `skills deploy --check`** (la garde EST l'inventaire) — je ne
> le hand-compte pas faute de listage fiable ; les absences ci-dessus (§ 1.2) suffisent à prouver la
> dette.

## 2. Ce qui existe et qu'on RÉUTILISE (patron persona→contrat)

Le lot **ne réinvente pas** : il calque le dispositif déjà en place pour les contrats d'agent.

| Brique existante | Fichier | Rôle |
|---|---|---|
| Rendu pur du contrat | `cli/src/lib/generate-agents.js:55-66` (`renderAgentContract`) | **à étendre** (projeter `skills:`) |
| Génération team-scopée | `cli/src/lib/generate-agents.js:98-108` (`generateAll`) | itère la team 9 (Fëanor inclus) |
| Verbe `generate [--check]` | `cli/src/commands/agents.js:60-102` | **patron exact** de `skills deploy` : statut `ok`/`drift`/`absent`, exit non-zéro si dérive |
| Producteur de golden | `cli/scripts/gen-agents-golden.mjs` | **patron** du golden de manifeste (en-tête de provenance + sha256) |
| Déploiement chemin n°1 | `cli/src/lib/agents.js:103-197` (`affectPersona`/`fullteam`) | copie récursive (`copyDir`), **mono-skill** via table codée |
| Déploiement chemin n°2 | `cli/src/commands/switch.js:63-110` | non destructif (backup `.claude.bak-<ts>`), lit `persona.data.skills` (multi), **mais copie la persona brute** (bug, § 4) |

## 3. Deux tables codées concurrentes du canon (à supprimer)

- **`SKILL_OF` / `SKILL_OVERRIDE_OF`** (`cli/src/lib/agents.js:38-54`) : seconde source de vérité,
  **mono-skill**, qui **dit désormais faux** — `fabrication: ''` avec le commentaire « pas de skill :
  porté par le CLAUDE.md du projet » (`:42`) et la branche `else if (name === 'gimli')` qui imprime
  « gimli : pas de skill » (`:126-128`) **contredisent le canon** (`gimli.md:9` =
  `skills: [iakaframe-fabrication]`). Elle rate aussi `iakastart` (odin), `iakaframe-memoire-humaine`
  (nathalie) et `iakaframe-lecture-maquettes` (gandalf).
- **`DEFAULT_SKILLS`** (`~/work/iakaFrameGUI/packages/core/src/roster.ts`) : **troisième** table
  mono-skill, côté GUI. Supprimer `SKILL_OF` sans la traiter **déplacerait** la seconde vérité d'un
  dépôt à l'autre.

## 4. Décisions déjà tranchées par le décideur — RECONDUITES

Ces arbitrages figurent dans le fichier gelé (`parite-skills-generateur-deploiement.md`, §§ 13-14) ;
**le fait qui les fondait n'a pas changé**, ils restent en vigueur et sont repris ici sans réouverture :

| # | Décision | Provenance |
|---|---|---|
| D1 | **Résolution TRANSITIVE + détection de cycles** (pas de limite à 1 niveau) — sinon on démonterait `iakaframe-fabrication`. | gelée § 14.3, tranché 2026-07-20 |
| D2 | **`Skill` accordé aux personas** (accès à la demande), **couplé** au préchargement (§ 5.3). | gelée § 13.1, tranché |
| D3 | **`layer: capacity`** posé sur `iakaframe-jalon` (supprime l'asymétrie capacité→brique non typée). | gelée § 14.7 pt 2 |
| D4 | **Orphelines signalées (`orphan`), jamais supprimées** d'office ; pas de `--prune` au MVP. | gelée § 7 pt 4 / § 5.4 |
| D5 | **`SKILL_OF`/`SKILL_OVERRIDE_OF` supprimées** (le frontmatter est la source unique). | gelée § 4.2 |
| D6 | **Anomalie C corrigée dans ce lot** : `switch.js:80` déploie le **contrat généré**, jamais la persona brute. | gelée § 13.2 |
| D7 | **`DEFAULT_SKILLS` (GUI) aligné sur le canon + garde de parité** contre les personas vendorées. | gelée § 13.5 |

## 5. Spécification fermée

### 5.1 `resolveSkills(personaId)` — transitif, déterministe, avec détection de cycles (D1)

```
resolveSkills(personaId) :
  base ← frontmatter `skills:` de library/personas/<id>.md         (ordre préservé)
  parcours en PROFONDEUR à partir de chaque s de base, dans l'ordre :
    émettre s ; puis, récursivement, chaque élément de `subskills:` de library/skills/<s>/SKILL.md
  dédoublonner en conservant la PREMIÈRE occurrence (stabilité du golden)
  CYCLE (A→…→A) détecté ⇒ ERREUR explicite nommant le cycle (jamais boucle infinie ni troncature)
  skill référencée mais absente de library/skills/ ⇒ ERREUR (jamais un skip silencieux)
```

Contrôles attendus (sur le canon mesuré) :

| Persona | `resolveSkills` attendu (ordre normatif) |
|---|---|
| gimli | `fabrication, gestion-de-source, git, forgejo, conteneurisation, docker, jalon` (**7**, aucune troncature) |
| gandalf | `cadrage, jalon, lecture-maquettes` (**3**) |
| nathalie | `nathalie, memoire-humaine, appflowy-doc` (**3**) |
| feanor | `frame, jalon` (**2**) |
| odin | `odin, iakastart` (**2**) |
| aragorn | `aragorn, jalon` (**2**) |
| legolas / helm / loki | la skill seule (**1**) |

### 5.2 Projection `skills:` dans le contrat (Fait 1 — activation par préchargement)

`renderAgentContract` émet une ligne `skills:` **après `tools`, avant `guardrails`**, **omise si
vide**, portant la **liste résolue** (`resolveSkills`) de la persona — c'est-à-dire **exactement les
skills déployées pour cette persona** (invariant : contrat.skills ≡ dossiers déployés atteignables
par cette persona). Forme du rendu (flow-list vs scalaire virgule) : **au choix de l'exécutant, mais
UNE seule forme, stable** (l'ordre est rendu verbatim → tout flottement produit un diff de golden).

> **Pourquoi la liste résolue et non la seule liste déclarée** : le geste **obligatoire** `jalon` est
> un *subskill* (d'aragorn/cadrage/fabrication/frame). Ne préchager que le niveau déclaré le
> laisserait dépendre d'une invocation probabiliste (Fait 3) — inacceptable pour une obligation. Le
> préchargement de la liste **résolue** est le seul mécanisme déterministe.

> ⚠️ **Coût en contexte assumé, tunable en recette** : Gimli préchargerait **7** skills. Si le volume
> injecté s'avère excessif à la recette (C-recette), on rabat **skill par skill** vers l'invocation
> (option B, disponible grâce à D2/§ 5.3) — **sans redécouper le lot**. Choix par skill, pas par lot.

### 5.3 Accès à l'outil `Skill` dans le binding (Fait 3 — invocation à la demande, D2)

`Skill` est ajouté aux `tools` des **9** assignations de `bindings/iakaframe-claude-default.md:8-16`,
**en fin de liste**, **identique et stable** pour toutes. Conséquence : les 9 contrats changent →
re-génération goldens + re-vendorage GUI + mise à jour des **assertions de tools en dur** du test GUI
(`~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts`). Cf. critère de fini § 5.8.

### 5.4 Verbe `iakaframe skills deploy [--check]` (tranché)

**Décision : nouveau verbe de premier niveau `skills`, sous-action `deploy`** — pas
`iakaframe deploy` (trop générique, collision de sens avec Helm/prod), pas `sync-skills`. Motif :
(a) le CLI nomme **par geste** et range les gestes d'un domaine sous un verbe-domaine à sous-actions
(`agents <action>`, `frame <action>`, `memory <action>`, `produit <action>`, `review <action>`) —
`skills deploy` s'y conforme ; (b) le domaine « skills » est **distinct** du domaine « agents »
(contrats) : les mêmes fichiers ne sont pas produits. `deploy` reprend **à l'identique** la sémantique
de `agents generate` (`agents.js:60-102`).

- `iakaframe skills deploy [--global] [--project <p>] [--json]` — déploie l'union résolue.
- `iakaframe skills deploy --check` — **n'écrit rien**, statue par skill `ok` / `drift` / `absent` /
  `orphan`, **exit non-zéro** si `drift`/`absent` (jamais sur `orphan` seul — D4).
- **Cible** : `<target>/.claude/skills/<skill-id>/`, `--global` → `~/.claude`, sinon `<project>`
  (même résolution que `agents.js:66`).
- **Contenu** : copie **récursive et fidèle** du dossier `library/skills/<id>/` (fichiers annexes
  inclus — jamais le seul `SKILL.md`), via `copyDir`.
- **Non destructif / idempotent** : n'écrit un dossier que s'il diffère ; ne touche jamais un dossier
  hors union. Le **nom du dossier = id canon** (il détermine la commande `/id` du runner) : aucun
  renommage.
- **Orphelines** (déployées, hors union) : statut `orphan`, **conservées** (D4). Distinguées sans
  ambiguïté d'une erreur dans `--json`.

### 5.5 Union par cible & portée de Fëanor (POINT DÉCIDEUR, § 7.1)

L'union se calcule sur les personas **dont le contrat est déployé sur la cible** :
- **Cible globale `~/.claude`** (environnement de dev du décideur) : les **9** personas du roster,
  **Fëanor inclus** → union **19** (§ 1.3). Fëanor reste **hors dispatch automatique** (son
  `EXPLICIT_ACTIVATION`), mais son **contrat + `iakaframe-frame`** sont **matérialisés** pour
  permettre l'**activation explicite** par le décideur (« invoque Fëanor »).
- **Cible projet via `fullteam`** : team de la frame active **moins** Fëanor (dispatch auto) — union
  réduite, Fëanor non matérialisé, cohérent avec l'exclusion existante.

> **Invariant de cohérence à tenir** : toute persona dont le **contrat** est déployé sur une cible
> doit y avoir **toutes ses skills résolues** déployées (sinon préchargement/invocation cassés). Donc
> si `agents generate --global` matérialise `feanor.md`, alors `skills deploy --global` **doit**
> inclure la chaîne `frame→jalon`. Les deux verbes partagent la même définition « personas de la
> cible ».

### 5.6 Unification des deux chemins + anomalie C (D5, D6)

`switch.js` et `affectPersona`/`fullteam` appellent la **même** `resolveSkills` + le même déployeur ;
la table `SKILL_OF` n'est plus consultée. `switch.js:80` déploie le **contrat généré**
(`generateAgent`), jamais `fs.copyFileSync(persona.path, …)` (anomalie C). Le message « gimli : pas de
skill » (`agents.js:126-128`) et l'entrée `fabrication: ''` (`:42`) **disparaissent** avec la table.

### 5.7 Golden de manifeste + test de parité (la garde anti-re-divergence)

`cli/test/fixtures/skills-golden/manifest.json` (ou `.md` à en-tête de provenance — **une** forme),
produit par un script **unique** calqué sur `gen-agents-golden.mjs`, contenant :
- **inventaire** : pour chaque skill canon → `id`, `sha256` du `SKILL.md`, `subskills` déclarés,
  `layer` (ou son absence explicite) ;
- **résolution** : pour chaque persona → liste **ordonnée** de `resolveSkills` ;
- **compteurs** : nombre de skills, nombre de personas.

Test `cli/test/parite-skills.test.js` : compare le manifeste **régénéré à la volée** au golden figé
(rouge à toute dérive non regénérée — un `subskills:` ou un `skills:` modifié sans regénérer le
golden **casse le test**).

### 5.8 Critère de « fini » — le rituel de vendorage (celui qui a coûté un cycle)

Les § 5.2 et § 5.3 modifient le **format du contrat** ET le **binding** → **dans le même lot** :
1. `node cli/scripts/gen-agents-golden.mjs` — régénérer les **9** goldens (le script itère déjà la
   team 9 ; corriger au passage sa prose « 8 goldens », § 6) ;
2. `iakaframe agents generate --global` puis `--check` (exit 0) — **déploie Fëanor** au passage ;
3. `iakaframe skills deploy --global` puis `--check` (exit 0) ;
4. **re-vendorer côté GUI** : goldens + personas + binding s'ils ont bougé (l'état réel du vendorage
   se lit via `iakaframe vendor-check`, qui donne les gestes de remédiation) ;
5. mettre à jour les **assertions de tools en dur** de `parite-generateurs.test.ts` (les 9 personas
   gagnent `Skill`) et **`DEFAULT_SKILLS`** + sa garde (D7) ;
6. rejouer **les deux** suites (CLI `node --test` **et** GUI).
7. **régénérer le golden de skills** après toute modification d'un `skills:` de persona ou d'un
   `subskills:`/`layer:` de skill (étape permanente ajoutée par ce lot).

> **Filet en place** : la garde `vendor-check` cross-repo est **livrée et mordante** (drift 0,
> `BACKLOG.md` § Fait) — un oubli d'étape est désormais **mécaniquement détectable**. C'est ce qui
> lève la dépendance d'ordonnancement que la gelée déclarait.

## 6. Découpe en lots

### Lot MVP (R8) — « skills du canon actives au runtime »

Tout le § 5. Objectif atteint = les 4 gestes (`jalon`, `fabrication`+chaîne, `frame`,
`lecture-maquettes`) **préchargés et invocables** ; roster 9 matérialisé (Fëanor inclus) ; garde de
parité en place ; dette d'absences résorbée. Estimation § 8.

### Itération (différée — le « reste » du décideur, hors MVP)

- **Scories Slack** (13 occ., `BACKLOG.md` item dédié) : **canon d'Odin** (`iakaframe-odin/SKILL.md`,
  2 occ.) + vitrines HTML + kit Ollama + `specs/equipe-agents.md`. **Tranché : hors ce lot.** Motif :
  purger le **contenu** des skills est un lot **rédactionnel** qui touche aussi `README.md`, les
  vitrines et le kit ; les disperser casse la cohérence de ce lot-là. Le redéploiement depuis le
  canon **purge déjà Aragorn** (canon propre) ; le reliquat d'Odin **subsistera** au runtime après ce
  lot et **c'est assumé** (cf. critère C-slack).
- **README des skills** (`library/skills/README.md`) : compte 23→26 + retrait de « Gimli n'a pas de
  skill » + ajout de `fabrication`/`frame`/`lecture-maquettes` à l'inventaire. **Doc → territoire
  Nathalie** ; hors périmètre cadrage. **Le lot MVP le signale** (C-doc) sans l'écrire.
- **Générateur de vitrine `.md`→`.html`** (`methode-de-travail.html`, 16 occ. Slack orphelines) :
  item BACKLOG distinct, sans rapport mécanique avec le déploiement.

## 7. Points que SEUL le décideur tranche

1. **Portée Fëanor au runtime global (§ 5.5).** Matérialise-t-on `feanor.md` + `iakaframe-frame` dans
   `~/.claude` pour l'activation explicite ? *Reco Gandalf : **oui*** — « activation explicite » veut
   dire « hors dispatch auto », pas « absent du runtime » ; sans matérialisation, le décideur ne peut
   pas invoquer Fëanor en session. `agents generate --global` le fait déjà pour le contrat ; l'union
   skills doit suivre. **Alternative** : ne matérialiser Fëanor que dans un projet de forge dédié —
   mais aucun n'existe côté décideur aujourd'hui.
2. **Ampleur du préchargement (§ 5.2).** MVP = liste **résolue** (jalon garanti). Si la recette
   révèle un coût contexte excessif (Gimli 7 skills), rabat-on d'emblée la chaîne
   `git/forgejo/docker` sur l'invocation (B) ? *Reco Gandalf : décider **à la recette** (C-recette),
   pas maintenant* — l'option A+B le permet sans redécoupe.

> Tous les autres points (transitivité, `Skill`, `layer`, orphelines, suppression des tables,
> anomalie C, `DEFAULT_SKILLS`) sont **déjà tranchés** (§ 4) et ne se rouvrent pas.

## 8. Critères d'acceptation (testables)

| # | Critère | Vérification |
|---|---|---|
| C1 | `resolveSkills('gimli')` == `[fabrication, gestion-de-source, git, forgejo, conteneurisation, docker, jalon]` (7, transitif) | test unitaire |
| C2 | `resolveSkills('gandalf')` == `[cadrage, jalon, lecture-maquettes]` | test unitaire |
| C3 | `resolveSkills('feanor')` == `[frame, jalon]` | test unitaire |
| C4 | `resolveSkills('nathalie')` == `[nathalie, memoire-humaine, appflowy-doc]` ; `resolveSkills('odin')` == `[odin, iakastart]` | test unitaire (non-régression tables codées) |
| C5 | Dédoublonnage : skill atteinte 2× → 1 occurrence, 1ʳᵉ position ; 2 résolutions successives identiques (déterminisme) | test |
| C6 | **Cycle** `A→B→A` ⇒ erreur explicite nommant le cycle | test (arête temporaire) |
| C7 | Skill référencée mais inexistante ⇒ erreur explicite (jamais skip) | test |
| C8 | Le contrat généré porte `skills:` (liste résolue) après `tools`, avant `guardrails` ; omise si vide | golden d'agent régénéré |
| C9 | Les 9 contrats portent `Skill` en fin de `tools` | goldens + binding |
| C10 | `skills deploy --global` déploie **exactement l'union 19**, `jalon`/`fabrication`/`frame`/`lecture-maquettes` incluses | `--json` : `count == 19` + liste = union |
| C11 | Copie récursive fidèle (fichiers annexes) | diff dossier canon ↔ déployé |
| C12 | `skills deploy --check` exit **0** quand tout est à jour | exit code |
| C13 | Altérer une skill déployée ⇒ `--check` exit **1**, statut `drift` ; en supprimer une ⇒ `absent` | exit + `--json` |
| C14 | Skill déployée hors union ⇒ `orphan`, **jamais supprimée**, FS inchangé, `--check` **n'échoue pas** sur `orphan` seul | `--json` + FS |
| C15 | `feanor.md` **matérialisé** dans `~/.claude/agents/` (si § 7.1 = oui) et `iakaframe-frame` dans `~/.claude/skills/` | FS runtime |
| C16 | `switch`/`use` déploie un **contrat valide** (byte-identique à `agents generate`), jamais la persona brute ; aucun champ persona-only (`roleKey`, `royaume`, `pastille`, `vignette`) au runtime | diff + inspection |
| C17 | `switch` et `fullteam` produisent le **même** ensemble skills+contrats pour une persona donnée | test comparatif |
| C18 | Aucun chemin ne prétend « gimli sans skill » ; `SKILL_OF`/`SKILL_OVERRIDE_OF` supprimées | `grep "pas de skill" cli/src/` = 0 |
| C19 | `iakaframe-jalon/SKILL.md` déclare `layer: capacity` | `grep "^layer:" …/iakaframe-jalon/SKILL.md` |
| C20 | Golden de skills : régénéré == figé ; modifier un `subskills:` sans regénérer ⇒ **rouge** | `cli/test/parite-skills.test.js` |
| C21 | `DEFAULT_SKILLS` (GUI) aligné sur les `skills:` canon (multi-skills inclus) + **garde** rouge si divergence | test GUI |
| C22 | Suites CLI **et** GUI vertes après re-vendorage ; `iakaframe vendor-check` exit 0 | § 5.8 |
| C-doc | `library/skills/README.md` : compte skills corrigé et « Gimli sans skill » retiré *(peut être porté au lot doc Nathalie — signalé, pas bloquant)* | relecture |
| C-slack | Plus aucune occurrence « Slack » dans `~/.claude/skills/iakaframe-aragorn/` (purgée par redéploiement) ; **reliquat d'Odin assumé** (canon non purgé, hors lot) | `grep -ri slack …/iakaframe-aragorn/` = 0 |
| **C-recette** | **Recette humaine** : en session Claude Code, un subagent (ex. Gandalf, Gimli) a bien ses skills **préchargées** (jalon présent sans invocation) et peut en **invoquer** une non préchargée | **gate humain** — Legolas ne valide pas le runtime du runner |

> **C-recette est le critère de recette réel.** C1-C22 prouvent la mécanique ; seul C-recette prouve
> que les gestes sont **effectivement actifs** — c'était le but de R8.

## 9. Sources (faits externes vérifiés — load-bearing)

- Claude Code — subagents : le champ `skills:` du frontmatter **précharge le contenu intégral** de la
  skill au démarrage (vérifié 2026-07-27) : https://code.claude.com/docs/en/sub-agents
- Claude Code — skills (emplacement `~/.claude/skills/<name>/SKILL.md`, le **nom du dossier** fait la
  commande, frontmatter) : https://code.claude.com/docs/en/skills
- Agent Skills — vue d'ensemble du standard (clés inconnues ignorées par les runtimes conformes →
  `subskills` doit être **résolu au déploiement**) :
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

## 10. Fichiers de référence (chemin:ligne mesurés le 2026-07-27)

- `cli/src/lib/generate-agents.js:55-66` — `renderAgentContract`, à étendre (Fait 1)
- `cli/src/lib/generate-agents.js:98-108` — `generateAll` (team 9, Fëanor inclus)
- `cli/src/lib/agents.js:38-54` — tables `SKILL_OF`/`SKILL_OVERRIDE_OF` à supprimer
- `cli/src/lib/agents.js:75,194` — `EXPLICIT_ACTIVATION_PERSONAS`/filtre Fëanor (§ 5.5)
- `cli/src/lib/agents.js:103-197` — chemin de déploiement n°1 + message « pas de skill » à retirer (`:126-128`)
- `cli/src/commands/switch.js:80` — copie brute (anomalie C) ; `:82-84` chaîne skills sans résolution
- `cli/src/commands/agents.js:60-102` — patron `generate [--check]` à copier
- `cli/scripts/gen-agents-golden.mjs` — patron de golden (prose « 8 » à corriger)
- `bindings/iakaframe-claude-default.md:8-16` — 9 assignations sans `Skill` (Fait 3)
- `library/skills/iakaframe-fabrication/SKILL.md:5-6` — `layer: capacity` + `subskills` (chaîne)
- `library/skills/iakaframe-frame/SKILL.md:5` — `subskills: [iakaframe-jalon]`
- `library/skills/iakaframe-jalon/SKILL.md:1-5` — **sans `layer:`** (D3/C19)
- `library/skills/README.md:3,31` — compte 23 + « Gimli sans skill » périmés (C-doc)
- `~/.claude/agents/gandalf.md:4` — contrat déployé sans `skills:` ni `Skill` (preuve Fait 1/3)
- `~/work/iakaFrameGUI/packages/core/src/roster.ts` — `DEFAULT_SKILLS` (D7/C21)
- `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts` — assertions de tools en dur (§ 5.8)

## 11. Estimation (jalon P1→P2)

- **Charge : ~3,5 à 4,25 jours-homme.**
  - 0,5 j — `resolveSkills` transitif + détection de cycles + déterminisme (C1-C7)
  - 0,5 j — projection `skills:` dans le contrat + `Skill` au binding + régénération des 9 goldens
  - 0,75 j — verbe `skills deploy [--check]` + C-JSON + orphelines
  - 0,5 j — golden de manifeste + `parite-skills.test.js`
  - 0,25 j — suppression tables codées + anomalie C + unification des deux chemins
  - 0,75-1 j — **re-vendorage GUI** (goldens + binding + assertions en dur + `DEFAULT_SKILLS` + garde), 2 suites
  - 0,25 j — matérialisation Fëanor global + vérifs runtime + signalement C-doc
- **Complexité : moyenne-haute.** Le cœur est un **parcours de graphe** (cycles possibles) rendu de
  façon **déterministe** (un golden en dépend) ; le coût réel est l'**effet de bord cross-repo** sur
  le format du contrat (9 goldens + fixtures vendorées + assertions GUI en dur).
- **Risque : moyen-haut**, concentré sur le changement de format du contrat. **Mitigation en place** :
  `vendor-check` cross-repo livrée et mordante → l'oubli d'une étape du § 5.8 est détectable. Les
  dépendances que la gelée déclarait (garde vendor-check, lot roster) sont **soldées**.
- **Inconnues** (susceptibles de faire glisser) :
  - **le `skills:` du contrat est-il honoré pour un subagent `~/.claude/agents/` ?** Champ documenté
    (§ 9), **jamais éprouvé sur nos personas** — objet de **C-recette**, décide si le lot atteint son
    but. *Inconnue principale.*
  - **coût contexte du préchargement** : Gimli précharge 7 skills. Si excessif, rabat par skill vers
    l'invocation (§ 7.2) — tunable, pas bloquant.
  - **version minimale de Claude Code** exigée par le champ `skills:` — à confirmer sur la machine.
  - **compte exact du canon** (26 présumé) et de la dette déployée — figé par le 1ᵉ `skills deploy
    --check` de l'exécutant (listage indisponible au cadrage).
