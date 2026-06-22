// iakaframe banner - rend un texte en titre ASCII (FIGlet embarque, zero dep).
// Point d'entree unique de rendu, reutilisable par les .ps1 et par les agents.
import { parseArgs } from 'node:util';
import { renderBanner, DEFAULT_FONT } from '../lib/banner.js';

export function runBanner(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: { font: { type: 'string' } },
  });
  const text = positionals.join(' ').trim();
  if (!text) { console.error('Usage : iakaframe banner <texte> [--font <nom>]'); process.exitCode = 1; return; }
  console.log(renderBanner(text, values.font || DEFAULT_FONT));
}
