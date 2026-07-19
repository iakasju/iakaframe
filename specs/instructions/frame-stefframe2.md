# Instruction — Frame de release `StefFrame2` (livrable EXÉCUTABLE)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut en fin de doc.
> Réf. : `specs/instructions/frame-stefframe1.md` (corpus DOC+KITS), `methode-de-travail.md`,
> `cli/`, `kits/iakaframe-claude/global/hooks/`.

---

## 1. Besoin (reformulé)

Le rétro-test de **Legolas** a montré que `StefFrame1` est un **corpus DOC+KITS déparamétré**,
**pas un exécutable autonome**. Le décideur veut `frames/releases/StefFrame2/` =
**tout StefFrame1 + ce qui manque pour que ça TOURNE**, le fils n'ayant qu'à installer
**Claude Code + Node.js**.

**Horizon** : un ZIP `StefFrame2.zip` où `iakastart` / banner / jalon et les gestes outillés
(`review`, `memory`, `remove`, `attach`, `detach`, `go`, `list`, `show`…) **fonctionnent**, et
où les hooks d'identité/périmètre/délégation sont **réellement câblés**.

---

## 2. Périmètre — DANS / HORS

**DANS**
- **Tout `StefFrame1`** conservé à l'identique (atomes `library/`, assemblages, 16 skills SF1, 5 kits,
  `docs/git-hosting.md`, `README.md`) — SF2 y ajoute la skill `retrait` (→ **17 skills** au total).
- **Le CLI complet** `cli/` (scrubé) — le bloquant majeur.
- **Les 3 hooks Node manquants** + settings d'exemple qui les câble.
- **Une charte de démarrage neutre** `design-starter/`.
- **Un installeur collision-aware** `install.mjs` (pose sûre de `~/.claude`, §7-bis).
- **Un GUIDE-INSTALLATION court** (pointant sur l'installeur, pas des `cp` bruts).

**HORS**
- Écrire du code de production (Gimli exécute) ; rouvrir les arbitrages StefFrame1.
- Le GUI iakaFrameGUI ; l'infra homelab ; les artefacts perso (statusline/daemon/LSP/marketplaces).

---

## 3. Arborescence cible — DELTA vs StefFrame1

`frames/releases/StefFrame2/` = **copie intégrale de StefFrame1** + les ajouts marqués `➕` :

```
frames/releases/StefFrame2/
  README.md                    # repris de SF1, MAJ : mentionne cli/, design-starter/, install, guide
  install.mjs                  # ➕ installeur collision-aware, Node pur zéro-dép (§7-bis)
  install.sh                   # ➕ mince wrapper POSIX : exec node install.mjs "$@"
  install.ps1                  # ➕ mince wrapper Windows : node install.mjs @args
  GUIDE-INSTALLATION.md        # ➕ prérequis + lance install.mjs + repli manuel (§9)
  methode-de-travail.md
  principles/  rituals/  guardrails/  roles/  personas/  scaffolds/  workflows/
  skills/      (17 : 16 hérités de SF1 + retrait)
  methods/  teams/  bindings/
  docs/git-hosting.md
  design-starter/              # ➕ charte de démarrage NEUVE et neutre (§6)
    starter.css
    logo.svg
    template-doc.html
    template-slides.html
    template-flyer.svg
    charte.md
  cli/                         # ➕ CLI exécutable, scrubé (§5)
    package.json               # scrubé : bin conservé, registre privé retiré
    README.md                  # scrubé
    src/index.js
    src/commands/*.js          # les 25 fichiers de commandes
    src/lib/*.js
    src/lib/figfont/*.flf       # 7 polices + CREDITS.txt
  kits/
    iakaframe-claude/
      global/
        hooks/
          identity-guard.mjs        (déjà SF1)
          perimeter-guard.mjs       (déjà SF1)
          identity-remind.mjs       # ➕ version NODE (SF1 n'a que .ps1)
          delegation-guard.mjs      # ➕
          plan-courante.mjs         # ➕
          *.ps1                     (parité Windows, conservés — cf. §11)
        settings.example.json       # ➕ câble réellement les hooks (§7)
    iakaframe-codex/ ... iakaframe-anythingllm/   (inchangés)
```

> **Note d'exécution** : Gimli **copie** `StefFrame1/` → `StefFrame2/` puis applique les ajouts.
> StefFrame2 est **autonome** (son propre ZIP), il ne référence pas StefFrame1.

---

## 4. Inventaire des ajouts — source → cible

| # | Élément | Source | Cible dans `StefFrame2/` |
|---|---|---|---|
| 1 | CLI (entrée) | `cli/src/index.js` | `cli/src/index.js` (scrubé) |
| 1 | CLI (commandes) | `cli/src/commands/*.js` (25) | `cli/src/commands/*.js` |
| 1 | CLI (lib) | `cli/src/lib/*.js` | `cli/src/lib/*.js` (scrubé : `forgejo.js`, `vocab.js`) |
| 1 | Polices FIGlet | `cli/src/lib/figfont/*.flf` (7) + `CREDITS.txt` | `cli/src/lib/figfont/*` |
| 1 | Manifeste npm | `cli/package.json` | `cli/package.json` (scrubé, §5) |
| 1 | Readme CLI | `cli/README.md` | `cli/README.md` (scrubé) |
| 2 | Hook identité (rappel, Node) | `~/.claude/identity-remind.mjs` | `kits/iakaframe-claude/global/hooks/identity-remind.mjs` (généralisé) |
| 2 | Hook délégation | `~/.claude/delegation-guard.mjs` | `.../hooks/delegation-guard.mjs` (généralisé) |
| 2 | Hook plan vivant | `~/.claude/plan-courante.mjs` | `.../hooks/plan-courante.mjs` (généralisé) |
| 3 | Settings d'exemple | (créé) | `.../global/settings.example.json` (§7) |
| 4 | Charte de démarrage | (créée neuve) | `design-starter/*` (§6) |
| 5 | Installeur + wrappers | (créés) | `install.mjs`, `install.sh`, `install.ps1` (§7-bis) |
| 6 | Guide install | (créé) | `GUIDE-INSTALLATION.md` (§9) |

> **CLI — comptage** : `cli/src/commands/` contient **25 fichiers** (`attach.js` exporte
> `runAttach` **et** `runDetach` ; `switch.js` sert `switch`/`use`), soit ~28 verbes exposés par
> `index.js` (banner, jalon, list, show, add, remove, attach, detach, assemble, switch/use,
> memory, open, recall, close, review, consolidate, onboard, init, snapshot, update, services,
> config, agents, go, brief, recap, root). Tous embarqués.

**Ce qu'on N'EMBARQUE PAS du dossier `cli/`** (voir §10) : `cli/test/**`, `cli/.npmrc`,
`cli/.gitignore`, `cli/scripts/bundle.js`.

---

## 5. TENSION 1 — CLI vs grep-gate : RÈGLE TRANCHÉE

**Constat** : embarquer le CLI tel quel **fait échouer** les gates §12-B (0 motif infra) et
§12-C (0 GUI) de StefFrame1 — `cli/src/lib/forgejo.js` (`192.168.2.11`, `sjupin`),
`cli/src/lib/vocab.js` (commentaire « SOURCE DE VERITE = … depot iakaFrameGUI », `packages/core`,
alias `ps`/`iakaide`), `cli/.npmrc` (registre LAN).

**Décision : option (a) — gate DIFFÉRENCIÉ.** Le grep strict s'applique au **corpus**
(docs/kits/library/skills/design) ; le sous-arbre **`cli/`** a un **gate assoupli** défini
ci-dessous. Motif du choix : un scrub complet par renommage (option b) casserait le code
inter-référencé (commandes `onboard`/`init`/`update`/`services` → `forgejo.js` ; parité
`vocab.js` ↔ cœur ; imports), pour un gain nul — les noms **fonctionnels** ne sont pas des
fuites. On neutralise donc **l'infra réelle et les pointeurs vers le dépôt privé**, pas le
vocabulaire métier.

### 5.1 Gate `cli/` — ce qui est TOLÉRÉ (ne pas scrubber)
- Noms **fonctionnels** de commandes / providers / runners : `forgejo`, `ollama`, `litellm`,
  `codex`, `claude-code`, et les **chaînes d'alias legacy** dans les tables de `vocab.js`
  (`ps`, `iakaide`, `aider`) — ce sont des identifiants de compatibilité, pas des secrets.
- La mécanique d'intégration Forgejo (produit **open-source auto-hébergeable**) : elle reste,
  **pilotée par variables d'environnement** sans défaut LAN.

### 5.2 Gate `cli/` — ce qui DOIT être scrubé/neutralisé (vérifiable)
| Motif | Action |
|---|---|
| `192.168.2.11`, toute IP LAN, `:3001`, `:1883` | retirer les **défauts codés en dur** → lecture **env-only** (`process.env.FORGEJO_URL` sans fallback LAN ; `DEF_URL` → `''` ou `http://localhost`) |
| `sjupin` (`DEF_USER`) | `''` (obligatoire via `FORGEJO_USER`) ou `<user>` |
| `iakabox`, `iakaboxlogs` | retirer / reformuler (générique) |
| URL registre privé `api/packages/...` | retirer (le CLI est livré en direct, §5.3) |
| Commentaire `vocab.js` nommant **`iakaFrameGUI`** et **`packages/core`** | **reformuler** : « miroir du vocabulaire canonique du cœur » sans nommer le dépôt privé ni un chemin GUI |
| Tout token / secret réel | jamais présent (déjà le cas : lecture `FORGEJO_TOKEN`) |

**Grep de contrôle du sous-arbre CLI** (doit renvoyer **0**) :
```
grep -rnE '192\.168|:1883|:3001|\bsjupin\b|iakabox|iakaFrameGUI|packages/core|api/packages' frames/releases/StefFrame2/cli/
```
> Le CLI garde son invariant **zéro-dépendance runtime** (cf. `src/index.js`) : après scrub, il
> tourne offline. Les commandes du chemin critique (`banner`, `jalon`, `list`, `show`, `add`,
> `remove`, `attach`, `detach`, `memory`, `review`…) **n'ont besoin ni du réseau ni du cœur GUI**.

### 5.3 TENSION 2 — `.npmrc` privé : RETIRÉ
`cli/.npmrc` (`@naonedge:registry=http://192.168.2.11:3001/api/packages/...`) est **EXCLU** du
frame. Le CLI est livré **en direct** (dossier `cli/`), installé via `npm install -g ./cli`
(zéro dépendance → aucun accès registre requis). Dans `cli/package.json` : **retirer** tout
`publishConfig`/`registry`/scope privé ; **conserver** le champ `bin` (nom de commande
`iakaframe`) et `type:"module"`. Aucun pointeur vers un registre LAN ne subsiste.

---

## 6. TENSION 3 — Charte de démarrage sans réintroduire `naonedge`

**Interdit** : copier `design-naonedge/` (le token `naonedge` est dans les **noms de fichiers**
et le CSS → repollue le grep du corpus).

**Décision** : créer une charte **NEUVE et neutre** `design-starter/` (assets **originaux**, pas
un renommage de naonedge), vers laquelle `<CHARTES_DIR>` / `<charte-defaut>` pointent :
- `starter.css` — palette générique documentée (variables CSS), sobre, sans marque perso.
- `logo.svg` — logo placeholder neutre (pas de « grue » naonedge, pas de mot `naonedge`).
- `template-doc.html`, `template-slides.html`, `template-flyer.svg` — gabarits minimaux liant `starter.css`.
- `charte.md` — mode d'emploi court : « charte par défaut ; dupliquer pour créer la vôtre ».

**Contrôle** : `grep -rniE 'naonedge|cinabre|grue' frames/releases/StefFrame2/design-starter/`
→ **0**. La skill `iakaframe-naonedge` (conservée, déparamétrée en SF1) doit pouvoir résoudre
`<CHARTES_DIR>=design-starter` `<charte-defaut>=starter` sans motif perso.

---

## 7. Settings d'EXEMPLE qui câble les hooks

Créer `kits/iakaframe-claude/global/settings.example.json` — **exemple** (le fils le fusionne
dans son `~/.claude/settings.json`, on ne clobber pas). *Schéma vérifié (§12-D)*.

Câblage attendu (matcher = regex sur nom d'outil ; handler `type:"command"`) :
| Événement | Matcher | Commande (chemin portable) |
|---|---|---|
| `Stop` | — | `node ~/.claude/hooks/identity-guard.mjs` |
| `SubagentStop` | — | `node ~/.claude/hooks/identity-guard.mjs` |
| `UserPromptSubmit` | — | `node ~/.claude/hooks/identity-remind.mjs` |
| `PreToolUse` | `Task` | `node ~/.claude/hooks/delegation-guard.mjs` |
| `PostToolUse` | `Task` | `node ~/.claude/hooks/delegation-guard.mjs` |
| `PostToolUse` | `TodoWrite\|Task` | `node ~/.claude/hooks/plan-courante.mjs` |

Contraintes :
- **Chemins portables** : `node ~/.claude/hooks/<hook>.mjs` (le guide §9 dit de déposer les
  hooks dans `~/.claude/hooks/`). Aucun `powershell.exe`, aucun chemin absolu machine
  (`C:\Users\sjupi\…`, `/Users/sjupin/…`).
- **Rien de spécifique-machine** : pas de `statusLine`/`iakaTokenCounter`, pas de daemon, pas de
  `enabledPlugins`/LSP (`rust-analyzer`), pas de `extraKnownMarketplaces` (gitkraken), pas de
  `skipDangerousModePermissionPrompt` ni `permissions.defaultMode:bypassPermissions`.
- **Cohérence** : chaque `command` ne référence qu'un hook **présent** dans `global/hooks/`.

**Généralisation des 3 hooks Node ajoutés** (fail-open déjà en place → sans config ils **no-op**,
donc sûrs pour le fils) :
- `delegation-guard.mjs` / `plan-courante.mjs` : défauts `mqtt://192.168.2.11:1883` et hôtes
  `iakaboxlogs`/CouchDB → **placeholders/env-only** (`<MQTT_BROKER>` / `<COUCHDB_URL>`, ou
  `process.env.IAKALOG_MQTT_URL` sans fallback LAN). Journalisation locale (`~/.claude/*.log`)
  conservée. Commentaires nommant `iakabox` reformulés.
- `identity-remind.mjs` : retirer tout chemin `~/work`/`/Users/sjupin` en dur ; garder la
  mécanique de rappel d'identité.
- `perimeter-guard.mjs` (déjà SF1) : le commentaire `/Users/sjupin/...` (exemple) → générique.

---

## 7-bis. Installeur collision-aware (pose sûre de `~/.claude`)

**Motif** : le guide actuel fait des `cp` qui **écrasent aveuglément** un `~/.claude` existant
(skills, agents, CLAUDE.md, settings, mémoire) — **inacceptable**. On livre un **installeur**
qui détecte l'existant, **fusionne intelligemment par défaut**, **sauvegarde avant toute
écriture**, et **ne perd jamais de donnée utilisateur**.

### 7-bis.1 Forme & emplacement
- **`install.mjs`** à la **racine** de `frames/releases/StefFrame2/` — **Node pur, zéro
  dépendance** (cohérent avec le CLI ; Node ≥ 20 est déjà prérequis).
- Deux **minces wrappers** : `install.sh` (POSIX : `exec node "$(dirname "$0")/install.mjs" "$@"`)
  et `install.ps1` (`node "$PSScriptRoot/install.mjs" @args`). Aucune logique dans les wrappers.
- **Source des éléments posés** : le kit `kits/iakaframe-claude/` du frame lui-même (l'installeur
  se localise par rapport à son propre chemin). Cible = `~/.claude/` (surchargeable, §7-bis.5).

### 7-bis.2 Catégories détectées & gérées
L'installeur ne gère **QUE** les catégories qu'il apporte ; il **compare** l'apport du kit à
l'existant, par catégorie :
| Catégorie | Apport du kit (source) | Cible `~/.claude/` |
|---|---|---|
| Contrat global | `global/CLAUDE.md` | `CLAUDE.md` |
| Réglages | `global/settings.example.json` | `settings.json` |
| Hooks Node | `global/hooks/*.mjs` (5) | `hooks/*.mjs` |
| Skills | `.claude/skills/*` (17) | `skills/*` |
| Agents | `.claude/agents/*` (8) | `agents/*` |

**Données JAMAIS touchées** (ni lues pour écriture, ni sauvegardées, ni écrasées) : tout le
reste de `~/.claude/` **hors** catégories ci-dessus — notamment `projects/**` (mémoire
par-projet), `todos/`, `history*`, `shell-snapshots/`, `statsig/`, `plugins/`, et la mémoire
portefeuille `~/.iaka/memory/` (hors `~/.claude`). L'installeur **n'énumère jamais** ces chemins
en écriture. Règle absolue : **additif only** sur les catégories gérées, **zéro effet** ailleurs.

### 7-bis.3 Sémantique de « fusionner » par type (cœur du cadrage)
- **`CLAUDE.md`** : si absent → écrire le contrat kit **encadré** par
  `<!-- iakaframe:start -->` … `<!-- iakaframe:end -->`. Si présent → **repérer le bloc** :
  bloc présent = **remplacer son contenu** (mise à jour de la section méthode) ; bloc absent =
  **ajouter le bloc en fin de fichier**. **Jamais** modifier une ligne **hors** du bloc. →
  `fusionner`. `écraser` = remplacer tout le fichier (après backup). `garder` = ne rien faire.
- **`settings.json`** : **deep-merge JSON**. Parser les deux (défensif : si le `settings.json`
  utilisateur est un JSON **invalide** → **ne pas fusionner**, le sauvegarder, avertir, et
  proposer `garder`/`écraser` seulement). Fusion : pour `hooks`, **ajouter les entrées
  manquantes** identifiées par le triplet **(event + matcher + command)** ; **ne jamais retirer**
  une entrée utilisateur ; sur **conflit scalaire**, **garder la valeur existante** ; objets
  fusionnés récursivement ; tableaux de hooks = **union par identité de triplet** (pas de
  doublon). `écraser`/`garder` = idem CLAUDE.md.
- **`skills/`** & **`agents/`** (dossiers, par élément de même nom) : manquant → **copier** ;
  existant même nom → défaut **merge = garder l'existant** (skip, **on n'écrase pas**) ;
  `écraser` = remplacer le dossier (après backup) ; `garder` = skip.
- **`hooks/*.mjs`** (par fichier) : manquant → **copier** ; existant même nom → défaut
  **garder** ; `écraser` = remplacer (après backup) ; `garder` = skip.
- **Données** : **jamais écraser** ; l'installeur ne les manipule pas (§7-bis.2).

### 7-bis.4 Backup (obligatoire avant toute écriture)
- Avant **la première écriture réelle** d'une run, créer un dossier horodaté
  **`~/.claude/.iakaframe-backup-<ts>/`** (`<ts>` = `Date.now()`, acceptable dans un script Node
  lancé par l'utilisateur). Surchargeable par `--backup-dir <path>`.
- Avant d'**écraser** ou de **fusionner** un élément, **copier son état actuel** dans le backup
  en **préservant l'arborescence relative** (`CLAUDE.md`, `settings.json`, `skills/<x>/…`,
  `agents/<x>.md`, `hooks/<x>.mjs`). Un simple ajout (élément absent) ne nécessite pas de backup
  mais le dossier de backup reste la référence de la run.
- **`--dry-run` n'écrit RIEN et ne crée AUCUN backup.**

### 7-bis.5 Interaction, flags, idempotence
- **Interactif** (défaut sans `--yes` sur TTY) : prompt **par élément en collision**, groupé et
  affiché **par catégorie**, choix `[f]usionner / [e]craser / [g]arder` + un raccourci
  **`[F]/[E]/[G]` = appliquer à toute la catégorie**. Les éléments **sans collision** (absents)
  sont **ajoutés** sans prompt.
- **Flags** :
  - `--merge` (**défaut**) : fusion intelligente (sémantique §7-bis.3) ; garde l'existant en cas de conflit.
  - `--overwrite` : sur collision, écraser (après backup) — non-interactif.
  - `--keep` : sur collision, garder l'existant (skip) — non-interactif.
  - `--dry-run` : afficher le **plan par catégorie** (détecté / à ajouter / en collision → action prévue) **sans rien écrire**.
  - `--backup-dir <path>` : dossier de backup explicite.
  - `--yes` : non-interactif (applique le mode `--merge`/`--overwrite`/`--keep` choisi, défaut `--merge`).
  - `--target <dir>` : **cible** alternative (défaut `~/.claude`) — **requis pour le smoke test** (fixture tmp).
- **Idempotent** : re-exécuter en `--merge` ne produit **aucun changement** (bloc CLAUDE.md déjà
  présent → contenu identique ; hooks settings déjà présents par triplet → rien à ajouter ;
  skills/agents/hooks déjà là → garder). Aucune duplication, aucune corruption.

### 7-bis.6 Repli manuel (que la doc reprendra)
Étapes manuelles équivalentes, à documenter par Nathalie/Loki :
1. **Backup** : `cp -R ~/.claude ~/.claude.bak-<date>` (ou zip).
2. **CLAUDE.md** : ouvrir, coller le bloc `iakaframe:start…end` du kit **s'il manque** ; ne rien supprimer.
3. **settings.json** : ajouter à la main les entrées `hooks` manquantes (event+matcher+command) ; garder ses valeurs.
4. **skills/agents/hooks** : copier **seulement** les dossiers/fichiers **absents** ; ne pas écraser les siens.
5. **Vérifier** : `node cli/src/index.js banner IAKAFRAME` et les hooks câblés.

## 8. Ce qui reste de StefFrame1 (rappel — inchangé)

Atomes `library/` ventilés, `methode-de-travail.md`, `methods/teams/bindings`, **16 skills SF1**
(dont 4 déparamétrées ; SF2 porte **17 skills** depuis l'ajout de `retrait` à la re-synchro),
**5 kits runner**, `docs/git-hosting.md`, `README.md`, et les règles de
déparamétrage §9 de SF1 (placeholders `<GIT_HOST>`, `<GIT_TOKEN>`, `<IAKAFRAME_HOME>`,
`<CHARTES_DIR>`, `<MQTT_BROKER>`, `<APPFLOWY_URL>`, etc.). **Aucune régression** : les gates SF1
restent verts sur le corpus (§12-A/B).

---

## 9. GUIDE-INSTALLATION.md (contenu, court — porté par Gimli)

Créer un `GUIDE-INSTALLATION.md` **fonctionnel et bref** (installation, pas narratif) :
1. **Prérequis** : Claude Code + **Node.js ≥ 20**.
2. **Poser la conf globale via l'installeur** (collision-aware, §7-bis) — **PAS de `cp` bruts** :
   - Voir le plan sans rien écrire : `node install.mjs --dry-run`.
   - Poser en fusion sûre (défaut, garde l'existant, backup auto) : `node install.mjs` (ou `--yes`).
   - Alternatives : `--overwrite` / `--keep` ; `--backup-dir <path>`. Repli **manuel** documenté (§7-bis.6).
3. **Installer le CLI** : `cd cli && npm install -g .` → commande `iakaframe` disponible
   (zéro dépendance, offline). Alternative sans install : `node cli/src/index.js <cmd>`.
4. **Pointer le foyer** : `export IAKAFRAME_ROOT=<dossier-décompressé>` (ou `--root <frame>` sur
   les commandes library) ; renseigner les placeholders `<…>` (git, chartes) selon besoin.
5. **Vérifier** : `iakaframe banner IAKAFRAME` (FIGlet) ; `iakaframe list personas --root .` (8).

> **Délimitation de rôle** : ce guide est un **README d'installation** (ressort de la livraison,
> Gimli). Un **guide utilisateur riche** (prise en main pas-à-pas, captures) relève de **Nathalie**
> et est **HORS scope** de cette instruction — à déclencher séparément si le décideur le souhaite.

---

## 10. Exclusions explicites (StefFrame2)

- **GUI** iakaFrameGUI (repo, `packages/core`, `src/forge`, `refs.ts`) — 0 fichier, 0 référence.
- **Tests CLI** `cli/test/**` : fixtures porteuses de `iakaIDE`/`iakaide` + `vocab-parity.test.js`
  exige le cœur GUI (non livré) → **EXCLU** (ne casse pas l'exécution ; évite un faux-négatif de gate).
- **`cli/.npmrc`** (registre LAN privé) — EXCLU (§5.3).
- **`cli/scripts/bundle.js`** (bundler de publication npm, workflow registre privé) — EXCLU.
- **`cli/.gitignore`** — non pertinent au ZIP — EXCLU.
- **Artefacts perso de settings** : statusline `iakaTokenCounter`, daemon, LSP `rust-analyzer`,
  marketplaces `gitkraken`, `bypassPermissions` — EXCLUS du settings d'exemple (§7).
- **Fichiers interdits (inchangé)** : `SECRETS.env`, `.env`, tokens, `node_modules/`, `.git/`,
  `dist/`, `build/`, `test.mjs`, mémoires `~/.claude/projects/**`.
- **`.ps1` d'orchestration** : **CONSERVÉS** (parité Windows, déjà en SF1, inoffensifs une fois
  généralisés) ; mais le `settings.example.json` câble **uniquement** les `.mjs` (le fils installe
  Node). Décision assumée : garder pour cross-OS, ne pas les référencer dans l'exemple.

---

## 11. Règles de gate RÉVISÉES (récapitulatif vérifiable)

- **A — Corpus (STRICT, hérité SF1)** : grep §12-B de SF1 = **0** sur tout le frame **SAUF** `cli/`.
  Ajout : `grep -rniE 'naonedge|cinabre|grue' design-starter/` = **0**.
- **B — Sous-arbre `cli/` (ASSOUPLI, §5.2)** : `grep -rnE '192\.168|:1883|:3001|\bsjupin\b|iakabox|iakaFrameGUI|packages/core|api/packages' cli/` = **0**. Noms fonctionnels tolérés.
- **C — Zéro-GUI (ré-exprimé, frame entier)** : `grep -rl 'iakaFrameGUI\|packages/core\|src/forge\|refs\.ts'` sur `frames/releases/StefFrame2/` = **0 fichier**.
- **D — Fichiers interdits (inchangé)** : aucun secret/`.env`/`node_modules`/`.git`/`dist`/`build`/`test.mjs` ; `cli/test`, `cli/.npmrc`, `cli/scripts/` absents.

---

## 12. Critères de complétude VÉRIFIABLES (pass/fail)

**A. Conservation SF1 (mise à jour miroir live — re-synchro `resync-stefframe2-miroir-live.md`)** —
les comptages tiennent dans SF2, mis à jour par la re-synchro sur le live : principles **16**
(ajout de `interruption-minimale-odin` et `merge-versionnement`, anonymisés), rituals 5,
guardrails 3, roles 8, personas 9, scaffolds 2, workflows 1, **skills 17** (ajout de
`iakaframe-retrait` ; `iakaframe-learning` slim), **kits 5**, `docs/git-hosting.md`, `README.md`
présents.

**B. Ajouts présents** :
- `cli/src/index.js` + `cli/src/commands/*.js` = **25** + `cli/src/lib/figfont/*.flf` = **7**
  (dont `standard.flf` et `ansi_shadow.flf`) + `CREDITS.txt`.
- Hooks : `global/hooks/` contient les **5** `.mjs` (`identity-guard`, `perimeter-guard`,
  `identity-remind`, `delegation-guard`, `plan-courante`).
- `settings.example.json`, `design-starter/` (6 fichiers), `GUIDE-INSTALLATION.md` présents.
- `install.mjs` (racine) + wrappers `install.sh` / `install.ps1` présents.

**C. Gates grep** : A, B, C, D du §11 tous **verts**.

**D. Smoke test EXÉCUTABLE (sans installer Claude Code)** — depuis `frames/releases/StefFrame2/` :
1. `node cli/src/index.js --version` → imprime la version.
2. `node cli/src/index.js banner IAKAFRAME` → **FIGlet non vide, multi-lignes** (ANSI Shadow, repli Standard).
3. `node cli/src/index.js jalon --name test --from A --to B --content x` → rend un cadre de jalon.
4. `node cli/src/index.js list personas --root .` → liste **8** personas (lit le `library/` embarqué).
5. `node --check` sur **chacun** des 5 `.mjs` de `global/hooks/` → exit 0.
6. `node --check cli/src/index.js` (et, idéalement, sur chaque `cli/src/**/*.js`) → exit 0.
7. `node -e "JSON.parse(require('fs').readFileSync('kits/iakaframe-claude/global/settings.example.json','utf8'))"`
   → JSON **valide** ; et **chaque** `command` du settings référence un hook **présent** dans `global/hooks/`.
8. `npm install -g ./cli` réussit **offline** (zéro dépendance, aucun registre) → `iakaframe --version` OK.
9. **Installeur** — sur une **fixture `~/.claude` factice** dans un tmp (contenant p.ex. un
   `CLAUDE.md` perso, un `skills/mon-skill/`, un `settings.json` avec un hook maison) :
   - `node --check install.mjs` → exit 0.
   - `node install.mjs --dry-run --target <tmp>` → affiche la **détection + le plan par catégorie**
     (ajout vs collision→action), **n'écrit rien**, **aucun backup** créé.
   - `node install.mjs --merge --yes --target <tmp>` → crée un **backup horodaté** avant écriture,
     **ajoute** les éléments manquants, **conserve** le `CLAUDE.md`/skill/hook maison
     (bloc `iakaframe:start…end` ajouté sans toucher au reste ; hook maison du settings préservé).
   - **Re-run** de la même commande → **idempotent** : plan « rien à changer », aucune duplication.
   - Contrôle : les fichiers/dossiers **hors catégories gérées** de la fixture (p.ex. `projects/`)
     sont **strictement inchangés**.

**E. Autonomie ZIP** : le dossier se zippe/ouvre sans dépendance externe ; aucun lien absolu vers
l'infra du décideur ; le CLI tourne avec Node seul.

---

## 13. Cadre du ZIP `StefFrame2.zip`

- **Nom** : `StefFrame2.zip`. **Contenu** : exactement l'arbre `frames/releases/StefFrame2/`.
- **Contient** (nouveautés) : `cli/` (exécutable, scrubé), les 5 hooks `.mjs`, `settings.example.json`,
  `design-starter/`, `install.mjs` (+ wrappers `install.sh`/`install.ps1`), `GUIDE-INSTALLATION.md`
  — **en plus** de tout SF1.
- **NE contient PAS** : GUI, `cli/test`, `cli/.npmrc`, `cli/scripts`, secrets/tokens, `node_modules`,
  `.git`, `dist/build`, `test.mjs`, artefacts perso de settings (statusline/daemon/LSP/marketplaces).
- **Doit** : s'ouvrir standalone ; `node install.mjs` pose `~/.claude` **sans écraser l'existant**
  (fusion + backup) ; après `npm install -g ./cli`, `iakaframe banner IAKAFRAME` rend le FIGlet.

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
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `frame-stefframe2.md` : delta exécutable (CLI + 3 hooks + settings + charte + **installeur collision-aware** + guide), gate différencié corpus/CLI, smoke tests, cadre ZIP | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation** (chemin:ligne) :
- CLI entrée/chemin critique : `cli/src/index.js:2` (zéro-dep), `cli/src/index.js:58` (banner), `cli/src/index.js:64` (jalon).
- Tension CLI : `cli/src/lib/forgejo.js:6` (`DEF_URL` LAN), `cli/src/lib/forgejo.js:7` (`DEF_USER`), `cli/src/lib/vocab.js:3` (nomme le dépôt GUI), `cli/.npmrc:4` (registre privé — à EXCLURE).
- Version Node & scrub npm : `cli/package.json:10` (`engines.node >=20` → uniformisé partout), `cli/package.json:24` (`publishConfig` registre privé LAN — à RETIRER, §5.3).
- Hooks à ajouter/généraliser : `~/.claude/delegation-guard.mjs:262` (défaut MQTT LAN), `~/.claude/plan-courante.mjs:131` (défaut MQTT LAN), `~/.claude/identity-remind.mjs`.
- Settings réel (à ne PAS recopier tel quel) : `~/.claude/settings.iakaframe-windows.json:22` (powershell + chemin machine), `~/.claude/settings.json:8` (`bypassPermissions`).
- Charte à NE PAS copier : `design-naonedge/naonedge.css` (token dans le nom) → créer `design-starter/` neuf.

**Points ouverts** : AUCUN bloquant. Choix **assumés par Gandalf** (modifiables au jalon) :
1. Gate CLI **assoupli** (option a) plutôt que renommage complet (option b) — motivé §5.
2. `.ps1` **conservés** pour parité cross-OS (settings d'exemple en `.mjs` uniquement) — §10.
3. Installeur : prompts **par élément** groupés **par catégorie** (+ raccourci « toute la catégorie ») ;
   backup **`~/.claude/.iakaframe-backup-<ts>/`** (`Date.now()`) ; flag **`--target <dir>`** ajouté pour
   rendre le smoke test possible hors `~/.claude` réel — §7-bis.

---

## Statut

**VALIDÉ — prêt pour Gimli** (aucun point ouvert bloquant). À « JALON VALIDÉ » → dispatch **Gimli**
pour produire `frames/releases/StefFrame2/` (copie SF1 + ajouts §3–§7) puis `StefFrame2.zip`,
en passant **tous** les gates §11 et le smoke test §12-D.
