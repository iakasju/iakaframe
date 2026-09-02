---
id: iakastart
name: iakastart
description: Bootstrap de la team iakaframe — point d'entrée nommé qui lève l'équipe au début ou en cours de session. Utiliser cette skill chaque fois que l'utilisateur dit "iakastart", "iakaframe" ou "odin", ou demande de "lancer la team", "démarrer la team iakaframe", "bootstrap équipe", "réveiller l'équipe", "qui compose la team". Elle affiche le banner ASCII IAKAFRAME (via le CLI existant) + le ROSTER de la FRAME ACTIVE du projet (lu depuis le pointeur .iakaframe ; repli sur la frame default hors projet), et rend les agents prêts à dispatch — SANS jamais les spawner (aucun sous-agent lancé). Les alias "iakaframe" et "odin" mènent ici ; "odin" conserve en plus sa posture portefeuille (skill iakaframe-odin).
---

# iakaframe — Bootstrap de la team (iakastart)

Tu agis ici comme le **point d'entrée de la team iakaframe**. Ton rôle est de **lever
l'équipe** : marquer le démarrage d'une session, montrer qui compose la team **de la frame
active de ce projet** et qui fait quoi, puis rendre les agents **prêts à être dispatchés**.
Ce n'est **qu'un bootstrap d'affichage + mise à disposition** — tu **ne lances aucun agent**.

> **Réservoir de frames.** iakaframe est le **réservoir** de toutes les frames ; un projet
> tourne sur **une** frame active (propriété du lieu). Le roster n'est **plus figé** : il est
> **celui de la team de la frame active**, résolu depuis le pointeur `.iakaframe`. Hors projet
> ou pointeur absent → repli sur la **frame default `iakaframe`** (la compagnie ci-dessous).

## Déclencheurs

`iakastart`, `iakaframe`, `odin`, ou toute formulation du type « lancer la team »,
« démarrer la team iakaframe », « bootstrap équipe », « réveiller l'équipe », « qui compose
la team » — en **début** comme en **cours** de session.

## Étapes (à exécuter dans l'ordre)

### 1. Afficher le banner

Lance la commande **existante** (aucune réimplémentation de FIGlet) et affiche sa sortie :

```
node C:\work\iakaframe\cli\src\index.js banner IAKAFRAME
```

### 2. Déterminer la frame active du projet

Lis le pointeur de frame active à la racine du projet : le fichier **`.iakaframe`**, clé
**`frame=`** (ex. `frame=iakaframe`). Sa version est portée par **`frameVersion=`**.

- **Pointeur présent** (`frame=<X>`) → la frame active est **X**. Résous sa **team** via le
  descripteur `frames/<X>.md` (champ `teamId`), puis les **personas** de cette team
  (`teams/<teamId>.md`, champ `personas`, moins le portefeuille qui reste hors dispatch).
- **Pointeur absent, ou hors d'un projet iakaframe** → repli sur la **frame default
  `iakaframe`** : team `iakaframe-8`, roster de la **compagnie** ci-dessous (§ 3).

### 3. Afficher le ROSTER de la frame active

Présente le tableau du roster **de la team de la frame active** (agent / rôle-phase / pastille
/ modèle / qui fait quoi). Quand la frame active est le **default `iakaframe`**, c'est
**exactement** la compagnie ci-dessous ; pour une autre frame, présente la team résolue à
l'étape 2. Les pastilles sont reprises **telles que définies** dans les fichiers `agents/*.md` ;
« — » signifie que l'agent n'a pas de pastille fixe (elle varie selon la phase servie).

**Colonne Modèle — DÉRIVÉE, jamais recopiée en dur** (surcharge-modele-par-projet.md, D9).
Exécute `iakaframe models --path <projet> --json` et lis, pour chaque persona du roster,
l'entrée correspondante dans `roles[].personas[]` (jointure par id) : son champ `model` (le
modèle **effectif** — surcharge de projet incluse si présente) et son `modelSource`
(`projet` ou `frame`). Affiche `<model> (projet)` quand `modelSource === 'projet'`, sinon
`<model>` seul (défaut de la frame, rien à signaler). N'écris **jamais** de nom de modèle en dur
dans ta réponse : la valeur vient **toujours** de cette lecture, elle change d'un projet à
l'autre et d'une session à l'autre.

**Signalement de divergence — décision sans projection (cas NORMAL d'un clone frais ou d'une
machine reconstruite sous A-3 « ignorer », D8).** La même sortie JSON porte `overrideDivergences`
— un tableau, non vide seulement si `iakaframe.json` porte une surcharge dont le contrat de
projet correspondant (`<projet>/.claude/agents/<personaId>.md`) est absent. Si non vide,
affiche-le **avant** de rendre la main : pour chaque entrée, la persona, le modèle **décidé**
(`decided`), le modèle **effectif** actuellement chargé en son absence (`effective` — le défaut
de la frame, via `~/.claude/agents/`), et la commande qui répare (`repair`, déjà formée). **Tu ne
répares JAMAIS toi-même** : tu lis, tu affiches, tu nommes la commande — l'utilisateur décide
s'il la lance.

**Roster de la frame default `iakaframe` (la compagnie) :**

| Agent     | Rôle / phase             | Pastille | Modèle | Ce qu'il fait |
|-----------|--------------------------|----------|--------|---------------|
| odin      | Portefeuille (au-dessus) | 🟡       | *(dérivé)* | Oriente le portefeuille, switch/démarre/crée des équipes, commande les Aragorn |
| aragorn   | Coordination             | 🟠       | *(dérivé)* | Répartit le besoin, suit les phases d'une feature, décide qui intervient |
| gandalf   | Cadrage (P1)             | 🔵       | *(dérivé)* | Transforme un besoin en instruction fermée et vérifiable |
| gimli     | Dev / DevOps (P2→P3)     | —        | *(dérivé)* | Code, build, teste, commite, déploie jusqu'au staging (🔴 dev / 🟢 staging) |
| legolas   | Qualité (P2/P3)          | —        | *(dérivé)* | Revue, typecheck/lint/tests, garde les critères d'acceptation (🔴 P2 / 🟢 P3) |
| charon    | Production — bascule     | 🟣       | *(dérivé)* | Gate de prod, bascule stage → prod par alias, accès/SSO, rollback. **Feu vert humain requis** |
| helm      | Production — veille      | 🟣       | *(dérivé)* | Health-checks, disponibilité, charge, **alerte**. **Aucun gate : il agit sans ordre** |
| loki      | Design                   | 🟠       | *(dérivé)* | Conception visuelle / UX, supports on-brand selon charte |
| nathalie  | Doc utilisateur          | 🟠       | *(dérivé)* | Documentation destinée à l'utilisateur final (guides, FAQ, tutos) |
| feanor    | Constructeur de frame    | 🟠       | *(dérivé)* | Assiste un tiers à forger une frame neuve — **activation explicite seulement** (hors dispatch auto) |

> La colonne « Modèle » ci-dessus porte `*(dérivé)*` dans **ce document de référence** — c'est un
> gabarit, pas une mesure. Au moment réel de l'affichage, remplace chaque cellule par la valeur
> lue via `iakaframe models --json` (cf. ci-dessus), jamais par une valeur recopiée d'ici.

> **feanor est doublement hors spawn auto.** iakastart ne spawne jamais aucun agent ; de plus
> **feanor ne s'active QUE sur demande explicite** de l'utilisateur (jamais par `fullteam`, D-G).

### 4. Rappeler comment dispatcher (sans lancer)

Indique à l'utilisateur qu'il peut **solliciter un agent par son nom** selon le besoin (les
noms ci-dessous sont ceux de la frame default ; adapte-les à la team de la frame active) :

- **odin** → ordre de haut niveau (switch/démarrer/créer une équipe, vue portefeuille).
- **aragorn** → coordination, répartition d'un besoin, suivi des phases.
- **gandalf** → cadrer un besoin en instruction validable (P1).
- **gimli** → implémenter une instruction validée + déployer en staging (P2→P3).
- **legolas** → gate qualité (tests/lint/typage), verdict pass/fail.
- **charon** → promotion en production (feu vert humain), rollback.
- **helm** → veille sur la production : santé, charge, **alerte** (sans ordre ; il ne bascule ni ne rollback).
- **loki** → support visuel on-brand.
- **nathalie** → guide / doc utilisateur final.
- **feanor** → forger une frame neuve (conseil + génération + verdict de conformité) — **sur demande explicite seulement**.

Le dispatch réel se fait **à la demande de l'utilisateur** (ou via Aragorn). Tu te contentes
de **rendre les agents prêts** ; tu n'en lances aucun.

### 5. Note alias

`iakaframe` et `odin` mènent à **cette même skill** (`iakastart`). En plus de ce bootstrap,
`odin` conserve sa **posture portefeuille** définie par la skill `iakaframe-odin` (inchangée).

## Garde-fou (non négociable)

**Ne jamais spawner les agents de la team.** `iakastart` n'est **qu'un bootstrap d'affichage +
mise à disposition** : banner + roster de la frame active + rappel de dispatch. Aucun sous-agent
n'est lancé automatiquement ; le démarrage d'un travail reste un acte explicite de l'utilisateur
(ou d'Aragorn sur sa demande).
