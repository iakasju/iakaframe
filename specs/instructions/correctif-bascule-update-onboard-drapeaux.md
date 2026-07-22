# Correctif — la bascule `update` ↔ `onboard` perd les drapeaux (dont `--no-push`)

> Cadrage P1. Origine : incident du 2026-07-21 — `iakaframe update --no-push` a **créé et poussé**
> le dépôt `sjupin/c8repo` sur la forge du décideur (créé à `2026-07-21T18:58:13Z`, supprimé depuis
> par Odin : `DELETE 204`, `GET 404`).

## Outillage du cadreur (déclaration)

**`Bash` INDISPONIBLE.** Ce cadrage a été mené avec `Read` / `Grep` / `Glob` uniquement :
lecture du code, du `.git/HEAD`, des scripts PS et du `package.json`. En conséquence :

- **aucune commande n'a été exécutée** — ni `git`, ni `npm test`, ni `iakaframe` ;
- les baselines citées dans le brief (`425/424/0/1`, `vendor-check clean`) sont **reprises telles
  quelles, non revérifiées** par moi. Elles restent à la charge du gate ;
- toutes les affirmations ci-dessous sont **des constats de lecture de fichiers**, traçables au
  `chemin:ligne`.

---

## 0. Faits du brief corrigés ou nuancés

Trois rectifications, toutes vérifiables.

### 0.1 — Le dépôt n'est PAS sur `main` `62f012a` ; les numéros de ligne cités sont ceux de la branche scrub

`/Users/sjupin/work/iakaframe/.git/HEAD` contient :

```
ref: refs/heads/feat/outillage-scrub-miroir-frame
```

Le brief situe la cause racine à `cli/src/commands/update.js:57`. **C'est exact sur la branche
actuellement sortie**, pas sur `main`. Le bloc `warnFrameLeak` (l. 11-34) et l'`import
{ verifyFrame }` (l. 5) appartiennent au **lot scrub en cours**, soit ~30 lignes insérées **au-dessus**
du routage. Sur `62f012a`, le même `return runOnboard([...])` se trouve donc **autour de la l. 27**,
pas 57.

**Conséquence pratique** : ne pas écrire de critère d'acceptation qui référence un numéro de ligne.
Les critères ci-dessous référencent des **symboles** (`runUpdate`, `runOnboard`) et des
**comportements observables**. Le défaut lui-même est **identique sur les deux branches** — le lot
scrub ne touche pas le routage.

### 0.2 — La perte de drapeaux est BIDIRECTIONNELLE, pas unidirectionnelle

Le brief ne décrit que `update → onboard`. Le miroir existe et est tout aussi actif :

`cli/src/commands/onboard.js:45` — quand un dépôt existe déjà sur Forgejo **et** qu'il y a un git
local :

```js
return runUpdate(['--path', root, '--repo', repo]);
```

Donc **`iakaframe onboard --no-push` sur un dépôt déjà présent sur la forge pousse aussi**, par le
même mécanisme, avec le même silence. C'est un **second chemin de fuite à effet externe** — moins
grave (pas de création de dépôt, le remote existe déjà) mais réel : il pousse des commits que
l'utilisateur avait demandé de ne pas pousser. Le périmètre doit couvrir **les deux sens**.

### 0.3 — Le routage n'est PAS déclenché par une erreur réseau (la crainte n°4 du brief est largement infirmée)

`cli/src/lib/forgejo.js:31-40` distingue **trois** états, ce que le brief supposait binaire :

```js
// true (existe) | false (404) | null (inconnu : pas de token / reseau)
```

- réseau HS ou token absent → `catch { return null }` / `if (!t) return null` ;
- statut non-404 non-ok (401, 403, 500…) → `return null` ;
- **seul un 404 franc** renvoie `false`.

Or `update.js` teste `if (exists === false || !gitExists)`. **`null` ne déclenche donc pas la
bascule.** Une panne réseau sur un dépôt normalement suivi ne provoque **aucune** création de dépôt :
`update` poursuit son chemin nominal. La conception est ici **déjà correcte** et mérite d'être
protégée par un test de non-régression plutôt que corrigée.

**Ce qui reste vrai en revanche** : la seconde branche de la disjonction, `!gitExists`, déclenche la
bascule **inconditionnellement**, indépendamment du réseau. C'est ce chemin-là qui a produit
l'incident (répertoire jetable sans `.git`). Il est **déterministe**, ce qui est une bonne nouvelle :
il est reproductible en test.

---

## 1. Problème (posé avant toute solution)

Deux défauts distincts se superposent. Les confondre conduirait à un correctif incomplet.

**Défaut A — la frontière `argv` reconstruite à la main.** Quand une commande en appelle une autre,
elle ne transmet pas l'intention de l'utilisateur : elle **réécrit une ligne de commande neuve** à
partir de deux valeurs (`--path`, `--repo`). Tout le reste de ce que l'utilisateur a demandé est
**perdu sans trace**. Ce n'est pas un oubli ponctuel de `--no-push` : c'est une frontière qui **perd
par construction** tout ce qu'on ne pense pas à y recopier, et qui perdra de même le prochain
drapeau ajouté.

**Défaut B — la garantie affichée n'est pas tenue, et le silence l'aggrave.** `onboard.js:92`
n'affiche `push ignore.` que si le drapeau lui est parvenu. En bascule il ne l'est pas : l'utilisateur
voit donc un **push réussi**, sans le moindre signal que sa demande a été jetée. Une protection qui
échoue **silencieusement** est pire qu'une protection absente : l'absence se remarque.

**Pourquoi c'est sérieux ici alors que ça ne le serait pas ailleurs.** `update` sur un dépôt connu
pousse sur un remote **qui existe déjà** — l'effet est borné et réversible. `update` **en bascule
crée un dépôt distant** : c'est l'acte le plus lourd de toute la commande, **le seul cas où
`--no-push` protège réellement**, et c'est précisément celui où le drapeau est perdu. La protection
est absente là où elle est la plus nécessaire.

---

## 2. Mesure — inventaire complet des drapeaux perdus

### 2.1 Ce que chaque commande déclare

| Commande | Drapeaux déclarés | Réf. |
|---|---|---|
| `update` | `path`, `reason` (déf. `manual`), `version`, `note`, `message`, `repo`, `no-push`, `home` | `update.js` `parseArgs` |
| `onboard` | `path`, `node`, `target`, `repo`, `description`, `version` (déf. `v0.1.0`), `skip-forgejo`, `no-push`, `force`, `umbrella`, `init-projects`, `dashboard-source` | `onboard.js` `parseArgs` |

### 2.2 Sens `update → onboard` — transmis : `--path`, `--repo`. Tout le reste est jeté

| Drapeau | `onboard` sait-il le lire ? | Verdict |
|---|---|---|
| `--no-push` | **OUI** (déclaré, honoré à `onboard.js:92`) | 🔴 **PERTE FRANCHE — cause de l'incident** |
| `--version` | **OUI** (déclaré, utilisé pour le snapshot) | 🔴 **PERTE FRANCHE** — la version demandée est remplacée par le défaut `v0.1.0`, silencieusement |
| `--reason` | non | 🟠 jeté — `onboard` force `reason:'version'` |
| `--note` | non | 🟠 jeté — `onboard` force `note:'onboarding initial'` |
| `--message` | non | 🟠 jeté — `onboard` a ses propres messages de commit |
| `--home` | non | 🟠 jeté — `onboard` appelle `doSnapshot` **sans** `home`, alors que `update` le passe |

Deux pertes franches, pas une. **`--version` n'avait pas été relevé** : un utilisateur qui lance
`update --version v2.3.0` sur un répertoire sans git obtient un état des lieux estampillé `v0.1.0`.
Silencieux, et faux.

Les quatre `🟠` relèvent d'un **désaccord de sémantique**, pas d'un bug de recopie : `onboard` n'a
pas de notion de « raison » ni de « message » — il *est* l'événement fondateur. Les recopier
mécaniquement n'aurait pas de sens ; il faut **décider** (cf. § 4.3).

### 2.3 Sens `onboard → update` — transmis : `--path`, `--repo`

| Drapeau | `update` sait-il le lire ? | Verdict |
|---|---|---|
| `--no-push` | **OUI** (honoré `update.js:73`) | 🔴 **PERTE FRANCHE** — cf. § 0.2 |
| `--version` | **OUI** | 🔴 **PERTE FRANCHE** |
| `--skip-forgejo` | **NON DÉCLARÉ par `update`** | 🔴 **inexprimable** — cf. § 2.4 |
| `--node`, `--target`, `--description`, `--force`, `--umbrella`, `--init-projects`, `--dashboard-source` | non | ⚪ jet **légitime** — sans objet pour un checkpoint |

### 2.4 `--skip-forgejo` : réponse à la question du brief

**`update` ne le déclare pas.** Conséquence exacte : sur le chemin `update`, un utilisateur **ne peut
pas exprimer** « ne touche pas à la forge ». Et comme `parseArgs` est en mode strict par défaut,
`update --skip-forgejo` **échoue en erreur d'option inconnue** — au moins le refus est bruyant, ce
qui est le bon comportement par défaut. À arbitrer : faut-il l'ajouter à `update` (cf. § 4.4) ?

### 2.5 Autres reconstructions d'`argv` — recherche exhaustive

Recherche `run[A-Z]\w*\(\[` et `await import(` sur `cli/src/` — **4 occurrences, aucune autre
famille** :

| Site | Verdict |
|---|---|
| `update.js` → `runOnboard(['--path', root, '--repo', repo])` | 🔴 défectueux |
| `onboard.js` → `runUpdate(['--path', root, '--repo', repo])` | 🔴 défectueux |
| `onboard.js:54` → `runInit(['--path', root, '--node', node, ...force])` | ✅ **sain** — passe bien tout ce qu'`init` sait lire |
| `onboard.js:163` → `runInit([...])` (umbrella) | ✅ sain (amorçage volontairement minimal) |

**Le motif ne se répète donc pas ailleurs.** Le périmètre reste borné aux deux bascules mutuelles.
`runInit` est appelé de la même manière mais **sans perte** : la reconstruction manuelle est fragile,
elle n'est pas fatale en soi. C'est un argument à peser au § 4.1.

### 2.6 Les scripts PowerShell portent le **même** défaut — en pire

Les fichiers JS se déclarent « Iso PS ». La parité est ici **conservée dans le défaut** :

- `iakaframe-update.ps1:48` → `& iakaframe-onboard.ps1 -Path $Path -Repo $Repo` — **`-NoPush` perdu**,
  identique au JS ;
- `iakaframe-onboard.ps1:126` → `& iakaframe-update.ps1 -Path $Path` — **`-NoPush` ET `-Repo` perdus**.
  Le `-Repo` disparu est un défaut *supplémentaire* absent du JS : le dépôt sera redéduit du nom de
  répertoire, qui peut différer.

Ces scripts sont le *power-path Windows* legacy. Leur inclusion est un arbitrage (§ 4.5), pas une
évidence.

### 2.7 Dettes ouvertes : constat

- **`vendor-check` n'est pas menacé.** `cli/src/lib/vendor.js:77-115` ne vendore que des `.md`
  (8 personas + 8 goldens + 1 binding + 4 dérivées : méthode, méthode wrapped, team, kit).
  **Aucun fichier `.js` n'est dans la table de fixtures.** Modifier `update.js`, `onboard.js` ou
  `forgejo.js` ne peut donc pas faire dériver `vendor-check`. Le rappel « `--root` = le canon » reste
  valable pour l'exécution du gate, mais ce lot ne présente aucun risque de ce côté.
- `memory.js`, `TARGETS`, `principleIds`, `cadence.close_on` : **hors périmètre**, aucun n'est touché
  par ce lot.
- **Documentation** : `cli/src/index.js:52` documente `update` avec `--path --reason --version --note
  --message --no-push` mais **omet `--repo` et `--home`**, pourtant déclarés. Écart mineur préexistant,
  à corriger dans le même lot puisqu'on touche à la surface des drapeaux d'`update`.

---

## 3. Recouvrement avec le lot scrub en cours — **RÉEL, et à traiter**

`feat/outillage-scrub-miroir-frame` est **la branche actuellement sortie** et modifie `update.js` :
`import { verifyFrame }` (l. 5) + fonction `warnFrameLeak` (l. 11-34) + son appel (l. 64). Ce lot-ci
doit modifier `update.js` **dans la fonction `runUpdate`, au bloc de routage**.

**Verdict : les deux lots ne se recouvrent pas *textuellement*.** Le scrub agit **au-dessus** de
`runUpdate` (import + fonction module-level) et à **l'intérieur** du corps nominal (l. 64, après le
routage) ; ce lot-ci agit sur le **bloc de routage** (l. 49-58). Aucune ligne commune. Un merge
git devrait passer sans conflit.

**Mais deux écrivains sur un fichier restent la classe de défaut qu'on traite.** Prescription :

- **G1 — sérialiser, ne pas paralléliser.** Ce lot est **branché sur `main` `62f012a`**, jamais sur la
  branche scrub. Les deux lots ne sont **pas développés simultanément** : le scrub est en gate FAIL
  avec 5 correctifs en attente de Gimli — il **passe son gate d'abord**, ou bien ce lot-ci part de
  `main` et le scrub rebase ensuite. **Le décideur tranche l'ordre** (§ 5).
- **G2 — décalage de lignes assumé.** Quel que soit l'ordre, le second à merger verra ses numéros de
  ligne bouger. C'est sans effet si les critères visent des **symboles**, ce qu'ils font ici (§ 0.1).
- **G3 — au gate, `git diff --stat` sur `update.js` ne doit montrer que le routage** (et la surface
  `parseArgs` si § 4.4 est retenu). Toute apparition de `warnFrameLeak` / `verifyFrame` dans le diff
  de **ce** lot signe une contamination de branche → **FAIL immédiat**.

---

## 4. Arbitrages

### 4.1 Le correctif minimal suffit-il ? — **NON, mais pas pour la raison attendue**

L'option minimale (recopier `--no-push` et `--version` aux deux bascules) est **correcte,
immédiate et à risque quasi nul**. La tentation est de la rejeter au motif qu'« un argv reconstruit
à la main est fragile par nature ». **Cet argument est plus faible qu'il n'y paraît**, et je le
retourne d'abord : `runInit` est appelé exactement de la même façon **sans jamais rien perdre**
(§ 2.5). Le motif n'est donc pas fatal en soi ; il l'est devenu ici parce que la surface de `update`
a grandi (`--home` est récent) sans que les sites d'appel suivent. C'est un défaut de **maintenance
couplée**, pas de paradigme.

Cela dit, **le minimal ne suffit pas** — pour une raison indépendante, et c'est elle qui doit
emporter la décision : **il laisse la protection dépendre d'un drapeau**. Après correctif minimal,
`update` **sans** `--no-push` dans un répertoire jetable **crée toujours un dépôt distant**, sans
confirmation. Or l'incident n'est pas d'abord « un drapeau a été perdu » : c'est **« un verbe de
sauvegarde a créé une ressource externe »**. Réparer la propagation répare le symptôme du jour et
laisse la classe entière ouverte.

**Recommandation : la propagation (nécessaire) *plus* une garde indépendante des drapeaux
(suffisante).** Voir 4.2. Je **ne recommande pas** le refactor complet vers un passage
d'objet d'options (`onboard(opts)` au lieu de `runOnboard(argv)`) : plus propre en théorie, il
touche la signature de fonctions exportées, donc leur surface de test, pour un gain que la garde de
4.2 rend marginal. **Sur-ingénierie au regard du MVP d'abord.** À reconsidérer si un troisième site
d'appel apparaît.

### 4.2 Une garde indépendante des drapeaux ? — **OUI, et voici le point de coupe**

Question du décideur : *la bascule devrait-elle refuser de créer un dépôt distant sans confirmation
explicite, quels que soient les drapeaux ?*

**Contre.** Une confirmation systématique **casserait l'onboarding en lot**, que le décideur utilise
réellement (`onboard --umbrella --init-projects`, onboarding des 29 dépôts). Une garde qui empêche
de travailler est une garde qu'on désactive — le raisonnement est déjà écrit noir sur blanc dans
`update.js:14-18` à propos de `warnFrameLeak`, et il est juste.

**Pour.** Créer un dépôt sur une forge distante est un acte **externe, visible par des tiers, et non
réversible par l'outil** (Legolas a eu raison de refuser la suppression : c'est un acte destructif
réservé à l'humain). Cela relève bien de la classe « toute action vraiment destructive : demander
confirmation ».

**Le point de coupe qui satisfait les deux : l'intention est portée par le verbe que l'humain a
tapé.**

- `onboard` **invoqué directement** = l'utilisateur a demandé un onboarding. Créer un dépôt est
  **l'objet même du verbe**. → création autorisée, **aucune confirmation**, batch intact.
- `onboard` **atteint par bascule depuis `update`** = l'utilisateur a demandé un **checkpoint**.
  Créer un dépôt distant **dépasse ce qu'il a demandé**. → création **refusée par défaut**, sauf
  autorisation explicite.

Cette coupe est exacte : elle ferme le chemin de l'incident (c'était précisément une bascule) et
**ne touche à aucun usage direct d'`onboard`**. L'automatisation en lot n'est pas affectée du tout.

Mise en œuvre : `update` transmet à `onboard` un marqueur d'origine (p. ex. `--from-update`, ou un
paramètre interne non exposé en CLI) ; `onboard` refuse `createRepo` si ce marqueur est présent et
qu'aucune autorisation explicite n'est donnée.

### 4.3 Les drapeaux au sens ambigu (`--reason`, `--note`, `--message`, `--home`)

Recopier mécaniquement `--reason`/`--note`/`--message` vers `onboard` n'a pas de sens : `onboard`
*est* l'événement fondateur, il a ses propres libellés. **Recommandation : ne pas les propager, mais
ne plus les jeter en silence** — les nommer dans le message de bascule (« les options `--reason`,
`--note` ne s'appliquent pas à un onboarding et sont ignorées »). Le silence est le vrai défaut ;
l'ignorance déclarée est acceptable.

**`--home` est un cas à part et doit, lui, être propagé.** Ce n'est pas une option de confort :
il détermine **où le snapshot est écrit**. `update` le passe à `doSnapshot` ; `onboard` appelle
`doSnapshot` sans lui. Le perdre, c'est écrire l'état des lieux **au mauvais endroit** —
silencieusement. Il rejoint donc `--no-push` et `--version` dans les pertes à corriger, ce qui porte
le compte à **trois**.

### 4.4 `--skip-forgejo` sur `update`

**Recommandation : l'ajouter à `update`**, sémantique « n'interroge pas la forge, ne crée rien, ne
pousse rien ». Coût faible, cohérence de surface gagnée, et il donne à l'utilisateur un moyen
**explicite** d'exprimer sur le chemin `update` ce qu'il ne peut aujourd'hui pas dire. **Décision au
décideur** : c'est un élargissement de surface CLI, pas une correction de défaut — recevable de le
sortir du lot pour rester strictement correctif.

### 4.5 Les scripts PowerShell

Trois options : (a) corriger PS en parité stricte ; (b) laisser PS tel quel ; (c) laisser PS et y
inscrire un avertissement de défaut connu. **Recommandation : (a) si — et seulement si — les `.ps1`
sont encore un chemin d'exécution vivant.** Ils portent le même défaut à effet externe, et une parité
« iso PS » revendiquée en en-tête de fichier mais fausse est un piège pour le prochain lecteur. Mais
la mémoire du portefeuille indique que le CLI Node est la voie cross-OS et le `.ps1` un power-path
Windows en retrait. **Fait non mesurable par moi** (pas de `Bash`, donc pas d'historique git sur ces
fichiers) : **question au décideur** (§ 5).

### 4.6 Comportement headless — le défaut doit être le sûr

Une confirmation interactive est impossible en CI ou sous agent. Sur le **chemin de bascule**
uniquement :

- **non-interactif** (`!process.stdout.isTTY`, ou `CI`/`IAKA_NON_INTERACTIF`) → **REFUS**. Sortie
  non nulle, message explicite indiquant le geste explicite à poser (`iakaframe onboard --path …`).
  **Refuser, jamais passer** : c'est très exactement le mode dans lequel Legolas opérait.
- **interactif** → demander confirmation `o/N`, **défaut = non**.
- **autorisation explicite** (p. ex. `--autoriser-creation-depot`) → passer sans demander, dans les
  deux modes. C'est l'échappatoire qui rend la garde acceptable plutôt que contournée.

Le refus doit **rester local** : structure et commits déjà faits sont conservés, seule la **création
distante** est refusée.

---

## 5. Questions laissées au décideur (à trancher avant P2)

1. **Garde de bascule (§ 4.2)** : retenir le point de coupe « intention portée par le verbe » ?
   *Recommandation : oui.*
2. **Ordre vis-à-vis du lot scrub (§ 3)** : ce lot part-il de `main` `62f012a` maintenant (scrub
   rebase ensuite), ou attend-il que le scrub passe son gate ? *Recommandation : partir de `main`
   maintenant — l'incident est à effet externe, le scrub est en FAIL avec 5 correctifs en attente.*
3. **`--skip-forgejo` sur `update` (§ 4.4)** : dans ce lot, ou lot séparé ?
4. **PowerShell (§ 4.5)** : les `.ps1` sont-ils encore vivants ? Si oui → parité stricte à inclure,
   ce qui change l'estimation.

---

## 6. Périmètre fermé

### Dans le périmètre

- `cli/src/commands/update.js` — bloc de routage : propagation + garde + message.
- `cli/src/commands/onboard.js` — bloc de routage (l. 39-47) : propagation ; réception du marqueur
  d'origine et refus de `createRepo`.
- `cli/src/index.js` — bloc `HELP` de `update` (§ 2.7).
- `cli/test/` — nouveau fichier de test + faux serveur de forge local.
- `cli/src/commands/onboard.js` (§ 4.5) et les deux `.ps1` **seulement si** la question 4 est
  tranchée « oui ».

### Hors périmètre — explicitement

- `cli/src/lib/frame.js`, `cli/src/commands/frame.js`, `frames/releases/` → **lot scrub**.
- `cli/src/lib/forgejo.js` : **ne pas modifier**. Sa sémantique `true|false|null` est **correcte**
  (§ 0.3) et devient une dépendance de la garde. On la **teste**, on ne la touche pas.
- `memory.js`, `TARGETS`, `principleIds`, `cadence.close_on`, `vendor-check` et ses fixtures.
- Le refactor vers un passage d'objet d'options (§ 4.1).
- Toute suppression de dépôt sur la forge : **geste humain**, jamais outillé.

---

## 7. Critères d'acceptation

Numérotés, vérifiables. **C1 est le cas de défaut central : il DOIT échouer sur `62f012a`.**

### Cas de défaut

- **C1 — cas de défaut central.** Dans un répertoire temporaire **sans `.git`**, avec une **fausse
  forge locale** (§ 8) répondant `404` sur `GET /api/v1/repos/:user/:repo` : exécuter `update
  --no-push --path <tmp>`. Vérifier **(a)** aucune requête `POST /api/v1/user/repos` n'est parvenue
  à la fausse forge ; **(b)** aucun `git push` n'a été tenté ; **(c)** la sortie déclare explicitement
  que le push et la création ont été ignorés. **Ce test doit ÉCHOUER sur `62f012a`** — le prouver en
  l'exécutant sur `main` avant correctif, et **consigner l'échec observé dans le rapport de gate**.
- **C2 — `--version` en bascule.** `update --version v2.3.0 --no-push` sur le même montage : l'état
  des lieux produit porte `v2.3.0`, **pas** `v0.1.0`.
- **C3 — `--home` en bascule.** `update --no-push --home <dir2>` : le snapshot est écrit sous
  `<dir2>`, pas sous le défaut.
- **C4 — sens inverse (§ 0.2).** Répertoire **avec** `.git`, fausse forge répondant `200` : `onboard
  --no-push` → bascule vers `update` → **aucun `git push` tenté**.
- **C5 — refus headless (§ 4.6).** Même montage que C1 mais **sans** `--no-push`, en mode non
  interactif : **aucun dépôt distant créé**, code de sortie non nul, message nommant le geste
  explicite à poser.
- **C6 — l'échappatoire fonctionne.** Idem C5 **avec** l'autorisation explicite : la création est
  tentée (la fausse forge reçoit le `POST`), sans invite.
- **C7 — les drapeaux ignorés sont déclarés (§ 4.3).** `update --reason pause --note "x"` en bascule :
  la sortie **nomme** `--reason` et `--note` comme non applicables. Pas de silence.

### Cas nominal — non-régression

- **C8 — `onboard` direct inchangé.** `onboard --path <tmp>` sur fausse forge `404` : dépôt créé,
  **aucune invite**, aucun refus. La garde ne touche pas le chemin direct (§ 4.2).
- **C9 — panne réseau ne crée rien (§ 0.3).** Répertoire **avec** `.git`, fausse forge renvoyant `500`
  (donc `testRepo` → `null`) : `update` suit son chemin **nominal**, ne bascule pas, ne crée rien.
  Verrouille la conception correcte existante.
- **C10 — `update` nominal intact.** Répertoire avec `.git` + remote, fausse forge `200` : snapshot,
  commit, push — comportement inchangé ; et `--no-push` continue d'être honoré.
- **C11 — suite CLI.** `node --test` sous `cli/` : **0 fail**, total ≥ baseline `425` (les nouveaux
  tests l'augmentent), `skipped` inchangé à `1`.
- **C12 — `vendor-check` reste `clean`.** `OK - 17 copies + 4 derivees`, `--root` sur **le canon**.
  Attendu inchangé (§ 2.7) : aucun `.js` n'est vendoré. Toute dérive signalerait une contamination
  de branche.
- **C13 — surface documentaire.** Le `HELP` de `update` liste `--repo` et `--home` (§ 2.7), et les
  éventuels nouveaux drapeaux.
- **C14 — pas de contamination de branche (§ 3, G3).** `git diff --stat` de ce lot : les seuls
  fichiers touchés sont ceux du § 6. Aucune occurrence de `verifyFrame`/`warnFrameLeak` dans le diff.

---

## 8. Contrainte de test — ne jamais toucher une vraie forge

**Non négociable : l'incident vient d'un test qui a touché la forge réelle.**

Le point d'injection existe déjà et **ne demande aucune modification du code** :
`cli/src/lib/forgejo.js:23-28` lit `FORGEJO_URL` et `FORGEJO_USER` depuis l'environnement, et
`token()` lit `FORGEJO_TOKEN`. Un test peut donc :

1. lancer un serveur `node:http` local sur un port éphémère ;
2. positionner `FORGEJO_URL=http://127.0.0.1:<port>`, `FORGEJO_TOKEN=<factice>` ;
3. **enregistrer chaque requête reçue** — c'est ce journal qui permet d'affirmer « aucun `POST
   /api/v1/user/repos` », soit une **preuve positive d'absence d'acte**, bien plus forte qu'une
   absence d'erreur ;
4. scripter les réponses (`404` / `200` / `500`) pour couvrir C1, C4, C8, C9, C10.

Le `git push` se neutralise en pointant `origin` vers un dépôt **bare local** (`git init --bare` dans
un tmp) : un push réel serait alors observable **et inoffensif** — ce qui permet à C1 d'affirmer
« aucun push » plutôt que « le push a échoué ».

**Aucun test de ce lot ne doit lire `FORGEJO_URL` par défaut.** Un test qui, faute d'environnement,
retomberait sur `http://192.168.2.11:3001` reproduirait l'incident. Prescrire une **garde en tête du
fichier de test** : si `FORGEJO_URL` ne pointe pas sur `127.0.0.1`, le test **échoue immédiatement**
plutôt que de s'exécuter.

---

## 9. Délégable / geste humain

| Geste | Nature |
|---|---|
| Propagation des drapeaux, garde, message d'ignorance, `HELP` | **Délégable** (Gimli) |
| Faux serveur de forge + tests C1-C10 | **Délégable** (Gimli) |
| Exécution de C1 sur `62f012a` pour **constater l'échec avant correctif** | **Délégable**, résultat **à consigner** dans le rapport de gate |
| Choix de la branche de base et de l'ordre vs lot scrub | **Décideur** (§ 5 q.2) |
| Arbitrages § 5 q.1, q.3, q.4 | **Décideur** |
| Toute suppression de dépôt sur la forge | **Humain exclusivement** — jamais outillé, jamais délégué |
| Vérification que la forge réelle est indemne après le lot | **Humain** (décideur ou Odin) |

---

## 10. Estimation

**Équivalent jour-homme** (spec fermée, hors arbitrages du § 5) :

| Périmètre | j-h |
|---|---|
| Propagation seule (`--no-push`, `--version`, `--home`, deux sens) + message d'ignorance | **0,25** |
| Garde de bascule + comportement headless + échappatoire (§ 4.2, 4.6) | **0,5** |
| Faux serveur de forge + C1-C10 | **0,75** ← *le poste le plus lourd* |
| `HELP` + exécution du gate | **0,25** |
| **Total recommandé (sans PS)** | **≈ 1,75 j-h** |
| Option : parité PowerShell (§ 4.5, sans tests — non outillés) | **+0,25** |
| Option : `--skip-forgejo` sur `update` (§ 4.4) | **+0,25** |

**Complexité / risque : MOYEN.** Le correctif de propagation est trivial ; la **garde** ne l'est pas,
parce qu'elle introduit un **refus** dans un chemin jusqu'ici toujours passant — c'est-à-dire
exactement le genre de changement qui casse un usage non anticipé. Le poste de test est le plus
lourd et le plus déterminant : c'est lui qui empêche la récidive.

**Inconnues susceptibles de faire glisser l'estimation :**

1. **La détection du mode non interactif** (§ 4.6). `process.stdout.isTTY` est un critère fragile sous
   agent : Claude Code peut présenter un TTY tout en étant incapable de répondre à une invite. Si le
   décideur veut une détection robuste (variable d'environnement dédiée, propagée par la méthode),
   c'est **+0,25 à +0,5 j-h** et cela déborde sur la configuration des agents.
2. **Le lot scrub** (§ 3). Si ce lot doit attendre le gate du scrub, le délai calendaire glisse sans
   que la charge bouge. S'il faut rebaser après coup : **+0,25 j-h**.
3. **PowerShell** (§ 4.5). Le `.ps1` n'a pas de suite de tests ; une correction y est **non
   vérifiable automatiquement**. Si le décideur exige une preuve, il faut un test manuel sous
   Windows — **hors de ma capacité d'estimation**, et hors de la machine courante (macOS).
4. **Le point de coupe du § 4.2 pourrait déplaire à l'usage.** S'il apparaît que le décideur lance
   couramment `update` sur des répertoires neufs *en comptant sur* la bascule créatrice, le refus par
   défaut devient une gêne quotidienne et il faudra repenser l'ergonomie (invite mémorisée,
   configuration projet) : **+0,5 j-h**.

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au temps
réel à la clôture du lot.
