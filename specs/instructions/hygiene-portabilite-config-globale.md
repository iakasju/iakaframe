# Instruction — Hygiène & portabilité de la config globale

> Émetteur : 🧙 Gandalf (cadrage, P1). Récepteur : ⚒️ Gimli (dev, P2) **pour la partie
> repo** ; le **décideur** (Stéphane) **pour la partie `~/.claude`** (config privée =
> acte utilisateur). Cible : hygiène de portabilité (macOS `~/work`, CLI Node `iakaframe
> <verbe>`) + recomptage des skills.
> Réf. : ce lot fait suite au **Lot 1** (`lot1-rafraichissement-contrats-agents.md`) qui a
> portabilisé les **contrats d'agents** `~/.claude/agents/` mais a laissé **hors périmètre**
> `~/.claude/CLAUDE.md` et `~/.claude/bootstrap-work.ps1`.

## 1. Problème (avant la solution)

Deux dettes d'hygiène signalées (Legolas + Gimli), **documentaires / config**, sans impact
sur le code de production :

1. **Portabilité de la config globale.** Le runtime réel est **macOS** (`~/work`) et le CLI
   réel est **`iakaframe <verbe>`** (Node, zéro dépendance — cf. `cli/README.md`,
   `cli/src/index.js`). Or **deux fichiers de config privée** portent encore des chemins
   **`C:\work`** et des invocations **PowerShell `pwsh …*.ps1`** :
   - `~/.claude/CLAUDE.md` (instructions globales de l'utilisateur) ;
   - `~/.claude/bootstrap-work.ps1` (script d'amorçage de reconstruction d'un poste).

   La résolution portable existe déjà côté code : `cli/src/lib/root.js:6-11` —
   `--root` > `IAKAFRAME_ROOT` (env) > défaut OS (`~/work` hors Windows, `C:\work` sur
   Windows). Les deux fichiers de config n'en bénéficient pas.

2. **Recomptage README des skills.** `library/skills/README.md:3` annonce **« Treize
   skills »** alors que le pool réel = **19** `SKILL.md` (comptage vérifié ci-dessous). Le
   compte est **doublement périmé** : le header (13) **et** les deux tableaux (7 + 6 = 13)
   omettent **6 skills** réellement présentes. D'autres comptes « N skills » périmés existent
   dans des docs **vivantes** (à corriger) et dans des docs **figées/historiques** (à laisser).

## 2. Faits vérifiés (lecture seule)

### 2.1 Pool réel de skills — 19 `SKILL.md` (source : `library/skills/*/SKILL.md`)

```
 1. iakaframe-odin           8. iakaframe-nathalie        15. iakaframe-gestion-de-source
 2. iakaframe-aragorn        9. iakastart                 16. iakaframe-git
 3. iakaframe-cadrage       10. iakaframe-learning        17. iakaframe-forgejo
 4. iakaframe-qualite       11. iakaframe-retrait         18. iakaframe-init
 5. iakaframe-deploiement   12. iakaframe-naonedge        19. iakaframe-update
 6. iakaframe-docker        13. iakaframe-appflowy-doc
 7. iakaframe-etat-des-lieux 14. iakaframe-log-conversation
```

Total = **19**. Le README en liste **13** (7 rôle + 6 briques). **6 manquent** aux tableaux :
`iakastart`, `iakaframe-learning`, `iakaframe-retrait`, `iakaframe-gestion-de-source`,
`iakaframe-git`, `iakaframe-appflowy-doc` (frontmatter vérifié : bootstrap team ;
surfaces `/learning` et `/retrait` ; couches `capacity`/`family` de la chaîne source-control
déjà décrite en §« Sous-skills » du README ; produit « mémoire humaine » AppFlowy).

### 2.2 Verbes CLI réels (mapping `pwsh …ps1` → `iakaframe <verbe>`)

`cli/src/index.js` + `cli/README.md` confirment les verbes Node : `onboard`, `init`,
`snapshot`, `update`, `services`, `banner`, `go`, `brief`, `recap`, `jalon`, `agents`,
`config`, `root`, `memory`, `review`, `consolidate`, `observe`. Mapping utile ici :

| Invocation Windows (`~/.claude/CLAUDE.md`) | Verbe Node portable |
|---|---|
| `pwsh C:\work\iakaframe\iakaframe-onboard.ps1` | `iakaframe onboard` |
| `pwsh C:\work\iakaframe\iakaframe-snapshot.ps1 -Reason <r>` | `iakaframe snapshot --reason <r>` |
| `pwsh C:\work\iakaframe\iakaframe-update.ps1 [-Reason … -Version … -Note … -NoPush]` | `iakaframe update [--reason … --version … --note … --no-push]` |
| `C:\work\iakaframe\iakabox-usage.html` (réf. doc) | `~/work/iakaframe/iakabox-usage.html` |
| `C:\work\iakaframe\` (réf. chapeau) | `~/work/iakaframe/` (ou `$IAKAFRAME_ROOT/iakaframe`) |

## 3. Inventaire exhaustif des occurrences (fichier:ligne)

### 3.1 EN PÉRIMÈTRE — Portabilité `C:\work` + `.ps1` (config globale)

**A. `~/.claude/CLAUDE.md`** — *acte utilisateur* (voir §5 : proposer le diff, ne pas imposer)
- `~/.claude/CLAUDE.md:4` — `Référence complète : C:\work\iakaframe\` → `~/work/iakaframe/`
- `~/.claude/CLAUDE.md:37` — `pwsh C:\work\iakaframe\iakaframe-onboard.ps1` → `iakaframe onboard`
- `~/.claude/CLAUDE.md:45` — `pwsh C:\work\iakaframe\iakaframe-onboard.ps1` → `iakaframe onboard`
- `~/.claude/CLAUDE.md:48` — `pwsh C:\work\iakaframe\iakaframe-snapshot.ps1 -Reason reprise` → `iakaframe snapshot --reason reprise`
- `~/.claude/CLAUDE.md:81` — `usage : C:\work\iakaframe\iakabox-usage.html` → `~/work/iakaframe/iakabox-usage.html`
- `~/.claude/CLAUDE.md:87` — `pwsh C:\work\iakaframe\iakaframe-snapshot.ps1 -Reason version|pause|reprise -Note "..."` → `iakaframe snapshot --reason version|pause|reprise --note "..."`
- `~/.claude/CLAUDE.md:94` — `pwsh C:\work\iakaframe\iakaframe-update.ps1` → `iakaframe update`
- `~/.claude/CLAUDE.md:96` — options `-Reason version -Version vX.Y.Z -Note "..."`, `-NoPush` → `--reason … --version … --note …`, `--no-push`

**B. `~/.claude/bootstrap-work.ps1`** — *décision à trancher* (§5, option portable ou artefact assumé)
- `~/.claude/bootstrap-work.ps1:3` — synopsis « Reconstruit **C:\work** … »
- `~/.claude/bootstrap-work.ps1:7` — « clone chaque depot dans **C:\work** »
- `~/.claude/bootstrap-work.ps1:17` — exemple `C:\Users\<toi>\.claude\bootstrap-work.ps1`
- `~/.claude/bootstrap-work.ps1:20` — `[string]$Root = 'C:\work'` (défaut du paramètre)

**C. Déploiement personnel périmé (fix = re-déployer depuis la library)**
- `~/.claude/skills/iakastart/SKILL.md:26` — `node C:\work\iakaframe\cli\src\index.js banner …`
- `~/.claude/skills/iakastart/SKILL.md:73` — `~/work (Unix) / C:\work`
  → La **source** `library/skills/iakastart/SKILL.md` est **propre** (aucun `C:\work`) : la
  copie déployée est une **ancienne install**. Correctif : redéployer la skill (pas d'édition
  manuelle de la copie). *(Note : `~/.claude/file-history/**` = cache système, à ignorer.)*

### 3.2 EN PÉRIMÈTRE — Comptes de skills **vivants** périmés

- `library/skills/README.md:3` — **« Treize skills »** → **« Dix-neuf skills »** (cible principale)
- `library/skills/README.md:19` — titre tableau **« … les agents (7) »** → reste **7** (inchangé)
- `library/skills/README.md:34` — titre tableau **« Skills méthode & briques (6) »** → **(12)**
- `README.md:22` (racine) — table `skills/` : **« 12 skills »** → **« 19 skills »**
- `iakaframe-skills.html:95` — hero-meta **« 7 skills de rôle + 6 briques »** → **« 7 + 12 »**
- `iakaframe-skills.html:101` — titre **« Les 13 skills, par famille »** → **« Les 19 skills »**
  *(HTML de présentation : le corps liste les skills → rebuild plus complet ; voir §7 si
  différé.)*

### 3.3 HORS PÉRIMÈTRE — Occurrences **assumées / figées** (à NE PAS toucher)

- **Défaut Windows légitime** : `cli/src/lib/root.js:9` (`return 'C:\\work'`) — branche Windows
  **voulue** de la résolution portable. **Conserver.**
- **Scripts PowerShell du repo** (`iakaframe-onboard.ps1`, `-snapshot`, `-update`, `-init`,
  `-agents`, `-services`, `-alternatives`, `-config`, …) : **artefacts Windows assumés**
  (power-path), superséés par le CLI Node mais conservés. Leurs `C:\work` restent.
- **Frames figées** : tout `frames/releases/StefFrame1/**` et `StefFrame2/**` (dont
  `…/cli/src/lib/root.js:2`, `…/skills/README.md:3` « Seize skills ») = **snapshots de
  release gelés**. **Ne jamais éditer.**
- **Docs de frame** : `docs/guide-stefframe2.md` / `docs/guide-stefframe2.html`
  (« 16/17 skills ») décrivent le **contenu figé de StefFrame2**, pas le pool vivant → **hors
  scope** (à confirmer, cf. §8).
- **Instructions historiques datées** : `specs/instructions/*.md` (`frame-stefframe1.md`
  « 16 skills », `team-globale-niveau-claude.md` « 13 skills », `rangement-bibliotheque-pluriel.md`
  « 15 skills », `frame-stefframe2.md` « 17 skills », `audit-frame.md`/`docs/guide-stefframe2*`
  « 4 skills infra », etc.) = **journaux datés** décrivant un état à leur date. **Conserver.**
- **Docs méthode portant `C:\work` comme exemple de chapeau** (`methode-de-travail.md/.html`,
  `specs/equipe-agents.md`, `README.md` racine hors L22, `iakaframe-methode.html`,
  `doc/index.html`) : dette de portabilité **réelle mais distincte** → **lot séparé** (§8),
  **pas** dans ce lot.

## 4. Recomptage README (détail de la cible §3.2)

Recomptage **factuel** (le pool `skills` de l'intégrité `subskills ⊆ skills` compte les 19) :

- **Header** : `Treize` → `Dix-neuf`.
- **Tableau « Skills de rôle — les agents (7) »** : **inchangé** (odin, aragorn, cadrage,
  qualite, deploiement, naonedge, nathalie ; Gimli sans skill dédiée — rappel maintenu).
- **Tableau « Skills méthode & briques »** : **(6) → (12)**, en ajoutant les 6 lignes
  manquantes avec leur rôle :
  - `iakastart` — bootstrap team (banner + roster, sans spawn) ;
  - `iakaframe-learning` — surface `/learning` (revue du réservoir d'apprentissage) ;
  - `iakaframe-retrait` — surface `/retrait` (détacher/retirer un élément matérialisé) ;
  - `iakaframe-gestion-de-source` — **capacité** source-control (déjà décrite en §Sous-skills) ;
  - `iakaframe-git` — **famille** protocole git (idem) ;
  - `iakaframe-appflowy-doc` — produit « mémoire humaine » (publication AppFlowy).
- **Contrôle** : 7 + 12 = **19** = nb de `SKILL.md`. Le décideur peut préférer un autre
  regroupement (ex. une 3ᵉ rubrique « couches produit/capacité ») — **point ouvert §8**.

## 5. Réserve « acte utilisateur » — application sur `~/.claude`

- **`~/.claude/CLAUDE.md` = instructions globales du décideur.** Son édition est un **acte
  utilisateur** (règle récurrente « CLAUDE.md global = acte du décideur »). Gimli **ne l'édite
  pas**. Livrable attendu : un **diff prêt à appliquer** (les 8 lignes de §3.1.A) que le
  décideur **valide et applique lui-même**, ou autorise explicitement.
- **`~/.claude/bootstrap-work.ps1` — décision à trancher** (recommandation Gandalf, le décideur
  arbitre) :
  - **Option 1 (recommandée, MVP)** : ajouter un **équivalent portable Node** `bootstrap-work.mjs`
    (zéro-dep : `os.homedir()/work` par défaut + `IAKAFRAME_ROOT`, `fetch` API Forgejo, `git
    clone`) — cohérent avec le CLI Node (node déjà pré-requis) et **exécutable sur le runtime
    macOS réel**. Le `.ps1` reste comme **artefact Windows assumé** (hors critère grep).
  - **Option 2** : laisser `.ps1` seul, **artefact Windows assumé**, avec un en-tête « Windows
    only » ; sur macOS, l'amorçage se fait à la main / via le CLI. Zéro travail, mais pas
    d'outil d'amorçage sur le runtime courant.
  - Ces deux fichiers vivant dans `~/.claude` (espace privé), leur application relève du
    **décideur** (ou d'une délégation explicite), pas d'une écriture repo automatique.

## 6. Critères d'acceptation (testables)

1. **Recomptage README (repo, applicable par Gimli).**
   - `library/skills/README.md:3` dit **« Dix-neuf skills »** (plus aucun « Treize »).
   - Les deux tableaux totalisent **19** skills (7 rôle + 12 briques), et les **6 skills**
     de §2.1 y figurent chacune une fois.
   - `grep -RniE "\b(treize|douze|13|12)\b.{0,12}skills?" library/skills/README.md README.md`
     ne renvoie **aucun** compte périmé pour le pool vivant.
   - `README.md:22` (racine) dit **« 19 skills »**.
2. **Comptes de présentation vivants.** `iakaframe-skills.html` n'affiche plus « 13 » / « 7 + 6 »
   pour le pool (soit corrigé en 19 / 7 + 12, soit **explicitement différé** en §8 et tracé).
3. **Aucun autre compte « N skills » périmé vivant** : hors `frames/releases/**`,
   `docs/guide-stefframe2*` et `specs/instructions/*.md` (journaux datés), aucun fichier
   **vivant** n'annonce un total de skills ≠ 19.
4. **Portabilité `~/.claude/CLAUDE.md`** (après feu vert décideur) : `grep -n "C:\\\\work\|\.ps1"
   ~/.claude/CLAUDE.md` = **0** ; les commandes citées sont des verbes `iakaframe <verbe>` avec
   options `--kebab-case`.
5. **Portabilité amorçage** : selon l'option retenue (§5), soit `bootstrap-work.mjs` existe et
   ne contient **aucun** `C:\work` (défaut `~/work` + `IAKAFRAME_ROOT`), soit le `.ps1` porte
   un en-tête « Windows-only » assumé (et reste **hors** critère grep).
6. **Déploiement iakastart** : après re-déploiement, `~/.claude/skills/iakastart/SKILL.md` ne
   contient plus `C:\work` (aligné sur la source `library/`).
7. **Non-régression** : aucune modification de `frames/releases/**`, `cli/src/lib/root.js`, des
   `*.ps1` du repo, ni des instructions/docs historiques listées en §3.3. `typecheck + lint +
   tests` du CLI restent verts (le lot ne touche pas le code).

## 7. Périmètre fermé (ce que fait ce lot)

- **Repo (Gimli)** : recompter `library/skills/README.md` (13 → 19), corriger `README.md:22`
  (12 → 19), corriger/retracer `iakaframe-skills.html` (13 → 19). **Doc uniquement, aucun code.**
- **`~/.claude` (décideur)** : diff proposé pour `CLAUDE.md` (§3.1.A) ; arbitrage bootstrap
  (§5) ; re-déploiement de la skill `iakastart`.

## 8. Hors périmètre (dettes séparées, inventoriées ici pour le décideur)

- **Portabilité `C:\work` des docs méthode vivantes** (`methode-de-travail.md/.html`,
  `specs/equipe-agents.md`, `README.md` racine hors L22, `iakaframe-methode.html`,
  `doc/index.html`) → **lot dédié** (gros volume, sémantique « chapeau exemple »).
- **Frames figées** `frames/releases/**` et **docs de frame** `docs/guide-stefframe2*` : gelés.
- **Compte CLI périmé** (bonus repéré, hors « N skills ») : `cli/README.md:22` dit « 13
  commandes » alors que `cli/src/index.js` en expose davantage (memory, review, consolidate,
  observe, go, brief, recap, jalon…) → à cadrer à part.

### Points à trancher (décideur)
1. **Bootstrap** : Option 1 (`.mjs` portable) ou Option 2 (`.ps1` Windows-only assumé) ? (§5)
2. **Regroupement README** : garder « rôle (7) + briques (12) » ou introduire une 3ᵉ rubrique
   « couches produit/capacité » (gestion-de-source, git, forgejo, appflowy-doc, docker) ? (§4)
3. **`iakaframe-skills.html`** : rebuild complet maintenant (19) ou différer et tracer ? (§6.2)
4. **Périmètre docs méthode** : lancer le lot séparé §8 maintenant ou plus tard ?

## 9. Jalon (gate humain)

```
Émetteur                 | Contenu                                              | Récepteur
-------------------------|------------------------------------------------------|---------------------------
🔵 Gandalf (Cadrage, P1) | Instruction fermée `hygiene-portabilite-config-      | 🟢 Décideur (Stéphane)
                         | globale.md` : inventaire exhaustif (§3), recomptage  | → valide/arbitre (§8)
                         | 13→19 (§4), réserve « acte utilisateur » sur         | → dispatch **Gimli**
                         | CLAUDE.md (§5), critères testables (§6).             | (repo) + applique lui-même
                         |                                                      | (`~/.claude`)
```

Fichiers à vérifier : `library/skills/README.md:3`, `README.md:22`, `iakaframe-skills.html:95`,
`~/.claude/CLAUDE.md:4`, `~/.claude/bootstrap-work.ps1:20`, `~/.claude/skills/iakastart/SKILL.md:26`,
`cli/src/lib/root.js:6`.

À la validation : « JALON VALIDÉ » → Gimli exécute la partie repo (§7) ; le décideur applique
le diff `~/.claude/CLAUDE.md` et tranche les points ouverts (§8).
