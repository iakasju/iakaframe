---
id: waterfall-artifacts
level: project
nonDestructive: true
entries:
  - { path: "requirements/", role: "phase 1 — livrables des exigences", createIfAbsent: true }
  - { path: "requirements/SRS.md", role: "Software Requirements Specification — exigences figées, non ambiguës, tracées (baseline gelée après SRR)", createIfAbsent: true }
  - { path: "design/", role: "phase 2 — livrables de conception", createIfAbsent: true }
  - { path: "design/SDD.md", role: "Software Design Document — architecture, composants, interfaces, données (baseline gelée après CDR)", createIfAbsent: true }
  - { path: "src/", role: "phase 3 — code construit selon le SDD (chaque module trace vers un élément de conception)", createIfAbsent: true }
  - { path: "verification/", role: "phase 4 — livrables de vérification", createIfAbsent: true }
  - { path: "verification/TEST-PLAN.md", role: "plan de test dérivé du SRS (cas de test par exigence)", createIfAbsent: true }
  - { path: "verification/TEST-REPORT.md", role: "rapport de vérification + résultats + anomalies", createIfAbsent: true }
  - { path: "TRACEABILITY-MATRIX.md", role: "matrice exigence → conception → code → test (tenue en continu, complète au gate)", createIfAbsent: true }
  - { path: "governance/PROJECT-PLAN.md", role: "plan directeur + échéancier + critères d'entrée/sortie de phase (Project Manager)", createIfAbsent: true }
  - { path: "governance/PHASE-GATES.md", role: "journal des signatures d'acceptation de gate (jalons documentaires datés)", createIfAbsent: true }
  - { path: "governance/CHANGE-REQUESTS/", role: "demandes de changement + analyses d'impact (change control après gel)", createIfAbsent: true }
---
# Scaffold artefacts Waterfall

Échafaudage **NON DESTRUCTIF** des livrables documentaires du cycle en cascade — un dossier par
phase + les artefacts de gouvernance transverses. On crée ce qui manque, on n'écrase rien. Le
narratif de référence est le modèle en cascade.

Chaque phase porte un **livrable documentaire baseliné** qui devient le **contrat d'entrée** de la
suivante (principe `documentation-exhaustive`) :

| Phase | Livrable | Baseline gelée au gate |
|---|---|---|
| **Requirements** | `SRS.md` | SRR (revue des exigences) |
| **Design** | `SDD.md` | CDR (revue de conception) |
| **Implementation** | `src/` + tests unitaires | TRR (aptitude aux tests) |
| **Verification** | `TEST-REPORT.md` + matrice couverte | Signature d'acceptation |

La **matrice de traçabilité** (transverse) relie l'intention initiale à la preuve finale ; la
**gouvernance** (plan, journal des gates, change requests) matérialise l'autorité séquentielle du
Project Manager. Ces artefacts maximisent l'**opposabilité** : chaque décision de gate est datée,
signée et gelée.
