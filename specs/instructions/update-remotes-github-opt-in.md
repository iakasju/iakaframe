# Push du CLI restreint aux forges self-hosted — GitHub (et tout hors-forge) en opt-in projet

> Cadrage : Gandalf (P1), 2026-09-27. Ordre d'Odin validé par le décideur le 2026-09-27.
> Statut : **proposé** — en attente de l'arbitrage du décideur sur les points ouverts (§ final).

## Problème

`iakaframe update` pousse par défaut sur **tous** les remotes configurés
(`cli/src/commands/update.js:26` et `:128`, via `listerRemotes` `cli/src/lib/canaux.js:52`).
Le 2026-09-26, le checkpoint de naonedge (commit `822548d`) a ainsi poussé sur le remote `github`
(dépôt privé `iakasju/naonedge`) des transcripts de réunions clients (données nominatives, RH,
montants), alors que le `CLAUDE.md` du projet l'interdisait : une consigne en prose ne protège pas
d'un défaut de l'outil. Le risque est transverse : environ 45 dépôts de `~/work` portent encore un
remote `github`. GitHub n'est **pas** un remote de la méthode (self-hosted d'abord) : le push hors
forge self-hosted doit devenir un **acte explicite, décidé par projet**, jamais un effet par défaut.

## Décision retenue

1. **Éligibilité par destination réelle, pas par nom.** Un remote est *éligible par défaut* si
   **toutes** ses URL de push effectives (`git remote get-url --push --all <nom>`, qui applique
   `insteadOf`/`pushInsteadOf` et `pushurl` — vérifié, cf. Sources) désignent :
   - un **chemin local** (chemin absolu ou relatif, `file://`, lettre de lecteur Windows `C:\`/`C:/`) ;
   - ou un **hôte de forge self-hosted connu** = union des hôtes de `DEF_URLS`
     (`cli/src/lib/forgejo.js:20` : `git.naonedge.com`, `192.168.1.139`, `192.168.2.11`) et des
     hôtes des URL résolues par `cfgList()` (`cli/src/lib/forgejo.js:82`, donc `FORGEJO_URL` shell
     ou `<chapeau>/.env`). Comparaison sur le **hostname en minuscules** (port ignoré).
   Tout le reste — `github.com`, toute autre forge, un hôte inconnu, une URL illisible ou une
   commande `get-url` en échec — est **hors forge** : exclu par défaut (fail-safe). Le nom du
   remote ne compte pas : un `origin` qui pointerait sur GitHub est exclu, un `nas` renommé reste
   éligible.
2. **Opt-in par projet, et seulement par projet.** Clé `pushOptInRemotes` (tableau de **noms** de
   remotes) dans `<projet>/iakaframe.json` — domicile canonique de la conf projet
   (`cli/src/lib/frame-active.js:30`). Le pointeur texte `.iakaframe` (format `cle=valeur`,
   `frame-active.js:93-109`) est un **repli legacy de transition** : il n'est **pas** lu pour
   l'opt-in. Lecture via `parseJsonFile` (`frame-active.js:34`, jamais de jet) ; valeur absente,
   non tableau ou entrées non-chaînes → opt-in vide. L'opt-in est **versionné avec le projet** :
   c'est une décision humaine visible dans l'historique, pas un réflexe d'agent. Aucun setter CLI
   dans ce lot (édition à la main).
3. **`--remotes` restreint, il n'élargit pas.** `--remotes a,b,c` choisit parmi les remotes
   **configurés et éligibles (forge ou opt-in)**. Une entrée hors forge sans opt-in est **refusée**
   (non poussée, nommée). Une entrée qui n'est pas un nom de remote configuré (y compris une URL
   brute) est **refusée** (non poussée, nommée) — sinon `--remotes https://github.com/...` serait
   un contournement. Pas de confirmation interactive : les agents tournent en non-interactif, et la
   décision durable vit dans `iakaframe.json`.
4. **Message clair, non bloquant.** Chaque remote écarté a sa ligne, avec son **nom**, son **hôte**
   (jamais l'URL : elle porte le token) et son **motif**. Codes retour : écarts par défaut → `0` ;
   refus d'une demande explicite `--remotes` → `1` (après avoir poussé les cibles retenues).
5. **Une seule fonction de sélection, appliquée aux trois chemins de push du CLI** (`update`,
   `onboard`, `canaux --rattraper`). `pousserFanout` et `rattraper` restent inchangés : le filtre
   s'applique en amont, dans les commandes.

### Recensement des chemins de push du CLI (grep `push` / `remotes` dans `cli/src/`)

| Chemin | Emplacement | Pousse ? | Périmètre |
|---|---|---|---|
| `update` (checkpoint) | `cli/src/commands/update.js:127-136` → `pousserFanout` `cli/src/lib/canaux.js:75-85` | oui, tous les remotes | **inclus** |
| `onboard` (étape 5/5) | `cli/src/commands/onboard.js:165-174` → `pousserFanout` | oui, tous les remotes (`-u origin`) | **inclus** |
| bascule `update`→`onboard` / `onboard`→`update` | `update.js:88-103`, `onboard.js:77-89` | via les deux ci-dessus | couvert par construction |
| `canaux --rattraper` | `cli/src/commands/canaux.js:74-83` → `rattraper` `cli/src/lib/canaux.js:215-239` (`push` l.220) | oui, remotes en retard | **inclus** |
| `canaux` (mesure seule) | `canaux.js:82` → `mesurerCanal` (`ls-remote`, `fetch`) | non (lecture) | inclus par cohérence : même sélection, remotes écartés listés mais **non mesurés** |
| `repo` | `cli/src/commands/repo.js:103-107` | non (`remote add/set-url` sur `origin` forge) | exclu (ne pousse pas) |
| `snapshot`, `forgejo.js` (API) | — | non | exclu |

Aucun script `.ps1`/`.sh` du dépôt ne pousse (grep vide).

## Périmètre

- **Inclus**
  - Fonctions pures de classification et de sélection dans `cli/src/lib/canaux.js` + résolution
    des URL de push et lecture de l'opt-in.
  - Export des hôtes de forge connus depuis `cli/src/lib/forgejo.js`.
  - Application de la sélection dans `update`, `onboard`, `canaux` (mesure + `--rattraper`).
  - Mise à jour des textes `--help` des trois verbes, du `cli/README.md`, de
    `methode-de-travail.md`, de la skill `iakaframe-update` et du `CLAUDE.md` global du kit.
  - Nouveau fichier de tests + non-régression de la suite complète.
- **Exclu (explicite)**
  - Aucune action sur les dépôts GitHub existants (ni suppression, ni passage en privé/public,
    ni purge) ; **aucune** purge d'historique naonedge.
  - Aucune modification des remotes d'aucun projet (ni naonedge, ni les ~45 dépôts, ni iakaframe).
  - Aucun setter CLI de l'opt-in (`iakaframe config ...`), aucun opt-in au niveau portefeuille
    (`.iakaframe-portefeuille`) ni par variable d'environnement.
  - Aucune nouvelle option CLI (pas de `--force-hors-forge`, pas de confirmation interactive).
  - Pas de push des tags (comportement actuel inchangé : une branche par push).
  - Pas de modification de `pousserFanout`, `rattraper`, `mesurerCanal`, `classerEchec`.
  - Pas de modification des copies figées ou générées : `frames/releases/**`, `cli/_bundled/**`
    (régénéré par `scripts/bundle.js`), `.claude/worktrees/**`, `~/.claude/skills/**` (copies
    installées), `~/.claude/CLAUDE.md` (config utilisateur ; la source est le kit).
  - Pas de réconciliation de `cli/src/lib/verbes.js:76` (le registre d'`update` omet déjà
    `--remotes`/`--timeout` : dérive préexistante, hors sujet).
  - Bump de version du CLI : suit la procédure de release habituelle (garde G1/G5), hors de ce lot.
  - Point ouvert n° 5 (opt-in `github` du dépôt iakaframe lui-même) : **n'est fait que si le
    décideur le retient**.

## Étapes d'implémentation

1. **`cli/src/lib/forgejo.js`** — ajouter `export function hotesForge()` : rend un `Set` des
   hostnames (minuscules) de `DEF_URLS` ∪ `cfgList().map(c => c.url)`. URL non parsable → ignorée.
   Ne lit aucun token, ne fait aucun appel réseau.
2. **`cli/src/lib/canaux.js`** (après `listerRemotes`, l. 52-56) — ajouter :
   - `hoteDeUrl(url)` **pure** → `{ local: true }` ou `{ local: false, hote: '<hostname>' }` ou
     `{ local: false, hote: '' }` (illisible). Règles, dans l'ordre :
     `^[A-Za-z]:[\\/]` → local ; `^[a-z][a-z0-9+.-]*://` → `new URL` (`file:` → local, sinon
     `hostname` en minuscules, credentials jamais conservés) ; forme scp `^(?:[^@/]+@)?([^:/]+):`
     → hôte = groupe 1 ; sinon → local (chemin).
   - `classerRemote(urls, hotes)` **pure** → `'forge'` si `urls.length > 0` et chaque URL est
     locale ou d'hôte ∈ `hotes` ; sinon `'hors-forge'`.
   - `urlsDePush(cwd, nom)` → `gitBorne(cwd, ['remote', 'get-url', '--push', '--all', nom])` ;
     échec → `[]` (donc hors forge). Les URL ne sont **jamais** affichées.
   - `lireOptIn(root)` → tableau de noms depuis `iakaframe.json` clé `pushOptInRemotes`
     (via `parseJsonFile` + `PROJECT_CONF` de `frame-active.js`), filtré aux chaînes non vides.
   - `selectionnerCibles({ configures, classes, optIn, demandes })` **pure** :
     `configures` = noms ordonnés (`ordonnerRemotes`), `classes` = `{ nom: { classe, hote } }`,
     `demandes` = `null` (défaut) ou liste issue de `--remotes`. Rend
     `{ retenues: [noms], ecartees: [{ nom, hote, motif }], refusees: [{ nom, hote, motif }] }` :
     - défaut : pour chaque configuré, `forge` ou nom ∈ `optIn` → retenu ; sinon → `ecartees`,
       motif `hors-forge-sans-opt-in` ;
     - explicite : pour chaque demandé (ordre de la demande, dédoublonné) : non configuré →
       `refusees` motif `remote-non-configure` ; `forge` ou opt-in → retenu ; sinon → `refusees`
       motif `hors-forge-sans-opt-in`.
   - `resoudreCibles(root, demandes)` (impure, assemble les précédentes) → même forme que
     `selectionnerCibles`.
   - `formaterEcarts({ ecartees, refusees })` **pure** → lignes, une par remote :
     `  i <nom> ignore (hors forge self-hosted, hote <hote|inconnu>) : opt-in via iakaframe.json "pushOptInRemotes"`
     et `  ! <nom> REFUSE : <motif> (hote <hote|inconnu>)`. Aucune URL, aucun token.
3. **`cli/src/commands/update.js`** l. 127-136 — remplacer
   `const remotes = values.remotes ? splitCanaux(...) : listerRemotes(root)` par
   `resoudreCibles(root, values.remotes ? splitCanaux(values.remotes) : null)` ; afficher
   `formaterEcarts` **avant** la ligne `[3/3] Push sur ...` ; si aucune retenue :
   `[3/3] Aucun remote eligible (forge self-hosted ou opt-in) : push ignore, le commit n existe que localement.`
   (exit inchangé = 0 hors refus). Si `refusees.length > 0` → `process.exitCode = 1` **après** le
   fan-out. Mettre à jour `USAGE` l. 26 :
   `--remotes <a,b,c>  Cibles du push, parmi les remotes eligibles (defaut : remotes des forges self-hosted, origin d'abord ; hors forge = opt-in iakaframe.json "pushOptInRemotes")`.
4. **`cli/src/commands/onboard.js`** l. 165-174 — même remplacement de `listerRemotes(root)` par
   `resoudreCibles(root, null)`, affichage des écarts, message « aucun remote éligible » ;
   `amont: 'origin'` conservé (appliqué seulement si `origin` est retenu, ce que `pousserFanout`
   fait déjà). Ajouter à `USAGE` (l. 18-36) une ligne :
   `Le push ne vise que les remotes des forges self-hosted (hors forge : opt-in iakaframe.json "pushOptInRemotes").`
5. **`cli/src/commands/canaux.js`** l. 74-83 — `resoudreCibles(root, demandes)` ; mesure et
   `--rattraper` sur les **retenues** seulement ; sortie humaine : lignes `formaterEcarts` sous le
   titre ; aucune retenue → `fail(...)` avec `aucun remote eligible dans <root> (forge self-hosted ou opt-in)`.
   Charge JSON : ajouter `ecartees` et `refusees` aux métadonnées de `collection(...)` (l. 86-94) ;
   refus explicite → `process.exitCode = 1`. `USAGE` l. 31 : même formulation que `update`.
6. **Doc** (textes exacts laissés à l'exécutant, sens imposé ci-dessous) :
   - `cli/README.md:43-51` : le fan-out vise les forges self-hosted ; hors forge (GitHub…) =
     opt-in `pushOptInRemotes` dans `iakaframe.json` ; retirer l'exemple
     `--remotes origin,github` (l. 45) au profit de `--remotes origin,nas`.
   - `methode-de-travail.md:773-788` (§ Git par défaut) : ajouter un paragraphe « GitHub n'est
     pas un remote de la méthode : le CLI ne pousse jamais hors forge self-hosted sans opt-in
     projet (`iakaframe.json` → `pushOptInRemotes`) », avec la date et le motif (incident naonedge
     du 2026-09-26, sans aucun détail sur les données). `:848-851` : préciser « push vers les
     forges self-hosted ».
   - `library/skills/iakaframe-update/SKILL.md:29-30` : ajouter `--remotes` et la règle
     d'éligibilité ; § Garde-fous (l. 46-56) : « jamais de push hors forge self-hosted sans opt-in
     projet ; ne pas contourner par `git push github` à la main » ; l. 38-39 (procédure manuelle) :
     `git push origin` explicite au lieu de `git push` nu.
   - `kits/iakaframe-claude/global/CLAUDE.md:74-86` : une phrase après le § Forgejo LAN :
     GitHub hors méthode, opt-in projet explicite.
7. **Tests** : nouveau fichier `cli/test/remotes-eligibles.test.js` (framework `node --test`,
   `node:assert/strict`, calque des bancs `cli/test/canaux-fanout.test.js` et
   `cli/test/switch-flags-guard.test.js` : bare repos locaux, fausse forge `node:http` sur
   `127.0.0.1` avec la **même garde** `FORGEJO_URL` 127.0.0.1, `getStatus = 200` pour que `update`
   ne bascule pas). **Règle de sûreté du banc** : toute URL hors forge utilisée en E2E a un hôte
   en `.invalid` (RFC 2606) ; `github.com` n'apparaît **que** dans les tests de fonctions pures.
8. Lancer `npm test` dans `cli/` (suite complète), puis commits atomiques (lib, commandes, tests,
   doc) en conventional commits.

## Fichiers concernés

- `cli/src/lib/forgejo.js:20,82` — nouvel export `hotesForge()`.
- `cli/src/lib/canaux.js:44-56` — `hoteDeUrl`, `classerRemote`, `urlsDePush`, `lireOptIn`,
  `selectionnerCibles`, `resoudreCibles`, `formaterEcarts` (insérés après `listerRemotes`).
- `cli/src/commands/update.js:26,127-136` — sélection + écarts + code retour + `USAGE`.
- `cli/src/commands/onboard.js:18-36,165-174` — sélection + écarts + `USAGE`.
- `cli/src/commands/canaux.js:31,74-94` — sélection, écarts, JSON, `USAGE`.
- `cli/test/remotes-eligibles.test.js` — **nouveau**.
- `cli/README.md:43-51` — doc du fan-out.
- `methode-de-travail.md:773-788,848-851` — règle de méthode.
- `library/skills/iakaframe-update/SKILL.md:29-30,38-39,46-56` — procédure + garde-fous.
- `kits/iakaframe-claude/global/CLAUDE.md:74-86` — règle globale du kit.
- (conditionnel, point ouvert n° 5) `iakaframe.json` à la racine du dépôt iakaframe — **nouveau**,
  `{ "pushOptInRemotes": ["github"] }`.

## Risques

- **Régression silencieuse d'un miroir légitime** (ex. `nas` si `FORGEJO_URL` ne liste que le
  VPS) → mitigé : union `DEF_URLS` ∪ `cfgList()` ; et chaque écart est **nommé** en sortie.
- **Contournement par l'URL** (`pushurl`, `pushInsteadOf`, URL brute dans `--remotes`) → mitigé :
  classification sur `get-url --push --all` (expansions appliquées) + refus des noms non configurés ;
  tests dédiés.
- **Fuite de token dans les nouveaux messages** → mitigé : on n'affiche que nom + hostname ;
  test de forme `user:secret@` absent de la sortie (calque `canaux-fanout.test.js:152-154`).
- **Gardes existantes qui rougissent** sur des textes d'aide ou la forme JSON
  (`help-systemique.test.js`, `guard-json-couverture.test.js`, `test/fixtures/couverture-options.json`)
  → aucune option nouvelle n'est ajoutée ; si une garde rougit sur un texte, ajuster la fixture
  **dans ce lot** et le déclarer au gate, jamais affaiblir la garde.
- **Arrêt de l'alimentation du miroir GitHub du dépôt iakaframe** (vitrine / GitHub Actions) dès le
  prochain `update` → visible (ligne « ignore »), traité par le point ouvert n° 5.
- **Windows** : chemins `C:\...` classés en local par règle explicite ; non testable sur macOS
  au-delà de la fonction pure (test unitaire dédié).

## Critères d'acceptation

Fonctions pures (`cli/test/remotes-eligibles.test.js`) :
- [ ] CA-1 `hoteDeUrl` : `https://sjupin:tok@git.naonedge.com/sjupin/x.git` → hôte
  `git.naonedge.com` ; `git@github.com:iakasju/x.git` → `github.com` ; `ssh://git@github.com/a/b` →
  `github.com` ; `/tmp/bare`, `../bare`, `file:///tmp/bare`, `C:\depots\bare`, `C:/depots/bare` →
  local ; aucune valeur rendue ne contient le token.
- [ ] CA-2 `classerRemote` : hôte connu → `forge` ; `github.com` → `hors-forge` ; hôte inconnu →
  `hors-forge` ; liste vide → `hors-forge` ; deux URL dont une hors forge → `hors-forge`.
- [ ] CA-3 `selectionnerCibles` défaut : `origin`(forge), `nas`(forge), `github`(hors) sans
  opt-in → retenues `[origin, nas]`, `github` en `ecartees` motif `hors-forge-sans-opt-in`.
- [ ] CA-4 idem avec opt-in `['github']` → retenues `[origin, github, nas]` (ordre `ordonnerRemotes`).
- [ ] CA-5 explicite `['origin','github']` sans opt-in → retenues `[origin]`, `github` en
  `refusees` ; explicite `['https://x.invalid/y.git']` → `refusees` motif `remote-non-configure`.
- [ ] CA-6 `hotesForge()` contient `git.naonedge.com`, `192.168.1.139`, `192.168.2.11` même
  quand `FORGEJO_URL` ne vaut que `http://127.0.0.1:<port>`, et contient aussi `127.0.0.1`.

Bout en bout (`update` via `runCli`, fausse forge 127.0.0.1, bare locaux) :
- [ ] CA-7 **nominal** : `origin` et `nas` = bare locaux → les deux reçoivent ; aucune ligne
  `ignore` ; exit 0.
- [ ] CA-8 **github ignoré** : `origin` = bare, `github` = `https://hors-forge.invalid/x.git` →
  `origin` reçoit ; sortie contient `github ignore` et `hors-forge.invalid` ; **aucune** ligne
  `[OK] github` ni `[--] github` (preuve qu'aucun push n'a été tenté) ; exit 0.
- [ ] CA-9 **remote inconnu non-github** : `backup` = `https://autre-forge.invalid/x.git` → même
  traitement que CA-8.
- [ ] CA-10 **opt-in projet** : `iakaframe.json` = `{"pushOptInRemotes":["github"]}` → ligne
  `[--] github NON servi : injoignable` (preuve que la cible a été retenue et tentée) ; `origin`
  reçoit ; exit 0.
- [ ] CA-11 **opt-in par option seule** : `--remotes origin,github` sans opt-in projet → `origin`
  reçoit ; ligne `github REFUSE` ; aucun push tenté vers `github` ; **exit 1**.
- [ ] CA-12 **URL brute** : `--remotes https://hors-forge.invalid/x.git` → refusée
  (`remote-non-configure`), rien poussé, exit 1.
- [ ] CA-13 **aucun remote éligible** : seul `github` (hors forge) configuré → commit local créé,
  message `Aucun remote eligible`, aucun push tenté, exit 0.
- [ ] CA-14 **anti-contournement `pushurl`** : `origin` url = bare local, `pushurl` =
  `https://hors-forge.invalid/x.git` → `origin` écarté.
- [ ] CA-15 **anti-contournement `pushInsteadOf`** : `origin` url =
  `https://git.naonedge.com/sjupin/x.git` + `url."https://hors-forge.invalid/".pushInsteadOf "https://git.naonedge.com/"`
  (config locale du dépôt de test) → `origin` écarté, aucun push tenté.
- [ ] CA-16 **secret** : dans CA-8 à CA-15, la sortie ne matche jamais `/:\/\/[^\s/@:]+:[^\s/@*]+@/`.

Autres chemins :
- [ ] CA-17 **onboard** : dépôt avec `github` hors forge (`.invalid`) préexistant, onboard direct
  contre la fausse forge → ligne `github ignore`, aucune ligne `[..] github` de push.
- [ ] CA-18 **canaux** : `origin` bare + `github` `.invalid` → `github` listé comme ignoré, **non
  mesuré** (pas de ligne d'état pour lui) ; `--rattraper` n'agit que sur `origin` ; `--json`
  expose `ecartees` avec `{ nom: 'github', hote: 'hors-forge.invalid', motif: 'hors-forge-sans-opt-in' }`.
- [ ] CA-19 **garde du banc** : un test vérifie que toute URL hors forge des tests E2E a un hôte
  `.invalid` (calque `canaux-fanout.test.js:159-164`).

Non-régression et doc :
- [ ] CA-20 `npm test` dans `cli/` : suite complète verte, **y compris** `canaux-fanout.test.js`
  (contrefactuels inchangés : `pousserFanout` n'est pas modifié), `canaux-verbe.test.js`,
  `switch-flags-guard.test.js`.
- [ ] CA-21 `iakaframe update --help`, `onboard --help`, `canaux --help` mentionnent la règle
  d'éligibilité et `pushOptInRemotes` ; plus aucune mention « TOUS les remotes configures »
  dans `cli/src/` (grep vide).
- [ ] CA-22 `cli/README.md` ne contient plus `--remotes origin,github` ; `methode-de-travail.md`,
  `library/skills/iakaframe-update/SKILL.md` et `kits/iakaframe-claude/global/CLAUDE.md` énoncent
  la règle « GitHub hors méthode, opt-in projet ».
- [ ] CA-23 Aucun fichier modifié sous `frames/releases/`, `cli/_bundled/`, `.claude/worktrees/`
  (vérifié par `git diff --stat`).

## Estimation (au jalon P1→P2)

- **Équivalent jour-homme** : **~1 j-h** (fourchette 0,75 – 1,5) : lib + 3 commandes ≈ 0,3 ;
  tests (≈ 19 cas, dont E2E sur banc existant) ≈ 0,4 ; doc (5 fichiers) ≈ 0,15 ; gate et
  ajustement éventuel de gardes ≈ 0,15.
- **Complexité / risque** : complexité **faible à moyenne** ; risque **moyen** — changement de
  comportement **par défaut** d'un geste de sauvegarde quotidien, sur trois chemins de push, avec
  enjeu de confidentialité (un filtre trop large refait l'incident, trop strict prive un miroir).
- **Inconnues** : (a) gardes existantes sensibles aux textes d'aide ou à la forme JSON de
  `canaux` ; (b) comportement réel de `git remote get-url --push --all` sur les versions de git
  des postes (Windows notamment) ; (c) arbitrage du point ouvert n° 5 (miroir GitHub d'iakaframe).

## Points ouverts pour le décideur

1. **Critère d'éligibilité : destination réelle (hôte) ou nom du remote ?**
   Recommandation : **hôte** (retenu ci-dessus). Le nom est une étiquette locale : un `origin`
   pointant GitHub passerait un filtre nominatif, et un `pushurl` le contournerait. Alternative :
   liste nominative `origin,nas,iakabox` — plus simple, mais contournable.
2. **Remote inconnu non-GitHub (autre forge, hôte inconnu)** : exclu par défaut, comme GitHub ?
   Recommandation : **oui, exclu** (fail-safe, même opt-in). Alternative : poussé avec
   avertissement — rouvre la classe de risque de l'incident.
3. **`--remotes github` seul suffit-il comme opt-in (avec ou sans confirmation) ?**
   Recommandation : **non** — seul l'opt-in versionné dans `iakaframe.json` ouvre un remote hors
   forge ; `--remotes` ne fait que restreindre. Raison : les agents lancent `update` en
   non-interactif ; une option tapée par un agent n'est pas une décision humaine. Alternative :
   `--remotes` hors forge accepté avec confirmation o/N en TTY et refusé en non-interactif.
4. **Code retour d'un refus explicite** : recommandation **exit 1** (la demande n'a pas été
   servie), les cibles retenues étant tout de même poussées. Alternative : exit 0 + ligne
   `REFUSE`.
5. **Dépôt iakaframe lui-même** : il porte un remote `github` (`iakasju/iakaframe`, miroir qui
   alimente la vitrine / GitHub Actions). Sans opt-in, le prochain `update` d'iakaframe cessera de
   le nourrir (visiblement). Recommandation : **ajouter dans ce lot** `iakaframe.json` à la racine
   d'iakaframe avec `{"pushOptInRemotes": ["github"]}`, en commit séparé — à condition que ce
   miroir reste voulu. Alternative : ne rien faire et pousser GitHub à la main quand une release
   le demande.
6. **Suite pour les ~45 dépôts à remote `github`** : hors périmètre ici (aucune modification de
   remote). Une fois ce lot livré, ils cessent de recevoir sans action ; le retrait des remotes
   `github` (ou leur opt-in) relève d'un inventaire séparé, à décider.

## Sources (vérifiées le 2026-09-27)

- Git, `git remote get-url` : « `--push` : push URLs are queried rather than fetch URLs » ;
  « `--all` : all URLs for the remote will be listed » ; « Configurations for `insteadOf` and
  `pushInsteadOf` are expanded here. » — https://git-scm.com/docs/git-remote
- RFC 2606 (TLD `.invalid` garanti non résoluble), déjà invoquée par le banc existant
  `cli/test/canaux-fanout.test.js:26-36`.
