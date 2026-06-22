// iakaframe brief <projet> - a l'entree d'un projet : titre + tableau (derniere etape +
// backlog) + agents assignes (team complete par defaut). Reutilise par `go`.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from '../lib/root.js';
import { printBanner, DEFAULT_FONT } from '../lib/banner.js';
import { table, wrap } from '../lib/table.js';
import { lastStep, backlog } from '../lib/etat.js';
import { assignedAgents } from '../lib/agents.js';

function colWidth() { return Math.max(40, Math.min(80, (process.stdout.columns || 100) - 22)); }

// Affiche le tableau d'entree d'un projet. `title` controle l'affichage du titre ASCII.
export function brief(dir, font = DEFAULT_FONT, { title = true } = {}) {
  if (title) printBanner(path.basename(dir), font);
  const w = colWidth();
  const bl = backlog(dir).map(b => `- ${b}`).join('\n');
  const rows = [
    ['Derniere etape', wrap(lastStep(dir), w).join('\n')],
    ['Backlog', wrap(bl, w).join('\n')],
    ['Agents assignes', wrap(assignedAgents(dir).join(', '), w).join('\n')],
  ];
  console.log(table(['Champ', 'Valeur'], rows));
}

export function runBrief(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: { project: { type: 'string' }, path: { type: 'string' }, root: { type: 'string' }, font: { type: 'string' } },
  });
  let dir;
  if (values.path) dir = path.resolve(values.path);
  else {
    const name = values.project || positionals[0];
    if (!name) { console.error('Preciser <projet> ou --path.'); process.exitCode = 1; return; }
    dir = path.join(resolveRoot(values.root), name);
  }
  if (!fs.existsSync(dir)) { console.error(`Dossier introuvable : ${dir}`); process.exitCode = 1; return; }
  let font = values.font;
  if (!font) { try { font = JSON.parse(fs.readFileSync(path.join(dir, 'iakaframe.json'), 'utf8')).bannerFont; } catch { /* defaut */ } }
  brief(dir, font || DEFAULT_FONT);
}
