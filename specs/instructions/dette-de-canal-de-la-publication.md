# Dette de canal de la publication — le script ne promet plus la visibilité, il rend compte de ce qu'il a poussé

> **Copie UNIQUE**, ici, dans le dépôt `iakaframe`. Le défaut vit dans une **convention de
> portefeuille** (un canal de publication à deux remotes, appliqué à deux applications qui ne sont
> pas jumelles sur ce fichier). La dupliquer *verbatim* dans les deux dépôts supposerait de
> l'inscrire au registre de convergence et de faire monter le cliquet **20 → 22** — un geste qui
> appartient à un lot qui le décide, pas à celui-ci. Précédent : L42, AR-5 = (b).
>
> **Discipline de rectification (règle 4 du corpus)** : tout énoncé de ce fichier ou du corpus qui
> se révélerait faux se **corrige en le datant**, jamais en l'effaçant. Le § 1.6 en est l'application
> immédiate : la décision sur l'iakabox a changé **deux fois** pendant ce cadrage, et les trois états
> sont conservés.

---

## Problème

Les deux scripts de publication annoncent, en dernière ligne, que la version **est visible des
clients**. Ils n'ont poussé qu'**un** des deux canaux de lecture, et cette phrase s'imprime au moment
exact où l'opérateur croit avoir fini. Elle n'est pas fausse pour tout le monde — elle est **vraie
pour le décideur, sur son LAN, et fausse pour tout autre client**. C'est ce qui la rend vicieuse :
elle se vérifie tous les jours par celui-là même qui la lit.

Deux faits mesurés : les manifestes servis sur GitHub sont à jour (`0.32.2` et `0.1.8`), et **aucun
script ne les y a mis** — c'est une main humaine, quatre fois en un jour.

⚠️ **Et le dommage réel n'est pas celui qu'on croyait.** Il ne s'agit pas d'un client qui « ne voit
rien » : la lecture du plugin (§ 1.4) établit qu'un client hors LAN atteint bien GitHub, y trouve un
manifeste **valide mais périmé**, et s'entend répondre **« vous êtes à jour »**. Un silence faux, pas
une panne. C'est pire, parce que rien ne le signale.

---

## 1. Diagnostic mesuré — qui voit quoi

### 1.1 Ce que fait le script (lu dans le code, pas déduit)

| Dépôt | Fichier:ligne | Geste | Phrase émise |
|---|---|---|---|
| IakaCockpit | `scripts/publish-update.mjs:418` | `git push origin HEAD` | `:419` — « manifeste poussé sur main — la version X est **visible des clients** » |
| iakaFrameGUI | `scripts/publish-update.mjs:673` | `git push origin HEAD` | `:824-825` — « manifeste pousse — la mise a jour est **desormais visible des clients** » / « rien a pousser — la mise a jour **etait deja visible des clients** » |

`origin` désigne, dans les deux `.git/config`, la forge Forgejo du NAS (`192.168.1.139:3001`). Le
remote `github` **existe** dans les deux dépôts, et **aucun script des deux dépôts ne le pousse** —
vérifié par balayage (`push … github`, `remote add github` : **zéro occurrence** hors
`node_modules`). Le moteur de portefeuille (`~/work/.portefeuille/`) ne porte pas non plus de geste
de miroir. **Le fan-out vers GitHub est, aujourd'hui, un geste exclusivement manuel.**

### 1.2 Ce que fait le client — lu dans la source de la version épinglée

Mesuré dans `~/.cargo/registry/src/index.crates.io-.../tauri-plugin-updater-2.10.1/src/updater.rs`,
c'est-à-dire **la version que l'app embarque**, pas la documentation :

- **`:412`** — `for url in &self.endpoints` : les endpoints sont essayés **en séquence, dans l'ordre
  déclaré**.
- **`:496-501`** — succès HTTP **et** désérialisation OK ⇒ `last_error = None` puis **`break`**. Les
  endpoints suivants **ne sont jamais contactés**.
- **`:508-512`** — statut non-succès (404, 401…) : **une ligne de log, rien d'autre** ; `last_error`
  n'est **pas** positionné, la boucle continue.
- **`:514-517`** — échec de transport (refus, délai, adresse non routable) : `last_error` positionné,
  la boucle continue.
- **`:523-528`** — après la boucle : `last_error` présent ⇒ `Err` ; sinon aucune release ⇒
  `Err(ReleaseNotFound)`.
- **`:530-533`** — le comparateur par défaut est `release.version > self.current_version`. Sans
  comparateur ni `allow_downgrades`, **une version inférieure ou égale ne déclenche rien**.
- **`:458-460`** — le délai par requête n'est appliqué **que s'il est fourni**
  (`if let Some(timeout)`). Côté commande, même chose : `commands.rs:43-59`, `timeout: Option<u64>`.
  Or **les deux applications appellent `check()` sans aucune option** —
  `IakaCockpit/src/api/backend.ts:1079` et `iakaFrameGUI/src/hooks/useAppUpdate.ts:91`. **Aucun délai
  de requête n'est donc posé** : ce qui borne l'attente est le comportement TCP du système, pas le
  code.

### 1.3 Le tableau « qui voit quoi »

Liste des endpoints, identique de structure dans les deux apps (`src-tauri/tauri.conf.json:42-46`) :
**(1)** NAS `192.168.1.139` = `origin` · **(2)** `raw.githubusercontent.com` · **(3)** iakabox
`192.168.2.11` — **cette troisième entrée est retirée par décision du 2026-09-03, § 1.6**.

| Situation du client | Endpoint qui gagne | Endpoints contactés | Ce que le client entend |
|---|---|---|---|
| Sur le LAN, NAS allumé | **1** (NAS, poussé par le script) | 1 seul | la vérité — la phrase du script est **vraie pour lui** |
| **Hors LAN**, avec Internet | **2** (GitHub, poussé par personne) | 1 puis 2 | **« vous êtes à jour »** — faux dès que la main humaine a manqué |
| Sur le LAN, NAS éteint | **2** (GitHub) | 1 puis 2 | idem |
| Ni NAS ni Internet | aucun | 1, 2 (et 3 tant qu'il est là) | une erreur — au moins elle se voit |

**Conclusion du diagnostic** : la phrase est fausse **pour tout client qui n'est pas chez le
décideur, sur son LAN, NAS allumé**. La lecture du brief est **confirmée**, et confirmée *par le code
du client*, pas par raisonnement.

### 1.4 ⚠️ LE VRAI RISQUE DU DOSSIER — un endpoint JOIGNABLE ET PÉRIMÉ fait autorité

C'est la lecture la plus importante de ce cadrage, et elle est **plus grave que la promesse fausse**.

> **`:501` fait `break` au premier endpoint qui RÉPOND — pas au premier qui est À JOUR.** Un endpoint
> joignable servant un manifeste périmé **coupe la liste** : les endpoints suivants, fussent-ils
> frais, **ne sont jamais contactés**.
>
> Et le résultat n'est **pas** une installation de vieille version — `:532` l'interdit
> (`release.version > current_version`). Le résultat est un **`Ok(None)`**, c'est-à-dire, à l'écran,
> **« vous êtes à jour »**. **La mise à jour devient invisible, silencieusement, et sans erreur.**

**Corollaire qu'il faut écrire noir sur blanc : un endpoint périmé est PIRE qu'un endpoint absent.**
Absent, il échoue au transport (`:514-517`) et **la boucle continue** jusqu'au canal frais. Présent
et périmé, il **fait autorité**.

**Et cela vise directement le NAS, en position 1.** Le NAS est le **seul** canal que les scripts
poussent aujourd'hui : il est donc frais **tant que le push `origin` réussit**. Le jour où ce push
échoue — ou est fait depuis une autre machine, ou depuis une branche — le NAS devient un endpoint
**joignable et en retard** en tête de liste : **tous les clients du LAN s'entendent dire qu'ils sont
à jour, et GitHub n'est jamais atteint.**

C'est ce qui donne à **AR-4** (§ 7) son enjeu réel : un fan-out qui échouerait sur `origin` en
sortant `0` ne serait pas une gêne d'ergonomie, il fabriquerait cette configuration-là.

**NON MESURÉ, déclaré tel** : ce raisonnement est lu dans la source ; il n'a pas été reproduit en
faisant réellement servir un manifeste périmé à un client. La mesure est simple et appartient au
décideur (§ 5, **M-4**).

### 1.5 Ce que coûte, ou non, un endpoint injoignable

Puisque `:501` fait `break` au premier succès, **un endpoint n'est atteint que si tous ceux qui le
précèdent ont échoué**. Conséquences, chiffrées par la structure du code :

- Une entrée en **dernière** position ne coûte **rien** sur tous les chemins où le contrôle
  réussit — elle n'est pas même contactée. Elle ne coûte un délai que dans le cas où le contrôle
  allait de toute façon échouer. **L'hypothèse « un endpoint mort coûte un délai à chaque client »
  est donc RÉFUTÉE pour une entrée en dernière position.**
- En revanche, **l'endpoint 1 coûte à chaque client hors LAN** : `192.168.1.139` est une adresse
  RFC1918 non routable hors du LAN, elle est en **première** position, et **aucun délai de requête
  n'est configuré** (§ 1.2). Le client hors LAN paie donc, **à chaque vérification**, l'attente d'un
  échec de connexion vers une adresse privée avant de basculer sur GitHub.

**Le coût n'est pas là où on le cherchait : il n'est pas dans la queue de liste, il est dans la
tête.** **NON MESURÉ** : la **durée** de cette attente — elle ne se lit pas dans le code (il n'y a
pas de délai à lire) et dépend du système et de la route. → **M-1**, et successeur
`ORDRE-ENDPOINTS-COUT-HORS-LAN`.

### 1.6 L'endpoint iakabox — chronologie datée d'une décision qui a changé deux fois

**On date, on n'efface pas.** Les trois états sont conservés parce que le deuxième explique le
troisième :

1. **2026-09-03, premier état** — brief initial : *« l'iakabox `192.168.2.11` est MORTE ; le retirer
   relève-t-il de ce lot ou d'un successeur ? »*, posé en arbitrage.
2. **2026-09-03, deuxième état — « on garde »**, puis **précision** : la box n'est pas morte, elle est
   **en panne et sera réparée**. Le motif de conservation devenait « un canal dont le retour est
   attendu ».
3. **2026-09-03, état final — L'ENDPOINT EST RETIRÉ.** ⚠️ **C'est la mesure du § 1.4 qui a retourné
   la décision**, et il faut conserver le raisonnement : *rien ne pousse vers la box* ; elle
   **reviendrait donc en servant un manifeste périmé** ; et un endpoint joignable et périmé **fait
   autorité** sur les endpoints frais placés après lui. Le retour de la box n'aurait pas restauré un
   canal — il aurait **installé un menteur en fin de liste**, prêt à faire autorité le jour où les
   deux premiers seraient injoignables.

**La liste passe donc de trois à deux entrées, et elles correspondent une pour une aux deux canaux
d'écriture** :

```
1. http://192.168.1.139:3001/…            ← le NAS = remote `origin`
2. https://raw.githubusercontent.com/…    ← remote `github`
```

**👤 GESTE DU DÉCIDEUR — l'édition ne revient PAS à l'exécution.** Le retrait se fait dans
`IakaCockpit/src-tauri/tauri.conf.json:45` et `iakaFrameGUI/src-tauri/tauri.conf.json:45` (la
troisième URL de `plugins.updater.endpoints`). Le corpus traite déjà ainsi les actes de publication ;
celui-ci est de la même famille : il change ce que **les binaires livrés** iront lire.

**À vérifier APRÈS le retrait, par le décideur** — trois points, sans quoi le geste est aveugle :
- `npm run test` reste vert dans les deux dépôts : le test « au moins DEUX hôtes distincts »
  (`IakaCockpit/src/__tests__/updateEndpoints.test.ts:29-41`) exige `≥ 2` hôtes — **deux entrées
  suffisent**, la garde ne rougit pas. C'est vérifié par lecture, à confirmer par exécution.
- le miroir front `src/app/updateEndpoints.ts` est régénéré/aligné : la même garde (`:19-23`) exige
  l'**égalité exacte et ordonnée** avec `tauri.conf.json`. Elle rougira si le miroir est oublié —
  c'est le comportement voulu.
- `iakaframe endpoints --app .` sur les deux apps : **deux** endpoints mesurés, et **au moins un**
  qui *sert* un manifeste au contrat.

**⚠️ CE LOT NE DÉPEND PAS DE CE GESTE, ET C'EST DÉLIBÉRÉ.** Tant que le décideur n'a pas édité les
deux fichiers, la liste porte trois entrées dont une injoignable — et **rien de ce lot n'en dépend** :
il ne touche qu'aux **canaux d'écriture** (des remotes git), jamais aux endpoints de **lecture**.
Un lot qui casserait si le décideur tardait serait mal cadré. **Aucun critère d'acceptation de ce
lot ne compte les endpoints.**

---

## 2. Décision retenue

**La phrase ment parce qu'elle promet un fait que le script ne peut pas connaître.** Le script sait
ce qu'il a **poussé** ; il ne sait pas ce que les clients **voient** — cela dépend d'un dépôt public
ou non, d'un CDN, d'une branche, de la fraîcheur relative de deux hôtes. Aucun nombre de `git push`
ne rend cette phrase vraie au moment où elle s'imprime.

**Le correctif structurant est donc d'abaisser la promesse au niveau de ce qui est prouvable en
cours d'exécution**, et de **nommer** le geste, extérieur et mesuré, qui établit le reste.

Les deux familles du brief ne sont pas symétriques :

- **(β) — cesser de promettre** est le **plancher, non négociable** : il supprime le mensonge, ne
  crée aucun mode de défaillance nouveau, et se pose dans les deux dépôts sans toucher au réseau.
- **(α) — pousser les deux canaux** est **désirable** (le geste manuel est ce qui a échoué quatre
  fois en un jour) mais **interdit seul**. Un fan-out sans compte rendu par canal reproduit
  exactement le défaut d'un cran plus haut — et le corpus l'a déjà mesuré : *« le fan-out peut
  échouer en silence : sans mesure, on croit avoir trois sauvegardes quand un seul dépôt reçoit »*
  (`iakaframe/cli/src/lib/canaux.js`, fait A2). **(α) ne se pose que sur (β).**

Depuis le retrait de l'iakabox (§ 1.6), **(α) est net** : « les deux canaux » veut dire **exactement
deux**, `origin` et `github`, en **correspondance un pour un** avec les deux endpoints lus. La
question « combien de canaux, et lesquels ? » est refermée.

**Recommandation motivée : (β) puis (α), dans ce lot, dans cet ordre** — voir **AR-1**, non tranché.
Ce que je dis franchement, puisque la question est posée : **(α) n'est pas un piège, mais (α) sans
(β) en est un**, et (β) seul est un lot complet et livrable. Si le décideur veut le plus petit lot
qui supprime le mensonge, c'est **(β) seul** ; il ne perdrait que l'automatisation, pas l'honnêteté.

**Un argument s'est ajouté en faveur de (α) pendant le cadrage** : la correspondance un pour un
endpoint↔canal rend la règle simple à tenir — *tout endpoint lu a un canal poussé par le script*.
C'est une propriété qu'un cliquet peut garder (**CA-4**), et qui interdit structurellement le
scénario du § 1.4 sur le canal **2**.

**Ce que le lot ne fait pas** : il **ne publie rien**. Aucun tag, aucune release, aucun `workflow`,
aucun push exécuté par un agent, aucune édition de `tauri.conf.json`.

---

## 3. Périmètre

**Inclus**
- La **phrase finale** des deux `publish-update.mjs` : elle cesse de promettre la visibilité et rend
  compte, **canal par canal**, de ce qui a été poussé.
- Le **registre versionné des canaux d'écriture**, avec **une raison par entrée** et un
  **hors-couverture déclaré**.
- Sous (α) : le **fan-out** vers les canaux du registre, chaque cible réussissant ou échouant
  **indépendamment**, et le **code de sortie** qui porte le verdict.
- La **garde à deux faces** (§ 4) et sa **limite déclarée dans le fichier de garde**, pas seulement
  ici.
- La **rectification datée** des blocs de `CLAUDE.md` des deux dépôts qui décrivent la publication.

**Exclu — explicitement, et chaque exclusion porte sa raison**
- **L'édition des deux `src-tauri/tauri.conf.json`** : 👤 geste du décideur (§ 1.6). Le lot est
  **neutre** à cet égard : il ne lit ni ne compte les endpoints.
- **L'ordre des endpoints**, bien que ce soit là qu'est le coût mesuré (§ 1.5). Changer l'ordre
  modifie le canal de **lecture** et le comportement de binaires déjà livrés : autre concern, autre
  lot. → successeur **`ORDRE-ENDPOINTS-COUT-HORS-LAN`**.
- **Le rétablissement de l'iakabox** : ce n'est pas un lot de code.
- **L'alignement des deux `publish-update.mjs`.** Ils ne sont **pas** byte-identiques, ils ne sont
  **pas** au registre de convergence (`fixtures/convergence.sha256`, **20 entrées**, vérifié : ce
  fichier n'y figure pas), et le cliquet **reste à 20**. Voir § 6.
- **Le dispositif de porteurs de version** du GUI (plus riche) : ne pas l'importer côté Cockpit, ni
  l'inverse.
- Tout acte de publication, tout commit, tout push.

---

## 4. La garde — comment on prouve que le message DIT VRAI, pas qu'il s'affiche

C'est le point dur, et il faut le poser dans les termes du corpus : **une garde de fraîcheur qui
compare deux dérivés de la même source ne voit pas une dérive de la source** — trois témoins vides
trouvés cette semaine. Un test qui exécute le script avec un `git` factice et vérifie que le message
sort est exactement ce témoin vide : il prouve que la chaîne de caractères existe.

La phrase à garder se **coupe en deux**, et les deux moitiés n'ont pas la même nature de preuve.

### 4.1 Face 1 — « j'ai poussé sur X, et pas sur Y » (dans le gate, hors réseau)

C'est un fait **sur le run**. Il est prouvable en cours d'exécution, et la garde n'est pas vide **si
et seulement si** elle est un **contrefactuel de forme** : c'est la mutation qui doit rougir, pas
l'affichage qui doit s'afficher.

- **Le contrefactuel obligatoire** : remplacer le compte rendu par la **phrase de succès
  inconditionnelle** (l'état d'aujourd'hui) **doit faire rougir la suite, nommément**. Si elle reste
  verte, la garde est vide et le lot n'est pas fait.
- **Le second contrefactuel** : faire **échouer une seule cible** du fan-out et exiger (i) que le
  message **nomme** la cible en échec, (ii) que le code de sortie soit **non nul**. Si un échec de
  cible laisse un message de succès et un `exit 0`, on a construit le « push partiel qui se déclare
  réussi » — pire que la situation actuelle, exactement comme le dit le brief, **et productif du
  scénario § 1.4** si la cible manquée est `origin`.
- **Le couplage** : la garde doit exiger que le message soit une **fonction des résultats de push**.
  Le harnais existe déjà côté GUI — `commitAndPushManifest` prend un `run` injectable
  (`iakaFrameGUI/scripts/publish-update.mjs:659`) et `scripts/publish-update.test.mjs:466-540`
  monte un vrai laboratoire git. Côté Cockpit il n'existe pas : voir **AR-2**.

⚠️ **Ce que la face 1 NE prouve PAS, et qui doit être écrit dans le fichier de garde** : elle prouve
que le message est **conditionné** par les résultats ; elle ne prouve **rien** sur ce que sert un
endpoint, ni sur sa fraîcheur. Les deux côtés de son assertion dérivent du même `run` factice. C'est
légitime **tant que la limite est déclarée** — et c'est précisément pourquoi il faut une seconde
face.

### 4.2 Face 2 — « les clients la voient » (hors gate, réseau, trois états)

C'est un fait **sur le monde**, et la seule preuve non circulaire est une **lecture des endpoints**
qui revient d'un tiers. L'instrument **existe déjà, versionné et testé** :

```
iakaframe endpoints --app <racine de l'app>      # mesure TOUS les endpoints
iakaframe endpoints --app <racine> --premier     # contrat exact de l'updater (arrêt au premier)
```

Il porte déjà la doctrine qu'il faut ici — `iakaframe/cli/src/commands/endpoints.js:26-27` :
*« Un code 200 ne suffit pas : un dépôt privé rend volontiers 200 + une page de connexion. Un
endpoint n'est compté comme SERVANT que s'il rend un manifeste au contrat. »*

**Ce que la face 2 doit ajouter, et c'est le § 1.4 qui l'impose** : comparer la `version` **servie
par CHAQUE endpoint** au **tag publié**. Mesurer « au moins un endpoint sert un manifeste » ne suffit
plus : il faut mesurer **tous** les endpoints (donc **sans** `--premier`), parce qu'un endpoint
**frais en position 2 ne rachète pas** un endpoint **périmé en position 1** — il est masqué par lui.

**Trois états, jamais deux** (modèle `vitrine:en-ligne`) : `0` concorde · `1` écart nommé ·
`3` **NON MESURÉ** (pas de réseau) — un contrôle qui rend « succès » sans avoir rien mesuré est le
pire des faux verts.

⚠️ **Le piège de la face 2, à écrire dans son fichier** : `raw.githubusercontent.com` sert derrière
un **cache**. Une mesure lancée immédiatement après le push peut rendre l'**ancien** contenu et
produire un **rouge faux**. La face 2 doit donc distinguer « le canal sert une version antérieure au
tag » (état à part, *propagation en cours*) de « le canal ne sert rien » et de « le canal sert autre
chose ». **Non mesuré à ce jour** : la fenêtre réelle de propagation — à établir au premier usage, et
à écrire.

### 4.3 Et la phrase, alors ?

Elle devient un **compte rendu** — un canal par ligne, son état, et **le nom du geste qui établit le
reste** :

```
manifeste v0.32.2 — canaux d'écriture poussés :
  origin (192.168.1.139)  poussé
  github                  poussé
ce script ne sait pas ce que voient les clients. Pour le mesurer :
  iakaframe endpoints --app .
```

Aucune de ces lignes ne promet ce que le script ignore. **C'est ça, la réparation.**

---

## 5. Mesures dues au décideur (le lot ne peut pas les faire)

| Réf | Mesure | Pourquoi elle appartient au décideur |
|---|---|---|
| **M-1** | Sur une machine **hors LAN**, chronométrer un contrôle de mise à jour : combien de temps avant que GitHub réponde ? (§ 1.5) | Aucune machine hors LAN n'est accessible depuis cette session ; et sans délai configuré, la valeur est propre au système. |
| **M-2** | `iakaframe endpoints --app ~/work/IakaCockpit` et idem GUI, **depuis le LAN** : l'endpoint 1 (NAS) sert-il le manifeste **en anonyme**, et **à quelle version** ? | Le dépôt Forgejo peut être privé. Le 2026-08-28, les trois endpoints rendaient `404, 404, 000` (`IakaCockpit/src/__tests__/updateEndpoints.test.ts:32-34`). La redondance était **déclarée, pas acquise** — même piège. |
| **M-3** | `iakaframe canaux --path ~/work/IakaCockpit` (et GUI) : de combien de commits le remote `github` est-il en retard **aujourd'hui** ? | Donne la taille réelle de la dette avant correctif, et la mesure « avant » de l'« après ». |
| **M-4** | Faire servir volontairement un manifeste **périmé** par l'endpoint 1 et lancer un contrôle : l'app dit-elle **« à jour »** ? (§ 1.4) | C'est la seule preuve du risque central. Elle exige de manipuler un canal servi — geste du décideur. |

**Ce qui EST mesuré et daté (2026-09-03)** : les manifestes servis par GitHub portent `0.32.2`
(`pub_date 2026-09-02T13:12:06Z`) et `0.1.8` (`pub_date 2026-09-02T13:13:01.330Z`), neuf clés de
plateforme chacun. **Mis là à la main.**

---

## 6. La convergence — poser le correctif des deux côtés sans les aligner en passant

**Fait mesuré** : les deux `publish-update.mjs` ne se ressemblent pas, et l'écart n'est pas
cosmétique.

| | IakaCockpit | iakaFrameGUI |
|---|---|---|
| Forme | script **de haut en bas**, logique en ligne | **fonctions pures exportées** + pilote |
| Couture de test | **aucune** — pas de fichier de test du script | `commitAndPushManifest(tag, { run, cwd })`, `:659` |
| Harnais | — | `scripts/publish-update.test.mjs`, laboratoire git réel, `:466-540` |
| Porteurs de version | `checkVersionAlignment` + cliquet d'omission | `VERSION_CARRIERS` + `VERSION_NON_CARRIERS` (plus riche) |
| `pub_date` | normalisée à la **seconde** (`:137`) | porte les **millisecondes** — visible dans les manifestes servis (§ 5) |

**Règle du lot** : le correctif se pose **là où chaque dépôt a sa couture**, et nulle part ailleurs.

- **GUI** : dans `commitAndPushManifest` et son appelant `:820-827`. La couture existe, le harnais
  existe, la garde de face 1 s'y écrit sans rien déplacer.
- **Cockpit** : au bloc `:399-419`. Il n'y a **pas** de couture — voir **AR-2**.

**Interdits nommés de ce lot** : ne pas importer `VERSION_CARRIERS` côté Cockpit ; ne pas importer
`checkVersionAlignment` côté GUI ; ne pas uniformiser `pub_date` (constat § 6, **non traité**,
successeur `PUB-DATE-GRANULARITE`) ; **ne pas inscrire `publish-update.mjs` au registre de
convergence** — l'y mettre suppose de l'**aligner délibérément d'abord**, dans un lot qui le décide
(précédent L43, `release.yml`). **Le cliquet reste à 20.**

**Si le lot crée un fichier partagé** (par exemple un registre de canaux) : soit il est
**byte-identique** dans les deux dépôts **et** inscrit au registre (cliquet 20 → 22, à trancher), soit
il n'est **pas** partagé du tout. Un troisième fichier « presque pareil » serait le seul non gardé —
on installerait le défaut qu'on répare. **Recommandation : pas de fichier partagé**, chaque dépôt
porte son registre local. Voir **AR-3**.

---

## 7. Arbitrages — TRANCHÉS PAR LE DÉCIDEUR le 2026-09-03

> ### ✅ DÉCISIONS — **énoncé : « je te suis »**, sur les six recommandations
>
> | # | Décision |
> |---|---|
> | **AR-1** | **(b)** — (β) **puis** (α) dans le même lot : la phrase devient un compte rendu, **et** le script pousse les deux canaux |
> | **AR-2** | **(a) bornée** — on extrait le geste de push **et rien d'autre**, motif écrit **dans le code** ; ce n'est **pas** un pas vers la convergence |
> | **AR-3** | **(a)** — registre **local à chaque dépôt** ; le contenu **diverge par nature**, un fichier partagé serait faux |
> | **AR-4** | **(a)** — **exit non nul dès qu'une cible échoue.** L'enjeu n'est pas ergonomique : un `exit 0` après un push manqué **fabrique exactement** la configuration du § 1.4 |
> | **AR-5** | **(a)** — `origin` et `github` **nommés** ; le remote git `iakabox` **déclaré hors couverture** avec motif et condition de levée |
> | **AR-6** | **(a)** — le script **nomme** le geste et n'appelle rien (zéro dépendance · cache CDN · une panne réseau ne doit pas devenir un échec de publication) |
>
> ⚠️ **M-2 ET M-3 ONT ÉTÉ JOUÉES AVANT LA DÉCISION — 2026-09-03, par le portefeuille, en lecture
> seule :**
>
> - **M-3 rend ZÉRO** : `github` n'est en retard d'**aucun commit** sur les **trois** dépôts
>   (`IakaCockpit 5ab0927`, `iakaFrameGUI f7a5628`, `iakaframe c8ca528`, `origin` = `github` partout).
> - **M-2** : le NAS répond **HTTP 200** en anonyme et sert `0.32.2` / `0.1.8` — **la redondance est
>   acquise aujourd'hui, plus seulement déclarée**, contrairement au 2026-08-28 où les trois
>   endpoints rendaient `404, 404, 000`.
>
> 🛑 **M-3 = 0 est EXACTEMENT la condition que le cadrage nommait pour rabattre AR-1 sur (a)** —
> *« si M-3 montrait que le remote `github` n'est en retard d'aucun commit, c'est-à-dire que le geste
> manuel tient réellement, alors (α) achèterait peu »*. **La décision reste (b), et le motif est
> écrit ici pour qu'il soit réfutable** : **le zéro ne prouve pas que le geste manuel TIENT, il
> prouve qu'aujourd'hui QUELQU'UN A REGARDÉ.** Ces pushes ont été faits **à la main, quatre fois
> dans la journée**, chacun parce qu'un opérateur s'en est souvenu. La condition du cadrage portait
> sur un geste qui tiendrait **tout seul** ; celui-ci tient parce qu'un humain était derrière.
> **Un zéro obtenu par vigilance n'est pas un zéro structurel.**

*(Rédaction d'origine du titre, conservée : « Arbitrages — recommandés, motivés, NON TRANCHÉS ».)*

### AR-1 — Quelle famille ?
- **(a)** (β) seul : le script cesse de promettre, il nomme le geste manquant. Le fan-out reste manuel.
- **(b)** (β) **puis** (α) dans le même lot : la phrase devient un compte rendu, **et** le script
  pousse les deux canaux.
- **(c)** (α) seul : rejeté d'office, avec sa raison — un fan-out sans compte rendu par canal
  reproduit le défaut un cran plus haut (fait A2 du corpus).

**Recommandation : (b).** Motifs : (β) supprime le mensonge mais laisse l'opérateur devant le même
geste manuel qui a déjà échoué quatre fois en un jour ; (α) sans (β) est interdit ; et depuis § 1.6
la correspondance **un canal poussé par endpoint lu** devient une propriété simple, gardable par
cliquet, qui ferme structurellement le scénario du § 1.4 sur le canal GitHub.
**Ce qui me ferait recommander (a)** : si M-3 montrait que le remote `github` n'est en retard
d'aucun commit — c'est-à-dire que le geste manuel tient réellement — alors (α) achèterait peu.

### AR-2 — Le Cockpit n'a pas de couture : en crée-t-on une ?
- **(a)** Extraire le **seul** geste commit+push dans une fonction pure à `run` injectable, pour que
  la face 1 puisse le mordre.
- **(b)** Ne rien extraire : le Cockpit ne serait alors gardé que par la face 2 (réseau, hors gate).

**Recommandation : (a), bornée.** Motif : sans couture, la face 1 est **impossible** côté Cockpit, et
un lot qui garde un dépôt sur deux est un lot à moitié fait. **Borne stricte** : on extrait le geste
de push **et rien d'autre** ; on **ne recopie pas** la forme du GUI (pas de `parseArgs`, pas
d'`assertPublishBranch` exporté) ; ce n'est pas un pas vers la convergence, c'est une couture de
test — motif à écrire **dans le code**, sans quoi le prochain lecteur y verra un alignement entamé.

### AR-3 — Où vit le registre des canaux d'écriture ?
- **(a)** Un fichier **local à chaque dépôt** (`fixtures/canaux-publication.json`), non partagé.
- **(b)** Un fichier **byte-identique** dans les deux dépôts, inscrit au registre de convergence
  (cliquet 20 → 22).

**Recommandation : (a).** Motif : le contenu **diverge par nature** (les URL de remote ne sont pas
les mêmes), donc un fichier partagé serait faux ; et (b) fait monter un cliquet, ce qui est une
décision, pas un effet de bord.

### AR-4 — Que fait le script si une cible du fan-out échoue ?
- **(a)** Chaque cible réussit ou échoue **indépendamment**, aucune exception ; le message nomme
  chaque état ; **le code de sortie est non nul dès qu'une cible a échoué**.
- **(b)** Idem, mais `exit 0` avec un compte rendu (l'échec est un « état », pas une erreur).

**Recommandation : (a), et l'enjeu n'est pas ergonomique.** Un `exit 0` après un push `origin`
manqué fabrique **exactement** la configuration du § 1.4 — un endpoint 1 joignable et en retard, qui
fait autorité et dit « à jour » à tout le LAN. La forme de (a) est déjà éprouvée dans le corpus :
`pousserFanout` (`iakaframe/cli/src/lib/canaux.js:75-83`, chaque cible indépendante, jamais
d'exception, motif nommé) et `accord` (`:207-210`, *« un canal injoignable interdit de conclure à
l'accord »*). **On copie la FORME, pas le code** — la contrainte « zéro dépendance » interdit
d'importer le CLI dans les apps.

### AR-5 — Quels canaux le registre déclare-t-il ?
- **(a)** `origin` **et** `github` **nommés**, une raison par entrée ; le remote git **`iakabox`**
  (`192.168.2.11`, toujours présent dans les deux `.git/config`) est **déclaré hors couverture** avec
  son motif et sa condition de levée.
- **(b)** « tous les remotes configurés ».

**Recommandation : (a).** Motif : (b) tenterait de pousser vers la box en panne **à chaque
publication**, produirait une cible en échec permanent, et la garde de AR-4 rougirait toujours — une
alarme qui sonne toujours finit désarmée par habitude. Un registre **motivé**, avec son
**hors-couverture déclaré** et son **cliquet**, est la forme que ce corpus emploie déjà partout.
*(Le remote git `iakabox` et l'endpoint de lecture retiré au § 1.6 sont deux objets distincts : le
premier reste dans `.git/config` et n'est pas du ressort de ce lot.)*

### AR-6 — La face 2 est-elle appelée par le script ?
- **(a)** Le script **nomme** le geste et n'appelle rien.
- **(b)** Le script appelle `iakaframe endpoints` en fin de publication.

**Recommandation : (a).** Trois motifs : la contrainte **zéro dépendance** (les apps n'embarquent pas
le CLI) ; le **cache** de `raw.githubusercontent.com`, qui rendrait un rouge faux juste après le push
(§ 4.2) ; et le fait qu'un contrôle réseau au milieu d'un geste de publication transformerait une
panne de réseau en échec de publication.

---

## 8. Étapes d'implémentation

> Sous (β) seul : étapes 1, 2, 5, 6, 8, 9 (l'étape 3 se réduit à « nommer les canaux non poussés »).

1. **Registre** — `fixtures/canaux-publication.json` dans **chaque** dépôt : une entrée par canal
   (`nom du remote`, `raison`), un bloc `HORS_COUVERTURE` (`iakabox`, motif, condition de levée).
2. **Cliquet du registre** — un test qui exige que les canaux **poussés par le script** soient
   exactement ceux **déclarés** (les deux ensembles comparés, pas comptés). Modèle : le cliquet
   « clés lues ≡ clés déclarées » déjà en place dans les deux dépôts.
3. **(α) Fan-out** — pousser `HEAD` vers chaque canal du registre, **indépendamment**, en collectant
   `{ canal, ok, motif }`. Forme d'AR-4. Jamais de `--force`, jamais de tag, jamais de release.
4. **Ordre** — le push vers `origin` **d'abord** (c'est l'endpoint 1, celui qui fait autorité,
   § 1.4), puis les autres. Aucun canal n'interrompt les suivants.
5. **(β) Compte rendu** — remplacer la phrase de visibilité par le compte rendu de § 4.3, **dérivé**
   des résultats. **Aucune occurrence résiduelle** de « visible des clients » : les **trois** phrases
   (Cockpit `:419`, GUI `:824` et `:825` — la troisième, celle du no-op, ment de la même façon).
6. **Code de sortie** — non nul si un canal déclaré a échoué (AR-4).
7. **AR-2** — couture minimale côté Cockpit, si tranchée.
8. **Garde face 1** — les deux contrefactuels de § 4.1, écrits **rouges d'abord**, révoqués avec
   preuve (`sha256` ou `git diff` vide). La limite de la face est écrite **dans le fichier de garde**.
9. **Garde face 2** — le geste `iakaframe endpoints --app .` (**sans `--premier`**, § 4.2) comparé au
   tag **endpoint par endpoint**, ses **trois** états, et le piège du cache écrits. Hors gate.
10. **Doc** — rectifier, **en datant**, les blocs de publication des deux `CLAUDE.md` et la case de
    backlog qui porte encore « le message est donc, en l'état, une promesse que le script ne tient
    pas » : le lot la tient, il faut le dire et dater. Y inscrire aussi le fait du § 1.4 — il
    concerne quiconque lira la liste d'endpoints.

---

## 9. Fichiers concernés

- `/Users/sjupin/work/IakaCockpit/scripts/publish-update.mjs` — `:399-419` : le geste, la phrase.
- `/Users/sjupin/work/iakaFrameGUI/scripts/publish-update.mjs` — `:659-675` et `:820-827`.
- `/Users/sjupin/work/IakaCockpit/fixtures/canaux-publication.json` — **neuf**.
- `/Users/sjupin/work/iakaFrameGUI/fixtures/canaux-publication.json` — **neuf**.
- `/Users/sjupin/work/iakaFrameGUI/scripts/publish-update.test.mjs` — gardes de face 1.
- `/Users/sjupin/work/IakaCockpit/scripts/__tests__/` — fichier de garde **neuf** (face 1).
- `/Users/sjupin/work/IakaCockpit/CLAUDE.md`, `/Users/sjupin/work/iakaFrameGUI/CLAUDE.md` —
  rectification datée.
- **👤 Décideur, hors lot** : `IakaCockpit/src-tauri/tauri.conf.json:45` et
  `iakaFrameGUI/src-tauri/tauri.conf.json:45` (retrait de la 3ᵉ URL), plus le miroir front
  `src/app/updateEndpoints.ts` que la garde existante forcera à suivre.
- **Lus, NON modifiés par le lot** : les deux `src-tauri/tauri.conf.json`, les deux `.git/config`,
  `fixtures/convergence.sha256` (le cliquet **ne bouge pas**).

---

## 10. Risques

- **R1 — le push partiel qui se déclare réussi.** Le risque nommé par le brief, et le plus grave. Le
  script s'arrête aujourd'hui **net à la première anomalie**
  (`IakaCockpit/scripts/publish-update.mjs:24-25`) ; un fan-out **rompt** cet invariant. Et s'il
  manque `origin` en silence, il produit le § 1.4. *Mitigation* : AR-4 **et** son contrefactuel de
  § 4.1, critère bloquant.
- **R2 — la garde qui s'auto-satisfait.** Un test qui vérifie l'affichage du message. *Mitigation* :
  la seule preuve acceptée est **la mutation qui rougit** ; un test qui reste vert quand on remet la
  phrase inconditionnelle **ne compte pas**.
- **R3 — le rouge faux de la face 2** (cache CDN). *Mitigation* : l'état « propagation en cours »
  distinct, et la face **hors gate**.
- **R4 — l'alignement en passant.** Deux fichiers qui se ressemblent invitent à les rapprocher.
  *Mitigation* : § 6, interdits nommés, cliquet gelé à 20.
- **R5 — la garde qui rougit toujours.** Si le registre incluait la box en panne (AR-5 (b)), la garde
  serait rouge à chaque publication et finirait désarmée. *Mitigation* : hors-couverture **déclaré**.
- **R6 — le mensonge se déplace dans le registre.** Déclarer un canal qu'on ne pousse pas rendrait le
  registre menteur à son tour. *Mitigation* : le cliquet de l'étape 2, comparaison **ensembliste**.
- **R7 — le lot croit avoir fermé le § 1.4.** Il ne le ferme **pas**. Pousser les deux canaux rend
  les deux endpoints frais *quand le fan-out réussit* ; cela ne dit rien d'un NAS qui reviendrait
  d'une sauvegarde, d'une restauration ou d'une publication faite d'ailleurs. *Mitigation* : le dire
  ici, dans **CA-12**, et dans la doc — pas le prétendre couvert.

---

## 11. Critères d'acceptation — chacun avec SA mesure

- [ ] **CA-1** — Aucune occurrence de « visible des clients » (ni variante) ne subsiste dans les deux
      `publish-update.mjs`.
      *Mesure* : balayage sur les deux fichiers ⇒ **zéro** ligne, les **trois** phrases traitées.
- [ ] **CA-2** — Le message final est **dérivé** des résultats de push.
      *Mesure* : **contrefactuel** — remettre la phrase de succès inconditionnelle fait **rougir**
      la suite du dépôt concerné, **nommément** ; révocation prouvée (`git diff` vide ou `sha256`).
      Si la suite reste verte, **CA-2 est FAIL**, quel que soit le reste.
- [ ] **CA-3** — Un canal en échec est **nommé** et le processus sort **non nul**.
      *Mesure* : un `run` factice qui échoue sur **un seul** canal ⇒ le message cite ce canal comme
      échoué, cite les autres comme poussés, et le code de sortie est ≠ 0. **Jouer le cas `origin`
      en échec explicitement** : c'est celui qui produit le § 1.4.
- [ ] **CA-4** — Les canaux poussés sont **exactement** ceux déclarés au registre.
      *Mesure* : le cliquet de l'étape 2 rougit quand on **ajoute** une entrée non poussée **et**
      quand on **pousse** un canal non déclaré — les **deux sens**, sinon la garde est unilatérale.
- [ ] **CA-5** — Le `HORS_COUVERTURE` porte `iakabox` avec un motif **et** une condition de levée.
      *Mesure* : un test exige que chaque entrée hors couverture porte les deux champs **non vides**.
- [ ] **CA-6** — La face 1 **déclare sa limite** dans son propre fichier (« ne prouve rien sur ce que
      sert un endpoint, ni sur sa fraîcheur »).
      *Mesure* : la phrase est présente dans le fichier de garde, pas seulement dans cette
      instruction ni dans un rapport.
- [ ] **CA-7** — La face 2 compare la `version` servie **par chaque endpoint** au **tag**, et rend
      **trois** états (`0` / `1` / `3`).
      *Mesure* : sans réseau ⇒ code **3** (jamais 0) ; avec un tag volontairement faux ⇒ code **1**
      avec l'écart nommé, **endpoint par endpoint**.
- [ ] **CA-8** — La convergence n'a pas bougé.
      *Mesure* : `fixtures/convergence.sha256` porte toujours **20 entrées** dans les deux dépôts,
      `npm run test:convergence` vert des deux côtés, et `publish-update.mjs` n'y figure pas.
- [ ] **CA-9** — Les suites de gate sont vertes, **commande par commande**.
      *Mesure* : tableau contraint — `npm run lint:all` (ou `typecheck` + `lint`), `npm run test:all`
      **et** `npm run test:rust` sur **des lignes distinctes**, chacune avec son code de sortie et son
      chiffre cité. Aucune formule d'ensemble (« tout est vert ») : **FAIL** par règle du dépôt.
- [ ] **CA-10** — Le lot est **neutre** vis-à-vis du retrait de l'endpoint iakabox.
      *Mesure* : la suite de chaque dépôt est verte **avec** la liste à trois entrées (état actuel)
      **et** avec la liste à deux (simulée dans un test, ou re-mesurée après le geste du décideur).
      Aucun critère ne compte les endpoints.
- [ ] **CA-11** — La doc dit ce que le lot a fait.
      *Mesure* : les deux `CLAUDE.md` et la case de backlog qui annonce la promesse non tenue portent
      une rectification **datée** ; l'ancien énoncé est **conservé**, pas effacé (règle 4). Le fait du
      § 1.4 y est inscrit.
- [ ] **CA-12** — **NON MESURÉ, et déclaré tel** : (i) que les clients hors LAN voient effectivement
      la mise à jour après un fan-out (exige une publication réelle **et** une machine hors LAN,
      M-1/M-2) ; (ii) qu'un endpoint périmé en position 1 produise bien un « à jour » faux (M-4).
      **Ces deux-là ne seront jamais écrits « PASS » par un agent.**

---

## 12. Successeurs nommés — inscrits, NON traités

- **`ENDPOINT-PERIME-FAIT-AUTORITE`** — le risque du § 1.4 survit à ce lot (R7). Rien ne détecte
  aujourd'hui qu'un endpoint **joignable** sert un manifeste **en retard**, et le client n'en dit
  rien : il affiche « à jour ». Pistes non tranchées : une face en ligne périodique, un
  avertissement lorsque deux endpoints divergent, ou l'acceptation explicite du risque. **Dépend de
  M-4.**
- **`ORDRE-ENDPOINTS-COUT-HORS-LAN`** — l'endpoint 1 est une adresse privée en première position, et
  aucun délai de requête n'est configuré : le client hors LAN paie une attente à chaque contrôle
  (§ 1.5). Trois pistes, aucune tranchée : réordonner, poser un `timeout` à l'appel de `check()`, ou
  ne rien faire une fois la durée connue. **Dépend de M-1.**
- **`PUB-DATE-GRANULARITE`** — le Cockpit normalise `pub_date` à la seconde, le GUI porte les
  millisecondes. Visible dans les manifestes servis. Sans conséquence connue ; à aligner dans un lot
  qui le décide.
- **`RETRAIT-ENDPOINT-IAKABOX`** — 👤 geste du décideur (§ 1.6), avec sa liste de vérifications
  après coup. Inscrit ici pour qu'il ne se perde pas ; **il n'est pas du ressort de l'exécution.**
