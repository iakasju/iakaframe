# Surcharge explicite du modèle par acteur, persistée par projet et reprise à la session suivante

> Cadrage 🔵 Gandalf, 2026-09-02. Dépôt : `iakaframe` (CLI Node + conf projet).
> **Prérequis : `specs/instructions/affectation-modele-par-acteur.md`** (lot 1 — la projection du
> défaut). Ce lot-ci pose la **surcharge** par-dessus ; il ne se démarre pas avant que le lot 1 soit
> livré, sous peine d'écrire deux fois la même résolution.

## Problème

Le lot 1 rend effectif le **défaut** : le binding décide, `agents generate` projette. Il ne donne
aucun moyen de **déroger** ponctuellement. Or c'est précisément ce que le décideur demande, en trois
temps :

1. la **frame porte le défaut** — acquis par le lot 1, I3 non rouvert ;
2. l'utilisateur peut **surcharger explicitement, par commande** — inexistant ;
3. **relancer une session sur un projet reprend les affectations de la session précédente** — donc la
   surcharge doit être **persistée par projet** et **reprise sans geste**.

Aujourd'hui, la seule façon de faire tourner Gandalf sous un autre modèle serait d'**éditer le
binding**, c'est-à-dire de changer le défaut de **tous** les projets pour un besoin ponctuel sur
**un** projet. C'est le geste que ce lot doit rendre inutile — et c'est aussi le chemin prévu pour
**Fable**, que la politique du décideur interdit dans tout binding.

## Faits vérifiés

**F1 — précédence des sous-agents (sourcé, doc officielle, 2026-09-02).** Page *Subagents*
(`code.claude.com/docs/en/sub-agents`), table des emplacements, verbatim :

> | Location | Scope | Priority |
> | `.claude/agents/` | Current project | 3 |
> | `~/.claude/agents/` | All your projects | 4 |

et la règle :

> When multiple subagents share the same name, Claude Code uses the one from the higher-priority
> location.

**Un contrat de projet l'emporte donc sur le contrat utilisateur homonyme.** C'est le mécanisme
natif sur lequel toute la conception ci-dessous repose — il n'y a rien à inventer.

Avertissement de la même page, à retenir pour R-3 :

> Keep `name` values unique across the whole tree: if two files under the same `.claude/agents/`
> directory, including its subfolders, declare the same name, Claude Code loads only one of them,
> chosen by filesystem read order rather than a documented precedence.

**F2 — le domicile de la conf projet est `iakaframe.json`, et il est partagé.**
`PROJECT_CONF = 'iakaframe.json'` (`cli/src/lib/frame-active.js:30`), déclaré **source unique
CLI↔GUI** ; la GUI y écrit via `project_conf.rs::write_active_frame`. Une écriture **non
destructive** existe déjà et sert de patron : `writeActiveFramePointer`
(`frame-active.js:62-75`) relit le JSON, **ne touche qu'une clé**, préserve les autres, et
**refuse d'écrire** si le fichier existe mais est illisible (`{ ok:false, reason:'unreadable' }`)
plutôt que d'écraser les clés du voisin. Clés constatées aujourd'hui : `frame`, `bannerFont`
(`banner.js:4`). Le marqueur texte `.iakaframe` (`frame=`) est **legacy**, lu en repli de
transition seulement.

**F3 — `iakaframe models` est déjà frame-scopé, et il affiche déjà le modèle.** `roleRows`
(`cli/src/commands/models.js:103-140`) résout la frame active → la team → le binding, et rend, par
`roleKey`, la liste des personas avec leur `runner` et leur `model`. C'est **le seul rendu existant
qui montre l'affectation**, et il est déjà au bon périmètre. À l'inverse, `agents list` s'appuie sur
`listPersonas()` (`cli/src/lib/agents.js:83-86`) qui **scanne toute la bibliothèque** sans filtre de
frame — il montre aussi les personas d'autres frames. **Ce lot n'y touche pas** (R-5).

**F4 — le fichier de la skill `iakastart` est vendoré.** `iakastart` figure dans `SKILL_IDS` **et**
dans `RITUAL_IDS` (`cli/src/lib/vendor.js:45` et `:60-70`), tous deux en **copies byte-à-byte** vers
`iakaFrameGUI`. Amender la skill a donc un coût de vendorage, chiffré et déclaré (R-4).

**F5 — valeurs acceptées par le champ `model:`** — établi au lot 1 (F1/F2 de
`affectation-modele-par-acteur.md`) : `sonnet`, `opus`, `haiku`, **`fable`**, un id complet
(`claude-opus-5`), `inherit`. **`fable` est techniquement valide** ; son exclusion est une
**politique**, jamais une contrainte du runner.

## Décision retenue

**D1 — le point de résolution, et il est unique.**

```
surcharge projet (iakaframe.json)  ??  défaut de frame (binding)  ??  omission
```

Matérialisé par une fonction **pure** `effectiveModel({ overrides, binding, personaId })`, où
`overrides` est l'objet déjà lu depuis la conf projet. `modelForPersona` (lot 1) **n'est pas
modifiée** : elle reste la lecture du binding, et devient le **deuxième** terme de la chaîne.
`generateAgent` **substitue** `effectiveModel` à `modelForPersona` **au point de couture nommé par
D7 du lot 1** — une ligne, pas une réécriture. Le filtre de runner (D4 du lot 1) reste **en aval** :
une surcharge sur un binding non-Claude ne produit toujours **aucune** ligne `model`.

**D2 — la clé : `modelOverrides`, objet indexé par `personaId`.**

```json
{
  "frame": "iakaframe",
  "modelOverrides": { "gandalf": "fable", "gimli": "haiku" }
}
```

Nom choisi contre `models` : ce dernier **collisionnerait** avec l'étage *suggestion par `roleKey`*
(`models/suggestions.json`, verbe `models`), et D3 du canon interdit précisément de confondre les
deux étages. `modelOverrides` **dit sa nature** — une dérogation, donc l'absence d'entrée signifie
« défaut de frame », jamais « pas de modèle ». Indexé par `personaId` (et non par `roleKey`) parce
que c'est l'étage **affectation**, celui du binding.

**D3 — écriture non destructive, guard single-sourcé.** Le lot **extrait** de
`writeActiveFramePointer` un helper `patchProjectConf(projectDir, mutate)` qui porte, **en un seul
endroit** : relecture, refus sur JSON illisible, mutation ciblée, réécriture 2-indentée avec `\n`
final. `writeActiveFramePointer` **délègue** à ce helper (comportement inchangé, ses tests le
prouvent), et l'écriture de `modelOverrides` l'emploie aussi. Motif : le garde « refuse plutôt
qu'écrase » est exactement ce qu'il ne faut **pas** ré-implémenter une seconde fois avec une nuance
— c'est ainsi que naissent les divergences CLI↔GUI que ce dépôt passe son temps à traquer. Une clé
`modelOverrides` vidée de sa dernière entrée est **retirée** du JSON (pas laissée en `{}`) : un
objet vide et une clé absente doivent avoir la même lecture, autant n'en écrire qu'une.

**D4 — les commandes, symétriques par construction.** Sous-verbes du verbe existant `models`
(déjà frame-scopé, F3) :

| Geste | Commande | Effet |
|---|---|---|
| **+** poser | `iakaframe models set <personaId> <modele> [--path <projet>]` | écrit `modelOverrides[<personaId>]` **et** projette le contrat du projet |
| **−** retirer | `iakaframe models unset <personaId> [--path <projet>]` | retire l'entrée **et** supprime le contrat de projet → retour au défaut de frame |
| **−** tout retirer | `iakaframe models unset --all [--path <projet>]` | retire la clé entière et tous les contrats de projet qu'elle avait posés |
| lire | `iakaframe models [--path <projet>] [--json]` | affiche le modèle **effectif** + sa **provenance** |

`--json` sur les trois écritures, comme partout ailleurs.

**D5 — la surcharge se matérialise dans `<projet>/.claude/agents/<id>.md`, et NULLE PART
ailleurs.** C'est la conséquence directe de F1, et elle n'est pas négociable : les contrats déployés
de ce poste vivent dans `~/.claude/agents/` (**portée : tous les projets**). Y écrire une surcharge
*de projet* la ferait **fuir sur les neuf autres projets du portefeuille** — un `fable` posé pour un
gros lot sur `iakaframe` s'appliquerait à `IakaCockpit` au prochain `cd`. La projection va donc dans
le contrat **de projet**, qui gagne par priorité 3 contre 4.

**Corollaire — seules les personas surchargées reçoivent un fichier de projet.** `models set` écrit
**un** contrat, pas dix ; `models unset` le **supprime**. La surcharge est donc matérialisée par
**l'existence même du fichier**, et son retrait par sa **disparition** : la symétrie `+`/`−` est
**structurelle**, pas un simple drapeau. On n'emploie pas `agents generate --project` (qui écrit les
dix) : dupliquer neuf contrats non surchargés créerait neuf ombres susceptibles de se périmer, pour
zéro besoin.

**D6 — validation d'une valeur : garde de FORME bloquante, avertissement de FOND non bloquant.**
Aucune allowlist (D5 du lot 1, motif inchangé : la liste des alias bouge, et une allowlist
**interdirait** ce que la politique veut seulement ne pas poser par défaut).

- **Bloquant — ce qui ne peut pas être une valeur** : chaîne vide ou blanche (c'est `unset`, un
  geste distinct), espace interne, retour à la ligne, et tout caractère qui casserait le
  frontmatter rendu (`:` suivi d'une espace, `#`, `"`, `'`, `[`, `{` en tête). Cette garde ne
  connaît **aucun nom de modèle** — elle ne peut donc pas se périmer.
- **Avertissement — ce qui est douteux mais licite** : une valeur hors de l'ensemble connu au
  moment de l'écriture (`sonnet`, `opus`, `haiku`, `fable`, `inherit`, ou `claude-*`) est **écrite
  quand même**, avec un message qui le dit : *« valeur inhabituelle : <v> — écrite ; vérifier
  qu'elle est acceptée par le runner. »* C'est ce qui laisse passer un alias futur, et ce qui
  attrape `sonnnet` sans jamais bloquer sur du légitime.

**D7 — persona inconnue : refus, jamais d'écriture.** Si `<personaId>` n'appartient pas à la team
de la frame active du projet, la commande **refuse** et n'écrit rien : *« persona inconnue : X —
absente de la team <teamId> de la frame active <frame> ; surcharge NON écrite. »*, exit ≠ 0. Calque
exact de `frame use` sur une frame absente du réservoir (`frame.js:220-224`, *« jamais de
dangling »*). Une surcharge sur une persona fantôme serait un état mort et silencieux dans un
fichier partagé avec la GUI.

**D8 — la reprise : on LIT au démarrage, on n'ÉCRIT jamais au démarrage.** La reprise est
**automatique par construction** : le contrat de projet posé par `models set` est **sur le disque**,
et le runner le relit à chaque session (F1). Aucun mécanisme neuf n'est requis pour que la session
suivante hérite de la surcharge.

Reste le cas où la **décision** existe sans sa **projection**. **A-3 ayant été tranché sur
« ignorer » (décideur, 2026-09-02), ce cas n'est PAS un cas limite : c'est le cas NORMAL** de tout
clone frais et de toute machine reconstruite. La projection n'étant pas versionnée, un `git clone`
ramène `iakaframe.json` — donc la **décision** — et **aucun** contrat de projet. Il faut donc le
traiter comme un chemin de première classe, pas comme une bizarrerie.

Les quatre occurrences, et elles sont toutes attendues :

| Situation | `iakaframe.json` | `<projet>/.claude/agents/` | Fréquence |
|---|---|---|---|
| **Clone frais** (collègue, autre poste) | présent | **absent** | **normale, par conception A-3** |
| **Machine reconstruite** (cf. le rituel de reconstruction du poste) | présent | **absent** | **normale** |
| `.claude/` purgé à la main | présent | absent | occasionnelle |
| Conf éditée à la main, ou surcharge posée depuis la GUI | présent | absent ou périmé | occasionnelle |

Pour tous :

- **`iakastart` lit et affiche** le modèle effectif de chaque acteur, et **signale** une divergence
  entre `iakaframe.json` et les contrats déployés, en **nommant la commande qui la répare**
  (`iakaframe models set <persona> <modele> --path <projet>`, ou le rejeu de toutes les entrées).
  **Lecture seule — il n'écrit rien, jamais.** Le message doit être **actionnable sans réflexion** :
  quelle persona, quel modèle décidé, quel modèle effectif, quelle commande. C'est ce signalement,
  et lui seul, qui rend la décision **récupérable** après un clone — sans lui, A-3 « ignorer »
  transformerait une décision versionnée en décision **invisible**.
- **Aucune re-projection automatique au bootstrap.** Justification, et elle est de méthode : un
  bootstrap qui réécrit silencieusement des contrats déployés est une **mutation invisible en début
  de session** — et si le `cwd` ou la racine de bibliothèque résolue n'est pas celle qu'on croit
  (piège de la racine périmée, R-2), il réécrirait depuis le **mauvais canon** sans que personne ne
  l'ait demandé. On signale, l'utilisateur décide. C'est la même doctrine que `vendor-check` et
  `agents generate --check` : *ces gardes CONSTATENT, elles ne réécrivent pas.*

**D9 — le roster d'`iakastart` affiche le modèle effectif : OUI.** Tranché, et voici pourquoi.
L'objet même des deux lots est que l'affectation **cesse d'être décorative**. Si, après avoir posé
une surcharge, le roster continue d'afficher neuf lignes identiques sans dire sous quel modèle
chaque acteur tourne, l'utilisateur n'a **aucun moyen de constater** que son geste a pris effet
autrement qu'en ouvrant des fichiers — c'est-à-dire qu'on aurait livré une fonctionnalité **et**
reconduit le défaut qu'elle corrige. Le roster est le seul endroit où l'équipe est vue **en entier**
au début d'une session : c'est là que « qui tourne sous quoi » se lit d'un coup d'œil, et c'est là
que la divergence de D8 se voit. La colonne est **dérivée** de `iakaframe models --json` (frame-scopé,
F3), jamais recopiée à la main dans le tableau de la skill.

**D10 — Fable : politique inchangée, et c'est ici qu'il vit.** `fable` n'entre dans **aucun**
binding, sur **aucune** persona. La commande `models set` est **le chemin prévu** pour lui : une
décision explicite, portée par un projet, retirable par `models unset`. Rien dans le code ne le
mentionne comme interdit — l'interdiction serait fausse (F5) et se périmerait. Ce qu'on vérifie,
c'est qu'aucun **binding** n'en porte (CA-16), pas que la valeur soit refusée.

## Arbitrages — TRANCHÉS par le décideur le 2026-09-02

> ### ✅ DÉCISIONS
> **Décideur : Stéphane. Date : 2026-09-02. Énoncé, mot pour mot : « P-D et A-3 ignorer, A-2 ok ».**
>
> | Arbitrage | Décision | Effet sur ce lot |
> |---|---|---|
> | **A-2** — nommage des sous-verbes | ✅ **OK** — `models set` / `models unset` / `unset --all` retenus **tels quels** | aucun ; la recommandation devient la spécification |
> | **A-3** — versionner la projection | ✅ **IGNORER** — `<projet>/.claude/agents/*.md` **ne se versionnent pas** | le lot **prescrit** l'entrée `.gitignore` (étape 4bis, CA-25) ; D8 traite le clone frais comme le **cas normal** |
> | **A-1** (lot 1) | ✅ **P-D** | rappel : voir `affectation-modele-par-acteur.md` |
>
> **Ce lot n'attend plus aucune décision.** Les options écartées restent écrites ci-dessous **comme
> trace** de ce qui a été pesé — elles ne sont plus des propositions.

**A-2 — nommage des deux sous-verbes** — ✅ **TRANCHÉ : OK, retenu tel quel.**
*(Rédaction d'origine, conservée :)* Recommandé : **`models set` / `models unset`**, sur le patron des paires existantes
`add`/`remove` et `attach`/`detach`. Écarté : `models affect` — `agents affect` existe déjà avec un
**autre** sens (déployer le contrat d'une persona), et deux `affect` divergents dans le même CLI
sont un piège. Écarté aussi : nommer d'après un produit ou un modèle (règle du nommage **par le
geste**). Alternatives acceptables si le décideur préfère du français : `models poser` / `models
retirer`.

**A-3 — versionne-t-on `<projet>/.claude/agents/*.md` ?** — ✅ **TRANCHÉ : NON, on ignore.**

**Ce que la décision prescrit, et qui devient donc du périmètre :**
1. Le lot **ajoute** l'entrée `.gitignore` (étape 4bis). Mon « aucun `.gitignore` touché sans son
   accord » **a cet accord** ; la réserve tombe.
2. **Corollaire à écrire noir sur blanc, parce qu'il est le prix de la décision** : sur un **clone
   frais** ou une **machine reconstruite**, la **décision est présente** (`iakaframe.json` est
   versionné) et la **projection est absente**. C'est le fonctionnement **nominal**, pas une
   anomalie — et c'est pourquoi le signalement de **D8** n'est pas un confort : **il est ce qui
   empêche une décision versionnée de devenir une décision invisible.** Sans lui, on aurait choisi
   de ne pas versionner un artefact **et** perdu le moyen de le reposer.
3. `iakastart` **signale et nomme la commande qui répare — et n'écrit rien de lui-même** (D8, CA-20).

*(Rédaction d'origine, conservée comme trace :)* Vraie question de portefeuille, pas de
code. La **décision** (`iakaframe.json`) est versionnée de toute façon. La **projection**, elle :
- *versionnée* → un collègue qui clone hérite de la surcharge sans rien lancer, mais le dépôt gagne
  des fichiers générés qui peuvent se périmer face au canon ;
- *ignorée* → l'arbre reste propre, mais après un clone la décision existe sans projection, et
  c'est exactement le cas que le signalement de D8 sert à rendre visible.

**Recommandation *(suivie par le décideur)* : ignorer la projection** (`.gitignore`), et s'appuyer
sur le signalement d'`iakastart` + `models set` pour la reposer. Motif : un artefact **dérivable**
ne se versionne pas, et ce dépôt a déjà payé le prix des copies dérivées qui se périment.
~~Le décideur tranche ; le lot ne touche à aucun `.gitignore` sans son accord.~~ → **accord donné le
2026-09-02.**

## Périmètre

- **Inclus** :
  - `effectiveModel` (pure) + lecture de `modelOverrides` depuis la conf projet ;
  - `patchProjectConf` extrait, `writeActiveFramePointer` y déléguant ;
  - les sous-verbes `models set` / `models unset` (+ `--all`), avec `--path`, `--json` ;
  - la projection/suppression du contrat **de projet** pour les seules personas surchargées ;
  - la **provenance** (`frame` / `projet`) dans le rendu de `iakaframe models` ;
  - la colonne « modèle effectif » du roster `iakastart` + le signalement de divergence ;
  - **`docs/commandes.md`** mis à jour **dans ce lot** (règle permanente : toute commande ajoutée y
    est répercutée dans le même lot) ;
  - **l'entrée `.gitignore`** qui exclut la projection *(entré au périmètre le 2026-09-02, A-3
    tranché « ignorer »)* ;
  - les tests unitaires et de bout en bout correspondants.
- **Exclu — liste fermée** :
  - **I3 non rouvert** : le binding reste le canon du **défaut** ; la surcharge est un **étage
    au-dessus**, jamais une réécriture du binding. Aucune commande n'écrit dans `bindings/`.
  - `models/suggestions.json` : **intouché** (étage suggestion par `roleKey`).
  - Les affectations opus/sonnet actuelles : **non rebattues**.
  - **Surcharge globale / portefeuille** : hors sujet. Le besoin est *par projet* ; changer un
    défaut pour tous les projets, c'est éditer le binding, et c'est déjà possible.
  - **`agents list` n'est pas frame-scopé** et **reste tel quel** (R-5).
  - `agents generate --project` conserve son comportement (les dix contrats) — `models set`
    ne l'utilise pas.
  - ~~Aucun `.gitignore` touché avant l'arbitrage A-3.~~ **Levé le 2026-09-02** : A-3 est tranché
    (« ignorer »), l'entrée `.gitignore` est **passée à l'Inclus** ci-dessus. Reste exclu :
    **ignorer autre chose que la projection** — `iakaframe.json` **est** versionné, c'est lui qui
    porte la décision, et l'ignorer viderait A-3 de son sens.

## Étapes d'implémentation

1. **Extraire `patchProjectConf(projectDir, mutate)`** dans `cli/src/lib/frame-active.js`, et faire
   **déléguer** `writeActiveFramePointer`. Aucun changement de comportement : les tests existants de
   `writeActiveFramePointer` doivent passer **sans être modifiés** (c'est la preuve de l'extraction).
2. **Écrire le lecteur/écrivain de surcharge** dans un module dédié
   `cli/src/lib/project-models.js` :
   - `readModelOverrides(projectDir)` → objet (`{}` si absent/illisible, jamais de jet, calque de
     `parseJsonFile`) ;
   - `writeModelOverride(projectDir, personaId, model)` et `clearModelOverride(projectDir,
     personaId | null)` — via `patchProjectConf` ; clé retirée quand elle devient vide (D3).
3. **Écrire `effectiveModel({ overrides, binding, personaId })`** (pure) et **substituer** son appel
   à celui de `modelForPersona` au point de couture de `generateAgent` (D7 du lot 1). Vérifier que
   c'est bien **une seule ligne** : sinon, le lot 1 n'a pas tenu sa couture, et c'est à corriger là.
4. **Sous-verbe `models set`** : valider la forme (D6), valider la persona contre la team active
   (D7), écrire la surcharge, **puis** projeter le contrat de projet
   `<projet>/.claude/agents/<id>.md` par le **même moteur de rendu** que `agents generate` (aucun
   second rendu — un contrat rendu deux fois par deux chemins finit par diverger). Rendre le chemin
   écrit et le modèle effectif.
4bis. **Prescrire l'entrée `.gitignore`** *(A-3 tranché « ignorer », 2026-09-02)* : exclure la
   **projection** `/.claude/agents/` du projet, et **elle seule**. `iakaframe.json` **reste
   versionné** — c'est lui qui porte la décision. L'entrée est posée dans le `.gitignore` du
   **projet cible**, pas dans celui d'`iakaframe` : c'est une règle de projet, et `models set`
   écrit dans le projet de l'utilisateur. Si `models set` détecte que la projection **n'est pas
   ignorée** dans le projet visé, il le **signale** une fois (message, pas d'erreur, pas
   d'écriture) — il ne modifie **jamais** le `.gitignore` de quelqu'un d'autre sans le dire.
5. **Sous-verbe `models unset`** : retirer l'entrée (ou toutes sous `--all`), **et supprimer** le(s)
   fichier(s) de contrat de projet correspondants. Une entrée absente n'est **pas** une erreur
   (idempotent) ; un fichier déjà absent non plus. Rendre ce qui a été retiré, et ce qui ne l'était
   déjà plus.
6. **Provenance dans `iakaframe models`** : chaque persona affiche son modèle **effectif** et d'où
   il vient (`frame` ou `projet`). En `--json`, deux champs distincts (`model`, `modelSource`) — pas
   une chaîne décorée que le consommateur devrait re-parser.
7. **`iakastart`** : amender `library/skills/iakastart/SKILL.md` — étape 3, colonne « Modèle » du
   roster, **dérivée de `iakaframe models --json`**, plus le signalement de divergence de D8 avec la
   commande qui répare. **Vérifier** si `library/rituals/iakastart.md` décrit lui aussi le roster :
   si oui l'amender pareillement, sinon **ne pas y toucher**. Ne pas recopier de valeurs de modèle
   en dur dans la prose.
8. **`docs/commandes.md`** : documenter `models set` / `models unset` dans la section du verbe
   `models`, et l'aide `HELP` de `cli/src/index.js` + celle de `models.js`.
9. **Tests** (cf. critères) puis **recette pinnée** (§ Recette).

## Recette — commandes PINNÉES

Même piège qu'au lot 1 : `iakaframe` sur le `PATH` exécute **la racine publiée**, pas ce checkout,
et `libraryRoot()` remonte depuis le `cwd`.

```sh
CK=/Users/sjupin/work/iakaframe
PJ=/tmp/iaka-recette-surcharge          # projet jetable, jamais un vrai projet

cd "$CK/cli" && npm test

IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" models set gandalf fable --path "$PJ" --json
cat "$PJ/iakaframe.json"
grep -n '^model:' "$PJ/.claude/agents/gandalf.md"
IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" models --path "$PJ" --json

IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" models unset gandalf --path "$PJ" --json
ls "$PJ/.claude/agents/"                # gandalf.md a disparu
cat "$PJ/iakaframe.json"                # la cle modelOverrides a disparu, `frame` est intacte
```

## Fichiers concernés

- `cli/src/lib/frame-active.js` — extraction de `patchProjectConf` ; `writeActiveFramePointer`
  délègue.
- `cli/src/lib/project-models.js` — **neuf** : lecture/écriture de `modelOverrides`.
- `cli/src/lib/generate-agents.js` — `effectiveModel` + **une ligne** substituée au point de couture.
- `cli/src/commands/models.js` — sous-verbes `set`/`unset`, provenance dans le rendu, `HELP`.
- `cli/src/index.js` — `HELP` du verbe `models`.
- `library/skills/iakastart/SKILL.md` — colonne « Modèle » + signalement de divergence
  (**fichier vendoré**, cf. R-4).
- `docs/commandes.md` — les deux sous-verbes.
- **`.gitignore` du PROJET CIBLE** *(A-3, 2026-09-02)* — entrée excluant `/.claude/agents/`. Ce
  n'est **pas** un fichier du dépôt `iakaframe` : c'est une règle posée dans le projet de
  l'utilisateur, là où `models set` écrit. **À vérifier par le dev** : si un scaffold de projet
  neuf existe dans `library/scaffolds/`, l'entrée y a sa place pour que les projets futurs
  naissent conformes — mais **le vérifier avant**, ne pas le supposer.
- `cli/test/…` — tests neufs (résolution, conf, commandes, projection/suppression).
- **Non modifiés, et c'est le sujet** : `bindings/*.md`, `library/personas/*.md`,
  `models/suggestions.json`, `cli/src/lib/agents.js`, `cli/src/commands/agents.js`.
- **`methode-de-travail.html` — NON touché, et il faut le dire.** Le lot 1 a dû le régénérer (zone
  `CODE_BLOCKS`, troisième cliquet sur le **format** de contrat). **Ce lot-ci ne change pas le
  format** : il change une **valeur**, et seulement dans le contrat **d'un projet**. Or la vitrine
  rend les contrats du **canon + binding défaut**, en portée globale — une surcharge de projet ne
  l'atteint donc pas. `cli/test/vitrine-methode.test.js` doit rester **vert sans régénération** ;
  s'il rougit, c'est que la surcharge a fui hors du projet, et c'est **exactement le défaut que D5
  prévient**. Ce cliquet devient ainsi, gratuitement, un **détecteur de fuite** — d'où CA-24.

## Risques

- **R-1 — le contrat de projet fait de l'ombre et peut se périmer.** Un
  `<projet>/.claude/agents/gandalf.md` posé aujourd'hui masque (priorité 3 > 4) le contrat
  utilisateur **même après** une évolution de la persona canon. *Mitigation* : la surface d'ombre
  est réduite au strict minimum (D5 — une persona surchargée = un fichier, jamais dix) ; `models
  set` **re-rend depuis le canon courant** à chaque appel ; `agents generate --check --project`
  détecte la dérive. *Résidu assumé et déclaré* : un projet dont la surcharge est ancienne peut
  porter un corps de persona périmé jusqu'au prochain `models set` — c'est le prix de la
  précédence, et il est plus petit que celui de la fuite inter-projets qu'il évite.
- **R-2 — la racine périmée.** *Mitigation* : § Recette, `IAKAFRAME_HOME` + chemins absolus. C'est
  aussi **le motif de D8** : aucune re-projection automatique au bootstrap, où la racine résolue est
  la moins contrôlée.
- **R-3 — collision de noms dans l'arbre `.claude/agents/`.** La doc prévient (F1) qu'à `name` égal
  **dans le même répertoire, sous-dossiers compris**, le choix se fait par ordre de lecture du
  système de fichiers. *Mitigation* : ce lot écrit **un fichier par persona, à plat**, nommé
  `<personaId>.md` — jamais de sous-dossier, jamais de suffixe. La précédence exploitée est celle
  **entre répertoires** (projet vs utilisateur), qui est documentée ; celle **intra-répertoire**, qui
  ne l'est pas, n'est jamais mise en jeu.
- **R-4 — coût de vendorage de l'amendement `iakastart`.** `library/skills/iakastart/SKILL.md` est
  vendoré en copie (F4) : le modifier ajoute **+1 ligne de dérive** à `vendor-check` (+1 de plus si
  le rituel homonyme doit l'être aussi). *Mitigation* : le chiffre est **annoncé** (CA-17) et il est
  le prix de D9, qui est justifié.
  **Ligne de base mesurée le 2026-09-02, et elle est meilleure que je ne l'avais écrit** : le
  vendorage est **propre** (`vendor-check` → `drift: 0`, 82 copies + 4 dérivées) — avant **comme
  après** le lot 1, livré sous la posture **P-D**, qui a rétabli la parité au lieu de la contourner
  (goldens `gandalf.md` des deux dépôts : même `sha256 329ab353…`, même `model: opus`). **Ce lot-ci
  part donc de zéro**, et sa `+1` sera la **seule** ligne de dérive de tout le chantier — donc
  triviale à re-vendorer proprement. *Corollaire à ne pas manquer : sur un fond propre, une ligne de
  dérive se voit. Il n'y a plus de bruit dans lequel elle pourrait se perdre — raison de plus pour
  la refermer dans le lot plutôt que de la laisser traîner.*
- **R-5 — `agents list` restera trompeur.** Il liste toute la bibliothèque, hors frame, et
  n'affichera **pas** le modèle. *Mitigation* : ne rien y ajouter (une colonne juste sur une liste
  fausse aggraverait la confusion) et **inscrire au backlog** le successeur *« `agents list` n'est
  pas frame-scopé — le porter sur `personasForTarget` »*. Défaut nommé, pas défaut caché.
- **R-6 — la GUI écrit dans le même fichier.** *Mitigation* : `patchProjectConf` ne touche qu'une
  clé et refuse un JSON illisible (D3, patron F2) ; CA-8 le prouve par un aller-retour
  `models set` → `frame use` → relecture des **deux** clés.

## Critères d'acceptation

Résolution et conf :

- [ ] **CA-1** — `effectiveModel` : surcharge présente ⇒ la surcharge ; absente ⇒ le binding ;
      les deux absentes ⇒ `''`. Les trois cas testés séparément.
- [ ] **CA-2** — `modelForPersona` (lot 1) est **inchangée** : ses tests du lot 1 passent **sans
      qu'une ligne ne soit modifiée**.
- [ ] **CA-3** — la substitution dans `generateAgent` tient en **une seule ligne** de diff sur la
      résolution du modèle (preuve que la couture D7 du lot 1 a tenu).
- [ ] **CA-4** — surcharge posée sur un binding **non-Claude** (Ollama) ⇒ **aucune** ligne `model:`
      dans le contrat rendu (le filtre de runner reste en aval).
- [ ] **CA-5** — `readModelOverrides` rend `{}` sur : fichier absent, JSON invalide, JSON non-objet,
      clé absente. Aucun jet dans les quatre cas.
- [ ] **CA-6** — `writeActiveFramePointer` conserve **exactement** son comportement après
      délégation à `patchProjectConf` : ses tests passent **sans modification**.
- [ ] **CA-7** — écrire une surcharge sur un `iakaframe.json` **illisible** est **refusé**
      (`ok:false`, `reason:'unreadable'`), et le fichier est **inchangé à l'octet**.
- [ ] **CA-8 (non-écrasement, la preuve croisée)** — sur un projet neuf : `models set gandalf opus`
      puis `frame use iakaframe` puis relecture ⇒ le JSON porte **`frame` ET `modelOverrides`**,
      `bannerFont` (s'il existait) **intacte**. Puis `models unset gandalf` ⇒ `frame` **toujours
      là**, `modelOverrides` **disparue** (pas un `{}` résiduel).

Commandes et symétrie :

- [ ] **CA-9** — `models set gandalf fable` : exit `0`, écrit `modelOverrides.gandalf = "fable"`,
      **et** crée `<projet>/.claude/agents/gandalf.md` portant `model: fable` en position 5
      (après `tools`, avant `skills`).
- [ ] **CA-10 (le `−` est structurel)** — `models unset gandalf` : exit `0`, retire l'entrée **et
      supprime le fichier**. `ls <projet>/.claude/agents/` ne le contient plus. Relancé une seconde
      fois : **idempotent**, exit `0`, aucun message d'erreur.
- [ ] **CA-11** — `models unset --all` retire la clé entière **et** tous les fichiers qu'elle avait
      posés — et **aucun autre** : un contrat de projet préexistant, non issu d'une surcharge, n'est
      **pas** supprimé.
- [ ] **CA-12** — `models set` sur une persona **absente de la team active** : exit ≠ 0, message
      nommant la persona, la team et la frame, **et `iakaframe.json` inchangé à l'octet**.
- [ ] **CA-13** — valeur de **forme** invalide (`""`, `"opus sonnet"`, `"a: b"`, `"#opus"`) :
      **refus**, rien écrit, message citant la valeur.
- [ ] **CA-14** — valeur **inhabituelle mais bien formée** (`sonnnet`) : **écrite**, exit `0`, avec
      l'avertissement. `fable` **n'émet aucun avertissement** (elle est dans l'ensemble connu, F5).
- [ ] **CA-15** — `models --json` rend, par persona, `model` **et** `modelSource ∈ {frame, projet}` :
      deux champs distincts, `projet` pour les seules personas surchargées.

Politique, affichage, doc :

- [ ] **CA-16** — `grep -R 'fable' bindings/` ne rend **rien** : aucun binding ne porte Fable, sur
      aucune persona (D10). Et CA-9 prouve que la valeur est **atteignable** par commande.
- [ ] **CA-17** — après le lot, `vendor-check --root <CK> --json` est exécuté et **sa sortie citée**,
      avant/après. L'écart attendu est de **+1** (`library/skills/iakastart/SKILL.md`), **+2** si le
      rituel homonyme a dû être amendé. Un écart différent s'explique, il ne s'arrondit pas.
- [ ] **CA-18 (la reprise, mesurée comme telle)** — sur un projet jetable : `models set gimli
      haiku`, puis **relire le contrat depuis le disque dans un second processus** ⇒ il porte
      `model: haiku`. C'est cette relecture-là — pas la mémoire du premier processus — qui prouve
      que la session suivante reprend l'affectation.
- [ ] **CA-19** — `iakastart` affiche une colonne « Modèle » **dérivée** de `iakaframe models
      --json` ; sur le projet de CA-18, Gimli y apparaît en `haiku` et les autres au défaut de
      frame. Aucune valeur de modèle codée en dur dans la prose de la skill.
- [ ] **CA-20 (le signalement, pas la réécriture)** — décision présente sans projection
      (`iakaframe.json` porte la surcharge, `<projet>/.claude/agents/<id>.md` supprimé à la main) :
      `iakastart` **signale** la divergence et **nomme la commande** qui la répare, **et n'écrit
      rien** — le fichier est toujours absent après l'affichage.
- [ ] **CA-21** — `docs/commandes.md` documente les deux sous-verbes ; `iakaframe models --help` et
      `iakaframe --help` les mentionnent. Les trois textes s'accordent (mêmes noms, mêmes options).
- [ ] **CA-22** — `cd cli && npm test` sort en `0`, avec un compte de tests **strictement
      supérieur** à celui d'après le lot 1, **aucun test supprimé**.
- [ ] **CA-23** — le successeur *« `agents list` n'est pas frame-scopé »* (R-5) est inscrit au
      `BACKLOG.md` avec sa référence `cli/src/lib/agents.js:83`.
- [ ] **CA-25 (A-3 « ignorer », le cas normal du clone)** *(ajouté le 2026-09-02)* — sur un projet
      portant une surcharge : `git status` ne montre **aucun** fichier de
      `<projet>/.claude/agents/`, et `iakaframe.json` **est** suivi par git. Puis, en simulant le
      clone frais — copier `iakaframe.json` seul dans un dossier vierge — `iakastart` **affiche la
      divergence**, **nomme la commande** qui la répare, et **n'écrit rien** : le dossier
      `.claude/agents/` est **toujours absent** après l'affichage. C'est ce test-là qui prouve
      qu'« ignorer » n'a pas rendu la décision inaccessible.
- [ ] **CA-24 (détecteur de fuite, gratuit)** *(ajouté le 2026-09-02)* — après une surcharge posée
      sur un projet, `cli/test/vitrine-methode.test.js` est **vert sans aucune régénération** de
      `methode-de-travail.html`, et `git status` ne montre ce fichier **ni modifié**. S'il rougit ou
      bouge, une surcharge de projet a atteint la portée globale : **échec**, et c'est la fuite que
      D5 est censée empêcher.

## Estimation (jalon P1→P2)

- **Équivalent jour-homme : 1,25 j** (≈ 9 à 10 h), **en plus** des 0,5 j du lot 1. Décomposition :
  extraction + module de conf ~1 h ; `effectiveModel` + substitution ~30 min ; les deux sous-verbes
  avec validation, projection et suppression ~2,5 h ; provenance dans le rendu ~45 min ; `iakastart`
  + divergence ~1 h ; `docs/commandes.md` + les trois aides ~45 min ; tests (≈ 20 critères) ~2,5 h ;
  recette + vendor-check + remise ~1 h.
- **Total des deux lots : ≈ 1,75 j** (2 j sous la posture P-D du lot 1).
- **Complexité : moyenne. Risque : moyen-haut.** Le code reste simple ; ce qui porte le risque est
  qu'on **écrit dans un fichier partagé avec un autre outil** (`iakaframe.json`, F2) et qu'on
  **exploite une précédence du runner** (F1) dont dépend le comportement de tous les agents du
  projet. Une erreur ici ne casse pas un test : elle fait tourner le mauvais acteur sous le mauvais
  modèle, silencieusement.
- **Inconnues susceptibles de faire glisser l'estimation** :
  1. ~~**A-3 (versionner ou non la projection).**~~ **INCONNUE LEVÉE le 2026-09-02** : tranché
     « ignorer ». Effet sur la charge : **+20 min** (étape 4bis, CA-25), déjà intégrés au chiffre
     ci-dessus. *Les trois arbitrages de ce chantier sont clos ; il ne reste plus, ci-dessous, que
     des inconnues techniques — celles qui se lèvent en mesurant, pas en demandant.*
  2. **L'état de la couture D7 du lot 1.** Si `generateAgent` a inliné sa résolution, CA-3 échoue et
     il faut rouvrir le lot 1 : **+1 h**, et une régénération de goldens de plus.
  3. **Le rituel `iakastart`.** S'il décrit lui aussi le roster, l'amendement double et la dérive de
     vendorage passe de +1 à +2 (CA-17). Non mesuré ici : c'est une **vérification** de l'étape 7,
     pas une hypothèse.
  4. **Le comportement d'écriture de la GUI sur `modelOverrides`.** `write_active_frame` préserve
     les clés inconnues d'après sa description ; **ce lot ne le mesure pas côté Rust**. CA-8 ne
     prouve que le côté CLI. Si la GUI s'avérait écraser, ce serait un lot de convergence à part
     entière — nommé ici, pas traité.
