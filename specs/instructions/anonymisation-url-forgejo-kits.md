# Instruction — Anonymiser le compte git perso `sjupin` dans les URL Forgejo des kits

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut en fin de doc.
> Réf. : `specs/instructions/nettoyage-chemin-machine-perimeter-guard.md` (campagne
> d'anonymisation, commit `01fa061`, gate Legolas PASS), `specs/instructions/reconcilier-kit-source-frame.md`
> §4 (**conflit à arbitrer**, cf. §3), `specs/instructions/frame-stefframe2.md` §143
> (mapping `sjupin` → `<user>`), `kits/iakaframe-codex/AGENTS.md:108` (forme générique déjà
> en place). BACKLOG : item « Anonymiser les URL Forgejo dans les kits sources ».

---

## 1. Besoin (reformulé)

Le compte git **personnel** `sjupin` subsiste dans des URL de remote Forgejo
(`http://192.168.2.11:3001/sjupin/…`) au sein des **kits sources**. C'est la **suite**
directe de la campagne d'anonymisation des identifiants personnels amorcée au commit
`01fa061` (nettoyage des chemins machine `/Users/`, `C:\Users\`), signalée par **Legolas**
au gate de ce commit comme **résidu non traité**.

Objectif : **retirer le compte perso `sjupin`** des kits, en le remplaçant par le
placeholder générique **déjà en usage ailleurs** dans l'arbre (`<user>`), **sans casser**
le moindre comportement fonctionnel — en particulier dans le kit OpenWebUI (fichier Python).

Ce **n'est pas** un déparamétrage complet des URL (le host LAN reste réel, cf. §3–§4) : la
maille est **le seul identifiant personnel**, à l'image du nettoyage des chemins machine qui
a conservé les formes illustratives (`/Users/<user>/…`) en ne retirant que le username réel.

---

## 2. Ce qui existe — constat vérifié (lecture seule)

### 2.1 Inventaire exhaustif des occurrences (`grep` sur tout `kits/`)

`grep -rn 'sjupin'` et `grep -rn '192.168.2.11:3001'` sur `kits/` renvoient **exactement 3
occurrences** du compte perso — **pas** limitées aux fichiers cités dans le backlog, l'arbre
entier a été balayé :

| # | Fichier:ligne | Contenu | Nature |
|---|---|---|---|
| 1 | `kits/iakaframe-claude/CLAUDE.md:60` | `Remote par défaut : Forgejo LAN \`http://192.168.2.11:3001/sjupin/<repo>.git\`` | **Prose / doc** (paragraphe « Dépôt git : Forgejo »). Non exécuté. |
| 2 | `kits/iakaframe-claude/global/CLAUDE.md:73` | `\`http://192.168.2.11:3001/sjupin/<repo>.git\`, HTTP + token` | **Prose / doc** (paragraphe « Dépôt git par défaut »). Non exécuté. |
| 3 | `kits/iakaframe-openwebui/functions/iakaframe_identity_filter.py:4` | `author_url: http://192.168.2.11:3001/sjupin/iakaframe` | **Métadonnée OWUI** (champ `author_url` de l'en-tête docstring), **pas** de la logique exécutée. |

### 2.2 Nature de l'occurrence Python (déterminant — ne rien casser)

L'occurrence #3 vit dans le **docstring d'en-tête** (lignes 1–8) du module. Le
`functions/README.md:50-51` le dit explicitement : *« l'en-tête docstring `title` / `version`
/ `required_open_webui_version` sert de métadonnées OWUI »*. Ce bloc est **lu par OpenWebUI
comme métadonnées d'affichage** (auteur, lien auteur, version) ; il **n'intervient pas** dans
la logique `inlet()` / `outlet()` de la Filter Function (le code réel commence à
`iakaframe_identity_filter.py:36`, `import re`).

Vérifié aussi : le test `kits/iakaframe-openwebui/functions/test_identity_filter.py`
**n'assertionne pas** sur `author_url` (il importe le module et compare le verdict d'identité
Python au verdict Node de `guard-core`). → **anonymiser `author_url` n'altère aucun
comportement** ni aucun test ; le seul effet possible est cosmétique (lien auteur affiché par
OWUI devenant un placeholder). **Aucune valeur exécutée n'est touchée.**

### 2.3 Précédents de forme dans l'arbre (convention `<user>`)

- `kits/iakaframe-codex/AGENTS.md:108` porte **déjà** la forme générique
  `http://<forgejo-host>:<port>/<user>/<repo>.git` → le placeholder retenu par convention pour
  le compte est **`<user>`**, et le kit codex est **déjà anonymisé** (précédent dans `kits/`).
- `specs/instructions/nettoyage-chemin-machine-perimeter-guard.md` a fixé `<user>` comme forme
  d'anonymisation du username réel + le critère **« grep-perso = 0 »** (même campagne).
- `specs/instructions/frame-stefframe2.md:143` : la génération de frame mappe déjà
  `sjupin` (`DEF_USER`) → `<user>`.

---

## 3. Conflit de cadrage à arbitrer (⚠️ décision antérieure)

`specs/instructions/reconcilier-kit-source-frame.md` **§4** classe **explicitement** :

- `CLAUDE.md` (source) → **LAISSER-DIVERGER** — *« valeurs réelles … La source est le kit
  réel de Stéphane (Forgejo LAN, `FORGEJO_TOKEN`, `iakabox-usage.html`) »* (`:93`) ;
- `global/CLAUDE.md` (source) → **LAISSER-DIVERGER** (`:94`).

Les occurrences **#1** et **#2** tombent **pile** sur ces deux fichiers gelés en « valeurs
réelles ». Il y a donc **conflit frontal** avec une décision déjà prise. **Gandalf ne tranche
pas à la place du décideur** : ce point est porté au gate (§7).

**Lecture proposée pour lever le conflit** (à valider par Stéphane) :

> Le régime « LAISSER-DIVERGER / valeurs réelles » de §4 visait la réconciliation
> **source ↔ frame** : « ne pas ré-importer dans la source les placeholders de déparamétrage
> de la frame » (`<GIT_REMOTE_URL>`, etc.). Il **ne contemplait pas** l'enjeu de **fuite d'un
> identifiant personnel**, apparu **après** avec la campagne d'anonymisation (`01fa061`, déjà
> gate-PASS) qui a **elle-même altéré** des « valeurs réelles » de la source (chemins machine).
> Retirer **le seul compte `sjupin`** (swap chirurgical `sjupin` → `<user>`, host LAN
> **conservé**) est **compatible avec l'intention de §4** : on ne ré-importe pas le
> déparamétrage large de la frame, on aligne juste la source sur le kit codex **déjà** générique
> et on prolonge une campagne déjà validée.

Si Stéphane **refuse** cette lecture → le périmètre se **réduit à la seule occurrence #3**
(kit OpenWebUI, **hors** du champ de §4 qui ne couvre que le kit `iakaframe-claude`), qui reste
anonymisable sans aucun conflit.

---

## 4. Spécification — remplacement par occurrence

**Placeholder retenu : `<user>`** (unique, cohérent avec codex / nettoyage-chemin / frame).
**Host LAN conservé** : `192.168.2.11:3001` **n'est pas touché** — voir §4.2.

### 4.1 Éditions (une substitution littérale par occurrence, iso-reste)

| # | Fichier:ligne | Avant | Après |
|---|---|---|---|
| 1 | `kits/iakaframe-claude/CLAUDE.md:60` | `…3001/sjupin/<repo>.git` | `…3001/<user>/<repo>.git` |
| 2 | `kits/iakaframe-claude/global/CLAUDE.md:73` | `…3001/sjupin/<repo>.git` | `…3001/<user>/<repo>.git` |
| 3 | `kits/iakaframe-openwebui/functions/iakaframe_identity_filter.py:4` | `author_url: http://192.168.2.11:3001/sjupin/iakaframe` | `author_url: http://192.168.2.11:3001/<user>/iakaframe` |

> Notes :
> - Occurrences #1/#2 : **seul** le segment `sjupin` change ; le placeholder `<repo>` déjà
>   présent et le reste de la ligne (prose, backticks, « HTTP + token ») restent **intacts**.
> - Occurrence #3 : `iakaframe` **reste** le nom de dépôt réel (ce `author_url` pointe vers LE
>   projet iakaframe) — on **n'y met pas** `<repo>` ; seul le **propriétaire** est anonymisé.
> - Aucune autre ligne, aucun autre fichier n'est modifié.

### 4.2 Décision « toucher l'IP/host ? » → **NON** (recommandation)

Le host `192.168.2.11:3001` est **conservé en clair**. Justification :

1. **La maille du besoin est le compte perso**, pas la topologie réseau.
2. `192.168.2.11` est une adresse **RFC 1918 privée** (LAN), **non routable** et **non
   personnelle** — ce n'est pas un identifiant sensible au sens de la campagne.
3. **Périmètre minimal** = conflit minimal avec §4 (qui nomme « Forgejo LAN » comme valeur
   réelle voulue) et **fidélité fonctionnelle** de la source pour Stéphane (le remote réel
   reste documenté).
4. Symétrie avec le nettoyage des chemins machine, qui a **gardé** les formes illustratives
   (`/Users/<user>/…`) en ne retirant **que** le username.

> **Option alternative rejetée (mentionnée pour arbitrage)** : aligner aussi le host sur la
> forme codex `http://<forgejo-host>:<port>/<user>/<repo>.git`. **Rejetée** ici car (a) elle
> élargit le périmètre au-delà du besoin, (b) elle heurte plus frontalement §4, (c) elle
> transforme une doc « valeur réelle » en template. Reste **flippable** par Stéphane au gate
> s'il veut une cohérence host totale entre kits — auquel cas #1/#2 deviennent
> `http://<forgejo-host>:<port>/<user>/<repo>.git` et #3 `http://<forgejo-host>:<port>/<user>/iakaframe`.

---

## 5. Critères d'acceptation (testables)

1. **Compte perso éradiqué des kits** :
   `grep -rn 'sjupin' kits/` → **0 résultat**.
2. **Cible précise disparue** :
   `grep -rn '192.168.2.11:3001/sjupin' kits/` → **0 résultat** ; et
   `grep -rn '192.168.2.11:3001/<user>' kits/` → **3 résultats** (les 3 lignes éditées).
3. **Host LAN conservé** (si option §4.2 retenue) :
   `grep -rn '192.168.2.11:3001' kits/` → **3 résultats** (host inchangé, seul le propriétaire
   a changé).
4. **Intégrité fonctionnelle du .py (non-régression OpenWebUI)** :
   - `cd kits/iakaframe-openwebui/functions && python3 -c "import ast; ast.parse(open('iakaframe_identity_filter.py').read())"` → **exit 0** (le fichier parse toujours) ;
   - `cd kits/iakaframe-openwebui/functions && python3 -m unittest test_identity_filter -v` → **suite verte** (mêmes verdicts qu'avant ; la parité règle Python↔`guard-core` est intacte).
5. **Iso-reste** : `git diff` ne montre **que** 3 lignes changées, chacune limitée au segment
   `sjupin` → `<user>` (aucune autre modification, aucun autre fichier).

---

## 6. Hors périmètre

- **Chemins machine** (`/Users/`, `C:\Users\`, `C:\work\iakaframe\`) : **déjà traités**
  (`01fa061`) — ne pas y revenir.
- **Host/IP `192.168.2.11:3001`** : conservé (§4.2), sauf bascule explicite de Stéphane au gate.
- **`FORGEJO_TOKEN`, `iakabox-usage.html`** et autres « valeurs réelles » de §4 : **non
  touchés** (seul le compte perso est visé).
- **Frames (`frames/releases/**`)** : gelées ; l'anonymisation s'y reflétera à la **prochaine
  génération de frame** (qui re-déparamètre depuis la source). Ne rien y éditer ici.
- **Occurrences de `sjupin` hors `kits/`** (ex. `specs/instructions/*.md`, `BACKLOG.md`,
  `frames/…`) : **documentation historique** de la campagne elle-même — **hors scope**.
- **Sur-anonymisation** du kit codex (déjà générique) : rien à faire, référence de forme.

---

## 7. Statut & jalon

| | |
|---|---|
| **Émetteur** | 🔵 Gandalf (Cadrage, P1) |
| **Contenu** | Instruction fermée `anonymisation-url-forgejo-kits.md` : **3 occurrences** localisées (2 prose `CLAUDE.md` + 1 métadonnée OWUI `.py`), swap **`sjupin` → `<user>`** host LAN conservé, **conflit §4 signalé** (LAISSER-DIVERGER) avec lecture de levée à valider, critères **grep-perso = 0** + **tests .py verts** (intégrité fonctionnelle OWUI). |
| **Récepteur** | 🟢 Le décideur (Stéphane) → **arbitre le conflit §4** + valide → dispatch **Gimli** |

**Points d'arbitrage au gate** :
1. **Conflit §4** (§3) : accepter la lecture « le retrait d'un identifiant personnel prolonge
   `01fa061` et ne heurte pas l'intention de §4 » → périmètre **complet (3 occurrences)** ;
   sinon → périmètre **réduit à la #3** (kit OpenWebUI, hors champ de §4).
2. **Host/IP** (§4.2) : conserver `192.168.2.11:3001` (recommandé) **ou** aligner sur la forme
   codex `<forgejo-host>:<port>` (option élargie).

Fichiers à vérifier avant exécution : `kits/iakaframe-claude/CLAUDE.md:60`,
`kits/iakaframe-claude/global/CLAUDE.md:73`,
`kits/iakaframe-openwebui/functions/iakaframe_identity_filter.py:4`,
`specs/instructions/reconcilier-kit-source-frame.md:93-94`,
`kits/iakaframe-codex/AGENTS.md:108`.
