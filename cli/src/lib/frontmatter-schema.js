// Passe de SCHEMA de frontmatter (Finding 3, schema-frontmatter-type-frame-lint-strict.md).
// Ferme le trou historique : `frame lint` tolerait silencieusement tout champ inconnu (ARB-1). Ce
// module type les champs CONNUS et signale l'INCONNU, en lisant la table-donnee faisant autorite
// (library/_schema/frontmatter.json, SOURCE UNIQUE 5a - D-3). La table est VENDOREE vers le GUI et
// verrouillee par cli/test/frontmatter-schema-parity.test.js (muter une copie sans l'autre rougit).
//
// Politique (Fork A, D-1) :
//   - champ CONNU mal type  => BLOQUANT  (kind 'bad-type')     — le vrai attrape-bug (AC2) ;
//   - requis manquant       => BLOQUANT  (kind 'missing-field')— extension de checkSchema a tous types ;
//   - champ INCONNU         => AVERTISSEMENT par defaut, BLOQUANT sous --strict (kind 'unknown-field', AC3).
// NE MUTE JAMAIS le disque. Zero dependance runtime.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { frameworkRoot } from './kit.js';
import { toArray } from './library.js';

const SCHEMA_REL = path.join('library', '_schema', 'frontmatter.json');

// Prefixe de `source` (frame-lint) -> type de collection schematise. Les documents du graphe
// linte (frame/method/team/binding/persona/skill/workflow) sont les seuls atteints ; les autres
// types de pool restent declares dans la table (AC1) mais ne sont pas parcourus comme documents.
export const SOURCE_TO_TYPE = {
  frame: 'frames', method: 'methods', team: 'teams', binding: 'bindings',
  persona: 'personas', skill: 'skills', workflow: 'workflows',
};

let _schema = null;

// Charge la table-donnee depuis les assets iakaframe. La table est le vocabulaire de l'OUTIL,
// appliquee a n'importe quel reservoir linte (independante du --root). On retient le PREMIER
// emplacement qui contient REELLEMENT le fichier (robuste a un _bundled dev perime qui n'aurait
// pas encore la table) :
//   1) frameworkRoot()/library/_schema/... (paquet publie _bundled, ou racine de depot marquee) ;
//   2) 1er ancetre du module portant library/_schema/... (dev in-repo, meme si (1) existe mais
//      ne porte pas encore la table). Absente partout => degradation silencieuse (aucun finding).
export function loadSchema() {
  if (_schema) return _schema;
  const candidates = [];
  const fw = frameworkRoot();
  if (fw) candidates.push(path.join(fw, SCHEMA_REL));
  let d = path.dirname(fileURLToPath(import.meta.url)); // cli/src/lib
  for (let i = 0; i < 8; i++) {
    candidates.push(path.join(d, SCHEMA_REL));
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) { _schema = JSON.parse(fs.readFileSync(c, 'utf8')); return _schema; }
    } catch { /* candidat illisible : suivant */ }
  }
  _schema = { version: 0, types: {} };
  return _schema;
}

// Reinitialise le cache (tests uniquement).
export function _resetSchemaCache() { _schema = null; }

// --- Vocabulaire de type : 'scalar' | 'bool' | 'list' | 'map-list' | { enum:[...] } -------------
function typeName(desc) {
  if (typeof desc === 'string') return desc;
  if (desc && typeof desc === 'object' && Array.isArray(desc.enum)) return 'enum';
  return 'scalar';
}
function isScalar(v) { return v != null && !Array.isArray(v) && typeof v !== 'object'; }

// Une valeur optionnelle ABSENTE (non portee) : rien a controler. `false` (bool) N'EST PAS absent.
function isEmpty(v) { return v === undefined || v === null || v === ''; }

// Requis MANQUANT (calque de checkSchema : null / '' / [] comptent comme absent).
function isMissing(v) { return v == null || v === '' || (Array.isArray(v) && v.length === 0); }

function matchesType(v, desc) {
  switch (typeName(desc)) {
    case 'scalar': return isScalar(v);
    case 'bool': return typeof v === 'boolean';
    case 'list': return Array.isArray(v);
    case 'map-list':
      return Array.isArray(v) && v.every(e => e && typeof e === 'object' && !Array.isArray(e));
    case 'enum': return isScalar(v) && desc.enum.includes(v);
    default: return true;
  }
}

// Libelle court du type REEL d'une valeur (pour l'id du finding bad-type).
function actualLabel(v) {
  if (Array.isArray(v)) return v.every(e => e && typeof e === 'object' && !Array.isArray(e)) ? 'map-list' : 'list';
  if (v && typeof v === 'object') return 'map';
  if (typeof v === 'boolean') return `bool:${v}`;
  return String(v);
}

// --- Controle de schema d'UN document (frontmatter deja parse) --------------------------------
// Retourne [{ severity, field, id, kind }]. `strict` promeut unknown-field en bloquant.
export function checkDocSchema(type, data, { strict = false } = {}) {
  const schema = loadSchema();
  const ts = schema.types && schema.types[type];
  const out = [];
  if (!ts || !data || typeof data !== 'object') return out;
  const required = ts.required || {};
  const optional = ts.optional || {};
  const extensions = ts.extensions || {};
  const known = { ...required, ...optional, ...extensions };

  // 1) Requis : present ET bien type (missing-field | bad-type, tous deux bloquants).
  for (const [field, desc] of Object.entries(required)) {
    if (isMissing(data[field])) out.push({ severity: 'blocking', field, id: '(absent)', kind: 'missing-field' });
    else if (!matchesType(data[field], desc)) out.push({ severity: 'blocking', field, id: actualLabel(data[field]), kind: 'bad-type' });
  }

  // 2) Optionnels + extensions PRESENTS : type-check (bad-type bloquant, AC2).
  for (const [field, desc] of [...Object.entries(optional), ...Object.entries(extensions)]) {
    const v = data[field];
    if (isEmpty(v)) continue; // optionnel non porte : rien a dire
    if (!matchesType(v, desc)) out.push({ severity: 'blocking', field, id: actualLabel(v), kind: 'bad-type' });
  }

  // 3) Inconnu (hors {requis ∪ optionnels ∪ extensions}) : WARN par defaut, bloquant sous --strict.
  for (const field of Object.keys(data)) {
    if (Object.prototype.hasOwnProperty.call(known, field)) continue;
    out.push({ severity: strict ? 'blocking' : 'warning', field, id: field, kind: 'unknown-field' });
  }
  return out;
}

// --- Controle des champs d'ETAPE promus (workflow : nature enum, wipLimited bool ; D-2) ---------
// Type-check cible sur les items de phases||stages. Pas de detection d'inconnu au niveau etape
// (le vocabulaire d'etape est riche et specifique ; MVP borne au type des deux champs promus).
export function checkStepFields(type, data) {
  const schema = loadSchema();
  const ts = schema.types && schema.types[type];
  const out = [];
  if (!ts || !ts.stepFields || !data) return out;
  const steps = data.phases != null ? data.phases : data.stages;
  for (const step of toArray(steps)) {
    if (!step || typeof step !== 'object' || Array.isArray(step)) continue;
    for (const [field, desc] of Object.entries(ts.stepFields)) {
      const v = step[field];
      if (isEmpty(v)) continue;
      if (!matchesType(v, desc)) {
        out.push({ severity: 'blocking', field, id: actualLabel(v), kind: 'bad-type' });
      }
    }
  }
  return out;
}
