// iakaframe recap - a la fermeture (exit/pause/stop) : tableau recap de session
// (commits + agents mobilises + projet). Prepare la reprise via `snapshot` (appele a part).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveRoot } from '../lib/root.js';
import { table, wrap } from '../lib/table.js';
import { assignedAgents } from '../lib/agents.js';

function gitLog(dir, n) {
  try {
    const out = execFileSync('git', ['-C', dir, 'log', '--oneline', '-n', String(n)], { encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch { return ['(pas de depot git ou aucun commit)']; }
}

export function runRecap(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: { project: { type: 'string' }, path: { type: 'string' }, root: { type: 'string' }, n: { type: 'string' } },
  });
  let dir;
  if (values.path) dir = path.resolve(values.path);
  else {
    const name = values.project || positionals[0] || '.';
    dir = name === '.' ? process.cwd() : path.join(resolveRoot(values.root), name);
  }
  if (!fs.existsSync(dir)) { console.error(`Dossier introuvable : ${dir}`); process.exitCode = 1; return; }
  const n = Number(values.n) || 10;
  const w = Math.max(40, Math.min(90, (process.stdout.columns || 100) - 22));
  const rows = [
    ['Projet', path.basename(dir)],
    ['Commits (session)', wrap(gitLog(dir, n).join('\n'), w).join('\n')],
    ['Agents mobilises', wrap(assignedAgents(dir).join(', '), w).join('\n')],
  ];
  console.log(table(['Champ', 'Valeur'], rows));
}
