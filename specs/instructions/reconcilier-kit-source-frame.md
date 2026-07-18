# Instruction — Réconcilier le kit source `iakaframe-claude` avec la frame `StefFrame2`

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut en fin de doc.
> Réf. : `specs/instructions/frame-stefframe2.md`, `specs/instructions/parite-enforcement-multirunner.md`,
> `specs/instructions/scinder-learning-deux-skills.md`, `cli/src/lib/kit.js`, `cli/src/lib/agents.js`,
> `cli/src/lib/library.js`, `cli/src/commands/init.js`, `cli/src/commands/onboard.js`.

---

## 1. Besoin (reformulé)

Le kit **SOURCE** `kits/iakaframe-claude/` (dépôt iakaframe) a **divergé** de sa copie
**figée** dans la release `frames/releases/StefFrame2/kits/iakaframe-claude/`. Le décideur veut
**RÉCONCILIER**.

Ce n'est **PAS** une synchro à sens unique : la divergence est **bidirectionnelle** et une
partie est **intentionnelle**. Un `cp -r` aveugle (dans un sens ou l'autre) est **interdit** —
il écraserait soit l'avance de la source (refactor multi-runner, split learning), soit
réimporterait dans la source les **placeholders de déparamétrage** et les **matérialisations**
propres à la frame.

Objectif : rapatrier la **vraie dette** (3 hooks + settings absents en source), **préserver**
l'avance de la source, et **documenter** chaque divergence laissée en l'état, avec sa raison.

---

## 2. Ce qui existe — constat vérifié (lecture seule)

Contenu **source** `kits/iakaframe-claude/` :
`CLAUDE.md`, `.claude/settings.local.json`, `.claude/commands/{iaka,learning,retrait}.md`,
`global/{CLAUDE.md,README.md}`, `global/hooks/{guard-core,identity-guard,perimeter-guard}.mjs`,
`global/hooks/{identity-guard,identity-remind,perimeter-guard}.ps1`,
`specs/PROJET.md`, `specs/instructions/_TEMPLATE.md`.

Contenu **frame** `frames/releases/StefFrame2/kits/iakaframe-claude/` : idem **sauf** —
- **en plus** : `.claude/agents/*.md` (8), `.claude/skills/*` (16), `docs/git-hosting.md`,
  `global/hooks/{delegation-guard,identity-remind,plan-courante}.mjs`, `global/settings.example.json` ;
- **en moins** : `global/hooks/guard-core.mjs`, `.claude/commands/retrait.md` ;
- **déparamétré** : `CLAUDE.md`, `global/CLAUDE.md`, `global/README.md` (placeholders `<…>` :
  `<IAKAFRAME_HOME>`, `<GIT_REMOTE_URL>`, `<GIT_TOKEN>`, « le décideur » au lieu de « Stéphane »…) ;
- **standalone** (pré-refactor) : `global/hooks/{identity-guard,perimeter-guard}.mjs` ne
  consomment PAS `guard-core.mjs` (absent de la frame).

Faits d'architecture confirmés par le code (déterminants pour la §4) :

| Fait | Preuve (chemin:ligne) |
|---|---|
| `init` déploie le kit par **copie récursive** du seul dossier `kits/iakaframe-claude/` (n'ajoute AUCUN agent/skill) | `cli/src/commands/init.js:58` → `copyKit` `cli/src/lib/kit.js:72` |
| Les personas/skills sont matérialisés **séparément** vers `<projet>/.claude/{agents,skills}` par `affectPersona`/`fullteam` | `cli/src/lib/agents.js:80`, `:125` ; appelé par `onboard.js` (umbrella) `:117` |
| La **source de vérité** des personas = `library/personas/` (8) ; des skills = `library/skills/` (dont `iakaframe-retrait`, `iakaframe-naonedge` — plus récents que la frame) | `cli/src/lib/library.js:15-28` (table `COLLECTIONS`) ; `library/skills/*/SKILL.md` |
| `guard-core.mjs` porte déjà `verdictDelegation` (verdict pur, roster) prévu pour être **consommé** par un adaptateur | `kits/iakaframe-claude/global/hooks/guard-core.mjs:128` |
| `guard-core.mjs` doit rester **octet-pour-octet identique** entre kits (test de parité) | `cli/test/guard-core-parity.test.js:24` |
| `identity-guard.mjs` / `perimeter-guard.mjs` **source** consomment déjà `guard-core` (adaptateurs minces) | `kits/iakaframe-claude/global/hooks/identity-guard.mjs:27`, `perimeter-guard.mjs:25` |

> **Note (hors scope, à signaler)** : `agents.js` lit encore `<root>/agents/` et `<root>/skills/`
> (surfaces déplacées vers `library/personas` + `library/skills` par le rangement pluriel). C'est
> une dette **distincte** du déploiement des personas, **non traitée ici**.

---

## 3. Décision de cadrage — le principe directeur

Trois **régimes** de fichiers, trois traitements :

1. **La source est le TEMPLATE RÉEL** (valeurs vraies, code portable fonctionnel) et le **socle
   d'avance** (refactor `guard-core`, split learning). → on **préserve** la source et on **rapatrie**
   ce qui lui manque, **dans la forme de la source** (pas la forme figée de la frame).
2. **La frame est une RELEASE FIGÉE + DÉPARAMÉTRÉE + AUTO-CONTENUE** (placeholders pour diffusion,
   matérialisation des agents/skills pour son installeur collision-aware). → ces caractéristiques
   sont **voulues** et **ne remontent jamais** dans la source.
3. **La frame reste GELÉE** : on ne la régénère pas ici (§6). La réconciliation se reflétera dans
   la **prochaine** génération de frame (qui re-matérialisera/re-déparamétrera depuis la source).

---

## 4. Table de réconciliation — fichier par fichier (décision + justification)

Légende décision : **GARDER-SOURCE** (avance à préserver) · **RAPATRIER** (dette à ramener en
source) · **LAISSER-DIVERGER** (divergence intentionnelle documentée) · **INCHANGÉ** (déjà aligné).

| Fichier (relatif au kit) | Source | Frame | Décision | Justification |
|---|---|---|---|---|
| `global/hooks/guard-core.mjs` | présent | **absent** | **GARDER-SOURCE** | Avance : socle du refactor multi-runner (v0.10.0). La frame est antérieure ; il n'apparaîtra côté frame qu'à la prochaine génération. Ne rien faire. |
| `global/hooks/identity-guard.mjs` | refactoré (consomme `guard-core`) | standalone | **GARDER-SOURCE** | Avance : adaptateur mince. La forme frame (standalone) est périmée. Ne rien faire. |
| `global/hooks/perimeter-guard.mjs` | refactoré (consomme `guard-core`) | standalone | **GARDER-SOURCE** | Idem `identity-guard`. Ne rien faire. |
| `.claude/commands/retrait.md` | présent | **absent** | **GARDER-SOURCE** | Avance : split learning v0.9.0 (skill `/retrait`). Ne rien faire. |
| `.claude/commands/iaka.md` | modifié (split learning) | antérieur | **GARDER-SOURCE** | Avance. Ne rien faire. |
| `.claude/commands/learning.md` | modifié (split learning) | antérieur | **GARDER-SOURCE** | Avance. Ne rien faire. |
| `global/hooks/delegation-guard.mjs` | **absent** | présent (standalone) | **RAPATRIER** (forme `guard-core`) | Vraie dette. Ramené **refactoré** pour consommer `verdictDelegation` de `guard-core` (§5.1), pas en copie standalone. |
| `global/hooks/identity-remind.mjs` | **absent** | présent | **RAPATRIER** (tel quel) | Vraie dette. Nudge `stdout` pur, générique, sans placeholder ni défaut LAN → copie directe (§5.2). |
| `global/hooks/plan-courante.mjs` | **absent** | présent | **RAPATRIER** (tel quel) | Vraie dette. Émetteur env-only (`IAKALOG_*`), sans placeholder ni défaut LAN → copie directe (§5.2). |
| `global/settings.example.json` | **absent** | présent (4 hooks) | **RAPATRIER** (version source, §5.3) | Vraie dette, mais **pas** une copie : la version source **câble les 5 hooks présents en source** — dont `perimeter-guard` (absent du câblage frame) et `delegation-guard` une fois rapatrié. |
| `CLAUDE.md` | valeurs réelles | déparamétré `<…>` | **LAISSER-DIVERGER** | La source est le kit **réel** de Stéphane (Forgejo LAN, `FORGEJO_TOKEN`, `iakabox-usage.html`) ; la frame est la release **diffusable** déparamétrée. Régimes distincts et voulus. |
| `global/CLAUDE.md` | valeurs réelles | déparamétré `<…>` | **LAISSER-DIVERGER** | Idem `CLAUDE.md`. |
| `global/README.md` | valeurs réelles | déparamétré `<…>` | **LAISSER-DIVERGER** | Idem `CLAUDE.md`. |
| `docs/git-hosting.md` | absent | présent | **LAISSER-DIVERGER** | Doc **générique** créée par la génération de frame (remplace la réf. réelle `iakabox-usage.html` de la source). Artefact de déparamétrage, pas une dette source. |
| `.claude/agents/*.md` (8) | absent | présent (matérialisé, déparamétré) | **LAISSER-DIVERGER** | **Matérialisation VOULUE** : la frame est auto-contenue (son installeur pose agents/skills depuis `.claude/`). En source, la vérité vit dans `library/personas/` (déployée par `affectPersona`) ; dupliquer dans le kit recréerait la dérive qu'on combat, et importerait la forme **déparamétrée**. |
| `.claude/skills/*` (16) | absent | présent (matérialisé, déparamétré) | **LAISSER-DIVERGER** | Idem agents : vérité = `library/skills/` (plus récente : porte `iakaframe-retrait`, `iakaframe-naonedge`). La frame porte un **snapshot** figé/déparamétré (`iakaframe-design`, `iakaframe-learning` d'avant split). Ne pas rapatrier. |
| `.claude/settings.local.json` | présent | présent | **INCHANGÉ** | Vérifier l'égalité ; aucune action si identique. |
| `specs/PROJET.md`, `specs/instructions/_TEMPLATE.md` | présents | présents | **INCHANGÉ** | Vérifier l'égalité ; aucune action si identique. |
| `global/hooks/*.ps1` (identity-guard, identity-remind, perimeter-guard) | présents | présents | **INCHANGÉ (à vérifier)** | Portage Windows legacy, hors refactor `guard-core`. Vérifier l'égalité octet ; aligner uniquement si divergence non intentionnelle. **Pas** de `.ps1` pour `delegation-guard`/`plan-courante` (aucun des deux côtés). |

**Synthèse des actions d'écriture** : 4 fichiers seulement sont **écrits** en source
(`delegation-guard.mjs`, `identity-remind.mjs`, `plan-courante.mjs`, `settings.example.json`).
Tout le reste est **GARDER-SOURCE** / **LAISSER-DIVERGER** / **INCHANGÉ** → aucune écriture.

---

## 5. Forme précise des fichiers rapatriés

### 5.1 `delegation-guard.mjs` — refactoré pour consommer `guard-core` (PAS une copie standalone)

Point de départ : `frames/releases/StefFrame2/kits/iakaframe-claude/global/hooks/delegation-guard.mjs`.
Le comportement runtime doit rester **strictement identique** ; seule la **source du verdict roster**
change, pour être **symétrique** de `identity-guard.mjs`/`perimeter-guard.mjs` (adaptateur mince →
verdict pur dans `guard-core`). Modifications **exactes** :

1. Ajouter en tête (après le bloc de commentaire, avec les autres `import`) :
   ```js
   import { verdictDelegation, ROSTER, BUILTINS, AGENT_UNSET } from "./guard-core.mjs";
   ```
2. **Supprimer** les déclarations locales devenues redondantes :
   `const ROSTER = new Set([...]);` et `const BUILTINS = new Set([...]);` (lignes ~34-40 de la
   version frame). Le roster/builtins/`AGENT_UNSET` proviennent désormais de `guard-core`.
3. Remplacer, dans la branche `PreToolUse`, la valeur par défaut d'agent et le calcul du verdict :
   - `const agent = ti.subagent_type || ti.subagentType || "(non precise)";`
     → `const agent = ti.subagent_type || ti.subagentType || AGENT_UNSET;`
   - `const known = ROSTER.has(String(agent).toLowerCase()) || BUILTINS.has(String(agent));`
     `if (!known && agent !== "(non precise)") {`
     → `const { refused } = verdictDelegation(agent);`
     `if (refused) {`
4. `ROSTER`/`BUILTINS` importés de `guard-core` sont des **Array gelés** (pas des `Set`). Adapter les
   deux usages restants :
   - message stderr : `[...ROSTER].join(", ")` → `ROSTER.join(", ")` ; `[...BUILTINS].join(", ")`
     → `BUILTINS.join(", ")` ;
   - anti-bruit D5 dans `emitDelegation` : `ROSTER.has(to.toLowerCase())` → `ROSTER.includes(to.toLowerCase())`.
5. Tout le reste (journal `~/.claude/iakaframe-delegations.log`, émission L5 broker/docdb, timeouts,
   fail-open, `AGENT_UNSET` comparaisons) **inchangé**.
6. **Ne PAS toucher `guard-core.mjs`** : il reste octet-pour-octet identique (verrou
   `cli/test/guard-core-parity.test.js`). `verdictDelegation` y existe déjà.

### 5.2 `identity-remind.mjs` et `plan-courante.mjs` — copie directe depuis la frame

Ces deux fichiers de la frame sont **déjà** dans la forme source attendue : code portable, aucun
placeholder `<…>`, aucun défaut LAN codé en dur (broker via `process.env.IAKALOG_*` avec repli vide,
journal local `~/.claude`). → **copier tel quel** dans `kits/iakaframe-claude/global/hooks/`.
**Contrôle avant validation** : `grep -nE '<[A-Z_]+>|192\.168|:1883|/Users/|C:\\\\' ` sur les deux
fichiers rapatriés = **0** (sinon dé-déparamétrer / restaurer la forme réelle avant de committer).

### 5.3 `global/settings.example.json` — VERSION SOURCE (câble les 5 hooks présents en source)

La version frame ne câble que **4** hooks et **omet `perimeter-guard`**. La version source doit
câbler **tous** les hooks réellement présents en source après rapatriement. Contenu attendu (chemins
portables `node ~/.claude/hooks/<hook>.mjs`, un `command` par hook **présent** dans `global/hooks/`) :

| Événement | Matcher | Hook |
|---|---|---|
| `Stop` | — | `identity-guard.mjs` |
| `SubagentStop` | — | `identity-guard.mjs` |
| `UserPromptSubmit` | — | `identity-remind.mjs` |
| `PreToolUse` | `Task` | `delegation-guard.mjs` |
| `PreToolUse` | `Edit\|Write\|Bash\|NotebookEdit` | `perimeter-guard.mjs` |
| `PostToolUse` | `Task` | `delegation-guard.mjs` |
| `PostToolUse` | `TodoWrite\|Task` | `plan-courante.mjs` |

Contraintes : JSON valide ; commentaire `"//"` d'usage (« à fusionner dans `~/.claude/settings.json`,
ne pas clobber ; déposer les hooks dans `~/.claude/hooks/` ») ; aucun chemin machine absolu, aucun
`powershell.exe`, aucun artefact spécifique-machine (statusline/daemon/LSP/marketplaces/permissions).
`guard-core.mjs` n'est **pas** câblé (c'est une bibliothèque, pas un hook).

---

## 6. La frame `StefFrame2` reste GELÉE

**Aucune écriture** dans `frames/releases/StefFrame2/**`. La frame est une **release figée**. Les
écarts « source en avance » (guard-core, split learning, `delegation-guard` refactoré, câblage
`perimeter-guard`) ne seront répercutés côté frame **qu'à la prochaine génération** de frame (qui
re-copie/re-matérialise/re-déparamétrise depuis la source de vérité). Cette instruction ne régénère
pas la frame et ne la « rétro-corrige » pas.

---

## 7. Étapes d'implémentation (Gimli)

1. Rapatrier `delegation-guard.mjs` **refactoré** selon §5.1 (partir de la version frame, appliquer
   les 6 modifications, ne pas toucher `guard-core.mjs`).
2. Copier `identity-remind.mjs` et `plan-courante.mjs` depuis la frame (§5.2) ; passer le grep de
   contrôle anti-placeholder/anti-LAN.
3. Créer `global/settings.example.json` **version source** (§5.3), câblant les 5 hooks.
4. Vérifier les régimes **INCHANGÉ** : `diff` de `.claude/settings.local.json`, `specs/PROJET.md`,
   `specs/instructions/_TEMPLATE.md`, et des 3 `.ps1` entre source et frame ; si divergence non
   intentionnelle, aligner sur la source (ne jamais importer un déparamétrage).
5. Ne **rien** faire pour tous les **GARDER-SOURCE** et **LAISSER-DIVERGER** (les lister au commit).
6. Vérifier (§8), puis committer (conventional commit, ex. `feat(kit-claude): rapatrie
   delegation/identity-remind/plan-courante + settings.example (reconciliation frame)`).

---

## 8. Comportement attendu / Critères d'acceptation (vérifiables)

- [ ] **Diff maîtrisé** : `diff -rq kits/iakaframe-claude/ frames/releases/StefFrame2/kits/iakaframe-claude/`
      ne renvoie **QUE** les divergences documentées §4, à savoir :
      *Only in source* : `global/hooks/guard-core.mjs`, `.claude/commands/retrait.md` ;
      *Only in frame* : `.claude/agents/` (8), `.claude/skills/` (16), `docs/git-hosting.md` ;
      *Differ* : `CLAUDE.md`, `global/CLAUDE.md`, `global/README.md` (déparamétrage),
      `global/hooks/{identity-guard,perimeter-guard,delegation-guard}.mjs` (source consomme
      `guard-core`, frame standalone), `global/settings.example.json` (source câble `perimeter-guard`),
      `.claude/commands/{iaka,learning}.md` (split learning). **Aucune** autre entrée.
- [ ] `identity-remind.mjs` et `plan-courante.mjs` sont **identiques** entre source et frame
      (n'apparaissent donc PAS dans le diff ci-dessus).
- [ ] **delegation-guard consomme guard-core** : `grep -n 'verdictDelegation' delegation-guard.mjs`
      trouve l'import + l'appel ; **aucune** déclaration locale `const ROSTER = new Set` / `BUILTINS = new Set`
      ne subsiste dans le fichier.
- [ ] **guard-core intact** : `cli/test/guard-core-parity.test.js` reste **vert** (guard-core.mjs
      inchangé, octet-pour-octet identique kit-claude ↔ kit-codex).
- [ ] **settings.example.json source valide** : `node -e "JSON.parse(require('fs').readFileSync('kits/iakaframe-claude/global/settings.example.json','utf8'))"`
      → OK ; **chaque** `command` référence un hook **présent** dans `global/hooks/` ; les **5** hooks
      (`identity-guard`, `identity-remind`, `delegation-guard`, `plan-courante`, `perimeter-guard`)
      sont câblés ; `guard-core.mjs` n'est **pas** câblé.
- [ ] **Syntaxe** : `node --check` exit 0 sur les 4 fichiers `.mjs` du dossier `global/hooks/` (dont
      les 3 rapatriés).
- [ ] **Anti-fuite** : `grep -nE '<[A-Z_]+>|192\.168|:1883' kits/iakaframe-claude/global/hooks/*.mjs`
      = **0** (aucun placeholder de frame ni défaut LAN réintroduit dans les hooks source).
- [ ] **Frame gelée** : `git status` ne montre **aucune** modification sous `frames/releases/StefFrame2/`.
- [ ] **Tests CLI verts** : `cd cli && npm test` (aucune régression ; en particulier guard-core,
      guard-identity, guard-perimeter, parity).

## 9. Hors scope

- Régénérer / rétro-corriger la frame `StefFrame2` (§6) et `StefFrame1`.
- Corriger la lecture `<root>/agents/`+`<root>/skills/` de `agents.js` (dette de rangement distincte).
- Rapatrier les agents/skills matérialisés ou la doc `docs/git-hosting.md` dans le kit source (§4 :
  LAISSER-DIVERGER assumé).
- Ajouter un `delegation-guard` côté kit-codex ou un test de parité du verdict délégation
  (amélioration possible mais non requise ; recommandée en suivi).
- Toucher `CLAUDE.md`/`README.md` (source **ou** frame) : les régimes déparamétré/réel sont voulus.

---

## 10. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `reconcilier-kit-source-frame.md` : table de réconciliation fichier par fichier (GARDER-SOURCE / RAPATRIER / LAISSER-DIVERGER), 3 hooks rapatriés (delegation-guard **refactoré guard-core**, identity-remind, plan-courante) + `settings.example.json` **version source** (5 hooks), frame gelée, critères diff-maîtrisé + tests verts | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation** (chemin:ligne) :
- Avance source (à préserver) : `kits/iakaframe-claude/global/hooks/guard-core.mjs:128` (`verdictDelegation`),
  `kits/iakaframe-claude/global/hooks/identity-guard.mjs:27` (import guard-core), `.claude/commands/retrait.md:1`.
- Forme de rapatriement : `frames/releases/StefFrame2/kits/iakaframe-claude/global/hooks/delegation-guard.mjs:34`
  (ROSTER/BUILTINS locaux à retirer), `:74` (calcul `known` à remplacer par `verdictDelegation`),
  `:92` (stderr `[...ROSTER]`), `:185` (`ROSTER.has` → `.includes`).
- Câblage settings : `frames/releases/StefFrame2/kits/iakaframe-claude/global/settings.example.json:3`
  (4 hooks frame → **ajouter** `perimeter-guard` PreToolUse), `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs:3`
  (matcher `Edit|Write|Bash|NotebookEdit`).
- Divergence intentionnelle (à NE PAS rapatrier) : `cli/src/lib/kit.js:72` (`init` copie le kit seul),
  `cli/src/lib/agents.js:80` (agents/skills matérialisés à part), `cli/src/lib/library.js:15`
  (vérité `library/personas`+`library/skills`).
- Verrou parité : `cli/test/guard-core-parity.test.js:24` (guard-core.mjs intact).

**Points ouverts** : AUCUN bloquant. Choix **assumés par Gandalf** (modifiables au jalon) :
1. `delegation-guard` rapatrié **refactoré** (consomme `guard-core`) plutôt que copié standalone — symétrie §5.1.
2. `settings.example.json` **source** câble **aussi** `perimeter-guard` (la frame l'omet) — §5.3.
3. Agents/skills matérialisés de la frame **NON** rapatriés (vérité = `library/`) — §4.

---

## Statut

**VALIDÉ — prêt pour Gimli** (aucun point ouvert bloquant). À « JALON VALIDÉ » → dispatch **Gimli**
pour appliquer §7, en passant **tous** les critères §8 (diff maîtrisé + guard-core intact + tests verts),
sans toucher `frames/releases/StefFrame2/`.
