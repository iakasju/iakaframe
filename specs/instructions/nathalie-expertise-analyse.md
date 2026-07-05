# Note d'analyse — Faire monter le rôle « Nathalie » (rédaction de doc utilisateur) au niveau d'une expertise

> Cadrée par 🧙 Gandalf (P1 — Cadrage, lecture seule sur le code). Statut : **analyse, à valider**.
> Contexte : première étape d'un chantier plus large (doc HTML « chapeau » de la méthode iakaframe
> en charte Cinabre, sourcing profond dans les skills ; décision amont « versionner
> méthodes/agents/skills »). But de CETTE note : cartographier l'existant du rôle documentaire,
> diagnostiquer les écarts avec une vraie expertise, proposer des améliorations priorisées.
> Ne renomme rien, ne casse pas le canal des badges/identité.

---

## 1. Cartographie de l'existant

### 1.a — RÈGLES actuelles (ce qu'elle doit / ne doit pas faire, déclencheurs, place dans le cycle)

- **Mission double** (`agents/nathalie.md:13-17`) : (1) écrire une doc **orientée utilisateur final**
  — ce que le produit fait et comment s'en servir, jamais comment il est codé ; (2) tenir la
  **mémoire humaine** du projet dans AppFlowy (miroir humain de l'état des lieux, hors dépôt).
- **Périmètre FAIT** (`agents/nathalie.md:20-28`) : guides de prise en main, modes d'emploi,
  tutoriels pas-à-pas, FAQ, captures et exemples, à partir de l'app réelle et des features livrées ;
  publication AppFlowy aux moments de doc (changement de version, pause/reprise).
- **Périmètre NE FAIT PAS** (`agents/nathalie.md:29-31`) : la doc d'état/reprise dans le dépôt
  (→ `iakaframe-update`/état des lieux), le cadrage technique (→ Gandalf), l'habillage visuel fin
  (→ Loki, qui met en forme).
- **Place dans le cycle** : agent **transverse**, pastille **🟠 par défaut** (phase servie),
  intervient **sur sollicitation à toute phase** (`methode-de-travail.md:179-181`,
  `methode-de-travail.md:218`). Pas de position fixe dans les 3 phases.
- **Gate** (`agents/nathalie.md:37-39`) : **aucun gate bloquant** ; seule règle de qualité — un
  guide décrit le **comportement réel vérifié**, jamais supposé ; en cas de doute → tester ou
  demander (repris dans `skills/iakaframe-nathalie/SKILL.md:12-15`).
- **Déclencheurs** (`agents/nathalie.md:3`) : « guide utilisateur », « mode d'emploi », « doc
  utilisateur », « tutoriel », « FAQ », « documenter le projet dans AppFlowy », « mettre à jour la
  mémoire humaine », « publier les specs dans AppFlowy ».
- **Procédure de rédaction** (`skills/iakaframe-nathalie/SKILL.md:17-47`) : identifier public+tâche →
  partir de la feature livrée → structure orientée tâche (objectif → étapes → résultat) → illustrer
  → FAQ, avec **un unique gabarit Markdown** (À quoi ça sert / Prise en main / Tâche fréquente / FAQ
  / En cas de problème).
- **Garde-fous** (`skills/iakaframe-nathalie/SKILL.md:66-73`) : français, phrases courtes, sans
  jargon ; met en forme **via Loki** si HTML soigné demandé (elle tient le **fond**, Loki la
  **forme**) ; ne documente pas l'architecture interne ; une instance = un produit ; secrets
  AppFlowy uniquement par env.

### 1.b — OUTILS réellement à disposition

- **Tools du contrat** (`agents/nathalie.md:4`) : `Read, Write, Edit, Grep, Glob, Bash`.
  → **Pas de `WebSearch` / `WebFetch`** (contrairement à Gandalf, `agents/gandalf.md:4`). Elle
  travaille donc **hors-ligne** : elle ne peut ni vérifier l'état de l'art documentaire, ni valider
  une référence externe citée dans un guide.
- **Skill-rôle** `iakaframe-nathalie` : méthode de rédaction + **un seul gabarit** de guide.
- **Skill-outil portée aussi par elle** `iakaframe-appflowy-doc` (`skills/iakaframe-appflowy-doc/`) :
  CLI Node zéro-dépendance (`appflowy-doc.mjs`) lancé en Bash, publie la mémoire humaine —
  **un espace par projet → vue d'ensemble → une sous-page par doc structurant**, idempotent et non
  destructif. Config 100 % env (`APPFLOWY_URL/EMAIL/PASSWORD`) avec repli dotenv local. Contrat API
  vérifié en réel (`skills/iakaframe-appflowy-doc/SKILL.md:75-89`).
- **Cibles / dépendances** : l'app réelle (pour observer le comportement), les docs structurants du
  dépôt (`CLAUDE.md`, `specs/PROJET.md`, `specs/instructions/*`, `specs/etat-des-lieux.md`,
  `docs/qualite/*`), l'instance AppFlowy auto-hébergée, et **Loki** pour tout rendu HTML on-brand
  (dépendance de forme).

### 1.c — LIMITES / angles morts

1. **Aucun cadre de structuration de l'information.** Un **gabarit unique et plat**
   (`skills/iakaframe-nathalie/SKILL.md:29-47`) mélange dans un même document ce qui relève du
   tutoriel, du how-to, de la référence et de l'explication. Pas de **typologie des besoins**
   documentaires.
2. **Hors-ligne par construction.** Sans web (`agents/nathalie.md:4`), elle ne peut pas vérifier une
   bonne pratique, une référence, une version citée — alors que le chantier aval exige un **sourcing
   profond** et un contenu à jour.
3. **Pas de discipline de sourcing.** Contrairement à Gandalf qui cite en `chemin:ligne`
   (`agents/gandalf.md:42`), rien n'oblige Nathalie à **tracer d'où vient** une affirmation. Or le
   livrable « chapeau » demande de **descendre très profondément dans les fichiers skills** :
   sans méthode de sourcing, la fidélité n'est pas garantie.
4. **Pas de versionnement / traçabilité des docs.** La décision amont « versionner
   méthodes/agents/skills » **n'a aucune traduction** dans son rôle : pas de version en tête de
   doc, pas de changelog, pas de lien doc↔version de la méthode décrite.
5. **Pas de gate qualité de prose.** Aucun linter, aucun **style guide outillé**, aucun glossaire /
   contrôle terminologique. La cohérence lexicale repose sur l'attention humaine.
6. **Contrôle terminologique non outillé alors qu'une règle forte existe.** Le chantier aval impose
   de désigner les agents **par leur RÔLE, jamais par leur nom de code** — c'est exactement le type
   de règle qu'un contrôle de terminologie devrait garantir automatiquement ; aujourd'hui rien ne
   l'empêche.
7. **Accessibilité absente.** Aucune consigne (hiérarchie de titres, textes alternatifs, contraste,
   langage clair mesuré).
8. **Test de la doc absent.** Au-delà de « teste ou demande » (`skills/iakaframe-nathalie/SKILL.md:15`),
   aucun contrôle systématique : liens morts, captures périmées, écart guide↔comportement réel.
9. **Relais fond/forme non cadré pour un livrable profond.** Le partage Nathalie (fond) / Loki
   (forme) est posé en principe (`agents/nathalie.md:31`, `skills/iakaframe-nathalie/SKILL.md:69-70`)
   mais **pas outillé** : pour une doc HTML « chapeau » en charte **Cinabre**, il manque un brief
   de passation (structure, ancres, table des matières, contenu sourcé).
10. **Dépendances externes fragiles pour le livrable aval.** La charte **Cinabre** (« naonedge gris
    clair, la dernière ») **n'existe pas encore** dans le dépôt : aucun dossier `design-*/` trouvé
    (le réservoir de chartes vit ailleurs, cf. mémoire projet `iakagraph/theme`). C'est le domaine
    de Loki, mais c'est un **prérequis** du livrable HTML.
11. **Fidélité AppFlowy volontairement dégradée (MVP).** La mémoire humaine ne rend aujourd'hui que
    des **paragraphes** : titres, listes, blocs de code et **liens cliquables vue d'ensemble →
    sous-pages** sont **différés** (`skills/iakaframe-appflowy-doc/SKILL.md:90-94`, `108-114`), et le
    **câblage automatique** aux moments version/pause/reprise n'est pas fait
    (`specs/instructions/appflowy-doc-skill.md:73-75`). La « mémoire humaine » reste donc partielle
    et déclenchée à la main.
12. **Documentation de référence périmée.** `specs/equipe-agents.md:157` note encore la skill de
    Nathalie comme « ❌ à créer » alors qu'elle **existe** — symptôme même de l'absence de
    traçabilité doc↔état réel qu'on veut corriger.

---

## 2. Diagnostic — où le rôle est en-deçà d'une vraie expertise

- **Méthodologie doc.** Le rôle sait « écrire clair », mais n'a pas de **modèle mental des types de
  documentation**. L'état de l'art (vérifié) est le cadre **Diátaxis** — quatre formes répondant à
  quatre besoins : *tutoriels* (apprendre en faisant), *how-to* (résoudre une tâche), *référence*
  (décrire les faits), *explication* (comprendre). Léger, sans contrainte d'implémentation, adopté
  par Django, Canonical, Cloudflare. C'est précisément ce qui manque : un principe actif de qualité
  qui répond à *quoi écrire, comment l'écrire, comment l'organiser*.
- **Structuration de l'information.** Pas de rédaction **par topics** ni de **single-sourcing**
  (réutiliser un fragil canonique plutôt que le recopier). DITA existe mais est **trop lourd** pour
  un MVP ; Diátaxis apporte 80 % du bénéfice pour 20 % du coût — cohérent avec « MVP d'abord ».
- **Réutilisation de chartes.** La passation fond→forme vers Loki reste un principe, pas un protocole.
  Pour un livrable HTML profond en charte Cinabre, il faut un **brief structuré** (plan, ancres,
  contenu sourcé) transmis à Loki, et un point de vérification.
- **Sourcing dans les fichiers.** C'est l'écart le plus critique pour le chantier aval : sans
  **discipline de citation `chemin:ligne`** (à la Gandalf) ni **outils web** pour vérifier l'externe,
  une doc « qui descend profondément dans les skills » ne peut pas prouver sa fidélité.
- **Versionnement / traçabilité.** Aucune articulation avec la décision « versionner
  méthodes/agents/skills ». Une doc experte porte **sa version, la version décrite, et un
  changelog** ; sinon on ne sait jamais si un guide décrit la méthode d'aujourd'hui ou d'hier.
- **Accessibilité.** Absente ; une doc experte 2026 garantit au minimum hiérarchie de titres,
  alternatives textuelles et langage clair.
- **Tests de la doc.** Absents ; une doc experte se **teste** (liens, captures, conformité au réel)
  comme du code — c'est l'esprit docs-as-code, déjà l'ADN d'iakaframe.

---

## 3. Propositions d'amélioration en vue d'une expertise (priorisées)

> Convention : **[CONTRAT]** = `agents/nathalie.md` · **[SKILL]** = `skills/iakaframe-nathalie/` ·
> **[OUTIL]** = script/skill-outil à ajouter ou étendre. Toutes réutilisent l'existant d'abord ;
> tout outil nouveau suit le calque `iakaframe-appflowy-doc` (Node zéro-dép, config env, défensif).

### MUST (socle de l'expertise)

**M1 — Adopter Diátaxis comme cadre de structuration. [SKILL]**
- *Quoi* : remplacer le gabarit unique par **quatre gabarits typés** (tutoriel, how-to, référence,
  explication) + une règle « un document = un type, un besoin ».
- *Pourquoi* : c'est le standard de l'état de l'art (vérifié), léger, MVP-compatible ; il résout à la
  fois *quoi/comment/où* organiser — le manque n°1 du rôle.
- *Comment* : réécrire `skills/iakaframe-nathalie/SKILL.md` (section Procédure + Format) avec les
  quatre gabarits et un arbre de décision « quel type pour quel besoin » ; conserver le gabarit
  actuel comme cas particulier du *how-to*. Impact : SKILL seule ; le CONTRAT est inchangé sur le
  fond (la mission « doc utilisateur » couvre déjà les quatre formes).

**M2 — Donner à Nathalie le web + une discipline de sourcing. [CONTRAT] + [SKILL]**
- *Quoi* : ajouter `WebSearch, WebFetch` à ses tools, et imposer une **règle de sourcing en
  `chemin:ligne`** (fichiers) et **citation de source** (web) pour toute affirmation non triviale.
- *Pourquoi* : la doc « chapeau » exige un sourcing profond ET du contenu à jour ; une rédactrice
  experte ne travaille pas hors-ligne (même logique que la règle web de Gandalf,
  `agents/gandalf.md:24-30`).
- *Comment* : `agents/nathalie.md:4` → `tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch, WebFetch` ;
  ajouter au SKILL une section « Sourcing & vérification » (tracer chaque fait, citer la source,
  vérifier l'externe avant publication). **Arbitrage à valider** (§4) : cela élargit son périmètre.

**M3 — Contrôle terminologique + glossaire (dont « rôle jamais nom de code »). [SKILL] (+ [OUTIL] optionnel)**
- *Quoi* : un **glossaire canonique** de la méthode + une règle dure « désigner les agents par leur
  **RÔLE**, jamais par leur nom de code » dans toute doc publiée à l'extérieur.
- *Pourquoi* : règle explicite du chantier aval ; garantit la cohérence lexicale d'une doc experte.
- *Comment* : section « Terminologie » dans le SKILL + un fichier glossaire versionné dans le dépôt ;
  à terme, l'outiller (voir S2). Impact : SKILL ; le CONTRAT peut rappeler la règle en garde-fou.

### SHOULD (consolidation)

**S1 — Versionner et tracer les docs. [SKILL] + convention projet**
- *Quoi* : front-matter minimal en tête de chaque doc (`version_doc`, `version_méthode_décrite`,
  `date`, `source(s)`) + un court **changelog** en pied.
- *Pourquoi* : traduit la décision « versionner méthodes/agents/skills » côté documentation ;
  supprime l'ambiguïté « ce guide décrit-il l'état actuel ? » (cf. angle mort n°12).
- *Comment* : gabarit de front-matter dans le SKILL, aligné sur le schéma de versionnement retenu
  pour méthode/agents/skills (à arbitrer, §4). Impact : SKILL + convention.

**S2 — Gate qualité de prose via Vale (self-hosted, open-source). [OUTIL] + [SKILL]**
- *Quoi* : un **linter de prose** `Vale` avec un style maison FR + le glossaire M3 (termes bannis,
  longueur de phrase, « nom de code interdit en doc externe »).
- *Pourquoi* : Vale est open-source, docs-as-code, comprend le Markdown/HTML, intégrable en CI —
  parfaitement aligné « self-hosted / open-source d'abord » ; il **automatise** M3 (vérifié :
  packs Google/Microsoft + règles YAML maison).
- *Comment* : un `.vale.ini` + un dossier de styles au niveau iakaframe ; Nathalie le lance en Bash
  (déjà dans ses tools) avant publication ; documenter l'usage dans le SKILL. Impact : OUTIL nouveau
  (léger) + SKILL. **Arbitrage** (§4) : skill-outil dédiée ou simple config partagée ; style FR à
  bâtir (les packs officiels sont en anglais).

**S3 — Protocole de passation fond → forme vers Loki. [CONTRAT] + [SKILL]**
- *Quoi* : un **brief de passation** standard (plan, table des matières, ancres, contenu sourcé,
  charte cible) quand un rendu HTML on-brand est demandé.
- *Pourquoi* : le livrable « chapeau » Cinabre est précisément ce cas ; sans protocole, la frontière
  fond/forme reste floue.
- *Comment* : préciser dans `agents/nathalie.md:31` que la passation se fait **par brief structuré** ;
  ajouter le gabarit de brief au SKILL. Impact : CONTRAT (précision) + SKILL.

**S4 — Tester la doc. [SKILL] (+ [OUTIL] léger)**
- *Quoi* : checklist de **test doc** : liens (vérif automatisable), captures à jour, **conformité au
  comportement réel** (rejoue les étapes), terminologie (Vale).
- *Pourquoi* : rend concret « comportement réel vérifié » (`skills/iakaframe-nathalie/SKILL.md:12-15`)
  et aligne la doc sur l'esprit docs-as-code.
- *Comment* : section « Tester la doc » dans le SKILL ; vérif de liens via un petit utilitaire Bash
  ou Vale. Impact : SKILL + petit OUTIL.

### COULD (raffinements)

**C1 — Socle d'accessibilité. [SKILL]** : checklist (hiérarchie de titres, alternatives textuelles,
langage clair) ; le contraste/couleurs restent chez Loki (charte). Impact : SKILL.

**C2 — Relever la fidélité de la mémoire humaine AppFlowy. [OUTIL]** : lever les différés déjà
tracés (`skills/iakaframe-appflowy-doc/SKILL.md:108-114`) — rendu Markdown riche (titres/listes/code),
**liens cliquables** vue d'ensemble → sous-pages, puis **câblage automatique** aux moments
version/pause/reprise (`specs/instructions/appflowy-doc-skill.md:73-75`). Impact : OUTIL existant
(lot suivant, déjà cadré). À re-prioriser, pas à re-cadrer.

**C3 — Discipline de captures. [SKILL]** : convention de nommage/stockage des captures + rappel de
fraîcheur au test doc (S4). Impact : SKILL.

---

## 4. Questions ouvertes / arbitrages pour Stéphane (décideur)

La première tient au périmètre : **veut-on vraiment donner le web à Nathalie** (M2) ? Cela la rend
plus experte et lui permet de vérifier ses sources, mais cela élargit son contrat — elle cesse d'être
« hors-ligne » et se rapproche, sur ce point, de Gandalf. Le garde-fou reste net : elle vérifie et
cite, elle ne cadre pas. À toi de dire si cet élargissement te convient ou si tu préfères qu'elle
reste hors-ligne et s'appuie sur un Gandalf/Aragorn pour l'externe.

Deuxième arbitrage : **jusqu'où formaliser le cadre documentaire**. Adopte-t-on **Diátaxis nommément**
(un vocabulaire externe reconnu, que la doc « chapeau » pourrait même revendiquer) ou s'en
inspire-t-on sans le nommer, avec un vocabulaire maison ? Nommer un standard rassure et documente le
« pourquoi » ; un vocabulaire maison colle davantage à la culture iakaframe.

Troisième point : **le versionnement des docs** (S1). Quelle granularité — une version par document,
ou un alignement strict sur la version de la méthode/de l'agent/de la skill décrite ? Et où vit le
changelog : en tête de chaque doc, ou centralisé ? Cette décision dépend directement du schéma que tu
retiendras pour « versionner méthodes/agents/skills », qui est le sujet parent.

Quatrième point : **Vale** (S2). Skill-outil dédiée (comme `iakaframe-appflowy-doc`) ou simple
`.vale.ini` partagé au niveau du dépôt ? Et acceptes-tu l'investissement d'un **style FR maison**
(les packs officiels Google/Microsoft sont en anglais) — c'est là qu'on encoderait « rôle jamais nom
de code » et le glossaire ?

Cinquième point : la **charte Cinabre** (« naonedge gris clair, la dernière ») **n'existe pas encore**
dans le dépôt côté chartes. Le livrable « chapeau » en dépend. Faut-il que Loki la crée/formalise
**avant** que Nathalie produise le fond, ou les deux avancent-ils en parallèle (fond sourcé d'abord,
habillage Cinabre ensuite) ?

Enfin, priorisation : mon découpage MUST/SHOULD/COULD te convient-il pour attaquer, ou préfères-tu
qu'on isole d'abord **le strict nécessaire au livrable « chapeau »** (M1 Diátaxis + M2 sourcing/web +
M3 terminologie + S3 passation Loki) et qu'on renvoie le reste (Vale, versionnement outillé,
accessibilité, fidélité AppFlowy) à une itération suivante ?

---

## Sources (état de l'art vérifié)

- Diátaxis — cadre des quatre types de documentation : <https://diataxis.fr/start-here/>
- Diátaxis, présentation et adoption (Django, Canonical, Cloudflare) :
  <https://idratherbewriting.com/blog/what-is-diataxis-documentation-framework>
- Vale — linter de prose open-source, docs-as-code : <https://vale.sh/>
- Vale, guide 2026 pour équipes doc : <https://docsio.co/blog/vale-linter>
