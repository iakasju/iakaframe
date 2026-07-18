// iakaframe agents - liste / affecte / full team / statut. Iso PS (modele image-conteneur).
// Sortie machine C-JSON (§ 2) pour les LECTURES (list/status) via `--json` booleen :
//   list   -> { ok, count, personas:[{ persona, role, skill, portfolio }] }
//   status -> { ok, count, personas:[<id>], target }
// Les gestes d'ECRITURE (affect/fullteam) restent a rendu humain (logs pilotes par lib/agents.js).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  listPersonas, affectPersona, fullteam, skillOfPersona,
  ROLE_OF, PORTFOLIO_PERSONAS,
} from '../lib/agents.js';
import { collection, emit, fail } from '../lib/output.js';

export function runAgents(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      action: { type: 'string' }, agent: { type: 'string' },
      project: { type: 'string' }, global: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
    },
  });
  const action = values.action || positionals[0] || 'list';
  const project = values.project || process.cwd();
  const json = values.json;

  switch (action) {
    case 'list': {
      const personas = listPersonas().map((n) => ({
        persona: n,
        role: ROLE_OF[n] || null,
        skill: skillOfPersona(n) || null,
        portfolio: PORTFOLIO_PERSONAS.includes(n),
      }));
      emit(json, collection('personas', personas), () => {
        console.log('Equipe iakaframe - personas canon :');
        for (const p of personas) {
          const s = p.skill || '(CLAUDE.md)';
          const tag = p.portfolio ? '  [portefeuille]' : '';
          console.log(`  ${p.persona.padEnd(9)} -> ${s}${tag}`);
        }
      });
      break;
    }
    case 'affect':
      if (!values.agent) { console.error('Preciser --agent <nom>.'); process.exitCode = 1; return; }
      console.log(`Affectation de la persona '${values.agent}' -> ${values.global ? '~/.claude (mutualise)' : project}`);
      affectPersona(values.agent, { project, global: values.global, force: values.force });
      break;
    case 'fullteam':
      console.log(`Deploiement FULL TEAM -> ${values.global ? '~/.claude' : project}`);
      fullteam({ project, global: values.global, force: values.force });
      console.log('Full team deployee. (Odin = portefeuille : agents affect --agent odin --project <chapeau>.)');
      break;
    case 'status': {
      const target = values.global ? path.join(os.homedir(), '.claude') : path.join(path.resolve(project), '.claude');
      const dir = path.join(target, 'agents');
      const affected = fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort()
        : [];
      emit(json, collection('personas', affected, { target }), () => {
        console.log(`Personas affectees dans : ${target}`);
        if (affected.length) affected.forEach((f) => console.log(`  - ${f}`));
        else console.log('  (aucun - lancer agents fullteam)');
      });
      break;
    }
    default:
      fail(json, `action inconnue : ${action} (list|affect|fullteam|status)`);
  }
}
