#!/usr/bin/env node
// Tests unitaires des fonctions PURES (zéro I/O HTTP). Lancer : node test.mjs
import assert from 'node:assert/strict'
import {
  isStructuralDoc, selectStructuralDocs, para, fileToBlocks,
  overviewBlocks, chunk, parseArgs, resolveDocPaths,
} from './appflowy-doc.mjs'

let n = 0
const test = (name, fn) => { fn(); n++; console.log('  ok —', name) }

// isStructuralDoc
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

// selectStructuralDocs : filtre + ordre déterministe
test('selectStructuralDocs filtre et ordonne', () => {
  const input = [
    'docs/qualite/v0.10.0.md', 'src/x.rs', 'specs/instructions/L1.md',
    'CLAUDE.md', 'specs/PROJET.md', 'specs/instructions/L0.md', 'specs/etat-des-lieux.md',
  ]
  assert.deepEqual(selectStructuralDocs(input), [
    'CLAUDE.md', 'specs/PROJET.md', 'specs/etat-des-lieux.md',
    'specs/instructions/L0.md', 'specs/instructions/L1.md', 'docs/qualite/v0.10.0.md',
  ])
})
test('selectStructuralDocs déduplique l’ordre instructions alphabétiquement', () => {
  const r = selectStructuralDocs(['specs/instructions/B.md', 'specs/instructions/A.md'])
  assert.deepEqual(r, ['specs/instructions/A.md', 'specs/instructions/B.md'])
})

// para
test('para texte -> delta insert', () => {
  assert.deepEqual(para('hello'), { type: 'paragraph', data: { delta: [{ insert: 'hello' }] } })
})
test('para vide -> delta vide', () => {
  assert.deepEqual(para(''), { type: 'paragraph', data: { delta: [] } })
})

// fileToBlocks
test('fileToBlocks : un paragraphe par ligne', () => {
  const b = fileToBlocks('a\nb\nc')
  assert.equal(b.length, 3)
  assert.deepEqual(b[0], { type: 'paragraph', data: { delta: [{ insert: 'a' }] } })
})
test('fileToBlocks : CRLF normalisé, lignes vides finales élaguées', () => {
  const b = fileToBlocks('x\r\n\r\ny\n\n\n')
  // x, '', y  (les vides de fin retirés)
  assert.deepEqual(b.map((p) => p.data.delta[0]?.insert ?? ''), ['x', '', 'y'])
})
test('fileToBlocks : ligne vide médiane -> delta vide', () => {
  const b = fileToBlocks('a\n\nb')
  assert.deepEqual(b[1], { type: 'paragraph', data: { delta: [] } })
})

// overviewBlocks
test('overviewBlocks contient le projet, le compte et la liste', () => {
  const b = overviewBlocks('demo', ['CLAUDE.md', 'specs/PROJET.md'], '2026-07-01T00:00:00Z')
  const texts = b.map((p) => p.data.delta[0]?.insert ?? '')
  assert.ok(texts.some((t) => t.includes('demo')))
  assert.ok(texts.some((t) => t.includes('(2)')))
  assert.ok(texts.includes('• CLAUDE.md'))
  assert.ok(texts.includes('• specs/PROJET.md'))
})

// chunk
test('chunk découpe en lots', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.deepEqual(chunk([], 2), [])
})

// parseArgs
test('parseArgs lit --project et --root', () => {
  assert.deepEqual(parseArgs(['--project', 'demo', '--root', '/x']), { project: 'demo', root: '/x' })
})
test('parseArgs : valeurs manquantes -> undefined', () => {
  assert.deepEqual(parseArgs(['--project']), { project: undefined, root: undefined })
})

// resolveDocPaths avec un fsApi mocké (pas d'I/O réel)
test('resolveDocPaths résout via fsApi mocké', () => {
  const present = new Set([
    'CLAUDE.md', 'specs/PROJET.md', 'specs/etat-des-lieux.md',
    'specs/instructions/L0.md', 'specs/instructions/L1.md', 'docs/qualite/v1.md',
  ])
  const fsMock = {
    statSync: (full) => {
      const rel = full.replace('/repo/', '').split('\\').join('/')
      if (present.has(rel)) return { isFile: () => true }
      throw new Error('ENOENT')
    },
    readdirSync: (full) => {
      if (full.endsWith('specs/instructions')) return ['L0.md', 'L1.md', 'junk.txt']
      if (full.endsWith('docs/qualite')) return ['v1.md']
      throw new Error('ENOENT')
    },
  }
  const r = resolveDocPaths('/repo', fsMock)
  assert.deepEqual(r, [
    'CLAUDE.md', 'specs/PROJET.md', 'specs/etat-des-lieux.md',
    'specs/instructions/L0.md', 'specs/instructions/L1.md', 'docs/qualite/v1.md',
  ])
})
test('resolveDocPaths : dossiers absents -> sans crash', () => {
  const fsMock = {
    statSync: (full) => { if (full.endsWith('CLAUDE.md')) return { isFile: () => true }; throw new Error('ENOENT') },
    readdirSync: () => { throw new Error('ENOENT') },
  }
  assert.deepEqual(resolveDocPaths('/repo', fsMock), ['CLAUDE.md'])
})

console.log(`\n${n} tests OK`)
