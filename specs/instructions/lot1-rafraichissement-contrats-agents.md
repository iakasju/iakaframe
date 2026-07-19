# Instruction — Lot 1 : rafraîchissement des contrats d'agents

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut en fin de doc.
> Chantier « critique des agents », Lot 1 (les 4 axes validés par le décideur).
> Réf. code : `cli/src/lib/agents.js`, `cli/src/lib/kit.js:96` (`copyKit`), `cli/src/lib/library.js:15`,
> `cli/src/lib/root.js:8-10`, `install.mjs:348`. Réf. canon : `library/personas/*.md`,
> `methode-de-travail.md:553-617` (canal), `specs/equipe-agents.md:123-126` (RQV),
> `library/skills/iakaframe-naonedge/SKILL.md`, `library/skills/iakaframe-init/SKILL.md`.
> Réf. cadrage antérieur : `specs/instructions/reconcilier-kit-source-frame.md`.

---

## 0. Besoin (reformulé)

Les **contrats d'agents** déployés (`~/.claude/agents/*.md`) ont **dérivé** de leur source
canon (`library/personas/*.md`). La dérive est **bidirectionnelle** : le déployé est tantôt
**en retard** (Odin sans posture CTO, Aragorn sans anti-fusion ni « merge⇒version », Nathalie
sans web/studio), tantôt **en avance** (Loki déployé plus riche que sa persona). S'y ajoutent
des **suppositions d'OS impossibles** (Windows + macOS simultanés), des **faits périmés**
(canal Slack, charte par défaut incohérente, RQV absente de Legolas) et un **scaffold `init`
au mauvais roster** (ancien modèle numéroté).

Objectif Lot 1 (MVP, **contenu**) : rétablir **une source de vérité** et **réaligner** les 8
contrats déployés dessus, en **préservant** l'avance de Loki, en **portabilisant** les chemins,
en **corrigeant** les faits, et en **remplaçant** le roster legacy de `iakaframe-init`. On ne
construit **pas** ici le générateur persona→contrat ni l'enforcement par hook (lots lourds §9).

---

## 1. Topologie des contrats — les 4 couches (cartographie vérifiée)

| # | Couche | Chemin | Frontmatter | Valeurs | Rôle |
|---|---|---|---|---|---|
| 1 | **Canon source** | `library/personas/*.md` (8) | riche (`id,roleKey,royaume,pastille,skills,guardrails,vignette`) | réelles | **Source de vérité** du **corps** (sémantique de rôle). Déclarée telle par `cli/src/lib/library.js:15` (table `COLLECTIONS`) et par `reconcilier-kit-source-frame.md:50`. |
| 2 | **Déployé (perso, live)** | `~/.claude/agents/*.md` (8) | Claude Code (`name,description,tools`) | réelles (`C:\work`, Slack) | Contrats **réellement lus par Claude Code**. Rendu **périmé** d'anciennes personas + **enrichissements locaux** (Loki). |
| 3 | **Kit (live)** | `kits/iakaframe-claude/.claude/` | — | — | Contient `commands/` + `settings.local.json` mais **PAS** de `agents/` : par **design** (le kit reste lean ; les personas sont matérialisées à part). Cf. `reconcilier-kit-source-frame.md:103`. |
| 4 | **Frame (releases gelées)** | `frames/releases/StefFrame{1,2}/kits/iakaframe-claude/.claude/agents/*.md` (8) | Claude Code | **déparamétrées** (`<IAKAFRAME_HOME>`, `<CHAT>`) | **Snapshot figé** régénéré uniquement au prochain build de frame. **Ne pas toucher.** |

### Mécanique de déploiement (vérifiée — et son défaut)
- `iakaframe init`/`onboard` → `copyKit` (`cli/src/lib/kit.js:96`) copie **le kit seul** (aucun agent),
  **puis** `affectPersona`/`fullteam` (`cli/src/lib/agents.js:80,125`) copie les personas vers
  `<target>/.claude/agents/`. `install.mjs:348` a bien un planner `Agents` mais il lit
  `kits/iakaframe-claude/.claude/agents/` qui **n'existe pas** → **0 agent posé par cette voie**.
- **Défaut racine (confirmé) :** `affectPersona` lit `path.join(root, 'agents', …)`
  (`cli/src/lib/agents.js:83`) — **répertoire inexistant** : les personas ont été déplacées vers
  `library/personas/` par le rangement pluriel, mais `agents.js` **n'a pas suivi**. De plus il fait
  une **copie brute** (frontmatter persona `id/roleKey/…`), alors que Claude Code attend
  `name/description/tools`. **Il n'existe donc AUCUN générateur persona→contrat câblé au déploiement
  live** ; le seul rendu correct (transform frontmatter + déparamétrage) vit dans le **build de
  frame**. → **C'est la cause racine de la dérive** (confirme l'hypothèse du décideur). Dette déjà
  identifiée hors-scope par `reconcilier-kit-source-frame.md:55-57,237`.

---

## 2. Source de vérité — RECOMMANDATION (le point structurant)

**Recommandation : `library/personas/*.md` = canon du CORPS de rôle** (déjà la vérité déclarée
par le CLI). Le **déployé** (`~/.claude/agents/*.md`) et les **frames** en sont des **dérivés**.

Conséquences opératoires pour Lot 1 (drift **bidirectionnel** → jamais de régénération naïve) :

1. **Rapatrier D'ABORD l'avance de Loki** (déployé → persona), sinon toute propagation la **perd**.
2. **Corriger les 4 axes dans les personas** (canon).
3. **Propager** les corps corrigés vers le **déployé** `~/.claude/agents/*.md`, en **préservant leur
   frontmatter Claude Code** (`name/description/tools`) et en y **ajoutant `guardrails`**.
4. Le **générateur persona→contrat** (transform frontmatter + déparamétrage + wiring deploy, +
   correction de `agents.js`) est le **fix durable** mais **hors Lot 1** (§9) — sans lui la dérive
   **reviendra** : c'est le **lot suivant recommandé**.

> Pourquoi pas régénérer via le CLI maintenant ? Parce que la voie `affectPersona` est **cassée**
> (lit `<root>/agents/`) **et** fait une copie brute (mauvais frontmatter). Réparer cela = le lot
> générateur (§9). Lot 1 = **resync de contenu chirurgical, à la main**, sur les 2 couches vivantes
> (canon + déployé), **sans** toucher kit-live (couche 3, vide par design) ni frames (couche 4, gelées).

---

## 3. Les 4 axes — périmètre exact (fichiers:lignes)

### Axe 1 — Portabilité chemins / OS
Cible **portable unique** = le **dossier chapeau** tel que le CLI le résout déjà
(`cli/src/lib/root.js:8-10` : `IAKAFRAME_ROOT` env > `C:\work` sur Windows > `~/work` sinon).
Convention de rédaction retenue : **`$IAKAFRAME_ROOT` (dossier chapeau, par défaut `~/work` sur
macOS/Linux)**. Références d'**outil** : **verbes CLI Node** (`iakaframe onboard`,
`iakaframe agents fullteam`) au lieu des `.ps1`.

| Fichier | Lignes | Action |
|---|---|---|
| `library/personas/odin.md` | 20, 21, 82 (`C:\work`) | → `$IAKAFRAME_ROOT` (chapeau, défaut `~/work`). |
| `library/personas/odin.md` | 59-60 (`iakaframe-onboard.ps1`, `iakaframe-agents.ps1`) | → verbes CLI : `iakaframe onboard`, `iakaframe agents fullteam --project <p>`. |
| `~/.claude/agents/odin.md` | desc + 15, 16, 46 (`C:\work`) | → `~/work` (valeur réelle macOS) / `$IAKAFRAME_ROOT`. |
| `~/.claude/agents/odin.md` | 26-27 (`.ps1`) | → verbes CLI (idem). |
| `library/personas/loki.md` / `~/.claude/agents/loki.md` | réf. `iakagraph` (déployé:81) ; Nathalie `~/work/iakacharte` (`nathalie.md:38`) | **Ancrer sous le chapeau** : `$IAKAFRAME_ROOT/iakagraph`, `$IAKAFRAME_ROOT/iakacharte`. Nit basse priorité. |
| `~/.claude/agents/loki.md` | 53-54 (`qlmanage … sur macOS`) | **NE PAS corriger** — commande OS **justifiée** (runtime = macOS), déjà qualifiée « sur macOS ». Conserver. |

### Axe 2 — Corrections factuelles

**(2a) Canal de communication** — canon = **iakaHub ↔ Discord + repli terminal gracieux**
(`methode-de-travail.md:553-617` ; dégradation gracieuse `:605-606` « tout tourne box éteinte »,
même patron que `library/skills/iakaframe-log-conversation/SKILL.md:45`).

| Fichier | Lignes | Action |
|---|---|---|
| `~/.claude/agents/aragorn.md` | 3 (desc « via Slack »), 41-51 (§ « Canal … : Slack via n8n ») | Réécrire en **iakaHub↔Discord** : Aragorn parle via `ask()` → **terminal si Odin présent, sinon iakaHub→Discord** (canal du projet, sous son persona) ; **repli terminal gracieux**. |
| `library/personas/aragorn.md` | 51-61 (même § Slack) | Idem (canon). |
| `~/.claude/agents/odin.md` | 3, 17, 41 (« voix / Slack ») | → iakaHub/Discord : Odin reçoit via **`#odin`** (saisie directe) + **terminal** ; supprimer « voix / Slack ». |
| `library/personas/odin.md` | 22, 77 (« voix / Slack ») | Idem (canon). |

**(2b) Legolas — Revue Qualité de Version (RQV)** — clause **absente** des deux couches.
Ajouter, **sans** toucher le gate **automatique dev→stage** (by-design, `specs/equipe-agents.md:120-121`).

| Fichier | Ancre | Action |
|---|---|---|
| `library/personas/legolas.md` | après § « Gate » / « Profondeur graduée » (l.41-47) | Ajouter clause **RQV** : à **chaque version mineure**, produit (avec 📖 Nathalie) le **document d'évaluation complète** — verdict **go/no-go = gate HUMAIN**. Réf. `specs/equipe-agents.md:123-126`, `specs/instructions/revue-qualite-version.md`. Distincte du gate auto (granularité **version**, pas livraison). |
| `~/.claude/agents/legolas.md` | idem (l.36-42) | Idem (déployé). |

**(2c) Charte par défaut — CANON CONTEXTUEL (arbitré par le décideur, 2026-07-19)**
Le défaut de charte n'est **PAS global** : il est **contextuel au type de travail**. La prémisse du
brief (« skill = Cinabre ») **ET** la vérification initiale de Gandalf (« skill = NaonEdge »)
étaient **toutes deux** partielles. État réel : **les 3 sources affirment chacune un défaut UNIQUE,
et sont donc TOUTES fausses** au regard du canon contextuel :
- skill **active** `~/.claude/skills/iakaframe-naonedge/SKILL.md:18-19,26` → « **Cinabre** par défaut » ;
- skill **repo** `library/skills/iakaframe-naonedge/SKILL.md:4,19,25` + Loki (persona `:24,37`, déployé `:35,71`) → « **NaonEdge** par défaut » ;
- Nathalie `library/personas/nathalie.md:38` → « **Cinabre** ».

**Canon contextuel (supersède tout défaut unique)** — mapping **contexte de travail → charte** :

| Contexte de travail | Charte par défaut | Statut |
|---|---|---|
| **Projet de dev logiciel** (iakaFrameGUI, iakaframe, apps) | **Studio clair** | tranché |
| **Travaux NaonEdge** (supports de l'entité NaonEdge) | **NaonEdge** (dark premium · or) | tranché |
| **Conseil / pro** (selon skill active) | **Cinabre** | **NON tranché** — point ouvert (§10), ne pas l'inventer comme défaut d'un contexte non nommé |

→ **Action** : rendre la logique de défaut de charte de Loki **CONDITIONNELLE au contexte**, et faire
porter le **MÊME canon** par **toutes** les sources — **plus aucune** affirmation de défaut unique :

| Source | Ancre | Action |
|---|---|---|
| `library/personas/loki.md` | 24 (§ Catalogue « par défaut NaonEdge »), 37 (Entrées→Sorties « ou défaut NaonEdge ») | Remplacer par le **mapping contexte→charte** (défaut conditionnel). |
| `~/.claude/agents/loki.md` | 35, 71 (idem) | Idem (déployé). |
| `library/skills/iakaframe-naonedge/SKILL.md` (repo) | 4 (frontmatter), 19, 25-28 (§ « Charte par défaut : NaonEdge ») | Réécrire en mapping contextuel ; plus de « NaonEdge par défaut » unique. |
| `~/.claude/skills/iakaframe-naonedge/SKILL.md` (active) | 3 (frontmatter), 18-19, 26 (§ « Charte par défaut : CINABRE ») | Réécrire en mapping contextuel ; plus de « Cinabre par défaut » unique. |
| `library/personas/nathalie.md` | 38 (« par défaut **Cinabre** ») | Remplacer par le renvoi au **canon contextuel** (le studio applique la charte du contexte). |
| `~/.claude/agents/nathalie.md` | § « Ne fait pas » (handoff studio) | Propager le renvoi au canon contextuel (voir aussi Axe 3, propagation web/studio). |

Loki **découvre** dynamiquement les dossiers `design-*/` : le canon fixe le **mapping
contexte→charte**, Loki **résout** le dossier réel (`design-studio-clair/` / `design-naonedge/` /
`design-cinabre/`) — ne pas coder en dur un chemin absent du catalogue.

### Axe 3 — Resync + tools + guardrails

- **Réinjecter les clauses manquantes** dans le **déployé** (propagation depuis le canon corrigé) :

| Agent (`~/.claude/agents/`) | Clause à réinjecter | Source canon |
|---|---|---|
| `odin.md` | **Posture CTO** (§ Posture + Apprentissage de fond) | `library/personas/odin.md:29-54` |
| `aragorn.md` | **Anti-fusion de rôle** (Périmètre, ne reprend pas un rôle non casté) | `library/personas/aragorn.md:28-32` |
| `aragorn.md` | **Merge ⇒ versionnement (couplés)** | `library/personas/aragorn.md:78-83` |
| `nathalie.md` | **§ Web & discipline de sourcing** + **studio/charte** (renvoi au canon contextuel §2c) | `library/personas/nathalie.md:41-51,36-39` |

- **Tools Nathalie** : `~/.claude/agents/nathalie.md:4` `tools:` = `Read, Write, Edit, Grep, Glob, Bash`
  → **ajouter `WebSearch, WebFetch`** (son contrat exige un sourcing URL, `personas/nathalie.md:44-51`).
- **Champ `guardrails`** : `library/personas/*.md:8` déclarent `guardrails:[…]` mais **aucun**
  frontmatter `~/.claude/agents/*.md` ne l'a (vérifié : `grep -l guardrails ~/.claude/agents/*.md` = ∅).
  **Restaurer** dans les **8** frontmatters déployés, en copiant la valeur de la persona
  correspondante (`[identity, perimeter]`, ou `[identity, perimeter, delegation]` pour odin/aragorn).
  Champ **inerte** (métadonnée) : toléré par Claude Code (frontmatter non listé = ignoré, seuls
  `name`/`description` requis — cf. docs officielles). **L'enforcement réel par hook = lot séparé (§9).**

> Agents **gimli, gandalf, helm** : vérifiés **propres** sur canal/chemins (aucun `C:\work`/Slack) ;
> **seul** `guardrails` leur manque au frontmatter → l'ajouter (rien d'autre).

### Axe 4 — Roster legacy `iakaframe-init`
`library/skills/iakaframe-init/SKILL.md:4` promet « les **sept** contrats » et `:25-31` scaffolde
l'**ancien modèle numéroté** (`agent-orchestrateur`, `agent-0-cadrage` … `agent-5-surveillance`) —
**pas** les 8 personas. De plus il pointe un dossier `assets/` **inexistant** (skill doublement
cassée).

→ **Remplacer** par les **8 personas** actuelles (odin, aragorn, gandalf, gimli, legolas, helm,
loki, nathalie). **Recommandation Gandalf (réutiliser l'existant)** : faire **déléguer** la skill à
la voie CLI qui fait déjà le bon travail — `iakaframe onboard` (structure) + `iakaframe agents
fullteam` (les 8 personas) — plutôt que de recopier une liste d'assets qui redériverait.
**Alternative** (si le décideur veut garder un scaffold autonome) : réécrire l'inventaire `:18-36`
sur les 8 personas et créer les assets. À trancher au gate.

---

## 4. Ordre des opérations (impératif)

0. **Gate décideur** : (a) **charte = canon contextuel §2c, déjà arbitré** — seul reste ouvert
   (non bloquant) : confirmer ou non un **3e contexte** « conseil/pro → Cinabre » ; (b) skill `init`
   — déléguer CLI vs scaffold autonome (§Axe 4) ; (c) générateur persona→contrat maintenant ou en
   lot suivant (§9).
1. **Rapatrier Loki AVANT tout** : copier dans `library/personas/loki.md` les 2 sections **présentes
   uniquement au déployé** — `## Expertise — un vrai directeur artistique` (`~/.claude/agents/loki.md:16-30`)
   et `## Atelier — VOIR puis juger` (`:47-68`) — aux bons emplacements (Expertise après Mission ;
   Atelier après Périmètre). Vérifier : `diff` corps persona↔déployé = **uniquement** frontmatter +
   la valeur de charte par défaut (§2c). **Aucune** perte de contenu Loki.
2. **Corriger les personas (canon)** : Axe 1 (odin), Axe 2a (odin+aragorn canal), Axe 2b (legolas RQV),
   Axe 2c (appliquer le **canon contextuel** de charte). (Aragorn anti-fusion/merge et Nathalie web/studio sont **déjà**
   dans le canon — rien à y faire ; ils seront **propagés** au déployé à l'étape 3.)
3. **Propager vers le déployé** `~/.claude/agents/*.md` : réinjecter les clauses (tableau Axe 3),
   portabiliser (Axe 1), canal (Axe 2a), RQV (Axe 2b), charte (Axe 2c), `tools` Nathalie, `guardrails`
   sur les 8. **Préserver** le frontmatter Claude Code + le corps riche de Loki.
4. **Axe 4** : réécrire `library/skills/iakaframe-init/SKILL.md` (8 personas / délégation CLI selon 0b).
5. **Vérifier §6**, puis **committer** (conventional commit, ex.
   `refactor(agents): resync 8 contrats sur personas canon (portabilite, canal, RQV, guardrails, roster init)`).

---

## 5. Ce qui N'EST PAS touché (couches & constats hors Lot 1)

- **Couche 3 (kit live)** : ne **pas** ajouter `.claude/agents/` — vide **par design**
  (`reconcilier-kit-source-frame.md:103`).
- **Couche 4 (frames gelées)** : **aucune** écriture sous `frames/releases/**`.
- **Nathalie/AppFlowy** : comportement **voulu** (génériqué au release seulement). **Ne PAS** renommer
  AppFlowy → humandoc côté source ni déployé.
- **Legolas gate auto dev→stage** : **by-design**, on **garde** (on ajoute la RQV **en plus**).
- **qlmanage (Loki)** : commande macOS **justifiée**, conservée.

---

## 6. Critères d'acceptation (testables)

- [ ] **Portabilité** : `grep -rn 'C:\\work' ~/.claude/agents/` = **0** ; `grep -rln 'C:\\work' library/personas/` = **0**.
- [ ] **Outil portable** : `grep -rn '\.ps1' ~/.claude/agents/odin.md library/personas/odin.md` = **0** (verbes CLI à la place).
- [ ] **qlmanage conservé** : `grep -c 'qlmanage' ~/.claude/agents/loki.md` ≥ 1 (non « corrigé »).
- [ ] **Loki préservé (rapatriement)** : `grep -c 'Expertise — un vrai directeur artistique' library/personas/loki.md` = 1 **ET** `grep -c 'Atelier — VOIR puis juger' library/personas/loki.md` = 1.
- [ ] **Charte — plus aucun défaut global unique** : `grep -rniE '(cinabre|naonedge|studio clair) par défaut|par défaut *:? *(cinabre|naonedge|studio)' library/skills/iakaframe-naonedge/SKILL.md ~/.claude/skills/iakaframe-naonedge/SKILL.md library/personas/loki.md library/personas/nathalie.md ~/.claude/agents/loki.md ~/.claude/agents/nathalie.md` ne renvoie **aucune** affirmation de défaut **unique** (toute occurrence « par défaut » est **conditionnée par le contexte**).
- [ ] **Charte — mapping contextuel partagé** : les **5 sources** (skill repo, skill active, Loki persona+déployé, Nathalie persona+déployé) énoncent le **MÊME** mapping contexte→charte (**dev logiciel → Studio clair** ; **travaux NaonEdge → NaonEdge** ; **conseil/pro → Cinabre** = à confirmer). `grep -rl 'Studio clair' <les 6 fichiers>` ≥ les sources concernées ; aucun mapping divergent.
- [ ] **Nathalie tools** : `grep 'tools:' ~/.claude/agents/nathalie.md` contient **`WebSearch`** et **`WebFetch`**.
- [ ] **Nathalie web/studio propagé** : `grep -c 'Web & discipline de sourcing' ~/.claude/agents/nathalie.md` = 1.
- [ ] **guardrails** : `grep -L 'guardrails' ~/.claude/agents/*.md` = **∅** (les 8 l'ont) ; chaque valeur = celle de la persona homonyme.
- [ ] **Odin CTO** : `grep -c 'CTO' ~/.claude/agents/odin.md` ≥ 1 (§ Posture présent).
- [ ] **Aragorn** : `grep -c "N'absorbe pas un rôle non casté" ~/.claude/agents/aragorn.md` = 1 **ET** `grep -c 'Merge ⇒ versionnement' ~/.claude/agents/aragorn.md` = 1.
- [ ] **Legolas RQV** : `grep -c 'RQV\|Revue Qualité de Version' ~/.claude/agents/legolas.md library/personas/legolas.md` ≥ 1 chacun ; le gate auto dev→stage est **toujours** décrit (non supprimé).
- [ ] **Canal** : `grep -rni 'slack' ~/.claude/agents/ library/personas/aragorn.md library/personas/odin.md` = **0** ; `grep -rl 'iakaHub' ~/.claude/agents/aragorn.md ~/.claude/agents/odin.md` = 2 ; « repli terminal » mentionné.
- [ ] **init roster** : `grep -c 'sept contrats' library/skills/iakaframe-init/SKILL.md` = 0 ; `grep -c 'agent-[0-5]-\|agent-orchestrateur' library/skills/iakaframe-init/SKILL.md` = 0 ; les 8 noms (odin…nathalie) ou la délégation CLI y figurent.
- [ ] **Resync symétrique** : pour chaque agent, toute clause du canon corrigé est **présente** au déployé et réciproquement (revue croisée corps-à-corps, hors frontmatter).
- [ ] **Frames gelées** : `git status` ne montre **rien** sous `frames/releases/`.
- [ ] **CLI vert** : `cd cli && npm test` sans régression (aucun code CLI touché en Lot 1, mais garde-fou).

---

## 7. Faits vérifiés (traçabilité — chemin:ligne / URL)

- Source de vérité personas = `library/personas/` : `cli/src/lib/library.js:15`, `reconcilier-kit-source-frame.md:50`.
- Kit live sans `.claude/agents/` (design) : glob `kits/iakaframe-claude/.claude/**` (commands + settings seuls) ; `reconcilier-kit-source-frame.md:103`.
- Frames portent les 8 agents déparamétrés : `frames/releases/StefFrame2/kits/iakaframe-claude/.claude/agents/odin.md:3,15,17` (`<IAKAFRAME_HOME>`, `<CHAT>`).
- `affectPersona` lit `<root>/agents/` (inexistant) + copie brute : `cli/src/lib/agents.js:83,90` ; dette notée `reconcilier-kit-source-frame.md:55-57,237`.
- Résolution chapeau : `cli/src/lib/root.js:8-10` (`IAKAFRAME_ROOT` > `C:\work` win > `~/work`).
- Canal canon iakaHub/Discord + repli : `methode-de-travail.md:553-617` (repli `:605-606`).
- RQV : `specs/equipe-agents.md:123-126` (+ `revue-qualite-version.md`).
- Charte : **défaut unique contradictoire selon la source** (les 3 sont fausses vs canon contextuel) — skill **repo** « NaonEdge » `library/skills/iakaframe-naonedge/SKILL.md:4,19,25` ; skill **active** « Cinabre » `~/.claude/skills/iakaframe-naonedge/SKILL.md:18-19,26` ; Nathalie « Cinabre » `library/personas/nathalie.md:38`. **Canon contextuel arbitré (2026-07-19)** les supersède (dev logiciel → Studio clair ; NaonEdge → NaonEdge ; Cinabre = conseil/pro à confirmer).
- Loki déployé plus riche : `~/.claude/agents/loki.md:16-30,47-68` (absent de `library/personas/loki.md`).
- guardrails absent des déployés : `grep -l guardrails ~/.claude/agents/*.md` = ∅ ; présent aux personas `:8`.
- init legacy : `library/skills/iakaframe-init/SKILL.md:4,25-31` ; `assets/` inexistant.
- Frontmatter Claude Code (name/description requis ; champs hors-liste tolérés) : docs officielles (URL ci-dessous).

---

## 8. Hors périmètre — traité ailleurs / plus tard

**Constats réfutés (NE PAS « corriger »)** : renommage AppFlowy→humandoc (voulu) ; gate auto
Legolas dev→stage (by-design) ; recouvrement Legolas↔Loki (inexistant) ; Helm dormant (design sain).

## 9. Suite (lots lourds séparés — listés, non cadrés ici)

1. **Générateur persona→contrat** : transform frontmatter (persona → `name/description/tools`) +
   déparamétrage + wiring au déploiement ; correction de `cli/src/lib/agents.js` (lecture
   `library/personas/` au lieu de `<root>/agents/`, rendu au lieu de copie brute). **C'est le fix
   durable** qui empêche la dérive de revenir — **lot suivant recommandé**.
2. **Enforcement réel des `guardrails`** par hook (identity / perimeter / delegation) — le champ
   posé en Lot 1 est inerte jusque-là.
3. Reformulation méthode « décide à chaque gate » vs « auto ».
4. Cap de volume de la restitution verbatim.
5. Collision de pastille **🔴 Gimli / Legolas**.
6. Régénération des frames `StefFrame1/2` (gelées) — se fera au prochain build de frame.

---

## 10. Jalon (gate humain)

```
      _   _    _     ___  _   _
     | | / \  | |   / _ \| \ | |
  _  | |/ _ \ | |  | | | |  \| |
 | |_| / ___ \| |__| |_| | |\  |
  \___/_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `lot1-rafraichissement-contrats-agents.md` : topologie 4 couches + source de vérité = `library/personas/` ; 4 axes (portabilité, faits, resync/guardrails, roster init) ; **ordre impératif** (rapatrier Loki AVANT propagation) ; **canon contextuel de charte** intégré ; critères testables ; **2 arbitrages + 1 point ouvert** (3e contexte charte) | 🟢 Le décideur (Stéphane) → tranche §0 → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Cause racine : `cli/src/lib/agents.js:83` (lit `<root>/agents/`), `cli/src/lib/kit.js:96` (`copyKit`), `install.mjs:348`.
- Avance Loki à préserver : `~/.claude/agents/loki.md:16-30`, `:47-68`.
- Retards à réinjecter : `library/personas/odin.md:29-54`, `library/personas/aragorn.md:28-32`, `:78-83`, `library/personas/nathalie.md:41-51`.
- Faits : `methode-de-travail.md:553-617`, `specs/equipe-agents.md:123-126`, `library/skills/iakaframe-naonedge/SKILL.md:19,25`, `library/skills/iakaframe-init/SKILL.md:4,25-31`.
- Portabilité : `library/personas/odin.md:20-21,59-60,82` ; `~/.claude/agents/odin.md:15-16,26-27,46`.

**Points à trancher au gate (délégués au décideur)** :
1. **Charte** : canon contextuel **arbitré** (dev logiciel → **Studio clair** ; travaux NaonEdge → **NaonEdge**). **Reste ouvert (non bloquant)** : confirmer ou non un **3e contexte** « conseil/pro → **Cinabre** » — ne pas l'inventer.
2. **Skill `iakaframe-init`** : **déléguer à la voie CLI** (recommandé) **ou** scaffold autonome réécrit sur 8 personas.
3. **Générateur persona→contrat** (§9.1) : le lancer **tout de suite** après Lot 1 **ou** le planifier — sans lui la dérive **reviendra**.

Sources externes : [Claude Code — Create custom subagents](https://code.claude.com/docs/en/sub-agents)

---

## Statut

**EN ATTENTE DE VALIDATION** — charte **arbitrée** (canon contextuel §2c) ; restent **2 arbitrages**
(skill `init` ; générateur persona→contrat) **+ 1 point ouvert non bloquant** (3e contexte charte
« conseil/pro → Cinabre »). À « JALON VALIDÉ » (+ arbitrages tranchés) → dispatch **Gimli** pour
appliquer §4 en passant tous les critères §6, sans toucher `frames/releases/**` ni la couche kit-live.
