---
id: gtd-solo
name: Le praticien GTD (équipe d'une seule personne)
personas: [lee]
coordinator: lee
guardrails: []
vignetteTeam: none
---
# Le praticien GTD — « équipe » d'une seule personne

Assemblage de casting (ids de `library/personas/`) : **une seule** persona, **Lee**, castée sur
l'unique rôle `gtd-practitioner`. Le narratif de référence est *Getting Things Done* (David Allen).

> **Note — `personas: [lee]`, une team de cardinalité 1 : c'est ICI que le format frotte le plus.**
> Le format de `team` iakaframe présuppose **plusieurs** personas à périmètres étanches et **un
> coordinateur** qui les articule (Scrum : 3 ; iakaframe : 8). GTD étant **solo**, la seule
> modélisation honnête est une **team d'un**. Deux pistes avaient été envisagées :
>
> - **(a)** une team à **une persona** castée sur un rôle unique ;
> - **(b)** modéliser les **cinq étapes comme des « rôles »** (Collecteur, Clarificateur,
>   Organisateur, Réviseur, Exécutant) incarnés par la même personne — des **modes**, pas des
>   personnes.
>
> **Choix retenu : (b) dans la library, (a) dans la team.** Les cinq étapes existent bien comme
> **rôles** (`library/roles/*`, `scope: mode`) — pour rendre visible la structure fonctionnelle de
> GTD et alimenter le workflow — **mais aucune n'est castée** : la **team ne contient qu'une seule
> persona**, Lee, qui **porte les cinq modes**. On évite ainsi le piège de la **piste (a) pure**
> (un praticien opaque, la mécanique des 5 étapes invisible) **et** celui d'une **piste (b)
> trahie** (5 personas → l'illusion d'une équipe de 5 personnes). La library décrit les **modes** ;
> la team dit la **vérité du nombre** : **un**.
>
> **`coordinator: lee` — auto-coordination dégénérée.** Dans un frame d'équipe, le `coordinator`
> articule des acteurs **distincts** (Aragorn ordonne ; Gregan facilite). Ici, coordinateur **et**
> unique exécutant sont **la même personne** : il n'y a **personne à coordonner**. Le champ est
> rempli par **conformité de schéma**, mais sa sémantique — répartir le travail entre plusieurs —
> **s'effondre** à N = 1. Ce qui, chez un praticien, tient lieu de « coordination » n'est pas de la
> répartition mais de l'**auto-discipline** (les garde-fous) et de la **revue hebdomadaire** —
> le praticien s'articule **avec lui-même dans le temps**, pas avec des pairs dans l'espace.
>
> **Depuis la correction du modèle (lot agnostique, A-4).** `coordinator` n'est **plus un champ
> requis** : une team de cardinalité 1 est désormais **légitime sans coordinateur**. Ce descripteur
> **conserve** `coordinator: lee` (aucune des frames rangées n'est migrée), mais ce n'est plus une
> **conformité de schéma imposée** — c'est un choix. Une team solo peut désormais **l'omettre** et
> assembler sans orphelin dès lors que l'unique persona couvre le rôle. N = 1 n'est plus une équipe
> dégénérée : c'est un cas de **première classe**.
