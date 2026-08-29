#!/usr/bin/env node
// vitrine.js — APPELANT MINCE du generateur de vitrine (L42). Toute la logique vit dans
// `cli/scripts/lib/vitrine.js` (fonction pure) ; ici, uniquement l'I/O et le code de sortie.
//
// Usage :
//   node cli/scripts/vitrine.js --check    # compare le README RACINE au rendu, code 1 si ecart
//   node cli/scripts/vitrine.js --write    # reecrit les zones du README RACINE
//
// LE README VISE EST CELUI DE LA RACINE DU DEPOT, pas `cli/README.md` : c'est la page que GitHub
// montre a un inconnu. L'AUTORITE DE VERSION est `cli/package.json`, posee par
// `dette-version-source-unique.md` — ce script n'introduit aucune source concurrente.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ecartsDeVitrine, ecrireZones, lireZones, rendreVitrine } from './lib/vitrine.js';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = path.resolve(CLI, '..');
const README = path.join(RACINE, 'README.md');

export function contexteDuDepot(cliDir = CLI) {
  return {
    version: JSON.parse(fs.readFileSync(path.join(cliDir, 'package.json'), 'utf8')).version,
    depot: 'iakasju/iakaframe',
  };
}

/**
 * Le geste executable. Isole dans une fonction et appele SEULEMENT quand ce fichier est le module
 * principal : sans ce garde, un `import` du module executait le parsing d'`argv` et sortait en
 * code 2, tuant le processus de test qui reutilise `contexteDuDepot`. Un script qui sort a l'import
 * est une mine, pas un outil.
 */
function main(argv) {
  const mode = argv.includes('--write') ? 'write' : argv.includes('--check') ? 'check' : null;
  if (!mode) {
    console.error('usage : node cli/scripts/vitrine.js --check | --write');
    return 2;
  }

  const ctx = contexteDuDepot();
  const attendues = rendreVitrine(ctx);
  const readme = fs.readFileSync(README, 'utf8');

  if (mode === 'write') {
    const suivant = ecrireZones(readme, attendues);
    if (suivant === readme) {
      console.log(`vitrine : README deja a jour (v${ctx.version}).`);
      return 0;
    }
    fs.writeFileSync(README, suivant);
    console.log(`vitrine : README reecrit sur v${ctx.version}.`);
    return 0;
  }

  const ecarts = ecartsDeVitrine(lireZones(readme, Object.keys(attendues)), attendues);
  if (ecarts.length === 0) {
    console.log(`vitrine : OK — README aligne sur v${ctx.version}.`);
    return 0;
  }
  console.error(
    `vitrine : le README a DERIVE de la version d'autorite (cli/package.json = ${ctx.version}).\n`,
  );
  for (const e of ecarts) {
    console.error(`  zone « ${e.zone} », ligne ${e.ligne} :`);
    console.error(`    lu       : ${e.lu}`);
    console.error(`    attendu  : ${e.attendu}`);
  }
  console.error('\nsortie : node cli/scripts/vitrine.js --write');
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
