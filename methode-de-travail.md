# iakaframe — Méthode de travail IA-augmentée

> La méthode de collaboration entre **l'utilisateur** (le décideur) et une **équipe d'experts**
> (des **personas** incarnant des rôles) organisée en **3 phases** (cadrage → réalisation → staging) + un **squad prod**,
> extraite et généralisée à partir des projets `IAKA Vod`, `robotimmo`,
> `iakaAFstorage`, `iakabox`, `iakaJarvis`.
>
> Ce document est la référence canonique. Il est volontairement agnostique du
> stack : il s'applique à n'importe quel langage, framework ou type de projet.

---

## Le principe fondateur

**C'est le workflow qui produit la qualité, pas l'IA.**

Une IA sans cadre génère du code plausible. Un workflow structuré — avec des
rôles clairs, des instructions écrites et des outils de vérification — produit
du logiciel fiable. La différence entre les deux, c'est la méthode.

Le postulat est simple : l'IA est un exécutant puissant mais aveugle. Elle ne
sait pas ce qu'elle ne sait pas. C'est le développeur qui apporte la vision, les
décisions d'architecture et les critères de qualité. **L'IA amplifie ; le
workflow cadre.**

---

## Les 3 phases (cible staging)

Un **décideur humain** et une **chaîne en 3 phases** portée par des experts. Plus de modèle à
deux acteurs nommés par leur runner : la réflexion et l'exécution sont distribuées sur une
**équipe** (voir plus bas), organisée en phases dont la **cible est le staging**.

### Le décideur — l'utilisateur

Il tranche sur l'architecture, valide les choix techniques et juge le résultat. Il ne délègue
pas la réflexion — il délègue l'exécution. Il décide **à chaque gate**.

- Définit les features et leur priorité (le backlog dans `CLAUDE.md`)
- Valide ou corrige les instructions de cadrage
- Teste le résultat dans l'app réelle
- Donne du feedback qui sera **mémorisé** et appliqué aux sessions suivantes

**Préférences confirmées (transverses aux projets) :**
- Réponses **en français**, concises et directes — pas de bavardage.
- **MVP d'abord, puis on itère.** Pas de sur-ingénierie.
- **Self-hosted / open-source d'abord** : pour tout choix de backend, proposer
  la version locale en option n°1 ; le cloud n'est qu'un *fallback* justifié.
- Travaille sur **Windows + Docker Desktop + PowerShell**.
- **Isolation Docker par projet** : chaque projet tourne dans sa **propre stack
  Docker** — réseau, volumes et containers **nommés/préfixés par projet**
  (`<projet>-dev-*`) **et ports hôte distincts** (chaque projet décale ses ports
  pour ne jamais entrer en collision avec un autre, ex. robotimmo 5432 / robby-bo
  5433 / robbycollect 5434). Jamais de partage de stack ni de ressources entre projets.
- Valide vite les plans détaillés ; choisit souvent l'option « Recommandé ».
- Apprécie un découpage en **commits atomiques** par étape.

### La chaîne en 3 phases

1. **Cadrage** (🧙 Gandalf) — le besoin devient une **instruction fermée et vérifiable** dans
   `specs/instructions/`. Lecture seule sur le code. **Gate humain** : l'utilisateur valide.
2. **Réalisation** (⚒️ Gimli + 🏹 Legolas) — implémentation en **commits atomiques** + **gate
   qualité** (typecheck, lint, tests). Verdict PASS pour avancer.
3. **Déploiement staging** (⚒️ Gimli en **devops** + 🏹 Legolas) — build + mise en **staging**
   (`vX.Y.Z-rc`). **La chaîne s'arrête au staging.**

> **Règle absolue : la phase de cadrage ne touche jamais au code de production.** Le jour où
> celui qui réfléchit est aussi celui qui exécute sans garde-fou, il n'y a plus de contrôle.

La **mise en production** est un **squad séparé** (🌉 Helm : déploiement prod, surveillance,
alertes, rollback), déclenché sur **feu vert humain** — hors les 3 phases. Roster complet,
détail des phases, squad prod et **identité des agents** : section suivante.

---

## Pourquoi des agents ?

Découper la couche IA en agents nommés n'est pas cosmétique — ça résout des problèmes concrets :

1. **Savoir depuis quelle phase arrive une sollicitation.** En multitâche, l'origine des
   questions se brouille. Personnifier les contextes — un **nom**, une **couleur**, une
   **phase** — fait gagner du temps à l'humain : d'un coup d'œil il sait *qui* lui parle et *à
   quel stade*, et trie ses réponses sans recharger tout le contexte.
2. **Discrétiser proprement permissions, limites et process.** Un agent = un rôle **packagé** :
   ses droits (outils autorisés), ses garde-fous (ce qu'il ne fait pas), son process (entrées →
   sorties, gate). Borné, lisible, réutilisable d'un projet à l'autre.
3. **Et c'est plus fun.** Une équipe incarnée rend le travail vivant et mémorisable — on retient
   « Gandalf cadre, Gimli forge » mieux qu'« agent 1, agent 2 ».

---

## L'équipe d'agents (« Yakaframe Avancé »)

Le modèle, c'est **un décideur (l'utilisateur) + une équipe d'experts** aux périmètres étanches,
**sans nombre figé**. La réflexion et l'exécution sont **distribuées sur les rôles** de cette
équipe ; chaque rôle est incarné par un **persona** (un nom) pour le rendre mémorisable. Pour
industrialiser le développement « au fil de l'eau » sur une chaîne CI/CD, ces rôles se
**spécialisent**, chacun avec un périmètre fermé.

> Référence canonique et fiches détaillées : `specs/equipe-agents.md`.
> Définitions exécutables : `agents/` (subagents) + `skills/iakaframe-*` (savoir-faire).

### Le roster

| Agent | Pastille | Rôle | Phase | Skill |
|---|---|---|---|---|
| 🦅 **Odin** | 🟡 | Super-agent **portefeuille** : switch d'équipe, démarrage projet, création d'équipe | Portefeuille (le seul sur `C:\work`) | `iakaframe-odin` |
| 🛡️ **Aragorn** | 🟠 | Coordination entre agents, suivi des phases, reporting | Transverse / par projet | `iakaframe-aragorn` |
| 🧙 **Gandalf** | 🔵 | Architecte-cadreur : besoin → instruction fermée | P1 — Cadrage | `iakaframe-cadrage` |
| ⚒️ **Gimli** | 🔴/🟢 | **Dev + devops** : code, build, commits, **déploiement jusqu'au staging** (×N) | P2 Réalisation → P3 Staging | (CLAUDE.md) |
| 🏹 **Legolas** | 🔴/🟢 | Qualité / test : verdict PASS, gate auto (dev + validation stage) | P2 Réalisation / P3 Staging | `iakaframe-qualite` |
| 🌉 **Helm** | 🟣 | **Équipe prod** : déploiement prod, surveillance, alertes, rollback, accès | Prod (squad séparé) | `iakaframe-deploiement` |
| 🎭 **Loki** | 🟠 | Design : supports on-brand (catalogue de chartes `design-*/`) | Transverse | `iakaframe-naonedge` |
| 📖 **Nathalie** | 🟠 | Guides utilisateurs / documentation | Transverse | `iakaframe-nathalie` |

> **n8n / Hermes** sont des **outils** d'orchestration qu'Aragorn pilote — pas des agents.

> **Règle — la réflexion et le cadrage s'appuient sur le web (obligatoire).** Un agent de
> **réflexion / cadrage** (au premier chef 🧙 **Gandalf**, étape 0) **ne travaille pas
> hors-ligne** : cadrer suppose de **vérifier des faits à jour** (versions et leur
> compatibilité, état de l'art d'un outil/d'une lib, pièges connus, alternatives maintenues)
> avant de fermer un périmètre — sinon l'instruction repose sur des suppositions périmées.
> Ces agents disposent donc des outils **`WebSearch` / `WebFetch`** et **doivent** s'en servir
> dès qu'une décision dépend d'un fait externe ; les faits vérifiés sont **cités (avec leurs
> sources)** dans l'instruction. (Ex. vécu : sur Minecraft 1.21.10, dynmap officielle n'existe
> pas encore — un cadrage hors-ligne l'aurait recommandée à tort.)

**Deux niveaux d'orchestration.** Au-dessus des équipes, un **super-agent portefeuille,
🦅 Odin**, disponible en permanence, est le **seul agent affecté à `C:\work`** (la racine de
tous les projets). Il reçoit les ordres de haut niveau de l'utilisateur — **switcher** d'équipe,
**démarrer** un projet (`init iakaframe`), **créer** une équipe (`fullteam`) — et passe la
main à l'**Aragorn** du projet concerné. La hiérarchie&nbsp;:

```
l'utilisateur → 🦅 Odin (portefeuille, C:\work) → 🛡️ Aragorn (par projet) → agents
```

Odin n'entre jamais dans le métier d'un projet&nbsp;: il ouvre la bonne porte, Aragorn
coordonne à l'intérieur. C'est la **répartition entre projets** matérialisée — celle qui,
sinon, resterait un geste manuel de l'utilisateur.

**Réveil d'Odin (par défaut).** Au **premier appel d'Odin dans `C:\work`** (par session), avant
toute autre chose, il **régénère puis affiche le dashboard portefeuille** (NaonEdge dashboard)&nbsp;:
`pwsh C:\work\naonedge-dashboard\scan.ps1` réécrit `data/projects.js` (métriques git/LOC/tokens/état
des projets), puis il ouvre `C:\work\naonedge-dashboard\index.html`. Ensuite seulement il enchaîne
sur la synthèse et l'ordre reçu. Aux appels suivants de la même session, le scan n'est relancé que si
l'état a bougé ou si l'utilisateur le redemande.

> **Lexique.** Une **équipe armée** (full team déployée dans `<projet>/.claude/`, prête à
> démarrer mais pas encore lancée) se dit&nbsp;: **« la compagnie est à l'auberge »**.

### Les 3 phases (cible staging) + le squad prod

La chaîne de dev **a pour cible le staging** et avance en **3 phases**. À chaque phase, **un
agent** est aux commandes ; Aragorn enchaîne et vérifie le gate avant de passer à la suivante.

| Phase | Agent(s) | Entrée → Sortie | Gate |
|---|---|---|---|
| 🔵 **P1 — Cadrage** | 🧙 Gandalf | besoin → `specs/instructions/{feature}.md` | **humain** (l'utilisateur valide l'instruction) |
| 🔴 **P2 — Réalisation** | ⚒️ Gimli (dev, ×N) + 🏹 Legolas (qualité) | instruction → branche + commits + verdict PASS | **auto** (typecheck/lint/tests verts) |
| 🟢 **P3 — Déploiement staging** | ⚒️ Gimli (**devops**) + 🏹 Legolas (validation) | PASS → image/build déployé en **staging** (`vX.Y.Z-rc`) | auto |

> La chaîne **s'arrête au staging**. ⚒️ Gimli monte en **dev + devops** : il finit le travail
> jusqu'à la mise en stage (build, image, déploiement). 🏹 Legolas valide en P2 (tests) puis sur
> le stage en P3.

**Le squad prod — séparé, sur feu vert humain.** La mise en production **n'est pas une phase**
de la chaîne de dev : c'est une **équipe dédiée**, déclenchée par un **feu vert tracé** de
l'utilisateur.

| Étape prod | Agent | Entrée → Sortie | Gate |
|---|---|---|---|
| 🟣 **Déploiement prod** | 🌉 Helm | rc recettée + feu vert → prod (alias de version) | **humain** (feu vert tracé) |
| 🟣 **Surveillance** | 🌉 Helm | prod → santé OK / alerte / rollback | continu |

> Frontière nette : **dev → staging** (les 3 phases) puis **prod** (squad 🌉 Helm), avec une
> **couture humaine** entre les deux. Le squad prod est **extensible** (rôles surveillance /
> alerte dédiés à terme).

Transverses : 🎭 **Loki** (supports visuels) et 📖 **Nathalie** (guides) interviennent sur
sollicitation, à toute phase. **Tout agent peut solliciter l'utilisateur directement** ; Aragorn
est l'interlocuteur par défaut.

À l'inverse, **l'utilisateur peut demander à Aragorn de lancer un travail sur un agent** — en le
nommant (« lance Gimli sur X ») ou en décrivant la tâche (Aragorn route). Aragorn émet un
**ordre de mission** (quoi, base, critère de fin), vérifie le **gate amont** de la phase, puis
**dispatche le subagent** (outil Agent en session, ou n8n/Hermes en chaîne automatisée).

**Canal de communication — Slack (bidirectionnel, via n8n).** Aragorn dialogue avec l'utilisateur
sur **Slack**, piloté par n8n (qui porte les identifiants — aucun secret côté agent) :
sortant (états des phases, blocages, **demandes de feu vert**) et entrant (arbitrages, ordres
de dispatch, **feu vert prod** captés par un trigger n8n). Slack devient un **canal de
pilotage à distance**. Équivalent self-hosted : Mattermost (même schéma).

### Identité des agents — qui te parle, et depuis quelle phase

Quand un agent **s'adresse à l'utilisateur**, il **DOIT s'identifier** — règle **obligatoire**
(anti-dérive hors méthode). Le badge **DOIT apparaître en PREMIÈRE LIGNE de TOUTE réponse adressée
à l'utilisateur** (pas seulement les questions ou demandes : **toute** prise de parole, y compris
une simple restitution ou un compte rendu) :

```
<pastille-phase> [ROYAUME][Agent]  <le message…>
```

- **`[ROYAUME]`** = le projet courant, en **MAJUSCULE** (ex. `IAKABOX`) ; pour 🦅 Odin =
  `PORTEFEUILLE`.
- **La pastille = la PHASE** où l'agent agit (couleur **partagée** entre agents, pas propre à
  l'agent). Un même agent **change de pastille** selon la phase :

  | Phase | Pastille | Couleur |
  |---|---|---|
  | Cadrage / réflexion | 🔵 | bleu |
  | Dev | 🔴 | rouge |
  | Staging | 🟢 | vert |
  | Prod | 🟣 | violet |
  | **Transverse / coordination (défaut hors phase)** | **🟠** | **orange** |
  | Portefeuille (🦅 Odin) | 🟡 | or |

  Agents transverses (🛡️ Aragorn, 🎭 Loki, 📖 Nathalie) : pastille de la **phase servie**
  (🔵/🔴/🟢/🟣) quand ils en servent une, **🟠 par défaut** (besoin transverse non rattaché à une
  phase colorée : coordination, design, doc).

- **Une pastille est PARTAGÉE entre agents d'une même phase — c'est le `[Agent]` du badge qui
  disambigue, jamais la couleur seule.** Ainsi ⚒️ Gimli (dev) et 🏹 Legolas (qualité) sont **tous
  deux 🔴 en P2** (et 🟢 en P3) : cette collision est **intentionnelle**, fidèle au principe
  « pastille = phase, pas agent ». `🔴 [ROYAUME][Gimli]` et `🔴 [ROYAUME][Legolas]` se distinguent
  par le **nom d'agent** du badge, jamais par la pastille.

- **Périmètre STRICT** : seulement les **paroles adressées à l'utilisateur**. **Jamais** sur les
  **logs**, les **traces de réflexion**, la sortie d'outils. L'identité dit « un agent te
  parle » ; elle ne pollue pas le travail.

- **La POSITION de la pastille porte le sens — jamais un mot-clé.** Le « double badge » d'une
  intervention s'exprime par **où se trouve la pastille**, pas par un libellé :
  - **Ouverture** = pastille **AVANT** le bloc : `🟡 [PORTEFEUILLE][Odin] — <annonce de ce qui va être fait>`.
  - **Clôture** = pastille **APRÈS** le bloc : `<texte final> [PORTEFEUILLE][Odin] 🟡`.

  Les mots « START » / « STOP » (et toutes leurs variantes : `(START)`, `— START :`, `(start + stop)`, etc.)
  sont **bannis** du texte des badges et des messages d'identité : ils sont **redondants** avec la
  position de la pastille. On dit « ouverture (pastille avant) » et « clôture (pastille après) ».

**Rendu.** Pastille emoji **partout** (terminal, Slack, HTML) ; en session le libellé passe en
`code inline` pour ressortir ; en **HTML** il prend la **vraie couleur** de la phase. Exemples :

> 🔵 `[IAKABOX][Gandalf]` instruction prête à valider.
> 🔴 `[IAKABOX][Gimli]` dev en cours, commit `feat: …`.
> 🟢 `[IAKABOX][Gimli]` déployé en staging, `v0.6.0-rc1`.
> 🟣 `[IAKABOX][Helm]` prod en ligne, surveillance active.
> 🟡 `[PORTEFEUILLE][Odin]` je rebascule le focus.

> **Option terminal « vraie couleur »** : une fonction PowerShell `iaka-say` (profil) colorise le
> bandeau par phase (ANSI : bleu/rouge/vert/magenta/jaune). Documentée en option — la **pastille**
> reste le défaut (universelle, sans plomberie). Les rouges/verts du diff sont rendus par le
> harnais, non reproductibles dans la prose d'un agent.

#### Restitution en relais — l'orchestrateur ne vole pas le badge de l'émetteur

Quand un **orchestrateur** (🦅 Odin / 🛡️ Aragorn / **Claude principal** non personnifié) **relaie**
le travail d'un **subagent** (dispatché via l'outil Agent, dont seul le message final revient au
parent), il **DOIT le restituer dans un bloc identifié SOUS le badge de l'agent émetteur**, **sans
le fondre dans sa propre voix** et **sans le reformuler à la première personne**. Il **cite/encadre**
le message de l'émetteur tel quel, puis ajoute **son propre badge** s'il commente — l'utilisateur
doit toujours savoir **qui** a réellement parlé.

Exemple — Aragorn relaie un travail de Gimli :

> 🔴 `[ROYAUME][Gimli]` — restitué par Aragorn
> {le message du subagent Gimli, tel quel ou cité, **pas** reformulé en « je »}
>
> 🛡️ `[ROYAUME][Aragorn]` {commentaire d'orchestration, séparé et badgé à part}

Règle : **jamais** de reformulation « je » du travail d'un subagent par l'orchestrateur ; le badge
de l'émetteur reste visible, distinct de celui de l'orchestrateur.

**Chaîne de badges sans interjection (délégation A→B).** Sur une délégation, la séquence est
**strictement** : (1) **A ouvre** (pastille avant) et annonce qu'il délègue à B ; (2) **A clôt**
(pastille après) ; (3) **immédiatement B ouvre** (pastille avant) et parle **à la première
personne** ; (4) **B travaille puis restitue** ; (5) **B clôt** (pastille après) ; (6) **A rouvre**
pour restituer en relais (sous le badge de B) et/ou commenter. **Interdit** : entre l'ouverture de B
(3) et la clôture de B (5), l'orchestrateur A **ne place AUCUNE phrase dans SA voix** (pas de « je le
dispatche », « règle enregistrée », « voilà le retour »…). A ne reprend la parole **qu'après** la
clôture de B.

**Citation verbatim — aucun agent ne parle sous le badge d'un autre.** Un badge `[ROYAUME][Agent]`
n'introduit **QUE les mots propres de l'agent qu'il nomme**. Deux invariants distincts régissent la
restitution en relais :

- **Invariant DUR (jamais assoupli) — attribution / anti-ventriloquie.** Sous le badge d'un agent,
  **seuls ses mots exacts** apparaissent : on n'écrit **jamais** le badge d'un agent pour lui faire
  dire des mots qu'il n'a pas produits, on ne le paraphrase **jamais** « en je », on ne fond
  **jamais** son travail dans la voix de l'orchestrateur. Tout commentaire/condensé est la **voix de
  l'orchestrateur**, sous **SON propre badge**, séparé. **Cet invariant ne bouge pas.**
- **Invariant SOUPLE (volume) — mode de restitution.** Si le rendu de l'émetteur tient en
  **≤ ~15 lignes**, **verbatim intégral obligatoire**. **Au-delà**, l'orchestrateur peut citer un
  **extrait fidèle** — des **mots exacts** de l'agent (donc l'invariant dur reste préservé), juste
  **tronqué et signalé** par la marque `[…]` — sous le badge de l'émetteur, **plus un renvoi** au
  **journal des gestes** qui archive l'intégral. L'extrait privilégie les passages porteurs
  (ouverture/clôture, verdict, chiffres, fichiers).

**Sous-agents jetables** (`Explore`/`Plan`/`general-purpose`, analyse) : pas de badge d'émetteur à
protéger → leur matériau est **librement synthétisable** par l'orchestrateur **sous SON propre
badge** (aucune ventriloquie possible). Le régime des deux invariants ci-dessus vaut pour les
**agents du roster** uniquement. (Portée : **orchestrateurs uniquement** — 🦅 Odin / 🛡️ Aragorn /
Claude principal.)

### Jalons (gates) & clôture de session

**Jalons.** Chaque gate de la méthode (instruction prête, dev à vérifier, qualité, prod) **DOIT**
être rendu **très visible** via `iakaframe jalon` :
- titre ASCII **FIGlet `Standard`** (police réservée aux jalons, distincte de l'ANSI Shadow des
  titres de royaume) : `<PROJET> - JALON : <nom>` ;
- un **tableau à 3 zones** : **émetteur** (l'agent qui pose le jalon) · **contenu** · **récepteur**
  (qui valide — souvent l'utilisateur) ;
- les **fichiers / dev à vérifier** sont listés par l'agent **dans son message** en `chemin:ligne`
  (cliquables côté Claude Code) ;
- à la **validation** par l'utilisateur, le récepteur affiche **« JALON VALIDÉ »** puis **explique
  la suite** (étape / agent suivant).

**Estimation du temps à l'entrée d'un jalon de dev (obligatoire).** Au moment où le gate
**cadrage → réalisation** (P1 → P2) s'ouvre — c'est-à-dire **avant que Gimli ne code** — l'instruction
validée **DOIT** être accompagnée d'une **estimation chiffrée** : **équivalent jour-homme** (spec
fermée), **niveau de complexité/risque** et les **inconnues** susceptibles de la faire glisser. Le but
est que l'utilisateur **décide en connaissance de cause** (engager, découper, ou re-cadrer) avant
d'engager la réalisation. L'estimation est posée par l'agent qui ouvre le jalon de dev (Aragorn en
coordination, ou Gandalf en clôture de cadrage) ; elle est **rappelée à la clôture du lot** confrontée
au temps réel, pour affiner les futures estimations. Une estimation n'est **pas un engagement ferme** :
c'est un ordre de grandeur assumé et révisable.

**Démarrage.** À l'ouverture d'une session sous le portefeuille, on affiche le titre **IAKAFRAME** ;
à l'entrée d'un projet, `iakaframe brief <projet>` (titre + dernière étape + backlog + agents assignés).
Au niveau portefeuille, ces deux automatismes sont câblés en **hooks** dans
`C:\work\.claude\settings.json` : **`SessionStart`** affiche le bandeau **IAKAFRAME** et
**`SessionEnd`** déclenche `iakaframe snapshot --reason pause`. La police du bandeau est réglée par
**`bannerFont`** (par défaut **ANSI Shadow**, repli **`Standard`** si la police est indisponible —
la même `Standard` que les titres de jalon).

**Clôture (pause / stop / exit).** L'agent actif **DOIT**, avant de fermer :
1. préparer la reprise — `iakaframe snapshot --reason pause` (régénère l'état des lieux) ;
2. afficher le recap — `iakaframe recap` (commits de session + agents mobilisés + projet) ;
3. **proposer** de sauvegarder l'état — `iakaframe update` (commit global) — et **attendre la
   validation** de l'utilisateur. **Jamais** de commit automatique silencieux.

### Étanchéité : l'image est mutualisée, le conteneur est étanche

Comme pour l'isolation Docker par projet, on distingue **définition** et **exécution** :

- **Définitions mutualisées** : une persona/skill est définie **une seule fois** (ici, dans
  l'installation iakaframe) et réutilisée partout. *Da Vinci n'existe qu'une fois.*
- **Exécution étanche** : **chaque projet instancie SA propre équipe**, scopée à son repo,
  son `CLAUDE.md`, ses `specs/`. **Aucun agent ne porte deux projets dans un même contexte**
  (zéro contamination inter-projets).
- **Répartition entre projets** : elle se fait **au niveau portefeuille** (l'utilisateur décide
  quel projet avance), **pas dans l'agent**. Dans un projet, Aragorn répartit entre agents.

### Incarnation : personas + skills

- Chaque rôle est incarné par un **persona** = son **contrat** (contexte isolé, outils propres,
  **dispatchable** par Aragorn et **parallélisable** — N Gimli en worktrees). Sur **Claude Code**,
  un persona s'implémente en **subagent** (`agents/<rôle>.md`, déployé dans
  `<projet>/.claude/agents/`) ; sur d'autres runners, en profil/Model (`AGENTS.md`). Claude Code
  n'est qu'**une implémentation parmi d'autres**.
- Le **savoir-faire** du rôle vit dans une **skill** (`skills/iakaframe-*`) que le persona
  charge. Le **persona = le contrat** ; la **skill = la méthode**.
- Cap multi-plateformes (vision PDF) : la même équipe est déclinable sur Claude, ChatGPT et
  IA locale auto-hébergée. Aujourd'hui : incarnation **Claude**.

### Créer un agent

1. **Partir du template** : `pwsh iakaframe-agents.ps1 -Action create -Agent <nom>` copie
   `agents/_TEMPLATE.md` → `agents/<nom>.md`.
2. **Remplir le frontmatter** (`name`, `description` précise pour le routage, `tools`) et le
   corps (mission, périmètre fermé, entrées→sorties, gate, étanchéité).
3. **Savoir-faire** : si le rôle a une méthode détaillée, créer la skill
   `skills/iakaframe-<nom>/SKILL.md` et l'associer dans `iakaframe-agents.ps1` (`$skillOf`).
4. **Déployer** : `-Action affect -Agent <nom> -Project <chemin>` (ou `fullteam`).

### Gérer et lancer l'équipe — `iakaframe-agents.ps1`

| Commande | Effet |
|---|---|
| `-Action list` | liste les agents canon + leur skill |
| `-Action create -Agent <nom>` | scaffold un nouvel agent depuis le template |
| `-Action affect -Agent <nom> -Project <chemin>` | affecte **un** agent à un projet |
| `-Action fullteam -Project <chemin>` | **déploie la full team** dans un projet |
| `-Action status -Project <chemin>` | liste les agents déjà affectés |
| `-Global` | cible l'installation utilisateur `~/.claude` (définitions mutualisées) |

`affect`/`fullteam` copient le subagent + sa skill dans `<projet>/.claude/` (et le catalogue
de chartes `design-*/` pour Loki) : le projet reçoit **sa** copie scopée.

---

## Le workflow en pratique

### Le cycle standard d'une feature

```
1. Le décideur exprime un besoin
        ↓
2. Le cadrage (l'architecte-cadreur) analyse le code existant (lecture seule)
        ↓
3. Discussion décideur ↔ cadrage (choix techniques, arbitrages, scope)
        ↓
4. Le cadrage rédige un fichier d'instructions → specs/instructions/{feature}.md
        ↓
5. Le décideur valide les instructions
        ↓
6. Le développeur lit les instructions et implémente (étape par étape, commits intermédiaires)
        ↓
7. Le décideur teste et donne du feedback
        ↓
8. Si correction nécessaire → retour à l'étape 2 (le cadrage)
```

### Le cycle de correction d'erreur

Quand l'exécution prend une mauvaise direction, le décideur **ne corrige pas
l'IA ligne par ligne**. Il remonte au niveau de la décision (le cadrage), et la
décision redescend sous forme d'instruction écrite.

```
1. Le décideur constate le problème
        ↓
2. Discussion au niveau du cadrage (pas de micro-management dans l'exécution)
        ↓
3. Le cadrage diagnostique, propose une solution
        ↓
4. Le cadrage rédige une instruction corrective → specs/instructions/fix-{problème}.md
        ↓
5. Le développeur lit et applique la correction
```

---

## Pourquoi le workflow crée la qualité

### 1. La séparation réflexion / exécution empêche les dérives

Une IA qui réfléchit et code en même temps optimise localement, sans recul sur
l'architecture globale. En séparant les rôles, chaque décision passe par un
filtre : *est-ce cohérent avec le reste du projet ?*

> Exemple réel (IAKA Vod) : l'exécution seule aurait embarqué FFmpeg pour le transcodage
> vidéo. C'est au cadrage que la décision a été prise de supprimer cette approche —
> les players natifs (AVPlay, Shaka, hls.js) décodent tout en hardware. L'exécution
> livrée à elle-même aurait implémenté une solution complexe et inutile.

### 2. Les instructions écrites sont une spécification vérifiable

Un fichier `specs/instructions/{feature}.md` n'est pas un prompt vague. C'est un
document structuré : le problème, ce qui existe, la décision, les étapes, les
fichiers concernés, les comportements attendus. L'exécution peut le relire, le
décideur peut le relire, et six mois plus tard l'historique des décisions est
toujours là.

**La mémoire de l'IA est volatile. Les fichiers d'instructions sont permanents.**

### 3. Les outils de vérification ferment la boucle

Sans vérification automatique, l'IA peut produire du code qui compile mais qui ne
fait pas ce qu'on attend.

| Catégorie | Ce qu'elle vérifie | Exemples d'outils |
|---|---|---|
| Typage statique | Types corrects, cohérence des interfaces | `tsc` · `mypy` · `cargo check` |
| Linting | Conventions, patterns dangereux, code mort | ESLint · Clippy · Ruff · Biome |
| Tests unitaires | Comportement attendu, régressions | Vitest · Jest · pytest · `cargo test` |
| Couverture | Code non testé identifié | V8 Coverage · Istanbul · coverage.py |
| Doc automatique | API documentée depuis le code | TypeDoc · Sphinx · `cargo doc` |
| Rapport qualité | Vue consolidée de toutes les métriques | script custom (`quality-report.sh`) |

L'IA génère le code. Les outils vérifient le code. Le développeur juge le
résultat. Aucun des trois ne fait le travail des deux autres.

**Gate qualité indépendant — auto-validation INTERDITE.** L'exécuteur (Gimli) ne juge jamais sa
propre qualité ni ne déclare son travail « prêt » : c'est **Legolas**, dans un **contexte séparé**,
qui rend le verdict. **Aucune feature ne passe à l'étape suivante sans verdict Legolas explicite.**
La **profondeur** du gate s'adapte au changement :
- **fix / modif qui n'est PAS une version mineure** → simple **validation de tests** (la suite
  passe au vert) — *pas* de campagne qualité complète ;
- **version mineure (feature)** → **campagne complète** : tests + lint + typage + couverture + rapport.

C'est l'anti-dérive « **Gimli solo** » : l'agent qui code ne se valide jamais lui-même (cf. chartes
Gimli / Legolas / Aragorn).

### 4. Le feedback persiste entre les sessions

Chaque correction, chaque préférence exprimée est **mémorisée** (mémoire projet
Claude) et appliquée aux sessions suivantes. Exemples réels :

- « Ne pas gaspiller les appels API — utiliser du mock en dev, cacher
  agressivement » → fixtures figées dans `specs/mock/` + cache.
- « Séparer réflexion et exécution » → le rôle de cadrage ne touche jamais au code de production.
- « Commit régulièrement pour pouvoir downgrade une erreur » → commits atomiques
  fréquents, jamais de `reset --hard`/`push --force` côté IA (filet de sécurité git).
- « Privilégier le self-hosted » → Ollama/local proposé avant tout cloud.
- « Réutiliser l'infra MCP existante plutôt qu'embarquer un LLM ».

L'IA apprend de ses erreurs si — et seulement si — le workflow prévoit un
mécanisme de feedback persistant.

---

## Permissions & filet de sécurité

Le travail itératif sur Docker/dev est ralenti par les prompts de permission. La
convention retenue sur les projets :

- **Allowlist large** (`Bash(*)`, `PowerShell(*)`, outils fichiers) + **denylist
  ciblée** sur le destructif (`rm -rf` sur paths système, `format`, fork-bomb,
  `push --force`, suppression de volumes nommés…). Voir le `settings.local.json`
  du kit.
- Sur certains projets, `defaultMode: bypassPermissions` est actif (aucun prompt).
- **Contrepartie obligatoire : commit après chaque étape logique** (toutes les
  5-10 min de travail productif), messages préfixés (`feat:`, `fix:`, `chore:`,
  `wip:`). Le filet de sécurité devient git : `git reset --hard <sha>` possible
  côté **développeur** en cas d'erreur.
- Pour une action **vraiment** destructive hors denylist : demander confirmation
  par **message texte** avant d'agir (pas via prompt de permission, qui est bypass).

---

## La structure du projet reflète le workflow

```
mon-projet/
├── CLAUDE.md                    ← Contrat de rôle (CLAUDE.md pour Claude Code,
│                                  AGENTS.md ailleurs ; stack, conventions, backlog)
│
├── specs/                       ← Espace cadrage / réflexion (JAMAIS de code ici)
│   ├── PROJET.md                ← Vision projet, specs, sources de données
│   ├── instructions/            ← LE CŒUR DU WORKFLOW
│   │   ├── _TEMPLATE.md             (gabarit d'instruction)
│   │   ├── feature-auth.md          (✓ livrée)
│   │   ├── feature-search.md        (✓ livrée)
│   │   ├── fix-navigation.md        (← correction en cours)
│   │   └── quality-workflow.md      ← outils qualité (doc, tests, rapport)
│   └── mock/                    ← Données figées pour dev/test (zéro appel API)
│
├── src/                         ← Code source (le développeur écrit ici)
├── scripts/quality-report.sh    ← Rapport qualité automatisé
└── .claude/settings.local.json  ← Permissions du runner (Claude Code par défaut)
```

Le dossier `specs/instructions/` est la trace complète de toutes les décisions
techniques du projet. Chaque feature a son fichier ; chaque fichier contient le
« pourquoi » et le « comment ». C'est de la documentation **vivante**, écrite
*avant* l'implémentation — pas après coup.

> Note : le nom de ce dossier importe peu (sur certains projets il diffère de `specs/`).
> C'est le **rôle** — espace de cadrage / réflexion, jamais de code — qui compte.

---

## Démarrer ou reprendre un projet — « init iakaframe »

La méthode s'amorce en une commande, sur un projet **neuf** comme **existant**.
Déclencheur : dire à Claude **« init iakaframe »** dans le répertoire.

- **Répertoire vide → nouveau projet.** Nom du dépôt = nom du dossier. On crée le
  dépôt Forgejo, on déploie la structure, premier commit, état des lieux `v0.1.0`,
  push. Puis on remplit `CLAUDE.md` et `specs/PROJET.md`.
- **Répertoire avec déjà du dev → reprise.** On déploie la structure *autour* du
  code existant (rien d'écrasé), on branche Forgejo si absent, on génère l'état des
  lieux de **reprise**, on en fait la synthèse et on propose la prochaine étape.

Orchestrateur : `iakaframe-onboard.ps1` (= `iakaframe-init` + `iakaframe-forgejo` +
commit + `iakaframe-snapshot`). Un projet déjà doté d'un `CLAUDE.md` : celui-ci prime.

**Auto-détection init ↔ update.** Les deux commandes interrogent l'API Forgejo : `init`
sur un dépôt déjà présent sur Forgejo bascule en `update`, et `update` sur un dépôt
absent (ou sans git local) bascule en `init`. Une seule chose à retenir, donc — le bon
comportement est choisi tout seul.

## Communication externe du portefeuille — iakaHub ↔ Discord

Le portefeuille dispose d'un **organe de communication externe unique** : **iakaHub**, un
démon local qui relie les agents (au travail dans les projets) à Stéphane (au loin) via
**Discord**. iakaHub est **à la fois un projet** de la famille (il a son code, son canal)
**et l'infrastructure de com de tout le portefeuille** : un seul démon route **tous** les
canaux de **tous** les projets. Le chemin nominal est **100 % local + Discord cloud** ;
la box peut être éteinte.

### Les deux sens de communication

- **Sortant — « mode absence » (agent → Stéphane).** Un agent qui a besoin d'une décision
  appelle `ask()`. Le **gate est en amont, chez Odin** : `ask()` consulte l'**état de
  présence d'Odin** (autorité portefeuille) *avant tout*. **Présent → terminal, zéro
  iakaHub.** **Absent → iakaHub → Discord** : la question remonte dans le **canal du
  projet concerné**, postée **sous le persona de l'agent** (webhook). Stéphane répond
  **dans un thread** ; la réponse repart vers **l'agent exact** qui attendait
  (**corrélation par thread**). *Un appel vers iakaHub = preuve d'absence.*
- **Entrant — « saisie directe d'Odin » (Stéphane → Odin).** Stéphane poste dans le canal
  **`#odin`** ; iakaHub **démarre lui-même un runner Odin** (session headless), lui passe
  le texte, récupère la réponse et la reposte **dans un thread** de `#odin`. C'est le
  **premier flux où iakaHub cesse d'être un simple relais pour devenir lanceur d'agent**.
  Ce sens est **indépendant du mode absence** : actif en permanence, sans consulter la
  présence d'Odin.

### Topologie des canaux (le serveur reflète la méthode)

Serveur Discord privé `iaka-portefeuille`, calqué sur les étages de la méthode :

```
📁 PORTEFEUILLE           ← l'étage au-dessus des projets
    #odin                 ← saisie directe d'Odin (Stéphane → runner)
📁 <PROJET>               ← UNE catégorie par projet
    #<projet>             ← canal unique du projet (mode absence : ses agents → Stéphane)
```

Un **canal = un projet**. Le canal ne porte **pas** l'agent émetteur : celui-ci est porté
par le **persona du message** (webhook, sortant) et par le **registre** (retour). `#odin`
n'est **pas** un projet (destinataire fixe = Odin, `cwd` = racine portefeuille) et **ne
compte pas** dans le nombre de projets remonté par `/health`.

### Règle d'or : ajouter un projet = zéro code

**Brancher un projet sur la com externe = 1 catégorie + 1 canal + 1 webhook + 1 ligne**
dans `config/routing.yaml` (iakaHub). Aucun code. Le YAML ne contient **que des alias**
(`webhook_ref`) ; les URLs de webhook et le token du bot vivent dans **`.env`**
(git-ignoré, **jamais commité**). L'alias `webhook_ref: <x>` se résout en variable
`DISCORD_WEBHOOK_<X>`. Périmètre par défaut = les **projets réellement coworkés** (actifs),
pas tout le portefeuille : on branche un canal quand le projet a un travail vivant.

### Posture & sécurité

- **Dégradation gracieuse** : iakaHub indisponible ou état « présent » → **repli terminal**
  automatique. Tout tourne **box éteinte**.
- **Cœur agnostique** : routeur/registre/`ask()` ne connaissent **aucun symbole Discord** ;
  l'adaptateur (Discord au MVP, Mattermost = contrat seul) est **injecté**.
- **Ports** : `:3041` = admin/health **local** (`127.0.0.1`) ; la face entrante Discord est
  une **WebSocket sortante** (Gateway) → **aucun port entrant**.
- **Runner d'agent = accès hôte au MVP** ; durcissement Docker = dette post-MVP assumée.
- **Provisionnement Discord = geste humain** (serveur, canaux, webhooks, token bot) —
  description de dépôt **ASCII** côté Forgejo.

Référence d'implémentation : projet **iakaHub** (`docs/passerelle-discord.md`,
`docs/provisionnement-discord.md`, `specs/instructions/passerelle-discord-agents.md` et
`specs/instructions/saisie-directe-odin-canal.md`).

## Git par défaut : Forgejo (iakabox)

Tout projet est versionné sur le **Forgejo auto-hébergé du homelab iakabox** —
cohérent avec la préférence self-hosted. Pattern :
`http://192.168.2.11:3001/sjupin/<repo>.git`, **HTTP + token** (le SSH de cette box
est inutilisable). Le token n'est **jamais** écrit en dur ni commité : variable
`$env:FORGEJO_TOKEN` ou `.git/config` local. Création de dépôt via l'API Forgejo
(description **ASCII uniquement**, sinon HTTP 422). Guide complet : `iakabox-usage.html`.

## Cycle de documentation — version & reprise

La doc d'état n'est pas écrite « quand on y pense » : elle est régénérée **à deux
moments précis**, par `iakaframe-snapshot.ps1` :

1. **À chaque changement de version** (`-Reason version -Version vX.Y.Z`).
2. **À chaque pause de dev / préparation de reprise** (`-Reason pause` puis
   `-Reason reprise`).

Le script produit `specs/etat-des-lieux.md` + `.html` à partir des faits git (version,
branche, derniers commits, arbre propre/sale, nb de fichiers) et tient un **journal
append-only**. Les faits sont automatiques ; **le rôle de cadrage / réflexion complète le récit de reprise**
(ce qui vient d'être fait, ce qui reste, la prochaine étape concrète). Ainsi, reprendre
un projet après une pause = lire `etat-des-lieux.md`, pas fouiller sa mémoire.

**Commande « update iakaframe »** — le checkpoint en une fois : `iakaframe-update.ps1`
régénère l'état des lieux **puis** fait un **commit global** (`git add -A` + commit) et
**push**. C'est le geste à faire à chaque changement de version et à chaque pause/reprise
(`-Reason version|pause|reprise`), ou comme simple point de sauvegarde.

### Version mineure — revue complète + doc qualité versionné

À chaque passage d'une **version MINEURE** (ex. `v0.9 → v0.10`), en plus du cycle ci-dessus :

1. **Revue de code complète + revue qualité** (gate Legolas élargi) : pas seulement le diff
   du dernier lot, mais un balayage de l'état réel du codebase au jalon — correctness, bugs,
   robustesse, sécurité (socle), invariants d'architecture, plus la chaîne qualité fraîche
   (tests, lint, typage, couverture, clippy/fmt). Verdict net PASS/FAIL.
2. **Une fois le gate PASS**, **générer le DOC QUALITÉ de la version** dans le **répertoire
   `doc`/`docs` du projet** (ex. `docs/qualite/vX.Y.0.md`) : périmètre de la version,
   résultats qualité (chiffres réels), constats de revue + leur traitement, invariants
   vérifiés, recette manuelle restante, différés connus, verdict + candidate.

Une version mineure est un **jalon** : on la scelle par une revue complète et une **trace
qualité durable**, pas seulement par le gate du dernier lot.

### Mémoire humaine — documentation des fichiers importants dans AppFlowy

En plus de l'état des lieux (mémoire **de reprise**, dans le dépôt), on tient une **mémoire
humaine** des idées et projets dans **AppFlowy** auto-hébergé sur l'iakabox (instance
`notes.bigserver.local`, hôte « bigserver »). But : garder une **trace lisible, navigable et
durable** des décisions et de la documentation structurante, **hors du dépôt**, consultable
sans cloner ni lire du Markdown brut.

**Quand.** Aux **mêmes moments** que l'état des lieux — à chaque **changement de version** et
à chaque **pause / reprise**. La publication AppFlowy **double** la régénération de la doc
d'état : on ne documente jamais « quand on y pense ».

**Quoi (fichiers importants = docs structurants du projet).** `CLAUDE.md`, `specs/PROJET.md`,
`specs/instructions/*`, `specs/etat-des-lieux.md`, `docs/qualite/*`. Pas le code, pas les
fichiers générés : seulement la **couche narrative et décisionnelle**.

**Comment (structure AppFlowy).** **Un espace par projet** (au nom du projet) → une **page
« vue d'ensemble »** (synthèse + liens) → **une sous-page par fichier important** (contenu du
fichier, rafraîchi). Idempotent et non destructif : créer si absent, mettre à jour sinon —
jamais d'écrasement aveugle, jamais de page fantôme.

**Avec quoi.** Une skill dédiée `iakaframe-appflowy-doc` (calquée sur
`iakaframe-log-conversation` : petit CLI Node, **config par variables d'env**, **aucun secret
en dépôt**). Elle s'authentifie à l'API AppFlowy (GoTrue email+mot de passe → token), provisionne
si besoin, puis crée/met à jour espaces et pages via l'API `/api/.../page-view`. C'est un
**geste machine** : la mémoire humaine est **alimentée par instrumentation**, pas tenue à la main.

---

## Ce que cette méthode n'est pas

- **Pas du « vibe coding ».** Pas de prompt vague suivi d'une acceptation aveugle.
  Chaque ligne est spécifiée, vérifiée par des outils, validée par un humain.
- **Pas de l'automatisation aveugle.** L'IA ne tourne pas en boucle. Chaque cycle
  passe par le développeur. Le feedback humain est structurel, pas optionnel.
- **Pas un remplacement du développeur.** Le développeur fait moins de frappe et
  plus de décisions. Son temps se déplace de l'implémentation vers l'architecture,
  la revue et le jugement. Le métier monte en abstraction.

---

## En résumé

L'IA sans workflow produit du code jetable. L'IA dans un workflow produit du
logiciel.

Trois piliers : **séparation des rôles** (réflexion ≠ exécution), **instructions
écrites** (specs vérifiables), **vérification automatique** (tests, linting,
couverture). Le développeur reste le décideur à chaque étape.

**La qualité n'est pas dans le modèle. Elle est dans la méthode.**
