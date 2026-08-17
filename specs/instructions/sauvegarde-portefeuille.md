# Sauvegarde du portefeuille de projets (`~/work`)

> **Portée : le PORTEFEUILLE, pas un projet.** Cette instruction vaut pour les **45 dépôts** de
> `~/work` sur le poste de dev (macOS). Elle **ne modifie rien** dans un projet particulier — en
> particulier **pas** `robby-immo`, qui a déjà son propre `scripts/backup.sh` (cf. § *Q5*).

## Problème

Le décideur veut une sauvegarde de ses projets. Sa demande, mot pour mot :

> *« une sauvegarde une fois par semaine ou sur ordre, de tous les projets ou un projet ciblé, un
> backup prend tout le répertoire, secrets et tous les fichiers compris. »*

Quatre exigences : **hebdomadaire OU à la demande** · **global OU ciblé par projet** · **le
répertoire entier** · **secrets inclus**.

**Aujourd'hui, il n'existe AUCUNE sauvegarde du portefeuille.** L'outil est pourtant déjà installé
et les réservoirs déjà préparés : ils sont **vides**. Ce qui est protégé aujourd'hui, c'est le
**code** — il vit sur Forgejo. Ce qui ne l'est pas : les **secrets** (`.env`, `.env.local`), les
**données non versionnées**, les **bases** et les **volumes Docker**. Autrement dit : **exactement
ce qu'un `git clone` ne rend pas.**

---

## Ce qui est déjà mesuré — RELEVÉS REPRIS, PAS MESURÉS DE MA MAIN

> 🛑 **Provenance obligatoire.** Tous les chiffres de cette section sont des **relevés du
> 2026-08-15 pris par Odin en lecture seule**. Le cadrage **n'a ni `Bash` ni accès aux machines** :
> il n'a pu **ni les rejouer, ni les corroborer**. Ils sont **datés et signés**, ils ne sont pas
> **corroborés**. Tout geste qui en dépend doit **re-mesurer avant d'agir** (cf. `CA-0`).

**L'outil existe et ne fait rien.**

| Fait | Valeur relevée |
|---|---|
| Backrest (`garethgeorge/backrest:latest`) | tourne sur `iakabox-apps` (**VM2, 192.168.2.11**), port **9898**, depuis le **2026-07-29** |
| Volumes visibles du conteneur | `/mnt/backups` et `/root/docker-stack/data` |
| Configuration | **AUCUNE** — pas de `config.json`, aucun dépôt, aucun plan, aucun calendrier |
| Base interne (`kvdb.sqlite`, `oplog.sqlite`) | datée du **7 juin**, n'a pas bougé |

**Les réservoirs, préparés et vides.**

| Réservoir | Taille | État |
|---|---:|---|
| `/mnt/backups` sur VM2 (montage **NFS4** de `10.10.10.254:/fast/backups`) | 1,4 To | **512 octets** utilisés — vide |
| ZFS `fast/backups` sur `bigserver` (**192.168.2.20**) | 1,4 To | vide |
| ZFS `hdd/backups-long` sur `bigserver` | 6,8 To | vide |
| Sauvegardes de VM (`vzdump`, `proxmox-backup-client`) | — | **client installé, aucun job, dépôt vide : aucune sauvegarde de machine n'existe** |

**Quelqu'un a préparé DEUX niveaux (rapide / long) qui n'ont jamais servi.** C'est une intention de
conception déjà posée : le cadrage s'y adosse plutôt que d'en inventer une autre (cf. *Q4*).

**Le volume à sauvegarder.**

| Fait | Valeur relevée |
|---|---|
| `~/work` | **18 Go**, **45 dépôts git**, sur le **poste de dev (macOS)** |
| Part **régénérable** | **~14 Go** : `IakaPcl/data` 3,5 Go · `IakaProject/projects` 3,0 Go · `iakaFrameGUI/src-tauri` 2,8 Go · `iakaVintageStory` 1,5 Go · `iakavod/release` 1,4 Go · **~1 Go de `node_modules`** (271 Mo, 144, 144, 139, 87, 56…) |
| Exemple de composition | `robby-immo` = 61 Mo dont **37 Mo de `.git`** (donc déjà sur Forgejo) et 24 Mo hors git |
| Perdu si un répertoire disparaît | les **fichiers de secrets** (`.env`, `.env.local`) et les **données non versionnées** |
| Hors de tout dépôt | les **bases PostgreSQL** (52 Mo en dev, la vraie sur la box) et les **volumes Docker** (`robotimmo-dev-postgres-data`, `-n8n-data`, `-ollama-data`) |

### Ce que le cadrage n'a PAS pu mesurer — à dérouler à l'exécution

1. **La taille réelle du premier instantané** (dépend de la compression et de la déduplication).
2. **La croissance hebdomadaire réelle** — c'est la seule inconnue qui peut faire glisser le lot.
3. **L'accès SSH à `bigserver`** (192.168.2.20) depuis le poste : compte, clé, chemin d'écriture
   dans le dataset `fast/backups`. **Rien n'est établi** (cf. `D3`).
4. **Le comportement de TCC/macOS** sur une sauvegarde planifiée (cf. `R6`).
5. **La version de `restic`** effectivement disponible/installée (cf. `D2` et `CA-1`).

---

## Ce qui est vérifié sur le web — faits opposables

> Chaque fait ci-dessous a été **vérifié en ligne pendant le cadrage** et porte sa source en fin de
> fichier. Aucun n'est supposé. Ce qui n'a **pas** pu être vérifié est dit tel quel.

**F1 — `restic` chiffre tout le dépôt, et la clé est la seule chose qui ne se régénère pas.**
Le dépôt porte une **clé maîtresse** chiffrée par une clé dérivée du mot de passe (**scrypt**),
stockée dans `keys/`. La documentation restic est sans ambiguïté : *« Losing your password means
that your data is irrecoverably lost. »* Corollaire immédiat : **le point de défaillance unique de
tout ce lot n'est pas le disque, c'est le mot de passe du dépôt.**

**F2 — `restic` accepte PLUSIEURS clés pour un même dépôt** (`restic key add`), chacune avec son
propre mot de passe. C'est ce qui permet d'avoir une clé **opérationnelle** et une clé **de
secours** détenue ailleurs, et de **révoquer** l'une sans réécrire le dépôt.

**F3 — Backrest stocke le mot de passe du dépôt EN CLAIR dans `config.json`.** C'est un défaut
**connu et ouvert** en amont (issue `garethgeorge/backrest#1047`), et la documentation de Backrest
l'assume en recommandant de conserver `config.json` dans un gestionnaire de mots de passe.
Emplacement : `$BACKREST_CONFIG`, sinon `$HOME/.config/backrest/config.json`.
🛑 **Conséquence de conception, à traiter nommément (cf. `D5`)** : quiconque lit le home du poste
lit le mot de passe du dépôt — donc peut **`forget`/`prune`** le dépôt, c'est-à-dire **détruire les
sauvegardes**.

**F4 — Backrest sauvegarde les chemins accessibles À SON PROCESSUS.** En Docker, ce sont les
volumes montés. Le Backrest de la VM2 **ne voit pas `~/work`** : c'est le fait qui commande tout
l'arbitrage `D1`.

**F5 — Backrest existe en binaire natif macOS** (`backrest_Darwin_arm64.tar.gz` + `install.sh`),
avec une **application macOS à icône de barre de menus**. Il installe lui-même une version de
`restic` dont il **vérifie la signature GPG** avec la clé du mainteneur restic.

**F6 — Backrest sait faire, nativement, les quatre exigences du décideur** : plans **cron**
(hebdomadaire) ; déclenchement **manuel** depuis l'UI ; **un plan par périmètre** (global ou
ciblé) ; **chemins et exclusions** par plan.

**F7 — Backrest étiquette ses instantanés par plan** et applique la rétention avec
`restic forget --tag plan:{PLAN_ID} --group-by tag`. Le ciblage par projet est donc **natif**, pas
à construire.

**F8 — Backrest possède un canal poussé** : Discord, Slack, Shoutrrr, Gotify, **Healthchecks**, plus
des **hooks** shell avant/après opération. 🛑 **C'est le premier canal poussé du portefeuille** — le
ticket `SUP-1` de `robby-immo` constate qu'il n'en existe aucun ailleurs.

**F9 — La rétention `restic forget` groupe par défaut sur `(host, paths)`.** Deux plans dont les
chemins diffèrent forment donc **deux groupes de rétention distincts** — ce qui protège d'une
politique qui viendrait manger les instantanés d'un autre périmètre. `--tag` filtre les instantanés
examinés ; plusieurs `--tag` se combinent en **OU**, une liste `--tag a,b` exige **les deux**.

**F10 — `restic check --read-data-subset=n/t` permet d'étaler la vérification intégrale** du dépôt
sur `t` passages. Sans `--read-data`, `check` **ne relit pas** les données : il vérifie la
structure, pas les octets.

**F11 — La restauration d'un seul projet est native** : `restic restore <snapshot>:<sous-chemin>`
ou `--include`. **Rien à construire pour l'exigence « un projet ciblé » côté restauration.**

**F12 — `restic mount` n'est PAS un recours fiable sur macOS** : il exige macFUSE (extension noyau)
ou **FUSE-T** (support introduit en restic **0.17.0**, encore jeune). Sur **Linux**, il fonctionne
sans réserve. → Le poste d'**inspection** naturel est la **VM2**, pas le Mac.

**F13 — `restic` compresse depuis la version 0.14** (format de dépôt **v2**, **zstd**,
`--compression auto` par défaut). Un dépôt v2 n'est lisible que par restic **≥ 0.14**.

**F14 — `restic copy` recopie des instantanés d'un dépôt vers un autre, MAIS ne re-découpe pas les
fichiers.** Sans précaution, la déduplication est cassée entre les deux dépôts et les données
copiées peuvent occuper **jusqu'au double**. Le remède est **à l'initialisation seulement** :
`restic init --copy-chunker-params`. **Les paramètres de découpage d'un dépôt existant ne peuvent
plus être changés.** 🛑 **Se tromper ici est irrattrapable sans repartir de zéro** (cf. `R3`).

**F15 — Le mode `append-only` (écriture seule) n'est offert nativement que par `rest-server`.** Il
empêche un client compromis de **supprimer** des sauvegardes. Réserve écrite dans la documentation
amont : `forget`/`prune` exigent l'accès complet, donc doivent être lancés **depuis un client
distinct et bien gardé** — sinon la protection est nulle.

**F16 — Le dépôt local sur un montage réseau est déconseillé.** Les défauts documentés portent sur
les **verrous** de restic sur NFS/CIFS (échecs de pose de verrou, `permission denied`, fichier déjà
existant). ⚠️ **Ce que ce fait NE dit PAS** : la confidentialité n'est pas en cause — restic chiffre
**côté client**, donc même sur NFS ce sont des **octets chiffrés** qui transitent. L'objection est
la **fiabilité du verrouillage**, pas le secret.

**F17 — `restic` en SFTP exige une connexion sans mot de passe** (clé SSH) et recommande
`ServerAliveInterval 60` / `ServerAliveCountMax 240` dans `.ssh/config`, faute de quoi le serveur
ferme la connexion pendant les longues phases sans transfert. L'expansion du `~` **ne fonctionne
pas** en SFTP : utiliser un chemin relatif ou absolu explicite.

**F18 — Sur macOS, une sauvegarde PLANIFIÉE se heurte à TCC.** Le retour de terrain est constant :
ce n'est **pas** au binaire `restic` qu'il faut accorder l'Accès complet au disque mais au
**processus qui l'orchestre** (l'interpréteur, ou le binaire lancé par `launchd`), et l'héritage
TCC est **cassé** pour les outils lancés par `launchd`. ⚠️ **Non vérifiable depuis le cadrage** :
`~/work` est un dossier ordinaire, probablement **hors** des zones protégées par TCC — mais
**cela se mesure, ça ne se suppose pas** (cf. `CA-4` et son témoin négatif).

---

## 🛑 L'ARBITRAGE QUI COMMANDE TOUT LE RESTE — `D1`

**Backrest tourne sur la VM2. Les projets sont sur le poste (macOS). Backrest ne voit pas
`~/work` (F4).** Tant que ce point n'est pas tranché, rien d'autre ne peut l'être.

| Voie | Ce qu'elle fait | Coût | Risque propre |
|---|---|---|---|
| **A — le poste POUSSE** | le poste écrit lui-même dans le dépôt distant | installer un agent sur le poste | le poste porte la clé du dépôt (`F3`) |
| **B — Backrest TIRE** | la VM2 lit `~/work` par un partage réseau (NFS/SMB/`sshfs`) ou un agent | exposer `~/work` sur le LAN | **le poste doit être allumé ET joignable à l'heure du plan** |
| **C — on ne sauvegarde que la box** | on protège ce qui vit déjà sur la box | quasi nul | **ne répond pas à la demande** |

### Écarté nommément : **C**

Les 45 projets sont **sur le poste**. Ce que la box porte, c'est le **service** ROBBYimmo, pas le
portefeuille. Sauvegarder la box seule laisserait **44 projets sur 45** sans aucune sauvegarde, et
donnerait la **fausse assurance** qu'une sauvegarde existe — le tort exact que ce dépôt combat
partout ailleurs. **C n'est pas une voie, c'est un complément** : il devient le **lot 2** (*Q5*).

### Déconseillé : **B**

Trois coûts, dont un rédhibitoire :
1. 🛑 **Le silence.** Un portable macOS **dort**. Si le poste est endormi ou hors LAN à l'heure du
   plan, la sauvegarde **ne se produit pas** — et sans dispositif d'alerte sur l'**absence**, personne
   n'est prévenu. *Une sauvegarde qui échoue en silence est pire qu'aucune sauvegarde.*
2. **La détection de changement se dégrade.** Lire 18 Go à travers un partage réseau à chaque
   passage, là où un agent local compare des métadonnées locales, transforme un instantané
   incrémental en relecture quasi complète.
3. **Exposer `~/work`** — secrets compris — en partage réseau, pour le seul confort de garder
   Backrest là où il est déjà installé.

### **RECOMMANDÉ : A**, et plus précisément **A2**

Deux formes de A :

- **A1** — `restic` en ligne de commande sur le poste + `launchd`, Backrest de la VM2 réduit au
  rôle de **visualiseur** du même dépôt.
- **A2 ⭐** — **Backrest lui-même sur le poste** (binaire natif macOS, `F5`), qui pousse vers un
  dépôt sur le réservoir. Le Backrest de la VM2 **garde un rôle réel** : visualisation,
  **restauration** (c'est le seul poste où `restic mount` marche, `F12`) et **lot 2** (données de
  service, *Q5*).

**Pourquoi A2 plutôt que A1** — chacune des quatre exigences du décideur est déjà **native** :
hebdomadaire = plan cron ; **sur ordre** = bouton dans l'UI ; **global ou ciblé** = un plan par
périmètre, étiqueté `plan:` (`F6`, `F7`) ; **répertoire entier, secrets compris** = chemin `~/work`
sans exclusion. S'y ajoutent la rétention et la vérification planifiées, et le **canal poussé**
(`F8`) — c'est-à-dire la réponse à *Q6*, gratuitement.
**Le prix de A2, à ne pas taire** : Backrest écrit le mot de passe du dépôt **en clair** dans le
`config.json` du poste (`F3`). C'est exactement `D5`, et ce prix est **le même en A1** dès qu'on
automatise (le mot de passe doit bien vivre quelque part sur le poste). **A2 ne l'ajoute pas, il le
rend visible.**

> **Gandalf propose : A2. Le décideur tranche.**

---

## Les décisions à trancher — `D1` à `D7`

> Chacune porte une **recommandation** et le **coût de l'alternative**. Aucune n'est prise ici.

### `D1` — Qui écrit dans le dépôt ? *(commande tout le reste)*
**Reco : A2** — Backrest natif sur le poste, poussant vers le réservoir. *(cf. ci-dessus)*

### `D2` — Quel protocole d'écriture vers le réservoir ?

| Option | Pour | Contre |
|---|---|---|
| **SFTP** ⭐ | aucun service à installer, chiffré, standard (`F17`) | pas d'`append-only` |
| **`rest-server`** | seul backend à offrir l'**`append-only`** (`F15`) | un service de plus à déployer et tenir ; `forget`/`prune` doivent partir d'ailleurs |
| **dépôt local sur NFS monté côté poste** | montage déjà existant côté VM2 | ⛔ **verrous documentés comme problématiques** (`F16`) |

**Reco : SFTP au lot 1**, et **`rest-server` en `append-only` nommé comme lot ultérieur**, pas
abandonné. Motif : l'`append-only` est la **seule** parade réelle au risque `R2` (un poste
compromis efface ses propres sauvegardes) — mais c'est un poste de travail à part entière, et le
faire au lot 1 retarderait la **première sauvegarde qui n'existe pas encore**. *MVP d'abord.*

### `D3` — Sur QUELLE machine le dépôt est-il écrit ?

Le dataset `fast/backups` vit sur **`bigserver`** ; la VM2 le voit **par NFS**. Deux cibles SFTP
possibles :
- **`bigserver` en direct** ⭐ — le serveur écrit dans son **propre** système de fichiers local ;
  aucune couche NFS sous le dépôt.
- **la VM2** — le serveur SFTP écrit dans son **montage NFS**. Ce sont des écritures de fichiers
  ordinaires (pas les verrous restic de `F16`), donc **moins risqué qu'un dépôt local sur NFS** —
  mais on empile une couche pour rien.

**Reco : `bigserver` en direct.** ⚠️ **Prérequis NON MESURÉ** : compte, clé SSH, chemin d'écriture.
**À établir avant tout `restic init`** — c'est la première mesure du lot.

### `D4` — Le périmètre : exclut-on quelque chose ? *(Q1)*

🛑 **Le résultat qui tranche, et il est arithmétique** : ce n'est **pas** l'exclusion qui borne
l'occupation, **c'est la rétention**.

Encadrement, **bornes et non prévisions** (les valeurs réelles sont à mesurer, `CA-6`) :

| Scénario | Occupation à un an | Face aux **1,4 To** |
|---|---:|---|
| Aucun changement (borne basse absolue) | ≈ 18 Go | 1,3 % |
| **Pire cas plausible** : les ~14 Go régénérables réécrits **intégralement chaque semaine**, **52 instantanés conservés** | ≈ **746 Go** | **≈ 53 %** |
| **Le même pire cas, avec la rétention `D6`** (≈ 12 instantanés vivants) | ≈ **190 Go** | ≈ 14 % |

**Lecture** : même le **pire cas sans aucune rétention tient dans le réservoir pendant un an**. Le
naïf « 18 Go × 52 = 936 Go » est faux **deux fois** : la déduplication ne recopie que ce qui change,
et la compression (`F13`) réduit le socle.

**Reco : ne rien exclure au lot 1** — c'est **la demande du décideur**, et c'est **conforme au
principe** (*ordonner, oui ; écarter, seulement si ça se débraye ; supprimer, jamais*). Poser
malgré tout un **fichier d'exclusion versionné et VIDE** (`--exclude-file`) : le point de débrayage
existe **avant** d'en avoir besoin, et l'activer sera un **ajout de ligne**, pas un chantier.
Puis **mesurer 4 semaines** (`CA-6`) et **rouvrir devant le décideur si, et seulement si, la mesure
dément le tableau**.

⚠️ **À dire sans détour** : une exclusion restic n'est pas un masquage — la donnée exclue **n'entre
jamais dans l'instantané**. Elle est **débrayable pour l'avenir** (retirer la ligne ⇒ l'instantané
suivant la reprend), **jamais rétroactive**. C'est pourquoi elle appartient au décideur.

### `D5` — 🛑 OÙ VIT LA CLÉ DU DÉPÔT ? *(Q2 — le point de conception le plus sérieux du lot)*

**Le piège, énoncé une fois pour toutes :** le dépôt est chiffré (`F1`) — donc y mettre les secrets
est **acceptable**, c'est même ce qui rend la demande du décideur tenable. Mais **si la seule copie
du mot de passe vit sur la machine qu'on veut pouvoir perdre, la sauvegarde est INRESTAURABLE
exactement le jour où elle sert.** Un dépôt de 18 Go parfaitement à jour dont personne ne connaît
plus le mot de passe **vaut zéro** — et il le vaut **en silence**, sans erreur ni alerte.

**Reco — la règle des trois copies, dont une hors du système sauvegardé :**

| # | Copie | Où | Ce qu'elle sert |
|---|---|---|---|
| 1 | **opérationnelle** | `config.json` de Backrest sur le poste (`F3`) | tous les jours, sans intervention |
| 2 | **hors ligne** | gestionnaire de mots de passe **et/ou** support physique, **hors du poste ET hors de la box** | la restauration après sinistre |
| 3 | **de secours indépendante** | une **seconde clé restic** (`restic key add`, `F2`), mot de passe **différent**, détenue ailleurs | **révoquer** la clé 1 si le poste est compromis, **sans réécrire le dépôt** |

**Interdits opposables :**
- ⛔ le mot de passe du dépôt **ne se range jamais dans `~/work`** — ce serait le chiffrer avec une
  clé qui disparaît avec lui ;
- ⛔ il **ne se range jamais uniquement** dans le `config.json` du poste ;
- ⛔ le `config.json` du poste **ne se sauvegarde pas dans le dépôt qu'il déverrouille** (dépendance
  circulaire : il faut le mot de passe pour lire le fichier qui le contient).

**Arbitrage réservé au décideur** : où vit physiquement la copie 2, et qui d'autre que lui peut y
accéder. **Le cadrage ne le décide pas.**

### `D6` — Un dépôt ou deux ? Quelle rétention ? *(Q4)*

Deux niveaux existent déjà (`fast` 1,4 To, `hdd` 6,8 To). Deux conceptions :

- **`D6-a` — un seul dépôt sur `fast`, répliqué vers `hdd`** (`zfs send`/`recv` ou `rsync`). Simple.
  🛑 **Mais les deux datasets sont sur LA MÊME MACHINE** : ce n'est **pas** une copie hors site,
  c'est une copie hors *dataset*. Ça protège d'une erreur de rétention, **pas** de la perte de
  `bigserver`. **Le dire, sinon on croira être protégé de ce dont on ne l'est pas.**
- **`D6-b` ⭐ — deux dépôts restic, rétentions différentes**, le second alimenté par `restic copy`
  planifié **depuis la VM2** — ce qui **redonne au Backrest existant un rôle réel** plutôt que de
  le laisser en visualiseur.

**Reco : `D6-b`.** Rétentions proposées (ordres de grandeur, à ajuster par le décideur) :

| Dépôt | Support | Rétention proposée | Horizon |
|---|---|---|---|
| **court** | `fast/backups` | `--keep-last 4 --keep-weekly 8` | ≈ 2 mois |
| **long** | `hdd/backups-long` | `--keep-weekly 12 --keep-monthly 24 --keep-yearly 5` | 5 ans |

🛑 **PIÈGE IRRATTRAPABLE, à traiter à la minute de l'initialisation** : le dépôt long **doit** être
créé avec `restic init --copy-chunker-params` **pointant sur le dépôt court** (`F14`). Sans ça, la
déduplication entre les deux est cassée et les données copiées peuvent occuper **jusqu'au double** —
et **les paramètres de découpage d'un dépôt existant ne peuvent plus être changés.** Se tromper ici
oblige à **repartir de zéro**. → `CA-8`, avec témoin négatif.

### `D7` — Le ciblage par projet : à la sauvegarde, à la restauration, ou les deux ? *(Q3)*

La demande couvre les deux sens, et ils n'ont **pas** le même coût :

- **Restaurer un projet ciblé : GRATUIT et NATIF** (`F11`) —
  `restic restore latest:/Users/sjupin/work/robby-immo --target /tmp/restauration` ou `--include`.
  **Rien à construire.**
- **Sauvegarder un projet ciblé maintenant** : deux formes.

| Option | Geste | Pour | Contre |
|---|---|---|---|
| **`D7-a` ⭐** | plan **global** hebdo + bouton *Backup now* pour l'ordre, **plus** un geste en ligne de commande documenté pour le projet seul | **une seule** politique de rétention à tenir | le projet ciblé n'a pas son bouton |
| **`D7-b`** | **un plan Backrest par projet actif** (3 à 5, pas 45) | un bouton par projet, étiquetage `plan:` natif (`F7`) | **N politiques de rétention** = N façons de se tromper |

**Reco : `D7-a` au lot 1.** Motif : la **déduplication rend l'instantané global presque aussi bon
marché qu'un instantané ciblé** — le ciblage à la sauvegarde apporte donc surtout du **confort**,
au prix d'une **multiplication des politiques**. Et `F9` a une conséquence à connaître : deux plans
aux chemins différents forment **deux groupes de rétention distincts** — c'est sûr, mais c'est
**deux choses à surveiller au lieu d'une**.
Geste ciblé proposé (une seule ligne, à exécuter sur le poste) :

```
restic backup --tag ad-hoc --tag projet:robby-immo /Users/sjupin/work/robby-immo
```

**Si le décideur veut le bouton, `D7-b` est parfaitement faisable** — il coûte **+0,3 j-h** et
**une politique de rétention par plan** à tenir alignée.

---

## Décision retenue *(sous réserve des arbitrages `D1`-`D7`)*

**Le poste POUSSE (`D1`=A2)** : Backrest natif macOS y est installé et écrit **en SFTP** (`D2`) vers
un **dépôt court** sur `fast/backups` **de `bigserver`** (`D3`). Un **plan global hebdomadaire** sur
`~/work`, **sans exclusion** (`D4`), déclenchable **à la demande** depuis l'UI. Le **Backrest
existant de la VM2** garde un rôle : **visualisation, restauration** (seul endroit où `restic mount`
fonctionne, `F12`) et **`restic copy` planifié** vers un **dépôt long** sur `hdd/backups-long`
(`D6-b`). La **clé du dépôt** suit la **règle des trois copies** (`D5`). Le **canal poussé** de
Backrest (`F8`) devient le **premier canal poussé du portefeuille**, doublé d'un **veilleur
d'absence** (*Q6*).

---

## Périmètre

**Inclus (lot 1)**
- Installation et configuration de **Backrest sur le poste** (macOS), démarrage automatique.
- **Initialisation des deux dépôts restic** (court sur `fast`, long sur `hdd` **avec**
  `--copy-chunker-params`), et **mise en sûreté des clés** selon `D5`.
- **Un plan global hebdomadaire** sur `~/work`, déclenchable à la demande, **secrets inclus**,
  **sans exclusion**, avec un **fichier d'exclusion versionné et vide** comme point de débrayage.
- **Rétention** (`forget` + `prune`) et **vérification** (`check`, puis `check --read-data-subset`)
  planifiées sur le dépôt court.
- **`restic copy`** planifié depuis la VM2 vers le dépôt long, avec sa propre rétention.
- **Alerte à l'échec** (canal poussé) **et veilleur d'absence** (*Q6*).
- **Une restauration réelle éprouvée**, avec son **témoin négatif** (`CA-9`).
- **La documentation du geste de restauration**, écrite pour être suivie **le jour du sinistre**.

**Exclu — nommément, et pour un motif écrit**
- ⛔ **Toute modification de `robby-immo`** (ou de tout autre projet). `scripts/backup.sh` et le
  ticket `BAK-1` **ne sont ni touchés ni réécrits** (*Q5*).
- ⛔ **Les bases de données et volumes Docker** → **lot 2** (*Q5*), chiffré séparément.
- ⛔ **Les sauvegardes de machines virtuelles** (`vzdump` / `proxmox-backup-client`) : le constat
  « aucune sauvegarde de VM n'existe » est **consigné**, pas traité. Autre métier, autre lot.
- ⛔ **`rest-server` en `append-only`** → lot ultérieur nommé (`D2`).
- ⛔ **Un verbe `iakaframe backup` dans le CLI** : sur-ingénierie au lot 1. À rouvrir si, et
  seulement si, le geste manuel se révèle pénible à l'usage.
- ⛔ **Toute copie hors site** (hors du LAN). Ce lot protège d'une perte du **poste** ; il ne protège
  **pas** d'une perte du **local**. **À écrire noir sur blanc dans la documentation**, faute de quoi
  on croira être couvert de ce dont on ne l'est pas.

---

## Étapes d'implémentation

1. **Re-mesurer avant d'agir** (`CA-0`) : reprendre les relevés du § *Ce qui est déjà mesuré* — ils
   datent du 2026-08-15 et **n'ont pas été corroborés par le cadrage**. En particulier : taille
   réelle de `~/work`, état de Backrest sur la VM2, espace libre des deux datasets.
2. **Établir l'accès `D3`** : compte et clé SSH vers `bigserver`, chemin d'écriture dans
   `fast/backups`, connexion **sans mot de passe** vérifiée (`F17`), `ServerAliveInterval 60` et
   `ServerAliveCountMax 240` posés dans `.ssh/config` du poste.
3. **Choisir le mot de passe du dépôt et le mettre en sûreté AVANT tout `restic init`** (`D5`,
   copies 1 et 2). **Ne pas initialiser un dépôt dont le mot de passe n'est pas déjà en lieu sûr.**
4. **Initialiser le dépôt court** sur `fast/backups`.
5. **Initialiser le dépôt long** sur `hdd/backups-long` **avec `--copy-chunker-params` pointant sur
   le dépôt court** (`F14`, `D6`). 🛑 **Irrattrapable si omis.**
6. **Ajouter la clé de secours** (`restic key add`, `F2`, copie 3) et **noter laquelle est
   laquelle** — deux clés indiscernables ne servent à rien.
7. **Installer Backrest sur le poste** (binaire natif macOS, `F5`), démarrage automatique, accès à
   l'UI vérifié.
8. **Créer le plan global** : chemin `~/work`, cron **hebdomadaire**, `--exclude-file` pointant sur
   le fichier d'exclusion **vide** versionné, rétention `D6` (dépôt court).
9. **Lancer la première sauvegarde à la main** et **relever** : durée, taille du dépôt, nombre de
   fichiers, fichiers refusés (`CA-3`, `CA-4`).
10. **Vérifier que les secrets sont bien dedans** (`CA-2`) — c'est **l'exigence explicite** du
    décideur, elle se **prouve**, elle ne se suppose pas.
11. **Planifier `check`** (hebdomadaire) et **`check --read-data-subset`** étalé (`F10`, `D6`).
12. **Planifier `restic copy`** depuis la VM2 vers le dépôt long, avec sa rétention propre.
13. **Brancher le canal poussé** sur l'échec (`F8`) **et le veilleur d'absence** — voir *Q6*.
14. **Éprouver la restauration** (`CA-9`) : restaurer **un projet entier** dans un répertoire
    jetable, comparer, **et dérouler le témoin négatif**.
15. **Éprouver la restauration APRÈS SINISTRE SIMULÉ** (`CA-10`) : sur une **autre machine**, avec
    **la seule copie 2 du mot de passe**, sans rien emprunter au poste.
16. **Écrire la documentation de restauration** et la ranger **hors du dépôt sauvegardé**.
17. **Consigner au backlog du portefeuille** ce que ce lot ne traite pas : `rest-server`
    `append-only`, absence de sauvegarde de VM, absence de copie hors site, lot 2 (bases).

---

## *Q5* — Bases de données et volumes Docker : comment les DEUX coexistent

**Le fait** : ni les bases ni les volumes Docker ne vivent dans un dépôt git. Sur le poste, ce sont
des données **de développement**, donc **régénérables**. Sur la **box**, c'est la **vraie base**.

**Ce qui existe déjà et qu'on NE RÉÉCRIT PAS** : `robby-immo` a `scripts/backup.sh` (dump + rétention
30 jours) et `make box-backup`, et un ticket **`BAK-1`** ouvert (*sans argument, le script vise la
prod*) — plus `BAK-4`, qui rappelle que `restore.sh` **détruit une base**. **Ce lot ne touche à
aucun des deux.**

**Le partage de responsabilité proposé** — *le projet PRODUIT le dump, la sauvegarde le RAMASSE* :

| Qui | Fait quoi |
|---|---|
| Le **projet** | produit son dump là où il le fait déjà (`scripts/backup.sh`, `make box-backup`) |
| La **sauvegarde** | ramasse le **fichier de dump**, jamais la base vivante |

🛑 **Interdit technique, à écrire une fois pour toutes** : **on ne sauvegarde jamais un volume
PostgreSQL à chaud par copie de fichiers.** Une copie de fichiers d'une base en service donne une
image **incohérente** qui peut refuser de démarrer — et qui **paraît réussie**. Le dump est le seul
objet sauvegardable.

**Reco : hors périmètre du lot 1 — sauf le ramassage passif.** Le plan global sur `~/work` ramasse
**déjà** tout dump qui s'y trouve, sans rien ajouter. Le reste devient un **lot 2** : un plan
Backrest **sur la VM2** (celle qui existe, et qui voit déjà `/root/docker-stack/data`), avec un
**hook avant sauvegarde** (`F8`) qui déclenche le dump juste avant. **Chiffré séparément.**

---

## *Q6* — La vérification, et le silence

> *Un backup jamais restauré n'est pas un backup* (`BAK-2`, ouvert depuis l'origine).

**Trois niveaux, du moins cher au plus probant :**

| Niveau | Ce que ça prouve | Ce que ça NE prouve PAS |
|---|---|---|
| `restic check` hebdomadaire | la **structure** du dépôt est cohérente | **rien** sur les octets stockés (`F10`) |
| `check --read-data-subset=n/t` étalé | les octets sont **réellement** relus, tout le dépôt sur `t` passages | que la donnée restaurée soit **utilisable** |
| **restauration réelle trimestrielle** | qu'un projet **revient** et qu'il est **exact** | rien, si on ne déroule pas le **témoin négatif** |

**Le témoin négatif de la restauration (`CA-9`), et c'est lui qui fait la valeur du test** :
restaurer un projet **modifié depuis l'instantané**, et vérifier que ce qui revient est bien
**la version du jour de l'instantané** — **pas** la version courante. Sans ça, on prouve seulement
que le répertoire existe encore sur le disque de départ.

**Où l'on inspecte** : sur la **VM2**, pas sur le poste. `restic mount` exige macFUSE ou FUSE-T sur
macOS (`F12`) ; sur Linux il fonctionne. **C'est un argument de conception, pas une préférence.**

### 🛑 Le point qui compte : on n'est prévenu QUE si quelque chose tourne

Backrest sait alerter à l'**échec** (`F8`). **Il ne sait pas alerter sur sa propre absence.** Si le
poste est éteint, endormi, ou Backrest arrêté, **il ne se passe rien — et personne ne le sait.**
C'est le mode de défaillance **le plus probable** de tout le lot, et le **plus silencieux**.

**La seule réponse est un veilleur d'ABSENCE (« dead-man switch »)** : un service **tiers** qui crie
quand il **ne reçoit pas** le signal attendu. Backrest sait envoyer ce signal nativement
(**Healthchecks**, `F8`). ⚠️ **Non vérifié depuis le cadrage** : si l'instance de Healthchecks est
auto-hébergée sur le même homelab, elle **partage le destin** de ce qu'elle surveille — c'est un
arbitrage à rendre, et le principe *self-hosted d'abord* ne l'emporte pas mécaniquement ici.

**Canal recommandé : Discord**, canal vivant de la méthode. **Pas Slack** — *slack = dead* dans
iakaframe.

**Deux choses, jamais une** : (1) alerte à l'échec ; (2) alerte à l'**absence de signal** au-delà
du délai attendu. **La seconde est la plus importante des deux.**

---

## Fichiers concernés

> Le lot est **surtout de la configuration** ; peu de fichiers du dépôt bougent. C'est ce qui rend
> les **témoins mesurés** d'autant plus nécessaires : il n'y aura presque rien à relire.

- `~/work/iakaframe/specs/instructions/sauvegarde-portefeuille.md` — **ce fichier** (le cadrage).
- **`~/.config/backrest/config.json` (poste)** — créé par Backrest. 🛑 **Contient le mot de passe du
  dépôt en clair** (`F3`) : **jamais commité, jamais dans un dépôt git, jamais sauvegardé dans le
  dépôt qu'il déverrouille.**
- **Fichier d'exclusion** (chemin à fixer, **versionné dans `iakaframe`**) — **vide au lot 1**, il
  est le **point de débrayage** de `D4`.
- **`~/.ssh/config` (poste)** — entrée d'hôte pour `bigserver` + `ServerAliveInterval` /
  `ServerAliveCountMax` (`F17`).
- **`~/work/iakaframe/docs/` — procédure de restauration** (nom à fixer) : le geste à suivre **le
  jour du sinistre**, à conserver **aussi hors du dépôt sauvegardé** (une procédure de restauration
  enfermée dans ce qu'elle sert à restaurer ne sert à rien).
- **Backlog du portefeuille** — y consigner les dettes nommées à l'étape 17.
- ⛔ **Aucun fichier de `~/work/robby-immo`.** Aucun.

---

## Risques

**`R1` — 🛑 La clé perdue.** Sans le mot de passe, le dépôt est **définitivement illisible** (`F1`),
et ça se découvre **le jour où on en a besoin**. *Mitigation* : `D5` (trois copies, dont une hors du
système sauvegardé) **et** `CA-10` (restauration prouvée depuis la seule copie 2, sur une autre
machine). **Sans `CA-10`, `D5` n'est qu'une intention.**

**`R2` — Un poste compromis efface ses propres sauvegardes.** Le `config.json` du poste porte le mot
de passe en clair (`F3`) : qui lit le home peut lancer `forget`/`prune`. *Mitigation lot 1* :
rétention **longue** côté dépôt long + `restic copy` **tiré depuis la VM2** (jamais poussé par le
poste). *Mitigation réelle* : `rest-server` en `append-only` (`F15`), **lot ultérieur nommé**.

**`R3` — 🛑 Déduplication cassée entre les deux dépôts, IRRATTRAPABLE.** Oublier
`--copy-chunker-params` à l'initialisation du dépôt long peut doubler l'occupation, et **les
paramètres ne se changent plus** (`F14`). *Mitigation* : étape 5 + `CA-8`, **avant** toute copie de
volume.

**`R4` — La sauvegarde silencieuse qui n'a pas lieu.** Poste endormi ou Backrest arrêté ⇒ rien, et
personne n'est prévenu. *Mitigation* : le **veilleur d'absence** (*Q6*), **pas** l'alerte d'échec —
qui ne se déclenche que si quelque chose tourne.

**`R5` — Croire être protégé de ce dont on ne l'est pas.** Les deux datasets sont sur **la même
machine** (`D6`), et **aucune copie hors site n'existe**. Un incendie, un vol ou une panne de
`bigserver` emporte **les deux niveaux**. *Mitigation* : **l'écrire dans la documentation**, et
consigner la copie hors site au backlog. **Un lot qui laisse croire à une protection qu'il ne donne
pas est pire qu'un lot qui n'existe pas.**

**`R6` — macOS refuse silencieusement des fichiers.** Une sauvegarde planifiée peut se heurter à
TCC ; le retour de terrain montre que l'autorisation porte sur le **processus orchestrateur**, pas
sur `restic` (`F18`). *Mitigation* : `CA-4` **exige un décompte de fichiers refusés égal à zéro** —
un instantané « réussi » avec des fichiers refusés est un instantané **incomplet qui se déclare
réussi**.

**`R7` — Le poste ne peut pas être joint / le dépôt est verrouillé.** SFTP coupé pendant les longues
phases sans transfert (`F17`), ou verrou restic resté posé après une interruption. *Mitigation* :
options `ServerAlive*` à l'étape 2 ; savoir **lever un verrou** est à écrire dans la procédure.

**`R8` — Le premier instantané est long, et on l'interrompt.** 18 Go en première passe, à travers
SFTP. *Mitigation* : le lancer **à la main** (étape 9) et **le mesurer**, pas le découvrir sous
cron ; `restic` reprend un instantané interrompu sans repartir de zéro, mais le **mesurer** évite
de conclure à une panne.

**`R9` — La rétention détruit ce qu'on voulait garder.** `forget` supprime. *Mitigation* : `F9` (le
groupement par `(host, paths)` cloisonne déjà les périmètres) + `CA-7` **avec son témoin négatif**
(un `forget --dry-run` avant tout `forget` réel).

**`R10` — Chiffres périmés.** Tous les relevés repris datent du 2026-08-15 et **n'ont pas été
corroborés**. *Mitigation* : `CA-0` — re-mesurer avant d'agir, et **ne jamais recopier un chiffre de
ce fichier comme s'il était une mesure du jour**.

---

## Critères d'acceptation

> Chaque critère porte son **témoin négatif** : ce qu'on doit voir **échouer** pour savoir que le
> contrôle mord vraiment. *Un contrôle qu'on n'a jamais vu échouer ne prouve rien.*

- [ ] **`CA-0` — les relevés sont RE-MESURÉS avant tout geste**, et l'écart avec le § *Ce qui est
      déjà mesuré* est **écrit** (taille de `~/work`, espace libre des deux datasets, état de
      Backrest sur la VM2).
      **Témoin négatif** : au moins **un** chiffre doit différer de ce fichier, ou bien l'exécutant
      doit **déclarer explicitement** qu'ils coïncident tous — *« conforme »* sans valeur n'est pas
      une mesure.

- [ ] **`CA-1` — la version de `restic` réellement utilisée est ≥ 0.14** (format v2 / compression,
      `F13`), et **relevée**, pas supposée.
      **Témoin négatif** : le dépôt initialisé est bien en **format 2** — un dépôt v1 doit être
      détecté et refusé, pas découvert plus tard.

- [ ] **`CA-2` — LES SECRETS SONT DANS L'INSTANTANÉ.** C'est l'exigence explicite du décideur.
      Prouver qu'au moins **un `.env` et un `.env.local`** d'un projet nommé sont **listables** dans
      l'instantané.
      **Témoin négatif** : un chemin **volontairement inexistant** interrogé de la même façon rend
      **zéro** — sinon la commande de contrôle « trouve » tout et ne prouve rien.

- [ ] **`CA-3` — le premier instantané est mesuré** : durée, nombre de fichiers, taille du dépôt
      après compression et déduplication. Les trois valeurs sont **écrites** au dossier.
      **Témoin négatif** : le **second** instantané, pris sans rien modifier, doit ajouter une
      quantité de données **quasi nulle** — s'il ajoute autant que le premier, la déduplication ne
      fonctionne pas et le chiffrage de `D4` s'effondre.

- [ ] **`CA-4` — ZÉRO fichier refusé** sur le premier instantané (`R6`, `F18`). Le décompte est
      relevé explicitement.
      **Témoin négatif** : ajouter au périmètre un chemin **volontairement illisible** et vérifier
      que le décompte **monte** — sinon le contrôle regarde au mauvais endroit.

- [ ] **`CA-5` — les quatre exigences du décideur sont satisfaites et démontrées, une par une** :
      (a) une sauvegarde **hebdomadaire** planifiée ; (b) une sauvegarde **à la demande** déclenchée
      et vue aboutir ; (c) une sauvegarde **globale** et un ciblage **d'un seul projet** ; (d) le
      **répertoire entier**, **secrets compris** (renvoi à `CA-2`).
      **Témoin négatif** : la sauvegarde ciblée ne doit contenir **que** le projet visé — un contrôle
      sur un **autre** projet doit rendre **zéro**.

- [ ] **`CA-6` — la croissance hebdomadaire est mesurée sur 4 passages** et confrontée au tableau de
      `D4`. Si la mesure dément, **le point est rouvert devant le décideur** — pas corrigé en
      silence par une exclusion.
      **Témoin négatif** : au moins un passage doit suivre un **build réel** (le poste de churn
      identifié : artefacts de build et `node_modules`) — quatre semaines sans rien construire
      mesureraient le cas facile et concluraient à tort.

- [ ] **`CA-7` — la rétention est éprouvée À BLANC AVANT d'être appliquée** : un `forget` **en mode
      simulation** est joué et **sa liste est lue** avant tout `forget` réel.
      **Témoin négatif** : la simulation doit désigner **au moins un** instantané à supprimer dans un
      jeu fabriqué pour cela — une simulation qui ne supprime jamais rien ne prouve pas que la
      politique fonctionne.

- [ ] **`CA-8` — 🛑 le dépôt long est initialisé AVEC `--copy-chunker-params`** pointant sur le dépôt
      court (`F14`, `R3`). Vérifié **avant** la première copie.
      **Témoin négatif** : après un `restic copy` d'un instantané déjà présent des deux côtés,
      l'occupation du dépôt long **ne double pas** — si elle double, l'initialisation est à refaire,
      et **elle ne se rattrape pas**.

- [ ] **`CA-9` — une restauration RÉELLE d'un projet entier est déroulée** dans un répertoire
      jetable, et **comparée** au contenu attendu (empreintes ou comparaison récursive).
      **Témoin négatif — c'est LUI qui fait la valeur du test** : restaurer un projet **modifié
      depuis l'instantané** et vérifier que ce qui revient est la version **du jour de
      l'instantané**, **pas** la version courante. Si les deux coïncident, le test n'a rien prouvé.

- [ ] **`CA-10` — 🛑 la restauration après SINISTRE SIMULÉ est déroulée** : depuis **une autre
      machine**, avec **la seule copie 2** du mot de passe (`D5`), **sans rien emprunter au poste** —
      ni son `config.json`, ni son trousseau, ni sa session SSH.
      **Témoin négatif** : la même tentative **sans** le mot de passe doit **échouer** — et
      l'exécutant doit **l'avoir vue échouer**. C'est le seul contrôle qui prouve que `R1` est
      couvert.

- [ ] **`CA-11` — l'alerte à l'échec fonctionne** : une sauvegarde **volontairement mise en échec**
      produit un message **reçu** sur le canal poussé.
      **Témoin négatif** : une sauvegarde **réussie** ne doit **pas** produire d'alerte — un canal
      qui parle tout le temps est un canal qu'on cesse de lire (`SUP-3`, mot pour mot).

- [ ] **`CA-12` — 🛑 le veilleur d'ABSENCE fonctionne** : **arrêter** Backrest (ou sauter un
      passage) et vérifier qu'une alerte arrive **parce que rien ne s'est produit**.
      **Témoin négatif** : c'est **le contraire de `CA-11`** — `CA-11` prouve qu'on est prévenu quand
      ça rate, `CA-12` qu'on est prévenu quand **ça ne se passe rien du tout**. Les deux sont exigés ;
      **l'un ne remplace pas l'autre**.

- [ ] **`CA-13` — la vérification est planifiée ET sa couverture intégrale est bornée** : le nombre
      de passages nécessaires pour relire **tout** le dépôt (`--read-data-subset`, `F10`) est
      **écrit** et vaut au plus un trimestre.
      **Témoin négatif** : un `check` **sans** `--read-data` ne doit **pas** être compté comme une
      relecture des données — il ne l'est pas (`F10`).

- [ ] **`CA-14` — la procédure de restauration est écrite, et suivie PAR QUELQU'UN D'AUTRE que son
      auteur**, du début à la fin, sans question.
      **Témoin négatif** : elle doit être **utilisable sans accès au dépôt sauvegardé** — une
      procédure enfermée dans ce qu'elle restaure ne restaure rien.

- [ ] **`CA-15` — RIEN n'a bougé hors du périmètre.** Aucun fichier de `~/work/robby-immo` (ni
      d'aucun autre projet) n'est modifié ; `scripts/backup.sh` est **intact**.
      **Témoin négatif** : la comparaison doit être **jouée** et rendre **zéro fichier modifié** —
      « je n'y ai pas touché » n'est pas un constat.

- [ ] **`CA-16` — les limites sont ÉCRITES, pas sous-entendues** : aucune copie hors site, deux
      niveaux sur **la même machine**, aucune sauvegarde de VM, bases hors périmètre (lot 2).
      **Témoin négatif** : un lecteur tiers de la documentation doit pouvoir répondre *« non »* à
      *« suis-je protégé si `bigserver` brûle ? »* — s'il répond *« je crois que oui »*, la
      documentation est fausse.

---

## Chiffrage

> **Estimation, pas engagement.** Ordre de grandeur assumé et révisable, à confronter au temps réel
> à la clôture du lot.

| Nature | Geste | Coût |
|---|---|---|
| **Mécanique** | Installation Backrest sur le poste, plan global, calendriers, canal poussé | **0,4 j-h** |
| **Mécanique** | Initialisation des deux dépôts + `--copy-chunker-params` + `restic copy` planifié | **0,3 j-h** |
| **Mesure à dérouler** | Accès SSH `D3`, première sauvegarde mesurée, fichiers refusés (`CA-1` à `CA-5`) | **0,5 j-h** |
| **Mesure à dérouler** | Restauration réelle + témoin négatif (`CA-9`) | **0,3 j-h** |
| **Mesure à dérouler** | 🛑 **Restauration après sinistre simulé, autre machine** (`CA-10`) | **0,4 j-h** |
| **Mesure à dérouler** | Alerte d'échec **et** veilleur d'absence, tous deux vus se déclencher (`CA-11`, `CA-12`) | **0,3 j-h** |
| **Mécanique** | Procédure de restauration écrite + relue par un tiers (`CA-14`) | **0,3 j-h** |
| **Arbitrage du décideur** | `D1` à `D7` | *hors chiffrage — ce n'est pas du temps de fabrication* |
| **TOTAL lot 1** | | **≈ 2,5 j-h** |

**Différé, chiffré à part et NON inclus** :

| Lot | Objet | Coût |
|---|---|---|
| **Lot 2** | Bases et volumes Docker côté box (plan VM2 + hook avant sauvegarde) | **≈ 1 j-h** |
| **Lot 3** | `rest-server` en `append-only` (`D2`, réponse réelle à `R2`) | **≈ 1 j-h** |
| **Lot 4** | Copie hors site (`R5`) | **non chiffré — arbitrage préalable** |
| **Option** | `D7-b` (un plan Backrest par projet actif) | **+0,3 j-h** |
| **Mesure étalée** | `CA-6` (croissance sur 4 semaines) | **+0,2 j-h**, étalés sur un mois |

**Complexité / risque : MOYENNE.** Le geste technique est simple et bien documenté en amont ; **le
risque n'est pas dans la fabrication, il est dans la conception** — `D5` (la clé) et `R3`
(`--copy-chunker-params`) sont deux fautes **irrattrapables** qui ne se voient **ni l'une ni l'autre
au moment où on les commet**.

**Les trois inconnues qui peuvent faire glisser le lot :**
1. **L'accès SSH à `bigserver`** (`D3`) — **non mesuré**. S'il faut créer un compte, ouvrir un accès
   ou négocier un chemin d'écriture, comptez **+0,3 à +1 j-h**.
2. **TCC sur macOS** (`R6`, `F18`) — si des fichiers sont refusés sous planification, le
   contournement (autoriser le bon processus, ou changer d'orchestrateur) coûte **+0,3 à +0,8 j-h**.
3. **La croissance réelle** (`CA-6`) — si elle dément `D4`, l'exclusion redevient un **arbitrage du
   décideur**, donc un délai, pas un coût de fabrication.

---

## Sources vérifiées pendant le cadrage

- [restic — Preparing a new repository (backends, SFTP, `init`, mot de passe)](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html)
- [restic — Removing backup snapshots (`forget`, `--keep-*`, `--group-by`, `--tag`)](https://restic.readthedocs.io/en/stable/060_forget.html)
- [restic — Restoring from backup (`--include`, `<snapshot>:<subfolder>`)](https://restic.readthedocs.io/en/stable/050_restore.html)
- [restic — Working with repositories (`check --read-data-subset`, `copy`, `--copy-chunker-params`)](https://restic.readthedocs.io/en/latest/045_working_with_repos.html)
- [restic — Manual (`--exclude-file`, `--exclude-caches`, CACHEDIR.TAG)](https://restic.readthedocs.io/en/stable/manual_rest.html)
- [restic — chiffrement et clés (dérivation scrypt, clé maîtresse, `keys/`)](https://github.com/restic/restic/blob/master/doc/070_encryption.rst)
- [restic — cryptographie (analyse indépendante, Filippo Valsorda)](https://words.filippo.io/restic-cryptography/)
- [restic-key(1) — gestion de plusieurs clés pour un même dépôt](https://manpages.ubuntu.com/manpages/jammy/man1/restic-key.1.html)
- [restic 0.14.0 — compression zstd, format de dépôt v2](https://restic.net/blog/2022-08-25/restic-0.14.0-released/)
- [restic — `init --copy-chunker-parameters` (PR 2928)](https://github.com/restic/restic/pull/2928)
- [restic — `macOS: drop fuse support (restic mount)` (issue 3096)](https://github.com/restic/restic/issues/3096)
- [restic — `mount: support fuse-t on macOS` (PR 4825)](https://github.com/restic/restic/pull/4825)
- [restic — verrous sur montage NFS (issue 1756)](https://github.com/restic/restic/issues/1756)
- [restic — `Operation not permitted` sur macOS / TCC (issue 2051)](https://github.com/restic/restic/issues/2051)
- [restic forum — Full Disk Access et `launchd`](https://forum.restic.net/t/can-restic-backup-macos-photos-library-from-launchd/7150)
- [restic — modèle de sécurité, `append-only` et ses limites (issue 5041)](https://github.com/restic/restic/issues/5041)
- [Backrest — dépôt et README (installation macOS/Darwin, `install.sh`)](https://github.com/garethgeorge/backrest)
- [Backrest — Getting Started (dépôts, plans, rétention, avertissement sur les clés)](https://garethgeorge.github.io/backrest/introduction/getting-started)
- [Backrest — Hooks (événements, notifications Discord / Shoutrrr / Gotify / Healthchecks)](https://garethgeorge.github.io/backrest/docs/hooks)
- [Backrest — Operations Guide (`forget --tag plan:{PLAN_ID}`)](https://garethgeorge.github.io/backrest/docs/operations)
- [Backrest — mots de passe stockés en clair dans `config.json` (issue 1047)](https://github.com/garethgeorge/backrest/issues/1047)
