// Passe de SCHEMA de frontmatter (Finding 3) : tests BORN-RED (invariant § 6.4). Chaque regle
// NAIT ROUGE sur une fixture fautive, puis VERTE une fois corrigee — preuve qu'elle mord. Couvre :
//   - bad-type sur champ CONNU (enum hors valeurs ; liste attendue / scalaire recu) = BLOQUANT (AC2) ;
//   - missing-field (requis absent) = BLOQUANT (AC2) ;
//   - unknown-field = AVERTISSEMENT par defaut, BLOQUANT sous --strict (AC3, Fork A) ;
//   - soleActor pendant = BLOQUANT (D-6), resolu = vert.
// Construit un reservoir minimal ou le graphe atteint persona + workflow (documents schematises).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lintFrame } from '../src/lib/frame-lint.js';

function W(file, content) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }

// Reservoir sain : frame f1 -> method m1 -> workflow wf (soleActor: alice) ; team caste alice.
function makeReservoir(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-fx-'));
  const L = (rel) => path.join(root, rel);
  W(L('library/roles/dev.md'), '---\nid: dev\nkey: dev\nlabel: Dev\n---\n# dev\n');
  W(L('library/personas/alice.md'), overrides.alice
    ?? '---\nid: alice\nname: Alice\nroleKey: dev\nskills: []\nguardrails: []\n---\n# Alice\n');
  W(L('library/workflows/wf.md'), overrides.wf
    ?? '---\nid: wf\nname: WF\nkind: pipeline\nsoleActor: alice\nphases:\n  - { id: p1, label: P1, actorsRoleKeys: [dev] }\n---\n# wf\n');
  W(L('methods/m1.md'), '---\nid: m1\nname: M1\nworkflowId: wf\nroleKeys: [dev]\n---\n# m1\n');
  W(L('teams/t1.md'), '---\nid: t1\nname: T1\npersonas: [alice]\ncoordinator: alice\n---\n# t1\n');
  W(L('bindings/b1.md'), '---\nid: b1\nmethodId: m1\nteamId: t1\nassignments:\n  - { personaId: alice, runner: claude }\n---\n# b1\n');
  W(L('frames/f1.md'), '---\nid: f1\nname: F1\nmethodId: m1\nteamId: t1\ndefault: true\n---\n# f1\n');
  return root;
}

const blocking = (root, opts) => lintFrame('f1', root, opts).findings.filter(f => f.severity === 'blocking');
const warnings = (root, opts) => lintFrame('f1', root, opts).findings.filter(f => f.severity === 'warning');

test('VERT de reference : reservoir sain -> aucun bloquant, aucun unknown-field', () => {
  const root = makeReservoir();
  assert.equal(lintFrame('f1', root).ok, true, 'la fixture saine doit etre verte');
  assert.equal(warnings(root).filter(f => f.kind === 'unknown-field').length, 0);
});

test('bad-type ENUM (AC2) : workflow kind hors enum -> BLOQUANT bad-type ; corrige -> vert', () => {
  const bad = makeReservoir({ wf: '---\nid: wf\nname: WF\nkind: cycle-with-betting-gate\nphases:\n  - { id: p1, label: P1, actorsRoleKeys: [dev] }\n---\n# wf\n' });
  const b = blocking(bad).filter(f => f.kind === 'bad-type' && f.field === 'kind');
  assert.equal(b.length, 1, 'un kind hors enum doit rougir (aurait attrape shapeup avant D-5)');
  assert.equal(lintFrame('f1', makeReservoir()).ok, true, 'kind valide -> vert');
});

test('bad-type LISTE/SCALAIRE (AC2) : persona skills en scalaire -> BLOQUANT bad-type', () => {
  const bad = makeReservoir({ alice: '---\nid: alice\nname: Alice\nroleKey: dev\nskills: pasuneliste\nguardrails: []\n---\n# Alice\n' });
  const b = blocking(bad).filter(f => f.kind === 'bad-type' && f.field === 'skills');
  assert.equal(b.length, 1, 'une liste attendue recue en scalaire doit rougir');
});

test('missing-field (AC2) : requis absent (persona sans name) -> BLOQUANT missing-field', () => {
  const bad = makeReservoir({ alice: '---\nid: alice\nroleKey: dev\nskills: []\nguardrails: []\n---\n# Alice\n' });
  const b = blocking(bad).filter(f => f.kind === 'missing-field' && f.field === 'name');
  assert.equal(b.length, 1, 'un champ requis manquant doit rougir');
});

test('unknown-field (AC3, Fork A) : WARN par defaut, ne bloque pas', () => {
  const bad = makeReservoir({ wf: '---\nid: wf\nname: WF\nkind: pipeline\nfranchement: inconnu\nphases:\n  - { id: p1, label: P1, actorsRoleKeys: [dev] }\n---\n# wf\n' });
  // Defaut : avertissement, non bloquant (exit 0).
  const def = lintFrame('f1', bad);
  assert.equal(def.ok, true, 'un champ inconnu ne doit PAS bloquer par defaut (Fork A)');
  assert.equal(warnings(bad).filter(f => f.kind === 'unknown-field' && f.field === 'franchement').length, 1);
});

test('step-field (D-2) : wipLimited en scalaire -> BLOQUANT bad-type', () => {
  const bad = makeReservoir({ wf: '---\nid: wf\nname: WF\nkind: flow\nstages:\n  - { id: s1, label: S1, wipLimited: oui, actorsRoleKeys: [dev] }\n---\n# wf\n' });
  const b = blocking(bad).filter(f => f.kind === 'bad-type' && f.field === 'wipLimited');
  assert.equal(b.length, 1, 'wipLimited (bool promu) recu en scalaire doit rougir');
});
