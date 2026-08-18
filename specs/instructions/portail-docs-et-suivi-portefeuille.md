# Portail de documentation généré + suivi du portefeuille (44 dépôts)

> Instruction de cadrage (P1, 2026-08-18), branche `feat/portail-docs-et-suivi`.
> **Lecture seule sur le code pendant le cadrage** ; ce fichier est le seul artefact produit.
> Les agents sont désignés par leur **rôle** (coordinateur projet, cadrage, exécution, gate
> qualité, rôle documentation, rôle design) — jamais par leur nom de persona. Un chemin de
> fichier qui contient un nom de persona reste cité tel quel : c'est un chemin, pas une
> désignation d'agent.
>
> **Trois régimes de vérité dans ce document, jamais mélangés :**
> - **MESURÉ** — constaté sur le disque ou sur le web le 2026-08-18, source citée.
> - **SUPPOSÉ** — hypothèse de travail, à **re-mesurer avant d'agir** (marqué ⚠️).
> - **DÉCIDÉ** — arbitrage du décideur (repris, non rouvert) ou du cadrage (motif écrit).

---

## Problème

Le décideur conduit **44 dépôts git en parallèle** (mesuré, `~/work`), seul, et n'a aujourd'hui
aucun endroit unique pour (1) **lire** la documentation d'un projet sans ouvrir le dépôt, ni
(2) **voir en un écran ce qui bouge** sur l'ensemble du portefeuille. La documentation est
pourtant déjà produite par les agents, sous forme de Markdown, dans chaque dépôt — elle n'est
simplement **jamais publiée**. Ce lot ne demande pas d'écrire de la documentation : il demande
de la **servir** et de **suivre** les projets.

Besoin, mot pour mot : « *à la vue de mes pratiques de dev, je voudrais utiliser un outil pour
suivre tous mes projets en parallèle et générer des docs en automatique depuis les IA pour poser
dans l'outil* », complété en clôture par « *ajoute que le coordinateur projet aura à charge la
synchro avec le portail de docs et si possible la synchro avec Vikunja* ».

---

## Décisions du décideur — REPRISES, NON ROUVERTES

Ces cinq verdicts sont arrêtés. Ils sont rappelés ici pour que l'exécution n'ait pas à les
reconstituer, **pas** pour être rediscutés.

| # | Verdict | Motif retenu par le décideur |
|---|---|---|
| D1 | **OpenProject écarté** | Le décideur travaille seul : rôles, permissions et workflows sont une surcharge pure, pour 2 à 4 Go de Rails. |
| D2 | **AppFlowy écarté** | Son API sait *ajouter* des blocs mais **pas les remplacer**. Or les docs sont **régénérées à chaque passage** : il faudrait « détruire puis recréer » — identifiants perdus, liens rompus, résidus, et perte possible si l'agent meurt entre les deux. |
| D3 | **Nextcloud écarté** | WebDAV était un excellent chemin d'écriture (PUT idempotent), mais ~2,5 Go de PHP pour servir du Markdown régénéré est disproportionné, et le rendu de doc technique est inférieur. |
| D4 | **Documentation : MkDocs Material**, servi par un **nginx** unique | Entrée = fichiers Markdown (exactement ce que produisent les agents) ; recherche plein texte embarquée hors ligne ; rendu de doc technique supérieur ; ~20 Mo de RAM au total. **Hugo écarté** : avec des sites indépendants par projet on ne reconstruit que le projet modifié, la vitesse de compilation cesse d'être un critère. |
| D5 | **Suivi : Vikunja** | ~150 Mo ; projets et sous-projets ; vues liste/tableau/table/Gantt ; **filtres enregistrés transverses à tous les projets** ; API REST complète et documentée. |

**Ce que « suivre tous mes projets en parallèle » veut dire ici** (cadrage du besoin, à ne pas
élargir) : **voir en un écran ce qui bouge**. Ce n'est **pas** planifier des dépendances
inter-projets.

**Architecture cible, arrêtée par le décideur :**

- **Un site par projet + un portail d'entrée** (choix explicite contre le site unique).
- **IP:port direct, pas de DNS** : `<hôte>:<port>/` = portail, `<hôte>:<port>/<projet>/` = site.
- **Un seul nginx**, arborescence servie sous `/srv/docs/`.
- La doc **source reste dans chaque dépôt** ; le site est un **artefact de build, jamais
  versionné** — il se jette et se refait.
- Le modèle **`iakadoc`** (00 Vue d'ensemble / 10 Le projet / 20 Où on en est / 30 Décisions &
  cadrage / 40 Qualité / 50 Recette / 60 Guide utilisateur / 90 Notes) se transpose en
  **arborescence de dossiers** : le préfixe numérique donne l'ordre de navigation sans
  déclaration.
- **Le portail est généré, pas tenu à la main** : il balaie les dépôts et rend une carte (titre,
  version, date de dernière publication). À 44 projets, un index manuel serait faux en une semaine.
- Cycle : régénération du Markdown → build du **seul** projet touché → publication dans
  `/srv/docs/<projet>/` → régénération du portail. **Idempotent de bout en bout ; si un build
  échoue, la version précédente reste servie.**
- **Vikunja et le portail ne se parlent pas** : deux services distincts.

---

## L'arbitrage tranché par le cadrage : **l'entrée du build**

Le décideur a laissé un seul point ouvert : (a) le moteur lit `specs/` et `CLAUDE.md` **là où ils
sont**, ou (b) un **arbre intermédiaire au format `iakadoc`** est produit d'abord, que le moteur
consomme.

### ➜ **TRANCHÉ : (b), l'arbre intermédiaire.** Avec une précision : il vit **hors des dépôts**.

Trois motifs, dont deux **mesurés** :

**1. Le moteur retenu a une fin de vie annoncée — MESURÉ.** Material for MkDocs est en période de
maintenance finale : correctifs critiques et de sécurité **jusqu'au 5 novembre 2026**, et pas
au-delà. Son successeur, **Zensical**, est écrit par la même équipe et se veut compatible avec les
projets Material existants. Ce n'est donc pas un changement de moteur « dans cinq ans » : c'est un
changement **dans les mois qui viennent**, quasi certain, et il se fera pendant la vie de cet
outillage. En **(a)**, le moteur lit les dépôts : en changer signifie retoucher l'organisation
interne des **44 dépôts**. En **(b)**, c'est remplacer **une fonction** et **une image de
conteneur** déclarée dans un `.env`. L'argument du découplage cesse d'être théorique : il est daté.

**2. (a) est déjà impossible sur le portefeuille tel qu'il est — MESURÉ.** Le 2026-08-18 :
- `~/work/iakaframe/CLAUDE.md` **n'existe pas** (le dépôt qui porte la méthode n'a pas le fichier
  que (a) irait lire) ;
- `docs/qualite/` et `specs/recettes/` **n'existent dans aucun** des deux dépôts sondés
  (`iakaframe`, `iakacontext`), alors que le modèle `iakadoc` leur réserve deux sections ;
- `~/work/iakaframe/docs/` contient de la **documentation rédigée à la main**
  (`docs/commandes.md`, `docs/guide-stefframe2.md`, `docs/restauration-portefeuille.md`) — c'est
  une **source**, pas le `docs/` d'entrée d'un générateur ; le confondre avec le répertoire de
  build ferait écrire un artefact par-dessus une source ;
- sur 44 dépôts, **38** ont un `CLAUDE.md` et **38** un `specs/PROJET.md` — jamais les mêmes
  exactement.

Faire lire les dépôts « là où ils sont » supposerait une uniformité **qui n'existe pas**. Il
faudrait de toute façon une couche de correspondance ; en (a) elle serait **implicite et
éparpillée** dans 44 configurations, en (b) elle est **explicite et unique**.

**3. Le coût de (b) est une étape MACHINE, pas une charge humaine.** C'est le point qui désamorce
l'objection « (b) coûte une étape » : l'arbre intermédiaire est **dérivé mécaniquement** par le
CLI depuis les chemins canoniques que la méthode connaît déjà (§ Table de correspondance).
**Aucun agent n'a de nouveau fichier à écrire, aucun dépôt n'est modifié.** Les agents continuent
d'écrire exactement où ils écrivent aujourd'hui.

### Précision : l'intermédiaire vit hors des dépôts

**DÉCIDÉ (cadrage) :** l'arbre intermédiaire et les sites bâtis vivent dans un **espace de travail
hors dépôts**, `~/.iaka/docs/` (même famille que `~/.iaka/memory/` et `.iaka/observation/`, déjà en
usage — mesuré dans l'aide du CLI). Motifs : (i) « artefact de build, jamais versionné » devient un
**fait structurel** et non une discipline à tenir ; (ii) cela évite d'éditer **44 `.gitignore`** ;
(iii) une publication ne peut alors **jamais salir un arbre git** — ce qui devient un critère
d'acceptation vérifiable.

### Le coût de (b), assumé et écrit

La table chemin→section devient un **artefact à maintenir** : si une convention de la méthode
change, la table doit suivre. C'est le prix du découplage. Il est payé **une fois, dans un
fichier** (`cli/src/lib/docs-map.js`), pas 44 fois dans 44 dépôts.

---

## Faits vérifiés sur le web le 2026-08-18 (avec sources)

| Fait | Vérifié | Conséquence dans ce lot |
|---|---|---|
| Material for MkDocs : **fin de vie le 5 novembre 2026**, correctifs critiques et sécurité seulement d'ici là | oui | Motif n°1 de l'arbitrage. Le moteur est isolé derrière **une seule** fonction. |
| **Zensical**, successeur par la même équipe, se veut compatible avec les projets Material | oui | Migration future = remplacement d'image + de la fonction de rendu, **reportée** (§ Reporté). |
| MkDocs 2.0 est **incompatible** avec Material (plus de système de plugins, config TOML, pas de chemin de migration) ; Material 9.7.5 borne MkDocs à `<2` | oui | **Ne jamais suivre `latest`** : l'image du moteur est **pinnée** en `.env`. |
| Image Docker du moteur : `squidfunk/mkdocs-material`, tags `9` / `9.x` | oui | Valeur par défaut de `.env.example`, à re-vérifier à l'exécution. |
| Recherche Material : **multilingue, côté client, hors ligne** (lunr) | oui | Confirme D4 : la recherche marche sans réseau externe → critère d'acceptation. |
| Vikunja : **conteneur unique** `vikunja/vikunja` depuis la 0.22 ; port **3456** par défaut ; **SQLite par défaut** | oui | Une seule image, pas de base séparée au lot 1. |
| Vikunja : `VIKUNJA_SERVICE_PUBLICURL` doit être l'URL publique **complète, protocole + slash final**, et **doit inclure le port** s'il n'est pas standard, sinon erreurs CORS / « unauthorized » à la création de compte | oui | Piège n°1 du déploiement : consigné en dur dans le README de la stack. |
| Vikunja : **filtres enregistrés transverses**, privés au compte, tirant les tâches de **tous** les projets | oui | Confirme D5 et la définition du besoin (« voir ce qui bouge »). |
| Vikunja : **jetons d'API scopés**, créés dans les réglages utilisateur, **affichés une seule fois** | oui | Le jeton est saisi à la main par le décideur et vit en `.env` **non commité**. |
| **CVE-2026-40103** (Vikunja, jetons scopés, confusion de méthode, CVSS 4.3) — **corrigé en 2.3.0** | oui | Version **pinnée ≥ 2.3.0**. Constat sécurité **consigné, non bloquant** (LAN, mono-utilisateur) — cf. arbitrage « sécu souple sur la plateforme de dev ». |
| Container Manager (Docker) : **DSM 7.2+, x86 uniquement** — le DS1520+ est x86, donc éligible | oui | Ne lève **pas** l'inconnue machine (§ Machine cible). |

Sources : [fin de vie Material for MkDocs](https://github.com/squidfunk/mkdocs-material/issues/8523) · [MkDocs 2.0 et Zensical](https://squidfunk.github.io/mkdocs-material/blog/2026/02/18/mkdocs-2.0/) · [Zensical](https://zensical.org) · [recherche Material](https://squidfunk.github.io/mkdocs-material/setup/setting-up-site-search/) · [installation MkDocs Material](https://squidfunk.github.io/mkdocs-material/getting-started/) · [installation Vikunja](https://vikunja.io/docs/installing/) · [exemple Docker complet Vikunja](https://vikunja.io/docs/full-docker-example/) · [filtres enregistrés Vikunja](https://vikunja.io/help/saved-filters/) · [API Vikunja](https://vikunja.io/docs/api-documentation/) · [avis de sécurité Vikunja](https://github.com/go-vikunja/vikunja/security/advisories/GHSA-v479-vf79-mg83) · [CVE-2026-40103](https://nvd.nist.gov/vuln/detail/CVE-2026-40103) · [Container Manager Synology](https://kb.synology.com/en-us/DSM/help/ContainerManager/docker_desc)

---

## Machine cible — ⚠️ SUPPOSÉE, à re-mesurer AVANT d'agir

**MESURÉ le 2026-08-18** : aucun NAS n'est joignable depuis le poste. Le poste est sur
`192.168.1.0/24`, le LAN iakabox sur `192.168.2.0/24`. L'hôte `192.168.1.248` est un **routeur**
Synology (SRM) — **SRM ne fait pas tourner Docker**. Le poste de dev est un macOS avec Docker
29.2.1 et 31 Go libres.

**SUPPOSÉ** : machine cible Synology DS1520+ (Celeron J4125, 4 c, 8 Go DDR4 non extensibles
officiellement, Container Manager disponible).

**DÉCIDÉ (cadrage) : le choix de la machine est un point d'EXÉCUTION, pas de cadrage.** Rien dans
ce lot ne dépend d'une machine particulière : les deux stacks sont des `docker compose` standards,
l'hôte et les ports sont **lus depuis `.env`**, jamais écrits en dur. En conséquence :

> **Étape 0, bloquante et non contournable** : avant tout `docker compose up`, l'exécution
> **re-mesure** l'hôte cible (joignabilité, `docker version` / Container Manager présent, espace
> disque libre, RAM libre) et **consigne le relevé** dans le README de la stack. Un hôte non
> re-mesuré = lot arrêté et remonté au décideur. **La mémoire d'un relevé n'est pas un relevé.**

**Repli explicitement autorisé** : si aucun hôte permanent n'est joignable, monter les deux stacks
**sur le poste de dev macOS** pour la recette. C'est un repli **de recette**, pas la cible ; il ne
change **aucune ligne** des compose (seul `.env` change).

---

## Décisions de cadrage (arbitrages qui restaient à poser)

| # | Décision | Motif écrit |
|---|---|---|
| C1 | **Entrée du build = arbre intermédiaire `iakadoc`, hors dépôts** | § Arbitrage ci-dessus. |
| C2 | **La dérivation COPIE, elle ne réécrit jamais le contenu** | Tout traitement de contenu (résumé, réécriture de liens, reformatage) crée une divergence entre le dépôt et le portail. Le portail doit montrer **ce qui est dans le dépôt**, à l'octet près. |
| C3 | **Une section sans source est OMISE**, jamais rendue vide | Mesuré : `docs/qualite/` et `specs/recettes/` n'existent nulle part aujourd'hui. Publier 44 sections vides rendrait le portail illisible et ferait passer une absence pour un contenu. |
| C4 | **`--strict` du moteur DÉSACTIVÉ au lot 1** | À 44 dépôts et 109 instructions rien que sur `iakaframe` (mesuré), un lien mort est quasi certain. En `--strict`, un seul lien mort prive le décideur **de tout le site du projet**. Les avertissements sont **consignés dans le rapport de publication** — visibles, pas tus. Durcissement projet par projet : reporté. |
| C5 | **Image du moteur PINNÉE en `.env`, jamais `latest`** | Mesuré : MkDocs 2.0 est incompatible avec Material ; un `latest` casserait tous les builds sans prévenir. Précédent interne : « Tags d'images FIGES (jamais `latest`) » (`iakacontext/docker-compose.dev.yml`). |
| C6 | **Un seul point de montage `/srv/docs` en bind, pas un volume Docker nommé** | Le contenu est un artefact reconstructible **écrit depuis l'hôte** par la commande de publication ; un volume nommé le rendrait opaque à l'écriture hôte. Conforme à « un seul nginx, une seule arborescence ». |
| C7 | **Vikunja au lot 1 = LECTURE SEULE** | § Synchronisation du suivi. |
| C8 | **Les exclusions du balayage sont un REGISTRE MOTIVÉ**, `config/portail-docs-exclusions.txt`, une ligne = un motif | Mesuré : `~/work/iakaHub-wt-hub-veille` est un **worktree** à la racine du portefeuille ; le balayage existant le compterait comme un 45ᵉ projet et le portail afficherait un doublon. Une liste en dur et muette est le défaut à éviter : **écarter n'est pas taire**. |
| C9 | **Découpage en deux sous-lots gatés séparément : 1A outillage, 1B charge du coordinateur** | 1B touche un contrat de persona **vendorisé vers un dépôt frère** (§ Risques R4) : le gate qualité de 1A doit pouvoir passer au vert sans être pollué par un drift cross-dépôt attendu. Le décideur peut aussi s'arrêter après 1A. |

---

## Périmètre

### Inclus — LOT 1A : l'outillage (le cœur du lot)

1. **Stack `stack-docs/`** — un `nginx` unique servant `/srv/docs` en lecture seule.
2. **Stack `stack-suivi/`** — un conteneur Vikunja unique (SQLite), version pinnée ≥ 2.3.0.
3. **Dérivation `iakadoc`** — table de correspondance chemin→section + génération du `mkdocs.yml`
   du projet, dans l'espace de travail hors dépôts.
4. **Rendu isolé derrière UNE fonction** — `renderSite()`, seul endroit du dépôt qui nomme le
   moteur.
5. **Publication atomique** — swap par renommage ; en cas d'échec, la version précédente **reste
   servie**.
6. **Portail généré** — page d'index unique bâtie par balayage du portefeuille, réutilisant la
   couche de scan **existante** (`cli/src/lib/portfolio.js`, lecture seule, mesurée).
7. **Verbe CLI `docs`** — `publish` (dérive → build → swap → régénère le portail) et `status`
   (lecture seule).
8. **Verbe CLI `suivi status`** — **lecture seule** sur l'API de suivi : joignabilité, nombre de
   projets, écart avec le portefeuille.
9. **Tests + doc des commandes** — tests `node --test` et mise à jour de `docs/commandes.md`,
   **compteurs recalculés**.

### Inclus — LOT 1B : la charge du coordinateur projet (demande explicite du décideur)

10. **Écriture de la charge dans le contrat du rôle coordinateur**, en termes **agnostiques du
    produit** (§ Synchronisation).
11. **Propagation aux copies internes au dépôt** + resync du miroir de frame.

### Exclu — nommément, avec motif

| Exclu | Motif |
|---|---|
| **Toute écriture dans l'API de suivi** (créer/mettre à jour des projets ou des tâches) | Une écriture idempotente exige une **clé de corrélation stable** (identifiant de suivi ↔ nom de projet) qui n'existe pas encore. Un premier essai raté crée **44 projets à supprimer à la main**. Le décideur a dit « **si possible** » : la reconnaissance est livrée, l'écriture est reportée avec motif. |
| **Toute passerelle portail ↔ suivi** | Décision du décideur : « les deux ne se parlent pas ». |
| **Toute écriture dans les 44 dépôts du portefeuille** | Le lot est **lecture seule** sur le portefeuille. Corollaire vérifiable : après une publication complète, `git status --porcelain` doit être **vide** partout. |
| **Rédiger ou corriger la documentation des projets** | Ce lot **sert** de la documentation, il n'en **écrit** pas. Écrire de la doc utilisateur relève du **rôle documentation** ; cadrer relève du **cadrage**. Le portail ne corrige pas un `PROJET.md` vide : il l'**affiche comme vide**. |
| **Réécriture des liens relatifs entre documents copiés** | Un lien `../PROJET.md` écrit dans une instruction ne pointera plus juste après copie. Corriger cela suppose un analyseur de liens : hors MVP. Rendu visible par les avertissements de build (C4), reporté. |
| **Habillage graphique du portail (charte)** | Le lot livre du HTML/CSS sobre et autonome. Toute direction visuelle relève du **rôle design** et de son réservoir de chartes ; l'introduire ici mélangerait deux gates. |
| **DNS, TLS, reverse proxy, authentification** | Règle en vigueur du portefeuille : **IP:port direct**. LAN privé, mono-utilisateur. |
| **Migration vers le moteur successeur** | Le moteur retenu est maintenu jusqu'au 2026-11-05 (mesuré). Migrer maintenant serait de l'anticipation non demandée ; la **couture** qui la rendra bon marché, elle, est livrée. |
| **Sort du dépôt `~/work/iakadocs`** | **MESURÉ** : ce dépôt existe déjà et n'est qu'une **coquille vide** (`CLAUDE.md` et `specs/PROJET.md` sont les gabarits non remplis). Le retirer, le renommer ou le remplir est une **décision de portefeuille** : elle appartient au décideur, pas à ce lot. Conséquence opérationnelle immédiate : **ne nommer aucun artefact de ce lot `iakadocs`**. |
| **Retrait de la brique produit de publication devenue caduque** | Le décideur a écarté AppFlowy **comme outil pour ce besoin** (D2) ; il n'a **pas** décidé de retirer la brique correspondante de la bibliothèque. Le faire ici serait trancher à sa place. **Remonté en point ouvert.** |
| **Planification, dépendances inter-projets, charge, Gantt inter-projets** | Hors de la définition du besoin, explicitement (« voir ce qui bouge », pas « planifier »). |

---

## Table de correspondance `iakadoc` — MESURÉE

Sources mesurées le 2026-08-18 sur `~/work/iakaframe` et `~/work/iakacontext`.

| Section du site | Source dans le dépôt | Constat mesuré |
|---|---|---|
| `index.md` (racine) | **dérivé** : nom, ligne de définition, version, arbre, dernier commit | Toujours produit. Réutilise `scanPortfolio()` / `readEtat()` — existants. |
| `00-vue-d-ensemble/` | `README.md` (si présent) puis `specs/PROJET.md` | `specs/PROJET.md` présent dans **38** dépôts sur 44. |
| `10-le-projet/` | `CLAUDE.md` | Présent dans **38** dépôts — **absent de `iakaframe` lui-même**. |
| `20-ou-on-en-est/` | `specs/etat-des-lieux.md` | Présent dans les deux dépôts sondés. |
| `30-decisions-et-cadrage/` | `specs/instructions/*.md` | **109** fichiers rien que sur `iakaframe`. |
| `40-qualite/` | `docs/qualite/*.md` | **Inexistant** dans les deux dépôts sondés → section **omise** (C3). |
| `50-recette/` | `specs/recettes/*` (statut seul) | **Inexistant** dans les deux dépôts sondés → section **omise** (C3). |
| `60-guide-utilisateur/` | `docs/**/*.md` **hors** `docs/qualite/` | 3 fichiers sur `iakaframe`. |
| `90-notes/` | les `specs/*.md` restants non déjà mappés + `specs/canon/PRODUIT.md` | `iakaframe` : `glossaire-iakaframe.md`, `equipe-agents.md`. |

Règles de la dérivation :
- **`.md` uniquement.** Les `.html`, `.json` et fichiers d'état internes (ex.
  `specs/.iakaframe-journal.json`, `specs/etat-des-lieux.html`) sont **ignorés** : le moteur rend
  du Markdown, et publier le `.html` **et** le `.md` du même état des lieux donnerait deux pages
  contradictoires.
- **Copie à l'octet près** (C2), nom de fichier conservé.
- **Section sans source → omise** (C3).
- **Aucun repli deviné.** Un dépôt sans aucune source mappée produit un site réduit à son
  `index.md` dérivé — et le portail l'affiche comme tel.

---

## Ports hôte — ALLOUÉS NOMMÉMENT

Isolation Docker par projet : **deux stacks distinctes**, réseaux, volumes, conteneurs préfixés,
ports hôte distincts.

| Stack | Nom du projet compose | Préfixe | Port hôte | Port conteneur | Variable `.env` |
|---|---|---|---|---|---|
| Documentation | `iakaframe-docs` | `idocs-` | **8480** | 80 (nginx) | `IAKAFRAME_DOCS_HTTP_PORT` |
| Suivi | `iakaframe-suivi` | `isuivi-` | **8481** | 3456 (Vikunja) | `IAKAFRAME_SUIVI_HTTP_PORT` |

**Preuve de non-collision — MESURÉE** le 2026-08-18 sur les 17 fichiers `docker-compose*.y*ml`
présents à la racine des projets de `~/work`, plus les ports d'infra connus. Ports **occupés**, à
ne jamais reprendre : `80`, `443`, `1883`, `3001` (aussi Forgejo), `3002`, `3003`, `3010`
(poste de dev), `3021`, `3022`, `3024`, `3031`, `3032`, `4001`, `5051`, `5432`, `5433`, `5434`,
`5678`, `5679`, `5984`, `8080`, `8081`, `8082`, `8083`, `8084`, `8090`, `8091`, `8190`, `8349`,
`8350`, `8351`, `9002`, `9883`, `11434`, `39876`, `54379`, `54432`, `54678`, `54700`, `54900`,
`54901`. **8480 et 8481 sont libres.**

⚠️ **SUPPOSÉ** : que ces ports soient aussi libres **sur l'hôte cible**. À **re-mesurer** à
l'étape 0. Les deux ports sont **configurables par `.env`** précisément pour que ce constat ne
soit jamais bloquant (précédent interne : `iakacontext`, ports hôte configurables et documentés).

---

## Synchronisation — la charge du coordinateur projet (LOT 1B)

Demande du décideur, mot pour mot : « *le coordinateur projet aura à charge la synchro avec le
portail de docs et si possible la synchro avec Vikunja* ».

### Portail de documentation — OBLIGATOIRE

Le contrat du rôle **coordinateur projet** reçoit une obligation :

- **Quand** : à toute **clôture de lot** et à tout **changement de version** — les moments où
  l'état des lieux est déjà régénéré. Aucun nouveau rituel n'est créé : la charge **se greffe sur
  les moments existants**.
- **Quoi** : il **déclenche la publication** de la documentation du projet vers le portail du
  portefeuille, puis **vérifie sur pièce** que le projet y apparaît publié et daté du jour.
- **Ce qu'il ne fait pas** : il **n'écrit pas** la documentation. Il déclenche et constate. La
  rédaction reste au **rôle documentation**, le cadrage au **cadrage**. Cette frontière est écrite
  des deux côtés du geste.
- **Échec propre non bloquant** : portail injoignable ou publication en erreur → **message net et
  code de sortie non nul**, **sans bloquer** la clôture. Aligné sur le garde-fou déjà en vigueur
  pour la capacité de mémoire humaine (mesuré : `library/skills/iakaframe-memoire-humaine/SKILL.md`
  § Garde-fous).
- **Preuve avant déclaration** : « publié » ne se déclare pas de mémoire — il se constate en
  rouvrant l'artefact publié.

### Suivi — SECONDAIRE, avec un critère net

Le décideur a dit « **si possible** ». Le critère de coupe est le suivant, et il est net :

| Au lot 1 (fait) | Reporté (lot 2) |
|---|---|
| La stack de suivi est **montée et joignable**. | Toute **écriture** dans l'outil de suivi. |
| Un jeton d'API **scopé lecture** est créé à la main par le décideur, stocké en `.env` **non commité**. | Création automatique d'un projet de suivi par projet du portefeuille. |
| `iakaframe suivi status` : joignabilité, nombre de projets, **liste des projets du portefeuille absents du suivi**. | Remontée des jalons ouverts en tâches. |
| Le coordinateur **constate l'écart** et le **remonte au décideur**. | Synchronisation bidirectionnelle (jamais demandée). |

**Motif de la coupe** : l'écriture idempotente exige une clé de corrélation stable qui n'existe pas
encore ; sans elle, un premier essai raté laisse 44 projets à nettoyer à la main. La reconnaissance
en lecture seule, elle, livre **immédiatement** la valeur demandée — voir l'écart — sans aucun
risque de dégât.

### Agnosticisme du produit dans le contrat — contrainte MESURÉE

Le contrat du rôle coordinateur **ne doit nommer aucun produit** : ni le moteur de rendu, ni le
serveur web, ni l'outil de suivi. Il nomme la **capacité** (« le portail de documentation du
portefeuille », « l'outil de suivi »). Trois motifs, tous mesurés :

1. C'est la **règle cardinale** déjà écrite dans la bibliothèque : « Cette skill ne nomme **aucun**
   produit, aucun serveur, aucun endpoint, aucune IP » (`library/skills/iakaframe-memoire-humaine/`).
2. C'est la convention de nommage du portefeuille : **nommer par le geste, pas par l'outil**.
3. **Contrainte technique** : le contrat est **miroité** dans `frames/releases/StefFrame2/`, sous
   une garde d'anonymisation (`iakaframe frame verify`, portes G1–G6, dont une **liste blanche de
   marques**). Y écrire un nom de produit fait **rougir la garde**. L'agnosticisme n'est donc pas
   une préférence de style : c'est une condition de passage.

---

## Étapes d'implémentation

### Étape 0 — Re-mesure de l'hôte (bloquante)

0. Re-mesurer l'hôte cible : joignabilité, moteur de conteneurs présent et sa version, espace
   disque libre, RAM libre, **ports 8480 et 8481 libres**. Consigner le relevé, daté, dans
   `stack-docs/README.md`. Hôte non re-mesuré ⇒ **arrêt et remontée au décideur**.

### Lot 1A — outillage

1. **`stack-docs/`** : `docker-compose.yml` (un service `nginx` en image alpine pinnée, conteneur
   `idocs-nginx`, réseau `iakaframe-docs`, bind `${IAKAFRAME_DOCS_SITE_DIR}:/srv/docs:ro`, port
   `${IAKAFRAME_DOCS_HTTP_PORT:-8480}:80`), `.env.example`, `.gitignore` (ignore `.env`),
   `README.md`. **Calquer la forme de `stack-qualite/`** (mesuré : `name:` de projet, préfixe de
   conteneurs, commentaire de motivation des ports) — ne pas inventer une seconde convention.
2. **`stack-suivi/`** : `docker-compose.yml` (un service `vikunja/vikunja` **pinné ≥ 2.3.0**,
   conteneur `isuivi-vikunja`, réseau `iakaframe-suivi`, volumes `isuivi_files` et `isuivi_db`,
   port `${IAKAFRAME_SUIVI_HTTP_PORT:-8481}:3456`), `.env.example`, `.gitignore`, `README.md`.
   Le README **consigne en toutes lettres** le piège mesuré : `VIKUNJA_SERVICE_PUBLICURL` doit
   porter le protocole, l'hôte, **le port** et le **slash final**.
3. **`cli/src/lib/docs-map.js`** : la table de correspondance (§ Table), la dérivation par copie,
   l'omission des sections sans source, la génération du `mkdocs.yml` du projet (nom du site, thème,
   greffon de recherche, `site_url` en sous-chemin `/<projet>/`, **pas de `nav` déclaré** — l'ordre
   vient des préfixes numériques).
4. **`cli/src/lib/docs-render.js`** : **la couture**. Une fonction `renderSite(stagingDir, outDir)`
   qui invoque le moteur en conteneur éphémère, image lue depuis l'environnement, **sans `--strict`**
   (C4), et **remonte les avertissements** dans son résultat. **Aucun autre fichier du dépôt ne
   nomme le moteur.**
5. **`cli/src/lib/docs-publish.js`** : swap atomique. Build vers `<site>/<projet>.new` → renommage
   de l'ancien en `.old` → renommage de `.new` en `<projet>` → suppression de `.old`. Toute erreur
   **avant** le renommage final laisse la version précédente en place et servie.
6. **`cli/src/lib/docs-portal.js`** : génération de `<site>/index.html`. Balaye via
   `scanPortfolio()` (existant), applique le **registre d'exclusions motivé** (C8), ajoute la
   **date de dernière publication** (date de modification de `<site>/<projet>/index.html`). Un
   projet sans définition affiche « définition absente ». HTML+CSS autonomes, aucune ressource
   externe (le portail doit s'afficher **hors ligne**).
7. **`cli/src/lib/suivi.js`** : client HTTP **lecture seule** (`GET` uniquement, aucune méthode
   d'écriture exposée), jeton lu depuis l'environnement, échec propre si absent.
8. **`cli/src/commands/docs.js`** et **`cli/src/commands/suivi.js`** ; câblage dans
   `cli/src/index.js` (imports + `case` + entrées du bloc `HELP`). Options : `--all`, `--root`,
   `--dry-run`, `--json`. Sortie `--json` conforme à la convention **déjà en vigueur** (objet
   2-indenté, `ok:true|false`, collection = clé au pluriel + `count`) — mesurée dans le `HELP`.
9. **`config/portail-docs-exclusions.txt`** : registre créé, **une ligne = un motif**, avec au
   moins l'entrée mesurée `iakaHub-wt-hub-veille  # worktree, pas un projet`.
10. **Tests `node --test`** : table de correspondance (sections omises, `.md` seul, copie à
    l'octet), swap atomique (échec ⇒ ancienne version intacte), portail (projet sans définition,
    exclusion appliquée), client de suivi (HTTP mocké, aucune écriture possible).
11. **`docs/commandes.md`** : ajouter `docs` et `suivi` en partie B, **recalculer tous les
    compteurs** et la date. Discipline mesurée, inscrite dans le fichier lui-même : une date
    fraîche sur un compteur faux produit un document qui **a l'air** vérifié.
12. **Recette** : monter les deux stacks, publier `--all`, parcourir le portail, couper le réseau
    externe et vérifier la recherche.

### Lot 1B — charge du coordinateur

13. Écrire l'obligation dans le contrat du rôle coordinateur (`library/personas/aragorn.md`), en
    **termes agnostiques** (§ Synchronisation) — publication du portail **obligatoire**, constat
    d'écart du suivi en **lecture seule**, échec propre non bloquant, preuve avant déclaration.
14. Ajouter **une ligne** au narratif de la méthode (`methode-de-travail.md`) : le narratif reste
    la référence des rôles (règle interne mesurée « le narratif reste la référence, I5 »).
15. **Propager aux copies internes au dépôt** — et **relire chacune sur le disque après écriture** :
    `cli/test/fixtures/agents-golden/aragorn.md`, `kits/iakaframe-anythingllm/prompts/aragorn.md`,
    `frames/releases/StefFrame2/library/personas/aragorn.md`,
    `frames/releases/StefFrame2/personas/aragorn.md`,
    `frames/releases/StefFrame2/kits/iakaframe-claude/.claude/agents/aragorn.md`,
    `frames/releases/StefFrame2/kits/iakaframe-anythingllm/prompts/aragorn.md`,
    `frames/releases/StefFrame2/methode-de-travail.md`.
    ⚠️ `cli/_bundled/` est **généré et ignoré par git** (mesuré, `cli/scripts/bundle.js`) : **rien à
    faire à la main**.
16. Repasser `node --test`, `iakaframe frame verify --json`, `iakaframe vendor-check --json` et
    **consigner le verdict de chacun**, y compris le drift attendu (§ R4).

---

## Fichiers concernés

**Créés**

- `stack-docs/docker-compose.yml`, `.env.example`, `.gitignore`, `README.md` — stack du portail.
- `stack-suivi/docker-compose.yml`, `.env.example`, `.gitignore`, `README.md` — stack du suivi.
- `cli/src/lib/docs-map.js` — table de correspondance + dérivation + `mkdocs.yml`.
- `cli/src/lib/docs-render.js` — **la couture du moteur** (seul fichier qui le nomme).
- `cli/src/lib/docs-publish.js` — swap atomique.
- `cli/src/lib/docs-portal.js` — génération du portail.
- `cli/src/lib/suivi.js` — client de suivi, lecture seule.
- `cli/src/commands/docs.js`, `cli/src/commands/suivi.js` — verbes.
- `cli/test/docs-map.test.js`, `docs-publish.test.js`, `docs-portal.test.js`, `suivi-status.test.js`.
- `config/portail-docs-exclusions.txt` — registre d'exclusions motivé.

**Modifiés**

- `cli/src/index.js` — imports, deux `case`, bloc `HELP`.
- `docs/commandes.md` — partie B + compteurs + date.
- `library/personas/aragorn.md` — obligation de synchronisation (lot 1B).
- `methode-de-travail.md` — une ligne de narratif (lot 1B).
- les 7 copies listées à l'étape 15 (lot 1B).

**Lus, jamais modifiés**

- `cli/src/lib/portfolio.js`, `cli/src/lib/etat.js`, `cli/src/lib/git.js` — réutilisés tels quels.
- Les 44 dépôts de `~/work` — **lecture seule stricte**.

**Hors dépôt (espace de travail, jamais versionné)**

- `~/.iaka/docs/staging/<projet>/` — arbre `iakadoc` dérivé + `mkdocs.yml`.
- `~/.iaka/docs/site/` — arborescence servie : `index.html` (portail) + `<projet>/`.

---

## Risques

| # | Risque | Mitigation |
|---|---|---|
| R1 | **Hôte cible injoignable** (MESURÉ) — tout le déploiement repose sur une machine non vérifiée. | Étape 0 bloquante ; hôte et ports en `.env` ; repli de recette sur le poste de dev explicitement autorisé. Aucune ligne de compose ne change entre les deux. |
| R2 | **Machine modeste** (SUPPOSÉ : 4 cœurs, 8 Go non extensibles). Un `--all` sur 44 projets est long. | Le cycle nominal reconstruit **un seul** projet (c'est le motif même du choix « un site par projet »). `--all` est réservé à la reconstruction complète, **jamais** dans une boucle de clôture. Mesurer et **consigner** la durée d'un build unitaire et d'un `--all` à la recette. |
| R3 | **Fin de vie du moteur au 2026-11-05** (MESURÉ). | La couture `renderSite()` + l'image pinnée en `.env` ramènent la migration à un fichier et une variable. Critère d'acceptation dédié. |
| R4 | **Drift `vendor-check` cross-dépôt** (MESURÉ) : le contrat du rôle coordinateur est vendorisé **byte-à-byte** dans les fixtures d'un dépôt frère (`cli/src/lib/vendor.js`, 78 copies attendues). Le modifier fera **rougir `vendor-check`** — et le dépôt frère est **hors périmètre**. | **Constat attendu et DÉCLARÉ**, pas un échec du lot. Le gate qualité doit le **mentionner explicitement** en renvoyant ici ; il ne doit ni le masquer, ni le « corriger » en touchant le dépôt frère. Un lot de resync côté dépôt frère est **ouvert** (§ Reporté). C'est aussi le motif du découpage 1A/1B (C9). |
| R5 | **CVE-2026-40103** sur les jetons scopés de l'outil de suivi (MESURÉ, CVSS 4.3, corrigé en 2.3.0). | Version **pinnée ≥ 2.3.0**, re-vérifiée à l'exécution. Déploiement LAN, mono-utilisateur : constat **consigné, non bloquant** — conforme à l'arbitrage « sécu souple sur la plateforme de dev ». |
| R6 | **Collision de nom** (MESURÉ) : `~/work/iakadocs` existe déjà, coquille vide. | Aucun artefact de ce lot ne porte ce nom (stacks : `iakaframe-docs` / `iakaframe-suivi`). Sort de la coquille **remonté au décideur**. |
| R7 | **Faux projets dans le balayage** (MESURÉ) : un worktree à la racine du portefeuille serait compté comme projet. | Registre d'exclusions **motivé** (C8) ; le hors-couverture est **déclaré, jamais tu**. |
| R8 | **Publication de gabarits non remplis** (MESURÉ sur `iakadocs`). | Le portail affiche « définition absente ». La dette devient **visible** au lieu d'être masquée — c'est une fonctionnalité, pas un défaut. Non bloquant. |
| R9 | **Liens relatifs cassés** après copie (§ Exclu). | `--strict` désactivé (C4) ; avertissements consignés dans le rapport de publication ; réécriture des liens **reportée**. |
| R10 | **Fuite de secret** : jeton d'API et secret de session. | `.env` **gitignoré** dans les deux stacks, `.env.example` seul versionné, jamais de valeur réelle. Calqué sur `stack-qualite/` (mesuré). |
| R11 | **Publication qui salit un dépôt** — le pire défaut possible sur 44 dépôts. | Structurellement impossible : rien n'est écrit sous `~/work/<projet>/`. **Vérifié** par un critère d'acceptation dédié. |
| R12 | **Le gate qualité n'a ni typecheck ni lint** (MESURÉ : `cli/package.json` n'expose que `start`, `test`, `bundle`). | Adaptation à un lot d'infra, **écrite** : `node --test` + `docker compose config` sur les deux stacks + la recette manuelle du § Critères. Ne pas réclamer un typecheck qui n'existe pas ; ne pas non plus le déclarer passé. |

---

## Critères d'acceptation

**Infrastructure**

- [ ] `docker compose -f stack-docs/docker-compose.yml config` et `-f stack-suivi/docker-compose.yml config` sortent **sans erreur**.
- [ ] Les deux stacks ont des **noms de projet, réseaux, volumes et préfixes de conteneurs distincts** ; aucun n'est partagé.
- [ ] Aucun port hôte de ce lot n'apparaît dans un autre `docker-compose*.y*ml` du portefeuille (vérifié par recherche sur `~/work/*/docker-compose*.y*ml`, **re-faite** à l'exécution).
- [ ] `.env` est ignoré par git dans les deux stacks ; `.env.example` ne contient **aucune** valeur réelle.
- [ ] Le relevé de re-mesure de l'hôte (étape 0), **daté**, figure dans `stack-docs/README.md`.

**Portail et sites**

- [ ] `http://<hôte>:8480/` répond 200 et rend le portail ; `http://<hôte>:8480/iakaframe/` répond 200 et rend le site du projet.
- [ ] Le portail liste chaque projet avec **titre, version et date de dernière publication**.
- [ ] Sur `iakadocs` (coquille mesurée), le portail affiche « définition absente » — il n'invente rien et ne masque rien.
- [ ] Le nombre de sites publiés par `--all` **égale** le nombre de projets rendus par `iakaframe portfolio --json` **moins** les exclusions déclarées. L'écart est **nul, vérifié par comptage**.
- [ ] Le portail s'affiche correctement **réseau externe coupé** (aucune ressource distante).
- [ ] La **recherche** d'un site de projet fonctionne **réseau externe coupé** : un mot présent dans une instruction publiée est retrouvé.
- [ ] Les sections `40-qualite` et `50-recette` sont **absentes** de la navigation des projets qui n'ont pas ces sources (C3).

**Idempotence et robustesse — la promesse centrale**

- [ ] `iakaframe docs publish iakaframe` lancé **deux fois** produit le **même arbre** : comparaison de la liste des fichiers **et de leurs empreintes**, hors horodatages. La preuve se fait **contre le disque**, jamais contre une autre sortie de la commande.
- [ ] Un build volontairement cassé (fichier de configuration corrompu injecté dans l'espace de préparation) ⇒ code de sortie **non nul**, message net, **et** `http://<hôte>:8480/<projet>/` sert **toujours la version précédente** — vérifié par un marqueur présent uniquement dans l'ancienne version.
- [ ] Après un `iakaframe docs publish --all`, `git status --porcelain` est **vide** dans au moins 3 dépôts témoins. **Aucun dépôt n'a été touché.**

**Couture du moteur (la garantie anti-fin-de-vie)**

- [ ] Une recherche du nom du moteur dans `cli/src/` ne rend **qu'un seul fichier** : `cli/src/lib/docs-render.js`. Toute autre occurrence est un échec du critère.
- [ ] L'image du moteur est **pinnée** (jamais `latest`) et lue depuis `.env`.

**Suivi (lecture seule)**

- [ ] `iakaframe suivi status --json` rend `ok:true`, le nombre de projets de l'outil de suivi et la **liste des projets du portefeuille qui y sont absents**.
- [ ] **Aucune écriture** : le nombre de projets dans l'outil de suivi est **identique avant et après** l'appel, et le client n'expose **aucune** méthode d'écriture.
- [ ] Jeton absent ou service injoignable ⇒ **message net + code de sortie non nul**, **sans** trace de pile et **sans** bloquer l'appelant.
- [ ] La version déployée de l'outil de suivi est **≥ 2.3.0** (R5), constatée sur le service en marche.

**Qualité du lot**

- [ ] `node --test` **vert** dans `cli/`, avec les 4 nouveaux fichiers de test présents et non vides.
- [ ] `docs/commandes.md` : les deux verbes figurent en partie B ; les **compteurs de verbes sont recalculés** et concordent exactement avec les `case` de `cli/src/index.js` ; la date est à jour.
- [ ] Commits atomiques en *conventional commits*, 1A et 1B **séparés**.

**Lot 1B — charge du coordinateur**

- [ ] Le contrat du rôle coordinateur porte la charge : publication du portail **obligatoire**, constat d'écart du suivi en **lecture seule**, **échec propre non bloquant**, **preuve avant déclaration**, et la frontière « il déclenche et constate, il ne rédige pas » écrite noir sur blanc.
- [ ] Une recherche de noms de produits (moteur de rendu, serveur web, outil de suivi) dans `library/personas/aragorn.md` rend **zéro** occurrence.
- [ ] `iakaframe frame verify --json` rend `ok:true` après resync du miroir.
- [ ] Le verdict de `iakaframe vendor-check --json` est **consigné** ; le drift cross-dépôt est **déclaré comme attendu**, avec renvoi à R4 — **ni masqué, ni contourné en modifiant le dépôt frère**.

---

## Reporté à un lot ultérieur (avec motif)

| Reporté | Motif |
|---|---|
| **Écriture dans l'outil de suivi** (création des projets, remontée des jalons ouverts en tâches) | Exige une clé de corrélation stable ; un essai raté laisse 44 projets à nettoyer à la main. Le lot 1 livre la mesure de l'écart, qui est la valeur immédiate. |
| **Resync des fixtures vendorisées du dépôt frère** | Autre dépôt, autre branche : hors périmètre par construction (R4). |
| **Migration vers le moteur successeur** | Le moteur retenu est maintenu jusqu'au 2026-11-05 ; la couture qui rendra la migration bon marché est livrée maintenant. Le lot de migration devra être **daté avant** cette échéance. |
| **Réécriture des liens relatifs** entre documents copiés | Suppose un analyseur de liens : hors MVP. |
| **`--strict` par projet** | Une fois les liens assainis, durcir projet par projet, jamais d'un coup sur 44 dépôts. |
| **Habillage graphique du portail** selon une charte | Relève du rôle design et de son réservoir ; mélanger les deux brouillerait les gates. |
| **Correspondance surchargeable par dépôt** (un dépôt fournit son propre arbre `iakadoc`) | Second chemin de code non justifié tant qu'aucun dépôt n'a exprimé le besoin. La couture existe déjà : le jour venu, c'est une bifurcation dans un seul fichier. |
| **Publication déclenchée automatiquement** par le rituel de clôture | Au lot 1 le coordinateur déclenche **explicitement**. Automatiser avant d'avoir mesuré la durée d'un build serait de la sur-ingénierie — et une clôture qui traîne se paie tous les jours. |

---

## Estimation — jalon P1→P2

> **Ce n'est pas un engagement ferme** : un ordre de grandeur assumé et révisable, à confronter
> au temps réel à la clôture du lot.

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **4 à 6 j-h** — répartis : stacks 0,5 · dérivation + `mkdocs.yml` 0,75 · couture + build + swap 0,75 · portail 0,5 · verbes CLI 0,5 · lot 1B et propagation 0,75 · tests + doc des commandes 0,75 · recette et re-mesure 0,5. |
| **Complexité** | **Moyenne.** Aucune brique n'est difficile prise isolément ; la difficulté est le **nombre de pièces** et la discipline d'idempotence. Le balayage du portefeuille est **réutilisé**, pas réécrit. |
| **Risque** | **Moyen à élevé**, concentré sur deux points : la **propagation des copies vendorisées** (R4, lot 1B) et l'**hôte non mesuré** (R1). 1A seul, sans 1B : risque **moyen**. |

**Inconnues susceptibles de faire glisser l'estimation :**

1. **L'hôte cible.** S'il faut installer/configurer Container Manager, ouvrir des ports, ou si la
   machine s'avère être autre chose que ce qui est supposé : **+0,5 à +1 j**.
2. **Le volume réel de documentation.** 44 dépôts dont un seul porte déjà 109 instructions : si un
   `--all` dépasse plusieurs dizaines de minutes sur une machine modeste, il faudra du
   parallélisme ou de l'incrémental — **+0,5 j**.
3. **La propagation des copies (1B).** Le nombre exact de copies à resynchroniser et le
   comportement précis des gardes ne sont connus **qu'en les faisant tourner** : **+0,5 j** si une
   garde se révèle plus stricte que prévu.
4. **La qualité réelle des sources.** Des `CLAUDE.md` ou `PROJET.md` très hétérogènes sur 44
   dépôts peuvent produire des sites décevants et appeler un aller-retour de cadrage — **+0,5 j**.

**Découpe possible si le décideur veut engager moins** : livrer **1A seul** (portail + sites +
lecture du suivi), et gater 1B (charge du coordinateur) séparément. 1A seul : **3 à 4 j-h**, risque
moyen, et il livre déjà l'intégralité de la valeur d'usage — le portail et la vue de suivi.

---

## Points laissés OUVERTS pour le décideur

1. **Le sort de `~/work/iakadocs`** (coquille vide mesurée) : le retirer, le renommer, ou en faire
   plus tard le foyer de cet outillage ? Décision de portefeuille, hors de ce lot.
2. **La brique produit de publication devenue caduque** : AppFlowy a été écarté **comme outil pour
   ce besoin** (D2), mais la brique correspondante est toujours dans la bibliothèque. La retirer et
   la remplacer par une brique « portail » serait cohérent — et déplacerait les compteurs de
   vendorage. **Le cadrage ne tranche pas à la place du décideur.**
3. ~~**Engager 1B maintenant, ou seulement 1A ?**~~ → **TRANCHÉ par le décideur le 2026-08-18 :
   on part sur le LOT 1A SEUL.** Le lot 1B (charge de synchronisation du coordinateur projet)
   est **reporté à un lot ultérieur**, gaté séparément. Motif : 1A livre déjà l'intégralité de
   la valeur d'usage (portail + 44 sites + vue de suivi) pour 3 à 4 j-h et un risque moyen,
   là où 1B concentre l'essentiel du risque (propagation des copies vendorisées, R4). Le
   portail doit vivre et être vu avant qu'on automatise sa mise à jour.

> ⚠️ **Conséquence sur la lecture de cette instruction.** Tout ce qui est marqué **LOT 1B** —
> § *Inclus — LOT 1A/1B*, § *Synchronisation*, § *Étapes — Lot 1B* — est **hors du périmètre
> engagé**. Ces sections restent écrites, elles servent de cadrage prêt à l'emploi pour le lot
> suivant, mais **l'exécution ne doit pas les entreprendre**. Le gate de fin de lot porte sur
> **1A seul**.
