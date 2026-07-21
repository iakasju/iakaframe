# Instruction — `Bash` de CONSTAT pour le rôle de cadrage

> Statut : **cadrage remis, NON validé**. Gate P1→P2 humain.
> Bi-dépôt : `iakaframe` + `iakaFrameGUI`.
> Rédacteur : 🔵 Gandalf (cadrage). **Juge et partie** : ce lot porte sur ma propre dotation.

## 0. Outillage de ce cadrage — déclaration

Outils réellement disponibles pendant la rédaction : `Read`, `Grep`, `Glob`, `Write`, `Edit`,
`WebSearch`, `WebFetch`. **Toujours pas de shell** — cinquième fois de la journée.

Conséquence assumée, à lire avant de me croire :

- Tous les faits de fichiers ci-dessous sont **lus** (`Read`/`Grep`/`Glob`), donc de premier ordre.
- Tous les faits **d'exécution** sont **non mesurés** : je n'ai pas rejoué `vendor-check`, ni
  `node --test`, ni un seul `git`. Le brief affirme `vendor-check` = `clean` ; **je ne l'ai pas
  vérifié** et je ne le reprends pas à mon compte. C'est une **pré-condition** (§ 7, P-1), pas un
  acquis.
- Les faits de comportement du runner (permissions, hooks, subagents) sont **sourcés sur la doc
  officielle** (§ 2), pas déduits.

---

## 1. Le problème

Le rôle de cadrage doit « poser le problème avant la solution » et « analyser l'existant », mais
il ne peut **rien mesurer**. Il reconstitue. Sur D-9, un verdict `vendor-check` a été **reconstitué
fichier par fichier** et jamais rejoué, d'où une pré-condition bloquante reportée sur le dev. Dans
une méthode dont le principe cardinal est `preuve-avant-declaration`, le cadreur est le seul rôle
structurellement incapable de produire une preuve. C'est le défaut à fermer.

**Ce que le lot ne doit pas faire au passage** : transformer le cadreur en exécutant. La propriété
« lecture seule sur le code » n'est pas un ornement — c'est ce qui rend le gate P1→P2 signifiant.

---

## 2. Faits vérifiés — et **trois faits du brief à corriger**

### 2.1 ⛔ CORRECTION MAJEURE — l'option B, telle que formulée, est **inerte**

Le brief décrit B comme « `Bash` restreint **par permissions** à des commandes de CONSTAT »,
via `permissions.allow`. **Ce mécanisme ne restreint rien.** Deux faits documentés :

1. **`allow` n'est pas un allowlist restrictif.** « **Allow** rules let Claude Code use the
   specified tool **without manual approval**. » Une règle `allow` **supprime une question**, elle
   n'interdit pas ce qui n'est pas listé. Le seul mode où `allow` devient un allowlist fermant est
   `dontAsk` : « Auto-denies tools **unless pre-approved via** `permissions.allow` rules ».

2. **`~/.claude/settings.json` tourne en `bypassPermissions`.** Le brief affirme que la section
   `permissions` a « 0 entrée `allow`, 0 entrée `deny`. **Rien à défaire.** » C'est **faux** :

   ```json
   "permissions": { "defaultMode": "bypassPermissions" }
   ```
   (`/Users/sjupin/.claude/settings.json:2-4`)

   En `bypassPermissions`, les prompts sont sautés — donc **toute** commande passe, et une liste
   `allow` n'ajoute ni ne retire rien.

3. **Un sous-agent ne peut pas s'en extraire.** Doc subagents : « If the parent uses
   `bypassPermissions` or `acceptEdits`, **this takes precedence and can't be overridden**. »
   Poser `permissionMode: dontAsk` dans `gandalf.md` serait donc **ignoré**.

> **Verdict : le mécanisme retenu par le décideur ne peut pas être implémenté tel quel.** Ce n'est
> pas un détail d'implémentation à confier au dev : c'est une **hypothèse fausse au fondement de
> l'option**. Je la remonte au lieu de livrer une instruction qui produirait une barrière décorative
> — exactement la classe de défaut (« verdict confiant sur un référentiel non vérifié ») que les
> lots de la journée ferment.

**Ce qui survit en `bypassPermissions`** : les règles `deny` explicites, les règles `ask`
explicites, les hooks `PreToolUse`, et le garde-fou `rm -rf /`.

### 2.2 ⛔ CORRECTION — le garde-fou `perimeter` **ne tourne pas**

Le brief demande de mesurer s'il détecte réellement. Mesure :

- `/Users/sjupin/.claude/perimeter-guard.mjs` **existe** (209 lignes, matcher prévu
  `Edit|Write|Bash|NotebookEdit`).
- `/Users/sjupin/.claude/settings.json` déclare des hooks `Stop`, `SubagentStop`,
  `UserPromptSubmit`, `PreToolUse(Task)`, `PostToolUse(Task|TodoWrite)` — **aucun n'appelle
  `perimeter-guard.mjs`**. Le seul `PreToolUse` a pour matcher `Task`.

**Le garde-fou `perimeter` n'est câblé nulle part. Il ne détecte rien, aujourd'hui, pour personne.**
Le champ `guardrails: [identity, perimeter]` du contrat déployé est un champ **privé iakaframe** :
le générateur l'émet (`cli/src/lib/generate-agents.js:62`), mais Claude Code ne connaît pas ce
champ et ne l'interprète pas. Il est **purement documentaire**.

Et même **s'il était câblé**, il ne porterait pas la règle voulue : il classe
`ALLOW_PROJECT` / `HORS` / `DENY_HARNESS` par rapport à `$CLAUDE_PROJECT_DIR`. Une écriture dans
`iakaframe/cli/src/` est `ALLOW_PROJECT` → **autorisée**. Il ne connaît pas
`specs/instructions/`. Sur `Bash`, son mode par défaut est **`warn`, pas `deny`**
(`perimeter-guard.mjs:45`), et son extraction de chemins est une heuristique bornée au foyer qui
retombe en `BASH_UNRESOLVED` (exit 0) dès qu'aucun chemin absolu n'apparaît — donc **toute commande
en chemin relatif passe**.

### 2.3 ⛔ CORRECTION — la cascade de vendorage est **plus large** que la table du brief

La table à 5 étages est exacte mais **incomplète**. Copies supplémentaires de `gandalf.md`
trouvées par `Glob` :

| Chemin | Statut | Traitement |
|---|---|---|
| `frames/releases/StefFrame1/…` (3 copies) | **release figée** | **NE PAS TOUCHER** |
| `frames/releases/StefFrame2/…` (4 copies) | **release figée** | **NE PAS TOUCHER** |
| `kits/iakaframe-anythingllm/prompts/gandalf.md` | kit autre runner | hors périmètre (pas de `tools:`) |
| `iakaIDE/.claude/agents/gandalf.md` | **déjà en dérive** | hors lot, § 8 |
| `iakagraph/`, `iakaFreeVision/` `.claude/agents/gandalf.md` | déployés d'autres projets | hors lot, § 8 |

**Dérive préexistante constatée** : `iakaIDE/.claude/agents/gandalf.md:4` porte
`tools: Read, Grep, Glob, Write, Edit` — **sans `WebSearch, WebFetch`**. Ce contrat est en retard
d'au moins un lot sur le canon. `vendor-check` ne le voit pas : sa table
(`cli/src/lib/vendor.js:76-114`) ne couvre que les **21 fixtures du miroir GUI**. À signaler,
**pas à corriger ici**.

### 2.4 Faits du brief **confirmés**

- `bindings/iakaframe-claude-default.md:10` — ligne `tools:` de gandalf, exacte.
- `cli/test/fixtures/agents-golden/gandalf.md:10` + `sha256` en en-tête (ligne 5) → régénération.
- `iakaFrameGUI/…/fixtures/binding/iakaframe-claude-default.md:10` — copie byte-à-byte.
- `iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:147-149` — attendu **codé en
  dur**, 7 outils.
- `~/.claude/agents/gandalf.md:4` — contrat déployé.
- Aucun `settings.json` ni `settings.local.json` dans `iakaframe/.claude/`.

### 2.5 Le fait qui **allège tout** — le socle lisant est déjà gratuit

> « Claude Code recognizes a **built-in set of Bash commands as read-only** and runs them
> **without a permission prompt in every mode**. These include `ls`, `cat`, `echo`, `pwd`, `head`,
> `tail`, `grep`, `find`, `wc`, `which`, `diff`, `stat`, `du`, `cd`, and **read-only forms of
> `git`**. The set is **not configurable**. »

Presque tout ce que j'ai voulu faire aujourd'hui — `git log`, `git cat-file`, `grep -c`, `wc`,
`ls`, `command -v` — tombe **déjà** dans ce socle. Le besoin réel est donc **beaucoup plus petit
que l'option B ne le laisse croire** : il ne s'agit pas de construire un allowlist, mais
d'**ajouter `Bash` à ma dotation** et de **borner ce que ce `Bash` peut faire d'autre**.

### 2.6 Ce qu'un motif `Bash(...)` sait et ne sait pas faire

- Préfixe : `Bash(git log:*)` ≡ `Bash(git log *)`. Le `:*` n'est reconnu **qu'en fin** de motif.
- `Bash(ls *)` (avec espace) impose une frontière de mot : matche `ls -la`, **pas** `lsof`.
- Commandes composées : « Claude Code **is aware of shell operators** » — `&&`, `||`, `;`, `|`,
  `|&`, `&`, retours ligne. **Chaque sous-commande doit matcher indépendamment.**
- ⚠️ Doc, textuel : « Bash permission patterns that try to **constrain command arguments** are
  **fragile**. » Contournements listés : options avant l'argument, variables
  (`URL=… && curl $URL`), espaces surnuméraires.

Sources : § 11.

---

## 3. Options — réévaluées sur les faits mesurés

Le décideur a tranché **B**. Le § 2.1 montre que **B n'existe pas** sous sa configuration actuelle.
Voici les options **réellement disponibles**. Je recommande **B1**.

| | Mécanisme | Fonctionne sous `bypassPermissions` ? | Portée | Coût |
|---|---|---|---|---|
| **A** | `Bash` nu, aucune borne | oui | — | ~0 |
| **B1** ✅ | `Bash` + **`deny` explicites** | **oui** (deny survit) | session/global | faible |
| **B2** | `dontAsk` + `allow` (le B du brief) | **non — inerte** | — | — |
| **B3** | **hook `PreToolUse` par agent** | oui | **par persona** | élevé |

### B1 — `Bash` + liste `deny` (recommandée)

Le socle lisant (§ 2.5) donne le constat **gratuitement**. On ajoute `Bash` au binding, et on pose
des `deny` **ciblés sur les gestes que le cadreur ne doit jamais faire**. `deny` est le **seul**
étage qui mord sous `bypassPermissions`.

**Honnêteté sur B1 : c'est une barrière basse.** Une liste `deny` est **énumérative** — elle
n'arrête que ce qu'on a nommé. Voir § 6.

### B3 — hook `PreToolUse` déclaré dans le frontmatter de l'agent

Seul mécanisme **par persona** et **immunisé** au mode de permission : les hooks tournent
indépendamment du système de permissions, et un `PreToolUse` en exit 2 (ou
`permissionDecision: "deny"`) **bloque** l'appel. Le frontmatter d'un sous-agent accepte un champ
`hooks:` dont la portée est le cycle de vie de l'agent — **ce qui résout la cécité aux personas**
que `perimeter-guard.mjs` documente comme sa limite.

**Pourquoi je ne la recommande pas *dans ce lot*** : le générateur
(`renderAgentContract`, `cli/src/lib/generate-agents.js:54-65`) émet un frontmatter à **ordre fixe
`name, description, tools?, guardrails`**. Il **n'émet pas `hooks:`**. B3 exige donc de modifier le
générateur, de refaire **les 8 goldens** (leur `sha256` bouge tous), de re-vendorer **17 copies**,
et d'écrire le script de garde. C'est un **lot à part entière**, sans rapport de taille avec
« donner un shell de constat au cadreur ». → § 9, backlog.

---

## 4. Périmètre fermé

### 4.1 DANS le lot

1. `bindings/iakaframe-claude-default.md:10` — ajouter `Bash` à `tools` de gandalf.
2. Régénérer le golden CLI, re-vendorer le miroir GUI, mettre à jour l'attendu codé en dur.
3. Redéployer `~/.claude/agents/gandalf.md`.
4. Amender `library/personas/gandalf.md` (§ 5).
5. Livrer au décideur le **bloc `deny` exact** à coller (§ 7, geste humain).

### 4.2 HORS du lot (explicite)

- Le hook `PreToolUse` par agent (B3) et la modification du générateur.
- Le **câblage de `perimeter-guard.mjs`** dans `settings.json` (§ 2.2) — défaut réel, **antérieur**
  et **indépendant** ; le mélanger ici confondrait deux lots.
- La dérive des `.claude/agents/` des autres projets (§ 2.3).
- Les `frames/releases/` — **figées**.
- Tout changement du `defaultMode`.

### 4.3 Position de `Bash` dans la liste

`tools: Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch` — `Bash` **après `Edit`**, par
homologie avec gimli (`Read, Edit, Write, Bash, Grep, Glob`) et helm
(`Read, Grep, Glob, Write, Bash`) : les outils web restent en queue. L'ordre est **signifiant**
(scalaire virgule, comparé byte-à-byte) : toute autre position fait échouer les attendus du § 8.

---

## 5. Les commandes — et ce que j'**exclus contre mon intérêt**

### 5.1 Retenues — chacune adossée à un besoin **constaté cette journée**

| Commande | Besoin constaté | Statut |
|---|---|---|
| `git log`, `git show`, `git status`, `git diff` | faits git repris du brief sans vérification (dernier cadrage) | socle lisant |
| `git cat-file` | lire un blob sans altérer l'arbre | socle lisant |
| `grep -c` | compter les occurrences du gabarit fautif | socle lisant |
| `wc` | tailles, comptes de lignes | socle lisant |
| `ls` | présence/absence de `agents/`, `skills/` en racine | socle lisant |
| `command -v` / `which` | présence d'un outil avant de le supposer | socle lisant |
| `unzip -p` | inspecter un `.zip` **sans l'extraire** (`-p` = stdout) | **hors socle** |

**Toutes sauf `unzip -p` sont déjà couvertes par le socle lisant** (§ 2.5) et ne demandent
**aucune règle**. `unzip -p` est le seul ajout réel — et `-p` est précisément la forme qui n'écrit
rien sur le disque.

### 5.2 ⛔ EXCLUES — arbitrages **contre mon intérêt**

**`vendor-check` et `node --test` : EXCLUS.** C'est l'arbitrage le plus coûteux pour moi et je le
pose quand même.

Ces deux commandes m'arrangeraient énormément : elles auraient évité la pré-condition Q-5 imposée
à Gimli sur D-9. **Et c'est exactement pourquoi elles doivent rester dehors.** `vendor-check` et
`node --test` ne sont pas des outils de constat, ce sont les **instruments de mesure du gate** —
ceux avec lesquels 🏹 Legolas rend un verdict opposable. Si le cadreur peut les jouer :

1. il produit un **verdict de gate** sans en avoir le mandat, et le gate cesse d'être indépendant —
   la dérive « team → Gimli solo » exactement, transposée à moi ;
2. il sera **tenté d'inscrire un `PASS` reconstitué dans l'instruction**, que le dev lira comme
   acquis ;
3. `node --test` **exécute du code arbitraire du dépôt** : c'est un vecteur d'écriture complet
   déguisé en mesure. Aucune allowlist ne rattrape ça.

Le bon remède à Q-5 n'est pas que je mesure à la place de Legolas : c'est que la pré-condition soit
**posée explicitement**, ce qu'elle a été. **Je demande à pouvoir constater, pas à pouvoir
statuer.**

**Également exclus** : `npm`/`npx`/`node` (exécution arbitraire) ; `curl`/`wget` (j'ai `WebFetch`,
qui est filtrable par domaine) ; `find` (le doc signale qu'il prompte sur glob non quoté à cause de
`-delete` — je n'en ai pas eu besoin) ; `sed`/`awk` en écriture ; tout `git` mutateur.

---

## 6. ⚠️ Ce que la barrière n'arrête PAS — à lire avant de valider

Le décideur a demandé de ne pas vendre B comme étanche. **B1 ne l'est pas.** Inventaire franc :

1. **`deny` est énumératif.** Il n'arrête que ce qui est nommé. `python -c`, `perl -e`, `tee`,
   `dd`, un script du dépôt, un binaire au nom inattendu : **rien ne les arrête**.
2. **Les redirections.** Une commande **du socle lisant** écrit si on redirige :
   `cat a > b`, `echo x >> f`. Le socle « read-only » qualifie la **commande**, pas l'**effet**.
   C'est le trou le plus large et le plus banal.
3. **La substitution de commande.** `$(…)`, backticks : le contenu substitué n'est pas
   nécessairement soumis au même examen.
4. **Les options d'écriture d'une commande réputée lisante.** `git` est le cas d'école : « read-only
   forms of git » sont gratuites, mais `git` porte `-o`, des hooks, des alias configurables.
5. **La fragilité documentée des motifs.** Doc, textuel : contraindre les **arguments** est
   « fragile » — options avant l'argument, variables, espaces surnuméraires.
6. **`bypassPermissions` rend tout le reste muet.** Le seul étage vivant est `deny`. Aucune règle
   `ask`, aucun `allow`, aucun `permissionMode` d'agent ne joue.
7. **Aucun garde-fou de chemin ne tourne** (§ 2.2). `Write`/`Edit` hors `specs/instructions/` ne
   sont **déjà** arrêtés par rien.

> **Conclusion honnête.** B1 **ne garantit pas** la propriété « lecture seule sur le code ». Elle
> **relève le coût** d'une sortie de périmètre : d'un geste naturel à un geste **détourné**, donc
> visible en relecture de transcript. C'est un **ralentisseur, pas une clôture**. La seule clôture
> réelle serait B3 (hook par agent), et même B3 se heurterait aux points 1-4 sans un parseur shell.
>
> **La propriété reste portée par la discipline et par le gate humain.** Ce lot ne change pas ça.
> Il ne fait que rendre le cadreur capable de mesurer. **Quiconque valide ce lot valide un gain de
> capacité, pas un gain de garantie.**

---

## 7. Pré-conditions et gestes humains

### P-1 — pré-condition bloquante (délégable, ⚒️ Gimli)

Avant toute modification : jouer `vendor-check` et **coller la sortie**. Attendu
`OK - 17 copies + 4 derivees`. Le brief l'annonce `clean` ; **je ne l'ai pas mesuré**. Si `drift` →
**arrêt**, retour au décideur.

### G-1 — geste **humain**, non délégable

Le décideur pose lui-même le bloc ci-dessous via `/config` (aucun agent n'écrit
`~/.claude/settings.json` — c'est d'ailleurs le seul chemin que `perimeter-guard.mjs` classe
`DENY_HARNESS`, s'il tournait). **Fusionner** dans la section `permissions` existante — **ne pas
remplacer** : `defaultMode` doit survivre.

```json
"permissions": {
  "defaultMode": "bypassPermissions",
  "deny": [
    "Bash(git push:*)",
    "Bash(git reset:*)",
    "Bash(git checkout:*)",
    "Bash(git commit:*)",
    "Bash(git rebase:*)",
    "Bash(git clean:*)",
    "Bash(rm:*)",
    "Bash(mv:*)",
    "Bash(curl:*)",
    "Bash(wget:*)",
    "Bash(chmod:*)",
    "Bash(chown:*)"
  ]
}
```

⚠️ **Portée : GLOBALE (`~/.claude/settings.json`), donc TOUS les agents et TOUS les projets.**
Les règles `permissions` sont de **session**, jamais par persona (doc : ces règles « apply to the
entire session, not only the … subagent »). Ce bloc **retire `git push`, `git commit`, `rm` à
⚒️ Gimli, 🏹 Legolas, 🛡️ Helm et 🦅 Odin**, qui en ont besoin.

> **C'est le point le plus lourd du lot, et il n'est pas soluble par moi.** Un `deny` qui me borne
> borne aussi tout le monde. **Trois issues, au décideur (§ 10, D-1)** — je ne tranche pas :
> **(a)** poser le `deny` en `iakaframe/.claude/settings.json` (projet) plutôt qu'en global, en
> acceptant qu'il gêne les autres agents **sur ce projet** ; **(b)** ne poser **aucun `deny`** et
> assumer B1 réduite au § 2.5 (`Bash` nu + discipline) — soit, de fait, l'option **A** ;
> **(c)** financer **B3** (§ 3), seul chemin par persona.
>
> **Je signale que (b) est celle qui m'avantage le plus, et je ne la recommande pas pour autant.**
> Ma recommandation reste **(a)** : un périmètre borné qui gêne, plutôt qu'un confort qui ne borne
> rien.

### G-2 — geste humain

Redéployer `~/.claude/agents/gandalf.md`, puis **redémarrer la session** (un contrat d'agent est lu
au démarrage). Sans redémarrage, aucun critère du § 8.4 n'est observable.

---

## 8. Critères d'acceptation

**Pré-annonce des attendus qui bougent** (forme § 4 de D-9) : un chiffre qui bouge sans être
pré-annoncé = **FAIL**.

### 8.1 Canon — `iakaframe`

- **C-1** `bindings/iakaframe-claude-default.md:10` vaut **exactement** :
  `  - { personaId: gandalf,  runner: claude-code, model: "opus",   tools: [Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch] }`
  (alignement des colonnes **préservé** : ce fichier est comparé byte-à-byte).
- **C-2** Les **7 autres** lignes d'assignment sont **inchangées, byte pour byte**.

### 8.2 Golden CLI — attendus **pré-annoncés**

- **C-3** `cli/test/fixtures/agents-golden/gandalf.md:10` vaut
  `tools: Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch`.
- **C-4** Le `sha256` en en-tête (`gandalf.md:5`) **change**. Valeur avant :
  `94db7954bd2f104d2ccf40c667ce60e16860a28868a612f47846dd6305826459`. La nouvelle est **inscrite au
  PV du gate**.
- **C-5** ⚠️ Les **7 autres goldens** (`aragorn`, `gimli`, `helm`, `legolas`, `loki`, `nathalie`,
  `odin`) sont **INCHANGÉS, sha256 compris**. Un seul autre sha qui bouge ⇒ **FAIL** (le générateur
  a changé de comportement, ce qui n'est pas le périmètre).
- **C-6** Régénération par `node cli/scripts/gen-agents-golden.mjs` — **jamais** à la main.

### 8.3 Miroir GUI — `iakaFrameGUI`

- **C-7** `packages/core/__tests__/fixtures/binding/iakaframe-claude-default.md` **identique
  byte-à-byte** à la source (C-1).
- **C-8** `packages/core/__tests__/fixtures/agents-golden/gandalf.md` identique au golden CLI (C-3).
- **C-9** `packages/core/__tests__/fixtures/personas/gandalf.md` identique à
  `library/personas/gandalf.md` **après** l'amendement C-12.
- **C-10** `packages/core/__tests__/parite-generateurs.test.ts:147-149` — attendu porté à **8**
  entrées, dans l'ordre de C-1. Les attendus `gimli` (l. 150-152) et `odin` (l. 153) sont
  **inchangés**.
- **C-11** Suite GUI **verte**. Compte de tests **pré-annoncé au PV** avant / après ; il ne doit
  **pas** varier (aucun test ajouté ni retiré).

### 8.4 Persona — amendement du contrat

- **C-12** `library/personas/gandalf.md:4` (`description`) — la formule **« Il travaille en lecture
  seule sur le code »** devient **fausse au sens strict** dès que `Bash` est accordé. Elle est
  remplacée par une formule **vraie et non trompeuse** :
  « Il **n'écrit que dans `specs/instructions/`** et **ne dispose du shell que pour constater**
  (mesures en lecture, jamais de geste mutateur). »
  ⚠️ Cette ligne est **vendorée** : elle déclenche C-9 **et** C-4 (la `description` est reprise
  dans le golden). Les deux doivent bouger **ensemble**.
- **C-13** Le § « Obligation — bornage de l'écriture » du corps est complété d'un alinéa
  **`Bash` = constat**, énonçant : commandes de lecture uniquement ; **aucune** redirection
  (`>`, `>>`), **aucun** `git` mutateur ; `vendor-check` et `node --test` **hors dotation** et
  réservés au gate.
- **C-14** L'encart ⚠️ existant (l. 53-57) est complété par **le § 6 de la présente instruction**,
  en propres termes : le bornage de `Bash` est **contractuel**, `perimeter` **n'est pas câblé**, et
  une liste `deny` **n'est pas étanche**.

### 8.5 Cas nominal — la capacité est réellement acquise

- **C-15** Après G-2, en session, ces commandes **aboutissent** et rendent une sortie exploitable :
  `git log --oneline -5` · `grep -c 'motif' <fichier>` · `wc -l <fichier>` · `ls -la` ·
  `command -v node` · `unzip -p <archive> <entrée>`.
- **C-16** Un cadrage ultérieur cite un fait **mesuré** (commande + sortie collée), non reconstitué.

### 8.6 Cas de défaut — **obligatoires**, à jouer et à consigner

- **C-17** *(commande hors allowlist)* `git push --dry-run` est **REFUSÉE** si le décideur retient
  G-1/(a). ⚠️ **Si (b) est retenue, ce critère est SANS OBJET et doit être marqué `N/A` au PV** —
  **pas** `PASS`. Un `N/A` déguisé en `PASS` sur ce critère précis viderait le lot de son sens.
- **C-18** *(écriture déguisée en lecture)* `echo test > /tmp/iaka-probe.txt` est tentée. **Attendu
  documenté : elle PASSE.** Le critère est **PASS si le comportement observé est consigné tel
  quel**, et **FAIL si le PV prétend qu'elle a été bloquée**. Ce critère ne mesure pas la barrière :
  il mesure **l'honnêteté du PV**, et matérialise le § 6.2.
- **C-19** *(exclusion de rôle)* `vendor-check` lancé sous le rôle de cadrage : le comportement
  observé est consigné. Si aucune mécanique ne le refuse, le PV l'écrit **explicitement** —
  l'exclusion est **contractuelle seule**.
- **C-20** *(non-régression du gate)* `vendor-check` rejoué **par le gate** en fin de lot rend
  `OK - 17 copies + 4 derivees`. Le compte **17 + 4** est **inchangé** : ce lot n'ajoute **aucune**
  fixture.

---

## 9. Suites — backlog, hors lot

- **S-1** **Câbler `perimeter-guard.mjs`** dans `settings.json` (§ 2.2). Le script existe et dort.
  Défaut antérieur, indépendant, et **plus grave que celui traité ici** : il concerne `Write`/`Edit`
  de **tous** les agents.
- **S-2** **B3** — champ `hooks:` dans le générateur + garde par persona (§ 3).
- **S-3** Résorber la dérive des `.claude/agents/` des autres projets (§ 2.3), à commencer par
  `iakaIDE`. Étendre `vendor-check` au-delà du miroir GUI.

---

## 10. Laissé au décideur

- **D-1 — la portée du `deny` (§ 7, G-1).** (a) projet, (b) aucun `deny`, (c) financer B3.
  **Recommandation : (a).** Je signale que **(b) m'avantage** et je ne la recommande pas.
- **D-2 — la formulation exacte de C-12.** J'amende **ma propre charte** : le décideur relit.
- **D-3 — accepter le § 6.** Valider, c'est acter que la propriété « lecture seule » devient
  **contractuelle** et non plus mécanique. Si c'est inacceptable → **(c)**.
- **D-4 — l'ordre des gates bi-dépôt.** Proposé : `iakaframe` d'abord (canon), puis
  `iakaFrameGUI` (miroir) — la GUI ne peut être verte qu'après régénération du canon.

---

## 11. Sources

- [Configure permissions — Claude Code Docs](https://code.claude.com/docs/en/permissions) — modes
  (`bypassPermissions`, `dontAsk`), ordre `deny > ask > allow`, socle lisant non configurable,
  opérateurs shell, fragilité des motifs d'arguments.
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents) — champs de frontmatter
  (`tools`, `disallowedTools`, `permissionMode`, `hooks`), **précédence non contournable** du
  `bypassPermissions` parent, portée session des règles `permissions`.
- [Hooks](https://code.claude.com/docs/en/hooks) — `PreToolUse` exit 2 / `permissionDecision: deny`,
  indépendance vis-à-vis du mode de permission, hooks en frontmatter de sous-agent.

Fichiers mesurés : `bindings/iakaframe-claude-default.md:10` ·
`library/personas/gandalf.md:4,53-57` · `cli/src/lib/generate-agents.js:54-65` ·
`cli/src/lib/vendor.js:28-114` · `cli/test/fixtures/agents-golden/gandalf.md:5,10` ·
`iakaFrameGUI/packages/core/__tests__/parite-generateurs.test.ts:147-153` ·
`/Users/sjupin/.claude/settings.json:2-4` · `/Users/sjupin/.claude/perimeter-guard.mjs:45,128-175` ·
`/Users/sjupin/work/iakaIDE/.claude/agents/gandalf.md:4`

---

## 12. Estimation

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **0,5 j-h** si **D-1 = (a) ou (b)**. **2,5 à 3 j-h** si **(c) / B3**. |
| **Complexité** | **Faible** en soi — 1 ligne de canon. |
| **Risque** | **Moyen-élevé**, tout entier dans la **cascade** : 5 étages, 2 dépôts, 1 attendu codé en dur, 1 `sha256`, 1 champ vendoré (`description`). Le risque n'est **pas** dans la décision, il est dans la **propagation**. |

**Inconnues susceptibles de faire glisser :**

1. **D-1 non tranché** — l'écart (a)/(b) vs (c) est un **facteur 5**.
2. **P-1** — si `vendor-check` n'est pas `clean` au départ, ce lot est **bloqué** derrière un
   assainissement non estimé ici.
3. **C-5** — si régénérer déplace le `sha256` d'un **autre** golden, le générateur a un
   comportement non maîtrisé : **arrêt et re-cadrage**.
4. **C-12** — l'amendement de la `description` traverse `personas` **et** `goldens` : c'est le
   point où un re-vendorage incomplet passerait la GUI au vert **sur des copies fausses** (le
   scénario que `vendor.js` documente comme sa limite § 8, et que le **niveau 2** rattrape —
   à condition qu'il soit joué).
5. **Redémarrage de session** (G-2) — sans lui, C-15 à C-19 sont **inobservables** ; un gate joué
   trop tôt rendrait un `PASS` sur une session qui porte encore l'ancien contrat.
