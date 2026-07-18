// Unite de lib/output.js — source UNIQUE de la convention de sortie machine « C-JSON »
// (instruction cli-api-surface-harmonisation.md § 2 / § 4). Verifie les 4 fabricants
// (ok / collection / fail / emit) : enveloppe objet, `ok` en tete, count sur collection,
// erreur { ok:false, error } sur stdout + exitCode 1, aucun texte humain sur stderr en --json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ok, collection, emit, fail } from '../src/lib/output.js';

// Capture console.log / console.error + process.exitCode le temps d'un appel.
function capture(fn) {
  const logs = []; const errs = [];
  const o0 = console.log; const e0 = console.error; const x0 = process.exitCode;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errs.push(a.join(' '));
  process.exitCode = 0;
  try { fn(); } finally {
    const exitCode = process.exitCode;
    console.log = o0; console.error = e0; process.exitCode = x0;
    return { logs, errs, exitCode };
  }
}

test('ok : normalise en { ok:true, ... } avec ok en PREMIERE cle', () => {
  const o = ok({ home: '/x', n: 2 });
  assert.deepEqual(o, { ok: true, home: '/x', n: 2 });
  assert.equal(Object.keys(o)[0], 'ok');
});

test('ok : sans argument -> { ok:true }', () => {
  assert.deepEqual(ok(), { ok: true });
});

test('collection : enveloppe { ok, count, [key], ...meta } ; count = longueur exacte', () => {
  const c = collection('projects', [{ a: 1 }, { a: 2 }], { root: '/w' });
  assert.deepEqual(c, { ok: true, count: 2, projects: [{ a: 1 }, { a: 2 }], root: '/w' });
  assert.equal(c.count, c.projects.length);
});

test('collection : jamais de tableau nu, meme sur entree vide/non-array', () => {
  assert.deepEqual(collection('items', []), { ok: true, count: 0, items: [] });
  assert.deepEqual(collection('items', undefined), { ok: true, count: 0, items: [] });
});

test('emit(true, payload) : imprime le JSON 2-indente sur stdout, ignore humanFn', () => {
  let humanCalled = false;
  const { logs, errs } = capture(() => emit(true, ok({ x: 1 }), () => { humanCalled = true; }));
  assert.equal(errs.length, 0);
  assert.equal(logs.length, 1);
  assert.deepEqual(JSON.parse(logs[0]), { ok: true, x: 1 });
  assert.equal(logs[0], JSON.stringify({ ok: true, x: 1 }, null, 2)); // 2-indente
  assert.equal(humanCalled, false);
});

test('emit(false, payload, humanFn) : delegue au rendu humain, rien en JSON', () => {
  const { logs } = capture(() => emit(false, ok({ x: 1 }), () => console.log('humain')));
  assert.deepEqual(logs, ['humain']);
});

test('fail(true, msg, diag) : { ok:false, error, ...diag } sur STDOUT, exit 1, RIEN sur stderr', () => {
  const { logs, errs, exitCode } = capture(() => fail(true, 'boom', { reason: 'x', ids: [1] }));
  assert.equal(errs.length, 0, 'aucun texte humain sur stderr en mode --json');
  assert.equal(logs.length, 1);
  assert.deepEqual(JSON.parse(logs[0]), { ok: false, error: 'boom', reason: 'x', ids: [1] });
  assert.equal(exitCode, 1);
});

test('fail(false, msg) : message humain sur stderr (defaut), exit 1', () => {
  const { logs, errs, exitCode } = capture(() => fail(false, 'boom'));
  assert.deepEqual(errs, ['boom']);
  assert.equal(logs.length, 0);
  assert.equal(exitCode, 1);
});

test('fail(false, msg, diag, humanFn) : humanFn prime pour un rendu multi-lignes', () => {
  const { errs, exitCode } = capture(() => fail(false, 'boom', undefined, () => {
    console.error('ligne 1'); console.error('ligne 2');
  }));
  assert.deepEqual(errs, ['ligne 1', 'ligne 2']);
  assert.equal(exitCode, 1);
});
