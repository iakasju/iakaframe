// iakaframe commands - inventaire MACHINE des verbes et sous-verbes (Lot 0, pivot des deux
// surfaces du mode guide, specs/instructions/cli-mode-guide-selections.md). Lecture seule : lit
// lib/verbes.js (source unique) et le rend sous l'enveloppe C-JSON (lib/output.js). Rien d'autre
// n'imprime cet inventaire — l'aide humaine (`--help`) et les commandes Claude Code (Lot B) EN
// DERIVENT, elles ne le reecrivent jamais.
import { parseArgs } from 'node:util';
import { VERBES, resumeOf, optionsOf } from '../lib/verbes.js';
import { table } from '../lib/table.js';
import { collection, emit } from '../lib/output.js';

const USAGE = `Usage : iakaframe commands [options]

Inventaire machine des verbes et sous-verbes du CLI (source unique de l'aide et du futur
guidage — lib/verbes.js). Lecture seule.

Options :
  --json             Sortie machine : { ok, count, verbes:[{id,resume,options,sousVerbes,
                     parametres,guideClaudeCode}] }
  --ascii            Tableau en ASCII pur (sans box-drawing)`;

// Rend une entree (verbe ou sous-verbe) serialisable en JSON : `resume` est normalise en chaine
// (vendor-check le porte en fonction, cf. lib/verbes.js), les sous-verbes recursivement.
function serialize(entree) {
  return {
    id: entree.id,
    resume: resumeOf(entree),
    options: optionsOf(entree),
    sousVerbes: (entree.sousVerbes || []).map(serialize),
    parametres: entree.parametres || [],
    ...(entree.guideClaudeCode ? { guideClaudeCode: entree.guideClaudeCode } : {}),
  };
}

export function runCommands(argv) {
  const { values } = parseArgs({
    args: argv, allowPositionals: false,
    options: {
      json: { type: 'boolean', default: false },
      ascii: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }

  const verbes = VERBES.map(serialize);
  emit(values.json, collection('verbes', verbes), () => {
    const rows = verbes.map(v => [
      v.id,
      v.resume.length > 70 ? v.resume.slice(0, 67) + '...' : v.resume,
      v.sousVerbes.length ? v.sousVerbes.map(s => s.id).join(', ') : '',
    ]);
    console.log(table(['verbe', 'resume', 'sous-verbes'], rows, { ascii: values.ascii }));
    console.log(`Total verbes : ${verbes.length}`);
  });
}
