// iakaframe list [type] - inventaire du pool + assemblages PAR SCAN (invariant I2). La commande =
// parsing des args + delegation a lib/library.js (inventory/scan) + rendu via lib/output.js. Sans
// type : resume des 13 collections. Avec type : ids + libelles tries. Sortie machine C-JSON (§ 2) :
//   list --json        -> { ok, count, collections:[{collection,count,ids}], root }
//   list <type> --json -> { ok, count, items:[{id,label,path}], root, type }
import { parseArgs } from 'node:util';
import { table } from '../lib/table.js';
import { COLLECTION_TYPES, collectionOf, inventory, libraryRoot, scan } from '../lib/library.js';
import { collection, emit, fail } from '../lib/output.js';

const USAGE = `Usage : iakaframe list [type] [options]

Inventaire de la bibliotheque (pool + assemblages) par scan. Sans type : resume des
collections. Avec type : ids + libelles tries.

Arguments :
  [type]             personas | skills | principles | rituals | guardrails | roles |
                     workflows | scaffolds | teams | methods | bindings | kits

Options :
  --root <dir>       Racine de bibliotheque
  --ascii            Tableau en ASCII pur (sans box-drawing)
  --json             Sortie machine`;

export function runList(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, ascii: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  const root = libraryRoot(values.root);
  const type = positionals[0];

  if (type && !collectionOf(type)) {
    return fail(values.json, `Type inconnu : ${type}`, { type, types: COLLECTION_TYPES }, () => {
      console.error(`Type inconnu : ${type}`);
      console.error(`Types valides : ${COLLECTION_TYPES.join(', ')}`);
    });
  }

  if (!type) {
    const collections = inventory(root);
    return emit(values.json, collection('collections', collections, { root }), () => {
      const rows = collections.map((s) => [
        s.collection,
        String(s.count),
        s.ids.slice(0, 4).join(', ') + (s.ids.length > 4 ? ', …' : ''),
      ]);
      console.log(table(['Collection', 'Nb', "Aperçu d'ids"], rows, { ascii: values.ascii }));
    });
  }

  const items = scan(type, root);
  emit(values.json, collection('items', items, { root, type }), () => {
    const rows = items.map((e) => [e.id, e.label]);
    console.log(table(['id', 'libellé'], rows.length ? rows : [['(vide)', '']], { ascii: values.ascii }));
    console.log(`Total ${type} : ${items.length}`);
  });
}
