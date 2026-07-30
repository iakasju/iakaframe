// iakaframe banner - rend un texte en titre ASCII (FIGlet embarque, zero dep).
// Point d'entree unique de rendu, reutilisable par le CLI et par les agents.
import { parseArgs } from 'node:util';
import { renderBanner, DEFAULT_FONT } from '../lib/banner.js';

const USAGE = `Usage : iakaframe banner <texte> [options]

Rend un texte en titre ASCII (FIGlet embarque, zero dependance).

Arguments :
  <texte>            Texte a rendre en gros caracteres

Options :
  --font <nom>       Police FIGlet (defaut : ANSI Shadow ; repli : Standard)`;

export function runBanner(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: { font: { type: 'string' }, help: { type: 'boolean', default: false } },
  });
  if (values.help) { console.log(USAGE); return; }
  const text = positionals.join(' ').trim();
  if (!text) { console.error('Usage : iakaframe banner <texte> [--font <nom>]'); process.exitCode = 1; return; }
  console.log(renderBanner(text, values.font || DEFAULT_FONT));
}
