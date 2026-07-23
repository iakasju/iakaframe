// iakaframe assemble <method> <team> [binding] - compose un descripteur de kit + controle de
// compatibilite casting ⊇ roles (method.roleKeys ⊆ union des roleKey de la team). Dry-run par
// defaut (Q-3) : n'ecrit rien ; --write materialise kits/<id>.md (non destructif, --force).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { table } from '../lib/table.js';
import { assemble, libraryRoot, serializeKit } from '../lib/library.js';
import { parseFrontmatter } from '../lib/frontmatter.js';
import { emit, fail, ok, printJson } from '../lib/output.js';

export function runAssemble(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, binding: { type: 'string' }, node: { type: 'string' },
      write: { type: 'boolean', default: false }, force: { type: 'boolean', default: false },
      ascii: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  const [methodId, teamId, bindingPos] = positionals;
  if (!methodId || !teamId) {
    return fail(json, 'Usage : iakaframe assemble <methodId> <teamId> [bindingId] [--write]');
  }
  const root = libraryRoot(values.root);
  const bindingId = values.binding || bindingPos || null;
  const res = assemble(methodId, teamId, bindingId, root, { node: values.node || 'claude' });

  if (res.error) {
    return fail(json, res.error, undefined, () => console.error(`Echec : ${res.error}`));
  }

  if (!res.ok) {
    // Incompatibilite casting : message d'erreur + diagnostic (orphans / personas introuvables).
    const parts = [];
    if (res.orphans.length) parts.push(`${res.orphans.length} rôle(s) requis non couvert(s) et pas de coordinateur pour les absorber`);
    if (res.unknownPersonas.length) parts.push(`personas introuvables : ${res.unknownPersonas.join(', ')}`);
    const message = `Incompatible : ${parts.join(' ; ') || 'casting incompatible'}`;
    return fail(json, message, { orphans: res.orphans, unknownPersonas: res.unknownPersonas }, () => {
      if (res.orphans.length) {
        console.error(`Incompatible : ${res.orphans.length} rôle(s) requis non couvert(s) et pas de coordinateur pour les absorber.`);
        for (const r of res.orphans) console.error(`  - rôle orphelin : ${r}`);
      }
      if (res.unknownPersonas.length) console.error(`  personas introuvables : ${res.unknownPersonas.join(', ')}`);
    });
  }

  // Ecriture (--write) : materialisee AVANT l'emission du descripteur pour qu'un refus (cible
  // existante sans --force) sorte proprement en erreur C-JSON, sans double impression sur stdout.
  if (values.write) {
    const dest = path.join(root, 'kits', `${res.descriptor.id}.md`);
    if (fs.existsSync(dest) && !values.force) {
      return fail(json, `${dest} existe déjà, --force pour remplacer.`, { dest },
        () => console.error(`\n${dest} existe déjà, --force pour remplacer.`));
    }
    // Sortie alignee byte-a-byte sur @iakaframe/core (serializeKitMd) : quoting des listes,
    // emits en globs, id <methodId>-<node>. Ancre de parite : cli/test/parity-kit.test.js.
    // PRESERVATION DU CORPS AUTHORED : si la cible existe deja, on RETHREADE son corps (le
    // frontmatter est reserialise depuis le descripteur, mais le corps Manifeste authored survit).
    // Ceci neutralise le bug --force destructif (serializeKit ne rend plus un stub qui ecraserait
    // le canon) : --write --force sur kits/<id>.md devient un no-op byte-exact. Cible absente ->
    // corps par defaut (stub `# Kit <id>`), comportement inchange pour un kit tout neuf.
    const body = fs.existsSync(dest)
      ? parseFrontmatter(fs.readFileSync(dest, 'utf8')).body
      : undefined;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, body === undefined
      ? serializeKit(res.descriptor)
      : serializeKit(res.descriptor, body));
  }

  // Succes (rupture § 8) : enveloppe { ok:true, descriptor:{...} } au lieu du descripteur nu.
  emit(json, ok({ descriptor: res.descriptor }), () => {
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
    printJson(res.descriptor);
    if (values.write) console.log(`\n+ kit écrit : ${path.join(root, 'kits', `${res.descriptor.id}.md`)}`);
  });
}
