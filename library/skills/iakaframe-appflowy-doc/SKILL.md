---
id: iakaframe-appflowy-doc
name: iakaframe-appflowy-doc
description: Publier/rafraîchir la mémoire humaine d'un projet dans AppFlowy auto-hébergé selon le modèle iakadoc — un espace par projet, arborescence 00 Vue d'ensemble / 10 Le projet / 20 Où on en est / 30 Décisions & cadrage / 40 Qualité / 90 Notes, alimentée par CLAUDE.md, specs/PROJET.md, specs/instructions/*, specs/etat-des-lieux.md, docs/qualite/*. À utiliser quand il faut "documenter le projet dans AppFlowy", "mettre à jour la mémoire humaine", "publier les specs dans AppFlowy". Idempotent et non destructif ; le workspace cible est explicite, jamais deviné.
layer: product
---

# iakaframe — appflowy-doc

Exécuteur machine de la **mémoire humaine** AppFlowy (cf. `methode-de-travail.md` →
« Cycle de documentation → Mémoire humaine »). Publie/rafraîchit les **docs structurants**
d'un projet dans une instance AppFlowy auto-hébergée, par instrumentation, sans geste manuel.

> **Action récurrente portée par 📖 Nathalie** (gardienne de la mémoire humaine du projet).
> C'est sa skill-outil ; elle la déclenche aux moments de documentation (version, pause/reprise).

Le CLI `appflowy-doc.mjs` est **Node pur, zéro dépendance** (`fetch` natif) : pas de
`npm install`, fonctionne tel quel partout où Node ≥ 18 est présent.

## Le modèle `iakadoc` (arborescence publiée)

```
[WORKSPACE]  projects
└── [ESPACE]  <Projet>
    ├── 00 · Vue d'ensemble ................ GÉNÉRÉE (version, sections présentes/absentes, compteurs)
    ├── 10 · Le projet ..................... [conteneur] GÉNÉRÉ
    │   ├── 11 · Cadre de travail .......... ← CLAUDE.md
    │   └── 12 · Vision & décisions ........ ← specs/PROJET.md
    ├── 20 · Où on en est .................. ← specs/etat-des-lieux.md
    ├── 30 · Décisions & cadrage ........... [conteneur] GÉNÉRÉ
    │   ├── 30 · (index) ................... GÉNÉRÉ · date de modif. décroissante puis nom
    │   └── <une page par instruction> ..... ← specs/instructions/*.md
    ├── 40 · Qualité ....................... [conteneur] GÉNÉRÉ
    │   ├── 40 · (index) ................... GÉNÉRÉ · version décroissante
    │   └── <une page par version> ......... ← docs/qualite/vX.Y.Z.md
    ├── 50 · Recette (RQV) ................. ⏳ collecte activée au lot 4
    ├── 60 · Guide utilisateur ............. ⏳ collecte activée au lot 4
    └── 90 · Notes ......................... HUMAINE · create-if-missing · JAMAIS ÉCRASÉE
```

**Règles normatives**

- Séparateur des entrées de premier niveau : espace + `·` (U+00B7) + espace. `70` et `80`
  sont **réservés**.
- Les pages feuilles portent le **titre lisible** du document (1er `#` du fichier, à défaut
  le nom de fichier sans extension) — **plus jamais le chemin brut**. Le chemin source figure
  dans l'avertissement en tête de page. Deux titres identiques sont désambiguïsés par le
  nom de fichier.
- **Sections vides non créées** : elles sont listées comme absentes dans `00 · Vue d'ensemble`.
- **Ordre garanti** de `00` à `90`, et de l'index puis des feuilles dans chaque conteneur :
  l'ordre de création AppFlowy est non déterministe, l'ordre est donc **imposé** par un
  appel `move` par page mal placée.
- Les conteneurs sont créés **une fois** et **jamais** mis à la corbeille.

### Docs structurants collectés

`CLAUDE.md`, `specs/PROJET.md`, `specs/etat-des-lieux.md`, `specs/instructions/*.md`,
`docs/qualite/*.md`. **Jamais le code ni les fichiers générés.**

> **Exclusion des gabarits — règle sans exception** : tout fichier dont le **nom de base**
> commence par `_` (`_TEMPLATE.md`, `_workflow.md`, `_arborescence.md`, `_AGENT_TEMPLATE.md`…)
> est un gabarit et **n'est JAMAIS publié**. Un projet qui voudrait publier un tel fichier
> doit le **renommer**.

### Miroir strict et zone humaine

- Chaque page **générée** (`00`–`60`) porte, en **tout premier bloc**, l'avertissement :
  *« Page générée depuis `<source>` le `<date ISO>`. Toute modification faite ici sera perdue
  au prochain rafraîchissement. Pour écrire, utiliser « 90 · Notes ». »*
- Chaque page générée porte en plus le drapeau **`is_locked`** (verrou **déclaratif** : le
  client AppFlowy l'affiche verrouillée, le serveur n'oppose aucune résistance — la skill
  continue donc d'écrire).
- **`90 · Notes`** est créée si absente, puis **jamais** réécrite, **jamais** verrouillée,
  **jamais** mise à la corbeille — elle et **tous ses descendants**, quels qu'ils soient.

## Identifiants et workspace cible (résolution en cascade — jamais commités)

Les trois identifiants sont résolus dans cet ordre, **l'env ayant toujours priorité** :

1. **Variables d'env** : `APPFLOWY_URL`, `APPFLOWY_EMAIL`, `APPFLOWY_PASSWORD`.
2. **Repli fichier** : pour toute variable **encore absente** de l'env, lecture d'un fichier
   dotenv local — `$IAKAFRAME_APPFLOWY_ENV` s'il est défini, sinon
   `~/.config/iakaframe/appflowy.env`. Fichier absent/illisible → ignoré silencieusement.

| Variable | Rôle |
|---|---|
| `APPFLOWY_URL` | base de l'instance AppFlowy (ex. `http://host:3008`) |
| `APPFLOWY_EMAIL` | compte AppFlowy |
| `APPFLOWY_PASSWORD` | mot de passe |
| `APPFLOWY_WORKSPACE` | **workspace cible** : un **nom** exact ou un **`workspace_id`** |
| `IAKAFRAME_CACHE_DIR` | *(facultatif)* racine du cache d'empreintes — défaut `~/.cache/iakaframe/appflowy` |

**Le workspace cible est EXPLICITE.** Cascade : `--workspace` → env `APPFLOWY_WORKSPACE` →
fichier dotenv → **défaut : le workspace nommé `projects`**. Aucune correspondance →
**échec propre, code de sortie non nul, message citant les workspaces disponibles**.
**Jamais de repli sur le premier workspace renvoyé par l'API** : avec plusieurs workspaces et
aucun ordre garanti, la cible changerait d'une exécution à l'autre et l'idempotence ne
tiendrait plus. Deux workspaces homonymes → refus explicite, à départager par `workspace_id`.

**Format du fichier** (`KEY=VALUE`, un par ligne ; `#` = commentaire ; quotes entourantes
optionnelles) :

```
APPFLOWY_URL=http://host:port
APPFLOWY_EMAIL=email
APPFLOWY_PASSWORD=motdepasse
APPFLOWY_WORKSPACE=projects
```

> **Sécurité** : `chmod 600 ~/.config/iakaframe/appflowy.env`, **jamais commité** (ni le
> fichier, ni son contenu). Si après la cascade une valeur manque encore, message net citant
> **et** les variables d'env **et** le chemin du fichier attendu, code de sortie non nul.

## Utilisation

```bash
node appflowy-doc.mjs --project IakaPcl --root ~/work/IakaPcl
node appflowy-doc.mjs --project IakaPcl --root ~/work/IakaPcl --workspace projects
```

Résout les docs structurants présents sous `--root`, garantit l'espace `--project` dans le
workspace cible, construit l'arborescence `00`–`90`, **ne réécrit que les pages dont
l'empreinte a changé**, **retire les orphelines**, préserve `90 · Notes`, verrouille les pages
générées puis impose l'ordre canonique.

Le journal dit, **page par page**, ce qui a été fait : `créé` · `à jour` · `inchangé` ·
`retiré (orpheline, plus de source)`. La ligne finale compte les appels HTTP **et les
écritures** — c'est le chiffre que vérifie le critère A8.

## Idempotence & non-destructivité — **incrémentale par empreinte**

- **Espace** : réutilisé par nom s'il existe, créé sinon (jamais de doublon).
- **Conteneurs** (`10`, `30`, `40`) : créés une fois, **jamais** corbeillés.
- **Pages générées** : une page n'est réécrite que si son **empreinte `sha256` a changé**.
  Sinon : **zéro appel**. Quand il faut réécrire, l'API n'exposant pas de remplacement
  in-place, l'ancienne part à la corbeille et une page fraîche est créée.
- **`90 · Notes`** : jamais touchée après création.
- Ne touche jamais aux espaces/pages hors périmètre du projet, ni à un autre workspace.

### L'empreinte (critère A8)

- Prise **côté SOURCE** : le Markdown du dépôt. Le contenu d'une page AppFlowy revient en
  `encoded_collab` — le hacher côté serveur coûterait un décodage (établi au spike).
- Elle intègre **`RENDER_VERSION`** (constante du script). **Toute évolution du rendu
  (mapper, avertissement, index, vue d'ensemble) DOIT l'incrémenter**, sans quoi les pages
  resteraient figées sur un rendu périmé.
- État stocké **hors dépôt** : `~/.cache/iakaframe/appflowy/<workspace_id>/<projet>.json`
  (override : `$IAKAFRAME_CACHE_DIR`). Il mémorise, par page, son `view_id`, son empreinte
  et son état de verrou.
- **Le cache ne fait jamais foi seul** : une page n'est réputée à jour que si elle est
  **encore présente** dans l'arbre relu, **seule** sous son nom et avec **le `view_id`
  mémorisé**. Une page détruite hors de la skill est donc recréée (critère A1).
- **Cache absent, illisible, corrompu ou d'un autre `RENDER_VERSION` → ignoré** : la passe
  réécrit tout. Dégradation propre, jamais de corruption.
- Le cache n'est écrit **qu'en fin de passe aboutie** : une passe interrompue laisse l'état
  précédent, donc une reprise qui réécrit.

**Mesuré** (faux serveur, projets réels, 3 passes) : `IakaPcl` 16 pages, `IakaCockpit`
66 pages, `iakaframe` 108 pages → **2ᵉ et 3ᵉ passes : 0 écriture, 0 débris**, 5 appels HTTP
de lecture. Avant l'empreinte, la même 2ᵉ passe coûtait 85 / 356 écritures et **+16 / +66
débris de corbeille par passe**.

### Balayage des orphelins (correction B3, critère A10)

Toute page d'une section générée **qui n'a plus de source** part à la corbeille : un fichier
renommé ou supprimé ne laisse plus sa page derrière lui, à jour de rien. Le balayage porte
sur les enfants des conteneurs **et** sur le niveau de l'espace — hors `90 · Notes`, l'espace
projet appartient au dépôt.

> **`90 · Notes` et TOUS ses descendants sont exclus sans condition**, quels que soient leur
> nombre et leur nom : la zone humaine n'est le sujet d'aucun ciblage. Le balayage ne la
> visite même pas.

> ⚠️ **Sédiment résiduel** : chaque réécriture réelle laisse **une** ancienne version dans la
> corbeille du workspace, que la skill ne vide jamais. Le phénomène est désormais borné au
> nombre de pages **effectivement changées** ; le vidage se fait par `appflowy-purge.mjs
> --trash` (geste explicite et confirmé, cf. ci-dessous).

## Purge — `appflowy-purge.mjs` (outil **destructif**, désarmé par défaut)

Une purge = **deux appels** : `move-to-trash` **puis** `DELETE /trash/{view_id}`. S'arrêter à
la corbeille n'est **pas** une purge : le contenu resterait accessible.

```bash
# 1. inventaire — LECTURE SEULE, aucune écriture, comportement par DÉFAUT :
node appflowy-purge.mjs --workspace "<nom|id>" --space IakaCockpit --space IakaPcl \
     --page "iakaframe — preuve de concept API" --trash --dry-run

# 2. exécution — les DEUX drapeaux sont exigés, sinon rien n'est supprimé :
node appflowy-purge.mjs --workspace "<nom|id>" ... --execute --confirm <workspace_id>
```

- `--workspace` est **obligatoire** : aucun workspace par défaut pour un geste destructif.
- Sans `--execute`, le script **liste** et ne supprime rien.
- `--confirm` attend le **`workspace_id` résolu** : une commande copiée d'un autre contexte
  ne peut pas purger le mauvais workspace.
- **`90 · Notes` et tous ses descendants sont refusés comme cibles**, quoi qu'on demande.
- Une cible absente est **signalée**, jamais une erreur.
- Le chemin de publication (`appflowy-doc.mjs`) n'appelle **jamais** ce script.

## Mécanismes API (vérifiés en réel — spike lot 0, 2026-07-27, AppFlowy Cloud **0.15.21**)

1. Auth : `POST {base}/gotrue/token?grant_type=password` → `access_token` (~2 h).
2. Provision idempotente : `GET {base}/api/user/verify/{token}`.
3. Workspaces : `GET {base}/api/workspace` → `data[]` (`workspace_id`, `workspace_name`).
4. Arbre : `GET {base}/api/workspace/{wid}/folder?depth=N` — **`depth` tronque strictement**
   l'arbre rendu : la skill impose **`depth ≥ 6`**, sans quoi le modèle `00`–`90` serait amputé.
5. Créer un **espace** : `POST {base}/api/workspace/{wid}/space`
   `{name, space_permission, space_icon, space_icon_color}` → `view_id` (`is_space:true`).
6. Créer une page : `POST {base}/api/workspace/{wid}/page-view`
   `{parent_view_id, layout:0, name}` — `parent_view_id` accepte **une page** : l'imbrication
   fonctionne (3 niveaux relus).
7. Écrire : `POST {base}/api/workspace/{wid}/page-view/{vid}/append-block` `{"blocks":[…]}`.
8. **Ordonner** : `POST {base}/api/workspace/{wid}/page-view/{vid}/move`
   `{new_parent_view_id, prev_view_id}` — `prev_view_id: null` place en tête.
9. **Renommer / verrouiller** : `PATCH {base}/api/workspace/{wid}/page-view/{vid}`
   `{name, is_locked}` — le champ **`name` est obligatoire** (HTTP 400 sinon).
10. Corbeille : `POST …/page-view/{vid}/move-to-trash` (un espace y part avec **tous** ses
    descendants en un seul appel) ; inventaire `GET …/trash` (charge utile sous **`data.views`**) ;
    **suppression définitive `DELETE …/trash/{view_id}`**. `DELETE …/page-view/{vid}` → 405.
11. Recherche : `GET {base}/api/search/{wid}?query=…&mode=keyword` — **`mode=keyword` est
    obligatoire** ; les modes `semantic`/`hybrid` échouent faute d'embeddings. **Ne jamais
    configurer de clé OpenAI** : l'index mots-clés est local et suffit.

> ⚠️ **Le code HTTP ne prouve rien** : `append-block` renvoie 200 pour un type de bloc
> **inventé**, qui est persisté tel quel. La validité des blocs produits ne peut donc venir
> que des **tests unitaires du mapper**, jamais d'une recette « ça répond 200 ».

## Mise en forme — mapper Markdown → blocs

Le corps de chaque page miroir passe par un **mapper maison, ZÉRO dépendance** (la skill doit
tourner telle quelle partout où Node ≥ 18 est présent). Il ne vise pas CommonMark intégral,
mais le **sous-ensemble réellement écrit** dans les `CLAUDE.md` et `specs/` du portefeuille.

| Source Markdown | Bloc AppFlowy produit |
|---|---|
| `#` → `###` | `heading` niveau 1 → 3 |
| `####` et au-delà | `heading` **clampé au niveau 3** (rendu des niveaux > 3 non vérifiable) |
| `-` / `*` / `+` | `bulleted_list`, **un bloc par item** |
| `1.` / `1)` | `numbered_list`, **un bloc par item** |
| `- [ ]` / `- [x]` | `todo_list` avec `checked` |
| `> …` | `quote` (lignes consécutives agglomérées ; une liste citée reste une liste) |
| ```` ```lang ```` | `code`, **langage conservé** — y compris **dans un item de liste** (dédenté) |
| 4 espaces / 1 tabulation | `code` (bloc **indenté** CommonMark), **jamais de formatage en ligne** |
| `---` / `***` / `___` | `divider` |
| tableau `\| … \|` | `code` **préformaté aligné** (colonnes à largeur fixe) |
| `**gras**`, `*italique*`, `` `code` ``, `[lien](url)` | attributs `bold`, `italic`, `code`, `href` |

**Agglomération des paragraphes** : seule une **ligne vide** sépare deux paragraphes. Un simple
retour à la ligne (prose rewrappée à 100 colonnes) **ne coupe plus rien** — c'est le cœur du
critère A7. Idem pour un item de liste écrit sur plusieurs lignes : il reste **un seul** bloc.

**Un marqueur de liste ordonnée n'en est un que s'il peut ouvrir ou poursuivre une suite**
(règle CommonMark : une liste ordonnée n'interrompt un paragraphe que si elle commence par
`1`). Sans cette règle, la ligne repliée « `   3000) : configurer Vite` » voyait `3000)` pris
pour un marqueur, donc **consommé et jeté**.

### Sonde de conservation du contenu — **rien ne disparaît en silence**

Deux invariants, purs et testés, tournent sur chaque document :

| Sonde | Ce qu'elle affirme | Ce qu'elle attrape |
|---|---|---|
| **mots** | tout mot du source se retrouve dans le rendu (multi-ensemble, occurrences comprises ; `href` et langage inclus) | ligne, cellule, continuation ou marqueur avalés |
| **littéral** | toute région littérale du source (fence, 4 espaces) se retrouve **verbatim** dans un bloc `code` | contenu de code reformaté ou passé au formatage en ligne |

La référence ne concède que les marques **déclarées** ci-dessous ; **tout autre déficit est
une perte** et fait rougir la suite. Passée sur les **420 docs structurants** du portefeuille :
**0 perte de mot, 0 littéral reformaté**. Contre le mapper précédent, la même sonde relevait
**1 fichier** en perte de mot et **23** en littéral reformaté.

### Pertes assumées, déclarées

- **Tableaux** → bloc préformaté aligné. Lisible et jamais éclaté en paragraphes, mais ce n'est
  pas un vrai tableau AppFlowy (un bloc `table` créé par `append-block` est une coquille sans
  cellules, mesuré au spike S3).
- **Liens relatifs entre docs** → texte, cible entre parenthèses. Pas de `href` : la cible n'a
  aucun sens côté AppFlowy.
- **Images** → jamais téléversées : mention explicite `image non publiée : <alt> (<chemin>)`,
  le **texte alternatif conservé** — **jamais un silence**.
- **Imbrication des listes** → aplatie (`append-block` est plat) ; la profondeur est rendue par
  un **retrait en espaces insécables**, 2 par niveau. Un **bloc fencé** écrit dans un item en
  sort et devient un bloc `code` de plein droit : il ne se fond **jamais** dans le texte.
- **Numérotation d'origine** → AppFlowy renumérote : une liste démarrant à `3.` repart à `1.`.
  C'est la **seule** disparition de mot admise, et la sonde ne la concède qu'aux marqueurs
  qui ouvrent (`0`, `1`) ou poursuivent réellement une suite.
- **Case à cocher `[x]`** → portée par l'attribut `checked`, retirée du texte.
- **Biffé `~~x~~`** → laissé littéral (l'attribut n'a pas été vérifié au spike S3).
- **HTML brut** (y compris les commentaires `<!-- … -->`) → laissé en texte.
- **Front-matter YAML** → masqué du corps (il sert déjà au titre de page).

## Échec propre

Config absente, instance injoignable, auth refusée, **workspace introuvable** → **message net
+ code de sortie non nul**, sans stacktrace et **sans bloquer** le flux appelant. Token expiré
→ ré-auth automatique. Fichier illisible → ignoré proprement.

## Tests

Tests unitaires des fonctions **pures** (mapper Markdown cas de bloc par cas de bloc, sonde de
conservation, empreintes et cache, plan d'orphelins, exclusion des gabarits, titres lisibles,
ordres canoniques, plan d'arborescence, plan de déplacement, sélection du workspace, plan de
purge, parseur dotenv) **et** de l'orchestration complète contre un **faux serveur en mémoire**
qui rejoue les comportements mesurés au spike (ordre de création non déterministe, `move`,
`PATCH name` obligatoire, troncature de `depth`, corbeille). **Aucun réseau, aucune instance
touchée, aucun secret** (fixtures bidon).

> ⚠️ **Le double de test EST le vrai client.** `makeFakeClient` construit un
> **`AppFlowyClient` réel** dont seul le point de sortie HTTP (`_req`) et l'authentification
> sont neutralisés ; le faux serveur interprète les **URL, verbes et charges utiles réels** et
> **refuse** une route inconnue ou une charge utile invalide. Un double qui *réimplémenterait*
> `movePage`, `createPage` ou `setLocked` rendrait l'orchestration aveugle aux défauts du
> client — c'est exactement ce qui a laissé passer un `prev_view_id` figé. Un test dédié
> **vérifie que le double n'a réimplémenté aucune méthode**.

**Deux entrées, une seule source de vérité** :

| Entrée | Usage |
|---|---|
| `node test.mjs` | exécution directe, sortie lisible, pratique en dev |
| `node --test` depuis `cli/` | **la chaîne** : `cli/test/appflowy-doc-skill.test.js` importe les cas exportés par `test.mjs` et les enregistre un par un dans `node:test` |

⚠️ **La seconde entrée n'est pas un confort.** Sans elle, ces tests ne sont joués par **aucune**
chaîne (`npm test` tourne depuis `cli/`, la CI aussi, il n'y a pas de `package.json` à la racine)
et une régression du modèle passerait au vert. La CI `.forgejo/workflows/cli-ci.yml` se déclenche
donc aussi sur `library/**`.

## Hors périmètre (différé tracé)

- **Lot 4** : sections `50 · Recette (RQV)` (statut seul) et `60 · Guide utilisateur`
  (`docs/**.md` hors `qualite/`) — **collecte non encore branchée**, les deux sections sont
  aujourd'hui déclarées « absentes » dans la vue d'ensemble.
- **Lot 5** : branchement auto dans `iakaframe update` / snapshot (la skill est appelable ;
  le câblage aux moments version/pause/reprise reste à faire).
- Liens cliquables vue d'ensemble → sous-pages (MVP = inventaire texte).
- Téléversement d'images ; synchronisation remontante AppFlowy → dépôt.
- Secret au keychain (MVP = env, repli fichier dotenv local).
