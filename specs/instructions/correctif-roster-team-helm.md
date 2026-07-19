# Instruction — Correctif de données : cohérence roster `team` ⟷ `binding` (helm)

> Cadrée par **Gandalf** (P1 — Cadrage). **Décision d'arbitrage** + vérification du live. Réalisation
> dans le frame = déléguée à `specs/instructions/resync-stefframe2-miroir-live.md` (étanchéité : une
> seule instruction édite le fichier team du frame). Réf. : `teams/iakaframe-8.md`,
> `bindings/iakaframe-claude-default.md`, `library/personas/helm.md`, `methods/iakaframe.md`,
> `library/rituals/iakastart.md`, `~/.claude/CLAUDE.md` (roster 8 agents).

---

## 1. Besoin (reformulé)

Legolas a signalé une **incohérence de casting** : la team `iakaframe-8` listerait **7** personas
(helm absent) alors que le binding en assigne **8** (helm inclus) et que helm est dans le pool. Le
décideur a demandé de **trancher** (helm **dans** le roster, ou **hors** ?) et de **cadrer un
correctif de données**.

---

## 2. Faits vérifiés (lecture réelle, live ET frame) — le bug est **frame-only**

| Fichier | Roster / assignations | Compte | helm ? |
|---|---|---|---|
| **LIVE** `teams/iakaframe-8.md:4` | `[odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie]` | **8** | **présent** |
| **LIVE** `bindings/iakaframe-claude-default.md:7-15` | 8 assignations (dont `helm`) | **8** | **présent** |
| **FRAME** `frames/releases/StefFrame2/teams/iakaframe-8.md:4` | `[odin, aragorn, gandalf, gimli, legolas, loki, nathalie]` | **7** | **ABSENT** |
| **FRAME** `frames/releases/StefFrame2/bindings/iakaframe-claude-default.md:7-15` | 8 assignations (dont `helm`) | **8** | **présent** |

**Conclusion factuelle** : le **live est déjà cohérent** (team 8 ⟷ binding 8, helm des deux côtés).
Le **seul défaut** est dans le **frame** : sa team est **stale à 7** (helm manquant), incohérente avec
son propre binding (8). *(Note : l'`audit-frame.md` A2.1 décrivait le live à 7 — il était **périmé** ;
le live a été corrigé depuis. Vérifié par lecture directe ce jour.)*

Éléments corroborants (tous côté 8) : `library/personas/helm.md` existe (roleKey `deploiement`) ;
`methods/iakaframe.md:11` inclut le roleKey `deploiement` (couvert par helm) ; `~/.claude/CLAUDE.md`
annonce **8 agents dont helm** ; le rituel `iakastart` affiche un roster de **8**.

---

## 3. Décision d'arbitrage : **helm DANS le roster (option A)** — tranché, justifié

**Retenu : A — helm fait partie du roster `iakaframe-8` (8 personas).**

Justification :
- **Cohérence système** : le nom `iakaframe-8`, le binding (8), le roster `iakastart` (8) et le
  `CLAUDE.md` global (8 dont helm) **imposent 8**. Retirer helm casserait le nom et le binding.
- **Couverture de la méthode** : `methods/iakaframe.md` déclare le roleKey `deploiement` ; sans helm
  dans le casting, ce rôle est **non couvert** (« 7/8 rôles »).
- **Le « squad prod séparé » ne motive pas l'exclusion.** La règle méthode « helm = squad prod, équipe
  séparée des 3 phases de dev » décrit sa place dans le **workflow** (`iakaframe-3phases` : il n'est pas
  dans la chaîne P1→P2→P3, il intervient en aval prod). Mais le **roster `team`** est le **casting de la
  compagnie entière**, pas la seule chaîne de dev. La séparation de phase vit dans le **workflow**, pas
  dans le retranchement du casting. Donc helm **reste** au roster.
- **Coût nul** : le live l'a déjà ; c'est l'état cible naturel.

Option B (retirer helm du binding + renommer la team en `iakaframe-7`) est **rejetée** : elle
dégraderait la cohérence, contredirait `iakastart`/`CLAUDE.md`/le binding, et laisserait `deploiement`
non casté.

---

## 4. Réalisation (où corriger)

- **LIVE** : **aucune action** — déjà cohérent (§2). Ne rien éditer.
- **FRAME** : la team `frames/releases/StefFrame2/teams/iakaframe-8.md` passe de **7 → 8** (ajout de
  `helm`, ordre identique au live), **en conservant sa forme anonymisée** (le frame dit « ids de
  `personas/` » et n'a pas « Forgé par iakaFrameGUI » — ne pas ré-injecter). Cette édition est
  **réalisée par** `resync-stefframe2-miroir-live.md` §4.3 étape 5 — **une seule instruction touche ce
  fichier** (étanchéité, pas de double édition).

> Rôle de cette instruction : **fixer la décision** (option A) et **cadrer l'invariant testable**.
> L'exécutant du correctif de données frame est **Gimli**, via l'instruction de re-synchro.

---

## 5. Critères d'acceptation (pass/fail, testables)

1. **Live** (déjà vrai — vérification de non-régression) : `teams/iakaframe-8.md` `personas` **= 8**,
   **ensemble identique** aux `personaId` du binding `bindings/iakaframe-claude-default.md` (8).
2. **Frame** (après re-synchro) : `frames/releases/StefFrame2/teams/iakaframe-8.md` `personas` **= 8**,
   **ensemble ET ordre identiques** au binding du frame (8, helm inclus).
3. **Invariant roster ⟷ binding** (les deux dépôts) : `set(team.personas) == set(binding.personaId)`.
4. **Compte = nom** : la team `iakaframe-8` compte **8** personas (le nom ne ment plus).
5. **Couverture de rôle** : le roleKey `deploiement` de `methods/iakaframe.md` est couvert par un
   persona du roster (helm) — **0 rôle non casté**.
6. **Anonymisation préservée** : l'édition du frame ne réintroduit aucun token (`iakaFrameGUI`, etc.) —
   couvert par le gate §6-A de `resync-stefframe2-miroir-live.md`.

---

## 6. Points ouverts (à trancher au gate — HORS scope de cet arbitrage)

1. **Odin dans le roster** (audit A1.1) : `odin` est **transverse / niveau portefeuille** (« jamais
   scopé à un projet ») mais figure dans le roster (les « 8 » = odin + 7). Faut-il l'en **sortir**
   (roster = équipe projet) au risque de casser le nom `iakaframe-8` ? **Non traité ici** (l'ordre du
   décideur porte sur helm). → **Question distincte** à cadrer séparément si souhaité ; elle
   toucherait le **live** (arbitrage d'architecture, réservé au décideur).
2. Confirmer que **rien d'autre** ne fige « 7 » ailleurs (rituel/roster affiché) — vérifié à 8 ce jour,
   à re-confirmer si le décideur veut un audit exhaustif.

---

## 7. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Décision `correctif-roster-team-helm.md` : **helm reste au roster (option A)**, live déjà cohérent, seul le frame était stale (7→8, réalisé via la re-synchro) ; invariant `team ⟷ binding` testable | 🟢 Le décideur (Stéphane) → ratifie la décision → réalisation par `resync-stefframe2-miroir-live.md` |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Live cohérent : `teams/iakaframe-8.md:4` (8, helm) ; `bindings/iakaframe-claude-default.md:13` (helm).
- Frame stale : `frames/releases/StefFrame2/teams/iakaframe-8.md:4` (7, helm absent) ;
  `frames/releases/StefFrame2/bindings/iakaframe-claude-default.md:13` (helm présent → incohérence interne).
- Couverture rôle : `methods/iakaframe.md:11` (roleKey `deploiement`) ; `library/personas/helm.md:1`.

---

## Statut

**PROPOSÉ — en attente de ratification décideur.** Décision : **option A (helm au roster)**. Live sans
action (déjà cohérent). Correctif de données frame **délégué** à `resync-stefframe2-miroir-live.md`
(une seule instruction édite le fichier team du frame — étanchéité). Point ouvert « Odin dans le
roster » **hors scope**, réservé au décideur.
