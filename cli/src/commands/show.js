// iakaframe show <id> - contrat d'un atome/assemblage. Resout <id> par scan sur toutes les
// collections (I2). Collision d'id -> demande --type. Rend le frontmatter mis en forme + corps.
import { parseArgs } from 'node:util';
import { renderValue } from '../lib/frontmatter.js';
import { COLLECTION_TYPES, collectionOf, libraryRoot, readEntry, resolveId, scan } from '../lib/library.js';
import { peutDemander } from '../lib/interactif.js';
import { selectionner, assemblerArgv, ligneEquivalente } from '../lib/guidage.js';
import { emit, fail, ok } from '../lib/output.js';

const USAGE = `Usage : iakaframe show <id> [options]

Contrat d'un atome/assemblage : resout <id> par scan sur toutes les collections, rend
le frontmatter mis en forme + le corps. Collision d'id -> precisez --type.

Arguments :
  <id>               Identifiant de l'atome/assemblage a afficher

Options :
  --type <collection> Leve l'ambiguite si l'id existe dans plusieurs collections
  --root <dir>       Racine de bibliotheque
  --guide            Mode guide (Lot A) : propose collection puis id, imprime la commande
                     equivalente (echo non desactivable), execute par le chemin normal.
  --json             Sortie machine`;

// --- Guidage (Lot A, --guide) : deux temps (collection PUIS id), assemble et rappelle le CHEMIN
// NORMAL — lecture seule (show n'ecrit jamais rien).
async function runShowGuide({ root, values }) {
  const selType = await selectionner({
    items: COLLECTION_TYPES.map((t) => ({ id: t, label: t })),
    titre: 'Collection :', permettreLibre: false,
  });
  if (selType.type === 'vide' || selType.type === 'annule') { console.log('\nRien a afficher.\n'); return; }
  const type = selType.item.id;

  const ids = scan(type, root).map((e) => e.id);
  const selId = await selectionner({
    items: ids.map((id) => ({ id, label: id })),
    titre: `Id (${type}) :`, permettreLibre: true, libelleLibre: 'saisir un id',
  });
  if (selId.type === 'vide') { console.log(`\nAucun element dans ${type} : rien a afficher.\n`); return; }
  if (selId.type === 'annule') { console.log('\nRien a afficher.\n'); return; }
  const id = selId.type === 'libre' ? selId.valeur : selId.item.id;
  if (!id) { console.log('\nRien a afficher.\n'); return; }

  const suite = [id, '--type', type];
  if (values.root) suite.push('--root', values.root);
  const argvNormal = assemblerArgv(suite);
  console.log(ligneEquivalente(['show', ...argvNormal]));
  await runShow(argvNormal);
}

export async function runShow(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, type: { type: 'string' },
      json: { type: 'boolean', default: false },
      guide: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  const json = values.json;

  const root = libraryRoot(values.root);

  if (values.guide && peutDemander({ json, guide: true })) {
    await runShowGuide({ root, values });
    return;
  }

  const id = positionals[0];
  if (!id) return fail(json, 'Usage : iakaframe show <id> [--type <collection>]');

  if (values.type && !collectionOf(values.type)) {
    return fail(json, `Type inconnu : ${values.type}`, { type: values.type, types: COLLECTION_TYPES }, () => {
      console.error(`Type inconnu : ${values.type}`);
      console.error(`Types valides : ${COLLECTION_TYPES.join(', ')}`);
    });
  }

  const hits = resolveId(id, root, values.type);
  if (hits.length === 0) {
    // Palier 0 (Lot A, refus loquace) : quand --type est fourni, la liste est DERIVEE de scan()
    // (source unique), jamais recopiee. Sans --type, la recherche porte sur toutes les collections
    // — enumerer serait illisible, l'astuce (deja loquace) reste le repere.
    const ids = values.type ? scan(values.type, root).map((e) => e.id) : null;
    return fail(json, `Introuvable : ${id}${values.type ? ` (type ${values.type})` : ''}`, { id, type: values.type || null, ...(ids ? { idsValides: ids } : {}) }, () => {
      console.error(`Introuvable : ${id}${values.type ? ` (type ${values.type})` : ''}`);
      if (ids) console.error(`Ids valides (${values.type}) : ${ids.join(', ')}`);
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
