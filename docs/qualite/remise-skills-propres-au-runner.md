# Remise — skills-propres-au-runner (Gimli → Legolas)

Instruction : `specs/instructions/skills-propres-au-runner.md` (VALIDÉE 27/09/2026, Q1-Q6).
Branche : `main` (pas de worktree séparé — lot séquentiel, pas de parallélisme demandé).

## Mesure de départ (étape 0) — 3 passes sur `main` propre, avant toute modification

`cd cli && node --test`, résumé **officiel** du runner (jamais un comptage de lignes) :

| Passe | tests | pass | fail | skipped | duration_ms |
|---|---|---|---|---|---|
| 1 | 1307 | 1253 | 53 | 1 | 81024 |
| 2 | 1307 | 1253 | 53 | 1 | — (identique) |
| 3 | 1307 | 1253 | 53 | 1 | — (identique) |

**Les trois passes sont strictement identiques** : mêmes 53 tests en échec, dans le même ordre,
aucune variation. **Aucun test instable constaté à l'étape 0** (classe D vide).

### Classement des 53 échecs par fichier (cause constatée : crash du résolveur sur `loki`)

| Fichier | Échecs | Cause constatée | Classe | Traitement |
|---|---|---|---|---|
| `test/vendor-check.test.js` | 19 | `frame lint`/génération plantent sur `loki` → niveau 2 « injouable », plus aucun miroir « clean » | A | Corrigé (étapes 1-5) |
| `test/generate-agents.test.js` | 10 | `generateAll`/`generateAgent` lèvent `skill referencee introuvable : anthropic-skills:docs` | A | Corrigé |
| `test/skills-deploy.test.js` | 7 | `unionSkills`/déploiement dépendent de `resolveSkills` sur tout le canon | A | Corrigé |
| `test/vitrine-methode.test.js` | 4 | `buildZone` appelle `generateAll` sur le canon réel | A/B | Corrigé (A) + golden vitrine régénéré (B) |
| `test/temoins-prose.test.js` | 3 | `frame lint --all`/`skills` (prose) traversent le canon réel | A | Corrigé |
| `test/guard-json-output.test.js` | 3 | `frame lint --all`/`skills` (sortie JSON) traversent le canon réel | A | Corrigé |
| `test/resolve-skills.test.js` | 2 | `resolveSkills('loki')`/portée globale sur le vrai canon | A | Corrigé |
| `test/project-models.test.js` | 1 | manifeste régénéré vs golden figé, dépend de `generateAll` | A | Corrigé |
| `test/parite-skills.test.js` | 1 | golden `generateAgent(loki)` byte-à-byte | A/B | Corrigé |
| `test/parite-generateurs.test.js` | 1 | empreinte `skills` écrite, dépend de `generateAll` | A | Corrigé |
| `test/frame-lint.test.js` | 1 | `frame lint iakaframe` (parcours CLI complet) sort en erreur sur `loki` | A | Corrigé |
| `test/agents.test.js` | 1 | C18 : résolution par frontmatter canon (source unique) sur `loki` | A | Corrigé |

Confirmation de la prévision par lecture du code de l'instruction (§ Plan pour les échecs) : la
**totalité** des 53 échecs étaient classe A (résolveur) ou A/B (golden dérivé résorbé à l'étape 8,
y compris la dérive laissée par le lot « durée estimée » sur les contrats d'Aragorn et d'Odin,
au-delà des `SKILL.md` anticipés par l'instruction). **Aucune classe C ni D.**

## Étapes réalisées

1. Schéma : `library/_schema/frontmatter.json` (`personas.optional.runnerSkills: "map"`),
   `cli/src/lib/frontmatter-schema.js` (cas `map`), `cli/test/frontmatter-schema-parity.test.js`
   (`map` dans `VALID_TYPES`).
2. Frame lint : `cli/src/lib/frame-lint.js` — 3 règles `runnerSkills`, **Q5 = B : AVERTISSEMENTS,
   jamais bloquant** (`unknown-runner`, `bad-type`, `belongs-to-skills`).
3. Générateur : `cli/src/lib/generate-agents.js`, `generateAgent` — seul point d'injection,
   runner normalisé par `RUNNER_ALIASES` (`claude-code`/`claude` → `claude`), skills résolues
   puis `runnerSkills.claude`, dédoublonné (1re occurrence).
4. Commentaires : `cli/src/lib/resolve-skills.js`, `cli/src/lib/skills-deploy.js`.
5. Migration : `library/personas/loki.md`, `library/personas/nathalie.md`.
6. Binding : `bindings/iakaframe-claude-default.md` (outils Claude Docs de Loki et Nathalie).
7. Tests neufs : `cli/test/runner-skills.test.js` (14 tests, tous verts).
8. Régénération des 3 dérivés, deux passes (idempotence — CA-2 vérifiée : `git status
   --porcelain` identique sur les fichiers du lot après la seconde passe).
9. Côté GUI (Q4 = **oui**, `~/work/iakaFrameGUI` propre au moment du constat) : schéma vendoré,
   fixtures `personas`/`agents-golden` (loki, nathalie, **aragorn, odin** — même dérive
   « durée estimée » résorbée), `binding`, `SKILL.md` d'Aragorn et d'Odin, et
   `parite-generateurs.test.ts` (`loadCanon` injecte `runnerSkills.claude`). Commit séparé
   `bb6c831`, poussé sur `vps`. Suite complète GUI : 134 fichiers, 1371 tests verts, 3 skip ;
   `typecheck` propre.

## Mesure d'arrivée (étape 9) — 3 passes après le lot complet (CLI + GUI)

| Passe | tests | pass | fail | skipped | duration_ms |
|---|---|---|---|---|---|
| 1 | 1321 | 1320 | 0 | 1 | 81724 |
| 2 | 1321 | 1320 | 0 | 1 | 81591 |
| 3 | 1321 | 1320 | 0 | 1 | 81403 |

**`npm test` (dans `cli/`) est VERT sur les trois passes, à l'identique.** Le seul « skip »
(`recall : moteur ripgrep si rg est installe (sinon test saute)`) est inchangé avant/après —
dépend de la machine (`rg` absent), documenté par le test lui-même, hors sujet de ce lot.

## Critères d'acceptation

- **CA-1** à **CA-11** : PASS (voir mesures ci-dessus, idempotence vérifiée, `resolveSkills`
  conforme à CA-4, contrats Loki/Nathalie conformes à CA-5 — vérifié champ par champ contre
  `~/.claude/agents/{loki,nathalie}.md` en lecture seule, ordre des outils Claude Docs identique).
- **CA-6** : les contrats générés sont identiques à leurs goldens d'avant le lot, **à l'exception
  documentée** d'Aragorn et Odin (dérive « durée estimée », classe B résorbée par l'étape 8 —
  cf. classement ci-dessus ; changement de **corps uniquement**, aucun changement de `skills`).
- **CA-12** : le niveau 2 de `vendor-check` est de nouveau **jouable** (plus de
  `niveau2-injouable`). **3 dérives résiduelles constatées, non corrigées ici** (hors périmètre,
  antérieures à ce lot, invisibles tant que le niveau 2 était cassé) :
  - `skills/iakaframe-naonedge/SKILL.md`, `skills/iakastart/SKILL.md`,
    `skills/iakaframe-forgejo/SKILL.md` — contenu différent du canon, issu des commits
    `9cf616b` (tableau des temps), `4dbcd8d` (VPS Forgejo canal primaire) et `7daf295`
    (iakastart, divergence de modèle), tous **antérieurs** à ce lot. **Classe C — lot cible :
    prochain passage de vendoring GUI** (`iakaframe vendor-check` + remède `cp`, 3 gestes).
- **CA-13** : aucune écriture sous `~/.claude` (lecture seule utilisée pour CA-5) ; aucun tag,
  aucun push de version côté `iakaframe` (poussé uniquement le commit GUI `bb6c831`, geste
  distinct de la montée de version) ; **aucun** `agents generate --global` ni
  `skills deploy --global` exécuté (préparés ci-dessous pour Stéphane).

## Hors périmètre constaté (signalé, non traité)

- Les fichiers `docs/architecture/*.html` (CSS de la page vitrine) ont été modifiés **sur le
  disque pendant ce lot par un processus tiers** (aucun de mes 3 scripts de régénération n'y
  touche — vérifié par lecture des scripts). Laissés **intacts, non commités, non revertés** :
  ni ajoutés ni écrasés, pour ne détruire aucun travail en cours ailleurs.
- Les 3 dérives `vendor-check` ci-dessus (classe C, lot cible : vendoring GUI).

## Fichiers livrés (chemin:ligne)

- `/Users/sjupin/work/iakaframe/library/_schema/frontmatter.json:7` (champ `runnerSkills`)
- `/Users/sjupin/work/iakaframe/cli/src/lib/frontmatter-schema.js:75` (cas `map`)
- `/Users/sjupin/work/iakaframe/cli/test/frontmatter-schema-parity.test.js:20`
- `/Users/sjupin/work/iakaframe/cli/src/lib/frame-lint.js:145` (3 règles `runnerSkills`)
- `/Users/sjupin/work/iakaframe/cli/src/lib/generate-agents.js:155` (injection)
- `/Users/sjupin/work/iakaframe/cli/src/lib/resolve-skills.js:9` (commentaire)
- `/Users/sjupin/work/iakaframe/cli/src/lib/skills-deploy.js:11` (commentaire)
- `/Users/sjupin/work/iakaframe/library/personas/loki.md:9`
- `/Users/sjupin/work/iakaframe/library/personas/nathalie.md:9`
- `/Users/sjupin/work/iakaframe/bindings/iakaframe-claude-default.md:15`
- `/Users/sjupin/work/iakaframe/cli/test/runner-skills.test.js` (nouveau, 14 tests)
- `/Users/sjupin/work/iakaframe/cli/test/fixtures/skills-golden/manifest.json` (régénéré)
- `/Users/sjupin/work/iakaframe/cli/test/fixtures/agents-golden/{loki,nathalie,aragorn,odin}.md` (régénérés)
- `/Users/sjupin/work/iakaframe/methode-de-travail.html` (zone `CODE_BLOCKS` régénérée)
- Côté GUI (`~/work/iakaFrameGUI`, commit `bb6c831`) : `packages/core/src/frontmatter-schema.json`,
  `packages/core/__tests__/fixtures/{personas,agents-golden}/{loki,nathalie,aragorn,odin}.md`,
  `packages/core/__tests__/fixtures/binding/iakaframe-claude-default.md`,
  `packages/core/__tests__/fixtures/skills/{iakaframe-aragorn,iakaframe-odin}/SKILL.md`,
  `packages/core/__tests__/parite-generateurs.test.ts:146`

## Ce qui reste à Stéphane (préparé, non exécuté)

```bash
cd ~/work/iakaframe
iakaframe agents generate --global
iakaframe skills deploy --global
```

Attendu (CA-5) : sortie **sans effet** pour Loki et Nathalie — les contrats déjà déployés dans
`~/.claude/agents/` sont déjà équivalents au comportement produit par ce lot.
