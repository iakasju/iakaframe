# État des lieux — iakaframe — 2026-07-05

> Régénéré le 2026-07-05 (reprise de session). À régénérer à chaque changement de version
> et à chaque pause/reprise. `specs/etat-des-lieux.html` à régénérer via le script (box Windows).

## État courant

| Champ | Valeur |
|---|---|
| Version méthode | v0.6.1 (dernier tag) |
| Artefact doc chapeau | v0.4.0 (versionnement propre à l'artefact — chantier « versionner ») |
| Branche | main |
| Dernier commit | `8743ef8` feat(doc): chapeau iakaframe v0.4.0 |
| Arbre | propre, synchro avec origin/main |

## En une phrase

La méthode iakaframe (v0.6.1) est stable ; la session du 2026-07-05 a livré la **montée en
expertise de la rédactrice de doc** puis une **doc chapeau HTML** de la méthode (idée, douleur,
méthode, agnosticisme, rôles/personas, outils), itérée de v0.1.0 à v0.4.0 et poussée sur Forgejo.

## Fait récemment

- **Expertise doc-writer** (`79b250b`) : contrat `agents/nathalie.md` élargi (web + discipline de
  sourcing `chemin:ligne`), skill refondue (structuration maison 4 besoins Se lancer / Faire /
  Consulter / Comprendre), `specs/glossaire-iakaframe.md` créé (8 rôles, libellé canonique). Gate PASS 8/8.
- **Doc chapeau `iakaframe-chapeau.html`** (charte Cinabre pointée en relatif vers `iakacharte`) :
  - v0.1.0 (`9a713d7`) : structure initiale.
  - v0.2.0 (`169cfd4`) : graphe de délégations, jalons, arbre réel des répertoires, emboîtement.
  - v0.4.0 (`8743ef8`) : agnosticisme des fichiers d'instructions (`CLAUDE.md`→« fichier
    d'instructions », `AGENTS.md` = implémentation), **kits par solution**, **runners hétérogènes**,
    bascule terminologique **agent→persona**, thèse **« discipline, pas technologie »**. Gate PASS.
  - Graphe de délégations repris du concept « Arbre & agents » d'IakaCockpit.

## En cours

- Rien d'actif. La doc chapeau est figée en v0.4.0 et poussée.

## Jalons (gates)

| Jalon | Statut |
|---|---|
| Instruction cadrée | oui (`nathalie-expertise-upgrade.md`) |
| Gate qualité (doc) | oui — PASS (expertise 8/8 ; chapeau v0.2/v0.4) |
| Recette stage | n/a (livrable documentaire) |
| Feu vert prod | n/a |

## Prochaine étape

Au choix du décideur, parmi le backlog ci-dessous — aucune tâche n'est engagée. Recommandation
du coordinateur : **aligner la méthode source** sur ce que la doc chapeau a fait mûrir (équipe
d'experts sans « 3 acteurs », deux niveaux de coordination, personas), car la doc est en avance
sur `methode-de-travail.md` / `CLAUDE.md`.

## Points d'attention

- **Divergence doc ↔ méthode canonique** : la doc parle d'« équipe d'experts » / « personas » /
  2 coordinations ; `CLAUDE.md` global et `methode-de-travail.md` disent encore « trois acteurs ».
  À arbitrer : aligner la méthode source (chantier).
- **Skills nommées par outil** : `iakaframe-forgejo`→commit, `-appflowy-doc`→mémoire-humaine,
  `-naonedge`→design. Renommage par geste = backlog (agnosticisme du nommage).
- **Versionnement méthodes/agents/skills** : chantier ouvert. Les skills ont une source dans le
  dépôt (`skills/`) et une copie active hors dépôt (`~/.claude/`) ; schéma de version à décider.
  La doc chapeau v0.4.0 est le premier artefact estampillé.
- **Micro-arbitrages doc non tranchés** : garder ou neutraliser « Arbre & agents » (nom du concept
  Cockpit) et « subagent » (ancrage Claude Code).
- **`etat-des-lieux.html`** : non régénéré (script `.ps1` non exécutable sur Mac, pwsh absent) —
  à refaire via `iakaframe-snapshot.ps1` sur la box Windows, ou à produire à la main si besoin.

## Journal de reprise

Append-only : une ligne datée à chaque reprise. Ne jamais effacer les anciennes.

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-07-05 | reprise+doc | v0.6.1 / chapeau v0.4.0 | main | Expertise rédactrice (web+sourcing, structuration 4 besoins, glossaire rôles) ; doc chapeau HTML Cinabre v0.1→v0.4 (agnosticisme, kits par solution, runners hétérogènes, personas, discipline pas techno) ; 3 commits poussés ; gates PASS |
| 2026-06-23 10:00 | version | v0.6.1 | main | rituel identite 3.4-3.9: position pastille, chaine sans interjection, verbatim anti-ventriloquie, transverse orange, propagation kits codex/ollama, kit-claude versionne + globaux |
| 2026-06-22 23:57 | manual | v0.6.1 | main |  |
| 2026-06-22 23:53 | version | v0.6.1 | main | rituel identite agents : auto-annonce durcie (premiere ligne de toute reponse) + restitution en relais sous le badge de l emetteur |
| 2026-06-22 18:16 | pause | v0.6.1 | main |  |
