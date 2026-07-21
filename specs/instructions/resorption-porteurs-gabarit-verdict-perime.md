# Instruction — Résorber les porteurs périmés du gabarit de verdict qualité

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (P2). Statut en fin de doc.
> Réf. : `specs/instructions/verdict-de-gate-opposable.md` (défaut fermé, lot Q-3),
> `specs/instructions/resync-stefframe2-miroir-live.md` (doctrine du miroir + anonymisation),
> `specs/instructions/frame-stefframe2.md` (recette de build + cadre ZIP),
> `specs/instructions/garde-vendor-check-cross-repo.md` (garde de vendorage).

---

## 0. Outillage du cadreur — déclaré

**`Bash` n'est PAS disponible dans ma session.** Toutes les mesures ci-dessous ont été prises
avec `Read` / `Grep` / `Glob` uniquement. Conséquences à assumer :

- Les **comptes de fichiers** sont des comptes d'entrées `Glob`, pas des `ls | wc -l`.
- Les **tailles** des `.zip` et les **faits git** (commits, blobs, historique) sont **repris du
  brief du décideur, non re-mesurés par moi**. Ils sont signalés comme tels à chaque usage.
- Aucune commande de vérification (`grep -c`, `npm test`, `vendor-check`) n'a été **exécutée** par
  moi. Les critères §7 sont donc **rédigés pour être exécutés par Gimli**, pas constatés ici.

Conformément à `library/principles/preuve-avant-declaration.md`, ce qui suit distingue
explicitement **mesuré** (lu sur le disque dans cette session) de **rapporté** (issu du brief).

---

## 1. Besoin (reformulé)

Le lot Q-3 a corrigé le **canon** `library/skills/iakaframe-qualite/SKILL.md` : le gabarit de
verdict `| Contrôle | Résultat |` — remplissable de mémoire, sans commande ni code de sortie —
a été remplacé par `| Commande | Code de sortie | Résumé cité |`. C'était la cause racine du
« gate menteur ».

**Le canon est corrigé ; ses copies ne le sont pas.** Six artefacts portent encore le gabarit
périmé. Tant qu'ils vivent, un agent qui les lit — installé depuis un frame, ou lisant l'annexe
de code du HTML — appliquera le gabarit **fautif** en croyant suivre la méthode. Le besoin est
donc : **faire disparaître le gabarit périmé de tout porteur consommable**, sans rouvrir aucune
dette payée par ailleurs.

---

## 2. Faits MESURÉS (et faits du brief que j'infirme)

### 2.1 Les 6 porteurs : confirmés, à l'unité près

`Grep` sur `| Contrôle | Résultat |` → **7 fichiers**, conformes au brief :

| # | Fichier | Nature |
|---|---|---|
| 1 | `frames/releases/StefFrame1/skills/iakaframe-qualite/SKILL.md` | copie frame (flat) |
| 2 | `frames/releases/StefFrame1/kits/iakaframe-claude/.claude/skills/iakaframe-qualite/SKILL.md` | copie frame (kit) |
| 3 | `frames/releases/StefFrame2/skills/iakaframe-qualite/SKILL.md` | copie frame (flat) |
| 4 | `frames/releases/StefFrame2/library/skills/iakaframe-qualite/SKILL.md` | copie frame (library) |
| 5 | `frames/releases/StefFrame2/kits/iakaframe-claude/.claude/skills/iakaframe-qualite/SKILL.md` | copie frame (kit) |
| 6 | `methode-de-travail.html` (l. 2149-2150) | **artefact généré** |
| — | `specs/instructions/verdict-de-gate-opposable.md` | **citation légitime — NE PAS TOUCHER** |

Le porteur 6 est **mesuré à l'intérieur du bloc généré** : les marqueurs sont à
`methode-de-travail.html:825` (`<!--CODE_BLOCKS_START-->`) et `:2242` (`<!--CODE_BLOCKS_END-->`) ;
la ligne 2149 tombe entre les deux. **L'éditer à la main serait écrire dans un généré** — le brief
a raison sur ce point, le geste juste est de régénérer.

### 2.2 Le delta est purement Q-3, et `iakaframe-qualite` ne contient AUCUN token perso

Lecture intégrale comparée du canon et de la copie StefFrame2 : les deux fichiers sont
**identiques hors correction Q-3** (gabarit, plus les 5 règles ajoutées : case vide ⇒ FAIL,
critère non mesuré, mesure non reprise d'autrui, outil indisponible déclaré, verdict sans
instrument = verdict non rendu ; plus le remplacement du raccourci `scripts/quality-report.sh`
impératif par une formulation qui n'en dépend plus).

**Aucune des deux versions ne contient de token à anonymiser** (ni `forgejo`, ni `sjupin`, ni
`192.168`, ni `naonedge`, ni `appflowy`). C'est un fait important : **la copie du canon vers les
frames ne présente ici aucun risque de dé-anonymisation.**

### 2.3 FAIT DU BRIEF INFIRMÉ (majeur) — les frames sont anonymisées, ce que le brief ne dit pas

Le brief présente les frames comme de simples bundles jamais consommés, qu'on peut « écraser ».
**C'est vrai quant à leur consommation, mais incomplet quant à leur nature.**
`specs/instructions/resync-stefframe2-miroir-live.md` §2.2 établit que **StefFrame2 est une
release volontairement ANONYMISÉE**, destinée au partage hors du foyer du décideur, avec une
table de mapping (`iakaframe-forgejo`→`iakaframe-git`, `naonedge`→`design`,
`appflowy-doc`→`humandoc`, placeholders `<GIT_TOKEN>`, `<DOC_TOOL>`…).

**Conséquence de méthode, à ne pas perdre** : « écraser les frames depuis le live » est un geste
**légitime pour `iakaframe-qualite`** (§2.2 : aucun token) mais serait **destructeur s'il était
généralisé** à d'autres atomes. L'autorisation du décideur porte sur la *fraîcheur*, pas sur la
*forme anonymisée*. Cette instruction borne donc strictement le geste à `iakaframe-qualite`
(+ §2.4), et **interdit toute reprise « tant qu'on y est »**.

### 2.4 FAIT NOUVEAU non vu au brief — copier le canon crée une RÉFÉRENCE PENDANTE

Le canon corrigé contient (l. 34-35) :

```
Un verdict est une **citation**, jamais une affirmation. Réf. :
`library/principles/preuve-avant-declaration.md` § Contrôle — régime opposable.
```

Or, **mesuré** :

- `library/principles/` (live) = **18** principes, dont `preuve-avant-declaration.md` et
  `canon-avant-citation.md`.
- `frames/releases/StefFrame2/library/principles/` = **16** — `preuve-avant-declaration.md` et
  `canon-avant-citation.md` **absents**.
- `frames/releases/StefFrame1/principles/` = **14** — les mêmes absents (SF1 n'a **pas** de
  dossier `library/` du tout : `Glob frames/releases/StefFrame1/library/**/*.md` → aucun fichier).
- `frames/releases/StefFrame2/methods/iakaframe.md:5-8` : `principleIds` = **16 ids**, contre
  **18** dans `methods/iakaframe.md:5-8` (live). Les deux manquants sont exactement
  `canon-avant-citation` et `preuve-avant-declaration`.

**Donc** : copier le canon tel quel dans les 5 emplacements introduit une référence vers un
principe **qui n'existe pas dans le frame** — et, pour StefFrame1, vers un chemin `library/` qui
**n'existe pas non plus**. C'est exactement le défaut « 0 dangling ref » que le critère §7.5 de
`resync-stefframe2-miroir-live.md` interdit. **Traitement obligatoire — cf. §4 option retenue.**

### 2.5 FAIT DU BRIEF INFIRMÉ (majeur) — le générateur n'est pas seulement « non exécutable ici », il est CASSÉ

Le brief dit : « `pwsh` et `powershell` sont absents de cette machine → le générateur ne tourne
pas ici ». **Vrai mais insuffisant.** Lecture de `iakaframe-build-methode-code.ps1` :

- l. 32 : `Get-ChildItem (Join-Path $root "agents") -Filter *.md`
- l. 41 : `Get-ChildItem (Join-Path $root "skills") -Directory -Filter "iakaframe-*"`

**Mesuré** : `Glob agents/*.md` → **aucun fichier** ; `Glob skills/*/SKILL.md` → **aucun fichier**.
Les deux dossiers ont migré sous `library/` (`library/personas/`, `library/skills/`) lors de la
réorganisation en bibliothèque. Avec `$ErrorActionPreference = "Stop"` (l. 12), le script
**lève et n'écrit rien** — y compris sur une machine Windows équipée de `pwsh`.

**Ce n'est donc pas un portage, c'est un portage + un reciblage.** Un port Node fidèle ligne à
ligne reproduirait le bug. Et l'en-tête du script qui revendique l'idempotence (« re-lancable a
volonte quand les agents/skills changent ») est **périmé** : il ne se re-lance plus du tout.

### 2.6 FAIT NOUVEAU — l'annexe HTML est périmée BIEN AU-DELÀ du gabarit

**Mesuré** dans `methode-de-travail.html` : **9** cartes `id="code-agent-"` et **13** cartes
`id="code-skill-"` = **22 cartes**. Contre le live : **8** personas (`library/personas/*.md`, hors
`_TEMPLATE.md`) et **24** skills (`library/skills/*/SKILL.md`).

→ **11 skills et l'ensemble des contrats d'agents manquent ou sont figés** dans l'annexe, gelée
depuis la réorganisation. **Le gabarit périmé n'est que le symptôme visible d'un gel général.**

**Conséquence sur le périmètre à annoncer honnêtement** : régénérer le HTML ne produira pas un
diff de 2 lignes, mais le **remplacement intégral** d'un bloc de ~1400 lignes. Le critère « grep
= 0 » sera facile à atteindre ; ce n'est **pas** la mesure de l'effort réel ni du risque de revue.

### 2.7 FAIT NOUVEAU (le plus important) — les `.zip` sont des porteurs INVISIBLES au `grep`

**Mesuré** : `frames/releases/StefFrame1.zip` et `frames/releases/StefFrame2.zip` existent.
Tailles **rapportées par le brief** (non re-mesurées) : 278 Ko et 515 Ko.

Ces archives contiennent, par construction (`frame-stefframe2.md` §13 : « Contenu : exactement
l'arbre `frames/releases/StefFrame2/` »), **les copies fautives de `iakaframe-qualite`**. Or un
`grep` ne lit pas dans un `.zip`.

> **Si l'on corrige les 5 fichiers + le HTML et qu'on laisse les `.zip` en l'état, le critère de
> clôture `grep = 0 occurrence` rendra VERT alors que le gabarit fautif survit, livrable, dans
> deux archives versionnées.** Ce serait un **verdict vrai sur une mesure mal cadrée** —
> c'est-à-dire précisément la classe de défaut dont ce lot descend. Le traiter n'est pas une
> option de confort : c'est la condition pour que la clôture ne soit pas menteuse.

### 2.8 Provenance des frames : AUCUN geste reproductible — question du brief tranchée

Le brief demandait de trancher s'il existe un geste de production. **Mesuré** :

- `Grep 'frames|StefFrame|releases'` sur `cli/src` → **aucun fichier**. Confirme le grep négatif
  du brief : les frames sont hors du chemin du CLI.
- `install.mjs` (racine) ne mentionne les frames qu'en **commentaire** (l. 5), pour dire que la
  frame figée a *son propre* `install.mjs`. Ce n'est pas un producteur.
- `resync-stefframe2-miroir-live.md` §2.1 est explicite : *« Gimli **copie** `StefFrame1/` →
  `StefFrame2/` puis applique les ajouts » → build **manuel**, pas d'outil de génération »*, et
  *« audit B1.2 : aucune vérif d'intégrité automatisée »*, et *« A3.1 : propose de créer une skill
  `iakaframe-frame` (open/verify/release) — **elle n'existe pas encore** »*.
- Le ZIP lui-même est manuel (`frame-stefframe2.md` §12-E : « le dossier se zippe/ouvre »).

**Conclusion tranchée : il n'existe AUCUN geste reproductible de production de frame.** Le brief
avait anticipé la conséquence, et elle tient : *« si aucun geste reproductible n'existe,
"re-release" signifie d'abord créer le geste, ce qui est un autre lot »*. **Cette instruction ne
crée donc PAS ce geste** (→ §8 HORS, §9 suivi).

### 2.9 Vendorage : impact NUL, mais une ligne de crête à ne pas franchir

Lecture de `cli/src/lib/vendor.js` — les 21 fixtures vendorées vers `iakaFrameGUI` sont :

| Famille | Source | Traitement |
|---|---|---|
| 8 personas | `library/personas/{id}.md` | copie **byte-à-byte** |
| 8 goldens | `cli/test/fixtures/agents-golden/{id}.md` | copie byte + **niveau 2** vs contrat vivant |
| 1 binding | `bindings/iakaframe-claude-default.md` | copie byte |
| méthode (×2) | `methods/iakaframe.md` | **frontmatter sémantique** |
| team | `teams/iakaframe-8.md` | frontmatter sémantique |
| kit | `cli/test/fixtures/kit.iakaframe-claude.golden.md` | bytes (dépouillé) |

**Aucune fixture vendorée ne vit sous `frames/`, et `library/skills/` n'est pas vendoré.**
→ Le périmètre de cette instruction (frames + HTML + un générateur) **ne touche aucun fichier
vendoré** : `vendor-check` doit rester `clean` **sans aucun re-vendorage**.

> ⚠️ **Ligne de crête à ne pas franchir.** `methods/iakaframe.md` **est** vendoré, et sa
> comparaison porte sur le **frontmatter**, où vit `principleIds`. Si quiconque « profitait » de ce
> lot pour toucher `methods/iakaframe.md` **du live** (par exemple en croyant aligner les
> `principleIds` 16↔18), **`vendor-check` passerait rouge et la dette D-9 serait rouverte**.
> Le live `methods/` est **HORS PÉRIMÈTRE, sans exception** (§8). Les `principleIds` à compléter
> sont ceux **du frame** (§2.4), qui ne sont pas vendorés.

---

## 3. Arbitrage central : UN LOT ou DEUX ? → **DEUX, et je le tranche**

Le brief me demande d'arbitrer. **Je tranche : deux lots séquençables, livrables indépendamment.**

**Raison de fait, pas de confort** : le générateur `.ps1` écrit **uniquement**
`methode-de-travail.html` (l. 14 : `$html = Join-Path $root "methode-de-travail.html"` ; l. 59 :
un seul `WriteAllText`, sur `$html`). **Il ne touche jamais `frames/`.** Les 5 copies de frame et
le HTML n'ont donc **aucune dépendance technique commune** : les coupler ferait attendre la
correction de 5 fichiers triviaux derrière l'écriture d'un générateur.

| Lot | Contenu | Dépend de | Ferme |
|---|---|---|---|
| **R-1** | 5 copies de frame + traitement des `.zip` | rien | porteurs 1-5 (+ archives) |
| **R-2** | générateur Node + régénération HTML | R-2 seul | porteur 6 |

**Ordre recommandé : R-1 puis R-2.** R-1 est à faible risque et retire 5 porteurs sur 6 tout de
suite. R-2 porte l'essentiel de l'incertitude (§2.5, §2.6) et **ne doit pas retarder R-1**.

> **R-1 est-il vraiment sans générateur ?** Oui — et c'est assumé. Les 5 copies seront corrigées
> **à la main**, ce qui reconduit la maintenance ×5 dénoncée par l'audit B2.1. C'est le prix de ne
> pas construire l'outil `iakaframe-frame` dans ce lot (§2.8). Le suivi §9 est la réponse durable ;
> le décideur doit savoir qu'en validant R-1 il **paie une fois de plus la dette de duplication**
> plutôt qu'il ne l'éteint.

---

## 4. R-1 — Rafraîchir les 5 copies de frame

### 4.1 Geste nominal

Pour chacun des **5** fichiers du tableau §2.1 (#1 à #5) : **remplacer le contenu par celui du
canon** `library/skills/iakaframe-qualite/SKILL.md`, **sous réserve du traitement §4.2**.

Le canon est **source, jamais cible** : il ne doit subir **aucune** modification dans ce lot
(brief, et `library/principles/canon-avant-citation.md`).

### 4.2 Traitement obligatoire de la référence pendante (§2.4)

Trois options ; **je recommande B**, mais le choix est **ouvert au décideur** (§10-1).

- **A — Rapatrier le principe.** Copier `library/principles/preuve-avant-declaration.md` dans les
  frames (SF2 : `principles/` **et** `library/principles/` ; SF1 : `principles/`) et compléter
  `frames/releases/StefFrame2/methods/iakaframe.md` `principleIds`.
  *Pour* : référence résolue, frames plus fidèles au live.
  *Contre* : élargit le lot à la doctrine du miroir (§2.3), impose une passe d'anonymisation sur
  un atome non audité, et rouvre la question des `principleIds` 14/16/18 sur **deux** frames de
  structures différentes. **Hors du besoin exprimé.**

- **B — Neutraliser la référence dans les copies de frame (RECOMMANDÉ).** Copier le canon en
  **remplaçant les 2 lignes de référence** par une formulation autoportante, sans chemin :

  ```
  Un verdict est une **citation**, jamais une affirmation : toute mesure déclarée
  s'appuie sur une commande réellement exécutée et sa sortie citée.
  ```

  *Pour* : la **substance** du garde-fou Q-3 (le gabarit + les 5 règles) passe intégralement ;
  aucune référence pendante ; aucune structure de frame touchée ; lot fermé.
  *Contre* : la copie de frame n'est plus byte-identique au canon — **assumé et cohérent**, c'est
  déjà la nature d'un frame anonymisé (§2.3), qui n'est jamais une copie byte du live.

- **C — Copier tel quel, référence pendante acceptée.** *Rejeté* : introduit sciemment un renvoi
  vers un fichier absent, dans une skill dont tout l'objet est de refuser les affirmations non
  vérifiables. Incohérent avec le lot.

### 4.3 Traitement des `.zip` (§2.7) — obligatoire

Deux options ; **je recommande B**, décision **au décideur** (§10-2).

- **A — Régénérer les deux `.zip`** après correction des arbres.
  *Contre* : geste **manuel non outillé** (§2.8), donc non reproductible et non vérifiable ; ajoute
  ~800 Ko de **nouveaux blobs définitifs** à l'historique (taille rapportée, non re-mesurée) ;
  et il faudrait re-régénérer à chaque correction future.
  *Sur le risque Forgejo* : la mémoire du portefeuille garde trace de gros binaires refusés, mais
  cela concernait des volumes **sans commune mesure** (ordre du Go, PDF DND). **À ~800 Ko, le
  risque de refus est nul.** Le problème n'est pas le refus, c'est la **duplication permanente**.

- **B — Retirer les deux `.zip` du versionnement (RECOMMANDÉ).** Les supprimer et documenter en
  une ligne, dans `frames/releases/`, que le ZIP se produit **à la demande** depuis l'arbre.
  *Pour* : ce sont des artefacts **dérivés** d'arbres déjà intégralement versionnés (432 fichiers
  rapportés) ; ils n'ont **jamais été consommés** (décideur) ; ils sont la seule source de porteurs
  **invisibles au grep** (§2.7). Les retirer rend le critère de clôture **honnête**.
  *Contre* : plus de livrable prêt à l'emploi — **sans portée réelle ici**, puisque aucun n'a servi.

- **C — Les laisser périmés.** **Rejeté sans appel** : rend le critère §7 menteur (§2.7).

> ⚠️ **Suppression de fichiers versionnés = acte destructif.** Conformément à
> `library/principles/confirmation-actes-destructifs.md`, l'option B **exige une confirmation
> explicite du décideur** avant exécution. Elle **ne peut pas** être prise par Gimli de sa propre
> initiative. Si le décideur ne tranche pas, **repli sur A** (régénérer) — jamais sur C.

---

## 5. R-2 — Porter le générateur en Node, puis régénérer le HTML

### 5.1 Contrainte de doctrine

Node, **zéro dépendance externe** (mémoire portefeuille `iakaframe-cli-multiplateforme` : le CLI
`@naonedge/iakaframe` est Node zéro-dep, voie cross-OS). Le générateur n'a besoin que de
`node:fs` et `node:path` — la lecture du `.ps1` confirme qu'il ne fait que lire des fichiers,
échapper 3 entités HTML et faire un `replace` entre deux marqueurs. **Aucune dépendance
justifiable.**

### 5.2 Reciblage obligatoire des sources (§2.5) — et question ouverte

Le port **doit** lire sous `library/`, pas à la racine. Reste à trancher **ce qu'on inline pour
les agents** :

- **Option 1 — les chartes `library/personas/*.md`** (hors `_TEMPLATE.md`). Simple, symétrique des
  skills, sans dépendance au moteur de génération.
- **Option 2 — les contrats d'agents rendus, via `generateAgent(id, {root, binding})`** de
  `cli/src/lib/generate-agents.js` (fonction **mesurée** existante, déjà utilisée par
  `vendor.js:251`). Fidèle à ce que l'ancien `agents/*.md` contenait (des contrats **générés**,
  pas des chartes), et applique le principe « réutiliser l'existant ».

**Reco : Option 2**, avec repli documenté sur l'Option 1 si le rendu s'avère trop couplé.
Raison : l'ancien dossier `agents/` contenait des contrats générés ; inliner les chartes à leur
place **changerait la nature du contenu publié** dans la méthode, silencieusement. Décision
**au décideur** (§10-3) car elle touche à ce que la méthode **publie**.

### 5.3 Fidélité à préserver

Le port doit reproduire, **vérifié par lecture du `.ps1`** :
- échappement `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, **dans cet ordre** (l. 20) ;
- le gabarit de carte exact (l. 25) : `fname` / `fpath` / bouton `iakaDL('{id}','{dlname}')` /
  `<pre id data-path>` ;
- les deux intertitres de groupe (l. 31, 40) ;
- l'**échec dur** si les marqueurs sont absents (l. 54) — ne jamais écrire un HTML non marqué ;
- écriture **UTF-8 sans BOM** (l. 15) — en Node, `fs.writeFileSync(p, s, 'utf8')` n'ajoute pas de
  BOM : ne pas en ajouter un ;
- tri par nom (`Sort-Object Name`), pour un rendu **déterministe** — condition d'idempotence.

### 5.4 Sort du `.ps1` — je ne tranche pas par réflexe

Le brief me demande explicitement de ne pas trancher par réflexe. **Je ne tranche pas ; je
recommande, le décideur arbitre (§10-4).**

*Reco : le **retirer**.* Non pas parce que « Node remplace PowerShell » — la doctrine dit
l'inverse, le `.ps1` est un **power-path Windows légitime**. Mais parce que **celui-ci est cassé**
(§2.5) : il pointe vers `agents/` et `skills/` qui n'existent plus. Un power-path qui lève à
chaque exécution n'est pas un power-path, c'est un piège pour le prochain lecteur — d'autant que
son en-tête revendique une idempotence qu'il n'a plus.

*Alternative si le décideur tient au power-path Windows* : le **réparer** (reciblage `library/`)
dans le même lot, et accepter d'entretenir **deux** implémentations en parité — ce qui appelle un
test de parité, donc un coût récurrent. **Ce que je déconseille : le laisser en place cassé.**

---

## 6. Ce qui NE DOIT PAS bouger (dettes payées — vigilance du brief, vérifiée)

1. **`library/skills/iakaframe-qualite/SKILL.md`** — canon Q-3, **source, jamais cible**. Zéro
   modification.
2. **`specs/instructions/verdict-de-gate-opposable.md`** — la 7ᵉ occurrence est une **citation
   légitime** du défaut fermé. **Ne pas toucher** (et l'exclure du grep de clôture, §7.1).
3. **Vendorage** — aucun fichier vendoré n'est au périmètre (§2.9). `vendor-check` doit rester
   `clean` (`OK - 17 copies + 4 derivees`) **sans re-vendorage**. En particulier :
   **`methods/iakaframe.md` du live est intouchable.**
4. **Suite CLI** — baseline rapportée : `tests 377 / pass 376 / fail 0 / skipped 1`. R-1 ne doit
   rien y changer. R-2 **ajoutera** des tests (§7.9) : le total montera, `fail` doit rester **0**.
5. **Anonymisation des frames** — aucune dé-anonymisation, même « tant qu'on y est » (§2.3).

---

## 7. Critères d'acceptation (numérotés, pass/fail, exécutables par Gimli)

> Chaque critère se rend selon le gabarit Q-3 : **commande exacte, code de sortie, sortie citée**.
> Un critère non mesuré se déclare **non mesuré**, jamais `pass`.

### Cas nominal

1. **Extinction du gabarit périmé (le critère de clôture)** :
   ```
   grep -rn '| Contrôle | Résultat |' . --exclude-dir=.git
   ```
   → occurrences **uniquement** dans ces **deux** fichiers, tous deux **citations légitimes du
   défaut fermé**, jamais des porteurs prescriptifs :
   - `specs/instructions/verdict-de-gate-opposable.md` (lot Q-3),
   - `specs/instructions/resorption-porteurs-gabarit-verdict-perime.md` (**la présente
     instruction** — elle cite le gabarit fautif 4 fois : §1, §2.1, §7.1, §12).

   **Toute occurrence hors de ces deux fichiers = FAIL.**

   > ⚠️ **Piège mesuré, à ne pas reproduire.** Une première rédaction de ce critère exigeait
   > « exactement 1 occurrence » — ce qui aurait fait **échouer le lot à cause du document qui le
   > cadre**. Le critère porte sur les porteurs **prescriptifs** (ce qu'un agent lit pour agir),
   > pas sur les mentions **descriptives** (ce qui documente le défaut). Si un futur document cite
   > le gabarit fautif, **ce critère doit être mis à jour**, pas contourné. Un `grep` brut sans
   > cette distinction est précisément une mesure mal cadrée — cf. §2.7.

2. **Présence du gabarit corrigé dans les 5 copies** : chacun des 5 fichiers §2.1 (#1-#5) contient
   `| Commande | Code de sortie | Résumé cité |`. → **5/5**.

3. **Règles Q-3 propagées** : chacun des 5 fichiers contient les 5 règles ajoutées — case vide/`OK`
   sans chiffre ⇒ FAIL ; critère non mesuré ; mesure d'autrui re-mesurée ; outil indisponible
   déclaré ; verdict sans instrument = non rendu. → **5/5**.

4. **Aucune référence pendante** (§4.2) : aucune des 5 copies ne référence un chemin absent de son
   propre frame.
   - Si option **B** retenue : `grep -rn 'library/principles/preuve-avant-declaration' frames/`
     → **0**.
   - Si option **A** retenue : le fichier référencé **existe** dans chaque frame concerné, et
     `principleIds` de `frames/releases/StefFrame2/methods/iakaframe.md` le **contient**.

5. **Archives traitées** (§4.3) :
   - Si **A** : les deux `.zip` sont régénérés ; extraction de chacun → `grep '| Contrôle |
     Résultat |'` sur l'arbre extrait = **0**.
   - Si **B** : `ls frames/releases/*.zip` → **aucun fichier** ; la note « ZIP à la demande » est
     présente. **Confirmation décideur tracée** (acte destructif, §4.3).

6. **Anonymisation préservée** — gate corpus de `resync-stefframe2-miroir-live.md` §6-A, inchangé :
   ```
   grep -rniE 'forgejo|naonedge|appflowy|iakabox|iakaFrameGUI|192\.168|:3001|:1883|\bsjupin\b|grue' \
     frames/releases/StefFrame2 --exclude-dir=cli
   ```
   → **0**. Idem gate §6-B sur `frames/releases/StefFrame2/cli` → **0**.

7. **HTML régénéré, pas édité** (R-2) : `methode-de-travail.html` ne contient plus le gabarit
   périmé **et** le bloc entre `<!--CODE_BLOCKS_START-->` / `<!--CODE_BLOCKS_END-->` a été produit
   par le générateur Node. Comptes attendus : **8** cartes `code-agent-` et **24** cartes
   `code-skill-` (contre 9 et 13 mesurés avant — §2.6). Tout écart s'explique ou c'est un FAIL.

8. **Idempotence réelle** (la promesse que le `.ps1` ne tenait plus) : lancer le générateur
   **deux fois** de suite → le **second** run produit un fichier **byte-identique** au premier
   (`sha256` avant/après identiques). C'est le critère qui distingue un vrai générateur d'un
   script qui « a marché une fois ».

9. **Zéro dépendance** : le générateur n'importe que des modules `node:` — `grep -n "^import\|require(" <fichier>`
   ne montre **aucun** paquet tiers. Il s'exécute sur cette machine macOS **sans `pwsh`**.

10. **Non-régression** :
    - `vendor-check` → `clean`, `17 copies + 4 derivees`, drift **0**.
    - Suite CLI : `fail 0`. Total ≥ 377 (R-2 ajoute des tests ; une **baisse** du total = FAIL).

### Cas de défaut (à éprouver, pas à supposer)

11. **Marqueurs absents** : sur une copie de travail du HTML dont on retire
    `<!--CODE_BLOCKS_START-->`, le générateur **échoue en sortie non nulle** avec un message
    explicite et **n'écrit pas** le fichier. (Parité avec `.ps1` l. 54.) Un générateur qui écrit
    quand même est un FAIL.

12. **Source introuvable** : si `library/skills/` est absent, le générateur **échoue bruyamment**.
    Il ne doit **jamais** produire une annexe **vide** en silence — c'est très exactement le mode
    de défaillance qui a laissé le HTML se figer sans que personne ne le voie (§2.5).

13. **Échappement** : une skill contenant `<`, `>` et `&` est rendue **échappée** dans le `<pre>`,
    sans double-échappement (`&amp;lt;` = FAIL).

14. **Non-régression du canon** : `git diff --stat library/skills/iakaframe-qualite/SKILL.md`
    → **vide**. Le canon n'a pas bougé.

15. **Non-régression du vendorage** : `git diff --name-only` ne contient **aucun** chemin sous
    `library/personas/`, `bindings/`, `methods/`, `teams/`, `cli/test/fixtures/agents-golden/`,
    `cli/test/fixtures/kit.iakaframe-claude.golden.md`. Un seul de ces chemins touché ⇒ **FAIL**,
    la dette D-9 est rouverte.

---

## 8. DANS / HORS

**DANS (R-1)** : rafraîchir les 5 copies `iakaframe-qualite` des frames depuis le canon ; traiter
la référence pendante (§4.2) ; traiter les `.zip` (§4.3) ; gates d'anonymisation.

**DANS (R-2)** : porter le générateur d'annexe de code en **Node zéro-dep**, **reciblé sur
`library/`** ; régénérer `methode-de-travail.html` ; tests des cas de défaut §7.11-13 ; statuer sur
le `.ps1` (§5.4, selon arbitrage §10-4).

**HORS — explicitement, et pour de bonnes raisons** :
- **Créer l'outil `iakaframe-frame` (open/verify/release)** et le geste de release reproductible
  (§2.8). C'est **le** chantier de fond, il est **hors MVP** (→ §9).
- **Re-synchroniser les frames au-delà de `iakaframe-qualite`** — rapatrier les principes
  manquants (16 vs 18), aligner les `principleIds` du frame, dé-dupliquer les copies ×3/×5. Le
  drift §2.4 est **constaté et documenté ici**, **non traité** : le traiter, c'est le lot miroir,
  qui relève de la doctrine d'anonymisation (§2.3) et non de la dette Q-3.
- **Toucher `methods/iakaframe.md`, `library/personas/`, `bindings/`, `teams/` du LIVE** — ligne de
  crête vendorage (§2.9). **Sans exception.**
- **Toucher le canon** `library/skills/iakaframe-qualite/SKILL.md` (§6.1).
- **Toucher `specs/instructions/verdict-de-gate-opposable.md`** (§6.2).
- **Créer un `StefFrame3`** — le décideur a tranché l'écrasement en place.
- **Refondre le HTML hors de l'annexe de code** (mise en page, prose) : seul le bloc entre
  marqueurs est régénéré.

---

## 9. Suivi recommandé (NON bloquant)

1. **Outil `iakaframe-frame` (open/verify/release) + table de scrub persistée** — déjà recommandé
   par `audit-frame.md` A3.1/B1.1/B1.2 et par `resync-stefframe2-miroir-live.md` §9, **toujours
   non fait**. Ce lot est la **troisième** occasion où l'absence de cet outil se paie en
   corrections manuelles ×5. **À cadrer sérieusement.**
2. **Lot miroir** : résorber le drift frames↔live constaté §2.4 (principes 14/16 vs 18,
   `principleIds`), en préservant l'anonymisation.
3. **Garde anti-regel** : faire échouer un contrôle si l'annexe du HTML diverge des sources
   `library/` — sinon le gel §2.6 se reproduira, silencieusement, exactement comme cette fois.

---

## 10. Points ouverts — à trancher par le décideur au jalon

1. **Référence pendante (§4.2)** : A (rapatrier le principe) / **B (neutraliser — reco Gandalf)** /
   C (rejeté).
2. **Archives `.zip` (§4.3)** : A (régénérer) / **B (retirer du versionnement — reco Gandalf,
   ACTE DESTRUCTIF nécessitant confirmation explicite)** / C (rejeté). **Défaut si non tranché : A.**
3. **Source des cartes « agents » (§5.2)** : chartes `library/personas/` / **contrats rendus via
   `generateAgent()` — reco Gandalf**.
4. **Sort du `.ps1` (§5.4)** : **retirer (reco Gandalf, car cassé — pas par préférence Node)** /
   réparer et maintenir en parité / laisser (déconseillé).
5. **Séquencement (§3)** : R-1 et R-2 livrés séparément (**reco**) ou en une seule livraison ?

---

## 11. Estimation (obligatoire — ordre de grandeur assumé, non engagement ferme)

| Lot | Équivalent jour-homme | Complexité / risque |
|---|---|---|
| **R-1** — 5 copies + réf. pendante + zips | **0,3 j-h** | **Faible.** Gestes mécaniques, delta mesuré, gates existants réutilisés. |
| **R-2** — générateur Node + régénération | **1,0 à 1,5 j-h** | **Moyen.** Le port est court (~60 lignes), mais le **reciblage** et la **revue du diff HTML** portent le risque. |
| **Total** | **1,3 à 1,8 j-h** | |

**Inconnues susceptibles de faire glisser** (par ordre décroissant d'impact) :

1. **L'ampleur du diff HTML (§2.6)** — la plus sérieuse. On passe de 22 à ~32 cartes et le contenu
   des 22 existantes a bougé depuis fin juin. **Personne n'a relu ce que la régénération va
   publier.** Si la revue révèle du contenu qu'on ne veut pas publier tel quel, R-2 déborde.
   **+0,5 j-h.**
2. **Arbitrage §10-3 (source des agents)** — l'option `generateAgent()` impose de comprendre le
   couplage binding/génération. **+0,3 j-h** si le rendu ne se prête pas à l'inline.
3. **Décision `.ps1` §10-4** — l'option « réparer et maintenir en parité » ajoute un test de
   parité et un coût récurrent. **+0,3 j-h.**
4. **Régénération des `.zip`** si option A retenue — geste manuel non outillé, donc non vérifiable
   autrement qu'à la main. **+0,2 j-h.**
5. **Découverte d'un porteur hors `grep`** — d'autres artefacts binaires ou générés pourraient
   porter le gabarit sans que le `grep` textuel les voie. §2.7 en a révélé deux ; **je ne peux pas
   garantir qu'il n'y en a pas d'autres sans `Bash`.** Impact non chiffrable.

### Délégable / geste humain

| Geste | Qui |
|---|---|
| Correction des 5 copies, traitement réf. pendante, gates, port Node, tests, régénération | **Délégable → Gimli** |
| Vérification du verdict (gabarit Q-3, `vendor-check`, suite CLI) | **Délégable → Legolas** |
| **Arbitrages §10 (1 à 5)** | **HUMAIN — décideur** |
| **Confirmation de suppression des `.zip`** si option 4.3-B | **HUMAIN — obligatoire** (acte destructif) |
| **Revue du diff HTML régénéré avant commit** (§2.6, inconnue n°1) | **HUMAIN — fortement recommandé** : c'est ce que la méthode **publie**. |

---

## 12. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `resorption-porteurs-gabarit-verdict-perime.md` : **2 lots** (R-1 frames / R-2 générateur Node), réf. pendante traitée, `.zip` traités comme porteurs invisibles, 15 critères testables, estimation **1,3-1,8 j-h**, 5 points ouverts | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation (`chemin:ligne`)** :
- Canon corrigé (source, intouchable) : `library/skills/iakaframe-qualite/SKILL.md:43`
  (gabarit Q-3) et `:34` (référence à neutraliser, §4.2).
- Copie périmée, delta visible : `frames/releases/StefFrame2/library/skills/iakaframe-qualite/SKILL.md:41`
  (`| Contrôle | Résultat |`).
- Générateur cassé (chemins morts) : `iakaframe-build-methode-code.ps1:32` (`agents`) et `:41`
  (`skills`) — aucun des deux dossiers n'existe.
- Porteur généré : `methode-de-travail.html:2149`, entre les marqueurs `:825` et `:2242`.
- Drift des principes : `methods/iakaframe.md:5-8` (18 ids) ↔
  `frames/releases/StefFrame2/methods/iakaframe.md:5-8` (16 ids).
- Ligne de crête vendorage : `cli/src/lib/vendor.js:96-106` (`methods/iakaframe.md` vendoré en
  frontmatter sémantique — donc `principleIds` **du live** est vendoré).
- Citation légitime à préserver : `specs/instructions/verdict-de-gate-opposable.md`.

---

## Statut

**PROPOSÉ — en attente de validation décideur.** À « JALON VALIDÉ » → dispatch **Gimli** sur
**R-1** (§4) puis **R-2** (§5), critères §7, en respectant §6 (dettes payées) et §8 (HORS).
Les points ouverts §10 doivent être tranchés **avant** exécution : §10-1 et §10-2 sont **bloquants**
pour R-1 ; §10-3 et §10-4 pour R-2.
