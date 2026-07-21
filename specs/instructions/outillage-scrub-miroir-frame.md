# Instruction — Outiller le scrub du miroir : gates par CLASSES, pas par énumération

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (P2). Statut en fin de doc.
> **Outillage du cadreur : `Bash` INDISPONIBLE** cette session. Tous les faits ci-dessous sont
> mesurés via `Grep`/`Glob`/`Read` (comptages par listing de fichiers, occurrences par `grep -o`).
> **Ce qui n'a PAS pu être mesuré est déclaré comme tel** (§ 2.6) — notamment les **dates de
> fichiers** et le **contenu des `.zip`** (binaire).
> Réf. : `specs/instructions/resync-stefframe2-miroir-live.md` (§ 4.2 table, § 6 gate, § 9 suivi),
> `specs/instructions/frame-stefframe2.md` (§ 5.2 gate `cli/`, § 11 règles de gate).

---

## 1. Besoin (reformulé)

Le décideur pose : **« si le process d'amélioration a validé les modifs, on les inclut dans le
frame »** — le frame est un **miroir** du canon, pas un instantané figé.

Ce principe n'est pas neuf : `resync-stefframe2-miroir-live.md` § 9 (19/07) l'écrivait déjà
(« la réponse durable à "le frame est un miroir du live" ») et le classait en **suivi recommandé
non bloquant**. Le décideur le **réaffirme**. La question du présent cadrage n'est donc pas
*faut-il propager* — c'est tranché — mais **à quelle condition la propagation est sûre**.

**Le raisonnement d'Odin, vérifié et retenu** : un scrub manuel appliqué **une fois** est risqué ;
appliqué à **chaque** propagation, il devient une **fuite garantie à terme**. Il suffit qu'un nom
propre créé après la rédaction de la liste traverse une fois. **Le brief avance `iakaHub` comme
preuve. La mesure va bien au-delà : 86 occurrences ont déjà traversé** (§ 2.1). Le raisonnement est
donc **confirmé, et sous-estimé**. L'outillage passe de « recommandé » à **précondition**.

---

## 2. Faits mesurés (lecture réelle — plusieurs faits du brief sont corrigés)

### 2.1 ✅ CORRECTION — la fuite corpus est de **86 occurrences**, pas 3 écarts

Le brief annonce « trois écarts réels » et « `iakaHub` (11 occurrences) ». Mesure exhaustive sur
`frames/releases/StefFrame2/` :

| Token | Occurrences | Fichiers | Nature |
|---|---|---|---|
| `iakaide` / `iakaIDE` | **~30** | `cli/` (go.js ×10, config.js ×8, vocab.js ×4, index.js ×2, README ×5), skills `log-conversation` ×3, kits README ×4 | produit du portefeuille |
| `Hermes` | **21** | `personas/aragorn.md` ×3 (+ ×3 dupliqués), skills `aragorn` ×9, `init` ×2, `methode-de-travail.md` ×2, `cli/src/lib/close.js` | service n8n privé |
| `iakagraph` | **12** | `personas/loki.md` ×3 (+ dup), `roles/design.md`, `personas/aragorn.md` | dépôt privé |
| `iakaHub` | **11** | `methode-de-travail.md` (section entière) | produit du portefeuille |
| `stephane` | **3** | `cli/src/lib/consolidate.js:111,115` | identité du décideur |
| `sjupin`, `192.168`, `naonedge`, `iakabox`, `iakaFrameGUI`, `AppFlowy` | **0** | — | — |

**Le fait qui décide, et il est plus fort que le brief ne le dit** : les tokens à **0** sont
**exactement** ceux que le gate § 6-A de `resync-stefframe2-miroir-live.md` énumère. Les **86**
occurrences qui traversent sont **exactement** celles qu'il n'énumère pas. Le gate ne mesure pas la
propreté du frame — **il mesure sa propre liste**. C'est la démonstration en acte, chiffrée, que
l'énumération échoue. Ce gate est **vert aujourd'hui** sur un frame qui fuite 86 fois.

### 2.2 ✅ CORRECTION — il n'y a pas de « test qui échoue à tester sa propre règle » : **il n'y a aucun test**

Le brief dit : « le grep de contrôle cherche le littéral `:3001` et ne matche pas `port: 3001` — le
test du projet échoue à tester sa propre règle ». **Le fait technique est exact** (mesuré :
`frame-stefframe2.md:142` exige le retrait de `:3001` ; `:151` grep le littéral `:3001` ;
`frames/releases/StefFrame2/cli/src/commands/services.js:11` contient `port: 3001` — non matché).

**Mais la qualification est fausse, et dans le sens aggravant** : ce grep n'est **pas un test**.
Recherche de `3001|StefFrame|anonym|scrub` dans `cli/test/` (36 fichiers) → **aucune correspondance**.
C'est une **ligne de recette dans un `.md`, à exécuter à la main**. Il n'existe **aucun test
automatisé d'anonymisation** dans la suite. Ce n'est pas un test défaillant : c'est un **angle mort
complet**. La suite `377/376/0/1` ne couvre pas le frame.

### 2.3 🔴 FAIT NOUVEAU, NON SIGNALÉ — **collision d'identifiant `iakaframe-git`** : la table de mapping est CADUQUE

**C'est le fait le plus lourd du lot, et il bloque le rattrapage du delta.**

Le canon a adopté une **architecture en couches** (`layer: capacity` → `family` → `product`),
postérieure à la table de mapping du 19/07 :

- **Canon** `library/skills/iakaframe-git/SKILL.md:2-6` → `id: iakaframe-git`, `layer: family`,
  `subskills: [iakaframe-forgejo]`. C'est la **famille de protocole** git, agnostique par
  construction.
- **Miroir** `frames/releases/StefFrame2/library/skills/iakaframe-git/SKILL.md:2` → `id:
  iakaframe-git`, **sans layer**, corps = « crée le dépôt distant… `<GIT_REMOTE_URL>` ». C'est
  l'**anonymisation de `iakaframe-forgejo`**, c'est-à-dire le **produit**.

**Même identifiant, deux sémantiques incompatibles.** La règle `forgejo → git` de
`resync-stefframe2-miroir-live.md:129` **collisionne désormais avec un `iakaframe-git` canonique
distinct**. Toute propagation qui applique cette table **écrase la famille par le produit** ou crée
un **doublon d'id**. → **La table § 4.2 doit être refondue avant tout rattrapage** (§ 5, Lot 2).

**Contrepartie — excellente nouvelle** : les 4 skills `layer: product` du canon sont exactement
`iakaframe-forgejo`, `iakaframe-appflowy-doc`, `iakaframe-docker`, `iakaframe-log-conversation` —
c'est-à-dire **exactement les porteuses de nommage propriétaire**. Le canon a donc **isolé de
lui-même** ce que l'anonymisation devait retirer. La doctrine de mapping cesse d'être une table de
renommage et devient une **règle structurelle** : *le miroir embarque `capacity` + `family`, et
**omet la couche `product`***. Une règle lue dans une **métadonnée déjà présente** — pas une liste.

> ⚠️ `library/skills/iakaframe-naonedge/SKILL.md` n'a **aucun `layer:`** alors qu'elle est
> manifestement `product`. Trou de classement à corriger (§ 7, C4).

### 2.4 ✅ CORRECTION — « 11 skills manquantes » : la mesure donne **6**

Canon = **24** skills, miroir = **17**. Écart brut 7, mais après application du mapping
(`forgejo↔git`, `appflowy-doc↔humandoc`, `naonedge↔design`, tous **présents** au miroir), les skills
réellement absentes sont **6** : `iakaframe-gestion-de-source`, `iakaframe-conteneurisation`,
`iakaframe-memoire-humaine`, `iakaframe-journal-conversation`, `iakaframe-jalon`,
`iakaframe-fabrication`.

Fait notable : **5 des 6 sont des `layer: capacity`** — la couche agnostique introduite après le
build. Le miroir n'a pas raté du contenu au hasard : il a raté **une génération d'architecture**.

Principes : canon **18**, miroir **16**. Manquent `canon-avant-citation` et
`preuve-avant-declaration` — **confirmant le fait bloquant du brief** : corriger le `SKILL.md` du
bundle sans eux livrerait une **référence pendante**.

### 2.5 ✅ CONFIRMÉ, et retourné — le fork `cli/` est une **amélioration jamais remontée**

- Canon `cli/src/commands/services.js:11` → `const DEFAULT_HOSTS = ['192.168.2.11',
  '192.168.2.12', 'localhost', '127.0.0.1'];` — **IP privées en dur**.
- Miroir, même fichier `:8` → `process.env.IAKAFRAME_HOSTS || ["localhost", "127.0.0.1"]`.

**Le miroir est meilleur que le canon.** Et `frame-stefframe2.md:137` **prescrivait déjà** cette
forme : « elle reste, **pilotée par variables d'environnement** sans défaut LAN ». L'env var n'est
donc pas une bricole d'anonymisation : c'est l'**application d'une règle déjà écrite**, faite du
mauvais côté du miroir.

**Conséquence directe sur le design** : il ne faut **pas** « préserver le fork ». Il faut
**remonter les 2 env vars dans le canon**. Alors le canon devient neutre-par-défaut, le fork
disparaît à la source, et le miroir redevient copiable. **Scrubber le `cli/` aggrave la divergence ;
neutraliser le canon la supprime.** C'est l'inversion de flux qui rend le principe du décideur
tenable.

### 2.6 Non mesurable sans `Bash` — déclaré, non supposé

- **Dates/mtime des `.zip` vs dossiers**, et **contenu des archives** (277 vs 284 fichiers) : je
  **reprends du brief sans les revérifier**. Ils ne conditionnent pas mes conclusions (§ 6).
- **Ce que j'ai vérifié en revanche** : `cli/src/commands/update.js` ne contient **aucune**
  occurrence de `zip` ni `frames` (recherche insensible à la casse → 0). Le geste `update
  iakaframe` **ne rebuild effectivement aucun artefact dérivé**. Diagnostic d'Odin **confirmé par
  le code**.
- **Aucune** commande `frame`/`resync`/`release`/`build` dans les **28** fichiers de
  `cli/src/commands/`. Confirmé : rien à réutiliser, tout à créer.

### 2.7 Impact vendorage : **NUL** — vérifié, pas supposé

`vendor-check.js` ne contient **aucune** référence à `services`, `consolidate`, `frames` ou
`StefFrame` ; `cli/src/lib/` ne contient **aucune** occurrence de `frames`/`StefFrame`. Le vendorage
vers `iakaFrameGUI` porte sur le **corpus** (`methode`, `team`), pas sur `cli/src/`. Donc :
**remonter les env vars dans `services.js`/`consolidate.js` ne peut pas faire bouger les 21
fixtures.** `vendor-check` doit rester `OK - 17 copies + 4 derivees` — **critère C7**.

---

## 3. État de l'art vérifié (web) — et pourquoi on n'achète pas la solution du marché

Les scanners de référence (**Gitleaks**, **TruffleHog**) sont conçus pour les **secrets** : formats
connus, entropie, vérification en ligne. Pour des **noms internes**, les deux exigent des **règles
custom** — Gitleaks via `.gitleaks.toml` (pattern + keywords), TruffleHog via *custom detectors*
(regex + **keyword littéral obligatoire**).

**Conclusion, décisive pour ce lot** : ces outils résolvent la classe « secrets » et **reproduisent
exactement notre problème** sur la classe « noms propres » — leur mécanisme d'extension **est** une
énumération de mots-clés. Les adopter ne ferait que déplacer la liste dans un TOML. Ils
n'attraperaient **pas** `iakaHub`.

→ **On ne réimplémente pas un scanner de secrets** ; le frame n'en a d'ailleurs pas besoin (0 jeton,
0 clé, mesuré). On construit ce qu'aucun outil du marché ne fait : une garde par **allowlist** sur
un vocabulaire de marque (§ 4). C'est un **complément**, pas un doublon — et ça respecte
« réutiliser l'existant » : rien d'existant ne couvre ce besoin.

---

## 4. Le cœur technique — les classes de motifs, et leurs limites assumées

**Le renversement** : une **blacklist** (« bannir `iakaHub` ») ne peut pas attraper le nom suivant.
Une **allowlist** (« n'autoriser que `iakaframe`, `iakastart` ») attrape **tout** nom suivant de la
même famille. C'est le seul mécanisme qui satisfait le principe du décideur.

### 4.1 Les gates

| # | Classe | Mécanisme | Verdict | Faux positifs attendus |
|---|---|---|---|---|
| **G1** | Secrets & infra | Motifs **structurels** : IP privée (`10.|192.168.|172.(1[6-9]\|2\d\|3[01]).`), URL avec creds (`//[^/]*:[^/]*@`), chemin home absolu (`/Users/[^/]+`, `C:\\Users\\`, `-Users-`), clé PEM/JWT | **BLOQUANT** | ~0 |
| **G2** | Marque / portefeuille | **ALLOWLIST** : tout `\b[Ii]aka[A-Za-z0-9]+\b` **hors** `{iakaframe, iakastart, iakaIDE?…}` → **échec** | **BLOQUANT** | faible, liste blanche courte et stable |
| **G3** | Identité du décideur | Prénom/nom/login, **casse-insensible**, **y compris en commentaire et en position de regex** | **BLOQUANT** | ~0 |
| **G4** | Couche produit | Aucune skill `layer: product` dans le miroir ; **0 référence pendante** (`subskills`, `principleIds`, `skills:[]`) | **BLOQUANT** | 0 (structurel) |
| **G5** | Ports d'infra | Littéral numérique de port **hors allowlist** (`3000,8080,11434,8188`…), matché **indépendamment du séparateur** (`:3001`, `port: 3001`, `port=3001`) | **BLOQUANT** | modéré |
| **G6** | Noms propres résiduels | CamelCase interne (`[a-z][A-Z]`) + capitale en milieu de phrase, **hors dictionnaire du frame** | **AVERTISSEMENT** | **élevé** — jamais bloquant |

**G2 est le gate qui compte.** Testé mentalement sur la mesure § 2.1 : il attrape `iakaHub`,
`iakagraph`, `iakaIDE`, et attraperait `iakabox`, `iakaFrameGUI` — **y compris créés après
l'écriture de la règle**. C'est précisément ce que le gate actuel a manqué.

**G3 doit matcher `if (/^stephane-/.test(...))`** : l'écart mesuré est dans un **littéral de regex
exécuté**, pas dans de la prose. Un scrub qui ne lit que la prose le rate — c'est le cas aujourd'hui.

**G6 est délibérément non bloquant.** Un gate bruyant est un gate désactivé ; on préfère un
avertissement lu qu'un blocage contourné.

### 4.2 🔴 Ce que le gate outillé n'attrapera PAS — à lire avant de valider

Cette section est **contractuelle**. Elle doit être **reprise dans le README du miroir** ; le
dispositif ne doit **jamais** être présenté comme une garantie.

1. **Un nom propre hors motif de marque et sans CamelCase.** `Hermes` (21 occurrences) est
   attrapé par G6 (capitale) — mais `hermes` en minuscules dans une prose **passe tout**. G2 ne le
   voit pas (pas de préfixe `iaka`), G6 non plus (pas de capitale).
2. **Un fait privé sans nom propre.** « le serveur du salon », « mon fils », une anecdote
   identifiante, une habitude de travail personnelle : **structurellement invisible**. Aucune
   classe de motifs n'atteint la sémantique.
3. **Une IP publique** ou un domaine réel : G1 ne cible que les plages privées ; élargir
   produirait un bruit inacceptable.
4. **Un port d'infra dans l'allowlist**, ou écrit en variable/calcul (`PORT_BASE + 1`).
5. **Le contenu des `.zip`** — binaire, non inspectable par le gate. **C'est un argument
   indépendant de retrait** (§ 6).
6. **Une fuite dans le CANON** : les gates portent sur le miroir. Un secret entré au canon n'est vu
   qu'à la propagation suivante.
7. **La casse et les variantes typographiques** au-delà de ce qui est prévu — le grep d'Odin sur
   `forgejo` était sensible à la casse ; le nôtre ne doit pas l'être (**critère C6**).

> **Corollaire à assumer devant le décideur** : le gate déplace le curseur de « aucune garantie »
> à « la classe *marque* et la classe *secrets* sont couvertes, y compris pour des noms futurs ».
> Il ne rend **pas** la relecture humaine inutile avant une diffusion à des tiers.

---

## 5. Découpage — je **réfute partiellement** l'ordre proposé

Ordre d'Odin : 1) scrub, 2) `frame verify`, 3) rattrapage + `.zip`. **Trois corrections.**

**(a) Un Lot 0 doit précéder le scrub.** Odin place l'extraction des env vars *dans* l'étape 1
(« et d'abord »). Elle mérite d'être **isolée et livrée seule** : c'est le seul contenu du miroir
**irréversible s'il est perdu**, et § 2.5 montre que le bon geste n'est pas de l'extraire mais de le
**remonter au canon** — ce qui **supprime le fork** au lieu de le documenter. Petit, autonome,
protecteur : il ne doit attendre aucun outil.

**(b) Le rattrapage n'est pas une simple 3ᵉ étape — il est BLOQUÉ.** La collision `iakaframe-git`
(§ 2.3) invalide la table de mapping du 19/07. Rattraper le delta suppose d'abord de **re-trancher
la doctrine** (renommage → couches). C'est un **cadrage en soi**, pas une exécution. Le lancer
maintenant, c'est écraser une skill par une autre.

**(c) Les `.zip` ne doivent pas être couplés au rattrapage.** C'est une décision de gouvernance
indépendante, arbitrable **immédiatement** (§ 6).

### Découpage retenu

| Lot | Objet | Dépendances | Statut |
|---|---|---|---|
| **Lot 0** | Remonter `IAKAFRAME_HOSTS` + `IAKAFRAME_MEMORY_SOURCE` **dans le canon** ; retirer les IP en dur de `services.js:11` | aucune | **DANS ce lot** |
| **Lot 1** | `iakaframe frame verify` — gates G1→G6 + test automatisé | Lot 0 | **DANS ce lot** |
| **Lot 2** | Refonte de la doctrine de mapping (couches) **puis** rattrapage du delta (6 skills + 2 principes) | Lot 1 + **nouveau cadrage** | **HORS — à cadrer** |
| **Décision Z** | Sort des `.zip` | aucune | **arbitrage décideur, § 6** |

**Pourquoi Lot 0 + Lot 1 ensemble** : sans Lot 0, le gate G1 échouerait sur le **canon** dès qu'on
voudrait le vérifier lui aussi. Sans Lot 1, Lot 0 n'est pas prouvé. Ils forment le plus petit
ensemble cohérent. **Lot 2 est découplé** — et c'est le point le plus important du découpage.

### Forme retenue — **on n'invente rien**

**Verbe CLI `iakaframe frame verify`**, script Node **zéro-dépendance**, calqué sur le précédent
exact **`vendor-check`** : une commande de garde qui émet un verdict et un code de sortie. Mesuré :
28 commandes existantes, `vendor-check.js:204` produit déjà `OK - N copies + M derivees`. On suit
ce moule. **Pas de `scrub` automatique en écriture** : le gate **constate et bloque**, il ne
**réécrit pas** le miroir — une réécriture automatique sur un livrable destiné à des tiers est un
risque supérieur à celui qu'elle prévient.

### Cadence

**Geste explicite + suite de tests. PAS de blocage dans `update iakaframe`.** Un checkpoint doit
rester non bloquant (`update` = filet de sécurité, cf. principe *commits atomiques et fréquents*).
Mais l'angle mort mesuré en § 2.6 doit être comblé : `update` émet un **avertissement non bloquant**
si le miroir a changé sans passer `frame verify`. Le **blocage** vit dans la suite de tests
(`cli/test/frame-verify.test.js`), au même titre que les `guard-*.test.js`.

---

## 6. Décision Z — les `.zip` : **RETRAIT recommandé**

Trois arguments, dont **deux que j'ai vérifiés moi-même** :

1. **Vérifié (§ 2.6)** : `update.js` ne contient aucune référence à `zip`/`frames` → **aucun geste
   du projet ne régénère les archives**. Une archive dans le dépôt est donc **périmée par
   construction** dès le commit suivant. Sous le principe « miroir », c'est une contradiction
   structurelle, pas un retard.
2. **Vérifié (§ 4.2, limite 5)** : le contenu d'un `.zip` est **hors de portée du gate**. Conserver
   les archives, c'est conserver la **seule zone du dépôt que l'outillage ne peut pas certifier** —
   exactement ce que ce lot cherche à éliminer.
3. **Repris du brief, non revérifié** : 277 vs 284 fichiers, archives plus anciennes que leur
   dossier, buildées une fois pour 3 commits.

**Reco Gandalf : retirer les deux `.zip` du dépôt.** Le dossier `StefFrame2/` est la source ; une
archive se **génère à la demande** au moment de la diffusion, **après** `frame verify` vert. Ajouter
`frames/releases/*.zip` au `.gitignore`. **Ne pas** attacher de build d'archive au checkpoint : cela
ferait passer `update` d'un geste de sauvegarde à un geste de publication.

### 6.1 StefFrame1 — mesuré : **release morte, à retirer**

- **42 occurrences** des mêmes tokens que SF2 (`Hermes`, `iakagraph`, `iakaIDE`) — mêmes fuites.
- **Aucun `cli/`**, **14 principes** (contre 16 en SF2, 18 au canon), **14 skills** (contre 17/24).
- SF2 est, par construction (`frame-stefframe2.md` § 3), une **copie de SF1 + ajouts** : SF1 est un
  **ancêtre strict**, sans contenu propre.

**Reco Gandalf : retirer `StefFrame1/` et `StefFrame1.zip`.** Maintenir deux miroirs **double le
coût de chaque propagation** pour zéro contenu unique — et sous le principe du décideur, ce coût est
récurrent. L'historique git conserve la trace. **Décision décideur** (§ 9, point 3).

---

## 7. Critères d'acceptation (pass/fail, testables)

**Cas nominal**

- **C1** — `iakaframe frame verify` existe, s'exécute **sans dépendance externe**, et sort **0** sur
  un miroir conforme. `iakaframe frame verify --help` → exit **0**.
- **C2** — Sortie machine `--json` conforme au contrat en vigueur (booléen, stdout, `--out` pour le
  fichier — cf. rupture actée `services.js:2-4`) : `{ ok, checked, findings:[{gate,file,line,token}] }`.
- **C3** — Les **2 env vars** `IAKAFRAME_HOSTS` et `IAKAFRAME_MEMORY_SOURCE` sont présentes **dans
  le canon** (`cli/src/commands/services.js`, `cli/src/lib/consolidate.js`) ; `DEFAULT_HOSTS` du
  canon **ne contient plus d'IP privée** ; **comportement par défaut inchangé pour le décideur**
  (documenté : renseigner `IAKAFRAME_HOSTS` dans `~/work/.env`).
- **C4** — `library/skills/iakaframe-naonedge/SKILL.md` porte un `layer:` explicite (§ 2.3).
- **C5** — Un test `cli/test/frame-verify.test.js` couvre **chaque** gate G1→G6 avec **au moins un
  cas positif et un cas négatif**.

**Cas de défaut (le gate doit ÉCHOUER — c'est ce qui n'est pas testé aujourd'hui)**

- **C6** — Sur le miroir **actuel, non corrigé**, `frame verify` sort **non-zéro** et rapporte :
  G2 → `iakaHub`, `iakagraph`, `iakaIDE` ; G3 → `consolidate.js:111` **et** `:115` (**dont la
  regex**) ; G5 → `services.js:11` `port: 3001` (**dont le séparateur n'est pas `:`**) ; G4 → les
  références pendantes vers `preuve-avant-declaration` / `canon-avant-citation`. **Ce critère est
  le test du test** : il vérifie que le gate attrape ce que l'ancien manquait.
- **C6bis** — Un token de marque **inventé pour le test** et absent de toute liste (ex.
  `iakaZzztest`) est attrapé par G2. **C'est le critère qui prouve la propriété demandée par le
  décideur** : attraper le nom **suivant**.
- **C7** — **Non-régression** : `vendor-check` reste `OK - 17 copies + 4 derivees` ; suite CLI
  ≥ `377 tests / 0 fail` (+ les nouveaux) ; aucun fichier de `library/skills/iakaframe-qualite/` ni
  `library/principles/preuve-avant-declaration.md` modifié (**sources, pas cibles**).
- **C8** — `update iakaframe` reste **non bloquant** : sur un miroir en échec, `update` **réussit**
  et **avertit**.

---

## 8. DANS / HORS

**DANS** : Lot 0 (remontée des 2 env vars au canon) ; Lot 1 (`frame verify`, gates G1→G6, tests,
doc de la § 4.2 dans le README du miroir) ; décision `.zip` + `.gitignore` si retrait validé.

**HORS** :
- **Le rattrapage du delta** (6 skills, 2 principes, 3 commandes, contrat `--json`) → **Lot 2,
  cadrage séparé, bloqué par § 2.3**.
- **Toute réécriture automatique** du miroir (`scrub --fix`).
- **Les réserves des installeurs** (échec partiel invisible, `~` sous Windows). Vérifié : **hors
  périmètre** — elles portent sur `kits/`, aucun rapport avec le scrub. → **backlog, à ne pas
  perdre** (§ 9, point 5).
- **Adopter Gitleaks/TruffleHog** (§ 3).
- **Corriger les 86 occurrences** : ce lot livre le **détecteur**, pas la **correction**. Les
  corriger dans le même lot masquerait le fait que le gate les détecte (C6).

---

## 9. Points ouverts — arbitrage du décideur

1. **Les `.zip`** : retrait (reco), régénération, ou build attaché au checkpoint ? *Reco Gandalf :
   **retrait** + `.gitignore` + génération à la diffusion.*
2. **`iakaIDE` dans l'allowlist G2 ?** Tension réelle : `cli/` porte **~30 occurrences**
   structurelles (commandes `go`, `config`, `vocab`). Les scrubber **forkerait davantage le CLI** —
   l'inverse du principe miroir. *Reco Gandalf : **tolérer `iakaIDE` dans `cli/`** (allowlist
   ciblée, gate assoupli déjà admis `frame-stefframe2.md` § 5.1), **bloquer ailleurs**. À
   reconsidérer si le miroir vise une diffusion large.*
3. **StefFrame1** : retrait (reco, § 6) ou maintien à double coût ?
4. **Niveau de politique** : les noms du portefeuille (`iakaHub`, `iakagraph`) sont-ils un **risque
   de sécurité** (aucun : 0 secret mesuré) ou une **fuite de portefeuille** ? *Reco Gandalf :
   traiter en **politique éditoriale bloquante**, pas en incident.*
5. **Réserves installeurs** : confirmer le **report en backlog** (elles ne doivent pas disparaître).

---

## 10. Estimation

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **2,5 à 3,5 j-h** — Lot 0 : 0,5 · Lot 1 : 2 à 3 (dont ~1 de tests, C6/C6bis) · Décision Z : 0,1 |
| **Complexité / risque** | **Moyenne.** Techniquement simple (Node, regex, zéro-dep, moule `vendor-check` existant). Le risque n'est pas le code : c'est le **calibrage des faux positifs** de G5/G6. |
| **Inconnues (peuvent faire glisser)** | (a) **Volume de bruit réel de G6** sur 284 fichiers — non mesurable sans exécution ; si trop bruyant, le rétrograder en `--verbose` (**+0,5 j**). (b) **Point ouvert 2** : si le décideur refuse la tolérance `iakaIDE`, il faut scrubber `cli/` → **+1 à 1,5 j** et **aggravation du fork**. (c) La remontée des env vars au canon touche `consolidate.js`, couvert par `consolidate.test.js` — régression possible (**+0,5 j**). |

**Lot 2 (hors périmètre), ordre de grandeur** : **2 à 3 j-h**, précédées d'un **cadrage** — la
refonte de doctrine (§ 2.3) est le vrai travail, pas la copie.

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## 11. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `outillage-scrub-miroir-frame.md` — Lot 0 (env vars → canon) + Lot 1 (`frame verify`, gates G1→G6 par **allowlist**), Lot 2 découplé et bloqué (§ 2.3), reco retrait `.zip` + StefFrame1, limites du gate déclarées (§ 4.2), **estimation 2,5–3,5 j-h** | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Collision d'id (le fait qui bloque le Lot 2) : `library/skills/iakaframe-git/SKILL.md:5`
  (`layer: family`) ↔ `frames/releases/StefFrame2/library/skills/iakaframe-git/SKILL.md:16`
  (`<GIT_REMOTE_URL>`, donc produit).
- Fork = amélioration à remonter : `cli/src/commands/services.js:11` (IP en dur) ↔
  `frames/releases/StefFrame2/cli/src/commands/services.js:8` (env var).
- Intention déjà écrite : `specs/instructions/frame-stefframe2.md:137` (« piloté par variables
  d'environnement »).
- Gate qui ne teste que sa liste : `specs/instructions/resync-stefframe2-miroir-live.md:188`.
- Écart en position de regex : `frames/releases/StefFrame2/cli/src/lib/consolidate.js:115`.
- Fuite corpus non détectée : `frames/releases/StefFrame2/methode-de-travail.md:552`.
- Moule à suivre : `cli/src/commands/vendor-check.js:204`.

---

## Statut

**PROPOSÉ — en attente de validation décideur.** À « JALON VALIDÉ » → dispatch **Gimli** pour
Lot 0 + Lot 1 (§ 5), critères § 7. Points ouverts § 9 : **1, 2 et 3 doivent être tranchés avant
exécution** (ils changent le périmètre) ; 4 et 5 sont documentaires.
