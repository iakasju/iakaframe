// iakaframe show <id> - contrat d'un atome/assemblage. Resout <id> par scan sur toutes les
// collections (I2). Collision d'id -> demande --type. Rend le frontmatter mis en forme + corps.
import { parseArgs } from 'node:util';
import { renderValue } from '../lib/frontmatter.js';
import { COLLECTION_TYPES, collectionOf, libraryRoot, readEntry, resolveId } from '../lib/library.js';

export function runShow(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, type: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
  });
  const id = positionals[0];
  if (!id) { console.error('Usage : iakaframe show <id> [--type <collection>]'); process.exitCode = 1; return; }

  const root = libraryRoot(values.root);
  if (values.type && !collectionOf(values.type)) {
    console.error(`Type inconnu : ${values.type}`);
    console.error(`Types valides : ${COLLECTION_TYPES.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const hits = resolveId(id, root, values.type);
  if (hits.length === 0) {
    console.error(`Introuvable : ${id}${values.type ? ` (type ${values.type})` : ''}`);
    console.error(`Astuce : iakaframe list ${values.type || '<type>'} pour lister les ids.`);
    process.exitCode = 1;
    return;
  }
  if (hits.length > 1) {
    console.error(`Id ambigu : ${id} present dans plusieurs collections. Precisez --type.`);
    for (const h of hits) console.error(`  - ${h.type}/${h.id}`);
    process.exitCode = 1;
    return;
  }

  const entry = readEntry(hits[0].type, hits[0].id, root);
  if (values.json) {
    console.log(JSON.stringify({ collection: entry.collection, id: entry.id, path: entry.path, data: entry.data, body: entry.body }, null, 2));
    return;
  }

  console.log(`${entry.collection} · ${entry.id}`);
  console.log('─'.repeat(Math.min(60, `${entry.collection} · ${entry.id}`.length)));
  const keys = Object.keys(entry.data);
  const pad = Math.max(0, ...keys.map(k => k.length));
  for (const k of keys) {
    const rendered = renderValue(entry.data[k]);
    if (rendered.includes('\n')) {
      console.log(`${k.padEnd(pad)} :`);
      for (const l of rendered.split('\n')) console.log(`  ${l}`);
    } else {
      console.log(`${k.padEnd(pad)} : ${rendered}`);
    }
  }
  console.log('');
  console.log(entry.body);
}
