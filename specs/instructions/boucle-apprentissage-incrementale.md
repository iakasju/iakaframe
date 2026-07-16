# Instruction — Boucle d'apprentissage incrémentale et permanente du portefeuille

> **Phase** : P1 — Cadrage · **Cadreur** : l'architecte-cadreur (Gandalf) · **Exécutant** : le développeur-devops (Gimli).
> **Statut** : **VALIDÉ — prêt pour Gimli** (jalon de cadrage franchi ; les 6 questions d'arbitrage
> ont été tranchées par le décideur le 2026-07-16, cf. § 13). L'implémentation peut démarrer selon le
> découpage T1..T10 (§ 12).
> **Date de cadrage** : 2026-07-16 · **Date de validation** : 2026-07-16. Français ; code et identifiants en anglais.
>
> **Références**
> - Vision & rôles : `../PROJET.md` *(si présent)*, `methode-de-travail.md` (cycle instruction→exécution,
>   cadence d'état des lieux, jalons).
> - Mémoire fichier existante du runner Claude Code : `~/.claude/projects/<scope>/memory/`
>   (fiches typées `user|feedback|project|reference` à frontmatter + `MEMORY.md` index par ligne),
>   dont la mémoire portefeuille au scope `~/work` (~43 fiches).
> - Skills iaka* existantes (cible de promotion) : `../../library/skills/` (ex. `iakaframe-aragorn`),
>   et la couche CLI de la bibliothèque : `./cli-bibliotheque-verbes.md`.
> - Signal neuf : canal Discord `#odin` (saisie directe d'Odin, porté par iakaHub) —
>   `iakaHub/docs/passerelle-discord.md`, instruction `iakaHub/specs/instructions/` (saisie directe d'Odin).
> - État de l'art vérifié le 2026-07-16 (§ 11) — mécanisme du **Hermes Agent** de **Nous Research**
>   (inspiration ; **aucune dépendance** à Nous/Honcho n'est introduite).

---

## 1. Objectif — le vrai saut à graver

Donner au portefeuille une **boucle d'apprentissage incrémentale et permanente**, **agnostique du
runner**, qui **améliore en continu la connaissance qu'un agent (Odin / le runner actif) a du
décideur (Stéphane) et de ses activités** — sans jamais dépendre d'un service tiers.

**Le vrai saut** : aujourd'hui la connaissance du décideur est **fragmentée par scope de répertoire**
(la mémoire du runner est indexée par dossier de session ; travailler dans un projet rend **aveugle**
à la connaissance portefeuille) et **capturée ad hoc** (l'écriture mémoire est opportuniste, pas
rituelle). On grave donc **deux inversions** :

1. **Un canon portefeuille UNIQUE**, chargé **quel que soit le répertoire courant** — comme Hermes
   n'a qu'un seul `~/.hermes/` quel que soit le projet. Fin de la cécité par scope.
2. **Une capture CADENCÉE** (rituel de clôture) qui transforme les **corrections répétées** en
   entrées mémoire compactes et les **procédures récurrentes** en **skills** — greffée sur la cadence
   d'état des lieux que la méthode **impose déjà** (pause / changement de version).

**Ce n'est PAS** un nouveau moteur de mémoire vectorielle, ni un service cloud, ni un remplacement de
la mémoire fichier existante. C'est une **couche de consolidation + un rituel** posés **au-dessus de
l'existant**, en fichiers plats + recherche plein-texte, self-hosted de bout en bout.

---

## 2. Problème (avant la solution)

Le runner Claude Code dispose déjà d'une mémoire fichier structurellement proche de Hermes
(`USER.md` + `MEMORY.md`) : fiches typées à frontmatter + un `MEMORY.md` index. Mais **quatre
manques** empêchent une vraie boucle d'apprentissage permanente :

1. **Fragmentation par scope.** La mémoire est indexée **par répertoire de session** (~15 scopes).
   Entrer dans un projet coupe l'agent de la connaissance portefeuille (`~/work`, ~43 fiches). Il n'y a
   **pas de canon unique** toujours chargé. → *C'est le manque structurant.*
2. **Capture ad hoc, pas rituelle.** L'écriture mémoire est opportuniste. Il n'existe **aucune revue
   de fin de session imposée** qui extrait les corrections répétées et les procédures récurrentes.
3. **Pas de rappel bon marché sur l'historique brut.** Aucune recherche plein-texte sur les
   transcripts passés : tout ce qui n'entre pas dans le prompt est **perdu**.
4. **Profil décideur non consolidé.** Les faits « qui est Stéphane » sont éparpillés en fiches
   `stephane-*`, sans tête unique curée sous budget de taille.

**Besoin (formulé par le décideur)** : reproduire les **rouages agnostiques** du Hermes Agent —
deux états plafonnés toujours chargés, une boucle de capture cadencée, un rappel plein-texte sur
l'historique, la skill comme cible de promotion, un garde de consentement, un provider externe
optionnel derrière une interface — **en réutilisant l'existant iakaframe** (mémoire fichier, skills,
règle de confirmation, cadence d'état des lieux) et **sans aucune dépendance** à Nous/Honcho/Mem0.

---

## 3. Frontière à graver : le CANON (agnostique) vs le RUNNER (implémentation)

La clé de l'agnosticisme est de séparer **la donnée** (un canon en fichiers plats, lisible par
n'importe quel runner) de **qui la lit/écrit** (le binding d'un runner donné).

| Élément | Nature | Où | Agnostique ? |
|---|---|---|---|
| **Canon portefeuille** (profil + registre + transcripts + candidats) | **Donnée** en fichiers plats + FTS | `$IAKA_MEMORY_HOME` (défaut `~/.iaka/memory/`) | **OUI** — Markdown + texte, aucun runner |
| Geste **`open`** (charge le canon à l'ouverture, quel que soit le scope) | Binding runner | côté runner (Claude Code : `SessionStart`) | binding par runner |
| Geste **`recall <query>`** (recherche plein-texte sur transcripts) | Petit utilitaire zéro-dep autonome | invocable à la main / hook / script | **OUI** |
| Geste **`close`** (revue de clôture → **réservoir de propositions typées**) | Petit utilitaire zéro-dep autonome | déclenché par le rituel (ou à la main) | **OUI** |
| **Réservoir de propositions** (file d'amendements typés) | **Donnée** en fichiers plats (substrat neutre) | `$IAKA_MEMORY_HOME/proposals/` | **OUI** — propriété de personne |
| **Vues** du réservoir (revue humaine) | Fenêtres **interchangeables & optionnelles** | **CLI** (baseline) **ou** **IakaCockpit** | **OUI** — aucune propriétaire |
| Provider user-model externe (Honcho, Mem0…) | Adaptateur optionnel | derrière interface `provider` | **OUI** (nul par défaut) |

> **Invariant de frontière à graver** : le **canon est un substrat de fichiers NEUTRE, propriété de
> personne** — ni Claude Code, ni iakaHub, ni une CLI. Il **ne vit pas sous `~/.claude/`** (ce serait
> coupler la donnée à Claude Code) mais à un chemin **agnostique** (`$IAKA_MEMORY_HOME`), en
> **fichiers plats** qu'un `AGENTS.md` (codex, ollama…) lira aussi bien qu'un `CLAUDE.md`. **Un seul
> canon par décideur/machine** (pas par scope) — c'est la réponse directe à la fragmentation.
> Les gestes `open`/`recall`/`close`/`memory` sont de **PETITS UTILITAIRES ZÉRO-DEP AUTONOMES** :
> invocables **à la main, par hook, par script, ou par iakaHub** — **aucun composant ne les
> « héberge »**, aucun n'est un centre/hub imposé (principe iaka : un ensemble d'outils **composables**,
> jamais un hub obligatoire — vaut pour iakaHub comme pour l'iakabox). **iakaHub n'est PAS un porteur** :
> il est **contributeur OPTIONNEL** de la source `#odin` (§ 4.2, T7). La boucle complète tourne **sans
> iakaHub, sans démon, box éteinte** (Node + ripgrep). Le **branchement** `open`/`close` dans un runner
> donné (binding **mince et optionnel**) est la seule partie spécifique ; le canon **ignore** les runners.

---

## 4. Architecture du canon (tranché)

### 4.1 Emplacement & résolution — **TRANCHÉ (Q-1 confirmé)**
Variable d'env dédiée **`IAKA_MEMORY_HOME`**, défaut **`~/.iaka/memory/`** (niveau *home*, comme
`~/.hermes/` de Hermes : **un** canon quel que soit le projet). **Jamais** sous `~/.claude/`. C'est un
**substrat de fichiers NEUTRE, propriété de personne**, **robuste au déplacement de `~/work`**. À
**ajouter à la procédure de reconstruction PC** aux côtés de `~/.claude/` (le canon est un actif à
sauvegarder/restaurer).

### 4.2 Disposition (layout) — **TRANCHÉ**
```
$IAKA_MEMORY_HOME/                (défaut ~/.iaka/memory/)
  PROFIL.md            # « qui est le décideur » — plafond DUR (§ 4.3), chargé à l'ouverture
  REGISTRE.md          # « ce que l'agent a appris » — plafond DUR, chargé à l'ouverture
  transcripts/         # historique brut, source du rappel plein-texte
    2026-07-16--<runner>--<scope>.md
    odin/              # miroir horodaté & attribué du canal #odin (arbitrages de Stéphane)
  proposals/           # RÉSERVOIR de propositions d'amendements TYPÉES (la file d'attente)
    <horodatage>--<type>--<slug>/   # type ∈ skill | hook | memory | config
      proposal.md      # quoi / où / POURQUOI (preuves de sessions) + statut (en-attente|appliqué|rejeté)
      artifact/        # ARTEFACT PRÊT À APPLIQUER (SKILL.md rédigé, diff de hook, entrée mémoire, patch config)
  config.yaml          # plafonds, seuil de consolidation, politique de consentement, cadence
  provider.json        # [post-MVP] config provider externe — { kind: "none" } par défaut
  index/               # [post-MVP] accélérateur SQLite+FTS5 (même interface que recall)
```

### 4.3 Deux états plafonnés (le plafond FORCE la curation) — **TRANCHÉ**
- `PROFIL.md` = profil du décideur (préférences, style de communication, niveau, choses à éviter).
  **Plafond dur ≈ 500 tokens.**
- `REGISTRE.md` = notes de l'agent (conventions, faits d'environnement, corrections apprises).
  **Plafond dur ≈ 800 tokens.**
- **Mesure agnostique du plafond** : en **caractères** (approx. `tokens ≈ chars/4`), soit
  `PROFIL.md ≤ 2000 chars`, `REGISTRE.md ≤ 3200 chars` (ordre de grandeur des plafonds réels Hermes,
  § 11). Le geste `close` **refuse de dépasser le plafond** → il **consolide** (fusion d'entrées en
  versions plus denses) dès **~80 %** de capacité. C'est ce refus qui garantit la curation.
- Les deux fichiers sont **injectés GELÉS** à l'ouverture (snapshot figé pour la session) et
  **toujours en parallèle** de la mémoire par scope existante (jamais en remplacement).

### 4.4 Écriture — outil `memory` (add / replace / remove) — **TRANCHÉ**
Toute mutation de `PROFIL.md` / `REGISTRE.md` passe par trois opérations idempotentes
(`add` / `replace` / `remove`) sur des **entrées** (une entrée = une puce/ligne datée). Pas
d'écriture libre en flot : cela rend les deltas **inspectables** dans la file de consentement.

---

## 5. Les trois gestes agnostiques (contrat entrée → sortie)

### 5.1 `open` — charger le canon à l'ouverture, **quel que soit le scope** **[MVP]**
- **Entrée** : démarrage de session d'un runner (Claude Code : hook `SessionStart`).
- **Traitement** : lit `PROFIL.md` + `REGISTRE.md` du canon **unique** et les injecte **gelés** dans
  le contexte, **indépendamment du `cwd`/scope**, **en plus** de la mémoire par scope du runner.
- **Sortie** : contexte de session enrichi du profil décideur + registre appris.
- **Acceptation** : ouvrir une session dans **deux répertoires différents** charge **le même**
  `PROFIL.md`/`REGISTRE.md` (constat : contenu identique injecté). Fin de la cécité par scope.

### 5.2 `recall <query>` — rappel bon marché sur l'historique brut **[MVP]**
- **Entrée** : `iaka-memory recall "<motif>"`.
- **Traitement — MVP** : **recherche plein-texte via `ripgrep`** sur `transcripts/` (zéro infra,
  déjà présent, cross-OS). Renvoie les passages qui matchent (fichier + extrait + horodatage).
- **Sortie** : liste d'extraits classés (récence puis pertinence). `--json` pour usage machine.
- **[post-MVP]** : accélérateur **SQLite+FTS5** dans `index/`, **derrière la même interface**
  (bascule transparente ; `ripgrep` reste le repli).
- **Acceptation** : un fait mentionné dans un transcript passé est **retrouvé** par `recall` sans
  qu'il figure dans `PROFIL.md`/`REGISTRE.md` ni dans le prompt courant.

### 5.3 `close` — revue de clôture CADENCÉE → réservoir de propositions typées **[MVP]**
- **Entrée** : `iaka-memory close [--session <transcript>]`, **déclenché par le rituel** (§ 6),
  pas ad hoc.
- **Nature (tranché, Q-2)** : `close` **n'écrit JAMAIS directement dans le système** ; il **PRODUIT
  DES PROPOSITIONS D'AMENDEMENTS** déposées dans le **RÉSERVOIR** (`proposals/`, substrat neutre § 4.2).
  **Rien ne s'applique tout seul.**
- **Traitement** : rejoue le(s) transcript(s) de la période et en dérive des propositions **typées** :
  1. **`memory`** — corrections RÉPÉTÉES (le décideur a redressé l'agent ≥ N fois, N=2 défaut) →
     proposition d'entrée mémoire (`add`/`replace`/`remove` sur `REGISTRE.md`, ou `PROFIL.md` si c'est
     un trait du décideur), avec l'artefact prêt (entrée rédigée) ;
  2. **`skill`** — procédures RÉCURRENTES (même enchaînement de gestes revu ≥ N fois) → proposition de
     **NOUVEAU skill** (artefact = `SKILL.md` **rédigé**, prêt à `add` en bibliothèque, cf. § 7) ;
  3. **`hook`** — leçon durable sur un garde-fou (ex. garde d'identité) → proposition d'**amendement de
     hook** (artefact = **diff** prêt à appliquer) ;
  4. **`config`** — signal d'ajustement (plafond, seuil N, cadence) → proposition de **patch config**.
  - **Contrôle de plafond** (§ 4.3) : une proposition `memory` qui ferait dépasser le budget embarque
    une **consolidation** (fusion en entrées plus denses) dans son artefact.
- **Contenu de CHAQUE proposition** : **quoi** changer, **où**, **POURQUOI** (preuves tirées des
  sessions : extraits/horodatages), **+ un ARTEFACT PRÊT À APPLIQUER**. Statut initial `en-attente`.
- **Sortie** : entrées écrites **dans le réservoir** `proposals/<horodatage>--<type>--<slug>/` (jamais
  appliquées ; la revue passe par le garde § 8, via CLI ou Cockpit).
- **[post-MVP]** : exécution **en arrière-plan sur un modèle auxiliaire moins cher**. Au MVP la revue
  tourne **au moment du gate de cadence** (§ 6), sur le modèle courant — **pas de démon requis**.
- **Acceptation** : sur un transcript fixture contenant une correction répétée **et** une procédure
  répétée, `close` dépose **exactement** une proposition `memory` et une proposition `skill` dans
  `proposals/`, chacune avec son artefact + son « pourquoi », **sans rien appliquer** au canon ni au système.

---

## 6. Cadence de clôture — greffée sur le rituel d'état des lieux **[MVP]**

La méthode **impose déjà** de régénérer l'état des lieux **à chaque changement de version** ET **à
chaque pause / préparation de reprise** (`iakaframe-snapshot.ps1 -Reason version|pause|reprise`).
**C'est là** que se branche `close` : la **cadence existe déjà**, on ne crée pas de nouveau rituel.

- **Tranché** : le geste `close` est **appelé par le cycle d'état des lieux** (Reason `pause` et
  `version`) — c'est la « boucle post-session » de Hermes, mais **rythmée par la discipline
  iakaframe** au lieu d'un démon opaque. `reprise` **ne déclenche pas** `close` (c'est une ouverture,
  pas une clôture).
- **Acceptation** : un `-Reason pause` (ou `version`) **invoque** `close` sur les transcripts de la
  période ; un `-Reason reprise` ne l'invoque **pas**. Vérifiable par trace/log du snapshot.

---

## 7. La skill comme cible de promotion — un type de proposition parmi d'autres **[MVP]**

Un fait mémoire qui est en réalité une **procédure répétable** est **promu en skill** (distinction
Hermes : la mémoire = faits toujours chargés sous budget fixe ; la skill = procédure trop lourde pour
la mémoire active, indexée et rappelée à la demande). Dans le modèle **réservoir** (§ 5.3), la skill
est le **type de proposition `skill`** — au même titre que `hook`, `memory`, `config`.

- **MVP** : `close` dépose une **proposition `skill`** dont l'artefact est un `SKILL.md` **rédigé**.
  La **promotion effective** vers la bibliothèque `library/skills/` reste un **geste humain gated**
  (via la couche CLI `add` de `./cli-bibliotheque-verbes.md`, ou à la main) — **on ne fabrique jamais**
  une skill de production automatiquement (amendement **structurel** = toujours proposition, § 8).
- **Acceptation** : la proposition `skill` émise par `close` porte un `SKILL.md` valide **prêt à `add`**,
  mais **absent** de `library/skills/` tant que le geste de promotion (validation humaine) n'a pas eu lieu.

---

## 8. Revue du réservoir — garde de consentement **[MVP]**

Le réservoir `proposals/` **EST la file d'attente**. La couche de consentement est la **REVUE** de ce
réservoir (accepter / rejeter chaque proposition), via **CLI** (baseline zéro-dep) **ou** **IakaCockpit**
(vues interchangeables, § 10). Elle réutilise la règle iakaframe « action non triviale → confirmation ».

- **Amendements STRUCTURELS — `skill`, `hook`, `config` — TOUJOURS en proposition, jamais auto**,
  **quel que soit** `write_approval`. Aucun réglage ne peut rendre automatique la création d'un skill,
  l'amendement d'un hook ou un patch de config : ce sont des gestes humains gated par nature.
- **Entrées mémoire** (`memory`) — politique par défaut (`config.yaml`) :
  - `REGISTRE.md` (notes de l'agent) → **auto-appliqué** (faible enjeu) ;
  - `PROFIL.md` (profil du **décideur lui-même**) → **mis en file, validé par le décideur** (fait sur
    l'humain : « action non triviale »).
  - Commutateur `write_approval: auto | queue` : `queue` bascule **AUSSI le REGISTRE** en file. Il ne
    peut **jamais** rendre un amendement **structurel** automatique (la garantie ci-dessus prime).
- La **validation** applique l'artefact de la proposition (entrée mémoire écrite ; skill/hook/config
  appliqués par le geste correspondant) et passe son statut à `appliqué` ; le **rejet** passe le statut
  à `rejeté` sans rien appliquer. Rien n'est perdu : le réservoir garde la trace + le « pourquoi ».
- **Acceptation** : une proposition `PROFIL.md` reste `en-attente` **tant que** le décideur ne l'a pas
  validée ; une proposition `REGISTRE.md` s'applique automatiquement (avec `write_approval: auto`) ;
  `write_approval: queue` met le REGISTRE en file **mais** une proposition `skill`/`hook`/`config`
  reste `en-attente` même en `write_approval: auto`.

---

## 9. Rapport à l'existant — réutilisé tel quel vs ajouté

**Réutilisé TEL QUEL (on ne réinvente pas) :**
- Le **modèle** de la mémoire fichier du runner (fiches typées + `MEMORY.md` index) comme **patron
  structurel** de `PROFIL.md`/`REGISTRE.md` (heads consolidées au niveau portefeuille).
- La **bibliothèque de skills** (`library/skills/`, iaka*) comme **cible de promotion**, et sa
  **couche CLI `add`** (`./cli-bibliotheque-verbes.md`) comme geste de promotion.
- La règle **« action non triviale → confirmation »** comme **garde de consentement** (§ 8).
- La **cadence d'état des lieux** (`pause`/`version`) comme **déclencheur** de `close` (§ 6).
- **`ripgrep`** (déjà présent, cross-OS, zéro-dep) comme moteur de `recall` MVP (§ 5.2).

**AJOUTÉ (ce que ce lot comble) :**
- Le **canon portefeuille unique** à chemin agnostique (`$IAKA_MEMORY_HOME`), substrat neutre — l'anti-fragmentation.
- Les **gestes** `open`/`recall`/`close` + l'outil `memory` add/replace/remove, **petits utilitaires
  zéro-dep autonomes** (aucun composant ne les héberge).
- Le **RÉSERVOIR de propositions d'amendements TYPÉES** (`skill`/`hook`/`memory`/`config`), avec
  **artefact prêt à appliquer** + « pourquoi » — l'auto-amélioration s'étend **au-delà de la mémoire,
  jusqu'aux skills ET hooks**, sans jamais s'appliquer seule.
- La **logique de capture** (extraction corrections répétées / procédures récurrentes) + les
  **plafonds durs** avec consolidation à ~80 %.
- La **revue du réservoir** (garde de consentement), vue **CLI** baseline + vue **Cockpit** optionnelle.
- L'**archivage `#odin`** dans `transcripts/odin/` (source d'apprentissage horodatée & attribuée),
  **contribuée optionnellement** par iakaHub.
- La **consolidation initiale** des fiches `stephane-*` éparses en `PROFIL.md`/`REGISTRE.md`.

---

## 10. Périmètre — MVP / différé (fermé)

**[MVP] — cœur, ce lot :**
- Canon (§ 4) : layout (dont `proposals/`), `config.yaml`, plafonds durs + consolidation, outil `memory`.
- `open` (§ 5.1) : binding **mince et optionnel** du runner réel (Claude Code, `SessionStart`),
  chargement scope-agnostique ; canon aussi chargeable **à la main** (open en CLI) sans aucun binding.
- `recall` (§ 5.2) via ripgrep.
- `close` (§ 5.3) : extraction → **réservoir de propositions typées** (`skill`/`hook`/`memory`/`config`).
- Cadence (§ 6) : branchement sur `pause`/`version` de l'état des lieux.
- Revue du réservoir (§ 8) : **vue CLI** baseline + politique de consentement.
- Consolidation initiale des fiches `stephane-*` (§ 9) et archivage `#odin` (§ 4.2, contributeur optionnel).

**[différé — hors de ce lot] :**
- **Vue Cockpit du réservoir** : panneau « propositions » dans **IakaCockpit** (fenêtre optionnelle et
  interchangeable avec la CLI ; aucune n'est propriétaire) → **T10**, `[différé/optionnel]`.
- **Provider user-model externe** (Honcho, Mem0, etc.) : **interface `provider` propre** définie et
  stub `{ kind: "none" }`, mais **aucun adaptateur** implémenté ni aucune dépendance ajoutée.
- **Accélérateur SQLite+FTS5** derrière l'interface `recall` (ripgrep reste le MVP).
- **Boucle en arrière-plan sur modèle auxiliaire** (MVP = revue au gate de cadence, sur modèle courant).
- **Bindings multi-runner** au-delà de Claude Code (codex/ollama…) : le canon est déjà agnostique ;
  chaque runner apporte son **propre binding mince et optionnel**, aucun privilégié.
- **Application automatique** d'une proposition : jamais — les amendements structurels restent gated
  humain par nature (§ 8).

---

## 11. Critères d'acceptation — les 6 invariants agnostiques, vérifiables

Le lot est **PASS** si **tous** les points suivants sont constatables :

1. **[Invariant 1 — deux états plafonnés toujours chargés]** Le canon contient `PROFIL.md`
   (≤ 2000 chars) et `REGISTRE.md` (≤ 3200 chars) ; `wc -c` confirme le respect des plafonds ; les
   deux sont chargés à l'ouverture **en parallèle** (jamais en remplacement) de la mémoire par scope.
   *Test : un `close` qui ferait dépasser le plafond consolide au lieu de croître.*
2. **[Invariant 2 — capture cadencée, pas ad hoc → réservoir de propositions typées]** `close` est
   **déclenché par le rituel** `pause`/`version` (§ 6) et **jamais** requis à la main pour fonctionner ;
   sur un transcript fixture (une correction répétée + une procédure répétée), il dépose dans
   `proposals/` **1 proposition `memory`** et **1 proposition `skill`**, chacune avec artefact +
   « pourquoi ». *Test : trace du snapshot ; contenu de `proposals/` après `close` sur la fixture.*
3. **[Invariant 3 — rappel bon marché sur l'historique brut]** `recall "<motif>"` retrouve un
   passage d'un transcript passé **sans** qu'il soit dans le prompt ni dans PROFIL/REGISTRE ; le
   moteur MVP est ripgrep (zéro dépendance, zéro service). *Test : recall sur un transcript archivé.*
4. **[Invariant 4 — skill comme cible de promotion (type de proposition)]** Une procédure récurrente
   détectée par `close` devient une **proposition `skill`** dont l'artefact est un `SKILL.md` valide
   **prêt à `add`**, mais **absent** de `library/skills/` avant le geste humain de promotion. *Test :
   présence de la proposition + artefact, absence en bibliothèque. Idem `hook`/`config` : proposition
   avec diff/patch, jamais appliquée seule.*
5. **[Invariant 5 — garde de consentement : structurel toujours gated, mémoire auto/file]** Une
   proposition `PROFIL.md` reste `en-attente` jusqu'à validation du décideur ; une proposition
   `REGISTRE.md` s'auto-applique (défaut) ; `write_approval: queue` met **aussi le REGISTRE** en file ;
   une proposition **`skill`/`hook`/`config` reste `en-attente` même en `write_approval: auto`**.
   *Test : les chemins observés + la garantie structurelle non contournable.*
6. **[Invariant 6 — provider externe optionnel, jamais couplé]** Une interface `provider` propre
   existe (`provider.json` défaut `{ kind: "none" }`) ; le cœur fonctionne **entièrement sans provider**
   et **aucune** dépendance à Nous/Honcho/Mem0 n'est présente. *Test : `npm ls` / arbre de deps sans
   provider tiers ; canon opérationnel avec `kind: "none"`.*

**Critères transverses (non-régression & conventions) :**
7. **Anti-fragmentation** : ouvrir une session dans **deux répertoires distincts** charge **le même**
   canon (§ 5.1). *Test : diff nul du profil/registre injecté entre deux scopes.*
8. **Agnosticisme du canon (substrat neutre, propriété de personne)** : aucun fichier du canon ne vit
   sous `~/.claude/` ; le canon est en fichiers plats Markdown + texte, lisible sans runner ; **aucun
   composant ne l'héberge** (ni iakaHub, ni CLI). *Test : arborescence sous `$IAKA_MEMORY_HOME` ; la
   boucle tourne sans iakaHub, sans démon, hors-ligne.*
9. **Self-hosted / zéro-dep / box éteinte** : chemin nominal 100 % local, aucun appel réseau, aucune
   dépendance runtime au-delà de l'existant (ripgrep + Node) ; `close`/`recall`/`memory` sont de petits
   utilitaires autonomes invocables à la main. *Test : exécution complète hors-ligne, sans démon.*
10. **Consolidation initiale** : les fiches `stephane-*` du scope `~/work` sont **fondues** dans
    `PROFIL.md`/`REGISTRE.md` sous plafond (aucune perte de fait structurant ; curation, pas copie).
    *Test : revue humaine du diff de consolidation.*
11. **`#odin` archivé (contributeur optionnel)** : les messages du canal `#odin` sont **horodatés &
    attribués** dans `transcripts/odin/` et **minés** par `close`. *Test : un arbitrage posté sur
    `#odin` apparaît dans l'archive et peut produire une proposition.*
12. **Réservoir & vues interchangeables** : le réservoir `proposals/` est consultable **en CLI**
    (baseline) ; la **vue Cockpit** (T10, différée) offre la même revue sans être propriétaire ni
    obligatoire. *Test : mêmes propositions listées/validées via CLI.*

---

## 12. Découpage en tâches pour Gimli (avec dépendances)

> Commits atomiques (conventional commits), typecheck+lint+tests avant clôture de chaque tâche.

| Tâche | Intitulé | Dépend de |
|---|---|---|
| **T1** | **Fondations du canon** (substrat neutre) : résolution `IAKA_MEMORY_HOME` (défaut `~/.iaka/memory/`), layout (§ 4.2, dont `proposals/`), `config.yaml` (plafonds, seuil 80 %, `write_approval`, cadence, seuil N=2), outil `memory` add/replace/remove + **contrôle de plafond/consolidation** (§ 4.3–4.4). Zéro-dep, autonome, aucun hôte. | — |
| **T2** | **`recall`** : recherche plein-texte ripgrep sur `transcripts/`, sortie humaine + `--json` (§ 5.2). | T1 |
| **T3** | **`open`** (binding **mince & optionnel** du runner réel) : chargement du canon à `SessionStart`, **scope-agnostique**, en parallèle de la mémoire par scope ; canon aussi chargeable **à la main** (open CLI) sans binding (§ 5.1). | T1 |
| **T4** | **`close` → réservoir de propositions TYPÉES** : rejeu de transcript ; produit des propositions `memory`/`skill`/`hook`/`config` (quoi/où/**pourquoi** + **artefact prêt**), déposées dans `proposals/` — **rien n'est appliqué** (§ 5.3, § 7). | T1, T2 |
| **T5** | **Revue du réservoir — vue CLI + garde de consentement** : lister/valider/rejeter les propositions ; politique par défaut (PROFIL en file, REGISTRE auto) ; **structurel (`skill`/`hook`/`config`) toujours gated**, jamais auto ; commutateur `write_approval` (§ 8). | T4 |
| **T6** | **Cadence** : brancher l'appel de `close` sur `-Reason pause|version` du cycle d'état des lieux ; `reprise` ne déclenche pas (§ 6). | T4, T5 |
| **T7** | **Archivage `#odin`** (contributeur **optionnel**) : miroir horodaté & attribué du canal `#odin` dans `transcripts/odin/` via la passerelle Discord d'iakaHub — iakaHub **contribue** la source, il n'héberge pas la boucle (§ 4.2). | T1 |
| **T8** | **Consolidation initiale** : fondre les fiches `stephane-*` (`~/work`) dans `PROFIL.md`/`REGISTRE.md` sous plafond ; **gate humain** sur le diff (§ 9, critère 10). | T1 |
| **T9** | **Interfaces différées (stubs seulement)** : contrat `provider` (`provider.json` `{ kind: "none" }`) + point d'extension SQLite+FTS5 derrière l'interface `recall` — **aucune** implémentation d'adaptateur (§ 10). | T2, T4 |
| **T10** | **[différé/optionnel] Panneau « propositions » IakaCockpit** : vue du réservoir `proposals/` dans IakaCockpit (lister/modifier/valider/run), **interchangeable** avec la vue CLI, **ni propriétaire ni obligatoire** (§ 8, § 10). | T5 |

**Ordre conseillé** : T1 → (T2, T3, T7 en parallèle) → T4 → T5 → T6 → T8 → T9. **T10 différée/optionnelle** (après T5).

---

## 13. Décisions tranchées par le décideur (2026-07-16)

Les 6 questions d'arbitrage ont été **tranchées**. Elles sont gravées ci-dessous et propagées dans
tout le document.

- **Q-1 — Chemin du canon → `~/.iaka/memory/` (home). CONFIRMÉ.** Substrat de fichiers **NEUTRE,
  propriété de personne** (ni Claude Code, ni iakaHub, ni une CLI). Robuste au déplacement de `~/work`.
  **À ajouter à la procédure de reconstruction PC** aux côtés de `~/.claude/` (cf. § 4.1).
- **Q-2 — Nature de la boucle → RÉSERVOIR DE PROPOSITIONS D'AMENDEMENTS TYPÉES (changement de modèle,
  le plus structurant). TRANCHÉE ET ÉLARGIE.** La boucle est **optionnelle** et **n'écrit jamais
  directement dans le système** : elle **produit des propositions** (types `skill` | `hook` | `memory`
  | `config`), déposées dans un **réservoir** (substrat neutre, § 4.2). Chaque proposition porte
  **quoi / où / POURQUOI (preuves) + un artefact prêt à appliquer**. **Rien ne s'applique seul** ; les
  amendements **structurels** (skill, hook, config) sont **toujours** gated humain. Le réservoir **EST**
  la file d'attente, consultable via **DEUX VUES OPTIONNELLES ET INTERCHANGEABLES** : **CLI** (baseline
  zéro-dep toujours dispo) **ou** **IakaCockpit** (panneau « propositions »). Aucune n'est propriétaire
  ni obligatoire. **Vocabulaire : iakaHub n'est PAS « porteur pressenti »** → **contributeur OPTIONNEL**
  de la source `#odin`. Aucun composant n'est un centre/hub imposé (principe iaka : outils
  **composables**). Les gestes `open`/`recall`/`close`/`memory` sont de **petits utilitaires zéro-dep
  autonomes** ; la boucle tourne **sans iakaHub, sans démon, box éteinte** (Node + ripgrep). (Propagé :
  § 3, § 4.2, § 5.3, § 7, § 8, § 10, T4/T5/T7/T10.)
- **Q-3 — Plafonds → valeurs maison (≈ 2000 / 3200 chars) dans `config.yaml`, paramétrables. CONFIRMÉ.**
- **Q-4 — Consentement par défaut → PROFIL en file / REGISTRE auto. CONFIRMÉ.** **Précision gravée** :
  les amendements **structurels** (`skill`/`hook`/`config`) sont **toujours** en proposition, **jamais
  auto**, quel que soit `write_approval`. Le commutateur `write_approval: queue` peut basculer **aussi**
  le REGISTRE en file, mais **ne peut jamais** rendre un amendement structurel automatique (§ 8).
- **Q-5 — Seuil « répété » → N=2, paramétrable. CONFIRMÉ** (`config.yaml`).
- **Q-6 — Binding `open` → chaque runner apporte son propre binding MINCE et OPTIONNEL, aucun
  privilégié ; le canon ignore les runners. CONFIRMÉ.** Claude Code (`SessionStart`) au MVP car runner
  réel ; le canon reste chargeable **à la main** (open CLI) même **sans aucun binding**.

---

## 14. Faits vérifiés sur le web (2026-07-16) + sources

- **Mécanisme Hermes (Nous Research)** confirmé : deux fichiers persistés injectés **gelés** au
  démarrage — `USER.md` (**profil utilisateur**, plafond ≈ **1375 chars**) et `MEMORY.md` (**notes
  de l'agent** : conventions, quirks d'outils, leçons ; plafond ≈ **2200 chars**). **Consolidation
  forcée à ~80 %** de capacité (fusion en entrées plus denses) — c'est le **plafond qui force la
  curation**. → conforte § 4.3.
- **Boucle d'apprentissage consent-aware** : corrections répétées + leçons durables → entrées mémoire
  compactes **ou** skills procédurales ; `write_approval` **met en file** les écritures avant qu'elles
  affectent les sessions futures. → conforte § 5.3 et § 8.
- **Skills portables** en Markdown dans un dossier `skills/` (tout le learning loop y vit), **cible de
  promotion** naturelle. → conforte § 7.
- **Providers externes = 8 plugins optionnels** (Honcho, Mem0, OpenViking, Hindsight, Holographic,
  RetainDB, ByteRover, Supermemory) — **pluggables, jamais couplés en dur**. → conforte l'interface
  `provider` différée (§ 10, invariant 6) ; **aucun** n'est introduit ici.

Sources :
- [Hermes Agent — dépôt](https://github.com/nousresearch/hermes-agent)
- [Hermes Agent — Persistent Memory (docs)](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)
- [Hermes Agent — documentation](https://hermes-agent.nousresearch.com/docs/)

---

## 15. Journal de décision

- **2026-07-16** — Le décideur cadre une **boucle d'apprentissage incrémentale et permanente,
  agnostique du runner**, inspirée du **Hermes Agent** (Nous Research) **sans dépendance** Nous/Honcho.
  **Tranché** : **canon portefeuille UNIQUE** à chemin agnostique `$IAKA_MEMORY_HOME` (défaut
  `~/.iaka/memory/`), **jamais sous `~/.claude/`** → réponse frontale à la **fragmentation par scope** ;
  **deux états plafonnés durs** (`PROFIL.md`/`REGISTRE.md`) injectés gelés, consolidation à ~80 % ;
  **trois gestes agnostiques** `open`/`recall`/`close` + outil `memory` add/replace/remove ; **rappel**
  MVP par **ripgrep** (SQLite+FTS5 différé) ; **capture cadencée** greffée sur le rituel d'état des
  lieux `pause`/`version` (pas de démon au MVP) ; **skill = cible de promotion** (candidat au MVP,
  promotion = geste) ; **garde de consentement** = réutilisation de la règle « action non triviale →
  confirmation » (PROFIL en file, REGISTRE auto) ; **provider externe** = **interface seule**, nul par
  défaut. **Réutilise** mémoire fichier, bibliothèque de skills + CLI `add`, cadence d'état des lieux,
  ripgrep. **MVP** = canon + `open`/`recall`/`close` + cadence + consentement + consolidation initiale
  + archivage `#odin` ; **[différé]** = SQLite+FTS5, providers, boucle de fond sur modèle auxiliaire,
  bindings multi-runner, promotion auto. **Cadrage seul, aucun code de production.**
- **2026-07-16 (validation)** — Le décideur **tranche les 6 questions d'arbitrage** (§ 13) et **valide**
  l'instruction (**statut : VALIDÉ — prêt pour Gimli**). Arbitrages gravés : **Q-1** canon `~/.iaka/memory/`
  home, substrat **neutre propriété de personne**, à intégrer à la reconstruction PC ; **Q-2 (changement
  de modèle majeur)** — la boucle est **optionnelle** et **n'écrit jamais dans le système** : elle
  alimente un **RÉSERVOIR DE PROPOSITIONS D'AMENDEMENTS TYPÉES** (`skill`/`hook`/`memory`/`config`, avec
  **pourquoi + artefact prêt**), revu via **deux vues interchangeables CLI ou IakaCockpit**, aucune
  propriétaire ; **iakaHub = contributeur OPTIONNEL de `#odin`, pas un hub/porteur** ; gestes = petits
  utilitaires zéro-dep autonomes, box éteinte ; l'auto-amélioration s'étend **aux skills ET hooks**, pas
  seulement la mémoire. **Q-3** plafonds maison paramétrables ; **Q-4** PROFIL en file / REGISTRE auto,
  **structurel toujours gated** ; **Q-5** N=2 ; **Q-6** binding par runner **mince & optionnel**, canon
  agnostique. Ajout **T10** (panneau propositions IakaCockpit, différé/optionnel). L'implémentation
  (Gimli) peut démarrer selon T1..T10.

> **Statut : VALIDÉ — prêt pour Gimli.** L'implémentation (Gimli) suit le découpage T1..T10 (§ 12).
