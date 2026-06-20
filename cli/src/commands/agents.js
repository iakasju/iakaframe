// iakaframe agents - liste / affecte / full team / statut. Iso PS (modele image-conteneur).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listAgents, affectAgent, fullteam, SKILL_OF, PORTFOLIO_AGENTS } from '../lib/agents.js';

export function runAgents(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      action: { type: 'string' }, agent: { type: 'string' },
      project: { type: 'string' }, global: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
    },
  });
  const action = values.action || positionals[0] || 'list';
  const project = values.project || process.cwd();

  switch (action) {
    case 'list':
      console.log('Equipe iakaframe - definitions canon :');
      for (const n of listAgents()) {
        const s = SKILL_OF[n] || '(CLAUDE.md)';
        const tag = PORTFOLIO_AGENTS.includes(n) ? '  [portefeuille]' : '';
        console.log(`  ${n.padEnd(9)} -> ${s}${tag}`);
      }
      break;
    case 'affect':
      if (!values.agent) { console.error('Preciser --agent <nom>.'); process.exitCode = 1; return; }
      console.log(`Affectation de '${values.agent}' -> ${values.global ? '~/.claude (mutualise)' : project}`);
      affectAgent(values.agent, { project, global: values.global, force: values.force });
      break;
    case 'fullteam':
      console.log(`Deploiement FULL TEAM -> ${values.global ? '~/.claude' : project}`);
      fullteam({ project, global: values.global, force: values.force });
      console.log('Full team deployee. (Odin = portefeuille : agents affect --agent odin --project <chapeau>.)');
      break;
    case 'status': {
      const target = values.global ? path.join(os.homedir(), '.claude') : path.join(path.resolve(project), '.claude');
      const dir = path.join(target, 'agents');
      console.log(`Agents affectes dans : ${target}`);
      if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().forEach(f => console.log(`  - ${f.replace(/\.md$/, '')}`));
      else console.log('  (aucun - lancer agents fullteam)');
      break;
    }
    default:
      console.error(`action inconnue : ${action} (list|affect|fullteam|status)`); process.exitCode = 1;
  }
}
