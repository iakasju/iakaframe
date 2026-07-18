# Instruction — Nettoyer les chemins machine en dur dans les kits sources (`perimeter-guard`)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut en fin de doc.
> Réf. : `specs/instructions/reconcilier-kit-source-frame.md` (gate où le point a été repéré),
> `specs/instructions/garde-perimetre-gestes-directs.md`.

---

## 1. Besoin (reformulé)

Un **kit source** (`kits/**`) est un **template diffusable** : il ne doit contenir **aucun
chemin perso** (foyer d'un utilisateur nommé). Au gate « réconciliation kit ↔ frame », on a
repéré que `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` porte `/Users/sjupin/…`
**en commentaire** (≈ L186). Objectif : **généraliser** ce commentaire (et les cas jumeaux
co-découverts), pour qu'aucun nom d'utilisateur réel ne subsiste dans un kit source.

C'est un **quick win** : édition(s) de commentaire uniquement, **zéro changement de
comportement** (le code résout déjà le foyer dynamiquement).

---

## 2. Ce qui existe — constat vérifié (lecture seule)

### 2.1 Le fichier cible : une seule occurrence perso, dans un **commentaire**

`kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` — recensement exact :

| Ligne | Contenu | Nature | À corriger ? |
|---|---|---|---|
| **186** | `// MVP honnete : on capte les chemins absolus du foyer (/Users/sjupin/...) et ~/.claude/...` | **Commentaire** — exemple illustratif portant le username réel `sjupin` | **OUI** |
| 190 | `// 1) chemins absolus POSIX explicites sous /Users/<user>/...` | Commentaire — **déjà générique** (`<user>`) | non |

Point déterminant : le **code** ne dépend d'aucun chemin en dur. La regex de détection est
construite à partir du **foyer résolu au runtime** :

```js
const home = homedir();                                        // L192
const homeEsc = home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");   // L193
const reHome = new RegExp(homeEsc + "(?:/[^\\s'\"`;|&><]*)?", "g"); // L194
```

Donc `/Users/sjupin/…` en L186 est **purement décoratif** et, de surcroît, **désynchronisé**
de L190 (qui, elle, utilise déjà la forme générique `<user>`). Ce n'est **ni** une valeur par
défaut, **ni** un chemin fonctionnel : juste un exemple mal généralisé.

### 2.2 Cas jumeau co-découvert (grep sur `kits/`)

`grep -rnE '/Users/sjupin|C:\\Users\\sjupi' kits/` remonte **une** occurrence supplémentaire
du **même défaut** (username réel en parenthèse illustrative) :

| Fichier:ligne | Contenu | Nature |
|---|---|---|
| `kits/iakaframe-claude/global/README.md:4` | ``Sources versionnées des fichiers qui vivent au runtime dans `~/.claude/` (`C:\Users\sjupi\.claude\`).`` | Doc — exemple parenthétique portant le username réel `sjupi`, à côté de la forme générique `~/.claude/` |

Ce cas est **strictement parallèle** à L186 (un chemin-foyer nominatif entre parenthèses,
juste après une forme générique). Il entre donc dans le même geste « aucun chemin perso ».

### 2.3 Hors périmètre — le chemin canonique `C:\work\iakaframe\`

`grep -rn 'C:\\work\\iakaframe' kits/` remonte plusieurs occurrences (`global/CLAUDE.md`,
`kits/iakaframe-ollama/README.md`, `kits/iakaframe-codex/README.md`…). Ce **n'est PAS un
chemin perso** au sens visé :

- il ne porte **aucun nom d'utilisateur** (pas de `sjupin`/`sjupi`) ;
- c'est le **chemin d'installation canonique** de la méthode, référencé volontairement dans le
  `CLAUDE.md` **réel** (paramétré) du kit ;
- `specs/instructions/reconcilier-kit-source-frame.md` §4 classe `CLAUDE.md`/`README.md`
  **source** en régime **« réel / LAISSER-DIVERGER »** (valeurs vraies assumées ; c'est la
  **frame** qui les déparamètre). Y toucher **contredirait** une décision de cadrage déjà prise.

→ `C:\work\iakaframe\` est **explicitement exclu** de cette instruction (voir §6).

---

## 3. Objectif fermé

Qu'**aucun kit source** (`kits/**`) ne contienne un **chemin-foyer nominatif** (username réel
`sjupin` / `sjupi`), en remplaçant les **exemples illustratifs** par leur **forme générique**,
**sans modifier une seule ligne de code exécuté** ni aucun comportement runtime.

---

## 4. Spécification précise — remplacements exacts (2 éditions, commentaires/doc seulement)

### 4.1 `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` L186

Le commentaire décrit ce que capte la regex, construite depuis `homedir()`. La forme générique
fidèle au code est donc **`$HOME`** (ce que `homedir()` renvoie), cohérente avec le `<user>` de
L190.

- **Avant** :
  ```js
  // MVP honnete : on capte les chemins absolus du foyer (/Users/sjupin/...) et ~/.claude/...
  ```
- **Après** :
  ```js
  // MVP honnete : on capte les chemins absolus du foyer ($HOME/..., p.ex. /Users/<user>/...) et ~/.claude/...
  ```

> Choix de forme (recommandé, ajustable au jalon) : `$HOME/...` **+** l'exemple neutre
> `/Users/<user>/...`. `$HOME` est exact (c'est `homedir()`), `/Users/<user>/...` reste aligné
> sur la forme déjà présente en L190. Alternative acceptable : `$HOME/...` seul.

### 4.2 `kits/iakaframe-claude/global/README.md:4`

- **Avant** :
  ```md
  Sources **versionnées** des fichiers qui vivent au runtime dans `~/.claude/`
  (`C:\Users\sjupi\.claude\`).
  ```
- **Après** :
  ```md
  Sources **versionnées** des fichiers qui vivent au runtime dans `~/.claude/`
  (p.ex. `C:\Users\<user>\.claude\` sous Windows).
  ```

> `<user>` remplace le username réel `sjupi` ; la valeur illustrative Windows est conservée mais
> **neutralisée**. Alternative acceptable : supprimer entièrement la parenthèse (la forme
> générique `~/.claude/` suffit).

**Aucune autre édition.** En particulier : ne pas toucher L190 (déjà générique), ni le code
exécuté, ni aucun fichier hors des deux ci-dessus.

---

## 5. Étapes d'implémentation (Gimli)

1. Éditer `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs` L186 (§4.1).
2. Éditer `kits/iakaframe-claude/global/README.md` L4 (§4.2).
3. Passer les critères d'acceptation §7.
4. Committer (conventional commit, ex. `chore(kit-claude): generalise les chemins machine en dur
   (perimeter-guard L186 + README) — aucun username perso en kit source`).

---

## 6. Hors périmètre

- **`C:\work\iakaframe\`** dans les kits (`global/CLAUDE.md`, `iakaframe-ollama/README.md`,
  `iakaframe-codex/README.md`…) : chemin d'install canonique **sans username**, régime « réel »
  assumé par `reconcilier-kit-source-frame.md` §4. **Non traité ici.**
- Les **frames** (`frames/releases/**`) : releases **gelées** (cf. reconciliation §6). Non
  traitées, même si un username y apparaissait.
- Toute modification du **comportement** du garde de périmètre, de sa regex ou de son
  ancrage `$CLAUDE_PROJECT_DIR` : cette instruction est **iso-comportement** (commentaires/doc).
- Une politique/lint automatisé « anti-chemin-perso » généralisé : amélioration possible en
  suivi, **non requise** ici (voir note §7).

---

## 7. Comportement attendu / Critères d'acceptation (vérifiables)

- [ ] **Zéro username perso en kit source** :
      `grep -rnE '/Users/sjupin|C:\\Users\\sjupi' kits/` renvoie **0 résultat**.
- [ ] **Cible nettoyée** : `grep -n 'sjupin' kits/iakaframe-claude/global/hooks/perimeter-guard.mjs`
      = **0** ; L186 contient désormais `$HOME` (et/ou `/Users/<user>/...`).
- [ ] **README nettoyé** : `grep -n 'sjupi' kits/iakaframe-claude/global/README.md` = **0**.
- [ ] **Iso-comportement (aucun code touché)** : le `git diff` ne modifie **que** des lignes de
      **commentaire** (`.mjs`) et de **prose** (`.md`) ; **aucune** ligne exécutée de
      `perimeter-guard.mjs` ne change (L192-194 `homedir()`/regex **intactes**).
- [ ] **Syntaxe préservée** : `node --check kits/iakaframe-claude/global/hooks/perimeter-guard.mjs`
      → exit 0.
- [ ] **Tests CLI verts** : `cd cli && npm test` — aucune régression (en particulier
      `guard-perimeter`, `guard-core-parity`).
- [ ] **Périmètre respecté** : `git status` ne montre **que** les 2 fichiers §4 modifiés
      (aucune touche à `frames/**`, ni aux `CLAUDE.md`/`README` portant `C:\work\iakaframe\`).

> Note (constat, non bloquant) : le grep de contrôle anti-perso ci-dessus pourrait devenir un
> test/CI récurrent. Proposé en **suivi**, hors de ce quick win.

---

## 8. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `nettoyage-chemin-machine-perimeter-guard.md` : 2 éditions **de commentaire/doc** (perimeter-guard L186 `$HOME` + README L4 `<user>`), **iso-comportement**, `C:\work\iakaframe\` et frames **hors scope**, critère grep-perso = 0 + tests verts | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation** (chemin:ligne) :
- `kits/iakaframe-claude/global/hooks/perimeter-guard.mjs:186` (commentaire à généraliser),
  `:190` (forme `<user>` déjà générique — **référence**, à ne pas toucher),
  `:192`-`:194` (`homedir()` + regex — **code intact**, prouve l'iso-comportement).
- `kits/iakaframe-claude/global/README.md:4` (parenthèse `C:\Users\sjupi\.claude\` à généraliser).
- Hors scope justifié : `kits/iakaframe-claude/global/CLAUDE.md:4` (`C:\work\iakaframe\` — régime
  « réel » assumé par `reconcilier-kit-source-frame.md:93`).

**Points ouverts** : AUCUN bloquant. Choix **assumés par Gandalf** (modifiables au jalon) :
1. Périmètre élargi au cas jumeau `README.md:4` (même défaut) plutôt que le seul `perimeter-guard.mjs` — §2.2.
2. Forme de remplacement L186 = `$HOME/..., p.ex. /Users/<user>/...` (fidèle à `homedir()` + aligné L190) — §4.1.
3. `C:\work\iakaframe\` **exclu** (chemin canonique sans username, régime réel) — §2.3/§6.

---

## Statut

**VALIDÉ — prêt pour Gimli** (aucun point ouvert bloquant). À « JALON VALIDÉ » → dispatch
**Gimli** pour appliquer §5 en passant les critères §7 (grep-perso = 0, iso-comportement,
tests verts), sans toucher `frames/**` ni les chemins `C:\work\iakaframe\`.
