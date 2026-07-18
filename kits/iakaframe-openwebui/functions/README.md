# kit-openwebui/functions — Filter d'identité **forcée** (parité de règle avec Claude)

> Incarnation **OpenWebUI** de la garde d'identité iakaframe (Lot A2 de l'instruction
> `parite-enforcement-multirunner.md`). Là où les hosts Claude et Codex forcent l'identité via des
> hooks Node partageant `guard-core.mjs`, OpenWebUI n'exécute **pas** de Node : une **Filter
> Function** est une classe **Python** qui vit dans le backend OWUI. La **règle** d'identité (badge
> d'ouverture + de clôture, la position de la pastille porte le sens) y est donc **re-implémentée
> fidèlement** à `guard-core.verdictIdentity` — et la **parité de règle** est prouvée par test
> (verdict Python comparé au verdict Node de `guard-core`, cas par cas).

## Ce que ça fait

- **`outlet()`** — après la réponse **complète** du modèle, reconstruit le tour (`turn =
  [dernier message assistant]`) et vérifie qu'il **ouvre** (pastille AVANT le bloc) **et clôt**
  (pastille APRÈS le bloc) par un badge `[ROYAUME][Agent]`. Badge manquant → **lève une Exception**
  → OpenWebUI **refuse/annonce** l'échec à l'utilisateur (sémantique de blocage réelle, différente
  d'`exit 2` mais effective).
- **`inlet()`** — avant le modèle, **ré-injecte un rappel d'identité** (message `system`),
  équivalent d'`identity-remind` côté Claude.
- **Fail-open** — toute erreur interne / `body` illisible / config absente ⇒ la réponse **passe**
  (un garde ne fige jamais une conversation). Seul le **refus d'identité** (badge manquant, quand
  `block_on_violation` est actif) remonte comme Exception.

## Contenu

```
kit-openwebui/functions/
├── iakaframe_identity_filter.py   ← la Filter Function (classe `Filter` : inlet + outlet + Valves)
├── test_identity_filter.py        ← parité de règle Python↔guard-core (Node) + comportement adaptateur
└── README.md                      ← ce fichier
```

## Valves (réglages OWUI)

| Valve | Défaut | Effet |
|---|---|---|
| `block_on_violation` | `True` | badge manquant → **Exception** (refus). `False` → mode **audit** (laisse passer). |
| `inject_reminder` | `True` | `inlet` injecte le rappel d'identité (message `system`). |
| `priority` | `0` | ordre d'application du filtre (ordonnable dans OWUI). |

## Installation — **import admin/API** (PAS un fichier lié)

⚠️ Sur OpenWebUI, les Functions/Filters vivent **dans la base `webui.db`** (`/app/backend/data`),
**pas** dans des fichiers montables/liables. Un symlink hôte **ne traverse pas** le conteneur et un
mount read-only casse (OWUI **renomme** au démarrage). L'installation se fait donc **par import
admin ou API**, jamais par dépôt de fichier ni par lien.

### A. Via l'interface admin (recommandé)
1. **Admin Panel → Functions → “+” (New Function)** (réservé **admin**).
2. Coller **tout** le contenu de `iakaframe_identity_filter.py` (l'en-tête docstring `title` /
   `version` / `required_open_webui_version` sert de métadonnées OWUI).
3. Renseigner **`id`** (ex. `iakaframe_identity_guard`) et **`name`** (ex. `iakaframe Identity
   Guard`), **Save**.
4. **Activer** le filtre, puis choisir sa **portée** :
   - **global** (Functions → toggle *Global*) → s'applique à **tous** les modèles ; ou
   - **par Model** (Workspace → Models → un modèle → *Filters*) → seulement les **personas
     iakaframe** (recommandé : n'enforcer l'identité que là où le rituel est attendu).
5. Régler la **priorité** si plusieurs filtres coexistent.

### B. Via l'API (déploiement scripté — pour la Brique C, install multi-host)
- OpenWebUI expose une API admin pour créer/mettre à jour une Function (upsert du **code source**
  + `id`/`name`/`meta`) — c'est le canal du **fan-out** d'installation OWUI (Lot C1) : on **pousse**
  la Function, on ne pose pas de fichier. Requiert un **jeton admin**. (Endpoint exact selon la
  version d'OWUI — à figer sur l'instance réelle du décideur, cf. § 5bis.6 de l'instruction.)

## Limites — **parité honnête**

- **Identité SEULE.** **Périmètre** et **délégation** sont **N/A** sur OpenWebUI : pas d'écriture
  repo, pas de dispatch multi-agents natif → il n'y a rien à garder de ce côté (cf. tableau de
  parité § 3.2 de l'instruction).
- **Maille = une réponse.** Pas de tour multi-message ni de sous-agent natif : le verdict porte sur
  le **dernier message assistant** complet. (Les hosts Claude/Codex, eux, jugent un tour de parole.)
- ⚠️ **Piège `/api/chat/completions`.** Des rapports upstream indiquent que les Filters ne
  s'appliquent **pas** systématiquement sur l'endpoint OpenAI-compatible `/api/chat/completions`.
  **Valider** que l'enforcement couvre bien le **chemin d'usage réel** du décideur avant de le
  déclarer « fort » — ne pas sur-vendre.
- **`stream()` non implémenté** au MVP : l'enforcement se fait sur la **réponse complète**
  (`outlet`), pas chunk par chunk. En mode streaming, l'utilisateur voit la réponse se former puis
  reçoit le refus à la fin (comportement acceptable au MVP ; `stream()` = évolution).
- **Parité par re-implémentation, pas par partage de code.** `guard-core.mjs` étant du Node, la
  règle est portée en Python ; `test_identity_filter.py` **compare** le verdict Python au verdict
  Node de `guard-core` sur un jeu de cas partagés pour verrouiller la non-divergence. Toute
  évolution de la règle doit toucher **les deux** (Python + `guard-core.mjs`).

## Tests

```bash
# syntaxe
python3 -c "import ast; ast.parse(open('iakaframe_identity_filter.py').read())"
# logique d'identité + parité Python↔guard-core (Node) + comportement adaptateur
cd kits/iakaframe-openwebui/functions && python3 -m unittest test_identity_filter -v
```

Le test de **parité Python↔Node** shelle vers `node` quand il est présent (compare les deux
implémentations cas par cas) ; **si Node est absent**, ce cas est **skippé** et seuls les verdicts
Python attendus sont vérifiés (honnête : la parité exacte se reprouve dès que Node est disponible).

## Gate humain différé — **e2e sur une vraie instance OpenWebUI**

Ce lot **livre le Filter + sa doc d'import + les tests de logique**. Il **ne** prouve **pas** le
comportement bloquant réel dans OWUI (import de la Function dans `webui.db`, refus effectif d'une
réponse sans badge, vérification du chemin `/api/chat/completions`) : cela **nécessite une instance
OpenWebUI réelle** et reste un **gate humain différé** (pas d'OWUI en CI). La parité de **règle**
est prouvée par tests ; le **blocage runtime** doit être validé sur une session réelle.
