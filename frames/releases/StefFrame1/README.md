# StefFrame1 — La méthode iakaframe, portable

> **La méthode iakaframe, portable, sans le GUI.** Un instantané ordonné de la MÉTHODE +
> des KITS + de l'INSTALL, décomposé en un fichier `.md` par élément, ventilé selon la
> taxonomie iakaframe (`library/` → pools d'atomes, puis couche d'assemblage, puis kits
> d'install). Tout le spécifique-machine a été **déparamétré** : les valeurs propres à une
> infra apparaissent sous forme de **placeholders `<...>`** à renseigner.

---

## 1. Ce que contient ce frame

Un frame = un **assemblage figé** de la méthode, lisible du **plus élémentaire au plus
composé** :

1. **Le canon narratif** — `methode-de-travail.md` (la discipline racontée, agnostique du
   stack).
2. **Les atomes `library/`** — les briques réutilisables, une par fichier.
3. **La couche d'assemblage** — `methods/` + `teams/` + `bindings/` (des ids qui référencent
   les atomes ; aucun corps recopié).
4. **Les kits d'install** — un sous-dossier `kits/` par runner (5), tous déparamétrés.

---

## 2. Ventilation (pool → rôle)

| Pool | Rôle dans la méthode | Compte |
|---|---|---|
| `principles/` | Convictions permanentes (le « toujours / jamais ») | 14 |
| `rituals/` | Gestes récurrents (amorçage, snapshot, update, log, bootstrap) | 5 |
| `guardrails/` | Garde-fous transverses (identité, périmètre, délégation) | 3 |
| `roles/` | Périmètres de rôle (ce que fait / ne fait pas chaque casquette) | 8 |
| `personas/` | Incarnations des rôles (nom + voix) + `_TEMPLATE` | 8 + 1 |
| `scaffolds/` | Squelettes d'arborescence (projet, portefeuille) | 2 |
| `workflows/` | Enchaînement de phases | 1 |
| `skills/` | Savoir-faire exécutables (1 dossier + `SKILL.md` par skill) | 16 |
| `methods/` | Assemblage de **discipline** (ids d'atomes) | 1 |
| `teams/` | Assemblage de **casting** (ids de personas) | 1 |
| `bindings/` | Appariement méthode ↔ team ↔ runner/modèle | 1 |
| `kits/` | Kits d'install par runner (claude, codex, ollama, openwebui, anythingllm) | 5 |

---

## 3. Sommaire (liens relatifs)

- **Canon** : [`methode-de-travail.md`](./methode-de-travail.md)

**Atomes**
- `principles/` : [cadrage-avant-code](./principles/cadrage-avant-code.md) ·
  [commits-versionnement](./principles/commits-versionnement.md) ·
  [confirmation-actes-destructifs](./principles/confirmation-actes-destructifs.md) ·
  [documentation](./principles/documentation.md) ·
  [gestion-backlog](./principles/gestion-backlog.md) ·
  [identite-badges](./principles/identite-badges.md) ·
  [isolation-docker](./principles/isolation-docker.md) ·
  [langue](./principles/langue.md) ·
  [mock-en-dev](./principles/mock-en-dev.md) ·
  [mvp-first](./principles/mvp-first.md) ·
  [perimetres-etanches](./principles/perimetres-etanches.md) ·
  [qualite](./principles/qualite.md) ·
  [reutilisation-existant](./principles/reutilisation-existant.md) ·
  [self-hosted-first](./principles/self-hosted-first.md)
- `rituals/` : [iakastart](./rituals/iakastart.md) · [init](./rituals/init.md) ·
  [log-conversation](./rituals/log-conversation.md) · [snapshot](./rituals/snapshot.md) ·
  [update](./rituals/update.md)
- `guardrails/` : [delegation](./guardrails/delegation.md) ·
  [identity](./guardrails/identity.md) · [perimeter](./guardrails/perimeter.md)
- `roles/` : [cadrage](./roles/cadrage.md) · [coordination](./roles/coordination.md) ·
  [deploiement](./roles/deploiement.md) · [design](./roles/design.md) · [dev](./roles/dev.md) ·
  [documentation](./roles/documentation.md) · [portefeuille](./roles/portefeuille.md) ·
  [qualite](./roles/qualite.md)
- `personas/` : [odin](./personas/odin.md) · [aragorn](./personas/aragorn.md) ·
  [gandalf](./personas/gandalf.md) · [gimli](./personas/gimli.md) ·
  [legolas](./personas/legolas.md) · [helm](./personas/helm.md) · [loki](./personas/loki.md) ·
  [nathalie](./personas/nathalie.md) · [_TEMPLATE](./personas/_TEMPLATE.md)
- `scaffolds/` : [projet](./scaffolds/projet.md) · [portefeuille](./scaffolds/portefeuille.md)
- `workflows/` : [iakaframe-3phases](./workflows/iakaframe-3phases.md)
- `skills/` : [index](./skills/README.md) — 16 dossiers `iakaframe-*/SKILL.md`
  (dont `iakastart/`).

**Assemblage**
- `methods/` : [iakaframe](./methods/iakaframe.md)
- `teams/` : [iakaframe-8](./teams/iakaframe-8.md)
- `bindings/` : [iakaframe-claude-default](./bindings/iakaframe-claude-default.md)

**Kits d'install** (manifeste `.md` + dossier)
- [iakaframe-claude](./kits/iakaframe-claude/) — [manifeste](./kits/iakaframe-claude.md)
  (gabarit projet + `global/` + runtime `.claude/` : agents, skills, commandes, hooks)
- [iakaframe-codex](./kits/iakaframe-codex/) — [manifeste](./kits/iakaframe-codex.md)
- [iakaframe-ollama](./kits/iakaframe-ollama/) — [manifeste](./kits/iakaframe-ollama.md)
- [iakaframe-openwebui](./kits/iakaframe-openwebui/) — [manifeste](./kits/iakaframe-openwebui.md)
- [iakaframe-anythingllm](./kits/iakaframe-anythingllm/) — [manifeste](./kits/iakaframe-anythingllm.md)

---

## 4. Quickstart install (Claude Code)

Le kit `kits/iakaframe-claude/` s'installe tel quel. Depuis ce frame :

1. **Contrat global de méthode** :
   `cp kits/iakaframe-claude/global/CLAUDE.md ~/.claude/CLAUDE.md`
2. **Skills** (16, forme dossier + `SKILL.md`, prises en compte à chaud) :
   `cp -R kits/iakaframe-claude/.claude/skills/* ~/.claude/skills/`
3. **Contrats d'agents** (8, pour dispatcher la compagnie) :
   `cp -R kits/iakaframe-claude/.claude/agents/* ~/.claude/agents/`
4. **Commandes slash + hooks** (optionnel) :
   `cp -R kits/iakaframe-claude/.claude/commands/* ~/.claude/commands/` ;
   les garde-fous d'identité/périmètre sont sous `kits/iakaframe-claude/global/hooks/`.
5. **Gabarit projet** : copier `kits/iakaframe-claude/CLAUDE.md`, `specs/PROJET.md` et
   `specs/instructions/_TEMPLATE.md` à la racine d'un nouveau repo.

> **Renseigner les placeholders `<...>`** avant usage réel : `<GIT_HOST>`, `<GIT_REMOTE_URL>`,
> `<GIT_TOKEN>`, `<IAKAFRAME_HOME>`, `<DOC_URL>`, `<LOG_BROKER_URL>`, `<CHARTES_DIR>`,
> `<charte-defaut>`, etc. **Aucune** dépendance à une infra tierce : ce qui n'est pas
> renseigné reste simplement inactif (les skills couplées à une infra le signalent
> proprement et ne bloquent pas le reste).

Les autres runners (`codex`, `ollama`, `openwebui`, `anythingllm`) ont chacun leur `README.md`
et `MODELES.md` dans `kits/iakaframe-<runner>/`.

---

## 5. Comptages (critères de complétude)

| Élément | Attendu |
|---|---|
| `principles/` | 14 |
| `rituals/` | 5 |
| `guardrails/` | 3 |
| `roles/` | 8 |
| `personas/` | 9 (8 + `_TEMPLATE`) |
| `scaffolds/` | 2 |
| `workflows/` | 1 |
| `skills/` | 16 dossiers + `README.md` |
| `methods/` · `teams/` · `bindings/` | 1 · 1 · 1 |
| `kits/` | 5 sous-dossiers + 5 manifestes |
| `kits/iakaframe-openwebui/models/*.json` | 8 |
| `kits/iakaframe-anythingllm/prompts/*.md` | 8 |
| `kits/iakaframe-claude/.claude/agents/*.md` | 8 |
| `kits/iakaframe-claude/.claude/skills/*/` | 16 |

---

## 6. Note de portabilité

Trois skills couplées à une infra propriétaire ont reçu un **id générique** lors du
déparamétrage (leur mécanique est conservée, l'infra propriétaire neutralisée) :

| Id dans ce frame | Objet |
|---|---|
| `iakaframe-git` | Provisionnement du dépôt git distant (serveur self-hosted) |
| `iakaframe-humandoc` | Mémoire humaine publiée dans un outil de doc externe |
| `iakaframe-design` | Studio de design on-brand (catalogue de chartes) |

Les scripts runtime `iakalog.mjs` (main courante) et `humandoc.mjs` (mémoire humaine) sont
livrés dans la copie installable, généralisés : ils se configurent par variables
d'environnement, sans secret ni hôte en dur.
