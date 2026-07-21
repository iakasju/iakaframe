# Instruction : le verdict de gate opposable — amender un principe dont la clause de contrôle est réfutée

> Cadrage Gandalf, 2026-07-21. Dépôt : **`iakaframe`** (source de la méthode).
> Volet **Q-3 du lot D-8**, resté ouvert quand D-8 a été livré côté `iakaFrameGUI`
> (`iakaFrameGUI/specs/instructions/d8-gate-menteur-mesure-avant-verdict.md` § 5.4, § 9 Q-3).
> Gate P1→P2 : **l'utilisateur (décideur)** tranche.

## 0. Outillage du cadrage — à lire avant de me croire

Cette session de cadrage disposait de **`Read`, `Grep`, `Glob`, `Write`, `Edit`, `WebSearch`,
`WebFetch`**. **Pas de `Bash`.** Aucune commande n'a été exécutée : `node --test`,
`iakaframe vendor-check` et `git log` n'ont **pas** été rejoués ici.

**Tout fait de cette instruction est établi par lecture de fichiers sur le disque**, et chacun est
vérifiable en rouvrant le fichier cité. Les affirmations qui *dépendraient* d'une exécution sont
**marquées comme telles** et renvoyées aux critères d'acceptation, qui, eux, seront exécutés.

C'est le sujet même de ce lot : je déclare mon instrument avant de rendre un constat.

---

## 1. Le fait central : le principe existe déjà, et il se trompe sur lui-même

Le backlog annonçait « graver le principe d'inopposabilité dans `iakaframe` ». **Le brief avait
raison de corriger le backlog, et sa correction est confirmée par la mesure.**

`library/principles/preuve-avant-declaration.md` **existe** (37 lignes lues), est **complet**, et est
**chargé par la méthode** : `methods/iakaframe.md:8` le porte dans `principleIds`, en 18ᵉ position.

Sa politique couvre déjà le fond du sujet :

> *Un agent ne déclare fait, livré ou supprimé que ce qu'il a constaté sur l'artefact produit […].
> Une intention d'action ne vaut pas constat.*

**Ce lot n'ajoute donc aucun principe. Il en amende un, sur le seul point que D-8 a réfuté.**

### 1.1 La clause réfutée

`library/principles/preuve-avant-declaration.md:28-29`, dernière section, textuellement :

> **Contrôle.** En **revue**, pas par une garde : rien ne distingue mécaniquement une déclaration
> constatée d'une déclaration supposée. Le principe est **contractuel** — il engage l'agent qui parle.

D-8 a construit un dispositif que cette clause déclare hors d'atteinte : un **format de verdict
contraint** (commande / code de sortie / sortie citée) qu'on **ne peut pas remplir de mémoire**. Un
agent peut écrire « PASS » de mémoire ; il ne peut pas inventer `Test Files 53 passed (53)`.

### 1.2 Ce que D-8 a réfuté **exactement** — et ce qu'il n'a pas réfuté

**C'est le point que ce cadrage refuse de surjouer, parce que le surjouer serait commettre la faute
que le lot ferme.**

| Énoncé de la clause | Statut après D-8 |
|---|---|
| « rien ne distingue **mécaniquement** une déclaration constatée d'une déclaration supposée » | **TOUJOURS VRAI.** Aucune garde ne lit le tableau de D-8. Aucun hook ne le contrôle. Une machine ne distingue toujours rien. |
| « donc le contrôle est **en revue**, et le principe est **contractuel seul** » | **RÉFUTÉ.** Le raisonnement saute une possibilité : entre la garde mécanique et la revue de bonne foi, il existe un **format qui rend la faute coûteuse à commettre et visible à lire**. |

**Le format contraint n'est pas une garde.** Il ne détecte rien tout seul. Ce qu'il fait est plus
modeste et plus efficace : il déplace la faute d'un **for intérieur invérifiable** (« ai-je vraiment
mesuré ? ») vers un **manque visible sur l'artefact** (une case vide, un « OK » sans chiffre). La
revue reste le contrôle — mais elle passe de *« juger la sincérité d'un agent »*, ce qu'un relecteur
ne sait pas faire, à *« regarder si la case contient un chiffre »*, ce que n'importe qui fait en
trois secondes.

**Conséquence rédactionnelle, opposable à l'exécutant** : l'amendement **ne doit pas** écrire que le
contrôle est désormais mécanique, ni qu'une garde existe. Ce serait déclarer plus que mesuré — la
faute exacte que le principe nomme. Il doit écrire qu'il existe **deux régimes de contrôle**, et
pourquoi le second est né d'une réfutation.

---

## 2. Fait mesuré non prévu par le brief — **la méthode prescrit aujourd'hui le format fautif**

**C'est la découverte principale de ce cadrage, et elle change la nature du lot.**

Le brief pose la question « où doit vivre le format de verdict dans `iakaframe` ? » en supposant
qu'il n'y vit nulle part. **Faux.** Un format de verdict **existe déjà**, il est **déclaré
obligatoire**, et **c'est précisément celui que D-8 condamne**.

`library/skills/iakaframe-qualite/SKILL.md:33-54`, section **« Format de sortie — OBLIGATOIRE »** :

```markdown
## Vérifications
| Contrôle | Résultat |
|---|---|
| Tests unitaires | {ok / N échecs} |
| Tests d'intégration | {ok / N échecs} |
| Lint | {ok / N alertes} |
| Typage | {ok / N erreurs} |
| Couverture | {X %} |
```

Confronté à la règle d'usage de D-8 (`iakaFrameGUI/CLAUDE.md` § Rendre un verdict de gate) :

> une case **vide**, un **« OK » sans chiffre**, ou un résumé **reformulé** ⇒ **FAIL**

**Le gabarit canonique de la méthode propose `ok` comme valeur de remplissage nominale.** Il ne
demande **aucune commande**, **aucun code de sortie**, **aucune sortie citée**. Il est remplissable
intégralement de mémoire, en toute bonne foi, par un agent qui *croit* avoir mesuré.

**Reformulation du problème, et elle est plus dure que celle du brief :** la méthode ne manque pas
d'un format opposable — **elle en prescrit un falsifiable, et le déclare OBLIGATOIRE**. Un agent
appliquant `iakaframe-qualite` à la lettre produit un verdict inopposable **tout en respectant la
méthode**. Le défaut de `8ae5748` n'est donc pas seulement une négligence individuelle : il est
**conforme au gabarit**.

> Cela clôt aussi, par le fait, le travers que j'avais dénoncé au cadrage D-8 (« une règle de plus
> qui répète une règle déjà enfreinte est probablement la mauvaise réponse »). Ce lot n'ajoute pas
> de règle : il **corrige le gabarit qui produit la faute**. C'est le geste le plus économique
> disponible, et le seul qui atteigne la cause.

### 2.1 Second défaut mesuré dans le même fichier — instrument prescrit non garanti

`library/skills/iakaframe-qualite/SKILL.md:21-24` prescrit :

```bash
bash scripts/quality-report.sh
```

C'est **le même motif** que D-8 a mesuré côté GUI (`npm run lint:all` prescrit, inexistant) — mais
**à la source**, donc propagé à tout projet dérivé. Nuance honnête : le fichier écrit *« s'il
existe »* et prévoit un repli, ce qui l'atténue nettement. Il reste que le premier geste prescrit
au vérificateur est une commande dont rien ne garantit l'existence.

**Le même texte figure dans `library/personas/legolas.md:23`** — cette fois **sans** le « s'il
existe » : *« lancer `scripts/quality-report.sh` (ou les vérifs du projet) »*. Et il est propagé
dans le contrat généré : `cli/test/fixtures/agents-golden/legolas.md:24`.

**Traitement dissocié — voir § 5.2** : le fichier de skill est corrigeable à coût nul ; la persona
ne l'est pas (§ 4), et c'est ce qui décide du périmètre.

---

## 3. Ce que le brief demandait de mesurer — réponses

### 3.1 `canon-avant-citation` est-il concerné ? — **Mesuré : non. Ne pas y toucher.**

`library/principles/canon-avant-citation.md:30-32` porte une clause de contrôle **structurellement
analogue** :

> **Contrôle.** En **revue**, pas par une garde : […] Les citations n'étant pas marquées, aucune
> mécanique ne peut le vérifier aujourd'hui.

La tentation est réelle : même forme, même dépôt, même lot d'origine (`d492f4c`), on l'amende « tant
qu'on y est ».

**Recommandation : NON, et fermement.** Motif : **rien n'a réfuté cette clause-là.** D-8 a construit
un format opposable pour les **verdicts de gate** ; personne n'a construit quoi que ce soit pour les
**citations**. Amender `canon-avant-citation` maintenant serait **extrapoler d'un cas réfuté vers un
cas non mesuré** — exactement le geste que ces deux principes interdisent. On amende ce qui est
tombé, pas ce qui lui ressemble.

→ Inscrit en **§ 8 Hors scope** avec son motif, pour que le prochain lecteur sache que l'omission
est **délibérée et datée**, et non un oubli.

### 3.2 Un artefact ou deux ? — **Recommandation : un principe amendé + un gabarit corrigé. Pas de principe neuf.**

Le brief demande de ne pas trancher par réflexe. Voici l'analyse, et elle est décidée par
`canon-avant-citation` (unicité du détenteur) autant que par le coût de vendorage (§ 4).

| Option | Analyse | Verdict |
|---|---|---|
| **A — un principe neuf** `verdict-opposable` | Scinde en deux fichiers une doctrine unique (« on ne déclare que ce qu'on a constaté » / « un verdict non sourcé ne vaut rien » : le second est le **cas particulier** du premier appliqué aux gates). Deux fichiers qui disent la même chose divergent. **Et : casse le vendorage** (§ 4.2). | **Écarté** |
| **B — amender le principe seul** | Corrige la clause fausse, mais laisse **le gabarit fautif du § 2 en place**. Le principe dirait « cite tes sorties » pendant que la skill continuerait de prescrire `{ok / N échecs}`. **Deux fichiers contradictoires** — la faute que `canon-avant-citation` nomme. | **Insuffisant** |
| **C — amender le principe ET corriger le gabarit** *(recommandée)* | Le principe détient la **doctrine** ; la skill détient le **format opératoire**. Un détenteur par fait, aucune duplication, aucune contradiction. **Coût de vendorage : nul** (§ 4). | **Retenu** |

**Répartition des rôles, à respecter à la lettre (V2 unicité) :**

| Fait | Détenteur unique | Ce qu'il ne fait pas |
|---|---|---|
| *Doctrine* : un verdict non sourcé est inopposable | `library/principles/preuve-avant-declaration.md` | **ne recopie pas le tableau** |
| *Format* : le tableau commande / code / sortie citée | `library/skills/iakaframe-qualite/SKILL.md` | **ne redéfinit pas la doctrine** ; il la **cite** |

### 3.3 Faut-il toucher `library/personas/legolas.md` ? — **Recommandation : NON dans ce lot.**

Question posée par le brief (« la charte du persona Legolas ? »). Réponse mesurée, en deux temps.

**(a) Ce n'est pas nécessaire pour que la règle atteigne l'agent.** `library/personas/legolas.md:8`
porte `skills: [iakaframe-qualite]`, et le kit émet les skills :
`cli/test/fixtures/kit.iakaframe-claude.golden.md:16` déclare
`emits: [".claude/agents/*", ".claude/skills/*", ".claude/hooks/*", "CLAUDE.md"]`. **Legolas reçoit
donc le corps de la skill** — c'est le canal par lequel le format lui parvient déjà aujourd'hui
(y compris le format fautif du § 2).

**(b) C'est coûteux.** La persona est vendorée **byte-à-byte**, avec son golden (§ 4.2). La toucher
déclenche la chaîne complète : régénération des goldens, re-vendorage, deux suites.

**Conclusion : corriger la skill suffit à changer le comportement, et coûte zéro.** Toucher la
persona coûte un cycle de vendorage pour un gain nul en portée. → **Q-2** laisse néanmoins l'arbitrage
au décideur, car il existe un argument contraire défendable (une charte qu'on lit vaut mieux qu'une
skill qu'on charge).

---

## 4. Impact vendorage — **mesuré, et c'est la bonne nouvelle du lot**

Le brief avertit : toute modification des personas ou des méthodes casse le vendorage vers
`iakaFrameGUI` (fixtures + `vendor-check`), tout juste remis à `clean` par D-9.

**J'ai mesuré le périmètre exact du vendorage avant de proposer quoi que ce soit.**

### 4.1 Ce qui est vendoré — inventaire

Source : `specs/instructions/garde-vendor-check-cross-repo.md` § 12.1 (table normative, **21
fixtures / 6 familles**) :

| Famille | Compte | Nature |
|---|---|---|
| personas | 8 | copie byte-à-byte |
| goldens | 8 | copie byte-à-byte |
| binding | 1 | copie byte-à-byte |
| méthode + méthode *wrapped* | 2 | **dérivées** — réf. `methods/iakaframe.md` (frontmatter) |
| team | 1 | dérivée |
| kit | 1 | dérivée |

**`library/principles/` n'y figure pas. `library/skills/` n'y figure pas.**

### 4.2 Vérifications que j'ai faites pour ne pas me contenter de cet inventaire

Un fichier non listé peut malgré tout être **inliné** dans un artefact vendoré. J'ai donc contrôlé
les trois canaux d'inlining possibles :

| Contrôle | Mesure | Résultat |
|---|---|---|
| Le golden d'agent inline-t-il le corps de la skill ? | `cli/test/fixtures/agents-golden/legolas.md` : le corps reproduit la **persona** ; la skill n'apparaît qu'en **mention de nom** (`:17` « Skill-rôle : `iakaframe-qualite` ») | **Non inliné** |
| Le kit inline-t-il le corps de la skill ? | `grep -i skill` sur `cli/test/fixtures/kit.iakaframe-claude.golden.md` → **une seule occurrence**, `:16`, la déclaration `emits` de chemins | **Non inliné** |
| Un test assert-il le **contenu** de `SKILL.md` ? | `iakaframe-qualite` dans `cli/test/` → une seule assertion de fond, `cli/test/agents.test.js:28` : `assert.equal(skillOfPersona('legolas'), 'iakaframe-qualite')` — **un id, jamais un corps**. Aucun golden de skill (`cli/test/**/*skill*` = `learning-skill.test.js`, `retrait-skill.test.js`, deux tests de verbes) | **Aucune assertion de corps** |

### 4.3 Verdict de vendorage du périmètre retenu

| Fichier touché par ce lot | Vendoré ? | Impact |
|---|---|---|
| `library/principles/preuve-avant-declaration.md` (corps) | **non** | **aucun** |
| `library/skills/iakaframe-qualite/SKILL.md` (corps) | **non** | **aucun** |

> ### ✅ Le périmètre recommandé a un impact vendorage **NUL**. Aucun re-vendorage n'est requis.
> `vendor-check` doit rester **`clean`** de bout en bout — et **A-8 en fait un critère**, précisément
> pour que cette affirmation soit **exécutée** et non crue sur parole.

**Ce qui aurait cassé le vendorage — et que le lot évite délibérément :**

| Geste évité | Ce qu'il aurait déclenché |
|---|---|
| **Créer un principe neuf** (option A, § 3.2) | `methods/iakaframe.md` `principleIds` : 18 → 19 ⇒ les **2 fixtures dérivées de méthode** rouges ⇒ régénération par `gen-fixtures.mjs` + re-vendorage |
| **Amender `library/personas/legolas.md`** (§ 3.3, § 2.1) | **2 fixtures byte-à-byte** rouges (persona + golden) ⇒ `gen-agents-golden.mjs` + `agents generate --global` + re-vendorage + **deux suites** |

> **Mesure fondant la première ligne** : la fixture GUI
> `packages/core/__tests__/fixtures/method.iakaframe.md:5` porte aujourd'hui **les 18 mêmes
> `principleIds`** que `methods/iakaframe.md:5-8`, `preuve-avant-declaration` compris. Le vendorage
> de méthode est donc **à jour** (D-9 a tenu) — et **toute 19ᵉ entrée le casserait**. C'est un fait
> lu sur le disque, pas une extrapolation.
>
> C'est **l'argument décisif en faveur de l'option C** : elle n'est pas seulement plus propre
> doctrinalement, elle est la **seule qui ne rouvre pas la dette qu'on vient de payer**.

---

## 5. Décision — périmètre fermé

### 5.1 Amender `library/principles/preuve-avant-declaration.md` — section « Contrôle » **uniquement**

**Remplacer intégralement** la section `**Contrôle.**` (l. 28-29) par la rédaction ci-dessous.
**Aucune autre ligne du fichier n'est touchée** — ni le frontmatter, ni la politique, ni l'origine.

```markdown
**Contrôle — deux régimes.**

*Régime contractuel (défaut).* Pour la plupart des déclarations, rien ne distingue mécaniquement une
déclaration constatée d'une déclaration supposée. Le contrôle est **en revue** et le principe
**engage l'agent qui parle**.

*Régime opposable (verdicts de gate).* Pour un **verdict de gate**, ce régime ne suffit pas : il
demande au relecteur de juger une sincérité, ce qu'il ne sait pas faire. La règle y est donc plus
dure :

> **Un verdict de gate qui ne cite pas ses commandes et leurs sorties n'est pas un verdict :
> c'est une opinion. Il ne franchit rien.**

Le mot est **inopposable**, pas « interdit » : on ne peut pas empêcher un agent d'écrire « PASS »,
on **retire toute valeur** à un PASS non sourcé. La charge de la preuve pèse sur l'émetteur. Un
merge dont le message porte « gate PASS » sans mesure attachée est, **par construction**, un merge
non gaté — même s'il se trouve que le code était vert.

**Ce que ce second régime n'est pas.** Ce n'est **pas** une garde : aucune mécanique ne lit le
verdict. Le contrôle reste **humain**. Ce qui change n'est pas le contrôleur mais **le coût de la
faute** : un agent peut écrire « PASS » de mémoire, il ne peut pas inventer `Test Files 53
passed (53)`. Le manquement cesse d'être un for intérieur invérifiable pour devenir un **trou
visible sur l'artefact** — une case vide, un « OK » sans chiffre. La revue passe de *« juger une
sincérité »* à *« regarder si la case contient un chiffre »*.

**Le format opératoire de ce régime est détenu par `library/skills/iakaframe-qualite/SKILL.md`**
(§ Format de sortie) — il n'est pas redéfini ici.

**Origine du second régime.** Réfutation datée. La rédaction antérieure concluait « contractuel
seul, contrôle en revue » au motif qu'aucune mécanique ne distingue le constaté du supposé. La
prémisse reste vraie ; **la conclusion était fausse** — elle omettait le format contraint, à
mi-chemin de la garde et de la bonne foi. Le contre-exemple est le merge `8ae5748` d'`iakaFrameGUI`
(20/07), qui portait « gate Legolas PASS » avec le lint rouge — **le lendemain de la création de ce
principe, qui ne l'a pas empêché**. Fermé par le lot D-8 (21/07).
```

### 5.2 Corriger le gabarit de `library/skills/iakaframe-qualite/SKILL.md`

**Trois gestes, bornés. Le frontmatter n'est pas touché** (`id`, `name`, `description` inchangés —
`cli/test/agents.test.js:28` s'appuie sur l'id).

**(a) Remplacer la section « Format de sortie — OBLIGATOIRE » (l. 33-54)** par un format où chaque
ligne porte la **commande exacte**, son **code de sortie** et la **ligne de résumé copiée** :

```markdown
## Format de sortie — OBLIGATOIRE

Un verdict est une **citation**, jamais une affirmation. Réf. :
`library/principles/preuve-avant-declaration.md` § Contrôle — régime opposable.

# Rapport qualité — {branche} — {date}

## Verdict : PASS | FAIL

## Mesures
| Commande | Code de sortie | Résumé cité |
|---|---|---|
| `{commande exacte, telle que lancée}` | `{0 / n}` | `{ligne de résumé copiée de la sortie}` |

## Échecs (si FAIL)
### {nom du test}
- Attendu : {…}
- Obtenu : {…}
- Reproduction : {commande / étapes}
```

**(b) Ajouter les règles d'usage** (section « Règles »), appliquées **sans examen du fond** :

```markdown
- Une case **vide**, un **« OK » sans chiffre**, ou un résumé **reformulé** ⇒ **FAIL**.
- Un critère **non mesuré** se déclare **non mesuré**, jamais **PASS**.
- Une mesure **reprise du rapport d'un autre agent n'est pas une mesure** : on **re-mesure**.
- **Si tu n'as pas pu exécuter une commande** (outil indisponible), tu le **déclares en tête de
  rapport** et le critère concerné est **non mesuré**. Un verdict rendu sans instrument est un
  verdict **non rendu**.
```

> **La 3ᵉ règle n'est pas décorative** : c'est le geste — re-mesurer plutôt que croire le rapport
> précédent — qui a **effectivement révélé** l'incident `8ae5748`, au gate de D-7. Il n'était porté
> par aucun texte ; il le sera.
>
> **La 4ᵉ est celle que ce cadrage s'applique à lui-même** (§ 0), et elle ferme le cas où un agent
> sans `Bash` rendrait un PASS sur des critères qu'il ne pouvait pas exécuter.

**(c) Corriger la prescription d'instrument (l. 21-26, § 2.1)** : `bash scripts/quality-report.sh`
ne doit plus être le **premier** geste prescrit. Inverser l'ordre — *exécuter les vérifications du
projet (tests, lint, typage, couverture)*, et ne mentionner `quality-report.sh` **qu'en second**,
comme raccourci **si le projet le fournit**. **Ne créer aucun script.**

---

## 6. Critères d'acceptation

Numérotés, vérifiables, **cas nominal et cas de défaut**.

### Principe

**A-1** — *(nominal)* `library/principles/preuve-avant-declaration.md` contient la phrase exacte :
*« Un verdict de gate qui ne cite pas ses commandes et leurs sorties n'est pas un verdict : c'est
une opinion. Il ne franchit rien. »* **Vérification : rouvrir le fichier après écriture**
(`preuve-avant-declaration` — le principe s'applique à sa propre modification).

**A-2** — *(nominal)* Le fichier distingue explicitement **deux régimes** de contrôle et **date la
réfutation** (`8ae5748`, D-8).

**A-3** — *(défaut — anti-surenchère)* Le fichier **n'affirme nulle part** qu'une garde, un hook ou
une mécanique contrôle le verdict. Recherche des termes « garde », « hook », « automatique » dans la
section Contrôle : toute occurrence affirmant un contrôle mécanique ⇒ **critère en échec**.
*Motif : § 1.2 — aucune mécanique ne lit ce tableau ; l'écrire serait commettre la faute que le
fichier interdit.*

**A-4** — *(défaut — non-duplication, `canon-avant-citation` V2)* Le principe **ne contient aucun
tableau de format** de verdict : il **pointe** vers la skill. Un tableau `| Commande | Code de
sortie |` présent dans le fichier de principe ⇒ **critère en échec**.

**A-5** — *(défaut — périmètre)* `git diff` sur `library/principles/preuve-avant-declaration.md` :
**seule la section « Contrôle » est modifiée**. Frontmatter, `policy`, `trigger`, « Ce que
constater veut dire » et « Origine » **inchangés au byte près**. Toute autre ligne touchée ⇒
**dépassement de périmètre**.

### Gabarit (skill)

**A-6** — *(nominal)* `library/skills/iakaframe-qualite/SKILL.md` § Format de sortie porte les
**trois colonnes** commande / code de sortie / résumé cité, et **plus aucune** occurrence du gabarit
`{ok / N échecs}`.

**A-7** — *(défaut — le cœur du lot)* **Aucune** cellule d'exemple du fichier ne peut être remplie
sans exécution. Contrôle : rechercher `ok` comme **valeur de remplissage proposée** dans un tableau
de verdict. Toute occurrence ⇒ **critère en échec**. *Motif : § 2 — c'est la formulation exacte qui
rendait le gabarit falsifiable.*

**A-7-bis** — *(nominal)* Les **quatre** règles d'usage du § 5.2 (b) sont présentes, dont
**« on re-mesure »** et **« instrument indisponible ⇒ non mesuré »**.

**A-7-ter** — *(défaut — périmètre)* Le **frontmatter** de `SKILL.md` est **inchangé au byte près**
(`id`, `name`, `description`). *Motif : `cli/test/agents.test.js:28` s'appuie sur l'id ; la
`description` pilote le déclenchement de la skill.*

### Vendorage — **la garde du lot**

**A-8** — *(nominal, NON NÉGOCIABLE)* `iakaframe vendor-check` : statut **`clean`**, `checked: 17`,
`derived: 4`. **Exécuté réellement**, code de sortie relevé — pas déduit du fait que « le lot ne
touche pas de fichier vendoré ». *C'est l'affirmation du § 4.3 mise à l'épreuve : si elle est
fausse, elle doit tomber ici, pas en production.*

**A-9** — *(défaut)* `git diff --name-only` : **aucun** fichier sous `library/personas/`,
`cli/test/fixtures/`, `methods/`, `teams/`, `bindings/`, `kits/`. Un seul ⇒ le lot **sort de son
périmètre** ⇒ **arrêter et remonter au décideur** (le re-vendorage devient nécessaire et
l'estimation est caduque).

**A-10** — *(défaut)* `methods/iakaframe.md` : `principleIds` compte **exactement 18** entrées,
identiques à avant le lot. **Aucun principe ajouté.** *Verrouille l'option A du § 3.2, dont le seul
symptôme visible serait une 19ᵉ entrée.*

### Non-régression

**A-11** — *(nominal)* Suite CLI `node --test` : **verte**, total **≥** au total d'avant lot. Le
total est **cité en chiffres** dans le rapport de gate, jamais « tout passe ».

**A-12** — *(nominal — le lot est son propre premier cas d'usage)* Le verdict de gate de **ce lot**
est rendu au **format du § 5.2 (a)** : tableau commande / code de sortie / résumé cité.

**A-13** — *(défaut)* Le tableau d'A-12 comporte **au moins une ligne dont le résumé est une sortie
réelle copiée, avec ses chiffres**. Un tableau intégralement rempli de `OK` sans aucun chiffre ⇒
gate **FAIL**, sans examen du fond. *Un lot qui grave le format et le viole dans son propre verdict
n'est pas livrable.*

---

## 7. Répartition — délégable / geste humain

| Geste | Qui | Nature |
|---|---|---|
| § 5.1 amendement du principe | ⚒️ Gimli | délégable |
| § 5.2 (a)(b)(c) correction du gabarit | ⚒️ Gimli | délégable |
| Vérification A-1 … A-13 | 🏹 Legolas | délégable — **re-mesuré, jamais repris du rapport de Gimli** |
| **Arbitrages Q-1 … Q-3** | 🧔 **le décideur** | **geste humain** |
| **Amendement de `library/personas/legolas.md`** (§ 2.1, § 3.3) | 🧔 **le décideur** | **geste humain — hors périmètre ; ouvre le vendorage** |
| **Amendement de `canon-avant-citation.md`** (§ 3.1) | 🧔 **le décideur** | **geste humain — hors périmètre, motivé § 3.1** |

> **Note sur A-8/A-11** : ces critères exigent `Bash`. Le cadrage ne l'avait pas (§ 0) ; **le gate
> doit l'avoir**. Si Legolas ne peut pas exécuter `vendor-check` et `node --test`, il **déclare ces
> critères non mesurés** — il ne les déclare pas PASS. C'est la 4ᵉ règle du § 5.2 (b), appliquée au
> lot qui l'institue.

---

## 8. Hors scope

- **Créer un principe `verdict-opposable`** — écarté (§ 3.2 option A) : scinde une doctrine unique
  **et** casse le vendorage de méthode (§ 4.3).
- **Amender `library/personas/legolas.md`** — § 3.3 : inutile pour la portée (la skill atteint
  l'agent), coûteux en vendorage. Inclut la ligne `quality-report.sh` du § 2.1. → **Q-2**.
- **Amender `library/principles/canon-avant-citation.md`** — § 3.1 : **sa clause n'a pas été
  réfutée**. L'amender par analogie serait extrapoler d'un cas mesuré vers un cas non mesuré. → item
  de backlog, à rouvrir **si** un dispositif opposable est un jour construit pour les citations.
- **Créer `scripts/quality-report.sh`** — § 5.2 (c) : on **retire la prescription**, on ne crée pas
  l'outil.
- **Niveaux 2 et 3 de D-8** (`.gate/report.json` ancré sur HEAD ; hook `PreToolUse`) — la
  recommandation D-8 § 5.3 tient : niveau 1 d'abord, escalade **sur récidive mesurée**, pas sur
  crainte. Voir § 10 pour l'état de l'art à consulter le jour où.
- **Câblage de hooks** dans un `settings.json` — geste humain, bloqué en auto mode.
- **Assainissement de l'historique git** — jamais.

---

## 9. Estimation — gate P1→P2

| Poste | Charge |
|---|---|
| **C1** — § 5.1 amendement du principe (une section) | **0,1 j-h** |
| **C2** — § 5.2 (a)(b)(c) correction du gabarit de skill | **0,2 j-h** |
| **C3** — Vérifications A-1 … A-13, dont 7 cas de défaut | **0,15 j-h** |
| **Total** | **≈ 0,45 j-h — appelons 0,5 j-h** |

**Complexité : faible.** **Risque de régression : faible.** Deux fichiers markdown, **aucun code**,
**aucun fichier vendoré**, aucun test assis sur les corps modifiés (§ 4.2). Le lot est un
**remplacement de texte borné**, verrouillé par A-5, A-7-ter et A-9.

**Inconnues susceptibles de faire glisser l'estimation :**

1. **La plus probable — Q-2 est tranché « oui, amender aussi Legolas ».** Le chiffrage suppose le
   périmètre à impact vendorage **nul**. Amender la persona déclenche la chaîne complète
   (`gen-agents-golden.mjs` → `agents generate --global` → re-vendorage GUI → **deux suites**) :
   compter **+0,3 à 0,4 j-h** et un périmètre qui **touche `iakaFrameGUI`** — donc un second dépôt,
   donc un second gate. **C'est un risque de cadrage, pas d'exécution.**
2. **A-8 sort autre chose que `clean`.** Le cadrage n'a **pas** pu exécuter `vendor-check` (§ 0). Si
   le vendorage n'était **pas** revenu à `clean` après D-9 — ou s'il a redécroché depuis —
   le rouge apparaîtra ici **sans être causé par ce lot**. Ne **pas** le réparer dans ce lot :
   **arrêter, consigner l'état, remonter au décideur.** Réparer un vendorage dérivé sous couvert
   d'un lot de doctrine, c'est effacer une preuve (`garde-vendor-check-cross-repo.md` § 12.3).
   **+0,25 j-h** si constaté.
3. **La rédaction du § 5.1 rouvre le débat « faut-il une garde ? ».** L'amendement dit explicitement
   qu'il n'y en a pas (A-3). Un relecteur peut vouloir enchaîner sur le niveau 2/3 de D-8. **Repli :
   c'est une décision de portefeuille, pas une extension de ce lot** — la noter au backlog et
   livrer le niveau 1.
4. **Autres consommateurs du format non recensés.** J'ai mesuré les canaux d'inlining (§ 4.2) mais
   **pas** l'ensemble des fichiers qui *citent* le gabarit `{ok / N échecs}` hors `library/` et
   `cli/test/` — un kit déployé, une doc. **Repli : `grep` sur le dépôt en ouverture de lot** ;
   +0,1 j-h si des citations existent.

**Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter au
temps réel à la clôture du lot.

---

## 10. Questions au décideur

**Q-1 — Périmètre : option C (principe amendé + gabarit corrigé), ou option A (principe neuf) ?**
→ *Reco : **C**. Motifs cumulés : un détenteur par fait (`canon-avant-citation` V2), et surtout
**impact vendorage nul** — l'option A porterait `principleIds` à 19 et rouvrirait la dette que D-9
vient de payer (§ 4.3).*

**Q-2 — Amende-t-on aussi `library/personas/legolas.md` (format de verdict + ligne
`quality-report.sh`) ?**
→ *Reco : **non dans ce lot**. La skill atteint déjà l'agent (`emits: .claude/skills/*`), donc le
gain de portée est **nul** et le coût est un cycle de vendorage complet (§ 3.3). **Argument
contraire assumé** : une charte qu'on lit pèse plus qu'une skill qu'on charge. Si le décideur le
retient, **le batcher avec le prochain lot qui paie déjà le re-vendorage** plutôt que d'en payer un
pour deux lignes.*

**Q-3 — `canon-avant-citation` : on y touche ?**
→ *Reco : **non** (§ 3.1). Sa clause **n'a pas été réfutée** — aucun dispositif opposable n'existe
pour les citations. L'amender par ressemblance serait le geste que ces deux principes interdisent.*

---

## 11. Sources

**Faits internes** (lecture de fichiers, 2026-07-21 — aucune commande exécutée, § 0) :

- `library/principles/preuve-avant-declaration.md:28-29` — clause de contrôle réfutée
- `library/principles/canon-avant-citation.md:30-32` — clause analogue, **non** réfutée
- `library/skills/iakaframe-qualite/SKILL.md:21-26,33-54` — gabarit falsifiable + instrument prescrit
- `library/personas/legolas.md:8,23` — `skills:` et la ligne `quality-report.sh`
- `methods/iakaframe.md:5-8` — 18 `principleIds`
- `cli/test/fixtures/agents-golden/legolas.md:17,24` — skill mentionnée par nom, non inlinée
- `cli/test/fixtures/kit.iakaframe-claude.golden.md:16` — `emits`, aucun corps de skill
- `cli/test/agents.test.js:28` — seule assertion sur `iakaframe-qualite` (un id)
- `specs/instructions/garde-vendor-check-cross-repo.md` § 12.1, § 12.3 — inventaire des 21 fixtures
- `~/work/iakaFrameGUI/packages/core/__tests__/fixtures/method.iakaframe.md:5` — 18 `principleIds`
  vendorés, conformes à la source (D-9 a tenu)
- `~/work/iakaFrameGUI/CLAUDE.md` § « Rendre un verdict de gate » — format livré par D-8
- `~/work/iakaFrameGUI/specs/instructions/d8-gate-menteur-mesure-avant-verdict.md` § 5.2-5.4, § 9

**Vérification web** — *état de l'art, pour l'escalade future (§ 8), pas pour ce lot* :

Le problème « une déclaration doit porter sa preuve » est un problème résolu ailleurs, et il ne
faudra pas le réinventer si le niveau 2/3 de D-8 est un jour engagé. L'écosystème supply-chain
sépare le **Statement** (ce qu'on affirme) du **Predicate** (la preuve, dans un schéma typé), le
tout **signé** — c'est structurellement le geste « un verdict est une citation ».

- in-toto Attestation Framework — Statement / Predicate / Subject :
  https://slsa.dev/blog/2023/05/in-toto-and-slsa
- SLSA Provenance v1.0 — prédicat de provenance de build :
  https://slsa.dev/spec/v1.0/distributing-provenance

> **Portée de cette vérification, à ne pas surinterpréter** : elle **ne fonde aucune décision de ce
> lot** — le niveau 1 est du markdown, sans dépendance externe. Elle est consignée pour que le jour
> où le niveau 2 (`.gate/report.json`) serait envisagé, on parte d'un **format existant et signé**
> plutôt que d'un JSON maison. C'est le principe *réutiliser l'existant*.
