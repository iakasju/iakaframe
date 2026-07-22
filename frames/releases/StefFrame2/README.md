# StefFrame2 — La méthode iakaframe, portable et EXÉCUTABLE

> **La méthode iakaframe, portable, sans le GUI — et qui TOURNE.** Tout le corpus de
> StefFrame1 (méthode + kits + install déparamétrés) **plus** ce qu'il faut pour l'exécuter :
> le **CLI** `iakaframe`, les **hooks** d'identité/périmètre/délégation câblés, une **charte
> de démarrage neutre**, et un **installeur collision-aware** pour poser `~/.claude` sans
> rien écraser. Le fils n'a qu'à installer **Claude Code + Node.js ≥ 20**.
> Le spécifique-machine reste **déparamétré** (placeholders `<...>`).

## 0. Démarrage rapide (exécutable)

```bash
node install.mjs --dry-run          # voir le plan d'installation de ~/.claude (rien écrit)
node install.mjs                    # poser en fusion sûre (backup auto, garde l'existant)
cd cli && npm install -g .          # installer le CLI (zéro dépendance, offline)
iakaframe banner IAKAFRAME          # vérifier : titre FIGlet
```

Détails : **[`GUIDE-INSTALLATION.md`](./GUIDE-INSTALLATION.md)**.

### Ajouts exécutables (delta vs corpus documentaire)

| Élément | Rôle |
|---|---|
| [`cli/`](./cli/) | CLI `iakaframe` (Node pur, zéro dép) : `banner`, `jalon`, `list`, `show`, `go`, `memory`, `review`… |
| [`library/`](./library/) | Miroir des pools lu par le CLI (`--root .`) ; les pools restent aussi à la racine (lisibilité). |
| [`install.mjs`](./install.mjs) + `install.sh` / `install.ps1` | Installeur collision-aware de `~/.claude` (fusion + backup, ne perd aucune donnée). |
| `kits/iakaframe-claude/global/hooks/*.mjs` | 5 hooks Node : `identity-guard`, `perimeter-guard`, `identity-remind`, `delegation-guard`, `plan-courante`. |
| `kits/iakaframe-claude/global/settings.example.json` | Câble réellement les hooks (à fusionner dans `~/.claude/settings.json`). |
| [`design-starter/`](./design-starter/) | Charte de démarrage NEUTRE (résolue par `<CHARTES_DIR>=design-starter`, `<charte-defaut>=starter`). |
| [`GUIDE-INSTALLATION.md`](./GUIDE-INSTALLATION.md) | Prérequis + installeur + repli manuel. |

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

---

## 7. Anonymisation : ce qui est outillé, et ce qui ne l'est pas

Ce frame est vérifié par une garde outillée (`iakaframe frame verify`, côté canon). Elle
travaille par **classes de motifs**, et non par liste de mots interdits — une liste de noms
propres à bannir est structurellement incapable d'attraper le **nom suivant**. Le contrôle
principal fonctionne donc par **liste blanche** : tout terme de marque **accolé** hors liste est
refusé — c'est-à-dire le radical `iaka` suivi **immédiatement** d'un mot, sans séparateur — y
compris un terme créé après l'écriture de la règle. La forme **séparée** (`iaka-hub`,
`iaka.cloud`) échappe à cette propriété : c'est un arbitrage assumé, détaillé au point 7.

*(Ce README est lui-même scanné par la garde : les exemples de forme accolée y sont décrits
plutôt que cités, sous peine d'être signalés comme de vraies fuites.)*

Sont couverts : les secrets et l'infra (adresses privées, identifiants en URL, chemins
personnels absolus, clés), le vocabulaire de marque, l'identité du décideur (y compris à
l'intérieur d'une expression régulière exécutée), la couche « produit » et les références
pendantes, et les ports d'infra — quel que soit le séparateur qui suit le mot-clé `port`
(deux-points, signe égal, espace, tabulation, option de ligne de commande), ainsi que la forme
`hôte:port`.

Les noms propres du portefeuille légitimes **au canon** sont par ailleurs **tokenisés au miroir**
(placeholders génériques `<...>`) : le miroir ne les porte donc **jamais en clair**. La table de
mapping correspondante (nom du portefeuille → token générique) est tenue **côté canon** — elle ne
peut pas figurer ici sans être elle-même signalée comme fuite. Voir la doc de mapping du canon
(`specs/instructions/resync-stefframe2-miroir-live.md` § 4.2).

### ⚠️ Ce que la garde n'attrape PAS

Cette liste est **contractuelle**. Le dispositif ne doit jamais être présenté comme une
garantie.

1. **Un nom propre en minuscules sans préfixe de marque** dans de la prose : il passe tout.
2. **Un fait privé sans nom propre** — « le serveur du salon », une anecdote identifiante, une
   habitude de travail personnelle : **structurellement invisible**. Aucune classe de motifs
   n'atteint la sémantique.
3. **Une adresse IP publique** ou un domaine réel : seules les plages privées sont ciblées ;
   élargir produirait un bruit inacceptable.
4. **Un port présent dans la liste blanche**, ou écrit sous forme de variable ou de calcul.
5. **Le contenu de toute archive ou fichier binaire** : hors de portée. C'est la raison pour
   laquelle ce dépôt ne versionne plus d'archive — une archive se génère à la diffusion.
6. **Une fuite entrée dans le canon** : la garde porte sur le miroir ; elle ne la verrait qu'à
   la propagation suivante.
7. **La casse et les variantes typographiques** au-delà du prévu. La détection de marque et
   celle de l'identité sont insensibles à la casse, mais elles s'arrêtent aux **séparateurs** :
   `iaka-hub`, `iaka-graph`, `iaka.cloud`, `iaka_secret` se réduisent à `iaka`, qui est dans la
   liste blanche — et **passent donc**. C'est un **arbitrage assumé** : `iaka` seul compte 32
   occurrences légitimes dans ce frame, l'en retirer produirait un bruit qui désactiverait la
   garde. Le trou est **connu et écrit**, plutôt que silencieux.
8. **Les noms propres résiduels ne sont cherchés que dans la prose des fichiers `.md`.** Un nom
   propre situé dans du **code source** (`.js`, `.ps1`…), dans un **bloc de code** ou dans un
   span `` `code` `` n'est pas signalé. Élargir noierait la sortie sous les identifiants de code
   (3020 occurrences brutes mesurées).
9. **Ces avertissements de noms propres sont non bloquants** par construction : un gate bruyant
   est un gate désactivé. Ils se lisent, ils n'arrêtent rien.

**Portée mesurée, à titre d'illustration honnête.** Sur le nom propre le plus présent de ce
frame, la garde en rapporte **21 sur 25**. Les 4 non rapportées relèvent du point 8 : 3 dans un
arbre de fichiers en bloc de code, 1 dans un commentaire `.js`. Ce chiffre est donné pour que la
portée de la garde soit **vérifiable**, et non déclarative.

> **En clair** : la garde déplace le curseur de « aucune garantie » à « les classes *marque*
> (forme accolée) et *secrets* sont couvertes, y compris pour des noms futurs ». Elle **ne rend
> pas la relecture humaine inutile avant une diffusion à des tiers.**
