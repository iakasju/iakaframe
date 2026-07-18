// iakaframe portfolio - vue agregee du portefeuille (T1), STRICTEMENT LECTURE SEULE. La commande =
// parsing des args + delegation a lib/portfolio.js (scan) + rendu via lib/output.js (frontiere § 4).
// Sortie machine C-JSON : { ok, count, projects:[...], root }. Zero dependance.
import { parseArgs } from 'node:util';
import { resolveRoot } from '../lib/root.js';
import { table } from '../lib/table.js';
import { scanPortfolio } from '../lib/portfolio.js';
import { collection, emit } from '../lib/output.js';

// Re-export retro-compat : scanPortfolio a demenage vers lib/portfolio.js (frontiere § 4).
export { scanPortfolio } from '../lib/portfolio.js';

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

  emit(values.json, collection('projects', projects, { root }), () => {
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
  });
}
