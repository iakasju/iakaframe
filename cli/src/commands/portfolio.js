// iakaframe portfolio - vue agregee du portefeuille (T1), STRICTEMENT LECTURE SEULE. Scanne la
// racine chapeau (resolveRoot / --root), detecte les projets iakaframe (marqueur .iakaframe OU
// specs/PROJET.md OU .git/) et agrege par projet : ligne de def (PROJET.md), version + arbre +
// dernier commit (via etat.js:readEtat, repli git.js), jalons ouverts [best-effort, optionnel].
// AUCUN effet de bord : ne cree/modifie aucun fichier. Toute source absente/non conforme -> repli,
// jamais d'exception (memes garanties defensives que etat.js). Zero dependance.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from '../lib/root.js';
import { readEtat } from '../lib/etat.js';
import { isRepo, out as gitOut, hasChanges } from '../lib/git.js';
import { table } from '../lib/table.js';

// Marqueurs d'un projet iakaframe (au moins un present).
function isProject(dir) {
  return fs.existsSync(path.join(dir, '.iakaframe'))
    || fs.existsSync(path.join(dir, 'specs', 'PROJET.md'))
    || fs.existsSync(path.join(dir, '.git'));
}

// 1re ligne significative de specs/PROJET.md (non vide, non titre `#`). Defensif : '' si absent.
function defLine(dir) {
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
function openMilestones(dir) {
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

export function runPortfolio(argv) {
  const { values } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' },
      json: { type: 'boolean', default: false },
      ascii: { type: 'boolean', default: false },
    },
  });
  const root = resolveRoot(values.root);
  const projects = scanPortfolio(root);

  if (values.json) {
    console.log(JSON.stringify({ ok: true, root, count: projects.length, projects }, null, 2));
    return;
  }

  if (!projects.length) {
    console.log(`Portefeuille (${root}) : aucun projet detecte.`);
    return;
  }

  const headers = ['Projet', 'Ligne de def', 'Version', 'Arbre', 'Dernier commit', 'Jalons'];
  const rows = projects.map((p) => [
    p.project,
    p.def || '—',
    p.version,
    p.arbre,
    p.commit,
    p.openMilestones == null ? '—' : String(p.openMilestones),
  ]);
  console.log(`Portefeuille (${root}) — ${projects.length} projet(s) :\n`);
  console.log(table(headers, rows, { ascii: values.ascii }));
}
