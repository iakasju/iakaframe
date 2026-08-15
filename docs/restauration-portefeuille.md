# Restaurer le portefeuille — procédure du jour du sinistre

> **À lire quand tout va mal.** Cette page est écrite pour être suivie **sans rien savoir d'autre**,
> par quelqu'un qui n'a pas construit le dispositif. Elle est **versionnée dans le dépôt `iakaframe`,
> donc poussée sur Forgejo** : elle survit à la perte du poste, et elle se relit depuis n'importe
> quelle machine par un `git clone`.
>
> Cadrage de référence : `specs/instructions/sauvegarde-portefeuille.md`. Lot 1, posé le 2026-08-15.

---

## 🛑 CE DONT VOUS N'ÊTES **PAS** PROTÉGÉ — à lire AVANT de vous croire couvert

Un lot qui laisse croire à une protection qu'il ne donne pas est pire qu'un lot qui n'existe pas.
Répondez **non** aux quatre questions ci-dessous ; si vous hésitez, cette page est mal écrite.

| Question | Réponse |
|---|---|
| *Suis-je protégé si `bigserver` brûle, est volé, ou meurt ?* | **NON.** Le dépôt vit **entièrement** sur `bigserver`. **Aucune copie hors site n'existe.** Les deux niveaux prévus (`fast/backups` et `hdd/backups-long`) sont **deux datasets de LA MÊME MACHINE** : c'est une copie hors *dataset*, jamais une copie hors *site*. |
| *Mes machines virtuelles sont-elles sauvegardées ?* | **NON.** Aucun job `vzdump`, aucun dépôt `proxmox-backup-client` alimenté. Constat consigné, non traité. |
| *Mes bases de données sont-elles dedans ?* | **NON**, pas en tant que bases. Ce qui est ramassé, ce sont les **fichiers présents dans `~/work`** — donc un **dump** s'il s'y trouve. Une base vivante ou un volume Docker n'y est pas (lot 2). ⚠ On ne sauvegarde **jamais** un volume PostgreSQL à chaud par copie de fichiers : l'image est incohérente **et paraît réussie**. |
| *Suis-je prévenu si la sauvegarde n'a pas lieu ?* | **NON.** Il n'y a **aucune planification** et **aucun veilleur d'absence** à ce lot. La sauvegarde n'existe **que** quand quelqu'un tape la commande. Si personne ne la tape, **rien ne se passe et personne ne le sait.** |

**Ce dont vous **êtes** protégé** : la perte, le vol, la panne ou l'effacement **du poste de dev** —
c'est-à-dire des **secrets** (`.env`, `.env.local`, clés SSH de `~/work`), des **données non
versionnées** et de tout ce qu'un `git clone` ne rend pas.

---

## Les trois pièces, et où elles vivent

| Pièce | Où | Pourquoi là |
|---|---|---|
| **Le dépôt** (données chiffrées) | `bigserver` (192.168.2.20), `/fast/backups/portefeuille` | le serveur écrit dans son **propre** système de fichiers : aucune couche NFS sous le dépôt |
| **La clé** (mot de passe) | `iakabox-apps` (192.168.2.11), `/root/.config/iakaframe/restic-portefeuille.pass`, mode `600` | 🛑 **délibérément PAS sur la machine qui porte le dépôt** : les réunir donnerait, à qui compromet cette machine, **et** les données chiffrées **et** la clé |
| **Le geste** | `iaka range …` sur le poste, ou `restic` à la main | le poste **pousse** ; rien ne tire, rien n'est planifié |

> ⛔ **Le mot de passe n'est écrit dans AUCUN fichier de `~/work`.** Ce serait chiffrer avec une clé
> qui disparaît avec ce qu'elle protège. Il n'est pas non plus dans ce dépôt git.

---

## 1. Restaurer — le geste, dans l'ordre

Toutes les commandes ci-dessous supposent ces deux variables. **Aucune ne contient le secret** :
la seconde est la **commande qui va le chercher**, et restic en lit la sortie standard.

```bash
export RESTIC_REPOSITORY="sftp:bigserver:/fast/backups/portefeuille"
export RESTIC_PASSWORD_COMMAND="ssh -o BatchMode=yes iakabox-apps cat /root/.config/iakaframe/restic-portefeuille.pass"
```

### a. Voir ce qu'on a

```bash
restic snapshots                       # tous les instantanés
restic snapshots --tag iaka-range      # ceux produits par `iaka range`
restic stats latest                    # taille et nombre de fichiers du dernier
```

> 🛑 **`latest` n'est PAS « le dernier instantané complet » — c'est le dernier, point.** Erreur
> commise en vrai le 2026-08-15 pendant la vérification du lot : un instantané parasite de **14
> octets** avait été créé après la sauvegarde globale, et `restic ls latest` a donc rendu **quatre
> lignes** au lieu de 205 236 — de quoi conclure, à tort, que *les secrets n'étaient pas dans la
> sauvegarde*.
> **Conduite** : sur une restauration qui compte, **lisez `restic snapshots` et nommez
> l'identifiant** (`restic restore 7512a0e8 …`). Si vous tenez à `latest`, **bornez-le** par ce
> qu'il doit désigner :
> ```bash
> restic snapshots --path /Users/sjupin/work --tag perimetre:all
> restic ls latest --path /Users/sjupin/work    # latest DANS ce périmètre
> ```
> *Un identifiant qu'on a lu vaut mieux qu'un mot-clé auquel on fait confiance.*

### b. Restaurer **un projet** — 🛑 **jamais par-dessus l'original**

```bash
restic restore latest --target /tmp/restauration \
  --include /Users/sjupin/work/robby-immo
```

Ce qui revient atterrit sous `/tmp/restauration/Users/sjupin/work/robby-immo`.
**Restaurez toujours dans un répertoire jetable, puis comparez, puis déplacez.** Restaurer
directement sur `~/work` écraserait du travail plus récent que l'instantané — et sans prévenir.

Pour reprendre **un état plus ancien**, remplacez `latest` par l'identifiant lu dans `snapshots`.

### c. Restaurer **tout le portefeuille** (poste neuf)

```bash
restic restore latest --target /Users/<vous>/restauration-portefeuille
```

Puis vérifiez le compte avant de déplacer quoi que ce soit :

```bash
find /Users/<vous>/restauration-portefeuille -type f | wc -l
```

### d. Retrouver **un seul fichier** (un `.env` oublié)

```bash
restic find --tag iaka-range '*/robby-immo/.env'
restic restore <snapshot> --target /tmp/un-fichier --include <chemin exact rendu ci-dessus>
```

### e. Explorer sans restaurer

`restic mount` **ne marche pas de façon fiable sur macOS** (il exige macFUSE ou FUSE-T). Sur
**Linux** il fonctionne : le poste d'inspection naturel est donc **`iakabox-apps`**, pas le Mac.
*Réserve à connaître : `restic` n'y est pas encore installé (lot 1 ne l'y a pas posé).*

---

## 2. Quand ça coince

| Symptôme | Cause | Geste |
|---|---|---|
| `Fatal: unable to open config file` | mauvais dépôt, ou clé illisible | vérifier `echo $RESTIC_REPOSITORY`, puis que la commande de clé **rend bien 64 octets** : `ssh iakabox-apps wc -c /root/.config/iakaframe/restic-portefeuille.pass` |
| `wrong password or no key found` | **la clé ne correspond pas** | ⛔ **ne pas ré-initialiser le dépôt** : `restic init` sur un dépôt existant échoue, mais l'erreur pousse à « repartir propre » — ce serait perdre l'historique. Chercher la clé, pas contourner la serrure. |
| `repository is already locked` | verrou resté posé après une interruption | vérifier qu'**aucune** sauvegarde ne tourne, puis `restic unlock` |
| la connexion tombe pendant une longue phase | SFTP coupé faute de trafic | `~/.ssh/config` doit porter `ServerAliveInterval 60` et `ServerAliveCountMax 240` pour `bigserver` — vérifiable par `ssh -G bigserver` |
| `restic: command not found` | binaire absent | binaire officiel ≥ 0.14 (format de dépôt v2). Vérifier la somme SHA-256 publiée avec la version. |

---

## 3. Sauvegarder — le geste courant

```bash
iaka range all                 # tout le portefeuille, SECRETS COMPRIS, sans aucune exclusion
iaka range robby-immo          # ce projet seul
iaka range --list              # les projets sauvegardables
iaka range <projet> --dry-run  # parcourt et compte, sans rien écrire
```

Un **nom de projet inconnu est refusé** : il ne retombe jamais sur `all`, et ne produit jamais un
instantané vide qui aurait l'air d'avoir marché.

> ⚠️ **Un instantané est une photo, pas une transaction — et rien ne coordonne `range` avec le
> travail en cours.** Mesuré le 2026-08-15 : la comparaison d'une restauration au disque vivant a
> fait apparaître **un fichier modifié 23 secondes après** la prise, par un agent travaillant dans
> un worktree parallèle. Ce n'est pas un défaut de la sauvegarde — c'est ce qu'une photo fait — mais
> **ne lancez pas `range` en pleine écriture** si vous voulez un état cohérent, et n'en concluez pas
> à une corruption si un fichier diffère : regardez d'abord **son horodatage**.

**Le point de débrayage des exclusions** est `config/sauvegarde-exclusions.txt` — **volontairement
sans aucun motif**. Y ajouter une ligne appartient au **décideur**, pas à la fabrication : une
exclusion restic n'est pas un masquage, la donnée exclue **n'entre jamais** dans l'instantané, et
c'est **débrayable pour l'avenir, jamais rétroactif**.

---

## 4. 🛑 Le piège **irrattrapable** du second dépôt — à lire AVANT de le créer

Le dépôt **long** sur `hdd/backups-long` **n'existe pas encore**. Le jour où on le crée, il **doit**
l'être avec `--copy-chunker-params` pointant sur le dépôt court :

```bash
restic -r sftp:bigserver:/hdd/backups-long/portefeuille init \
  --from-repo sftp:bigserver:/fast/backups/portefeuille \
  --copy-chunker-params
```

**Sans cette option, la déduplication entre les deux dépôts est cassée** et les données copiées
peuvent occuper **jusqu'au double** — et **les paramètres de découpage d'un dépôt existant ne
peuvent plus être changés**. Se tromper oblige à **repartir de zéro**, et **rien ne le signale au
moment de la faute**.

**Contrôle qui le prouve**, à jouer juste après l'initialisation (les deux valeurs doivent être
**identiques**) :

```bash
restic -r sftp:bigserver:/fast/backups/portefeuille   cat config
restic -r sftp:bigserver:/hdd/backups-long/portefeuille cat config
```

---

## 5. Ce qui reste dû (et qui n'est donc pas une garantie aujourd'hui)

- **La copie hors ligne du mot de passe**, hors du poste **et** hors de la box (gestionnaire de mots
  de passe ou support physique). **Tant qu'elle n'existe pas, une perte simultanée de `iakabox-apps`
  rend le dépôt définitivement illisible.** C'est le point de défaillance unique du dispositif, et
  c'est un **arbitrage du décideur** : où elle vit, et qui d'autre peut y accéder.
- **La clé de secours indépendante** (`restic key add`, second mot de passe détenu ailleurs), qui
  permettrait de **révoquer** la clé courante sans réécrire le dépôt.
- **La restauration après sinistre simulé** : depuis une **autre machine**, avec la **seule** copie
  hors ligne, sans rien emprunter au poste. Tant qu'elle n'est pas déroulée, la règle des copies
  reste une **intention**.
- **La planification hebdomadaire** et le **veilleur d'absence**.
- **La rétention** (`forget`/`prune`) : **rien n'est configuré**, donc **rien n'est jamais supprimé**
  — état volontaire et sûr au lot 1, à surveiller quand l'occupation montera.
- **La vérification périodique** (`restic check`, puis `check --read-data-subset` étalé).
- **Le dépôt long** et sa copie planifiée (cf. § 4).
- **La copie hors site** (`R5`) et la **sauvegarde des machines virtuelles**.
