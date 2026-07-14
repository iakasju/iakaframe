---
id: iakaframe-init
name: iakaframe-init
description: Amorce un projet avec la structure iakaframe complète — arborescence specs/, CLAUDE.md, les sept contrats d'agent, le cadrage du workflow et le script qualité. Utiliser cette skill quand l'utilisateur veut "démarrer un projet iakaframe", "mettre en place la méthode", "initialiser la structure", "déposer les contrats d'agent", "onboarder un dépôt", ou amorcer un nouveau projet (ou un projet existant) selon la méthode de l'équipe augmentée. À lancer une fois au début d'un projet.
---

# iakaframe — Amorçage de projet

Cette skill dépose la structure de travail de la méthode iakaframe sur un projet, neuf ou
existant. Elle matérialise la séparation des rôles : la réflexion vit dans `specs/`, le
code dans `src/`, l'outillage dans `scripts/`.

## Ce que la skill installe

Les fichiers sont bundlés dans `assets/`. Copie-les vers le projet en préservant
l'arborescence :

```
specs/
├── instructions/
│   ├── _AGENT_TEMPLATE.md        # gabarit pour composer un agent
│   ├── _workflow.md              # cadrage des interactions (orchestration)
│   ├── _arborescence.md          # carte de la structure
│   ├── _univers-hermes.md        # mise en place avant-gardiste (Hermes)
│   ├── agent-orchestrateur.md    # chef d'orchestre (transverse)
│   ├── agent-0-cadrage.md        # architecte-analyste
│   ├── agent-1-dev.md            # exécutant-codeur
│   ├── agent-2-test.md           # vérificateur
│   ├── agent-3-integration.md    # intégrateur
│   ├── agent-4-deploiement.md    # opérateur
│   └── agent-5-surveillance.md   # vigie
├── mock/                         # (à créer) données figées pour dev/test
CLAUDE.md                         # contrat de travail de l'agent de dev
scripts/quality-report.sh         # gate qualité (à adapter à la stack)
src/                              # (à créer) code de production
```

## Procédure

1. **Détecter le contexte.** Projet neuf (dossier vide) ou existant (code déjà présent) ?
   - Neuf : déposer toute la structure.
   - Existant : déposer `specs/`, `CLAUDE.md`, `scripts/` **sans écraser** `src/` ni le
     code en place. Si `CLAUDE.md` existe déjà, proposer une fusion plutôt qu'un écrasement.
2. **Copier les assets** vers la racine du projet :
   ```bash
   mkdir -p specs/instructions specs/mock scripts src
   cp assets/instructions/*.md specs/instructions/
   cp assets/CLAUDE.md ./CLAUDE.md
   cp assets/quality-report.sh scripts/quality-report.sh
   chmod +x scripts/quality-report.sh
   ```
3. **Adapter `scripts/quality-report.sh`** à la stack réelle (les commandes lint/test/
   typage sont en commentaires à décommenter selon le langage).
4. **Générer un premier état des lieux** (voir la skill `iakaframe-etat-des-lieux`).
5. **Confirmer à l'humain** ce qui a été déposé et ce qui reste à adapter.

## Garde-fous

- **Ne jamais écraser du code existant** dans `src/` ni un `CLAUDE.md` déjà présent sans
  confirmation explicite.
- Le script qualité est un **gabarit** : il faut l'adapter au projet avant de s'en servir
  comme gate.
- Après l'amorçage, le cycle peut démarrer : première instruction via la skill
  `iakaframe-cadrage`.

## Après l'amorçage — la suite

- Cadrer une tâche → skill `iakaframe-cadrage`
- Vérifier la qualité → skill `iakaframe-qualite`
- Déployer → skill `iakaframe-deploiement`
- Faire le point → skill `iakaframe-etat-des-lieux`
