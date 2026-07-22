# Instruction — Éteindre les 40 fuites bloquantes du miroir `StefFrame2` (instance + cause)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli** (P2). Statut en fin de doc.
> **Amendée** (2026-07-22, post-jalon P1→P2) : arbitrages **D1–D4 tranchés** par le décideur (voir
> §5) + intégration du volet **`iakaIDE` → `iakacockpit`** (rename **au canon** d'un nom périmé,
> puis tokenisation au miroir — §4.1, §6, §7).
> Réf. : `specs/instructions/outillage-scrub-miroir-frame.md` (le DÉTECTEUR — gates G1→G6),
> `specs/instructions/resync-stefframe2-miroir-live.md` (§4.2 table de mapping d'anonymisation),
> `specs/instructions/frame-stefframe2.md` (§5/§11 gate différencié corpus/`cli/`),
> `specs/instructions/audit-frame.md` (A3.1 outil `iakaframe-frame`, B1.2 vérif intégrité).
> Code lu : `cli/src/lib/frame.js` (gates), `cli/src/commands/frame.js` (verbe),
> `cli/src/commands/update.js:29` (l'avertissement récurrent).

---

## 1. Besoin (reformulé)

À chaque `iakaframe update`, le CLI émet un avertissement **non bloquant** :

> `! AVERTISSEMENT : le miroir StefFrame2 porte 40 fuite(s) bloquante(s).`
> `detail : iakaframe frame verify --frame frames/releases/StefFrame2`

Source de l'avertissement : `cli/src/commands/update.js:27-31` (appelle `verifyFrame()` sur chaque
dossier de `frames/releases/`, affiche sans jamais bloquer — le blocage réel vit dans
`cli/test/frame-verify.test.js`, cf. update.js:11-18).

Le décideur veut **comprendre** ces 40 fuites et les **résoudre** : éteindre l'instance (ramener
`frame verify` à **0 fuite bloquante**) **et** traiter la cause (empêcher qu'elles reviennent).

**Ce cadrage est la suite directe** d'`outillage-scrub-miroir-frame.md`, qui a **construit le
détecteur** (`frame verify`, gates G1→G6) et a explicitement **exclu la correction** de son
périmètre (§8 HORS : « Corriger les 86 occurrences : ce lot livre le **détecteur**, pas la
**correction** »). Les 40 fuites bloquantes sont **précisément ce que ce détecteur détecte
aujourd'hui**. Ce lot **corrige**.

---

## 2. Les faits — nature exacte des 40 fuites (établie sur pièces, non sur mémoire)

### 2.1 Ce que `frame verify` mesure (lu dans `cli/src/lib/frame.js`)

6 gates. **5 bloquants** (G1→G5) + **1 avertissement** (G6, jamais compté dans le verdict).
Le total **40 = somme des findings bloquants** (chaque occurrence = 1 finding).

| Gate | Classe | Mécanisme | Sévérité |
|---|---|---|---|
| G1 | Secrets & infra | motifs **structurels** : IP privée, creds-en-URL, chemin home absolu, PEM, JWT | BLOQUANT |
| G2 | Marque / portefeuille | **allowlist** `{iaka, iakaframe, iakastart, iakalog}` — tout autre `iaka*` **collé** échoue ; `iakaide` **toléré uniquement sous `cli/`** | BLOQUANT |
| G3 | Identité du décideur | `stéphane` / `sjupin`, casse-insensible, **y compris en position de regex exécutée** | BLOQUANT |
| G4 | Couche produit & refs pendantes | skill `layer: product` au miroir ; `skills/subskills/principleIds` pendants | BLOQUANT |
| G5 | Ports d'infra | port hors allowlist `{22,80,443,3000,5173,8000,8080,3306,5432,6379,8188,11434}`, forme mot-clé (`port: N`) **ou** hôte:port collé (`:NNNN`) | BLOQUANT |
| G6 | Noms propres résiduels | CamelCase / capitale-en-prose, hors dictionnaire | avertissement |

### 2.2 Décompte des 40 — reconstruit gate par gate (le total tombe **exactement** sur 40)

> Méthode : `Bash` indisponible cette session. Chaque gate a été **rejoué au grep** sur
> `frames/releases/StefFrame2/` en appliquant la logique exacte de `frame.js`. **La somme
> reconstruite = 40**, ce qui valide la reconstruction contre le compteur du CLI.

| Gate | Findings | Détail |
|---|---:|---|
| **G1** | **0** | Aucun secret, IP privée, chemin absolu, PEM ni JWT. Le seul `/Users/` du miroir est `.../hooks/perimeter-guard.mjs:193` `/Users/<user>/…` — **non matché** (le placeholder `<user>` casse `RE_HOME_PATH`). |
| **G2** | **32** | `iakagraph` ×14 · `iakaHub` ×11 · `iakaide` (hors `cli/`) ×7 — détail §2.3 |
| **G3** | **3** | `cli/src/lib/consolidate.js:111` (×2 : « Stephane » + `stephane-*`) · `:115` (`/^stephane-/`) |
| **G4** | **0** | Aucune skill `layer: product` au miroir ; aucune référence pendante. |
| **G5** | **5** | `services.js:11` `port: 3001` · `:4001` ×3 (MODELES openwebui/codex/anythingllm) · `methode-de-travail.md:608` `:3041` — détail §2.3 |
| **TOTAL bloquant** | **40** | ✅ correspond au compteur `update.js` |

> **G6 (avertissement, HORS des 40)** : `Hermes` (~21, service n8n privé) et divers CamelCase.
> Non bloquant par construction — **hors scope de ce lot** (voir §6 « Points ouverts »). C'est ce
> qui explique l'écart avec les « 86 occurrences » d'`outillage-scrub-miroir-frame.md` §2.1 : les 86
> incluaient `Hermes` (G6) et des `iakaide` **tolérés dans `cli/`**.

### 2.3 Exemples concrets (chemin:ligne) et classement par catégorie

**Catégorie A — Nom de produit portefeuille `iakaHub` (G2, 11 occ., 1 fichier)**
Section entière ajoutée au canon **après** l'anonymisation initiale :
- `frames/releases/StefFrame2/methode-de-travail.md:552-614` — titre `## Communication externe du
  portefeuille — iakaHub ↔ Discord`, décrit une **infra privée** (Discord, canaux `#odin`, runner
  headless, ports `:3041`/`:4001`, `config/routing.yaml`). 11 occurrences de `iakaHub`.

**Catégorie B — Dépôt d'études portefeuille `iakagraph` (G2, 14 occ., 8 fichiers × 3 copies)**
- `personas/loki.md:47,49,52` (×3) + `library/personas/loki.md` + `kits/…/agents/loki.md` (les 3
  copies) ; `personas/aragorn.md:75` (+2 copies) ; `roles/design.md:14` (+1 copie).

**Catégorie C — Produit portefeuille `iakaIDE` HORS `cli/` (G2, 7 occ.)**
> **Nom périmé — traitement particulier (voir §4.1 / §5, décision D-iakaIDE)** : contrairement à
> `iakaHub`/`iakagraph` (noms **valides** du portefeuille, seulement tokenisés au miroir), `iakaIDE`
> est **obsolète côté canon** — le nom vivant est **`iakacockpit`** (dépôt `~/work/IakaCockpit`,
> cf. `library/skills/iakaframe-appflowy-doc/SKILL.md:62`). Cette catégorie relève donc de la classe
> « **rename au canon + tokenisation au miroir** », pas de la simple tokenisation miroir.
> Rappel : `iakaide` est **toléré dans `cli/`** (`BRAND_TOLERATED`, arbitrage décideur
> `outillage…` §9.2) — **en tant qu'alias de runner legacy déprécié**, distinct du nom de produit
> (voir §6 HORS). Hors `cli/`, il **bloque** :
- `library/skills/iakaframe-log-conversation/SKILL.md:32` `--royaume iakaide` (+ 2 copies : `skills/`
  flat, `kits/…/.claude/skills/`) = **3**.
- `kits/iakaframe-codex/README.md:53,55,57` (section teaser « iakaIDE — à venir ») = **3**.
- `kits/iakaframe-ollama/README.md:42` (`## iakaIDE`) = **1**.

**Catégorie D — Identité du décideur dans du CODE (G3, 3 occ.)**
- `cli/src/lib/consolidate.js:111` (commentaire « qui est **Stephane** » + motif `stephane-*`),
  `:115` (`if (/^stephane-/.test(fiche.name)) return 3;`) — un **littéral de regex exécuté**, pas de
  la prose. C'est exactement l'écart que l'ancien scrub prose-only ratait (`outillage…` §4.1, G3).

**Catégorie E — Ports d'infra privée (G5, 5 occ.)**
- `cli/src/commands/services.js:11` `port: 3001` (Forgejo privé).
- `kits/iakaframe-openwebui/MODELES.md:29`, `kits/iakaframe-codex/MODELES.md:40`,
  `kits/iakaframe-anythingllm/MODELES.md:24` : `http://<box>:4001/v1` (LiteLLM privé — l'hôte est
  déjà anonymisé `<box>`, **le port 4001 ne l'est pas**).
- `frames/releases/StefFrame2/methode-de-travail.md:608` `:3041` (admin/health privé — **appartient
  à la section iakaHub** de la catégorie A).

---

## 3. Origine — tranchée sur pièces : **rupture de PARITÉ, pas fuite de secrets**

Les deux hypothèses du mandat :

- **(b) Secrets / chemins absolus / IP / données machine** → **RÉFUTÉE**. **G1 = 0**. Le miroir ne
  porte **aucun** token, IP privée, chemin home absolu, clé ni JWT. La passe d'anonymisation
  historique (`resync…` §2.2, `frame-stefframe1` §9) a bien retiré cette classe : elle **tient**.
- **(a) Rupture de parité source↔miroir** → **CONFIRMÉE, elle domine à 100 %**. Les 40 fuites sont
  toutes des **noms/valeurs du portefeuille légitimes dans le CANON** qui ont **traversé sans être
  transformés** :

| Token | Présent au CANON (source) | Preuve |
|---|---|---|
| `iakaHub` | oui (14 occ.) | `methode-de-travail.md` (racine) contient la même section |
| `iakagraph` | oui (3 occ. / fichier) | `library/personas/loki.md` |
| `iakaide` | oui | `library/skills/iakaframe-log-conversation/SKILL.md:33` `--royaume iakaide` |
| `port: 3001` | oui | `cli/src/commands/services.js:34` |
| `stephane-` | oui | même `consolidate.js` |

**Mécanisme exact** : `StefFrame2` est un **miroir anonymisé monté à la main** (aucun générateur —
`resync…` §2.1, audit B1.2). Du contenu neuf a été ajouté au canon **après** la passe
d'anonymisation initiale (la section `iakaHub` de `methode-de-travail.md`, les renvois `iakagraph`
de Loki/Aragorn, les teasers `iakaIDE` des kits), puis **propagé au miroir sans lui ré-appliquer la
transformation**. C'est **exactement** le scénario que `outillage…` §1 prédisait : « un nom propre
créé après la rédaction de la liste traverse une fois » → « une fuite garantie à terme ». Le
détecteur `frame verify`, lui, **fait son travail** : il attrape ces noms **futurs** par allowlist.

> **Conséquence décisive sur la règle de correction** (§4) : le remède générique imprimé par
> `frame verify` — « corriger à la **SOURCE (le canon)** puis re-propager » (`frame.js` render,
> `frame.js:125`) — **ne s'applique PAS de la même façon aux noms de marque G2**. Deux sous-classes :
> — `iakaHub` et `iakagraph` sont **légitimes dans le canon** (vrais noms du portefeuille — le canon
> **doit** les garder) : correction **nécessairement côté miroir** (tokenisation).
> — `iakaIDE` est un **nom périmé** : le nom vivant est `iakacockpit`. Ici le canon **doit changer**
> (rename `iakaIDE` → `iakacockpit`), puis le miroir tokenise le nom corrigé. Ce n'est donc **pas**
> qu'une transformation miroir — c'est aussi une **correction de fond au canon** (voir §4.1).
> Le « fix au canon » vaut par ailleurs pour les **forks/valeurs d'infra** (ports, prefix d'identité)
> qui gagnent à devenir **neutres-par-défaut au canon** (classes D/E).

---

## 4. Règle de réconciliation — INSTANCE vs CAUSE

### 4.1 Traitement de l'INSTANCE (éteindre les 40) — deux flux distincts

**Flux 1 — Transformation CÔTÉ MIROIR** (classes A, B, C). **Deux sous-classes**, désormais
tranchées (§5) — elles ne se traitent PAS pareil :

- **(i) Tokenisation miroir seule** — `iakaHub`, `iakagraph` : noms **valides** du portefeuille,
  **inchangés au canon**, seulement remplacés par un token générique au miroir.
- **(ii) Rename canon + tokenisation miroir** — `iakaIDE` : nom **périmé** (le nom vivant est
  `iakacockpit`). Le canon est **d'abord renommé** `iakaIDE` → `iakacockpit`, **puis** le nom
  corrigé est tokenisé au miroir (même traitement générique que le (i)).

Étend la table de mapping de `resync…` §4.2 avec les **nouveaux** tokens (elle ne les couvrait pas).
Vocabulaire **tranché** (D2) — tokens courts génériques alignés sur la convention existante
(`<box>`, `<user>`, `<GIT_HOST>`) :

| Token miroir | Sous-classe | Règle **tranchée** | Justification |
|---|---|---|---|
| `iakaHub` (section §552-614) | (i) tokenisation | **TOKENISER** `<hub>` (D1 — **pas** de retrait) ; la section est conservée, `iakaHub` → `<hub>` et ses ports privés `:3041`/`:4001` → tokens de port (cf. cat. E) | Le décideur garde la section (elle décrit une capacité du portefeuille) mais anonymise nom + ports. |
| `iakagraph` | (i) tokenisation | **TOKENISER** `<graph>` (prose) | Nom de dépôt d'études mutualisé ; placeholder générique. Nom **valide au canon**, inchangé. |
| `iakaIDE` (kits, teasers, `## iakaIDE`) | (ii) rename+token | **RENAME au canon** `iakaIDE` → `iakacockpit`, **puis TOKENISER** au miroir `<ide>` | Nom **périmé** : le vrai nom vivant est `iakacockpit`. Le miroir ne doit porter **ni** `iakaIDE` **ni** `iakacockpit` en clair. |
| `iakaide` (exemple `--royaume`, log-conv) | (ii) rename+token | Au canon, la valeur d'exemple suit le rename (`iakacockpit`) ; au miroir **TOKENISER** `<ide>` | Valeur d'exemple de `--royaume` désignant le produit ; neutre au miroir. |

> **Périmètre du rename (ii) — précision de bornage.** Le rename `iakaIDE` → `iakacockpit` vise le
> **nom de produit** (l'app desktop, en prose/teasers/kits/README). Il **exclut** l'**alias de runner
> `iakaide`** (launcher legacy **déprécié**, tables `vocab.js`/`config.js`/`go.js`/tests sous `cli/`,
> toléré par G2) : c'est un **identifiant de compatibilité**, pas le nom vivant, et le retirer est un
> chantier distinct à contrat/tests (voir §6 HORS + §9 inconnues).

**Flux 2 — Neutralisation AU CANON** (bénéficie canon **et** miroir) : classes D, E. **Tranché
(D3 = au canon).** Aligné sur `outillage…` **Lot 0** (remontée d'env vars au canon) — même doctrine :

| Fuite | Règle **tranchée** | Portée |
|---|---|---|
| `services.js` `port: 3001` | port Forgejo **piloté par env / neutre** (comme `IAKAFRAME_HOSTS` de `outillage…` Lot 0) | **canon**, miroir hérite |
| `consolidate.js` `stephane-*` (G3) | préfixe de profil **config-driven** (placeholder, plus de prénom en dur dans la regex) | **canon**, miroir hérite |
| MODELES `:4001` (LiteLLM) | port générique `<box>:<port>` ou défaut public | kits (miroir ; canon si le kit est canonique) |

> **Note d'exécution** : Flux 2 touche du **code canon** couvert par des tests
> (`consolidate.test.js`, `services`) → **risque de régression** (cf. estimation §7). Le
> comportement par défaut pour le décideur doit rester **inchangé** (documenté : renseigner la
> valeur via env/config), exactement comme `outillage…` critère C3.

### 4.2 Traitement de la CAUSE (empêcher la récidive) — MVP = détection, générateur = HORS

La cause profonde — **miroir monté à la main, sans transformation ré-appliquée à la propagation** —
a **deux niveaux de réponse** :

- **Niveau MVP (DANS ce lot)** — la **détection** est déjà outillée : `frame verify` existe, le
  blocage vit dans `cli/test/frame-verify.test.js`, et `update` avertit. Ce lot **verrouille** cet
  acquis : après correction, un **cas de non-régression** dans `frame-verify.test.js` affirme que
  `verifyFrame(StefFrame2)` rend **0 bloquant**, et la **table de mapping étendue** (§4.1) est
  **documentée** dans le frame (`resync…` §9, doc de mapping). La silencieuse dérive devient un
  **échec de test visible** dès qu'un `iakaHub`-like reparaît. C'est de la **détection durcie**, pas
  de la prévention automatique — et c'est le bon MVP.
- **Niveau DURABLE (HORS ce lot)** — la **prévention** réelle = un **générateur de frame**
  (`iakaframe frame release`/build) qui **régénère le miroir depuis le canon en appliquant une table
  de scrub persistée** (audit A3.1, `resync…` §9, `outillage…` §8). Il supprime la transformation
  manuelle oubliable. **HORS** : c'est un chantier à cadrer séparément, **bloqué** par la refonte de
  doctrine de mapping en couches (`outillage…` §2.3, collision `iakaframe-git`).

---

## 5. Décisions structurantes — **TRANCHÉES par le décideur** (jalon P1→P2, 2026-07-22)

- **D1 — Section `iakaHub` → TOKENISER** (placeholder générique `<hub>`, **pas** de retrait). La
  section est **conservée** ; `iakaHub` → `<hub>` et ses ports privés `:3041`/`:4001` → tokens de
  port. *(Renverse la reco Gandalf « retrait » : le décideur garde la section.)*
- **D2 — Vocabulaire : reco Gandalf validée**, avec tokens courts génériques alignés sur la
  convention de l'instruction : `iakaHub → <hub>`, `iakagraph → <graph>`, `iakaIDE/iakacockpit →
  <ide>`. *(cf. table §4.1)*
- **D3 — Classes D+E (identité + ports) → correction AU CANON.** `services.js` (port Forgejo) et
  `methode-de-travail.md` (ports privés) neutralisés **au canon** (env/config, neutre-par-défaut) ;
  le miroir hérite. Risque de régression `consolidate.test.js`/`services` **assumé**.
- **D4 — Prévention : MVP détection durcie MAINTENANT** ; le **générateur de frame reste HORS
  scope** (cadrage séparé, bloqué par `outillage…` §2.3).
- **D-iakaIDE — `iakaIDE` est un nom PÉRIMÉ ; le nom vivant est `iakacockpit`** (remarque
  structurante du décideur). Conséquences **tranchées** :
  1. **Au CANON** : remplacer `iakaIDE` → `iakacockpit` (correction de fond, pas seulement miroir),
     **sauf** l'alias de runner legacy `iakaide` sous `cli/` (identifiant de compat — HORS, §6).
  2. **Au MIROIR** : c'est `iakacockpit` (nom corrigé) qui est **TOKENISÉ** `<ide>` — même
     traitement générique qu'`iakaHub`/`iakagraph`.
  3. `iakaHub` et `iakagraph` **restent des noms valides** du portefeuille (inchangés au canon,
     tokenisés au miroir).
- **D5 — G6 `Hermes` (~21, avertissement)** : **backlog** (non bloquant ; le fusionner masquerait la
  frontière instance/cause). *(Documentaire — hors des 40.)*

---

## 6. Périmètre — DANS / HORS

**DANS**
- Éteindre les **40 fuites bloquantes** (G2=32, G3=3, G5=5) selon §4.1, dans **toutes les copies**
  concernées (flat `/`, `library/`, `kits/…/.claude/`, `kits/iakaframe-*/`).
- **Rename au canon `iakaIDE` → `iakacockpit`** (D-iakaIDE) sur les références au **nom de produit**
  hors zones tolérées (kits READMEs/teasers `kits/iakaframe-codex/README.md:53,55,57`,
  `kits/iakaframe-ollama/README.md:42` ; skill exemple `library/skills/iakaframe-log-conversation/
  SKILL.md:33` + ses copies flat `skills/` et `kits/iakaframe-claude/.claude/skills/`), **puis**
  tokenisation `<ide>` au miroir. **Exclut** l'alias de runner legacy `iakaide` sous `cli/` (HORS).
- Étendre + **documenter** la table de mapping d'anonymisation (`resync…` §4.2 + les nouveaux
  tokens `<hub>`/`<graph>`/`<ide>`) dans le frame.
- Verrouiller la non-régression : cas dans `cli/test/frame-verify.test.js` affirmant
  `verifyFrame(frames/releases/StefFrame2)` → **0 bloquant**.
- **D3 (tranché = au canon)** : neutraliser `services.js` port 3001 et `consolidate.js` préfixe
  d'identité **au canon**, comportement par défaut décideur **inchangé**.

**HORS**
- **Le générateur `iakaframe frame release`/build** (prévention durable) → cadrage séparé, bloqué
  par `outillage…` §2.3.
- **Les avertissements G6** (`Hermes` etc.) — non bloquants (D5 → backlog).
- **Toute réécriture automatique** du miroir (`scrub --fix`) — proscrite (`frame.js:17`,
  `outillage…` §5 : le gate constate, ne réécrit pas).
- **Rattrapage du delta de contenu** (skills/principes manquants) — c'est `resync…` / Lot 2, pas ce
  lot.
- **Le sous-arbre `cli/`** au-delà des 2 fuites nommées (D3) : le `forgejo` fonctionnel et
  `iakaide` sous `cli/` restent tolérés (`frame-stefframe2` §5.1).
- **Le retrait / rename de l'alias de runner legacy `iakaide`** (déprécié — `vocab.js`,
  `config.js`, `go.js`, `index.js`, tests `vocab-parity`/`banner`, `docs/commandes.md`) : c'est un
  **identifiant de compatibilité**, pas le nom de produit `iakaIDE`. Le retirer/renommer touche un
  contrat d'alias couvert par tests → **chantier distinct** (à cadrer si besoin), non déclenché ici.
- **Les occurrences `iakaIDE` dans les `specs/instructions/*.md`** (archives de cadrage, **non
  miroir** — `frames/releases/StefFrame2/specs/` n'existe pas) : record historique, **non renommé**.

---

## 7. Critères d'acceptation (pass/fail, testables)

- **C1** — `node cli/src/index.js frame verify --frame frames/releases/StefFrame2` sort **0** et
  affiche `OK - N fichiers, 0 fuite bloquante`. (Aujourd'hui : `FUITE - 40`.)
- **C2** — `--json` : `{ ok:true, findings:[] }` **pour les gates bloquants** (G1→G5 vides ; G6
  peut rester non vide, non bloquant).
- **C3** — Par gate : **G2 = 0**, **G3 = 0**, **G5 = 0** (constatés via `--verbose` ou `--json`).
- **C4** — Après `iakaframe update`, l'avertissement `update.js:29` **ne s'affiche plus** pour
  `StefFrame2`.
- **C5** — Non-régression détecteur : `cli/test/frame-verify.test.js` comporte un cas affirmant que
  le **miroir réel** rend **0 bloquant** ; la suite CLI reste verte (≥ nombre de tests actuel, 0
  fail) ; `vendor-check` inchangé.
- **C6** — Anonymisation préservée : gate corpus strict de `frame-stefframe2` §11-A et le gate
  `cli/` §11-B restent **0** ; **aucun** `sjupin`/`192.168`/`naonedge` réintroduit (G1 reste 0).
- **C7** — Mapping **documenté** : la table §4.1 (nouveaux tokens) figure dans la doc de mapping du
  frame (`resync…` §9) — un futur exécutant sait quelle règle appliquer.
- **C8** — D3 (au canon) : `services.js`/`consolidate.js` du **canon** ne portent plus de port privé
  en dur ni de prénom en regex ; `consolidate.test.js` **vert** ; comportement par défaut décideur
  **inchangé** (env/config documentée).
- **C9** — Copies alignées : le token corrigé est absent des **3 emplacements** (flat / `library/` /
  kit) — aucune copie oubliée (piège de la triple duplication, audit B2.1).
- **C10** — **Rename canon** : `grep -rn 'iakaIDE'` sur le **canon hors zones tolérées** (`cli/`
  alias runner, `specs/instructions/`) rend **0** ; les références au **nom de produit** portent
  désormais `iakacockpit`. L'alias de runner `iakaide` sous `cli/` est **conservé** (inchangé).
- **C11** — **Miroir sans nom en clair** : le miroir `StefFrame2` ne porte **ni** `iakaIDE`/`iakaide`
  (hors `cli/` toléré) **ni** `iakacockpit` en clair — tokenisés `<ide>` ; de même `iakaHub` → `<hub>`
  et `iakagraph` → `<graph>` (0 occurrence en clair au miroir, toutes copies). `grep -rn
  'iakacockpit\|iakaHub\|iakagraph'` sur le miroir hors `cli/` = **0**.

---

## 8. Situation vs l'existant (pour ne pas re-cadrer)

| Instruction | Rôle | Rapport à CE lot |
|---|---|---|
| `outillage-scrub-miroir-frame.md` | construit le **DÉTECTEUR** (`frame verify` G1→G6), Lot 0 env vars | **Amont.** Ce lot est la **CORRECTION** qu'`outillage…` §8 a explicitement laissée HORS. |
| `resync-stefframe2-miroir-live.md` | delta de **contenu** (2 principes + `retrait`) + table §4.2 | **Voisin.** On **étend sa table** de mapping ; on ne retouche pas son delta. |
| `frame-stefframe2.md` | recette de build + gate différencié corpus/`cli/` | **Contrat de gate** respecté (§11). |
| `audit-frame.md` | A3.1 outil `iakaframe-frame`, B1.2 vérif intégrité | **Cause durable (générateur) = HORS**, renvoyée à ce chantier. |

---

## 9. Estimation dev (gate P1→P2)

> **Réajustée après arbitrages** (D1 = tokeniser, +rename canon `iakaIDE`→`iakacockpit`) : le
> `+0,3 j` de tokenisation de la section §552-614 (jadis inconnue si le décideur refusait le retrait)
> est désormais **acté dans le socle**, et le rename canon ajoute ~0,2 j. Estimation relevée en
> conséquence.

| Composante | Valeur |
|---|---|
| **Équivalent jour-homme** | **1,5 à 2 j-h** (spec fermée, arbitrages D1–D4 tranchés). Détail : tokenisation miroir A/B/C (`<hub>`/`<graph>`/`<ide>`, section §552-614 réécrite, ×3 copies) ≈ 0,6 j · **rename canon `iakaIDE`→`iakacockpit`** (références produit + copies, hors alias runner) ≈ 0,2 j · neutralisation canon D+E ≈ 0,4 j · test de non-régression + doc mapping ≈ 0,4 j. |
| **Complexité / risque** | **Faible à moyenne.** Le geste est mécanique (remplacement/tokenisation + grep de contrôle). Risques réels : **toucher le code canon** (D3) couvert par `consolidate.test.js`/`services` → régression possible ; le **piège de la triple copie** (oublier un des 3 emplacements → fuite survivante, audit A3.6) ; et **confondre le nom de produit `iakaIDE` avec l'alias de runner `iakaide`** (ce dernier est HORS — ne pas le renommer, sous peine de casser le contrat d'alias/tests `vocab-parity`). |
| **Inconnues (peuvent faire glisser)** | (a) **D3 = canon** : la remontée env/config de `consolidate.js` peut demander un petit contrat de config (**+0,3 j**). (b) Occurrences `iakaHub`/`iakacockpit` **résiduelles** hors les emplacements vus au grep de cadrage (liens croisés) — à re-scanner à l'exécution. (c) **Frontière produit ↔ alias runner** : si le décideur souhaite finalement retirer aussi l'alias legacy `iakaide` sous `cli/`, c'est un lot distinct (**+1 à 1,5 j** + tests). |

**Lot suivant (HORS), ordre de grandeur** : le **générateur `iakaframe frame release`** (cause
durable) = **2 à 3 j-h**, précédé de la refonte de doctrine de mapping en couches (`outillage…`
§2.3). À cadrer séparément.

> Ce n'est **pas un engagement ferme** : ordre de grandeur assumé et révisable, à confronter au
> temps réel à la clôture du lot.

---

## 10. Jalon (gate humain P1→P2)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `frame-stefframe2-fuites.md` : 40 fuites établies gate par gate (G2=32, G3=3, G5=5 ; G1=G4=0), origine tranchée (**rupture de parité, pas de secrets**), règle de réconciliation instance (tokenisation miroir A/B/C + **rename canon `iakaIDE`→`iakacockpit`** + neutralisation canon D/E) + cause (détection durcie MVP, générateur HORS), critères C1→C11, **estimation 1,5–2 j-h** | 🟢 Le décideur (Stéphane) → **VALIDÉ** (D1–D4 + volet iakacockpit) → dispatch **Gimli** |

**Fichiers à vérifier avant validation (chemin:ligne)** :
- Le compteur : `cli/src/commands/update.js:29` (l'avertissement) ; `cli/src/lib/frame.js:383`
  (`verifyFrame`), `frame.js:36` (allowlist G2), `frame.js:43` (tolérance `iakaide` sous `cli/`).
- Cat. A `iakaHub` : `frames/releases/StefFrame2/methode-de-travail.md:552` (section entière).
- Cat. B `iakagraph` : `frames/releases/StefFrame2/library/personas/loki.md:47`.
- Cat. C `iakaIDE` hors `cli/` : `frames/releases/StefFrame2/kits/iakaframe-codex/README.md:53` ;
  `frames/releases/StefFrame2/library/skills/iakaframe-log-conversation/SKILL.md:32`.
- Cat. D identité (code) : `frames/releases/StefFrame2/cli/src/lib/consolidate.js:115` (`/^stephane-/`).
- Cat. E ports : `frames/releases/StefFrame2/cli/src/commands/services.js:11` (`port: 3001`) ;
  `frames/releases/StefFrame2/methode-de-travail.md:608` (`:3041`).
- Preuve de parité (canon) : `methode-de-travail.md:554` (iakaHub) ; `library/personas/loki.md:47`
  (iakagraph) ; `cli/src/commands/services.js:34` (`port: 3001`).
- Doctrine de correction : `cli/src/lib/frame.js:125` (« corriger à la SOURCE » — **ne vaut pas pour
  les noms de marque légitimes au canon**, cf. §3).

---

## Statut

**JALON VALIDÉ (2026-07-22) — prêt pour exécution Gimli (P2).** Arbitrages **D1–D4 gravés** (D1 =
tokeniser `<hub>` ; D2 = tokens `<hub>`/`<graph>`/`<ide>` ; D3 = correction au canon ; D4 = MVP
détection, générateur HORS) + volet **`iakaIDE` → `iakacockpit`** (rename au canon + tokenisation
miroir `<ide>`). D5 (Hermes) = backlog. Dispatch **Gimli** pour §4.1/§4.2 (MVP), critères C1→C11.
