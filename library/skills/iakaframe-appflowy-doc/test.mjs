#!/usr/bin/env node
// Tests unitaires des fonctions PURES + orchestration contre un faux serveur EN MÉMOIRE
// (zéro I/O HTTP, zéro secret, aucune instance touchée).
//
// DEUX ENTRÉES, UNE SEULE SOURCE DE VÉRITÉ (R-1) :
//   1. `node test.mjs`  — exécution directe, runner maison, sortie lisible.
//   2. `export { cases }` — consommé par `cli/test/appflowy-doc-skill.test.js`, qui les
//      enregistre un par un dans `node:test`. C'est ce chemin-là qui les fait entrer dans
//      `npm test` (depuis `cli/`) et dans la CI `.forgejo/workflows/cli-ci.yml`.
// Sans le second, ces tests ne sont joués par AUCUNE chaîne : une régression passerait au vert.
//
// J7 — le serveur AppFlowy ne valide AUCUN type de bloc (un type inventé est accepté et
// persisté) : un test qui se contenterait de vérifier des HTTP 200 validerait n'importe
// quelle bouillie. La garantie doit donc venir d'ici, sur des fonctions pures.
import assert from 'node:assert/strict'
import {
  isTemplateFile, isStructuralDoc, selectStructuralDocs, para, heading, bullet,
  clampHeadingLevel, mirrorWarning, mirrorBlocks, fileToBlocks, stripFrontMatter,
  numbered, todo, quote, code, divider, toDelta, parseInline, markdownToBlocks,
  renderTable, splitTableRow, isAbsoluteUrl,
  readableTitle, clampTitle, dedupeTitles, parseVersion, compareVersionDesc,
  compareRecentDesc, buildPlan, latestVersion, indexBlocks, overviewBlocks, chunk,
  planMoves, pickWorkspace, workspaceLabel, parseArgs, parseDotenv, resolveDocPaths,
  loadDocs, resolveWorkspaceSelector, findNodeById, childrenOf, SEC, indexName, AppFlowyClient,
  DEFAULT_WORKSPACE, run,
} from './appflowy-doc.mjs'
import {
  parsePurgeArgs, flattenTree, countDescendants, planPurge, purgeArmed, renderPlan, runPurge,
} from './appflowy-purge.mjs'

const cases = []
const test = (name, fn) => cases.push([name, fn])
const throwsWith = (fn, re) => { try { fn(); assert.fail('aurait dû lever') } catch (e) { assert.match(e.message, re) } }

// ═══════════════════ B1 — exclusion des gabarits (critère A3) ═══════════════════

test('isTemplateFile : nom de base commençant par _ (sans exception)', () => {
  assert.equal(isTemplateFile('_TEMPLATE.md'), true)
  assert.equal(isTemplateFile('specs/instructions/_workflow.md'), true)
  assert.equal(isTemplateFile('specs/instructions/_AGENT_TEMPLATE.md'), true)
  assert.equal(isTemplateFile('specs/recettes/_TEMPLATE.recette.html'), true)
  assert.equal(isTemplateFile('specs/_prive/note.md'), false, 'seul le NOM DE BASE compte')
  assert.equal(isTemplateFile('specs/instructions/lot_1.md'), false)
})

test('isStructuralDoc rejette tout gabarit, même à un emplacement publiable', () => {
  assert.equal(isStructuralDoc('specs/instructions/_TEMPLATE.md'), false)
  assert.equal(isStructuralDoc('specs/instructions/_arborescence.md'), false)
  assert.equal(isStructuralDoc('docs/qualite/_TEMPLATE.md'), false)
})

test('isStructuralDoc accepte les docs structurants', () => {
  assert.equal(isStructuralDoc('CLAUDE.md'), true)
  assert.equal(isStructuralDoc('specs/PROJET.md'), true)
  assert.equal(isStructuralDoc('specs/etat-des-lieux.md'), true)
  assert.equal(isStructuralDoc('specs/instructions/L0.md'), true)
  assert.equal(isStructuralDoc('docs/qualite/v0.10.0.md'), true)
})

test('isStructuralDoc rejette code et générés', () => {
  assert.equal(isStructuralDoc('src/main.rs'), false)
  assert.equal(isStructuralDoc('README.md'), false)
  assert.equal(isStructuralDoc('specs/instructions/note.txt'), false)
  assert.equal(isStructuralDoc('docs/autre/x.md'), false)
})

test('selectStructuralDocs filtre, exclut les gabarits et ordonne', () => {
  const input = [
    'docs/qualite/v0.10.0.md', 'src/x.rs', 'specs/instructions/L1.md', 'specs/instructions/_TEMPLATE.md',
    'CLAUDE.md', 'specs/PROJET.md', 'specs/instructions/L0.md', 'specs/etat-des-lieux.md',
  ]
  assert.deepEqual(selectStructuralDocs(input), [
    'CLAUDE.md', 'specs/PROJET.md', 'specs/etat-des-lieux.md',
    'specs/instructions/L0.md', 'specs/instructions/L1.md', 'docs/qualite/v0.10.0.md',
  ])
})

// ═══════════════════ Blocs ═══════════════════

test('para texte -> delta insert ; para vide -> delta vide', () => {
  assert.deepEqual(para('hello'), { type: 'paragraph', data: { delta: [{ insert: 'hello' }] } })
  assert.deepEqual(para(''), { type: 'paragraph', data: { delta: [] } })
})

test('J7 clampHeadingLevel : #### et au-delà retombent au niveau 3', () => {
  assert.equal(clampHeadingLevel(1), 1)
  assert.equal(clampHeadingLevel(3), 3)
  assert.equal(clampHeadingLevel(4), 3)
  assert.equal(clampHeadingLevel(6), 3)
  assert.equal(clampHeadingLevel(0), 1)
  assert.equal(clampHeadingLevel('2'), 2)
  assert.equal(clampHeadingLevel(undefined), 1)
})

test('J7 heading : type/level/delta conformes aux blocs persistés (S3)', () => {
  assert.deepEqual(heading(2, 'Titre'), { type: 'heading', data: { level: 2, delta: [{ insert: 'Titre' }] } })
  assert.equal(heading(5, 'x').data.level, 3)
})

test('bullet : type bulleted_list', () => {
  assert.deepEqual(bullet('a'), { type: 'bulleted_list', data: { delta: [{ insert: 'a' }] } })
})

test('fileToBlocks : CRLF normalisé, front-matter masqué, aucun bloc vide parasite', () => {
  // A7 — « a\nb\nc » est UN paragraphe : une coupure de ligne ne coupe plus rien.
  assert.equal(fileToBlocks('a\nb\nc').length, 1)
  assert.equal(fileToBlocks('x\r\n\r\ny\n\n\n').length, 2, 'CRLF normalisé, vides finaux sans effet')
  assert.deepEqual(fileToBlocks('a\n\nb').map((b) => b.type), ['paragraph', 'paragraph'])
  // Le front-matter a déjà servi au titre : il est masqué du corps.
  assert.deepEqual(fileToBlocks('---\ntitle: T\n---\n# Corps').map((b) => b.type), ['heading'])
})

// ═══════════════════ § 5.3 — avertissement de miroir ═══════════════════

test('mirrorWarning : texte normatif exact, cite la source et 90 · Notes', () => {
  const b = mirrorWarning('CLAUDE.md', '2026-07-27T10:00:00.000Z')
  const t = b.data.delta[0].insert
  assert.equal(t,
    'Page générée depuis CLAUDE.md le 2026-07-27T10:00:00.000Z. ' +
    'Toute modification faite ici sera perdue au prochain rafraîchissement. ' +
    'Pour écrire, utiliser « 90 · Notes ».')
})

test('mirrorBlocks : l’avertissement est le TOUT PREMIER bloc, le corps est MAPPÉ', () => {
  const b = mirrorBlocks('specs/PROJET.md', '# Vision\ntexte', '2026-07-27T10:00:00.000Z')
  assert.equal(b[0].type, 'paragraph')
  assert.match(b[0].data.delta[0].insert, /^Page générée depuis specs\/PROJET\.md/)
  // Le titre n'est plus un paragraphe « # Vision » : c'est un vrai bloc heading (A7).
  assert.deepEqual(b.slice(1).map((x) => x.type), ['heading', 'paragraph'])
  assert.equal(b[1].data.delta[0].insert, 'Vision')
  assert.equal(b[2].data.delta[0].insert, 'texte')
})

// ═══════════════════ Lot 2 — mapper Markdown → blocs (critère A7) ═══════════════════
//
// J7 — le serveur AppFlowy accepte et persiste N'IMPORTE QUEL type de bloc, y compris un type
// inventé (spike S3). Un test d'API ne prouverait donc rien. Toute la garantie de fidélité
// repose sur cette section : le mapper est PUR, il se teste ici, cas de bloc par cas de bloc.

const types = (md) => markdownToBlocks(md).map((b) => b.type)
const texts = (md) => markdownToBlocks(md).map((b) => (b.data.delta || []).map((d) => d.insert).join(''))

// ── Titres ATX ──

test('A7 titre ATX : # → ### donnent un bloc heading de niveau 1 → 3', () => {
  assert.deepEqual(types('# un\n\n## deux\n\n### trois'), ['heading', 'heading', 'heading'])
  assert.deepEqual(markdownToBlocks('# un\n\n## deux\n\n### trois').map((b) => b.data.level), [1, 2, 3])
  assert.deepEqual(texts('# un\n\n## deux\n\n### trois'), ['un', 'deux', 'trois'])
})

test('A7 titre ATX : ####+ clampé au niveau 3 (J7) mais TOUJOURS un heading', () => {
  const b = markdownToBlocks('#### quatre\n\n##### cinq\n\n###### six')
  assert.deepEqual(b.map((x) => x.type), ['heading', 'heading', 'heading'])
  assert.deepEqual(b.map((x) => x.data.level), [3, 3, 3])
})

test('titre ATX : fermeture ###  optionnelle retirée, formatage en ligne conservé', () => {
  assert.deepEqual(texts('## Titre ##'), ['Titre'])
  const d = markdownToBlocks('## Section **grasse**')[0].data.delta
  assert.deepEqual(d, [{ insert: 'Section ' }, { insert: 'grasse', attributes: { bold: true } }])
})

test('titre ATX : « #hashtag » sans espace n’est PAS un titre', () => {
  assert.deepEqual(types('#pas-un-titre'), ['paragraph'])
})

// ── Agglomération des paragraphes (le cœur de A7) ──

test('A7 agglomération : une coupure de ligne NE crée PAS de paragraphe', () => {
  // Cas réel : prose rewrappée à 100 colonnes dans tous les CLAUDE.md du portefeuille.
  const md = 'IakaCockpit — cockpit chapeau-rooted de l\'écosystème iakaProject\n'
    + 'et point d\'entrée du portefeuille.\n'
    + 'Troisième ligne du même paragraphe.'
  const b = markdownToBlocks(md)
  assert.equal(b.length, 1, 'trois lignes = UN paragraphe')
  assert.equal(b[0].data.delta.map((d) => d.insert).join(''),
    'IakaCockpit — cockpit chapeau-rooted de l\'écosystème iakaProject '
    + 'et point d\'entrée du portefeuille. Troisième ligne du même paragraphe.')
})

test('A7 agglomération : SEULE la ligne vide sépare deux paragraphes', () => {
  assert.equal(markdownToBlocks('a\nb\n\nc\nd').length, 2)
  assert.deepEqual(texts('a\nb\n\nc\nd'), ['a b', 'c d'])
  assert.equal(markdownToBlocks('a\n\n\n\nb').length, 2, 'les vides multiples ne créent pas de bloc vide')
})

// ── Listes ──

test('A7 listes à puces : ≥1 bloc bulleted_list PAR item (-, *, +)', () => {
  assert.deepEqual(types('- un\n- deux\n* trois\n+ quatre'),
    ['bulleted_list', 'bulleted_list', 'bulleted_list', 'bulleted_list'])
  assert.deepEqual(texts('- un\n- deux'), ['un', 'deux'])
})

test('A7 listes numérotées : « 1. » et « 1) » → numbered_list, un bloc par item', () => {
  assert.deepEqual(types('1. un\n2. deux\n3) trois'),
    ['numbered_list', 'numbered_list', 'numbered_list'])
  assert.deepEqual(texts('1. un\n2. deux'), ['un', 'deux'])
})

test('listes à cocher : todo_list avec `checked` (S3), la case n’apparaît pas dans le texte', () => {
  const b = markdownToBlocks('- [ ] à faire\n- [x] fait\n- [X] fait aussi')
  assert.deepEqual(b.map((x) => x.type), ['todo_list', 'todo_list', 'todo_list'])
  assert.deepEqual(b.map((x) => x.data.checked), [false, true, true])
  assert.deepEqual(b.map((x) => x.data.delta.map((d) => d.insert).join('')), ['à faire', 'fait', 'fait aussi'])
})

test('listes imbriquées : un bloc par item, profondeur rendue par un retrait insécable', () => {
  const b = markdownToBlocks('- a\n  - b\n    - c\n- d')
  assert.deepEqual(b.map((x) => x.type), ['bulleted_list', 'bulleted_list', 'bulleted_list', 'bulleted_list'])
  const t = b.map((x) => x.data.delta.map((d) => d.insert).join(''))
  assert.equal(t[0], 'a')
  assert.equal(t[1], '  b', 'niveau 2 = 2 insécables')
  assert.equal(t[2], '    c', 'niveau 3 = 4 insécables')
  assert.equal(t[3], 'd', 'retour au niveau 1')
})

test('A7 item de liste sur plusieurs lignes : UN bloc, jamais un paragraphe orphelin', () => {
  // Cas réel : les tableaux de critères et les listes longues des instructions.
  const b = markdownToBlocks('- **A1** Régénérabilité. Détruire un espace\n'
    + '  et le reconstruire depuis le dépôt ne perd rien.\n'
    + '- suivant')
  assert.deepEqual(b.map((x) => x.type), ['bulleted_list', 'bulleted_list'])
  assert.match(b[0].data.delta.map((d) => d.insert).join(''), /Détruire un espace et le reconstruire/)
})

test('continuation paresseuse : ligne nue après un item reste DANS l’item (CommonMark)', () => {
  const b = markdownToBlocks('- item\nsuite non indentée\n\nvrai paragraphe')
  assert.deepEqual(b.map((x) => x.type), ['bulleted_list', 'paragraph'])
  assert.equal(b[0].data.delta.map((d) => d.insert).join(''), 'item suite non indentée')
})

test('une ligne ouvrant un bloc ferme la liste au lieu de la prolonger', () => {
  assert.deepEqual(types('- item\n## Titre'), ['bulleted_list', 'heading'])
  assert.deepEqual(types('- item\n> cité'), ['bulleted_list', 'quote'])
})

// ── Code fencé ──

test('A7 code fencé : bloc `code`, langage CONSERVÉ (S3), contenu jamais interprété', () => {
  const b = markdownToBlocks('```js\nconst a = **1**\n# pas un titre\n```')
  assert.equal(b.length, 1)
  assert.equal(b[0].type, 'code')
  assert.equal(b[0].data.language, 'js')
  assert.equal(b[0].data.delta[0].insert, 'const a = **1**\n# pas un titre',
    'ni gras ni titre à l’intérieur d’un bloc de code')
})

test('code fencé : sans langage → pas de champ `language` ; ~~~ accepté ; langage normalisé', () => {
  assert.equal(markdownToBlocks('```\nx\n```')[0].data.language, undefined)
  assert.equal(markdownToBlocks('~~~bash\nls\n~~~')[0].data.language, 'bash')
  assert.equal(markdownToBlocks('```JS\nx\n```')[0].data.language, 'js')
  assert.equal(markdownToBlocks('```js title=a.js\nx\n```')[0].data.language, 'js', 'attributs ignorés')
})

test('code fencé non refermé en fin de fichier : bloc `code` quand même, rien de perdu', () => {
  const b = markdownToBlocks('```sh\nligne 1\nligne 2')
  assert.deepEqual(b.map((x) => x.type), ['code'])
  assert.equal(b[0].data.delta[0].insert, 'ligne 1\nligne 2')
})

// ── Citations ──

test('citations : lignes « > » consécutives = UN bloc quote', () => {
  const b = markdownToBlocks('> Ce fichier est lu en priorité\n> à chaque session.')
  assert.deepEqual(b.map((x) => x.type), ['quote'])
  assert.equal(b[0].data.delta.map((d) => d.insert).join(''), 'Ce fichier est lu en priorité à chaque session.')
})

test('citations : « > » vide sépare deux quotes ; une liste citée reste une liste', () => {
  assert.deepEqual(types('> un\n>\n> deux'), ['quote', 'quote'])
  assert.deepEqual(types('> intro\n>\n> - a\n> - b'), ['quote', 'bulleted_list', 'bulleted_list'])
})

// ── Séparateurs ──

test('séparateurs : ---, ***, ___ → bloc divider (et jamais une puce)', () => {
  assert.deepEqual(types('a\n\n---\n\nb'), ['paragraph', 'divider', 'paragraph'])
  assert.deepEqual(types('***\n\n___\n\n-----'), ['divider', 'divider', 'divider'])
  assert.deepEqual(types('- item'), ['bulleted_list'], '« - item » reste une puce')
})

// ── Tableaux (perte assumée : préformaté aligné) ──

test('A7 tableaux : ZÉRO ligne de tableau en paragraphe brut — un bloc code préformaté', () => {
  const md = '| # | Critère |\n|---|---|\n| **A1** | Régénérabilité |\n| **A2** | Préservation |'
  const b = markdownToBlocks(md)
  assert.equal(b.length, 1)
  assert.equal(b[0].type, 'code')
  assert.equal(b[0].data.language, undefined, 'préformaté sans coloration')
  for (const bl of b) assert.notEqual(bl.type, 'paragraph')
})

test('tableaux : colonnes alignées à largeur fixe (lisible, pas un magma)', () => {
  const out = renderTable(['| Col | Autre colonne |', '|---|---:|', '| a | 12 |'])
  assert.deepEqual(out.split('\n'), [
    '| Col | Autre colonne |',
    '| --- | ------------- |',
    '| a   | 12            |',
  ])
})

test('splitTableRow : `\\|` échappé et pipes dans du code en ligne ne coupent pas la cellule', () => {
  assert.deepEqual(splitTableRow('| a | b |'), ['a', 'b'])
  assert.deepEqual(splitTableRow('| a \\| suite | b |'), ['a | suite', 'b'])
  assert.deepEqual(splitTableRow('| `x | y` | b |'), ['`x | y`', 'b'])
})

test('tableau irrégulier : lignes plus courtes complétées, aucune perte de ligne', () => {
  const out = renderTable(['| a | b | c |', '| x |'])
  assert.equal(out.split('\n').length, 2)
  assert.match(out.split('\n')[1], /^\| x /)
})

// ── Formatage en ligne ──

test('A7 inline gras : ** et __ → attribut bold', () => {
  assert.deepEqual(parseInline('a **gras** b'),
    [{ insert: 'a ' }, { insert: 'gras', attributes: { bold: true } }, { insert: ' b' }])
  assert.deepEqual(parseInline('__gras__'), [{ insert: 'gras', attributes: { bold: true } }])
})

test('A7 inline italique : * et _ → attribut italic', () => {
  assert.deepEqual(parseInline('a *pente* b'),
    [{ insert: 'a ' }, { insert: 'pente', attributes: { italic: true } }, { insert: ' b' }])
  assert.deepEqual(parseInline('_pente_'), [{ insert: 'pente', attributes: { italic: true } }])
})

test('inline : `_` NE coupe PAS un snake_case (le corpus en est plein)', () => {
  assert.deepEqual(parseInline('workspace_id et view_id et parent_view_id'),
    [{ insert: 'workspace_id et view_id et parent_view_id' }])
  assert.deepEqual(parseInline('APPFLOWY__WORKSPACE'), [{ insert: 'APPFLOWY__WORKSPACE' }])
})

test('inline : `_` intra-mot n’ouvre PAS d’italique (règle left-flanking CommonMark)', () => {
  // Garde d'OUVERTURE, distincte de la garde de fermeture : ici le `_` fermant est bien
  // suivi d'une espace, seul le fait que le `_` ouvrant soit collé à `foo` protège.
  assert.deepEqual(parseInline('foo_bar_ baz'), [{ insert: 'foo_bar_ baz' }])
  assert.deepEqual(parseInline('is_locked_ vaut true'), [{ insert: 'is_locked_ vaut true' }])
  // …et l'italique légitime, lui, fonctionne toujours.
  assert.deepEqual(parseInline('un _vrai_ italique'),
    [{ insert: 'un ' }, { insert: 'vrai', attributes: { italic: true } }, { insert: ' italique' }])
})

test('inline : `_` collé à un mot ne FERME pas non plus (garde de fermeture)', () => {
  assert.deepEqual(parseInline('un _essai_bidon suit'), [{ insert: 'un _essai_bidon suit' }])
})

test('A7 inline code : les backticks → attribut code, rien ne se formate dedans', () => {
  assert.deepEqual(parseInline('voir `specs/PROJET.md`'),
    [{ insert: 'voir ' }, { insert: 'specs/PROJET.md', attributes: { code: true } }])
  assert.deepEqual(parseInline('`**pas gras**`'),
    [{ insert: '**pas gras**', attributes: { code: true } }])
  assert.deepEqual(parseInline('``a ` b``'), [{ insert: 'a ` b', attributes: { code: true } }])
})

test('inline code : une espace de garde de chaque côté est rognée (règle CommonMark)', () => {
  assert.deepEqual(parseInline('` a `'), [{ insert: 'a', attributes: { code: true } }])
  assert.deepEqual(parseInline('`` `x` ``'), [{ insert: '`x`', attributes: { code: true } }])
  assert.deepEqual(parseInline('` `'), [{ insert: ' ', attributes: { code: true } }], 'un seul caractère : intact')
})

test('inline liens : parenthèses ÉQUILIBRÉES dans l’URL (cible non tronquée)', () => {
  assert.deepEqual(parseInline('[doc](https://ex.org/a_(1).png)'),
    [{ insert: 'doc', attributes: { href: 'https://ex.org/a_(1).png' } }])
})

test('listes : une tabulation vaut 4 espaces d’indentation (tabulation de CommonMark)', () => {
  const NB = ' ' // le retrait de profondeur est fait d'espaces INSÉCABLES
  const t = markdownToBlocks('- a\n   - b\n\t- c').map((b) => b.data.delta.map((d) => d.insert).join(''))
  assert.deepEqual(t, ['a', NB.repeat(2) + 'b', NB.repeat(4) + 'c'],
    'la tabulation indente PLUS que 3 espaces : c est au niveau 3, pas au niveau 2')
})

test('A7 inline liens absolus : attribut href (les 4 attributs vérifiés au spike)', () => {
  assert.deepEqual(parseInline('[Forgejo](http://192.168.2.11:3001/x)'),
    [{ insert: 'Forgejo', attributes: { href: 'http://192.168.2.11:3001/x' } }])
  assert.equal(isAbsoluteUrl('https://a.b'), true)
  assert.equal(isAbsoluteUrl('mailto:a@b.c'), true)
  assert.equal(isAbsoluteUrl('./doc.md'), false)
  assert.equal(isAbsoluteUrl('specs/PROJET.md'), false)
})

test('PERTE ASSUMÉE liens relatifs : texte conservé, cible entre parenthèses, jamais de href', () => {
  assert.deepEqual(parseInline('[la spec](./specs/PROJET.md)'),
    [{ insert: 'la spec' }, { insert: ' (./specs/PROJET.md)' }].reduce((a, x) => {
      const l = a[a.length - 1]; if (l) { l.insert += x.insert; return a } return [x]
    }, []))
  assert.equal(parseInline('[x](x)').length, 1, 'cible == libellé : pas de doublon')
})

test('PERTE ASSUMÉE images : mention explicite, JAMAIS un silence', () => {
  assert.deepEqual(parseInline('avant ![schéma](./img/a.png) après'),
    [{ insert: 'avant image non publiée : ./img/a.png après' }])
})

test('inline : combinaisons imbriquées (gras dans lien, code dans gras)', () => {
  assert.deepEqual(parseInline('[**gras**](https://a.b)'),
    [{ insert: 'gras', attributes: { href: 'https://a.b', bold: true } }])
  assert.deepEqual(parseInline('**a `c` b**'), [
    { insert: 'a ', attributes: { bold: true } },
    { insert: 'c', attributes: { bold: true, code: true } },
    { insert: ' b', attributes: { bold: true } },
  ])
})

test('inline : échappements \\* \\_ \\` rendus littéraux', () => {
  assert.deepEqual(parseInline('a \\*pas italique\\* b'), [{ insert: 'a *pas italique* b' }])
})

test('inline : marques non fermées laissées littérales (jamais de plantage)', () => {
  assert.deepEqual(parseInline('a ** b'), [{ insert: 'a ** b' }])
  assert.deepEqual(parseInline('a ` b'), [{ insert: 'a ` b' }])
  assert.deepEqual(parseInline('2 * 3 * 4'), [{ insert: '2 * 3 * 4' }])
})

test('inline : `__` intra-mot n’ouvre PAS de gras, même avec un `__` fermant valide', () => {
  // Garde d'OUVERTURE du gras : ici le `__` fermant est suivi d'une espace, seul le fait
  // que le `__` ouvrant soit collé à APPFLOWY protège l'identifiant.
  assert.deepEqual(parseInline('APPFLOWY__WORKSPACE__ vaut projects'),
    [{ insert: 'APPFLOWY__WORKSPACE__ vaut projects' }])
  assert.deepEqual(parseInline('__vrai gras__'), [{ insert: 'vrai gras', attributes: { bold: true } }])
})

test('inline : une marque suivie d’une espace n’ouvre PAS d’italique (multiplications)', () => {
  // « a * b* c » : sans la garde, « b » partirait en italique. Cas réel des formules et
  // des globs (`*.md`, `2 * 3`) présents dans les instructions.
  assert.deepEqual(parseInline('a * b* c'), [{ insert: 'a * b* c' }])
  assert.deepEqual(parseInline('les fichiers * .md* du dépôt'), [{ insert: 'les fichiers * .md* du dépôt' }])
})

test('inline : segments adjacents de même attribut fusionnés (delta compact)', () => {
  assert.deepEqual(parseInline('**a****b**'), [{ insert: 'ab', attributes: { bold: true } }])
})

test('toDelta : chaîne, delta déjà construit, vide et null', () => {
  assert.deepEqual(toDelta('x'), [{ insert: 'x' }])
  assert.deepEqual(toDelta(''), [])
  assert.deepEqual(toDelta(null), [])
  const d = [{ insert: 'a', attributes: { bold: true } }]
  assert.equal(toDelta(d), d, 'un delta passe tel quel')
})

test('constructeurs de blocs : types exacts vérifiés persistés au spike S3', () => {
  assert.deepEqual(numbered('a'), { type: 'numbered_list', data: { delta: [{ insert: 'a' }] } })
  assert.deepEqual(todo('a', true), { type: 'todo_list', data: { checked: true, delta: [{ insert: 'a' }] } })
  assert.deepEqual(quote('a'), { type: 'quote', data: { delta: [{ insert: 'a' }] } })
  assert.deepEqual(divider(), { type: 'divider', data: {} })
  assert.deepEqual(code('x', 'JS'), { type: 'code', data: { language: 'js', delta: [{ insert: 'x' }] } })
  assert.deepEqual(code('x'), { type: 'code', data: { delta: [{ insert: 'x' }] } })
})

test('PERTE ASSUMÉE : HTML brut et biffé ~~ laissés en texte, sans plantage', () => {
  assert.deepEqual(types('<!-- commentaire -->'), ['paragraph'])
  assert.deepEqual(types('<div class="x">bloc</div>'), ['paragraph'])
  assert.deepEqual(parseInline('a ~~biffé~~ b'), [{ insert: 'a ~~biffé~~ b' }])
})

test('robustesse : entrées dégénérées ne lèvent jamais', () => {
  for (const x of ['', null, undefined, '\n\n\n', '   ', '|', '```', '>', '- ']) {
    assert.ok(Array.isArray(markdownToBlocks(x)), `échec sur ${JSON.stringify(x)}`)
  }
})

// ── Le test qui tranche : un CLAUDE.md réaliste, bout en bout ──

test('A7 bout en bout : un CLAUDE.md réaliste satisfait les 5 comptages du critère', () => {
  // Extrait fidèle du corpus (IakaCockpit/CLAUDE.md + template-iakadoc-appflowy.md).
  const md = [
    '# CLAUDE.md — Instructions pour Claude Code',
    '',
    '> Ce fichier est lu en priorité par Claude Code à chaque session.',
    '> Pour la vision complète, lire `specs/PROJET.md`.',
    '',
    '---',
    '',
    '## Ce qu’est ce projet',
    '',
    'Stack : **React 18.3 + TypeScript 5.5** (front, `src/`) · **Tauri 2 / Rust**',
    '(backend, `src-tauri/`) · **SQLite** (`rusqlite` bundled).',
    '',
    '## Commandes à utiliser',
    '',
    '```bash',
    'npm install',
    'npm run tauri dev',
    '```',
    '',
    '## Conventions',
    '',
    '- Langue du code : **anglais**.',
    '- Commits : *conventional commits*.',
    '  - jamais de `reset --hard`',
    '- [ ] reste à faire',
    '',
    '### Critères',
    '',
    '| # | Critère | Vérification |',
    '|---|---|---|',
    '| **A1** | Régénérabilité | relever l’arbre via `/folder` |',
    '| **A2** | Préservation | deux passes successives |',
  ].join('\n')

  const blocks = markdownToBlocks(md)
  const n = (t) => blocks.filter((b) => b.type === t).length

  // 1. ≥ 1 heading par titre ATX du source (5 titres : #, ##, ##, ##, ###).
  assert.equal(n('heading'), 5)
  // 2. ≥ 1 bloc de liste par item (3 puces + 1 case à cocher).
  assert.equal(n('bulleted_list') + n('numbered_list') + n('todo_list'), 4)
  // 3. chaque bloc de code fencé rendu en `code` (1 fence + 1 tableau préformaté).
  assert.equal(n('code'), 2)
  assert.equal(blocks.find((b) => b.data.language === 'bash') !== undefined, true)
  // 4. ZÉRO ligne de tableau en paragraphe brut.
  for (const b of blocks) {
    if (b.type === 'code') continue
    const t = (b.data.delta || []).map((d) => d.insert).join('')
    assert.ok(!/^\s*\|.*\|/.test(t), `ligne de tableau échappée en ${b.type} : ${t}`)
  }
  // 5. AUCUN paragraphe issu d’une simple coupure de ligne : la prose sur 2 lignes = 1 bloc.
  assert.equal(n('paragraph'), 1)
  assert.match(blocks.find((b) => b.type === 'paragraph').data.delta.map((d) => d.insert).join(''),
    /\(front, src\/\) · Tauri 2 \/ Rust \(backend, src-tauri\/\)/)
  // et la citation sur 2 lignes = 1 seul bloc quote.
  assert.equal(n('quote'), 1)
  assert.equal(n('divider'), 1)
})

// ═══════════════════ § 5.1 — titres lisibles ═══════════════════

test('stripFrontMatter : YAML de tête retiré du corps', () => {
  const r = stripFrontMatter('---\ntitle: T\n---\n# Corps\nsuite')
  assert.equal(r.body, '# Corps\nsuite')
  assert.match(r.front, /title: T/)
})

test('readableTitle : premier # du fichier', () => {
  assert.equal(readableTitle('specs/instructions/lot-1.md', '# Instruction — Lot 1\ntexte'), 'Instruction — Lot 1')
})

test('readableTitle : front-matter title prioritaire, marques inline nettoyées', () => {
  assert.equal(readableTitle('x.md', '---\ntitle: "Le `titre`"\n---\n# Autre'), 'Le titre')
  assert.equal(readableTitle('x.md', '# Template `iakadoc` **fort**'), 'Template iakadoc fort')
})

test('readableTitle : à défaut, nom de fichier sans extension, tirets -> espaces', () => {
  assert.equal(readableTitle('specs/instructions/template-iakadoc-appflowy.md', 'pas de titre'),
    'template iakadoc appflowy')
  assert.equal(readableTitle('docs/qualite/v0.15.0.md', ''), 'v0.15.0')
})

test('readableTitle : jamais le chemin brut', () => {
  const t = readableTitle('specs/instructions/L9-demo-enrichie.md', '')
  assert.ok(!t.includes('/'), 'le nom de page ne doit plus jamais porter le chemin')
})

test('clampTitle : nom démesuré tronqué', () => {
  assert.equal(clampTitle('x'.repeat(200)).length, 120)
  assert.ok(clampTitle('x'.repeat(200)).endsWith('…'))
  assert.equal(clampTitle('court'), 'court')
})

test('dedupeTitles : titres identiques désambiguïsés par le nom de fichier', () => {
  const r = dedupeTitles([
    { rel: 'specs/instructions/a.md', title: 'Instruction' },
    { rel: 'specs/instructions/b.md', title: 'Instruction' },
    { rel: 'specs/instructions/c.md', title: 'Unique' },
  ])
  assert.deepEqual(r.map((e) => e.title), ['Instruction (a)', 'Instruction (b)', 'Unique'])
})

// ═══════════════════ § 5.6 — ordres canoniques (A6) ═══════════════════

test('parseVersion / compareVersionDesc : version décroissante', () => {
  assert.deepEqual(parseVersion('docs/qualite/v0.15.0.md'), [0, 15, 0])
  assert.equal(parseVersion('docs/qualite/notes.md'), null)
  const l = [{ rel: 'v0.9.0.md' }, { rel: 'v0.10.0.md' }, { rel: 'v1.0.0.md' }, { rel: 'zz.md' }]
  assert.deepEqual(l.slice().sort(compareVersionDesc).map((e) => e.rel),
    ['v1.0.0.md', 'v0.10.0.md', 'v0.9.0.md', 'zz.md'])
})

test('compareRecentDesc : mtime décroissant puis nom', () => {
  const l = [
    { rel: 'b.md', mtimeMs: 100 }, { rel: 'a.md', mtimeMs: 300 }, { rel: 'c.md', mtimeMs: 300 },
  ]
  assert.deepEqual(l.slice().sort(compareRecentDesc).map((e) => e.rel), ['a.md', 'c.md', 'b.md'])
})

test('latestVersion : la plus haute, sinon null', () => {
  assert.equal(latestVersion([{ rel: 'docs/qualite/v0.9.0.md' }, { rel: 'docs/qualite/v0.10.0.md' }]), 'v0.10.0')
  assert.equal(latestVersion([]), null)
})

// ═══════════════════ § 5.1 — plan de l'arborescence ═══════════════════

const DOCS = [
  { rel: 'CLAUDE.md', title: 'Cadre', mtimeMs: 10 },
  { rel: 'specs/PROJET.md', title: 'Vision', mtimeMs: 20 },
  { rel: 'specs/etat-des-lieux.md', title: 'Etat', mtimeMs: 30 },
  { rel: 'specs/instructions/a.md', title: 'Alpha', mtimeMs: 300 },
  { rel: 'specs/instructions/b.md', title: 'Beta', mtimeMs: 100 },
  { rel: 'docs/qualite/v0.9.0.md', title: 'Qualité v0.9.0', mtimeMs: 5 },
  { rel: 'docs/qualite/v0.10.0.md', title: 'Qualité v0.10.0', mtimeMs: 6 },
]

test('buildPlan : sections 00,10,20,30,40,90 dans l’ordre canonique', () => {
  const p = buildPlan({ project: 'demo', docs: DOCS })
  assert.deepEqual(p.sections.map((s) => s.key), ['00', '10', '20', '30', '40', '90'])
  assert.deepEqual(p.sections.map((s) => s.name), [
    SEC.OVERVIEW, SEC.PROJET, SEC.ETAT, SEC.CADRAGE, SEC.QUALITE, SEC.NOTES,
  ])
})

test('buildPlan : 11/12 sous 10, sources correctes', () => {
  const s10 = buildPlan({ project: 'demo', docs: DOCS }).sections.find((s) => s.key === '10')
  assert.equal(s10.kind, 'container')
  assert.deepEqual(s10.children, [
    { name: SEC.CADRE, source: 'CLAUDE.md', locked: true },
    { name: SEC.VISION, source: 'specs/PROJET.md', locked: true },
  ])
})

test('buildPlan : 30 ordonné mtime décroissant, 40 version décroissante, index nommés', () => {
  const p = buildPlan({ project: 'demo', docs: DOCS })
  const s30 = p.sections.find((s) => s.key === '30')
  const s40 = p.sections.find((s) => s.key === '40')
  assert.equal(s30.index.name, '30 · (index)')
  assert.deepEqual(s30.children.map((c) => c.name), ['Alpha', 'Beta'])
  assert.equal(s40.index.name, '40 · (index)')
  assert.deepEqual(s40.children.map((c) => c.name), ['Qualité v0.10.0', 'Qualité v0.9.0'])
})

test('buildPlan : 90 · Notes présente, jamais verrouillée, sans source', () => {
  const n = buildPlan({ project: 'demo', docs: DOCS }).sections.find((s) => s.key === '90')
  assert.equal(n.kind, 'human')
  assert.equal(n.locked, false)
  assert.equal(n.source, undefined)
})

test('A12 buildPlan : sections vides non créées et listées comme absentes', () => {
  const p = buildPlan({ project: 'vide', docs: [] })
  assert.deepEqual(p.sections.map((s) => s.key), ['00', '90'])
  const noms = p.missing.map((m) => m.name)
  assert.ok(noms.includes(SEC.PROJET) && noms.includes(SEC.ETAT))
  assert.ok(noms.includes(SEC.CADRAGE) && noms.includes(SEC.QUALITE))
  assert.ok(noms.includes(SEC.RECETTE) && noms.includes(SEC.GUIDE))
})

test('buildPlan : compteurs et version déduite', () => {
  const p = buildPlan({ project: 'demo', docs: DOCS })
  assert.equal(p.counters.instructions, 2)
  assert.equal(p.counters.qualite, 2)
  assert.equal(p.version, 'v0.10.0')
})

test('indexBlocks : avertissement puis entrées dans l’ordre canonique', () => {
  const s30 = buildPlan({ project: 'demo', docs: DOCS }).sections.find((s) => s.key === '30')
  const b = indexBlocks(s30, '2026-07-27T00:00:00.000Z')
  assert.match(b[0].data.delta[0].insert, /^Page générée depuis le dépôt du projet/)
  const items = b.filter((x) => x.type === 'bulleted_list').map((x) => x.data.delta[0].insert)
  assert.deepEqual(items, ['Alpha', 'Beta'])
})

test('overviewBlocks : projet, version, sections présentes ET absentes, compteurs', () => {
  const p = buildPlan({ project: 'demo', docs: DOCS })
  const txt = overviewBlocks(p, '2026-07-27T00:00:00.000Z').map((b) => b.data.delta[0]?.insert ?? '').join('\n')
  assert.match(txt, /^Page générée depuis le dépôt du projet/)
  assert.match(txt, /Version : v0\.10\.0/)
  assert.match(txt, /Instructions : 2/)
  assert.match(txt, /Versions qualité : 2/)
  assert.match(txt, /Recette \(RQV\) : non collectée/)
  assert.ok(txt.includes(SEC.CADRAGE) && txt.includes(SEC.RECETTE))
})

test('chunk découpe en lots', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.deepEqual(chunk([], 2), [])
})

// ═══════════════════ J2 — plan de déplacement (ordre garanti) ═══════════════════

test('planMoves : ordre déjà bon -> aucun déplacement', () => {
  assert.deepEqual(planMoves(['a', 'b', 'c'], ['a', 'b', 'c']), [])
})

test('planMoves : ordre inversé (ordre de création réel) -> ordre canonique atteint', () => {
  const moves = planMoves(['c', 'b', 'a'], ['a', 'b', 'c'])
  assert.ok(moves.length > 0)
  // simulation : on rejoue les déplacements et on vérifie le résultat
  let order = ['c', 'b', 'a']
  for (const m of moves) {
    order = order.filter((x) => x !== m.view_id)
    const at = m.prev_view_id === null ? 0 : order.indexOf(m.prev_view_id) + 1
    order.splice(at, 0, m.view_id)
  }
  assert.deepEqual(order, ['a', 'b', 'c'])
  assert.equal(moves[0].prev_view_id, null, 'la première page se place en tête (prev_view_id null)')
})

test('planMoves : pages inconnues de l’arbre ignorées, intrus non déplacés', () => {
  assert.deepEqual(planMoves(['a'], ['a', 'zz']), [])
  const moves = planMoves(['intrus', 'b', 'a'], ['a', 'b'])
  assert.ok(moves.every((m) => m.view_id !== 'intrus'))
})

// ═══════════════════ B2 — workspace explicite ═══════════════════

const WS = [
  { workspace_id: 'ws-my', workspace_name: 'My Workspace' },
  { workspace_id: 'ws-proj', workspace_name: 'projects' },
]

test('B2 pickWorkspace : sélection par nom exact', () => {
  assert.equal(pickWorkspace(WS, 'projects').workspace_id, 'ws-proj')
})

test('B2 pickWorkspace : sélection par workspace_id', () => {
  assert.equal(workspaceLabel(pickWorkspace(WS, 'ws-my')), 'My Workspace')
})

test('B2 pickWorkspace : JAMAIS de repli sur data[0] — échec propre citant les workspaces', () => {
  throwsWith(() => pickWorkspace(WS, 'inexistant'), /workspace introuvable/)
  throwsWith(() => pickWorkspace(WS, 'inexistant'), /My Workspace/)
  throwsWith(() => pickWorkspace(WS, 'inexistant'), /projects/)
  throwsWith(() => pickWorkspace(WS, 'inexistant'), /aucun repli automatique/)
})

test('B2 pickWorkspace : liste vide ou sélecteur vide -> échec propre, pas de choix implicite', () => {
  throwsWith(() => pickWorkspace([], 'projects'), /Workspaces accessibles : aucun/)
  throwsWith(() => pickWorkspace(WS, ''), /workspace cible non défini/)
  throwsWith(() => pickWorkspace(WS, undefined), /workspace cible non défini/)
})

test('B2 pickWorkspace : homonymes -> refus explicite (pas de premier arrivé)', () => {
  const dup = [
    { workspace_id: 'w1', workspace_name: 'projects' },
    { workspace_id: 'w2', workspace_name: 'projects' },
  ]
  throwsWith(() => pickWorkspace(dup, 'projects'), /workspace ambigu/)
})

test('B2 resolveWorkspaceSelector : cascade CLI -> env -> fichier -> défaut projects', () => {
  const fsVide = { readFileSync: () => { throw new Error('ENOENT') } }
  const fsFichier = { readFileSync: () => 'APPFLOWY_WORKSPACE=depuis-fichier' }
  assert.equal(resolveWorkspaceSelector({}, fsVide, 'depuis-cli').selector, 'depuis-cli')
  assert.equal(resolveWorkspaceSelector({ APPFLOWY_WORKSPACE: 'depuis-env' }, fsVide).selector, 'depuis-env')
  assert.equal(resolveWorkspaceSelector({}, fsFichier).selector, 'depuis-fichier')
  assert.equal(resolveWorkspaceSelector({}, fsVide).selector, DEFAULT_WORKSPACE)
  assert.equal(DEFAULT_WORKSPACE, 'projects')
})

// ═══════════════════ Arguments et dotenv ═══════════════════

test('parseArgs lit --project, --root, --workspace', () => {
  assert.deepEqual(parseArgs(['--project', 'demo', '--root', '/x', '--workspace', 'projects']),
    { project: 'demo', root: '/x', workspace: 'projects' })
  assert.deepEqual(parseArgs(['--project']), { project: undefined, root: undefined, workspace: undefined })
  assert.equal(parseArgs(['--project', '--root', '/x']).project, undefined, 'un drapeau n’est pas une valeur')
})

test('parseDotenv : KV, commentaires, quotes, trim, lignes malformées', () => {
  assert.deepEqual(parseDotenv('APPFLOWY_URL=http://host:3008'), { APPFLOWY_URL: 'http://host:3008' })
  assert.deepEqual(parseDotenv('# c\n\nAPPFLOWY_EMAIL=bob@example.test\n   \n# autre'), { APPFLOWY_EMAIL: 'bob@example.test' })
  assert.deepEqual(parseDotenv('A="vvv"\nB=\'www\''), { A: 'vvv', B: 'www' })
  assert.deepEqual(parseDotenv('  KEY  =  val  '), { KEY: 'val' })
  assert.deepEqual(parseDotenv('garbage sans egal\nKEY=ok'), { KEY: 'ok' })
  assert.deepEqual(parseDotenv('=orphelin\nTOK=a=b=c'), { TOK: 'a=b=c' })
  assert.deepEqual(parseDotenv(''), {})
  assert.deepEqual(parseDotenv(undefined), {})
})

// ═══════════════════ I/O fichiers (fsApi mocké, aucun accès disque) ═══════════════════

const FILES = {
  'CLAUDE.md': '# Cadre de travail du projet\ncontenu',
  'specs/PROJET.md': '# Vision et décisions\ncontenu',
  'specs/etat-des-lieux.md': '# Où on en est\ncontenu',
  'specs/instructions/a.md': '# Alpha\ncontenu',
  'specs/instructions/b.md': '# Beta\ncontenu',
  'specs/instructions/_TEMPLATE.md': '# Gabarit interdit\ncontenu',
  'specs/instructions/_workflow.md': '# Gabarit interdit 2\ncontenu',
  'docs/qualite/v0.9.0.md': '# Qualité v0.9.0\ncontenu',
  'docs/qualite/v0.10.0.md': '# Qualité v0.10.0\ncontenu',
}
const MTIME = {
  'specs/instructions/a.md': 300,
  'specs/instructions/b.md': 100,
}
const relOf = (full) => String(full).replace(/^\/repo\/?/, '').split('\\').join('/')
const fsMock = {
  existsSync: (full) => relOf(full) === '' || FILES[relOf(full)] !== undefined,
  statSync: (full) => {
    const rel = relOf(full)
    if (FILES[rel] === undefined) throw new Error('ENOENT')
    return { isFile: () => true, mtimeMs: MTIME[rel] ?? 1 }
  },
  readdirSync: (full) => {
    const rel = relOf(full)
    const out = Object.keys(FILES).filter((f) => f.startsWith(rel + '/')).map((f) => f.slice(rel.length + 1))
    if (!out.length) throw new Error('ENOENT')
    return out
  },
  readFileSync: (full) => {
    const rel = relOf(full)
    if (FILES[rel] === undefined) throw new Error('ENOENT')
    return FILES[rel]
  },
}

test('A3 resolveDocPaths : les gabarits _* ne sortent JAMAIS de la collecte', () => {
  const r = resolveDocPaths('/repo', fsMock)
  assert.deepEqual(r, [
    'CLAUDE.md', 'specs/PROJET.md', 'specs/etat-des-lieux.md',
    'specs/instructions/a.md', 'specs/instructions/b.md',
    'docs/qualite/v0.10.0.md', 'docs/qualite/v0.9.0.md',
  ])
  assert.ok(!r.some((p) => p.split('/').pop().startsWith('_')))
})

test('resolveDocPaths : dossiers absents -> sans crash', () => {
  const fsVide = {
    statSync: (full) => { if (String(full).endsWith('CLAUDE.md')) return { isFile: () => true }; throw new Error('ENOENT') },
    readdirSync: () => { throw new Error('ENOENT') },
  }
  assert.deepEqual(resolveDocPaths('/repo', fsVide), ['CLAUDE.md'])
})

test('loadDocs : contenu, mtime, titre lisible ; fichier illisible ignoré proprement', () => {
  const { docs, skipped } = loadDocs('/repo', ['CLAUDE.md', 'absent.md'], fsMock)
  assert.deepEqual(skipped, ['absent.md'])
  assert.equal(docs.length, 1)
  assert.equal(docs[0].title, 'Cadre de travail du projet')
  assert.equal(docs[0].mtimeMs, 1)
})

// ═══════════════════ Faux serveur AppFlowy EN MÉMOIRE ═══════════════════

// Reproduit les comportements MESURÉS au spike lot 0 :
//  - l'ordre de création des frères est NON déterministe (ici : ordre inverse, cf. S2) ;
//  - `move` avec prev_view_id repositionne, prev_view_id null place en tête ;
//  - PATCH exige `name` ; `is_locked` est purement déclaratif.
function makeFakeServer() {
  const server = {
    workspaces: [
      { workspace_id: 'ws-my', workspace_name: 'My Workspace' },
      { workspace_id: 'ws-proj', workspace_name: 'projects' },
    ],
    roots: { 'ws-my': { view_id: 'root-my', name: 'My Workspace', children: [] },
      'ws-proj': { view_id: 'root-proj', name: 'projects', children: [] } },
    blocks: new Map(),
    locks: new Map(),
    trash: [],
    deleted: [],
    seq: 0,
    writes: 0,
    patched: [],
  }
  server.nodeById = (wid, id) => findNodeById(server.roots[wid], id)
  server.parentOf = (wid, id) => {
    const walk = (n) => {
      for (const c of childrenOf(n)) {
        if (c.view_id === id) return n
        const hit = walk(c)
        if (hit) return hit
      }
      return null
    }
    return walk(server.roots[wid])
  }
  return server
}

function makeFakeClient(server) {
  const clone = (n) => ({ ...n, children: childrenOf(n).map(clone) })
  return {
    wid: null, workspaceName: null, calls: { total: 0, writes: 0 },
    async auth() {}, async provision() {},
    async resolveWorkspace(sel) {
      const ws = pickWorkspace(server.workspaces, sel)
      this.wid = ws.workspace_id
      this.workspaceName = workspaceLabel(ws)
      return this.wid
    },
    async listWorkspaces() { return server.workspaces },
    async folder() { this.calls.total++; return clone(server.roots[this.wid]) },
    async createSpace(name) {
      server.writes++; this.calls.total++
      const node = { view_id: 'v' + (++server.seq), name, is_space: true, children: [] }
      server.roots[this.wid].children.unshift(node) // ordre de création NON déterministe
      return node.view_id
    },
    async createPage(parent, name) {
      server.writes++; this.calls.total++
      const p = server.nodeById(this.wid, parent)
      if (!p) throw new Error('parent introuvable : ' + parent)
      const node = { view_id: 'v' + (++server.seq), name, is_space: false, children: [] }
      p.children.unshift(node) // idem : c'est ce qui rend le `move` obligatoire (J2)
      return node.view_id
    },
    async appendBlocks(vid, blocks) {
      server.writes++; this.calls.total++
      server.blocks.set(vid, (server.blocks.get(vid) || []).concat(blocks))
    },
    async setLocked(vid, name, locked) {
      server.writes++; this.calls.total++
      if (!name) throw new Error("PATCH : champ 'name' obligatoire")
      server.patched.push({ vid, name, locked })
      server.locks.set(vid, !!locked)
    },
    async movePage(vid, parent, prev) {
      server.writes++; this.calls.total++
      const from = server.parentOf(this.wid, vid)
      const node = server.nodeById(this.wid, vid)
      from.children = from.children.filter((c) => c.view_id !== vid)
      const to = server.nodeById(this.wid, parent)
      const at = prev === null || prev === undefined ? 0 : to.children.findIndex((c) => c.view_id === prev) + 1
      to.children.splice(at, 0, node)
    },
    async moveToTrash(vid) {
      server.writes++; this.calls.total++
      const from = server.parentOf(this.wid, vid)
      const node = server.nodeById(this.wid, vid)
      from.children = from.children.filter((c) => c.view_id !== vid)
      server.trash.push({ view_id: vid, name: node.name })
    },
    async listTrash() { this.calls.total++; return server.trash.slice() },
    async deleteFromTrash(vid) {
      server.writes++; this.calls.total++
      server.trash = server.trash.filter((t) => t.view_id !== vid)
      server.deleted.push(vid)
    },
  }
}

const ENV = { APPFLOWY_URL: 'http://fixture.invalid', APPFLOWY_EMAIL: 'bidon@example.test', APPFLOWY_PASSWORD: 'bidon' }
const silence = () => {}
const namesOf = (n) => childrenOf(n).map((c) => c.name)

async function publier(server, extraArgv = []) {
  return run(['--project', 'demo', '--root', '/repo', '--workspace', 'projects', ...extraArgv], ENV, {
    fs: fsMock, log: silence, now: () => new Date('2026-07-27T10:00:00.000Z'),
    makeClient: () => makeFakeClient(server),
  })
}

test('A5 orchestration : arborescence 00–90 complète et ORDONNÉE au niveau espace', async () => {
  const server = makeFakeServer()
  const res = await publier(server)
  assert.equal(res.workspaceId, 'ws-proj')
  const space = findNodeById(server.roots['ws-proj'], res.spaceId)
  assert.deepEqual(namesOf(space), [SEC.OVERVIEW, SEC.PROJET, SEC.ETAT, SEC.CADRAGE, SEC.QUALITE, SEC.NOTES])
})

test('A5 orchestration : ordre interne des conteneurs (index en tête)', async () => {
  const server = makeFakeServer()
  const res = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], res.spaceId)
  const s10 = childrenOf(space).find((c) => c.name === SEC.PROJET)
  const s30 = childrenOf(space).find((c) => c.name === SEC.CADRAGE)
  const s40 = childrenOf(space).find((c) => c.name === SEC.QUALITE)
  assert.deepEqual(namesOf(s10), [SEC.CADRE, SEC.VISION])
  assert.deepEqual(namesOf(s30), [indexName('30'), 'Alpha', 'Beta'])
  assert.deepEqual(namesOf(s40), [indexName('40'), 'Qualité v0.10.0', 'Qualité v0.9.0'])
})

test('A3 orchestration : aucun gabarit publié', async () => {
  const server = makeFakeServer()
  const res = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], res.spaceId)
  const tous = []
  const walk = (n) => { for (const c of childrenOf(n)) { tous.push(c.name); walk(c) } }
  walk(space)
  assert.ok(!tous.some((n) => /Gabarit/.test(n)), 'un gabarit _*.md a fuité')
  assert.ok(!tous.some((n) => n.startsWith('_')))
})

test('§5.3 orchestration : chaque page générée porte l’avertissement en premier bloc', async () => {
  const server = makeFakeServer()
  const res = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], res.spaceId)
  const generees = []
  const walk = (n) => { for (const c of childrenOf(n)) { if (c.name !== SEC.NOTES) { generees.push(c); walk(c) } } }
  walk(space)
  const avecContenu = generees.filter((g) => (server.blocks.get(g.view_id) || []).length)
  assert.ok(avecContenu.length >= 8)
  for (const g of avecContenu) {
    const first = server.blocks.get(g.view_id)[0]
    assert.match(first.data.delta[0].insert, /^Page générée depuis .+ le 2026-07-27T10:00:00\.000Z\./, g.name)
    assert.match(first.data.delta[0].insert, /« 90 · Notes »/)
  }
})

test('J3 orchestration : is_locked sur 00–60, JAMAIS sur 90 · Notes', async () => {
  const server = makeFakeServer()
  const res = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], res.spaceId)
  const notes = childrenOf(space).find((c) => c.name === SEC.NOTES)
  assert.equal(server.locks.has(notes.view_id), false, '90 · Notes ne doit JAMAIS être verrouillée')
  for (const c of childrenOf(space)) {
    if (c.name === SEC.NOTES) continue
    assert.equal(server.locks.get(c.view_id), true, 'non verrouillée : ' + c.name)
  }
  assert.ok(server.patched.every((p) => !!p.name), "le PATCH doit toujours porter 'name'")
})

test('A1/A2 orchestration : 2e passe idempotente, 90 · Notes et sa sous-page intactes', async () => {
  const server = makeFakeServer()
  const r1 = await publier(server)
  const space1 = findNodeById(server.roots['ws-proj'], r1.spaceId)
  const notes = childrenOf(space1).find((c) => c.name === SEC.NOTES)
  const notesId = notes.view_id
  // L'humain écrit dans sa zone : une sous-page avec du contenu.
  const sousPage = { view_id: 'humaine-1', name: 'Ma note à moi', is_space: false, children: [] }
  notes.children.push(sousPage)
  server.blocks.set('humaine-1', [para('texte humain précieux')])
  const blocsNotesAvant = JSON.stringify(server.blocks.get(notesId) || [])

  const r2 = await publier(server)
  assert.equal(r2.spaceId, r1.spaceId, "l'espace est réutilisé, jamais dupliqué")
  const space2 = findNodeById(server.roots['ws-proj'], r2.spaceId)
  assert.deepEqual(namesOf(space2), [SEC.OVERVIEW, SEC.PROJET, SEC.ETAT, SEC.CADRAGE, SEC.QUALITE, SEC.NOTES])
  const notes2 = childrenOf(space2).find((c) => c.name === SEC.NOTES)
  assert.equal(notes2.view_id, notesId, '90 · Notes ne doit jamais être recréée')
  assert.equal(JSON.stringify(server.blocks.get(notesId) || []), blocsNotesAvant, '90 · Notes réécrite !')
  assert.deepEqual(namesOf(notes2), ['Ma note à moi'])
  assert.deepEqual(server.blocks.get('humaine-1'), [para('texte humain précieux')])
  assert.ok(!server.trash.some((t) => t.view_id === notesId || t.view_id === 'humaine-1'),
    '90 · Notes ni ses enfants ne doivent atteindre la corbeille')
})

test('§5.6 orchestration : les conteneurs sont créés une fois et jamais corbeillés', async () => {
  const server = makeFakeServer()
  const r1 = await publier(server)
  const s1 = findNodeById(server.roots['ws-proj'], r1.spaceId)
  const id30 = childrenOf(s1).find((c) => c.name === SEC.CADRAGE).view_id
  await publier(server)
  const s2 = findNodeById(server.roots['ws-proj'], r1.spaceId)
  assert.equal(childrenOf(s2).find((c) => c.name === SEC.CADRAGE).view_id, id30)
  assert.ok(!server.trash.some((t) => t.name === SEC.CADRAGE))
})

test('A9 orchestration : My Workspace n’est jamais touché', async () => {
  const server = makeFakeServer()
  await publier(server)
  assert.deepEqual(server.roots['ws-my'].children, [], 'My Workspace doit rester inchangé')
})

test('A4/A13 orchestration : workspace inconnu -> échec propre, AUCUNE écriture', async () => {
  const server = makeFakeServer()
  await assert.rejects(
    () => run(['--project', 'demo', '--root', '/repo', '--workspace', 'nexiste-pas'], ENV,
      { fs: fsMock, log: silence, makeClient: () => makeFakeClient(server) }),
    /workspace introuvable/,
  )
  assert.equal(server.writes, 0, 'aucune écriture ne doit précéder la résolution du workspace')
  assert.deepEqual(server.roots['ws-proj'].children, [])
  assert.deepEqual(server.roots['ws-my'].children, [])
})

test('A13 orchestration : arguments manquants / racine absente -> message net', async () => {
  await assert.rejects(() => run([], ENV, { fs: fsMock, log: silence }), /usage :/)
  await assert.rejects(
    () => run(['--project', 'x', '--root', '/nulle-part'], ENV, { fs: fsMock, log: silence }),
    /chemin projet introuvable/,
  )
})

test('A14 orchestration : aucun secret dans le journal de sortie', async () => {
  const server = makeFakeServer()
  const lignes = []
  await run(['--project', 'demo', '--root', '/repo', '--workspace', 'projects'], ENV, {
    fs: fsMock, log: (m) => lignes.push(m), now: () => new Date('2026-07-27T10:00:00.000Z'),
    makeClient: () => makeFakeClient(server),
  })
  const txt = lignes.join('\n')
  assert.ok(!txt.includes(ENV.APPFLOWY_PASSWORD))
  assert.ok(!txt.includes(ENV.APPFLOWY_EMAIL))
})

// ═══════════════════ Contrat HTTP du client (fetch stubbé, aucun réseau) ═══════════════════

// Rejoue les URL/verbes/charges utiles MESURÉS au spike lot 0. Aucune instance jointe.
async function avecFetchStub(fn) {
  const vrai = globalThis.fetch
  const appels = []
  globalThis.fetch = async (url, opts = {}) => {
    appels.push({ url: String(url), method: opts.method, body: opts.body ? JSON.parse(opts.body) : undefined })
    return {
      ok: true, status: 200,
      text: async () => JSON.stringify({ data: { view_id: 'v1', views: [{ view_id: 't1', name: 'debris' }] } }),
      json: async () => ({ access_token: 'jeton-bidon' }),
    }
  }
  try { await fn(appels) } finally { globalThis.fetch = vrai }
}

test('J1 client.folder : depth ≥ 6 toujours (depth=4 tronquerait le modèle 00–90)', async () => {
  await avecFetchStub(async (appels) => {
    const c = new AppFlowyClient({ base: 'http://fixture.invalid/', email: 'a@b.test', password: 'x' })
    c.wid = 'ws-proj'
    await c.folder()
    await c.folder(4)
    await c.folder(10)
    assert.deepEqual(appels.map((a) => a.url), [
      'http://fixture.invalid/api/workspace/ws-proj/folder?depth=6',
      'http://fixture.invalid/api/workspace/ws-proj/folder?depth=6',
      'http://fixture.invalid/api/workspace/ws-proj/folder?depth=10',
    ])
  })
})

test('B2 client.resolveWorkspace : le PREMIER workspace renvoyé n’est jamais choisi par défaut', async () => {
  const vrai = globalThis.fetch
  const reponse = { data: [{ workspace_id: 'ws-my', workspace_name: 'My Workspace' }, { workspace_id: 'ws-proj', workspace_name: 'projects' }] }
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify(reponse) })
  try {
    const c = new AppFlowyClient({ base: 'http://fixture.invalid', email: 'a@b.test', password: 'x' })
    // « projects » est le SECOND de la liste : un repli sur data[0] donnerait « My Workspace ».
    assert.equal(await c.resolveWorkspace('projects'), 'ws-proj')
    assert.equal(c.workspaceName, 'projects')
    const c2 = new AppFlowyClient({ base: 'http://fixture.invalid', email: 'a@b.test', password: 'x' })
    await assert.rejects(() => c2.resolveWorkspace('absent'), /workspace introuvable/)
    assert.equal(c2.wid, null, 'aucun workspace ne doit être retenu après un échec')
  } finally { globalThis.fetch = vrai }
})

test('J2 client.movePage : POST .../move avec new_parent_view_id et prev_view_id', async () => {
  await avecFetchStub(async (appels) => {
    const c = new AppFlowyClient({ base: 'http://fixture.invalid', email: 'a@b.test', password: 'x' })
    c.wid = 'ws-proj'
    await c.movePage('v9', 'p1', null)
    assert.equal(appels[0].method, 'POST')
    assert.match(appels[0].url, /\/api\/workspace\/ws-proj\/page-view\/v9\/move$/)
    assert.deepEqual(appels[0].body, { new_parent_view_id: 'p1', prev_view_id: null })
  })
})

test('J3 client.setLocked : PATCH page-view avec name OBLIGATOIRE + is_locked', async () => {
  await avecFetchStub(async (appels) => {
    const c = new AppFlowyClient({ base: 'http://fixture.invalid', email: 'a@b.test', password: 'x' })
    c.wid = 'ws-proj'
    await c.setLocked('v9', SEC.ETAT, true)
    assert.equal(appels[0].method, 'PATCH')
    assert.deepEqual(appels[0].body, { name: SEC.ETAT, is_locked: true })
  })
})

test('S7 client : listTrash lit data.views ; deleteFromTrash fait DELETE /trash/{id}', async () => {
  await avecFetchStub(async (appels) => {
    const c = new AppFlowyClient({ base: 'http://fixture.invalid', email: 'a@b.test', password: 'x' })
    c.wid = 'ws-my'
    assert.deepEqual(await c.listTrash(), [{ view_id: 't1', name: 'debris' }])
    await c.deleteFromTrash('t1')
    assert.equal(appels[1].method, 'DELETE')
    assert.match(appels[1].url, /\/api\/workspace\/ws-my\/trash\/t1$/)
  })
})

// ═══════════════════ J4 — purge : écrite, désarmée par défaut ═══════════════════

const ARBRE_PURGE = {
  view_id: 'root-my', name: 'My Workspace', children: [
    { view_id: 'sp-cockpit', name: 'IakaCockpit', is_space: true, children: [
      { view_id: 'p1', name: 'CLAUDE.md', children: [] },
      { view_id: 'p2', name: 'specs/PROJET.md', children: [] },
    ] },
    { view_id: 'sp-pcl', name: 'IakaPcl', is_space: true, children: [] },
    { view_id: 'sp-general', name: 'General', is_space: true, children: [
      { view_id: 'poc', name: 'iakaframe — preuve de concept API', children: [] },
      { view_id: 'n90', name: SEC.NOTES, children: [
        { view_id: 'n-sub', name: 'note humaine', children: [] },
      ] },
    ] },
  ],
}

test('purge parsePurgeArgs : drapeaux répétables, dry-run par défaut', () => {
  const a = parsePurgeArgs(['--workspace', 'My Workspace', '--space', 'A', '--space', 'B', '--page', 'P', '--trash'])
  assert.deepEqual(a.spaces, ['A', 'B'])
  assert.deepEqual(a.pages, ['P'])
  assert.equal(a.includeTrash, true)
  assert.equal(a.execute, false)
  assert.equal(a.dryRun, true, 'le dry-run est le comportement PAR DÉFAUT')
  assert.equal(parsePurgeArgs(['--execute']).dryRun, false)
})

test('purge flattenTree / countDescendants : chemins et volumétrie', () => {
  const flat = flattenTree(ARBRE_PURGE)
  assert.ok(flat.some((f) => f.path === 'IakaCockpit / CLAUDE.md'))
  assert.equal(countDescendants(ARBRE_PURGE.children[0]), 2)
  assert.ok(flat.find((f) => f.node.view_id === 'n-sub').protected, 'sous 90 · Notes = protégé')
})

test('J4 planPurge : espaces + page + débris de corbeille, avec volumétrie', () => {
  const plan = planPurge({
    tree: ARBRE_PURGE,
    trash: [{ view_id: 'd1', name: 'vieux' }, { view_id: 'd2', name: 'vieux 2' }],
    spaces: ['IakaCockpit', 'IakaPcl'],
    pages: ['iakaframe — preuve de concept API'],
    includeTrash: true,
  })
  assert.deepEqual(plan.targets.map((t) => t.view_id), ['sp-cockpit', 'sp-pcl', 'poc', 'd1', 'd2'])
  assert.equal(plan.targets.find((t) => t.view_id === 'sp-cockpit').descendants, 2)
  assert.equal(plan.targets.filter((t) => t.kind === 'trash').length, 2)
})

test('J4 planPurge : cible absente signalée, jamais une erreur', () => {
  const plan = planPurge({ tree: ARBRE_PURGE, spaces: ['NexistePas'] })
  assert.deepEqual(plan.targets, [])
  assert.deepEqual(plan.notFound, [{ kind: 'space', name: 'NexistePas' }])
})

test('§5.4 planPurge : 90 · Notes et ses descendants sont inviolables', () => {
  const p1 = planPurge({ tree: ARBRE_PURGE, pages: [SEC.NOTES] })
  assert.deepEqual(p1.targets, [])
  assert.match(p1.refused[0].reason, /inviolable/)
  const p2 = planPurge({ tree: ARBRE_PURGE, pages: ['note humaine'] })
  assert.deepEqual(p2.targets, [])
  assert.match(p2.refused[0].reason, /sous 90 · Notes/)
})

test('J4 purgeArmed : DEUX verrous indépendants, désarmé par défaut', () => {
  assert.equal(purgeArmed({ execute: false }, 'ws-my').armed, false)
  assert.match(purgeArmed({ execute: false }, 'ws-my').reason, /dry-run/)
  assert.equal(purgeArmed({ execute: true }, 'ws-my').armed, false)
  assert.match(purgeArmed({ execute: true }, 'ws-my').reason, /--confirm ws-my/)
  assert.equal(purgeArmed({ execute: true, confirm: 'autre' }, 'ws-my').armed, false)
  assert.equal(purgeArmed({ execute: true, confirm: 'ws-my' }, 'ws-my').armed, true)
})

test('J4 renderPlan : compte et nature lisibles pour le décideur', () => {
  const plan = planPurge({
    tree: ARBRE_PURGE, trash: [{ view_id: 'd1', name: 'vieux' }],
    spaces: ['IakaCockpit'], pages: ['iakaframe — preuve de concept API'], includeTrash: true,
  })
  const txt = renderPlan(plan, { workspaceName: 'My Workspace', workspaceId: 'ws-my' })
  assert.match(txt, /objets à supprimer définitivement : 3/)
  assert.match(txt, /espaces : 1 · pages : 1 · débris de corbeille : 1/)
  assert.match(txt, /2 descendant\(s\) emportés/)
})

test('J4 runPurge : sans --execute, LISTE et ne supprime RIEN', async () => {
  const server = makeFakeServer()
  server.roots['ws-my'].children = JSON.parse(JSON.stringify(ARBRE_PURGE.children))
  server.trash = [{ view_id: 'd1', name: 'vieux' }]
  const r = await runPurge(
    ['--workspace', 'My Workspace', '--space', 'IakaCockpit', '--trash', '--dry-run'],
    ENV, { fs: fsMock, log: silence, makeClient: () => makeFakeClient(server) },
  )
  assert.equal(r.executed, false)
  assert.equal(r.plan.targets.length, 2)
  assert.equal(server.deleted.length, 0, 'aucune suppression en dry-run')
  assert.equal(server.writes, 0, 'aucune écriture en dry-run')
  assert.ok(server.roots['ws-my'].children.some((c) => c.name === 'IakaCockpit'))
})

test('J4 runPurge : --execute sans --confirm valide reste désarmé', async () => {
  const server = makeFakeServer()
  server.roots['ws-my'].children = JSON.parse(JSON.stringify(ARBRE_PURGE.children))
  const r = await runPurge(
    ['--workspace', 'My Workspace', '--space', 'IakaPcl', '--execute', '--confirm', 'mauvais-id'],
    ENV, { fs: fsMock, log: silence, makeClient: () => makeFakeClient(server) },
  )
  assert.equal(r.executed, false)
  assert.equal(server.writes, 0)
})

test('J4 runPurge : armé -> move-to-trash PUIS DELETE /trash (sinon ce n’est pas une purge)', async () => {
  const server = makeFakeServer()
  server.roots['ws-my'].children = JSON.parse(JSON.stringify(ARBRE_PURGE.children))
  server.trash = [{ view_id: 'd1', name: 'vieux' }]
  const r = await runPurge(
    ['--workspace', 'ws-my', '--space', 'IakaPcl', '--trash', '--execute', '--confirm', 'ws-my'],
    ENV, { fs: fsMock, log: silence, makeClient: () => makeFakeClient(server) },
  )
  assert.equal(r.executed, true)
  assert.equal(r.deleted, 2)
  assert.deepEqual(server.deleted.sort(), ['d1', 'sp-pcl'])
  assert.equal(server.trash.length, 0, 'la corbeille doit être vidée des cibles')
  assert.ok(!server.roots['ws-my'].children.some((c) => c.name === 'IakaPcl'))
})

test('J4 runPurge : garde-fous d’usage (workspace obligatoire, cible obligatoire)', async () => {
  const server = makeFakeServer()
  await assert.rejects(
    () => runPurge(['--space', 'X'], ENV, { fs: fsMock, log: silence, makeClient: () => makeFakeClient(server) }),
    /--workspace <nom\|id> est OBLIGATOIRE/,
  )
  await assert.rejects(
    () => runPurge(['--workspace', 'projects'], ENV, { fs: fsMock, log: silence, makeClient: () => makeFakeClient(server) }),
    /rien à faire/,
  )
  assert.equal(server.writes, 0)
})

// ═══════════════════ Exécution ═══════════════════

// Les cas sont EXPORTÉS pour que la chaîne `node --test` (depuis cli/) les rejoue un par un
// via cli/test/appflowy-doc-skill.test.js — cf. en-tête, R-1.
export { cases }

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  let n = 0
  let ko = 0
  for (const [name, fn] of cases) {
    try {
      await fn()
      n++
      console.log('  ok —', name)
    } catch (e) {
      ko++
      console.error('  ÉCHEC —', name, '\n     ', e.message)
    }
  }
  console.log(`\n${n} tests OK${ko ? `, ${ko} ÉCHEC(S)` : ''}`)
  if (ko) process.exit(1)
}
