// Scaffolds de FORGE (Lot 2, outillage-forge-frame.md § 4). Deux gestes, sans forker la library :
//   - `frame new <id>` : ossature d'un frame neuf (descripteur + method + team + binding + kit),
//     LINT-CLEAN par construction (ARB-3) - une base valide que `frame lint <id>` accepte a exit 0.
//   - `add <type-de-pool> <id>` : pose un atome typé dans la bonne collection (fini l'ecriture
//     « par imitation »). `skill` scaffolde le DOSSIER + SKILL.md (kind skill).
// Ecrit UNIQUEMENT sous la racine bibliotheque resolue (AC2.6). Non destructif (--force). Zero dep.
import fs from 'node:fs';
import path from 'node:path';
import { buildDocument } from './frontmatter.js';
import { scan, readEntry, pathFor, serializeKit, emitsForNode } from './library.js';

// --- frame new <id> : ossature lint-clean (ARB-3). ---------------------------------------------
// Reutilise les atomes du POOL PARTAGE (aucune copie de brique, AC2.1) : la methode pointe un
// workflow existant (ou le catalogue, ARB-2) et un roleKey couvert par une persona du casting ;
// la team caste cette persona en coordinateur. => le graphe resout, `frame lint <id>` sort 0.
export function scaffoldFrameNew(id, root, { force = false } = {}) {
  const roleIds = new Set(scan('roles', root).map(e => e.id));
  // Coordinateur = 1re persona dont le roleKey resout a un role existant (casting lint-clean).
  let coord = null; let coordRole = null;
  for (const e of scan('personas', root)) {
    const p = readEntry('personas', e.id, root);
    if (p && p.data.roleKey && roleIds.has(p.data.roleKey)) { coord = e.id; coordRole = p.data.roleKey; break; }
  }
  if (!coord) {
    return { ok: false, error: 'bibliotheque sans persona a roleKey resolvable : impossible d\'ossaturer une frame lint-clean (ARB-3). Poser d\'abord `add role <r>` puis `add persona <p>` (roleKey: <r>).' };
  }
  const workflows = scan('workflows', root);
  // Workflow du pool s'il en existe un, sinon le catalogue du coeur (ARB-2 : avertissement, non bloquant).
  const workflowId = workflows.length ? workflows[0].id : 'iakaframe-canonical';

  const files = [
    { rel: path.join('frames', `${id}.md`), content: frameDescriptorDoc(id) },
    { rel: path.join('methods', `${id}.md`), content: methodDoc(id, workflowId, coordRole) },
    { rel: path.join('teams', `${id}-team.md`), content: teamDoc(id, coord) },
    { rel: path.join('bindings', `${id}-default.md`), content: bindingDoc(id, coord) },
    { rel: path.join('kits', `${id}-claude.md`), content: kitDoc(id) },
  ];

  const existing = files.filter(f => fs.existsSync(path.join(root, f.rel))).map(f => f.rel);
  if (existing.length && !force) {
    return { ok: false, error: `cible(s) existante(s) : ${existing.join(', ')} (--force pour remplacer)`, existing };
  }
  const written = [];
  for (const f of files) {
    const abs = path.join(root, f.rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content);
    written.push(f.rel);
  }
  return { ok: true, frame: id, coordinator: coord, roleKey: coordRole, workflowId, written };
}

function frameDescriptorDoc(id) {
  return buildDocument([
    { key: 'id', kind: 'scalar', value: id },
    { key: 'name', kind: 'scalar', value: `Frame ${id}` },
    { key: 'version', kind: 'scalar', value: 'v0.1.0' },
    { key: 'methodId', kind: 'scalar', value: id },
    { key: 'teamId', kind: 'scalar', value: `${id}-team` },
    { key: 'default', kind: 'scalar', value: false },
  ], `# Frame ${id}\n\n> Ossature generee par \`iakaframe frame new ${id}\` (assemblage nomme pointant\n> la library partagee : aucun corps de brique recopie). Enrichir puis \`frame lint ${id}\`.\n`);
}

function methodDoc(id, workflowId, roleKey) {
  return buildDocument([
    { key: 'id', kind: 'scalar', value: id },
    { key: 'name', kind: 'scalar', value: `Methode ${id}` },
    { key: 'workflowId', kind: 'scalar', value: workflowId },
    { key: 'roleKeys', kind: 'list', value: [roleKey] },
  ], `# Methode ${id}\n\n> Ossature minimale (ids seulement). Enrichir principleIds / ritualIds /\n> guardrailIds / scaffoldIds selon le besoin - chacun doit resoudre dans library/*.\n`);
}

function teamDoc(id, coord) {
  return buildDocument([
    { key: 'id', kind: 'scalar', value: `${id}-team` },
    { key: 'name', kind: 'scalar', value: `Team ${id}` },
    { key: 'personas', kind: 'list', value: [coord] },
    { key: 'coordinator', kind: 'scalar', value: coord },
    { key: 'guardrails', kind: 'list', value: [] },
  ], `# Team ${id}\n\n> Ossature minimale : ${coord} en coordinateur (couvre le role de la methode).\n> Ajouter des personas dediees selon les roles a couvrir.\n`);
}

// Binding : liste de maps inline en forme BLOC (buildDocument ne rend que du flow) - forme du canon.
function bindingDoc(id, coord) {
  return `---\nid: ${id}-default\nmethodId: ${id}\nteamId: ${id}-team\nassignments:\n  - { personaId: ${coord}, runner: claude }\n---\n`
    + `# Binding ${id}-default\n\n> Ossature generee par \`iakaframe frame new ${id}\` : affecte ${coord} au runner claude.\n`;
}

function kitDoc(id) {
  return serializeKit({
    id: `${id}-claude`, methodId: id, teamId: `${id}-team`, bindingId: `${id}-default`,
    node: 'claude', emits: emitsForNode('claude'),
  }, `# Kit ${id}-claude\n\n> Ossature generee par \`iakaframe frame new ${id}\`. Le kit complet se\n> (re)genere depuis le binding (chaine assemble/kit existante).\n`);
}

// --- add <type-de-pool> <id> : atome typé dans la bonne collection. ----------------------------
// Table SINGULIER (kind d'add) -> PLURIEL (type de collection, COLLECTIONS faisant autorite).
export const POOL_KIND_TO_TYPE = {
  persona: 'personas', role: 'roles', principle: 'principles', ritual: 'rituals',
  guardrail: 'guardrails', skill: 'skills', workflow: 'workflows', scaffold: 'scaffolds',
};
export const POOL_KINDS = Object.keys(POOL_KIND_TO_TYPE);

export function scaffoldPoolAtom(kind, id, root, { force = false } = {}) {
  const type = POOL_KIND_TO_TYPE[kind];
  if (!type) return { ok: false, error: `type de pool inconnu : ${kind}` };
  const dest = pathFor(type, id, root); // gere le mode DOSSIER de skill (library/skills/<id>/SKILL.md)
  if (fs.existsSync(dest) && !force) {
    return { ok: false, error: `existe deja : ${dest} (--force pour remplacer)`, dest };
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, poolTemplate(kind, id));
  return { ok: true, kind, id, type, dest };
}

// Gabarits typés : frontmatter minimal SANS ref pendante (frame lint accepte, AC2.7). L'auteur
// remplit les references (roleKey, skills, subskills, phases) ensuite.
function poolTemplate(kind, id) {
  const body = `# ${id}\n\n> Atome \`${kind}\` genere par \`iakaframe add ${kind} ${id}\`. Completer le corps\n> et les references (elles doivent resoudre dans library/*).\n`;
  const f = (key, kind_, value) => ({ key, kind: kind_, value });
  switch (kind) {
    case 'persona':
      return buildDocument([f('id', 'scalar', id), f('name', 'scalar', id), f('roleKey', 'scalar', ''), f('skills', 'list', []), f('guardrails', 'list', [])], body);
    case 'skill':
      return buildDocument([f('id', 'scalar', id), f('name', 'scalar', id), f('subskills', 'list', [])], body);
    case 'workflow':
      return buildDocument([f('id', 'scalar', id), f('name', 'scalar', id)],
        `# ${id}\n\n> Workflow genere. Ajouter \`phases:\` avec \`agentsRoleKeys\` (doivent resoudre en roles).\n`);
    case 'role': case 'principle': case 'ritual': case 'guardrail':
      return buildDocument([f('id', 'scalar', id), f('label', 'scalar', id)], body);
    case 'scaffold':
      return buildDocument([f('id', 'scalar', id)], body);
    default:
      return buildDocument([f('id', 'scalar', id)], body);
  }
}
