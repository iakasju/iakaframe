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
  listInterruptsParagraph, contentWords, sourceReference, wordDeficit, renderedText,
  contentLoss, literalRegions, literalLoss,
  belongsToOrderedRun, structureReference, structureLoss, inlineCodeRegions, inlineCodeLoss,
  fingerprint, pageKey, safeFileName, cachePath, readCache, writeCache, planOrphans,
  RENDER_VERSION,
  stripHtmlComments, docBody,
  isGuideDoc, walkGuideDocs,
  parseRecetteVersion, compareRecetteDesc, shortDate, recetteStatus, recetteBlocks, resolveRecettes,
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
  assert.equal(isStructuralDoc('README.md'), false, 'le README n’est PAS un doc structurant')
  assert.equal(isStructuralDoc('specs/instructions/note.txt'), false)
  assert.equal(isStructuralDoc('docs/api.html'), false, 'seul le Markdown entre')
  assert.equal(isStructuralDoc('specs/mock/x.md'), false)
})

// ── Lot 4 — contrat élargi : `docs/**.md` hors `qualite/` alimente `60 · Guide` ──

test('lot4 isGuideDoc : docs/**.md hors qualite/, en profondeur', () => {
  assert.equal(isGuideDoc('docs/prise-en-main.md'), true)
  assert.equal(isGuideDoc('docs/guides/api/rest.md'), true, 'le contrat dit ** et non *')
  assert.equal(isGuideDoc('docs/qualite/v0.1.0.md'), false, 'la qualité reste la section 40')
  assert.equal(isGuideDoc('docs/notes.txt'), false)
  assert.equal(isGuideDoc('specs/PROJET.md'), false)
  assert.equal(isGuideDoc('CLAUDE.md'), false)
})

test('lot4 : un doc de guide est structurant, et un gabarit de guide ne l’est JAMAIS', () => {
  assert.equal(isStructuralDoc('docs/prise-en-main.md'), true)
  assert.equal(isStructuralDoc('docs/guides/api.md'), true)
  assert.equal(isStructuralDoc('docs/_gabarit.md'), false, 'B1 prime sur tout')
  assert.equal(isStructuralDoc('docs/guides/_brouillon.md'), false)
})

test('lot4 selectStructuralDocs : le guide vient APRÈS la qualité, en dernier rang', () => {
  assert.deepEqual(selectStructuralDocs([
    'docs/guides/api.md', 'docs/qualite/v0.1.0.md', 'CLAUDE.md', 'docs/prise-en-main.md',
  ]), ['CLAUDE.md', 'docs/qualite/v0.1.0.md', 'docs/guides/api.md', 'docs/prise-en-main.md'])
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
// Texte porté par UN bloc (utile quand on part de fileToBlocks et non de markdownToBlocks).
const text = (b) => ((b && b.data && b.data.delta) || []).map((d) => d.insert).join('')

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
  // A14 — fixtures BIDON : aucune URL d'infra réelle dans les tests.
  assert.deepEqual(parseInline('[dépôt](http://fixture.invalid:3001/x)'),
    [{ insert: 'dépôt', attributes: { href: 'http://fixture.invalid:3001/x' } }])
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

test('PERTE ASSUMÉE images : mention explicite avec le texte alternatif, JAMAIS un silence', () => {
  // Le texte alternatif est du CONTENU : l'escamoter serait une perte silencieuse de plus.
  assert.deepEqual(parseInline('avant ![schéma](./img/a.png) après'),
    [{ insert: 'avant image non publiée : schéma (./img/a.png) après' }])
  assert.deepEqual(parseInline('![](./img/b.png)'),
    [{ insert: 'image non publiée : ./img/b.png' }])
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

test('PERTE ASSUMÉE : HTML brut (hors commentaires) et biffé ~~ laissés en texte', () => {
  assert.deepEqual(types('<div class="x">bloc</div>'), ['paragraph'])
  assert.deepEqual(parseInline('a ~~biffé~~ b'), [{ insert: 'a ~~biffé~~ b' }])
})

// ═══════ Lot 4 — commentaires HTML MASQUÉS (arbitrage du décideur) ═══════
//
// Bruit d'édition dans un miroir de LECTURE : masqué, comme le front-matter. Les deux
// exemptions (littéral de bloc, littéral en ligne) ne sont pas décoratives : sans elles, le
// masquage détruirait un `<!-- -->` MONTRÉ EN EXEMPLE, c.-à-d. du contenu.

test('lot4 : un commentaire sur une ligne est retiré du corps publié', () => {
  assert.deepEqual(fileToBlocks('<!-- commentaire -->'), [], 'rien à publier')
  assert.equal(text(fileToBlocks('avant <!-- note --> après')[0]), 'avant  après')
  assert.deepEqual(types('# T\n\n<!-- caché -->\n\ncorps'), ['heading', 'paragraph', 'paragraph'],
    'markdownToBlocks SEUL ne masque pas : le masquage est un geste de docBody')
  assert.deepEqual(fileToBlocks('# T\n\n<!-- caché -->\n\ncorps').map((b) => b.type), ['heading', 'paragraph'])
})

test('lot4 : un commentaire À CHEVAL sur plusieurs lignes est masqué en entier', () => {
  const md = 'un\n\n<!--\nnote de rédaction\nsur trois lignes\n-->\n\ndeux'
  const b = fileToBlocks(md)
  assert.deepEqual(b.map((x) => x.type), ['paragraph', 'paragraph'])
  assert.deepEqual(b.map(text), ['un', 'deux'])
  assert.equal(/rédaction/.test(renderedText(b)), false, 'le texte commenté ne survit nulle part')
})

test('lot4 : un commentaire ne SOUDE jamais deux paragraphes distincts', () => {
  // Une ligne qui ne portait QUE le commentaire devient vide, donc séparatrice : deux
  // paragraphes restent deux paragraphes. Souder aurait été la faute grave — c'est le
  // pendant exact de l'agglomération A7, qui ne doit jamais franchir un bloc.
  assert.deepEqual(fileToBlocks('un\n<!-- x -->\ndeux').map(text), ['un', 'deux'])
  assert.deepEqual(fileToBlocks('un\n\n<!-- x -->\n\ndeux').map(text), ['un', 'deux'])
  // En revanche un commentaire EN MILIEU de ligne ne coupe rien : la ligne subsiste.
  assert.deepEqual(fileToBlocks('un <!-- x --> deux').map(text), ['un  deux'])
})

test('lot4 : un commentaire DANS un bloc fencé est du CONTENU — jamais masqué', () => {
  const md = '```html\n<!-- ceci est un exemple -->\n```'
  const b = fileToBlocks(md)
  assert.deepEqual(b.map((x) => x.type), ['code'])
  assert.equal(text(b[0]), '<!-- ceci est un exemple -->')
  assert.deepEqual(literalLoss(md, b), [], 'l’invariant littéral bloc le prouve')
})

test('lot4 : un commentaire dans un bloc INDENTÉ est du CONTENU — jamais masqué', () => {
  const md = 'texte\n\n    <!-- exemple indenté -->\n\nfin'
  const b = fileToBlocks(md)
  assert.deepEqual(b.map((x) => x.type), ['paragraph', 'code', 'paragraph'])
  assert.equal(text(b[1]), '<!-- exemple indenté -->')
  assert.deepEqual(literalLoss(md, b), [])
})

test('lot4 : un commentaire dans un SPAN de code en ligne est du CONTENU', () => {
  const md = 'on écrit `<!-- todo -->` pour commenter.'
  const b = fileToBlocks(md)
  assert.equal(text(b[0]), 'on écrit <!-- todo --> pour commenter.')
  assert.deepEqual(inlineCodeLoss(md, b), [], 'l’invariant littéral en ligne le prouve')
})

test('lot4 : le masquage ne fait rougir AUCUNE des quatre sondes (perte déclarée)', () => {
  const md = '# Titre\n\n<!-- note interne -->\n\n- item un\n- item deux\n\n```\nlittéral\n```\n'
  const b = fileToBlocks(md)
  assert.deepEqual(contentLoss(md, b), [])
  assert.deepEqual(literalLoss(md, b), [])
  assert.deepEqual(inlineCodeLoss(md, b), [])
  assert.deepEqual(structureLoss(md, b), [])
})

test('lot4 : stripHtmlComments — cas dégénérés, jamais d’exception ni de dévoration', () => {
  for (const x of ['', null, undefined, '<!--', '-->', '<!-- <!-- -->', '```\n<!--\n']) {
    assert.equal(typeof stripHtmlComments(x), 'string', `échec sur ${JSON.stringify(x)}`)
  }
  // `<!--` non refermé : tout ce qui suit est du commentaire (règle HTML), pas une erreur.
  assert.equal(stripHtmlComments('a <!-- b\nc').trim(), 'a')
  // `-->` orphelin : ce n'est pas un commentaire, le texte reste.
  assert.equal(stripHtmlComments('a --> b'), 'a --> b')
})

test('lot4 : docBody enchaîne front-matter PUIS commentaires, dans cet ordre', () => {
  assert.equal(docBody('---\ntitle: T\n---\n# C\n<!-- x -->').trim(), '# C')
  // Un `<!--` dans le front-matter ne peut pas manger le corps : le front est retiré d'abord.
  assert.equal(docBody('---\ntitle: T <!--\n---\n# C').trim(), '# C')
})

test('robustesse : entrées dégénérées ne lèvent jamais', () => {
  for (const x of ['', null, undefined, '\n\n\n', '   ', '|', '```', '>', '- ']) {
    assert.ok(Array.isArray(markdownToBlocks(x)), `échec sur ${JSON.stringify(x)}`)
  }
})

// ═══════ R-2 — perte de contenu SILENCIEUSE : les deux défauts + la sonde ═══════

test('R-2a : le marqueur d’une continuation paresseuse n’est PAS avalé', () => {
  // Reproduction exacte du gate (iakaIDE/specs/instructions/f1-portefeuille.md:67).
  // Avant : 2 blocs numbered_list et « 3000) » n’apparaissait NULLE PART.
  const md = '1. **Port dev = 3010** (iakaVODdash occupe deja\n   3000) : configurer Vite sur 3010.'
  const b = markdownToBlocks(md)
  assert.deepEqual(b.map((x) => x.type), ['numbered_list'], 'la ligne repliée reste DANS l’item')
  const t = b[0].data.delta.map((d) => d.insert).join('')
  assert.match(t, /occupe deja 3000\) : configurer Vite sur 3010\./)
  assert.deepEqual(contentLoss(md), [], 'aucun mot perdu')
})

test('R-2a variante : « 14. » n’interrompt pas un paragraphe (règle CommonMark)', () => {
  const md = 'Le nombre de fenêtres de ma maison est\n14. Le nombre de portes est 6.'
  const b = markdownToBlocks(md)
  assert.deepEqual(b.map((x) => x.type), ['paragraph'])
  assert.match(b[0].data.delta.map((d) => d.insert).join(''), /est 14\. Le nombre de portes/)
  assert.deepEqual(contentLoss(md), [])
})

test('R-2a : une liste ordonnée démarrant à 1 interrompt bien un paragraphe', () => {
  // La règle ne doit pas fermer la porte au cas légitime, sinon elle casse tout le corpus.
  assert.deepEqual(markdownToBlocks('Prescription :\n1. faire ceci\n2. puis cela')
    .map((x) => x.type), ['paragraph', 'numbered_list', 'numbered_list'])
  assert.deepEqual(markdownToBlocks('Prescription :\n- faire ceci').map((x) => x.type),
    ['paragraph', 'bulleted_list'], 'une puce, elle, interrompt toujours')
})

test('listInterruptsParagraph : 1 seul ouvre, item vide jamais, puce toujours', () => {
  assert.equal(listInterruptsParagraph('1.', 'x'), true)
  assert.equal(listInterruptsParagraph('1)', 'x'), true)
  assert.equal(listInterruptsParagraph('2.', 'x'), false)
  assert.equal(listInterruptsParagraph('3000)', 'x'), false)
  assert.equal(listInterruptsParagraph('-', 'x'), true)
  assert.equal(listInterruptsParagraph('-', '   '), false, 'un item vide n’interrompt rien')
})

test('R-2b : bloc de code INDENTÉ (4 espaces) → bloc `code`, contenu jamais reformaté', () => {
  // Reproduction exacte du gate (remede-vendor-check-derive-de-l-etat.md L55/123/162/212).
  // Avant : un paragraphe où « __tests__ » devenait « tests » en GRAS, les `_` perdus.
  const md = 'Prescription :\n\n    cp library/personas/*.md   <GUI>/packages/core/__tests__/fixtures/personas/\n'
  const b = markdownToBlocks(md)
  assert.deepEqual(b.map((x) => x.type), ['paragraph', 'code'])
  assert.equal(b[1].data.delta[0].insert,
    'cp library/personas/*.md   <GUI>/packages/core/__tests__/fixtures/personas/')
  assert.equal(b[1].data.language, undefined, 'pas de langage sur un bloc indenté')
  assert.ok(!b[1].data.delta.some((d) => d.attributes), 'AUCUN formatage en ligne dans du littéral')
  assert.deepEqual(literalLoss(md), [], 'le littéral se retrouve verbatim')
})

test('R-2b : une tabulation vaut aussi un bloc indenté ; le retour au ras ferme le bloc', () => {
  const b = markdownToBlocks('texte\n\n\tligne littérale\n\nsuite')
  assert.deepEqual(b.map((x) => x.type), ['paragraph', 'code', 'paragraph'])
  assert.equal(b[1].data.delta[0].insert, 'ligne littérale')
})

test('R-2b : un retrait DANS une liste reste une continuation d’item, pas du code', () => {
  // Sans cette garde, toute sous-liste ou continuation indentée basculerait en code.
  assert.deepEqual(markdownToBlocks('- a\n    suite indentée').map((x) => x.type), ['bulleted_list'])
  assert.deepEqual(markdownToBlocks('- a\n    - b').map((x) => x.type), ['bulleted_list', 'bulleted_list'])
})

test('R-2b : un bloc fencé DANS un item de liste reste littéral', () => {
  const md = '- **Contrat** :\n  ```ts\n  export type Mode = "chat" | "shell";\n  ```\n- suivant'
  const b = markdownToBlocks(md)
  assert.deepEqual(b.map((x) => x.type), ['bulleted_list', 'code', 'bulleted_list'])
  assert.equal(b[1].data.language, 'ts')
  assert.equal(b[1].data.delta[0].insert, 'export type Mode = "chat" | "shell";', 'dédenté et intact')
  assert.deepEqual(literalLoss(md), [])
})

test('SONDE R-2 (1/2) : le multi-ensemble des mots détecte une disparition', () => {
  assert.deepEqual(wordDeficit(['a', 'b', 'b', 'c'], ['c', 'b', 'a']), ['b'])
  assert.deepEqual(wordDeficit(['a'], ['a', 'surplus']), [], 'le surplus n’est pas une perte')
  assert.deepEqual(contentWords('APPFLOWY_WORKSPACE _italique_ 42'),
    ['APPFLOWY_WORKSPACE', 'italique', '42'], '`_` interne = contenu, `_` de bordure = emphase')
})

test('SONDE R-2 : la référence ne concède QUE les marques déclarées', () => {
  const ref = sourceReference('---\ntitle: x\n---\n\n1. un\n2. deux\n- [x] fait\n')
  assert.ok(!/title/.test(ref), 'front-matter hors référence')
  assert.match(ref, /^\s*un\ndeux\nfait/, 'marqueurs conformes et case à cocher concédés')
  // …mais un « 3000) » surgi d’une ligne repliée reste, LUI, dans la référence.
  assert.match(sourceReference('1. deja\n   3000) : configurer'), /3000\)/)
})

test('R-A : la référence ne dépend plus de l’HISTORIQUE du document', () => {
  // Angle mort mesuré au gate : la mémoire des suites était globale et jamais purgée. Une
  // sous-liste « 1. 2. » vue plus haut au retrait 3 blanchissait n’importe quel « 3000) »
  // surgi au même retrait des dizaines de lignes plus bas — la sonde avait une maille
  // dépendante du passé. Toute ligne au retrait w ferme les suites plus profondes que w.
  const md = '1. alpha\n   1. sous-a\n   2. sous-b\n\n1. **Port dev = 3010** (occupe deja\n   3000) : configurer.'
  assert.match(sourceReference(md), /3000\)/, '« 3000) » DOIT rester dans la référence')
  assert.deepEqual(contentLoss(md), [], 'et le vrai rendu ne le perd pas')
  // La sonde rougit bien si un mapper l’escamote (rendu fautif injecté).
  assert.deepEqual(
    contentLoss(md, [numbered('alpha'), numbered('sous-a'), numbered('sous-b'),
      numbered('Port dev = 3010 (occupe deja'), numbered(': configurer.')]),
    ['3000'], 'un mapper qui avale « 3000) » est désormais contredit')
  // Les suites LÉGITIMES au même retrait restent concédées (pas de faux positif).
  assert.ok(!/\b2\./.test(sourceReference('1. a\n   1. x\n   2. y\n2. b\n   1. z\n   2. w')))
})

test('SONDE R-2 (2/2) : tout littéral du source se retrouve dans un bloc `code`', () => {
  assert.deepEqual(literalRegions('a\n\n```js\nconst x = 1\n```\n\n    indenté\n'),
    ['const x = 1', 'indenté'])
  assert.deepEqual(literalLoss('a\n\n```js\nconst x = 1\n```\n\n    indenté\n'), [])
})

test('SONDE R-2 : elle CONTREDIT un mapper fautif (mutation-test de la sonde)', () => {
  // Une sonde qu’aucune faute ne fait rougir ne prouve rien. On lui soumet ici des rendus
  // FAUTIFS fabriqués à la main : elle doit les refuser.
  const md = '1. deja\n   3000) : configurer'
  const rendu = [numbered('deja'), numbered(': configurer')] // le rendu d’AVANT le correctif
  assert.deepEqual(
    wordDeficit(contentWords(sourceReference(md)), contentWords(renderedText(rendu))),
    ['3000'], 'la sonde doit voir « 3000 » disparaître')
  // R-E — ce volet était À MOITIÉ TAUTOLOGIQUE : il filtrait un tableau construit sans bloc
  // `code` et constatait qu'il n'en contenait pas, sans jamais appeler `literalLoss`. On
  // INJECTE désormais le rendu fautif DANS la sonde : c'est elle qui doit rougir.
  const md2 = 'x :\n\n    a__b__c\n'
  const renduFaux = [para('x :'), para([{ insert: 'a' }, { insert: 'b', attributes: { bold: true } }, { insert: 'c' }])]
  assert.equal(literalRegions(md2).length, 1, 'la sonde voit une région littérale')
  assert.deepEqual(literalLoss(md2, renduFaux), ['a__b__c'],
    'la sonde DOIT refuser un littéral reformaté en gras')
  assert.deepEqual(literalLoss(md2), [], '…et rester verte sur le vrai rendu')
})

test('SONDE R-2 : renderedText ramasse href et langage (le contenu n’est pas que du texte)', () => {
  const b = markdownToBlocks('[doc](https://exemple.test/page)\n\n```bash\nnpm test\n```')
  const t = renderedText(b)
  assert.match(t, /exemple\.test/)
  assert.match(t, /bash/)
  assert.match(t, /npm test/)
})

// ═══════ R-2a bis — la règle CommonMark ne doit PAS fondre les vraies listes (A7) ═══════

test('R-2a bis : une suite « 5. 6. 7. » après un paragraphe reste une LISTE', () => {
  // Reproduction exacte du gate du lot 3
  // (iakaFrameGUI/specs/instructions/feanor-source-inference-selecteur.md:215).
  // Le correctif R-2a fondait les 7 prescriptions dans le paragraphe qui les annonce.
  const md = '**Lot 2 — provider OpenAI**\n5. `llm.rs` : dispatch\n6. `settings.rs` : clé\n7. `backend.ts` : champ'
  assert.deepEqual(markdownToBlocks(md).map((b) => b.type),
    ['paragraph', 'numbered_list', 'numbered_list', 'numbered_list'])
  assert.deepEqual(contentLoss(md), [])
  assert.deepEqual(structureLoss(md), [], 'et la STRUCTURE est intacte')
})

test('R-2a bis : une liste qui reprend après un tableau n’est pas avalée', () => {
  // Forme réelle d’iakaIDE/specs/instructions/f1-portefeuille.md:49 : le tableau ferme la
  // liste, la ligne repliée rouvre un paragraphe, et « 2. » doit rouvrir la liste.
  const md = '1. Socle\n\n| a | b |\n| - | - |\n\n   Ne PAS copier en bloc — repartir\n   d’un squelette vierge.\n2. Lecture git\n3. Découverte'
  assert.deepEqual(markdownToBlocks(md).map((b) => b.type),
    ['numbered_list', 'code', 'paragraph', 'numbered_list', 'numbered_list'])
})

test('R-2a bis : le voisin AMONT suffit (dernier item d’une suite, sans successeur)', () => {
  // naonedge-dashboard/specs/instructions/bouton-work-cross-os-macos.md:80 : « 3. » n’a pas
  // de successeur, mais « 2. » le précède au même retrait.
  const md = '1. un\n2. deux\n   ```sh\n   echo x\n   ```\n   suite de l’item deux.\n3. trois'
  const t = markdownToBlocks(md).map((b) => b.type)
  assert.equal(t.filter((x) => x === 'numbered_list').length, 3, 'les 3 items survivent')
})

test('R-2a bis : la ligne repliée de PROSE reste, elle, dans le paragraphe', () => {
  // Les trois cas réels que le correctif R-2a devait sauver — ils ne doivent pas régresser.
  for (const [md, attendu] of [
    ['Cela fait **20**, pas\n18. L’arithmétique suffisait.', ['paragraph']],
    ['… `frame lint iakaframe` exit\n0. **Réponse nette au brief.**', ['paragraph']],
    ['1. **Port dev = 3010** (iakaVODdash occupe deja\n   3000) : configurer Vite.', ['numbered_list']],
  ]) {
    assert.deepEqual(markdownToBlocks(md).map((b) => b.type), attendu, md.slice(0, 30))
    assert.deepEqual(contentLoss(md), [], 'et aucun mot perdu')
  }
})

test('belongsToOrderedRun : voisin amont OU aval, au MÊME retrait, jamais ailleurs', () => {
  assert.equal(belongsToOrderedRun(['prose', '5. a', '6. b'], 1), true, 'successeur plus grand')
  assert.equal(belongsToOrderedRun(['2. a', 'prose', '3. b'], 2), false, 'prose au même retrait : suite close')
  assert.equal(belongsToOrderedRun(['2. a', '   repli', '3. b'], 2), true, 'la continuation se traverse')
  assert.equal(belongsToOrderedRun(['texte', '14. isolé'], 1), false, 'aucun voisin ordonné')
  assert.equal(belongsToOrderedRun(['1. a', '   3000) suite'], 1), false, 'retrait différent : hors suite')
  assert.equal(belongsToOrderedRun(['5. a', '4. b'], 1), false, 'une suite ne décroît pas')
  assert.equal(belongsToOrderedRun(['- a', '- b'], 1), false, 'une puce n’est pas une suite ordonnée')
})

// ═══════ SONDE (3/3) — l’invariant de STRUCTURE : la leçon du gate du lot 3 ═══════

test('SONDE R-3 : la référence compte les structures du source, sans le mapper', () => {
  const md = '# T\n\ntexte\n\n- a\n- b\n\n---\n\n```js\nx\n```\n'
  assert.deepEqual(structureReference(md), { heading: 1, divider: 1, list: 2, code: 1 })
  assert.deepEqual(structureLoss(md), [], 'le rendu porte bien tout')
})

test('SONDE R-3 : elle CONTREDIT le mapper du lot 3 (mutation réelle, pas un tableau bidon)', () => {
  // LE test qui manquait au lot 3 : le rendu fautif est celui que produisait RÉELLEMENT le
  // mapper d’alors — 3 items de liste fondus dans le paragraphe qui les annonce.
  const md = '**Lot 2 — provider OpenAI**\n5. `llm.rs` : dispatch\n6. `settings.rs` : clé\n7. `backend.ts` : champ'
  const renduLot3 = [para('Lot 2 — provider OpenAI 5. llm.rs : dispatch 6. settings.rs : clé 7. backend.ts : champ')]
  assert.deepEqual(structureLoss(md, renduLot3), [{ type: 'list', attendu: 3, rendu: 0 }],
    'la sonde de STRUCTURE doit voir les 3 blocs de liste disparaître')
  assert.deepEqual(contentLoss(md, renduLot3), [],
    'alors que la sonde de MOTS reste verte : c’est bien un angle mort qu’on comble')
})

test('SONDE R-3 : titre avalé, séparateur perdu, tableau reformaté — tous vus', () => {
  const md = '## Titre\n\n---\n\n| a | b |\n| - | - |\n'
  assert.deepEqual(structureLoss(md, [para('Titre'), para('---'), para('| a | b |')]),
    [{ type: 'heading', attendu: 1, rendu: 0 },
      { type: 'divider', attendu: 1, rendu: 0 },
      { type: 'code', attendu: 1, rendu: 0 }])
})

test('SONDE R-3 : c’est une BORNE BASSE — un surplus de blocs n’est jamais une faute', () => {
  const md = '- a\n'
  assert.deepEqual(structureLoss(md, [bullet('a'), bullet('bonus'), heading(1, 'bonus')]), [])
})

// ═══════ R-B — le littéral EN LIGNE : le code en ligne lie plus fort que l’emphase ═══════

test('R-B : `capabilities/*` dans un italique garde son astérisque', () => {
  // Cas réel (iakaframe/specs/instructions/surface-apprentissage.md:269) : l’astérisque DU
  // SPAN fermait l’italique ouvert avant lui, et le littéral perdait son `*` en silence.
  const md = '*Test : `capabilities/*` liste les entrées.*'
  const seg = markdownToBlocks(md)[0].data.delta.find((d) => d.attributes && d.attributes.code)
  assert.equal(seg.insert, 'capabilities/*')
  assert.deepEqual(inlineCodeLoss(md), [])
})

test('R-B : idem pour le gras — `~/work/iakaframe/**` survit', () => {
  const md = '**Périmètre : `~/work/iakaframe/**` uniquement.**'
  assert.ok(markdownToBlocks(md)[0].data.delta.some((d) => d.attributes?.code && d.insert === '~/work/iakaframe/**'))
  assert.deepEqual(inlineCodeLoss(md), [])
})

test('R-B : la sonde de code en ligne CONTREDIT un rendu qui découpe le span', () => {
  // Rendu fautif = exactement la signature décrite au gate : le span coupé en trois, le
  // milieu passé en GRAS. Les sondes « mots » et « littéral bloc » n’y voient rien.
  const md = 'voir `library/__tests__/fixtures/` pour le détail'
  const faux = [para([{ insert: 'voir library/' },
    { insert: 'tests', attributes: { bold: true } },
    { insert: '/fixtures/ pour le détail' }])]
  assert.deepEqual(inlineCodeLoss(md, faux), ['library/__tests__/fixtures/'])
  assert.deepEqual(literalLoss(md, faux), [], 'l’invariant de littéral BLOC, lui, ne voit rien')
  assert.deepEqual(inlineCodeLoss(md), [], 'et il est vert sur le vrai rendu')
})

test('R-B : extraction des spans — ni backtick esseulé, ni span à cheval perdu', () => {
  assert.deepEqual(inlineCodeRegions('a `x` b ``y`` c'), ['x', 'y'])
  assert.deepEqual(inlineCodeRegions('un backtick ` tout seul'), [], 'pas de span, pas de promesse')
  assert.deepEqual(inlineCodeRegions('début `chemin/\ntrès/long` fin'), ['chemin/ très/long'],
    'un span à cheval est agglomeré comme le mapper le fait')
  assert.deepEqual(inlineCodeRegions('```js\n`pas un span`\n```'), [], 'le fencé est hors périmètre')
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

  // SONDE R-2 sur ce document réaliste : rien ne disparaît, rien n'est déformaté.
  assert.deepEqual(contentLoss(md), [])
  assert.deepEqual(literalLoss(md), [])
})

test('SONDE R-2 bout en bout : zéro perte sur un échantillon de tout le sous-ensemble', () => {
  // Un document par difficulté connue du corpus. La sonde tourne aussi hors chaîne sur les
  // 420 docs structurants du portefeuille (voir SKILL.md § Sonde de conservation).
  const echantillon = [
    '# Titre\n\nProse rewrappée\nsur deux lignes.\n',
    '1. un\n2. deux\n3) trois\n',
    '1. **Port dev = 3010** (iakaVODdash occupe deja\n   3000) : configurer Vite sur 3010.\n',
    'Le nombre de fenêtres est\n14. Le nombre de portes est 6.\n',
    'Prescription :\n\n    cp library/personas/*.md   <GUI>/core/__tests__/fixtures/\n',
    '- item\n  ```bash\n  npm run test:all\n  ```\n- suivant\n',
    '| a | b |\n|---|---|\n| `x\\|y` | 2 |\n',
    '> 1. cité numéroté\n> 2. suite\n\n> simple citation\n',
    '- [ ] à faire\n- [x] fait\n  - imbriqué\n',
    'voir ![schéma du flux](./img/a.png) et [la spec](./specs/PROJET.md) et [web](https://ex.test/p)\n',
    '---\ntitle: Depuis le front-matter\n---\n\n# Corps\n\ntexte APPFLOWY_WORKSPACE et _emphase_.\n',
    '~~~python\nprint("**pas gras**")\n~~~\n',
    '#### Titre profond\n\n<!-- commentaire HTML -->\n\ntexte ~~biffé~~ final\n',
  ]
  for (const md of echantillon) {
    assert.deepEqual(contentLoss(md), [], 'mots perdus dans : ' + JSON.stringify(md.slice(0, 60)))
    assert.deepEqual(literalLoss(md), [], 'littéral reformaté dans : ' + JSON.stringify(md.slice(0, 60)))
  }
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
  assert.deepEqual(p.sections.map((s) => s.key), ['00', '10', '20', '30', '40', '50', '90'])
  assert.deepEqual(p.sections.map((s) => s.name), [
    SEC.OVERVIEW, SEC.PROJET, SEC.ETAT, SEC.CADRAGE, SEC.QUALITE, SEC.RECETTE, SEC.NOTES,
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

// ── Lot 4 — `50 · Recette (RQV)` : le STATUT seul, JAMAIS le HTML ──

test('lot4 parseRecetteVersion : les DEUX conventions de nom, sinon null', () => {
  assert.equal(parseRecetteVersion('specs/recettes/recette-v0.15.0.html'), 'v0.15.0')
  assert.equal(parseRecetteVersion('specs/recettes/v0.15.0.recette.html'), 'v0.15.0')
  assert.equal(parseRecetteVersion('specs/recettes/recette-1.2.3.html'), 'v1.2.3')
  assert.equal(parseRecetteVersion('specs/recettes/recette.html'), null)
  assert.equal(parseRecetteVersion(undefined), null)
})

test('lot4 recetteStatus : version décroissante, nom et date lisibles', () => {
  const s = recetteStatus([
    { rel: 'specs/recettes/recette-v0.9.0.html', mtimeMs: 1000 },
    { rel: 'specs/recettes/recette-v0.10.0.html', mtimeMs: 500 },
  ])
  assert.equal(s.count, 2)
  assert.deepEqual(s.entries.map((e) => e.version), ['v0.10.0', 'v0.9.0'], '0.10 > 0.9')
  assert.equal(s.entries[0].name, 'recette-v0.10.0.html')
  assert.equal(s.entries[0].date, new Date(500).toISOString().slice(0, 10))
})

test('lot4 compareRecetteDesc : sans version au nom, on retombe sur mtime puis nom', () => {
  const l = [
    { rel: 'b.html', mtimeMs: 100 }, { rel: 'a.html', mtimeMs: 300 },
    { rel: 'recette-v0.1.0.html', mtimeMs: 1 },
  ]
  assert.deepEqual(l.slice().sort(compareRecetteDesc).map((e) => e.rel),
    ['recette-v0.1.0.html', 'a.html', 'b.html'], 'une recette versionnée passe devant')
})

test('lot4 shortDate : un mtime absent ne fabrique pas une fausse date', () => {
  assert.equal(shortDate(0), 'date inconnue')
  assert.equal(shortDate(undefined), 'date inconnue')
  assert.equal(shortDate(1700000000000), '2023-11-14')
})

test('A12 lot4 recetteBlocks : sans recette, la section DIT « aucune recette »', () => {
  const b = recetteBlocks(recetteStatus([]), '2026-07-27T00:00:00.000Z')
  const txt = b.map(text).join('\n')
  assert.match(b[0].data.delta[0].insert, /^Page générée depuis le dépôt du projet/)
  assert.equal(b[1].type, 'heading')
  assert.match(txt, /aucune recette/)
  assert.match(txt, /jamais reproduit/, 'la règle « statut seul » est dite à l’humain')
})

test('A12 lot4 recetteBlocks : avec recettes, nom + version + date, et RIEN du HTML', () => {
  const b = recetteBlocks(recetteStatus([
    { rel: 'specs/recettes/recette-v0.15.0.html', mtimeMs: 1700000000000 },
  ]), '2026-07-27T00:00:00.000Z')
  const txt = b.map(text).join('\n')
  assert.match(txt, /recette-v0\.15\.0\.html/)
  assert.match(txt, /version v0\.15\.0/)
  assert.match(txt, /modifiée le 2023-11-14/)
  assert.ok(!b.some((x) => x.type === 'code'), 'aucun bloc préformaté : pas de HTML rendu')
})

test('lot4 buildPlan : 50 est TOUJOURS présente, entre 40 et 60', () => {
  const p = buildPlan({
    project: 'demo', docs: DOCS,
    recettes: [{ rel: 'specs/recettes/recette-v0.10.0.html', mtimeMs: 1700000000000 }],
  })
  const keys = p.sections.map((s) => s.key)
  assert.deepEqual(keys, ['00', '10', '20', '30', '40', '50', '90'])
  const s50 = p.sections.find((s) => s.key === '50')
  assert.equal(s50.kind, 'recette')
  assert.equal(s50.status.count, 1)
  assert.equal(p.counters.recette, '1 (statut seul)')
})

test('A12 lot4 : sans recette, le compteur de 00 dit « aucune recette »', () => {
  assert.equal(buildPlan({ project: 'demo', docs: DOCS }).counters.recette, 'aucune recette')
})

test('B1 lot4 resolveRecettes : _TEMPLATE.recette.html n’entre JAMAIS', () => {
  const r = resolveRecettes('/repo', fsMock)
  assert.deepEqual(r.map((x) => x.rel), ['specs/recettes/recette-v0.10.0.html'])
})

test('lot4 resolveRecettes : dossier absent -> liste vide, jamais une exception', () => {
  const vide = { readdirSync: () => { throw new Error('ENOENT') } }
  assert.deepEqual(resolveRecettes('/repo', vide), [])
})

test('lot4 : le HTML d’une recette n’est JAMAIS LU — garantie structurelle, pas verbale', () => {
  // Un fsApi qui REFUSE toute lecture : si la collecte lisait le fichier, ce test lèverait.
  const sansLecture = {
    readdirSync: () => ['recette-v1.0.0.html', '_TEMPLATE.recette.html'],
    statSync: () => ({ isFile: () => true, isDirectory: () => false, mtimeMs: 1700000000000 }),
    readFileSync: () => { throw new Error('LECTURE INTERDITE : le HTML de recette ne se lit pas') },
  }
  const r = resolveRecettes('/repo', sansLecture)
  assert.equal(r.length, 1)
  const b = recetteBlocks(recetteStatus(r), '2026-07-27T00:00:00.000Z')
  assert.ok(!renderedText(b).includes('<html'), 'aucune balise ne peut avoir fuité')
})

// ── Lot 4 — `60 · Guide utilisateur` ──

const GUIDE = [
  ...DOCS,
  { rel: 'docs/prise-en-main.md', title: 'Prise en main', mtimeMs: 500 },
  { rel: 'docs/guides/api.md', title: 'API publique', mtimeMs: 200 },
]

test('lot4 buildPlan : 60 posée APRÈS 40, avec index, ordre mtime décroissant', () => {
  const p = buildPlan({ project: 'demo', docs: GUIDE })
  assert.deepEqual(p.sections.map((s) => s.key), ['00', '10', '20', '30', '40', '50', '60', '90'])
  const s60 = p.sections.find((s) => s.key === '60')
  assert.equal(s60.kind, 'container')
  assert.equal(s60.name, SEC.GUIDE)
  assert.equal(s60.index.name, '60 · (index)')
  assert.deepEqual(s60.children, [
    { name: 'Prise en main', source: 'docs/prise-en-main.md', locked: true },
    { name: 'API publique', source: 'docs/guides/api.md', locked: true },
  ])
  assert.equal(p.counters.guide, 2)
})

test('lot4 buildPlan : un rapport qualité n’atterrit JAMAIS dans 60', () => {
  const s60 = buildPlan({ project: 'demo', docs: GUIDE }).sections.find((s) => s.key === '60')
  assert.ok(!s60.children.some((c) => c.source.startsWith('docs/qualite/')))
  const s40 = buildPlan({ project: 'demo', docs: GUIDE }).sections.find((s) => s.key === '40')
  assert.ok(s40.children.every((c) => c.source.startsWith('docs/qualite/')))
})

test('A12 lot4 : sans docs/ hors qualite, PAS de section 60 — et la raison est dite', () => {
  const p = buildPlan({ project: 'demo', docs: DOCS })
  assert.ok(!p.sections.some((s) => s.key === '60'), 'section vide non créée')
  const m = p.missing.find((x) => x.name === SEC.GUIDE)
  assert.ok(m, 'l’absence est LISTÉE dans la vue d’ensemble')
  assert.match(m.reason, /docs\/ hors qualite/)
})

test('lot4 : deux guides homonymes en sous-dossiers gardent des noms de page DISTINCTS', () => {
  // Le nom de base ne suffit plus quand la collecte est récursive : deux pages de même nom
  // se corbeilleraient l'une l'autre à chaque passe (l'idempotence tombe).
  const p = buildPlan({
    project: 'demo',
    docs: [
      { rel: 'docs/api/index.md', title: 'Index', mtimeMs: 2 },
      { rel: 'docs/cli/index.md', title: 'Index', mtimeMs: 1 },
    ],
  })
  const noms = p.sections.find((s) => s.key === '60').children.map((c) => c.name)
  assert.equal(new Set(noms).size, 2, `noms en collision : ${noms.join(' / ')}`)
  assert.deepEqual(noms, ['Index (docs/api/index)', 'Index (docs/cli/index)'])
})

test('buildPlan : 90 · Notes présente, jamais verrouillée, sans source', () => {
  const n = buildPlan({ project: 'demo', docs: DOCS }).sections.find((s) => s.key === '90')
  assert.equal(n.kind, 'human')
  assert.equal(n.locked, false)
  assert.equal(n.source, undefined)
})

test('A12 buildPlan : sections vides non créées et listées comme absentes', () => {
  const p = buildPlan({ project: 'vide', docs: [] })
  // `50` est la SEULE section qui subsiste vide : elle DOIT dire « aucune recette » (A12).
  assert.deepEqual(p.sections.map((s) => s.key), ['00', '50', '90'])
  const noms = p.missing.map((m) => m.name)
  assert.ok(noms.includes(SEC.PROJET) && noms.includes(SEC.ETAT))
  assert.ok(noms.includes(SEC.CADRAGE) && noms.includes(SEC.QUALITE))
  assert.ok(noms.includes(SEC.GUIDE))
  assert.ok(!noms.includes(SEC.RECETTE), '50 n’est jamais « absente » : elle affiche le vide')
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
  assert.match(txt, /Recette \(RQV\) : aucune recette/)
  assert.match(txt, /Guide utilisateur : 0/)
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
  // Lot 4 — section 60 : `docs/**.md` HORS `qualite/`, collecte RÉCURSIVE.
  'docs/prise-en-main.md': '# Prise en main\ncontenu',
  'docs/guides/api.md': '# API publique\ncontenu',
  'docs/_gabarit.md': '# Gabarit interdit 3\ncontenu',
  'docs/notes.txt': 'pas du Markdown',
  // Lot 4 — section 50 : le STATUT seul, le HTML n'est JAMAIS lu.
  'specs/recettes/recette-v0.10.0.html': '<html>NE DOIT JAMAIS ÊTRE PUBLIÉ</html>',
  'specs/recettes/_TEMPLATE.recette.html': '<html>gabarit interdit</html>',
}
const MTIME = {
  'specs/instructions/a.md': 300,
  'specs/instructions/b.md': 100,
  'docs/prise-en-main.md': 500,
  'docs/guides/api.md': 200,
  'specs/recettes/recette-v0.10.0.html': 1700000000000,
}
const relOf = (full) => String(full).replace(/^\/repo\/?/, '').split('\\').join('/')
// Un vrai `readdir` ne rend que les enfants IMMÉDIATS et distingue fichier/dossier : un mock
// qui aplatirait l'arbre rendrait le parcours récursif du lot 4 intestable.
const DIRS = new Set()
for (const f of Object.keys(FILES)) {
  const parts = f.split('/')
  for (let i = 1; i < parts.length; i++) DIRS.add(parts.slice(0, i).join('/'))
}
// Disque virtuel du cache d'empreintes (A8) : hors dépôt, hors disque réel.
const DISQUE = new Map()
const fsMock = {
  existsSync: (full) => relOf(full) === '' || FILES[relOf(full)] !== undefined,
  statSync: (full) => {
    const rel = relOf(full)
    if (FILES[rel] !== undefined) {
      return { isFile: () => true, isDirectory: () => false, mtimeMs: MTIME[rel] ?? 1 }
    }
    if (DIRS.has(rel)) return { isFile: () => false, isDirectory: () => true, mtimeMs: 1 }
    throw new Error('ENOENT')
  },
  readdirSync: (full) => {
    const rel = relOf(full)
    if (!DIRS.has(rel)) throw new Error('ENOENT')
    const out = new Set()
    for (const f of Object.keys(FILES)) {
      if (!f.startsWith(rel + '/')) continue
      out.add(f.slice(rel.length + 1).split('/')[0]) // enfant IMMÉDIAT seulement
    }
    return [...out]
  },
  readFileSync: (full) => {
    const rel = relOf(full)
    if (FILES[rel] !== undefined) return FILES[rel]
    if (DISQUE.has(String(full))) return DISQUE.get(String(full))
    throw new Error('ENOENT')
  },
  mkdirSync: () => {},
  writeFileSync: (full, data) => { DISQUE.set(String(full), String(data)) },
}

test('A3 resolveDocPaths : les gabarits _* ne sortent JAMAIS de la collecte', () => {
  const r = resolveDocPaths('/repo', fsMock)
  assert.deepEqual(r, [
    'CLAUDE.md', 'specs/PROJET.md', 'specs/etat-des-lieux.md',
    'specs/instructions/a.md', 'specs/instructions/b.md',
    'docs/qualite/v0.10.0.md', 'docs/qualite/v0.9.0.md',
    'docs/guides/api.md', 'docs/prise-en-main.md',
  ])
  assert.ok(!r.some((p) => p.split('/').pop().startsWith('_')))
  assert.equal(r.filter((p) => p === 'docs/qualite/v0.9.0.md').length, 1,
    'le parcours du guide ne doit pas DOUBLER un rapport qualité')
})

test('lot4 walkGuideDocs : récursif, saute qualite/, les gabarits et le non-Markdown', () => {
  assert.deepEqual(walkGuideDocs('/repo', fsMock), ['docs/guides/api.md', 'docs/prise-en-main.md'])
})

test('lot4 walkGuideDocs : docs/ absent -> liste vide, jamais une exception', () => {
  const fsVide = { readdirSync: () => { throw new Error('ENOENT') }, statSync: () => { throw new Error('ENOENT') } }
  assert.deepEqual(walkGuideDocs('/repo', fsVide), [])
})

test('lot4 walkGuideDocs : profondeur PLAFONNÉE (un docs/ pathologique ne fait pas diverger)', () => {
  // Arbre infini : chaque dossier contient un dossier de même nom + un .md.
  const fsInfini = {
    readdirSync: () => ['sous', 'x.md'],
    statSync: (full) => ({ isFile: () => /\.md$/.test(String(full)), isDirectory: () => !/\.md$/.test(String(full)), mtimeMs: 1 }),
  }
  const r = walkGuideDocs('/repo', fsInfini, 3)
  assert.equal(r.length, 4, 'docs + 3 niveaux, pas un de plus')
  assert.ok(r.every((p) => p.endsWith('x.md')))
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

// R-4 — TROU DE DÉTECTION FERMÉ.
//
// L'ancien double RÉIMPLÉMENTAIT les méthodes du client : `movePage`, `createPage`,
// `setLocked`… Résultat, le vrai `AppFlowyClient` n'était couvert que par quelques tests de
// contrat, et une mutation comme `prev_view_id: null` en dur survivait à toute la chaîne —
// alors qu'en production elle aurait mis toutes les pages en tête et cassé A5 sans faire
// rougir un test.
//
// Ici, le double N'EST PLUS un client : c'est le VRAI `AppFlowyClient`, dont on ne remplace
// que le point de sortie HTTP (`_req`, `auth`). Toute l'orchestration passe donc par les
// URL, les verbes et les CHARGES UTILES réels, interprétés par un faux serveur strict :
// une route inconnue ou une charge utile invalide LÈVE.
function makeFakeClient(server) {
  const clone = (n) => ({ ...n, children: childrenOf(n).map(clone) })
  const client = new AppFlowyClient({
    base: 'http://fixture.invalid', email: 'bidon@example.test', password: 'bidon',
  })
  client.auth = async () => { client.token = 'jeton-bidon'; return client.token }

  client._req = async (method, p, body) => {
    client.calls.total++
    if (method !== 'GET') { client.calls.writes++; server.writes++ }
    const [route, query] = String(p).split('?')
    const seg = route.split('/').filter(Boolean) // api workspace <wid> …
    const need = (v, msg) => { if (v === undefined || v === null) throw new Error('400 ' + msg); return v }

    if (method === 'GET' && route.startsWith('/api/user/verify/')) return {}
    if (method === 'GET' && route === '/api/workspace') return { data: server.workspaces }

    const wid = seg[2]
    const root = server.roots[wid]
    if (!root) throw new Error('404 workspace inconnu : ' + wid)

    if (method === 'GET' && seg[3] === 'folder') {
      // J1 — `depth` tronque STRICTEMENT côté serveur : on rejoue la troncature.
      const depth = Number(new URLSearchParams(query || '').get('depth') || 1)
      const cut = (n, d) => ({ ...n, children: d <= 1 ? [] : childrenOf(n).map((c) => cut(c, d - 1)) })
      return { data: cut(clone(root), depth) }
    }
    if (method === 'POST' && seg[3] === 'space' && seg.length === 4) {
      need(body.name, 'name obligatoire')
      const node = { view_id: 'v' + (++server.seq), name: body.name, is_space: true, children: [] }
      root.children.unshift(node) // ordre de création NON déterministe (mesuré au spike)
      return { data: { view_id: node.view_id } }
    }
    if (method === 'POST' && seg[3] === 'page-view' && seg.length === 4) {
      const parent = server.nodeById(wid, need(body.parent_view_id, 'parent_view_id obligatoire'))
      if (!parent) throw new Error('404 parent introuvable : ' + body.parent_view_id)
      const node = { view_id: 'v' + (++server.seq), name: need(body.name, 'name obligatoire'), is_space: false, children: [] }
      parent.children.unshift(node) // idem : c'est ce qui rend le `move` obligatoire (J2)
      return { data: { view_id: node.view_id } }
    }
    const vid = seg[4]
    if (method === 'POST' && seg[3] === 'page-view' && seg[5] === 'append-block') {
      if (!Array.isArray(body?.blocks)) throw new Error('400 blocks obligatoire')
      server.blocks.set(vid, (server.blocks.get(vid) || []).concat(body.blocks))
      return {}
    }
    if (method === 'PATCH' && seg[3] === 'page-view' && seg.length === 5) {
      need(body.name, "champ 'name' obligatoire (J3)") // le serveur réel répond 400 sans lui
      const node = server.nodeById(wid, vid)
      if (node) node.name = body.name
      server.patched.push({ vid, name: body.name, locked: body.is_locked })
      if (body.is_locked !== undefined) server.locks.set(vid, !!body.is_locked)
      return {}
    }
    if (method === 'POST' && seg[5] === 'move') {
      const parentId = need(body.new_parent_view_id, 'new_parent_view_id obligatoire')
      if (!('prev_view_id' in body)) throw new Error('400 prev_view_id obligatoire (null = en tête)')
      const from = server.parentOf(wid, vid)
      const node = server.nodeById(wid, vid)
      if (!from || !node) throw new Error('404 page introuvable : ' + vid)
      from.children = from.children.filter((c) => c.view_id !== vid)
      const to = server.nodeById(wid, parentId)
      const at = body.prev_view_id === null ? 0 : to.children.findIndex((c) => c.view_id === body.prev_view_id) + 1
      to.children.splice(at, 0, node)
      return {}
    }
    if (method === 'POST' && seg[5] === 'move-to-trash') {
      const from = server.parentOf(wid, vid)
      const node = server.nodeById(wid, vid)
      if (!from || !node) throw new Error('404 page introuvable : ' + vid)
      from.children = from.children.filter((c) => c.view_id !== vid)
      server.trash.push({ view_id: vid, name: node.name })
      return {}
    }
    if (method === 'GET' && seg[3] === 'trash') return { data: { views: server.trash.slice() } }
    if (method === 'DELETE' && seg[3] === 'trash') {
      server.trash = server.trash.filter((t) => t.view_id !== seg[4])
      server.deleted.push(seg[4])
      return {}
    }
    throw new Error(`404 route inconnue : ${method} ${route}`)
  }
  return client
}

const ENV = {
  APPFLOWY_URL: 'http://fixture.invalid', APPFLOWY_EMAIL: 'bidon@example.test',
  APPFLOWY_PASSWORD: 'bidon', IAKAFRAME_CACHE_DIR: '/cache',
}
// Un env SANS cache partagé : chaque test qui le veut repart d'une ardoise vierge.
const envCache = (tag) => ({ ...ENV, IAKAFRAME_CACHE_DIR: '/cache/' + tag })
const silence = () => {}
const namesOf = (n) => childrenOf(n).map((c) => c.name)

// Un cache par SERVEUR : deux passes sur le même serveur partagent leurs empreintes
// (c'est le chemin incrémental réel), deux tests n'héritent jamais l'un de l'autre.
let noCache = 0
const cacheDeServeur = new WeakMap()
const cacheFor = (server) => {
  if (!cacheDeServeur.has(server)) cacheDeServeur.set(server, envCache('s' + (++noCache)))
  return cacheDeServeur.get(server)
}
async function publier(server, extraArgv = [], env) {
  return run(['--project', 'demo', '--root', '/repo', '--workspace', 'projects', ...extraArgv],
    env || cacheFor(server), {
      fs: fsMock, log: silence, now: () => new Date('2026-07-27T10:00:00.000Z'),
      makeClient: () => makeFakeClient(server),
    })
}

test('A5 orchestration : arborescence 00–90 complète et ORDONNÉE au niveau espace', async () => {
  const server = makeFakeServer()
  const res = await publier(server)
  assert.equal(res.workspaceId, 'ws-proj')
  const space = findNodeById(server.roots['ws-proj'], res.spaceId)
  assert.deepEqual(namesOf(space), [SEC.OVERVIEW, SEC.PROJET, SEC.ETAT, SEC.CADRAGE, SEC.QUALITE, SEC.RECETTE, SEC.GUIDE, SEC.NOTES])
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
  // Lot 4 — la section 60 obéit au même contrat : index en tête, mtime décroissant.
  const s60 = childrenOf(space).find((c) => c.name === SEC.GUIDE)
  assert.deepEqual(namesOf(s60), [indexName('60'), 'Prise en main', 'API publique'])
})

test('lot4 orchestration : 50 publie le STATUT, le HTML ne fuit dans AUCUNE page', async () => {
  const server = makeFakeServer()
  const res = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], res.spaceId)
  const s50 = childrenOf(space).find((c) => c.name === SEC.RECETTE)
  assert.ok(s50, 'la section 50 existe')
  assert.deepEqual(namesOf(s50), [], '50 est une page, pas un conteneur')
  const txt = renderedText(server.blocks.get(s50.view_id) || [])
  assert.match(txt, /recette-v0\.10\.0\.html/)
  assert.match(txt, /version v0\.10\.0/)
  // Le contenu du fichier de recette est une sentinelle : il ne doit apparaître NULLE PART.
  const tout = []
  const walk = (n) => {
    tout.push(renderedText(server.blocks.get(n.view_id) || []))
    for (const c of childrenOf(n)) walk(c)
  }
  walk(space)
  assert.ok(!tout.join('\n').includes('NE DOIT JAMAIS ÊTRE PUBLIÉ'), 'le HTML de recette a fuité')
  assert.ok(!tout.join('\n').includes('gabarit interdit'), 'B1 : le gabarit de recette a fuité')
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
  assert.deepEqual(namesOf(space2), [SEC.OVERVIEW, SEC.PROJET, SEC.ETAT, SEC.CADRAGE, SEC.QUALITE, SEC.RECETTE, SEC.GUIDE, SEC.NOTES])
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

// ═══════════════════ A8 — incrémentalité par empreinte ═══════════════════

test('A8 fingerprint : stable, sensible au contenu, et lié à RENDER_VERSION', () => {
  assert.equal(fingerprint('a', 'b'), fingerprint('a', 'b'))
  assert.notEqual(fingerprint('a', 'b'), fingerprint('a', 'c'))
  assert.notEqual(fingerprint('ab', ''), fingerprint('a', 'b'), 'les parties sont séparées')
  assert.match(fingerprint('x'), /^[0-9a-f]{64}$/, 'sha256')
  assert.ok(RENDER_VERSION, 'une version de rendu DOIT exister : sans elle, un changement de mapper laisserait les pages figées')
})

test('A8 cachePath : HORS dépôt, par workspace et par projet, nom de fichier assaini', () => {
  const p = cachePath({ IAKAFRAME_CACHE_DIR: '/c' }, 'ws-proj', 'Iaka Cockpit/../x')
  assert.equal(p, '/c/ws-proj/Iaka_Cockpit_.._x.json')
  assert.ok(!cachePath({}, 'w', 'p').includes('/repo'), 'jamais dans le dépôt')
  assert.equal(safeFileName(''), 'projet')
  // Un nom de projet ne doit pas pouvoir s’échapper du dossier de cache.
  const evade = safeFileName('../../etc/passwd')
  assert.ok(!evade.includes('/') && !evade.startsWith('.'), 'nom de fichier évadé : ' + evade)
})

test('A8 readCache : absent, illisible, corrompu ou d’un autre rendu -> vide (dégradation propre)', () => {
  const boum = { readFileSync: () => { throw new Error('ENOENT') } }
  assert.deepEqual(readCache('/c/x.json', boum), { pages: {} })
  assert.deepEqual(readCache('/c/x.json', { readFileSync: () => '{pas du json' }), { pages: {} })
  assert.deepEqual(readCache('/c/x.json', { readFileSync: () => JSON.stringify({ render: 'vieux', pages: { a: 1 } }) }),
    { pages: {} }, 'un cache d’un autre rendu est jeté, jamais réutilisé')
  const bon = JSON.stringify({ render: RENDER_VERSION, spaceId: 's1', pages: { a: { hash: 'h' } } })
  assert.deepEqual(readCache('/c/x.json', { readFileSync: () => bon }), { spaceId: 's1', pages: { a: { hash: 'h' } } })
})

test('A8 writeCache : échec d’écriture toléré, jamais une exception', () => {
  const ecrits = new Map()
  assert.equal(writeCache('/c/x.json', { pages: {} }, { mkdirSync: () => {}, writeFileSync: (f, d) => ecrits.set(f, d) }), true)
  assert.match(ecrits.get('/c/x.json'), new RegExp(RENDER_VERSION))
  assert.equal(writeCache('/c/x.json', { pages: {} }, { mkdirSync: () => { throw new Error('EACCES') } }), false)
})

test('A8 orchestration : 2ᵉ passe sur projet INCHANGÉ = ZÉRO écriture, ZÉRO débris', async () => {
  const server = makeFakeServer()
  const r1 = await publier(server)
  const ecrites1 = server.writes
  const debris1 = server.trash.length
  assert.ok(ecrites1 > 0, 'la 1ʳᵉ passe écrit')

  server.writes = 0
  const r2 = await publier(server)
  assert.equal(server.writes, 0, `2ᵉ passe : ${server.writes} écriture(s) au lieu de 0`)
  assert.equal(r2.writes, 0, 'le compteur du client le confirme')
  assert.equal(r2.created + r2.updated + r2.removed + r2.replaced + r2.moves + r2.locked, 0)
  assert.equal(r2.unchanged, r1.created, 'toutes les pages sont déclarées inchangées')
  assert.equal(server.trash.length, debris1, 'aucun débris de corbeille supplémentaire')
  assert.equal(r2.spaceId, r1.spaceId)
})

test('A8 : seule la page dont la SOURCE a changé est réécrite', async () => {
  const server = makeFakeServer()
  await publier(server)
  const avant = FILES['specs/instructions/a.md']
  try {
    FILES['specs/instructions/a.md'] = '# Alpha\ncontenu MODIFIÉ'
    server.writes = 0
    const r = await publier(server)
    assert.equal(r.updated, 1, 'une seule page réécrite')
    assert.equal(r.unchanged >= 7, true, `pages inchangées : ${r.unchanged}`)
    assert.equal(server.trash.length, 1, 'un seul débris : l’ancienne version de la page touchée')
    assert.equal(server.trash[0].name, 'Alpha')
  } finally { FILES['specs/instructions/a.md'] = avant }
})

test('A8/A1 : cache perdu -> tout est réécrit, l’arbre reste identique (dégradation propre)', async () => {
  const server = makeFakeServer()
  const r1 = await publier(server)
  const noms1 = namesOf(findNodeById(server.roots['ws-proj'], r1.spaceId))
  const r2 = await publier(server, [], envCache('cache-perdu')) // autre cache = cache perdu
  assert.equal(r2.unchanged, 0, 'sans cache, rien n’est présumé à jour')
  assert.equal(r2.updated, r1.created, 'tout est régénéré')
  assert.deepEqual(namesOf(findNodeById(server.roots['ws-proj'], r2.spaceId)), noms1, 'même arbre')
})

test('R-C : une réécriture alimente la corbeille — le compte rendu ne le TAIT plus', async () => {
  // Mesuré au gate : cache perdu, projet inchangé → « created=0 updated=10 removed=0 » alors
  // que la corbeille recevait 10 pages. Un compte rendu qui annonce « 0 retirée(s) » en
  // remplissant la corbeille est FAUX. Même effet à chaque bump de RENDER_VERSION.
  const server = makeFakeServer()
  await publier(server)
  const avant = server.trash.length
  const r = await publier(server, [], envCache('cache-perdu'))
  const nouveaux = server.trash.length - avant
  assert.ok(nouveaux > 0, 'la corbeille grossit bel et bien')
  assert.equal(r.removed, 0, 'aucune ORPHELINE : rien n’a disparu de la source')
  assert.equal(r.replaced, nouveaux, 'chaque ancienne version corbeillée est COMPTÉE')
  assert.equal(r.replaced, r.updated, 'une réécriture = un débris, sans exception')
})

test('A8/A1 : page disparue côté AppFlowy -> recréée malgré un cache « à jour »', async () => {
  const server = makeFakeServer()
  const r1 = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], r1.spaceId)
  const etat = childrenOf(space).find((c) => c.name === SEC.ETAT)
  space.children = space.children.filter((c) => c.view_id !== etat.view_id) // destruction hors skill
  const r2 = await publier(server)
  assert.equal(r2.created, 1, 'la page détruite est recréée, le cache ne fait jamais foi seul')
  assert.ok(namesOf(findNodeById(server.roots['ws-proj'], r1.spaceId)).includes(SEC.ETAT))
})

// ═══════════════════ A10/B3 — balayage des orphelins ═══════════════════

test('A10 planOrphans : ce qui n’est plus attendu, JAMAIS 90 · Notes', () => {
  const node = { children: [
    { view_id: 'v1', name: 'Alpha' }, { view_id: 'v2', name: 'Beta' },
    { view_id: 'v3', name: SEC.NOTES },
  ] }
  assert.deepEqual(planOrphans(node, ['Alpha']), [{ view_id: 'v2', name: 'Beta' }])
  assert.deepEqual(planOrphans(node, []), [
    { view_id: 'v1', name: 'Alpha' }, { view_id: 'v2', name: 'Beta' },
  ], '90 · Notes reste hors de tout ciblage, même quand plus RIEN n’est attendu')
})

test('A10 orchestration : un fichier RENOMMÉ ne laisse pas sa page derrière lui', async () => {
  const server = makeFakeServer()
  await publier(server)
  const avant = FILES['specs/instructions/b.md']
  try {
    delete FILES['specs/instructions/b.md']
    FILES['specs/instructions/b2.md'] = '# Beta renommee\ncontenu'
    MTIME['specs/instructions/b2.md'] = 100
    const r = await publier(server)
    const s30 = childrenOf(findNodeById(server.roots['ws-proj'], r.spaceId)).find((c) => c.name === SEC.CADRAGE)
    assert.deepEqual(namesOf(s30), [indexName('30'), 'Alpha', 'Beta renommee'],
      'l’ancienne page « Beta » ne doit PLUS être là')
    assert.ok(server.trash.some((t) => t.name === 'Beta'), '« Beta » doit être à la corbeille')
    assert.equal(r.removed, 1)
  } finally {
    FILES['specs/instructions/b.md'] = avant
    delete FILES['specs/instructions/b2.md']; delete MTIME['specs/instructions/b2.md']
  }
})

test('A10 orchestration : un fichier SUPPRIMÉ retire sa page', async () => {
  const server = makeFakeServer()
  await publier(server)
  const avant = FILES['docs/qualite/v0.9.0.md']
  try {
    delete FILES['docs/qualite/v0.9.0.md']
    const r = await publier(server)
    const s40 = childrenOf(findNodeById(server.roots['ws-proj'], r.spaceId)).find((c) => c.name === SEC.QUALITE)
    assert.deepEqual(namesOf(s40), [indexName('40'), 'Qualité v0.10.0'])
    assert.ok(server.trash.some((t) => t.name === 'Qualité v0.9.0'))
  } finally { FILES['docs/qualite/v0.9.0.md'] = avant }
})

test('A10 : le balayage n’atteint NI 90 · Notes NI ses descendants', async () => {
  const server = makeFakeServer()
  const r1 = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], r1.spaceId)
  const notes = childrenOf(space).find((c) => c.name === SEC.NOTES)
  notes.children.push({ view_id: 'humaine-9', name: 'Ma note à moi', children: [
    { view_id: 'humaine-10', name: 'sous-note', children: [] },
  ] })
  const avant = FILES['specs/instructions/b.md']
  try {
    delete FILES['specs/instructions/b.md'] // provoque un balayage réel dans la même passe
    await publier(server)
    const space2 = findNodeById(server.roots['ws-proj'], r1.spaceId)
    const notes2 = childrenOf(space2).find((c) => c.name === SEC.NOTES)
    assert.equal(notes2.view_id, notes.view_id)
    assert.deepEqual(namesOf(notes2), ['Ma note à moi'])
    assert.deepEqual(namesOf(childrenOf(notes2)[0]), ['sous-note'])
    for (const id of ['humaine-9', 'humaine-10', notes.view_id]) {
      assert.ok(!server.trash.some((t) => t.view_id === id), 'zone humaine touchée : ' + id)
    }
  } finally { FILES['specs/instructions/b.md'] = avant }
})

test('A10 : une page intruse au niveau de l’espace est retirée (l’espace appartient au dépôt)', async () => {
  const server = makeFakeServer()
  const r1 = await publier(server)
  const space = findNodeById(server.roots['ws-proj'], r1.spaceId)
  space.children.push({ view_id: 'vieille-section', name: '70 · Ancienne section', children: [] })
  const r2 = await publier(server)
  assert.equal(r2.removed, 1)
  assert.ok(server.trash.some((t) => t.name === '70 · Ancienne section'))
  assert.deepEqual(namesOf(findNodeById(server.roots['ws-proj'], r1.spaceId)),
    [SEC.OVERVIEW, SEC.PROJET, SEC.ETAT, SEC.CADRAGE, SEC.QUALITE, SEC.RECETTE, SEC.GUIDE, SEC.NOTES])
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
    // R-4 — le cas NON NUL était le trou : `prev_view_id: null` figé en dur survivait à
    // toute la chaîne (693 tests, 0 fail) et aurait mis toutes les pages en tête en prod.
    await c.movePage('v9', 'p1', 'v8')
    await c.movePage('v9', 'p1') // valeur par défaut
    assert.equal(appels[0].method, 'POST')
    assert.match(appels[0].url, /\/api\/workspace\/ws-proj\/page-view\/v9\/move$/)
    assert.deepEqual(appels[0].body, { new_parent_view_id: 'p1', prev_view_id: null })
    assert.deepEqual(appels[1].body, { new_parent_view_id: 'p1', prev_view_id: 'v8' },
      'le frère précédent DOIT être transmis tel quel')
    assert.deepEqual(appels[2].body, { new_parent_view_id: 'p1', prev_view_id: null })
  })
})

test('R-4 : le double de test EST le vrai client (aucune méthode réimplémentée)', async () => {
  // C'est la garde structurelle du trou de détection : si quelqu'un réintroduit un faux
  // client qui réimplémente `movePage`, `createPage` ou `setLocked`, l'orchestration
  // cesserait d'exercer les charges utiles réelles — et ce test rougit AVANT.
  const c = makeFakeClient(makeFakeServer())
  assert.ok(c instanceof AppFlowyClient, 'le double doit être un AppFlowyClient')
  for (const m of ['movePage', 'createPage', 'createSpace', 'appendBlocks', 'setLocked',
    'patchPage', 'moveToTrash', 'listTrash', 'deleteFromTrash', 'folder', 'resolveWorkspace',
    'listWorkspaces', 'provision']) {
    assert.equal(c[m], AppFlowyClient.prototype[m], `méthode réimplémentée par le double : ${m}`)
  }
  // Seuls le point de sortie HTTP et l'authentification sont neutralisés.
  assert.notEqual(c._req, AppFlowyClient.prototype._req)
  assert.notEqual(c.auth, AppFlowyClient.prototype.auth)
})

test('R-4 : le faux serveur REFUSE une charge utile invalide (sinon il ne prouve rien)', async () => {
  const server = makeFakeServer()
  const c = makeFakeClient(server)
  await c.resolveWorkspace('projects')
  await assert.rejects(() => c._req('POST', `/api/workspace/${c.wid}/page-view`, { name: 'x' }),
    /parent_view_id obligatoire/)
  await assert.rejects(() => c._req('PATCH', `/api/workspace/${c.wid}/page-view/v1`, { is_locked: true }),
    /'name' obligatoire/)
  await assert.rejects(() => c._req('POST', `/api/workspace/${c.wid}/page-view/v1/move`, { new_parent_view_id: 'p' }),
    /prev_view_id obligatoire/)
  await assert.rejects(() => c._req('GET', `/api/workspace/${c.wid}/inconnu`), /route inconnue/)
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
// Le faux serveur et son client sont exportés eux aussi : toute mesure d'A8 (écritures,
// débris) DOIT porter sur CE double-là, jamais sur une réplique divergente.
export { cases, makeFakeServer, makeFakeClient }

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
