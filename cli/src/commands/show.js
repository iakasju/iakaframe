// iakaframe show <id> - contrat d'un atome/assemblage. Resout <id> par scan sur toutes les
// collections (I2). Collision d'id -> demande --type. Rend le frontmatter mis en forme + corps.
import { parseArgs } from 'node:util';
import { renderValue } from '../lib/frontmatter.js';
import { COLLECTION_TYPES, collectionOf, libraryRoot, readEntry, resolveId } from '../lib/library.js';
import { emit, fail, ok } from '../lib/output.js';

const USAGE = `Usage : iakaframe show <id> [options]

Contrat d'un atome/assemblage : resout <id> par scan sur toutes les collections, rend
le frontmatter mis en forme + le corps. Collision d'id -> precisez --type.

Arguments :
  <id>               Identifiant de l'atome/assemblage a afficher

Options :
  --type <collection> Leve l'ambiguite si l'id existe dans plusieurs collections
  --root <dir>       Racine de bibliotheque
  --json             Sortie machine`;

export function runShow(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, type: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  const json = values.json;
  const id = positionals[0];
  if (!id) return fail(json, 'Usage : iakaframe show <id> [--type <collection>]');

  const root = libraryRoot(values.root);
  if (values.type && !collectionOf(values.type)) {
    return fail(json, `Type inconnu : ${values.type}`, { type: values.type, types: COLLECTION_TYPES }, () => {
      console.error(`Type inconnu : ${values.type}`);
      console.error(`Types valides : ${COLLECTION_TYPES.join(', ')}`);
    });
  }

  const hits = resolveId(id, root, values.type);
  if (hits.length === 0) {
    return fail(json, `Introuvable : ${id}${values.type ? ` (type ${values.type})` : ''}`, { id, type: values.type || null }, () => {
      console.error(`Introuvable : ${id}${values.type ? ` (type ${values.type})` : ''}`);
      console.error(`Astuce : iakaframe list ${values.type || '<type>'} pour lister les ids.`);
    });
  }
  if (hits.length > 1) {
    return fail(json, `Id ambigu : ${id} present dans plusieurs collections. Precisez --type.`,
      { id, ambiguous: hits.map((h) => `${h.type}/${h.id}`) }, () => {
        console.error(`Id ambigu : ${id} present dans plusieurs collections. Precisez --type.`);
        for (const h of hits) console.error(`  - ${h.type}/${h.id}`);
      });
  }

  const entry = readEntry(hits[0].type, hits[0].id, root);
  if (json) {
    return emit(true, ok({ collection: entry.collection, id: entry.id, path: entry.path, data: entry.data, body: entry.body }));
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
