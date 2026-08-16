# Garde balayante du routage prod — fermer les sites survivants et cesser d'énumérer

> Cadrée par **🧙 Gandalf** (P1 — Cadrage), le **2026-08-15**, dans le worktree
> `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante`
> (branche `specs/cadrage-garde-routage-balayante`, basée sur `feat/correctif-routage-prod-vers-charon`).
> Exécution : **⚒️ Gimli** (P2).
>
> **Lot successeur** de `specs/instructions/correctif-routage-prod-vers-charon.md`, gaté **PASS**
> par 🏹 Legolas (16 CA / 16). Il instruit ses deux réserves `R-1` (sites survivants) et `R-2`
> (la garde est la copie de l'inventaire qu'elle vérifie) — **qui n'en font qu'une**.
>
> 🛑 **TOUTES les mesures ci-dessous ont été REFAITES sur le disque le 2026-08-15.** Je n'ai repris
> aucun relevé antérieur. **Ils sont tous sous-estimés — celui de Legolas comme celui de l'ordre de
> mission** (§ 2.1). C'est le troisième comptage faux d'affilée, et c'est le sujet du lot.
>
> ---
>
> ⚠️ **RÉVISION du 2026-08-15 (même jour) — la base a bougé sous le cadrage.** `main` a depuis
> absorbé les trois lots, en emportant **4 commits que cette pile n'avait jamais vus**, dont une
> **refonte du `README.md`**. Ce cadrage a donc été **mesuré avant merge**. Trois points ont été
> repris contre l'état **mergé** : **`CA-14`** (réécrit — `F22` était vrai sur ma base, il ne l'est
> plus), **`D11`** (le trou de couverture est désormais nommé comme une **classe**, `F31`), et
> **deux réserves neuves** de 🏹 Legolas versées au dossier (`R-5`, `R-6`). Ajouts : **`D14`**
> (registre des **angles morts**) et **`CA-19`**.
>
> 🛑 **Conséquence opérationnelle pour ⚒️ Gimli** : les faits `F5`-`F16` datent d'**avant** le
> merge. Ils restent des sites réels — aucun n'a été corrigé par le merge — mais **leurs numéros de
> ligne peuvent avoir glissé**, et `main` peut porter des sites **nés des 4 commits inconnus**.
> **Ne pas se fier aux lignes : se fier au rouge de la garde** (`CA-1`, `CA-3`). C'est exactement
> l'objet du lot : *un inventaire est un instantané, une garde est un régime permanent.*

---

## 1. Problème

Le lot de routage a corrigé 11 fichiers **listés**. Sa garde `G-ROUTE-2`
(`cli/test/route-prod.test.js:110-125`) vérifie… **ces mêmes 11 fichiers, recopiés en dur** :

```js
const ROUTAGE_A = [ /* 9 chemins */ ];   // cli/test/route-prod.test.js:110
const ROUTAGE_B = [ /* 2 chemins */ ];   // cli/test/route-prod.test.js:122
```

C'est le **§ 7 de l'instruction recopié dans le test**. Une garde bâtie sur l'inventaire qu'elle
contrôle **ne peut pas** dire que l'inventaire est incomplet : elle est verte **par construction**
sur tout ce qui n'y figure pas. L'en-tête du fichier revendique pourtant l'inverse —
« *ces gardes […] BALAIENT (elles ne dépendent pas de l'inventaire du § 7 — c'est leur raison
d'être, cf. R1)* » (`cli/test/route-prod.test.js:11-12`). **`G-ROUTE-1` balaie réellement**
(découverte par nom de fichier, `:71`) ; **`G-ROUTE-2` non** : elle récite. L'affirmation est vraie
d'une garde sur trois et fausse de celle qui couvre le plus de surface.

**Conséquence, en place aujourd'hui** : des fichiers qui routent encore la prod vers 🌉 Helm sont
**invisibles** de la suite verte. Deux d'entre eux avaient **déjà** été relevés au `CA-20(e)`
**décoché** du lot de scission (`specs/instructions/scission-squad-prod-charon-helm.md:796-810`),
puis déclarés « **HORS PÉRIMÈTRE** » — sans qu'aucun mécanisme ne porte cette exclusion. Ils ont
donc été **oubliés une seconde fois** au lot de routage.

> **Le vrai défaut n'est pas la liste : c'est que l'exclusion a été prononcée dans un texte et non
> dans un exécutable.** Une exclusion qui ne s'exécute pas n'est pas une exclusion — c'est un
> oubli qui a été écrit une fois. Ce lot doit produire le mécanisme, pas seulement la correction.

---

## 2. Faits mesurés (`F*`)

> `F*` = **fait vérifié sur le disque le 2026-08-15** dans le worktree ci-dessus. `D*` = décision (§ 4).

### 2.1 🛑 Le fait central : **le compte des survivants est faux pour la troisième fois**

| Source | Compte annoncé |
|---|---|
| `CA-20(e)`, lot de scission (`scission-squad-prod-charon-helm.md:800-806`) | **5 fichiers**, dont 2 corrigés depuis |
| `R-1`, gate de Legolas (lot de routage) | **3 sites** |
| Ordre de mission de ce cadrage | **4 lignes** |
| **Mesuré ce jour** | 🛑 **8 sites de défaut + 3 lacunes** (§ 2.2) |

| Id | Fait | Preuve |
|---|---|---|
| **F1** | `G-ROUTE-2` est **énumérante** : 11 chemins en dur, aucun découvert | `cli/test/route-prod.test.js:110` · `:122` · `:149` · `:154` |
| **F2** | `G-ROUTE-1` est, elle, **déjà balayante** : elle découvre ses fichiers par **nom** (`helm.md`, `helm.json`, `charon.*`), n'importe où dans le dépôt | `cli/test/route-prod.test.js:71` (`scanner(REPO, (nom) => nom === ...)`) |
| **F3** | 🛑 **Un site inédit, jamais nommé par aucun relevé**, apparaît dès qu'on balaie : « **Helm** (**squad prod** : déploiement… » | `doc/index.html:174` |
| **F4** | 🛑 La correction de `prise-en-main-ia-iakabox.html:476` **existe déjà ailleurs** : son jumeau documentaire est **juste et complet** (Charon `deploiement` **et** Helm `surveillance`) | `docs/modeles-ia-des-agents.md:22-23` vs `prise-en-main-ia-iakabox.html:476` |

> **Ce que `F3` démontre, et c'est tout le lot** : *le balayage trouve ce que trois relevés
> successifs n'ont pas trouvé.* Ce n'est pas une opinion sur la méthode, c'est un site de plus,
> mesuré, en une seule commande.

### 2.2 Inventaire réel — **exhaustif, groupe par groupe**

> Critère retenu (`D1`, hérité du lot de routage) : **est un défaut toute formulation qui attribue
> à Helm le rôle `deploiement` ou la skill `iakaframe-deploiement`**, alors que le canon dit
> `roleKey: surveillance` (`library/personas/helm.md:6`) et `skills: [iakaframe-surveillance]`
> (`library/personas/helm.md:9`), le rôle `deploiement` appartenant à Charon
> (`library/personas/charon.md:6,9`).

**Groupe A — vitrines et doc publiées du dépôt (5 sites, 4 fichiers)**

| Id | `chemin:ligne` | Ce qu'il dit encore | Relevé antérieur |
|---|---|---|---|
| **F5** | `iakaframe-skills.html:116` | `iakaframe-deploiement` \| 🌉 Helm \| « Squad prod — **déploiement, accès, rollback**, surveillance, alertes » \| *gate humain* | `CA-20(e)` + `R-1` |
| **F6** | `iakaframe-skills.html:211` | « la surveillance prod par `iakaframe-deploiement` (**Helm**, squad prod) » | `CA-20(e)` + `R-1` |
| **F7** | `specs/glossaire-iakaframe.md:15` | « Helm \| l'**équipe de déploiement production** \| Production » | `CA-20(e)` + `R-1` |
| **F8** | `prise-en-main-ia-iakabox.html:476` | « 🌉 Helm \| 🟣 **Déploiement prod** \| … Risque élevé (**rollback**, prod) » | ordre de mission seul |
| **F9** | 🛑 `doc/index.html:174` | « **Helm** (**squad prod** : **déploiement**… » | **AUCUN** — inédit (`F3`) |

**Groupe B — lacunes d'INVENTAIRE (3, même nature, jamais relevées)**

Ces fichiers ne se trompent pas seulement **sur** Helm : ils **ignorent l'existence** de Charon et
de `iakaframe-surveillance`. Un catalogue partiel est un catalogue périmé.

| Id | Fait | Preuve |
|---|---|---|
| **F10** | `iakaframe-skills.html` porte **0** occurrence de « Charon » et **0** de `iakaframe-surveillance`, tout en se présentant comme le catalogue des « Skills de rôle — les agents (**7**) » | `iakaframe-skills.html:111` (titre du groupe) ; comptage global = 0 |
| **F11** | `specs/glossaire-iakaframe.md` — **Charon absent** de la liste des noms de code (`:5`) **et** du tableau canonique (`:10-17`, 8 lignes) | `specs/glossaire-iakaframe.md:5` · `:10-17` |
| **F12** | `specs/glossaire-iakaframe.md:6` renvoie à `methode-de-travail.md:104-113` comme « réf. roster » — **plage périmée** : le roster réel court jusqu'à `:117`, et **Charon (`:114`) comme Helm (`:115`) tombent hors de la plage citée** | `methode-de-travail.md:109-117` |

**Groupe C — maquettes GUI (3 sites, 2 fichiers)**

| Id | `chemin:ligne` | Ce qu'il dit |
|---|---|---|
| **F13** | `specs/mock/gui/01-library.html:162` | `{id:'helm', … role:'Déploiement · prod', … skills:['iakaframe-deploiement'], … mission:'Promeut une version recettée de stage vers la prod ; validation humaine obligatoire.'}` |
| **F14** | `specs/mock/gui/03-assemblage.html:222` | `{n:'Helm', r:'deploiement', …}` |
| **F15** | `specs/mock/gui/03-assemblage.html:235` | `['deploiement','Helm', …]` |
| **F16** | Les deux maquettes portent **0** occurrence de « Charon » et **0** de `iakaframe-surveillance` | comptage global = 0 |

### 2.3 Faits sur le COÛT du balayage — la mesure qui commande `D7` et `D11`

J'ai rejoué **deux prédicats candidats** sur l'arbre vivant (hors `.git`, `node_modules`,
`frames/releases`, `specs/instructions`) et lu **chaque** ligne rendue.

| Id | Prédicat | Défauts attrapés | **Faux positifs** |
|---|---|---|---|
| **F17** | **Affectation** — ligne portant `helm` **et** `deploiement` (accents indifférents) **sans** `charon` | **8 / 8** (`F5`-`F9`, `F13`-`F15`) | 🟢 **1 seul** : `cli/test/library.test.js:217` (`'# team 7 personas (helm retire) : deploiement pris par le coordinateur'`) |
| **F18** | **Attribution narrative** — ligne portant `Helm` **et** un mot de traversée (`TRAVERSEE`, `cli/test/route-prod.test.js:108`) **sans** `Charon` | 8 / 8 | 🛑 **≥ 8**, de trois causes distinctes (ci-dessous) |

**Les trois causes de faux positifs de `F18`, chacune sourcée** — c'est ce qui disqualifie le
prédicat narratif comme balayage général :

| Id | Cause | Exemples mesurés |
|---|---|---|
| **F19** | **Clause négative légitime** — le texte dit précisément que Helm **ne** bascule **pas**. C'est l'arbitrage `CA-12` du lot de scission (`scission-squad-prod-charon-helm.md:789-794`), qui a **exigé** de conserver la trace du rétrécissement | `library/skills/iakastart/SKILL.md:83` (« *sans ordre ; il ne bascule ni ne rollback* ») · `methode-de-travail.html:4322` · `methode-de-travail.html:1091` · `methode-de-travail.html:2629` |
| **F20** | **Césure de ligne** — la paire Helm/Charon est correcte mais **enjambe deux lignes physiques** de prose. Exiger les deux noms sur la même ligne est tenable sur 11 fichiers par-persona (c'est la « conséquence de rédaction assumée » de `cli/test/route-prod.test.js:96-100`) ; sur toute la prose du dépôt, cela reviendrait à **reflower la vitrine entière** | `methode-de-travail.md:189-191` (Charon est à `:190`, la faute serait déclarée à `:189` et `:191`) · `cli/test/fixtures/agents-golden/helm.md:20` (Charon à `:19`) · `methode-de-travail.html:1444` |
| **F21** | **Renvoi croisé implicite** — le fichier **est** l'artefact de Charon ; il parle de lui sans se renommer à chaque ligne | `cli/test/fixtures/agents-golden/charon.md:9` · `:67` · `:74` (« *la suite (bascule / passage de main à Helm)* » — **correct** : après la bascule, on passe la main au veilleur) · leurs copies en vitrine `methode-de-travail.html:1033` · `:1091` · `:1098` |

### 2.4 Faits de contexte, versés au dossier

| Id | Fait |
|---|---|
| **F22** | 🛑 **PÉRIMÉ — réécrit à la révision.** Sur ma base pré-merge, `README.md:168` était **correct** et nommait les deux agents (« ⛴️ **Charon** *fait passer* … ; 🌉 **Helm** *veille* »). **Cette ligne n'existe plus sur `main`** : la refonte du README a **supprimé toute la liste à puces nommée** (convention *doc publique : des rôles, pas des noms d'agents*) et l'a remplacée par un **tableau de rôles**. → `F28` |
| **F23** | `cli/src/lib/agents.js:43` — `ROLE_OF.helm = 'coordination'`, **contraire au canon** (`surveillance`). C'est une **dette déclarée dans le code lui-même** (`cli/src/lib/agents.js:27-28,43` : « ⚠️ FAUX depuis la scission — dette assumee »), rattachée au dossier `decision-rolekey-reconciliation.md`. **Ce n'est pas un oubli** |
| **F24** | `docs/guide-stefframe2.{md,html}` portent **7 sites** de même nature (`guide-stefframe2.md:402,448` · `guide-stefframe2.html:441,562,630`…). Ils **documentent le miroir gelé** `StefFrame2` : `D4` du lot de routage les a déjà mis hors lot, mais **seul le `.html:604` y était nommé** — le `.md` jumeau ne l'était pas |
| **F25** | `specs/etat-des-lieux.{md,html}` et `specs/.iakaframe-journal.json` portent des occurrences (`etat-des-lieux.md:83`, `etat-des-lieux.html:90`, `.iakaframe-journal.json:290`). Ce sont des **traces datées append-only** — même nature que `specs/instructions/`, déjà exclu |
| **F26** | `bindings/iakaframe-ollama-default.md:38` porte `deploiement` **et** `Helm` sur la même ligne, mais **nomme Charon** — il est **correct** et sera acquitté |
| **F27** | `cli/test/route-prod.test.js:94` cite `F2` du lot précédent (« *le deploiement (→ Helm)* ») **sans nommer Charon sur la ligne** : la garde mordrait sur son propre commentaire |

### 2.5 🛑 Faits de RÉVISION — mesurés sur l'état MERGÉ (2026-08-15)

> Mesurés dans `/Users/sjupin/work/iakaframe/.claude/worktrees/merge-main` (état **mergé**), en
> **lecture seule**. Ils commandent la réécriture de `CA-14`, l'amendement de `D11` et `D14`.

| Id | Fait | Preuve |
|---|---|---|
| **F28** | 🛑 Sur `main`, `README.md` porte **0 occurrence de « Helm »** et **0 de « Charon »**. La refonte a remplacé la liste nommée par un **tableau de rôles** (`:220-230`). Ce fichier est donc **invisible de `D7` comme de `D8` par construction** — les deux prédicats exigent un **nom de persona** ou un **nom de skill**, et il n'en porte plus aucun | `merge-main/README.md:220-230` ; comptage global « Helm » = 0, « Charon » = 0 |
| **F29** | Le tableau portait une ligne **d'avant la scission** — `\| **Production** \| Promotion en production et surveillance, avec feu vert humain obligatoire. \|` — **réconciliée pendant le merge** en **deux** lignes : `Déploiement` (`:227`) et `Surveillance` (`:228`). Confrontées au canon par 🏹 Legolas : **fidèles, aucun sens inventé** | `merge-main/README.md:227` · `:228` vs `library/roles/deploiement.md:14,19` · `library/roles/surveillance.md:14-15,27` |
| **F30** | 🛑 **Aucun test du dépôt ne lit le `README.md` racine.** Les **7** occurrences de `README.md` dans `cli/test/**` sont **toutes** des fixtures **écrites dans un tmpdir**, jamais une lecture du fichier réel. La correction de `F29` est donc **manuelle et non verrouillée** : elle peut régresser en silence, exactement comme elle est apparue | `repo-guard.test.js:93` · `frame-verify.test.js:106,240,280` · `guard-version-source-unique.test.js:117,187` · `switch-flags-guard.test.js:98` |
| **F31** | 🛑 **Le vocabulaire de rôle des docs n'est ancré sur AUCUNE chaîne du canon.** Le canon porte `key` **et** `label` (`library/roles/*.md:3-4`) ; le tableau du README emploie une **troisième langue**, qui n'est ni l'un ni l'autre : « **Réalisation** » là où le canon dit `key: dev` / `label: Développeur (dev + devops)`, et « **Production** » là où il dit `deploiement` + `surveillance`. Mesure décisive : la chaîne « Réalisation » **ne figure nulle part** dans `library/**` ni `cli/src/**` | `library/roles/dev.md:3-4` · `deploiement.md:4` · `surveillance.md:4` ; recherche « Réalisation/Realisation » sur `library/**` + `cli/src/**` → **0 résultat** |
| **F32** | Les **6 skips de parité GUI** sont un **artefact de worktree**, pas une absence de dépôt. Le frère **existe** en `/Users/sjupin/work/iakaFrameGUI` ; c'est la résolution **relative au dépôt** qui échoue : `path.resolve(REPO, '..', 'iakaFrameGUI')` vaut `.claude/worktrees/iakaFrameGUI` depuis un worktree. Le motif affiché — « *dépôt iakaFrameGUI absent - CI isolée* » — est donc **faux sur ce poste**. Contournement : `IAKAFRAME_GUI_ROOT` | `cli/test/frontmatter-schema-parity.test.js:62` (résolution) · `:71` (motif) · `:59` (override) · `cli/src/commands/vendor-check.js:199` |

> **Ce que `F28` + `F31` démontrent ensemble, et c'est le vrai enseignement de la révision** :
> le site a échappé par **trois** mécanismes indépendants — périmètre figé, **postériorité à
> l'inventaire** (la ligne fautive est née *après* que le § 7 a été dressé, sur une branche
> parallèle), et **prédicat inadapté** (la faute s'exprimait en **mot de rôle**, pas en **nom de
> persona**). **Un seul suffisait.** Inscrire `README.md` dans `ROUTAGE_A` n'aurait **rien**
> attrapé : Legolas l'a vérifié en soumettant le fichier pré-merge aux deux prédicats de
> `G-ROUTE-2` **comme s'il y était inscrit** — niveau A : **0 faute** ; niveau B : **9 fautes**,
> dont **une seule vraie** et **8 faux positifs** (« deploye », « bascule » au sens ordinaire).
> *La postériorité (2) est la plus grave : elle établit qu'un inventaire **parfait** n'aurait pas
> suffi non plus.*

---

## 3. Décision retenue

**Faire de `G-ROUTE-2` une garde qui DÉCOUVRE au lieu de réciter — par deux moyens complémentaires :
la découverte des populations par NOM DE FICHIER, et un invariant d'AFFECTATION ancré sur le canon
lu à l'exécution, balayé sur tout le dépôt. Traiter les 8 sites survivants, aucun n'étant déclaré
hors périmètre. Et déplacer toute exemption du TEXTE d'une instruction vers la GARDE elle-même, où
elle s'exécute, se motive et PÉRIME.**

---

## 4. Décisions de cadrage (`D*`)

- **`D1` — Le critère reste SÉMANTIQUE, pas lexical** *(hérité, `D1` du lot de routage)*.
  Le mot « prod » seul ne déclenche **rien** — la pastille de Helm **EST** 🟣 (`library/personas/helm.md:8`).
  Le mot « bascule » seul ne déclenche rien non plus (`F19`). Ce qui déclenche est l'**affectation
  d'un rôle ou d'une skill** à un agent qui ne les porte plus.

- **`D2` — Base du lot** : worktree `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante`,
  branche `specs/cadrage-garde-routage-balayante` **au-dessus de** `feat/correctif-routage-prod-vers-charon`.
  Ne **jamais** travailler dans `/Users/sjupin/work/iakaframe` (racine) : elle porte du travail non
  commité d'un autre lot. Premier geste du § 6 : le vérifier.

- **`D3` — Le compte est FERMÉ à 8 sites de défaut + 3 lacunes d'inventaire** (`F5`-`F16`), et non
  3, ni 4, ni 5. Motif : mesuré ce jour, un par un, § 2.2. **Le compte n'est pas pour autant
  déclaré définitif** : `CA-1` exige que Gimli **rejoue le prédicat** et **consigne le compte
  constaté** — si la garde en rend plus, c'est la garde qui a raison, pas ce §.

- **`D4` — 🛑 AUCUN site survivant n'est déclaré hors périmètre. Les 8 sont traités.**
  Motif, et c'est le point dur du lot : l'exclusion prononcée au `CA-20(e)`
  (`scission-squad-prod-charon-helm.md:796` : « *les fichiers en cause sont HORS PÉRIMÈTRE* ») était
  **argumentée par la seule absence des fichiers du § 6.5** — c'est-à-dire par l'oubli lui-même,
  érigé en motif. Le gate l'avait d'ailleurs pressenti : « *leur omission ressemble à un oubli de
  cadrage plutôt qu'à une exclusion voulue* » (`:808-810`). **Reconduire cette exclusion serait
  ratifier l'oubli.** Coût de la reprise : `F5`-`F16` sont **des lignes de tableau**, pas des
  réécritures.

- **`D5` — 🛑 LE MÉCANISME ANTI-OUBLI : une exemption vit DANS LA GARDE, jamais dans une instruction.**
  Motif : le § 796 du lot de scission a **écrit** une exclusion ; rien ne l'a **exécutée** ; elle
  n'a donc jamais été opposable — elle a seulement été **perdue**. Toute exemption au balayage
  s'inscrit désormais comme **entrée déclarée dans le fichier de garde**, portant **trois** champs
  obligatoires :
  1. le **motif** (pourquoi ce site est légitimement rouge) ;
  2. le **ticket successeur** ou la **condition de levée** (ce qui la fera disparaître) ;
  3. la **portée** (chemin, ou chemin + motif de ligne).

  **Et — c'est la clause qui interdit l'oubli n°3 — une exemption DEVENUE INUTILE FAIT ÉCHOUER LA
  GARDE.** Si le site exempté n'est plus rouge, l'exemption est **morte** et la garde le dit en
  rouge, avec pour seul remède de **supprimer l'entrée**. Une liste d'exceptions qui ne peut pas
  pourrir en silence est le contraire d'une liste oubliée.

- **`D6` — `G-ROUTE-2` est DÉ-ÉNUMÉRÉE : ses populations sont DÉCOUVERTES par nom de fichier**,
  exactement comme `G-ROUTE-1` le fait déjà (`F2`, `cli/test/route-prod.test.js:71`).
  - Niveau **A** (routage) : tout fichier nommé `aragorn.{md,json}`, `gimli.{md,json}`,
    `legolas.{md,json}` **où qu'il soit** dans le dépôt, hors exclusions.
  - Niveau **B** (artefacts de Helm) : tout fichier nommé `helm.{md,json}`, idem.
  - Les constantes `ROUTAGE_A` / `ROUTAGE_B` (`cli/test/route-prod.test.js:110,122`) **disparaissent**.
  - La garde **assure qu'elle a trouvé quelque chose** : un scan qui rend 0 fichier est un **échec**,
    jamais un succès silencieux (le mode de panne d'un balayage est de ne rien balayer).
  Effet : les **9 chemins + 2 chemins** cessent d'être une liste à maintenir, et un kit neuf, un
  golden neuf ou un persona déplacé sont couverts **sans toucher au test**.

- **`D7` — `G-ROUTE-4` (NEUVE) : invariant d'AFFECTATION, ANCRÉ SUR LE CANON LU À L'EXÉCUTION,
  balayé sur TOUT le dépôt.**
  > Sur **tout fichier texte** du dépôt hors exclusions (`D9`), **aucune ligne ne doit associer
  > `helm` au rôle `deploiement` ni à la skill `iakaframe-deploiement`** — ni, symétriquement,
  > `charon` au rôle `surveillance` ou à `iakaframe-surveillance` — **sauf** si la ligne nomme aussi
  > le **titulaire légitime** du rôle cité.

  **La garde ne code pas ces valeurs en dur** : elle lit `roleKey` et `skills` dans les
  frontmatters de `library/personas/helm.md` (`:6`, `:9`) et `library/personas/charon.md`
  (`:6`, `:9`), et en dérive les paires attendues. C'est le geste anti-énumération à sa forme
  pure : **la garde tire son attente de la source de vérité au lieu de la répéter.** Si le canon
  change, la garde suit ; si un troisième poste prod apparaît, elle le prend sans édition.
  Comparaison **insensible aux accents et à la casse** (`Déploiement` ≡ `deploiement`, `F7`/`F8`).

- **`D8` — `G-ROUTE-1` est ÉLARGIE aux SKILLS, au niveau FICHIER** (elle l'est déjà aux personas).
  > Tout fichier nommant `iakaframe-deploiement` DOIT nommer `iakaframe-surveillance`, et
  > réciproquement.

  Motif : `F10`/`F16` — les catalogues qui ignorent l'existence de la skill née de la scission ne
  se trompent sur aucune ligne prise isolément ; ils sont faux **par omission**. Seule une garde de
  **niveau fichier** voit une omission — c'est déjà l'argument qui fonde `G-ROUTE-1`
  (`cli/test/route-prod.test.js:60-61`), ici appliqué à la seconde moitié de la scission.

- **`D9` — Périmètre du balayage : `EXCLUS` TIENT et S'ÉLARGIT de deux familles, pas plus.**
  L'existant (`cli/test/route-prod.test.js:29`) est **conservé tel quel** :
  `.git`, `node_modules`, `frames/releases` (miroir gelé, `D9` du lot de routage),
  `specs/instructions` (traces datées). S'y **ajoutent**, chacune avec motif et condition de levée
  au sens de `D5` :

  | Ajout | Motif | Condition de levée |
  |---|---|---|
  | `specs/etat-des-lieux.md`, `specs/etat-des-lieux.html`, `specs/.iakaframe-journal.json` | **traces datées append-only** (`F25`) — les réécrire falsifierait le journal ; exacte même nature que `specs/instructions/` | aucune (permanent, par nature) |
  | `docs/guide-stefframe2.md`, `docs/guide-stefframe2.html` | **documentent le miroir gelé** (`F24`) ; les corriger les ferait **mentir sur l'artefact qu'ils décrivent** — `D4` du lot de routage, ici **étendu au jumeau `.md` qui n'y était pas nommé** | ticket **`RESYNC-SF2`** (`resync-stefframe2-miroir-live.md`) |

  **Ne s'ajoutent PAS** — et c'est délibéré :
  - **les maquettes `specs/mock/gui/`** : elles sont **traitées** (`F13`-`F16`, `D4`). Une maquette
    est une **source de futur code**, pas une trace datée : un roster périmé y sera **recopié** dans
    le GUI. Coût : 3 lignes.
  - **`cli/test/route-prod.test.js` lui-même** : une garde qui s'auto-exclut peut se cacher.
    `F27` est donc traité **en reformulant le commentaire**, pas en s'exemptant — même discipline
    que la « conséquence de rédaction assumée » de `:96-100`.

- **`D10` — Les faux positifs sont tenus par le CRITÈRE, pas par une allowlist. Objectif : ZÉRO
  entrée d'exemption de ligne.** Mesure à l'appui (`F17`) : le prédicat d'affectation rend **un
  seul** faux positif sur tout le dépôt, `cli/test/library.test.js:217`, et il se corrige **par
  reformulation** de la chaîne de fixture (« *team 7 personas (helm retire)* » → « *squad prod
  retiré* »), sans rien exempter. Le mécanisme `D5` existe donc **pour les deux exemptions de
  chemin de `D9`**, et doit rester à ce format : *si l'on doit y ajouter des lignes, c'est que le
  critère est mauvais — on corrige le critère, pas la liste.*

- **`D11` — Le balayage NARRATIF « Helm ∧ traversée » sur toute la prose est REJETÉ.**
  Motif mesuré (`F18`-`F21`) : ≥ 8 faux positifs, de trois causes **toutes légitimes** — la clause
  négative que `CA-12` a **exigé** de conserver (`F19`), la césure de ligne (`F20`), le renvoi
  croisé implicite d'un artefact qui parle de lui-même (`F21`). Le tenir demanderait soit de
  reflower la vitrine entière, soit une allowlist de lignes — c'est-à-dire **de réintroduire
  l'énumération par la porte de derrière**. Le critère strict « les deux noms sur la même ligne »
  reste **borné aux fichiers par-persona** de niveau A (`D6`), où il est le remède même. Ailleurs,
  c'est `D7` + `D8` qui balaient — et ils attrapent **8 défauts sur 8** (`F17`).

  **🛑 AMENDEMENT DE RÉVISION — ce que `D11` laisse dehors n'est pas un cas, c'est une CLASSE.**
  Je maintenais jusqu'ici que « *un défaut du type `prise-en-main:435` ne serait plus attrapé* » —
  formulation trop douce, qui laissait croire à un angle mort **anecdotique**. `F28` établit la
  bonne portée, et il faut l'écrire sans adoucissant :

  > **Les formulations en LANGAGE DE RÔLE échappent par construction.** `D7` et `D8` exigent tous
  > deux un **nom de persona** (`helm`, `charon`) ou un **nom de skill** (`iakaframe-*`). Un
  > document qui décrit la chaîne en **rôles** — et c'est **la convention de la doc publique du
  > dépôt**, *« des rôles, pas des noms d'agents »* — ne porte, par définition, **aucun de ces
  > jetons**. Il est donc **invisible de l'intégralité du dispositif**, quelle que soit la qualité
  > de l'inventaire.

  Ce n'est pas une hypothèse : `README.md` sur `main` porte **0 « Helm » et 0 « Charon »** (`F28`),
  et c'est précisément **là** que dormait une ligne pré-scission jusqu'au merge (`F29`).
  **La classe entière des vitrines rédigées en rôles est hors d'atteinte.**

  **Arbitrage — j'ASSUME le trou et je REFUSE d'ouvrir un troisième prédicat dans ce lot.**
  Motif, et il est **mesuré**, pas prudentiel : `F31` — **il n'existe aucune chaîne canonique sur
  laquelle un prédicat de rôle pourrait s'ancrer.** Le canon porte `key` et `label` ; la doc
  emploie une **troisième** langue (« Réalisation » pour `dev`, « Production » pour l'ancien rôle
  fusionné), qui ne figure **nulle part** dans `library/**` ni `cli/src/**`. Un prédicat de rôle
  écrit aujourd'hui devrait donc porter **sa propre table de synonymes** — c'est-à-dire
  **exactement l'énumération que ce lot existe pour supprimer**, réintroduite au cœur de la garde
  neuve. *On ne guérit pas l'énumération en énumérant les synonymes.*

  **Ce que je fais à la place, et qui n'est pas rien** : le trou cesse d'être une phrase et devient
  une **entrée exécutable** au registre des angles morts (`D14`), assortie de son successeur nommé
  **`ROLE-VOCAB-CANON`**. La forme visée par ce successeur — je la consigne pour qu'il n'ait pas à
  la redécouvrir — est un **contrôle d'ARITÉ**, immunisé au vocabulaire : *un tableau de rôles doit
  porter autant de lignes que le canon compte de rôles*. Mesure à l'appui : le README pré-merge
  portait **8** lignes là où le canon en attend **9** (8 `scope: team` + `portefeuille`) — le
  contrôle **aurait mordu**, sans connaître un seul synonyme. Reste une vraie inconnue, qui est la
  raison d'être du ticket : **le canon ne dit pas quels `scope` figurent dans un tableau public**
  (`frame`, `scope: portfolio`, n'y est pas). Fermer cela, c'est **ajouter un champ au canon** —
  un lot amont, pas une retouche de garde.

- **`D12` — `cli/src/lib/agents.js:43` (`ROLE_OF.helm = 'coordination'`) : CONSIGNÉ, HORS LOT.**
  Motif : c'est une **dette déjà déclarée dans le code** (`F23`) et rattachée au dossier
  `decision-rolekey-reconciliation.md` — pas un oubli de routage. Le prédicat de `D7` ne mord pas
  dessus (`coordination` ≠ `deploiement`), donc **aucune exemption n'est requise** : le hors-lot
  est ici **naturel**, pas décrété. → § 8.

- **`D13` — ROUGE D'ABORD, sans exception.** Les gardes refondues sont écrites, **exécutées et VUES
  ROUGES sur les 8 sites** *avant* toute correction, comptes consignés au message de commit
  (`D5` du lot de routage, qui a fait ses preuves). **C'est la seule preuve qu'elles balaient
  vraiment** : une garde verte qui n'a jamais été rouge sur les survivants est indiscernable de la
  garde énumérante qu'elle remplace.

- **`D14` — 🛑 NEUVE (révision) : REGISTRE DES ANGLES MORTS, périssable EN MIROIR de `D5`.**
  Répond à `R-5` et à l'amendement de `D11`.

  **Le défaut de `D5` que la révision a mis au jour, et que je dois écrire honnêtement** : `D5`
  déplace l'exemption du texte vers la garde, et la fait périr **quand le site cesse d'être
  rouge**. Cette mécanique ne vaut **que pour les sites que le prédicat ATTEINT**. Un site
  **invisible** du prédicat — `README.md`, `F28` — ne peut pas y être inscrit : il n'est pas
  rouge, donc son exemption serait **morte à la seconde où on l'écrit**, et ferait échouer la garde
  pour un motif faux. **`D5` est structurellement incapable de tracer ce qui est hors de sa
  portée.** C'est le trou par lequel sont passés l'oubli n°1 **et** l'oubli n°2.

  **Le registre des angles morts est le miroir exact de `D5`.** Une entrée déclare un site — ou une
  **classe** de sites — que **le dispositif n'atteint pas**, avec les **trois mêmes champs**
  (motif, ticket successeur / condition de levée, portée). Sa règle de péremption est **inversée** :

  > **une entrée d'angle mort devenue COUVERTE fait échouer la garde.** Dès qu'un prédicat atteint
  > le site déclaré, l'entrée est **morte** et la garde le dit en rouge, avec pour seul remède de
  > **supprimer l'entrée**.

  Effet : `D5` interdit qu'une **exception** pourrisse en silence ; `D14` interdit qu'un **aveu de
  non-couverture** pourrisse en silence. Ensemble, ils ferment les deux sens. **Aucun des deux ne
  corrige quoi que ce soit — ils rendent l'oubli impossible à commettre deux fois sans le voir.**

  **Deux entrées, et deux seulement, à l'ouverture du registre** :

  | Portée | Motif — pourquoi le dispositif ne l'atteint pas | Successeur / condition de levée |
  |---|---|---|
  | `README.md` (et, par extension déclarée, **toute vitrine rédigée en langage de rôle**) | `F28` + `F31` — le fichier ne porte **aucun** nom de persona ni de skill ; `D7` et `D8` exigent l'un des deux. Aucun prédicat actuel ne peut le voir | **`ROLE-VOCAB-CANON`** — canoniser un libellé de rôle **destiné à la doc**, puis contrôle d'**arité** (`D11`, amendement) |
  | Prose attribuant la **traversée** à 🌉 Helm **sans** jeton `deploiement` (ex. « *la mise en prod est un squad séparé (🌉 Helm)* », défaut corrigé à `prise-en-main-ia-iakabox.html:435` au lot précédent) | `D11` — le prédicat narratif est **rejeté, mesure à l'appui** (≥ 8 faux positifs de trois causes légitimes) | **`ROLE-VOCAB-CANON`** également, ou levée explicite si la mesure de faux positifs change |

  **Coût** : une structure de données et une assertion **inversée** — le pendant de celle de `D5`,
  écrite à côté d'elle. **Ce que ça n'est pas** : une liste de fichiers à maintenir. Une entrée
  d'angle mort **ne nomme pas des sites**, elle nomme **une raison de ne pas les voir** ; le jour
  où la raison tombe, la garde crie.

## 5. Les gardes — état visé

| Garde | État aujourd'hui | Après ce lot |
|---|---|---|
| `G-ROUTE-1` — réciprocité **par-persona** | balayante (`F2`) — **inchangée** | + **volet SKILLS** au niveau fichier (`D8`) |
| `G-ROUTE-2` — attribution | 🛑 **énumérante** (11 chemins en dur) | **découverte par nom de fichier** (`D6`), constantes supprimées |
| `G-ROUTE-3` — contrats déployés | inchangée (skip propre si `~/.claude/agents/` absent, `cli/test/route-prod.test.js:180`) | **inchangée** |
| `G-ROUTE-4` — **affectation** | 🛑 **n'existe pas** | **neuve**, canon-ancrée, sur tout le dépôt (`D7`) |
| `G-ROUTE-5` — **registre des ANGLES MORTS** | 🛑 **n'existe pas** | **neuve** (révision) : déclare ce que le dispositif **n'atteint pas**, et **périt en miroir** (`D14`, `CA-19`) |

> **Les quatre premières disent ce que le dépôt a de faux. La cinquième dit ce qu'aucune des
> quatre ne peut voir.** C'est la seule réponse honnête à la démonstration de 🏹 Legolas : le site
> du `README.md` avait échappé par **trois** mécanismes indépendants, et le troisième — *la faute
> s'exprimait en **mot de rôle**, pas en **nom de persona*** — reste **ouvert après ce lot**
> (`D11` amendé, `F31`).

## 6. Étapes d'implémentation

> Ordre imposé. Commits atomiques.

1. **Vérifier la base** (`D2`) : être dans le worktree `cadrage-balayante`, sur la branche
   `specs/cadrage-garde-routage-balayante`, et confirmer que `node --test cli/test/route-prod.test.js`
   est **vert** avant de commencer. Sinon → **s'arrêter et remonter**.
2. **Refondre les gardes** (`D5`-`D9`) dans `cli/test/route-prod.test.js`, **sans corriger un seul
   site** : dé-énumération de `G-ROUTE-2`, volet skills de `G-ROUTE-1`, `G-ROUTE-4` neuve,
   mécanisme d'exemption périssable, `EXCLUS` élargi.
3. **🛑 LES VOIR ROUGES** (`D13`). Consigner au message de commit **le compte constaté par garde**,
   et la **liste des `chemin:ligne`** rendus. **Commit dédié.** *Un lot qui livre sans avoir vu la
   garde rouge n'a rien prouvé.*
4. **Corriger le groupe A** — `F5`-`F9` : `iakaframe-skills.html:116,211`,
   `specs/glossaire-iakaframe.md:15`, `prise-en-main-ia-iakabox.html:476`, `doc/index.html:174`.
   **Un commit.**
5. **Corriger le groupe B** — `F10`-`F12` : ajouter Charon et `iakaframe-surveillance` aux
   catalogues (`iakaframe-skills.html`, `specs/glossaire-iakaframe.md` — liste `:5`, tableau
   `:10-17`), et **rectifier la plage de référence** `methode-de-travail.md:104-113` → la plage
   réelle du roster. **Un commit.**
6. **Corriger le groupe C** — maquettes `F13`-`F16`. **Un commit.**
7. **Résorber le faux positif et l'autocitation** (`D10`, `F27`) : reformuler
   `cli/test/library.test.js:217` et `cli/test/route-prod.test.js:94`. **Aucune exemption ajoutée.**
8. **Dérivés — RÉGÉNÉRÉS, jamais édités** : `node cli/scripts/gen-agents-golden.mjs` ·
   `node cli/scripts/gen-methode-vitrine.mjs` · `iakaframe agents --action generate --global`
   puis `--check` = **0**.
9. **Les CINQ gardes au VERT** (`G-ROUTE-5` incluse, `D14`). Si l'une reste rouge → **s'arrêter** : il reste un site, et c'est
   précisément ce que ce lot existe pour rendre visible.
10. **Contrôle final** : dérouler `CA-1` → `CA-18`.

---

## 7. Fichiers concernés — **exhaustif**

> Un fichier non listé ici n'est pas à modifier. Et si un fichier **manque** ici, **les gardes le
> diront** — c'est, cette fois, mécaniquement vrai (`D6`/`D7`/`D8`).
>
> 🛑 **Avec une réserve que la révision impose d'écrire ici, et pas seulement au § 8** : cela n'est
> vrai que des fichiers **portant un nom de persona ou de skill**. Une vitrine rédigée en **langage
> de rôle** — `README.md` en est l'exemple vivant (`F28`) — ne sera **jamais** dénoncée par ces
> gardes. C'est déclaré au registre `D14`, et **c'est la limite de ce lot**.

**A. Gardes — refondues**

| Fichier | Ce qui change |
|---|---|
| `cli/test/route-prod.test.js` | `ROUTAGE_A`/`ROUTAGE_B` **supprimées** (`:110`, `:122`) ; `G-ROUTE-2` découvre par nom (`D6`) ; `G-ROUTE-1` gagne le volet skills (`D8`) ; **`G-ROUTE-4` neuve** (`D7`) ; **`G-ROUTE-5` neuve** — registre des **angles morts**, péremption **inversée** (`D14`, révision) ; `EXCLUS` élargi + **mécanisme d'exemption périssable** (`D5`, `D9`) ; commentaire `:94` reformulé (`F27`) ; **en-tête `:11-12` rectifié** — il revendique aujourd'hui que les gardes balaient, ce qui était **faux de `G-ROUTE-2`** ; après ce lot, il doit dire **ce qu'elles balaient ET ce qu'elles ne voient pas** (`D11` amendé) |

**B. Sites de défaut — corrigés**

| Fichier | Sites |
|---|---|
| `iakaframe-skills.html` | `:116` · `:211` · **+ ajout** de Charon / `iakaframe-surveillance` (`F10`) |
| `specs/glossaire-iakaframe.md` | `:15` · **+ ajout** de Charon (`:5` et tableau `:10-17`) · **+ réf. de ligne** `:6` (`F12`) |
| `prise-en-main-ia-iakabox.html` | `:476` — aligner sur `docs/modeles-ia-des-agents.md:22-23`, **déjà correct** (`F4`) |
| `doc/index.html` | `:174` (`F9` — **inédit**) |
| `specs/mock/gui/01-library.html` | `:162` |
| `specs/mock/gui/03-assemblage.html` | `:222` · `:235` |

**C. Faux positif & autocitation**

| Fichier | Site |
|---|---|
| `cli/test/library.test.js` | `:217` — reformulation de la chaîne de fixture (`D10`) |

**D. Dérivés — RÉGÉNÉRÉS, jamais écrits**

`cli/test/fixtures/agents-golden/*.md` · `methode-de-travail.html` · `iakaframe-methode.html` ·
`~/.claude/agents/*.md`.

---

## 8. Hors périmètre — nommément

| Id | Objet | Motif |
|---|---|---|
| **`GUI-VENDOR-CHARON`** | dérive `vendor-check` — 🛑 **chiffre rectifié à la révision** : la vraie ligne de base est **`OK`, 0 dérive** ; le delta de la pile est donc **0 → 23**, **et non 16 → 23** | successeur **déjà nommé** (`D10` du lot de routage). Autre dépôt. **Voisin, jamais absorbé** |
| **`ROLEKEY-HELM`** | `cli/src/lib/agents.js:43` (`ROLE_OF.helm = 'coordination'`) | `F23`/`D12` — **dette déclarée dans le code**, dossier `decision-rolekey-reconciliation.md`. Le prédicat de `D7` **ne mord pas** dessus : hors-lot **naturel**, sans exemption |
| **`RESYNC-SF2`** | `docs/guide-stefframe2.{md,html}` (7 sites, `F24`) | `D9` — décrivent un **miroir gelé**. Exemption **portée par la garde**, avec condition de levée |
| **`R-3` / `R-4`** | réserves mineures du gate de Legolas | déclarées hors lot par le gate lui-même |
| **Dette de tagging** | `v0.20.4` face à une version `0.39.0` | connue, distincte, sans rapport avec le routage |
| **`ROLE-VOCAB-CANON`** | 🛑 **NEUF (révision) — `R-5` : le site corrigé n'est sous aucune garde.** `README.md:227-228` est **juste** depuis le merge (`F29`), mais **rien ne l'y maintient** : aucun test ne lit le README racine (`F30`), et **aucun prédicat ne peut l'atteindre** (`F28`) | **Hors de CE lot, et le motif est mesuré** : le verrou n'est **pas** un ajout à `ROUTAGE_A` (Legolas l'a prouvé : 0 faute niveau A, 9 dont 8 faux positifs niveau B) ; il suppose de **canoniser un libellé de rôle destiné à la doc**, donc de **toucher au canon** — un lot **amont**. **Ce lot ne le laisse pas orphelin** : entrée au registre `D14`, `CA-19`. **Titulaire : 🧙 Gandalf** (cadrage amont : le geste est un ajout de champ au canon, pas une retouche de garde) |
| **`GUI-PARITE-WORKTREE`** | 🛑 **NEUF (révision) — `R-6`, mineur, d'INSTRUMENT** : les **6 skips de parité GUI** affichent un motif **faux** (« dépôt iakaFrameGUI absent - CI isolée ») alors que le frère existe en `/Users/sjupin/work/iakaFrameGUI` ; c'est la résolution **relative au dépôt** qui échoue depuis `.claude/worktrees/` (`F32`) | **Hors lot, franchement** : c'est de l'**outillage de test**, pas du routage — l'absorber diluerait un lot déjà dense. **Mais il n'est pas anodin** : tant qu'on travaille en worktree, **6 tests ne mesurent jamais rien sans qu'on s'en aperçoive**. **Titulaire : ⚒️ Gimli** (correctif d'instrument : résoudre la racine **réelle** du dépôt, pas le worktree). **Palliatif immédiat, applicable dès ce lot sans rien modifier** : exporter `IAKAFRAME_GUI_ROOT=/Users/sjupin/work/iakaFrameGUI` avant `node --test` — et **le déclarer au commit** (`CA-18`) |
| `README.md` | 🛑 **`F22` PÉRIMÉ, motif refondu** | Non modifié par ce lot — mais **pas parce qu'il est correct par mérite** : il est **hors de portée** de tout prédicat (`F28`). Voir `CA-14` réécrit et le registre `D14`. *Inscrit ici pour que la question ne se repose pas — et, cette fois, pour qu'elle se repose au bon endroit* |
| `frames/releases/**` · `specs/instructions/**` · `specs/etat-des-lieux.*` · `specs/.iakaframe-journal.json` | miroir et traces datées | `D9` |

---

## 9. Risques

| # | Risque | Gravité | Mitigation |
|---|---|---|---|
| **R1** | 🛑 **Un site survit une TROISIÈME fois** — c'est arrivé deux fois | **haute** | `D6`+`D7`+`D8` : les gardes **découvrent**, elles ne récitent plus. `CA-1` exige le rouge constaté **avant** correction, `CA-16` le vert **après** |
| **R2** | Le balayage large **noie le signal** sous des faux positifs et devient inexploitable | moyenne | **Mesuré, pas supposé** : `F17` → **1** faux positif, résorbé par reformulation (`D10`). Le prédicat narratif, qui en produit ≥ 8, est **rejeté et motivé** (`D11`) |
| **R3** | L'**allowlist devient la nouvelle liste oubliée** — le défaut reproduit sous un autre nom | **haute** | `D5` : une exemption **morte fait échouer la garde**. Elle ne peut pas pourrir en silence. `CA-6` le vérifie **en la cassant exprès** |
| **R4** | La garde balaie **zéro fichier** (mauvais chemin, exclusion trop large) et rend **vert par vacuité** | moyenne | `D6` : un scan rendant 0 fichier est un **échec explicite**. `CA-5` |
| **R5** | `G-ROUTE-4` lit le canon et **hérite d'une erreur du canon** | faible | Le canon est vérifié en place (`library/personas/helm.md:6,9` · `charon.md:6,9`) et couvert par `G-ROUTE-1`/`G-ROUTE-3`. Une garde ancrée sur un canon faux échouerait **partout**, pas silencieusement |
| **R6** | La correction des maquettes (`F13`-`F16`) est prise pour une **modification de design** | faible | `D4` : ce sont des **données de roster** dans un fichier de maquette, pas une décision visuelle. Aucun style touché. `CA-11` |
| **R7** | Le rouge de `vendor-check` **se déplace encore** et est pris pour une régression | faible | Déjà déclaré au lot précédent (`D3`/`F26` du lot de routage) ; `CA-15` exige de le **déclarer**, pas de le résoudre |
| **R8** | Travail exécuté dans `/Users/sjupin/work/iakaframe` (racine), qui porte du non-commité | **haute si déclenchée** | `D2` + étape 1, qui **arrête** le lot |
| **R9** | 🛑 **NEUF (révision) — la garde verte fait croire que le dépôt est SAIN**, alors qu'une classe entière (vitrines en langage de rôle) est **hors de portée** (`F28`, `D11` amendé) | **haute** | `D14` : le registre des angles morts **déclare la non-couverture dans l'exécutable** et **périt en miroir**. `CA-19` l'exige et le prouve en le cassant. *Une garde honnête dit aussi ce qu'elle ne voit pas.* |
| **R10** | 🛑 **NEUF (révision) — les mesures `F5`-`F16` datent d'AVANT le merge** : lignes glissées, ou sites nés des 4 commits inconnus | moyenne | `CA-1`/`CA-3` : **le compte constaté fait foi contre le § 2.2**. Avertissement en tête d'instruction. `> 8` n'est **pas** un défaut du lot |
| **R11** | 🛑 **NEUF (révision) — 6 tests skippent sur un motif faux et passent pour verts** (`F32`, `R-6`) | faible | Palliatif immédiat `IAKAFRAME_GUI_ROOT` + **déclaration des skips au commit** (`CA-18`). Correctif de fond hors lot : `GUI-PARITE-WORKTREE` → ⚒️ Gimli |

---

## 10. Critères d'acceptation

**La preuve d'abord — le rouge**

- [ ] **`CA-1`** — 🛑 Les gardes refondues ont été **VUES ROUGES sur les 8 sites** `F5`-`F9`,
      `F13`-`F15` **avant** toute correction. Le message de commit consigne **le compte par garde**
      **et la liste des `chemin:ligne`** rendus. *Sans cette trace, le lot n'est pas fini.*
- [ ] **`CA-2`** — 🛑 **La garde voit ce que les listes n'ont pas vu.** Le relevé de `CA-1` contient
      `doc/index.html:174` (`F9`), **absent de tout relevé antérieur**. *C'est la démonstration
      qu'elle balaie ; sans ce site, elle récite encore.*
- [ ] **`CA-3`** — Le compte constaté est **≥ 8**. S'il est **> 8**, ce n'est **pas** un défaut du
      lot : c'est la garde qui a raison contre le § 2.2, et les sites supplémentaires sont
      **traités** et **nommés au commit** (`D3`).

**La dé-énumération**

- [ ] **`CA-4`** — 🛑 `cli/test/route-prod.test.js` ne contient **plus aucune liste de chemins en
      dur** de fichiers à contrôler. Vérif : `ROUTAGE_A` et `ROUTAGE_B` **n'existent plus** ;
      `grep -n "library/personas/\|kits/iakaframe-" cli/test/route-prod.test.js` ne rend **que** des
      lignes de commentaire ou de message d'erreur, **aucune** donnée de test.
- [ ] **`CA-5`** — **Aucune garde ne peut être verte par vacuité** : chaque scan **assert** avoir
      trouvé ≥ 1 fichier. Vérif : renommer temporairement `library/personas/` → les gardes
      **échouent** avec un message disant *« aucun fichier trouvé »*, elles ne passent pas.
- [ ] **`CA-6`** — 🛑 **L'exemption périt.** Ajouter une exemption bidon sur un chemin **déjà
      propre** → la garde devient **ROUGE** en disant que l'exemption est **inutile**. Vérif :
      manipulation faite et **consignée** ; le test est ensuite retiré. *C'est le critère qui
      interdit l'oubli n°3.*
- [ ] **`CA-7`** — Les exemptions **effectivement présentes** sont **exactement deux chemins**
      (`D9`) et **zéro ligne** (`D10`), chacune portant ses **trois** champs : motif, condition de
      levée / ticket, portée. Vérif : relecture du bloc d'exemptions.
- [ ] **`CA-8`** — `G-ROUTE-4` **lit le canon**, elle ne le recopie pas. Vérif : changer
      temporairement `roleKey:` dans `library/personas/helm.md` → le message d'erreur de la garde
      **cite la nouvelle valeur**. Restaurer ensuite ; `git diff` sur le canon → **vide**.
- [ ] **`CA-9`** — `G-ROUTE-1` couvre désormais les **skills** (`D8`). Vérif : retirer
      temporairement `iakaframe-surveillance` de `iakaframe-skills.html` → **ROUGE**.

**Les sites**

- [ ] **`CA-10`** — Les **5 sites du groupe A** sont corrigés un par un : `iakaframe-skills.html:116`,
      `:211`, `specs/glossaire-iakaframe.md:15`, `prise-en-main-ia-iakabox.html:476`,
      `doc/index.html:174`.
- [ ] **`CA-11`** — Les **3 sites de maquette** sont corrigés (`specs/mock/gui/01-library.html:162`,
      `03-assemblage.html:222`, `:235`) — **rôle, skill et mission** de `helm` alignés sur le canon,
      **et Charon présent** dans les deux rosters de maquette. **Aucun style ni layout modifié.**
- [ ] **`CA-12`** — Les **3 lacunes d'inventaire** sont comblées : `iakaframe-skills.html` nomme
      Charon **et** `iakaframe-surveillance` (`F10`) ; `specs/glossaire-iakaframe.md` porte Charon
      dans la liste `:5` **et** dans le tableau (`F11`) ; la référence de ligne `:6` pointe la
      **plage réelle** du roster de `methode-de-travail.md` (`F12`). Vérif : relecture des trois.
- [ ] **`CA-13`** — `prise-en-main-ia-iakabox.html:476` **dit la même chose** que son jumeau déjà
      correct `docs/modeles-ia-des-agents.md:22-23` (`F4`) : rôle `surveillance` pour Helm, **et**
      une ligne Charon. Vérif : comparaison des deux tableaux.
- [ ] **`CA-14`** — 🛑 **RÉÉCRIT à la révision. `README.md` n'est PAS modifié — mais plus pour le
      motif d'avant.** L'ancienne rédaction s'appuyait sur `F22` (« *il est correct, il nomme les
      deux agents* ») : ce contenu **n'existe plus** sur `main`. Le critère devient, contre l'état
      **mergé** :
      1. `git diff --stat README.md` → **vide**. Ce lot **n'y touche pas** ; sa ligne prod a été
         réconciliée **pendant le merge** (`F29`, `README.md:227-228`) et 🏹 Legolas l'a gatée
         **fidèle au canon** (`library/roles/deploiement.md:14,19` · `surveillance.md:14-15,27`).
         **Rouvrir ce texte serait re-litiguer un point déjà tranché.**
      2. 🛑 **Et surtout — la non-modification est ici un CONSTAT DE NON-COUVERTURE, pas un satisfecit.**
         Vérif : `README.md` est **absent du relevé rouge de `CA-1`**, et il l'est **par
         construction**, pas par mérite — il ne porte **aucun** nom de persona ni de skill (`F28`).
         *Le vérifier est le seul moyen de ne pas confondre « propre » et « hors de portée ».*
      3. En conséquence, `README.md` **figure au registre des angles morts** (`D14`) — voir `CA-19`.
         *Un fichier qu'aucune garde ne peut voir doit au moins être déclaré comme tel.*

**Périmètre, dérivés, non-régression**

- [ ] **`CA-15`** — `frames/releases/StefFrame2/` **byte-identique** (`git diff --stat` → vide) ;
      `docs/guide-stefframe2.{md,html}` **non modifiés** (`D9`) ; `specs/etat-des-lieux.*` et
      `specs/.iakaframe-journal.json` **non réécrits** (`F25`).
- [ ] **`CA-16`** — 🛑 **Les CINQ gardes sont VERTES** (`G-ROUTE-1` + volet skills, `G-ROUTE-2`
      dé-énumérée, `G-ROUTE-3`, `G-ROUTE-4`, **`G-ROUTE-5`** — registre des angles morts, `D14`).
- [ ] **`CA-17`** — `G-ROUTE-3` **skippe proprement et le DIT** si `~/.claude/agents/` est absent —
      comportement **inchangé** par ce lot (`cli/test/route-prod.test.js:175-180`).
- [ ] **`CA-18`** — Dérivés **régénérés par leurs générateurs**, jamais édités : rejouer les
      générateurs → `git diff` **vide** ; `agents generate --check` = **0**. `node --test` **vert
      sur toutes les suites sauf `vendor-check`**, dont le déplacement de rouge est **déclaré au
      commit** (**`OK`, 0 dérive → 23**) avec `GUI-VENDOR-CHARON` nommé. Tout **autre** échec est un
      défaut du lot.
      **Note d'instrument (`R-6`, `F32`)** : les **6 skips de parité GUI** ne comptent **pas** comme
      des tests verts. Leur motif affiché est **faux en worktree**. Ils sont **déclarés au commit
      comme skips**, jamais silencieux.

**L'angle mort — neuf à la révision**

- [ ] **`CA-19`** — 🛑 **Le registre des angles morts existe, et il PÉRIT EN MIROIR** (`D14`).
      1. Le registre porte **exactement deux** entrées (`README.md` / vitrines en langage de rôle,
         et la prose de traversée sans jeton `deploiement`), chacune avec ses **trois** champs :
         motif, successeur (**`ROLE-VOCAB-CANON`**), portée.
      2. **La péremption inversée est prouvée en la déclenchant exprès** — même exigence que
         `CA-6`, dans l'autre sens : déclarer un angle mort sur un chemin **que le prédicat atteint
         déjà** → la garde devient **ROUGE** en disant que l'angle mort est **couvert**, donc mort.
         Vérif : manipulation faite et **consignée** ; le test est ensuite retiré.
      3. Vérif de non-régression du sens : **aucune entrée du registre ne corrige quoi que ce soit**
         — `git diff --stat` sur les chemins déclarés → **vide**. *Un angle mort qu'on « répare »
         discrètement redevient un oubli écrit une fois.*

---

## 11. Estimation — jalon P1→P2

> Ordre de grandeur **assumé et révisable**, jamais un engagement ferme. À **rappeler à la clôture
> du lot**, confronté au temps réel.

| Composante | Coût |
|---|---|
| Refonte des gardes : dé-énumération `G-ROUTE-2`, volet skills `G-ROUTE-1`, **`G-ROUTE-4` neuve canon-ancrée**, mécanisme d'exemption **périssable** | **~0,6 j-h** |
| Rouge d'abord : exécution, relevé, consignation au commit (`CA-1`-`CA-3`) | ~0,15 j-h |
| Groupe A — 5 sites de vitrine/doc | ~0,2 j-h |
| Groupe B — 3 lacunes d'inventaire (ajout de Charon aux catalogues) | ~0,15 j-h |
| Groupe C — 3 sites de maquette | ~0,1 j-h |
| Faux positif + autocitation (`D10`, `F27`) | ~0,05 j-h |
| Régénération des dérivés + `--check` | ~0,15 j-h |
| 🛑 **Registre des angles morts** (`D14`, neuf à la révision) : structure + assertion **inversée**, écrite à côté de celle de `D5` | **~0,1 j-h** |
| Contrôle des **19** `CA`, dont les **quatre** manipulations de preuve (`CA-5`, `CA-6`, `CA-8`, **`CA-19.2`**) | ~0,3 j-h |
| **Total** | **1,3 à 1,8 j-h** *(révisé de 1,2-1,7)* |

**Complexité** : **faible à moyenne**. Peu de logique, mais un **renversement** : la garde cesse de
recevoir sa vérité de l'instruction et va la chercher dans le canon. Le geste est court à écrire,
long à *croire* — d'où le poids des critères de preuve.

**Risque** : **moyen**, concentré sur `R3` — que l'allowlist devienne la nouvelle liste oubliée.
C'est exactement pourquoi `CA-6` demande de **casser l'exemption exprès** pour vérifier qu'elle
crie.

**Inconnues** — susceptibles de faire glisser l'estimation :

1. **`doc/index.html:174`** (`F9`) est une **ligne longue** que je n'ai pas ouverte caractère par
   caractère : je sais qu'elle affecte le déploiement à Helm, je ne sais pas si le fichier porte
   **d'autres** occurrences du même défaut dans des blocs de code ou des arborescences d'exemple
   (`:160` est une autre occurrence de `helm`, non qualifiée). → **+0,1 j-h** si le fichier en porte
   plusieurs.
2. **Le compte de `CA-1` peut dépasser 8.** Mes deux relevés ont été **tronqués par pagination** au
   moment de la mesure ; j'ai vérifié individuellement chaque site déclaré, mais **je n'ai pas la
   preuve qu'il n'en existe pas d'autres** dans les familles non listées (`kits/*/AGENTS.md`,
   `kits/*/MODELES.md`, `specs/equipe-agents.md`, `BACKLOG.md` — tous **verts** sur les
   échantillons lus). C'est assumé et c'est le rôle de `CA-3` : **la garde tranche, pas ce §.**
   → **+0,1 à +0,3 j-h** par tranche de 3 sites supplémentaires.
3. **Le format d'exemption périssable** (`D5`) n'a pas d'équivalent dans le dépôt : c'est un motif
   neuf. S'il demande plus qu'une structure de données et une assertion inversée, → **+0,2 j-h**.
4. 🛑 **LEVÉE — et elle s'est réalisée.** J'écrivais « *si `feat/correctif-routage-prod-vers-charon`
   est fusionnée entre ce cadrage et l'exécution, l'étape 1 change de cible — **sans coût**, mais à
   vérifier* ». **Elle l'a été.** Et le « sans coût » était **faux** : le merge a emporté **4
   commits inconnus de la pile**, dont une **refonte du README**, qui a **périmé `F22`** et
   **invalidé `CA-14`** (`F28`, `F29`). *La leçon est celle du lot lui-même, retournée contre moi :
   j'avais traité comme une formalité un changement de base — c'est-à-dire un **instantané qui
   vieillit**.* → **+0,1 j-h** de re-mesure au démarrage (`R10`), déjà absorbé dans la fourchette.
5. 🛑 **NEUF — l'état mergé peut porter des sites que je n'ai pas mesurés.** Mes relevés `F5`-`F16`
   sont **pré-merge** ; les 4 commits inconnus n'ont **pas** été soumis aux prédicats.
   → **+0,1 à +0,3 j-h** par tranche de 3 sites supplémentaires (même barème que l'inconnue 2).
   `CA-3` **couvre déjà ce cas** : la garde tranche.

---

## 12. Jalon — gate P1→P2

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|

   GARDE BALAYANTE - ROUTAGE PROD
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 **Gandalf** (Cadrage, P1) | `specs/instructions/garde-balayante-routage-prod.md` — **32 faits mesurés**, **14 décisions**, **19 critères**. Établit que le compte des survivants est faux **pour la troisième fois** (**8 sites + 3 lacunes**, contre 3 / 4 / 5 annoncés), exhibe **un site inédit** (`doc/index.html:174`), **mesure** le coût en faux positifs des deux prédicats candidats (**1** contre **≥ 8**) et pose le mécanisme qui **interdit l'oubli n°3** : l'exemption vit dans la garde et **périme**. 🛑 **Révisé sur l'état mergé** : `CA-14` réécrit, `D11` élargi à une **classe** de défauts, **`D14`** neuf (registre des **angles morts**, périssable **en miroir**). **Estimation : 1,3 à 1,8 j-h** | **L'utilisateur (Stéphane) — décideur.** Gate **humain** |

**Fichiers à vérifier avant validation** (`chemin:ligne`) :

- 🛑 La garde qui récite au lieu de balayer : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/cli/test/route-prod.test.js:110`
- …et l'en-tête qui affirme le contraire : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/cli/test/route-prod.test.js:11`
- …face à celle qui balaie vraiment, et qui sert de patron : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/cli/test/route-prod.test.js:71`
- 🛑 Le site inédit qu'aucun relevé n'avait vu : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/doc/index.html:174`
- L'exclusion écrite mais jamais exécutée : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/specs/instructions/scission-squad-prod-charon-helm.md:796`
- …que le gate d'alors soupçonnait déjà d'être un oubli : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/specs/instructions/scission-squad-prod-charon-helm.md:808`
- Le canon sur lequel `G-ROUTE-4` s'ancre : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/library/personas/helm.md:6` et `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/library/personas/charon.md:6`
- La correction qui existe déjà et qu'il suffit de propager : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/docs/modeles-ia-des-agents.md:22` vs `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/prise-en-main-ia-iakabox.html:476`
- Le catalogue qui ignore la moitié du squad prod : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/iakaframe-skills.html:116`
- Le glossaire canonique, faux **et** incomplet : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/specs/glossaire-iakaframe.md:15`

**Ajouts de la révision** — à vérifier sur l'état **mergé**, pas sur mon worktree :

- 🛑 Le site réconcilié au merge, **que rien ne verrouille** (`R-5`) : `/Users/sjupin/work/iakaframe/.claude/worktrees/merge-main/README.md:227`
- …fidèle au canon, vérifié par Legolas : `/Users/sjupin/work/iakaframe/.claude/worktrees/merge-main/library/roles/deploiement.md:14` et `/Users/sjupin/work/iakaframe/.claude/worktrees/merge-main/library/roles/surveillance.md:14`
- 🛑 La preuve qu'aucun prédicat ne peut l'atteindre — **un tableau de rôles, zéro nom d'agent** : `/Users/sjupin/work/iakaframe/.claude/worktrees/merge-main/README.md:220`
- 🛑 La preuve qu'aucune chaîne canonique n'existe pour l'ancrer (« Réalisation » ≠ `key: dev` ≠ `label`) : `/Users/sjupin/work/iakaframe/.claude/worktrees/merge-main/library/roles/dev.md:3`
- L'artefact de worktree qui neutralise 6 tests en silence (`R-6`) : `/Users/sjupin/work/iakaframe/.claude/worktrees/cadrage-balayante/cli/test/frontmatter-schema-parity.test.js:62` et son motif trompeur `.../frontmatter-schema-parity.test.js:71`

---

## Statut

**PROPOSÉ — en attente de validation du décideur.** **QUATRE** points appellent un oui explicite.

> 🛑 Les **trois premiers étaient déjà en attente avant la révision** et **le restent** : ils
> **n'ont pas été validés** par la coordination, qui les remonte au décideur. Le **quatrième** est
> **né de la révision**.

1. **`D4`** — **aucun** site survivant n'est déclaré hors périmètre : les **8** sont traités,
   maquettes comprises. L'alternative — reconduire l'exclusion du `CA-20(e)` — reviendrait à
   **ratifier l'oubli** qui l'a produite.
2. **`D11`** — le balayage **narratif** (« Helm ∧ traversée ») est **rejeté**, mesure à l'appui
   (≥ 8 faux positifs de trois causes légitimes). Le balayage retenu est celui de l'**affectation**
   rôle/skill, qui attrape 8 défauts sur 8 pour **1** faux positif. C'est un **choix de couverture** :
   une prose comme « *la mise en prod est un squad séparé (🌉 Helm) sur ton feu vert* » — le défaut
   corrigé à `prise-en-main-ia-iakabox.html:435` au lot précédent — **ne serait pas attrapée** par la
   garde retenue.
   🛑 **AGGRAVÉ à la révision, et c'est le point sur lequel je demande le oui le plus explicite** :
   ce n'est **pas un cas**, c'est une **CLASSE** — *les formulations en langage de rôle échappent
   par construction* (`D11` amendé, `F28`/`F31`). **J'assume le trou et je refuse d'ouvrir un
   troisième prédicat dans ce lot**, pour un motif mesuré : **aucune chaîne canonique n'existe pour
   l'ancrer** (« Réalisation » n'est ni le `key` ni le `label` de `dev`, et ne figure nulle part
   dans `library/**`) — l'écrire aujourd'hui exigerait une **table de synonymes**, c'est-à-dire de
   réintroduire l'énumération au cœur de la garde neuve. Le trou part en successeur nommé
   **`ROLE-VOCAB-CANON`** et en entrée de registre (`D14`).
3. **`D5`** — le mécanisme d'exemption **périssable** est un motif **neuf** dans le dépôt : une
   exemption devenue inutile **fait échouer la garde**. C'est ce qui distingue ce lot d'un troisième
   rattrapage.
4. 🛑 **`D14` (NEUF à la révision) — le registre des ANGLES MORTS**, et le coût qu'il ajoute
   (**+0,1 j-h**, total **1,3-1,8**). Il répond à `R-5` et à l'amendement de `D11` : le dispositif
   **déclare dans l'exécutable ce qu'il ne voit pas**, et cette déclaration **périt en miroir**
   (un angle mort devenu couvert fait échouer la garde). **C'est un ajout à un cadrage déjà
   dense** — Stéphane peut légitimement le couper. S'il le coupe, `R-5` et le trou de `D11`
   retombent dans un **texte d'instruction**, c'est-à-dire **exactement la forme qui a produit
   l'oubli n°1 et l'oubli n°2** (`CA-20(e)`). Je le signale sans le décider.

### Hors périmètre — explicitement, et avec un titulaire

> Aucun de ces points n'est laissé orphelin. C'est la contrepartie directe de `D5`/`D14` : *une
> exclusion sans destinataire est un oubli qui a été écrit une fois.*

| Objet | Renvoyé à | Porté par |
|---|---|---|
| **`ROLE-VOCAB-CANON`** — verrouiller `README.md:227-228` et, au-delà, **toute vitrine rédigée en langage de rôle** (`R-5`, `F28`/`F30`/`F31`) | lot **amont** : canoniser un libellé de rôle destiné à la doc, puis contrôle d'**arité** | 🧙 **Gandalf** (cadrage) |
| **`GUI-PARITE-WORKTREE`** — 6 skips de parité GUI au motif faux en worktree (`R-6`, `F32`) | correctif d'**instrument**, hors routage | ⚒️ **Gimli** — palliatif immédiat : `IAKAFRAME_GUI_ROOT` |
| **`GUI-VENDOR-CHARON`** — dérive `vendor-check` (**`OK`, 0 dérive → 23**) | autre dépôt, successeur déjà nommé | ⚒️ **Gimli** (dépôt GUI) |
| **`ROLEKEY-HELM`** — `cli/src/lib/agents.js:43` | dossier `decision-rolekey-reconciliation.md` | déjà instruit |
| **`RESYNC-SF2`** — `docs/guide-stefframe2.{md,html}` | exemption **portée par la garde**, avec condition de levée (`D9`) | ⚒️ **Gimli**, à la levée |
| **Dette de tagging** (`v0.20.4` vs `0.39.0`) | sans rapport avec le routage | 🤝 **Aragorn** (coordination) |

---


## 13. Relevé d'exécution — ⚒️ Gimli (P2), 2026-08-16

> Base réelle : worktree `/Users/sjupin/work/iakaframe/.claude/worktrees/garde-balayante`,
> branche `feat/garde-balayante-routage-prod`, issue de `main` à jour (`b6b500d`) — **et non**
> le worktree `cadrage-balayante` de `D2`, dont la base était antérieure au merge des trois lots.
> Étape 1 vérifiée dans son esprit : `node --test cli/test/route-prod.test.js` **vert 3/3** avant
> toute écriture.

### 13.0 🛑 TROIS ARBITRAGES DE COORDINATION — leur provenance est un fait du lot

> 🛑 **Ils sont désormais QUATRE.** Un **quatrième** — **(d)**, *le balayage ne descend pas dans
> ce que git ignore* — a été pris à la **reprise sur `FAIL`** du gate qualité, et il est consigné
> au **§ 15**, avec les mêmes exigences de provenance et de réversibilité. Le présent § garde son
> titre d'origine parce qu'il **date** : il consigne l'état à la remise. *Une trace ne se réécrit
> pas ; elle se complète et se renvoie.*

> **Ces trois décisions sont celles de la COORDINATION, prises sous autonomie déléguée. Ce ne
> sont PAS les arbitrages du décideur : il ne les a pas énoncés.** Elles sont inscrites ici, et
> dans l'exécutable, **comme telles — réversibles s'il les reprend**. Ce qui est de lui, et sur
> quoi elles s'appuient : **`D4`, `D5`, `D11`, `D14`**, arbitrés en bloc.
>
> C'est une exigence d'**attribution**, pas une formule de politesse : le lot précédent a montré
> ce que coûte une source maquillée.

| # | Point | Décision | Où elle vit |
|---|---|---|---|
| **(a)** | `D6` niveau B mordait sur le **canon** (21 lignes rouges, **0 défaut**) | **EXEMPTER LE CANON** — exemption **périssable** au sens de `D5`, **scopée au seul niveau B** | `cli/test/route-prod.test.js:106` |
| **(b)** | La clause **symétrique** de `D7` (`charon` ← `surveillance`) | **ABANDONNÉE** — **mesurée avant d'être écartée** | `cli/test/route-prod.test.js:290` |
| **(c)** | Le **volet skills** de `D8` mordait sur **`BACKLOG.md`** — la contradiction remontée au § 14.1 | **EXEMPTER `BACKLOG.md`** au titre de `D5`, **scopée au seul volet skills**, avec **deux motifs** et une **condition de levée datable** | `cli/test/route-prod.test.js:137` · péremption `:415` |

**(c) — et le diagnostic n'est PAS celui que j'avais posé.** Le § 14.1 parlait d'une « **omission
de niveau fichier** ». **C'était inexact, et je le corrige plutôt que de le reconduire.** La garde
rend :

```
BACKLOG.md -> nomme iakaframe-surveillance mais JAMAIS iakaframe-deploiement (skills)
```

Le **sens est inversé** par rapport à une lacune d'inventaire : `BACKLOG.md:32` nomme
`skills/iakaframe-surveillance/SKILL.md` **comme un chemin de fixture manquante** de l'entrée
`GUI-VENDOR-CHARON` — **pas** comme une entrée de catalogue.

**Motif 1 — faux positif de PORTÉE, et c'est le motif principal.** `D8` a été conçu sur
`F10`/`F16`, c'est-à-dire sur les **catalogues** qui ignorent l'existence de la skill née de la
scission. **`BACKLOG.md` n'est pas un catalogue** : c'est un backlog qui **cite un chemin de
fichier**. Le « remède d'une ligne » que j'envisageais consisterait à insérer
`iakaframe-deploiement` **artificiellement**, pour satisfaire une garde et non pour dire quelque
chose de vrai — **c'est précisément le coût que `D11` a refusé de payer**, et que **(b)** vient
d'écarter sur mesure.

**Motif 2 — subordonné, mais réel.** Le fichier est en cours de modification par le décideur
(**+75 / −16** sur `feat/sauvegarde-portefeuille`, mesuré au § 14.1). Y écrire créerait un conflit
avec son travail. **Ce motif seul n'aurait pas justifié une exemption** — il aurait justifié un
**différé**. C'est le motif 1 qui fonde l'exemption ; le motif 2 explique pourquoi on ne la
contourne pas.

**Condition de levée, écrite dans la garde** : l'exemption tombe quand `BACKLOG.md` cesse de citer
un chemin portant un nom de skill — concrètement **à la clôture de `GUI-VENDOR-CHARON`**, quand
l'entrée `:32` et sa liste de fixtures disparaîtront du backlog. **L'exemption périra donc d'elle-
même**, et `D5` fera crier la garde à ce moment-là. *C'est le mécanisme, pas un contournement.*

**Ce que cette décision N'EST PAS** : elle ne viole **pas** `D4` (« les 8 sites traités, aucun
déclaré hors périmètre »), arbitré par le décideur. **`BACKLOG.md` n'est pas l'un des 8 sites** —
c'est une capture de `D8` née de l'élargissement du § 7. **Les 8 sites restent traités**, et le
relevé § 13.1 le prouve chiffre en main.

**Conséquence d'exécutable, notée franchement** : la portée de registre `G-ROUTE-1/skills` n'avait
**aucun chemin de péremption câblé** — `exemptionsMortes()` n'était appelée que pour `G-ROUTE-2/B`
et pour `*`. Une entrée y aurait été **exemptante sans jamais être périssable**, c'est-à-dire
**exactement l'exception écrite qui ne peut pas pourrir bruyamment** que `D5` existe pour
interdire. L'appel a donc été ajouté dans `G-ROUTE-1`, et `rougeurResiduelle()` mesure désormais
**chaque portée avec son propre prédicat**. **Prouvé en le cassant exprès** (cf. `CA-6`, second
tir).

**(a) — pourquoi l'exemption, et pas les deux autres issues.** Les trois issues ne se valent
pas. *Restreindre la population* réintroduirait une énumération partielle, **contre `D6`** —
soigner le mal par le mal. *Relâcher la règle* perdrait de la couverture réelle pour un problème
qui **n'est pas** de couverture. Reste l'exemption, et elle n'est pas dangereuse **ici
précisément** : `D5` la rend **périssable**, et une exemption devenue inutile **fait échouer la
garde**. Le « la nouvelle liste oubliée » que redoute `R3` est **exactement** ce que `D5` a été
conçu pour empêcher — on utilise le mécanisme qu'on vient de se donner plutôt que de le
contourner.

L'entrée **porte sa raison** et **nomme sa portée** : elle couvre `library/personas/helm.md`
**et son golden** `cli/test/fixtures/agents-golden/helm.md`, **parce qu'une persona de référence
DÉCRIT un rôle au lieu de l'ATTRIBUER**. Le niveau B est une règle d'**attribution** : elle vaut
pour un artefact qui **adresse** la traversée. Le canon, lui, décrit le poste — y compris en
disant ce que Helm ne fait **plus** (« *il ne bascule ni ne rollback* »), ce que `CA-12` du lot
de scission a **exigé** de conserver.

**Conséquence de forme, notée franchement** : l'exemption n'est pas de chemin **nu**, elle est
de **chemin + garde**. On n'exempte jamais un **fichier**, on exempte un fichier **d'un
prédicat** — le canon reste pleinement balayé par `G-ROUTE-1` et `G-ROUTE-4`, et il y est vert.
Sa péremption se mesure **avec le prédicat de la garde exemptée**, jamais avec celui d'une
autre, sans quoi elle serait déclarée morte pour un motif faux.

**(b) — deux motifs indépendants, chacun suffirait.**

| Direction du prédicat | Défauts attrapés | Faux positifs |
|---|---|---|
| `helm` ← rôle/skill de **traversée** (mesurée par `F17`) | **8 / 8** | **1** |
| `charon` ← rôle/skill de **veille** (**jamais mesurée** avant ce lot) | 🛑 **0 / 8** | 🛑 **6** |

1. **La mesure.** `0` capture sur 8, `6` faux positifs — le profil **exact** que `D11` a écarté,
   et le décideur a dit oui à `D11` **en connaissance de cause**. Appliquer son propre critère à
   cette donnée neuve **disqualifie la clause**. Les 6 sont d'une **cause unique** : la prose qui
   **énumère** les artefacts nés de la scission est lexicalement indiscernable, ligne à ligne,
   d'une affectation. C'est la cause `F21`, que `D11` déclare **légitime**.
2. **La contradiction dure.** `kits/iakaframe-openwebui/models/helm.json:47` est l'artefact de
   Helm lui-même, dont `G-ROUTE-1` **exige** qu'il nomme Charon ; la clause symétrique
   **punirait** de l'avoir fait. **Deux gardes qui s'annulent ne protègent rien** : elles
   fabriquent du bruit et usent la confiance.

**L'ancrage canon est intact** : seul le **sens** est déclaré (`PORTEUR_TRAVERSEE`) ; les
**valeurs** (`deploiement`, `iakaframe-deploiement`) restent **lues dans le frontmatter à
l'exécution**. `CA-8` le prouve : renommer `roleKey: deploiement` → `traversee` dans le canon
fait citer **la nouvelle valeur** par le message d'erreur.

### 13.1 🛑 Le relevé ROUGE **re-consigné** — comptes **post-décision (c)** (`CA-1`, `CA-2`, `CA-3`)

> **Ce relevé remplace les deux précédents.** Il n'est pas recopié : il a été **re-mesuré sur le
> disque**, en soumettant l'**arbre pré-correction `3647cca`** (extrait par `git archive`, hors
> dépôt, en lecture seule) aux **gardes telles qu'elles sont après (a), (b) ET (c)**. C'est la
> seule façon honnête de dire ce que les trois arbitrages ont, ou n'ont pas, coûté en couverture
> réelle — et de ne pas **diluer la preuve de `CA-1`** derrière trois décisions successives.

| Garde | Verdict | **Avant** (a)/(b) | **Après** (a)/(b) | 🛑 **Après (c)** |
|---|---|---|---|---|
| `G-ROUTE-1` — réciprocité persona **+ skills** | 🔴 **ROUGE** | 11 fichiers | 11 fichiers | **10 fichiers** — `BACKLOG.md` seul retiré |
| `G-ROUTE-2` — attribution, populations découvertes | 🟢 **VERT** | 21 sites (0 en A, 21 en B) | 0 site | **0 site — INCHANGÉ** |
| `G-ROUTE-3` — contrats déployés | 🟢 **VERT** | 0 | 0 | **0 — INCHANGÉ**, pas de skip |
| `G-ROUTE-4` — affectation, canon-ancrée | 🔴 **ROUGE** | 19 touches / **15** lignes | 11 touches / 9 lignes | **11 touches / 9 lignes — INCHANGÉ** |
| `G-ROUTE-5` — registre des angles morts | 🟢 **VERT** | 2 entrées, 0 couverte | 2 entrées, 0 couverte | **2 entrées, 0 couverte — INCHANGÉ** |

**Ce que (c) a coûté, exactement : un fichier sur une garde, zéro site de défaut.** `G-ROUTE-1`
passe de 11 à 10 ; les quatre autres gardes ne bougent pas d'un chiffre. L'exemption est **scopée
au volet skills** : `BACKLOG.md` reste **pleinement balayé** par `G-ROUTE-4` — *on n'exempte jamais
un fichier, on exempte un fichier d'un prédicat.*

**🛑 `CA-1` / `CA-3` — LES 8 SITES ÉTAIENT ROUGES, ET ILS LE RESTENT APRÈS LES TROIS ARBITRAGES.**
Relevé intégral de `G-ROUTE-4` sur l'arbre pré-correction, **avec les gardes d'aujourd'hui** — 11
touches sur 9 lignes, sur **674 fichiers texte balayés**, hors **5 chemins exemptés** :

| # | `chemin:ligne` | Association rendue | Réf. |
|---|---|---|---|
| 1 | `doc/index.html:174` | `helm` ← `deploiement` | **`F9`** — le site **inédit** |
| 2 | `iakaframe-skills.html:116` | `helm` ← `deploiement` **et** ← `iakaframe-deploiement` | `F5` |
| 3 | `iakaframe-skills.html:211` | `helm` ← `iakaframe-deploiement` | `F6` |
| 4 | `prise-en-main-ia-iakabox.html:476` | `helm` ← `deploiement` | `F8` |
| 5 | `specs/glossaire-iakaframe.md:15` | `helm` ← `deploiement` | `F7` |
| 6 | `specs/mock/gui/01-library.html:162` | `helm` ← `deploiement` **et** ← `iakaframe-deploiement` | `F13` |
| 7 | `specs/mock/gui/03-assemblage.html:222` | `helm` ← `deploiement` | `F14` |
| 8 | `specs/mock/gui/03-assemblage.html:235` | `helm` ← `deploiement` | `F15` |
| — | `cli/test/library.test.js:217` | **faux positif PRÉVU** (`F17`/`D10`) | résorbé étape 7 |

**Aucun des trois arbitrages n'a mangé de couverture réelle.** Les 8 sont là, un par un, sous la
garde telle qu'elle est livrée. **`CA-2`** : `doc/index.html:174` figure au relevé — *la garde voit
ce que trois relevés successifs n'ont pas vu.*

Et le relevé `G-ROUTE-1` post-(c) sur le même arbre, **10 fichiers**, tous traités depuis :
`agents-golden/charon.md` · `agents-golden/helm.md` · `cli/test/parite-skills.test.js` ·
`cli/test/vendor-check.test.js` · `iakaframe-chapeau.html` · `iakaframe-skills.html` ·
`library/personas/charon.md` · `library/personas/helm.md` ·
`library/skills/iakaframe-fabrication/SKILL.md` · `specs/mock/gui/01-library.html`.
**`BACKLOG.md` en est absent — et il l'est par exemption DÉCLARÉE, pas par mérite.**

- **`G-ROUTE-2`** : la chute 21 → 0 est imputable à **(a)**, et à elle seule. Les 21 sites se
  répartissaient sur **deux fichiers** — le canon (11) et son golden (10) — et **aucun n'était un
  défaut**. Les 2 artefacts de kit qui composaient `ROUTAGE_B` étaient et restent **verts**.
- **`G-ROUTE-4`** : la chute 19 → 11 est imputable à **(b)**, et à elle seule. Les **6 faux
  positifs** de la clause symétrique ont disparu : `BACKLOG.md:32`, `:33`,
  `cli/src/lib/vendor.js:77`, `:84`, `cli/test/parite-skills.test.js:40`,
  `kits/iakaframe-openwebui/models/helm.json:47`. Il ne reste **qu'un** faux positif, et c'est
  celui que le cadrage **prévoyait** : `cli/test/library.test.js:217` (`F17`/`D10`), résorbé à
  l'étape 7.
- **`G-ROUTE-1`** : **(b) ne la touche pas**, et c'est voulu — la réciprocité reste **symétrique**,
  c'est une règle de niveau **fichier**, pas une règle d'affectation ligne à ligne. Seule **(c)**
  la fait bouger, de **11 → 10**, sur le **seul** `BACKLOG.md`.

### 13.2 `G-ROUTE-4` — les 9 lignes rendues **après (a), (b) et (c)**, une par une

> Détail du tableau de `CA-1` ci-dessus, avec le sort de chaque site. **Re-vérifié à la
> re-mesure post-(c)** : la liste est identique — **(c) ne touche pas `G-ROUTE-4`**.

**Les 8 sites de DÉFAUT** (tous attendus, tous trouvés, tous traités) :

| `chemin:ligne` | Association rendue | Réf. | Traité |
|---|---|---|---|
| `doc/index.html:174` | `helm` ← `deploiement` | **`F9`** — le site inédit | groupe A |
| `iakaframe-skills.html:116` | `helm` ← `deploiement` **et** ← `iakaframe-deploiement` | `F5` | groupe A |
| `iakaframe-skills.html:211` | `helm` ← `iakaframe-deploiement` | `F6` | groupe A |
| `prise-en-main-ia-iakabox.html:476` | `helm` ← `deploiement` | `F8` | groupe A |
| `specs/glossaire-iakaframe.md:15` | `helm` ← `deploiement` | `F7` | groupe A |
| `specs/mock/gui/01-library.html:162` | `helm` ← `deploiement` **et** ← `iakaframe-deploiement` | `F13` | groupe C |
| `specs/mock/gui/03-assemblage.html:222` | `helm` ← `deploiement` | `F14` | groupe C |
| `specs/mock/gui/03-assemblage.html:235` | `helm` ← `deploiement` | `F15` | groupe C |

**Le seul faux positif restant** — et il était **prévu** :

| `chemin:ligne` | Prévu par le cadrage ? | Traitement |
|---|---|---|
| `cli/test/library.test.js:217` | ✅ **oui** — `F17`/`D10` | reformulation, étape 7. **Zéro exemption ajoutée.** |

*(Deux autocitations résorbées **avant** figeage, `F27`, même discipline que `:94` : mon propre
tableau de mesure de (b) mettait `helm` et `deploiement` sur une même ligne — `route-prod.test.js:263`
est sorti rouge au premier tir. Et ma propre rédaction de `library/personas/helm.md:37` est sortie
rouge par **césure de ligne** — `F20` qui me mord. **Reflowées, jamais auto-exemptées.**)*

### 13.3 `G-ROUTE-1` volet skills — les 11 fichiers, et ce qu'ils sont devenus

| `chemin` | Nature | Sort |
|---|---|---|
| `iakaframe-skills.html` | **`F10`**, § 7 | ✅ groupe B |
| `specs/mock/gui/01-library.html` | **`F16`**, § 7 | ✅ groupe C |
| `iakaframe-chapeau.html` | **inédit**, même nature que `F10` | ✅ **§ 7 élargi** |
| `library/skills/iakaframe-fabrication/SKILL.md` | **inédit**, même nature | ✅ **§ 7 élargi** |
| `library/personas/charon.md` | **le CANON** | ✅ **§ 7 élargi** |
| `library/personas/helm.md` | **le CANON** | ✅ **§ 7 élargi** |
| `cli/test/fixtures/agents-golden/charon.md` | dérivé du canon | ✅ **régénéré** |
| `cli/test/fixtures/agents-golden/helm.md` | dérivé du canon | ✅ **régénéré** |
| `cli/test/parite-skills.test.js` | commentaire de compteur | ✅ **§ 7 élargi** |
| `cli/test/vendor-check.test.js` | commentaire de cardinal | ✅ **§ 7 élargi** |
| **`BACKLOG.md`** | 🛑 **pas un catalogue — un backlog CITANT un chemin de fixture** | 🛑 **EXEMPTÉ (`D5`), arbitrage (c)** — non modifié |

**Post-(c) : 10 fichiers rendus, pas 11.** `BACKLOG.md` sort du relevé par **exemption déclarée**,
portant ses trois champs et une **condition de levée datable** (clôture de `GUI-VENDOR-CHARON`).
**Il n'est pas devenu propre : il est déclaré.** La différence est tout l'objet du lot.

### 13.4 Élargissement du § 7 — **déclaré, fichier par fichier**

Le § 7 se dit « exhaustif » mais **prévoit sa propre faillibilité** : « *si un fichier manque
ici, les gardes le diront — c'est, cette fois, mécaniquement vrai* ». **Elles l'ont dit.**

| Fichier ajouté au § 7 | Motif | Commit |
|---|---|---|
| `library/personas/charon.md` | `D8` — nomme sa propre skill, jamais celle de son jumeau | `e610091` |
| `library/personas/helm.md` | idem, en miroir | `e610091` |
| `iakaframe-chapeau.html` | **`F10` qui ne disait pas son nom** — une seule ligne « Déploiement prod » finissant par « *Puis surveille.* », l'ancien poste **unique** mot pour mot | `e610091` |
| `library/skills/iakaframe-fabrication/SKILL.md` | **`F10` qui ne disait pas son nom** — renvoie la prod à `iakaframe-deploiement` seule, muet sur la veille | `e610091` |
| `cli/test/parite-skills.test.js` | commentaire de compteur ne connaissant qu'une moitié du squad | `e610091` |
| `cli/test/vendor-check.test.js` | commentaire de cardinal, idem | `e610091` |
| `cli/test/fixtures/skills-golden/manifest.json` | 🛑 **dérivé absent du § 7.D** — révélé par le test `C20`, qui **nomme lui-même** son générateur | `411221f` |

**Le § 7.D est incomplet, et c'est mesuré** : le dépôt compte **4 générateurs de dérivés**
(`gen-agents-golden`, `gen-methode-vitrine`, `gen-skills-golden`, `gen-models-doc`) ; l'étape 8 en
cite **2**. *C'est la démonstration du lot en petit, et sur moi cette fois : un inventaire est un
instantané, une garde est un régime permanent.*

> 🛑 **Rectification de ce § par moi-même, à la reprise.** J'y comptais **5** générateurs, en
> rangeant `cli/scripts/bundle.js` avec les autres. **`bundle.js` n'est pas un générateur de
> dérivé** : c'est un **prepack** de publication, qui écrit dans un répertoire **gitignoré**. Le
> rejouer **ne prouve aucune idempotence** — il **fabrique** au contraire un site rouge. Détail et
> conséquence mesurés au § 14.3(8). *Mon propre inventaire des générateurs était, lui aussi, un
> instantané.*

### 13.5 Mesures finales

| Mesure | Résultat |
|---|---|
| Suite complète (`cd cli && node --test`, **deux** variables `R-6`) | 🛑 **644 tests — 643 pass — 0 fail — 1 skip** |
| **Les CINQ gardes** (`node --test test/route-prod.test.js`) | 🟢 **5 / 5 VERTES** (`CA-16`) |
| Le **skip** | `recall : moteur ripgrep si rg est installe` — **légitime** (`rg` absent du poste) |
| `agents --action generate --global --check` | **exit 0** — « *deployé == source-généré (aucune dérive)* », 10/10 |
| **Rejeu des 4 générateurs de dérivés** (`gen-agents-golden`, `gen-methode-vitrine`, `gen-skills-golden`, `gen-models-doc`) | `git status` ne rend que mes deux fichiers en cours d'édition — **`git diff` VIDE partout ailleurs**, idempotence prouvée |
| 🛑 **`bundle.js` — RECLASSÉ, et il a révélé quelque chose** | Ce n'est **pas** un générateur de dérivé : c'est un **prepack** qui copie `library/`, `kits/`, `methods/` dans `cli/_bundled/` (**gitignoré**) pour le tarball publié. **Le § 13.4 le comptait à tort parmi les « 5 générateurs ».** Cf. § 14.3(8) |
| `vendor-check` (`GUI-VENDOR-CHARON`, hors lot) | **DÉRIVE — 24 fixtures / 82**, et non 23 |
| **D'où vient le `+1`** (déclaré, non résolu) | `skills/iakaframe-fabrication/SKILL.md`, **et lui seul** — établi par différence de jeux : `main` → 23, branche → 24, `comm` sur les deux relevés rend **une** entrée ajoutée, **zéro** retirée |

**`R-6` / `F32` — les skips, déclarés (`CA-18`).** Le palliatif demande **DEUX** variables :
`IAKAFRAME_GUI_ROOT=/Users/sjupin/work/iakaFrameGUI` **et**
`IAKAFRAME_CORE_VOCAB=/Users/sjupin/work/iakaFrameGUI/packages/core/src/vocab.json`. Sans les
deux : **7 skips**. Avec : **1 skip**, le seul légitime. Les **6 tests de parité GUI récupérés
sont VERTS**. Correctif de fond hors lot : `GUI-PARITE-WORKTREE`, titulaire ⚒️ Gimli.

**`R7` / `CA-15` — le rouge de `vendor-check` s'est DÉPLACÉ ENCORE, et c'est de mon fait** :
**24** et non 23. **Le `+1` est sourcé, en une ligne, pour que `GUI-VENDOR-CHARON` parte juste** :
c'est `skills/iakaframe-fabrication/SKILL.md`, dont j'ai ajouté la mention de
`iakaframe-surveillance` à `e610091` (élargissement du § 7) et dont la **fixture vendorée côté GUI
n'a pas suivi**. Établi par **différence de jeux**, pas par déduction : la même commande sur `main`
rend **23**, sur la branche **24**, et le `comm` des deux relevés rend **exactement une** entrée
ajoutée et **aucune** retirée. **La liste des 4 `fixture-manquante` d'origine est intacte** —
`personas/charon.md`, `agents-golden/charon.md`, `roles/surveillance.md`,
`skills/iakaframe-surveillance/SKILL.md` — et le `+1` est un **`contenu-different`**, pas une
cinquième fixture manquante. **Déclaré, non résolu** (`CA-15` demande de déclarer le déplacement,
pas de le corriger) — c'est exactement ce que `R7` prévoyait.

### 13.6 🛑 Les critères d'acceptation — `CA-1` → `CA-19`, atteints / NON atteints, avec motif

> **Deux écarts sont déclarés, et un seul l'est vraiment.** `CA-7` est en **écart assumé** ;
> `CA-19` porte une **note de portée**. Aucun n'est coché en douce.

**Atteints — 18 sur 19**

| `CA` | État | Preuve |
|---|---|---|
| `CA-1` | ✅ | Relevé **re-mesuré**, pas recopié : arbre pré-correction `3647cca` soumis aux gardes **post-(a)(b)(c)** → **11 touches / 9 lignes**, `chemin:ligne` listés § 13.1 |
| `CA-2` | ✅ | `doc/index.html:174` (`F9`) figure au relevé — **absent de tout relevé antérieur** |
| `CA-3` | ✅ | Compte constaté = **8 sites de défaut**, ≥ 8. Ni les trois arbitrages ni le merge n'en ont ajouté ni retiré |
| `CA-4` | ✅ | `ROUTAGE_A`/`ROUTAGE_B` **n'existent plus** qu'en commentaire (`route-prod.test.js:6`, `:433`). `grep -n "library/personas/\|kits/iakaframe-"` rend **3 lignes** : deux commentaires (`:109`, `:315`) et **une portée d'exemption** (`:123`), que `D5` **impose** de nommer. **Aucune population contrôlée** |
| `CA-5` | ✅ | Prouvé **deux fois** : renommer `library/personas/` → *« canon introuvable »* ; exclure la population → *« aucun artefact … est un ECHEC, jamais un succès silencieux »* |
| `CA-6` | ✅ | Prouvé **deux fois**, la seconde ce jour sur la portée **neuve** : exemption bidon sur `CLAUDE.md` en portée `G-ROUTE-1/skills` → **ROUGE**, *« exemption MORTE sur [CLAUDE.md] … SEUL REMEDE : SUPPRIMER L'ENTREE »*. Test de preuve **retiré**, aucun résidu |
| `CA-8` | ✅ | `roleKey: deploiement` → `traversee` dans le canon → le message cite **`« traversee »`**. Restauré, `git diff` sur `library/personas/` **vide** |
| `CA-9` | ✅ | Retrait de `iakaframe-surveillance` d'`iakaframe-skills.html` → **ROUGE**. Restauré |
| `CA-10` | ✅ | **5 sites du groupe A** corrigés un par un (`0171790`) |
| `CA-11` | ✅ | **3 sites de maquette** corrigés (`91f339d`), Charon présent dans les deux rosters. **Aucun style ni layout modifié** — cf. § 14.3(1) |
| `CA-12` | ✅ | **3 lacunes d'inventaire** comblées (`3fc2b7a`) : Charon + `iakaframe-surveillance` au catalogue, glossaire `:5` et tableau, plage de référence rectifiée |
| `CA-13` | ✅ | `prise-en-main-ia-iakabox.html:476` aligné sur `docs/modeles-ia-des-agents.md:22-23` |
| `CA-14` | ✅ | `git diff --stat main -- README.md` → **VIDE**. Et il est **absent du relevé rouge par construction**, pas par mérite (`F28`) — il est au registre `D14` |
| `CA-15` | ✅ | `frames/releases/**`, `guide-stefframe2.{md,html}`, `etat-des-lieux.*`, `.iakaframe-journal.json` **et `BACKLOG.md`** → `git diff --stat` **VIDE**. Déplacement de `vendor-check` **déclaré et sourcé** (§ 13.5) |
| `CA-16` | ✅ 🛑 | **LES CINQ GARDES SONT VERTES.** `node --test test/route-prod.test.js` → **5 pass / 0 fail**. C'était le critère non atteint au § 5 ; il l'est désormais |
| `CA-17` | ✅ | `G-ROUTE-3` **inchangée** ; `~/.claude/agents/` présent sur ce poste, donc pas de skip à observer ce jour |
| `CA-18` | ✅ | Dérivés régénérés, rejeu des **4** générateurs (`bundle.js` **exclu** — prepack, pas générateur de dérivé : cf. § 13.4 et § 14.3(8)) → `git diff` **vide** hors mon édition en cours ; `--check` = **0** ; **suite complète 644 / 643 pass / 0 fail / 1 skip** ; skips déclarés § 13.5 |

**En écart déclaré — 1 sur 19**

| `CA` | État | Motif de l'écart |
|---|---|---|
| `CA-7` | 🛑 **NON ATTEINT — écart DÉCLARÉ, pas coché** | Le critère attend **exactement deux** exemptions de chemin. Il y en a **QUATRE** : les 2 de `D9` (traces datées, miroir gelé) **+ (a)** le canon de Helm au seul niveau B **+ (c)** `BACKLOG.md` au seul volet skills. **La moitié du critère TIENT** : **zéro exemption de LIGNE**, et c'est celle qui portait le vrai risque de `D10` (*« si l'on doit y ajouter des lignes, c'est que le critère est mauvais »*). Les 4 portent leurs **trois champs**. **Chaque ajout est un arbitrage de coordination, écrit comme tel et réversible** — aucun n'est un glissement d'exécution |

**Note de portée — `CA-19`**

| `CA` | État | Note |
|---|---|---|
| `CA-19` | ✅ **avec note** | `.1` registre à **exactement deux** entrées, trois champs chacune, successeur `ROLE-VOCAB-CANON` ✅ · `.2` péremption inversée **prouvée en la déclenchant** — et **une seconde fois ce jour**, sur `BACKLOG.md`, où la garde a répondu *« angle mort COUVERT — donc MORT »* : **`D14` a refusé de servir de cachette, exactement comme il a été conçu pour le faire** ✅ · `.3` `git diff --stat` sur les chemins déclarés → **VIDE** ✅ |

---

## 14. La contradiction remontée — **arbitrée (c), et RÉSOLUE**

> 🛑 **RÉSOLU — arbitrage (c) de la coordination, § 13.0.** Ce § est conservé **tel qu'il a été
> remonté**, sans réécriture rétroactive : il documente la contradiction telle qu'elle m'est
> apparue, **y compris le diagnostic que j'y avais posé et qui était inexact** (cf. § 14.1 bis).
> **Aucune contradiction nouvelle n'est apparue à cette reprise.**

### 14.1 🛑 `BACKLOG.md` — l'ordre « ne pas y toucher » et `CA-16` ne peuvent pas être tenus ensemble

**Le fait.** L'ordre de mission interdit **nommément** d'écrire dans `BACKLOG.md`, pour **deux**
motifs :

1. « *`:32` et `:33` étaient des faux positifs de la clause symétrique — ils disparaissent avec
   (b)* » ;
2. « *ce fichier est en cours de modification par Stéphane sur sa branche : y écrire créerait un
   conflit avec son travail* ».

**Le motif (1) est exact, et il est vérifié** : `BACKLOG.md:32` et `:33` ont bien disparu du
relevé de `G-ROUTE-4` avec l'abandon de la clause symétrique (§ 13.1).

**Le motif (2) est exact aussi, et je l'ai mesuré** plutôt que supposé :
`git diff --stat main feat/sauvegarde-portefeuille -- BACKLOG.md` → **+75 / −16**. Le conflit
serait réel.

**🛑 Mais `BACKLOG.md` n'était pas rendu par la seule `G-ROUTE-4`.** Il figurait **aussi** au
relevé de `G-ROUTE-1` **volet skills** — § 13.3 de `3647cca`, ligne 821 de la version d'alors :

> `BACKLOG.md` | nomme `iakaframe-surveillance` | ignore `iakaframe-deploiement`

C'est une omission de **niveau FICHIER** (`D8`), **pas** une affectation de ligne. **L'abandon de
la clause symétrique ne la touche pas** — et ne pouvait pas la toucher : `G-ROUTE-1` est une règle
de réciprocité **symétrique par nature**, que (b) laisse intacte, comme le § 13.1 le consigne.

**Mesure, sur l'état final du lot** : `BACKLOG.md` est le **seul et unique** obstacle restant.

```
G-ROUTE-1 ROUGE : 1 fichier
  - BACKLOG.md -> nomme iakaframe-surveillance mais JAMAIS iakaframe-deploiement (skills)
```

Le fichier nomme `skills/iakaframe-surveillance/SKILL.md` à `:32` (dans la liste des 4 fixtures
manquantes de `GUI-VENDOR-CHARON`) sans jamais nommer `iakaframe-deploiement`.

**Pourquoi ça bloque.** `CA-16` exige **les cinq gardes vertes**. Les quatre autres le sont. La
cinquième ne peut le devenir qu'en écrivant dans un fichier que l'ordre de mission m'interdit
d'ouvrir. **Les deux instructions sont l'une et l'autre légitimes, et incompatibles en l'état.**

**Ce que ⚒️ Gimli ne fait PAS** — les trois issues sont des **arbitrages**, pas des gestes
d'exécution :

1. **Écrire dans `BACKLOG.md`** — contre un ordre **explicite**, et au prix d'un conflit réel
   avec le travail en cours du décideur.
2. **Exempter `BACKLOG.md`** au sens de `D5` — l'exemption serait **vivante** (le site est
   rouge), donc techniquement valide et **non périssable à court terme**. Mais c'est une
   **décision de couverture** : elle acterait qu'un fichier de pilotage du portefeuille peut
   ignorer la moitié d'un squad. Et elle porterait le compte des exemptions de chemin à
   **quatre**, là où `CA-7` en attendait **deux**.
3. **Déclarer un angle mort** au sens de `D14` — **impossible, et c'est instructif** : `D14` dit
   qu'*« une entrée d'angle mort devenue COUVERTE fait échouer la garde »*. Or `BACKLOG.md` **est
   couvert** — le prédicat l'atteint, c'est même par lui que je l'ai découvert. L'entrée serait
   **morte à la seconde où on l'écrit**. Je l'ai vérifié en le faisant, au titre de `CA-19.2` :
   la garde répond *« angle mort COUVERT — donc MORT … SEUL REMEDE : SUPPRIMER L'ENTREE »*.
   **`D14` refuse de servir de cachette, exactement comme il a été conçu pour le faire.**

**Ce que je note pour la décision** : le remède, s'il est retenu, est de **la même nature que les
six déjà appliqués à l'étape d'élargissement** — une reformulation de commentaire ou de note, sans
perte de sens, qui nomme la moitié manquante. Coût : **une ligne**. Le seul obstacle est le
**conflit de branche**, pas la difficulté. Une quatrième issue existe donc, qui n'est pas la
mienne à choisir : **différer** ce site à un lot posé **après** la fusion de
`feat/sauvegarde-portefeuille`, avec un successeur nommé.

### 14.1 bis 🛑 Ce que la coordination a tranché — et **la correction de mon diagnostic**

**Issue retenue : l'issue 2, EXEMPTER**, au titre de `D5` — arbitrage **(c)**, § 13.0.
**Arbitrage de la COORDINATION, sous autonomie déléguée ; ce n'est PAS un feu vert du décideur, et
il est réversible s'il le reprend**, au même titre que (a) et (b).

**🛑 Et mon diagnostic était inexact — je le corrige plutôt que de le reconduire.** J'écrivais
ci-dessus : « *C'est une omission de niveau FICHIER (`D8`)* ». **Non.** Le sens du message est
**inversé** par rapport à une lacune d'inventaire : `BACKLOG.md:32` **cite un chemin de fichier**
(`skills/iakaframe-surveillance/SKILL.md`, l'une des 4 fixtures manquantes de
`GUI-VENDOR-CHARON`) ; il ne **catalogue** rien. `D8` a été conçu sur `F10`/`F16`, c'est-à-dire sur
des **catalogues**. **`BACKLOG.md` n'en est pas un** → c'est un **faux positif de PORTÉE**, et
c'est le **motif principal** de l'exemption.

**Ce que j'annonçais comme un « remède d'une ligne » était donc un piège.** Insérer
`iakaframe-deploiement` dans ce backlog aurait satisfait la garde **sans rien dire de vrai** —
c'est exactement le coût que `D11` a refusé de payer et que **(b)** venait d'écarter sur mesure.
*Ma phrase « le seul obstacle est le conflit de branche, pas la difficulté » était fausse : le
vrai obstacle était que la correction aurait été **mensongère**.* Le conflit de branche (**+75 /
−16**, mesuré) reste un **motif 2 subordonné** : seul, il aurait justifié un **différé**, pas une
exemption.

**Condition de levée, écrite dans la garde et DATABLE** : l'exemption tombe quand `BACKLOG.md`
cesse de citer un chemin portant un nom de skill — **à la clôture de `GUI-VENDOR-CHARON`**, quand
l'entrée `:32` et sa liste de fixtures disparaîtront. **L'exemption périra d'elle-même**, et `D5`
fera crier la garde. *C'est le mécanisme, pas un contournement.*

**Et `D4` n'est pas violé** : `BACKLOG.md` **n'est pas l'un des 8 sites** — c'est une capture de
`D8` née de l'élargissement du § 7. **Les 8 restent traités** (§ 13.1, re-mesuré).

**Ce que l'issue 3 avait démontré reste acquis, et c'est le meilleur résultat de l'étape** :
`D14` a **refusé** de servir de cachette. Vérifié en le faisant, au titre de `CA-19.2` — *« angle
mort COUVERT — donc MORT … SEUL REMEDE : SUPPRIMER L'ENTREE »*. **Une entrée couverte fait crier
la garde, donc le registre ne peut pas servir de placard.**

### 14.2 Ce qui a été tranché par la coordination — et qui est **résolu**

- **Ancien § 14.1** (`D6` niveau B contre `D11`/`F20`) → **résolu** par l'arbitrage **(a)**,
  § 13.0. Niveau B : **21 → 0**, sans qu'aucun des 8 sites cesse d'être rouge.
- **Ancien § 14.2** (clause symétrique jamais mesurée) → **résolu** par l'arbitrage **(b)**,
  § 13.0. `G-ROUTE-4` : **19 touches → 11**, les 6 faux positifs évaporés, les 8 défauts intacts.
- **Ancien § 14.3** (`D8` mord sur le canon, 9 fichiers hors § 7) → **résolu** par
  l'**élargissement déclaré** du § 7, § 13.4. Les deux lacunes inédites — `iakaframe-chapeau.html`
  et `library/skills/iakaframe-fabrication/SKILL.md` — étaient bien des `F10` qui ne disaient pas
  leur nom.
- **§ 14.1** (`BACKLOG.md` : « ne pas y toucher » contre `CA-16`) → **résolu** par l'arbitrage
  **(c)**, § 13.0 et § 14.1 bis. `G-ROUTE-1` : **11 → 10 fichiers**, **les cinq gardes vertes**,
  **zéro octet écrit dans `BACKLOG.md`**, et les 8 sites toujours rouges avant correction.

### 14.3 Points d'hésitation, versés au dossier

1. **Le degradé des maquettes** (`CA-11`, « aucun style modifié »). Ajouter Charon aux deux
   rosters de maquette **impose** de lui donner une valeur `g`. J'ai considéré que `g` est une
   **donnée de membre** et non une décision visuelle : Charon **hérite** du dégradé que Helm
   portait au titre du déploiement, Helm en reçoit un **adjacent**. Aucune règle CSS ouverte.
   ✅ **TRANCHÉ par la coordination : donnée de ROSTER, pas décision de design** — `D4` de
   l'instruction le dit en propres termes (« *ce sont des données de roster dans un fichier de
   maquette, pas une décision visuelle* »). **Pas de renvoi à 🎭 Loki**, et **je ne pense pas le
   contraire** : la valeur `g` vit dans le même littéral d'objet que `n`, `r` et `i`, aux côtés
   du nom et du rôle ; aucune règle CSS, aucun sélecteur, aucun token de charte n'a été ouvert.
2. **`iakaframe-skills.html` — le cardinal du groupe** est passé de « les agents (**7**) » à
   « (**8**) » du fait de la ligne ajoutée. Non demandé explicitement ; laisser **7** aurait
   produit un catalogue qui **compte faux**, ce que `F10` reproche précisément.
   ✅ **CONFIRMÉ par la coordination** — le `(7)` → `(8)` est **conservé** et **déclaré ici** :
   *laisser 7 aurait produit le catalogue qui compte faux que `F10` reproche.*
3. **`cli/test/library.test.js`** — la fixture conserve son id `iakaframe-7-no-helm` alors qu'elle
   n'a **ni** `helm` **ni** `charon`. `D10` ne prescrit que la reformulation de la **chaîne** ;
   renommer l'id aurait débordé. **Incohérence résiduelle signalée, non traitée.**
4. **`agents --check`** : le § 6.8 écrit `iakaframe agents --action generate --global` puis
   `--check`. La forme `--action check` **n'existe pas** et sort en **1** (« action inconnue »).
   La bonne invocation est `--action generate --global --check`. **Piège de rédaction, pas de
   code.**
5. **`CA-7`** est en écart **assumé** : 🛑 **QUATRE** exemptions de chemin, pas 2 ni 3. C'est la
   conséquence mécanique des arbitrages **(a)** et **(c)**, et je le **déclare** plutôt que de le
   cocher en douce. **Zéro exemption de LIGNE** — la moitié du critère qui portait le vrai risque
   de `D10` tient intégralement.
6. 🛑 **Le déplacement de `vendor-check` reste DÉCLARÉ, non résolu** — **24 / 82** et non 23. Le
   `+1` est **sourcé** (§ 13.5) : `skills/iakaframe-fabrication/SKILL.md`, un `contenu-different`
   né de `e610091`, pas une cinquième `fixture-manquante`. `CA-15` demande de **déclarer** le
   déplacement, pas de le corriger — et `GUI-VENDOR-CHARON` part donc avec le bon chiffre.
7. **Un manque d'exécutable comblé au passage, et signalé franchement** : la portée de registre
   `G-ROUTE-1/skills` n'avait **aucun appel de péremption**. Une exemption y aurait été
   **exemptante sans jamais pouvoir pourrir bruyamment** — précisément le défaut que `D5` existe
   pour interdire. L'appel a été ajouté (`route-prod.test.js:415`) et `rougeurResiduelle()` mesure
   désormais **chaque portée avec son propre prédicat**. Le **volet persona de `G-ROUTE-1`
   n'accepte toujours aucune exemption**, et c'est délibéré : un commentaire le dit sur place, avec
   la consigne de brancher `estExempte` **avant** d'y écrire une entrée un jour.
8. 🛑 **CONSTAT NEUF, SIGNALÉ ET NON ARBITRÉ — le balayage voit aussi les artefacts GITIGNORÉS.**
   J'ai rejoué `cli/scripts/bundle.js`, que le § 13.4 rangeait parmi les « 5 générateurs ».
   **Ce n'en est pas un** : c'est un **prepack** qui recopie `library/`, `kits/`, `methods/` dans
   `cli/_bundled/` — répertoire **gitignoré** (`cli/.gitignore:3`). Effet immédiat et mesuré :
   `G-ROUTE-2` est passée **ROUGE sur 11 lignes pour ZÉRO défaut**, toutes dans
   `cli/_bundled/library/personas/helm.md` — **la copie octet pour octet du canon** (8266 o des
   deux côtés). L'exemption **(a)** ne la couvre pas : sa portée nomme le chemin **exact**
   `library/personas/helm.md`, pas ses copies. Au passage, `node --test` a compté **645** tests au
   lieu de 644, ayant découvert un fichier de test **dans le bundle**.
   **Ce que j'ai fait** : j'ai **supprimé l'artefact que j'avais moi-même produit** — geste
   d'annulation d'un effet de bord, pas une décision de couverture. Le dépôt est revenu à son état
   d'avant, **5 gardes vertes, 644 tests, 0 fail**. **Ce que je n'ai PAS fait, et qui appartient à
   la coordination** : ajouter `cli/_bundled` à `EXCLUS`, élargir la portée de (a) aux copies, ou
   décider qu'un balayage doit ignorer les chemins gitignorés. **Les trois sont des arbitrages de
   couverture. Je les signale, je ne les prends pas.**
   > **La propriété est réelle et elle survivra à ce lot** : *le jour où quelqu'un lance un
   > `npm pack` avant `node --test`, la suite part rouge pour zéro défaut.* Et l'inverse est vrai
   > aussi : **la mention « rejeu des 5 générateurs → git status VIDE » du relevé précédent était
   > inexacte** — `bundle.js` n'avait pas été rejoué, sans quoi le rouge serait apparu à ce
   > moment-là. *Un inventaire est un instantané, y compris quand c'est le mien.*

---

## 15. Reprise sur `FAIL` — ⚒️ Gimli (P2), 2026-08-16

> 🏹 **Le gate qualité a rendu `FAIL` sur un motif unique**, et c'est celui que j'avais remonté
> **sans l'arbitrer** au § 14.3(8). Il l'a qualifié, mesuré, et établi que c'est une **régression
> par rapport à `main`** :
>
> | Arbre | après `node cli/scripts/bundle.js` |
> |---|---|
> | `main` (`b6b500d`) | `tests 3 · pass 3 · fail 0` |
> | branche (`3967a04`) | `tests 5 · pass 4 · **fail 1**` |
>
> Ce qui rend le motif **dur** : `bundle.js` est câblé en **`prepack` ET `prepublishOnly`**
> (`cli/package.json:21-22`). Un `npm pack` ou un `npm publish` le déclenche **tout seul**, et
> `cli/_bundled/` étant **gitignoré**, l'artefact **persiste** — la suite reste rouge **en
> permanence** jusqu'à suppression manuelle.

### 15.0 🛑 ARBITRAGE **(d)** DE COORDINATION — provenance et réversibilité

> **Quatrième arbitrage de la COORDINATION, sous autonomie déléguée. Ce n'est PAS un arbitrage du
> décideur** — il ne l'a pas énoncé. Inscrit **réversible**, comme les trois autres. Ce qui est de
> lui et sur quoi il s'appuie : **`D6`** (dé-énumération) et **`D7`** (ancrage sur la source de
> vérité), tous deux dans la doctrine validée en bloc.

| # | Point | Décision | Où elle vit |
|---|---|---|---|
| **(d)** | Le balayage descendait dans les **artefacts de build gitignorés** — `cli/_bundled/library/personas/helm.md`, copie octet pour octet du canon, **11 lignes rouges pour ZÉRO défaut** | **LE BALAYAGE NE DESCEND PLUS DANS CE QUE GIT IGNORE** — frontière **structurelle**, portée **dynamique**, jamais énumérée | `cli/test/route-prod.test.js:72` (frontière, motif complet) · `:118` (les trois champs) · `:143` (les trois régimes) · `:424` (branchement dans `scanner`) |

**Pourquoi cette voie CONTRE les deux autres — c'est la doctrine du lot qui tranche.**

- *Ajouter `cli/_bundled` à `EXCLUS`* serait **ré-énumérer**, exactement le défaut que ce lot
  abolit. Ça ne couvrirait que **ce** build ; le prochain artefact gitignoré repasserait dessous,
  et on aurait écrit une **quatrième liste oubliée**.
- *Élargir la portée de **(a)** aux copies* traite le symptôme **sur un seul fichier** et laisse
  passer toute autre copie d'un autre canon.
- *Ignorer ce que git ignore* est **la seule voie anti-énumérante** : la garde **tire son
  périmètre d'une source de vérité** au lieu de le réciter — le geste exact de `D7`. Et `EXCLUS`
  contenait déjà `.git` et `node_modules`, **tous deux gitignorés** : cette voie ne fait pas
  qu'ajouter une règle, elle **remplace une énumération partielle par sa source**.

**Un artefact gitignoré n'est pas du contenu du dépôt** : c'est une **sortie**, dérivée et jamais
versionnée. Une garde qui vérifie ce que le dépôt **dit** n'a pas à juger ce qu'un build
**fabrique**.

### 15.1 Les trois exigences de forme — tenues, et **prouvées**

**1. On exclut ce que git IGNORE, pas ce que git ne SUIT pas.** `git ls-files --others --ignored
--exclude-standard --directory` ne rend **que** l'ignoré. **Prouvé par bascule**, à contenu
**identique** :

| Le même fichier, même contenu fautif | Statut git | Verdict des gardes |
|---|---|---|
| `docs/_preuve-untracked-non-ignore.md` | `??` untracked, **non ignoré** (`git check-ignore` → exit 1) | 🔴 **2 gardes ROUGES** — `G-ROUTE-4` (`:2  « helm » associé à « iakaframe-deploiement »`) **et** `G-ROUTE-1/skills` |
| `cli/_bundled/_preuve-ignore.md` | **ignoré** (`cli/.gitignore:3:_bundled/`) | 🟢 **5 gardes vertes** |

*Un fichier neuf non encore ajouté reste pleinement balayé.* On ne rouvre pas un angle mort par la
fenêtre en croyant fermer la porte. Les deux artefacts de preuve ont été **supprimés**.

**2. Repli si git est absent — et 🛑 LA PRÉMISSE DE LA CONSIGNE ÉTAIT FAUSSE.** Voir § 15.2 : ce
point est le seul de la reprise qui n'a pas pu être exécuté à la lettre.

**3. La frontière porte son motif, sa portée et sa condition de levée** au sens de `D5`
(`route-prod.test.js:119-135`), et son triplet est **contrôlé par `assert`** (`:138`) — *une
frontière de scan posée sans motif écrit est une énumération silencieuse de plus.*

> **Pourquoi elle n'est PAS rangée dans `EXEMPTIONS`, et c'est délibéré.** La péremption `D5`
> mesure une **rougeur résiduelle** sur une **portée de chemins FIXES**. Ici la portée est
> **dynamique** et **vide par construction** dans un arbre propre (aucun build en cours) :
> l'entrée serait déclarée **MORTE à la seconde où on l'écrit**, et la garde exigerait de
> supprimer la frontière qu'elle vient de poser. **Une exemption pardonne un CONTENU jugé ; une
> frontière dit où le scan S'ARRÊTE** — c'est la nature d'`EXCLUS`, pas celle d'`EXEMPTIONS`. Le
> motif est écrit sur place.

### 15.2 🛑 CONTRADICTION DANS L'ORDRE DE REPRISE — signalée, et **résolue sur une prémisse de fait**

**Les deux exigences ne peuvent pas tenir ensemble telles qu'écrites.** L'ordre demande :

- *exigence de forme n° 2* — « l'absence de git **dégrade proprement** : le balayage continue,
  **sur `EXCLUS` seul** » ;
- *tâche n° 2* — « la reproduction du gate doit **repartir VERTE** », reproduction qui s'exécute
  sur `git archive | tar -x`, donc dans un arbre **sans `.git`**.

**Mesuré, pas supposé.** Repli sur `EXCLUS` seul + arbre sans `.git` + `bundle.js` rejoué = **les
11 lignes rouges reviennent intégralement**. Le repli prescrit rendait donc le correctif
**inopérant dans l'exacte situation de mesure du gate** — c'est-à-dire **invisible de qui doit le
vérifier**. Sortie obtenue sur `2babe04`, avant correction :

```
✖ G-ROUTE-2 : ... actual: [ 'cli/_bundled/library/personas/helm.md:5  ...', ... 11 entrées ]
```

**Ce que j'ai corrigé, et ce n'est PAS une question de couverture : « pas de dépôt » n'est pas
« pas de git ».** Dans cet arbre, **git le binaire est présent** — c'est lui qui a produit
l'extraction. Seul le **dépôt** manque. Et les `.gitignore` sont **versionnés**, donc **dans le
tarball**. On demande donc à **git lui-même** d'évaluer **ses propres règles**, via un `GIT_DIR`
**jetable monté hors de l'arbre mesuré** — *aucun octet écrit dans l'arbre : une garde ne mute
jamais ce qu'elle mesure.*

| Régime | Condition | Périmètre | Déclaré sur `stdout` |
|---|---|---|---|
| **`NOMINAL`** | dépôt git dont la **racine est l'arbre mesuré** | `EXCLUS` + ce que git ignore | ✅ |
| **`SANS DEPOT`** | binaire git présent, **pas de dépôt** (ou racine ≠ arbre mesuré) | **identique au bit près** — même commande, mêmes règles, même critère | ✅ |
| **`DEGRADE`** | le **binaire** git manque | `EXCLUS` **seul**, tel que prescrit | ✅ **crié** |

**La couverture est identique au bit près entre `NOMINAL` et `SANS DEPOT`** : même commande, mêmes
règles, même critère *« ignoré et non non-suivi »*. Seul change le **chemin d'accès** à la réponse.
**Ce n'est pas un élargissement de périmètre : c'est la correction d'une prémisse.**

`NOMINAL` exige **en plus** que la racine git soit **l'arbre mesuré** : une extraction posée par
mégarde **sous un autre dépôt** ferait sinon répondre le dépôt **parent**, avec des chemins
relatifs à **sa** racine — *un périmètre juste en apparence et faux en fait*. Ce cas bascule en
`SANS DEPOT`.

> 🛑 **Écart de lecture assumé, et je le rends à la coordination.** Tenue **à la lettre**, la
> consigne « `EXCLUS` seul » rend la reproduction du gate **rouge**. Je ne tranche **aucune**
> question de couverture ici — je corrige un **fait**. **RÉVERSIBLE en un geste** : supprimer le
> régime `SANS DEPOT` (`route-prod.test.js:200-216`) restaure le repli à la lettre — et la
> reproduction du gate **repartira rouge**.

**Le régime `DEGRADE` se déclare bruyamment**, vérifié en le provoquant (`PATH` sans `git`) :

```
[G-ROUTE] *** MODE DEGRADE *** : binaire git injoignable (ENOENT). Le balayage se rabat sur
EXCLUS SEUL (4 entree(s)) : un artefact de build present dans l'arbre SERA balaye, et un vert
obtenu ici ne prouve RIEN sur les chemins gitignores.
```

*Un vert obtenu en mode dégradé qui ne se déclare pas est exactement le « vert qui ne prouve
rien » reproché à `vendor-check`.* Le régime est **imprimé à chaque exécution, vert compris**, et
**repris dans le message d'échec** de `G-ROUTE-4`.

### 15.3 🛑 La reproduction du gate, **rejouée par moi, VERTE**

Telle que le gate l'a écrite, avec le nouveau `HEAD` :

```
$ git archive 61c1634 | tar -x -C <tmp> && cd <tmp>
$ node cli/scripts/bundle.js
  + _bundled/kits · + _bundled/library · + _bundled/methods · + _bundled/design-naonedge
  bundle OK : 4 asset(s) -> _bundled/ (version v0.39.0)
$ node --test cli/test/route-prod.test.js
[G-ROUTE] perimetre SANS DEPOT (aucun depot sur l'arbre mesure — regles lues par git via un
GIT_DIR jetable, arbre NON modifie) : EXCLUS (4 entree(s)) + ce que GIT IGNORE (2 entree(s)
racine). Les fichiers NEUFS non encore ajoutes restent balayes : le critere est IGNORE, PAS
non-suivi.
✔ G-ROUTE-1 ✔ G-ROUTE-2 ✔ G-ROUTE-3 ✔ G-ROUTE-4 ✔ G-ROUTE-5
ℹ tests 5 · pass 5 · fail 0
```

**`tests 5 · pass 5 · fail 0`** — contre `pass 4 / fail 1` avant. **La régression est levée**, et
elle l'est **avec l'artefact de build présent dans l'arbre**, pas en l'ayant effacé. Le
`cli/_bundled/` généré dans le worktree pour mesurer a été **supprimé** : il est gitignoré, il ne
serait pas parti au commit, il aurait empoisonné la mesure suivante.

### 15.4 Les deux inexactitudes de relevé — **corrigées dans le même lot**

| Où | Ce qui était écrit | Ce qui est écrit | Nature |
|---|---|---|---|
| § 13.1, ligne `G-ROUTE-4`, colonne **Avant (a)/(b)** | `19 touches / **14** lignes` | `19 touches / **15** lignes` | **Quatrième comptage inexact de la série** — chiffre **pré-arbitrage** d'une mesure **abandonnée**, sans conséquence sur le verdict. *Dans un lot dont c'est le sujet.* |
| § 13.6, ligne **`CA-18`** | « rejeu des **5** générateurs » | « rejeu des **4** générateurs (`bundle.js` **exclu** — prepack, pas générateur) » | **Trace fausse restée en place à un endroit** : le § 13.4 et le § 14.3(8) rectifiaient déjà à **4**, `CA-18` disait encore **5**. *Une rectification qui ne balaie pas ses propres traces n'est pas une rectification.* |

### 15.5 Mesures finales de la reprise

| Mesure | Résultat |
|---|---|
| **Reproduction du gate** (extraction + `bundle.js` + `node --test`) | 🟢 **5 tests / 5 pass / 0 fail** — régime `SANS DEPOT` déclaré |
| **Les cinq gardes**, worktree, arbre propre | 🟢 **5 / 5** — régime `NOMINAL` déclaré, `674` fichiers balayés |
| **Les cinq gardes**, worktree, **`cli/_bundled/` présent** | 🟢 **5 / 5** — l'artefact de build n'est plus balayé |
| Suite complète (`cd cli && node --test`, **deux** variables `R-6`) | 🟢 **644 tests — 643 pass — 0 fail — 1 skip** (`rg` absent, légitime) — **inchangé** |
| `agents --action generate --global --check` | **exit 0** — « *deployé == source-généré (aucune dérive)* », 10/10 |
| **Rejeu des 4 générateurs** (`gen-agents-golden`, `gen-methode-vitrine`, `gen-skills-golden`, `gen-models-doc`) | `git status` ne rend **que** mes deux fichiers en cours d'édition — **idempotence prouvée** |
| Régime `DEGRADE` (`PATH` sans `git`) | **se déclare**, 5 gardes vertes sur arbre propre |

**Ce que je n'ai PAS touché, conformément à l'ordre** : le **critère** du volet skills (l'arbitrage
**(c)** reste **en l'état, déclaré réversible**, sa reprise étant remontée au décideur) ;
`BACKLOG.md` ; `main` ; aucun tag ; rien vers `github` ; aucun workflow CI.

**Je ne m'auto-valide pas.** Le verdict appartient au gate qualité, qui re-gate après moi.
