# Instruction — Réconcilier la forme de `services.json` (CLI ↔ `iakaframe-services.ps1`)

> Cadrée par **Gandalf** (P1 — Cadrage). Exécution : **Gimli**. Statut en fin de doc.
> Réf. : `specs/instructions/cli-api-surface-harmonisation.md` (convention « C-JSON », § 2/§ 3/§ 4),
> `cli/src/lib/output.js` (source unique de la convention), gate C-JSON où Legolas a signalé le point.

---

## 1. Besoin (reformulé)

Un même fichier de vocation unique — `services.json` (rapport de détection Forgejo/Ollama/ComfyUI
sur des hôtes candidats) — a **deux producteurs** qui écrivent **deux formes différentes** :

- le **CLI Node** (`iakaframe services --out <fichier>`) écrit l'enveloppe **C-JSON** :
  `{ ok, generated, count, services }` ;
- le **producteur PowerShell** (`iakaframe-services.ps1 -Json <fichier>`) écrit encore la forme
  **legacy** : `{ generated, services }` (sans `ok`, sans `count`).

Aucun consommateur n'est cassé aujourd'hui (voir § 2.3 : il n'existe **aucun** lecteur), mais
c'est une **dette de cohérence** : deux artefacts homonymes de schéma divergent. Objectif :
**une seule forme canonique** pour `services.json`, quel que soit le producteur.

---

## 2. Ce qui existe — constat vérifié (lecture seule)

### 2.1 Producteur CLI — déjà C-JSON, sur disque comme sur stdout

`cli/src/commands/services.js` construit **un seul** payload et l'écrit à l'identique dans le
fichier `--out` **et** sur stdout :

```js
const payload = ok({ generated, count: results.length, services: results });   // L52
// ...
if (values.out) fs.writeFileSync(values.out, JSON.stringify(payload, null, 2), 'utf8'); // L58
emit(values.json, payload, /* rendu humain */);                                 // L61
```

`ok()` (`cli/src/lib/output.js` L14-16) garantit `ok:true` en **première clé**. Forme du fichier :

```json
{
  "ok": true,
  "generated": "2026-07-18 14:30",
  "count": 3,
  "services": [
    { "service": "git (Forgejo)", "available": true, "host": "...", "port": 3001, "url": "http://...:3001", "detail": "v..." },
    { "service": "Ollama",        "available": false, "host": "",    "port": 11434, "url": "",              "detail": "" },
    { "service": "ComfyUI",       "available": false, "host": "",    "port": 8188,  "url": "",              "detail": "" }
  ]
}
```

> Conséquence : **le fichier-sur-disque du CLI est déjà la forme C-JSON canonique.** `--json` est
> un booléen (stdout), `--out` un chemin de sortie (fichier) — la migration voulue par
> `cli-api-surface-harmonisation.md` § 8 est **faite** côté Node.

### 2.2 Producteur ps1 — forme legacy (écart = enveloppe seulement)

`iakaframe-services.ps1` L99-107 :

```powershell
if ($Json) {
  # ...
  $payload = [ordered]@{
    generated = (Get-Date -Format "yyyy-MM-dd HH:mm")
    services  = $results
  }
  # ConvertTo-Json -Depth 5 -> { "generated": "...", "services": [...] }
}
```

Comparaison terme à terme avec le CLI :

| Champ | CLI (`--out`) | ps1 (`-Json`) | Écart |
|---|---|---|---|
| `ok` | `true` (1re clé) | **absent** | **à ajouter** |
| `generated` | `"yyyy-MM-dd HH:mm"` | `"yyyy-MM-dd HH:mm"` | **identique** (aucune touche) |
| `count` | `results.length` | **absent** | **à ajouter** |
| `services[]` | service/available/host/port/url/detail | mêmes clés, mêmes types | **identique** |

**Le seul écart est l'enveloppe** (`ok` + `count` manquants). Le format de date et le schéma
de chaque service sont déjà alignés. La réconciliation est donc **minimale et mécanique**.

### 2.3 Consommateurs — AUCUN (vérifié)

Recherche `services.json` / lecture JSON (`ConvertFrom-Json`, `readFileSync`, `JSON.parse`) sur
tout le dépôt :

- **Aucun** lecteur ne parse `services.json` : ni `cli/src/commands/onboard.js`, ni
  `iakaframe-onboard.ps1`, ni un script d'install, ni un test.
- Les seules occurrences hors producteurs sont **documentaires** (`cli/README.md`,
  `specs/instructions/onboarding-v2-multiplateforme.md` — usage **prospectif**, pas de code) ou
  dans les **frames gelées** (`frames/releases/**`, hors scope).

→ **Zéro consommateur cassé, zéro risque de régression fonctionnelle.** Le champ de manœuvre est
libre : on peut converger vers la forme **canonique** sans ménager aucun lecteur existant.

---

## 3. Direction de réconciliation — TRANCHÉE

**Direction retenue : aligner le ps1 sur le CLI** — `iakaframe-services.ps1` émettra l'enveloppe
**C-JSON** `{ ok, generated, count, services }`. Le CLI ne bouge pas (il est déjà la référence).

### Pourquoi cette direction (et pas l'inverse)

Trois voies étaient possibles :

1. **Aligner le ps1 sur le CLI** (ps1 émet C-JSON) — **RETENUE**.
2. **Régresser le fichier CLI vers legacy** (`--out` écrirait `{ generated, services }`) — **rejetée**.
3. **3e voie** (schéma commun + wrappers) — **rejetée** (sur-ingénierie, cf. § 6).

Justification :

- **Sens de la dette.** Le C-JSON (`cli-api-surface-harmonisation.md`, `lib/output.js`) est la
  **cible assumée** du projet : `ok` en 1re clé, collection = pluriel + `count`. Le ps1 porte la
  forme **legacy**. On fait donc **avancer le retardataire vers la cible**, on ne recule pas la
  cible vers le legacy. Legolas a signalé l'écart précisément pour **converger sur C-JSON**.

- **Rejet de la voie 2 (régresser le CLI).** Elle introduirait une **divergence intra-CLI** :
  stdout `{ ok, ... }` mais fichier `{ generated, services }` — deux formes pour **le même
  payload dans le même programme**. Elle contredirait frontalement `output.js` (verrou anti-dérive)
  et **recréerait la dette en miroir** : le jour où un consommateur lira le fichier, il tomberait
  sur un artefact non-C-JSON. C'est un pas en arrière sur une décision de design déjà prise.

- **Coût minimal, risque quasi nul.** L'écart réel se limite à **deux clés** (`ok`, `count`) —
  cf. § 2.2. Édition mécanique du seul bloc `$payload`. Le format de date et le schéma des
  services étant déjà identiques, aucun autre changement.

### Contrainte machine — pas de `pwsh` ici → comment on la neutralise

Le `.ps1` **n'est pas exécutable/testable localement** (pas de `pwsh` sur la machine de cadrage
et d'exécution, comme les gates e2e différés du projet). On ne peut donc pas **prouver le JSON
runtime** du ps1 ici. La direction retenue reste néanmoins **la plus vérifiable hors-ligne**,
grâce à **deux contrôles compensatoires runnables en Node** (§ 7) :

- **(V1) Verrou de la référence CLI** : un test Node **exécute** le CLI avec `--out` et prouve
  que le **fichier écrit** est bien `{ ok, generated, count, services }` avec `ok` en 1re clé et
  `count === services.length`. C'est la **forme cible exacte** que le ps1 doit répliquer —
  aujourd'hui **aucun** test ne verrouille ce comportement fichier.
- **(V2) Contrôle statique du source ps1** : un test Node **lit** `iakaframe-services.ps1` et
  assert que le bloc `$payload` contient bien les clés `ok` **et** `count` (garde anti-régression
  de source, à la manière des `guard-*` du dépôt). Il ne prouve pas le runtime, mais il **fige la
  source** contre un retour au legacy.

Ce qui **reste au gate humain différé** (machine avec `pwsh`) : l'exécution réelle
`iakaframe-services.ps1 -Json <f>` et la comparaison octet-à-octet du JSON produit avec la forme
cible. C'est le seul volet non automatisable ici, et il est **borné** (§ 7).

---

## 4. Spécification précise — forme cible + éditions exactes

### 4.1 Forme cible unique de `services.json` (les deux producteurs)

```json
{ "ok": true, "generated": "<yyyy-MM-dd HH:mm>", "count": <N>, "services": [ /* N objets */ ] }
```

Ordre des clés imposé (aligné sur le CLI) : **`ok`, `generated`, `count`, `services`**. `ok:true`
en première clé (règle C-JSON 2) ; `count` = **longueur exacte** de `services` (règle C-JSON 3) ;
chaque service conserve `service/available/host/port/url/detail`.

### 4.2 CLI — AUCUNE modification

`cli/src/commands/services.js` produit **déjà** cette forme sur disque (§ 2.1). **Ne rien toucher.**
Le seul ajout côté CLI est un **test** (§ 4.4), pas du code de commande.

### 4.3 ps1 — édition unique du bloc `$payload` (L102-105)

`iakaframe-services.ps1` :

- **Avant** (L102-105) :
  ```powershell
  $payload = [ordered]@{
    generated = (Get-Date -Format "yyyy-MM-dd HH:mm")
    services  = $results
  }
  ```
- **Après** :
  ```powershell
  $payload = [ordered]@{
    ok        = $true
    generated = (Get-Date -Format "yyyy-MM-dd HH:mm")
    count     = @($results).Count
    services  = $results
  }
  ```

Points de rigueur :

- `[ordered]@{}` **garantit l'ordre** des clés à la sérialisation → `ok` sort en premier, `services`
  en dernier, comme le CLI.
- `@($results).Count` (et non `$results.Count`) : force le contexte tableau, robuste si un jour
  `$results` ne contient qu'un élément (PowerShell 5.1). Avec les 3 services actuels, vaut `3`.
- `$true` → `ConvertTo-Json` émet le booléen JSON `true` (minuscule). Aucun changement à
  `ConvertTo-Json -Depth 5` ni à l'encodage UTF-8 sans BOM (L106-107).

**Aucune autre édition du ps1** (rapport lisible, sondes, `param`, format de date : inchangés).

### 4.4 Test CLI — verrou de la forme fichier (nouveau)

Ajouter un test Node (ex. `cli/test/services-out.test.js`) qui **exécute** le CLI avec `--out`
vers un fichier temporaire et vérifie la forme écrite (voir critères § 7, V1). Ce test n'existe
pas aujourd'hui et constitue la **preuve locale** de la forme cible.

---

## 5. Étapes d'implémentation (Gimli)

1. Éditer `iakaframe-services.ps1` L102-105 selon § 4.3 (ajout `ok` + `count`, ordre imposé).
2. Ajouter `cli/test/services-out.test.js` (§ 4.4 / § 7 V1) — verrou de la forme fichier du CLI.
3. Ajouter, dans un test de garde, le contrôle statique du source ps1 (§ 7 V2). Réutiliser un
   fichier de garde existant (ex. `cli/test/guard-json-output.test.js`) **ou** un petit fichier
   dédié — au choix, sans en faire un chantier.
4. `cd cli && npm test` → tout vert.
5. Committer (conventional commit, ex. `fix(services): ps1 emet l'enveloppe C-JSON { ok, generated,
   count, services } — aligne services.json sur le CLI`).

> Rappel machine : le ps1 **n'est pas exécutable ici**. Ne pas tenter de le lancer ; s'appuyer sur
> V1 + V2 (Node) et laisser le volet runtime ps1 au gate humain différé (§ 7).

---

## 6. Hors périmètre

- **Modifier le CLI** (`cli/src/commands/services.js`) : il est **déjà** conforme (§ 2.1). Le
  régresser vers legacy est explicitement **rejeté** (§ 3, voie 2).
- **Frames gelées** (`frames/releases/**`, dont `StefFrame2/cli/src/commands/services.js` en
  ex-`--json <fichier>`) : releases **figées**, non retouchées.
- **Écrire un consommateur** de `services.json` (onboard/install qui lirait le fichier) :
  aujourd'hui **aucun** n'existe (§ 2.3) ; c'est un sujet **onboarding-v2**, hors de cette dette.
- **3e voie « schéma commun + wrappers/validateur JSON-Schema partagé »** : sur-ingénierie pour
  un fichier à zéro consommateur et à écart de deux clés. **Non retenue** (MVP d'abord).
- **Changer le format de `generated`, les hôtes par défaut, les sondes, le rendu humain** :
  inchangés (déjà alignés entre les deux producteurs).

---

## 7. Comportement attendu / Critères d'acceptation

### Vérifiable en Node, ICI (automatisé, sans `pwsh`)

- [ ] **(V1) Forme fichier du CLI verrouillée.** Un test exécute
      `node cli/src/index.js services --out <tmp> --hosts 127.0.0.1 --timeout 1`, relit `<tmp>`,
      `JSON.parse` OK, et assert :
      - racine = objet, **`ok === true`** et **`ok` est la 1re clé** (`Object.keys(obj)[0] === 'ok'`) ;
      - présence de `generated` (string), `services` (array) ;
      - **`count === services.length`** ;
      - ordre des clés = `['ok','generated','count','services']`.
- [ ] **(V2) Source ps1 figée sur C-JSON.** Un test lit `iakaframe-services.ps1` et assert que le
      bloc `$payload = [ordered]@{ ... }` contient les clés **`ok`** et **`count`** (regex/inclusion
      simple). Anti-régression : empêche un retour silencieux au `{ generated, services }` legacy.
- [ ] **Non-régression CLI.** `cd cli && npm test` — tout vert (dont `guard-json-output`, qui
      couvre déjà `services --json` sur stdout).
- [ ] **Périmètre respecté.** `git status` ne montre que : `iakaframe-services.ps1`, le(s)
      nouveau(x) fichier(s) de test, et éventuellement `BACKLOG.md` (case cochée). Aucun `frames/**`,
      aucun `cli/src/commands/services.js`.

### Reste au GATE HUMAIN différé (machine avec `pwsh` — non runnable ici)

- [ ] **(D1) Runtime ps1 conforme.** Sur une machine `pwsh`/PowerShell :
      `iakaframe-services.ps1 -Json <f>` puis inspection de `<f>` → forme
      `{ "ok": true, "generated": "...", "count": N, "services": [...] }`, `ok` en 1re position,
      `count` = nombre de services, booléen `true` bien minuscule, UTF-8 sans BOM.
- [ ] **(D2) Égalité de forme CLI ↔ ps1.** Comparer un `services.json` produit par le CLI et un
      produit par le ps1 (mêmes hôtes) → **mêmes clés, même ordre, même schéma de `services[]`**
      (le contenu détecté peut différer selon l'environnement ; c'est la **forme** qui est vérifiée).

> Répartition assumée : la **forme cible** est prouvée localement via V1 (le CLI EST la référence)
> et figée dans le source ps1 via V2 ; seul le **runtime ps1** (D1/D2) attend une machine `pwsh`,
> exactement comme les gates e2e différés déjà pratiqués sur ce projet.

---

## 8. Jalon (gate humain)

```
      _    _    _     ___  _   _
     | |  / \  | |   / _ \| \ | |
  _  | | / _ \ | |  | | | |  \| |
 | |_| |/ ___ \| |__| |_| | |\  |
  \___//_/   \_\_____\___/|_| \_|
```

| Émetteur | Contenu | Récepteur |
|---|---|---|
| 🔵 Gandalf (Cadrage, P1) | Instruction fermée `reconciliation-services-json.md` : **direction tranchée = aligner le ps1 sur le CLI** (ps1 émet C-JSON `{ ok, generated, count, services }`, CLI inchangé). Écart réel = 2 clés (`ok`+`count`) ; zéro consommateur. Vérifiable ICI : V1 (test forme fichier CLI) + V2 (garde statique source ps1) + `npm test`. Différé (pas de `pwsh`) : D1/D2 runtime ps1 au gate humain. | 🟢 Le décideur (Stéphane) → valide → dispatch **Gimli** |

**Fichiers à vérifier avant validation** (chemin:ligne) :
- `iakaframe-services.ps1:102`-`107` (bloc `$payload` legacy — cible de l'édition § 4.3).
- `cli/src/commands/services.js:52`, `:58`, `:61` (le CLI écrit déjà C-JSON sur disque — **référence**, ne pas toucher).
- `cli/src/lib/output.js:14`-`23` (convention C-JSON : `ok` en 1re clé, collection = pluriel + `count`).
- `cli/test/guard-json-output.test.js:74` (`services --json` sur stdout déjà couvert — le nouveau test couvre le **fichier `--out`**).
- Hors scope : `frames/releases/StefFrame2/cli/src/commands/services.js:64` (frame gelée), `cli/README.md:52` (doc).

**Points ouverts** (choix assumés par Gandalf, ajustables au jalon) :
1. **Direction** = ps1 → C-JSON (et non CLI → legacy) — justifiée § 3.
2. **V2 (garde statique source ps1)** : proposé comme compensation au manque de `pwsh` ; peut être
   allégé/retiré si le décideur juge V1 + gate humain différé suffisants.
3. **Emplacement du nouveau test** (`cli/test/services-out.test.js` dédié vs ajout dans un garde
   existant) : au choix de Gimli, sans incidence de périmètre.

---

## Statut

**VALIDÉ — prêt pour Gimli** (aucun point ouvert bloquant ; direction tranchée § 3). À
« JALON VALIDÉ » → dispatch **Gimli** pour appliquer § 5 : édition unique du ps1 (§ 4.3) + verrou
Node V1 (et V2), en passant les critères § 7. Le volet runtime ps1 (D1/D2) reste un **gate humain
différé** faute de `pwsh` sur la machine.
