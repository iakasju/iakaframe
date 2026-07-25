---
id: gtd-lists
level: personal
nonDestructive: true
entries:
  - { path: "inbox/", role: "points de collecte — capture brute en attente de clarification (Capture)", createIfAbsent: true }
  - { path: "next-actions/", role: "prochaines actions rangées par contexte (Organize)", createIfAbsent: true }
  - { path: "next-actions/@calls.md", role: "actions à faire au téléphone", createIfAbsent: true }
  - { path: "next-actions/@computer.md", role: "actions à faire devant l'ordinateur", createIfAbsent: true }
  - { path: "next-actions/@errands.md", role: "actions à faire en déplacement / courses", createIfAbsent: true }
  - { path: "next-actions/@home.md", role: "actions à faire à la maison", createIfAbsent: true }
  - { path: "next-actions/@office.md", role: "actions à faire au bureau", createIfAbsent: true }
  - { path: "next-actions/@agendas.md", role: "points à évoquer avec une personne précise", createIfAbsent: true }
  - { path: "projects/", role: "un fichier par projet — issue souhaitée + prochaine action (Organize)", createIfAbsent: true }
  - { path: "PROJECTS.md", role: "liste maîtresse des projets actifs (revue à la weekly review)", createIfAbsent: true }
  - { path: "calendar.md", role: "hard landscape — engagements datés/à heure fixe uniquement", createIfAbsent: true }
  - { path: "waiting-for.md", role: "délégué / en attente d'un tiers", createIfAbsent: true }
  - { path: "someday-maybe.md", role: "un jour / peut-être — non engagé, revu à la weekly review", createIfAbsent: true }
  - { path: "reference/", role: "matériel de référence non actionnable mais utile", createIfAbsent: true }
---
# Scaffold listes GTD

Échafaudage **NON DESTRUCTIF** du **système de confiance** GTD (*Getting Things Done*, David Allen).
On crée ce qui manque, on n'écrase rien. Le narratif de référence est le livre. `level: personal`
(un système **par personne** — GTD est solo).

Le système matérialise les sorties du flux (`workflows/gtd-flow`) dans des contenants distincts, de
sorte que **le bon élément soit retrouvable au bon moment** :

| Contenant | Rôle | Étape |
|---|---|---|
| `inbox/` | capture brute non clarifiée | Capture |
| `next-actions/@*` | prochaines actions **par contexte** | Organize |
| `projects/` + `PROJECTS.md` | projets (issue + prochaine action) | Organize / Reflect |
| `calendar.md` | *hard landscape* daté | Organize |
| `waiting-for.md` | délégué / en attente | Organize |
| `someday-maybe.md` | non engagé | Organize / Reflect |
| `reference/` | référence non actionnable | Organize |

La séparation stricte **inbox (à clarifier)** ↔ **listes (déjà clarifiées)** matérialise le garde-
fou `no-unclarified-stuff` et rend le système **digne de confiance** (`trusted-system`).
