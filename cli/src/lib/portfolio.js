// Couche `portfolio` : scan agrege du portefeuille (T1), STRICTEMENT LECTURE SEULE. Scanne la
// racine chapeau et agrege par projet : ligne de def (PROJET.md), version + arbre + dernier commit
// (via etat.js:readEtat, repli git.js), jalons ouverts [best-effort]. AUCUN effet de bord : ne
// cree/modifie aucun fichier. Toute source absente/non conforme -> repli, jamais d'exception (memes
// garanties defensives que etat.js). Zero dependance. Extrait de commands/portfolio.js (frontiere
// commands/ <-> lib/, instruction cli-api-surface-harmonisation.md § 4).
import fs from 'node:fs';
import path from 'node:path';
import { readEtat } from './etat.js';
import { isRepo, out as gitOut, hasChanges } from './git.js';

// Marqueurs d'un projet iakaframe (au moins un present).
export function isProject(dir) {
  return fs.existsSync(path.join(dir, '.iakaframe'))
    || fs.existsSync(path.join(dir, 'specs', 'PROJET.md'))
    || fs.existsSync(path.join(dir, '.git'));
}

// 1re ligne significative de specs/PROJET.md (non vide, non titre `#`). Defensif : '' si absent.
export function defLine(dir) {
  try {
    const md = fs.readFileSync(path.join(dir, 'specs', 'PROJET.md'), 'utf8');
    for (const raw of md.split(/\r?\n/)) {
      const l = raw.trim();
      if (!l || l.startsWith('#')) continue;
      return l;
    }
  } catch { /* repli */ }
  return '';
}

// [OPTIONNEL / best-effort] Jalons ouverts : nb d'instructions specs/instructions/*.md SANS
// « JALON VALIDE ». null si le dossier n'existe pas (colonne non bloquante).
export function openMilestones(dir) {
  try {
    const d = path.join(dir, 'specs', 'instructions');
    let open = 0;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith('.md')) continue;
      const t = fs.readFileSync(path.join(d, f), 'utf8');
      if (!/JALON\s+VALID/i.test(t)) open++;
    }
    return open;
  } catch { return null; }
}

// Scan agrege, sans effet de bord. Retourne un tableau d'objets tries par nom de projet.
export function scanPortfolio(root) {
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); }
  catch { return []; }

  const projects = [];
  for (const ent of entries) {
    if (!ent.isDirectory() || ent.name.startsWith('.')) continue;
    const dir = path.join(root, ent.name);
    if (!isProject(dir)) continue;

    const etat = readEtat(dir) || {};
    let version = etat['Version'] || '';
    let arbre = etat['Arbre'] || '';
    let commit = etat['Dernier commit'] || '';

    // Repli git (lecture seule) si l'etat des lieux ne renseigne pas ces champs.
    if (isRepo(dir)) {
      if (!arbre) arbre = hasChanges(dir) ? 'modifs' : 'propre';
      if (!commit) commit = gitOut(dir, ['log', '-1', '--pretty=%h %s']) || '';
    }

    projects.push({
      project: ent.name,
      def: defLine(dir),
      version: version || '—',
      arbre: arbre || '—',
      commit: commit || '—',
      openMilestones: openMilestones(dir),
    });
  }
  projects.sort((a, b) => a.project.localeCompare(b.project));
  return projects;
}
