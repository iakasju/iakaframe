# Scission du squad prod — 🆕 Charon (le passeur) · 🌉 Helm (le veilleur)

> Cadrée par **🧙 Gandalf** (P1 — Cadrage), le **2026-08-08**, sur **ordre de mission d'Odin**
> portant **arbitrage explicite du décideur**. Exécution : **⚒️ Gimli** (P2).
> **Lecture seule** sur le code pendant le cadrage : tout fait chiffré ci-dessous a été **lu sur le
> disque**, jamais déduit d'une mémoire de session.
>
> **La décision est RENDUE. Cette instruction la CADRE, elle ne la rediscute pas.** Les §§ *Décision
> retenue* et *Nommage* sont des **transcriptions d'arbitrage**, pas des propositions.

---

## 1. Problème

Le **squad prod** de la méthode iakaframe porte aujourd'hui **deux missions à horloges
incompatibles dans un seul agent** (🌉 Helm) :

| Mission | Nature | Déclencheur | Gate |
|---|---|---|---|
| **Déploiement** (bascule stage → prod, alias, rollback, accès/SSO) | un **événement** | un **feu vert humain tracé** | **humain**, non négociable |
| **Surveillance** (health-checks, disponibilité, charge, **alerte**) | un **régime permanent** | *aucun* | *aucun* |

**Conséquence structurelle, et c'est le vrai défaut** : un persona ne s'exécute **que quand on
l'invoque**. La mission « surveillance » est donc **écrite mais non incarnée** — elle n'a **aucun
déclencheur**. Elle vit aujourd'hui comme un § 5 rangé **à la fin d'une checklist de bascule**
(`library/skills/iakaframe-deploiement/SKILL.md:59-80`), c'est-à-dire à l'endroit exact où personne
ne va la chercher entre deux déploiements.

La méthode **annonçait déjà** cette extension : `methode-de-travail.md:180` — « Le squad prod est
**extensible** (rôles surveillance / alerte dédiés à terme). »

---

## 2. Faits mesurés (`F*`) — lus sur le disque, jamais supposés

> Convention : `F*` = **fait vérifié** · `D*` = **décision** (§ 4). Un fait non mesuré est marqué
> **NON MESURÉ** en toutes lettres. Ce cadrage n'en porte aucun de silencieux.

### 2.1 L'état du squad prod dans le canon

| Id | Fait | Preuve (chemin:ligne) |
|---|---|---|
| **F1** | Helm porte **les deux missions fusionnées**, et sa propre fiche le dit | `library/personas/helm.md:17` — « Agent de Gestion de Production **+ Agent de Surveillance** (fusionnés) » |
| **F2** | La référence **Heimdall** — le guetteur qui ne dort jamais — est **déjà écrite** dans la fiche de Helm | `library/personas/helm.md:16` |
| **F3** | La skill du squad prod est à **~90 % une checklist de bascule** ; la surveillance y occupe **22 lignes sur 94**, en fin de fichier | `library/skills/iakaframe-deploiement/SKILL.md:9-57` (bascule) vs `:59-80` (surveillance) |
| **F4** | Le **workflow** ne connaît qu'**un** acteur en prod | `library/workflows/iakaframe-3phases.md:9` — `actorsRoleKeys: [deploiement]` |
| **F5** | Le rôle canon `deploiement` **agrège les deux** dans une seule phrase | `library/roles/deploiement.md:14` |

**F2 est décisif pour le nommage** : aucune référence mythologique n'est à migrer. Helm recentré sur
la veille **redevient exactement ce que sa propre fiche annonçait**.

### 2.2 La preuve terrain — `robby-immo`, le projet qui a buté exactement là

| Id | Fait | Preuve |
|---|---|---|
| **F6** | La panne y est « **détectée, close, située et affichée** » — mais **il faut ouvrir la page** | `~/work/robby-immo/CLAUDE.md`, ticket `SUP-1` point 2 |
| **F7** | `data-api` **n'a aucun ordonnanceur** ; `SLACK_WEBHOOK_URL` **n'est référencée par aucun workflow** | id., `SUP-1` point 2 |
| **F8** | L'objection est **formellement acceptée** par le projet : « un balayeur logé dans `supervision.json` ne dirait rien si `supervision.json` lui-même tombait […] **Seul un déclencheur vivant HORS de n8n y répond.** » | id., `SUP-1` point 3 |
| **F9** | Le projet a par ailleurs mesuré le **coût d'une surveillance qui crie trop** : trois alertes rouges permanentes rendaient la quatrième invisible — refermé par sa migration `V28` | id., ticket `SUP-3` |

`F8` est l'énoncé, par un projet et non par la méthode, de **la raison même de cette scission** :
la veille doit vivre **hors de ce qu'elle surveille**, donc dans un agent qui n'attend aucun ordre.
`F9` borne le périmètre (§ 4, `D9`).

### 2.3 iakaHub — piste forte **vérifiée**, et le verdict n'est pas celui attendu

> Ordre de mission : *« Va VÉRIFIER ce que la passerelle sait réellement faire aujourd'hui avant de
> l'inscrire comme dépendance. »* — **Fait. Elle ne sait pas le faire.**

| Id | Fait | Preuve (chemin:ligne) |
|---|---|---|
| **F10** | ✅ iakaHub **est** un démon local, hors de la stack de chaque projet, à canal par projet et sous persona | `~/work/iakaHub/src/index.js:62-117` · `src/core/router.js:35-114` · `src/core/personas.js:13-22` |
| **F11** | ✅ iakaHub **est déjà lanceur d'agent** — pas un simple relais | `~/work/iakaHub/src/runner/odinRunner.js:88-143` (`spawn('claude', …)`) |
| **F12** | 🛑 **iakaHub N'A AUCUNE HORLOGE.** Recherche exhaustive de `setInterval|cron|schedule|tick` sur `src/` : **0 occurrence**. Les **4** `setTimeout` présents sont **tous** des délais d'expiration (abandon de requête, expiration d'attente, timeout de run) — **aucun n'est un battement périodique** | `src/runner/odinRunner.js:108` · `src/core/registry.js:50` · `src/index.js:32` · `src/core/hubClient.js:30` |
| **F13** | 🛑 **Le seul canal entrant agent → démon est `POST /ask`, et il est BLOQUANT** : il enregistre une attente, poste la question et **attend une réponse humaine**. Il **ne peut pas** porter une alerte (une alerte s'émet, elle ne se demande pas) | `src/hub/adminServer.js:18-52` (`GET /health` + `POST /ask`, **rien d'autre**) · `src/hub/hubGateway.js:74-106` |
| **F14** | 🛑 **Le runner est câblé sur Odin ET en posture read-only** : `READONLY_DISALLOWED_TOOLS = ['Bash', 'Edit', 'Write', 'NotebookEdit', 'MultiEdit']`. **Un agent lancé par iakaHub ne peut PAS exécuter de `Bash`** — donc **pas de health-check** | `src/runner/odinRunner.js:29` · `src/hub/odinDirect.js` (destinataire fixe = Odin) |
| **F15** | `PERSONAS` d'iakaHub contient déjà **`helm`**, **pas `charon`**. `resolvePersona` a un **repli permissif** (fabrique un persona depuis le nom) : Charon fonctionnerait en **mode dégradé**, sans entrée explicite | `src/core/personas.js:20` et `:31-37` |

> 🛑 **VERDICT, à ne pas adoucir : iakaHub est le BON HÔTE et le MAUVAIS ÉTAT.** Les quatre
> propriétés qui en font le candidat naturel (`F10`, `F11`) sont réelles ; les **trois** briques que
> le déclencheur exige (`F12` horloge, `F13` émission non bloquante, `F14` runner généralisé et
> autorisé à sonder) **n'existent pas**. **Ce cadrage n'inscrit donc PAS iakaHub comme dépendance
> satisfaite.** Il le nomme comme **hôte cible** et cadre le manque en lot séparé (§ 7, `HUB-VEILLE`).
>
> `F14` est la trouvaille que personne n'avait nommée : **même si l'horloge existait aujourd'hui**,
> le veilleur lancé par iakaHub serait **incapable de faire un health-check**, la posture de sécurité
> lui refusant `Bash`. Un cadrage qui aurait supposé la capacité aurait produit un lot **faux**.

### 2.4 Faits externes vérifiés sur le web (obligation de cadrage)

| Id | Fait | Source |
|---|---|---|
| **F16** | **`charon` est le nom du démon IKEv2 de strongSwan** — un démon d'exploitation très répandu (variantes `charon-systemd`, `charon-nm`, `charon-cmd`, `charon-svc`). **Collision de vocabulaire réelle** dans le champ ops, exactement là où opère notre persona | [strongSwan — charon](https://docs.strongswan.org/docs/latest/daemons/charon.html) · [charon-systemd](https://docs.strongswan.org/docs/latest/daemons/charon-systemd.html) |
| **F17** | Pour un déclenchement à **heure d'horloge** (quotidien / horaire), `setInterval` **dérive** (il compte depuis l'exécution, pas depuis le calendrier) et **n'est pas recommandé en production** ; un ordonnanceur à syntaxe crontab est le choix standard en Node | [Cron vs setInterval in Node.js](https://dev-brains-ai.com/blog/cron-vs-setinterval-nodejs) · [Node.js Cronjobs](https://logsnag.com/blog/nodejs-cronjobs) |

> **`F16` ne rouvre PAS le nommage** (§ 3 : figé par le décideur). Il est versé ici pour une raison
> opérationnelle : le jour où Charon écrira dans un journal d'exploitation ou apparaîtra dans une
> liste de processus, **`charon` y désignera peut-être déjà autre chose**. À savoir avant de
> diagnostiquer. **Signalé, non traité.**
>
> **`F17` chiffre le lot `HUB-VEILLE`** (§ 7) : l'horloge se fait avec un ordonnanceur calendaire, pas
> avec un `setInterval` — et ce n'est pas un détail de goût, c'est la différence entre « tous les
> jours à 06:00 » et « toutes les 24 h, à une heure qui glisse ».

### 2.5 Coût de propagation — **mesuré, et supérieur à l'annonce**

| Id | Fait | Mesure |
|---|---|---|
| **F18** | **164 fichiers** de `~/work/iakaframe/` mentionnent `helm` (recherche insensible à la casse, `.git`/`node_modules` exclus par l'outil) — dont **56** sous `frames/releases/StefFrame2/` et **108** dans le **live** | recherche exhaustive du 2026-08-08 |
| **F19** | ⚠️ **L'annonce de 80 fichiers de l'ordre de mission est SOUS-ÉVALUÉE d'un facteur ~2.** Le chiffre opposable est **164 / 108 live**. Ce n'est pas un détail : c'est le double du volume de relecture | id. |
| **F20** | `SKILL_OF` / `SKILL_OVERRIDE_OF` **n'existent plus** — supprimées. La skill d'un persona vient **uniquement** de son frontmatter `skills:`, résolu transitivement | `cli/src/lib/agents.js:38-42` · `cli/src/lib/resolve-skills.js` |
| **F21** | `ROLE_OF` **subsiste**, à **deux vocabulaires assumés**, et `ROLE_OF.helm = 'coordination'` (le rôle d'Aragorn). Sa réconciliation est **hors périmètre déclaré** (poste B3) | `cli/src/lib/agents.js:20-36` |
| **F22** | Un `roleKey` déclaré par la méthode **exige un fichier de rôle** : `needEach('roleKeys', data.roleKeys, 'roles')` | `cli/src/lib/library.js:186` |
| **F23** | Les `roleIndex` iakaframe vont de **1** (`portefeuille`) à **9** (`frame`) ; `deploiement` = **6** | `library/roles/*.md:5` |
| **F24** | 🛑 **La garde de vendorage cross-repo code EN DUR des cardinaux** : `IDS` = **9 personas**, `ROLE_KEYS` = **9**, `SKILL_IDS` = **19**, `EXPECTED_COPIES` = **78** | `cli/src/lib/vendor.js:34,55,60,73` |
| **F25** | 🛑 **Le dépôt frère `iakaFrameGUI` EST PRÉSENT sur le disque, avec ses fixtures vendorées** (9 personas, 9 goldens, 9 rôles, 19 skills…). La garde **ne sautera donc pas** : elle **comparera**, et elle **rougira** | `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/` (relevé exhaustif) |
| **F26** | `ROSTER` du garde-fou de délégation code en dur **8 noms** — et **`feanor` y manque déjà** | `kits/iakaframe-claude/global/hooks/guard-core.mjs:115-117` · idem `kits/iakaframe-codex/…` |
| **F27** | Le miroir `StefFrame2` est **déjà périmé d'un persona** : sa team porte **8** personas — `helm` **présent**, **`feanor` ABSENT** — là où le live en porte **9**. ⚠️ **Fait RECTIFIÉ au cadrage** : `correctif-roster-team-helm.md` § 2 décrit ce même fichier à **7 personas, `helm` absent`** — **état PÉRIMÉ**, le correctif ayant été appliqué depuis. **Lu sur le disque le 2026-08-08**, pas cité. La conclusion (« le miroir est en retard d'un persona ») **tient** ; c'est **lequel** qui change | `frames/releases/StefFrame2/teams/iakaframe-8.md:4` — **lecture directe** |
| **F28** | Quatre générateurs existent et sont le **seul** chemin légitime de mise à jour des artefacts dérivés | `cli/scripts/gen-agents-golden.mjs` · `gen-skills-golden.mjs` · `gen-methode-vitrine.mjs` · `gen-models-doc.mjs` |

### 2.6 🛑 Le piège d'exécution, **déjà documenté par ce dépôt** — à lire avant de coder

| Id | Fait | Preuve |
|---|---|---|
| **F29** | **`roleKey` n'est projeté dans AUCUN contrat généré** (`renderAgentContract` ne rend que `name`, `description`, `tools`, `guardrails`). **Les suites resteront VERTES même après un changement de `roleKey` partiel ou raté** | `specs/instructions/decision-rolekey-reconciliation.md` § 0 |
| **F30** | 🛑 **PIRE : le filet existant indique FAUSSEMENT que tout va bien.** `assemble` calcule `coveredByCoordinator = hasCoordinator ? uncoveredRoles : []`, et `teams/iakaframe-8.md:5` déclare `coordinator: aragorn`. Donc **un rôle non couvert est SILENCIEUSEMENT absorbé par Aragorn**, `orphans` reste vide, le test reste **vert** | `cli/src/lib/library.js:270-276` · `decision-rolekey-reconciliation.md` § 10.2 |

> 🛑 **CE FAIT MORD DIRECTEMENT SUR CE LOT, et c'est son risque n° 1.** Ce lot fait passer
> `helm.roleKey` de `deploiement` à `surveillance`. Si le nouveau rôle `surveillance` était déclaré
> par la méthode **sans** être porté par un persona — ou si `helm.roleKey` était modifié **sans**
> que `charon` reprenne `deploiement` — alors :
> **Aragorn absorberait le rôle en silence, `orphans` resterait vide, et TOUTE la suite serait
> VERTE sur un squad prod cassé.** Le § 8 en fait la garde `G-SURV`, à **voir ROUGE avant** le
> changement. C'est la reprise littérale de la contrainte § 10.2 de
> `decision-rolekey-reconciliation.md` — je ne l'invente pas, je l'applique.

---

## 3. Nommage — **FIGÉ par le décideur**, transcrit sans réinterprétation

- **`Charon`** — **un seul R**. Le nocher du Styx, celui qui **fait passer**. **Jamais « Charron »**
  (l'artisan charron, deux R) : l'orthographe est **explicitement tranchée**. `id: charon`.
- **Helm garde son nom, son id `helm` et son fichier `library/personas/helm.md`.** Ce n'est **pas**
  un remplacement : c'est un **recentrage**. Par `F2`, la référence Heimdall lui appartient déjà —
  **aucune référence n'est à migrer**.
- **Pastille `🟣` pour les deux.** Cohérent avec l'usage établi (Gimli et Legolas partagent `🔴`
  parce qu'ils sont la même phase). **La pastille marque la PHASE, le nom désambiguïse.**

---

## 4. Décision retenue — la ligne de partage, et les arbitrages de détail

### 4.1 La ligne opposable, à graver

> ## ⚖️ **Charon agit SUR ORDRE. Helm agit SANS ORDRE.**
>
> C'est la **seule** frontière qui ne se rediscutera pas, parce qu'elle tient à la **nature** des
> deux missions et non à leur contenu. Toute question future du type « qui fait X ? » se tranche par
> elle : *X attend-il un feu vert humain ?* → Charon. *X doit-il se produire même si personne ne
> demande rien ?* → Helm.

| | 🆕 **Charon** — le passeur | 🌉 **Helm** — le veilleur |
|---|---|---|
| **Fait** | bascule stage → prod, alias (proxy inversé), rollback, accès/SSO | health-checks, disponibilité des endpoints, charge, **alerte** |
| **Déclencheur** | **feu vert humain tracé** (gate non négociable, **inchangé**) | **le sien** — il n'attend aucun ordre |
| **Nature** | événement | régime permanent |
| **Interdit** | modifier le code | modifier le code **et** basculer |
| `roleKey` | `deploiement` (**repris de Helm**) | `surveillance` (**NEUF**) |
| Skill | `iakaframe-deploiement` (**héritée en entier**) | `iakaframe-surveillance` (**neuve**) |
| Pastille | `🟣` | `🟣` |

### 4.2 Arbitrages de périmètre **déjà rendus** — inscrits, non rouverts

- **`D1` — UN SEUL veilleur, pas deux.** La méthode écrit « rôles surveillance / **alerte** » au
  pluriel (`methode-de-travail.md:180`) : **écarté**. Séparer *constater* et *dire* reconstruirait
  **exactement** la maladie qu'on soigne — l'état décrit par `F6` : la panne est constatée, personne
  n'est prévenu. **La mission de Helm est « voir ET dire », indivisible.**
- **`D2` — Portée : la PROD d'abord**, pas le portefeuille. Élargir tout de suite refabriquerait le
  déluge d'alertes que `robby-immo` a précisément refermé (`F9`).
- **`D3` — Pastille `🟣` pour les deux** (§ 3).

### 4.3 Arbitrages que **je tranche ici**, en autonomie (ordre du décideur)

> *« Tranche les questions de détail toi-même et écris ton arbitrage dans l'instruction. »* — Chacun
> porte **son motif**, pour qu'il soit contestable plutôt que subi.

- **`D4` — La skill `iakaframe-deploiement` GARDE son id et part **en entier** à Charon.**
  Motif : (a) sa checklist est à ~90 % de la bascule (`F3`) ; (b) **renommer l'id** coûterait le
  manifeste des skills, les fixtures vendorées, les kits et `resolve-skills` — pour zéro bénéfice ;
  (c) l'id nomme le **rôle** (`deploiement`), et **Charon porte ce rôle**. La convention reste
  cohérente avec `iakaframe-cadrage` / `iakaframe-qualite` / `iakaframe-fabrication`.

- **`D5` — Helm reçoit une skill NEUVE `iakaframe-surveillance`, dont le brouillon est
  `iakaframe-deploiement/SKILL.md:59-80` — qui est **DÉPLACÉ, pas copié**.**
  Motif : deux skills qui décrivent la même chose, c'est un périmètre qui fuit. Le § *Surveillance de
  production* et **son format de sortie** (`:71-80`) **quittent** la skill de déploiement. Ce qui
  reste chez Charon : la **check-list de bascule**, le **format de sortie de déploiement**
  (`:38-57`), le **rollback**.
  ⚠️ **Le point de couture à écrire des deux côtés** : « en cas d'anomalie → **rollback** » cesse
  d'être un geste unique. Helm **constate et alerte** ; **il ne rollback pas** (il n'a pas l'ordre).
  Charon **rollback**, sur ordre. La skill de Helm doit dire *« j'alerte, et le rollback appartient à
  Charon, sur feu vert »* ; celle de Charon doit dire *« le signal peut venir de Helm ; le feu vert
  vient de l'utilisateur »*.

- **`D6` — `roleKey` de Helm : `surveillance` (neuf). Charon prend `deploiement`.**
  Conséquences **obligatoires**, aucune n'est optionnelle :
  1. `library/roles/surveillance.md` **doit être créé** — sinon la validation de références échoue
     (`F22`) ;
  2. `methods/iakaframe.md:11` passe de **9** à **10** `roleKeys` ;
  3. `models/suggestions.json` reçoit une entrée `surveillance` — sinon **Helm perd son affectation
     de modèle** (source unique par `roleKey`) ;
  4. `roleIndex: 10` pour `surveillance` (par `F23`, 9 est pris par `frame`).

- **`D7` — L'entrée `surveillance` de `models/suggestions.json` est un HÉRITAGE DÉCLARÉ, pas une
  mesure.** Elle reprend celle de `deploiement` (`qwen3.5:9b`, alternative `gemma4:e4b`, `requires:
  [tools]`), et son champ `why` **DOIT porter la mention « hérité de `deploiement` à la scission du
  2026-08-08 — NON MESURÉ sur une tâche de veille »**.
  Motif : ce fichier a une culture de **mesure** (chaque `why` cite un banc, plusieurs corrigent une
  intuition antérieure). Y glisser une suggestion non mesurée **sans le dire** la ferait recirculer
  comme un fait. C'est exactement la faute que sa propre note § 10.6 de
  `decision-rolekey-reconciliation.md` interdit : *« une décision juste appuyée sur un fait faux est
  une dette »*.

- **`D8` — Les `tools` de Helm sont **INCHANGÉS** ; Charon reçoit **le jeu actuel de Helm**.**
  Binding : `[Read, Grep, Glob, Write, Bash, Skill]` pour les deux.
  Motif : (a) ne rien retirer à Helm = la voie la moins risquée pour la non-régression (`CA-20`) ;
  (b) le `Write` de Helm reste **nécessaire** (notes d'exploitation, état de santé, journal
  d'alerte) ; (c) son `Bash` est **la condition même** du health-check.
  ⚠️ **Ce qui change est le BORNAGE, pas la liste.** Le § *Obligation — bornage de l'écriture* de
  `helm.md:38-51` énumère aujourd'hui « la **configuration de bascule et d'alias** (proxy inversé,
  SSO, routage des accès) » : **cet item PART chez Charon**. Helm garde procédure de rollback ?
  **Non** — la procédure de rollback est un artefact de bascule : **elle part aussi**. Helm garde
  **les notes d'exploitation** (état de santé, journal d'alerte) et **rien d'autre**.
  *(Ce bornage vient d'être posé par `persona-helm-amelioration.md` H-1 ; ce lot ne le défait pas,
  il le **partage**. Cf. § 6.)*

- **`D9` — `StefFrame2` : HORS LOT, explicitement.** Cf. § 6.1 — arbitrage motivé et **exigé** par
  l'ordre de mission.

- **`D10` — Re-vendorage `iakaFrameGUI` : HORS LOT, mais les constantes de la garde côté iakaframe
  SONT dans le lot.** Cf. § 6.2 — c'est le point le plus délicat, il porte son propre encadré.

- **`D11` — La `team` n'est PAS renommée.** `teams/iakaframe-8.md` gagne `charon` et passe à **10**
  personas. `-8` est un **id opaque, pas un compteur** — le fichier le dit lui-même
  (`teams/iakaframe-8.md:13-17`) et il est **déjà** à 9 depuis `feanor`.
  ⚠️ **Précision qui évite un faux conflit** : le critère 4 de `correctif-roster-team-helm.md`
  (« **compte = nom** : la team `iakaframe-8` compte 8 personas ») est **déjà falsifié depuis
  `feanor`** — c'est un **fait constaté**, pas une décision de ce lot. Les critères **3** et **5**
  de cette même instruction (`set(team.personas) == set(binding.personaId)` et « 0 rôle non
  casté ») restent **VRAIS après ce lot** et sont repris en `CA-16` / `CA-17`.

- **`D12` — Le workflow gagne une ÉTAPE, il n'élargit pas l'existante.**
  `library/workflows/iakaframe-3phases.md` : l'étape `prod` **garde** `actorsRoleKeys: [deploiement]`
  et son **gate humain** ; une étape `surveillance` (`side: prod`, `actorsRoleKeys: [surveillance]`)
  est **ajoutée**, **sans gate**.
  Motif : écrire `[deploiement, surveillance]` sur une seule étape ferait porter **le gate humain**
  à la surveillance — ce qui **nierait la ligne de partage** (§ 4.1) dans le fichier même qui la
  décrit. L'absence de gate sur cette étape **est** la déclaration formelle de « sans ordre ».
  ⚠️ **Le nom du workflow ne change pas** (`iakaframe-3phases`) : même doctrine d'id opaque que
  `D11` — la chaîne de dev compte toujours 3 phases, le squad prod n'en est pas une.

- **`D13` — `ROLE_OF` reçoit `charon: 'deploiement'`, et `ROLE_OF.helm` reste `'coordination'`.**
  Motif : `F21` — la réconciliation de cette table est **hors périmètre déclaré** (poste B3). Y
  toucher pour Helm dans ce lot ouvrirait un chantier lexical que trois instructions ont
  explicitement gelé. **Constaté, non corrigé.**
  ⚠️ **À écrire en commentaire dans le fichier** : après ce lot, `ROLE_OF` dira que **Charon fait du
  déploiement** et que **Helm fait de la coordination** — ce qui est faux et **le sera visiblement**.
  Une dette **écrite là où elle se lit** vaut mieux qu'une dette rangée dans un ticket.

- **`D14` — `iaka-deploie` est repointée sur Charon ; aucune commande `iaka-veille` n'est créée.**
  Motif : la commande invoque la skill de bascule, qui part chez Charon — la laisser dire « (Helm) »
  serait un mensonge d'un mot. Créer `iaka-veille` serait en revanche **livrer une commande qui ne
  déclenche rien d'utile** tant que `HUB-VEILLE` n'existe pas (`F12`) : on n'ajoute pas un bouton pour
  une horloge absente. **Consigné hors lot** (§ 6.4).

---

## 5. 🛑 Ce que ce lot NE règle PAS — à dire avant de le livrer

> **Après ce lot, Helm reste un persona SANS DÉCLENCHEUR.** Il faut l'écrire noir sur blanc,
> parce que la scission peut donner l'impression contraire.

Ce que le lot **achète** réellement :

1. La mission de veille cesse d'être un **§ 5 en fin de checklist de bascule** (`F3`) et devient le
   **contrat entier** d'un persona dont la première ligne est « agit sans ordre ».
2. Le `roleKey` `surveillance` existe — donc la méthode, le workflow, le casting et la table des
   modèles **savent nommer** ce qu'aucun d'eux ne nommait.
3. Le point d'accroche du futur déclencheur est **désigné et unique** : quand `HUB-VEILLE` existera, il
   aura **un destinataire**, pas une mission à extraire d'un autre agent.

Ce que le lot **n'achète pas** : la surveillance **ne s'exécutera toujours pas toute seule**.
`F12` (pas d'horloge), `F13` (pas d'émission non bloquante) et `F14` (runner Odin-only, `Bash`
refusé) sont **intacts** à la livraison. **C'est un préalable, pas le remède.** → § 7.

---

## 6. Périmètre

### 6.1 Exclu — `StefFrame2` : **HORS LOT**, arbitrage explicite (`D9`)

> L'ordre de mission exige de trancher ce point plutôt que de le laisser implicite. **Il est
> tranché : hors lot**, avec renvoi nommé.

Trois motifs cumulés :

1. **Étanchéité déjà posée par une autre instruction.** `correctif-roster-team-helm.md` § 4 énonce
   qu'**« une seule instruction touche ce fichier »** — `resync-stefframe2-miroir-live.md`. Éditer
   la team du miroir ici **casserait cette étanchéité**.
2. **Le miroir est anonymisé, et son mapping n'est documenté nulle part** — il s'applique **à la
   main** (`resync-stefframe2-miroir-live.md` § 2.1). Y propager Charon supposerait de rejouer une
   transformation non outillée, avec un risque **de dé-anonymisation** qui est précisément l'inverse
   du but du miroir.
3. **Le miroir est DÉJÀ en retard d'un persona** (`F27` : team à **8**, **`feanor` absent**, contre
   **9** au live). Y ajouter `charon` reviendrait à **composer** la dérive au lieu de la résorber —
   le miroir passerait de « en retard de 1 » à « en retard de 1, plus une avance de 1 », état que
   personne ne sait lire.

**Conduite retenue** : le miroir reste **strictement intact**, et cela devient un **critère
vérifiable** (`CA-21`, byte-identique). La propagation de Charon vers `StefFrame2` est **renvoyée
nommément** à `specs/instructions/resync-stefframe2-miroir-live.md`, qui rapatriera d'un coup
`helm` (dette existante) **et** `charon` (dette de ce lot), dans une passe où l'anonymisation est
son sujet et pas un effet de bord.

### 6.2 🛑 Exclu — re-vendorage `iakaFrameGUI` : **HORS LOT, et le lot laisse une garde ROUGE**

> **C'est l'arbitrage le plus délicat de ce cadrage. Il porte une conséquence désagréable, assumée,
> et je préfère l'écrire que la faire découvrir.**

Le fait (`F24` + `F25`) : `cli/src/lib/vendor.js` code **en dur** `IDS`=9, `ROLE_KEYS`=9,
`SKILL_IDS`=19, `EXPECTED_COPIES`=78 — et le dépôt frère `iakaFrameGUI` **est présent** avec ses
fixtures, donc la garde **compare** au lieu de sauter.

Deux conduites possibles, **incompatibles** :

| | Conduite | Effet |
|---|---|---|
| **A** | mettre à jour les constantes **dans ce lot** (10 / 10 / 20 / **82**) | `vendor-check` **ROUGE** jusqu'au re-vendorage GUI — mais la garde **mesure le bon ensemble** |
| **B** | laisser les constantes à 9 / 9 / 19 / 78 | `vendor-check` **VERT** — mais **aveugle à Charon, au rôle `surveillance` et à la skill neuve** |

> **Je retiens A, et je recommande de séquencer le lot GUI immédiatement derrière.**
> Motif : **une garde verte qui ne regarde plus ce qu'elle est censée garder est pire qu'une garde
> rouge.** B produirait exactement le défaut que `vendor.js:1-12` existe pour fermer — un drift que
> « plus aucun référentiel externe ne permet de juger ». Et B est **silencieuse** : personne ne
> saurait que la garde a cessé de couvrir un persona.
>
> **Le précédent existe et il est nommé** : `persona-helm-amelioration.md` § 2 pt 2 a déjà assumé
> une **dette de re-vendorage GUI** en connaissance de cause. Ce lot ne crée pas la pratique, il la
> réemploie — **avec la différence qu'ici la dette est CHIFFRÉE** (`CA-22`).

**Conduite retenue** : les constantes **sont dans le lot** ; le re-vendorage GUI **ne l'est pas** ;
et l'échec attendu **doit être déclaré nommément** (`CA-22`), jamais découvert. Successeur nommé :
**`GUI-VENDOR-CHARON`** (§ 7), **~0,5 j-h**, à enchaîner sans délai.

### 6.3 Exclu — le reste, nommément

- **La construction du déclencheur** (horloge, émission, runner) → lot `HUB-VEILLE` (§ 7), **autre
  dépôt** (`~/work/iakaHub/`), **autre cadrage**.
- **La réconciliation de `ROLE_OF`** → poste B3 de `vocabulaire-roles-agnostique.md` (`D13`).
- **Le renommage de `teams/iakaframe-8`** et **du workflow `iakaframe-3phases`** (`D11`, `D12`).
- **Le portefeuille** : la veille reste bornée à la prod (`D2`).
- **La séparation constater / dire** : écartée (`D1`).

### 6.4 Consigné hors lot — trouvé en cadrant, **non traité**

| Id | Constat | Motif de non-traitement |
|---|---|---|
| **`ROSTER-FEANOR`** | `ROSTER` du garde de délégation **omet déjà `feanor`** (`F26`) — donc `Task(agent: feanor)` est **refusé** aujourd'hui | Corriger changerait le **comportement de délégation** de Fëanor, que personne n'a demandé. L'ajouter en passant, sous couvert de ce lot, serait un changement non arbitré. **Nommé, non fait.** |
| **`CHARON-IKE`** | `charon` est déjà un démon d'exploitation répandu (`F16`) | Nommage **figé** (§ 3). Signalé pour le diagnostic futur. |
| **`HUB-PERSONA-CHARON`** | `PERSONAS` d'iakaHub ne connaît pas `charon` (`F15`) | Autre dépôt. **Sans blocage** (repli permissif), mais Charon y postera sans entrée dédiée. À joindre à `HUB-VEILLE`. |
| **`IAKA-VEILLE`** | Pas de commande `iaka-veille` | Une commande qui ne déclenche rien tant que `HUB-VEILLE` n'existe pas (`D14`). |
| **`DOC-ROSTER-MIROIR`** | 🛑 **`correctif-roster-team-helm.md` § 2 décrit un état PÉRIMÉ** : il donne le miroir à **7 personas, `helm` absent**, alors qu'il est à **8, `helm` présent** (`F27`, lu le 2026-08-08). Son correctif a été appliqué, sa table de faits **pas mise à jour** — et ses §§ 5-7 (critères, jalon, pointeurs) invitent encore à vérifier une incohérence **qui n'existe plus** | **Ce lot a failli l'hériter** : j'ai d'abord recopié le chiffre au lieu de lire le fichier. **Corrigé au cadrage**, mais la source reste fausse et **re-piégera le prochain lecteur**. Corriger une instruction d'un autre lot **sans instruction** serait hors périmètre. → **À rectifier avec `resync-stefframe2-miroir-live.md`**, qui est le lot propriétaire de ce fichier |

### 6.5 Inclus — § *Fichiers concernés* exhaustif

> Un fichier **non listé ici n'est pas à modifier**. La liste est le périmètre.

**A. Canon — casting, rôles, savoir-faire**

| Fichier | Ce qui change |
|---|---|
| `library/personas/charon.md` | **CRÉÉ.** Gabarit `library/personas/_TEMPLATE.md`. `roleKey: deploiement`, `pastille: "🟣"`, `royaume: IAKAFRAME`, `skills: [iakaframe-deploiement]`, `guardrails: [identity, perimeter]`, `vignette: none`. Corps : mission (passeur), périmètre (**fait** : bascule/alias/rollback/accès-SSO ; **ne fait pas** : modifier le code → Gimli, **ni surveiller** → Helm), entrées→sorties, **gate humain non négociable**, § jalon, § bornage de l'écriture (repris de `helm.md:38-51`, **volet bascule**), § étanchéité, § identité, § pourquoi un agent |
| `library/personas/helm.md` | `roleKey: deploiement` → **`surveillance`** · `skills: [iakaframe-deploiement]` → **`[iakaframe-surveillance]`** · `description` et **mission** recentrées sur la veille · § *Périmètre* : **retire** bascule/alias/SSO/rollback (→ Charon), **ajoute** « ne bascule pas » à *Ne fait pas* · `:17` « **+ Agent de Surveillance (fusionnés)** » → **la fusion cesse** · § *Bornage de l'écriture* réduit aux **notes d'exploitation** (`D8`) · § *Gate* : le gate humain de bascule **part**, remplacé par « **aucun gate — il agit sans ordre ; il alerte, il ne bascule ni ne rollback** » · § jalon : **conservé mais requalifié** (il ne pose plus le jalon de prod, il **alerte**) · **`name`, `id`, `pastille`, `guardrails`, `royaume` INCHANGÉS** |
| `library/roles/surveillance.md` | **CRÉÉ.** `id`/`key`: `surveillance`, `label`: *Veille de production*, `roleIndex: 10` (`F23`), `scope: team` |
| `library/roles/deploiement.md` | `:14` — la phrase **agrégeante** (`F5`) perd « surveillance et alertes » |
| `library/skills/iakaframe-surveillance/SKILL.md` | **CRÉÉ.** Frontmatter `id`/`name`/`description` (déclencheurs : *surveiller la prod, vérifier la santé, health-checks, alerte*). Corps **déplacé** de `iakaframe-deploiement/SKILL.md:59-80`, **format de sortie compris** (`D5`), + § *Identité* badge `🟣 [ROYAUME][Helm]`, + la couture « j'alerte, je ne rollback pas » |
| `library/skills/iakaframe-deploiement/SKILL.md` | **RETIRE** `:59-80` (§ Surveillance + son format de sortie) · `description` : retire *surveiller la prod / vérifier la santé / health-checks* · `:84-88` (§ Place dans le cycle) : « puis tu **surveilles** » → « puis **Helm veille** » · `:91-93` (§ Identité) : badge `🟣 [ROYAUME][Helm]` → **`[ROYAUME][Charon]`** · `:67-69` : la couture d'alerte **pointe vers Helm** |

**B. Assemblage**

| Fichier | Ce qui change |
|---|---|
| `methods/iakaframe.md` | `:11` `roleKeys` : **+ `surveillance`** (9 → **10**) |
| `teams/iakaframe-8.md` | `:4` `personas` : **+ `charon`** (9 → **10**). **Pas de renommage** (`D11`). Ajouter une note renvoyant à la note d'id opaque existante |
| `bindings/iakaframe-claude-default.md` | **+ 1 ligne** : `{ personaId: charon, runner: claude-code, model: "sonnet", tools: [Read, Grep, Glob, Write, Bash, Skill] }`. **Ligne `helm` inchangée** (`D8`) |
| `bindings/iakaframe-ollama-default.md` | idem, au format de ce binding |
| `library/workflows/iakaframe-3phases.md` | **+ 1 étape** `surveillance` (`side: prod`, `actorsRoleKeys: [surveillance]`, **sans gate**) ; étape `prod` **inchangée** (`D12`) ; corps `:30-34` réécrit pour nommer les **deux** |
| `models/suggestions.json` | **+ entrée `roles.surveillance`** (`D7`), `why` portant **« NON MESURÉ »** ; `updatedAt` → `2026-08-08` |

**C. Mécanique (CLI, gardes, kits)**

| Fichier | Ce qui change |
|---|---|
| `cli/src/lib/agents.js` | `ROLE_OF` **+ `charon: 'deploiement'`** ; **commentaire** actant la dette `ROLE_OF.helm` (`D13`) |
| `cli/src/lib/vendor.js` | `IDS` 9→**10** (`charon`, **ordre alphabétique** : après `aragorn`) · `ROLE_KEYS` 9→**10** · `SKILL_IDS` 19→**20** · `EXPECTED_COPIES` 78→**82** (+1 persona, +1 golden, +1 rôle, +1 skill) · commentaire de décompte `:71-72` mis à jour (`D10`) |
| `kits/iakaframe-claude/global/hooks/guard-core.mjs` | `ROSTER` **+ `"charon"`**. `PASTILLES` **inchangée** (`🟣` y figure déjà). **Ne PAS ajouter `feanor`** (`ROSTER-FEANOR`, § 6.4) |
| `kits/iakaframe-codex/global/hooks/guard-core.mjs` | idem |
| `kits/iakaframe-claude/.claude/commands/iaka-deploie.md` | « (Helm) » → « (Charon) » (`D14`) |
| `kits/iakaframe-ollama/{AGENTS.md,MODELES.md}` · `kits/iakaframe-codex/{AGENTS.md,MODELES.md}` · `kits/iakaframe-openwebui/{AGENTS.md,README.md,MODELES.md}` · `kits/iakaframe-anythingllm/{AGENTS.md,README.md,MODELES.md}` | entrée Charon + libellé Helm recentré |
| `kits/iakaframe-openwebui/models/charon.json` | **CRÉÉ**, sur le patron de `models/helm.json` |
| `kits/iakaframe-anythingllm/prompts/charon.md` | **CRÉÉ**, sur le patron de `prompts/helm.md` |
| `kits/iakaframe-claude/global/CLAUDE.md` | roster |

**D. Narratif & doc**

| Fichier | Ce qui change |
|---|---|
| `methode-de-travail.md` | `:113` tableau du roster : **+ Charon**, ligne Helm recentrée · `:174-177` tableau du squad prod : **deux agents** au lieu d'un · 🛑 **`:180` — « Le squad prod est extensible (rôles surveillance / alerte dédiés à terme) » DOIT être réécrit** : l'extension **a eu lieu**, et le pluriel « surveillance / alerte » est **explicitement écarté** (`D1`). Le laisser tel quel ferait annoncer comme futur ce qui est livré, **et** ferait vivre une option refusée |
| `methode-de-travail.html` · `iakaframe-methode.html` | **RÉGÉNÉRÉS** par `cli/scripts/gen-methode-vitrine.mjs` (`F28`). **Jamais édités à la main** |
| `specs/equipe-agents.md` | fiche Charon + fiche Helm recentrée (référence canonique du roster) |
| `library/skills/iakastart/SKILL.md` | tableau du roster `:63` + ligne de dispatch `:81` (« **helm** → promotion en production ») : **scindées** |
| `library/skills/iakaframe-odin/SKILL.md` · `library/skills/iakaframe-aragorn/SKILL.md` · `library/skills/iakaframe-init/SKILL.md` · `library/skills/README.md` | mentions du roster |
| `README.md` · `docs/commandes.md` · `docs/modeles-ia-des-agents.md` · `BACKLOG.md` | roster / table des modèles (`docs/modeles-ia-des-agents.md` : **régénéré** par `gen-models-doc.mjs`) |

**E. Artefacts DÉRIVÉS — régénérés, jamais écrits à la main (`F28`)**

| Artefact | Générateur |
|---|---|
| `cli/test/fixtures/agents-golden/charon.md` (**créé**) + `helm.md` (**régénéré**) | `node cli/scripts/gen-agents-golden.mjs` |
| `cli/test/fixtures/skills-golden/manifest.json` | `node cli/scripts/gen-skills-golden.mjs` |
| Contrats déployés `~/.claude/agents/` | `iakaframe agents --action generate --global` puis `--check` = **0** |
| Vitrine HTML | `node cli/scripts/gen-methode-vitrine.mjs` |
| `docs/modeles-ia-des-agents.md` | `node cli/scripts/gen-models-doc.mjs` |

**F. Tests à étendre** (ils **codent en dur** des rosters/cardinaux — mesuré)

`cli/test/library.test.js` · `agents.test.js` · `generate-agents.test.js` · `resolve-skills.test.js` ·
`parite-generateurs.test.js` · `vendor-check.test.js` · `guard-core.test.js` · `vitrine-methode.test.js` ·
`verbs-args.test.js` — **plus** la garde neuve `G-SURV` (§ 8).

---

## 7. Lots successeurs — nommés, chiffrés, **hors de cette instruction**

| Id | Objet | Dépôt | Coût | Séquencement |
|---|---|---|---|---|
| **`GUI-VENDOR-CHARON`** | Re-vendorer les fixtures d'`iakaFrameGUI` (persona + golden `charon`, rôle `surveillance`, skill `iakaframe-surveillance`, team, binding, méthode, workflow) → `vendor-check` **repasse au vert** | `~/work/iakaFrameGUI/` | **~0,5 j-h** | **immédiatement après** ce lot (§ 6.2) |
| **`HUB-VEILLE`** | **Le déclencheur de Helm.** Trois briques mesurées absentes : **(1)** une **horloge calendaire** (`F12` ; ordonnanceur crontab, **pas** `setInterval` — `F17`) ; **(2)** une **émission non bloquante** `POST /notify` (`F13` : `POST /ask` attend une réponse humaine, il ne peut pas porter une alerte) ; **(3)** un **runner généralisé** — aujourd'hui câblé sur Odin et **interdit de `Bash`** (`F14`), donc **incapable de health-check**. Plus `HUB-PERSONA-CHARON` (`F15`) | `~/work/iakaHub/` | **2 à 3 j-h**, **cadrage séparé** | après ce lot ; **c'est lui qui incarne réellement la veille** |

> **`HUB-VEILLE` est la vraie réponse à `F8`** (« seul un déclencheur vivant HORS de n8n y répond ») et
> au point 2 de `SUP-1` de `robby-immo`. **Ce lot-ci le rend possible et ne le remplace pas.**

---

## 8. Risques — et la garde qui les ferme

| # | Risque | Gravité | Mitigation (obligatoire) |
|---|---|---|---|
| **R1** | 🛑 **Changer un `roleKey` est INVISIBLE des suites** (`F29`), et le filet existant **dit faussement que tout va bien** : un rôle non couvert est **absorbé en silence par Aragorn** (`F30`) | **haute** | **`G-SURV`** — garde écrite **AVANT** le changement, **vue ROUGE**, puis verte. Elle **ne peut pas** se contenter de `orphans == []` (structurellement vide ici) : elle **DOIT** asserter **`coveredByCoordinator == []`** sur la vraie bibliothèque. `CA-1`/`CA-2` |
| **R2** | Le rôle `surveillance` déclaré sans fichier de rôle → refus de référence (`F22`) | moyenne | `library/roles/surveillance.md` **dans le même commit** que `methods/iakaframe.md`. `CA-5` |
| **R3** | `vendor-check` rouge après le lot (`F24`/`F25`) | moyenne | **Assumé et déclaré** (`D10`) : `CA-22` exige que l'échec soit **nommé et chiffré**, jamais découvert. `GUI-VENDOR-CHARON` enchaîné |
| **R4** | Une skill **dupliquée** (surveillance décrite des deux côtés) reconstruirait la fusion qu'on défait | moyenne | `D5` : **déplacement**, pas copie. `CA-9` vérifie l'**absence** côté Charon autant que la présence côté Helm |
| **R5** | Le `Write` de Helm reste borné à des artefacts qu'il ne produit plus (bascule/alias/rollback) → **blanc-seing rampant** | moyenne | `D8` : bornage **réduit** aux notes d'exploitation, **dans le même commit** que le changement de mission — jamais l'un sans l'autre (c'est la clause de `persona-helm-amelioration.md` H-1, § 4). `CA-12` |
| **R6** | L'étape `surveillance` sans `gate` casse un parseur qui présumerait un gate par phase | faible | `CA-14` : `iakaframe frame --lint` **vert** et `assemble` sans finding bloquant. **Si un parseur l'exige : REMONTER, ne pas inventer un gate** — un gate sur la veille **nierait `D1`/§ 4.1** |
| **R7** | Régression sur les **164** fichiers mentionnant Helm (`F18`) | moyenne | `CA-20` : non-régression **explicite** de Helm. Relecture par **groupes** (§ 6.5 A→F), jamais fichier par fichier |
| **R8** | Dé-anonymisation du miroir par propagation naïve | **haute si déclenchée** | `D9` : miroir **intact**, vérifié **byte-à-byte** (`CA-21`) |
| **R9** | Suggestion de modèle non mesurée recirculant comme un fait | faible | `D7` : mention **« NON MESURÉ »** dans le `why`. `CA-8` |

---

## 9. Étapes d'implémentation

> **Ordre imposé.** L'étape 1 **avant** tout le reste : c'est la seule qui rende le défaut visible
> (`R1`). Commits **atomiques**, un par groupe.

1. **`G-SURV` d'abord, et ROUGE.** Écrire la garde de couverture de rôle
   (`coveredByCoordinator == []` sur la bibliothèque réelle) **et un cas** asserant que
   `deploiement` **et** `surveillance` sont portés par un persona **dédié**. La **voir échouer** sur
   l'état actuel (`surveillance` n'existe pas). **Commit dédié.**
2. **Rôles.** Créer `library/roles/surveillance.md` (`roleIndex: 10`) ; désagréger
   `library/roles/deploiement.md:14`.
3. **Skills.** Créer `iakaframe-surveillance/SKILL.md` en **déplaçant** `:59-80` de
   `iakaframe-deploiement/SKILL.md` ; amputer et rebadger cette dernière (`D5`). **Un seul commit** :
   la surveillance ne doit exister ni deux fois ni zéro fois.
4. **Personas.** Créer `charon.md` ; recentrer `helm.md`. **Un seul commit** : le bornage de
   l'écriture et le changement de mission partent **ensemble** (`R5`).
5. **Assemblage.** `methods/` + `teams/` + les **deux** bindings + workflow + `models/suggestions.json`.
   → **`G-SURV` doit passer au VERT ici.** Si elle reste rouge, **s'arrêter** : le lot est faux.
6. **Mécanique.** `agents.js` (`ROLE_OF` + commentaire de dette) · `vendor.js` (4 constantes) ·
   les **deux** `guard-core.mjs` · kits · `iaka-deploie.md`.
7. **Dérivés — régénérés, jamais écrits** (§ 6.5 E) : goldens, manifeste, contrats déployés
   (`--check` = 0), vitrine, doc modèles.
8. **Narratif.** `methode-de-travail.md` (dont **`:180`**, `R`-critique), `specs/equipe-agents.md`,
   `iakastart`, README/docs/BACKLOG.
9. **Tests.** Étendre les 9 suites (§ 6.5 F). `node --test` **vert**, **sauf `vendor-check`**, dont
   l'échec est **déclaré** (`CA-22`).
10. **Contrôle final.** Dérouler `CA-1` → `CA-24` un par un.

---

## 10. Critères d'acceptation — **vérifiables un par un**

> Aucun critère n'est validable « à l'œil ». Chacun porte **sa vérification**.

### Garde et couverture de rôle

- [ ] **`CA-1`** — `G-SURV` a été **vue ROUGE** sur l'état d'avant (trace dans le message de commit
      de l'étape 1). *Un lot qui livre sans avoir vu la garde échouer n'est pas fini* (`F29`/`F30`).
- [ ] **`CA-2`** — `G-SURV` asserte **`coveredByCoordinator == []`**, **pas** `orphans == []`.
      Vérif : lecture du test ; `orphans` est structurellement vide sur cette team (`library.js:273`).
- [ ] **`CA-3`** — `assemble('iakaframe','iakaframe-8',…)` rend **0 orphelin**, **0 rôle pris par le
      coordinateur**, **0 persona inconnue**.
- [ ] **`CA-4`** — `deploiement` est porté par **`charon`** et **par lui seul** ; `surveillance` par
      **`helm`** et **par lui seul**. Vérif : union des `roleKey` du casting, sans doublon sur ces deux clés.

### Canon

- [ ] **`CA-5`** — `library/roles/surveillance.md` existe, `key: surveillance`, `roleIndex: 10`, et
      `methods/iakaframe.md:11` porte **10** `roleKeys`. Vérif : `iakaframe` charge la méthode **sans
      référence manquante** (`F22`).
- [ ] **`CA-6`** — `library/personas/charon.md` : `roleKey: deploiement`, `pastille: "🟣"`,
      `skills: [iakaframe-deploiement]`, `guardrails: [identity, perimeter]`. **Aucun `runner` ni
      `model`** dans le frontmatter (casting pur).
- [ ] **`CA-7`** — `library/personas/helm.md` : `roleKey: surveillance`, `skills:
      [iakaframe-surveillance]`, et **`id`, `name`, `pastille`, `royaume`, `guardrails` strictement
      inchangés**. Vérif : `git diff` sur le frontmatter — exactement **2** champs modifiés.
- [ ] **`CA-8`** — `models/suggestions.json` porte `roles.surveillance`, et son `why` contient la
      chaîne **« NON MESURÉ »**. Vérif : `grep`.

### Étanchéité des deux skills

- [ ] **`CA-9`** — Le § *Surveillance de production* et **son format de sortie** sont **présents**
      dans `iakaframe-surveillance/SKILL.md` et **ABSENTS** de `iakaframe-deploiement/SKILL.md`.
      Vérif : `grep -c "Health-check"` = **1** côté surveillance, **0** côté déploiement.
- [ ] **`CA-10`** — `iakaframe-deploiement/SKILL.md` § *Identité* porte **`[ROYAUME][Charon]`** ;
      `iakaframe-surveillance/SKILL.md` porte **`[ROYAUME][Helm]`**. Vérif : `grep`.
- [ ] **`CA-11`** — La **couture** est écrite **des deux côtés** : la skill de Helm dit qu'il
      **alerte et ne rollback pas** ; celle de Charon dit que **le rollback lui revient, sur feu
      vert**. Vérif : relecture croisée.
- [ ] **`CA-12`** — Le § *bornage de l'écriture* de `helm.md` **ne mentionne plus** la configuration
      de bascule/alias/SSO **ni** la procédure de rollback ; celui de `charon.md` **les porte**.
      Vérif : `grep -i "alias\|SSO\|rollback"` sur les deux chartes.
- [ ] **`CA-13`** — Le § *Gate* de `helm.md` **n'exige plus de feu vert humain** et énonce
      explicitement qu'**il agit sans ordre** ; celui de `charon.md` porte le **gate humain non
      négociable** mot pour mot. Vérif : relecture.

### Assemblage

- [ ] **`CA-14`** — `library/workflows/iakaframe-3phases.md` porte **5 étapes** (`p1`,`p2`,`p3`,
      `prod`,`surveillance`) ; l'étape `prod` garde `actorsRoleKeys: [deploiement]` **et son gate
      humain** ; l'étape `surveillance` porte `[surveillance]` **et aucun gate**. Vérif :
      `iakaframe frame --lint` **sans finding bloquant**.
- [ ] **`CA-15`** — `teams/iakaframe-8.md` porte **10** personas dont `charon` ; **le nom du fichier
      et l'id sont inchangés**.
- [ ] **`CA-16`** — *(reprise du critère 3 de `correctif-roster-team-helm.md`)*
      `set(team.personas) == set(binding.personaId)` sur **`iakaframe-claude-default`**. Vérif : test.
- [ ] **`CA-17`** — *(reprise du critère 5)* **0 rôle de la méthode non casté**.
- [ ] **`CA-18`** — Les **deux** bindings portent une ligne `charon` ; la ligne `helm` est
      **inchangée dans les deux** (`D8`). Vérif : `git diff` = **+1 ligne**, **0 ligne modifiée**.

### Mécanique

- [ ] **`CA-19`** — `ROSTER` des **deux** `guard-core.mjs` contient `"charon"` ; `verdictDelegation('charon')`
      rend `{ known: true, refused: false }`. **`feanor` reste absent** (`ROSTER-FEANOR`). Vérif :
      `cli/test/guard-core.test.js`.

### Non-régression et périmètre

- [ ] **`CA-20`** — 🛑 **NON-RÉGRESSION DE HELM.** Sur les **108** fichiers live le mentionnant
      (`F18`), **aucune référence à `helm` n'est rompue** du fait qu'on lui retire la bascule :
      (a) `iakaframe agents --action list` le rend avec un rôle **non vide** ;
      (b) `resolveSkills('helm')` rend **`iakaframe-surveillance`** (jamais `[]`, jamais une skill
      introuvable) ;
      (c) son contrat déployé se **génère** et `--check` = **0** ;
      (d) `iakaframe models` lui affecte un modèle (**pas** de ligne vide — c'est l'effet exact que
      `D6.3` prévient) ;
      (e) **aucun** fichier ne le décrit encore comme l'agent qui **bascule** (vérif :
      `grep -rn "Helm" | grep -i "bascul\|alias\|feu vert"` → **0 ligne**, hors historique cité et
      hors `frames/releases/`).
- [ ] **`CA-21`** — `frames/releases/StefFrame2/` est **byte-identique** à l'état d'avant. Vérif :
      `git diff --stat frames/releases/StefFrame2/` → **vide** (`D9`).
- [ ] **`CA-22`** — 🛑 **L'ÉCHEC DE `vendor-check` EST DÉCLARÉ, PAS DÉCOUVERT.** Le message de commit
      **et** le rapport de remise nomment : le test en échec, le **nombre exact** de fixtures
      manquantes côté GUI (**4** : persona `charon`, golden `charon`, rôle `surveillance`, skill
      `iakaframe-surveillance`), et le lot successeur **`GUI-VENDOR-CHARON`**. Vérif : relecture du
      commit (`D10`).
- [ ] **`CA-23`** — `node --test` **vert sur toutes les suites sauf `vendor-check`**. Tout **autre**
      échec est un **défaut du lot**, pas une dette.
- [ ] **`CA-24`** — Les artefacts dérivés sont **régénérés par leurs générateurs**, jamais édités.
      Vérif : rejouer les 4 générateurs (`F28`) → `git diff` **vide** après régénération.

---

## 11. Estimation — jalon P1→P2

> Obligatoire au gate de clôture de cadrage. **Ordre de grandeur assumé et révisable**, jamais un
> engagement ferme. À **rappeler à la clôture du lot**, confronté au temps réel.

| Composante | Chiffre |
|---|---|
| **Équivalent jour-homme** (spec fermée) | **2,5 à 3,5 j-h** |
| **Complexité** | **moyenne** — beaucoup de surfaces, peu de logique |
| **Risque** | **moyen-haut**, et **concentré sur un point unique** : `R1`/`F30` — le changement est **invisible des suites** et le filet **ment dans le bon sens**. C'est `G-SURV` qui porte tout le lot |

**Répartition** — utile pour découper si le décideur préfère deux passes :

| Bloc | Coût |
|---|---|
| `G-SURV` (garde d'abord, rouge puis verte) | ~0,4 j-h |
| Canon (2 personas, 2 rôles, 2 skills) | ~0,8 j-h |
| Assemblage (méthode, team, 2 bindings, workflow, modèles) | ~0,3 j-h |
| Mécanique (CLI, 2 gardes, 4 kits, commande) | ~0,5 j-h |
| Dérivés + extension des 9 suites | ~0,6 j-h |
| Narratif & doc (**le poste le plus sous-estimé** — `F19`) | ~0,6 j-h |

**Inconnues susceptibles de faire glisser l'estimation** — nommées, pas masquées :

1. **`F19` — le volume de propagation est le double de l'annonce** (164 fichiers, 108 live, contre
   80 annoncés). C'est **la** inconnue dominante : le poste narratif peut doubler s'il faut relire
   au fil du texte plutôt que par groupes.
2. **`R6`** — si un parseur (CLI ou cœur GUI) exigeait un `gate` par étape de workflow, l'étape
   `surveillance` demanderait un arbitrage : **remonter**, ne pas inventer un gate (`D12`).
3. **Les kits** portent des fichiers **par agent** (`models/*.json`, `prompts/*.md`) sur **4**
   runners : le coût dépend de leur degré réel de duplication, **non audité en détail** ici.
4. **`vendor-check`** : si `GUI-VENDOR-CHARON` était fait dans la foulée, **+0,5 j-h** et la garde
   repasse au vert dans la même fenêtre. Recommandé.
5. **Non compté ici** : `HUB-VEILLE` (**2 à 3 j-h**, autre dépôt, autre cadrage) — sans lui, la veille
   **ne s'exécute toujours pas** (§ 5).

---

## 12. Jalon — gate P1→P2

```
  ___    _    _  __    _    _____ ____      _    __  __ _____
 |_ _|  / \  | |/ /   / \  |  ___|  _ \    / \  |  \/  | ____|
  | |  / _ \ | ' /   / _ \ | |_  | |_) |  / _ \ | |\/| |  _|
  | | / ___ \| . \  / ___ \|  _| |  _ <  / ___ \| |  | | |___
 |___/_/   \_\_|\_\/_/   \_\_|   |_| \_\/_/   \_\_|  |_|_____|

      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|

        SCISSION DU SQUAD PROD
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 **Gandalf** (Cadrage, P1) | `specs/instructions/scission-squad-prod-charon-helm.md` — instruction fermée : 🆕 **Charon** (`deploiement`, sur ordre) · 🌉 **Helm** recentré (`surveillance`, sans ordre) · 30 faits mesurés · 24 critères d'acceptation · `StefFrame2` **hors lot** · `vendor-check` **rouge déclaré** · **et son estimation : 2,5 à 3,5 j-h** | **L'utilisateur (Stéphane) — décideur.** Gate **humain** : Gandalf **propose** un périmètre, il ne le **valide** pas |

**Fichiers à vérifier avant validation** (`chemin:ligne`, cliquables) :

- L'instruction : `/Users/sjupin/work/iakaframe/specs/instructions/scission-squad-prod-charon-helm.md`
- La fusion à défaire : `/Users/sjupin/work/iakaframe/library/personas/helm.md:17`
- Heimdall déjà écrit (`F2`) : `/Users/sjupin/work/iakaframe/library/personas/helm.md:16`
- La surveillance enfouie (`F3`) : `/Users/sjupin/work/iakaframe/library/skills/iakaframe-deploiement/SKILL.md:59`
- L'extension annoncée, à réécrire : `/Users/sjupin/work/iakaframe/methode-de-travail.md:180`
- Le workflow à une seule étape prod (`F4`) : `/Users/sjupin/work/iakaframe/library/workflows/iakaframe-3phases.md:9`
- 🛑 Le filet qui ment (`F30`) : `/Users/sjupin/work/iakaframe/cli/src/lib/library.js:272`
- 🛑 Les cardinaux en dur (`F24`) : `/Users/sjupin/work/iakaframe/cli/src/lib/vendor.js:73`
- Le roster du garde (`F26`) : `/Users/sjupin/work/iakaframe/kits/iakaframe-claude/global/hooks/guard-core.mjs:115`
- Le miroir déjà périmé — **8 personas, `feanor` absent** (`F27`, fait rectifié au cadrage) : `/Users/sjupin/work/iakaframe/frames/releases/StefFrame2/teams/iakaframe-8.md:4`
- **iakaHub sans horloge** (`F12`/`F13`) : `/Users/sjupin/work/iakaHub/src/hub/adminServer.js:18`
- **iakaHub interdit `Bash`** (`F14`) : `/Users/sjupin/work/iakaHub/src/runner/odinRunner.js:29`

---

### ✅ JALON VALIDÉ — 2026-08-08

**Validé par : le décideur (Stéphane).** Gate **P1 → P2 franchi.** Le lot passe en **réalisation
(⚒️ Gimli)** au prochain ordre.

Les **trois points** qui appelaient un oui explicite (§ *Statut*) sont **accordés nommément** :

| # | Point soumis | Verdict |
|---|---|---|
| **1** | **`D10`** — `vendor-check` **ROUGE** assumé entre ce lot et `GUI-VENDOR-CHARON` (§ 6.2) | ✅ **OUI.** **Motif retenu, dans les termes du décideur** : *une garde verte qui ne regarde plus rien est pire qu'une rouge.* L'argument du cadrage est retenu **tel quel** — la conduite **B** (laisser les cardinaux à 9/78 pour garder le test vert) reste **écartée** |
| **2** | **`D9`** — `StefFrame2` **hors lot**, propagation renvoyée nommément à `resync-stefframe2-miroir-live.md` (§ 6.1) | ✅ **OUI** |
| **3** | **`HUB-VEILLE`** — acte pris que **Helm reste sans déclencheur à la livraison** (§ 5) | ✅ **OUI — acte pris.** Ce lot est un **préalable, pas le remède** |

> **Ce que la validation ne fait PAS bouger.** Le périmètre est **fermé** : aucun fait, aucun
> critère d'acceptation, aucun fichier n'a été ajouté au moment de la validation. Les 30 faits, 14
> décisions et 24 critères sont ceux soumis au gate. **L'estimation validée reste 2,5 à 3,5 j-h**,
> à **rappeler à la clôture du lot** et à confronter au temps réel (`methode-de-travail.md`
> § Jalons — l'estimation n'est pas un engagement ferme, elle sert à affiner les suivantes).

---

## Statut

**VALIDÉ le 2026-08-08 par le décideur (Stéphane) — PRÊT POUR P2 (⚒️ Gimli).** La décision de
scission était **rendue** ; cette instruction la **ferme**, et le gate P1→P2 est **franchi** (§ 12).

Les trois points qui appelaient un **oui explicite** avant réalisation l'ont **tous reçu** — détail
et motifs au § 12, *Jalon validé* :

1. **`D10`** — `vendor-check` **rouge** assumé entre ce lot et `GUI-VENDOR-CHARON` (§ 6.2), plutôt
   qu'une garde verte devenue aveugle. → ✅ **accordé**, motif retenu tel quel.
2. **`D9`** — `StefFrame2` **hors lot**, propagation renvoyée à `resync-stefframe2-miroir-live.md`
   (§ 6.1). → ✅ **accordé**.
3. **`HUB-VEILLE`** — prendre acte que **Helm reste sans déclencheur à la livraison** (§ 5), et que
   son incarnation réelle demande **2 à 3 j-h de plus dans un autre dépôt**. → ✅ **acte pris**.

> **Périmètre CLOS.** Aucun fait, décision, critère ou fichier n'a été ajouté à la validation :
> **30 faits · 14 décisions · 24 critères**, identiques à ce qui a été soumis au gate.
> **Estimation validée : 2,5 à 3,5 j-h** — à rappeler et confronter au réel à la clôture du lot.

## Sources

- [strongSwan — charon (démon IKEv2)](https://docs.strongswan.org/docs/latest/daemons/charon.html)
- [strongSwan — charon-systemd](https://docs.strongswan.org/docs/latest/daemons/charon-systemd.html)
- [Cron vs setInterval in Node.js — Which Should You Use?](https://dev-brains-ai.com/blog/cron-vs-setinterval-nodejs)
- [Everything you need to know about Node.js Cronjobs](https://logsnag.com/blog/nodejs-cronjobs)
