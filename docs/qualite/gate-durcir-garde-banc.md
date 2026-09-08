# Gate qualité — durcissement garde banc étapes 3-4 — 2026-09-08

Branche : `test/durcir-garde-banc`
Commit examiné : `b9ac547` (test(banc): contrefactuels sur le texte reel (secrets, os.homedir, push, @v4))
Base : `main` @ `6f2a422`

## Verdict : PASS

## Périmètre du diff

`git diff --stat main..HEAD` : **un seul fichier touché** :
```
cli/test/guard-banc-etapes-3-4.test.js | 49 ++++++++++++++++++++++++++++------
1 file changed, 41 insertions(+), 8 deletions(-)
```

Aucun code de production ni de workflow modifié — conforme à la règle « pas d'auto-validation ».

## Écart consigné (chemins réels vs ordre de mission)

L'ordre de mission cite « les trois `cli/scripts/banc-etapes-3-4-*.mjs` + `lib/banc-support.mjs` ».
Sur le disque, il n'existe que **deux** scripts `banc-etapes-3-4-*.mjs` (`linux`, `windows` — pas
de `-macos.mjs`), et le support vit à `cli/scripts/lib/banc-support.mjs` (pas `cli/lib/`). C'est
exactement l'ensemble `SCRIPTS` déclaré dans le test lui-même (lignes 26-30). J'ai vérifié les
sha256 sur les chemins réels, pas sur les chemins fantômes de l'ordre de mission.

## Mesures

| # | Vérification | Commande | Résultat |
|---|---|---|---|
| 1a | Diff limité à 1 fichier | `git diff --stat main..HEAD` | `cli/test/guard-banc-etapes-3-4.test.js \| 49 +++++++++++++++++++++++++++++++++++++++--------`, 1 file changed |
| 1b | sha256 identiques main/HEAD : `.github/workflows/banc-etapes-3-4.yml` | `git show <rev>:<f> \| shasum -a 256` | `ca33af34...` = `ca33af34...` (identique) |
| 1c | sha256 identiques : `cli/scripts/banc-etapes-3-4-linux.mjs` | idem | `cb091494...` = `cb091494...` (identique) |
| 1d | sha256 identiques : `cli/scripts/banc-etapes-3-4-windows.mjs` | idem | `36187818...` = `36187818...` (identique) |
| 1e | sha256 identiques : `cli/scripts/lib/banc-support.mjs` | idem | `e43232f0...` = `e43232f0...` (identique) |
| 2 | Test de garde isolé | `node --test cli/test/guard-banc-etapes-3-4.test.js` | `tests 14`, `pass 14`, `fail 0`, `duration_ms 86.37` |
| 3 | Rejeu indépendant hors harnais de 2 contrefactuels (script dédié, scratchpad) | `node rejeu-contrefactuels.mjs` (lecture directe des fichiers réels sur disque) | voir « Contrefactuels rejoués » ci-dessous |
| 4 | Suite complète du CLI | `cd cli && node --test` | `tests 1162`, `pass 1161`, `fail 0`, `skipped 1`, `duration_ms 67912.66` |
| 5 | Témoin CA-M8 / `evenements.js` inchangé | `git diff main..HEAD --stat -- '*evenements.js*'` | diff vide (fichier non touché, par construction du diff à 1 fichier) ; test `CA-M8 — LA PROSE HUMAINE NE BOUGE PAS D'UN OCTET` présent dans `cli/test/install-prose-non-regression.test.js:57`, exécuté et vert dans la suite complète (mesure 4) |

Sur la mesure 4, l'unique test sauté (`skipped 1`) est :
```
﹣ recall : moteur ripgrep si rg est installe (sinon test saute) (0.058917ms) # SKIP
```
— skip conditionnel préexistant (absence de `rg` sur cette machine), sans rapport avec la branche
examinée (le diff ne touche à rien de ce test). Déclaré, non masqué.

## Contrefactuels rejoués hors harnais

Script isolé écrit sous
`/private/tmp/claude-501/-Users-sjupin-work/491bc970-2cd2-4bfd-8669-ae053380e4f6/scratchpad/rejeu-contrefactuels.mjs`,
qui **relit lui-même les fichiers réels sur disque** (`.github/workflows/banc-etapes-3-4.yml` et
`cli/scripts/banc-etapes-3-4-linux.mjs`) — aucune chaîne fabriquée en dur comme seule base du
contrefactuel.

**Contrefactuel (3) — injection `${{ secrets.FOO }}` dans le texte réel du workflow :**
```
texte reellement modifie ? true
RESULTAT: rouge, message = ce banc ne publie rien : aucun secret ne devrait y etre lu
texte reel original: vert (OK, aucun secrets. present)
```

**Contrefactuel (4) — injection `os.homedir(` dans le contenu réel de `banc-etapes-3-4-linux.mjs` :**
```
texte reellement modifie ? true
RESULTAT: rouge sur motif /os\.homedir\(/ -> message = The input was expected to not match the regular expression /os\.homedir\(/. Input:
contenu reel original: vert (OK, aucun motif hors bac a sable present)
```

Les deux mutations partent bien du texte réel lu par `fs.readFileSync` (pas d'une chaîne
pré-fabriquée), rougissent nommément, et le texte réel non muté reste vert dans les deux cas —
confirmant, de façon indépendante du harnais `node --test`, ce que rapportent les tests
`CONTREFACTUEL (3)` et `CONTREFACTUEL (4)` du fichier `cli/test/guard-banc-etapes-3-4.test.js`.

Les deux autres contrefactuels du fichier (`push:` ajouté au bloc `on:`, `@v4` en lieu et place
d'un SHA) ont été lus dans le source (lignes 67-72 et 98-102) : même schéma — mutation en mémoire
du texte réel, assertion négative qui doit échouer nommément. Non rejoués une seconde fois hors
harnais (l'ordre de mission en demandait deux), mais vérifiés verts dans la mesure 2 et lisibles
tels quels dans le fichier cité ci-dessus.

## Conclusion

- 1 seul fichier touché par le commit de Gimli (`cli/test/guard-banc-etapes-3-4.test.js`), aucun
  code de production ni workflow réel modifié.
- Test de garde : 14/14 verts.
- 2 contrefactuels rejoués indépendamment du harnais, sur le texte réel : rougissent nommément.
- Suite complète : 1161/1162 verts, 1 skip conditionnel préexistant sans rapport, 0 échec.
- Témoin CA-M8 et `evenements.js` intacts.

**PASS** — le gate dev→stage est ouvert pour ce commit.
