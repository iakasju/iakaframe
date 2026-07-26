# Instruction — Constitution du modèle de frame (Finding 4, le dernier des 4 biais — soldé par la doctrine, pas par du code)

> Instruction de cadrage (🔵 Gandalf, P1, 2026-07-26), sur mission Aragorn (marche forcée décideur).
> **Doc / cadrage pur — ZÉRO code, ZÉRO renommage, ZÉRO rework.** Ce fichier est le seul artefact
> produit ; l'écriture Gandalf est bornée à `specs/instructions/`.
>
> **Renommage conceptuel assumé.** Ce lot était cadré comme « namespacing des personas inter-frames »
> (garde `name-collision`). Le décideur a **sécurisé l'architecture par 4 réponses le 2026-07-26** :
> la question n'est plus « comment scoper / dédupliquer / qualifier », mais **« graver les invariants
> du modèle de frame comme une constitution »**. La garde est **abandonnée** (elle râlerait contre des
> homonymes légitimes — cf. § 4). Le fichier `specs/instructions/namespacing-personas-inter-frames.md`
> est **remplacé par un renvoi** vers celui-ci.
>
> **Exécutant pressenti = 🟠 Fëanor (rôle `frame`) + éventuellement 📖 Nathalie** (mémoire / doc de
> référence). **Aucun rôle dev (Gimli) requis** : rien à coder. Gate P2→P3 : 🏹 Legolas (recette
> **de non-mouvement** — rien ne doit bouger, § 6).
>
> **Constats mesurés sur le disque le 2026-07-26** dans `~/work/iakaframe` (réservoir, v0.27.0) —
> `preuve-avant-declaration`. Citations par nom de section / de symbole, jamais par `chemin:ligne`.

---

## 0. Pourquoi une constitution, et pas une garde

Le rangement des 7 frames tierces a révélé un 4ᵉ axe (après gouvernance, cardinalité, schéma) :
**Ohno et Shingo (lignée Toyota Production System) sont castés par Kanban ET par Lean, dans des rôles
différents.** Résolu **ad hoc** : id nu `ohno`/`shingo` côté Kanban, id qualifié
`leanstartup-ohno`/`leanstartup-shingo` côté Lean, `name:` « Ohno »/« Shingo » **partagé** dans les
deux. Rien ne l'énonçait comme **règle**, et un cadrage livré (`rangement-…-reservoir.md` § 3.3)
disait même l'inverse (« QUALIFIER les deux »).

Le premier réflexe de cadrage — **ajouter une garde `name-collision` au lint** — s'est révélé
**contraire au modèle** : un homonyme inter-frames est **légitime et voulu** (deux frames peuvent
caster le même personnage historique dans des rôles distincts). Une garde qui **pousse à qualifier**
ou signale l'homonymie **milite contre un usage sain**. Le décideur a tranché : **on ne garde pas, on
grave.** Le modèle n'avait pas un défaut mécanique, il avait une **constitution non écrite**. Ce lot
l'écrit. **C'est le plus léger des 4 findings** : une doctrine à consigner, rien à exécuter en code.

---

## 1. La constitution — les 5 invariants (réponses décideur, 2026-07-26)

> Texte **normatif**. À inscrire comme **constitution du modèle de frame** dans la référence de forge
> (périmètre Fëanor) et/ou la mémoire de référence (périmètre Nathalie). Gandalf le grave ici ; son
> inscription au canon est de l'exécution (§ 5).

### C-1 — `library/` est un pot **plat** et **partagé**
Chaque élément (`personas`, `skills`, `principles`, `rituals`, `guardrails`, `roles`, `workflows`,
`scaffolds`) : **`id == nom de fichier`**, **unique et DÉFINITIF**. Un élément **n'est jamais renommé
une fois créé** (l'exception unique de promotion : voir C-4). Cet invariant est déjà **imposé et
vérifié** par `frame lint` (kind `id-filename`, bloquant) et par `add <pool> <id>` (non destructif).

### C-2 — Une frame = un **assemblage** ; méthode et team sont **DEUX FRÈRES sous le frame**
*(Structure tranchée par le décideur le 2026-07-26 : GARDER L'ACTUEL — méthode et team **frères**,
la méthode ne devient PAS propriétaire de la team.)*

Le **FRAME possède DEUX frères de même niveau** : une **MÉTHODE** et une **TEAM**. Le descripteur
`frames/<id>.md` porte **`methodId` + `teamId`** — deux références de pairs, pas une hiérarchie.

- **La MÉTHODE** (`methods/<id>.md`) porte les ids d'**ÉLÉMENTS** : `workflowId`, `principleIds`,
  `ritualIds`, `guardrailIds`, **`roleKeys`** (des **rôles ABSTRAITS**), `scaffoldIds`. **La méthode
  ne nomme AUCUNE persona et ne possède PAS la team** (E2). Étant agnostique de la team, elle est
  **réutilisable avec plusieurs teams** — c'est le bénéfice de la structure « frères ».
- **La TEAM** (`teams/<id>.md`) porte le **casting** : `personas` + `coordinator`. Elle ne porte
  aucun élément de méthode.
- **Le BINDING est le mariage** (`bindings/<id>.md` : `teamId` + affectations
  persona → runner/model/tools). C'est **là**, et nulle part ailleurs, que méthode et team
  s'apparient : chaque `persona.roleKey` de la team **couvre** un `roleKey` de la méthode
  (`assemble` vérifie l'**absence d'orphelin**).

**Aucun corps d'élément n'est recopié** dans l'assemblage (I1/E2) — que des ids, par référence.

**⚠️ À ne PAS comprendre : « la méthode possède la team ».** Elle ne la possède pas. La méthode
possède des **rôles abstraits** ; la team possède des **personas** ; le binding les **marie**. Le
propriétaire commun est le **frame**.

```
                        frame  (frames/<id>.md : methodId + teamId)
                       /      \
              (frère) /        \ (frère)
                METHODE          TEAM
        (workflow/principles/    (personas +
         rituals/guardrails/      coordinator)
         roleKeys ABSTRAITS/
         scaffolds)
                 \                /
                  \   BINDING    /   ← le MARIAGE : persona.roleKey (team)
                   \ (teamId +  /       couvre roleKey (méthode) ; assemble
                    affectations)        vérifie « aucun orphelin »
```

Formule à graver : **« le frame possède deux frères — une méthode (des rôles) et une team (des
personas) — que le binding marie »** (par référence, jamais par copie).

### C-3 — Construire une frame = **référencer** OU **écrire**, puis **référencer**
Deux gestes seulement, et rien d'autre :
- **RÉFÉRENCER** un élément **existant** de la `library/` — le **partage est autorisé et normal** :
  un même élément peut servir à **N frames** (ex. un principe neutre `mvp-first` référencé par
  plusieurs méthodes).
- **ÉCRIRE** un **nouvel** élément dans la `library/` (id définitif, C-1) **puis le référencer**.

Il n'existe **pas de 3ᵉ voie** (pas de fork de library, pas de copie locale d'un élément partagé).

### C-4 — Pas de renommage **après** création ; **une seule** exception : la **promotion**
Aucun renommage de fichier ni de référence **dans l'usage courant** (référencer l'existant, C-3). Le
**seul** renommage légitime a lieu **une fois**, au moment de **promouvoir** un élément local en
**générique partagé** (ex. `timebox-respectee` → `time-box`, `iteration-loop` → `retrospective` au
rangement). Cette promotion est un **acte délibéré et unique**, **PAS un rework** : elle neutralise le
vocabulaire de méthode pour rendre l'élément partageable. Hors promotion, « pas de renommage » est
absolu.

### C-5 — **Personas ET skills** sont des éléments de frame comme les autres
Les personas et les skills obéissent **exactement** à C-1..C-4 (aucun régime spécial). Corollaire sur
les **homonymes inter-frames** :
- Deux frames peuvent caster le **même personnage** (même `name:` d'affichage, ex. « Ohno ») dans des
  **rôles différents** : c'est **légitime**.
- Elles coexistent via des **ids distincts** dans le pot plat : `ohno` (natif Kanban) et
  `leanstartup-ohno` (emprunteur Lean). **C'est un rangement sous ids distincts, PAS un renommage du
  personnage** — le `name:` reste « Ohno » des deux côtés.
- **Aucune déduplication forcée. Aucune garde qui pousse à qualifier.** Le choix d'un id (nu ou
  préfixé) au moment de **créer** l'élément est un acte du constructeur de frame, définitif (C-1),
  jamais imposé ni corrigé a posteriori par un outil.

---

## 2. Ce qui change vs le cadrage précédent (traçabilité de la bascule)

| Cadrage précédent (namespacing-…) | Constitution (ce lot) |
|---|---|
| Garde `name-collision` au lint (D-1..D-3), severity, `--strict` | **SUPPRIMÉE** — râlerait contre des homonymes **légitimes** (C-5), contraire au modèle |
| Débat de règle **(a) natif nu / (b) qualification systématique** | **CLOS** — on **ne renomme pas** (C-1/C-4) ; le débat a/b n'a plus lieu d'être |
| ~1 à 1,25 j-h, code CLI + tests born-red | **< 0,5 j-h, doc pur**, aucun test, aucun code |
| Réconciliation § 3.3 par pointeur | **Idem** — signalée comme item de correction (§ 3), non exécutée par Gandalf |

---

## 3. La seule correction de **texte** à faire (signalée, non exécutée ici)

**Item de correction — `rangement-catalogue-frames-reservoir.md` § 3.3.** Le passage
**« Collision inter-frames … : QUALIFIER les deux (préfixe de frame) »** est **trompeur** au regard de
C-5 : la réalité appliquée et gravée est **« natif nu / emprunteur qualifié »**, et surtout il ne
s'agit **pas** de « qualifier » au sens d'une contrainte, mais de **ranger sous des ids distincts sans
renommer le personnage**. Correction attendue : reformuler § 3.3 en **« ranger sous ids distincts
(l'un peut rester nu, l'autre préfixé), sans dédup forcée ni renommage du `name:` »**, avec pointeur
vers la présente constitution.

> **Gandalf ne modifie pas ce texte lui-même** : il appartient à un **autre lot livré**. Il est
> **signalé ici comme item de correction** à porter par l'exécutant (Fëanor), au même titre que
> l'inscription de la constitution (§ 5). *(La clause « QUALIFIER » du § 3.2 du rangement pour les
> briques **non-persona** reste valable — seule la clause **collision de personas** du § 3.3 est visée.)*

---

## 4. Enforcement — l'existant SUFFIT (rien à ajouter côté code)

**Aucune garde nouvelle.** Les invariants de la constitution sont **déjà** tenus par la mécanique en
place :

- **C-1 (id définitif = nom de fichier)** : `frame lint` bloque `id != nom de fichier` (kind
  `id-filename`) ; `add <pool> <id>` est **non destructif** (refuse d'écraser un id existant).
- **C-2 / C-3 (référencer résout)** : `frame lint` **rougit toute référence pendante** (`missing-ref`
  bloquant) — méthode→éléments, team→personas, binding, refs sortantes des atomes. Un id qui ne
  résout pas dans le pot plat **casse le lint**. Le partage inter-frames (un élément référencé par N
  méthodes) est **nativement supporté** (ce sont des ids).
- **C-4 (pas de renommage sauf promotion)** : la promotion est un **acte humain** au rangement ; rien
  à outiller. « Pas de renommage » est une **discipline**, garantie de fait par C-1 (renommer un
  fichier casserait toutes ses références → `missing-ref` rouge : la mécanique **punit** déjà le
  renommage sauvage).
- **C-5 (homonymes légitimes)** : **précisément** ce qu'aucune garde ne doit contrarier. `frame lint`
  ne regarde pas le `name:` d'affichage — c'est **le bon comportement**, à **préserver** (ne rien
  ajouter).

**Conclusion explicite : zéro code. L'enforcement existant (résolution des références + id ==
nom-de-fichier) garantit déjà « ids définitifs / références résolvent ».** Ajouter quoi que ce soit
irait contre la constitution.

---

## 5. Où grave-t-on la constitution (inscription au canon = exécution)

- **Home canonique** : la référence de forge lue par le constructeur de frame — **périmètre Fëanor**
  (`library/roles/frame.md` et/ou `library/personas/feanor.md`, section nommage/modèle) — et, si
  utile à la mémoire de référence, un renvoi porté par **Nathalie** dans la doc de méthode. Gandalf
  **grave le texte ici** (§ 1) ; son **inscription** au canon est de l'exécution.
- **Note d'assemblage déjà en place** : la note « homonymes qualifiés » de `teams/leanstartup-team.md`
  est **conforme** à C-5 (elle décrit exactement le rangement sous ids distincts) — **à conserver**,
  éventuellement à repointer vers la constitution.

---

## 6. Critères d'acceptation (mesurables — recette **de non-mouvement**)

- **A1 — la constitution existe** : les 5 invariants C-1..C-5 sont **écrits** (ici, et inscrits au
  home canonique de § 5).
- **A2 — § 3.3 corrigé** : `rangement-catalogue-frames-reservoir.md` § 3.3 se relit comme « ranger
  sous ids distincts, sans dédup forcée ni renommage du personnage », pointant la constitution.
- **A3 — renvoi posé** : `namespacing-personas-inter-frames.md` renvoie vers cette instruction (plus
  de contenu contradictoire résiduel).
- **A4 — ZÉRO mouvement mécanique** : `frame lint --all` → **exit 0 inchangé** ; `frame lint
  iakaframe` **inchangé** ; `vendor-check` → **drift 0** inchangé. `git diff` sur le **code** et sur
  `library/` (hors éventuelle inscription doc en § 5) = **vide**.
- **A5 — ZÉRO renommage, ZÉRO code, ZÉRO test** : aucun fichier de `library/personas/` ou
  `library/skills/` renommé ; aucun fichier `cli/**` modifié ; aucune dépendance ajoutée.
- **A6 — aucune garde ajoutée** : `frame lint` **ne signale toujours pas** l'homonymie de `name:`
  (comportement voulu, C-5).

---

## 7. Estimation (ordre de grandeur assumé, révisable)

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **< 0,5 j-h.** Rédaction/inscription de la constitution (§ 1) + correction du § 3.3 + renvoi. Doc pur. |
| **Complexité / risque** | **TRÈS FAIBLE.** Aucun code, aucun renommage, aucun test, aucun cross-repo. Le seul « risque » est éditorial (formuler juste). Recette = **non-mouvement** (A4/A5). |
| **Inconnues** | (1) home canonique exact de la constitution (Fëanor seul, ou + renvoi Nathalie) — arbitrage mineur de rangement doc ; (2) rien d'autre. |

---

## 8. Portée cross-repo

**Néant DANS CE LOT.** Aucun code, aucun schéma vendoré touché, aucune parité impactée. Le cœur GUI
(`resolveAssembly`, `checkFrameRefs`) est **hors sujet** : rien ne bouge dans cette instruction doc.

### Item downstream (NON exécuté ici) — aligner le GUI sur « frame = méthode + team (frères) »
*(Signalé par le décideur le 2026-07-26 ; à cadrer/coordonner **séparément**.)* La constitution grave
en C-2 que le frame possède **deux frères** (méthode ET team), et **non** « méthode ⊃ team ». Il
**faudra aligner le GUI** pour que cette relation soit **visuellement claire** (le frame montrant
méthode et team côte à côte, mariées par le binding — pas la team imbriquée dans la méthode).

- **Cross-repo `iakaFrameGUI`**, lot **à part entière**, **hors périmètre** de cette instruction doc.
- **Le GUI est l'espace de travail actif du décideur** : ce point est **nommé comme suite**, pas
  cadré ici. Aucune décision d'implémentation n'est prise dans ce lot.
- **Sans effet sur la clôture de Finding 4** : la constitution est complète et la mécanique CLI la
  respecte déjà (§ 4) ; l'alignement visuel GUI est un **confort de lisibilité downstream**.

---

## 9. Verdict — le modèle est-il clos ?

**Oui.** Avec cette constitution, les **4 biais du modèle de frame sont soldés** :
1. **Gouvernance** (`kind` first-class) — livré (v0.26.0).
2. **Cardinalité** (N=1 de première classe) — livré (v0.26.0).
3. **Schéma** (frontmatter typé + `--strict`) — livré (v0.27.0).
4. **Namespacing / partage des éléments** — soldé **ici, par la doctrine** (C-1..C-5), sans code.

Ce qui subsiste n'est **pas de la dette architecturale** mais de l'**hygiène déclarée** (non
bloquante) : slug de frame non canonique (`lean-startup` vs `leanstartup` vs teamId `gtd-solo`) ;
champs de frontmatter non canoniques encore portés par les 8 frames (dette Finding 3, tolérée) ;
miroir `StefFrame2` gelé à 8 (backlog A14). **Aucune ne remet en cause la constitution.**

**Après Finding 4, le modèle de réservoir de frames est agnostique, partageable et clos** : une
`library/` plate d'éléments à ids définitifs, des frames qui **référencent** (partage libre) ou
**écrivent** puis référencent, une seule exception de renommage (la promotion), et aucun régime spécial
pour personas/skills. La constitution est écrite ; la mécanique existante la fait déjà respecter.

---

## Sources (faits externes vérifiés — obligation de sourcing)

- Lignée Toyota Production System native de Kanban (contexte de l'homonyme Ohno/Shingo Kanban↔Lean,
  C-5) : [Creative Safety Supply — Who developed Kanban?](https://www.creativesafetysupply.com/qa/kanban/who-developed-kanban),
  [Wikipedia — Kanban](https://en.wikipedia.org/wiki/Kanban),
  [Art of Lean — Taiichi Ohno](https://artoflean.com/reference/taiichi-ohno).
</content>
