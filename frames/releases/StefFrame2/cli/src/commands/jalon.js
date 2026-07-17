// iakaframe jalon - rend le CADRE d'un jalon (gate) : titre FIGlet Standard
// "<PROJET> - JALON : <nom>" + tableau 3 zones (emetteur / contenu / recepteur).
// Les liens de fichiers a verifier sont references ici ; l'agent les redonne en
// `chemin:ligne` dans son message (cliquables cote Claude Code).
import { parseArgs } from 'node:util';
import { renderBanner } from '../lib/banner.js';
import { table, wrap } from '../lib/table.js';

const JALON_FONT = 'Standard'; // police dediee aux jalons (distincte des titres de royaume)

export function runJalon(argv) {
  const { values } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      project: { type: 'string' }, name: { type: 'string' },
      from: { type: 'string' }, to: { type: 'string' },
      content: { type: 'string' }, files: { type: 'string' },
      next: { type: 'string' }, validated: { type: 'boolean', default: false },
      ascii: { type: 'boolean', default: false },
    },
  });
  const project = (values.project || 'PROJET').toUpperCase();
  const name = values.name || '';

  if (values.validated) {
    console.log(renderBanner('JALON VALIDE', JALON_FONT));
    if (name) console.log(`Jalon : ${project} - ${name}`);
    console.log(`-> La suite : ${values.next || '(prochaine etape a preciser)'}`);
    return;
  }

  console.log(renderBanner(`${project} - JALON : ${name}`, JALON_FONT));
  const w = Math.max(24, Math.min(60, (process.stdout.columns || 100) - 40));
  const files = (values.files || '').split(',').map(s => s.trim()).filter(Boolean);
  let content = values.content || '';
  if (files.length) content += `\n\nA verifier (liens dans le message) :\n` + files.map(f => `  -> ${f}`).join('\n');
  const rows = [[
    values.from || '(emetteur)',
    wrap(content || '(contenu)', w).join('\n'),
    values.to || 'Utilisateur',
  ]];
  console.log(table(['EMETTEUR', 'CONTENU', 'RECEPTEUR'], rows, { ascii: values.ascii }));
}
