// iakaframe list [type] - inventaire du pool + assemblages PAR SCAN (invariant I2). Sans type :
// resume des 12 collections. Avec type : ids + libelles tries. --json emet la donnee brute.
import { parseArgs } from 'node:util';
import { table } from '../lib/table.js';
import { COLLECTIONS, COLLECTION_TYPES, collectionOf, libraryRoot, scan } from '../lib/library.js';

export function runList(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, ascii: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
    },
  });
  const root = libraryRoot(values.root);
  const type = positionals[0];

  if (type && !collectionOf(type)) {
    console.error(`Type inconnu : ${type}`);
    console.error(`Types valides : ${COLLECTION_TYPES.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  if (!type) {
    const summary = COLLECTIONS.map(c => {
      const entries = scan(c.type, root);
      const ids = entries.map(e => e.id);
      return { collection: c.type, count: ids.length, ids };
    });
    if (values.json) { console.log(JSON.stringify(summary, null, 2)); return; }
    const rows = summary.map(s => [
      s.collection,
      String(s.count),
      s.ids.slice(0, 4).join(', ') + (s.ids.length > 4 ? ', …' : ''),
    ]);
    console.log(table(['Collection', 'Nb', "Aperçu d'ids"], rows, { ascii: values.ascii }));
    return;
  }

  const entries = scan(type, root);
  if (values.json) { console.log(JSON.stringify(entries, null, 2)); return; }
  const rows = entries.map(e => [e.id, e.label]);
  console.log(table(['id', 'libellé'], rows.length ? rows : [['(vide)', '']], { ascii: values.ascii }));
  console.log(`Total ${type} : ${entries.length}`);
}
