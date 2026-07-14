---
id: portefeuille
level: portfolio
nonDestructive: true
entries:
  - { path: "BACKLOG.md", role: "backlog transverse tenu par le gestionnaire de portefeuille", createIfAbsent: true }
  - { path: "doc/", role: "pages doc portefeuille (contenants remontant README > PROJET.md)", createIfAbsent: true }
  - { path: ".claude/", role: "définitions mutualisées (agent portefeuille + skills)", createIfAbsent: true }
  - { path: ".env", role: "token Forgejo propagé (jamais commité)", createIfAbsent: false }
  - { path: "naonedge-dashboard/", role: "dashboard portefeuille (scan.ps1 -> data/projects.js)", createIfAbsent: false }
---
# Scaffold portefeuille

Échafaudage NON DESTRUCTIF du niveau portefeuille (racine des projets, ex. ~/work), extrait de
`methode-de-travail.md` § hiérarchie/portefeuille et de la mémoire portefeuille (I5). Le seul
agent affecté à ce niveau est le gestionnaire de portefeuille ; les équipes vivent dans
`<projet>/.claude/`.
