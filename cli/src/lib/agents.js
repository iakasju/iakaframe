// Equipe de PERSONAS iakaframe (incarnations de rôles) : definitions canon (agents/*.md +
// skills/) -> copie scopee. Une persona (code-nom, ex. "aragorn") INCARNE un rôle canonique
// (ex. "coordination") ; le rôle porte une skill. On separe les deux concepts (fin de la
// conflation code-nom = rôle = skill).
//
// ⚠️ Le chemin de deploiement `.claude/agents/` (surface Claude Code) et le dossier canon
// `agents/` ne changent PAS de nom : ce sont des surfaces imposees par le nœud, pas du
// vocabulaire de concept.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { frameworkRoot } from './kit.js';
import { scan, libraryRoot } from './library.js';
import { generateAgent, loadDefaultBinding } from './generate-agents.js';

// Persona (code-nom) -> rôle canonique incarné (réf. CANONICAL_ROLES de @iakaframe/core).
export const ROLE_OF = {
  odin: 'portefeuille',
  aragorn: 'coordination',
  gandalf: 'architecture',
  gimli: 'fabrication',
  legolas: 'tests',
  helm: 'deploiement',
  loki: 'graphisme',
  nathalie: 'doc',
};

// Rôle canonique -> skill de la méthode. La skill est portee par le RÔLE, pas la persona.
export const SKILL_OF = {
  portefeuille: 'iakaframe-odin',
  coordination: 'iakaframe-aragorn',
  architecture: 'iakaframe-cadrage',
  fabrication: '',                    // pas de skill : porté par le CLAUDE.md du projet
  tests: 'iakaframe-qualite',
  deploiement: 'iakaframe-deploiement',
  graphisme: 'iakaframe-naonedge',
  doc: 'iakaframe-nathalie',
};

// Resout la skill d'une PERSONA : skill du rôle incarne. C'est la chaine persona -> rôle ->
// skill (plus de conflation), SANS exception codee : `deploiement` etant devenu un rôle
// canonique de plein droit, l'ancienne table SKILL_OVERRIDE_OF (qui rattrapait le rangement
// par defaut de helm en "coordination") n'a plus d'objet et a ete supprimee.
export function skillOfPersona(name) {
  const roleKey = ROLE_OF[name];
  return (roleKey && SKILL_OF[roleKey]) || '';
}

// Personas de portefeuille (hors team projet).
export const PORTFOLIO_PERSONAS = ['odin'];
/** @deprecated alias retro-compat de PORTFOLIO_PERSONAS (conserve >= 1 version mineure). */
export const PORTFOLIO_AGENTS = PORTFOLIO_PERSONAS;

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

// Personas canon disponibles. Source de verite = `library/personas/*.md` (rangement pluriel,
// COLLECTIONS de library.js). L'ancien `<root>/agents/` etait MORT (dossier inexistant) : ce
// scan repare `listPersonas` (renvoyait `[]`). La surface de deploiement `.claude/agents/`
// (nom impose par Claude Code) reste inchangee.
export function listPersonas() {
  const root = libraryRoot(); if (!root) return [];
  return scan('personas', root).map(e => e.id).sort();
}
/** @deprecated alias retro-compat de listPersonas (conserve >= 1 version mineure). */
export const listAgents = listPersonas;

function targetDir({ project, global }) {
  return global ? path.join(os.homedir(), '.claude') : path.join(path.resolve(project), '.claude');
}

export function affectPersona(name, { project, global = false, force = false, binding } = {}) {
  const root = frameworkRoot();
  if (!root) { console.error('Racine iakaframe introuvable.'); return false; }
  // Source de verite = library/personas/ ; le rendu (transform frontmatter + corps verbatim)
  // remplace l'ancienne COPIE BRUTE (qui recopiait un frontmatter persona invalide pour Claude
  // Code). Le SCOPE (target/.claude/agents/) et la mecanique --global/--project sont inchanges :
  // on ne change QUE le rendu (copie -> generation).
  const libRoot = libraryRoot();
  const b = binding || loadDefaultBinding(libRoot);
  let contract;
  try { contract = generateAgent(name, { root: libRoot, binding: b }); }
  catch { console.log(`  ! persona inconnue : ${name}`); return false; }
  const target = targetDir({ project, global });
  const dstPersonaDir = path.join(target, 'agents'); // surface Claude Code : nom impose, inchange
  fs.mkdirSync(dstPersonaDir, { recursive: true });
  const dstPersona = path.join(dstPersonaDir, `${name}.md`);
  if (fs.existsSync(dstPersona) && !force) console.log(`  = ${name} (deja present, --force pour ecraser)`);
  else { fs.writeFileSync(dstPersona, contract); console.log(`  + persona  ${name}`); }

  const skill = skillOfPersona(name);
  if (skill) {
    const srcSkill = path.join(root, 'skills', skill);
    if (fs.existsSync(srcSkill)) { copyDir(srcSkill, path.join(target, 'skills', skill)); console.log(`  + skill  ${skill}`); }
  } else if (name === 'gimli') {
    console.log('  i gimli : pas de skill - porte par le CLAUDE.md du projet.');
  }
  // Loki : embarque les chartes design-* a la racine du projet.
  if (name === 'loki' && !global) {
    for (const c of fs.readdirSync(root, { withFileTypes: true })) {
      if (c.isDirectory() && c.name.startsWith('design-')) {
        copyDir(path.join(root, c.name), path.join(path.resolve(project), c.name));
        console.log(`  + charte ${c.name}`);
      }
    }
  }
  return true;
}
/** @deprecated alias retro-compat de affectPersona (conserve >= 1 version mineure). */
export const affectAgent = affectPersona;

// Personas reellement assignees a un projet (<projet>/.claude/agents), sinon team complete canon.
export function assignedPersonas(projectDir) {
  try {
    const dep = path.join(path.resolve(projectDir), '.claude', 'agents');
    const f = fs.readdirSync(dep).filter(x => x.endsWith('.md')).map(x => x.replace(/\.md$/, '')).sort();
    if (f.length) return f;
  } catch { /* pas encore deploye */ }
  return listPersonas().filter(a => !PORTFOLIO_PERSONAS.includes(a));
}
/** @deprecated alias retro-compat de assignedPersonas (conserve >= 1 version mineure). */
export const assignedAgents = assignedPersonas;

export function fullteam({ project, global = false, force = false } = {}) {
  const binding = loadDefaultBinding(libraryRoot()); // charge une fois, reutilise par persona
  for (const name of listPersonas()) {
    if (PORTFOLIO_PERSONAS.includes(name)) continue;
    affectPersona(name, { project, global, force, binding });
  }
}
