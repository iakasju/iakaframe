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

> 🛑 **D6 EST RENVERSÉ SUR SON SECOND VOLET — décideur, 2026-09-02, énoncé mot pour mot :
> « echouer ».** L'avertissement de fond **devient un refus**. La garde de forme (premier volet,
> ci-dessous) est **inchangée**. Le texte d'origine de D6 est **conservé, daté, jamais effacé**
> (règle 4) — il dit ce qui a été livré au lot 2 et pourquoi. **Ce qui fait foi désormais :
> § Amendement A, en fin de fichier** (D6bis, D11 à D14). Ce renversement **ouvre un successeur**,
> il ne rouvre pas le lot 2, qui est **livré et fusionné** (`e2c54ba`, PASS Legolas).

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

---

# Amendement A — 2026-09-02 : `models set` REFUSE une valeur hors du vocabulaire connu

> Cadrage 🔵 Gandalf, 2026-09-02. **Successeur** du lot 2 (livré, fusionné, `e2c54ba`, PASS
> Legolas). **Amendement, pas nouveau cadrage** : tout ce qui précède reste vrai sauf le **second
> volet de D6**, explicitement daté ci-dessus. Rien n'est effacé (règle 4).

## A.0 — Déclencheur

Recette réelle du lot 2, dix points verts, **un seul remonté au décideur** :
`iakaframe models set gandalf pas-un-modele` **passe** — `ok: true`, exit `0`, contrat de projet
projeté portant `model: pas-un-modele`, accompagné du seul avertissement prévu par D6.

**Arbitrage du décideur, mot pour mot : « echouer ».** L'avertissement devient un refus.

## A.1 — Fait mesuré, et il retourne l'argument de D5

**F6 — le vocabulaire du champ `model:` d'un sous-agent, mesuré sur le web le 2026-09-02.**
Deux pages officielles, croisées :

*`code.claude.com/docs/en/sub-agents`, § « Choose a model », verbatim :*

> * **Model alias**: use one of the available aliases: `sonnet`, `opus`, `haiku`, or `fable`
> * **Full model ID**: use a full model ID such as `claude-opus-5` or `claude-sonnet-5`. Accepts
>   the same values as the `--model` flag
> * **inherit**: use the same model as the main conversation

*`code.claude.com/docs/en/model-config`, alias acceptés par `--model` / `/model`, mesurés le même
jour :* `default`, `best`, `fable`, `sonnet`, `opus`, `haiku`, **`sonnet[1m]`**, **`opus[1m]`**,
`opusplan` ; ids complets `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`, `claude-fable-5-1`,
`claude-haiku-4-5`, et leur **variante suffixée** `claude-opus-5[1m]`, `claude-sonnet-5[1m]`.

**🛑 Ce que cette mesure change, et c'est le cœur de l'amendement.** L'ensemble codé au lot 2 —
`{sonnet, opus, haiku, fable, inherit}` ∪ `claude-*` (`project-models.js:60` et `:79`) — n'est
**pas** une liste qui *se périmera un jour* : elle est **déjà incomplète au jour où elle est
écrite**. Elle rate le **suffixe `[1m]`**, qui n'est ni exotique ni futur — *c'est la forme sous
laquelle le runner nomme le modèle qui exécute ce cadrage même* (`claude-opus-5[1m]`). Sous la
décision « échouer » **appliquée telle quelle à la liste existante**, `models set gandalf opus[1m]`
serait **refusé alors que la valeur est bonne**.

Le motif de D5 (« une liste qui bloque se périme ») est donc **juste, et pire que ce qu'il
annonçait** : la péremption n'est pas un risque futur, c'est un **état constaté**. La conclusion
qu'on en tirait — *donc ne bloquons pas* — reste, elle, la mauvaise : elle échange un refus
réparable contre une écriture fausse et silencieuse. **On garde le diagnostic de D5, on inverse son
remède, et on paie le prix nommé en A.3.**

## A.2 — Décisions

> ### ✅ ARBITRAGES TRANCHÉS PAR LE DÉCIDEUR — 2026-09-02
>
> **Énoncé : « echouer »**, puis, sur la mesure F6 et la recommandation de cadrage : **« je te
> suis »**.
>
> - **La garde de vocabulaire devient BLOQUANTE** — un `models set` sur une valeur hors grammaire
>   **échoue** (`ok:false`, exit ≠ 0, **rien d'écrit**), au lieu d'écrire avec un avertissement.
> - **`--force` est retenu** : refus par défaut, écriture délibérée possible. Sans lui, la décision
>   n'aurait pas été prise — le cadrage la déconseillait explicitement.
> - **`best` / `default` / `opusplan` sont REFUSÉS par défaut**, comme recommandé : documentés pour
>   `--model`, **pas** pour un frontmatter de sous-agent, et `default` fait déjà ce que
>   `models unset` fait.
>
> ⚠️ **CE QUI A FAIT PENCHER LA DÉCISION — mesure F6, vérifiée aussi par le portefeuille** :
> `KNOWN_MODEL_VALUES` **est déjà fausse aujourd'hui**, elle rate le suffixe `[1m]`. Mesuré :
> `opus[1m]` et `sonnet[1m]` sont classés **INHABITUELS**, `claude-opus-5[1m]` passe (par le préfixe).
> **« Échouer » appliqué à la liste existante aurait refusé, dès le premier jour, la forme sous
> laquelle le runner nomme le modèle du décideur.** Le défaut n'était pas à venir : il était là,
> et l'avertissement était trop faible pour qu'on le voie.
>
> **Ce lot n'attend plus aucune décision.**

**D6bis — la garde de fond devient BLOQUANTE, et elle est réécrite sur la mesure F6, pas
reconduite.** Trois strates, dans cet ordre :

| Strate | Population | Conséquence |
|---|---|---|
| **1 — forme** (D6, volet 1, **inchangé**) | vide/blanche, espace, caractère de tête cassant le frontmatter | **refus**, `--force` **ne le lève pas** |
| **2 — vocabulaire** (D6bis) | hors de la grammaire ci-dessous | **refus** — levable par `--force` (D11) |
| **3 — id complet** | `claude-<...>` bien formé | **écrit**, avec **avertissement** (D13) |

Grammaire acceptée, dérivée de F6 et d'elle seule :

```
valeur := ( alias | id-complet ) suffixe?
alias      := sonnet | opus | haiku | fable | inherit
id-complet := claude-<[A-Za-z0-9._-]+>
suffixe    := "[1m]"
```

**Pourquoi `best`, `default` et `opusplan` sont REFUSÉS par défaut, et c'est délibéré.** Ils sont
documentés pour `--model`, **pas** pour le champ `model:` d'un sous-agent, dont la page ne nomme
que quatre alias + `inherit`. Et leur sémantique est étrangère à un contrat d'agent : `default`
*efface* une surcharge (c'est le geste `models unset`, déjà nommé), `opusplan` bascule selon le
**mode plan** de la session principale. Les refuser **en le disant** est plus honnête que de les
bénir sur une lecture large d'une phrase ambiguë — et `--force` les laisse atteignables pour qui
veut mesurer. **Inconnue assumée, cf. A.6-1.**

**Vérifié avant de recommander le suffixe `[1m]` — il traverse le rendu sans se déformer.**
`needsScalarQuote` ne quote que sur un **caractère de tête** ambigu (`frontmatter.js:209`,
`/^[[{"'#&*!|>%@\`,]/`) : `opus[1m]` commence par `o`, il sort donc **non quoté**
(`model: opus[1m]`), et `parseScalar` le relit **à l'identique** (`frontmatter.js:37-48` :
ni quote, ni mot-clé, ni entier → chaîne rendue telle quelle). En YAML de bloc, un crochet
**non initial** n'ouvre aucune séquence : le scalaire est plain et valide. Rien à quoter, rien à
échapper. **CA-29 le prouve par aller-retour, il ne le suppose pas.**

**D11 — la porte de sortie : `--force`, et c'est l'idiome DÉJÀ en place dans ce CLI.**
`models set <personaId> <modele> --force` **écrit quand même**, exit `0`, **en le disant**. Sans
porte, la liste devient un **mur** : le jour où un alias sort, le CLI **installé** — pas ce
checkout — refuse une valeur juste jusqu'à ce qu'une version soit publiée, et l'utilisateur est
bloqué au pire moment, sur une décision qui n'est même pas la sienne.

`--force` n'est pas un néologisme à instruire : c'est la **convention du dépôt**, « non destructif
(refus si la cible existe, sauf `--force`) » — `add.js:28`, `assemble.js:74`, `frame.js:162`,
`init.js:56`, `agents.js:25`. Même forme, même sens : **refus par défaut, écriture délibérée
possible**.

*Alternatives pesées et écartées.* **(a) Pas de porte du tout** — plus simple d'une option, et
c'est son seul mérite ; elle fait du CLI un obstacle le jour d'une sortie de modèle, et transforme
un refus d'une seconde en attente d'une release. **(b) Une liste extensible par variable
d'environnement ou par clé de conf** — écartée : elle crée une **seconde source de vérité** sur le
vocabulaire, exactement le `kits/*/MODELES.md` que ce dépôt a déjà démonté, pour un besoin que
`--force` couvre en un mot. **(c) `--force` levant AUSSI la garde de forme** — écartée : la garde
de forme refuse ce qui **ne peut pas** être une valeur (elle casserait le frontmatter rendu) ; il
n'y a rien à forcer, seulement un fichier à corrompre.

**D12 — la condition de chute est ÉCRITE DANS LE CODE, pas seulement ici.** Application directe de
la **clause 3 de la forme close de L44** (`re-cadrage-garde-latest.md:814-816`) : *« Chaque motif
nomme sa condition de chute — il dit ce qui, s'il était mesuré, le rendrait faux. Un motif sans
condition de chute est une exclusion de confort et compte comme non déclaré. »* Une liste qui
bloque **sans dire ce qui la rendrait fausse** est précisément la « garde muette » que ce dépôt
traque. Le cartouche est **prescrit**, au-dessus de la grammaire, dans `project-models.js` :

```js
// ⏳ CONDITION DE CHUTE (L44, clause 3) — ce que cette grammaire a de faux, et quand.
// MESUREE le 2026-09-02 sur code.claude.com/docs/en/sub-agents (§ « Choose a model ») et
// code.claude.com/docs/en/model-config. Elle DEVIENT FAUSSE des que le runner accepte, dans le
// champ `model:` d'un sous-agent, une valeur qu'elle refuse — typiquement un ALIAS NEUF.
// SE RE-MESURE : rouvrir ces deux pages et comparer leur liste d'alias a ce Set. Le fichier ne
// se re-mesure PAS tout seul : cette date est celle de la mesure, pas de la derniere lecture.
// SYMPTOME de peremption : `models set <persona> <alias>` REFUSE alors que le runner l'accepte.
// REMEDE IMMEDIAT (utilisateur, zero release) : --force. REMEDE DURABLE : ajouter l'alias ici
// AVEC la date de sa mesure.
// DELIBEREMENT ABSENTS (refuses, atteignables par --force) : `best`, `default`, `opusplan` —
// documentes pour `--model`, PAS pour un sous-agent ; et `default`/`opusplan` ont une semantique
// etrangere a un contrat (effacer une surcharge = `models unset` ; basculer selon le mode plan).
```

**D13 — la symétrie du signalement : l'avertissement NE DISPARAÎT PAS, il change de population.**
Il servait à couvrir « bien formé mais douteux » ; ce cas devient un refus. Il lui reste un cas
**résiduel et réel** : l'**id complet** (`claude-<...>`). La grammaire n'en vérifie que la
**forme** — le catalogue des ids bouge plus vite que celui des alias et **n'est pas vérifiable hors
ligne**. Un id complet est donc **écrit sans `--force`**, avec :

> `id complet non verifiable hors ligne : claude-xyz — ecrite ; verifier qu'elle est acceptee par le runner.`

Et sur `--force`, le message dit **qu'on a forcé** :

> `valeur hors du vocabulaire connu, ECRITE sur --force : <v> — verifier qu'elle est acceptee par le runner.`

Un alias de la strate 1 (`opus`, `sonnet[1m]`…) n'émet **aucun** avertissement. Résultat : **trois
sorties distinctes pour trois situations distinctes** — silence / avertissement / refus — au lieu
d'un avertissement unique qui disait la même chose de `claude-opus-5` et de `pas-un-modele`.

**D14 — rétrocompatibilité en LECTURE : `models` SIGNALE, il ne refuse pas et n'ignore pas.**
⚠️ C'est le cas qui mordra en premier : un `iakaframe.json` **déjà écrit** peut porter une valeur
hors grammaire — la recette du lot 2 en a produit un (nettoyé depuis, mais un autre poste peut en
porter, et le fichier est **versionné**).

Ce que fait `iakaframe models` à la lecture : il **affiche la valeur**, la marque, et **nomme les
deux gestes qui la réparent** (`models set <id> <valeur-juste> --path <projet>` ou
`models unset <id> --path <projet>`). **Aucune écriture, aucun exit non nul.**

Les deux autres branches sont **écartées, et pour des motifs qui se mesurent** :
- **Refuser à la lecture** — un état des lieux qui **échoue** à cause de ce qu'il devait diagnostiquer
  est inutilisable exactement quand on en a besoin. Contraire à la doctrine déjà écrite du dépôt :
  *« ces gardes CONSTATENT, elles ne réécrivent pas »* (D8), `vendor-check`, `agents generate --check`.
- **Ignorer / retomber sur le défaut de frame** — **le pire des trois**, parce qu'il **ment**. La
  projection sur le disque, elle, **porte bien la valeur** et c'est **elle** que le runner charge
  (F1). `models` afficherait donc un modèle que l'agent **n'utilise pas**. On aurait fabriqué, dans
  l'outil de diagnostic, la divergence même que D8 sert à révéler.

**Mécanique — on réemploie celle de D8, on n'en écrit pas une seconde.** Le signalement sort en
`unknownOverrides: [{ personaId, model, repair }]`, **frère exact** d'`overrideDivergences` : même
forme, même place dans le payload, même bloc imprimé sous le tableau, même doctrine de lecture
seule. **Aucun champ nouveau sur les lignes de persona** — `model`/`modelSource` restent tels
quels, donc la colonne « Modèle » d'`iakastart` (D9), qui en dérive, n'est **pas touchée**.

**D15 — la sortie `--json` du refus, sur le patron de la persona inconnue (D7).** Ce patron est le
bon modèle de message et il est déjà en place :

```json
{
  "ok": false,
  "error": "valeur inconnue : pas-un-modele — hors du vocabulaire accepte pour un sous-agent (sonnet, opus, haiku, fable, inherit, ou claude-<id>, suffixe [1m] optionnel) ; surcharge NON ecrite. Si la valeur est juste (alias recent), reecrire avec --force.",
  "personaId": "gandalf",
  "model": "pas-un-modele",
  "accepted": ["sonnet", "opus", "haiku", "fable", "inherit", "claude-<id>", "<valeur>[1m]"]
}
```

`process.exitCode = 1`, via `fail()` (`output.js:41`) — **aucun texte humain sur stderr en mode
`--json`** (règle 4 de C-JSON). Le message porte les **trois** choses qu'un message de refus doit
porter : ce qui est refusé, ce qui serait accepté, **et comment passer outre**.

## A.3 — Ce que ce renversement COÛTE, dit avant d'être payé

On échange un défaut **silencieux** (valeur fausse écrite sans bruit) contre un défaut **bruyant**
(valeur juste refusée). Le second est meilleur — il est visible, immédiat, et **réparable sans
release** grâce à D11 — mais **il n'est pas gratuit** :

1. **Le vocabulaire devient une charge d'entretien.** Chaque alias neuf exige une ligne de code et
   une publication. D12 rend la dette **visible** ; il ne la supprime pas.
2. **La liste part déjà incomplète au regard de `--model`** (A.1) : `best`/`default`/`opusplan`
   sont refusés **par choix**, pas par oubli — et un utilisateur qui les croit valides rencontrera
   un refus. Le message le dit et nomme `--force`.
3. **`--force` peut devenir un réflexe.** Un utilisateur qui le tape sans lire a réintroduit
   l'écriture silencieuse. *Mitigation* : le message forcé **le dit à chaque fois** (D13), et il
   n'y a **pas** de forme abrégée ni de variable d'environnement qui le rende permanent.

**Mon avis, puisqu'il est demandé : « échouer » est la bonne décision — appliquée à la bonne
liste.** L'appliquer à la liste du lot 2 serait une erreur nette : elle refuserait `opus[1m]`, une
valeur juste, dès le premier jour. C'est pour ça que cet amendement **réécrit** la grammaire sur la
mesure F6 au lieu de se contenter de changer un `warning:` en `blocking:`. Avec la grammaire
corrigée **et** `--force`, je recommande la décision **sans réserve**. Sans `--force`, je la
déconseille.

## A.4 — Ce que cet amendement NE renverse PAS (et les deux phrases devenues fausses)

**D5 du lot 1 n'est pas mort : il est BORNÉ, et il faut l'écrire là où il vit.** D5
(`affectation-modele-par-acteur.md:115-122`) régit la **projection d'une valeur de binding** :
`modelForPersona` rend la chaîne du binding **verbatim**, sans allowlist, et **cela reste vrai** —
c'est ce qui laisse le binding Ollama porter `qwen3.5:9b` et un binding tiers porter un alias que
le CLI ne connaît pas. Ce qui est gardé, c'est le **point d'entrée `models set`**, qui n'existait
pas quand D5 a été écrit (il est né avec le lot 2). Vérifié : `validateModelValue` n'a **qu'un
seul appelant**, `runModelsSet` (`models.js:800`).

⚠️ **Conséquence à ne pas manquer, et c'est une décision, pas un détail** : une valeur fausse
**écrite à la main dans un binding** passe toujours sans bruit. C'est **R-2 du lot 1, inchangé et
assumé** — hors périmètre ici. Nommé, pas caché.

**Deux phrases du dépôt deviennent fausses le jour où le code change, et une phrase fausse dans le
fichier d'une garde est exactement le piège que R-1 du lot 1 a documenté à ses dépens** (« j'ai
pris un commentaire de code pour une mesure »). Elles sont donc **au périmètre** :

- `cli/src/lib/generate-agents.js:104-105` — *« Aucune allowlist de valeurs (D5) : la chaîne du
  binding est projetée verbatim »*. Reste **vrai pour le binding**, mais lu seul il se généralise
  à tort. À **préciser** : « … verbatim. La voie `models set` est, elle, gardée depuis
  l'Amendement A. »
- `specs/instructions/affectation-modele-par-acteur.md`, sous **D5** — **une note datée**, ajoutée
  **sans rien effacer** (règle 4) : « **2026-09-02** — D5 vaut pour la **projection** d'une valeur
  de binding, et **seulement** pour elle. Le point d'entrée `models set` (lot 2) **refuse** depuis
  l'Amendement A de `surcharge-modele-par-projet.md`. » **Je n'ai PAS touché ce fichier** : la note
  est **prescrite** ici (étape 5, **CA-33**) pour être posée dans le même lot que le code, et vue
  par le décideur au même gate.

Restent **inchangés** : A-1/P-D, A-2, A-3, D1 à D5, D7 à D10, et tout le § Périmètre du lot 2.

## A.5 — Périmètre de l'amendement

- **Inclus** :
  - `validateModelValue` : grammaire F6, refus de strate 2, cartouche D12, avertissement D13 ;
  - `--force` sur `models set` (parseArgs, `SET_HELP`, `HELP`, sortie humaine et `--json`) ;
  - `unknownOverrides` en lecture (`models`, humain **et** `--json`), sur la mécanique de D8 ;
  - les **deux phrases** de A.4 (commentaire de code + note datée sous D5 du lot 1) ;
  - `docs/commandes.md` : `--force` (règle permanente, même lot) ;
  - **CA-14 réécrit** + tests neufs.
- **Exclu — liste fermée** :
  - **la voie binding** : `modelForPersona`, `renderAgentContract`, `generateAgent` ne gagnent
    **aucune** garde (D5 borné, A.4). Un dev qui met la grammaire dans le rendu casse le binding
    Ollama : c'est le contresens à ne pas faire.
  - `--force` sur la garde de **forme** (D11, alternative (c)).
  - `models unset`, la projection, le `.gitignore`, `iakastart` : **intouchés**.
  - `best`/`default`/`opusplan` **ne sont pas ajoutés** à la grammaire (D6bis).
  - Aucune allowlist d'**ids complets** (D13) : on garde la forme, jamais le catalogue.

## A.6 — Étapes

1. **Réécrire `validateModelValue`** (`cli/src/lib/project-models.js:55-84`) : garde de forme
   **inchangée** ; `KNOWN_MODEL_VALUES` → grammaire D6bis (alias + `claude-<id>` + suffixe `[1m]`
   optionnel sur les deux) ; **cartouche D12 au-dessus** ; rendre `{ blocking }` (forme),
   `{ unknown: <v> }` (strate 2), ou `{ ok, warning }` (strates 1 et 3). Trois retours distincts,
   pas un booléen surchargé.
2. **`--force` dans `runModelsSet`** (`models.js:760-838`) : `force: { type:'boolean',
   default:false }` ; `unknown` **sans** `--force` → `fail()` au patron D15, **rien écrit, rien
   projeté** ; `unknown` **avec** `--force` → écriture normale + `warning` D13 + `forced: true` au
   payload. La garde de **forme** reste **avant** et **au-dessus** de `--force`.
3. **`unknownOverrides` en lecture** : une fonction sœur de `divergentOverrides`
   (`project-models.js:94-115`) — même signature, même lecture seule, rendant
   `{ personaId, model, repair }` ; branchée dans `runModels` à côté d'`overrideDivergences`
   (`models.js:954`) et imprimée par `printState` sous le bloc existant (`models.js:426-432`).
   **Ne pas toucher `roleRows`.**
4. **Aides et doc** : `SET_HELP` (l'option **et** la grammaire acceptée), mention dans `HELP`,
   `docs/commandes.md`. Les trois textes doivent s'accorder (CA-33).
5. **Les deux phrases de A.4** : préciser `generate-agents.js:104-105` ; poser la **note datée**
   sous D5 de `affectation-modele-par-acteur.md` — **ajout seul, aucune suppression**.
6. **Tests** : CA-14 **réécrit** (voir l'encart) + CA-26 à CA-33, puis la recette ci-dessous.

## A.7 — Recette — commandes PINNÉES

```sh
CK=/Users/sjupin/work/iakaframe
PJ=/tmp/iaka-recette-amendement-a
IK="IAKAFRAME_HOME=$CK node $CK/cli/src/index.js"

cd "$CK/cli" && npm test

# refus (strate 2) — rien ecrit, rien projete, exit 1
env IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" models set gandalf pas-un-modele --path "$PJ" --json ; echo "exit=$?"
ls "$PJ/.claude/agents/" 2>/dev/null ; cat "$PJ/iakaframe.json" 2>/dev/null

# la porte de sortie — ecrit, le dit, exit 0
env IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" models set gandalf pas-un-modele --force --path "$PJ" --json ; echo "exit=$?"

# le faux refus que l'amendement EVITE — doit PASSER sans --force
env IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" models set gimli 'opus[1m]' --path "$PJ" --json
grep -n '^model:' "$PJ/.claude/agents/gimli.md"

# retrocompat en LECTURE : la valeur forcee est SIGNALEE, jamais ignoree, jamais bloquante
env IAKAFRAME_HOME="$CK" node "$CK/cli/src/index.js" models --path "$PJ" --json --timeout 1 ; echo "exit=$?"
```

⚠️ `opus[1m]` **se met entre quotes dans le shell** (les crochets sont un motif de globbing). Un
`models set gimli opus[1m]` nu peut être avalé par le shell avant d'atteindre le CLI — ce n'est
**pas** un défaut du lot, et il faut le savoir avant de conclure à un bug.

## A.8 — Fichiers concernés

- `cli/src/lib/project-models.js` — **cœur** : grammaire D6bis, cartouche D12, avertissement D13,
  `unknownOverrides`.
- `cli/src/commands/models.js` — `--force`, refus D15, `SET_HELP`/`HELP`, `printState` + payload.
- `cli/src/lib/generate-agents.js` — **commentaire l.104-105 précisé, code INCHANGÉ** (A.4).
- `specs/instructions/affectation-modele-par-acteur.md` — **note datée sous D5**, ajout seul (A.4).
- `docs/commandes.md` — `--force`.
- `cli/test/project-models.test.js` — CA-14 réécrit (→ CA-26) + CA-27 à CA-35.
- **Non modifiés, et c'est le sujet** : `bindings/*.md`, `library/skills/iakastart/SKILL.md`
  (donc **aucune ligne de vendorage ajoutée**, `drift: 0` attendu inchangé — **CA-35**),
  `cli/src/lib/frame-active.js`, `models/suggestions.json`, `roleRows`, `methode-de-travail.html`.

## A.9 — Risques

- **RA-1 — la grammaire refuse un alias juste.** C'est le prix nommé en A.3. *Mitigation* :
  `--force` (D11), message qui le nomme (D15), cartouche qui dit comment la réparer durablement
  (D12). *Résidu assumé* : un utilisateur qui ne lit pas le message reste bloqué le temps de le
  lire.
- **RA-2 — la garde migre par erreur dans le rendu.** Un dev pressé la met dans
  `renderAgentContract` ou `modelForPersona` : le binding **Ollama** cesse alors de projeter, et
  **CA-6 du lot 1** rougit. *Mitigation* : A.4 + § Exclu l'interdisent nommément ; **CA-30** le
  mesure par le binding Ollama lui-même.
- **RA-3 — CA-14 doit être RÉÉCRIT, et c'est contraire au réflexe du dépôt.** La règle
  permanente est *« ne jamais modifier un test pour accommoder le code »*. Ici, **le test mesure
  fidèlement un comportement que le décideur a renversé** : le réécrire **est** le lot, pas un
  contournement. *Mitigation* : il est réécrit **explicitement, en encart daté**, jamais supprimé
  (CA-26), et le compte global de tests reste **strictement croissant** (**CA-35**).
- **RA-4 — `--force` devient un réflexe.** *Mitigation* : D13 (message à chaque écriture forcée),
  et **aucune** forme permanente (ni variable d'environnement, ni clé de conf) — D11 (b).
- **RA-5 — le suffixe `[1m]` casse un golden ou un parseur.** *Mitigation* : mesuré avant
  recommandation (A.2, `frontmatter.js:209` et `:37-48`) et **prouvé** par CA-29 en aller-retour.
  Aucun golden ne porte de suffixe : les dix contrats déployés sont en `opus`/`sonnet` nus.

## A.10 — Critères d'acceptation

> **CA-14 est RÉÉCRIT** *(2026-09-02, décision « echouer »)*. Rédaction d'origine, **conservée
> comme trace** : « valeur **inhabituelle mais bien formée** (`sonnnet`) : **écrite**, exit `0`,
> avec l'avertissement. » Elle mesurait fidèlement D6 ; D6 est renversé, donc elle mesure
> désormais le mauvais comportement. Elle est **remplacée par CA-26**, pas supprimée.

- [ ] **CA-26 (ex-CA-14, réécrit)** — `models set gimli sonnnet` : **exit ≠ 0**, `ok:false`,
      message nommant la valeur, le vocabulaire accepté **et** `--force` ; `iakaframe.json`
      **inchangé à l'octet** et `<projet>/.claude/agents/gimli.md` **non créé**.
- [ ] **CA-27 (la porte de sortie)** — `models set gimli sonnnet --force` : **exit `0`**,
      `warning` présent **et disant qu'on a forcé**, `forced: true`, surcharge écrite **et**
      contrat projeté portant `model: sonnnet`.
- [ ] **CA-28 (le faux refus évité — le critère qui justifie la réécriture de la grammaire)** —
      `models set gimli 'opus[1m]'` **sans `--force`** : exit `0`, **aucun avertissement**.
      Idem pour `sonnet`, `opus`, `haiku`, `fable`, `inherit`, `claude-opus-5`,
      `claude-opus-5[1m]`. *Sous la liste du lot 2, `opus[1m]` aurait été refusé : c'est le
      régression-test de A.1.*
- [ ] **CA-29 (aller-retour du suffixe)** — le contrat projeté porte **`model: opus[1m]` non
      quoté**, et sa relecture par le parseur du dépôt rend **exactement** `opus[1m]`
      (ni `opus`, ni `opus[1m]` re-quoté, ni tableau).
- [ ] **CA-30 (la garde ne fuit PAS dans le rendu)** — `generateAgent` sur
      `bindings/iakaframe-ollama-default.md` se comporte **exactement** comme avant :
      **CA-6 du lot 1 passe sans qu'une de ses lignes soit modifiée**. Et
      `grep -n 'validateModelValue' cli/src/` ne rend **qu'un seul appelant** : `models.js`.
- [ ] **CA-31 (avertissement résiduel, D13)** — `models set gandalf claude-inexistant-9` **sans
      `--force`** : exit `0`, écrit, avec un avertissement **distinct** de celui de `--force` et
      mentionnant l'**id complet non vérifiable hors ligne**. `claude-opus-5` **n'émet aucun**
      avertissement.
- [ ] **CA-32 (rétrocompat en LECTURE, D14 — le cas qui mord en premier)** — sur un projet dont
      l'`iakaframe.json` porte `modelOverrides.gandalf = "pas-un-modele"` (posé à la main, comme
      un clone d'un poste tiers) : `iakaframe models --json` **sort en `0`**, rend
      `unknownOverrides` contenant `gandalf` avec sa valeur **et** une commande de réparation ;
      la ligne de `gandalf` continue de porter `model: "pas-un-modele"` et
      `modelSource: "projet"` — **elle n'est NI ignorée NI remplacée par le défaut de frame** ;
      et **rien n'a été écrit** (`iakaframe.json` inchangé à l'octet, `.claude/agents/` inchangé).
- [ ] **CA-33 (les deux phrases de A.4)** — le commentaire `generate-agents.js:104-105` **borne**
      explicitement D5 à la voie binding, et `affectation-modele-par-acteur.md` porte **sous D5**
      une note **datée du 2026-09-02** renvoyant à l'Amendement A. **Aucune ligne supprimée** dans
      ce second fichier (`git diff --stat` : **additions seules**).
- [ ] **CA-34 (aides et doc d'accord)** — `models set --help`, `iakaframe models --help` et
      `docs/commandes.md` documentent `--force` **et** le vocabulaire accepté, dans les **mêmes
      termes**.
- [ ] **CA-35 (le filet global)** — `cd cli && npm test` sort en `0`, compte de tests
      **strictement supérieur** à celui d'après le lot 2, **aucun test supprimé** (CA-14 est
      **réécrit**, pas retiré) ; `vendor-check --root <CK> --json` reste à **`drift: 0`** — cet
      amendement ne touche **aucun** fichier vendoré.

## A.11 — Estimation (jalon P1→P2)

- **Équivalent jour-homme : 0,6 j** (≈ 4 h 30). Décomposition : grammaire + cartouche D12
  ~45 min ; `--force` + refus D15 + aides ~45 min ; `unknownOverrides` (lecture + payload +
  impression) ~1 h ; les deux phrases de A.4 ~15 min ; tests (CA-26 → CA-35, dont un réécrit)
  ~1 h 15 ; recette pinnée + remise ~30 min.
- **Cumul du chantier : ≈ 2,35 j** (0,5 lot 1 + 1,25 lot 2 + 0,6 ici).
- **Complexité : faible. Risque : moyen-faible.** Le code est court et local — un module, une
  commande. Le risque n'est pas d'écrire faux, c'est **d'écrire au mauvais endroit** : la même
  grammaire posée dans le rendu au lieu du point d'entrée casserait la voie binding (RA-2), et
  c'est le seul geste de ce lot qui ne se rattrape pas par un message.
- **Inconnues susceptibles de faire glisser l'estimation** :
  1. **`best` / `default` / `opusplan` / `sonnet[1m]` dans un frontmatter de sous-agent.** La doc
     nomme quatre alias pour la voie « alias » et délègue à `--model` pour la voie « id complet » :
     **la phrase est ambiguë et je ne l'ai pas levée** — elle ne se lève pas en relisant, mais en
     **lançant** un sous-agent portant la valeur. Coût si le décideur veut la certitude : **+15 min**
     de mesure, et **+15 min** si la mesure élargit la grammaire. *En attendant, `--force` rend
     l'inconnue non bloquante : c'est précisément ce pour quoi la porte existe.*
  2. **La forme de retour de `validateModelValue`.** Elle passe de deux cas à trois ; si des
     appelants non recensés apparaissaient, +30 min. **Mesuré, pas supposé** : un seul appelant
     aujourd'hui (`models.js:800`) — l'inconnue est **basse**, elle est nommée par prudence.
  3. **`unknownOverrides` dans le rendu humain.** Si le bloc de D8 et celui-ci se recouvrent
     visuellement sur un projet portant **les deux** défauts, il faudra les ordonner et les
     distinguer : **+20 min**, cosmétique.
