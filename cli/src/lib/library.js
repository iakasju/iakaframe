// Couche bibliotheque : mapping collection->dossier (table faisant autorite), resolution de la
// racine bibliotheque (Q-2), scan par motif (invariant I2 : index par scan), resolution d'id,
// integrite referentielle (I1) et composition (assemble). Zero dependance runtime.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseFrontmatter, buildDocument } from './frontmatter.js';
import { frameworkRoot } from './kit.js';
import { normalizeRunner, contractFileForNode } from './vocab.js';

// --- 4.1 Mapping collection -> dossier (table UNIQUE faisant autorite) -----------------------
// kind='flat'  : un fichier <id>.md dans `dir`.
// kind='skill' : un dossier <id>/ contenant SKILL.md dans `dir`.
// label        : champ de frontmatter servant de libelle a l'affichage.
export const COLLECTIONS = [
  { type: 'personas',   dir: 'library/personas',   kind: 'flat',  label: 'name' },
  { type: 'skills',     dir: 'library/skills',     kind: 'skill', label: 'name' },
  { type: 'principles', dir: 'library/principles', kind: 'flat',  label: 'label' },
  { type: 'rituals',    dir: 'library/rituals',    kind: 'flat',  label: 'label' },
  { type: 'guardrails', dir: 'library/guardrails', kind: 'flat',  label: 'label' },
  { type: 'roles',      dir: 'library/roles',      kind: 'flat',  label: 'label' },
  { type: 'workflows',  dir: 'library/workflows',  kind: 'flat',  label: 'name' },
  { type: 'scaffolds',  dir: 'library/scaffolds',  kind: 'flat',  label: 'id' },
  { type: 'teams',      dir: 'teams',              kind: 'flat',  label: 'name' },
  { type: 'methods',    dir: 'methods',            kind: 'flat',  label: 'name' },
  { type: 'bindings',   dir: 'bindings',           kind: 'flat',  label: 'id' },
  { type: 'kits',       dir: 'kits',               kind: 'flat',  label: 'id' },
];

export const COLLECTION_TYPES = COLLECTIONS.map(c => c.type);

export function collectionOf(type) {
  return COLLECTIONS.find(c => c.type === type) || null;
}

const EXCLUDED = new Set(['_TEMPLATE.md', 'README.md']);

// --- 4.2 Resolution de la racine bibliotheque (TRANCHE) -------------------------------------
// Priorite : --root (opt) > IAKAFRAME_HOME > remontee jusqu'au double marqueur library/+methods/
//           > sonde <chapeau>/iakaframe (parite GUI) > frameworkRoot() (repli assets/in-repo).
// IAKAFRAME_HOME (racine bibliotheque) est DISTINCTE de IAKAFRAME_ROOT (dossier chapeau ~/work).
export function libraryRoot(opt) {
  if (opt) return path.resolve(opt);
  if (process.env.IAKAFRAME_HOME) return path.resolve(process.env.IAKAFRAME_HOME);
  const marked = findUp(process.cwd(), isLibraryRootDir);
  if (marked) return marked;
  // Sonde <chapeau>/iakaframe, ancre fixe reconnue par la GUI (src-tauri/src/paths.rs
  // resolve_iakaframe_home : `<hat>/iakaframe` valide par le MEME double marqueur library/+methods/).
  // Convergence CLI<->GUI hors-arbre : cwd hors bibliotheque + IAKAFRAME_HOME absent => meme racine.
  const hatCandidate = path.join(hatRoot(), 'iakaframe');
  if (isLibraryRootDir(hatCandidate)) return hatCandidate;
  const fw = frameworkRoot();
  if (fw) return fw;
  return process.cwd();
}

// Racine du chapeau (calque de GUI paths.rs resolve_hat_root) : IAKAFRAME_ROOT si defini/non vide,
// sinon <home>/work (jamais de disque Windows en dur), sinon 'work' relatif.
function hatRoot() {
  const env = process.env.IAKAFRAME_ROOT;
  if (env && env.trim() !== '') return env.trim();
  const home = os.homedir();
  return home ? path.join(home, 'work') : 'work';
}

// Double marqueur library/+methods/ (calque de GUI is_library_home).
function isLibraryRootDir(d) {
  return fs.existsSync(path.join(d, 'library')) && fs.existsSync(path.join(d, 'methods'));
}

function findUp(start, pred) {
  let d = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (pred(d)) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
}

// --- Scan d'une collection (invariant I2 : index par scan de motif) --------------------------
// Retourne [{ id, label, path }] trie par id. Collection absente -> [] (structure partielle OK).
export function scan(type, root) {
  const col = collectionOf(type);
  if (!col) throw new Error(`type inconnu : ${type}`);
  const base = path.join(root, col.dir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  if (col.kind === 'skill') {
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      if (!e.isDirectory() || EXCLUDED.has(e.name) || e.name.startsWith('_')) continue;
      const file = path.join(base, e.name, 'SKILL.md');
      if (!fs.existsSync(file)) continue;
      out.push(entryFrom(type, e.name, file, col.label));
    }
  } else {
    for (const name of fs.readdirSync(base)) {
      if (!name.endsWith('.md') || EXCLUDED.has(name)) continue;
      out.push(entryFrom(type, name.replace(/\.md$/, ''), path.join(base, name), col.label));
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function entryFrom(type, id, file, labelField) {
  let label = id;
  try {
    const { data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    label = data[labelField] || data.name || data.label || data.id || id;
  } catch { /* frontmatter illisible : on garde l'id comme libelle */ }
  return { type, id, label: String(label), path: file };
}

// Chemin attendu d'un id dans une collection (sans verifier l'existence).
export function pathFor(type, id, root) {
  const col = collectionOf(type);
  if (!col) return null;
  return col.kind === 'skill'
    ? path.join(root, col.dir, id, 'SKILL.md')
    : path.join(root, col.dir, `${id}.md`);
}

// Lit une entree complete : { collection, id, path, data, body }.
export function readEntry(type, id, root) {
  const file = pathFor(type, id, root);
  if (!file || !fs.existsSync(file)) return null;
  const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  return { collection: type, id, path: file, data, body };
}

// --- Resolution d'id par scan multi-collections (I2 : id = nom de fichier sans extension) ----
// Retourne [{ type, id, path, label }]. `only` restreint aux types donnes.
export function resolveId(id, root, only) {
  const types = only ? [].concat(only) : COLLECTION_TYPES;
  const hits = [];
  for (const type of types) {
    for (const e of scan(type, root)) {
      if (e.id === id) hits.push(e);
    }
  }
  return hits;
}

// Ensemble des ids presents dans une collection (pour les controles de refs).
function idsOf(type, root) {
  return new Set(scan(type, root).map(e => e.id));
}

// --- 4.4 Integrite referentielle (I1) -------------------------------------------------------
// checkRefs(kind, data, root) -> { ok, missing:[{field,id,collection}], badRunners:[...] }.
export function checkRefs(kind, data, root) {
  const missing = [];
  const badRunners = [];
  const need = (field, id, collection) => {
    if (id == null || id === '') return;
    if (!idsOf(collection, root).has(id)) missing.push({ field, id, collection });
  };
  const needEach = (field, arr, collection) => {
    for (const id of toArray(arr)) need(field, id, collection);
  };

  if (kind === 'team') {
    needEach('personas', data.personas, 'personas');
    need('coordinator', data.coordinator, 'personas');
    needEach('guardrails', data.guardrails, 'guardrails');
  } else if (kind === 'method') {
    need('workflowId', data.workflowId, 'workflows');
    needEach('principleIds', data.principleIds, 'principles');
    needEach('ritualIds', data.ritualIds, 'rituals');
    needEach('guardrailIds', data.guardrailIds, 'guardrails');
    needEach('roleKeys', data.roleKeys, 'roles');
    needEach('scaffoldIds', data.scaffoldIds, 'scaffolds');
  } else if (kind === 'binding') {
    need('methodId', data.methodId, 'methods');   // methodId du pool : tolere (E1 ne le porte pas)
    need('teamId', data.teamId, 'teams');
    for (const a of bindingRows(data)) {          // schema converge E1 : assignments OU bindings
      need('assignments[].personaId', a && a.personaId, 'personas');
      // Validation ALIAS-AWARE (renommage § 6.1) : un runner est valide s'il resout vers un
      // kind canonique via la table d'alias (claude-code->claude, ollama-lan->ollama-distant...).
      // Une valeur inconnue (ex. 'gpt') ne resout pas -> signalee.
      if (a && a.runner && normalizeRunner(a.runner).kind === null) {
        badRunners.push({ personaId: a.personaId, runner: a.runner });
      }
    }
  } else {
    throw new Error(`kind inconnu pour checkRefs : ${kind}`);
  }
  return { ok: missing.length === 0 && badRunners.length === 0, missing, badRunners };
}

// Liste d'affectations d'un binding : schema converge E1 (evolution-binding-ar1.md). On lit
// `assignments` (pool, historique) OU `bindings` (E1, 1re classe) comme ALIAS — les deux acceptes.
export function bindingRows(data) {
  const rows = data.assignments != null ? data.assignments : data.bindings;
  return toArray(rows);
}

// --- Validation de schema minimale (champs requis) pour `add` --------------------------------
// Binding : schema converge E1 (id + teamId + au moins une affectation). `methodId` du pool reste
// TOLERE mais non requis (les bindings E1 sont par-noeud et ne le portent pas) ; `node`/`origin`
// sont additifs (non requis pour la retro-compat des bindings existants).
const REQUIRED = {
  team:    ['id', 'personas', 'coordinator'],
  method:  ['id', 'workflowId', 'roleKeys'],
  binding: ['id', 'teamId'],
};
export function checkSchema(kind, data) {
  const req = REQUIRED[kind];
  if (!req) throw new Error(`kind inconnu : ${kind}`);
  const missing = req.filter(f => data[f] == null || data[f] === '' ||
    (Array.isArray(data[f]) && data[f].length === 0));
  if (kind === 'binding' && bindingRows(data).length === 0) missing.push('assignments|bindings');
  return { ok: missing.length === 0, missing };
}

export const ADD_DIR = { team: 'teams', method: 'methods', binding: 'bindings' };

// --- 3.4 assemble : compose un kit + controle de compatibilite (casting ⊇ roles) -------------
// Retourne un descripteur + le diagnostic de compatibilite (ne fait AUCUNE ecriture).
export function assemble(methodId, teamId, bindingId, root, { node = 'claude' } = {}) {
  const method = readEntry('methods', methodId, root);
  if (!method) return { ok: false, error: `methode introuvable : ${methodId}` };
  const team = readEntry('teams', teamId, root);
  if (!team) return { ok: false, error: `team introuvable : ${teamId}` };

  // roleKeys couvertes par le casting = union des roleKey de chaque persona de la team.
  const teamRoleKeys = new Set();
  const unknownPersonas = [];
  for (const pid of toArray(team.data.personas)) {
    const p = readEntry('personas', pid, root);
    if (!p) { unknownPersonas.push(pid); continue; }
    if (p.data.roleKey) teamRoleKeys.add(p.data.roleKey);
  }
  const methodRoleKeys = toArray(method.data.roleKeys);
  const uncoveredRoles = methodRoleKeys.filter(r => !teamRoleKeys.has(r));

  // Modele d'equipe (regle decideur 2026-07-16) : un role requis par la methode qui n'est
  // couvert par AUCUN persona dedie du casting est pris en charge PAR DEFAUT par le
  // COORDINATEUR de la team. Ce n'est donc PAS un orphelin bloquant tant qu'un coordinateur
  // valide existe. Garde-fou : sans coordinateur (champ absent OU persona introuvable), un
  // role non couvert reste un VRAI orphelin bloquant.
  const coordinatorId = team.data.coordinator || null;
  const hasCoordinator = !!coordinatorId && !!readEntry('personas', coordinatorId, root);
  const coveredByCoordinator = hasCoordinator ? uncoveredRoles : [];
  const orphans = hasCoordinator ? [] : uncoveredRoles;
  const warnings = [];
  if (coveredByCoordinator.length) {
    warnings.push(`role(s) sans persona dedie, pris en charge par le coordinateur ${coordinatorId} : ${coveredByCoordinator.join(', ')}`);
  }

  // Binding : explicite (verifie coherent) ou auto-selection d'un binding compatible.
  let binding = null;
  let bindingError = null;
  if (bindingId) {
    binding = readEntry('bindings', bindingId, root);
    if (!binding) bindingError = `binding introuvable : ${bindingId}`;
    else if (binding.data.methodId !== method.id || binding.data.teamId !== team.id) {
      bindingError = `binding ${bindingId} incoherent (methodId=${binding.data.methodId}, teamId=${binding.data.teamId} ≠ ${method.id}/${team.id})`;
    }
  } else {
    const candidates = scan('bindings', root)
      .map(e => readEntry('bindings', e.id, root))
      .filter(b => b && b.data.methodId === method.id && b.data.teamId === team.id);
    if (candidates.length === 1) binding = candidates[0];
  }

  // Convention d'id du coeur (@iakaframe/core) : <methodId>-<node> (cf. kits/iakaframe-claude.md,
  // packages/core/__tests__/fixtures/kit.iakaframe-claude.md). PAS <method>--<team>--<binding>.
  const id = `${method.id}-${node}`;
  const descriptor = {
    id,
    methodId: method.id,
    teamId: team.id,
    bindingId: binding ? binding.id : null,
    node,
    // emits = GLOBS de sortie par noeud (semantique coeur), pas les chemins concrets par persona.
    emits: emitsForNode(node),
  };

  // unknownPersonas (persona inexistant) reste bloquant, comme orphans et bindingError.
  const ok = orphans.length === 0 && unknownPersonas.length === 0 && !bindingError;
  return {
    ok, error: bindingError,
    method, team, binding,
    methodRoleKeys, teamRoleKeys: [...teamRoleKeys].sort(),
    orphans, unknownPersonas, coordinator: coordinatorId, coveredByCoordinator, warnings, descriptor,
  };
}

export function toArray(v) {
  if (v == null || v === '') return [];
  return Array.isArray(v) ? v : [v];
}

// Globs emis par un kit selon le noeud (semantique @iakaframe/core). Pour claude : subagents,
// skills, hooks d'identite/perimetre + contrat CLAUDE.md (cf. adapters/claudeCode.ts). Pour les
// autres noeuds, repli minimal sur le seul fichier-contrat (pas de golden au-dela de claude).
export function emitsForNode(node) {
  if (node === 'claude') {
    return ['.claude/agents/*', '.claude/skills/*', '.claude/hooks/*', 'CLAUDE.md'];
  }
  return [contractFileForNode(node)];
}

// Serialise un descripteur de kit au format canonique du coeur (serializeKitMd @iakaframe/core) :
// ordre id, methodId, teamId, bindingId (si present), node, emits ; listes quotees ; corps standard.
// Verrouille byte-a-byte par cli/test/parity-kit.test.js (golden partage core<->CLI).
export function serializeKit(d) {
  const fields = [
    { key: 'id', kind: 'scalar', value: d.id },
    { key: 'methodId', kind: 'scalar', value: d.methodId },
    { key: 'teamId', kind: 'scalar', value: d.teamId },
    (d.bindingId ? { key: 'bindingId', kind: 'scalar', value: d.bindingId } : undefined),
    { key: 'node', kind: 'scalar', value: d.node },
    (d.emits !== undefined ? { key: 'emits', kind: 'list', value: d.emits } : undefined),
  ];
  return buildDocument(fields, `# Kit ${d.id}\n`);
}
