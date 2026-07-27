# Instruction : Recette guidée HTML — instrument standard de la RQV humaine

> Phase cadrage (🧙 Gandalf). Cible : **repo iakaframe** (la méthode elle-même), **pas** iakaFrameGUI.
> Propriétaires à l'exécution : ⚒️ Gimli (canon + asset), avec 🏹 Legolas (gate) ; usage courant :
> 📖 Nathalie + 🏹 Legolas (co-production RQV), 🎭 Loki (charte du gabarit). Statut : 🟡 **à valider**.

## 1. Problème (avant la solution)

La méthode a un **gate auto Legolas** (PASS = franchit dev→stage sans humain) puis, **à la promotion
d'une version mineure**, une **RQV humaine** co-produite Legolas + Nathalie (`library/personas/legolas.md`
§ RQV — canon). Aujourd'hui la part « recette manuelle restante » de cette RQV n'a **aucun instrument
standard** : elle est refaite en checklist ad hoc à chaque version. Le décideur a produit, pour
iakaFrameGUI, une **recette guidée HTML** (checklist interactif : scénarios groupés A→G, prérequis de
lancement, statut PASS/FAIL/bloqué + notes, progression `localStorage`, theme toggle, charte Studio
clair) et veut l'**inscrire dans la méthode** comme pratique standard : la RQV humaine doit
**produire/consommer une recette guidée HTML réutilisable**, dérivée des critères d'acceptation.

Le problème à fermer n'est donc **pas** « faire une belle page » : c'est **(a)** insérer proprement la
recette guidée dans le cycle des phases (déclencheur, producteur, exécutant, boucle FAIL→P2), et
**(b)** extraire du prototype un **gabarit canonique réutilisable**, rangé comme **élément de 1er
ordre de la library** cohérent avec le modèle réservoir.

## 2. Ce qui existe (mesuré, lecture seule)

- **Les 3 phases + gate auto** : `methode-de-travail.md:59-73,155-181` (P1 Gandalf → P2 Gimli/Legolas
  → P3 stage ; le gate auto Legolas franchit dev→stage sans humain).
- **La RQV humaine à la mineure** (canon) : `library/personas/legolas.md:60-82` — co-production
  Legolas (évaluation qualité + verdict + jalon) / Nathalie (part documentaire) ; **récepteur du
  jalon = le décideur**. Nathalie cite ce canon sans le redéfinir : `library/personas/nathalie.md:67-91`.
- **La RQV comme document versionné** existe déjà en cadrage : `specs/instructions/revue-qualite-version.md`
  (item « recette manuelle restante », sortie `specs/rqv/RQV-vX.Y.Z.html`). La recette guidée est
  **l'instrument interactif de cette recette manuelle**, pas un doublon du document RQV consolidé.
- **Le pool scaffolds** (échafaudage déclaratif non destructif : `entries` = chemins + rôles) :
  `library/scaffolds/projet.md`, `library/scaffolds/portefeuille.md`. Le scaffold `projet` pose déjà
  `specs/instructions/_TEMPLATE.md` (`createIfAbsent: true`) — **précédent exact** d'un gabarit posé
  dans un projet.
- **La méthode default référence ses scaffolds** par id : `methods/iakaframe.md:12`
  (`scaffoldIds: [portefeuille, projet]`).
- **Charte Studio clair** (défaut dev-tool) : `library/personas/loki.md:50-68` (résolution dynamique
  `design-studio-clair/`, jamais de chemin codé en dur ; « demande explicite prime »).
- **Outillage de forge** : `iakaframe add scaffold <id>` pose un atome scaffold typé
  (`cli/src/lib/scaffold.js:104-135`). La **matérialisation du *contenu* d'un fichier** de scaffold
  dans un projet (init/onboard) suit le mécanisme de `projet._TEMPLATE.md` — **à confirmer** (inconnue, §7).

## 3. Fait vérifié (web) — contrainte technique dure

**`localStorage` est indéfini / bloqué sous origine `file://`.** Le comportement de `localStorage`
pour un document chargé en `file://` est **non spécifié** et varie selon les navigateurs ; Firefox le
**bloque** (origine `file://` ambiguë, pas de domaine/port pour définir l'origine — Same-Origin Policy).
Conséquence directe : **« progression sauvegardée en local » via un simple double-clic sur le HTML
n'est PAS fiable**. Sources :
- MDN, *Window: localStorage* — « cannot be used when the origin uses the file: or data: schemes » :
  https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- Bugzilla Mozilla #507361 — *localStorage doesn't work in file:/// documents* :
  https://bugzilla.mozilla.org/show_bug.cgi?id=507361

Le gabarit **DOIT** donc porter un **fallback honnête** (cf. AC-G) : `localStorage` en best-effort
(fiable quand la recette est servie en http — artifact CI / `localhost`), **plus** un **Export /
Import JSON** de la progression qui fonctionne même en `file://`, **plus** une **bannière visible**
quand la persistance auto est indisponible. C'est aussi une **démonstration d'honnêteté observable** —
exactement ce que la recette est censée éprouver.

## 4. Décisions (Gandalf propose — le décideur tranche)

### D1 — Verdict de rangement : élément de library dans le repo iakaframe

La recette guidée devient **deux choses** dans le repo **iakaframe** (la méthode), **pas** dans le GUI :

1. **Un scaffold de 1er ordre** `library/scaffolds/recette-guidee.md` (id **définitif**, constitution :
   pas de renommage). Il déclare le gabarit et son emplacement cible dans un projet.
2. **Une pratique inscrite dans le canon RQV** : `methode-de-travail.md` (§ RQV / version mineure) +
   les personas `legolas.md` / `nathalie.md`, **en citant** le canon RQV sans le dupliquer.

Le **GUI n'est pas touché au MVP** : le réservoir surface automatiquement le nouveau scaffold (pool
`scaffolds`). Ajout au besoin de `recette-guidee` dans `methods/iakaframe.md:12` (`scaffoldIds`).

> **Pourquoi un scaffold et pas un skill.** Un scaffold = *échafaudage de fichier posé dans un projet*
> (précédent `_TEMPLATE.md`). C'est exactement la nature du gabarit. Un **skill**
> `iakaframe-recette-guidee` (savoir-faire de dérivation AC→scénarios) serait une **itération** utile
> quand la pratique méritera d'être packagée/automatisée — **hors MVP** (§6). Au MVP, le savoir-faire
> vit dans le canon RQV, pas dans une skill dédiée. Cohérent `skills-agnostiques-layered`.

### D2 — Insertion dans les phases (déclencheur / producteur / exécutant / boucle)

| Question | Tranche proposée |
|---|---|
| **Déclencheur** | La **promotion d'une version mineure** (feature majeure atteignant le stage). La recette guidée s'insère **au gate RQV humain** — **après** le gate auto Legolas (dev→stage PASS), **avant** la promotion. Pas à chaque livraison. |
| **Producteur** | **Nathalie assemble** la recette (elle dérive les scénarios des AC des instructions — geste documentaire structuré, proche de ses guides), **co-produite avec Legolas** qui **valide la couverture qualité** (les scénarios couvrent bien ce que le gate auto ne peut structurellement pas voir : rendu visuel A-CONF, gestes réels, honnêteté observable). **Aucun rôle neuf** : c'est la co-production RQV existante. |
| **Charte / forme** | **Loki** possède la charte (Studio clair) et **produit/maintient le gabarit** (une fois). Au **remplissage par version**, la recette est self-contained (charte inline) → **pas de passage Loki à chaque fois**. Loki n'intervient que pour faire évoluer le gabarit. |
| **Coordination** | **Aragorn** enchaîne (comme sur tout jalon). |
| **Exécutant** | **Le décideur** (RQV humaine) : il déroule la recette dans l'app réelle, coche PASS/FAIL/bloqué, laisse ses notes. |
| **Boucle FAIL** | Un scénario **FAIL** nourrit un **verdict RQV no-go** et **retourne en P2 (Gimli)** ; si le FAIL révèle un défaut de conception → **re-cadrage Gandalf** (instruction corrective) ; sinon fix direct. |
| **Boucle PASS** | Tous PASS (ou FAIL assumés/différés tracés) → **feu vert promotion**. Le **jalon RQV reste émis par Legolas, récepteur = décideur** (canon `legolas.md` inchangé). La recette guidée remplie est **la pièce probante** attachée au document RQV. |

### D3 — Emplacement du gabarit et de la recette remplie (dans un projet)

- **Gabarit posé dans le projet** : `specs/recettes/_TEMPLATE.recette.html` (`createIfAbsent: true`,
  non destructif — exactement comme `_TEMPLATE.md`).
- **Recette remplie par version** : `specs/recettes/recette-vX.Y.0.html`.
- **Asset canonique** (source du gabarit, dans le repo iakaframe) : rangé avec le scaffold —
  proposition `library/scaffolds/assets/recette-guidee/_TEMPLATE.recette.html`. La **matérialisation
  auto** par init/onboard s'aligne sur le mécanisme `_TEMPLATE.md` (inconnue §7) ; à défaut au MVP, la
  copie manuelle par l'auteur de la recette est acceptable (le prototype a bien été produit à la main).

## 5. Gabarit canonique — structure à extraire du prototype iakaFrameGUI

Le prototype (20 scénarios A→G, prérequis de lancement, PASS/FAIL/bloqué + notes, `localStorage`,
theme toggle, Studio clair) est la **référence à généraliser**. Structure canonique retenue :

1. **En-tête** : titre `<Projet> — Recette guidée vX.Y.0`, sélecteur de **thème** (clair/sombre,
   défaut **Studio clair**), **barre de progression** (n PASS / n FAIL / n bloqué / n total),
   boutons **Exporter** / **Importer** / **Réinitialiser** la progression.
2. **Bloc Prérequis & lancement** : comment démarrer l'app testée (commande, URL, jeu de données),
   avant tout scénario.
3. **Scénarios groupés par domaine** (les groupes A→G du prototype = un axe fonctionnel chacun).
   Chaque **scénario** = objet homogène :
   - `id` stable (ex. `A-03`) **traçable vers l'AC** dont il dérive ;
   - **étapes** (gestes à faire) ;
   - **attendu** (le comportement observable qui vaut PASS) ;
   - **statut** : `PASS` / `FAIL` / `bloqué` (radio) ;
   - **note** (texte libre : preuve, écart, raison du blocage).
4. **Persistance** : `localStorage` (best-effort) **+** Export/Import JSON (fallback `file://`) **+**
   bannière honnête si l'auto-persistance est indisponible.
5. **Pied** : horodatage de dernière modif, résumé recopiable pour coller dans le document RQV.

**Self-contained absolu** : un **seul fichier `.html`**, **CSS et JS inline**, **zéro dépendance
externe / zéro CDN**, ouvrable en local ou publiable en artifact. **Theme-aware**. Charte **Studio
clair** par défaut, cohérente avec le produit testé (réutilise `design-studio-clair/` de Loki, jamais
une palette inventée).

## 6. Mapping AC → scénarios (le cœur de la pratique)

La recette guidée **dérive des critères d'acceptation** des instructions de cadrage :

- **Un AC vérifiable → un scénario** (`id` du scénario référence l'AC), avec **attendu = la formulation
  testable de l'AC**. Les AC de la version = l'ossature des groupes A→G.
- **Plus les angles que le gate auto ne couvre pas** (raison d'être de la RQV humaine) :
  - **rendu visuel A-CONF** (conformité à la charte / maquette : ce que `tsc`/lint/tests ne voient pas) ;
  - **gestes réels de bout en bout** (l'app manipulée par un humain, pas un test unitaire) ;
  - **honnêteté observable** (aucun état factice : la recette elle-même en fait la démonstration avec
    sa bannière `localStorage`, cf. §3).
- **Traçabilité** (calquée sur la RQV, `revue-qualite-version.md` item 4) : `specs/instructions/<feature>`
  → AC → scénario de recette → statut. Un AC sans scénario est un **trou** signalé.

## 7. MVP vs itération (ne pas sur-outiller)

- **MVP (cette instruction)** : le **gabarit** self-contained + la **pratique écrite** (insertion RQV).
  Le remplissage reste **rédigé à la main** (comme la recette iakaFrameGUI qu'on vient de produire).
- **Hors MVP, itérations signalées** : (a) **skill** `iakaframe-recette-guidee` packageant le
  savoir-faire ; (b) **générateur** qui pré-dérive les scénarios depuis les AC des instructions ;
  (c) **matérialisation auto** par init/onboard ; (d) **surfaçage GUI** dédié. Aucun de ces quatre au MVP.

## 8. Critères d'acceptation

- **AC-A (scaffold)** : `library/scaffolds/recette-guidee.md` existe, id `recette-guidee`,
  `nonDestructive: true`, `entries` déclarant `specs/recettes/` et `specs/recettes/_TEMPLATE.recette.html`
  (`createIfAbsent: true`). `iakaframe frame lint` (ou l'équivalent) reste **exit 0**.
- **AC-B (référencement)** : `recette-guidee` ajouté à `methods/iakaframe.md` `scaffoldIds` sans casser
  le lint ni la parité.
- **AC-C (gabarit self-contained)** : `_TEMPLATE.recette.html` est **un seul fichier**, **aucune
  requête réseau** (vérifiable : ouvert hors-ligne, onglet réseau vide), CSS/JS inline, zéro CDN.
- **AC-D (structure)** : le gabarit porte en-tête + progression + prérequis + scénarios groupés, chaque
  scénario = `id` + étapes + **attendu** + statut PASS/FAIL/bloqué + note (conforme §5).
- **AC-E (theme + charte)** : thème clair/sombre commutable, **défaut Studio clair**, styles issus de
  `design-studio-clair/` (pas de palette inventée) ; rendu **vu** par Loki (boucle VOIR de `loki.md`).
- **AC-F (persistance)** : la progression persiste via `localStorage` **quand disponible** ; Export
  produit un JSON, Import le recharge fidèlement, Réinitialiser vide l'état.
- **AC-G (honnêteté file://)** : ouvert en `file://` où `localStorage` est indisponible, le gabarit
  **affiche une bannière visible** (« persistance auto indisponible, utilisez Exporter/Importer ») et
  **ne prétend jamais** avoir sauvegardé — l'Export/Import reste opérant. (Découle du fait web §3.)
- **AC-H (pratique inscrite)** : `methode-de-travail.md` (§ version mineure / RQV) décrit la recette
  guidée comme **instrument standard de la RQV humaine** — déclencheur (promotion mineure, après gate
  auto Legolas), producteur (Nathalie + Legolas), exécutant (décideur), boucle FAIL→P2 / PASS→feu vert.
- **AC-I (canon personas, sans cycle)** : `legolas.md` et `nathalie.md` **citent** la recette guidée
  comme pièce de la RQV **sans redéfinir** le canon RQV (la clause de préséance `legolas.md` fait foi
  reste vraie ; aucune duplication de définition). Contrats déployés régénérés, **`vendor-check
  --strict` drift 0** (piège récurrent cross-repo).
- **AC-J (mapping)** : la doc de la pratique explicite le mapping **1 AC → 1 scénario** + les 3 angles
  hors-gate-auto (visuel, gestes, honnêteté) + la traçabilité `instruction → AC → scénario → statut`.
- **AC-K (gate)** : verdict **Legolas PASS** sur le lot ; parité/lint verts ; `etat-des-lieux`
  régénéré au versionnement.

## 9. Hors périmètre

Générateur automatique de scénarios ; skill dédiée ; matérialisation auto init/onboard ; page GUI
dédiée ; infra RQV Sonar/DevLake (couverte par `revue-qualite-version.md`) ; toute charte nouvelle
(on réutilise Studio clair). Ces points sont des **itérations**, pas ce lot.

## 10. Estimation (jalon P1→P2)

- **Équivalent jour-homme (spec fermée)** : **~3 j-h**.
  - Généraliser le prototype en gabarit propre (extraction iakaFrameGUI, paramétrage projet/version,
    fallback Export/Import + bannière, rendu vu par Loki) : ~1,5 j-h.
  - Scaffold + `scaffoldIds` + câblage/lint + asset : ~0,5 j-h.
  - Pratique dans `methode-de-travail.md` + `legolas.md`/`nathalie.md` (canon), régénération des
    contrats déployés, parité `vendor-check` : ~0,75 j-h.
  - Doc mapping + gate + état des lieux : ~0,25 j-h.
- **Complexité / risque** : **moyenne**. Le HTML est bien compris (prototype existant, contrainte
  `file://` déjà tranchée). Le risque réel est côté **canon** : toucher `legolas.md`/`nathalie.md` sans
  rompre la parité cross-repo `vendor-check --strict drift 0` (piège documenté à répétition dans ce repo).
- **Inconnues susceptibles de faire glisser** :
  1. **Matérialisation du *contenu*** d'un fichier de scaffold par init/onboard (copie d'un asset réel
     vs simple création de chemin) — inspecter le précédent `projet._TEMPLATE.md` avant de coder AC-A.
  2. **Formulation d'attribution** dans le canon RQV sans recréer le cycle Legolas↔Nathalie
     (`legolas.md` reste la source unique).
  3. **Re-sync GUI** éventuel si l'édition des personas déclenche un drift `vendor-check` côté iakaFrameGUI.
  4. Le **fallback Export/Import** demande un test réel en `file://` par le décideur (petit, mais gate humain).
- **Nature** : ordre de grandeur assumé et révisable, **pas un engagement ferme** ; rappelé à la
  clôture du lot, confronté au temps réel.
