# Générateur de vitrine `.md → .html` — régénérer la zone `CODE_BLOCKS` de `methode-de-travail.html`

> **Statut** : cadrage remis au décideur — non lancé.
> **Phase** : P1 (cadrage). Auteur : 🔵 Gandalf. Date : 2026-07-29.
> **Backlog source** : item « Écrire le générateur de vitrine HTML en Node (`.md → .html`) »
> (reformulé le 2026-07-23, moitié « réparer » caduque).

---

## 0. Outillage du cadreur — déclaration

**`ripgrep` est absent de ma session** (`Grep`/`Glob` échouent en `ENOENT: rg`). Conséquences
assumées, à la manière du lot `retrait-scripts-powershell.md` :

- Toutes les mesures de zone viennent de `Read` **par chemin exact** sur l'arbre de travail, pas
  d'un `grep` exhaustif. Les bornes de la zone `CODE_BLOCKS` (lignes **825→2245**) sont lues
  directement, donc sûres. En revanche, **l'affirmation « aucune autre vitrine ne porte de
  marqueurs `CODE_BLOCKS` »** repose sur la lecture ciblée des quatre HTML candidats (têtes +
  queues + zones de contenu), **pas** sur un grep du dépôt entier : un `rg -l CODE_BLOCKS_START`
  en P2 doit la confirmer (critère **A9**). C'est un `grep` trivial, mais je ne l'ai pas exécuté.
- Je n'ai **pas** exécuté la suite de tests ni les générateurs. Les patrons (`generateAll`,
  `scan`/`readEntry`/`pathFor`, `iakaframeSkillIds`) sont lus dans le source, pas rejoués.

---

## 1. Problème

La vitrine `methode-de-travail.html` porte, entre `<!--CODE_BLOCKS_START-->` (l. 825) et
`<!--CODE_BLOCKS_END-->` (l. 2245), une **zone générée** d'environ **1420 lignes** : des copies
figées, HTML-échappées, du **code des agents et des skills**. **Son générateur a disparu** — l'ancien
`iakaframe-build-methode-code.ps1`, retiré avec tous les `.ps1` du canon par
`retrait-scripts-powershell.md`. Il ne reste **aucun producteur, ni mort ni vivant**.

Conséquences mesurées, la zone est **doublement périmée** :

1. **Contenu figé et dérivé du canon vivant.** La zone contient encore des skills à leur état
   ancien — ex. l. ~2210 : `pwsh C:\iakaframe\iakaframe-update.ps1 …`, une prescription
   **doublement morte** (chemin Windows + `pwsh` absent), et l. 1930 « NaonEdge est la charte par
   défaut » (faux depuis l'arbitrage charte contextuelle).
2. **Pointe des sources qui n'existent plus.** Chaque carte affiche `data-path="agents/<id>.md"`
   et `data-path="skills/<id>/SKILL.md"` — or `agents/` et `skills/` **à la racine ont été retirés**.
   Les sources vivantes sont désormais `library/personas/*.md` et `library/skills/*/SKILL.md`.

Sa dérive de canal (« Slack ») a dû être **purgée en band-aid** par édition directe, faute de
générateur ; ce band-aid sera écrasé à la première vraie régénération. **La zone est orpheline.**

**Le besoin** : rétablir un générateur **en Node** qui reconstruit cette zone **depuis les sources
canon vivantes**, **non destructif** (ne touche qu'entre les marqueurs) et **idempotent** (re-run
sans changement de source = diff vide), gardé par un test qui **mord** si la zone diverge des
sources non régénérées — sur le modèle exact des goldens `gen-agents-golden.mjs` /
`gen-skills-golden.mjs`.

---

## 2. Faits mesurés

### 2.1 La zone `CODE_BLOCKS` de `methode-de-travail.html` — structure exacte

Bornes : `methode-de-travail.html:825` (`<!--CODE_BLOCKS_START-->`) →
`methode-de-travail.html:2245` (`<!--CODE_BLOCKS_END-->`). Le HTML **hors** de ces bornes est
écrit à la main (hero, sections, onglets, SVG du cycle) — **il ne doit jamais être touché**.

Composition interne, mesurée :

- **Deux groupes**, chacun ouvert par `<div class="code-group">…</div>` :
  - `agents/ &mdash; definitions de subagents` (l. 826)
  - `skills/ &mdash; savoir-faire (SKILL.md)` (l. 1299)
- **Une carte par fichier** (`<div class="codecard">`), composée de :
  - une **tête** : `<div class="codecard-head"><span><span class="fname">…</span><span class="fpath">…</span></span><button class="dlbtn" onclick="iakaDL('<id-pre>','<nom-fichier>')">&#x2B07; download</button></div>` ;
  - un **`<pre id="<id-pre>" data-path="<chemin>">` contenant le fichier `.md` HTML-échappé**,
    fermé par `</pre></div>`.
- **Échappement** constaté dans les `<pre>` : `<`→`&lt;`, `>`→`&gt;`, `&`→`&amp;`. Les glyphes
  `&#x2B07;` (flèche download) et `&mdash;` sont des **littéraux de gabarit**, pas du contenu.

Contenu **actuel** (périmé) : groupe agents = `_TEMPLATE.md` + les 8 anciens `agents/*.md`
(aragorn, gandalf, gimli, helm, legolas, loki, nathalie, odin) ; groupe skills = un **sous-ensemble**
d'anciennes `skills/iakaframe-*` (aragorn, …, log-conversation, naonedge, update…).

**Point sémantique décisif (fonde l'arbitrage § 4).** Les cartes du groupe *agents* affichent
aujourd'hui un **frontmatter de contrat** — `name: / description: / tools: Read, Grep, Glob`
(ex. l. 827-830). Ce n'est **pas** le frontmatter d'une persona : `library/personas/gandalf.md:1-12`
porte `id / name / description / mission / roleKey / royaume / pastille / skills / guardrails /
vignette`. **Le contrat déployé (`.claude/agents/<id>.md`) est *généré* depuis la persona + le
binding** par `renderAgentContract` (`cli/src/lib/generate-agents.js`, référent du golden). Donc :
choisir « raw persona » comme source du bloc *agents* **changerait ce que la vitrine montre**
(persona ≠ contrat). D'où l'arbitrage unique du § 4.

### 2.2 L'ancien générateur `iakaframe-build-methode-code.ps1`

Retiré par `retrait-scripts-powershell.md` (il faisait partie des 11 `.ps1` racine ; cité nulle part
— 0 auto-référence). Son nom et la structure de la zone qu'il alimentait établissent son contrat :
**il lisait `agents/*.md` et `skills/iakaframe-*/SKILL.md` à la racine, et injectait leur contenu
HTML-échappé, carte par carte, entre les marqueurs `CODE_BLOCKS`**. Le **re-ciblage** demandé :
`agents/` → source à trancher (§ 4), `skills/` → `library/skills/*/SKILL.md`.

### 2.3 Les patrons à réutiliser (goldens)

- `cli/scripts/gen-agents-golden.mjs` : `import { generateAll } from '../src/lib/generate-agents.js'`
  ; `REPO = path.join(HERE, '..', '..')` (= racine du dépôt) ; `generateAll({ root: REPO })` →
  `Map<id, contrat>` ; itère `[...contracts.keys()].sort()`. **C'est le rendu du contrat déployé.**
- `cli/scripts/gen-skills-golden.mjs` : `scan('skills', root)`, `readEntry`, `pathFor` (de
  `../src/lib/library.js`) ; `iakaframeSkillIds(root)` filtre le domaine iakaframe (préfixe
  `iakaframe-` ou `iakastart`) ; lit le `SKILL.md` brut via `fs.readFileSync(pathFor('skills', id,
  root))`.
- **Discipline de garde** : chacun écrit un artefact déterministe, et un test `parite-*.test.js`
  **régénère en mémoire** puis compare à l'artefact commité — rouge à toute dérive non régénérée.
  Le nouveau générateur **doit** copier ce couple (script + test).

### 2.4 Les autres vitrines — périmètre tranché

| Vitrine | Marqueurs `CODE_BLOCKS` ? | Nature | Verdict |
|---|---|---|---|
| `methode-de-travail.html` | **OUI** (l. 825/2245) | page main + zone injectée | **CIBLE unique** |
| `iakaframe-methode.html` | **NON** (lu : 462+ l., aucun marqueur) | présentation à onglets, écrite à la main | **Hors périmètre** |
| `iakaframe-chapeau.html` | **NON** (lu : 400+ l., charte Cinabre) | présentation statique | **Hors périmètre** |
| `doc/index.html` | **NON** (181 l.) | **page entière générée** par `.portefeuille/docgen.mjs` (pied de page l. 179) — générateur **absent du dépôt**, de niveau *portefeuille* | **Hors périmètre** (autre générateur, autre concern) |

`iakaframe-methode.html` et `doc/index.html` **contiennent aussi de la prose `.ps1` périmée**, mais
c'est une **dette de doc distincte** (pas une zone à marqueurs), hors de ce lot. `doc/index.html`
n'est pas une injection de zone : c'est une **génération wholesale** par un outil de portefeuille
absent — un tout autre chantier, à ne pas coupler ici.

---

## 3. Décision retenue

Écrire **un** générateur Node, **local au dépôt iakaframe**, qui **reconstruit intégralement la zone
entre les marqueurs `CODE_BLOCKS` de `methode-de-travail.html`** depuis les sources canon vivantes,
et un **test de garde** qui mord à toute dérive. Périmètre **MVP = `methode-de-travail.html` seul**.

**Contrat du générateur :**

1. **Sources** : bloc *skills* = `library/skills/*/SKILL.md` ; bloc *agents* = **selon l'arbitrage
   § 4** (recommandation : le contrat rendu par `generateAll`).
2. **Où il vit** : `cli/scripts/gen-methode-vitrine.mjs`, **sibling** des `gen-*-golden.mjs`, qui
   atteint la racine par `REPO = path.join(HERE, '..', '..')` et écrit `<REPO>/methode-de-travail.html`.
3. **Branchement** : **lancé à la main** (`node cli/scripts/gen-methode-vitrine.mjs`) + **gardé par
   un test** — exactement comme les goldens. **PAS** câblé dans `iakaframe snapshot`/`update` :
   ces verbes sont **distribués et génériques** (ils tournent dans *tout* projet, où
   `methode-de-travail.html` n'existe pas). Un verbe `iakaframe build-vitrines` reste une
   **itération** possible, hors MVP (§ 6).
4. **Non destructif** : lit le fichier, découpe sur les deux marqueurs, **remplace uniquement le
   texte entre eux**, recolle le préambule et le postambule **byte-pour-byte**, marqueurs compris.
5. **Idempotent** : itération triée par `id`, rendu déterministe ⇒ re-run sans changement de source
   = **diff vide**. La garde (§ 5) le prouve mécaniquement.

**Rendu d'une carte** (identique au gabarit mesuré § 2.1), pour chaque `id` :
- `fname` = nom court, `fpath` = **chemin canon vivant** (`library/personas/<id>.md` ou
  `library/skills/<id>/SKILL.md`), `id` du `<pre>` = `code-agent-<id>` / `code-skill-<id>`,
  nom de download = `<id>.md` / `<id>-SKILL.md`.
- contenu du `<pre>` = fichier source **HTML-échappé** dans l'ordre `&`→`&amp;`, puis `<`→`&lt;`,
  puis `>`→`&gt;` (réutiliser un util d'échappement s'il en existe un dans `cli/src/lib/` ; sinon
  helper local de 3 lignes).

**Décisions de périmètre closes (non-arbitrages) :**
- **Skills énumérés** : **tous** les `library/skills/*/SKILL.md`, **triés par `id`** (vitrine
  honnête et déterministe ; l'ancienne zone n'en montrait qu'un sous-ensemble figé). *Alternative
  possible* : filtrer au domaine via `iakaframeSkillIds` — non retenu par défaut, mais c'est un
  simple interrupteur.
- **Personas énumérés** : l'ensemble produit par la source du § 4 (les 9 personas canon, Fëanor
  compris). Plus de `_TEMPLATE.md` (il ne vit pas dans `library/personas/`).

---

## 4. Choix structurant — à arbitrer par le décideur (un seul)

**Que montre le bloc *agents* de la vitrine ?**

- **Option A — source brute `library/personas/*.md`.** Littérale au backlog. La plus simple, zéro
  couplage au générateur de contrats. **Mais** elle **change ce que la vitrine affiche** : le bloc
  montrerait le frontmatter *persona* (`roleKey`, `skills`…), pas le contrat déployé
  (`name`/`description`/`tools`) que la zone historique montrait. La vitrine cesserait de dire
  « le code des agents tel que déployé ».
- **Option B — contrat rendu `generateAll({ root })` (recommandée).** Le bloc affiche l'**exact
  `.claude/agents/<id>.md` déployé**, produit par le **même référent que le golden de parité**
  (`generate-agents.js`). **Avantages** : conserve le sens d'origine de la vitrine (artefacts
  déployables), **source unique** partagée avec le golden et le déploiement, et le générateur est
  déjà gardé par `parite-agents`. **Coût** : couplage au générateur + au binding — *souhaitable*,
  la vitrine devant suivre le déploiement. Réutilise strictement le patron `gen-agents-golden.mjs`.

**Recommandation : Option B.** Elle sert la finalité même du lot — « depuis les sources canon
vivantes, pour ne plus jamais dériver » — en liant la vitrine à l'unique moteur de contrat déjà
sous garde. Le bloc *skills* reste en source brute `SKILL.md` dans les deux options.

> Je **propose**, je ne tranche pas : le choix A/B engage ce que la page *signifie*. Le reste de
> l'instruction est écrit pour B ; bascule vers A = remplacer `generateAll` par une énumération
> triée de `library/personas/*.md` + échappement, sans autre changement.

---

## 5. Garde anti-dérive (obligatoire) — le test qui mord

`cli/test/vitrine-methode.test.js`, sur le modèle de `parite-agents`/`parite-skills` :

1. **Régénère la zone en mémoire** (import de la fonction pure du script — le `main()` d'écriture
   n'est exécuté qu'en lancement direct, cf. garde `if (import.meta.url === …)` de
   `gen-skills-golden.mjs`).
2. **Lit `methode-de-travail.html` sur disque**, extrait le texte entre `CODE_BLOCKS_START/END`.
3. **Assertion d'égalité** zone-régénérée == zone-sur-disque. **Rouge** si une persona / un skill a
   changé sans que la vitrine ait été régénérée, **ou** si un skill a été ajouté/retiré du canon.

Cette garde prouve **à la fois** la non-dérive **et** l'idempotence (générer == ce qui est sur
disque). Elle ne nécessite **aucune fixture séparée** : la zone dans le HTML *est* le golden.

---

## 6. Périmètre

- **Inclus** :
  - `cli/scripts/gen-methode-vitrine.mjs` — générateur + fonction pure exportée + `main()` d'écriture.
  - `cli/test/vitrine-methode.test.js` — garde anti-dérive.
  - **Une première régénération** de la zone `CODE_BLOCKS` de `methode-de-travail.html` (le
    band-aid Slack et tout le contenu figé sont **écrasés** par le contenu canon frais).
- **Exclu** :
  - `iakaframe-methode.html`, `iakaframe-chapeau.html`, `doc/index.html` (§ 2.4) — pas de marqueurs,
    autres concerns ; leur prose `.ps1` périmée est une dette de doc distincte.
  - Toute réécriture du HTML **hors** des marqueurs de `methode-de-travail.html`.
  - Un verbe CLI `iakaframe build-vitrines` ou un câblage dans `snapshot`/`update` — **itération**,
    pas MVP (verbes distribués ⇒ mauvais lieu pour un artefact propre au dépôt iakaframe).
  - Toute dépendance externe et tout recours à `pwsh`.

---

## 7. Étapes d'implémentation

1. **Lire l'instruction**, puis relire la zone `methode-de-travail.html:825-2245` pour figer le
   gabarit exact d'une carte (attributs, ordre, littéraux `&#x2B07;`/`&mdash;`).
2. Écrire `cli/scripts/gen-methode-vitrine.mjs` :
   - helper `esc(text)` (`&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`), ou réutiliser un util existant ;
   - `renderCard({ id, fname, fpath, preId, dlName, body })` → HTML de carte ;
   - `buildZone({ root })` (fonction pure) : bloc agents (Option B : `generateAll({root})`, ids
     triés) + bloc skills (`library/skills/*/SKILL.md`, ids triés) ⇒ chaîne de la zone ;
   - `spliceZone(html, zone)` : découpe sur les deux marqueurs, remplace **entre** eux, recolle
     préambule + marqueurs + postambule inchangés ;
   - `main()` (exécuté **uniquement** en lancement direct) : lit/écrit `<REPO>/methode-de-travail.html`.
3. Écrire `cli/test/vitrine-methode.test.js` (§ 5).
4. **Lancer** `node cli/scripts/gen-methode-vitrine.mjs` une fois → première régénération.
5. **Relire le diff** de `methode-de-travail.html` : hors marqueurs = **zéro** changement ; dans les
   marqueurs = zone reconstruite (gros diff **attendu** : passage stale → canon frais).
6. `node cli/scripts/gen-methode-vitrine.mjs` **une seconde fois** → **diff vide** (idempotence).
7. Jouer la suite CLI : la nouvelle garde passe, aucune régression.

---

## 8. Fichiers concernés

- `cli/scripts/gen-methode-vitrine.mjs` — **créé** : générateur (sibling des `gen-*-golden.mjs`).
- `cli/test/vitrine-methode.test.js` — **créé** : garde anti-dérive.
- `methode-de-travail.html` — **modifié uniquement entre `:825` et `:2245`** : zone régénérée
  (le reste byte-inchangé).
- *(lecture seule, non modifiés)* : `cli/src/lib/generate-agents.js` (`generateAll`), `library.js`
  (`scan`/`readEntry`/`pathFor`), `library/personas/*.md`, `library/skills/*/SKILL.md`,
  `bindings/iakaframe-claude-default.md` (via `generateAll`, Option B).

---

## 9. Risques

- **Fidélité d'échappement.** Un échappement incomplet (oublier l'ordre `&` d'abord) casse le rendu
  ou double-échappe. *Mitigation* : helper unitairement testé sur un cas contenant `< > &`.
- **Splice non byte-exact hors marqueurs.** Le plus gros risque : altérer une fin de ligne ou avaler
  un marqueur. *Mitigation* : découpe par index sur les chaînes-marqueurs littérales, conservation
  des marqueurs eux-mêmes ; critère **A2** vérifie zéro changement hors zone.
- **Gros diff à la première régénération.** La zone passe de stale à fraîche — **c'est l'objet du
  lot**, pas une régression. *Mitigation* : relecture humaine du diff intra-zone (A6).
- **Ballonnement de la page** (skills 8 → ~26). Attendu et honnête ; à signaler au décideur si la
  longueur gêne (interrupteur `iakaframeSkillIds` disponible, § 3).
- **Couplage au binding (Option B).** Si le format de contrat change, la vitrine change — *voulu*.
  Sous garde par la même chaîne que le golden.

---

## 10. Critères d'acceptation

- [ ] **A1 — Le générateur existe et tourne** : `node cli/scripts/gen-methode-vitrine.mjs` s'exécute
      sans erreur, zéro dépendance externe, aucun `pwsh`.
- [ ] **A2 — Non destructif** : après régénération, le HTML **hors** de `:825`-`:2245` est
      **byte-inchangé** (diff limité à l'intérieur des marqueurs ; les lignes marqueurs elles-mêmes
      intactes).
- [ ] **A3 — Idempotent** : deux exécutions consécutives sans changement de source ⇒ **diff vide** à
      la seconde.
- [ ] **A4 — Sources canon vivantes** : le bloc skills provient de `library/skills/*/SKILL.md` ; le
      bloc agents de la source arbitrée au § 4 (B = `generateAll`). **Aucune** carte ne pointe encore
      `data-path="agents/…"` ni `data-path="skills/…"` (racine) ; les `fpath` affichés sont des
      chemins `library/…`.
- [ ] **A5 — Fraîcheur prouvée** : la zone régénérée ne contient plus la prescription
      `pwsh C:\iakaframe\iakaframe-update.ps1` ni « NaonEdge est la charte par défaut » (elle reflète
      le canon actuel des `SKILL.md`).
- [ ] **A6 — Diff intra-zone relu** *(gate humain)* : le décideur/Legolas relit le diff de la zone
      et confirme que le contenu frais est fidèle aux sources — l'égalité machine (A7) ne juge pas la
      *justesse* du canon, seulement sa reproduction.
- [ ] **A7 — La garde mord** : `cli/test/vitrine-methode.test.js` est **vert** après régénération, et
      **rouge** si l'on modifie un `library/personas/*.md` ou un `SKILL.md` **sans** régénérer
      (à démontrer une fois au gate, comme les gardes goldens naissent rouges).
- [ ] **A8 — Déterminisme** : cartes triées par `id`, ordre stable d'un run à l'autre.
- [ ] **A9 — Périmètre vitrines confirmé** : `rg -l 'CODE_BLOCKS_START' *.html doc/*.html` ne renvoie
      **que** `methode-de-travail.html` (confirme § 2.4, non exécuté au cadrage faute de `rg`).
- [ ] **A10 — Non-régression** : suite CLI verte ; aucun autre fichier au diff que les trois du § 8.

---

## 11. Délégable / geste humain

| Geste | Nature | Qui |
|---|---|---|
| Générateur + test de garde | Mécanique, patron connu | **Délégable** (Gimli) |
| Première régénération + A2/A3/A8/A9/A10 | Commandes | **Délégable** |
| **Arbitrage A/B (§ 4)** | Décision de sens | **Décideur** |
| **A6 — relecture du diff intra-zone** | Jugement de fidélité | **Humain** |

---

## 12. Estimation

### Équivalent jour-homme — spec fermée

| Poste | j-h |
|---|---|
| `gen-methode-vitrine.mjs` (réutilise `generateAll` + `scan`/`pathFor`) | 0,30 |
| Échappement + rendu de carte + splice non destructif | 0,20 |
| `vitrine-methode.test.js` (extraction zone + régénération + égalité) | 0,20 |
| Première régénération + relecture du diff intra-zone | 0,15 |
| Vérifs A1-A10 + commit | 0,10 |
| **Total** | **≈ 0,95 j-h** |

### Complexité / risque : **FAIBLE en complexité, FAIBLE-à-MOYEN en risque**

Aucun algorithme, aucune API : lecture de sources + composition de chaînes + splice. Le seul point
délicat est le **splice byte-exact** et la **fidélité d'échappement**, tous deux rattrapés par A2 et
la garde A7. Pas d'effet externe : rien n'est exécuté par un tiers.

### Inconnues susceptibles de faire glisser

| Inconnue | Effet | Probabilité |
|---|---|---|
| Arbitrage **A** retenu au lieu de B | remplace `generateAll` par énumération personas ; **−0,05 j-h** | Ouverte (décideur) |
| Existence/absence d'un util d'échappement réutilisable | ±0,05 j-h | Faible |
| Longueur de page jugée gênante (skills 8→~26) | ajout d'un filtre `iakaframeSkillIds` | Faible |
| A9 (`rg`) infirme le périmètre (une autre vitrine a des marqueurs) | +0,3 j-h par vitrine | Très faible |

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé, à confronter au temps réel à la
clôture du lot.

---

## 13. Sources

Mesures **internes**, par `Read` sur l'arbre de travail au **2026-07-29** (`ripgrep` absent, § 0).
Aucun fait externe mobilisé : le lot porte sur du code local et des formats internes, sans dépendance
tierce — **une vérification web n'aurait rien à ancrer ici**.

Fichiers lus : `methode-de-travail.html` (l. 1-60, 700-880, 1180-1330, 1900-2250 — bornes de zone et
gabarit de carte), `cli/scripts/gen-agents-golden.mjs`, `cli/scripts/gen-skills-golden.mjs`,
`library/personas/gandalf.md:1-14`, `BACKLOG.md` (item vitrine), `retrait-scripts-powershell.md`
(retrait du `.ps1`), `iakaframe-methode.html` (l. 1-15, 400-462), `iakaframe-chapeau.html` (l. 1-15,
400-403), `doc/index.html` (l. 1-15, 150-181 — générateur portefeuille absent).
