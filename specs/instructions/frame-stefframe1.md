# Instruction — Frame de release `StefFrame1`

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut en fin de doc.
> Réf. méthode : `methode-de-travail.md`, `methods/iakaframe.md`, `library/` (taxonomie GUI).

---

## 1. Besoin (reformulé)

Créer, dans le dépôt iakaframe (`/Users/sjupin/work/iakaframe`), un répertoire
`frames/releases/StefFrame1/` qui **rassemble de façon ordonnée l'ENSEMBLE de la MÉTHODE
+ des KITS + de l'INSTALL** telle que le décideur l'utilise, **décomposé en autant de
fichiers `.md` que d'éléments**, avec une **ventilation conforme à la taxonomie
iakaframeGUI**.

**Horizon** : produire un **ZIP** transmis au fils du décideur — la **méthode SANS le GUI**,
**portable** (utilisable sans l'infra homelab du décideur).

---

## 2. Périmètre — DANS / HORS

**DANS le scope**
- La **méthode canon** (narratif + assemblage de discipline).
- Les **atomes `library/`** ventilés par la taxonomie GUI.
- **Tous les kits d'install** des runners = **`iakaframe-claude`** (gabarit projet + global + runtime `.claude/`) **+ `codex` + `ollama` + `openwebui` + `anythingllm`**, tous déparamétrés.
- Les **éléments de méthode de la conf globale** `~/.claude/` (CLAUDE.md global, skills, contrats d'agents, hooks) — **extraits et généralisés**.
- Un **INDEX** du frame + un **cadre de ZIP**.

**HORS scope**
- Écrire du code de production (rôle de Gimli, pas de cette instruction).
- Le **GUI** iakaFrameGUI (voir §8, exclusions).
- Rouvrir les arbitrages du décideur (§0).

---

## 0. Arbitrages du décideur (NE PAS rouvrir)

1. **Install** = `kit-claude/` (générique, portable) **+** tous les éléments de MÉTHODE de
   `~/.claude/` (notamment `~/.claude/CLAUDE.md` et `~/.claude/skills/`), **épurés** du
   spécifique-machine / homelab / projets perso.
2. **Déparamétrer / généraliser** : livrable portable — retirer/neutraliser secrets, tokens,
   IP LAN, références Forgejo/iakabox, noms de projets perso, chartes/infra perso.
3. La **production** est exécutée par **Gimli** ; cette instruction ne produit pas les fichiers du frame.

---

## 3. Ventilation cible (taxonomie iakaframeGUI)

La taxonomie est **confirmée par deux sources** :
- le repo — `library/` contient les pools : `personas/`, `roles/`, `principles/`, `rituals/`,
  `guardrails/`, `scaffolds/`, `skills/`, `workflows/` (atomes) ;
- le GUI — `~/work/iakaFrameGUI/src/forge/refs.ts` charge et valide les pools
  `principles / rituals / guardrails / roles / scaffolds` (`idsOf(api, <PoolType>)`), plus
  `personas` (onglet Team) et `workflows` (collection éditable). La couche d'assemblage lit
  `methods`, `teams`, `bindings` (et `kits` comme manifeste de livrable).

**Arborescence exacte à matérialiser** (miroir 1:1 des pools, install rangée sous `kits/`) :

```
frames/releases/StefFrame1/
  README.md                         # INDEX : ventilation + sommaire + quickstart install
  methode-de-travail.md             # le canon narratif (généralisé)
  principles/   <id>.md             # atomes — 1 .md par élément
  rituals/      <id>.md
  guardrails/   <id>.md
  roles/        <id>.md
  personas/     <id>.md
  scaffolds/    <id>.md
  workflows/    <id>.md
  skills/       <skill-id>/SKILL.md # skills = DOSSIERS (contrainte d'install, cf. §7)
  methods/      iakaframe.md        # assemblage — discipline (ids only)
  teams/        iakaframe-8.md      # assemblage — casting
  bindings/     iakaframe-claude-default.md
  kits/                             # UN sous-dossier par runner (5 kits, tous généralisés)
    iakaframe-claude/               # gabarit d'INSTALL claude (§6)
    iakaframe-codex/
    iakaframe-ollama/
    iakaframe-openwebui/
    iakaframe-anythingllm/
    iakaframe-<runner>.md           # + les 5 manifestes de kit (à côté des dossiers)
```

**Justification de l'ordre** : d'abord les **atomes** (les briques : principes → rituels →
gardes-fous → rôles → personas → scaffolds → workflows), puis la **couche d'assemblage**
(methods/teams/bindings qui référencent les atomes par id), enfin le **kit d'install** qui
matérialise l'assemblage sur un runner. C'est l'ordre de lecture « du plus élémentaire au plus
composé », cohérent avec l'intégrité référentielle du GUI (les ids doivent exister avant d'être
référencés).

---

## 4. Inventaire EXHAUSTIF — atomes `library/`

Source unique de vérité des atomes : **`library/`** (superset des `~/.claude/skills/`).
Chaque fichier ci-dessous est **copié puis généralisé** (§9) vers le pool homonyme du frame.
Nom cible = **même id kebab-case** (§7).

### principles/ (14) — tous DANS
`cadrage-avant-code`, `commits-versionnement`, `confirmation-actes-destructifs`,
`documentation`, `gestion-backlog`, `identite-badges`, `isolation-docker`, `langue`,
`mock-en-dev`, `mvp-first`, `perimetres-etanches`, `qualite`, `reutilisation-existant`,
`self-hosted-first`.
> `documentation.md` et `gestion-backlog.md` contiennent des motifs perso → **généraliser** (§9).

### rituals/ (5) — tous DANS
`iakastart`, `init`, `log-conversation`, `snapshot`, `update`.
> `init.md` et `log-conversation.md` contiennent des motifs perso (Forgejo/MQTT) → **généraliser**
> (neutraliser l'infra ; conserver la mécanique de rituel).

### guardrails/ (3) — tous DANS
`delegation`, `identity`, `perimeter`.

### roles/ (8) — tous DANS
`cadrage`, `coordination`, `deploiement`, `design`, `dev`, `documentation`, `portefeuille`, `qualite`.

### personas/ (8 + template) — tous DANS
`aragorn`, `gandalf`, `gimli`, `helm`, `legolas`, `loki`, `nathalie`, `odin`, **+ `_TEMPLATE.md`**
(gabarit de persona — utile au fils pour en créer). Plusieurs contiennent des motifs perso
(`aragorn`, `nathalie`, `loki`, `odin`) → **généraliser**.

### scaffolds/ (2) — tous DANS
`portefeuille`, `projet`.
> `portefeuille.md` contient des motifs perso → **généraliser**.

### workflows/ (1) — DANS
`iakaframe-3phases`.

### skills/ (16 dans `library/skills/`) → **16 DANS**, **0 HORS** (décision décideur)
Toutes les skills sont **incluses et généralisées** (§9) — y compris les 4 couplées infra, dont
on remplace l'infra perso par des **placeholders**.
| Skill (dossier) | Décision | Généralisation |
|---|---|---|
| `iakastart` | **DANS** | — |
| `iakaframe-odin` | **DANS** | paths `C:\work` |
| `iakaframe-aragorn` | **DANS** | Slack/perso |
| `iakaframe-cadrage` | **DANS** | — |
| `iakaframe-qualite` | **DANS** | — |
| `iakaframe-deploiement` | **DANS** | infra |
| `iakaframe-nathalie` | **DANS** | AppFlowy |
| `iakaframe-init` | **DANS** | Forgejo / scripts onboard |
| `iakaframe-etat-des-lieux` | **DANS** | — |
| `iakaframe-update` | **DANS** | Forgejo |
| `iakaframe-learning` | **DANS** | — |
| `iakaframe-docker` | **DANS** | — |
| `iakaframe-forgejo` | **DANS** | `<GIT_HOST>`/`<GIT_REMOTE_URL>`/`<GIT_TOKEN>` au lieu de iakabox/Forgejo |
| `iakaframe-log-conversation` | **DANS** | `<MQTT_BROKER>` / `<COUCHDB_URL>` au lieu des hôtes réels |
| `iakaframe-appflowy-doc` | **DANS** | `<APPFLOWY_URL>` / `<APPFLOWY_WORKSPACE>` au lieu de l'instance perso |
| `iakaframe-naonedge` | **DANS** | `<CHARTES_DIR>` au lieu de `~/work/iakacharte` ; retirer les noms de chartes perso (Cinabre/NaonEdge) ou les rendre exemples génériques |

- **`skills/README.md`** (index des skills) → **DANS**, liste les **16** skills (déparamétrées).
- **Scripts runtime `.mjs`** : `iakalog.mjs` (log-conversation) et `appflowy-doc.mjs` (appflowy-doc)
  → **DANS** dans la copie installable du kit (`kits/iakaframe-claude/.claude/skills/<id>/`),
  **généralisés** (hôtes/endpoints → placeholders §9). `test.mjs` (harnais de test) → **HORS**.
  Le **pool documentaire** `skills/<id>/` n'embarque que le `SKILL.md`.

---

## 5. Inventaire — méthode canon + assemblage

| Élément | Source | Cible frame | Décision |
|---|---|---|---|
| Canon narratif | `methode-de-travail.md` | `methode-de-travail.md` | DANS (généraliser : retirer la liste de projets perso ligne ~5-6) |
| Méthode (discipline) | `methods/iakaframe.md` | `methods/iakaframe.md` | DANS |
| Team (casting) | `teams/iakaframe-8.md` | `teams/iakaframe-8.md` | DANS |
| Binding défaut | `bindings/iakaframe-claude-default.md` | `bindings/iakaframe-claude-default.md` | DANS |
| Manifestes de kit (5) | `kits/iakaframe-{claude,codex,ollama,openwebui,anythingllm}.md` | `kits/iakaframe-<runner>.md` | DANS (généraliser) |
| Kit codex | `kits/iakaframe-codex/` (`AGENTS.md`, `MODELES.md`, `README.md`, `specs/PROJET.md`, `specs/instructions/_TEMPLATE.md`) | `kits/iakaframe-codex/…` | DANS (généraliser) |
| Kit ollama | `kits/iakaframe-ollama/` (idem structure codex) | `kits/iakaframe-ollama/…` | DANS (généraliser) |
| Kit openwebui | `kits/iakaframe-openwebui/` (`AGENTS.md`, `MODELES.md`, `README.md`, `models/*.json` ×8, `specs/…`) | `kits/iakaframe-openwebui/…` | DANS (généraliser ; scrub des `models/*.json`) |
| Kit anythingllm | `kits/iakaframe-anythingllm/` (`AGENTS.md`, `MODELES.md`, `README.md`, `prompts/*.md` ×8, `specs/…`) | `kits/iakaframe-anythingllm/…` | DANS (généraliser ; scrub des `prompts/*.md`) |

> **Décision décideur** : on inclut **les 5 kits runner** (claude + codex + ollama + openwebui +
> anythingllm), tous déparamétrés. Le kit **claude** garde en plus l'agrégation `~/.claude` (§6).

---

## 6. Inventaire — INSTALL (kit-claude + conf globale `~/.claude`)

Le kit d'install va sous `frames/releases/StefFrame1/kits/iakaframe-claude/`. Il agrège le
**gabarit versionné** (`kits/iakaframe-claude/`) **et** les éléments de MÉTHODE de `~/.claude/`,
tous **généralisés** (§9).

| Élément | Source | Cible sous `kits/iakaframe-claude/` | Décision |
|---|---|---|---|
| Contrat projet | `kits/iakaframe-claude/CLAUDE.md` | `CLAUDE.md` | DANS (généraliser : Forgejo/IP/paths) |
| Contrat global méthode | `kits/iakaframe-claude/global/CLAUDE.md` | `global/CLAUDE.md` | DANS (généraliser : `C:\work\iakaframe`, `192.168.*`, Forgejo, iakabox) |
| Notice global | `kits/iakaframe-claude/global/README.md` | `global/README.md` | DANS (généraliser paths) |
| Hooks identité/périmètre | `kits/iakaframe-claude/global/hooks/*` (`.mjs` + `.ps1`) | `global/hooks/*` | DANS (garde-fous méthode ; généraliser tout chemin/host) |
| Commandes slash | `kits/iakaframe-claude/.claude/commands/{iaka,learning}.md` | `.claude/commands/*.md` | DANS (généraliser) |
| Settings local | `kits/iakaframe-claude/.claude/settings.local.json` | `.claude/settings.local.json` | DANS **seulement si** exempt de secret/host après scrub — sinon fournir un `settings.local.json.example` neutralisé |
| Contrats d'agents (8) | `~/.claude/agents/{odin,aragorn,gandalf,gimli,legolas,helm,loki,nathalie}.md` | `.claude/agents/*.md` | DANS (généraliser) — nécessaires pour que le fils dispatch la team dans Claude Code |
| Skills runtime | (issues de `library/skills/`, §4) | `.claude/skills/<skill-id>/SKILL.md` | DANS — **copie installable** des 12 skills retenues (dossiers, cf. fait vérifié §7) |
| Specs gabarit | `kits/iakaframe-claude/specs/{PROJET.md,instructions/_TEMPLATE.md}` | `specs/...` | DANS (généraliser) |

**Éléments de `~/.claude/` explicitement HORS** (spécifique perso / secrets) :
`~/.claude/SECRETS.env`, `~/.claude/settings*.json` (perso), `~/.claude/bootstrap-work.ps1`,
`~/.claude/identity-guard.ps1` / `identity-remind.ps1` **runtime** (déjà couverts, généralisés,
par `global/hooks/`), `~/.claude/projects/**` (mémoires de projets perso), `~/.claude/_backup-*`.

> **Note de cohérence** : la source des skills est **`library/skills/`** (canonique), pas
> `~/.claude/skills/` (copie runtime). On les dépose à la fois en **pool documentaire**
> (`skills/<id>/SKILL.md`) et en **copie installable** sous `kits/iakaframe-claude/.claude/skills/`.

---

## 7. Règle de nommage

- **1 `.md` par élément**, nom = **id kebab-case** de l'atome dans `library/<type>/` (ex.
  `principles/mvp-first.md`, `roles/cadrage.md`).
- **Skills = DOSSIERS** : `skills/<skill-id>/SKILL.md` (id complet, ex. `iakaframe-cadrage/`).
  *Fait vérifié (§10)* : une skill Claude Code est un **dossier contenant `SKILL.md`**,
  installé sous `~/.claude/skills/` (perso) ou `.claude/skills/` (projet) ; aplatir en
  `<id>.md` casserait l'installabilité. On conserve donc la forme dossier.
- **Front-matter conservé** : ne pas casser les `---` YAML des atomes/skills (le GUI et Claude
  Code les parsent).
- **Assemblage** : garder les noms de fichiers sources (`iakaframe.md`, `iakaframe-8.md`,
  `iakaframe-claude-default.md`).

---

## 8. Exclusions explicites

- **GUI** : tout `~/work/iakaFrameGUI/**` (dont `src/forge/refs.ts`, `backend`, vocab
  runner/node de déploiement), tout artefact/build du GUI. **Aucun** contenu GUI dans le frame.
- **Binaires / lourds** : `node_modules/`, `.git/`, `dist/`, `build/`, images, archives, `.env`.
- **Harnais de test** : `test.mjs` (§4). Les scripts `iakalog.mjs` / `appflowy-doc.mjs` sont
  **conservés** dans la copie installable, généralisés (§4/§9).
- **Secrets & perso** : `SECRETS.env`, tokens, settings perso, mémoires `~/.claude/projects/**`.

> **Ne sont PLUS exclus** (décision décideur) : les 4 skills couplées infra **et** les kits des
> autres runners — tous **inclus et déparamétrés** (§4, §5). Le frame vise le livrable **le plus
> complet**.

---

## 9. Règle de déparamétrage (généralisation)

Le frame doit être **portable**. Remplacer chaque motif par un **placeholder générique** (ou
supprimer la phrase si elle n'a de sens que dans l'infra du décideur). Motifs → remplacement :

| Motif à neutraliser | Remplacement |
|---|---|
| `192.168.2.11`, toute IP LAN, `:3001` | `<GIT_HOST>` / `<votre-serveur-git>` |
| `http://192.168.2.11:3001/sjupin/<repo>.git` | `<GIT_REMOTE_URL>` |
| `FORGEJO_TOKEN`, `$env:FORGEJO_TOKEN`, tout token | `<GIT_TOKEN>` |
| `Forgejo`, `iakabox`, « homelab », `iakabox-usage.html` | « votre dépôt git » / retirer la mention infra |
| `C:\work\iakaframe`, `C:\iakaframe`, `~/work/iakaframe`, `/Users/sjupin/...` | `<IAKAFRAME_HOME>` |
| `Stéphane`, `sjupin`, `sjupinDGI@gmail.com` | `<le décideur>` / `<vous>` |
| Projets perso : `IAKA Vod`, `iakaVODdash`, `robotimmo`, `iakaAFstorage`, `iakabox`, `iakaJarvis`, `iakaVintageStory` | « vos projets » / retirer l'énumération |
| `~/work/iakacharte`, `design-*` (catalogue de chartes) | `<CHARTES_DIR>` |
| `naonedge`, `Cinabre`, `NaonEdge` (noms de chartes perso) | exemples génériques (ex. `<charte-defaut>`) — la mécanique reste |
| `AppFlowy` / instance + workspace | `<APPFLOWY_URL>` / `<APPFLOWY_WORKSPACE>` |
| broker `MQTT` (hôte/topic) | `<MQTT_BROKER>` / `<MQTT_TOPIC>` |
| `CouchDB` (URL/base) | `<COUCHDB_URL>` |
| `Slack` (webhook/canal perso) | `<SLACK_WEBHOOK>` ou retirer la mention |

> Les 4 skills couplées infra sont **conservées** (décision décideur) : on **neutralise l'infra
> par placeholder**, on ne supprime pas la skill. La skill doit rester **fonctionnelle une fois
> les placeholders renseignés** par le fils.

Principe : **on neutralise l'infra, on conserve la mécanique de méthode.** Un placeholder doit
rester **compréhensible** (le fils doit savoir quoi mettre à la place).

---

## 10. Fait vérifié (web) — cité en source

- **Skills Claude Code = dossiers avec `SKILL.md`**, installés sous `~/.claude/skills/`
  (perso, tous projets) ou `.claude/skills/` (projet, commité) ; seul `SKILL.md` est requis,
  scripts/assets optionnels ; prise en compte à chaud. → **impacte §7** (skills en dossiers) et
  garantit que le ZIP est **installable tel quel** par le fils.
  Sources : [Extend Claude with skills — Claude Code Docs](https://code.claude.com/docs/en/skills),
  [Agent Skills — Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview),
  [Where Are Claude Skills Stored](https://www.agensi.io/learn/where-are-claude-skills-stored).
- **Aucun autre fait externe ne conditionne ce cadrage** : l'inventaire et la ventilation
  reposent sur des sources **locales** (repo + `~/.claude`) — pas de dépendance de version/compat
  à vérifier en ligne.

---

## 11. INDEX du frame (`README.md`)

`frames/releases/StefFrame1/README.md` doit contenir :
1. **Titre** + une phrase : « La méthode iakaframe, portable, sans le GUI. »
2. **La ventilation** : tableau pool → rôle (principles, rituals, guardrails, roles, personas,
   scaffolds, workflows, **16 skills** ; puis methods, teams, bindings, **5 kits runner**).
3. **Sommaire** : liens relatifs vers chaque fichier du frame.
4. **Quickstart install (Claude Code)** : copier `kits/iakaframe-claude/global/CLAUDE.md` →
   `~/.claude/CLAUDE.md` ; copier `kits/iakaframe-claude/.claude/skills/*` → `~/.claude/skills/` ;
   copier `.claude/agents/*` → `~/.claude/agents/` ; le tout avec les placeholders `<...>` à
   renseigner. **Aucune** dépendance à l'infra du décideur.
5. **Comptages** attendus (repris du §12).

---

## 12. Critères de complétude VÉRIFIABLES (pass/fail)

Gimli doit produire un frame qui passe **tous** ces tests (commandes indicatives depuis la racine repo) :

**A. Couverture des atomes (comptages exacts)**
- `principles/` = **14** `.md` ; `rituals/` = **5** ; `guardrails/` = **3** ; `roles/` = **8** ;
  `personas/` = **9** (8 personas + `_TEMPLATE.md`) ; `scaffolds/` = **2** ; `workflows/` = **1**.
- `skills/` = **16** dossiers avec `SKILL.md` + `skills/README.md` (index à jour, 16 skills listées).
- `methods/` = 1, `teams/` = 1, `bindings/` = 1 ; `methode-de-travail.md` présent.
- `kits/` = **5** sous-dossiers (`iakaframe-{claude,codex,ollama,openwebui,anythingllm}/`) +
  **5** manifestes `iakaframe-<runner>.md`. Contenu attendu : `openwebui/models/*.json` = **8**,
  `anythingllm/prompts/*.md` = **8**.
- **Test** : pour chaque `library/<type>/<id>.md` (aucune exclusion d'atome — §4/§8), il existe
  `frames/releases/StefFrame1/<type>/<id>.md` (skills : `<id>/SKILL.md`, **16/16**).

**B. Déparamétrage (grep = 0 occurrence)**
```
grep -rIniE '192\.168|:3001|FORGEJO|forgejo|iakabox|sjupin|Stéphane|iakacharte|naonedge|Cinabre|AppFlowy|MQTT|CouchDB|C:\\\\work|/Users/sjupin|~/work/iakaframe' frames/releases/StefFrame1/
```
→ **0 résultat**. (Tolérance : un placeholder `<...>` n'est pas un match.)

**C. Zéro GUI / zéro secret**
- `grep -rIl 'iakaFrameGUI\|refs\.ts\|forge/backend'` → **0 fichier**.
- Aucun `node_modules/`, `.git/`, `dist/`, `build/`, `*.env`, `SECRETS`, `test.mjs` dans le frame.
- Les seuls `.mjs` tolérés = `iakalog.mjs` / `appflowy-doc.mjs` (généralisés) + les hooks
  `identity-guard.mjs` / `perimeter-guard.mjs` ; tous doivent passer le grep **B** (0 motif perso).

**D. Autonomie du ZIP**
- Le dossier `frames/releases/StefFrame1/` se **zippe** et s'**ouvre** sans dépendance externe.
- Aucun lien absolu vers l'infra du décideur ; tout renvoi interne est **relatif** au frame.
- Les skills conservent la forme **dossier + `SKILL.md`** (installable à chaud).

**E. Cohérence référentielle**
- Les ids référencés par `methods/iakaframe.md` (principles/rituals/guardrails/roles/scaffolds/
  workflow) et `teams/iakaframe-8.md` (personas) **existent tous** dans les pools du frame
  (mêmes règles que `refs.ts`), **exception** : le workflow reste valide (repli canonique).

---

## 13. Cadre du ZIP final

- **Nom** : `StefFrame1.zip`.
- **Contenu** : exactement l'arbre `frames/releases/StefFrame1/` (README inclus).
- **NE doit PAS contenir** : GUI, `.git`, `node_modules`, binaires, `test.mjs`, secrets/tokens,
  identifiants perso, IP LAN. (Les 5 kits runner et les 16 skills — dont les 4 déparamétrées — **sont inclus**.)
- **Doit** : s'ouvrir standalone, s'installer dans Claude Code via le quickstart du README, sans
  l'infra du décideur.

---

## 14. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `frame-stefframe1.md` : ventilation GUI, inventaire exhaustif (**16 skills + 5 kits**), nommage, déparamétrage, exclusions, critères vérifiables, cadre ZIP | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation** (chemin:ligne) :
- `library/` (taxonomie source) : `methods/iakaframe.md:5` (pools référencés), `teams/iakaframe-8.md:4` (personas).
- Taxonomie GUI : `~/work/iakaFrameGUI/src/forge/refs.ts:116` (pools `idsOf`), `refs.ts:65` (personas).
- Install / global : `kits/iakaframe-claude.md:7` (emits), `kits/iakaframe-claude/global/README.md:6` (sens de déploiement), `kits/iakaframe-claude/global/CLAUDE.md:1` (contrat global à généraliser).
- Motifs perso à neutraliser : `~/.claude/CLAUDE.md` (Forgejo/IP/token/paths), `kits/iakaframe-claude/CLAUDE.md` (bloc « Dépôt git : Forgejo »), skills infra `library/skills/iakaframe-{forgejo,log-conversation,appflowy-doc,naonedge}/SKILL.md`.

**Points ouverts : AUCUN.** Le décideur a tranché — livrable **le plus complet** : 16 skills DANS
(4 déparamétrées, 0 exclue) + 5 kits runner DANS (déparamétrés).

---

## Statut

**VALIDÉ — prêt pour Gimli** (aucun point ouvert). À la validation « JALON VALIDÉ » → dispatch
**Gimli** pour produire `frames/releases/StefFrame1/` puis `StefFrame1.zip` selon les critères §12–§13.
