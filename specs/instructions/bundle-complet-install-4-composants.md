# Bundle complet — une installation, quatre composants

> Cadrée par 🟡 **Odin** (portefeuille), le **2026-08-25**, sur **directive du décideur**.
> **Lecture seule** sur le code pendant le cadrage : tout fait chiffré ci-dessous a été **relevé
> sur le disque**, jamais déduit d'une mémoire de session.
>
> **Portée portefeuille** : le lot traverse **quatre dépôts** (`iakaframe`, `IakaCockpit`,
> `iakaFrameGUI`, plus le kit hôte). Aucun d'eux ne peut le porter seul — d'où le cadrage au
> niveau du chapeau.
>
> **EN ATTENTE D'ARBITRAGE** : 6 arbitrages (AR-1..AR-6) sont posés avec recommandation. Rien
> ne part au dev avant que Stéphane les tranche.

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

---

## 2. Ce qui existe — relevé le 2026-08-25

| Composant | Nature | Installation actuelle | État |
|---|---|---|---|
| **CLI** `@naonedge/iakaframe` | Node pur, **zéro dépendance**, ≥ 20 | `npm install -g ./cli`, ou npm privé, ou wrapper | ✅ v0.39.0 |
| **Méthode** (kit hôte) | `CLAUDE.md`, `settings.json`, hooks, agents, skills, commandes | `node install.mjs` (fan-out multi-hôte) | ✅ posée sur ce poste : 10 agents, 23 skills, 11 commandes, 10 hooks |
| **IakaCockpit** | app desktop **Tauri** | build local + copie dans `/Applications` | ⚠️ pas d'installeur ; canal d'auto-update **hors service** |
| **iakaFrameGUI** | app desktop **Tauri** (`iakaframegui` v0.1.7) | non relevé | ⚠️ à instruire |

**Trois faits qui commandent le lot :**

- **F1 — le CLI embarque déjà la méthode.** `cli/_bundled/` part dans le tarball (champ `files`).
  La directive « livrer la méthode avec le CLI » est donc **déjà vraie au niveau du paquet** ; ce
  qui manque est l'**activation** (§ 4, AR-1). *Corollaire réparé le jour même (`5367c25`) :
  `teams` et `bindings` manquaient au bundle, qui livrait des personas sans les équipes qui les
  assemblent. Une garde refuse désormais un bundle amputé.*
- **F2 — deux des quatre composants sont des apps Tauri.** Leur « installation » n'est pas un
  `npm install` : c'est un **bundle signé par plateforme**. Le chaînage ne peut donc pas être un
  simple script npm (§ 5, AR-3).
- **F3 — le canal de distribution est cassé.** Le `publishConfig` du CLI pointe
  `192.168.2.11` (iakabox **hors service**) alors que l'origin est passé au NAS
  `192.168.1.139` ; le manifeste d'auto-update du Cockpit pointe la **même** machine morte.
  **Aucune install distante ne peut aboutir aujourd'hui** — c'est le pré-requis n°1 (§ 6, lot 0).

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

**Recommandation : macOS arm64 d'abord**, seule plateforme où la chaîne est aujourd'hui
**vérifiable de bout en bout** (les deux apps y sont buildées et signées). Les autres plateformes
sont **déclarées non couvertes** et refusées explicitement — jamais silencieusement.

---

## 5. Périmètre

### Lot 0 — Réparer le canal (pré-requis, non négociable)

- Repointer le `publishConfig` du CLI du `192.168.2.11` mort vers le NAS `192.168.1.139`.
- Repointer le manifeste d'auto-update du Cockpit sur le même hôte.
- **Sortie** : `npm install -g @naonedge/iakaframe` aboutit sur le LAN, et le Cockpit voit une
  mise à jour. **Sans ce lot, les trois suivants n'ont pas de canal** (F3).

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

---

## 8. Estimation *(ordre de grandeur, révisable)*

| Lot | j-homme | Inconnues |
|---|---|---|
| 0 — canal | **0,5** | droits sur le registre npm du NAS |
| A — verbe install (1+2) | **2** | interactivité multi-OS, formats de validation |
| B — les deux apps | **3** | signature, formats de bundle par OS, FrameGUI non relevé |
| C — chaîne + échec partiel | **1,5** | états intermédiaires à décrire honnêtement |
| **Total** | **≈ 7** (5–10) | |

---

## 9. Vérification (gate de chaque lot)

Suite complète du CLI verte · `--dry-run` prouvé sans écriture (empreinte du système de fichiers
avant/après) · contrefactuel sur chaque garde (canal mort, signature absente, plateforme non
couverte) · **recette réelle sur une machine nue** — le seul contrôle qui compte pour un installeur.
