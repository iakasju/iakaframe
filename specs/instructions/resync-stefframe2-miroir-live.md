# Instruction — Re-synchroniser `StefFrame2` sur le live (miroir), en PRÉSERVANT l'anonymisation

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (P2). Statut en fin de doc.
> Réf. : `specs/instructions/frame-stefframe2.md` (recette de build), `specs/instructions/frame-stefframe1.md`
> (§9 déparamétrage), `specs/instructions/audit-frame.md` (B1.1/B1.2, A3.1), `methods/iakaframe.md`,
> `library/`. Cadrage lié : `specs/instructions/correctif-roster-team-helm.md` (décision roster helm,
> réalisée ICI).

---

## 1. Besoin (reformulé)

Le décideur a tranché : **`StefFrame2` est un MIROIR du live**, pas une release gelée immuable. Son
**drift** par rapport au live (`library/` racine, `methods/`, `teams/`) est donc un **bug** → il faut
**re-synchroniser le frame sur le live**.

**Piège central (à ne surtout pas déclencher)** : `StefFrame2` est une release **volontairement
anonymisée** (destinée au partage — le « fils » du décideur). Une **régénération naïve depuis le live
dé-anonymiserait** le frame (ré-introduction des noms/URL réels : `forgejo`, `naonedge`, `sjupin`,
`192.168.2.11`, `AppFlowy`…). C'est **l'inverse** du but. La re-synchro doit donc **rapatrier le
contenu manquant du live TOUT EN préservant la transformation d'anonymisation**.

---

## 2. Faits vérifiés (lecture réelle, pas de mémoire)

### 2.1 Le mécanisme de build : MONTÉ À LA MAIN, aucun outil, mapping non documenté
- `frame-stefframe2.md` §3 (note d'exécution) : « Gimli **copie** `StefFrame1/` → `StefFrame2/` puis
  applique les ajouts ». → build **manuel**, pas d'outil de génération.
- `audit-frame.md` **B1.1** : « le **mapping de renommage** source↔frame (naonedge→design,
  forgejo→git, appflowy-doc→humandoc) **n'est documenté nulle part** » ; **B1.2** : « **Aucune vérif
  d'intégrité automatisée** sur le frame source » ; **A3.1** : propose de *créer* une skill
  `iakaframe-frame` (open/verify/release) — **elle n'existe pas encore**.
- La passe d'anonymisation n'est **pas un outil** : c'est l'application **à la main** des règles de
  déparamétrage `frame-stefframe1.md` §9 (placeholders `<GIT_HOST>`, `<GIT_TOKEN>`, `<DOC_TOOL>`…)
  **+** un **renommage d'ids** de skills (ci-dessous). Ce renommage n'est capturé dans **aucune
  table réutilisable** → cette instruction la **documente** (§4).

### 2.2 Hypothèse d'anonymisation : CONFIRMÉE par comparaison de CONTENUS (pas juste les noms)
`iakaframe-git/SKILL.md` (frame) **EST** `iakaframe-forgejo/SKILL.md` (live) anonymisé — même
structure, même procédure, mêmes garde-fous, seuls changent l'id et les chaînes d'infra :

| Live `iakaframe-forgejo` | Frame `iakaframe-git` |
|---|---|
| id `iakaframe-forgejo` | id `iakaframe-git` |
| « Forgejo auto-hébergé du homelab iakabox » | « serveur git auto-hébergé (self-hosted) » |
| `http://192.168.2.11:3001/sjupin/<repo>.git` | `<GIT_REMOTE_URL>` |
| `$env:FORGEJO_TOKEN` / `FORGEJO_TOKEN` | `<GIT_TOKEN>` |
| user `sjupin` | `<vous>` |
| `Guide complet : iakabox-usage.html` | `Guide complet : ../../../docs/git-hosting.md` |

Idem confirmé pour la méthode : `methods/iakaframe.md` live dit « mémoire déportée (… + **AppFlowy**) » ;
le frame dit « … + **`<DOC_TOOL>`** ». → `appflowy-doc`→`humandoc`, `naonedge`→`design` relèvent de la
**même transformation intentionnelle**. **L'anonymisation est donc à PRÉSERVER, pas à défaire.**

### 2.3 Le drift a DEUX natures — démêlées par les faits

**(a) VRAI PÉRIMÉ (contenu live absent du frame → à rapatrier, en l'anonymisant) :**
- **Principes : 14 (frame) vs 16 (live).** Manquent : `interruption-minimale-odin` et
  `merge-versionnement`.
  - `library/principles/interruption-minimale-odin.md` : **propre** (aucun token perso ; ne cite que
    `library/personas/odin.md` et `STRATEGIE.md`).
  - `library/principles/merge-versionnement.md` : **contient un token à anonymiser** — ligne 13
    « … + commit global + push **Forgejo** … ». Une copie naïve **injecterait `Forgejo`** dans le
    corpus. → à transformer (`push Forgejo` → `push (serveur git self-hosted)`).
- **`methods/iakaframe.md` — `principleIds` STALE** : live = 16 ids (incluant les deux ci-dessus) ;
  frame = **14** (les deux absents). → à compléter.
- **Skill `iakaframe-retrait` absente du frame.** Live = **17** skills, frame = **16**. Le live a
  **scindé** `iakaframe-learning` (audit A3.4) : `learning` (revue seule) + **`retrait`** (gestes `−`).
  Preuves de contenu :
  - Live `iakaframe-learning` description = « Revoir … la boucle de revue … `iakaframe review` … Pour
    RETIRER … c'est la skill `iakaframe-retrait`. » (**slim**).
  - Frame `iakaframe-learning` description = ancienne version **combinée** (« … ET retirer
    symétriquement … `iakaframe remove|attach|detach|memory remove` »).
  - `library/skills/iakaframe-retrait/SKILL.md` : **propre** (pilote `cli/src/commands/{remove,attach,
    memory}.js`, badge `🟣 [ROYAUME][Retrait]` ; aucun token perso/infra).

**(b) ANONYMISATION VOULUE (transformation intentionnelle → à PRÉSERVER, surtout pas défaire) :**
- `forgejo`→`git`, `naonedge`→`design`, `appflowy-doc`→`humandoc` (ids de skills + prose).
- Placeholders infra : `<GIT_HOST>`, `<GIT_REMOTE_URL>`, `<GIT_TOKEN>`, `<DOC_TOOL>`, `<MQTT_BROKER>`,
  `<vous>`/`<user>`, `<IAKAFRAME_HOME>`, `<CHARTES_DIR>`.

### 2.4 État de propreté ACTUEL du frame (baseline mesurée)
- `grep -riE 'sjupin|192\.168|iakabox|naonedge|iakaFrameGUI' frames/releases/StefFrame2/` → **0**.
- `grep -ri 'grue' …` → **0** (le résidu `grue` de l'audit A3.6 est **déjà corrigé** ; l'audit était
  partiellement périmé).
- `grep -ri 'forgejo' …` → **37 occurrences, uniquement dans `cli/`** (nom **fonctionnel** du provider
  `forgejo.js`, **toléré** par `frame-stefframe2.md` §5.1/§11-B). Le **corpus** (principles/skills/
  personas/teams/methods) est **déjà 0** sur ces tokens.

> **Conséquence sur les critères d'Odin** : le critère brut
> `grep -ri forgejo|naonedge|sjupin frames/releases/StefFrame2/ = 0` est **inatteignable tel quel**
> sans casser le CLI (37 `forgejo` fonctionnels tolérés). Il **doit** exclure `cli/` — cf. §6 (gate
> différencié, aligné sur la décision déjà actée dans `frame-stefframe2.md` §11).

---

## 3. Décision de méthode : MVP = **delta chirurgical**, pas rebuild intégral

Deux approches possibles :

- **A — Delta chirurgical (RETENU, MVP).** N'importer **que** les atomes réellement manquants
  (2 principes + `retrait`), les **anonymiser à la volée**, mettre à jour `methods/iakaframe.md`, slim
  le `learning` du frame, aligner les comptes et le roster. **Ne pas re-dériver** les skills déjà
  anonymisées (`git`/`design`/`humandoc`) : elles sont **correctes** dans le frame — les toucher =
  risque de dé-anonymisation pour **zéro gain**.
- **B — Rebuild intégral depuis le live via un outil d'anonymisation.** C'est la **vraie** réponse
  « miroir auto-synchronisé » (source unique + miroir généré), mais **l'outil n'existe pas**
  (audit A3.1/B1.2) : le construire est un chantier séparé. Un rebuild manuel de ~110 fichiers
  ré-appliquerait l'anonymisation à la main → **précisément le risque de dé-anonymisation** que le
  décideur veut éviter. **Hors MVP.**

**Retenu : A.** Le durable (B — skill `iakaframe-frame` avec `frame verify` + table de scrub
persistée) est **recommandé en suivi** (§9), **non bloquant** pour cette instruction.

---

## 4. Source de vérité, table de mapping, ordre des opérations

### 4.1 Source de vérité
- **Contenu & complétude** = le **live** (`library/` racine, `methods/iakaframe.md`, `teams/`).
- **Forme du frame** = **anonymisée** ; la transformation ci-dessous s'applique à **tout atome
  rapatrié** avant écriture dans le frame.

### 4.2 Table de mapping d'anonymisation (à appliquer aux atomes rapatriés — ET à documenter dans le frame, §9)

| Live (réel) | Frame (anonymisé) |
|---|---|
| id `iakaframe-forgejo` | `iakaframe-git` |
| id `iakaframe-naonedge` | `iakaframe-design` |
| id `iakaframe-appflowy-doc` | `iakaframe-humandoc` |
| « Forgejo » / « forgejo » (prose) | « serveur git (self-hosted) » (prose) ; `<GIT_HOST>` (URL/API) |
| `http://192.168.2.11:3001/sjupin/<repo>.git` | `<GIT_REMOTE_URL>` |
| `$env:FORGEJO_TOKEN`, `FORGEJO_TOKEN` | `<GIT_TOKEN>` |
| `sjupin` (user) | `<vous>` (prose skill) / `<user>` (CLAUDE.md) |
| `iakabox`, `iakaboxlogs` | générique (« homelab » / retiré) |
| `AppFlowy`, `appflowy` | `<DOC_TOOL>` |
| `mqtt://192.168.2.11:1883` | `<MQTT_BROKER>` |
| « Forgé par iakaFrameGUI » | (retiré) |
| `iakaHub` (organe de com externe du portefeuille — **nom valide au canon**) | `<hub>` (prose) |
| `iakagraph` (dépôt d'études mutualisé — **nom valide au canon**) | `<graph>` (prose) |
| `iakacockpit` (app desktop ; ex-`iakaIDE`, **nom périmé renommé au canon** avant tokenisation) | `<ide>` (prose) |
| ports d'infra privée (`3001`, `3041`, `4001`…) | `<port>` (prose/URL) ; au canon : pilotés par env (`IAKAFRAME_GIT_PORT`…), neutres par défaut |

> **Extension 2026-07-22 (lot `frame-stefframe2-fuites`)** : les 4 dernières lignes ci-dessus ont
> été ajoutées après correction des 40 fuites bloquantes (rupture de parité source↔miroir). Deux
> sous-classes à ne pas confondre : `iakaHub`/`iakagraph` restent **inchangés au canon** (noms
> vivants) et sont **seulement** tokenisés au miroir ; `iakaIDE` était un **nom périmé** — il a
> d'abord été **renommé `iakacockpit` au canon** (le nom corrigé est ensuite tokenisé `<ide>`).
> ⚠️ L'alias de runner *legacy* `iakaide` sous `cli/` (identifiant de compatibilité, `vocab.js`…)
> est **toléré** et **distinct** du nom de produit — il n'est PAS renommé ni tokenisé.

> **Portée pour CETTE instruction** : seuls **3 atomes** sont rapatriés. Concrètement, la seule
> substitution effective à faire est **`push Forgejo` → `push (serveur git self-hosted)`** dans
> `merge-versionnement.md`. Les deux autres atomes (`interruption-minimale-odin`, `retrait`) sont
> **déjà propres** et se copient tels quels. La table complète est donnée pour **cadrer la règle** et
> **alimenter la doc de mapping** (§9), pas parce que tout doit être transformé maintenant.

### 4.3 Ordre des opérations (déterministe)
1. **Copier** les 2 principes du live → frame, **en appliquant §4.2** (donc anonymiser
   `merge-versionnement.md`). Écrire dans **les 2 emplacements** du frame : `principles/` (flat) **et**
   `library/principles/`.
2. **Compléter** `frames/releases/StefFrame2/methods/iakaframe.md` : ajouter
   `interruption-minimale-odin, merge-versionnement` en **fin** de `principleIds` (→ 16 ids, ordre
   identique au live).
3. **Copier** `iakaframe-retrait/SKILL.md` du live → frame (propre, aucune transformation), dans **les
   3 emplacements** : `skills/` (flat), `library/skills/`, `kits/iakaframe-claude/.claude/skills/`.
4. **Slim** le `iakaframe-learning/SKILL.md` du frame (3 emplacements) : remplacer la `description`
   combinée par la version **slim du live** (revue seule + renvoi vers `iakaframe-retrait`). Vérifier
   le **corps** de la skill : retirer les sections de retrait qui ont migré vers `retrait` (aligner
   sur le corps live de `iakaframe-learning`).
5. **Roster team** (réalisation de la décision `correctif-roster-team-helm.md`) : dans
   `frames/releases/StefFrame2/teams/iakaframe-8.md`, ajouter `helm` → `personas: [odin, aragorn,
   gandalf, gimli, legolas, helm, loki, nathalie]` (8, ordre identique au live). **Ne pas** ré-injecter
   « Forgé par iakaFrameGUI » (le frame dit « ids de `personas/` » — conserver la forme anonymisée).
6. **Gates** (§6) puis **comptes** (§5) puis **smoke** (§7).

---

## 5. Alignement des comptes (après re-synchro)

| Élément | Frame avant | Frame après | Live | Vérif |
|---|---|---|---|---|
| principles (`library/principles/` + flat) | 14 | **16** | 16 | comptage fichiers + `principleIds` de la méthode |
| skills (×3 emplacements) | 16 | **17** | 17 | comptage dossiers `SKILL.md` |
| roster `teams/iakaframe-8.md` | 7 | **8** | 8 | `personas: […]` = 8, = binding |

> **Note de cohérence** : `frame-stefframe2.md` §12-A (critères de conservation) fige
> « principles **14** … skills **16** ». Après cette re-synchro, ces attendus deviennent **16** et
> **17**. → **Mettre à jour `frame-stefframe2.md` §12-A** (14→16, 16→17) **dans la même livraison**,
> pour qu'un futur rebuild ne teste pas des comptes périmés. (Édition doc, pas frame — même
> exécutant.)

---

## 6. Gate d'anonymisation (différencié corpus / `cli/`, aligné sur `frame-stefframe2.md` §11)

**A — Corpus (STRICT, tout le frame SAUF `cli/`)** — doit renvoyer **0** :
```
grep -rniE 'forgejo|naonedge|appflowy|iakabox|iakaFrameGUI|192\.168|:3001|:1883|\bsjupin\b|grue' \
  frames/releases/StefFrame2 --exclude-dir=cli
```

**B — Sous-arbre `cli/` (ASSOUPLI, §5.1 SF2)** — doit renvoyer **0** (`forgejo` fonctionnel toléré) :
```
grep -rnE '192\.168|:1883|:3001|\bsjupin\b|iakabox|iakaFrameGUI|packages/core|api/packages' \
  frames/releases/StefFrame2/cli
```
> Baseline mesurée : A = 0 aujourd'hui (rester à 0 après ajout du delta anonymisé) ; B = 0 aujourd'hui.

---

## 7. Critères d'acceptation (pass/fail, testables)

1. **Complétude** :
   - `frames/releases/StefFrame2/library/principles/` **= 16** dossiers, **=** l'ensemble d'ids du live.
   - `frames/releases/StefFrame2/principles/` (flat) **= 16**, **identique** à `library/principles/`.
   - `methods/iakaframe.md` du frame : `principleIds` **= 16**, **ensemble égal** à celui du live.
   - Skill `iakaframe-retrait` présente dans **les 3** emplacements ; total skills **= 17** par
     emplacement, **=** l'ensemble d'ids du live **après application du mapping §4.2** (donc :
     live `forgejo/naonedge/appflowy-doc` ↔ frame `git/design/humandoc`, le reste à l'identique).
2. **Anonymisation préservée** : gate §6-A **= 0** et §6-B **= 0**. En particulier `merge-versionnement.md`
   du frame ne contient **pas** « Forgejo ».
3. **Cohérence learning/retrait** : la `description` du `iakaframe-learning` du frame (×3) **=** celle
   du live (slim, renvoie vers `retrait`) ; aucune duplication de responsabilité entre les deux skills.
4. **Roster** : `teams/iakaframe-8.md` du frame `personas` **= 8** et **=** l'ordre du binding
   (cf. `correctif-roster-team-helm.md`).
5. **Intégrité référentielle** : chaque `skills:[]` de persona du frame résout dans `skills/` ;
   chaque `principleIds` de la méthode résout dans `principles/`. **0 dangling ref.**
6. **Non-régression** : les critères déjà verts de `frame-stefframe2.md` restent verts, **§12-A mis à
   jour** (14→16, 16→17) ; smoke §12-D toujours vert (notamment `list personas --root .` = 8).
7. **Tests des deux dépôts verts** : après commit, `update iakaframe` OK ; le frame se zippe/ouvre sans
   dépendance externe.

---

## 8. DANS / HORS

**DANS** : rapatrier les 2 principes (anonymisés) + `retrait` ; slim `learning` du frame ; compléter
`principleIds` ; fixer le roster ; propager sur tous les emplacements dupliqués ; passer les gates ;
mettre à jour les comptes de `frame-stefframe2.md` §12-A.

**HORS** :
- **Défaire l'anonymisation** (interdit — cœur de l'instruction).
- **Rebuild intégral** / construire l'outil `iakaframe-frame` (→ §9, suivi séparé).
- **Toucher au CLI** au-delà de la vérification du gate §6-B (le `forgejo` fonctionnel reste).
- **Dé-dupliquer** les 3 copies d'atomes (chantier `frame verify`/source-unique — audit B2.1, §9).
- **Arbitrer Odin-dans-le-roster** (adjacent, cf. `correctif-roster-team-helm.md` §Points ouverts).

---

## 9. Suivi recommandé (NON bloquant — à cadrer séparément si le décideur le veut)

- **Outil `iakaframe-frame` (open/verify/release)** + **table de scrub persistée** (audit A3.1/B1.1/
  B1.2) : rend le miroir **auto-vérifiable** (`frame verify` : comptes, dangling refs, gate grep) et la
  re-synchro **reproductible** — supprime la maintenance ×3 (audit B2.1) et le risque de
  dé-anonymisation manuelle. C'est la réponse durable à « le frame est un miroir du live ».
- **Source unique + miroir généré** pour les 3 copies d'atomes (flat / `library/` / kit).

---

## 10. Points ouverts (à trancher au gate)

1. **Périmètre du gate grep d'Odin** : confirmer l'**exclusion de `cli/`** (§6) — sinon le critère est
   inatteignable (37 `forgejo` fonctionnels tolérés). *Reco Gandalf : exclure `cli/`, aligné SF2 §11.*
2. **Mise à jour de `frame-stefframe2.md` §12-A** (comptes 14→16, 16→17) dans la même livraison —
   *Reco Gandalf : oui* (sinon recette périmée).
3. **MVP delta vs rebuild** : valider l'approche **A** (§3). *Reco Gandalf : A maintenant, B en suivi.*
4. **Corps de `iakaframe-learning`** : confirmer qu'on aligne **strictement** sur le corps live (au-delà
   de la seule `description`). *Reco Gandalf : oui, aligner corps + description.*

---

## 11. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `resync-stefframe2-miroir-live.md` : delta chirurgical (2 principes anonymisés + `retrait` + slim `learning` + `principleIds` + roster), mapping d'anonymisation documenté, gate différencié corpus/`cli/`, comptes 16/17/8, critères testables | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Preuve d'anonymisation : `library/skills/iakaframe-forgejo/SKILL.md:16` (URL réelle) ↔
  `frames/releases/StefFrame2/kits/iakaframe-claude/.claude/skills/iakaframe-git/SKILL.md:16`
  (`<GIT_REMOTE_URL>`).
- Périmé (a) principes : `methods/iakaframe.md:5` (16 ids) ↔
  `frames/releases/StefFrame2/methods/iakaframe.md:5` (14 ids).
- Token à anonymiser : `library/principles/merge-versionnement.md:13` (« push Forgejo »).
- Principe propre : `library/principles/interruption-minimale-odin.md:1`.
- Périmé (a) skill : `library/skills/iakaframe-retrait/SKILL.md:1` (absente du frame) ;
  `library/skills/iakaframe-learning/SKILL.md:4` (slim) ↔
  `frames/releases/StefFrame2/library/skills/iakaframe-learning/SKILL.md:4` (combinée, à slim).
- Recette à mettre à jour : `specs/instructions/frame-stefframe2.md:367` (§12-A comptes 14/16).

---

## Statut

**PROPOSÉ — en attente de validation décideur.** À « JALON VALIDÉ » → dispatch **Gimli** pour appliquer
§4.3 (delta anonymisé + roster + comptes), passer les gates §6 et les critères §7. Points ouverts §10
non bloquants (recos Gandalf fournies).
