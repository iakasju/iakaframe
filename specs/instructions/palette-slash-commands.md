# Instruction — Palette de slash-commands courtes du kit (préfixe `/iaka-*`, source unique → global + projet)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut & jalon en fin de doc.
> Remplace `specs/instructions/commande-iaka.md` (clos **sans suite** : décision décideur —
> `/iaka` **reste** l'alias de `/learning`).
> Réf. : `kits/iakaframe-claude/.claude/commands/` (source des slash-commands),
> `install.mjs:346` (planner `Commands` → `~/.claude/commands/`, **déploiement global**),
> `cli/src/lib/kit.js:72` (`copyKit`, **déploiement projet**),
> `cli/test/install-multihost.test.js:74` (preuve du déploiement global),
> `cli/src/index.js:34-118` (surface CLI : `list`, `brief`, `services`, `recap`, `--help`),
> `library/skills/` (skills invoquées).

---

## 1. Besoin (reformulé)

Ajouter une **palette de slash-commands courtes**, **toutes préfixées `/iaka-*`** (décision
décideur — évite toute collision avec les built-ins Claude Code type `/update`, `/list`), dans la
**source unique** du kit (`kits/iakaframe-claude/.claude/commands/`), déployées par le **mécanisme
existant** (aucun nouveau code) :
- vers `~/.claude/commands/` (**global**, toutes sessions) par **`install.mjs`** ;
- vers `<projet>/.claude/commands/` (**projet**) par **`copyKit`** (`iakaframe init`/`onboard`).

Trois familles :
- **(a) Raccourcis** vers des skills/agents existants (chaque `.md` **invoque la skill**, avec
  `$ARGUMENTS`).
- **(b) `/iaka-help`** : commande **nouvelle** « carte » des commandes disponibles, **tenue à jour
  dynamiquement** (pas de liste codée en dur).
- **(c) Famille list/info** : commandes **read-only** adossées aux **verbes CLI existants**
  (`iakaframe list|brief|services|recap`), **sans rien réimplémenter**.

**Contrainte** : MVP, une **seule source de vérité par commande** (le kit), jamais de dépôt manuel
dans `~/.claude`. **Ne pas toucher** `iaka.md` (canonique = alias `/learning`), `learning.md`,
`retrait.md`. Frames gelées (reflet à la prochaine génération).

---

## 2. Ce qui existe — constat vérifié (lecture seule)

- **Dossier source** `kits/iakaframe-claude/.claude/commands/` = `iaka.md` (alias `/learning`),
  `learning.md`, `retrait.md`. **À conserver tels quels.**
- **Déploiement — zéro code neuf** (établi au cadrage précédent) : `install.mjs:346`
  (`planNamedSet 'Commands', '.claude/commands' → 'commands'`) copie **tout `*.md`** du dossier
  vers `~/.claude/commands/` (collision-aware, backup, idempotent — prouvé
  `cli/test/install-multihost.test.js:74`) ; `copyKit` (`cli/src/lib/kit.js:72`) copie le même
  dossier en portée **projet**. **Toute nouvelle `*.md` déposée dans le dossier est donc déployée
  automatiquement** par les deux voies.
- **Skills cibles présentes** (`library/skills/`) : `iakaframe-cadrage`, `iakaframe-update`,
  `iakaframe-etat-des-lieux`, `iakaframe-qualite`, `iakaframe-deploiement` — **toutes existent**.
- **Verbes CLI read-only présents** (`cli/src/index.js`) : `list [type]` (:67), `brief <projet>`
  (:62), `services` (:50), `recap <projet>` (:65), et `--help` (:118, catalogue autoritatif).
- **Convention slash-command** (vérifiée, doc Claude Code) : frontmatter `description` +
  corps-prompt + `$ARGUMENTS` ; nom de commande = nom de fichier ; portées projet
  (`.claude/commands/`) et perso (`~/.claude/commands/`).
- **Préfixe `/iaka-*`** : le nom de commande = **nom de fichier** ; préfixer les commandes revient
  donc à préfixer les **fichiers sources** (`iaka-cadre.md` → `/iaka-cadre`). Les canoniques
  `iaka.md`/`learning.md`/`retrait.md` gardent leur nom (hors palette).

---

## 3. Palette retenue (liste finale — tout préfixé `/iaka-*`)

Nom = nom de fichier `.md` (sans le `/`). **10 nouveaux fichiers** dans
`kits/iakaframe-claude/.claude/commands/`. La colonne « description » sert **à la fois** de
frontmatter `description` **et** de libellé dans la carte `/iaka-help`.

### (a) Raccourcis vers skills existantes — le corps *invoque la skill*, `$ARGUMENTS`

| Commande | Fichier source | Cible (skill) | Description (1 ligne, pour `/iaka-help`) |
|---|---|---|---|
| `/iaka-cadre` | `iaka-cadre.md` | `iakaframe-cadrage` (Gandalf) | Démarre un cadrage : transforme un besoin en instruction fermée dans `specs/instructions/` (Gandalf). |
| `/iaka-update` | `iaka-update.md` | `iakaframe-update` | Checkpoint : régénère l'état des lieux + commit global + push. |
| `/iaka-etat` | `iaka-etat.md` | `iakaframe-etat-des-lieux` | Génère/rafraîchit l'état des lieux du projet (MD + HTML). |
| `/iaka-qualite` | `iaka-qualite.md` | `iakaframe-qualite` (Legolas) | Revue qualité : typecheck + lint + tests, verdict PASS/FAIL (Legolas). |
| `/iaka-deploie` | `iaka-deploie.md` | `iakaframe-deploiement` (Helm) | Déploiement prod : prépare et pilote la mise en production (Helm). |

### (b) Carte des commandes — nouvelle, dynamique

| Commande | Fichier source | Cible | Description (1 ligne, pour `/iaka-help`) |
|---|---|---|---|
| `/iaka-help` | `iaka-help.md` | inventaire **dynamique** (cf. §4) | Carte des commandes : slash-commands du kit + verbes CLI + skills, avec description — inventaire vivant, jamais figé. |

### (c) Famille list/info — adossée aux verbes CLI read-only ; le corps *exécute le verbe* et **restitue verbatim**

| Commande | Fichier source | Cible (CLI) | Description (1 ligne, pour `/iaka-help`) |
|---|---|---|---|
| `/iaka-list [type]` | `iaka-list.md` | `iakaframe list [type]` | Inventaire de la bibliothèque (personas, skills, teams, methods, kits…) par scan. |
| `/iaka-brief` | `iaka-brief.md` | `iakaframe brief <projet>` | Carte d'entrée projet : titre + dernière étape + backlog + agents. |
| `/iaka-services` | `iaka-services.md` | `iakaframe services` | Sonde l'infra : git/Forgejo, Ollama, ComfyUI (santé des hôtes). |
| `/iaka-recap` | `iaka-recap.md` | `iakaframe recap <projet>` | Tableau de clôture de session : commits récents + agents + projet. |

### Tri de la famille (c) — ce qui est écarté et pourquoi

- **`/iaka-info` — ÉCARTÉ (confirmé décideur)** : doublon de `/iaka-brief` pour une **même**
  intention (carte d'entrée projet). **Retenu : `/iaka-brief`** (miroir du verbe CLI `brief`).
- **`/iaka-list`, `/iaka-services`, `/iaka-recap`, `/iaka-brief` — RETENUS** : chacun adosse un
  verbe CLI read-only **distinct** à un usage réel (inventaire biblio / infra / clôture / entrée
  projet), **sans chevauchement**.
- **Pas de `/iaka-config`, `/iaka-go`, `/iaka-agents`…** : hors du périmètre « list/info » demandé
  (verbes d'action ou de mutation) ; à cadrer séparément si besoin.

> **Liste finale des 10 fichiers sources** (dans `kits/iakaframe-claude/.claude/commands/`) :
> `iaka-cadre.md`, `iaka-update.md`, `iaka-etat.md`, `iaka-qualite.md`, `iaka-deploie.md`,
> `iaka-help.md`, `iaka-list.md`, `iaka-brief.md`, `iaka-services.md`, `iaka-recap.md`.
>
> Total commandes du kit après livraison : `iaka`, `learning`, `retrait` (inchangées) **+ 10
> nouvelles** = 13.

---

## 4. `/iaka-help` — conception « vivante » (dynamique, pas de liste en dur)

**Décision : inventaire dynamique** (validée décideur — peu coûteux, réutilise l'existant) —
**aucune liste de commandes codée en dur** dans le fichier. Le corps de `iaka-help.md` est un
**prompt qui pilote trois sources autoritatives** puis restitue une **carte groupée** :

1. **Slash-commands** — lister les `*.md` des dossiers `commands/` **projet** (`.claude/commands/`)
   **et** **global** (`~/.claude/commands/`), en lisant le frontmatter `description` de chacun
   (source = les fichiers eux-mêmes → **jamais périmé**).
2. **Verbes CLI** — exécuter `iakaframe --help` (catalogue **autoritatif** du CLI,
   `cli/src/index.js:118`) et en extraire les verbes + leur ligne d'aide.
3. **Skills** — exécuter `iakaframe list skills` (registre bibliothèque) pour lister les skills
   disponibles.

Rendu : **arborescence** en 3 sections (Slash-commands / Skills / CLI), une **description par
entrée**, triées. `$ARGUMENTS` = filtre optionnel (ex. `/iaka-help cadr` ne montre que les entrées
correspondantes).

**Pourquoi dynamique** : le coût est nul (le corps décrit *comment* interroger des sources qui
existent déjà), et la carte **ne se périme pas** quand on ajoute/retire une commande, une skill ou
un verbe CLI. **Aucune duplication** du catalogue.

> Garde-fou anti-dérive à écrire dans le corps : « **N'énumère pas de mémoire** : lis les dossiers
> `commands/` + `iakaframe --help` + `iakaframe list skills` **à chaque appel**. »

---

## 5. Spécification fermée (contenu des 10 fichiers)

Un fichier `.md` par commande dans `kits/iakaframe-claude/.claude/commands/`. **Aucun autre fichier
touché** (ni `install.mjs`, ni `copyKit`, ni `iaka.md`/`learning.md`/`retrait.md`).

### 5.1 Gabarit (a) — raccourci skill (ex. `iaka-cadre.md`)

```md
---
description: Démarre un cadrage : transforme un besoin en instruction fermée dans specs/instructions/ (Gandalf).
---

Invoque la skill **`iakaframe-cadrage`** (rôle Gandalf, P1 — Cadrage) sur la demande fournie :
pose le problème avant la solution, vérifie l'existant + le web, et produit une instruction
fermée et vérifiable dans `specs/instructions/`. N'écrit pas de code de production.

$ARGUMENTS
```

Décliner à l'identique pour `iaka-update.md`, `iaka-etat.md`, `iaka-qualite.md`, `iaka-deploie.md`
— **seuls changent** la `description` (colonne §3.a), le nom de skill invoqué et la phrase de
rôle. Chacun se termine par `$ARGUMENTS`.

### 5.2 Gabarit (c) — verbe CLI read-only (ex. `iaka-brief.md`)

```md
---
description: Carte d'entrée projet : titre + dernière étape + backlog + agents.
---

Exécute **`iakaframe brief $ARGUMENTS`** (à défaut d'argument : le projet courant) et **restitue la
sortie VERBATIM** (aucune reformulation). Commande **lecture seule** : n'écrit rien, ne mute rien.

$ARGUMENTS
```

Décliner pour `iaka-list.md` (`iakaframe list $ARGUMENTS`), `iaka-services.md` (`iakaframe services
$ARGUMENTS`), `iaka-recap.md` (`iakaframe recap $ARGUMENTS`) — même règle **restitution verbatim** +
**read-only**.

### 5.3 `iaka-help.md` (cf. §4)

```md
---
description: Carte des commandes : slash-commands du kit + verbes CLI + skills, avec description — inventaire vivant, jamais figé.
---

Affiche une **carte à jour** des commandes disponibles. **N'énumère RIEN de mémoire** — à chaque
appel, interroge les sources autoritatives :

1. **Slash-commands** : liste les fichiers `*.md` de `.claude/commands/` (projet) ET de
   `~/.claude/commands/` (global) ; pour chacun, affiche `/${nom}` + le champ `description` de son
   frontmatter.
2. **Verbes CLI** : `iakaframe --help` → extrais les commandes + leur ligne d'aide.
3. **Skills** : `iakaframe list skills` → liste les skills de la bibliothèque.

Rends une **arborescence** en 3 sections (Slash-commands / Skills / CLI), triée, une description par
entrée. Si `$ARGUMENTS` est fourni, **filtre** les entrées correspondantes.

$ARGUMENTS
```

---

## 6. Critères d'acceptation (testables)

1. **10 fichiers créés** dans `kits/iakaframe-claude/.claude/commands/`, **tous préfixés
   `iaka-`** : `iaka-cadre.md`, `iaka-update.md`, `iaka-etat.md`, `iaka-qualite.md`,
   `iaka-deploie.md`, `iaka-help.md`, `iaka-list.md`, `iaka-brief.md`, `iaka-services.md`,
   `iaka-recap.md`. Chacun : frontmatter `description` **non vide** + se termine par `$ARGUMENTS`.
2. **Préfixe systématique** : `ls kits/iakaframe-claude/.claude/commands/` → aucun **nouveau**
   fichier non préfixé (seuls `iaka.md`, `learning.md`, `retrait.md` restent sans préfixe `iaka-`).
3. **Canoniques intacts** : `git diff` **ne touche pas** `iaka.md`, `learning.md`, `retrait.md`.
4. **Skills réellement invoquées existantes** : pour chaque fichier (a),
   `test -d library/skills/<skill-invoquée>` → **présent** (cadrage/update/etat-des-lieux/qualite/
   deploiement).
5. **(c) read-only + verbatim** : chaque fichier (c) contient `iakaframe <verbe>` **et** la mention
   « verbatim » ; **aucune** logique CLI réimplémentée dans le `.md`.
6. **`/iaka-help` dynamique** : `iaka-help.md` **ne contient aucune liste codée en dur** des
   commandes de la palette (grep : les stems `cadre|update|etat|qualite|deploie|list|brief|services|
   recap` **n'apparaissent pas** en énumération dans le corps) ; il **référence** les 3 sources
   (`.claude/commands`, `iakaframe --help`, `iakaframe list skills`).
7. **Déploiement global (sans code neuf)** — cible propre :
   `node install.mjs --hosts claude --target-claude <tmp>` → les 10 `commands/iaka-*.md`
   **présents** et `diff` **identiques** à la source.
8. **Déploiement projet** — `iakaframe init --path <projet>` → les 10 présents dans
   `<projet>/.claude/commands/`, **identiques** à la source.
9. **Non-régression installeur** : `node --test cli/test/install-multihost.test.js` → **vert**
   (planner `Commands` inchangé).
10. **Ancienne instruction close** : `specs/instructions/commande-iaka.md` porte un statut
    **« sans suite »** renvoyant ici.

---

## 7. Hors périmètre

- **Toucher `install.mjs` / `copyKit`** : **rien** — mécanisme existant réutilisé.
- **`iaka.md` / `learning.md` / `retrait.md`** : **inchangés** (décision : `/iaka` reste
  `/learning`).
- **Frames gelées** (`frames/releases/**`) : non éditées ; reflet à la prochaine génération.
- **Verbes d'action/mutation en slash-command** (`/iaka-go`, `/iaka-config`, `/iaka-agents`,
  `/iaka-switch`…) : hors de la famille « list/info » demandée — instruction séparée si besoin.
- **Créer des verbes CLI nouveaux** : sans objet (la palette adosse l'existant).
- **`/iaka-info`** : écarté (doublon de `/iaka-brief`), confirmé décideur.

---

## 8. Points à trancher au gate (décideur)

*Tous les arbitrages structurants sont **actés** — cette section est un simple récapitulatif de
relecture, pas une liste de questions ouvertes :*

1. **Préfixe `/iaka-*`** sur les 10 commandes — **acté**.
2. **Nom de la carte : `/iaka-help`** (cohérent avec le préfixe `/iaka-*` ; `/iakastart` reste une
   entrée distincte hors palette) — **acté**.
3. **`/iaka-brief`** retenu (pas `/iaka-info`) — **acté**.
4. **`/iaka-help` dynamique** (inventaire vivant, §4) — **acté**.
5. **Double portée** global + projet, contenu identique — **acté**.

→ Il ne reste **aucun arbitrage bloquant**. L'instruction est **auto-portante**, prête à relecture
par le décideur puis dispatch **Gimli**.

---

## 9. Impact état des lieux / versionnage

- Ajout d'artefacts de kit **sans nouveau code** : bump **mineur** raisonnable (ex. `v0.17.2` →
  `v0.18.0`, palette de commandes) — ou **patch** si le décideur préfère ; à fixer à la clôture.
- Après exécution + gate Legolas : `update iakaframe` (état des lieux + commit global + push) et
  mise à jour du `BACKLOG.md` (item « Palette de slash-commands `/iaka-*` »).
- Propagation aux frames à leur **prochaine régénération** (rien à éditer dans `frames/releases/**`).

---

## 10. Statut & jalon

| | |
|---|---|
| **Émetteur** | 🔵 Gandalf (Cadrage, P1) |
| **Contenu** | Instruction fermée `palette-slash-commands.md` : **10 slash-commands préfixées `/iaka-*`** ajoutées à la **source unique** `kits/iakaframe-claude/.claude/commands/` — (a) 5 raccourcis skills (`/iaka-cadre`,`/iaka-update`,`/iaka-etat`,`/iaka-qualite`,`/iaka-deploie`), (b) `/iaka-help` **dynamique** (3 sources vivantes, zéro liste en dur), (c) 4 read-only CLI (`/iaka-list`,`/iaka-brief`,`/iaka-services`,`/iaka-recap`), `/iaka-info` écarté (doublon). **Zéro code de déploiement** (install.mjs + copyKit réutilisés). Canoniques `iaka`/`learning`/`retrait` intacts. CA testables (préfixe systématique, grep skills existantes, `diff` global/projet == source, `/iaka-help` sans liste figée, suite install verte). Ancienne `commande-iaka.md` close **sans suite**. |
| **Récepteur** | 🟢 Le décideur (Stéphane) → **relit** l'instruction → valide → dispatch **Gimli** |

**Fichiers à vérifier avant exécution** :
- `kits/iakaframe-claude/.claude/commands/` (dossier cible des 10 nouveaux `iaka-*.md`)
- `kits/iakaframe-claude/.claude/commands/iaka.md:1`, `learning.md:1`, `retrait.md:1` (inchangés)
- `install.mjs:346` (planner `Commands`) · `cli/src/lib/kit.js:72` (`copyKit`)
- `cli/src/index.js:34-118` (verbes `list`/`brief`/`services`/`recap`/`--help`)
- `library/skills/iakaframe-cadrage|iakaframe-update|iakaframe-etat-des-lieux|iakaframe-qualite|iakaframe-deploiement` (skills invoquées)
- `cli/test/install-multihost.test.js:74` (non-régression déploiement)
- `specs/instructions/commande-iaka.md` (close sans suite, renvoi vers ce fichier)
```
