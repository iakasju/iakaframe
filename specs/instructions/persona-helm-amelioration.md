# Persona Helm — amélioration de contenu (phase 1)

> **Rang : non déclaré ici.** L'ordre de la série a une **source unique** —
> `phase1-inventaire-bibliotheque.md` **§ 0.1** (dépendances) et **§ 0.2** (ordre dérivé).
> Cette instruction déclare ses **dépendances**, jamais sa position.
>
> **Dépendance : APRÈS le lot 0** (comme tout lot de la série). **Aucune autre.**

> Instruction de cadrage (Gandalf, P1). Branche `feat/amelioration-personas`.
> **Périmètre CONTENU uniquement.** Dérivée de `audit-amelioration-roster-personas.md`.
> Un commit dédié à cette persona.

## 1. Cadre de la phase — ligne de partage

**DANS** : mission, périmètre, obligations, gestes, `guardrails` déclarés, `tools` du binding,
`skills` du frontmatter, `description`, geste **jalon**.

**HORS — phase 2** : `roleKey`, `library/roles/`, `methods/iakaframe.md`, **promotion de
`deploiement` en rôle canonique**, `roleIndex`, `DEFAULT_SKILLS`, `CANONICAL_ROLES`, vignette,
`assemble`, **re-vendorage GUI**, `roster.test.ts`, `Skill` au binding.

> ⚠️ **Helm est la persona la plus exposée à la ligne de partage.** Tout ce qui touche à **son rôle**
> (`roleKey: deploiement`, son rattachement à `coordination` dans les tables, son absence du roster
> GUI, l'exception `SKILL_OVERRIDE_OF`) est **structurel** et **gelé jusqu'à la phase 2**. Cette
> instruction ne traite que **le contenu de sa charte et ses tools**.

## 2. Trois faits qui valent pour toute cette phase

1. **Golden + déployé régénérés** (`gen-agents-golden.mjs` puis `agents generate --global`,
   `--check` = 0). **Critère de fini.**
2. **Le re-vendorage GUI n'est PAS fait.** ⚠️ *Corrigé au gate : **rien n'est rompu à ce jour**
   (vérifié par diff) ; la rupture **surviendra au premier commit**.* La parité cross-repo **sera
   volontairement rompue** et **rien ne la détectera**. **Dette assumée, ouverte au premier commit.**
   *Cette instruction modifie le binding (H-1) : les fixtures GUI vendorées et les assertions de
   tools de `parite-generateurs.test.ts:147-156` divergeront. La suite GUI n'est pas jouée ici.*
3. **Ajouter des `skills:` n'a aucun effet runtime** avant le lot 2. *(Sans objet ici : le
   frontmatter de Helm est déjà correct.)*

## 3. État audité — Helm (prod, 🟣)

| Dim. | Verdict | Preuve |
|---|---|---|
| 1 Charte | ✅ | mission (`helm.md:21-22`), périmètre (`:24-29`), gate humain non négociable (`:38-40`) |
| 2 Expert MoE | ✅ | squad prod séparé, frontière avec Gimli nette (`:17-18`) |
| 3 Jalons | ✅ | **déjà pourvu** (`:42-44`) — jalon du gate prod, récepteur = l'utilisateur |
| 4 Tools | ⚠️ | `Read, Grep, Glob, Bash` — **pas de `Write`** alors que sa charte impose des **écritures** |
| 5 Skills | ✅ | `[iakaframe-deploiement]` |
| 6 Hooks | ✅ | `identity` + `perimeter` actifs (via `Bash`) |
| 7 Cohérence | *(hors périmètre)* | — |

> **À noter pour le coordinateur** : le constat initial du backlog (« le geste jalon n'a pas irrigué
> le roster … 1 seule mention chez Helm ») était **inexact**. `helm.md:42-44` porte un paragraphe
> jalon **complet et adapté à son gate**. **Rien à faire sur la dimension 3.**

## 4. Changement demandé

| Id | Changement | Fichier | Statut |
|---|---|---|---|
| **H-1** | **Accorder `Write` borné** + inscrire le **bornage** dans la charte | `bindings/…:13` + `library/personas/helm.md` | **arbitré** (CH-C) |

### H-1 — `Write` borné aux artefacts d'exploitation

**Le défaut.** La charte impose de produire une **« procédure de rollback documentée »**
(`helm.md:34-35`) et de gérer **proxy inversé / SSO / bascule d'alias** (`:25-27`). Ce sont des
**écritures**. Helm n'a que `Bash` : soit il écrit *via* `Bash` (canal indirect, non tracé par le
`perimeter-guard` de la même façon), soit il ne le fait pas. Même schéma que CH-3 chez Aragorn,
tranché en faveur d'un `Write` **borné**.

**Le changement, en deux volets indissociables :**

1. **Binding** : `tools: [Read, Grep, Glob, Bash]` → **`+ Write`**.
2. **Charte** : une section **« Obligation — bornage de l'écriture »**, sur le modèle de celle
   d'Aragorn, énonçant que `Write` est **borné aux artefacts d'exploitation** — procédure de
   rollback, configuration de bascule/alias, notes d'exploitation — et **exclu de tout artefact de
   réalisation** (code applicatif, tests, configs applicatives), qui restent à Gimli.

> ⚠️ **Le volet 2 n'est pas décoratif.** Accorder `Write` sans inscrire le bornage transformerait le
> gardien de la prod en agent capable de modifier du code — exactement ce que `:28` interdit
> (« Ne fait pas : modifier le code → Gimli via un nouveau cadrage »). **Les deux volets partent
> dans le même commit**, jamais l'un sans l'autre.

## 5. Ce qui est laissé à la phase 2 (bloqué par la structure)

- **Son rôle** : `roleKey: deploiement` vs `ROLE_OF.helm = 'coordination'`, l'exception
  `SKILL_OVERRIDE_OF`, son absence du roster GUI, la promotion de `deploiement` en rôle canonique et
  sa vignette. **Tout gelé** — c'est le cœur de la phase 2.
- Re-vendorage GUI et assertions de tools en dur côté GUI (§ 2 pt 2).
- `Skill` au binding.

## 6. Critères d'acceptation

| # | Critère | Vérification |
|---|---|---|
| H-A1 | `Write` figure dans les `tools` de Helm | `bindings/…:13` ; contrat déployé |
| H-A2 | La charte porte une section de **bornage** explicite de l'écriture | relecture |
| H-A3 | Le bornage **nomme** les artefacts autorisés (rollback, config de bascule/alias, notes d'exploitation) **et** les exclusions (code, tests, configs applicatives → Gimli) | relecture |
| H-A4 | Le bornage est **cohérent** avec `:28` (« ne modifie pas le code ») — aucune contradiction | relecture croisée |
| H-A5 | Le paragraphe **jalon existant** (`:42-44`) est **inchangé** | diff |
| H-A6 | `guardrails` inchangés (`identity, perimeter`) | `helm.md:9` |
| H-A7 | Aucun champ hors périmètre modifié — **en particulier `roleKey`** | diff |
| H-A8 | Golden + déployé régénérés | `agents generate --check` = **0** |
| H-A9 | Suite CLI verte | `node --test` |

## 7. Critère de « fini »

1. `node cli/scripts/gen-agents-golden.mjs` · 2. `agents generate --global` + `--check` = 0 ·
3. `node --test` vert · 4. **PAS de re-vendorage GUI** (dette assumée, 2026-07-19) ·
5. Commit dédié à Helm, **binding + charte ensemble**.

## 8. Estimation

**~0,5 j-h.** Complexité **faible** (1 ligne de binding + 1 section de charte). Risque **faible** sur
le plan technique ; le seul vrai risque est **rédactionnel** — un bornage trop vague rendrait `Write`
équivalent à un blanc-seing. La formulation d'Aragorn (§ Obligation — ligne de définition du projet)
sert de **modèle éprouvé**.
*Inconnue* : la liste exacte des artefacts d'exploitation autorisés — à arrêter à la rédaction ; en
cas de doute, **restreindre** (on élargit plus tard, on ne reprend pas un droit accordé).
