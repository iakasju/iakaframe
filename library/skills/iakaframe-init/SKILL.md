---
id: iakaframe-init
name: iakaframe-init
description: Amorce un projet avec la structure iakaframe complète — arborescence specs/, CLAUDE.md, les 8 personas d'agent (odin, aragorn, gandalf, gimli, legolas, helm, loki, nathalie), le cadrage du workflow et le script qualité. Utiliser cette skill quand l'utilisateur veut "démarrer un projet iakaframe", "mettre en place la méthode", "initialiser la structure", "déposer les contrats d'agent", "onboarder un dépôt", ou amorcer un nouveau projet (ou un projet existant) selon la méthode de l'équipe augmentée. À lancer une fois au début d'un projet.
subskills: [iakaframe-gestion-de-source, iakaframe-etat-des-lieux]
---

# iakaframe — Amorçage de projet

Cette skill dépose la structure de travail de la méthode iakaframe sur un projet, neuf ou
existant. Elle matérialise la séparation des rôles : la réflexion vit dans `specs/`, le
code dans `src/`, l'outillage dans `scripts/`.

## Voie canonique — déléguer au CLI (pas de scaffold recopié)

L'amorçage **délègue au CLI `iakaframe`**, qui fait déjà le bon travail et reste la **source de
vérité** (les personas vivent dans `library/personas/`, jamais recopiées en dur dans cette skill).
Deux verbes suffisent :

1. **Structure du projet** (arborescence `specs/`, `CLAUDE.md`, `scripts/`, remote du
   gestionnaire de source, premier état des lieux) :
   ```bash
   iakaframe onboard --path <projet> [--node claude|codex|ollama-localhost|ollama-lan]
   ```
2. **Déposer l'équipe des 8 personas** dans `<projet>/.claude/agents/` :
   ```bash
   iakaframe agents fullteam --project <projet>
   ```
   (Odin est le rôle **portefeuille** — il s'affecte au dossier chapeau, pas au projet :
   `iakaframe agents affect --agent odin --project <chapeau>`.)

## L'équipe déposée — les 8 personas

Le casting matérialisé est celui des **8 personas** actuelles (l'ancien roster numéroté est
abandonné) :

| Persona | Rôle |
|---|---|
| **odin** | CTO & super-agent portefeuille (transverse, au-dessus des équipes) |
| **aragorn** | coordinateur intra-équipe (répartit, séquence les phases) |
| **gandalf** | architecte-cadreur (P1 — écrit les instructions) |
| **gimli** | développeur + devops (P2 réalisation → P3 staging) |
| **legolas** | qualité / testeur (gate pass/fail + RQV à la version) |
| **helm** | squad prod (promotion stage → prod, sur feu vert humain) |
| **loki** | studio de design (supports on-brand, catalogue `design-*/`) |
| **nathalie** | guides utilisateurs & mémoire humaine AppFlowy |

## Procédure

1. **Détecter le contexte.** Projet neuf (dossier vide) ou existant (code déjà présent) ?
   - Neuf : `iakaframe onboard --path <projet>` dépose toute la structure.
   - Existant : `onboard` est **non destructif** — il pose `specs/`, `CLAUDE.md`, `scripts/`
     **sans écraser** `src/` ni le code en place, et garde un `origin` existant. Si `CLAUDE.md`
     existe déjà, **il prime** — compléter, ne pas écraser.
2. **Déposer l'équipe** : `iakaframe agents fullteam --project <projet>` (puis affecter `odin`
   au dossier chapeau si besoin).
3. **Adapter `scripts/quality-report.sh`** à la stack réelle (commandes lint/test/typage à
   décommenter selon le langage).
4. **Générer un premier état des lieux** : `iakaframe snapshot --reason reprise` (ou `version`).
5. **Confirmer à l'humain** ce qui a été déposé et ce qui reste à adapter.

## Garde-fous

- **Ne jamais écraser du code existant** dans `src/` ni un `CLAUDE.md` déjà présent sans
  confirmation explicite (le CLI `onboard` est non destructif par construction).
- Le script qualité est un **gabarit** : il faut l'adapter au projet avant de s'en servir
  comme gate.
- **Source de vérité unique** : les personas déposées viennent de `library/personas/` via le
  CLI — ne pas les dupliquer ni les figer dans cette skill (sinon dérive).

## Après l'amorçage — la suite

- Cadrer une tâche → agent **Gandalf** (P1) → `specs/instructions/<feature>.md`
- Développer → agent **Gimli** (P2/P3)
- Vérifier la qualité → agent **Legolas** (gate pass/fail)
- Déployer en prod → squad **Helm** (feu vert humain)
- Faire le point → `iakaframe snapshot` / `iakaframe recap`
