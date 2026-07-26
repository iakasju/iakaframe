// SOURCE UNIQUE du schema de frontmatter (Finding 3, AC4) : la table-donnee
// library/_schema/frontmatter.json est l'AUTORITE iakaframe ; le GUI en tient une COPIE VENDOREE
// (packages/core/src/frontmatter-schema.json). Ce test VERROUILLE la parite : muter une copie sans
// l'autre rougit ici. Calque de vocab-parity.test.js : le frere GUI vit dans un depot voisin ; en
// CI isolee (CLI seul) il est absent -> SKIP documente, jamais rouge. Override : IAKAFRAME_GUI_ROOT.
//
// Complete par un TEST DE FORME (toujours actif) : la table est bien formee et coherente avec ce que
// la passe de schema (frontmatter-schema.js) attend (types de champ valides, 12 types declares).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema } from '../src/lib/frontmatter-schema.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const SOURCE = path.join(REPO, 'library', '_schema', 'frontmatter.json');

const VALID_TYPES = new Set(['scalar', 'bool', 'list', 'map-list']);
const POOL_AND_ASSEMBLY = [
  'personas', 'skills', 'principles', 'rituals', 'guardrails', 'roles', 'workflows', 'scaffolds',
  'methods', 'teams', 'bindings', 'frames',
];

function isValidDesc(desc) {
  if (typeof desc === 'string') return VALID_TYPES.has(desc);
  return desc && typeof desc === 'object' && Array.isArray(desc.enum) && desc.enum.length > 0;
}

// --- Test de FORME (toujours actif) -----------------------------------------------------------
test('forme : la table-donnee declare les 12 types avec des descripteurs de champ valides', () => {
  const schema = loadSchema();
  assert.equal(typeof schema.version, 'number', 'version numerique attendue');
  assert.ok(schema.types && typeof schema.types === 'object', 'types objet attendu');
  for (const t of POOL_AND_ASSEMBLY) {
    const ts = schema.types[t];
    assert.ok(ts, `type ${t} absent de la table (AC1 : les 12 types declares)`);
    for (const bucket of ['required', 'optional', 'extensions']) {
      const map = ts[bucket] || {};
      for (const [field, desc] of Object.entries(map)) {
        assert.ok(isValidDesc(desc), `descripteur invalide : ${t}.${bucket}.${field} = ${JSON.stringify(desc)}`);
      }
    }
    // Un champ ne peut pas etre a la fois requis ET optionnel/extension (pas de double declaration).
    const req = Object.keys(ts.required || {});
    const rest = new Set([...Object.keys(ts.optional || {}), ...Object.keys(ts.extensions || {})]);
    for (const f of req) assert.ok(!rest.has(f), `champ double-declare : ${t}.${f}`);
  }
  // stepFields (workflows) : descripteurs valides.
  const stepFields = (schema.types.workflows.stepFields) || {};
  for (const [field, desc] of Object.entries(stepFields)) {
    assert.ok(isValidDesc(desc), `stepField invalide : workflows.${field}`);
  }
});

// --- Test de PARITE CLI (source) <-> GUI (copie vendoree) --------------------------------------
function resolveGuiCopy() {
  const override = process.env.IAKAFRAME_GUI_ROOT;
  const candidates = (override && override.trim() !== '')
    ? [override]
    : [path.resolve(REPO, '..', 'iakaFrameGUI'), path.resolve(REPO, '..', 'iakaframegui')];
  for (const c of candidates) {
    const p = path.join(c, 'packages', 'core', 'src', 'frontmatter-schema.json');
    try { if (fs.existsSync(p)) return p; } catch { /* ignore */ }
  }
  return null;
}

const guiCopy = resolveGuiCopy();
const skip = guiCopy ? false : 'copie vendoree GUI introuvable (depot iakaFrameGUI absent - CI isolee)';

test('parite : la copie vendoree du GUI == la source iakaframe (source unique 5a, D-3)', { skip }, () => {
  const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const gui = JSON.parse(fs.readFileSync(guiCopy, 'utf8'));
  assert.deepEqual(gui, source,
    'la table-donnee du GUI a diverge de la source iakaframe - re-vendorer (cp library/_schema/frontmatter.json vers packages/core/src/frontmatter-schema.json)');
});
