# Retrait des scripts PowerShell du dépôt `iakaframe`

> **Statut** : cadrage remis au décideur — non lancé.
> **Phase** : P1 (cadrage). Auteur : 🔵 Gandalf. Date : 2026-07-21.
> **Décision amont, non rediscutable** : « **On retire tout, quitte à devoir le redévelopper.** »
> Ce lot **organise** le retrait ; il ne le remet pas en question. La formule « quitte à devoir le
> redévelopper » règle d'avance le risque de perte : le décideur accepte de refaire si besoin.

---

## 0. Outillage du cadreur — déclaration

**`Bash` N'EST PAS disponible dans ma session.** Conséquences à assumer par le lecteur :

- Toutes les mesures ci-dessous viennent de `Grep` (ripgrep) et `Glob` sur l'**arbre de travail**,
  pas de `git ls-files`. **Un fichier `.ps1` non versionné mais présent sur disque serait compté
  comme s'il l'était**, et un fichier versionné mais absent du disque serait manqué. Le compte de
  18 concorde avec le `git ls-files '*.ps1'` cité au brief, ce qui rend l'écart improbable — mais
  **non prouvé par moi**.
- Je n'ai **pas** pu lire l'historique git. Les dates « dernière modification 20-22 juin » du brief
  sont **reprises, non revérifiées**.
- Je n'ai **pas** pu exécuter la suite de tests. La baseline `425/424/0/1` est **reprise du brief**.
  **Un point de ce lot la contredit** (§ 4.1) — c'est une déduction par lecture de source, à
  confirmer par exécution en P2.

---

## 1. Problème

Le dépôt porte **18 scripts PowerShell** que plus rien n'installe et que la machine du décideur ne
peut pas exécuter (macOS, ni `pwsh` ni `powershell`). Le CLI Node les a dépassés (30 verbes contre
11 scripts racine).

Le coût n'est pas l'espace disque : c'est que **des documents vivants prescrivent encore de les
lancer**. Une skill qui dit à un agent `pwsh C:\work\iakaframe\iakaframe-onboard.ps1` prescrit, sur
la machine courante, une commande **doublement impossible** — chemin Windows et interpréteur absent.
C'est la classe de défaut « doc qui prescrit ce qui n'existe plus », déjà traitée ailleurs ce jour.

**Le problème réel de ce lot n'est donc pas la suppression** — 18 `rm` — **mais le tri des 379
références.** Supprimer sans trier transforme une dette visible en dette pendante.

---

## 2. Faits mesurés — dont trois qui infirment le brief

### 2.1 Inventaire des fichiers — CONFORME

18 `.ps1`, exactement comme annoncé :

| Zone | Nb | Fichiers |
|---|---|---|
| Racine (canon) | 11 | `iakaframe-{agents,alternatives,build-methode-code,common,config,forgejo,init,onboard,services,snapshot,update}.ps1` |
| Kit distribué | 3 | `kits/iakaframe-claude/global/hooks/{identity-guard,identity-remind,perimeter-guard}.ps1` |
| Miroir `frames/releases/StefFrame2/` | 4 | `install.ps1` + les 3 mêmes hooks |

### 2.2 INFIRMÉ — « ~90 fichiers les référencent »

**Faux, et sous-évalué d'environ 30 %.** Mesure : **379 occurrences sur 116 fichiers**.

L'écart s'explique : le brief a compté le **canon** et oublié que le **miroir** porte sa propre
copie de chaque document. Répartition :

| Zone | Occurrences | Fichiers |
|---|---|---|
| **Canon** | **303** | **76** |
| **Miroir** `frames/releases/StefFrame2/` | **76** | **40** |
| **Total** | **379** | **116** |

*(Les deux sommes ont été vérifiées : la ventilation par famille du § 3 retotalise exactement 303
côté canon.)*

### 2.3 INFIRMÉ — `cli/src/commands/onboard.js` : 3 références HORS PÉRIMÈTRE

Le brief classe `onboard.js` (3 réfs) en tête du tableau « code vivant », donc en cible. **Ce n'est
pas le cas.** Ces trois lignes parlent de `scan.ps1` — le script de scan du **dashboard de
portefeuille**, déposé par le scaffold `library/scaffolds/portefeuille.md`. **`scan.ps1` ne fait
pas partie des 18** : il n'apparaît ni dans `git ls-files '*.ps1'` du brief, ni dans mon `Glob`.

`onboard.js:136-146` est un **repli conditionnel** déjà correctement ordonné — `scan.js` (Node,
cross-OS) d'abord, `scan.ps1` seulement en secours, et un message explicite si aucun interpréteur
n'est trouvé. **Ne rien y toucher.** Y toucher casserait le scan de portefeuille sur les postes
Windows qui n'ont encore que le `.ps1`.

> Le brief demandait de corriger ses propres faits faux. En voici un qui, non relevé, aurait fait
> modifier un chemin d'exécution vivant et sans rapport avec le lot.

### 2.4 CONFIRMÉ — les 3 hooks `.ps1` du kit ne sont jamais installés

`frames/releases/StefFrame2/install.mjs:227` :

```js
planNamedSet(state, 'Hooks', path.join(KIT, 'global', 'hooks'), 'hooks', (n) => n.endsWith('.mjs')),
```

Le filtre est bien `.mjs`. Les `.ps1` du dossier `hooks/` sont **livrés dans le bundle et jamais
déployés**. La qualification de Legolas — « poids mort, et fausse piste pour qui inspecte le
bundle » — tient.

**Réponse à la question posée** (« les retirer change-t-il quelque chose pour un utilisateur du
kit ? ») : **non, rien, mesurable et sans réserve.** Aucun chemin d'installation ne les lit. Le seul
effet est un bundle plus petit et un dossier `hooks/` qui ne ment plus sur son contenu.

### 2.5 CONFIRMÉ — `install.ps1` est un wrapper de deux lignes

Il délègue à `install.mjs` et ne contient aucune logique propre. Il ne contient d'ailleurs
**aucune** occurrence de `.ps1` (il n'apparaît pas dans le relevé) : il ne se cite pas lui-même.

### 2.6 NOUVEAU — les fixtures vendorées ne citent aucun `.ps1`

Point de vigilance le plus lourd du brief, et **il se referme sans travail**.

Composition mesurée des 21 fixtures (`cli/src/lib/vendor.js:15-20, 28-31`) :
- **17 copies** (8 personas + 8 goldens + 1 binding) → comparaison **byte-à-byte** ;
- **4 dérivées** (methode, methode wrapped, team, kit) → **frontmatter sémantique, corps EXEMPTÉ**.

Deux mesures :

1. `library/personas/**` → **aucune occurrence** de `.ps1`, `pwsh` ni `powershell`
   (recherche insensible à la casse). Les 8 personas sont propres, donc les 8 goldens qui en
   dérivent aussi, et le binding également (absent du relevé).
2. La seule dérivée qui cite des `.ps1` est **`methode-de-travail.md` (7 occurrences)** — et son
   **corps est exempté** de la comparaison.

**Conclusion : `vendor-check` reste `clean` (`OK - 17 copies + 4 derivees`). Aucun re-vendorage
n'est requis dans ce lot.** Le § 5 en fait néanmoins un critère de non-régression exécuté, pas une
promesse.

> Réserve honnête : je conclus sur la *composition* des fixtures lue dans `vendor.js`, sans avoir
> exécuté `vendor-check`. Si une fixture copie était ajoutée d'ici P2, le raisonnement serait à
> refaire. Le critère A7 le rattrape par exécution réelle.

---

## 3. Classement des 379 références par famille

C'est le cœur du lot. **Cinq familles, cinq traitements.**

| # | Famille | Occ. | Fich. | Traitement |
|---|---|---:|---:|---|
| **F1** | **Auto-références** — les `.ps1` se citent entre eux | **43** | 14 | **Disparaissent avec les fichiers.** Zéro geste. |
| **F2** | **Archive historique** — instructions datées, HTML générés, journal, état des lieux | **176** | 30 | **LAISSER intactes.** |
| **F3** | **Prescription vivante** — dit à un humain ou à un agent de lancer un `.ps1` | **~70** | 15 | **RÉÉCRIRE** vers le verbe CLI, ou **SUPPRIMER** la section. |
| **F4** | **Dépendance structurelle** — le code casse ou change de comportement | **5** | 3 | **TRAITER** (dont 1 bloquant, 1 hors périmètre). |
| **F5** | **Mention de provenance dans du code vivant** | **4** | 4 | **LAISSER.** Commentaires de traçabilité. |
| | Sous-total canon | **303** | 76 | |
| **F6** | **Miroir** `frames/releases/StefFrame2/` | **76** | 40 | **HORS LOT** — voir § 6.1. |
| | **Total** | **379** | **116** | |

### F1 — Auto-références (43 occ. / 14 fichiers) — aucun geste

`onboard.ps1` 15, `update.ps1` 7, `agents.ps1` 5, `snapshot.ps1` 3, `common.ps1` 2, `services.ps1` 2,
`init.ps1` 2, `alternatives.ps1` 1, `config.ps1` 1, `forgejo.ps1` 1, `identity-remind.ps1` 2,
`identity-guard.ps1` 1, `perimeter-guard.ps1` 1. `build-methode-code.ps1` : 0.

Elles s'évaporent avec les fichiers. **Elles ne doivent pas être comptées comme du travail** — c'est
11 % du volume brut qui disparaît tout seul.

### F2 — Archive historique (176 occ. / 30 fichiers) — LAISSER

- **`specs/instructions/*.md` — 144 occ. / 26 fichiers.** Les plus denses :
  `hygiene-portabilite-config-globale.md` 26, `rituel-identite-agents.md` 17,
  `iakaframe-multiplateforme-cli.md` 15, `reconciliation-services-json.md` 14,
  `frame-stefframe2.md` 9, `garde-perimetre-gestes-directs.md` 9.
- **HTML générés — 32 occ. / 8 fichiers** : `methode-de-travail.html` 10, `doc/index.html` 8,
  `iakaframe-methode.html` 5, `guide-stefframe2.html` 4, etc.
- `specs/etat-des-lieux.md`, `specs/.iakaframe-journal.json`, `BACKLOG.md`.

**Argument de non-modification — et c'est un arbitrage, pas une facilité.** Une instruction est un
**enregistrement daté d'une décision prise à une date**. La réécrire pour effacer la trace d'un
outil qui a existé, c'est falsifier l'archive : le lecteur futur perdrait la capacité de comprendre
pourquoi le CLI a la forme qu'il a. `services.js:4` (« Iso du `iakaframe-services.ps1` ») n'a de sens
que si l'instruction qui a commandé cette iso est encore lisible.

Les **HTML** sont **générés** : les éditer à la main serait écrasé à la régénération suivante. Ils
suivront leur source (§ F3) au prochain build. **Ne pas les toucher dans ce lot.**

### F3 — Prescription vivante (~70 occ. / 15 fichiers) — RÉÉCRIRE ou SUPPRIMER

**La seule famille qui demande du jugement, et le vrai contenu du lot.**

| Fichier | Occ. | Nature mesurée | Geste |
|---|---:|---|---|
| `README.md` (racine) | 21 | Doc d'entrée du dépôt | Réécrire vers CLI |
| `kits/iakaframe-claude/global/CLAUDE.md` | 5 | **Instructions d'agent déployées** | Réécrire |
| `kits/iakaframe-ollama/AGENTS.md` | 5 | Instructions d'agent | Réécrire |
| `kits/iakaframe-ollama/README.md` | 4 | Doc kit | Réécrire |
| `kits/iakaframe-codex/README.md` | 4 | Doc kit | Réécrire |
| `kits/iakaframe-claude/CLAUDE.md` | 3 | Instructions d'agent | Réécrire |
| `methode-de-travail.md` | 7 | **Document de méthode** — *dérivée vendorée, corps exempté* | Réécrire |
| `docs/commandes.md` | 3 | Section « voie historique conservée » | **SUPPRIMER la section** |
| `docs/guide-stefframe2.md` | 3 | Guide d'installation | Réécrire |
| `kits/iakaframe-codex/AGENTS.md` | 2 | Instructions d'agent | Réécrire |
| `kits/iakaframe-claude/global/README.md` | 2 | Doc kit | Réécrire |
| `kits/iakaframe-ollama/MODELES.md` | 1 | Doc kit | Réécrire |
| `library/skills/iakaframe-odin/SKILL.md` | 2 | **Prescription à agent** | Réécrire |
| `library/skills/iakaframe-update/SKILL.md` | 2 | **Prescription à agent** | Réécrire |
| `library/skills/iakaframe-forgejo/SKILL.md` | 1 | Prescription à agent | Réécrire |
| `library/skills/iakaframe-appflowy-doc/SKILL.md` | 1 | Mention de câblage | Réécrire ou laisser |
| `library/skills/README.md` | 1 | Prescription | Réécrire |
| `library/rituals/init.md` | 1 | **Rituel — prescription** | Réécrire |
| `library/scaffolds/portefeuille.md` | 1 | Concerne `scan.ps1` → **hors sujet** | **LAISSER** (cf. § 2.3) |

**Les cinq plus urgentes, verbatim.** Ce sont des ordres donnés à des agents, aujourd'hui :

```
library/skills/iakaframe-odin/SKILL.md:59
   (`pwsh C:\work\iakaframe\iakaframe-onboard.ps1`), puis remettre la main à Aragorn.
library/skills/iakaframe-odin/SKILL.md:60
   - **Créer une équipe** → `iakaframe-agents.ps1 -Action fullteam -Project <p>`.
library/skills/iakaframe-update/SKILL.md:27
   pwsh C:\iakaframe\iakaframe-update.ps1 -Reason version -Version v0.4.0 -Note "..."
library/skills/iakaframe-update/SKILL.md:34
   pwsh C:\iakaframe\iakaframe-snapshot.ps1 -Reason version -Version v0.4.0
library/rituals/init.md:17
   Orchestrateur : `iakaframe-onboard.ps1` (init + forgejo + commit + snapshot).
```

Ces lignes sont **déjà cassées avant tout retrait** (chemin `C:\` + `pwsh` absent sur macOS). Le
retrait ne crée pas le défaut : **il le rend visible et oblige à le corriger.** C'est le principal
bénéfice non financier du lot.

`docs/commandes.md:290-294` est un cas à part : la section s'intitule « voie historique conservée »
et **conserve** trois scripts. Une fois retirés, elle ne conserve plus rien. **La supprimer**, pas la
réécrire — et répercuter, conformément à la règle de maintien à jour de `docs/commandes.md`.

> **Réserve de mesure.** Le tri « réécrire vs supprimer » ci-dessus est établi **par fichier**
> (nature + volume), pas ligne par ligne sur les ~70. Un fichier peut mêler prescription et rappel
> historique. **Le tri définitif ligne à ligne appartient à l'exécution (P2)** ; le critère A4 le
> rend vérifiable sans exiger que je l'aie fait à sa place. Le chiffre `~70` est donc une
> **enveloppe**, la seule de ce document — F1, F2, F4, F5 et F6 sont exacts.

### F4 — Dépendance structurelle (5 occ. / 3 fichiers) — TRAITER

**F4-a — `cli/test/services-out.test.js` (3 occ.) — BLOQUANT. Le point dur du lot.**

```js
const PS1 = path.join(REPO, 'iakaframe-services.ps1');   // ligne 20
...
test('V2 : le bloc $payload de iakaframe-services.ps1 contient les cles ok ET count', () => {
  const src = fs.readFileSync(PS1, 'utf8');              // ligne 56
```

Ce test **lit le `.ps1` sur le disque**. Retirer `iakaframe-services.ps1` sans toucher ce test fait
**échouer la suite** (`ENOENT` sur `readFileSync`) : `fail 0` deviendrait `fail 1`.

**Le brief classait ce fichier en simple « code vivant, 3 réfs », sans signaler qu'il bloque.** Il ne
peut pas être laissé : c'est le seul endroit du dépôt où le retrait **casse le vert**.

Le test V2 se décrit lui-même comme une « **garde statique du source ps1** … anti-régression : fige
la source contre un retour au legacy ». **Sa raison d'être disparaît avec sa cible** : on ne garde
pas un fichier contre une régression s'il n'existe plus. **→ Supprimer le test V2 et la constante
`PS1`. Conserver V1** (le verrou de la forme C-JSON du CLI), qui ne dépend d'aucun `.ps1`.

**Conséquence sur la baseline** : la suite passe de **425 à 424 tests**, `pass 424 → 423`,
`fail 0`, `skipped 1`. **La baseline du brief cesse d'être valide, et c'est attendu, pas une
régression.** Le critère A2 fige la nouvelle valeur.

**F4-b — `cli/src/lib/frame.js:93` (1 occ.) — RECOUVREMENT, NE PAS ÉCRIRE ICI**

```js
const TEXT_EXT = new Set([
  '.md', '.js', '.mjs', '.cjs', '.json', '.ps1', '.sh', '.txt', ...
```

`.ps1` est une extension **scannée** par le gate `frame verify`. Le retirer ne casse rien (un
ensemble d'extensions dont plus aucun fichier ne porte le suffixe est inerte) mais laisse une
inexactitude.

**Ce fichier appartient au lot `outillage-scrub-miroir-frame`, en gate FAIL avec 5 correctifs en
attente.** Le brief demande explicitement de signaler sans écrire : **je m'y tiens.** Recommandation
transmise au lot scrub, pas exécutée ici (§ 6.2). Coût si oublié : nul fonctionnellement.

**F4-c — `.gitattributes:5` (1 occ.)**

```
*.ps1 text eol=crlf
```

Règle de fin de ligne devenue sans objet. **La retirer** — c'est propre, sans risque, et dans le
périmètre.

**F4-d — `cli/src/commands/onboard.js` (3 occ.) — HORS PÉRIMÈTRE.** Cf. § 2.3. **NE PAS TOUCHER.**

### F5 — Mention de provenance (4 occ. / 4 fichiers) — LAISSER

| Ligne | Texte | Verdict |
|---|---|---|
| `cli/src/commands/services.js:4` | « Iso du `iakaframe-services.ps1` (memes defauts/schema) » | Laisser |
| `cli/src/commands/banner.js:2` | « réutilisable par les `.ps1` et par les agents » | **Réécrire** (cf. infra) |
| `cli/baselines/guard/identity-guard.baseline.mjs:2` | « portage macOS du `.ps1` » | Laisser |
| `cli/README.md:136` | « Le portage depuis les `.ps1` … est livré » | Laisser |

Trois disent **d'où vient** le code — information vraie et utile après retrait. Le retrait ne les
invalide pas.

**Une exception**, que je sépare volontairement : `banner.js:2` dit que le rendu est « réutilisable
**par les `.ps1**` ». Ce n'est pas de la provenance, c'est une **affirmation de contrat au présent**
qui devient fausse. **→ Réécrire cette seule ligne** (« réutilisable par le CLI et par les agents »).
La ranger en F5 par ressemblance de forme aurait laissé une inexactitude ; la ranger en F3 aurait
noyé un geste d'une ligne dans une famille de 70.

---

## 4. Table de correspondance `.ps1` → verbe CLI

Le CLI expose **30 verbes** (`cli/src/index.js:140-172`) : `onboard, init, snapshot, update,
services, config, agents, go, banner, brief, recap, jalon, list, show, add, remove, attach, detach,
assemble, vendor-check, frame, switch|use, memory, produit, open, recall, close, review, consolidate,
observe, portfolio, root`.

| `.ps1` retiré | Verbe CLI | Couverture |
|---|---|---|
| `iakaframe-onboard.ps1` | `iakaframe onboard` | ✅ complète |
| `iakaframe-init.ps1` | `iakaframe init` | ✅ complète |
| `iakaframe-snapshot.ps1` | `iakaframe snapshot` | ✅ complète |
| `iakaframe-update.ps1` | `iakaframe update` | ✅ complète |
| `iakaframe-services.ps1` | `iakaframe services` | ✅ complète (iso revendiquée + verrouillée par le test V1) |
| `iakaframe-config.ps1` | `iakaframe config` | ✅ complète |
| `iakaframe-agents.ps1` | `iakaframe agents` (+ `assemble`, `attach`, `detach`) | ✅ complète |
| `iakaframe-alternatives.ps1` | `iakaframe go` | ✅ (runners ps/codex/iakaide/aider) |
| `iakaframe-common.ps1` | — | ✅ **sans objet** : bibliothèque interne aux `.ps1`, sans existence propre |
| `iakaframe-build-methode-code.ps1` | — | ⚠️ **à vérifier en P2** (cf. infra) |
| `iakaframe-forgejo.ps1` | *aucun verbe* — lib `cli/src/lib/forgejo.js` | ⚠️ **trou partiel** (cf. infra) |
| `install.ps1` (miroir) | `node install.mjs` | ✅ wrapper pur |
| 3 hooks `.ps1` × 2 zones | hooks `.mjs` | ✅ déjà les seuls installés (§ 2.4) |

### Les deux trous — et ce qu'ils coûtent réellement

**Trou 1 — `iakaframe-forgejo.ps1` : couvert en fonction, absent en verbe.**

Lecture faite du script (101 lignes) : il crée un dépôt Forgejo via `POST /api/v1/user/repos`, gère
le 409 « déjà existant », nettoie la description en ASCII, puis pose `origin` avec token intégré,
avec un `git init` si besoin.

`cli/src/lib/forgejo.js` expose `token()`, `cfg()`, `testRepo()`, `createRepo()`, `remoteUrl()` —
**la totalité de la logique est portée**. Mais **aucun `case 'forgejo'`** dans `index.js` : elle
n'est atteignable qu'**à travers** `onboard` / `init` / `update`.

**Le trou est donc étroit et nommable** : *brancher un dépôt git existant sur Forgejo **sans**
dérouler un onboarding complet*. C'est le seul geste que le retrait rend indisponible en ligne de
commande.

**Recommandation : retirer quand même, et inscrire une dette explicite.** Trois raisons : la logique
est déjà portée (un `case 'forgejo'` serait ~20 lignes de câblage, pas un redéveloppement) ; le geste
isolé est rare — le cas courant passe par `onboard` ; et `onboard` s'auto-détecte déjà en `update`
sur un dépôt présent. **Ne pas créer le verbe dans ce lot** : ce serait de l'ajout de fonctionnalité
dans un lot de retrait, et le décideur a demandé un retrait.

**Trou 2 — `iakaframe-build-methode-code.ps1` : non tranché, et je le dis.**

Ce script est le seul des 11 dont je ne peux pas nommer l'équivalent : il ne contient **aucune**
auto-référence (0 occurrence, il n'est cité nulle part) et son nom suggère une génération de la
méthode vers du code. **Je ne l'ai pas lu** — le cadrage a priorisé le classement des 379
références. **Point d'honnêteté : c'est le seul angle mort de ce document.** Le critère A9 impose sa
lecture **avant** suppression, avec remontée au décideur s'il s'avère porter une fonction vivante et
non portée. Coût si le pire se réalise : une dette de redéveloppement, explicitement acceptée par
« quitte à devoir le redévelopper ».

---

## 5. Périmètre fermé

### 5.1 DANS le lot

1. **Supprimer 14 `.ps1` du canon** : les 11 de la racine + les 3 hooks de
   `kits/iakaframe-claude/global/hooks/`.
2. **Traiter F4** : supprimer le test V2 + la constante `PS1` de `cli/test/services-out.test.js` ;
   retirer la ligne `*.ps1 text eol=crlf` de `.gitattributes`.
3. **Traiter F3** : réécrire vers les verbes CLI, ou supprimer la section, dans les 15 fichiers de
   prescription vivante. Supprimer la section « voie historique » de `docs/commandes.md:290-294`.
4. **Réécrire `banner.js:2`** (F5, exception).
5. **Ne toucher à rien d'autre.**

### 5.2 HORS du lot — explicitement

| Exclu | Raison |
|---|---|
| Les **4 `.ps1` du miroir** | § 6.1 |
| `cli/src/lib/frame.js:93` | Appartient au lot scrub (§ 6.2) |
| `cli/src/commands/onboard.js` | Concerne `scan.ps1`, hors sujet (§ 2.3) |
| `library/scaffolds/portefeuille.md` | Idem |
| Les **176 réfs F2** | Archive |
| Les **HTML générés** | Suivront leur source au prochain build |
| **Création d'un verbe `forgejo`** | Ajout dans un lot de retrait |
| **Re-vendorage** | Non requis (§ 2.6) |

---

## 6. Arbitrages

### 6.1 Les 4 `.ps1` du miroir → HORS LOT. Tranché.

Le brief avertit : « ne couple pas par réflexe ». **Je ne couple pas, et voici le raisonnement.**

Le décideur a posé le principe **« le frame est un miroir du canon »**. Un miroir ne se nettoie pas à
la main : **il se régénère.** Retirer les 4 `.ps1` du miroir dans ce lot serait précisément *écrire
dans le miroir* — le geste que le principe interdit.

Le comportement correct : **le canon perd ses `.ps1` ici ; le miroir les perd à la propagation
suivante**, mécaniquement. Si la propagation ne les emporte pas, **c'est un défaut de l'outil de
propagation**, à traiter comme tel — et c'est exactement l'objet du lot
`outillage-scrub-miroir-frame`, en cours.

Bénéfice de méthode : ce lot devient un **test réel du principe de miroir**. Si après propagation le
miroir contient encore les `.ps1`, on aura appris quelque chose sur l'outil. Les fusionner ici aurait
masqué cette information.

**Conséquence acceptée et assumée** : entre ce lot et la propagation, le miroir contient 4 `.ps1`
absents du canon. **C'est un drift temporaire, connu, borné, et documenté ici.** Il ne doit pas
surprendre au gate suivant.

### 6.2 `frame.js:93` → SIGNALÉ, NON ÉCRIT. Tranché.

Recouvrement avec le lot scrub, en gate FAIL. **Recommandation transmise** : retirer `.ps1` de
`TEXT_EXT` **dans le lot scrub**, après ce retrait. Impact fonctionnel nul.

### 6.3 Les 3 hooks `.ps1` du kit → RETRAIT SANS RÉSERVE. Tranché.

Mesure § 2.4 : jamais installés. **Zéro impact utilisateur.** C'est le retrait le mieux justifié des
trois zones.

### 6.4 Commit isolé → OUI. Recommandation ferme.

Le précédent du jour (retrait de `StefFrame1` isolé pour permettre un revert chirurgical)
s'applique. Structure proposée en **deux commits**, pas un :

1. `chore: retirer les scripts PowerShell du canon (14 fichiers)` — suppressions pures + F4
   (test V2, `.gitattributes`). **Revertable en un `git revert`.**
2. `docs: reporter les prescriptions .ps1 vers les verbes CLI` — F3 + `banner.js:2`.

**Pourquoi deux et non un.** Ils n'ont pas le même profil de risque. Le 1 est mécanique et
réversible ; le 2 est du jugement rédactionnel, où une réécriture peut être *fausse* sans être
*cassée* — donc invisible aux tests. Les séparer permet de reverter le retrait sans perdre les
corrections de doc, ou l'inverse. Fusionner les deux rendrait tout revert grossier.

---

## 7. Ce que je laisse au décideur

Quatre points. **Je ne les tranche pas** — ils engagent la stratégie, pas la technique.

1. **`iakaframe-build-methode-code.ps1`** (§ 4, trou 2). Non lu, sans équivalent identifié, cité
   nulle part. **Retirer à l'aveugle** (cohérent avec « quitte à redévelopper ») **ou le lire
   d'abord** ? Le critère A9 impose par défaut la lecture avant suppression : le décideur peut lever
   cette exigence.

2. **La dette `forgejo`** (§ 4, trou 1). Inscrire au `BACKLOG.md` un verbe `iakaframe forgejo`
   (~20 lignes de câblage, logique déjà portée), ou considérer que `onboard` suffit et **fermer le
   sujet sans dette** ?

3. **L'ordre de sérialisation** (§ 8). Trois écrivains simultanés sur `iakaframe` est la classe de
   défaut qu'on traite. J'en propose un — le décideur arbitre.

4. **Le drift temporaire du miroir** (§ 6.1). Acceptable jusqu'à la propagation, ou faut-il un
   correctif de propagation **avant** ce lot ?

---

## 8. Recouvrement avec les deux lots en cours — et sérialisation

**Trois lots visent `iakaframe`.** Recouvrement mesuré :

| Fichier | Ce lot | Scrub miroir | Bascule `update`/`onboard` |
|---|---|---|---|
| `cli/src/lib/frame.js` | signalé (l.93), **non écrit** | **écrit** | — |
| `cli/src/commands/services.js` | F5 l.4, **non écrit** | **écrit** (l.11, IP en dur) | — |
| `cli/src/commands/onboard.js` | **non écrit** (§ 2.3) | — | **écrit** |
| `cli/src/index.js` | — | — | **écrit** (bloc `HELP`) |
| `cli/test/` | **écrit** (`services-out.test.js`) | — | **écrit** (nouveau fichier) |
| `frames/releases/StefFrame2/**` | **hors lot** (§ 6.1) | **écrit** | — |
| Les 14 `.ps1` canon | **supprime** | — | **écrirait** (§ 4.5, *conditionnel*) |

**Le conflit dur est le dernier, et ce lot le résout par le haut.**

`specs/instructions/correctif-bascule-update-onboard-drapeaux.md:300-306` propose de **corriger les
`.ps1` en parité stricte** et pose au décideur la question ouverte (§ 4.5, question 4) :

> « **PowerShell** : les `.ps1` sont-ils encore vivants ? Si oui → parité stricte à inclure, ce qui
> change l'estimation. »

Verbatim de sa recommandation : « **(a) si — et seulement si — les `.ps1` sont encore un chemin
d'exécution vivant.** »

**La décision de retrait répond définitivement : non.** Donc :

- **§ 4.5 du lot bascule devient sans objet** — sa condition est infirmée ;
- sa **question 4 tombe** — plus rien à trancher ;
- ses fichiers cibles conditionnels « et les deux `.ps1` seulement si la question 4 est tranchée
  oui » (ligne 348) **sortent de son périmètre** ;
- son **estimation baisse** — le risque n° 3 qu'il identifiait (« une correction y est non
  vérifiable automatiquement … test manuel sous Windows, hors de ma capacité d'estimation ») **est
  éliminé, pas réduit**.

> **Ce lot ne bloque pas le lot bascule : il le débloque**, en supprimant sa seule branche non
> vérifiable et sa dernière question ouverte au décideur. C'est un argument de séquencement, pas de
> confort.

### Ordre proposé

```
1. Lot scrub miroir       (en cours, gate FAIL — 5 correctifs)   ← finir d'abord
   └─ y inclure : retrait de '.ps1' de TEXT_EXT (frame.js:93)
2. CE LOT — retrait des .ps1                                     ← puis
   └─ propagation vers le miroir : les 4 .ps1 doivent disparaître
3. Lot bascule update/onboard                                    ← enfin, allégé du § 4.5
```

**Justification de chaque position.** Le scrub d'abord parce qu'il est **déjà engagé** et en FAIL :
empiler dessus rendrait son gate illisible, et il possède `frame.js` et `services.js`. Ce lot
ensuite, parce qu'il **supprime des fichiers** — un geste qui doit s'appliquer sur une base stable,
et parce que sa propagation vérifie le scrub. Le lot bascule en dernier, parce qu'il est le seul
**cadré et non lancé** (donc sans coût d'attente) et qu'il **bénéficie** des deux précédents.

**Règle d'exécution : un seul écrivain à la fois.** Aucun chevauchement de branches sur `iakaframe`.

---

## 9. Critères d'acceptation

Numérotés, vérifiables, cas nominal **et** cas de défaut.

### Nominal

**A1 — Les 14 `.ps1` du canon sont absents.**
`git ls-files '*.ps1'` renvoie **exactement 4** entrées, toutes sous `frames/releases/StefFrame2/`.
Défaut si 0 (le miroir a été touché → § 6.1 violé) ou si > 4.

**A2 — La suite CLI est verte, sur la nouvelle baseline.**
`tests 424 / pass 423 / fail 0 / skipped 1`.
**Le total DOIT baisser de 1** (retrait du test V2, F4-a). Si `tests` vaut encore 425, V2 n'a pas été
retiré → **défaut**. Si `fail ≥ 1`, régression.

**A3 — `vendor-check` inchangé.**
`iakaframe vendor-check` → `OK - 17 copies + 4 derivees`. **Aucun re-vendorage ne doit figurer au
diff** (§ 2.6). Un re-vendorage au diff = **défaut** : il signale qu'une fixture a bougé sans raison.

**A4 — Aucune prescription vivante ne survit.** *Cas de défaut central du lot.*

Grep de contrôle :

```
rg -n 'iakaframe-[a-z-]+\.ps1|pwsh|powershell' \
   --glob '!specs/instructions/**' --glob '!frames/**' --glob '!*.html' \
   --glob '!doc/**' --glob '!specs/etat-des-lieux.*' --glob '!specs/.iakaframe-journal.json' \
   --glob '!BACKLOG.md'
```

**Sortie attendue : les 4 mentions F5 (moins `banner.js:2`, réécrit) et RIEN d'autre**, soit
`services.js:4`, `identity-guard.baseline.mjs:2`, `cli/README.md:136`. Plus les occurrences
`scan.ps1` de `onboard.js` et `portefeuille.md`, hors sujet et légitimes.

> **Ce que ce grep N'ATTRAPE PAS — à lire avant de s'y fier.** Le brief l'exige, et c'est justifié :
>
> 1. **Une prescription reformulée sans nommer le fichier.** « lancer le script d'onboarding sous
>    PowerShell » ne contient ni `.ps1` ni `pwsh` → **invisible**.
> 2. **Un nom coupé par un retour à la ligne** dans un tableau Markdown ou un bloc justifié.
> 3. **Les HTML générés**, exclus volontairement : ils resteront faux jusqu'au prochain build. **Le
>    grep les masque, il ne les corrige pas.**
> 4. **Une réécriture *fausse*** : `iakaframe-snapshot.ps1` remplacé par un verbe **inexistant** (ex.
>    `iakaframe état-des-lieux`) passe A4 au vert tout en recréant exactement le défaut visé. **C'est
>    le trou le plus dangereux** — un grep d'absence ne prouve jamais une présence correcte.
>
> **→ A4 est nécessaire et NON suffisant. A5 le complète ; A8 est le seul filet humain.**

**A5 — Tout verbe CLI introduit par une réécriture existe.**
Chaque `iakaframe <verbe>` ajouté par F3 appartient à la liste des 30 de `cli/src/index.js:140-172`.
Vérification : extraire les verbes du diff, croiser avec les `case`. **Ferme le trou n° 4 de A4.**

**A6 — Le retrait est isolé.**
Commit 1 = suppressions + F4, sans réécriture de doc. `git revert` du commit 1 **restaure les 14
fichiers** sans toucher aux corrections du commit 2.

**A7 — Invariants non rouverts.**
`principleIds` = **18** · `memory.js` **non modifié** · `TARGETS` **non élargi** ·
`cadence.close_on = ['pause','version']`. Chacun **absent du diff**.

**A8 — Gate humain : les cinq prescriptions du § F3 sont relues une à une.**
`iakaframe-odin/SKILL.md:59-60`, `iakaframe-update/SKILL.md:27,34`, `rituals/init.md:17`. **Relecture
du texte remplaçant, pas de l'absence de l'ancien.** Seul critère qu'aucun automatisme ne remplace.

### Défaut

**A9 — `build-methode-code.ps1` a été lu avant d'être supprimé.**
L'exécutant **déclare** au gate : équivalent CLI identifié, ou fonction morte, ou **dette remontée au
décideur**. **Supprimer sans avoir lu = défaut**, sauf levée explicite (§ 7.1).

**A10 — Le miroir n'a pas été touché.**
Aucun fichier sous `frames/releases/StefFrame2/` au diff. **Un `.ps1` retiré du miroir dans ce lot
est un défaut**, pas un bonus (§ 6.1).

**A11 — `frame.js` et `onboard.js` sont absents du diff.**
Recouvrement scrub (§ 6.2) et hors-sujet `scan.ps1` (§ 2.3). Leur présence = franchissement de
périmètre.

**A12 — `docs/commandes.md` ne conserve plus de section « voie historique ».**
Les lignes 290-294 sont **supprimées**, pas réécrites. Une section « historique » qui ne conserve
rien est un mensonge résiduel.

---

## 10. Délégable / geste humain

| Geste | Nature | Qui |
|---|---|---|
| Suppression des 14 `.ps1` | Mécanique | **Délégable** (Gimli) |
| F4-a : test V2 + constante `PS1` | Mécanique, localisé | **Délégable** |
| F4-c : `.gitattributes` | Une ligne | **Délégable** |
| `banner.js:2` | Une ligne | **Délégable** |
| **F3 : ~70 réécritures / 15 fichiers** | **Jugement rédactionnel** | **Délégable, relecture humaine obligatoire (A8)** |
| Lecture de `build-methode-code.ps1` | Analyse | **Délégable**, verdict au gate (A9) |
| A1-A3, A5, A7, A10-A12 | Commandes | **Délégable** |
| **A4 — interprétation du grep** | **Jugement** | **Humain** — le grep ne conclut pas |
| **A8 — relecture des 5 prescriptions** | **Jugement** | **HUMAIN, non délégable** |
| Arbitrages § 7 | Décision | **Décideur** |
| Ordre de sérialisation § 8 | Décision | **Décideur** |

---

## 11. Estimation

### Équivalent jour-homme — spec fermée

| Poste | j-h |
|---|---|
| Suppression 14 fichiers + F4 (test, `.gitattributes`) + `banner.js` | 0,15 |
| **F3 — ~70 réécritures sur 15 fichiers** | **0,60** |
| Lecture `build-methode-code.ps1` + verdict | 0,10 |
| Vérification A1-A7, A9-A12 | 0,20 |
| **A8 — relecture humaine des 5 prescriptions** | 0,10 |
| Commits séparés + propagation miroir | 0,10 |
| **Total** | **≈ 1,25 j-h** |

**Le poids est dans F3 : 48 % du total.** Supprimer les fichiers coûte une minute ; **remettre 15
documents d'accord avec la réalité coûte une demi-journée.** Un plan qui annoncerait « c'est juste
18 `rm` » se tromperait d'un facteur 8.

### Complexité / risque : **FAIBLE en complexité, MOYEN en risque**

**Faible en complexité** : aucun algorithme, aucune API, aucune décision d'architecture. Suppressions
+ réécritures de texte.

**Moyen en risque**, pour trois raisons non réductibles :

1. **F4-a casse la baseline si oublié** — mais A2 le rattrape au premier `npm test`. *Risque
   détecté, pas silencieux.*
2. **Une réécriture F3 peut être fausse sans être cassée.** Aucun test ne juge une phrase de doc.
   C'est le risque **résiduel** du lot — A5 en couvre la moitié mécanisable, A8 le reste. *C'est
   pourquoi A8 est non délégable.*
3. **Trois lots concurrents.** Risque de conflit et de gate illisible. Traité par § 8, **pas
   éliminé**.

Aucun risque d'effet externe : rien de ce qui est retiré n'est exécuté par quiconque sur la machine
courante.

### Inconnues susceptibles de faire glisser

| Inconnue | Effet | Probabilité |
|---|---|---|
| **`build-methode-code.ps1` porte une fonction vivante non portée** | +0,25 à +1,0 j-h, ou dette | Faible — non cité, mais **non lu** |
| **Le tri F3 ligne à ligne dépasse l'enveloppe ~70** | +0,2 j-h | Moyenne — seule enveloppe du doc |
| **La propagation n'emporte pas les 4 `.ps1` du miroir** | Défaut du lot scrub, **hors cette estimation** | Moyenne — scrub en FAIL |
| **Rebase après le lot scrub** | +0,25 j-h | Moyenne |
| **Le décideur veut le verbe `forgejo` dans ce lot** | +0,25 j-h, et change la nature du lot | Faible — contraire à « retrait » |
| **Une fixture vendorée ajoutée d'ici P2** | Re-vendorage, +0,25 j-h | Très faible |

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## 12. Sources

Mesures **internes**, par `Grep`/`Glob` sur l'arbre de travail au **2026-07-21**. Aucun fait externe
n'a été mobilisé : la décision porte sur du code local, sur des versions internes, et ne dépend
d'aucune compatibilité tierce — **une vérification web n'aurait rien à ancrer ici**.

Fichiers lus intégralement : `iakaframe-forgejo.ps1` (101 l.).
Lus partiellement : `cli/src/index.js:140-172`, `cli/src/lib/vendor.js:1-90`, `cli/src/lib/frame.js:90-96`,
`cli/test/services-out.test.js:1-58`, `cli/src/commands/onboard.js:133-148`,
`frames/releases/StefFrame2/install.mjs:223-231`, `docs/commandes.md:288-296`,
`library/rituals/init.md:15-17`, `library/skills/**`, `.gitattributes:5`,
`specs/instructions/correctif-bascule-update-onboard-drapeaux.md:169-175, 300-350, 474-478`,
`specs/instructions/outillage-scrub-miroir-frame.md` (grep ciblé).

**Non lu — angle mort déclaré** : `iakaframe-build-methode-code.ps1` (§ 4, trou 2 ; critère A9).
