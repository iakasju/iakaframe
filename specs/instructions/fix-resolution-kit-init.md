# Instruction — Corriger la résolution du dossier de kit dans `iakaframe init`

> Type : **correctif** (bug pré-existant révélé par le gate qualité). Cadrage : Gandalf (P1).
> Périmètre CLI `cli/` uniquement. **Frames gelées interdites** (`frames/releases/**`).

## 1. Besoin

`iakaframe init --path <dir> --node claude` (et donc `onboard`, qui délègue à `init`)
**échoue systématiquement** :

```
$ node cli/src/index.js init --path <tmp>/proj --node claude
Kit introuvable : /Users/sjupin/work/iakaframe/kit-claude
```

La portée **PROJET** (déploiement d'un kit dans un dépôt cible) est cassée, alors que la
portée **GLOBAL** (`install.mjs` → `~/.claude`) fonctionne. On veut **une seule convention
de résolution de kit, correcte partout**, sans casser la parité canonique du vocabulaire.

## 2. Cause racine (fichiers:lignes)

Deux couches de dérive entre le **nom canonique** de kit et son **emplacement disque réel** :

| Fait | Preuve |
|------|--------|
| `init` résout le kit par `path.join(root, kitNameForNode(node))` → cherche `<root>/kit-claude` | `cli/src/commands/init.js:44` |
| `kitNameForNode('claude')` renvoie le **nom canonique** `kit-claude` (identité, pas un chemin) | `cli/src/lib/vocab.js:74-91` |
| Or les kits déployables vivent sous `kits/iakaframe-<famille>/` — le dossier `<root>/kit-claude` **n'existe pas** | `kits/iakaframe-claude/` (5 arbres présents), racine `kit-*` absente |
| L'intention du rangement est **documentée** : « le rangement a déplacé `kit-*` → `kits/` » | `cli/src/lib/kit.js:14-18` (commentaire Q-1) |
| Et l'attendu d'`init` est **explicitement** « copie récursive du seul dossier `kits/iakaframe-claude/` » | `specs/instructions/reconcilier-kit-source-frame.md:48` |
| `install.mjs` (portée GLOBAL, **fonctionne**) résout déjà `kits/iakaframe-<host>` | `install.mjs:49-51`, `install.mjs:367` |

**Diagnostic** : le rangement `kit-* → kits/iakaframe-*` a été appliqué au **détecteur de
racine** (`hasFrameworkMarker`, `kit.js:19-23`) mais **jamais** à la **résolution du dossier
de kit à copier** (`init.js:44`), restée sur le nom canonique `kit-<famille>` interprété comme
un chemin racine. `init.js` et `install.mjs` divergent donc sur l'emplacement du kit.

**Kits déployables réellement présents** (arbres, pas les manifestes `.md`) :
`kits/iakaframe-claude/`, `kits/iakaframe-codex/`, `kits/iakaframe-ollama/`,
`kits/iakaframe-openwebui/`, `kits/iakaframe-anythingllm/`.
Le mapping nœud → dossier est un **simple échange de préfixe** `kit-` → `iakaframe-`
(déterministe pour claude/codex/ollama/openwebui, car `kitNameForNode` renvoie déjà la
famille : `kit-claude`, `kit-codex`, `kit-ollama`, `kit-openwebui`).

## 3. Contrainte dure : ne PAS toucher `vocab.js`

`cli/src/lib/vocab.js` est un **MIROIR verrouillé** de `packages/core/src/vocab.json`
(dépôt voisin iakaFrameGUI), sous test de parité :
- `cli/test/vocab-parity.test.js:45` — `deepEqual(mirror.KIT_NAME_BY_NODE, core.kitNameByNode)` ;
- `cli/test/vocab-parity.test.js:91` — `kitNameForNode('claude') === 'kit-claude'`.

Éditer `KIT_NAME_BY_NODE` (mettre `iakaframe-claude`) **casserait la parité et la CI**, et
**confondrait deux concepts distincts** : le **nom canonique** de kit (jeton d'identité,
`kit-claude`) et le **basename du dossier disque** (`iakaframe-claude`). La correction doit
donc vivre dans la **couche de résolution de chemin** (`kit.js`), pas dans le vocabulaire.

## 4. Options pesées

| Option | Description | Verdict |
|--------|-------------|---------|
| **(i)** Aligner le vocabulaire : `KIT_NAME_BY_NODE.claude = 'iakaframe-claude'` | Simple en apparence | **REJETÉE** : casse la parité (`vocab-parity.test.js:45,91`), diverge du core (source de vérité dans un autre dépôt), confond nom canonique et chemin disque |
| **(ii)** Résolveur robuste dédié dans `kit.js` : dérive `iakaframe-<famille>` du nom canonique (échange de préfixe), cherche `<root>/kits/iakaframe-<famille>` puis **fallback legacy** `<root>/kit-<famille>` | Centralise la résolution, préserve `vocab.js`, reproduit **exactement** la convention d'`install.mjs`, tolère les dépôts non encore rangés | **RETENUE** |
| **(iii)** Résolveur qui scanne `kits/` par heuristique | Fragile, non déterministe | Rejetée (sur-ingénierie) |

**Justification du choix (ii)** : c'est la correction la plus propre et MVP qui satisfait
« UNE résolution de kit unique et correcte partout » — elle fait converger `init.js` sur la
convention **déjà éprouvée** d'`install.mjs` (`kits/iakaframe-<x>`), garde `vocab.js` intact
(parité préservée), et le fallback legacy est cohérent avec l'esprit de `hasFrameworkMarker`
(`kit.js:19-23`) qui accepte déjà l'ancien et le nouveau rangement.

## 5. Solution retenue (spécification, sans code)

### 5.1 Nouveau résolveur dans `cli/src/lib/kit.js`
Ajouter une fonction exportée `kitDirForNode(root, node)` qui retourne le **chemin absolu du
dossier de kit déployable** :
1. Dériver le **basename disque** depuis le nom canonique : `kitNameForNode(node)` puis
   remplacer le préfixe `kit-` par `iakaframe-` (ex. `kit-claude` → `iakaframe-claude`).
2. Construire la liste ordonnée de candidats et retourner **le premier qui existe** :
   - `<root>/kits/<iakaframe-famille>` — **rangement courant** (aligné sur `install.mjs`) ;
   - `<root>/kit-<famille>` — **fallback legacy** (dépôts non rangés / anciens bundles) ;
3. Si **aucun** n'existe : retourner le **candidat primaire** (`<root>/kits/<iakaframe-famille>`)
   afin que le message d'erreur d'`init` pointe le chemin attendu.

### 5.2 Câblage dans `cli/src/commands/init.js`
- Remplacer `const kit = path.join(root, kitNameForNode(node));` (`init.js:44`) par un appel
  à `kitDirForNode(root, node)` (importé depuis `../lib/kit.js`).
- Retirer l'import désormais inutile de `kitNameForNode` s'il n'est plus référencé ailleurs
  dans le fichier (vérifier : seul usage actuel = ligne 44).
- Le message « Kit introuvable : … » (`init.js:47`) reste, désormais alimenté par le
  candidat primaire (`kits/iakaframe-<famille>`).

### 5.3 Alignement du bundle publié (même cause racine)
`cli/scripts/bundle.js:11` liste `ASSETS = ['kit-claude', 'kit-codex', ...]` — dossiers
**inexistants** à la racine → le paquet publié ne contient **aucun** kit et casse aussi
`init` en mode `_bundled`. Aligner le bundle pour embarquer `kits/` (et
`library/`, `methods/` requis par `hasFrameworkMarker`), afin que le résolveur trouve
`_bundled/kits/iakaframe-<famille>`. **La validation e2e du paquet publié (`npm pack`) est un
gate humain différé** (non testable hors publication) — voir §8.

## 6. Périmètre exact (fichiers à toucher)

- `cli/src/lib/kit.js` — **ajout** de `kitDirForNode(root, node)` (+ helper de dérivation de
  basename). Ne pas modifier `kitNameForNode`, `kitName`, `frameworkRoot`, `copyKit`.
- `cli/src/commands/init.js` — **câblage** ligne 44 sur le nouveau résolveur ; nettoyage import.
- `cli/scripts/bundle.js` — **alignement** de `ASSETS` sur le rangement `kits/` (+ `library/`,
  `methods/`).
- `cli/test/` — **ajout** d'un test de non-régression `init` (cf. §7).

**Interdits (hors périmètre, ne pas toucher)** :
- `cli/src/lib/vocab.js` et `cli/test/vocab-parity.test.js` (parité canonique).
- **Toute** frame gelée `frames/releases/**` (copies figées du code buggé = référence).
- `install.mjs` (déjà correct ; ne pas refactorer).
- Les kits eux-mêmes sous `kits/**` (contenu déployé, pas la résolution).

## 7. Critères d'acceptation (testables)

1. **Réparation nominale** : `node cli/src/index.js init --path <tmp> --node claude` **réussit**
   (exit 0), dépose le **contrat** `CLAUDE.md`, le marqueur `.iakaframe`, la structure
   `specs/`, et les **10** commandes `iaka-*.md** sous `.claude/commands/`
   (`iaka-cadre, iaka-update, iaka-etat, iaka-qualite, iaka-deploie, iaka-list, iaka-brief,
   iaka-services, iaka-recap, iaka-help`).
2. **Non-régression multi-nœud** : `--node codex` dépose `AGENTS.md` depuis
   `kits/iakaframe-codex/` ; `--node openwebui` résout `kits/iakaframe-openwebui/`
   (exit 0, pas de « Kit introuvable »).
3. **Fallback legacy** : sur une racine fixture contenant `kit-claude/` (ancien rangement) et
   **pas** de `kits/`, le résolveur retourne `<root>/kit-claude` (tolérance conservée).
4. **Erreur explicite** : nœud dont le dossier est absent → message
   `Kit introuvable : <root>/kits/iakaframe-<famille>` (chemin attendu, pas `kit-<famille>`).
5. **`onboard` non régressé** : `onboard --skip-forgejo --no-push --path <tmp> --node claude`
   passe l'étape `[1/5] Structure` (délègue à `init`) sans « Kit introuvable ».
6. **`go` / `config` non impactés** : aucune modification, comportement inchangé (ils ne
   résolvent aucun dossier de kit — vérifié).
7. **Parité vocab intacte** : `cd cli && node --test` — `vocab-parity.test.js` reste **vert**
   (aucune édition de `vocab.js`).
8. **Suite complète verte** : `cd cli && node --test` **entièrement au vert** (nouveau test
   `init` inclus).

## 8. Hors-périmètre / gates différés

- **Validation e2e du paquet publié** (`npm pack` + `init` depuis un dossier `_bundled`) :
  **gate humain différé** (nécessite une publication réelle). Le correctif `bundle.js` est
  posé, mais sa preuve e2e n'est pas dans cette boucle.
- Existence/complétude des arbres `kits/iakaframe-ollama/` et `kits/iakaframe-openwebui/`
  comme kits pleinement déployables : hors sujet (la résolution est corrigée ; le contenu
  relève d'autres instructions).
- Toute refonte de `vocab.js` / du modèle persona : hors sujet.

## 9. Jalon

```
     _  _    _    _     ___  _   _
  _ | || |  / \  | |   / _ \| \ | |
 | || || | / _ \ | |  | | | |  \| |
 | || || |/ ___ \| |__| |_| | |\  |
  \__/|_/_/   \_\_____\\___/|_| \_|
```

| Rôle | Contenu |
|------|---------|
| **Émetteur** | Gandalf (cadrage P1) |
| **Contenu** | Instruction fermée `specs/instructions/fix-resolution-kit-init.md` : correctif de la résolution du dossier de kit dans `init` (résolveur `kitDirForNode` dans `kit.js`, câblage `init.js:44`, alignement `bundle.js`, `vocab.js` intact), critères d'acceptation testables |
| **Récepteur** | Décideur (validation) → puis Gimli (exécution P2) |

**Fichiers à vérifier** (`chemin:ligne`) :
- `cli/src/commands/init.js:44` — le point buggé à câbler sur le résolveur ;
- `cli/src/commands/init.js:47` — message d'erreur (chemin attendu) ;
- `cli/src/lib/kit.js:19-23` — détecteur de racine (référence de convention à reproduire) ;
- `cli/src/lib/vocab.js:74-91` — nom canonique **à NE PAS toucher** ;
- `cli/test/vocab-parity.test.js:45` et `:91` — parité à préserver ;
- `install.mjs:49-51`, `install.mjs:367` — convention `kits/iakaframe-<x>` déjà correcte ;
- `cli/scripts/bundle.js:11` — `ASSETS` à aligner sur `kits/` ;
- `specs/instructions/reconcilier-kit-source-frame.md:48` — intention documentée (`kits/iakaframe-claude/`).

À la validation du décideur : **« JALON VALIDÉ »** → passage à Gimli pour exécution.
