# NOTE D'AUDIT — Skills à deux étages (geste agnostique / adaptateur de fournisseur)

> **Ceci est une NOTE D'AUDIT, pas une instruction d'exécution.** Elle **classe** l'existant et
> **propose** une carte cible ; elle ne prescrit ni code, ni renommage, ni gate P1→P2. Les décisions
> de restructuration reviennent au décideur (§ 9). Cadrage P1 (🧙 Gandalf), **lecture seule**.
>
> **Elle COMPLÈTE, ne refait pas** : le canon porte déjà `specs/instructions/modele-skills-agnostique-couches.md`
> (modèle à 3 couches **capacité / famille / produit**, validé et **partiellement exécuté**) et le lot
> en cours `specs/instructions/verbe-forgejo-et-doc-methode.md` (le verbe CLI `forgejo` = première
> surface d'adaptateur matérialisée). Le présent audit **mesure l'état d'application** de ce modèle,
> repère la **faute résiduelle** et distingue le renommage du restructuring — il ne réénonce pas le
> modèle.

## Outillage du cadreur (déclaration)

**`Bash` INDISPONIBLE.** Audit mené avec `Read` / `Grep` / `Glob` uniquement. **Aucune commande n'a
été exécutée** (ni `git`, ni `node --test`, ni `iakaframe`). Toutes les affirmations ci-dessous sont
des **constats de lecture**, traçables au `chemin:ligne`. Les 24 skills ont été lues **frontmatter ET
corps** (échantillon), pas seulement l'id. **Périmètre couvert** : les 24 skills **+** les verbes CLI
**+** les *type tools* du binding (`vocab.toolKinds`) **+** les points MCP (`connectors`/`toolKinds`) —
cf. §1.1 et §3bis. **Web** : aucune décision de cet audit ne dépend d'un fait externe (versions /
compatibilité) — le sujet est 100 % interne à la taxonomie du dépôt ; pas de vérification web requise.

---

## 0. Le principe et sa traduction dans le canon existant

**Principe du décideur (2026-07-22, verbatim)** : « les skills sont sur des actes agnostiques "push"
"commit" sans dire sur quel logiciel. en dessous on definit un skill forgejo qui sera le parallele du
skill gitlab ou github. »

**Deux étages** : **GESTE** (agnostique, nommé par l'acte) au-dessus, **ADAPTATEUR** (fournisseur,
nom d'outil légitime) en dessous.

**Mapping avec le modèle déjà en place** : les « deux étages » du décideur = le modèle en couches
déjà livré, où l'étage **geste** se subdivise lui-même en **capacité** (100 % agnostique) et,
optionnellement, **famille** (protocole — `git` — sans serveur), et où l'étage **adaptateur** = la
couche **produit** (`forgejo`, `docker`, `appflowy-doc`). Le champ `layer: capacity|family|product`
est **déjà** au frontmatter des skills concernées. **La cible du décideur n'est donc pas à
construire : elle est à ~80 % construite.** L'audit mesure les 20 % restants.

---

## 1. Table de classement des 24 skills (A / B / C)

**Légende** — **A** : geste agnostique (nommé par l'acte/la capacité) · **B** : adaptateur de
fournisseur (nom d'outil légitime, couche produit) · **C** : faute (nom d'outil/marque/persona à
l'étage geste, OU id agnostique masquant un contenu qui baque un outil sans point d'extension).

| # | Skill | `layer:` | Classe | Motif |
|---|---|---|---|---|
| 1 | `iakaframe-gestion-de-source` | capacity | **A** | capacité, corps sans produit, délègue à la famille |
| 2 | `iakaframe-git` | family | **A** | famille : nomme le **protocole** git (légitime), jamais un serveur |
| 3 | `iakaframe-conteneurisation` | capacity | **A** | capacité, « conteneur » légitime, aucun moteur nommé |
| 4 | `iakaframe-memoire-humaine` | capacity | **A** | capacité, corps agnostique, délègue au produit |
| 5 | `iakaframe-journal-conversation` | capacity | **A** | capacité, aucun protocole/serveur nommé |
| 6 | `iakaframe-fabrication` | capacity | **A** | capacité **composée** (subskills gestion-de-source/conteneurisation/jalon), ne redécrit rien |
| 7 | `iakaframe-cadrage` | — | **A** | geste (cadrer un besoin) |
| 8 | `iakaframe-qualite` | — | **A** | geste (gate qualité) |
| 9 | `iakaframe-deploiement` | — | **A** | geste (promotion prod). Techno de dashboard laissée libre (« Grafana, Prometheus, ou simple page ») = point d'extension **présent** |
| 10 | `iakaframe-jalon` | — | **A** | geste (poser un gate). Nomme le CLI `iakaframe jalon` = son propre outil, pas un tiers |
| 11 | `iakaframe-etat-des-lieux` | — | **A** | geste. Invoque `git log` (binaire universel, pas un serveur) — tranché « reste capacité » (modèle §2.3) |
| 12 | `iakaframe-init` | — | **A** | orchestrateur ; `subskills:[gestion-de-source, etat-des-lieux]` = **capacités** (déjà migré) |
| 13 | `iakaframe-update` | — | **A** | orchestrateur ; `subskills:[etat-des-lieux, gestion-de-source]` = **capacités** (déjà migré) |
| 14 | `iakaframe-learning` | — | **A** | geste (surface `/learning`), pilote `iakaframe review` |
| 15 | `iakaframe-retrait` | — | **A** | geste (surface `/retrait`), pilote `detach/attach/remove` |
| 16 | `iakastart` | — | **A** | geste (bootstrap team) |
| 17 | `iakaframe-forgejo` | product | **B** | adaptateur Forgejo (URL, API, `$FORGEJO_TOKEN`) — nom d'outil **légitime** en couche produit |
| 18 | `iakaframe-docker` | product | **B** | adaptateur Docker (docker-compose, préfixes) — légitime en produit |
| 19 | `iakaframe-appflowy-doc` | product | **B** | adaptateur AppFlowy (gotrue, page-view API) — légitime en produit |
| 20 | `iakaframe-log-conversation` | product | **B–** | adaptateur MQTT+CouchDB **correct** dans le corps, MAIS l'**id ne nomme pas son outil** et « log » est quasi-synonyme de la capacité « journal » → collision de nommage (§3) |
| 21 | `iakaframe-naonedge` | product | **C** | **MARQUE** (`naonedge`) à l'étage **geste/rôle** ; `layer:product` **mais aucune capacité parente** ; référencée **en direct** par `loki.md`. **Faute nette** (§4) |
| 22 | `iakaframe-aragorn` | — | **C-bis** | id = **nom de persona** (Tolkien), pas l'acte. Le geste est « coordination » |
| 23 | `iakaframe-odin` | — | **C-bis** | id = **nom de persona**. Le geste est « portefeuille » |
| 24 | `iakaframe-nathalie` | — | **C-bis** | id = **nom de persona**. Le geste est « documentation / guides » |

**Compte** : **16 A** · **3 B** (+ 1 « B– » naming) · **1 C nette** · **3 C-bis** (axe persona,
distinct de l'axe outil — voir §4.2).

> **Note sur la couche `family`.** `iakaframe-git` (#2) est la seule famille. Le mot **git** y est
> légitime (c'est un **protocole**, pas un serveur/produit) — le modèle l'a explicitement tranché
> (`modele-skills-agnostique-couches.md` §2.4, §9). Ne pas le lire comme une faute.

### 1.1 Verbes CLI — classement

Les **33 verbes** de `cli/src/index.js:141-178` (`onboard`, `init`, `snapshot`, `update`, `services`,
`config`, `agents`, `go`, `banner`, `brief`, `recap`, `jalon`, `list`, `show`, `add`, `remove`,
`attach`, `detach`, `assemble`, `vendor-check`, `frame`, `switch`/`use`, `memory`, `produit`, `open`,
`recall`, `close`, `review`, `consolidate`, `observe`, `portfolio`, `root`) sont **tous des gestes
agnostiques (classe A)** : aucun ne nomme un logiciel tiers. `services` **sonde** Forgejo/Ollama/ComfyUI
mais est **nommé par l'acte** (« sonder les services ») — correct.

**Le seul verbe à nom d'outil est `forgejo`, en cours d'ajout** (`verbe-forgejo-et-doc-methode.md`,
non encore câblé — `index.js` n'a aucun `case 'forgejo'`). Ce n'est **pas une faute** : c'est la
**surface d'adaptateur** au niveau CLI, exact pendant du futur `gitlab`/`github`. **Cohérent avec la
carte cible** — le lot en cours matérialise le premier adaptateur, à l'étage où le nom d'outil est
légitime. Rien à corriger côté CLI.

---

## 2. Les doublons apparents — démêlés (hiérarchie saine, PAS redondance)

Chaque paire signalée au brief est une **hiérarchie à deux étages saine**, **pas** une redondance à
fusionner. Mesuré ci-dessous, contenu réel à l'appui :

| Domaine | Geste (étage haut) | Adaptateur (étage bas) | Verdict |
|---|---|---|---|
| **Versionnement** | `gestion-de-source` (capacité) → `git` (famille) | `forgejo` (produit) | **Hiérarchie saine à 3 couches, VIVANTE.** La chaîne résout (`subskills` chaînés), `layer:` posé partout, corps de la capacité sans produit. Les « 3 skills » **sont** capacité/famille/produit voulus. **Rien à jeter.** |
| **Conteneurisation** | `conteneurisation` (capacité) | `docker` (produit) | **Hiérarchie saine à 2 couches.** Famille (OCI/compose) volontairement différée. La capacité porte la convention agnostique (isolation par projet, ports décalés) ; le produit porte le `docker-compose`. **Pas redondant.** |
| **Mémoire humaine** | `memoire-humaine` (capacité) | `appflowy-doc` (produit) | **Hiérarchie saine.** `nathalie.md` référence **la capacité** (agnostique), le produit AppFlowy est appelé via elle. **Pas redondant.** |
| **Journal / log** | `journal-conversation` (capacité) | `log-conversation` (produit MQTT+CouchDB) | **Hiérarchie saine MAIS collision de nommage** : « journal » ≈ « log » (synonymes) fait *paraître* les deux skills redondantes alors qu'elles sont à deux étages différents. Le produit **devrait nommer son outil** (§3). |
| **Fabrication** | `fabrication` (capacité composée) | *(délègue à source/conteneur/jalon)* | **Déjà agnostique et bien composée.** Coiffe la conduite d'exécution, délègue tout le concret. **Modèle du genre — ne pas toucher.** |

**Conclusion doublons** : **aucune redondance à fusionner**. Ce que le brief lisait comme « doublon
geste/outil » est la **structure voulue**. Le seul défaut de doublon est **un nom** (journal/log), pas
une duplication de fonction.

---

## 3. Carte cible à deux étages, domaine par domaine

Presque tout est **déjà construit**. Le tableau distingue ce qui est **livré** de ce qui **reste**.

| Domaine | GESTE (agnostique) | ADAPTATEUR(S) — présent(s) | ADAPTATEUR(S) futurs (place réservée) | État |
|---|---|---|---|---|
| Versionnement | `gestion-de-source` → `git` | **`forgejo`** ✅ | `github`, `gitlab` (non codés — MVP) | **LIVRÉ** |
| Conteneurisation | `conteneurisation` | **`docker`** ✅ | `podman` | **LIVRÉ** |
| Mémoire humaine | `memoire-humaine` | **`appflowy-doc`** ✅ | autre outil de doc | **LIVRÉ** |
| Journal conversation | `journal-conversation` | **`log-conversation`** (MQTT+CouchDB) ✅ | autre transport | **LIVRÉ, id à revoir** |
| **Design** | **`iakaframe-design`** *(cible)* | les chartes sont de la **donnée** (`design-*/`, dont `design-naonedge/`), **pas** un skill produit (patron B) | *(pas d'adaptateur-skill — patron B)* | **FAUTE : geste nommé par marque (`naonedge`)** — §4 |

**Symétrie `+/−`** : la carte livrée est **additive** — ajouter `github` demain = déposer un skill
`iakaframe-github` sous `git.subskills`, **sans réécrire** la capacité (présence = sélection à
l'install, cf. modèle §3.4). L'exigence du décideur (« parallèle de gitlab/github ») est **satisfaite
par construction**.

**Point d'attention sur-ingénierie (à ne PAS forcer)** : Docker est quasi-générique et seul fournisseur
réel ; la couche capacité `conteneurisation` se justifie **uniquement** parce qu'elle isole la
**convention iakaframe** (isolation par projet, ports décalés) du moteur — pas pour préparer un
hypothétique podman. **Ne pas créer de famille OCI ni de second adaptateur tant qu'il n'y a pas de
besoin réel.** Idem : ne pas inventer d'adaptateurs `github`/`gitlab` maintenant (MVP).

---

## 3bis. Le SUBSTRAT de l'adaptateur (lib / shell / MCP) — et les *type tools*

> Précision du décideur (2026-07-22) : **l'étage adaptateur est agnostique de son substrat.** Un
> adaptateur peut s'appuyer sur (a) une **lib locale**, (b) une **commande shell**, ou (c) un
> **serveur MCP**. Cet axe est **orthogonal** aux deux étages geste/adaptateur : il ne rajoute pas
> un troisième étage, il décrit **comment** l'adaptateur touche l'outil.

### 3bis.1 Le substrat des adaptateurs existants (mesuré)

Les adaptateurs (couche produit) déjà livrés utilisent **deux** des trois substrats — le **MCP n'est
pas encore employé par une skill** :

| Adaptateur | Substrat réel | Preuve |
|---|---|---|
| `iakaframe-forgejo` | **shell** (curl) + **lib** (`cli/src/lib/forgejo.js`) | `iakaframe-forgejo/SKILL.md:29-52` (curl), lib appelée par onboard |
| `iakaframe-docker` | **shell** (docker CLI) | `iakaframe-docker/SKILL.md:31-55` |
| `iakaframe-appflowy-doc` | **lib** (`appflowy-doc.mjs`, `fetch` natif) | `iakaframe-appflowy-doc/SKILL.md:17,77-91` |
| `iakaframe-log-conversation` | **lib** (`iakalog.mjs`, MQTT/TCP) | `iakaframe-log-conversation/SKILL.md:15,40-42` |

**Constat** : le principe « l'adaptateur porte le concret » est déjà tenu **indépendamment du
substrat** (lib OU shell). Le geste au-dessus (`gestion-de-source`, `memoire-humaine`…) **ne présume
jamais** le substrat — il délègue « le comment concret » sans dire lib/shell/MCP. **La cible du
décideur est donc déjà respectée sur cet axe** : un futur `github` pourrait être **MCP-backed** (un
serveur) plutôt qu'un `lib/github.js`, **sans toucher** la capacité `gestion-de-source`.

### 3bis.2 L'étage MCP est DÉJÀ amorcé — dans un AUTRE plan (le binding), pas dans les skills

**Aucune skill ne pointe vers un MCP** (vérifié : `grep connectors|mcp|comfyui` sur `library/skills/`
= 0, hormis un faux positif « web »/« serveur » dans docker). Le MCP vit dans un **plan distinct des
skills — le binding**, où il est **amorcé mais volontairement différé** :

- **`vocab.toolKinds = ['comfyui-local']`** (`cli/src/lib/vocab.js:28`) — registre d'**ids d'outils
  attachables à un persona** (`Binding.tools`), commenté « **type MCP / serveur d'outils** ».
- **`Team.connectors: string[]`** (`parite-enforcement-multirunner.md:113`) — **ids de serveurs MCP**
  au niveau **team**.
- **Décision de canon** : `tools` (par persona) **≠** `connectors` (par team, MCP) = **deux axes
  distincts, sans couplage au MVP**, pas de génération `.mcp.json` par persona (différé) —
  `bindings/iakaframe-claude-default.md:27`, `parite-enforcement-multirunner.md:343-346`.

> **Directive du décideur respectée : NE PAS proposer une seconde couche.** L'étage adaptateur-MCP
> **existe déjà** (`toolKinds`/`connectors`). Les skills s'y **articulent** ainsi : un geste (skill)
> dispatche vers un adaptateur **par contrat**, et cet adaptateur peut *être* un serveur MCP déclaré
> côté `connectors`/`toolKinds`, plutôt qu'un skill-produit à substrat lib/shell. **La
> matérialisation** de ce pont skill↔MCP (attacher un serveur, générer `.mcp.json`) est un **lot
> futur explicitement différé** — **hors périmètre de cet audit**, qui se contente de le **cartographier**.

### 3bis.3 Classement du *type tool* `comfyui-local`

| Élément | Plan | Nommage | Classe | Motif |
|---|---|---|---|---|
| `comfyui-local` (`vocab.toolKinds`) | binding (tools/MCP), **pas** skills | **produit** (`comfyui`) + substrat (`-local`) | **B (adaptateur)** — **pas** une faute | À l'étage adaptateur, nommer par l'outil est **légitime** (comme `forgejo`/`docker` en produit). |

Deux nuances, **mineures**, à signaler sans les sur-traiter :

1. **Pas de geste agnostique au-dessus** dans le plan tools (pas de capacité « génération d'image »
   → `comfyui`). **Acceptable au MVP** (un seul toolKind — créer une capacité pour un unique
   fournisseur serait de la sur-ingénierie). À réserver **si** le catalogue de toolKinds grandit.
2. **Le substrat est baké dans l'id** (`-local`). Or le substrat devrait être une **propriété**, pas
   une syllabe du nom — même remarque que `log-conversation` (§3). Cosmétique.

**Built-ins Claude (`tools: [Read, Grep, Glob, Bash, Write, Edit, WebSearch, WebFetch]`)** : ce sont
les **capacités propres du runner**, **agnostiques du fournisseur** — **ni geste métier, ni
adaptateur** de la taxonomie. **Hors classement A/B/C.** Mais l'audit **confirme l'INC2 déjà
documentée** (`modele-composition-tools-sousskills.md:109-112`) : le champ `tools` **confond** ces
built-ins runner et les `toolKinds` MCP (`comfyui-local`) dans un **seul namespace ambigu**. Ce n'est
pas une faute d'agnosticisme d'outil mais une **faute d'étage/namespace** — déjà tracée, à trancher au
lot binding, **pas ici**.

---

## 4. La faute nette : `iakaframe-naonedge`

### 4.1 Le diagnostic (mesuré)

`iakaframe-naonedge/SKILL.md:1-6` porte `id: iakaframe-naonedge`, `layer: product` — **mais** :

1. **Marque au niveau geste/rôle.** C'est le **skill de rôle de Loki** (le geste « design »), or son id
   est une **marque** (`naonedge`). Comparaison interne accablante : les autres gestes de rôle sont
   nommés par l'acte — `cadrage` (pas `gandalf`), `qualite` (pas `legolas`), `deploiement` (pas
   `helm`), `fabrication` (pas `gimli`). `naonedge` **détonne**.
2. **`layer: product` est un mislabel.** Un produit est la **feuille d'une capacité parente** ; or
   **aucune capacité `iakaframe-design` n'existe** et **aucune skill ne référence `naonedge` en
   `subskills`**. `loki.md:8` fait `skills: [iakaframe-naonedge]` — il l'invoque **comme skill de rôle
   direct**, pas comme produit d'une chaîne. Le `layer:product` ne correspond à **aucune structure**.
3. **Le vocabulaire de rôle est DÉJÀ agnostique** : `roleKey` = **`design`** partout
   (`vocabulaire-roles-agnostique.md:25-27` : personas + roles + method accordés 8/8, la clé est
   `design`). Seul l'**id du skill** est resté sur la marque. L'incohérence est **interne au canon**.

### 4.2 La cible et la tension à arbitrer

**Cible** : `iakaframe-design` (geste, `layer: capacity`), qui **résout la charte au runtime** depuis
le catalogue de **données** `design-*/`. La marque `NaonEdge` **reste légitime** là où elle vit déjà :
le **dossier de données** `design-naonedge/`. C'est le **patron B** (catalogue de données), qui est
**correct et conservé** — on ne le transforme pas en chaîne de sous-skills.

**Tension à trancher (décideur).** Le canon porte une décision **antérieure** contraire :
`library/skills/README.md:134-138` et `modele-skills-agnostique-couches.md §10` disent explicitement
« **Design = patron B, non migré. On ne crée pas de capacité `iakaframe-design`, on ne renomme pas
`iakaframe-naonedge`.** » Cette décision (2026-07-19) visait à **ne pas forcer la chaîne leaf-swap**
sur de la donnée — ce qui reste juste. **Mais elle a conflé deux axes distincts** :

- **Axe A — structure** : faut-il une chaîne capacité→produit pour le design ? **Non** (patron B, donnée). ✅ décision antérieure correcte.
- **Axe B — nommage** : l'**id du geste** doit-il être l'acte (`design`) et non la marque (`naonedge`) ? **Le principe du 2026-07-22 dit OUI**, indépendamment de l'axe A.

**Recommandation Gandalf** : **renommer `iakaframe-naonedge` → `iakaframe-design`** (axe B), **tout en
conservant le patron B** (axe A — charts = données, pas de sous-skill). Les deux décisions ne se
contredisent pas une fois les axes séparés. C'est un **renommage**, pas un restructuring.

### 4.3 Les persona-nommées `aragorn` / `odin` / `nathalie` (C-bis — axe distinct, priorité basse)

Même axe de nommage que naonedge, mais **persona** au lieu de marque : `iakaframe-aragorn` (geste =
coordination), `iakaframe-odin` (portefeuille), `iakaframe-nathalie` (documentation). Le `roleKey`
correspondant est **déjà agnostique** (`coordination`, `portefeuille`, `documentation`) ; seul l'id de
skill suit encore le persona. **Ce n'est pas une fuite d'outil tiers** — c'est une incohérence de
nommage interne, **moins urgente** que naonedge (qui, lui, est une **marque commerciale**). À traiter
en **lot séparé** si le décideur veut l'homogénéité complète — voir coûts §6.

---

## 5. Ce qui est DÉJÀ BON (ne pas inventer de travail)

- **Les 16 gestes agnostiques (classe A)** : rien à changer.
- **Les 3 adaptateurs `forgejo` / `docker` / `appflowy-doc`** : correctement nommés par leur outil **à
  la couche produit** — c'est leur raison d'être, **pas** un bug (modèle §3, règle cardinale 2).
- **Les 3 hiérarchies vivantes** (source-control, conteneurisation, mémoire humaine) : `layer:` posé,
  `subskills` chaînés, corps de capacité sans produit. **Le modèle à deux étages est appliqué.**
- **`fabrication`** : capacité composée exemplaire (délègue, ne redécrit rien).
- **Tous les verbes CLI** + le verbe `forgejo` en cours (adaptateur légitime).
- **La documentation du modèle** : `library/skills/README.md:44-150` documente déjà les couches et le
  champ `layer:`. **Ne pas la refaire** — juste la corriger si naonedge est renommé.
- **L'axe substrat (lib/shell/MCP) et le plan tools/connectors** : déjà **amorcés et tranchés** au
  canon (`toolKinds`/`connectors`, deux axes distincts, MCP différé). **Ne pas dupliquer** ni ajouter
  une couche — les futurs adaptateurs (dont MCP) s'y branchent (§3bis).

---

## 6. Renommage vs RESTRUCTURING — et coûts (dont vendorage)

**Aucun cas de cet audit n'exige un split ou un merge de skill.** Tout est **renommage** (marque/persona
→ geste). Le restructuring de fond (créer capacité/famille, chaîner `subskills`, migrer init/update) a
**déjà été fait** par le lot `modele-skills-agnostique-couches`. Restent des **renommages**, de coûts
inégaux à cause du **vendorage indirect**.

**Rappel vendorage (mesuré)** : `cli/src/lib/vendor.js:76-114` — les 21 fixtures vendorées dans
iakaFrameGUI sont **8 personas + 8 goldens d'agents + 1 binding + method + method-wrapped + team + kit**.
**Aucun `SKILL.md` n'est vendoré** → renommer un skill **ne touche pas** directement une fixture. **MAIS**
un skill référencé dans le `skills:[]` d'une **persona** propage le renommage à cette persona — **et les
personas + goldens SONT vendorés byte-à-byte**. C'est **là** que la dette D-9 (coordination deux dépôts)
se rouvre.

| Renommage | Nature | Effets de bord | Vendorage (D-9) | Coût |
|---|---|---|---|---|
| **`naonedge` → `design`** | renommage (patron B conservé) | dossier skill + frontmatter ; `loki.md:8` `skills:[…]` ; golden `cli/test/fixtures/agents-golden/loki.md` ; `README.md:28`, `equipe-agents.md:113`, `loki.md` persona §17 ; corps naonedge (refs marque → restent légitimes car décrivent la charte-donnée) | **OUI** : `loki.md` persona **et** golden loki vendorés → **2 fixtures GUI à resynchroniser** (commit coordonné deux dépôts) | **MOYEN** |
| **`log-conversation` → `mqtt-couchdb`** (option §3) | renommage | dossier + frontmatter ; `journal-conversation.subskills:[…]` ; `README.md` | **NON** : aucune persona ne le référence, pas dans les fixtures | **FAIBLE** |
| **`aragorn` → `coordination`** | renommage | dossier + frontmatter ; `aragorn.md:8` ; golden aragorn ; README | **OUI** : persona + golden vendorés | **MOYEN** |
| **`odin` → `portefeuille`** | renommage | dossier + frontmatter ; `odin.md:8` (`[iakaframe-odin, iakastart]`) ; golden odin ; README | **OUI** : persona + golden vendorés | **MOYEN** |
| **`nathalie` → `documentation`** | renommage | dossier + frontmatter ; `nathalie.md:8` (`[iakaframe-nathalie, iakaframe-memoire-humaine]`) ; golden nathalie ; README | **OUI** : persona + golden vendorés | **MOYEN** |

> **Précision D-9** : le renommage d'un skill n'entre dans une fixture **que** par la médiation d'une
> persona/golden qui le cite. C'est le cas de **naonedge** (via `loki`) et des trois persona-skills.
> Le renommage `log-conversation` est le **seul sans coût de vendorage**. Toute resynchro de fixture
> exige un **commit coordonné dans iakaFrameGUI** (sinon `vendor-check` FAIL) — geste à ordonnancer,
> pas à improviser.

---

## 7. Priorisation (l'essentiel d'abord)

1. **FAUTE NETTE À CORRIGER — `iakaframe-naonedge` → `iakaframe-design`.** Seule **marque commerciale**
   à l'étage geste ; `layer:product` sans parent ; référencée en direct par une persona. C'est le
   cœur exact du principe du décideur. Coût moyen (vendorage loki). **Priorité 1.**
2. **COSMÉTIQUE / cohérence (faible valeur, à grouper) :**
   - `log-conversation` → un id qui nomme son outil (lève la collision journal/log) — coût faible, **aucun** vendorage.
   - `comfyui-local` → substrat (`-local`) baké dans l'id ; **INC2** (`tools` confond built-ins runner et toolKinds MCP) — déjà tracée, à trancher **au lot binding**, pas ici.
   - `aragorn`/`odin`/`nathalie` → aligner les ids sur les role-keys agnostiques (`coordination`/`portefeuille`/`documentation`). Axe **persona**, distinct de l'axe outil ; role-keys **déjà** agnostiques ; coût moyen (vendorage ×3). **Lot séparé.**
3. **DÉJÀ BON — ne rien changer :** les 16 gestes, les 3 adaptateurs produits, les 3 chaînes vivantes,
   `fabrication`, les verbes CLI, le verbe `forgejo` en cours, la doc du modèle, **l'axe substrat +
   le plan MCP `toolKinds`/`connectors` (amorcé, différé — ne pas dupliquer)**.

**Volume — tient en une note.** L'élargissement aux *type tools*/MCP **n'exige pas** de découper
l'audit : le plan MCP est **amorcé et différé** au canon (je le **cartographie**, je ne le cadre pas),
et il ne produit **qu'un** classement (`comfyui-local` = adaptateur légitime) + **une** confirmation
(INC2, déjà tracée). Si le décideur décide de **matérialiser** le pont skill↔MCP (attacher un serveur,
`.mcp.json`), **ce sera un lot dédié** — distinct de la correction naonedge (priorité 1).

---

## 8. Cohérence avec le lot `verbe-forgejo-et-doc-methode` (en cours)

Cet audit **confirme et n'empiète pas**. Le verbe CLI `forgejo` du lot en cours **est** la première
**surface d'adaptateur matérialisée** de la carte §3, à l'étage CLI où le nom d'outil est légitime.
L'audit recommande de **le laisser tel quel** et, le jour où `gitlab`/`github` seront un besoin réel
(hors MVP), de suivre **le même patron** (un verbe/adaptateur par fournisseur, geste agnostique
au-dessus). **Point de vigilance mineur** : le corps de `iakaframe-forgejo/SKILL.md:74-77` affirme
encore « Il n'existe pas de verbe `iakaframe forgejo` » — cette phrase deviendra **fausse** au merge du
lot en cours ; à rectifier **dans ce lot-là**, pas ici (hors périmètre du présent audit).

---

## 9. Ce que je laisse au décideur (Gandalf propose, le décideur tranche)

1. **Renommer `naonedge` → `design` ?** Cela **rouvre** la décision antérieure « ne pas renommer »
   (`README.md:134-138`). Recommandation : **oui**, en séparant l'axe **structure** (patron B conservé,
   charts = données) de l'axe **nommage** (id = geste). Le décideur arbitre la réconciliation des deux
   décisions (2026-07-19 « ne pas renommer » vs 2026-07-22 « geste nommé par l'acte »).
2. **Renommer les 3 persona-skills** (`aragorn`/`odin`/`nathalie` → role-keys) **ou** les garder ?
   C'est l'axe **persona**, pas l'axe outil du principe. Faible urgence, coût vendorage ×3.
   Recommandation : **lot séparé**, après naonedge, si l'homogénéité totale est souhaitée.
3. **`log-conversation`** : nommer son outil (`mqtt-couchdb`) **ou** laisser (composite deux outils,
   faible valeur) ? Recommandation : **différer** (priorité basse, aucun risque).
4. **Confirmer qu'aucun adaptateur `github`/`gitlab`/`podman` n'est codé** (MVP) — la carte réserve la
   place, on ne laboure pas.
5. **Ordonnancement vendorage** : tout renommage touchant une persona/golden **doit** être livré en
   **commit coordonné** avec iakaFrameGUI (sinon `vendor-check` FAIL). Le décideur décide **quand** on
   ouvre cette coordination.
6. **Substrat MCP (§3bis)** : confirmer que le futur `github`/`gitlab` **peut être MCP-backed**
   (serveur `connectors`/`toolKind`) **plutôt** qu'un `lib/<provider>.js`, le geste restant agnostique
   du substrat. Et **quand** matérialiser le pont skill↔MCP (aujourd'hui différé) — **lot dédié**, pas
   cet audit. L'INC2 (`tools` confond built-ins runner et toolKinds MCP) se tranche **au lot binding**.

---

## 10. Fichiers vérifiés (chemin:ligne)

- Chaînes vivantes (déjà à deux étages) : `library/skills/iakaframe-gestion-de-source/SKILL.md:5-6`,
  `iakaframe-git/SKILL.md:5-6`, `iakaframe-forgejo/SKILL.md:5`, `iakaframe-conteneurisation/SKILL.md:5-6`,
  `iakaframe-docker/SKILL.md:5`, `iakaframe-memoire-humaine/SKILL.md:5-6`, `iakaframe-appflowy-doc/SKILL.md:5`,
  `iakaframe-journal-conversation/SKILL.md:5-6`, `iakaframe-log-conversation/SKILL.md:5`.
- Faute nette : `library/skills/iakaframe-naonedge/SKILL.md:1-6` (id marque, `layer:product` sans parent),
  `library/personas/loki.md:8` (`skills:[iakaframe-naonedge]`), `cli/test/fixtures/agents-golden/loki.md:17`.
- Persona-skills (C-bis) : `library/personas/aragorn.md:8`, `library/personas/odin.md:8`,
  `library/personas/nathalie.md:8` ; role-keys agnostiques : `vocabulaire-roles-agnostique.md:25-27`.
- Fabrication composée : `library/skills/iakaframe-fabrication/SKILL.md:5-6,42-54`.
- Vendorage (aucun SKILL.md ; personas/goldens vendorés) : `cli/src/lib/vendor.js:28-33,76-114`.
- CLI (verbes agnostiques ; pas de `case 'forgejo'`) : `cli/src/index.js:141-178`.
- Substrat / MCP (plan tools/connectors, amorcé, différé) : `cli/src/lib/vocab.js:25-28`
  (`TOOL_KINDS=['comfyui-local']`), `bindings/iakaframe-claude-default.md:8-15,24-27`,
  `specs/instructions/parite-enforcement-multirunner.md:113,343-346`,
  `specs/instructions/modele-composition-tools-sousskills.md:109-112,168-170,346` (INC2 + différé).
- Substrat des adaptateurs vivants : `iakaframe-forgejo/SKILL.md:29-52` (shell), `iakaframe-docker/SKILL.md:31-55` (shell),
  `iakaframe-appflowy-doc/SKILL.md:17,77-91` (lib), `iakaframe-log-conversation/SKILL.md:15,40-42` (lib).
- Doc du modèle à corriger si renommage : `library/skills/README.md:22-30,44-150` ;
  `specs/equipe-agents.md:113` ; `methode-de-travail.md:113`.
- Modèle canon (à compléter, pas refaire) : `specs/instructions/modele-skills-agnostique-couches.md`.
- Lot en cours (cohérent) : `specs/instructions/verbe-forgejo-et-doc-methode.md`.

---

## Statut

**NOTE D'AUDIT — livrée pour lecture du décideur.** Pas de gate P1→P2 (ce n'est pas une instruction
d'exécution). Si le décideur retient la correction naonedge (§7 priorité 1), elle donnera lieu à **une
instruction dédiée** (renommage + resynchro vendorage coordonnée), cadrée séparément.
