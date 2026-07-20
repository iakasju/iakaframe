# Persona Gandalf — amélioration de contenu (phase 1)

> **Rang : non déclaré ici.** L'ordre de la série a une **source unique** —
> `phase1-inventaire-bibliotheque.md` **§ 0.1** (dépendances) et **§ 0.2** (ordre dérivé).
> Cette instruction déclare ses **dépendances**, jamais sa position.
>
> **Dépendance : APRÈS le lot 0**, qui crée `preuve-avant-declaration` cité par GD-2.
> **Aucune autre** — en particulier **plus de dépendance à Loki**, le principe étant désormais créé
> au lot 0. Cf. `specs/instructions/principe-canon-avant-citation.md` § 7.

> Instruction de cadrage (Gandalf, P1) — **auto-audit**. Branche `feat/amelioration-personas`.
> **Périmètre CONTENU uniquement.** Un commit dédié.

## 0. Réserve de méthode — je m'audite moi-même

Cette instruction est produite par la persona qu'elle audite. C'est **structurellement faible** : la
méthode interdit ailleurs l'auto-validation (`gimli.md:42-46`, gate Legolas indépendant), et rien ne
garantit que je vois mes propres angles morts.

> **Demande explicite** : que **cette instruction en particulier** soit relue par un tiers — Legolas
> au gate, ou le décideur. Les deux défauts ci-dessous sont ceux que j'ai su voir ; **la question
> ouverte est ce que je n'ai pas vu.** Je n'ai pas de moyen d'y répondre seul.

## 1. Cadre — ligne de partage

**DANS** : mission, périmètre, obligations, gestes, `guardrails`, `tools`, `skills`, `description`,
geste **jalon**, **création d'éléments de bibliothèque**.

**HORS — phase 2** : `roleKey`, `library/roles/`, `methods/iakaframe.md`, promotion de `deploiement`,
`roleIndex`, `DEFAULT_SKILLS`, `CANONICAL_ROLES`, vignette, `assemble`, **re-vendorage GUI**,
`roster.test.ts`, `Skill` au binding.

## 2. Trois faits de la phase

1. **Golden + déployé régénérés** (`--check` = 0). **Critère de fini.**
2. **Re-vendorage GUI NON fait.** ⚠️ *Corrigé au gate : **rien n'est rompu à ce jour** (vérifié par
   diff) ; la rupture **surviendra au premier commit**.* La parité cross-repo **sera volontairement
   rompue** et **rien ne la détectera**. **Dette assumée, ouverte au premier commit.**
3. **Ajouter des `skills:` n'a aucun effet runtime** avant le lot 2.

## 3. État audité — Gandalf (cadrage, 🔵)

> ⚠️ **Table RÉVISÉE après audit tiers de Legolas (gate phase 1).** La version initiale notait la
> dimension 4 ✅ « alignement exact » et **omettait purement et simplement la dimension 7**,
> s'arrêtant à la 6. Les deux défauts sont corrigés ci-dessous. **C'est le résultat attendu du
> mandat GD-A10** — j'avais posé le critère parce que je savais ne pas pouvoir le satisfaire seul.

| Dim. | Verdict | Preuve |
|---|---|---|
| 1 Charte | ⚠️ | mission/périmètre nets, **mais trois obligations manquantes** (§ 4) |
| 2 Expert MoE | ⚠️ | frontière vs Gimli nette (`:27`) — **mais la frontière vs Nathalie n'est verrouillée que d'un côté** (GD-4) |
| 3 Jalons | ⚠️ | geste présent — **estimation absente** (GD-1) **et paragraphe générique** : `:47-49` ne nomme **ni émetteur ni récepteur** (GD-5) |
| 4 Tools | ❌ | **`Write` ET `Edit`** (`bindings/…:10`) **sans aucun bornage dans le corps de charte** — `Edit` justifié nulle part (GD-3) |
| 5 Skills | ✅ | `[iakaframe-cadrage]`, qui porte `subskills: [iakaframe-jalon]` |
| 6 Hooks | ❌ | `perimeter-guard` est une garde **de chemins, aveugle aux personas** (`kits/iakaframe-claude/global/hooks/perimeter-guard.mjs:11`) — elle **ne porte pas** mon bornage |
| **7 Cohérence 3 couches** | ❌ | **dimension omise dans la version initiale.** Mon bornage n'est porté par **AUCUNE** des trois couches : ni binding (accorde `Write`+`Edit` sans restriction), ni hook (aveugle aux personas), ni charte (muette). Il ne vit que dans la `description` (`gandalf.md:4`) — **champ de routage, pas corps de contrat** |

## 4. Changements demandés

| Id | Changement | Fichier | Origine |
|---|---|---|---|
| **GD-1** | **Inscrire l'obligation d'estimation** au jalon P1→P2 | `library/personas/gandalf.md` (§ Gate) | auto-audit |
| **GD-2** | **Inscrire l'obligation de preuve avant déclaration** | `gandalf.md` (§ Périmètre) | auto-audit |
| **GD-3** | **Section de bornage `Write`/`Edit`** + justification d'`Edit` | `gandalf.md` (§ Périmètre) | **audit Legolas** |
| **GD-4** | **Verrouiller la frontière Gandalf↔Nathalie** (miroir de N-1) | `gandalf.md` (§ Périmètre) | **audit Legolas** |
| **GD-5** | **Nommer émetteur et récepteur** du jalon | `gandalf.md:47-49` | **audit Legolas** |

### GD-3 — bornage de l'écriture : ma propre doctrine, non appliquée à moi

**Défaut établi par l'audit tiers.** `bindings/iakaframe-claude-default.md:10` m'accorde **`Write`
ET `Edit`**. Mon corps de charte ne porte **aucune section de bornage** : `:22-28` est **muet sur
l'écriture**, et `Edit` n'est justifié nulle part. Le « n'écrit que dans `specs/instructions/` » ne
vit que dans `gandalf.md:4` — la `description`, **champ de routage**, pas corps de contrat.

> **C'est la doctrine que j'impose à Helm** — en substance, *(paraphrase, pas citation littérale :
> corrigé au gate LG-6)* — dans `persona-helm-amelioration.md:70-73` :
> « accorder `Write` sans inscrire le bornage transformerait le gardien de la prod en agent capable
> de modifier du code […] **les deux volets partent dans le même commit, jamais l'un sans l'autre** ».
> J'ai exigé de Helm ce que je n'avais pas fait chez moi. **Aggravant** : Helm n'a que `Write` ;
> j'ai `Write` **et** `Edit`, et GD-2 identifie précisément `Edit` comme mon outil le plus risqué
> (l'édition partielle est ce qui a produit le doublon du gate n°3).

**Changement, en deux volets indissociables** (le binding n'est **pas** modifié — les outils sont
justes, c'est leur bornage qui manque) :

1. **Section « Obligation — bornage de l'écriture »** dans le corps : `Write`/`Edit` sont **bornés à
   `specs/instructions/`** et **exclus** de tout autre chemin — code, tests, configs, `library/`,
   `bindings/`, `CLAUDE.md`. *(Le cadrage n'écrit que des instructions : c'est le sens même de
   « lecture seule sur le code ».)*
2. **Justification explicite d'`Edit`** : nécessaire pour amender une instruction existante (note
   additive, rectification après gate) sans réécrire le fichier entier — **et** rappel que l'édition
   partielle est le geste qui appelle le plus fortement GD-2 (relecture après écriture).

> ⚠️ **Ce bornage ne sera porté par aucune mécanique** : `perimeter-guard.mjs:11` est une garde de
> **chemins**, ancrée sur le projet, **aveugle aux personas** — elle ne peut pas distinguer « Gandalf
> écrit hors `specs/instructions/` ». Le bornage est donc **contractuel seul**, conformément à la
> doctrine **CH-4** (anti-auto-cast d'Aragorn). **À écrire comme tel**, pas comme une contrainte
> mécanisée.

### GD-4 — frontière Gandalf↔Nathalie verrouillée d'un seul côté

`nathalie.md:36-37` (« le cadrage technique → Gandalf ») et `:54-55` (« elle vérifie et cite, elle ne
**cadre** pas ») déclarent la frontière. **Je ne mentionne jamais Nathalie.** C'est **exactement le
défaut N-1** que je relève chez elle pour la RQV — une obligation déclarée d'un seul côté — appliqué
à moi dans l'autre sens.

**Changement** : mon § Périmètre « Ne fait pas » nomme la doc utilisateur et la mémoire humaine
(→ Nathalie), comme il nomme déjà le code (→ Gimli).

### GD-5 — mon paragraphe jalon est le « paragraphe générique » que j'interdis

`gandalf.md:47-49` décrit le jalon **sans nommer ni émetteur ni récepteur**. Or j'écris dans
`persona-odin-amelioration.md:66-67` : « **Ne pas plaquer un paragraphe générique** […] la rédaction
doit nommer **ses** transitions, pas recopier celle d'un autre agent. »

**Changement** : nommer **émetteur = Gandalf**, **récepteur = l'utilisateur (décideur)**, et la
transition concernée = **P1→P2, clôture de cadrage**. À rédiger **avec** GD-1 (l'estimation est
portée par ce même jalon).

### GD-1 — l'obligation d'estimation n'est pas écrite

`methode-de-travail.md:320-328` charge **nommément** le cadrage : *« l'estimation est posée par
l'agent qui ouvre le jalon de dev (Aragorn en coordination, **ou Gandalf en clôture de cadrage**) »*
— équivalent jour-homme + complexité/risque + inconnues.

Ma charte décrit le **geste de jalon** mais **jamais l'estimation**. C'est exactement le défaut
QW-3 relevé chez Aragorn, non corrigé chez moi.

> **Preuve que le défaut est réel et non théorique** : j'ai produit des estimations pendant cette
> session — mais **parce que le coordinateur me les a demandées**, pas parce que ma charte les
> impose. Un Gandalf dispatché sans cette consigne les omettrait sans être en faute.

**Changement** : énoncer qu'à la clôture de cadrage (jalon P1→P2), l'instruction **DOIT** porter une
estimation — **équivalent jour-homme, complexité/risque, inconnues** — et que cette estimation est
**rappelée à la clôture du lot**, confrontée au temps réel (`iakaframe-jalon/SKILL.md:40-46`).

### GD-2 — preuve avant déclaration

**Défaut établi par un échec réel de cette session.** Au 3ᵉ gate, Legolas a relevé que j'avais
**confirmé au coordinateur la suppression d'un item de dette qui était toujours présent** — la
numérotation dupliquée du § 13.6 le prouvait. Le coordinateur allait coller au backlog un item mort
**sur ma parole**. J'avais moi-même écrit dans ces instructions qu'un critère de « fini » ne se
suppose pas.

Ma charte n'impose **rien** de tel : elle décrit ce que je produis, jamais l'obligation de
**constater** ce que j'ai produit.

**Changement** : citer le principe **`preuve-avant-declaration`** (créé au **lot 0**) et le
décliner pour le cadrage : **relire le fichier d'instruction après écriture** — en particulier après
une **édition partielle** (`Edit`), où le risque de doublon ou de résidu est le plus élevé — avant
d'annoncer une modification comme faite.

> **Déclinaison, pas duplication.** Le principe est transverse et vit en bibliothèque ; la charte
> porte sa **forme cadrage**. C'est le geste demandé : composer un élément réutilisable plutôt
> qu'enfermer la règle dans un paragraphe interne.

## 5. Éléments de bibliothèque à créer — **AUCUN**

| Famille | Besoin ? | Vérification |
|---|---|---|
| `principles` | **non — réutilisation** | GD-2 a besoin de `preuve-avant-declaration`, **créé au LOT 0** (avant la série). Ne pas le recréer : **une seule définition**, deux consommateurs. → **la dépendance « Loki AVANT Gandalf » n'existe plus** : le principe préexiste. |
| `skills` | non | `iakaframe-cadrage` existe et porte déjà `subskills: [iakaframe-jalon]` — l'obligation d'estimation de GD-1 est **déjà décrite** dans `iakaframe-jalon/SKILL.md:40-46`. La charte **cite**, elle ne réécrit pas. |
| `guardrails` | non | `identity` + `perimeter` couvrent. Une garde « le cadrage n'écrit pas de code » serait tentante, mais `perimeter` + l'absence de `Bash` la rendent largement effective ; et le précédent **CH-4** (anti-auto-cast d'Aragorn) a acté qu'une contrainte de ce type reste **contractuelle** — pas de 4ᵉ garde-fou. |
| `rituals` | non | les 5 existants ne concernent pas le cadrage |
| `workflows` | non | `iakaframe-3phases:5` définit déjà P1 (`agentsRoleKeys: [cadrage]`, output `specs/instructions/{feature}.md`) |
| `scaffolds` | **non, mais candidat noté** | Je produis une **structure type** : l'instruction de cadrage (problème → options → spec fermée → critères → estimation). Un scaffold serait défendable. **Réutiliser avant créer** : la structure est aujourd'hui portée par l'exemple (`audit-amelioration-aragorn.md`) et la skill. **On ne crée pas** au MVP ; candidat sérieux pour plus tard — c'est le scaffold qui manquerait le plus au roster. |
| `roles` | phase 2 | `library/roles/cadrage.md` existe |

## 6. Laissé à la phase 2

- Le jalon et l'estimation **ne seront pas outillés** : `iakaframe-jalon` n'est pas déployée, et
  `subskills` n'est pas résolu. GD-1 écrit **la charte juste** ; l'activation vient au lot 2.
- Scaffold d'instruction de cadrage (candidat, non retenu au MVP).
- Re-vendorage GUI, `Skill` au binding, `roleKey`, `library/roles/`.

## 7. Critères d'acceptation

| # | Critère | Vérification |
|---|---|---|
| GD-A1 | La charte impose l'estimation au jalon P1→P2 : **jour-homme + complexité/risque + inconnues** | relecture ; les 3 composantes nommées |
| GD-A2 | La charte mentionne le **rappel de l'estimation à la clôture**, confrontée au réel | relecture |
| GD-A3 | La charte **cite** `preuve-avant-declaration` sans le redéfinir | relecture — pas de duplication de la `policy` |
| GD-A4 | La déclinaison cadrage nomme la **relecture après édition partielle** | relecture |
| GD-A5 | Le geste jalon est **enrichi** (GD-5), pas supprimé | diff |
| **GD-A6** | **AMENDÉ** — `tools` du binding, `skills` et `guardrails` **inchangés** ; le **corps de charte** est **modifié** (GD-1 à GD-5) | diff : `bindings/…:10`, `gandalf.md:8-9` identiques ; corps enrichi |
| GD-A7 | Aucun champ **hors périmètre** modifié (`roleKey`, `royaume`, `pastille`, `vignette`) | diff |
| GD-A8 | Golden + déployé régénérés | `agents generate --check` = **0** |
| GD-A9 | Suite CLI verte | `node --test` |
| GD-A10 | **L'instruction a été relue par un tiers** (§ 0) | **SATISFAIT** — audit Legolas, gate phase 1 : GD-3/4/5 en sont issus |
| **GD-A11** | Le corps porte une **section de bornage** nommant les chemins **autorisés** (`specs/instructions/`) **et exclus** (code, tests, configs, `library/`, `bindings/`) | relecture |
| **GD-A12** | `Edit` est **justifié** dans le corps, avec le rappel du lien à GD-2 | relecture |
| **GD-A13** | Le bornage est présenté comme **contractuel seul** (aucune mécanique ne le porte) | relecture — pas de promesse de garde |
| **GD-A14** | Le § « Ne fait pas » **nomme Nathalie** (doc utilisateur / mémoire humaine) | `grep -c Nathalie gandalf.md` ≥ 1 |
| **GD-A15** | Le jalon nomme **émetteur, récepteur et transition** (P1→P2) | relecture |

> **Amendement de GD-A6 — motif.** La version initiale exigeait « `tools`/`skills`/`guardrails`
> inchangés » **sans distinguer le frontmatter du corps**, ce qui aurait rendu le lot incapable
> d'absorber GD-3 à GD-5. La distinction est désormais explicite : **le binding et le frontmatter ne
> bougent pas** (les outils accordés sont justes), **le corps de charte change** — c'est précisément
> l'objet de la phase 1.

## 8. Critère de « fini »

1. `gen-agents-golden.mjs` · 2. `agents generate --global` + `--check` = 0 · 3. `node --test` vert ·
4. **PAS de re-vendorage GUI** (dette assumée, 2026-07-19) · 5. Commit dédié ·
6. **GD-A10** — le seul critère que je ne peux pas satisfaire seul.

> **Application immédiate de GD-2 à cette instruction** : après édition de `gandalf.md`, **relire le
> fichier** et vérifier l'absence de doublon de section — le défaut exact commis au gate n°3.

## 9. Estimation

**~0,5 j-h.** Complexité **faible** (aucune création — le principe vient du **lot 0**).
Risque **faible** techniquement, **modéré méthodologiquement** : le vrai risque est l'**angle mort
d'auto-audit** (§ 0), que seule une relecture tierce lève.
*Inconnue* : ce que je n'ai pas vu de ma propre charte. Je ne peux pas la chiffrer — d'où GD-A10.
