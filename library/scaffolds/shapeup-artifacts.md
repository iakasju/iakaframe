---
id: shapeup-artifacts
level: product
nonDestructive: true
entries:
  - { path: "pitches/", role: "pitchs façonnées (options à parier) — le produit du shaping, hors calendrier", createIfAbsent: true }
  - { path: "pitches/<name>.md", role: "une pitch : problème, appétit, solution esquissée (breadboard / fat-marker), rabbit holes, no-gos", createIfAbsent: true }
  - { path: "bets/", role: "les paris placés, un fichier par cycle (décision de la Betting Table)", createIfAbsent: true }
  - { path: "bets/cycle-<n>.md", role: "les paris du cycle n : quoi + appétit + équipe (ce sur quoi on a misé)", createIfAbsent: true }
  - { path: "cycles/", role: "un dossier par cycle de 6 semaines (conteneur du build)", createIfAbsent: true }
  - { path: "cycles/<n>/hill-charts/", role: "relevés du hill chart : position des scopes (montée = inconnu, descente = connu)", createIfAbsent: true }
  - { path: "cycles/<n>/scopes.md", role: "la carte des scopes du cycle (tranches verticales) + tri must-have / nice-to-have / could-have", createIfAbsent: true }
  - { path: "cool-down/", role: "notes de cool-down : bugs corrigés, explorations, préparation du façonnage / des paris suivants", createIfAbsent: true }
---
# Scaffold artefacts Shape Up

Échafaudage **NON DESTRUCTIF** des artefacts de Shape Up (*Shape Up*, Ryan Singer, Basecamp, 2019). On
crée ce qui manque, on n'écrase rien. Le narratif de référence est le livre *Shape Up*.

| Artefact | Rôle |
|---|---|
| **`pitches/`** | les **options façonnées** — problème, appétit, solution esquissée, rabbit holes, no-gos |
| **`bets/`** | les **paris placés** par la Betting Table, un par cycle (ce sur quoi on a misé) |
| **`cycles/<n>/`** | le **build** d'un cycle : carte des **scopes** + relevés du **hill chart** |
| **`cool-down/`** | la **respiration** de 2 semaines et la préparation du cycle suivant |

## L'absence délibérée : pas de `backlog/`
> Ce scaffold **n'a volontairement aucun dossier `backlog/`** (§ `no-backlog` / `no-backlog-accumulation`).
> C'est un **choix de conception fidèle à Shape Up**, pas un oubli : matérialiser un backlog inviterait
> à l'**accumulation** que le frame refuse. Les pitchs non pariées **ne sont pas archivées** pour
> « plus tard » ; si une idée compte, elle **revient** et est **re-façonnée** dans `pitches/`. Le
> scaffold rend ainsi visible, par ce qu'il **ne crée pas**, une conviction centrale du frame.
