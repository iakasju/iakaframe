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
  listPersonas, affectPersona, fullteam,
  ROLE_OF, PORTFOLIO_PERSONAS,
} from '../lib/agents.js';
import { generateAll } from '../lib/generate-agents.js';
import { resolveSkills } from '../lib/resolve-skills.js';
import { libraryRoot } from '../lib/library.js';
import { collection, emit, fail } from '../lib/output.js';

export function runAgents(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      action: { type: 'string' }, agent: { type: 'string' },
      project: { type: 'string' }, global: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
    },
  });
  const action = values.action || positionals[0] || 'list';
  const project = values.project || process.cwd();
  const json = values.json;

  switch (action) {
    case 'list': {
      const root = libraryRoot();
      // Skills RESOLUES (transitives) depuis le frontmatter canon (R8) — plus de table codee.
      // resolveSkills peut echouer pour une persona d'une autre frame (skills non presentes) :
      // repli defensif [] pour ne jamais casser un simple `list`.
      const skillsOf = (n) => { try { return resolveSkills(n, { root }); } catch { return []; } };
      const personas = listPersonas().map((n) => ({
        persona: n,
        role: ROLE_OF[n] || null,
        skills: skillsOf(n),
        portfolio: PORTFOLIO_PERSONAS.includes(n),
      }));
      emit(json, collection('personas', personas), () => {
        console.log('Equipe iakaframe - personas canon :');
        for (const p of personas) {
          const s = p.skills.length ? p.skills.join(', ') : '(CLAUDE.md)';
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
    case 'generate': {
      // Genere les contrats deployes DEPUIS le canon (library/personas/) + binding.
      //  - sans --check : ECRIT les 8 contrats dans <target>/.claude/agents/ (rendu = meme
      //    moteur que affectPersona).
      //  - --check : n'ecrit RIEN, compare le rendu a l'existant, sort NON-ZERO si divergence
      //    (filet anti-derive : garantit deploye == source-genere).
      const target = values.global ? path.join(os.homedir(), '.claude') : path.join(path.resolve(project), '.claude');
      const dir = path.join(target, 'agents');
      // FRAME-SCOPING : deployer EXACTEMENT la team de la frame (global -> team du default ; projet
      // -> team de la frame active du projet), jamais toute la library partagee (fuite inter-frames).
      const contracts = generateAll({ root: libraryRoot(), project: values.global ? null : project });
      const rows = [];
      let drift = 0;
      for (const [id, content] of contracts) {
        const dst = path.join(dir, `${id}.md`);
        const exists = fs.existsSync(dst);
        const current = exists ? fs.readFileSync(dst, 'utf8') : null;
        const same = exists && current === content;
        if (values.check) {
          const status = !exists ? 'absent' : (same ? 'ok' : 'drift');
          if (status !== 'ok') drift++;
          rows.push({ persona: id, status });
        } else {
          if (!same) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dst, content); }
          rows.push({ persona: id, status: same ? 'unchanged' : (exists ? 'updated' : 'written') });
        }
      }
      if (values.check) {
        emit(json, collection('personas', rows, { target, ok: drift === 0, drift }), () => {
          console.log(`Verification des contrats deployes (${target}/agents) :`);
          for (const r of rows) console.log(`  ${r.status === 'ok' ? '=' : '!'} ${r.persona.padEnd(9)} ${r.status}`);
          console.log(drift === 0
            ? 'OK : deploye == source-genere (aucune derive).'
            : `DERIVE : ${drift} contrat(s) divergent(s) du canon. Regenerer via 'agents generate'.`);
        });
        if (drift !== 0) process.exitCode = 1;
      } else {
        emit(json, collection('personas', rows, { target }), () => {
          console.log(`Generation des contrats -> ${target}/agents :`);
          for (const r of rows) console.log(`  ${r.status === 'unchanged' ? '=' : '+'} ${r.persona.padEnd(9)} ${r.status}`);
        });
      }
      break;
    }
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
      fail(json, `action inconnue : ${action} (list|affect|fullteam|generate|status)`);
  }
}
