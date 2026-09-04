# Le paquet publié embarque `install.mjs` — la charge de l'étape 2 voyage avec le CLI

> **Successeur `BUNDLE-INSTALL-MJS-ABSENT`**, nommé et laissé non cadré le 2026-09-04 par
> `specs/instructions/chaine-complete-install-amorcage-dmg-msi.md` § 5.4 / R10 / § 11 inconnue 4.
> **Sa condition d'entrée — « un arbitrage du décideur » — est levée.** Directive verbatim de
> Stéphane, relayée par 🟡 Odin le 2026-09-04 : *« tranche l'arbitrage bundle : embarque
> install.mjs dans le tarball »*.
>
> Cadré par 🔵 **Gandalf**, le **2026-09-04**, **en worktree isolé** (`.claude/worktrees/
> agent-ad0d5f08878d103e5`) pendant que le lot C.1 court dans l'arbre principal. **À reporter sur
> `main` par Odin quand l'arbre principal sera libre.**
>
> **Lecture seule sur le code.** Tous les faits chiffrés ci-dessous ont été relevés **sur le disque
> de ce worktree ce jour**, jamais repris du brief. **Les quatre allégations transmises ont été
> re-mesurées : deux sont confirmées, une est confirmée mais sa conclusion implicite est fausse, et
> mon propre chiffrage de 0,5 j est corrigé** (§ 0.2). **Aucun shell dans cette session** : la
> limite est déclarée, et signalée à chaque fait concerné.
>
> **Lot autonome, exécutable après C.1.** Il ne rouvre aucun des huit arbitrages AR-A..AR-H ni les
> sept du cadrage grand-parent.

---

## 0. Ce qui a été mesuré le 2026-09-04

### 0.1 — Instruments

Lecture de fichiers (`Read`), recherche de motifs (`Grep`), énumération (`Glob`), et **vérification
web** pour le seul fait externe dont dépend une décision (le comportement de `npm pack`). **Aucune
commande n'a été exécutée** : ce que je ne peux pas exécuter, je ne le signe pas — les points
concernés sont renvoyés aux critères d'acceptation, qui les mesurent à l'exécution.

### 0.2 — Les allégations reçues, re-mesurées

| # | Allégation reçue | Verdict après mesure |
|---|---|---|
| G-a | « `ASSETS` porte huit entrées, aucune n'est `install.mjs` » | ✅ **CONFIRMÉ** — `cli/scripts/bundle.js:22-31`, huit entrées : `library`, `methods`, `teams`, `bindings`, `kits` (requis), `design-naonedge`, `agents`, `skills` (facultatifs). Aucune n'est `install.mjs`. |
| G-b | « `files` ne le porte pas davantage » | ✅ **CONFIRMÉ** (`cli/package.json:12-16`) — **mais la conclusion qu'on en tire d'ordinaire est FAUSSE.** Il n'y a **rien à ajouter à `files`** : c'est structurellement impossible, et ce serait inutile. Voir **N2**. |
| G-c | « un CLI installé par la voie publique ne peut structurellement pas jouer l'étape 2 » | ✅ **CONFIRMÉ, et par une seconde voie que le gate n'a pas citée** : même si `install.mjs` partait dans le tarball, **rien n'irait le chercher** — `resoudreReservoir` code `installMjsPath: null` **en dur** sur la branche embarquée, à **deux** endroits. Voir **N4**. |
| G-d | « ordre de grandeur ≈ 0,5 j » *(mon propre chiffrage)* | 🛑 **CORRIGÉ À LA HAUSSE : ≈ 0,75 j nu, ≈ 1 j avec la garde de tarball recommandée.** Mon 0,5 j comptait **la ligne de bundle**. Il ne comptait ni la résolution (N4), ni le crash qu'ouvre le geste (N5), ni les **six énoncés** qui deviennent faux (N6), ni les **trois tests** qui assertent aujourd'hui le contraire de ce qu'on va livrer (N7). **C'est la seconde fois que je corrige un de mes propres chiffres dans cette série ; il est corrigé, pas réaffirmé.** § 11. |

### 0.3 — Les faits neufs, ceux qui changent le geste (chemin:ligne)

- **N1 — La garde `required` existe, et voici exactement ce qu'elle contrôle.** `cli/scripts/
  bundle.js:22-31` porte le champ `required` ; l'application est en `:47-59` (boucle, collecte des
  `manquants`) et `:60-66` (`bundle REFUSE : asset(s) requis manquant(s)` + `process.exit(1)`).
  **Elle contrôle la présence, à la racine du dépôt, des cinq RÉPERTOIRES requis au moment du
  prepack.** Elle ne contrôle **ni** leur contenu (à une exception : la cohérence roster,
  `:68-92`), **ni** ce que le tarball emporte réellement. Sa doublure de test est
  `cli/test/bundle-assets.test.js:13-23`, qui **énumère les cinq noms en dur** et les cherche par
  la regex `name:\s*'X',\s*required:\s*true` (`:19`).
- **N2 — `files` ne peut PAS porter `install.mjs`, et n'a AUCUN besoin de le porter.**
  `install.mjs` vit à la **racine du dépôt**, soit **un niveau AU-DESSUS** du répertoire de paquet
  (`cli/`). Les motifs de `files` sont relatifs à la racine du paquet et `npm pack` n'archive que
  ce répertoire : aucune entrée de `cli/package.json#files` ne peut désigner `../install.mjs`
  (§ 0.4). **Et c'est sans objet** : dès que `bundle.js` le copie dans `cli/_bundled/`, l'entrée
  `"_bundled"` **déjà présente** (`cli/package.json:14`) le couvre. ⇒ **`cli/package.json` n'est
  pas à modifier par ce lot.** *(Preuve que le mécanisme fonctionne : `cli/_bundled/` est
  **gitignoré** — `cli/.gitignore:3` — et part pourtant dans le tarball, mesuré à 546 fichiers par
  le 3ᵉ gate qualité, cité en `cli/src/lib/network-double.js:10-11`.)*
- **N3 — `copyDir` ne sait pas copier un FICHIER, et l'échec n'est pas propre.**
  `cli/scripts/bundle.js:33-40` fait `fs.mkdirSync(dst)` **puis** `fs.readdirSync(src)`. Sur une
  entrée fichier, il **crée d'abord un répertoire parasite `_bundled/install.mjs`**, puis
  `readdirSync` lève `ENOTDIR` **non rattrapé**. ⇒ **Ajouter naïvement `{ name: 'install.mjs' }`
  à `ASSETS` casse le prepack et laisse un déchet derrière lui.** Le geste exige une branche
  fichier explicite.
- **N4 — Bundler sans toucher la résolution ne sert à RIEN.** `cli/src/lib/reservoir.js` code
  `installMjsPath: null` **en dur** sur la branche embarquée, à deux endroits : `:134-136`
  (aucun vivant) et `:153` (`source === 'vivant' ? … : null`, cas du vivant plus ancien).
  **Un `install.mjs` embarqué que personne ne cherche est un octet de plus dans le tarball, pas une
  réparation.**
- **N5 — Le geste, s'il s'arrête au bundle et à la résolution, OUVRE UN CRASH.**
  `cli/src/commands/install.js:220-221` dérive `kitsDir` de `reservoir.vivantRoot`, et la garde
  AR-1 fait de même en `:292-298`. Aujourd'hui c'est sûr, parce que `installMjsPath` non nul
  **implique** `vivantRoot` non nul. **Cette implication tombe avec ce lot** : embarqué porteur ⇒
  `vivantRoot === null` ⇒ `path.join(null, 'kits')` lève un `TypeError`. ⇒ **`kitsDir` doit être
  dérivé du réservoir QUI PORTE LA CHARGE, jamais du vivant.**
- **N6 — Six énoncés vivants deviennent faux (ou le sont déjà).** Registre complet en **§ 7**.
  Cinq deviennent faux par ce lot ; le sixième — `install.mjs:50` — est **faux depuis 2026-07-18**
  et c'est `COMMENTAIRE-FAUX-INSTALL-MJS-50`.
- **N7 — Trois tests assertent aujourd'hui le contraire de ce qu'on va livrer, et l'un d'eux
  deviendrait NON DÉTERMINISTE.** `cli/test/reservoir-ar-f.test.js:74` et `:94` assertent
  `installMjsPath === null` sur l'embarqué ; `cli/test/install-verbe.test.js:176` asserte le
  **texte** du refus. Pire : ces tests lisent le **`cli/_bundled/` ambiant**, dont la présence
  n'est pas garantie — **mesuré : `cli/_bundled/*` ne ramène AUCUN fichier dans ce worktree**
  (répertoire généré, gitignoré). Après réparation, leur verdict dépendrait de « quelqu'un
  a-t-il lancé `npm run bundle` sur ce poste ? ». **Un test dont le résultat dépend de l'ambiance
  n'est pas une garde.** `cli/test/bundle-assets.test.js:36` connaît déjà ce piège et le contourne
  par un `return` — remède acceptable pour lui, **inacceptable pour la garde centrale de ce lot**.
- **N8 — `install.mjs` voyage sans rien emporter d'autre, et se résout nativement depuis
  `_bundled/`.** Imports : `node:fs`, `node:path`, `node:os`, `node:readline`, `node:url`
  (`install.mjs:34-38`) — **que des modules internes de Node**, zéro dépendance (et
  `cli/package.json` ne porte **aucun** champ `dependencies`). **Un seul chemin relatif lu** :
  `path.join(HERE, 'kits')` (`install.mjs:40`, `:423`), et **encore n'est-ce qu'un défaut** —
  `install.js` passe `--kits-dir` explicitement (`install.js:242`). Comme `kits` est **déjà** un
  asset requis, `_bundled/kits/` se trouve **à côté** de `_bundled/install.mjs` : le défaut se
  résout juste. **N'écrit jamais dans le paquet** : uniquement dans les cibles (`~/.claude`,
  `~/.codex`) et les backups. **⇒ Réponse mesurée au point 5 du brief : rien d'autre ne part avec
  lui, et il n'y a pas de chemin relatif à réparer.**
- **N9 — Ce qui doit arriver chez l'utilisateur est CHIFFRABLE, donc une amputation silencieuse est
  détectable.** Le kit `claude` porte, mesuré : **1** `global/CLAUDE.md`, **1**
  `global/settings.example.json`, **6** `global/hooks/*.mjs`, **35** `.claude/commands/*.md`.
  **Ni `.claude/skills/` ni `.claude/agents/` n'existent** — `planNamedSet` rend alors une liste
  vide et imprime `(rien a poser)` **sans erreur** (`install.mjs:264-268`, `:381`). ⚠️ **C'est le
  mode d'échec silencieux que ce lot doit fermer** : si `npm pack` amputait le **dot-répertoire**
  `.claude/` du kit embarqué, l'étape 2 poserait `CLAUDE.md` et les hooks, **annoncerait un
  succès**, et l'utilisateur n'aurait **aucune** commande. Un critère qui se contente de vérifier
  `CLAUDE.md` **ne verrait rien**. → **CA-B5, qui compte.**

### 0.4 — Le fait externe, vérifié ce jour (et ce que je n'en signe pas)

**Ce que dit la documentation npm** : le champ `files` est une liste de **motifs de fichiers**,
de syntaxe voisine de `.gitignore` mais inversée, décrivant les entrées incluses **quand le paquet
est installé comme dépendance** ; les motifs sont **relatifs à la racine du paquet**, et un
`.npmignore` placé à cette racine **ne prime pas** sur `files` (ce qui explique que `_bundled/`,
pourtant gitignoré, parte quand même). **Rien dans cette syntaxe ne permet de remonter au-dessus
de la racine du paquet**, et `npm pack` n'archive que ce répertoire.

**Ce que je n'affirme pas.** Je n'ai **pas** exécuté `npm pack`. Je n'ai donc **pas** de preuve
d'exécution que le dot-répertoire `.claude/` du kit survit à l'empaquetage sur la version de npm
installée ici. **Cette incertitude est le cœur de N9** : elle est renvoyée à **CA-B5**, qui la
mesure sur un paquet réellement produit, extrait et installé — la seule preuve qui vaille.

---

## 1. Problème

`install.mjs` — la **charge de l'étape 2** de la chaîne d'installation — ne part dans **aucun**
artefact publié. Un CLI installé par la **voie publique actée par AR-H(a)** (tarball de release
GitHub, `npm install -g <fichier>.tgz`) ne peut donc **structurellement pas** poser la méthode.
Formulé par le gate 🏹 Legolas et non rediscuté : **la chaîne est complète pour quiconque a déjà un
réservoir vivant sous la main, et amputée pour celui à qui elle s'adresse.**

Le lot A a **déclaré** l'impasse au lieu de la masquer (CA-21, R10) — c'était le comportement
attendu. **Ce lot-ci la répare.**

---

## 2. Décision retenue

> **`install.mjs` est copié dans `cli/_bundled/` par le prepack, comme asset REQUIS ; la résolution
> de réservoir apprend à l'y trouver ; l'étape 2 dérive son `--kits-dir` du réservoir qui porte la
> charge, jamais du vivant.**

**Un seul emplacement, une seule vérité.** `_bundled/install.mjs`, à côté de `_bundled/kits/`.

### 2.1 — Ce qui est écarté, avec le motif (réponse directe au point 1 du brief)

| Voie proposée | Verdict | Motif mesuré |
|---|---|---|
| Ajouter `install.mjs` à `ASSETS` de `bundle.js` | ✅ **retenu, mais insuffisant seul** | Nécessaire (N1) ; ne suffit pas (N4 : personne ne l'y cherche ; N5 : et ce qui l'y chercherait planterait). Exige en outre une **branche fichier** dans `copyDir` (N3). |
| Ajouter `install.mjs` à `files` de `cli/package.json` | ❌ **impossible ET sans objet** | Le fichier vit **au-dessus** de la racine du paquet : aucun motif de `files` ne peut le désigner (N2, § 0.4). Et une fois dans `_bundled/`, l'entrée `"_bundled"` **existante** le couvre déjà. **`cli/package.json` n'est pas touché par ce lot.** |
| **Les deux** | ❌ **écarté** | La moitié « `files` » est un no-op ; l'écrire donnerait l'illusion d'une seconde garde là où il n'y en a aucune. |
| Une **copie à la racine du tarball** (déplacer `install.mjs` dans `cli/`, ou en poser un double) | ❌ **écarté** | **Deux copies = deux vérités**, et la première question du premier bug sera « laquelle a tourné ? ». Déplacer la source casserait en outre le défaut `HERE/kits` (N8), la convention de **frame** (une frame est un snapshot de la racine, `install.mjs` y atterrit **à la racine**, cf. `install.mjs:2-6`) et tous les pointeurs de doc (`README.md:90`, `:120`, `:130`, `:227`). |

### 2.2 — Ce que la voie retenue rend vrai, et qui ne l'est pas aujourd'hui

`_bundled/install.mjs` a `_bundled/kits/` **pour voisin immédiat** (N8), donc le défaut
`--kits-dir` du fichier se résout **sans que personne n'ait à le savoir**. C'est la raison
technique pour laquelle cet emplacement-là, et pas un autre, est le bon.

---

## 3. Arbitrages — ce que je ne peux pas trancher seul

*Deux questions changent un comportement observable chez l'utilisateur. Recommandation donnée pour
chacune ; **le verdict appartient au décideur**.*

> **Verdicts rendus le 2026-09-04 par Stéphane** (relayés par 🟠 Aragorn, mot pour mot : *« a, a »*) :
> **AR-I → (a)** — le réservoir désigné par AR-F porte aussi la charge de l'étape 2 ; un vivant plus
> ancien cède la place à l'embarqué, et le message de l'étape 2 nomme le chemin du réservoir porteur
> (CA-B4). Ce verdict ferme du même coup l'écart relevé par le gate du lot C.1 (refus faux « aucun
> réservoir vivant avec install.mjs » + reprise inopérante quand le vivant est plus ancien,
> `docs/qualite/gate-lot-C1-moteur-chaine.md`). **AR-J → (a)** — la garde sur le tarball réel entre au
> périmètre (CA-B6 actif), avec la neutralisation obligatoire de CA-B7.

### AR-I — Quel réservoir porte la charge de l'étape 2 quand l'embarqué gagne ?

Le lot rend l'embarqué **capable** de porter la charge. Reste à dire **quand** il la porte.

- **(a) Le réservoir DÉSIGNÉ par AR-F porte la charge.** Vivant gagnant → `<vivant>/install.mjs` +
  `<vivant>/kits`. Embarqué gagnant — **vivant absent OU vivant plus ancien** → `_bundled/
  install.mjs` + `_bundled/kits`.
- **(b) L'étape 2 préfère toujours le vivant s'il en porte un**, même plus ancien ; l'embarqué
  n'est qu'un repli d'**absence**.
- **(c) Statu quo minimal** : l'embarqué ne sert que si aucun vivant n'existe ; un vivant **plus
  ancien** continue de faire **refuser** l'étape 2.

**Recommandation : (a).** Trois motifs, dans l'ordre de force. **(1)** La ligne de provenance est
imprimée à l'**étape 1** et vaut pour la chaîne ; si l'étape 2 déléguait à un réservoir **autre**
que celui annoncé, **la provenance mentirait** — c'est exactement le défaut qu'AR-F conséquence 3
existe pour interdire. **(2)** (c) conserve un refus dont **la cause vient de disparaître** : un
utilisateur nominal qui a par ailleurs un vieux clone à côté serait refusé **alors que la charge
est là**. **(3)** (b) fait diverger étape 1 et étape 2 **sans énoncer la divergence**.
**Coût du (a), dit** : dans le cas « vivant plus ancien », ce qui atterrit dans `~/.claude` vient
désormais de l'**embarqué**, pas du clone que le décideur a sous les yeux. **Contrepartie
obligatoire** : le message de l'étape 2 **nomme le chemin exact** du kit posé — il le fait déjà
(`quoi : kit(s) hôte(s) [...] depuis <kitsDir>`, `install.js:224`), et **ce chemin doit devenir
celui du réservoir porteur**, pas rester celui du vivant. → **CA-B4.**

### AR-J — La garde sur le TARBALL entre-t-elle au périmètre ?

- **(a) Oui** : un test **empaquette réellement** et vérifie que `_bundled/install.mjs` **et**
  `_bundled/kits/**` figurent dans ce qui part.
- **(b) Non** : la garde `required` du prepack suffit.

**Recommandation : (a).** `required: true` garantit que **la source existe** dans le dépôt au
moment du prepack — **jamais que la copie part**. Trois chemins ré-amputeraient le paquet **sans
que cette garde ne bouge d'un pouce** : une modification de `files`, l'apparition d'un `.npmignore`,
un changement de traitement des **dot-répertoires** par npm (N9 — celui-là n'est même pas
hypothétique, je ne peux pas le trancher par lecture, § 0.4). Le corpus a déjà tranché cette
classe : **une preuve se compare au fichier, pas à une autre sortie.** Une garde qui ignore le
composant qu'on vient d'ajouter serait **verte et muette** — l'état que ce corpus qualifie de pire
pour une garde.
**Coût du (a), dit, et il n'est pas nul** : le test **lance un vrai `npm pack`**, donc le
**prepack**, donc il **RÉGÉNÈRE `cli/_bundled/`** — un **effet de bord sur l'arbre de travail**.
**Neutralisation obligatoire, inscrite** : **aucun autre test ne doit dépendre de la présence
ambiante de `cli/_bundled/`** (→ point d'injection, § 5 étape 3, et CA-B7). Sans cette
neutralisation, (a) rendrait la suite **dépendante de son propre ordre d'exécution** — un défaut
pire que celui qu'il répare.

---

## 4. CA-21 après réparation — verdict demandé au point 4 du brief

**CONFIRMÉ QUANT AU PRINCIPE. INFIRMÉ QUANT À LA LETTRE.** Et cette nuance n'est pas rhétorique :
laisser le texte intact **exigerait une régression**.

**Ce que dit CA-21 aujourd'hui** : *« Sur un poste sans réservoir vivant à proximité — cas de
l'utilisateur nominal installé par la voie publique (AR-H(a)) —, l'étape 2 REFUSE en nommant la
cause. »*

**Pourquoi la lettre tombe.** Après ce lot, sur ce poste-là, la charge **n'est plus introuvable** :
elle est dans le paquet. Exiger un **refus** reviendrait à exiger que la réparation ne serve à
rien. Et le test qui le prouve (`install-verbe.test.js:160-177`) asserte le **texte** `L'embarqué
(_bundled/) ne porte PAS d'install.mjs` — une phrase qui devient **fausse** : le laisser vert
serait un test qui **certifie un mensonge**, la classe de défaut exacte de **R11**. Il deviendrait
en outre **non déterministe** (N7).

**Pourquoi le principe tient — et c'est votre raisonnement, il est juste.** CA-21 ne couvre pas un
**exemplaire**, il couvre une **forme de défaillance** : *aucune charge de méthode n'est
résoluble ⇒ refus explicite qui nomme quoi manque et où c'était cherché ; ni succès silencieux, ni
erreur obscure, ni étape sautée sans le dire*. **Cette forme survit intacte.** Seul son
**déclencheur** change :

| | Déclencheur avant ce lot | Déclencheur après ce lot |
|---|---|---|
| **Exemplaire** | poste sans réservoir vivant | **bundle amputé** (embarqué sans `install.mjs` : arbre de dev sans `_bundled/`, paquet tronqué, extraction partielle) **ET** aucun vivant |
| **Forme** | *la charge est introuvable* | **inchangée** |

**C'est exactement le raisonnement de la branche « version indéterminée » d'AR-F**, et il faut le
tenir jusqu'au bout : *« On code la branche pour la **forme** de l'entrée, pas pour un
exemplaire. »* Là-bas, le cas était **structurellement possible et sans occurrence connue**, et
c'était **un motif suffisant**. Ici, il est possible **et il a une occurrence** — un clone frais
sans `npm run bundle`, **exactement l'état de ce worktree** (N7).

**⇒ CA-21 est réécrit en CA-21′ (§ 9), avec le même énoncé de forme, un déclencheur neuf, et un
point d'injection qui le rend déterministe. Le critère reste REQUIS. Il n'est pas supprimé, il est
daté et rectifié** — discipline de rectification du corpus, la même qui a traité l'illustration
`StefFrame2`.

---

## 5. Périmètre

### Inclus

1. **`cli/scripts/bundle.js`** — `install.mjs` devient un asset **`required: true`**, et `copyDir`
   gagne la branche **fichier** qui lui manque (N3).
2. **`cli/src/lib/reservoir.js`** — résolution de l'`install.mjs` **embarqué** (N4), suppression
   des deux `null` en dur, et **point d'injection du répertoire embarqué** pour rendre les gardes
   déterministes (N7, AR-J).
3. **`cli/src/commands/install.js`** — `kitsDir` dérivé du **réservoir porteur** à ses **deux**
   points d'usage (étape 2 `:220-221`, garde AR-1 `:292-298`), et **message de refus réécrit**
   (CA-21′).
4. **Les gardes** : `bundle-assets.test.js` étendu, les trois assertions retournées (N7), la garde
   de tarball si **AR-J(a)**, et la preuve **sur paquet réellement empaqueté, extrait et installé**.
5. **Le registre des énoncés faux** (§ 7) — **les six**, y compris
   `COMMENTAIRE-FAUX-INSTALL-MJS-50`.
6. **`docs/commandes.md:248`** — convention permanente du portefeuille : toute commande dont le
   comportement change est répercutée **dans le même lot**.
7. **Amendement daté** de `chaine-complete-install-amorcage-dmg-msi.md` : R10 **soldé**, CA-21 →
   CA-21′, § 5.4 rectifié, inconnue 4 du § 11 **fermée**. **Dater, jamais effacer.**

### Exclu — et ce sont des exclusions décidées, pas des oublis

- **`cli/package.json`** : rien à y faire (N2). Si un exécutant y touche, il s'est trompé de
  diagnostic.
- **Toute réécriture de la LOGIQUE d'`install.mjs`.** Ce lot **corrige un commentaire faux** dans
  ce fichier (§ 7, ligne 50) et **rien d'autre**. Pas un planner, pas un drapeau, pas un message.
- **Le déploiement des `agents/` et `skills/` par `install.mjs`** : le kit `claude` ne porte
  **ni** `.claude/agents/` **ni** `.claude/skills/` (N9), tandis que `agents` et `skills` sont
  bundlés comme assets **séparés**. C'est un **écart préexistant**, cadré ailleurs
  (`deploiement-skills-runtime.md`). **Ne pas l'ouvrir ici** — ce serait le « tant qu'on y est »
  que la méthode interdit.
- **Le drapeau `--reservoir bundled`** : reste hors périmètre (`RESERVOIR-FORCAGE-EMBARQUE`,
  AR-F conséquence 4). Le point d'injection de l'étape 3 est un **paramètre interne de test**,
  **jamais** un drapeau de ligne de commande, **jamais** documenté dans `--help`. La distinction
  est celle, déjà éprouvée, de `lib/network-double.js`.
- **Le câblage réel d'AR-1** (note factuelle du 2026-09-04, § 5.5 de l'instruction parente) : reste
  un contrat, pas un chemin de code. Ce lot **n'y touche pas** ; il se contente de ne pas casser la
  garde confinée à la transition étape 1 → étape 2.
- **Les étapes 3 et 4** de la chaîne (lot C.1).

---

## 6. Étapes d'implémentation

1. **`copyDir` apprend les fichiers.** Dans `cli/scripts/bundle.js`, brancher sur la nature de la
   source : répertoire → comportement actuel ; fichier → `fs.mkdirSync(path.dirname(dst))` +
   `fs.copyFileSync`. **Ne jamais `mkdirSync(dst)` sur une entrée fichier** (N3 : c'est ce qui
   crée le répertoire parasite).
2. **`install.mjs` entre à `ASSETS`, requis.** ⚠️ **Piège mesuré** : la doublure de test cherche
   littéralement `name: 'X', required: true` (`bundle-assets.test.js:19`) — **`required` doit rester
   immédiatement après `name`** (un champ `kind` intercalé casserait la regex sans que personne ne
   comprenne pourquoi). Étendre en outre la liste en dur de `bundle-assets.test.js:16` à
   `install.mjs`. Le commentaire `:15-21` qui motive `required: true` (« on refuse de produire un
   bundle mutilé plutôt que de publier en silence ») **s'applique désormais à la charge de l'étape
   2 — le dire**.
3. **`reservoir.js` — résoudre l'embarqué, et rendre la garde déterministe.**
   - `embarqueInfo()` gagne le chemin `<embarqueDir>/_bundled/install.mjs` **s'il existe** ; sinon
     `null` — **jamais un chemin fabriqué qui n'existe pas**.
   - `resoudreReservoir` : supprimer les deux `null` en dur (`:134-136`, `:153`) et renseigner
     `installMjsPath` selon **AR-I** une fois tranché.
   - Ajouter, **à côté** de `installMjsPath`, **les DEUX chemins consultés** (candidat vivant et
     candidat embarqué) : ce sont eux que le refus de CA-21′ doit nommer.
   - **Point d'injection** : `resoudreReservoir({ root, embarqueDir })` — paramètre **optionnel**,
     défaut = `embarqueDir()`. Il n'existe que pour que les gardes construisent un embarqué
     **contrôlé** au lieu de lire l'ambiant (N7). **Interne, non exposé en CLI.**
   - **Ne pas toucher au format de la ligne de provenance** : les trois gabarits d'AR-F
     conséquence 3 sont un verdict validé, ils arbitrent des **versions** et restent exacts. La
     charge absente se dit **dans le refus de l'étape 2**, pas dans la provenance.
4. **`install.js` — dériver le `kitsDir` du porteur.** Aux **deux** points (`:220-221` et
   `:292-298`), remplacer `path.join(reservoir.vivantRoot, 'kits')` par le répertoire **du
   réservoir qui porte `installMjsPath`** — c'est-à-dire, dans tous les cas,
   `path.dirname(installMjsPath) + '/kits'`, ce qui est vrai pour le vivant **comme** pour
   `_bundled/`. **N5 : sans cette étape, le lot livre un `TypeError`.**
5. **Réécrire le refus de l'étape 2** (`install.js:214-218`) : il doit nommer **quoi** manque et
   **où** ç'a été cherché — **les deux** chemins. Forme imposée :
   ```
   REFUS : la charge de la méthode (install.mjs) est introuvable.
     cherchée : <candidat vivant>/install.mjs   (réservoir vivant)
                <embarqué>/_bundled/install.mjs (réservoir embarqué)
     cause : ni l'arbre vivant ni le paquet embarqué ne la portent — un paquet publié qui ne
             la porte pas est un bundle incomplet (garde `required` de cli/scripts/bundle.js).
     Reprise : iakaframe install --root <chemin-vers-un-clone-iakaframe>
   ```
   **Aucune phrase affirmant que `_bundled/` ne porte pas `install.mjs`** : ce serait rejouer le
   défaut qu'on répare.
6. **Retourner les trois assertions** (`reservoir-ar-f.test.js:74`, `:94` ;
   `install-verbe.test.js:176`) sur l'embarqué **injecté**, jamais sur l'ambiant.
7. **Garde de tarball**, si **AR-J(a)** : empaqueter réellement, et vérifier la présence de
   `_bundled/install.mjs` **et** de `_bundled/kits/**` dans ce qui part. **SKIP explicite avec son
   code si l'environnement ne peut pas empaqueter — jamais un vert** (convention du corpus, cf.
   `vitrine:en-ligne` et `registre:repli-latest`, `cli/package.json:22`, `:24`).
8. **La preuve packagée** (CA-B5) : empaqueter, **extraire**, **installer**, et faire poser
   l'étape 2 **depuis la copie installée**, sur un poste **sans réservoir vivant**. Compter ce qui
   atterrit (N9). ⚠️ **Voir R-C avant d'écrire ce test.**
9. **Le registre des énoncés** (§ 7) : les six, à la main, **relus sur le disque après écriture**.
10. **`docs/commandes.md:248`** et **l'amendement daté** de l'instruction parente.

---

## 7. Registre des énoncés qui deviennent faux — à corriger, un par un

*Ce lot **déplace un objet** ; toute phrase qui décrivait sa position devient une prétention. Un
énoncé faux laissé dans le code **a déjà contaminé un cadrage de cette série** (R11). Le tableau
est la liste **exhaustive à ma mesure** ; il est vérifiable par balayage (CA-B8).*

| # | Emplacement | Énoncé | Ce qu'il devient |
|---|---|---|---|
| E-1 | `cli/src/lib/reservoir.js:56-58` | « `_bundled/`, **lequel N'A PAS d'install.mjs**, cf. `cli/scripts/bundle.js:ASSETS` » | **FAUX.** Le motif **juste** qui le remplace : `install.mjs` marque *un arbre capable d'EXÉCUTER l'étape 2* — ce qui devient vrai de `_bundled/` **et c'est le but du lot**. |
| E-2 | `cli/src/lib/reservoir.js:134-136` | « AUCUN install.mjs embarqué (`cli/scripts/bundle.js` ne le copie pas) » | **FAUX.** Le commentaire disparaît avec le `null` qu'il justifiait. |
| E-3 | `cli/src/commands/install.js:216` | message **imprimé à l'utilisateur** : « L'embarqué (`_bundled/`) ne porte PAS d'install.mjs » | **FAUX, et le plus grave** : c'est le seul qui soit **lu par l'utilisateur**. Remplacé par le refus de l'étape 5. |
| E-4 | `cli/test/reservoir-ar-f.test.js:74` | « embarqué gagnant : aucun install.mjs (le `_bundled` n'en porte pas) » | **FAUX** — et l'assertion avec. |
| E-5 | `docs/commandes.md:248` | « délègue à `install.mjs` **trouvé dans le réservoir vivant** ; refuse explicitement si aucun réservoir vivant n'en porte un (l'embarqué `_bundled/` n'en contient pas) » | **FAUX.** À réécrire selon **AR-I** une fois tranché. |
| E-6 | **`install.mjs:50`** | « la frame embarque install.mjs **SANS cli/** » | **DÉJÀ FAUX depuis le 2026-07-18.** Re-mesuré ce jour : `frames/releases/StefFrame2/cli/package.json` **existe** et porte `"version": "0.1.0"` ; le balayage `frames/releases/*/cli/package.json` ne ramène **que cette entrée**. → § 8 ci-dessous. |

### `COMMENTAIRE-FAUX-INSTALL-MJS-50` — verdict demandé au point 6 du brief

**OUI, il entre dans ce lot.** Votre avis est le mien, et il a un motif plus fort que « c'est le
moment ou jamais » :

1. **La condition d'exclusion est explicitement tombée.** L'instruction parente l'excluait parce
   qu'`install.mjs` y était « **appelé, non modifié** » (§ 7) et disait : *« à corriger dans un lot
   qui touche `install.mjs` »*. **Ce lot est ce lot.**
2. **Ce lot fabrique le motif juste.** La conclusion du commentaire — *pas d'import de
   `cli/src/lib/vocab.js`* — **reste vraie** ; c'est sa **prémisse** qui est fausse. Et la prémisse
   correcte est **produite par ce lot** : `install.mjs` doit tourner **depuis n'importe quel
   emplacement** — racine de dépôt, racine de frame, et désormais **`cli/_bundled/`** — sans jamais
   supposer un `cli/` voisin. **Un motif indépendant de l'emplacement, donc qui ne peut plus être
   démenti par une mesure.**
3. **Le laisser serait pire qu'avant.** Ce lot **déplace** `install.mjs` ; publier un lot qui
   déplace un objet **en laissant vivre une phrase fausse sur l'endroit où il se trouve** serait
   la faute au carré.

**Borne stricte** : on corrige **la prémisse**, on **garde la décision**, on **date** la
rectification. **Aucune autre ligne d'`install.mjs` ne bouge.**

---

## 8. Fichiers concernés

- `cli/scripts/bundle.js` — branche fichier de `copyDir` (`:33-40`) ; entrée `install.mjs` requise
  dans `ASSETS` (`:22-31`) ; commentaire `:15-21` étendu à la charge de l'étape 2.
- `cli/src/lib/reservoir.js` — `embarqueInfo` (`:43-52`), marqueur et son motif (`:55-58`),
  `resoudreReservoir` (`:120-156`), les deux `null` (`:134-136`, `:153`), point d'injection
  `embarqueDir`.
- `cli/src/commands/install.js` — refus de l'étape 2 (`:214-218`), `kitsDir` (`:220-221`), garde
  AR-1 (`:292-298`).
- `install.mjs` — **ligne 50 SEULEMENT** (E-6). **Aucune autre modification.**
- `cli/test/bundle-assets.test.js` — liste en dur (`:16`) étendue.
- `cli/test/reservoir-ar-f.test.js` — assertions `:74`, `:94` retournées sur embarqué **injecté**.
- `cli/test/install-verbe.test.js` — assertion `:176` remplacée (CA-21′).
- `cli/test/bundle-tarball.test.js` *(neuf, si AR-J(a))* — la garde sur ce qui part réellement.
- `cli/test/install-paquet-publie.test.js` *(neuf)* — la preuve packagée (CA-B5).
- `docs/commandes.md:248` — E-5.
- `specs/instructions/chaine-complete-install-amorcage-dmg-msi.md` — amendement daté (§ 5.4, R10,
  CA-21 → CA-21′, § 11 inconnue 4).
- **`cli/package.json` — NON MODIFIÉ** (N2). Listé ici **pour que son absence soit un fait, pas un
  oubli**.

---

## 9. Risques

| # | Risque | Mitigation |
|---|---|---|
| **R-A** | **Le geste s'arrête au bundle.** `install.mjs` part dans le tarball, personne ne l'y cherche (N4), et le lot **paraît** fait : la garde `required` est verte, le fichier est là, et l'utilisateur nominal est **toujours** dans l'impasse. **C'est le mode d'échec le plus probable de ce lot.** | **CA-B5 est la seule preuve admise** : elle mesure sur un paquet **réellement empaqueté, extrait et installé**, pas sur la liste des assets. Aucun critère de ce lot ne se satisfait d'un contenu de tarball. |
| **R-B** | **Le geste ouvre un `TypeError`** : embarqué porteur ⇒ `vivantRoot === null` ⇒ `path.join(null, 'kits')` (N5), aux **deux** points d'usage — et le second (garde AR-1) est **plus discret** que le premier. | Étape 4, **les deux points nommés**. CA-B4 exerce le chemin embarqué **de bout en bout**, garde AR-1 comprise. |
| **R-C** | **Un test qui lance `iakaframe install --yes` contre le réseau RÉEL peut exécuter un vrai `npm install -g`.** Le double réseau **ne se charge pas** depuis un paquet installé (`cli/test/` n'est jamais publié) : `network-double.js:42-49` **replie sur les sondes réelles** en le disant. Un `--yes` naïf sur paquet installé peut donc **modifier la machine du testeur**. | **La preuve packagée n'appelle JAMAIS la chaîne complète.** Elle appelle `etape2Methode` **importée depuis la copie installée** — même code de production, point d'entrée différent, **exception déjà pratiquée et motivée** dans `install-verbe.test.js:155-159`. L'étape 1 et son réseau sont couverts ailleurs (`etape1-reseau-ecarte.test.js`). |
| **R-D** | **La garde de tarball rend la suite dépendante de son ordre** : elle régénère `cli/_bundled/` (AR-J), ce qui change ce que lisent les tests qui interrogent l'ambiant (N7). | **Interdiction inscrite** : aucun test ne dépend de la présence ambiante de `cli/_bundled/`. Le point d'injection de l'étape 3 est ce qui rend l'interdiction **tenable**. → CA-B7. |
| **R-E** | **Amputation SILENCIEUSE des dot-répertoires du kit** : si `.claude/commands/` ne survivait pas à l'empaquetage, l'étape 2 poserait `CLAUDE.md` et les hooks, **annoncerait un succès**, et l'utilisateur n'aurait **aucune commande** — `planNamedSet` rend une liste vide **sans erreur** (N9). **Un critère qui ne vérifie que `CLAUDE.md` ne verrait rien.** | **CA-B5 COMPTE** ce qui est posé et le **compare au kit source du clone**, jamais à un nombre écrit en dur — *une preuve se compare au fichier*. |
| **R-F** | **Le lot répare le symptôme et laisse la classe ouverte** : `files`, un `.npmignore`, une évolution de npm peuvent ré-amputer le paquet sans qu'aucune garde ne bouge. | **AR-J(a)**, recommandé. Si le décideur tranche **(b)**, la classe reste ouverte : **le dire dans le lot**, avec successeur nommé — jamais un silence. |
| **R-G** | **Une correction partielle laisse un doublon ou un résidu** : six énoncés à corriger dans sept fichiers, c'est exactement la situation où une édition partielle survit. | **Balayage vérifiable (CA-B8)** + relecture sur disque après écriture (`preuve-avant-declaration`). |
| **R-H** | **Le marqueur `install.mjs` perd son pouvoir discriminant** : `_bundled/` devient un arbre « porteur », donc un `--root <…/cli/_bundled>` explicite serait vu comme un vivant. | **Bénin par construction** : les deux réservoirs ne sont **jamais** résolus par le même chemin (`candidateVivantRoot` vs `embarqueDir`). Mais **le commentaire E-1 doit être réécrit avec un motif qui survit** — pas rafistolé. |

---

## 10. Critères d'acceptation

*Numérotés `CA-B*` pour ne **jamais** collisionner avec les CA-01..CA-21 de l'instruction parente.*

- [ ] **CA-B1** — `install.mjs` figure dans `ASSETS` de `cli/scripts/bundle.js` avec
      **`required: true`**, et `cli/test/bundle-assets.test.js` l'inclut dans sa liste énumérée.
      **Contrefactuel obligatoire** : source retirée ⇒ le prepack **REFUSE** avec
      `bundle REFUSE : asset(s) requis manquant(s) : install.mjs` et **sort en code 1**. *Une garde
      qui ne peut pas rougir n'est pas une garde.*
- [ ] **CA-B2** — Après un bundle, `cli/_bundled/install.mjs` est un **FICHIER** (jamais un
      répertoire, N3), **identique octet pour octet** à `install.mjs` de la racine — comparé au
      **fichier**, pas à une sortie de script.
- [ ] **CA-B3** — `cli/package.json` est **inchangé par ce lot** (`git diff` vide sur ce fichier).
      *Critère en négatif, délibéré : il interdit le geste inutile de N2.*
- [ ] **CA-B4** — **AR-I une fois tranché** : sur un embarqué **injecté** portant `install.mjs` +
      `kits/`, l'étape 2 **délègue** et **nomme le chemin réel** du kit posé — et la garde AR-1
      (`install.js:292-298`) **traverse le même chemin sans lever**. **Contrefactuel R-B** :
      exercé avec `vivantRoot === null`, aucune exception n'est levée.
- [ ] **CA-B5** — **LA PREUVE, et la seule qui vaille.** Sur un paquet **réellement empaqueté**
      (`npm pack`), **extrait** et **installé** (préfixe temporaire, jamais global), l'étape 2
      appelée **depuis la copie installée** (R-C : jamais la chaîne complète), sur un poste
      **sans réservoir vivant**, pose dans une cible temporaire :
      **(a)** `CLAUDE.md` portant le bloc `<!-- iakaframe:start -->` ;
      **(b)** `settings.json` ;
      **(c)** `hooks/*.mjs` **en nombre ÉGAL** à `kits/iakaframe-claude/global/hooks/*.mjs` du
      clone ;
      **(d)** `commands/*.md` **en nombre ÉGAL** à `kits/iakaframe-claude/.claude/commands/*.md`
      du clone. **Aucun nombre écrit en dur** (R-E) : la comparaison se fait **contre le kit
      source**. Si l'environnement ne peut pas empaqueter : **SKIP explicite avec son code, jamais
      un vert.**
- [ ] **CA-B6** *(si **AR-J(a)**)* — Un empaquetage réel liste `_bundled/install.mjs` **et**
      `_bundled/kits/**` parmi ce qui part. **Contrefactuel** : entrée retirée d'`ASSETS` ⇒ la
      garde **rougit en nommant le fichier manquant**.
- [ ] **CA-B7** — **Aucun test de la suite ne dépend de la présence ambiante de `cli/_bundled/`.**
      Éprouvé en jouant la suite **deux fois** — `cli/_bundled/` absent, puis présent — pour un
      **verdict identique**. *(R-D : sans ce critère, AR-J(a) empoisonne la suite.)*
- [ ] **CA-B8** — **Registre des énoncés (§ 7) soldé.** Un balayage du dépôt sur le vocabulaire
      `N'A PAS d'install\.mjs|ne porte PAS d'install\.mjs|ne le copie pas|n'en contient pas|SANS
      cli/` ne ramène **aucune occurrence vivante** — à l'exception des **rectifications datées**
      des fichiers d'instruction, qui **citent** l'énoncé faux pour le marquer et sont **nommées
      une à une** dans le commit. *(La liste de motifs est un **exemple**, pas une énumération :
      les six lignes du § 7 se vérifient **à la lecture**, jamais par le seul grep — angle mort
      déclaré, même discipline que le registre du `latest`.)*
- [ ] **CA-B9** — **CA-21′**, forme conservée, déclencheur neuf : **ni vivant, ni embarqué
      porteur** ⇒ l'étape 2 **REFUSE**, nomme **quoi** manque (`install.mjs`, la charge de la
      méthode) et **où** ç'a été cherché — **les DEUX chemins**, vivant candidat **et** embarqué.
      **Ni succès silencieux, ni erreur obscure, ni étape sautée sans le dire.** Éprouvé sur un
      embarqué **injecté et vide** (déterministe, N7). **Le message ne contient plus aucune
      affirmation sur ce que `_bundled/` ne porte pas.**
- [ ] **CA-B10** — `install.mjs:50` : **prémisse corrigée, décision conservée** (pas d'import de
      `cli/src/lib/vocab.js`), **rectification datée**. **Le reste d'`install.mjs` est
      inchangé** (`git diff` limité à ce commentaire).
- [ ] **CA-B11** — `docs/commandes.md:248` décrit le comportement **réel** de l'étape 2 après
      **AR-I** — **dans le même lot**, convention permanente du portefeuille.
- [ ] **CA-B12** — `chaine-complete-install-amorcage-dmg-msi.md` porte l'amendement **daté** :
      **R10 soldé** (avec le commit qui le solde), **CA-21 → CA-21′**, § 5.4 rectifié, **inconnue 4
      du § 11 fermée**. **La rédaction d'origine est conservée, pas effacée.**
- [ ] **CA-B13** — Suite complète du CLI verte, **chaque commande avec SA ligne, SON code de sortie
      et SON chiffre**. Une formule d'ensemble (« tout est vert ») vaut **FAIL**.

---

## 11. Ce qui n'est PAS prouvable ici — gate humain, déclaré

| Prouvable sur ce poste (macOS arm64) | Non prouvable ici |
|---|---|
| CA-B1 à CA-B4, CA-B7 à CA-B13 · **CA-B5, qui est jouable en local** (`npm pack` + extraction + installation sous préfixe temporaire) | **Le parcours utilisateur réel de bout en bout** : télécharger le tarball d'une **release GitHub publiée**, `npm install -g`, puis `iakaframe install` **avec le réseau réel**. Il exige de **publier une release** — acte du décideur (§ 10 de l'instruction parente), et il exerce l'étape 1 contre le réseau vivant (R-C). |
| | Le comportement d'`npm pack` sur **une autre version de npm** que celle de ce poste — notamment sur les **dot-répertoires** (N9, § 0.4). CA-B5 le mesure **ici**, pas partout. |

**Non mesuré par moi, à mesurer par l'exécution avec sa sortie citée** : la sortie de `npm pack`
(liste et poids), et le décompte réel de ce qui atterrit dans la cible (CA-B5).

---

## 12. Estimation *(ordre de grandeur assumé et révisable — pas un engagement ferme)*

| Morceau | j-homme | Complexité / risque |
|---|---|---|
| `bundle.js` (branche fichier + asset requis + contrefactuel) | **0,1** | faible |
| `reservoir.js` (résolution embarquée + point d'injection) | **0,15** | **moyenne** — deux `null` en dur, et le point d'injection doit rester interne |
| `install.js` (2× `kitsDir` + refus réécrit) | **0,15** | **moyenne** — R-B est un crash, pas une gêne |
| Gardes retournées + CA-B5 (paquet empaqueté/extrait/installé) | **0,25** | **forte** — c'est là qu'est le risque réel du lot (R-C, R-E) |
| Registre § 7 + `docs/commandes.md` + amendement daté | **0,1** | faible, mais **fastidieux** (R-G) |
| **Sous-total, sans la garde de tarball** | **≈ 0,75** | |
| *(+ AR-J(a) : garde de tarball + neutralisation CA-B7)* | *+0,25* | *recommandé* |
| **Total recommandé (AR-J(a) inclus)** | **≈ 1** *(fourchette 0,5 – 1,5)* | **moyenne** |

**Écart avec mon chiffrage indicatif de 0,5 j, et sa raison** — § 0.2, G-d. Le 0,5 j comptait le
bundle. **Il ne comptait pas ce qui rend le bundle utile** (N4), **ni ce que le bundle casse**
(N5), **ni les six énoncés** (N6), **ni les trois tests à retourner** (N7). **Ce n'est pas une
dérive de périmètre : c'est une mesure qui n'avait pas été faite au moment du chiffrage.**

**Les trois inconnues qui peuvent le faire glisser :**
1. **La survie des dot-répertoires du kit à `npm pack`** (N9, R-E). Si `.claude/commands/` ne
   passait pas, ce lot **gagnerait un second problème** — réel, et de nature différente. **Non
   mesurable sans shell** ; c'est la seule inconnue qui pourrait doubler le coût.
2. **AR-J**, qui vaut ±0,25 j **et** décide si la classe de défaut reste ouverte.
3. **AR-I**, qui ne coûte presque rien à coder mais change **ce qui est écrit dans `~/.claude`**
   dans le cas « vivant plus ancien ». Un arbitrage bon marché, aux effets visibles.

**Effet sur le total du lot parent** : l'inconnue 4 du § 11 de
`chaine-complete-install-amorcage-dmg-msi.md` était chiffrée **+0,5 j non comptée**. **Elle passe
à ≈ 1 j et devient un lot autonome** : le total parent de **≈ 8,75 j** reste juste **pour son
périmètre**, et ce lot-ci s'ajoute **à côté** — il n'est ni fondu ni dissimulé dedans.

---

## 13. Vérification (gate du lot)

Suite complète du CLI verte, **ligne par ligne** · **contrefactuel sur chaque garde** — asset
requis retiré, `vivantRoot` nul, embarqué vide, `cli/_bundled/` absent puis présent —, chacun
**révoqué avec preuve** · **CA-B5 exécutée et sa sortie citée** (nombres posés vs nombres du kit
source) · balayage du registre § 7 **et** relecture des six lignes.

**Garde d'honnêteté, héritée et non négociable** : un critère **non mesuré** se déclare *non
mesuré*, **jamais** *PASS*. Une formule d'ensemble vaut **FAIL**.
