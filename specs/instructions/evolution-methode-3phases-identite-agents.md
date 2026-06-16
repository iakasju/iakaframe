# Instruction — Évolution de la méthode : team à 3 phases + squad prod + identité colorée des agents

> **Phase cadrage (🧙 Gandalf).** Inscrire « dans le marbre » les évolutions décidées avec
> Stéphane depuis le dernier doc HTML. Gate : validation humaine de cette instruction avant
> toute modification.
> Statut : 🟡 **à valider** (2026-06-15).

---

## 1. Problème / besoin

La méthode a évolué en discussion mais le doc de référence ne le reflète pas encore :

1. Les **« 3 acteurs »** (décideur / réflexion / exécution) et l'**équipe d'agents** (6 jalons
   J0–J5) cohabitent sans articulation claire. Stéphane veut un récit unifié : **une team
   organisée en 3 phases de travail**.
2. Le **roster doit changer** : la chaîne de dev cible le **staging**, et la **prod** devient
   une **équipe à part**.
3. Manque une présentation soignée : **agents**, leurs **périmètres**, le **workflow**, et le
   **rôle d'Odin**.
4. **Nouvelle convention** : quand un agent **s'adresse à Stéphane**, il s'**identifie** par
   `[royaume][agent]` avec une **couleur distincte par agent**.

---

## 2. Ce qui existe (état actuel)

- `methode-de-travail.md` : sections « Les trois acteurs », « L'équipe d'agents (Yakaframe
  Avancé) » avec roster + **jalons J0–J5** + étanchéité + incarnation + workflow.
- `specs/equipe-agents.md` : référence canonique du roster (8 agents), fiches détaillées,
  recoupement PDF, état de l'outillage.
- `methode-de-travail.html` : version onglets (méthode / équipe / code), générée en partie par
  `iakaframe-build-methode-code.ps1`.
- `agents/*.md` : 8 subagents (odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie) +
  `_TEMPLATE.md`.
- `skills/iakaframe-*` : savoir-faire par rôle.

Roster actuel (résumé) : Gimli = dev (J1) ; Legolas = qualité (J2-J3) ; **Helm = J4-J5
(déploiement prod + surveillance)** ; J3 = intégration → rc sur stage.

---

## 3. Décisions (arbitrées avec Stéphane)

### 3.1 — Réarticulation : une team, 3 phases (cible = STAGING)

Les **3 acteurs restent le modèle conceptuel** (décideur / réflexion / exécution). La couche
réflexion+exécution s'opère via une **team d'agents** organisée en **3 phases** dont la **cible
est le staging** :

| Phase | Agent(s) | Entrée → Sortie | Gate |
|---|---|---|---|
| **P1 — Cadrage** | 🧙 Gandalf | besoin → `specs/instructions/{feature}.md` | **humain** (Stéphane valide) |
| **P2 — Réalisation** | ⚒️ Gimli (dev, ×N) + 🏹 Legolas (qualité) | instruction → branche + commits + verdict PASS | **auto** (typecheck/lint/tests verts) |
| **P3 — Déploiement staging** | ⚒️ Gimli **en devops** | PASS → image/build déployé en **staging** (rc) ; Legolas valide sur stage | auto |

> **Changement de roster clé :** ⚒️ **Gimli monte en dev + devops** — il **finit le travail
> jusqu'à la mise en staging** (build, image, déploiement stage). La chaîne automatisée
> **s'arrête au staging**.

### 3.2 — La PROD est une équipe à part (hors les 3 phases)

La mise en production n'est **pas** une phase de la chaîne de dev. C'est une **équipe dédiée**,
déclenchée **sur feu vert humain** :

- 🌉 **Helm = équipe prod** : **déploiement prod**, **surveillance** (health-checks,
  disponibilité, charge, dashboard), **alertes**, **rollback**, **gardien des accès** (proxy,
  SSO, alias de version).
- **Gate prod = humain** (feu vert tracé). Helm ne promeut jamais seul.
- Cette équipe est **extensible** (on pourra y ajouter des rôles surveillance/alerte dédiés) ;
  pour l'instant Helm la porte seul.

> Frontière nette : **dev → staging** (les 3 phases, Gandalf→Gimli→Gimli devops + Legolas) puis
> **prod** (squad Helm, sur feu vert). Deux mondes, une couture humaine entre les deux.

### 3.3 — Présentation soignée (agents / périmètres / workflow / Odin)

Refondre la présentation pour qu'on **comprenne d'un coup d'œil** : le roster, le **périmètre
fermé** de chaque agent (ce qu'il fait / ne fait pas), le **workflow en 3 phases + squad prod**,
et le **rôle d'Odin** (portefeuille, au-dessus des équipes). Conserver : étanchéité, incarnation
subagents+skills, lexique (« la compagnie est à l'auberge »), règle Gandalf web-enabled.

### 3.4 — Identité colorée des agents (nouvelle convention)

**Règle.** Quand un agent **s'adresse directement à Stéphane** — une **question** ou une **prise
de parole** qui lui est destinée — il **préfixe** son message par son identité :

```
<pastille-phase> [<ROYAUME>][<Agent>]  <message en couleur par défaut…>
```

- **`<ROYAUME>`** en **MAJUSCULE** = le projet courant (ex. `IAKABOX`) ; pour 🦅 Odin (niveau
  portefeuille) = `PORTEFEUILLE`.
- **Couleur = la PHASE en cours** (pas l'agent), portée par une **pastille emoji** (voir table
  des phases), affichée **partout** (terminal Claude Code, Slack, HTML). Un même agent **change
  de pastille selon la phase** où il agit (ex. ⚒️ Gimli 🔴 en dev, 🟢 en staging). Le **corps du
  message reste en couleur par défaut** (seule l'identité est « colorée »).
- L'agent peut conserver son **emoji-persona** (🧙⚒️🏹🌉🦅…) à l'intérieur du libellé s'il le
  souhaite ; la **pastille de tête** reste celle de la **phase**.
- **Périmètre d'application : STRICT.** Uniquement les **paroles adressées à Stéphane**
  (questions, messages directs, demandes de feu vert). **Exclus** : les **logs**, les **traces
  de réflexion**, la sortie d'outils, le bruit d'exécution. → l'identité signale « un agent te
  parle », elle ne pollue pas le travail.

**Table des phases (couleur partagée — pastille + couleur HTML) :**

| Phase | Pastille | Couleur HTML | Agents typiques |
|---|---|---|---|
| **Cadrage / réflexion** | 🔵 | `#2196F3` (bleu) | 🧙 Gandalf |
| **Dev** | 🔴 | `#F44336` (rouge) | ⚒️ Gimli, 🏹 Legolas (tests) |
| **Staging** | 🟢 | `#4CAF50` (vert) | ⚒️ Gimli (devops), 🏹 Legolas (valid. stage) |
| **Prod** | 🟣 | `#9C27B0` (violet) | 🌉 Helm |
| **Portefeuille** | 🟡 | `#FFC107` (or) | 🦅 Odin |

> **Agents transverses** (🛡️ Aragorn coordination, 🎭 Loki design, 📖 Nathalie guides) :
> prennent la **pastille de la phase qu'ils servent** au moment où ils parlent ; à défaut de
> phase rattachée, ⬜ (neutre).

**Rendu :**
- **Session Claude Code** : pastille emoji (= couleur de la **phase**) **+ libellé
  `[ROYAUME][Agent]` en code inline** (backticks) pour le highlight. Note : le code inline du
  TUI porte une **couleur d'accent unique** (thème) — il met en valeur mais ne distingue pas les
  phases entre elles ; c'est la **pastille** qui porte la couleur de la phase. (Les rouges/verts
  du diff sont rendus par le harnais, non reproductibles dans la prose d'un agent.)
- **Slack** : pastille emoji (+ formatage `code` si dispo).
- **HTML de la méthode** : pastille **+ vraie couleur** du `[ROYAUME][Agent]` (`<span style>`),
  classes CSS par phase (`.ph-cadrage`/`.ph-dev`/`.ph-staging`/`.ph-prod`/`.ph-portef`).
- **Option terminal vraie couleur** : fonction PowerShell `iaka-say` (profil), coloration ANSI
  du bandeau par reconnaissance de l'agent — documentée comme **option**, non imposée :

  ```powershell
  function iaka-say($agent, $msg) {
    $c = @{ Odin='Cyan'; Aragorn='Gray'; Gandalf='Green'; Gimli='DarkYellow';
            Legolas='Magenta'; Helm='Red'; Loki='Yellow'; Nathalie='DarkRed' }[$agent]
    Write-Host "[$agent]" -ForegroundColor $c -NoNewline; Write-Host " $msg"
  }
  ```
  Limite assumée : ne colore que le bandeau et suppose un appel commande — d'où le défaut
  « pastille ».

---

## 4. Périmètre du livrable (à valider — hypothèse : « marbre complet »)

> ⚠️ Point à confirmer par Stéphane. Hypothèse retenue : **docs + agents + skills + HTML**, pour
> que le nouveau découpage et la convention soient **réellement appliqués**, pas seulement
> décrits. Repli possible : docs seulement (agents/skills dans un second temps).

1. **`methode-de-travail.md`** : remplacer le couple « 3 acteurs » + « jalons J0–J5 » par le
   récit **3 acteurs (concept) → team en 3 phases (cible staging) + squad prod**. Intégrer la
   présentation soignée (agents/périmètres/workflow/Odin) et la **section « Identité des
   agents »** (règle + table + rendus).
2. **`specs/equipe-agents.md`** : roster revu (Gimli dev+devops ; Helm = équipe prod) ; fiches
   mises à jour ; table des phases (couleur partagée) ; recoupement PDF ajusté.
3. **`agents/*.md`** : 
   - Gimli → ajouter le volet **devops jusqu'au staging**.
   - Helm → recentrer **équipe prod** (déploiement prod + surveillance + alertes + rollback).
   - **Tous** → ajouter dans le contrat la **règle d'auto-identification** : pastille **de la
     phase en cours** + `[ROYAUME][Agent]` (royaume en MAJUSCULE), uniquement sur parole adressée
     à Stéphane, **hors logs/réflexion**.
4. **`skills/iakaframe-*`** : rappel de la convention d'identité dans chaque skill concernée
   (a minima odin/aragorn/cadrage/qualite/deploiement).
5. **`methode-de-travail.html`** : régénérer (onglets) avec la vraie couleur d'identité ; relancer
   `iakaframe-build-methode-code.ps1` si l'onglet « Code » liste ces fichiers.
6. **(option)** profil PowerShell `iaka-say` documenté.

---

## 5. Critère de fin

- `methode-de-travail.md` présente la team en **3 phases (cible staging)** + **squad prod
  séparé**, une présentation claire agents/périmètres/workflow/Odin, et une section **Identité
  des agents** complète (règle + table + rendus + périmètre strict).
- `specs/equipe-agents.md` cohérent (Gimli dev+devops, Helm prod).
- `agents/*.md` portent le nouveau périmètre + la règle d'identité + leur pastille.
- `methode-de-travail.html` régénéré, identité en couleur réelle.
- Relecture Stéphane OK ; `update iakaframe` (commit + push), tag éventuel **v0.5.0**.

---

## 6. Pièges connus

- **`pwsh` absent** → lancer les scripts avec `powershell` ; les `.ps1` en **ASCII pur** (PS 5.1,
  pas de tirets cadratins ni d'emoji dans le code des scripts — les pastilles vont dans la
  **doc**, pas forcément dans le code PS).
- **`iakaframe-snapshot.ps1` reblanchit le récit de reprise** de l'état des lieux à chaque run :
  compléter après snapshot, avant de commiter.
- **Forgejo** (`192.168.2.11:3001`) parfois injoignable → push en attente, `update` retentera.
- **Cohérence** : ne pas laisser le doc parler de « J0–J5 » à un endroit et « 3 phases » à un
  autre — purger les anciennes mentions de jalons OU les présenter comme le détail des 3 phases.
- **Convention d'identité** : bien cantonner aux **paroles adressées à Stéphane** ; ne jamais
  préfixer logs/traces (sinon bruit).
