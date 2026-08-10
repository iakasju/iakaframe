# Correctif de routage — la production s'adresse à ⛴️ Charon, plus à 🌉 Helm

> Cadrée par **🧙 Gandalf** (P1 — Cadrage), le **2026-08-10**, sur **ordre du décideur (Stéphane)**
> relayé par Odin, à la suite du gate qualité de 🏹 Legolas sur
> `specs/instructions/scission-squad-prod-charon-helm.md`. Exécution : **⚒️ Gimli** (P2).
>
> **Lot NEUF.** Le lot de scission reste **fermé, validé, livré, PASS** — on n'y touche pas. Ce lot
> corrige un **écart de déclaration** de son § 6.5, pas un défaut de fabrication de Gimli.
>
> 🛑 **TOUTES les mesures ci-dessous ont été REFAITES par moi**, dans le worktree, le 2026-08-10.
> Je n'ai repris **ni le relevé d'Odin, ni celui de Legolas** — et **ils sont tous deux
> incomplets** (§ 2.1). Ce n'est pas un reproche : c'est la démonstration que la **méthode de
> mesure** employée jusqu'ici est fausse, et c'est le vrai sujet de ce lot.

---

## 1. Problème

Le lot de scission a recentré 🌉 Helm sur la **veille** et confié la **bascule** à ⛴️ Charon. Mais
les personas **qui routent vers la production** — Aragorn (coordinateur), Gimli (dev), Legolas
(qualité) — **désignent toujours Helm**. Les artefacts par-persona de Helm dans les kits sont, eux,
restés **intégralement pré-scission**.

**Le système se contredit à voix haute, en ce moment, dans les contrats déployés** :

| Contrat déployé | Ce qu'il dit |
|---|---|
| `~/.claude/agents/helm.md:3` | « Il ne bascule pas et ne rollback pas : la traversée stage → prod appartient à **Charon**. » |
| `~/.claude/agents/aragorn.md:24` | « le déploiement (→ **Helm**). » |
| `~/.claude/agents/gimli.md:40` | « la **prod = squad Helm** » |
| `~/.claude/agents/legolas.md:30` | « version candidate sur stage, **prête pour Helm**. » |

**Le coordinateur, le développeur et le qualiticien routent la production vers l'agent qui vient
d'écrire qu'il ne bascule pas.**

> **Atténuation mesurée — à inscrire pour ne pas dramatiser.** La mauvaise adresse **n'est pas
> silencieuse**. `~/.claude/agents/helm.md:38-40` porte : « **Ne fait pas** : **basculer** en
> production ni **rollbacker** (→ **Charon**, sur feu vert…) ». Un dispatch erroné se solde donc
> par un **renvoi**, jamais par une bascule exécutée par le mauvais agent. C'est ce qui a permis à
> Legolas de rester en **PASS** — et c'est aussi ce qui rend le défaut **tolérable jusqu'au
> correctif, mais pas au-delà** : le premier usage réel du squad prod passera par un aller-retour
> inutile, au pire moment (une mise en production).

---

## 2. Faits mesurés (`F*`)

> `F*` = **fait vérifié sur le disque le 2026-08-10**, dans le worktree
> `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm` (et `~/.claude/agents/` pour les
> contrats déployés). `D*` = **décision** (§ 4).

### 2.1 🛑 Le fait central : **la méthode de mesure employée est fausse dans les DEUX sens**

La commande de reproduction transmise —
`grep -rniI "helm" . | grep -Ei "bascul|alias|feu vert"` — est **ancrée à la ligne** et **filtrée
par mots-clés**. Je l'ai rejouée : elle **ne peut pas** rendre l'inventaire des défauts.

| Id | Fait | Preuve |
|---|---|---|
| **F1** | 🛑 **FAUX POSITIFS.** La majorité des lignes qu'elle rend sont **correctes** : la prose post-scission nomme légitimement Helm **et** « feu vert » dans la même phrase, en attribuant la bascule à Charon | `README.md:168` · `methode-de-travail.html:717` · `kits/iakaframe-ollama/AGENTS.md:52` · `specs/equipe-agents.md:115` — **aucun** n'est un défaut |
| **F2** | 🛑 **FAUX NÉGATIFS DE LIGNE.** Un routage qui **ne porte aucun des trois mots-clés** échappe entièrement. **6 des 9 sites du canon** sont dans ce cas | `library/personas/aragorn.md:29` (« le déploiement (→ Helm) ») · `:31` · `gimli.md:4` · `:31` · `legolas.md:35` (« prête pour Helm ») · `:57` |
| **F3** | 🛑 **FAUX NÉGATIFS DE FICHIER — le plus grave.** Deux fichiers sont **intégralement pré-scission** et **totalement invisibles** au grep, parce qu'aucune de leurs lignes ne porte à la fois « Helm » et un mot-clé | `kits/iakaframe-anythingllm/prompts/helm.md` (31 lignes) · `kits/iakaframe-openwebui/models/helm.json` |
| **F4** | **Legolas est absent des deux relevés**, alors qu'il route vers la prod à **4 endroits** | `library/personas/legolas.md:35,57` · `kits/iakaframe-anythingllm/prompts/legolas.md:12` · `kits/iakaframe-openwebui/models/legolas.json` |

> **Conséquence opposable, et c'est elle qui commande le lot** : *« 5 fichiers » (Gimli) et
> « 12 fichiers » (Legolas) sont tous deux des sous-estimations produites par le même instrument.*
> Le facteur d'écart n'est pas 2,4 : il est **plus grand**, et surtout **le défaut le plus lourd
> (`F3`) n'apparaît dans aucun des deux comptes**. **Ce lot ne doit donc pas se contenter de
> corriger une liste : il doit remplacer l'instrument** (§ 4, `D5`).

### 2.2 Inventaire réel des défauts — **groupe par groupe, exhaustif**

> Critère retenu (§ 4, `D1`) : **est un défaut toute formulation qui désigne Helm comme
> destinataire de la production, de la bascule, du déploiement ou du gate de prod.** N'est **pas**
> un défaut une phrase qui nomme Helm dans son rôle de veille, ni une phrase qui nomme les deux
> agents en attribuant correctement.

**Groupe A — canon `library/personas/` (SOURCES DE GÉNÉRATION) : 9 sites, 3 fichiers**

| Id | `chemin:ligne` | Ce qu'il dit | Vu par le grep ? |
|---|---|---|---|
| **F5** | `library/personas/aragorn.md:25` | « déclenchement du **squad prod** (Helm) sur feu vert » | oui |
| **F6** | `library/personas/aragorn.md:29` | « le déploiement (→ **Helm**) » | **non** |
| **F7** | `library/personas/aragorn.md:31` | « un rôle absent du casting (ex. `deploiement` si **Helm** manque) » — or `deploiement` est **le roleKey de Charon** depuis la scission | **non** |
| **F8** | `library/personas/aragorn.md:121` | « il ne franchit jamais seul un gate de production (c'est **Helm** + feu vert humain) » | oui |
| **F9** | `library/personas/gimli.md:4` | 🛑 **champ `description` du frontmatter** : « La prod reste le squad **Helm**. » | **non** |
| **F10** | `library/personas/gimli.md:31` | « **déployer en PROD (→ squad Helm)** » | **non** |
| **F11** | `library/personas/gimli.md:45` | « la **prod = squad Helm** (sur feu vert humain) » | oui |
| **F12** | `library/personas/legolas.md:35` | « version candidate (`vX.Y.Z-rc`) sur stage, **prête pour Helm** » | **non** |
| **F13** | `library/personas/legolas.md:57` | « il ouvre l'étape suivante (stage, puis **Helm**) » | **non** |

> 🛑 **`F9` est le plus grave du groupe, et aucun relevé ne l'avait vu.** Le champ `description`
> d'un frontmatter de persona est **la surface de routage** du runner : c'est ce que lit le
> dispatcher pour choisir un agent. Un mauvais routage y est **actif**, pas documentaire.
>
> **`F7` est d'une autre nature et doit être traité comme tel** : ce n'est pas « Helm au lieu de
> Charon » dans une phrase, c'est un **exemple pédagogique devenu faux** — il illustre la lacune de
> casting avec un rôle (`deploiement`) qui n'appartient plus à Helm. Le corriger n'est pas
> substituer un nom : c'est **réécrire l'exemple**.

**Groupe B — kits, artefacts PAR-PERSONA (maintenus à la MAIN, jamais générés) : 8 fichiers**

| Id | `chemin` | État |
|---|---|---|
| **F14** | `kits/iakaframe-anythingllm/prompts/helm.md` | 🛑 **FICHIER ENTIER PRÉ-SCISSION.** Mission « déployer une version recettée, router les accès » ; périmètre « bascule de version par **alias**, **SSO**, **rollback** » ; « **Gate — HUMAIN, non négociable** » ; « Tu reçois : … **+ le feu vert de l'humain** ». **0 occurrence de « Charon »** |
| **F15** | `kits/iakaframe-openwebui/models/helm.json` | 🛑 **FICHIER ENTIER PRÉ-SCISSION**, et à **3 zones distinctes** : `params.system` (`:6`, copie de `F14`), `meta.description` (`:10`, « bascule de version par alias, SSO, rollback, surveillance. Feu vert humain OBLIGATOIRE »), et **les 3 `suggestion_prompts`** (`:18` « Prepare la bascule en prod », `:21`, `:24` « Procedure de rollback de la derniere bascule ? »). **0 occurrence de « Charon »** |
| **F16** | `kits/iakaframe-anythingllm/prompts/aragorn.md:7,13` | route la prod vers Helm |
| **F17** | `kits/iakaframe-anythingllm/prompts/gimli.md:13` | idem |
| **F18** | `kits/iakaframe-anythingllm/prompts/legolas.md:12` | « sur stage, **prête pour Helm** » — **absent des deux relevés** |
| **F19** | `kits/iakaframe-openwebui/models/aragorn.json:6` | **3** occurrences de « Helm », **0** de « Charon » |
| **F20** | `kits/iakaframe-openwebui/models/gimli.json:6` | **2** occurrences de « Helm », **0** de « Charon » |
| **F21** | `kits/iakaframe-openwebui/models/legolas.json` | mention de Helm — **absent des deux relevés** |

> 🛑 **`F14` et `F15` sont les JUMEAUX EXACTS de deux fichiers que le § 6.5 C du lot de scission
> demandait de CRÉER pour Charon** — et `prompts/charon.md` comme `models/charon.json` **ont bien
> été créés** (vérifié : ils existent et nomment Helm correctement). **Le cadrage a listé les
> créations et oublié leurs contreparties.** C'est le motif exact de l'oubli, et il fonde la règle
> de rédaction `D6`.

**Groupe C — artefacts DÉRIVÉS (régénérés, jamais édités) : conséquence mécanique du groupe A**

| Id | Fait |
|---|---|
| **F22** | Goldens : `cli/test/fixtures/agents-golden/aragorn.md:26,122` · `gimli.md:46` · **+ `legolas.md`** (jamais nommé ailleurs) |
| **F23** | Vitrine : `methode-de-travail.html:848,944,1376` (+ les lignes issues de legolas/gimli) |
| **F24** | Contrats déployés `~/.claude/agents/` : `aragorn.md:20,24,26,116` · `gimli.md:3,26,40` · `legolas.md:30,52` — **mesurés en place** (§ 1) |

**Groupe D — narratif hors kits**

| Id | Fait |
|---|---|
| **F25** | `prise-en-main-ia-iakabox.html:435` — « la mise en prod est un squad séparé (🌉 **Helm**) sur ton feu vert ». Déjà nommé dans le § *Écarts* du lot de scission, **jamais corrigé** |

### 2.3 Faits de contexte, versés au dossier

| Id | Fait |
|---|---|
| **F26** | `vendor-check` est **déjà ROUGE** (16/82 selon le gate, dont **1 préexistante** au lot de scission), rouge **validé par le décideur** jusqu'à `GUI-VENDOR-CHARON`. Toucher aux goldens (`F22`) **déplacera** ce rouge sans le résoudre |
| **F27** | `CA-23` du lot de scission est **non discriminant** : `cli/test/vendor-check.test.js` bâtit des **miroirs synthétiques** et ne compare **jamais** au dépôt frère réel. **Propriété ANTÉRIEURE au lot de scission** — ce n'est pas une régression, c'est une limite d'origine de la garde |
| **F28** | `docs/guide-stefframe2.html:604` décrit le **jalon du miroir `StefFrame2`**, délibérément **gelé** en état pré-scission |
| **F29** | Le worktree `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm` porte la branche `feat/scission-squad-prod-charon-helm` : **la recentration de Helm y vit**. L'état `main` ne la porte pas |

---

## 3. Décision retenue

**Rendre cohérent le routage vers la production dans TOUTES les sources qui l'énoncent — canon,
kits par-persona, narratif — puis régénérer les dérivés ; et remplacer l'instrument de mesure par
une garde qui voit ce que le `grep` ne voit pas.**

---

## 4. Décisions de cadrage (`D*`)

- **`D1` — Le critère de défaut est SÉMANTIQUE, pas lexical.**
  Est un défaut : *toute formulation désignant Helm comme destinataire de la production, de la
  bascule, du déploiement ou du gate de prod.* N'en est pas une : Helm nommé dans son rôle de
  veille, ou une phrase nommant les deux agents avec la bonne attribution.
  Motif : `F1` — un critère lexical rend des faux positifs qui rendraient toute garde ininterprétable.

- **`D2` — Base du lot : AU-DESSUS de `feat/scission-squad-prod-charon-helm`**, dans le worktree
  `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm` (`F29`). **Jamais sur `main`.**
  Motif : la recentration de Helm n'existe que là ; appliqué ailleurs, le correctif produirait un
  état où Aragorn route vers Charon **qui n'existe pas**. Si la branche a été fusionnée entre-temps,
  **le vérifier avant de commencer** — c'est le premier geste du § 6.

- **`D3` — Séquencement : CE LOT D'ABORD, `GUI-VENDOR-CHARON` ENSUITE. Pas de fusion.**
  Motif : vendorer d'abord figerait dans le dépôt frère des goldens **encore faux** (Aragorn, Gimli
  et Legolas routant vers Helm), obligeant à re-vendorer deux fois. L'ordre inverse ne coûte rien :
  le rouge de `vendor-check` est **déjà validé** (`F26`) et **ne fait que se déplacer** — il ne
  s'aggrave pas en nature.
  ⚠️ **Effet à inscrire, pas à découvrir** : `GUI-VENDOR-CHARON` voit son périmètre **s'élargir
  mécaniquement** de **3 goldens** (`aragorn`, `gimli`, `legolas`) en plus de ceux de la scission.
  **Refuser la fusion** est délibéré : deux dépôts, deux gates, et un lot qui traverse deux dépôts
  ne se relit pas.

- **`D4` — `docs/guide-stefframe2.html:604` : HORS LOT** (`F28`).
  Motif : cette page **documente le miroir**, qui est **gelé** en état pré-scission. La « corriger »
  ferait **mentir la doc sur l'artefact qu'elle décrit**. Elle deviendra fausse le jour où le miroir
  sera resynchronisé — pas avant. → à traiter **avec** `resync-stefframe2-miroir-live.md`.

- **`D5` — L'instrument est REMPLACÉ, pas seulement rejoué. Trois gardes, chacune ROUGE avant.**
  Motif : `F1`/`F2`/`F3` établissent que le `grep` transmis ne peut ni prouver ni infirmer. Une
  garde qui rend 0 ligne après coup **ne prouve rien si elle n'a jamais rendu les 9**. Détail : § 5.

- **`D6` — RÈGLE DE RÉDACTION, à porter au-delà de ce lot.**
  > **Toute création d'un artefact dérivé pour un persona NEUF impose de vérifier le sort du même
  > artefact chez le persona dont il HÉRITE.**
  Motif : c'est le mécanisme exact de l'oubli (`F14`/`F15` — jumeaux de créations listées). Elle
  s'inscrit dans **ce fichier** et dans `library/skills/iakaframe-cadrage/SKILL.md` § *Garde-fous*,
  pour qu'elle serve aux cadrages futurs et pas seulement à celui-ci.

- **`D7` — `F7` (`aragorn.md:31`) se RÉÉCRIT, il ne se substitue pas.** L'exemple doit rester
  pédagogiquement juste : il illustre une lacune de casting. Deux issues acceptables — citer
  `deploiement`/**Charon**, ou citer un rôle non concerné par la scission. **Ne pas** écrire
  « `deploiement` si Charon manque **ou** Helm manque » : ce serait rendre l'exemple ambigu pour
  éviter de le penser.

- **`D8` — `F14` et `F15` se RÉÉCRIVENT INTÉGRALEMENT**, sur le patron de leurs jumeaux
  `prompts/charon.md` et `models/charon.json` **déjà livrés et corrects**, en y transposant la
  charte de veille de `library/personas/helm.md`. **`F15` a TROIS zones** — `params.system`,
  `meta.description` **et** les 3 `suggestion_prompts` : corriger la première en oubliant les autres
  laisserait le modèle proposer « *Prepare la bascule en prod* » **en bouton cliquable**.

- **`D9` — `StefFrame2` reste HORS LOT**, byte-identique, comme au lot de scission.

- **`D10` — `F27` est CONSIGNÉ, non traité.** Rendre `vendor-check` discriminant (comparer au frère
  réel) est une **limite d'origine** de la garde, sans rapport avec le routage prod. → ticket
  **`VENDOR-SYNTH`**, § 8.

---

## 5. Les gardes — ROUGES avant, vertes après (`D5`)

> Sur le modèle de `G-SURV`, qui a fait ses preuves au lot précédent. **Chaque garde est écrite,
> exécutée et VUE ROUGE avant toute correction**, avec le compte constaté consigné au commit.

**`G-ROUTE-1` — invariant de RÉCIPROCITÉ (couvre `F14`, `F15`, et tout futur jumeau)**

> **Tout artefact par-persona de `helm` DOIT mentionner `Charon`, et tout artefact par-persona de
> `charon` DOIT mentionner `Helm`.**

Motif : la scission rend le **renvoi croisé obligatoire** — chacun se définit par ce que l'autre
fait. Un fichier qui ne nomme jamais l'autre est, par construction, **antérieur à la scission**.
C'est **binaire, trivial à écrire, et immunisé contre `F3`** : il ne regarde pas les lignes, il
regarde le fichier.
**État actuel mesuré : ROUGE** — `prompts/helm.md` → **0** « Charon » ; `models/helm.json` → **0**
« Charon ». (`prompts/charon.md` et `models/charon.json` → déjà verts.)

**`G-ROUTE-2` — invariant d'ATTRIBUTION (couvre `F5`-`F13`, `F16`-`F21`)**

> Dans les **fichiers de routage** listés au § 7 (canon `aragorn`/`gimli`/`legolas` + leurs jumeaux
> kits), **toute ligne qui nomme `Helm` ET une notion de destination prod** (`prod`, `production`,
> `déploiement`, `bascul`, `stage → prod`, `gate de production`) **DOIT aussi nommer `Charon`**.

Motif : c'est le seul critère **discriminant** trouvé — il laisse passer les formulations correctes
(qui nomment les deux, `F1`) et attrape les routages (qui n'en nomment qu'un). Il couvre aussi les
sites sans mot-clé de bascule (`F2`), la notion de destination étant élargie à `prod`/`stage`.
**État actuel mesuré : ROUGE, ≥ 9 sites dans le canon** (`F5`-`F13`).

**`G-ROUTE-3` — invariant sur les CONTRATS DÉPLOYÉS** *(exigence explicite du décideur)*

> Les contrats **déployés** `~/.claude/agents/{aragorn,gimli,legolas,helm,charon}.md` satisfont
> `G-ROUTE-1` **et** `G-ROUTE-2`.

Motif : **c'est là que le défaut se voit** (§ 1), et **aucun `CA` du lot précédent ne regardait
cette surface** — tous s'arrêtaient au canon et aux goldens. Une source juste dont le contrat
déployé est faux ne protège personne : c'est le contrat que le runner lit.
**État actuel mesuré : ROUGE** — `aragorn.md:20,24,26,116` · `gimli.md:3,26,40` · `legolas.md:30,52`.
⚠️ Cette garde porte sur un artefact **hors dépôt** (`~/.claude/`) : elle doit **SKIPper proprement**
si le répertoire est absent (poste CI), **jamais échouer par absence** — et le skip doit **se dire**.

---

## 6. Étapes d'implémentation

> Ordre imposé. Commits atomiques, un par groupe.

1. **Vérifier la base** (`D2`) : se placer dans le worktree, confirmer que
   `library/personas/charon.md` existe et que `helm.md` porte `roleKey: surveillance`. Sinon →
   **s'arrêter et remonter** : le lot s'appliquerait à un état où Charon n'existe pas.
2. **Écrire les trois gardes, les VOIR ROUGES**, consigner les comptes constatés au message de
   commit. **Commit dédié.** *(Un lot qui livre sans avoir vu les gardes échouer n'est pas fini.)*
3. **Groupe A — canon** : `aragorn.md` (4 sites, dont la **réécriture** de `F7` selon `D7`),
   `gimli.md` (3 sites, **dont le champ `description`**), `legolas.md` (2 sites). **Un commit.**
4. **Groupe B — kits** : réécriture **intégrale** de `prompts/helm.md` et `models/helm.json`
   (`D8`, **3 zones** pour ce dernier) ; correction ciblée de `prompts/{aragorn,gimli,legolas}.md`
   et `models/{aragorn,gimli,legolas}.json`. **Un commit.**
5. **Groupe D — narratif** : `prise-en-main-ia-iakabox.html:435`.
6. **Dérivés — RÉGÉNÉRÉS, jamais édités** : `node cli/scripts/gen-agents-golden.mjs` ·
   `node cli/scripts/gen-methode-vitrine.mjs` · `iakaframe agents --action generate --global` puis
   `--check` = **0**.
7. **Les trois gardes passent au VERT.** Si l'une reste rouge → **s'arrêter** : l'inventaire du § 7
   est incomplet, et c'est précisément le défaut que ce lot corrige.
8. **`D6`** : inscrire la règle de rédaction dans `library/skills/iakaframe-cadrage/SKILL.md`
   § *Garde-fous*.
9. **Contrôle final** : dérouler `CA-1` → `CA-16`.

---

## 7. Fichiers concernés — **exhaustif**

> ⚠️ **C'est ce § qui a manqué la dernière fois.** Un fichier non listé n'est pas à modifier ; et
> si un fichier manque ici, **les gardes du § 5 le diront** — c'est leur raison d'être.

**A. Canon — sources de génération (9 sites, 3 fichiers)**

| Fichier | Sites |
|---|---|
| `library/personas/aragorn.md` | `:25` · `:29` · `:31` (**réécriture**, `D7`) · `:121` |
| `library/personas/gimli.md` | `:4` (**`description` du frontmatter**) · `:31` · `:45` |
| `library/personas/legolas.md` | `:35` · `:57` |

**B. Kits — artefacts par-persona, maintenus à la main (8 fichiers)**

| Fichier | Nature |
|---|---|
| `kits/iakaframe-anythingllm/prompts/helm.md` | **réécriture intégrale** (`D8`) |
| `kits/iakaframe-openwebui/models/helm.json` | **réécriture intégrale, 3 zones** : `params.system` · `meta.description` · `meta.suggestion_prompts` (`D8`) |
| `kits/iakaframe-anythingllm/prompts/aragorn.md` | `:7` · `:13` |
| `kits/iakaframe-anythingllm/prompts/gimli.md` | `:13` |
| `kits/iakaframe-anythingllm/prompts/legolas.md` | `:12` |
| `kits/iakaframe-openwebui/models/aragorn.json` | `:6` (3 occurrences) |
| `kits/iakaframe-openwebui/models/gimli.json` | `:6` (2 occurrences) |
| `kits/iakaframe-openwebui/models/legolas.json` | mention de Helm |

**C. Narratif**

| Fichier | Site |
|---|---|
| `prise-en-main-ia-iakabox.html` | `:435` |

**D. Gardes — créées**

`cli/test/` — `G-ROUTE-1`, `G-ROUTE-2`, `G-ROUTE-3` (fichier de test à nommer par Gimli, suffixé
`route-prod`).

**E. Règle de rédaction (`D6`)**

`library/skills/iakaframe-cadrage/SKILL.md` § *Garde-fous*.

**F. Dérivés — RÉGÉNÉRÉS, jamais écrits**

`cli/test/fixtures/agents-golden/{aragorn,gimli,legolas}.md` · `methode-de-travail.html` ·
`iakaframe-methode.html` · `~/.claude/agents/*.md`.

---

## 8. Hors périmètre — nommément

| Id | Objet | Motif |
|---|---|---|
| **`GUI-VENDOR-CHARON`** | re-vendorage du dépôt frère | `D3` — **après** ce lot, périmètre élargi de 3 goldens. Autre dépôt |
| **`StefFrame2`** | miroir | `D9` — byte-identique, comme au lot précédent |
| **`GUIDE-SF2`** | `docs/guide-stefframe2.html:604` | `D4` — décrit un miroir gelé ; le corriger le ferait mentir |
| **`VENDOR-SYNTH`** | rendre `vendor-check` discriminant (comparer au frère réel, pas à des miroirs synthétiques) | `F27`/`D10` — **limite d'origine**, sans rapport avec le routage prod. **Consigné, non traité** |
| **`HUB-VEILLE`** | déclencheur de Helm | autre dépôt, autre cadrage |
| `specs/instructions/**` | historiques de lots | Ce sont des **traces datées**. Les réécrire effacerait le raisonnement. **Exclus, comme dans la commande d'origine** |
| `frames/releases/**` | miroir | idem `D9` |

---

## 9. Risques

| # | Risque | Gravité | Mitigation |
|---|---|---|---|
| **R1** | 🛑 L'inventaire du § 7 est **encore incomplet** — c'est exactement ce qui vient d'arriver deux fois | **haute** | **`G-ROUTE-1/2/3`** (`D5`). Elles ne dépendent **pas** de l'inventaire : elles balaient. Si le § 7 est incomplet, elles **restent rouges** à l'étape 7 |
| **R2** | Corriger `gimli.md:4` (`description`) modifie la **surface de routage** du runner | moyenne | C'est **l'objet même** du lot (`F9`). Vérifié par `G-ROUTE-3` sur le contrat déployé |
| **R3** | Une correction trop mécanique (substituer « Helm »→« Charon ») casse le sens de `F7` | moyenne | `D7` : **réécriture**, pas substitution. `CA-6` la vérifie nommément |
| **R4** | `models/helm.json` corrigé à moitié : `system` juste, `suggestion_prompts` encore « Prepare la bascule en prod » | moyenne | `D8` + **`CA-8`**, qui vérifie **les trois zones séparément** |
| **R5** | Le rouge de `vendor-check` se **déplace** et est pris pour une régression | faible | `F26`/`D3` : déplacement **attendu et déclaré**. `CA-14` |
| **R6** | `G-ROUTE-3` échoue en CI faute de `~/.claude/agents/` | faible | § 5 : **SKIP explicite et dit**, jamais un échec par absence. `CA-13` |
| **R7** | Le lot est appliqué sur `main` au lieu du worktree | **haute si déclenchée** | `D2` + étape 1, qui **arrête** le lot |

---

## 10. Critères d'acceptation

**Gardes — la preuve d'abord**

- [ ] **`CA-1`** — Les **trois** gardes ont été **vues ROUGES** avant correction, et le message de
      commit consigne **le compte constaté** pour chacune. *Sans cette trace, le lot n'est pas fini.*
- [ ] **`CA-2`** — `G-ROUTE-1` (réciprocité) : **verte**. Vérif : `prompts/helm.md` et
      `models/helm.json` contiennent « Charon » ; `prompts/charon.md` et `models/charon.json`
      contiennent « Helm ».
- [ ] **`CA-3`** — `G-ROUTE-2` (attribution) : **verte** sur les 11 fichiers de routage du § 7 A+B.
- [ ] **`CA-4`** — 🛑 **`G-ROUTE-3` (CONTRATS DÉPLOYÉS) : verte.** Vérif directe :
      `~/.claude/agents/aragorn.md`, `gimli.md`, `legolas.md` ne routent plus la prod vers Helm ;
      `helm.md` et `charon.md` restent cohérents. **C'est le critère que le lot précédent n'avait pas.**

**Canon**

- [ ] **`CA-5`** — Les **9 sites** `F5`-`F13` sont corrigés, **un par un**, aux lignes du § 7 A.
- [ ] **`CA-6`** — `aragorn.md:31` est **réécrit** et non substitué (`D7`) : l'exemple de lacune de
      casting reste **pédagogiquement juste**, et n'écrit pas « Charon **ou** Helm ». Vérif : relecture.
- [ ] **`CA-7`** — `library/personas/gimli.md:4` : le champ `description` ne route plus la prod vers
      Helm. Vérif : `grep -n "squad Helm" library/personas/gimli.md` → **0 ligne**.

**Kits**

- [ ] **`CA-8`** — 🛑 `models/helm.json` corrigé sur ses **TROIS zones**, vérifiées séparément :
      (a) `params.system` décrit la **veille** ; (b) `meta.description` ne dit plus « bascule…
      rollback… Feu vert humain OBLIGATOIRE » ; (c) **aucun `suggestion_prompts` ne propose une
      bascule ou un rollback**. Vérif : `grep -i "bascul\|rollback" models/helm.json` → **0**, hors
      une éventuelle mention renvoyant explicitement à Charon.
- [ ] **`CA-9`** — `prompts/helm.md` est **entièrement** une charte de veille : plus de « Gate —
      HUMAIN, non négociable », plus de « Tu fais : bascule… SSO… rollback ».
- [ ] **`CA-10`** — `prompts/{aragorn,gimli,legolas}.md` et `models/{aragorn,gimli,legolas}.json`
      routent la prod vers **Charon**. Vérif : `G-ROUTE-2`.
- [ ] **`CA-11`** — **Legolas est traité** (`F4`) : `library/personas/legolas.md:35,57`,
      `prompts/legolas.md:12` et `models/legolas.json`. *Critère explicite parce qu'il était absent
      des deux relevés d'origine.*

**Dérivés, narratif, périmètre**

- [ ] **`CA-12`** — Dérivés **régénérés par leurs générateurs**, jamais édités. Vérif : rejouer les
      générateurs → `git diff` **vide** ; `agents generate --check` = **0**.
- [ ] **`CA-13`** — `G-ROUTE-3` **SKIPpe proprement et le DIT** si `~/.claude/agents/` est absent —
      elle n'échoue **jamais** par absence (`R6`).
- [ ] **`CA-14`** — Le **déplacement** du rouge de `vendor-check` est **déclaré** au message de
      commit (nombre avant / après), et **`GUI-VENDOR-CHARON` est nommé** comme successeur (`D3`).
      Aucun **autre** test n'est en échec.
- [ ] **`CA-15`** — `frames/releases/StefFrame2/` **byte-identique** : `git diff --stat` → vide.
      `docs/guide-stefframe2.html` **non modifié** (`D4`).
- [ ] **`CA-16`** — La règle de rédaction `D6` figure dans
      `library/skills/iakaframe-cadrage/SKILL.md` § *Garde-fous*.

---

## 11. Estimation — et pourquoi **0,2 j-h était faux d'un facteur ~9**

> Le décideur demande le motif autant que le chiffre.

**Pourquoi 0,2 j-h ne pouvait pas tenir**, trois raisons cumulées :

1. **Ce ne sont pas des retouches de texte, c'est une passe canon + dérivés.**
   `library/personas/*.md` sont des **sources de génération** : chaque correction entraîne goldens,
   vitrine **et** contrats déployés (`F22`-`F24`). Le geste unitaire n'est pas « éditer une ligne »,
   c'est « éditer, régénérer quatre familles d'artefacts, vérifier ».
2. **Le volume réel est le double du relevé le plus large**, et d'une **autre nature** : `F14`/`F15`
   ne sont pas des lignes mais **deux fichiers à réécrire intégralement**, dont un à **3 zones**.
3. **Le lot doit produire son instrument.** Les trois gardes (`D5`) sont l'essentiel du coût et la
   seule chose qui garantisse qu'on ne recomptera pas faux une troisième fois.

| Composante | Coût |
|---|---|
| Gardes `G-ROUTE-1/2/3` — écrites, vues rouges, puis vertes | **~0,5 j-h** |
| Canon (3 personas, 9 sites, dont une réécriture) | ~0,3 j-h |
| Kits (8 fichiers, dont **2 réécritures intégrales**) | ~0,5 j-h |
| Narratif + règle `D6` | ~0,1 j-h |
| Régénération des dérivés + vérification `--check` | ~0,2 j-h |
| Contrôle des 16 `CA` | ~0,2 j-h |
| **Total** | **1,6 à 2,2 j-h** |

**Complexité** : faible. **Risque** : **moyen**, et concentré sur `R1` — que l'inventaire soit
*encore* incomplet. C'est précisément pourquoi les gardes ne s'appuient pas sur l'inventaire.

**Inconnues** :
1. `models/legolas.json` (`F21`) n'a pas été ouvert ligne à ligne — **son existence et sa mention
   de Helm sont mesurées**, pas le détail de ses zones. Il peut porter, comme `helm.json`, des
   `suggestion_prompts` à corriger : **+0,1 j-h**.
2. Le nombre exact de lignes de `methode-de-travail.html` touchées dépend du générateur — **non
   compté**, car régénéré.
3. Si la branche de scission a été fusionnée dans `main` entre ce cadrage et l'exécution, l'étape 1
   change de cible (`D2`) — **sans coût**, mais à vérifier.

---

## 12. Jalon — gate P1→P2

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|

   ROUTAGE PROD -> CHARON
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 **Gandalf** (Cadrage, P1) | `specs/instructions/correctif-routage-prod-vers-charon.md` — **29 faits re-mesurés**, 10 décisions, **16 critères**, dont un sur les **contrats déployés** et **3 gardes vues rouges d'abord**. Établit que **l'instrument de mesure était faux dans les deux sens** et que les deux relevés antérieurs sont sous-estimés. **Estimation : 1,6 à 2,2 j-h** (contre 0,2 annoncés) | **L'utilisateur (Stéphane) — décideur.** Gate **humain** |

**Fichiers à vérifier avant validation** (`chemin:ligne`) :

- La contradiction, en place : `/Users/sjupin/.claude/agents/helm.md:3` vs `/Users/sjupin/.claude/agents/aragorn.md:24` vs `/Users/sjupin/.claude/agents/gimli.md:40` vs `/Users/sjupin/.claude/agents/legolas.md:30`
- 🛑 Le fichier entier pré-scission, invisible au grep : `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm/kits/iakaframe-anythingllm/prompts/helm.md:7`
- 🛑 Son jumeau, à 3 zones : `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm/kits/iakaframe-openwebui/models/helm.json:10` et `:18`
- 🛑 La surface de **routage** du runner : `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm/library/personas/gimli.md:4`
- Legolas, absent des deux relevés : `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm/library/personas/legolas.md:35`
- L'exemple devenu faux (`D7`) : `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm/library/personas/aragorn.md:31`
- Les jumeaux **corrects**, qui servent de patron : `/Users/sjupin/work/iakaframe/.claude/worktrees/charon-helm/kits/iakaframe-anythingllm/prompts/charon.md:11`

---

## Statut

**PROPOSÉ — en attente de validation du décideur.** Deux points appellent un oui explicite :

1. **`D3`** — ce lot **avant** `GUI-VENDOR-CHARON`, dont le périmètre s'élargit alors de 3 goldens,
   le rouge de `vendor-check` **se déplaçant** dans l'intervalle.
2. **`D4`** — `docs/guide-stefframe2.html:604` **hors lot**, parce qu'il décrit fidèlement un
   miroir gelé.
