// iakaframe assemble <method> <team> [binding] - compose un descripteur de kit + controle de
// compatibilite casting ⊇ roles (method.roleKeys ⊆ union des roleKey de la team). Dry-run par
// defaut (Q-3) : n'ecrit rien ; --write materialise kits/<id>.md (non destructif, --force).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { table } from '../lib/table.js';
import { assemble, libraryRoot, serializeKit } from '../lib/library.js';

export function runAssemble(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, binding: { type: 'string' }, node: { type: 'string' },
      write: { type: 'boolean', default: false }, force: { type: 'boolean', default: false },
      ascii: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
    },
  });
  const [methodId, teamId, bindingPos] = positionals;
  if (!methodId || !teamId) {
    console.error('Usage : iakaframe assemble <methodId> <teamId> [bindingId] [--write]');
    process.exitCode = 1; return;
  }
  const root = libraryRoot(values.root);
  const bindingId = values.binding || bindingPos || null;
  const res = assemble(methodId, teamId, bindingId, root, { node: values.node || 'claude' });

  if (res.error) {
    if (values.json) { console.log(JSON.stringify({ ok: false, error: res.error }, null, 2)); }
    else console.error(`Echec : ${res.error}`);
    process.exitCode = 1; return;
  }

  if (!res.ok) {
    if (values.json) {
      console.log(JSON.stringify({ ok: false, orphans: res.orphans, unknownPersonas: res.unknownPersonas }, null, 2));
    } else {
      if (res.orphans.length) {
        console.error(`Incompatible : ${res.orphans.length} rôle(s) requis non couvert(s) et pas de coordinateur pour les absorber.`);
        for (const r of res.orphans) console.error(`  - rôle orphelin : ${r}`);
      }
      if (res.unknownPersonas.length) console.error(`  personas introuvables : ${res.unknownPersonas.join(', ')}`);
    }
    process.exitCode = 1; return;
  }

  if (values.json) { console.log(JSON.stringify(res.descriptor, null, 2)); }
  else {
    const covered = res.methodRoleKeys.filter(r => res.teamRoleKeys.includes(r)).length;
    const rows = [
      ['méthode', res.method.id],
      ['team', res.team.id],
      ['binding', res.binding ? res.binding.id : '(aucun)'],
      ['rôles couverts', `${covered}/${res.methodRoleKeys.length}`],
      ['node', res.descriptor.node],
      ['kit id', res.descriptor.id],
    ];
    if (res.coveredByCoordinator.length) {
      rows.push(['pris par coordinateur', `${res.coveredByCoordinator.join(', ')} (${res.coordinator})`]);
    }
    console.log(table(['champ', 'valeur'], rows, { ascii: values.ascii }));
    for (const w of res.warnings) console.log(`⚠ ${w}`);
    console.log('\nDescripteur de kit :');
    console.log(JSON.stringify(res.descriptor, null, 2));
  }

  if (values.write) {
    const dest = path.join(root, 'kits', `${res.descriptor.id}.md`);
    if (fs.existsSync(dest) && !values.force) {
      console.error(`\n${dest} existe déjà, --force pour remplacer.`);
      process.exitCode = 1; return;
    }
    // Sortie alignee byte-a-byte sur @iakaframe/core (serializeKitMd) : quoting des listes,
    // emits en globs, id <methodId>-<node>. Ancre de parite : cli/test/parity-kit.test.js.
    const fm = serializeKit(res.descriptor);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fm);
    console.log(`\n+ kit écrit : ${dest}`);
  }
}
