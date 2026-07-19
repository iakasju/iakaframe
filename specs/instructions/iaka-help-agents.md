# Instruction — `/iaka-help` : 4e section « Agents » (équipe de personas, inventaire vivant)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut & jalon en fin de doc.
> **Complète** (sans la réécrire) `specs/instructions/palette-slash-commands.md` **§4** qui a conçu
> `/iaka-help` « vivant » (3 sources dynamiques). Cette instruction **ajoute une 4e source**.
> Réf. vérifiées :
> - `kits/iakaframe-claude/.claude/commands/iaka-help.md` (fichier **unique** à faire évoluer),
> - `specs/instructions/palette-slash-commands.md:111-134` (conception dynamique existante),
> - `cli/src/lib/agents.js:67-72` (`listPersonas` lit `frameworkRoot()/agents/`),
> - `cli/scripts/bundle.js:14-15` (preuve : dossiers `agents/`/`skills/` **absents** de la racine),
> - `cli/src/commands/list.js:41-46` + `cli/src/lib/library.js:16` (`list personas` = id + `name`),
> - `~/.claude/agents/*.md` (surface native Claude Code : 8 contrats déployés, frontmatter
>   `name` + `description`).

---

## 1. Besoin (reformulé)

`/iaka-help` rend aujourd'hui **3 sections dynamiques** (Slash-commands, Skills, Verbes CLI), toutes
tenues à jour par interrogation de sources autoritatives — **aucune liste en dur**. Le décideur veut
une **4e section : les Agents** — l'équipe de personas iakaframe (odin, aragorn, gandalf, gimli,
legolas, helm, loki, nathalie). Contrainte identique au reste de la carte : **inventaire vivant**,
zéro liste codée en dur, cohérent avec l'existant, **aucun nouveau code CLI**, une **seule**
évolution de fichier (`iaka-help.md`).

---

## 2. Ce qui existe — constat vérifié (lecture seule)

- **Le fichier `iaka-help.md`** (source unique du kit) décrit un **prompt** qui interroge 3 sources :
  scan des dossiers `commands/` (**projet** `.claude/commands/` + **global** `~/.claude/commands/`),
  puis `iakaframe --help`, puis `iakaframe list skills`. Son garde-fou : « **N'énumère RIEN de
  mémoire** ». **Modèle à répliquer** pour les agents.
- **Trois registres candidats** pour lister les agents ont été investigués :

| Candidat | Ce qu'il rend réellement | Portable côté host Claude Code ? | Se périme ? | Verdict |
|---|---|---|---|---|
| **`iakaframe agents list`** | **liste VIDE** aujourd'hui : `listPersonas()` (`cli/src/lib/agents.js:67-72`) lit `frameworkRoot()/agents/`, dossier qui **n'existe plus** (personas migrés vers `library/personas/` ; `cli/scripts/bundle.js:14` note explicitement « agents absent => ignore »). Vérifié : `agents/*.md` à la racine = **aucun fichier**. | Oui mais **cassé** (rend `[]`) | — | **ÉCARTÉ** (nécessiterait un correctif code Gimli — hors MVP) |
| **`iakaframe list personas`** | fonctionne, mais rend **id + `name` seulement** (`library.js:16` label=`name`) — **pas de rôle/description**. De plus il scanne `library/personas/`, dossier **non déployé** dans un projet normal (présent uniquement dans le dépôt framework). | **Non** (dossier absent des projets) | Non | **ÉCARTÉ** (non portable + pas de rôle) |
| **Scan `.claude/agents/*.md` (projet + global)** | frontmatter **`name` + `description`** (vérifié : `~/.claude/agents/*.md` = **8 contrats**, ex. `name: gandalf` / `name: odin`, description riche). C'est **la surface native** que Claude Code lit pour dispatcher les subagents → « l'équipe réellement disponible » = littéralement ce dossier. | **Oui** (surface native, toujours co-localisée avec les agents dispatchables) | **Non** (lit les contrats réels) | **RETENU** |

- **Preuve de la source retenue** (extrait réel, `~/.claude/agents/gandalf.md` et `odin.md`) :

  ```yaml
  # ~/.claude/agents/gandalf.md
  name: gandalf
  description: Architecte-cadreur de la méthode iakaframe (P1 - Cadrage). À déclencher dès qu'un besoin…
  ```
  ```yaml
  # ~/.claude/agents/odin.md
  name: odin
  description: Super-agent portefeuille de la méthode iakaframe, disponible en permanence… À déclencher quand…
  ```
  Les 8 fichiers présents : `aragorn, gandalf, gimli, helm, legolas, loki, nathalie, odin`.

---

## 3. Décision — source retenue + justification

**Source retenue : scan des dossiers `.claude/agents/*.md` (projet) ET `~/.claude/agents/*.md`
(global)**, en lisant le frontmatter `name` (nom de l'agent) + `description` (dont on tire un **rôle
court** = **la première phrase**). Justification :

1. **Symétrie avec la section 1** (slash-commands) : même mécanisme exact (scan `.claude/…` **projet
   + global**, lecture de frontmatter). La 4e section réutilise le pattern déjà présent au-dessus →
   cohérence maximale, aucune nouvelle logique.
2. **Surface native Claude Code** : `.claude/agents/` est **précisément** le dossier que le host lit
   pour dispatcher les subagents. Ce que la carte affiche = **l'équipe réellement dispatchable**.
   **Non-périmable par construction** (si un agent est ajouté/retiré, le dossier change, la carte
   suit).
3. **Portable, zéro dépendance exotique, zéro nouveau code** : simple lecture de dossier, aucun verbe
   CLI requis (et les deux verbes candidats sont inutilisables, cf. §2).
4. **Rôle par entrée** : le frontmatter `description` fournit un libellé de rôle (première phrase),
   là où `list personas` ne rend que le nom.

> **Bug latent signalé (hors périmètre de cette instruction)** : `iakaframe agents list` /
> `agents fullteam` reposent sur `frameworkRoot()/agents/`, dossier supprimé lors de la migration
> vers `library/personas/`. À cadrer séparément (correctif Gimli : faire pointer `lib/agents.js` sur
> `library/personas/`). **Non requis** pour cette feature — le scan de dossier n'en dépend pas.

---

## 4. Spécification fermée — nouveau contenu de `iaka-help.md`

**Un seul fichier touché** : `kits/iakaframe-claude/.claude/commands/iaka-help.md`. Remplacer son
contenu par **exactement** ce qui suit (frontmatter mis à jour + 4e section + filtre étendu) :

```md
---
description: Carte des commandes ET de l'équipe : slash-commands du kit, agents, skills, verbes CLI, avec description — inventaire vivant, jamais figé.
---

Affiche une **carte à jour** des commandes ET de l'équipe d'agents disponibles. **N'énumère RIEN de
mémoire** — à chaque appel, interroge les sources autoritatives :

1. **Slash-commands** : liste les fichiers `*.md` de `.claude/commands/` (projet) ET de
   `~/.claude/commands/` (global) ; pour chacun, affiche `/${nom}` + le champ `description` de son
   frontmatter.
2. **Agents (équipe iakaframe)** : liste les fichiers `*.md` de `.claude/agents/` (projet) ET de
   `~/.claude/agents/` (global) ; pour chacun, affiche le champ `name` de son frontmatter + un
   **rôle court** = la **première phrase** de son champ `description`. **N'invente aucun agent** :
   n'affiche que ceux réellement présents dans ces dossiers (l'équipe réellement dispatchable).
3. **Skills** : `iakaframe list skills` → liste les skills de la bibliothèque.
4. **Verbes CLI** : `iakaframe --help` → extrais les commandes + leur ligne d'aide.

Rends une **arborescence** en 4 sections (Slash-commands / Agents / Skills / CLI), triée, une
description par entrée. Si `$ARGUMENTS` est fourni, **filtre** les entrées correspondantes dans **les
4 sections** (agents inclus).

$ARGUMENTS
```

**Points fermés de la spéc** :
- **Ordre de rendu** : `Slash-commands → Agents → Skills → CLI` (les deux scans de dossiers `.claude/`
  regroupés en tête ; « qui » avant « quoi »). *Recommandation Gandalf — arbitrage §7.*
- **Par entrée agent** : `name` + rôle court (1re phrase de `description`), trié alphabétiquement.
- **Portée double** : projet **+** global (identique à la section Slash-commands), ce qui capte
  **odin** (déployé au niveau global/chapeau, rôle portefeuille) même absent d'un `.claude/agents/`
  projet.
- **Garde-fou** conservé et étendu : « N'énumère RIEN de mémoire » couvre désormais aussi les agents.
- **Aucune liste d'agents en dur** dans le corps (le prompt décrit *comment* scanner, jamais *qui*).

---

## 5. Critères d'acceptation (testables)

1. **Une seule évolution de fichier** : `git diff --name-only` ne liste que
   `kits/iakaframe-claude/.claude/commands/iaka-help.md`. Aucun code CLI, aucune frame gelée touchés.
2. **Section Agents présente et branchée sur la bonne source** :
   `grep -n '\.claude/agents/' kits/iakaframe-claude/.claude/commands/iaka-help.md` → présent **pour
   la portée projet ET global** (`.claude/agents/` **et** `~/.claude/agents/`).
3. **Rôle court spécifié** : le corps mentionne `name` **et** « première phrase » de `description`
   pour les agents.
4. **Aucune liste d'agents figée** : `grep -Ei 'aragorn|gandalf|gimli|legolas|helm|loki|nathalie|odin'
   kits/iakaframe-claude/.claude/commands/iaka-help.md` → **aucune** occurrence (les noms d'agents
   n'apparaissent pas énumérés dans le corps).
5. **Garde-fou vivant** : le corps contient toujours « N'énumère RIEN de mémoire » et rend **4
   sections** (l'intro dit « 4 sections », l'arborescence liste `Slash-commands / Agents / Skills /
   CLI`).
6. **Filtre `$ARGUMENTS` étendu** : le corps précise que le filtre couvre **les 4 sections (agents
   inclus)** ; le fichier se termine par `$ARGUMENTS` ; frontmatter `description` **non vide** et
   mentionnant les agents.
7. **Rendu à l'exécution (déploiement complet)** : après appel de `/iaka-help` dans un contexte où
   l'équipe est déployée (projet + `~/.claude/agents/`), **les 8 personas canon** apparaissent dans la
   section Agents avec un rôle court — `aragorn, gandalf, gimli, legolas, helm, loki, nathalie` (côté
   projet) **+ odin** (côté global). *(Le nombre reflète l'état de déploiement : c'est le propre d'un
   inventaire vivant — cf. §7.)*
8. **`/iaka-help gand`** (filtre) : ne montre que les entrées correspondantes, **agents compris**
   (ex. l'agent `gandalf` + la commande `/iaka-cadre` si sa description matche).

---

## 6. Hors périmètre

- **Réparer `iakaframe agents list` / `agents fullteam`** (bug latent `frameworkRoot()/agents/`
  disparu) : **hors sujet ici** ; instruction séparée si le décideur veut en faire la source canon.
- **Créer un verbe CLI dédié** (`iakaframe agents card`…) ou tout nouveau code : **rien**.
- **Toucher aux autres slash-commands, à `install.mjs`, à `copyKit`, aux skills** : **rien**.
- **Frames gelées** (`frames/releases/**`) : non éditées ; reflet à la prochaine régénération.
- **Ajouter un champ frontmatter « rôle court » dédié** aux contrats d'agent : hors MVP (on dérive le
  rôle de la 1re phrase de `description`).

---

## 7. Points à trancher au gate (décideur)

1. **Ordre des 4 sections** — recommandation Gandalf : `Slash-commands / Agents / Skills / CLI`
   (regroupe les deux scans `.claude/`). Alternative : appendre Agents en **4e position**
   (`… / CLI / Agents`) pour churn minimal. **À trancher.**
2. **Source agents = scan de dossier** (recommandée) **vs** réparer `agents list` pour en faire le
   verbe canon (code Gimli, hors MVP). **À trancher** (la reco MVP n'exige aucun code).
3. **Portée projet + global** confirmée (capte odin en global) — comme la section Slash-commands.
   **À confirmer.**
4. **Rôle court = 1re phrase de `description`** (peut être longue) — acceptable en MVP ? **À
   confirmer.**

---

## 8. Impact état des lieux / versionnage

- Évolution d'un artefact de kit **sans nouveau code** : bump **patch** (ex. `v0.17.x → v0.17.(x+1)`)
  — ou mineur au gré du décideur.
- Après exécution + gate Legolas : `update iakaframe` (état des lieux + commit global + push).
- Propagation aux frames à leur **prochaine régénération** (rien à éditer dans `frames/releases/**`).

---

## 9. Statut & jalon

| | |
|---|---|
| **Émetteur** | 🔵 Gandalf (Cadrage, P1) |
| **Contenu** | Instruction fermée `iaka-help-agents.md` : ajoute une **4e section « Agents »** à `/iaka-help`, **inventaire vivant**. Source retenue = **scan `.claude/agents/*.md` projet + `~/.claude/agents/*.md` global** (frontmatter `name` + rôle court = 1re phrase de `description`) — **surface native Claude Code**, non-périmable, **zéro code**. Verbes candidats écartés avec preuve : `agents list` rend **VIDE** (`frameworkRoot()/agents/` disparu, `bundle.js:14`) ; `list personas` non portable + sans rôle. **Un seul fichier** évolue (`iaka-help.md`) ; filtre `$ARGUMENTS` étendu aux agents ; aucune liste d'agents en dur. CA testables (grep source agents, grep absence de noms figés, 4 sections, 8 personas au rendu complet). |
| **Récepteur** | 🟢 Le décideur (Stéphane) → **relit** → tranche §7 → valide → dispatch **Gimli** |

**Fichiers à vérifier avant exécution** :
- `kits/iakaframe-claude/.claude/commands/iaka-help.md:1-17` (fichier unique à faire évoluer)
- `specs/instructions/palette-slash-commands.md:111-134` (conception §4 complétée, non réécrite)
- `cli/src/lib/agents.js:67-72` (preuve `agents list` cassé : lit `frameworkRoot()/agents/`)
- `cli/scripts/bundle.js:14-15` (preuve : `agents/` absent de la racine)
- `cli/src/lib/library.js:16` + `cli/src/commands/list.js:41-46` (`list personas` = id + `name` seul)
- `~/.claude/agents/gandalf.md:1-4`, `~/.claude/agents/odin.md:1-4` (source retenue : `name` + `description`)
