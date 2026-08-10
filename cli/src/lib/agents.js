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
import { scan, libraryRoot, readEntry, toArray } from './library.js';
import { activeTeamId } from './frame-active.js';
import { generateAgent, loadDefaultBinding } from './generate-agents.js';
import { resolveSkills } from './resolve-skills.js';

// Persona (code-nom) -> rôle canonique incarné (réf. CANONICAL_ROLES de @iakaframe/core).
//
// ⚠️ DIVERGENCE LEXICALE ASSUMEE (R5, § 9.2 de role-frame-builder.md). Cette table porte encore
// l'ANCIEN vocabulaire (architecture/fabrication/tests/graphisme/doc) — c'est le SEUL et dernier
// porteur en divergence, la reconciliation `ROLE_OF` est HORS PERIMETRE (poste B3 de
// vocabulaire-roles-agnostique.md). L'entree `feanor: 'frame'` est ecrite au vocabulaire CANON
// (le role `frame` n'a pas d'ancien equivalent : il est net-neuf). La table est donc, a partir
// d'ici, a DEUX vocabulaires. C'est DELIBERE et documente, pas une incoherence accidentelle.
// 🛑 DETTE ECRITE LA OU ELLE SE LIT (scission du squad prod, 2026-08-08). Apres la scission,
// cette table dit que **Charon fait du deploiement** et que **Helm fait de la coordination** —
// et la seconde moitie est FAUSSE : Helm ne coordonne rien, il surveille. L'entree `helm` n'est
// PAS corrigee ici, et c'est delibere : `ROLE_OF` est le dernier porteur du vocabulaire
// d'origine, et sa reconciliation est HORS PERIMETRE DECLARE (poste B3 de
// vocabulaire-roles-agnostique.md), gele par trois instructions. Y toucher pour un seul persona
// ouvrirait ce chantier lexical en passant, sans arbitrage.
// Une dette VISIBLE a l'endroit ou on la lit vaut mieux qu'une dette rangee dans un ticket.
// La verite sur les roles vit dans le frontmatter `roleKey` des personas — c'est LUI que
// `assemble` lit, jamais cette table.
export const ROLE_OF = {
  odin: 'portefeuille',
  aragorn: 'coordination',
  gandalf: 'architecture',
  gimli: 'fabrication',
  legolas: 'tests',
  charon: 'deploiement',  // vocabulaire CANON (persona net-neuve, cf. avertissement ci-dessus)
  helm: 'coordination',   // ⚠️ FAUX depuis la scission — dette assumee, cf. bloc ci-dessus
  loki: 'graphisme',
  nathalie: 'doc',
  feanor: 'frame',        // vocabulaire CANON (role net-neuf, cf. avertissement ci-dessus)
};

// Les ex-tables codees `SKILL_OF`/`SKILL_OVERRIDE_OF` (seconde source de verite, MONO-skill) sont
// SUPPRIMEES (R8 D5) : le frontmatter `skills:` de la persona + `subskills:` des skills est la
// source UNIQUE, resolue transitive par `resolveSkills` (resolve-skills.js). Elles disaient faux
// (`fabrication: ''`) et rataient iakastart/memoire-humaine/lecture-maquettes. ROLE_OF (mapping de
// rôle, distinct de la skill) reste, il n'a jamais porte la conflation skill.

// Personas de portefeuille (hors team projet).
export const PORTFOLIO_PERSONAS = ['odin'];
/** @deprecated alias retro-compat de PORTFOLIO_PERSONAS (conserve >= 1 version mineure). */
export const PORTFOLIO_AGENTS = PORTFOLIO_PERSONAS;

// Personas a ACTIVATION EXPLICITE (D-G de role-frame-builder.md, arbitrage 5). MEMBRES du roster
// d'equipe (roleKey reel) mais JAMAIS spawnes par le dispatch automatique : ils ne s'activent que
// sur demande explicite de l'utilisateur. Constante DISTINCTE de PORTFOLIO_PERSONAS : meme
// COMPORTEMENT (exclusion de fullteam), RAISON differente (portefeuille au-dessus des equipes vs
// membre d'equipe a activation explicite). Surcharger PORTFOLIO_PERSONAS mentirait sur la raison
// (R13). L'exclusion du dispatch porte sur l'UNION des deux listes (cf. frameTeamPersonas).
export const EXPLICIT_ACTIVATION_PERSONAS = ['feanor'];

// Union exclue du dispatch automatique : portefeuille + activation explicite.
export const NON_DISPATCH_PERSONAS = [...PORTFOLIO_PERSONAS, ...EXPLICIT_ACTIVATION_PERSONAS];

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

  // Skills : liste RESOLUE (transitive) depuis le frontmatter canon, jamais une table codee (R8
  // D5/D6). Source = library/skills/<id>/ (le `<root>/skills` historique n'existait pas en dev :
  // dette d'absence). Copie recursive fidele de chaque dossier resolu.
  let resolved = [];
  try { resolved = resolveSkills(name, { root: libRoot }); }
  catch (e) { console.log(`  ! skills irresolubles pour ${name} : ${e.message}`); }
  for (const skill of resolved) {
    const srcSkill = path.join(libRoot, 'library', 'skills', skill);
    if (fs.existsSync(srcSkill)) { copyDir(srcSkill, path.join(target, 'skills', skill)); console.log(`  + skill  ${skill}`); }
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

// Personas DISPATCHABLES d'une team : personas de la team MOINS l'union portefeuille + activation
// explicite (feanor est MEMBRE de la team mais hors dispatch auto ; sans ce filtre fullteam le
// deploierait — filtre OBLIGATOIRE, D-G/A23). Team introuvable/vide -> [] (JAMAIS la library
// entiere : ce serait une fuite de perimetre, cf. frameTeamPersonas).
function teamDispatchPersonas(teamId, root) {
  if (!teamId) return [];
  const team = readEntry('teams', teamId, root);
  if (!team) return [];
  return toArray(team.data.personas).filter(p => !NON_DISPATCH_PERSONAS.includes(p)).sort();
}

// Personas de la TEAM de la frame active d'un projet (D-E, reservoir-de-frames.md) : pointeur
// <projet>/.iakaframe -> frame active -> descripteur -> teamId -> personas de la team, MOINS le
// portefeuille + activation explicite (odin/feanor hors dispatch projet).
//
// FRAME-SCOPING (correctif de fuite) : le repli n'est PLUS « toute la library moins portefeuille »
// mais LA TEAM DU DEFAULT (`iakaframe` -> `iakaframe-8`), resolue explicitement. La library est
// PARTAGEE entre toutes les frames du reservoir (elle grossit legitimement : scrum y range
// carter/gregan/meads) ; retomber dessus ferait FUITER les personas d'autres frames vers un projet
// iakaframe SANS pointeur. On retombe donc sur la team du default, jamais sur la library entiere.
// Un projet SANS pointeur (usage courant) reste ainsi cable sur le roster iakaframe, comme avant.
export function frameTeamPersonas(projectDir) {
  const root = libraryRoot();
  // 1. Team de la frame active (activeTeamId retombe DEJA sur la team du default si la frame
  //    active est introuvable, cf. frame-active.js).
  const active = teamDispatchPersonas(activeTeamId(projectDir, root), root);
  if (active.length) return active;
  // 2. Repli ANTI-FUITE : team du DEFAULT resolue explicitement (jamais la library entiere).
  return teamDispatchPersonas(activeTeamId(null, root), root);
}

// Personas reellement assignees a un projet (<projet>/.claude/agents), sinon la TEAM de la frame
// active (D-E). L'empreinte deployee garde la PRIORITE (deja correct) ; seul le repli change :
// team de la frame active au lieu de la library entiere.
export function assignedPersonas(projectDir) {
  try {
    const dep = path.join(path.resolve(projectDir), '.claude', 'agents');
    const f = fs.readdirSync(dep).filter(x => x.endsWith('.md')).map(x => x.replace(/\.md$/, '')).sort();
    if (f.length) return f;
  } catch { /* pas encore deploye */ }
  return frameTeamPersonas(projectDir);
}
/** @deprecated alias retro-compat de assignedPersonas (conserve >= 1 version mineure). */
export const assignedAgents = assignedPersonas;

// Deploie EXACTEMENT les personas de la TEAM de la frame active (D-E) au lieu de « toute la
// library moins portefeuille ». Un projet pointant une frame a team reduite ne recoit PAS les 8
// par defaut (A7). Sans projet (global) : repli sur la team du default (roster iakaframe).
export function fullteam({ project, global = false, force = false } = {}) {
  const binding = loadDefaultBinding(libraryRoot()); // charge une fois, reutilise par persona
  for (const name of frameTeamPersonas(project)) {
    if (NON_DISPATCH_PERSONAS.includes(name)) continue; // portefeuille + activation explicite (feanor)
    affectPersona(name, { project, global, force, binding });
  }
}
