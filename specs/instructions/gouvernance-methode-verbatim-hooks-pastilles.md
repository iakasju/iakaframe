# Instruction — Gouvernance de la méthode : cap verbatim · hook de périmètre par agent · pastille 🟠 & collision 🔴

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : **le décideur (Stéphane)** — ce sont **trois
> arbitrages de MÉTHODE**, pas des features de projet.
> Statut : **à valider par Stéphane** avant exécution. Doc en français, code/identifiants en anglais.
> Portée : touche `methode-de-travail.md`, les **contrats d'agents** (`library/personas/*.md`) et
> potentiellement les **hooks** (`kits/iakaframe-claude/global/hooks/`). Aucune ligne de code écrite
> ici : ce document **cadre pour décision**. Chaque sujet se termine par un **FORK DÉCIDEUR** —
> le(s) point(s) que **seul Stéphane tranche**.

---

## 0. Cadre commun

Ces trois sujets sont remontés par la **critique adversariale des agents**. Ils ont un dénominateur
commun : une **règle de gouvernance est incomplète ou en conflit non arbitré**, et ne vit qu'en
prose (honor-system) sans seuil ni enforcement. Le rôle de Gandalf ici est de **fermer le
périmètre de la décision** (poser les options, recommander, isoler ce qui revient au décideur) —
**pas** de trancher un arbitrage de méthode à la place de Stéphane.

MVP d'abord : on cherche la **plus petite règle qui ferme la faille**, pas le système parfait.

---

# SUJET 1 — Cap de volume de la « restitution verbatim »

## 1.1 État des lieux (fichier:ligne)

- **La règle verbatim, sans cap** : `methode-de-travail.md:276-282` — « l'orchestrateur **cite
  VERBATIM** la sortie de l'émetteur … **jamais** une reformulation, condensation, sélection ou
  synthèse ». Aucune mention de volume, de seuil, ni de cas où un extrait serait toléré.
- **Répétée dans les contrats** : `library/personas/odin.md:110-112`,
  `library/personas/aragorn.md:115-118` (« cité VERBATIM (jamais reformulé/condensé) »), et dans
  le `CLAUDE.md` global (§ Restitution en relais).
- **Le conflit non arbitré** : `methode-de-travail.md:45` pose la préférence transverse du décideur
  « Réponses **en français, concises et directes — pas de bavardage** ». Sur une session à ~30
  délégations, le verbatim intégral **contredit mécaniquement** cette préférence : coût de
  verbosité énorme, l'essentiel noyé.
- **Contexte machine** : le canal geste journalise **déjà** le RETOUR verbatim de chaque délégation
  hors du fil de conversation (`kits/iakaframe-claude/global/hooks/delegation-guard.mjs:94-113`,
  émission L5 vers la base de logs). Donc **le verbatim intégral existe et est auditable
  ailleurs** — le fil de conversation adressé à l'humain n'est **pas** le seul dépositaire de la
  trace fidèle.

**Le vrai besoin derrière la règle** (à ne pas perdre) : l'**anti-ventriloquie** — ne **jamais**
faire dire à un agent des mots qu'il n'a pas produits, et que l'humain sache **toujours qui a
réellement parlé**. Le verbatim intégral était le **moyen** ; l'intégrité de l'attribution est la
**fin**.

## 1.2 Règle proposée (recommandée) — verbatim borné + extrait fidèle attribué

Distinguer **deux invariants** aujourd'hui confondus :

1. **Invariant dur (jamais assoupli) — anti-ventriloquie / attribution** : sous le badge d'un
   agent, **seuls ses mots exacts** apparaissent. Interdiction absolue de faire dire à un agent
   quelque chose qu'il n'a pas écrit, de le paraphraser « en je », ou de fondre son travail dans la
   voix de l'orchestrateur. **Cet invariant ne bouge pas.**

2. **Invariant souple (le cap de volume) — mode de restitution** : le **verbatim intégral** est
   requis **en dessous d'un seuil** ; **au-dessus**, l'orchestrateur peut restituer un **extrait
   cité fidèle** (verbatim partiel, jamais reformulé) **plus un renvoi** vers la source intégrale
   (le journal geste / un artefact), **sous le badge de l'émetteur** — l'extrait reste des **mots
   exacts** de l'agent (donc l'invariant dur est préservé), il est juste **tronqué** et **signalé
   comme tel**.

Mécanisme MVP proposé :

- **Seuil de volume** : si la sortie de l'émetteur tient en **≤ N lignes non vides** (proposition :
  **N = 15**), **verbatim intégral obligatoire** (comportement actuel). Au-delà, mode extrait.
- **Mode extrait (au-dessus du seuil)** : bloc sous le badge de l'émetteur contenant (a) un
  **verbatim des passages porteurs** (ouverture/clôture, verdict, chiffres, fichiers) — **cité tel
  quel**, jamais reformulé — et (b) une **marque de troncature explicite** (`[…]`) + un **renvoi**
  (« intégral : `iakaframe-delegations.log` / artefact »). Tout **commentaire/résumé** passe **sous
  le badge de l'orchestrateur**, séparé — jamais sous celui de l'émetteur.
- **Distinction agent personnifié vs agent d'analyse jetable** : un **agent du roster** (odin,
  aragorn, gandalf, gimli, legolas, helm, loki, nathalie — cf.
  `kits/iakaframe-claude/global/hooks/guard-core.mjs:115-117`) garde le **régime strict** (verbatim
  intégral sous seuil, extrait fidèle au-dessus). Un **sous-agent d'analyse jetable**
  (`Explore`/`Plan`/`general-purpose`, cf. `guard-core.mjs:119-121`), dont la sortie est un
  **matériau de travail** et non une **parole d'agent nommé**, peut être **synthétisé librement par
  l'orchestrateur sous SON propre badge** (pas de badge d'émetteur à protéger, donc pas de
  ventriloquie possible). C'est le levier de sobriété le plus sûr.

## 1.3 Alternatives (non recommandées, exposées pour l'arbitrage)

- **A. Statu quo** (verbatim intégral toujours) : intégrité maximale, mais conflit `:45` non résolu,
  verbosité assumée.
- **B. Résumé autorisé partout sous badge émetteur** : le plus concis, mais **ouvre la porte à la
  ventriloquie** (un « résumé » sous le badge de l'agent = mots que l'agent n'a pas écrits).
  **À écarter** — casse l'invariant dur.
- **C. Verbatim toujours, mais hors-fil** : l'orchestrateur ne met dans le fil qu'un **pointeur**
  vers le verbatim journalisé, et ne cite rien. Sobre et intègre, mais **perd la lisibilité
  immédiate** (l'humain doit ouvrir un log pour lire l'agent).

## 1.4 Impact

- **Méthode** : réécrire `methode-de-travail.md:276-282` pour séparer les deux invariants + poser le
  seuil et le mode extrait. Lever explicitement le conflit avec `:45`.
- **Contrats** : répercuter dans `library/personas/odin.md:110-112` et
  `library/personas/aragorn.md:115-118` + `CLAUDE.md` global (§ Restitution en relais). Régénérer
  les kits si les contrats sont dérivés.
- **Hooks** : **aucun changement de code requis** (le journal verbatim existe déjà). Éventuellement
  documenter que le journal geste **est** la source intégrale de renvoi.

## 1.5 Critères d'acceptation

- [ ] `methode:276-282` distingue **invariant dur (attribution/anti-ventriloquie)** et **invariant
      souple (volume)** ; le mot « verbatim » n'est plus absolu sans nuance.
- [ ] Un **seuil chiffré** (N lignes) est écrit noir sur blanc, avec la conduite sous/au-dessus.
- [ ] Le **mode extrait** impose : passages **cités tels quels** + marque de troncature `[…]` +
      renvoi à la source intégrale ; **tout résumé** est badgé orchestrateur, jamais émetteur.
- [ ] La **distinction roster vs sous-agent jetable** est écrite (renvoi `guard-core.mjs` ROSTER /
      BUILTINS).
- [ ] Les deux contrats (odin, aragorn) + `CLAUDE.md` global sont **cohérents** avec la méthode.
- [ ] Le conflit avec `methode:45` (« pas de bavardage ») est **explicitement tranché** dans le
      texte (plus de contradiction latente).

## 1.6 🔱 FORK DÉCIDEUR (Stéphane tranche)

1. **Y a-t-il un cap, oui/non ?** (Recommandé : oui — invariant souple.)
2. **Valeur du seuil N** : 15 lignes ? 20 ? 25 ? (Curseur verbosité ↔ fidélité intégrale.)
3. **Un sous-agent d'analyse jetable peut-il être librement synthétisé** sous le badge de
   l'orchestrateur ? (Recommandé : oui — pas de badge émetteur à protéger.)
4. **En cas de doute, on penche vers** : fidélité (verbatim) ou sobriété (extrait) ?

---

# SUJET 2 — Enforcement réel du périmètre d'écriture par HOOK

## 2.1 État des lieux (fichier:ligne)

- **Le périmètre en honor-system** : `library/personas/gandalf.md:20,26,40` — Gandalf « n'écrit que
  dans `specs/instructions/` » — mais ce périmètre ne vit qu'en **prose**. Idem
  `library/personas/nathalie.md` (documentation). Aucun de leurs contrats ne **contraint**
  techniquement où ils écrivent. (Note : ils n'ont pas de champ `tools:` scopé dans la frontmatter
  du persona canonique ; le scope réel dépend du kit runner dérivé.)
- **Le champ de déclaration existe déjà** : `library/personas/gandalf.md:9`
  `guardrails: [identity, perimeter]` — posé au **Lot 1**. Tous les personas le portent
  (`library/personas/*.md:9`). **Mais** `perimeter` y désigne aujourd'hui le **périmètre PROJET**,
  pas un **sous-périmètre d'écriture par agent**.
- **Le hook de périmètre existe déjà — mais garde le PROJET, pas l'AGENT** :
  `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` (adaptateur Claude) +
  `guard-core.mjs:97-105` (`verdictPerimeter`) classent un chemin contre **`$CLAUDE_PROJECT_DIR`**
  (racine projet) → `ALLOW_PROJECT | ALLOW_PORTFOLIO | DENY_HARNESS | HORS`. **Granularité = le
  projet entier.** Un Gandalf qui écrirait dans `src/` du **même projet** passerait `ALLOW_PROJECT`
  — la faille « Gandalf hors `specs/instructions/` » **n'est pas couverte**.
- **La contrainte technique décisive** : `specs/instructions/garde-perimetre-gestes-directs.md:59-63`
  et `:92-100` (faits vérifiés Claude Code hooks, cités) — **la persona iakaframe est ABSENTE du
  payload** quand c'est le **thread principal (Odin)** qui agit ; `agent_type` n'existe **que**
  quand le hook se déclenche **dans un sous-agent**. Le hook actuel en tire : « garde de CHEMINS,
  jamais de personas » (`perimeter-guard.mjs:11`).

## 2.2 Insight qui rend le sujet 2 faisable (MVP)

Les agents iakaframe **sont installés comme sous-agents natifs** dans les kits
(`kits/iakaframe-claude/.claude/agents/gandalf.md`, etc.). **Quand Gandalf tourne, il tourne dans un
sous-agent** — donc le payload PreToolUse de son `Write`/`Edit` **porte `agent_type: "gandalf"`**
(le nom du sous-agent natif). C'est exactement le champ que `delegation-guard.mjs:62` lit déjà
(`ti.subagent_type`) côté Task. **Donc, pour les agents qui tournent en sous-agent** (Gandalf,
Nathalie, Legolas…), le hook **peut** connaître qui écrit et **appliquer un sous-périmètre par
agent** — ce que le garde projet actuel ne fait pas.

**Limite assumée symétrique** (à écrire) : pour le **thread principal (Odin)**, `agent_type` est
absent → le sous-périmètre par agent **ne s'applique pas** ; seul le garde projet existant opère.
C'est cohérent : Odin est portefeuille, il **délègue** l'écriture métier.

## 2.3 Règle proposée (recommandée) — sous-périmètre d'écriture par agent, adossé à `guardrails`

- **Déclaration** : le périmètre d'écriture par agent vit **dans le contrat du persona**, adossé au
  `perimeter` déjà présent dans `guardrails`. Deux formes possibles (fork ci-dessous) :
  - (a) une **clé frontmatter dédiée**, ex. `writeScope: ["specs/instructions/"]` pour Gandalf,
    `writeScope: ["specs/", "docs/"]` pour Nathalie ; ou
  - (b) une **table statique dans `guard-core.mjs`** (runner-agnostique, à côté de `ROSTER`) :
    `AGENT_WRITE_SCOPE = { gandalf: ["specs/instructions/"], nathalie: [...] }`. **MVP recommandé**
    (aucune lecture de fichier au runtime dans le hook, pas de dépendance frontmatter, parité
    multirunner garantie par le test d'identité octet-pour-octet `guard-core-parity`).
- **Lecture par le hook** : dans l'adaptateur `perimeter-guard.mjs`, si le payload porte
  `tool_input.agent_type`/`agent_id` **ET** que cet agent a un `writeScope` déclaré → **avant** le
  verdict projet, vérifier que le chemin cible est **sous** l'un des sous-répertoires autorisés
  (réutiliser `isUnder` de `guard-core.mjs:86-90`, résolu **relativement à `$CLAUDE_PROJECT_DIR`**).
  Hors sous-périmètre → verdict neuf **`HORS_AGENT`**, bloquant selon mode (aligné sur le mode
  Edit/Write = DENY par défaut, cf. `garde-perimetre-gestes-directs.md:162-187`).
- **Fail-open partout** (invariant du garde existant) : `agent_type` absent → on **retombe** sur le
  garde projet actuel, aucun durcissement. Agent sans `writeScope` déclaré → **pas de
  sous-périmètre** (comportement inchangé). Un bug interne → exit 0.
- **Agents concernés au MVP** : **Gandalf** (`specs/instructions/`) et **Nathalie** (périmètre doc à
  préciser). Les agents à écriture large (Gimli) **ne déclarent pas** de `writeScope` → inchangés.

## 2.4 Alternatives (non recommandées, exposées pour l'arbitrage)

- **A. Scoper les `tools:` du sous-agent** (permissions natives Claude, ex. `Edit(specs/**)`) plutôt
  qu'un hook : plus « natif », mais **non portable multirunner** (chaque host réimplémente sa
  syntaxe de permission), et **ne journalise pas** la tentative refusée. À réserver en **défense en
  profondeur** complémentaire, pas en remplacement.
- **B. Honor-system + revue Aragorn** (statu quo durci par la prose) : zéro code, mais c'est
  précisément la faille remontée — aucun enforcement.
- **C. Frontmatter `writeScope` lue au runtime par le hook** : plus « déclaratif », mais impose au
  hook de **lire et parser un `.md`** à chaque geste (I/O + fragilité + rupture de la pureté de
  `guard-core.mjs:22`). **À écarter** pour le MVP.

## 2.5 Impact

- **Méthode** : ajouter à `methode-de-travail.md` (§ garde-fous / § Pourquoi des agents point 2
  « permissions, limites packagées ») une phrase actant le **sous-périmètre d'écriture par agent**
  et sa **limite** (ne vaut qu'en sous-agent, pas pour le thread principal).
- **Contrats** : selon le fork, ajouter `writeScope:` aux frontmatter (`gandalf`, `nathalie`) ou
  documenter la table statique. Cohérence avec le `perimeter` déjà dans `guardrails:9`.
- **Hooks** : étendre `guard-core.mjs` (verdict `HORS_AGENT` + table/`isUnder`) **et** l'adaptateur
  `perimeter-guard.mjs` (lecture `agent_type`, branche sous-périmètre). **Répliquer** dans le miroir
  `.ps1` et les autres kits runner (parité octet-pour-octet, cf. `guard-core.mjs:17-20`).
- **Câblage** : le matcher `PreToolUse[Edit|Write|...]` existe **déjà** (posé au garde de gestes
  directs) — **aucune** nouvelle auto-modification de `settings.json` requise si le hook est le même
  fichier étendu. À confirmer.

## 2.6 Critères d'acceptation (vérifiables par tests stdin, calqués sur le garde existant)

- [ ] `guard-core.mjs` expose une fonction pure de sous-périmètre agent (entrée : `agent`, chemin
      absolu, `projectDir`, table de scopes) → verdict `HORS_AGENT | OK_AGENT | NO_SCOPE`.
- [ ] **Gandalf hors `specs/instructions/`** : payload `Write` avec `agent_type:"gandalf"` sur
      `<projet>/src/x.ts` → **exit 2** (mode défaut), `verdict:"HORS_AGENT"`, stderr explicite
      (« Gandalf n'écrit que dans specs/instructions/ »).
- [ ] **Gandalf dans son périmètre** : `Write` `agent_type:"gandalf"` sur
      `<projet>/specs/instructions/x.md` → **exit 0**.
- [ ] **Agent sans scope** : `Write` `agent_type:"gimli"` (pas de `writeScope`) → comportement
      **projet inchangé** (exit 0 si dans le projet).
- [ ] **`agent_type` absent (thread principal)** : aucun sous-périmètre appliqué → garde projet
      actuel seul, comportement **strictement inchangé**.
- [ ] **Fail-open** : table illisible / bug interne → exit 0.
- [ ] **Parité** : `.ps1` et copies `guard-core.mjs` des autres kits **identiques** (test de parité
      vert).
- [ ] **Journal** : la tentative `HORS_AGENT` apparaît dans `~/.claude/iakaframe-perimeter.log` avec
      `agent`, `verdict`, `mode`.

## 2.7 🔱 FORK DÉCIDEUR (Stéphane tranche)

1. **On fait ce hook, oui/non ?** (Recommandé : oui, MVP Gandalf + Nathalie.)
2. **Où vit la déclaration** : table statique `guard-core.mjs` (recommandé, portable) **ou**
   frontmatter `writeScope:` (déclaratif mais I/O runtime) ?
3. **Périmètre exact de Nathalie** : `specs/` + `docs/` ? Ailleurs ? (À fixer — Gandalf =
   `specs/instructions/` est clair.)
4. **Sévérité par défaut** : `HORS_AGENT` bloque (exit 2) dès la mise en service, ou WARN d'abord
   (comme les heuristiques Bash) puis durci ? (Chemin explicite fiable → DENY d'emblée, recommandé.)
5. **Autres agents à scoper** au-delà de Gandalf/Nathalie (Legolas = lecture seule + rapport ?
   Loki = `iakagraph/etudes/…` ?), ou on itère plus tard ?

---

# SUJET 3 — Pastille 🟠 sous-spécifiée + collision 🔴 Gimli/Legolas

## 3.1 État des lieux (fichier:ligne)

- **La table des pastilles de l'identité n'a AUCUNE ligne 🟠** : `methode-de-travail.md:211-217` —
  lignes Cadrage 🔵 / Dev 🔴 / Staging 🟢 / Prod 🟣 / Portefeuille 🟡. **Pas de 🟠.**
- **🟠 n'existe qu'en prose** : `methode-de-travail.md:219` — « Agents transverses (Aragorn, Loki,
  Nathalie) : pastille de la **phase servie**, 🟠 par défaut ». Non tabulé, donc non normatif au même
  titre que les autres.
- **Incohérence interne** : le **roster** `methode-de-travail.md:105-114` **utilise** pourtant 🟠
  (Aragorn `:108`, Loki `:113`, Nathalie `:114`) et 🟡 (Odin `:107`) ; et les **frontmatter**
  confirment 🟠 (`library/personas/aragorn.md:7`, `nathalie.md:7`, `loki.md:7`). La table
  d'identité `:211-217` est donc **en retard** sur le reste du fichier.
- **Palette d'Aragorn** : `library/personas/aragorn.md:105` liste « 🔵/🔴/🟢/🟣, 🟠 par défaut » —
  **omet 🟡** (normal : Aragorn ne sert jamais le portefeuille) mais **cite bien 🟠**. La lacune est
  surtout dans la **table méthode**, pas dans le contrat Aragorn.
- **Collision 🔴** : `library/personas/gimli.md:7` **et** `library/personas/legolas.md:7` valent
  **tous deux `🔴`**. En **P2 Réalisation** (`methode-de-travail.md:157-161`), Gimli (dev) et
  Legolas (qualité) partagent la pastille 🔴 → **la couleur ne disambigue pas** lequel des deux
  parle. (Ils partagent aussi 🟢 en P3.)

## 3.2 Règle proposée (recommandée)

**Deux corrections distinctes, cohérentes avec le principe existant.**

### 3.2.a — Spécifier 🟠 dans la table d'identité
Ajouter une **ligne 🟠** à `methode:211-217` :

| Phase | Pastille | Couleur |
|---|---|---|
| Cadrage / réflexion | 🔵 | bleu |
| Dev | 🔴 | rouge |
| Staging | 🟢 | vert |
| Prod | 🟣 | violet |
| **Transverse / coordination (défaut hors phase)** | **🟠** | **orange** |
| Portefeuille (🦅 Odin) | 🟡 | or |

Formulation : **🟠 = « transverse / hors phase précise » — pastille par défaut d'un agent servant
un besoin non rattaché à une phase colorée** (coordination Aragorn, design Loki, doc Nathalie). Un
agent transverse **prend la pastille de la phase qu'il sert** quand il en sert une, **🟠 sinon**
(exactement ce que dit déjà `:219` et `aragorn.md:105`). Répercuter la mention 🟠 dans la palette
d'Aragorn si utile (déjà présente `:105`).

### 3.2.b — Collision 🔴 Gimli/Legolas : **documenter comme acceptable** (recommandé)
Le principe fondateur est explicite : **la pastille = la PHASE, couleur PARTAGÉE entre agents, pas
propre à l'agent** (`methode-de-travail.md:208`). Que Gimli et Legolas soient **tous deux 🔴 en P2
est donc voulu, pas un bug** : ils sont dans la **même phase**. La **désambiguïsation est portée par
le `[Agent]` du badge** — `🔴 [ROYAUME][Gimli]` vs `🔴 [ROYAUME][Legolas]` — jamais par la couleur
seule (le format badge `guard-core.mjs:33` impose toujours `[ROYAUME][Agent]`). **Action** : ajouter
**une phrase explicite** dans `methode:208-219` actant que « **au sein d'une même phase, plusieurs
agents partagent la pastille ; c'est le nom d'agent du badge qui distingue** » — pour que la
collision soit **documentée comme intentionnelle** et ne resurgisse pas en critique.

## 3.3 Alternatives (non recommandées, exposées pour l'arbitrage)

- **Donner à Legolas une pastille propre** (ex. une couleur qualité distincte) : **casse le principe
  « pastille = phase, pas agent »** (`:208`) et créerait une exception pour un seul agent. À écarter
  sauf si le décideur **change le principe** (pastille = agent), ce qui est un bien plus gros
  chantier hors périmètre MVP.
- **Fusionner Gimli+Legolas visuellement** (ne rien faire) : laisse la critique valide (« la couleur
  ne disambigue pas ») **non répondue** dans la doc. La solution 3.2.b y répond par une phrase.

## 3.4 Impact

- **Méthode** : éditer `methode-de-travail.md:211-217` (ligne 🟠) + `:208-219` (phrase collision).
  Purement documentaire, non fonctionnel.
- **Contrats** : vérifier que `library/personas/aragorn.md:105` (et les autres transverses) restent
  cohérents ; a priori **aucun changement** (ils citent déjà 🟠).
- **Hooks** : **aucun** — `guard-core.mjs:30-31` connaît déjà les 6 pastilles (dont 🟠 `0x1f7e0` et
  🟡 `0x1f7e1`) ; l'enforcement d'identité **ne dépend pas** de la table méthode.

## 3.5 Critères d'acceptation

- [ ] `methode:211-217` contient une **ligne 🟠** avec libellé « transverse / hors phase ».
- [ ] Une **phrase** dans `methode:208-219` acte que **plusieurs agents partagent une pastille dans
      une même phase**, le **nom d'agent** du badge tranchant l'ambiguïté (collision 🔴
      Gimli/Legolas **documentée comme intentionnelle**).
- [ ] Le fichier est **cohérent** de bout en bout : table d'identité `:211` ↔ roster `:105` ↔
      frontmatter `library/personas/*.md:7` (mêmes pastilles pour les mêmes agents).
- [ ] Aucun agent transverse ne perd la mention 🟠 dans son contrat.

## 3.6 🔱 FORK DÉCIDEUR (Stéphane tranche)

1. **Libellé exact de la ligne 🟠** : « Transverse / coordination », « Hors phase / défaut »,
   autre ?
2. **Collision 🔴** : on **documente comme acceptable** (recommandé — fidèle au principe « pastille =
   phase ») **ou** on **change le principe** pour donner une couleur propre par agent (gros
   chantier, hors MVP) ?
3. **🟠 est-il une « phase » ou un « hors-phase par défaut » ?** (Impacte le libellé de colonne :
   la table s'appelle « Phase ».)

---

## 4. Périmètre global de cette instruction

### Inclus (à décider puis exécuter, une fois validé)
- Édition de `methode-de-travail.md` (§ restitution/verbatim, § pastilles, § garde-fous).
- Édition des contrats concernés (`library/personas/odin.md`, `aragorn.md`, `gandalf.md`,
  `nathalie.md`) + `CLAUDE.md` global, selon les forks tranchés.
- Extension des hooks (`guard-core.mjs` + `perimeter-guard.mjs` + miroir `.ps1` + copies kits) **si**
  le sujet 2 est validé.
- Régénération/synchro des kits dérivés (parité).

### Exclu (hors périmètre)
- **Trancher les forks décideurs** : c'est Stéphane, pas Gandalf ni Gimli.
- Refonte du principe « pastille = phase » (sujet 3, alternative lourde) : hors MVP.
- Enforcement du périmètre pour le **thread principal Odin** (impossible : persona absente du
  payload, `garde-perimetre-gestes-directs.md:59-63`).
- Tout scope de `tools:` natif (défense en profondeur, itération ultérieure).

### Estimation (indicative, à confirmer à l'ouverture du gate P1→P2)
- Sujet 1 (doc + 3 contrats) : ~0,25 j-h.
- Sujet 2 (hook + core + parité + tests stdin) : ~0,75–1 j-h (le plus lourd).
- Sujet 3 (doc pure) : ~0,15 j-h.

---

## 5. Notes pour l'exécution (Gimli), post-validation
- **Ne rien coder avant** que les **forks décideurs** des §1.6 / §2.7 / §3.6 soient tranchés par
  Stéphane : les valeurs (seuil N, lieu de déclaration du `writeScope`, libellé 🟠) **conditionnent**
  le code.
- Sujet 2 : **réutiliser** `isUnder`/`verdictPerimeter` (`guard-core.mjs:86-105`), **ne pas casser**
  la pureté de `guard-core.mjs` (§22), **répliquer** octet-pour-octet dans toutes les copies (test
  de parité). Tests **stdin d'abord** (calqués sur `garde-perimetre-gestes-directs.md:243-311`).
- Sujets 1 & 3 : édition documentaire ; **cohérence** table d'identité ↔ roster ↔ frontmatter à
  vérifier en fin de tâche.
- Clôture : régénérer l'état des lieux + commit conventional (`docs:`/`feat:` selon le sujet) via
  `update`.
