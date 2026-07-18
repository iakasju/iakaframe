// iakaframe open - GESTE AGNOSTIQUE de chargement du canon a l'ouverture d'une session (T3, § 5.1).
// Emet le contenu du canon UNIQUE (PROFIL.md + REGISTRE.md + rappel du reservoir), pret a etre injecte
// au demarrage d'une session, INDEPENDAMMENT du cwd/scope. Chargeable A LA MAIN, sans aucun runner :
// le canon ignore les runners (le branchement runner vit dans le binding mince, cli/bindings/). La
// resolution du chemin (--home > IAKA_MEMORY_HOME > ~/.iaka/memory/) est celle de T1 (lib/memory.js).
// Reference : specs/instructions/boucle-apprentissage-incrementale.md.
import { parseArgs } from 'node:util';
import { resolveMemoryHome } from '../lib/memory.js';
import { loadCanon, renderCanon } from '../lib/open.js';
import { emit, fail, ok } from '../lib/output.js';

const USAGE = `Usage : iakaframe open [options]

Charge le canon UNIQUE du portefeuille (PROFIL.md + REGISTRE.md) et l'emet, pret a
etre injecte au demarrage d'une session — QUEL QUE SOIT le repertoire courant, EN PLUS
de la memoire par scope du runner (§ 5.1). Scope-agnostique ; chargeable a la main sans
aucun runner. Lecture seule : n'ecrit ni ne cree rien. Canon vide -> sortie gracieuse.

Options :
  --home <dir>   Force le chemin du canon (sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/)
  --json         Sortie machine structuree ({ profil, registre, pending, ... })`;

export function runOpen(argv) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv, allowPositionals: false,
      options: { home: { type: 'string' }, json: { type: 'boolean', default: false } },
    }));
  } catch (e) { return fail(false, e.message); }
  const json = values.json;

  let home;
  try { home = resolveMemoryHome(values.home); }
  catch (e) { return fail(json, e.message); }

  const canon = loadCanon(home);

  // loadCanon renvoie deja { ok:true, home, empty, profil, registre, pending } (champs a plat).
  emit(json, ok(canon), () => process.stdout.write(renderCanon(canon)));
}
