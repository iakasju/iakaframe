# Etat des lieux - iakaframe

> Genere par iakaframe-snapshot.ps1 le 2026-06-14 16:40 (motif: pause).
> A regenerer a chaque changement de version et a chaque pause/reprise.

## Etat courant

| Champ | Valeur |
|---|---|
| Version | - |
| Branche | main |
| Dernier commit | e244d86 feat(iakaframe): Aragorn dispatch a la demande + canal Slack via n8n |
| Arbre | MODIFICATIONS NON COMMITEES |
| Fichiers (hors .git/node_modules) | 56 |
| Note | pause: equipe d agents (Odin -> Aragorn -> 8 agents) livree + doc impactee. Reprendre par push Forgejo puis cadrage voix-Slack-Piper |

## Commits recents

| Hash | Date | Sujet |
|---|---|---|
| `e244d86` | 2026-06-14 | feat(iakaframe): Aragorn dispatch a la demande + canal Slack via n8n |
| `c120828` | 2026-06-14 | fix(iakaframe): update verifie le code de sortie de git push |
| `bde68ec` | 2026-06-14 | chore(iakaframe): update etat des lieux + commit global (version v0.4.0) |
| `5191289` | 2026-06-11 | chore(iakaframe): update etat des lieux + commit global (version v0.3.0) |
| `be3bf1b` | 2026-06-11 | chore(iakaframe): update etat des lieux + commit global (version v0.2.0) |
| `43b25c0` | 2026-06-11 | chore(iakaframe): update etat des lieux + commit global (manual) |
| `5028d0c` | 2026-06-11 | chore(iakaframe): update etat des lieux + commit global (version v0.1.0) |
| `91a195f` | 2026-06-11 | docs: etat des lieux initial (iakaframe-snapshot v0.1.0) |
| `3827dd6` | 2026-06-11 | chore: init iakaframe (methode, kit, scripts, doc iakabox) |

## Reprise du travail (a completer par Cowork)

- **Ce qui vient d'etre fait** (session du 14/06) : definition complete de l'**equipe
  d'agents** (vision « Yakaframe Avance »). (1) **8 agents** incarnes : 🦅 Odin (super-agent
  **portefeuille**, seul affecte a `C:\work`), 🛡️ Aragorn (coordination + jalons + dispatch a
  la demande + canal **Slack** via n8n), 🧙 Gandalf (cadrage), ⚒️ Gimli (dev), 🏹 Legolas
  (qualite), 🌉 Helm (prod + surveillance fusionnee), 🎭 Loki (design, catalogue de chartes),
  📖 Nathalie (guides). (2) **Definitions** : `agents/*.md` (subagents) + `agents/_TEMPLATE.md`
  ; skills creees `iakaframe-odin/-aragorn/-nathalie`, `-deploiement` etendue surveillance,
  `-naonedge` elargie au catalogue. (3) **Commande** `iakaframe-agents.ps1`
  (list/create/affect/fullteam/status, -Global) ; Odin affecte a `C:\work\.claude\`. (4)
  **Doc impactee** : `specs/equipe-agents.md` (reference), `methode-de-travail.md`,
  `methode-de-travail.html` (passe en **onglets** + onglet Equipe + onglet **Code** avec les 21
  fichiers et boutons download, genere par `iakaframe-build-methode-code.ps1`),
  `iakaframe-methode.html`, `iakaframe-skills.html`, `skills/README.md`, `README.md`. (5)
  **Decisions** : etancheite (image mutualisee / conteneur etanche) ; incarnation subagents +
  skills ; vocal = chemin **Slack** (clips -> Whisper/n8n) + TTS **Piper**. (6) Bug
  `iakaframe-update.ps1` (reporting push) corrige. **Slack installe** sur le PC.
- **En cours / a reprendre** : modifications **non commitees** (cf. arbre sale) ; commits
  locaux **non pousses** (Forgejo injoignable au moment de la pause).
- **Prochaine etape concrete** : (1) **`git push origin main`** des qu'iakabox est joignable
  (rallumer / etre sur le LAN) ; sinon `update iakaframe` retentera. (2) **Cadrer (Gandalf)
  l'instruction « voix via Slack »** : workflow n8n sortant (Whisper -> agent) + entrant
  (Slack -> chaine) + TTS Piper. (3) Optionnel : tagguer la version **v0.5.0** (jalon equipe
  d'agents) au prochain update.
- **Pieges connus** : `pwsh` **n'est pas installe** sur ce poste -> lancer les scripts avec
  `powershell` (les .ps1 sont en **ASCII pur** a cause de PS 5.1 ; pas de tirets cadratins).
  Forgejo (`192.168.2.11:3001`) etait **injoignable** -> push en attente (`ahead`).
  `iakaframe-snapshot.ps1` **reblanchit le recit ci-dessus** a chaque run : le completer apres
  chaque snapshot, avant de commiter.

## Journal (versions & pauses)

| Date | Motif | Version | Branche | Note |
|---|---|---|---|---|
| 2026-06-14 16:40 | pause | - | main | pause: equipe d agents (Odin -> Aragorn -> 8 agents) livree + doc impactee. Reprendre par push Forgejo puis cadrage voix-Slack-Piper |
| 2026-06-14 15:14 | version | v0.4.0 | main | equipe d agents (7 subagents + skills) + commande iakaframe-agents + HTML methode v3 + rangement skills/PDF + fix journal |
| 2026-06-14 14:30 | reprise | - | main | rangement skills (9 dossiers) + PDF dans docs + fix journal System.Object |
| 2026-06-14 02:16 | reprise | - | main |  |
| 2026-06-11 23:41 | version | v0.3.0 | main | doc HTML impactee : commandes init/update, Forgejo, cycle de doc, auto-detection |
| 2026-06-11 23:39 | version | v0.2.0 | main | init/update auto-detectent l'existence sur Forgejo |

