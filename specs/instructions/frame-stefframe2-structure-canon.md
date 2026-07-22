# Instruction — Certifier StefFrame2 « structurellement bon & complet » + corriger la dérive principleIds (16→18)

> Cadrée par **Gandalf** (P1 — Cadrage), **lecture seule** sur code/frame/canon.
> Exécution : **Gimli** (P2). Statut en fin de doc.
> **Étape 1/4** de l'objectif transverse « charger le frame dans le GUI » (chemin critique :
> (1) frame structurellement bon **[ICI]** → (2+3) le GUI charge/rend/sauve fidèlement → (4) garde
> de parité). **Doctrine non négociable : GUI ← frame ; le frame est autoritaire ; aucun fix ne
> déforme le frame pour arranger le GUI.**
> Réf. : `specs/instructions/resync-stefframe2-miroir-live.md` (doctrine miroir + table
> d'anonymisation §4.2 + gate §6), `specs/instructions/open-frame-gui-stefframe2.md` (spec GUI
> VALIDÉE, comptes attendus), `specs/instructions/frame-stefframe2.md` (recette de build),
> `methods/iakaframe.md` (canon), `library/principles/`.

---

## 1. Besoin (reformulé)

Avant que le GUI ne charge StefFrame2, **certifier sur pièces** que le frame est **structurellement
bon, auto-cohérent et complet vis-à-vis du canon** — et **corriger le seul écart de complétude
bloquant la certification** : la méthode du frame porte **16** `principleIds` là où le canon en
porte **18**. Doctrine du décideur (déjà gravée, `resync-stefframe2-miroir-live.md` §1) :
**StefFrame2 est un MIROIR du live ; tout drift par rapport au live est un bug.**

---

## 2. Faits vérifiés (lecture réelle, pas de mémoire)

### 2.1 La dérive #7 — 16 vs 18 principleIds (CONFIRMÉE, c'est une DÉRIVE)
- **Frame** : `frames/releases/StefFrame2/methods/iakaframe.md:5-8` → **16** ids.
- **Canon** : `methods/iakaframe.md:5-8` → **18** ids : les 16 du frame **+**
  `canon-avant-citation` **+** `preuve-avant-declaration` (ajoutés en **fin** de liste, ligne 8).
- **Les 2 atomes manquants existent au canon** : `library/principles/canon-avant-citation.md`,
  `library/principles/preuve-avant-declaration.md`. Ils sont **absents du pool du frame** (les 2
  emplacements — `principles/` à plat **et** `library/principles/` — comptent **16** fichiers,
  identiques).
- **Ce sont les 2 principes les PLUS RÉCENTS du canon** : nés le **2026-07-19** (« série
  amélioration des personas »), `preuve-avant-declaration` amendé le **21/07** (lot D-8, régime
  opposable). Le frame les a **simplement ratés** — même nature exacte que le drift **14→16**
  (`interruption-minimale-odin`, `merge-versionnement`) déjà corrigé par `resync-stefframe2-miroir-live.md`.
- **Aucune trace de choix documenté** : les 2 ids ne sont exclus par **aucune** justification dans
  le frame ; la doctrine « miroir du live » les réclame. → **DÉRIVE, pas choix de release.**

### 2.2 Verdict d'auto-cohérence du frame — VERTE aujourd'hui (checkFrameRefs OK)
Toutes les références internes résolvent (vérifié fichier par fichier) :
- **Méthode** (`methods/iakaframe.md`) : `principleIds`(16)⊆principles(16), `ritualIds`(5)⊆rituals(5),
  `guardrailIds`(3)⊆guardrails(3), `roleKeys`(8)⊆roles(8), `scaffoldIds`(2)⊆scaffolds(2),
  `workflowId`→`workflows/iakaframe-3phases.md`. **0 dangling.**
- **Team** (`teams/iakaframe-8.md`) : `personas`(8)⊆personas(8) ; `coordinator: aragorn`∈personas.
- **Binding** (`bindings/iakaframe-claude-default.md`) : `methodId`, `teamId`, 8 `personaId` tous résolus.
- **Personas → skills / guardrails** : les 8 personas référencent uniquement des skills présents dans
  le pool des **17** (`iakaframe-{qualite,nathalie,humandoc,odin,cadrage,aragorn,design,deploiement}`,
  gimli `skills: []`) et des guardrails présents (`identity,perimeter,delegation`). **0 dangling.**
- **Comptes du frame** (conformes à `open-frame-gui-stefframe2.md` §5) : personas **8**, roles **8**,
  principles **16**, rituals **5**, guardrails **3**, scaffolds **2**, workflows **1**, skills **17**,
  methods **1**, teams **1**, bindings **1**.

> **Conséquence** : le frame **charge déjà** dans le GUI de manière auto-cohérente. La correction
> #2.1 est une mise à **complétude vis-à-vis du canon** (doctrine miroir), **pas** un déblocage de
> chargement. Après correction : `principleIds`(18)⊆principles(18) — **toujours vert**.

### 2.3 Les 2 atomes à rapatrier portent des TOKENS à anonymiser (piège central)
Contrairement à `interruption-minimale-odin` (copié tel quel) et proche de `merge-versionnement`
(un seul token « Forgejo » swappé), les 2 nouveaux principes ont des sections « Origine » **riches en
tokens réels** que le **gate d'anonymisation** (`resync…` §6-A) capte et exige à **0** :
- `library/principles/canon-avant-citation.md:26` — « **NaonEdge** dark » et « **Cinabre** »
  (noms de chartes réelles du catalogue Loki).
- `library/principles/preuve-avant-declaration.md:59` — « le merge `**8ae5748**` d'`**iakaFrameGUI**` »
  (nom de dépôt réel + SHA de commit réel).
> Une copie **naïve** injecterait `NaonEdge`/`iakaFrameGUI` dans le corpus → **rupture de parité
> source↔miroir** (exactement la classe de fuites corrigée le 22/07, lot `frame-stefframe2-fuites`).

### 2.4 Autre drift recensé — skills 17 (frame) vs 24 (live) — HORS PÉRIMÈTRE étape 1
Le pool skills du live compte **24** entrées (`library/skills/`), le frame **17**. Écart = le
**modèle agnostique en couches** (`iakaframe-gestion-de-source`, `iakaframe-conteneurisation`,
`iakaframe-memoire-humaine`, `iakaframe-journal-conversation`, la famille `iakaframe-git`
**distincte** du produit) **+** 2 skills neuves (`iakaframe-jalon`, `iakaframe-fabrication`).
**Pourquoi HORS périmètre ici** :
- **N'entame pas l'auto-cohérence** : **aucun** persona du frame ne référence ces skills (§2.2) →
  leur absence ne crée **aucun** dangling ; `checkFrameRefs` reste vert.
- **Ne bloque pas le chargement/rendu** : le GUI charge/édite/sauve les 17 skills présents
  fidèlement (doctrine GUI←frame) ; la spec GUI VALIDÉE (`open-frame…` §7-A) attend **17**.
- **C'est un chantier de re-synchro architecturale** (migration vers le modèle en couches +
  anonymisation de ~7 skills) — le territoire **« Option B / rebuild »** explicitement **différé**
  par `resync-stefframe2-miroir-live.md` §3. → **à cadrer séparément** (§8), non bloquant pour
  l'objectif transverse « charger le frame ».

---

## 3. Décision de cadrage (Gandalf tranche)

1. **#7 = DÉRIVE** → **rétablir 18** `principleIds` dans la méthode du frame **et** rapatrier les 2
   atomes manquants (anonymisés) dans les **2** emplacements du pool. Justification : doctrine miroir
   (décideur) + les 2 principes sont les plus récents du canon, ratés par le frame, sans exclusion
   documentée + même schéma que le drift 14→16 déjà corrigé.
2. **Patron d'anonymisation = « garder le corps, scruber les tokens »** (patron établi
   `resync…` §4.2, appliqué à `merge-versionnement`). Pour les 2 sections « Origine » riches en
   tokens (§2.3), la substitution 1:1 lit mal (« NaonEdge dark » → « design dark » est bancal) :
   **généraliser la prose d'exemple** de sorte que le **sens du principe** soit conservé et que le
   **gate = 0**. Le **test objectif** est le gate §6, pas une formulation imposée. *Reco Gandalf :
   généraliser les noms de chartes en placeholders neutres (« une charte donnée » / « une autre
   charte ») et retirer le nom de dépôt + le SHA (« un merge d'un dépôt applicatif de la famille,
   daté, portant “gate PASS” avec le lint rouge »). NE PAS slimer les sections : le corps reste
   miroir du live, seuls les tokens tombent.*
3. **Skills 17 vs 24 : recensé, NON corrigé ici** (§2.4) → suivi séparé (§8).

---

## 4. Solution fermée — ce que Gimli exécute (P2)

> Toutes les écritures sont **dans le frame** `frames/releases/StefFrame2/`. Source de vérité du
> **contenu** = le live (`library/principles/`). **Forme** = anonymisée (table `resync…` §4.2).

- **T1 — Rapatrier `canon-avant-citation`** (anonymisé §2.3/§3.2) dans **les 2** emplacements :
  - `frames/releases/StefFrame2/principles/canon-avant-citation.md`
  - `frames/releases/StefFrame2/library/principles/canon-avant-citation.md`
  - Contenu **identique** entre les 2 fichiers. Tokens `NaonEdge`, `Cinabre` **scrubés**. Frontmatter
    (`id/label/policy/trigger`) conservé tel quel (aucun token). Refs internes `library/personas/
    nathalie.md`, `library/personas/loki.md` **conservées** (fichiers présents dans le frame).
- **T2 — Rapatrier `preuve-avant-declaration`** (anonymisé) dans **les 2** mêmes emplacements.
  Tokens `iakaFrameGUI`, `8ae5748` **scrubés**. Ref interne
  `library/skills/iakaframe-qualite/SKILL.md` **conservée** (skill présent dans le frame).
- **T3 — Compléter la méthode** : `frames/releases/StefFrame2/methods/iakaframe.md`, ajouter
  `canon-avant-citation, preuve-avant-declaration` en **fin** de `principleIds` → **18 ids, dans le
  même ordre que le live** (`methods/iakaframe.md:5-8`). **Un seul fichier méthode** (non dupliqué).
- **T4 — Gates & comptes** : passer le gate d'anonymisation (§ critère B), l'intégrité (§ critère C)
  et les comptes (§ critère A). Aucun autre fichier touché.

---

## 5. Périmètre — DANS / HORS

**DANS** : rapatrier + anonymiser les 2 principes (×2 emplacements) ; porter `principleIds` à 18 ;
passer gate + intégrité + comptes.

**HORS** :
- **Toucher aux skills** (drift 17 vs 24) → §8, chantier séparé.
- **Défaire une anonymisation existante** (interdit — cœur de la doctrine miroir).
- **Slimer / réécrire** le corps des 2 principes au-delà du scrub de tokens (§3.2).
- **Modifier la spec GUI** `open-frame-gui-stefframe2.md` : son attendu « principles **16** » (§5/§7-A)
  devient **stale (→18)**. C'est une **répercussion côté dépôt GUI** (étapes 2/3, dimension Odin),
  **signalée** ici, **pas** exécutée dans ce lot (Gandalf cadre le frame, pas le GUI).
- **Dé-dupliquer** les copies flat/`library/` (chantier source-unique, `resync…` §9).

---

## 6. Critères d'acceptation (pass/fail, testables)

**A. Complétude & comptes**
- `ls frames/releases/StefFrame2/principles/*.md | wc -l` = **18**.
- `ls frames/releases/StefFrame2/library/principles/*.md | wc -l` = **18**.
- L'ensemble d'ids des 2 emplacements est **identique** entre eux **et** égal à celui du live
  `library/principles/` (18 ids).
- `frames/releases/StefFrame2/methods/iakaframe.md` : `principleIds` = **18**, **ensemble égal** à
  `methods/iakaframe.md` (canon), 2 nouveaux ids en fin de liste.
- Non-régression : skills **17**, personas **8**, roles **8**, rituals **5**, guardrails **3**,
  scaffolds **2**, workflows **1**, teams **1**, methods **1**, bindings **1** — **inchangés**.

**B. Anonymisation préservée (gate `resync…` §6-A, restreint aux 2 nouveaux fichiers = 0)**
```
grep -rniE 'naonedge|iakaFrameGUI|cinabre|8ae5748|forgejo|appflowy|iakabox|192\.168|:3001|:1883|\bsjupin\b' \
  frames/releases/StefFrame2/principles/canon-avant-citation.md \
  frames/releases/StefFrame2/principles/preuve-avant-declaration.md \
  frames/releases/StefFrame2/library/principles/canon-avant-citation.md \
  frames/releases/StefFrame2/library/principles/preuve-avant-declaration.md
```
→ doit renvoyer **0**. Et gate global §6-A du frame (hors `cli/`) **reste 0**.

**C. Intégrité référentielle (checkFrameRefs / logique `refs.ts`)**
- `principleIds`(18) ⊆ pool principles(18) ; **0 dangling**.
- Tous les autres refs (méthode/team/binding/personas→skills+guardrails) **restent** résolus (§2.2).
- Les 2 nouveaux atomes **parsent** (frontmatter valide `id/label/policy/trigger`) ; leur `id`
  frontmatter = leur nom de fichier.

**D. Fidélité de sens** (revue humaine au gate) : les 2 principes anonymisés énoncent **la même
politique** que le canon (la prose d'exemple généralisée n'altère ni `policy` ni `trigger` ni le
message du principe).

---

## 7. Jalon (gate humain — P1→P2)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```
**IAKAFRAME — JALON : frame-stefframe2-structure-canon**

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `frame-stefframe2-structure-canon.md` : certification d'auto-cohérence (checkFrameRefs vert), **#7 tranché = DÉRIVE** → rapatriement anonymisé des 2 principes (×2 emplacements) + `principleIds`→18, drift skills recensé & sorti du périmètre, critères testables **+ estimation** | 🟢 **Le décideur (Stéphane)** — gate **humain** : valide → dispatch **Gimli** (P2) |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Dérive #7 : `frames/releases/StefFrame2/methods/iakaframe.md:5` (16 ids) ↔ `methods/iakaframe.md:5` (18 ids).
- Atomes canon à rapatrier : `library/principles/canon-avant-citation.md:1`, `library/principles/preuve-avant-declaration.md:1`.
- Tokens à scruber : `library/principles/canon-avant-citation.md:26` (NaonEdge/Cinabre), `library/principles/preuve-avant-declaration.md:59` (iakaFrameGUI/8ae5748).
- Pool frame actuel (16, ×2) : `frames/releases/StefFrame2/principles/` et `frames/releases/StefFrame2/library/principles/`.
- Patron d'anonymisation de référence : `frames/releases/StefFrame2/library/principles/merge-versionnement.md:14` (« push (serveur git self-hosted) ») ↔ `library/principles/merge-versionnement.md:14` (« push Forgejo »).
- Table de mapping & gate : `specs/instructions/resync-stefframe2-miroir-live.md:127` (§4.2), `:198` (§6-A).
- Répercussion GUI (à signaler, non exécutée) : `specs/instructions/open-frame-gui-stefframe2.md:172` (« principles 16 »).

---

## 8. Suivi recommandé (NON bloquant — à cadrer séparément)

- **Re-synchro des skills 17→24** (§2.4) : migration du frame vers le **modèle agnostique en
  couches** (`gestion-de-source`/`git`/produit, `conteneurisation`, `memoire-humaine`,
  `journal-conversation`) + rapatriement de `iakaframe-jalon`, `iakaframe-fabrication`, le tout
  **anonymisé** (×3 emplacements : flat / `library/` / kit). C'est la continuation directe de
  `resync-stefframe2-miroir-live.md` (encore **PROPOSÉ**) et relève de son « Option B ». **Non
  requis** pour charger le frame (auto-cohérent à 17).
- **Répercussion GUI** : mettre à jour l'attendu « principles » de `open-frame-gui-stefframe2.md`
  (16→18) — dépôt `iakaFrameGUI`, dimension Odin, étapes 2/3.
- **Outil `frame verify`** (audit A3.1/B1.2) : rendre le miroir auto-vérifiable (comptes + dangling
  refs + gate grep) pour éteindre durablement ces dérives silencieuses.

---

## Estimation dev (exécution Gimli — étape 1)

- **Équivalent jour-homme** : **~0,5 j-h** (demi-journée). Mécaniquement : 2 fichiers × 2
  emplacements (copie) + 1 édition de frontmatter (3 lignes) + gate. Le temps réel se concentre sur
  l'**anonymisation prose** des 2 sections « Origine ».
- **Complexité / risque** : **FAIBLE→MOYEN**. Geste trivial ; le risque est (a) la **fidélité
  d'anonymisation** — scruber `NaonEdge/Cinabre/iakaFrameGUI/8ae5748` jusqu'à gate=0 **sans**
  dénaturer le sens du principe (§3.2, critère D) ; (b) le **doublon d'emplacement** — oublier une
  des 2 copies (flat vs `library/`) laisserait le pool désaligné ; (c) régression d'intégrité si
  `principleIds`→18 est posé **sans** que les 2 atomes existent (dangling).
- **Inconnues susceptibles de faire glisser** : (1) **keep vs slim** des sections « Origine » — la
  reco est *keep+scrub* (patron établi), mais le gate peut préférer un slim (léger surcroît de
  rédaction) ; (2) la **répercussion GUI** (16→18) : si le décideur veut la traiter dans la foulée,
  elle sort du frame et ajoute un aller-retour dépôt GUI ; (3) décision de **folder ou non** le
  chantier skills (§8) — s'il est fusionné ici, l'estimation **explose** (chantier architectural,
  plusieurs j-h) : la reco est de le **garder séparé**.

> Ordre de grandeur assumé et révisable (pas un engagement ferme). À rappeler à la clôture du lot,
> confronté au temps réel.

---

## Statut

**PROPOSÉ — en attente de validation décideur.** À « JALON VALIDÉ » → dispatch **Gimli** pour
exécuter T1-T4 (§4) contre les critères §6. Suivis §8 non bloquants (recos Gandalf fournies).
