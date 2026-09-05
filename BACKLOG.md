# Backlog — iakaframe

Items de backlog du projet (tenus au fil de l'eau ; convertis en instruction cadrée avant tout dev).

> **Purge du 2026-07-23** (Aragorn, après la livraison de l'objectif « charger le frame dans le GUI »,
> v0.20.4 / GUI v0.1.4). Les 14 items ouverts ont été **repassés un par un sur pièces** — mesure
> réelle, pas présomption. **7 soldés** (déplacés en *Fait* avec leur preuve de clôture), **1
> requalifié**, **6 confirmés vivants** (chacun re-mesuré à la date de purge), **1 ajouté** (rôle
> *frame builder*). Rien n'a été fermé sans preuve, rien n'a été gardé sans re-mesure.

## Ouverts

### CI-RELEASE-LATEST-NON-MAITRISE — le `make_latest` calcule du workflow n'a PAS agi (2026-09-05)

- **Mesure** : tag `v0.40.0` pousse a 09:59:39Z (run `33959443438`). La release et son asset
  `naonedge-iakaframe-0.40.0.tgz` (686 323 o, sha256
  `21fe0f9421cf14af97a273d7f06bb645e980004ae8c53efc028c359716ca1032`) ont ete crees a 09:59:55Z, MAIS
  `releases/latest` repondait toujours `v0.39.0` a 09:59:56Z : l'etape « Verifier ce qu'est devenu le
  latest » a rougi (`exit 1`) et nomme le rattrapage. **La garde a fait exactement son travail** — c'est
  la premiere fois qu'elle mesure le risque central en conditions reelles (M-4 reste du, ceci n'est pas
  M-4 : ici le manifeste n'etait pas perime, c'est le pointeur `latest` qui l'etait).
- **Rattrapage applique par Aragorn a ~10:0xZ** (feu vert de publication donne par le decideur) :
  `gh release edit v0.40.0 --latest` → `releases/latest` = `v0.40.0` (verifie), `vitrine:en-ligne` → OK.
  Coherent avec M1 (2026-09-01) : `--latest` (true) AGIT ; le `make_latest` calcule dans `release.yml`
  (acteur `softprops`) ne l'a pas fait, ou pas a temps (cf. la course de « douze minutes » deja notee
  dans les commentaires du workflow, l. 49-73).
- **A cadrer** : soit l'etape « Verifier » RATTRAPE elle-meme (`gh release edit  --latest`)
  puis re-mesure, au lieu de seulement rougir ; soit on mesure d'abord POURQUOI `make_latest` est
  inerte (valeur calculee ? ordre des etapes ? API asynchrone ?). Une preuve se compare au fichier :
  relire le log complet du run `33959443438`, etape « rang » et etape `softprops`.
- Successeur legitime de `CI-RELEASE-AUCUN-EPINGLAGE` (toujours ouvert, trois tags flottants).

### M-4 — la seule preuve du risque central, REPORTEE par le decideur (2026-09-03)

> Mesure due au decideur, nommee au § 5 de
> `specs/instructions/dette-de-canal-de-la-publication.md`. **Le lot de la dette de canal est livre
> et fusionne SANS elle** — il contourne le risque **sans l'avoir jamais vu**.

- [ ] 👤 **`M-4-MANIFESTE-PERIME` — faire servir volontairement un manifeste PERIME par l'endpoint 1
  et lancer un controle : l'app dit-elle « a jour » ?** **Reportee sur decision du decideur le
  2026-09-03** (« M-4 pour plus tard ») — **ce n'est pas un oubli, c'est un report date**.
  **Pourquoi elle appartient au decideur** : elle exige de **manipuler un canal SERVI**, geste qu'un
  agent ne fait pas.
  **Pourquoi elle compte plus que les autres** : le § 1.4 de l'instruction la nomme *« la seule
  preuve du risque central »*. Ce risque est **etabli par lecture de la source, pas mesure en
  usage** : **le plugin fait `break` au premier endpoint qui REPOND — pas au premier qui est
  FRAIS**. Donc un endpoint **joignable et en retard FAIT AUTORITE** sur un endpoint frais place
  apres lui. ⚠️ **Et le NAS est en position 1**, adresse privee, **seul canal historiquement
  pousse** : s'il repondait en retard, **GitHub (position 2) ne serait JAMAIS atteint**, et le
  dommage serait un **« vous etes a jour » FAUX ET SILENCIEUX** — *personne ne remonte un bug pour
  ca*.
  **Ce que le lot livre a la place** : un fan-out qui pousse **les deux canaux** et **sort en non
  nul des qu'une cible echoue** (AR-4) — ce qui rend la configuration dangereuse **beaucoup moins
  probable**, sans jamais **prouver** ce qu'elle produirait. **La difference entre "moins probable"
  et "impossible" est exactement ce que M-4 mesurerait.**
  **Geste** : servir un `updater/latest.json` en retard sur l'endpoint 1 (NAS), lancer un controle
  de mise a jour depuis un client, **noter ce que l'app affiche**, puis **restaurer**. ⚠️ **Prevoir
  la restauration AVANT de commencer** — c'est un canal servi a de vrais clients.

- [ ] 👤 **`M-1-COUT-HORS-LAN` — chronometrer un controle de mise a jour depuis une machine HORS
  LAN.** **Reportee sur decision du decideur le 2026-09-03** (« M-1 pour plus tard »), comme M-4 —
  **les DEUX mesures du § 5 sont donc reportees, et le lot reste clos sans elles**. Elle n'etait de
  toute facon pas jouable depuis la session : aucune machine hors LAN n'y etait accessible. **Le NAS est en position 1, adresse PRIVEE, SANS DELAI CONFIGURE** — donc tout
  client hors LAN paie une attente **a chaque verification**, avant meme d'atteindre GitHub.
  **Combien ?** La valeur est **propre au systeme**, elle ne se deduit pas.

### RESERVOIR-REDECLENCHE — le seuil compte des occurrences, pas des observations neuves (2026-09-03)

> Constaté **en jouant le parcours `/iaka`** (revue d'apprentissage), pas par lecture de code. Ce
> n'est pas un bug du lot en cours : c'est une **propriété du réservoir**, mesurée sur ses propres
> données.

- [ ] **`RESERVOIR-REDECLENCHE-SUR-LES-MEMES-PREUVES` — une proposition rejetée revient, à
  l'identique, sur les mêmes lignes de transcript.** **Mesuré le 2026-09-03** : le réservoir
  (`~/.iaka/memory`) portait **8 propositions pour 2 sujets seulement** —
  `p7-binding-reel-cadre-non-code` et `recentrage-runner-modele-couche-binding-cadre` —, proposés
  **quatre fois** (`20260717T205248`, `20260718T003730`, `20260718T115008`, `20260822T115136`) et
  tranchés **six fois rejeté, deux fois appliqué**. Or les **preuves sont les mêmes à chaque
  cycle** : `transcripts/odin/2026-07-17.md:41` et `:101`, **deux lignes du 17 juillet**. Le
  `threshold: 2` a donc été atteint **quatre fois par les deux mêmes observations** : ce n'est pas
  de l'observation répétée, c'est **une seule observation qui redéclenche**.
  **Deux conséquences distinctes, à ne pas confondre** : (1) le **bruit** — le décideur retranche
  périodiquement ce qu'il a déjà tranché ; (2) plus grave, **le contenu peut être devenu FAUX
  entre-temps**. C'est le cas ici : la proposition affirme *« binding réel : cadré, **non
  codé** »*, or **A-1 = P-D est tranché, les lots 1 et 2 sont livrés, et les 10 contrats déployés
  portent une ligne `model:`** (4 `opus`, 6 `sonnet`) — l'appliquer aurait inscrit au registre
  **un énoncé que la mesure réfute**, exactement la classe de défaut corrigée cinq fois cette
  semaine. **Le rejet a été prononcé par le décideur le 2026-09-03** ; l'item porte sur le
  **mécanisme**, pas sur ces deux entrées.
  **Pistes, non tranchées** : ne recompter que des occurrences **neuves** (preuves non déjà
  comptées) · tenir compte du **statut antérieur** — une proposition **rejetée** sur les mêmes
  preuves ne revient pas sans preuve neuve · **dater la fraîcheur** des preuves et refuser de
  proposer sur un matériau périmé. ⚠️ **Aucune n'est gratuite** : la première demande une identité
  de preuve, la deuxième un lien rejet↔preuves, la troisième un seuil de péremption à choisir —
  **c'est un cadrage, pas un correctif**.

### L45 — Deux successeurs nommés du lot « affectation du modèle par acteur » (2026-09-02)

> Ouverts **par le lot 1** de `specs/instructions/affectation-modele-par-acteur.md` (CA-15), qui a
> rendu effective la projection du `model:` du binding vers le contrat déployé. Ce ne sont pas des
> regrets : ce sont **deux faits nommés à la livraison** plutôt que laissés tacites.

- [ ] **`G5-LA-FORGE-EMET-ELLE-LE-MODELE` — l'adaptateur sait écrire un modèle, il n'en écrit
  toujours pas.** Sous la posture **P-D** retenue par le décideur, l'invariant **G-5** n'a **pas**
  été rouvert et **reste vrai et vérifié** : `packages/core/src/adapters/claudeCode.ts:11-12`
  (dépôt `iakaFrameGUI`) déclare toujours *« Team PURE en entrée : aucun `runner`/`model` n'est lu
  ni émis ; le `model` du frontmatter subagent est OMIS (liaison run-time = Cockpit) »*, et
  `packages/core/__tests__/adapters.test.ts:160` le prouve sur l'arbre généré. Ce que le lot a
  changé est une **capacité, pas une politique** : `serializeAgentContract`
  (`packages/core/src/frontmatter.ts:475-498`) *sait* désormais émettre un `model?` optionnel, mais
  la fonction de forge `renderAgent` ne lui en passe aucun — les kits fabriqués depuis une team
  pure restent byte-identiques. **La question ouverte** : la forge doit-elle un jour émettre le
  modèle (et alors G-5 devient une décision à rouvrir explicitement), ou la liaison modèle
  reste-t-elle définitivement run-time (Cockpit) ? *Tant que personne ne tranche, le CLI projette
  et la forge s'abstient : ce n'est pas une dérive (le vendorage est à 0), c'est une **asymétrie
  assumée** entre deux producteurs du même format.*

- [ ] **`MODELS-JS-DEUXIEME-LECTEUR` — `models.js` lit le modèle sans passer par
  `modelForPersona`.** Le lot 1 a créé le résolveur unique
  (`cli/src/lib/generate-agents.js:59`, `modelForPersona`) **sans y brancher**
  `cli/src/commands/models.js:124-131`, qui lit `binding.data.assignments` **en ligne** — et,
  nuance mesurée au cadrage, via `toRows(...assignments)` et **non** `bindingRows`, donc il
  **ignore le schéma alternatif `bindings:`** que le résolveur, lui, sait lire. Deux chemins de
  lecture du même fait coexistent donc, dont un aveugle à la moitié du schéma convergé. **Hors
  périmètre du lot 1 assumé** (ce serait un lot de convergence à part entière), inscrit ici pour
  qu'un défaut nommé ne soit pas un défaut caché (R-3 de l'instruction). *Non résolu par le lot 2
  (surcharge par projet) : `roleRows` y lit `assignments.get(p.id).model` de la même manière,
  l'item reste donc entier — la surcharge de projet s'empile SUR ce même chemin de lecture, elle
  ne le corrige pas.*

### L46 — Successeur nommé du lot « surcharge du modèle par projet » (2026-09-02)

> Ouvert **par le lot 2** de `specs/instructions/surcharge-modele-par-projet.md` (R-5), qui a rendu
> `iakaframe models` provenance-aware (`modelSource`, `frame`\|`projet`) et introduit les
> sous-verbes `models set`/`unset`. R-5 y est nommé « mitigation : ne rien ajouter (une colonne
> juste sur une liste fausse aggraverait la confusion) et inscrire au backlog ce successeur » —
> geste exécuté ici.

- [ ] **`AGENTS-LIST-PAS-FRAME-SCOPE` — `agents list` montre toute la bibliothèque, pas la team de
  la frame active.** `cli/src/lib/agents.js:83` (`listPersonas()`) scanne **toute** `library/
  personas/` sans filtre de frame, contrairement à `generateAll`/`personasForTarget`
  (`cli/src/lib/generate-agents.js`) qui, eux, résolvent la team de la frame active (global → team
  du default ; projet → team de la frame active). Conséquence mesurée : `agents list` affiche
  aussi les personas d'**autres** frames (ex. scrum), et **n'affiche pas** le modèle — deux
  informations qu'un utilisateur peut légitimement attendre d'une commande nommée `list`. **Hors
  périmètre des lots 1 et 2, assumé les deux fois** : `iakaframe models` (frame-scopé depuis le
  lot 1, F3) reste la commande de référence pour « qui tourne sous quel modèle » ; ajouter une
  colonne modèle à une liste non filtrée par frame aggraverait la confusion plutôt que de la
  lever. Le successeur, s'il est un jour cadré : porter `agents list` sur `personasForTarget`
  (même définition que `generateAll`/`skills deploy`, cf. le commentaire de source unique dans
  `generate-agents.js`), puis seulement alors envisager d'y ajouter la provenance du modèle.

### Dettes constatées au gate du lot 2 « surcharge du modèle par projet » (2026-09-02)

> Consignées par ⚒️ Gimli à l'intégration du lot dans `main` (`e2c54ba`), sur ordre d'🔵 Odin, gate
> 🏹 Legolas **PASS**. Ce sont des constats, pas des corrections : rien n'est traité ici.

- [ ] **`PROJET-FANTOME` — `models set --path <chemin-inexistant>` crée silencieusement un projet
  complet.** `cli/src/commands/models.js:780-788` : un `--path` qui ne pointe vers rien existant
  est **créé** (`fs.mkdirSync(projectDir, { recursive: true })`, ligne 788), puis `iakaframe.json`
  et `.claude/agents/<id>.md` y sont posés — exit `0`, **aucun avertissement**. Reproduit par le
  gate avec un chemin volontairement fautif. Rien n'est corrompu, mais une faute de frappe sur
  `--path` fabrique un projet sans le dire — à l'opposé de `frame use`, qui refuse (« jamais de
  dangling »). Le commentaire en place (`:781-784`) assume le choix (« même geste que `frame use`
  sur un dossier déjà là, en plus permissif »), mais la comparaison s'arrête là où `frame use`
  refuse et où `models set` crée : **décision produit à trancher par le décideur**.

- [ ] **`DERIVE-VENDORAGE-SKILL-IAKASTART` — dérive de vendorage `skills/iakastart/SKILL.md`
  (`drift: 1`), à refermer côté `iakaFrameGUI`.** `iakaframe vendor-check` réclame une copie :
  `library/skills/iakastart/SKILL.md` → `packages/core/__tests__/fixtures/skills/iakastart/
  SKILL.md` (dépôt `~/work/iakaFrameGUI`). **Conforme à l'instruction en l'état** —
  `surcharge-modele-par-projet.md` (R-4/CA-17) n'exigeait que la **déclaration** de la roster
  divergence, pas le re-vendorage cross-repo. Dette **assumée**, pas un défaut du lot.

- [ ] **`TEST-SUITE-CLI-VARIABLE` — le total de la suite CLI varie d'une machine à l'autre.**
  Mesures divergentes d'exactement **1** entre la réalisation et le gate sur le **lot 1**
  (`affectation-modele-par-acteur`), et **1 vs 7** `skipped` selon le contexte d'exécution. Le
  **delta** et le **`0 fail`** restent constants d'une mesure à l'autre — **pas un bug
  aujourd'hui** — mais c'est un **futur faux signal** : un total de suite qui bouge sans qu'on
  sache pourquoi finira par masquer une vraie régression. À identifier (quel(s) test(s) sont
  conditionnels à l'environnement) et neutraliser.

- [ ] **`COMMENTAIRE-TROMPEUR-VENDOR-CHECK-TEST` — le commentaire d'en-tête déclare le vendorage
  « massivement en dérive » alors qu'il est mesuré.** `cli/test/vendor-check.test.js:5` : *« c'est
  la seule façon d'éprouver le vert (le vendorage réel est **massivement en dérive**, § 12.2) sans
  salir l'arbre du frère »* — la phrase énonce un état du vendorage réel comme un **fait acquis et
  permanent**, alors que c'est une **mesure datée** (variable : `0` à une date, `11` à une autre,
  cf. `DERIVE-VENDORAGE-SKILL-IAKASTART` ci-dessus). Cette phrase a **déjà induit un cadrage en
  erreur** par le passé (un lot a été cadré sur la foi du commentaire plutôt que d'une mesure
  fraîche). Remède : remplacer l'affirmation figée par un renvoi à la mesure vivante
  (`iakaframe vendor-check`), jamais un chiffre ou un qualificatif en dur dans un commentaire.

### L44 — Re-cadrage de la garde du `latest` (2026-09-01)

- [ ] **`L44-RE-CADRAGE-GARDE-LATEST` — le job dit ce qu'il fait, et il le fait.**
  **Instruction (copie UNIQUE)** :
  `/Users/sjupin/work/iakaframe/specs/instructions/re-cadrage-garde-latest.md`.
  **Livré côté applications jumelles** (`IakaCockpit`, `iakaFrameGUI`) : le référent du job passe
  de la population des **tags** à celle des **releases** (défaut R-2 : faux rouge après un build
  rouge **et** rattrapage dicté sur une release inexistante) ; la branche du vol **exécute**
  `gh release edit "$PLUS_HAUT" --latest` au lieu de l'imprimer (AR-7 = (a), sur la mesure M1) ;
  garde locale du bloc `latest:` dans le gate des **deux** dépôts, adossée à
  `fixtures/bloc-latest.sha256` inscrite au registre de convergence (cliquet **17 → 20**).
  **Livré côté ce dépôt** : le **cartouche** de `.github/workflows/release.yml` (le tableau des
  **cinq écritures**, la réfutation mesurée de la doc GitHub sur `GET /releases/latest`, le
  résidu réécrit avec la réserve du **même jour**) ; l'instrument `registre:repli-latest` cesse
  de mentir sur lui-même (sept détections + le cliquet), **D-8** sur ses clés de prose, et
  l'**ancrage ligne à ligne** des 13 exclusions de fichier.
  **HORS PÉRIMÈTRE, déclaré, au 2026-09-01** : le **programme** du workflow de ce dépôt (son CI
  n'avait jamais tourné, `actions/runs → total_count: 0`) et `CI-RELEASE-AUCUN-EPINGLAGE` — **daté,
  pas effacé.** ⚠️ **Le référent du programme, lui, a été corrigé le lendemain** (lot
  `fix/R2-et-levee-absence-iakaframe`, 2026-09-02, hors L44) : voir `CI-CLI-JAMAIS-EXECUTE` en
  *Fait*, ci-dessous, dont la condition de levée est désormais remplie (run `33635520511`). Reste
  ouvert, inchangé : `CI-RELEASE-AUCUN-EPINGLAGE`.
  **NON MESURÉ — acte du décideur, refusé aux agents** : le contrefactuel A/B **sur le banc**
  (CA-6) et la preuve de bout en bout **dans un run réel** (CA-10).

### L42 — Installer depuis rien : la vitrine dit ce que l'étagère porte (2026-08-29)

- [ ] **`L42-INSTALLER-DEPUIS-RIEN` — le README est DÉRIVÉ, et le `latest` cesse d'être subi.**
  **Instruction (copie UNIQUE, AR-5 = (b))** :
  `/Users/sjupin/work/iakaframe/specs/instructions/installer-depuis-rien.md`.
  Les deux dépôts jumeaux **n'en ont pas de copie** — le défaut vit dans une *convention de
  portefeuille* appliquée à au moins quatre dépôts, pas dans deux implémentations jumelles ; et le
  registre de convergence ne connaît que **deux** frères, donc une troisième copie serait la seule
  **non gardée**, donc la première à diverger. Chemin absolu inscrit ici et dans
  `IakaCockpit/CLAUDE.md` + `iakaFrameGUI/CLAUDE.md` — **une étape du lot, pas une politesse**.
  **Livré côté ce dépôt** : générateur `cli/scripts/vitrine.js` (+ `cli/scripts/lib/vitrine.js`,
  fonction pure), section *Installation* du `README.md` **racine** entre marqueurs
  `<!-- vitrine:debut:installation -->`, garde **G5** dans
  `cli/test/guard-version-source-unique.test.js`, face en ligne
  `cli/scripts/vitrine-en-ligne.js` (anonyme, hors gate), `make_latest` **calculé** dans
  `.github/workflows/release.yml`.
  > ✅ **SOLDÉ le 2026-09-02** : `v0.39.0` publiée (run CI `33635520511`, asset `naonedge-iakaframe-0.39.0.tgz`).
  > **Au 2026-09-05 l'autorité est `0.40.0`** (merge `02f8135`, gate PASS) : le tag `v0.40.0` est le nouvel acte dû
  > au décideur (`docs/releases/v0.40.0.md` porte le texte du tag annoté). Le paragraphe ci-dessous est conservé daté.
  **RESTE DÛ — acte du décideur, refusé aux agents** : publier `v0.39.0` depuis la version
  d'autorité, avec des notes qui **assument l'agrégat** (v0.21.0 … v0.39.0 non publiées
  individuellement, détail dans le journal de `specs/etat-des-lieux.md`) — cf. **CA-7/CA-8** et
  **AR-4 = (b)**. Tant que ce n'est pas fait, `npm run vitrine:en-ligne` (depuis `cli/`) **rougit**
  sur E-2 **et E-3** : le README annonce `v0.39.0`, que GitHub ne connaît pas encore.
  **Cette rougeur est voulue** — c'est la dette de publication rendue visible, et elle est **hors
  gate**. ⚠️ **L'effet de bord est désormais DÉCLARÉ, plus subi** : dans cet intervalle, la page de
  la release annoncée **n'existe pas** (mesuré le 2026-08-29, `GET releases/tags/v0.39.0` → **404**).
  Le README ne la promet plus : il **déclare** les deux voies indisponibles (`tgz` et `archive`)
  dans un bloc « ⚠️ Non fourni », avec motif, date et condition de levée
  (`cli/fixtures/vitrine-locale.json`), renvoie vers la **page des versions** — qui, elle, dit la
  vérité toute seule — et offre une voie qui **ne dépend d'aucune release** (`git clone` +
  `npm install -g ./cli`, **éprouvée** sur un clone neuf). E-3 cesse donc de crier un fait déclaré,
  et c'est **E-5** qui rougit dès que la déclaration devient fausse. Le prix d'AR-1 = (a) est
  **payé, pas déguisé** ; la publication éteint le tout.

- [x] **`CI-CLI-JAMAIS-EXECUTE` — LEVÉE le 2026-09-02, déplacée en *Fait* avec sa preuve de
  clôture** (lot `fix/R2-et-levee-absence-iakaframe`, gate FAIL→re-mesure). Texte original et
  preuve conservés intégralement ci-dessous, § *Fait > Levés le 2026-09-02* — daté, pas effacé.

- [ ] **`D3-OBSERVABLE-ENREGISTREMENT` — une phrase dit « existe » là où la mesure dit
  « enregistrement », et il existe une preuve plus dure ET locale.** *(nit relevé au gate 🏹 Legolas
  du 2026-08-29 ; successeur immédiat de `CI-CLI-JAMAIS-EXECUTE`, dont il partage l'observable.)*
  `cli/scripts/lib/vitrine.js:49` écrit « douze minutes AVANT que le workflow **n'existe** » : la
  mesure, elle, porte sur la date d'**enregistrement** du workflow côté API
  (`2026-08-05T15:36:53Z`) — ce n'est pas la même chose, et l'écart est une **imprécision de
  formulation**, pas un fait faux. **Mais il y a mieux, plus dur, et sans réseau** : le commit qui
  ajoute le workflow (`45a857b`, **2026-08-04**) **n'est pas un ancêtre du tag `v0.20.4`**
  (`70adeb0`, **2026-07-23**) — vérifié localement par
  `git merge-base --is-ancestor 45a857b v0.20.4` → **faux**. **Douze jours, pas douze minutes**, et
  la preuve ne coûte **ni réseau ni quota d'API**. Le successeur remplace l'observable dans le
  commentaire (et dans l'encadré du workflow s'il le reprend).

- [ ] **`CI-RELEASE-AUCUN-EPINGLAGE` — le workflow de ce dépôt n'épingle RIEN.** *(SIGNALÉ au gate
  🏹 Legolas du 2026-08-29 ; hors périmètre L42 — lot à part, l'épingler « tant qu'on y est » aurait
  été un débordement. Confirmé hors périmètre au gate du 2026-09-02, lot
  `fix/R2-et-levee-absence-iakaframe` — successeur légitime, aucune mesure de ce lot ne le réfute.)*
  `.github/workflows/release.yml` emploie **trois tags flottants** :
  `actions/checkout@v4` (l. 23), `actions/setup-node@v4` (l. 27), `softprops/action-gh-release@v2`
  (l. 84, au 2026-08-29 ; **l. 176 depuis le 2026-09-02**, le cartouche du lot ci-dessus ayant
  allongé le fichier). Les deux dépôts jumeaux ont reçu l'acquis de **L41** — épinglage au **SHA de
  40 caractères** + cliquet `fixtures/tauri-action-pin.json` (référent : SHA, `sha256` de
  l'`action.yml`, entrées déclarées, entrées vérifiées absentes) ; **ce dépôt-ci ne l'a pas**. Au
  2026-08-29, c'était précisément celui dont le workflow **n'avait jamais tourné** (cf.
  `CI-CLI-JAMAIS-EXECUTE`, *daté, pas effacé*) : la dérive d'une action y entrerait sans que rien ne
  l'ait jamais éprouvée. **⚠️ MIS À JOUR le 2026-09-02** : le workflow a désormais tourné **une
  fois** (run `33635520511`, `completed`/`success`) — l'argument change de forme mais pas de
  conclusion : une **unique** exécution réussie n'éprouve ni la dérive d'une action tierce ni les
  branches d'erreur du job ; l'épinglage reste dû, pour la même raison structurelle qu'avant, avec
  une observation en moins pour la motiver. Portée : épingler les trois, poser le référent
  et son cliquet à l'image de L41, et **relire l'`action.yml` au SHA retenu** avant de déclarer une
  entrée supportée — la leçon D-4 de L41, où `uploadUpdaterJson` était ignoré en silence.

- [ ] **`README-REMOTE-IAKABOX-MORTE` — le README public cite un dépôt git qui n'existe plus.**
  *(SIGNALÉ, non traité — hors zone générée, hors L42 : lot à part.)* Le `README.md` de la racine
  désigne encore `http://192.168.2.11:3001/…` comme dépôt git par défaut : c'est l'**iakabox**, en
  panne, remplacée par la forge du NAS depuis le 2026-08-19. La ligne est **hors des marqueurs de
  vitrine**, donc hors du périmètre du générateur et hors des critères de L42. Le corriger dans ce
  lot serait un « tant qu'on y est ».


### Successeurs nommés des lots « garde balayante » et « correctif générateur » (2026-08-17)

> **Sept successeurs nommés au fil de deux lots gatés PASS, dispersés dans trois sources** —
> `specs/instructions/correctif-generateur-etat-des-lieux.md`,
> `specs/instructions/garde-balayante-routage-prod.md`, et la branche non fusionnée
> `docs/successeur-critere-backlog-d10` (commit `278a261`). Ils rentrent ici au registre commun :
> *un successeur nommé dans une instruction mais absent du backlog est un successeur à moitié
> nommé* (🧙 Gandalf). **Registre, pas lot** : rien n'est implémenté par cette inscription. Les
> deux successeurs qui vivent ailleurs sont **renvoyés, jamais dupliqués**.

- [ ] **`CHECKPOINT-NARRATIF` — refondre le flux `snapshot`→`update` face au récit écrasé.** *(cadrage **0,25 j-h**, dev **0,5 à 1 j-h** selon l'option retenue.)* Chaîne : **cadrage 🧙 Gandalf → arbitrage DÉCIDEUR** (le choix de flux lui appartient) **→ dev ⚒️ Gimli**. Le générateur **réécrit** la section « Reprise du travail » en placeholders à **chaque** appel, sans jamais lire ce qui s'y trouvait ; `update` enchaîne `doSnapshot` puis `git add -A` + commit, et le récit tenu à la main part avec. Options déjà écrites **avec leur contre-argument** (§ D6 de l'instruction) : préserver / préserver+dater / décomposer le verbe / statu quo — le cadrage part chargé.
  **`D6` y a été VERSÉE EN ENTIER, et avec elle une option morte.** Telle qu'écrite, `D6` (avertir sur narratif vide, posé **après** `doSnapshot`) produisait une **fausse imputation** : elle accusait l'opérateur d'un récit vide que la commande venait de produire **une ligne plus haut**. Mesuré par 🏹 Legolas sur dépôt tmp (scénario `CA-18b`), d'où le retrait post-gate et le cardinal ramené de 22 à 19 `CA`. **Ne pas la re-instruire.**
  **⚠️ Corollaire à lire AVANT de cadrer — il fait gagner du temps** : *tout remède qui n'agit qu'**en aval** de la génération est disqualifié par construction ; le geste utile est **dans** la génération, pas après elle.* Emporte aussi `R8` (tout remède qui lit le MD pour en juger le contenu couple le checkpoint à un format de fichier).
  *Pointeurs — l'instruction cite `snapshot.js:132-136` / `update.js:95-111`, état **pré-lot** ; re-mesuré sur `main` (`38c6e8f`) : `cli/src/commands/snapshot.js:244-248` (réécriture de la section) et `cli/src/commands/update.js:102` (appel `doSnapshot`), `:107-111` (`git add -A` + commit).*

- [ ] **`VENDOR-REMEDE-CARDINAL` — `vendor-check` annonce une bijection qui n'existe pas.** *(**0,25 j-h**, titulaire ⚒️ **Gimli**, déclenché par 🤴 Aragorn — **à grouper avec `GUI-VENDOR-CHARON`** : même opérateur, même session, et c'est ce bloc-là qu'il lira pour vendoriser les fixtures manquantes.)* La ligne `REMEDE - N geste(s), un par derive constatee` (`cli/src/commands/vendor-check.js:228`) affirme **un geste par dérive** ; or `remediationFor` **déduplique** (`cli/src/commands/vendor-check.js:183-185` — une même copie réclamée par deux raisons n'est présentée qu'une fois). La phrase est donc **fausse dès que la dédup mord** : mesuré à **23 gestes pour 24 dérives**. Le commentaire `:223-224` porte **le même faux invariant**. Remède pré-mâché : cesser d'affirmer la bijection et rendre les **deux** cardinaux — `REMEDE - N geste(s) pour M derive(s) constatee(s)` — en corrigeant **aussi** le commentaire, plus une garde dans `cli/test/vendor-check.test.js` (`:378-427` porte déjà une recette dédiée du bloc `REMEDE`).

- [ ] **`CLI-WRAPPER-RACINE` — le wrapper de poste vise la racine, jamais le worktree.** *(**0,25 j-h** une fois l'option choisie ; **arbitrage DÉCIDEUR** — stratégie d'installation — exécution ⚒️ **Gimli**.)* `/Users/sjupin/.local/bin/iakaframe` fait `exec node "$HOME/work/iakaframe/cli/src/index.js" "$@"` : depuis un arbre lié, `iakaframe <verbe>` exécute le CLI **de la racine**, jamais celui du worktree — on croit tester son lot, on teste `main`. **Hors dépôt** (artefact de poste, non versionné) : l'écriture ne peut se faire sous **aucun** lot borné à un dépôt.
  **Le remède naïf est pire que le mal** : résoudre le CLI depuis le dépôt courant ferait exécuter le code de **n'importe quel clone** où l'on se trouve — on échange un piège contre un pire. C'est un **arbitrage de stratégie d'install**, pas un bug à écraser.

- [ ] **`CRITERE-BACKLOG-D10` — reprendre le CRITÈRE, pas la liste.** *(titulaire 🧙 **Gandalf** — geste de **critère**, donc cadrage amont : définir ce que la garde doit distinguer, pas retoucher une exécution.)* Le **volet skills** de `G-ROUTE-1` (`D8`) ne distingue pas un **chemin de fichier CITÉ** d'un **jeton de skill ATTRIBUÉ**. Lui apprendre cette distinction rendrait l'exemption de chemin **(c)** sur `BACKLOG.md` **inutile** — elle **périrait d'elle-même** au sens de `D5`, et `CA-7` redescendrait de **4 à 3** exemptions. Recommandation de 🏹 **Legolas** (*« `D10` prescrit littéralement : si l'on doit ajouter des lignes, c'est que le critère est mauvais — on corrige le critère, pas la liste. […] si tu reprends un des trois, prends celui-là. »*), **non reprise à chaud** par arbitrage de coordination — *un gate qui se rouvre pour du confort n'est plus un gate*. **Provenance : arbitrage de COORDINATION sous autonomie déléguée, PAS du décideur → RÉVERSIBLE s'il le reprend.**
  **Renvoi** : déjà inscrit au **§ 8 « Hors périmètre — nommément »** de `specs/instructions/garde-balayante-routage-prod.md`, sur la branche `docs/successeur-critere-backlog-d10` (`278a261`) — **non fusionnée dans `main`** ; l'entrée ne se lit pas depuis `main`, d'où son inscription ici.

- [ ] **`ROLE-VOCAB-CANON` — un site juste, mais sous aucune garde.** *(titulaire 🧙 **Gandalf** ; lot **AMONT**, il touche au canon.)* `README.md:227-228` (lignes de rôle *Déploiement* / *Surveillance*) est **juste** depuis le merge (`F29`), mais **rien ne l'y maintient** : aucun test ne lit le README racine (`F30`) et **aucun prédicat ne peut l'atteindre** (`F28`) — le fichier ne porte ni nom de persona ni nom de skill, alors que les prédicats exigent l'un des deux. **La faute s'y exprimerait en mot de RÔLE, pas en nom de persona** : c'est précisément ce que la garde ne sait pas voir. Le verrou n'est **pas** un ajout à `ROUTAGE_A` (mesuré : 0 faute niveau A ; 9 remontées niveau B dont 8 faux positifs) ; il suppose de **canoniser un libellé de rôle destiné à la doc**, puis un contrôle d'**arité** (`D11`). Porté par extension à **toute vitrine rédigée en langage de rôle**. Non laissé orphelin : inscrit au registre des angles morts `D14` du lot balayant.

- [ ] **`CRITERE-DOC-CA15` — un critère plus étroit que la doc légitime qu'il décrit.** *(titulaire 🧙 **Gandalf** — geste de **critère**, même nature que `CRITERE-BACKLOG-D10` ; **NON BLOQUANT**.)* `CA-15` (`specs/instructions/correctif-generateur-etat-des-lieux.md:805-811`) exige que `docs/commandes.md:121` « énonce **exactement deux** choses […] **Rien de plus** » : la clause s'ancre sur **ce que la ligne contient**, alors qu'elle devrait s'ancrer sur **ce que le lot ajoute**. Conséquence : une phrase de doc légitime, antérieure ou sans rapport avec le lot, ferait rougir le critère sans que le livrable soit en cause. Constat de 🏹 **Legolas**, cité : *« un critère dont la formulation est plus étroite que la doc légitime qu'il décrit est un défaut de rédaction, pas un défaut de livrable. »*

- [ ] **↪️ RENVOI — `GUI-VENDOR-CHARON` : le chiffre juste est `0 → 24`.** L'entrée vit **chez elle**, plus haut dans ce backlog (section *Suites de la scission du squad prod*) et dans le dépôt `~/work/iakaFrameGUI` — **non dupliquée ici**. Seule la **rectification chiffrée** est consignée : la vraie ligne de base est **`OK`, 0 dérive**, donc le delta est **0 → 24 fixtures**, dont **4 manquantes** (celles nommées à l'entrée d'origine). **Ni 3, ni 16, ni 23** : le `+1` par rapport au 23 annoncé est **sourcé** — `skills/iakaframe-fabrication/SKILL.md`, un `contenu-different` né de `e610091`, **pas** une cinquième `fixture-manquante`. Déplacement **déclaré, non résolu** (`CA-15` du lot balayant demande de le déclarer, pas de le corriger). **À grouper avec `VENDOR-REMEDE-CARDINAL`.**

- [ ] **↪️ RENVOI — `GUI-PARITE-WORKTREE` : des tests qui skippent sur un motif FAUX.** *(titulaire ⚒️ **Gimli** ; correctif d'**instrument**, mineur mais **pas anodin** — tant qu'on travaille en worktree, des tests ne mesurent **jamais rien** sans qu'on s'en aperçoive.)* Les skips de parité affichent « *dépôt iakaFrameGUI absent - CI isolée* » alors que le frère **existe** en `/Users/sjupin/work/iakaFrameGUI` : c'est la résolution **relative au dépôt** qui échoue depuis `.claude/worktrees/` (`F32`). **Palliatif connu à DEUX variables**, et non une : `IAKAFRAME_GUI_ROOT` (`cli/test/frontmatter-schema-parity.test.js:59`) **et** `IAKAFRAME_CORE_VOCAB` (`cli/test/vocab-parity.test.js:17`) — exporter la première seule laisse la seconde suite muette. Correctif de fond : résoudre la racine **réelle** du dépôt, pas le worktree.

**Deux points ouverts consignés au passage — ni successeurs, ni lots :**

- [ ] **Dette de tagging — `v0.20.4` face à une version `0.39.0`.** Le dernier tag posé accuse **19 versions mineures de retard** sur la version courante. **Connue, distincte** (sans rapport avec le routage ni avec le générateur), **non traitée** — déclarée hors périmètre par les deux lots successifs plutôt que traitée en douce.
- [ ] **`A-1` du lot générateur — OUVERT et NON TRANCHÉ, il appartient au DÉCIDEUR.** *Faut-il, en plus du libellé (`D3`), poser une note humaine dans le journal au point de rupture du compte de fichiers ?* Le lot est **exécutable sans lui** (défaut si non tranché : on ne fait rien de plus) et a été livré ainsi ; l'amendement post-gate ne l'a **pas** refermé. S'il est retenu, la note vaut **par dépôt**, chacune écrite dans le sien (cas mesuré : `9 227 → ~470` sur le dépôt GUI).

### Recette iakaFrameGUI (RQV humaine du 2026-07-27) — GUI-only

- [x] **Sélecteur de charte graphique → dans les Réglages** *(décideur, recette 2026-07-27)*. Le `CharteSelector` vit aujourd'hui dans le chrome (`ForgeShell.tsx`, à côté du bouton New) ; le déplacer dans le panneau Réglages (`SettingsRoot`). GUI-only.
  **✅ SOLDÉ (session 2026-07-27→29)** : GUI `6d49bb7` (CharteSelector déplacé dans SettingsRoot).
- [x] **FAIL — bouton New du chrome inerte sur les réservoirs** *(recette 2026-07-27)*. Le New du chrome (`ForgeShell.tsx:280`, `disabled={activeDoc===null}`) ne pilote que les entrées à document (méthode/team/kit/workflow) ; sur **persona** et **éléments** il est grisé alors que ces écrans ont leur propre création → ressenti « New marche pas ». **Unifier** : le chrome New doit déclencher la création de l'écran courant. Double affordance New à résoudre (déjà signalée arbitrage Lot 2).
  **✅ SOLDÉ (session 2026-07-27→29)** : GUI `f5388ed` (New unifié via ForgeCreateContext, crée sur persona + éléments).
- [x] **FAIL — popups Open/Save/Save As sans fermeture au clic extérieur** *(recette 2026-07-27)*. Les popups/menus de la `DocBar` ne se ferment pas au clic à côté (manque click-away + Escape). Vérifier au passage Réglages + sélecteur de charte pour un dismiss cohérent.
  **✅ SOLDÉ (session 2026-07-27→29)** : GUI `f5388ed` (hook useDismiss, clic extérieur + Escape).
- [x] **Nettoyer les commentaires périmés « différé/session »** *(dette doc, recette 2026-07-27)*. `ElementReservoir.tsx` (« pools 5b/5c différés »), `WorkflowElementEditor.tsx` (« ne persiste rien, Lot 5 différé »), `RitualEditor.tsx` (« ne persiste rien ») : **faux depuis** 5b/5c (persistance `poolWrite` câblée). Aligner la prose sur la réalité.
  **✅ SOLDÉ (session 2026-07-27→29)** : GUI `f5388ed` (ElementReservoir / WorkflowElementEditor / RitualEditor rectifiés).
- [x] **Copilote d'atelier (`CopiloteShell`) vs Fëanor-en-tête : honnêteté divergente** *(audit 2026-07-27)*. `FeanorHead` est honnête (repli aveu, jamais de mock) ; `CopiloteShell` (team/méthode/kit) tombe en **mock déterministe** (`mock/copilote.ts`) quand le modèle est absent/injoignable (défaut « claude-code · mock »). À arbitrer : aligner le Copilote sur l'honnêteté de Fëanor (aveu au lieu de mock), ou garder le mock comme aide hors-ligne assumée+étiquetée. Différés Fëanor connexes : **web live** (décidé différé, surface CSP), **corps `SKILL.md`** éditable, **exécution des rituels** (geste différé côté cœur).
  **✅ SOLDÉ (session 2026-07-27→29)** : GUI `ae29302` (option C — aveu par défaut, mock opt-in étiqueté ; provider ollama + openai/LiteLLM via `ba92318`).

### Suites de la scission du squad prod (2026-08-08)

> Nées de `specs/instructions/scission-squad-prod-charon-helm.md` (⛴️ Charon prend la bascule,
> 🌉 Helm est recentré sur la veille). **Le premier est une dette CHIFFRÉE et DATÉE d'un même
> lot, pas une découverte** — le décideur l'a accordée nommément au jalon P1→P2.

- [ ] 🛑 **`GUI-VENDOR-CHARON` — `vendor-check` est ROUGE, et c'est le lot qui l'a voulu.** *(~0,5 j-h, dépôt `~/work/iakaFrameGUI`, à enchaîner SANS DÉLAI.)* Les cardinaux de `cli/src/lib/vendor.js` sont passés à **10 / 10 / 20 / 82** ; le dépôt frère n'a pas encore les **4** fixtures correspondantes — `personas/charon.md`, `agents-golden/charon.md`, `roles/surveillance.md`, `skills/iakaframe-surveillance/SKILL.md`. La garde les réclame (`fixture-manquante`) jusqu'à leur vendorage.
  **Ne pas « réparer » en redescendant les constantes** : ce serait le choix explicitement écarté par le décideur — la garde redeviendrait verte **en cessant de regarder** Charon, le rôle `surveillance` et la skill neuve, **et personne ne le saurait**. Dans ses termes : *une garde verte qui ne regarde plus rien est pire qu'une rouge.*
  *À savoir avant de diagnostiquer* : `cli/test/vendor-check.test.js` reste **vert** (il bâtit des miroirs synthétiques depuis le canon, il ne compare jamais au frère réel) ; le rouge est celui du **verbe** `iakaframe vendor-check`. Et une dérive **antérieure et sans rapport** existait déjà sur `binding/iakaframe-claude-default.md`.

- [ ] **`HUB-VEILLE` — le déclencheur de Helm.** *(2 à 3 j-h, dépôt `~/work/iakaHub`, **cadrage séparé**.)* **Après la scission, Helm reste un persona SANS DÉCLENCHEUR** — le lot est un **préalable, pas le remède**, et le décideur en a pris acte. Trois briques mesurées absentes : **(1)** une **horloge calendaire** (iakaHub n'a aucune horloge ; un ordonnanceur crontab, **pas** `setInterval`, qui dérive) ; **(2)** une **émission non bloquante** — le seul canal entrant est `POST /ask`, qui *attend une réponse humaine* et ne peut donc pas porter une alerte (une alerte s'émet, elle ne se demande pas) ; **(3)** un **runner généralisé** — aujourd'hui câblé sur Odin **et interdit de `Bash`**, donc **structurellement incapable de faire un health-check**. Plus `HUB-PERSONA-CHARON` (le registre de personas d'iakaHub ne connaît pas `charon` ; repli permissif, donc sans blocage, mais sans entrée dédiée).

- [ ] **`ROSTER-FEANOR` — `feanor` manque au `ROSTER` du garde de délégation**, dans les **deux** `guard-core.mjs` : `Task(agent: feanor)` est **refusé** aujourd'hui. **Antérieur à la scission**, qui ne l'a pas créé et ne l'a délibérément pas corrigé : l'ajouter changerait le **comportement de délégation** de Fëanor, que personne n'a demandé. Constaté, non fait — un commentaire le dit dans les deux fichiers.

- [ ] **`CHARON-IKE` — collision de vocabulaire dans le champ ops.** `charon` est le nom du **démon IKEv2 de strongSwan** (variantes `charon-systemd`, `charon-nm`, `charon-cmd`), très répandu. Le nommage est **figé par le décideur** et ne se rouvre pas ; ceci est consigné pour le **diagnostic futur** : le jour où Charon écrira dans un journal d'exploitation ou apparaîtra dans une liste de processus, `charon` y désignera peut-être déjà autre chose. Signalé, non traité.

### Chantiers

- [x] **Aligner le GUI : `frame = méthode + team` (frères sous le frame)** *(décideur 2026-07-26)*. Rendre **visuellement clair** dans iakaFrameGUI que le frame possède **deux frères de même niveau** (une méthode **et** une team), et **pas** « méthode ⊃ team ». Cross-repo `iakaFrameGUI` — à cadrer/coordonner **avec le décideur** (son espace de travail GUI est actif). Réf. constitution `specs/instructions/constitution-modele-de-frame.md` C-2. **✅ SOLDÉ (2026-07-30, audit Legolas PASS cross-repo)** : le GUI présente déjà méthode+team en deux frères de même niveau (écran `AssemblyView` `.brothers` = 2 colonnes sœurs `.box.method`/`.box.team` mariées par `.binding` ; nav plate ; galerie 2 chips sœurs ; `OpenFramePanel` à plat). Tests non-régression verts (`assemblyModel.test.ts`/`AssemblyView.test.tsx`, `vitest` 13/13). Aucune vue « méthode ⊃ team ». Livré par le Lot 1 pilote (`alignement-gui-modele-de-frame.md`).
- [x] **Réconcilier `rangement-catalogue-frames-reservoir.md §3.3` avec la constitution** *(doc, mineur)* : la formulation « QUALIFIER les deux » doit se relire « ranger sous ids distincts, **sans dédup forcée ni renommage du personnage** » (constitution C-5). Réf. `constitution-modele-de-frame.md`.
  **✅ SOLDÉ (0592764, 2026-07-30, Gandalf)** : §3.3 amendée — ids distincts (natif nu / emprunteur qualifié, ex. `ohno`/`leanstartup-ohno`), coexistence légitime, id qualifié = rangement jamais renommage, `name:` identique des deux côtés. Réf. C-5.

- [x] **🏛️ Modèle réservoir + pointeur `iakaframeactive` par projet** *(DÉCIDÉ par le décideur le 2026-07-24 — à cadrer Gandalf ; FONDATION qui reconditionne le lot Fëanor ci-dessous)*. **`iakaframe` n'est plus « une frame » mais le RÉSERVOIR de toutes les frames iaka.** Deux niveaux : une **`library/` partagée = pot commun de briques** (roles/personas/principles/rituals/guardrails/skills/scaffolds/workflows) pour **toutes** les frames ; et **N frames de même niveau**, chacune = un **assemblage** (`method` + `team` + `binding` + `kit`) qui pioche dans la library partagée. **Décisions actées :**
  - la frame actuelle **« iakaframe » devient le *default***.
  - **pointeur `iakaframeactive` au niveau du PROJET** : la frame active est une propriété du **lieu** (le projet), pas un état global mutable. `iakastart`/commandes lèvent la team **du projet où elles tournent** — plus de pointeur global, plus d'aiguillage à construire.
  - à la **création/init d'un projet → pointeur posé sur le default** (le user changera ensuite, voir item suivant).
  - au **portefeuille (Odin, `~/work`) → un pointeur `iakaframe` par défaut = l'actuelle** (default hérité par les nouveaux projets / fallback).
  - le user change la frame d'un projet via **iakaFrameGUI** ou **sur ordre au portefeuille (Odin)**.
  - **Point de vigilance connu** : la frame « dans le projet » est une **copie déployée** (`<projet>/.claude/…`) qui peut diverger du canon du réservoir — c'est la dette parité/`vendor-check`, **généralisée à N frames**. Le pointeur doit nommer **quelle frame ET quelle version** pour permettre la re-synchronisation. *Item Gandalf — cœur de l'architecture, impact CLI + iakaFrameGUI. Reconditionne `role-frame-builder.md` (Fëanor) et le chantier outillage de forge (`frame new`/`frame lint`).*
  - **✅ IMPLÉMENTÉ (Gimli) + gate P2→P3 Legolas PASS le 2026-07-24**, sur branche `feat/reservoir-de-frames` (2 dépôts), **non mergé** (décision humaine en attente). Critères A1…A13 + A-cohérence tous satisfaits, suites vertes rejouées par Legolas (CLI 495/0, GUI vitest 518/0, tsc+eslint clean, Rust 75/0, vendor-check drift 0), non-régression prouvée (repli default testé). **Réserve tolérable à solder en sweep de suivi** : reliquat de vocabulaire `reservoir` dans la couche UI `src/forge/` (`ReservoirPanel.tsx`, `useForgeReservoir.ts`, `ReservoirPanel.test.tsx`, mentions `ForgeShell.tsx`) portant le sens « pool de sous-éléments » que AR-2 renomme `element pool` — le **cœur GUI** (`packages/core`) est conforme (A13 vert), seule la couche UI garde l'ancien mot. Frontière `llm.ts` (mot `reservoir` = allowlist d'ops LLM, sens distinct) jugée **acceptable** par le gate, hors AR-2.
  - **✅ SOLDÉ (session 2026-07-27→29)** : réservoir mergé + pointeur de frame active comme **source unique CLI↔GUI** (`iakaframe frame use`), livré en **v0.30.0** (galerie models actionnable, #2).

- [x] **Changement de frame d'un projet par le user** *(backlog explicite, décideur 2026-07-24)*. Après init (pointeur sur le default), le user bascule un projet sur une autre frame du réservoir — via **iakaFrameGUI** (sélection/édition) ou **sur ordre donné au portefeuille** (Odin, verbe `switch` à confirmer comme point d'ancrage). Mécanisme : bascule du pointeur `iakaframeactive` + **re-déploiement de l'assemblage** de la nouvelle frame dans le projet + garde de parité. *Dépend du modèle réservoir ci-dessus.*
  **✅ SOLDÉ (session 2026-07-27→29)** : **v0.30.0** — galerie models cliquable pose le pointeur, verbe `iakaframe frame use <id>`.

- [x] **Outiller le geste de forge d'un frame vierge (`frame new` / `frame lint` / scaffolds d'atomes)** *(R14 tranchée par la démo Fëanor du 2026-07-24)*. **✅ SOLDÉ (2026-07-30, audit Legolas PASS)** : outillage complet, fonctionnel, testé. `frame new <id>` (ossature 5 fichiers pointant le pool partagé, lint-clean par construction ARB-3, non destructif) ; `frame lint <id>|--all --strict` (validateur de graphe qui **rougit réellement** : `missing-ref` sur methodId/roleKey pendant, `id-filename` sur id≠fichier ; parité CLI↔cœur GUI verrouillée) ; scaffolds `add persona|role|principle|ritual|guardrail|skill|workflow|scaffold <id>` (typés, non destructifs, gabarits lint-clean). 4e « manque » (kit-depuis-binding) **hors périmètre** (`outillage-forge-frame.md:290`), porté par `assemble`. Tests : `frame-scaffold/frame-lint/frame-lint-parity/frame-lint-schema.test.js` (37/37), `node --test` 594 pass. Cadrage `specs/instructions/outillage-forge-frame.md`. La démo a prouvé que le **modèle** de frame est neutre vis-à-vis de la gouvernance (Fëanor a forgé un frame Scrum auto-organisé complet, 33 fichiers, 0 id pendant), **mais qu'aucun verbe CLI ne scaffolde un frame neuf** : tout a été fait à la main (`mkdir`, écriture depuis gabarits, validation par grep maison). Manques constatés : `frame new <nom>` (ossature), `frame lint` (validation que les ids `method→library` résolvent — rien ne l'attrape aujourd'hui), scaffolds unitaires `add role|persona|ritual|guardrail`, génération du kit depuis le binding. *Base de démonstration rangée : `~/work/frame-scrum` (à re-ranger selon le modèle réservoir : briques → library partagée, ne garder que l'assemblage). Item Gandalf→Gimli.*
  - **✅ LIVRÉ (Gimli) + gate P2→P3 Legolas PASS le 2026-07-25**, mergé `main` (v0.22.0) : `frame lint <id>|--all` (parité CLI de `checkFrameRefs`, verrouillée par test de parité vivant), `frame new <id>` (ossature lint-clean par construction), `add <pool>`/`add frame` exposés. 522 tests, drift 0, zéro dépendance, cœur GUI intouché. **2 dérives documentaires à réconcilier dans `outillage-forge-frame.md`** (le code est correct, seule la prose de l'instruction diverge) : (1) § 3.4 dit « id-collision **bloquant** » alors que le code (correctement) le traite en **avertissement** — le canon partage 4 ids à dessein (`qualite`/`documentation` principe+rôle, `portefeuille` rôle+scaffold, `iakastart` skill+rituel), un blocage casserait `frame lint iakaframe` ; aligner la prose sur « avertissement ». (2) § 3.4/§ 5.1 listent un avertissement « champ inconnu » que le code n'émet **pas** (tolérance silencieuse, conforme à l'intention permissive d'ARB-1 : l'émettre exigerait le schéma strict qu'ARB-1 diffère) — aligner la prose. *Item Gandalf, réconciliation doc, non bloquant.*

- [x] **Catalogue de frames forgé (7) + 3 biais d'architecture (démo Fëanor, 2026-07-24)**. Fëanor a forgé en autonomie **7 frames** de gouvernances contrastées (brouillons scratchpad + `~/work/frame-scrum`) : **scrum** (33 f., auto-organisé), **kanban** (36 f., flux/WIP, quasi sans rôles), **shapeup** (37 f., pari+autonomie), **design-thinking** (41 f., cyclique non-linéaire, non-logiciel), **lean-startup** (35 f., piloté par la donnée), **waterfall** (36 f., séquentiel à gates), **gtd** (33 f., **solo N=1**). **251 fichiers, 0 id pendant sur les 7** — le modèle encaisse des gouvernances antipodes sans casser sa grammaire. **Trois findings à traiter :**
  - **Finding 1 — biais de gouvernance (pipeline à gates)** : le format `workflow` (`phases` input/output + bloc `gates`) présuppose un **pipeline surplombant**. Prouvé par les deux bouts : Scrum/Design Thinking ont dû **détourner** (`kind: cycle`, `loop`, pas de `gates`), tandis que **Waterfall remplit le format tel quel** (structure exacte d'iakaframe, gardes matérialisables par hooks). **Le vocabulaire de `workflow` n'est pas agnostique** — à corriger pour un réservoir vraiment neutre.
  - **Finding 2 — biais de cardinalité (révélé par GTD)** : le format présuppose une **équipe N≥2** (`team.personas` pluriel, `coordinator`, casting `method.roleKeys`, périmètres étanches *entre* agents). Une méthode **solo** (GTD, N=1) fait **dégénérer** ces champs : coordinateur sans coordonnés, cloisonnement sans frontière, moindre privilège qui ne sépare rien. Le modèle suppose une coordination *dans l'espace* ; une méthode solo s'articule *dans le temps*. Piste GTD retenue : rôles-**modes** (`scope: mode`) décrits en library, team de cardinalité 1 (un acteur porte les 5 modes).
  - **Finding 3 — pas de schéma ni de linter de frontmatter** : chaque forge a **inventé ses champs par imitation** (`kind`, `nature`, `pillars`, `scope: mode|inherited`, `soleActor`, `noBackflow`, `side`, `optional`…) et rien n'empêche une **erreur de type** (un principe glissé dans un champ `guardrails:`, attrapé à la main sur Lean Startup). → carburant direct du chantier `frame lint` (schéma typé par champ, énums de `kind`, unicité des ids).
  - **Pot commun de briques émergent (à promouvoir vers `library/` partagée)** : **time-box/engagement borné** (`wip-limit` Kanban, `circuit-breaker`+`fixed-time-variable-scope`+`appetite` Shape Up, `time-box` Scrum — 3 méthodes convergent) ; **inspect-adapt/rétrospective** (`retrospective` Scrum, `iteration-loop` DT, `weekly-review` GTD, `learning-review`/`pivot-or-persevere` Lean, empirisme — *iakaframe n'a pas de rétrospective*) ; **`mvp`** (Lean) *recoupe `mvp-first` déjà au canon iakaframe* → atome réservoir évident ; **centré-utilisateur** (`customer-focus`, `user-centered`, `evidence-from-users`, `market-evidence`) ; **phase-gate/`traceability`/`baseline-freeze`** (Waterfall), **`five-whys`** (Lean), **`next-action`/`two-minute-rule`/`capture-everything`/`inbox-zero`** (GTD), `pull-not-push`/`no-backlog`, `explicit-policies`, `definition-of-done`, `diverge-before-converge`, `prototype-before-invest`, `bias-toward-action`. Promotion = **copie généralisée** (id neutralisé), jamais partage direct. *À faire une fois le réservoir posé : les 7 frames-brouillons seront rangés dedans (briques → library partagée, frame réduite à son assemblage).*
  - **✅ SOLDÉ EN PARTIE (session 2026-07-27→29)** : le **pot commun de briques émergentes** est **promu** (lot rangement-catalogue) — dont la **rétrospective**, adoptée par le default en **v0.38.0** ; les **3 biais** (workflow agnostique, cardinalité, schéma typé) sont **traités**.
  - **✅ SOLDÉ EN ENTIER (2026-07-30, audit Legolas PASS)** : le rangement des 7 frames-brouillons dans le réservoir partagé est **complet et fidèle** au modèle réservoir. Les 7 (scrum, kanban, shapeup, design-thinking, lean-startup, waterfall, gtd) existent comme **assemblages** (method+team+binding+kit appariés, `methodId`↔`teamId` concordants), briques mutualisées dans `library/` (descripteurs `frames/*.md` = purs ids, aucun corps recopié), **0 id pendant** (`frame lint --all --strict` vert, 8 frames « ok »), les 8 avertissements `id-collision` sont tous **inter-pools** = coexistence légitime C-5 (aucun intra-pool, aucun écrasement), **aucun brouillon orphelin** (`~/work/frame-*` no matches ; `frames/` = 8 descripteurs + release StefFrame2). `node --test` : 594 pass / 0 fail. Legolas gate PASS.

- [x] **🆕 Créer un rôle supplémentaire : `frame-builder` (constructeur de frame)** *(demande décideur, 2026-07-23)*. **✅ SOLDÉ (2026-07-30, audit Legolas PASS — plan mécanique)** : le 9ᵉ rôle `frame` (clé `frame`, `roleIndex 9`, `scope: portfolio`) est créé (`library/roles/frame.md`), casté **1↔1** par la persona neuve **Fëanor** (`roleKey: frame` → seul `feanor.md`, roster 8→9, pas de double-rôle) et cohérent de bout en bout : `methods/iakaframe.md` roleKeys inclut `frame` ; `teams/iakaframe-8.md` inclut `feanor` (id `-8` = identifiant opaque assumé, pas un compteur) ; binding porte le triplet Fëanor ; cœur GUI vendoré (`roles.ts`/`roster.ts`/`casting.ts`) à 9 rôles sans renumérotation, collision `8%8=0` évitée ; golden `feanor.md` ; activation explicite (exclu de fullteam, testé). `frame lint iakaframe --strict` 0 bloquant, `vendor-check --strict` drift 0, `node --test` 594 pass. Les 5 arbitrages (a→e) tranchés dans `role-frame-builder.md` (scope `portfolio` · D3 persona neuve · roleIndex 9/🟠 · frontière étanche §2.1 · conséquences §5). *Réserve corpus-web reportée en sous-item ci-dessous (complétude documentaire, distincte de la création du rôle).*
  - [x] **Suite L56 — compléter le corpus mondial de la skill-rôle `iakaframe-frame`** : ~~2 marqueurs `[WEB-À-VÉRIFIER]` subsistent~~. **✅ FAUX POSITIF — DÉJÀ FAIT (constaté 2026-07-30)** : les 2 occurrences du terme sont des **phrases en prose** déclarant que « **tous les marqueurs `[WEB-À-VÉRIFIER]` ont été levés** » le 2026-07-25 (branche `feat/persona-feanor`), pas des placeholders en attente. Vérification : **zéro** `TODO`/`FIXME`/`placeholder`/`à compléter`/`à sourcer` dans le corpus ; `sources.md` renseigné (41 lignes, 8 URL, horodatage `vérifié le 2026-07-25` dans les 3 fichiers, A24 tenu — chaque framework re-vérifié contre sa source primaire). Le comptage de Legolas (grep du terme) captait les mentions de complétude. Rien à lancer. Le référentiel `library/roles/` porte **8 rôles** (`cadrage`, `coordination`, `deploiement`, `design`, `dev`, `documentation`, `portefeuille`, `qualite`), tous castés 1↔1 par une persona du roster. Aucun ne couvre la **construction du frame lui-même** — le travail sur `library/`, `bindings/`, `methods/`, `teams/`, `kits/` et `frames/` est aujourd'hui réparti implicitement entre Gandalf (cadrage), Gimli (dev) et Aragorn (coordination), sans rôle nommé ni périmètre étanche. C'est le seul travail du projet qui n'a pas de rôle à son nom, alors que c'est le **cœur du produit**.

  *À trancher au cadrage (rien n'est décidé) :* (a) le rôle est-il un **9ᵉ rôle d'équipe** (`scope: team`) ou un rôle **transverse/portefeuille** comme `portefeuille` ? (b) quelle persona le caste — une **persona neuve** (le roster passe de 8 à 9) ou un **second rôle** porté par une persona existante, ce qui poserait la première entorse au 1↔1 persona↔rôle ? (c) quel `roleIndex` et quelle pastille (la palette et la collision rouge Gimli/Legolas sont documentées intentionnelles — la pastille porte la phase, pas l'agent) ? (d) où passe la **frontière étanche** avec `cadrage` et `dev`, sachant que construire le frame *est* du dev sur un dépôt dont le contenu *est* de la méthode ? (e) conséquences mécaniques : `bindings/iakaframe-claude-default.md`, `teams/iakaframe-8.md` (le nom même de la team encode le compte), `methods/iakaframe.md`, générateur persona→contrat, `vendor-check` (les 18 copies + 4 dérivées vendorées côté GUI), tables de rôles codées CLI et cœur GUI, et les 8 vignettes de la GUI.

  *Item Gandalf — à cadrer avec le même sérieux que l'audit Aragorn. Impact cross-repo certain (iakaframe + iakaFrameGUI) : à traiter comme un lot à part entière, pas comme un ajout de fichier.*

  - **✅ CADRÉ (Gandalf, gate P1 PASS 2026-07-23, ré-ancré réservoir + re-gate PASS 2026-07-25)** puis **IMPLÉMENTÉ (Gimli, P2)** sur branche `feat/persona-feanor` (2 dépôts). Rôle **`frame`** (roleIndex 9, `Constructeur de frame`) casté 1↔1 par la **9ᵉ persona Fëanor** (🟠, royaume `FRAME`, activation explicite seule). Livrés : `library/roles/frame.md`, `library/personas/feanor.md`, `methods/iakaframe.md` (roleKeys 9), `teams/iakaframe-8.md` (+note `-8` opaque + note activation explicite), `bindings/…` (feanor + `WebSearch`/`WebFetch`/`Write`/`Edit`/`Bash`), `EXPLICIT_ACTIVATION_PERSONAS` (distincte de `PORTFOLIO_PERSONAS`), `ROLE_OF`/`SKILL_OF` (+commentaire divergence lexicale), `vendor.js` (18→20), golden feanor (généré), skill `iakaframe-frame` + **corpus mondial (squelette sourcé, à compléter web)**, réciproque frontière dans `gimli.md`, kits (anythingllm/openwebui), iakastart roster 9, docs. **A0 : les 3 gardes vues ROUGES puis vertes.** Gate Legolas requis (Gimli ne s'auto-valide pas). Reste à compléter par agent web : **profondeur/horodatage du corpus** (marqueurs `[WEB-À-VÉRIFIER]`).

- [ ] **Miroir `frames/releases/StefFrame2/` FIGÉ à 8 rôles (release pré-Fëanor)** *(décision A14, lot Fëanor 2026-07-25)*. Le miroir de release StefFrame2 (double dossier `roles/` + `library/roles/`, 8 fiches chacun) **n'est PAS rafraîchi** avec le 9ᵉ rôle : une release est un **snapshot immuable**, et `frame verify` ne contrôle **que l'anonymisation** (aucune garde ne compare le miroir au canon). Rafraîchir 251 fichiers pour un artefact figé serait disproportionné et risqué. **Décision : gelé, StefFrame2 documente l'état pré-Fëanor** (le guide `docs/guide-stefframe2.{md,html}` reste cohérent à 8). Dette connexe : **aucune garde de parité miroir ↔ canon** (R2) — même classe que `vendor-check`, restée ouverte côté frame release. *À trancher si un jour StefFrame2 doit repartir du canon vivant.*

- [x] **Dette des skills déployées (`~/.claude/skills/`)** — **re-mesuré le 2026-07-23, la dette s'est CREUSÉE** : **25 skills au canon `library/skills/`, 15 déployées** → **10 absentes** (contre 8 au relevé du 2026-07-19, le canon ayant gagné des skills sans que le déploiement suive). `iakaframe-jalon` est **toujours absente** : le geste de jalon introduit en v0.17.14, désormais irrigué dans **8 personas sur 8** (min. 2 mentions, jusqu'à 9 chez Legolas et Aragorn), **n'est toujours pas actif en runtime** — les 8 chartes décrivent un geste qui ne s'exécute pas. **2 fichiers déployés portent encore l'ancien canal (mention pré-migration Discord)** — jonction avec le critère **B17** (« aucun résidu de l'ancien canal dans `~/.claude/skills/` »), à solder par un **redéploiement** des skills une fois le canon purgé (hors périmètre du lot de purge canon). Contrairement aux personas, les skills n'ont **ni golden ni test de parité** : le chantier appelle un mécanisme de parité sur le modèle du générateur persona→contrat. *Acté par le décideur comme lot suivant le 2026-07-19, jamais lancé. Instruction de cadrage existante : `specs/instructions/parite-skills-generateur-deploiement.md` — **gelée après 3 FAIL, jamais gatée PASS, et périmée** par la phase 1 (pool 23→25, subskills déclarés, arbitrage « union des 11 » à recalculer).*
  **✅ SOLDÉ (session 2026-07-27→29)** : **v0.34.0** (mécanisme `iakaframe skills deploy` + garde de parité + activation) PUIS **déployé au runtime** — Fëanor matérialisé, **19 skills actives**, `grep slack ~/.claude/skills` = 0, critère **B17** tenu.

- [x] **Écrire le générateur de vitrine HTML en Node (`.md` → `.html`)** — *item reformulé le 2026-07-23 : sa moitié « réparer » est caduque.* Le script `iakaframe-build-methode-code.ps1` **n'existe plus** dans le dépôt (retiré par `retrait-scripts-powershell.md` ; les seuls `.ps1` restants sont les hooks et l'installeur de `frames/releases/StefFrame2/`). Il ne reste donc **plus aucun générateur `.md`→`.html`, ni mort ni vivant** — et le besoin, lui, est intact : la zone générée de `methode-de-travail.html` (entre `<!--CODE_BLOCKS_START-->` et `<!--CODE_BLOCKS_END-->`) contient des **copies figées d'anciennes skills/agents que personne ne peut plus régénérer** — désynchronisées du canon vivant. *Sa dérive de canal (16 occurrences de l'ancien canal) a été purgée en **band-aid / édition directe** par le lot de purge canon, faute de générateur ; le band-aid sera écrasé/refait à la première vraie régénération.* La zone reste **orpheline de son producteur**. Chantier : écrire le générateur en Node en pointant les sources actuelles (`library/personas/`, `library/skills/` — et non plus `agents/`, `skills/` à la racine). *Lève au passage la dépendance `pwsh`, absente de la machine.*
  **✅ SOLDÉ (session 2026-07-27→29)** : **v0.37.0** (`cli/scripts/gen-methode-vitrine.mjs` + garde `vitrine-methode.test.js`, zone régénérée frame-scopée **9 agents + 26 skills**, contenu périmé corrigé).


### Dettes de cadrage

- [x] **§ 4.1 à amender — graver l'override autoritaire** (gate vendor-check, 2026-07-20). § 4.1 (« premier chemin existant gagne ») et A8 (« `IAKAFRAME_GUI_ROOT` inexistant ⇒ SKIP ») sont **contradictoires dans le cadrage** dès qu'un dépôt frère réel existe à côté. Gimli a tranché en code : **override autoritaire, jamais de repli silencieux**. Verdict Legolas : **arbitrage BON, niveau MAUVAIS** — le fond est juste (un repli ferait rendre un verdict confiant sur un dépôt non choisi, et rendrait A8/A9 intestables sur une machine où le frère est présent), mais trancher une contradiction de cadrage en code relève de Gandalf. Non bloquant : la décision est **opposable**, portée en clair par `docs/commandes.md`. *Item Gandalf.*
  **✅ SOLDÉ (0592764, 2026-07-30, Gandalf)** : `garde-vendor-check-cross-repo.md` §4.1 (`:187`) grave l'override AUTORITAIRE (posé ⇒ gouverne seul ; absent/invalide ⇒ SKIP ; jamais de repli sur candidats 2/3), « premier-chemin-gagne » restreint à la découverte auto ; A8 (`:304`) reformulé (SKIP même si frère réel existe). Code non touché (déjà juste). Calé sur `docs/commandes.md:157`.

- [ ] **~82 pointeurs `chemin:ligne` périmés dans `specs/instructions/`** — les 4 instructions de phase 2 portent ~82 renvois de la forme `fichier.md:NN` (59 dans `audit-amelioration-roster-personas.md`, 12 dans `parite-skills-generateur-deploiement.md`, 11 dans `decision-rolekey-reconciliation.md`), dont une part vise les **7 personas modifiées en phase 1** et est donc **fausse**. Correctif générique déjà acté en phase 1 (tolérables T2/T3/T6) : **citer par nom de section, jamais par ligne**. Appliqué aux **canons**, **non rétro-appliqué aux instructions**. Traitement retenu au rafraîchissement du 2026-07-20 : les pointeurs antérieurs sont **scellés comme présumés faux** et doivent être **revérifiés avant usage** ; **aucune reprise en masse n'est demandée**. *Exception vérifiée : les pointeurs `library/personas/*.md:5` (ligne `roleKey` du frontmatter) restent **justes**.* *Dette de forme, non bloquante.*

- [ ] **Tolérables de la phase 1 — registre résiduel T2/T3/T4/T6** *(T1 et T5 traités, voir Fait)*. Relevés au 8ᵉ gate du cadrage, classés **non disqualifiants**, à traiter en cours de série. **T2** — `persona-gandalf-amelioration.md:113` et `:76` citent des plages fausses (`odin:66-67` → réel `73-74` ; `helm:70-73` → réel `77-80`). **T3** — `persona-nathalie-amelioration.md:66,151,174` cite `legolas.md:54-60` que L-1 fait glisser. **T4** — `phase1-inventaire-bibliotheque.md:98` : `## 0.4` en niveau 2 quand 0.1-0.3 sont en niveau 3. **T6** — `persona-gimli-amelioration.md:206` cite `gimli.md:39` (réel `:42`), `:72` cite `gimli.md:16` qui porte désormais **l'inverse du propos cité**, `:41` cite une plage décalée. Citations fidèles au mot, pointeurs faux ; **correctif générique commun : citer par nom de section, jamais par ligne**. *Observation hors périmètre : `library/skills/iakaframe-jalon/SKILL.md` ne déclare pas de champ `layer` alors que `gestion-de-source` et `conteneurisation` portent `layer: capacity` — une capacité composée pointant une brique non typée est une asymétrie.* *Deux observations de forme sur le canon Loki : le nom de règle `charte-defaut-conseil-pro` résout vers **deux** définitions (`loki.md` et `iakaframe-naonedge/SKILL.md`, mêmes valeurs, proses différentes) et la déclaration de préséance « `loki.md` fait foi » vit **uniquement dans la copie**.*

### Tolérables techniques

- [ ] **`vendor-check` sature : il compte des fichiers, pas des champs** — *requalifié **LATENT** le 2026-07-23.* Le défaut est réel et non corrigé (la garde dit « ce fichier diverge », jamais « il diverge **davantage** »), mais sa **portée est aujourd'hui nulle** : `vendor-check` mesure **`OK — 18 copies + 4 dérivées conformes au canon`**, drift **0**. Sur une base propre, toute dérive nouvelle fait basculer un fichier du vert au rouge et la garde **mord pleinement**. La cécité ne réapparaîtrait qu'après **ré-accumulation** de dérives non soldées. *À arbitrer si ce jour vient : granularité par champ, ou signature de dérive comparée d'un run à l'autre. Ne justifie plus un lot à soi seul.*

- [x] **Test de non-mutation faible** (`cli/test/vendor-check.test.js:565-569`, **re-vérifié inchangé le 2026-07-23**) — il compare le porcelain GUI avant/après **à l'intérieur de lui-même** et n'assère jamais que la baseline était propre : un arbre déjà sale le ferait passer. Il verrouille un invariant réel (`vendor.js` ne contient aucune écriture, vérifié indépendamment par Legolas), mais faiblement. *Non bloquant.*
  **✅ SOLDÉ (d36fa9c, 2026-07-30, Gimli)** : A5-a réécrit en **preuve positive** — empreinte `sha256:taille:mtimeMs` de chaque fixture vendorée avant/après `checkVendor` (`deepEqual`, indépendant de git) + garde anti-vacance (`Object.keys(before).length > 0`). Démontré : baseline sale ne fait plus passer vacamment (untracked non lié → PASS par preuve) ; +1 octet sur 1 des 83 fixtures fait rougir. `vendor.js` inchangé (helper côté test). CLI 594 pass, drift 0.

- [x] **`iakaframe jalon --help` plante** — **reproduit le 2026-07-23** : `TypeError [ERR_PARSE_ARGS_UNKNOWN_OPTION]` avec stack trace nue (`cli/src/commands/jalon.js:12`), là où `consolidate` gère proprement `--help`. C'est **un verbe de la méthode qui casse sur son propre `--help`** — et c'est le verbe du geste de jalon, désormais cité par les 8 personas. *Correctif quasi nul. Trouvé par Legolas au gate du 2026-07-19.*
  **✅ SOLDÉ (149b7dc, 2026-07-30)** : USAGE + garde `--help` propre (pattern `consolidate`), exit 0 sans stack, test `cli/test/jalon-help.test.js`.
- [x] **Crash `--help` SYSTÉMIQUE sur ~10 autres verbes** *(signalé 2026-07-30 au lot jalon --help)*. Même `TypeError`/stack nue que `jalon` sur : `snapshot`, `update`, `onboard`, `repo`, `switch`, `list`, `show`, `add`, `assemble`, `banner`. Lot dédié (≈10 `USAGE` + gardes + tests, pattern `consolidate`/`jalon`). *Item Gimli, coût moyen.*
  **✅ SOLDÉ (810da1f, 2026-07-30)** : les 10 verbes corrigés (USAGE réel + option `help` + garde en tête, pattern inline `jalon`/`consolidate`), `<verbe> --help` → aide propre exit 0 sans stack. Test paramétré `cli/test/help-systemique.test.js` (10 verbes). Chemin nominal (dont args positionnels) inchangé, CLI 594 pass, vendor-check drift 0.

- [x] **Commentaire trompeur `frameworkVersion()` (`cli/src/lib/kit.js:80`)** — **re-vérifié faux le 2026-07-23**. Le commentaire annonçait `_bundled/VERSION (publie)` alors que le code lit `path.join(root, 'VERSION')`. **✅ SOLDÉ (149b7dc, 2026-07-30)** : commentaire corrigé (`<root>/VERSION`).

### Réserves d'exécution — lot `frame-builder` (Fëanor), gate P1 PASS le 2026-07-23

Instruction `specs/instructions/role-frame-builder.md` **cadrée (Gandalf) et gate de cadrage Legolas PASS**, 0 disqualifiant, 9 arbitrages décideur intégrés. Réserves **tolérables** relevées par Legolas, à porter à l'attention de Gimli à l'exécution (aucune ne justifie un retour cadrage) :

- [ ] **T-1 — mesurabilité partielle de A24 (« corpus relu »)** : le « relu » du corpus mondial n'est pas machine-vérifiable — sa qualité repose sur la relecture au gate final, pas sur une suite verte. La part **structurelle** (6 frameworks + 2 contrastes, chaque affirmation sourcée + horodatée) reste, elle, objectivement constatable.
- [x] **T-2 — l'axe des degrés D0/D1/D3 (§ 5, § 7) peut se lire à la hâte comme un phasage** alors que le lot s'exécute **entièrement à D3** (les degrés inférieurs ne sont qu'une trace de raisonnement, § 4.2). Un bandeau « le lot s'exécute à D3 » en tête de § 5 lèverait tout doute. Cosmétique. **✅ SOLDÉ (12fa997, 2026-07-30, Gandalf)** : bandeau D3 en tête de §5 et §7 (colonne Degré = classement, pas phasage) ; lignes d'origine conservées dessous.
- [x] **T-3 — A4 porte les deux inventaires (`18+4 en D1` ; `20+4 en D3`)** : le lot étant D3, **seul `20+4` s'applique au gate** ; la valeur D1 est informative. N'asserter que `20+4` à l'exécution. **✅ SOLDÉ (12fa997, 2026-07-30, Gandalf)** : A4 clarifié — seul `20+4` asserté au gate, `18+4` (D1) = trace informative (pas supprimée). Cohérent A18/`fixtureTable()`.
- [ ] **T-4 — tension charte↔outillage (A26 « conçoit ET génère » vs R14 scaffolding d'un frame vierge hors périmètre)** : ce n'est **pas** une contradiction — l'instruction la nomme, la borne (réutilise l'existant, conseil+génération sur structure connue) et laisse R14 **ouverte** comme inconnue à éprouver tôt (conforme à l'arbitrage 9). À surveiller en réalisation.
- [x] **T-5 — résidu « clé non tranchée » (`role-frame-builder.md` L~407)** *(re-gate 2026-07-25)* : une note « ⚠️ non tranché… si le décideur préfère `frame-builder` » subsiste alors que la clé **est** tranchée (`frame`, arbitrage 2). Flag de réversibilité pré-amendement, pas un arbitrage ouvert. Lisibilité perfectible — à nettoyer. **✅ SOLDÉ (2f411fc, 2026-07-30, Gandalf)** : note reformulée « ✅ Tranché (arbitrage 2) : clé = `frame`, `frame-builder` abandonné » ; plus de décision en suspens.
- [x] **T-6 — phrasé arbitrage 4 imprécis vs modèle réservoir (`role-frame-builder.md` en-tête L~20-21)** *(re-gate 2026-07-25)* : l'en-tête (section inchangée) dit « son objet n'est pas *le frame de ce dépôt* » ; or, dans le réservoir, **toutes** les frames vivent dans ce dépôt. L'intention (Fëanor ne forge pas le **default**, forge les **autres** frames) reste vraie et est réconciliée par § 2.1/N2 ; seul le résumé de tête garde la formulation pré-amendement. Résidu éditorial mineur. **✅ SOLDÉ (2f411fc, 2026-07-30, Gandalf)** : en-tête reformulé « pas la frame default (canon) du réservoir (reste à Gandalf/Gimli, cf. §2.1/N2), forge les AUTRES ».

### Sauvegarde du portefeuille — dettes du lot 1 (posé le 2026-08-15)

> Le lot 1 a livré : `restic` 0.19.1 sur le poste, un **dépôt chiffré** sur `bigserver`
> (`/fast/backups/portefeuille`), la **clé sur `iakabox-apps`** (machine distincte de celle qui
> porte le dépôt — garde de conception `D5`), et le verbe **`iaka range all|<projet>`**, **sur
> commande uniquement**. Instruction : `specs/instructions/sauvegarde-portefeuille.md`.
> Procédure de restauration : `docs/restauration-portefeuille.md`.
>
> 🛑 **Tout ce qui suit est OUVERT. Chaque ligne est une chose dont on n'est PAS protégé.**

- [ ] **SAUV-1 — 🛑 la copie HORS LIGNE du mot de passe n'existe pas (copie 2 de `D5`).** Le mot de
      passe n'a **qu'un seul exemplaire**, sur `iakabox-apps`. La perte de cette VM rend le dépôt
      **définitivement illisible** — et ça se découvre **le jour où on en a besoin**, sans erreur ni
      alerte. **C'est le point de défaillance unique de tout le dispositif.** *Arbitrage du
      décideur* : où vit physiquement cette copie (gestionnaire de mots de passe, support
      physique), et qui d'autre que lui peut y accéder. **Le lot 1 ne pouvait pas la poser** : elle
      doit vivre hors du poste **et** hors de la box.
- [ ] **SAUV-2 — la clé de secours indépendante n'existe pas (copie 3 de `D5`).** Une seconde clé
      restic (`restic key add`, mot de passe différent, détenue ailleurs) permettrait de
      **révoquer** la clé courante si `iakabox-apps` était compromise, **sans réécrire le dépôt**.
      Non posée : elle exige un détenteur **distinct** de celui de la copie 1, donc l'arbitrage
      `SAUV-1` d'abord.
- [ ] **SAUV-3 — 🛑 `CA-10` (restauration après sinistre simulé) N'A PAS ÉTÉ DÉROULÉ,** et il ne
      pouvait pas l'être : il exige la copie 2 (`SAUV-1`), qui n'existe pas. *Tant qu'il n'est pas
      joué, la règle des copies reste une **intention**, pas une protection.* À dérouler depuis
      **une autre machine**, sans rien emprunter au poste.
- [ ] **SAUV-4 — aucune planification, aucun veilleur d'ABSENCE.** Décision du décideur pour ce lot
      (« sur commande »). Conséquence à ne pas oublier : **si personne ne tape la commande, rien ne
      se passe et personne ne le sait.** Le veilleur d'absence — un service tiers qui crie quand il
      **ne reçoit pas** le signal attendu — est *plus important* que l'alerte d'échec, qui ne se
      déclenche que si quelque chose tourne.
- [ ] **SAUV-5 — aucun canal poussé.** Ni alerte d'échec (`CA-11`), ni alerte d'absence (`CA-12`).
      Le portefeuille n'a toujours **aucun** canal poussé (constat que le ticket `SUP-1` de
      `robby-immo` fait de son côté). Canal visé : **Discord**.
- [ ] **SAUV-6 — aucune rétention, aucune vérification périodique.** `forget`/`prune` ne sont
      **jamais** appelés — état volontaire et **sûr** au lot 1 (rien n'est supprimé), à rouvrir
      quand l'occupation montera. `restic check` n'est pas planifié ; la couverture intégrale
      (`--read-data-subset`) n'est pas bornée (`CA-13`).
- [ ] **SAUV-7 — 🛑 le dépôt LONG n'existe pas, et le piège de son initialisation est ARMÉ.** Le
      jour où on crée `hdd/backups-long`, il **doit** l'être avec `--copy-chunker-params` pointant
      sur le dépôt court : sans cette option la déduplication entre les deux est cassée, les
      données copiées peuvent occuper **jusqu'au double**, **les paramètres ne se changent plus**,
      et **rien ne signale la faute au moment où on la commet**. Commande exacte et contrôle qui la
      prouve : `docs/restauration-portefeuille.md` § 4.
- [ ] **SAUV-8 — aucune copie HORS SITE.** Les deux niveaux prévus sont **deux datasets de la même
      machine** : c'est une copie hors *dataset*, jamais hors *site*. Un incendie, un vol ou une
      panne de `bigserver` emporte **tout**. *Écrit dans la documentation ; à arbitrer.*
- [ ] **SAUV-9 — aucune sauvegarde de machine virtuelle.** `proxmox-backup-client` est installé,
      **aucun job, dépôt vide**. Autre métier, autre lot. Consigné, non traité.
- [ ] **SAUV-10 — bases de données et volumes Docker hors périmètre (lot 2).** Ce qui est ramassé,
      ce sont les **fichiers** de `~/work` — donc un **dump** s'il s'y trouve, jamais une base
      vivante. ⚠ On ne sauvegarde **jamais** un volume PostgreSQL à chaud par copie de fichiers :
      l'image est incohérente **et paraît réussie**.
- [ ] **SAUV-11 — `rest-server` en `append-only` (lot 3).** Seule parade **réelle** à « un poste
      compromis efface ses propres sauvegardes ». Au lot 1, la seule atténuation est qu'aucune
      commande destructive n'est câblée dans `iaka range` — ce qui n'empêche personne de lancer
      `restic forget` à la main depuis le poste.
- [ ] **SAUV-12 — la signature GPG du binaire `restic` n'a pas été vérifiée** : `gpg` est **absent
      du poste** (et `brew` aussi, donc pas d'installation triviale). Ce qui **a** été vérifié :
      la somme **SHA-256** de l'archive contre le fichier `SHA256SUMS` de la release, sur HTTPS —
      **et le contrôle a été vu échouer** sur une archive altérée d'un octet. C'est une garantie
      d'**intégrité**, pas d'**authenticité**. À solder en installant `gpg` et en vérifiant
      `SHA256SUMS.asc`.
- [ ] **SAUV-13 — `restic` n'est pas installé sur `iakabox-apps`,** alors que c'est le **seul**
      poste où `restic mount` fonctionne (macOS exige macFUSE ou FUSE-T). L'exploration d'un
      instantané sans restauration n'est donc pas disponible aujourd'hui.
- [ ] **SAUV-14 — la procédure de restauration n'a pas été SUIVIE PAR UN TIERS (`CA-14`).** Elle
      est écrite et versionnée (donc sur Forgejo, donc elle survit à la perte du poste), mais
      **son auteur est le seul à l'avoir lue**. Une procédure jamais suivie par quelqu'un d'autre
      n'est pas une procédure éprouvée.
- [ ] **SAUV-15 — la croissance hebdomadaire n'est pas mesurée (`CA-6`).** Le tableau de `D4` (pire
      cas ≈ 746 Go sur 1,4 To) reste un **encadrement**, pas une mesure. Il faut **4 passages**,
      dont au moins un **après un build réel**. Tant qu'ils n'existent pas, ne pas conclure que
      l'exclusion est inutile — le **raisonnement** tient, la **mesure** manque.

### Signalement des branches sans copie distante — dettes du lot successeur (posé le 2026-08-17)

> Consigné par l'exécution du lot (étape 12 de l'instruction
> `specs/instructions/signalement-branches-sans-copie-distante.md`), puis **complété le 2026-08-17**
> par le lot successeur `specs/instructions/temoins-manquants-signalement-branches.md` (étape 14) :
> `SIGN-5` re-mesuré, `SIGN-7` et `SIGN-8` ajoutés, puis **`SIGN-9` sur réserve `M-1` du gate**.
> Chaque item est un **constat mesuré**, pas une intention.

- [ ] **SIGN-1 — 🛑 6 branches locales sur 16 n'ont AUCUN upstream configuré (`V5`, re-mesuré).**
      `appflowy-doc-wip`, `docs/successeur-critere-backlog-d10`,
      `feat/correctif-generateur-etat-des-lieux`, `feat/garde-balayante-routage-prod`,
      `specs/cadrage-garde-routage-balayante`, `specs/cadrage-snapshot-defauts` : une ref distante
      homonyme existe, la **configuration** de suivi n'existe pas. Poser leurs upstreams est un
      **geste de dépôt**, pas de fabrication — il appartient au décideur. Piste de fond :
      **`push.autoSetupRemote`** (git ≥ 2.37, `F3`, **non activé par défaut**), qui supprimerait la
      cause au lieu de traiter les 6 cas. *Le signalement de ce lot ne les voit pas — et c'est
      voulu : elles ont bien une copie distante.*
- [ ] **SIGN-2 — 🛑 deux dépôts du chapeau n'ont AUCUNE copie distante de leur `main`** (mesure du
      premier passage réel, 2026-08-17) : **`iaka-demo`** (5 commits, 13 j) et **`iakaCMyPix`**
      (4 commits, 13 j). C'est **exactement la classe d'incident** qui a motivé le lot, trouvée dès
      le premier balayage. Le geste (`git push -u origin main`, ou la décision de ne pas les
      publier) appartient au décideur — le verbe `range` **signale**, il ne pousse rien.
- [ ] **SIGN-3 — l'exclusion « verbe CLI » du § *Périmètre* du lot 1 est démentie par le code
      (`V10`).** `specs/instructions/sauvegarde-portefeuille.md:399` exclut nommément « un verbe
      `iakaframe backup` dans le CLI », alors que `range` **existe** et a été étendu par ce lot.
      L'écart est **consigné, pas maquillé** : corriger une instruction validée par le décideur ne
      relève pas de la fabrication.
- [ ] **SIGN-4 — les compteurs d'en-tête de `docs/commandes.md` sont faux.** Le fichier annonce
      « **29 / 29** verbes distincts, +1 alias = 30 `case` » ; `grep -cE "^\s+case '" cli/src/index.js`
      rend **36**. Ce lot n'a ajouté **qu'une ligne** `range` (périmètre fermé) : le recomptage
      complet + la date de mise à jour sont un lot de doc à part entière, la règle de maintenance du
      fichier exigeant de revérifier **tous** les compteurs dans le même geste.
- [ ] **SIGN-5 — la durée du balayage est à la limite du seuil (`CA-9`, `R2`).** Mesuré sur le
      chapeau réel : **1 793 / 1 818 / 1 830 / 1 883 ms** de balayage (45 dépôts, 68 branches
      examinées), soit ~**2,05 s** au chronomètre en incluant le démarrage de Node. Le seuil
      d'arbitrage de l'instruction est **2 s**. Aucun raccourci n'a été codé : une piste de cache
      (comparer le sha de tête aux refs de suivi avant tout `rev-list`) a été **écartée** parce
      qu'elle rendrait les sabotages du prédicat indétectables. **À arbitrer, jamais à taire.**
      🔁 **Re-mesuré le 2026-08-17 au lot des témoins manquants : 1 943 ms** (45 dépôts, **69**
      branches examinées — une de plus). Le seuil de 2 s est donc **approché de plus près**, sans être
      franchi. Le gate a jugé cette dette **distincte et sans urgence** ; le lot successeur l'a
      **explicitement exclue de son périmètre** (ni cache, ni regroupement d'appels, ni `--branches`
      conditionnel). Pente établie par 🏹 Legolas : **≈ 11 ms par processus git**, croissance
      **linéaire** avec le portefeuille — c'est le nombre de *branches*, pas de dépôts, qui commande.
- [ ] **SIGN-6 — 8 répertoires de premier niveau du chapeau ne sont pas des dépôts git** :
      `brasserie-le-chaudron`, `divers`, `doc`, `iakaframegui-workspace`, `le-chaudron`,
      `le-chaudron2`, `LesPetitsPlats`, `quitapis`. Ils sont **comptés et nommés** dans la sortie
      (jamais avalés), mais **aucune branche n'y est examinée** : rien ne dit si leur contenu est
      répliqué ailleurs. Constat, pas action.
- [ ] **SIGN-7 — le commit `8b2e236` a un corps VIDE, et il ne sera PAS réécrit** (`W13` du lot des
      témoins manquants). Les sept autres commits du lot 2 sont renseignés ; celui-là porte son sujet
      seul. **C'est de l'histoire, et elle est poussée sur `origin`** — jamais de réécriture côté IA.
      La **compensation est faite, pas promise** : le relevé d'exécution appendu à
      `specs/instructions/signalement-branches-sans-copie-distante.md` porte ce que le corps ne
      portait pas. *Item laissé ouvert comme mémoire du défaut, pas comme travail à faire : le seul
      geste possible serait une réécriture d'historique, qui est interdite.*
- [ ] **SIGN-8 — la capture verbatim du témoin négatif de `CA-15` (lot 2) est introuvable au
      dossier.** La chronologie est opposable au reflog (50 s entre la capture possible et le
      `push -u`, 19 min 45 s d'exposition totale, `W14`), mais **aucun corps de commit ne porte la
      sortie** montrant la branche du lot 2 signalée `absente` **avant** son push. Verdict inscrit au
      relevé : **`vert (dégradé)`**, part dégradée **dite**. La règle qui empêche la répétition est
      **gravée** (`DH` : capturer dès que la garde répond, pousser `-u` immédiatement après, plafond
      écrit de 30 min) et **tenue au lot suivant** (exposition mesurée : **9 min 41 s**). *Constat de
      dossier, sans action possible en amont — on ne fabrique pas après coup une sortie qu'on n'a pas
      capturée.*
- [ ] **SIGN-9 — 🛑 une branche à la fois ÉCARTÉE par motif et INDÉTERMINÉE est nommée dans
      `indeterminees`, et NON comptée dans `branchesEcartees`.** La garde `if (n === null)` de `DG` est,
      **comme l'instruction le prescrit**, placée **avant** `classer`
      (`cli/src/lib/branches-locales.js:167`) — donc **avant** `estEcartee`, qui n'intervient qu'après
      le classement. Une branche que le décideur a délibérément écartée réapparaît donc **nommée** dès
      lors que son prédicat n'est pas calculable. **Conforme à l'instruction, mesuré, et non tranché** :
      le cas n'est nommé nulle part dans le cadrage, ⚒️ Gimli l'a **remonté** au lieu de décider à la
      place du décideur, et 🏹 Legolas l'a **reproduit** au gate avec un motif `archive/*` actif —
      comportement exactement celui décrit.
      🪤 **Ce qui rend l'item important, et c'est la seule raison de l'écrire** : il est **inatteignable
      aujourd'hui** — `config/sauvegarde-branches-ignorees.txt` porte **0 motif actif** (vérifié le
      2026-08-17), donc `estEcartee` ne peut jamais mordre — et il devient **atteignable au PREMIER
      motif ajouté**. C'est une porte qui s'ouvre le jour où quelqu'un se sert du point de débrayage,
      c'est-à-dire précisément quand plus personne n'y pensera. **À arbitrer avant le premier motif,
      pas après** : soit l'indéterminée l'emporte (état actuel, « écarter n'est jamais taire » poussé
      jusqu'au bout), soit l'écartement l'emporte (une branche que le décideur a écartée reste muette
      même sans mesure). Aucune des deux n'est évidente — d'où l'arbitrage.
      ⚠️ **Consigné ici parce qu'il ne l'était pas** : ce constat n'a d'abord vécu que dans le message
      de remise de ⚒️ Gimli — **c'est-à-dire exactement le défaut `L-4` que ce lot répare, reproduit
      sur son propre constat**. Relevé par 🏹 Legolas au gate (`M-1`).

- [ ] **SIGN-10 — RQV à co-produire avec 📖 Nathalie à la promotion de version.** Les deux lots du
      signalement des branches (`signalement-branches-sans-copie-distante`, puis
      `temoins-manquants-signalement-branches`) relèvent d'une **version mineure** : la campagne
      complète était due et a été menée. 🏹 Legolas note au gate que la **RQV** reste à produire, et
      qu'elle se co-produit avec 📖 Nathalie — elle n'est ni un état des lieux ni un relevé
      d'exécution. À faire **au moment de la promotion de version**, pas avant.
      ⚠️ **Consigné ici sur la remarque de ⚒️ Gimli, et il avait raison** : cette consigne ne vivait
      que dans un message de conversation d'🔵 Odin — **le support exact que `SIGN-9` vient d'être
      puni d'avoir utilisé**. Il a refusé de se l'octroyer sans commande (l'ordre disait « rien
      d'autre ») et l'a remontée au lieu de la garder : geste juste des deux côtés, l'omission
      était la mienne.

## Fait

### Levés le 2026-09-02 (lot `fix/R2-et-levee-absence-iakaframe`, gate FAIL → re-mesure)

> Ce lot corrigeait R-2 dans `.github/workflows/release.yml` de ce dépôt et levait deux
> déclarations d'absence (E-5) devenues fausses par la **publication réelle de v0.39.0**
> (run CI `33635520511`, `completed`/`success` — première exécution de ce workflow). Le gate
> Legolas a rendu **FAIL** sur un point distinct, net : quatre textes (et un cinquième trouvé au
> balayage élargi) continuaient d'affirmer, **au présent**, que ce workflow n'avait jamais tourné —
> alors que la mesure qui fondait la levée E-5 le réfutait. Cette sous-section **règle 4 : on date,
> on n'efface pas** — chaque item ci-dessous conserve son texte original intégral, avec la preuve
> de clôture ajoutée à la suite.

- [x] **`CI-CLI-JAMAIS-EXECUTE` — la chaîne de publication de la CLI est ÉCRITE, jamais ÉPROUVÉE.**
  *(constat, pas correctif — il ne se lève que par un acte du décideur.)* Mesure anonyme du
  2026-08-29 : `GET /repos/iakasju/iakaframe/actions/runs` → **`total_count: 0`**. Le workflow
  `release` existe (enregistré le **2026-08-05T15:36:53Z**) mais **n'a jamais tourné, pas une
  fois** ; l'unique `.tgz` de `v0.20.4` a pour `uploader.login` **`iakasju`** et date du
  **2026-08-05T15:24:17Z**, soit **douze minutes avant** l'enregistrement du workflow — il a donc
  été **déposé à la main**. Conséquence : le tarball recommandé au visiteur **et** le `make_latest`
  calculé posé par L42 sont **non éprouvés**. Le statut est écrit là où on le lira —
  `.github/workflows/release.yml` (encadré L42) et `cli/scripts/lib/vitrine.js` (constante
  `ARTEFACT`). **Condition de levée** : la première publication réelle, après laquelle
  `actions/runs` sera non nul et l'asset portera `github-actions[bot]`.
  **⚠️ LEVÉE le 2026-09-02 — la condition ci-dessus est REMPLIE, mesurée, pas supposée** : run
  `33635520511` (`completed`/`success`), `GET /repos/iakasju/iakaframe/actions/runs` →
  `total_count: 1` (n'est plus 0), asset `naonedge-iakaframe-0.39.0.tgz` de la release `v0.39.0`
  avec `uploader.login = github-actions[bot]`. Les deux emplacements cités ci-dessus
  (`.github/workflows/release.yml`, `cli/scripts/lib/vitrine.js`) portent chacun une annotation
  datée du 2026-09-02 renvoyant à cette même mesure. *Le lot `fix/R2-et-levee-absence-iakaframe`
  qui a levé cet item est un lot DISTINCT de L42 — le référent de R-2 dans ce même workflow était,
  lui, un défaut de CODE non lié à la publication (cf. § L44 ci-dessus), corrigé dans le même lot
  mais pour une raison indépendante.*



- [x] **Garde `vendor-check` cross-repo (cause racine)** — **LIVRÉE en v0.19.0**, l'item était resté ouvert par inadvertance. La garde est née **rouge 18/21** comme exigé, puis portée au vert **par le vrai canon** (lots v0.20.3/v0.20.4, `a8953f5` + `5a8f811`). *Preuve de clôture, mesurée à la purge : `iakaframe vendor-check` → `OK — 18 copies + 4 dérivées conformes au canon`, exit 0, miroir `~/work/iakaFrameGUI`.* La dérive mutuellement cohérente cross-repo — indétectable depuis v0.17.14, et démontrée par Legolas comme laissant 475/475 tests GUI verts — est désormais détectée.
- [x] **⏰ Remède kit du § 4.5 inopérant** — **TRAITÉ**, et la cause a été traitée à la racine plutôt que le symptôme : le remède n'est plus un **texte constant** mais une **donnée dérivée de la mesure** (`cli/src/commands/vendor-check.js`, fonction pure sans E/S, un geste par dérive constatée ; instruction `remede-vendor-check-derive-de-l-etat.md`), avec une **garde anti-régression** — une raison de dérive ajoutée plus tard sans remède rougit. L'effet de bord attenant est corrigé au passage : `assemble --write` **threade le corps authored** et `--force` est **non destructif** (AC-7 : fichier byte-inchangé). *L'échéance datée « avant le lot de re-vendorage » est honorée — le re-vendorage a eu lieu et le kit ne dérive pas.*
- [x] **Perte du corps markdown au Save de la GUI** — **CORRIGÉ** (dépôt iakaFrameGUI). Le boilerplate deux lignes n'est plus régénéré à chaque Save : `src/forge/useForgeDocument.ts` capture l'origine (`body: verbatimBody(text)`, **byte-parité** — et non `parseFrontmatter().body` qui strippe la ligne blanche de tête) et applique la **règle d'or** documentée `body = origin.body ?? boilerplate` ; le boilerplate ne sert plus qu'aux documents **neufs** (`origin.body == null`). Câblé dans `ForgeShell.tsx` : `serialize: (m, o) => serializeMethodMd(methodToMd(m), o.body ?? methodBody(m), …)`. *Était la vraie perte de fidélité derrière le symptôme du wrapping. Trouvé par Gimli hors instruction le 2026-07-19.*
- [x] **Câbler le `layout` de préservation du wrapping (décision cross-repo)** — **CÂBLÉ**, et au bon moment : la décision de ne pas câbler côté GUI seul (qui aurait fabriqué une divergence GUI≠CLI) a tenu jusqu'à ce que le chantier cross-repo la rende sûre. `useForgeDocument.ts` capture `layout: readListLayout(text)` et `ForgeShell.tsx` le threade (`o.layout ?? undefined`). *Traité **avec** le chantier `vendor-check` cross-repo, comme prescrit — pas isolément.*
- [x] **Fixture `method.iakaframe-wrapped.md` déclarée conforme à tort** — **RÉCONCILIÉE**. *Preuve de clôture, mesurée à la purge : `diff` byte-à-byte entre la fixture GUI et `iakaframe/methods/iakaframe.md` → **identiques**, 22 lignes chacune.* Le corps n'est plus tronqué de 8 lignes et le commentaire du test est à jour (18 ids wrappés sur 4 lignes). *Cette fixture était « une copie déclarée conforme qui a silencieusement divergé de sa source » — exactement la classe de défaut du contrat fantôme de v0.17.14 ; elle est désormais couverte par le vendorage.*
- [x] **Câblage en dur des tools dans `parite-generateurs.test.ts` (dépôt iakaFrameGUI)** — **RÉPARÉ**, et mieux que demandé. Le filet manuel 3-personas-sur-8 est remplacé par une **couverture 8/8 dont l'attendu est tiré du binding vendoré lui-même** (parse direct du frontmatter, chemin distinct de `loadBinding` — les deux côtés partent de la même source par deux routes, sans attendu réécrit à la main), plus une **ancre littérale anti-tautologie** sur `gimli` qui attrape une altération de `loadBinding` qu'un test 100 % dérivé ne verrait pas. *Le cas qui avait motivé l'item — `odin` épinglé sur un état **dérivé** alors que la source portait `Task` — ne peut plus se produire.*
- [x] **Chantier personas — compléter le roster au-delà d'Aragorn** — **SOLDÉ par la phase 1 (v0.18.0)**, les 3 constats sont vérifiés éteints à la purge : (1) **Odin** porte `Task` au binding (`bindings/iakaframe-claude-default.md:8` — `tools: [Read, Grep, Glob, Bash, Task]`), le delegation-guard est actif et l'incohérence CH-1 est levée ; (2) **Gimli** n'est plus le seul agent sans skill — `skills: [iakaframe-fabrication]`, skill **composée** de 3 sous-skills ; (3) le **geste jalon a irrigué tout le roster** — **8 personas sur 8** le mentionnent (Legolas et Aragorn 9, Gimli et Gandalf 8, Odin 7, Nathalie 5, Helm 3, Loki 2), là où le relevé initial comptait 0 mention chez Gimli/Loki/Nathalie/Odin. *Reste que la skill `iakaframe-jalon` n'est pas **déployée** — c'est l'item « dette des skills déployées », pas celui-ci.*
- [x] **Tolérables T1 et T5 de la phase 1** — **T1** (renvoi `§ 6.4` → `§ 6.5`) traité au lot Gimli (`c3d8ca4`), vérifié au gate : le renvoi pointe `§ 6.5`, et le § est barré + scellé (« 🔒 Caduc (levée LG-3) »). **T5** (atténuation non portée) traité au lot Loki (`1cb982f`), **avec réserve consignée** : la règle nommée `charte-defaut-conseil-pro` est réelle et le remplacement localisé effectif, mais **l'instruction n'a jamais été amendée pour T5** — `grep T5 persona-loki-amelioration.md` = 0, aucun critère ne le couvre, et LK-A4 passerait vert si la valeur revenait en cellule. *Traité dans le code, absent du cadrage — vérifié par inspection directe au gate.*

### Antérieurs

- [x] **Épuration des dettes mécaniques (3/3)** — (1) **scories Slack** : `README.md:173`, `library/skills/README.md:24` et `:168`, `iakaframe-skills.html:113`, + les 2 lignes de **prose** de `methode-de-travail.html` (`:755`, `:802`) après arbitrage option (c) du décideur ; distinction tenue — « n8n/Hermes » comme **outil de dispatch** intact, seul « Slack » comme **canal de communication** purgé. (2) **`docs/commandes.md`** : compte exact rétabli — **29 verbes distincts + 1 alias (`use`→`switch`) = 30 `case`** ; `consolidate`, `portfolio` et `observe` documentés ; clause de maintenance ajoutée (`:31-34`). (3) **`serializeMethodMd`** (GUI) : capacité de préservation du wrapping livrée et testée, **comportement par défaut inchangé** et **câblage délibérément différé** *(depuis câblé — voir ci-dessus)*. Gate Legolas **PASS** (345 tests CLI, 480 GUI, typecheck + lint clean, parité 8/8 et 17/17 intactes).
- [x] **Audit + amélioration d'Aragorn (v0.17.14)** — audit à 7 dimensions (Gandalf) puis exécution : QW-1/2 purge de la scorie Slack → canal iakaHub↔Discord ; QW-3/4 geste `iakaframe jalon` + obligation d'estimation dev au jalon P1→P2 ; **CH-1** arbitrage décideur option A = `Task` accordé ; **CH-3** `Write` borné aux artefacts de pilotage (`specs/PROJET.md`), jamais de code ; **CH-2** sous-skill partagé `iakaframe-jalon` (Aragorn + Gandalf) ; **CH-4** garde anti-auto-cast **différée** par arbitrage. Gate Legolas **FAIL puis PASS** : détection d'un **contrat fantôme** côté `iakaFrameGUI` (`Task` sans `Write`, mutuellement cohérent, sha-valide, 475 tests verts) → re-vendorage des 17 fixtures, commité en miroir (`3fc4c7d` / `8b3e63c`). *(instruction `specs/instructions/audit-amelioration-aragorn.md`.)*
- [x] **Anonymiser les URL Forgejo dans les kits sources (3/3 occurrences)** — `sjupin`→`<user>` dans `kits/iakaframe-openwebui/functions/iakaframe_identity_filter.py` (#3, `82c7fec`) puis, après **levée du régime §4 par arbitrage décideur**, dans `kits/iakaframe-claude/CLAUDE.md:60` et `kits/iakaframe-claude/global/CLAUDE.md:73` (#1/#2, `5acdbd0`). Host/IP conservé. `grep sjupin kits/` = 0. Gates Legolas **PASS**.
- [x] **Réconcilier la forme de `services.json` (CLI ↔ ps1)** — `iakaframe-services.ps1` émet l'enveloppe C-JSON `{ ok, generated, count, services }`. Verrous Node V1 (forme fichier CLI `--out`) + V2 (garde statique du source ps1). Commit `515fe05`, gate Legolas **PASS**. *Runtime ps1 réel = gate humain différé (pas de `pwsh` sur la machine).*
- [x] **Travailler la structure API & commandes du CLI** — surface `--json` harmonisée autour de la convention **C-JSON** (racine objet, `ok` en tête, collections pluriel + `count`, erreurs `{ok:false,error}` sur stdout + exit 1). Source unique `cli/src/lib/output.js`, garde anti-dérive. 3 ruptures assumées (`list`, `assemble`, `services`). Commits `1356c2e`/`a8ec920`/`938ff91`, gate Legolas **PASS**.
- [x] **Nettoyer un chemin machine en dur** — `perimeter-guard.mjs` L186 + `README.md` L4 généralisés en formes génériques, iso-comportement. Commit `01fa061`, gate Legolas **PASS**.
