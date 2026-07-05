# Instruction — Montée en expertise du rôle « Nathalie » (rédaction de doc utilisateur)

> Cadrée par 🧙 Gandalf (P1 — Cadrage). Cible d'exécution : ⚒️ Gimli. Gate : **humain** (Stéphane).
> Statut : **cadré, prêt à exécuter**. Rationale complet : `specs/instructions/nathalie-expertise-analyse.md`.
> Arbitrages verrouillés par Stéphane le **2026-07-05** (intégrés tels quels ci-dessous).

---

## 1. Objectif

Faire passer le rôle documentaire « Nathalie » d'une rédaction « claire mais plate » à une
**rédaction structurée et sourcée**, en implémentant **exactement quatre lots** : **M1**
(structuration inspirée de Diátaxis, vocabulaire maison), **M2** (web + discipline de sourcing),
**M3** (glossaire + règle « rôle jamais nom de code »), **S3** (protocole de passation fond → forme
vers le studio design, charte **Cinabre**). Tout le reste est **explicitement différé** (§7).

Aucune régression sur le **canal d'identité/badges** ni sur le partage des rôles (fond = Nathalie,
forme = studio design). MVP d'abord, réutilisation de l'existant, français.

---

## 2. Périmètre

**Dans le périmètre (in) :**
- Modifier le contrat d'agent `agents/nathalie.md` (tools web + discipline de sourcing).
- Refondre la skill `~/.claude/skills/iakaframe-nathalie/SKILL.md` (structuration maison, sourcing,
  terminologie, passation Loki/Cinabre).
- Créer un **glossaire canonique** minimal des rôles dans le dépôt.

**Hors périmètre (out) :**
- Aucun rapatriement de charte : la forme reste dans `~/work/iakacharte/design-cinabre/` (arbitrage 1).
- Pas de linter de prose (Vale), pas de versionnement fin des docs, pas d'accessibilité poussée, pas
  de tests automatiques de doc — **différés** et rebranchés sur le chantier parent (§7).
- Aucune modification du code produit, des autres agents, ni du CLI `iakaframe-appflowy-doc`.
- Nathalie ne change pas de nom, de pastille (🟠), ni de statut transverse.

---

## 3. Lexique maison de structuration (M1) — à inscrire dans la skill

Inspiré de Diátaxis (quatre besoins distincts, jamais mélangés), mais **étiquettes maison
iakaframe** — on n'emploie **pas** les mots « tutorial / how-to / reference / explanation ».

| Section maison | Besoin servi | Registre | Équivalent Diátaxis (pour mémoire, non affiché) |
|---|---|---|---|
| **Se lancer** | Réussir une **première fois**, main dans la main | apprentissage guidé, débutant | tutorial |
| **Faire** | Résoudre une **tâche précise**, utilisateur déjà à l'aise | orienté travail, pas à pas | how-to |
| **Consulter** | Trouver un **fait exact** (options, paramètres, limites) | référence sèche, sans interprétation | reference |
| **Comprendre** | Saisir le **pourquoi**, le contexte, les choix | explication, mise en perspective | explanation |

**Règle d'or (à écrire noir sur blanc dans la skill)** : *un besoin = un type de section ; on ne
mélange jamais le « pourquoi » (**Comprendre**) et le « comment » (**Se lancer** / **Faire**)*. Un
document peut assembler plusieurs de ces sections, mais chaque section reste **d'un seul type**.

**Arbre de décision** à inclure : « L'utilisateur découvre ? → *Se lancer*. Il sait déjà et veut
accomplir X ? → *Faire*. Il cherche une information précise ? → *Consulter*. Il veut comprendre un
choix/mécanisme ? → *Comprendre*. »

---

## 4. Changements précis, fichier par fichier

### 4.a — `agents/nathalie.md` (contrat)

**(1) Tools — élargissement de contrat (M2).** Remplacer la ligne du front-matter
`agents/nathalie.md:4` :

- Avant : `tools: Read, Write, Edit, Grep, Glob, Bash`
- Après : `tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch, WebFetch`

**(2) Nouvelle section « Web & discipline de sourcing ».** L'insérer **après le bloc `## Périmètre`**
(après `agents/nathalie.md:31`), avant `## Entrées → Sorties`. Contenu obligatoire :
- Mention explicite : **« Élargissement de contrat décidé le 2026-07-05 »**.
- Nathalie dispose désormais de `WebSearch` / `WebFetch` pour **vérifier l'état de l'art** et les
  références externes avant publication.
- **Règle de sourcing** : *toute affirmation factuelle sur le code ou les skills se cite en
  `chemin:ligne` ; toute affirmation sur l'état de l'art se source par une URL.* On ne publie pas un
  fait non tracé.
- Garde-fou de périmètre : elle **vérifie et cite**, elle ne **cadre pas** (le cadrage reste à
  Gandalf) — le web sert la fidélité de la doc, pas une extension vers la conception.

**(3) Précision passation fond → forme (S3).** À la ligne « l'habillage visuel fin (→ Loki, qui met
en forme si besoin) » (`agents/nathalie.md:31`), préciser : la passation se fait **par brief
structuré**, la forme est produite par le **studio design** selon la charte cible (par défaut
**Cinabre**, `~/work/iakacharte/design-cinabre/`). Ne pas rapatrier la charte.

**Ne pas toucher** aux sections `## Identité` (`agents/nathalie.md:44-54`) ni `## Pourquoi un
agent ?` : le canal des badges reste **intact**.

### 4.b — `~/.claude/skills/iakaframe-nathalie/SKILL.md` (skill-rôle)

**(1) Remplacer** les sections `## Procédure` et `## Format de sortie` (`SKILL.md:17-47`) par :
- une section **« Structuration (les 4 besoins) »** décrivant le **lexique maison** du §3 (les quatre
  types, la règle d'or « un besoin = un type », l'arbre de décision) ;
- **quatre gabarits Markdown courts**, un par type (*Se lancer* = objectif → étapes numérotées →
  résultat ; *Faire* = tâche → pas-à-pas → vérification ; *Consulter* = tableau/liste de faits, sans
  narration ; *Comprendre* = contexte → pourquoi → implications). Réutiliser l'esprit du gabarit
  actuel (`SKILL.md:29-47`) pour le type *Faire* (c'en est le cas particulier).

**(2) Conserver et compléter** la section `## Action récurrente — mémoire humaine AppFlowy`
(`SKILL.md:49-64`) **inchangée** (hors périmètre).

**(3) Ajouter** une section **« Sourcing & vérification »** (M2), miroir de la règle du contrat :
citer le code/les skills en `chemin:ligne`, sourcer l'état de l'art par URL, vérifier via le web
avant publication.

**(4) Ajouter** une section **« Terminologie »** (M3) :
- règle dure : *dans toute doc destinée à l'extérieur, on désigne les agents par leur **RÔLE**,
  jamais par leur **nom de code*** (ex. « le studio design », pas le nom de code) ;
- pointeur vers le **glossaire canonique** (voir §4.c) comme source de vérité des libellés.

**(5) Ajouter** une section **« Passation fond → forme (studio design / Cinabre) »** (S3) :
- Nathalie tient le **fond** ; la **forme** HTML on-brand est produite par le studio design ;
- passation par **brief structuré** : plan, table des matières, **ancres**, contenu **sourcé**,
  charte cible ;
- **charte par défaut = Cinabre**, à `~/work/iakacharte/design-cinabre/` — feuille `cinabre.css`
  et gabarit `template-doc.html` ; **ne rien rapatrier**, on pointe l'emplacement.

**(6) Garde-fous** (`SKILL.md:66-73`) : conserver ; ajouter le rappel « rôle jamais nom de code » et
le renvoi au glossaire. Ne pas retirer les garde-fous existants (français, secrets AppFlowy par env).

### 4.c — Glossaire canonique (M3) — fichier à créer

Créer `specs/glossaire-iakaframe.md` (dans le dépôt iakaframe), **minimal** :
- une entrée par rôle (les 8 du roster, cf. `methode-de-travail.md:104-113`) avec le **libellé de
  rôle** à employer en doc externe et la mention du **nom de code réservé à l'usage interne** ;
- une note en tête : « En doc destinée à l'extérieur, employer le libellé de rôle ; le nom de code
  n'apparaît que dans les artefacts internes (agents/, skills/). »
- C'est la **source de vérité** citée par la skill. Pas d'outillage (linter) à ce stade — différé.

---

## 5. Critères d'acceptation (vérifiables)

1. `agents/nathalie.md:4` (front-matter `tools`) contient **`WebSearch`** et **`WebFetch`**.
2. `agents/nathalie.md` contient une section datée **« 2026-07-05 »** énonçant l'élargissement web +
   la discipline de sourcing (`chemin:ligne` pour le code/skills, **URL** pour l'état de l'art).
3. `SKILL.md` **ne contient plus** de gabarit unique : les sections `## Procédure` / `## Format de
   sortie` sont remplacées par la **structuration à 4 types** (lexique maison **Se lancer / Faire /
   Consulter / Comprendre**), la **règle « un besoin = un type »** et l'**arbre de décision**.
4. `SKILL.md` contient les sections **« Sourcing & vérification »**, **« Terminologie »** (règle
   « rôle jamais nom de code » + renvoi au glossaire) et **« Passation fond → forme »** pointant
   `~/work/iakacharte/design-cinabre/` (avec `cinabre.css` et `template-doc.html`).
5. `specs/glossaire-iakaframe.md` existe, liste les **8 rôles** avec libellé canonique + note « nom
   de code = interne uniquement ».
6. **Aucune régression d'identité** : les sections `## Identité` du contrat et de la méthode sont
   inchangées ; les étiquettes littérales Diátaxis (« tutorial/how-to/reference/explanation »)
   **n'apparaissent pas** dans la doc destinée à l'utilisateur (vocabulaire maison seulement).
7. **Recette manuelle** : rédiger un **mini-guide de démonstration** (jetable) qui applique au moins
   deux des quatre types, cite **au moins une source `chemin:ligne`** et **au moins une URL**, et
   désigne un agent **par son rôle** (jamais son nom de code) → relecture PASS par Stéphane.
8. La charte n'est **pas** rapatriée dans le dépôt iakaframe (aucun fichier `design-*/` ajouté ici).

---

## 6. Dépendances

- **Charte Cinabre** : `~/work/iakacharte/design-cinabre/` — **présente et vérifiée le 2026-07-05**
  (`cinabre.css`, `template-doc.html`, `cinabre-charte.md` ; Cinabre = drop-in NaonEdge, accent
  rouge cinabre, registre « rapport premium »). La doc de Nathalie **pointe** cet emplacement ; le
  studio design applique la charte au moment du rendu HTML.
- **Chantier parent « versionner méthodes/agents/skills »** : porte les lots différés (§7). Cette
  instruction ne le préempte pas ; elle s'y **rebranche** pour tout ce qui touche versionnement,
  linting, tests et accessibilité.

---

## 7. Hors périmètre / différé (à ne pas perdre — rebranché sur le chantier versionnement)

Ces lots, présents dans la note d'analyse, sont **volontairement exclus du MVP** et **transférés au
chantier parent « versionner méthodes/agents/skills »** :

- **S2 — Gate qualité de prose (Vale).** Linter self-hosted + style FR maison encodant « rôle jamais
  nom de code » et le glossaire. → à cadrer avec le versionnement (intégration CI).
- **S1 — Versionnement fin des docs.** Front-matter (`version_doc`, `version_méthode_décrite`) +
  changelog par doc. → à aligner sur le schéma retenu pour méthode/agents/skills.
- **C1 — Accessibilité poussée.** Au-delà du minimum (hiérarchie de titres) : alternatives
  textuelles systématiques, contraste (relève de la charte / studio design), langage clair mesuré.
- **S4 — Tests automatiques de doc.** Vérification de liens, fraîcheur des captures, conformité
  guide↔comportement réel outillée.
- **C2 — Fidélité de la mémoire humaine AppFlowy.** Rendu Markdown riche + liens cliquables + câblage
  automatique version/pause/reprise (déjà tracé dans `specs/instructions/appflowy-doc-skill.md:73-79`).
- **C3 — Discipline de captures.** Convention de nommage/stockage.

---

## 8. Références

- Rationale : `specs/instructions/nathalie-expertise-analyse.md`.
- Contrat cible : `agents/nathalie.md` (tools `:4`, périmètre `:19-31`, identité `:44-54`).
- Skill cible : `~/.claude/skills/iakaframe-nathalie/SKILL.md` (procédure/format `:17-47`, AppFlowy
  `:49-64`, garde-fous `:66-73`).
- Méthode : `methode-de-travail.md` (roster `:104-113`, identité `:194-222`).
- Charte : `~/work/iakacharte/design-cinabre/` (`cinabre.css`, `template-doc.html`, `cinabre-charte.md`).
- État de l'art (M1, pour mémoire) : Diátaxis <https://diataxis.fr/start-here/>.
