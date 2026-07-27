// Deploiement des skills du canon vers le runtime (R8, deploiement-skills-runtime.md § 5.4).
//
// Calque de `agents generate [--check]` (commands/agents.js) mais pour le DOMAINE skills : la cible
// recoit `<target>/.claude/skills/<id>/` = copie RECURSIVE et FIDELE de `library/skills/<id>/`.
//
// Regles (D4, § 5.4) :
//   - union = union transitive des `resolveSkills(p)` pour toute persona `p` dont le CONTRAT est
//     deploye sur la cible (personasForTarget) -> invariant « contrat deploye => skills deployees » ;
//   - NON DESTRUCTIF / IDEMPOTENT : n'ecrit un dossier que s'il DIFFERE du canon ;
//   - ORPHELINES (deployees, hors union) : statut `orphan`, JAMAIS supprimees (pas de --prune MVP) ;
//   - `--check` : n'ecrit RIEN ; exit non-zero sur `drift`/`absent`, JAMAIS sur `orphan` seul.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { libraryRoot, pathFor } from './library.js';
import { resolveSkills } from './resolve-skills.js';
import { personasForTarget } from './generate-agents.js';

// Union DETERMINISTE des skills resolues des personas de la cible (ordre : 1re apparition en
// parcourant les personas dans l'ordre de la team, chacune resolue transitive).
export function unionSkills({ root = libraryRoot(), project } = {}) {
  const seen = new Set();
  const out = [];
  for (const persona of personasForTarget({ root, project })) {
    for (const skill of resolveSkills(persona, { root })) {
      if (!seen.has(skill)) { seen.add(skill); out.push(skill); }
    }
  }
  return out;
}

// Dossier canon d'une skill (repertoire contenant SKILL.md).
function skillCanonDir(root, id) {
  const file = pathFor('skills', id, root); // <root>/library/skills/<id>/SKILL.md
  return file ? path.dirname(file) : null;
}

// Liste RELATIVE et triee des fichiers d'un dossier (walk recursif). Dossier absent -> null.
function listFiles(dir) {
  if (!fs.existsSync(dir)) return null;
  const out = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(r); else out.push(r);
    }
  };
  walk('');
  return out.sort();
}

// Deux dossiers different-ils ? (ensemble de fichiers OU contenu d'un fichier). `dst` absent =>
// 'absent' ; sinon 'drift' si un fichier manque/surnumeraire/differe ; sinon 'ok'.
export function skillStatus(src, dst) {
  const dstFiles = listFiles(dst);
  if (dstFiles === null) return 'absent';
  const srcFiles = listFiles(src) || [];
  if (srcFiles.join('\0') !== dstFiles.join('\0')) return 'drift';
  for (const rel of srcFiles) {
    const a = fs.readFileSync(path.join(src, rel));
    const b = fs.readFileSync(path.join(dst, rel));
    if (!a.equals(b)) return 'drift';
  }
  return 'ok';
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

// Ecrit un dossier skill FIDELE au canon (remplacement complet pour purger d'eventuels residus).
function syncDir(src, dst) {
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  copyDir(src, dst);
}

export function targetClaudeDir({ project, global }) {
  return global ? path.join(os.homedir(), '.claude') : path.join(path.resolve(project), '.claude');
}

// Deploie (ou verifie) l'union des skills sur une cible. Retourne un rapport structure.
//   { target, count, skills:[{skill,status}], orphans:[{skill,status:'orphan'}], drift, ok }
// `check=true` : aucune ecriture ; `drift`/`absent` -> ok:false. `orphan` seul ne casse jamais.
export function deploySkills({ root = libraryRoot(), project, global = false, check = false } = {}) {
  const union = unionSkills({ root, project });
  const target = targetClaudeDir({ project, global });
  const skillsDir = path.join(target, 'skills');

  const rows = [];
  let drift = 0;
  for (const id of union) {
    const src = skillCanonDir(root, id);
    const dst = path.join(skillsDir, id);
    const status = skillStatus(src, dst); // absent | drift | ok
    if (check) {
      if (status !== 'ok') drift++;
      rows.push({ skill: id, status });
    } else {
      if (status === 'ok') rows.push({ skill: id, status: 'unchanged' });
      else { syncDir(src, dst); rows.push({ skill: id, status: status === 'absent' ? 'written' : 'updated' }); }
    }
  }

  // Orphelines : dossiers deployes hors union (jamais supprimes, jamais comptes en drift).
  const inUnion = new Set(union);
  const orphans = [];
  if (fs.existsSync(skillsDir)) {
    for (const e of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (e.isDirectory() && !inUnion.has(e.name)) orphans.push({ skill: e.name, status: 'orphan' });
    }
    orphans.sort((a, b) => a.skill.localeCompare(b.skill));
  }

  return { target, count: union.length, skills: rows, orphans, drift, ok: drift === 0 };
}
