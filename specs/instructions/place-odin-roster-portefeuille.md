# Instruction — Place d'Odin : membre du roster projet, ou super-agent au-dessus ?

> Cadrée par **Gandalf** (P1 — Cadrage). **Note de décision d'architecture / nommage** — pas un
> chantier de code. Lecture réelle du LIVE + du frame + du modèle GUI (via l'instruction G6).
> Réf. : `library/personas/odin.md`, `teams/iakaframe-8.md`, `bindings/iakaframe-claude-default.md`,
> `methods/iakaframe.md`, `library/roles/portefeuille.md`, `library/skills/iakastart/SKILL.md`,
> `specs/equipe-agents.md`, `specs/instructions/open-frame-gui-stefframe2.md` (G6),
> `specs/instructions/audit-frame.md` (A1.1, A7.2), `~/.claude/CLAUDE.md`.

---

## 1. La question (du décideur)

**Odin doit-il figurer dans le roster de la team d'un projet** (`iakaframe-8` compte odin + 7),
**ou est-ce une incohérence de modèle** — le portefeuille n'étant pas un membre de la compagnie
projet mais un étage **au-dessus** ?

C'est un **arbitrage d'architecture et de nommage**, pas un défaut technique à corriger : le LIVE
est déjà cohérent avec lui-même (team 8 ⟷ binding 8). La question est **ce que l'entité `team`
doit signifier** — « casting de référence de la compagnie (tous les personas du frame) » ou
« liste des agents projet dispatchables ».

---

## 2. Faits vérifiés (lecture réelle, chemin:ligne)

### 2.1 Odin est déclaré « au-dessus », transverse, hors casting projet — dans sa propre persona

| Fait | Source |
|---|---|
| `roleKey: portefeuille`, `royaume: PORTEFEUILLE`, pastille `🟡` | `library/personas/odin.md:4-6` |
| « Incarnation… du **niveau portefeuille** (au-dessus des équipes) » | `library/personas/odin.md:16-17` |
| Hiérarchie `Odin (portefeuille) → Aragorn (par équipe/projet) → agents` ; « le **seul agent affecté à `C:\work`** » | `library/personas/odin.md:20-22` |
| « Odin est **transverse** (le seul)… **jamais scopé à un projet** » | `library/personas/odin.md:82` |
| **Auto-réconciliation déjà écrite** : « il **n'est pas un membre du casting d'une équipe projet** et n'est **pas dispatché comme un agent d'équipe**… **même lorsqu'il figure au roster de référence de la compagnie, c'est en tant que super-agent au-dessus**, non comme exécutant d'équipe » | `library/personas/odin.md:86-90` |

### 2.2 …mais il EST listé dans le roster de la team, et assigné dans le binding

| Fait | Source |
|---|---|
| `personas: [odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie]` (**8**, odin en tête) ; `coordinator: aragorn` (pas odin) | `teams/iakaframe-8.md:4,5` |
| Binding : **8 assignations** dont `{ personaId: odin, runner: claude-code, model: opus }` | `bindings/iakaframe-claude-default.md:8` |

### 2.3 La méthode modélise DÉJÀ deux étages (portefeuille + projet)

| Fait | Source |
|---|---|
| `roleKeys: [portefeuille, coordination, cadrage, dev, qualite, deploiement, design, documentation]` — `portefeuille` est un roleKey **à part**, en tête | `methods/iakaframe.md:11` |
| `scaffoldIds: [portefeuille, projet]` — **deux** scaffolds, deux niveaux | `methods/iakaframe.md:12` |
| Rôle `portefeuille` : `scope: portfolio`, « Niveau portefeuille, **au-dessus de toutes les équipes**… N'entre jamais dans le métier d'un projet » | `library/roles/portefeuille.md:6,14` |

### 2.4 La séparation est DÉJÀ opérationnelle (outil de déploiement + GUI)

| Fait | Source |
|---|---|
| Le déploiement d'équipe **`fullteam` EXCLUT Odin** ; « Odin s'affecte à part : `-Action affect -Agent odin -Project C:\work` » | `specs/equipe-agents.md:197-198` |
| « `fullteam` **exclut Odin** (portefeuille) » + Odin affecté à `C:\work\.claude\` (pas dans `<projet>/.claude/`) | `specs/equipe-agents.md:197-199` |
| Modèle GUI : `ScaffoldLevel = "portfolio" \| "project"`, `PORTFOLIO_SCAFFOLD` = `~/work`+`BACKLOG.md` ; `roster.ts` mappe rôle portefeuille → « Odin » | `open-frame-gui-stefframe2.md:57-58, 260` |
| **G6 — super-étage** : entité conteneur « Portefeuille/Frame » **au-dessus de Method/Team/Binding**, qui **rattache explicitement** le scaffold `portfolio` + la persona `odin` — au lieu des « trois formes éclatées » | `open-frame-gui-stefframe2.md:122-136, 231-237` |
| Audit A7.2 : « Odin a un **foyer fragmenté** (scaffold `level:portfolio` + rôle `portefeuille` + persona `odin`) — **mais aucune entité assemblée “Portefeuille”** ». Reco : modéliser l'assemblage portefeuille. Impact **élevé** / effort **M-L** / **P1** | `audit-frame.md:126-131` |

### 2.5 Le nom, iakastart et le CLAUDE.md global comptent 8 — **odin inclus**

| Fait | Source |
|---|---|
| Team nommée `iakaframe-8`, « La compagnie iakaframe » | `teams/iakaframe-8.md:1-2` |
| iakastart : « affiche… le **ROSTER des 8 agents** » ; tableau incluant `odin` en 1ʳᵉ ligne | `library/skills/iakastart/SKILL.md:4,30,38` |
| CLAUDE.md global : « roster des **8 agents** (**odin**, aragorn, gandalf, gimli, legolas, helm, loki, nathalie) » | `~/.claude/CLAUDE.md` (§ iakastart) |
| Précédent : le point « Odin dans le roster » a été **explicitement parqué** comme réservé au décideur (touche le LIVE) | `correctif-roster-team-helm.md:93-97` |
| Audit A1.1 : reco antérieure de **sortir odin** du casting, mais l'estimation « effort **XS** » ne chiffre que l'édition brute, **pas la cascade** (nom, iakastart, CLAUDE.md, GUI) | `audit-frame.md:17-20` |

**Synthèse factuelle** : le système est dans un **état à deux voix cohérent mais non explicite** —
*déclarativement* odin est dans le roster (nom -8, binding, iakastart, CLAUDE.md, GUI `roster.ts`) ;
*doctrinalement et opérationnellement* il est **au-dessus** (persona `:82-90`, `fullteam` l'exclut,
scaffold `portfolio`, G6). La tension est donc **sémantique** (« que signifie `team` ? »), pas un
bug de données.

---

## 3. Les deux thèses (pesées honnêtement)

### Thèse A — Odin RESTE au roster (le roster = casting de référence de la compagnie)
En une ligne : *odin est une persona du frame comme les autres, simplement de rôle portefeuille ;
la team est l'inventaire de référence de la compagnie, et la persona dit déjà « présent au roster
en tant que super-agent au-dessus, non comme exécutant ».*

- **Pour** : cohérent avec le nom `iakaframe-8`, le binding (8), iakastart (8), le CLAUDE.md global
  (8 dont odin), le `roster.ts` GUI. La persona **réconcilie déjà** explicitement (`odin.md:86-90`).
  La séparation d'étage existe **là où elle doit agir** (déploiement `fullteam`, doctrine
  d'étanchéité, scaffold), sans amputer l'inventaire. **Coût quasi nul.**
- **Contre** : un lecteur non averti peut lire odin comme un **pair dispatchable** du projet ; deux
  étages cohabitent dans **une même liste plate** sans marqueur de premier ordre. La tension
  sémantique reste, juste **documentée** plutôt que **structurée**.

### Thèse B — Odin SORT du roster projet (le portefeuille est un étage au-dessus)
En une ligne : *le portefeuille est structurellement au-dessus d'une team projet ; l'inclure
mélange deux étages, exactement le super-étage Frame/Portfolio que G6/A7.2 veulent séparer.*

- **Pour** : pureté conceptuelle — `team` = casting projet dispatchable **uniquement** ; aligne le
  déclaratif sur l'opérationnel (`fullteam` exclut déjà odin) et sur la doctrine (`odin.md:82`) ;
  cohérent avec la logique du super-étage (§2.4). Le roleKey `portefeuille` de la méthode serait
  alors couvert **au niveau portefeuille**, pas dans le casting projet.
- **Contre** : **cascade transverse à coût élevé** (§5) — renommer la team, toucher le LIVE
  (team + binding), iakastart, le CLAUDE.md global, la GUI (`roster.ts`/scaffold), `equipe-agents.md`
  et **toutes** les mentions « 8 agents ». Valeur ajoutée surtout **cosmétique/conceptuelle** tant
  que le vrai foyer d'odin (entité « Portefeuille » assemblée, A7.2/G6) n'est pas construit — la
  simple soustraction déplace le trou sans créer l'étage.

---

## 4. Recommandation de Gandalf : **Thèse A affinée** (garder odin au roster + rendre l'étage explicite)

**Je recommande de garder odin au roster de référence**, tout en traitant la vraie cause de la
tension par le **super-étage portefeuille déjà backloggé** (A7.2 / G6) plutôt que par une
amputation coûteuse.

Justification :
1. **La séparation d'étage existe déjà là où elle compte** : `fullteam` exclut odin
   (`equipe-agents.md:197`), la persona interdit son dispatch projet (`odin.md:86-90`), le scaffold
   `portfolio` et G6 le rattachent au niveau au-dessus. Le problème n'est **pas** que le système
   confond les étages ; c'est que la distinction n'est **pas de premier ordre dans le modèle `team`**.
2. **Réutiliser l'existant / MVP-first** (conventions permanentes) : la solution structurelle est
   **déjà cadrée** (A7.2 « modéliser un assemblage portefeuille » ; G6 « entité conteneur au-dessus
   de Method/Team/Binding qui rattache scaffold portfolio + odin »). Faire porter la distinction par
   cette entité **résout la sémantique sans casser le nom** ni déclencher la cascade.
3. **Coût / valeur** : la thèse B a un **coût élevé et transverse** (§5) pour un gain surtout
   conceptuel ; l'audit A1.1 chiffrait « effort XS » en oubliant la cascade — c'est trompeur.
4. **La persona réconcilie déjà** l'apparente contradiction en toutes lettres (`odin.md:86-90`) :
   « présent au roster… en tant que super-agent au-dessus, non comme exécutant ». Autrement dit, la
   doctrine tient **déjà** thèse A.

> **Réserve honnête** : la reco antérieure (audit A1.1) penchait vers B pour la pureté. Ma reco A
> **ne nie pas** la tension — elle affirme que **la bonne dépense** est de rendre l'étage portefeuille
> **first-class** (A7.2/G6), pas de retrancher odin. Si le décideur privilégie la **pureté du
> concept `team`** (casting strictement projet), la thèse B est parfaitement cohérente — au prix de
> la cascade §5, et le **nommage** de remplacement lui revient (§7).

**Action minimale si Thèse A retenue** (hors ce cadrage, à instruire séparément) : ajouter dans
`teams/iakaframe-8.md` un **marqueur explicite** que odin y figure au **niveau portefeuille**
(hors casting dispatchable) — p.ex. un champ `portfolioMember: odin` ou un commentaire normatif —
et lier le tout à l'entité « Portefeuille » d'A7.2/G6. Aucune donnée cassée, nom préservé.

---

## 5. Périmètre d'impact **SI la Thèse B est choisie** (cascade — à mesurer les yeux ouverts)

Retrancher odin du casting projet **n'est pas une édition XS** ; c'est un chantier transverse qui
touche le LIVE et plusieurs surfaces. À cadrer en instruction(s) dédiée(s) si B est retenu :

1. **Renommer la team** : `iakaframe-8` → un nom qui ne compte plus odin. Deux familles d'options
   (à trancher par le décideur, §7) : **numérique** (`iakaframe-7`) ou **non-numérique** (p.ex.
   « la compagnie de dev », un id stable non chiffré pour ne plus indexer sur le compte).
   → LIVE `teams/iakaframe-8.md` (`id`, `name`, `personas` 8→7) + **renommage de fichier**.
2. **Binding** : retirer l'assignation `odin` (8→7) et **statuer où vit le runner+model d'odin**
   (un binding/scaffold **portefeuille** ? sinon on perd l'info opus d'odin). → LIVE
   `bindings/iakaframe-claude-default.md:8` + éventuel nouvel artefact portefeuille.
3. **iakastart** : « roster des **8** » → **7** dans le casting projet, **odin présenté à part** (au
   niveau portefeuille). → `library/skills/iakastart/SKILL.md:4,30-45` (texte, tableau, alias).
4. **CLAUDE.md global** (`~/.claude/CLAUDE.md`) : « roster des 8 agents (odin, …) » → 7 + odin
   au-dessus. **Hors dépôt** iakaframe (fichier utilisateur global) → **acte du décideur**.
5. **Modèle GUI** (dépôt `iakaFrameGUI`, séparé) : `packages/core/roster.ts` (rôle portefeuille →
   Odin), scaffold, et l'entité G6 doivent refléter « odin ∉ casting projet, ∈ super-étage ». → hors
   ce dépôt, à coordonner (Odin/portefeuille).
6. **Narratif** : `specs/equipe-agents.md` (tableaux « 8 agents », hiérarchie), `methode-de-travail.md`
   si mention du compte, et **toute** occurrence « les 8 » / `iakaframe-8` (≥ 20 fichiers repérés,
   dont le miroir `frames/releases/StefFrame2/`).
7. **Miroir frame** : répercuter team/binding renommés dans `frames/releases/StefFrame2/` (étanchéité
   d'édition : via `resync-stefframe2-miroir-live.md`, un seul point d'édition du fichier team).
8. **Invariant `set(team.personas) == set(binding.personaId)`** (posé par
   `correctif-roster-team-helm.md:82`) : à **redéfinir**, sinon retirer odin d'un seul côté le viole.

> Effort réel : **M-L**, transverse LIVE + frame + GUI + fichier utilisateur global. À **ne pas**
> confondre avec l'édition brute « -1 ligne » de la team.

---

## 6. Critères d'acceptation (selon la thèse retenue)

### Si Thèse A (recommandée)
1. `teams/iakaframe-8.md` conserve `personas` = **8** ; **aucun** fichier « 8 agents » n'est cassé.
2. Le fait « odin = niveau portefeuille, **hors casting dispatchable** » est **explicite dans le
   modèle** (marqueur dans la team et/ou entité Portefeuille A7.2/G6), **pas seulement** dans la prose
   de la persona.
3. Invariant `set(team.personas) == set(binding.personaId)` **toujours vrai** (non-régression).
4. iakastart / CLAUDE.md / GUI **inchangés** — cohérence à 8 préservée.
5. Le travail de fond « entité Portefeuille » reste tracé au backlog (A7.2 / G6) comme **le** foyer
   d'odin.

### Si Thèse B
1. La team ne contient **plus** odin ; son `name`/`id` **ne mentent plus** sur le compte (nom choisi
   par le décideur, §7).
2. Binding **sans** odin ; le **runner+model d'odin** a un **foyer explicite au niveau portefeuille**
   (aucune perte d'information opus).
3. iakastart, `~/.claude/CLAUDE.md`, `specs/equipe-agents.md`, GUI `roster.ts` : **tous** alignés
   sur « casting projet = 7, odin = super-étage à part » — **0** occurrence résiduelle « 8 dont odin »
   dans le casting projet.
4. Miroir `frames/releases/StefFrame2/` re-synchronisé (via l'instruction de re-synchro dédiée).
5. Invariant roster⟷binding **redéfini** de façon à rester vrai après le retrait d'odin.
6. Le roleKey `portefeuille` de `methods/iakaframe.md:11` est **couvert au niveau portefeuille**
   (entité Portefeuille), pas orphelin.

---

## 7. Ce que **SEUL le décideur** peut trancher (arbitrage — je ne tranche pas à sa place)

1. **La sémantique de `team`** : « casting de **référence** de la compagnie (tous les personas du
   frame, odin inclus) » **vs** « liste des agents **projet dispatchables** (odin exclu) ». Tout
   découle de ce choix. → **choix A vs B.**
2. **Le nommage de remplacement** (uniquement si B) : **numérique** `iakaframe-7` **ou**
   **non-numérique** (id stable non indexé sur le compte, p.ex. « compagnie de dev »). Je **ne
   recommande pas** de nom — c'est de l'identité produit.
3. **L'édition du CLAUDE.md global** (`~/.claude/CLAUDE.md`, hors dépôt) : acte utilisateur, requis
   si B.
4. **Le degré d'explicitation en Thèse A** : simple marqueur dans la team, ou attendre l'entité
   Portefeuille complète (A7.2/G6) — arbitrage d'ordonnancement portefeuille.

---

## 8. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Note de décision `place-odin-roster-portefeuille.md` : la tension est **sémantique** (que signifie `team` ?), pas un bug de données ; séparation d'étage **déjà** opérationnelle (`fullteam` exclut odin, persona `:86-90`, scaffold `portfolio`, G6). **Reco : Thèse A affinée** (garder odin, rendre l'étage first-class via A7.2/G6) ; **Thèse B cohérente mais cascade M-L** (§5). Nommage & sémantique `team` **réservés au décideur** (§7) | 🟢 Le décideur (Stéphane) → tranche A/B (+ nommage si B) → instruction(s) d'exécution dédiée(s) |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Doctrine « au-dessus / hors casting » : `library/personas/odin.md:82`, `:86-90`.
- Présence au roster / binding : `teams/iakaframe-8.md:4`, `bindings/iakaframe-claude-default.md:8`.
- Deux étages dans la méthode : `methods/iakaframe.md:11-12`, `library/roles/portefeuille.md:6,14`.
- Séparation déjà opérationnelle : `specs/equipe-agents.md:197-199`.
- Super-étage (foyer réel d'odin) : `open-frame-gui-stefframe2.md:122-136`, `audit-frame.md:126-131`.
- Le compte « 8 » à surface multiple : `library/skills/iakastart/SKILL.md:4,38`, `~/.claude/CLAUDE.md` (§ iakastart).
- Précédent parqué : `correctif-roster-team-helm.md:93-97` ; reco antérieure : `audit-frame.md:17-20`.

---

## Statut

**PROPOSÉ — en attente d'arbitrage du décideur.** Aucun code, aucune donnée LIVE modifiée par ce
cadrage. Reco Gandalf : **Thèse A affinée**. Le choix A/B et, le cas échéant, le nommage restent
**réservés au décideur** (arbitrage d'architecture / identité, pas purement technique).
