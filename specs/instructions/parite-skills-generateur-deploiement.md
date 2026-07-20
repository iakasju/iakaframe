# Parité des skills — générateur, golden et déploiement (dette `~/.claude/skills/`)

> Instruction de cadrage (Gandalf, P1). **Lecture seule** sur le code ; ce fichier est le seul
> artefact produit. Objectif : doter les **skills** du même dispositif anti-dérive que les personas
> (générateur → golden → `--check`), et lever la dette **22/22 en écart** mesurée par Legolas.
> Aucun code ici : spec fermée pour un lot d'exécution.

## 0. Avertissement — l'audit a trouvé plus grave que la dette annoncée

Le backlog pose le problème comme un **retard de déploiement** (14 périmées + 8 absentes). C'est
exact, mais **incomplet**. En vérifiant comment une skill atteint réellement un agent au runtime,
j'ai constaté que **la couche skills est aujourd'hui structurellement inerte pour les 8 personas** —
indépendamment de toute fraîcheur de copie. Trois faits vérifiés :

**Fait 1 — le contrat déployé ne porte pas `skills:`.** `renderAgentContract`
(`cli/src/lib/generate-agents.js:54-65`) construit exactement quatre champs :
`name`, `description`, `tools?`, `guardrails`. Le champ `skills:` de la persona canon
(ex. `library/personas/aragorn.md:8`) est **lu nulle part** et **n'apparaît dans aucun contrat**.
Vérifiable directement : `cli/test/fixtures/agents-golden/aragorn.md:7-12` ne contient aucune ligne
`skills:`.

**Fait 2 — Claude Code supporte pourtant nativement ce champ.** La doc officielle des subagents
documente un champ `skills` : *« Skills to preload into the subagent's context at startup. The full
skill content is injected, not only the description. »* Le canon iakaframe déclare l'information
correcte (`skills: [iakaframe-aragorn]`) et le générateur la **jette** au lieu de la projeter vers
le seul champ que le runner sait consommer.

**Fait 3 — les personas ne peuvent pas non plus invoquer une skill à la demande.** Toujours d'après
la doc officielle : *« To prevent a subagent from invoking skills entirely, omit `Skill` from the
tools list. »* Or **aucune assignation du binding ne contient `Skill`**
(`bindings/iakaframe-claude-default.md:8-15`) — et toutes ont une allowlist explicite, donc aucune
n'hérite de l'ensemble des outils.

> **Conclusion load-bearing.** Aujourd'hui : les personas ne **préchargent** aucune skill (fait 1)
> et ne peuvent en **invoquer** aucune (fait 3). Déployer des skills fraîches dans
> `~/.claude/skills/` ne rendrait donc **toujours pas** `iakaframe-jalon` actif pour un subagent.
> Un lot qui ne traiterait que la fraîcheur des copies **livrerait une dette réglée sur le papier et
> un runtime toujours muet**. Le lot doit traiter **projection + accès + parité**, dans cet ordre.

*(Le fait que la skill soit inerte pour les **subagents** n'empêche pas le thread principal —
Odin/Claude — d'invoquer une skill : lui n'a pas d'allowlist restrictive. C'est pourquoi la dette est
restée invisible : elle ne se manifeste que côté personas dispatchées.)*

## 1. Ce qui existe déjà (vérifié — ne pas réinventer)

Le backlog dit que les skills n'ont « ni générateur, ni golden, ni test de parité ». Exact pour le
golden et la parité. **Inexact pour le déploiement** : il existe déjà **deux** chemins de
déploiement de skills, et ils **divergent**.

| # | Chemin | Fichier | Ce qu'il déploie | Défaut |
|---|---|---|---|---|
| 1 | `affectPersona` / `fullteam` | `cli/src/lib/agents.js:101-107` | **UNE seule** skill, via `skillOfPersona()` (table codée en dur) | ignore le `skills:[]` de la persona |
| 2 | `switch` / `use` | `cli/src/commands/switch.js:81-84` | **TOUTES** les skills du frontmatter `persona.data.skills` | copie **brute** de la persona en contrat (`:79`) |

Trois anomalies en découlent, toutes vérifiables :

- **Anomalie A — la table codée en dur court-circuite le canon.** `SKILL_OF`
  (`cli/src/lib/agents.js:29-37`) + `SKILL_OVERRIDE_OF` (`:42-44`) sont une **seconde source de
  vérité** concurrente du frontmatter. Elle ne rend **qu'une skill par persona**. Conséquence
  directe et mesurable : `odin.md:8` déclare `skills: [iakaframe-odin, iakastart]` mais
  `SKILL_OF.portefeuille = 'iakaframe-odin'` → **`iakastart` n'est jamais déployée** par ce chemin.
  Idem `nathalie.md:8` : `iakaframe-memoire-humaine` jamais déployée. **C'est la cause mécanique
  d'une partie des 8 skills absentes.**

- **Anomalie B — `subskills` n'est résolu par aucun chemin de déploiement.**
  `library/skills/iakaframe-aragorn/SKILL.md:5` et
  `library/skills/iakaframe-cadrage/SKILL.md:5` déclarent `subskills: [iakaframe-jalon]`. Aucun des
  deux chemins ne lit `subskills`. Et le runtime ne peut pas le faire à notre place : `subskills`
  n'est **pas** un champ du standard, les runtimes conformes **ignorent les clés inconnues**. La
  résolution **doit** donc se faire **au déploiement**. → **cause exacte de l'absence de
  `iakaframe-jalon` en runtime**, constatée au backlog.

- **Anomalie C — `switch` déploie un contrat invalide.** `switch.js:79` fait
  `fs.copyFileSync(persona.path, …/agents/<id>.md)` : il copie la **persona canon brute**, avec son
  frontmatter persona (`id`, `roleKey`, `royaume`, `pastille`, `vignette`) qui n'est pas un contrat
  Claude Code valide. C'est **exactement le bug de cause racine** que le générateur avait corrigé
  pour `affectPersona` (cf. commentaire `cli/src/lib/agents.js:85-88`) — **`switch` n'a jamais été
  migré**. Régression latente, hors scope strict des skills mais dans le même code : à traiter ici
  ou à inscrire au backlog (§ 8).

## 2. ~~État mesuré de la dette~~ — ⛔ **CHIFFRES PÉRIMÉS, cf. § 14.1 et § 14.2**

> ⛔ **Le pool est passé de 23 à 24 skills** (création d'`iakaframe-fabrication` en phase 1) et
> l'union déployable a été **entièrement recalculée**. Les comptes de ce § et ceux du § 13.3
> (« union des 11 ») sont **caducs**. **Lire le § 14.2 avant d'exécuter.**

- ~~**23 skills**~~ → **24 skills** au canon (`library/skills/*/SKILL.md`), dont `iakaframe-jalon`.
- **15 skills** déployées (`~/.claude/skills/*/SKILL.md`) → **8 absentes**.
- `iakaframe-jalon` : **absente** du déployé → le geste livré en v0.17.14 **n'est pas actif**.
- Scorie canal : `Slack` subsiste dans le déployé —
  `~/.claude/skills/iakaframe-aragorn/SKILL.md` (5 occurrences) et
  `~/.claude/skills/iakaframe-odin/SKILL.md` (2 occurrences) — alors que le canon dit
  iakaHub ↔ Discord.

## 3. Périmètre

- **Dans le périmètre** : projeter `skills:` (+ `subskills` résolus) dans le contrat généré ; rendre
  les skills accessibles aux personas ; générateur de déploiement de skills piloté par le **canon** ;
  golden + `--check` anti-dérive ; verbe CLI ; résorption de la dette 22/22.
- **Hors périmètre** : réécrire le **contenu** des skills (les scories Slack **du canon** sont un
  item de backlog distinct) ; créer de nouvelles skills ; toucher au format du contrat d'agent
  au-delà de l'ajout de `skills:`.

## 4. Options structurantes (avec recommandation)

### 4.1 Comment une skill atteint une persona (décision la plus structurante)

| Option | Mécanisme | Analyse |
|---|---|---|
| **A** | **Préchargement** : émettre `skills: [...]` dans le contrat | Champ **natif** du runner ; contenu injecté au démarrage → skill **garantie** présente ; pas besoin de l'outil `Skill`. Coût : contexte consommé à chaque lancement. |
| B | **Invocation à la demande** : ajouter `Skill` aux `tools` du binding | Contexte économe, mais l'activation dépend d'une **décision du modèle** → un geste **obligatoire** comme le jalon ne peut pas en dépendre. |
| **A+B** | Les deux | Précharge l'essentiel, laisse la porte ouverte au reste. |

> **Recommandation : A+B**, avec une règle de partage nette :
> - `skills:` du contrat ← **skill(s) de rôle + subskills résolus** — ce qui est **constitutif** du
>   rôle et doit être présent sans condition (c'est le cas du jalon pour Aragorn/Gandalf) ;
> - `Skill` ajouté aux `tools` pour permettre l'invocation opportuniste du reste.
>
> Justification : la méthode qualifie le jalon d'**obligatoire**. Une obligation ne peut pas reposer
> sur l'option B seule, qui est probabiliste. Le préchargement est le seul mécanisme déterministe.

### 4.2 Source de vérité de la liste des skills

| Option | Analyse |
|---|---|
| Table codée `SKILL_OF`/`SKILL_OVERRIDE_OF` (statu quo) | Seconde vérité, mono-skill, déjà en dérive (anomalie A) |
| **Frontmatter `skills:` de la persona** | **Canon**, déjà multi-skills, déjà édité par `attach`/`detach` (`cli/src/commands/attach.js`), déjà lu par `switch.js:81` |

> **Recommandation : le frontmatter est la source unique.** Les tables codées deviennent au mieux un
> **repli** pour une persona sans `skills:`, au mieux **supprimées**. Le générateur ne doit **rien
> choisir** — exactement le principe déjà énoncé pour les personas
> (`cli/src/lib/generate-agents.js:8-10` : *« Il ne CHOISIT rien (pas de table codée) »*).

### 4.3 Forme du golden de skills

| Option | Analyse | Reco |
|---|---|---|
| Golden par skill (23 fichiers) | Byte-parité fine, mais 23 fichiers **dupliqués** du canon sans transformation → pure redondance | Écarté |
| **Golden de manifeste** (1 fichier) : pour chaque skill, `id` + `sha256` du `SKILL.md` canon + liste `subskills` ; pour chaque persona, la **liste résolue** des skills déployées | Fige ce qui compte — l'**inventaire** et la **résolution** — sans dupliquer le contenu | **Retenu** |

> Différence de nature à assumer : le contrat d'agent est un **rendu transformé** (d'où un golden
> byte-à-byte). Une skill est **copiée sans transformation** : il n'y a pas de rendu à figer, mais
> il y a une **résolution** (persona → skills → subskills) qui, elle, mérite pleinement un golden.

### 4.4 Verbe CLI

> **Recommandation : étendre le verbe existant plutôt que d'en créer un.**
> `iakaframe agents generate [--check] [--global]` sait déjà générer/vérifier les contrats
> (`cli/src/commands/agents.js:60-101`). On ajoute :
> - `iakaframe skills deploy [--check] [--global] [--project <p>] [--json]`
>
> Le sous-verbe `skills` est cohérent avec le nommage **par geste** (mémoire
> `iakaframe-skills-nommees-par-geste`) : `deploy` est le geste, `--check` son contrôle.
> `--check` reprend **à l'identique** la sémantique éprouvée de `agents generate --check`
> (`agents.js:76-93`) : n'écrit rien, statue `ok`/`drift`/`absent`, **exit non-zéro** si dérive.

## 5. Spécification fermée

### 5.1 Résolution des skills d'une persona (algorithme, déterministe)

```
resolveSkills(personaId) :
  1. base    ← frontmatter `skills:` de library/personas/<id>.md   (ordre préservé)
  2. pour chaque s de base, dans l'ordre :
       lire library/skills/<s>/SKILL.md
       sub ← frontmatter `subskills:` (défaut [])
       émettre s, puis chaque élément de sub
  3. dédoublonner en conservant la PREMIÈRE occurrence
  4. profondeur : UN SEUL niveau de subskills (pas de récursion transitive au MVP)
  5. une skill référencée mais absente de library/skills/ ⇒ ERREUR (jamais un skip silencieux)
```

Ordre et dédoublonnage sont **normatifs** : ils conditionnent la stabilité du golden.

Contrôle attendu sur l'état actuel :

| Persona | `skills:` canon | Résolu attendu |
|---|---|---|
| aragorn | `[iakaframe-aragorn]` | `iakaframe-aragorn`, **`iakaframe-jalon`** |
| gandalf | `[iakaframe-cadrage]` | `iakaframe-cadrage`, **`iakaframe-jalon`** |
| odin | `[iakaframe-odin, iakastart]` | `iakaframe-odin`, `iakastart` |
| nathalie | `[iakaframe-nathalie, iakaframe-memoire-humaine]` | les deux |
| gimli | `[]` | **aucune** (voir § 7.2) |
| legolas / helm / loki | 1 skill chacun | la skill, + subskills éventuels |

### 5.2 Projection dans le contrat d'agent

`renderAgentContract` (`cli/src/lib/generate-agents.js:54-65`) émet un champ `skills` **après
`tools` et avant `guardrails`**, en **flow-list** (`skills: [a, b]`), **omis si vide** — exactement
la règle déjà appliquée à `tools` (`:61`).

> ⚠️ **Ceci modifie le rendu du contrat → les 8 goldens changent → re-vendorage GUI obligatoire.**
> C'est le point de contact avec le critère de « fini » (§ 6). À anticiper dès le premier commit.

### 5.3 Accès à l'outil `Skill`

`Skill` est ajouté aux `tools` des assignations du binding (§ 4.1 option B).
**⚠️ Modifie `bindings/iakaframe-claude-default.md` → même conséquence qu'en 5.2**, plus une
**mise à jour obligatoire du test GUI** `parite-generateurs.test.ts:146-157`, qui assert en dur les
tools de `gandalf`, `gimli` et **`odin`** (`:153`). Cet ajout est **subordonné à l'arbitrage du
décideur** (§ 7.1) : il élargit une allowlist least-privilege.

### 5.4 Déploiement

- **Cible** : `<target>/.claude/skills/<skill-id>/` — `--global` → `~/.claude`, sinon `<project>`
  (même résolution que `agents.js:66`).
- **Contenu** : copie **récursive et fidèle** du dossier `library/skills/<id>/` (les skills peuvent
  porter des fichiers annexes ; ne jamais copier le seul `SKILL.md`).
- **Ensemble déployé** = union des `resolveSkills(p)` pour toute persona `p` de la cible.
- **Contrainte du runner à respecter** : le nom du dossier déployé **détermine** la commande
  d'invocation (`/nom-du-dossier`) ; il **doit** rester égal à l'id canon. Aucun renommage.
- **Skills orphelines** : une skill présente dans la cible mais dans aucune résolution est
  **signalée** (`status: "orphan"`), **jamais supprimée** d'office (une suppression est un geste
  `−` explicite, cf. § 7.4).

### 5.5 Unification des deux chemins

`switch.js:81-84` et `agents.js:101-107` appellent **la même** fonction `resolveSkills` + le même
déployeur. La table `SKILL_OF`/`SKILL_OVERRIDE_OF` n'est plus consultée pour le déploiement.

### 5.6 Golden de manifeste

`cli/test/fixtures/skills-golden/manifest.json` (ou `.md` à en-tête de provenance, au choix de
l'exécutant, mais **une** forme), produit par un script **unique** sur le modèle de
`cli/scripts/gen-agents-golden.mjs`, contenant :

- inventaire : pour chaque skill canon → `id`, `sha256` du `SKILL.md`, `subskills` déclarés ;
- résolution : pour chaque persona → liste **ordonnée** des skills résolues ;
- compteurs : nombre de skills, nombre de personas.

Un test `cli/test/parite-skills.test.js` compare le manifeste **régénéré à la volée** au golden figé.

## 6. Critère de « fini » (celui qui a coûté un cycle au lot précédent)

> **Rappel non négociable — ce lot le déclenche à coup sûr (§ 5.2, et § 5.3 si arbitré).**
> Tout changement touchant une persona ou le binding impose, **dans le même lot** :
> 1. `node cli/scripts/gen-agents-golden.mjs` — régénérer les **8** goldens ;
> 2. `iakaframe agents generate --global` puis `--check` (doit sortir 0) — régénérer le déployé ;
> 3. **re-vendorer côté GUI** : `cp cli/test/fixtures/agents-golden/*.md
>    ../iakaFrameGUI/packages/core/__tests__/fixtures/agents-golden/` **+** les personas et le
>    binding s'ils ont bougé ;
> 4. rejouer **les deux** suites (CLI `node --test` **et** GUI `npm run test`) ;
> 5. **si § 5.3 est retenu** : mettre à jour `parite-generateurs.test.ts:146-157` (assertions de
>    tools en dur, dont `odin` en `:153`) — sinon la GUI casse.
>
> Le lot ajoute une étape permanente : **régénérer le golden de skills** après toute modification
> d'un `skills:` de persona ou d'un `subskills:` de skill.

## 7. Points que SEUL le décideur tranche

1. **Ajoute-t-on `Skill` aux `tools` du binding (§ 5.3) ?** Élargit une allowlist volontairement
   least-privilege (`bindings/iakaframe-claude-default.md:24-27`). *Reco Gandalf : oui, couplé au
   préchargement* — le préchargement seul fige les skills au démarrage, sans possibilité de recours
   à une skill non prévue. **À trancher persona par persona ou globalement.**
2. **Déprécie-t-on `SKILL_OF`/`SKILL_OVERRIDE_OF` (§ 4.2) ?** Suppression franche, ou conservation en
   repli avec une garde interdisant la divergence avec le canon ? *Reco Gandalf : suppression* —
   toute seconde source de vérité re-dérivera.
3. **Gimli reste-t-il sans skill ?** `gimli.md:8` = `skills: []`, revendiqué comme un choix
   (« porté par le `CLAUDE.md` du projet », `gimli.md:16`). *Point traité au fond dans l'instruction
   `audit-amelioration-roster-personas.md` (§ Gimli)* — mentionné ici pour cohérence, tranché là-bas.
4. **Symétrie `+`/`−`** (mémoire `iakaframe-symetrie-ajout-suppression`) : `skills deploy` doit-il
   avoir un pendant `--prune` supprimant les orphelines ? *Reco Gandalf : signaler, ne pas
   supprimer* au MVP (§ 5.4).
5. **Profondeur des subskills** : un seul niveau (§ 5.1 pt 4) ou récursion transitive ?
   *Reco Gandalf : un niveau* — aucun cas réel à 2 niveaux dans la bibliothèque actuelle ; la
   récursion appellerait une détection de cycles pour un besoin inexistant.

## 8. Réserve à arbitrer sur le scope

L'**anomalie C** (`switch.js:79` déploie la persona brute au lieu du contrat généré) est un **bug
réel et indépendant** des skills, mais situé dans les lignes mêmes que ce lot modifie. Deux voies :
**(i)** le corriger ici (le générateur est déjà importé dans le module voisin, coût marginal ~0,25 j),
ou **(ii)** l'inscrire au backlog comme lot distinct. *Reco Gandalf : (i)* — laisser un chemin de
déploiement produire un contrat invalide juste à côté d'un lot qui refait le déploiement serait
incohérent. **Décision décideur** (c'est une extension de périmètre).

## 9. Critères d'acceptation (testables)

| # | Critère | Vérification |
|---|---|---|
| B1 | `resolveSkills('aragorn')` == `['iakaframe-aragorn','iakaframe-jalon']` | test unitaire |
| B2 | `resolveSkills('odin')` == `['iakaframe-odin','iakastart']` | test unitaire (non-régression anomalie A) |
| B3 | `resolveSkills('nathalie')` contient `iakaframe-memoire-humaine` | test unitaire |
| B4 | Skill référencée mais inexistante ⇒ erreur explicite | test unitaire |
| B5 | Dédoublonnage : une skill atteinte 2× n'apparaît qu'une fois, 1ʳᵉ position | test unitaire |
| B6 | Le contrat généré porte `skills: [...]` après `tools`, avant `guardrails` | golden d'agent régénéré |
| B7 | Persona à `skills: []` (gimli) ⇒ **aucune** ligne `skills:` | golden `gimli.md` |
| B8 | `skills deploy --global` déploie **23** skills résolues, `iakaframe-jalon` **incluse** | `ls ~/.claude/skills/` ; `--json` : `count` |
| B9 | Copie récursive fidèle (fichiers annexes inclus) | diff dossier canon ↔ déployé |
| B10 | `skills deploy --check` sort **0** quand tout est à jour | exit code |
| B11 | Altérer une skill déployée ⇒ `--check` sort **1**, la skill est nommée `drift` | exit code + `--json` |
| B12 | Supprimer une skill déployée ⇒ `--check` sort **1**, statut `absent` | idem |
| B13 | Skill déployée hors résolution ⇒ statut `orphan`, **jamais supprimée** | `--json` + FS inchangé |
| B14 | Golden de skills : régénéré == figé | `cli/test/parite-skills.test.js` |
| B15 | Modifier un `subskills:` sans régénérer le golden ⇒ **rouge** | anti-dérive |
| B16 | **Dette résorbée** : 0 périmée, 0 absente (22/22 → 0/23) | `skills deploy --global` puis `--check` = 0 |
| B17 | Plus aucune occurrence « Slack » dans le déployé | `grep -ri slack ~/.claude/skills/` = 0 *(suppose le canon purgé — sinon B17 documente le reliquat)* |
| B18 | Les deux chemins (`fullteam`, `switch`) produisent le **même** ensemble de skills | test comparatif |
| B19 | Suites CLI **et** GUI vertes après re-vendorage | § 6 |
| B20 | `docs/commandes.md` documente le verbe | mémoire `iakaframe-doc-commandes-a-jour` |
| B21 | **Recette humaine** : dans une session Claude Code, un subagent (ex. Gandalf) a bien le jalon préchargé | gate humain — Legolas ne valide pas le runtime du runner |

> **B21 est le critère de recette réel du lot.** B1-B20 prouvent la mécanique ; seul B21 prouve que
> le geste de jalon est **effectivement actif**, ce qui était l'objectif de départ.

## 10. Estimation (jalon P1→P2)

- **Charge** : **~2,5 à 3 jours-homme**
  - 0,5 j — `resolveSkills` + tests unitaires (B1-B5)
  - 0,5 j — projection `skills:` dans le contrat + régénération goldens + **re-vendorage GUI**
  - 0,75 j — déployeur + verbe `skills deploy [--check]` + C-JSON
  - 0,5 j — golden de manifeste + test de parité
  - 0,25 j — unification des deux chemins
  - 0,25 j — doc (`docs/commandes.md`, `library/skills/README.md`) + gate
  - *(+0,25 j si l'anomalie C est incluse, § 8)*
- **Complexité** : **moyenne**. La mécanique est simple ; ce qui coûte est l'**effet de bord sur le
  contrat d'agent** (§ 5.2), qui propage sur 8 goldens + 17 fixtures vendorées + les assertions en
  dur du test GUI.
- **Risque** : **moyen-haut** — c'est le seul des trois lots qui **modifie le format du contrat
  d'agent**. Risque principal : casser la parité GUI en oubliant une étape du § 6. **Mitigation
  forte : livrer d'abord `garde-vendor-check-cross-repo.md`**, qui rend cet oubli mécaniquement
  détectable. → **dépendance d'ordonnancement recommandée.**
- **Inconnues** :
  - **le `skills:` du contrat est-il honoré pour un subagent défini en `~/.claude/agents/` ?** Le
    champ est documenté ; son comportement exact avec nos personas doit être **vérifié en recette
    (B21)** avant de considérer le lot fini. C'est l'inconnue principale.
  - version minimale de Claude Code exigée par le champ `skills:` — à confirmer sur la machine cible.
  - coût en contexte du préchargement (le contenu **entier** est injecté) : si une skill volumineuse
    pèse trop, arbitrer skill par skill entre préchargement (A) et invocation (B).

## 11. Fichiers de référence

- `cli/src/lib/generate-agents.js:54-65` — `renderAgentContract`, à étendre (fait 1)
- `cli/src/lib/agents.js:29-52,101-107` — table codée + chemin de déploiement n°1 (anomalie A)
- `cli/src/commands/switch.js:79,81-84` — chemin n°2 (anomalies B et C)
- `cli/src/commands/agents.js:60-101` — patron `generate [--check]` **à copier**
- `cli/scripts/gen-agents-golden.mjs` — patron du producteur de golden
- `bindings/iakaframe-claude-default.md:8-15` — allowlists sans `Skill` (fait 3)
- `library/skills/iakaframe-aragorn/SKILL.md:5`, `library/skills/iakaframe-cadrage/SKILL.md:5` — `subskills`
- `library/skills/iakaframe-jalon/SKILL.md` — la skill absente du runtime
- `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:146-157` — assertions de tools en dur

## 12. Sources (faits externes vérifiés — load-bearing)

- Claude Code — Extend Claude with skills (emplacement `~/.claude/skills/<name>/SKILL.md`, le nom du
  **dossier** fait la commande, champs de frontmatter) : https://code.claude.com/docs/en/skills
- Claude Code — Create custom subagents (champ `skills` de préchargement ; omettre `Skill` des
  `tools` empêche toute invocation) : https://code.claude.com/docs/en/sub-agents
- Agent Skills — vue d'ensemble du standard (clés inconnues ignorées par les runtimes conformes,
  d'où la nécessité de résoudre `subskills` au déploiement) :
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

---

## 13. Note additive — arbitrages du décideur (2026-07-19)

> Ajout **postérieur** à l'analyse ci-dessus, qui reste inchangée. Cette note consigne les décisions
> prises sur les points « que SEUL le décideur tranche » (§ 7) et sur la réserve de scope (§ 8).

### 13.1 `Skill` dans les `tools` du binding (§ 7 pt 1) : **ACCORDÉ**

L'élargissement de l'allowlist least-privilege est **assumé par le décideur** : c'est ce qui rend les
skills réellement invocables. Le § 5.3 passe donc de « subordonné à arbitrage » à **retenu**.

**Portée technique — tranchée : `Skill` est accordé aux 8 personas, sans exception.**

La question posée était : tous, ou seulement ceux qui déclarent des `skills:` ? Je tranche pour
**tous**, et le motif est que la seconde option est la **pire des deux** :

- `skills:` (préchargement) et `Skill` (accessibilité) répondent à **deux besoins distincts** : le
  premier garantit ce qui est **constitutif** du rôle, le second ouvre l'**opportuniste**.
- Restreindre `Skill` aux personas qui déclarent déjà des `skills:` reviendrait à ne l'accorder qu'à
  ceux **déjà couverts par le préchargement** — donc à n'apporter presque rien — tout en **excluant
  la seule persona qui n'a aucun autre accès** : **Gimli** (`gimli.md:8`, `skills: []`). Gimli
  serait le seul agent du roster totalement coupé de la bibliothèque de skills.
- `Skill` **n'est pas un credential** : il ne donne accès qu'aux skills **déjà déployées** dans
  `.claude/skills/`, périmètre que nous contrôlons entièrement via `skills deploy` (§ 5.4). La
  surface réelle reste bornée par ce que nous déployons.
- Le `perimeter-guard` opère sur `Edit|Write|Bash|NotebookEdit` : accorder `Skill` **ne desserre
  aucun garde-fou de périmètre**.
- Cela rend le roster **indépendant de l'arbitrage CH-D** (skill dédiée pour Gimli, cf.
  `audit-amelioration-roster-personas.md` § 7 pt 4) : quel que soit son issue, l'accès est en place.

**Conséquence directe sur les critères de « fini » (§ 6) — plus lourde qu'annoncée au § 5.3.**
`Skill` étant ajouté aux **8** assignations, la ligne `tools:` change dans les **8** contrats → **les
8 goldens changent** et les **17 fixtures vendorées** doivent être resynchronisées. Surtout, le test
GUI `~/work/iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts` assert des tools **en
dur** en **quatre** endroits, pas un seul :

| Ligne | Assertion | Impact |
|---|---|---|
| `:147-149` | `toolsForPersona(binding,"gandalf")` == liste exacte | à mettre à jour |
| `:150-152` | `toolsForPersona(binding,"gimli")` == liste exacte | à mettre à jour |
| `:153` | `toolsForPersona(binding,"odin")` == liste exacte | à mettre à jour |
| `:154-156` | regex `^tools: Read, Edit, Write, Bash, Grep, Glob$` (rendu gimli) | à mettre à jour |

> **Sans ces quatre mises à jour, la suite GUI casse.** C'est un **critère de « fini »**, pas un
> effet de bord à découvrir en cours de route.

**Position de `Skill` dans la liste** : à fixer par l'exécutant, mais **identique pour les 8** et
**stable** — l'ordre est rendu verbatim dans le contrat (`generate-agents.js:61`), donc tout
flottement produirait un diff de golden gratuit. *Reco : en fin de liste, après les outils existants.*

### 13.2 `switch.js:79` — persona brute déployée (§ 8) : **INTÉGRÉ À CE LOT**

Pas de backlog séparé. L'anomalie C est traitée **ici** : `switch.js:79` doit déployer le **contrat
généré** (`generateAgent`), comme le fait déjà `affectPersona` (`cli/src/lib/agents.js:92`), et non
plus `fs.copyFileSync(persona.path, …)`.

**Critères d'acceptation ajoutés :**

| # | Critère | Vérification |
|---|---|---|
| B22 | `switch`/`use` déploie un **contrat valide** (frontmatter `name`/`description`/`tools`/`guardrails`), jamais la persona brute | le fichier produit dans `.claude/agents/<id>.md` est **byte-identique** à celui produit par `agents generate` |
| B23 | `switch` et `fullteam` produisent des contrats **identiques** pour une même persona | test comparatif (complète B18 qui ne portait que sur les skills) |
| B24 | Aucun champ persona-only (`roleKey`, `royaume`, `pastille`, `vignette`) ne subsiste dans un contrat déployé par `switch` | grep sur la sortie |

**Impact sur l'estimation (§ 10) :** la charge passe de **~2,5-3 j-h** à **~2,75-3,25 j-h**, soit
**+0,25 j-h (~+8 %)**. La correction est peu coûteuse parce que `generateAgent` est déjà importé dans
le module voisin et que `switch.js` charge déjà la persona ; l'essentiel du surcoût est le test B23.
**La complexité et le niveau de risque du lot sont inchangés** — le lot était déjà « moyen-haut » du
fait de la modification du format de contrat, et cette correction va dans le sens d'une
**convergence** des deux chemins de déploiement, donc réduit la dette plutôt qu'elle ne l'augmente.

### 13.3 ~~Périmètre de déploiement : l'UNION DES 11, pas les 23~~ — ⛔ **RECALCULÉ : l'union vaut 17 (transitive) ou 14 (profondeur 1), cf. § 14.2**

> ⛔ **Chiffres et liste périmés, conservés pour trace.** La **règle** posée ici (« ensemble déployé
> = union des `resolveSkills(p)` ») est **inchangée et toujours en vigueur** — seules ses **valeurs**
> ont bougé, le canon ayant changé en phase 1. Le « 11 » de ce § ne désigne plus rien d'actuel :
> **ne pas le citer sans lire le § 14.2.**

> **Contradiction normative corrigée.** Le § 5.4 posait « ensemble déployé = union des
> `resolveSkills(p)` » — c'est **la règle**, elle est juste. Mais B8 (§ 9) exigeait « déploie **23**
> skills » et B16 « 0/**23** », deux chiffres **incompatibles** avec elle. La règle prime ; les
> chiffres étaient faux.

**L'union réelle vaut 11** (vérifiée au gate) :

`iakaframe-odin` · `iakastart` · `iakaframe-aragorn` · `iakaframe-jalon` · `iakaframe-cadrage` ·
`iakaframe-nathalie` · `iakaframe-memoire-humaine` · `iakaframe-appflowy-doc` · `iakaframe-qualite` ·
`iakaframe-deploiement` · `iakaframe-naonedge`

**Écarts réels contre les 15 actuellement déployées** — la dette n'est pas « 8 absentes » :

| Écart | Compte | Détail |
|---|---|---|
| **Manquantes** (dans l'union, non déployées) | **2** | `iakaframe-jalon`, `iakaframe-memoire-humaine` |
| **Orphelines** (déployées, hors union) | **6** | `iakaframe-docker`, `-etat-des-lieux`, `-forgejo`, `-init`, `-log-conversation`, `-update` |
| Conformes | 9 | — |

**Arbitrage du décideur — les 6 orphelines ne seront PAS déployées.** Ce n'est **pas un oubli, c'est
le périmètre** : aucune persona ne les déclare, donc `resolveSkills` ne les atteint pas.

> **Conséquence à assumer explicitement** : ces 6 skills **restent présentes au canon**
> (`library/skills/`) et **pleinement accessibles au CLI** — elles ne sont ni supprimées, ni
> dépréciées. Elles ne sont simplement **pas projetées dans le runtime des personas**. Pour qu'une
> d'elles le devienne, il faut **qu'une persona la déclare** dans son `skills:` (geste `attach`,
> `cli/src/commands/attach.js`) — c'est le seul chemin, et c'est voulu : le frontmatter est la
> source unique (§ 4.2).

**B8 et B16 sont réécrits** (les versions du § 9 sont **caduques**) :

| # | Critère révisé | Vérification |
|---|---|---|
| **B8** | `skills deploy --global` déploie **exactement les 11 skills de l'union**, `iakaframe-jalon` **incluse** | `--json` : `count == 11` ; la liste correspond à l'union |
| **B16** | **Dette résorbée** : **0 manquante** sur les 11 ; les **6 orphelines** sont **signalées** (`orphan`) et **conservées** | `skills deploy --check` sort **0** ; `--json` liste 6 `orphan` |

> **B13 (orphelines signalées, jamais supprimées) devient donc un critère central**, pas un cas
> limite : il porte 6 skills réelles. Le comportement `--json` doit les distinguer sans ambiguïté
> d'une erreur.

### 13.4 B17 — restreint à Aragorn (levée B-5b du gate Legolas)

B17 exigeait `grep -ri slack ~/.claude/skills/` **= 0**. **Non tenable** : le **canon d'Odin** porte
encore Slack (`library/skills/iakaframe-odin/SKILL.md:55,64`) et le § 3 place explicitement la purge
du **contenu** des skills **hors périmètre**. Déployer un canon non purgé produirait mécaniquement
**2 occurrences** — B17 échouerait sur un défaut que le lot n'a pas le droit de corriger.

**Tranché : B17 est restreint à Aragorn**, dont le canon **est** propre.

| # | Critère révisé | Vérification |
|---|---|---|
| **B17** | Plus aucune occurrence « Slack » dans **`~/.claude/skills/iakaframe-aragorn/`** (les 5 occurrences déployées sont purgées par le redéploiement depuis un canon propre) | `grep -ri slack ~/.claude/skills/iakaframe-aragorn/` = **0** |

> **Reliquat assumé et tracé** : les **2 occurrences** de `iakaframe-odin` subsisteront après le lot.
> Elles relèvent de l'item de backlog **« Scories Slack résiduelles »** (`BACKLOG.md:10`), pas de
> celui-ci. **Je ne tire pas la purge du canon d'Odin dans le lot 2** : elle appartient à un lot
> rédactionnel qui touchera aussi `README.md`, `library/skills/README.md` et la vitrine HTML — les
> disperser ferait perdre la cohérence de ce lot-là.

### 13.5 Angle mort — `DEFAULT_SKILLS` est une **troisième** table (levée du gate Legolas)

**Non vu par mes trois instructions.** Le § 4.2 condamne les tables codées concurrentes du
frontmatter et prévoit la suppression de `SKILL_OF`/`SKILL_OVERRIDE_OF` côté CLI. Mais
`~/work/iakaFrameGUI/packages/core/src/roster.ts:27-35` porte **`DEFAULT_SKILLS`**, une **troisième**
table skill-par-rôle, **mono-skill**, côté GUI.

> **Supprimer `SKILL_OF` sans la traiter reviendrait à déplacer la seconde source de vérité d'un
> dépôt à l'autre** — exactement ce que le § 4.2 interdit. La levée est fondée.

**Elle est DÉJÀ divergente du canon**, sur les deux personas multi-skills :

| Rôle | `DEFAULT_SKILLS` (`roster.ts:27-35`) | Canon | Écart |
|---|---|---|---|
| `portefeuille` | `["iakaframe-odin"]` | `odin.md:8` = `[iakaframe-odin, iakastart]` | **`iakastart` manquante** |
| `doc` | `["iakaframe-nathalie"]` | `nathalie.md:8` = `[iakaframe-nathalie, iakaframe-memoire-humaine]` | **`memoire-humaine` manquante** |

C'est **la même cause racine** que l'anomalie A côté CLI (§ 1), dans l'autre dépôt.

**Nuance de statut à respecter** : `DEFAULT_SKILLS` n'est **pas** un chemin de déploiement — c'est un
**gabarit de départ éditable** pour une nouvelle team (`roster.ts:2-8`, AR-5). Sa divergence n'a donc
pas la même gravité opérationnelle. Deux traitements possibles :

| Option | Analyse | Reco |
|---|---|---|
| **A** — aligner sur le canon + **garde de parité** contre les personas vendorées | Supprime la divergence et **empêche** sa réapparition. Le vecteur existe déjà : les 8 personas sont vendorées côté GUI | **Retenu** |
| B — documenter `DEFAULT_SKILLS` comme gabarit délibérément non exhaustif | Honnête, coût nul, mais laisse une table qui **dit faux** sur deux rôles | Écarté |

**Critères ajoutés :**

| # | Critère | Vérification |
|---|---|---|
| **B25** | `DEFAULT_SKILLS` est aligné sur le `skills:` des personas canon (multi-skills inclus) | `portefeuille` → 2 entrées ; `doc` → 2 entrées |
| **B26** | Une **garde de parité** compare `DEFAULT_SKILLS` aux personas **vendorées** ; divergence ⇒ **test rouge** | modifier un `skills:` sans la table ⇒ rouge |
| **B27** | `DEFAULT_SKILLS` couvre le rôle `deploiement` | **dépend du lot 3** — cf. encadré |

> ⚠️ **Couplage lot 2 ↔ lot 3 sur le même fichier.** `roster.ts` est modifié par **les deux** lots :
> ici pour `DEFAULT_SKILLS`, au lot 3 pour l'ajout du rôle `deploiement` (§ 13.5/13.8 de
> l'instruction roster). **B27 n'est atteignable qu'après le lot 3.** Deux options : porter B27 au
> lot 3, ou l'acter comme **critère différé** de ce lot. *Reco Gandalf : le porter au lot 3*, qui est
> le lot propriétaire du rôle — et le signaler ici pour qu'il ne se perde pas.

### 13.6 ~~Profondeur des subskills — décision maintenue~~ — ⛔ **B28 SUSPENDU : son motif est mort avec le lot Gimli, cf. § 14.3**

> ⛔ **Ne pas implémenter B28 tel qu'écrit ci-dessous.** Le motif de ce § — *« aucune chaîne
> atteignable depuis une persona ne dépasse 1 niveau »* — était exact à sa rédaction et est
> **factuellement faux depuis le lot Gimli** : `gimli → fabrication → gestion-de-source → git →
> forgejo` est une chaîne de **profondeur 3 atteignable depuis le roster**. Appliqué tel quel, B28
> **ferait échouer la résolution sur le canon en vigueur**. Ré-arbitrage requis : **§ 14.3**.

Le § 5.1 (pt 4) limite la résolution à **un niveau** en affirmant qu'« aucun cas réel à 2 niveaux »
n'existe. **C'est faux** : la bibliothèque porte une chaîne à **3 niveaux** —
`iakaframe-init` → `iakaframe-gestion-de-source` → `iakaframe-git` → `iakaframe-forgejo`.

**La décision reste bonne ; le motif était mauvais.** Le motif correct :

> **Aucune chaîne atteignable depuis une persona ne dépasse 1 niveau.** Les trois seules relations
> `subskills` traversées par l'union des 11 sont `aragorn→jalon`, `cadrage→jalon` et
> `memoire-humaine→appflowy-doc` — toutes de profondeur 1. La chaîne profonde part de
> `iakaframe-init`, qui est **une des 6 orphelines** (§ 13.3) : elle n'est **atteignable par aucune
> persona**, donc jamais résolue.

> ⚠️ **Mais cela rend la limite fragile** : le jour où une persona déclarerait `iakaframe-init`, la
> résolution à profondeur 1 **tronquerait silencieusement** `git` et `forgejo`. **Critère ajouté :**

| # | Critère | Vérification |
|---|---|---|
| **B28** | Une chaîne `subskills` de profondeur **> 1** atteignable depuis une persona ⇒ **erreur explicite**, jamais une troncature silencieuse | test : attacher temporairement `iakaframe-init` à une persona ⇒ `resolveSkills` **échoue** avec un message nommant la chaîne |

> B28 transforme une limite implicite en **garde active**. Sans lui, la profondeur 1 est un piège
> différé ; avec lui, c'est une contrainte tenue.

### 13.7 § 5.1 — table de contrôle corrigée (nathalie a **trois** skills résolues)

La table du § 5.1 sous-estimait Nathalie : `iakaframe-memoire-humaine/SKILL.md:6` déclare
`subskills: [iakaframe-appflowy-doc]`. Résolution attendue **corrigée** :

| Persona | `skills:` canon | Résolu attendu (**révisé**) |
|---|---|---|
| nathalie | `[iakaframe-nathalie, iakaframe-memoire-humaine]` | `iakaframe-nathalie`, `iakaframe-memoire-humaine`, **`iakaframe-appflowy-doc`** (**3**) |

**Critère B3 révisé** : `resolveSkills('nathalie')` renvoie **3** entrées, dans cet ordre — et non 2.

### 13.8 Opportunité d'ordonnancement (information, pas un ré-arbitrage)

L'ordre **1 → 2 → 3** est retenu par le décideur. Je signale néanmoins un fait pour information :
**ce lot (2) et CH-B du lot 3 modifient tous deux `bindings/iakaframe-claude-default.md`**, et
déclenchent donc **deux fois** le même cycle complet (8 goldens + déployé + 17 fixtures + 2 suites +
les 4 assertions GUI ci-dessus). Embarquer l'ajout de `Task` pour Odin dans ce lot-ci **économiserait
un cycle entier**. Ce n'est **pas** une demande de modification de l'ordre — le découpage actuel a
l'avantage de garder un lot = un sujet. **À l'appréciation du coordinateur.**

---

## 14. Note additive de RAFRAÎCHISSEMENT — phase 2 (2026-07-20)

> Rédigée après la clôture de la **phase 1** (v0.18.0, merge `e79caee`). Cette note **corrige des
> faits périmés** et **invalide deux chiffrages** des §§ 1-13 ; en cas de contradiction, **elle
> prime**. Tous les constats ont été **recalculés sur le disque** avant rédaction
> (`preuve-avant-declaration`) — rien n'est repris des notes antérieures.

### 14.1 Ce que la phase 1 a changé sous cette instruction

| Fait | Avant | **Aujourd'hui (vérifié)** |
|---|---|---|
| Pool de skills | 23 | **24** — création d'`iakaframe-fabrication` (lot Gimli, `c3d8ca4`) |
| `gimli.md` frontmatter | `skills: []` | **`skills: [iakaframe-fabrication]`** — Gimli n'est plus l'agent sans skill |
| `iakaframe-fabrication` | n'existait pas | skill **composée**, `layer: capacity`, **`subskills: [iakaframe-gestion-de-source, iakaframe-conteneurisation, iakaframe-jalon]`** |
| `iakaframe-odin` | pas de `subskills` | **`subskills: [iakastart]`** |
| Binding | ni `Task` pour Odin, ni `Write` pour Helm | **`Task` accordé à Odin**, **`Write` accordé à Helm** (CH-B et CH-C soldés en phase 1) |

**Ce qui n'a PAS changé — les trois faits qui fondent le lot restent vrais**, revérifiés :
`renderAgentContract` ne projette toujours que `name`, `description`, `tools?`, `guardrails` (pas
`skills:`) ; **aucune** assignation du binding ne porte `Skill` ; `switch` copie toujours la persona
brute. **La couche skills demeure structurellement inerte.** Le § 0 est intégralement valide.

> ⚠️ **Le lot Gimli a donc livré une skill que rien n'active.** C'était connu et assumé au gate
> (réserve consignée), mais cela **augmente l'enjeu** de ce lot : il ne s'agit plus seulement de
> réveiller `iakaframe-jalon`, mais aussi `iakaframe-fabrication` et ses trois briques.

### 14.2 L'arbitrage « union des 11 » est **CADUC** — recalcul intégral

> ⛔ **Le § 13.3 est périmé dans ses CHIFFRES et dans sa LISTE.** Sa **règle** (« ensemble déployé =
> union des `resolveSkills(p)` ») reste juste et non discutée — c'est elle qui prime, exactement
> comme au § 13.3. Ce sont les nombres qui ont bougé, parce que le canon a bougé.

**Entrées du calcul (relevées au frontmatter, 2026-07-20) :**

- personas → `skills:` — odin `[iakaframe-odin, iakastart]` · aragorn `[iakaframe-aragorn]` ·
  gandalf `[iakaframe-cadrage]` · **gimli `[iakaframe-fabrication]`** · legolas `[iakaframe-qualite]` ·
  helm `[iakaframe-deploiement]` · loki `[iakaframe-naonedge]` ·
  nathalie `[iakaframe-nathalie, iakaframe-memoire-humaine]`
- relations `subskills:` traversées — `odin→iakastart` · `aragorn→jalon` · `cadrage→jalon` ·
  **`fabrication→{gestion-de-source, conteneurisation, jalon}`** · `memoire-humaine→appflowy-doc` ·
  `gestion-de-source→git` · `git→forgejo` · `conteneurisation→docker`

**Résultat — deux valeurs, selon la profondeur retenue :**

| Profondeur | Taille de l'union | Skills |
|---|---|---|
| **1 niveau** (règle actuelle du § 5.1 pt 4) | **14** | odin · iakastart · aragorn · jalon · cadrage · fabrication · gestion-de-source · conteneurisation · qualite · deploiement · naonedge · nathalie · memoire-humaine · appflowy-doc |
| **Transitive** | **17** | les 14 ci-dessus **+ git + forgejo + docker** |

**Ni 11, ni 23.** L'union a **grossi de 3 à 6 entrées** du seul fait du lot Gimli.

**Écarts réels contre les 15 skills actuellement déployées** (`~/.claude/skills/`, relevé direct) :

| | Profondeur 1 (union 14) | **Transitive (union 17)** |
|---|---|---|
| **Manquantes** | **5** — jalon, fabrication, gestion-de-source, conteneurisation, memoire-humaine | **6** — les 5 mêmes **+ git** *(`forgejo` et `docker`, bien qu'entrant dans l'union transitive, sont **déjà déployées** : elles ne creusent pas l'écart)* |
| **Orphelines** (déployées, hors union) | **6** — forgejo, docker, etat-des-lieux, log-conversation, update, init | **4** — etat-des-lieux, log-conversation, update, init |
| Conformes | 9 | **11** |

> **Coïncidence à ne pas relire de travers** : le « 11 » réapparaît, mais il ne désigne **plus du
> tout** la même chose. Au § 13.3 il nommait **la taille de l'union** ; ici il nomme le **nombre de
> skills déjà conformes**. Toute citation du « 11 » sans cette précision est un contresens.

**Les 7 skills hors union (transitive)** — `etat-des-lieux`, `learning`, `retrait`, `update`,
`init`, `journal-conversation`, `log-conversation` — **restent au canon et accessibles au CLI**,
simplement non projetées dans le runtime des personas. La doctrine du § 13.3 (ne pas les déployer,
les **signaler** sans jamais les supprimer) est **intégralement reconduite**.

**B8 et B16 sont réécrits une seconde fois** (les versions du § 9 **et** celles du § 13.3 sont
caduques) :

| # | Critère (**version en vigueur**) | Vérification |
|---|---|---|
| **B8** | `skills deploy --global` déploie **exactement l'union résolue**, `iakaframe-jalon` **et** `iakaframe-fabrication` incluses. `count == 17` si profondeur transitive retenue, `== 14` si profondeur 1 | `--json` : `count` + liste identique à l'union recalculée |
| **B16** | **0 manquante** sur l'union ; les orphelines (**4** en transitif, **6** en profondeur 1) sont **signalées** `orphan` et **conservées** | `skills deploy --check` sort **0** ; `--json` liste les `orphan` |

> ⚠️ **B8/B16 sont volontairement paramétrés par l'arbitrage de profondeur (§ 14.3).** Ils ne
> peuvent pas être figés avant lui. **Le calcul, lui, est figé** : c'est le tableau ci-dessus.

### 14.3 Défaut DISQUALIFIANT hérité — **B28 rend le lot inexécutable en l'état**

**C'est le point le plus grave de ce rafraîchissement.** Le § 13.6 a ajouté le critère **B28** :

> *« Une chaîne `subskills` de profondeur **> 1** atteignable depuis une persona ⇒ **erreur
> explicite**. »*

Il était fondé sur un motif alors exact : *« aucune chaîne atteignable depuis une persona ne dépasse
1 niveau ; la chaîne profonde part d'`iakaframe-init`, qui est orpheline »*.

**Ce motif est mort avec le lot Gimli.** Gimli déclare `iakaframe-fabrication`, qui déclare
`iakaframe-gestion-de-source`, qui déclare `iakaframe-git`, qui déclare `iakaframe-forgejo` : une
chaîne de **profondeur 3 atteignable depuis une persona du roster**. Idem
`fabrication → conteneurisation → docker` (profondeur 2).

> **Conséquence mécanique : appliquer B28 tel quel ferait échouer `resolveSkills('gimli')` sur le
> canon en vigueur.** Le critère n'attraperait pas un piège futur — il **rejetterait l'état actuel du
> dépôt**. Un lot livré ainsi serait rouge à la première exécution, sur un canon pourtant valide.
> **B28 est donc SUSPENDU** ; il ne doit pas être implémenté tel qu'écrit.

**Deux issues, et une seule tient :**

| Option | Conséquence | Verdict |
|---|---|---|
| **Garder la profondeur 1** + B28 | `resolveSkills('gimli')` **échoue** ⇒ lot inexécutable. Ou bien on tronque silencieusement `git`/`forgejo`/`docker` — soit exactement le défaut que B28 voulait interdire | **Écarté** |
| **Passer en résolution TRANSITIVE** + **détection de cycles** | Résout la chaîne complète (union = 17). Le besoin que le § 7 pt 5 jugeait « inexistant » **existe désormais** | **Recommandé** |

> **Le § 7 pt 5 et le § 5.1 pt 4 sont donc à ré-arbitrer** — c'est un **point décideur**, pas une
> correction de forme : la profondeur de résolution était un arbitrage rendu, et le fait qui le
> fondait a changé. La recommandation Gandalf s'**inverse** : *résolution transitive, avec détection
> de cycles obligatoire*.

> ✅ **TRANCHÉ PAR LE DÉCIDEUR (2026-07-20) — résolution TRANSITIVE avec détection de cycles.**
> La recommandation Gandalf est retenue. **B28 est LEVÉ** ; **B28-a/b/c le remplacent
> définitivement**. Le § 5.1 pt 4 (« UN SEUL niveau de subskills ») et le § 7 pt 5 sont **caducs**.
>
> **Motif du décideur, à conserver** : la profondeur 1 obligerait à **démonter la skill composée
> `iakaframe-fabrication`** créée et gatée en phase 1 — soit détacher ses subskills, soit les
> aplatir. **On ne plie pas le canon à une limite d'implémentation.** C'est le même principe que
> celui invoqué au § 4.2 pour écarter les tables codées : la source de vérité commande, le mécanisme
> s'y adapte.
>
> **L'union déployable est donc figée à 17** (colonne « Transitive » du § 14.2), avec **6 manquantes**
> et **4 orphelines**. **B8 vaut `count == 17`** et **B16 porte sur 4 orphelines** — ils ne sont plus
> paramétrés par un arbitrage en attente, ils sont **fermés**.

**Critères révisés :**

| # | Critère (**remplace B28**) | Vérification |
|---|---|---|
| **B28-a** | `resolveSkills('gimli')` résout la chaîne **complète** : `fabrication`, `gestion-de-source`, `git`, `forgejo`, `conteneurisation`, `docker`, `jalon` — **7 entrées**, aucune troncature | test unitaire |
| **B28-b** | Un **cycle** dans le graphe `subskills` ⇒ **erreur explicite nommant le cycle**, jamais une boucle infinie ni une troncature | test : introduire temporairement `A→B→A` |
| **B28-c** | L'ordre de résolution est **déterministe** (parcours en profondeur, ordre de déclaration, première occurrence conservée) — condition de stabilité du golden | test de stabilité : 2 résolutions successives identiques |

> **Si le décideur maintient la profondeur 1**, alors B28-a devient inatteignable et la seule issue
> cohérente est de **détacher `iakaframe-fabrication` de Gimli** ou d'**aplatir** ses subskills —
> deux gestes qui défont le lot Gimli de la phase 1. **Je le déconseille formellement** : ce serait
> plier un canon validé à une limite d'implémentation.

### 14.4 `SKILL_OF` ne dit plus seulement « trop peu » — il dit **faux**

L'anomalie A du § 1 s'est aggravée d'un cran, et il faut le nommer :
`SKILL_OF.fabrication = ''` (avec le commentaire *« pas de skill : porté par le CLAUDE.md du
projet »*) et la branche `else if (name === 'gimli')` qui affiche *« gimli : pas de skill — porté par
le CLAUDE.md du projet »* **contredisent désormais le canon**, qui déclare
`skills: [iakaframe-fabrication]`.

> Ce n'était qu'une **omission** (une skill sur deux non déployée pour Odin et Nathalie) ; c'est
> maintenant une **affirmation fausse imprimée à l'utilisateur**. Cela renforce la recommandation du
> § 4.2 — **supprimer les tables codées**, pas les conserver en repli. **Critère ajouté :**

| # | Critère | Vérification |
|---|---|---|
| **B29** | Aucun chemin ne prétend plus que Gimli est sans skill : le message dédié est **supprimé** avec la table, et `fullteam`/`switch` déploient bien `iakaframe-fabrication` pour Gimli | `grep -n "pas de skill" cli/src/` = 0 ; sortie de déploiement |

### 14.5 Asymétrie `layer` — versée à ce lot

`library/skills/iakaframe-jalon/SKILL.md` **ne déclare aucun champ `layer`**, alors que
`iakaframe-gestion-de-source`, `iakaframe-conteneurisation`, `iakaframe-memoire-humaine`,
`iakaframe-journal-conversation` et `iakaframe-fabrication` portent `layer: capacity`, et que
`iakaframe-git` porte `layer: family`, `iakaframe-docker` / `-forgejo` / `-appflowy-doc` /
`-log-conversation` portent `layer: product`.

`iakaframe-fabrication` (une **capacité**) pointe donc `iakaframe-jalon`, une brique **non typée** —
relevé en phase 1 comme observation hors périmètre, **versée ici** puisque ce lot est le propriétaire
du modèle de résolution des skills.

| # | Critère | Vérification |
|---|---|---|
| **B30** | Toute skill atteinte par une résolution porte un `layer` explicite, ou l'absence est **documentée comme intentionnelle** dans `library/skills/README.md` | inventaire des `layer` sur les 24 skills |

> **Ce critère n'impose pas une valeur** pour `iakaframe-jalon` : `capacity` (geste transverse) se
> défend, `product` non. **Le choix de la valeur est un point décideur** (§ 14.7) ; le critère exige
> seulement que le silence cesse.

### 14.6 Dépendances — ce lot vient en **DERNIER**

| Nature | Contenu |
|---|---|
| **Dépend de** | **`garde-vendor-check-cross-repo.md`** (la garde doit exister **avant** que ce lot ne modifie le format du contrat) · **`audit-amelioration-roster-personas.md` / CH-A** (`roster.ts` est modifié par les deux lots — cf. B27 et § 13.5) |
| **Est prérequis de** | rien |
| **Ne doit PAS précéder** | les deux lots ci-dessus |

**Motif — il est le plus destructeur des trois s'il part en premier :** c'est **le seul lot qui
modifie le format du contrat d'agent** (ajout de `skills:`) **et** le binding (ajout de `Skill`). Il
propage donc sur les 8 goldens, les 21 fixtures vendorées et 4 assertions en dur du test GUI. Le
livrer **sans** `vendor-check` reviendrait à exécuter le changement le plus risqué **précisément
pendant la fenêtre où rien ne détecte une dérive cohérente** — la mitigation était déjà nommée au
§ 10, elle devient ici une **dépendance déclarée**.

**B27 (`DEFAULT_SKILLS` couvre le rôle `deploiement`) reste porté au lot roster**, conformément à la
reco du § 13.5 : ce lot le **signale**, ne l'implémente pas.

### 14.7 Points que SEUL le décideur tranche — **liste en vigueur**

> ✅ **AUCUN ARBITRAGE N'EST PLUS EN ATTENTE SUR CE LOT (2026-07-20).** Les points 1 à 4 du § 7
> étaient tranchés au § 13 ; les deux points nouveaux relevés au rafraîchissement l'ont été le
> 2026-07-20. **Le lot est exécutable sans autre décision.**

1. ~~**Profondeur de résolution**~~ — **TRANCHÉ : résolution TRANSITIVE + détection de cycles**
   (§ 14.3). B28 levé, B28-a/b/c en vigueur, union figée à **17**. *Motif : ne pas démonter
   `iakaframe-fabrication` pour satisfaire une limite d'implémentation.*
2. ~~**Valeur du `layer` d'`iakaframe-jalon`**~~ — **TRANCHÉ : `layer: capacity`** (§ 14.5). B30 est
   **levé en conséquence** : la valeur n'est plus à inventorier ni à arbitrer, elle est **posée**.
   Ce qui subsiste du critère est le geste d'écriture, reformulé en **B30-bis** ci-dessous.
3. *(reconduit du § 13.8)* **Embarque-t-on d'autres changements de binding dans ce lot ?**
   **CLOS — sans objet.** `Task` (Odin) et `Write` (Helm) sont **déjà livrés** en phase 1 :
   l'économie de cycle invoquée alors **n'existe plus**. Le seul changement de binding restant est
   **`Skill`**, porté par ce lot.

| # | Critère (**remplace B30**) | Vérification |
|---|---|---|
| **B30-bis** | `library/skills/iakaframe-jalon/SKILL.md` déclare **`layer: capacity`**, au même rang que `gestion-de-source`, `conteneurisation`, `memoire-humaine`, `journal-conversation` et `fabrication` | `grep -n "^layer:" library/skills/iakaframe-jalon/SKILL.md` = `layer: capacity` |

> **Pourquoi `capacity` et non `product`** *(motif du décideur, à conserver)* : le jalon est un
> **geste de méthode transverse**, indépendant de tout outil ; il n'a pas de produit sous-jacent à
> nommer. Il se range donc au même rang que les autres capacités — ce qui **supprime l'asymétrie**
> relevée en phase 1, où `iakaframe-fabrication` (capacité) pointait une brique non typée.

### 14.8 Estimation révisée

| Poste | Avant | **Révisé** | Motif |
|---|---|---|---|
| Base (§ 10 + § 13.2) | ~2,75-3,25 j-h | **~2,75-3,25 j-h** | inchangé |
| Résolution **transitive** + détection de cycles + déterminisme (B28-a/b/c) | — | **+0,25 j-h** | remplace une limite triviale par un vrai parcours de graphe |
| Union passée de 11 à 17 déployables | — | **~0 j-h** | la boucle ne change pas de nature ; seul le `count` bouge |
| Suppression du message « pas de skill » + retombées (B29) | — | **+0,1 j-h** | trivial, mais à ne pas oublier |
| Inventaire et arbitrage `layer` (B30) | — | **+0,15 j-h** | inventaire des 24 skills + doc |
| | **~2,75-3,25** | **~3,25 à 3,75 j-h** | |

- **Complexité** : **moyenne-haute** *(relevée d'un cran)*. Le lot ne se contente plus d'aplatir une
  liste : il parcourt un **graphe** avec cycles possibles, et il doit le faire de façon
  **déterministe** puisqu'un golden en dépend.
- **Risque** : **moyen-haut**, inchangé — et **entièrement concentré** sur la modification du format
  du contrat. La mitigation reste la même et devient une dépendance : **`vendor-check` d'abord**.
- **Inconnues** *(la principale est inchangée)* :
  - **le `skills:` du contrat est-il réellement honoré** pour un subagent défini en
    `~/.claude/agents/` ? Toujours **non vérifié en réel** — c'est l'objet de la recette **B21**, et
    c'est ce qui décide si tout le lot atteint son but ;
  - **coût en contexte du préchargement**, désormais **plus lourd qu'estimé** : Gimli précharge
    **7 skills** (dont la chaîne git/forgejo/docker) là où le chiffrage d'origine en supposait 0 ou 1.
    Si le volume injecté devient excessif, arbitrer **skill par skill** entre préchargement (A) et
    invocation à la demande (B) — l'option A+B du § 4.1 le permet **sans rien redécouper** ;
  - version minimale de Claude Code exigée par le champ `skills:` — toujours à confirmer.
