# Bundle complet — une installation, quatre composants

> Cadrée par 🟡 **Odin** (portefeuille), le **2026-08-25**, sur **directive du décideur**.
> **Lecture seule** sur le code pendant le cadrage : tout fait chiffré ci-dessous a été **relevé
> sur le disque**, jamais déduit d'une mémoire de session.
>
> **Portée portefeuille** : le lot traverse **quatre dépôts** (`iakaframe`, `IakaCockpit`,
> `iakaFrameGUI`, plus le kit hôte). Aucun d'eux ne peut le porter seul — d'où le cadrage au
> niveau du chapeau.
>
> **EN ATTENTE D'ARBITRAGE** : 7 arbitrages (AR-1..AR-7) sont posés avec recommandation. Rien
> ne part au dev avant que Stéphane les tranche.

---

## 0. Amendement du 2026-08-28 — les trois canaux

> Amendé par 🟡 **Odin**, sur **décision du décideur** : « il faut avoir **trois dépôts
> synchrones** : iakabox `192.168.2.11`, le NAS `192.168.1.139` et GitHub. **Quand les uns sont
> off, les autres sont le backup.** »

Cette décision **tranche** la question que le cadrage du 25/08 laissait ouverte sous F3 (« sur
quelle machine remettre le canal ? ») : la réponse n'est **aucune des trois en particulier**,
c'est **les trois, avec bascule**. Elle **agrandit le lot 0** et ajoute **AR-7**.

**Quatre faits relevés le 2026-08-28** (mesure, pas déduction) :

- **A1 — les trois remotes existent déjà** dans les trois dépôts (`origin` = NAS, `iakabox`,
  `github`). Rien à créer : le nommage est en place partout.
- **A2 — aucun des trois n'était synchrone, et le seul allumé était le plus en retard.** Mesuré
  en direct : GitHub accusait **6 commits** de retard sur `iakaframe` et **15** sur
  `IakaCockpit` ; l'iakabox (dernier fetch connu) **38** et **15**. Seul `iakaFrameGUI` était à
  jour partout. *Rattrapé le jour même : les trois `main` sont désormais identiques sur GitHub
  (`886a56b` / `2f1e7b9` / `e70a284`), avances rapides vérifiées avant poussée. Les deux forges
  LAN restent à rattraper à leur retour.*
- **A3 — cause racine : toute la chaîne d'outillage est mono-remote, câblée en dur sur
  `origin`.** Ce n'est pas un oubli de push, c'est une propriété du code :
  `update.js:118` pousse `git push origin <branche>` — **une seule cible** ;
  `repo.js:105` et `onboard.js:133` configurent **un** remote, nommé `origin` ;
  `range` (sauvegarde du portefeuille) est **zéro-réseau par choix assumé** et son conseil est la
  constante `CONSEIL = '-> git push -u origin <branche>'` ;
  `lib/forgejo.js:13` porte **une** constante `DEF_URL = 'http://192.168.1.139:3001'`,
  surchargeable par un `FORGEJO_URL` **mono-valeur**.
  ⇒ À chaque checkpoint, le NAS reçoit et **les deux autres décrochent en silence**. C'est
  exactement le mécanisme qui a produit A2, et il se reproduira à l'identique tant qu'il tient.
- **A4 — côté lecture, la bascule est presque gratuite.** L'updater Tauri accepte une **liste
  ordonnée d'endpoints** et le contrat de L34 le prévoyait déjà (« un futur flux HTTPS se
  préfixe ») : trois URL, essayées dans l'ordre. Aujourd'hui le Cockpit et le FrameGUI n'en ont
  **qu'une**.

**Principe directeur qui en découle** — c'est AR-2 (« une source silencieuse est une source qui
dérive ») appliqué aux **dépôts** : une cible injoignable n'est **pas une erreur**, c'est un
**état à dire**. Un canal muet est un canal qui dérive.

---

## 1. Directive

> « On prévoit maintenant, même si les concepts peuvent être séparés, de livrer en install la
> méthode iakaframe **en même temps** que notre CLI, avec le iakaframe **activé par défaut**.
> Ainsi on peut mettre en place une install enchaînant les quatre installs **après validation** :
> CLI, méthode, Cockpit, FrameGUI. Ceci sera le **bundle complet**. »

Deux décisions sont **rendues** et ne sont pas rediscutées ici :

1. **La méthode est livrée avec le CLI, activée par défaut.** La séparation conceptuelle
   outil / contenu **demeure** (§ 3) — c'est le *défaut d'installation* qui change, pas le modèle.
2. **Le bundle complet est une chaîne de quatre installations, chacune précédée d'une validation.**
3. *(amendement du 28/08)* **Le canal est triple et redondant** — iakabox, NAS, GitHub —, chacun
   servant de secours aux autres. Ce n'est pas rediscuté ; ce qui est cadré ci-dessous, c'est
   **comment** on le tient (§ 0, lot 0, AR-7).

---

## 2. Ce qui existe — relevé le 2026-08-25

| Composant | Nature | Installation actuelle | État |
|---|---|---|---|
| **CLI** `@naonedge/iakaframe` | Node pur, **zéro dépendance**, ≥ 20 | `npm install -g ./cli`, ou npm privé, ou wrapper | ✅ v0.39.0 |
| **Méthode** (kit hôte) | `CLAUDE.md`, `settings.json`, hooks, agents, skills, commandes | `node install.mjs` (fan-out multi-hôte) | ✅ posée sur ce poste : 10 agents, 23 skills, 11 commandes, 10 hooks |
| **IakaCockpit** | app desktop **Tauri** | build local + copie dans `/Applications` | ⚠️ pas d'installeur ; canal d'auto-update **hors service** |
| **iakaFrameGUI** | app desktop **Tauri** (`iakaframegui` v0.1.7) | ~~non relevé~~ → **relevé le 28/08** : bundles signés + `scripts/publish-update.mjs`, comme le Cockpit | ✅ **le plus avancé des quatre** : v0.1.7 publiée et signée sur **4 plateformes** (linux-x86_64, windows-x86_64, darwin-aarch64, darwin-x86_64) — ⚠️ mais son updater pointe encore l'**iakabox morte** (F3-i) |

**Trois faits qui commandent le lot** *(les quatre faits A1..A4 de l'amendement du 28/08 s'y
ajoutent, § 0)* **:**

- **F1 — le CLI embarque déjà la méthode.** `cli/_bundled/` part dans le tarball (champ `files`).
  La directive « livrer la méthode avec le CLI » est donc **déjà vraie au niveau du paquet** ; ce
  qui manque est l'**activation** (§ 4, AR-1). *Corollaire réparé le jour même (`5367c25`) :
  `teams` et `bindings` manquaient au bundle, qui livrait des personas sans les équipes qui les
  assemblent. Une garde refuse désormais un bundle amputé.*
- **F2 — deux des quatre composants sont des apps Tauri.** Leur « installation » n'est pas un
  `npm install` : c'est un **bundle signé par plateforme**. Le chaînage ne peut donc pas être un
  simple script npm (§ 5, AR-3).
- **F3 — le canal de distribution est cassé, et le repointage n'a pas suffi.** Au 25/08 :
  `publishConfig` du CLI et manifeste d'auto-update du Cockpit pointaient tous deux
  `192.168.2.11` (iakabox **hors service**). Repointés depuis vers le NAS `192.168.1.139`
  (`b78d685`, `2f1e7b9`) — **mais sur la configuration seulement, jamais vérifiés en ligne**.
  **Mesure du 28/08, depuis le bon LAN** (poste en `192.168.1.65`, passerelle `192.168.1.1`) :
  le NAS est **lui aussi injoignable** — ping 100 % de perte, ports 3001/80/443/3000/5000 tous
  fermés. La sortie du lot 0 telle qu'elle était écrite **n'a donc jamais été atteinte** : le
  canal a changé de machine morte, pas d'état.
  **Deux trous supplémentaires relevés le 28/08** : (i) **iakaFrameGUI n'a jamais été repointé** —
  `src-tauri/tauri.conf.json:43` et les **4** URL de son `updater/latest.json` pointent encore
  l'iakabox morte ; (ii) **CA-1 n'a jamais été exercé** — pas de `~/.npmrc` sur le poste (le
  registre `@naonedge` n'y est pas configuré) et le CLI « installé » n'est pas un `npm -g` mais
  un **wrapper bash** `~/.local/bin/iakaframe` qui exécute le dépôt live. L'install npm du CLI
  est à ce jour une **hypothèse**, pas un fait.
  ⇒ Pré-requis n°1 (§ 5, lot 0), désormais **triple canal** (§ 0).

---

## 3. Ce que « activé par défaut » ne doit PAS casser

La séparation outil / contenu reste **le modèle** : la source de vérité vit à la racine du dépôt
(`library/`, `methods/`, `teams/`, `bindings/`), le CLI n'en embarque qu'une **copie figée** pour
fonctionner en autonomie. Trois invariants à préserver :

- **On doit pouvoir n'installer que le CLI.** Un utilisateur qui refuse la méthode doit obtenir un
  outil fonctionnel. « Activé par défaut » = *défaut*, pas *obligation* (AR-1).
- **`install.mjs` reste non destructif** (`--merge` par défaut, `--dry-run`, `--backup-dir`). Une
  install enchaînée ne doit pas devenir un rouleau compresseur parce qu'elle est automatique.
- **Le réservoir du poste prime sur le bundle.** Si un réservoir vivant existe (`<chapeau>/
  iakaframe`), c'est lui la source ; `_bundled` est un **repli**, jamais un écrasement (AR-2).

---

## 4. Arbitrages à trancher

### AR-1 — Que signifie exactement « iakaframe activé par défaut » ?

- **(a) Le CLI déploie le kit hôte au premier lancement**, si absent, sans rien demander.
- **(b) `npm install -g` déclenche `install.mjs`** via un hook `postinstall`.
- **(c) Le CLI ne déploie rien, mais le signale** au premier lancement et propose la commande.

**Recommandation : (c) + un verbe explicite.** Un `postinstall` qui écrit dans `~/.claude` est une
**écriture hors du répertoire du paquet pendant une installation npm** : c'est mal vu, souvent
bloqué (`--ignore-scripts`), et surprenant. (a) a le même défaut sans l'excuse de la convention.
(c) rend l'activation **visible et consentie**, au prix d'une commande. Dans la chaîne du bundle
complet (§ 5), cette étape est **pré-cochée** — c'est là que « par défaut » s'exprime.
**→ Écarté : (b)**, incompatible avec `--ignore-scripts` et avec le principe « rien d'inattendu ».

### AR-2 — Réservoir vivant ou bundle embarqué ?

Quand `<chapeau>/iakaframe` existe, deux sources coexistent.
**Recommandation : le réservoir vivant PRIME**, `_bundled` sert de repli, et le CLI **dit laquelle
il utilise** (une ligne de provenance, comme le fait déjà `snapshot` avec `cli=` / `root=`).
Motif : sur ce poste, le bundle avait **six mineures de retard** et il a fallu un incident pour
s'en apercevoir. Une source silencieuse est une source qui dérive.

### AR-3 — Quelle forme prend le « bundle complet » ?

- **(a) Un verbe du CLI** : `iakaframe install --all`, qui orchestre les quatre étapes.
- **(b) Un script autonome** `install-bundle.mjs` à la racine du réservoir.
- **(c) Un installeur graphique.**

**Recommandation : (a).** Le CLI est **déjà** le point d'entrée du portefeuille, il est
multi-OS, sans dépendance, et il sait déjà sonder (`services`) et déployer (`skills deploy`).
(b) dupliquerait sa plomberie. (c) est hors sujet tant que le canal de distribution est cassé (F3).
**Contrainte** : les étapes 3 et 4 ne peuvent pas « installer » comme npm — elles **téléchargent
et posent un bundle signé** (F2). Le verbe doit donc être **honnête sur ce qu'il fait** par
plateforme, et **refuser proprement** là où il ne sait pas faire, plutôt que simuler.

### AR-4 — Que veut dire « après validation » ?

**Recommandation : une validation par étape, pas une seule au début.** Chaque composant s'annonce
(quoi, où, quelle version, quoi d'existant sera fusionné), puis attend un feu vert. `--yes` saute
l'ensemble pour les usages non interactifs. Motif : les quatre composants écrivent à des endroits
**très différents** (`/usr/local/lib`, `~/.claude`, `/Applications`) — un consentement global
masquerait ce que chacun fait.

### AR-5 — Ordre et échec partiel

L'ordre est **imposé par les dépendances** : CLI → méthode → Cockpit → FrameGUI (les deux GUI
consomment le réservoir posé par les étapes 1-2).
**Recommandation : échec ARRÊTANT, sans rollback automatique.** Si une étape échoue, on s'arrête,
on **dit** ce qui est posé et ce qui ne l'est pas, et on donne la commande de reprise. Un rollback
automatique de quatre installations hétérogènes serait plus dangereux que l'échec lui-même.

### AR-6 — Périmètre des plateformes au premier lot

*Recommandation initiale du 25/08 : « macOS arm64 d'abord ».* **Élargie le 28/08 sur mesure** —
elle reposait sur « FrameGUI non relevé » (§ 2), et ce relevé manquant l'a rendue trop
restrictive.

**Fait relevé** : `iakaFrameGUI` est le composant **le plus avancé en distribution** de tout le
portefeuille. Son `updater/latest.json` porte la v0.1.7 publiée et **signée sur 4 plateformes** —
`linux-x86_64`, `windows-x86_64`, `darwin-aarch64`, `darwin-x86_64` — avec son propre
`scripts/publish-update.mjs`. Le Cockpit, lui, n'a que `darwin-aarch64` en v0.32.1.

**Recommandation amendée : macOS arm64 reste le socle de recette**, mais le lot B **ne défriche
pas** — il **réutilise le précédent FrameGUI** (build multi-plateforme + signature + manifeste
déjà éprouvés). Les plateformes non couvertes restent **refusées explicitement**, jamais
silencieusement ; ce qui change, c'est qu'elles ne sont plus présumées hors d'atteinte.

### AR-7 — La redondance npm *(arbitrage neuf, ouvert par la décision du 28/08)*

Le triple canal se transpose sans peine à **git** (trois remotes, fan-out) et à **l'auto-update**
(liste ordonnée d'endpoints, A4). **npm est le point dur** : `publishConfig` désigne **un** seul
registre pour publier, et `.npmrc` **un** seul registre par scope pour installer. **Il n'y a pas
de bascule native.** Trois options :

- **(a) La bascule est portée par le verbe `install`** : il essaie les registres dans l'ordre et
  **dit lequel a répondu**. La redondance vit dans notre code, pas dans npm.
- **(b) Publication en trois passes** (un `npm publish` par registre), l'installeur ne connaissant
  qu'un registre configuré à l'avance.
- **(c) On renonce au registre npm** pour le CLI et on distribue un **tarball** depuis les trois
  forges — ce que fait déjà le poste, à sa façon, avec son wrapper bash (F3-ii).

**Recommandation : (a), avec (b) en complément.** (a) est le seul qui rende la panne d'un
registre **invisible à l'utilisateur**, et il est cohérent avec AR-2 (dire la source retenue).
(b) est le pendant côté publication : sans lui, (a) n'a que **des** registres, pas trois
**synchrones**. (c) est un repli honnête si les droits de publication sur l'une des forges
manquent — à ne prendre que dans ce cas.
**Note** : GitHub n'héberge pas de registre npm privé dans cette configuration ; le troisième
canal npm est donc à désigner (Packages GitHub, ou tarball par (c)) — **c'est la seule inconnue
du lot 0**.

---

## 5. Périmètre

### Lot 0 — Trois canaux synchrones (pré-requis, non négociable)

*Réécrit le 28/08. Le lot n'est plus « repointer une URL » : c'est **rendre la chaîne
multi-cible**. Trois morceaux, plus un trou à boucher.*

**0.a — Écriture : fan-out de push.** `update` (le checkpoint quotidien) et `onboard` poussent
vers **les trois** remotes, chaque cible **réussissant ou échouant indépendamment et à voix
haute**. Une cible injoignable **n'est pas une erreur** : c'est une ligne de sortie. Corollaire :
`lib/forgejo.js` cesse de porter **une** `DEF_URL` et porte une **liste ordonnée** ; `FORGEJO_URL`
accepte plusieurs valeurs sans casser la forme mono-valeur existante (A3).

**0.b — Lecture : failover.** Les `endpoints` de l'updater passent à **trois URL ordonnées**,
côté Cockpit **et** côté FrameGUI (A4). Ordre à fixer : le plus disponible en tête.

**0.c — Un verbe de synchronisation.** *Le morceau qui n'existe nulle part, et sans lequel 0.a et
0.b ne tiennent pas.* Il répond à **deux** questions : « les trois sont-ils d'accord ? » et
« que faut-il rattraper, maintenant que celui-ci est revenu ? ». Il **nomme** chaque cible, son
état (à jour / en retard de N / injoignable) et **la date de la mesure**. Contrainte héritée de
`range` : distinguer proprement ce qui est **mesuré en direct** de ce qui est **daté du dernier
fetch** — `range` reste zéro-réseau par choix, ce verbe-ci **est** le chemin réseau assumé.

**0.d — Boucher les trous relevés** : `iakaFrameGUI` n'a jamais été repointé (F3-i) ; le
`publishConfig` du CLI, désormais soumis à AR-7.

- **Sortie** : (1) un checkpoint pousse vers les trois et **dit** ce qui a abouti ; (2) le verbe
  de synchronisation rend un état **vérifiable en direct** des trois dépôts ; (3) une app dont le
  premier endpoint est mort **voit quand même** la mise à jour ; (4) `npm install -g
  @naonedge/iakaframe` aboutit tant qu'**au moins un** canal répond.
- **Contrôle d'acceptation propre au lot** : les trois `main` identiques sur les trois forges,
  **prouvé par une mesure en direct**, pas par un `git status`.
- **Sans ce lot, les trois suivants n'ont pas de canal** (F3).

### Lot A — Le verbe `install`

Étapes 1 et 2 (CLI + méthode), validation par étape, `--dry-run`, `--yes`, provenance affichée.

### Lot B — Les deux apps

Étapes 3 et 4 : téléchargement du bundle signé depuis Forgejo, **vérification de signature**, pose.
Refus explicite hors plateforme couverte.

### Lot C — La chaîne complète

`iakaframe install --all` enchaîne les quatre, avec le comportement d'échec d'AR-5.

### Hors périmètre (tous lots)

Installeur graphique · plateformes non couvertes (AR-6) · désinstallation · mise à jour des quatre
composants en une passe (c'est un **autre** verbe, à cadrer séparément).

---

## 6. Risques

| # | Risque | Mitigation |
|---|---|---|
| R1 | **Le bundle embarqué dérive** et livre une méthode périmée. | Garde ajoutée le 2026-08-25 (`5367c25`) : refus d'un bundle amputé + cohérence du roster. Reste à ajouter un contrôle de **fraîcheur** (version du bundle vs version du CLI). |
| R2 | **Une install automatique écrase** une configuration hôte existante. | `--merge` par défaut, `--dry-run`, `--backup-dir`, validation par étape (AR-4). |
| R3 | **Un bundle d'app non signé** est posé. | Vérification de signature obligatoire au lot B ; refus si absente. |
| R4 | **Échec au milieu de la chaîne**, poste dans un état indéterminé. | AR-5 : arrêt net + état explicite + commande de reprise. |
| R5 | **Le canal reste cassé** et le lot A livre un verbe qui ne peut rien installer. | Lot 0 **bloquant** avant tout le reste. |
| R6 | **La dérive silencieuse se reproduit** : on pousse vers un seul canal, les deux autres décrochent sans que rien ne le dise — c'est exactement ce qui a produit A2 (15 commits d'écart non vus). | Lot 0.a (fan-out, chaque cible dite) + **0.c** (verbe de synchronisation). Le vrai remède est **0.c** : sans mesure, le fan-out lui-même peut échouer en silence. |
| R7 | **Faux sentiment de sécurité** : trois remotes configurés font croire à trois sauvegardes, alors qu'un seul reçoit. Le 28/08, les trois existaient et **aucun** n'était à jour. | La redondance ne se déclare pas, elle **se mesure** (0.c). Aucun message ne doit dire « sauvegardé » sans nommer **quelles** cibles ont reçu. |
| R8 | **Rattrapage destructif** au retour d'une forge : pousser sur un dépôt en retard peut écraser une avance locale à lui. | Le verbe de synchronisation **refuse** tout ce qui n'est pas une avance rapide et **le dit** — jamais de `--force`, conformément à la règle permanente du portefeuille. |

---

## 7. Critères d'acceptation

- **CA-1** — `npm install -g @naonedge/iakaframe` sur une machine nue livre un CLI **et** un
  réservoir complet (personas + **teams** + **bindings** + methods + kits).
- **CA-2** — Le CLI dit **quelle source** de réservoir il utilise (vivante ou embarquée), sans
  qu'on ait à le deviner.
- **CA-3** — `iakaframe install --dry-run` décrit les quatre étapes **sans rien écrire**.
- **CA-4** — Chaque étape demande un feu vert ; `--yes` les saute toutes.
- **CA-5** — Une étape en échec arrête la chaîne, énonce l'état atteint et la reprise.
- **CA-6** — Hors plateforme couverte, les étapes 3-4 **refusent** avec un message explicite.
- **CA-7** — Un bundle d'app sans signature valide est **refusé**.
- **CA-8** — Le poste de recette termine avec les quatre composants opérationnels : CLI en
  version attendue, 10 agents dispatchables, Cockpit et FrameGUI lançables.
- **CA-9** *(28/08)* — Un checkpoint pousse vers **les trois** remotes et **énonce** le résultat
  par cible ; une cible injoignable donne une ligne d'état, **pas** un échec du checkpoint.
- **CA-10** *(28/08)* — Le verbe de synchronisation rend, **par mesure en direct**, l'état des
  trois dépôts (à jour / en retard de N / injoignable) et **la date de la mesure**.
- **CA-11** *(28/08)* — Une app dont le **premier** endpoint d'update est mort voit quand même la
  mise à jour, en essayant les suivants.
- **CA-12** *(28/08)* — `npm install -g @naonedge/iakaframe` aboutit **tant qu'au moins un** canal
  répond, et le CLI **dit** lequel a servi (calque d'AR-2).
- **CA-13** *(28/08)* — Le verbe de synchronisation **refuse** un rattrapage qui ne serait pas une
  avance rapide, et le dit. Aucun `--force`, jamais.

---

## 8. Estimation *(ordre de grandeur, révisable)*

| Lot | j-homme | Inconnues |
|---|---|---|
| 0 — trois canaux synchrones | **2** *(réévalué le 28/08 depuis 0,5)* | 3ᵉ canal npm à désigner (AR-7) ; forme de `FORGEJO_URL` multi-valeurs ; **les deux forges LAN sont hors service au moment du cadrage** — le lot ne sera recettable de bout en bout qu'à leur retour |
| A — verbe install (1+2) | **2** | interactivité multi-OS, formats de validation |
| B — les deux apps | **3** | signature, formats de bundle par OS, FrameGUI non relevé |
| C — chaîne + échec partiel | **1,5** | états intermédiaires à décrire honnêtement |
| **Total** | **≈ 8,5** (6–12) *(réévalué le 28/08)* | |

---

## 9. Vérification (gate de chaque lot)

Suite complète du CLI verte · `--dry-run` prouvé sans écriture (empreinte du système de fichiers
avant/après) · contrefactuel sur chaque garde (canal mort, signature absente, plateforme non
couverte) · **recette réelle sur une machine nue** — le seul contrôle qui compte pour un installeur.

**Ajout du 28/08, propre au triple canal.** Trois contrefactuels sont **obligatoires**, et ils
sont faciles à obtenir aujourd'hui puisque **deux des trois forges sont réellement hors service** :
(1) **une cible off** — le checkpoint aboutit, la cible est **nommée** comme non servie, le
processus ne casse pas ; (2) **deux cibles off** — idem, la troisième reçoit ; (3) **les trois
off** — le checkpoint le **dit** et ne prétend rien avoir sauvegardé (R7).
Aucun de ces trois cas ne doit être simulé par un drapeau : la panne réelle est l'arène.

**Garde d'honnêteté** : tout état des trois dépôts affiché doit porter **la date de sa mesure**.
Un état daté du dernier fetch et un état mesuré en direct ne se confondent jamais — c'est la
règle que `range` a déjà établie et qu'on ne casse pas.
